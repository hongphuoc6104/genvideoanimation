# V3 Checkpoint: Local Narration + Karaoke + Audio Production System

> **Date**: September 10, 2026  
> **Status**: Milestone 1 Complete & Verified | Ready to Resume at Milestone 2  
> **Repository**: `videorenderhoathinh`

---

## 1. Executive Summary

Milestone 1 (Foundation, Offline Kokoro-82M TTS Engine, 24kHz PCM WAV mechanics, Offline Network Guard, and the Complete E2E Specification Test Harness) has been fully completed, hardened against adversarial attack probes, and verified.

### Quality & Test Status

| Suite | Scope | Result | Details |
|---|---|:---:|---|
| **Narration Kit Unit Tests** | `tests/narration-kit.test.ts` | **90 / 90 PASS** (100%) | Verified 24kHz PCM WAV, 4 voice presets, local model assets, genuine TTS inference, and offline guard. |
| **Adversarial Network Guard** | `tests/challenger_m1_offline_guard.test.ts` | **29 / 29 PASS** (100%) | Fixed domain spoofing (`127.evil.com`) and patched c-ares DNS `resolve*` methods. Zero leaks detected. |
| **E2E Contract Test Suite** | `tests/e2e/run-e2e-tests.ts` | **435 / 435 PASS** (100%) | Full feature coverage across Tier 1 (200), Tier 2 (175), Tier 3 (40), and Tier 4 (20). |
| **TypeScript Typecheck** | `npm run typecheck` | **0 ERRORS** | Clean check across `connection-film`, `motion-kit`, and `packages/narration-kit`. |
| **Build** | `npm run build:narration` | **0 ERRORS** | `packages/narration-kit` builds to `dist/` cleanly. |

---

## 2. Completed Artifacts & Components

