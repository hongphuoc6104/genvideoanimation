#!/usr/bin/env tsx
/**
 * scripts/run-v3_1-benchmarks.ts
 *
 * End-to-End Benchmark Execution Engine for V3.1 Vietnamese-First Bilingual Subsystem.
 * Complies with Requirements R10, R8, R7, R6, R5, R4, R3, R2, R1, and R12:
 *
 * Scenarios:
 * 1. Benchmark A (Academic Vietnamese): >= 90% VN, Scopus, Research Gap, Springer
 * 2. Benchmark B (Technology Code-Switch): >= 75% VN, AI, GPU, GPT, BERT, API
 * 3. Benchmark C (Dense Academic Metadata): Dense numbers, percentages, DOI, ORCID, Q1/Q2, Web of Science, Elsevier, H-index
 *
 * For each benchmark, generates 8 mandatory artifacts + mobile preview:
 * 1. original-script.txt
 * 2. spoken-script.txt
 * 3. language-spans.json
 * 4. pronunciation-map.json
 * 5. narration.wav (48kHz mono PCM WAV)
 * 6. words.json (with subunit timestamps)
 * 7. captions.json (1080x1920 portrait safe margin: L72, R180, T120, B320, maxChars <= 26)
 * 8. final.mp4 (1080x1920 30fps)
 * + preview-360x640.mp4 (Mobile QA Preview)
 *
 * Audits each output directory against all 5 quality gate validators + layout validator.
 */

import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { runWithOfflineGuard } from '../validators/offline-network-guard';
import { TextNormalizer } from '../packages/narration-kit/src/normalization/textNormalizer';
import { VieNeuTtsEngine } from '../packages/narration-kit/src/tts/VieNeuTtsEngine';
import { parseWavHeader } from '../packages/narration-kit/src/tts/wav';
import { segmentCaptions } from '../packages/narration-kit/src/captions/segmentCaptions';
import { validateLanguageSpans } from '../validators/validate-language-spans';
import { validatePronunciationMap } from '../validators/validate-pronunciation-map';
import { validateTokenReconciliation } from '../validators/validate-token-reconciliation';
import { validateBilingualAlignment } from '../validators/validate-bilingual-alignment';
import { validateVietnameseNormalization } from '../validators/validate-vietnamese-normalization';

export interface BenchmarkSpec {
  id: 'benchmark-a' | 'benchmark-b' | 'benchmark-c';
  compositionId: 'BenchmarkV31A' | 'BenchmarkV31B' | 'BenchmarkV31C';
  title: string;
  category: string;
  voice: string;
  script: string;
}

export const BENCHMARKS: BenchmarkSpec[] = [
  {
    id: 'benchmark-a',
    compositionId: 'BenchmarkV31A',
    title: 'Benchmark A: Academic Vietnamese',
    category: 'Academic Scopus / Springer',
    voice: 'Minh Quân',
    script:
      'Quy trình xuất bản một bài báo quốc tế trên hệ thống Scopus đòi hỏi việc xác định chính xác Research Gap ngay từ phần mở đầu. Nhà xuất bản Springer yêu cầu cấu trúc bài viết rõ ràng, luận điểm chặt chẽ và trích dẫn chuẩn mực. Khi khoảng trống nghiên cứu được làm sáng tỏ, công trình sẽ thuyết phục được hội đồng phản biện và nhanh chóng được chấp nhận.',
  },
  {
    id: 'benchmark-b',
    compositionId: 'BenchmarkV31B',
    title: 'Benchmark B: Technology Code-Switch',
    category: 'AI / Computing Hardware',
    voice: 'Adam',
    script:
      'Hệ thống huấn luyện mô hình AI hiện đại tận dụng tối đa sức mạnh của phần cứng GPU nhằm tối ưu hóa hiệu năng tính toán. Khi xử lý các kiến trúc phức tạp như GPT hoặc BERT, chúng ta cần kết nối thông qua giao thức API tốc độ cao. Giải pháp này giúp tăng tốc độ xử lý dữ liệu lớn một cách vượt bậc và giảm thiểu độ trễ.',
  },
  {
    id: 'benchmark-c',
    compositionId: 'BenchmarkV31C',
    title: 'Benchmark C: Dense Academic Metadata',
    category: 'Bibliometrics & Metadata',
    voice: 'Minh Đức',
    script:
      'Trong năm 2026, có 85% các công trình công bố trên Elsevier và Web of Science đều yêu cầu mã định danh DOI cùng tài khoản ORCID của tác giả. Tạp chí phân hạng Q1 và Q2 chiếm hơn 70% tổng số lượt trích dẫn quốc tế. Những học giả sở hữu chỉ số H-index từ 15 trở lên thường có tỷ lệ xét duyệt hồ sơ thành công cao vượt trội.',
  },
];

