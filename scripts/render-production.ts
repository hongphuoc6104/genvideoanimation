#!/usr/bin/env tsx
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
let project = '';
let composition = '';
let concurrency = '4';

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--project=')) project = args[i].split('=')[1];
  else if (args[i] === '--project' && args[i + 1]) project = args[++i];
  else if (args[i].startsWith('--composition=')) composition = args[i].split('=')[1];
  else if (args[i] === '--composition' && args[i + 1]) composition = args[++i];
  else if (args[i].startsWith('--concurrency=')) concurrency = args[i].split('=')[1];
  else if (args[i] === '--concurrency' && args[i + 1]) concurrency = args[++i];
}

if (!project) {
  const base = path.resolve(__dirname, '../connection-film/src/projects');
  if (fs.existsSync(base)) {
    const entries = fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
    if (entries.length === 1) project = entries[0];
  }
}

const projectName = path.basename(project || 'sodium-potassium-pump');
const outputMp4 = path.resolve(process.cwd(), `out/${projectName}-1080p.mp4`);

// Detect composition ID if not explicitly specified
if (!composition) {
  const rootFile = path.resolve(__dirname, '../connection-film/src/Root.tsx');
  if (fs.existsSync(rootFile)) {
    const rootSrc = fs.readFileSync(rootFile, 'utf-8');
    const compMatches = Array.from(rootSrc.matchAll(/<Composition[\s\S]*?id=["']([^"']+)["']/g)).map(m => m[1]);
    const filtered = compMatches.filter(id => !['ScopusResearchGap-TikTok916', 'CrisprCas9-TikTok916', 'SteamEngineCycle', 'GitDagModel-TikTok916'].includes(id));
    if (filtered.length > 0) {
      composition = filtered[0];
    }
  }
}

if (!composition) {
  const camel = projectName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  composition = `${camel}-TikTok916`;
}

console.log(`🎬 Rendering production project: ${projectName}`);
console.log(`📌 Composition ID: ${composition}`);
console.log(`🎯 Output target: ${outputMp4}`);

const npx = spawnSync('npx', [
  'remotion', 'render',
  'connection-film/src/index.ts',
  composition,
  outputMp4,
  `--concurrency=${concurrency}`
], { stdio: 'inherit' });

if (npx.status === 0) {
  console.log(`✅ Render completed successfully: ${outputMp4}`);
  process.exit(0);
} else {
  console.error(`❌ Render failed with exit code ${npx.status}`);
  process.exit(npx.status || 1);
}
