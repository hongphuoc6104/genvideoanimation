---
name: educational-flat-motion
description: "Production V3.3 specification for creating 1080x1920 (9:16) mobile-first educational flat vector motion videos in Remotion with Vietnamese-first narration, content-driven duration, and failure-first acceptance gates."
---

# Educational Flat Motion Video Production Skill (V3.3 Production Standard)

## 1. Purpose & Philosophy
Use this skill to create repeatable, broadcast-quality, 2D educational explainer videos in Remotion using a polished, flat-vector, cinematic motion-graphics language optimized for **vertical mobile screens (9:16)**.

This is a **production-system skill**, not a prompt for a single video. It governs the full end-to-end pipeline: from pedagogical source analysis to audio DSP synthesis, semantic timeline compilation, programmatic Remotion choreography, dual-resolution rendering, and failure-first automated verification.

### Core Pedagogical & Visual Principles:
- **Mobile-First Cognitive Clarity**: Explain complex academic and scientific concepts (e.g. Scopus indexing, research methodology, technical taxonomies) on vertical viewports without cognitive overload.
- **Visual Metaphors Over Text Walls**: Convey abstract systems through dynamic geometry, spatial relationships, and motivated transformations rather than text-heavy slides.
- **Audio-Driven Choreography**: Narration cadence and natural speech timing dictate visual motion. Visuals adapt to speech, never the reverse.
- **Failure-First Integrity**: Production acceptance is verified through automated AST, acoustic, and temporal diff validators. Zero false-positive passes.

---

## 2. Trigger & Scope
Use this skill when:
- Creating, retiming, or batch-generating 2D educational or academic explainer videos with Remotion.
- Developing 1080x1920 (9:16) portrait content for mobile educational platforms, TikTok, YouTube Shorts, or Reels.
- Producing Vietnamese-first scientific or instructional explainers with bilingual terminology.
- Hardening existing Remotion compositions against the V3.3 Production Integrity standards.

---

## 3. The 8 Non-Negotiable Hard Rules (V3.3 Governance)

