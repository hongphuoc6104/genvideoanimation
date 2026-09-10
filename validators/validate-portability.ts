#!/usr/bin/env tsx
/**
 * VALIDATE WORKSPACE PORTABILITY GATE (F05 / Requirement R15)
 *
 * Scans committed manifests, JSON configs, specs, and source files across the workspace
 * to guarantee ZERO machine-specific absolute paths:
 * - Unix user home paths: /home/...
 * - macOS user home paths: /Users/...
 * - Windows drive paths: C:\... or C:/... (without false-positive matching of http://)
 * - System temporary/root paths: /tmp/..., /var/tmp/..., /root/...
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface PortabilityViolation {
  file: string;
  line: number;
  column: number;
  patternName: string;
  matchedText: string;
  snippet: string;
}

export interface PortabilityResult {
  scannedFilesCount: number;
  violationsCount: number;
  violationsByFile: Record<string, PortabilityViolation[]>;
  passed: boolean;
}

export interface PortabilityOptions {
  scanPath?: string;
  excludeDirs?: string[];
  includeExtensions?: string[];
  json?: boolean;
  strict?: boolean;
}

interface ForbiddenPattern {
  name: string;
  regex: RegExp;
}

export const FORBIDDEN_PATH_PATTERNS: ForbiddenPattern[] = [
  {
    name: 'Unix user home directory (/home/)',
    regex: /(?:^|[\s"'\`=:(,])(\/home\/[^\s"'\`,;)]+)/g,
  },
  {
    name: 'macOS user home directory (/Users/)',
    regex: /(?:^|[\s"'\`=:(,])(\/Users\/[^\s"'\`,;)]+)/g,
  },
  {
    name: 'Windows drive backslash path (e.g. C:\\)',
    regex: /(?:^|[\s"'\`=:(,])([A-Za-z]:\\[^\s"'\`,;)]+)/g,
  },
  {
    name: 'Windows drive forward-slash path (e.g. C:/)',
    regex: /(?:^|[\s"'\`=:(,])([A-Za-z]:\/(?!\/)[^\s"'\`,;)]+)/g,
  },
  {
    name: 'Machine temporary or root path (/tmp/, /root/)',
    regex: /(?:^|[\s"'\`=:(,])(\/(?:tmp|var\/tmp|root)\/[^\s"'\`,;)]+)/g,
  },
];

const DEFAULT_EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  '.agents',
  'out',
  'dist',
  '.gemini',
  'coverage',
  '.turbo',
  '.next',
  'tests',
  'scripts',
];

const DEFAULT_INCLUDE_EXTS = [
  '.json',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.yaml',
  '.yml',
];

/**
 * Recursively collects target files, handling symlinks safely without circular loops.
 */
export function collectScanFiles(
  targetDir: string,
  excludeDirs: string[] = DEFAULT_EXCLUDE_DIRS,
  includeExts: string[] = DEFAULT_INCLUDE_EXTS,
  visitedInodes: Set<number> = new Set(),
  collected: string[] = []
): string[] {
  if (!fs.existsSync(targetDir)) return collected;

  const stat = fs.statSync(targetDir);
  if (stat.isFile()) {
    const ext = path.extname(targetDir).toLowerCase();
    if (includeExts.includes(ext)) {
      collected.push(targetDir);
    }
    return collected;
  }

  if (visitedInodes.has(stat.ino)) {
    return collected;
  }
  visitedInodes.add(stat.ino);

  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(targetDir, entry.name);

    if (entry.name.startsWith('.') && entry.name !== '.env') {
      if (['.git', '.agents', '.gemini', '.turbo', '.next'].includes(entry.name)) continue;
    }
    if (excludeDirs.includes(entry.name)) continue;

    try {
      const entryStat = fs.statSync(fullPath);
      if (entryStat.isDirectory()) {
        collectScanFiles(fullPath, excludeDirs, includeExts, visitedInodes, collected);
      } else if (entryStat.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (includeExts.includes(ext) && !entry.name.endsWith('.d.ts') && !entry.name.endsWith('.min.js')) {
          collected.push(fullPath);
        }
      }
    } catch {
      // Ignore unreadable or broken symlinks
    }
  }

  return collected;
}

/**
 * Scans content of a single file for machine-specific absolute paths.
 */
