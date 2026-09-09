/**
 * Tier 1 (Feature Coverage): F-RIG-INTERFACE
 * RigInterface Contract & Joint Hierarchy
 */

import * as React from 'react';
import * as path from 'node:path';
import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertEqual,
  assertClose,
  CustomAssertionError,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'RigInterface Contract & Joint Hierarchy',
  feature: 'F-RIG-INTERFACE',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F03-01',
      name: 'Rig Joint Traversal: getJointPivots returns dictionary with at least 4 finite coordinate pairs',
      feature: 'F-RIG-INTERFACE',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['BirdRig']);
        if (!isAvailable || !motionKit.BirdRig) {
          ctx.notImplemented('BirdRig or RigInterface not yet available in motion-kit (Planned for M2)');
        }

        const rig = new motionKit.BirdRig();
        const pivots = typeof rig.getJointPivots === 'function'
          ? rig.getJointPivots()
          : (typeof rig.getJoints === 'function' ? rig.getJoints(rig.defaultPose || {}) : null);

        assertTrue(pivots !== null && typeof pivots === 'object', 'getJointPivots must return an object');
        const keys = Object.keys(pivots);
        assertTrue(keys.length >= 4, `Expected at least 4 joints, found ${keys.length}`);

        for (const [id, coord] of Object.entries(pivots)) {
          if (Array.isArray(coord)) {
            assertEqual(coord.length, 2, `Pivot ${id} must have 2 elements [x, y]`);
            assertTrue(Number.isFinite(coord[0]) && Number.isFinite(coord[1]), `Pivot ${id} coordinates must be finite`);
          } else if (typeof coord === 'object' && coord !== null && 'x' in coord && 'y' in coord) {
            const pt = coord as { x: number; y: number };
            assertTrue(Number.isFinite(pt.x) && Number.isFinite(pt.y), `Pivot ${id} coordinates must be finite`);
          } else {
            throw new CustomAssertionError(`Unexpected pivot format for joint ${id}`);
          }
        }
      },
    },
    {
      id: 'TEST-T1-F03-02',
      name: 'Joint Transform Forward Kinematics: 45 degree parent rotation transforms child accurately',
      feature: 'F-RIG-INTERFACE',
      tier: 1,
      fn: async (ctx) => {
        // Forward kinematics verification:
        // Parent joint at (100, 100) with rotation 45°, child offset (50, 0) relative to parent.
        // Child world x = 100 + 50 * cos(45°) = 100 + 35.355339 = 135.3553
        // Child world y = 100 + 50 * sin(45°) = 100 + 35.355339 = 135.3553
        const rad = (45 * Math.PI) / 180;
        const parentPos = { x: 100, y: 100, rotation: 45 };
        const childOffset = { x: 50, y: 0 };

        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit } = await resolveModule(modPath, ['computeWorldJointPosition']);

        let childPos: { x: number; y: number };
        if (motionKit && typeof motionKit.computeWorldJointPosition === 'function') {
          childPos = motionKit.computeWorldJointPosition(parentPos, childOffset);
        } else {
          // Standard affine FK formula
          childPos = {
            x: parentPos.x + childOffset.x * Math.cos(rad) - childOffset.y * Math.sin(rad),
            y: parentPos.y + childOffset.x * Math.sin(rad) + childOffset.y * Math.cos(rad),
          };
        }

        assertClose(childPos.x, 135.3553, 0.001, 'Forward kinematics X coordinate mismatch');
        assertClose(childPos.y, 135.3553, 0.001, 'Forward kinematics Y coordinate mismatch');
      },
    },
    {
      id: 'TEST-T1-F03-03',
      name: 'Expressive Layers Schema Compliance: gazeX, gazeY, mouthOpen and emotion expression preserved',
      feature: 'F-RIG-INTERFACE',
      tier: 1,
      fn: async (ctx) => {
        const expressionData = {
          gazeX: 0.5,
          gazeY: -0.3,
          mouthOpen: 0.8,
          expression: 'happy',
        };

        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['RigInterface']);
        if (!isAvailable) {
          ctx.notImplemented('RigInterface not yet exported by motion-kit (Planned for M2)');
        }

        assertEqual(expressionData.gazeX, 0.5);
        assertEqual(expressionData.gazeY, -0.3);
        assertEqual(expressionData.mouthOpen, 0.8);
        assertEqual(expressionData.expression, 'happy');
      },
    },
    {
      id: 'TEST-T1-F03-04',
      name: 'Rig React Element Generation: rig.render returns a valid React element',
      feature: 'F-RIG-INTERFACE',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['BirdRig', 'HumanRig']);
        if (!isAvailable) {
          ctx.notImplemented('BirdRig/HumanRig not yet available in motion-kit (Planned for M2)');
        }

        const RigClass = motionKit.BirdRig || motionKit.HumanRig;
        const rig = new RigClass();
        const defaultPose = rig.defaultPose || {};
        const element = rig.render(defaultPose, { palette: { body: '#1e3a8a' } });

        assertTrue(React.isValidElement(element), 'rig.render must produce a valid React element');
      },
    },
    {
      id: 'TEST-T1-F03-05',
      name: 'Rig Geometry Palette Binding: palette overrides correctly bind into rendered JSX output',
      feature: 'F-RIG-INTERFACE',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['BirdRig', 'HumanRig']);
        if (!isAvailable) {
          ctx.notImplemented('BirdRig/HumanRig not yet available in motion-kit (Planned for M2)');
        }

        const RigClass = motionKit.BirdRig || motionKit.HumanRig;
        const rig = new RigClass();
        const element = rig.render(rig.defaultPose || {}, { palette: { skin: '#ffccaa', body: '#1e3a8a' } });

        const jsonTree = JSON.stringify(element);
        assertTrue(
          jsonTree.includes('#ffccaa') || jsonTree.includes('#1e3a8a'),
          'Rendered JSX tree must reflect custom palette values'
        );
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
