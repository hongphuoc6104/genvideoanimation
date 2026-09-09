# Project: V2 Motion Animation System Upgrade

## Architecture
The V2 Motion Animation System is a modular, production-grade 2D vector animation and rendering framework built upon Remotion, React 19, TypeScript, and FFmpeg.

### Module Boundaries & Data Flow
1. **`motion-kit/` (Canonical Standalone Workspace Package)**
   - **`rigs/`**: `RigInterface`, `CharacterController`, `BirdRig`, `HumanRig`, `ArbitraryCustomRigAdapter`.
   - **`physics/`**: `PerformanceProfile` schemas (`calm`, `energetic`, `playful`, `dramatic`, `solemn`), 2nd-order damped spring dynamics, squash & stretch, overshoot, and settle timing.
   - **`camera/`**: `CameraRig`, velocity-aware target tracking, look-ahead offsets, functional spring damping, soft dead-zone, and Hermite $C^0/C^1$ continuity splines.
   - **`morph/`**: Arc-length equidistant vertex resampling, cyclic phase shift distortion minimization, and continuous geometric interpolation.
   - **`bezier/`**: Exact `quadraticBezierPoint`, `cubicBezierPoint`, 1st derivatives, tangent orientation $\theta = \arctan2(\dot{y}, \dot{x})$, arc-length LUT, packet travel, and animated stroke reveal.
   - **`cues/`**: Unified audio/visual cue manifest schemas (`cues.json`).

2. **Quality Gates & Verification (`validators/` & root CLI)**
   - **`motion-lint.ts`**: Recursive Babel/TypeScript AST visitor detecting structural anti-patterns (monolithic SVGs, binary ternary flips, fake Bezier travel, inert damping, discontinuous cuts).
   - **`temporal-render-qa.ts`**: Automated FFmpeg rawvideo frame luminance decoding, rolling adjacent-frame Mean Absolute Difference (MAD), $>4\times$ local median spike detection, and ShotSpec whitelist reconciliation.
   - **`validate-shot-spec.ts`**: AJV-backed JSON schema validator verifying inter-shot continuity ($S_N.\text{end\_state} == S_{N+1}.\text{start\_state}$).

3. **Compositions & Unseen V2 Benchmarks (`connection-film/src/benchmarks/v2/`)**
   - **`BenchmarkV2HumanExplainer.tsx`**: Articulated HumanRig, CharacterController, 5 PerformanceProfiles, look-ahead camera tracking.
   - **`BenchmarkV2MechanicalMorph.tsx`**: Continuous SVG coordinate matrix morphing, zero ternary swaps, rotational inertia physics.
   - **`BenchmarkV2NetworkFlow.tsx`**: Exact Bezier packet trajectories, tangent orientation tracking, ArbitraryCustomRigAdapter, multi-shot continuity, audio cue manifest.

4. **Dual Track Orchestration**
   - **Implementation Track**: Milestone 1 -> Milestone 2 -> Milestone 3 -> Milestone 4 -> Milestone 5 -> Milestone 6.
   - **E2E Testing Track**: E2E Test Runner, Test Suites (Tiers 1-4), published via `TEST_READY.md`.

---

