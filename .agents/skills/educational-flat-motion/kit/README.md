# Motion Kit for Remotion & React

A reusable, production-ready motion graphics library for React and Remotion implementing Disney's 12 Animation Principles, volume-preserving squash & stretch, physical easing profiles, skeletal joint blending, multi-depth parallax camera system, and motivated transitions.

## 📦 What's Inside

- **`motion-primitives.ts`**:
  - `squashStretch()`: Volume-preserving squash & stretch (`scaleX * scaleY = 1`).
  - `anticipate()`: Pre-action windup before ballistic motion.
  - `overshoot()`: Natural damping overshoot.
  - `settle()`: Elastic settling curves.
  - `followThrough()`: Secondary lagging motion for appendages.
  - `arcTrajectory()`: Parabolic and curved motion paths.
  - `gazeTarget()`: Motivated head and eye tracking.

- **`motion-profiles.ts`**:
  - Physical easing curves: `snappy`, `heavy`, `bouncy`, `organic`, `decelerate`.

- **`pose-blending.ts`**:
  - Skeletal/joint interpolation between key poses (`interpolatePose`, `generateSkeletalTimeline`). Eliminates linear opacity crossfades.

- **`character-actions.ts`**:
  - Parametric action generators: `takeoffSequence()`, `flightCycle()`, `landingSequence()`, `reactionSequence()`.

- **`camera-system.ts`**:
  - Multi-plane parallax staging math, camera push/pull/pan, shake/jitter, focus rack.

- **`motivated-transitions.ts`**:
  - Geometric morphing, focal iris wipes, and motivated match cuts.

- **`components/`**:
  - `<CharacterRig />`: Articulated SVG character rig with decoupled pivot points.
  - `<CameraRig />`: Multi-depth parallax camera stage component (5 layers: background, far, mid, near, overlay).
  - `<MotivatedTransition />`: Motivated iris & geometric transition wrapper.

## 🚀 Usage

```tsx
import {
  CharacterRig,
  CameraRig,
  squashStretch,
  motionProfiles,
  cameraPush,
} from './motion-kit';
```
