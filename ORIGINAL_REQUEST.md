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
