import * as THREE from 'three';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { CONSTANTS } from '../src/core/Constants';
import { TrainScenarioRunner, TrainScenarioConfig } from '../src/debug/TrainScenarioRunner';
import { TrainVariant } from '../src/track/ObstacleFactory';

// Polyfill localStorage for node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; },
    length: 0,
    key: () => null
  } as any;
}

console.log('🧪 Starting Comprehensive Train Climbing, Ramp-to-Roof & Collision Regression Suite...\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
    passedTests++;
  }
}

function createEnv() {
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);
  for (const c of trackManager.chunks) {
    c.clearDynamicItems();
  }
  const player = new Player();
  player.reset();
  const runner = TrainScenarioRunner.getInstance();
  return { scene, trackManager, player, runner };
}

// Helper to step simulation
function stepGame(player: Player, trackManager: TrackManager, duration: number, fps: number = 60) {
  const dt = 1.0 / fps;
  let elapsed = 0;
  while (elapsed < duration) {
    player.update(dt);
    trackManager.update(player, dt, elapsed);
    elapsed += dt;
  }
}

// =========================================================================
// Suite 1: Climbing a short stationary train with a ramp (length = 18m)
// =========================================================================
console.log('--- Suite 1: Climbing Short Stationary Train with Ramp ---');
{
  const { trackManager, player, runner } = createEnv();
  const outcome = runner.runScenario(player, trackManager, {
    trainType: 'TRAIN',
    trainLength: 18.0,
    hasRamp: true,
    playerLane: 0,
    entryState: 'GROUND_APPROACH',
    fps: 60
  }, 1.1);

  assert(outcome.climbedRamp, 'Player detected and entered RAMP support');
  assert(outcome.reachedRoof, 'Player traversed onto TRAIN_ROOF');
  assert(!outcome.crashed, 'Player did not trigger lethal collision while climbing short train');
  assert(player.state === 'ON_TRAIN', `Player state is ON_TRAIN (got ${player.state})`);
  assert(player.getSupportSurface() === 'TRAIN_ROOF', `Support surface is TRAIN_ROOF (got ${player.getSupportSurface()})`);
  assert(Math.abs(player.position.y - 4.35) < 0.05, `Height is 4.35m (got ${player.position.y.toFixed(2)})`);
}

// =========================================================================
// Suite 2: Climbing a long stationary train with a ramp (length = 28m)
// =========================================================================
console.log('\n--- Suite 2: Climbing Long Stationary Train with Ramp ---');
{
  const { trackManager, player, runner } = createEnv();
  const outcome = runner.runScenario(player, trackManager, {
    trainType: 'TRAIN',
    trainLength: 28.0,
    hasRamp: true,
    playerLane: 0,
    entryState: 'GROUND_APPROACH',
    fps: 60
  }, 2.0);

  assert(outcome.climbedRamp, 'Player climbed ramp on long train');
  assert(outcome.reachedRoof, 'Player smoothly transitioned to roof on long train');
  assert(!outcome.crashed, 'Zero crashes on long train ramp traversal');
}

