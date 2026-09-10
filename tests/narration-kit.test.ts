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
  TextNormalizer,
  normalizeText,
  createNarrationTextMap,
  PROSODY_PROFILES,
  resolveProsodyProfile,
  clampSpeed,
  clampPause,
  NarrationChunker,
  chunkText,
  chunkShotSpec,
  extractPcmData,
  generateSilencePcm,
  concatenateWavBuffers,
  validateAlignment,
  normalizeAlignment,
  WhisperXLocalAligner,
  segmentCaptions,
  CaptionSegmenter,
  resolveCaptionPlacement,
  planSafeAreaPlacement,
  computeAabbIntersection,
  checkAabbCollision,
  validateCaptionBoxLayout,
  isWithinSafeArea,
  clampToSafeArea,
  computePresetBox,
  getActiveCaption,
  resolveActiveGroup as resolveActiveGroupManifest,
  computeLoudnessStats,
  normalizePcmLoudness,
  normalizeWavBuffer,
  normalizeWavFile,
  mixAudio,
  mixAudioTracks,
  generateDuckingEnvelope,
  readWavToStereo48k,
  AudioMixer,
  createAudioManifest,
  generateAudioManifest,
  validateAudioManifest,
  deriveCuesFromNarration,
  createCueManifestFromNarration,
  deriveSemanticCues,
  deriveCues,
  generateNarrationPipeline,
  WhisperXAligner,
} from '@videorender/narration-kit';
import {
  calculateProgressiveFill,
  computeClipPathInset,
  resolveActiveGroup,
  EDUCATIONAL_THEME,
  KaraokeWord,
  KaraokeLine,
  KaraokeGroup,
  KaraokeCaptions,
} from '@videorender/caption-kit';
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

async function testNormalizationSubsystem(): Promise<void> {
  console.log('\n--- 8. Text Normalization Subsystem ---');

  const normalizer = new TextNormalizer();
  const yearRes = normalizer.normalize('In 2026, AI runs at 24kHz.');
  assert(yearRes.includes('twenty twenty-six'), 'normalizer.normalize expands 4-digit years');
  assert(yearRes.includes('A I'), 'normalizer.normalize expands AI acronym');
  assert(yearRes.includes('kilohertz'), 'normalizer.normalize expands 24kHz unit');

  const currRes = normalizeText('$1,000,000,000,000 and -$50.25 with +99.9%');
  assert(/one trillion dollars/i.test(currRes), 'normalizeText expands $1T to one trillion dollars');
  assert(/negative fifty dollars/i.test(currRes), 'normalizeText expands -$50.25 to negative fifty dollars');
  assert(/ninety-nine point nine percent/i.test(currRes), 'normalizeText expands +99.9% to ninety-nine point nine percent');

  const dateRes = normalizeText('On 12/05/2026');
  assert(dateRes.toLowerCase().includes('december fifth twenty twenty-six'), 'normalizeText expands MM/DD/YYYY dates');

  const urlRes = normalizeText('Visit https://remotion.dev/docs?version=v3#intro');
  assert(urlRes.includes('h t t p s') && urlRes.includes('remotion dot dev'), 'normalizeText expands URLs');

  const unicodeRes = normalizeText('“Wait—look at that… ‘offline’!”');
  assert(!unicodeRes.includes('“') && !unicodeRes.includes('”') && !unicodeRes.includes('—'), 'normalizeText sanitizes Unicode characters');

  assert(normalizeText('') === '', 'normalizeText returns empty string for empty input');
  assert(normalizeText('   \n\t  ') === '', 'normalizeText returns empty string for whitespace input');

  // Test createNarrationTextMap
  const sample = 'In 2026, AI models run at 24kHz locally.';
  const map = createNarrationTextMap(sample);
  assert(map.version === '1.0.0', 'map.version is 1.0.0');
  assert(map.originalText === sample, 'map.originalText matches verbatim');
  assert(map.tokens.length > 0, 'map.tokens is non-empty');

  for (let i = 0; i < map.tokens.length; i++) {
    const t = map.tokens[i];
    const sliced = sample.slice(t.originalSpan[0], t.originalSpan[1]);
    assert(sliced === t.originalWord, `Token ${t.id} originalSpan slices back to originalWord "${t.originalWord}"`);
    assert(Array.isArray(t.spokenWords) && t.spokenWords.length >= 1, `Token ${t.id} spokenWords is non-empty array`);
    if (i > 0) {
      assert(t.originalSpan[0] >= map.tokens[i - 1].originalSpan[1], `Token ${t.id} span does not overlap preceding token`);
    }
  }
}

