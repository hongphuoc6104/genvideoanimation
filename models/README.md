# Local Narration & Alignment Model Assets

This directory contains offline neural network models and binary voice embeddings for the V3 Narration and Forced Alignment subsystem.

## Model Asset Inventory

| File | Purpose | Size | SHA256 Checksum | Source |
|---|---|---|---|---|
| `kokoro/kokoro-v1.0.onnx` | Kokoro-82M TTS Neural Network | 325.5 MB | `7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5` (v1.0) / `beb0d1848dee9a49da392cc3df26958d46cfa35d321edf434f52949153f0df3a` (v1.1) | [thewh1teagle/kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) |
| `kokoro/voices-v1.0.bin` | Style vector bundle (54 voices) | 28.2 MB | `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d` | [thewh1teagle/kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) |
| `kokoro/voices/am_adam.bin` | Voice vector (Adam, default) | 510 KB | `162b035ed91cfc48b6046982184c645f72edcdd1b82843347f605d7bf7b15716` | [hexgrad/Kokoro-82M](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) |
| `kokoro/voices/am_fenrir.bin` | Voice vector (Fenrir) | 510 KB | `c27989f741f7ee34d273a39d8a595cc0837d35f5ced9a29b7cc162614616df43` | [hexgrad/Kokoro-82M](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) |
| `kokoro/voices/am_michael.bin` | Voice vector (Michael) | 510 KB | `1d1f21dd8da39c30705cd4c75d039d265e9bc4a2a93ed09bc9e1b1225eb95ba1` | [hexgrad/Kokoro-82M](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) |
| `kokoro/voices/am_onyx.bin` | Voice vector (Onyx) | 510 KB | `da5d135b424164916d75a68ffb4c2abce3d7d5ccc82dd1ee6cf447ce286145e6` | [hexgrad/Kokoro-82M](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) |
| `alignment/wav2vec2_fairseq_base_ls960_asr_ls960.pth` | Wav2Vec2 alignment model | 377.7 MB | `488fd4f16de84438ffc945334278c1b9fb9b7159a806c1080b16111a958c945d` | [PyTorch Torchaudio](https://download.pytorch.org/torchaudio/models/wav2vec2_fairseq_base_ls960_asr_ls960.pth) |
| `alignment/tokenizers/punkt_tab.zip` | NLTK sentence tokenizer tables | 4.3 MB | `e57f64187974277726a3417ca6f181ec5403676c717672eef6a748a7b20e0106` | [NLTK Data](https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/tokenizers/punkt_tab.zip) |

## Installation & Setup

### Automated Setup
To set up the local virtual environment and download / verify all assets:
```bash
npm run narration:setup
```

### Verification Only
To verify integrity and SHA256 checksums of existing files without making any network calls:
```bash
npm run narration:setup -- --check-only
```

### Dry Run
To inspect planned asset URLs and destination paths without downloading:
```bash
npm run narration:setup -- --dry-run
```

### Air-Gapped / Manual Setup
In environments with no internet access, download the files from the sources listed above and place them into their corresponding directories under `models/`. Validate integrity:
```bash
npx tsx scripts/setup-narration-models.ts --check-only
```

## Strict Offline Execution
All generation scripts and Remotion compositions operate strictly locally when passing `--offline` or setting `OFFLINE_MODE=1`. In this mode:
- `validators/offline-network-guard.ts` intercepts all network sockets (`http`, `https`, `fetch`, `net.connect`, `dns`, `dgram`).
- Any outbound external network access triggers `OfflineNetworkViolationError`.
- Speech generation produces uncompressed 24kHz 16-bit mono PCM WAV (`pcm_s16le`) with standard 44-byte RIFF headers without any cloud APIs or telemetry.
