#!/usr/bin/env tsx
/**
 * VISUAL AST VALIDATOR (LAYER 2 QA GATE)
 * 
 * Inspects scene TSX ASTs using Babel/TypeScript parser to enforce:
 * 1. Anti-card rule: Flag text-card / slide monoculture (scenes composed purely of text cards without diagrams or animation mechanics).
 * 2. Require relational primitives: Enforce presence of SVG shapes (<path>, <svg>, <line>, <polygon>, <circle>, <rect>),
 *    node/edge graphs, coordinate frames, geometric funnels, or state transition mechanisms.
 * 3. Reject passive character ornament: Flag scenes where a character rig is present but static/passive without dynamic binding.
 * 
 * CLI: npx tsx validators/validate-visual-semantics.ts <targetDirOrFile>
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from '@babel/parser';
// @ts-ignore - types not installed for babel traverse
import traverseModule from '@babel/traverse';

const traverse = (traverseModule as any).default || traverseModule;

export type SemanticSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export interface VisualSemanticViolation {
  file: string;
  line: number;
  column: number;
  rule: string;
  ruleId?: string;
  severity: SemanticSeverity;
  message: string;
  snippet?: string;
}

export interface VisualSemanticResult {
  filesAnalyzed: number;
  componentsAnalyzed: number;
  violations: VisualSemanticViolation[];
  passed: boolean;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
}

export interface VisualSemanticOptions {
  json?: boolean;
  strict?: boolean;
  verbose?: boolean;
}

const SVG_PRIMITIVES = new Set([
  'svg', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect',
  'defs', 'marker', 'lineargradient', 'radialgradient', 'clippath', 'mask', 'g'
]);

// Generic domain-agnostic mechanism terms for visual explanations
const RELATIONAL_COMPONENT_NAMES = new Set([
  'researcherrig', 'characterrig', 'birdrig', 'humanrig', 'customrig',
  'narrowingfunnel', 'knowledgenetwork', 'threetierassembly', 'networkgraph',
  'dataflow', 'nodegraph', 'funnel', 'statetransition', 'diagram', 'chart',
  'coordinatesystem', 'matrixgrid', 'assemblymodel', 'flowdiagram',
  'statemachine', 'kineticflow', 'molecularrig', 'lipidbilayer', 'porechannel',
  'linkagemechanism', 'pvcycle', 'commitdag', 'particleemitter'
]);

const TEXT_TAGS = new Set([
  'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'b', 'i'
]);

/**
 * Checks if a name matches a known relational or character rig component.
 * Legacy specific components are only permitted when inspecting legacy/ directories.
 */
function isRelationalComponentName(name: string, filePath: string = ''): boolean {
  const lower = name.toLowerCase();
  if (filePath.toLowerCase().includes('legacy')) {
    if (['bankingcasestudy', 'fatalpitfalls', 'gapdoorstaxonomy'].includes(lower)) {
      return true;
    }
  }
  if (RELATIONAL_COMPONENT_NAMES.has(lower)) return true;
  return (
    lower.endsWith('rig') ||
    lower.endsWith('diagram') ||
    lower.endsWith('graph') ||
    lower.endsWith('funnel') ||
    lower.endsWith('mechanism') ||
    lower.endsWith('linkage') ||
    lower.endsWith('channel') ||
    lower.endsWith('network') ||
    lower.endsWith('model') ||
    lower.endsWith('cycle')
  );
}

/**
 * Checks if an attribute name is a dynamic binding or kinetic hook.
 */
function isDynamicAttrValue(attr: any): boolean {
  if (!attr || attr.type !== 'JSXAttribute') return false;
  if (!attr.value) return true; // boolean attr like showGlasses
  if (attr.value.type === 'JSXExpressionContainer') {
    const expr = attr.value.expression;
    // An identifier, member expr, or call expr is dynamic
    if (expr.type === 'Identifier' || expr.type === 'MemberExpression' || expr.type === 'CallExpression' || expr.type === 'BinaryExpression') {
      return true;
    }
  }
  return false;
}

/**
 * Lints a TypeScript JSX source code string for visual semantics.
 */
