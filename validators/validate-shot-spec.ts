#!/usr/bin/env tsx
/**
 * VALIDATE SHOT SPEC - CONTINUITY & SCHEMA VALIDATOR (V3.3 Production Hardening)
 *
 * Validates ShotSpec JSON data against schema and continuity constraints:
 * - Validates shot frame progression and rejects temporal gaps / overlaps.
 * - Validates C0 camera continuity (position x, y, and zoom/scale) between consecutive shots:
 *   S_N.end_state.camera == S_{N+1}.start_state.camera, with exceptions only for declared motivated transitions.
 * - Validates impact frames declared in impact_frames / whitelisted_impact_frames are strictly within [startFrame, endFrame].
 * - Validates transition schema: transition_frames, transition_type, and expected_visual_discontinuity.
 * - Enforces strict transition type whitelist (object_match, camera_carry, shape_morph, foreground_wipe, continuing_trajectory, semantic_zoom, motivated_iris, match_cut).
 * - Exports extractWhitelistedTransitions and extractWhitelistedDiscontinuityFrames for temporal-render-qa.
 * - Enforces non-zero exit code (process.exit(1)) on any validation failure.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export const ALLOWED_TRANSITION_TYPES = [
  'object_match',
  'camera_carry',
  'shape_morph',
  'foreground_wipe',
  'continuing_trajectory',
  'semantic_zoom',
  'motivated_iris',
  'match_cut',
] as const;

export type MotivatedTransitionType = typeof ALLOWED_TRANSITION_TYPES[number];

export interface ShotTransition {
  from_shot: string;
  to_shot: string;
  transition_type: MotivatedTransitionType;
  transition_frames: [number, number];
  expected_visual_discontinuity: number | boolean;
  description?: string;
}

export interface ShotCameraState {
  x: number;
  y: number;
  zoom?: number;
  scale?: number;
  rotation?: number;
}

export interface ShotState {
  camera?: ShotCameraState;
  [key: string]: unknown;
}

export interface ShotBeat {
  frame: number;
  subject: string;
  intent: string;
  values?: Record<string, unknown>;
}

export interface NormalizedShot {
  id: string;
  startFrame: number;
  endFrame: number;
  narrative_purpose?: string;
  start_state: ShotState;
  end_state: ShotState;
  key_beats: ShotBeat[];
  impact_frames: number[];
  camera?: ShotCameraState;
  transitions?: ShotTransition[];
  raw?: Record<string, unknown>;
}

export interface ShotValidationResult {
  valid: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Parses ShotSpec raw string or file path. Throws SyntaxError on malformed JSON.
 */
export function parseShotSpec(contentOrPath: string): any {
  if (typeof contentOrPath !== 'string') {
    throw new Error('parseShotSpec requires a string argument (JSON string or file path)');
  }

  const trimmed = contentOrPath.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed);
  }

  // Check if it's a file path
  const resolved = path.resolve(contentOrPath);
  if (fs.existsSync(resolved) && !fs.statSync(resolved).isDirectory()) {
    const raw = fs.readFileSync(resolved, 'utf-8');
    return JSON.parse(raw);
  }

  // Fallback: parse as JSON
  return JSON.parse(contentOrPath);
}

/**
 * Extracts normalized camera coordinates from a shot state object.
 */
export function extractCameraFromState(state: any): { x: number; y: number; zoom: number } | undefined {
  if (!state || typeof state !== 'object') return undefined;

  if (state.camera && typeof state.camera === 'object') {
    return {
      x: typeof state.camera.x === 'number' ? state.camera.x : 0,
      y: typeof state.camera.y === 'number' ? state.camera.y : 0,
      zoom:
        typeof state.camera.zoom === 'number'
          ? state.camera.zoom
          : typeof state.camera.scale === 'number'
          ? state.camera.scale
          : 1.0,
    };
  }

  if (typeof state.camera_zoom === 'number' || typeof state.zoom === 'number') {
    return {
      x: typeof state.camera_x === 'number' ? state.camera_x : 0,
      y: typeof state.camera_y === 'number' ? state.camera_y : 0,
      zoom:
        typeof state.camera_zoom === 'number'
          ? state.camera_zoom
          : typeof state.zoom === 'number'
          ? state.zoom
          : 1.0,
    };
  }

  return undefined;
}