async function testProsodyAndChunkingSubsystem(): Promise<void> {
  console.log('\n--- 9. Deterministic Prosody & Narration Chunking ---');

  const profiles = ['documentary', 'educational', 'energetic', 'calm', 'dramatic', 'solemn'] as const;
  for (const name of profiles) {
    assert(Boolean(PROSODY_PROFILES[name]), `PROSODY_PROFILES defines "${name}"`);
    const p = PROSODY_PROFILES[name];
    assert(p.speed >= 0.5 && p.speed <= 2.0, `Profile ${name} speed ${p.speed} is in [0.5, 2.0]`);
    assert(p.pauseSec >= 0.0 && p.pauseSec <= 5.0, `Profile ${name} pauseSec is in [0.0, 5.0]`);
    assert(p.sentencePauseMs === Math.round(p.pauseSec * 1000) || p.pauseAfterSentence === p.pauseSec, `Dual representation matches in ${name}`);
  }

  assert(resolveProsodyProfile('educational').speed === 1.0, 'educational profile speed is standard 1.0');
  assert(resolveProsodyProfile('unknown_name').name === 'educational', 'resolveProsodyProfile defaults cleanly to educational');
  assert(clampSpeed(0.1) === 0.5, 'clampSpeed clamps sub-minimum to 0.5');
  assert(clampSpeed(5.0) === 2.0, 'clampSpeed clamps excessive to 2.0');
  assert(clampPause(-1.0) === 0.0, 'clampPause clamps negative to 0.0');
  assert(clampPause(10.0) === 5.0, 'clampPause clamps excessive to 5.0');

  // Chunking
  const chunker = new NarrationChunker();
  const chunks = chunker.chunkText('Paragraph one sentence one. Paragraph one sentence two.\n\nParagraph two sentence three.');
  assert(chunks.length === 3, `chunkText produces 3 chunks for 3 sentences, got ${chunks.length}`);
  assert(chunks[0].pauseAfterMs === PROSODY_PROFILES.educational.sentencePauseMs, 'Intra-paragraph sentence has sentencePauseMs');
  assert(chunks[1].pauseAfterMs === PROSODY_PROFILES.educational.paragraphPauseMs, 'Inter-paragraph sentence has paragraphPauseMs');

  // ShotSpec chunking
  const shotSpecs = [
    { shot_id: 'shot_1', text: 'Introductory sentence.', narration_profile: 'energetic', pause_after: 0.5 },
    { shot_id: 'shot_2', text: 'Second shot text.', narration_profile: 'calm', pause_after: 1.0 },
  ];
  const shotChunks = chunkShotSpec(shotSpecs);
  assert(shotChunks.length === 2, 'chunkShotSpec produced 2 chunks for 2 shots');
  assert(shotChunks[0].shotId === 'shot_1', 'chunk 0 has shotId shot_1');
  assert(shotChunks[0].profile.name === 'energetic', 'chunk 0 respects energetic profile override');
  assert(shotChunks[0].pauseAfterMs === 500, 'chunk 0 pauseAfterMs matches pause_after 0.5s');
  assert(shotChunks[1].shotId === 'shot_2', 'chunk 1 has shotId shot_2');
  assert(shotChunks[1].profile.name === 'calm', 'chunk 1 respects calm profile override');
  assert(shotChunks[1].pauseAfterMs === 1000, 'chunk 1 pauseAfterMs matches pause_after 1.0s');
}

async function testWavPcmUtilities(): Promise<void> {
  console.log('\n--- 10. Lossless WAV PCM Utilities & Concatenation ---');

  const pcm1 = Buffer.alloc(48000, 1); // 1.0s at 24kHz 16-bit mono
  const wav1 = createWavFile(pcm1, 24000, 1, 16);
  const pcm2 = Buffer.alloc(24000, 2); // 0.5s at 24kHz 16-bit mono
  const wav2 = createWavFile(pcm2, 24000, 1, 16);

  const extracted = extractPcmData(wav1);
  assert(extracted.length === 48000, 'extractPcmData extracts exact PCM data length');
  assert(extracted.equals(pcm1), 'extractPcmData matches original PCM data byte-for-byte');

  const silence = generateSilencePcm(500, 24000, 1, 16);
  assert(silence.length === 24000, 'generateSilencePcm(500ms) generates 24,000 bytes (48 bytes/ms)');
  assert(silence.every((b) => b === 0), 'generateSilencePcm contains only zero bytes');

  // Concatenate with 200ms gap (200 * 48 = 9600 bytes)
  const concatWav = concatenateWavBuffers([wav1, wav2], 200, 24000, 1, 16);
  const parsedConcat = parseWavHeader(concatWav);
  const expectedPcmLength = 48000 + 9600 + 24000;
  assert(parsedConcat.dataLength === expectedPcmLength, `Concatenated WAV data length is ${expectedPcmLength}, got ${parsedConcat.dataLength}`);
  assert(Math.abs(parsedConcat.durationSec - 1.7) < 0.01, 'Concatenated WAV duration matches sum of chunks and gap (1.7s)');
}

