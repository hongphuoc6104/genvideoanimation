/**
 * packages/narration-kit/src/alignment/index.ts
 * Re-exports alignment interfaces, local WhisperX aligner, and quality gates.
 */

export * from './AlignmentProvider';
export * from './WhisperXLocalAligner';
export { WhisperXLocalAligner as WhisperXAligner } from './WhisperXLocalAligner';
export * from './normalizeAlignment';
export * from './validateAlignment';