/**
 * Normalizes a transition declaration from snake_case or camelCase.
 */
export function normalizeTransition(raw: any, defaultFrom?: string, defaultTo?: string): ShotTransition {
  const from_shot = String(raw.from_shot ?? raw.fromShot ?? defaultFrom ?? '');
  const to_shot = String(raw.to_shot ?? raw.toShot ?? raw.target_shot_id ?? raw.targetShotId ?? defaultTo ?? '');
  const transition_type = (raw.transition_type ?? raw.transitionType ?? raw.type ?? '') as MotivatedTransitionType;

  let transition_frames: [number, number] = [0, 0];
  const rawFrames = raw.transition_frames ?? raw.transitionFrames ?? raw.frames;
  if (Array.isArray(rawFrames) && rawFrames.length >= 2) {
    transition_frames = [Number(rawFrames[0]), Number(rawFrames[1])];
  }

  const expected_visual_discontinuity =
    raw.expected_visual_discontinuity ?? raw.expectedVisualDiscontinuity ?? true;

  return {
    from_shot,
    to_shot,
    transition_type,
    transition_frames,
    expected_visual_discontinuity,
    description: raw.description,
  };
}

/**
 * Normalizes a shot object supporting both camelCase and snake_case properties.
 */
export function normalizeShot(rawShot: any, index: number = 0): NormalizedShot {
  const id = String(rawShot.id ?? rawShot.shot_id ?? `shot_${index + 1}`);
  const startFrame = Number(rawShot.startFrame ?? rawShot.start_frame ?? 0);
  const endFrame = Number(rawShot.endFrame ?? rawShot.end_frame ?? 0);
  const narrative_purpose = rawShot.narrative_purpose;

  const start_state = (rawShot.start_state && typeof rawShot.start_state === 'object') ? rawShot.start_state : {};
  const end_state = (rawShot.end_state && typeof rawShot.end_state === 'object') ? rawShot.end_state : {};

  // Impact frames
  const impactFramesRaw =
    rawShot.impact_frames ?? rawShot.whitelisted_impact_frames ?? [];
  const impact_frames: number[] = Array.isArray(impactFramesRaw)
    ? impactFramesRaw.map((f: any) => Number(f))
    : [];

  // Key beats
  const key_beats: ShotBeat[] = Array.isArray(rawShot.key_beats)
    ? rawShot.key_beats.map((b: any) => ({
        frame: Number(b.frame ?? 0),
        subject: String(b.subject ?? ''),
        intent: String(b.intent ?? ''),
        values: b.values,
      }))
    : [];

  // Per-shot transitions
  let transitions: ShotTransition[] | undefined;
  if (Array.isArray(rawShot.transitions)) {
    transitions = rawShot.transitions.map((t: any) => normalizeTransition(t, id));
  } else if (rawShot.transition) {
    transitions = [normalizeTransition(rawShot.transition, id)];
  }

  return {
    id,
    startFrame,
    endFrame,
    narrative_purpose,
    start_state,
    end_state,
    key_beats,
    impact_frames,
    camera: rawShot.camera,
    transitions,
    raw: rawShot,
  };
}

/**
 * Validates a single transition against the list of shots.
 */