async function testAlignmentSubsystem(): Promise<void> {
  console.log('\n--- 11. Alignment Interfaces & Quality Gates ---');

  const mockWords = [
    { id: 'w0', word: 'In', cleanWord: 'in', start: 0.06, end: 0.22, confidence: 0.94, punctuation: '' },
    { id: 'w1', word: 'twenty', cleanWord: 'twenty', start: 0.24, end: 0.58, confidence: 0.91, punctuation: '' },
    { id: 'w2', word: 'twenty-six,', cleanWord: 'twenty-six', start: 0.60, end: 1.12, confidence: 0.89, punctuation: ',' },
  ];

  // 1. Valid alignment passes
  const validReport = validateAlignment(mockWords, ['in', 'twenty', 'twenty-six']);
  assert(validReport.valid, 'Valid alignment passes validateAlignment');
  assert(validReport.errors.length === 0, 'Valid alignment has zero errors');

  // 2. Reverse timestamp rejected
  const reverseWords = [
    { id: 'w0', word: 'In', cleanWord: 'in', start: 1.0, end: 1.5, confidence: 0.9, punctuation: '' },
    { id: 'w1', word: 'twenty', cleanWord: 'twenty', start: 0.5, end: 1.2, confidence: 0.9, punctuation: '' },
  ];
  const reverseReport = validateAlignment(reverseWords);
  assert(!reverseReport.valid, 'Reverse start timestamps rejected by quality gate');

  // 3. Negative start timestamp rejected
  const negWords = [
    { id: 'w0', word: 'In', cleanWord: 'in', start: -0.1, end: 0.5, confidence: 0.9, punctuation: '' },
  ];
  const negReport = validateAlignment(negWords);
  assert(!negReport.valid, 'Negative start timestamp rejected by quality gate');

  // 4. Token fidelity mismatch rejected
  const fidelityReport = validateAlignment(mockWords, ['in', 'twenty', 'wrong-word']);
  assert(!fidelityReport.valid, 'Word token mismatch rejected by token fidelity check');

  // 5. Test normalizeAlignment
  const unnormalizedWords = [
    { id: 'raw1', word: 'Hello!', cleanWord: 'hello', start: 0.1, end: 0.1, confidence: 0.9, punctuation: '!' },
    { id: 'raw2', word: 'world.', cleanWord: 'world', start: 0.08, end: 0.5, confidence: 0.85, punctuation: '.' },
  ];
  const normWords = normalizeAlignment(unnormalizedWords);
  assert(normWords[0].id === 'w0', 'normalizeAlignment assigns sequential w0 ID');
  assert(normWords[1].id === 'w1', 'normalizeAlignment assigns sequential w1 ID');
  assert(normWords[0].end > normWords[0].start, 'normalizeAlignment fixes zero-duration word');
  assert(normWords[1].start >= normWords[0].end, 'normalizeAlignment clamps overlap for visual karaoke highlight');
}