Every production created or modified under this skill MUST strictly obey the following 8 Hard Rules. Violating any rule constitutes an immediate build/QA rejection.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      THE 8 NON-NEGOTIABLE HARD RULES                        │
├───────────────────────────────┬─────────────────────────────────────────────┤
│ 1. NEVER_SHRINK_TO_FIT        │ Split into beats; enforce font minimums     │
│ 2. ONE_PRIMARY_IDEA_PER_BEAT  │ Zero multi-card info dumps during 1 idea    │
│ 3. PROGRESSIVE_DISCLOSURE     │ Sequential beats for taxonomies/steps       │
│ 4. MOBILE_FIRST_READABILITY   │ 360x640 preview legibility without zoom     │
│ 5. ONE_AUTHORITATIVE_TIMELINE │ semantic-timeline.json is single source     │
│ 6. ONE_AUDIO_OWNER_PER_ASSET  │ PREMIXED master audio only; 0 cue <Audio>   │
│ 7. FINAL_RENDER_IS_AUTHORITATIVE │ Inspect MP4 frames, diffs & WAV headers   │
│ 8. NO_SELF_CERTIFICATION      │ Independent QA gates; no self-grading       │
└───────────────────────────────┴─────────────────────────────────────────────┘
```

### Rule 1: `NEVER_SHRINK_TO_FIT`
- For 1080x1920 production, all informational typography must strictly satisfy the following minimum font sizes:
  | Text Role | Minimum Font Size | Usage Context |
  |---|---|---|
  | **Hero Text** | **>= 64px** | Main title, core takeaway, dramatic callouts |
  | **Section Title** | **>= 48px** | Scene headers, category anchors |
  | **Card Title** | **>= 38px** | Header of an active concept card or focal box |
  | **Body Text** | **>= 34px** | Informational descriptions, explanations |
  | **Secondary Text** | **>= 30px** | Labels, sub-bullets, secondary metrics |
  | **Karaoke Captions** | **>= 52px** | Real-time spoken narration subtitles |
  | *Metadata / Citation* | *>= 22px* | Nonessential legal, DOI, or author credits only |
- **Anti-Shrink Mandate**: When content cannot fit comfortably within the 1080x1920 viewport at these sizes, you **MUST split the concept into sequential visual beats or scenes**.
- **Strict Prohibitions**:
  - NEVER reduce font sizes below thresholds to squeeze multiple items onto one screen.
  - NEVER truncate, omit, or summarize source facts/arguments to avoid splitting.
  - NEVER hide overflow text with clipping masks or unreadable line clamping.
- **Enforcement**: Build terminates if `validators/validate-mobile-typography.ts` detects any production TSX component specifying font sizes below these thresholds.

### Rule 2: `ONE_PRIMARY_IDEA_PER_BEAT`
- Vertical mobile displays have strictly limited cognitive bandwidth. Each visual beat must focus on **exactly one dominant focal idea**.
- **Strict Prohibition**: Prohibit displaying dense multi-card grids (e.g. 3, 4, or 5 cards/boxes simultaneously) while narration is only addressing a single item.
- At any given second, the active narration token must directly correspond to the single focal visual subject on screen. Secondary context must be dimmed, collapsed, or off-screen.

### Rule 3: `PROGRESSIVE_DISCLOSURE`
- When presenting multi-item frameworks, taxonomies, comparison matrices, or multi-step procedures:
  1. **Beat 1 (Overview)**: Briefly establish the taxonomy frame or category container (1.0–2.0s).
  2. **Beats 2..N (Individual Focus)**: Walk through each item one by one. The active item expands to full-screen prominence with its hero visual and detailed body text (>= 34px). Previous items exit or collapse to small indicator dots/icons.
  3. **Beat N+1 (Synthesis/Recap)**: Display the synthesized summary or comparison matrix once all individual items have been taught.
- Viewers must never be forced to parse un-narrated elements ahead of time.

### Rule 4: `MOBILE_FIRST_READABILITY`
- **Dual-Render Requirement**: Every production render must generate both `1080x1920` (master MP4) and `360x640` (mobile preview MP4).
- **Legibility Standard**: All primary illustrations, iconography, and informational typography must be effortlessly readable on a physical 360x640 mobile preview without zooming or squinting.
- **Safe Margins for 1080x1920 Canvas**:
  - Horizontal Safe Margin: `80px` left and right (content width: 920px).
  - Vertical Safe Margin: `140px` top and bottom (avoids platform UI overlays: handles, search bars, captions, and engagement buttons).
- **Contrast & Collisions**:
  - Text-to-background contrast ratio must meet WCAG AA (`>= 4.5:1`).
  - Karaoke captions (>= 52px) must sit in a dedicated bottom banner region (140px to 320px from canvas bottom) with zero collision against primary visual subjects.

### Rule 5: `ONE_AUTHORITATIVE_TIMELINE`
- The entire production must derive from a single canonical artifact: `semantic-timeline.json`.
- Schema per beat:
  ```json
  {
    "id": "beat_01_problem",
    "narrationTokenRange": [0, 18],
    "startSec": 0.00,
    "endSec": 4.82,
    "startFrame": 0,
    "endFrame": 145,
    "visualIntent": "Display rejecting stamp on unindexed manuscript",
    "primaryObject": "manuscript_card",
    "cameraIntent": "subtle_push_in",
    "transitionIntent": "match_cut_to_node_graph",
    "sfxIntent": "stamp_reject",
    "captionIntent": "full_line_karaoke"
  }
  ```
- **Zero Magic Numbers**: All downstream manifests (`shot-spec.json`, Remotion `<Sequence>` boundaries, scene internal phase timings, `CueManifest`, SFX triggers, caption word highlight timings) must derive deterministically from `semantic-timeline.json`. Hardcoded frame constants in TSX (e.g. `if (frame > 120)`) are strictly forbidden.

### Rule 6: `ONE_AUDIO_OWNER_PER_ASSET`
- Enforce the `PREMIXED` single-ownership audio architecture:
  - The master audio file (`*_master_audio.wav`) contains the complete spoken voiceover plus all mixed sound effects (SFX), premixed with sample-accurate alignment by the audio DSP pipeline.
  - The root Remotion composition (`*Film.tsx`) mounts master audio **exclusively** via a single `<Audio src={staticFile('audio/...master_audio.wav')} />` element.
  - Remotion must contain **ZERO secondary `<Audio>` tags** for SFX cues or discrete sound events.
  - Remotion must contain **ZERO background music tags** in production (`audioPolicy = "narration-sfx"`). Legacy music tracks must be purged from `public/audio/`.
- **Enforcement**: Build terminates if `validators/validate-audio-ownership.ts` detects `<Audio>` count != 1.

### Rule 7: `FINAL_RENDER_IS_AUTHORITATIVE`
- Production completion cannot be verified through TypeScript compilation, IDE preview canvas, or mock unit tests alone.
- Verification must directly inspect:
  1. Real decoded MP4 video frames (`final-v3_3.mp4` and `preview-360x640.mp4`).
  2. Adjacent-frame pixel diffs via `validators/temporal-render-qa.ts` to detect unintended discontinuity spikes.
  3. Physical WAV audio headers (`parseWavHeader`) and loudness metrics (`ffprobe`, `ebur128`).
- Adjacent-frame visual cuts are strictly rejected unless explicitly declared in the `shot-spec.json` transition whitelist.

### Rule 8: `NO_SELF_CERTIFICATION`
- Implementation agents (Director, Shot Agent, Audio Agent, Motion Agent) are **strictly prohibited** from scoring or self-certifying their own work.
- Quality Rubric evaluations and milestone gate passes must be executed by **independent evaluation agents** (Reviewers, Challengers, Forensic Auditors).
- Final acceptance requires:
  - Overall Rubric Average: `>= 4.5 / 5.0`
  - Floor Minimum: No single category `< 4.0`
  - Critical Categories (Mobile Readability, Audio/Visual Sync, Narration Naturalness, Timing Integrity, Validator Reliability): individually `>= 4.3`

---

## 4. Technical Production Defaults (V3.3)

| Parameter | Standard Production Value | Notes & Constraints |
|---|---|---|
| **Aspect Ratio** | `9:16` (Vertical Portrait) | Mobile-first video standard |
| **Production Resolution** | `1080 x 1920 px` | Master delivery MP4 |
| **QA Preview Resolution** | `360 x 640 px` | Mobile legibility inspection MP4 |
| **Frame Rate** | `30 fps` | Deterministic frame-based rendering |
| **Primary Language** | `vi-VN` (Vietnamese-first) | Native diacritics + bilingual English token preservation |
| **Default TTS Engine** | `VieNeu-TTS` (`GENVIDEO_ADAM_PROFILE`) | Voice: `"Adam"`, ONNX CPU fp32, v3 Turbo. Kokoro is explicit fallback only |
| **Duration Policy** | `content-driven` | Derived strictly from spoken audio + role-aware pauses; no fixed `targetDuration` |
| **Audio Policy** | `narration-sfx` | Voiceover + SFX only; zero production background music |
| **Target Loudness** | `-15.0 LUFS` (±1.0 LUFS) | Broadcast compliance |
| **True Peak Ceiling** | `<= -1.8 dBTP` | Inter-sample clipping prevention |
| **Path Portability** | Workspace-relative URIs | Zero machine-specific absolute paths (`/home/`, `C:\`, `/Users/`) |
| **Composition Stack** | React 18 + Remotion + TypeScript | Scalable SVG vector art, modular motion kit |

---

## 5. Agent Roles & Governance Separation

To guarantee `NO_SELF_CERTIFICATION` and maintain production velocity, agents are partitioned into two strict tiers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 TIER 1: CREATIVE & IMPLEMENTATION AGENTS                    │
├──────────────────────────┬──────────────────────────────────────────────────┤
│ Director                 │ Overall creative narrative, metaphor continuity  │
│ Content Architect        │ Source mapping (100% coverage), semantic timeline│
│ Audio DSP Agent          │ VieNeu synthesis, role pauses, premixed master   │
│ Art & Rig Agent          │ SVG assets, mobile-scale rigs, design tokens     │
│ Motion & Shot Agent      │ Remotion TSX implementation, motion kit curves   │
└──────────────────────────┴──────────────────────────────────────────────────┘
                                   │
                                   ▼ [Delivers candidate artifacts]
┌─────────────────────────────────────────────────────────────────────────────┐
│                 TIER 2: INDEPENDENT VERIFICATION GATES                      │
├──────────────────────────┬──────────────────────────────────────────────────┤
│ Static AST Validator     │ validate-mobile-typography, validate-portability │
│ Acoustic Gate            │ validate-audio-policy, validate-audio-mix        │
│ Temporal QA Gate         │ temporal-render-qa (MP4 frame diff analysis)     │
│ Independent Reviewer     │ Visual inspection of 360x640 preview frames      │
│ Adversarial Challenger   │ R22 bad fixture rejection test suite             │
│ Forensic Auditor         │ Impartial quality rubric scoring (min >= 4.5)    │
└──────────────────────────┴──────────────────────────────────────────────────┘
```