export function lintVisualSemanticsCode(content: string, filePath: string = 'inline.tsx'): VisualSemanticViolation[] {
  if (!content || !content.trim()) {
    return [];
  }

  let ast: any;
  try {
    ast = parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    });
  } catch (err: any) {
    return [
      {
        file: filePath,
        line: err.loc?.line || 1,
        column: err.loc?.column || 1,
        rule: 'syntax-error',
        ruleId: 'syntax-error',
        severity: 'CRITICAL',
        message: `Failed to parse AST: ${err.message}`,
      },
    ];
  }

  const violations: VisualSemanticViolation[] = [];

  // Check if file is purely re-exporting
  let hasComponentBody = false;

  // File-level kinetic heuristics
  const hasKineticMechanics =
    content.includes('useCurrentFrame') ||
    content.includes('spring(') ||
    content.includes('interpolate(') ||
    content.includes('interpolateSvgPath') ||
    content.includes('transform') ||
    content.includes('scale(') ||
    content.includes('translate');

  // Traverse functions that return JSX
  traverse(ast, {
    FunctionDeclaration(astPath: any) {
      checkComponent(astPath, filePath, content, violations, hasKineticMechanics);
    },
    FunctionExpression(astPath: any) {
      checkComponent(astPath, filePath, content, violations, hasKineticMechanics);
    },
    ArrowFunctionExpression(astPath: any) {
      checkComponent(astPath, filePath, content, violations, hasKineticMechanics);
    },
  });

  return violations;
}