export function validateTransition(
  trans: ShotTransition,
  shots: NormalizedShot[]
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Allowed transition type
  if (!ALLOWED_TRANSITION_TYPES.includes(trans.transition_type)) {
    errors.push(
      `Transition ${trans.from_shot || '?'} -> ${trans.to_shot || '?'}: Invalid transition_type "${trans.transition_type}". Must be one of: ${ALLOWED_TRANSITION_TYPES.join(', ')}.`
    );
  }

  // 2. Shot existence
  const fromIdx = shots.findIndex((s) => s.id === trans.from_shot);
  const toIdx = shots.findIndex((s) => s.id === trans.to_shot);

  if (fromIdx === -1) {
    errors.push(`Transition references unknown from_shot "${trans.from_shot}".`);
  }
  if (toIdx === -1) {
    errors.push(`Transition references unknown to_shot "${trans.to_shot}".`);
  }

  if (fromIdx !== -1 && toIdx !== -1) {
    // Must be consecutive shots
    if (toIdx !== fromIdx + 1) {
      errors.push(
        `Transition invalid: "${trans.to_shot}" is not the consecutive successor of "${trans.from_shot}".`
      );
    }

    const fromShot = shots[fromIdx];
    const toShot = shots[toIdx];
    const boundary = fromShot.endFrame;

    const [tStart, tEnd] = trans.transition_frames;
    if (typeof tStart !== 'number' || isNaN(tStart) || typeof tEnd !== 'number' || isNaN(tEnd) || tStart > tEnd) {
      errors.push(
        `Transition ${trans.from_shot} -> ${trans.to_shot}: Invalid transition_frames [${tStart}, ${tEnd}].`
      );
    } else {
      if (tStart < fromShot.startFrame) {
        errors.push(
          `Transition ${trans.from_shot} -> ${trans.to_shot}: Start frame ${tStart} precedes ${fromShot.id}.startFrame (${fromShot.startFrame}).`
        );
      }
      if (tEnd > toShot.endFrame) {
        errors.push(
          `Transition ${trans.from_shot} -> ${trans.to_shot}: End frame ${tEnd} exceeds ${toShot.id}.endFrame (${toShot.endFrame}).`
        );
      }
      if (tStart > boundary || tEnd < boundary) {
        errors.push(
          `Transition ${trans.from_shot} -> ${trans.to_shot}: Window [${tStart}, ${tEnd}] does not cover boundary frame ${boundary}.`
        );
      }
    }
  }

  // 3. Expected discontinuity
  if (
    typeof trans.expected_visual_discontinuity !== 'boolean' &&
    (typeof trans.expected_visual_discontinuity !== 'number' ||
      isNaN(trans.expected_visual_discontinuity) ||
      trans.expected_visual_discontinuity <= 0)
  ) {
    errors.push(
      `Transition ${trans.from_shot} -> ${trans.to_shot}: expected_visual_discontinuity must be true or a positive number.`
    );
  }

  return { errors, warnings };
}

/**
 * Validates a single shot definition.
 */
export function validateSingleShot(shot: NormalizedShot): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!shot.id || shot.id.trim().length === 0) {
    errors.push('Missing required field: id / shot_id');
  }

  if (typeof shot.startFrame !== 'number' || isNaN(shot.startFrame) || shot.startFrame < 0) {
    errors.push(`Invalid startFrame: ${shot.startFrame}. Must be >= 0.`);
  }

  if (typeof shot.endFrame !== 'number' || isNaN(shot.endFrame) || shot.endFrame <= shot.startFrame) {
    errors.push(`Invalid endFrame: ${shot.endFrame}. Must be strictly greater than startFrame (${shot.startFrame}).`);
  }

  if (!shot.start_state || Object.keys(shot.start_state).length === 0) {
    errors.push(`Shot ${shot.id}: Missing or empty start_state.`);
  }

  if (!shot.end_state || Object.keys(shot.end_state).length === 0) {
    errors.push(`Shot ${shot.id}: Missing or empty end_state.`);
  }

  // Validate impact frames are within [startFrame, endFrame]
  for (const f of shot.impact_frames) {
    if (typeof f !== 'number' || isNaN(f)) {
      errors.push(`Shot ${shot.id}: Impact frame must be a number, received: ${f}`);
    } else if (f < shot.startFrame || f > shot.endFrame) {
      errors.push(
        `Shot ${shot.id}: Declared impact frame ${f} falls outside shot duration [${shot.startFrame}, ${shot.endFrame}].`
      );
    }
  }

  // Validate key beats if present
  if (Array.isArray(shot.key_beats) && shot.key_beats.length > 0) {
    for (let i = 0; i < shot.key_beats.length; i++) {
      const b = shot.key_beats[i];
      if (typeof b.frame !== 'number' || isNaN(b.frame)) {
        errors.push(`Shot ${shot.id}: Beat [${i}] missing valid numeric frame.`);
      } else if (b.frame < shot.startFrame || b.frame > shot.endFrame) {
        errors.push(
          `Shot ${shot.id}: Beat [${i}] frame ${b.frame} falls outside shot duration [${shot.startFrame}, ${shot.endFrame}].`
        );
      }
    }
  }

  return { errors, warnings };
}