---

## 6. End-to-End Production Lifecycle (12-Phase Pipeline)

```
[Source Content] ──► Phase 1: 100% Concept Mapping (source-content-map.json)
                          │
                          ▼
                     Phase 2: Vietnamese Narration & Role-Aware Pause Script
                          │
                          ▼
                     Phase 3: TTS Synthesis (VieNeu Adam) & Audio Alignment
                          │
                          ▼
                     Phase 4: Single Authoritative Timeline (semantic-timeline.json)
                          │
                          ▼
                     Phase 5: PREMIXED Master Audio DSP & Measured WAV Manifest
                          │
                          ▼
                     Phase 6: ShotSpec & Motivated Transition Whitelist
                          │
                          ▼
                     Phase 7: Mobile-First SVG Art & Typography Layout
                          │
                          ▼
                     Phase 8: Progressive Disclosure Choreography (Remotion TSX)
                          │
                          ▼
                     Phase 9: Automated Static & AST Validators Gate
                          │
                          ▼
                     Phase 10: Dual-Resolution Video Rendering (1080p + 360p)
                          │
                          ▼
                     Phase 11: Decoded MP4 Temporal Frame Diff QA
                          │
                          ▼
                     Phase 12: Independent Quality Rubric Audit (>= 4.5 / 5.0)
```

