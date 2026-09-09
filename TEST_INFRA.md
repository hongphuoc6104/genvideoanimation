# TEST_INFRA.md — Master Test Infrastructure Specification
**Project:** Educational Flat Vector Motion & Narration System (V2 Motion & V3 Narration/Karaoke)
**Working Directory:** `/home/hongphuoc6104/Desktop/videorenderhoathinh`
**Authoritative Sources:** `ORIGINAL_REQUEST.md` (V2 Initial + V3 Follow-up), `PROJECT.md`, `SCOPE.md`

---

# PART II: V3 NARRATION, KARAOKE & AUDIO PRODUCTION TEST INFRASTRUCTURE

# TEST_INFRA.md — Master Test Infrastructure Specification
**Project:** V3 Narration, Word-Synchronized Karaoke Subsystem & Audio Production Upgrade  
**Version:** 3.0.0-PROD  
**Working Directory:** `/home/hongphuoc6104/Desktop/videorenderhoathinh`  
**Authoritative Sources:** `ORIGINAL_REQUEST.md` (Follow-up 2026-09-09T18:08:43Z: R1–R12), `.agents/orchestrator_3/PROJECT.md` (F01–F40), `.agents/sub_orch_e2e/SCOPE.md`

---

## 1. Test Philosophy & Architecture

The V3 Narration & Karaoke Subsystem test suite operates under four non-negotiable architectural principles:

### 1.1 Opaque-Box, Requirement-Driven Testing
All tests derive strictly from requirements R1–R12 and features F01–F40. Tests interact solely through public module contracts, filesystem artifacts, CLI signatures, and binary audio/video data streams. Tests never bind to internal implementation details or private variables.

### 1.2 Progressive Testability & Graceful Degradation
The test suite is executable at any milestone (M1 through M6). When a module or export is not yet implemented, test cases catch module resolution errors cleanly and report `NOT_IMPLEMENTED` (rendered as yellow `? PEND`), allowing exit code `0` in standard development mode while asserting strict mathematical and schema contracts against canonical fixture data. A test only reports `FAIL` if the targeted feature is present but violates its contract.

### 1.3 Strict Zero-Dependency Policy
The test runner and assertion harness are implemented in pure TypeScript and native Node.js 20+ APIs (`node:assert/strict`, `node:fs`, `node:path`, `node:perf_hooks`, `node:url`). Heavyweight test runners (Jest, Vitest, Mocha) are strictly forbidden to prevent ESM/CJS bundling conflicts and dependency bloat.

### 1.4 Strict Offline & Air-Gapped Enforcement (`--offline`)
All synthesis, alignment, caption generation, and rendering operate strictly offline without external cloud APIs. The suite includes an automated network guard (`offline-network-guard.ts`) that intercepts outbound HTTP, HTTPS, TCP, UDP, and DNS calls, ensuring zero leaks.

---

## 2. Feature Inventory Mapping & Coverage Invariants

The V3 framework covers all 40 features (F01–F40) across 4 testing tiers:

| # | Feature | Category | Tier 1 (Happy) | Tier 2 (Boundary) | Tier 3 (Combos) | Tier 4 (Scenarios) | Total |
|---|---------|----------|:---:|:---:|:---:|:---:|:---:|
| F01 | Canonical `narration-kit` | Packaging | 5 | 5 | T3-40 | S01, S04, S10 | 14 |
| F02 | Kokoro-82M TTS Local Engine | Speech | 5 | 5 | T3-02,04,05,26 | S01, S02, S15 | 17 |
| F03 | Voice Customization Presets | Speech | 5 | 5 | T3-04,23 | S03, S04 | 14 |
| F04 | Zero Intermediate MP3 | Speech | 5 | 5 | T3-04 | S01, S08 | 13 |
| F05 | Model Setup Utility | Models | 5 | 5 | T3-17 | S05, S12 | 13 |
| F06 | Strict Offline Network Guard | Security | 5 | 5 | T3-16,17,35 | S05, S15, S18 | 16 |
| F07 | Models Documentation | Models | 5 | 5 | T3-17 | S05 | 12 |
| F08 | Text Normalizer | Text | 5 | 5 | T3-01,02,22,39 | S02, S06, S11 | 17 |
| F09 | Bidirectional Text Map | Text | 5 | 5 | T3-01,03,28,39 | S02, S06 | 16 |
| F10 | Prosody Profiles Engine | Prosody | 5 | 5 | T3-02,05,21 | S03, S07, S12, S14 | 17 |
| F11 | ShotSpec Prosody Binding | Prosody | 5 | 5 | T3-05,14,38 | S07, S13 | 15 |
| F12 | WhisperX Forced Alignment | Alignment | 5 | 5 | T3-01,06,23 | S01, S09, S17 | 15 |
| F13 | Word Timing Output | Alignment | 5 | 5 | T3-03,06,10,14,23,39 | S01, S09 | 18 |
| F14 | Alignment Quality Gates | Alignment | 5 | 5 | T3-03,27 | S09, S17 | 14 |
| F15 | Caption Segmentation | Captions | 5 | 5 | T3-06,07,15,22,27 | S04, S10, S20 | 18 |
| F16 | Safe Area Placement Planner | Layout | 5 | 5 | T3-07,08,24,29 | S04, S05, S10, S14 | 18 |
| F17 | Captions Artifact Output | Captions | 5 | 5 | T3-07,09,29,39 | S04, S10 | 16 |
| F18 | Multi-Track Audio Mixer | Audio | 5 | 5 | T3-12,21,26,38 | S08, S12, S18 | 17 |
| F19 | Dynamic Ducking Envelopes | Audio | 5 | 5 | T3-12,13,21,30,38 | S08, S12 | 17 |
| F20 | Audio Manifest Output | Audio | 5 | 5 | T3-12,13,20,30 | S08, S12 | 16 |
| F21 | Semantic Animation Cues | Cues | 5 | 5 | T3-14,15,25,28,30 | S07, S13, S14 | 18 |
| F22 | Canonical `caption-kit` | UI | 5 | 5 | T3-09,40 | S04, S11 | 14 |
| F23 | `KaraokeWord` Progressive Fill | UI | 5 | 5 | T3-10,11,37 | S04, S11 | 15 |
| F24 | `KaraokeLine` & `KaraokeGroup` | UI | 5 | 5 | T3-11,25,29 | S04, S11 | 15 |
| F25 | Educational Art Direction | UI | 5 | 5 | T3-11,25 | S04, S11 | 14 |
| F26 | `KaraokeCaptions` Coordinator | UI | 5 | 5 | T3-08,09,15,24,37 | S04, S10 | 17 |
| F27 | Unified Pipeline Runner | Pipeline | 5 | 5 | T3-16,18,19,20,28,31-34,40 | S01, S06, S20 | 21 |
| F28 | Validator `validate-narration.ts` | QA | 5 | 5 | T3-13,18,36 | S01, S08 | 15 |
| F29 | Validator `validate-alignment.ts` | QA | 5 | 5 | T3-18,27,36 | S01, S09 | 15 |
| F30 | Validator `validate-captions.ts` | QA | 5 | 5 | T3-19,22,36 | S04, S10 | 15 |
| F31 | Validator `validate-caption-layout.ts` | QA | 5 | 5 | T3-08,19,36 | S04, S05, S10 | 15 |
| F32 | Validator `validate-audio-mix.ts` | QA | 5 | 5 | T3-13,20,26,36 | S08, S12, S16 | 16 |
| F33 | Validator `offline-network-guard.ts` | QA | 5 | 5 | T3-16,35,36 | S05, S15, S18 | 16 |
| F34 | Diagnostic Frame Renderer | QA | 5 | 5 | T3-24 | S04, S14, S19 | 14 |
| F35 | Temporal Monotonic QA | QA | 5 | 5 | T3-10,37 | S04, S11 | 14 |
| F36 | Benchmark A Execution | Benchmark | 5 | 5 | T3-31,35 | S01, S19, S20 | 15 |
| F37 | Benchmark B Execution | Benchmark | 5 | 5 | T3-32 | S02, S20 | 14 |
| F38 | Benchmark C Execution | Benchmark | 5 | 5 | T3-33 | S03, S20 | 14 |
| F39 | Voice Comparison Execution | Benchmark | 5 | 5 | T3-34 | S04, S20 | 14 |
| F40 | Comprehensive Report | Benchmark | 5 | 5 | T3-31,32,33,34 | S01, S02, S03, S20 | 16 |

### Exact Coverage Invariant:
$$\text{Total Test Cases} = \text{Tier 1 } (200) + \text{Tier 2 } (200) + \text{Tier 3 } (40) + \text{Tier 4 } (20) = 460 \ge 460 \quad [\text{PASS}]$$

---

## 3. Test Harness Architecture & Interfaces

The test harness resides under `tests/e2e/harness/`:

### 3.1 `assert.ts`
Zero-dependency domain assertion library built on `node:assert/strict`:
- `assertTrue(cond, msg)`, `assertFalse(cond, msg)`
- `assertEqual(actual, expected, msg)`, `assertNotEqual(actual, expected, msg)`
- `assertDeepEqual(actual, expected, msg)`
- `assertClose(actual, expected, tolerance, msg)`, `assertArrayClose(...)`
- `assertInRange(val, min, max, msg)`
- `assertMonotonic(numbers, strict, msg)`: Enforces temporal ordering ($t_{i+1} > t_i$ or $t_{i+1} \ge t_i$)
- `assertNoOverlap(intervals, msg)`: Ensures intervals do not overlap ($start_{i+1} \ge end_i$)
- `assertThrows(fn, regex|type, msg)`, `assertAsyncThrows(fn, regex|type, msg)`
- `assertSchema(data, rules, msg)`: Validates object shapes and field types
- `assertWavHeader(buffer, sampleRate, channels, bitsPerSample)`: Decodes RIFF/WAVE headers

### 3.2 `test-context.ts`
Lifecycle, registry, and progressive resolution:
- `TestContext`: Per-test sandbox providing `log()`, `skip(reason)`, `notImplemented(reason)`, `createTempDir()`, `cleanupTempDirs()`.
- `TestSuite`: Encapsulates test lists with `beforeAll`, `afterAll`, `beforeEach`, `afterEach` hooks.
- `TestRegistry`: Singleton registry managing suites and preventing duplicate registrations.
- `resolveOptionalModule(path)`: Safely attempts dynamic module import without crashing if absent.

### 3.3 `fixtures.ts`
Canonical reference inputs and mock generators:
- `TEXT_FIXTURES`: Canonical scripts (`SHORT`, `TECHNICAL`, `NUMBERS_AND_SYMBOLS`, `EXPRESSIVE`, `EMPTY`).
- `SHOTSPEC_FIXTURES`: Validated ShotSpecs (`DEFAULT_EDUCATIONAL`, `WITH_SUBJECT_BOTTOM`, `VERTICAL_SHORT`).
- `createMockWavBuffer(opts)`: Memory-efficient 16-bit PCM RIFF WAV synthesizer (configurable sample rate, channels, duration, frequency, amplitude).
- `MOCK_NARRATION_TEXT_MAP`, `MOCK_WORDS_JSON`, `MOCK_CAPTIONS_JSON`, `MOCK_AUDIO_MANIFEST_JSON`, `MOCK_CUE_MANIFEST_JSON`: Strict schema-compliant mock objects.

### 3.4 `runner.ts`
Core execution loop supporting:
- Auto-discovery across all 4 tier folders (`tier1-features`, `tier2-boundaries`, `tier3-combinations`, `tier4-applications`).
- Per-test timeout handling (default 5000ms).
- Sandboxed execution with auto-cleanup of temp directories.
- 3 Multi-format reporters:
  1. Pretty Console ANSI reporter with hierarchical summary matrix.
  2. Machine-readable JSON reporter (`--json`).
  3. Test Anything Protocol v13 reporter (`--tap`).

---

## 4. Directory Layout & Module Structure

```
tests/e2e/
├── harness/
│   ├── assert.ts                         # Zero-dependency domain assertion library
│   ├── test-context.ts                   # Types, TestContext, TestRegistry, progressive loader
│   ├── fixtures.ts                       # Canonical scripts, ShotSpecs, WAV generator, mock JSON
│   └── runner.ts                         # Master runner engine, CLI argument parser, reporters
├── run-e2e-tests.ts                      # Standalone CLI entry point (npm run test:v3)
├── tier1-features/                       # Tier 1: 200 isolated feature coverage tests
│   ├── f01-canonical-narration-kit.test.ts
│   ├── ...
│   └── f40-comprehensive-report.test.ts
├── tier2-boundaries/                     # Tier 2: 200 boundary, limit, and corner-case tests
│   ├── f01-canonical-narration-kit.boundary.test.ts
│   ├── ...
│   └── f40-comprehensive-report.boundary.test.ts
├── tier3-combinations/                   # Tier 3: 40 pairwise cross-feature interaction tests
│   ├── pipeline-stages.test.ts           # T3-COMB-01 to T3-COMB-10 (Normalize + TTS + Align)
│   ├── captions-layout.test.ts           # T3-COMB-11 to T3-COMB-20 (Captions + Safe Area + Audio Mix)
│   ├── audio-cues.test.ts                # T3-COMB-21 to T3-COMB-30 (Ducking Recovery + SFX + Cues)
│   └── qa-governance.test.ts             # T3-COMB-31 to T3-COMB-40 (Offline + Validators + Benchmarks)
└── tier4-applications/                   # Tier 4: 20 realistic application scenarios
    ├── scenarios-part1.test.ts           # T4-APP-01 to T4-APP-10 (Benchmarks A, B, C, Voices, Safe Area)
    └── scenarios-part2.test.ts           # T4-APP-11 to T4-APP-20 (Air-Gapped, EBU R128, Diagnostic Frames)
```

---

## 5. Test Tier Breakdown & Methodology

1. **Tier 1 — Feature Coverage (200 Tests):**
   - 40 features $\times$ 5 test cases.
   - Tests isolated feature entry points, interface shapes, schemas, and nominal behavior.
2. **Tier 2 — Boundary & Corner Cases (200 Tests):**
   - 40 features $\times$ 5 test cases.
   - Tests extreme inputs, null/empty strings, corrupt WAV buffers, out-of-bounds CPS (>25), reverse timestamps, safe-area collisions, and NaN telemetry.
3. **Tier 3 — Cross-Feature Pairwise Interactions (40 Tests):**
   - 4 files $\times$ 10 test cases.
   - Validates data exchange between pipeline stages (e.g. Normalizer $\to$ Aligner, Aligner $\to$ Caption Segmenter, Segmenter $\to$ Remotion Layout, Mixer $\to$ Cue Manifest).
4. **Tier 4 — Real-World Application Scenarios (20 Tests):**
   - 2 files $\times$ 10 test cases.
   - Exercises realistic end-to-end explainer sequences (biology explainer, technical computing deep dive, startup pitch, multi-voice comparison, 9:16 vertical shorts, 1:1 square feeds, broadcast loudness, dialogue with heavy punctuation).

---

## 6. Execution Commands & CLI Reference

### Primary Execution Commands:
```bash
# Execute master test runner
npx tsx tests/e2e/run-e2e-tests.ts

# Via npm scripts
npm run test:v3
npm run test:e2e

# Run specific tier
npm run test:v3 -- --tier 3
npm run test:v3 -- --tier 4

# Run with verbose logs
npm run test:v3 -- --verbose

# Run with JSON output to file
npm run test:v3 -- --json --output=out/e2e-summary.json
```

