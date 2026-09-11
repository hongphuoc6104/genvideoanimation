#!/usr/bin/env tsx
/**
 * GENERIC HEADLESS DOM RUNTIME GEOMETRY GATE (TIER 2 QA GATE: G04D)
 *
 * Authoritative, fail-closed headless browser DOM measurement gate evaluating
 * live physical bounding boxes (getBoundingClientRect(), getBBox(), CTM transforms,
 * and SVG getPointAtLength discretization) in headless Chromium via Remotion bundler and CDP.
 *
 * Evaluates 5 Physical Invariants:
 * 1. TEXT_COLLISION: Overlap width > 2px and height > 2px between two distinct readable text elements.
 * 2. CONTAINER_OVERFLOW & CONTAINER_PADDING_DEFICIT:
 *    - Text protruding outside container (> 2px).
 *    - Horizontal or vertical padding < 30px (padLeft, padRight, padTop, padBottom).
 * 3. UNSHIELDED_VECTOR_PIERCE: Vector line or curved path segment intersects text bounding box
 *    without an opaque shield (OpaqueCard) rendered in front of the vector.
 * 4. SUBTITLE_INTRUSION: Non-subtitle stage element bottom edge > 1420px (exceeding stage ceiling).
 * 5. VIEWPORT_OVERFLOW: Stage elements overflowing [36, 1044]px horizontally or encroaching y < 80px (unless declared HUD).
 *
 * Usage:
 *   npx tsx validators/validate-runtime-geometry.ts [project-path] [options]
 *   npx tsx validators/validate-runtime-geometry.ts --project=<path> [options]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { performance } from 'node:perf_hooks';
import { bundle } from '@remotion/bundler';
import { openBrowser, selectComposition, getCompositions, RenderInternals } from '@remotion/renderer';
import { NoReactInternals } from 'remotion/no-react';
import {
  BoxRect,
  Point,
  DOMTextElement,
  DOMCardElement,
  DOMVectorElement,
  DOMFrameSnapshot,
  RuntimeGeometryViolation,
  RuntimeGeometryResult,
  getBoxOverlap,
  segmentIntersectsBox,
} from './geometry-types';

export interface CardElement extends DOMCardElement {
  isHud?: boolean;
}

export interface CliOptions {
  projectDir?: string;
  compositionId?: string;
  entryPoint?: string;
  framesMode: 'beats' | 'all';
  stride?: number;
  verbose: boolean;
  json: boolean;
}

/**
 * Parses CLI arguments.
 */
export function parseCliArgs(args: string[] = process.argv.slice(2)): CliOptions {
  let projectDir: string | undefined;
  let compositionId: string | undefined;
  let entryPoint: string | undefined;
  let framesMode: 'beats' | 'all' = 'beats';
  let stride: number | undefined;
  let verbose = false;
  let json = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      console.log(`
Headless DOM Runtime Geometry Gate (Layer 2 Gate G04D)

Usage:
  npx tsx validators/validate-runtime-geometry.ts [project-path] [options]
  npx tsx validators/validate-runtime-geometry.ts --project=<path> [options]

Options:
  --project=<path>       Path to project directory (e.g. connection-film/src/projects/scopus-research-gap)
  --entry=<path>         Path to Remotion root entrypoint (default: connection-film/src/index.ts)
  --composition=<id>     Remotion composition ID (auto-detected if omitted)
  --frames=<mode>        Sampling mode: "beats" (3 keyframes per beat) or "all" [default: beats]
  --stride=<number>      Frame step interval when --frames=all [default: 10]
  --verbose, -v          Show per-frame bounding box extraction details
  --json                 Output machine-readable JSON report to stdout
  --help, -h             Show this help message
`);
      process.exit(0);
    } else if (arg.startsWith('--project=')) {
      projectDir = arg.split('=')[1];
    } else if (arg === '--project' && args[i + 1]) {
      projectDir = args[++i];
    } else if (arg.startsWith('--entry=')) {
      entryPoint = arg.split('=')[1];
    } else if (arg === '--entry' && args[i + 1]) {
      entryPoint = args[++i];
    } else if (arg.startsWith('--composition=')) {
      compositionId = arg.split('=')[1];
    } else if (arg === '--composition' && args[i + 1]) {
      compositionId = args[++i];
    } else if (arg.startsWith('--frames=')) {
      const mode = arg.split('=')[1];
      if (mode === 'all' || mode === 'beats') {
        framesMode = mode;
      }
    } else if (arg.startsWith('--stride=')) {
      const s = parseInt(arg.split('=')[1], 10);
      if (!isNaN(s) && s > 0) stride = s;
    } else if (arg === '--stride' && args[i + 1]) {
      const s = parseInt(args[++i], 10);
      if (!isNaN(s) && s > 0) stride = s;
    } else if (arg === '--verbose' || arg === '-v') {
      verbose = true;
    } else if (arg === '--json') {
      json = true;
    } else if (!arg.startsWith('-') && !projectDir) {
      projectDir = arg;
    }
  }

  // Auto-discover project if omitted
  if (!projectDir) {
    const projectsBase = path.resolve(process.cwd(), 'connection-film/src/projects');
    if (fs.existsSync(projectsBase)) {
      const entries = fs
        .readdirSync(projectsBase, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
      if (entries.length === 1) {
        projectDir = path.join('connection-film/src/projects', entries[0]);
      } else if (entries.length > 1) {
        throw new Error(
          `Multiple projects found in ${projectsBase}: [${entries.join(', ')}]. Please specify --project=<path> (e.g. --project=connection-film/src/projects/${entries[0]})`
        );
      } else {
        throw new Error(`No project directories found in ${projectsBase}. Please specify --project=<path>`);
      }
    }
  }

  if (!projectDir) {
    throw new Error('Project path is required. Usage: npx tsx validators/validate-runtime-geometry.ts --project=<path>');
  }

  return { projectDir, compositionId, entryPoint, framesMode, stride, verbose, json };
}

