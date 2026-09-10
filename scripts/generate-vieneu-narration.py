#!/usr/bin/env python3
"""
scripts/generate-vieneu-narration.py

Local Offline VieNeu-TTS v3 Turbo Synthesizer with Genvideo Voice Parity Chain.
Supports both single-line and batch-mode narration builds with:
- One-time VieNeu model loading across all takes
- Explicit synthesis parameters (mode=v3turbo, voice=Adam, backend=onnx, device=cpu, precision=fp32, temp=0.65, silenceP=0.05)
- Take-cache fingerprinting (spoken text + voice params)
- Genvideo Audio Chain: GAP_CHAIN (0.13s pause cap) -> atempo -> VOICE_CHAIN -> Loudness Normalization (-15.0 LUFS, <= -1.8 dBTP)
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
import wave
from pathlib import Path

import numpy as np

CREATE_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)
SR = 48000

# Authoritative Genvideo Voice Profile Constants
INTERNAL_PAUSE_CAP = 0.13
GAP_CHAIN = (
    "silenceremove=start_periods=1:start_duration=0:start_threshold=-50dB:detection=peak,"
    "areverse,"
    "silenceremove=start_periods=1:start_duration=0:start_threshold=-50dB:detection=peak,"
    "areverse,"
    f"silenceremove=stop_periods=-1:stop_duration={INTERNAL_PAUSE_CAP}:stop_threshold=-45dB:detection=peak"
)

VOICE_CHAIN = (
    "highpass=f=75,"
    "equalizer=f=130:t=q:w=0.9:g=3.2,"
    "equalizer=f=390:t=q:w=1.1:g=-2.5,"
    "equalizer=f=2800:t=q:w=1.2:g=1.8,"
    "equalizer=f=6500:t=q:w=1.6:g=-2.0,"
    "acompressor=threshold=-24dB:ratio=4:attack=5:release=80:makeup=3.8,"
    "alimiter=limit=0.92:level=disabled"
)

TARGET_LUFS = -15.0
TARGET_TP = -1.8
TARGET_LRA = 7

ROLE_DEFAULTS = {
    "hook":     {"speed": 1.08, "pauseAfter": 0.20},
    "thesis":   {"speed": 1.08, "pauseAfter": 0.18},
    "body":     {"speed": 1.08, "pauseAfter": 0.16},
    "turn":     {"speed": 1.10, "pauseAfter": 0.22},
    "evidence": {"speed": 1.08, "pauseAfter": 0.16},
    "payoff":   {"speed": 1.08, "pauseAfter": 0.24},
    "close":    {"speed": 1.06, "pauseAfter": 0.20},
}

VOICE_MAP = {
    "adam": "Adam",
    "minh_duc": "Minh Đức",
    "minh duc": "Minh Đức",
    "minh đức": "Minh Đức",
    "minh_triet": "Minh Triết",
    "minh triet": "Minh Triết",
    "minh triết": "Minh Triết",
    "mai_anh": "Mai Anh",
    "mai anh": "Mai Anh",
    "truc_ly": "Trúc Ly",
    "truc ly": "Trúc Ly",
    "trúc ly": "Trúc Ly",
    "pham_tuyen": "Phạm Tuyên",
    "pham tuyen": "Phạm Tuyên",
    "phạm tuyên": "Phạm Tuyên",
    "thai_son": "Thái Sơn",
    "thai son": "Thái Sơn",
    "thái sơn": "Thái Sơn",
    "xuan_vinh": "Xuân Vĩnh",
    "xuan vinh": "Xuân Vĩnh",
    "xuân vĩnh": "Xuân Vĩnh",
    "thanh_binh": "Thanh Bình",
    "thanh binh": "Thanh Bình",
    "thanh bình": "Thanh Bình",
    "ngoc_linh": "Ngọc Linh",
    "ngoc linh": "Ngọc Linh",
    "ngọc linh": "Ngọc Linh",
    "doan_trang": "Đoan Trang",
    "doan trang": "Đoan Trang",
    "đoan trang": "Đoan Trang",
    "thuc_doan": "Thục Đoan",
    "thuc doan": "Thục Đoan",
    "thục đoan": "Thục Đoan",
    "thuy_dung": "Thùy Dung",
    "thuy dung": "Thùy Dung",
    "thùy dung": "Thùy Dung",
    "quang_son": "Quang Sơn",
    "quang son": "Quang Sơn",
    "quang sơn": "Quang Sơn",
    "ngoc_tran": "Ngọc Trân",
    "ngoc tran": "Ngọc Trân",
    "ngọc trân": "Ngọc Trân",
    "my_duyen": "Mỹ Duyên",
    "my duyen": "Mỹ Duyên",
    "mỹ duyên": "Mỹ Duyên",
    "quynh_anh": "Quỳnh Anh",
    "quynh anh": "Quỳnh Anh",
    "quỳnh anh": "Quỳnh Anh",
    "duc_tri": "Đức Trí",
    "duc tri": "Đức Trí",
    "đức trí": "Đức Trí",
    "kim_thanh": "Kim Thanh",
    "kim thanh": "Kim Thanh",
    "ngoc_huyen": "Ngọc Huyền",
    "ngoc huyen": "Ngọc Huyền",
    "ngọc huyền": "Ngọc Huyền",
    "minh_quan": "Minh Triết",
    "minh quan": "Minh Triết",
    "minh quân": "Minh Triết",
    "mai_phuong": "Mai Anh",
    "mai phuong": "Mai Anh",
    "mai phương": "Mai Anh",
}


def run_ffmpeg(args: list[str]) -> None:
    completed = subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", *args],
        capture_output=True,
        creationflags=CREATE_NO_WINDOW,
    )
    if completed.returncode != 0:
        raise SystemExit(f"ffmpeg error: {completed.stderr.decode(errors='replace')}")


def atempo_chain(speed: float) -> str:
    if abs(speed - 1.0) < 1e-6:
        return ""
    stages = []
    remaining = speed
    while remaining > 2.0:
        stages.append("atempo=2.0")
        remaining /= 2.0
    while remaining < 0.5:
        stages.append("atempo=0.5")
        remaining /= 0.5
    stages.append(f"atempo={remaining:.6f}")
    return ",".join(stages)


def read_wav(path: Path) -> np.ndarray:
    with wave.open(str(path), "rb") as handle:
        frames = handle.readframes(handle.getnframes())
        channels = handle.getnchannels()
        rate = handle.getframerate()
    audio = np.frombuffer(frames, dtype="<i2").astype(np.float64) / 32768.0
    if channels > 1:
        audio = audio.reshape(-1, channels).mean(axis=1)
    if rate != SR:
        target = int(len(audio) * SR / rate)
        audio = np.interp(np.linspace(0, len(audio), target, endpoint=False), np.arange(len(audio)), audio)
    return audio


def write_wav(path: Path, audio: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = (np.clip(audio, -1.0, 1.0) * 32767.0).astype("<i2")
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(SR)
        handle.writeframes(pcm.tobytes())


def enforce_python_offline_guard():
    import socket
    orig_socket = socket.socket

    class GuardedSocket(orig_socket):
        def connect(self, address):
            host = address[0] if isinstance(address, tuple) else address
            if host not in ("127.0.0.1", "::1", "localhost"):
                raise ConnectionRefusedError(f"[OfflineGuard] Python socket connection blocked to {address}")
            return super().connect(address)

        def connect_ex(self, address):
            host = address[0] if isinstance(address, tuple) else address
            if host not in ("127.0.0.1", "::1", "localhost"):
                raise ConnectionRefusedError(f"[OfflineGuard] Python socket connection_ex blocked to {address}")
            return super().connect_ex(address)

        def sendto(self, data, *args):
            address = args[-1] if args else None
            host = address[0] if isinstance(address, tuple) else address
            if host not in ("127.0.0.1", "::1", "localhost"):
                raise ConnectionRefusedError(f"[OfflineGuard] Python UDP sendto blocked to {address}")
            return super().sendto(data, *args)

    socket.socket = GuardedSocket
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    os.environ["OFFLINE_MODE"] = "1"


def resolve_voice_name(voice_arg: str, available_voices: list) -> str:
    if not voice_arg:
        return "Adam"
    norm = voice_arg.strip().lower()
    if norm in VOICE_MAP:
        return VOICE_MAP[norm]
    for av in available_voices:
        if av.lower() == norm or av == voice_arg:
            return av
    slug = norm.replace("_", " ")
    if slug in VOICE_MAP:
        return VOICE_MAP[slug]
    for av in available_voices:
        if av.lower() == slug:
            return av
    sys.stderr.write(f"Error: Unknown voice '{voice_arg}'. Available voices: {', '.join(available_voices)}\n")
    sys.exit(4)


def parse_args():
    parser = argparse.ArgumentParser(description="VieNeu-TTS v3 Turbo Synthesizer with Genvideo Voice Parity")
    # Single-take inputs
    parser.add_argument("--text", type=str, help="Text string to synthesize")
    parser.add_argument("--text-file", type=str, help="Path to text file containing script to synthesize")
    parser.add_argument("--output", "-o", type=str, help="Destination WAV file path for single take")
    parser.add_argument("--speed", type=float, default=1.0, help="Speech rate multiplier (default: 1.0)")
    parser.add_argument("--sample-rate", type=int, default=48000, choices=[24000, 48000], help="Sample rate in Hz (default: 48000)")
    parser.add_argument("--role", type=str, default="body", choices=list(ROLE_DEFAULTS.keys()), help="Narrative role (default: body)")

    # Batch-mode input
    parser.add_argument("--batch-json", type=str, help="Path to batch JSON defining lines to synthesize in one model load")

    # Explicit synthesis parameters (R1 requirement)
    parser.add_argument("--voice", type=str, default="Adam", help="Voice preset or alias (default: Adam)")
    parser.add_argument("--mode", type=str, default="v3turbo", help="VieNeu mode (default: v3turbo)")
    parser.add_argument("--backend", type=str, default="onnx", help="Inference backend (default: onnx)")
    parser.add_argument("--device", type=str, default="cpu", help="Device (default: cpu)")
    parser.add_argument("--precision", type=str, default="fp32", help="Precision (default: fp32)")
    parser.add_argument("--temperature", type=float, default=0.65, help="Sampling temperature (default: 0.65)")
    parser.add_argument("--silence-p", type=float, default=0.05, help="Silence padding probability (default: 0.05)")

    # Audio chain options
    parser.add_argument("--apply-voice-chain", action="store_true", default=True, help="Apply Genvideo GAP_CHAIN and VOICE_CHAIN")
    parser.add_argument("--no-voice-chain", action="store_false", dest="apply_voice_chain", help="Skip Genvideo voice chain")
    parser.add_argument("--reuse-voice", action="store_true", help="Skip synthesis for lines whose fingerprint is unchanged")
    parser.add_argument("--raw-output", type=str, help="Path to preserve raw synthesis before voice chain")
    parser.add_argument("--offline", action="store_true", help="Enforce strict offline socket guard")
    parser.add_argument("--json", action="store_true", help="Output JSON result to stdout")
    parser.add_argument("--no-watermark", action="store_true", default=True, help="Disable synthetic watermark")

    return parser.parse_args()


def load_vieneu_engine(mode: str, backend: str, device: str, precision: str):
    from vieneu import Vieneu
    return Vieneu(mode=mode, backend=backend, device=device, precision=precision)


def process_batch(args: argparse.Namespace):
    batch_path = Path(args.batch_json).resolve()
    if not batch_path.exists():
        sys.stderr.write(f"Error: Batch JSON file not found: {batch_path}\n")
        sys.exit(1)

    spec = json.loads(batch_path.read_text(encoding="utf-8"))
    voice_config = spec.get("voice", {})

    mode = voice_config.get("mode", args.mode)
    backend = voice_config.get("backend", args.backend)
    device = voice_config.get("device", args.device)
    precision = voice_config.get("precision", args.precision)
    voice_name = voice_config.get("voice", args.voice)
    temperature = float(voice_config.get("temperature", args.temperature))
    silence_p = float(voice_config.get("silenceP", args.silence_p))

    output_dir = Path(spec.get("outputDir", batch_path.parent / "audio")).resolve()
    lines_dir = output_dir / "lines"
    lines_dir.mkdir(parents=True, exist_ok=True)

    voice_fingerprint = {
        "mode": mode,
        "backend": backend,
        "precision": precision,
        "device": device,
        "voice": voice_name,
        "temperature": temperature,
        "silenceP": silence_p,
    }

    lines = []
    for idx, item in enumerate(spec["lines"], start=1):
        line_id = item.get("id", idx)
        role = item.get("role", "body")
        role_def = ROLE_DEFAULTS.get(role, ROLE_DEFAULTS["body"])
        speed = float(item.get("speed", role_def["speed"]))
        pause_after = float(item.get("pauseAfter", role_def["pauseAfter"]))
        spoken = item.get("spoken", item.get("say", item.get("text", ""))).strip()

        raw_wav = lines_dir / f"line{line_id:02d}.raw.wav"
        cache_json = lines_dir / f"line{line_id:02d}.take.json"
        processed_wav = lines_dir / f"line{line_id:02d}.wav"

        lines.append({
            "id": line_id,
            "role": role,
            "speed": speed,
            "pauseAfter": pause_after,
            "spoken": spoken,
            "raw": raw_wav,
            "cache": cache_json,
            "processed": processed_wav,
            "fingerprint": {"spoken": spoken, "voice": voice_fingerprint},
        })

    def is_cached(line: dict) -> bool:
        if not (args.reuse_voice and line["raw"].exists() and line["cache"].exists()):
            return False
        try:
            stored = json.loads(line["cache"].read_text(encoding="utf-8"))
            return stored == line["fingerprint"]
        except Exception:
            return False

    pending = [l for l in lines if not is_cached(l)]

    t0 = time.time()
    if pending:
        tts = load_vieneu_engine(mode, backend, device, precision)
        available = list(tts._preset_voices.keys()) if hasattr(tts, "_preset_voices") else []
        resolved_voice = resolve_voice_name(voice_name, available)

        for line in pending:
            audio = tts.infer(
                line["spoken"],
                voice=resolved_voice,
                apply_watermark=not args.no_watermark,
                temperature=temperature,
                silence_p=silence_p,
            )
            tts.save(audio, line["raw"])
            line["cache"].write_text(
                json.dumps(line["fingerprint"], ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
    else:
        print("Reusing all cached lines; no synthesis needed.", file=sys.stderr)

    # Apply GAP_CHAIN + atempo_chain + VOICE_CHAIN per line
    for line in lines:
        chain_parts = [GAP_CHAIN]
        atempo = atempo_chain(line["speed"])
        if atempo:
            chain_parts.append(atempo)
        if args.apply_voice_chain:
            chain_parts.append(VOICE_CHAIN)

        full_chain = ",".join(chain_parts)
        run_ffmpeg([
            "-i", str(line["raw"]),
            "-filter:a", full_chain,
            "-ar", str(SR), "-ac", "1", "-c:a", "pcm_s16le", str(line["processed"]),
        ])
        line["audio"] = read_wav(line["processed"])

    # Assemble timeline with real pauseAfter
    segments: list[np.ndarray] = []
    cursor = 0.0
    for line in lines:
        line["start"] = cursor
        segments.append(line["audio"])
        line_dur = len(line["audio"]) / SR
        cursor += line_dur
        line["end"] = cursor
        line["audioDuration"] = line_dur

        pause_samples = int(round(line["pauseAfter"] * SR))
        if pause_samples > 0:
            segments.append(np.zeros(pause_samples))
            cursor += line["pauseAfter"]

    voiceover = np.concatenate(segments) if segments else np.zeros(0)
    raw_voiceover_path = output_dir / "voiceover.raw.wav"
    write_wav(raw_voiceover_path, voiceover)

    master_voiceover_name = spec.get("masterVoiceover", "voiceover.wav")
    master_voiceover_path = output_dir / master_voiceover_name

    # Master Loudness Normalization (-15.0 LUFS, <= -1.8 dBTP, LRA 7)
    run_ffmpeg([
        "-i", str(raw_voiceover_path),
        "-af", f"loudnorm=I={TARGET_LUFS}:LRA={TARGET_LRA}:tp={TARGET_TP}",
        "-ar", str(SR), "-ac", "1", "-c:a", "pcm_s16le", str(master_voiceover_path),
    ])

    raw_voiceover_path.unlink(missing_ok=True)

    timing_result = {
        "status": "success",
        "totalDurationSec": round(len(voiceover) / SR, 3),
        "totalLines": len(lines),
        "masterVoiceover": str(master_voiceover_path),
        "voice": voice_fingerprint,
        "scenes": [
            {
                "id": l["id"],
                "role": l["role"],
                "speed": l["speed"],
                "pauseAfter": l["pauseAfter"],
                "start": round(l["start"], 3),
                "end": round(l["end"], 3),
                "audioDuration": round(l["audioDuration"], 3),
                "totalDuration": round(l["end"] - l["start"] + l["pauseAfter"], 3),
                "spoken": l["spoken"],
                "file": str(l["processed"]),
            }
            for l in lines
        ],
        "elapsedSec": round(time.time() - t0, 3),
    }

    timing_file = output_dir / "timing.json"
    timing_file.write_text(json.dumps(timing_result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if args.json:
        print(json.dumps(timing_result))
    else:
        print(f"Batch completed: {master_voiceover_path} ({timing_result['totalDurationSec']}s, {len(lines)} lines)")


def process_single(args: argparse.Namespace):
    if args.text is not None:
        text = args.text.strip()
    elif args.text_file:
        with open(args.text_file, "r", encoding="utf-8") as f:
            text = f.read().strip()
    else:
        text = sys.stdin.read().strip()

    if not text:
        sys.stderr.write("Error: No input text provided for synthesis.\n")
        sys.exit(1)

    out_path = Path(args.output).resolve()
    out_dir = out_path.parent
    out_dir.mkdir(parents=True, exist_ok=True)

    raw_path = Path(args.raw_output).resolve() if args.raw_output else out_dir / f"{out_path.stem}.raw.wav"

    role_def = ROLE_DEFAULTS.get(args.role, ROLE_DEFAULTS["body"])
    speed = args.speed if args.speed != 1.0 else role_def["speed"]

    tts = load_vieneu_engine(args.mode, args.backend, args.device, args.precision)
    available = list(tts._preset_voices.keys()) if hasattr(tts, "_preset_voices") else []
    resolved_voice = resolve_voice_name(args.voice, available)

    t0 = time.time()
    audio = tts.infer(
        text,
        voice=resolved_voice,
        apply_watermark=not args.no_watermark,
        temperature=args.temperature,
        silence_p=args.silence_p,
    )
    tts.save(audio, raw_path)

    # Post-process with Genvideo audio chain
    chain_parts = [GAP_CHAIN]
    atempo = atempo_chain(speed)
    if atempo:
        chain_parts.append(atempo)
    if args.apply_voice_chain:
        chain_parts.append(VOICE_CHAIN)

    full_chain = ",".join(chain_parts)
    run_ffmpeg([
        "-i", str(raw_path),
        "-filter:a", full_chain,
        "-ar", str(args.sample_rate), "-ac", "1", "-c:a", "pcm_s16le", str(out_path),
    ])

    if not args.raw_output:
        raw_path.unlink(missing_ok=True)

    final_audio = read_wav(out_path)
    duration_sec = len(final_audio) / SR
    gen_time_sec = time.time() - t0

    result = {
        "status": "success",
        "outputPath": str(out_path),
        "sampleRate": args.sample_rate,
        "channels": 1,
        "bitDepth": 16,
        "durationSec": round(duration_sec, 4),
        "generationTimeSec": round(gen_time_sec, 4),
        "rtf": round(gen_time_sec / duration_sec, 4) if duration_sec > 0 else 0,
        "voice": resolved_voice,
        "speed": speed,
        "role": args.role,
        "temperature": args.temperature,
        "silenceP": args.silence_p,
    }

    if args.json:
        print(json.dumps(result))
    else:
        print(f"Generated {result['outputPath']} ({result['durationSec']}s in {result['generationTimeSec']}s, RTF {result['rtf']})")


def main():
    args = parse_args()
    if args.offline or os.environ.get("OFFLINE_MODE") == "1":
        enforce_python_offline_guard()

    if args.batch_json:
        process_batch(args)
    else:
        if not args.output:
            sys.stderr.write("Error: --output is required for single-take mode.\n")
            sys.exit(1)
        process_single(args)


if __name__ == "__main__":
    main()