### CLI Flag Matrix:
| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--tier=<1\|2\|3\|4\|all>` | `-t` | `all` | Filter execution to specified test tier |
| `--feature=<code>` | `-f` | none | Filter tests matching feature code (e.g. `F08`, `F15`) |
| `--filter=<regex>` | `-k` | none | Filter tests by name or ID pattern |
| `--scenario=<id>` | none | none | Filter tests matching scenario ID (e.g. `T4-APP-01`) |
| `--verbose` | `-v` | `false` | Display detailed per-test logs and error stacks |
| `--bail` | `-b` | `false` | Terminate runner immediately on first test failure |
| `--strict` | `-s` | `false` | Treat `NOT_IMPLEMENTED` as a failure (exit code 1) |
| `--json` | `-j` | `false` | Output results in JSON format |
| `--tap` | none | `false` | Output results in TAP v13 format |
| `--output=<path>` | `-o` | none | Save JSON summary to specified file path |
| `--timeout=<ms>` | none | `5000` | Override default test timeout in milliseconds |
| `--dry-run` | `-d` | `false` | List matching tests without executing them |
| `--help` | `-h` | none | Show command usage and options |

---

## 7. Interface Contracts & Validator CLI Standards

### 7.1 Interface Schemas
1. **`narration-text-map.json`**: Bidirectional character spans (`originalSpan`, `originalWord`, `spokenWords`, `type`).
2. **`words.json`**: Aligned token timings (`id`, `word`, `cleanWord`, `start`, `end`, `confidence`, `punctuation`).
3. **`captions.json`**: Screen-placed caption groups (`id`, `startFrame`, `endFrame`, `startTime`, `endTime`, `box`, `lines`).
4. **`audio-manifest.json`**: Multi-track mix metadata (`tracks`, `ducking`, `output`: 48kHz, -16.0 +/- 1.5 LUFS, true-peak <= -1.0 dBFS).
5. **`CueManifest`**: Synchronized Remotion visual and audio markers (`SENTENCE_START`, `SENTENCE_END`, `WORD_EMPHASIS`).

### 7.2 Validator CLI Standards
All 6 validators in `validators/` support CLI execution and exit with code `0` on PASS, `1` on FAIL:
- `validate-narration.ts <wav-file>`: 24kHz mono PCM WAV, true peak <= -1.0 dBFS, zero clipping.
- `validate-alignment.ts --words <words.json> --script <script.txt>`: Monotonicity, non-overlap, 1:1 token matching.
- `validate-captions.ts <captions.json>`: <=2 lines, <=42 chars/line, <=21 CPS, duration [0.8s, 7.0s].
- `validate-caption-layout.ts --captions <captions.json> --shot-spec <shot-spec.json>`: Safe margins >= 96px, zero AABB collision with `subject_region`.
- `validate-audio-mix.ts --manifest <manifest.json> --audio <soundtrack.wav>`: Sync delta <= 0.1s, ducking >= 10dB, LUFS -16 +/- 1.5.
- `offline-network-guard.ts -- <command>`: Zero outbound socket/DNS calls under `--offline`.

---

## 8. CI/CD Integration & TEST_READY.md Protocol

Once all test tiers pass verification, the system emits `TEST_READY.md` containing:
1. Timestamped certification of all 460 test cases.
2. Verified pass rate metrics across Tiers 1–4.
3. Checksums of all test suites and harness files.
4. Reproduction commands for continuous integration gates.


---

# PART I: V2 MOTION ANIMATION SYSTEM TEST INFRASTRUCTURE

# TEST_INFRA.md — Master Test Infrastructure Specification
**Project:** V2 Motion Animation System Upgrade  
**Version:** 2.0.0-draft  
**Working Directory:** `/home/hongphuoc6104/Desktop/videorenderhoathinh`  
**Authoritative Sources:** `ORIGINAL_REQUEST.md`, `PROJECT.md`, `.agents/sub_orch_e2e_testing/SCOPE.md`, `spec_analysis.md`

---

## 1. Test Philosophy

The V2 Motion Animation System test suite operates under four non-negotiable architectural principles:

### 1.1 Opaque-Box, Requirement-Driven Testing
All tests are derived directly from user requirements (`ORIGINAL_REQUEST.md`) and project contracts (`PROJECT.md`). Tests exercise public module APIs, mathematical invariants, CLI interfaces, and raw video streams. They do not bind to private internal state, private helper functions, or ephemeral implementation artifacts.

### 1.2 Progressive Testability & Graceful Fallbacks
The test suite can be run at **any milestone** of project execution (M1 through M6). When a module or export is not yet implemented, test cases cleanly catch module resolution failures and report `NOT_IMPLEMENTED` without crashing the master runner process or producing false negative failures. A test only reports `FAIL` if the targeted feature is present but violates its behavioral, mathematical, or structural contract.

### 1.3 Mathematical Invariants & Physical Rigor
Animation quality in V2 is treated as a verifiable mathematical discipline:
- Bezier curves must follow exact cubic/quadratic equations and their analytical first derivatives.
- Physical performance profiles must produce distinct, measurable squash factors, overshoot amplitudes, and harmonic settle decay rates.
- Camera paths must satisfy $C^0$ (positional) and $C^1$ (velocity) continuity equations across shot boundaries without acceleration spikes.
- Temporal video quality is audited via raw luminance frame decoding and rolling local median MAD ratios ($>4.0\times$).

### 1.4 Zero External Runtime Test Dependencies
The master test runner is completely self-contained in pure TypeScript/Node.js (`tests/e2e-runner.ts` executed via `npx tsx`), eliminating heavyweight, brittle test frameworks (Jest, Vitest, Mocha) and their associated ESM/CJS or React 19 JSX bundling conflicts.

---

## 2. Feature Inventory Mapping & Coverage Thresholds

All 20 high-level system features mapped across the 4 testing tiers.

| # | Feature Code | Feature Name & Scope | Tier 1 (Happy) | Tier 2 (Boundary) | Tier 3 (Combos) | Tier 4 (Scenarios) | Total Tests |
|---|:---|:---|:---:|:---:|:---:|:---:|:---:|
| 1 | `F-PKG-CANONICAL` | Canonical `motion-kit` package, package.json, exports | 5 | 5 | ✓ (T3-17) | ✓ (T4-10) | 12 |
| 2 | `F-PKG-ISOLATION` | Import isolation (0 runtime imports from `.agents/skills`) | 5 | 5 | ✓ (T3-17) | ✓ (T4-10) | 12 |
| 3 | `F-RIG-INTERFACE` | `RigInterface` contract, joint hierarchy, geometry layers | 5 | 5 | ✓ (T3-12) | ✓ (T4-01,07) | 13 |
| 4 | `F-CHAR-CONTROLLER` | `CharacterController` action queue & profile coordinator | 5 | 5 | ✓ (T3-02,09,19) | ✓ (T4-01,08) | 15 |
| 5 | `F-RIG-BIRD` | Articulated `BirdRig` avian anatomy & flight kinematics | 5 | 5 | ✓ (T3-11) | ✓ (T4-07) | 12 |
| 6 | `F-RIG-HUMAN` | Articulated `HumanRig` humanoid anatomy & facial phonemes | 5 | 5 | ✓ (T3-01) | ✓ (T4-01) | 12 |
| 7 | `F-RIG-CUSTOM` | `ArbitraryCustomRigAdapter` third-party SVG character mount | 5 | 5 | ✓ (T3-09) | ✓ (T4-03,08) | 13 |
| 8 | `F-PHYSICS-PROFILES` | 5 `PerformanceProfile` presets (calm, energetic, playful, dramatic, solemn) | 5 | 5 | ✓ (T3-01,11) | ✓ (T4-01,02) | 14 |
| 9 | `F-PROFILE-ACTIONS` | Profile-driven actions (anticipate, overshoot, settle, react, gesture) | 5 | 5 | ✓ (T3-02,15) | ✓ (T4-01) | 13 |
| 10 | `F-CAM-TRACKING` | Velocity-aware camera target tracking & look-ahead offset | 5 | 5 | ✓ (T3-03,13) | ✓ (T4-01,03) | 14 |
| 11 | `F-CAM-DAMPING` | 2nd-order critically damped spring camera inertia & dead-zone | 5 | 5 | ✓ (T3-03,04) | ✓ (T4-01,02) | 14 |
| 12 | `F-CAM-CONTINUITY` | Hermite spline $C^0$ and $C^1$ camera continuity across shots | 5 | 5 | ✓ (T3-04,14,18) | ✓ (T4-02,04) | 15 |
| 13 | `F-MORPH-RESAMPLE` | Arc-length equidistant vertex resampling & cyclic phase shift | 5 | 5 | ✓ (T3-07) | ✓ (T4-02) | 12 |
| 14 | `F-MORPH-INTERPOLATE` | True continuous geometric path morphing (0% ternary swaps) | 5 | 5 | ✓ (T3-07,08,20) | ✓ (T4-02) | 14 |
| 15 | `F-BEZIER-MATH` | Exact quadratic & cubic Bezier point evaluation | 5 | 5 | ✓ (T3-05) | ✓ (T4-03) | 12 |
| 16 | `F-BEZIER-DYNAMICS` | Bezier first derivatives, tangents $\theta = \arctan2(\dot{y}, \dot{x})$, & velocity | 5 | 5 | ✓ (T3-05,06) | ✓ (T4-03) | 13 |
| 17 | `F-BEZIER-TRAVEL` | Arc-length LUT packet travel & animated stroke reveal | 5 | 5 | ✓ (T3-06,13,16) | ✓ (T4-03) | 14 |
| 18 | `F-AST-LINTER` | Recursive AST motion linter detecting semantic anti-patterns | 5 | 5 | ✓ (T3-08,12,18,19) | ✓ (T4-05,10) | 16 |
| 19 | `F-TEMPORAL-QA` | FFmpeg rawvideo decoding & rolling MAD spike QA ($>4\times$ median) | 5 | 5 | ✓ (T3-10,20) | ✓ (T4-06,10) | 14 |
| 20 | `F-SHOTSPEC-CUES` | ShotSpec continuity validator & cue manifest audio sync | 5 | 5 | ✓ (T3-10,14,15,16) | ✓ (T4-04,09,10) | 17 |
| **Total** | | | **100** | **100** | **20** | **10** | **230** |

### Coverage Threshold Invariant
$$\text{Total Test Count} = 100 + 100 + 20 + 10 = 230$$
$$\text{Threshold Condition: } 230 \ge 11 \times 20 + \max(5, 10) = 220 + 10 = 230 \quad \text{[PASSED: Exact Match]}$$

---

## 3. Test Architecture

### 3.1 Test Runner CLI
- **Command:** `npx tsx tests/e2e-runner.ts [options]`
- **Flags:**
  - `--tier=<1|2|3|4>`: Restrict test run to specified tier.
  - `--feature=<code|name>`: Filter tests by feature code (e.g. `--feature=F-CAM-TRACKING`).
  - `--scenario=<id>`: Run a specific scenario by ID (e.g. `--scenario=T4-SCEN-01`).
  - `--verbose`: Output detailed per-assertion telemetry and intermediate calculation outputs.
  - `--bail`: Stop execution immediately on the first assertion failure.
  - `--json`: Emit complete machine-readable test summary to stdout or file.

### 3.2 Harness Interfaces (`tests/harness/test-types.ts`)
```typescript
export type TestStatus = 'PASS' | 'FAIL' | 'NOT_IMPLEMENTED' | 'SKIPPED';

