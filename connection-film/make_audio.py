#!/usr/bin/env python3
"""Render the original 15 second score for the Connection film.

The score is deliberately synthesized from a small palette of warm additive
voices: a softly chorused pad, rounded plucks, glassy bells, bird-like chirps,
and a little filtered city air.  All timing is sample-accurate at 48 kHz so
the script can be rerun without any external sound assets.
"""

from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile


SAMPLE_RATE = 48_000
DURATION = 15.0
N_SAMPLES = int(SAMPLE_RATE * DURATION)
RNG = np.random.default_rng(20260909)


def midi_to_hz(note: float) -> float:
    return 440.0 * 2.0 ** ((note - 69.0) / 12.0)


mix = np.zeros((N_SAMPLES, 2), dtype=np.float64)


def pan_gains(pan: float) -> tuple[float, float]:
    """Equal-power gains for a -1 (left) to +1 (right) pan position."""
    p = float(np.clip(pan, -1.0, 1.0))
    theta = (p + 1.0) * np.pi / 4.0
    return float(np.cos(theta)), float(np.sin(theta))


def mix_mono(mono: np.ndarray, start: float, gain: float = 1.0, pan: float = 0.0) -> None:
    """Add a mono event into the stereo mix with a gentle spatial position."""
    first = max(0, int(round(start * SAMPLE_RATE)))
    if first >= N_SAMPLES or mono.size == 0:
        return
    last = min(N_SAMPLES, first + mono.size)
    if last <= first:
        return
    left, right = pan_gains(pan)
    segment = mono[: last - first] * gain
    mix[first:last, 0] += segment * left
    mix[first:last, 1] += segment * right


def mix_stereo(left_sig: np.ndarray, right_sig: np.ndarray, start: float, gain: float = 1.0) -> None:
    first = max(0, int(round(start * SAMPLE_RATE)))
    if first >= N_SAMPLES:
        return
    length = min(left_sig.size, right_sig.size, N_SAMPLES - first)
    if length <= 0:
        return
    mix[first : first + length, 0] += left_sig[:length] * gain
    mix[first : first + length, 1] += right_sig[:length] * gain


def shaped_envelope(t: np.ndarray, sustain: float, attack: float, release: float) -> np.ndarray:
    """Smooth attack and release, with t measured from event onset."""
    attack_part = np.clip(t / max(attack, 1e-4), 0.0, 1.0) ** 0.7
    release_part = np.clip((sustain + release - t) / max(release, 1e-4), 0.0, 1.0) ** 1.15
    return attack_part * release_part


def add_pad_note(start: float, duration: float, midi: float, gain: float, pan: float) -> None:
    """Add a slow, slightly detuned additive pad voice."""
    attack = 0.72
    release = 1.10
    count = int(np.ceil((duration + release) * SAMPLE_RATE))
    t = np.arange(count, dtype=np.float64) / SAMPLE_RATE
    f = midi_to_hz(midi)
    # Very slow vibrato keeps the sustained material alive without sounding
    # like a synthesizer test tone.
    vibrato_l = 0.0020 * np.sin(2.0 * np.pi * (0.17 + midi * 0.0007) * t)
    vibrato_r = 0.0020 * np.sin(2.0 * np.pi * (0.19 + midi * 0.0006) * t + 0.9)
    phase_l = 2.0 * np.pi * f * t * (1.0 + vibrato_l) + 0.08
    phase_r = 2.0 * np.pi * f * t * (1.0 + vibrato_r) - 0.11
    # Warm fundamental, dark second/third partials, and a faint detuned pair.
    left_sig = (
        0.80 * np.sin(phase_l)
        + 0.22 * np.sin(2.0 * phase_l + 0.16)
        + 0.085 * np.sin(3.0 * phase_l - 0.30)
        + 0.035 * np.sin(4.0 * phase_l + 0.50)
        + 0.10 * np.sin(2.0 * np.pi * f * 1.0017 * t + 0.43)
    )
    right_sig = (
        0.80 * np.sin(phase_r)
        + 0.22 * np.sin(2.0 * phase_r - 0.18)
        + 0.085 * np.sin(3.0 * phase_r + 0.25)
        + 0.035 * np.sin(4.0 * phase_r - 0.45)
        + 0.10 * np.sin(2.0 * np.pi * f * 0.9984 * t - 0.29)
    )
    env = shaped_envelope(t, duration, attack, release)
    # Lower notes stay present as a cushion while the upper voices supply the
    # gradual sense of light opening in the second half.
    scale = 0.86 if midi < 49 else 0.76
    mix_stereo(left_sig * env * scale, right_sig * env * scale, start, gain)


