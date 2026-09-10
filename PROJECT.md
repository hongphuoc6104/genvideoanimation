# Project: V3.1 Vietnamese-First Bilingual Narration Hardening

## Architecture
The V3.1 system transforms the Remotion narration and karaoke subtitle subsystem into a production-grade, Vietnamese-first bilingual production engine for vertical educational motion videos (1080x1920, 9:16, 30fps).

### System Overview & Module Boundaries
1. **TTS Engine & Audio Subsystem (`packages/narration-kit/src/tts/` & `scripts/`)**:
   - Primary TTS: Local VieNeu-TTS v3 Turbo running via `/home/hongphuoc6104/video3d/.genvideo/voice/vieneu/.venv/bin/python3` and `scripts/generate-vieneu-narration.py`.
   - Local weights: `pnnbao-ump/VieNeu-TTS-v3-Turbo` and `OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX` cached in `~/.cache/huggingface/hub/`.
   - Audio output: Uncompressed 48kHz/24kHz mono 16-bit PCM WAV (`pcm_s16le`).
   - Fallback: Kokoro-82M preserved as English-only fallback via polymorphic `TTSProvider`.
   - Voice presets: `Minh Quân`, `Minh Đức`, `Adam`, `Mai Phương`.
   - Single bilingual utterance synthesis with continuous prosody and identical speaker timbre.

2. **Bilingual NLP, Tokenization & Lexicons (`packages/narration-kit/src/normalization/` & `lexicons/`)**:
   - Tokenizer & classifier for 10 semantic types: `VIETNAMESE`, `ENGLISH_WORD`, `ENGLISH_PHRASE`, `ACRONYM`, `INITIALISM`, `PROPER_NOUN`, `NUMBER`, `UNIT`, `FORMULA`, `MODEL_NAME`.
   - 5 pronunciation modes: `vi`, `en_word`, `en_phrase`, `en_spell`, `custom`.
   - Hierarchical YAML lexicons in `lexicons/`: `custom.yaml` (highest priority), `academic-vi-en.yaml`, `technology-vi-en.yaml`.
   - Strict unregistered acronym halt (throws error, never silently guessed).
   - Vietnamese number & alphanumeric normalization (e.g., 2026 -> "hai nghìn không trăm hai mươi sáu"; GPT-5, Q1, H-index).
   - Dual text representation: `displayText` (authoritative display) decoupled from `spokenText` (phonetic synthesis).

3. **Multilingual Forced Alignment & Subunit Mapping (`packages/narration-kit/src/alignment/` & `scripts/`)**:
   - Local multilingual forced alignment via `torchaudio.pipelines.MMS_FA` in `scripts/align-multilingual.py`.
   - Script-authoritative timestamp boundary alignment (ASR never drifts or alters script).
   - Bidirectional token mapping: `display_token ↔ spoken_token(s) ↔ timestamps`.
   - Subunit mapping for initialisms: e.g. `GPU` maps to `G`, `P`, `U` timestamps without spaces in `displayText`, supporting progressive fill.
   - Monotonic, non-negative word and subunit timestamps in `words.json`.

4. **Mobile 9:16 Caption Kit (`packages/caption-kit/` & `packages/narration-kit/src/captions/`)**:
   - Safe areas for 1080x1920: Left 72px, Right 180px, Top 120px, Bottom 320px ($X \in [72, 900]$, $Y \in [120, 1600]$, $W_{\max} = 828\text{px}$).
   - Invariants: Base font size 56px, max 2 lines, never shrink font size to fit.
   - Dynamic re-segmentation: Line character budget $\le 26$ characters; overflow phrases partitioned into sequential groups.
   - Mobile preview QA: 360x640 preview video rendered via Remotion `--scale=0.3333333333333333`.

5. **Quality Gate Validators & Offline Guard (`validators/`)**:
   - `validate-language-spans.ts`
   - `validate-pronunciation-map.ts`
   - `validate-token-reconciliation.ts`
   - `validate-bilingual-alignment.ts`
   - `validate-vietnamese-normalization.ts`
   - Updated `validate-captions.ts` and `validate-caption-layout.ts`.
   - Strict offline enforcement via `validators/offline-network-guard.ts` wrapping all operations.