// =========================================================================
// Suite 3: Traversing from Ramp to Roof (Boundary Continuity Inspection)
// =========================================================================
console.log('\n--- Suite 3: Traversing from Ramp to Roof Boundary Invariants ---');
{
  const { trackManager, player, runner } = createEnv();
  // Train length = 20, zOffset = 30. Front is at Z = -20. Ramp spans -12 to -20.
  runner.setupScenario(player, trackManager, {
    trainType: 'TRAIN',
    trainLength: 20.0,
    hasRamp: true,
    playerLane: 0,
    entryState: 'GROUND_APPROACH',
    playerStartZ: -12.5 // Exactly 0.5m ahead of ramp base
  });

  const targetTrainId = trackManager.chunks[0].obstacles[0].id;
  assert(!!targetTrainId, 'Target train obstacle has unique ID');

  const dt = 1.0 / 60;
  let reachedRamp = false;
  let reachedBoundary = false;
  let reachedRoof = false;
  let droppedSupportAtAnyPoint = false;

  for (let f = 0; f < 80; f++) {
    player.update(dt);
    trackManager.update(player, dt, f * dt);

    const surface = player.getSupportSurface();
    const supportId = player.getActiveSupportObstacleId();

    if (surface === 'RAMP') {
      reachedRamp = true;
      assert(supportId === targetTrainId, `Ramp support bound to target train ID (got ${supportId})`);
    }

    // Boundary check around Z = -20.0 (+/- 0.5m)
    if (player.position.z <= -19.5 && player.position.z >= -20.5) {
      reachedBoundary = true;
      if (surface === 'GROUND') {
        droppedSupportAtAnyPoint = true;
      }
    }

    if (surface === 'TRAIN_ROOF') {
      reachedRoof = true;
      assert(supportId === targetTrainId, `Roof support bound to target train ID (got ${supportId})`);
    }
  }

  assert(reachedRamp, 'Successfully climbed ramp');
  assert(reachedBoundary, 'Crossed ramp-to-roof boundary');
  assert(reachedRoof, 'Successfully reached roof');
  assert(!droppedSupportAtAnyPoint, 'Support was NEVER dropped to GROUND at boundary');
  assert(player.state !== 'CRASH', 'Zero collision deaths at boundary');
}

// =========================================================================
// Suite 4: Running over the Full Train Roof & Walking/Jumping off the Train
// =========================================================================
console.log('\n--- Suite 4: Running Over Full Train Roof and Stepping Off ---');
{
  const { trackManager, player, runner } = createEnv();
  // Train spans Z: -40 to -20 (length 20, center -30). Roof end is at Z = -40.
  runner.setupScenario(player, trackManager, {
    trainType: 'TRAIN',
    trainLength: 20.0,
    hasRamp: true,
    playerLane: 0,
    entryState: 'ROOFTOP_RUN',
    playerStartZ: -22.0 // Near front of roof
  });

  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Player starts on TRAIN_ROOF');
  assert(player.position.y === 4.35, 'Player starts at 4.35m');

  // Step across full roof (from -22.0 to -45.0, running 18 m/s takes ~1.3s)
  stepGame(player, trackManager, 1.4, 60);

  // Stepped past Z = -40 into air
  assert(player.position.z < -40.0, `Player traversed past rear of train (Z = ${player.position.z.toFixed(1)})`);
  assert(player.state === 'FALLING_FROM_TRAIN' || player.state === 'FALLING' || player.state === 'RUN', `Player naturally fell or landed (state: ${player.state})`);
  assert(player.getActiveSupportObstacleId() === null, 'Active support obstacle ID cleared upon stepping off');
}

// =========================================================================
// Suite 5: Climbing while Speed Increases (18 m/s up to 35 m/s)
// =========================================================================
console.log('\n--- Suite 5: Climbing with High Velocity (18, 25, 35 m/s) ---');
const speeds = [18.0, 25.0, 35.0];
for (const testSpeed of speeds) {
  const { trackManager, player, runner } = createEnv();
  const outcome = runner.runScenario(player, trackManager, {
    trainType: 'TRAIN',
    trainLength: 22.0,
    hasRamp: true,
    playerSpeed: testSpeed,
    playerLane: 0,
    entryState: 'GROUND_APPROACH',
    fps: 60
  }, 1.5);

  assert(outcome.reachedRoof, `High speed (${testSpeed} m/s) climbed ramp onto roof successfully`);
  assert(!outcome.crashed, `High speed (${testSpeed} m/s) did NOT crash at ramp-to-roof transition`);

  const roofSnapshot = outcome.trajectory.find(s => s.playerState === 'ON_TRAIN' && s.supportSurface === 'TRAIN_ROOF');
  assert(!!roofSnapshot, `Found ON_TRAIN snapshot for ${testSpeed} m/s`);
  if (roofSnapshot) {
    assert(Math.abs(roofSnapshot.playerY - 4.35) < 0.05, `Height during roof traversal at ${testSpeed} m/s resolved to 4.35m (got ${roofSnapshot.playerY.toFixed(2)})`);
  }
}