### Phase 1 — Source Content Mapping (`source-content-map.json`)
1. Analyze raw source material (academic paper, syllabus, or technical brief).
2. Extract all core concepts, definitions, taxonomies, and pedagogical arguments.
3. Map every single concept to at least one semantic beat in `source-content-map.json`.
4. **Invariant**: Coverage must equal **100%**. Unauthorized omission or over-summarization of difficult concepts is strictly forbidden.

### Phase 2 — Vietnamese Narration & Role-Aware Pauses
1. Write the narration script in natural, idiomatic academic Vietnamese (`vi-VN`).
2. Transcribe foreign/technical tokens into phonetic Vietnamese where necessary while keeping visible on-screen terms in professional bilingual format (e.g. Scopus, Research Gap).
3. Apply the **Role-Aware Natural Pause Policy**:
   | Pause Role | Duration Range | Narrative Function | Example |
   |---|---|---|---|
   | **Within clause** | 0.08s – 0.20s | Micro-breath at commas, colons, dashes | Between "Đã biết gì," and "chưa biết gì" |
   | **Normal sentence**| 0.18s – 0.40s | Cadence between standard consecutive thoughts | Between two sentences in the same beat |
   | **Semantic turn** | 0.25s – 0.55s | Pivot in reasoning, contrast, objection | Before "Tuyệt đối tránh..." |
   | **Major section** | 0.40s – 0.80s | Boundary between major scenes/acts | Between Problem Scene and Taxonomy Scene |
   | **Payoff / Epiphany**| 0.30s – 0.65s| Emphasizing key takeaway or resolution | After "lấp đầy trọn vẹn khoảng trống" |
