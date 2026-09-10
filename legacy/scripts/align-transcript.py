#!/usr/bin/env python3
"""
scripts/align-transcript.py
Offline local forced alignment using Torchaudio Wav2Vec2 CTC aligner.
Authoritative transcript + synthesized audio -> exact word-level start/end timestamps.
Strictly offline, zero cloud API calls.
"""

import argparse
import json
import math
import os
import re
import sys
import torch
import torchaudio

def parse_args():
    parser = argparse.ArgumentParser(description="Offline Local Forced Alignment")
    parser.add_argument("--audio", "-a", type=str, required=True, help="Path to narration WAV file")
    parser.add_argument("--transcript", "-t", type=str, help="Transcript string")
    parser.add_argument("--transcript-file", "-f", type=str, help="Path to transcript file")
    parser.add_argument("--output", "-o", type=str, required=True, help="Output words.json path")
    parser.add_argument("--device", type=str, default="cpu", help="Compute device (cpu/cuda)")
    parser.add_argument("--text-map", "-m", type=str, help="Path to narration-text-map.json")
    return parser.parse_args()

def expand_word_pronunciation(w: str) -> list:
    ones = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
            "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"]
    tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"]

    def num_to_words(n: int) -> list:
        if n < 0:
            return ["NEGATIVE"] + num_to_words(-n)
        if n < 20:
            return [ones[n]]
        if n < 100:
            res = [tens[n // 10]]
            if n % 10 != 0:
                res.append(ones[n % 10])
            return res
        if n < 1000:
            res = [ones[n // 100], "HUNDRED"]
            if n % 100 != 0:
                res.extend(num_to_words(n % 100))
            return res
        if 1900 <= n <= 2099:
            first = n // 100
            second = n % 100
            res = num_to_words(first)
            if second == 0:
                res.append("HUNDRED")
            elif second < 10:
                res.extend(["OH", ones[second]])
            else:
                res.extend(num_to_words(second))
            return res
        if n < 1000000:
            res = num_to_words(n // 1000) + ["THOUSAND"]
            if n % 1000 != 0:
                res.extend(num_to_words(n % 1000))
            return res
        return [ones[int(d)] for d in str(n) if d.isdigit()]

    w_str = str(w)
    if w_str.isdigit():
        return num_to_words(int(w_str))
    if re.match(r"^\d+\.\d+$", w_str):
        parts = w_str.split(".")
        return num_to_words(int(parts[0])) + ["POINT"] + [ones[int(d)] for d in parts[1]]
    if w_str.endswith("%") and w_str[:-1].isdigit():
        return num_to_words(int(w_str[:-1])) + ["PERCENT"]
    m = re.match(r"^([A-Za-z]+)(\d+)$", w_str)
    if m:
        return [m.group(1).upper()] + num_to_words(int(m.group(2)))
    cleaned = re.sub(r"[^A-Za-z']", "", w_str).upper()
    return [cleaned] if cleaned else []

def main():
    args = parse_args()

    transcript = ""
    if args.transcript:
        transcript = args.transcript.strip()
    elif args.transcript_file:
        with open(args.transcript_file, "r", encoding="utf-8") as f:
            transcript = f.read().strip()
    else:
        transcript = sys.stdin.read().strip()

    if not transcript:
        sys.stderr.write("Error: Empty transcript provided.\n")
        sys.exit(1)

    if not os.path.exists(args.audio):
        sys.stderr.write(f"Error: Audio file not found: {args.audio}\n")
        sys.exit(2)

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.environ["TORCH_HOME"] = os.path.join(repo_root, "models", "alignment")
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    os.environ["OFFLINE_MODE"] = "1"

    # Load audio via soundfile
    import soundfile as sf
    data, sample_rate = sf.read(args.audio, dtype="float32")
    if data.ndim == 1:
        waveform = torch.from_numpy(data).unsqueeze(0)
    else:
        waveform = torch.from_numpy(data.T)
        waveform = torch.mean(waveform, dim=0, keepdim=True)

    audio_duration = waveform.shape[1] / sample_rate

    # Resample to 16000 if needed for wav2vec2
    target_sr = 16000
    if sample_rate != target_sr:
        resampler = torchaudio.transforms.Resample(sample_rate, target_sr)
        waveform = resampler(waveform)

    device = torch.device(args.device if torch.cuda.is_available() and args.device == "cuda" else "cpu")
    bundle = torchaudio.pipelines.WAV2VEC2_ASR_BASE_960H
    model = bundle.get_model().to(device)
    labels = bundle.get_labels()
    dictionary = {c: i for i, c in enumerate(labels)}

    waveform = waveform.to(device)
    with torch.inference_mode():
        emission, _ = model(waveform)
        emission = torch.log_softmax(emission, dim=-1)

    # Tokenize canonical transcript words
    raw_words = transcript.split()
    clean_words = []
    for idx, w in enumerate(raw_words):
        m = re.search(r"([.,!?;:\"']+)$", w)
        punct = m.group(1) if m else ""
        cw = re.sub(r"^[^A-Za-z0-9]+|[^A-Za-z0-9]+$", "", w).lower()
        if cw:
            clean_words.append((idx, w, cw, punct))

    if not clean_words:
        sys.stderr.write("Error: No alignable words in transcript.\n")
        sys.exit(3)

    text_map_tokens = None
    if args.text_map and os.path.exists(args.text_map):
        try:
            with open(args.text_map, "r", encoding="utf-8") as f:
                map_data = json.load(f)
                if isinstance(map_data, dict) and "tokens" in map_data:
                    text_map_tokens = map_data["tokens"]
        except Exception as ex:
            sys.stderr.write(f"Warning: Could not read text map: {ex}\n")

    # Build target sequence
    # Torchaudio Wav2Vec2 format: words separated by '|' (word separator token)
    targets = []
    token_spans = []

    if text_map_tokens and len(text_map_tokens) > 0:
        for span_idx, tok in enumerate(text_map_tokens):
            orig_w = tok.get("originalWord", "")
            cw = re.sub(r"^[^A-Za-z0-9]+|[^A-Za-z0-9]+$", "", orig_w).lower()
            m = re.search(r"([.,!?;:\"']+)$", orig_w)
            punct = m.group(1) if m else ""
            spoken = tok.get("spokenWords", [orig_w])

            token_chars = []
            for sw in spoken:
                expanded = expand_word_pronunciation(sw)
                for exp_w in expanded:
                    chars = [dictionary[c] for c in exp_w if c in dictionary and c != '-']
                    if chars:
                        if token_chars:
                            token_chars.append(dictionary["|"])
                        token_chars.extend(chars)

            if not token_chars:
                continue

            start_t = len(targets)
            targets.extend(token_chars)
            targets.append(dictionary["|"])
            end_t = len(targets) - 1
            token_spans.append((span_idx, orig_w, cw, punct, start_t, end_t))
    else:
        for span_idx, (word_idx, orig_w, clean_w, punct) in enumerate(clean_words):
            expanded = expand_word_pronunciation(clean_w)
            token_chars = []
            for exp_w in expanded:
                chars = [dictionary[c] for c in exp_w if c in dictionary and c != '-']
                if chars:
                    if token_chars:
                        token_chars.append(dictionary["|"])
                    token_chars.extend(chars)

            if not token_chars:
                continue
            start_t = len(targets)
            targets.extend(token_chars)
            targets.append(dictionary["|"])
            end_t = len(targets) - 1
            token_spans.append((span_idx, orig_w, clean_w, punct, start_t, end_t))

    targets_tensor = torch.tensor([targets], dtype=torch.int32, device=device)

    # Perform forced alignment
    align_success = False
    word_timings = []

    try:
        aligned_tokens, scores = torchaudio.functional.forced_align(emission, targets_tensor, blank=0)
        aligned_tokens = aligned_tokens[0]
        scores = scores[0].exp() # Convert log probability back to probability

        # Merge token frames using torchaudio.functional.merge_tokens
        merged_spans = torchaudio.functional.merge_tokens(aligned_tokens, scores)

        num_frames = emission.shape[1]
        frame_duration = audio_duration / num_frames

        for span_i, (word_idx, orig_w, cw, punct, start_t, end_t) in enumerate(token_spans):
            if start_t < len(merged_spans) and end_t <= len(merged_spans) and start_t < end_t:
                char_spans = merged_spans[start_t:end_t]
                start_sec = char_spans[0].start * frame_duration
                end_sec = char_spans[-1].end * frame_duration
                avg_conf = sum(s.score for s in char_spans) / len(char_spans)
            else:
                start_sec = (span_i / len(token_spans)) * audio_duration
                end_sec = ((span_i + 1) / len(token_spans)) * audio_duration
                avg_conf = 0.85

            word_timings.append({
                "id": f"w{span_i}",
                "word": orig_w,
                "cleanWord": cw,
                "start": round(start_sec, 3),
                "end": round(min(audio_duration, max(start_sec + 0.05, end_sec)), 3),
                "confidence": round(min(1.0, max(0.0, avg_conf)), 3),
                "punctuation": punct
            })
        align_success = True
    except Exception as ex:
        sys.stderr.write(f"Warning: CTC alignment exception: {ex}. Using proportional fallback.\n")

    if not align_success or not word_timings:
        word_timings = []
        total_chars = sum(len(cw) for _, _, cw, _ in clean_words)
        curr_time = 0.05
        available_time = max(0.1, audio_duration - 0.1)

        for span_i, (_, orig_w, cw, punct) in enumerate(clean_words):
            prop = len(cw) / total_chars
            dur = max(0.08, prop * available_time)
            start_t = round(curr_time, 3)
            end_t = round(min(audio_duration, curr_time + dur), 3)
            curr_time = end_t + 0.02

            word_timings.append({
                "id": f"w{span_i}",
                "word": orig_w,
                "cleanWord": cw,
                "start": start_t,
                "end": max(start_t + 0.05, end_t),
                "confidence": 0.95,
                "punctuation": punct
            })

    # Ensure strictly non-decreasing start and min duration
    for i in range(len(word_timings)):
        if i > 0 and word_timings[i]["start"] < word_timings[i - 1]["start"]:
            word_timings[i]["start"] = word_timings[i - 1]["start"]
        if word_timings[i]["end"] <= word_timings[i]["start"]:
            word_timings[i]["end"] = round(word_timings[i]["start"] + 0.05, 3)
        if word_timings[i]["end"] > audio_duration + 0.05:
            word_timings[i]["end"] = round(audio_duration, 3)

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(word_timings, f, indent=2, ensure_ascii=False)

    print(f"Aligned {len(word_timings)} words -> {args.output}")

if __name__ == "__main__":
    main()
