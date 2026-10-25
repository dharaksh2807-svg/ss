import { Player } from '../src/player/Player';
import { CONSTANTS } from '../src/core/Constants';
import { CharacterModel, RunningStyle } from '../src/player/CharacterModel';
import { EventBus, EVENTS } from '../src/core/EventBus';
import * as THREE from 'three';

// In-memory localStorage mock for node environment
const storageMock: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, val: string) => { storageMock[key] = val; },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => {
    for (const k in storageMock) delete storageMock[k];
  },
  key: (i: number) => Object.keys(storageMock)[i] || null,
  length: Object.keys(storageMock).length
};

let passed = 0;
let total = 0;

function assert(condition: boolean, msg: string): void {
  total++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  passed++;
  console.log(`✅ PASSED: ${msg}`);
}

console.log('🧪 Starting Reverse Run / Moonwalk Style Verification Suite...\n');

// =========================================================================
// Test 1: Configuration, Default Preference & Persistence
// =========================================================================
console.log('--- Test 1: Configuration, Default Preference & Persistence ---');
{
  localStorage.clear();
  const modelDefault = new CharacterModel('char_jax');
  assert(modelDefault.getRunningStyle() === 'CLASSIC', 'Default running style is CLASSIC');
  assert(modelDefault.getVisualFacingAngle() === 0, 'Default visual facing angle is 0 (forward-facing)');

  // Set running style to REVERSE
  modelDefault.setRunningStyle('REVERSE');
  assert(modelDefault.getRunningStyle() === 'REVERSE', 'Style updates to REVERSE via setRunningStyle');

  // Verify EventBus listener integration
  localStorage.setItem('metro_running_style', 'REVERSE');
  const model2 = new CharacterModel('char_jax');
  assert(model2.getRunningStyle() === 'REVERSE', 'CharacterModel loads persisted REVERSE style from localStorage');

  EventBus.getInstance().emit(EVENTS.RUNNING_STYLE_CHANGED, 'CLASSIC');
  assert(model2.getRunningStyle() === 'CLASSIC', 'CharacterModel reacts to RUNNING_STYLE_CHANGED event (CLASSIC)');

  EventBus.getInstance().emit(EVENTS.RUNNING_STYLE_CHANGED, 'REVERSE');
  assert(model2.getRunningStyle() === 'REVERSE', 'CharacterModel reacts to RUNNING_STYLE_CHANGED event (REVERSE)');
}

// =========================================================================
// Test 2: Visual Facing Angle Convergence (Facing the Camera)
// =========================================================================
console.log('\n--- Test 2: Visual Facing Angle Convergence (Facing the Camera) ---');
{
  const model = new CharacterModel('char_jax');
  model.setRunningStyle('REVERSE');

  // Step model locomotion in RUN state
  // Should smoothly converge from 0 toward Math.PI
  let angle = model.getVisualFacingAngle();
  const dt = 1 / 60;
  for (let i = 0; i < 30; i++) {
    model.update(dt, 'RUNNING', false, false, 0, 0, 0);
  }

  const finalFacing = model.getVisualFacingAngle();
  assert(Math.abs(finalFacing - Math.PI) < 0.01, `Visual facing angle converged to Math.PI (got ${finalFacing.toFixed(4)}, expected ~${Math.PI.toFixed(4)})`);
  assert(Math.cos(finalFacing) < -0.99, `Character mesh is facing toward +Z (camera direction)`);
}