/**
 * Resolves composition ID from available compositions in bundle.
 */
function resolveCompositionId(comps: { id: string }[], projectDir: string, requestedId?: string): string {
  if (requestedId) {
    const found = comps.find((c) => c.id === requestedId);
    if (found) return found.id;
    throw new Error(
      `Requested composition "${requestedId}" not found in available compositions: ${comps.map((c) => c.id).join(', ')}`
    );
  }

  const baseName = path.basename(path.resolve(projectDir)).toLowerCase().replace(/[^a-z0-9]/g, '');
  const candidates = comps.filter((c) => {
    const cleanId = c.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanId.includes(baseName);
  });

  if (candidates.length === 1) {
    return candidates[0].id;
  }
  if (candidates.length > 1) {
    const nonLegacy = candidates.filter((c) => !c.id.toLowerCase().includes('legacy'));
    const tiktok = (nonLegacy.length > 0 ? nonLegacy : candidates).find((c) => c.id.includes('TikTok916'));
    if (tiktok) return tiktok.id;
    return (nonLegacy[0] || candidates[0]).id;
  }

  throw new Error(
    `Could not determine composition ID for project "${projectDir}". Available compositions: ${comps.map((c) => c.id).join(', ')}`
  );
}

/**
 * Executes in-browser evaluation to extract all live rendered DOM bounding boxes.
 * Written as raw JavaScript string to prevent tsx/esbuild __name helper injection.
 */