export function scanFileForPortability(
  filePath: string,
  workspaceRoot: string
): PortabilityViolation[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relFile = path.relative(workspaceRoot, filePath);
  if (relFile.endsWith('validate-portability.ts')) {
    return [];
  }
  const violations: PortabilityViolation[] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    // Skip comment lines explicitly defining the regexes or documenting rules
    if (line.includes('ForbiddenPattern') || line.includes('FORBIDDEN_PATH_PATTERNS')) {
      continue;
    }

    for (const pattern of FORBIDDEN_PATH_PATTERNS) {
      pattern.regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.regex.exec(line)) !== null) {
        const matchedPath = match[1];
        violations.push({
          file: relFile,
          line: lineIdx + 1,
          column: match.index + 1,
          patternName: pattern.name,
          matchedText: matchedPath,
          snippet: line.trim(),
        });
      }
    }
  }

  return violations;
}

/**
 * Main portability validation execution.
 */
export function validatePortability(options: PortabilityOptions = {}): PortabilityResult {
  const workspaceRoot = process.cwd();
  const scanTarget = options.scanPath ? path.resolve(workspaceRoot, options.scanPath) : workspaceRoot;

  let targetFiles: string[] = [];

  if (!options.scanPath) {
    // Default production scan directories
    const primaryDirs = ['connection-film', 'validators', 'packages', 'content', 'lexicons'];
    for (const d of primaryDirs) {
      const fullDir = path.join(workspaceRoot, d);
      if (fs.existsSync(fullDir)) {
        targetFiles.push(...collectScanFiles(fullDir, options.excludeDirs, options.includeExtensions));
      }
    }
  } else {
    targetFiles = collectScanFiles(scanTarget, options.excludeDirs, options.includeExtensions);
  }

  const violationsByFile: Record<string, PortabilityViolation[]> = {};
  let totalViolations = 0;

  for (const file of targetFiles) {
    const fileViolations = scanFileForPortability(file, workspaceRoot);
    if (fileViolations.length > 0) {
      const relPath = path.relative(workspaceRoot, file);
      violationsByFile[relPath] = fileViolations;
      totalViolations += fileViolations.length;
    }
  }

  return {
    scannedFilesCount: targetFiles.length,
    violationsCount: totalViolations,
    violationsByFile,
    passed: totalViolations === 0,
  };
}

// CLI Execution Entry Point
export function runCli(args: string[] = process.argv.slice(2)): void {
  const options: PortabilityOptions = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--exclude' && args[i + 1]) {
      options.excludeDirs = args[++i].split(',');
    } else if (args[i] === '--json') {
      options.json = true;
    } else if (args[i] === '--strict') {
      options.strict = true;
    } else if (!args[i].startsWith('--')) {
      options.scanPath = args[i];
    }
  }

  try {
    const result = validatePortability(options);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('\n🌐 VALIDATING WORKSPACE PORTABILITY (Requirement R15)');
      console.log(`- Files Scanned: ${result.scannedFilesCount}`);
      console.log(`- Files with Violations: ${Object.keys(result.violationsByFile).length}`);
      console.log(`- Total Path Violations: ${result.violationsCount}`);

      if (result.passed) {
        console.log('\n✅ [PASS] Workspace portability verified. Zero machine-specific absolute paths detected.\n');
        process.exit(0);
      } else {
        console.error(`\n❌ [FAIL] ${result.violationsCount} machine-specific path violation(s) found across ${Object.keys(result.violationsByFile).length} files:`);
        for (const [file, items] of Object.entries(result.violationsByFile)) {
          console.error(`\n  📄 ${file} (${items.length} violation${items.length > 1 ? 's' : ''}):`);
          for (const item of items) {
            console.error(`     • Line ${item.line}: [${item.patternName}] -> ${item.matchedText}`);
          }
        }
        console.error('\nRun remediation to replace absolute paths with workspace-relative paths or dynamic os.homedir().\n');
        process.exit(1);
      }
    }
  } catch (err: any) {
    console.error(`\n💥 Fatal Validator Error: ${err.message}\n`);
    process.exit(1);
  }
}

const isDirectCli =
  typeof require !== 'undefined' && require.main === module
    ? true
    : typeof process !== 'undefined' && process.argv[1]
    ? path.resolve(process.argv[1]).replace(/\.ts$/, '') === path.resolve(__filename).replace(/\.ts$/, '')
    : false;

if (isDirectCli) {
  runCli();
}
