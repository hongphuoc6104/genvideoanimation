/**
 * Challenger 2 Empirical Stress Test Harness
 * Milestone 2: Physics Profiles & Dynamics
 * 
 * Verifies:
 * 1. Numerical stability of 2nd-order damped harmonic oscillator (evaluateProfileDynamics)
 * 2. Mathematical properties (Solemn settle monotonicity, Playful settle zero-crossings, Volume conservation floor in squashStretch)
 * 3. Immutability stress of frozen presets
 * 4. Pathological sanitization & edge cases
 */

import {
  PERFORMANCE_PROFILES,
  getPerformanceProfile,
  sanitizeProfile,
  resolveProfile,
  evaluateProfileDynamics,
  evaluateProfileDynamicsTrajectory,
  evaluateAnticipation,
  evaluateOvershoot,
  evaluateSettle,
  squashStretch,
  evaluateOscillator,
  anticipateAction,
  overshootAction,
  settleAction,
  PerformanceProfileName,
} from '../motion-kit/src/physics';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures: string[] = [];

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
  } else {
    failedTests++;
    failures.push(message);
    console.error(`  ❌ FAIL: ${message}`);
  }
}

function assertClose(actual: number, expected: number, tolerance = 1e-4, msg = '') {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, `${msg} — expected ${expected} ± ${tolerance}, got ${actual} (diff=${diff})`);
}

console.log('================================================================================');
console.log('CHALLENGER 2: EMPIRICAL STRESS TEST SUITE — PHYSICS PROFILES & DYNAMICS');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// 1. Numerical Stability of 2nd-Order Damped Harmonic Oscillator
// -----------------------------------------------------------------------------
console.log('--- 1. NUMERICAL STABILITY OF 2ND-ORDER DAMPED HARMONIC OSCILLATOR ---');

const testTimesteps = [
  -1.0,
  -0.001,
  0.0,
  1e-7,
  1e-5,
  0.0001,
  0.001,
  0.016667, // 60fps
  0.033333, // 30fps
  0.1,
  0.5,
  1.0,
  2.0,
  5.0,
  10.0,
  50.0,
  100.0,
  1000.0,
  1e6,
];

const testStates = [
  { current: 0, target: 100, vel: 0, desc: 'Rest to 100' },
  { current: 100, target: 0, vel: -50, desc: 'Return to origin with negative vel' },
  { current: -500, target: 500, vel: 1000, desc: 'Large displacement & large vel' },
  { current: 0, target: 0, vel: 0, desc: 'Already at rest at target' },
  { current: 1e5, target: -1e5, vel: -1e4, desc: 'Extreme coordinate span' },
  { current: 0.00001, target: 0.00002, vel: 0.000005, desc: 'Microscale displacements' },
];

const profileNames: PerformanceProfileName[] = ['calm', 'energetic', 'playful', 'dramatic', 'solemn'];

let nanCount = 0;
let infiniteCount = 0;
let evaluationCount = 0;

for (const pName of profileNames) {
  const profile = PERFORMANCE_PROFILES[pName];
  for (const s of testStates) {
    for (const dt of testTimesteps) {
      evaluationCount++;
      const result = evaluateProfileDynamics(s.current, s.target, s.vel, profile, dt);

      if (!Number.isFinite(result.position)) {
        nanCount++;
        assert(false, `Position non-finite for profile=${pName}, state=${s.desc}, dt=${dt}: got ${result.position}`);
      }
      if (!Number.isFinite(result.velocity)) {
        nanCount++;
        assert(false, `Velocity non-finite for profile=${pName}, state=${s.desc}, dt=${dt}: got ${result.velocity}`);
      }
      if (!Number.isFinite(result.acceleration)) {
        nanCount++;
        assert(false, `Acceleration non-finite for profile=${pName}, state=${s.desc}, dt=${dt}: got ${result.acceleration}`);
      }

      // Stability at zero or negative dt: must return current pos and initial vel
      if (dt <= 0) {
        assert(
          result.position === s.current,
          `dt <= 0 must preserve current position: expected ${s.current}, got ${result.position}`
        );
        assert(
          result.velocity === s.vel,
          `dt <= 0 must preserve initial velocity: expected ${s.vel}, got ${result.velocity}`
        );
      }

      // Large dt asymptotic behavior: for dt >= 100s, system should settle towards target
      if (dt >= 100.0) {
        assertClose(
          result.position,
          s.target,
          1e-2,
          `For dt=${dt}, profile=${pName}, state=${s.desc}, position should converge to target`
        );
        assertClose(
          result.velocity,
          0.0,
          1e-2,
          `For dt=${dt}, profile=${pName}, state=${s.desc}, velocity should converge to 0`
        );
      }
    }
  }
}

