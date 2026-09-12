# Anti-Pattern Checklist (V3.4+ Geometric & Kinetic Standards)

Reject or revise if any critical item is present.

## Critical: Geometric & Layout Invariants (Layer 2 Fail-Closed Triggers)
- **Text Collision (INV-GEO-01)**: Two text elements overlapping ($AABB_1 \cap AABB_2 \neq \emptyset$).
- **Container Overflow or Padding Deficit (INV-GEO-02)**: Hardcoded `<rect width={...}>` around text, or padding $< 30\text{px}$ ($padHorizontal < 30\text{px}$ or $padVertical < 30\text{px}$). Always mandate `AutoPill` or `computePillDimensions`.
- **Unclipped Vector Penetration (INV-GEO-03)**: Connector lines, arrows, or rays drawn from center to center ($cx, cy \to cx, cy$) piercing through card content or text bounding boxes. Always mandate `AutoClippingConnector`.
- **CSS Opacity Inheritance Trap**: Applying `opacity < 1` (e.g. $0.20 - 0.25$) directly to an outer container with a dark background, turning the base shield into transparent glass and revealing underlying vectors/ghosts. Always mandate `OpaqueCard` with Layer 1 base shield strictly at `opacity: 1.0` (`#0F172A`).
- **Subtitle Zone Intrusion (INV-GEO-04)**: Stage mechanisms, cards, or labels extending below $y = 1420\text{px}$ ($< 50\text{px}$ buffer before subtitle floor $y = 1470\text{px}$). Always mandate `<SafeStageZone>`.
- **Narrow Polar Layout Collision (INV-GEO-05)**: Polar or circular layouts with adjacent angular difference $\Delta\theta < 45^\circ$ using uniform radius instead of Staggered Radii ($R_{odd} \neq R_{even}$, $\Delta R \ge 80\text{px}$). Always mandate `RadialLabelGroup`.
- **Viewport Margin Overflow (INV-GEO-05)**: Visual elements or text labels extending outside safe screen margins $[36, 1044]\text{px}$.
- **Ghosted Elements & Overlapping Text**: Rendering two texts or cards at identical coordinates (e.g. "PASS" over "SCOPUS", or "Cây cầu" over "Vực thẳm") or leaving inactive elements visible at $0.15 - 0.25$ opacity beneath active elements instead of clean conditional unmounting (`{isState && <Element />}`) or spatial exit.

## Critical: Character & Animation Grammar
- Full character is one monolithic SVG group for all actions.
- Pose transition implemented by crossfading two complete character instances.
- Flying/walking character implemented primarily as naive `translate(x,y)` without secondary motion.
- Meaningful action has no anticipation or settle where physically/expressively expected.
- Every scene transition is a naked fade/crossfade without motivated spatial continuity.
- Adjacent shots do not share continuity state ($shot[N].end\_state \neq shot[N+1].start\_state$).
- Implementation agent invented shot timing without a motion spec / timeline token derivation.
- Render was not watched before declaring completion.

## Major
- Global slow zoom used throughout as default camera behavior.
- `Math.sin` bobbing used as substitute for acting/physics.
- All body parts start/end motion together (stiff robotic timing).
- Eye/head/body direction changes on the exact same frame.
- Audio cues use unrelated timing constants from animation.
- Repeated identical scene layouts across many generated videos (slide monoculture).
- Excessive simultaneous movement reduces cognitive readability.
- Multi-item taxonomies shown simultaneously with competing motion instead of progressive disclosure.

## Minor
- Decorative particles without narrative purpose.
- Too many colors in one shot (violating semantic palette tokens).
- Unnecessary outlines/detail that blur during rapid motion.
- Text used where a visual metaphor would communicate better (violating the Mute-and-Blank rule).
