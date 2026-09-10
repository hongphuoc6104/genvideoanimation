# Production Quality Rubric (V3.3 Failure-First Governance)

This rubric establishes authoritative, failure-first quality standards for the educational flat vector motion video pipeline (`educational-flat-motion`). Scoring is conducted on an objective 1.0–5.0 scale across 8 mandatory production categories.

---

## 1. Core Governance Principles

Every production composition must strictly adhere to the following governance invariants:

1. **`NEVER_SHRINK_TO_FIT`**: Informational typography must never be scaled below mobile readability minimums. When content does not fit comfortably, choreograph additional sequential visual beats instead of shrinking font sizes, omitting information, or summarizing.
2. **`ONE_PRIMARY_IDEA_PER_BEAT`**: A single visual beat must communicate exactly one primary concept. Simultaneous multi-card dumps are strictly prohibited.
3. **`PROGRESSIVE_DISCLOSURE`**: Multi-item frameworks, taxonomies, and processes must unfold sequentially (Overview → Item 1 focus → Item 2 focus → ... → Synthesis/Recap).
4. **`MOBILE_FIRST_READABILITY`**: Primary visuals and informational typography must be instantly legible on a 360x640 mobile preview without zooming or squinting.
5. **`ONE_AUTHORITATIVE_TIMELINE`**: All scene durations, shot boundaries, visual cues, SFX triggers, and captions derive strictly from `semantic-timeline.json`. Hardcoded frame constants are forbidden.
6. **`ONE_AUDIO_OWNER_PER_ASSET`**: Enforce `PREMIXED` audio strategy. Master audio contains narration and all mixed sound effects; Remotion mounts master audio exclusively. Secondary Remotion `<Audio>` tags for cues are prohibited.
7. **`FINAL_RENDER_IS_AUTHORITATIVE`**: Quality certification requires inspecting actual rendered MP4 video frames (at full 1080x1920 and preview 360x640), decoded temporal frame differences (MAD), and measured audio WAV waveforms.
8. **`NO_SELF_CERTIFICATION`**: Implementing agents are strictly prohibited from scoring their own compositions. All evaluations must be performed by independent reviewer agents and automated validation gates.

---

## 2. Category Summary & Acceptance Matrix

| # | Category | Critical? | Min Score | Verification Gate / Instrument |
|---|---|:---:|:---:|---|
| **1** | **Mobile Readability** | **YES** | **4.3** | `preview-360x640.mp4` inspection, `validators/validate-mobile-typography.ts` (AST) |
| **2** | **Information Density** | NO | 4.0 | Progressive disclosure audit, card count inspection per frame |
| **3** | **Audio/Visual Synchronization** | **YES** | **4.3** | Narration token alignment within $\pm 2$ frames, SFX impact frame verification |
| **4** | **Narration Naturalness** | **YES** | **4.3** | VieNeu `Adam` TTS verification, role-aware pause audit (0.08–0.80s), -15 LUFS / -1.8 dBTP |
| **5** | **Timing Integrity** | **YES** | **4.3** | `semantic-timeline.json` derivation, `validate-shot-spec.ts`, MP4 temporal MAD QA |
| **6** | **Production Portability** | NO | 4.0 | `validators/validate-portability.ts`, zero absolute paths, single PREMIXED audio owner |
| **7** | **Source-to-Video Content Coverage** | NO | 4.0 | `source-content-map.json` 100% concept coverage audit, zero unauthorized summarization |
| **8** | **Validator Reliability** | **YES** | **4.3** | 100% exit code 0 on production validators, 100% rejection rate on adversarial bad suite |

---

## 3. Strict Acceptance Thresholds

A composition passes quality certification **only if ALL three conditions are satisfied**:

1. **Overall Average Threshold**: The arithmetic mean score across all 8 categories must be **$\ge 4.50 / 5.00$**.
2. **Category Floor Threshold**: No single category score may fall below **$4.00$**. Any score $< 4.00$ triggers immediate disqualification.
3. **Critical Category Threshold**: Every critical category (**1, 3, 4, 5, and 8**) must individually achieve a score of **$\ge 4.30$**.

