/**
 * CHALLENGER EMPIRICAL STRESS TEST SUITE: MILESTONE 2
 * Character Architecture, Kinematics, SVG Parsing, and Action Queue
 */

import React from 'react';
import {
  solveKinematicChain,
  computeWorldJointPosition,
  clampExpressionParams,
  computeJointMatrix,
  BirdRig,
  DEFAULT_BIRD_POSE,
  HumanRig,
  DEFAULT_HUMAN_POSE,
  ArbitraryCustomRigAdapter,
  CharacterController,
  IDLE_CHARACTER_POSE,
  CharacterPose,
} from '../motion-kit/src/rigs';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

function runStress(category: string, name: string, fn: () => void | Promise<void>) {
  try {
    fn();
    results.push({ category, name, passed: true });
    console.log(`  ✓ PASS: [${category}] ${name}`);
  } catch (err: any) {
    results.push({ category, name, passed: false, error: err.message, details: err.stack });
    console.error(`  ✗ FAIL: [${category}] ${name}\n    Error: ${err.message}`);
  }
}

async function runAllStressTests() {
  console.log('================================================================================');
  console.log('       EMPIRICAL CHALLENGER STRESS TESTS - MILESTONE 2 RIGS & CONTROLLER');
  console.log('================================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. CYCLE DETECTION IN solveKinematicChain
  // ---------------------------------------------------------------------------
  console.log('--- SECTION 1: solveKinematicChain Cycle Detection & Topo Sort ---');

  runStress('CycleDetection', 'Self-referential loop (A -> A)', () => {
    const hierarchy = {
      jointA: { id: 'jointA', parent: 'jointA' },
    };
    let threw = false;
    try {
      solveKinematicChain(hierarchy);
    } catch (e: any) {
      threw = true;
      assert(/cyclic joint hierarchy/i.test(e.message), `Expected cyclic error, got: ${e.message}`);
    }
    assert(threw, 'Should throw on self-referential loop');
  });

  runStress('CycleDetection', '4-Node loop with entry tail: A -> B -> C -> D -> B', () => {
    const hierarchy = {
      jointA: { id: 'jointA', parent: 'jointB' },
      jointB: { id: 'jointB', parent: 'jointC' },
      jointC: { id: 'jointC', parent: 'jointD' },
      jointD: { id: 'jointD', parent: 'jointB' }, // cycle B -> C -> D -> B
    };
    let threw = false;
    try {
      solveKinematicChain(hierarchy);
    } catch (e: any) {
      threw = true;
      assert(/cyclic joint hierarchy/i.test(e.message), `Expected cyclic error, got: ${e.message}`);
    }
    assert(threw, 'Should throw on 4-node loop with tail');
  });

  runStress('CycleDetection', 'Deep circular chain (8 nodes: 1->2->3->4->5->6->7->8->1)', () => {
    const hierarchy: Record<string, { id: string; parent?: string }> = {};
    for (let i = 1; i <= 8; i++) {
      const next = i === 8 ? 1 : i + 1;
      hierarchy[`node${i}`] = { id: `node${i}`, parent: `node${next}` };
    }
    let threw = false;
    try {
      solveKinematicChain(hierarchy);
    } catch (e: any) {
      threw = true;
      assert(/cyclic joint hierarchy/i.test(e.message), `Expected cyclic error, got: ${e.message}`);
    }
    assert(threw, 'Should throw on 8-node loop');
  });

  runStress('CycleDetection', 'Cycle in disconnected subgraph alongside valid tree', () => {
    const hierarchy = {
      root1: { id: 'root1' },
      child1: { id: 'child1', parent: 'root1' },
      child2: { id: 'child2', parent: 'child1' },
      // Disconnected cycle
      cycleX: { id: 'cycleX', parent: 'cycleY' },
      cycleY: { id: 'cycleY', parent: 'cycleX' },
    };
    let threw = false;
    try {
      solveKinematicChain(hierarchy);
    } catch (e: any) {
      threw = true;
      assert(/cyclic joint hierarchy/i.test(e.message), `Expected cyclic error, got: ${e.message}`);
    }
    assert(threw, 'Should throw on cycle in disconnected subgraph');
  });

  runStress('CycleDetection', 'Deep acyclic chain (500 nodes) - no call stack overflow', () => {
    const hierarchy: Record<string, { id: string; parent?: string }> = {};
    hierarchy['node0'] = { id: 'node0' };
    for (let i = 1; i <= 500; i++) {
      hierarchy[`node${i}`] = { id: `node${i}`, parent: `node${i - 1}` };
    }
    const order = solveKinematicChain(hierarchy);
    assert(order.length === 501, `Order length should be 501, got ${order.length}`);
    assert(order[0] === 'node0', `First resolved node should be root 'node0', got ${order[0]}`);
    assert(order[500] === 'node500', `Last resolved node should be 'node500', got ${order[500]}`);
  });

  runStress('CycleDetection', 'Dangling parent pointers (parent not in hierarchy dict)', () => {
    const hierarchy = {
      jointA: { id: 'jointA', parent: 'ghostParent' },
      jointB: { id: 'jointB', parent: 'jointA' },
    };
    // Should gracefully process without error
    const order = solveKinematicChain(hierarchy);
    assert(order.length === 2, `Order length should be 2, got ${order.length}`);
    assert(order.indexOf('jointA') < order.indexOf('jointB'), 'jointA should be resolved before jointB');
  });

  runStress('CycleDetection', 'Empty hierarchy and single-node root', () => {
    const emptyOrder = solveKinematicChain({});
    assert(emptyOrder.length === 0, 'Empty hierarchy should produce empty array');

    const singleOrder = solveKinematicChain({ root: { id: 'root' } });
    assert(singleOrder.length === 1 && singleOrder[0] === 'root', 'Single root should resolve cleanly');
  });

  // ---------------------------------------------------------------------------
  // 2. MISSING LIMBS & AMPUTATED JOINT QUERIES (HumanRig & BirdRig)
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 2: Missing Limbs & Amputation Tolerance ---');

  runStress('MissingLimbs', 'BirdRig with empty pose {}', () => {
    const rig = new BirdRig();
    const joints = rig.getJoints({});
    assert(Object.keys(joints).length >= 6, 'Bird joints should still register with defaults');
    const jsx = rig.render({});
    assert(React.isValidElement(jsx), 'BirdRig.render({}) must return valid React element');
  });

  runStress('MissingLimbs', 'BirdRig with completely amputated limbs dict', () => {
    const rig = new BirdRig();
    const pose: CharacterPose = {
      root: { x: 10, y: 20 },
      limbs: {}, // all limbs missing
    };
    const joints = rig.getJoints(pose);
    assert(joints.wingLeft.rotation === 0, 'Missing wingLeft should default rotation to 0');
    assert(joints.tail.rotation === 0, 'Missing tail should default rotation to 0');
    const jsx = rig.render(pose);
    assert(React.isValidElement(jsx), 'BirdRig.render must succeed with amputated limbs');
  });

  runStress('MissingLimbs', 'BirdRig helper methods with null, undefined, extreme inputs', () => {
    const rig = new BirdRig();
    // computeBeakGap
    assert(rig.computeBeakGap(null) === 0, 'computeBeakGap(null) should be 0');
    assert(rig.computeBeakGap(undefined) === 0, 'computeBeakGap(undefined) should be 0');
    assert(rig.computeBeakGap({ mouthOpen: -5 }) === 0, 'computeBeakGap(-5) clamped to 0');
    assert(rig.computeBeakGap({ mouthOpen: 5 }) === 24.0, 'computeBeakGap(5) clamped to 24.0');

    // getPupilOffset
    const pNull = rig.getPupilOffset(null);
    assert(pNull.dx === 0 && pNull.dy === 0, 'getPupilOffset(null) should be (0, 0)');
    const pExt = rig.getPupilOffset({ expression: { gazeX: 99, gazeY: -99 } });
    assert(pExt.dx === 6.0 && pExt.dy === -6.0, 'getPupilOffset clamped to bounds');

    // computeSquashScales with extreme squash
    const zeroSq = rig.computeSquashScales(0);
    assert(Number.isFinite(zeroSq.scaleX) && zeroSq.scaleX <= 5.0, 'scaleX must be finite and <= 5');
    assert(zeroSq.scaleY === 0.04, 'scaleY floored at 0.04');

    const hugeSq = rig.computeSquashScales(1e6);
    assert(Number.isFinite(hugeSq.scaleX) && Number.isFinite(hugeSq.scaleY), 'huge squash produces finite scales');
  });

  runStress('MissingLimbs', 'HumanRig with empty pose {} and amputated limbs', () => {
    const rig = new HumanRig();
    const joints = rig.getJoints({});
    assert(Object.keys(joints).length >= 19, 'Human joints should register >= 19 pivots');
    const jsx = rig.render({});
    assert(React.isValidElement(jsx), 'HumanRig.render({}) must return valid React element');
  });

  runStress('MissingLimbs', 'HumanRig amputation: left arm missing, right arm missing, both legs missing', () => {
    const rig = new HumanRig();
    // One arm amputated
    const poseOneArm: CharacterPose = {
      limbs: {
        shoulderR: { rotation: 10 },
      },
    };
    const jsx1 = rig.render(poseOneArm);
    assert(React.isValidElement(jsx1), 'One arm amputation render valid');

    // Both arms amputated
    const poseNoArms: CharacterPose = {
      limbs: {
        hipL: { rotation: 5 },
        hipR: { rotation: -5 },
      },
    };
    const jsx2 = rig.render(poseNoArms);
    assert(React.isValidElement(jsx2), 'Both arms amputated render valid');

    // Completely limb-free torso
    const poseNoLimbs: CharacterPose = {
      root: { x: 0, y: 0 },
      limbs: {},
    };
    const jsx3 = rig.render(poseNoLimbs);
    assert(React.isValidElement(jsx3), 'Zero limbs render valid');
  });

  runStress('MissingLimbs', 'HumanRig helper boundary clamping & unknown phonemes', () => {
    const rig = new HumanRig();
    // getMouthPath with strange shapes
    assert(rig.getMouthPath('unknown_alien_sound') === 'M 40 80 Q 50 80 60 80', 'Fallback to neutral mouth');
    assert(rig.getMouthPath('') === 'M 40 80 Q 50 80 60 80', 'Empty shape fallback');
    assert(rig.getMouthPath(null as any) === 'M 40 80 Q 50 80 60 80', 'Null shape fallback');

    // clampKneeAngle
    assert(rig.clampKneeAngle(-50) === 0.0, 'Negative knee angle clamped to 0');
    assert(rig.clampKneeAngle(300) === 150.0, 'Overextended knee clamped to 150');

    // clampEyebrowTilt
    assert(rig.clampEyebrowTilt(-90) === -30.0, 'Eyebrow tilt clamped to -30');
    assert(rig.clampEyebrowTilt(90) === 30.0, 'Eyebrow tilt clamped to +30');

    // clampEyeScale
    assert(rig.clampEyeScale(-10) === 0.0, 'Negative eye scale clamped to 0');
    assert(rig.clampEyeScale(2.5) === 2.5, 'Positive eye scale preserved');
  });

  // ---------------------------------------------------------------------------
  // 3. SVG PARSING RESILIENCE IN ArbitraryCustomRigAdapter
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 3: ArbitraryCustomRigAdapter SVG Parsing Resilience ---');

  runStress('SvgResilience', 'Deeply nested tags (>35 levels of <g>)', () => {
    let svg = '<svg viewBox="0 0 500 500">';
    const depth = 45;
    for (let i = 0; i < depth; i++) {
      svg += `<g id="level_${i}" data-joint="joint_${i}" data-pivot="${i * 2},${i * 3}">`;
    }
    svg += '<circle cx="250" cy="250" r="20" fill="red" />';
    for (let i = 0; i < depth; i++) {
      svg += '</g>';
    }
    svg += '</svg>';

    const adapter = new ArbitraryCustomRigAdapter(svg);
    const pivots = adapter.getJointPivots();
    assert(Object.keys(pivots).length === depth, `Should parse ${depth} joints from deep tree`);
    assert(pivots['joint_0'][0] === 0 && pivots['joint_0'][1] === 0, 'joint_0 pivot matches');
    assert(pivots[`joint_${depth - 1}`][0] === (depth - 1) * 2, 'deepest joint pivot matches');

    const rendered = adapter.render();
    assert(React.isValidElement(rendered), 'Deep tree renders valid React element');
  });

  runStress('SvgResilience', 'Extreme nesting depth (150 levels of <g>)', () => {
    let svg = '<svg viewBox="0 0 100 100">';
    const depth = 150;
    for (let i = 0; i < depth; i++) {
      svg += `<g id="d_${i}">`;
    }
    svg += '<rect width="10" height="10" />';
    for (let i = 0; i < depth; i++) {
      svg += '</g>';
    }
    svg += '</svg>';

    const adapter = new ArbitraryCustomRigAdapter(svg);
    const rendered = adapter.render();
    assert(React.isValidElement(rendered), '150-level tree parsed and rendered without stack overflow');
  });

  runStress('SvgResilience', 'Malformed SVG strings (unclosed tags, missing brackets)', () => {
    const malformed1 = '<svg><g data-joint="arm" data-pivot="10,20"><circle cx="10" cy="10" r="5"></svg>';
    const adapter1 = new ArbitraryCustomRigAdapter(malformed1);
    assert(adapter1.discoveredPivots['arm'] !== undefined, 'Should extract joint despite unclosed tag');
    const jsx1 = adapter1.render();
    assert(React.isValidElement(jsx1), 'Renders element from malformed XML');

    // Extra weird brackets
    const malformed2 = '<<svg viewBox="0 0 100 100">><<g data-joint="leg" data-pivot="5,15"><path d="M0 0" /></g></svg>';
    const adapter2 = new ArbitraryCustomRigAdapter(malformed2);
    assert(React.isValidElement(adapter2.render()), 'Handles extra angle brackets');
  });

  runStress('SvgResilience', 'Corrupted data-pivot values ("abc,def", "10", "", "NaN,Infinity", ",20")', () => {
    const testSvg = `
      <svg viewBox="0 0 500 500">
        <g data-joint="j1" data-pivot="abc,def" />
        <g data-joint="j2" data-pivot="10" />
        <g data-joint="j3" data-pivot="" />
        <g data-joint="j4" data-pivot="NaN,Infinity" />
        <g data-joint="j5" data-pivot=",20" />
        <g data-joint="j6" data-pivot="30," />
        <g data-joint="j7" data-pivot="-15.5, -42.8" />
      </svg>
    `;
    const adapter = new ArbitraryCustomRigAdapter(testSvg);
    const pivots = adapter.getJointPivots();

    assert(pivots['j1'][0] === 0 && pivots['j1'][1] === 0, 'j1 corrupted fallback to [0, 0]');
    assert(pivots['j2'][0] === 0 && pivots['j2'][1] === 0, 'j2 single value fallback to [0, 0]');
    assert(pivots['j3'][0] === 0 && pivots['j3'][1] === 0, 'j3 empty string fallback to [0, 0]');
    assert(pivots['j4'][0] === 0 && pivots['j4'][1] === 0, 'j4 NaN/Infinity fallback to [0, 0]');
    assert(pivots['j5'][0] === 0 && pivots['j5'][1] === 0, 'j5 missing x fallback to [0, 0]');
    assert(pivots['j6'][0] === 0 && pivots['j6'][1] === 0, 'j6 missing y fallback to [0, 0]');
    assert(pivots['j7'][0] === -15.5 && pivots['j7'][1] === -42.8, 'j7 valid negative floats parsed');
  });

  runStress('SvgResilience', 'Empty SVG strings and invalid inputs throw descriptive error', () => {
    let caughtEmpty = false;
    try {
      new ArbitraryCustomRigAdapter('');
    } catch (e: any) {
      caughtEmpty = true;
      assert(/Empty or invalid SVG/i.test(e.message), `Expected empty SVG error, got: ${e.message}`);
    }
    assert(caughtEmpty, 'Empty string should throw error');

    let caughtWhitespace = false;
    try {
      new ArbitraryCustomRigAdapter('    \n\t  ');
    } catch (e: any) {
      caughtWhitespace = true;
      assert(/Empty or invalid SVG/i.test(e.message), `Expected empty SVG error, got: ${e.message}`);
    }
    assert(caughtWhitespace, 'Whitespace string should throw error');

    let caughtNull = false;
    try {
      new ArbitraryCustomRigAdapter(null as any);
    } catch (e: any) {
      caughtNull = true;
      assert(/Invalid SVG source/i.test(e.message), `Expected invalid source error, got: ${e.message}`);
    }
    assert(caughtNull, 'Null argument should throw error');
  });

  runStress('SvgResilience', 'SVG lacking any data-joint tags creates default fallback root pivot', () => {
    const plainSvg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue" /></svg>';
    const adapter = new ArbitraryCustomRigAdapter(plainSvg);
    const pivots = adapter.getJointPivots();
    assert(pivots['root'] !== undefined, 'Fallback root pivot created');
    assert(pivots['root'][0] === 0 && pivots['root'][1] === 0, 'Fallback root pivot is [0, 0]');
  });

  // ---------------------------------------------------------------------------
  // 4. CHARACTER CONTROLLER ACTION QUEUE STRESS
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 4: CharacterController Action Queue Stress ---');

  runStress('ControllerStress', 'Zero-duration actions (startFrame == endFrame)', () => {
    const controller = new CharacterController();
    controller.queueAction({
      name: 'anticipate',
      startFrame: 10,
      endFrame: 10,
    });
    // Evaluation at the exact frame
    const poseAt10 = controller.evaluate(10);
    assert(Number.isFinite(poseAt10.root?.x), 'pose.root.x must be finite');
    assert(Number.isFinite(poseAt10.root?.y), 'pose.root.y must be finite');
    assert(Number.isFinite(poseAt10.squash), 'pose.squash must be finite');

    // Evaluation with direct evaluateAction zero duration
    const directAction = controller.evaluateAction('anticipate', 10, 10, 0);
    assert(Number.isFinite(directAction.root?.x), 'directAction zero duration finite x');
    assert(Number.isFinite(directAction.squash), 'directAction zero duration finite squash');
  });

  runStress('ControllerStress', 'Negative timeframes (actions starting and ending before frame 0)', () => {
    const controller = new CharacterController();
    controller.queueAction({
      name: 'overshoot',
      startFrame: -40,
      endFrame: -10,
    });

    // Before action (t < 0)
    const poseBefore = controller.evaluate(-60);
    assert(Number.isFinite(poseBefore.root?.y), 't < 0 must evaluate with finite y');

    // Mid-action
    const poseMid = controller.evaluate(-25);
    assert(Number.isFinite(poseMid.root?.y), 'mid negative action finite y');

    // After action (t > 1)
    const poseAfter = controller.evaluate(50);
    assert(Number.isFinite(poseAfter.root?.y), 't > 1 must evaluate with finite y');
  });

  runStress('ControllerStress', 'Extreme frame numbers (frame >> 1000, frame ~ Number.MAX_SAFE_INTEGER)', () => {
    const controller = new CharacterController();
    controller.queueAction({
      name: 'settle',
      startFrame: 0,
      endFrame: 60,
    });

    const pose1M = controller.evaluate(1_000_000);
    assert(Number.isFinite(pose1M.root?.x) && Number.isFinite(pose1M.root?.y), 'frame 1M finite coordinates');

    const poseMax = controller.evaluate(Number.MAX_SAFE_INTEGER);
    assert(Number.isFinite(poseMax.root?.x) && Number.isFinite(poseMax.root?.y), 'MAX_SAFE_INTEGER finite coordinates');

    const poseMin = controller.evaluate(Number.MIN_SAFE_INTEGER);
    assert(Number.isFinite(poseMin.root?.x) && Number.isFinite(poseMin.root?.y), 'MIN_SAFE_INTEGER finite coordinates');
  });

  runStress('ControllerStress', 'blend() with NaN, Infinity, -Infinity, undefined, out-of-range progress', () => {
    const controller = new CharacterController();
    const poseA: CharacterPose = {
      bodyX: 0,
      bodyY: 0,
      squash: 1.0,
      root: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
      limbs: { arm: { x: 0, y: 0, rotation: 0 } },
    };
    const poseB: CharacterPose = {
      bodyX: 100,
      bodyY: 200,
      squash: 0.7,
      root: { x: 50, y: 150, rotation: 45, scaleX: 1.2, scaleY: 0.8 },
      limbs: { arm: { x: 30, y: 40, rotation: 90 } },
    };

    // NaN progress
    const blendNaN = controller.blend(poseA, poseB, NaN);
    assert(blendNaN.bodyX === 0, `NaN progress should clamp to 0, got ${blendNaN.bodyX}`);
    assert(Number.isFinite(blendNaN.root?.rotation), 'blendNaN rotation finite');

    // +Infinity progress
    const blendInf = controller.blend(poseA, poseB, Infinity);
    assert(blendInf.bodyX === 0, `Infinity progress should clamp safely, got ${blendInf.bodyX}`);

    // -Infinity progress
    const blendNegInf = controller.blend(poseA, poseB, -Infinity);
    assert(blendNegInf.bodyX === 0, `Negative Infinity progress should clamp safely, got ${blendNegInf.bodyX}`);

    // progress > 1 (e.g. 5.0)
    const blendHigh = controller.blend(poseA, poseB, 5.0);
    assert(blendHigh.bodyX === 100, `progress > 1 clamps to 1.0, got ${blendHigh.bodyX}`);

    // progress < 0 (e.g. -2.0)
    const blendLow = controller.blend(poseA, poseB, -2.0);
    assert(blendLow.bodyX === 0, `progress < 0 clamps to 0.0, got ${blendLow.bodyX}`);
  });

  runStress('ControllerStress', 'Action queue gap interpolation and zero-length gap', () => {
    const controller = new CharacterController();
    // Action 1: 0 to 30
    controller.queueAction({ name: 'anticipate', startFrame: 0, endFrame: 30 });
    // Action 2: 60 to 90 (gap from 30 to 60)
    controller.queueAction({ name: 'overshoot', startFrame: 60, endFrame: 90 });

    // In the gap at frame 45
    const gapPose = controller.evaluate(45);
    assert(Number.isFinite(gapPose.root?.x), 'gap interpolation x is finite');
    assert(Number.isFinite(gapPose.root?.y), 'gap interpolation y is finite');
    assert(Number.isFinite(gapPose.squash), 'gap interpolation squash is finite');

    // At the boundary frame 30
    const b30 = controller.evaluate(30);
    assert(Number.isFinite(b30.root?.x), 'boundary 30 finite');

    // At the boundary frame 60
    const b60 = controller.evaluate(60);
    assert(Number.isFinite(b60.root?.x), 'boundary 60 finite');
  });

  runStress('ControllerStress', 'Inverted timeframe action (startFrame > endFrame)', () => {
    const controller = new CharacterController();
    // Inverted duration: start 50, end 10 -> duration = -40 <= 0
    controller.queueAction({ name: 'anticipate', startFrame: 50, endFrame: 10 });
    const pose = controller.evaluate(30);
    assert(Number.isFinite(pose.root?.x), 'Inverted action evaluates finite coordinates');
    assert(Number.isFinite(pose.squash), 'Inverted action evaluates finite squash');
  });

  runStress('ControllerStress', 'Multiple overlapping actions at identical startFrame', () => {
    const controller = new CharacterController();
    controller.queueAction({ name: 'anticipate', startFrame: 0, endFrame: 30 });
    controller.queueAction({ name: 'overshoot', startFrame: 0, endFrame: 40 });
    const pose = controller.evaluate(15);
    assert(Number.isFinite(pose.root?.x), 'Overlapping actions evaluate finite coordinates');
  });

  // ---------------------------------------------------------------------------
  // 5. AFFINE MATRIX AND FORWARD KINEMATICS STRESS
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 5: Affine Matrix and Forward Kinematics Stress ---');

  runStress('KinematicsStress', 'computeJointMatrix with extreme rotation (10^8 deg) and NaN scale', () => {
    const mat = computeJointMatrix({
      rotation: 100_000_000,
      scaleX: NaN,
      scaleY: Infinity,
      x: -Infinity,
      y: NaN,
    });
    assert(Number.isFinite(mat.a), 'mat.a finite');
    assert(Number.isFinite(mat.b), 'mat.b finite');
    assert(Number.isFinite(mat.c), 'mat.c finite');
    assert(Number.isFinite(mat.d), 'mat.d finite');
    assert(Number.isFinite(mat.tx), 'mat.tx finite');
    assert(Number.isFinite(mat.ty), 'mat.ty finite');
  });

  runStress('KinematicsStress', 'computeWorldJointPosition with 360 rotation wraps', () => {
    const parent = { x: 100, y: 200, rotation: 720 };
    const child = { x: 50, y: 0 };
    const world = computeWorldJointPosition(parent, child);
    assert(Math.abs(world.x - 150) < 1e-6, `World x should be 150, got ${world.x}`);
    assert(Math.abs(world.y - 200) < 1e-6, `World y should be 200, got ${world.y}`);
  });

  runStress('KinematicsStress', 'BirdRig.simulateFlight with zero radius and negative velocity', () => {
    const sim = BirdRig.simulateFlight({
      duration: 30,
      velocity: -50,
      radius: 0, // should clamp radius to max(0.1, radius)
    });
    assert(Number.isFinite(sim.bankAngleDeg), 'bankAngleDeg must be finite even with radius 0');
    assert(sim.bankAngleDeg >= 0 && sim.bankAngleDeg <= 90, 'bankAngleDeg within [0, 90]');
  });

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log('                        STRESS TEST SUMMARY');
  console.log('================================================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(` Total tests executed: ${total}`);
  console.log(` Passed:              ${passed}`);
  console.log(` Failed:              ${failed}`);
  console.log(` Pass rate:           ${((passed / total) * 100).toFixed(1)}%`);
  console.log('================================================================================\n');

  if (failed > 0) {
    console.error('Failed tests:');
    for (const r of results.filter((r) => !r.passed)) {
      console.error(` - [${r.category}] ${r.name}: ${r.error}`);
    }
    process.exit(1);
  }
}

runAllStressTests().catch((err) => {
  console.error('Unexpected harness fatal crash:', err);
  process.exit(1);
});
