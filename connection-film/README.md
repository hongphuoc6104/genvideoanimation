# Một kết nối nhỏ

An original 15-second vector animation inspired by the visual language of colorful educational explainers. Artwork and music are created for this demo; this is not an official Kurzgesagt production.

## Output
1920 × 1080, 30 fps, 450 frames, 15 seconds, H.264 MP4 with original stereo music and sound effects. Vietnamese on-screen copy; no voice-over.

## Run
```sh
npm ci
npm run studio
npm run render
```
If Chromium is unavailable, let Remotion download its supported browser or provide `--browser-executable=/path/to/chrome`.

## Story
- 0–5 seconds: a small bird in a big city.
- 5–10 seconds: a greeting becomes a connection.
- 10–15 seconds: connections expand around a shared world.

## Source
`src/Art.tsx`: original vector illustration and character components.
`src/Film.tsx`: frame-driven animation and composition.
`make_audio.py`: original synthesized soundtrack generation.
`public/soundtrack.wav`: ready-to-use soundtrack.

To regenerate audio, run the Python script with numpy and scipy installed.

## Offline SVG renderer
The delivered MP4 was generated from the same frame-driven React artwork using React server rendering + resvg, then encoded with FFmpeg. This avoids a host restriction on local server/socket creation that prevented the standard Remotion CLI renderer from starting in the creation environment.

```sh
node --import tsx render-frames.tsx frames
ffmpeg -framerate 30 -i frames/%04d.png -i public/soundtrack.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -t 15 -movflags +faststart out/connection-15s.mp4
```

`Film` is the standard Remotion composition wrapper. `FilmFrame({frame})` is the same artwork exposed as a pure component for offline rendering. The offline renderer is appropriate for this SVG-only film; it is not a general replacement for browser rendering of arbitrary Remotion projects.