```
Pass Condition = (Mean(Categories 1..8) >= 4.50)
                 AND (Min(Categories 1..8) >= 4.00)
                 AND (Min(Categories 1, 3, 4, 5, 8) >= 4.30)
```

---

## 4. Detailed Category Scoring Criteria

### Category 1: Mobile Readability (CRITICAL — Minimum Required: 4.3)

Evaluates whether 1080x1920 (9:16 vertical) production renders deliver effortless mobile legibility when viewed at 360x640 preview resolution without user zooming.

- **Objective Metric Standards**:
  - Hero text: $\ge 64\text{px}$
  - Section title: $\ge 48\text{px}$
  - Card title: $\ge 38\text{px}$
  - Body text: $\ge 34\text{px}$
  - Secondary informational text: $\ge 30\text{px}$
  - Karaoke captions: $\ge 52\text{px}$
  - Screen edge safe zone: $\ge 48\text{px}$ padding
  - Contrast ratio: $\ge 4.5:1$ (WCAG AA compliant)
  - Karaoke caption collision: 0 collisions with character head, active graphics, or focal elements.

- **Scoring Rubric**:
  - **1.0 (Critical Failure)**: Unreadable on 360x640 preview; informational text below 24px (e.g. 14px–20px); text overlaps graphics or captions; contrast ratio $< 3:1$; severe text clipping at screen boundaries.
  - **2.0 (Substandard)**: Multiple typography threshold violations (e.g. body text 26–30px, card titles $< 36\text{px}$); cramped layout without safe margin padding; karaoke subtitles overlap scene elements; requires squinting/zooming on 360x640.
  - **3.0 (Marginal — FAIL)**: Minor typography violation (e.g., secondary text 28px instead of 30px); text readable on 360x640 but layout feels crowded; contrast borderline in 1–2 scenes; captions occasionally graze visual assets.
  - **4.0 (Pass — Production Standard)**: 100% compliance with typography minimums; 360x640 preview is crisp and effortlessly readable without zooming; zero text overlaps; all elements respect safe margins ($\ge 48\text{px}$); contrast ratios $\ge 4.5:1$ everywhere; captions have dedicated non-colliding zone.
  - **5.0 (Exemplary)**: Typographic perfection; optimal optical hierarchy and line leading (1.3–1.5x font size); dynamic contrast tuning; subtitles feature elegant pill/letterbox background with subtle drop shadow guaranteeing 100% legibility regardless of underlying background animation; masterclass mobile composition.

- **Disqualification Triggers**:
  - Any informational text $< 30\text{px}$ in production TSX.
  - Any karaoke caption $< 52\text{px}$.
  - Any frame where karaoke captions cover character facial expressions or focal illustrations.

---

### Category 2: Information Density (Minimum Required: 4.0)

Evaluates cognitive load pacing and visual hierarchy under the `ONE_PRIMARY_IDEA_PER_BEAT` and `PROGRESSIVE_DISCLOSURE` principles.

- **Objective Metric Standards**:
  - Maximum simultaneous primary ideas per frame: **1**.
  - Maximum simultaneous active/animated cards: **1** (secondary context cards must be dimmed, collapsed, or receded).
  - Progressive disclosure for taxonomies/frameworks: Must sequence through Overview $\rightarrow$ Step 1 $\rightarrow$ Step 2 $\rightarrow$ ... $\rightarrow$ Summary.
  - Cognitive dwell time: Minimum 1.2 seconds visual hold per disclosed concept before transitioning.

