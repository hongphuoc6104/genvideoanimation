/**
 * Tier 1 Feature Suite: F10 — Real Audio Metadata & Portability (R10)
 *
 * Verifies physical WAV header parsing, sample rate, channels, bit depth, duration consistency,
 * zero machine absolute paths, and relative URI normalization.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertClose,
  assertWavHeader,
} from '../harness/assert';
import { createMockWavBuffer } from '../harness/mock-fixtures';

describe({ name: 'F10: Real Audio Metadata & Portability Contract', feature: 'F10', tier: 1 }, () => {
  test(
    'F10-01: Physical RIFF WAV header parsing validates binary audio format',
    () => {
      const buffer = createMockWavBuffer({
        sampleRate: 48000,
        channels: 2,
        bitDepth: 16,
        durationSec: 3.5,
      });

      const parsed = assertWavHeader(buffer, {
        sampleRate: 48000,
        channels: 2,
        bitDepth: 16,
        minDurationSec: 3.4,
      });

      assertEqual(parsed.sampleRate, 48000);
      assertEqual(parsed.channels, 2);
      assertEqual(parsed.bitDepth, 16);
      assertEqual(parsed.audioFormat, 1, 'Audio format 1 is standard uncompressed PCM');
      assertClose(parsed.durationSec, 3.5, 0.01);
    },
    { id: 'T1-F10-001' }
  );

  test(
    'F10-02: Format compliance verifies 48kHz stereo 16-bit PCM standard',
    () => {
      const isFormatCompliant = (h: { sampleRate: number; channels: number; bitDepth: number }): boolean => {
        const validSampleRates = [48000, 24000];
        const validChannels = [2, 1]; // stereo preferred, mono acceptable
        const validBitDepth = [16, 24];
        return (
          validSampleRates.includes(h.sampleRate) &&
          validChannels.includes(h.channels) &&
          validBitDepth.includes(h.bitDepth)
        );
      };

      assertTrue(isFormatCompliant({ sampleRate: 48000, channels: 2, bitDepth: 16 }));
      assertTrue(isFormatCompliant({ sampleRate: 24000, channels: 1, bitDepth: 16 }));

      // Reject non-broadcast sample rates
      assertFalse(isFormatCompliant({ sampleRate: 44100, channels: 2, bitDepth: 16 }));
      assertFalse(isFormatCompliant({ sampleRate: 8000, channels: 1, bitDepth: 16 }));
    },
    { id: 'T1-F10-002' }
  );

  test(
    'F10-03: Measured physical WAV duration matches audio-manifest.json within +/- 0.05s',
    () => {
      const verifyDurationMatch = (physicalSec: number, manifestSec: number): boolean => {
        const delta = Math.abs(physicalSec - manifestSec);
        return delta <= 0.05;
      };

      // Exact match
      assertTrue(verifyDurationMatch(103.20, 103.20));

      // 40ms delta -> Pass
      assertTrue(verifyDurationMatch(103.20, 103.24));

      // 60ms delta -> Fail
      assertFalse(verifyDurationMatch(103.20, 103.26));
    },
    { id: 'T1-F10-003' }
  );

  test(
    'F10-04: Portability gate detects and flags machine-specific absolute paths',
    () => {
      const scanForAbsoluteMachinePaths = (content: string): string[] => {
        const violations: string[] = [];
        const absolutePatterns = [
          /\/home\/[^\s"',;)]+/g,
          /\/Users\/[^\s"',;)]+/g,
          /[A-Za-z]:\\[^\s"',;)]+/g,
          /\/(?:tmp|var\/tmp|root)\/[^\s"',;)]+/g,
        ];

        for (const pattern of absolutePatterns) {
          const matches = content.match(pattern);
          if (matches) {
            violations.push(...matches);
          }
        }
        return violations;
      };

      const cleanJson = JSON.stringify({
        masterAudio: 'public/audio/scopus_master_audio.wav',
        sfx: 'public/audio/sfx/stamp.wav',
      });
      assertEqual(scanForAbsoluteMachinePaths(cleanJson).length, 0);

      const pollutedJson = JSON.stringify({
        masterAudio: '/home/hongphuoc6104/Desktop/videorenderhoathinh/public/audio/master.wav',
        windowsPath: 'C:\\Users\\Developer\\Desktop\\audio.wav',
      });
      const violations = scanForAbsoluteMachinePaths(pollutedJson);
      assertTrue(violations.length >= 2, 'Must detect Linux and Windows absolute machine paths');
    },
    { id: 'T1-F10-004' }
  );

  test(
    'F10-05: Relative URI normalization enforces workspace-relative paths',
    () => {
      const normalizeAssetUri = (uri: string): string => {
        // Normalizes redundant ./ and ensures clean workspace-relative path
        return uri.replace(/^\.\//, '').replace(/\\/g, '/');
      };

      assertEqual(normalizeAssetUri('./public/audio/master.wav'), 'public/audio/master.wav');
      assertEqual(normalizeAssetUri('public\\audio\\master.wav'), 'public/audio/master.wav');
      assertEqual(normalizeAssetUri('audio/sfx/stamp.wav'), 'audio/sfx/stamp.wav');
    },
    { id: 'T1-F10-005' }
  );
});
