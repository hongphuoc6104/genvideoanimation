# Anti-Pattern Checklist

Reject or revise if any critical item is present.

## Critical
- Full character is one monolithic SVG group for all actions
- Pose transition implemented by crossfading two complete character instances
- Flying/walking character implemented primarily as translate(x,y)
- Meaningful action has no anticipation or settle where physically/expressively expected
- Every scene transition is fade/crossfade
- Adjacent shots do not share continuity state
- Implementation agent invented shot timing without a motion spec
- Render was not watched before declaring completion

## Major
- Global slow zoom used throughout as default camera behavior
- Math.sin bobbing used as substitute for acting
- All body parts start/end motion together
- Eye/head/body direction changes on same frame
- Audio cues use unrelated timing constants from animation
- Repeated identical scene layouts across many generated videos
- Excessive simultaneous movement reduces readability

## Minor
- Decorative particles without narrative purpose
- Too many colors in one shot
- unnecessary outlines/detail
- text used where a visual metaphor would communicate better
