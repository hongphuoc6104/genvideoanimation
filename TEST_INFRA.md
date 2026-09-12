# TEST_INFRA.md — Master Test Infrastructure Specification
**Project:** V3.3 Production Integrity Hardening (Failure-First Acceptance)  
**Version:** 3.3.0-PROD  
**Working Directory:** `/home/hongphuoc6104/Desktop/videorenderhoathinh`  
**Authoritative Sources:** `ORIGINAL_REQUEST.md` (V3.3 section 2026-09-10T11:05:38Z: R1–R23 and 2026-09-10T13:19:51Z: R1–R17), `.agents/orchestrator_9/PROJECT.md` (F01–F18), `.agents/teamwork_preview_spec_miner_survey_1/handoff.md`

---

## 1. Test Philosophy & Architecture

The V3.3 Production Integrity Hardening E2E Test Framework operates under five non-negotiable architectural principles designed to eliminate all false-positive acceptance paths across static AST analysis, acoustic DSP, temporal motion, mobile preview legibility, and governance policies:

### 1.1 Opaque-Box, Requirement-Driven Testing
All tests derive strictly from authoritative requirements R1–R17 (Features F01–F18). Verification is conducted exclusively through public module contracts, filesystem artifacts, CLI execution signatures, AST visitors, and binary media streams (physical RIFF WAV headers, decoded MP4 pixel buffers, ffprobe streams). Tests maintain zero coupling to internal implementation classes, verifying observable behavioral and physical invariants.

### 1.2 Failure-First Acceptance & Adversarial Verification
A quality gate is never certified simply because it passes clean inputs; it must demonstrably reject deliberately invalid inputs. The suite verifies:
- Strict fail-closed semantics on missing or corrupted media (exit code 1, zero synthetic Buffer.alloc fallback).
- 100% rejection rate across 12+ defective fixtures (typography violations, out-of-range impacts, naked cuts, duplicate audio tags, machine paths, Kokoro voice defaults, metadata mismatches, out-of-sync scene timing, dense card grids, fake duration inflation, unannotated temporal spikes, omitted curriculum units).
- 100% pass rate across matching clean positive baselines.

### 1.3 4-Tier Hierarchical Testing Methodology
Verification is partitioned into 4 complementary tiers:
- **Tier 1 — Feature Coverage (>= 5 tests per feature across R1–R17 = 85 tests):** Happy-path and contract verification of each feature in isolation.
- **Tier 2 — Boundary, Limit & Corner Cases (>= 5 tests per feature across R1–R17 = 85 tests):** Extreme limits, out-of-bounds frame bounds, zero-length arrays, NaN/null values, boundary scales, pause extremes, and non-monotonic sequences.
- **Tier 3 — Cross-Feature Pairwise Interactions (21 tests):** Verification of data contract handoffs across pipeline subsystems (e.g. Policy ↔ Typography, Timeline ↔ ShotSpec, VieNeu TTS ↔ Audio Mix, Preview Lineage ↔ Real Video Decoding).
- **Tier 4 — Real-World Application Scenarios (14 comprehensive scenarios):** Execution of full production explainer sequences under realistic operational conditions (Scopus Explainer 103.20s full pipeline, 5-Door Gap taxonomy progressive disclosure, 3-Tier Gap assembly, Digital banking case study mobile legibility, Swales CARS retiming, Science/History/Technology generalization mini-projects, Independent Reviewer rubric certification).

### 1.4 Mobile-First Physical Legibility & Progressive Disclosure (R1, R2, R3, R5)
In dual-render production ($1080 \times 1920$ master and $360 \times 640$ QA preview), text height must never render below $10.0\text{px}$ on the $360\text{p}$ canvas ($30\text{px}$ in $1080\text{p}$). Parent SVG/CSS transform scaling factors ($\text{Font} \times \prod \text{Scale}$) are computed recursively to prevent deceptive compliance. Multi-card information dumps are prohibited; choreography must adhere to progressive disclosure (1 primary idea per beat).

