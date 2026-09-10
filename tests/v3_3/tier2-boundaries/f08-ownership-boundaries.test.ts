/**
 * Tier 2 Boundary Suite: F08 — Audio Ownership Boundaries (R8)
 *
 * Verifies 0 audio tags rejection, 2 audio tags rejection, commented-out tags,
 * conditional audio tags, and strategy validation.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
} from '../harness/assert';
import {
  createMockAudioDependencyGraph,
  validateAudioDependencyGraph,
} from '../harness/mock-fixtures';

describe({ name: 'F08-B: Audio Ownership Boundaries', feature: 'F08', tier: 2 }, () => {
  test(
    'F08-B01: Audio tag count 0 boundary triggers missing master audio failure',
    () => {
      const zeroMountGraph = createMockAudioDependencyGraph({
        remotionMounts: [],
      });
      const check = validateAudioDependencyGraph(zeroMountGraph);
      assertFalse(check.valid, 'Zero audio mounts must fail');
      assertTrue(check.errors[0].includes('exactly 1 master mount'));
    },
    { id: 'T2-F08-001' }
  );

  test(
    'F08-B02: Audio tag count 2 boundary triggers dual ownership failure',
    () => {
      const twoMountGraph = createMockAudioDependencyGraph({
        remotionMounts: [
          { file: 'Film.tsx', tag: '<Audio src="master.wav" />', line: 10 },
          { file: 'Film.tsx', tag: '<Audio src="sfx.wav" />', line: 20 },
        ],
      });
      const check = validateAudioDependencyGraph(twoMountGraph);
      assertFalse(check.valid, 'Two audio mounts must fail single ownership rule');
    },
    { id: 'T2-F08-002' }
  );

  test(
    'F08-B03: Commented-out JSX audio tag is ignored and not counted as duplicate mount',
    () => {
      const scanActiveAudioTags = (code: string): number => {
        // Strip multi-line and single-line JSX comments
        const cleanCode = code
          .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*/g, '');
        const matches = cleanCode.match(/<Audio\b[^>]*\/?>/g) || [];
        return matches.length;
      };

      const codeWithCommentedAudio = `
        export const Comp = () => (
          <div>
            {/* <Audio src="legacy_audio.wav" /> */}
            <Audio src={staticFile("audio/scopus_master_audio.wav")} />
          </div>
        );
      `;
      assertEqual(scanActiveAudioTags(codeWithCommentedAudio), 1, 'Must ignore commented-out Audio tag');
    },
    { id: 'T2-F08-003' }
  );

  test(
    'F08-B04: Conditional audio tag {hasAudio && <Audio />} is prohibited',
    () => {
      const detectConditionalAudioTags = (code: string): boolean => {
        // Enforces unconditional mounting of canonical master audio
        const conditionalPattern = /\{[^}]*&&\s*<Audio\b/;
        return conditionalPattern.test(code);
      };

      const badConditional = `
        export const Comp = ({ playAudio }: { playAudio: boolean }) => (
          <div>
            {playAudio && <Audio src="master.wav" />}
          </div>
        );
      `;
      assertTrue(detectConditionalAudioTags(badConditional), 'Must detect conditional audio tag');

      const cleanStatic = `
        export const Comp = () => (
          <div>
            <Audio src={staticFile("master.wav")} />
          </div>
        );
      `;
      assertFalse(detectConditionalAudioTags(cleanStatic));
    },
    { id: 'T2-F08-004' }
  );

  test(
    'F08-B05: Audio strategy string validation rejects non-PREMIXED values',
    () => {
      const invalidStrategies = ['DISCRETE', 'HYBRID', 'DIRECT', 'DYNAMIC'];
      for (const strat of invalidStrategies) {
        const graph = createMockAudioDependencyGraph({ strategy: strat as any });
        assertFalse(validateAudioDependencyGraph(graph).valid, `Strategy "${strat}" must be rejected`);
      }
    },
    { id: 'T2-F08-005' }
  );
});
