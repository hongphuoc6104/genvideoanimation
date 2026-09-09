#!/usr/bin/env tsx
/**
 * scripts/setup-narration-models.ts
 * Model Setup Utility for Remotion V3 Narration Subsystem.
 * Sets up Python virtualenv, installs required inference libraries,
 * stages Kokoro-82M TTS and WhisperX alignment model assets,
 * and verifies cryptographic SHA256 checksums atomically.
 */

import * as childProcess from 'node:child_process';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export interface ModelAssetSpec {
  id: string;
  name: string;
  category: 'kokoro' | 'alignment';
  destinationPath: string; // Relative to project root
  url: string;
  mirrors?: string[];
  expectedSize?: number;
  validSha256: string[]; // Supports multiple valid versions (e.g. v1.0 and v1.1)
  cacheCandidates?: string[];
  description: string;
}

export const REQUIRED_MODEL_ASSETS: ModelAssetSpec[] = [
  {
    id: 'kokoro-onnx',
    name: 'Kokoro-82M ONNX Model (v1.0 / v1.1)',
    category: 'kokoro',
    destinationPath: 'models/kokoro/kokoro-v1.0.onnx',
    url: 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.onnx',
    mirrors: [
      'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx',
    ],
    validSha256: [
      'beb0d1848dee9a49da392cc3df26958d46cfa35d321edf434f52949153f0df3a', // v1.1
      '7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5', // v1.0
    ],
    cacheCandidates: [
      '/tmp/kokoro-v1.0.onnx',
      path.join(os.homedir(), '.cache', 'kokoro', 'kokoro-v1.0.onnx'),
    ],
    description: 'Core 82M-parameter Kokoro TTS neural network in ONNX format.',
  },
  {
    id: 'voices-bundle',
    name: 'Kokoro v1.0 Voices Bundle',
    category: 'kokoro',
    destinationPath: 'models/kokoro/voices-v1.0.bin',
    url: 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/voices-v1.0.bin',
    mirrors: [
      'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin',
    ],
    expectedSize: 28214398,
    validSha256: [
      'bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d',
    ],
    cacheCandidates: [
      '/tmp/voices-v1.0.bin',
      path.join(os.homedir(), '.cache', 'kokoro', 'voices-v1.0.bin'),
    ],
    description: '54 style vector embeddings for Kokoro TTS voices in binary format.',
  },
  {
    id: 'voice-adam',
    name: 'Voice Vector: am_adam',
    category: 'kokoro',
    destinationPath: 'models/kokoro/voices/am_adam.bin',
    url: 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/am_adam.bin',
    expectedSize: 522240,
    validSha256: [
      '162b035ed91cfc48b6046982184c645f72edcdd1b82843347f605d7bf7b15716',
    ],
    description: 'Default American Male voice embedding (Adam).',
  },
  {
    id: 'voice-fenrir',
    name: 'Voice Vector: am_fenrir',
    category: 'kokoro',
    destinationPath: 'models/kokoro/voices/am_fenrir.bin',
    url: 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/am_fenrir.bin',
    expectedSize: 522240,
    validSha256: [
      'c27989f741f7ee34d273a39d8a595cc0837d35f5ced9a29b7cc162614616df43',
    ],
    description: 'American Male voice embedding (Fenrir).',
  },
  {
    id: 'voice-michael',
    name: 'Voice Vector: am_michael',
    category: 'kokoro',
    destinationPath: 'models/kokoro/voices/am_michael.bin',
    url: 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/am_michael.bin',
    expectedSize: 522240,
    validSha256: [
      '1d1f21dd8da39c30705cd4c75d039d265e9bc4a2a93ed09bc9e1b1225eb95ba1',
    ],
    description: 'American Male voice embedding (Michael).',
  },
  {
    id: 'voice-onyx',
    name: 'Voice Vector: am_onyx',
    category: 'kokoro',
    destinationPath: 'models/kokoro/voices/am_onyx.bin',
    url: 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/am_onyx.bin',
    expectedSize: 522240,
    validSha256: [
      'da5d135b424164916d75a68ffb4c2abce3d7d5ccc82dd1ee6cf447ce286145e6',
    ],
    description: 'American Male voice embedding (Onyx).',
  },
  {
    id: 'wav2vec2-alignment',
    name: 'Wav2Vec2 LibriSpeech Checkpoint',
    category: 'alignment',
    destinationPath: 'models/alignment/wav2vec2_fairseq_base_ls960_asr_ls960.pth',
    url: 'https://download.pytorch.org/torchaudio/models/wav2vec2_fairseq_base_ls960_asr_ls960.pth',
    expectedSize: 377664473,
    validSha256: [
      '488fd4f16de84438ffc945334278c1b9fb9b7159a806c1080b16111a958c945d',
    ],
    cacheCandidates: [
      path.join(
        os.homedir(),
        '.cache',
        'torch',
        'hub',
        'checkpoints',
        'wav2vec2_fairseq_base_ls960_asr_ls960.pth'
      ),
    ],
    description: 'Base Wav2Vec 2.0 acoustic checkpoint for phoneme alignment.',
  },
  {
    id: 'punkt-tab-tokenizer',
    name: 'NLTK Punkt Tab English Tokenizer Archive',
    category: 'alignment',
    destinationPath: 'models/alignment/tokenizers/punkt_tab.zip',
    url: 'https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/tokenizers/punkt_tab.zip',
    expectedSize: 4319076,
    validSha256: [
      'e57f64187974277726a3417ca6f181ec5403676c717672eef6a748a7b20e0106',
    ],
    cacheCandidates: [
      path.join(os.homedir(), 'nltk_data', 'tokenizers', 'punkt_tab.zip'),
    ],
    description: 'Pre-trained sentence tokenizer tables for transcript chunking.',
  },
];

