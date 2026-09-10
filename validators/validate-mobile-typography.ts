#!/usr/bin/env tsx
/**
 * VALIDATE MOBILE TYPOGRAPHY - STATIC AST QUALITY GATE (R1 & R22)
 *
 * Babel AST visitor enforcing mobile font size minimums on 1080x1920 canvas.
 * Zero filename-specific regexes. Structural & semantic inspection.
 *
 * Thresholds:
 * - Hero >= 64px
 * - Section >= 48px
 * - Card >= 38px
 * - Body >= 34px
 * - Secondary >= 30px (Absolute mobile floor: 30px)
 * - Captions >= 52px
 *
 * Exclusions:
 * - Academic citations, DOI URLs, ISSN/ISBN, formal references (Davis, 1989), copyright
 * - Decorative glyphs and character rig expression symbols (?, !, etc.)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from '@babel/parser';
// @ts-ignore
import traverseModule from '@babel/traverse';

const traverse = (traverseModule as any).default || traverseModule;

export type TypographyRole =
  | 'hero'
  | 'section'
  | 'card'
  | 'body'
  | 'secondary'
  | 'caption'
  | 'citation'
  | 'decorative';

export const TYPOGRAPHY_THRESHOLDS: Record<TypographyRole, number> = {
  hero: 64,
  section: 48,
  card: 38,
  body: 34,
  secondary: 30,
  caption: 52,
  citation: 0,
  decorative: 0,
};

const CITATION_REGEX =
  /(?:\b10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+|\b(?:ISSN|ISBN)\s*(?:-1[03]:\s*)?[0-9Xx-]{8,17}\b|\([A-Z][a-zA-Z\s]+,\s*(?:19|20)\d{2}[a-z]?\)|\bdoi:\s*10\.)/i;

const SINGLE_SYMBOL_REGEX = /^[?!\u2022\u2726\u27A4+\-x\u00D7\u00F7\u2605\u2713\u2717]$/;

export interface TypographyViolation {
  file: string;
  line: number;
  column: number;
  tagName: string;
  role: TypographyRole;
  detectedSize: number;
  requiredThreshold: number;
  shortfall: number;
  severity: 'CRITICAL' | 'MAJOR';
  message: string;
  snippet?: string;
}

export interface TypographyValidationResult {
  filesAnalyzed: number;
  violations: TypographyViolation[];
  passed: boolean;
  criticalCount: number;
  majorCount: number;
}

export interface TypographyValidatorOptions {
  strict?: boolean;
  json?: boolean;
  verbose?: boolean;
}

/**
 * Recursively resolves a numeric font size from AST nodes.
 */
export function extractNumericFontSize(node: any, scope: any): number | null {
  if (!node) return null;

  // 1. Direct Numeric Literal: fontSize={40}
  if (node.type === 'NumericLiteral') {
    return node.value;
  }

  // 2. String Literal: fontSize="40px" or fontSize="40"
  if (node.type === 'StringLiteral') {
    const match = node.value.trim().match(/^(\d+(?:\.\d+)?)(?:px)?$/);
    return match ? parseFloat(match[1]) : null;
  }

  // 3. Identifier Reference: const TITLE_SIZE = 48; fontSize: TITLE_SIZE
  if (node.type === 'Identifier') {
    const binding = scope?.getBinding(node.name);
    if (binding && binding.path?.node) {
      const init = binding.path.node.init;
      if (init) {
        return extractNumericFontSize(init, binding.scope);
      }
    }
    return null;
  }

  // 4. Binary Expression: fontSize: BASE + 10 or fontSize: 30 + 8
  if (node.type === 'BinaryExpression') {
    const left = extractNumericFontSize(node.left, scope);
    const right = extractNumericFontSize(node.right, scope);
    if (left !== null && right !== null) {
      if (node.operator === '+') return left + right;
      if (node.operator === '*') return left * right;
      if (node.operator === '-') return left - right;
      if (node.operator === '/') return left / right;
    }
    return null;
  }

  // 5. Conditional (Ternary) Expression: fontSize: isFocus ? 48 : 34
  // We take the minimum branch because worst-case legibility must satisfy the gate!
  if (node.type === 'ConditionalExpression') {
    const cons = extractNumericFontSize(node.consequent, scope);
    const alt = extractNumericFontSize(node.alternate, scope);
    if (cons !== null && alt !== null) return Math.min(cons, alt);
    return cons !== null ? cons : alt;
  }

  // 6. Member Expression: TYPOGRAPHY.hero or THEME.fontSize.body
  if (node.type === 'MemberExpression') {
    const propName = node.property?.name || node.property?.value;
    if (propName) {
      const KNOWN_TOKENS: Record<string, number> = {
        hero: 64,
        section: 48,
        card: 38,
        cardtitle: 38,
        title: 38,
        body: 34,
        secondary: 30,
        caption: 56,
      };
      if (KNOWN_TOKENS[propName.toLowerCase()]) {
        return KNOWN_TOKENS[propName.toLowerCase()];
      }
    }
  }

  return null;
}

