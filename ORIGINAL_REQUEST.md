# Original User Request

## Initial Request — 2026-09-09T17:01:43Z

Upgrade the educational flat vector motion animation system to V2 production grade, establishing a canonical self-contained `motion-kit`, decoupled character architecture, physics-backed performance profiles, continuous camera choreography, AST-based quality gates, temporal render QA, and independent evaluation on unseen tasks.

Working directory: /home/hongphuoc6104/Desktop/videorenderhoathinh
Integrity mode: benchmark

---

## Requirements

### R1. Canonical Single Package (`motion-kit`)
Package `motion-kit/` as an independent, canonical workspace package (with complete `package.json`, TypeScript definitions, and zero runtime imports from `.agents/skills`). Production video compositions and benchmarks must import solely from `motion-kit` or local project sources.

### R2. Articulated Character Architecture & Rig Interface
Replace the monolithic bird-specific rig with a decoupled architecture:
- `CharacterController`: High-level state, action sequencing, and profile coordinator.
- `RigInterface`: Explicit contract for character geometry, joints, transforms, and expressive layers.
- Implementations: `BirdRig`, `HumanRig`, and an `ArbitraryCustomRigAdapter` for third-party or arbitrary vector characters.

### R3. Physics-Backed Performance Profiles
Upgrade character actions (`anticipate`, `overshoot`, `settle`, `react`, `gesture`) to consume explicit `PerformanceProfile` types:
- Profiles: `calm`, `energetic`, `playful`, `dramatic`, `solemn`.
- Profiles must parameterize physics timing, squash ratios, overshoot amplitudes, follow-through lag, and settle oscillations — not merely adjust easing curves.

### R4. Camera Continuity System
Implement continuous camera tracking in `CameraRig`:
- Velocity-aware target tracking with look-ahead offsets.
- Functional damping that genuinely affects camera inertia (no inert damping parameters).
- Configurable dead-zone thresholds to prevent micro-jitter.
- C0 (positional) and C1 (velocity/derivative) continuity across sequential camera states and shot transitions.

### R5. Real Object & Geometry Morphing Machinery
Replace faux morphing (`morphTransition`) with true geometric interpolation:
- Interpolate SVG paths or coordinate matrices through vertex matching or intermediate blend geometry.
- Hard conditional binary swaps (`progress < X ? A : B`) during a claimed morph must be disallowed and caught by validators.

### R6. Bezier Path-Following Helpers
Implement exact path-following mathematical utilities:
- `quadraticBezierPoint(p0, p1, p2, t)`
- `cubicBezierPoint(p0, p1, p2, p3, t)`
- Path packet travel utility (calculating tangent angle, velocity, and coordinate along curve).
- Animated path reveal stroke coordinator.
- Any packet or particle declared to travel along a Bezier path must compute and follow its exact trajectory.

### R7. Recursive AST-Based Motion Linter
Replace regex-based string matching in `motion-lint.ts` with a robust TypeScript/Babel AST visitor:
- Traverse the abstract syntax tree to detect generic anti-patterns (e.g. monolithic inline SVGs without articulated groups, binary opacity crossfades masquerading as pose blending, unmotivated linear transforms, conditional component flips during morphs).
- Must detect semantic code patterns independent of project-specific naming conventions.

### R8. Temporal Render Quality Assurance
Create an automated video inspection tool (`temporal-render-qa.ts`):
- Decode rendered MP4 frames using FFmpeg / image processing.
- Compute rolling adjacent-frame mean absolute difference (MAD).
- Automatically flag and log any unannotated frame discontinuity exceeding ~4× the rolling local median.
- Whitelist legitimate high-velocity impact frames through explicit declarations in the `ShotSpec`.

### R9. Mandatory Composition ShotSpec
Require a validated `shot-spec.json` for every production and benchmark composition:
- Validate continuity between consecutive shots (`shot[N].end_state == shot[N+1].start_state`).
- Missing or malformed ShotSpec triggers immediate quality gate failure.

### R10. Audio & Cue Manifest Synchronization
Establish a unified cue manifest interface connecting visual timing markers in Remotion to audio events and sound design generation.

