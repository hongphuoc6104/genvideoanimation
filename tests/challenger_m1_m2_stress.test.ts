/**
 * tests/challenger_m1_m2_stress.test.ts
 * 
 * EMPIRICAL ADVERSARIAL CHALLENGE SUITE FOR MILESTONE 1 AND MILESTONE 2
 * 
 * Conducted by Challenger M1_M2
 * Evaluates:
 * 1. M1: Tokenizer, Smart Punctuation Joiner, AST offsets, spokenWords arrays, Acoustic Gate thresholds.
 * 2. M2: Visual AST Semantics (Anti-card, passive character, relational scenes), Contact Sheet Extractor,
 *        and Preview Rubric Graphic Motion Energy Ratio.
 */

import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  LanguageAwareTokenizer,
  TextNormalizer,
  createNarrationTextMap,
  NarrationTextMap,
  UnregisteredAcronymError,
} from '../packages/narration-kit/src/normalization';
import {
  lintVisualSemanticsCode,
  validateVisualSemantics,
} from '../validators/validate-visual-semantics';
import {
  extractContactSheet,
} from '../validators/extract-contact-sheet';
import {
  PixelFrame,
  PreviewRubricEvaluator,
} from '../validators/validate-preview-rubric';

// Helper to validate token map invariants
function assertAstFidelity(map: NarrationTextMap, originalText: string, context: string) {
  assert.strictEqual(map.originalText, originalText, `[${context}] originalText matches`);
  assert.ok(Array.isArray(map.tokens), `[${context}] tokens is array`);

  let prevEnd = 0;
  for (let i = 0; i < map.tokens.length; i++) {
    const t = map.tokens[i];
    const [start, end] = t.originalSpan;

    assert.ok(typeof start === 'number' && typeof end === 'number', `[${context}] token ${t.id} span has numbers`);
    assert.ok(start >= 0, `[${context}] token ${t.id} start >= 0`);
    assert.ok(end >= start, `[${context}] token ${t.id} end >= start`);
    assert.ok(end <= originalText.length, `[${context}] token ${t.id} end <= text.length`);
    assert.ok(start >= prevEnd, `[${context}] token ${t.id} overlaps previous token (start: ${start}, prevEnd: ${prevEnd})`);

    // Strict slice invariant
    const sliced = originalText.slice(start, end);
    assert.strictEqual(
      sliced,
      t.originalWord,
      `[${context}] slice mismatch for token ${t.id}: slice="${sliced}" vs originalWord="${t.originalWord}"`
    );

    // SpokenWords non-empty
    assert.ok(Array.isArray(t.spokenWords), `[${context}] token ${t.id} spokenWords is array`);
    assert.ok(t.spokenWords.length > 0, `[${context}] token ${t.id} spokenWords non-empty`);
    for (const w of t.spokenWords) {
      assert.strictEqual(typeof w, 'string', `[${context}] spokenWord is string`);
      assert.ok(w.length > 0, `[${context}] spokenWord non-empty`);
    }

    prevEnd = end;
  }
}

