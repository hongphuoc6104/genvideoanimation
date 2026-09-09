/**
 * tests/e2e/tier1-features/f07-models-documentation.test.ts
 * Tier 1: Feature Coverage Tests for F07 (Models Documentation & Provenance)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  assertEqual,
  assertTrue,
} from '../harness/assert';
import {
  TestSuite,
  registerSuite,
} from '../harness/test-context';

const REPO_ROOT = path.resolve(__dirname, '../../..');

export const suite: TestSuite = {
  name: 'Tier 1: F07 Models Documentation and Provenance',
  feature: 'F07',
  tier: 1,
  tests: [
    {
      id: 'T1-F07-01',
      name: 'models/README.md exists and is non-empty',
      feature: 'F07',
      tier: 1,
      fn: async (ctx) => {
        const readmePath = path.join(REPO_ROOT, 'models', 'README.md');
        assertTrue(fs.existsSync(readmePath), 'models/README.md must exist');
        const content = fs.readFileSync(readmePath, 'utf-8');
        assertTrue(content.length > 500, 'README.md must be comprehensive (>500 chars)');
      },
    },
    {
      id: 'T1-F07-02',
      name: 'Documents Kokoro-82M model specifications and asset files',
      feature: 'F07',
      tier: 1,
      fn: async (ctx) => {
        const readmePath = path.join(REPO_ROOT, 'models', 'README.md');
        const content = fs.readFileSync(readmePath, 'utf-8');
        assertTrue(content.includes('Kokoro-82M') || content.includes('kokoro-v1.0.onnx'), 'README must document Kokoro-82M');
        assertTrue(content.includes('voices-v1.0.bin') || content.includes('am_adam.bin'), 'README must document voice binary assets');
      },
    },
    {
      id: 'T1-F07-03',
      name: 'Documents WhisperX / Wav2Vec2 forced alignment model provenance',
      feature: 'F07',
      tier: 1,
      fn: async (ctx) => {
        const readmePath = path.join(REPO_ROOT, 'models', 'README.md');
        const content = fs.readFileSync(readmePath, 'utf-8');
        assertTrue(content.includes('wav2vec2') || content.includes('Wav2Vec2'), 'README must document Wav2Vec2 alignment model');
      },
    },
    {
      id: 'T1-F07-04',
      name: 'Contains SHA256 checksums table for asset integrity verification',
      feature: 'F07',
      tier: 1,
      fn: async (ctx) => {
        const readmePath = path.join(REPO_ROOT, 'models', 'README.md');
        const content = fs.readFileSync(readmePath, 'utf-8');
        assertTrue(content.includes('SHA256 Checksum'), 'README must include SHA256 Checksum column/table');
        // Check for 64-char hex string
        const shaRegex = /[0-9a-f]{64}/i;
        assertTrue(shaRegex.test(content), 'README must contain hex SHA256 hashes');
      },
    },
    {
      id: 'T1-F07-05',
      name: 'Documents setup command and strict offline execution parameters',
      feature: 'F07',
      tier: 1,
      fn: async (ctx) => {
        const readmePath = path.join(REPO_ROOT, 'models', 'README.md');
        const content = fs.readFileSync(readmePath, 'utf-8');
        assertTrue(content.includes('npm run narration:setup'), 'README must document npm run narration:setup');
        assertTrue(content.includes('--offline') || content.includes('OFFLINE_MODE'), 'README must document --offline flag');
      },
    },
  ],
};

registerSuite(suite);
