#!/usr/bin/env python3
"""
scripts/generate-vieneu-narration.py

Local Offline VieNeu-TTS v3 Turbo Synthesizer for Remotion Narration Subsystem.
Strictly generates uncompressed 48kHz or 24kHz 16-bit mono linear PCM WAV (pcm_s16le).
Zero intermediate MP3 conversion, zero cloud API dependencies.
"""

import argparse
import json
import os
import sys
import time

VOICE_MAP = {
    # Direct mappings & slug variants
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
    # Official aliases requested by V3.1 specification
    "minh_quan": "Minh Triết",  # Minh Quân -> official Southern news male Minh Triết
    "minh quan": "Minh Triết",
    "minh quân": "Minh Triết",
    "mai_phuong": "Mai Anh",    # Mai Phương -> official Northern news female Mai Anh
    "mai phuong": "Mai Anh",
    "mai phương": "Mai Anh",
}

def parse_args():
    parser = argparse.ArgumentParser(description="VieNeu-TTS v3 Turbo Offline Synthesizer")
    parser.add_argument("--text", type=str, help="Text string to synthesize")
    parser.add_argument("--text-file", type=str, help="Path to text file containing script to synthesize")
    parser.add_argument("--voice", type=str, default="Adam", help="Voice preset or alias (default: Adam)")
    parser.add_argument("--speed", type=float, default=1.0, help="Speech rate multiplier (default: 1.0)")
    parser.add_argument("--sample-rate", type=int, default=48000, choices=[24000, 48000], help="Sample rate in Hz (default: 48000)")
    parser.add_argument("--output", "-o", type=str, required=True, help="Destination WAV file path")
    parser.add_argument("--offline", action="store_true", help="Enforce strict offline socket guard")
    parser.add_argument("--json", action="store_true", help="Output JSON result to stdout")
    parser.add_argument("--no-watermark", action="store_true", default=True, help="Disable synthetic watermark")
    return parser.parse_args()

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
    # Check direct name match in available voices
    for av in available_voices:
        if av.lower() == norm or av == voice_arg:
            return av
    # Check normalized with space
    slug = norm.replace("_", " ")
    if slug in VOICE_MAP:
        return VOICE_MAP[slug]
    for av in available_voices:
        if av.lower() == slug:
            return av
    sys.stderr.write(
        f"Error: Unknown voice '{voice_arg}'. Available voices: {', '.join(available_voices)}\n"
    )
    sys.exit(4)

def main():
    args = parse_args()

    if args.offline or os.environ.get("OFFLINE_MODE") == "1":
        enforce_python_offline_guard()

    # Resolve text input
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

    try:
        import soundfile as sf
        import soxr
        import librosa
        from vieneu import Vieneu
    except ImportError as e:
        sys.stderr.write(f"Error: Required Python dependencies missing: {e}\n")
        sys.exit(3)

    try:
        tts = Vieneu(mode="v3turbo", backend="onnx")
    except Exception as e:
        sys.stderr.write(f"Error: Failed to initialize VieNeu-TTS v3 Turbo engine: {e}\n")
        sys.exit(2)

    available_voices = list(tts._preset_voices.keys()) if hasattr(tts, "_preset_voices") else []
    resolved_voice = resolve_voice_name(args.voice, available_voices)

    out_dir = os.path.dirname(os.path.abspath(args.output))
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    t0 = time.time()
    try:
        # Synthesize audio with VieNeu
        raw_samples = tts.infer(text, voice=resolved_voice, apply_watermark=not args.no_watermark)
    except Exception as e:
        sys.stderr.write(f"Error during VieNeu-TTS synthesis: {e}\n")
        sys.exit(6)

    # Apply speed adjustment if requested (without pitch change)
    if args.speed != 1.0 and len(raw_samples) > 0:
        samples_stretched = librosa.effects.time_stretch(raw_samples, rate=args.speed)
    else:
        samples_stretched = raw_samples

    # Apply sample rate resampling if requested (VieNeu native is 48000)
    target_sr = args.sample_rate
    native_sr = getattr(tts, "sample_rate", 48000) or 48000
    if target_sr != native_sr and len(samples_stretched) > 0:
        final_samples = soxr.resample(samples_stretched, native_sr, target_sr)
    else:
        final_samples = samples_stretched

    gen_time_sec = time.time() - t0
    duration_sec = len(final_samples) / target_sr if target_sr > 0 else 0

    # Write uncompressed 16-bit PCM WAV (pcm_s16le)
    sf.write(args.output, final_samples, target_sr, subtype="PCM_16", format="WAV")

    result = {
        "status": "success",
        "outputPath": os.path.abspath(args.output),
        "sampleRate": target_sr,
        "channels": 1,
        "bitDepth": 16,
        "sampleCount": len(final_samples),
        "durationSec": round(duration_sec, 4),
        "generationTimeSec": round(gen_time_sec, 4),
        "rtf": round(gen_time_sec / duration_sec, 4) if duration_sec > 0 else 0,
        "voice": resolved_voice,
        "requestedVoice": args.voice,
        "speed": args.speed,
    }

    if args.json:
        print(json.dumps(result))
    else:
        print(
            f"Generated {result['outputPath']} ({result['durationSec']}s, {result['sampleRate']}Hz mono PCM WAV in {result['generationTimeSec']}s, RTF {result['rtf']})"
        )

if __name__ == "__main__":
    main()
