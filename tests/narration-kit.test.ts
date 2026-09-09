/**
 * tests/narration-kit.test.ts
 * Comprehensive Milestone 1 test suite for @videorender/narration-kit,
 * Kokoro-82M TTS engine, WAV mechanics, model setup, and offline network guard.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as net from 'node:net';
import * as dns from 'node:dns';
import * as http from 'node:http';
import {
  KokoroTtsEngine,
  DEFAULT_VOICE,
  SUPPORTED_VOICES,
  VOICE_METADATA,
  isKokoroVoice,
  validateVoice,
  encodeWavHeader,
  parseWavHeader,
  createWavFile,
} from '@videorender/narration-kit';
import * as unscopedKit from 'narration-kit';
import {
  enableOfflineNetworkGuard,
  runWithOfflineGuard,
  isOfflineGuardActive,
  OfflineNetworkViolationError,
} from '../validators/offline-network-guard';
import { computeSha256 } from '../scripts/setup-narration-models';

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

async function testPackagingAndResolution(): Promise<void> {
  console.log('\n--- 1. Packaging & Module Resolution ---');

  assert(Boolean(KokoroTtsEngine), 'KokoroTtsEngine is exported from @videorender/narration-kit');
  assert(DEFAULT_VOICE === 'am_adam', 'DEFAULT_VOICE is "am_adam"');
  assert(SUPPORTED_VOICES.length === 4, 'SUPPORTED_VOICES contains 4 presets');
  assert(typeof encodeWavHeader === 'function', 'encodeWavHeader is exported');
  assert(typeof parseWavHeader === 'function', 'parseWavHeader is exported');

  // Test unscoped alias 'narration-kit'
  assert(Boolean(unscopedKit.KokoroTtsEngine), 'unscoped narration-kit exports KokoroTtsEngine');
  assert(unscopedKit.DEFAULT_VOICE === DEFAULT_VOICE, 'unscoped narration-kit matches scoped constants');
}

async function testWavMechanics(): Promise<void> {
  console.log('\n--- 2. WAV Header & Audio Structure Mechanics ---');

  const pcmBytesLength = 48000; // 1 second at 24kHz 16-bit mono (24000 * 2)
  const header = encodeWavHeader(pcmBytesLength, 24000, 1, 16);

  assert(header.length === 44, 'WAV header is exactly 44 bytes');
  assert(header.toString('ascii', 0, 4) === 'RIFF', 'Header begins with RIFF signature');
  assert(header.toString('ascii', 8, 12) === 'WAVE', 'Header contains WAVE format');
  assert(header.toString('ascii', 12, 16) === 'fmt ', 'Header contains fmt subchunk');
  assert(header.readUInt16LE(20) === 1, 'Audio format is 1 (PCM uncompressed)');
  assert(header.readUInt16LE(22) === 1, 'Channel count is 1 (mono)');
  assert(header.readUInt32LE(24) === 24000, 'Sample rate is 24,000 Hz');
  assert(header.readUInt32LE(28) === 48000, 'Byte rate is 48,000 bytes/sec');
  assert(header.readUInt16LE(32) === 2, 'Block align is 2 bytes');
  assert(header.readUInt16LE(34) === 16, 'Bits per sample is 16');
  assert(header.toString('ascii', 36, 40) === 'data', 'Header contains data chunk');
  assert(header.readUInt32LE(40) === pcmBytesLength, 'Data subchunk length matches requested length');

  // Test parseWavHeader
  const dummyPcm = Buffer.alloc(pcmBytesLength);
  const fullWav = createWavFile(dummyPcm, 24000, 1, 16);
  assert(fullWav.length === 44 + pcmBytesLength, 'createWavFile creates correct total buffer size');

  const parsed = parseWavHeader(fullWav);
  assert(parsed.sampleRate === 24000, 'parseWavHeader parses 24000 Hz');
  assert(parsed.channels === 1, 'parseWavHeader parses 1 channel');
  assert(parsed.bitDepth === 16, 'parseWavHeader parses 16 bits');
  assert(parsed.durationSec === 1.0, 'parseWavHeader computes 1.0s duration');

  // Test error handling
  let errorCaught = false;
  try {
    parseWavHeader(Buffer.from('too-short'));
  } catch {
    errorCaught = true;
  }
  assert(errorCaught, 'parseWavHeader rejects buffers under 44 bytes');
}

async function testVoicePresetsAndValidation(): Promise<void> {
  console.log('\n--- 3. Voice Presets & Validation ---');

  const expectedVoices = ['am_adam', 'am_fenrir', 'am_michael', 'am_onyx'] as const;
  for (const v of expectedVoices) {
    assert(isKokoroVoice(v), `isKokoroVoice returns true for "${v}"`);
    assert(validateVoice(v) === v, `validateVoice returns "${v}"`);
    assert(Boolean(VOICE_METADATA[v]), `VOICE_METADATA exists for "${v}"`);
    assert(VOICE_METADATA[v].language === 'en-us', `"${v}" language is "en-us"`);
  }

  assert(!isKokoroVoice('invalid_voice'), 'isKokoroVoice returns false for invalid voice');
  let invalidVoiceError = false;
  try {
    validateVoice('invalid_voice');
  } catch {
    invalidVoiceError = true;
  }
  assert(invalidVoiceError, 'validateVoice throws descriptive error for invalid voice');
}

async function testModelAssetsIntegrity(): Promise<void> {
  console.log('\n--- 4. Model Assets Verification ---');

  const repoRoot = path.resolve(__dirname, '..');
  const kokoroModelPath = path.join(repoRoot, 'models', 'kokoro', 'kokoro-v1.0.onnx');
  const voicesBundlePath = path.join(repoRoot, 'models', 'kokoro', 'voices-v1.0.bin');

  assert(fs.existsSync(kokoroModelPath), 'kokoro-v1.0.onnx exists in models/kokoro/');
  assert(fs.existsSync(voicesBundlePath), 'voices-v1.0.bin exists in models/kokoro/');

  const modelHash = await computeSha256(kokoroModelPath);
  const validModelHashes = [
    '7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5',
    'beb0d1848dee9a49da392cc3df26958d46cfa35d321edf434f52949153f0df3a',
  ];
  assert(validModelHashes.includes(modelHash), `kokoro-v1.0.onnx SHA256 is valid (${modelHash.slice(0, 16)}...)`);

  const voicesHash = await computeSha256(voicesBundlePath);
  assert(
    voicesHash === 'bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d',
    'voices-v1.0.bin SHA256 is valid'
  );

  for (const v of ['am_adam', 'am_fenrir', 'am_michael', 'am_onyx']) {
    const voiceFile = path.join(repoRoot, 'models', 'kokoro', 'voices', `${v}.bin`);
    assert(fs.existsSync(voiceFile), `Individual voice file exists: ${v}.bin`);
    const voiceStat = await fs.promises.stat(voiceFile);
    assert(voiceStat.size === 522240, `${v}.bin size is exactly 522,240 bytes`);
  }

  // Check models/README.md
  const readmePath = path.join(repoRoot, 'models', 'README.md');
  assert(fs.existsSync(readmePath), 'models/README.md exists');
  const readmeContent = await fs.promises.readFile(readmePath, 'utf-8');
  assert(readmeContent.includes('kokoro-v1.0.onnx'), 'README.md documents kokoro-v1.0.onnx');
  assert(readmeContent.includes('npm run narration:setup'), 'README.md documents setup commands');
}

async function testKokoroSynthesis(): Promise<void> {
  console.log('\n--- 5. Real Kokoro-82M TTS Synthesis (Genuine Inference) ---');

  const engine = new KokoroTtsEngine();
  const valid = await engine.validateModelAssets();
  assert(valid, 'validateModelAssets returns true');

  // Test default voice (am_adam)
  const text = 'Remotion explainer animations require precise twenty-four kilohertz narration.';
  const res = await engine.synthesize({
    text,
    voice: 'am_adam',
    speed: 1.0,
  });

  assert(res.sampleRate === 24000, 'SynthesizeResult sampleRate is 24000');
  assert(res.channels === 1, 'SynthesizeResult channels is 1 (mono)');
  assert(res.durationSec > 1.0 && res.durationSec < 10.0, `Duration is realistic (${res.durationSec}s)`);
  assert(res.audioBuffer instanceof Buffer, 'SynthesizeResult audioBuffer is a Buffer');
  assert(res.audioBuffer.length > 44, 'audioBuffer has audio data beyond header');

  const parsed = parseWavHeader(res.audioBuffer);
  assert(parsed.sampleRate === 24000, 'Audio buffer header sampleRate is 24000');
  assert(parsed.channels === 1, 'Audio buffer header channels is 1');
  assert(parsed.bitDepth === 16, 'Audio buffer header bitDepth is 16');

  // Test synthesis writing directly to custom output path
  const tempOut = path.join(
    path.resolve(__dirname, '..'),
    'out',
    'temp',
    `test_custom_${Date.now()}.wav`
  );
  const customRes = await engine.synthesize({
    text: 'Custom output path verification.',
    outputPath: tempOut,
  });

  assert(Boolean(customRes.outputPath), 'customRes contains outputPath');
  assert(fs.existsSync(tempOut), 'Output file was written to disk at specified outputPath');
  const fileBytes = await fs.promises.readFile(tempOut);
  assert(fileBytes.equals(customRes.audioBuffer), 'Disk file matches returned audioBuffer byte-for-byte');
  await fs.promises.unlink(tempOut);
}

async function testVoicePresetsSynthesis(): Promise<void> {
  console.log('\n--- 6. Multi-Voice Preset Synthesis ---');

  const engine = new KokoroTtsEngine();
  const voices = ['am_fenrir', 'am_michael', 'am_onyx'] as const;

  for (const voice of voices) {
    const res = await engine.synthesize({
      text: `Testing voice preset ${voice}.`,
      voice,
    });
    assert(res.sampleRate === 24000, `Voice ${voice} synthesized at 24000 Hz`);
    assert(res.channels === 1, `Voice ${voice} synthesized mono`);
    assert(res.durationSec > 0.5, `Voice ${voice} generated valid duration (${res.durationSec}s)`);
  }
}

async function testOfflineNetworkGuard(): Promise<void> {
  console.log('\n--- 7. Strict Offline Network Guard ---');

  assert(!isOfflineGuardActive(), 'Offline guard is initially inactive');

  const restore = enableOfflineNetworkGuard();
  assert(isOfflineGuardActive(), 'Offline guard is active after enable');

  // 1. External fetch blocked
  let fetchBlocked = false;
  try {
    await fetch('https://api.openai.com/v1/models');
  } catch (e: any) {
    if (e instanceof OfflineNetworkViolationError && e.primitive === 'globalThis.fetch') {
      fetchBlocked = true;
    }
  }
  assert(fetchBlocked, 'Guard intercepts and blocks globalThis.fetch');

  // 2. External raw TCP socket blocked
  let netBlocked = false;
  try {
    const s = new net.Socket();
    s.connect(443, '8.8.8.8');
  } catch (e: any) {
    if (e instanceof OfflineNetworkViolationError && e.primitive === 'net.Socket.connect') {
      netBlocked = true;
    }
  }
  assert(netBlocked, 'Guard intercepts and blocks net.Socket.connect');

  // 3. DNS lookup blocked
  let dnsBlocked = false;
  try {
    await dns.promises.lookup('google.com');
  } catch (e: any) {
    if (e instanceof OfflineNetworkViolationError && e.primitive === 'dns.promises.lookup') {
      dnsBlocked = true;
    }
  }
  assert(dnsBlocked, 'Guard intercepts and blocks dns.promises.lookup');

  restore();
  assert(!isOfflineGuardActive(), 'Offline guard is inactive after restore');

  // 4. Test allowLocalhost
  const server = http.createServer((_, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('guard-local-ok');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;

  const restoreLocal = enableOfflineNetworkGuard({ allowLocalhost: true });
  const localRes = await fetch(`http://127.0.0.1:${port}`);
  const text = await localRes.text();
  assert(text === 'guard-local-ok', 'Localhost fetch allowed when allowLocalhost is true');

  let extBlockedUnderLocal = false;
  try {
    await fetch('https://example.org');
  } catch (e: any) {
    if (e instanceof OfflineNetworkViolationError) extBlockedUnderLocal = true;
  }
  assert(extBlockedUnderLocal, 'External fetch blocked even when allowLocalhost is true');

  restoreLocal();
  server.close();

  // 5. Test runWithOfflineGuard with local synthesis
  const synthUnderGuard = await runWithOfflineGuard(async () => {
    const engine = new KokoroTtsEngine({ offline: true });
    return await engine.synthesize({
      text: 'Verified synthesis under strict offline guard execution.',
      voice: 'am_adam',
    });
  });

  assert(synthUnderGuard.sampleRate === 24000, 'Local synthesis succeeds under runWithOfflineGuard');
  assert(synthUnderGuard.durationSec > 1.0, 'Audio duration valid under runWithOfflineGuard');
  assert(!isOfflineGuardActive(), 'Guard automatically restored after runWithOfflineGuard');
}

async function runTestSuite(): Promise<void> {
  const startTime = Date.now();
  console.log('======================================================');
  console.log(' Milestone 1 Narration Kit Test Suite');
  console.log('======================================================');

  try {
    await testPackagingAndResolution();
    await testWavMechanics();
    await testVoicePresetsAndValidation();
    await testModelAssetsIntegrity();
    await testKokoroSynthesis();
    await testVoicePresetsSynthesis();
    await testOfflineNetworkGuard();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n======================================================');
    console.log(` ✅ ALL TESTS PASSED: ${passedTests}/${totalTests} in ${elapsed}s`);
    console.log('======================================================\n');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ Test Suite Failed with Error:\n', err);
    process.exit(1);
  }
}

runTestSuite();