async function runBenchmark(spec: BenchmarkSpec, repoRoot: string): Promise<void> {
  console.log(`\n======================================================`);
  console.log(` EXECUTING ${spec.title.toUpperCase()}`);
  console.log(` Category: ${spec.category} | Voice: ${spec.voice}`);
  console.log(`======================================================\n`);

  const outDir = path.join(repoRoot, 'out', 'v3.1', spec.id);
  fs.mkdirSync(outDir, { recursive: true });

  const publicV31Dir = path.join(repoRoot, 'connection-film', 'public', 'v3_1', spec.id);
  fs.mkdirSync(publicV31Dir, { recursive: true });

  // 1. Write original-script.txt
  const origScriptPath = path.join(outDir, 'original-script.txt');
  fs.writeFileSync(origScriptPath, spec.script.trim() + '\n', 'utf-8');
  console.log(`[1/8] Saved original-script.txt (${spec.script.length} chars)`);

  // 2. Bilingual Text Normalization & Lexicon Mapping
  const normalizer = new TextNormalizer({ locale: 'vi-VN' });
  const textMap = normalizer.createNarrationTextMap(spec.script);

  const spokenScriptPath = path.join(outDir, 'spoken-script.txt');
  fs.writeFileSync(spokenScriptPath, textMap.spokenText.trim() + '\n', 'utf-8');
  console.log(`[2/8] Saved spoken-script.txt (${textMap.spokenText.length} chars)`);

  const langSpansPath = path.join(outDir, 'language-spans.json');
  fs.writeFileSync(langSpansPath, JSON.stringify(textMap.languageSpans, null, 2), 'utf-8');
  console.log(`[3/8] Saved language-spans.json (${textMap.languageSpans.length} spans)`);

  const pronMapPath = path.join(outDir, 'pronunciation-map.json');
  fs.writeFileSync(pronMapPath, JSON.stringify(textMap.pronunciationMap, null, 2), 'utf-8');
  console.log(`[4/8] Saved pronunciation-map.json (${textMap.pronunciationMap.length} entries)`);

  const textMapPath = path.join(outDir, 'narration-text-map.json');
  fs.writeFileSync(textMapPath, JSON.stringify(textMap, null, 2), 'utf-8');

  // 3. Offline VieNeu-TTS Synthesis (Native 48kHz mono PCM WAV)
  const narrationWavPath = path.join(outDir, 'narration.wav');
  const ttsEngine = new VieNeuTtsEngine({
    offline: true,
    sampleRate: 48000,
  });

  console.log(`--> Synthesizing audio via VieNeu-TTS (voice: ${spec.voice}, offline)...`);
  const synthRes = await ttsEngine.synthesize({
    text: textMap.spokenText,
    voice: spec.voice,
    speed: 1.0,
    outputPath: narrationWavPath,
    offline: true,
  });

  const wavInfo = parseWavHeader(synthRes.audioBuffer || fs.readFileSync(narrationWavPath));
  console.log(
    `[5/8] Saved narration.wav: ${wavInfo.durationSec.toFixed(2)}s, ${wavInfo.sampleRate}Hz, ${wavInfo.channels}ch mono`
  );

  // Copy narration.wav to connection-film/public for Remotion staticFile
  const publicWavPath = path.join(publicV31Dir, 'narration.wav');
  fs.copyFileSync(narrationWavPath, publicWavPath);

  // 4. Multilingual Forced Alignment & Subunit Mapping
  console.log(`--> Performing multilingual forced alignment via MMS_FA...`);
  const wordsJsonPath = path.join(outDir, 'words.json');
  const alignScript = path.join(repoRoot, 'scripts', 'align-multilingual.py');
  const pythonPath = path.join(repoRoot, '.venv', 'bin', 'python3');

  const alignCmd = [
    alignScript,
    '--audio', narrationWavPath,
    '--transcript-file', origScriptPath,
    '--text-map', textMapPath,
    '--output', wordsJsonPath,
    '--offline',
  ];

  childProcess.execFileSync(pythonPath, alignCmd, {
    cwd: repoRoot,
    stdio: ['ignore', 'inherit', 'inherit'],
    env: {
      ...process.env,
      HF_HUB_OFFLINE: '1',
      TRANSFORMERS_OFFLINE: '1',
      OFFLINE_MODE: '1',
    },
  });

  const words = JSON.parse(fs.readFileSync(wordsJsonPath, 'utf-8'));
  console.log(`[6/8] Saved words.json: ${words.length} tokens with subunit intervals`);

  // 5. Mobile 9:16 Caption Segmentation (Enforce safe margins: L72, R180, T120, B320; maxChars <= 26)
  console.log(`--> Segmenting captions for mobile 1080x1920 (safe margins: L72, R180, T120, B320)...`);
  const captionsManifest = segmentCaptions(words, {
    fps: 30,
    maxLinesPerGroup: 2,
    maxCharsPerLine: 26,
    position: 'bottom',
    viewport: { width: 1080, height: 1920 },
    safeMargin: 96,
  });

  const captionsJsonPath = path.join(outDir, 'captions.json');
  fs.writeFileSync(captionsJsonPath, JSON.stringify(captionsManifest, null, 2), 'utf-8');
  console.log(
    `[7/8] Saved captions.json: ${captionsManifest.groups.length} groups, maxChars/line <= 26`
  );

  // Also write props.json for Remotion CLI
  const propsPath = path.join(outDir, 'props.json');
  fs.writeFileSync(propsPath, JSON.stringify({ captions: captionsManifest }, null, 2), 'utf-8');

  // Copy captions to public as well
  fs.writeFileSync(path.join(publicV31Dir, 'captions.json'), JSON.stringify(captionsManifest, null, 2), 'utf-8');

  // 6. Remotion Video Render (1080x1920, 30fps)
  const finalMp4Path = path.join(outDir, 'final.mp4');
  console.log(`--> Rendering Remotion composition ${spec.compositionId} -> final.mp4...`);

  const remotionBin = path.join(repoRoot, 'connection-film', 'node_modules', '.bin', 'remotion');
  const remotionArgs = [
    'render',
    'src/index.ts',
    spec.compositionId,
    finalMp4Path,
    `--props=${propsPath}`,
    '--concurrency=2',
    '--log=warn',
  ];

  childProcess.execFileSync(remotionBin, remotionArgs, {
    cwd: path.join(repoRoot, 'connection-film'),
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  const mp4Stats = fs.statSync(finalMp4Path);
  console.log(`[8/8] Rendered final.mp4: ${(mp4Stats.size / (1024 * 1024)).toFixed(2)} MB`);

  // 7. Mobile QA Preview Render (360x640)
  const previewMp4Path = path.join(outDir, 'preview-360x640.mp4');
  console.log(`--> Generating mobile QA preview (360x640)...`);
  childProcess.execSync(
    `ffmpeg -y -i "${finalMp4Path}" -vf scale=360:640 -c:v libx264 -crf 24 -preset fast -c:a copy "${previewMp4Path}"`,
    { stdio: 'pipe' }
  );
  const prevStats = fs.statSync(previewMp4Path);
  console.log(`[+QA] Generated preview-360x640.mp4: ${(prevStats.size / 1024).toFixed(1)} KB`);

  // 8. Quality Gate Validators
  console.log(`\n--> Running 5 CLI Quality Gate Validators on ${spec.id}...`);

  // Validator 1: Language Spans
  const v1 = validateLanguageSpans(langSpansPath, origScriptPath);
  if (!v1.valid) throw new Error(`[Validator 1 FAILED] ${v1.errors.join('; ')}`);
  console.log('  ✓ Validator 1: Language Spans & Classification PASS');

  // Validator 2: Pronunciation Map
  const v2 = validatePronunciationMap(pronMapPath, path.join(repoRoot, 'lexicons'));
  if (!v2.valid) throw new Error(`[Validator 2 FAILED] ${v2.errors.join('; ')}`);
  console.log('  ✓ Validator 2: Pronunciation Map & Lexicon Adherence PASS');

  // Validator 3: Token Reconciliation
  const v3 = validateTokenReconciliation(wordsJsonPath, captionsJsonPath, origScriptPath);
  if (!v3.valid) throw new Error(`[Validator 3 FAILED] ${v3.errors.join('; ')}`);
  console.log('  ✓ Validator 3: Token Reconciliation & Decoupling PASS');

  // Validator 4: Bilingual Alignment
  const v4 = validateBilingualAlignment(wordsJsonPath, narrationWavPath);
  if (!v4.valid) throw new Error(`[Validator 4 FAILED] ${v4.errors.join('; ')}`);
  console.log('  ✓ Validator 4: Bilingual Alignment Monotonicity PASS');

  // Validator 5: Vietnamese Normalization
  const v5 = validateVietnameseNormalization(origScriptPath, spokenScriptPath);
  if (!v5.valid) throw new Error(`[Validator 5 FAILED] ${v5.errors.join('; ')}`);
  console.log('  ✓ Validator 5: Vietnamese Normalization Grammar PASS');

  // Validator 6: Caption Layout Safe Margins
  childProcess.execFileSync(
    'npx',
    ['tsx', path.join(repoRoot, 'validators', 'validate-caption-layout.ts'), '--captions', captionsJsonPath],
    { cwd: repoRoot, stdio: 'inherit' }
  );
  console.log(`  ✓ Validator 6: Caption Layout & Safe Areas PASS`);

  console.log(`\n✅ ALL 8 ARTIFACTS + PREVIEW + 6 VALIDATORS PASSED FOR ${spec.id.toUpperCase()}`);
}

async function main() {
  const startTime = Date.now();
  console.log('######################################################################');
  console.log(' V3.1 VIETNAMESE-FIRST BILINGUAL END-TO-END BENCHMARK SUITE');
  console.log(' Requirement R10: Benchmark A, Benchmark B, Benchmark C');
  console.log(' Strict Offline Network Guard: ENFORCED');
  console.log('######################################################################');

  const repoRoot = path.resolve(__dirname, '..');

  await runWithOfflineGuard(async () => {
    for (const spec of BENCHMARKS) {
      await runBenchmark(spec, repoRoot);
    }
  });

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n######################################################################');
  console.log(` 🎉 ALL 3 V3.1 BENCHMARKS SUCCESSFULLY GENERATED IN ${totalTimeSec}s!`);
  console.log(' Output Directory: out/v3.1/');
  console.log('######################################################################\n');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('\n❌ FATAL BENCHMARK ERROR:', err);
    process.exit(1);
  });
}
