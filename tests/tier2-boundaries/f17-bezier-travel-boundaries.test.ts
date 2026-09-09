import { TestSuite, TestCase } from '../harness/test-types';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertClose,
  assertPointClose,
} from '../harness/assert';
import { resolveModule } from '../harness/resolve';

export const testSuite: TestSuite = {
  name: 'F17: Arc-Length LUT Packet Travel & Stroke Reveal Boundaries',
  feature: 'F-BEZIER-TRAVEL',
  tier: 2,
  tests: [
    {
      id: 'TEST-T2-F17-01',
      name: 'Zero-Length Path Packet Travel',
      feature: 'F-BEZIER-TRAVEL',
      tier: 2,
      description: 'Evaluating packet travel on degenerate point curve returns P0 coordinate with speed = 0 and angle = 0',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/bezier/index',
          ['evaluatePacketTravel']
        );
        if (!isAvailable) {
          ctx.notImplemented('evaluatePacketTravel not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const p0 = { x: 40, y: 40 };
        const pkt = mod.evaluatePacketTravel([p0, p0, p0], 0.5);
        assertTrue(pkt !== null && typeof pkt === 'object', 'Must return travel packet');
        assertPointClose(pkt.coordinate, p0, 1e-4, 'Packet coordinate must be P0');
        assertClose(pkt.velocity ?? pkt.speed ?? 0, 0.0, 1e-6, 'Velocity on zero length curve must be 0');
        assertClose(pkt.tangentAngle ?? pkt.angle ?? 0, 0.0, 1e-6, 'Angle on zero length curve must be 0');
      },
    },
    {
      id: 'TEST-T2-F17-02',
      name: 'Negative Progress Travel Clamping',
      feature: 'F-BEZIER-TRAVEL',
      tier: 2,
      description: 'Progress = -0.5 clamps to 0.0, placing packet strictly at start point P0',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/bezier/index',
          ['evaluatePacketTravel']
        );
        if (!isAvailable) {
          ctx.notImplemented('evaluatePacketTravel not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const p0 = { x: 10, y: 10 };
        const p1 = { x: 50, y: 100 };
        const p2 = { x: 90, y: 10 };
        const pkt = mod.evaluatePacketTravel([p0, p1, p2], -0.5);
        assertPointClose(pkt.coordinate, p0, 1e-4, 'Packet with progress < 0 must clamp to P0');
      },
    },
    {
      id: 'TEST-T2-F17-03',
      name: 'Overflow Progress Travel Clamping',
      feature: 'F-BEZIER-TRAVEL',
      tier: 2,
      description: 'Progress = 2.0 clamps to 1.0, placing packet strictly at end point Pend',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/bezier/index',
          ['evaluatePacketTravel']
        );
        if (!isAvailable) {
          ctx.notImplemented('evaluatePacketTravel not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const p0 = { x: 10, y: 10 };
        const p1 = { x: 50, y: 100 };
        const p2 = { x: 90, y: 10 };
        const pkt = mod.evaluatePacketTravel([p0, p1, p2], 2.0);
        assertPointClose(pkt.coordinate, p2, 1e-4, 'Packet with progress > 1 must clamp to Pend');
      },
    },
    {
      id: 'TEST-T2-F17-04',
      name: 'Coarse LUT Sample Density (M = 3)',
      feature: 'F-BEZIER-TRAVEL',
      tier: 2,
      description: 'Minimal LUT density (M = 3) binary search executes cleanly without out-of-bounds error',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/bezier/index',
          ['createBezierLUT', 'evaluatePacketTravel']
        );
        if (!isAvailable) {
          ctx.notImplemented('createBezierLUT / evaluatePacketTravel not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const curve = [{ x: 0, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 0 }];
        const coarseLut = mod.createBezierLUT(curve, 3);
        const pkt = mod.evaluatePacketTravel(curve, 0.5, coarseLut);
        assertTrue(pkt !== null, 'Must evaluate packet travel with coarse LUT');
        assertTrue(Number.isFinite(pkt.coordinate.x ?? pkt.coordinate[0]), 'Coordinate X must be finite');
      },
    },
    {
      id: 'TEST-T2-F17-05',
      name: 'Stroke Reveal with Negative Length or Progress',
      feature: 'F-BEZIER-TRAVEL',
      tier: 2,
      description: 'strokeReveal with negative length or negative progress clamps to 0 with strokeDashoffset >= 0',
      fn: async (ctx) => {
        const { module: mod, isAvailable } = await resolveModule(
          '../../motion-kit/src/bezier/index',
          ['strokeReveal']
        );
        if (!isAvailable) {
          ctx.notImplemented('strokeReveal not yet implemented in motion-kit (Planned for M3)');
          return;
        }

        const reveal = mod.strokeReveal(-100, -0.5);
        assertTrue(reveal !== null && typeof reveal === 'object', 'Must return reveal style');
        const offset = reveal.strokeDashoffset ?? 0;
        assertTrue(offset >= 0, `strokeDashoffset must be >= 0, got ${offset}`);
      },
    },
  ],
};

export const suite = testSuite;
export default testSuite;