### R11. V2 Benchmarking on NEW Unseen Tasks
Benchmark the upgraded V2 production system against 2–3 entirely **NEW, unseen tasks** (e.g., Human conversational explainer, complex mechanical physics transformation, or multi-stage network protocol data flow).
- **CRITICAL:** Do NOT reuse or tune against the original 3 diagnostic benchmark sequences.

### R12. Independent Reviewer Quality Scoring
Benchmark scoring and validation must be performed by an independent reviewer agent/subagent with an objective rubric. The implementing agent is strictly forbidden from self-awarding acceptance scores.

---

## Acceptance Criteria

### Canonical Packaging & Architecture
- [ ] `motion-kit` compiles cleanly as a standalone TypeScript package with zero imports from `.agents/skills`.
- [ ] `CharacterController` drives both `BirdRig` and `HumanRig` through the unified `RigInterface`.
- [ ] Custom rig adapter demonstrates successful mounting of an arbitrary SVG character.

### Motion Dynamics & Physics
- [ ] High-level actions respond dynamically to all 5 `PerformanceProfile` presets (`calm`, `energetic`, `playful`, `dramatic`, `solemn`) with distinct squash, overshoot, and settle metrics.
- [ ] Camera tracking exhibits verifiable damping, dead-zone stillness, and look-ahead without C0/C1 velocity spikes.
- [ ] Path travel utility accurately places packets along quadratic and cubic Bezier coordinates.
- [ ] Geometric morphs perform continuous shape transformation without binary conditional swaps.

### Quality Gates & Verification
- [ ] `motion-lint.ts` AST engine detects anti-patterns structurally without regex false positives or variable name dependencies.
- [ ] `temporal-render-qa.ts` decodes rendered MP4s, calculates rolling frame difference medians, and flags unannotated spikes (>4× local median).
- [ ] Every active composition possesses a valid `shot-spec.json` passing automated validation.

### Deliverables & Benchmark Evaluation
- [ ] New unseen V2 benchmark sequences rendered to MP4.
- [ ] Independent reviewer agent scores all V2 benchmarks against `quality-rubric.md` (minimum threshold ≥ 4.5/5.0).
- [ ] Full Git commit and push to remote repository.
- [ ] Global installation deferred until all V2 criteria are independently certified.

## Follow-up — 2026-09-09T17:26:34Z

User request: "tiếp tục cả các agents đang bị limit ngừng lần trước". Hãy tiếp tục thực thi các milestone M2, M3, M4, M5 ngay lập tức. Nếu có lệnh spawn subagent con, hãy đảm bảo luôn dùng Model: "inherit" (hoặc không truyền Model) để tránh lỗi MODEL_PLACEHOLDER_M322.

## Follow-up — 2026-09-09T18:08:43Z

Build an offline-capable local narration, word-synchronized karaoke subtitle, and audio production subsystem (V3) for Remotion explainer animations with Kokoro-82M TTS and WhisperX forced alignment.

Working directory: /home/hongphuoc6104/Desktop/videorenderhoathinh
Integrity mode: development

## Requirements

### R1. Canonical Narration Package (`packages/narration-kit/`)
Implement a unified TypeScript package providing the end-to-end audio/narration pipeline:
- TTS interfaces and Kokoro provider (`src/tts/`)
- WhisperX local forced alignment provider and validators (`src/alignment/`)
- Punctuation & pause-aware caption segmentation (`src/captions/`)
- Audio ducking, loudness normalization, and audio manifest (`src/audio/`)
- Pipeline orchestration (`src/pipeline/generateNarrationPipeline.ts`)
Must be the single canonical runtime implementation imported by Remotion compositions.

### R2. Local Kokoro-82M TTS Engine
Generate high-fidelity local narration without cloud APIs:
- Default voice `am_adam`, configurable (`am_fenrir`, `am_michael`, `am_onyx`, etc.)
- Strict local generation producing 24kHz mono PCM WAV files
- Intermediate MP3 conversion prohibited

### R3. Offline Asset Management & Strict Network Guard
- Explicit setup command (`npm run narration:setup`) to prepare local model assets under `models/kokoro` and `models/alignment`
- Strict offline generation mode (`--offline`) with automated network guard rejecting any external HTTP/API request

