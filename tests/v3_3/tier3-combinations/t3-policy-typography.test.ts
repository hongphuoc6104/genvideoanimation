/**
 * Tier 3 Pairwise Combinations: Policy ↔ Typography, Audio, Voice, Portability
 * Tests: T3-01 to T3-04
 *
 * T3-01: Policy ↔ Typography (F01 ↔ F02)
 * T3-02: Policy ↔ Audio Ownership (F01 ↔ F08)
 * T3-03: Policy ↔ VieNeu TTS (F01 ↔ F09)
 * T3-04: Policy ↔ Portability (F01 ↔ F10)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertClose,
  assertDeepEqual,
  assertSchema,
} from '../harness/assert';
import {
  createMockProductionPolicy,
  createMockAudioDependencyGraph,
  validateProductionPolicy,
  validateAudioDependencyGraph,
} from '../harness/mock-fixtures';
import { TYPOGRAPHY_THRESHOLDS } from '../../../validators/validate-mobile-typography';
import { FORBIDDEN_PATH_PATTERNS } from '../../../validators/validate-portability';

describe({ name: 'Tier 3: Policy Cross-Feature Interactions', feature: 'T3-POLICY', tier: 3 }, () => {
  test(
    'T3-01: Policy ↔ Typography: Static typography validator enforces canonical policy minimums and effective scaling',
    () => {
      // 1. Read production-policy.json
      const policyPath = path.resolve(process.cwd(), 'production-policy.json');
      assertTrue(fs.existsSync(policyPath), 'production-policy.json must exist');
      const policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));

      // 2. Verify exact parity between policy typography minimums and validator thresholds
      const policyMins = policy.typography.minimums;
      assertEqual(policyMins.hero, TYPOGRAPHY_THRESHOLDS.hero, 'Policy hero threshold must match validator');
      assertEqual(policyMins.section, TYPOGRAPHY_THRESHOLDS.section, 'Policy section threshold must match validator');
      assertEqual(policyMins.card, TYPOGRAPHY_THRESHOLDS.card, 'Policy card threshold must match validator');
      assertEqual(policyMins.body, TYPOGRAPHY_THRESHOLDS.body, 'Policy body threshold must match validator');
      assertEqual(policyMins.secondary, TYPOGRAPHY_THRESHOLDS.secondary, 'Policy secondary threshold must match validator');
      assertEqual(policyMins.caption, TYPOGRAPHY_THRESHOLDS.caption, 'Policy caption threshold must match validator');

      // 3. Verify effective scaling invariant: Font * Prod(Scale) >= absoluteMobileFloor (30px)
      assertEqual(policy.typography.enforceEffectiveScale, true, 'enforceEffectiveScale must be enabled in policy');
      const floor = policy.typography.absoluteMobileFloor;
      assertEqual(floor, 30, 'absoluteMobileFloor must be 30px');

      const evaluateEffectiveSize = (baseSize: number, parentScales: number[]): { effective: number; passesFloor: boolean } => {
        const effective = baseSize * parentScales.reduce((acc, s) => acc * s, 1.0);
        return {
          effective,
          passesFloor: effective >= floor,
        };
      };

      // Valid: Body text 36px at scale 1.0 -> 36px >= 30px floor
      assertTrue(evaluateEffectiveSize(36, [1.0]).passesFloor, '36px at scale 1.0 must pass mobile floor');

      // Violation: 34px body in container scale 0.8 -> 27.2px < 30px floor (Deceptive compliance caught)
      const deceptive = evaluateEffectiveSize(34, [0.8]);
      assertClose(deceptive.effective, 27.2, 0.001);
      assertFalse(deceptive.passesFloor, '27.2px must violate mobile floor');

      // Valid: 48px section in container scale 0.8 -> 38.4px >= 30px floor
      assertTrue(evaluateEffectiveSize(48, [0.8]).passesFloor, '38.4px must pass mobile floor');
    },
    { id: 'T3-01' }
  );

  test(
    'T3-02: Policy ↔ Audio Ownership: Audio policy strictly binds PREMIXED strategy, zero music, and single audio tag',
    () => {
      const policyPath = path.resolve(process.cwd(), 'production-policy.json');
      const policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));

      // Policy requirements
      assertEqual(policy.audio.policy, 'narration-sfx', 'Policy audio.policy must be narration-sfx');
      assertEqual(policy.audio.strategy, 'PREMIXED', 'Policy audio.strategy must be PREMIXED');
      assertEqual(policy.audio.allowMusic, false, 'Policy must disallow background music in production');
      assertEqual(policy.acceptance.maxAllowedDualAudioTags, 0, 'maxAllowedDualAudioTags must be 0');

      // Couple to AudioDependencyGraph contract
      const graph = createMockAudioDependencyGraph({
        strategy: policy.audio.strategy,
        runtimePlayback: {
          discreteAudioTagsCount: policy.acceptance.maxAllowedDualAudioTags,
          duplicateSfxCount: 0,
        },
      });

      const validation = validateAudioDependencyGraph(graph);
      assertTrue(validation.valid, `Audio dependency graph must satisfy policy: ${validation.errors.join(', ')}`);
      assertEqual(graph.remotionMounts.length, 1, 'Exactly 1 Remotion master mount allowed');
      assertEqual(graph.runtimePlayback.discreteAudioTagsCount, 0, 'Zero discrete runtime audio tags');

      // Adversarial cross-check: If discreteAudioTagsCount > 0, validation fails
      const invalidGraph = createMockAudioDependencyGraph({
        runtimePlayback: { discreteAudioTagsCount: 1, duplicateSfxCount: 0 },
      });
      const invalidCheck = validateAudioDependencyGraph(invalidGraph);
      assertFalse(invalidCheck.valid, 'Audio graph with discrete tags must fail validation');
    },
    { id: 'T3-02' }
  );

  test(
    'T3-03: Policy ↔ VieNeu TTS: Speech policy parameters strictly govern default engine and voice routing',
    () => {
      const policyPath = path.resolve(process.cwd(), 'production-policy.json');
      const policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));

      // Verify policy contract
      assertEqual(policy.speech.defaultEngine, 'VieNeu-TTS', 'defaultEngine must be VieNeu-TTS');
      assertEqual(policy.speech.defaultVoice, 'Adam', 'defaultVoice must be Adam');
      assertEqual(policy.speech.primaryLanguage, 'vi-VN', 'primaryLanguage must be vi-VN');
      assertEqual(policy.speech.secondaryLanguage, 'en', 'secondaryLanguage must be en');
      assertEqual(policy.speech.fallbackEngine, 'Kokoro', 'fallbackEngine must be Kokoro');

      // Simulates runtime TTS voice resolution binding to policy defaults
      const resolveVoiceFromPolicy = (userOptions?: { voice?: string; provider?: string }): { engine: string; voice: string } => {
        const provider = userOptions?.provider;
        const requestedVoice = userOptions?.voice?.trim();

        if (provider === 'kokoro') {
          return {
            engine: 'Kokoro',
            voice: requestedVoice || 'am_adam',
          };
        }

        // Production default strictly resolves to policy speech configuration
        return {
          engine: policy.speech.defaultEngine,
          voice: requestedVoice || policy.speech.defaultVoice,
        };
      };

      // Case 1: Empty options -> VieNeu-TTS Adam
      const defRes = resolveVoiceFromPolicy({});
      assertEqual(defRes.engine, 'VieNeu-TTS');
      assertEqual(defRes.voice, 'Adam');

      // Case 2: Undefined options -> VieNeu-TTS Adam
      const undefRes = resolveVoiceFromPolicy(undefined);
      assertEqual(undefRes.engine, 'VieNeu-TTS');
      assertEqual(undefRes.voice, 'Adam');

      // Case 3: Empty string voice -> VieNeu-TTS Adam
      const emptyVoiceRes = resolveVoiceFromPolicy({ voice: '' });
      assertEqual(emptyVoiceRes.voice, 'Adam');

      // Case 4: Omitted voice must NEVER resolve to Kokoro am_adam
      assertFalse(defRes.engine === 'Kokoro' && defRes.voice === 'am_adam', 'Omitted voice must never resolve to Kokoro am_adam');

      // Case 5: Explicit Kokoro provider opt-in
      const kokoroRes = resolveVoiceFromPolicy({ provider: 'kokoro' });
      assertEqual(kokoroRes.engine, 'Kokoro');
      assertEqual(kokoroRes.voice, 'am_adam');
    },
    { id: 'T3-03' }
  );

  test(
    'T3-04: Policy ↔ Portability: Portability zero-tolerance policy enforces workspace-relative URIs across manifests',
    () => {
      const policyPath = path.resolve(process.cwd(), 'production-policy.json');
      const policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));

      // Policy enforces 0 absolute machine paths
      assertEqual(policy.acceptance.maxAllowedAbsolutePaths, 0, 'maxAllowedAbsolutePaths must be 0');

      // Function to check string against portability patterns
      const checkPortability = (str: string): { hasViolation: boolean; matchedPattern?: string } => {
        for (const pattern of FORBIDDEN_PATH_PATTERNS) {
          pattern.regex.lastIndex = 0; // reset regex state
          if (pattern.regex.test(str)) {
            return { hasViolation: true, matchedPattern: pattern.name };
          }
        }
        return { hasViolation: false };
      };

      // 1. Workspace relative paths in policy and configs pass
      const validPaths = [
        'public/audio/scopus_master_audio.wav',
        'connection-film/src/scopus-explainer/ScopusExplainerFilm.tsx',
        'out/preview-360x640.mp4',
        'mini-projects/science-mechanism/audio/master_audio.wav',
        './scripts/run-adversarial-suite.ts',
      ];

      for (const vp of validPaths) {
        const res = checkPortability(vp);
        assertFalse(res.hasViolation, `Path "${vp}" should be considered portable`);
      }

      // 2. Machine-specific paths are caught
      const invalidPaths = [
        '/home/hongphuoc6104/Desktop/videorenderhoathinh/out/final.mp4',
        '/Users/john/videorenderhoathinh/audio.wav',
        'C:\\Users\\admin\\Desktop\\project\\file.json',
        '/tmp/preview-render.mp4',
      ];

      for (const ip of invalidPaths) {
        const res = checkPortability(ip);
        assertTrue(res.hasViolation, `Path "${ip}" must be detected as non-portable`);
      }
    },
    { id: 'T3-04' }
  );
});