function checkComponent(
  astPath: any,
  filePath: string,
  content: string,
  violations: VisualSemanticViolation[],
  fileHasKinetic: boolean
): void {
  // Find component name
  let componentName = '';
  if (astPath.node.id?.name) {
    componentName = astPath.node.id.name;
  } else if (astPath.parentPath?.node?.type === 'VariableDeclarator' && astPath.parentPath.node.id?.name) {
    componentName = astPath.parentPath.node.id.name;
  }

  // Must be a PascalCase component or scene function
  if (!componentName || !/^[A-Z]/.test(componentName)) {
    return;
  }

  // Gather JSX metrics within this component
  let textTagCount = 0;
  let svgPrimitiveCount = 0;
  let hasSvgRoot = false;
  const relationalComponents: any[] = [];
  const characterRigs: any[] = [];
  let returnsJsx = false;

  astPath.traverse({
    JSXElement(jsxPath: any) {
      returnsJsx = true;
      const opening = jsxPath.node.openingElement;
      const tagName = getTagName(opening.name);
      const lowerTag = tagName.toLowerCase();

      if (lowerTag === 'svg') {
        hasSvgRoot = true;
      }

      if (SVG_PRIMITIVES.has(lowerTag)) {
        let isDummy = false;
        const attrs = opening.attributes || [];
        for (const a of attrs) {
          if (a.type === 'JSXAttribute') {
            const attrName = a.name?.name;
            if (attrName === 'opacity' && (a.value?.value === '0' || a.value?.expression?.value === 0)) {
              isDummy = true;
            }
            if ((attrName === 'r' || attrName === 'width' || attrName === 'height') &&
                (a.value?.value === '0' || a.value?.expression?.value === 0)) {
              isDummy = true;
            }
          }
        }
        if (!isDummy) {
          svgPrimitiveCount++;
        }
      }

      if (TEXT_TAGS.has(lowerTag)) {
        textTagCount++;
      }

      if (isRelationalComponentName(tagName, filePath)) {
        relationalComponents.push({ name: tagName, node: opening, path: jsxPath });
        if (tagName.toLowerCase().includes('rig')) {
          characterRigs.push({ name: tagName, node: opening, path: jsxPath });
        }
      }

      // Prohibit presentation slide headers and section cards in active production scenes
      if (filePath.toLowerCase().includes('projects')) {
        if (['h1', 'h2', 'h3'].includes(lowerTag)) {
          const loc = opening.loc?.start || { line: 1, column: 1 };
          violations.push({
            file: filePath,
            line: loc.line,
            column: loc.column,
            rule: 'no-text-card-monoculture',
            ruleId: 'no-slide-header',
            severity: 'CRITICAL',
            message: `Slide presentation header <${tagName}> detected in "${componentName}". Educational flat-vector motion must not embed presentation slide titles into scene canvases. The visual transformation and narration carry the concept.`
          });
        }

        const attrs = opening.attributes || [];
        for (const a of attrs) {
          if (a.type === 'JSXAttribute' && a.name?.name === 'data-role' && a.value?.value === 'section') {
            const loc = opening.loc?.start || { line: 1, column: 1 };
            violations.push({
              file: filePath,
              line: loc.line,
              column: loc.column,
              rule: 'no-text-card-monoculture',
              ruleId: 'no-slide-section-card',
              severity: 'CRITICAL',
              message: `Slide section card [data-role="section"] detected in "${componentName}". Active educational motion scenes must be full-bleed kinetic canvases without presentation slide decks.`
            });
          }
        }
      }

      // Check for dense prose containers (Text Cluster Law)
      if (['div', 'section', 'article'].includes(lowerTag)) {
        let containerWordCount = 0;
        let containerHasVisuals = false;
        jsxPath.traverse({
          JSXElement(childPath: any) {
            const childTag = getTagName(childPath.node.openingElement.name).toLowerCase();
            if (SVG_PRIMITIVES.has(childTag) || isRelationalComponentName(childTag, filePath)) {
              containerHasVisuals = true;
            }
          },
          JSXText(textPath: any) {
            const val = textPath.node.value.trim();
            if (val) {
              containerWordCount += val.split(/\s+/).filter(Boolean).length;
            }
          },
          StringLiteral(strPath: any) {
            const val = strPath.node.value.trim();
            if (val && strPath.parentPath?.node?.type === 'JSXExpressionContainer') {
              containerWordCount += val.split(/\s+/).filter(Boolean).length;
            }
          }
        });

        if (!containerHasVisuals && containerWordCount > 24 && !filePath.toLowerCase().includes('legacy')) {
          const loc = opening.loc?.start || { line: 1, column: 1 };
          violations.push({
            file: filePath,
            line: loc.line,
            column: loc.column,
            rule: 'no-text-card-monoculture',
            ruleId: 'no-dense-prose-container',
            severity: 'CRITICAL',
            message: `Dense prose container detected in "${componentName}": <${tagName}> holds ${containerWordCount} words without kinetic visual mechanisms. Educational motion must not embed dense prose blocks or slide paragraphs into visual scenes.`
          });
        }
      }
    },
    JSXFragment() {
      returnsJsx = true;
    }
  });

  if (!returnsJsx) return;

  const isSceneComponent =
    componentName.toLowerCase().includes('scene') ||
    componentName.toLowerCase().includes('explainer') ||
    filePath.toLowerCase().includes('scene');

  // -------------------------------------------------------------
  // RULE 1: Anti-Card Rule / Reject Text-Card Monoculture (CRITICAL)
  // Flags components composed purely of text cards without diagrams or animation mechanics.
  // -------------------------------------------------------------
  const totalVisualPrimitives = svgPrimitiveCount + relationalComponents.length;
  // If totalVisualPrimitives === 0, having spring() on text cards does NOT exempt it from card monoculture!
  const isPureTextMonoculture =
    textTagCount >= 2 &&
    (totalVisualPrimitives === 0 || (svgPrimitiveCount <= 1 && relationalComponents.length === 0 && !fileHasKinetic));

  if (isPureTextMonoculture) {
    const loc = astPath.node.loc?.start || { line: 1, column: 1 };
    violations.push({
      file: filePath,
      line: loc.line,
      column: loc.column,
      rule: 'no-text-card-monoculture',
      ruleId: 'no-text-card-monoculture',
      severity: 'CRITICAL',
      message: `Text-card monoculture detected in component "${componentName}". Component contains ${textTagCount} text elements but lacks meaningful diagram mechanisms (only ${svgPrimitiveCount} primitives, ${relationalComponents.length} relational components). Educational motion must use relational visual diagrams, not static presentation slides.`,
    });
  }

  // -------------------------------------------------------------
  // RULE 2: Require Relational Visual Primitives (CRITICAL)
  // Scene components must instantiate at least one visual mechanism or drawing canvas.
  // -------------------------------------------------------------
  if (isSceneComponent && (totalVisualPrimitives === 0 || (svgPrimitiveCount < 2 && relationalComponents.length === 0 && !hasSvgRoot))) {
    const loc = astPath.node.loc?.start || { line: 1, column: 1 };
    violations.push({
      file: filePath,
      line: loc.line,
      column: loc.column,
      rule: 'require-relational-primitives',
      ruleId: 'require-relational-primitives',
      severity: 'CRITICAL',
      message: `Scene component "${componentName}" lacks relational visual primitives. Scene must include SVG vectors, node/edge graphs, coordinate frameworks, or kinetic diagram mechanisms.`,
    });
  }

  // -------------------------------------------------------------
  // RULE 3: Reject Passive Character Ornament (MAJOR)
  // Character rig present but not connected to dynamic frame/pose/state.
  // -------------------------------------------------------------
  for (const rig of characterRigs) {
    const attrs = rig.node.attributes || [];
    const hasFrameProp = attrs.some((a: any) => a.type === 'JSXAttribute' && a.name?.name === 'frame');
    const poseAttr = attrs.find((a: any) => a.type === 'JSXAttribute' && a.name?.name === 'pose');
    const isDynamicPose = poseAttr ? isDynamicAttrValue(poseAttr) : false;
    const hasDynamicProps = attrs.some((a: any) => isDynamicAttrValue(a));

    if (!hasFrameProp && !isDynamicPose && !hasDynamicProps) {
      const loc = rig.node.loc?.start || { line: 1, column: 1 };
      violations.push({
        file: filePath,
        line: loc.line,
        column: loc.column,
        rule: 'no-passive-character-ornament',
        ruleId: 'no-passive-character-ornament',
        severity: 'MAJOR',
        message: `Passive character ornament detected on <${rig.name}> in "${componentName}". Character rig lacks dynamic frame binding (frame={frame}) or active pose modulation. Character rigs must actively interact with scene ideas, not stand as inert decorations.`,
      });
    }
  }
}