// =========================================================================
// Suite 6: Climbing while Lane Switching
// =========================================================================
console.log('\n--- Suite 6: Climbing While Lane Switching ---');
{
  const { trackManager, player, runner } = createEnv();
  runner.setupScenario(player, trackManager, {
    trainType: 'TRAIN',
    trainLength: 24.0,
    hasRamp: true,
    playerLane: 0,
    entryState: 'GROUND_APPROACH',
    playerStartZ: -15.0 // Halfway up ramp
  });

  // Step 2 frames onto ramp
  stepGame(player, trackManager, 0.05, 60);
  assert(player.getSupportSurface() === 'RAMP', 'On ramp');

  // Attempt slight lane change
  player.handleInput('LEFT');
  stepGame(player, trackManager, 0.6, 60);

  // If still on train bounds, reaches roof safely; if fell off, transitions to falling
  assert(player.state !== 'CRASH', 'Lane switching on/near ramp does not trigger crash bug');
}

// =========================================================================
// Suite 7: Climbing with Hoverboard Active
// =========================================================================
console.log('\n--- Suite 7: Climbing with Active Hoverboard ---');
{
  const { trackManager, player, runner } = createEnv();
  player.hoverboardManager.activate();
  assert(player.hoverboardManager.isBoardActive(), 'Hoverboard activated');

  const outcome = runner.runScenario(player, trackManager, {
    trainType: 'TRAIN',
    trainLength: 20.0,
    hasRamp: true,
    hasHoverboard: true,
    playerLane: 0,
    entryState: 'GROUND_APPROACH',
    fps: 60
  }, 1.5);

  assert(outcome.reachedRoof, 'Hoverboard climbed ramp to roof');
  assert(!outcome.crashed, 'Hoverboard was not destroyed during valid ramp climb');
  assert(player.hoverboardManager.isBoardActive(), 'Hoverboard remained active');
}

// =========================================================================
// Suite 8: Climbing with Super Sneakers Active
// =========================================================================
console.log('\n--- Suite 8: Climbing with Super Sneakers Active ---');
{
  const { trackManager, player, runner } = createEnv();

  const outcome = runner.runScenario(player, trackManager, {
    trainType: 'TRAIN',
    trainLength: 20.0,
    hasRamp: true,
    hasSuperSneakers: true,
    playerLane: 0,
    entryState: 'GROUND_APPROACH',
    fps: 60
  }, 1.5);

  assert(outcome.reachedRoof, 'Super Sneakers runner climbed ramp to roof');
  assert(!outcome.crashed, 'Super Sneakers runner did not crash');
}

// =========================================================================
// Suite 9: Reaching a Ramp While Jumping & Landing on Slope
// =========================================================================
console.log('\n--- Suite 9: Reaching Ramp While Jumping ---');
{
  const { trackManager, player, runner } = createEnv();
  // Train front at -20, ramp spans -12 to -20.
  // Player jumps in the air and descends onto ramp at Z = -16.0 (slope height Y = 2.175m)
  runner.setupScenario(player, trackManager, {
    trainType: 'TRAIN',
    trainLength: 20.0,
    hasRamp: true,
    playerLane: 0,
    entryState: 'GROUND_APPROACH',
    playerStartZ: -11.0
  });

  player.jump();
  assert(player.isJumping, 'Player jumped approaching ramp');

  // Step simulation forward
  stepGame(player, trackManager, 0.8, 60);

  assert(player.state === 'ON_TRAIN' || player.state === 'CLIMBING', `Player landed on ramp/roof (state: ${player.state})`);
  assert(player.state !== 'CRASH', 'Jumping onto ramp slope lands cleanly without crashing');
}

