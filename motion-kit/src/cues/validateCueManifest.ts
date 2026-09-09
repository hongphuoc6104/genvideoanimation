/**
 * CUE MANIFEST SCHEMA & EVENT VALIDATOR
 * Enforces non-negative integer frame bounds and well-formed cue events.
 */

export function validateCueEvent(cue: unknown): boolean {
  if (!cue || typeof cue !== 'object') {
    throw new Error('Cue event must be an object');
  }

  const c = cue as Record<string, unknown>;

  if (typeof c.id !== 'string' || c.id.trim().length === 0) {
    throw new Error('Cue event missing valid non-empty id');
  }

  if (typeof c.frame !== 'number' || isNaN(c.frame)) {
    throw new Error('Cue event frame must be a number');
  }

  if (!Number.isInteger(c.frame)) {
    throw new Error(`Cue event frame must be an integer, received: ${c.frame}`);
  }

  if (c.frame < 0) {
    throw new Error(`Cue event frame must be >= 0 (non-negative integer), received: ${c.frame}`);
  }

  return true;
}

export function validateCueManifest(manifestOrCue: unknown): boolean {
  if (!manifestOrCue || typeof manifestOrCue !== 'object') {
    throw new Error('Invalid cue manifest: expected object');
  }

  const obj = manifestOrCue as Record<string, unknown>;

  // If a single cue event was passed
  if ('frame' in obj && !('cues' in obj)) {
    return validateCueEvent(obj);
  }

  // If it's a CueManifest
  if (typeof obj.fps === 'number') {
    if (obj.fps <= 0 || !Number.isFinite(obj.fps)) {
      throw new Error(`Cue manifest fps must be a positive number, received: ${obj.fps}`);
    }
  }

  if (Array.isArray(obj.cues)) {
    for (const cue of obj.cues) {
      validateCueEvent(cue);
    }
  }

  return true;
}
