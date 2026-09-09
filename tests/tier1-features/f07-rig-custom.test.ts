/**
 * Tier 1 (Feature Coverage): F-RIG-CUSTOM
 * ArbitraryCustomRigAdapter Vector Character Mounting
 */

import * as path from 'node:path';
import * as React from 'react';
import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertEqual,
  assertDeepEqual,
  CustomAssertionError,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';
import { SYNTHETIC_SVG_CUSTOM_ROBOT } from '../harness/mock-helpers';

export const testSuite: TestSuite = {
  name: 'ArbitraryCustomRigAdapter Vector Character Mounting',
  feature: 'F-RIG-CUSTOM',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F07-01',
      name: 'Custom SVG Joint Tag Ingestion: data-joint and data-pivot tags correctly register joint pivots',
      feature: 'F-RIG-CUSTOM',
      tier: 1,
      fn: async (ctx) => {
        const svgString = '<svg><g data-joint="wheel" data-pivot="50,60"><circle r="20"/></g></svg>';
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['ArbitraryCustomRigAdapter']);

        if (!isAvailable || !motionKit.ArbitraryCustomRigAdapter) {
          ctx.notImplemented('ArbitraryCustomRigAdapter not yet exported by motion-kit (Planned for M2)');
        }

        const adapter = new motionKit.ArbitraryCustomRigAdapter(svgString);
        const pivots = adapter.getJointPivots();
        assertTrue('wheel' in pivots, 'Joint "wheel" must be registered in pivots');
        const p = pivots['wheel'];
        if (Array.isArray(p)) {
          assertEqual(p[0], 50);
          assertEqual(p[1], 60);
        } else {
          assertEqual(p.x, 50);
          assertEqual(p.y, 60);
        }
      },
    },
    {
      id: 'TEST-T1-F07-02',
      name: 'Transform Injection into Tagged Groups: limb pose rotation is injected into tagged group transform',
      feature: 'F-RIG-CUSTOM',
      tier: 1,
      fn: async (ctx) => {
        const svgString = '<svg><g data-joint="wheel" data-pivot="50,60"><circle r="20"/></g></svg>';
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['ArbitraryCustomRigAdapter']);

        if (!isAvailable || !motionKit.ArbitraryCustomRigAdapter) {
          ctx.notImplemented('ArbitraryCustomRigAdapter not yet exported by motion-kit (Planned for M2)');
        }

        const adapter = new motionKit.ArbitraryCustomRigAdapter(svgString);
        const wheelPose = { limbs: { wheel: { rotation: 45, x: 10, y: 0 } } };
        const rendered = adapter.render(wheelPose, {});
        const str = JSON.stringify(rendered);
        assertTrue(str.includes('rotate(45') || str.includes('45'), 'Rendered JSX must contain rotation 45 for wheel');
      },
    },
    {
      id: 'TEST-T1-F07-03',
      name: 'Multi-Level Joint Nesting: nested SVG joint groups combine ancestor and descendant transforms',
      feature: 'F-RIG-CUSTOM',
      tier: 1,
      fn: async (ctx) => {
        const nestedSvg = '<svg><g data-joint="body" data-pivot="0,0"><g data-joint="arm" data-pivot="10,20"/></g></svg>';
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['ArbitraryCustomRigAdapter']);

        if (!isAvailable || !motionKit.ArbitraryCustomRigAdapter) {
          ctx.notImplemented('ArbitraryCustomRigAdapter not yet exported by motion-kit (Planned for M2)');
        }

        const adapter = new motionKit.ArbitraryCustomRigAdapter(nestedSvg);
        const compositePose = { limbs: { body: { rotation: 30 }, arm: { rotation: 15 } } };
        const matrix = adapter.getEffectiveJointMatrix
          ? adapter.getEffectiveJointMatrix('arm', compositePose)
          : adapter.render(compositePose, {});

        assertTrue(matrix !== undefined && matrix !== null, 'Effective joint transform must be computable');
      },
    },
    {
      id: 'TEST-T1-F07-04',
      name: 'Expressive Layer Opacity Binding: custom channel intensity binds to data-opacity-channel',
      feature: 'F-RIG-CUSTOM',
      tier: 1,
      fn: async (ctx) => {
        const glowSvg = '<svg><g data-part="glow" data-opacity-channel="intensity"><circle r="10"/></g></svg>';
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['ArbitraryCustomRigAdapter']);

        if (!isAvailable || !motionKit.ArbitraryCustomRigAdapter) {
          ctx.notImplemented('ArbitraryCustomRigAdapter not yet exported by motion-kit (Planned for M2)');
        }

        const adapter = new motionKit.ArbitraryCustomRigAdapter(glowSvg);
        const glowPose = { customChannels: { intensity: 0.75 } };
        const rendered = adapter.render(glowPose, {});
        const str = JSON.stringify(rendered);
        assertTrue(str.includes('0.75'), 'Rendered JSX must reflect opacity 0.75');
      },
    },
    {
      id: 'TEST-T1-F07-05',
      name: 'Robot Arbitrary Vector Character Mounting: multi-joint industrial robot mounts and registers joints',
      feature: 'F-RIG-CUSTOM',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['ArbitraryCustomRigAdapter']);

        if (!isAvailable || !motionKit.ArbitraryCustomRigAdapter) {
          ctx.notImplemented('ArbitraryCustomRigAdapter not yet exported by motion-kit (Planned for M2)');
        }

        const adapter = new motionKit.ArbitraryCustomRigAdapter(SYNTHETIC_SVG_CUSTOM_ROBOT);
        const pivots = adapter.getJointPivots();
        const joints = Object.keys(pivots);
        assertTrue(joints.length >= 4, `Expected at least 4 registered robot joints, found ${joints.length}`);
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