/**
 * Extracts numeric scale factors from CSS or SVG transform strings: scale(sx), scale(sx, sy).
 */
export function parseScaleFactorsFromString(transformStr: string): number[] {
  const scales: number[] = [];
  const scaleRegex = /scale\(\s*([-0-9.]+)(?:\s*,\s*([-0-9.]+))?\s*\)/g;
  let match;
  while ((match = scaleRegex.exec(transformStr)) !== null) {
    const sx = parseFloat(match[1]);
    const sy = match[2] ? parseFloat(match[2]) : sx;
    if (!isNaN(sx) && !isNaN(sy)) {
      scales.push(Math.min(Math.abs(sx), Math.abs(sy)));
    }
  }
  return scales;
}

/**
 * Extracts scale factor from a JSX opening element attributes (transform, scale, style).
 */
export function extractScaleFactorsFromOpeningElement(openingElement: any, scope: any): number[] {
  if (!openingElement || !openingElement.attributes) return [];
  const scales: number[] = [];

  for (const attr of openingElement.attributes) {
    if (attr.type !== 'JSXAttribute') continue;
    const name = attr.name?.name;

    // 1. Direct scale attribute: scale={0.5} or scale="0.5"
    if (name === 'scale') {
      const val =
        attr.value?.type === 'JSXExpressionContainer'
          ? extractNumericFontSize(attr.value.expression, scope)
          : attr.value?.type === 'StringLiteral'
          ? parseFloat(attr.value.value)
          : null;
      if (typeof val === 'number' && !isNaN(val) && val > 0) {
        scales.push(val);
      }
    }

    // 2. Direct transform attribute: transform="scale(0.5)" or transform={`scale(${s})`}
    if (name === 'transform') {
      if (attr.value?.type === 'StringLiteral') {
        scales.push(...parseScaleFactorsFromString(attr.value.value));
      } else if (attr.value?.type === 'JSXExpressionContainer') {
        const expr = attr.value.expression;
        if (expr.type === 'StringLiteral') {
          scales.push(...parseScaleFactorsFromString(expr.value));
        } else if (expr.type === 'TemplateLiteral') {
          const raw = expr.quasis.map((q: any) => q.value.raw).join(' ');
          scales.push(...parseScaleFactorsFromString(raw));
        }
      }
    }

    // 3. style={{ transform: ..., scale: ... }}
    if (name === 'style' && attr.value?.type === 'JSXExpressionContainer') {
      const expr = attr.value.expression;
      if (expr?.type === 'ObjectExpression') {
        for (const prop of expr.properties) {
          if (prop.type === 'ObjectProperty') {
            const propKey = prop.key?.name || prop.key?.value;
            if (propKey === 'scale') {
              const val = extractNumericFontSize(prop.value, scope);
              if (typeof val === 'number' && !isNaN(val) && val > 0) {
                scales.push(val);
              }
            } else if (propKey === 'transform') {
              if (prop.value.type === 'StringLiteral') {
                scales.push(...parseScaleFactorsFromString(prop.value.value));
              } else if (prop.value.type === 'TemplateLiteral') {
                const raw = prop.value.quasis.map((q: any) => q.value.raw).join(' ');
                scales.push(...parseScaleFactorsFromString(raw));
              }
            }
          }
        }
      }
    }
  }

  return scales;
}

