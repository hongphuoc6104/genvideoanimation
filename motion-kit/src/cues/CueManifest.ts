/**
 * CENTRAL CUE MANIFEST & AUDIO SYNCHRONIZATION
 * Single source-of-truth linking visual Remotion timing markers to audio events.
 * Supports automated audio track mixdown generation (FFmpeg) and in-composition playback.
 */

export interface CueEvent {
  id: string;
  frame: number;
  timeSec?: number;
  category?: 'whoosh' | 'impact' | 'chime' | 'ui_accent' | 'action' | 'narrative' | 'transition' | string;
  type?: 'narrative' | 'sfx' | 'music_hit' | 'action' | 'impact' | 'transition' | string;
  label?: string;
  description?: string;
  soundFx?: string; // audio asset file relative to public/
  volume?: number; // 0 to 1
  durationFrames?: number;
}

export type CueItem = CueEvent;

export interface CueManifest {
  compositionId?: string;
  fps: number;
  durationInFrames?: number;
  cues: CueEvent[];
}

/**
 * Creates a validated CueManifest with computed millisecond/second timestamps.
 * Supports calling with:
 *   createCueManifest(compositionId: string, durationInFrames?: number, fps?: number, rawCues?: CueEvent[])
 * or
 *   createCueManifest({ compositionId, fps, durationInFrames, cues })
 */
export function createCueManifest(
  compositionIdOrConfig: string | { compositionId?: string; fps?: number; durationInFrames?: number; cues?: Array<Omit<CueEvent, 'timeSec'> | CueEvent> },
  durationInFrames: number = 300,
  fps: number = 30,
  rawCues: Array<Omit<CueEvent, 'timeSec'> | CueEvent> = []
): CueManifest {
  let compositionId = 'composition';
  let effectiveFps = fps;
  let effectiveDuration = durationInFrames;
  let effectiveCues = rawCues;

  if (typeof compositionIdOrConfig === 'string') {
    compositionId = compositionIdOrConfig;
  } else if (compositionIdOrConfig && typeof compositionIdOrConfig === 'object') {
    compositionId = compositionIdOrConfig.compositionId ?? 'composition';
    effectiveFps = compositionIdOrConfig.fps ?? fps ?? 30;
    effectiveDuration = compositionIdOrConfig.durationInFrames ?? durationInFrames ?? 300;
    effectiveCues = compositionIdOrConfig.cues ?? rawCues ?? [];
  }

  const cues: CueEvent[] = effectiveCues
    .map((c) => ({
      ...c,
      timeSec: ('timeSec' in c && c.timeSec !== undefined) ? c.timeSec : c.frame / effectiveFps,
    }))
    .sort((a, b) => a.frame - b.frame);

  return {
    compositionId,
    fps: effectiveFps,
    durationInFrames: effectiveDuration,
    cues,
  };
}

/**
 * Finds all cues triggered on or near a specific frame.
 */
export function getActiveCues(
  manifest: CueManifest,
  frame: number,
  toleranceFrames: number = 0
): CueEvent[] {
  if (!manifest || !Array.isArray(manifest.cues)) return [];
  return manifest.cues.filter((c) => Math.abs(c.frame - frame) <= toleranceFrames);
}

/**
 * Generates an FFmpeg complex filter command to mix down all SFX and music cues
 * with sample-accurate millisecond offsets for standalone audio generation.
 */
export function generateAudioMixScript(
  manifest: CueManifest,
  soundAssetsDir: string = 'public/audio',
  outputAudio: string = 'out/mixed_soundtrack.wav'
): string {
  if (!manifest || !Array.isArray(manifest.cues)) {
    return `# Invalid manifest`;
  }
  const sfxCues = manifest.cues.filter((c) => c.soundFx);
  if (sfxCues.length === 0) {
    return `# No SFX cues defined in manifest for ${manifest.compositionId || 'default'}`;
  }

  const inputs = sfxCues.map((c) => `-i "${soundAssetsDir}/${c.soundFx}"`).join(' ');
  const filterParts: string[] = [];

  sfxCues.forEach((c, idx) => {
    const timeSec = c.timeSec ?? c.frame / (manifest.fps || 30);
    const delayMs = Math.round(timeSec * 1000);
    const vol = c.volume !== undefined ? c.volume : 1.0;
    filterParts.push(`[${idx}:a]adelay=${delayMs}|${delayMs},volume=${vol}[a${idx}]`);
  });

  const mixInputs = sfxCues.map((_, idx) => `[a${idx}]`).join('');
  const filterComplex = `${filterParts.join(';')};${mixInputs}amix=inputs=${sfxCues.length}:normalize=0[outa]`;

  return `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[outa]" "${outputAudio}"`;
}
