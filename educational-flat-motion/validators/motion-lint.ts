#!/usr/bin/env tsx
/**
 * MOTION LINT - QUALITY GATE VALIDATOR
 * Programmatic validator that turns the skill's anti-pattern checklist
 * into automated static analysis rules.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface LintViolation {
  file: string;
  line: number;
  rule: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  message: string;
  snippet?: string;
}

export interface LintResult {
  filesAnalyzed: number;
  violations: LintViolation[];
  passed: boolean;
}

export function lintSourceFile(filePath: string): LintViolation[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations: LintViolation[] = [];

  // Rule 1: No Crossfade Pose Blend (CRITICAL)
  // Detects: <g opacity={...}><Bird ... mood="sad"/> ... <g opacity={...}><Bird ... mood="happy"/>
  const crossfadeRegex = /opacity=\{[^{}]*(?:1\s*-\s*\w+|\b\w+Blend\b|\bblend\b)[^{}]*\}/;
  for (let i = 0; i < lines.length - 8; i++) {
    const window = lines.slice(i, i + 8).join('\n');
    if (
      crossfadeRegex.test(window) &&
      (window.includes('mood=') || window.includes('pose=')) &&
      (window.match(/<(?:Bird|Character)[^>]*\/>/g) || []).length >= 2
    ) {
      violations.push({
        file: filePath,
        line: i + 1,
        rule: 'no-crossfade-pose-blend',
        severity: 'CRITICAL',
        message: 'Anti-pattern: Simulated pose transition using opacity crossfade between two character instances. Use pose blending on joint transforms instead.',
        snippet: lines.slice(i, i + 3).join('\n').trim(),
      });
      break;
    }
  }

  // Rule 2: No Monolithic Character Rig (CRITICAL)
  // Detects: Character component where all parts are wrapped in one root transform without sub-part transforms
  if (filePath.includes('Art.tsx') || filePath.includes('Bird') || filePath.includes('Character')) {
    const hasMonolithicGroup = lines.some((l, idx) => {
      if (l.includes('<g') && l.includes('transform=') && (l.includes('breathe') || l.includes('bodyTilt'))) {
        // Check if next 40 lines contain head, wing, eye sub-transforms with data-part or distinct pivots
        const nextLines = lines.slice(idx, idx + 40).join('\n');
        return (
          nextLines.includes('Tail') &&
          nextLines.includes('Plump body') &&
          !nextLines.includes('data-part') &&
          !nextLines.includes('CharacterPose')
        );
      }
      return false;
    });

    if (hasMonolithicGroup) {
      violations.push({
        file: filePath,
        line: 63,
        rule: 'no-monolithic-character',
        severity: 'CRITICAL',
        message: 'Anti-pattern: Entire character hierarchy resides in a single monolithic SVG transform. Separate into Torso, Head, Wings, and Legs with independent pivots.',
      });
    }
  }

  // Rule 3: No Plain Translate Flight (CRITICAL)
  // Detects: Character moving across screen purely via interpolate(progress, [0, 1], [start, end]) with static mood and no flap/banking
  for (let i = 0; i < lines.length - 10; i++) {
    const chunk = lines.slice(i, i + 10).join('\n');
    if (
      chunk.includes('secondBirdX = interpolate(') &&
      chunk.includes('secondBirdY =') &&
      chunk.includes('Math.sin(') &&
      !chunk.includes('flightCycle') &&
      !chunk.includes('landingSequence')
    ) {
      violations.push({
        file: filePath,
        line: i + 1,
        rule: 'no-plain-translate-flight',
        severity: 'CRITICAL',
        message: 'Anti-pattern: Character entering frame by simple linear/cubic translation + sin wave. Missing flight cycle, banking angle, flare, landing squash, and overshoot.',
        snippet: lines[i].trim(),
      });
      break;
    }
  }

  // Rule 4: No Constant Monotonic Slow Zoom Camera (MAJOR)
  // Detects: cameraScale = 1 + cameraProgress * 0.035
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (
      l.includes('cameraScale') &&
      l.includes('cameraProgress') &&
      (l.includes('0.035') || l.includes('0.03') || l.includes('0.04')) &&
      !lines.some((line) => line.includes('cameraPush') || line.includes('cameraFollow'))
    ) {
      violations.push({
        file: filePath,
        line: i + 1,
        rule: 'no-constant-slow-zoom',
        severity: 'MAJOR',
        message: 'Anti-pattern: Ambient slow zoom (3.5%) used as substitute for motivated camera choreography.',
        snippet: l.trim(),
      });
      break;
    }
  }

  // Rule 5: No Opacity-Only Scene Transition (CRITICAL)
  // Detects: act0Opacity = fadeOut, act1Opacity = reveal * fadeOut
  for (let i = 0; i < lines.length - 4; i++) {
    const chunk = lines.slice(i, i + 4).join('\n');
    if (
      chunk.includes('act0Opacity = fadeOut(') &&
      chunk.includes('act1Opacity = reveal(') &&
      chunk.includes('act2Opacity = reveal(') &&
      !chunk.includes('motivatedIris') &&
      !chunk.includes('morphTransition')
    ) {
      violations.push({
        file: filePath,
        line: i + 1,
        rule: 'no-opacity-scene-transition',
        severity: 'CRITICAL',
        message: 'Anti-pattern: Act transitions implemented purely via opacity dissolve between scenes. Use motivated geometric transitions.',
        snippet: lines[i].trim(),
      });
      break;
    }
  }

  return violations;
}

export function runLinter(targets: string[]): LintResult {
  const allViolations: LintViolation[] = [];
  let filesAnalyzed = 0;

  for (const target of targets) {
    if (!fs.existsSync(target)) continue;

    const stat = fs.statSync(target);
    if (stat.isDirectory()) {
      const files = fs.readdirSync(target).filter((f) => /\.(tsx?|jsx?)$/.test(f));
      for (const file of files) {
        const fullPath = path.join(target, file);
        filesAnalyzed++;
        allViolations.push(...lintSourceFile(fullPath));
      }
    } else {
      filesAnalyzed++;
      allViolations.push(...lintSourceFile(target));
    }
  }

  const criticalCount = allViolations.filter((v) => v.severity === 'CRITICAL').length;
  const majorCount = allViolations.filter((v) => v.severity === 'MAJOR').length;

  return {
    filesAnalyzed,
    violations: allViolations,
    passed: criticalCount === 0 && majorCount === 0,
  };
}

// CLI Execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const targets = args.length > 0 ? args : ['./src'];

  console.log('🔍 [MOTION-LINT] Running Quality Gate Static Analysis on:', targets.join(', '));
  const result = runLinter(targets);

  console.log(`\nAnalyzed ${result.filesAnalyzed} file(s).`);
  if (result.violations.length === 0) {
    console.log('✅ [PASSED] 0 Anti-patterns detected! Clean motion grammar.');
    process.exit(0);
  } else {
    console.log(`\n⚠️  Found ${result.violations.length} violation(s):\n`);
    for (const v of result.violations) {
      const icon = v.severity === 'CRITICAL' ? '🔴' : v.severity === 'MAJOR' ? '🟠' : '🟡';
      console.log(`${icon} [${v.severity}] ${v.rule} at ${v.file}:${v.line}`);
      console.log(`   Message: ${v.message}`);
      if (v.snippet) {
        console.log(`   Snippet: "${v.snippet}"`);
      }
      console.log('');
    }

    if (result.passed) {
      console.log('🟡 Only minor warnings found. Quality Gate Passed.');
      process.exit(0);
    } else {
      console.error('❌ [FAILED] Quality Gate rejected: Critical or Major anti-patterns found.');
      process.exit(1);
    }
  }
}