### 2.1 Canonical Narration Package (`packages/narration-kit`)
- [`packages/narration-kit/package.json`](file:///home/hongphuoc6104/Desktop/videorenderhoathinh/packages/narration-kit/package.json): Package exports for `@videorender/narration-kit` and `narration-kit`.
- [`packages/narration-kit/src/tts/KokoroTtsEngine.ts`](file:///home/hongphuoc6104/Desktop/videorenderhoathinh/packages/narration-kit/src/tts/KokoroTtsEngine.ts): Real Kokoro-82M ONNX local synthesis engine producing 24kHz mono PCM WAV.
- [`packages/narration-kit/src/tts/voices.ts`](file:///home/hongphuoc6104/Desktop/videorenderhoathinh/packages/narration-kit/src/tts/voices.ts): Voice catalog and validation supporting `am_adam` (default), `am_fenrir`, `am_michael`, and `am_onyx`.
- [`packages/narration-kit/src/tts/wav.ts`](file:///home/hongphuoc6104/Desktop/videorenderhoathinh/packages/narration-kit/src/tts/wav.ts): Canonical 44-byte RIFF/WAVE header encoding, decoding, validation, and zero-intermediate-MP3 compliance.
- [`packages/narration-kit/src/tts/types.ts`](file:///home/hongphuoc6104/Desktop/videorenderhoathinh/packages/narration-kit/src/tts/types.ts): Typed contracts for `TTSRequest`, `TTSResult`, and voice metadata.

### 2.2 Local Model Assets (`models/`)
- `models/kokoro/kokoro-v1.0.onnx`: Local 82M ONNX weights.
- `models/kokoro/voices-v1.0.bin`: Multi-voice binary embedding bank.
- `models/kokoro/*.bin`: Individual voice embeddings (`am_adam.bin`, `am_fenrir.bin`, `am_michael.bin`, `am_onyx.bin`).
- [`models/README.md`](file:///home/hongphuoc6104/Desktop/videorenderhoathinh/models/README.md): Setup and offline operation instructions.

### 2.3 Strict Offline Network Guard (`validators/offline-network-guard.ts`)
- [`validators/offline-network-guard.ts`](file:///home/hongphuoc6104/Desktop/videorenderhoathinh/validators/offline-network-guard.ts): Intercepts Node primitives (`globalThis.fetch`, `http.request`, `http.get`, `https.request`, `https.get`, `net.Socket`, `dgram.Socket`, `dns.lookup`, `dns.promises.lookup`, `dns.resolve*`, `dns.promises.resolve*`).
- Sets `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1`, `OFFLINE_MODE=1`.
- Enforces strict regex validation on IPv4 loopback (`127.0.0.0/8`), blocking domain spoofing bypasses.

### 2.4 Setup Automation
- [`scripts/setup-narration-models.ts`](file:///home/hongphuoc6104/Desktop/videorenderhoathinh/scripts/setup-narration-models.ts): Automated setup script invoked via `npm run narration:setup`.
- [`scripts/generate-offline-narration.py`](file:///home/hongphuoc6104/Desktop/videorenderhoathinh/scripts/generate-offline-narration.py): Standalone offline Kokoro generation utility.

---

## 3. Resumption Roadmap for Remaining Milestones

When resuming, execute the milestones in the following sequence:

### Milestone 2: Text Normalization, Prosody & Local Alignment
1. **Text Normalization** (`packages/narration-kit/src/tts/textNormalizer.ts`):
   - Implement bidirectional token mapping: original text $\leftrightarrow$ normalized text $\leftrightarrow$ spoken text.
   - Handle numbers, acronyms, currency, URLs, abbreviations, and punctuation.
   - Output `narration-text-map.json`.
2. **Deterministic Prosody System** (`packages/narration-kit/src/tts/chunkNarration.ts`):
   - Implement profiles: `documentary`, `educational`, `energetic`, `calm`, `dramatic`, `solemn`.
   - Control speed, sentence pauses, paragraph pauses, and chunk boundaries.
   - ShotSpec bindings: `narration_profile`, `emphasis_words`, `pause_after`.
3. **WhisperX Local Forced Alignment** (`packages/narration-kit/src/alignment/`):
   - `AlignmentProvider.ts` & `WhisperXLocalAligner.ts`: Use canonical script as authoritative transcript + generated audio to produce word-level `start`, `end`, and `confidence`.
   - `validateAlignment.ts`: Quality gates (non-negative start, strictly increasing timestamps, duration check, silence gap validation).
   - Output `words.json`.

### Milestone 3: Caption Segmentation & Remotion Karaoke Kit
1. **Caption Segmentation** (`packages/narration-kit/src/captions/`):
   - `segmentCaptions.ts`: Segment word timings into 1–2 line subtitle phrases based on punctuation and pauses. Output `captions.json`.
   - `safePlacement.ts`: ShotSpec-aware placement (`bottom`, `lower-left`, `lower-right`, `top`, `auto`) avoiding `subject_region`.
2. **Canonical Caption Kit Package** (`packages/caption-kit/`):
   - `KaraokeCaptions.tsx`: Container reading `captions.json` and safe margins.
   - `KaraokeGroup.tsx`: Entry/exit eases.
   - `KaraokeLine.tsx`: Line wrapping and flex layout.
   - `KaraokeWord.tsx`: Frame-deterministic progressive fill ($0\% \to 100\%$ highlight width via clip-path/mask) across spoken duration.

### Milestone 4: Audio Mixing & Cue Manifest Integration
1. **Multi-Track Mixer** (`packages/narration-kit/src/audio/`):
   - `mixAudio.ts`: Multi-track mixing (`narration`, `music`, `SFX`) with automatic ducking attack/release envelopes.
   - Output `audio-manifest.json` with duration sync and clipping checks.
2. **Cue Manifest Integration**:
   - Derive semantic animation cues (`WORD_EMPHASIS`, `SENTENCE_START`, `SENTENCE_END`) into V2 `CueManifest`.

### Milestone 5: Standalone CLI Quality Gate Validators
Implement dedicated CLI validator scripts under `validators/`:
- `validators/validate-narration.ts`: WAV format, 24kHz, mono, PCM.
- `validators/validate-alignment.ts`: Timestamp monotonicity, duration consistency, script match.
- `validators/validate-captions.ts`: Line count ($\le 2$), reading speed (CPS), line length.
- `validators/validate-caption-layout.ts`: Diagnostic frame checks, safe margin violations, subject collisions.
- `validators/validate-audio-mix.ts`: Loudness ($-16$ LUFS target), ducking envelope, no clipping.

### Milestone 6: Benchmarks Execution & Final Acceptance
1. **Unseen Benchmarks**:
   - **Benchmark A**: Standard Educational Narration (20–30s).
   - **Benchmark B**: Difficult Technical Narration (numbers, acronyms, scientific terminology).
   - **Benchmark C**: Rapid / Expressive Narration (prosody variations, pauses).
2. **Voice Comparison**:
   - Synthesize 10–15s script with `am_adam`, `am_fenrir`, `am_michael`, `am_onyx`.
3. **Render Artifacts in `out/v3/`**:
   - Each benchmark generates: `script.txt`, `narration.wav`, `narration-text-map.json`, `words.json`, `captions.json`, `audio-manifest.json`, and final rendered `.mp4`.
4. **Final Acceptance Deliverable**:
   - Generate `benchmark-v3-report.md` documenting objective validator passes and subjective scoring rubric.

---

## 4. Verification Commands

To verify the current milestone at any time:

```bash
# Run Narration Kit unit test suite
npx tsx tests/narration-kit.test.ts

# Run adversarial offline guard challenger suite
npx tsx tests/challenger_m1_offline_guard.test.ts

# Run complete 435-test E2E contract harness
npx tsx tests/e2e/run-e2e-tests.ts

# Typecheck all packages
npm run typecheck

# Build narration kit
npm run build:narration
```
