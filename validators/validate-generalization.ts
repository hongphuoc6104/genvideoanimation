#!/usr/bin/env tsx
/**
 * GENERALIZATION PROOF VALIDATOR (Requirement R4 / G14)
 * 
 * Verifies production quality and non-synthetic standards across all 3 generalization mini-projects:
 * 1. Science Mechanism: CRISPR-Cas9 DNA cleavage & target edit
 * 2. Historical Process: Watt Steam Engine thermodynamic & mechanical cycle
 * 3. Tech Tutorial: Git distributed DAG & commit graph
 * 
 * Validates:
 * - 100% Curriculum Source Coverage (source-content-map.json)
 * - Shot-spec structure & transitions (shot-spec.json)
 * - Visual AST Relational Semantics (Anti-card monoculture, relational mechanisms)
 * - Physical Audio Master (48kHz, 2ch, 16bit, 90-120s, EBU R128 -15.0 ± 1.0 LUFS, peak <= -1.8 dBTP)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { validateSourceCoverage } from "./validate-source-coverage";
import { parseShotSpec, validateShotSpecData } from "./validate-shot-spec";
import { validateVisualSemantics } from "./validate-visual-semantics";
import { parseWavHeader } from "../packages/narration-kit/src/tts/wav";

export interface GeneralizationProject {
  id: string;
  name: string;
  manifestDir: string;
  compositionDir: string;
}

export const GENERALIZATION_PROJECTS: GeneralizationProject[] = [
  {
    id: "science-mechanism",
    name: "CRISPR-Cas9 Molecular Mechanism",
    manifestDir: "mini-projects/science-mechanism",
    compositionDir: "connection-film/src/legacy/crispr"
  },
  {
    id: "historical-process",
    name: "Watt Steam Engine Thermodynamic Cycle",
    manifestDir: "mini-projects/historical-process",
    compositionDir: "connection-film/src/legacy/steam-engine"
  },
  {
    id: "tech-tutorial",
    name: "Git Distributed DAG Commit Model",
    manifestDir: "mini-projects/tech-tutorial",
    compositionDir: "connection-film/src/legacy/git-dag"
  }
];

export function validateAllGeneralizationProjects() {
  console.log("\n==================================================================");
  console.log(" VALIDATOR: Generalization Proof across 3 Unseen Mini-Projects (G14)");
  console.log("==================================================================\n");

  const errors: string[] = [];

  for (const project of GENERALIZATION_PROJECTS) {
    console.log(`▶ Validating Project: ${project.name} (${project.id})`);

    // 1. Source Coverage (100%)
    const mapPath = path.join(project.manifestDir, "source-content-map.json");
    const timelinePath = path.join(project.manifestDir, "semantic-timeline.json");
    const cov = validateSourceCoverage(mapPath, timelinePath);
    if (!cov.passed) {
      errors.push(`[${project.id}] Source coverage failed: ${cov.violations.join("; ")}`);
      console.error(`  ❌ Source Coverage FAILED: ${cov.violations.length} violations`);
    } else {
      console.log(`  ✔ Source Coverage: 100% mapped (${cov.mappedConcepts}/${cov.totalConcepts} concepts)`);
    }

    // 2. Shot Spec
    const shotPath = path.join(project.manifestDir, "shot-spec.json");
    const shotData = parseShotSpec(shotPath);
    const shotResult = validateShotSpecData(shotData);
    if (!shotResult.valid) {
      errors.push(`[${project.id}] ShotSpec validation failed: ${shotResult.errors.join("; ")}`);
      console.error(`  ❌ ShotSpec FAILED: ${shotResult.errors.length} errors`);
    } else {
      console.log(`  ✔ ShotSpec: Valid (${shotData.shots.length} shots, ${shotData.totalFrames ?? shotData.shots.length} frames)`);
    }

    // 3. Visual Semantics AST
    const scenesDir = path.join(project.compositionDir, "scenes");
    const visResult = validateVisualSemantics([scenesDir]);
    if (!visResult.passed) {
      errors.push(`[${project.id}] Visual AST failed: ${visResult.criticalCount} critical, ${visResult.majorCount} major violations`);
      console.error(`  ❌ Visual AST Semantics FAILED`);
    } else {
      console.log(`  ✔ Visual AST: PASSED (0 anti-card violations, all relational mechanisms verified)`);
    }

    // 4. Physical Audio Master Verification
    const wavPath = path.join(project.manifestDir, "audio/master_audio.wav");
    if (!fs.existsSync(wavPath)) {
      errors.push(`[${project.id}] Master audio WAV missing at ${wavPath}`);
      console.error(`  ❌ Master WAV missing`);
      continue;
    }

    const wavBuf = fs.readFileSync(wavPath);
    const wavHeader = parseWavHeader(wavBuf);
    if (wavHeader.sampleRate !== 48000 || wavHeader.channels !== 2 || wavHeader.bitDepth !== 16) {
      errors.push(`[${project.id}] Audio format invalid: expected 48kHz stereo 16bit, got ${wavHeader.sampleRate}Hz ${wavHeader.channels}ch ${wavHeader.bitDepth}bit`);
      console.error(`  ❌ Audio format invalid`);
    } else {
      console.log(`  ✔ Audio WAV Header: 48000Hz, 2ch, 16bit PCM`);
    }

    if (wavHeader.durationSec < 90 || wavHeader.durationSec > 120) {
      errors.push(`[${project.id}] Duration out of 90-120s specification: ${wavHeader.durationSec.toFixed(2)}s`);
      console.error(`  ❌ Audio duration out of 90-120s bounds: ${wavHeader.durationSec.toFixed(2)}s`);
    } else {
      console.log(`  ✔ Audio Duration: ${wavHeader.durationSec.toFixed(2)}s (Within 90s - 120s standard)`);
    }

    // Manifest loudness & peak
    const manifestPath = path.join(project.manifestDir, "audio/audio-manifest.json");
    if (!fs.existsSync(manifestPath)) {
      errors.push(`[${project.id}] Audio manifest missing at ${manifestPath}`);
      console.error(`  ❌ Audio manifest missing: ${manifestPath}`);
    } else {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      const lufs = manifest.output?.lufs ?? manifest.integratedLufs;
      const peak = manifest.output?.truePeakDbfs ?? manifest.truePeakDbfs;
      if (lufs === undefined || lufs < -16.0 || lufs > -14.0) {
        errors.push(`[${project.id}] Loudness ${lufs} LUFS outside -15.0 ± 1.0 LUFS`);
      } else if (peak === undefined || peak > -1.8) {
        errors.push(`[${project.id}] True peak ${peak} dBTP exceeds -1.8 dBTP ceiling`);
      } else {
        console.log(`  ✔ Acoustic Delivery: ${lufs} LUFS, Peak ${peak} dBTP (EBU R128 Broadcast Compliant)`);
      }
    }
    console.log("");
  }

  if (errors.length > 0) {
    console.error(`❌ GENERALIZATION PROOF FAILED with ${errors.length} error(s):`);
    for (const e of errors) {
      console.error(`  - ${e}`);
    }
    process.exit(1);
  }

  console.log("✅ [PASSED] ALL 3 GENERALIZATION MINI-PROJECTS SATISFY PRODUCTION SPECIFICATION!\n");
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes("validate-generalization")) {
  validateAllGeneralizationProjects();
}
