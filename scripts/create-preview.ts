#!/usr/bin/env tsx
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
let project = '';
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--project=')) project = args[i].split('=')[1];
  else if (args[i] === '--project' && args[i + 1]) project = args[++i];
}

if (!project) {
  const base = path.resolve(__dirname, '../connection-film/src/projects');
  if (fs.existsSync(base)) {
    const entries = fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
    if (entries.length === 1) project = entries[0];
  }
}

const projectName = path.basename(project || 'default');
const master = `out/${projectName}-1080p.mp4`;
const preview = `out/${projectName}-preview-360x640.mp4`;

if (!fs.existsSync(master)) {
  console.error(`Master video not found: ${master}`);
  process.exit(1);
}

const ffmpegBin = path.resolve(__dirname, '../connection-film/node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg');
const cmd = fs.existsSync(ffmpegBin) ? ffmpegBin : 'ffmpeg';

console.log(`Generating preview 360x640 via GPU Lanczos: ${master} -> ${preview}`);
const res = spawnSync(cmd, [
  '-y', '-v', 'error',
  '-i', master,
  '-vf', 'scale=360:640:flags=lanczos',
  '-c:v', 'h264_nvenc', '-cq', '20',
  '-c:a', 'copy',
  preview
], { stdio: 'inherit' });

if (res.status === 0) {
  console.log(`✅ Preview generated: ${preview}`);
  process.exit(0);
} else {
  console.error(`❌ Preview generation failed with code ${res.status}`);
  process.exit(1);
}
