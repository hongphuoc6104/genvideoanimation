/**
 * Tier 1 Feature Suite: F11 — 100% Source Content Coverage Map (R11)
 *
 * Verifies source-content-map schema, 100% concept mapping, zero omitted units,
 * beat ID traceability, and fail-closed validation on coverage deficit.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertSchema,
} from '../harness/assert';
import {
  createMockSourceContentMap,
  validateSourceContentMap,
  SourceContentMap,
} from '../harness/mock-fixtures';

describe({ name: 'F11: Source Content Coverage Contract', feature: 'F11', tier: 1 }, () => {
  test(
    'F11-01: Source content map validates canonical V3.3 schema structure',
    () => {
      const map: SourceContentMap = createMockSourceContentMap();
      const validation = validateSourceContentMap(map);
      assertTrue(validation.valid, `Validation failed: ${validation.errors.join(', ')}`);

      assertEqual(map.version, '3.3.0');
      assertTrue(map.totalUnits > 0);
      assertEqual(map.coveredUnits, map.totalUnits);
      assertEqual(map.coveragePercent, 100);

      const unit0 = map.mappings[0];
      assertSchema(unit0, {
        conceptId: 'string',
        conceptTitle: 'string',
        sourceDocument: 'string',
        beatId: 'string',
        narrationExcerpt: 'string',
        covered: (c) => c === true,
      });
    },
    { id: 'T1-F11-001' }
  );

  test(
    'F11-02: 100% concept coverage invariant (coveragePercent == 100)',
    () => {
      const map = createMockSourceContentMap();
      assertEqual(map.coveragePercent, 100, 'Coverage percentage must be exactly 100');

      // Ratio formula: coveredUnits / totalUnits === 1.0
      const ratio = map.coveredUnits / map.totalUnits;
      assertEqual(ratio, 1.0, 'Coverage ratio must be 1.00');
    },
    { id: 'T1-F11-002' }
  );

  test(
    'F11-03: Zero omitted pedagogical units (every concept is covered: true)',
    () => {
      const map = createMockSourceContentMap();
      for (const unit of map.mappings) {
        assertTrue(unit.covered === true, `Concept "${unit.conceptId}" marked as not covered`);
        assertTrue(unit.narrationExcerpt.length > 0, `Concept "${unit.conceptId}" missing narration excerpt`);
      }

      // Test with an omitted concept
      const mapWithOmission = createMockSourceContentMap({
        mappings: [
          ...map.mappings,
          {
            conceptId: 'concept_omitted',
            conceptTitle: 'Omitted concept',
            sourceDocument: 'page_2.jpg',
            beatId: '',
            narrationExcerpt: '',
            covered: false,
          },
        ],
      });
      const check = validateSourceContentMap(mapWithOmission);
      assertFalse(check.valid, 'Map with omitted concept must fail');
    },
    { id: 'T1-F11-003' }
  );

  test(
    'F11-04: Beat ID traceability confirms every mapped concept corresponds to timeline beat',
    () => {
      const map = createMockSourceContentMap();
      const validTimelineBeatIds = new Set(['beat_01', 'beat_02', 'beat_03']);

      const verifyBeatTraceability = (
        mappings: typeof map.mappings,
        timelineBeats: Set<string>
      ): { valid: boolean; untraceable: string[] } => {
        const untraceable: string[] = [];
        for (const m of mappings) {
          if (!timelineBeats.has(m.beatId)) {
            untraceable.push(m.conceptId);
          }
        }
        return { valid: untraceable.length === 0, untraceable };
      };

      // Valid mapping
      const resultValid = verifyBeatTraceability(map.mappings, validTimelineBeatIds);
      assertTrue(resultValid.valid, 'All concepts map to existing beats in timeline');

      // Invalid mapping
      const resultInvalid = verifyBeatTraceability(
        [
          {
            conceptId: 'concept_ghost',
            conceptTitle: 'Ghost',
            sourceDocument: 'doc.jpg',
            beatId: 'beat_non_existent',
            narrationExcerpt: '...',
            covered: true,
          },
        ],
        validTimelineBeatIds
      );
      assertFalse(resultInvalid.valid);
      assertEqual(resultInvalid.untraceable.length, 1);
    },
    { id: 'T1-F11-004' }
  );

  test(
    'F11-05: Fail-closed gate logic rejects any content coverage ratio < 1.0',
    () => {
      const evaluateCoverageGate = (covered: number, total: number): boolean => {
        if (total === 0) return false;
        const ratio = covered / total;
        return ratio >= 1.0;
      };

      // 24/24 concepts -> Pass
      assertTrue(evaluateCoverageGate(24, 24));

      // 23/24 concepts (95.8%) -> Fail (content omission prohibited)
      assertFalse(evaluateCoverageGate(23, 24));

      // 0/24 -> Fail
      assertFalse(evaluateCoverageGate(0, 24));
    },
    { id: 'T1-F11-005' }
  );
});
