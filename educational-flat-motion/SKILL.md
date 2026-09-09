---
name: educational-flat-motion
description: "Create reusable educational flat vector motion videos with Remotion."
---

# Educational Flat Motion Video Production Skill

## Purpose
Use this skill to create repeatable, high-quality, 2D educational explainer videos in Remotion with a polished flat-vector, cinematic motion-graphics language.

This is a production-system skill, not a prompt for a single video.

The target is NOT to copy any specific studio's characters, assets, compositions, music, narration, or proprietary visual identity. Instead, use high-level traits such as:
- clean geometric vector illustration
- strong silhouettes
- limited but vivid palettes
- visual metaphors
- dense but readable motion
- motivated transitions
- camera-aware staging
- character acting with anticipation and follow-through
- educational clarity

## Trigger
Use when the user asks to create, batch-create, or automate 2D educational/explainer videos with Remotion or React-based programmatic video generation.

## Core Rule
Do not jump from script directly to React code.

Every video MUST pass through:
1. Brief normalization
2. Narrative beat extraction
3. Visual metaphor design
4. Storyboard / shot plan
5. Asset and rig planning
6. Motion specification
7. Implementation
8. Render
9. Visual QA
10. Revision

## Agent Roles
The orchestrating agent is the Director. It owns all creative decisions and continuity.

Sub-agents may implement, but must never independently redesign adjacent shots.

Recommended division:
- Director: story, visual metaphor, art direction, shot continuity, QA
- Art Agent: SVG/vector assets, backgrounds, props, characters
- Rig Agent: reusable articulated characters and pose system
- Motion Agent: reusable motion primitives and timing curves
- Shot Agent: implements shot specs exactly
- Transition Agent: motivated transitions and scene continuity
- QA Agent: static-code audit + rendered-video audit

If fewer agents are available, combine roles but preserve responsibilities.

## Required Inputs
Minimum:
- topic or script
- target duration
- aspect ratio
- output language

Optional:
- voiceover audio
- brand palette
- audience
- reference videos
- preferred density / tone

If a reference video is supplied, analyze its high-level motion grammar only. Never extract or reproduce copyrighted assets.

## Phase 1 — Brief Normalization
Create a production brief containing:
- goal
- audience
- duration
- fps
- aspect ratio
- tone
- information density
- narration status
- visual constraints
- brand constraints

Default technical target unless specified:
- 1920x1080
- 30 fps
- TypeScript + React + Remotion
- SVG-first art system

## Phase 2 — Narrative Beats
Split the narration into semantic beats.

Each beat must answer:
- What is the viewer learning?
- What should they feel?
- What visual metaphor can communicate this faster than text?
- What visual state must exist at the end so the next beat can continue naturally?

Avoid treating paragraphs as slides.

## Phase 3 — Shot Planning
Build shots from narrative beats.

Every shot MUST define:
- shot_id
- start_frame
- end_frame
- narrative_purpose
- composition
- foreground
- midground
- background
- actor states
- primary action
- camera action
- secondary motion
- transition in
- transition out
- sound cues
- start_state
- end_state

Critical continuity rule:
`shot[N].end_state == shot[N+1].start_state`

## Phase 4 — Visual Language
Use `references/style-system.md`.

Do not make every shot unique from scratch. Reuse a controlled design system:
- palette tokens
- shape language
- stroke rules
- lighting rules
- character proportions
- icon grammar
- depth layers
- typography rules

## Phase 5 — Character Rigging
If characters appear, use `references/character-rig.md`.

Characters MUST NOT be a single SVG group translated around the screen.

At minimum separate:
- root
- body
- head
- eyes/pupils
- arms/wings
- legs
- tail/hair/accessories where applicable

Expressions and actions are separate state dimensions.

Example:
`expression="happy" action="landing" gaze="left"`

Never encode all behavior as one `mood` prop.

## Phase 6 — Motion Grammar
Use `references/motion-grammar.md`.

Every meaningful action should normally include some of:
- anticipation
- acceleration
- deceleration
- overshoot
- settle
- follow-through
- overlapping action
- secondary motion
- phase offsets