export const IN_BROWSER_EXTRACT_SCRIPT = `(() => {
  function getEffectiveOpacity(el) {
    let curr = el;
    let opacity = 1.0;
    while (curr && curr !== document.body && curr !== document.documentElement) {
      const style = window.getComputedStyle(curr);
      if (style.display === 'none' || style.visibility === 'hidden') return 0;
      const op = parseFloat(style.opacity || '1');
      if (isNaN(op)) return 0;
      opacity *= op;
      curr = curr.parentElement;
    }
    return opacity;
  }

  function getZIndex(el) {
    let curr = el;
    while (curr && curr !== document.body && curr !== document.documentElement) {
      const z = window.getComputedStyle(curr).zIndex;
      if (z && z !== 'auto') {
        const val = parseInt(z, 10);
        if (!isNaN(val)) return val;
      }
      curr = curr.parentElement;
    }
    return 0;
  }

  function checkIsSubtitle(el) {
    let curr = el;
    while (curr && curr !== document.body && curr !== document.documentElement) {
      // 1. Semantic attributes
      if (curr.hasAttribute('data-role')) {
        const role = (curr.getAttribute('data-role') || '').toLowerCase();
        if (role === 'subtitle' || role === 'karaoke' || role === 'caption') {
          return true;
        }
      }
      if (curr.hasAttribute('data-component')) {
        const comp = curr.getAttribute('data-component') || '';
        if (
          comp === 'KaraokeCaptions' ||
          comp === 'KaraokeGroup' ||
          comp === 'KaraokeLine' ||
          comp === 'KaraokeWord'
        ) {
          return true;
        }
      }
      // 2. Semantic classes
      if (curr.className && typeof curr.className === 'string') {
        const c = curr.className.toLowerCase();
        if (
          c.includes('subtitle') ||
          c.includes('karaoke') ||
          c.includes('caption') ||
          c.includes('caption-word') ||
          c.includes('caption-line')
        ) {
          return true;
        }
      }
      // 3. React Fiber inspection for component hierarchy (<KaraokeCaptions>, etc.)
      for (const key in curr) {
        if (key.startsWith('__reactFiber$')) {
          let fiber = curr[key];
          while (fiber) {
            const name = fiber.type?.displayName || fiber.type?.name || '';
            if (
              name === 'KaraokeCaptions' ||
              name === 'KaraokeGroup' ||
              name === 'KaraokeLine' ||
              name === 'KaraokeWord' ||
              name.toLowerCase().includes('karaoke') ||
              name.toLowerCase().includes('caption')
            ) {
              return true;
            }
            fiber = fiber.return;
          }
        }
      }
      curr = curr.parentElement;
    }
    return false;
  }

  function checkIsHud(el) {
    let curr = el;
    while (curr && curr !== document.body && curr !== document.documentElement) {
      const tag = curr.tagName.toLowerCase();
      if (tag === 'header' || tag === 'nav') {
        return true;
      }
      if (curr.hasAttribute('data-role')) {
        const role = (curr.getAttribute('data-role') || '').toLowerCase();
        if (role === 'hud' || role === 'header-banner') {
          return true;
        }
      }
      if (curr.hasAttribute('data-hud') && curr.getAttribute('data-hud') === 'true') {
        return true;
      }
      if (curr.className && typeof curr.className === 'string') {
        const c = curr.className.toLowerCase();
        if (c.includes('hud') || c.includes('header-banner') || c.includes('top-bar')) {
          return true;
        }
      }
      curr = curr.parentElement;
    }
    return false;
  }

  const allElements = Array.from(document.querySelectorAll('*'));
  const texts = [];
  const cards = [];
  const vectors = [];
  const stageElements = [];

  let elemCounter = 0;

  for (let domIdx = 0; domIdx < allElements.length; domIdx++) {
    const el = allElements[domIdx];
    const tag = el.tagName.toLowerCase();
    const effOpacity = getEffectiveOpacity(el);
    if (effOpacity < 0.05) continue;

    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;

    const rect = {
      x: Math.round(r.x * 10) / 10,
      y: Math.round(r.y * 10) / 10,
      width: Math.round(r.width * 10) / 10,
      height: Math.round(r.height * 10) / 10,
    };

    const isSubtitle = checkIsSubtitle(el);
    const isHud = checkIsHud(el);

    const isBackground =
      el.closest('[data-role="background"]') !== null ||
      el.closest('[data-background="true"]') !== null ||
      (typeof el.className === 'string' && (el.className.toLowerCase().includes('background') || el.className.toLowerCase().includes('bg-'))) !== false ||
      (rect.width >= 1000 && rect.height >= 1600) ||
      (tag === 'rect' && rect.x <= 20 && rect.width >= 1040 && rect.y + rect.height >= 1700);

    // 1. TEXT ELEMENTS
    // Skip tspan directly since parent SVG <text> encompasses entire string and bounding box
    if (tag === 'tspan') continue;

    let hasDirectText = false;
    let rawText = '';
    if (tag === 'text') {
      hasDirectText = true;
      rawText = el.textContent || '';
    } else {
      // For HTML, avoid extracting an ancestor if it has child elements that contain text
      let hasChildElementWithText = false;
      for (const child of el.children) {
        if (child.textContent && child.textContent.trim().length > 0) {
          hasChildElementWithText = true;
          break;
        }
      }
      if (!hasChildElementWithText) {
        for (const node of Array.from(el.childNodes)) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim().length > 0) {
            hasDirectText = true;
            rawText += node.textContent.trim() + ' ';
          }
        }
      }
    }

    if (hasDirectText && rawText.trim().length > 0) {
      const fontSize = parseFloat(window.getComputedStyle(el).fontSize || '0');
      texts.push({
        id: 'txt_' + (++elemCounter),
        tag,
        text: rawText.trim(),
        rect,
        effectiveOpacity: effOpacity,
        fontSize,
        isSubtitle,
        isHud,
      });
    }

    // 2. CARD / CONTAINER ELEMENTS
    const isDeclaredCard =
      tag !== 'text' &&
      tag !== 'tspan' &&
      (el.hasAttribute('data-card') ||
        el.hasAttribute('data-badge') ||
        el.getAttribute('data-role') === 'card' ||
        el.getAttribute('data-role') === 'shield' ||
        el.getAttribute('data-role') === 'opaque-card' ||
        el.getAttribute('data-role') === 'pill' ||
        el.getAttribute('data-role') === 'autopill' ||
        (typeof el.className === 'string' && (
          el.className.includes('auto-pill') ||
          el.className.includes('opaque-card') ||
          el.className.includes('card-') ||
          el.className.includes('badge') ||
          el.className.includes('pill')
        )));

    const isStageZone = el.closest('.safe-stage-zone') === el || el.hasAttribute('data-stage-zone');
    const isSvgCardRect = tag === 'rect' && rect.width >= 20 && rect.width <= 1040 && rect.height >= 15 && rect.height <= 1600 && !isStageZone;
    const isHtmlCardBox =
      (tag === 'div' || tag === 'section' || tag === 'article') &&
      rect.width >= 20 &&
      rect.width <= 1040 &&
      rect.height >= 15 &&
      rect.height <= 1600 &&
      !isStageZone;

    if ((isDeclaredCard || isSvgCardRect || isHtmlCardBox) && !isBackground) {
      const compStyle = window.getComputedStyle(el);
      const isSvg = tag === 'rect' || el instanceof SVGElement;
      const bg = isSvg
        ? (el.getAttribute('fill') || compStyle.fill || '')
        : (compStyle.backgroundColor || '');
      const hasVisualBg = bg && bg !== 'transparent' && bg !== 'none' && !bg.includes('rgba(0, 0, 0, 0)');
      const hasBorder = compStyle.borderWidth && parseFloat(compStyle.borderWidth) > 0 && compStyle.borderStyle !== 'none';
      const isVisualContainer = isDeclaredCard || isSvgCardRect || (isHtmlCardBox && (hasVisualBg || hasBorder));

      if (isVisualContainer) {
        const isOpaque = effOpacity >= 0.95 && hasVisualBg;
        cards.push({
          id: 'card_' + (++elemCounter),
          tag,
          rect,
          backgroundColor: bg,
          effectiveOpacity: effOpacity,
          isOpaque,
          isHud,
          zIndex: getZIndex(el),
          domIndex: domIdx,
        });
      }
    }

    // 3. VECTOR ELEMENTS (<line> AND <path>)
    if (tag === 'line') {
      const lineEl = el;
      const svg = lineEl.ownerSVGElement;
      const ctm = lineEl.getScreenCTM();
      if (svg && ctm) {
        const pt1 = svg.createSVGPoint();
        pt1.x = lineEl.x1.baseVal.value;
        pt1.y = lineEl.y1.baseVal.value;
        const p1Screen = pt1.matrixTransform(ctm);

        const pt2 = svg.createSVGPoint();
        pt2.x = lineEl.x2.baseVal.value;
        pt2.y = lineEl.y2.baseVal.value;
        const p2Screen = pt2.matrixTransform(ctm);

        const strokeW = parseFloat(window.getComputedStyle(el).strokeWidth || '2');
        vectors.push({
          id: 'vec_line_' + (++elemCounter),
          type: 'line',
          p1: { x: Math.round(p1Screen.x * 10) / 10, y: Math.round(p1Screen.y * 10) / 10 },
          p2: { x: Math.round(p2Screen.x * 10) / 10, y: Math.round(p2Screen.y * 10) / 10 },
          strokeWidth: strokeW,
          rect,
          domIndex: domIdx,
          zIndex: getZIndex(el),
        });
      }
    } else if (tag === 'path') {
      const pathEl = el;
      const svg = pathEl.ownerSVGElement;
      const ctm = pathEl.getScreenCTM();
      if (svg && ctm && !isBackground) {
        const compStyle = window.getComputedStyle(pathEl);
        const stroke = pathEl.getAttribute('stroke') || compStyle.stroke;
        const strokeW = parseFloat(pathEl.getAttribute('stroke-width') || compStyle.strokeWidth || '0');
        const fill = pathEl.getAttribute('fill') || compStyle.fill;
        const isConnectorOrLine =
          (stroke && stroke !== 'none' && stroke !== 'transparent' && strokeW > 0) ||
          fill === 'none' ||
          pathEl.hasAttribute('data-connector') ||
          pathEl.closest('.auto-clipping-connector') !== null;

        if (isConnectorOrLine) {
          try {
            const totalLength = pathEl.getTotalLength ? pathEl.getTotalLength() : 0;
            if (totalLength > 2 && isFinite(totalLength)) {
              // Discretize path into segments with stride <= 15px
              const numSegments = Math.max(1, Math.ceil(totalLength / 15));
              const stride = totalLength / numSegments;
              const samplePoints = [];
              const pt = svg.createSVGPoint();

              for (let s = 0; s <= totalLength + 0.001; s += stride) {
                const curS = Math.min(s, totalLength);
                const p = pathEl.getPointAtLength(curS);
                pt.x = p.x;
                pt.y = p.y;
                const pScreen = pt.matrixTransform(ctm);
                samplePoints.push({
                  x: Math.round(pScreen.x * 10) / 10,
                  y: Math.round(pScreen.y * 10) / 10,
                });
                if (curS >= totalLength) break;
              }

              const z = getZIndex(pathEl);
              const pathStrokeW = strokeW > 0 ? strokeW : 2;

              for (let k = 0; k < samplePoints.length - 1; k++) {
                const p1 = samplePoints[k];
                const p2 = samplePoints[k + 1];
                if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < 0.5) continue;

                vectors.push({
                  id: 'vec_path_' + (++elemCounter) + '_' + k,
                  type: 'path',
                  p1,
                  p2,
                  strokeWidth: pathStrokeW,
                  rect: {
                    x: Math.min(p1.x, p2.x),
                    y: Math.min(p1.y, p2.y),
                    width: Math.abs(p2.x - p1.x),
                    height: Math.abs(p2.y - p1.y),
                  },
                  domIndex: domIdx,
                  zIndex: z,
                });
              }
            }
          } catch (e) {
            // Path might fail getTotalLength if unmounted or zero-dimensional
          }
        }
      }
    }

    // 4. STAGE ELEMENTS (For Subtitle Intrusion & Viewport Overflow)
    if (
      !isBackground &&
      tag !== 'svg' &&
      tag !== 'g' &&
      tag !== 'html' &&
      tag !== 'body' &&
      !(tag === 'div' && (rect.width >= 1000 || rect.height >= 1600))
    ) {
      stageElements.push({
        tag,
        text: rawText.trim() ? rawText.trim().slice(0, 30) : undefined,
        rect,
        isSubtitle,
        isHud,
      });
    }
  }

  return { texts, cards, vectors, stageElements };
})()`;

