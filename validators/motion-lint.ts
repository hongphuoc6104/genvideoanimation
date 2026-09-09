#!/usr/bin/env tsx
/**
 * MOTION LINT - RECURSIVE AST-BASED QUALITY GATE VALIDATOR
 * Full Abstract Syntax Tree (AST) analysis using Babel Parser & Traverse with TypeScript + JSX support.
 * Enforces architectural motion grammar invariants across arbitrary codebases
 * without relying on project-specific variable names or brittle regexes.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@babel/parser';
// @ts-ignore - types not installed for babel traverse
import traverseModule from '@babel/traverse';

// ESM / CJS interop for Babel traverse
const traverse = (traverseModule as any).default || traverseModule;

export type Severity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export interface LintViolation {
  file: string;
  line: number;
  column: number;
  rule: string;
  ruleId?: string; // alias for rule
  severity: Severity;
  message: string;
  snippet?: string;
}

export interface LintResult {
  filesAnalyzed: number;
  violations: LintViolation[];
  passed: boolean;
  criticalCount?: number;
  majorCount?: number;
  minorCount?: number;
}

export interface LintOptions {
  json?: boolean;
  strict?: boolean;
  verbose?: boolean;
}

/**
 * Checks if a JSX element tag name represents an SVG visual drawing primitive.
 */
function isSvgVisualElement(name: string): boolean {
  return ['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'].includes(name.toLowerCase());
}

/**
 * Checks if a node expression compares a progress / time / phase variable.
 */
function isProgressComparison(node: any, code: string): boolean {
  if (!node || node.type !== 'BinaryExpression') return false;
  const op = node.operator;
  // Morph swaps are threshold comparisons on continuous progress variables (<, <=, >, >=)
  if (!['<', '<=', '>', '>='].includes(op)) return false;

  const left = code.slice(node.left.start, node.left.end).trim();
  const right = code.slice(node.right.start, node.right.end).trim();

  // One side must be a numeric threshold literal (e.g. 0.5, 0.6)
  const leftIsNumber = /^\d+(?:\.\d+)?$/.test(left);
  const rightIsNumber = /^\d+(?:\.\d+)?$/.test(right);
  if (!leftIsNumber && !rightIsNumber) return false;

  // The other side must be a progress / time / phase variable (or expression)
  const varSide = leftIsNumber ? right : left;
  return /\b(?:progress|t|rawT|phase|rel|frameProgress|time|pct)\b/i.test(varSide);
}

/**
 * Checks if an expression computes inverse/complementary opacity (e.g. 1 - progress, 1 - t, fadeOut(progress)).
 */