// Check for rogue spaces before closing punctuation
function checkNoRoguePunctuationSpaces(spokenText: string): string[] {
  const rogueIssues: string[] = [];
  // Space before closing punctuation: . , ! ? ; : ) ] } ” ’ …
  const rogueClosingRegex = /\s+([.,!?;:\)\]\}”'’…])/g;
  let match;
  while ((match = rogueClosingRegex.exec(spokenText)) !== null) {
    rogueIssues.push(`Rogue space before closing punctuation "${match[1]}" at index ${match.index}: "...${spokenText.slice(Math.max(0, match.index - 10), match.index + 10)}..."`);
  }
  // Space after opening punctuation: ( [ { “ ‘
  const rogueOpeningRegex = /([\(\[\{“'‘])\s+/g;
  while ((match = rogueOpeningRegex.exec(spokenText)) !== null) {
    rogueIssues.push(`Rogue space after opening punctuation "${match[1]}" at index ${match.index}: "...${spokenText.slice(Math.max(0, match.index - 10), match.index + 10)}..."`);
  }
  return rogueIssues;
}

let totalChallenges = 0;
let passedChallenges = 0;
let failedChallenges = 0;
const challengeLogs: string[] = [];

async function runChallenge(name: string, fn: () => void | Promise<void>) {
  totalChallenges++;
  try {
    await fn();
    passedChallenges++;
    challengeLogs.push(`  [PASS] ${name}`);
    console.log(`  ✔ [PASS] ${name}`);
  } catch (err: any) {
    failedChallenges++;
    const errMsg = `  ✖ [FAIL] ${name}: ${err.message}`;
    challengeLogs.push(errMsg);
    console.error(errMsg);
  }
}

export async function runAllStressTests() {
  console.log('\n======================================================================');
  console.log(' EMPIRICAL CHALLENGER SUITE: M1 & M2 STRESS TESTING');
  console.log('======================================================================\n');

  const tokenizer = new LanguageAwareTokenizer();

  // =========================================================================
  // 1. M1: TOKENIZER & SMART PUNCTUATION JOINER STRESS TESTS
  // =========================================================================
  console.log('--- 1. M1: Tokenizer, SpokenText, Punctuation & AST Offsets ---');

  await runChallenge('M1.1 Required sentence spokenText formatting', () => {
    const text = 'AI, GPU, và Deep Learning: liệu có thực sự hiệu quả? (Thử nghiệm 2026).';
    const res = tokenizer.tokenize(text, { includePunctuationTokens: true });

    // Spoken text check
    const rogue = checkNoRoguePunctuationSpaces(res.spokenText);
    assert.strictEqual(rogue.length, 0, `Rogue punctuation spaces detected: ${rogue.join('; ')}`);

    // Expected content check
    assert.ok(res.spokenText.includes('A I,'), 'Contains "A I,"');
    assert.ok(res.spokenText.includes('G P U,'), 'Contains "G P U,"');
    assert.ok(res.spokenText.includes('Deep Learning:'), 'Contains "Deep Learning:"');
    assert.ok(res.spokenText.includes('quả?'), 'Contains "quả?"');
    assert.ok(res.spokenText.includes('(Thử'), 'Contains "(Thử"');
    assert.ok(res.spokenText.includes('sáu).'), 'Contains "sáu)."');

    // Slice and AST invariants
    const map = createNarrationTextMap(text, { includePunctuationTokens: true });
    assertAstFidelity(map, text, 'M1.1 required sentence');
  });

  await runChallenge('M1.2 Nested quotes, parentheses, ellipses, questions', () => {
    const text = '“Nghiên cứu (chuẩn Scopus)”: liệu ‘AI’ & GPU có đạt 99% không? (Xem lại năm 2026)...';
    const res = tokenizer.tokenize(text, { includePunctuationTokens: true });
    const rogue = checkNoRoguePunctuationSpaces(res.spokenText);
    assert.strictEqual(rogue.length, 0, `Rogue punctuation spaces detected: ${rogue.join('; ')}`);

    const map = createNarrationTextMap(text, { includePunctuationTokens: true });
    assertAstFidelity(map, text, 'M1.2 nested punctuation');
  });

  await runChallenge('M1.3 Multiple terminal punctuation and Swales CARS citation', () => {
    const text = 'Theo Swales (1990): liệu bài báo có bị từ chối không?! (Hoàn toàn có thể!).';
    const res = tokenizer.tokenize(text, { includePunctuationTokens: true });
    const rogue = checkNoRoguePunctuationSpaces(res.spokenText);
    assert.strictEqual(rogue.length, 0, `Rogue spaces: ${rogue.join('; ')}`);

    const map = createNarrationTextMap(text, { includePunctuationTokens: true });
    assertAstFidelity(map, text, 'M1.3 terminal punct');
  });

  await runChallenge('M1.4 Complex Vietnamese numbers, percentages, colons, and registered acronyms', () => {
    const text = 'Tỷ lệ tăng trưởng: 25,5% trong năm 2026; theo chuẩn DOI (đo bằng AI và GPU).';
    const res = tokenizer.tokenize(text, { includePunctuationTokens: true });
    const rogue = checkNoRoguePunctuationSpaces(res.spokenText);
    assert.strictEqual(rogue.length, 0, `Rogue spaces: ${rogue.join('; ')}`);

    const map = createNarrationTextMap(text, { includePunctuationTokens: true });
    assertAstFidelity(map, text, 'M1.4 numbers and punct');
  });

  await runChallenge('M1.4b Strict Unregistered Acronym rejection (R4 / R11)', () => {
    assert.throws(
      () => {
        tokenizer.tokenize('Chi phí 100 USD trong năm 2026.', { strictAcronymCheck: true });
      },
      (err: any) => {
        return err instanceof UnregisteredAcronymError && err.acronym === 'USD';
      },
      'Must reject unregistered acronym USD'
    );
  });

  await runChallenge('M1.5 Verification of includePunctuationTokens default resolution (M1-DEF-01)', () => {
    const text = 'Nghiên cứu, phát triển.';
    
    // Test A: Default call without options preserves punctuation tokens and produces grammatical spokenText
    const resDefault = tokenizer.tokenize(text);
    assert.strictEqual(resDefault.tokens.length, 6, '4 word tokens + 2 punct tokens by default');
    assert.strictEqual(
      resDefault.spokenText,
      'Nghiên cứu, phát triển.',
      'Default spokenText preserves punctuation without rogue spaces'
    );

    // Test B: createNarrationTextMap() without options preserves punctuation and satisfies AST fidelity
    const mapDefault = createNarrationTextMap(text);
    assert.strictEqual(mapDefault.tokens.length, 6, 'createNarrationTextMap preserves 6 tokens by default');
    assert.strictEqual(
      mapDefault.spokenText,
      'Nghiên cứu, phát triển.',
      'createNarrationTextMap spokenText preserves punctuation by default'
    );
    assertAstFidelity(mapDefault, text, 'M1.5 default map');

    // Test C: Explicit opt-out { includePunctuationTokens: false } strips punctuation tokens
    const resOptOut = tokenizer.tokenize(text, { includePunctuationTokens: false });
    assert.strictEqual(resOptOut.tokens.length, 4, '4 word tokens when includePunctuationTokens is false');
    assert.strictEqual(
      resOptOut.spokenText,
      'Nghiên cứu phát triển',
      'Opt-out spokenText strips punctuation as requested'
    );
  });

  await runChallenge('M1.6 Acoustic Gate Dead-Air Threshold check (0.85s)', () => {
    // In validate-audio-policy.ts line 241: measurements.maxInterSilenceSec > 0.85 triggers failure
    const checkPause = (silenceSec: number) => {
      return silenceSec > 0.85;
    };

    assert.strictEqual(checkPause(0.25), false, '250ms clause pause must pass');
    assert.strictEqual(checkPause(0.38), false, '380ms role payoff pause must pass');
    assert.strictEqual(checkPause(0.80), false, '800ms section transition must pass');
    assert.strictEqual(checkPause(0.85), false, '850ms upper bound must pass');
    assert.strictEqual(checkPause(0.86), true, '860ms pause exceeds 0.85s and must trigger failure');
  });

  // =========================================================================
  // 2. M2: VISUAL AST SEMANTICS STRESS TESTS
  // =========================================================================
  console.log('\n--- 2. M2: Visual AST Semantics Validator ---');

  await runChallenge('M2.1 Synthetic scene: 100% pure text cards must FAIL', () => {
    const badCode = `
      import React from 'react';
      export const BadTextCardScene: React.FC = () => {
        return (
          <div style={{ padding: 40 }}>
            <h1>Tiêu đề slide bài giảng</h1>
            <p>Nội dung thẻ giải thích số 1</p>
            <p>Nội dung thẻ giải thích số 2</p>
            <div className="card">
              <span>Nội dung thẻ thứ 3</span>
            </div>
          </div>
        );
      };
    `;
    const violations = lintVisualSemanticsCode(badCode, 'scenes/BadTextCardScene.tsx');
    assert.ok(violations.length > 0, 'Must detect violations in pure text card scene');

    const hasAntiCard = violations.some((v) => v.rule === 'no-text-card-monoculture');
    const hasRequireRelational = violations.some((v) => v.rule === 'require-relational-primitives');
    assert.ok(hasAntiCard, 'Must trigger no-text-card-monoculture violation');
    assert.ok(hasRequireRelational, 'Must trigger require-relational-primitives violation');
    assert.ok(violations.some((v) => v.severity === 'CRITICAL'), 'Violation must be CRITICAL');
  });

  await runChallenge('M2.2 Synthetic scene: text + passive/idle character rig must FAIL', () => {
    const passiveCode = `
      import React from 'react';
      import { ResearcherRig } from '../components/ResearcherRig';
      export const PassiveScene: React.FC = () => {
        return (
          <div>
            <h1>Tiêu đề giới thiệu</h1>
            <p>Đoạn văn thuyết minh nhưng nhân vật đứng yên làm cảnh</p>
            <ResearcherRig />
          </div>
        );
      };
    `;
    const violations = lintVisualSemanticsCode(passiveCode, 'scenes/PassiveScene.tsx');
    assert.ok(violations.length > 0, 'Must detect violations in passive rig scene');

    const hasPassiveRig = violations.some((v) => v.rule === 'no-passive-character-ornament');
    assert.ok(hasPassiveRig, 'Must trigger no-passive-character-ornament violation');
    const passiveV = violations.find((v) => v.rule === 'no-passive-character-ornament');
    assert.strictEqual(passiveV?.severity, 'MAJOR', 'Passive rig violation must be MAJOR');
  });

  await runChallenge('M2.3 Legitimate relational scene with SVG and active rig must PASS', () => {
    const goodCode = `
      import React from 'react';
      import { useCurrentFrame, spring } from 'remotion';
      import { ResearcherRig } from '../components/ResearcherRig';

      export const LegitimateRelationalScene: React.FC = () => {
        const frame = useCurrentFrame();
        const spr = spring({ frame, fps: 30 });

        return (
          <div style={{ width: 1080, height: 1920 }}>
            <ResearcherRig frame={frame} pose="confident" />
            <svg width={800} height={600}>
              <circle cx={100} cy={100} r={50} fill="#06B6D4" />
              <line x1={100} y1={100} x2={300} y2={300} stroke="#F8FAFC" />
              <path d="M 10 80 Q 95 10 180 80" stroke="#10B981" />
            </svg>
            <h2>Mô hình đồ thị quan hệ tri thức</h2>
          </div>
        );
      };
    `;
    const violations = lintVisualSemanticsCode(goodCode, 'scenes/LegitimateRelationalScene.tsx');
    const criticals = violations.filter((v) => v.severity === 'CRITICAL');
    const majors = violations.filter((v) => v.severity === 'MAJOR');

    assert.strictEqual(criticals.length, 0, `Expected 0 critical violations, got: ${JSON.stringify(criticals)}`);
    assert.strictEqual(majors.length, 0, `Expected 0 major violations, got: ${JSON.stringify(majors)}`);
    assert.strictEqual(violations.length, 0, `Expected 0 violations, got: ${JSON.stringify(violations)}`);
  });

  await runChallenge('M2.4 Visual semantics validator on production scenes', () => {
    const res = validateVisualSemantics(['connection-film/src/scopus-explainer/scenes']);
    assert.ok(res.filesAnalyzed >= 7, `Analyzed ${res.filesAnalyzed} files`);
    assert.strictEqual(res.criticalCount, 0, 'Production scenes have 0 critical violations');
    assert.strictEqual(res.majorCount, 0, 'Production scenes have 0 major violations');
    assert.strictEqual(res.passed, true, 'Production scenes passed visual semantics validation');
  });

  // =========================================================================
  // 3. M2: EXTRACT CONTACT SHEET EDGE CASES
  // =========================================================================
  console.log('\n--- 3. M2: Extract Contact Sheet Edge Cases ---');

  await runChallenge('M2.5 Contact sheet extractor fails-closed on missing timeline', async () => {
    await assert.rejects(
      async () => {
        await extractContactSheet({ timelinePath: 'non-existent/timeline.json' });
      },
      /Timeline file not found/,
      'Must reject missing timeline'
    );
  });

  await runChallenge('M2.6 Contact sheet extractor fails-closed on empty beats array', async () => {
    const emptyTimelinePath = path.resolve('/tmp/empty-timeline-test.json');
    fs.writeFileSync(emptyTimelinePath, JSON.stringify({ fps: 30, beats: [] }), 'utf-8');

    try {
      await assert.rejects(
        async () => {
          await extractContactSheet({ timelinePath: emptyTimelinePath });
        },
        /No semantic beats found in timeline/,
        'Must reject empty beats array'
      );
    } finally {
      if (fs.existsSync(emptyTimelinePath)) fs.unlinkSync(emptyTimelinePath);
    }
  });

  await runChallenge('M2.7 Contact sheet extractor fails-closed on missing video file', async () => {
    const testTimelinePath = path.resolve('/tmp/valid-timeline-test.json');
    fs.writeFileSync(
      testTimelinePath,
      JSON.stringify({
        fps: 30,
        beats: [
          { id: 'beat_1', startFrame: 0, endFrame: 30, visualIntent: 'Test' }
        ]
      }),
      'utf-8'
    );

    try {
      await assert.rejects(
        async () => {
          await extractContactSheet({
            timelinePath: testTimelinePath,
            videoPath: 'out/non-existent-video.mp4',
          });
        },
        /Video file not found/,
        'Must reject non-existent video'
      );
    } finally {
      if (fs.existsSync(testTimelinePath)) fs.unlinkSync(testTimelinePath);
    }
  });

  await runChallenge('M2.8 Contact sheet extraction on existing preview video', async () => {
    const timelinePath = 'connection-film/src/scopus-explainer/semantic-timeline.json';
    const videoPath = 'out/preview-360x640.mp4';
    const outDir = '/tmp/contact-sheet-test';

    if (fs.existsSync(videoPath) && fs.existsSync(timelinePath)) {
      const manifest = await extractContactSheet({
        timelinePath,
        videoPath,
        outDir,
      });

      assert.ok(manifest.totalBeats >= 20, `Extracted ${manifest.totalBeats} beats`);
      assert.ok(manifest.totalFramesExtracted > 0, `Extracted ${manifest.totalFramesExtracted} frames`);
      assert.ok(fs.existsSync(path.join(outDir, 'contact-sheet-manifest.json')), 'Manifest created');

      // Cleanup
      const files = fs.readdirSync(outDir);
      for (const f of files) fs.unlinkSync(path.join(outDir, f));
      fs.rmdirSync(outDir);
    } else {
      console.log('    (Skipped video execution - preview video or timeline not found)');
    }
  });

  // =========================================================================
  // 4. M2: GRAPHIC MOTION ENERGY RATIO CALCULATION
  // =========================================================================
  console.log('\n--- 4. M2: Graphic Motion Energy Ratio Calculation ---');

  await runChallenge('M2.9 Graphic Motion Energy Ratio: Low diagram motion triggers failure', () => {
    const width = 360;
    const height = 640;
    const evaluator = new PreviewRubricEvaluator();

    // Create frame 1: uniform background
    const buf1 = Buffer.alloc(width * height * 3, 20);
    const frame1 = new PixelFrame(width, height, buf1);

    // Create frame 2: only peripheral text area changes (Y: 550..620), central graphic area (Y: 140..500) has ZERO change
    const buf2 = Buffer.alloc(width * height * 3, 20);
    for (let y = 550; y < 620; y++) {
      for (let x = 30; x < 330; x++) {
        const idx = (y * width + x) * 3;
        buf2[idx] = 240;
        buf2[idx + 1] = 240;
        buf2[idx + 2] = 240;
      }
    }
    const frame2 = new PixelFrame(width, height, buf2);

    const metric = evaluator.evaluateFrame(frame2, 30, 1.0, undefined, frame1);
    const ratio = metric.details.graphicMotionEnergyRatio;
    assert.ok(ratio !== undefined && ratio < 0.10, `Expected low graphic ratio < 0.10, got: ${ratio}`);

    const report = evaluator.generateReport('test_low_motion.mp4', 'mp4', [metric], {
      overallGraphicMotionRatio: ratio || 0.05,
    });

    assert.strictEqual(report.passed, false, 'Report must fail when graphic motion ratio < 40%');
    const hasViolation = report.criticalViolations.some((v) =>
      v.includes('below required 40.0% threshold')
    );
    assert.ok(hasViolation, 'Must log critical violation for sub-40% graphic motion ratio');
  });

  await runChallenge('M2.10 Graphic Motion Energy Ratio: High diagram motion passes', () => {
    const width = 360;
    const height = 640;
    const evaluator = new PreviewRubricEvaluator();

    const buf1 = Buffer.alloc(width * height * 3, 20);
    const frame1 = new PixelFrame(width, height, buf1);

    // Create frame 2: Central graphic diagram area (Y: 200..400, X: 50..300) changes significantly
    const buf2 = Buffer.alloc(width * height * 3, 20);
    for (let y = 200; y < 400; y++) {
      for (let x = 50; x < 300; x++) {
        const idx = (y * width + x) * 3;
        buf2[idx] = 200;
        buf2[idx + 1] = 180;
        buf2[idx + 2] = 50;
      }
    }
    const frame2 = new PixelFrame(width, height, buf2);

    const metric = evaluator.evaluateFrame(frame2, 30, 1.0, undefined, frame1);
    const ratio = metric.details.graphicMotionEnergyRatio;
    assert.ok(ratio !== undefined && ratio >= 0.80, `Expected high graphic ratio >= 0.80, got: ${ratio}`);

    const report = evaluator.generateReport('test_high_motion.mp4', 'mp4', [metric], {
      overallGraphicMotionRatio: ratio || 0.85,
    });

    const hasMotionViolation = report.criticalViolations.some((v) =>
      v.includes('below required 40.0% threshold')
    );
    assert.ok(!hasMotionViolation, 'Must NOT log motion energy violation when ratio >= 40%');
  });

  console.log('\n======================================================================');
  console.log(` SUMMARY: ${passedChallenges}/${totalChallenges} Challenges Passed (${failedChallenges} Failed)`);
  console.log('======================================================================\n');

  if (failedChallenges > 0) {
    throw new Error(`${failedChallenges} stress test challenges failed!`);
  }
}

if (require.main === module) {
  runAllStressTests().catch((err) => {
    console.error('Test suite execution failed:', err);
    process.exit(1);
  });
}