/**
 * Computes cumulative scale factor across self and all ancestor JSX elements.
 */
export function computeCumulativeScale(astPath: any): number {
  let cumulative = 1.0;
  // Check self
  const selfScales = extractScaleFactorsFromOpeningElement(astPath.node, astPath.scope);
  for (const s of selfScales) cumulative *= s;

  // Check ancestors
  let current = astPath.parentPath;
  while (current) {
    if (current.isJSXElement()) {
      const opening = current.node.openingElement;
      if (opening && opening !== astPath.node) {
        const ancestorScales = extractScaleFactorsFromOpeningElement(opening, current.scope);
        for (const s of ancestorScales) cumulative *= s;
      }
    }
    current = current.parentPath;
  }
  return cumulative;
}

/**
 * Determines whether an element is an excluded citation or decorative rig glyph.
 */
function isCitationOrExcluded(astPath: any, tagName: string, content: string): boolean {
  const openingElement = astPath.node;
  const attributes = openingElement.attributes || [];

  // Check direct attributes
  for (const attr of attributes) {
    if (attr.type === 'JSXAttribute') {
      const name = attr.name?.name;
      const val =
        attr.value?.type === 'StringLiteral'
          ? attr.value.value
          : attr.value?.expression?.value;

      if (name === 'data-role' || name === 'role' || name === 'data-typography') {
        const strVal = String(val).toLowerCase();
        if (['citation', 'legal', 'metadata', 'decorative', 'presentation'].includes(strVal)) {
          return true;
        }
      }
      if (name === 'aria-hidden' && (val === 'true' || val === true)) {
        return true;
      }
      if (name === 'data-decorative' && (val === 'true' || val === true)) {
        return true;
      }
      if (name === 'className' && typeof val === 'string') {
        if (/citation|legal|academic-meta|footnote/i.test(val)) return true;
      }
    }
  }

  // Check ancestor container tagging
  const hasExcludedAncestor = astPath.findParent((p: any) => {
    if (!p.isJSXElement()) return false;
    const parentAttrs = p.node.openingElement.attributes || [];
    return parentAttrs.some((a: any) => {
      if (a.type !== 'JSXAttribute') return false;
      const aname = a.name?.name;
      const aval = a.value?.type === 'StringLiteral' ? a.value.value : '';
      return (
        (aname === 'data-role' && ['citation', 'legal', 'metadata', 'decorative'].includes(aval)) ||
        (aname === 'className' && /citation|legal|academic-meta/i.test(String(aval))) ||
        (aname === 'aria-hidden' && aval === 'true')
      );
    });
  });
  if (hasExcludedAncestor) return true;

  // Check character rig joint prop icon exclusion
  const hasRigJoint = astPath.findParent((p: any) => {
    if (!p.isJSXElement()) return false;
    const pAttrs = p.node.openingElement.attributes || [];
    return pAttrs.some(
      (a: any) =>
        a.type === 'JSXAttribute' &&
        (a.name?.name === 'data-joint' || a.name?.name === 'data-part')
    );
  });

  // Extract static child text
  const children = astPath.parent?.children || [];
  let rawChildText = '';
  for (const child of children) {
    if (child.type === 'JSXText') rawChildText += child.value;
  }
  rawChildText = rawChildText.trim();

  // If inside rig joint and is a single punctuation/symbol glyph
  if (hasRigJoint && SINGLE_SYMBOL_REGEX.test(rawChildText)) {
    return true;
  }

  // Check citation regex in text
  if (CITATION_REGEX.test(rawChildText)) {
    return true;
  }

  return false;
}

/**
 * Resolves the typography role for an element.
 */