## Feature Inventory
Every feature from the Survey phase appears here with its assigned milestone. No feature is unassigned.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | Canonical `motion-kit` Package | Independent package with dedicated `package.json` and exports | M1 | Survey / R1 |
| F02 | TypeScript Definitions & Config | Complete definitions and build setup in `motion-kit/tsconfig.json` | M1 | Survey / R1 |
| F03 | Import Isolation | Zero runtime imports from `.agents/skills` across all compositions | M1 | Survey / R1 |
| F04 | Workspace Linking | Clean package resolution via root package / workspace symlinks | M1 | Survey / R1 |
| F05 | `RigInterface` Contract | Explicit contract for geometry, joints, transforms, expressive layers | M2 | Survey / R2 |
| F06 | `CharacterController` | High-level state, action sequencing, and profile coordination | M2 | Survey / R2 |
| F07 | `BirdRig` Implementation | Articulated avian rig implementing `RigInterface` | M2 | Survey / R2 |
| F08 | `HumanRig` Implementation | Articulated human rig with head, torso, arms, legs, expressions | M2 | Survey / R2 |
| F09 | `ArbitraryCustomRigAdapter` | Universal mounting adapter for third-party or arbitrary vector characters | M2 | Survey / R2 |
| F10 | `PerformanceProfile` Schema | Physics parameters: timing scales, squash, overshoot, lag, settle | M2 | Survey / R3 |
| F11 | Preset: `calm` | Low-energy, slow settle, minimal overshoot profile | M2 | Survey / R3 |
| F12 | Preset: `energetic` | High-velocity, rapid snap, brisk rebound profile | M2 | Survey / R3 |
| F13 | Preset: `playful` | Exaggerated squash, high bounce, oscillatory settle profile | M2 | Survey / R3 |
| F14 | Preset: `dramatic` | Prolonged anticipation, deep squash, intense settle profile | M2 | Survey / R3 |
| F15 | Preset: `solemn` | Heavy damping, minimal rebound, restrained momentum profile | M2 | Survey / R3 |
| F16 | Profile-Driven Actions | `anticipate`, `overshoot`, `settle`, `react`, `gesture` consuming profiles | M2 | Survey / R3 |
| F17 | Camera Velocity Tracking | Continuous camera tracking with dynamic look-ahead offsets | M3 | Survey / R4 |
| F18 | Functional Spring Damping | 2nd-order damped spring ODE camera inertia (zero inert parameters) | M3 | Survey / R4 |
| F19 | Camera Dead-Zone | Soft dead-zone thresholds eliminating micro-jitter | M3 | Survey / R4 |
| F20 | C0/C1 Camera Continuity | Hermite spline transitions guaranteeing continuous position and velocity | M3 | Survey / R4 |
| F21 | Arc-Length Path Resampling | Equidistant vertex sampling for continuous SVG path morphing | M3 | Survey / R5 |
| F22 | Phase Shift Optimization | Cyclic shift minimization preventing shape twists during morphs | M3 | Survey / R5 |
| F23 | Zero Binary Swaps Morph | True continuous geometric interpolation (0% ternary swaps) | M3 | Survey / R5 |
| F24 | Quadratic Bezier Point | Exact coordinate calculation $B(t) = (1-t)^2 P_0 + 2(1-t)t P_1 + t^2 P_2$ | M3 | Survey / R6 |
| F25 | Cubic Bezier Point | Exact coordinate calculation $B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + \dots$ | M3 | Survey / R6 |
| F26 | Bezier Derivatives & Tangent | First derivative velocity and tangent angle $\theta = \arctan2(\dot{y}, \dot{x})$ | M3 | Survey / R6 |
| F27 | Bezier Arc-Length LUT | Constant-speed packet travel via arc-length parameterized LUT | M3 | Survey / R6 |
| F28 | Bezier Stroke Reveal | Synchronized strokeDasharray / strokeDashoffset curve animator | M3 | Survey / R6 |
| F29 | AST-Based Motion Linter | Babel/TypeScript AST visitor in `motion-lint.ts` replacing regex | M4 | Survey / R7 |
| F30 | AST Rule: Monolithic SVGs | Detect unarticulated inline SVG paths lacking joint hierarchy | M4 | Survey / R7 |
| F31 | AST Rule: Binary Faux Morphs | Detect JSX ternary/conditional flips during claimed morph transitions | M4 | Survey / R7 |
| F32 | AST Rule: Fake Bezier Travel | Detect linear chord packet travel on curved conduits | M4 | Survey / R7 |
| F33 | AST Rule: Inert Damping | Detect unused damping parameters in camera functions | M4 | Survey / R7 |
| F34 | AST Rule: Discontinuous Cuts | Detect abrupt camera jumps violating C0/C1 continuity | M4 | Survey / R7 |
| F35 | FFmpeg Video Decoding Pipe | Sub-second rawvideo pipe decoding via `/home/hongphuoc6104/.local/bin/ffmpeg` | M4 | Survey / R8 |
| F36 | Adjacent-Frame MAD QA | Rolling adjacent-frame Mean Absolute Difference calculation | M4 | Survey / R8 |
| F37 | MAD Spike Ratio QA | Rolling local median filter flagging unannotated discontinuities $>4\times$ | M4 | Survey / R8 |
| F38 | ShotSpec Schema & Validation | JSON schema and validator verifying $S_N.\text{end\_state} == S_{N+1}.\text{start\_state}$ | M4 | Survey / R9 |
| F39 | ShotSpec Impact Whitelist | Whitelisting deliberate high-velocity impact frames in temporal QA | M4 | Survey / R8, R9 |
| F40 | Audio Cue Synchronization | Unified `cues.json` connecting Remotion visual markers to audio events | M4 | Survey / R10 |
| F41 | Benchmark V2-A (Human) | `BenchmarkV2HumanExplainer.tsx` validating R2, R3, R4 | M5 | Survey / R11 |
| F42 | Benchmark V2-B (Mechanical) | `BenchmarkV2MechanicalMorph.tsx` validating R5, R3 | M5 | Survey / R11 |
| F43 | Benchmark V2-C (Network) | `BenchmarkV2NetworkFlow.tsx` validating R6, R2, R9, R10 | M5 | Survey / R11 |
| F44 | V2 MP4 Batch Rendering | Full Remotion batch rendering producing MP4 video files | M6 | Survey / R11 |
| F45 | E2E Test Suite (Tiers 1-4) | Comprehensive test suite derived from requirements, published via `TEST_READY.md` | E2E Track | Survey / Project |
| F46 | Adversarial Hardening (Tier 5) | White-box adversarial test cases and edge-case verification | M6 | Survey / Project |
| F47 | Independent Quality Scoring | Objective rubric evaluation by independent reviewer agent (score $\ge 4.5/5.0$) | M6 | Survey / R12 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Canonical Packaging & Foundations (`M1_Package_Foundations`) | F01, F02, F03, F04 (`motion-kit` standalone package, package.json, tsconfig.json, clean imports) | None | IN_PROGRESS (Conv: `8e083645-0d34-446c-83bc-3f1a2e020c5f`) |
| M2 | Character Architecture & Physics Profiles (`M2_Character_Physics`) | F05, F06, F07, F08, F09, F10, F11, F12, F13, F14, F15, F16 (`RigInterface`, `CharacterController`, `BirdRig`, `HumanRig`, `CustomRigAdapter`, `PerformanceProfile`) | M1 | PLANNED |
| M3 | Motion Geometry & Calculus (`M3_Geometry_Calculus`) | F17, F18, F19, F20, F21, F22, F23, F24, F25, F26, F27, F28 (Camera continuity, SVG path morphing, Bezier calculus) | M1 | PLANNED |
| M4 | Quality Gates & Verification Tooling (`M4_Quality_Tooling`) | F29, F30, F31, F32, F33, F34, F35, F36, F37, F38, F39, F40 (AST motion linter, FFmpeg temporal QA, ShotSpec validator, cue manifest) | M1 | PLANNED |
| M5 | V2 Unseen Benchmark Compositions (`M5_V2_Benchmarks`) | F41, F42, F43 (3 new unseen V2 benchmark scenes in `connection-film/src/benchmarks/v2/`) | M2, M3, M4 | PLANNED |
| M6 | Final Milestone: E2E, Render, Hardening & Quality Review (`M6_Final_Evaluation`) | F44, F46, F47 (Pass 100% E2E tests, MP4 renders, temporal QA pass, Tier 5 hardening, independent reviewer score $\ge 4.5/5.0$) | M5, E2E Track | PLANNED |
| E2E | E2E Testing Track Orchestrator (`E2E_Testing_Track`) | F45 (Requirement-driven test runner, Tiers 1-4 test suite, `TEST_INFRA.md`, `TEST_READY.md`) | None | IN_PROGRESS (Conv: `78d23a4a-3780-4b94-b47e-e1012a4b0780`) |

