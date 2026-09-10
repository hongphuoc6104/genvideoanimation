/**
 * tests/v3_2-audio-hardening.test.ts
 *
 * Verification suite for V3.2 Audio Hardening:
 * - GENVIDEO_ADAM_PROFILE constants
 * - ROLE_DEFAULTS pacing
 * - ffmpeg filter string builders
 * - validateAudioPolicy enforcement (bans background music under narration-sfx)
 * - mixAudioTracks policy respect
 */

import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import {
  GENVIDEO_ADAM_PROFILE,
  ROLE_DEFAULTS,
  buildVoiceChainFilter,
  buildGapChainFilter,
  buildAtempoChain,
} from '../packages/narration-kit/src/audio/voiceProfile';
import { validateAudioPolicy } from '../validators/validate-audio-policy';
import { createAudioManifest } from '../packages/narration-kit/src/audio/audioManifest';

describe('V3.2 Audio Hardening: Voice Profile & Policy Gates', () => {
  it('GENVIDEO_ADAM_PROFILE matches Genvideo reference specifications exactly', () => {
    assert.strictEqual(GENVIDEO_ADAM_PROFILE.synthesis.voice, 'Adam');
    assert.strictEqual(GENVIDEO_ADAM_PROFILE.synthesis.mode, 'v3turbo');
    assert.strictEqual(GENVIDEO_ADAM_PROFILE.synthesis.backend, 'onnx');
    assert.strictEqual(GENVIDEO_ADAM_PROFILE.synthesis.device, 'cpu');
    assert.strictEqual(GENVIDEO_ADAM_PROFILE.synthesis.precision, 'fp32');
    assert.strictEqual(GENVIDEO_ADAM_PROFILE.synthesis.temperature, 0.65);
    assert.strictEqual(GENVIDEO_ADAM_PROFILE.synthesis.silenceP, 0.05);

    // Delivery targets
    assert.strictEqual(GENVIDEO_ADAM_PROFILE.delivery.integratedLufsTarget, -15.0);
    assert.strictEqual(GENVIDEO_ADAM_PROFILE.delivery.truePeakMaxDbtp, -1.8);
    assert.strictEqual(GENVIDEO_ADAM_PROFILE.delivery.loudnessRangeLu, 7);

    // Silence cap
    assert.strictEqual(GENVIDEO_ADAM_PROFILE.silence.internalPauseCapSec, 0.13);

    // Voice Chain
    assert.strictEqual(GENVIDEO_ADAM_PROFILE.voiceChain.highpassHz, 75);
    assert.strictEqual(GENVIDEO_ADAM_PROFILE.voiceChain.eq.length, 4);
    assert.deepStrictEqual(GENVIDEO_ADAM_PROFILE.voiceChain.eq[0], {
      frequencyHz: 130,
      q: 0.9,
      gainDb: 3.2,
    });
    assert.deepStrictEqual(GENVIDEO_ADAM_PROFILE.voiceChain.eq[1], {
      frequencyHz: 390,
      q: 1.1,
      gainDb: -2.5,
    });
    assert.deepStrictEqual(GENVIDEO_ADAM_PROFILE.voiceChain.eq[2], {
      frequencyHz: 2800,
      q: 1.2,
      gainDb: 1.8,
    });
    assert.deepStrictEqual(GENVIDEO_ADAM_PROFILE.voiceChain.eq[3], {
      frequencyHz: 6500,
      q: 1.6,
      gainDb: -2.0,
    });
    assert.deepStrictEqual(GENVIDEO_ADAM_PROFILE.voiceChain.compressor, {
      thresholdDb: -24,
      ratio: 4,
      attackMs: 5,
      releaseMs: 80,
      makeupDb: 3.8,
    });
    assert.strictEqual(GENVIDEO_ADAM_PROFILE.voiceChain.limiterLinear, 0.92);
  });

  it('ROLE_DEFAULTS matches authoritative Genvideo delivery style', () => {
    assert.deepStrictEqual(ROLE_DEFAULTS.hook, { speed: 1.08, pauseAfter: 0.20 });
    assert.deepStrictEqual(ROLE_DEFAULTS.thesis, { speed: 1.08, pauseAfter: 0.18 });
    assert.deepStrictEqual(ROLE_DEFAULTS.body, { speed: 1.08, pauseAfter: 0.16 });
    assert.deepStrictEqual(ROLE_DEFAULTS.turn, { speed: 1.10, pauseAfter: 0.22 });
    assert.deepStrictEqual(ROLE_DEFAULTS.evidence, { speed: 1.08, pauseAfter: 0.16 });
    assert.deepStrictEqual(ROLE_DEFAULTS.payoff, { speed: 1.08, pauseAfter: 0.24 });
    assert.deepStrictEqual(ROLE_DEFAULTS.close, { speed: 1.06, pauseAfter: 0.20 });
  });

  it('Filter builders generate correct ffmpeg filtergraph chains', () => {
    const gapFilter = buildGapChainFilter(0.13);
    assert.ok(gapFilter.includes('stop_duration=0.13:stop_threshold=-45dB'));
    assert.ok(gapFilter.includes('areverse'));

    const atempoEmpty = buildAtempoChain(1.0);
    assert.strictEqual(atempoEmpty, '');

    const atempoSpeed = buildAtempoChain(1.08);
    assert.strictEqual(atempoSpeed, 'atempo=1.080000');

    const voiceChain = buildVoiceChainFilter();
    assert.ok(voiceChain.includes('highpass=f=75'));
    assert.ok(voiceChain.includes('equalizer=f=130:t=q:w=0.9:g=3.2'));
    assert.ok(voiceChain.includes('acompressor=threshold=-24dB:ratio=4:attack=5:release=80:makeup=3.8'));
    assert.ok(voiceChain.includes('alimiter=limit=0.92:level=disabled'));
  });

  it('validateAudioPolicy strictly rejects background music under narration-sfx policy', () => {
    const invalidManifest = {
      version: '3.2',
      audioPolicy: 'narration-sfx',
      tracks: {
        narration: { file: 'narration.wav', duration: 10.0 },
        background: { file: 'background_soundtrack.wav', volume: 0.35 },
      },
    };

    const res = validateAudioPolicy({
      manifestData: invalidManifest,
      expectedPolicy: 'narration-sfx',
    });
    assert.strictEqual(res.passed, false);
    assert.ok(res.manifestErrors.some((e) => e.includes('Forbidden music track')));
  });

  it('createAudioManifest defaults to narration-sfx and omits music track', () => {
    const manifest = createAudioManifest({
      totalDurationSec: 25.0,
      narrationTrack: { id: 'narr', type: 'narration', file: 'narration.wav', volume: 1.0, durationSec: 25.0 },
      musicTrack: { id: 'bgm', type: 'music', file: 'music.wav', volume: 0.3, durationSec: 25.0 },
      audioPolicy: 'narration-sfx',
    });

    assert.strictEqual(manifest.audioPolicy, 'narration-sfx');
    assert.strictEqual(manifest.targetLufs, -15.0);
    assert.strictEqual(manifest.tracks.music, undefined, 'Music track must be omitted under narration-sfx');

    const res = validateAudioPolicy({
      manifestData: manifest,
      expectedPolicy: 'narration-sfx',
    });
    assert.strictEqual(res.passed, true);
  });
});