- **Scoring Rubric**:
  - **1.0 (Critical Failure)**: PowerPoint-style slide dump. 4+ dense cards displayed simultaneously with heavy bulleted text; viewer cannot determine where to look; visual elements compete aggressively for attention.
  - **2.0 (Substandard)**: 3 cards shown simultaneously with competing visual motion or un-dimmed text; weak progressive disclosure where cards flash by too quickly for cognitive absorption ($< 1.0\text{s}$ dwell time).
  - **3.0 (Marginal — FAIL)**: Sequential disclosure attempted, but inactive cards remain at 100% opacity/saturation, cluttering screen; more than one competing visual element in motion simultaneously; viewer eye tracking splits between disparate focal points.
  - **4.0 (Pass — Production Standard)**: Strict adherence to `ONE_PRIMARY_IDEA_PER_BEAT`. Multi-item taxonomies use progressive disclosure: when an item is spoken, it occupies primary focus (full-screen or highlighted card while others recede/dim); zero simultaneous competing animations; single dominant focal center per frame.
  - **5.0 (Exemplary)**: Cognitive mastery. Complex academic frameworks (e.g. Scopus 4-stage Gap Framework) unfold with organic spatial clarity: clear orienting overview $\rightarrow$ single-concept deep dives with intuitive visual metaphors $\rightarrow$ fluid transition to next beat $\rightarrow$ unified recap synthesis; zero cognitive fatigue.

- **Disqualification Triggers**:
  - Displaying 3 or more un-dimmed informational cards simultaneously during a single spoken sentence.
  - Presenting bulleted text blocks without visual metaphor or sequential build.

---

### Category 3: Audio/Visual Synchronization (CRITICAL — Minimum Required: 4.3)

Evaluates temporal alignment between spoken narration tokens, visual graphic actions, and sound effect (SFX) impacts.

- **Objective Metric Standards**:
  - Narration-to-visual token alignment: Visual apex/contact hits within $\mathbf{\pm 2\text{ frames}}$ ($\pm 66.7\text{ms}$ at 30fps) of the spoken emphatic word onset.
  - Sound effect hit alignment: SFX audio attack transient aligns within $\mathbf{\pm 1\text{ frame}}$ ($\pm 33.3\text{ms}$) of the visual contact/impact frame.
  - Karaoke highlight synchronization: Word highlight onset matches acoustic phoneme onset within $\mathbf{\pm 1\text{ frame}}$.
  - Synchronization drift across video duration: $\mathbf{0\text{ frames}}$ cumulative drift.

- **Scoring Rubric**:
  - **1.0 (Critical Failure)**: Severe desynchronization drift $> 15\text{ frames}$ ($> 500\text{ms}$); visual actions happen seconds before or after narration; SFX plays during dead air or mismatched actions; karaoke highlights completely decoupled from speech.
  - **2.0 (Substandard)**: Systematic timing offsets between 6 and 15 frames (200–500ms); SFX hits noticeably lag or lead visual impacts; animations complete long before or linger long after narration sentence finishes.
  - **3.0 (Marginal — FAIL)**: Minor drift of 3 to 5 frames (100–166ms); visual hits occur slightly out of sync with emphatic spoken syllables; 1–2 SFX cues misaligned by $> 2\text{ frames}$.
  - **4.0 (Pass — Production Standard)**: Visual events and emphatic token hits align strictly within $\pm 2\text{ frames}$; SFX hits coincide exactly with the contact/impact frame ($\pm 1\text{ frame}$); karaoke highlights trigger synchronously with spoken words; zero cumulative drift.
  - **5.0 (Exemplary)**: Frame-perfect kinetic sympathy. Visual anticipations begin naturally 3–5 frames before token onset so that the apex/impact lands with acoustic transient perfection; SFX acoustic envelope (attack, decay, resonance) flawlessly reflects visual mass and velocity.

- **Disqualification Triggers**:
  - Any visual impact or SFX hit offset by $> 3\text{ frames}$ from its corresponding audio event.
  - Cumulative timing drift $> 2\text{ frames}$ between start and end of film.

---

### Category 4: Narration Naturalness (CRITICAL — Minimum Required: 4.3)

