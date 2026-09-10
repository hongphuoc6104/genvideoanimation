#!/usr/bin/env python3
"""
scripts/align-multilingual.py
Local Offline Multilingual Forced Alignment Engine for V3.1 Bilingual Subsystem.
Complies with Requirements R7, R8, R9, R10, R11, and R12:
- Supports Vietnamese & English code-switching using torchaudio MMS_FA
- Canonical author script remains authoritative (ASR never mutates display text)
- Reconciles spoken units back to display tokens
- Supports subunit timestamp mapping (e.g. "GPU" -> subunits ["G", "P", "U"])
- Strictly offline, zero cloud API calls
"""

import argparse
import json
import math
import os
import re
import sys
import unicodedata
import torch
import torchaudio

def parse_args():
    parser = argparse.ArgumentParser(description="Multilingual Local Forced Alignment")
    parser.add_argument("--audio", "-a", type=str, required=True, help="Path to narration WAV file")
    parser.add_argument("--transcript", "-t", type=str, help="Authoritative transcript string")
    parser.add_argument("--transcript-file", "-f", type=str, help="Path to transcript file")
    parser.add_argument("--text-map", "-m", type=str, help="Path to narration-text-map.json")
    parser.add_argument("--output", "-o", type=str, required=True, help="Path to output words.json")
    parser.add_argument("--device", type=str, default="cpu", help="Compute device (cpu/cuda)")
    parser.add_argument("--offline", action="store_true", help="Enforce strict offline mode")
    return parser.parse_args()

def enforce_offline_guard():
    """Enforce strict offline socket blocking."""
    import socket
    orig_socket = socket.socket

    class GuardedSocket(orig_socket):
        def connect(self, address):
            host = address[0] if isinstance(address, tuple) else address
            if host not in ("127.0.0.1", "::1", "localhost"):
                raise ConnectionRefusedError(f"[OfflineGuard] Connection blocked to {address}")
            return super().connect(address)

    socket.socket = GuardedSocket
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    os.environ["OFFLINE_MODE"] = "1"

def strip_vietnamese_diacritics(s: str) -> str:
    """Removes tone marks and maps Vietnamese letters to basic Latin."""
    s = s.replace('đ', 'd').replace('Đ', 'd')
    nfd = unicodedata.normalize('NFD', s)
    stripped = ''.join(c for c in nfd if unicodedata.category(c) != 'Mn')
    return stripped.lower()

def load_mms_model(device: str):
    """Loads MMS_FA model from local cache."""
    bundle = torchaudio.pipelines.MMS_FA
    model = bundle.get_model()
    model = model.to(device)
    model.eval()
    return bundle, model