async function testCaptionsSubsystem(): Promise<void> {
  console.log('\n--- 12. Caption Subsystem & Safe Area Placement ---');

  // 1. Safe Area Placement Geometry & AABB Collision
  const box1 = { x: 100, y: 100, width: 200, height: 100 };
  const box2 = { x: 150, y: 150, width: 200, height: 100 };
  const intersectionArea = computeAabbIntersection(box1, box2);
  assert(intersectionArea === 7500, `computeAabbIntersection calculated 7500 (got ${intersectionArea})`);
  assert(checkAabbCollision(box1, box2), 'checkAabbCollision detected collision between overlapping boxes');

  const disjointBox = { x: 500, y: 500, width: 100, height: 100 };
  assert(computeAabbIntersection(box1, disjointBox) === 0, 'computeAabbIntersection returns 0 for disjoint boxes');
  assert(!checkAabbCollision(box1, disjointBox), 'checkAabbCollision returns false for disjoint boxes');

  // 2. Safe Area Invariants (SMPTE/EBU 96px on 1920x1080)
  const defaultBottom = computePresetBox('bottom');
  assert(defaultBottom.x === 192, 'Default bottom box horizontally centered at x=192');
  assert(defaultBottom.y === 864, 'Default bottom box y matches safe boundary 864 (1080 - 96 - 120)');
  assert(defaultBottom.width === 1536, 'Default bottom box width is 1536');
  assert(defaultBottom.height === 120, 'Default bottom box height is 120');
  assert(isWithinSafeArea(defaultBottom), 'Default bottom box is completely within safe area');

  const defaultTop = computePresetBox('top');
  assert(defaultTop.x === 192, 'Default top box horizontally centered at x=192');
  assert(defaultTop.y === 96, 'Default top box y starts at safe margin 96');
  assert(isWithinSafeArea(defaultTop), 'Default top box is completely within safe area');

  const lowerLeft = computePresetBox('lower-left');
  assert(lowerLeft.x === 96, 'Lower-left box starts at left margin 96');
  assert(isWithinSafeArea(lowerLeft), 'Lower-left box is completely within safe area');

  const lowerRight = computePresetBox('lower-right');
  assert(lowerRight.x + lowerRight.width === 1920 - 96, 'Lower-right box ends at right margin 1824');
  assert(isWithinSafeArea(lowerRight), 'Lower-right box is completely within safe area');

  // 3. Multi-aspect ratio placement
  const portraitPlacement = computePresetBox('bottom', { viewport: { width: 1080, height: 1920 } });
  assert(portraitPlacement.width === 1080 - 2 * 96, '9:16 portrait safe width is 888px');
  assert(portraitPlacement.x === 96, '9:16 portrait x starts at 96');
  assert(portraitPlacement.y + portraitPlacement.height <= 1920 - 96, '9:16 portrait fits within safe boundary');

  const squarePlacement = computePresetBox('bottom', { viewport: { width: 1080, height: 1080 } });
  assert(squarePlacement.width === 1080 - 2 * 96, '1:1 square safe width is 888px');
  assert(squarePlacement.height === 100, '1:1 square height is 100px');

  // 4. Dynamic subject collision avoidance
  const subjectBottom = { x: 500, y: 750, width: 920, height: 280 };
  const resolvedPlacement = resolveCaptionPlacement({
    position: 'auto',
    subjectRegion: subjectBottom,
  });
  assert(resolvedPlacement.position === 'top', 'resolveCaptionPlacement dynamically relocated bottom to top on subject collision');
  assert(resolvedPlacement.box.y === 96, 'Repositioned top box is at y=96');
  assert(computeAabbIntersection(resolvedPlacement.box, subjectBottom) === 0, 'Repositioned top box has 0 overlap with subject');

  // 5. Layout validator
  const validReport = validateCaptionBoxLayout(defaultBottom);
  assert(validReport.valid, 'Valid box passes validateCaptionBoxLayout');
  const encroachingBox = { x: 50, y: 864, width: 1536, height: 120 };
  const invalidReport = validateCaptionBoxLayout(encroachingBox);
  assert(!invalidReport.valid, 'Encroaching box fails validateCaptionBoxLayout for safe margin breach');

  // 6. Caption Segmentation Engine
  const sampleWords = [
    { id: 'w0', word: 'In', cleanWord: 'in', start: 0.06, end: 0.22, confidence: 0.95, punctuation: '' },
    { id: 'w1', word: 'twenty', cleanWord: 'twenty', start: 0.24, end: 0.58, confidence: 0.95, punctuation: '' },
    { id: 'w2', word: 'twenty-six,', cleanWord: 'twenty-six', start: 0.60, end: 1.12, confidence: 0.95, punctuation: ',' },
    { id: 'w3', word: 'AI', cleanWord: 'ai', start: 1.36, end: 1.55, confidence: 0.95, punctuation: '' },
    { id: 'w4', word: 'models', cleanWord: 'models', start: 1.58, end: 1.98, confidence: 0.95, punctuation: '' },
    { id: 'w5', word: 'run', cleanWord: 'run', start: 2.02, end: 2.25, confidence: 0.95, punctuation: '' },
    { id: 'w6', word: 'locally.', cleanWord: 'locally', start: 2.28, end: 2.70, confidence: 0.95, punctuation: '.' },
  ];

  const manifest = segmentCaptions(sampleWords, { fps: 30 });
  assert(manifest.version === '1.0.0', 'CaptionsManifest version is 1.0.0');
  assert(manifest.fps === 30, 'CaptionsManifest fps is 30');
  assert(manifest.groups.length >= 2, 'segmentCaptions split phrases into at least 2 groups');

  // Check group constraints
  let totalCaptionWords = 0;
  for (const group of manifest.groups) {
    assert(group.lines.length >= 1 && group.lines.length <= 2, `Group ${group.id} line count in [1, 2]`);
    for (const line of group.lines) {
      assert(line.text.length <= 42, `Line text "${line.text}" length <= 42`);
      totalCaptionWords += line.words.length;
    }
    const duration = group.endTime - group.startTime;
    assert(duration >= 0.8 && duration <= 7.0, `Group ${group.id} duration ${duration.toFixed(2)}s in [0.8s, 7.0s]`);
    const totalChars = group.lines.reduce((acc, l) => acc + l.text.length, 0);
    const cps = totalChars / duration;
    assert(cps <= 21.0, `Group ${group.id} CPS ${cps.toFixed(2)} <= 21.0`);
    assert(group.startFrame < group.endFrame, `Group ${group.id} startFrame < endFrame`);
  }
  assert(totalCaptionWords === sampleWords.length, '100% word completeness: every word appears in captions manifest');

  // Check consecutive frame non-overlapping
  for (let i = 1; i < manifest.groups.length; i++) {
    assert(
      manifest.groups[i].startFrame >= manifest.groups[i - 1].endFrame,
      `Consecutive groups do not overlap: g${i}.startFrame (${manifest.groups[i].startFrame}) >= g${i - 1}.endFrame (${manifest.groups[i - 1].endFrame})`
    );
  }

  // 7. CaptionSegmenter class wrapper (QA governance contract)
  const segmenter = new CaptionSegmenter();
  const classManifest = segmenter.segment(sampleWords);
  assert(classManifest.groups.length === manifest.groups.length, 'CaptionSegmenter instance method produces identical group count');
  const staticManifest = CaptionSegmenter.segment(sampleWords);
  assert(staticManifest.groups.length === manifest.groups.length, 'CaptionSegmenter static method produces identical group count');

  // 8. Remotion Karaoke Kit Utilities & Progressive Fill
  assert(calculateProgressiveFill(10, 20, 50) === 0.0, 'calculateProgressiveFill is 0.0 before startFrame');
  assert(calculateProgressiveFill(20, 20, 50) === 0.0, 'calculateProgressiveFill is 0.0 at startFrame');
  assert(calculateProgressiveFill(35, 20, 50) === 0.5, 'calculateProgressiveFill is 0.5 at midpoint');
  assert(calculateProgressiveFill(50, 20, 50) === 1.0, 'calculateProgressiveFill is 1.0 at endFrame');
  assert(calculateProgressiveFill(60, 20, 50) === 1.0, 'calculateProgressiveFill is 1.0 after endFrame');
  assert(calculateProgressiveFill(25, 25, 25) === 1.0, 'calculateProgressiveFill handles zero-duration safely');

  assert(computeClipPathInset(0.0) === 'inset(0 100.00% 0 0)', 'computeClipPathInset(0.0) format matches');
  assert(computeClipPathInset(0.5) === 'inset(0 50.00% 0 0)', 'computeClipPathInset(0.5) format matches');
  assert(computeClipPathInset(1.0) === 'inset(0 0.00% 0 0)', 'computeClipPathInset(1.0) format matches');
  assert(computeClipPathInset(-0.5) === 'inset(0 100.00% 0 0)', 'computeClipPathInset clamps negative progress');
  assert(computeClipPathInset(1.5) === 'inset(0 0.00% 0 0)', 'computeClipPathInset clamps overflow progress');

  // 9. Frame-accurate active group resolution
  const g0 = manifest.groups[0];
  const activeDuringG0 = resolveActiveGroup(manifest, g0.startFrame + 5);
  assert(activeDuringG0?.id === g0.id, 'resolveActiveGroup correctly identifies active group during speech');
  const inactiveBefore = resolveActiveGroup(manifest, -5);
  assert(inactiveBefore === null, 'resolveActiveGroup returns null for negative frame');

  // 10. Educational Art Direction Theme
  assert(EDUCATIONAL_THEME.upcoming.color === '#94a3b8', 'Upcoming color is slate-400 (#94a3b8)');
  assert(EDUCATIONAL_THEME.active.color === '#38bdf8', 'Active color is sky-400 (#38bdf8)');
  assert(EDUCATIONAL_THEME.spoken.color === '#cbd5e1', 'Spoken color is slate-300 (#cbd5e1)');
  assert(EDUCATIONAL_THEME.upcoming.transform === 'none', 'Upcoming transform is strictly none');
  assert(EDUCATIONAL_THEME.active.transform === 'none', 'Active transform is strictly none');
  assert(EDUCATIONAL_THEME.spoken.transform === 'none', 'Spoken transform is strictly none');

  // 11. React Component Exports
  assert(typeof KaraokeWord === 'function', 'KaraokeWord is exported React component function');
  assert(typeof KaraokeLine === 'function', 'KaraokeLine is exported React component function');
  assert(typeof KaraokeGroup === 'function', 'KaraokeGroup is exported React component function');
  assert(typeof KaraokeCaptions === 'function', 'KaraokeCaptions is exported React component function');
}