function getTagName(nodeName: any): string {
  if (!nodeName) return '';
  if (nodeName.type === 'JSXIdentifier') {
    return nodeName.name;
  }
  if (nodeName.type === 'JSXMemberExpression') {
    return `${getTagName(nodeName.object)}.${nodeName.property.name}`;
  }
  return '';
}

/**
 * Lints a single file on disk for visual semantics.
 */
export function lintVisualSemanticsFile(filePath: string): VisualSemanticViolation[] {
  if (!fs.existsSync(filePath)) {
    return [
      {
        file: filePath,
        line: 1,
        column: 1,
        rule: 'file-not-found',
        ruleId: 'file-not-found',
        severity: 'CRITICAL',
        message: `File does not exist: ${filePath}`,
      },
    ];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return lintVisualSemanticsCode(content, filePath);
}

/**
 * Validates target directories or files against visual semantic rules.
 */
export function validateVisualSemantics(
  targets: string[],
  options: VisualSemanticOptions = {}
): VisualSemanticResult {
  const allViolations: VisualSemanticViolation[] = [];
  const visitedFiles = new Set<string>();

  function walk(itemPath: string) {
    if (!fs.existsSync(itemPath)) return;
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      const entries = fs.readdirSync(itemPath);
      for (const entry of entries) {
        if (['node_modules', '.git', 'out', 'dist', '.agents'].includes(entry)) continue;
        walk(path.join(itemPath, entry));
      }
    } else if (stat.isFile()) {
      if (/\.(tsx|jsx)$/.test(itemPath) && !itemPath.endsWith('.d.ts')) {
        const full = path.resolve(itemPath);
        if (!visitedFiles.has(full)) {
          visitedFiles.add(full);
          const fileViolations = lintVisualSemanticsFile(full);
          allViolations.push(...fileViolations);
        }
      }
    }
  }

  for (const t of targets) {
    if (!fs.existsSync(t)) {
      allViolations.push({
        file: t,
        line: 1,
        column: 1,
        rule: 'target-path-not-found',
        ruleId: 'target-path-not-found',
        severity: 'CRITICAL',
        message: `Target directory or file does not exist: ${t}. Gate must fail closed.`,
      });
      continue;
    }
    walk(t);
  }

  if (visitedFiles.size === 0 && allViolations.length === 0) {
    allViolations.push({
      file: targets.join(', '),
      line: 1,
      column: 1,
      rule: 'zero-files-analyzed',
      ruleId: 'zero-files-analyzed',
      severity: 'CRITICAL',
      message: `No candidate scene files (.tsx/.jsx) found to analyze in targets: ${targets.join(', ')}. Gate must fail closed.`,
    });
  }

  const criticalCount = allViolations.filter((v) => v.severity === 'CRITICAL').length;
  const majorCount = allViolations.filter((v) => v.severity === 'MAJOR').length;
  const minorCount = allViolations.filter((v) => v.severity === 'MINOR').length;

  const passed = options.strict
    ? allViolations.length === 0
    : criticalCount === 0 && majorCount === 0;

  return {
    filesAnalyzed: visitedFiles.size,
    componentsAnalyzed: visitedFiles.size,
    violations: allViolations,
    passed,
    criticalCount,
    majorCount,
    minorCount,
  };
}

