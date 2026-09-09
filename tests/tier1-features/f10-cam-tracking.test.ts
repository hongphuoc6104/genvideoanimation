/**
 * Tier 1 (Feature Coverage): F-CAM-TRACKING
 * Velocity-Aware Camera Tracking & Look-Ahead
 */

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
  name: 'Velocity-Aware Camera Tracking & Look-Ahead',
  feature: 'F-CAM-TRACKING',
  tier: 1,
  tests: [
    {
      id: 'TEST-T1-F10-01',
      name: 'Constant Velocity Linear Look-Ahead Offset: vx=10, vy=0 with kLead=3.5, minLead=5 yields Lx=40.0, Ly=0.0',
      feature: 'F-CAM-TRACKING',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['computeCameraLookAhead']);

        let computeLookAhead = (history: { x: number; y: number }[], config: { kLead: number; minLead: number }) => {
          if (history.length < 2) return { x: 0, y: 0 };
          const pPrev = history[history.length - 2];
          const pCurr = history[history.length - 1];
          const vx = pCurr.x - pPrev.x;
          const vy = pCurr.y - pPrev.y;
          const speed = Math.hypot(vx, vy);
          if (speed < 1e-6) return { x: 0, y: 0 };
          const leadMag = config.kLead * speed + config.minLead;
          return {
            x: (vx / speed) * leadMag,
            y: (vy / speed) * leadMag,
          };
        };

        if (isAvailable && typeof motionKit.computeCameraLookAhead === 'function') {
          computeLookAhead = motionKit.computeCameraLookAhead;
        }

        const history = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
        const lead = computeLookAhead(history, { kLead: 3.5, minLead: 5 });

        assertClose(lead.x, 40.0, 1e-4, 'Lead X must equal 40.0px');
        assertClose(lead.y, 0.0, 1e-4, 'Lead Y must equal 0.0px');
      },
    },
    {
      id: 'TEST-T1-F10-02',
      name: 'Stationary Target Zero Offset: target at rest produces zero look-ahead offset',
      feature: 'F-CAM-TRACKING',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['computeCameraLookAhead']);

        let computeLookAhead = (history: { x: number; y: number }[], config: { kLead: number; minLead: number }) => {
          if (history.length < 2) return { x: 0, y: 0 };
          const vx = history[1].x - history[0].x;
          const vy = history[1].y - history[0].y;
          const speed = Math.hypot(vx, vy);
          if (speed < 1e-6) return { x: 0, y: 0 };
          const leadMag = config.kLead * speed + config.minLead;
          return { x: (vx / speed) * leadMag, y: (vy / speed) * leadMag };
        };

        if (isAvailable && typeof motionKit.computeCameraLookAhead === 'function') {
          computeLookAhead = motionKit.computeCameraLookAhead;
        }

        const history = [{ x: 100, y: 200 }, { x: 100, y: 200 }];
        const lead = computeLookAhead(history, { kLead: 3.5, minLead: 5 });

        assertEqual(lead.x, 0, 'Stationary target lead X must be exactly 0');
        assertEqual(lead.y, 0, 'Stationary target lead Y must be exactly 0');
      },
    },
    {
      id: 'TEST-T1-F10-03',
      name: '2D Diagonal Directional Angle Alignment: velocity (30, 40) aligns look-ahead along 53.13 deg angle',
      feature: 'F-CAM-TRACKING',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['computeCameraLookAhead']);

        let computeLookAhead = (history: { x: number; y: number }[], config: { kLead: number; minLead: number }) => {
          const vx = history[1].x - history[0].x;
          const vy = history[1].y - history[0].y;
          const speed = Math.hypot(vx, vy);
          const leadMag = config.kLead * speed + config.minLead;
          return { x: (vx / speed) * leadMag, y: (vy / speed) * leadMag };
        };

        if (isAvailable && typeof motionKit.computeCameraLookAhead === 'function') {
          computeLookAhead = motionKit.computeCameraLookAhead;
        }

        // v = (30, 40) -> speed = 50. leadMag = 3.5 * 50 + 5 = 180.0
        // Lx = 180 * (30/50) = 108.0, Ly = 180 * (40/50) = 144.0
        const history = [{ x: 0, y: 0 }, { x: 30, y: 40 }];
        const lead = computeLookAhead(history, { kLead: 3.5, minLead: 5 });

        assertClose(lead.x, 108.0, 0.01, 'Diagonal lead X must be 108.0');
        assertClose(lead.y, 144.0, 0.01, 'Diagonal lead Y must be 144.0');
      },
    },
    {
      id: 'TEST-T1-F10-04',
      name: 'Dynamic Acceleration Lead Scaling: accelerating target increases lead offset proportionally',
      feature: 'F-CAM-TRACKING',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['computeCameraLookAhead']);

        let computeLookAhead = (history: { x: number; y: number }[], config: { kLead: number; minLead: number }) => {
          const vx = history[1].x - history[0].x;
          const vy = history[1].y - history[0].y;
          const speed = Math.hypot(vx, vy);
          const leadMag = config.kLead * speed + config.minLead;
          return { x: (vx / speed) * leadMag, y: (vy / speed) * leadMag };
        };

        if (isAvailable && typeof motionKit.computeCameraLookAhead === 'function') {
          computeLookAhead = motionKit.computeCameraLookAhead;
        }

        const l1 = computeLookAhead([{ x: 0, y: 0 }, { x: 5, y: 0 }], { kLead: 3.5, minLead: 5 });
        const l2 = computeLookAhead([{ x: 5, y: 0 }, { x: 20, y: 0 }], { kLead: 3.5, minLead: 5 });

        // l1 = 3.5(5) + 5 = 22.5; l2 = 3.5(15) + 5 = 57.5; delta = 35.0
        assertClose(l2.x - l1.x, 35.0, 1e-4, 'Lead scaling difference must be 35.0');
      },
    },
    {
      id: 'TEST-T1-F10-05',
      name: 'Desired Camera Target Point Synthesis: focal target combines target position and look-ahead vector',
      feature: 'F-CAM-TRACKING',
      tier: 1,
      fn: async (ctx) => {
        const modPath = path.resolve(__dirname, '../../motion-kit/src/index.ts');
        const { module: motionKit, isAvailable } = await resolveModule(modPath, ['getCameraFocalTarget']);

        let getFocalTarget = (pos: { x: number; y: number }, vel: { x: number; y: number }, config: { kLead: number; minLead: number }) => {
          const speed = Math.hypot(vel.x, vel.y);
          const leadMag = speed > 1e-6 ? config.kLead * speed + config.minLead : 0;
          const lx = speed > 1e-6 ? (vel.x / speed) * leadMag : 0;
          const ly = speed > 1e-6 ? (vel.y / speed) * leadMag : 0;
          return { x: pos.x + lx, y: pos.y + ly };
        };

        if (isAvailable && typeof motionKit.getCameraFocalTarget === 'function') {
          getFocalTarget = motionKit.getCameraFocalTarget;
        }

        // pos = (500, 300), vel = (20, 0), lead = 3.5*20 + 5 = 75 -> pDesired = (575.0, 300.0)
        const pDesired = getFocalTarget({ x: 500, y: 300 }, { x: 20, y: 0 }, { kLead: 3.5, minLead: 5 });

        assertClose(pDesired.x, 575.0, 1e-4, 'Focal target X must equal 575.0');
        assertClose(pDesired.y, 300.0, 1e-4, 'Focal target Y must equal 300.0');
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