4. **Dead-Air Threshold**: Unmotivated silence exceeding `0.85s` is flagged as an error. Intentional pauses matching declared transition boundaries are whitelisted.

### Phase 3 — VieNeu-TTS Voice Synthesis & Alignment
1. Synthesize narration takes using `VieNeu-TTS` (`GENVIDEO_ADAM_PROFILE`, voice `"Adam"`).
2. Forbid default routing to Kokoro (`am_adam`); Kokoro is reserved for explicit fallback only.
3. Run forced alignment to generate word-level timestamp tokens (`token-reconciliation.json`).

### Phase 4 — Semantic Timeline Compilation (`semantic-timeline.json`)
1. Compile the master timeline from narration tokens and role-aware pauses.
2. Calculate exact `startSec`, `endSec`, `startFrame`, and `endFrame` (at 30 fps) for every beat.
3. Assign `visualIntent`, `primaryObject`, `cameraIntent`, `transitionIntent`, and `sfxIntent`.
4. Ensure strictly monotonic frame progression with zero overlaps or gaps.

### Phase 5 — PREMIXED Master Audio DSP & Measured Manifest
1. Mix voiceover audio and SFX cues into a single stereo master file: `scopus_master_audio.wav`.
2. Apply broadcast processing: target integrated loudness `-15.0 LUFS`, true peak ceiling `-1.8 dBTP`.
3. Inspect real WAV file headers using `parseWavHeader` and ffprobe.
4. Generate `audio-manifest.json` with measured sample rate (48000 Hz), channels (2), bit depth (16), duration, LUFS, and relative file paths. Absolute paths are forbidden.

### Phase 6 — ShotSpec & Transition Whitelist (`shot-spec.json`)
1. Derive all shots and impact frames directly from `semantic-timeline.json`.
2. For every scene boundary, declare explicit transition parameters:
   - `transition_frames`: Frame window of the transition (e.g. `[615, 625]`).
   - `transition_type`: Motivated transition type (`object_match`, `camera_carry`, `shape_morph`, `foreground_wipe`, `motivated_iris`).
   - `expected_visual_discontinuity`: Set to `true` to whitelist adjacent-frame diff spikes in temporal QA.
3. Validate using `validators/validate-shot-spec.ts`. Out-of-bounds impact frames immediately fail.

### Phase 7 — Mobile-First Typography & Visual Design
1. Apply the 6 typography minimums (Hero >= 64px, Section >= 48px, Card >= 38px, Body >= 34px, Secondary >= 30px, Caption >= 52px).
2. Layout all elements within the 1080x1920 mobile safe zone (80px horizontal padding, 140px vertical padding).
3. Ensure color contrast satisfies WCAG AA (>= 4.5:1).
4. Verify karaoke captions occupy the bottom safe zone without overlapping visual props.

### Phase 8 — Progressive Disclosure Choreography (Remotion TSX)
1. Implement scene components using Remotion's frame-based animation (`useCurrentFrame()`).
2. Pass timing props directly from `semantic-timeline.json`.
3. Structure taxonomies into progressive beats: overview -> focus 1 -> focus 2 -> recap.
4. Mount the master audio file via a **single `<Audio>` element** at root. Zero cue `<Audio>` tags.

