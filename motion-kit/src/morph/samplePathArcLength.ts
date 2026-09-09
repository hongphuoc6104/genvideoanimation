import { Point2D } from './types';

export interface PathCommand {
  type: string;
  args: number[];
}

/**
 * Tokenizes and parses an SVG path string into structured commands.
 * Throws controlled errors matching `/empty/i` or `/parse|syntax|invalid/i` on malformed input.
 */
export function parseSvgPathCommands(d: string): PathCommand[] {
  if (typeof d !== 'string' || d.trim().length === 0) {
    throw new Error('SVG path string cannot be empty');
  }

  const trimmed = d.trim();

  // Tokenize commands and arguments
  const commandRegex = /([a-df-z])|([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/gi;
  const tokens: string[] = [];
  let match: RegExpExecArray | null;

  let lastIndex = 0;
  while ((match = commandRegex.exec(trimmed)) !== null) {
    const matchedStr = match[0];
    const interText = trimmed.slice(lastIndex, match.index).trim();
    if (interText && !/^[\s,]+$/.test(interText)) {
      throw new Error(`Invalid SVG path syntax: unexpected characters "${interText}"`);
    }
    tokens.push(matchedStr);
    lastIndex = commandRegex.lastIndex;
  }

  const trailing = trimmed.slice(lastIndex).trim();
  if (trailing && !/^[\s,]+$/.test(trailing)) {
    throw new Error(`Invalid SVG path syntax: unexpected characters "${trailing}"`);
  }

  if (tokens.length === 0) {
    throw new Error('Invalid SVG path syntax: no valid commands found');
  }

  const commands: PathCommand[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    if (!/^[a-df-z]$/i.test(token)) {
      throw new Error(`Invalid SVG path syntax: expected command letter at "${token}"`);
    }

    const type = token;
    i++;

    const args: number[] = [];
    while (i < tokens.length && !/^[a-df-z]$/i.test(tokens[i])) {
      const num = Number(tokens[i]);
      if (Number.isNaN(num)) {
        throw new Error(`Invalid SVG path syntax: invalid number token "${tokens[i]}"`);
      }
      args.push(num);
      i++;
    }

    commands.push({ type, args });
  }

  return commands;
}

/**
 * Converts an SVG elliptical arc into equivalent cubic Bezier curve segments (SVG 1.1 Appendix F.6).
 */
function arcToCubicBeziers(
  x0: number,
  y0: number,
  rx: number,
  ry: number,
  xAxisRotation: number,
  largeArcFlag: number,
  sweepFlag: number,
  x1: number,
  y1: number
): Array<{ p0: [number, number]; p1: [number, number]; p2: [number, number]; p3: [number, number] }> {
  const beziers: Array<{ p0: [number, number]; p1: [number, number]; p2: [number, number]; p3: [number, number] }> = [];

  if (rx === 0 || ry === 0 || (x0 === x1 && y0 === y1)) {
    beziers.push({ p0: [x0, y0], p1: [x0, y0], p2: [x1, y1], p3: [x1, y1] });
    return beziers;
  }

  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const phi = (xAxisRotation * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const dx2 = (x0 - x1) / 2.0;
  const dy2 = (y0 - y1) / 2.0;
  const x1p = cosPhi * dx2 + sinPhi * dy2;
  const y1p = -sinPhi * dx2 + cosPhi * dy2;

  let Prx = rx * rx;
  let Pry = ry * ry;
  const Px1 = x1p * x1p;
  const Py1 = y1p * y1p;

  const radiiCheck = Px1 / Prx + Py1 / Pry;
  if (radiiCheck > 1) {
    const scale = Math.sqrt(radiiCheck);
    rx *= scale;
    ry *= scale;
    Prx = rx * rx;
    Pry = ry * ry;
  }

  const sign = largeArcFlag === sweepFlag ? -1 : 1;
  const sq = Math.max(0, (Prx * Pry - Prx * Py1 - Pry * Px1) / (Prx * Py1 + Pry * Px1));
  const coef = sign * Math.sqrt(sq);
  const cxp = coef * ((rx * y1p) / ry);
  const cyp = coef * (-(ry * x1p) / rx);

  const cx = cosPhi * cxp - sinPhi * cyp + (x0 + x1) / 2.0;
  const cy = sinPhi * cxp + cosPhi * cyp + (y0 + y1) / 2.0;

  function vectorAngle(ux: number, uy: number, vx: number, vy: number): number {
    const signVal = ux * vy - uy * vx < 0 ? -1 : 1;
    const dot = ux * vx + uy * vy;
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    return signVal * Math.acos(Math.max(-1, Math.min(1, dot / (len || 1))));
  }

  const theta1 = vectorAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dTheta = vectorAngle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);

  if (!sweepFlag && dTheta > 0) dTheta -= 2 * Math.PI;
  if (sweepFlag && dTheta < 0) dTheta += 2 * Math.PI;

  const segments = Math.max(Math.ceil(Math.abs(dTheta) / (Math.PI / 2)), 1);
  const segDelta = dTheta / segments;

  let curTheta = theta1;
  let curX = x0;
  let curY = y0;

  for (let s = 0; s < segments; s++) {
    const nextTheta = curTheta + segDelta;
    const alpha = (4 / 3) * Math.tan(segDelta / 4);

    const cosT1 = Math.cos(curTheta);
    const sinT1 = Math.sin(curTheta);
    const cosT2 = Math.cos(nextTheta);
    const sinT2 = Math.sin(nextTheta);

    const ex = cx + rx * cosPhi * cosT2 - ry * sinPhi * sinT2;
    const ey = cy + rx * sinPhi * cosT2 + ry * cosPhi * sinT2;

    const dx1 = -rx * cosPhi * sinT1 - ry * sinPhi * cosT1;
    const dy1 = -rx * sinPhi * sinT1 + ry * cosPhi * cosT1;
    const dx2 = -rx * cosPhi * sinT2 - ry * sinPhi * cosT2;
    const dy2 = -rx * sinPhi * sinT2 + ry * cosPhi * cosT2;

    const cp1x = curX + alpha * dx1;
    const cp1y = curY + alpha * dy1;
    const cp2x = ex - alpha * dx2;
    const cp2y = ey - alpha * dy2;

    beziers.push({
      p0: [curX, curY],
      p1: [cp1x, cp1y],
      p2: [cp2x, cp2y],
      p3: [ex, ey],
    });

    curTheta = nextTheta;
    curX = ex;
    curY = ey;
  }

  return beziers;
}

function evaluateCubic(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
): [number, number] {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const a = mt2 * mt;
  const b = 3 * mt2 * t;
  const c = 3 * mt * t2;
  const d = t2 * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ];
}

interface Subpath {
  chords: Array<{ p: [number, number]; cumDist: number }>;
  totalLength: number;
}

/**
 * Resamples an arbitrary SVG path into exactly N equidistant vertices parameterized by arc length.
 *
 * @param d SVG path string
 * @param count Number of vertices to sample (must be >= 3)
 * @returns Array of [x, y] coordinate tuples
 */
export function samplePathArcLength(d: string, count = 64): Point2D[] {
  if (count < 3) {
    throw new RangeError('sampleCount must be at least 3');
  }

  const commands = parseSvgPathCommands(d);
  const subpaths: Subpath[] = [];
  let curSubpath: { chords: Array<{ p: [number, number]; cumDist: number }>; totalLength: number } | null = null;

  let curX = 0;
  let curY = 0;
  let startX = 0;
  let startY = 0;
  let lastCtrlX = 0;
  let lastCtrlY = 0;
  let lastCmd = '';

  function startNewSubpath(x: number, y: number) {
    if (curSubpath && curSubpath.chords.length > 0) {
      subpaths.push(curSubpath);
    }
    curSubpath = {
      chords: [{ p: [x, y], cumDist: 0 }],
      totalLength: 0,
    };
    curX = x;
    curY = y;
    startX = x;
    startY = y;
  }

  function addChord(x: number, y: number) {
    if (!curSubpath) startNewSubpath(x, y);
    const prev = curSubpath!.chords[curSubpath!.chords.length - 1].p;
    const dist = Math.hypot(x - prev[0], y - prev[1]);
    curSubpath!.totalLength += dist;
    curSubpath!.chords.push({ p: [x, y], cumDist: curSubpath!.totalLength });
    curX = x;
    curY = y;
  }

  function addCubicBezier(
    p0: [number, number],
    p1: [number, number],
    p2: [number, number],
    p3: [number, number],
    steps = 32
  ) {
    for (let s = 1; s <= steps; s++) {
      const pt = evaluateCubic(p0, p1, p2, p3, s / steps);
      addChord(pt[0], pt[1]);
    }
  }

  for (const cmd of commands) {
    const { type, args } = cmd;
    const isRel = type === type.toLowerCase();
    const c = type.toUpperCase();

    let aIdx = 0;
    while (aIdx < args.length || (c === 'Z' && aIdx === 0)) {
      if (c === 'M') {
        const x = isRel ? curX + args[aIdx++] : args[aIdx++];
        const y = isRel ? curY + args[aIdx++] : args[aIdx++];
        startNewSubpath(x, y);
        while (aIdx < args.length) {
          const lx = isRel ? curX + args[aIdx++] : args[aIdx++];
          const ly = isRel ? curY + args[aIdx++] : args[aIdx++];
          addChord(lx, ly);
        }
      } else if (c === 'L') {
        const x = isRel ? curX + args[aIdx++] : args[aIdx++];
        const y = isRel ? curY + args[aIdx++] : args[aIdx++];
        addChord(x, y);
      } else if (c === 'H') {
        const x = isRel ? curX + args[aIdx++] : args[aIdx++];
        addChord(x, curY);
      } else if (c === 'V') {
        const y = isRel ? curY + args[aIdx++] : args[aIdx++];
        addChord(curX, y);
      } else if (c === 'C') {
        const x1 = isRel ? curX + args[aIdx++] : args[aIdx++];
        const y1 = isRel ? curY + args[aIdx++] : args[aIdx++];
        const x2 = isRel ? curX + args[aIdx++] : args[aIdx++];
        const y2 = isRel ? curY + args[aIdx++] : args[aIdx++];
        const x = isRel ? curX + args[aIdx++] : args[aIdx++];
        const y = isRel ? curY + args[aIdx++] : args[aIdx++];
        addCubicBezier([curX, curY], [x1, y1], [x2, y2], [x, y]);
        lastCtrlX = x2;
        lastCtrlY = y2;
      } else if (c === 'S') {
        const x2 = isRel ? curX + args[aIdx++] : args[aIdx++];
        const y2 = isRel ? curY + args[aIdx++] : args[aIdx++];
        const x = isRel ? curX + args[aIdx++] : args[aIdx++];
        const y = isRel ? curY + args[aIdx++] : args[aIdx++];
        const x1 = lastCmd === 'C' || lastCmd === 'S' ? 2 * curX - lastCtrlX : curX;
        const y1 = lastCmd === 'C' || lastCmd === 'S' ? 2 * curY - lastCtrlY : curY;
        addCubicBezier([curX, curY], [x1, y1], [x2, y2], [x, y]);
        lastCtrlX = x2;
        lastCtrlY = y2;
      } else if (c === 'Q') {
        const x1 = isRel ? curX + args[aIdx++] : args[aIdx++];
        const y1 = isRel ? curY + args[aIdx++] : args[aIdx++];
        const x = isRel ? curX + args[aIdx++] : args[aIdx++];
        const y = isRel ? curY + args[aIdx++] : args[aIdx++];
        const cp1: [number, number] = [curX + (2 / 3) * (x1 - curX), curY + (2 / 3) * (y1 - curY)];
        const cp2: [number, number] = [x + (2 / 3) * (x1 - x), y + (2 / 3) * (y1 - y)];
        addCubicBezier([curX, curY], cp1, cp2, [x, y]);
        lastCtrlX = x1;
        lastCtrlY = y1;
      } else if (c === 'T') {
        const x = isRel ? curX + args[aIdx++] : args[aIdx++];
        const y = isRel ? curY + args[aIdx++] : args[aIdx++];
        const x1 = lastCmd === 'Q' || lastCmd === 'T' ? 2 * curX - lastCtrlX : curX;
        const y1 = lastCmd === 'Q' || lastCmd === 'T' ? 2 * curY - lastCtrlY : curY;
        const cp1: [number, number] = [curX + (2 / 3) * (x1 - curX), curY + (2 / 3) * (y1 - curY)];
        const cp2: [number, number] = [x + (2 / 3) * (x1 - x), y + (2 / 3) * (y1 - y)];
        addCubicBezier([curX, curY], cp1, cp2, [x, y]);
        lastCtrlX = x1;
        lastCtrlY = y1;
      } else if (c === 'A') {
        const rx = args[aIdx++];
        const ry = args[aIdx++];
        const rot = args[aIdx++];
        const laf = args[aIdx++];
        const sf = args[aIdx++];
        const x = isRel ? curX + args[aIdx++] : args[aIdx++];
        const y = isRel ? curY + args[aIdx++] : args[aIdx++];
        const beziers = arcToCubicBeziers(curX, curY, rx, ry, rot, laf, sf, x, y);
        for (const bez of beziers) {
          addCubicBezier(bez.p0, bez.p1, bez.p2, bez.p3);
        }
      } else if (c === 'Z') {
        addChord(startX, startY);
        break;
      } else {
        throw new Error(`Invalid SVG path syntax: unsupported command "${type}"`);
      }
      lastCmd = c;
    }
  }

  const activeSubpath = curSubpath as Subpath | null;
  if (activeSubpath && activeSubpath.chords.length > 0) {
    subpaths.push(activeSubpath);
  }

  if (subpaths.length === 0) {
    throw new Error('Invalid SVG path syntax: no subpaths found');
  }

  // Choose primary subpath (longest perimeter) to guarantee requested count N
  let primarySubpath = subpaths[0];
  for (const sp of subpaths) {
    if (sp.totalLength > primarySubpath.totalLength) {
      primarySubpath = sp;
    }
  }

  const { chords, totalLength } = primarySubpath;

  // Handle zero-length degenerate path: return N points at start coordinate
  if (totalLength === 0 || chords.length <= 1) {
    const p = chords[0].p;
    return Array.from({ length: count }, () => [p[0], p[1]]);
  }

  // Uniform arc-length sampling
  const resampled: Point2D[] = [];
  const step = totalLength / count;
  let chordIdx = 0;

  for (let i = 0; i < count; i++) {
    const targetDist = i * step;

    while (chordIdx < chords.length - 2 && chords[chordIdx + 1].cumDist < targetDist) {
      chordIdx++;
    }

    const cA = chords[chordIdx];
    const cB = chords[chordIdx + 1];
    const segLen = cB.cumDist - cA.cumDist;
    const t = segLen <= 0 ? 0 : Math.max(0, Math.min(1, (targetDist - cA.cumDist) / segLen));

    resampled.push([
      cA.p[0] + (cB.p[0] - cA.p[0]) * t,
      cA.p[1] + (cB.p[1] - cA.p[1]) * t,
    ]);
  }

  return resampled;
}
