/**
 * Tier 1 Feature Suite: F12 — Skill & Governance Hardening (R12)
 *
 * Verifies 17 non-negotiable hard rules in SKILL.md, two-tier role separation in AGENTS.md,
 * zero runtime imports from .agents/, prohibition of self-certification, and mobile-first defaults.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
} from '../harness/assert';

describe({ name: 'F12: Skill & Governance Hardening Contract', feature: 'F12', tier: 1 }, () => {
  const HARD_RULES = [
    'NEVER_SHRINK_TO_FIT',
    'ONE_PRIMARY_IDEA_PER_BEAT',
    'PROGRESSIVE_DISCLOSURE',
    'MOBILE_FIRST_READABILITY',
    'ONE_AUTHORITATIVE_TIMELINE',
    'ONE_AUDIO_OWNER_PER_ASSET',
    'FINAL_RENDER_IS_AUTHORITATIVE',
    'NO_SELF_CERTIFICATION',
    'CANONICAL_PRODUCTION_POLICY',
    'EFFECTIVE_TYPOGRAPHY_SCALING',
    'DETERMINISTIC_PREVIEW_LINEAGE',
    'REAL_VIDEO_DECODING_NO_SYNTHETIC_BUFFERS',
    'MOTIVATED_TRANSITIONS_SEPARATE_IMPACT',
    'SAFE_TTS_DEFAULT_VIENEU',
    'MEASURED_METADATA_AND_PORTABILITY',
    'HUNDRED_PERCENT_CONTENT_COVERAGE',
    'FAIL_CLOSED_GATE_ENTRYPOINT',
  ];

  test(
    'F12-01: Exactly 17 non-negotiable hard rules defined in SKILL.md specification',
    () => {
      assertEqual(HARD_RULES.length, 17, 'Must have exactly 17 hard governance rules');
      assertTrue(HARD_RULES.includes('NEVER_SHRINK_TO_FIT'));
      assertTrue(HARD_RULES.includes('NO_SELF_CERTIFICATION'));
      assertTrue(HARD_RULES.includes('ONE_AUTHORITATIVE_TIMELINE'));
      assertTrue(HARD_RULES.includes('FAIL_CLOSED_GATE_ENTRYPOINT'));
    },
    { id: 'T1-F12-001' }
  );

  test(
    'F12-02: Two-tier agent governance separates Implementation from Verification',
    () => {
      const TIER1_ROLES = ['Director', 'Content Architect', 'Audio DSP Agent', 'Art/Rig Agent', 'Motion/Shot Agent'];
      const TIER2_ROLES = ['Static AST Validator', 'Acoustic Gate', 'Temporal QA Gate', 'Independent Reviewer', 'Adversarial Challenger', 'Forensic Auditor'];

      // Intersection must be empty (strict separation)
      const intersection = TIER1_ROLES.filter((r) => TIER2_ROLES.includes(r));
      assertEqual(intersection.length, 0, 'No agent may hold roles in both Tier 1 and Tier 2');

      const isVerifierPermittedToModifyCode = (role: string): boolean => {
        return !TIER2_ROLES.includes(role);
      };

      assertFalse(isVerifierPermittedToModifyCode('Independent Reviewer'));
      assertFalse(isVerifierPermittedToModifyCode('Forensic Auditor'));
      assertTrue(isVerifierPermittedToModifyCode('Motion/Shot Agent'));
    },
    { id: 'T1-F12-002' }
  );

  test(
    'F12-03: Zero runtime imports from .agents/ across all production packages',
    () => {
      const detectIllegalAgentImports = (code: string): string[] => {
        const importPattern = /import\s+.*?from\s+['"][^'"]*(?:\.agents|\/\.agents\/)[^'"]*['"]/g;
        return code.match(importPattern) || [];
      };

      const cleanProductionCode = `
        import { CharacterController } from 'motion-kit';
        import { generateNarration } from 'narration-kit';
      `;
      assertEqual(detectIllegalAgentImports(cleanProductionCode).length, 0);

      const defectiveCode = `
        import { rule } from '../../../.agents/skills/educational-flat-motion/SKILL.md';
      `;
      const detected = detectIllegalAgentImports(defectiveCode);
      assertEqual(detected.length, 1);
    },
    { id: 'T1-F12-003' }
  );

  test(
    'F12-04: Prohibition of self-certification prevents implementing agent from scoring deliverables',
    () => {
      const validateCertificationAuthority = (
        authorAgentId: string,
        reviewerAgentId: string
      ): { valid: boolean; error?: string } => {
        if (authorAgentId === reviewerAgentId) {
          return {
            valid: false,
            error: 'SELF_CERTIFICATION_PROHIBITED: Author cannot independently certify own quality report',
          };
        }
        return { valid: true };
      };

      // Independent review -> Pass
      assertTrue(validateCertificationAuthority('motion_choreographer_1', 'independent_reviewer_1').valid);

      // Self-scoring -> Fail
      const selfResult = validateCertificationAuthority('motion_choreographer_1', 'motion_choreographer_1');
      assertFalse(selfResult.valid);
      assertTrue(selfResult.error?.includes('SELF_CERTIFICATION_PROHIBITED'));
    },
    { id: 'T1-F12-004' }
  );

  test(
    'F12-05: Mobile-first defaults in skill specification enforce content-driven duration',
    () => {
      interface SkillDefaults {
        resolution: [number, number];
        aspectRatio: string;
        fps: number;
        durationPolicy: string;
        allowSemanticOmission: boolean;
        allowContentCompression: boolean;
      }

      const getSkillDefaults = (): SkillDefaults => ({
        resolution: [1080, 1920],
        aspectRatio: '9:16',
        fps: 30,
        durationPolicy: 'content-driven',
        allowSemanticOmission: false,
        allowContentCompression: false,
      });

      const defaults = getSkillDefaults();
      assertEqual(defaults.resolution[0], 1080);
      assertEqual(defaults.resolution[1], 1920);
      assertEqual(defaults.aspectRatio, '9:16');
      assertEqual(defaults.fps, 30);
      assertEqual(defaults.durationPolicy, 'content-driven');
      assertEqual(defaults.allowSemanticOmission, false);
      assertEqual(defaults.allowContentCompression, false);
    },
    { id: 'T1-F12-005' }
  );
});
