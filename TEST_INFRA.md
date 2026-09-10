# TEST_INFRA.md — Master Test Infrastructure Specification
**Project:** V3.3 Production Integrity Hardening (Failure-First Acceptance)  
**Version:** 3.3.0-PROD  
**Working Directory:** `/home/hongphuoc6104/Desktop/videorenderhoathinh`  
**Authoritative Sources:** `ORIGINAL_REQUEST.md` (V3.3 section 2026-09-10T11:05:38Z: R1–R23), `.agents/orchestrator_8/PROJECT.md` (F01–F28), `.agents/sub_orch_e2e_testing/SCOPE.md`

---

## 1. Test Philosophy & Architecture

The V3.3 Production Integrity Hardening test framework operates under five non-negotiable architectural principles designed to eradicate all false-positive acceptance paths across static AST analysis, acoustic DSP, temporal motion, and mobile preview legibility:

### 1.1 Opaque-Box, Requirement-Driven Testing
All tests derive strictly from requirements R1–R23 and features F01–F28. Verification is conducted solely through public module contracts, filesystem artifacts, CLI execution signatures, AST visitors, and binary audio/video data streams. Tests are agnostic to internal implementation details, enforcing behavioral and physical invariants.

### 1.2 Failure-First Acceptance & Adversarial Verification (R22)
A quality gate is never certified simply because it passes clean inputs; it must demonstrably reject deliberately invalid inputs. The suite includes an adversarial false-positive test harness (`scripts/run-adversarial-suite.ts`) executing 12 engineered bad fixtures spanning typography violations, invalid impact frames, naked scene cuts, duplicate audio playback, machine-specific paths, default Kokoro voice routing, metadata mismatches, out-of-sync scene timing, cue/visual mismatch, dense card grids, fake duration inflation, and unannotated temporal spikes. Acceptance strictly requires **100% rejection** of all 12 bad fixtures.

### 1.3 4-Tier Hierarchical Testing Methodology
Verification is partitioned into 4 complementary tiers:
- **Tier 1 — Feature Contracts (Unit/Contract Level):** Enforces isolated schema, interface shapes, and nominal behaviors ($\ge 5$ tests per feature across all 28 features $= 140$ tests).
- **Tier 2 — Boundary, Limit & Corner Cases:** Stresses parameter limits, out-of-bounds frame bounds, zero-length arrays, NaN telemetry, invalid sample rates, and non-monotonic sequences ($\ge 5$ tests per feature $= 140$ tests).
- **Tier 3 — Cross-Feature Pairwise Interactions:** Validates data contract handoffs across pipeline subsystems (e.g. Timeline $\leftrightarrow$ ShotSpec, AST Typography $\leftrightarrow$ Mobile Preview, VieNeu TTS $\leftrightarrow$ Audio Mix, Transitions $\leftrightarrow$ Temporal QA) ($30$ tests).
- **Tier 4 — Real-World Application Scenarios:** Executes full end-to-end production explainer sequences under realistic operational conditions ($15$ comprehensive scenarios).

### 1.4 Mobile-First Physical Legibility & Progressive Disclosure (R1, R2, R3)
Video assets must remain legible when viewed on mobile phone viewports. In dual-render production ($1080 \times 1920$ master and $360 \times 640$ QA preview), text height must never render below $10.0\text{px}$ on the $360\text{p}$ canvas ($30\text{px}$ in $1080\text{p}$). PowerPoint-style multi-card density is prohibited; choreography must adhere to progressive disclosure (1 primary idea per beat).

