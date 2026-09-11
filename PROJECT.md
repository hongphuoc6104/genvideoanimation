# Project: 4-Tier Educational Video Ecosystem Overhaul

## Architecture
- **Layer 1: Runtime Primitives (`motion-kit/src/geometry/`)**: Self-protecting geometric primitives (`AutoClippingConnector`, `OpaqueCard`/`OpaqueShield`, `SafeStageZone`, `RadialLabelGroup`).
- **Layer 2: Verification Gates (`validators/validate-runtime-geometry.ts` & `tests/invariants/`)**: Generic Headless DOM runtime measurement via Remotion bundling & Chromium CDP (`getBoundingClientRect()`, `getBBox()`), eliminating all hardcoded constants, AST `isDynamic` bypasses, and `(0,0)` vector fallbacks.
- **Layer 3: Authoring Standards & Skills (`.agents/skills/educational-flat-motion/`)**: Canonical rules, 5 Geometric Invariants checklist, and updated templates mandating smart primitives.
- **Layer 4: Compositions & Generalization Benchmark (`connection-film/src/projects/`)**: Clean migration of 4 legacy projects and production of a brand new, independent generalization project (Raft Distributed Consensus Protocol) with 0 manual coordinate patches.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | F1.1 AutoClippingConnector | Ray-Box Boundary Intersection solver with outer boundary clipping and zero text penetration | M1 | ORIGINAL_REQUEST §R1 |
| 2 | F1.2 OpaqueCard & Shield | 2-layer decoupled architecture (100% opaque base shield `#0F172A`, separate content salience layer) | M1 | ORIGINAL_REQUEST §R1 |
| 3 | F1.3 SafeStageZone | Stage Zone 2 container ($y \in [180, 1420]\text{px}$, $x \in [36, 1044]\text{px}$) with $\ge 50\text{px}$ buffer before subtitle ($y = 1470\text{px}$) | M1 | ORIGINAL_REQUEST §R1 |
| 4 | F1.4 RadialLabelGroup | Polar layout with automatic flip alignment ($\theta \pm 180^\circ$) and horizontal clamping $[36, 1044]\text{px}$ | M1 | ORIGINAL_REQUEST §R1 |
| 5 | F1.5 Motion-Kit Unit Tests | Comprehensive mathematical and integration test suite (`tests/invariants/smart-geometric-primitives.test.ts`) | M1 | ORIGINAL_REQUEST §R1 |
| 6 | F2.1 Purge Validator Hardcoding | Remove 100% hardcoded constants of `scopus-research-gap` from `validate-runtime-geometry.ts` | M2 | ORIGINAL_REQUEST §R2 |
| 7 | F2.2 Headless DOM Measurement | Real Chromium CDP DOM measurement via Remotion bundler/renderer (`getBoundingClientRect()`, `getBBox()`) | M2 | ORIGINAL_REQUEST §R2 |
| 8 | F2.3 Eliminate Bypass Loopholes | Remove `isDynamic` bypass and `(0,0)` vector fallback completely; fail-closed on unmeasurable geometry | M2 | ORIGINAL_REQUEST §R2 |
| 9 | F2.4 Generic CLI `--project` | Support generic `--project=<path>` argument to run runtime geometry checks on any composition | M2 | ORIGINAL_REQUEST §R2 |
| 10 | F2.5 Fail-Closed Exit Code 1 | Fail-closed on collisions, vector pierces, subtitle intrusions ($y > 1420$), and viewport overflow | M2 | ORIGINAL_REQUEST §R2 |
| 11 | F3.1 Mandatory Primitives in Skill | Update `SKILL.md` to mandate `AutoClippingConnector` and `OpaqueCard` | M3 | ORIGINAL_REQUEST §R3 |
| 12 | F3.2 5 Geometric Invariants Checklist | Formalize 5 invariants checklist for Tier 1 authoring before delivery | M3 | ORIGINAL_REQUEST §R3 |
| 13 | F3.3 Update Templates & Schemas | Update `SceneTemplate.tsx` and reference schemas to eliminate coordinate discrepancies and embed smart primitives | M3 | ORIGINAL_REQUEST §R3 |
| 14 | F4.1 Scopus Project Migration | Refactor `scopus-research-gap` scenes to use smart primitives, removing manual coordinate patches and opacity hacks | M4 | ORIGINAL_REQUEST §R4 |
| 15 | F4.2 Legacy Films Migration | Refactor `crispr-cas9`, `steam-engine`, and `git-dag` to eliminate center-to-center vector pierces and hardcoded y offsets | M4 | ORIGINAL_REQUEST §R4 |
| 16 | F4.3 Regression & Gate Verification | Verify all 4 migrated legacy projects pass runtime geometry checks cleanly without exceptions | M4 | ORIGINAL_REQUEST §R4 |
| 17 | F5.1 Generalization Film Creation | Author brand new educational film (Raft Distributed Consensus Protocol) using curriculum mapping and smart primitives | M5 | ORIGINAL_REQUEST §R4 |
| 18 | F5.2 Zero Manual Coordinate Tuning | Ensure generalization film achieves 100% geometric compliance purely via smart primitives without manual coordinate hacks | M5 | ORIGINAL_REQUEST §R4 |
| 19 | F5.3 Generalization Gate Verification | Verify generalization film passes generic runtime geometry gate with exit code 0 | M5 | ORIGINAL_REQUEST §R4 |
| 20 | F6.1 Scopus Gate Verification | `npm run gate -- --project=connection-film/src/projects/scopus-research-gap` PASS 100% | M5 | ORIGINAL_REQUEST §AC4 |
| 21 | F6.2 Canonical Workspace Gate | `npm run v3.3:gate` PASS 100% across all projects in workspace | M5 | ORIGINAL_REQUEST §AC4 |
| 22 | F6.3 Independent Forensic Audit | Independent `teamwork_preview_auditor` verifies zero hardcoding, zero bypasses, and signs `qa-report.json` | M5 | ORIGINAL_REQUEST §AC4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Smart Primitives in Motion-Kit | Implement `AutoClippingConnector`, `OpaqueCard`, `SafeStageZone`, `RadialLabelGroup` and tests in `motion-kit` | none | IN_PROGRESS |
| 2 | M2: Generic Headless DOM Gate G04D | Overhaul `validate-runtime-geometry.ts` with real Remotion CDP headless DOM measurement and `--project` CLI | none | IN_PROGRESS |
| 3 | M3: Skill & Templates Overhaul | Update `SKILL.md`, `references/`, `templates/` with 5 Geometric Invariants and mandatory smart primitives | M1, M2 | PLANNED |
| 4 | M4: Migration of Existing Videos | Refactor `scopus`, `crispr`, `steam`, and `git-dag` to smart primitives and verify regression-free | M1, M2 | PLANNED |
| 5 | M5: Generalization Benchmark & Acceptance Audit | Build Raft Consensus lecture, verify zero manual tuning, run canonical gate across all films, and execute forensic audit | M3, M4 | PLANNED |