6. **Benchmarks & Real Project Acceptance**:
   - Voice benchmark suite across 4 voices in `out/voice-benchmarks/`.
   - 3 Unseen benchmarks (A, B, C) producing all 8 artifacts in `out/v3.1/`.
   - Real project acceptance: `connection-film` (Scopus explainer) re-rendered with V3.1 engine to `out/scopus-research-gap-tiktok-9x16.mp4`.

---

## Feature Inventory
Every feature from the user request and survey phase appears here with its assigned milestone. No feature is unassigned.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | VieNeu-TTS v3 Turbo Engine | Primary local offline TTS engine producing mono PCM WAV (`pcm_s16le`) | M1 | Survey / R1 |
| F02 | Local Model & Env Packaging | Local weights in `~/.cache/huggingface/hub/` & python script runner | M1 | Survey / R1, R12 |
| F03 | Kokoro Fallback Preservation | Kokoro preserved as English-only fallback via polymorphic `TTSProvider` | M1 | Survey / R1 |
| F04 | Vietnamese-First Language Policy | `primaryLanguage = vi-VN`, `secondaryLanguage = en`, single bilingual utterance | M1 | Survey / R2 |
| F05 | Voice Presets Setup | Support `Minh Quân`, `Minh Đức`, `Adam`, and `Mai Phương` | M1 | Survey / R9 |
| F06 | Voice Benchmark Runner | Benchmark script generating 4 voice WAVs in `out/voice-benchmarks/` | M1 | Survey / R9 |
| F07 | Language-Aware Tokenizer | Classifies tokens into 10 semantic types | M2 | Survey / R3 |
| F08 | Pronunciation Modes | Implements 5 modes: `vi`, `en_word`, `en_phrase`, `en_spell`, `custom` | M2 | Survey / R3 |
| F09 | Hierarchical YAML Lexicons | `lexicons/` (`academic-vi-en.yaml`, `technology-vi-en.yaml`, `custom.yaml`) | M2 | Survey / R4 |
| F10 | Strict Unregistered Acronym Halt | Halts on unknown uppercase acronyms, prevents silent guessing | M2 | Survey / R4, R11 |
| F11 | Vietnamese Number Normalization | Vietnamese reading grammar for numbers and years (e.g. 2026) | M2 | Survey / R6 |
| F12 | Alphanumeric Model Name Normalization | Bilingual reading for mixed names (e.g., GPT-5, Q1, H-index) | M2 | Survey / R6 |
| F13 | Dual Text Representation | Strict decoupling of `displayText` vs `spokenText` | M3 | Survey / R5 |
| F14 | Multilingual Forced Alignment | Local MMS_FA forced alignment for Vietnamese and English speech | M3 | Survey / R7 |
| F15 | Token Reconciliation & Subunits | Initialisms map display token to spoken subunits (GPU -> G, P, U) | M3 | Survey / R5 |
| F16 | Monotonic Timestamp Alignment | Script-authoritative monotonic non-negative word & subunit timings | M3 | Survey / R7 |
| F17 | Mobile 9:16 Safe Placement | Safe margins Left 72, Right 180, Top 120, Bottom 320 for 1080x1920 | M4 | Survey / R8 |
| F18 | 56px Base Font & 2-Line Limit | Base font 56px, max 2 lines, line character budget $\le 26$ chars | M4 | Survey / R8 |
| F19 | Dynamic Caption Re-segmentation | Auto re-segmentation of overflow phrases without shrinking font size | M4 | Survey / R8 |
| F20 | 360x640 Mobile Preview QA | Remotion 360x640 preview video render pipeline for legibility QA | M4 | Survey / R8 |
| F21 | Validator: Language Spans | `validate-language-spans.ts` (100% coverage, enum check, no silent guessing) | M5 | Survey / R11 |
| F22 | Validator: Pronunciation Map | `validate-pronunciation-map.ts` (lexicon hierarchy, fail on wrong spelling) | M5 | Survey / R11 |
| F23 | Validator: Token Reconciliation | `validate-token-reconciliation.ts` (captions match display text, no spaces) | M5 | Survey / R11 |
| F24 | Validator: Bilingual Alignment | `validate-bilingual-alignment.ts` (monotonicity, code-switching stability) | M5 | Survey / R11 |
| F25 | Validator: VN Normalization | `validate-vietnamese-normalization.ts` (fail if VN year read in English) | M5 | Survey / R11 |
| F26 | Layout & Caption Validators Update | Update `validate-captions.ts` & `validate-caption-layout.ts` for 9:16 56px | M5 | Survey / R11 |
| F27 | Offline Network Guard Enforcement | Enforce `validators/offline-network-guard.ts` across all operations | M5 | Survey / R12 |
| F28 | Benchmark A Execution | Academic Vietnamese ($\ge 90\%$), producing all 8 artifacts | M6 | Survey / R10 |
| F29 | Benchmark B Execution | Technology Code-Switch ($\ge 75\%$), producing all 8 artifacts | M6 | Survey / R10 |
| F30 | Benchmark C Execution | Dense Academic Metadata, producing all 8 artifacts | M6 | Survey / R10 |
| F31 | 8-Artifact Schema Verification | Verify 8 artifacts in each benchmark output directory | M6 | Survey / R10 |
| F32 | Benchmark Mobile Preview Renders | Render 360x640 preview MP4 for each benchmark | M6 | Survey / R8, R10 |
| F33 | Connection Film V3.1 Script & Audio | Vietnamese bilingual narration generation for Scopus explainer | M7 | Survey / R13 |
| F34 | Connection Film Captions Alignment | Re-segment captions with 56px safe area, resolving $40\text{px}$ overflow | M7 | Survey / R13 |
| F35 | Connection Film Full Render | Render final 1080x1920 30fps MP4 with synced audio & captions | M7 | Survey / R13 |
| F36 | Final Verification & Audit | All validators pass, offline guard verified, independent audit pass | M7 | Survey / R11-R13 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | VieNeu-TTS Engine & Audio Subsystem | F01, F02, F03, F04, F05, F06 | None | IN_PROGRESS |
| M2 | Bilingual Tokenizer, Lexicons & VN Normalization | F07, F08, F09, F10, F11, F12 | None | PLANNED |
| M3 | Multilingual Forced Alignment & Subunit Mapping | F13, F14, F15, F16 | M1, M2 | PLANNED |
| M4 | Mobile 9:16 Caption Kit & Preview QA | F17, F18, F19, F20 | M2, M3 | PLANNED |
| M5 | Quality Gate Validators Suite & Offline Guard | F21, F22, F23, F24, F25, F26, F27 | M2, M3, M4 | PLANNED |
| M6 | Benchmarks Execution (4 Voices & 3 Unseen Benchmarks) | F28, F29, F30, F31, F32 | M1, M2, M3, M4, M5 | PLANNED |
| M7 | Real Project Acceptance: Scopus Explainer Re-Render | F33, F34, F35, F36 | M1-M6 | PLANNED |