### R4. Text Normalization & Narration Chunking
- Deterministic preprocessing preserving bidirectional mapping: original text -> normalized text -> spoken text
- Handles numbers, abbreviations, acronyms, URLs, punctuation, and quotes
- Emits inspectable `narration-text-map.json`

### R5. Deterministic Prosody System
- Reusable profiles (`documentary`, `educational`, `energetic`, `calm`, `dramatic`, `solemn`) controlling speed, pause duration, and chunk boundaries
- Integration with ShotSpec (`narration_profile`, `emphasis_words`, `pause_after`)

### R6. Local Word Alignment (WhisperX Forced Alignment)
- Use original script as authoritative transcript (no ASR hallucination or wording drift)
- Produce exact word-level timings (`start`, `end`, `confidence`) outputting `words.json`

### R7. Alignment Quality Gates
- Automated validation checking: non-negative start, strictly increasing timestamps, duration consistency, missing/extra spoken words, and silence anomalies

### R8. Caption Segmentation & Safe Area Placement
- Segment captions from word timings (1-2 lines, short phrase groups)
- ShotSpec integration avoiding subject regions (`bottom`, `lower-left`, `lower-right`, `top`, `auto`)
- Emits `captions.json`

### R9. Karaoke Caption Kit (`packages/caption-kit/`)
- Remotion React components: `KaraokeCaptions`, `KaraokeGroup`, `KaraokeLine`, `KaraokeWord`
- Frame-deterministic progressive fill (0% -> 100% highlight via clip-path/mask) across spoken word duration
- Educational art direction: clean controlled ease, neutral upcoming, accent active, muted spoken (no TikTok bouncing/shaking)

### R10. Audio Mixing & Cue Manifest Integration
- Multi-track mixing (`narration`, `music`, `SFX`) with automatic ducking attack/release envelopes
- Emits `audio-manifest.json` with duration mismatch and clipping validation
- Derive semantic animation cues (`WORD_EMPHASIS`, `SENTENCE_START`, `SENTENCE_END`) into V2 `CueManifest`

### R11. Automated QA & Temporal Karaoke Validation
- Suite of validators: `validate-narration.ts`, `validate-alignment.ts`, `validate-captions.ts`, `validate-caption-layout.ts`, `validate-audio-mix.ts`, `offline-network-guard.ts`
- Diagnostic frame rendering for visual caption layout check
- Temporal QA verifying strictly monotonic word highlight progression

### R12. Benchmarks & Voice Comparison
- Benchmark A: Standard Educational Narration (20-30s)
- Benchmark B: Difficult Technical Narration (numbers, acronyms, punctuation)
- Benchmark C: Rapid/Expressive Narration (variable pauses, prosody)
- Voice Comparison: Multi-voice render (`am_adam`, `am_fenrir`, `am_michael`, `am_onyx`)
- All benchmarks produce `script.txt`, `narration.wav`, `narration-text-map.json`, `words.json`, `captions.json`, `audio-manifest.json`, and rendered MP4 video

## Acceptance Criteria

### Automated Verification
- [ ] `npm run narration:setup` installs local models into `models/` without global pollution
- [ ] `packages/narration-kit` and `packages/caption-kit` compile with TypeScript without errors
- [ ] All validators pass with 0 exit code on Benchmark A, B, and C
- [ ] Offline guard test passes with network disabled (`--offline` succeeds without network)
- [ ] Benchmark A, B, C and Voice Comparison MP4 videos render cleanly in `out/v3/`
- [ ] Diagnostic frames confirm captions stay within safe margin and avoid subject region
- [ ] Temporal karaoke QA confirms highlight progression is strictly monotonic (0% -> 100%)

### Deliverables
- [ ] `packages/narration-kit/`
- [ ] `packages/caption-kit/`
- [ ] `models/README.md`
- [ ] `validators/`
- [ ] `out/v3/benchmark-a/`, `out/v3/benchmark-b/`, `out/v3/benchmark-c/`, `out/v3/voice-comparison/`
- [ ] `benchmark-v3-report.md`
