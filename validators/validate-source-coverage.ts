#!/usr/bin/env tsx
/**
 * SOURCE CONTENT COVERAGE VALIDATOR (R11 & R22)
 *
 * Verifies that 100% of curriculum / source concepts are mapped to valid semantic beats:
 * 1. source-content-map.json exists and is valid JSON.
 * 2. totalConcepts > 0 and mappedConcepts === totalConcepts (100% coverage).
 * 3. coveragePercent === 100.
 * 4. Zero duplicate concept IDs.
 * 5. Every mapping specifies a non-empty beatId.
 * 6. If semantic-timeline.json is provided, verifies all beatIds exist in the timeline.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface CoverageReport {
  mapPath: string;
  timelinePath?: string;
  totalConcepts: number;
  mappedConcepts: number;
  coveragePercent: number;
  unmappedConcepts: string[];
  duplicateConcepts: string[];
  untraceableBeats: string[];
  passed: boolean;
  violations: string[];
}

export function validateSourceCoverage(
  mapPath: string,
  timelinePath?: string
): CoverageReport {
  const violations: string[] = [];
  const resolvedMap = path.resolve(mapPath);

  if (!fs.existsSync(resolvedMap)) {
    violations.push(`MISSING_SOURCE_MAP: File not found: ${resolvedMap}`);
    return {
      mapPath,
      timelinePath,
      totalConcepts: 0,
      mappedConcepts: 0,
      coveragePercent: 0,
      unmappedConcepts: [],
      duplicateConcepts: [],
      untraceableBeats: [],
      passed: false,
      violations,
    };
  }

  let data: any;
  try {
    data = JSON.parse(fs.readFileSync(resolvedMap, 'utf-8'));
  } catch (err: any) {
    violations.push(`PARSE_ERROR: Invalid JSON in ${resolvedMap}: ${err.message}`);
    return {
      mapPath,
      timelinePath,
      totalConcepts: 0,
      mappedConcepts: 0,
      coveragePercent: 0,
      unmappedConcepts: [],
      duplicateConcepts: [],
      untraceableBeats: [],
      passed: false,
      violations,
    };
  }

  const mappings = Array.isArray(data.mappings) ? data.mappings : [];
  const totalConcepts = data.totalConcepts ?? data.totalUnits ?? mappings.length;
  const mappedConcepts = data.mappedConcepts ?? data.coveredUnits ?? mappings.filter((m: any) => m.covered !== false).length;
  const coveragePercent = data.coveragePercent ?? (totalConcepts > 0 ? (mappedConcepts / totalConcepts) * 100 : 0);

  if (totalConcepts === 0) {
    violations.push('EMPTY_SOURCE_MAP: Map contains 0 pedagogical concepts.');
  }

  // Check 100% coverage requirement
  if (mappedConcepts < totalConcepts || coveragePercent < 100.0) {
    violations.push(
      `COVERAGE_DEFICIT: Only ${mappedConcepts}/${totalConcepts} concepts mapped (${coveragePercent.toFixed(1)}% < 100.0%). Every source unit must be taught!`
    );
  }

  // Check duplicate concept IDs
  const seenConcepts = new Set<string>();
  const duplicateConcepts: string[] = [];
  const unmappedConcepts: string[] = [];

  for (const m of mappings) {
    if (!m.conceptId) {
      violations.push('INVALID_MAPPING: Mapping item missing conceptId.');
      continue;
    }
    if (seenConcepts.has(m.conceptId)) {
      duplicateConcepts.push(m.conceptId);
    }
    seenConcepts.add(m.conceptId);

    if (m.covered === false || !m.beatId) {
      unmappedConcepts.push(m.conceptId);
    }
  }

  if (duplicateConcepts.length > 0) {
    violations.push(`DUPLICATE_CONCEPTS: Duplicate concept IDs detected: ${duplicateConcepts.join(', ')}`);
  }

  if (unmappedConcepts.length > 0) {
    violations.push(`UNMAPPED_CONCEPTS: Concepts marked uncovered or missing beatId: ${unmappedConcepts.join(', ')}`);
  }

  // Beat traceability against semantic-timeline.json
  const untraceableBeats: string[] = [];
  if (timelinePath) {
    const resolvedTimeline = path.resolve(timelinePath);
    if (fs.existsSync(resolvedTimeline)) {
      try {
        const timelineData = JSON.parse(fs.readFileSync(resolvedTimeline, 'utf-8'));
        const beats = timelineData.beats || (Array.isArray(timelineData) ? timelineData : []);
        const validBeatIds = new Set<string>(beats.map((b: any) => b.id || b.beatId));

        for (const m of mappings) {
          if (m.beatId && !validBeatIds.has(m.beatId)) {
            untraceableBeats.push(`${m.conceptId} -> ${m.beatId}`);
          }
        }

        if (untraceableBeats.length > 0) {
          violations.push(
            `UNTRACEABLE_BEATS: Mapped beat IDs do not exist in semantic-timeline.json: ${untraceableBeats.join(', ')}`
          );
        }
      } catch (err: any) {
        violations.push(`TIMELINE_PARSE_ERROR: Failed to parse ${resolvedTimeline}: ${err.message}`);
      }
    } else {
      violations.push(`MISSING_TIMELINE: Specified timeline file does not exist: ${resolvedTimeline}`);
    }
  }

  const passed = violations.length === 0;

  return {
    mapPath,
    timelinePath,
    totalConcepts,
    mappedConcepts,
    coveragePercent: Number(coveragePercent.toFixed(1)),
    unmappedConcepts,
    duplicateConcepts,
    untraceableBeats,
    passed,
    violations,
  };
}

export async function main() {
  const args = process.argv.slice(2);
  let mapPath = 'connection-film/src/scopus-explainer/source-content-map.json';
  let timelinePath = 'connection-film/src/scopus-explainer/semantic-timeline.json';
  let outReport = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--timeline' && args[i + 1]) timelinePath = args[++i];
    else if (args[i] === '--output' && args[i + 1]) outReport = args[++i];
    else if (!args[i].startsWith('--')) {
      mapPath = args[i];
    }
  }

  console.log(`\n==================================================================`);
  console.log(` VALIDATOR: 100% Pedagogical Source Content Coverage (R11 QA Gate)`);
  console.log(` Source Map: ${mapPath}`);
  if (timelinePath) console.log(` Timeline:   ${timelinePath}`);
  console.log(`==================================================================\n`);

  const report = validateSourceCoverage(mapPath, timelinePath);

  console.log(`------------------------------------------------------------------`);
  console.log(` COVERAGE AUDIT SUMMARY`);
  console.log(`------------------------------------------------------------------`);
  console.log(`  Total Source Units:   ${report.totalConcepts}`);
  console.log(`  Covered Units:        ${report.mappedConcepts}`);
  console.log(`  Coverage Ratio:       ${report.coveragePercent}% (Threshold: 100%)`);
  console.log(`  Untraceable Beats:    ${report.untraceableBeats.length}`);
  console.log(`  Status:               ${report.passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`------------------------------------------------------------------\n`);

  if (outReport) {
    const dir = path.dirname(outReport);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(outReport, JSON.stringify(report, null, 2), 'utf-8');
  }

  if (!report.passed) {
    console.error(`❌ Source Coverage Gate Failed:`);
    for (const v of report.violations) console.error(`  - ${v}`);
    process.exit(1);
  }

  console.log(`✅ 100% Source Content Coverage PASSED cleanly.`);
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes('validate-source-coverage')) {
  main().catch((err) => {
    console.error('Fatal source coverage validator error:', err);
    process.exit(1);
  });
}
