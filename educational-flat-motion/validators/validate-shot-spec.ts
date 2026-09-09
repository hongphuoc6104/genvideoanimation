#!/usr/bin/env tsx
/**
 * VALIDATE SHOT SPEC
 * Validates a shot specification file (JSON or Markdown) against shot-schema.json
 * and the continuity constraints defined in the skill.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ShotSpecBeat {
  frame: number;
  subject: string;
  intent: string;
  values?: Record<string, unknown>;
}

export interface ShotSpecData {
  shot_id: string;
  start_frame: number;
  end_frame: number;
  narrative_purpose: string;
  start_state: Record<string, unknown>;
  end_state: Record<string, unknown>;
  key_beats: ShotSpecBeat[];
  camera?: Record<string, unknown>;
  transition_in?: Record<string, unknown>;
  transition_out?: Record<string, unknown>;
  audio_cues?: Array<{ frame: number; cue: string; type: string }>;
}

export interface ShotValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateShotSpec(shot: ShotSpecData, previousShot?: ShotSpecData): ShotValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields check
  if (!shot.shot_id) errors.push('Missing required field: shot_id');
  if (typeof shot.start_frame !== 'number' || shot.start_frame < 0) {
    errors.push(`Invalid start_frame: ${shot.start_frame}. Must be >= 0.`);
  }
  if (typeof shot.end_frame !== 'number' || shot.end_frame <= shot.start_frame) {
    errors.push(`Invalid end_frame: ${shot.end_frame}. Must be strictly greater than start_frame (${shot.start_frame}).`);
  }
  if (!shot.narrative_purpose || shot.narrative_purpose.trim().length < 5) {
    errors.push('narrative_purpose must be a descriptive string at least 5 characters long.');
  }
  if (!shot.start_state || Object.keys(shot.start_state).length === 0) {
    errors.push('Missing or empty start_state.');
  }
  if (!shot.end_state || Object.keys(shot.end_state).length === 0) {
    errors.push('Missing or empty end_state.');
  }
  if (!Array.isArray(shot.key_beats) || shot.key_beats.length === 0) {
    errors.push('key_beats must be a non-empty array of keyframe events.');
  } else {
    // Validate each beat
    for (let i = 0; i < shot.key_beats.length; i++) {
      const beat = shot.key_beats[i];
      if (typeof beat.frame !== 'number') {
        errors.push(`Beat [${i}] missing valid numeric frame.`);
      } else if (beat.frame < shot.start_frame || beat.frame > shot.end_frame) {
        errors.push(
          `Beat [${i}] frame ${beat.frame} falls outside shot duration [${shot.start_frame} - ${shot.end_frame}].`
        );
      }
      if (!beat.subject) errors.push(`Beat [${i}] missing subject.`);
      if (!beat.intent) errors.push(`Beat [${i}] missing intent.`);
    }
  }

  // Continuity check across adjacent shots:
  // shot[N].end_state == shot[N+1].start_state
  if (previousShot) {
    if (previousShot.end_frame !== shot.start_frame) {
      warnings.push(
        `Frame gap or overlap between Shot ${previousShot.shot_id} (ends ${previousShot.end_frame}) and Shot ${shot.shot_id} (starts ${shot.start_frame}).`
      );
    }
    // Check key matching state properties
    for (const key of Object.keys(previousShot.end_state)) {
      if (key in shot.start_state) {
        const prevVal = JSON.stringify(previousShot.end_state[key]);
        const nextVal = JSON.stringify(shot.start_state[key]);
        if (prevVal !== nextVal) {
          errors.push(
            `Continuity violation for '${key}': Shot ${previousShot.shot_id}.end_state (${prevVal}) does not match Shot ${shot.shot_id}.start_state (${nextVal}).`
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// CLI Execution
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: npx tsx validate-shot-spec.ts <path-to-shot-spec.json>');
    process.exit(0);
  }

  const filePath = path.resolve(args[0]);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const shots: ShotSpecData[] = Array.isArray(data) ? data : [data];

    let allValid = true;
    console.log(`📋 Validating ${shots.length} shot spec(s) from ${filePath}...\n`);

    for (let i = 0; i < shots.length; i++) {
      const prev = i > 0 ? shots[i - 1] : undefined;
      const res = validateShotSpec(shots[i], prev);

      if (res.valid) {
        console.log(`✅ [PASS] Shot ${shots[i].shot_id || i + 1}`);
      } else {
        allValid = false;
        console.log(`❌ [FAIL] Shot ${shots[i].shot_id || i + 1}:`);
        res.errors.forEach((e) => console.log(`   - Error: ${e}`));
      }
      res.warnings.forEach((w) => console.log(`   - Warning: ${w}`));
    }

    if (allValid) {
      console.log('\n✨ All shot specs passed validation!');
      process.exit(0);
    } else {
      console.error('\n❌ Shot spec validation failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Failed to parse or validate shot spec:', err);
    process.exit(1);
  }
}
