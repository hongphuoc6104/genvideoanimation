#!/usr/bin/env tsx
/**
 * CANONICAL PRODUCTION ACCEPTANCE GATE (npm run v3.3:gate)
 *
 * The single authoritative entrypoint for V3.3 production integrity acceptance.
 * Enforces fail-closed sequential execution across all 14 quality gates.
 * Any single failure immediately aborts with exit code 1.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';

interface GateStep {
  id: string;
  name: string;
  command: string;
  args: string[];
}

const GATES: GateStep[] = [
  {
    id: 'G01-typecheck',
    name: 'TypeScript Compilation & Strict Typecheck',
    command: 'npm',
    args: ['run', 'typecheck'],
  },
  {
    id: 'G02-v3_3-e2e',
    name: 'V3.3 Authoritative E2E Test Harness (170 tests: Tier 1 & Tier 2)',
    command: 'npx',
    args: ['tsx', 'tests/v3_3/run-v3_3-e2e.ts'],
  },
  {
    id: 'G03-adversarial',
    name: 'Adversarial False-Positive Test Suite (12 Fixtures)',
    command: 'npx',
    args: ['tsx', 'scripts/run-adversarial-suite.ts'],
  },
  {
    id: 'G04-shot-spec',
    name: 'ShotSpec Structural & Continuity Validation',
    command: 'npx',
    args: ['tsx', 'validators/validate-shot-spec.ts', 'connection-film/src/scopus-explainer/shot-spec.json'],
  },
  {
    id: 'G05-source-coverage',
    name: '100% Pedagogical Source Content Coverage',
    command: 'npx',
    args: [
      'tsx',
      'validators/validate-source-coverage.ts',
      'connection-film/src/scopus-explainer/source-content-map.json',
      '--timeline',
      'connection-film/src/scopus-explainer/semantic-timeline.json',
    ],
  },
  {
    id: 'G06-mobile-typography',
    name: 'Mobile Typography & Effective Scale AST Gate',
    command: 'npx',
    args: ['tsx', 'validators/validate-mobile-typography.ts', 'connection-film/src/scopus-explainer'],
  },
  {
    id: 'G07-audio-ownership',
    name: 'Audio Single Ownership & Remotion Root Mount Gate',
    command: 'npx',
    args: ['tsx', 'validators/validate-audio-ownership.ts'],
  },
  {
    id: 'G08-audio-policy',
    name: 'Acoustic Delivery & Audio Policy Gate (narration-sfx, -15 LUFS)',
    command: 'npx',
    args: ['tsx', 'validators/validate-audio-policy.ts', 'out/audio-manifest.json'],
  },
  {
    id: 'G09-audio-mix',
    name: 'Master Audio Mix & Physical WAV Binary Header Gate',
    command: 'npx',
    args: ['tsx', 'validators/validate-audio-mix.ts'],
  },
  {
    id: 'G10-portability',
    name: 'Workspace Portability & Zero Machine Paths Gate',
    command: 'npx',
    args: ['tsx', 'validators/validate-portability.ts'],
  },
  {
    id: 'G11-temporal-qa',
    name: 'Temporal Video Discontinuity & Spike Gate (Rawvideo MAD)',
    command: 'npx',
    args: [
      'tsx',
      'validators/temporal-render-qa.ts',
      'out/final-v3_3.mp4',
      'connection-film/src/scopus-explainer/shot-spec.json',
    ],
  },
  {
    id: 'G12-preview-parity',
    name: 'Deterministic Mobile Preview Lineage & Parity Gate (PSNR >= 35 dB)',
    command: 'npx',
    args: [
      'tsx',
      'validators/validate-preview-parity.ts',
      'out/final-v3_3.mp4',
      'out/preview-360x640.mp4',
    ],
  },
  {
    id: 'G13-preview-rubric',
    name: 'Mobile Preview Legibility & Rubric Gate (Real FFmpeg Pipe)',
    command: 'npx',
    args: [
      'tsx',
      'validators/validate-preview-rubric.ts',
      'out/preview-360x640.mp4',
      '--timeline',
      'connection-film/src/scopus-explainer/semantic-timeline.json',
    ],
  },
  {
    id: 'G14-generalization',
    name: 'Generalization Proof (3 Unseen Mini-Projects Gate)',
    command: 'npx',
    args: ['tsx', 'validators/validate-generalization.ts'],
  },
];

async function main() {
  const startTime = performance.now();

  console.log(`\n╔═══════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║      CANONICAL V3.3 PRODUCTION ACCEPTANCE GATE: npm run v3.3:gate        ║`);
  console.log(`║      Strict Failure-First Verification (NO SELF-CERTIFICATION)            ║`);
  console.log(`╚═══════════════════════════════════════════════════════════════════════════╝\n`);

  const results: Array<{ id: string; name: string; durationMs: number; passed: boolean; error?: string }> = [];

  for (let i = 0; i < GATES.length; i++) {
    const gate = GATES[i];
    const stepNumber = String(i + 1).padStart(2, '0');
    console.log(`\n▶ [GATE ${stepNumber}/${GATES.length}] ${gate.name}`);
    console.log(`  Executing: ${gate.command} ${gate.args.join(' ')}`);

    const stepStart = performance.now();
    const child = spawnSync(gate.command, gate.args, {
      stdio: 'inherit',
      shell: false,
      cwd: process.cwd(),
      env: { ...process.env },
    });
    const stepDuration = Math.round(performance.now() - stepStart);

    if (child.status !== 0) {
      console.error(`\n❌ [FAIL CLOSED] Gate ${gate.id} failed with exit code ${child.status}`);
      console.error(`Acceptance halted immediately. Production candidate REJECTED.`);
      process.exit(1);
    }

    console.log(`  ✔ Passed in ${stepDuration}ms`);
    results.push({
      id: gate.id,
      name: gate.name,
      durationMs: stepDuration,
      passed: true,
    });
  }

  const totalDurationSec = ((performance.now() - startTime) / 1000).toFixed(2);

  console.log(`\n═══════════════════════════════════════════════════════════════════════════`);
  console.log(` CANONICAL V3.3 ACCEPTANCE GATE SUMMARY`);
  console.log(`═══════════════════════════════════════════════════════════════════════════`);
  for (const r of results) {
    console.log(`  ✔ [PASS] ${r.id.padEnd(24)} ${r.name.padEnd(52)} (${r.durationMs}ms)`);
  }
  console.log(`───────────────────────────────────────────────────────────────────────────`);
  console.log(` Total Gates Verified: ${results.length} / ${GATES.length} (100% Pass)`);
  console.log(` Pipeline Duration:   ${totalDurationSec}s`);
  console.log(` Final Disposition:   ACCEPTED_FOR_V3_3_PRODUCTION`);
  console.log(`═══════════════════════════════════════════════════════════════════════════\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal gate pipeline error:', err);
  process.exit(1);
});