### 1.5 Strict Acoustic & Environment Portability (R8, R10)
Remotion compositions enforce `PREMIXED` single audio ownership (master audio WAV contains narration and all mixed SFX; Remotion mounts exactly one `<Audio>` tag; zero secondary cue tags; zero production music). Committed manifests contain zero machine-specific absolute paths (`/home/`, `C:\`, `/Users/`).

---

## 2. Feature Inventory Mapping & Coverage Invariants

The V3.3 framework maps all 17 requirements (R1–R17 / F01–F18) across the 4 tiers:

| Feature ID | Feature Name | Requirement Source | Milestone | Tier 1 (Happy) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Scenario) | Total Tests |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **F01** | Canonical Production Policy | R1 | M1 | 5 | 5 | T3-01, T3-02, T3-03, T3-04 | S01 | 15 |
| **F02** | Effective Typography Scaling Validator | R2 | M2 | 5 | 5 | T3-01, T3-05, T3-06 | S04 | 14 |
| **F03** | Deterministic Mobile Preview Lineage | R3 | M3 | 5 | 5 | T3-05, T3-07, T3-08 | S01, S04 | 15 |
| **F04** | Real Video Decoding & Parity | R4 | M3 | 5 | 5 | T3-07, T3-09 | S01, S14 | 14 |
| **F05** | Progressive Disclosure Choreography | R5 | M5 | 5 | 5 | T3-06, T3-10, T3-11 | S02, S03 | 15 |
| **F06** | Canonical Semantic Timeline | R6 | M5 | 5 | 5 | T3-10, T3-12, T3-13, T3-14 | S01, S05 | 16 |
| **F07** | Real ShotSpec & Motivated Transitions | R7 | M2 | 5 | 5 | T3-09, T3-12, T3-15 | S06, S07 | 15 |
| **F08** | Single Audio Ownership & Routing | R8 | M2 | 5 | 5 | T3-02, T3-13, T3-16, T3-17 | S08 | 16 |
| **F09** | Safe VieNeu TTS Default & Voice Routing | R9 | M1 | 5 | 5 | T3-03, T3-18 | S01, S10 | 14 |
| **F10** | Real Audio Metadata & Portability | R10 | M2 | 5 | 5 | T3-04, T3-16, T3-18 | S08, S13 | 15 |
| **F11** | 100% Source Content Coverage Map | R11 | M2 | 5 | 5 | T3-14, T3-19 | S01, S12 | 14 |
| **F12** | Skill & Governance Hardening | R12 | M1 | 5 | 5 | T3-01, T3-14 | S01, S13 | 14 |
| **F13** | Canonical Acceptance Entrypoint | R13 | M4 | 5 | 5 | T3-20, T3-21 | S01, S14 | 14 |
| **F14** | Adversarial Fixture Suite (12+ Bad Fixtures) | R14 | M4 | 5 | 5 | T3-15, T3-17, T3-20 | S06, S14 | 15 |
| **F15** | Scopus Canary Migration (70.4s Fix, 103.20s) | R15 | M5 | 5 | 5 | T3-08, T3-11, T3-19 | S01, S02, S03 | 15 |
| **F16** | Generalization Proof (3 Unseen Projects) | R16 | M6 | 5 | 5 | T3-07, T3-21 | S10, S11, S12 | 14 |
| **F17** | Independent Review Quality Rubric (18 Categories)| R17 | M7 | 5 | 5 | T3-21 | S14 | 14 |
| **Total** | | | | **85** | **85** | **21** | **14** | **205** |

### Mathematical Coverage Invariant:
$$\text{Total Test Cases} = \text{Tier 1 } (85) + \text{Tier 2 } (85) + \text{Tier 3 } (21) + \text{Tier 4 } (14) = 205 \ge 196 \quad [\mathbf{PASS}]$$

### 2.1 Canonical Feature Aliases & Subsystem Inventory
The framework maps legacy requirement IDs to canonical feature tags:
- `F-PKG-CANONICAL`: Canonical Production Package Isolation & Strict Runtime Boundaries (R1/R15)
- `F-SHOTSPEC-CUES`: Frame-Accurate ShotSpec Cues, Transitions & Temporal Invariants (R7)
- `F-TYPOGRAPHY-SCALE`: Mobile Effective Scale & Typography Floor (R2)
- `F-AUDIO-PREMIXED`: Single Audio Tag Ownership & Premixed Master WAV (R8/R10)
- `F-TIMELINE-CHOREO`: Semantic Timeline Dynamic Adaptation & Progression (R5/R6)
- `F-GEOM-PRIMITIVES`: Smart Self-Protecting Geometric Primitives & AutoPill
- `F-FULL-PIPELINE`: Full End-to-End System Pipeline & QA Certification (R13/R17)

---

## 3. Test Architecture & Directory Layout

### 3.1 Directory Layout
```
/home/hongphuoc6104/Desktop/videorenderhoathinh/
├── tests/
│   ├── v3_3/                                     # Dedicated V3.3 E2E Test Suite
│   │   ├── harness/                              # Zero-dependency assertion engine & context
│   │   │   ├── assert.ts                         # Strict invariant assertions
│   │   │   ├── runner.ts                         # V3.3 Test Runner with auto-discovery & TAP/JSON
│   │   │   ├── test-context.ts                   # Types and registry interfaces
│   │   │   └── mock-fixtures.ts                  # Invariant fixtures (policy, timeline, shot-spec)
│   │   ├── tier1-features/                       # Tier 1 Feature Contract Suites (85 tests)
│   │   │   ├── f01-production-policy.test.ts     # 5 tests
│   │   │   ├── f02-effective-typography.test.ts  # 5 tests
│   │   │   ├── f03-preview-lineage.test.ts       # 5 tests
│   │   │   ├── f04-video-decoding.test.ts        # 5 tests
│   │   │   ├── f05-progressive-disclosure.test.ts# 5 tests
│   │   │   ├── f06-semantic-timeline.test.ts     # 5 tests
│   │   │   ├── f07-shot-spec.test.ts             # 5 tests
│   │   │   ├── f08-audio-ownership.test.ts       # 5 tests
│   │   │   ├── f09-vieneu-tts-routing.test.ts    # 5 tests
│   │   │   ├── f10-audio-metadata.test.ts        # 5 tests
│   │   │   ├── f11-source-coverage.test.ts       # 5 tests
│   │   │   ├── f12-governance-hardening.test.ts  # 5 tests
│   │   │   ├── f13-acceptance-entrypoint.test.ts # 5 tests
│   │   │   ├── f14-adversarial-suite.test.ts     # 5 tests
│   │   │   ├── f15-scopus-canary.test.ts         # 5 tests
│   │   │   ├── f16-generalization.test.ts        # 5 tests
│   │   │   └── f17-quality-rubric.test.ts        # 5 tests
│   │   ├── tier2-boundaries/                     # Tier 2 Boundary, Limit & Corner Suites (85 tests)
│   │   │   ├── f01-policy-boundaries.test.ts     # 5 tests
│   │   │   ├── f02-typography-boundaries.test.ts # 5 tests
│   │   │   ├── f03-lineage-boundaries.test.ts    # 5 tests
│   │   │   ├── f04-decoding-boundaries.test.ts   # 5 tests
│   │   │   ├── f05-disclosure-boundaries.test.ts # 5 tests
│   │   │   ├── f06-timeline-boundaries.test.ts   # 5 tests
│   │   │   ├── f07-shot-spec-boundaries.test.ts  # 5 tests
│   │   │   ├── f08-ownership-boundaries.test.ts  # 5 tests
│   │   │   ├── f09-tts-boundaries.test.ts        # 5 tests
│   │   │   ├── f10-metadata-boundaries.test.ts   # 5 tests
│   │   │   ├── f11-coverage-boundaries.test.ts   # 5 tests
│   │   │   ├── f12-governance-boundaries.test.ts # 5 tests
│   │   │   ├── f13-entrypoint-boundaries.test.ts # 5 tests
│   │   │   ├── f14-adversarial-boundaries.test.ts# 5 tests
│   │   │   ├── f15-canary-boundaries.test.ts     # 5 tests
│   │   │   ├── f16-generalization-boundaries.test.ts # 5 tests
│   │   │   └── f17-rubric-boundaries.test.ts     # 5 tests
│   │   ├── tier3-combinations/                   # Tier 3 Pairwise Combinations (21 tests)
│   │   │   ├── t3-policy-typography.test.ts      # T3-01 to T3-04
│   │   │   ├── t3-lineage-decoding.test.ts       # T3-05 to T3-09
│   │   │   ├── t3-timeline-choreography.test.ts  # T3-10 to T3-14
│   │   │   └── t3-audio-adversarial-gates.test.ts# T3-15 to T3-21
│   │   └── tier4-scenarios/                      # Tier 4 Real-World Application Scenarios (14 tests)
│   │       ├── t4-scopus-canary.test.ts          # S01, S02, S03, S04, S05
│   │       ├── t4-continuity-audio.test.ts       # S06, S07, S08, S09
│   │       └── t4-generalization-governance.test.ts # S10, S11, S12, S13, S14
│   └── run-v3_3-e2e.ts                           # Master runner script
```

### 3.2 Master Execution Commands
```bash
# 1. Run all 205 V3.3 E2E tests across all tiers
npx tsx tests/v3_3/run-v3_3-e2e.ts

# 2. Run specific tier
npx tsx tests/v3_3/run-v3_3-e2e.ts --tier=1    # 85 Feature contract tests
npx tsx tests/v3_3/run-v3_3-e2e.ts --tier=2    # 85 Boundary tests
npx tsx tests/v3_3/run-v3_3-e2e.ts --tier=3    # 21 Pairwise combination tests
npx tsx tests/v3_3/run-v3_3-e2e.ts --tier=4    # 14 Real-world application scenarios

# 3. Filter by feature or scenario
npx tsx tests/v3_3/run-v3_3-e2e.ts --feature=F02
npx tsx tests/v3_3/run-v3_3-e2e.ts --scenario=S01

# 4. Strict mode & machine-readable JSON output
npx tsx tests/v3_3/run-v3_3-e2e.ts --strict --json --output=out/v3_3-e2e-summary.json
```

---

## 4. Real-World Application Scenarios (Tier 4)

- **Scenario S01 (`T4-SCN-01`):** Full Scopus Explainer 103.20s Pipeline Integration (3096 frames, 23 beats, 5 scenes, PREMIXED audio).
- **Scenario S02 (`T4-SCN-02`):** 5-Door Research Gap Taxonomy Progressive Disclosure (never mounts 3+ active cards simultaneously).
- **Scenario S03 (`T4-SCN-03`):** 3-Tier Gap Statement Modular Assembly (Foundation → Problem → Positioning with physics settle).
- **Scenario S04 (`T4-SCN-04`):** Digital Banking Case Study Mobile Legibility (informational text $\ge 34\text{px}$, 360p preview legible without zoom).
- **Scenario S05 (`T4-SCN-05`):** Swales CARS Move 1-2-3 Dynamic Retiming (14.5s narration driven, C0/C1 camera velocity continuity).
- **Scenario S06 (`T4-SCN-06`):** Desk Reject Stamp Impact Frame Whitelist (MAD spike $>4\times$ reconciled against ShotSpec).
- **Scenario S07 (`T4-SCN-07`):** Motivated Scene Boundary Transitions (camera carry, morph, wipe; zero naked cuts).
- **Scenario S08 (`T4-SCN-08`):** PREMIXED Master Audio Single Ownership Playback (1 `<Audio>` tag, zero double SFX energy).
- **Scenario S09 (`T4-SCN-09`):** Role-Aware Natural Pause Acoustics & Dynamics ($-15\text{ LUFS}$, natural pauses up to $0.80\text{s}$).
- **Scenario S10 (`T4-SCN-10`):** Generalization Proof: Science / Mechanism Explainer (CRISPR or ATP synthesis, clean gate pass).
- **Scenario S11 (`T4-SCN-11`):** Generalization Proof: Historical / Process Explainer (Printing Press or Steam Engine, clean gate pass).
- **Scenario S12 (`T4-SCN-12`):** Generalization Proof: Technology / Tutorial Explainer (TLS Handshake or Raft Consensus, clean gate pass).
- **Scenario S13 (`T4-SCN-13`):** Portable Multi-OS Workspace Relocation Audit (zero absolute machine paths across all committed files).
- **Scenario S14 (`T4-SCN-14`):** Independent Reviewer Quality Rubric Certification (18 categories, overall $\ge 4.50$, critical $\ge 4.30$).

---

## 5. Coverage Thresholds & Quality Gate Semantics

| Quality Gate / Invariant | Required Metric | Enforcing Rule / Tier |
|:---|:---:|:---|
| **Tier 1 Feature Tests** | $\ge 85$ tests passed ($100\%$) | Tier 1 Suite |
| **Tier 2 Boundary Tests** | $\ge 85$ tests passed ($100\%$) | Tier 2 Suite |
| **Tier 3 Pairwise Tests** | $\ge 21$ tests passed ($100\%$) | Tier 3 Suite |
| **Tier 4 Scenario Tests** | $\ge 14$ scenarios passed ($100\%$) | Tier 4 Suite |
| **Effective Font Size Floor** | $\ge 30\text{px}$ (mobile floor) | F02 (`validate-mobile-typography.ts`) |
| **Impact Frame Bounds** | $\text{startFrame} \le t_{\text{impact}} \le \text{endFrame}$ | F07 (`validate-shot-spec.ts`) |
| **Motivated Transitions** | $\in \{\text{8 whitelisted types}\}$ | F07 (`validate-shot-spec.ts`) |
| **Master Audio Tag Mount** | Exactly $1$ `<Audio>` tag | F08 (`validate-audio-ownership.ts`) |
| **Machine-Specific Paths** | $0$ occurrences | F10 (`validate-portability.ts`) |
| **Source Content Coverage** | $100.0\%$ ($24/24$ units) | F11 (`validate-source-coverage.ts`) |
| **Adversarial Bad Fixtures** | $100.0\%$ rejection rate ($12/12$) | F14 (`scripts/run-adversarial-suite.ts`) |
| **Mobile Preview Parity** | $\text{PSNR} \ge 35.0\text{ dB}$, Frame parity | F03 (`validate-preview-parity.ts`) |
| **Real Video Decoding** | Zero `Buffer.alloc` fake frames | F04 (`validate-preview-rubric.ts`) |
| **Overall Rubric Score** | $\ge 4.50 / 5.00$ (Critical $\ge 4.30$) | F17 (`qa-report.json`) |
