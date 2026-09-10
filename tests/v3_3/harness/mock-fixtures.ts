/**
 * Authoritative Schema Definitions, Mock Payload Generators, and JSON Validation Helpers
 * for V3.3 Production Contracts:
 * - ProductionPolicy (R1)
 * - SemanticTimeline (R6)
 * - ShotSpec (R7)
 * - AudioDependencyGraph (R8)
 * - SourceContentMap (R11)
 * - QAReport (R17)
 */

// ============================================================================
// 1. ProductionPolicy
// ============================================================================

export interface ProductionPolicy {
  version: '3.3.0';
  canvas: {
    width: 1080;
    height: 1920;
    aspectRatio: '9:16';
    fps: 30;
    preview: { width: 360; height: 640; scale: number };
    safeMargins: {
      horizontal: number;
      vertical: number;
      captionRegion: { top: number; bottom: number };
    };
  };
  typography: {
    minimums: {
      hero: number;
      section: number;
      card: number;
      body: number;
      secondary: number;
      caption: number;
      citation: number;
    };
    enforceEffectiveScale: boolean;
    absoluteMobileFloor: number;
  };
  audio: {
    policy: 'narration-sfx';
    strategy: 'PREMIXED';
    targetLoudnessLufs: number;
    loudnessToleranceLufs: number;
    truePeakCeilingDbTp: number;
    sampleRate: number;
    channels: number;
    bitDepth: number;
    allowMusic: boolean;
    rolePauses: {
      withinClause: [number, number];
      normalSentence: [number, number];
      semanticTurn: [number, number];
      majorSectionTransition: [number, number];
      payoffRealization: [number, number];
      maxUnmotivatedPause: number;
    };
  };
  speech: {
    primaryLanguage: string;
    secondaryLanguage: string;
    defaultEngine: string;
    defaultVoice: string;
    fallbackEngine: string;
  };
  acceptance: {
    overallRubricMin: number;
    floorRubricMin: number;
    criticalRubricMin: number;
    contentCoverageRatio: number;
    maxAllowedTemporalSpikes: number;
    maxAllowedAbsolutePaths: number;
    maxAllowedDualAudioTags: number;
  };
}

export function createMockProductionPolicy(overrides: Partial<ProductionPolicy> = {}): ProductionPolicy {
  const base: ProductionPolicy = {
    version: '3.3.0',
    canvas: {
      width: 1080,
      height: 1920,
      aspectRatio: '9:16',
      fps: 30,
      preview: { width: 360, height: 640, scale: 0.3333333333333333 },
      safeMargins: {
        horizontal: 80,
        vertical: 140,
        captionRegion: { top: 1600, bottom: 1800 },
      },
    },
    typography: {
      minimums: {
        hero: 64,
        section: 48,
        card: 38,
        body: 34,
        secondary: 30,
        caption: 52,
        citation: 22,
      },
      enforceEffectiveScale: true,
      absoluteMobileFloor: 30,
    },
    audio: {
      policy: 'narration-sfx',
      strategy: 'PREMIXED',
      targetLoudnessLufs: -15.0,
      loudnessToleranceLufs: 1.0,
      truePeakCeilingDbTp: -1.8,
      sampleRate: 48000,
      channels: 2,
      bitDepth: 16,
      allowMusic: false,
      rolePauses: {
        withinClause: [0.08, 0.2],
        normalSentence: [0.18, 0.4],
        semanticTurn: [0.25, 0.55],
        majorSectionTransition: [0.4, 0.8],
        payoffRealization: [0.3, 0.65],
        maxUnmotivatedPause: 0.85,
      },
    },
    speech: {
      primaryLanguage: 'vi-VN',
      secondaryLanguage: 'en',
      defaultEngine: 'VieNeu-TTS',
      defaultVoice: 'Adam',
      fallbackEngine: 'Kokoro',
    },
    acceptance: {
      overallRubricMin: 4.5,
      floorRubricMin: 4.0,
      criticalRubricMin: 4.3,
      contentCoverageRatio: 1.0,
      maxAllowedTemporalSpikes: 0,
      maxAllowedAbsolutePaths: 0,
      maxAllowedDualAudioTags: 0,
    },
  };

  return {
    ...base,
    ...overrides,
    canvas: { ...base.canvas, ...(overrides.canvas || {}) },
    typography: { ...base.typography, ...(overrides.typography || {}) },
    audio: { ...base.audio, ...(overrides.audio || {}) },
    speech: { ...base.speech, ...(overrides.speech || {}) },
    acceptance: { ...base.acceptance, ...(overrides.acceptance || {}) },
  };
}

