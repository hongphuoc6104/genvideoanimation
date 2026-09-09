#!/usr/bin/env tsx
/**
 * Standalone Root Motion Linter Wrapper
 * Re-exports from canonical ./validators/motion-lint and delegates CLI execution when invoked directly.
 */

import * as path from 'path';
import { runCli } from './validators/motion-lint';

export * from './validators/motion-lint';

const isDirectCli =
  typeof require !== 'undefined' && require.main === module
    ? true
    : typeof process !== 'undefined' && process.argv[1]
    ? path.resolve(process.argv[1]).replace(/\.ts$/, '') === path.resolve(__filename).replace(/\.ts$/, '')
    : false;

if (isDirectCli) {
  runCli();
}
