/**
 * tests/voice-routing-default.test.ts
 *
 * Feature F10 Verification: Safe VieNeu-TTS Voice Routing Defaults.
 * Asserts that:
 * 1. Default voice resolution routes strictly to VieNeu-TTS 'Adam'.
 * 2. Omitted, undefined, empty, or whitespace voice NEVER routes to Kokoro 'am_adam'.
 * 3. Explicit 'am_adam' (or other Kokoro voices) routes strictly to Kokoro fallback.
 * 4. DEFAULT_PRODUCTION_VOICE is exported and equals 'Adam'.
 * 5. createTTSProvider defaults to VieNeuProvider when voice is omitted or empty.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  DEFAULT_VIENEU_VOICE,
  DEFAULT_PRODUCTION_VOICE,
  DEFAULT_VOICE,
  resolveAnyVoice,
  createTTSProvider,
  VieNeuProvider,
  KokoroProvider,
} from '../packages/narration-kit/src/tts';

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

async function runVoiceRoutingTests(): Promise<void> {
  console.log('\n=== Voice Routing Default & Provider Resolution Tests (F10) ===\n');

  // 1. Constants assertions
  console.log('--- 1. Voice Constants & Production Defaults ---');
  assert(DEFAULT_VIENEU_VOICE === 'Adam', 'DEFAULT_VIENEU_VOICE is "Adam"');
  assert(DEFAULT_PRODUCTION_VOICE === 'Adam', 'DEFAULT_PRODUCTION_VOICE is "Adam"');
  assert(DEFAULT_VOICE === 'am_adam', 'DEFAULT_VOICE remains "am_adam" for Kokoro backward compatibility');
  assert(DEFAULT_PRODUCTION_VOICE !== DEFAULT_VOICE, 'DEFAULT_PRODUCTION_VOICE is distinct from legacy Kokoro DEFAULT_VOICE');

  // 2. resolveAnyVoice resolution logic
  console.log('\n--- 2. resolveAnyVoice() Contract Verification ---');
  
  // Omitted / undefined
  const rOmitted = resolveAnyVoice(undefined);
  assert(rOmitted.provider === 'vieneu', 'resolveAnyVoice(undefined) provider is "vieneu"');
  assert(rOmitted.resolvedName === 'Adam', 'resolveAnyVoice(undefined) resolvedName is "Adam"');
  assert(rOmitted.resolvedName !== 'am_adam', 'resolveAnyVoice(undefined) NEVER resolves to "am_adam"');

  const rNoArg = resolveAnyVoice();
  assert(rNoArg.provider === 'vieneu' && rNoArg.resolvedName === 'Adam', 'resolveAnyVoice() with no arguments resolves to VieNeu Adam');

  // Empty string
  const rEmpty = resolveAnyVoice('');
  assert(rEmpty.provider === 'vieneu', 'resolveAnyVoice("") provider is "vieneu"');
  assert(rEmpty.resolvedName === 'Adam', 'resolveAnyVoice("") resolvedName is "Adam"');

  // Whitespace
  const rWhitespace = resolveAnyVoice('   ');
  assert(rWhitespace.provider === 'vieneu', 'resolveAnyVoice("   ") provider is "vieneu"');
  assert(rWhitespace.resolvedName === 'Adam', 'resolveAnyVoice("   ") resolvedName is "Adam"');

  // Explicit VieNeu voices
  const rAdam = resolveAnyVoice('Adam');
  assert(rAdam.provider === 'vieneu' && rAdam.resolvedName === 'Adam', 'resolveAnyVoice("Adam") resolves to VieNeu Adam');

  const rMinhDuc = resolveAnyVoice('Minh Đức');
  assert(rMinhDuc.provider === 'vieneu' && rMinhDuc.resolvedName === 'Minh Đức', 'resolveAnyVoice("Minh Đức") resolves to VieNeu Minh Đức');

  // Explicit Kokoro voices
  const rKokoroAdam = resolveAnyVoice('am_adam');
  assert(rKokoroAdam.provider === 'kokoro', 'resolveAnyVoice("am_adam") provider is "kokoro"');
  assert(rKokoroAdam.resolvedName === 'am_adam', 'resolveAnyVoice("am_adam") resolvedName is "am_adam"');

  const rFenrir = resolveAnyVoice('am_fenrir');
  assert(rFenrir.provider === 'kokoro' && rFenrir.resolvedName === 'am_fenrir', 'resolveAnyVoice("am_fenrir") resolves to Kokoro am_fenrir');

  // 3. createTTSProvider factory resolution
  console.log('\n--- 3. createTTSProvider() Factory Invariants ---');

  // Default / omitted
  const provDefault = createTTSProvider();
  assert(provDefault instanceof VieNeuProvider, 'createTTSProvider() returns VieNeuProvider');
  assert(provDefault.name === 'vieneu', 'createTTSProvider() provider name is "vieneu"');

  const provUndefinedVoice = createTTSProvider({ voice: undefined });
  assert(provUndefinedVoice instanceof VieNeuProvider, 'createTTSProvider({ voice: undefined }) returns VieNeuProvider');

  const provEmptyVoice = createTTSProvider({ voice: '' });
  assert(provEmptyVoice instanceof VieNeuProvider, 'createTTSProvider({ voice: "" }) returns VieNeuProvider');

  const provWhitespaceVoice = createTTSProvider({ voice: '   ' });
  assert(provWhitespaceVoice instanceof VieNeuProvider, 'createTTSProvider({ voice: "   " }) returns VieNeuProvider');

  // Explicit VieNeu voice
  const provExplicitVieNeu = createTTSProvider({ voice: 'Adam' });
  assert(provExplicitVieNeu instanceof VieNeuProvider, 'createTTSProvider({ voice: "Adam" }) returns VieNeuProvider');

  // Explicit Kokoro voice
  const provExplicitKokoro = createTTSProvider({ voice: 'am_adam' });
  assert(provExplicitKokoro instanceof KokoroProvider, 'createTTSProvider({ voice: "am_adam" }) returns KokoroProvider');

  // 4. Source invariant check for generateNarrationPipeline.ts
  console.log('\n--- 4. Source Contract Inspection for generateNarrationPipeline.ts ---');
  const pipelineSrcPath = path.resolve(__dirname, '../packages/narration-kit/src/pipeline/generateNarrationPipeline.ts');
  const pipelineSrc = fs.readFileSync(pipelineSrcPath, 'utf-8');

  assert(!pipelineSrc.includes("request.voice || 'am_adam'"), 'generateNarrationPipeline.ts does NOT fallback to "am_adam"');
  assert(pipelineSrc.includes('DEFAULT_VIENEU_VOICE'), 'generateNarrationPipeline.ts references DEFAULT_VIENEU_VOICE');

  console.log(`\n==================================================`);
  console.log(`Summary: ${passedTests}/${totalTests} tests passed successfully.`);
  console.log(`==================================================\n`);
}

runVoiceRoutingTests().catch((err) => {
  console.error('Fatal error in voice-routing-default.test.ts:', err);
  process.exit(1);
});
