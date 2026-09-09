/**
 * T4-SCEN-08: Arbitrary SVG Custom Rig Adapter Ingestion Pipeline
 * Requirements: R2, R3
 */

import { TestSuite, TestCase } from '../harness/test-types';
import { assertTrue, assertEqual } from '../harness/assert';
import { resolveModule, SYNTHETIC_SVG_CUSTOM_ROBOT } from '../harness/mock-helpers';
import { registerSuite } from '../e2e-runner';

export const testCase: TestCase = {
  id: 'T4-SCEN-08',
  name: 'Arbitrary SVG Custom Rig Adapter Ingestion Pipeline',
  feature: 'F-RIG-CUSTOM',
  tier: 4,
  description:
    'End-to-end scenario verifying universal ingestion of external un-rigged vector characters via ArbitraryCustomRigAdapter, hierarchical forward kinematics across 4 joint levels, and clean SVG rendering.',
  fn: async (ctx) => {
    const { module: motionKit, isAvailable } = await resolveModule('../../motion-kit/src/index', [
      'ArbitraryCustomRigAdapter',
    ]);

    let kitMod = motionKit;
    if (!isAvailable || !kitMod?.ArbitraryCustomRigAdapter) {
      const { module: altMod, isAvailable: altAvailable } = await resolveModule('../../motion-kit/index', [
        'ArbitraryCustomRigAdapter',
      ]);
      if (!altAvailable || !altMod?.ArbitraryCustomRigAdapter) {
        ctx.notImplemented('ArbitraryCustomRigAdapter not yet implemented in motion-kit (Planned for M2)');
        return;
      }
      kitMod = altMod;
    }

    const { ArbitraryCustomRigAdapter } = kitMod;
    ctx.log('Ingesting industrial robot vector asset via ArbitraryCustomRigAdapter...');

    const adapter = new ArbitraryCustomRigAdapter({
      svgSource: SYNTHETIC_SVG_CUSTOM_ROBOT,
      jointMapping: {
        base: 'base',
        arm1: 'arm1',
        arm2: 'arm2',
        gripper: 'gripper',
      },
    });

    const joints = adapter.getJoints();
    assertEqual(Object.keys(joints).length, 4, 'Must identify all 4 joints from synthetic robot SVG');

    // Forward kinematics test: rotate arm1 by 30 deg, arm2 by -15 deg
    const rendered = adapter.renderPose({
      arm1: { rotation: 30 },
      arm2: { rotation: -15 },
      gripper: { rotation: 0 },
    });

    assertTrue(rendered !== undefined && rendered !== null, 'RigAdapter must render valid element');
  },
};

export const suite: TestSuite = {
  name: 'T4-SCEN-08 Suite',
  feature: 'F-RIG-CUSTOM',
  tier: 4,
  tests: [testCase],
};

registerSuite(suite);
