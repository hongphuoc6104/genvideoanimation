/**
 * tests/invariants/timeline-narration-adaptation.test.ts
 *
 * Dynamic Timeline & Narration Adaptation Verification Suite
 * Verifies that when narration length changes, beat choreography and phase
 * transitions adapt dynamically without modifying any TSX scene files.
 */

import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  calculateBeatChoreography,
  ShotBeat,
} from '../../motion-kit/src/cues/beatChoreography';

function runTimelineAdaptationTests() {
  console.log('🧪 Running Dynamic Timeline Narration Adaptation Suite...');
  let totalAssertions = 0;

  // =========================================================================
  // 1. Synthetic Narration Duration Change Test
  // =========================================================================
  console.log('  Testing dynamic adaptation to altered narration lengths...');
  {
    // Baseline scenario: 3 beats (e.g., standard speed narration)
    const baselineBeats: ShotBeat[] = [
      { beatId: 1, startFrame: 0, endFrame: 100, durationInFrames: 100, text: 'Beat 1 baseline' },
      { beatId: 2, startFrame: 100, endFrame: 220, durationInFrames: 120, text: 'Beat 2 baseline' },
      { beatId: 3, startFrame: 220, endFrame: 350, durationInFrames: 130, text: 'Beat 3 baseline' },
    ];

    // Frame 50 in baseline: middle of beat 1
    const baseAt50 = calculateBeatChoreography(baselineBeats, 50, 350);
    assert.strictEqual(baseAt50.currentBeatIndex, 0);
    assert.strictEqual(baseAt50.phase, 1);
    assert.strictEqual(baseAt50.beatProgress, 0.5);
    totalAssertions += 3;

    // Frame 160 in baseline: middle of beat 2
    const baseAt160 = calculateBeatChoreography(baselineBeats, 160, 350);
    assert.strictEqual(baseAt160.currentBeatIndex, 1);
    assert.strictEqual(baseAt160.phase, 2);
    assert.strictEqual(baseAt160.beatProgress, 0.5);
    totalAssertions += 3;

    // Now narration for Beat 1 is lengthened (e.g., speaker elaborated or paused)
    // Beat 1 becomes 180 frames long, shifting Beat 2 and 3 downstream
    const lengthenedBeats: ShotBeat[] = [
      { beatId: 1, startFrame: 0, endFrame: 180, durationInFrames: 180, text: 'Beat 1 lengthened explanation' },
      { beatId: 2, startFrame: 180, endFrame: 320, durationInFrames: 140, text: 'Beat 2 shifted downstream' },
      { beatId: 3, startFrame: 320, endFrame: 500, durationInFrames: 180, text: 'Beat 3 concluding' },
    ];

    // Same frame 160: In baseline this was Phase 2, but now because narration is longer,
    // it MUST dynamically stay in Phase 1 without ANY change to component TSX!
    const adaptedAt160 = calculateBeatChoreography(lengthenedBeats, 160, 500);
    assert.strictEqual(
      adaptedAt160.currentBeatIndex,
      0,
      'Frame 160 must remain in Beat 1 when narration is expanded'
    );
    assert.strictEqual(adaptedAt160.phase, 1);
    assert.ok(
      Math.abs(adaptedAt160.beatProgress - 160 / 180) < 1e-6,
      'Beat progress must accurately reflect new lengthened duration'
    );
    totalAssertions += 3;

    // And phase 2 now occurs at frame 250 (midpoint of adapted beat 2)
    const adaptedAt250 = calculateBeatChoreography(lengthenedBeats, 250, 500);
    assert.strictEqual(adaptedAt250.currentBeatIndex, 1);
    assert.strictEqual(adaptedAt250.phase, 2);
    assert.strictEqual(adaptedAt250.beatProgress, 0.5);
    totalAssertions += 3;

    // Phase 3 midpoint at frame 410
    const adaptedAt410 = calculateBeatChoreography(lengthenedBeats, 410, 500);
    assert.strictEqual(adaptedAt410.currentBeatIndex, 2);
    assert.strictEqual(adaptedAt410.phase, 3);
    assert.strictEqual(adaptedAt410.beatProgress, 0.5);
    totalAssertions += 3;
  }
  console.log('    ✓ Dynamic beat timing and phase shifting verified.');

  // =========================================================================
  // 2. Real Project Timelines Integration Test
  // =========================================================================
  console.log('  Testing production semantic-timeline.json files across all 4 projects...');
  const timelines = [
    {
      name: 'Scopus Explainer',
      path: path.resolve(__dirname, '../../connection-film/src/legacy/scopus-explainer/semantic-timeline.json'),
    },
    {
      name: 'CRISPR-Cas9',
      path: path.resolve(__dirname, '../../connection-film/src/legacy/crispr/semantic-timeline.json'),
    },
    {
      name: 'Steam Engine',
      path: path.resolve(__dirname, '../../connection-film/src/legacy/steam-engine/semantic-timeline.json'),
    },
    {
      name: 'Git DAG',
      path: path.resolve(__dirname, '../../connection-film/src/legacy/git-dag/semantic-timeline.json'),
    },
  ];

  for (const t of timelines) {
    assert.ok(fs.existsSync(t.path), `Timeline file must exist: ${t.path}`);
    const data = JSON.parse(fs.readFileSync(t.path, 'utf8'));

    assert.ok(Array.isArray(data.beats), `[${t.name}] beats array must exist`);
    assert.ok(data.beats.length > 0, `[${t.name}] beats must not be empty`);

    // Group beats by shotId
    const beatsByShot = new Map<string, any[]>();
    for (const b of data.beats) {
      const shotId = b.shotId || 'shot_01';
      if (!beatsByShot.has(shotId)) {
        beatsByShot.set(shotId, []);
      }
      beatsByShot.get(shotId)!.push(b);
    }

    assert.ok(beatsByShot.size > 0, `[${t.name}] must have at least 1 shot group`);

    for (const [shotId, shotBeats] of beatsByShot.entries()) {
      assert.ok(shotBeats.length > 0, `[${t.name}] shot ${shotId} must have beats`);

      const shotStart = shotBeats[0].startFrame;
      const shotEnd = shotBeats[shotBeats.length - 1].endFrame;
      const shotDuration = shotEnd - shotStart;

      for (let bi = 0; bi < shotBeats.length; bi++) {
        const beat = shotBeats[bi];
        assert.ok(beat.id, `Beat must have id`);
        const duration = beat.endFrame - beat.startFrame;
        assert.ok(duration > 0, `Beat duration must be > 0 (got ${duration})`);

        // Test running choreography helper on this real beat's frames (relative to shot)
        const relMidFrame = (beat.startFrame - shotStart) + Math.floor(duration / 2);
        const choreo = calculateBeatChoreography(shotBeats, relMidFrame, shotDuration);
        assert.strictEqual(choreo.currentBeatIndex, bi, `Choreography at relMidFrame must resolve to beat ${bi}`);
        assert.ok(choreo.beatProgress >= 0 && choreo.beatProgress <= 1.0, `beatProgress must be within [0, 1]`);
        totalAssertions += 3;
      }
    }
  }
  console.log('    ✓ All 4 production semantic-timeline.json files validated cleanly.');

  console.log(`\n🎉 All ${totalAssertions} Timeline Narration Adaptation checks passed!`);
}

runTimelineAdaptationTests();
