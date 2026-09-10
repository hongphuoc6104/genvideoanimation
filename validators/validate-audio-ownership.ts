#!/usr/bin/env tsx
/**
 * VALIDATE AUDIO OWNERSHIP & ASSET GRAPH GATE (F04 / Requirement R11)
 *
 * Verifies single audio ownership under the PREMIXED audio strategy:
 * 1. Static AST traversal of root Remotion composition:
 *    - Exactly ONE <Audio> element mounting the pre-mixed master audio track.
 *    - ZERO discrete cue or SFX <Audio> elements (preventing double playback).
 *    - ZERO <Audio> elements inside child visual scene components.
 * 2. Manifest asset graph validation:
 *    - Audio policy conforms to 'narration-sfx' (zero background music).
 *    - Output master audio file declared.
 *    - Zero duplicate SFX entries (same asset within 50ms).
 *    - 1:1 cross-referencing between cues.json and audio-manifest.json.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from '@babel/parser';
// @ts-ignore
import traverseModule from '@babel/traverse';

const traverse = (traverseModule as any).default || traverseModule;

export interface AudioTagFinding {
  file: string;
  line: number;
  column: number;
  srcExpression: string;
  isMasterTrack: boolean;
  isCueLoop: boolean;
  rawSnippet: string;
}

export interface OwnershipValidationResult {
  passed: boolean;
  audioStrategy: 'PREMIXED' | 'DISCRETE';
  masterFileExpected: string;
  audioTagsFound: AudioTagFinding[];
  sceneAudioTagsFound: AudioTagFinding[];
  manifestCheck: {
    audioPolicy: string;
    hasMusicTrack: boolean;
    sfxTrackCount: number;
    duplicateSfxCount: number;
    unmatchedCuesCount: number;
  };
  errors: string[];
  warnings: string[];
}

export interface OwnershipOptions {
  projectPath?: string;
  tsxPath?: string;
  manifestPath?: string;
  cuesPath?: string;
  scenesDir?: string;
  audioStrategy?: 'PREMIXED' | 'DISCRETE';
  masterFile?: string;
  json?: boolean;
  strict?: boolean;
}

/**
 * Extracts string representation from an AST node for JSX src attribute.
 */
function extractSrcExpression(node: any, code: string): string {
  if (!node) return 'unknown';
  if (node.type === 'StringLiteral') {
    return node.value;
  }
  if (node.type === 'JSXExpressionContainer') {
    const expr = node.expression;
    if (expr.type === 'StringLiteral') {
      return expr.value;
    }
    if (expr.type === 'CallExpression') {
      const calleeName = expr.callee.name || (expr.callee.property ? expr.callee.property.name : '');
      const firstArg = expr.arguments && expr.arguments[0];
      if (firstArg) {
        if (firstArg.type === 'StringLiteral') {
          return `${calleeName}('${firstArg.value}')`;
        }
        if (firstArg.type === 'TemplateLiteral') {
          return `${calleeName}(\`${code.slice(firstArg.start, firstArg.end)}\`)`;
        }
      }
      return `${calleeName}(...)`;
    }
    if (expr.type === 'TemplateLiteral') {
      return `\`${code.slice(expr.start, expr.end)}\``;
    }
    if (expr.type === 'Identifier') {
      return expr.name;
    }
  }
  return code.slice(node.start, node.end);
}

/**
 * Analyzes a TSX file for Remotion <Audio> JSX elements.
 */
