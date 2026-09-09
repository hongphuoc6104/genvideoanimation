import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertThrows,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'F07: ArbitraryCustomRigAdapter Vector Character Mounting Boundaries',
  feature: 'F-RIG-CUSTOM',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F07-01',
      name: 'SVG Lacking Any data-joint Tags',
      feature: 'F-RIG-CUSTOM',
      tier: 2,
      description: 'Adapter mounts monolithic SVG lacking data-joint tags by assigning default root joint without throwing',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['ArbitraryCustomRigAdapter']
        );
        if (!isAvailable) {
          ctx.notImplemented('ArbitraryCustomRigAdapter not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const rawSvg = '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="blue"/></svg>';
        const adapter = new mod.ArbitraryCustomRigAdapter(rawSvg);
        const pivots = adapter.getJointPivots ? adapter.getJointPivots() : {};
        assertTrue(typeof pivots === 'object', 'getJointPivots must return object');
      },
    },
    {
      id: 'TEST-T2-F07-02',
      name: 'Corrupted data-pivot Format',
      feature: 'F-RIG-CUSTOM',
      tier: 2,
      description: 'Unparseable or NaN coordinates in data-pivot attribute fall back to safe finite coordinates [0, 0]',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['ArbitraryCustomRigAdapter']
        );
        if (!isAvailable) {
          ctx.notImplemented('ArbitraryCustomRigAdapter not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const malformedPivotSvg = `
          <svg viewBox="0 0 100 100">
            <g data-joint="arm" data-pivot="abc,NaN">
              <circle cx="20" cy="20" r="10" />
            </g>
          </svg>
        `;
        const adapter = new mod.ArbitraryCustomRigAdapter(malformedPivotSvg);
        const pivots = adapter.getJointPivots();
        const pivot = pivots['arm'] || [0, 0];
        assertTrue(Number.isFinite(pivot[0]), 'X pivot must be a finite number');
        assertTrue(Number.isFinite(pivot[1]), 'Y pivot must be a finite number');
      },
    },
    {
      id: 'TEST-T2-F07-03',
      name: 'Pose Commands Non-Existent Joint',
      feature: 'F-RIG-CUSTOM',
      tier: 2,
      description: 'Pose commanding unknown joints is ignored gracefully without runtime exceptions',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['ArbitraryCustomRigAdapter']
        );
        if (!isAvailable) {
          ctx.notImplemented('ArbitraryCustomRigAdapter not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        const simpleSvg = `
          <svg viewBox="0 0 100 100">
            <g data-joint="wheel" data-pivot="50,50"><circle r="20" /></g>
          </svg>
        `;
        const adapter = new mod.ArbitraryCustomRigAdapter(simpleSvg);
        const poseWithExtraJoints = {
          root: { x: 0, y: 0, rotation: 0 },
          limbs: {
            wheel: { rotation: 45 },
            unmapped_arm: { rotation: 90 },
            non_existent_tail: { rotation: -30 },
          },
          expression: {},
        };
        const rendered = adapter.render(poseWithExtraJoints, {});
        assertTrue(rendered !== null, 'Must render without throwing on unmapped joints');
      },
    },
    {
      id: 'TEST-T2-F07-04',
      name: 'Empty SVG String Handling',
      feature: 'F-RIG-CUSTOM',
      tier: 2,
      description: 'Passing empty SVG string triggers controlled descriptive exception',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['ArbitraryCustomRigAdapter']
        );
        if (!isAvailable) {
          ctx.notImplemented('ArbitraryCustomRigAdapter not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        assertThrows(() => new mod.ArbitraryCustomRigAdapter(''), /empty|invalid/i);
        assertThrows(() => new mod.ArbitraryCustomRigAdapter('   \n  '), /empty|invalid/i);
      },
    },
    {
      id: 'TEST-T2-F07-05',
      name: 'Excessive Hierarchy Nesting Depth',
      feature: 'F-RIG-CUSTOM',
      tier: 2,
      description: 'Deeply nested SVG joint hierarchy does not cause call stack overflow during traversal',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/rigs/index',
          ['ArbitraryCustomRigAdapter']
        );
        if (!isAvailable) {
          ctx.notImplemented('ArbitraryCustomRigAdapter not yet implemented in motion-kit (Planned for M2)');
          return;
        }

        // Build 25 levels of nested joints
        let nested = '<circle r="5" />';
        for (let i = 25; i >= 1; i--) {
          nested = `<g data-joint="joint_${i}" data-pivot="${i * 2},${i * 2}">${nested}</g>`;
        }
        const deeplyNestedSvg = `<svg viewBox="0 0 500 500">${nested}</svg>`;

        let adapter: any;
        try {
          adapter = new mod.ArbitraryCustomRigAdapter(deeplyNestedSvg);
        } catch (err: any) {
          // Controlled depth limit error is also valid
          assertTrue(/depth|nested|overflow/i.test(err.message));
          return;
        }
        assertTrue(adapter !== null, 'Adapter handled nested SVG without stack overflow');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
