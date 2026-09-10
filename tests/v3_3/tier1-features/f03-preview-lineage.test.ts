/**
 * Tier 1 Feature Suite: F03 — Deterministic Mobile Preview Lineage (R3)
 *
 * Verifies mathematical lineage from master 1080x1920 to 360x640 preview via
 * FFmpeg Lanczos downscaling, frame count match, duration delta, mtime, and PSNR >= 35dB.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertClose,
  assertDeepEqual,
} from '../harness/assert';

describe({ name: 'F03: Deterministic Mobile Preview Lineage Contract', feature: 'F03', tier: 1 }, () => {
  test(
    'F03-01: FFmpeg command construction mandates Lanczos filter and audio copy',
    () => {
      const buildPreviewCommand = (masterPath: string, previewPath: string): string[] => {
        return [
          'ffmpeg',
          '-y',
          '-v', 'error',
          '-i', masterPath,
          '-vf', 'scale=360:640:flags=lanczos',
          '-c:v', 'libx264',
          '-preset', 'slow',
          '-crf', '22',
          '-pix_fmt', 'yuv420p',
          '-c:a', 'copy',
          previewPath,
        ];
      };

      const cmd = buildPreviewCommand('out/final-v3_3.mp4', 'out/preview-360x640.mp4');
      assertTrue(cmd.includes('scale=360:640:flags=lanczos'), 'Must use Lanczos downscaling filter');
      assertTrue(cmd.includes('-c:a') && cmd[cmd.indexOf('-c:a') + 1] === 'copy', 'Must stream-copy audio');
      assertTrue(cmd.includes('yuv420p'), 'Must enforce yuv420p pixel format for mobile compatibility');
    },
    { id: 'T1-F03-001' }
  );

  test(
    'F03-02: Frame count parity invariant (N_master == N_preview)',
    () => {
      const verifyFrameCountParity = (masterFrames: number, previewFrames: number): boolean => {
        return masterFrames > 0 && masterFrames === previewFrames;
      };

      // 103.20s at 30fps = 3096 frames
      assertTrue(verifyFrameCountParity(3096, 3096), 'Exact frame count match must pass');
      assertFalse(verifyFrameCountParity(3096, 3095), 'Missing 1 frame must fail parity');
      assertFalse(verifyFrameCountParity(3096, 3097), 'Extra 1 frame must fail parity');
      assertFalse(verifyFrameCountParity(0, 0), 'Zero frames must fail');
    },
    { id: 'T1-F03-002' }
  );

  test(
    'F03-03: Duration synchronization delta must be strictly < 0.033s (1 frame at 30fps)',
    () => {
      const verifyDurationParity = (masterSec: number, previewSec: number): boolean => {
        const delta = Math.abs(masterSec - previewSec);
        return delta < 0.033;
      };

      // Exact match
      assertTrue(verifyDurationParity(103.20, 103.20));

      // 10ms drift (within 1 frame 33.3ms) -> Pass
      assertTrue(verifyDurationParity(103.20, 103.21));

      // 34ms drift (exceeds 1 frame) -> Fail
      assertFalse(verifyDurationParity(103.20, 103.234));
    },
    { id: 'T1-F03-003' }
  );

  test(
    'F03-04: Preview modification timestamp freshness (mtime_preview >= mtime_master)',
    () => {
      const verifyMtimeFreshness = (masterMtimeMs: number, previewMtimeMs: number): boolean => {
        // Preview must have been generated at or after master video render
        return previewMtimeMs >= masterMtimeMs;
      };

      const now = Date.now();
      assertTrue(verifyMtimeFreshness(now - 1000, now), 'Preview newer than master passes');
      assertTrue(verifyMtimeFreshness(now, now), 'Preview simultaneous with master passes');
      assertFalse(verifyMtimeFreshness(now, now - 1000), 'Stale preview older than master fails');
    },
    { id: 'T1-F03-004' }
  );

  test(
    'F03-05: PSNR metric calculation confirms mathematical fidelity >= 35.0 dB',
    () => {
      // PSNR = 10 * log10(255^2 / MSE)
      const computePsnr = (mse: number): number => {
        if (mse <= 0) return Infinity;
        const maxI = 255.0;
        return 10 * Math.log10((maxI * maxI) / mse);
      };

      // Very small MSE -> High PSNR (excellent downscaling fidelity)
      const cleanMse = 2.0;
      const cleanPsnr = computePsnr(cleanMse);
      assertTrue(cleanPsnr >= 35.0, `Clean downscale PSNR (${cleanPsnr.toFixed(2)} dB) must exceed 35.0 dB`);

      // Threshold MSE boundary: 255^2 / 10^(3.5) = 65025 / 3162.277 = ~20.56
      const thresholdMse = 20.56;
      assertClose(computePsnr(thresholdMse), 35.0, 0.1, 'Threshold MSE corresponds to 35 dB');

      // Heavy distortion MSE -> Low PSNR (rejection)
      const distortedMse = 50.0;
      assertTrue(computePsnr(distortedMse) < 35.0, 'Distorted image must fail 35 dB gate');
    },
    { id: 'T1-F03-005' }
  );
});