def add_bell(start: float, midi: float, gain: float, pan: float = 0.0, duration: float = 2.8) -> None:
    """Add a mellow bell with a clear but rounded transient."""
    count = min(int(np.ceil(duration * SAMPLE_RATE)), N_SAMPLES - int(round(start * SAMPLE_RATE)))
    if count <= 0:
        return
    t = np.arange(count, dtype=np.float64) / SAMPLE_RATE
    f = midi_to_hz(midi)
    attack = 1.0 - np.exp(-145.0 * t)
    tail = 0.86 * np.exp(-2.45 * t) + 0.14 * np.exp(-0.92 * t)
    # These inharmonic partials are deliberately restrained, keeping the
    # bell luminous and musical instead of brittle.
    tone = (
        0.58 * np.sin(2.0 * np.pi * f * t + 0.12)
        + 0.245 * np.sin(2.0 * np.pi * f * 2.012 * t - 0.08)
        + 0.125 * np.sin(2.0 * np.pi * f * 3.985 * t + 0.17)
        + 0.065 * np.sin(2.0 * np.pi * f * 5.43 * t - 0.18)
        + 0.025 * np.sin(2.0 * np.pi * f * 8.22 * t + 0.27)
    )
    env = attack * tail
    # A tiny moving stereo offset gives the signals a glowing, floating image.
    spread = 0.022 * np.sin(2.0 * np.pi * 0.26 * t)
    left = tone * env * (1.0 + spread)
    right = tone * env * (1.0 - spread)
    left_gain, right_gain = pan_gains(pan)
    mix_stereo(left * left_gain, right * right_gain, start, gain)


def add_pluck(start: float, midi: float, gain: float, pan: float = 0.0) -> None:
    """Add a short, wooden pluck used for the connecting melodic motif."""
    duration = 1.10
    count = int(np.ceil(duration * SAMPLE_RATE))
    t = np.arange(count, dtype=np.float64) / SAMPLE_RATE
    f = midi_to_hz(midi)
    env = (1.0 - np.exp(-230.0 * t)) * np.exp(-4.85 * t)
    tone = (
        0.76 * np.sin(2.0 * np.pi * f * t)
        + 0.19 * np.sin(2.0 * np.pi * f * 2.0 * t + 0.12)
        + 0.075 * np.sin(2.0 * np.pi * f * 3.0 * t - 0.25)
    )
    # Quiet filtered-like attack noise adds finger/wood character.
    attack_noise = RNG.normal(0.0, 1.0, count) * 0.018 * np.exp(-68.0 * t)
    sig = (tone + attack_noise) * env
    mix_mono(sig, start, gain, pan)


def add_chirp(start: float, f0: float, f1: float, duration: float, gain: float, pan: float) -> None:
    """Add a small, musical bird/signal chirp with a rising or falling glide."""
    count = int(np.ceil(duration * SAMPLE_RATE))
    t = np.arange(count, dtype=np.float64) / SAMPLE_RATE
    glide = (f1 - f0) / max(duration, 1e-5)
    phase = 2.0 * np.pi * (f0 * t + 0.5 * glide * t * t)
    phase += 0.035 * np.sin(2.0 * np.pi * 6.0 * t)
    u = np.clip(t / duration, 0.0, 1.0)
    env = np.sin(np.pi * u) ** 0.72
    env *= np.exp(-1.45 * t)
    sig = env * (
        0.88 * np.sin(phase)
        + 0.18 * np.sin(2.0 * phase + 0.20)
        + 0.035 * np.sin(3.0 * phase - 0.10)
    )
    mix_mono(sig, start, gain, pan)


def add_pulse(start: float, frequency: float = 68.0, gain: float = 0.030, pan: float = 0.0) -> None:
    """A restrained low pulse which gently gives the middle section a heartbeat."""
    duration = 0.38
    count = int(np.ceil(duration * SAMPLE_RATE))
    t = np.arange(count, dtype=np.float64) / SAMPLE_RATE
    env = (1.0 - np.exp(-55.0 * t)) * np.exp(-8.5 * t)
    sig = env * (
        0.82 * np.sin(2.0 * np.pi * frequency * t)
        + 0.18 * np.sin(2.0 * np.pi * frequency * 2.0 * t + 0.15)
    )
    mix_mono(sig, start, gain, pan)


