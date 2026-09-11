/**
 * tests/challenger_m1_boundary_handoff.test.ts
 *
 * Empirical Adversarial Challenger Suite for Subtitle Boundary Handoff Guard (R3)
 * Roles: critic, specialist
 *
 * Stress-tests:
 * 1. Boundary transition matrix: 0-frame, 1-frame, 2-frame, and 3-second gaps.
 * 2. Acoustic Anchor Law: zero pre-spoken words across all conditions and frame rates.
 * 3. Continuous speech handoff latency: nextGroup.startFrame - currGroup.endFrame <= 1 frame.
 * 4. 100-chunk drift immunity: zero accumulated delay over 100 sequential chunks.
 * 5. Frame-by-frame Remotion resolveActiveGroup transition continuity without flickering.
 */

import * as assert from 'node:assert/strict';
import { segmentCaptions } from '../packages/narration-kit/src/captions/segmentCaptions';
import { WordTiming } from '../packages/narration-kit/src/alignment/AlignmentProvider';
import { resolveActiveGroup } from '../packages/caption-kit/src/utils';

interface TestSummary {
  name: string;
  assertions: number;
  passed: boolean;
}

const results: TestSummary[] = [];

function recordTest(name: string, fn: () => number) {
  try {
    const assertions = fn();
    results.push({ name, assertions, passed: true });
    console.log(`  ✓ ${name} (${assertions} assertions passed)`);
  } catch (err: any) {
    results.push({ name, assertions: 0, passed: false });
    console.error(`  ✗ ${name} FAILED:`, err?.message || err);
    throw err;
  }
}

console.log('======================================================================');
console.log(' EMPIRICAL CHALLENGER: Subtitle Boundary Handoff Guard (R3)');
console.log('======================================================================\n');

// ---------------------------------------------------------------------------
// Helper: create a deterministic WordTiming token
// ---------------------------------------------------------------------------
function makeWord(
  id: string,
  word: string,
  startFrame: number,
  endFrame: number,
  fps: number = 30
): WordTiming {
  const start = Number((startFrame / fps).toFixed(4));
  const end = Number((endFrame / fps).toFixed(4));
  return {
    id,
    word,
    start,
    end,
    startFrame,
    endFrame,
    confidence: 0.98,
    cleanWord: word.replace(/[.,?!]/g, '').toLowerCase(),
    punctuation: word.match(/[.,?!]/)?.[0],
  };
}