---

## Interface Contracts

### `motion-kit` ↔ Compositions & Tooling
- **Entry point**: `motion-kit/src/index.ts`
- **Sub-modules**:
  - `motion-kit/src/rigs/`: exports `RigInterface`, `CharacterController`, `BirdRig`, `HumanRig`, `ArbitraryCustomRigAdapter`, `CharacterPose`.
  - `motion-kit/src/physics/`: exports `PerformanceProfile`, `PerformanceProfileName`, `PERFORMANCE_PROFILES`, `evaluateProfileDynamics`.
  - `motion-kit/src/camera/`: exports `CameraRig`, `CameraState`, `cameraFollowContinuous`, `interpolateCameraHermite`.
  - `motion-kit/src/morph/`: exports `interpolateSvgPath`, `samplePathArcLength`, `optimizeVertexPhaseShift`.
  - `motion-kit/src/bezier/`: exports `quadraticBezierPoint`, `cubicBezierPoint`, `bezierTangentAngle`, `bezierVelocity`, `createBezierLUT`, `evaluatePacketTravel`.
  - `motion-kit/src/cues/`: exports `CueManifest`, `validateCueManifest`.

### Character Rig Contract (`RigInterface`)
```typescript
export interface RigJoint {
  id: string;
  name: string;
  parent?: string;
  position: { x: number; y: number };
  rotation: number;
}

export interface RigGeometryLayer {
  id: string;
  zIndex: number;
  render: (jointTransforms: Record<string, { x: number; y: number; rotation: number }>, expressiveParams: Record<string, number>) => React.ReactNode;
}

export interface RigInterface {
  readonly id: string;
  readonly type: 'bird' | 'human' | 'custom';
  getJoints(pose: any): Record<string, RigJoint>;
  getLayers(): RigGeometryLayer[];
  render(pose: any, expressive: Record<string, number>): React.ReactNode;
}
```

