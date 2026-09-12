# Evidence: anti-slide root-cause audit — 2026-09-12

This is an audit of specific source paths and existing media, not production certification. No production source was edited by this audit. Other work was modifying the working tree concurrently. `evidence.json` records HEAD, the reviewed video hash, and hashes of the principal source files. Those hashes identify what was inspected; they do not prove the MP4 was rendered from that exact source snapshot.

## Directly reproduced

- Scopus preview SHA-256: `e0c6a08754a590aa6afe0db0bf15023baaa98e12238e8823c14e49a702f3dd4e`.
- Three fresh FFmpeg extractions: beat 11 frame 1369 (45.633s), beat 12 frame 1497 (49.900s), beat 13 frame 1633 (54.433s).
- These frames show the same funnel with successive highlighted levels and a prose detail card. The midpoint of beat 12 does not show the radar/orthogonal knowledge matrix declared by its timeline contract.
- Source independently explains this: `Scene3ProcessFunnel.tsx:21-45` mounts `ResearchFunnelMechanism` for all three beats, passing only the active level index. The component's three particle positions repeat modulo 540 (`ResearchFunnelMechanism.tsx:45,97-99`); they are not selected, rejected, clustered or otherwise changed by a filtering condition. Level selection changes presentation and the detail card (`:118-199`).
- Visual semantics CLI: 5 scene files, 0 violations, exit 0. The separate funnel component also yields 0 violations, exit 0.
- Fresh media rubric: 103 sampled frames, 23 contracts validated, overall 4.84, PASS. Its own report flags card grids at 13 sample times (44 through 56 seconds inclusive), assigning the card criterion 1/5 at each. `criticalViolations` contains 103 entries; this is a count of messages, not unique defects or bad frames.
- A controlled static-scene experiment is saved under `fixtures/projects/`: the baseline containing two static spans fails with two critical findings (exit 1); an otherwise identical file with a single decorative SVG rectangle passes (exit 0). Neither file uses frame hooks, animation or a mechanism component. `fixture-results.json` preserves commands and outputs. Both paths contain `/projects/`, so active-project rules apply. The validator DOES count `span` as text; the bypass occurs because `svg` plus `rect` count as two visual primitives, satisfying its heuristic.

## Reproduction

Run from repository root:

```bash
npx tsx validators/validate-visual-semantics.ts connection-film/src/projects/scopus-research-gap/scenes
npx tsx validators/validate-visual-semantics.ts connection-film/src/projects/scopus-research-gap/components/ResearchFunnelMechanism.tsx
npx tsx validators/validate-preview-rubric.ts out/scopus-research-gap-preview-360x640.mp4 --timeline connection-film/src/projects/scopus-research-gap/semantic-timeline.json --output /tmp/scopus-rubric-recheck.json
ffmpeg -v error -i out/scopus-research-gap-preview-360x640.mp4 -vf 'select=eq(n\,1497)' -frames:v 1 /tmp/scopus-beat12-recheck.png
```

## What the source supports

1. Anti-slide intent exists: SKILL.md:13-24. Motion grammar exists in references/motion-grammar.md. It is inaccurate to call the method absent.
2. The specific Scopus implementation fails to preserve beat 12's declared visual mechanism and renders prohibited prose outside captions. This is stronger evidence than a subjective label such as "looks like a slide".
3. Contract validation in validate-preview-rubric.ts:483-507 checks strings, not correspondence with rendered mechanisms.
4. The visual AST gate counts SVG primitives and recognizes component suffixes; its TEXT_TAGS omit SVG text. The production runner supplies scenes/, not an import-resolved component graph.
5. The media rubric detects card contours, but its pass decision uses averages and does not veto every frame-level violation. Contract errors do veto pass; it would be wrong to say it ignores every kind of critical error.
6. The runner writes a fixed score of 4.87 and an independent reviewer identity after child commands succeed. It does not actually run or authenticate such a reviewer.
7. The runner has no required approved animatic artifact or semantic review receipt. This does not prove nobody reviewed an animatic outside this runner.

## Counterevidence and limits

- A card or dimming is not inherently wrong. The documented salience pattern can serve valid diagrams. The observed defect is prose carrying the explanation and a declared mechanism absent from the corresponding implementation.
- Pump scene code uses beat progress to deform the aperture and move ions. It is false to generalize that every project consists only of static cards. This source observation is not a scientific or aesthetic certification of the pump video.
- Clean-room instructions restrict reading to SKILL.md and templates, while references contain more motion guidance. This is a documented information-routing gap; whether it caused a particular agent decision has not been established.
- No audience comprehension experiment or direct comparison against particular Kurzgesagt videos was performed. No numerical similarity or viewer-comprehension score is claimed.
- Minimal adversarial fixture passes, if present in this directory, demonstrate a specific validator blind spot, not a full production gate pass.