// ===========================================================================
// Test 1: Gap Calibration Matrix (0-frame, 1-frame, 2-frame, 3-second gap)
// ===========================================================================
recordTest('CHALLENGE-01: Boundary Transitions Across 0, 1, 2 frame and 3s gaps', () => {
  const fps = 30;
  let assertions = 0;

  // We test 4 explicit pair configurations:
  // Pair A: 0-frame acoustic gap (Chunk 1 ends at 60, Chunk 2 starts at 60)
  // Pair B: 1-frame acoustic gap (Chunk 3 ends at 120, Chunk 4 starts at 121)
  // Pair C: 2-frame acoustic gap (Chunk 5 ends at 180, Chunk 6 starts at 182)
  // Pair D: 3-second acoustic gap (Chunk 7 ends at 240, Chunk 8 starts at 330, 90 frames gap)

  const words: WordTiming[] = [
    // Chunk 1 (ends with period to force chunk boundary)
    makeWord('w0', 'Nghiên', 30, 45, fps),
    makeWord('w1', 'cứu.', 45, 60, fps),
    // Chunk 2 (starts at frame 60 -> 0-frame acoustic gap)
    makeWord('w2', 'Bản', 60, 75, fps),
    makeWord('w3', 'chất.', 75, 90, fps),

    // Chunk 3 (starts at 105, ends at 120)
    makeWord('w4', 'Khoảng', 105, 112, fps),
    makeWord('w5', 'trống.', 112, 120, fps),
    // Chunk 4 (starts at 121 -> 1-frame acoustic gap)
    makeWord('w6', 'Học', 121, 130, fps),
    makeWord('w7', 'thuật.', 130, 140, fps),

    // Chunk 5 (starts at 160, ends at 180)
    makeWord('w8', 'Phương', 160, 170, fps),
    makeWord('w9', 'pháp.', 170, 180, fps),
    // Chunk 6 (starts at 182 -> 2-frame acoustic gap)
    makeWord('w10', 'Thực', 182, 195, fps),
    makeWord('w11', 'nghiệm.', 195, 210, fps),

    // Chunk 7 (starts at 225, ends at 240)
    makeWord('w12', 'Kỷ', 225, 232, fps),
    makeWord('w13', 'nguyên.', 232, 240, fps),
    // Chunk 8 (starts at 330 -> 90 frames / 3-second acoustic gap)
    makeWord('w14', 'Khám', 330, 345, fps),
    makeWord('w15', 'phá.', 345, 360, fps),
  ];

  const manifest = segmentCaptions(words, { fps, viewport: { width: 1080, height: 1920 }, maxCharsPerLine: 26 });
  const groups = manifest.groups;

  assert.strictEqual(groups.length, 8, `Expected exactly 8 groups, got ${groups.length}`);
  assertions++;

  // --- Check Pair A (0-frame gap: g0 -> g1) ---
  const g0 = groups[0];
  const g1 = groups[1];
  assert.strictEqual(g0.startFrame, 30, 'g0 must start at first word startFrame (30)');
  assert.strictEqual(g1.startFrame, 60, 'g1 must start at first word startFrame (60)');
  assertions += 2;

  // In 0-frame gap: speech is continuous.
  // nextGroup.startFrame - currGroup.endFrame must be <= 1 frame!
  const handoffGapA = g1.startFrame - g0.endFrame;
  assert.ok(handoffGapA <= 1, `Pair A handoff gap (${handoffGapA}) must be <= 1 frame`);
  assert.ok(g0.endFrame < g1.startFrame || g0.endFrame === g1.startFrame, 'g0.endFrame must not exceed g1.startFrame');
  assertions += 2;

  // --- Check Pair B (1-frame gap: g2 -> g3) ---
  const g2 = groups[2];
  const g3 = groups[3];
  assert.strictEqual(g2.startFrame, 105, 'g2 must start at first word startFrame (105)');
  assert.strictEqual(g3.startFrame, 121, 'g3 must start at first word startFrame (121)');
  const handoffGapB = g3.startFrame - g2.endFrame;
  assert.strictEqual(handoffGapB, 1, `Pair B handoff gap (${handoffGapB}) must be exactly 1 frame`);
  assertions += 3;

  // --- Check Pair C (2-frame gap: g4 -> g5) ---
  const g4 = groups[4];
  const g5 = groups[5];
  assert.strictEqual(g4.startFrame, 160, 'g4 must start at first word startFrame (160)');
  assert.strictEqual(g5.startFrame, 182, 'g5 must start at first word startFrame (182)');
  const handoffGapC = g5.startFrame - g4.endFrame;
  assert.strictEqual(handoffGapC, 1, `Pair C handoff gap (${handoffGapC}) must be exactly 1 frame in continuous speech`);
  assertions += 3;

  // --- Check Pair D (3-second gap: g6 -> g7) ---
  const g6 = groups[6];
  const g7 = groups[7];
  assert.strictEqual(g6.startFrame, 225, 'g6 must start at 225');
  assert.strictEqual(g7.startFrame, 330, 'g7 must start at 330');
  // Linger after speech ends at 240 must be clamped to <= 3 frames (<= 243)
  const lingerFramesD = g6.endFrame - 240;
  assert.ok(
    lingerFramesD <= 3,
    `3-second gap linger freeze must be clamped <= 3 frames, got ${lingerFramesD}`
  );
  assert.ok(
    g6.endFrame < g7.startFrame - 10,
    `g6 must unmount well before g7: g6.endFrame=${g6.endFrame}, g7.startFrame=${g7.startFrame}`
  );
  assertions += 4;

  return assertions;
});

