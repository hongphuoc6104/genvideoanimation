# Character Rig Specification

## Required hierarchy
CharacterRoot
- Body
- Head
  - Face
    - EyeL
    - EyeR
    - PupilL
    - PupilR
    - Mouth/Beak
- Arm/WingL
- Arm/WingR
- LegL
- LegR
- Tail/Hair/Accessory (when relevant)

## Transform origins
Every articulated part must have a deliberate pivot.
Do not rely on one transform applied to the whole character for actions.

## State model
Separate:
- expression
- action
- gaze
- facing
- pose blend
- procedural offsets

Example interface conceptually:
- expression: neutral | happy | sad | surprised | focused
- action: idle | look | wave | walk | takeoff | fly | land | react
- gaze: x/y target or symbolic direction

## Pose blending
Do not crossfade two full characters to simulate a pose change.
Interpolate transforms and shape parameters between poses.

## Reusability
Rigs should support new characters by swapping art geometry while preserving common motion APIs where practical.
