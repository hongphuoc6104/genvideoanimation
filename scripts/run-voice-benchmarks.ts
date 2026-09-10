#!/usr/bin/env tsx
/**
 * scripts/run-voice-benchmarks.ts
 *
 * Synthesizes the standardized academic test script (>= 80% Vietnamese containing
 * 10 code-switching terms) across 4 voices under strict offline network guard.
 *
 * Requirement: R9 (Voice Benchmark Suite)
 * Output: out/voice-benchmarks/{minh_quan.wav, minh_duc.wav, adam.wav, mai_phuong.wav, script.txt, benchmark-summary.json}
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { runWithOfflineGuard } from '../validators/offline-network-guard';
import { VieNeuTtsEngine } from '../packages/narration-kit/src/tts/VieNeuTtsEngine';
import { parseWavHeader } from '../packages/narration-kit/src/tts/wav';

export const STANDARDIZED_ACADEMIC_SCRIPT =
  'Trong nghiên cứu khoa học hiện đại, việc ứng dụng các mô hình AI tiên tiến đòi hỏi hạ tầng tính toán GPU hiệu năng cao để huấn luyện kiến trúc GPT. Khi công bố công trình trên các tạp chí quốc tế thuộc danh mục Scopus và Web of Science của nhà xuất bản Springer, tác giả cần xác định rõ ràng Research Gap có ý nghĩa học thuật sâu sắc để tránh nguy cơ Desk Reject ngay từ vòng sơ loại. Một bài báo đạt phân hạng Q1 với chỉ số DOI chính thức luôn thể hiện sự đóng góp tri thức mới và tính liêm chính học thuật chuẩn mực.';

export interface BenchmarkVoiceConfig {
  id: 'minh_quan' | 'minh_duc' | 'adam' | 'mai_phuong';
  displayName: string;
  engineVoice: string;
  filename: string;
  gender: 'male' | 'female';
  accent: 'northern' | 'southern';
  style: 'news' | 'natural';
}

export const BENCHMARK_VOICES: readonly BenchmarkVoiceConfig[] = [
  {
    id: 'minh_quan',
    displayName: 'Minh Quân',
    engineVoice: 'Minh Triết',
    filename: 'minh_quan.wav',
    gender: 'male',
    accent: 'southern',
    style: 'news',
  },
  {
    id: 'minh_duc',
    displayName: 'Minh Đức',
    engineVoice: 'Minh Đức',
    filename: 'minh_duc.wav',
    gender: 'male',
    accent: 'northern',
    style: 'news',
  },
  {
    id: 'adam',
    displayName: 'Adam',
    engineVoice: 'Adam',
    filename: 'adam.wav',
    gender: 'male',
    accent: 'southern',
    style: 'natural',
  },
  {
    id: 'mai_phuong',
    displayName: 'Mai Phương',
    engineVoice: 'Mai Anh',
    filename: 'mai_phuong.wav',
    gender: 'female',
    accent: 'northern',
    style: 'news',
  },
] as const;

export interface VoiceBenchmarkResult {
  voiceId: string;
  displayName: string;
  engineVoice: string;
  filename: string;
  outputPath: string;
  durationSec: number;
  generationTimeSec: number;
  rtf: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  fileSizeBytes: number;
  sha256: string;
}

export async function runVoiceBenchmarks(options: {
  outputDir?: string;
  speed?: number;
  offline?: boolean;
} = {}): Promise<VoiceBenchmarkResult[]> {
  const repoRoot = path.resolve(__dirname, '..');
  const outDir = options.outputDir || path.join(repoRoot, 'out', 'voice-benchmarks');
  const isOffline = options.offline ?? true;
  const speed = options.speed ?? 1.0;

  fs.mkdirSync(outDir, { recursive: true });

  // 1. Write script.txt for independent review
  const scriptPath = path.join(outDir, 'script.txt');
  fs.writeFileSync(scriptPath, STANDARDIZED_ACADEMIC_SCRIPT.trim() + '\n', 'utf-8');

  console.log('======================================================================');
  console.log(' V3.1 VIENEU-TTS VOICE BENCHMARK SUITE (Requirement R9)');
  console.log('======================================================================');
  console.log('Script tokens: 113 tokens (87.61% Vietnamese, 10 code-switching terms)');
  console.log(`Output Directory: ${outDir}`);
  console.log(`Offline Mode: ${isOffline ? 'ENABLED (Guarded)' : 'DISABLED'}\n`);

  const results: VoiceBenchmarkResult[] = [];
  const engine = new VieNeuTtsEngine({ repoRoot, offline: isOffline });

  await runWithOfflineGuard(async () => {
    for (const v of BENCHMARK_VOICES) {
      const outFilePath = path.join(outDir, v.filename);
      console.log(`--> Synthesizing voice [${v.displayName}] (Preset: ${v.engineVoice})...`);

      const tStart = Date.now();
      const synthRes = await engine.synthesize({
        text: STANDARDIZED_ACADEMIC_SCRIPT,
        voice: v.displayName, // VieNeuTtsEngine resolves aliases internally
        speed,
        outputPath: outFilePath,
        offline: isOffline,
      });
      const tElapsedSec = (Date.now() - tStart) / 1000;

      const wavBuffer = await fs.promises.readFile(outFilePath);
      const wavHeader = parseWavHeader(wavBuffer);
      const sha256 = crypto.createHash('sha256').update(wavBuffer).digest('hex');

      const rtf = Number((tElapsedSec / synthRes.durationSec).toFixed(3));
      const resItem: VoiceBenchmarkResult = {
        voiceId: v.id,
        displayName: v.displayName,
        engineVoice: v.engineVoice,
        filename: v.filename,
        outputPath: outFilePath,
        durationSec: Number(synthRes.durationSec.toFixed(2)),
        generationTimeSec: Number(tElapsedSec.toFixed(2)),
        rtf,
        sampleRate: wavHeader.sampleRate,
        channels: wavHeader.channels,
        bitDepth: wavHeader.bitDepth,
        fileSizeBytes: wavBuffer.length,
        sha256,
      };
      results.push(resItem);

      console.log(`    ✓ Saved: ${v.filename}`);
      console.log(
        `      Duration: ${resItem.durationSec}s | Gen Time: ${resItem.generationTimeSec}s | RTF: ${resItem.rtf}`
      );
      console.log(
        `      Format: ${resItem.sampleRate}Hz mono PCM 16-bit | Size: ${(
          resItem.fileSizeBytes / 1024
        ).toFixed(1)} KB\n`
      );
    }

    // 2. Write benchmark-summary.json
    const summaryPath = path.join(outDir, 'benchmark-summary.json');
    const summaryData = {
      benchmark: 'V3.1 VieNeu-TTS Voice Benchmark Suite (R9)',
      timestamp: new Date().toISOString(),
      scriptText: STANDARDIZED_ACADEMIC_SCRIPT,
      scriptStatistics: {
        totalTokens: 113,
        vietnameseTokens: 99,
        englishTokens: 14,
        vietnamesePercentage: 87.61,
        codeSwitchingTerms: [
          'AI',
          'GPU',
          'GPT',
          'Scopus',
          'Web of Science',
          'Research Gap',
          'Desk Reject',
          'Springer',
          'Q1',
          'DOI',
        ],
      },
      evaluationPolicy: 'Human auditory review only. No automated winner declared per R9.',
      voices: results,
    };
    fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2), 'utf-8');
    console.log(`Summary manifest saved to: ${summaryPath}`);
  });

  console.log('\n======================================================================');
  console.log(' ✅ ALL 4 VOICE BENCHMARKS COMPLETED SUCCESSFULLY');
  console.log('======================================================================\n');

  return results;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  runVoiceBenchmarks().catch((err) => {
    console.error('Fatal benchmark execution error:', err);
    process.exit(1);
  });
}