## Code Layout
- `motion-kit/src/geometry/`:
  - `boundaryIntersection.ts`: Pure math solver for Ray-Box intersection with rounded corners.
  - `AutoClippingConnector.tsx`: Connector component with outer boundary clipping.
  - `OpaqueCard.tsx`: 2-layer decoupled card/shield component (`opacity: 1.0` base).
  - `SafeStageZone.tsx`: Stage container enforcing bounds $[36, 1044] \times [180, 1420]$ and subtitle clearance.
  - `RadialLabelGroup.tsx`: Polar layout coordinator with flip alignment and horizontal clamping.
  - `index.ts`: Public exports from `motion-kit/src/geometry/`.
- `tests/invariants/smart-geometric-primitives.test.ts`: Unit test suite for geometry math and primitives.
- `validators/validate-runtime-geometry.ts`: Generic Headless DOM runtime geometry gate (G04D).
- `.agents/skills/educational-flat-motion/`: Updated skill files, templates, and schemas.
- `connection-film/src/projects/`: Migrated legacy compositions and new generalization composition `raft-consensus`.

## Interface Contracts
### AutoClippingConnectorProps
```ts
interface BoxBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
}

interface AutoClippingConnectorProps {
  sourceBox: BoxBounds;
  targetBox: BoxBounds;
  routing?: 'straight' | 'curved' | 'orthogonal';
  curvedOffset?: number;
  gapStart?: number;
  gapEnd?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  progress?: number;
  arrowEnd?: boolean;
  arrowSize?: number;
}
```

### OpaqueCardProps
```ts
interface OpaqueCardProps {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
  backgroundColor?: string; // default '#0F172A'
  borderColor?: string;
  borderWidth?: number;
  isSalient?: boolean;
  salienceOpacity?: number; // default 0.25 when inactive
  children: React.ReactNode;
  svgMode?: boolean; // default true
}
```

### SafeStageZoneProps
```ts
interface SafeStageZoneProps {
  children: React.ReactNode | ((helpers: {
    mapPoint: (u: number, v: number) => { x: number; y: number };
    clampBox: (x: number, y: number, w: number, h: number) => { x: number; y: number; width: number; height: number };
  }) => React.ReactNode);
  showDebugBounds?: boolean;
}
```