export function analyzeCompositionAudioTags(filePath: string, masterFileName: string): AudioTagFinding[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const code = fs.readFileSync(filePath, 'utf8');
  let ast: any;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    });
  } catch (err: any) {
    throw new Error(`Failed to parse AST for ${filePath}: ${err.message}`);
  }

  const findings: AudioTagFinding[] = [];

  traverse(ast, {
    JSXElement(astPath: any) {
      const opening = astPath.node.openingElement;
      let isAudio = false;

      if (opening.name.type === 'JSXIdentifier' && opening.name.name === 'Audio') {
        isAudio = true;
      } else if (
        opening.name.type === 'JSXMemberExpression' &&
        opening.name.property.name === 'Audio'
      ) {
        isAudio = true;
      }

      if (!isAudio) return;

      const loc = opening.loc?.start || { line: 1, column: 0 };
      const rawSnippet = code.slice(opening.start, opening.end);

      let srcExpr = 'none';
      for (const attr of opening.attributes) {
        if (attr.type === 'JSXAttribute' && attr.name.name === 'src') {
          srcExpr = extractSrcExpression(attr.value, code);
          break;
        }
      }

      // Check if inside .map() loop
      let isCueLoop = false;
      let currentParent = astPath.parentPath;
      while (currentParent) {
        if (
          currentParent.node.type === 'CallExpression' &&
          currentParent.node.callee?.property?.name === 'map'
        ) {
          isCueLoop = true;
          break;
        }
        currentParent = currentParent.parentPath;
      }

      const isMasterTrack =
        srcExpr.includes(masterFileName) ||
        srcExpr.toLowerCase().includes('master_audio') ||
        (srcExpr.toLowerCase().includes('master') && !srcExpr.includes('cue'));

      findings.push({
        file: filePath,
        line: loc.line,
        column: loc.column,
        srcExpression: srcExpr,
        isMasterTrack,
        isCueLoop: isCueLoop || srcExpr.includes('cue') || srcExpr.includes('${'),
        rawSnippet,
      });
    },
  });

  return findings;
}

/**
 * Validates audio manifest and cross-references with cues.
 */