async function testAudioNormalizationSubsystem(): Promise<void> {
  console.log('\n--- 13. Audio Normalization & True-Peak Limiter (BS.1770-4 / EBU R128) ---');

  // Test 1: Sine wave tone loudness stats
  const sampleRate = 24000;
  const numSamples = sampleRate; // 1.0 second
  const sine = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    sine[i] = 0.5 * Math.sin((2 * Math.PI * 1000 * i) / sampleRate);
  }

  const initialStats = computeLoudnessStats(sine, sampleRate, 1);
  assert(initialStats.peakLinear > 0.49 && initialStats.peakLinear <= 0.51, 'Sample peak is ~0.5');
  assert(initialStats.peakDbfs > -6.5 && initialStats.peakDbfs < -5.5, 'Sample peak is ~ -6.0 dBFS');
  assert(initialStats.truePeakDbfs <= -5.5, 'True peak estimated properly');
  assert(initialStats.integratedLufs > -50 && initialStats.integratedLufs < -5, 'Integrated LUFS calculated');
  assert(initialStats.clippedSamples === 0, 'No clipped samples in clean sine wave');

  // Test 2: Normalization to -16 LUFS with true peak <= -1.0 dBFS
  const normRes = normalizePcmLoudness(sine, {
    targetLufs: -16.0,
    maxPeakDbfs: -1.0,
    sampleRate,
    channels: 1,
  });
  assert(normRes.normalized.length === numSamples, 'Normalized samples preserve length');
  assert(normRes.stats.truePeakDbfs <= -1.0, 'True peak strictly <= -1.0 dBFS');
  assert(normRes.stats.clippedSamples === 0, 'Clipped samples strictly 0');
  assert(normRes.stats.integratedLufs >= -17.5 && normRes.stats.integratedLufs <= -14.5, 'Loudness is in [-17.5, -14.5] window');

  // Test 3: Overdriven hot signal capping (gain limiting)
  const hot = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    hot[i] = 2.0 * Math.sin((2 * Math.PI * 440 * i) / sampleRate);
  }
  const hotRes = normalizePcmLoudness(hot, {
    targetLufs: -16.0,
    maxPeakDbfs: -1.0,
    sampleRate,
    channels: 1,
  });
  assert(hotRes.stats.truePeakDbfs <= -1.0, 'Overdriven signal true peak limited <= -1.0 dBFS');
  assert(hotRes.stats.clippedSamples === 0, 'Overdriven signal has 0 clipped samples');

  // Test 4: Silence handling
  const silence = new Float32Array(sampleRate);
  const silenceStats = computeLoudnessStats(silence, sampleRate, 1);
  assert(silenceStats.integratedLufs <= -70, 'Silence integrated loudness is <= -70 LUFS');
  const silenceNorm = normalizePcmLoudness(silence, -16.0);
  assert(silenceNorm.gainApplied === 1.0, 'Silence returns unity gain without NaN');

  // Test 5: normalizeWavBuffer
  const pcm16 = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    pcm16[i] = Math.round(sine[i] * 32767);
  }
  const pcmBuf = Buffer.from(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength);
  const wavBuf = createWavFile(pcmBuf, sampleRate, 1, 16);
  const normWav = normalizeWavBuffer(wavBuf, { targetLufs: -16.0, maxPeakDbfs: -1.0 });
  assert(normWav.buffer.length > 44, 'normalizeWavBuffer returns valid WAV');
  const parsed = parseWavHeader(normWav.buffer);
  assert(parsed.sampleRate === sampleRate, 'Sample rate preserved in WAV header');
  assert(normWav.stats.truePeakDbfs <= -1.0, 'WAV normalization holds peak <= -1.0 dBFS');
  assert(normWav.stats.clippedSamples === 0, 'WAV normalization has 0 clipped samples');
}

