# Regression review: fe5c700 → 00cc615

Read-only production investigation. No production code changed, no acceptance certificate issued. Luna subagents hit usage limits; findings below were verified by primary reviewer through code and decoded MP4 frames. Not a continuous 1× audiovisual review. Canonical gate was not rerun for this revision.

## Confirmed regressions

1. Caption wrapping changed from nowrap to wrap without resegmenting existing sentence-long caption groups. Steam still has a fixed box at y=1560, height=200; long paragraphs now extend below the 1920 canvas. This changes horizontal overflow into vertical overflow. `packages/caption-kit/src/KaraokeLine.tsx:20`; `connection-film/src/generalization/steam-engine/subtitles/captions.json:6`. Evidence: steam-engine-48.png.
2. Steam summary box was removed from normal flex flow and replaced with an absolute badge at y=1200. The parent remains column/space-between; the visual is now the last normal-flow child and moves downward into the badge/caption region. `Scene1PreIndustrial.tsx:48`, `:216`; similar scenes 2/4. Evidence: steam-engine-32.png.
3. Git/CRISPR custom captions were replaced by the shared caption renderer, whose default fixed rectangle is y=1410, height=220. It does not account for scene subjects and long text. Git's formerly separate caption panel is now closer to existing labels; larger sentence blocks remain. Shared rendering is a sound direction, but schema conversion is not layout adaptation. `packages/caption-kit/src/utils.ts:74-110`.
4. Timeline helper is introduced, but only some scenes consume it. Steam Scene1/2/4 still hardcode phase thresholds, despite wrapper passing shotBeats. CRISPR Scene3 maps phase ordinal to old visual meanings: phase1 activation, phase2 cut, phase3 alarm; actual beats7–9 are R-loop, activation, cut. This is a semantic mismatch, not merely wrong duration. `crispr/scenes/Scene3DualCleavage.tsx:22-37`.
5. New factual ledgers have not propagated to spoken output. `git diff --name-only fe5c700 -- connection-film/public/audio connection-film/src/generalization/*/audio connection-film/src/generalization/*/semantic-timeline.json connection-film/src/generalization/*/subtitles` produces no changes. The original narration/caption claims remain in the newly rendered movies. Corrected ledger text alone cannot correct speech.
6. Canonical media gates still target Scopus (`scripts/run-v3_3-gate.ts` G14–G16). Generalization validator still lacks MP4/preview inspection. Summary prints fixed claims such as “4/4 Projects Verified”, “290/290”, “192/192”; these are console literals, not report values derived from all corresponding artifacts.

## What should be retained

Shared caption pipeline, pure timeline helper, extracted mechanism state functions used by rendered components, and punctuation/aligner filtering are useful architectural directions. Their integration and visual acceptance remain incomplete. GPU/NVENC does not explain the observed geometric repositioning or sentence overflow; these are directly accounted for by layout code changes. Do not blanket-revert all improvements.

## Highest-leverage correction

Stop expanding infrastructure for the next iteration. Build a small before/after acceptance set at fixed timestamps and short continuous clips. Fix shared caption segmentation and whole-scene layout together; use explicit beat identity/events instead of ordinal phase assumptions. Make source narration corrections propagate through audio/alignment/render. Only then compare a short visual explanation against the intended direction before generalizing it across all films. User's objective remains a reusable skill, not a perfect isolated video; the short clip is a calibration artifact from which reusable rules and examples are extracted.