assert(nanCount === 0, `All ${evaluationCount} evaluateProfileDynamics evaluations must be finite (no NaN/Inf)`);
console.log(`  ✓ Evaluated ${evaluationCount} state/dt combinations across all 5 profiles without any NaN/overflow.`);

// Stress trajectory generation
const trajectory = evaluateProfileDynamicsTrajectory(0, 100, 300, 'energetic', 60);
assert(trajectory.length === 301, 'Trajectory must have 301 frames (0 to 300)');
let trajAllFinite = true;
for (let i = 0; i < trajectory.length; i++) {
  const pt = trajectory[i];
  if (!Number.isFinite(pt.position) || !Number.isFinite(pt.velocity) || !Number.isFinite(pt.acceleration)) {
    trajAllFinite = false;
    break;
  }
}
assert(trajAllFinite, 'All trajectory points must be finite');
assertClose(trajectory[trajectory.length - 1].position, 100, 1e-1, 'Final trajectory position converges to 100');
console.log('  ✓ Trajectory simulation (300 frames) verified for numerical convergence and stability.');

// -----------------------------------------------------------------------------
// 2. Mathematical Properties Verification
// -----------------------------------------------------------------------------
console.log('\n--- 2. MATHEMATICAL PROPERTIES VERIFICATION ---');

// 2a. Solemn profile settle monotonicity
console.log('  [2a] Solemn profile settle monotonicity test:');
const solemnProfile = PERFORMANCE_PROFILES.solemn;
const SOLEMN_SAMPLES = 10000;
let solemnMonotonic = true;
let solemnMax = -Infinity;
let solemnMin = Infinity;
let maxOvershoot = 0;
let prevVal = evaluateSettle(0, solemnProfile);

for (let i = 1; i <= SOLEMN_SAMPLES; i++) {
  const t = i / SOLEMN_SAMPLES;
  const val = evaluateSettle(t, solemnProfile);
  if (val > solemnMax) solemnMax = val;
  if (val < solemnMin) solemnMin = val;
  if (val > 1.0) {
    const overshoot = val - 1.0;
    if (overshoot > maxOvershoot) maxOvershoot = overshoot;
  }
  // Allow microscopic floating point epsilon
  if (val < prevVal - 1e-12) {
    solemnMonotonic = false;
    console.error(`    Monotonicity violation at t=${t}: prev=${prevVal}, curr=${val}, diff=${val - prevVal}`);
  }
  prevVal = val;
}

assert(solemnMonotonic, `Solemn settle must be strictly non-decreasing across ${SOLEMN_SAMPLES} samples`);
assert(solemnMax <= 1.00001, `Solemn settle maximum value must not exceed 1.00001 (observed max=${solemnMax})`);
assert(maxOvershoot <= 1e-12, `Solemn settle must not exhibit overshoot above 1.0 (observed overshoot=${maxOvershoot})`);
assert(evaluateSettle(0, solemnProfile) === 0.0, 'Solemn settle at t=0 must be 0.0');
assert(evaluateSettle(1, solemnProfile) === 1.0, 'Solemn settle at t=1 must be 1.0');
console.log(`    ✓ Verified 10,000 samples: monotonic=true, min=${solemnMin}, max=${solemnMax}, maxOvershoot=${maxOvershoot}`);

// 2b. Playful profile settle zero-crossings
console.log('  [2b] Playful profile settle zero-crossings test:');
const playfulProfile = PERFORMANCE_PROFILES.playful;
const PLAYFUL_SAMPLES = 10000;
let playfulZeroCrossings = 0;
const crossingTimes: number[] = [];
let prevPlayfulSign = Math.sign(evaluateSettle(0.0001, playfulProfile) - 1.0);