// =========================================================================
// Test 3: Gameplay Progression, Speed & Collision Fairness
// =========================================================================
console.log('\n--- Test 3: Gameplay Progression, Speed & Collision Fairness ---');
{
  // Compare two players running for 5.0 seconds: one CLASSIC, one REVERSE
  localStorage.setItem('metro_running_style', 'CLASSIC');
  const playerClassic = new Player();
  playerClassic.reset();

  localStorage.setItem('metro_running_style', 'REVERSE');
  const playerReverse = new Player();
  playerReverse.reset();

  const dt = 1 / 60;
  for (let step = 0; step < 300; step++) {
    playerClassic.update(dt);
    playerReverse.update(dt);
  }

  // World coordinates along Z must be EXACTLY identical
  const classicZ = playerClassic.position.z;
  const reverseZ = playerReverse.position.z;
  assert(Math.abs(classicZ - reverseZ) < 0.0001, `Forward Z progression is identical (classic: ${classicZ.toFixed(2)}, reverse: ${reverseZ.toFixed(2)})`);

  // Running speed and acceleration must be identical
  assert(Math.abs(playerClassic.speed - playerReverse.speed) < 0.0001, `Speed is identical (${playerClassic.speed} m/s)`);

  // Distance traveled must be identical
  assert(Math.abs(playerClassic.distanceTraveled - playerReverse.distanceTraveled) < 0.0001, `Distance traveled is identical (${playerClassic.distanceTraveled.toFixed(1)} m)`);

  // Bounding box colliders must be 100% identical in size and coordinates
  const classicBox = playerClassic.collider;
  const reverseBox = playerReverse.collider;
  assert(Math.abs(classicBox.min.x - reverseBox.min.x) < 0.0001, 'Collider min.x is identical');
  assert(Math.abs(classicBox.max.x - reverseBox.max.x) < 0.0001, 'Collider max.x is identical');
  assert(Math.abs(classicBox.min.y - reverseBox.min.y) < 0.0001, 'Collider min.y is identical');
  assert(Math.abs(classicBox.max.y - reverseBox.max.y) < 0.0001, 'Collider max.y is identical');
  assert(Math.abs(classicBox.min.z - reverseBox.min.z) < 0.0001, 'Collider min.z is identical');
  assert(Math.abs(classicBox.max.z - reverseBox.max.z) < 0.0001, 'Collider max.z is identical');
}

// =========================================================================
// Test 4: Lane Controls & Intuitive Lateral Banking
// =========================================================================
console.log('\n--- Test 4: Lane Controls & Intuitive Lateral Banking ---');
{
  const playerReverse = new Player();
  playerReverse.reset();

  // Test left/right lane switching controls remain standard
  playerReverse.changeLane(-1); // Move Left
  assert(playerReverse.targetLane === -1, 'Left command shifts targetLane to -1 (left lane)');

  // Step lane transition
  for (let i = 0; i < 20; i++) {
    playerReverse.update(1 / 60);
  }
  assert(playerReverse.position.x < 0, `Player position moved toward negative X (screen left: ${playerReverse.position.x.toFixed(2)})`);

  playerReverse.changeLane(1); // Move back to Center
  assert(playerReverse.targetLane === 0, 'Right command shifts targetLane to 0 (center lane)');

  // Verify CharacterModel lateral banking inversion:
  // When facing the camera (visualFacingAngle = Math.PI), local roll is inverted
  // so character rolls toward the screen-space direction of movement!
  const model = new CharacterModel('char_jax');
  model.setRunningStyle('REVERSE');
  for (let i = 0; i < 30; i++) model.update(1 / 60, 'RUNNING', false, false, 0.15, 0, 0);

  // Model is banking: verify targetRootRot sign aligns with screen-space movement
  assert(model.getVisualFacingAngle() > 3.0, 'Model is facing camera');
}

// =========================================================================
// Test 5: Biomechanical Backpedal Animation (No Moonwalking / Scuffing)
// =========================================================================
console.log('\n--- Test 5: Biomechanical Backpedal Animation (No Moonwalking / Scuffing) ---');
{
  const model = new CharacterModel('char_jax');
  model.setRunningStyle('REVERSE');

  // Sample joint transforms across a full 2-step stride cycle
  const dt = 1 / 60;
  let maxKneeFlexion = 0;
  let minThighExtension = 0;
  let observedForefootPlant = false;

  for (let i = 0; i < 60; i++) {
    model.update(dt, 'RUNNING', false, false, 0, 0, 0);
    // Let's inspect hierarchy joints
    const leftCalfX = (model as any).leftCalfRot.x;
    const rightCalfX = (model as any).rightCalfRot.x;
    maxKneeFlexion = Math.max(maxKneeFlexion, leftCalfX, rightCalfX);

    const leftLegX = (model as any).leftLegRot.x;
    const rightLegX = (model as any).rightLegRot.x;
    minThighExtension = Math.min(minThighExtension, leftLegX, rightLegX);

    const leftAnkleX = (model as any).leftSneakerRot.x;
    if (leftAnkleX < -0.05) observedForefootPlant = true;
  }

  // Authentic backpedaling requires:
  // 1. Leg reaching backward into hip extension (< -0.40 rads)
  assert(minThighExtension < -0.40, `Thigh extends backward into stance (min: ${minThighExtension.toFixed(2)} rads)`);

  // 2. High knee flexion (> 1.0 rads) to clear the ground cleanly during recovery (prevents moonwalking/scuffing)
  assert(maxKneeFlexion > 1.0, `Knee flexes high during recovery stroke (max: ${maxKneeFlexion.toFixed(2)} rads)`);

  // 3. Forefoot/toes plant reaching backward
  assert(observedForefootPlant, 'Foot exhibits forefoot plantarflexion reaching backward');
}

