/**
 * packages/narration-kit/src/alignment/WhisperXLocalAligner.ts
 * Local forced alignment provider invoking local wav2vec2/whisperx alignment script.
 * Strictly offline, preserves canonical transcript as authoritative wording.
 */

import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { AlignmentProvider, WordTiming } from './AlignmentProvider';

export interface AlignerOptions {
  repoRoot?: string;
  pythonPath?: string;
  device?: string;
}

export class WhisperXLocalAligner implements AlignmentProvider {
  private repoRoot: string;
  private pythonPath: string;
  private scriptPath: string;
  private device: string;

  constructor(options: AlignerOptions = {}) {
    this.repoRoot = options.repoRoot || this.findRepoRoot();
    this.pythonPath = options.pythonPath || this.resolvePython();
    this.scriptPath = path.resolve(this.repoRoot, 'scripts', 'align-transcript.py');
    this.device = options.device || 'cpu';
  }

  private findRepoRoot(): string {
    let curr = process.cwd();
    for (let i = 0; i < 5; i++) {
      if (fs.existsSync(path.join(curr, 'package.json')) && fs.existsSync(path.join(curr, 'models'))) {
        return curr;
      }
      curr = path.dirname(curr);
    }
    return process.cwd();
  }

  private resolvePython(): string {
    const venvPython = path.join(this.repoRoot, '.venv', 'bin', 'python3');
    if (fs.existsSync(venvPython)) return venvPython;
    return 'python3';
  }

  public async align(audioPath: string, transcript: string, textMapPath?: string): Promise<WordTiming[]> {
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found for alignment: ${audioPath}`);
    }
    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript cannot be empty for forced alignment');
    }

    const tmpDir = os.tmpdir();
    const tmpOut = path.join(tmpDir, `aligned_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);

    try {
      const args = [
        this.scriptPath,
        '--audio', audioPath,
        '--transcript', transcript,
        '--output', tmpOut,
        '--device', this.device,
      ];

      if (textMapPath && fs.existsSync(textMapPath)) {
        args.push('--text-map', textMapPath);
      }

      childProcess.execFileSync(this.pythonPath, args, {
        cwd: this.repoRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          HF_HUB_OFFLINE: '1',
          TRANSFORMERS_OFFLINE: '1',
          OFFLINE_MODE: '1',
        },
      });

      if (!fs.existsSync(tmpOut)) {
        throw new Error('Alignment script did not generate output file');
      }

      const raw = fs.readFileSync(tmpOut, 'utf-8');
      const timings: WordTiming[] = JSON.parse(raw).map((item: any) => ({
        ...item,
        text: item.text || item.word,
        normalizedText: item.normalizedText || item.cleanWord,
      }));
      return timings;
    } finally {
      if (fs.existsSync(tmpOut)) {
        try { fs.unlinkSync(tmpOut); } catch {}
      }
    }
  }
}