Do not substitute `Math.sin()` bobbing for acting.

## Phase 7 — Reusable Motion System
Before implementing many shots, create or reuse primitives such as:
- anticipate()
- overshoot()
- settle()
- squashStretch()
- followThrough()
- blink()
- eyeLook()
- headTurn()
- bodyLean()
- wingFlap()
- walkCycle()
- flyArc()
- land()
- wave()
- cameraPan()
- cameraPush()
- cameraPull()
- cameraFollow()
- parallax()
- irisTransition()
- morphTransition()
- matchTransition()

The exact implementation may vary, but motion behavior must be reusable and parameterized.

## Phase 8 — Motion Specification
Before coding a shot, create a frame-level motion spec using `templates/shot-spec.md`.

Implementation agents MUST follow the spec rather than inventing timing ad hoc.

Do not prescribe every frame if unnecessary, but define all key poses and critical timing beats.

## Phase 9 — Camera Rules
Camera must support storytelling.

Allowed patterns:
- push-in on realization
- pull-out on scale/reveal
- pan toward gaze target
- follow a moving object
- parallax during travel
- reframe before a new subject enters

Forbidden pattern:
- adding a global slow zoom merely so the shot is "not static"

## Phase 10 — Transition Rules
Prefer motivated transitions:
- object becomes next-scene object
- light trail becomes orbit
- circle becomes iris/sun/planet/eye
- building window becomes panel
- particle field becomes stars

Avoid habitual:
- fade out scene A
- fade in scene B

Opacity transitions are allowed only when narratively justified or used as a minor component of a richer transition.

## Phase 11 — Sound Timeline
Maintain one shared cue timeline for animation and audio.

Do not maintain unrelated timing constants in separate Python/TS files.

Use a shared conceptual cue map such as:
- narration beats
- action hits
- whooshes
- impacts
- UI/graphic accents
- music emphasis points

## Phase 12 — Implementation Constraints
- Use Remotion's frame-driven animation model.
- Prefer deterministic behavior.
- Seed random generators.
- Avoid real-time CSS animations for rendered motion.
- Prefer SVG for scalable flat-vector assets.
- Use raster assets only when appropriate.
- Keep art components separate from shot choreography.
- Keep motion primitives separate from art components.
- Keep shot timing separate from low-level drawing when possible.

## Phase 13 — Mandatory QA
Use `references/quality-rubric.md` and `checklists/anti-patterns.md`.

The agent MUST inspect the actual rendered output.

For each shot, inspect frames at approximately:
- 0%
- 20%
- 40%
- 60%
- 80%
- 100%

Also watch the sequence at real speed.

Reject if it feels like:
- animated slides
- PowerPoint
- template motion graphics
- objects simply sliding in/out
- generic easing without acting

## Phase 14 — Revision Loop
If QA fails:
1. identify the exact shot and timestamp
2. classify the failure
3. modify the shot/motion spec
4. update implementation
5. render again
6. compare before/after

Do not fix quality by merely increasing fps, adding particles, or adding more packages.

## Batch Production Rules
For large-scale generation:
- Story content may vary.
- Character designs may vary within the design system.
- Visual metaphors must be generated per topic.
- Motion grammar stays consistent.
- Quality rubric stays constant.
- Shared component/motion libraries must be reused.
- Do not reuse identical shot layouts so often that outputs become templated.

Recommended reusable layers:
1. Design tokens
2. Art primitives
3. Character rigs
4. Motion primitives
5. Camera system
6. Transition system
7. Shot templates (loose patterns, not fixed layouts)
8. QA rules

## Anti-Copy Rule
Do not reproduce a reference studio's:
- exact character designs
- exact illustrations
- exact palettes as a signature identity
- exact scene compositions
- exact iconography
- logo/branding
- narration
- music
- proprietary assets

Use references to infer high-level production principles only.

## Completion Criteria
A video is not complete because code compiles.

Complete only when:
- render succeeds
- rendered video has been watched
- continuity passes
- QA rubric passes minimum threshold
- no critical anti-pattern remains
- output is original
