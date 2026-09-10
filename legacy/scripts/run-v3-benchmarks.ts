#!/usr/bin/env tsx
/**
 * scripts/run-v3-benchmarks.ts
 * Generates all narration audio, text maps, word alignments, captions, and audio manifests
 * for Benchmark A, Benchmark B, Benchmark C, and Voice Comparison under strict offline mode.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { generateNarrationPipeline } from '../packages/narration-kit/src/pipeline/generateNarrationPipeline';
import { KokoroTtsEngine } from '../packages/narration-kit/src/tts/KokoroTtsEngine';
import { runWithOfflineGuard } from '../validators/offline-network-guard';

const BENCHMARK_A_SCRIPT = `Photosynthesis is the fundamental biological process by which green plants transform sunlight into chemical energy. Inside the plant cells, tiny cellular engines called chloroplasts capture photons using green chlorophyll pigments. This energy splits water molecules into oxygen and hydrogen, powering the creation of glucose to nourish the entire organism.`;

const BENCHMARK_B_SCRIPT = `In 2026, modern GPU accelerators process deep neural networks at over 150 teraflops: a 45% increase compared to earlier architectures. When training large language models (such as GPT or BERT), high-bandwidth memory (HBM3) achieves transfer rates of 3.2 terabytes per second, minimizing latency across parallel compute clusters.`;

const BENCHMARK_C_SCRIPT = `Look closely at the data! Everything changes in an instant. While traditional systems hesitate and wait for confirmation, our reactive distributed architecture responds immediately. Notice that sudden spike? That is where the breakthrough happens. Unstoppable performance, delivered without compromise.`;

const VOICE_COMPARISON_SCRIPT = `Every great scientific discovery begins with a single curious question and the determination to explore the unknown.`;

async function run() {
  console.log('======================================================');
  console.log(' V3 NARRATION & AUDIO PRODUCTION BENCHMARK RUNNER');
  console.log('======================================================\n');

  const repoRoot = path.resolve(__dirname, '..');
  const outV3 = path.join(repoRoot, 'out', 'v3');
  fs.mkdirSync(outV3, { recursive: true });

  await runWithOfflineGuard(async () => {
    // ----------------------------------------------------
    // BENCHMARK A: Standard Educational Narration
    // ----------------------------------------------------
    console.log('--> Generating Benchmark A (Standard Educational Narration)...');
    const benchADir = path.join(outV3, 'benchmark-a');
    const resA = await generateNarrationPipeline({
      script: BENCHMARK_A_SCRIPT,
      outputDir: benchADir,
      voice: 'am_adam',
      profile: 'educational',
      fps: 30,
      offline: true,
      safeArea: { position: 'bottom', safeMargin: 96 },
    });
    console.log(`  ✓ Benchmark A generated: ${resA.durationSeconds}s, ${resA.wordsCount} words, ${resA.captionsCount} caption groups.\n`);

    // ----------------------------------------------------
    // BENCHMARK B: Difficult Technical Narration
    // ----------------------------------------------------
    console.log('--> Generating Benchmark B (Difficult Technical Narration)...');
    const benchBDir = path.join(outV3, 'benchmark-b');
    const resB = await generateNarrationPipeline({
      script: BENCHMARK_B_SCRIPT,
      outputDir: benchBDir,
      voice: 'am_adam',
      profile: 'educational',
      fps: 30,
      offline: true,
      safeArea: { position: 'bottom', safeMargin: 96 },
    });
    console.log(`  ✓ Benchmark B generated: ${resB.durationSeconds}s, ${resB.wordsCount} words, ${resB.captionsCount} caption groups.\n`);

    // ----------------------------------------------------
    // BENCHMARK C: Rapid / Expressive Narration
    // ----------------------------------------------------
    console.log('--> Generating Benchmark C (Rapid / Expressive Narration)...');
    const benchCDir = path.join(outV3, 'benchmark-c');
    const resC = await generateNarrationPipeline({
      script: BENCHMARK_C_SCRIPT,
      outputDir: benchCDir,
      voice: 'am_adam',
      profile: 'energetic',
      fps: 30,
      offline: true,
      emphasisWords: ['closely', 'instant', 'immediately', 'breakthrough'],
      safeArea: { position: 'bottom', safeMargin: 96 },
    });
    console.log(`  ✓ Benchmark C generated: ${resC.durationSeconds}s, ${resC.wordsCount} words, ${resC.captionsCount} caption groups.\n`);

    // ----------------------------------------------------
    // VOICE COMPARISON BENCHMARK (am_adam, am_fenrir, am_michael, am_onyx)
    // ----------------------------------------------------
    console.log('--> Generating Voice Comparison Benchmark (4 voices)...');
    const voiceCompDir = path.join(outV3, 'voice-comparison');
    fs.mkdirSync(voiceCompDir, { recursive: true });
    fs.writeFileSync(path.join(voiceCompDir, 'script.txt'), VOICE_COMPARISON_SCRIPT.trim() + '\n', 'utf-8');

    const voices = ['am_adam', 'am_fenrir', 'am_michael', 'am_onyx'] as const;
    const ttsEngine = new KokoroTtsEngine();

    for (const v of voices) {
      const outName = `voice-${v.replace('am_', '')}.wav`;
      const outPath = path.join(voiceCompDir, outName);
      console.log(`  Synthesizing voice ${v} -> ${outName}...`);
      const vRes = await ttsEngine.synthesize({
        text: VOICE_COMPARISON_SCRIPT,
        voice: v,
        speed: 1.0,
        outputPath: outPath,
        offline: true,
      });
      console.log(`    ✓ ${v} synthesized: ${vRes.durationSec.toFixed(2)}s, 24kHz mono PCM`);
    }

    console.log('\n======================================================');
    console.log(' ✅ ALL BENCHMARK PIPELINES GENERATED SUCCESSFULLY');
    console.log('======================================================\n');
  });
}

run().catch((err) => {
  console.error('Fatal benchmark pipeline error:', err);
  process.exit(1);
});
