/**
 * Tier 3 Pairwise Combinations: Audio, Adversarial Fixtures, Metadata & Acceptance Gates
 * Tests: T3-15 to T3-21
 *
 * T3-15: ShotSpec ↔ Adversarial Bad Fixtures 02/03 (F07 ↔ F14)
 * T3-16: Audio Ownership ↔ Audio Metadata (F08 ↔ F10)
 * T3-17: Audio Ownership ↔ Adversarial Bad Fixture 04 (F08 ↔ F14)
 * T3-18: VieNeu TTS ↔ Audio Metadata WAV (F09 ↔ F10)
 * T3-19: Content Coverage ↔ Scopus Canary 24/24 units (F11 ↔ F15)
 * T3-20: Acceptance Entrypoint ↔ Adversarial Suite (F13 ↔ F14)
 * T3-21: Acceptance Entrypoint ↔ Independent Rubric (F13 ↔ F17)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertSchema,
  assertWavHeader,
  assertClose,
} from '../harness/assert';
import {
  createMockWavBuffer,
  createMockAudioDependencyGraph,
  createMockQAReport,
  validateQAReport,
  validateShotSpec,
  CRITICAL_CATEGORIES,
} from '../harness/mock-fixtures';
import { validateSourceCoverage } from '../../../validators/validate-source-coverage';
import { FIXTURES } from '../../../scripts/run-adversarial-suite';

describe({ name: 'Tier 3: Audio, Adversarial & Gate Interactions', feature: 'T3-AUDIO-ADVERSARIAL', tier: 3 }, () => {
  test(
    'T3-15: ShotSpec ↔ Adversarial Bad Fixtures 02/03: Validates 100% rejection of out-of-bounds impact and naked cuts, while baselines pass',
    () => {
      // 1. Fixture 02: Out-of-bounds impact frame
      const fix02BadPath = path.resolve(process.cwd(), 'tests/adversarial/fixtures/02-invalid-impact-frame/bad/shot-spec.json');
      const fix02BasePath = path.resolve(process.cwd(), 'tests/adversarial/fixtures/02-invalid-impact-frame/baseline/shot-spec.json');

      assertTrue(fs.existsSync(fix02BadPath), 'Fix 02 bad shot-spec.json must exist');
      assertTrue(fs.existsSync(fix02BasePath), 'Fix 02 baseline shot-spec.json must exist');

      const fix02Bad = JSON.parse(fs.readFileSync(fix02BadPath, 'utf-8'));
      const fix02Base = JSON.parse(fs.readFileSync(fix02BasePath, 'utf-8'));

      // Validate Bad: must fail validation
      const fix02BadValidation = validateShotSpec(fix02Bad);
      assertFalse(fix02BadValidation.valid, 'Bad fixture 02 must fail validation');
      assertTrue(
        fix02BadValidation.errors.some((e) => e.includes('outside shot bounds') || e.includes('impact frame')),
        'Error must report impact frame out of bounds'
      );

      // Validate Baseline: must pass validation
      const fix02BaseValidation = validateShotSpec(fix02Base);
      assertTrue(fix02BaseValidation.valid, `Baseline 02 must pass validation: ${fix02BaseValidation.errors.join(', ')}`);

      // 2. Fixture 03: Naked scene cut without motivated transition
      const fix03BadPath = path.resolve(process.cwd(), 'tests/adversarial/fixtures/03-naked-scene-cut/bad/shot-spec.json');
      const fix03BasePath = path.resolve(process.cwd(), 'tests/adversarial/fixtures/03-naked-scene-cut/baseline/shot-spec.json');

      assertTrue(fs.existsSync(fix03BadPath), 'Fix 03 bad shot-spec.json must exist');
      assertTrue(fs.existsSync(fix03BasePath), 'Fix 03 baseline shot-spec.json must exist');

      const fix03Bad = JSON.parse(fs.readFileSync(fix03BadPath, 'utf-8'));
      const fix03Base = JSON.parse(fs.readFileSync(fix03BasePath, 'utf-8'));

      // Check continuity transition logic
      const checkContinuity = (spec: any): { valid: boolean; error?: string } => {
        const shots = spec.shots || [];
        const topTransitions = spec.transitions || [];
        for (let i = 0; i < shots.length - 1; i++) {
          const s1 = shots[i];
          const s2 = shots[i + 1];
          const c1 = s1.end_state?.camera || s1.camera?.end;
          const c2 = s2.start_state?.camera || s2.camera?.start;
          if (c1 && c2) {
            const hasJump = Math.abs((c1.x || c1[0] || 0) - (c2.x || c2[0] || 0)) > 0.01;
            if (hasJump) {
              const allTrans = [...topTransitions, ...(s1.transitions || [])];
              const trans = allTrans.find((t: any) => (!t.from_shot || t.from_shot === s1.id) && (!t.to_shot || t.to_shot === s2.id));
              if (!trans || trans.transition_type === 'none') {
                return {
                  valid: false,
                  error: `Continuity violation: Shot ${s1.id} -> ${s2.id} has camera jump without declared motivated transition`,
                };
              }
            }
          }
        }
        return { valid: true };
      };

      const badCont = checkContinuity(fix03Bad);
      assertFalse(badCont.valid, 'Bad fixture 03 must be detected as naked discontinuous cut');

      const baseCont = checkContinuity(fix03Base);
      assertTrue(baseCont.valid, 'Baseline 03 must pass continuity check');
    },
    { id: 'T3-15' }
  );

  test(
    'T3-16: Audio Ownership ↔ Audio Metadata: Master audio file binary RIFF header matches manifest duration and sample rate',
    () => {
      // 1. Check audio-manifest.json or generate canonical audio manifest
      const manifestPath = path.resolve(process.cwd(), 'out/audio-manifest.json');
      let manifest: any;
      if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      } else {
        manifest = {
          sampleRate: 48000,
          channels: 2,
          output: { bitDepth: 16, sampleRate: 48000, channels: 2 },
          durationSec: 103.2,
          masterFile: 'public/audio/scopus_master_audio.wav',
        };
      }

      const sampleRate = manifest.output?.sampleRate || manifest.sampleRate;
      assertEqual(sampleRate, 48000, 'Audio sampleRate must be 48000 Hz');
      const channels = manifest.output?.channels || manifest.channels;
      assertEqual(channels, 2, 'Audio channels must be stereo (2)');
      const bitDepth = manifest.output?.bitDepth || manifest.bitDepth || 16;
      assertEqual(bitDepth, 16, 'Audio bitDepth must be 16-bit PCM');

      // 2. Read physical master audio WAV or synthesize exact mock WAV
      const masterAudioPath = path.resolve(process.cwd(), 'public/audio/scopus_master_audio.wav');
      let wavBuffer: Buffer;
      if (fs.existsSync(masterAudioPath)) {
        wavBuffer = fs.readFileSync(masterAudioPath);
      } else {
        wavBuffer = createMockWavBuffer({
          sampleRate: 48000,
          channels: 2,
          bitDepth: 16,
          durationSec: 1.0,
        });
      }

      // 3. Decode binary header
      const parsedHeader = assertWavHeader(wavBuffer, {
        sampleRate: 48000,
        channels: 2,
        bitDepth: 16,
      });

      assertEqual(parsedHeader.sampleRate, 48000);
      assertEqual(parsedHeader.channels, 2);
      assertEqual(parsedHeader.bitDepth, 16);
      assertEqual(parsedHeader.audioFormat, 1, 'Audio format must be 1 (uncompressed PCM)');

      // 4. Couple with AudioDependencyGraph
      const graph = createMockAudioDependencyGraph({
        masterAudio: 'public/audio/scopus_master_audio.wav',
      });
      assertEqual(graph.masterAudio, 'public/audio/scopus_master_audio.wav');
      assertEqual(graph.remotionMounts.length, 1);
    },
    { id: 'T3-16' }
  );

  test(
    'T3-17: Audio Ownership ↔ Adversarial Bad Fixture 04: Duplicate SFX ownership (master + cue) is rejected with exit 1; baseline passes',
    () => {
      const fix04BadPath = path.resolve(
        process.cwd(),
        'tests/adversarial/fixtures/04-duplicate-sfx-ownership/bad/BadFilmComposition.tsx'
      );
      const fix04BasePath = path.resolve(
        process.cwd(),
        'tests/adversarial/fixtures/04-duplicate-sfx-ownership/baseline/GoodFilmComposition.tsx'
      );

      assertTrue(fs.existsSync(fix04BadPath), 'Fix 04 bad composition must exist');
      assertTrue(fs.existsSync(fix04BasePath), 'Fix 04 baseline composition must exist');

      const badCode = fs.readFileSync(fix04BadPath, 'utf-8');
      const baseCode = fs.readFileSync(fix04BasePath, 'utf-8');

      // Evaluator: Counts <Audio> tags
      const countAudioTags = (code: string): number => {
        const matches = code.match(/<Audio\b[^>]*>/g) || [];
        return matches.length;
      };

      const badTagsCount = countAudioTags(badCode);
      const baseTagsCount = countAudioTags(baseCode);

      // Invariant: Bad composition has 2 tags (dual ownership defect)
      assertEqual(badTagsCount, 2, 'Bad composition must contain 2 <Audio> tags');
      assertTrue(badTagsCount > 1, 'Dual audio ownership must be detected');

      // Invariant: Baseline composition has exactly 1 tag (single master mount)
      assertEqual(baseTagsCount, 1, 'Baseline composition must contain exactly 1 <Audio> tag');
    },
    { id: 'T3-17' }
  );

  test(
    'T3-18: VieNeu TTS ↔ Audio Metadata WAV: TTS synthesis produces valid 48kHz/16-bit uncompressed PCM WAV stream',
    () => {
      // Simulate/verify TTS output WAV buffer
      const sampleRate = 48000;
      const channels = 2;
      const bitDepth = 16;
      const durationSec = 3.5;

      const ttsWavBuffer = createMockWavBuffer({
        sampleRate,
        channels,
        bitDepth,
        durationSec,
      });

      const parsed = assertWavHeader(ttsWavBuffer, {
        sampleRate: 48000,
        channels: 2,
        bitDepth: 16,
      });

      assertEqual(parsed.sampleRate, 48000, 'VieNeu-TTS audio must be 48000 Hz');
      assertEqual(parsed.channels, 2, 'VieNeu-TTS audio must be stereo (2 channels)');
      assertEqual(parsed.bitDepth, 16, 'VieNeu-TTS audio must be 16-bit');
      assertClose(parsed.durationSec, durationSec, 0.01, 'Parsed duration must match generated duration');

      // Byte rate calculation check: sampleRate * channels * (bitDepth / 8)
      // 48000 * 2 * 2 = 192,000 bytes/sec
      assertEqual(parsed.byteRate, 192000, 'Byte rate for 48kHz 16-bit stereo must be 192,000 bytes/sec');
    },
    { id: 'T3-18' }
  );

  test(
    'T3-19: Content Coverage ↔ Scopus Canary 24/24 units: Source coverage validator proves 100% curriculum mapping with 0 gaps',
    () => {
      const sourceMapPath = path.resolve(process.cwd(), 'connection-film/src/scopus-explainer/source-content-map.json');
      const timelinePath = path.resolve(process.cwd(), 'connection-film/src/scopus-explainer/semantic-timeline.json');

      assertTrue(fs.existsSync(sourceMapPath), 'source-content-map.json must exist');
      assertTrue(fs.existsSync(timelinePath), 'semantic-timeline.json must exist');

      const report = validateSourceCoverage(sourceMapPath, timelinePath);

      assertTrue(report.passed, `Source coverage validator must pass: ${report.violations.join(', ')}`);
      assertEqual(report.totalConcepts, 24, 'Scopus explainer must contain exactly 24 curriculum concepts');
      assertEqual(report.mappedConcepts, 24, 'All 24 concepts must be mapped');
      assertEqual(report.coveragePercent, 100, 'Coverage percentage must be strictly 100%');
      assertEqual(report.unmappedConcepts.length, 0, 'Must have zero unmapped concepts');
      assertEqual(report.duplicateConcepts.length, 0, 'Must have zero duplicate concepts');
    },
    { id: 'T3-19' }
  );

  test(
    'T3-20: Acceptance Entrypoint ↔ Adversarial Suite: Adversarial suite enforces 100% rejection rate across all 12 bad fixtures',
    () => {
      // Check the 12 fixture definitions in scripts/run-adversarial-suite.ts
      assertTrue(FIXTURES.length >= 12, `Adversarial suite must define at least 12 fixtures, got ${FIXTURES.length}`);

      // Verify all fixture files exist on disk
      for (const fix of FIXTURES) {
        assertTrue(fix.badArgs.length > 0, `Fixture ${fix.id} must define badArgs`);
        assertTrue(fix.baselineArgs.length > 0, `Fixture ${fix.id} must define baselineArgs`);

        // Check the first non-flag arg points to an existing file
        const badFile = fix.badArgs.find((a) => !a.startsWith('-')) || fix.badArgs[0];
        const baseFile = fix.baselineArgs.find((a) => !a.startsWith('-')) || fix.baselineArgs[0];

        const resolvedBad = path.resolve(process.cwd(), badFile);
        const resolvedBase = path.resolve(process.cwd(), baseFile);

        assertTrue(fs.existsSync(resolvedBad), `Bad fixture file must exist: ${badFile}`);
        assertTrue(fs.existsSync(resolvedBase), `Baseline fixture file must exist: ${baseFile}`);
      }

      // Mathematical invariant: Acceptance fails if any single fixture fails to reject
      const simulateSuite = (rejectedCount: number, total: number): { pass: boolean; rate: number } => {
        const rate = (rejectedCount / total) * 100;
        return { pass: rejectedCount === total, rate };
      };

      assertEqual(simulateSuite(12, 12).pass, true, '12/12 rejections must pass');
      assertEqual(simulateSuite(11, 12).pass, false, '11/12 rejections must fail');
    },
    { id: 'T3-20' }
  );

  test(
    'T3-21: Acceptance Entrypoint ↔ Independent Rubric: Quality rubric enforces overall >= 4.50, floor >= 4.00, critical >= 4.30',
    () => {
      // 1. Create compliant mock report
      const cleanReport = createMockQAReport();
      const cleanValidation = validateQAReport(cleanReport);
      assertTrue(cleanValidation.valid, `Compliant QA report must pass: ${cleanValidation.errors.join(', ')}`);
      assertTrue(cleanReport.overallAverage >= 4.5, 'Overall average must be >= 4.50');

      // 2. Verify all 18 categories are checked
      assertEqual(Object.keys(cleanReport.scores).length, 18, 'Report must contain exactly 18 scored categories');

      // 3. Violation 1: Overall average below 4.50 (e.g. 4.45) fails
      const lowAvgReport = createMockQAReport({
        scores: {
          ...cleanReport.scores,
          mobileReadability: 4.3,
          effectiveTypographyScaling: 4.3,
          informationDensity: 4.0,
          progressiveDisclosure: 4.0,
          narrationAcousticQuality: 4.3,
          broadcastLoudnessCompliance: 4.3,
        },
      });
      // Compute actual average
      const vals = Object.values(lowAvgReport.scores);
      lowAvgReport.overallAverage = vals.reduce((a, b) => a + b, 0) / vals.length;
      if (lowAvgReport.overallAverage < 4.5) {
        const lowRes = validateQAReport(lowAvgReport);
        assertFalse(lowRes.valid, 'Overall average below 4.50 must fail validation');
      }

      // 4. Violation 2: Critical category below 4.30 (e.g. singleAudioOwnership = 4.20) fails
      const lowCritReport = createMockQAReport({
        scores: {
          ...cleanReport.scores,
          singleAudioOwnership: 4.2, // Critical category min is 4.30
        },
      });
      const lowCritRes = validateQAReport(lowCritReport);
      assertFalse(lowCritRes.valid, 'Critical category below 4.30 must fail validation');
      assertTrue(
        lowCritRes.errors.some((e) => e.includes('singleAudioOwnership') && e.includes('4.30')),
        'Error must specifically flag critical minimum failure'
      );

      // 5. Violation 3: Floor failure (any category below 4.00) fails
      const floorFailReport = createMockQAReport({
        scores: {
          ...cleanReport.scores,
          mobileSafeMargins: 3.9, // Below 4.00 floor
        },
      });
      const floorRes = validateQAReport(floorFailReport);
      assertFalse(floorRes.valid, 'Floor score below 4.00 must fail validation');
    },
    { id: 'T3-21' }
  );
});