### Phase 9 — Automated Static & AST Validators Gate
Execute the automated test suite. Every validator must exit with code 0:
- `npx tsx validators/validate-mobile-typography.ts`
- `npx tsx validators/validate-shot-spec.ts`
- `npx tsx validators/validate-audio-ownership.ts`
- `npx tsx validators/validate-audio-policy.ts`
- `npx tsx validators/validate-audio-mix.ts`
- `npx tsx validators/validate-portability.ts`

### Phase 10 — Dual-Resolution Video Rendering
Render both production and preview artifacts:
1. `npx remotion render Root <output_dir>/final-v3_3.mp4 --props=...` (1080x1920, 30fps)
2. `npx remotion render Root <output_dir>/preview-360x640.mp4 --props=... --scale=0.3333` (360x640, 30fps)

### Phase 11 — Decoded MP4 Temporal Frame Diff QA
1. Run `validators/temporal-render-qa.ts` against `final-v3_3.mp4`.
2. Compute mean pixel diff between every adjacent frame pair.
3. Correlate discontinuity spikes with `shot-spec.json`:
   - Spikes occurring within whitelisted `transition_frames` are allowed.
   - Any unwhitelisted spike or naked hard cut fails the build.

### Phase 12 — Independent Quality Rubric Audit
1. Independent QA agents inspect `preview-360x640.mp4` across frames: 0%, 10%, 20%, ... 100%, and all shot boundary transitions.
2. Score all 8 categories of `references/quality-rubric.md` (1–5 scale).
3. Ensure overall score `>= 4.5`, floor `>= 4.0`, critical categories `>= 4.3`.
4. Output signed `qa-report.json`.

---

## 7. Motivated Transitions Grammar

Naked cuts between major narrative scenes are strictly prohibited. Use motivated transitions from `kit/motivated-transitions.ts`:

| Transition Type | Visual Mechanism | Typical Narrative Motivation |
|---|---|---|
| **Object Match Cut** | A focal object in Scene A transforms geometry into a focal object in Scene B | Manuscript icon morphs into research database node |
| **Camera Carry** | Rapid camera pan or push carries momentum across the cut | Moving from individual researcher into global network |
| **Shape Morph** | Primary vector silhouette smoothly expands or morphs into the next background | Warning badge expands to form taxonomy background card |
| **Foreground Wipe** | A foreground object sweeps across screen, revealing the next scene behind it | A scanning bar sweeps across mobile viewport |
| **Motivated Iris** | Circular or geometric iris expands from the exact point of viewer attention | Focusing in on an accepted paper stamp |

---

## 8. Automated Validator Reference Suite