def add_whoosh(center: float, gain: float = 0.040, pan: float = 0.0) -> None:
    """Add a subtle filtered noise/sine lift at each story transition."""
    start = center - 0.78
    duration = 1.56
    count = int(np.ceil(duration * SAMPLE_RATE))
    t = np.arange(count, dtype=np.float64) / SAMPLE_RATE
    u = np.clip(t / duration, 0.0, 1.0)
    env = np.sin(np.pi * u) ** 0.86
    # A slow fade bias makes it feel like a passing glow instead of a burst.
    env *= 0.72 + 0.28 * u
    noise = RNG.normal(0.0, 1.0, count)
    band = signal.butter(2, [240.0, 3600.0], btype="bandpass", fs=SAMPLE_RATE, output="sos")
    texture = signal.sosfilt(band, noise)
    texture /= max(np.std(texture), 1e-9)
    f0 = 150.0 if center < 7.0 else 190.0
    f1 = 1_250.0 if center < 7.0 else 1_520.0
    phase = 2.0 * np.pi * (f0 * t + 0.5 * (f1 - f0) / duration * t * t)
    sweep = 0.68 * np.sin(phase) + 0.18 * np.sin(phase * 0.5 + 0.2)
    left = env * (0.76 * texture + sweep)
    right = env * (0.76 * np.roll(texture, 19) + 0.97 * sweep)
    left_gain, right_gain = pan_gains(pan)
    mix_stereo(left * left_gain, right * right_gain, start, gain)


def add_city_air() -> None:
    """A barely audible, dark urban bed that recedes as the connection arrives."""
    t = np.arange(N_SAMPLES, dtype=np.float64) / SAMPLE_RATE
    low_filter = signal.butter(2, 175.0, btype="lowpass", fs=SAMPLE_RATE, output="sos")
    mid_filter = signal.butter(2, [320.0, 2_500.0], btype="bandpass", fs=SAMPLE_RATE, output="sos")
    low = signal.sosfilt(low_filter, RNG.normal(size=N_SAMPLES))
    mid = signal.sosfilt(mid_filter, RNG.normal(size=N_SAMPLES))
    low /= max(np.std(low), 1e-9)
    mid /= max(np.std(mid), 1e-9)
    # City air is strongest before the first transition, then becomes a soft
    # bed underneath the planetary section.
    fade = np.where(t < 3.6, 1.0, np.clip((6.1 - t) / 2.5, 0.0, 1.0))
    traffic = 0.72 + 0.28 * np.sin(2.0 * np.pi * 0.13 * t + 0.8)
    left = fade * traffic * (0.010 * low + 0.0034 * mid)
    right = fade * traffic * (0.009 * low + 0.0030 * mid)
    mix_stereo(left, right, 0.0, 1.0)