### Performance Profile Contract
```typescript
export interface PerformanceProfile {
  name: 'calm' | 'energetic' | 'playful' | 'dramatic' | 'solemn';
  timingScale: number;
  squashFactor: number;
  anticipationRatio: number;
  overshootAmplitude: number;
  followThroughLagFrames: number;
  settleOscillationCount: number;
  settleDecayRate: number;
}
```

### ShotSpec ↔ Temporal Render QA Contract
```json
{
  "shots": [
    {
      "id": "shot_01",
      "startFrame": 0,
      "endFrame": 60,
      "start_state": { "camera": { "x": 0, "y": 0, "zoom": 1.0 } },
      "end_state": { "camera": { "x": 300, "y": 150, "zoom": 1.2 } },
      "impact_frames": []
    },
    {
      "id": "shot_02",
      "startFrame": 60,
      "endFrame": 120,
      "start_state": { "camera": { "x": 300, "y": 150, "zoom": 1.2 } },
      "end_state": { "camera": { "x": 800, "y": 200, "zoom": 1.0 } },
      "impact_frames": [75]
    }
  ]
}
```
Validation Rule: `shots[N].end_state.camera` must equal `shots[N+1].start_state.camera`.
Impact frames listed in `impact_frames` are whitelisted against $>4\times$ MAD spike rejection in `temporal-render-qa.ts`.

---

## Code Layout
```
/home/hongphuoc6104/Desktop/videorenderhoathinh/
├── motion-kit/                        # Canonical standalone workspace package
│   ├── package.json                   # "name": "motion-kit", "version": "2.0.0"
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                   # Unified public exports
│   │   ├── rigs/                      # RigInterface, HumanRig, BirdRig, ArbitraryCustomRigAdapter, CharacterController
│   │   ├── physics/                   # PerformanceProfile schemas & dynamics
│   │   ├── camera/                    # Continuous camera tracking, spring damping, Hermite splines
│   │   ├── morph/                     # True SVG path/vertex morphing engine
│   │   ├── bezier/                    # Exact Bezier math, tangents, LUT packet travel, stroke reveal
│   │   └── cues/                      # Audio cue manifest definitions & validator
├── validators/
│   ├── motion-lint.ts                 # Babel/TypeScript AST visitor
│   ├── temporal-render-qa.ts          # FFmpeg rolling MAD video analyzer
│   └── validate-shot-spec.ts          # ShotSpec continuity validator
├── tests/                             # E2E Test Suites (Tiers 1-4)
│   ├── e2e-runner.ts
│   ├── tier1-features/
│   ├── tier2-boundaries/
│   ├── tier3-combinations/
│   └── tier4-scenarios/
├── connection-film/
│   ├── package.json                   # Remotion configuration
│   └── src/
│       ├── index.ts                   # Remotion Root registering V2 compositions
│       └── benchmarks/
│           ├── legacy/                # Preserved frozen diagnostics (Benchmark 1, 2, 3)
│           └── v2/                    # 3 NEW unseen V2 benchmarks
│               ├── BenchmarkV2HumanExplainer.tsx
│               ├── BenchmarkV2MechanicalMorph.tsx
│               ├── BenchmarkV2NetworkFlow.tsx
│               ├── shot-spec.v2-a.json
│               ├── shot-spec.v2-b.json
│               └── shot-spec.v2-c.json
├── TEST_INFRA.md                      # E2E Test Suite index & specifications
├── TEST_READY.md                      # Signal published when test suite is complete
└── ORIGINAL_REQUEST.md                # Authoritative user requirements
```
