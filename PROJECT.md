# Project: V3.3 Production Integrity Hardening

## Architecture
The V3.3 production architecture hardens the 1080x1920 (9:16, 30fps) 2D Educational Flat-Vector Remotion motion graphics system against false-positive acceptance through system-first contracts, real media decoding, single audio ownership, progressive disclosure, and fail-closed gates.

### System Overview & Module Boundaries
1. **Canonical Production Policy (`production-policy.json`)**:
   - Single authoritative configuration governing canvas (1080x1920, 30fps, 360x640 preview), typography minimums (Hero >= 64px, Section >= 48px, Card Title >= 38px, Body >= 34px, Secondary >= 30px, Karaoke >= 52px), safe regions (L80, R80, T140, B140, Caption 1600-1800), audio policy (`narration-sfx`, PREMIXED, -15 LUFS, -1.8 dBTP, role pauses), and gate thresholds.

2. **Static & Acoustic Quality Gates (`validators/`)**:
   - `validate-mobile-typography.ts`: AST visitor calculating effective rendered font size after parent SVG/CSS transform scaling ($\text{Font} \times \prod \text{Scale} \ge 30\text{px}$).
   - `validate-shot-spec.ts`: Validates shot continuity, strictly separates internal `impact_frames` from `transition_frames`, enforces 8 motivated transition types, prohibits naked cuts and opacity crossfades.
   - `validate-audio-ownership.ts`: Enforces PREMIXED strategy with exactly 1 `<Audio>` tag mounting master WAV; validates `audio-dependency-graph.json`; prohibits secondary cue `<Audio>` tags and double SFX playback.
   - `validate-audio-policy.ts`: Validates broadcast loudness (-15 LUFS, -1.8 dBTP ceiling) and role-aware natural pause ranges (clause 0.08-0.20s, sentence 0.18-0.40s, turn 0.25-0.55s, section 0.40-0.80s, payoff 0.30-0.65s, max dead-air 0.85s).
   - `validate-audio-mix.ts`: Extracts binary RIFF WAV headers and verifies sampleRate, channels, bitDepth, duration against manifest.
   - `validate-portability.ts`: Asserts zero machine-specific absolute paths (`/home/`, `/Users/`, `C:\`, `/tmp/`) in committed artifacts.
   - `validate-source-coverage.ts`: Asserts 100.0% coverage of curriculum atomic units in `source-content-map.json`.

3. **Real Video Decoding & Mobile Parity Gates (`validators/`)**:
   - `validate-preview-rubric.ts`: Decodes real MP4 frames via FFmpeg rawvideo pipe; completely eliminates synthetic `Buffer.alloc` fallbacks; fails closed on missing/corrupted media.
   - `validate-preview-parity.ts`: Verifies mathematical lineage and frame parity between `final-v3_3.mp4` and `preview-360x640.mp4` (duration $\Delta t < 0.033\text{s}$, frame count match, $\text{PSNR} \ge 35\text{ dB}$, fresh mtime).

4. **Speech Synthesis & Voice Routing (`packages/narration-kit/`)**:
   - Default TTS engine: local `VieNeu-TTS v3 Turbo` with voice `Adam`.
   - Omitted or empty voice parameter in pipeline requests strictly resolves to VieNeu `Adam`.
   - Omitting voice never routes to Kokoro `am_adam`. Kokoro is strictly an explicit opt-in fallback for English-only benchmarks.

5. **Canonical Acceptance Entrypoint (`package.json`) & Adversarial Suite**:
   - `npm run v3.3:gate`: Single canonical command executing all gates in fail-closed sequence.
   - `scripts/run-adversarial-suite.ts`: 12+ negative fixtures (all rejected) and matching positive fixtures (all accepted) executed against real standalone validators.

6. **Canary Migration & Unseen Mini-Projects**:
   - Scopus Canary: Reflow choreography to 103.20s (3096 frames), eliminate 70.4s panel collision in `Scene4TemplateCaseStudy.tsx`, enforce single PREMIXED master audio, 100% source coverage.
   - 3 Unseen Mini-Projects: Science/mechanism, historical/process, technology/tutorial, all passing `npm run v3.3:gate`.
   - Independent review scoring across 18 rubric categories (overall >= 4.5, min >= 4.0, critical >= 4.3).

---

## Feature Inventory
Every feature from requirements and Phase 0 survey appears here with its assigned milestone. No feature is unassigned.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | Canonical Production Policy | `production-policy.json` as single source of truth for canvas, fps, typography, audio, and gate thresholds | M1 | R1 |
| F02 | Effective Typography Scaling Validator | `validators/validate-mobile-typography.ts` calculating effective rendered font size after parent/SVG transform scaling | M2 | R2 |
| F03 | Deterministic Mobile Preview Lineage | Deterministic derivation of `preview-360x640.mp4` from `final-v3_3.mp4` via FFmpeg Lanczos resize | M3 | R3 |
| F04 | Full / Mobile Content Parity Validator | `validators/validate-preview-parity.ts` decoding real frames and enforcing PSNR >= 35dB & frame parity | M3 | R3 |
| F05 | Real Video Decoding (No Synthetic Buffers) | `validators/validate-preview-rubric.ts` elimination of Buffer.alloc mock fallback, real FFmpeg rawvideo decoding, fail closed | M3 | R4 |
| F06 | Progressive Disclosure Choreography | Enforce 1 primary idea per beat; eliminate simultaneous multi-card dumps; resolve 70.4s panel collision | M5 | R5, R15 |
| F07 | Canonical Semantic Timeline | `semantic-timeline.json` as single source of truth for all scene boundaries, durations, shots, cues; zero magic numbers | M5 | R6 |
| F08 | Real ShotSpec Validation & Motivated Transitions | `validators/validate-shot-spec.ts` strict separation of impact frames from transition windows, 8 motivated transitions | M2 | R7 |
| F09 | Single Audio Ownership & Routing | `validators/validate-audio-ownership.ts`, `audio-dependency-graph.json`, PREMIXED default, zero secondary `<Audio>`, zero music | M2 | R8 |
| F10 | Safe VieNeu TTS Default & Voice Routing | Default voice routes to VieNeu Adam; omit voice never routes to Kokoro `am_adam`; Vietnamese-first bilingual | M1 | R9 |
| F11 | Real Audio Metadata & Portability | Real WAV headers/ffprobe metadata validation; `validators/validate-portability.ts` asserting zero absolute machine paths | M2 | R10 |
| F12 | Content Coverage Mapping & Validator | `source-content-map.json` mapping 100% of source units; `validators/validate-source-coverage.ts` | M2 | R11 |
| F13 | Skill & Governance Hardening | `.agents/skills/educational-flat-motion/SKILL.md` 17 hard rules, `AGENTS.md` role separation, 0 runtime imports from `.agents/` | M1 | R12 |
| F14 | Canonical Acceptance Entrypoint | `npm run v3.3:gate` running all gates in fail-closed sequence | M4 | R13 |
| F15 | Adversarial Negative & Positive Fixture Suite | `tests/adversarial/` 12+ defective fixtures rejected 100% and 12+ positive baselines accepted 100% by real validators | M4 | R14 |
| F16 | Scopus Canary Migration | Eliminate 70.4s collision, reflow to 103.20s, render `final-v3_3.mp4` & `preview-360x640.mp4`, PREMIXED audio | M5 | R15 |
| F17 | Generalization Proof (3 Unseen Mini-Projects) | 3 unseen projects (science/mechanism, historical/process, technology/tutorial) passing `npm run v3.3:gate` | M6 | R16 |
| F18 | Independent Review & Quality Rubric | Independent evaluation across 18 categories (overall >= 4.5, min >= 4.0, critical >= 4.3, `qa-report.json`) | M7 | R17 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Governance, Production Policy & Voice Routing Contracts | F01, F10, F13 | None | PLANNED |
| M2 | Static, Acoustic & Portability Quality Gates | F02, F08, F09, F11, F12 | M1 | PLANNED |
| M3 | Real Video Decoding & Mobile Parity Quality Gates | F03, F04, F05 | M1 | PLANNED |
| M4 | Adversarial Fixture Suite & Canonical Acceptance Entrypoint | F14, F15 | M2, M3 | PLANNED |
| M5 | Scopus Canary Migration & Choreography Hardening | F06, F07, F16 | M1, M2, M3, M4 | PLANNED |
| M6 | Generalization Proof (3 Unseen Mini-Projects) | F17 | M4, M5 | PLANNED |
| M7 | Independent Review & Quality Rubric Certification | F18 | M1-M6 | PLANNED |

---

## Interface Contracts

### 1. Production Policy Contract (`production-policy.json`)
```typescript
export interface ProductionPolicy {
  version: "3.3.0";
  canvas: {
    width: 1080;
    height: 1920;
    aspectRatio: "9:16";
    fps: 30;
    preview: { width: 360; height: 640; scale: number };
    safeMargins: { horizontal: number; vertical: number; captionRegion: { top: number; bottom: number } };
  };
  typography: {
    minimums: { hero: 64; section: 48; card: 38; body: 34; secondary: 30; caption: 52; citation: 22 };
    enforceEffectiveScale: true;
    absoluteMobileFloor: 30;
  };
  audio: {
    policy: "narration-sfx";
    strategy: "PREMIXED";
    targetLoudnessLufs: -15.0;
    loudnessToleranceLufs: 1.0;
    truePeakCeilingDbTp: -1.8;
    sampleRate: 48000;
    channels: 2;
    bitDepth: 16;
    allowMusic: false;
    rolePauses: {
      withinClause: [number, number];
      normalSentence: [number, number];
      semanticTurn: [number, number];
      majorSectionTransition: [number, number];
      payoffRealization: [number, number];
      maxUnmotivatedPause: 0.85;
    };
  };
  speech: {
    primaryLanguage: "vi-VN";
    secondaryLanguage: "en";
    defaultEngine: "VieNeu-TTS";
    defaultVoice: "Adam";
    fallbackEngine: "Kokoro";
  };
  acceptance: {
    overallRubricMin: 4.50;
    floorRubricMin: 4.00;
    criticalRubricMin: 4.30;
    contentCoverageRatio: 1.00;
    maxAllowedTemporalSpikes: 0;
    maxAllowedAbsolutePaths: 0;
    maxAllowedDualAudioTags: 0;
  };
}
```

### 2. Semantic Timeline Contract (`semantic-timeline.json`)
```typescript
export interface SemanticBeat {
  id: string; // e.g. "beat_01"
  shotId: string; // e.g. "shot_01"
  narrationTokenRange: [number, number];
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
  visualIntent: string;
  primaryObject: string;
  cameraIntent: string;
  conceptId: string;
  sfxIntent?: { asset: string; frame: number; volume: number };
  captionIntent?: { displayText: string; layout: "bottom" | "top"; fontSize: number };
}

export interface SemanticTimeline {
  version: "3.3.0";
  compositionId: string;
  totalFrames: number;
  durationSec: number;
  fps: 30;
  beats: SemanticBeat[];
}
```

### 3. Audio Dependency Graph Contract (`audio-dependency-graph.json`)
```typescript
export interface AudioDependencyGraph {
  version: "3.3.0";
  strategy: "PREMIXED";
  masterAudio: string;
  remotionMounts: Array<{ file: string; tag: string; line: number }>;
  tracks: {
    narration: { source: string; mixedIntoMaster: boolean };
    sfx: Array<{ id: string; asset: string; frame: number; mixedIntoMaster: boolean }>;
  };
  runtimePlayback: {
    discreteAudioTagsCount: number; // MUST be 0
    duplicateSfxCount: number; // MUST be 0
  };
}
```

### 4. Source Content Mapping Contract (`source-content-map.json`)
```typescript
export interface SourceContentUnit {
  conceptId: string;
  conceptTitle: string;
  sourceDocument: string;
  beatId: string;
  narrationExcerpt: string;
  covered: boolean;
}

export interface SourceContentMap {
  version: "3.3.0";
  sourceDocument: string;
  totalUnits: number;
  coveredUnits: number;
  coveragePercent: number; // MUST be 100
  mappings: SourceContentUnit[];
}
```

---

## Code Layout
```
/home/hongphuoc6104/Desktop/videorenderhoathinh/
├── production-policy.json              # Canonical production policy (R1)
├── AGENTS.md                          # Two-tier governance and role invariants (R12)
├── .agents/
│   └── skills/educational-flat-motion/SKILL.md # Hardened with 17 non-negotiable hard rules (R12)
├── packages/
│   └── narration-kit/
│       └── src/
│           ├── pipeline/generateNarrationPipeline.ts # VieNeu Adam default voice routing (R9)
│           └── tts/voices.ts                         # Default voice configuration (R9)
├── validators/
│   ├── validate-mobile-typography.ts   # Effective transform scaling calculation (R2)
│   ├── validate-shot-spec.ts           # Separate impact vs transition frames (R7)
│   ├── validate-audio-ownership.ts     # PREMIXED single mount enforcement (R8)
│   ├── validate-audio-policy.ts        # Role-aware pause ranges (R17)
│   ├── validate-audio-mix.ts           # Measured WAV headers (sampleRate, channels, bitDepth) (R10)
│   ├── validate-portability.ts         # Zero machine-specific absolute paths (R10)
│   ├── validate-source-coverage.ts     # 100% curriculum coverage gate (R11)
│   ├── validate-preview-parity.ts      # Master vs preview PSNR & frame parity (R3)
│   ├── validate-preview-rubric.ts      # Real FFmpeg frame decoding, no Buffer.alloc (R4)
│   └── temporal-render-qa.ts           # Real MP4 temporal difference verification (R9)
├── scripts/
│   ├── generate-preview.ts             # Deterministic FFmpeg Lanczos resize (R3)
│   └── run-adversarial-suite.ts        # Real validator adversarial runner (R14)
├── tests/
│   └── adversarial/                    # 12+ defective fixtures & 12+ positive baselines (R14)
├── connection-film/
│   └── src/scopus-explainer/
│       ├── ScopusExplainerFilm.tsx     # Single master audio mount, timeline integration (R8, R15)
│       ├── semantic-timeline.json      # Canonical timeline (R6)
│       ├── source-content-map.json     # 100% source mapping (R11)
│       ├── shot-spec.json              # Validated shot transitions & impact frames (R7)
│       └── scenes/
│           └── Scene4TemplateCaseStudy.tsx # 70.4s panel collision eliminated (R5, R15)
├── mini-projects/                      # 3 Unseen mini-projects for generalization proof (R16)
│   ├── science-mechanism/
│   ├── historical-process/
│   └── tech-tutorial/
└── out/
    ├── final-v3_3.mp4                  # Full 1080x1920 30fps production render (R15)
    ├── preview-360x640.mp4             # Deterministic 360x640 preview render (R3, R15)
    └── qa-report.json                  # Independent review 18-category score report (R17)
```