for (let i = 2; i < PLAYFUL_SAMPLES; i++) {
  const t = i / PLAYFUL_SAMPLES;
  const diff = evaluateSettle(t, playfulProfile) - 1.0;
  const currentSign = Math.sign(diff);
  if (currentSign !== 0 && currentSign !== prevPlayfulSign) {
    playfulZeroCrossings++;
    crossingTimes.push(Number(t.toFixed(4)));
    prevPlayfulSign = currentSign;
  }
}

console.log(`    Detected ${playfulZeroCrossings} zero-crossings around 1.0 at t = [${crossingTimes.join(', ')}]`);
assert(
  playfulZeroCrossings >= 3,
  `Playful settle must exhibit >= 3 zero-crossings around 1.0 (found ${playfulZeroCrossings})`
);

// Verify peak overshoot of playful settle
let playfulPeak = 0;
for (let i = 1; i < 1000; i++) {
  const s = evaluateSettle(i / 1000, playfulProfile);
  if (s > playfulPeak) playfulPeak = s;
}
assert(playfulPeak > 1.0, `Playful settle must exceed 1.0 during oscillation (observed peak=${playfulPeak})`);
console.log(`    ✓ Playful settle peak response=${playfulPeak.toFixed(4)} with ${playfulZeroCrossings} zero-crossings.`);

// 2c. Volume conservation floor in squashStretch
console.log('  [2c] Volume conservation floor in squashStretch:');
const extremeSquashInputs = [
  1.0,
  0.8,
  0.64,
  0.49,
  0.25,
  0.16,
  0.04,   // exact floor boundary
  0.0399, // just below floor
  0.01,
  1e-4,
  1e-7,
  1e-15,
  0.0,    // exact zero
  -0.001, // tiny negative
  -0.5,
  -1.0,   // negative scale
  -100.0,
];

for (const y of extremeSquashInputs) {
  const res = squashStretch(y);
  assert(Number.isFinite(res.scaleX), `scaleX must be finite for scaleY=${y}, got ${res.scaleX}`);
  assert(Number.isFinite(res.scaleY), `scaleY must be finite for scaleY=${y}, got ${res.scaleY}`);
  assert(res.scaleX > 0, `scaleX must be strictly positive for scaleY=${y}, got ${res.scaleX}`);
  assert(res.scaleX <= 5.0, `scaleX must not exceed safety ceiling 5.0 for scaleY=${y}, got ${res.scaleX}`);

  if (y <= 0.04) {
    // Floor boundary: safeY = 0.04 => 1 / sqrt(0.04) = 5.0
    assertClose(res.scaleX, 5.0, 1e-4, `Floor scaleX for y=${y} must clamp to 5.0`);
  } else if (y >= 0.04 && y <= 4.0) {
    // Exact volume preservation: scaleX * sqrt(y) == 1.0
    const expectedX = 1.0 / Math.sqrt(y);
    assertClose(res.scaleX, expectedX, 1e-4, `Volume preservation scaleX for y=${y}`);
    const volumeRatio = res.scaleX * res.scaleX * y;
    assertClose(volumeRatio, 1.0, 1e-4, `Volume invariant scaleX^2 * scaleY == 1.0 for y=${y}`);
  }
}

// Edge case: volumePreserve = false
const noPreserve = squashStretch(0.5, false);
assert(noPreserve.scaleX === 1.0, 'scaleX must be 1.0 when volumePreserve is false');
assert(noPreserve.scaleY === 0.5, 'scaleY must be preserved when volumePreserve is false');

// Non-finite input handling
const nanSquash = squashStretch(NaN);
assert(Number.isFinite(nanSquash.scaleX), 'NaN scaleY must yield finite scaleX');
assert(Number.isFinite(nanSquash.scaleY), 'NaN scaleY must yield finite scaleY');

const infSquash = squashStretch(Infinity);
assert(Number.isFinite(infSquash.scaleX), 'Infinity scaleY must yield finite scaleX');

console.log('  ✓ Volume conservation floor verified: safe under zero, negative, and extreme scales.');

// -----------------------------------------------------------------------------
// 3. Immutability Stress
// -----------------------------------------------------------------------------
console.log('\n--- 3. IMMUTABILITY STRESS ON FROZEN PRESETS ---');

assert(Object.isFrozen(PERFORMANCE_PROFILES), 'PERFORMANCE_PROFILES dictionary itself must be frozen');