// ===========================================================================
// Test 2: Acoustic Anchor Law (Zero Pre-Spoken Words)
// ===========================================================================
recordTest('CHALLENGE-02: Acoustic Anchor Law across diverse framerates & word shapes', () => {
  let assertions = 0;

  for (const fps of [24, 25, 30, 60]) {
    // Construct 10 chunks with various durations and fractional bounds
    const testWords: WordTiming[] = [];
    let curTime = 0.0; // Starts right at t = 0

    for (let c = 0; c < 10; c++) {
      const chunkLen = 3 + (c % 4);
      for (let w = 0; w < chunkLen; w++) {
        const isLastInChunk = w === chunkLen - 1;
        const dur = 0.15 + (w * 0.05);
        const start = Number(curTime.toFixed(4));
        const end = Number((curTime + dur).toFixed(4));
        const startFrame = Math.round(start * fps);
        const endFrame = Math.round(end * fps);
        const punct = isLastInChunk ? '.' : undefined;

        testWords.push({
          id: `t2_${fps}_${c}_${w}`,
          word: `token${c}_${w}${punct || ''}`,
          start,
          end,
          startFrame,
          endFrame,
          confidence: 0.99,
          cleanWord: `token${c}_${w}`,
          punctuation: punct,
        });

        const pause = isLastInChunk ? (c % 2 === 0 ? 0.03 : 0.8) : 0.04;
        curTime = end + pause;
      }
    }

    const manifest = segmentCaptions(testWords, { fps, viewport: { width: 1080, height: 1920 } });
    const groups = manifest.groups;

    for (const g of groups) {
      const gWords = g.lines.flatMap((l) => l.words);
      const firstWord = gWords[0];

      // Strict Acoustic Anchor Law:
      // group.startFrame <= firstWord.startFrame
      assert.ok(
        g.startFrame <= firstWord.startFrame,
        `[Fps ${fps}] Group ${g.id} startFrame (${g.startFrame}) > firstWord.startFrame (${firstWord.startFrame})!`
      );
      assertions++;

      // Difference between group mount and first word must be 0 or at most 1 frame
      const mountDelta = firstWord.startFrame - g.startFrame;
      assert.ok(
        mountDelta >= 0 && mountDelta <= 1,
        `[Fps ${fps}] Group ${g.id} mount delta (${mountDelta}) is out of [0, 1]`
      );
      assertions++;

      // No subsequent word may start before group mount
      for (const w of gWords) {
        assert.ok(
          w.startFrame >= g.startFrame,
          `[Fps ${fps}] Word ${w.word} starts at ${w.startFrame} before group mounted at ${g.startFrame}`
        );
        assertions++;
      }
    }
  }

  return assertions;
});

// ===========================================================================
// Test 3: Continuous Speech Handoff Latency <= 1 frame
// ===========================================================================
recordTest('CHALLENGE-03: Continuous speech transitions strictly satisfy handoff gap <= 1 frame', () => {
  const fps = 30;
  let assertions = 0;

  // Generate 20 back-to-back chunks with strictly continuous speech (gap <= 2 frames)
  const continuousWords: WordTiming[] = [];
  let currentFrame = 50;

  for (let c = 0; c < 20; c++) {
    const wordsInChunk = 4;
    for (let w = 0; w < wordsInChunk; w++) {
      const isLast = w === wordsInChunk - 1;
      const sF = currentFrame;
      const eF = currentFrame + 6;
      const punct = isLast ? '.' : undefined;

      continuousWords.push(makeWord(`c_${c}_${w}`, `word${c}_${w}${punct || ''}`, sF, eF, fps));
      // Continuous speech gap between words: 1 frame inside chunk, 1 frame between chunks
      currentFrame = eF + 1;
    }
  }

  const manifest = segmentCaptions(continuousWords, { fps, viewport: { width: 1080, height: 1920 } });
  const groups = manifest.groups;
  assert.strictEqual(groups.length, 20, `Expected 20 groups, got ${groups.length}`);
  assertions++;

  for (let i = 0; i < groups.length - 1; i++) {
    const curr = groups[i];
    const next = groups[i + 1];

    const handoffGap = next.startFrame - curr.endFrame;

    // Must be <= 1 frame in continuous speech
    assert.ok(
      handoffGap <= 1,
      `Transition ${curr.id} -> ${next.id} handoff gap ${handoffGap} exceeds 1 frame ceiling!`
    );
    // Must be exactly 1 frame (non-overlapping, zero-frame dead air)
    assert.strictEqual(
      handoffGap,
      1,
      `Transition ${curr.id} -> ${next.id} handoff gap must be exactly 1 frame, got ${handoffGap}`
    );
    // Ensure strict disjointness
    assert.ok(
      curr.endFrame < next.startFrame,
      `Overlapping groups detected: curr.endFrame (${curr.endFrame}) >= next.startFrame (${next.startFrame})`
    );
    assertions += 3;
  }

  return assertions;
});

