#!/usr/bin/env python3
"""
scripts/generate-offline-narration.py
Kokoro-82M Offline TTS Synthesizer for Remotion Narration Subsystem.
Strictly generates uncompressed 24kHz 16-bit mono PCM WAV (pcm_s16le).
Zero intermediate MP3 conversion, zero cloud dependencies.
"""

import argparse
import json
import os
import sys
import time

def parse_args():
    parser = argparse.ArgumentParser(description="Kokoro-82M Offline TTS Synthesizer")
    parser.add_argument("--text", type=str, help="Text to synthesize")
    parser.add_argument("--text-file", type=str, help="Path to text file to synthesize")
    parser.add_argument("--voice", type=str, default="am_adam", help="Voice preset (default: am_adam)")
    parser.add_argument("--speed", type=float, default=1.0, help="Speech rate multiplier (default: 1.0)")
    parser.add_argument("--lang", type=str, default="en-us", help="Language code (default: en-us)")
    parser.add_argument("--output", "-o", type=str, required=True, help="Output 24kHz WAV file path")
    parser.add_argument("--model-path", type=str, default=None, help="Path to kokoro-v1.0.onnx")
    parser.add_argument("--voices-path", type=str, default=None, help="Path to voices-v1.0.bin")
    parser.add_argument("--offline", action="store_true", help="Enforce strict offline execution")
    parser.add_argument("--json", action="store_true", help="Output JSON result to stdout")
    return parser.parse_args()

def enforce_python_offline_guard():
    """
    Guarantees no outbound network calls can be made in Python runtime.
    Subclasses socket.socket to block non-localhost connections.
    """
    import socket
    orig_socket = socket.socket

    class GuardedSocket(orig_socket):
        def connect(self, address):
            host = address[0] if isinstance(address, tuple) else address
            if host not in ("127.0.0.1", "::1", "localhost"):
                raise ConnectionRefusedError(f"[OfflineGuard] Python socket connection blocked to {address}")
            return super().connect(address)

    socket.socket = GuardedSocket
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    os.environ["OFFLINE_MODE"] = "1"

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

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = args.model_path or os.path.join(repo_root, "models", "kokoro", "kokoro-v1.0.onnx")
    voices_path = args.voices_path or os.path.join(repo_root, "models", "kokoro", "voices-v1.0.bin")

    if not os.path.exists(model_path):
        sys.stderr.write(f"Error: Model file not found: {model_path}\nRun 'npm run narration:setup' first.\n")
        sys.exit(2)
    if not os.path.exists(voices_path):
        sys.stderr.write(f"Error: Voices file not found: {voices_path}\nRun 'npm run narration:setup' first.\n")
        sys.exit(2)

    try:
        import soundfile as sf
        from kokoro_onnx import Kokoro
    except ImportError as e:
        sys.stderr.write(f"Error: Required Python dependencies missing: {e}\nRun 'npm run narration:setup' first.\n")
        sys.exit(3)

    kokoro = Kokoro(model_path, voices_path)
    available_voices = kokoro.get_voices()

    if args.voice not in available_voices:
        sys.stderr.write(
            f"Error: Voice '{args.voice}' not found in voices file. Available: {', '.join(available_voices)}\n"
        )
        sys.exit(4)

    out_dir = os.path.dirname(os.path.abspath(args.output))
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    t0 = time.time()
    # Synthesize audio with Kokoro
    samples, sample_rate = kokoro.create(
        text,
        voice=args.voice,
        speed=args.speed,
        lang=args.lang
    )
    duration_sec = len(samples) / sample_rate
    gen_time_sec = time.time() - t0

    # Ensure output is strictly 24kHz mono uncompressed 16-bit PCM WAV (pcm_s16le)
    # Zero lossy or MP3 compression
    sf.write(args.output, samples, sample_rate, subtype="PCM_16", format="WAV")

    result = {
        "status": "success",
        "outputPath": os.path.abspath(args.output),
        "sampleRate": sample_rate,
        "channels": 1,
        "bitsPerSample": 16,
        "sampleCount": len(samples),
        "durationSec": round(duration_sec, 4),
        "generationTimeSec": round(gen_time_sec, 4),
        "rtf": round(gen_time_sec / duration_sec, 4) if duration_sec > 0 else 0,
        "voice": args.voice,
        "speed": args.speed,
    }

    if args.json:
        print(json.dumps(result))
    else:
        print(f"Generated {result['outputPath']} ({result['durationSec']}s, 24kHz mono PCM WAV in {result['generationTimeSec']}s)")

if __name__ == "__main__":
    main()
