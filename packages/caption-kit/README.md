# @videorender/caption-kit

Canonical Remotion React karaoke caption kit featuring frame-deterministic progressive fill, zero cumulative layout shift (CLS = 0), safe area placement, and educational art direction.

## Features
- **Deterministic Progressive Fill**: Clamped 0.0 -> 1.0 monotonic progression via CSS sub-pixel `clip-path: inset(0 X% 0 0)`.
- **Zero Cumulative Layout Shift (CLS = 0)**: Dual-layer overlay architecture preserving baseline layout stability across state transitions.
- **Educational Art Direction**: Slate-400 upcoming, sky-400 active (WCAG AA >= 4.5:1), slate-300 spoken. Strictly zero bouncy/shaky transforms.
- **Remotion Coordinator**: `KaraokeCaptions` mounts active caption groups at specified bounding boxes with graceful fallback outside Remotion context.