export async function computeSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function findUvBinary(): string {
  const localUv = path.join(os.homedir(), '.local', 'bin', 'uv');
  if (fs.existsSync(localUv)) return localUv;
  return 'uv';
}

export async function ensureVirtualEnvironment(repoRoot: string, verbose = false): Promise<string> {
  const venvDir = path.join(repoRoot, '.venv');
  const pythonBin = path.join(venvDir, 'bin', 'python3');

  if (fs.existsSync(pythonBin)) {
    if (verbose) console.log(`[VirtualEnv] Found existing venv at ${venvDir}`);
  } else {
    console.log(`[VirtualEnv] Creating Python virtual environment via uv in ${venvDir}...`);
    const uvBin = findUvBinary();
    childProcess.execSync(`${uvBin} venv "${venvDir}"`, {
      cwd: repoRoot,
      stdio: verbose ? 'inherit' : 'pipe',
    });
  }

  // Verify / install kokoro-onnx and soundfile
  try {
    childProcess.execSync(`"${pythonBin}" -c "import kokoro_onnx, soundfile"`, {
      stdio: 'pipe',
    });
    if (verbose) console.log('[VirtualEnv] Python packages kokoro-onnx and soundfile verified.');
  } catch {
    console.log('[VirtualEnv] Installing kokoro-onnx and soundfile via uv pip...');
    const uvBin = findUvBinary();
    childProcess.execSync(
      `${uvBin} pip install --python "${venvDir}" kokoro-onnx soundfile`,
      {
        cwd: repoRoot,
        stdio: verbose ? 'inherit' : 'pipe',
      }
    );
  }

  return pythonBin;
}