Evaluates the acoustic quality, prosodic realism, voice profile governance, and role-aware pause pacing of the voiceover.

- **Objective Metric Standards**:
  - Voice Profile Default: `GENVIDEO_ADAM_PROFILE.synthesis.voice = "Adam"` (VieNeu-TTS v3 Turbo, neural Vietnamese). Default routing to Kokoro (`am_adam`) is strictly forbidden.
  - Role-Aware Pause Ranges:
    - **Within clause** (commas, colons, dashes): $0.08\text{s} - 0.20\text{s}$
    - **Normal sentence** (period between standard thoughts): $0.18\text{s} - 0.40\text{s}$
    - **Semantic turn** (pivot, objection, contrast): $0.25\text{s} - 0.55\text{s}$
    - **Major section transition** (scene boundary): $0.40\text{s} - 0.80\text{s}$
    - **Payoff / Realization** (epiphany, core takeaway): $0.30\text{s} - 0.65\text{s}$
  - Broadcast Loudness Compliance:
    - Integrated Loudness: $-15.0\text{ LUFS} \pm 1.0\text{ LUFS}$ (range: $-16.0$ to $-14.0\text{ LUFS}$)
    - True Peak Ceiling: $\le -1.8\text{ dBTP}$
    - Loudness Range (LRA): $\ge 1.2\text{ LU}$ (over-compression warning if $< 1.0\text{ LU}$)
  - Speech Pacing: $140 - 180\text{ words/minute}$ (Vietnamese conversational explainer speed).
  - Bilingual Integrity: Correct pronunciation of Vietnamese diacritics and English technical terms ("Scopus", "Research Gap", "CARS model").

- **Scoring Rubric**:
  - **1.0 (Critical Failure)**: Synthesized with unapproved voice (e.g. Kokoro `am_adam` used as default for Vietnamese); severe acoustic clipping ($> -0.5\text{ dBTP}$); loudness outside safe broadcast envelope ($> -12\text{ LUFS}$ or $< -22\text{ LUFS}$); dead air $> 1.2\text{s}$ or crushed pauses $< 0.05\text{s}$; distorted Vietnamese tones.
  - **2.0 (Substandard)**: Pauses uniformly crushed to $\sim 0.16\text{s}$ throughout with zero role variation; robotic speech rate ($> 200\text{ wpm}$ or $< 110\text{ wpm}$); aggressive limiter pumping; garbled pronunciation of bilingual technical terms.
  - **3.0 (Marginal — FAIL)**: VieNeu `Adam` voice used, but pauses are mechanically rigid (all inter-sentence pauses identical); major section boundaries lack breathing room ($< 0.30\text{s}$ pause); dynamics borderline (LRA $< 1.0\text{ LU}$); minor sibilance clipping.
  - **4.0 (Pass — Production Standard)**: VieNeu `Adam` synthesis verified; 100% compliance with role-aware pause ranges across all 5 pause types; broadcast-compliant loudness ($-15\text{ LUFS} \pm 1.0$, True Peak $\le -1.8\text{ dBTP}$); speech rate 140–180 wpm; clear bilingual diction; zero breathless rushing.
  - **5.0 (Exemplary)**: Studio-grade oratorical eloquence. Masterful dramatic cadence with evocative rhetorical pauses; pitch contour matches visual emotional weight; clean signal-to-noise ratio, transparent acoustic dynamics, warmth, and natural human breathing presence.

- **Disqualification Triggers**:
  - Default routing to Kokoro `am_adam` for Vietnamese narration.
  - Any pause between major scene sequences $< 0.35\text{s}$ (rushed transition) or unmotivated pause $> 0.85\text{s}$ (unintentional dead-air).
  - True Peak exceeding $-1.8\text{ dBTP}$ or integrated loudness exceeding $-14.0\text{ LUFS}$.

---

### Category 5: Timing Integrity (CRITICAL — Minimum Required: 4.3)

