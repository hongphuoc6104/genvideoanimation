#!/usr/bin/env tsx
/**
 * Standalone Root ShotSpec Validator Wrapper
 * Re-exports from canonical ./validators/validate-shot-spec and delegates CLI execution when invoked directly.
 */

import * as path from 'node:path';
import { runCli } from './validators/validate-shot-spec';

export * from './validators/validate-shot-spec';

const isDirectCli =
  typeof require !== 'undefined' && require.main === module
    ? true
    : typeof process !== 'undefined' && process.argv[1]
    ? path.resolve(process.argv[1]).replace(/\.ts$/, '') === path.resolve(__filename).replace(/\.ts$/, '')
    : false;

if (isDirectCli) {
  runCli();
}