function attemptStrictMutation(obj: any, prop: string, value: any): boolean {
  try {
    (function() {
      'use strict';
      obj[prop] = value;
    })();
    return false; // Did not throw
  } catch (err: any) {
    return err instanceof TypeError;
  }
}

function attemptStrictDelete(obj: any, prop: string): boolean {
  try {
    (function() {
      'use strict';
      delete obj[prop];
    })();
    return false;
  } catch (err: any) {
    return err instanceof TypeError;
  }
}

for (const name of profileNames) {
  const profile = PERFORMANCE_PROFILES[name];
  assert(Object.isFrozen(profile), `Profile "${name}" must be Object.isFrozen()`);
  assert(Object.isFrozen(profile.anticipation), `Profile "${name}".anticipation must be Object.isFrozen()`);
  assert(Object.isFrozen(profile.overshoot), `Profile "${name}".overshoot must be Object.isFrozen()`);
  assert(Object.isFrozen(profile.followThrough), `Profile "${name}".followThrough must be Object.isFrozen()`);
  assert(Object.isFrozen(profile.settle), `Profile "${name}".settle must be Object.isFrozen()`);

  // Mutation attempts on top-level properties
  const origTiming = profile.timingScale;
  const origSquash = profile.squashFactor;

  const threwTiming = attemptStrictMutation(profile, 'timingScale', 999.0);
  assert(threwTiming, `Mutating profile.${name}.timingScale must throw TypeError in strict mode`);
  assert(profile.timingScale === origTiming, `profile.${name}.timingScale must remain intact (${origTiming})`);

  const threwSquash = attemptStrictMutation(profile, 'squashFactor', -99.0);
  assert(threwSquash, `Mutating profile.${name}.squashFactor must throw TypeError in strict mode`);
  assert(profile.squashFactor === origSquash, `profile.${name}.squashFactor must remain intact (${origSquash})`);

  // Mutation attempts on nested objects
  const origPullBack = profile.anticipation.pullBack;
  const threwPullBack = attemptStrictMutation(profile.anticipation, 'pullBack', 999.0);
  assert(threwPullBack, `Mutating profile.${name}.anticipation.pullBack must throw TypeError in strict mode`);
  assert(profile.anticipation.pullBack === origPullBack, `profile.${name}.anticipation.pullBack must remain intact`);

  const origOvershootAmp = profile.overshoot.amplitude;
  const threwOvershoot = attemptStrictMutation(profile.overshoot, 'amplitude', 999.0);
  assert(threwOvershoot, `Mutating profile.${name}.overshoot.amplitude must throw TypeError in strict mode`);
  assert(profile.overshoot.amplitude === origOvershootAmp, `profile.${name}.overshoot.amplitude must remain intact`);

  const origBounces = profile.settle.bounces;
  const threwBounces = attemptStrictMutation(profile.settle, 'bounces', 999);
  assert(threwBounces, `Mutating profile.${name}.settle.bounces must throw TypeError in strict mode`);
  assert(profile.settle.bounces === origBounces, `profile.${name}.settle.bounces must remain intact`);

  // Property addition attempts
  const threwAddProp = attemptStrictMutation(profile, 'injectedProperty', 'malicious');
  assert(threwAddProp, `Adding properties to frozen profile "${name}" must throw TypeError in strict mode`);
  assert((profile as any).injectedProperty === undefined, `injectedProperty must be undefined`);
}

// Mutation attempt on PERFORMANCE_PROFILES dictionary itself
const threwDictMut = attemptStrictMutation(PERFORMANCE_PROFILES, 'calm', null);
assert(threwDictMut, 'Reassigning PERFORMANCE_PROFILES.calm must throw TypeError in strict mode');
assert(PERFORMANCE_PROFILES.calm !== null, 'PERFORMANCE_PROFILES.calm must not be null');

const threwDictAdd = attemptStrictMutation(PERFORMANCE_PROFILES, 'hackedProfile', {});
assert(threwDictAdd, 'Adding new key to PERFORMANCE_PROFILES must throw TypeError in strict mode');

