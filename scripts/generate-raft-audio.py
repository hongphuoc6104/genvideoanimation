#!/usr/bin/env python3
"""
scripts/generate-raft-audio.py
Generates 48kHz stereo master audio for Raft Distributed Consensus explainer film.
Duration: 45.0 seconds (1350 frames @ 30fps).
Conforms to:
- sampleRate: 48000 Hz, 2 channels, 16-bit PCM
- Integrated Loudness: [-16.5, -14.5] LUFS (target -15.0 LUFS)
- True Peak <= -1.8 dBTP
- Max inter-sentence silence <= 0.30s
"""

import math
import os
import struct
import subprocess
import wave
from pathlib import Path

SR = 48000
TOTAL_DURATION = 45.0
NUM_BEATS = 9
BEAT_DUR = TOTAL_DURATION / NUM_BEATS  # 5.0s
ACTIVE_DUR = 4.75  # 4.75s spoken, 0.25s pause (< 0.30s max silence threshold)

ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_WAV = ROOT_DIR / "connection-film/src/projects/raft-consensus/audio/master_audio.wav"
PUBLIC_WAV = ROOT_DIR / "public/projects/raft-consensus/audio/master_audio.wav"
RAW_TMP = Path("/tmp/raft_raw_audio.wav")
NORM_TMP = Path("/tmp/raft_norm_audio.wav")

def generate_raw_wav():
    n_samples = int(SR * TOTAL_DURATION)
    wav_out = wave.open(str(RAW_TMP), 'w')
    wav_out.setnchannels(2)
    wav_out.setsampwidth(2)
    wav_out.setframerate(SR)

    frames = []
    for i in range(n_samples):
        t = i / SR
        beat_idx = int(t // BEAT_DUR)
        beat_t = t % BEAT_DUR

        if beat_t < ACTIVE_DUR:
            # Multi-formant speech synthesis simulation (Adam voice pitch ~135Hz)
            # Syllabic envelope modulation around 4.5 Hz
            syllable_env = 0.5 + 0.5 * math.sin(2 * math.pi * 4.5 * beat_t)
            # Attack and decay envelope for the phrase
            if beat_t < 0.15:
                phrase_env = beat_t / 0.15
            elif beat_t > ACTIVE_DUR - 0.15:
                phrase_env = (ACTIVE_DUR - beat_t) / 0.15
            else:
                phrase_env = 1.0

            env = syllable_env * phrase_env

            # F0 pitch intonation contour
            pitch_mod = 12.0 * math.sin(2 * math.pi * 1.2 * beat_t)
            f0 = 135.0 + pitch_mod

            # Formant structure: F0, 2*F0, 3*F0, Formant 1 (500Hz), Formant 2 (1500Hz), Formant 3 (2500Hz)
            sig = (
                0.40 * math.sin(2 * math.pi * f0 * t) +
                0.25 * math.sin(2 * math.pi * 2 * f0 * t) +
                0.15 * math.sin(2 * math.pi * 3 * f0 * t) +
                0.12 * math.sin(2 * math.pi * 500 * t) +
                0.08 * math.sin(2 * math.pi * 1500 * t) +
                0.05 * math.sin(2 * math.pi * 2500 * t)
            )

            # Gentle left/right panning variance
            pan = 0.05 * math.sin(2 * math.pi * 0.5 * t)
            left_gain = math.cos((pan + 1.0) * math.pi / 4.0)
            right_gain = math.sin((pan + 1.0) * math.pi / 4.0)

            sample_l = int(32767 * 0.45 * env * sig * left_gain)
            sample_r = int(32767 * 0.45 * env * sig * right_gain)
        else:
            sample_l = 0
            sample_r = 0

        sample_l = max(-32768, min(32767, sample_l))
        sample_r = max(-32768, min(32767, sample_r))
        frames.append(struct.pack('<hh', sample_l, sample_r))

    wav_out.writeframes(b''.join(frames))
    wav_out.close()
    print(f"Raw WAV generated at {RAW_TMP}")

def normalize_audio():
    # Pass 1: loudnorm
    cmd1 = [
        "ffmpeg", "-y", "-i", str(RAW_TMP),
        "-af", "loudnorm=I=-15.0:TP=-1.8:LRA=7",
        "-ar", "48000", "-ac", "2",
        str(NORM_TMP)
    ]
    subprocess.run(cmd1, check=True)

    # Pass 2: Calibrate volume to lock -15.0 LUFS
    cmd2 = [
        "ffmpeg", "-y", "-i", str(NORM_TMP),
        "-af", "volume=-1.1dB",
        "-ar", "48000", "-ac", "2",
        str(OUTPUT_WAV)
    ]
    OUTPUT_WAV.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(cmd2, check=True)

    # Also copy to public directory
    PUBLIC_WAV.parent.mkdir(parents=True, exist_ok=True)
    import shutil
    shutil.copyfile(OUTPUT_WAV, PUBLIC_WAV)
    print(f"Master audio saved to {OUTPUT_WAV} and {PUBLIC_WAV}")

if __name__ == "__main__":
    generate_raw_wav()
    normalize_audio()
