/**
 * Tier 2 Boundary Suite: F11 — Content Coverage Boundaries (R11)
 *
 * Verifies coverage percentage 99.9% rejection, single concept curriculum,
 * duplicate concept IDs, unmapped beat IDs, and empty curriculum documents.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
} from '../harness/assert';
import {
  createMockSourceContentMap,
  validateSourceContentMap,
} from '../harness/mock-fixtures';

describe({ name: 'F11-B: Content Coverage Boundaries', feature: 'F11', tier: 2 }, () => {
  test(
    'F11-B01: Coverage percentage 99.9% rejection (must be strictly 100%)',
    () => {
      const nearCompleteMap = createMockSourceContentMap({
        coveragePercent: 99.9,
      });
      assertFalse(validateSourceContentMap(nearCompleteMap).valid, '99.9% coverage must fail 100% invariant');
    },
    { id: 'T2-F11-001' }
  );

  test(
    'F11-B02: Single-concept minimal curriculum passes when 1/1 covered (100%)',
    () => {
      const minimalMap = createMockSourceContentMap({
        totalUnits: 1,
        coveredUnits: 1,
        coveragePercent: 100,
        mappings: [
          {
            conceptId: 'concept_only',
            conceptTitle: 'Single Concept',
            sourceDocument: 'doc.jpg',
            beatId: 'beat_01',
            narrationExcerpt: 'Excerpt',
            covered: true,
          },
        ],
      });
      assertTrue(validateSourceContentMap(minimalMap).valid, 'Single-concept 100% map must pass');
    },
    { id: 'T2-F11-002' }
  );

  test(
    'F11-B03: Duplicate concept ID detection and rejection',
    () => {
      const duplicateMap = createMockSourceContentMap({
        mappings: [
          {
            conceptId: 'concept_dupe',
            conceptTitle: 'Concept A',
            sourceDocument: 'doc1.jpg',
            beatId: 'beat_01',
            narrationExcerpt: 'Excerpt 1',
            covered: true,
          },
          {
            conceptId: 'concept_dupe', // DUPLICATE ID
            conceptTitle: 'Concept B',
            sourceDocument: 'doc2.jpg',
            beatId: 'beat_02',
            narrationExcerpt: 'Excerpt 2',
            covered: true,
          },
        ],
      });
      const check = validateSourceContentMap(duplicateMap);
      assertFalse(check.valid, 'Duplicate conceptId must fail validation');
      assertTrue(check.errors.some((e) => e.includes('Duplicate conceptId')));
    },
    { id: 'T2-F11-003' }
  );

  test(
    'F11-B04: Unmapped or empty beat ID rejection',
    () => {
      const unmappedMap = createMockSourceContentMap({
        mappings: [
          {
            conceptId: 'concept_unmapped',
            conceptTitle: 'Unmapped',
            sourceDocument: 'doc.jpg',
            beatId: '', // Empty beat ID!
            narrationExcerpt: '...',
            covered: true,
          },
        ],
      });
      const check = validateSourceContentMap(unmappedMap);
      assertFalse(check.valid, 'Empty beatId must fail validation');
    },
    { id: 'T2-F11-004' }
  );

  test(
    'F11-B05: Empty curriculum document with 0 units rejected',
    () => {
      const emptyMap = createMockSourceContentMap({
        totalUnits: 0,
        coveredUnits: 0,
        coveragePercent: 0,
        mappings: [],
      });
      const check = validateSourceContentMap(emptyMap);
      assertFalse(check.valid, '0-unit curriculum must fail validation');
    },
    { id: 'T2-F11-005' }
  );
});