export interface TestCase {
  id: string;                         // e.g. T1-PKG-01, T3-COMB-05, T4-SCEN-02
  tier: 1 | 2 | 3 | 4;
  feature: string;                    // Feature code or primary feature
  name: string;
  description: string;
  run: () => Promise<void> | void;
}

export interface TestResult {
  id: string;
  name: string;
  tier: number;
  feature: string;
  status: TestStatus;
  durationMs: number;
  error?: Error;
  telemetry?: Record<string, any>;
}

export interface SuiteSummary {
  total: number;
  passed: number;
  failed: number;
  notImplemented: number;
  skipped: number;
  durationMs: number;
  results: TestResult[];
}
```

### 3.3 Assertion Library (`tests/harness/assert.ts`)
Provides strict, deterministic assertion helpers:
- `assertEqual<T>(actual: T, expected: T, message?: string)`: Strict `===` comparison.
- `assertDeepEqual<T>(actual: T, expected: T, message?: string)`: Recursive structural deep equality.
- `assertClose(actual: number, expected: number, tolerance: number, message?: string)`: Floating-point precision check ($|actual - expected| \le tolerance$).
- `assertInRange(val: number, min: number, max: number, message?: string)`: Numerical range bounds verification.
- `assertThrows(fn: () => void, errorTypeOrMatcher?: any, message?: string)`: Synchronous exception assertion.
- `assertThrowsAsync(fn: () => Promise<void>, errorTypeOrMatcher?: any, message?: string)`: Asynchronous rejection assertion.
- `assertValidJsonSchema(data: any, schema: object, message?: string)`: AJV schema validation.

### 3.4 Directory Layout
```
tests/
├── e2e-runner.ts                     # Master CLI test runner
├── harness/
│   ├── test-types.ts                 # Test interfaces and status definitions
│   ├── assert.ts                     # Strict assertion utilities
│   ├── loader.ts                     # Dynamic progressive module resolver
│   └── fixtures/                     # Test data fixtures (SVGs, shot-specs, cues, AST samples)
├── tier1-features/                   # 100 happy-path tests (5 per feature)
├── tier2-boundaries/                 # 100 boundary & corner tests (5 per feature)
├── tier3-combinations/               # 20 pairwise cross-feature interaction tests
└── tier4-scenarios/                  # 10 real-world end-to-end application scenarios
```

### 3.5 Progressive Resolution Architecture
To execute safely prior to full milestone completion:
```typescript
export async function resolveOptionalModule<T>(modulePath: string): Promise<T | null> {
  try {
    return await import(modulePath);
  } catch (err: any) {
    if (err.code === 'ERR_MODULE_NOT_FOUND' || err.message.includes('Cannot find module')) {
      return null;
    }
    throw err;
  }
}
```
If `resolveOptionalModule` returns `null`, the test case registers `NOT_IMPLEMENTED` and terminates safely.

---

## 4. Tier 3: Cross-Feature Combinations (20 Pairwise Tests)

Tier 3 rigorously evaluates cross-module boundaries and mathematical interaction invariants between distinct subsystems.

```
| Test ID | Primary Feature | Secondary Feature | Interaction Target |
|:---|:---|:---|:---|
| T3-COMB-01 | F-RIG-HUMAN | F-PHYSICS-PROFILES | Joint articulation driven by 5 physics profiles |
| T3-COMB-02 | F-CHAR-CONTROLLER | F-PROFILE-ACTIONS | Action sequence blending & anticipation/settle continuity |
| T3-COMB-03 | F-CAM-TRACKING | F-CAM-DAMPING | Velocity look-ahead with 2nd-order critically damped filter |
| T3-COMB-04 | F-CAM-DAMPING | F-CAM-CONTINUITY | Spring-damper ODE across Hermite C0/C1 boundary transitions |
| T3-COMB-05 | F-BEZIER-MATH | F-BEZIER-DYNAMICS | Cubic coordinates vs analytical derivatives & tangent angles |
| T3-COMB-06 | F-BEZIER-DYNAMICS | F-BEZIER-TRAVEL | Arc-length LUT constant velocity & dynamic tangent alignment |
| T3-COMB-07 | F-MORPH-RESAMPLE | F-MORPH-INTERPOLATE | Vertex equidistant resampling with cyclic phase shift minimization |
| T3-COMB-08 | F-MORPH-INTERPOLATE | F-AST-LINTER | Geometric morph validation vs ternary conditional flip detection |
| T3-COMB-09 | F-RIG-CUSTOM | F-CHAR-CONTROLLER | Arbitrary SVG joint mapping and hierarchical action driving |
| T3-COMB-10 | F-SHOTSPEC-CUES | F-TEMPORAL-QA | ShotSpec impact frame whitelisting vs rolling MAD spike filter |
| T3-COMB-11 | F-RIG-BIRD | F-PHYSICS-PROFILES | Avian wing flap frequency & touchdown squash across profiles |
| T3-COMB-12 | F-RIG-INTERFACE | F-AST-LINTER | Structural joint hierarchy verification via AST visitor |
| T3-COMB-13 | F-BEZIER-TRAVEL | F-CAM-TRACKING | Camera tracking a packet on a curved Bezier trajectory |
| T3-COMB-14 | F-SHOTSPEC-CUES | F-CAM-CONTINUITY | ShotSpec inter-shot state contract vs Hermite spline evaluation |
| T3-COMB-15 | F-SHOTSPEC-CUES | F-PROFILE-ACTIONS | Key beat profile annotations driving character action dynamics |
| T3-COMB-16 | F-BEZIER-TRAVEL | F-SHOTSPEC-CUES | Bezier packet arrival timing aligned with audio cue manifest |
| T3-COMB-17 | F-PKG-CANONICAL | F-PKG-ISOLATION | Standalone package exports audit & zero .agents import gate |
| T3-COMB-18 | F-AST-LINTER | F-CAM-CONTINUITY | AST detection of unmotivated zoom vs compliant Hermite camera |
| T3-COMB-19 | F-AST-LINTER | F-CHAR-CONTROLLER | AST detection of opacity pose crossfade vs controller pose blending |
| T3-COMB-20 | F-TEMPORAL-QA | F-MORPH-INTERPOLATE | Video frame MAD continuity during geometric morph vs binary swap |
```

### Detailed Specifications for Tier 3 Tests

#### `T3-COMB-01`: Human Rig Joint Dynamics Across All 5 Physics Profiles
- **Features Combined:** `F-RIG-HUMAN` + `F-PHYSICS-PROFILES`
- **Interaction Rationale:** An articulated human rig must exhibit physically distinguishable joint displacements, squash deformations, and oscillation counts when commanded by different performance profiles.
- **Inputs:** `HumanRig` instance; gesture action executed under profiles: `calm`, `energetic`, `playful`, `dramatic`, `solemn`.
- **Outputs:** Pose joints (`torso`, `armRightUpper`, `head`) evaluated at frame intervals $t \in [0, 45]$.
- **Invariants & Assertions:**
  1. Profile `playful` produces maximum vertical squash $S_y \le 0.70$ and exactly 3 distinct settle oscillation peaks in elbow angle.
  2. Profile `solemn` produces zero overshoot ($A = 0.0$), $S_y \ge 0.97$, and strictly monotonic settle decay ($d\theta/dt \le 0$ during settle phase).
  3. Profile `energetic` exhibits higher peak angular velocity $\max|\omega|$ than profile `calm` by at least $1.8\times$.

#### `T3-COMB-02`: Character Controller Action Queue & Profile Continuity
- **Features Combined:** `F-CHAR-CONTROLLER` + `F-PROFILE-ACTIONS`
- **Interaction Rationale:** Action transitions (`anticipate` $\rightarrow$ `react` $\rightarrow$ `settle`) must maintain $C^0$ joint position continuity across phase boundaries without teleports or discontinuous jumps.
- **Inputs:** `CharacterController` with a sequence of 3 actions scheduled over 90 frames under `dramatic` profile.
- **Outputs:** Joint transform sequence at boundary frames $t = 29, 30$ and $t = 59, 60$.
- **Invariants & Assertions:**
  1. Anticipation phase exhibits negative displacement ($x(t) < x(0)$ for $t \in [1, 20]$ with peak pull-back $\approx 0.28$).
  2. Positional delta at boundary frame transitions: $|p(k) - p(k-1)| \le \Delta_{\text{max-velocity}}$.
  3. $C^0$ continuity verified: $\lim_{t \to t_{\text{boundary}}^-} p(t) = \lim_{t \to t_{\text{boundary}}^+} p(t)$ within tolerance $\epsilon \le 10^{-4}$.

#### `T3-COMB-03`: Velocity Look-Ahead with 2nd-Order Critically Damped Inertial Filter
- **Features Combined:** `F-CAM-TRACKING` + `F-CAM-DAMPING`
- **Interaction Rationale:** Camera target tracking must combine dynamic look-ahead lead ($\mathbf{L} = k_{\text{lead}} \mathbf{v}$) with 2nd-order spring damping and dead-zone filtering to eliminate high-frequency hunting.
- **Inputs:** Target subject accelerating from $(0, 0)$ to $(600, 0)$ over 30 frames, then abruptly stopping; dead-zone radius $D = 15\text{px}$.
- **Outputs:** Camera position sequence $\mathbf{p}_c(k)$ and velocity sequence $\mathbf{v}_c(k)$.
- **Invariants & Assertions:**
  1. Inside dead-zone ($|\Delta \mathbf{p}| \le 15$), camera velocity remains identically $(0, 0)$.
  2. As target velocity exceeds dead-zone, camera leads target along direction of motion ($x_c(k) > x_{\text{target}}(k)$ during peak cruise).
  3. When target abruptly stops, camera does not snap to target; exhibits exponential inertial decay governed by critically damped ODE ($\zeta = 1.0$) with zero overshoot past final settled coordinate.

#### `T3-COMB-04`: Spring Damping Inertia Across Hermite Spline Shot Transitions
- **Features Combined:** `F-CAM-DAMPING` + `F-CAM-CONTINUITY`
- **Interaction Rationale:** Connecting a spring-damped camera tracking shot to an interpolated shot transition must preserve incoming velocity $\mathbf{v}_0$ into the Hermite spline basis.
- **Inputs:** Shot 1 ends with camera moving at velocity $\mathbf{v}_0 = (12.5, 4.2)\text{ px/frame}$; Shot 2 Hermite transition to $(800, 400)$ over 30 frames.
- **Outputs:** Trajectory $\mathbf{p}_c(t)$ and numerical 1st derivative $\mathbf{v}_c(t)$ across boundary $t=0$.
- **Invariants & Assertions:**
  1. Hermite initial velocity matches Shot 1 exit velocity: $\mathbf{v}_c(0) = \mathbf{v}_0$ within $\epsilon \le 10^{-3}$.
  2. Acceleration $\mathbf{a}_c(t)$ exhibits no impulse discontinuity at the boundary: $|\mathbf{a}_c(0^+) - \mathbf{a}_c(0^-)| \le 2.0\text{ px/frame}^2$.

#### `T3-COMB-05`: Cubic Bezier Points vs Analytical Derivatives & Tangent Vectors
- **Features Combined:** `F-BEZIER-MATH` + `F-BEZIER-DYNAMICS`
- **Interaction Rationale:** Exact cubic coordinates $\mathbf{B}(t)$ must mathematically reconcile with analytical first derivatives $\mathbf{B}'(t)$ and tangent orientation angles $\theta(t)$.
- **Inputs:** Control points $P_0(50, 100), P_1(150, 400), P_2(400, 50), P_3(600, 300)$; evaluated at 50 uniformly spaced values of $t \in [0, 1]$.
- **Outputs:** Coordinate $\mathbf{B}(t)$, analytical velocity $\mathbf{B}'(t)$, central finite difference velocity $\mathbf{v}_{\text{fd}}(t) = \frac{\mathbf{B}(t+h) - \mathbf{B}(t-h)}{2h}$ ($h = 10^{-5}$), and tangent angle $\theta(t) = \operatorname{atan2}(\dot{y}, \dot{x})$.
- **Invariants & Assertions:**
  1. Analytical velocity matches numerical finite difference: $\|\mathbf{B}'(t) - \mathbf{v}_{\text{fd}}(t)\| \le 10^{-4}$ for all $t \in (0, 1)$.
  2. Tangent vector unit length $\|\hat{\mathbf{T}}(t)\| = 1.0 \pm 10^{-6}$.
  3. Tangent angle matches derivative direction: $\cos\theta = \dot{x}/\|\mathbf{B}'\|$ and $\sin\theta = \dot{y}/\|\mathbf{B}'\|$.

#### `T3-COMB-06`: Arc-Length LUT Constant Velocity & Tangent Orientation
- **Features Combined:** `F-BEZIER-DYNAMICS` + `F-BEZIER-TRAVEL`
- **Interaction Rationale:** Moving a packet at constant physical speed requires arc-length parameterization via LUT; packet rotation must dynamically match the instantaneous curve tangent angle.
- **Inputs:** S-curve cubic Bezier; constant packet speed $v_0 = 10\text{ px/frame}$; 100-entry arc-length LUT.
- **Outputs:** Packet positions $\mathbf{p}(k)$ and angles $\theta(k)$ across 60 frames.
- **Invariants & Assertions:**
  1. Constant arc-length step: physical Euclidean distance between consecutive positions along the curve satisfies $\|\mathbf{p}(k) - \mathbf{p}(k-1)\| \approx 10.0 \pm 0.2\text{ px}$ across both high-curvature and flat segments.
  2. Packet rotation angle $\phi(k)$ matches curve tangent $\theta(s(k))$ within $\pm 0.1^\circ$.

#### `T3-COMB-07`: Arc-Length Equidistant Path Resampling & Cyclic Phase Shift Minimization
- **Features Combined:** `F-MORPH-RESAMPLE` + `F-MORPH-INTERPOLATE`
- **Interaction Rationale:** Morphing between paths of unequal vertex counts requires uniform arc-length resampling, followed by cyclic vertex index optimization to prevent shape twisting.
- **Inputs:** Shape A: 4-vertex diamond; Shape B: 12-vertex star; resampled to $N=64$ equidistant vertices; test with Shape B rotated $90^\circ$.
- **Outputs:** Resampled point arrays $A, B$; optimal phase shift index $k^* = \arg\min_k \sum \|A_i - B_{i+k}\|^2$; interpolated path at $t = 0.5$.
- **Invariants & Assertions:**
  1. Points on resampled curves are strictly equidistant along the perimeter: $|\|A_{i+1} - A_i\| - \|A_i - A_{i-1}\|| \le 0.05 \cdot \bar{L}$.
  2. Phase shift optimization chooses $k^*$ that reduces total squared vertex travel distance by at least $40\%$ compared to unshifted $k=0$.
  3. Interpolated path at $t=0.5$ has zero self-intersections (simple polygon test).

#### `T3-COMB-08`: Geometric Path Morphing vs AST Motion Linter Enforcement
- **Features Combined:** `F-MORPH-INTERPOLATE` + `F-AST-LINTER`
- **Interaction Rationale:** The AST motion linter must approve true geometric path morphing implementations while intercepting and rejecting conditional binary flips.
- **Inputs:** Two source code fixtures:
  - Fixture 1: `ValidMorph.tsx` using `interpolateSvgPath(pathA, pathB, progress)`
  - Fixture 2: `InvalidMorph.tsx` containing `progress < 0.5 ? <PathA/> : <PathB/>`
- **Outputs:** Linter report generated by `motion-lint.ts`.
- **Invariants & Assertions:**
  1. Fixture 1 yields 0 violations.
  2. Fixture 2 raises exactly 1 CRITICAL violation under rule `no-conditional-morph-swap`, identifying exact line number and offending ternary expression.

#### `T3-COMB-09`: Arbitrary Custom Rig Adapter Driven by Character Controller
- **Features Combined:** `F-RIG-CUSTOM` + `F-CHAR-CONTROLLER`
- **Interaction Rationale:** Third-party SVG assets with `data-joint` attributes must mount via `ArbitraryCustomRigAdapter` and respond to `CharacterController` action commands without runtime errors for unmapped channels.
- **Inputs:** Custom robot SVG with tagged joints (`head`, `arm-left`, `chassis`); action commanded: `anticipate` with `squashRatio = 0.85` and `head` tilt.
- **Outputs:** Rendered SVG DOM tree; computed joint transform matrix for `head` and `arm-left`.
- **Invariants & Assertions:**
  1. Tagged joints receive exact matrix transforms computed by controller.
  2. Unmapped joint channels in generic pose (e.g. `wingLeft`, `legRight`) are ignored without throwing exceptions or generating invalid DOM attributes.
  3. Bounding box pivot calculation correctly anchors rotation around declared `data-pivot` coordinates.

#### `T3-COMB-10`: ShotSpec Impact Frame Whitelist vs Temporal QA Spike Detection
- **Features Combined:** `F-SHOTSPEC-CUES` + `F-TEMPORAL-QA`
- **Interaction Rationale:** Temporal video QA must flag frame discontinuities exceeding $4.0\times$ local median MAD, unless the frame is declared in `shot-spec.json` under `whitelisted_impact_frames`.
- **Inputs:** Synthetic 60-frame video sequence with an abrupt high-contrast visual shock at frame 30 (producing MAD ratio $= 5.8\times$ local median); two ShotSpec variations:
  - Spec A: `whitelisted_impact_frames: [30]`
  - Spec B: `whitelisted_impact_frames: []`
- **Outputs:** `temporal-render-qa.ts` analysis result.
- **Invariants & Assertions:**
  1. Under Spec A, frame 30 is logged as `WHITELISTED_IMPACT`, overall QA status is `PASS`.
  2. Under Spec B, frame 30 is flagged as `UNANNOTATED_DISCONTINUITY`, overall QA status is `FAIL`.

#### `T3-COMB-11`: Bird Rig Wing Kinematics & Touchdown Squash Across Profiles
- **Features Combined:** `F-RIG-BIRD` + `F-PHYSICS-PROFILES`
- **Interaction Rationale:** `BirdRig` wing flapping cycles, banking angles, and touchdown impact squash must scale dynamically with performance profiles.
- **Inputs:** `BirdRig` executing a landing sequence under `energetic` vs `calm` profiles.
- **Outputs:** Joint parameters (`wingLeftAngle`, `wingRightAngle`, `squash`) evaluated across frames 0 to 40.
- **Invariants & Assertions:**
  1. Wing flap frequency during approach is $1.6\times$ higher in `energetic` than in `calm`.
  2. Touchdown impact produces vertical squash $S_y = 0.72 \pm 0.02$ for `energetic` vs $S_y = 0.94 \pm 0.02$ for `calm`.
  3. Rebound overshoot in `energetic` reaches $S_y = 1.15 \pm 0.03$ before settling.

#### `T3-COMB-12`: RigInterface Joint Hierarchy Structural Validation via AST Linter
- **Features Combined:** `F-RIG-INTERFACE` + `F-AST-LINTER`
- **Interaction Rationale:** The AST motion linter rule `no-monolithic-character` must structurally inspect components claiming to implement `RigInterface` and verify hierarchical `<g>` grouping.
- **Inputs:**
  - Fixture 1: Articulated rig returning `<g id="root"><g id="torso"><g id="head"/></g></g>`.
  - Fixture 2: Monolithic rig returning `<svg><path d="..."/></svg>` without joint hierarchy.
- **Outputs:** AST inspection results from `motion-lint.ts`.
- **Invariants & Assertions:**
  1. Fixture 1 passes with 0 violations.
  2. Fixture 2 triggers CRITICAL `no-monolithic-character` violation.

#### `T3-COMB-13`: Camera Tracking a Bezier Packet Trajectory with Look-Ahead
- **Features Combined:** `F-BEZIER-TRAVEL` + `F-CAM-TRACKING`
- **Interaction Rationale:** Camera tracking an entity traveling along a curved Bezier trajectory must orient its look-ahead lead vector along the instantaneous curve tangent.
- **Inputs:** Cubic Bezier path curving from $(0, 0)$ to $(800, 600)$; packet traveling along curve; `CameraRig` tracking packet with $k_{\text{lead}} = 4.0$ frames.
- **Outputs:** Camera target coordinates $(x_c, y_c)$ over 60 frames.
- **Invariants & Assertions:**
  1. Look-ahead offset vector $\mathbf{L}(k) = \mathbf{p}_c(k) - \mathbf{p}_{\text{packet}}(k)$ is parallel to instantaneous tangent $\hat{\mathbf{T}}(k)$ ($\mathbf{L} \cdot \hat{\mathbf{T}} \approx \|\mathbf{L}\|$ within $\cos\Delta\theta \ge 0.98$).
  2. Camera trajectory exhibits no velocity spikes: $\max|\mathbf{a}_c| \le 3.5\text{ px/frame}^2$.

#### `T3-COMB-14`: ShotSpec Inter-Shot State Contract vs Hermite Spline Evaluation
- **Features Combined:** `F-SHOTSPEC-CUES` + `F-CAM-CONTINUITY`
- **Interaction Rationale:** ShotSpec continuity validator verifies that Shot $N$ end state equals Shot $N+1$ start state; Hermite spline evaluation across the boundary must yield identical position and continuous derivative.
- **Inputs:** Valid `shot-spec.json` with 2 consecutive shots: Shot 1 ending at $(300, 150, \text{zoom: } 1.2)$, Shot 2 starting at $(300, 150, \text{zoom: } 1.2)$; Hermite spline transition evaluated across the boundary.
- **Outputs:** `validate-shot-spec.ts` output and evaluated camera position at boundary frame $t_{\text{boundary}}$.
- **Invariants & Assertions:**
  1. `validate-shot-spec.ts` returns exit code 0.
  2. Positional discrepancy across boundary $\Delta p = \|\mathbf{p}(t_{\text{boundary}}^+) - \mathbf{p}(t_{\text{boundary}}^-)\| \equiv 0.0$.
  3. Derivative continuity: $\|\mathbf{v}(t_{\text{boundary}}^+) - \mathbf{v}(t_{\text{boundary}}^-)\| \le 10^{-4}$.

#### `T3-COMB-15`: ShotSpec Key Beats Mapped to Profile Dynamics
- **Features Combined:** `F-SHOTSPEC-CUES` + `F-PROFILE-ACTIONS`
- **Interaction Rationale:** Key beats declared in `shot-spec.json` with specific `performance_profile` annotations must match the physical parameters executed by `CharacterController`.
- **Inputs:** `shot-spec.json` containing key beat: `{ frame: 45, intent: "surprise_recoil", performance_profile: "dramatic" }`.
- **Outputs:** Controller pose parameters at frame 45 to 75.
- **Invariants & Assertions:**
  1. Evaluated anticipation duration equals dramatic profile specification (14 frames).
  2. Peak recoil amplitude matches dramatic profile parameter ($A = 0.28$).

#### `T3-COMB-16`: Bezier Packet Arrival Aligned with Audio Cue Manifest
- **Features Combined:** `F-BEZIER-TRAVEL` + `F-SHOTSPEC-CUES` (Audio Cue Sync)
- **Interaction Rationale:** A packet traveling along a Bezier curve to a target node must reach arc progress $1.0$ at the exact frame declared in `cues.json` for the destination audio impact.
- **Inputs:** Arc-length parameterized Bezier trajectory configured to arrive at frame 45; `cues.json` declaring `{ id: "node_impact", frame: 45, category: "impact" }`.
- **Outputs:** Computed packet arc progress at frames 44, 45, 46 and cue trigger event.
- **Invariants & Assertions:**
  1. Packet arc progress at frame 44: $s \approx 0.96 \pm 0.01$.
  2. Packet arc progress at frame 45: $s \equiv 1.00 \pm 0.001$.
  3. Cue time conversion: $\text{timeSec} = 45 / 30 = 1.500\text{s}$ matches audio synthesis timestamp exactly.

#### `T3-COMB-17`: Standalone Package Exports & Zero `.agents` Import Gate
- **Features Combined:** `F-PKG-CANONICAL` + `F-PKG-ISOLATION`
- **Interaction Rationale:** The canonical `motion-kit` package must cleanly export all required public symbols from `index.ts` while enforcing that zero source files in compositions import from `.agents/`.
- **Inputs:** `motion-kit/package.json`, `motion-kit/src/index.ts`, AST import scanner across `connection-film/src/`.
- **Outputs:** Exported symbol list and AST import scanner report.
- **Invariants & Assertions:**
  1. All required symbols exported: `RigInterface`, `CharacterController`, `BirdRig`, `HumanRig`, `ArbitraryCustomRigAdapter`, `PerformanceProfile`, `CameraRig`, `interpolateSvgPath`, `quadraticBezierPoint`, `cubicBezierPoint`, `createBezierLUT`.
  2. Number of import declarations matching `from '.*\.agents.*'` across all production compositions and benchmarks equals exactly 0.

#### `T3-COMB-18`: AST Linter Detection of Unmotivated Slow Zoom vs Compliant Camera
- **Features Combined:** `F-AST-LINTER` + `F-CAM-CONTINUITY`
- **Interaction Rationale:** AST motion linter rule `no-constant-slow-zoom` must reject unmotivated monotonic ambient camera zoom while approving Hermite spline camera choreographies.
- **Inputs:**
  - Fixture A: Camera scale computed as `1.0 + frame * 0.0005` (ambient unmotivated drift).
  - Fixture B: Camera scale evaluated via `interpolateCameraHermite()`.
- **Outputs:** AST linter violation reports.
- **Invariants & Assertions:**
  1. Fixture A triggers MAJOR violation `no-constant-slow-zoom`.
  2. Fixture B passes with 0 violations.

#### `T3-COMB-19`: AST Linter Detection of Binary Pose Crossfades vs CharacterController Blending
- **Features Combined:** `F-AST-LINTER` + `F-CHAR-CONTROLLER`
- **Interaction Rationale:** AST rule `no-crossfade-pose-blend` must reject opacity crossfades between two rig instances while approving `CharacterController.blend(from, to, t)`.
- **Inputs:**
  - Fixture A: Two `<HumanRig/>` instances with `opacity={1 - progress}` and `opacity={progress}`.
  - Fixture B: Single `<HumanRig pose={controller.blend(poseA, poseB, progress)}/>`.
- **Outputs:** AST linter violation reports.
- **Invariants & Assertions:**
  1. Fixture A triggers CRITICAL violation `no-crossfade-pose-blend`.
  2. Fixture B passes with 0 violations.

#### `T3-COMB-20`: Video Frame MAD Continuity During Geometric Morph vs Binary Swap
- **Features Combined:** `F-TEMPORAL-QA` + `F-MORPH-INTERPOLATE`
- **Interaction Rationale:** Rolling MAD analysis of decoded video frames must show smooth, bounded differences during true geometric morphing, contrasting with a massive spike on binary component swaps.
- **Inputs:**
  - Video A: 60-frame rendered morph using `PathMorph` (continuous vertex interpolation).
  - Video B: 60-frame rendered morph using ternary flip (`progress < 0.5 ? <A/> : <B/>`).
- **Outputs:** Adjacent-frame MAD arrays $\text{MAD}_t$ and local median ratios $R_t$.
- **Invariants & Assertions:**
  1. Video A: $\max(R_t) \le 2.2\times$ (smooth, well-conditioned temporal progression).
  2. Video B: $R_{30} \ge 7.5\times$ local median (massive single-frame pop); rejected as an unannotated defect.

---

## 5. Tier 4: Real-World Application Scenarios (10 Production Scenarios)

Tier 4 tests complete, production-grade end-to-end scenarios representing realistic user-facing animated compositions and release workflows.

```
| Scenario ID | Scenario Name | Primary Benchmark / Domain | Core Requirements Validated |
|:---|:---|:---|:---|
| T4-SCEN-01 | Human Conversational Explainer Acting | Benchmark V2-A (`BenchmarkV2HumanExplainer.tsx`) | R1, R2, R3, R4, R9, R10 |
| T4-SCEN-02 | Complex Mechanical Physics & True Geometry Morph | Benchmark V2-B (`BenchmarkV2MechanicalMorph.tsx`) | R1, R3, R4, R5, R8, R9 |
| T4-SCEN-03 | Multi-Stage Network Protocol Data Flow & Bezier Travel | Benchmark V2-C (`BenchmarkV2NetworkFlow.tsx`) | R1, R2, R6, R4, R9, R10 |
| T4-SCEN-04 | Production Multi-Shot Continuity Contract & Enforcement | Multi-Shot Composition Pipeline | R4, R9 |
| T4-SCEN-05 | Recursive AST Linter Anti-Pattern Scanning on Entire Codebase | Quality Gate Tooling (`motion-lint.ts`) | R7 |
| T4-SCEN-06 | Temporal Render QA with Synthetic & FFmpeg Decoded Frames | Video Inspection Tooling (`temporal-render-qa.ts`) | R8 |
| T4-SCEN-07 | Articulated Avian Flight Physics & Aerodynamic Banking | Avian Motion System (`BirdRig`) | R2, R3, R4 |
| T4-SCEN-08 | Arbitrary SVG Custom Rig Adapter Pipeline | Third-Party Vector Character Ingestion | R2, R3 |
| T4-SCEN-09 | Audio-Visual Frame-Accurate Synchronization Pipeline | Cue Manifest & Audio Engine (`cues.json`) | R10 |
| T4-SCEN-10 | Full End-to-End System Pipeline | Complete Build $\rightarrow$ QA $\rightarrow$ Render $\rightarrow$ Review | R1–R12 |
```

### Detailed Specifications for Tier 4 Scenarios

#### `T4-SCEN-01`: Human Conversational Explainer Acting
- **Composition Target:** `connection-film/src/benchmarks/v2/BenchmarkV2HumanExplainer.tsx`
- **Duration & Format:** 150 frames @ 30fps (5.0s), 1920×1080.
- **Narrative Storyboard & Beats:**
  1. *Beat 1 (Frames 0–35) [Profile: `calm`]:* Articulated educator Maya stands at interactive holographic board. Subtle breathing rhythm, weight balance shift between hips, gaze directed toward viewer.
  2. *Beat 2 (Frames 35–65) [Profile: `energetic`]:* Wind-up anticipation: Maya turns, arm draws back with elbow bend and wrist follow-through lag $\rightarrow$ energetic sweep gesture pointing to diagram $\rightarrow$ snappy overshoot and harmonic settle. Camera tracks hand with 6-frame look-ahead lead.
  3. *Beat 3 (Frames 65–110) [Profile: `dramatic`]:* System alert on board triggers double-take reaction: torso recoils, eyes dilate ($1.35\times$), eyebrows arch, hands raise with multi-phase damped oscillation before settling. Camera performs motivated push-in (zoom 1.0 $\rightarrow$ 1.28) maintaining $C^1$ continuity.
  4. *Beat 4 (Frames 110–150) [Profile: `playful`]:* Maya smiles, open-palm gesture toward solution, head tilts playfully with secondary ponytail follow-through lag. Settle to concluding pose.
- **Verifiable Invariants & Passing Gates:**
  1. `motion-lint.ts` confirms 0 Critical and 0 Major AST violations.
  2. `validate-shot-spec.ts` confirms 100% schema and inter-shot state continuity.
  3. Hand tracking camera velocity does not exceed maximum allowable target acceleration.
  4. Secondary ponytail lag evaluates to exactly 3 frames behind torso momentum.

#### `T4-SCEN-02`: Complex Mechanical Physics & True Geometry Morph
- **Composition Target:** `connection-film/src/benchmarks/v2/BenchmarkV2MechanicalMorph.tsx`
- **Duration & Format:** 150 frames @ 30fps (5.0s), 1920×1080.
- **Narrative Storyboard & Beats:**
  1. *Beat 1 (Frames 0–45) [Clockwork Escapement]:* 12-tooth Geneva wheel rotates with non-linear rotational inertia, overshoots slot alignment, and settles with micro-vibrations. Camera orbital pan tracks gear teeth engagement.
  2. *Beat 2 (Frames 45–95) [Continuous Topological Morph]:* Mechanical gear teeth reshape their SVG bezier contours into electromagnetic stator coil poles. True geometric path vertex interpolation ($N=64$ resampled vertices, cyclic phase shift optimization). Zero conditional component swapping (`progress < X ? A : B`).
  3. *Beat 3 (Frames 95–150) [Electromagnetic Induction & Stator Spin]:* Copper windings illuminate with magnetic flux loops. Rotor accelerates into high-speed rotation, settling into stable equilibrium. Camera pulls back to system overview with smooth $C^1$ velocity deceleration.
- **Verifiable Invariants & Passing Gates:**
  1. Morph transition contains exactly 0 JSX ternary or conditional branch expressions.
  2. Resampled vertex count $N \ge 64$ everywhere during morph.
  3. Decoded frame video QA yields 0 unannotated MAD spikes $>4\times$ local median.
  4. Camera pullback velocity deceleration curve is strictly monotonic.

#### `T4-SCEN-03`: Multi-Stage Network Protocol Data Flow & Bezier Travel
- **Composition Target:** `connection-film/src/benchmarks/v2/BenchmarkV2NetworkFlow.tsx`
- **Duration & Format:** 180 frames @ 30fps (6.0s), 1920×1080.
- **Narrative Storyboard & Beats:**
  1. *Shot 1 (Frames 0–60) [Client $\rightarrow$ Gateway Handshake]:* Client generates cryptographic payload packet. Multi-point cubic Bezier path reveals with animated dashoffset. Payload travels along exact cubic curve; packet orientation aligns dynamically with tangent vector $\mathbf{B}'(t)$ with banking tilt proportional to path curvature $\kappa(t)$. Gateway mounted via `ArbitraryCustomRigAdapter` with spinning fan joints.
  2. *Shot 2 (Frames 60–120) [Gateway $\rightarrow$ Raft Consensus Quorum]:* Gateway dispatches 3 synchronized packets along diverging quadratic Bezier branches to 3 distributed Raft consensus nodes. Camera continuity matches Shot 1 end state ($S_0.\text{end\_state} == S_1.\text{start\_state}$). Nodes acknowledge receipt with staggered overshoot and settle.
  3. *Shot 3 (Frames 120–180) [Commit Log Persistence & Audio Sync]:* Unified commit packet converges onto database cylinder. Database rings compress with physical squash on impact ($S_y = 0.82$), rebound, and lock into persistent state. Frame-accurate audio cues triggered: `handshake_start` (f=10), `gateway_ingress` (f=55), `quorum_ack` (f=98), `disk_commit_impact` (f=145).
- **Verifiable Invariants & Passing Gates:**
  1. Packet coordinate distance to theoretical Bezier curve: $\| \mathbf{p}_{\text{actual}} - \mathbf{B}(t) \| \le 10^{-4}$ for all frames.
  2. Packet banking angle $\beta(t) = c \cdot \kappa(t)$ is continuous.
  3. Shot 1 to Shot 2 camera position delta $= 0.0$ and zoom delta $= 0.0$.
  4. Audio cue manifest matches visual impact frames with $\Delta \text{frame} = 0$.

#### `T4-SCEN-04`: Production Multi-Shot Continuity Contract & Enforcement
- **Scope:** Multi-shot continuity validator (`validate-shot-spec.ts`) and ShotSpec JSON files.
- **Execution Flow:**
  1. Ingest production shot specifications containing 4 consecutive shots.
  2. Validate frame progression: $S_0.\text{end\_frame} == S_1.\text{start\_frame} == \dots == S_3.\text{start\_frame}$.
  3. Validate camera vector equality: $\|S_N.\text{end\_state.camera} - S_{N+1}.\text{start\_state.camera}\| \le 0.001$.
  4. Validate continuity of persistent actors across shot boundaries.
  5. Invalidate: inject deliberate continuity errors (e.g. 1-frame gap, zoom mismatch) and confirm immediate validator exit code 1 with exact schema error path.
- **Verifiable Invariants & Passing Gates:**
  1. Valid multi-shot specs pass with exit code 0.
  2. Any frame gap, overlap, or camera state mismatch triggers immediate process failure with descriptive diagnostic output.

#### `T4-SCEN-05`: Recursive AST Linter Anti-Pattern Scanning on Entire Codebase
- **Scope:** `validators/motion-lint.ts` executed across `connection-film/src/` and `motion-kit/`.
- **Execution Flow:**
  1. Babel/TypeScript AST visitor recursively traverses all `.ts` and `.tsx` files.
  2. Checks for anti-pattern rules:
     - `no-monolithic-character` (unarticulated SVGs)
     - `no-conditional-morph-swap` (binary ternary flips)
     - `no-crossfade-pose-blend` (opacity crossfades between poses)
     - `no-unmotivated-linear-translate` (linear translate $>20$ frames without easing)
     - `no-constant-slow-zoom` (unmotivated ambient slow zoom)
     - `no-opacity-scene-transition` (opacity fades between scenes)
  3. Tests synthetic anti-pattern test fixtures to verify 100% detection rate.
- **Verifiable Invariants & Passing Gates:**
  1. Zero Critical and zero Major violations on all production compositions and V2 benchmarks.
  2. Synthetic invalid fixtures trigger expected rule violations with 100% sensitivity.

#### `T4-SCEN-06`: Temporal Render QA with Synthetic & FFmpeg Decoded Frames
- **Scope:** `validators/temporal-render-qa.ts` using FFmpeg rawvideo decoding pipe.
- **Execution Flow:**
  1. Decode rendered MP4 video frames to $320 \times 180$ grayscale rawvideo buffer via FFmpeg pipe.
  2. Compute adjacent-frame Mean Absolute Difference (MAD) array.
  3. Compute rolling local median filter (window $M = 15$ frames).
  4. Flag frames with ratio $\text{MAD}_t / \max(M_t, 0.5) > 4.0$.
  5. Reconcile flagged frames with `whitelisted_impact_frames` in `shot-spec.json`.
- **Verifiable Invariants & Passing Gates:**
  1. V2 benchmark MP4s pass with 0 unannotated MAD spikes.
  2. Injected artificial frame glitch (e.g. single black frame inserted into smooth animation) is detected with ratio $>8.0\times$ and fails QA.

#### `T4-SCEN-07`: Articulated Avian Flight Physics & Aerodynamic Banking
- **Scope:** `BirdRig` articulated flight kinematics.
- **Execution Flow:**
  1. Multi-phase flight sequence over 120 frames:
     - Crouch anticipation ($S_y = 0.75$, wings tucked).
     - Parabolic launch climb with periodic wing flap cycle ($6\text{ Hz}$).
     - High-speed banked turn where roll angle $\phi$ is proportional to flight path curvature $\kappa$.
     - Rooftop touchdown with impact squash and settle.
  2. Expressive layers: pupil gaze leading head direction, beak sync.
- **Verifiable Invariants & Passing Gates:**
  1. Banking angle adheres to aerodynamic equilibrium: $\tan\phi = \frac{v^2}{R \cdot g}$.
  2. Gaze lead vector precedes flight velocity vector by $\approx 4$ frames.
  3. Landing touchdown exhibits physical squash followed by damped rebound.

#### `T4-SCEN-08`: Arbitrary SVG Custom Rig Adapter Ingestion Pipeline
- **Scope:** Universal vector mounting via `ArbitraryCustomRigAdapter`.
- **Execution Flow:**
  1. Ingest an un-rigged third-party industrial robot SVG containing `data-joint="base"`, `data-joint="arm1"`, `data-joint="arm2"`, `data-joint="gripper"`.
  2. Mount via `ArbitraryCustomRigAdapter` into `RigInterface`.
  3. Bind to `CharacterController` and command an articulated pick-and-place motion sequence.
  4. Render 60 frames and verify hierarchical joint rotation chaining.
- **Verifiable Invariants & Passing Gates:**
  1. Rotation of `arm1` automatically propagates forward kinematics to `arm2` and `gripper`.
  2. Zero SVG path deformation or clipping artifacts outside designated bounding box.

#### `T4-SCEN-09`: Audio-Visual Frame-Accurate Synchronization Pipeline
- **Scope:** `cues.json` manifest driving Remotion and `make_audio.py`.
- **Execution Flow:**
  1. Define unified `cues.json` with 8 multi-track audio events (`action_hit`, `whoosh`, `impact`, `ui_accent`).
  2. Visual composition queries cue events to trigger visual accent particles.
  3. Python audio synthesizer reads `cues.json` and synthesizes sample-accurate audio transients at $t = \text{frame} / 30.0$.
  4. Audio waveform transient peak verified against video visual impact frame within $\Delta t \le 1\text{ frame}$ ($33\text{ ms}$).
- **Verifiable Invariants & Passing Gates:**
  1. Time calculation in cue manifest: $\text{timeSec} \equiv \text{frame} / \text{fps}$ with zero floating-point accumulation drift over 1800 frames (60s).
  2. Audio waveform envelope peak matches visual impact frame within $\pm 1$ frame.

#### `T4-SCEN-10`: Full End-to-End System Pipeline (Authoring $\rightarrow$ QA $\rightarrow$ Render $\rightarrow$ Rubric)
- **Scope:** Full master integration test representing production release certification.
- **Execution Flow:**
  1. Package compilation: `motion-kit` compiles cleanly via `tsc --noEmit`.
  2. Isolation audit: 0 imports from `.agents/` across the entire project.
  3. Static AST analysis: `validators/motion-lint.ts` passes with 0 Critical / 0 Major defects.
  4. Spec validation: `validators/validate-shot-spec.ts` passes on all compositions.
  5. Video render: Remotion renders all 3 V2 benchmarks to MP4.
  6. Temporal QA: `validators/temporal-render-qa.ts` verifies 0 unannotated MAD spikes.
  7. Independent quality rubric audit: 10 rubric dimensions score overall average $\ge 4.5 / 5.0$ (no individual dimension $< 4.0$).
- **Verifiable Invariants & Passing Gates:**
  1. Every gate in the pipeline exits with code 0.
  2. Final release certification signal `TEST_READY.md` is published.

---

## 6. Execution Guide & Test Commands

### 6.1 Running the Complete E2E Suite
```bash
# Execute all 230 test cases across all 4 tiers
npx tsx tests/e2e-runner.ts
```

### 6.2 Running Specific Tiers
```bash
# Tier 1: Happy-path feature coverage (100 tests)
npx tsx tests/e2e-runner.ts --tier=1