async function testAudioMixerAndDuckingSubsystem(): Promise<void> {
  console.log('\n--- 14. Multi-Track Audio Mixing & Dynamic Ducking (48kHz Stereo) ---');

  // Test 1: Dynamic Ducking Envelope
  const sampleRate = 48000;
  const durationSec = 2.0;
  const totalSamples = Math.ceil(durationSec * sampleRate);
  const speechIntervals = [{ startSec: 0.3, endSec: 0.8 }];
  const config = { duckingDepthDb: -12.8, attackMs: 100, releaseMs: 600 };

  const env = generateDuckingEnvelope(totalSamples, sampleRate, speechIntervals, config);
  assert(env[0] === 1.0, 'Envelope starts at 1.0 (full volume)');
  const speechSample = Math.round(0.5 * sampleRate);
  assert(Math.abs(env[speechSample] - 0.229) < 0.02, 'Envelope ducks to ~0.229 during speech');
  const recoveredSample = Math.round(1.8 * sampleRate);
  assert(Math.abs(env[recoveredSample] - 1.0) < 0.02, 'Envelope recovers to 1.0 after release');

  // Test 2: Micro-pause bridging (< 200ms)
  const rapidPauses = [
    { startSec: 0.2, endSec: 0.4 },
    { startSec: 0.5, endSec: 0.7 }, // 100ms gap
  ];
  const bridgedEnv = generateDuckingEnvelope(totalSamples, sampleRate, rapidPauses, config);
  const gapSample = Math.round(0.45 * sampleRate);
  assert(bridgedEnv[gapSample] < 0.3, 'Micro-pause (100ms) bridged without volume pumping');

  // Test 3: AudioMixer class exports
  assert(typeof AudioMixer === 'function', 'AudioMixer class is exported');
  assert(typeof AudioMixer.mix === 'function', 'AudioMixer has static mix method');
  const mixer = new AudioMixer();
  assert(typeof mixer.mix === 'function', 'AudioMixer instance has mix method');

  // Test 4: Multi-track mix output format
  const tempDir = path.resolve('out/v3/test-mix-temp');
  fs.mkdirSync(tempDir, { recursive: true });

  // Create temporary 24kHz mono narration WAV
  const narrPcm = new Int16Array(24000 * 2); // 2.0s
  for (let i = 0; i < narrPcm.length; i++) {
    narrPcm[i] = Math.round(0.4 * Math.sin((2 * Math.PI * 300 * i) / 24000) * 32767);
  }
  const narrWav = createWavFile(Buffer.from(narrPcm.buffer, narrPcm.byteOffset, narrPcm.byteLength), 24000, 1, 16);
  const narrPath = path.join(tempDir, 'test-narr.wav');
  fs.writeFileSync(narrPath, narrWav);

  // Create temporary music WAV (48kHz stereo)
  const musicPcm = new Int16Array(48000 * 2 * 2); // 2.0s stereo
  for (let i = 0; i < musicPcm.length; i++) {
    musicPcm[i] = Math.round(0.2 * Math.sin((2 * Math.PI * 200 * i) / 48000) * 32767);
  }
  const musicWav = createWavFile(Buffer.from(musicPcm.buffer, musicPcm.byteOffset, musicPcm.byteLength), 48000, 2, 16);
  const musicPath = path.join(tempDir, 'test-music.wav');
  fs.writeFileSync(musicPath, musicWav);

  const outPath = path.join(tempDir, 'test-mixed.wav');
  const mixRes = mixAudioTracks({
    narrationTrack: { id: 'narr', type: 'narration', filePath: narrPath, volume: 1.0 },
    musicTrack: { id: 'mus', type: 'music', filePath: musicPath, volume: 0.25 },
    outputPath: outPath,
    targetDurationSec: 2.0,
  });

  assert(fs.existsSync(outPath), 'Mixed soundtrack WAV written to disk');
  const mixedHeader = parseWavHeader(fs.readFileSync(outPath));
  assert(mixedHeader.sampleRate === 48000, 'Mixed soundtrack sample rate is 48000 Hz');
  assert(mixedHeader.channels === 2, 'Mixed soundtrack channels is 2 (stereo)');
  assert(mixedHeader.bitDepth === 16, 'Mixed soundtrack bit depth is 16-bit PCM');
  assert(mixRes.truePeakDbfs <= -1.0, 'Mixed soundtrack true peak <= -1.0 dBFS');
  assert(mixRes.clippedSamples === 0, 'Mixed soundtrack clipped samples === 0');
  assert(mixRes.lufs >= -17.5 && mixRes.lufs <= -14.5, 'Mixed soundtrack LUFS is within broadcast bounds');

  // Clean up temp
  try {
    fs.unlinkSync(narrPath);
    fs.unlinkSync(musicPath);
    fs.unlinkSync(outPath);
    fs.rmdirSync(tempDir);
  } catch {}
}