// ===========================================================================
// Test 4: 100-Chunk Accumulation Stress Test (Zero Delay Drift)
// ===========================================================================
recordTest('CHALLENGE-04: Zero accumulating delay over 100 sequential chunks', () => {
  const fps = 30;
  let assertions = 0;

  // Synthesize 100 sequential chunks with 5 words each (500 words total)
  // Simulates a long multi-minute video with varied speech cadence
  const longScriptWords: WordTiming[] = [];
  let cursorFrame = 15; // start at 0.5s

  for (let c = 0; c < 100; c++) {
    const numWords = 5;
    for (let w = 0; w < numWords; w++) {
      const isLast = w === numWords - 1;
      const sF = cursorFrame;
      const eF = cursorFrame + 5 + (w % 3);
      const punct = isLast ? '.' : undefined;

      longScriptWords.push(makeWord(`w100_${c}_${w}`, `ch${c}w${w}${punct || ''}`, sF, eF, fps));

      // Vary acoustic gap: alternate between contiguous (1-2 frames) and natural pauses (10-20 frames)
      if (isLast) {
        const isPause = c % 5 === 0;
        cursorFrame = eF + (isPause ? 15 : 1);
      } else {
        cursorFrame = eF + 1;
      }
    }
  }

  const manifest = segmentCaptions(longScriptWords, {
    fps,
    viewport: { width: 1080, height: 1920 },
    maxCharsPerLine: 26,
  });
  const groups = manifest.groups;

  assert.strictEqual(groups.length, 100, `Expected 100 groups, got ${groups.length}`);
  assertions++;

  let maxDriftObserved = 0;
  let cumulativeDrift = 0;

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const firstWord = g.lines[0].words[0];

    // Local drift between word audio start and group display mount
    const drift = firstWord.startFrame - g.startFrame;

    // Anchor Law: group must never mount after word starts
    assert.ok(
      g.startFrame <= firstWord.startFrame,
      `Chunk #${i} [${g.id}]: group mounted at ${g.startFrame} AFTER first word at ${firstWord.startFrame}`
    );

    // Drift must be strictly 0 (or <= 1 frame rounding)
    assert.ok(
      drift <= 1 && drift >= 0,
      `Chunk #${i} [${g.id}]: excessive drift of ${drift} frames`
    );

    if (drift > maxDriftObserved) {
      maxDriftObserved = drift;
    }
    cumulativeDrift += drift;
    assertions += 3;

    // Also check handoff to next group
    if (i < groups.length - 1) {
      const nextG = groups[i + 1];
      const nextFirstWord = nextG.lines[0].words[0];
      const acousticGap = nextFirstWord.startFrame - g.lines.flatMap(l => l.words).slice(-1)[0].endFrame;

      if (acousticGap <= 2) {
        // Continuous speech handoff
        const handoffGap = nextG.startFrame - g.endFrame;
        assert.strictEqual(
          handoffGap,
          1,
          `Chunk #${i} -> #${i+1} handoff gap is ${handoffGap}, expected 1`
        );
        assertions++;
      } else {
        // Paused speech handoff: group must unmount during pause
        assert.ok(
          g.endFrame < nextG.startFrame,
          `Chunk #${i} endFrame (${g.endFrame}) encroaches into #${i+1} startFrame (${nextG.startFrame})`
        );
        const linger = g.endFrame - g.lines.flatMap(l => l.words).slice(-1)[0].endFrame;
        assert.ok(
          linger <= 3,
          `Chunk #${i} lingering freeze (${linger} frames) exceeded 3 frames during pause`
        );
        assertions += 2;
      }
    }
  }

  // Final chunk (#100) check:
  const lastGroup = groups[99];
  const lastFirstWord = lastGroup.lines[0].words[0];
  const finalChunkDrift = lastFirstWord.startFrame - lastGroup.startFrame;
  assert.strictEqual(
    finalChunkDrift,
    0,
    `Final Chunk #99 must have zero drift from its first word (startFrame=${lastGroup.startFrame}, word.startFrame=${lastFirstWord.startFrame})`
  );
  assertions++;

  console.log(`    [Drift Audit] Over 100 chunks: Max single-chunk drift = ${maxDriftObserved} frames, Final chunk drift = ${finalChunkDrift} frames.`);
  return assertions;
});