// CLI Execution
export function runCli(args: string[] = process.argv.slice(2)): void {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🎨 [VISUAL AST VALIDATOR] Layer 2 Visual Semantics & Anti-Slide Quality Gate

Usage:
  npx tsx validators/validate-visual-semantics.ts <targetDirOrFile> [options]

Rules Enforced:
  1. no-text-card-monoculture (CRITICAL): Rejects components composed purely of text cards without diagrams
  2. require-relational-primitives (CRITICAL): Enforces presence of SVG shapes, node/edge graphs, or funnels in scenes
  3. no-passive-character-ornament (MAJOR): Flags character rigs placed as static ornaments without frame/pose binding

Options:
  --json          Output results in JSON format
  --strict        Fail on any violation (including MINOR)
  --verbose, -v   Verbose logging
  --help, -h      Display this guide
`);
    process.exit(0);
  }

  const options: VisualSemanticOptions = {
    json: args.includes('--json'),
    strict: args.includes('--strict'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };

  const targets = args.filter((a) => !a.startsWith('-'));
  const effectiveTargets = targets.length > 0 ? targets : ['connection-film/src/scopus-explainer/scenes'];

  if (!options.json) {
    console.log(`\n==================================================================`);
    console.log(` VALIDATOR: Visual AST Semantics & Anti-Slide Gate (Layer 2)`);
    console.log(` Target Path: ${effectiveTargets.join(', ')}`);
    console.log(`==================================================================\n`);
  }

  const result = validateVisualSemantics(effectiveTargets, options);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Analyzed ${result.filesAnalyzed} file(s).`);

    if (result.violations.length === 0) {
      console.log(`✅ [PASSED] 0 Visual semantic violations detected! All scenes employ relational mechanisms.\n`);
    } else {
      console.log(`\n⚠️ Found ${result.violations.length} violation(s):\n`);
      for (const v of result.violations) {
        const color = v.severity === 'CRITICAL' ? '\x1b[31m' : v.severity === 'MAJOR' ? '\x1b[33m' : '\x1b[36m';
        const icon = v.severity === 'CRITICAL' ? '🔴' : v.severity === 'MAJOR' ? '🟠' : '🟡';
        console.log(`${icon} ${color}[${v.severity}]\x1b[0m ${v.file}:${v.line}:${v.column} (${v.rule})`);
        console.log(`  ${v.message}`);
        console.log('');
      }

      if (result.passed) {
        console.log(`✅ Passed (no CRITICAL or MAJOR violations).`);
      } else {
        console.log(`❌ FAILED visual semantics gate (${result.criticalCount} Critical, ${result.majorCount} Major).`);
      }
    }
  }

  process.exit(result.passed ? 0 : 1);
}

if (require.main === module || process.argv[1]?.includes('validate-visual-semantics')) {
  runCli();
}