async function testAudioManifestAndCuesSubsystem(): Promise<void> {
  console.log('\n--- 15. Audio Manifest & Semantic Animation Cues ---');

  // Test 1: createAudioManifest schema
  const manifest = createAudioManifest({
    totalDurationSec: 4.1,
    truePeakDbfs: -1.2,
    integratedLufs: -16.1,
    outputFile: 'mixed-soundtrack.wav',
    duckingConfig: { duckingDepthDb: -12.8, attackMs: 100, releaseMs: 600 },
  });

  assert(manifest.version === '1.0.0', 'Audio manifest version is 1.0.0');
  assert(manifest.output.file === 'mixed-soundtrack.wav', 'Output file is mixed-soundtrack.wav');
  assert(manifest.output.sampleRate === 48000, 'Output sample rate is 48000');
  assert(manifest.output.channels === 2, 'Output channels is 2');
  assert(manifest.output.truePeakDbfs <= -1.0, 'Output truePeakDbfs <= -1.0');
  assert(manifest.output.clippedSamples === 0, 'Output clippedSamples === 0');
  assert(manifest.ducking.attenuationDb <= -10.0, 'Ducking attenuationDb <= -10.0');

  // Test 2: validateAudioManifest
  const validReport = validateAudioManifest(manifest);
  assert(validReport.valid, 'Compliant manifest passes validateAudioManifest');

  const invalidManifest = JSON.parse(JSON.stringify(manifest));
  invalidManifest.output.truePeakDbfs = 0.5; // clipping
  const invalidReport = validateAudioManifest(invalidManifest);
  assert(!invalidReport.valid, 'Invalid true peak fails validateAudioManifest');

  // Test 3: deriveCuesFromNarration
  const sampleWords = [
    { word: 'In', start: 0.07, end: 0.28 },
    { word: '2026,', start: 0.28, end: 0.95 },
    { word: 'AI', start: 1.05, end: 1.40 },
    { word: 'models', start: 1.58, end: 2.05 },
    { word: 'run', start: 2.10, end: 2.38 },
    { word: 'locally.', start: 3.46, end: 3.98 },
  ];

  const cues = deriveCuesFromNarration(sampleWords as any, [], 30, ['models', 'locally']);
  assert(cues.length >= 3, 'Derived at least 3 semantic cues');

  const startCue = cues.find((c) => c.type === 'SENTENCE_START');
  assert(Boolean(startCue), 'SENTENCE_START cue emitted');
  assert(startCue!.category === 'narrative', 'SENTENCE_START category is "narrative"');
  assert(startCue!.frame >= 0, 'SENTENCE_START frame is non-negative');

  const empCues = cues.filter((c) => c.type === 'WORD_EMPHASIS');
  assert(empCues.length >= 2, 'WORD_EMPHASIS cues emitted for emphasis words');
  assert(empCues[0].category === 'action', 'WORD_EMPHASIS category is "action"');

  const endCue = cues.find((c) => c.type === 'SENTENCE_END');
  assert(Boolean(endCue), 'SENTENCE_END cue emitted');
  assert(endCue!.category === 'narrative', 'SENTENCE_END category is "narrative"');

  // Test strict monotonicity
  for (let i = 1; i < cues.length; i++) {
    assert(cues[i].frame > cues[i - 1].frame, `Cue frame ${cues[i].frame} > previous ${cues[i - 1].frame} (strictly monotonic)`);
  }

  // Test 4: createCueManifestFromNarration
  const cueManifest = createCueManifestFromNarration(sampleWords as any, [], { fps: 30, emphasisWords: ['models'] });
  assert(cueManifest.fps === 30, 'Cue manifest fps is 30');
  assert(cueManifest.cues.length > 0, 'Cue manifest contains cues');
}