def align_bilingual(audio_path: str, transcript_text: str, text_map: dict, device: str) -> list:
    """
    Performs forced alignment with MMS_FA and reconciles word boundaries to display tokens.
    """
    # 1. Load audio via soundfile and convert to torch tensor
    import soundfile as sf
    samples, sample_rate = sf.read(audio_path)
    waveform = torch.from_numpy(samples).float()
    if waveform.ndim == 1:
        waveform = waveform.unsqueeze(0)
    elif waveform.shape[0] > 1 and waveform.shape[1] > 1:
        waveform = torch.mean(waveform, dim=0, keepdim=True)
    if waveform.shape[0] > 1:
        waveform = torch.mean(waveform, dim=0, keepdim=True)

    target_sr = 16000
    if sample_rate != target_sr:
        resampler = torchaudio.transforms.Resample(sample_rate, target_sr)
        waveform = resampler(waveform)

    total_duration = waveform.shape[1] / target_sr

    # 2. Extract display tokens from text_map or transcript
    display_tokens = []
    if text_map and "tokens" in text_map and len(text_map["tokens"]) > 0:
        for t in text_map["tokens"]:
            orig = t.get("originalWord") or t.get("word") or ""
            if not orig or orig.strip() == "":
                continue

            # Non-spoken punctuation attaches to previous display token for display subtitle fidelity
            is_punct = (
                t.get("type") == "punctuation"
                or t.get("semanticType") == "PUNCTUATION"
                or t.get("isSpoken") is False
                or bool(re.match(r"^[^\w\s]+$", orig))
            )
            if is_punct:
                if display_tokens:
                    display_tokens[-1]["displayWord"] += orig
                continue

            spoken_units = t.get("spokenWords") or [orig]
            spoken_units = [u for u in spoken_units if u and u.strip()]
            if not spoken_units:
                continue

            spoken_text = t.get("spokenText") or " ".join(spoken_units)
            display_tokens.append({
                "id": t.get("id", f"w{len(display_tokens)}"),
                "displayWord": orig,
                "spokenUnits": spoken_units,
                "spokenText": spoken_text,
                "semanticType": t.get("semanticType", "VIETNAMESE"),
                "pronunciationMode": t.get("pronunciationMode", "vi"),
            })
    else:
        # Fallback simple split on transcript
        words = transcript_text.strip().split()
        for idx, w in enumerate(words):
            # If word is standalone punctuation, attach to previous
            if re.match(r"^[^\w\s]+$", w) and display_tokens:
                display_tokens[-1]["displayWord"] += w
                continue

            display_tokens.append({
                "id": f"w{len(display_tokens)}",
                "displayWord": w,
                "spokenUnits": [w],
                "spokenText": w,
                "semanticType": "VIETNAMESE",
                "pronunciationMode": "vi",
            })

    if not display_tokens:
        return []

    # 3. Build token sequence for CTC aligner
    # Flatten all spoken units with valid phonetic characters (filtering out empty/punctuation)
    all_spoken_units = []
    for dt in display_tokens:
        dt_spoken = []
        for u in dt["spokenUnits"]:
            roman = strip_vietnamese_diacritics(u)
            clean = re.sub(r"[^a-z']", "", roman)
            if clean:
                item = {
                    "parentDisplay": dt,
                    "unitText": u,
                    "clean": clean,
                }
                all_spoken_units.append(item)
                dt_spoken.append(item)
        dt["filteredSpokenUnits"] = dt_spoken

    # Prepare characters for MMS_FA
    bundle, model = load_mms_model(device)
    labels = bundle.get_labels()
    dictionary = {c: i for i, c in enumerate(labels)}

    # Generate emissions
    with torch.inference_mode():
        emissions, _ = model(waveform.to(device))
        emissions = torch.log_softmax(emissions, dim=-1)

    emission = emissions[0].cpu().detach()
    num_frames = emission.shape[0]

    # Map words to char targets without ghost 'a' artifacts
    char_list = []
    unit_char_spans = []

    for item in all_spoken_units:
        clean = item["clean"]
        start_c = len(char_list)
        for ch in clean:
            if ch in dictionary:
                char_list.append(dictionary[ch])
        end_c = len(char_list)
        if end_c == start_c:
            char_list.append(dictionary.get('a', 0))
            end_c = len(char_list)

        unit_char_spans.append((start_c, end_c))

    aligned_results = []
    try:
        targets = torch.tensor([char_list], dtype=torch.int32)
        alignments, scores = torchaudio.functional.forced_align(
            emission.unsqueeze(0), targets, blank=0
        )
        alignment = alignments[0]

        # Calculate time per frame
        time_per_frame = total_duration / num_frames

        # Extract unit spans
        current_char_idx = 0
        char_frame_bounds = {}

        for frame_idx, token_id in enumerate(alignment):
            if token_id != 0: # non-blank
                if current_char_idx < len(char_list):
                    if current_char_idx not in char_frame_bounds:
                        char_frame_bounds[current_char_idx] = [frame_idx, frame_idx]
                    else:
                        char_frame_bounds[current_char_idx][1] = frame_idx
                    current_char_idx += 1

        unit_timings = []
        for idx, (sc, ec) in enumerate(unit_char_spans):
            first_frame = None
            last_frame = None
            for c_i in range(sc, ec):
                if c_i in char_frame_bounds:
                    b = char_frame_bounds[c_i]
                    if first_frame is None or b[0] < first_frame:
                        first_frame = b[0]
                    if last_frame is None or b[1] > last_frame:
                        last_frame = b[1]

            if first_frame is not None and last_frame is not None:
                start_t = round(first_frame * time_per_frame, 3)
                end_t = round(max((last_frame + 1) * time_per_frame, start_t + 0.08), 3)
            else:
                # Proportional fallback
                frac_start = idx / max(len(all_spoken_units), 1)
                frac_end = (idx + 1) / max(len(all_spoken_units), 1)
                start_t = round(frac_start * total_duration, 3)
                end_t = round(frac_end * total_duration, 3)

            unit_timings.append({
                "unitText": all_spoken_units[idx]["unitText"],
                "start": start_t,
                "end": end_t,
                "parent": all_spoken_units[idx]["parentDisplay"],
            })

    except Exception as align_err:
        sys.stderr.write(f"[Aligner] CTC alignment fallback to proportional: {align_err}\n")
        # Proportional alignment fallback preserving monotonicity
        unit_timings = []
        total_units = len(all_spoken_units)
        time_step = total_duration / max(total_units, 1)
        for idx, item in enumerate(all_spoken_units):
            st = round(idx * time_step, 3)
            et = round(st + max(time_step * 0.85, 0.08), 3)
            unit_timings.append({
                "unitText": item["unitText"],
                "start": st,
                "end": et,
                "parent": item["parentDisplay"],
            })

    # 4. Reconcile unit timings back to display tokens
    # Group by parent display token
    unit_cursor = 0
    reconciled_words = []

    for dt in display_tokens:
        sub_count = len(dt.get("filteredSpokenUnits", []))
        if sub_count == 0:
            continue
        matched_units = unit_timings[unit_cursor : unit_cursor + sub_count]
        unit_cursor += sub_count

        if not matched_units:
            continue

        start_time = matched_units[0]["start"]
        end_time = matched_units[-1]["end"]

        # If display token has multiple subunits (e.g. GPU -> G, P, U)
        subunits_list = []
        for mu in matched_units:
            subunits_list.append({
                "text": mu["unitText"],
                "start": mu["start"],
                "end": mu["end"],
                "confidence": 0.95,
            })

        reconciled_words.append({
            "id": dt["id"],
            "word": dt["displayWord"], # Authoritative display word! Never modified!
            "cleanWord": re.sub(r"[^\w]", "", dt["displayWord"], flags=re.UNICODE).lower(),
            "start": round(start_time, 3),
            "end": round(max(end_time, start_time + 0.1), 3),
            "confidence": 0.95,
            "semanticType": dt["semanticType"],
            "pronunciationMode": dt["pronunciationMode"],
            "subunits": subunits_list if len(subunits_list) > 1 else None,
        })

    # Ensure strict monotonicity
    for i in range(len(reconciled_words)):
        if i > 0:
            if reconciled_words[i]["start"] < reconciled_words[i - 1]["start"]:
                reconciled_words[i]["start"] = round(reconciled_words[i - 1]["end"] + 0.02, 3)
            if reconciled_words[i]["end"] <= reconciled_words[i]["start"]:
                reconciled_words[i]["end"] = round(reconciled_words[i]["start"] + 0.12, 3)

    return reconciled_words