| Validator Script | Inspection Target | Strict Failure Conditions |
|---|---|---|
| `validate-mobile-typography.ts` | AST scan of all production TSX components | Font size < 64px (hero), < 48px (section), < 38px (card title), < 34px (body), < 30px (secondary), < 52px (caption) |
| `validate-shot-spec.ts` | `shot-spec.json` bounds and impact frames | Any impact frame outside `[start_frame, end_frame]`, non-monotonic frames, missing required fields |
| `validate-audio-ownership.ts` | AST scan of Remotion composition TSX | More than 1 `<Audio>` element; any secondary `<Audio>` tag mounting SFX/cues when master audio is present |
| `validate-audio-policy.ts` | Audio manifest, pause distribution, loudness | Music files present in production; unmotivated pauses > 0.85s; pause violating role envelope; LUFS > -14.0 or < -16.5; True Peak > -1.8 dBTP |
| `validate-audio-mix.ts` | Real WAV binary headers vs `audio-manifest.json` | Header sampleRate != 48000; channels != 2; bitDepth != 16; duration discrepancy > 0.05s |
| `validate-portability.ts` | All JSON manifests, TSX, configs | Presence of absolute machine paths (`/home/`, `C:\`, `/Users/`) |
| `temporal-render-qa.ts` | Decoded MP4 frame buffer differences | Unwhitelisted adjacent frame diff spike; naked cut at scene boundaries without declared transition |
| `offline-network-guard.ts` | Build environment and dependencies | Any external network request during render/synthesis |

---

## 9. Quality Rubric Summary (V3.3 Standards)

Full evaluation criteria are defined in `references/quality-rubric.md`.

| Category | Critical? | Minimum | Key Evaluation Points |
|---|---|---|---|
| **1. Mobile Readability** | **YES** | **4.3** | 360x640 preview legibility, typography minimums met, zero text clipping or overlap, WCAG AA contrast |
| **2. Information Density** | NO | 4.0 | Adherence to ONE_PRIMARY_IDEA_PER_BEAT, progressive disclosure of taxonomies, zero card dumps |
| **3. Audio/Visual Sync** | **YES** | **4.3** | Visual hit frames align with narration tokens within ±2 frames, SFX hits align with visual action |
| **4. Narration Naturalness** | **YES** | **4.3** | Role-aware pause ranges applied, VieNeu `Adam` voice, natural breathing cadence, zero rushed speech |
| **5. Timing Integrity** | **YES** | **4.3** | All timings derived from `semantic-timeline.json`, zero ShotSpec out-of-bounds, monotonic progression |
| **6. Production Portability** | NO | 4.0 | Zero machine-specific absolute paths, workspace-relative URIs across all manifests and code |
| **7. Source Content Coverage** | NO | 4.0 | `source-content-map.json` maps 100% of source academic concepts to beats without omission |
| **8. Validator Reliability** | **YES** | **4.3** | All automated validators pass with exit code 0; adversarial suite rejects 100% of bad fixtures |

**Acceptance Thresholds**:
- Overall Average: `>= 4.5 / 5.0`
- Floor Minimum: `>= 4.0` on all categories
- Critical Minimum: `>= 4.3` on Categories 1, 3, 4, 5, 8

---

## 10. Anti-Pattern Catalog (V3.3 Additions)

Reject or revise if any of the following anti-patterns are detected:

### Critical Anti-Patterns (Immediate Build Blocker)
- **Shrink-To-Fit Fallacy**: Shrinking font size below minimums (e.g. 18px body text) or summarizing text to avoid creating a new visual beat.
- **Simultaneous Card Dump**: Showing multiple information cards simultaneously while voiceover only explains one item.
- **Dual Audio Ownership**: Mounting both `master_audio.wav` and individual `<Audio>` cue tags in Remotion.
- **Naked Scene Cut**: Hard cut between major scene sequences without an explicit transition declared in `shot-spec.json`.
- **Absolute Path Leakage**: Committing machine-specific paths like `/home/<username>/...` or `C:\Users\...` into production manifests.
- **Default Kokoro Routing**: Falling back to Kokoro `am_adam` instead of configuring VieNeu `Adam`.
- **Self-Graded Acceptance**: Implementation agents certifying their own quality scores.

### Major Anti-Patterns
- **Crushed Pauses**: Uniformly compressing all pauses to < 0.20s, eliminating natural breathing and section transitions.
- **Hardcoded Frame Logic**: Writing `if (frame > 120)` in TSX components instead of receiving timeline props.
- **Aimless Global Zoom**: Adding continuous slow zoom solely to prevent frames from looking static.
- **Monolithic SVG Character**: Translating an unarticulated character group without anticipation or settle.

---

## 11. Mandatory Production Deliverables

Every production milestone is incomplete until all 7 artifacts are generated, validated, and archived:

1. `final-v3_3.mp4`: Master 1080x1920 (9:16) broadcast video.
2. `preview-360x640.mp4`: Mobile legibility QA preview video.
3. `semantic-timeline.json`: Authoritative frame-level timeline for all beats, cues, and transitions.
4. `source-content-map.json`: Complete 100% mapping of source concepts to timeline beats.
5. `shot-spec.json`: Machine-validated shot specifications with transition whitelist.
6. `audio-manifest.json`: Measured audio metadata (sample rate, channels, bit depth, LUFS, True Peak) with relative URIs.
7. `qa-report.json`: Independent evaluation report containing scores for all 8 rubric categories and automated validator results.