/**
 * Evaluates the 5 Physical Invariants on a frame snapshot.
 */
export function evaluateFrameInvariants(snapshot: DOMFrameSnapshot): RuntimeGeometryViolation[] {
  const violations: RuntimeGeometryViolation[] = [];
  const { frame, beatId, texts, cards, vectors, stageElements } = snapshot;

  // Filter stage texts (non-subtitles with non-empty text)
  const stageTexts = texts.filter((t) => !t.isSubtitle && t.effectiveOpacity >= 0.1 && t.text.length > 0);

  // -------------------------------------------------------------------------
  // INVARIANT 1: TEXT-ON-TEXT COLLISION (AABB1 ∩ AABB2 ≠ ∅)
  // -------------------------------------------------------------------------
  for (let i = 0; i < stageTexts.length; i++) {
    for (let j = i + 1; j < stageTexts.length; j++) {
      const t1 = stageTexts[i];
      const t2 = stageTexts[j];

      const { overlapX, overlapY, intersects } = getBoxOverlap(t1.rect, t2.rect);
      if (intersects && overlapX > 2.0 && overlapY > 2.0) {
        violations.push({
          beatId,
          frame,
          invariant: 'TEXT_COLLISION',
          severity: 'CRITICAL',
          message: `Text collision: "${t1.text.slice(0, 25)}" collides with "${t2.text.slice(0, 25)}" (overlap: ${overlapX.toFixed(1)}x${overlapY.toFixed(1)}px).`,
          offendingElements: [t1.text, t2.text],
          coordinates: { t1: t1.rect, t2: t2.rect, overlap: { width: overlapX, height: overlapY } },
          shortfallPx: Math.min(overlapX, overlapY),
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // INVARIANT 2: CONTAINER OVERFLOW & CONTAINER PADDING DEFICIT (padding >= 30px)
  // -------------------------------------------------------------------------
  for (const card of cards) {
    // Find all text elements positioned inside this card
    const containedTexts = stageTexts.filter((t) => {
      const centerX = t.rect.x + t.rect.width / 2;
      const centerY = t.rect.y + t.rect.height / 2;
      return (
        centerX >= card.rect.x &&
        centerX <= card.rect.x + card.rect.width &&
        centerY >= card.rect.y &&
        centerY <= card.rect.y + card.rect.height
      );
    });

    if (containedTexts.length === 0) continue;

    // Check protrusion for each contained text
    for (const t of containedTexts) {
      const overflowLeft = card.rect.x - t.rect.x;
      const overflowRight = t.rect.x + t.rect.width - (card.rect.x + card.rect.width);
      const overflowTop = card.rect.y - t.rect.y;
      const overflowBottom = t.rect.y + t.rect.height - (card.rect.y + card.rect.height);
      const maxOverflow = Math.max(overflowLeft, overflowRight, overflowTop, overflowBottom);

      if (maxOverflow > 2.0) {
        violations.push({
          beatId,
          frame,
          invariant: 'CONTAINER_OVERFLOW',
          severity: 'CRITICAL',
          message: `Container overflow: text "${t.text.slice(0, 25)}" protrudes outside card by ${maxOverflow.toFixed(1)}px.`,
          offendingElements: [t.text, card.tag],
          coordinates: { text: t.rect, card: card.rect, overflow: maxOverflow },
          shortfallPx: maxOverflow,
        });
      }
    }

    // Check padding deficit for text block (strictly >= 30px horizontally and vertically)
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const t of containedTexts) {
      minX = Math.min(minX, t.rect.x);
      maxX = Math.max(maxX, t.rect.x + t.rect.width);
      minY = Math.min(minY, t.rect.y);
      maxY = Math.max(maxY, t.rect.y + t.rect.height);
    }

    const padLeft = minX - card.rect.x;
    const padRight = card.rect.x + card.rect.width - maxX;
    const padTop = minY - card.rect.y;
    const padBottom = card.rect.y + card.rect.height - maxY;

    const minHorizontalPad = Math.min(padLeft, padRight);
    const minVerticalPad = Math.min(padTop, padBottom);

    const requiredPad = 30.0;

    if (minHorizontalPad < requiredPad - 2.0) {
      const shortfall = requiredPad - minHorizontalPad;
      violations.push({
        beatId,
        frame,
        invariant: 'CONTAINER_PADDING_DEFICIT',
        severity: 'CRITICAL',
        message: `Container horizontal padding deficit: card has only ${minHorizontalPad.toFixed(1)}px horizontal margin (left: ${padLeft.toFixed(1)}px, right: ${padRight.toFixed(1)}px, required: >= ${requiredPad}px).`,
        offendingElements: [containedTexts[0].text, card.tag],
        coordinates: { card: card.rect, contentBounds: { minX, maxX, minY, maxY }, padLeft, padRight, padTop, padBottom, minHorizontalPad },
        shortfallPx: shortfall,
      });
    }

    if (minVerticalPad < requiredPad - 2.0) {
      const shortfall = requiredPad - minVerticalPad;
      violations.push({
        beatId,
        frame,
        invariant: 'CONTAINER_PADDING_DEFICIT',
        severity: 'CRITICAL',
        message: `Container vertical padding deficit: card has only ${minVerticalPad.toFixed(1)}px vertical margin (top: ${padTop.toFixed(1)}px, bottom: ${padBottom.toFixed(1)}px, required: >= ${requiredPad}px).`,
        offendingElements: [containedTexts[0].text, card.tag],
        coordinates: { card: card.rect, contentBounds: { minX, maxX, minY, maxY }, padLeft, padRight, padTop, padBottom, minVerticalPad },
        shortfallPx: shortfall,
      });
    }
  }

  // -------------------------------------------------------------------------
  // INVARIANT 3: UNSHIELDED VECTOR PIERCE
  // -------------------------------------------------------------------------
  for (const vec of vectors) {
    for (const t of stageTexts) {
      if (segmentIntersectsBox(vec.p1, vec.p2, t.rect)) {
        // Check if t is shielded by an opaque card behind it (card rendered in front of vector)
        const shield = cards.find(
          (c) =>
            c.isOpaque &&
            c.rect.x <= t.rect.x + 2 &&
            c.rect.x + c.rect.width >= t.rect.x + t.rect.width - 2 &&
            c.rect.y <= t.rect.y + 2 &&
            c.rect.y + c.rect.height >= t.rect.y + t.rect.height - 2 &&
            (c.zIndex > vec.zIndex || (c.zIndex === vec.zIndex && c.domIndex > vec.domIndex))
        );

        if (!shield) {
          violations.push({
            beatId,
            frame,
            invariant: 'UNSHIELDED_VECTOR_PIERCE',
            severity: 'CRITICAL',
            message: `Unshielded vector pierce: ${vec.type} segment [(${vec.p1.x}, ${vec.p1.y}) -> (${vec.p2.x}, ${vec.p2.y})] penetrates text "${t.text.slice(0, 25)}" without an opaque shield.`,
            offendingElements: [t.text, vec.id],
            coordinates: { vector: { p1: vec.p1, p2: vec.p2, type: vec.type }, text: t.rect },
          });
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // INVARIANT 4: SUBTITLE BOUNDARY INTRUSION (y + height > 1420px)
  // -------------------------------------------------------------------------
  for (const el of stageElements) {
    if (el.isSubtitle) continue;
    const yBottom = el.rect.y + el.rect.height;
    if (yBottom > 1420.0) {
      const shortfall = yBottom - 1420.0;
      violations.push({
        beatId,
        frame,
        invariant: 'SUBTITLE_INTRUSION',
        severity: 'CRITICAL',
        message: `Subtitle intrusion: stage element <${el.tag}> ${el.text ? `("${el.text}")` : ''} bottom (${yBottom.toFixed(1)}px) exceeds safe ceiling 1420px.`,
        offendingElements: [el.text || el.tag],
        coordinates: { rect: el.rect, yBottom },
        shortfallPx: shortfall,
      });
    }
  }

  // -------------------------------------------------------------------------
  // INVARIANT 5: VIEWPORT BOUNDARY OVERFLOW (x < 36px, x + w > 1044px, y < 80px)
  // -------------------------------------------------------------------------
  for (const t of stageTexts) {
    if (t.rect.x < 36.0) {
      const shortfall = 36.0 - t.rect.x;
      violations.push({
        beatId,
        frame,
        invariant: 'VIEWPORT_OVERFLOW',
        severity: 'CRITICAL',
        message: `Viewport overflow: text "${t.text.slice(0, 25)}" left edge (${t.rect.x.toFixed(1)}px) exceeds safe margin [36, 1044].`,
        offendingElements: [t.text],
        coordinates: { rect: t.rect },
        shortfallPx: shortfall,
      });
    }

    const rightEdge = t.rect.x + t.rect.width;
    if (rightEdge > 1044.0) {
      const shortfall = rightEdge - 1044.0;
      violations.push({
        beatId,
        frame,
        invariant: 'VIEWPORT_OVERFLOW',
        severity: 'CRITICAL',
        message: `Viewport overflow: text "${t.text.slice(0, 25)}" right edge (${rightEdge.toFixed(1)}px) exceeds safe margin [36, 1044].`,
        offendingElements: [t.text],
        coordinates: { rect: t.rect },
        shortfallPx: shortfall,
      });
    }

    if (!t.isHud && t.rect.y < 80.0) {
      const shortfall = 80.0 - t.rect.y;
      violations.push({
        beatId,
        frame,
        invariant: 'VIEWPORT_OVERFLOW',
        severity: 'CRITICAL',
        message: `Viewport overflow: text "${t.text.slice(0, 25)}" top edge (${t.rect.y.toFixed(1)}px) encroaches into notch zone (< 80px).`,
        offendingElements: [t.text],
        coordinates: { rect: t.rect },
        shortfallPx: shortfall,
      });
    }
  }

  // Check cards for horizontal viewport safe margins [36, 1044] and notch zone (< 80px)
  for (const c of cards) {
    if (c.rect.width >= 1000) continue; // Skip full-screen wrappers
    if (c.rect.x < 36.0) {
      const shortfall = 36.0 - c.rect.x;
      violations.push({
        beatId,
        frame,
        invariant: 'VIEWPORT_OVERFLOW',
        severity: 'CRITICAL',
        message: `Viewport overflow: card <${c.tag}> left edge (${c.rect.x.toFixed(1)}px) exceeds safe margin [36, 1044].`,
        offendingElements: [c.id],
        coordinates: { rect: c.rect },
        shortfallPx: shortfall,
      });
    }
    const rightEdge = c.rect.x + c.rect.width;
    if (rightEdge > 1044.0) {
      const shortfall = rightEdge - 1044.0;
      violations.push({
        beatId,
        frame,
        invariant: 'VIEWPORT_OVERFLOW',
        severity: 'CRITICAL',
        message: `Viewport overflow: card <${c.tag}> right edge (${rightEdge.toFixed(1)}px) exceeds safe margin [36, 1044].`,
        offendingElements: [c.id],
        coordinates: { rect: c.rect },
        shortfallPx: shortfall,
      });
    }
    const isHudCard = (c as CardElement).isHud ?? false;
    if (!isHudCard && c.rect.y < 80.0) {
      const shortfall = 80.0 - c.rect.y;
      violations.push({
        beatId,
        frame,
        invariant: 'VIEWPORT_OVERFLOW',
        severity: 'CRITICAL',
        message: `Viewport overflow: card <${c.tag}> top edge (${c.rect.y.toFixed(1)}px) encroaches into notch zone (< 80px).`,
        offendingElements: [c.id],
        coordinates: { rect: c.rect },
        shortfallPx: shortfall,
      });
    }
  }

  return violations;
}

/**
 * Main validation executor for Headless DOM Runtime Geometry Gate.
 */
export async function validateRuntimeGeometry(options: CliOptions): Promise<RuntimeGeometryResult> {
  const startTime = performance.now();
  const { projectDir, compositionId: requestedCompId, framesMode, verbose } = options;

  if (!projectDir) {
    throw new Error('projectDir must be specified');
  }

  const fullProjectDir = path.resolve(process.cwd(), projectDir);
  const timelinePath = path.join(fullProjectDir, 'semantic-timeline.json');
  const shotSpecPath = path.join(fullProjectDir, 'shot-spec.json');

  if (!fs.existsSync(timelinePath)) {
    throw new Error(`semantic-timeline.json not found in ${fullProjectDir}`);
  }
  if (!fs.existsSync(shotSpecPath)) {
    throw new Error(`shot-spec.json not found in ${fullProjectDir}`);
  }

  const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
  const beats: any[] = timeline.beats || [];
  if (beats.length === 0) {
    throw new Error(`No beats found in ${timelinePath}`);
  }

  // 1. Bundle composition entrypoint (dynamic via --entry with fallback to connection-film/src/index.ts)
  const entryPoint = path.resolve(process.cwd(), options.entryPoint || 'connection-film/src/index.ts');
  if (!fs.existsSync(entryPoint)) {
    throw new Error(`Remotion entrypoint not found at: ${entryPoint}`);
  }

  if (verbose && !options.json) {
    console.log(`Bundling composition entrypoint: ${entryPoint}...`);
  }
  const bundleLoc = await bundle({ entryPoint });

  // 2. Discover composition ID
  const comps = await getCompositions(bundleLoc);
  const compositionId = resolveCompositionId(comps, projectDir, requestedCompId);

  // 3. Query composition metadata
  const comp = await selectComposition({
    serveUrl: bundleLoc,
    id: compositionId,
  });

  // 4. Start local Webpack server & launch Chromium
  const { server, cleanupServer } = await RenderInternals.makeOrReuseServer(
    undefined,
    {
      webpackConfigOrServeUrl: bundleLoc,
      port: null,
      remotionRoot: RenderInternals.findRemotionRoot(),
      offthreadVideoThreads: 0,
      logLevel: 'info',
      indent: false,
      offthreadVideoCacheSizeInBytes: null,
      binariesDirectory: null,
      forceIPv4: false,
      sampleRate: 48000,
    },
    { onDownload: () => {} }
  );

  const browser = await openBrowser('chrome');
  const page = await browser.newPage({
    context: server.sourceMap,
    logLevel: 'info',
    indent: false,
    pageIndex: 0,
    onBrowserLog: null,
    onLog: RenderInternals.defaultOnLog,
  });

  await page.setViewport({
    width: comp.width,
    height: comp.height,
    deviceScaleFactor: 1,
  });

  // Internal require paths for Remotion renderer
  const rendererDir = path.dirname(
    require.resolve('@remotion/renderer', {
      paths: [process.cwd(), path.join(process.cwd(), 'connection-film')],
    })
  );
  const { seekToFrame } = require(path.join(rendererDir, 'seek-to-frame.js'));
  const { setPropsAndEnv } = require(path.join(rendererDir, 'set-props-and-env.js'));

  const serializedProps = NoReactInternals.serializeJSONWithSpecialTypes({
    indent: undefined,
    staticBase: null,
    data: comp.props || {},
  }).serializedString;

  await setPropsAndEnv({
    serializedInputPropsWithCustomSchema: serializedProps,
    envVariables: {},
    page,
    serveUrl: server.serveUrl,
    initialFrame: 0,
    timeoutInMilliseconds: 30000,
    proxyPort: server.offthreadPort,
    retriesRemaining: 2,
    audioEnabled: false,
    videoEnabled: true,
    indent: false,
    logLevel: 'info',
    onServeUrlVisited: () => {},
    isMainTab: true,
    mediaCacheSizeInBytes: null,
    initialMemoryAvailable: 1024 * 1024 * 1024,
    darkMode: false,
    sampleRate: 48000,
  });

  await page.evaluate(
    (id: string, props: string, durationInFrames: number, fps: number, height: number, width: number) => {
      // @ts-ignore
      window.remotion_setBundleMode({
        type: 'composition',
        compositionName: id,
        serializedResolvedPropsWithSchema: props,
        compositionDurationInFrames: durationInFrames,
        compositionFps: fps,
        compositionHeight: height,
        compositionWidth: width,
        compositionDefaultCodec: 'h264',
        compositionDefaultOutName: 'out.mp4',
        compositionDefaultVideoImageFormat: 'jpeg',
        compositionDefaultPixelFormat: 'yuv420p',
        compositionDefaultProResProfile: 'standard',
        compositionDefaultSampleRate: 48000,
      });
    },
    comp.id,
    serializedProps,
    comp.durationInFrames,
    comp.fps,
    comp.height,
    comp.width
  );

  // 5. Determine frames to evaluate (3 keyframes per beat: Start, Mid, End)
  const frameTargets: { frame: number; beatId: string }[] = [];
  if (framesMode === 'beats') {
    for (const beat of beats) {
      const duration = beat.endFrame - beat.startFrame + 1;
      const fStart = beat.startFrame + Math.min(5, Math.floor(duration * 0.1));
      const fMid = Math.floor((beat.startFrame + beat.endFrame) / 2);
      const fEnd = Math.max(beat.startFrame, beat.endFrame - Math.min(2, Math.floor(duration * 0.05)));

      const unique = Array.from(new Set([fStart, fMid, fEnd]));
      for (const f of unique) {
        frameTargets.push({ frame: f, beatId: beat.id });
      }
    }
  } else {
    const step = options.stride || 10;
    for (let f = 0; f < comp.durationInFrames; f += step) {
      const matchingBeat = beats.find((b) => f >= b.startFrame && f <= b.endFrame) || beats[0];
      frameTargets.push({ frame: f, beatId: matchingBeat.id });
    }
  }

  // Sort ascending by frame
  frameTargets.sort((a, b) => a.frame - b.frame);

  const allViolations: RuntimeGeometryViolation[] = [];

  try {
    for (const target of frameTargets) {
      const { frame, beatId } = target;
      await seekToFrame({
        frame,
        page,
        composition: comp.id,
        timeoutInMilliseconds: 30000,
        indent: false,
        logLevel: 'info',
        attempt: 0,
      });

      const snapshotData: any = await page.evaluate(IN_BROWSER_EXTRACT_SCRIPT);
      const snapshot: DOMFrameSnapshot = {
        frame,
        beatId,
        texts: snapshotData.texts,
        cards: snapshotData.cards,
        vectors: snapshotData.vectors,
        stageElements: snapshotData.stageElements,
      };

      const violations = evaluateFrameInvariants(snapshot);
      if (violations.length > 0) {
        allViolations.push(...violations);
      }

      if (verbose && !options.json) {
        console.log(
          `  [Frame ${String(frame).padStart(4, ' ')}] Beat: ${beatId.padEnd(20, ' ')} | Texts: ${String(snapshot.texts.length).padStart(2, ' ')} | Cards: ${String(snapshot.cards.length).padStart(2, ' ')} | Vectors: ${String(snapshot.vectors.length).padStart(2, ' ')} | Violations: ${violations.length}`
        );
      }
    }
  } finally {
    await page.close();
    await browser.close({ silent: true });
    await cleanupServer(true);
  }

  const durationMs = performance.now() - startTime;

  return {
    passed: allViolations.length === 0,
    projectDir,
    compositionId,
    totalBeats: beats.length,
    beatsEvaluated: beats.length,
    framesEvaluated: frameTargets.length,
    violations: allViolations,
    durationMs,
  };
}

/**
 * CLI Entrypoint
 */
async function main() {
  const options = parseCliArgs();

  if (!options.json) {
    console.log(`\n==================================================================`);
    console.log(` VALIDATOR: Headless DOM Runtime Geometry Gate (Layer 2 Gate G04D)`);
    console.log(` Project:       ${options.projectDir}`);
    console.log(` Entrypoint:    ${options.entryPoint || 'connection-film/src/index.ts'}`);
    console.log(` Sampling Mode: ${options.framesMode.toUpperCase()} (3 keyframes per beat)`);
    console.log(` Invariants:    Text Collision | Container Overflow & Padding (>=30px) | Vector Pierce | Subtitle (y<=1420) | Viewport [36, 1044]`);
    console.log(`==================================================================\n`);
  }

  try {
    const result = await validateRuntimeGeometry(options);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.passed ? 0 : 1);
    }

    console.log(`\nEvaluated live headless DOM across ${result.framesEvaluated} keyframes (${result.beatsEvaluated} beats) in ${(result.durationMs / 1000).toFixed(2)}s.`);

    if (result.violations.length > 0) {
      console.log(`\n❌ Found ${result.violations.length} runtime geometry violation(s):\n`);

      const displayViolations = result.violations.slice(0, 20);
      for (const v of displayViolations) {
        const tag = v.severity === 'CRITICAL' ? '🔴 [CRITICAL]' : '🟠 [MAJOR]';
        console.log(`${tag} Frame ${v.frame} (${v.beatId}) - ${v.invariant}`);
        console.log(`  ${v.message}`);
        if (v.shortfallPx !== undefined) {
          console.log(`  Shortfall: ${v.shortfallPx.toFixed(1)}px`);
        }
        console.log('');
      }

      if (result.violations.length > 20) {
        console.log(`... and ${result.violations.length - 20} additional violation(s).`);
      }

      process.exit(1);
    }

    console.log(`\n✅ [PASSED] 0 Runtime geometry violations detected! 100% physical invariants satisfied in live DOM.\n`);
    process.exit(0);
  } catch (err: any) {
    if (options.json) {
      console.log(JSON.stringify({ passed: false, error: err.message }, null, 2));
    } else {
      console.error(`\n❌ Headless DOM validation error: ${err.message}`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`Fatal execution error: ${err.message}`);
    process.exit(1);
  });
}