### 1.5 Strict Acoustic & Environment Portability (R11, R14, R15, R16)
Remotion compositions enforce `PREMIXED` single audio ownership (master audio WAV contains narration and all mixed SFX; zero discrete `<Audio>` cue tags). Committed manifests contain zero machine-specific absolute paths (`/home/`, `C:\`, `/Users/`).

---

## 2. Feature Inventory Mapping & Coverage Invariants

The V3.3 framework maps all 28 features (F01–F28) against requirements R1–R23 across the 4 tiers plus the adversarial test suite:

| Feature ID | Feature Name | Requirement Source | Milestone | Tier 1 (Happy) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Scenario) | Adversarial Fixture | Total Tests |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **F01** | Static Typography Validator | R1 | M1 | 5 | 5 | T3-01, T3-02 | S04, S11 | Bad Fixture 1 (14px font) | 14 |
| **F02** | Strict ShotSpec Impact Bounds | R7 | M1 | 5 | 5 | T3-03, T3-04 | S01, S06 | Bad Fixture 2 (Out-of-range impact) | 14 |
| **F03** | ShotSpec Transition Whitelist | R8 | M1 | 5 | 5 | T3-04, T3-05 | S07, S15 | Bad Fixture 3 (Naked scene cut) | 14 |
| **F04** | Audio Ownership Validator | R11 | M1 | 5 | 5 | T3-06, T3-07 | S08, S10 | Bad Fixture 4 (Duplicate SFX) | 14 |
| **F05** | Workspace Portability Validator | R15 | M1 | 5 | 5 | T3-08, T3-09 | S10, S13 | Bad Fixture 5 (Machine absolute path) | 14 |
| **F06** | Remotion Audio Tag Deduplication | R11 | M1 | 5 | 5 | T3-06, T3-07 | S08 | Bad Fixture 4 (Remotion cue tags) | 13 |
| **F07** | Authoritative Audio Asset Graph | R12 | M2 | 5 | 5 | T3-09, T3-10 | S08, S09 | Bad Fixture 4 (Audio asset overlap) | 13 |
| **F08** | Safe VieNeu-TTS Voice Default | R13 | M2 | 5 | 5 | T3-11, T3-12 | S09, S14 | Bad Fixture 6 (am_adam default) | 14 |
| **F09** | Measured Audio Metadata Manifest | R14 | M2 | 5 | 5 | T3-10, T3-13 | S08, S09 | Bad Fixture 7 (Metadata mismatch) | 14 |
| **F10** | Audio Policy Hygiene | R16 | M2 | 5 | 5 | T3-12, T3-14 | S09, S10 | Bad Fixture 4 (Production BGM) | 13 |
| **F11** | Role-Aware Natural Pause Policy | R17 | M2 | 5 | 5 | T3-11, T3-15 | S05, S09 | Bad Fixture 8 (Pause anomaly) | 13 |
| **F12** | Audio Dynamics QA Gate (-15 LUFS) | R18 | M2 | 5 | 5 | T3-13, T3-14 | S08, S09 | Bad Fixture 7 (Clipping/Loudness) | 13 |
| **F13** | Canonical Semantic Timeline | R4 | M3 | 5 | 5 | T3-03, T3-16, T3-17 | S01, S02, S03 | Bad Fixture 8 (Timeline out of sync) | 15 |
| **F14** | 100% Source Content Coverage Map | R21 | M3 | 5 | 5 | T3-16, T3-18 | S01, S12 | Bad Fixture 11 (Omitted concept) | 14 |
| **F15** | Derived ShotSpec & Cues Manifests | R4, R7, R8 | M3 | 5 | 5 | T3-03, T3-04, T3-17 | S01, S06, S07 | Bad Fixture 8 (Derived timing lag) | 15 |
| **F16** | Progressive Disclosure Choreography | R3 | M4 | 5 | 5 | T3-19, T3-20 | S02, S03, S11 | Bad Fixture 10 (5 dense cards) | 15 |
| **F17** | Content-Driven Dynamic Timing | R5 | M4 | 5 | 5 | T3-17, T3-21 | S01, S05 | Bad Fixture 11 (Fake duration expansion) | 14 |
| **F18** | 103.20s Narration Parity | R6 | M4 | 5 | 5 | T3-17, T3-21 | S01, S05 | Bad Fixture 11 (Parity stretch) | 13 |
| **F19** | Motivated Scene Transitions | R9, R10 | M4 | 5 | 5 | T3-05, T3-22 | S07, S15 | Bad Fixture 3 (Unmotivated cut) | 14 |
| **F20** | Scene Typography Mobile Remediation | R1, R2 | M4 | 5 | 5 | T3-01, T3-23 | S04, S11 | Bad Fixture 1 (Unremediated font) | 14 |
| **F21** | Educational Flat Motion Skill | R19 | M5 | 5 | 5 | T3-24, T3-25 | S01, S15 | Bad Fixture 10 (Skill rule breach) | 13 |
| **F22** | Quality Rubric Overhaul (>= 4.5) | R20 | M5 | 5 | 5 | T3-25, T3-26 | S15 | Bad Fixture 12 (Low rubric score) | 13 |
| **F23** | Adversarial Test Suite Runner | R22 | M6 | 5 | 5 | T3-27, T3-28 | S10, S15 | All 12 Bad Fixtures | 24 |
| **F24** | 12 Deliberate Bad Fixtures | R22 | M6 | 5 | 5 | T3-27, T3-28 | S15 | All 12 Bad Fixtures | 24 |
| **F25** | Dual-Render MP4 Pipeline | R2 | M6 | 5 | 5 | T3-29, T3-30 | S01, S11 | Bad Fixture 12 (Preview mismatch) | 13 |
| **F26** | Mobile Legibility Preview Rubric | R2 | M6 | 5 | 5 | T3-23, T3-29 | S04, S11 | Bad Fixtures 1, 10 (Illegible preview) | 14 |
| **F27** | Temporal QA MP4 Discontinuity Check | R9 | M6 | 5 | 5 | T3-22, T3-30 | S07, S15 | Bad Fixture 12 (Unannotated spike) | 14 |
| **F28** | Final End-to-End Acceptance | R23 | M6 | 5 | 5 | T3-26, T3-28, T3-30 | S01, S15 | Full Acceptance Gate | 15 |

### Mathematical Coverage Invariant:
$$\text{Total Test Cases} = \text{Tier 1 } (140) + \text{Tier 2 } (140) + \text{Tier 3 } (30) + \text{Tier 4 } (15) + \text{Adversarial } (12) = 337 \ge 337 \quad [\mathbf{PASS}]$$

---

## 3. Test Architecture, Directory Layout & Execution Commands

### 3.1 Directory Layout
```
/home/hongphuoc6104/Desktop/videorenderhoathinh/
├── validators/                                   # Standalone CLI Quality Gates
│   ├── validate-mobile-typography.ts             # AST mobile typography gate (R1)
│   ├── validate-shot-spec.ts                     # Strict ShotSpec & transition whitelist gate (R7, R8)
│   ├── validate-audio-ownership.ts               # PREMIXED single audio owner AST gate (R11)
│   ├── validate-portability.ts                   # Zero machine-specific absolute paths gate (R15)
│   ├── validate-audio-policy.ts                  # Audio policy & role-aware pause gate (R16, R17)
│   ├── validate-audio-mix.ts                     # Audio dynamics & metadata gate (R14, R18)
│   ├── temporal-render-qa.ts                     # Rolling MAD frame discontinuity QA gate (R9)
│   └── validate-preview-rubric.ts                # 360x640 mobile preview 5-criteria rubric (R2)
├── tests/
│   ├── adversarial/                              # R22 Adversarial Test Harness & Fixtures
│   │   ├── fixtures/                             # 12 Deliberate Bad Fixtures
│   │   │   ├── 01-sub-threshold-typography.tsx   # 14px body font in informational component
│   │   │   ├── 02-out-of-bounds-impact.json      # Impact frame 450 in shot duration [618, 1309]
│   │   │   ├── 03-naked-scene-cut.json           # Discontinuous camera jump with no declared transition
│   │   │   ├── 04-dual-audio-playback.tsx        # Mounts master WAV + discrete cue <Audio> tags
│   │   │   ├── 05-machine-absolute-path.json     # Contains /home/hongphuoc6104/ path string
│   │   │   ├── 06-am-adam-default-voice.json     # Config defaulting to Kokoro am_adam instead of Adam
│   │   │   ├── 07-audio-metadata-mismatch.json   # Manifest declares 48kHz but WAV is 24kHz
│   │   │   ├── 08-stale-scene-timing.tsx         # Component uses hardcoded frames out of sync with ShotSpec
│   │   │   ├── 09-cue-visual-desync.json         # SFX cue fires before visual actor is mounted
│   │   │   ├── 10-dense-card-grid.tsx            # 5 taxonomy cards rendered simultaneously
│   │   │   ├── 11-fake-duration-inflation.json   # Empty frame stretch without narration tokens
│   │   │   └── 12-unannotated-temporal-spike.json# Frame difference spike > 4x without ShotSpec whitelist
│   │   └── run-adversarial-suite.ts              # Harness executing and asserting 100% rejection
│   └── e2e/
│       ├── harness/                              # Zero-dependency assertion engine & runners
│       ├── tier1-features/                       # 140 isolated feature contract tests
│       ├── tier2-boundaries/                     # 140 limit, boundary & corner tests
│       ├── tier3-combinations/                   # 30 pairwise cross-feature interaction tests
│       └── tier4-applications/                   # 15 realistic end-to-end explainer scenarios
├── scripts/
│   ├── run-adversarial-suite.ts                  # Root runner for adversarial gate
│   └── render-scopus-v3_3.ts                     # Dual-render 1080p & 360p execution pipeline
└── out/
    ├── final-v3_3.mp4                            # 1080x1920 master MP4
    ├── preview-360x640.mp4                       # 360x640 preview MP4
    ├── qa-report.json                            # Independent QA evaluation report
    └── preview-rubric-report.json                # Mobile preview rubric scores
```

### 3.2 Master Execution Commands

```bash
# 1. Execute full adversarial false-positive verification (R22)
npx tsx scripts/run-adversarial-suite.ts

# 2. Run all static and AST validators
npm run validate:all
# Alternatively run individually:
npx tsx validators/validate-mobile-typography.ts connection-film/src/scopus-explainer
npx tsx validators/validate-shot-spec.ts connection-film/src/scopus-explainer/shot-spec.json
npx tsx validators/validate-audio-ownership.ts connection-film/src/scopus-explainer
npx tsx validators/validate-portability.ts connection-film/src/scopus-explainer

# 3. Inspect 360x640 mobile preview against the 5-criteria rubric (R2)
npx tsx validators/validate-preview-rubric.ts out/preview-360x640.mp4 \
  --timeline connection-film/src/scopus-explainer/semantic-timeline.json \
  --output out/preview-rubric-report.json

# 4. Verify temporal motion continuity on rendered MP4 (R9)
npx tsx validators/temporal-render-qa.ts out/final-v3_3.mp4 \
  --shot-spec connection-film/src/scopus-explainer/shot-spec.json \
  --threshold 4.0

# 5. Execute full Tier 1 - Tier 4 E2E Test Suite
npx tsx tests/e2e/run-e2e-tests.ts --tier=all --strict
```

### 3.3 Pass / Fail Semantics

1. **Standard Validation Mode (Clean Inputs):**
   - Quality gates must exit with `0` on compliant inputs.
   - Any rule violation (e.g. typography $< 34\text{px}$, unannotated spike $> 4\times$, out-of-range impact frame) immediately prints descriptive errors and terminates with exit code `1`.
   - **Zero Warnings-Only Bypass**: Warnings in production code are treated as fatal errors during CI and benchmark acceptance.
2. **Adversarial Verification Mode (Bad Fixtures):**
   - An adversarial test passes **if and only if** the target validator terminates with non-zero exit code (`1`) AND emits the expected error signature.
   - If a validator succeeds with exit code `0` on a bad fixture, the adversarial runner halts immediately with a fatal **FALSE POSITIVE ACCEPTANCE** error.

---

## 4. Real-World Application Scenarios (Tier 4)

Tier 4 exercises complete production workflows modeling realistic educational explainer pipelines:

### Scenario 1: `T4-SCN-01` — Scopus Explainer 103.20s Full Pipeline Run
- **Description:** Complete end-to-end generation and validation of the 103.20s Scopus explainer video across all 23 semantic beats (3096 frames).
- **Assertions:** `semantic-timeline.json` frame count matches audio master duration ($\Delta t \le 0.05\text{s}$), all 5 scenes mount sequentially, zero dropped frames, all 4 motivated transitions execute smoothly, exit code 0 across all validators.

### Scenario 2: `T4-SCN-02` — 5-Door Research Gap Taxonomy Progressive Disclosure
- **Description:** Staging of the 5 Research Gap doors (Theoretical, Empirical, Contextual, Methodological, Practical) under progressive disclosure.
- **Assertions:** Never mounts all 5 cards simultaneously with full informational text. Each door enters as a focused, full-screen visual beat. Card contour detector in `validate-preview-rubric.ts` asserts $N_{\text{cards}} \le 2$ at all times ($S_c \ge 4.2$).

### Scenario 3: `T4-SCN-03` — 3-Tier Gap Statement Modular Assembly
- **Description:** Animation of the 3-Tier Gap Statement (Foundation Tier $\to$ Problem Tier $\to$ Positioning Tier) and the 4-Sentence Template.
- **Assertions:** Visual assembly blocks snap together with spring physics (`settle` oscillations $\le 3$), text remains $\ge 38\text{px}$ for block titles and $\ge 34\text{px}$ for descriptions. Optical legibility on 360p preview $\ge 4.30$.

### Scenario 4: `T4-SCN-04` — Digital Banking Case Study Mobile Legibility
- **Description:** Verification of the applied case study (Digital banking e-service quality, trust, perceived risk, continuance intention).
- **Assertions:** Replaces legacy $10\text{px}$ and $12\text{px}$ text with mobile-compliant typography ($\ge 34\text{px}$ in 1080p, $\ge 11.3\text{px}$ in 360p). Contrast ratio against dark navy background $\ge 4.5:1$.

### Scenario 5: `T4-SCN-05` — Swales CARS Move 1-2-3 Dynamic Retiming
- **Description:** Dynamic choreography of the Swales CARS model (Establishing territory $\to$ Niche $\to$ Occupying niche).
- **Assertions:** Animations expand to fill the allocated 14.5s narration duration without static freezes or uniform linear stretching. Camera tracks focus points with C0 and C1 velocity continuity.

### Scenario 6: `T4-SCN-06` — Desk Reject High-Velocity Stamp Impact Whitelist
- **Description:** High-velocity desk reject stamp animation in Scene 1 triggering a rapid visual frame change.
- **Assertions:** Impact frame index is declared in `shot-spec.json` within shot duration. `temporal-render-qa.ts` verifies that the frame difference spike ($> 4\times$ local median) is cleanly reconciled against the whitelist.

### Scenario 7: `T4-SCN-07` — Continuous Camera Carry Scene Transition Continuity
- **Description:** Scene boundary transitions between Scene 1 and Scene 2 (frames 603–633), Scene 2 and Scene 3 (1294–1324), Scene 3 and Scene 4 (1961–1991), Scene 4 and Scene 5 (2516–2546).
- **Assertions:** Motivated transition types (`camera_carry`, `portal_morph`, `block_unfold`) declared in ShotSpec. Zero naked hard cuts. Temporal difference curve remains smooth with zero unwhitelisted spikes.

### Scenario 8: `T4-SCN-08` — PREMIXED Master Audio Single Ownership Playback
- **Description:** Auditory verification that Remotion mounts only `scopus_master_audio.wav` with zero discrete cue `<Audio>` elements.
- **Assertions:** Static AST scan asserts exactly 1 `<Audio>` tag in `ScopusExplainerFilm.tsx`. Audio power measurements confirm zero double playback energy spikes (+6dB phase summation prevented).

### Scenario 9: `T4-SCN-09` — Role-Aware Natural Pause Acoustics & Dynamics (-15 LUFS)
- **Description:** Narration audio synthesis and mixing enforcing role-aware pause ranges (clauses 0.08–0.20s, sentences 0.18–0.40s, section turns 0.40–0.80s).
- **Assertions:** EBU R128 integrated loudness matches $-15.0 \pm 0.5$ LUFS. Maximum true peak $\le -1.8$ dBTP. Loudness range $\text{LRA} \le 12.0$ LU. Zero production background music assets present.

### Scenario 10: `T4-SCN-10` — Air-Gapped Clean Environment Run with Zero Network Leaks
- **Description:** Full synthesis, alignment, and rendering pipeline executed with external network interfaces disabled.
- **Assertions:** `offline-network-guard.ts` intercepts all sockets. Pipeline generates valid audio, subtitles, and video without making external HTTP/API requests.

### Scenario 11: `T4-SCN-11` — 360x640 Mobile Preview Readability Verification
- **Description:** Automated inspection of `out/preview-360x640.mp4` across the 5 mobile legibility criteria.
- **Assertions:** `validate-preview-rubric.ts` confirms overall score $\ge 4.50/5.00$, with primary visual recognizable, text readable without zooming, no dense card grids, one focal idea per frame, and zero caption-subject collisions.

### Scenario 12: `T4-SCN-12` — 100% Concept Traceability from Source Documents
- **Description:** Traceability audit verifying that all 24 academic concepts from the 3 source document images in `content/` are mapped to semantic beats.
- **Assertions:** `source-content-map.json` coverage metric $= 100.0\%$. Zero conceptual omissions or arbitrary truncations.

### Scenario 13: `T4-SCN-13` — Portable Multi-OS Workspace Relocation Audit
- **Description:** Simulates moving the workspace directory to an arbitrary filesystem location or differing OS username.
- **Assertions:** `validate-portability.ts` scans all committed files and verifies zero occurrences of machine-specific paths (`/home/hongphuoc6104`, `/Users/`, `C:\`).

### Scenario 14: `T4-SCN-14` — Multilingual VieNeu Adam TTS Voice Parity
- **Description:** Verification of the bilingual Vietnamese-first speech synthesis using VieNeu-TTS v3 Turbo with English terms (*Scopus*, *Research Gap*, *Desk Reject*, *Swales CARS*).
- **Assertions:** Configured voice is strictly `Adam` (VieNeu-TTS). Pronunciation map properly decouples display text from spoken phonetic tokens. Zero silent fallbacks to Kokoro `am_adam`.

### Scenario 15: `T4-SCN-15` — Independent Reviewer Acceptance Scoring
- **Description:** Generation of the final independent QA certification report (`out/qa-report.json`).
- **Assertions:** Evaluates all 8 mandatory rubric categories (Mobile Readability, Information Density, Audio/Visual Synchronization, Narration Naturalness, Timing Integrity, Production Portability, Source Content Coverage, Validator Reliability). Overall average $\ge 4.50/5.00$, no category $< 4.00$, critical categories $\ge 4.30$.

---

## 5. Coverage Thresholds & Acceptance Gates

### 5.1 Formal Acceptance Thresholds
$$\begin{array}{|l|c|c|}
\hline
\textbf{Quality Gate / Metric} & \textbf{Minimum Threshold} & \textbf{Enforcing Validator} \\ \hline
\text{Mobile Font Size (Hero)} & \ge 64\text{px} & \text{validate-mobile-typography.ts} \\
\text{Mobile Font Size (Section)} & \ge 48\text{px} & \text{validate-mobile-typography.ts} \\
\text{Mobile Font Size (Card Title)} & \ge 38\text{px} & \text{validate-mobile-typography.ts} \\
\text{Mobile Font Size (Body)} & \ge 34\text{px} & \text{validate-mobile-typography.ts} \\
\text{Mobile Font Size (Secondary)} & \ge 30\text{px} & \text{validate-mobile-typography.ts} \\
\text{Mobile Font Size (Karaoke)} & \ge 52\text{px} & \text{validate-mobile-typography.ts} \\
\text{ShotSpec Impact Frame Bounds} & \text{Start} \le t_{\text{impact}} \le \text{End} & \text{validate-shot-spec.ts} \\
\text{Motivated Transition Whitelist} & \in \{\text{camera\_carry, portal\_morph, \dots}\} & \text{validate-shot-spec.ts} \\
\text{Remotion Audio Ownership} & \text{Exactly 1 master Audio tag} & \text{validate-audio-ownership.ts} \\
\text{Machine-Specific Absolute Paths} & 0 \text{ occurrences} & \text{validate-portability.ts} \\
\text{Master Integrated Loudness} & -15.0 \pm 0.5 \text{ LUFS} & \text{validate-audio-mix.ts} \\
\text{Master Maximum True Peak} & \le -1.8 \text{ dBTP} & \text{validate-audio-mix.ts} \\
\text{Temporal Unannotated Spikes} & 0 \text{ spikes } (> 4.0\times \text{ median}) & \text{temporal-render-qa.ts} \\
\text{Mobile Preview Rubric (Overall)} & \ge 4.50 / 5.00 & \text{validate-preview-rubric.ts} \\
\text{Mobile Preview (Critical Categories)} & \ge 4.30 / 5.00 & \text{validate-preview-rubric.ts} \\
\text{Source Content Coverage} & 100.0\% & \text{source-content-map.json} \\
\text{Adversarial Fixture Rejection Rate} & 100.0\% \text{ (12 / 12)} & \text{scripts/run-adversarial-suite.ts} \\
\hline
\end{array}$$

### 5.2 Failure Protocol
If any quality gate fails:
1. The execution pipeline terminates immediately with non-zero exit code.
2. A structured JSON error payload is emitted specifying the failing file, line number, metric value, and threshold.
3. The video build is marked as **NON-COMPLIANT** and production export is halted.

---

## 6. Backward Compatibility: V2 Feature Taxonomy Mapping (`F-PKG-CANONICAL` through `F-SHOTSPEC-CUES`)

For continuity across releases, the V3.3 production hardening framework maintains full bidirectional trace to the V2 motion engine test taxonomy:

| # | V2 Feature ID | Scope & Module | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Total |
|---|---------------|----------------|:------:|:------:|:------:|:------:|:-----:|
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

All legacy features (`F-PKG-CANONICAL` through `F-SHOTSPEC-CUES`) remain verified in full within the root regression harness.

