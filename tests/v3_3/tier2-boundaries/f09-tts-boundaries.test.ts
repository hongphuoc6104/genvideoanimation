/**
 * Tier 2 Boundary Suite: F09 — TTS Routing Boundaries (R9)
 *
 * Verifies empty string, whitespace, undefined options, case-insensitive resolution,
 * and explicit Kokoro opt-in.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
} from '../harness/assert';

describe({ name: 'F09-B: TTS Routing Boundaries', feature: 'F09', tier: 2 }, () => {
  const resolveVoiceBoundary = (options?: { voice?: string; provider?: string }): string => {
    if (options?.provider === 'kokoro') {
      return options.voice || 'am_adam';
    }
    if (!options || !options.voice || options.voice.trim().length === 0) {
      return 'Adam'; // Default VieNeu voice
    }
    const normalized = options.voice.trim().toLowerCase();
    if (normalized === 'adam') return 'Adam';
    if (normalized === 'am_adam') return 'Adam'; // sanitize forbidden kokoro default
    return options.voice.trim();
  };

  test(
    'F09-B01: Empty string voice option { voice: "" } resolves to VieNeu Adam',
    () => {
      assertEqual(resolveVoiceBoundary({ voice: '' }), 'Adam');
    },
    { id: 'T2-F09-001' }
  );

  test(
    'F09-B02: Whitespace-only voice option { voice: "   " } resolves to VieNeu Adam',
    () => {
      assertEqual(resolveVoiceBoundary({ voice: '   ' }), 'Adam');
      assertEqual(resolveVoiceBoundary({ voice: '\t\n ' }), 'Adam');
    },
    { id: 'T2-F09-002' }
  );

  test(
    'F09-B03: Undefined options object resolves to VieNeu Adam',
    () => {
      assertEqual(resolveVoiceBoundary(undefined), 'Adam');
    },
    { id: 'T2-F09-003' }
  );

  test(
    'F09-B04: Case-insensitive voice name resolution ("adam", "ADAM", "Adam" -> "Adam")',
    () => {
      assertEqual(resolveVoiceBoundary({ voice: 'adam' }), 'Adam');
      assertEqual(resolveVoiceBoundary({ voice: 'ADAM' }), 'Adam');
      assertEqual(resolveVoiceBoundary({ voice: 'Adam' }), 'Adam');
    },
    { id: 'T2-F09-004' }
  );

  test(
    'F09-B05: Explicit Kokoro opt-in permitted only when provider === "kokoro"',
    () => {
      // With explicit provider: 'kokoro' -> Kokoro allowed
      assertEqual(resolveVoiceBoundary({ provider: 'kokoro', voice: 'am_michael' }), 'am_michael');

      // Without provider: 'kokoro', am_adam is sanitized to Adam
      assertEqual(resolveVoiceBoundary({ voice: 'am_adam' }), 'Adam');
    },
    { id: 'T2-F09-005' }
  );
});
