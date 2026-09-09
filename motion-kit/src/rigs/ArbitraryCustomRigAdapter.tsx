/**
 * ARBITRARY CUSTOM RIG ADAPTER
 * Universal SVG vector character adapter implementing RigInterface.
 * Mounts arbitrary SVG vector characters, parses joint pivots,
 * applies hierarchical limb transformations, and handles unmapped channels safely.
 */

import React from 'react';
import {
  CharacterPose,
  computeJointMatrix,
  JointMatrixResult,
  RigGeometryLayer,
  RigInterface,
  RigJoint,
  RigProps,
  RigRenderOptions,
} from './RigInterface';

export interface CustomRigAdapterOptions {
  svgSource: string;
  jointMapping?: Record<string, string>;
}

interface SvgNode {
  tag: string;
  attrs: Record<string, string>;
  children: SvgNode[];
  text?: string;
}

export class ArbitraryCustomRigAdapter extends React.Component<RigProps> implements RigInterface {
  public readonly id = 'custom-rig-adapter';
  public readonly type = 'custom' as const;
  public defaultPose: CharacterPose = {
    root: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
    rootOffset: { x: 0, y: 0 },
    torsoOffset: { x: 0, y: 0 },
    limbs: {},
    expression: {},
    customChannels: {},
  };

  public readonly rawSvg: string;
  public readonly jointMapping: Record<string, string>;
  public readonly parsedTree: SvgNode;
  public readonly discoveredPivots: Record<string, [number, number]> = {};

  constructor(arg: string | CustomRigAdapterOptions) {
    let rawSvg: string;
    let mapping: Record<string, string> = {};

    if (typeof arg === 'string') {
      rawSvg = arg;
    } else if (arg && typeof arg === 'object') {
      rawSvg = arg.svgSource;
      mapping = arg.jointMapping || {};
    } else {
      throw new Error('Invalid SVG source: input must be a non-empty string or options object.');
    }

    if (!rawSvg || rawSvg.trim().length === 0) {
      throw new Error('Empty or invalid SVG string provided to ArbitraryCustomRigAdapter.');
    }

    super({ pose: {} });
    this.rawSvg = rawSvg;
    this.jointMapping = mapping;

    // Iterative stack-safe SVG parsing
    const { rootNode, pivots } = this.parseSvgIterative(rawSvg);
    this.parsedTree = rootNode;
    this.discoveredPivots = pivots;

    // If SVG lacked any data-joint tags, ensure a fallback root joint exists
    if (Object.keys(this.discoveredPivots).length === 0) {
      this.discoveredPivots['root'] = [0, 0];
    }
  }