Evaluates mathematical timeline coherence, derivation from the canonical semantic timeline, ShotSpec validity, and MP4 temporal continuity.

- **Objective Metric Standards**:
  - Authoritative Timeline: 100% of scene sequences, shot boundaries, visual cues, and caption frames derive strictly from `semantic-timeline.json`. Hardcoded frame constants = **0**.
  - Duration Parity: Total composition duration strictly matches master audio duration within $\mathbf{\pm 1\text{ frame}}$ ($\pm 33.3\text{ms}$).
  - ShotSpec Validity: 100% valid shot bounds; out-of-bounds impact frames = **0** in `validators/validate-shot-spec.ts`.
  - Frame Monotonicity: Strictly monotonic frame progression; zero negative durations; zero temporal overlaps between distinct shots.
  - Temporal Continuity: Zero unannotated visual discontinuity spikes ($> 4\times$ local rolling median MAD) in decoded MP4 adjacent-frame analysis; all intentional cuts/transitions explicitly whitelisted in ShotSpec.

- **Scoring Rubric**:
  - **1.0 (Critical Failure)**: Hardcoded legacy frame constants conflicting with audio; missing `semantic-timeline.json`; out-of-bounds impact frames in ShotSpec; unannotated frame tearing or dropped frames; negative frame durations.
  - **2.0 (Substandard)**: Multiple ShotSpec validation errors ($\ge 5$ errors); scene timing decoupled from audio duration (visuals end while audio continues or vice versa); arbitrary uniform stretching used to force fit.
  - **3.0 (Marginal — FAIL)**: `semantic-timeline.json` exists but 1–2 visual components bypass it with local hardcoded constants; 1 minor ShotSpec boundary discrepancy; unwhitelisted visual discontinuity spike at a scene cut.
  - **4.0 (Pass — Production Standard)**: 100% of scene sequences, visual beats, and cue timings derive from `semantic-timeline.json`; `validate-shot-spec.ts` passes with 0 errors; all transition windows declared and whitelisted; decoded MP4 temporal MAD analysis confirms zero unannotated spikes; duration matches master audio within $\pm 1$ frame.
  - **5.0 (Exemplary)**: Mathematical timeline perfection. Bidirectional temporal linkage: AST, ShotSpec, CueManifest, and Remotion sequences derive seamlessly from `semantic-timeline.json`; transitions exhibit $C_0$ positional and $C_1$ velocity continuity; zero timing slack or friction.

- **Disqualification Triggers**:
  - Any out-of-bounds impact frame or invalid boundary in `shot-spec.json`.
  - Any unannotated visual discontinuity spike $> 4\times$ rolling median MAD.
  - Total video duration mismatch with master audio $> 2\text{ frames}$.

---

### Category 6: Production Portability (Minimum Required: 4.0)

Evaluates workspace portability, relative path enforcement, audio ownership hygiene, and headless environment independence.

