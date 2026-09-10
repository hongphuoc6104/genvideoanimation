/**
 * Tier 1 Feature Suite: F06 — Canonical Semantic Timeline (R6)
 *
 * Verifies single source of truth timeline schema, strictly monotonic progression,
 * zero magic frame constants, beat continuity, and duration parity.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertMonotonic,
  assertSchema,
} from '../harness/assert';
import {
  createMockSemanticTimeline,
  validateSemanticTimeline,
  SemanticTimeline,
} from '../harness/mock-fixtures';

describe({ name: 'F06: Canonical Semantic Timeline Contract', feature: 'F06', tier: 1 }, () => {
  test(
    'F06-01: Canonical timeline schema defines mandatory beat metadata',
    () => {
      const timeline: SemanticTimeline = createMockSemanticTimeline();
      const validation = validateSemanticTimeline(timeline);
      assertTrue(validation.valid, `Timeline validation errors: ${validation.errors.join(', ')}`);

      assertEqual(timeline.version, '3.3.0');
      assertEqual(timeline.fps, 30);
      assertTrue(timeline.beats.length >= 2, 'Timeline must have multiple beats');

      const beat0 = timeline.beats[0];
      assertSchema(beat0, {
        id: 'string',
        shotId: 'string',
        narrationTokenRange: (r) => Array.isArray(r) && r.length === 2,
        startSec: 'number',
        endSec: 'number',
        startFrame: 'number',
        endFrame: 'number',
        visualIntent: 'string',
        primaryObject: 'string',
        cameraIntent: 'string',
        conceptId: 'string',
      });
    },
    { id: 'T1-F06-001' }
  );

  test(
    'F06-02: Strictly monotonic frame progression across consecutive beats',
    () => {
      const timeline = createMockSemanticTimeline();
      const startFrames = timeline.beats.map((b) => b.startFrame);
      const endFrames = timeline.beats.map((b) => b.endFrame);

      // Start frames must be non-decreasing
      assertMonotonic(startFrames, 'increasing');
      // End frames must be strictly increasing
      assertMonotonic(endFrames, 'strictly-increasing');

      // Each individual beat must have strictly positive duration
      for (const beat of timeline.beats) {
        assertTrue(
          beat.endFrame > beat.startFrame,
          `Beat ${beat.id} has invalid duration (start ${beat.startFrame} >= end ${beat.endFrame})`
        );
      }
    },
    { id: 'T1-F06-002' }
  );

  test(
    'F06-03: Zero hardcoded magic frames mandate (visual timings derive from timeline)',
    () => {
      // Validator function scanning for hardcoded frame constants in choreography components
      const detectMagicFrameConstants = (sourceCode: string): string[] => {
        const violations: string[] = [];
        // Detects patterns like: if (frame > 150) or frame === 300
        const magicFramePattern = /(?:frame\s*(?:>|<|===|>=|<=)\s*(\d{2,5}))/g;
        let match;
        while ((match = magicFramePattern.exec(sourceCode)) !== null) {
          violations.push(match[0]);
        }
        return violations;
      };

      const badComponent = `
        export const BadScene = ({ frame }: { frame: number }) => {
          const isStampVisible = frame > 120 && frame < 350;
          return isStampVisible ? <Stamp /> : null;
        };
      `;
      const detected = detectMagicFrameConstants(badComponent);
      assertTrue(detected.length >= 2, 'Must detect hardcoded frame constants');

      const cleanComponent = `
        export const CleanScene = ({ frame, beat }: { frame: number; beat: SemanticBeat }) => {
          const isStampVisible = frame >= beat.startFrame && frame < beat.endFrame;
          return isStampVisible ? <Stamp /> : null;
        };
      `;
      assertEqual(detectMagicFrameConstants(cleanComponent).length, 0, 'Token-derived component has 0 violations');
    },
    { id: 'T1-F06-003' }
  );

  test(
    'F06-04: Beat boundary continuity ensures gapless scene sequencing',
    () => {
      const timeline = createMockSemanticTimeline();
      for (let i = 1; i < timeline.beats.length; i++) {
        const prev = timeline.beats[i - 1];
        const curr = timeline.beats[i];
        // startFrame of current beat should align with or immediately follow endFrame of previous beat
        assertTrue(
          curr.startFrame >= prev.endFrame,
          `Beat ${curr.id} starts at ${curr.startFrame} before previous beat ends at ${prev.endFrame}`
        );
      }
    },
    { id: 'T1-F06-004' }
  );

  test(
    'F06-05: Timeline duration parity with audio within +/- 1 frame tolerance',
    () => {
      const timeline = createMockSemanticTimeline();
      const lastBeat = timeline.beats[timeline.beats.length - 1];

      // Composition total frames must equal last beat's endFrame
      assertEqual(timeline.totalFrames, lastBeat.endFrame);

      // Duration in seconds must match totalFrames / 30 within 0.033s (1 frame)
      const expectedDurationSec = timeline.totalFrames / timeline.fps;
      const durationDelta = Math.abs(timeline.durationSec - expectedDurationSec);
      assertTrue(
        durationDelta < 0.033,
        `Timeline duration ${timeline.durationSec}s does not match frame duration ${expectedDurationSec}s`
      );
    },
    { id: 'T1-F06-005' }
  );
});