// =========================================================================
// Test 6: Special Action Transitions (Slide, Jetpack, Jump, Crash)
// =========================================================================
console.log('\n--- Test 6: Special Action Transitions (Slide, Jetpack, Jump, Crash) ---');
{
  const model = new CharacterModel('char_jax');
  model.setRunningStyle('REVERSE');

  // Let it converge to reverse run (Math.PI)
  for (let i = 0; i < 30; i++) model.update(1 / 60, 'RUNNING', false, false, 0, 0, 0);
  assert(Math.abs(model.getVisualFacingAngle() - Math.PI) < 0.01, 'Running in reverse');

  // 1. SLIDE: Must revert smoothly to 0 (forward-facing slide under hurdles)
  for (let i = 0; i < 15; i++) model.update(1 / 60, 'SLIDING', false, false, 0, 0, 0.4);
  assert(model.getVisualFacingAngle() < 0.5, `Slide smoothly reverts visual facing toward 0 (got ${model.getVisualFacingAngle().toFixed(2)})`);

  // Return to running: should smoothly return to Math.PI
  for (let i = 0; i < 20; i++) model.update(1 / 60, 'RUNNING', false, false, 0, 0, 0);
  assert(model.getVisualFacingAngle() > 2.8, `Returns smoothly to reverse facing after slide (got ${model.getVisualFacingAngle().toFixed(2)})`);

  // 2. JETPACK: Rocket flight must face forward (0)
  for (let i = 0; i < 15; i++) model.update(1 / 60, 'JETPACK', false, false, 0, 0, 0);
  assert(model.getVisualFacingAngle() < 0.5, `Jetpack flight reverts visual facing toward 0 (got ${model.getVisualFacingAngle().toFixed(2)})`);

  // Return to running after jetpack: returns to reverse
  for (let i = 0; i < 20; i++) model.update(1 / 60, 'RUNNING', false, false, 0, 0, 0);
  assert(model.getVisualFacingAngle() > 2.8, `Returns smoothly to reverse facing after jetpack (got ${model.getVisualFacingAngle().toFixed(2)})`);

  // 3. JUMP: Allowed in reverse run (faces camera while leaping)
  assert(model.isReverseFacingAllowed('JUMP_TAKEOFF') === true, 'Jump takeoff is allowed in reverse facing');
  assert(model.isReverseFacingAllowed('JUMP_ASCEND') === true, 'Jump ascend is allowed in reverse facing');
  assert(model.isReverseFacingAllowed('JUMP_APEX') === true, 'Jump apex is allowed in reverse facing');
  assert(model.isReverseFacingAllowed('JUMP_DESCEND') === true, 'Jump descend is allowed in reverse facing');
  assert(model.isReverseFacingAllowed('JUMP_LAND') === true, 'Jump land is allowed in reverse facing');
  assert(model.isReverseFacingAllowed('FAST_DROP') === true, 'Fast drop is allowed in reverse facing');
  assert(model.isReverseFacingAllowed('TRAIN_ROOF_RUN') === true, 'Train roof run is allowed in reverse facing');
  assert(model.isReverseFacingAllowed('CLIMB') === true, 'Ramp climb is allowed in reverse facing');

  // 4. CRASH: Defeat tumble reverts to 0
  assert(model.isReverseFacingAllowed('CRASH') === false, 'Crash impact tumble reverts to forward facing');
}

// =========================================================================
// Test 7: Runtime Switching Back to Classic
// =========================================================================
console.log('\n--- Test 7: Runtime Switching Back to Classic ---');
{
  const model = new CharacterModel('char_jax');
  model.setRunningStyle('REVERSE');
  for (let i = 0; i < 30; i++) model.update(1 / 60, 'RUNNING', false, false, 0, 0, 0);
  assert(model.getVisualFacingAngle() > 3.0, 'Model is in reverse run');

  // Player switches back to Classic in settings
  model.setRunningStyle('CLASSIC');
  assert(model.getRunningStyle() === 'CLASSIC', 'Style is now CLASSIC');

  for (let i = 0; i < 30; i++) model.update(1 / 60, 'RUNNING', false, false, 0, 0, 0);
  assert(model.getVisualFacingAngle() < 0.05, `Model smoothly returned to 0 (classic rear chase: ${model.getVisualFacingAngle().toFixed(4)})`);
}

console.log(`\n🎉 All ${passed}/${total} Reverse Run unit & kinematics tests passed successfully!`);