// =========================================================================
// Suite 10: Fast Dropping Onto Train Roof
// =========================================================================
console.log('\n--- Suite 10: Fast Dropping Onto Train Roof ---');
{
  const { trackManager, player, runner } = createEnv();
  runner.setupScenario(player, trackManager, {
    trainType: 'TRAIN',
    trainLength: 22.0,
    hasRamp: true,
    playerLane: 0,
    entryState: 'JUMP_LANDING',
    playerStartY: 6.5,
    playerStartZ: -25.0
  });

  // Fast drop down swipe
  player.slide();
  assert(player.isFastDropping, 'Player triggered fast drop downward');

  stepGame(player, trackManager, 0.15, 60);

  assert(player.state === 'ON_TRAIN', `Fast drop captured by roof collider (got ${player.state})`);
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Support surface is TRAIN_ROOF');
  assert(Math.abs(player.position.y - 4.35) < 0.05, `Position snapped cleanly to roof (got ${player.position.y.toFixed(2)})`);
  assert(player.state !== 'CRASH', 'Fast drop onto roof did not crash');
}

// =========================================================================
// Suite 11: Landing on Moving Train Roof
// =========================================================================
console.log('\n--- Suite 11: Landing on Moving Train Roof ---');
{
  const { trackManager, player, runner } = createEnv();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_MOVING_TRAIN_ROOF',
    difficulty: 'HARD',
    obstacles: [{
      type: 'MOVING_TRAIN',
      lane: 0,
      zOffset: 45.0,
      length: 24.0,
      isMoving: true,
      velocityZ: CONSTANTS.MOVING_TRAIN_SPEED
    }],
    collectibles: []
  }, 0);

  // Position player in air directly above moving train
  player.position.set(0, 5.2, -35.0);
  player.previousPosition.set(0, 5.6, -33.5);
  player.isJumping = true;
  player.state = 'FALLING';
  player.verticalVelocity = -8.0;

  stepGame(player, trackManager, 0.1, 60);

  assert(player.state === 'ON_TRAIN', `Landed cleanly on moving train roof (got ${player.state})`);
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Support is TRAIN_ROOF');
  assert(player.getActiveSupportObstacleId() === chunk.obstacles[0].id, 'Bound to moving train ID');
  assert(player.state !== 'CRASH', 'Landed on moving train without dying');
}

// =========================================================================
// Suite 12: Jumping Between Two Accessible Train Roofs
// =========================================================================
console.log('\n--- Suite 12: Jumping Between Two Accessible Train Roofs ---');
{
  const { trackManager, player } = createEnv();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  // Train 1: Lane -1, Z: -45 to -15 (length 30, center -30)
  // Train 2: Lane 0,  Z: -45 to -15 (length 30, center -30)
  chunk.populate({
    name: 'TEST_PARALLEL_TRAINS',
    difficulty: 'MEDIUM',
    obstacles: [
      { type: 'TRAIN', lane: -1, zOffset: 30.0, length: 30.0 },
      { type: 'TRAIN', lane: 0, zOffset: 30.0, length: 30.0 }
    ],
    collectibles: []
  }, 0);

  const train1 = chunk.obstacles[0];
  const train2 = chunk.obstacles[1];

  // Start on Train 1 roof in lane -1 at front of roof
  player.currentLane = -1;
  player.targetLane = -1;
  player.position.set(CONSTANTS.LANES[-1], 4.35, -20.0);
  player.previousPosition.copy(player.position);
  player.resolveRoofLanding(4.35, train1.id);
  assert(player.getActiveSupportObstacleId() === train1.id, 'Initially supported by Train 1');

  // Jump and switch lane to lane 0 (Train 2)
  player.jump();
  player.handleInput('RIGHT');

  // Step through jump & lane transition (covers ~0.65s, travels ~11.7m to Z = -31.7m)
  stepGame(player, trackManager, 0.65, 60);

  assert(player.state === 'ON_TRAIN', `Landed on second train roof (got ${player.state})`);
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Support surface is TRAIN_ROOF');
  assert(player.getActiveSupportObstacleId() === train2.id, `Support cleanly transferred to Train 2 ID (got ${player.getActiveSupportObstacleId()})`);
  assert(player.state !== 'CRASH', 'Roof-to-roof transfer did not crash');
}