export function validateAudioManifestAndCues(
  manifestPath: string,
  cuesPath?: string
): {
  audioPolicy: string;
  hasMusicTrack: boolean;
  sfxTrackCount: number;
  duplicateSfxCount: number;
  unmatchedCuesCount: number;
  errors: string[];
} {
  const errors: string[] = [];
  if (!fs.existsSync(manifestPath)) {
    return {
      audioPolicy: 'missing',
      hasMusicTrack: false,
      sfxTrackCount: 0,
      duplicateSfxCount: 0,
      unmatchedCuesCount: 0,
      errors: [`Audio manifest not found at: ${manifestPath}`],
    };
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const audioPolicy = manifest.audioPolicy || 'narration-sfx';

  // Check music track prohibition under narration-sfx policy
  const hasMusicTrack = Boolean(manifest.tracks?.music || manifest.musicTrack);
  if (audioPolicy === 'narration-sfx' && hasMusicTrack) {
    errors.push(`Audio policy is 'narration-sfx' but music track is present in manifest.`);
  }

  const sfxTracks = manifest.tracks?.sfx || [];
  let duplicateSfxCount = 0;

  // Duplicate SFX check
  for (let i = 0; i < sfxTracks.length; i++) {
    for (let j = i + 1; j < sfxTracks.length; j++) {
      const a = sfxTracks[i];
      const b = sfxTracks[j];
      const timeDiff = Math.abs((a.timeSec ?? a.startTimeSec ?? 0) - (b.timeSec ?? b.startTimeSec ?? 0));
      const fileA = a.file || path.basename(a.filePath || '');
      const fileB = b.file || path.basename(b.filePath || '');

      if (fileA === fileB && timeDiff < 0.05) {
        duplicateSfxCount++;
        errors.push(
          `Duplicate SFX trigger: '${fileA}' triggered twice at ${a.timeSec}s and ${b.timeSec}s (delta < 50ms).`
        );
      }
    }
  }

  let unmatchedCuesCount = 0;
  if (cuesPath && fs.existsSync(cuesPath)) {
    const cuesData = JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
    const sfxCues = (cuesData.cues || []).filter((c: any) => Boolean(c.soundFx));

    for (const cue of sfxCues) {
      const cueFile = path.basename(cue.soundFx);
      const matched = sfxTracks.some((s: any) => {
        const sFile = s.file || path.basename(s.filePath || '');
        const sFrame = s.frame ?? Math.round((s.timeSec ?? 0) * 30);
        return sFile === cueFile && Math.abs(sFrame - cue.frame) <= 1;
      });
      if (!matched) {
        unmatchedCuesCount++;
        errors.push(`Cue '${cue.id}' (${cueFile} @ frame ${cue.frame}) not represented in audio manifest.`);
      }
    }
  }

  return {
    audioPolicy,
    hasMusicTrack,
    sfxTrackCount: sfxTracks.length,
    duplicateSfxCount,
    unmatchedCuesCount,
    errors,
  };
}

/**
 * Main ownership validator orchestration.
 */
export function validateAudioOwnership(options: OwnershipOptions = {}): OwnershipValidationResult {
  const rootDir = process.cwd();

  if (options.projectPath) {
    const pDir = path.resolve(rootDir, options.projectPath);
    if (fs.existsSync(pDir)) {
      const files = fs.readdirSync(pDir);
      const filmFile = files.find((f) => f.endsWith('Film.tsx') || f === 'Film.tsx');
      if (filmFile && !options.tsxPath) {
        options.tsxPath = path.join(pDir, filmFile);
      }
      const manifestCandidate = path.join(pDir, 'audio', 'audio-manifest.json');
      if (fs.existsSync(manifestCandidate) && !options.manifestPath) {
        options.manifestPath = manifestCandidate;
      }
      const cuesCandidate = path.join(pDir, 'cues.json');
      if (fs.existsSync(cuesCandidate) && !options.cuesPath) {
        options.cuesPath = cuesCandidate;
      }
      const scenesCandidate = path.join(pDir, 'scenes');
      if (fs.existsSync(scenesCandidate) && !options.scenesDir) {
        options.scenesDir = scenesCandidate;
      }
      const audioDir = path.join(pDir, 'audio');
      if (fs.existsSync(audioDir) && !options.masterFile) {
        const audioFiles = fs.readdirSync(audioDir);
        const masterWav = audioFiles.find((f) => f.includes('master') && f.endsWith('.wav'));
        if (masterWav) options.masterFile = masterWav;
      }
    }
  }

  const defaultBase = fs.existsSync(path.join(rootDir, 'connection-film/src/scopus-explainer'))
    ? 'connection-film/src/scopus-explainer'
    : 'connection-film/src/legacy/scopus-explainer';
  const tsxPath = options.tsxPath || path.join(rootDir, `${defaultBase}/ScopusExplainerFilm.tsx`);
  const manifestPath = options.manifestPath || (options.projectPath ? undefined : path.join(rootDir, `${defaultBase}/audio/audio-manifest.json`));
  const cuesPath = options.cuesPath || (options.projectPath ? undefined : path.join(rootDir, `${defaultBase}/cues.json`));
  const scenesDir = options.scenesDir || (options.projectPath ? undefined : path.join(rootDir, `${defaultBase}/scenes`));
  const audioStrategy = options.audioStrategy || 'PREMIXED';
  const masterFile = options.masterFile || 'master_audio.wav';

  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Analyze Root Composition TSX
  const audioTags = analyzeCompositionAudioTags(tsxPath, masterFile);

  if (audioStrategy === 'PREMIXED') {
    if (audioTags.length === 0) {
      errors.push(`PREMIXED strategy violation: Zero <Audio> elements found in ${tsxPath}. Video will render silent!`);
    } else if (audioTags.length > 1) {
      errors.push(
        `Dual audio ownership violation (R11): Found ${audioTags.length} <Audio> elements in ${tsxPath}. Under PREMIXED strategy, exactly ONE master <Audio> element is permitted.`
      );
    }

    const cueTags = audioTags.filter((t) => t.isCueLoop || !t.isMasterTrack);
    for (const cueTag of cueTags) {
      errors.push(
        `Duplicate SFX playback detected at ${cueTag.file}:${cueTag.line}: Discrete cue <Audio> tag mounts '${cueTag.srcExpression}'. Master audio already contains pre-mixed SFX.`
      );
    }

    const masterTags = audioTags.filter((t) => t.isMasterTrack);
    if (masterTags.length === 0 && audioTags.length > 0) {
      errors.push(
        `PREMIXED master track missing: None of the <Audio> tags mount the expected master file '${masterFile}'.`
      );
    }
  }

  // 2. Analyze Scene Components (Must contain 0 <Audio> tags)
  const sceneAudioTags: AudioTagFinding[] = [];
  if (fs.existsSync(scenesDir)) {
    const sceneFiles = fs.readdirSync(scenesDir).filter((f) => f.endsWith('.tsx'));
    for (const sceneFile of sceneFiles) {
      const fullScenePath = path.join(scenesDir, sceneFile);
      const sceneTags = analyzeCompositionAudioTags(fullScenePath, masterFile);
      if (sceneTags.length > 0) {
        sceneAudioTags.push(...sceneTags);
        for (const st of sceneTags) {
          errors.push(
            `Illegal audio in visual scene component at ${st.file}:${st.line}: Scenes must be purely visual choreography.`
          );
        }
      }
    }
  }

  // 3. Validate Manifest & Cues
  const manifestCheck = validateAudioManifestAndCues(manifestPath, cuesPath);
  errors.push(...manifestCheck.errors);

  const passed = errors.length === 0;

  return {
    passed,
    audioStrategy,
    masterFileExpected: masterFile,
    audioTagsFound: audioTags,
    sceneAudioTagsFound: sceneAudioTags,
    manifestCheck,
    errors,
    warnings,
  };
}

// CLI Execution Entry Point
export function runCli(args: string[] = process.argv.slice(2)): void {
  const options: OwnershipOptions = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--project=')) options.projectPath = args[i].split('=')[1];
    else if (args[i] === '--project' && args[i + 1]) options.projectPath = args[++i];
    else if (args[i] === '--tsx' && args[i + 1]) options.tsxPath = args[++i];
    else if (args[i] === '--manifest' && args[i + 1]) options.manifestPath = args[++i];
    else if (args[i] === '--cues' && args[i + 1]) options.cuesPath = args[++i];
    else if (args[i] === '--scenes-dir' && args[i + 1]) options.scenesDir = args[++i];
    else if (args[i] === '--strategy' && args[i + 1]) options.audioStrategy = args[++i] as any;
    else if (args[i] === '--master' && args[i + 1]) options.masterFile = args[++i];
    else if (args[i] === '--json') options.json = true;
    else if (args[i] === '--strict') options.strict = true;
    else if (!args[i].startsWith('--')) options.tsxPath = args[i];
  }

  try {
    const result = validateAudioOwnership(options);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('\n🎧 VALIDATING AUDIO ASSET OWNERSHIP (Requirement R11)');
      console.log(`- Strategy: ${result.audioStrategy}`);
      console.log(`- Master WAV Expected: ${result.masterFileExpected}`);
      console.log(`- Composition Audio Tags: ${result.audioTagsFound.length}`);

      for (const tag of result.audioTagsFound) {
        const role = tag.isMasterTrack ? 'MASTER' : 'DISCRETE CUE/SFX';
        console.log(`  • Line ${tag.line}: [${role}] ${tag.srcExpression}`);
      }

      console.log(`- Scene Components Audio Tags: ${result.sceneAudioTagsFound.length}`);
      console.log(`- Audio Policy: ${result.manifestCheck.audioPolicy}`);
      console.log(`- Manifest SFX Tracks Audited: ${result.manifestCheck.sfxTrackCount}`);

      if (result.passed) {
        console.log('\n✅ [PASS] Audio ownership validation succeeded. Single PREMIXED owner verified.\n');
        process.exit(0);
      } else {
        console.error(`\n❌ [FAIL] ${result.errors.length} audio ownership violation(s) detected:`);
        for (const err of result.errors) {
          console.error(`  - 🔴 ${err}`);
        }
        console.error('');
        process.exit(1);
      }
    }
  } catch (err: any) {
    console.error(`\n💥 Fatal Validator Error: ${err.message}\n`);
    process.exit(1);
  }
}

const isDirectCli =
  typeof require !== 'undefined' && require.main === module
    ? true
    : typeof process !== 'undefined' && process.argv[1]
    ? path.resolve(process.argv[1]).replace(/\.ts$/, '') === path.resolve(__filename).replace(/\.ts$/, '')
    : false;

if (isDirectCli) {
  runCli();
}