function resolveRole(astPath: any, tagName: string, strict: boolean): TypographyRole {
  const openingElement = astPath.node;
  const attributes = openingElement.attributes || [];

  // 1. Explicit attribute
  for (const attr of attributes) {
    if (attr.type === 'JSXAttribute') {
      const name = attr.name?.name;
      if (name === 'data-role' || name === 'role' || name === 'data-typography') {
        const val =
          attr.value?.type === 'StringLiteral'
            ? attr.value.value
            : attr.value?.expression?.value;
        const normalized = String(val).toLowerCase();
        if (normalized.includes('hero')) return 'hero';
        if (normalized.includes('section')) return 'section';
        if (normalized.includes('card')) return 'card';
        if (normalized.includes('body')) return 'body';
        if (normalized.includes('secondary')) return 'secondary';
        if (normalized.includes('caption')) return 'caption';
      }
    }
  }

  // 2. Component type
  if (tagName === 'KaraokeCaptions' || tagName === 'KaraokeLine') {
    return 'caption';
  }

  // 3. Tag name mapping
  const lowerTag = tagName.toLowerCase();
  if (lowerTag === 'h1') return 'hero';
  if (lowerTag === 'h2') return 'section';
  if (['h3', 'h4', 'h5', 'h6'].includes(lowerTag)) return 'card';
  if (lowerTag === 'p') return 'body';
  if (lowerTag === 'small') return 'secondary';

  // 4. ClassName / ID matching
  for (const attr of attributes) {
    if (attr.type === 'JSXAttribute' && attr.name?.name === 'className') {
      const val = attr.value?.type === 'StringLiteral' ? attr.value.value : '';
      if (/hero/i.test(val)) return 'hero';
      if (/section|part|phase/i.test(val)) return 'section';
      if (/card.*title|door.*title|step.*title/i.test(val)) return 'card';
      if (/body|desc|paragraph|content/i.test(val)) return 'body';
      if (/badge|tag|hint|note|sub|meta|secondary/i.test(val)) return 'secondary';
    }
  }

  // 5. Child text heuristics
  const children = astPath.parent?.children || [];
  let rawChildText = '';
  for (const child of children) {
    if (child.type === 'JSXText') rawChildText += child.value;
  }
  rawChildText = rawChildText.trim();

  if (/^(?:PH\u1EA6N|B\u01AF\u1EDA|PHASE|ACT)\s+\d+/i.test(rawChildText)) {
    return 'section';
  }
  if (/^(?:\u27A4\s*D\u1EA5u hi\u1EC7u|G\u1EE3i \u00FD:|L\u01B0u \u00FD:|\u2726\s*\u0110i\u1EC3m m\u1EDBi:)/i.test(rawChildText)) {
    return 'secondary';
  }

  // 6. Default role: In strict mode untagged text defaults to body (>= 34px), otherwise secondary (>= 30px)
  return strict ? 'body' : 'secondary';
}

/**
 * Validates a single source string.
 */
