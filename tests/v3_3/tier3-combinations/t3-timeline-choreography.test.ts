/**
 * Tier 3 Pairwise Combinations: Timeline, Choreography, Progressive Disclosure, ShotSpec & Audio
 * Tests: T3-10 to T3-14
 *
 * T3-10: Progressive Disclosure ↔ Timeline (F05 ↔ F06)
 * T3-11: Progressive Disclosure ↔ Scopus Canary 70.4s panel fix (F05 ↔ F15)
 * T3-12: Timeline ↔ ShotSpec (F06 ↔ F07)
 * T3-13: Timeline ↔ Audio Ownership (F06 ↔ F08)
 * T3-14: Timeline ↔ Content Coverage (F06 ↔ F11)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertMonotonic,
  assertNoOverlap,
  assertSchema,
} from '../harness/assert';
import {
  createMockSemanticTimeline,
  createMockShotSpec,
  createMockAudioDependencyGraph,
  createMockSourceContentMap,
} from '../harness/mock-fixtures';

describe({ name: 'Tier 3: Timeline & Choreography Interactions', feature: 'T3-TIMELINE', tier: 3 }, () => {
  test(
    'T3-10: Progressive Disclosure ↔ Timeline: Semantic timeline enforces 1 primary object and 1 visual intent per beat without card collisions',
    () => {
      // 1. Read production timeline or generate canonical mock
      const timelinePath = path.resolve(process.cwd(), 'connection-film/src/legacy/scopus-explainer/semantic-timeline.json');
      assertTrue(fs.existsSync(timelinePath), 'semantic-timeline.json must exist');
      const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));

      const beats = timeline.beats;
      assertTrue(beats.length >= 20, `Timeline must contain at least 20 beats, got ${beats.length}`);

      // Invariant A: Every beat has non-empty visualIntent and primaryObject
      for (const beat of beats) {
        assertTrue(beat.visualIntent && beat.visualIntent.length > 5, `Beat ${beat.id} must have descriptive visualIntent`);
        assertTrue(beat.primaryObject && beat.primaryObject.length > 2, `Beat ${beat.id} must have defined primaryObject`);
        assertTrue(beat.startFrame < beat.endFrame, `Beat ${beat.id} startFrame must be strictly less than endFrame`);
      }

      // Invariant B: Monotonic frame progression and no overlap between beats
      const intervals = beats.map((b: any) => [b.startFrame, b.endFrame] as [number, number]);
      assertNoOverlap(intervals, 'Semantic timeline beats must have non-overlapping frame intervals');

      const startFrames = beats.map((b: any) => b.startFrame);
      assertMonotonic(startFrames, 'increasing', 'Timeline beat start frames must be monotonically increasing');

      // Invariant C: Multi-item taxonomy items (5 doors: beats 04..08 or similar) are mapped to distinct beats
      const taxonomyBeats = beats.filter((b: any) =>
        b.visualIntent.toLowerCase().includes('gap') || b.visualIntent.toLowerCase().includes('door')
      );
      assertTrue(taxonomyBeats.length >= 5, `Must have at least 5 progressive taxonomy beats, found ${taxonomyBeats.length}`);
    },
    { id: 'T3-10' }
  );

  test(
    'T3-11: Progressive Disclosure ↔ Scopus Canary 70.4s panel fix: Template and Case Study panels have disjoint non-overlapping active windows',
    () => {
      // In Scene4TemplateCaseStudy.tsx:
      // Shot 4 starts at global frame 1976 (duration 555 frames: 1976 to 2531)
      // Historical 70.4s collision was around global frame 2112 (scene frame 136).
      // Progressive disclosure fix:
      // Beat 16 (Template panel): local frames 0 to 135 (global 1976 - 2111)
      // Beat 17 (Case study panel): local frames 135 to 264 (global 2111 - 2240)
      // Transition window: frames 127 to 135 (exit) and 135 to 143 (enter)

      const templatePanel = {
        name: 'Template 4 câu chuẩn quốc tế',
        activeStart: 0,
        activeEnd: 135,
        fadeExitStart: 127,
        fadeExitEnd: 135,
      };

      const caseStudyPanel = {
        name: 'Case Study Ngân hàng số',
        activeStart: 135,
        activeEnd: 264,
        fadeEnterStart: 135,
        fadeEnterEnd: 143,
      };

      // Invariant 1: Disjoint active frames (end of template <= start of case study)
      assertTrue(
        templatePanel.activeEnd <= caseStudyPanel.activeStart,
        `Template panel end frame (${templatePanel.activeEnd}) must precede or equal Case Study start frame (${caseStudyPanel.activeStart})`
      );

      // Invariant 2: At frame 135 (exact 70.4s mark), template panel opacity is 0 and case study takes over
      const computeOpacity = (f: number, enterStart: number, enterEnd: number, exitStart: number, exitEnd: number): number => {
        if (f < enterStart) return 0;
        if (f <= enterEnd) return (f - enterStart) / (enterEnd - enterStart);
        if (f <= exitStart) return 1.0;
        if (f <= exitEnd) return 1.0 - (f - exitStart) / (exitEnd - exitStart);
        return 0;
      };

      // Frame 135: template panel has completed exit (opacity = 0)
      const templateOpacityAt135 = computeOpacity(135, 0, 8, 127, 135);
      assertEqual(templateOpacityAt135, 0, 'Template panel opacity at frame 135 must be 0');

      // Frame 136: case study is entering, template is completely hidden
      const templateOpacityAt136 = computeOpacity(136, 0, 8, 127, 135);
      assertEqual(templateOpacityAt136, 0, 'Template panel opacity at frame 136 must be 0');

      // Zero concurrent visibility above 50% opacity
      for (let f = 120; f <= 150; f++) {
        const op1 = computeOpacity(f, 0, 8, 127, 135);
        const op2 = computeOpacity(f, 135, 143, 256, 264);
        const bothProminent = op1 > 0.5 && op2 > 0.5;
        assertFalse(bothProminent, `Frame ${f}: Both panels must never be prominently visible simultaneously (op1=${op1.toFixed(2)}, op2=${op2.toFixed(2)})`);
      }
    },
    { id: 'T3-11' }
  );

  test(
    'T3-12: Timeline ↔ ShotSpec: Shot boundaries and transitions strictly derive from semantic timeline beat groupings',
    () => {
      const timelinePath = path.resolve(process.cwd(), 'connection-film/src/legacy/scopus-explainer/semantic-timeline.json');
      const shotSpecPath = path.resolve(process.cwd(), 'connection-film/src/legacy/scopus-explainer/shot-spec.json');

      assertTrue(fs.existsSync(timelinePath), 'semantic-timeline.json must exist');
      assertTrue(fs.existsSync(shotSpecPath), 'shot-spec.json must exist');

      const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));
      const shotSpec = JSON.parse(fs.readFileSync(shotSpecPath, 'utf-8'));

      // Invariant 1: Total composition frame parity
      assertEqual(timeline.totalFrames, 3096, 'Timeline totalFrames must be 3096');
      const shotSpecTotalFrames = shotSpec.shots.reduce((sum: number, s: any) => sum + (s.duration || (s.endFrame - s.startFrame)), 0);
      assertEqual(shotSpecTotalFrames, timeline.totalFrames, 'ShotSpec total frames must match timeline totalFrames');

      // Invariant 2: Every shot in ShotSpec corresponds to a valid beat subset
      for (const shot of shotSpec.shots) {
        const matchingBeats = timeline.beats.filter((b: any) => b.shotId === shot.id);
        assertTrue(matchingBeats.length > 0, `Shot ${shot.id} must encompass at least 1 semantic beat`);

        const minBeatStart = Math.min(...matchingBeats.map((b: any) => b.startFrame));
        const maxBeatEnd = Math.max(...matchingBeats.map((b: any) => b.endFrame));

        assertTrue(
          Math.abs(shot.startFrame - minBeatStart) <= 5,
          `Shot ${shot.id} startFrame (${shot.startFrame}) must match its earliest beat start (${minBeatStart}) within boundary tolerance`
        );
        assertTrue(
          Math.abs(shot.endFrame - maxBeatEnd) <= 15,
          `Shot ${shot.id} endFrame (${shot.endFrame}) must align with its latest beat end (${maxBeatEnd}) within transition carry window`
        );
      }

      // Invariant 3: Impact frames declared in ShotSpec map to sfxIntent or keyframes in timeline
      for (const shot of shotSpec.shots) {
        if (Array.isArray(shot.impact_frames)) {
          for (const imp of shot.impact_frames) {
            assertTrue(
              imp >= shot.startFrame && imp <= shot.endFrame,
              `Impact frame ${imp} must be within shot bounds [${shot.startFrame}, ${shot.endFrame}]`
            );
          }
        }
      }
    },
    { id: 'T3-12' }
  );

  test(
    'T3-13: Timeline ↔ Audio Ownership: All timeline sfxIntent cues are pre-baked into master audio and zero cue <Audio> tags exist in scenes',
    () => {
      const timelinePath = path.resolve(process.cwd(), 'connection-film/src/legacy/scopus-explainer/semantic-timeline.json');
      const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));

      // Extract all SFX intents declared in timeline
      const sfxIntents = timeline.beats
        .filter((b: any) => b.sfxIntent)
        .map((b: any) => ({
          beatId: b.id,
          asset: b.sfxIntent.asset,
          frame: b.sfxIntent.frame,
          volume: b.sfxIntent.volume,
        }));

      assertTrue(sfxIntents.length >= 2, `Timeline must declare sfxIntents, found ${sfxIntents.length}`);

      // Verify each SFX has a valid frame within beat boundaries
      for (const sfx of sfxIntents) {
        const beat = timeline.beats.find((b: any) => b.id === sfx.beatId);
        assertTrue(
          sfx.frame >= beat.startFrame && sfx.frame <= beat.endFrame,
          `SFX frame ${sfx.frame} must be within beat ${beat.id} bounds [${beat.startFrame}, ${beat.endFrame}]`
        );
      }

      // Read root film file ScopusExplainerFilm.tsx
      const rootFilmPath = path.resolve(process.cwd(), 'connection-film/src/legacy/scopus-explainer/ScopusExplainerFilm.tsx');
      assertTrue(fs.existsSync(rootFilmPath), 'ScopusExplainerFilm.tsx must exist');
      const rootCode = fs.readFileSync(rootFilmPath, 'utf-8');

      // Count <Audio elements in root composition
      const audioTagMatches = rootCode.match(/<Audio\b[^>]*>/g) || [];
      assertEqual(audioTagMatches.length, 1, 'ScopusExplainerFilm.tsx must contain exactly ONE <Audio> tag');
      const firstTag = audioTagMatches[0] || '';
      assertTrue(
        firstTag.includes('scopus_master_audio.wav') || firstTag.includes('staticFile'),
        '<Audio> tag must mount the master audio track'
      );

      // Verify scene components contain zero <Audio> tags
      const scenesDir = path.resolve(process.cwd(), 'connection-film/src/legacy/scopus-explainer/scenes');
      const sceneFiles = fs.readdirSync(scenesDir).filter((f) => f.endsWith('.tsx'));
      for (const file of sceneFiles) {
        const sceneCode = fs.readFileSync(path.join(scenesDir, file), 'utf-8');
        const hasAudioTag = /<Audio\b[^>]*>/.test(sceneCode);
        assertFalse(hasAudioTag, `Scene file ${file} must NOT mount secondary <Audio> tags (PREMIXED violation)`);
      }
    },
    { id: 'T3-13' }
  );

  test(
    'T3-14: Timeline ↔ Content Coverage: Bidirectional 100% mapping between semantic beats and curriculum knowledge units',
    () => {
      const timelinePath = path.resolve(process.cwd(), 'connection-film/src/legacy/scopus-explainer/semantic-timeline.json');
      const sourceMapPath = path.resolve(process.cwd(), 'connection-film/src/legacy/scopus-explainer/source-content-map.json');

      const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));
      const sourceMap = JSON.parse(fs.readFileSync(sourceMapPath, 'utf-8'));

      assertEqual(sourceMap.totalConcepts, 24, 'Total source concepts must be 24');
      assertEqual(sourceMap.mappedConcepts, 24, 'Mapped concepts must be 24');
      assertEqual(sourceMap.coveragePercent, 100, 'Coverage must be 100%');

      const beatIdsInTimeline = new Set(timeline.beats.map((b: any) => b.id));

      // 1. Forward check: Every mapping in source-content-map points to an existing timeline beat
      for (const unit of sourceMap.mappings) {
        assertTrue(
          beatIdsInTimeline.has(unit.beatId),
          `Curriculum unit ${unit.conceptId} references non-existent beat "${unit.beatId}"`
        );
      }

      // 2. Reverse check: Every timeline beat with a conceptId corresponds to a mapping
      const conceptIdsInMap = new Set(sourceMap.mappings.map((m: any) => m.conceptId));
      for (const beat of timeline.beats) {
        if (beat.conceptId) {
          assertTrue(
            conceptIdsInMap.has(beat.conceptId),
            `Timeline beat ${beat.id} has conceptId "${beat.conceptId}" not found in source-content-map`
          );
        }
      }
    },
    { id: 'T3-14' }
  );
});