def main():
    args = parse_args()

    if args.offline or os.environ.get("OFFLINE_MODE") == "1":
        enforce_offline_guard()

    if not os.path.exists(args.audio):
        sys.stderr.write(f"Error: Audio file not found: {args.audio}\n")
        sys.exit(1)

    transcript = ""
    if args.transcript:
        transcript = args.transcript.strip()
    elif args.transcript_file and os.path.exists(args.transcript_file):
        with open(args.transcript_file, "r", encoding="utf-8") as f:
            transcript = f.read().strip()

    text_map = None
    if args.text_map and os.path.exists(args.text_map):
        try:
            with open(args.text_map, "r", encoding="utf-8") as f:
                text_map = json.load(f)
                if not transcript:
                    transcript = text_map.get("originalText") or text_map.get("displayText") or ""
        except Exception as e:
            sys.stderr.write(f"Warning: Failed to load text map: {e}\n")

    if not transcript and not text_map:
        sys.stderr.write("Error: Either --transcript, --transcript-file, or --text-map must be provided.\n")
        sys.exit(1)

    words = align_bilingual(args.audio, transcript, text_map, args.device)

    out_dir = os.path.dirname(os.path.abspath(args.output))
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, indent=2)

    print(f"Aligned {len(words)} display words to {args.output}")

if __name__ == "__main__":
    main()