/**
 * Validates continuity between consecutive shots S_N and S_{N+1}.
 * When a motivated transition is declared between the shots, intentional camera or state jumps are allowed.
 */
export function validateShotContinuity(
  prevShot: NormalizedShot,
  currShot: NormalizedShot,
  declaredTransitions: ShotTransition[] = []
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Frame continuity: consecutive shots must connect with 0 gap/overlap
  if (prevShot.endFrame !== currShot.startFrame) {
    const msg = `Frame gap or overlap between Shot ${prevShot.id} (ends at ${prevShot.endFrame}) and Shot ${currShot.id} (starts at ${currShot.startFrame}).`;
    errors.push(msg);
  }

  // Check if an active transition is declared between these consecutive shots
  const activeTransition = declaredTransitions.find(
    (t) => t.from_shot === prevShot.id && t.to_shot === currShot.id
  );

  // 2. Camera continuity: S_N.end_state.camera == S_{N+1}.start_state.camera
  const prevCam = extractCameraFromState(prevShot.end_state);
  const currCam = extractCameraFromState(currShot.start_state);

  if (prevCam && currCam) {
    const dx = Math.abs(prevCam.x - currCam.x);
    const dy = Math.abs(prevCam.y - currCam.y);
    const dz = Math.abs(prevCam.zoom - currCam.zoom);

    if (dx > 0.001 || dy > 0.001 || dz > 0.001) {
      if (!activeTransition) {
        errors.push(
          `Continuity violation for 'camera': Shot ${prevShot.id}.end_state camera (${JSON.stringify(prevCam)}) does not match Shot ${currShot.id}.start_state camera (${JSON.stringify(currCam)}) without a declared motivated transition.`
        );
      }
    }
  }

  // 3. Generic state key continuity check
  if (prevShot.end_state && currShot.start_state && !activeTransition) {
    for (const key of Object.keys(prevShot.end_state)) {
      if (['camera', 'camera_zoom', 'camera_x', 'camera_y', 'zoom', 'scale'].includes(key)) {
        continue;
      }
      if (key in currShot.start_state) {
        const prevVal = JSON.stringify(prevShot.end_state[key]);
        const nextVal = JSON.stringify(currShot.start_state[key]);
        if (prevVal !== nextVal) {
          errors.push(
            `Continuity violation for '${key}': Shot ${prevShot.id}.end_state (${prevVal}) does not match Shot ${currShot.id}.start_state (${nextVal}).`
          );
        }
      }
    }
  }

  return { errors, warnings };
}

/**
 * Extracts all whitelisted transitions from a ShotSpec object.
 */