export function validateProductionPolicy(policy: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!policy || typeof policy !== 'object') {
    return { valid: false, errors: ['Policy must be a non-null object'] };
  }
  const p = policy as any;

  if (p.version !== '3.3.0') errors.push(`Invalid version: expected "3.3.0", got "${p.version}"`);
  if (!p.canvas || p.canvas.width !== 1080 || p.canvas.height !== 1920 || p.canvas.fps !== 30) {
    errors.push('Canvas must be 1080x1920 at 30fps');
  }
  if (!p.typography?.minimums) {
    errors.push('Missing typography minimums configuration');
  } else {
    const m = p.typography.minimums;
    if (m.hero < 64) errors.push(`hero minimum must be >= 64, got ${m.hero}`);
    if (m.section < 48) errors.push(`section minimum must be >= 48, got ${m.section}`);
    if (m.card < 38) errors.push(`card minimum must be >= 38, got ${m.card}`);
    if (m.body < 34) errors.push(`body minimum must be >= 34, got ${m.body}`);
    if (m.secondary < 30) errors.push(`secondary minimum must be >= 30, got ${m.secondary}`);
    if (p.typography.absoluteMobileFloor < 30) errors.push(`absoluteMobileFloor must be >= 30, got ${p.typography.absoluteMobileFloor}`);
  }
  if (p.audio?.policy !== 'narration-sfx') errors.push(`audio.policy must be "narration-sfx", got "${p.audio?.policy}"`);
  if (p.audio?.strategy !== 'PREMIXED') errors.push(`audio.strategy must be "PREMIXED", got "${p.audio?.strategy}"`);
  if (p.audio?.allowMusic !== false) errors.push(`audio.allowMusic must be false`);
  if (p.speech?.defaultVoice !== 'Adam') errors.push(`speech.defaultVoice must be "Adam", got "${p.speech?.defaultVoice}"`);
  if (p.acceptance?.contentCoverageRatio !== 1.0) errors.push(`acceptance.contentCoverageRatio must be 1.0`);

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// 2. SemanticTimeline
// ============================================================================

export interface SemanticBeat {
  id: string;
  shotId: string;
  narrationTokenRange: [number, number];
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
  visualIntent: string;
  primaryObject: string;
  cameraIntent: string;
  conceptId: string;
  sfxIntent?: { asset: string; frame: number; volume: number };
  captionIntent?: { displayText: string; layout: 'bottom' | 'top'; fontSize: number };
}

export interface SemanticTimeline {
  version: '3.3.0';
  compositionId: string;
  totalFrames: number;
  durationSec: number;
  fps: 30;
  beats: SemanticBeat[];
}

export function createMockSemanticTimeline(overrides: Partial<SemanticTimeline> = {}): SemanticTimeline {
  const baseBeats: SemanticBeat[] = [
    {
      id: 'beat_01',
      shotId: 'shot_01',
      narrationTokenRange: [0, 19],
      startSec: 0.0,
      endSec: 3.867,
      startFrame: 0,
      endFrame: 116,
      visualIntent: 'Desk reject paradox & manuscript rejection impact',
      primaryObject: 'rejected_manuscript_stamp',
      cameraIntent: 'push_in_focus',
      conceptId: 'concept_01_rejection_paradox',
      sfxIntent: { asset: 'public/audio/sfx/stamp_reject.wav', frame: 45, volume: 0.85 },
      captionIntent: {
        displayText: 'Tại sao bài báo có số liệu tốt phương pháp mạnh vẫn bị Desk Reject ngay từ vòng đầu',
        layout: 'bottom',
        fontSize: 56,
      },
    },
    {
      id: 'beat_02',
      shotId: 'shot_01',
      narrationTokenRange: [20, 38],
      startSec: 3.867,
      endSec: 7.5,
      startFrame: 116,
      endFrame: 225,
      visualIntent: 'Scholarly conversation criteria and expectations',
      primaryObject: 'knowledge_dialogue_hub',
      cameraIntent: 'steady_pan',
      conceptId: 'concept_02_scholarly_dialogue',
      captionIntent: {
        displayText: 'Bản chất chuẩn Scopus không phải hình thức hay câu chữ cảm tính',
        layout: 'bottom',
        fontSize: 56,
      },
    },
  ];

  return {
    version: '3.3.0',
    compositionId: 'scopus-explainer',
    totalFrames: 225,
    durationSec: 7.5,
    fps: 30,
    beats: baseBeats,
    ...overrides,
  };
}