// =========================================================================
// Suite 13: Approaching Non-Climbable Train Head-On (MUST DIE)
// =========================================================================
console.log('\n--- Suite 13: Approaching Non-Climbable Train Head-On (Must Cause Fatal Collision) ---');
{
  const { trackManager, player, runner } = createEnv();
  const outcome = runner.runScenario(player, trackManager, {
    trainType: 'TRAIN',
    trainLength: 20.0,
    hasRamp: false,
    playerLane: 0,
    entryState: 'GROUND_APPROACH',
    fps: 60
  }, 1.2);

  assert(outcome.crashed, 'Head-on impact with train without ramp triggered CRASH');
  assert(player.state === 'CRASH', `Player state is CRASH (got ${player.state})`);
}

// =========================================================================
// Suite 14: Colliding with Another Train While Already on a Train Roof
// (CRITICAL REQUIREMENT C: Support does not exempt other trains!)
// =========================================================================
console.log('\n--- Suite 14: Collision with Another Train While on a Train Roof ---');
{
  // 14A: Player on Train A's roof stepping off into another train B without a ramp
  const { trackManager, player } = createEnv();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  // Train A: Lane 0, from Z = -8 to Z = -24 (length 16, center -16, has ramp from -8 to 0)
  // Train B: Lane 0, from Z = -38 to Z = -54 (length 16, center -46, NO ramp! 14m gap after Train A)
  chunk.populate({
    name: 'TEST_ROOF_COLLISION_ISOLATION',
    difficulty: 'HARD',
    obstacles: [
      { type: 'TRAIN', lane: 0, zOffset: 16.0, length: 16.0, hasRamp: true },
      { type: 'TRAIN', lane: 0, zOffset: 46.0, length: 16.0, hasRamp: false }
    ],
    collectibles: []
  }, 0);

  const trainA = chunk.obstacles[0];
  const trainB = chunk.obstacles[1];

  // Start on Train A roof
  player.position.set(0, 4.35, -20.0);
  player.resolveRoofLanding(4.35, trainA.id);
  assert(player.getActiveSupportObstacleId() === trainA.id, 'Supported by Train A');

  // Run forward off Train A's roof (Z = -24), fall to ground, and impact Train B's front bumper (Z = -38)
  stepGame(player, trackManager, 1.1, 60);

  // Being supported previously by Train A must NOT exempt Train B from fatal collision!
  assert(player.state === 'CRASH', `Stepping off Train A into non-traversable Train B triggered CRASH (got ${player.state})`);
  assert(player.getActiveSupportObstacleId() !== trainB.id, 'Train B did not erroneously grant support');
}
{
  // 14B: Player climbing Train A in Lane 0 lane-switching into Train B in Lane 1
  const { trackManager, player } = createEnv();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_ADJACENT_TRAIN_COLLISION',
    difficulty: 'HARD',
    obstacles: [
      { type: 'TRAIN', lane: 0, zOffset: 24.0, length: 24.0, hasRamp: true },
      { type: 'TRAIN', lane: 1, zOffset: 24.0, length: 24.0, hasRamp: false }
    ],
    collectibles: []
  }, 0);

  const trainA = chunk.obstacles[0];
  const trainB = chunk.obstacles[1];

  // Position player climbing ramp of Train A at Y = 2.0 (below roof)
  player.position.set(CONSTANTS.LANES[0], 2.0, -14.0);
  player.setSupportSurface('RAMP', trainA.id);
  player.state = 'CLIMBING';

  // Player attempts to switch into Lane 1 where Train B's solid hull is located
  player.handleInput('RIGHT');
  stepGame(player, trackManager, 0.4, 60);

  // Player must collide with Train B (flank collision bounce/stumble or crash)
  assert(chunk.chunkHadCollision, 'Climbing Train A does NOT exempt collision with adjacent Train B in Lane 1');
}