- **Objective Metric Standards**:
  - Machine-Specific Absolute Paths: **0** occurrences of `/home/`, `C:\`, or `/Users/` in committed manifests, specs, configurations, or source files.
  - Relative URI Standard: 100% workspace-relative URIs (e.g., `audio/sfx/stamp_reject.wav`).
  - Audio Ownership Strategy: `PREMIXED` single audio ownership. Master audio mounted exclusively in Remotion; zero secondary `<Audio>` tags for cues; zero double SFX mixing.
  - Production Audio Namespace Hygiene: **0** background music tracks in production audio directory (relocated to `legacy-assets/`).
  - Build & Render Independence: Clean build and render execution in headless, offline-guarded container environments.

- **Scoring Rubric**:
  - **1.0 (Critical Failure)**: Machine-specific absolute paths committed across multiple files; dual audio ownership causing 100% duplicate SFX playback; legacy background music files present in production audio tree; build fails outside originating user directory.
  - **2.0 (Substandard)**: Absolute paths in 1 manifest; secondary `<Audio>` tags present in TSX; environment-dependent scripts that break when repository is moved.
  - **3.0 (Marginal — FAIL)**: Paths are mostly relative, but 1 configuration file uses fragile relative traversal escaping workspace (`../../..`); legacy background music file resides in production audio directory (even if unmounted).
  - **4.0 (Pass — Production Standard)**: 100% workspace-relative URIs across all manifests (`audio-manifest.json`, `shot-spec.json`, `semantic-timeline.json`); `validators/validate-portability.ts` passes with 0 errors; `validate-audio-ownership.ts` confirms single PREMIXED mount; production audio folder is strictly hygienic (narration, master WAV, SFX, manifests only).
  - **5.0 (Exemplary)**: Pristine environment-agnostic architecture. Canonical path resolution utilities; deterministic asset dependency graph; zero environment leakage; seamless execution across Linux, macOS, and containerized CI runners.

- **Disqualification Triggers**:
  - Any machine-specific absolute path in committed JSON manifests or TSX files.
  - Any secondary `<Audio>` component mounted in Remotion alongside a premixed master audio track.
  - Any music or soundtrack file found in the production audio directory.

---

### Category 7: Source-to-Video Content Coverage (Minimum Required: 4.0)

Evaluates the educational completeness, pedagogical depth, and fidelity of the animation relative to the canonical source curriculum.

- **Objective Metric Standards**:
  - Source Concept Coverage: **100.0%** of source concepts, frameworks, and methodological steps mapped to $\ge 1$ visual beat in `source-content-map.json`.
  - Unauthorized Summarization: **0** omitted or glossed-over core academic concepts.
  - Explanatory Depth: Every concept explains *mechanism* and *application*, not merely terminology.
  - Bilingual Preservation: Core academic terms accompanied by canonical English terminology where appropriate.

- **Scoring Rubric**:
  - **1.0 (Critical Failure)**: Severe content omission ($> 30\%$ of source concepts missing); core framework butchered or reduced to 1 vague sentence; hallucinated or factually incorrect claims; source content map missing or empty.
  - **2.0 (Substandard)**: 15–30% of source content omitted; key steps in research methodology skipped; superficial coverage where complex ideas receive only a brief decorative visual without explanation.
  - **3.0 (Marginal — FAIL)**: Coverage map claims 100%, but 1–2 sub-concepts are merged or glossed over without dedicated visual representation; conceptual fidelity diluted by oversimplification.
  - **4.0 (Pass — Production Standard)**: `source-content-map.json` documents 100% coverage of all source concepts; every concept possesses a dedicated semantic beat with clear visual metaphor and spoken exposition; bilingual terms preserved; zero unauthorized omission.
  - **5.0 (Exemplary)**: Pedagogical triumph. Source material is completely covered and transformed into crystal-clear visual models; abstract academic theories (e.g. CARS territory establishment, niche identification, niche occupation) are illuminated through memorable progressive visual metaphors; viewer achieves comprehensive conceptual mastery.

- **Disqualification Triggers**:
  - Any concept marked in source curriculum missing from `source-content-map.json`.
  - Any visual beat that displays an academic term without explanatory visual or verbal support.

---

### Category 8: Validator Reliability (CRITICAL — Minimum Required: 4.3)

Evaluates the structural robustness, failure-first integrity, and adversarial resilience of all quality verification gates.

- **Objective Metric Standards**:
  - Automated Validator Pass Rate: **100%** (exit code 0 across all production validators).
  - Adversarial Bad Fixture Rejection Rate: **100%** (all R22 deliberate bad fixtures rejected).
  - Inspection Mechanism: AST visitors (TypeScript/Babel compiler API) and true binary/acoustic measurements. Zero filename-specific regex hacks.
  - Warning Discipline: Zero warnings-only bypasses; any violation results in non-zero exit code.

- **Scoring Rubric**:
  - **1.0 (Critical Failure)**: Validators disabled, bypassed, or failing on production assets; validator scripts crash with unhandled runtime errors; adversarial test suite passes bad fixtures; validators use naive regex instead of AST inspection.
  - **2.0 (Substandard)**: 1 or more validators fail on production assets; adversarial suite misses multiple bad fixtures ($< 80\%$ rejection rate); validators emit unhandled warnings.
  - **3.0 (Marginal — FAIL)**: Production validators pass, but adversarial suite misses 1 bad fixture (e.g. catches 11 of 12); or a validator relies on lenient heuristic tolerances instead of strict structural checking.
  - **4.0 (Pass — Production Standard)**: 100% of production validators pass with exit code 0; adversarial suite achieves 100% rejection rate across all R22 bad fixtures; AST visitors inspect code structurally; audio validators inspect real WAV headers and ffprobe streams; zero false-positive passes.
  - **5.0 (Exemplary)**: Multi-layered, deterministic verification harness. Comprehensive coverage across static AST, acoustic DSP, decoded video frame differences, and adversarial mutation testing; self-documenting JSON test reports (`qa-report.json`); 100% reproducible across isolated environments.

- **Disqualification Triggers**:
  - Any production validator exiting with code $\ne 0$.
  - Any adversarial bad fixture passing validation.
  - Any validator relying on filename regex to detect typography or audio ownership.

---

## 5. Independent Review & Scoring Workflow

To ensure adherence to the `NO_SELF_CERTIFICATION` invariant, scoring must strictly follow this protocol:

### Step 1: Automated Pre-Flight Gates
Execute the automated validation suite:
```bash
# Static & AST Validators
npx tsx validators/validate-mobile-typography.ts connection-film/src/scopus-explainer/
npx tsx validators/validate-portability.ts connection-film/src/scopus-explainer/
npx tsx validators/validate-audio-ownership.ts connection-film/src/scopus-explainer/
npx tsx validators/validate-shot-spec.ts connection-film/src/scopus-explainer/shot-spec.json
npx tsx validators/validate-audio-policy.ts connection-film/src/scopus-explainer/audio/audio-manifest.json