export async function extractVoicesFromBundle(
  repoRoot: string,
  bundlePath: string,
  pythonBin: string
): Promise<void> {
  const voicesDir = path.join(repoRoot, 'models', 'kokoro', 'voices');
  if (!fs.existsSync(voicesDir)) {
    fs.mkdirSync(voicesDir, { recursive: true });
  }

  const script = `
import numpy as np, os, sys
bundle_path = sys.argv[1]
target_dir = sys.argv[2]
z = np.load(bundle_path)
for name in ['am_adam', 'am_fenrir', 'am_michael', 'am_onyx']:
    if name in z:
        arr = z[name]
        out_file = os.path.join(target_dir, f"{name}.bin")
        if not os.path.exists(out_file):
            with open(out_file, "wb") as f:
                f.write(arr.tobytes())
`;
  try {
    childProcess.execFileSync(pythonBin, ['-c', script, bundlePath, voicesDir]);
  } catch (err: any) {
    console.warn(`[Voices Extract] Warning extracting voices from bundle: ${err.message}`);
  }
}

async function downloadFileWithRedirects(
  url: string,
  destPath: string,
  expectedHashes: string[]
): Promise<void> {
  const tempPath = `${destPath}.tmp.${Date.now()}`;
  const parentDir = path.dirname(destPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  try {
    const response = await fetch(url, { redirect: 'follow' });
    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status} ${response.statusText} fetching ${url}`);
    }

    const fileStream = fs.createWriteStream(tempPath);
    const nodeReadable = Readable.fromWeb(response.body as any);
    await pipeline(nodeReadable, fileStream);

    const actualHash = await computeSha256(tempPath);
    if (!expectedHashes.includes(actualHash)) {
      await fs.promises.unlink(tempPath);
      throw new Error(
        `SHA256 mismatch for ${url}: expected [${expectedHashes.join(', ')}], got ${actualHash}`
      );
    }

    await fs.promises.rename(tempPath, destPath);
  } catch (err) {
    if (fs.existsSync(tempPath)) {
      try {
        await fs.promises.unlink(tempPath);
      } catch {}
    }
    throw err;
  }
}

export async function stageAsset(
  repoRoot: string,
  asset: ModelAssetSpec,
  force: boolean,
  dryRun: boolean,
  verbose: boolean
): Promise<{ status: 'verified' | 'downloaded' | 'copied' | 'failed' | 'dry-run'; details?: string }> {
  const fullDest = path.join(repoRoot, asset.destinationPath);

  // Check if target already exists and passes checksum
  if (!force && fs.existsSync(fullDest)) {
    const currentHash = await computeSha256(fullDest);
    if (asset.validSha256.includes(currentHash)) {
      if (verbose) console.log(`[Verified] ${asset.destinationPath} (${currentHash.slice(0, 12)}...)`);
      return { status: 'verified', details: currentHash };
    }
    console.warn(
      `[Checksum Mismatch] ${asset.destinationPath} checksum invalid (${currentHash.slice(0, 12)}...). Re-staging.`
    );
  }

  if (dryRun) {
    console.log(`[DryRun] Would stage: ${asset.destinationPath} from ${asset.url}`);
    return { status: 'dry-run' };
  }

  // Check local cache candidates
  if (!force && asset.cacheCandidates) {
    for (const cand of asset.cacheCandidates) {
      if (fs.existsSync(cand)) {
        try {
          const candHash = await computeSha256(cand);
          if (asset.validSha256.includes(candHash)) {
            console.log(`[Cache Hit] Copying ${asset.name} from local cache: ${cand}`);
            const parentDir = path.dirname(fullDest);
            if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
            await fs.promises.copyFile(cand, fullDest);
            return { status: 'copied', details: cand };
          }
        } catch {}
      }
    }
  }

  // Attempt download from primary URL and mirrors
  const urls = [asset.url, ...(asset.mirrors || [])];
  let lastError: any;

  for (const downloadUrl of urls) {
    try {
      console.log(`[Download] Fetching ${asset.name} from ${downloadUrl}...`);
      await downloadFileWithRedirects(downloadUrl, fullDest, asset.validSha256);
      console.log(`[Success] Staged ${asset.destinationPath}`);
      return { status: 'downloaded', details: downloadUrl };
    } catch (err: any) {
      lastError = err;
      console.warn(`[Download Warning] Failed ${downloadUrl}: ${err.message}`);
    }
  }

  return { status: 'failed', details: lastError?.message };
}

export async function runSetup(argv = process.argv.slice(2)): Promise<boolean> {
  const checkOnly = argv.includes('--check-only');
  const force = argv.includes('--force');
  const dryRun = argv.includes('--dry-run');
  const skipAlignment = argv.includes('--skip-alignment');
  const verbose = argv.includes('--verbose');

  const repoRoot = path.resolve(__dirname, '..');
  console.log(`\n======================================================`);
  console.log(` Remotion V3 Narration Models Setup Utility`);
  console.log(` Root: ${repoRoot}`);
  console.log(` Flags: checkOnly=${checkOnly}, force=${force}, dryRun=${dryRun}, skipAlignment=${skipAlignment}`);
  console.log(`======================================================\n`);

  // Step 1: Virtual Environment & Python dependencies
  let pythonBin = 'python3';
  if (!checkOnly && !dryRun) {
    pythonBin = await ensureVirtualEnvironment(repoRoot, verbose);
  }

  // Step 2: Filter assets
  const targetAssets = REQUIRED_MODEL_ASSETS.filter((a) => {
    if (skipAlignment && a.category === 'alignment') return false;
    return true;
  });

  if (checkOnly) {
    let allValid = true;
    for (const asset of targetAssets) {
      const fullPath = path.join(repoRoot, asset.destinationPath);
      if (!fs.existsSync(fullPath)) {
        console.error(`❌ [Missing] ${asset.destinationPath} (${asset.name})`);
        allValid = false;
        continue;
      }
      const hash = await computeSha256(fullPath);
      if (asset.validSha256.includes(hash)) {
        console.log(`✅ [OK] ${asset.destinationPath} (SHA256: ${hash.slice(0, 16)}...)`);
      } else {
        console.error(
          `❌ [Corrupted] ${asset.destinationPath} (Expected one of [${asset.validSha256.join(', ')}], got ${hash})`
        );
        allValid = false;
      }
    }

    if (allValid) {
      console.log('\nAll checked model assets are present and cryptographically verified.');
      return true;
    } else {
      console.error('\nModel assets check failed. Run "npm run narration:setup" to install.');
      return false;
    }
  }

  // Step 3: Staging assets
  let anyFailed = false;
  for (const asset of targetAssets) {
    // If it's an individual voice vector and voices-bundle already exists, try extraction first
    if (asset.id.startsWith('voice-')) {
      const bundleDest = path.join(repoRoot, 'models', 'kokoro', 'voices-v1.0.bin');
      const voiceDest = path.join(repoRoot, asset.destinationPath);
      if (fs.existsSync(bundleDest) && !fs.existsSync(voiceDest) && !dryRun) {
        await extractVoicesFromBundle(repoRoot, bundleDest, pythonBin);
      }
    }

    const result = await stageAsset(repoRoot, asset, force, dryRun, verbose);
    if (result.status === 'failed') {
      anyFailed = true;
      console.error(`❌ Failed to stage ${asset.name}: ${result.details}`);
    }
  }

  // Step 4: If voices-bundle is present, ensure voices/*.bin exist
  const bundleFile = path.join(repoRoot, 'models', 'kokoro', 'voices-v1.0.bin');
  if (fs.existsSync(bundleFile) && !dryRun) {
    await extractVoicesFromBundle(repoRoot, bundleFile, pythonBin);
  }

  if (anyFailed) {
    console.error('\nSetup completed with errors. Some assets could not be staged.');
    return false;
  }

  console.log('\n✅ Narration and alignment model assets successfully staged and verified.\n');
  return true;
}

if (require.main === module || (typeof process !== 'undefined' && process.argv[1]?.endsWith('setup-narration-models.ts'))) {
  runSetup()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal error in setup-narration-models:', err);
      process.exit(1);
    });
}
