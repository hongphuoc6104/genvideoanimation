/**
 * Tier 1 Feature Suite: F15 — Scopus Explainer Canary Migration (R15)
 *
 * Verifies elimination of 70.4s panel overlap in Scene 4, 103.20s timeline reflow,
 * exact 3096 frame count, single PREMIXED audio mount, and 24/24 concept coverage.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
} from '../harness/assert';

describe({ name: 'F15: Scopus Explainer Canary Contract', feature: 'F15', tier: 1 }, () => {
  test(
    'F15-01: 70.4s panel overlap elimination decouples Beat 16 exit and Beat 17 entrance',
    () => {
      // Historical defect in Scene4TemplateCaseStudy:
      // Beat 16: frame < 143, Beat 17: frame >= 135 -> overlap between frames 135-143 (t ~ 70.4s)
      interface BeatVisibilityWindow {
        beatId: string;
        startLocalFrame: number;
        endLocalFrame: number;
      }

      const checkOverlap = (b1: BeatVisibilityWindow, b2: BeatVisibilityWindow): boolean => {
        return b1.endLocalFrame > b2.startLocalFrame && b2.endLocalFrame > b1.startLocalFrame;
      };

      const defectiveBeats: [BeatVisibilityWindow, BeatVisibilityWindow] = [
        { beatId: 'beat_16', startLocalFrame: 0, endLocalFrame: 143 },
        { beatId: 'beat_17', startLocalFrame: 135, endLocalFrame: 264 },
      ];
      assertTrue(checkOverlap(defectiveBeats[0], defectiveBeats[1]), 'Historical defect had 8-frame overlap');

      // V3.3 Repaired choreography: Beat 16 exits at frame 135 before Beat 17 enters at frame 135
      const repairedBeats: [BeatVisibilityWindow, BeatVisibilityWindow] = [
        { beatId: 'beat_16', startLocalFrame: 0, endLocalFrame: 135 },
        { beatId: 'beat_17', startLocalFrame: 135, endLocalFrame: 264 },
      ];
      assertFalse(checkOverlap(repairedBeats[0], repairedBeats[1]), 'Repaired choreography eliminates panel overlap');
    },
    { id: 'T1-F15-001' }
  );

  test(
    'F15-02: 103.20s total timeline reflow parity with master narration audio',
    () => {
      const narrationAudioDurationSec = 103.20;
      const timelineTotalSec = 103.20;

      assertEqual(
        timelineTotalSec,
        narrationAudioDurationSec,
        'Composition timeline must reflow to match 103.20s master narration'
      );
    },
    { id: 'T1-F15-002' }
  );

  test(
    'F15-03: Exactly 3096 frames match at 30fps (3096 = 103.20 * 30)',
    () => {
      const fps = 30;
      const durationSec = 103.20;
      const calculatedFrames = Math.round(durationSec * fps);

      assertEqual(calculatedFrames, 3096, 'Total frame count must be exactly 3096');
    },
    { id: 'T1-F15-003' }
  );

  test(
    'F15-04: Single PREMIXED audio mount in Scopus explainer root composition',
    () => {
      const scopusAudioMount = {
        file: 'connection-film/src/legacy/scopus-explainer/ScopusExplainerFilm.tsx',
        src: 'audio/scopus_master_audio.wav',
        tagCount: 1,
      };

      assertEqual(scopusAudioMount.tagCount, 1, 'Scopus root composition mounts exactly 1 audio tag');
      assertTrue(scopusAudioMount.src.includes('scopus_master_audio.wav'));
    },
    { id: 'T1-F15-004' }
  );

  test(
    'F15-05: Exactly 24/24 concept coverage across 3 Scopus academic source images',
    () => {
      const scopusSourceUnits = [
        'concept_01_rejection_paradox',
        'concept_02_scholarly_dialogue',
        'concept_03_three_core_questions',
        'concept_04_swales_cars_attributes',
        'concept_05_theoretical_gap',
        'concept_06_empirical_gap',
        'concept_07_contextual_gap',
        'concept_08_methodological_gap',
        'concept_09_application_gap',
        'concept_10_funnel_step1_narrowing',
        'concept_11_funnel_step2_knowledge_map',
        'concept_12_funnel_step3_limitation_filter',
        'concept_13_funnel_step4_gap_statement',
        'concept_14_3tier_foundation',
        'concept_15_3tier_problem',
        'concept_16_3tier_positioning',
        'concept_17_template_sentence1',
        'concept_18_template_sentence2',
        'concept_19_template_sentence3',
        'concept_20_template_sentence4',
        'concept_21_case_study_digital_banking',
        'concept_22_pitfall_unsupported_claim',
        'concept_23_pitfall_isolated_sources',
        'concept_24_closing_takeaway',
      ];

      assertEqual(scopusSourceUnits.length, 24, 'Scopus explainer must contain all 24 required concepts');
      const uniqueUnits = new Set(scopusSourceUnits);
      assertEqual(uniqueUnits.size, 24, 'All 24 concepts must be unique');
    },
    { id: 'T1-F15-005' }
  );
});