---

## Interface Contracts

### TTS Provider Interface (`packages/narration-kit/src/tts/types.ts`)
```typescript
export interface TTSRequest {
  text: string;
  voice: string; // "adam", "minh_duc", "minh_quan", "mai_phuong"
  speed?: number;
  sampleRate?: 24000 | 48000;
  format?: 'wav';
}

export interface TTSResult {
  audioBuffer: Buffer;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  durationMs: number;
}

export interface TTSProvider {
  readonly name: string;
  synthesize(request: TTSRequest): Promise<TTSResult>;
  getVoices(): VoiceMetadata[];
}
```

### Language Spans & Token Types (`packages/narration-kit/src/normalization/types.ts`)
```typescript
export type SemanticTokenType =
  | 'VIETNAMESE'
  | 'ENGLISH_WORD'
  | 'ENGLISH_PHRASE'
  | 'ACRONYM'
  | 'INITIALISM'
  | 'PROPER_NOUN'
  | 'NUMBER'
  | 'UNIT'
  | 'FORMULA'
  | 'MODEL_NAME';

export type PronunciationMode =
  | 'vi'
  | 'en_word'
  | 'en_phrase'
  | 'en_spell'
  | 'custom';

export interface LanguageSpan {
  text: string;
  type: SemanticTokenType;
  mode: PronunciationMode;
  spokenText: string;
  startIndex: number;
  endIndex: number;
}
```