export function extractWhitelistedTransitions(shotSpecData: any): ShotTransition[] {
  if (!shotSpecData) return [];
  const rawList: any[] = [];

  if (Array.isArray(shotSpecData.transitions)) {
    rawList.push(...shotSpecData.transitions);
  }

  const shots = Array.isArray(shotSpecData.shots)
    ? shotSpecData.shots
    : Array.isArray(shotSpecData)
    ? shotSpecData
    : [];

  for (const s of shots) {
    if (Array.isArray(s.transitions)) {
      for (const t of s.transitions) {
        rawList.push(normalizeTransition(t, s.id));
      }
    } else if (s.transition) {
      rawList.push(normalizeTransition(s.transition, s.id));
    }
  }

  return rawList.map((t) => normalizeTransition(t));
}

/**
 * Extracts all frames that are permitted to have visual discontinuity spikes:
 * includes discrete impact frames AND all frames inside active transition windows.
 */
export function extractWhitelistedDiscontinuityFrames(shotSpecData: any): {
  impactFrames: number[];
  transitionWindows: [number, number][];
  allWhitelistedFrames: number[];
} {
  const frames = new Set<number>();
  const transitions = extractWhitelistedTransitions(shotSpecData);
  const transitionWindows: [number, number][] = [];

  // 1. Add discrete impact frames
  const shots = Array.isArray(shotSpecData?.shots)
    ? shotSpecData.shots
    : Array.isArray(shotSpecData)
    ? shotSpecData
    : [];

  for (const s of shots) {
    const rawImpacts = s.impact_frames ?? s.whitelisted_impact_frames ?? [];
    if (Array.isArray(rawImpacts)) {
      for (const f of rawImpacts) {
        if (typeof f === 'number') frames.add(f);
      }
    }
  }

  // 2. Add transition window frames
  for (const t of transitions) {
    const [start, end] = t.transition_frames;
    transitionWindows.push([start, end]);
    for (let f = start; f <= end; f++) {
      frames.add(f);
    }
  }

  return {
    impactFrames: Array.from(frames).sort((a, b) => a - b),
    transitionWindows,
    allWhitelistedFrames: Array.from(frames).sort((a, b) => a - b),
  };
}

/**
 * Validates a full ShotSpec data structure (object with { shots: [...] } or array of shots).
 */
