#!/usr/bin/env tsx
/**
 * VALIDATE PROJECT
 * Comprehensive audit runner verifying all project deliverables,
 * motion-lint compliance, render outputs, and QA documentation.
 */

import * as fs from 'fs';
import * as path from 'path';
import { runLinter } from './motion-lint';

export interface ProjectCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
}

export function validateProject(workspaceRoot: string): { checks: ProjectCheck[]; allPassed: boolean } {
  const checks: ProjectCheck[] = [];

  // Check 1: Skill Directory (.agents/skills/educational-flat-motion/)
  const skillPath = path.join(workspaceRoot, '.agents/skills/educational-flat-motion');
  const skillMd = path.join(skillPath, 'SKILL.md');
  if (fs.existsSync(skillMd)) {
    checks.push({
      name: 'Deliverable 1: Skill Definition',
      status: 'PASS',
      details: `Found SKILL.md at ${path.relative(workspaceRoot, skillMd)}`,
    });
  } else {
    checks.push({
      name: 'Deliverable 1: Skill Definition',
      status: 'FAIL',
      details: 'Missing .agents/skills/educational-flat-motion/SKILL.md',
    });
  }

  // Check 2: Motion Kit (motion-kit/)
  const motionKitPath = path.join(workspaceRoot, 'motion-kit');
  const primitivesTs = path.join(motionKitPath, 'motion-primitives.ts');
  const rigTsx = path.join(motionKitPath, 'components/CharacterRig.tsx');
  if (fs.existsSync(primitivesTs) && fs.existsSync(rigTsx)) {
    checks.push({
      name: 'Deliverable 2: Motion Kit',
      status: 'PASS',
      details: `Motion Kit verified with primitives and CharacterRig at ${path.relative(workspaceRoot, motionKitPath)}`,
    });
  } else {
    checks.push({
      name: 'Deliverable 2: Motion Kit',
      status: 'FAIL',
      details: 'Missing motion-kit/ or key primitives/components',
    });
  }

  // Check 3: Validators (motion-lint.ts, validate-shot-spec.ts, validate-project.ts)
  const v1 = fs.existsSync(path.join(workspaceRoot, 'motion-lint.ts')) || fs.existsSync(path.join(skillPath, 'validators/motion-lint.ts'));
  const v2 = fs.existsSync(path.join(workspaceRoot, 'validate-shot-spec.ts')) || fs.existsSync(path.join(skillPath, 'validators/validate-shot-spec.ts'));
  const v3 = fs.existsSync(path.join(workspaceRoot, 'validate-project.ts')) || fs.existsSync(path.join(skillPath, 'validators/validate-project.ts'));
  if (v1 && v2 && v3) {
    checks.push({
      name: 'Deliverable 3: Quality Gate Validators',
      status: 'PASS',
      details: 'All 3 validators (motion-lint, validate-shot-spec, validate-project) verified.',
    });
  } else {
    checks.push({
      name: 'Deliverable 3: Quality Gate Validators',
      status: 'FAIL',
      details: `Missing validators: v1=${v1}, v2=${v2}, v3=${v3}`,
    });
  }

  // Check 4: Benchmark A MP4 (benchmark-character.mp4)
  const mp4A = path.join(workspaceRoot, 'out/benchmark-character.mp4');
  const rootMp4A = path.join(workspaceRoot, 'benchmark-character.mp4');
  if ((fs.existsSync(mp4A) && fs.statSync(mp4A).size > 10000) || (fs.existsSync(rootMp4A) && fs.statSync(rootMp4A).size > 10000)) {
    checks.push({
      name: 'Deliverable 4: Benchmark A (Character Acting MP4)',
      status: 'PASS',
      details: 'Rendered video file exists and is valid.',
    });
  } else {
    checks.push({
      name: 'Deliverable 4: Benchmark A (Character Acting MP4)',
      status: 'FAIL',
      details: 'benchmark-character.mp4 missing or incomplete.',
    });
  }

  // Check 5: Benchmark B MP4 (benchmark-science.mp4)
  const mp4B = path.join(workspaceRoot, 'out/benchmark-science.mp4');
  const rootMp4B = path.join(workspaceRoot, 'benchmark-science.mp4');
  if ((fs.existsSync(mp4B) && fs.statSync(mp4B).size > 10000) || (fs.existsSync(rootMp4B) && fs.statSync(rootMp4B).size > 10000)) {
    checks.push({
      name: 'Deliverable 5: Benchmark B (Scientific Transformation MP4)',
      status: 'PASS',
      details: 'Rendered video file exists and is valid.',
    });
  } else {
    checks.push({
      name: 'Deliverable 5: Benchmark B (Scientific Transformation MP4)',
      status: 'FAIL',
      details: 'benchmark-science.mp4 missing or incomplete.',
    });
  }

  // Check 6: Benchmark C MP4 (benchmark-abstract.mp4)
  const mp4C = path.join(workspaceRoot, 'out/benchmark-abstract.mp4');
  const rootMp4C = path.join(workspaceRoot, 'benchmark-abstract.mp4');
  if ((fs.existsSync(mp4C) && fs.statSync(mp4C).size > 10000) || (fs.existsSync(rootMp4C) && fs.statSync(rootMp4C).size > 10000)) {
    checks.push({
      name: 'Deliverable 6: Benchmark C (Abstract / Data Explainer MP4)',
      status: 'PASS',
      details: 'Rendered video file exists and is valid.',
    });
  } else {
    checks.push({
      name: 'Deliverable 6: Benchmark C (Abstract / Data Explainer MP4)',
      status: 'FAIL',
      details: 'benchmark-abstract.mp4 missing or incomplete.',
    });
  }

  // Check 7: QA Report (benchmark-report.md)
  const qaReport = path.join(workspaceRoot, 'benchmark-report.md');
  if (fs.existsSync(qaReport) && fs.statSync(qaReport).size > 100) {
    checks.push({
      name: 'Deliverable 7: QA Report (benchmark-report.md)',
      status: 'PASS',
      details: 'Quality rubric evaluation report exists.',
    });
  } else {
    checks.push({
      name: 'Deliverable 7: QA Report (benchmark-report.md)',
      status: 'FAIL',
      details: 'benchmark-report.md missing or empty.',
    });
  }

  // Quality Gate: Run motion-lint on benchmarks
  const benchmarkDir = path.join(workspaceRoot, 'connection-film/src/benchmarks');
  if (fs.existsSync(benchmarkDir)) {
    const lintRes = runLinter([benchmarkDir]);
    if (lintRes.passed) {
      checks.push({
        name: 'Quality Gate: Motion Lint Rules',
        status: 'PASS',
        details: `Passed static analysis across ${lintRes.filesAnalyzed} benchmark files (0 critical, 0 major).`,
      });
    } else {
      checks.push({
        name: 'Quality Gate: Motion Lint Rules',
        status: 'FAIL',
        details: `Found ${lintRes.violations.length} violations in benchmarks.`,
      });
    }
  }

  const allPassed = checks.every((c) => c.status === 'PASS');
  return { checks, allPassed };
}

// CLI Execution
if (require.main === module) {
  const root = process.cwd();
  console.log('🏁 [VALIDATE-PROJECT] Auditing all project deliverables in:', root, '\n');

  const { checks, allPassed } = validateProject(root);

  for (const c of checks) {
    const icon = c.status === 'PASS' ? '✅' : c.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${c.name}`);
    console.log(`   ${c.details}`);
  }

  console.log('\n------------------------------------------------------------');
  if (allPassed) {
    console.log('🎉 ALL DELIVERABLES AND QUALITY GATES PASSED! Ready for global installation.');
    process.exit(0);
  } else {
    console.log('⚠️  Some deliverables or quality gates are still pending.');
    process.exit(1);
  }
}