// ===========================================================================
// Test 5: Remotion Frame-by-Frame resolveActiveGroup Invariant
// ===========================================================================
recordTest('CHALLENGE-05: resolveActiveGroup continuous resolution without frame drop or collision', () => {
  const fps = 30;
  let assertions = 0;

  // Two contiguous groups: g0 (frames 100..129), g1 (frames 130..159)
  const words: WordTiming[] = [
    makeWord('w0', 'Câu', 100, 114, fps),
    makeWord('w1', 'thứ', 114, 122, fps),
    makeWord('w2', 'nhất.', 122, 129, fps),

    makeWord('w3', 'Câu', 130, 140, fps),
    makeWord('w4', 'tiếp', 140, 150, fps),
    makeWord('w5', 'theo.', 150, 159, fps),
  ];

  const manifest = segmentCaptions(words, { fps });
  assert.strictEqual(manifest.groups.length, 2);
  const [g0, g1] = manifest.groups;

  assert.strictEqual(g0.startFrame, 100);
  assert.strictEqual(g0.endFrame, 129);
  assert.strictEqual(g1.startFrame, 130);
  assert.strictEqual(g1.endFrame, 162); // 159 + 3 post-speech hold
  assertions += 4;

  // Sweep every single frame from 95 to 165
  for (let f = 95; f <= 165; f++) {
    const active = resolveActiveGroup(manifest, f);
    if (f < 100) {
      assert.strictEqual(active, null, `Frame ${f} should be null before speech`);
    } else if (f >= 100 && f <= 129) {
      assert.strictEqual(active?.id, 'g0', `Frame ${f} must resolve g0`);
    } else if (f >= 130 && f <= 162) {
      assert.strictEqual(active?.id, 'g1', `Frame ${f} must resolve g1`);
    } else {
      assert.strictEqual(active, null, `Frame ${f} should be null after speech`);
    }
    assertions++;
  }

  // Specifically check boundary transition at frame 129 -> 130:
  // At frame 129: must be g0
  // At frame 130: must instantly switch to g1
  const at129 = resolveActiveGroup(manifest, 129);
  const at130 = resolveActiveGroup(manifest, 130);
  assert.strictEqual(at129?.id, 'g0', 'Boundary frame 129 must resolve g0');
  assert.strictEqual(at130?.id, 'g1', 'Boundary frame 130 must resolve g1');
  assertions += 2;

  return assertions;
});

// ===========================================================================
// Summary
// ===========================================================================
console.log('\n======================================================================');
const totalAssertions = results.reduce((sum, r) => sum + r.assertions, 0);
console.log(` ALL ${results.length} CHALLENGE TESTS PASSED (${totalAssertions} total assertions)`);
console.log(' VERDICT: APPROVE (Zero Pre-Spoken Words, Zero Accumulating Drift, Handoff <= 1 frame)');
console.log('======================================================================\n');