def render() -> Path:
    add_city_air()

    # Chords: the first two are intentionally spare and darker; the final four
    # widen into open fifths and a Cmaj9 resolution.
    chords = [
        (0.00, 2.50, [38, 50, 57, 60, 64], 0.050),  # Dm(add9)
        (2.50, 5.00, [46, 53, 57, 62, 65], 0.050),  # Bbmaj7
        (5.00, 7.50, [41, 48, 52, 57, 60, 64], 0.066),  # Fmaj9
        (7.50, 10.00, [40, 47, 52, 55, 59, 62], 0.069),  # Cadd9/E
        (10.00, 12.50, [43, 50, 54, 59, 62, 67], 0.073),  # G6/9
        (12.50, 15.00, [36, 43, 47, 50, 52, 55, 59], 0.080),  # Cmaj9
    ]
    for start, end, notes, voice_gain in chords:
        for index, note in enumerate(notes):
            # Spread each voicing gently; upper voices move farther outward.
            pan = (index - (len(notes) - 1) / 2.0) * 0.19
            add_pad_note(start, end - start, note, voice_gain, pan)

    # Sparse calls from the city, then paired lower chirps as the signals begin
    # to answer one another.
    add_chirp(1.08, 2_020.0, 1_480.0, 0.34, 0.052, -0.28)
    add_chirp(3.56, 1_550.0, 2_360.0, 0.36, 0.048, -0.18)
    add_chirp(5.68, 940.0, 1_390.0, 0.27, 0.045, -0.46)
    add_chirp(6.02, 1_380.0, 1_910.0, 0.25, 0.043, 0.46)
    add_chirp(7.08, 1_060.0, 1_620.0, 0.27, 0.044, -0.34)
    add_chirp(7.38, 1_590.0, 2_190.0, 0.24, 0.041, 0.35)
    add_chirp(8.48, 1_170.0, 1_730.0, 0.26, 0.041, -0.42)
    add_chirp(8.79, 1_700.0, 2_260.0, 0.24, 0.039, 0.39)
    add_chirp(9.38, 1_250.0, 1_960.0, 0.28, 0.040, 0.05)

    # The bell/pluck motif starts simply and grows into an upward exchange.
    for when, note, side in [
        (5.34, 69, -0.34),
        (5.88, 72, 0.23),
        (6.43, 76, -0.12),
        (6.96, 74, 0.32),
        (7.62, 67, -0.28),
        (8.15, 72, 0.18),
        (8.68, 76, -0.10),
        (9.20, 79, 0.30),
    ]:
        add_pluck(when, note, 0.072, side)
    for when, note, side, level in [
        (5.48, 76, -0.30, 0.066),
        (6.34, 79, 0.30, 0.061),
        (7.50, 72, -0.24, 0.060),
        (8.38, 79, 0.25, 0.064),
        (9.36, 81, 0.02, 0.059),
    ]:
        add_bell(when, note, level, side, duration=2.25)

    # A gentle pulse arrives with connection and remains restrained beneath
    # the final open chords.
    for when in np.arange(5.25, 14.65, 0.75):
        add_pulse(float(when), 67.0 if when < 10.0 else 62.0, 0.027 if when < 10.0 else 0.030)

    add_whoosh(5.0, 0.036, 0.0)
    add_whoosh(10.0, 0.033, 0.0)

    # In the planetary half the motif becomes a slow, ascending constellation.
    for when, note, side in [
        (10.46, 72, -0.28),
        (11.10, 76, 0.22),
        (11.76, 79, -0.12),
        (12.42, 83, 0.30),
        (13.02, 79, -0.24),
        (13.66, 84, 0.20),
    ]:
        add_pluck(when, note, 0.070, side)
    for when, note, side, level in [
        (10.72, 79, -0.33, 0.065),
        (11.66, 84, 0.31, 0.064),
        (12.62, 88, -0.12, 0.058),
        (13.55, 91, 0.24, 0.053),
        (14.16, 84, 0.00, 0.062),
    ]:
        add_bell(when, note, level, side, duration=2.1)
    for when, f0, f1, side in [
        (10.86, 1_080.0, 1_560.0, -0.30),
        (11.72, 1_320.0, 1_920.0, 0.31),
        (12.54, 1_470.0, 2_130.0, -0.18),
        (13.34, 1_620.0, 2_360.0, 0.25),
    ]:
        add_chirp(when, f0, f1, 0.23, 0.030, side)

    # Master contour: a very small lift into the connection, then a gentle
    # final fade that reaches silence before the 15 second picture cut.
    t = np.arange(N_SAMPLES, dtype=np.float64) / SAMPLE_RATE
    contour = np.ones(N_SAMPLES, dtype=np.float64)
    contour *= np.clip(t / 0.24, 0.0, 1.0) ** 0.72
    contour *= np.where(t < 14.18, 1.0, np.clip((15.0 - t) / 0.82, 0.0, 1.0) ** 1.35)
    mix[:] *= contour[:, None]

    # Leave healthy headroom for downstream picture mixing.
    peak_before = float(np.max(np.abs(mix)))
    if peak_before > 0.0:
        mix[:] *= 0.82 / peak_before
    mix[:] = np.clip(mix, -0.85, 0.85)

    output = Path(__file__).resolve().parent / "public" / "soundtrack.wav"
    output.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(output, SAMPLE_RATE, np.int16(np.round(mix * 32767.0)))
    peak_after = float(np.max(np.abs(mix)))
    print(f"wrote {output}")
    print(f"duration_s={N_SAMPLES / SAMPLE_RATE:.3f} sample_rate={SAMPLE_RATE} channels=2 peak={peak_after:.6f}")
    return output


if __name__ == "__main__":
    render()

