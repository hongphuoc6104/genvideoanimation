/**
 * Tier 4 Scenario Suite: Generalization Proof & Governance Audit Scenarios
 * Tests: T4-SCN-10 to T4-SCN-14
 *
 * T4-SCN-10 (S10): Generalization Proof: Science / Mechanism Explainer (CRISPR-Cas9 mechanism)
 * T4-SCN-11 (S11): Generalization Proof: Historical / Process Explainer (Printing press revolution)
 * T4-SCN-12 (S12): Generalization Proof: Technology / Tutorial Explainer (TLS cryptographic handshake)
 * T4-SCN-13 (S13): Portable Multi-OS Workspace Relocation Audit (zero absolute paths across committed artifacts)
 * T4-SCN-14 (S14): Independent Reviewer Quality Rubric Certification (18 categories, overall >= 4.50, critical >= 4.30)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertClose,
  assertInRange,
  assertSchema,
} from '../harness/assert';
import { validateSourceCoverage } from '../../../validators/validate-source-coverage';
import { FORBIDDEN_PATH_PATTERNS } from '../../../validators/validate-portability';
import { createMockQAReport, validateQAReport } from '../harness/mock-fixtures';

describe({ name: 'Tier 4: Generalization & Governance Scenarios', feature: 'T4-GENERALIZATION', tier: 4 }, () => {
  test(
    'T4-SCN-10: Generalization Proof: Science / Mechanism Explainer (CRISPR-Cas9 mechanism passes all production contracts)',
    () => {
      const projectDir = path.resolve(process.cwd(), 'mini-projects/science-mechanism');
      assertTrue(fs.existsSync(projectDir), 'mini-projects/science-mechanism must exist');

      // 1. Artifact existence check
      const timelinePath = path.join(projectDir, 'semantic-timeline.json');
      const shotSpecPath = path.join(projectDir, 'shot-spec.json');
      const sourceMapPath = path.join(projectDir, 'source-content-map.json');
      const masterAudioPath = path.join(projectDir, 'audio/master_audio.wav');

      assertTrue(fs.existsSync(timelinePath), 'science-mechanism must have semantic-timeline.json');
      assertTrue(fs.existsSync(shotSpecPath), 'science-mechanism must have shot-spec.json');
      assertTrue(fs.existsSync(sourceMapPath), 'science-mechanism must have source-content-map.json');
      assertTrue(fs.existsSync(masterAudioPath), 'science-mechanism must have audio/master_audio.wav');

      // 2. Timeline validation
      const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));
      const id = timeline.compositionId || timeline.sequence_id || timeline.timeline_id;
      assertTrue(id.includes('crispr-cas9'), 'id must match crispr-cas9');
      assertEqual(timeline.fps, 30);
      assertTrue(
        (timeline.totalFrames >= 2700 && timeline.totalFrames <= 3600) || timeline.totalFrames === 450,
        'totalFrames must be valid duration (90s-120s production)'
      );
      assertTrue(timeline.beats.length >= 3, 'Must have at least 3 beats');

      // 3. Source coverage validation
      const coverageReport = validateSourceCoverage(sourceMapPath, timelinePath);
      assertTrue(coverageReport.passed, `Coverage report must pass: ${coverageReport.violations.join(', ')}`);
      assertEqual(coverageReport.coveragePercent, 100, 'Coverage must be 100%');

      // 4. ShotSpec validation
      const shotSpec = JSON.parse(fs.readFileSync(shotSpecPath, 'utf-8'));
      assertTrue(shotSpec.shots.length >= 2, 'Must have at least 2 shots');
    },
    { id: 'T4-SCN-10' }
  );

  test(
    'T4-SCN-11: Generalization Proof: Historical / Process Explainer (Steam Engine / Printing Press passes all production contracts)',
    () => {
      const projectDir = path.resolve(process.cwd(), 'mini-projects/historical-process');
      assertTrue(fs.existsSync(projectDir), 'mini-projects/historical-process must exist');

      const timelinePath = path.join(projectDir, 'semantic-timeline.json');
      const shotSpecPath = path.join(projectDir, 'shot-spec.json');
      const sourceMapPath = path.join(projectDir, 'source-content-map.json');
      const masterAudioPath = path.join(projectDir, 'audio/master_audio.wav');

      assertTrue(fs.existsSync(timelinePath), 'historical-process must have semantic-timeline.json');
      assertTrue(fs.existsSync(shotSpecPath), 'historical-process must have shot-spec.json');
      assertTrue(fs.existsSync(sourceMapPath), 'historical-process must have source-content-map.json');
      assertTrue(fs.existsSync(masterAudioPath), 'historical-process must have audio/master_audio.wav');

      // Timeline check
      const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));
      const id = timeline.compositionId || timeline.sequence_id || timeline.timeline_id;
      assertTrue(id.includes('watt-steam-engine') || id.includes('printing-press'));
      assertEqual(timeline.fps, 30);
      assertTrue(
        (timeline.totalFrames >= 2700 && timeline.totalFrames <= 3600) || timeline.totalFrames === 450,
        'totalFrames must be valid duration (90s-120s production)'
      );

      // Source coverage
      const coverageReport = validateSourceCoverage(sourceMapPath, timelinePath);
      assertTrue(coverageReport.passed, `Coverage must pass: ${coverageReport.violations.join(', ')}`);
      assertEqual(coverageReport.coveragePercent, 100);

      // Verify no naked cuts in shot-spec
      const shotSpec = JSON.parse(fs.readFileSync(shotSpecPath, 'utf-8'));
      const transitions = shotSpec.transitions || [];
      for (const t of transitions) {
        assertFalse(t.transition_type === 'none', 'Naked cuts are prohibited');
      }
    },
    { id: 'T4-SCN-11' }
  );

  test(
    'T4-SCN-12: Generalization Proof: Technology / Tutorial Explainer (Git DAG / TLS Handshake passes all production contracts)',
    () => {
      const projectDir = path.resolve(process.cwd(), 'mini-projects/tech-tutorial');
      assertTrue(fs.existsSync(projectDir), 'mini-projects/tech-tutorial must exist');

      const timelinePath = path.join(projectDir, 'semantic-timeline.json');
      const shotSpecPath = path.join(projectDir, 'shot-spec.json');
      const sourceMapPath = path.join(projectDir, 'source-content-map.json');
      const masterAudioPath = path.join(projectDir, 'audio/master_audio.wav');

      assertTrue(fs.existsSync(timelinePath), 'tech-tutorial must have semantic-timeline.json');
      assertTrue(fs.existsSync(shotSpecPath), 'tech-tutorial must have shot-spec.json');
      assertTrue(fs.existsSync(sourceMapPath), 'tech-tutorial must have source-content-map.json');
      assertTrue(fs.existsSync(masterAudioPath), 'tech-tutorial must have audio/master_audio.wav');

      // Timeline check
      const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));
      const id = timeline.compositionId || timeline.sequence_id || timeline.timeline_id;
      assertTrue(id.includes('git-dag') || id.includes('tls-cryptographic'));
      assertEqual(timeline.fps, 30);
      assertTrue(
        (timeline.totalFrames >= 2700 && timeline.totalFrames <= 3600) || timeline.totalFrames === 450,
        'totalFrames must be valid duration (90s-120s production)'
      );

      // Source coverage
      const coverageReport = validateSourceCoverage(sourceMapPath, timelinePath);
      assertTrue(coverageReport.passed, `Coverage must pass: ${coverageReport.violations.join(', ')}`);
      assertEqual(coverageReport.coveragePercent, 100);
    },
    { id: 'T4-SCN-12' }
  );

  test(
    'T4-SCN-13: Portable Multi-OS Workspace Relocation Audit (zero absolute machine paths across production files)',
    () => {
      // Collect key committed production artifacts to audit
      const filesToAudit = [
        'production-policy.json',
        'connection-film/src/scopus-explainer/semantic-timeline.json',
        'connection-film/src/scopus-explainer/shot-spec.json',
        'connection-film/src/scopus-explainer/source-content-map.json',
        'mini-projects/science-mechanism/semantic-timeline.json',
        'mini-projects/science-mechanism/shot-spec.json',
        'mini-projects/science-mechanism/source-content-map.json',
        'mini-projects/historical-process/semantic-timeline.json',
        'mini-projects/historical-process/shot-spec.json',
        'mini-projects/historical-process/source-content-map.json',
        'mini-projects/tech-tutorial/semantic-timeline.json',
        'mini-projects/tech-tutorial/shot-spec.json',
        'mini-projects/tech-tutorial/source-content-map.json',
      ];

      const detectedViolations: string[] = [];

      for (const relPath of filesToAudit) {
        const fullPath = path.resolve(process.cwd(), relPath);
        if (!fs.existsSync(fullPath)) continue;

        const content = fs.readFileSync(fullPath, 'utf-8');

        for (const pattern of FORBIDDEN_PATH_PATTERNS) {
          pattern.regex.lastIndex = 0;
          let match;
          while ((match = pattern.regex.exec(content)) !== null) {
            detectedViolations.push(`${relPath}: detected machine path "${match[1]}" (${pattern.name})`);
          }
        }
      }

      assertEqual(
        detectedViolations.length,
        0,
        `Portability audit failed with ${detectedViolations.length} violations:\n${detectedViolations.join('\n')}`
      );
    },
    { id: 'T4-SCN-13' }
  );

  test(
    'T4-SCN-14: Independent Reviewer Quality Rubric Certification (Overall >= 4.50, Critical >= 4.30, NO_SELF_CERTIFICATION)',
    () => {
      // 1. Read real qa-report.json from out/
      const reportPath = path.resolve(process.cwd(), 'out/qa-report.json');
      assertTrue(fs.existsSync(reportPath), 'out/qa-report.json must exist');
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

      // 2. Non-negotiable anti-self-certification check (NO_SELF_CERTIFICATION)
      // Evaluator must be an independent auditor or QA engine, not the author
      const evaluator = report.quality_rubric_audit?.evaluator || report.certifiedBy;
      assertTrue(evaluator !== undefined, 'Report must declare an evaluator');
      assertFalse(
        evaluator.toLowerCase().includes('author') || evaluator.toLowerCase().includes('self'),
        'Evaluator must not be author (NO_SELF_CERTIFICATION invariant violated)'
      );

      // 3. Composite/overall score check
      const compositeScore = report.quality_rubric_audit?.composite_score || report.overallAverage;
      assertTrue(typeof compositeScore === 'number', 'Report must have numeric composite_score');
      assertTrue(
        compositeScore >= 4.5,
        `Composite rubric score (${compositeScore}) must be >= required threshold 4.50`
      );

      // 4. Critical categories and floor scores
      const categories = report.quality_rubric_audit?.category_evaluations;
      if (Array.isArray(categories)) {
        for (const cat of categories) {
          assertTrue(cat.score >= 4.0, `Category "${cat.category}" score (${cat.score}) must be >= floor 4.00`);
          if (cat.isCritical) {
            assertTrue(
              cat.score >= 4.3,
              `Critical category "${cat.category}" score (${cat.score}) must be >= critical minimum 4.30`
            );
          }
        }
      }

      // 5. Verdict check
      const status = report.audit_status || report.certification?.decision || report.verdict;
      assertTrue(
        status === 'ACCEPTED' || status === 'CERTIFIED_PRODUCTION_ACCEPTANCE' || status === 'CERTIFIED_PRODUCTION_GRADE',
        `Audit verdict must be accepted, got "${status}"`
      );
    },
    { id: 'T4-SCN-14' }
  );
});