# Adversarial Test Suite
npm run test:adversarial
```
*If any automated validator fails, the review immediately halts with score 1.0 on Category 8.*

### Step 2: Temporal & Acoustic Inspection
Execute decoded video frame difference and audio dynamics analysis:
```bash
# Temporal Render QA (MAD analysis)
npx tsx validators/temporal-render-qa.ts out/final-v3_3.mp4 connection-film/src/scopus-explainer/shot-spec.json

# Audio Dynamics & Role-Aware Pause Inspection
ffprobe -v error -show_entries stream=sample_rate,channels,duration connection-film/public/audio/scopus_master_audio.wav
ffmpeg -hide_banner -nostats -i connection-film/public/audio/scopus_master_audio.wav -af "ebur128=framelog=verbose" -f null -
```

### Step 3: Visual & Mobile Preview Inspection
Inspect `preview-360x640.mp4` across explicit sampling intervals:
- Checkpoints: 0%, 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 100%.
- All ShotSpec boundary cuts and transition windows.
- Verify legibility on 360x640 viewport without zooming.
- Verify karaoke subtitles do not collide with focal visuals.

### Step 4: Generate Canonical `qa-report.json`
Compile the independent review evaluation into `qa-report.json`:

```json
{
  "version": "3.3",
  "timestamp": "2026-09-10T12:00:00Z",
  "composition": "connection-film/src/scopus-explainer/ScopusExplainerFilm.tsx",
  "certifiedBy": "independent_reviewer_agent",
  "scores": {
    "mobileReadability": 4.8,
    "informationDensity": 4.6,
    "audioVisualSync": 4.9,
    "narrationNaturalness": 4.7,
    "timingIntegrity": 4.9,
    "productionPortability": 4.8,
    "sourceContentCoverage": 4.9,
    "validatorReliability": 5.0
  },
  "overallAverage": 4.825,
  "thresholds": {
    "overallMin": 4.5,
    "floorMin": 4.0,
    "criticalMin": 4.3
  },
  "criticalResults": {
    "mobileReadability": { "score": 4.8, "passed": true },
    "audioVisualSync": { "score": 4.9, "passed": true },
    "narrationNaturalness": { "score": 4.7, "passed": true },
    "timingIntegrity": { "score": 4.9, "passed": true },
    "validatorReliability": { "score": 5.0, "passed": true }
  },
  "passed": true,
  "verdict": "CERTIFIED_PRODUCTION_GRADE"
}
```

### Formal JSON Schema Reference for `qa-report.json`

The generated `qa-report.json` must validate against the following standard JSON Schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "QAReportV3_3",
  "description": "Authoritative Quality Assurance and Evaluation Report for V3.3 Production Integrity Hardening",
  "type": "object",
  "required": [
    "version",
    "timestamp",
    "composition",
    "certifiedBy",
    "scores",
    "overallAverage",
    "thresholds",
    "criticalResults",
    "passed",
    "verdict"
  ],
  "properties": {
    "version": { "type": "string", "enum": ["3.3"] },
    "timestamp": { "type": "string", "format": "date-time" },
    "composition": { "type": "string" },
    "certifiedBy": { "type": "string" },
    "scores": {
      "type": "object",
      "required": [
        "mobileReadability",
        "informationDensity",
        "audioVisualSync",
        "narrationNaturalness",
        "timingIntegrity",
        "productionPortability",
        "sourceContentCoverage",
        "validatorReliability"
      ],
      "properties": {
        "mobileReadability": { "type": "number", "minimum": 1.0, "maximum": 5.0 },
        "informationDensity": { "type": "number", "minimum": 1.0, "maximum": 5.0 },
        "audioVisualSync": { "type": "number", "minimum": 1.0, "maximum": 5.0 },
        "narrationNaturalness": { "type": "number", "minimum": 1.0, "maximum": 5.0 },
        "timingIntegrity": { "type": "number", "minimum": 1.0, "maximum": 5.0 },
        "productionPortability": { "type": "number", "minimum": 1.0, "maximum": 5.0 },
        "sourceContentCoverage": { "type": "number", "minimum": 1.0, "maximum": 5.0 },
        "validatorReliability": { "type": "number", "minimum": 1.0, "maximum": 5.0 }
      }
    },
    "overallAverage": { "type": "number", "minimum": 1.0, "maximum": 5.0 },
    "thresholds": {
      "type": "object",
      "required": ["overallMin", "floorMin", "criticalMin"],
      "properties": {
        "overallMin": { "type": "number", "enum": [4.5] },
        "floorMin": { "type": "number", "enum": [4.0] },
        "criticalMin": { "type": "number", "enum": [4.3] }
      }
    },
    "criticalResults": {
      "type": "object",
      "required": [
        "mobileReadability",
        "audioVisualSync",
        "narrationNaturalness",
        "timingIntegrity",
        "validatorReliability"
      ],
      "properties": {
        "mobileReadability": { "$ref": "#/definitions/CriticalResult" },
        "audioVisualSync": { "$ref": "#/definitions/CriticalResult" },
        "narrationNaturalness": { "$ref": "#/definitions/CriticalResult" },
        "timingIntegrity": { "$ref": "#/definitions/CriticalResult" },
        "validatorReliability": { "$ref": "#/definitions/CriticalResult" }
      }
    },
    "passed": { "type": "boolean" },
    "verdict": { "type": "string", "enum": ["CERTIFIED_PRODUCTION_GRADE", "REJECTED"] }
  },
  "definitions": {
    "CriticalResult": {
      "type": "object",
      "required": ["score", "passed"],
      "properties": {
        "score": { "type": "number", "minimum": 1.0, "maximum": 5.0 },
        "passed": { "type": "boolean" }
      }
    }
  }
}
```