// =========================================================================
// Suite 15: Recycled Trains Maintaining Correct Collider and Support Data
// =========================================================================
console.log('\n--- Suite 15: Recycled Train Instance Integrity ---');
{
  const { trackManager, player, runner } = createEnv();
  const chunk = trackManager.chunks[0];

  // Populate first time with ramp train
  runner.setupScenario(player, trackManager, {
    trainType: 'TRAIN',
    trainLength: 20.0,
    hasRamp: true,
    playerLane: 0
  });
  const id1 = chunk.obstacles[0].id;

  // Clear and recycle chunk with new pattern
  chunk.populate({
    name: 'RECYCLED_CHUNK',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 1, zOffset: 30.0, length: 24.0, hasRamp: true }],
    collectibles: []
  }, -120);

  const id2 = chunk.obstacles[0].id;
  assert(id1 !== id2, `Recycled train generated fresh unique ID (${id2} vs ${id1})`);
  assert(chunk.obstacles[0].rampCollider !== undefined, 'Recycled train possesses valid ramp collider');
  assert(chunk.obstacles[0].rampStartZ !== undefined, 'Recycled train possesses valid rampStartZ');
  assert(Math.abs((chunk.obstacles[0].roofSurfaceY || 0) - 4.35) < 0.001, 'Recycled train has 4.35m roofSurfaceY');
}

// =========================================================================
// Suite 16: Behavior at 30, 60, and 120 FPS
// =========================================================================
console.log('\n--- Suite 16: Behavior Across Framerates (30, 60, 120 FPS) ---');
const frameRates = [30, 60, 120];
for (const fps of frameRates) {
  const { trackManager, player, runner } = createEnv();
  const outcome = runner.runScenario(player, trackManager, {
    trainType: 'TRAIN',
    trainLength: 22.0,
    hasRamp: true,
    playerLane: 0,
    entryState: 'GROUND_APPROACH',
    fps
  }, 1.6);

  assert(outcome.reachedRoof, `Clean ramp climb onto roof at ${fps} FPS`);
  assert(!outcome.crashed, `Zero collisions at ${fps} FPS`);
}

// =========================================================================
// Suite 17: Explicit TRAIN_RAMP Type Validation
// =========================================================================
console.log('\n--- Suite 17: Explicit TRAIN_RAMP ObstacleType Support ---');
{
  const { trackManager, player, runner } = createEnv();
  const outcome = runner.runScenario(player, trackManager, {
    trainType: 'TRAIN_RAMP',
    trainLength: 22.0,
    hasRamp: true,
    playerLane: 0,
    entryState: 'GROUND_APPROACH',
    fps: 60
  }, 1.6);

  assert(outcome.climbedRamp, 'TRAIN_RAMP type climbed ramp successfully');
  assert(outcome.reachedRoof, 'TRAIN_RAMP type reached roof');
  assert(!outcome.crashed, 'TRAIN_RAMP type did not cause crash');
}

// =========================================================================
// Suite 18: All Train Visual Variants (Modern, Classic, Streamlined)
// =========================================================================
console.log('\n--- Suite 18: Testing All Train Visual Variants ---');
const variants: TrainVariant[] = ['MODERN_METRO', 'CLASSIC_TRANSIT', 'STREAMLINED_EXPRESS'];
for (const variant of variants) {
  const { trackManager, player } = createEnv();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: `TEST_${variant}`,
    difficulty: 'MEDIUM',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 30.0, length: 20.0, hasRamp: true }],
    collectibles: []
  }, 0);

  // Set variant explicitly
  chunk.obstacles[0].variant = variant;

  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -13.0);
  stepGame(player, trackManager, 1.2, 60);

  assert(player.state === 'ON_TRAIN', `Variant ${variant} climbed successfully onto roof`);
  assert(player.getSupportSurface() === 'TRAIN_ROOF', `Variant ${variant} has TRAIN_ROOF support`);
  assert(player.state !== 'CRASH', `Variant ${variant} zero collision crashes`);
}

// =========================================================================
// Summary
// =========================================================================
console.log('\n================================================================');
console.log(`🎉 ALL ${passedTests} / ${totalTests} TRAIN CLIMBING & COLLISION TESTS PASSED!`);
console.log('================================================================\n');