async function testPipelineRunnerContract(): Promise<void> {
  console.log('\n--- 16. Unified Pipeline Runner Contracts & Governance Exports ---');

  // Test 1: Empty or whitespace script validation
  let caughtEmpty = false;
  try {
    await generateNarrationPipeline({ script: '', outputDir: '/tmp/test' });
  } catch (err: any) {
    if (/cannot be empty/.test(err.message)) {
      caughtEmpty = true;
    }
  }
  assert(caughtEmpty, 'generateNarrationPipeline rejects empty script with /cannot be empty/');

  let caughtWhitespace = false;
  try {
    await generateNarrationPipeline({ scriptText: '   \n\t  ', outputDir: '/tmp/test' });
  } catch (err: any) {
    if (/cannot be empty/.test(err.message)) {
      caughtWhitespace = true;
    }
  }
  assert(caughtWhitespace, 'generateNarrationPipeline rejects whitespace script with /cannot be empty/');

  // Test 2: Governance exported symbols
  assert(typeof generateNarrationPipeline === 'function', 'generateNarrationPipeline is exported');
  assert(typeof AudioMixer === 'function', 'AudioMixer is exported');
  assert(typeof WhisperXAligner === 'function', 'WhisperXAligner alias is exported');
  assert(typeof deriveSemanticCues === 'function', 'deriveSemanticCues alias is exported');
  assert(typeof deriveCues === 'function', 'deriveCues alias is exported');

  // Test 3: Unscoped package alias exports
  assert(Boolean(unscopedKit.AudioMixer), 'unscoped narration-kit exports AudioMixer');
  assert(Boolean(unscopedKit.WhisperXAligner), 'unscoped narration-kit exports WhisperXAligner');
  assert(Boolean(unscopedKit.generateNarrationPipeline), 'unscoped narration-kit exports generateNarrationPipeline');
}

async function runTestSuite(): Promise<void> {
  const startTime = Date.now();
  console.log('======================================================');
  console.log(' Milestone 1, 2, 3 & 4 Narration Kit Test Suite');
  console.log('======================================================');

  try {
    await testPackagingAndResolution();
    await testWavMechanics();
    await testVoicePresetsAndValidation();
    await testModelAssetsIntegrity();
    await testKokoroSynthesis();
    await testVoicePresetsSynthesis();
    await testOfflineNetworkGuard();
    await testNormalizationSubsystem();
    await testProsodyAndChunkingSubsystem();
    await testWavPcmUtilities();
    await testAlignmentSubsystem();
    await testCaptionsSubsystem();
    await testAudioNormalizationSubsystem();
    await testAudioMixerAndDuckingSubsystem();
    await testAudioManifestAndCuesSubsystem();
    await testPipelineRunnerContract();

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