export function validateSourceCode(
  content: string,
  filePath: string = 'inline.tsx',
  options: TypographyValidatorOptions = {}
): TypographyViolation[] {
  if (!content || !content.trim()) return [];

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
        tagName: 'unknown',
        role: 'body',
        detectedSize: 0,
        requiredThreshold: 34,
        shortfall: 34,
        severity: 'CRITICAL',
        message: `Failed to parse AST: ${err.message}`,
      },
    ];
  }

  const violations: TypographyViolation[] = [];
  const strict = !!options.strict;

  traverse(ast, {
    JSXOpeningElement(astPath: any) {
      const tagName = astPath.node.name?.name || '';
      if (!tagName) return;

      // Check KaraokeCaptions component
      if (tagName === 'KaraokeCaptions') {
        let explicitCaptionSize: number | null = null;
        for (const attr of astPath.node.attributes) {
          if (attr.type !== 'JSXAttribute') continue;
          if (attr.name?.name === 'themeProps' && attr.value?.expression?.type === 'ObjectExpression') {
            for (const prop of attr.value.expression.properties) {
              if (prop.key?.name === 'fontSize') {
                explicitCaptionSize = extractNumericFontSize(prop.value, astPath.scope);
              }
            }
          }
        }
        const cumulativeScale = computeCumulativeScale(astPath);
        const baseCaption = explicitCaptionSize !== null ? explicitCaptionSize : 56;
        const effectiveCaption = baseCaption * cumulativeScale;
        if (effectiveCaption < TYPOGRAPHY_THRESHOLDS.caption) {
          const line = astPath.node.loc?.start.line || 1;
          const col = astPath.node.loc?.start.column || 1;
          violations.push({
            file: filePath,
            line,
            column: col,
            tagName,
            role: 'caption',
            detectedSize: Number(effectiveCaption.toFixed(2)),
            requiredThreshold: TYPOGRAPHY_THRESHOLDS.caption,
            shortfall: Number((TYPOGRAPHY_THRESHOLDS.caption - effectiveCaption).toFixed(2)),
            severity: 'CRITICAL',
            message: `Karaoke captions font size (${baseCaption}px${cumulativeScale !== 1.0 ? ` * ${cumulativeScale.toFixed(2)} = ${effectiveCaption.toFixed(1)}px` : ''}) violates minimum threshold (>= ${TYPOGRAPHY_THRESHOLDS.caption}px).`,
            snippet: content.slice(astPath.node.start, Math.min(astPath.node.end, astPath.node.start + 120)),
          });
        }
        return;
      }

      // Check citations and exclusions
      if (isCitationOrExcluded(astPath, tagName, content)) {
        return;
      }

      // Extract explicit font size
      let detectedSize: number | null = null;
      for (const attr of astPath.node.attributes) {
        if (attr.type !== 'JSXAttribute') continue;
        const attrName = attr.name?.name;

        // 1. Direct fontSize prop
        if (attrName === 'fontSize' || attrName === 'font-size') {
          const valNode =
            attr.value?.type === 'JSXExpressionContainer'
              ? attr.value.expression
              : attr.value;
          detectedSize = extractNumericFontSize(valNode, astPath.scope);
        }

        // 2. style={{ fontSize: ... }}
        if (attrName === 'style' && attr.value?.type === 'JSXExpressionContainer') {
          const expr = attr.value.expression;
          if (expr?.type === 'ObjectExpression') {
            for (const prop of expr.properties) {
              if (prop.type === 'ObjectProperty') {
                const kName = prop.key?.name || prop.key?.value;
                if (kName === 'fontSize' || kName === 'font-size') {
                  detectedSize = extractNumericFontSize(prop.value, astPath.scope);
                }
              }
            }
          } else if (expr?.type === 'Identifier') {
            const binding = astPath.scope.getBinding(expr.name);
            const init = binding?.path?.node?.init;
            if (init?.type === 'ObjectExpression') {
              for (const prop of init.properties) {
                if (prop.type === 'ObjectProperty') {
                  const kName = prop.key?.name || prop.key?.value;
                  if (kName === 'fontSize' || kName === 'font-size') {
                    detectedSize = extractNumericFontSize(prop.value, binding.scope);
                  }
                }
              }
            }
          }
        }
      }

      // If no explicit font size, check if it's a semantic text tag
      const isSemanticTextTag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'].includes(tagName.toLowerCase());

      if (detectedSize === null) {
        if (isSemanticTextTag) {
          const role = resolveRole(astPath, tagName, strict);
          const requiredThreshold = TYPOGRAPHY_THRESHOLDS[role];
          const line = astPath.node.loc?.start.line || 1;
          const col = astPath.node.loc?.start.column || 1;
          violations.push({
            file: filePath,
            line,
            column: col,
            tagName,
            role,
            detectedSize: 16,
            requiredThreshold,
            shortfall: requiredThreshold - 16,
            severity: 'CRITICAL',
            message: `Semantic text tag <${tagName}> lacks explicit fontSize. Inherited browser default (~16px) violates '${role}' threshold (>= ${requiredThreshold}px).`,
            snippet: content.slice(astPath.node.start, Math.min(astPath.node.end, astPath.node.start + 120)),
          });
        }
        return;
      }

      // Check detected font size against thresholds with cumulative scale
      const role = resolveRole(astPath, tagName, strict);
      const requiredThreshold = TYPOGRAPHY_THRESHOLDS[role];
      const cumulativeScale = computeCumulativeScale(astPath);
      const effectiveSize = detectedSize * cumulativeScale;

      // Absolute floor check (< 30px) OR role threshold check
      if (effectiveSize < 30 || effectiveSize < requiredThreshold) {
        const line = astPath.node.loc?.start.line || 1;
        const col = astPath.node.loc?.start.column || 1;
        const shortfall = Math.max(requiredThreshold - effectiveSize, 30 - effectiveSize);
        const scaleDesc = cumulativeScale !== 1.0 ? ` (effective: ${detectedSize}px * ${cumulativeScale.toFixed(2)} = ${effectiveSize.toFixed(1)}px)` : '';
        violations.push({
          file: filePath,
          line,
          column: col,
          tagName,
          role,
          detectedSize: Number(effectiveSize.toFixed(2)),
          requiredThreshold,
          shortfall: Number(shortfall.toFixed(2)),
          severity: 'CRITICAL',
          message:
            effectiveSize < 30
              ? `Font size (${detectedSize}px${scaleDesc}) violates absolute mobile floor (>= 30px) for role '${role}' (required >= ${requiredThreshold}px).`
              : `Font size (${detectedSize}px${scaleDesc}) violates mobile threshold for role '${role}' (required >= ${requiredThreshold}px).`,
          snippet: content.slice(astPath.node.start, Math.min(astPath.node.end, astPath.node.start + 120)),
        });
      }
    },
  });

  return violations;
}