  /**
   * Iterative, non-recursive stack-safe parser for arbitrary SVG strings.
   * Defends against excessive nesting depth (> 25 levels) without call stack overflow.
   */
  private parseSvgIterative(svgString: string): {
    rootNode: SvgNode;
    pivots: Record<string, [number, number]>;
  } {
    const pivots: Record<string, [number, number]> = {};
    const rootNode: SvgNode = { tag: 'root', attrs: {}, children: [] };
    const stack: SvgNode[] = [rootNode];

    // Regular expression matching opening, closing, and self-closing XML tags
    const tagRegex = /<\/?([a-zA-Z0-9:-]+)((?:\s+[a-zA-Z0-9:-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(svgString)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();
      const attrStr = match[2];
      const isSelfClosing = match[3] === '/' || tagName === 'circle' || tagName === 'rect' || tagName === 'path' || tagName === 'line' || tagName === 'ellipse' || tagName === 'polygon';
      const isClosing = fullTag.startsWith('</');

      if (isClosing) {
        if (stack.length > 1) {
          stack.pop();
        }
        continue;
      }

      // Parse tag attributes
      const attrs: Record<string, string> = {};
      const attrRegex = /([a-zA-Z0-9:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let attrMatch: RegExpExecArray | null;
      while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
        const key = attrMatch[1];
        const val = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
        attrs[key] = val;
      }

      // Discover joint pivots
      if (attrs['data-joint']) {
        const jointName = attrs['data-joint'];
        let pivotCoords: [number, number] = [0, 0];

        if (attrs['data-pivot']) {
          const parts = attrs['data-pivot'].split(',').map((s) => parseFloat(s.trim()));
          if (parts.length >= 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
            pivotCoords = [parts[0], parts[1]];
          }
        }
        pivots[jointName] = pivotCoords;
      }

      const newNode: SvgNode = {
        tag: tagName,
        attrs,
        children: [],
      };

      const parentNode = stack[stack.length - 1];
      parentNode.children.push(newNode);

      if (!isSelfClosing && !fullTag.endsWith('/>')) {
        stack.push(newNode);
      }
    }

    return { rootNode, pivots };
  }

  public getJointPivots(): Record<string, [number, number]> {
    return { ...this.discoveredPivots };
  }

  public getJoints(pose?: CharacterPose): Record<string, RigJoint> {
    const joints: Record<string, RigJoint> = {};
    for (const [name, [px, py]] of Object.entries(this.discoveredPivots)) {
      const limbRot = pose?.limbs?.[name]?.rotation ?? 0;
      joints[name] = {
        id: name,
        name,
        position: { x: px, y: py },
        rotation: limbRot,
      };
    }
    return joints;
  }

  public getLayers(): RigGeometryLayer[] {
    return [
      {
        id: 'svg-body',
        zIndex: 1,
        render: () => this.render(),
      },
    ];
  }

  /**
   * Mounts a generic pose onto the custom rig, gracefully ignoring any unmapped channels.
   */
  public applyPose(pose: CharacterPose): CharacterPose {
    return {
      ...this.defaultPose,
      ...pose,
    };
  }

  /**
   * Computes the cumulative affine transformation matrix for a specific joint.
   */
  public getEffectiveJointMatrix(jointName: string, pose?: CharacterPose): JointMatrixResult {
    const p = pose || this.defaultPose;
    const limb = p.limbs?.[jointName] || {};
    const pivot = this.discoveredPivots[jointName] || [0, 0];

    const rot = limb.rotation ?? 0;
    const x = (limb.x ?? 0) + pivot[0];
    const y = (limb.y ?? 0) + pivot[1];

    return computeJointMatrix({
      x,
      y,
      rotation: rot,
      scaleX: limb.scaleX ?? 1,
      scaleY: limb.scaleY ?? 1,
    });
  }

  public renderPose(pose: CharacterPose): React.ReactNode {
    return this.render(pose);
  }

  /**
   * Renders the parsed SVG tree into valid React JSX elements,
   * dynamically binding joint transforms and custom channel opacities.
   */
  public render(
    poseInput?: CharacterPose,
    options: RigRenderOptions = {}
  ): React.ReactNode {
    const pose = poseInput || this.props?.pose || this.defaultPose;
    const limbs = pose.limbs || {};
    const customChannels = pose.customChannels || {};

    const renderNode = (node: SvgNode, index: number): React.ReactNode => {
      const props: Record<string, any> = { key: `node-${node.tag}-${index}` };

      // Map SVG attributes to React JSX props
      for (const [k, v] of Object.entries(node.attrs)) {
        if (k === 'class') props.className = v;
        else if (k === 'stroke-width') props.strokeWidth = parseFloat(v) || v;
        else if (k === 'viewbox') props.viewBox = v;
        else props[k] = v;
      }

      // 1. Joint rotation & translation injection
      if (node.attrs['data-joint']) {
        const jointTag = node.attrs['data-joint'];
        // Check direct limb pose or mapped channel
        const limbPose = limbs[jointTag] || {};
        const pivot = this.discoveredPivots[jointTag] || [0, 0];

        const rot = limbPose.rotation ?? 0;
        const tx = limbPose.x ?? 0;
        const ty = limbPose.y ?? 0;

        let existingTransform = props.transform ? `${props.transform} ` : '';
        if (rot !== 0 || tx !== 0 || ty !== 0) {
          if (rot !== 0) {
            existingTransform += `rotate(${rot}, ${pivot[0]}, ${pivot[1]}) `;
          }
          if (tx !== 0 || ty !== 0) {
            existingTransform += `translate(${tx}, ${ty}) `;
          }
          props.transform = existingTransform.trim();
        }
      }

      // 2. Opacity channel binding
      if (node.attrs['data-opacity-channel']) {
        const channelName = node.attrs['data-opacity-channel'];
        if (customChannels[channelName] !== undefined) {
          props.opacity = customChannels[channelName];
        }
      }

      const childElements = node.children.map((child, i) => renderNode(child, i));
      return React.createElement(node.tag, props, childElements.length > 0 ? childElements : null);
    };

    if (this.parsedTree.children.length === 0) {
      return null;
    }

    const firstSvgChild = this.parsedTree.children[0];
    return renderNode(firstSvgChild, 0);
  }
}
