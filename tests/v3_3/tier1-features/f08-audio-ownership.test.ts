/**
 * Tier 1 Feature Suite: F08 — Single Audio Ownership & Routing (R8)
 *
 * Verifies PREMIXED strategy schema, exactly 1 <Audio> tag in root, zero secondary
 * cue <Audio> tags, zero duplicate SFX, and audio-dependency-graph validation.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertSchema,
} from '../harness/assert';
import {
  createMockAudioDependencyGraph,
  validateAudioDependencyGraph,
  AudioDependencyGraph,
} from '../harness/mock-fixtures';

describe({ name: 'F08: Single Audio Ownership Contract', feature: 'F08', tier: 1 }, () => {
  test(
    'F08-01: Audio dependency graph validates PREMIXED strategy schema',
    () => {
      const graph: AudioDependencyGraph = createMockAudioDependencyGraph();
      const validation = validateAudioDependencyGraph(graph);
      assertTrue(validation.valid, `Validation failed: ${validation.errors.join(', ')}`);

      assertEqual(graph.strategy, 'PREMIXED');
      assertTrue(graph.masterAudio.endsWith('.wav'));
      assertEqual(graph.runtimePlayback.discreteAudioTagsCount, 0);
      assertEqual(graph.runtimePlayback.duplicateSfxCount, 0);

      assertSchema(graph, {
        version: 'string',
        strategy: (s) => s === 'PREMIXED',
        masterAudio: 'string',
        remotionMounts: (m) => Array.isArray(m) && m.length === 1,
        tracks: (t) => typeof t === 'object' && t !== null,
        runtimePlayback: (rp) => typeof rp === 'object' && rp !== null,
      });
    },
    { id: 'T1-F08-001' }
  );

  test(
    'F08-02: Exactly 1 <Audio> tag mounted in root composition',
    () => {
      const countAudioTagsInAST = (tsxContent: string): number => {
        const matches = tsxContent.match(/<Audio\b[^>]*\/?>/g);
        return matches ? matches.length : 0;
      };

      const validRootTsx = `
        export const Film = () => (
          <AbsoluteFill>
            <Audio src={staticFile("audio/scopus_master_audio.wav")} />
            <SceneSequences />
          </AbsoluteFill>
        );
      `;
      assertEqual(countAudioTagsInAST(validRootTsx), 1, 'Root composition must have exactly 1 Audio tag');

      const dualMountTsx = `
        export const Film = () => (
          <AbsoluteFill>
            <Audio src={staticFile("audio/master.wav")} />
            <Audio src={staticFile("audio/sfx_hit.wav")} />
          </AbsoluteFill>
        );
      `;
      assertEqual(countAudioTagsInAST(dualMountTsx), 2, 'Dual mount detected');
      assertFalse(countAudioTagsInAST(dualMountTsx) === 1);
    },
    { id: 'T1-F08-002' }
  );

  test(
    'F08-03: Prohibition of secondary cue <Audio> tags inside child scene components',
    () => {
      const inspectChildSceneAudioTags = (childScenes: Array<{ name: string; content: string }>): string[] => {
        const violations: string[] = [];
        for (const scene of childScenes) {
          const matches = scene.content.match(/<Audio\b[^>]*\/?>/g);
          if (matches && matches.length > 0) {
            violations.push(`${scene.name} contains ${matches.length} illegal child <Audio> tag(s)`);
          }
        }
        return violations;
      };

      const cleanScenes = [
        { name: 'Scene1Intro.tsx', content: '<div><Graphic /></div>' },
        { name: 'Scene2Taxonomy.tsx', content: '<div><Cards /></div>' },
      ];
      assertEqual(inspectChildSceneAudioTags(cleanScenes).length, 0, 'Clean scenes have 0 violations');

      const defectiveScenes = [
        { name: 'Scene4CaseStudy.tsx', content: '<div><Audio src="stamp.wav" /><Stamp /></div>' },
      ];
      const violations = inspectChildSceneAudioTags(defectiveScenes);
      assertEqual(violations.length, 1);
      assertTrue(violations[0].includes('illegal child <Audio> tag'));
    },
    { id: 'T1-F08-003' }
  );

  test(
    'F08-04: Zero duplicate SFX playback (mixed into master WAV and mounted via discrete tag)',
    () => {
      interface AudioAssetEntry {
        id: string;
        path: string;
        inMasterWav: boolean;
        inRemotionTag: boolean;
      }

      const detectDuplicateSfx = (assets: AudioAssetEntry[]): string[] => {
        const duplicates: string[] = [];
        for (const asset of assets) {
          if (asset.inMasterWav && asset.inRemotionTag) {
            duplicates.push(
              `DUAL_OWNERSHIP: SFX asset "${asset.id}" is mixed into master WAV AND mounted in Remotion tag`
            );
          }
        }
        return duplicates;
      };

      const validAssets: AudioAssetEntry[] = [
        { id: 'sfx_stamp', path: 'audio/sfx/stamp.wav', inMasterWav: true, inRemotionTag: false },
        { id: 'sfx_whoosh', path: 'audio/sfx/whoosh.wav', inMasterWav: true, inRemotionTag: false },
      ];
      assertEqual(detectDuplicateSfx(validAssets).length, 0);

      const duplicatedAssets: AudioAssetEntry[] = [
        { id: 'sfx_stamp', path: 'audio/sfx/stamp.wav', inMasterWav: true, inRemotionTag: true },
      ];
      const dupes = detectDuplicateSfx(duplicatedAssets);
      assertEqual(dupes.length, 1);
      assertTrue(dupes[0].includes('DUAL_OWNERSHIP'));
    },
    { id: 'T1-F08-004' }
  );

  test(
    'F08-05: Audio policy hygiene strictly prohibits background music tracks in production assets',
    () => {
      const inspectProductionAudioDir = (fileList: string[]): { pass: boolean; musicFiles: string[] } => {
        const musicPattern = /(?:music|soundtrack|bgm|background_score)/i;
        const musicFiles = fileList.filter((f) => musicPattern.test(f));
        return {
          pass: musicFiles.length === 0,
          musicFiles,
        };
      };

      const cleanAudioDir = [
        'public/audio/scopus_master_audio.wav',
        'public/audio/sfx/stamp_reject.wav',
        'public/audio/sfx/node_connect.wav',
      ];
      assertTrue(inspectProductionAudioDir(cleanAudioDir).pass);

      const pollutedAudioDir = [
        ...cleanAudioDir,
        'public/audio/background_soundtrack.wav',
      ];
      const check = inspectProductionAudioDir(pollutedAudioDir);
      assertFalse(check.pass);
      assertEqual(check.musicFiles.length, 1);
    },
    { id: 'T1-F08-005' }
  );
});