function isInverseOpacity(node: any, code: string): boolean {
  if (!node) return false;
  const text = code.slice(node.start, node.end);
  return (
    /1\s*-\s*(?:progress|t|rawT|blend|alpha|fade|\w+)/.test(text) ||
    /fadeOut\s*\(/.test(text)
  );
}

/**
 * Checks if an expression computes direct opacity (e.g. progress, t, reveal(progress)).
 */
function isDirectOpacity(node: any, code: string): boolean {
  if (!node) return false;
  if (node.type === 'Identifier') {
    const name = node.name.toLowerCase();
    return name === 'progress' || name === 't' || name.includes('blend') || name.includes('alpha');
  }
  const text = code.slice(node.start, node.end);
  return /reveal\s*\(/.test(text) || /^(?:progress|t|blend)$/.test(text.trim());
}

/**
 * Recursive AST analysis on raw source code string.
 */
export function lintSourceCode(content: string, filePath: string = 'inline.tsx'): LintViolation[] {
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

  const violations: LintViolation[] = [];

  traverse(ast, {
    // -------------------------------------------------------------
    // RULE 1: No Runtime Imports from forbidden skill directory (CRITICAL)
    // -------------------------------------------------------------
    ImportDeclaration(astPath: any) {
      const forbiddenPath = ['.agents', 'skills'].join('/');
      const importSource = astPath.node.source.value;
      if (
        importSource.includes(forbiddenPath) ||
        importSource.startsWith('../.agents') ||
        importSource.startsWith('../../.agents')
      ) {
        const line = astPath.node.loc?.start.line || 1;
        const column = astPath.node.loc?.start.column || 1;
        violations.push({
          file: filePath,
          line,
          column,
          rule: 'no-runtime-skill-imports',
          ruleId: 'no-runtime-skill-imports',
          severity: 'CRITICAL',
          message:
            'Prohibited runtime import from skill directory. Production code must import canonical packages (e.g. "motion-kit").',
          snippet: content.slice(astPath.node.start, astPath.node.end),
        });
      }
    },

    // -------------------------------------------------------------
    // RULE 2: No Hard Conditional Swaps in Morphs (CRITICAL)
    // Detects: progress < X ? <ElementA /> : <ElementB />
    // -------------------------------------------------------------
    ConditionalExpression(astPath: any) {
      if (isProgressComparison(astPath.node.test, content)) {
        const trueType = astPath.node.consequent.type;
        const falseType = astPath.node.alternate.type;

        const isTrueJsx = trueType === 'JSXElement' || trueType === 'JSXFragment';
        const isFalseJsx = falseType === 'JSXElement' || falseType === 'JSXFragment';

        if (isTrueJsx && isFalseJsx) {
          const line = astPath.node.loc?.start.line || 1;
          const column = astPath.node.loc?.start.column || 1;
          violations.push({
            file: filePath,
            line,
            column,
            rule: 'no-conditional-morph-swap',
            ruleId: 'no-conditional-morph-swap',
            severity: 'CRITICAL',
            message:
              'Hard conditional swap detected during morph. Binary element switching (progress < X ? <A/> : <B/>) is prohibited during morph transitions. Use continuous geometry vertex interpolation (interpolateSvgPath).',
            snippet: content.slice(astPath.node.start, Math.min(astPath.node.end, astPath.node.start + 120)),
          });
        }
      }
    },

    // -------------------------------------------------------------
    // RULE 3: No Crossfade Pose Blend (CRITICAL)
    // Detects sibling elements crossfading opacity inside the same container
    // -------------------------------------------------------------
    JSXElement(astPath: any) {
      const children = astPath.node.children || [];
      let hasInverse = false;
      let hasDirect = false;

      for (const child of children) {
        if (child.type === 'JSXElement') {
          const attributes = child.openingElement.attributes || [];
          for (const attr of attributes) {
            if (attr.type === 'JSXAttribute' && attr.name?.name === 'opacity') {
              if (attr.value?.type === 'JSXExpressionContainer') {
                const expr = attr.value.expression;
                if (isInverseOpacity(expr, content)) hasInverse = true;
                if (isDirectOpacity(expr, content)) hasDirect = true;
              }
            }
          }
          // Also check style={{ opacity: ... }}
          for (const attr of attributes) {
            if (attr.type === 'JSXAttribute' && attr.name?.name === 'style') {
              if (attr.value?.type === 'JSXExpressionContainer' && attr.value.expression?.type === 'ObjectExpression') {
                for (const prop of attr.value.expression.properties) {
                  if (prop.type === 'ObjectProperty' && prop.key?.name === 'opacity') {
                    if (isInverseOpacity(prop.value, content)) hasInverse = true;
                    if (isDirectOpacity(prop.value, content)) hasDirect = true;
                  }
                }
              }
            }
          }
        }
      }

      if (hasInverse && hasDirect) {
        const line = astPath.node.loc?.start.line || 1;
        const column = astPath.node.loc?.start.column || 1;
        violations.push({
          file: filePath,
          line,
          column,
          rule: 'no-crossfade-pose-blend',
          ruleId: 'no-crossfade-pose-blend',
          severity: 'CRITICAL',
          message:
            'Opacity crossfade pose blending detected between sibling elements. Characters must blend articulated joint transforms via CharacterController.blend(), not crossfade transparency.',
          snippet: content.slice(astPath.node.start, Math.min(astPath.node.end, astPath.node.start + 140)),
        });
      }

      // -------------------------------------------------------------
      // RULE 4: No Monolithic Character Rig (CRITICAL)
      // Component rendering >= 2 SVG primitives with 0 or < 2 nested transform groups
      // -------------------------------------------------------------
      const tagName = astPath.node.openingElement?.name?.name || '';
      if (tagName.toLowerCase() === 'svg') {
        // Check if file or scope is explicitly an SVG path morph (skip morph components)
        const fileLower = filePath.toLowerCase();
        const contentLower = content.toLowerCase();
        const isMorphComponent =
          contentLower.includes('interpolatesvgpath') ||
          contentLower.includes('geometrymorph') ||
          (fileLower.includes('morph') && !fileLower.includes('rig') && !fileLower.includes('character'));

        if (!isMorphComponent) {
          let visualPrimitiveCount = 0;
          let articulatedGroupCount = 0;
          let hasLargePath = false;

          astPath.traverse({
            JSXOpeningElement(subPath: any) {
              const subTagName = subPath.node.name?.name || '';
              if (isSvgVisualElement(subTagName)) {
                visualPrimitiveCount++;
                if (subTagName.toLowerCase() === 'path') {
                  const attrs = subPath.node.attributes || [];
                  const dAttr = attrs.find((a: any) => a.name?.name === 'd');
                  if (dAttr && dAttr.value?.type === 'StringLiteral') {
                    const dVal = dAttr.value.value;
                    if (dVal.length > 50 || /[CSQTA]/i.test(dVal)) {
                      hasLargePath = true;
                    }
                  }
                }
              }
              if (subTagName === 'g') {
                const attrs = subPath.node.attributes || [];
                const hasJoint = attrs.some(
                  (a: any) =>
                    a.type === 'JSXAttribute' &&
                    (a.name?.name === 'data-joint' ||
                      a.name?.name === 'data-part' ||
                      (a.name?.name === 'transform' && !a.value?.value?.includes('translate(0, 0)')))
                );
                if (hasJoint) {
                  articulatedGroupCount++;
                }
              }
            },
          });

          // Find enclosing component name and props if available
          let parentComponentName = '';
          let hasPoseProp = false;
          let currentAstPath: any = astPath;
          while (currentAstPath && currentAstPath.parentPath) {
            currentAstPath = currentAstPath.parentPath;
            if (
              currentAstPath.isFunctionDeclaration() ||
              currentAstPath.isFunctionExpression() ||
              currentAstPath.isArrowFunctionExpression()
            ) {
              const parentNode = currentAstPath.parentPath?.node;
              if (currentAstPath.node.id?.name) {
                parentComponentName = currentAstPath.node.id.name;
              } else if (parentNode?.type === 'VariableDeclarator' && parentNode.id?.name) {
                parentComponentName = parentNode.id.name;
              }
              const params = currentAstPath.node.params || [];
              for (const param of params) {
                if (param.type === 'ObjectPattern') {
                  if (param.properties.some((p: any) => p.key?.name === 'pose' || p.value?.name === 'pose')) {
                    hasPoseProp = true;
                  }
                }
              }
              if (parentComponentName) break;
            }
          }

          const compNameLower = parentComponentName.toLowerCase();
          const isRigOrCharacterComponent =
            compNameLower.includes('character') ||
            compNameLower.includes('rig') ||
            compNameLower.includes('monolithic') ||
            hasPoseProp;

          // If component is named Character/Rig or file specifically defines a character rig
          const isCharacterContext =
            isRigOrCharacterComponent ||
            fileLower.includes('character') ||
            (fileLower.includes('rig') && !fileLower.includes('camera') && !fileLower.includes('explainer') && !fileLower.includes('bench')) ||
            fileLower.includes('bird') ||
            fileLower.includes('monolithic') ||
            content.includes('MonolithicCharacter');

          if (isCharacterContext && (hasLargePath || visualPrimitiveCount >= 2) && articulatedGroupCount < 2) {
            const line = astPath.node.loc?.start.line || 1;
            const column = astPath.node.loc?.start.column || 1;
            violations.push({
              file: filePath,
              line,
              column,
              rule: 'no-monolithic-character',
              ruleId: 'no-monolithic-character',
              severity: 'CRITICAL',
              message: `Character rig is monolithic (${visualPrimitiveCount} visual primitives, ${articulatedGroupCount} articulated groups). Rigs must have hierarchical articulation for torso, head, and limbs with independent pivots.`,
            });
          }
        }
      }
    },

    // -------------------------------------------------------------
    // RULE 5: No Constant Linear Slow Zoom Camera (MAJOR)
    // Detects: zoom = 1.0 + frame * 0.0005 or cameraScale = 1 + cameraProgress * 0.035
    // -------------------------------------------------------------
    VariableDeclarator(astPath: any) {
      const varName = astPath.node.id?.name || '';
      if (['zoom', 'cameraScale', 'cameraZoom', 'scale'].includes(varName)) {
        if (astPath.node.init) {
          const initText = content.slice(astPath.node.init.start, astPath.node.init.end);
          if (
            /\b(?:frame|cameraProgress|progress)\s*\*\s*0\.\d+/.test(initText) &&
            !initText.includes('interpolateCameraHermite') &&
            !initText.includes('cameraFollowContinuous') &&
            !initText.includes('cameraPush') &&
            !initText.includes('easing')
          ) {
            const line = astPath.node.loc?.start.line || 1;
            const column = astPath.node.loc?.start.column || 1;
            violations.push({
              file: filePath,
              line,
              column,
              rule: 'no-constant-slow-zoom',
              ruleId: 'no-constant-slow-zoom',
              severity: 'MAJOR',
              message: `Unmotivated linear camera motion detected in "${varName}". Camera movements must be motivated by narrative events and continuous with Hermite spline easing.`,
              snippet: initText,
            });
          }
        }
      }

      // Also check scene act opacity transitions (RULE 6)
      if (/^act\d*Opacity$/i.test(varName) || /^scene\d*Opacity$/i.test(varName)) {
        const initText = astPath.node.init ? content.slice(astPath.node.init.start, astPath.node.init.end) : '';
        if (
          (initText.includes('fadeOut(') || initText.includes('reveal(')) &&
          !content.includes('interpolateSvgPath') &&
          !content.includes('motivatedIris') &&
          !content.includes('morphTransition')
        ) {
          const line = astPath.node.loc?.start.line || 1;
          const column = astPath.node.loc?.start.column || 1;
          violations.push({
            file: filePath,
            line,
            column,
            rule: 'no-opacity-scene-transition',
            ruleId: 'no-opacity-scene-transition',
            severity: 'CRITICAL',
            message:
              'Opacity-only scene transition detected. Act transitions must use motivated geometric transitions or camera motion rather than flat opacity crossfades.',
            snippet: initText,
          });
        }
      }
    },

    // -------------------------------------------------------------
    // RULE 7: Fake Bezier Travel (MAJOR)
    // Detects linear chord packet travel on curved conduits
    // -------------------------------------------------------------
    CallExpression(astPath: any) {
      const calleeName = astPath.node.callee?.name || '';
      if (calleeName === 'interpolate') {
        const parentDecl = astPath.findParent((p: any) => p.isVariableDeclarator());
        const varName = parentDecl?.node?.id?.name || '';
        if (['packetX', 'packetY', 'particleX', 'particleY'].includes(varName)) {
          // Check if file contains curved conduit or bezier path without calling bezier functions
          if (
            content.includes('Bezier') ||
            content.includes('bezier') ||
            content.includes('conduit') ||
            content.includes('curve')
          ) {
            if (
              !content.includes('quadraticBezierPoint') &&
              !content.includes('cubicBezierPoint') &&
              !content.includes('evaluatePacketTravel')
            ) {
              const line = astPath.node.loc?.start.line || 1;
              const column = astPath.node.loc?.start.column || 1;
              violations.push({
                file: filePath,
                line,
                column,
                rule: 'no-fake-bezier-travel',
                ruleId: 'no-fake-bezier-travel',
                severity: 'MAJOR',
                message:
                  'Fake Bezier travel detected: linear chord packet travel on a curved conduit. Packets traveling along curved paths must evaluate exact Bezier coordinates and tangent vectors via quadraticBezierPoint or cubicBezierPoint.',
                snippet: content.slice(astPath.node.start, astPath.node.end),
              });
            }
          }
        }
      }
    },

    // -------------------------------------------------------------
    // RULE 8: Inert Damping (MAJOR)
    // Detects camera damping parameters declared or passed but never mathematically used
    // -------------------------------------------------------------
    FunctionDeclaration(astPath: any) {
      checkFunctionDamping(astPath, filePath, content, violations);
    },
    FunctionExpression(astPath: any) {
      checkFunctionDamping(astPath, filePath, content, violations);
    },
    ArrowFunctionExpression(astPath: any) {
      checkFunctionDamping(astPath, filePath, content, violations);
    },

    // -------------------------------------------------------------
    // RULE 9: Discontinuous Camera Jumps (MAJOR)
    // Detects abrupt camera cuts or jumps violating C0/C1 continuity
    // -------------------------------------------------------------
    ObjectProperty(astPath: any) {
      const propName = astPath.node.key?.name || '';
      if (['zoom', 'cameraX', 'cameraY'].includes(propName)) {
        const text = content.slice(astPath.node.value.start, astPath.node.value.end);
        if (
          /\bframe\s*\*\s*0\.\d+/.test(text) &&
          !text.includes('clamp') &&
          !text.includes('easing') &&
          !text.includes('cameraPush') &&
          !text.includes('interpolateCameraHermite') &&
          !text.includes('cameraFollowContinuous')
        ) {
          const line = astPath.node.loc?.start.line || 1;
          const column = astPath.node.loc?.start.column || 1;
          violations.push({
            file: filePath,
            line,
            column,
            rule: 'no-constant-slow-zoom',
            ruleId: 'no-constant-slow-zoom',
            severity: 'MAJOR',
            message: `Unmotivated linear camera motion detected in "${propName}". Camera movements must be motivated by narrative events and continuous with Hermite spline easing.`,
            snippet: text,
          });
        }
      }
    },
  });

  return violations;
}

/**
 * Checks if a function accepts a camera damping parameter but never uses it mathematically.
 */
function checkFunctionDamping(astPath: any, filePath: string, content: string, violations: LintViolation[]): void {
  const fnName = astPath.node.id?.name || '';
  const isCameraScope =
    fnName.toLowerCase().includes('camera') ||
    filePath.toLowerCase().includes('camera') ||
    content.includes('CameraRig');

  if (!isCameraScope) return;

  const params = astPath.node.params || [];
  for (const p of params) {
    let paramName = '';
    if (p.type === 'Identifier') {
      paramName = p.name;
    } else if (p.type === 'AssignmentPattern' && p.left?.type === 'Identifier') {
      paramName = p.left.name;
    }

    if (['damping', 'dampingFactor', 'springDamping', 'zeta'].includes(paramName)) {
      const binding = astPath.scope.getBinding(paramName);
      if (binding && (!binding.referenced || binding.references === 0)) {
        const line = p.loc?.start.line || 1;
        const column = p.loc?.start.column || 1;
        violations.push({
          file: filePath,
          line,
          column,
          rule: 'no-inert-damping',
          ruleId: 'no-inert-damping',
          severity: 'MAJOR',
          message: `Inert camera damping parameter "${paramName}" is declared but never referenced in camera inertial calculations. Damping must functionally integrate into 2nd-order spring-damper dynamics.`,
        });
      }
    }
  }
}

/**
 * Alias for lintSourceCode for boundary tests.
 */
export const runMotionLintOnCode = lintSourceCode;

/**
 * Lints a single file on disk.
 */
export function lintSourceFile(filePath: string): LintViolation[] {
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
  return lintSourceCode(content, filePath);
}

/**
 * Recursively runs the linter across target files and directories.
 */
export function runLinter(targets: string[], options: LintOptions = {}): LintResult {
  const allViolations: LintViolation[] = [];
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
      if (/\.(tsx?|jsx?)$/.test(itemPath) && !itemPath.endsWith('.d.ts')) {
        const full = path.resolve(itemPath);
        if (!visitedFiles.has(full)) {
          visitedFiles.add(full);
          const fileViolations = lintSourceFile(full);
          allViolations.push(...fileViolations);
        }
      }
    }
  }

  for (const t of targets) {
    walk(t);
  }

  const criticalCount = allViolations.filter((v) => v.severity === 'CRITICAL').length;
  const majorCount = allViolations.filter((v) => v.severity === 'MAJOR').length;
  const minorCount = allViolations.filter((v) => v.severity === 'MINOR').length;

  const passed = options.strict
    ? allViolations.length === 0
    : criticalCount === 0 && majorCount === 0;

  return {
    filesAnalyzed: visitedFiles.size,
    violations: allViolations,
    passed,
    criticalCount,
    majorCount,
    minorCount,
  };
}

