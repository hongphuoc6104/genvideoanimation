/**
 * tests/vieneu-tts.test.ts
 *
 * Comprehensive Milestone 1 Unit Tests for VieNeu-TTS Engine & Audio Subsystem.
 * Verifies genuine offline synthesis, WAV headers, voice aliasing, sample rates,
 * WAV concatenation auto-detection, and offline network guard compliance.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as net from 'node:net';
import {
  VieNeuTtsEngine,
  VieNeuProvider,
  createTTSProvider,
  defaultTTSProvider,
  KokoroProvider,
  KokoroTtsEngine,
  VIENEU_PRIMARY_VOICES,
  VIENEU_SUPPORTED_VOICES,
  VIENEU_VOICE_ALIASES,
  VIENEU_VOICE_METADATA,
  DEFAULT_VIENEU_VOICE,
  resolveVieNeuVoice,
  isVieNeuVoice,
  resolveAnyVoice,
  isKokoroVoice,
  DEFAULT_VOICE,
  SUPPORTED_VOICES,
  parseWavHeader,
  createWavFile,
  concatenateWavBuffers,
} from '@videorender/narration-kit';
import {
  runWithOfflineGuard,
  isOfflineGuardActive,
  OfflineNetworkViolationError,
} from '../validators/offline-network-guard';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string): void {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✓ ${message}`);
}

async function testExportsAndFactoryResolution(): Promise<void> {
  console.log('\n--- 1. Packaging, Exports & Factory Resolution ---');

  assert(typeof VieNeuTtsEngine === 'function', 'VieNeuTtsEngine is exported');
  assert(typeof VieNeuProvider === 'function', 'VieNeuProvider is exported');
  assert(typeof createTTSProvider === 'function', 'createTTSProvider factory is exported');
  assert(Boolean(defaultTTSProvider), 'defaultTTSProvider is initialized');

  // Test default provider is VieNeuProvider
  const defaultProv = createTTSProvider();
  assert(defaultProv instanceof VieNeuProvider, 'createTTSProvider() defaults to VieNeuProvider');
  assert(defaultProv.name === 'vieneu', 'Default provider name is "vieneu"');

  // Test explicit Kokoro provider fallback
  const kokoroProv = createTTSProvider({ provider: 'kokoro' });
  assert(kokoroProv instanceof KokoroProvider, 'createTTSProvider({ provider: "kokoro" }) returns KokoroProvider');

  // Test language: 'en' fallback
  const enProv = createTTSProvider({ language: 'en' });
  assert(enProv instanceof KokoroProvider, 'createTTSProvider({ language: "en" }) returns KokoroProvider fallback');

  // Test voice-based fallback
  const voiceProv = createTTSProvider({ voice: 'am_adam' });
  assert(voiceProv instanceof KokoroProvider, 'createTTSProvider({ voice: "am_adam" }) returns KokoroProvider');
}

async function testVoiceCatalogAndAliases(): Promise<void> {
  console.log('\n--- 2. Voice Catalog & Deterministic Aliasing ---');

  assert(DEFAULT_VIENEU_VOICE === 'Adam', 'DEFAULT_VIENEU_VOICE is "Adam"');
  assert(VIENEU_PRIMARY_VOICES.length === 4, 'VIENEU_PRIMARY_VOICES defines 4 benchmark voices');
  assert(VIENEU_PRIMARY_VOICES.includes('Adam'), 'Primary voices includes Adam');
  assert(VIENEU_PRIMARY_VOICES.includes('Minh Đức'), 'Primary voices includes Minh Đức');
  assert(VIENEU_PRIMARY_VOICES.includes('Minh Quân'), 'Primary voices includes Minh Quân');
  assert(VIENEU_PRIMARY_VOICES.includes('Mai Phương'), 'Primary voices includes Mai Phương');

  // Test alias resolution
  assert(resolveVieNeuVoice('minh_quan') === 'Minh Triết', 'minh_quan resolves to Minh Triết');
  assert(resolveVieNeuVoice('Minh Quân') === 'Minh Triết', 'Minh Quân resolves to Minh Triết');
  assert(resolveVieNeuVoice('minh quan') === 'Minh Triết', 'minh quan resolves to Minh Triết');
  assert(resolveVieNeuVoice('mai_phuong') === 'Mai Anh', 'mai_phuong resolves to Mai Anh');
  assert(resolveVieNeuVoice('Mai Phương') === 'Mai Anh', 'Mai Phương resolves to Mai Anh');
  assert(resolveVieNeuVoice('adam') === 'Adam', 'adam resolves to Adam');
  assert(resolveVieNeuVoice('minh_duc') === 'Minh Đức', 'minh_duc resolves to Minh Đức');
  assert(resolveVieNeuVoice(undefined) === 'Adam', 'undefined resolves to Adam');
  assert(resolveVieNeuVoice('') === 'Adam', 'empty string resolves to Adam');

  assert(isVieNeuVoice('Minh Quân'), 'isVieNeuVoice recognizes Minh Quân');
  assert(isVieNeuVoice('minh_quan'), 'isVieNeuVoice recognizes minh_quan');
  assert(isVieNeuVoice('Mai Phương'), 'isVieNeuVoice recognizes Mai Phương');
  assert(isVieNeuVoice('Adam'), 'isVieNeuVoice recognizes Adam');

  // Test resolveAnyVoice
  const rKokoro = resolveAnyVoice('am_adam');
  assert(rKokoro.provider === 'kokoro' && rKokoro.resolvedName === 'am_adam', 'resolveAnyVoice routes am_adam to kokoro');

  const rVieNeu = resolveAnyVoice('Minh Quân');
  assert(rVieNeu.provider === 'vieneu' && rVieNeu.resolvedName === 'Minh Triết', 'resolveAnyVoice routes Minh Quân to vieneu Minh Triết');

  // Metadata checks
  for (const voice of ['Adam', 'Minh Đức', 'Minh Quân', 'Mai Phương']) {
    const meta = VIENEU_VOICE_METADATA[voice];
    assert(Boolean(meta), `Metadata defined for primary voice "${voice}"`);
    assert(meta.language === 'vi-VN', `Voice "${voice}" language is vi-VN`);
    assert(meta.sampleRate === 48000, `Voice "${voice}" sampleRate is 48000`);
  }
}

async function testModelAssetsVerification(): Promise<void> {
  console.log('\n--- 3. Local Model Assets Verification ---');

  const engine = new VieNeuTtsEngine();
  const valid = await engine.validateModelAssets();
  assert(valid, 'VieNeuTtsEngine.validateModelAssets() returns true for cached ONNX models');

  const voices = engine.getAvailableVoices();
  assert(voices.length >= 15, `getAvailableVoices exposes at least 15 presets (got ${voices.length})`);
  assert(voices.includes('Adam'), 'Available voices includes Adam');
  assert(voices.includes('Minh Đức'), 'Available voices includes Minh Đức');
}

async function testGenuineOfflineSynthesis(): Promise<void> {
  console.log('\n--- 4. Genuine VieNeu-TTS Offline Synthesis (Native 48kHz) ---');

  const engine = new VieNeuTtsEngine({ offline: true });
  const text = 'Thử nghiệm hệ thống VieNeu-TTS v3 Turbo hoàn toàn cục bộ.';

  const res = await engine.synthesize({
    text,
    voice: 'Adam',
    speed: 1.0,
    sampleRate: 48000,
  });

  assert(res.sampleRate === 48000, 'SynthesizeResult sampleRate is 48000 (native)');
  assert(res.channels === 1, 'SynthesizeResult channels is 1 (mono)');
  assert(res.bitDepth === 16, 'SynthesizeResult bitDepth is 16');
  assert(res.durationSec > 1.5 && res.durationSec < 6.0, `Duration is realistic: ${res.durationSec}s`);
  assert(res.audioBuffer instanceof Buffer, 'audioBuffer is a Buffer');

  const parsed = parseWavHeader(res.audioBuffer);
  assert(parsed.sampleRate === 48000, 'WAV header declares 48000 Hz');
  assert(parsed.channels === 1, 'WAV header declares mono');
  assert(parsed.bitDepth === 16, 'WAV header declares 16-bit PCM');
  assert(parsed.dataLength > 10000, 'Audio data chunk is populated');
}

async function testVoiceAliasesSynthesis(): Promise<void> {
  console.log('\n--- 5. Voice Aliases Synthesis (Minh Quân & Mai Phương) ---');

  const engine = new VieNeuTtsEngine({ offline: true });

  // 1. Minh Quân (alias -> Minh Triết)
  const resMinhQuan = await engine.synthesize({
    text: 'Thử nghiệm giọng đọc Minh Quân.',
    voice: 'minh_quan',
  });
  assert(resMinhQuan.sampleRate === 48000, 'Minh Quân synthesized at 48kHz');
  assert(resMinhQuan.durationSec > 1.0, `Minh Quân produced valid duration (${resMinhQuan.durationSec}s)`);

  // 2. Mai Phương (alias -> Mai Anh)
  const resMaiPhuong = await engine.synthesize({
    text: 'Thử nghiệm giọng đọc Mai Phương.',
    voice: 'mai_phuong',
  });
  assert(resMaiPhuong.sampleRate === 48000, 'Mai Phương synthesized at 48kHz');
  assert(resMaiPhuong.durationSec > 1.0, `Mai Phương produced valid duration (${resMaiPhuong.durationSec}s)`);
}

async function testSampleRateResampling(): Promise<void> {
  console.log('\n--- 6. Sample Rate Selection (48kHz native vs 24kHz downsample) ---');

  const engine = new VieNeuTtsEngine({ offline: true });
  const text = 'Kiểm tra chuyển đổi tần số lấy mẫu âm thanh.';

  const res24k = await engine.synthesize({
    text,
    voice: 'Adam',
    sampleRate: 24000,
  });

  assert(res24k.sampleRate === 24000, 'Requested 24kHz produces 24000 Hz sample rate');
  const parsed24k = parseWavHeader(res24k.audioBuffer);
  assert(parsed24k.sampleRate === 24000, 'WAV header correctly declares 24000 Hz');
  assert(parsed24k.channels === 1, '24kHz audio is mono');
  assert(parsed24k.bitDepth === 16, '24kHz audio is 16-bit PCM');
}

async function testSpeedAdjustment(): Promise<void> {
  console.log('\n--- 7. Speech Rate (Time Stretching without Pitch Shift) ---');

  const engine = new VieNeuTtsEngine({ offline: true });
  const text = 'Kiểm tra tính năng tăng tốc độ đọc của bộ tổng hợp giọng nói.';

  const normalRes = await engine.synthesize({ text, voice: 'Adam', speed: 1.0 });
  const fastRes = await engine.synthesize({ text, voice: 'Adam', speed: 1.25 });

  assert(
    fastRes.durationSec < normalRes.durationSec,
    `Speed 1.25 duration (${fastRes.durationSec}s) is shorter than speed 1.0 (${normalRes.durationSec}s)`
  );
  const ratio = normalRes.durationSec / fastRes.durationSec;
  assert(
    Math.abs(ratio - 1.25) < 0.15,
    `Duration ratio (${ratio.toFixed(2)}) is close to expected speed ratio 1.25`
  );
}

async function testWavConcatenationAutoDetection(): Promise<void> {
  console.log('\n--- 8. Lossless WAV Concatenation Sample Rate Auto-Detection ---');

  // 1. 48kHz WAV buffers (VieNeu native)
  const pcm48k_1 = Buffer.alloc(48000 * 2, 1); // 1.0s at 48kHz 16-bit mono (96,000 bytes)
  const wav48k_1 = createWavFile(pcm48k_1, 48000, 1, 16);
  const pcm48k_2 = Buffer.alloc(24000 * 2, 2); // 0.5s at 48kHz 16-bit mono (48,000 bytes)
  const wav48k_2 = createWavFile(pcm48k_2, 48000, 1, 16);

  // Concatenate without providing sampleRate: should auto-detect 48000!
  const concat48k = concatenateWavBuffers([wav48k_1, wav48k_2], 100);
  const parsedConcat48k = parseWavHeader(concat48k);

  assert(
    parsedConcat48k.sampleRate === 48000,
    `concatenateWavBuffers auto-detected 48000 Hz from 48kHz inputs (got ${parsedConcat48k.sampleRate})`
  );
  assert(parsedConcat48k.channels === 1, 'Concatenated WAV is mono');
  assert(
    Math.abs(parsedConcat48k.durationSec - 1.6) < 0.02,
    `Duration matches 1.0s + 0.1s + 0.5s = 1.6s (got ${parsedConcat48k.durationSec.toFixed(2)}s)`
  );

  // 2. 24kHz WAV buffers (Kokoro fallback)
  const pcm24k_1 = Buffer.alloc(24000 * 2, 1); // 1.0s at 24kHz 16-bit mono (48,000 bytes)
  const wav24k_1 = createWavFile(pcm24k_1, 24000, 1, 16);
  const pcm24k_2 = Buffer.alloc(12000 * 2, 2); // 0.5s at 24kHz 16-bit mono (24,000 bytes)
  const wav24k_2 = createWavFile(pcm24k_2, 24000, 1, 16);

  const concat24k = concatenateWavBuffers([wav24k_1, wav24k_2], 100);
  const parsedConcat24k = parseWavHeader(concat24k);

  assert(
    parsedConcat24k.sampleRate === 24000,
    `concatenateWavBuffers auto-detected 24000 Hz from 24kHz inputs (got ${parsedConcat24k.sampleRate})`
  );
}

async function testStrictOfflineNetworkGuard(): Promise<void> {
  console.log('\n--- 9. Strict Offline Network Guard Enforcement ---');

  const engine = new VieNeuTtsEngine({ offline: true });

  const guardedResult = await runWithOfflineGuard(async () => {
    return await engine.synthesize({
      text: 'Tổng hợp giọng nói hoàn toàn offline được giám sát nghiêm ngặt.',
      voice: 'Adam',
    });
  });

  assert(guardedResult.sampleRate === 48000, 'Synthesis succeeds within runWithOfflineGuard');
  assert(guardedResult.durationSec > 1.0, 'Valid duration produced under offline guard');
  assert(!isOfflineGuardActive(), 'Offline guard cleanly deactivated after execution');

  // Verify that an actual outbound network attempt is blocked
  let networkBlocked = false;
  try {
    await runWithOfflineGuard(async () => {
      const s = new net.Socket();
      s.connect(443, '1.1.1.1');
    });
  } catch (err: any) {
    if (err instanceof OfflineNetworkViolationError) {
      networkBlocked = true;
    }
  }
  assert(networkBlocked, 'Offline network guard intercepts and blocks unauthorized socket connect');
}

async function testKokoroFallbackPreserved(): Promise<void> {
  console.log('\n--- 10. Kokoro Fallback Engine Preservation ---');

  const kokoroEngine = new KokoroTtsEngine();
  const kokoroValid = await kokoroEngine.validateModelAssets();
  assert(kokoroValid, 'Kokoro model assets are valid');

  const kokoroRes = await kokoroEngine.synthesize({
    text: 'Kokoro fallback engine remains completely functional.',
    voice: 'am_adam',
  });

  assert(kokoroRes.sampleRate === 24000, 'Kokoro synthesizes at 24kHz mono PCM WAV');
  assert(kokoroRes.durationSec > 1.0, 'Kokoro produces valid audio duration');

  assert(DEFAULT_VOICE === 'am_adam', 'DEFAULT_VOICE remains am_adam for backward compatibility');
  assert(SUPPORTED_VOICES.length === 4, 'SUPPORTED_VOICES length remains 4 for backward compatibility');
  assert(isKokoroVoice('am_adam'), 'isKokoroVoice recognizes am_adam');
}

async function runAllTests(): Promise<void> {
  console.log('======================================================================');
  console.log(' MILESTONE 1: VIENEU-TTS ENGINE & AUDIO SUBSYSTEM TEST SUITE');
  console.log('======================================================================');

  await testExportsAndFactoryResolution();
  await testVoiceCatalogAndAliases();
  await testModelAssetsVerification();
  await testGenuineOfflineSynthesis();
  await testVoiceAliasesSynthesis();
  await testSampleRateResampling();
  await testSpeedAdjustment();
  await testWavConcatenationAutoDetection();
  await testStrictOfflineNetworkGuard();
  await testKokoroFallbackPreserved();

  console.log('\n======================================================================');
  console.log(` ✅ ALL TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('======================================================================\n');
}

runAllTests().catch((err) => {
  console.error('\n❌ Test suite failed with error:', err);
  process.exit(1);
});