export function validateShotSpecData(data: any): ShotValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  if (!data || (typeof data !== 'object' && !Array.isArray(data))) {
    allErrors.push('ShotSpec data must be an object or array');
    return { valid: false, isValid: false, errors: allErrors, warnings: allWarnings };
  }

  const rawShots: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data.shots)
    ? data.shots
    : [data];

  if (rawShots.length === 0) {
    allErrors.push('ShotSpec contains 0 shots');
    return { valid: false, isValid: false, errors: allErrors, warnings: allWarnings };
  }

  const normalizedShots: NormalizedShot[] = rawShots.map((s, idx) => normalizeShot(s, idx));

  // Extract all transitions
  const transitions: ShotTransition[] = extractWhitelistedTransitions(data);

  // Validate transitions
  for (const t of transitions) {
    const tRes = validateTransition(t, normalizedShots);
    allErrors.push(...tRes.errors);
    allWarnings.push(...tRes.warnings);
  }

  // Validate each individual shot
  for (const shot of normalizedShots) {
    const singleRes = validateSingleShot(shot);
    allErrors.push(...singleRes.errors);
    allWarnings.push(...singleRes.warnings);
  }

  // Validate continuity across consecutive pairs
  for (let i = 1; i < normalizedShots.length; i++) {
    const continuityRes = validateShotContinuity(normalizedShots[i - 1], normalizedShots[i], transitions);
    allErrors.push(...continuityRes.errors);
    allWarnings.push(...continuityRes.warnings);
  }

  const valid = allErrors.length === 0;
  return {
    valid,
    isValid: valid,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Polymorphic validator function:
 * - If called with (currShot, prevShot): validates currShot and continuity with prevShot.
 * - If called with single argument containing multiple shots: validates entire sequence.
 * - If called with single shot: validates that single shot.
 */
export function validateShotSpec(shotOrData: any, previousShot?: any): ShotValidationResult {
  // Case 1: Called with previousShot (e.g. from T3-COMB-14 or T4-SCEN-04)
  if (previousShot !== undefined) {
    const currNorm = normalizeShot(shotOrData, 1);
    const prevNorm = normalizeShot(previousShot, 0);

    const singleRes = validateSingleShot(currNorm);
    const continuityRes = validateShotContinuity(prevNorm, currNorm, currNorm.transitions || []);

    const errors = [...singleRes.errors, ...continuityRes.errors];
    const warnings = [...singleRes.warnings, ...continuityRes.warnings];
    const valid = errors.length === 0;

    return {
      valid,
      isValid: valid,
      errors,
      warnings,
    };
  }

  // Case 2: Multi-shot object or array
  if (Array.isArray(shotOrData) || (shotOrData && Array.isArray(shotOrData.shots))) {
    return validateShotSpecData(shotOrData);
  }

  // Case 3: Single shot object
  if (shotOrData && typeof shotOrData === 'object') {
    const norm = normalizeShot(shotOrData, 0);
    const singleRes = validateSingleShot(norm);
    const valid = singleRes.errors.length === 0;
    return {
      valid,
      isValid: valid,
      errors: singleRes.errors,
      warnings: singleRes.warnings,
    };
  }

  return {
    valid: false,
    isValid: false,
    errors: ['Invalid ShotSpec input'],
    warnings: [],
  };
}

// ---------------------------------------------------------------------------
// CLI Execution
// ---------------------------------------------------------------------------

export function runCli(args: string[] = process.argv.slice(2)): void {
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
📋 [SHOT-SPEC VALIDATOR] Shot Specification & Inter-Shot Continuity Validator

Usage:
  npx tsx validators/validate-shot-spec.ts <path-to-shot-spec.json> [options]

Options:
  --json       Output machine-readable JSON summary
  --strict     Enforce strict mode (default)
  -h, --help   Display this usage guide
`);
    process.exit(args.length === 0 ? 1 : 0);
  }

  const jsonOutput = args.includes('--json');
  const targetFiles = args.filter((a: string) => !a.startsWith('-'));

  if (targetFiles.length === 0) {
    console.error('Error: ShotSpec file path is required.');
    process.exit(1);
  }

  let overallPassed = true;
  const allResults: Record<string, ShotValidationResult> = {};

  for (const file of targetFiles) {
    const resolvedPath = path.resolve(file);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`File not found: ${resolvedPath}`);
      overallPassed = false;
      continue;
    }

    try {
      const data = parseShotSpec(resolvedPath);
      const result = validateShotSpecData(data);
      allResults[file] = result;

      if (!result.valid) {
        overallPassed = false;
      }

      if (!jsonOutput) {
        console.log(`\n📋 Validating ShotSpec: ${file}`);
        if (result.valid) {
          console.log(`  ✅ [PASS] All shot specifications and continuity constraints satisfied.`);
        } else {
          console.log(`  ❌ [FAIL] ${result.errors.length} validation error(s) found:`);
          for (const err of result.errors) {
            console.log(`     - 🔴 ${err}`);
          }
        }
        if (result.warnings.length > 0) {
          for (const warn of result.warnings) {
            console.log(`     - 🟡 Warning: ${warn}`);
          }
        }
      }
    } catch (err: any) {
      overallPassed = false;
      if (!jsonOutput) {
        console.error(`  ❌ [ERROR] Failed to parse ${file}: ${err.message}`);
      }
    }
  }

  if (jsonOutput) {
    console.log(JSON.stringify({ passed: overallPassed, results: allResults }, null, 2));
  } else {
    console.log(`\n================================================================================`);
    if (overallPassed) {
      console.log(`✅ [PASSED] 100% of examined ShotSpec files satisfy schema & continuity.\n`);
    } else {
      console.log(`❌ [FAILED] One or more ShotSpec files failed validation.\n`);
    }
  }

  process.exit(overallPassed ? 0 : 1);
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