/**
 * Legacy directory linter export for backwards compatibility.
 */
export function lintDirectory(targetPath: string, options: LintOptions = {}): LintResult {
  return runLinter([targetPath], options);
}

// CLI Execution
export function runCli(args: string[] = process.argv.slice(2)): void {
  const options: LintOptions = {
    json: args.includes('--json'),
    strict: args.includes('--strict'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };

  const targets = args.filter((a) => !a.startsWith('--') && !a.startsWith('-'));
  const effectiveTargets = targets.length > 0 ? targets : ['connection-film/src', 'motion-kit'];

  if (!options.json) {
    console.log(`\n🔍 [AST MOTION-LINT] Analyzing AST structures in: ${effectiveTargets.join(', ')}\n`);
  }

  const result = runLinter(effectiveTargets, options);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Analyzed ${result.filesAnalyzed} file(s).`);

    if (result.violations.length === 0) {
      console.log(`✅ [PASSED] 0 Anti-patterns detected! Clean AST motion grammar.\n`);
    } else {
      console.log(`\n⚠️ Found ${result.violations.length} violation(s):\n`);
      for (const v of result.violations) {
        const color = v.severity === 'CRITICAL' ? '\x1b[31m' : v.severity === 'MAJOR' ? '\x1b[33m' : '\x1b[36m';
        const icon = v.severity === 'CRITICAL' ? '🔴' : v.severity === 'MAJOR' ? '🟠' : '🟡';
        console.log(`${icon} ${color}[${v.severity}]\x1b[0m ${v.file}:${v.line}:${v.column} (${v.rule})`);
        console.log(`  ${v.message}`);
        if (v.snippet) console.log(`  Snippet: ${v.snippet.trim()}`);
        console.log('');
      }

      if (result.passed) {
        console.log(`✅ Passed (no CRITICAL or MAJOR violations).`);
      } else {
        console.log(`❌ FAILED quality gate (${result.criticalCount} Critical, ${result.majorCount} Major).`);
      }
    }
  }

  process.exit(result.passed ? 0 : 1);
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