# Tier 2: Boundary value and corner cases (100 tests)
npx tsx tests/e2e-runner.ts --tier=2

# Tier 3: Pairwise cross-feature combinations (20 tests)
npx tsx tests/e2e-runner.ts --tier=3

# Tier 4: Real-world application scenarios (10 scenarios)
npx tsx tests/e2e-runner.ts --tier=4
```

### 6.3 Filtering by Feature or Scenario
```bash
# Run all tests for camera tracking across all tiers
npx tsx tests/e2e-runner.ts --feature=F-CAM-TRACKING

# Run specific real-world scenario
npx tsx tests/e2e-runner.ts --scenario=T4-SCEN-01
```

### 6.4 Quality Gate CLI Commands
```bash
# AST Motion Linter
npx tsx validators/motion-lint.ts connection-film/src/ motion-kit/

# ShotSpec Continuity Validator
npx tsx validators/validate-shot-spec.ts connection-film/src/benchmarks/v2/shot-spec.v2-a.json
npx tsx validators/validate-shot-spec.ts connection-film/src/benchmarks/v2/shot-spec.v2-b.json
npx tsx validators/validate-shot-spec.ts connection-film/src/benchmarks/v2/shot-spec.v2-c.json

# Temporal Render Video QA
npx tsx validators/temporal-render-qa.ts out/v2-human.mp4 connection-film/src/benchmarks/v2/shot-spec.v2-a.json
```

---

## 7. Quality Gate Pass/Fail Criteria

A production build or release candidate is certified **READY** if and only if all the following conditions are met:
1. **E2E Test Suite:** 100% of executed tests pass (0 failures).
2. **AST Motion Linter:** 0 Critical violations, 0 Major violations.
3. **ShotSpec Continuity:** 100% PASS on all active composition shot specifications.
4. **Temporal Render QA:** 0 unannotated MAD spikes exceeding $4.0\times$ local median on rendered MP4 files.
5. **Independent Quality Rubric:** Evaluated by independent reviewer agent with overall average $\ge 4.5 / 5.0$ and no single dimension $< 4.0$.