const threwDictDel = attemptStrictDelete(PERFORMANCE_PROFILES, 'calm');
assert(threwDictDel, 'Deleting key from PERFORMANCE_PROFILES must throw TypeError in strict mode');
assert(PERFORMANCE_PROFILES.calm !== undefined, 'PERFORMANCE_PROFILES.calm must not be deleted');
console.log('  ✓ Deep immutability confirmed across all 5 profiles and dictionary root.');

// -----------------------------------------------------------------------------
// 4. Sanitization & Edge Case Robustness
// -----------------------------------------------------------------------------
console.log('\n--- 4. SANITIZATION & EDGE CASE ROBUSTNESS ---');

// getPerformanceProfile tests
assert(getPerformanceProfile('calm').name === 'calm', 'getPerformanceProfile("calm")');
assert(getPerformanceProfile('energetic').name === 'energetic', 'getPerformanceProfile("energetic")');
assert(getPerformanceProfile('playful').name === 'playful', 'getPerformanceProfile("playful")');
assert(getPerformanceProfile('dramatic').name === 'dramatic', 'getPerformanceProfile("dramatic")');
assert(getPerformanceProfile('solemn').name === 'solemn', 'getPerformanceProfile("solemn")');

let unknownThrew = false;
let errorMsg = '';
try {
  getPerformanceProfile('non_existent_profile');
} catch (err: any) {
  unknownThrew = true;
  errorMsg = err.message;
}
assert(unknownThrew, 'getPerformanceProfile with unknown name must throw');
assert(
  /unknown performance profile/i.test(errorMsg),
  `Error message must match /unknown performance profile/i, got: "${errorMsg}"`
);

// sanitizeProfile boundary tests
const sanitizedNegative = sanitizeProfile({ timingScale: -5.0, damping: -1.0, squashFactor: -0.5 });
assert(sanitizedNegative.timingScale >= 0.1, 'Negative timingScale clamped to >= 0.1');
assert(sanitizedNegative.damping >= 0.05, 'Negative damping clamped to >= 0.05');
assert(sanitizedNegative.squashFactor >= 0.04, 'Negative squashFactor clamped to >= 0.04');

const sanitizedNull = sanitizeProfile(null);
assert(sanitizedNull.name === 'calm', 'sanitizeProfile(null) defaults to calm');

const sanitizedNonObj = sanitizeProfile('bad_input' as any);
assert(sanitizedNonObj.name === 'calm', 'sanitizeProfile(non-object) defaults to calm');

// resolveProfile tests
assert(resolveProfile() === PERFORMANCE_PROFILES.calm, 'resolveProfile() defaults to calm');
assert(resolveProfile(null) === PERFORMANCE_PROFILES.calm, 'resolveProfile(null) defaults to calm');
assert(resolveProfile('energetic') === PERFORMANCE_PROFILES.energetic, 'resolveProfile("energetic")');

// Action pose evaluators
const antPose = anticipateAction(0.5, 'dramatic');
assert(Number.isFinite(antPose.rootOffset.x), 'anticipateAction rootOffset.x finite');
assert(Number.isFinite(antPose.scaleX), 'anticipateAction scaleX finite');
assert(Number.isFinite(antPose.scaleY), 'anticipateAction scaleY finite');

const overPose = overshootAction(0.5, 'energetic');
assert(Number.isFinite(overPose.rootOffset.x), 'overshootAction rootOffset.x finite');
assert(Number.isFinite(overPose.scaleX), 'overshootAction scaleX finite');

const settlePose = settleAction(0.5, 'playful');
assert(Number.isFinite(settlePose.rootOffset.x), 'settleAction rootOffset.x finite');
assert(Number.isFinite(settlePose.scaleX), 'settleAction scaleX finite');

// Oscillator zero decay edge case
const oscVal = evaluateOscillator(0.5, 0.5, 2, 0);
assert(Number.isFinite(oscVal), 'evaluateOscillator zero decay is finite');
assert(oscVal <= 1.55, `evaluateOscillator bounded by 1.0 + amp (got ${oscVal})`);

console.log('  ✓ Sanitization, profile resolution, and action pose generators verified.');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log(`STRESS TEST VERDICT: ${failedTests === 0 ? 'ALL EMPIRICAL TESTS PASSED' : 'FAILURES DETECTED'}`);
console.log('================================================================================');

if (failedTests > 0) {
  process.exit(1);
}