### Word & Subunit Timings Contract (`words.json`)
```typescript
export interface AlignedSubunit {
  subunit: string; // e.g. "G", "P", "U"
  start: number;   // seconds
  end: number;     // seconds
  confidence: number;
}

export interface AlignedWord {
  word: string;    // displayText (e.g. "GPU")
  spokenText: string; // spokenText (e.g. "G P U")
  start: number;   // seconds
  end: number;     // seconds
  confidence: number;
  subunits?: AlignedSubunit[];
}
```

### 9:16 Caption Box Layout Contract (`captions.json`)
```typescript
export interface CaptionBox {
  x: number;      // >= 72
  y: number;      // >= 120
  width: number;  // <= 828, x + width <= 900
  height: number; // <= 190 (2 lines @ 56px)
}
```

---

## Code Layout
```
/home/hongphuoc6104/Desktop/videorenderhoathinh/
├── packages/
│   ├── narration-kit/
│   │   ├── src/
│   │   │   ├── tts/              # VieNeuTtsEngine, KokoroTtsEngine, voices, types
│   │   │   ├── normalization/    # tokenizer, lexicons, vietnamese normalizer
│   │   │   ├── alignment/        # multilingual aligner, subunit reconciliation
│   │   │   ├── captions/         # 9:16 safe placement, dynamic re-segmentation
│   │   │   ├── audio/            # loudness normalization, audio mixing
│   │   │   └── pipeline/         # unified end-to-end pipeline runner
│   │   └── package.json
│   └── caption-kit/
│       ├── src/
│       │   ├── KaraokeCaptions.tsx
│       │   ├── KaraokeGroup.tsx
│       │   ├── KaraokeLine.tsx
│       │   ├── KaraokeWord.tsx   # subunit progressive fill
│       │   └── theme.ts          # 56px base font size, safe area styling
│       └── package.json
├── lexicons/
│   ├── custom.yaml               # Highest priority project overrides
│   ├── academic-vi-en.yaml       # Scopus, DOI, ORCID, Q1, H-index, Springer, etc.
│   └── technology-vi-en.yaml     # AI, GPU, GPT, BERT, API, ONNX, etc.
├── scripts/
│   ├── generate-vieneu-narration.py  # Local VieNeu-TTS v3 Turbo offline wrapper
│   ├── align-multilingual.py          # Local MMS_FA multilingual forced alignment
│   ├── run-voice-benchmarks.ts        # 4-voice benchmark runner
│   ├── run-v3.1-benchmarks.ts         # 3 unseen benchmarks runner
│   └── render-mobile-preview.ts       # 360x640 preview renderer
├── validators/
│   ├── validate-language-spans.ts
│   ├── validate-pronunciation-map.ts
│   ├── validate-token-reconciliation.ts
│   ├── validate-bilingual-alignment.ts
│   ├── validate-vietnamese-normalization.ts
│   ├── validate-captions.ts
│   ├── validate-caption-layout.ts
│   └── offline-network-guard.ts
├── out/
│   ├── voice-benchmarks/         # 4 voice WAVs (Minh Quân, Minh Đức, Adam, Mai Phương)
│   ├── v3.1/                     # Benchmark A, B, C (all 8 artifacts each)
│   └── scopus-research-gap-tiktok-9x16.mp4 # Final re-rendered project video
├── connection-film/              # Scopus / Research Gap explainer Remotion project
└── ORIGINAL_REQUEST.md
```