export function validateSemanticTimeline(timeline: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!timeline || typeof timeline !== 'object') {
    return { valid: false, errors: ['Timeline must be a non-null object'] };
  }
  const t = timeline as any;

  if (t.version !== '3.3.0') errors.push(`Invalid timeline version: expected "3.3.0", got "${t.version}"`);
  if (t.fps !== 30) errors.push(`fps must be 30, got ${t.fps}`);
  if (!Array.isArray(t.beats) || t.beats.length === 0) {
    errors.push('Timeline must contain a non-empty array of beats');
    return { valid: false, errors };
  }

  let prevEndFrame = 0;
  for (let i = 0; i < t.beats.length; i++) {
    const b = t.beats[i];
    if (!b.id) errors.push(`Beat at index ${i} missing "id"`);
    if (!b.conceptId) errors.push(`Beat ${b.id || i} missing "conceptId"`);
    if (b.startFrame === undefined || b.endFrame === undefined) {
      errors.push(`Beat ${b.id || i} missing startFrame or endFrame`);
      continue;
    }
    if (b.startFrame >= b.endFrame) {
      errors.push(`Beat ${b.id}: startFrame (${b.startFrame}) must be strictly less than endFrame (${b.endFrame})`);
    }
    if (i > 0 && b.startFrame < prevEndFrame) {
      errors.push(`Beat ${b.id} overlaps with previous beat: startFrame ${b.startFrame} < prev endFrame ${prevEndFrame}`);
    }
    prevEndFrame = b.endFrame;
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// 3. ShotSpec
// ============================================================================

export const WHITELISTED_TRANSITIONS = [
  'object_match',
  'camera_carry',
  'shape_morph',
  'foreground_wipe',
  'continuing_trajectory',
  'semantic_zoom',
  'motivated_iris',
  'match_cut',
] as const;

export type MotivatedTransitionType = (typeof WHITELISTED_TRANSITIONS)[number];

export interface ShotItem {
  id: string;
  name: string;
  startFrame: number;
  endFrame: number;
  duration: number;
  camera: {
    start: [number, number, number];
    end: [number, number, number];
    damping?: number;
  };
  impact_frames?: number[];
  transition_frames?: [number, number];
  transition_type?: MotivatedTransitionType;
  expected_visual_discontinuity?: number;
}

export interface ShotSpec {
  version: '3.3.0';
  compositionId: string;
  shots: ShotItem[];
}

export function createMockShotSpec(overrides: Partial<ShotSpec> = {}): ShotSpec {
  const baseShots: ShotItem[] = [
    {
      id: 'shot_01',
      name: 'Introduction to Rejection Paradox',
      startFrame: 0,
      endFrame: 618,
      duration: 618,
      camera: { start: [0, 0, 1], end: [0, 0, 1.2], damping: 0.15 },
      impact_frames: [45, 120],
      transition_frames: [608, 628],
      transition_type: 'object_match',
      expected_visual_discontinuity: 2.5,
    },
    {
      id: 'shot_02',
      name: '5 Doors Taxonomy Overview',
      startFrame: 618,
      endFrame: 1309,
      duration: 691,
      camera: { start: [0, 0, 1.2], end: [0, -100, 1.0], damping: 0.15 },
      impact_frames: [750, 920],
      transition_frames: [1299, 1319],
      transition_type: 'foreground_wipe',
      expected_visual_discontinuity: 3.0,
    },
  ];

  return {
    version: '3.3.0',
    compositionId: 'scopus-explainer',
    shots: baseShots,
    ...overrides,
  };
}

export function validateShotSpec(spec: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!spec || typeof spec !== 'object') {
    return { valid: false, errors: ['ShotSpec must be a non-null object'] };
  }
  const s = spec as any;

  if (!Array.isArray(s.shots) || s.shots.length === 0) {
    return { valid: false, errors: ['ShotSpec must contain non-empty array of shots'] };
  }

  for (let i = 0; i < s.shots.length; i++) {
    const shot = s.shots[i];
    if (shot.startFrame === undefined || shot.endFrame === undefined) {
      errors.push(`Shot #${i} missing startFrame or endFrame`);
      continue;
    }
    if (shot.startFrame >= shot.endFrame) {
      errors.push(`Shot ${shot.id || i}: startFrame (${shot.startFrame}) >= endFrame (${shot.endFrame})`);
    }
    if (Array.isArray(shot.impact_frames)) {
      for (const imp of shot.impact_frames) {
        if (imp < shot.startFrame || imp > shot.endFrame) {
          errors.push(`Shot ${shot.id}: impact frame ${imp} outside shot bounds [${shot.startFrame}, ${shot.endFrame}]`);
        }
      }
    }
    if (shot.transition_type) {
      if (!WHITELISTED_TRANSITIONS.includes(shot.transition_type)) {
        errors.push(`Shot ${shot.id}: transition_type "${shot.transition_type}" is not in whitelisted motivated transitions`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// 4. AudioDependencyGraph
// ============================================================================

export interface AudioDependencyGraph {
  version: '3.3.0';
  strategy: 'PREMIXED';
  masterAudio: string;
  remotionMounts: Array<{ file: string; tag: string; line: number }>;
  tracks: {
    narration: { source: string; mixedIntoMaster: boolean };
    sfx: Array<{ id: string; asset: string; frame: number; mixedIntoMaster: boolean }>;
  };
  runtimePlayback: {
    discreteAudioTagsCount: number;
    duplicateSfxCount: number;
  };
}

export function createMockAudioDependencyGraph(overrides: Partial<AudioDependencyGraph> = {}): AudioDependencyGraph {
  return {
    version: '3.3.0',
    strategy: 'PREMIXED',
    masterAudio: 'public/audio/scopus_master_audio.wav',
    remotionMounts: [
      {
        file: 'connection-film/src/legacy/scopus-explainer/ScopusExplainerFilm.tsx',
        tag: '<Audio src={staticFile("audio/scopus_master_audio.wav")} />',
        line: 50,
      },
    ],
    tracks: {
      narration: {
        source: 'public/audio/narration/scopus_narration_vieneu.wav',
        mixedIntoMaster: true,
      },
      sfx: [
        { id: 'sfx_stamp', asset: 'public/audio/sfx/stamp_reject.wav', frame: 45, mixedIntoMaster: true },
        { id: 'sfx_node', asset: 'public/audio/sfx/node_connect.wav', frame: 162, mixedIntoMaster: true },
      ],
    },
    runtimePlayback: {
      discreteAudioTagsCount: 0,
      duplicateSfxCount: 0,
    },
    ...overrides,
  };
}

export function validateAudioDependencyGraph(graph: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!graph || typeof graph !== 'object') {
    return { valid: false, errors: ['AudioDependencyGraph must be an object'] };
  }
  const g = graph as any;

  if (g.strategy !== 'PREMIXED') errors.push(`strategy must be "PREMIXED", got "${g.strategy}"`);
  if (!Array.isArray(g.remotionMounts) || g.remotionMounts.length !== 1) {
    errors.push(`remotionMounts must contain exactly 1 master mount, got ${g.remotionMounts?.length || 0}`);
  }
  if (g.runtimePlayback?.discreteAudioTagsCount !== 0) {
    errors.push(`runtimePlayback.discreteAudioTagsCount must be 0, got ${g.runtimePlayback?.discreteAudioTagsCount}`);
  }
  if (g.runtimePlayback?.duplicateSfxCount !== 0) {
    errors.push(`runtimePlayback.duplicateSfxCount must be 0, got ${g.runtimePlayback?.duplicateSfxCount}`);
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// 5. SourceContentMap
// ============================================================================

export interface SourceContentUnit {
  conceptId: string;
  conceptTitle: string;
  sourceDocument: string;
  beatId: string;
  narrationExcerpt: string;
  covered: boolean;
}

export interface SourceContentMap {
  version: '3.3.0';
  sourceDocument: string;
  totalUnits: number;
  coveredUnits: number;
  coveragePercent: number;
  mappings: SourceContentUnit[];
}

export function createMockSourceContentMap(overrides: Partial<SourceContentMap> = {}): SourceContentMap {
  const mappings: SourceContentUnit[] = [
    {
      conceptId: 'concept_01_rejection_paradox',
      conceptTitle: 'Nghịch lý từ chối bài báo (Rejection Paradox)',
      sourceDocument: 'content/page_1.jpg',
      beatId: 'beat_01',
      narrationExcerpt: 'Tại sao bài báo có số liệu tốt phương pháp mạnh vẫn bị Desk Reject ngay từ vòng đầu',
      covered: true,
    },
    {
      conceptId: 'concept_02_scholarly_dialogue',
      conceptTitle: 'Bản chất đối thoại tri thức Scopus',
      sourceDocument: 'content/page_1.jpg',
      beatId: 'beat_02',
      narrationExcerpt: 'Bản chất chuẩn Scopus không phải hình thức hay câu chữ cảm tính',
      covered: true,
    },
  ];

  return {
    version: '3.3.0',
    sourceDocument: 'HƯỚNG DẪN XÁC ĐỊNH RESEARCH GAP THEO CHUẨN SCOPUS',
    totalUnits: mappings.length,
    coveredUnits: mappings.filter((m) => m.covered).length,
    coveragePercent: 100,
    mappings,
    ...overrides,
  };
}

export function validateSourceContentMap(map: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!map || typeof map !== 'object') {
    return { valid: false, errors: ['SourceContentMap must be an object'] };
  }
  const m = map as any;

  if (m.version !== '3.3.0') errors.push(`Invalid version: expected "3.3.0", got "${m.version}"`);
  if (!Array.isArray(m.mappings) || m.mappings.length === 0) {
    errors.push('Mappings must be a non-empty array');
    return { valid: false, errors };
  }

  const seenConcepts = new Set<string>();
  let coveredCount = 0;

  for (const unit of m.mappings) {
    if (!unit.conceptId) errors.push('Unit missing conceptId');
    if (seenConcepts.has(unit.conceptId)) errors.push(`Duplicate conceptId: ${unit.conceptId}`);
    seenConcepts.add(unit.conceptId);

    if (!unit.beatId) errors.push(`Unit ${unit.conceptId} missing beatId`);
    if (unit.covered) coveredCount++;
    else errors.push(`Unit ${unit.conceptId} marked as not covered`);
  }

  if (coveredCount !== m.mappings.length || m.coveragePercent !== 100) {
    errors.push(`Coverage deficit: ${coveredCount}/${m.mappings.length} units covered (${m.coveragePercent}%)`);
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// 6. QAReport
// ============================================================================

export interface QAScores {
  mobileReadability: number;
  effectiveTypographyScaling: number;
  informationDensity: number;
  progressiveDisclosure: number;
  mobileSafeMargins: number;
  karaokeCaptionPlacement: number;
  audioVisualSync: number;
  narrationAcousticQuality: number;
  roleAwarePauseCompliance: number;
  broadcastLoudnessCompliance: number;
  singleAudioOwnership: number;
  authoritativeTimelineDerivation: number;
  shotSpecValidity: number;
  motivatedTransitionsContinuity: number;
  previewLineageParity: number;
  realVideoDecodingIntegrity: number;
  sourceContentCoverage: number;
  productionPortability: number;
}

export const CRITICAL_CATEGORIES: Array<keyof QAScores> = [
  'mobileReadability',
  'effectiveTypographyScaling',
  'karaokeCaptionPlacement',
  'audioVisualSync',
  'narrationAcousticQuality',
  'singleAudioOwnership',
  'authoritativeTimelineDerivation',
  'shotSpecValidity',
  'motivatedTransitionsContinuity',
  'previewLineageParity',
  'realVideoDecodingIntegrity',
];

export interface QAReport {
  version: '3.3.0';
  timestamp: string;
  composition: string;
  certifiedBy: string;
  scores: QAScores;
  overallAverage: number;
  passed: boolean;
  verdict: 'CERTIFIED_PRODUCTION_GRADE' | 'REJECTED';
}

export function createMockQAReport(overrides: Partial<QAReport> = {}): QAReport {
  const scores: QAScores = {
    mobileReadability: 4.8,
    effectiveTypographyScaling: 4.7,
    informationDensity: 4.6,
    progressiveDisclosure: 4.8,
    mobileSafeMargins: 4.9,
    karaokeCaptionPlacement: 4.7,
    audioVisualSync: 4.9,
    narrationAcousticQuality: 4.8,
    roleAwarePauseCompliance: 4.6,
    broadcastLoudnessCompliance: 4.9,
    singleAudioOwnership: 5.0,
    authoritativeTimelineDerivation: 5.0,
    shotSpecValidity: 4.9,
    motivatedTransitionsContinuity: 4.8,
    previewLineageParity: 4.9,
    realVideoDecodingIntegrity: 5.0,
    sourceContentCoverage: 5.0,
    productionPortability: 5.0,
  };

  const values = Object.values(scores);
  const avg = Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2));

  return {
    version: '3.3.0',
    timestamp: '2026-09-10T14:00:00Z',
    composition: 'connection-film/src/legacy/scopus-explainer/ScopusExplainerFilm.tsx',
    certifiedBy: 'independent_reviewer_agent',
    scores,
    overallAverage: avg,
    passed: true,
    verdict: 'CERTIFIED_PRODUCTION_GRADE',
    ...overrides,
  };
}

export function validateQAReport(report: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!report || typeof report !== 'object') {
    return { valid: false, errors: ['QAReport must be an object'] };
  }
  const r = report as any;

  if (r.version !== '3.3.0') errors.push(`Invalid version: expected "3.3.0", got "${r.version}"`);
  if (!r.scores || typeof r.scores !== 'object') {
    errors.push('Report missing scores object');
    return { valid: false, errors };
  }

  const scoreKeys = Object.keys(r.scores);
  if (scoreKeys.length !== 18) {
    errors.push(`Scores must contain exactly 18 categories, got ${scoreKeys.length}`);
  }

  for (const [key, val] of Object.entries(r.scores)) {
    const num = val as number;
    if (typeof num !== 'number' || num < 1.0 || num > 5.0) {
      errors.push(`Score for "${key}" must be between 1.0 and 5.0, got ${num}`);
    }
    if (num < 4.0) {
      errors.push(`Category "${key}" failed floor minimum: score ${num} < 4.00`);
    }
    if (CRITICAL_CATEGORIES.includes(key as any) && num < 4.3) {
      errors.push(`Critical category "${key}" failed critical minimum: score ${num} < 4.30`);
    }
  }

  const vals = Object.values(r.scores) as number[];
  const computedAvg = vals.reduce((a, b) => a + b, 0) / vals.length;
  if (computedAvg < 4.5) {
    errors.push(`Overall average ${computedAvg.toFixed(2)} is below minimum 4.50`);
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// 7. Synthetic Mock WAV Buffer Generator
// ============================================================================

export function createMockWavBuffer(options: {
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
  durationSec?: number;
} = {}): Buffer {
  const sampleRate = options.sampleRate || 48000;
  const channels = options.channels || 2;
  const bitDepth = options.bitDepth || 16;
  const durationSec = options.durationSec || 1.0;

  const bytesPerSample = (bitDepth / 8) * channels;
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * bytesPerSample;
  const fileSize = 44 + dataSize;

  const buf = Buffer.alloc(fileSize);

  // RIFF header
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(fileSize - 8, 4);
  buf.write('WAVE', 8, 'ascii');

  // fmt chunk
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16); // subchunk1size (16 for PCM)
  buf.writeUInt16LE(1, 20); // audioFormat 1 = PCM
  buf.writeUInt16LE(channels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * bytesPerSample, 28); // byteRate
  buf.writeUInt16LE(bytesPerSample, 32); // blockAlign
  buf.writeUInt16LE(bitDepth, 34);

  // data chunk
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataSize, 40);

  // Zero-filled PCM audio data already in buffer
  return buf;
}
