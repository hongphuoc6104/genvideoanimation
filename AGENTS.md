# Agent Governance & System Invariants (V3.3 Production Standard)

## 1. Purpose & Scope
This document governs multi-agent collaboration, architectural boundaries, acceptance authority, and quality invariants for the 2D Educational Flat-Vector Remotion motion system. It establishes a strict **Two-Tier Agent Architecture** to enforce the failure-first acceptance standard and eliminate false-positive evaluations.

---

## 2. Two-Tier Agent Architecture

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
                                   ▼ [Delivers candidate artifacts & manifests]
┌─────────────────────────────────────────────────────────────────────────────┐
│                 TIER 2: INDEPENDENT VERIFICATION & QA GATES                 │
├──────────────────────────┬──────────────────────────────────────────────────┤
│ Static AST Validator     │ validate-mobile-typography, validate-portability │
│ Visual Semantics Gate    │ validate-visual-semantics (Anti-Card Monoculture)│
│ Mechanism Invariants Gate│ tests/invariants/mechanism-invariants.test.ts    │
│ Timeline Adaptation Gate │ tests/invariants/timeline-narration-adaptation   │
│ Acoustic Gate            │ validate-audio-policy, validate-audio-mix        │
│ Temporal QA Gate         │ temporal-render-qa, validate-preview-parity      │
│ Storyboard & Rubric Gate │ extract-contact-sheet, validate-preview-rubric   │
│ Adversarial Challenger   │ run-adversarial-suite (100% defect rejection)    │
│ Forensic Auditor         │ Impartial 18-category quality rubric audit       │
└──────────────────────────┴──────────────────────────────────────────────────┘
```

### Tier 1: Creative & Implementation Agents
Tier 1 agents own the generation and authoring of candidate artifacts. They are strictly prohibited from evaluating, grading, or issuing QA acceptance tokens for their own deliverables.

- **Director**: Oversees narrative coherence, visual metaphor continuity, scene transitions, and pedagogical clarity across the film. Enforces that every beat communicates meaning through visual transformation, not static text cards. Requires an initial **Animatic 360p draft review stage** with scratch voice/cues before master TTS generation.
- **Content Architect**: Deconstructs raw curriculum documents into structured pedagogical units via **Curriculum Modular Mapping** (`source-content-map.json`: `IN_SCOPE_PRIMARY`, `PREREQUISITE`, `DEFERRED_TO_SERIES`). Co-authors narration scripts alongside visual storyboard contracts, compiling `semantic-timeline.json` and authoring authoritative `factual-claims.json` ledgers linking claims to cited evidence and boundary conditions.
- **Audio DSP Agent**: Synthesizes spoken narration using local VieNeu-TTS (`GENVIDEO_ADAM_PROFILE`, voice `"Adam"`) with Smart Punctuation preservation, inserts physical PCM silence pauses (200-400ms) directly into master audio, aligns phonemes without injecting dummy characters into acoustic targets, and produces the `PREMIXED` master stereo WAV file (`scopus_master_audio.wav`).
- **Art & Rig Agent**: Authors scalable flat-vector SVG components, character rigs, academic design tokens, and ensures 1080x1920 mobile viewport compliance with active kinetic rigging (no decorative passive characters).
- **Motion & Shot Agent**: Authors Remotion TSX compositions, applies `motion-kit` spring/tween physics, dynamically derives phases and intra-beat choreography from `shotBeats` via `useBeatChoreography`, declares shot bounds and transitions in `shot-spec.json`, and mounts master audio via a single root `<Audio>` tag.

### Tier 2: Independent Verification & QA Gates
Tier 2 agents own automated and independent verification. They possess sole authority to evaluate deliverables against acceptance criteria and sign `qa-report.json`.

- **Static AST Validator**: Traverses production TypeScript ASTs across all compositions to verify effective typography scaling (Font * scale >= 30px mobile floor), checks workspace path portability (zero absolute paths), and enforces single `<Audio>` tag ownership.
- **Visual Semantics & Anti-Card Gate**: Traverses TSX scene ASTs (`validate-visual-semantics.ts`) across all projects to reject text-card / slide monoculture, demanding animated relational mechanisms (nodes/edges, SVG geometric funnels, state machines).
- **Explanatory Mechanism Invariants Gate**: Tests mathematical, geometric, and topological visual truth invariants (`tests/invariants/mechanism-invariants.test.ts`): CRISPR DNA double-strand severance, NHEJ zero-void arm closure (`gapWidth === 0`), Steam PV diagram tracer boundary tracking (error <= 2px), and Watt Linkage rigid-bar length invariance ($\Delta L = 0.000\text{px}$).
- **Dynamic Timeline & Narration Adaptation Gate**: Tests that changes to narration duration or beat timings adapt dynamically without requiring manual edits to scene component TSX code (`tests/invariants/timeline-narration-adaptation.test.ts`).
- **Acoustic Gate**: Inspects physical WAV binary headers (`parseWavHeader`), verifies sample rate (48kHz), channels (2), bit depth (16), evaluates EBU R128 loudness (-15.0 ± 1.0 LUFS, peak <= -1.8 dBTP), and verifies pause compliance.
- **Temporal QA & Parity Gate**: Decodes rendered MP4 video frames to compute frame-to-frame pixel differences (MAD), flags unmotivated visual spikes, and confirms that preview MP4 maintains PSNR parity (>= 35 dB) with master MP4.
- **Storyboard Contact Sheet & Rubric Reviewer**: Traces 3 keyframes (Start, Mid, End) per beat (`extract-contact-sheet.ts`) and executes automated visual rubric inspection on real decoded RGB24 frames from preview MP4s via FFmpeg pipe (zero synthetic `Buffer.alloc` fallbacks).
- **Generalization & Adversarial Challenger**: Executes the suite of 12+ deliberate negative fixtures and validates 100% compliance across 3 real production explainer videos (`validate-generalization.ts`).
- **Forensic Auditor**: Conducts the authoritative 18-category quality rubric audit, verifies that Tier 1 agents have not tampered with gate thresholds, records the verification status (distinguishing technical automated checks from Explanatory Review with `"chưa xác minh"` where unverified), and issues the signed `qa-report.json`.

---

## 3. Non-Negotiable Anti-Self-Certification Rules (NO_SELF_CERTIFICATION)

1. **Absolute Separation of Implementation and Evaluation (NO_SELF_CERTIFICATION)**:
   Under no circumstances may an agent that authored, modified, or generated any part of a candidate composition, audio file, or manifest certify that work. All quality scores and gate passes must be executed by an independent Tier 2 verification agent.
2. **Automated Fail-Closed Verification Over Verbal Claims**:
   Verbal or text claims of completion (e.g. "I tested this and it works") have zero standing in production acceptance. Acceptance requires execution of the canonical gate command (`npm run v3.3:gate`) terminating with exit code 0.
3. **Tamper-Evident Acceptance Reports (`qa-report.json`)**:
   `qa-report.json` must be signed exclusively by the Forensic Auditor / Independent Reviewer agent, recording the verification timestamp, candidate artifact SHA-256 hashes, and individual scores across all 18 rubric categories. Any explanatory item not reviewed by an independent human SME must be recorded as `"chưa xác minh"`.
4. **Zero Override Authority**:
   No agent—regardless of role or hierarchy—possesses the authority to waive gate failures, convert errors to warnings, or lower numeric rubric thresholds (Overall >= 4.50, Floor >= 4.00, Critical >= 4.30).

---

## 4. Runtime Package Isolation Invariants

1. **Clean Directory Separation**:
   The `.agents/` directory is strictly reserved for agent metadata, persistent briefings, progress tracking, and skill reference documentation.
2. **Zero Runtime Imports from `.agents/`**:
   No code in production packages (`packages/motion-kit`, `packages/narration-kit`, `packages/caption-kit`), production compositions (`connection-film/`), validators (`validators/`), or build scripts (`scripts/`) may import from `.agents/`, `.agents/skills/`, or any subdirectory thereof.
3. **Automated Enforcement**:
   - `validators/motion-lint.ts` enforces the `no-runtime-skill-imports` AST rule, failing the build if any `.agents` import is detected.
   - `tests/tier2-boundaries/f02-isolation-boundaries.test.ts` validates that relative traversals, dynamic `import()`, and asset `require()` calls pointing to `.agents` are rejected.

---

## 5. Canonical Acceptance Command
The entire production pipeline must pass the single canonical entrypoint without errors:
```bash
npm run v3.3:gate
```
Any single gate failure halts execution immediately with exit code 1.

---

## 6. GPU Hardware Acceleration & Render Invariants (GPU_ACCELERATION_STANDARD)

1. **Mandatory Hardware Encoding (`h264_nvenc`)**:
   All production MP4 renders (1080x1920 9:16 and preview 360x640) must utilize NVIDIA hardware-accelerated video encoding (`h264_nvenc`).
   - Configured centrally in `remotion.config.ts` via `Config.setHardwareAcceleration('required')`.
   - Remotion's pre-stitcher FFmpeg invocation automatically injects `-c:v h264_nvenc -cq 18` (replacing CPU `libx264 -crf 18`).
   - If NVIDIA NVENC is unavailable, the pipeline must fail closed rather than silently falling back to unaccelerated CPU encoding unless an explicit override flag is passed.
2. **OpenGL Hardware Rasterization (`angle` / `egl`)**:
   - Headless Chrome rasterization must declare `Config.setChromiumOpenGlRenderer('angle')` and `Config.setChromiumMultiProcessOnLinux(true)`.
3. **Execution Commands**:
   - Production renders must use the dedicated GPU scripts:
     - CRISPR: `npm run render:gpu:crispr`
     - Steam Engine: `npm run render:gpu:steam`
     - Git DAG: `npm run render:gpu:git`
     - Scopus Explainer: `npm run render:gpu:scopus`
     - All 4 films: `npm run render:gpu:all`