/**
 * Validates a single source file on disk.
 */
export function validateSourceFile(
  filePath: string,
  options: TypographyValidatorOptions = {}
): TypographyViolation[] {
  if (!fs.existsSync(filePath)) {
    return [
      {
        file: filePath,
        line: 1,
        column: 1,
        tagName: 'unknown',
        role: 'body',
        detectedSize: 0,
        requiredThreshold: 34,
        shortfall: 34,
        severity: 'CRITICAL',
        message: `File does not exist: ${filePath}`,
      },
    ];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return validateSourceCode(content, filePath, options);
}

/**
 * Recursively analyzes files and directories.
 */
export function runLinter(
  targets: string[],
  options: TypographyValidatorOptions = {}
): TypographyValidationResult {
  const allViolations: TypographyViolation[] = [];
  const visitedFiles = new Set<string>();

  function walk(itemPath: string) {
    if (!fs.existsSync(itemPath)) return;
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      const entries = fs.readdirSync(itemPath);
      for (const entry of entries) {
        if (['node_modules', '.git', 'dist', 'out', '.agents', '.gemini'].includes(entry)) continue;
        walk(path.join(itemPath, entry));
      }
    } else if (stat.isFile()) {
      if (/\.(tsx|jsx)$/.test(itemPath) && !itemPath.endsWith('.d.ts')) {
        const full = path.resolve(itemPath);
        if (!visitedFiles.has(full)) {
          visitedFiles.add(full);
          const fileViolations = validateSourceFile(full, options);
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
  const passed = allViolations.length === 0;

  return {
    filesAnalyzed: visitedFiles.size,
    violations: allViolations,
    passed,
    criticalCount,
    majorCount,
  };
}

export function validateMobileTypography(
  targets: string[],
  options: TypographyValidatorOptions = {}
): TypographyValidationResult {
  return runLinter(targets, options);
}

export function runCli(args: string[] = process.argv.slice(2)): void {
  const options: TypographyValidatorOptions = {
    json: args.includes('--json'),
    strict: args.includes('--strict'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };

  const targets = args.filter((a) => !a.startsWith('--') && !a.startsWith('-'));
  const effectiveTargets =
    targets.length > 0 ? targets : ['connection-film/src/scopus-explainer'];

  if (!options.json) {
    console.log(`\n🔍 [AST MOBILE-TYPOGRAPHY] Validating mobile font sizes in: ${effectiveTargets.join(', ')}\n`);
  }

  const result = runLinter(effectiveTargets, options);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Analyzed ${result.filesAnalyzed} file(s).`);

    if (result.violations.length === 0) {
      console.log(`✅ [PASSED] 0 Typography violations detected! All text meets mobile minimums.\n`);
    } else {
      console.log(`\n⚠️ Found ${result.violations.length} violation(s):\n`);
      for (const v of result.violations) {
        console.log(`🔴 [CRITICAL] ${v.file}:${v.line}:${v.column} (typography-mobile-minimum)`);
        console.log(`  ${v.message}`);
        if (v.snippet) console.log(`  Snippet: ${v.snippet.trim()}`);
        console.log('');
      }
      console.log(`❌ FAILED typography quality gate (${result.criticalCount} Critical violations).\n`);
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
