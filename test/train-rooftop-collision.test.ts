import * as THREE from 'three';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { TrackChunk } from '../src/track/TrackChunk';
import { CONSTANTS } from '../src/core/Constants';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { CollectibleFactory } from '../src/track/CollectibleFactory';

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

console.log('🧪 Starting 20-Scenario Train Rooftop Collision & Traversal Suite...\n');

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

// Helper to step physics simulation
function stepGame(player: Player, trackManager: TrackManager, duration: number, fps: number = 60) {
  const dt = 1.0 / fps;
  let elapsed = 0;
  while (elapsed < duration) {
    player.update(dt);
    trackManager.update(player, dt, elapsed);
    elapsed += dt;
  }
}

// Mock Scene setup
function createTestEnvironment() {
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);
  for (const c of trackManager.chunks) {
    c.clearDynamicItems();
  }
  const player = new Player();
  player.reset();
  return { scene, trackManager, player };
}

// =========================================================================
// Test 1: Landing correctly on a stationary train roof
// =========================================================================
console.log('--- Test 1: Landing Correctly on Stationary Train Roof ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  // Spawn stationary train at zOffset = 30m in lane 0 (worldCenterZ = -30m)
  chunk.populate({
    name: 'TEST_STATIONARY_TRAIN',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 30.0, length: 20.0 }],
    collectibles: []
  }, 0);

  // Position player directly above train roof descending from jump
  // Train is at lane 0, Z from -40 to -20, height 4.2m (roofSurfaceY 4.35m)
  player.position.set(0, 5.0, -28.0);
  player.previousPosition.set(0, 5.4, -26.0);
  player.isJumping = true;
  player.state = 'FALLING';
  player.verticalVelocity = -8.0;

  // Step simulation 5 frames to land
  stepGame(player, trackManager, 0.1, 60);

  assert(player.state === 'ON_TRAIN', `Player state is ON_TRAIN (got ${player.state})`);
  assert(player.getSupportSurface() === 'TRAIN_ROOF', `Support surface is TRAIN_ROOF (got ${player.getSupportSurface()})`);
  assert(Math.abs(player.position.y - 4.35) < 0.05, `Player Y resolved to roof height 4.35m (got ${player.position.y.toFixed(2)})`);
  assert(player.verticalVelocity === 0, `Vertical velocity resolved to 0 upon landing (got ${player.verticalVelocity})`);
  assert(player.state !== 'CRASH', 'Player did NOT trigger fatal crash on valid roof landing');
}

// =========================================================================
// Test 2: Landing correctly on a moving train roof
// =========================================================================
console.log('\n--- Test 2: Landing Correctly on Moving Train Roof ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_MOVING_TRAIN',
    difficulty: 'MEDIUM',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 45.0, length: 24.0 }],
    collectibles: []
  }, 0);

  // Advance moving train toward player
  chunk.update(0.5, 0.5, player.position.z);

  const trainObs = chunk.obstacles[0];
  const trainFrontZ = trainObs.collider.max.z;

  // Position player descending right over the oncoming train body
  player.position.set(0, 4.9, trainFrontZ - 8.0);
  player.previousPosition.set(0, 5.2, trainFrontZ - 6.0);
  player.isJumping = true;
  player.state = 'FALLING';
  player.verticalVelocity = -6.0;

  stepGame(player, trackManager, 0.1, 60);

  assert(player.state === 'ON_TRAIN', `Player successfully landed on moving train roof (got ${player.state})`);
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Support surface is TRAIN_ROOF on moving train');
  assert(Math.abs(player.position.y - 4.35) < 0.05, `Player height sits firmly at 4.35m (got ${player.position.y})`);
}

// =========================================================================
// Test 3: Running across the length of a train
// =========================================================================
console.log('\n--- Test 3: Running Across Length of Train ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  // Long 30m train at zOffset = 40 (covers Z: -55 to -25)
  chunk.populate({
    name: 'TEST_LONG_TRAIN',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 40.0, length: 30.0 }],
    collectibles: []
  }, 0);

  // Start player on train roof at front
  player.position.set(0, 4.35, -28.0);
  player.resolveRoofLanding(4.35);

  // Run forward for 1.0 second (~18 meters)
  stepGame(player, trackManager, 1.0, 60);

  assert(player.state === 'ON_TRAIN', `Player remains smoothly in ON_TRAIN state across train (got ${player.state})`);
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Player remains supported by TRAIN_ROOF');
  assert(Math.abs(player.position.y - 4.35) < 0.05, `Height remains stable at 4.35m without sinking (got ${player.position.y})`);
  assert(player.state !== 'CRASH', 'Zero random deaths while running along roof');
}

// =========================================================================
// Test 4: Jumping from one roof to another
// =========================================================================
console.log('\n--- Test 4: Jumping From One Roof to Another ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  // Train 1: Z: -35 to -20 (length 15)
  // Train 2: Z: -60 to -45 (length 15) -> 10m gap between them
  chunk.populate({
    name: 'TEST_DUAL_ROOFS',
    difficulty: 'MEDIUM',
    obstacles: [
      { type: 'TRAIN', lane: 0, zOffset: 27.5, length: 15.0 },
      { type: 'TRAIN', lane: 0, zOffset: 52.5, length: 15.0 }
    ],
    collectibles: []
  }, 0);

  // Player at rear of Train 1
  player.position.set(0, 4.35, -34.0);
  player.resolveRoofLanding(4.35);
  player.speed = 22.0;

  // Jump off Train 1 across gap
  player.handleInput('UP');
  assert(player.state === 'JUMP', 'Player initiates jump from Train 1');
  assert(player.verticalVelocity > 0, 'Vertical velocity is positive on jump');

  // Step 0.75s to complete full jump arc across 10m gap and land on Train 2
  stepGame(player, trackManager, 0.75, 60);

  assert(player.state === 'ON_TRAIN', `Player successfully landed on Train 2 roof (got ${player.state})`);
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Support surface is TRAIN_ROOF on Train 2');
  assert(Math.abs(player.position.y - 4.35) < 0.05, `Player height resolved to 4.35m on Train 2 (got ${player.position.y})`);
}

// =========================================================================
// Test 5: Jumping off a train safely
// =========================================================================
console.log('\n--- Test 5: Jumping Off a Train to Ground ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  // Train ends at Z = -35m
  chunk.populate({
    name: 'TEST_JUMP_OFF',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 25.0, length: 20.0 }],
    collectibles: []
  }, 0);

  player.position.set(0, 4.35, -34.0);
  player.resolveRoofLanding(4.35);

  // Jump off rear into clear track ahead (jump takes ~0.95s to reach track level 0.9m)
  player.handleInput('UP');
  stepGame(player, trackManager, 1.05, 60);

  assert(player.state === 'RUN', `Player landed safely on ground (got ${player.state})`);
  assert(player.getSupportSurface() === 'GROUND', 'Support surface is now GROUND');
  assert(Math.abs(player.position.y - CONSTANTS.PLAYER_BASE_Y) < 0.05, `Player back at ground 0.9m (got ${player.position.y})`);
}

// =========================================================================
// Test 6: Falling safely to an available track (Walking off edge)
// =========================================================================
console.log('\n--- Test 6: Falling Safely From Train Edge to Railway Track ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  // Train spans Z: -40 to -20
  chunk.populate({
    name: 'TEST_WALK_OFF',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 30.0, length: 20.0 }],
    collectibles: []
  }, 0);

  // Start runner near rear edge without jumping
  player.position.set(0, 4.35, -39.0);
  player.resolveRoofLanding(4.35);

  // Step 0.1s to walk off edge (Z goes past -40.5)
  stepGame(player, trackManager, 0.1, 60);

  assert(player.state === 'FALLING_FROM_TRAIN' || player.state === 'FALLING', `Player transitions to falling state upon walking off edge (got ${player.state})`);
  assert(player.getSupportSurface() === 'GROUND', 'Support surface returns to GROUND');

  // Step another 0.6s to descend under gravity to track
  stepGame(player, trackManager, 0.6, 60);

  assert(player.state === 'RUN', `Player lands safely on track after fall (got ${player.state})`);
  assert(Math.abs(player.position.y - CONSTANTS.PLAYER_BASE_Y) < 0.05, 'Player feet at ground level 0.9m');
  assert(player.state !== 'CRASH', 'Walking off train roof onto empty track is 100% survivable');
}

// =========================================================================
// Test 7: Switching lanes while airborne
// =========================================================================
console.log('\n--- Test 7: Switching Lanes While Airborne Between Trains ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  // Train in Lane 0 and Train in Lane 1 side by side
  chunk.populate({
    name: 'TEST_PARALLEL_TRAINS',
    difficulty: 'MEDIUM',
    obstacles: [
      { type: 'TRAIN', lane: 0, zOffset: 35.0, length: 24.0 },
      { type: 'TRAIN', lane: 1, zOffset: 35.0, length: 24.0 }
    ],
    collectibles: []
  }, 0);

  // On roof in Lane 0
  player.position.set(0, 4.35, -28.0);
  player.resolveRoofLanding(4.35);

  // Jump up and swipe Right into Lane 1
  player.handleInput('UP');
  player.handleInput('RIGHT');

  // Step 0.75s to complete lateral switch and land on adjacent train
  stepGame(player, trackManager, 0.75, 60);

  assert(player.currentLane === 1, `Player switched to Lane 1 while airborne (got lane ${player.currentLane})`);
  assert(player.state === 'ON_TRAIN', `Player landed on adjacent train roof (got ${player.state})`);
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Support surface is TRAIN_ROOF in lane 1');
  assert(player.state !== 'CRASH', 'Airborne lane switch between trains completed without collision');
}

// =========================================================================
// Test 8: Sliding while on a train roof
// =========================================================================
console.log('\n--- Test 8: Sliding While On Train Roof ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_ROOF_SLIDE',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 35.0, length: 26.0 }],
    collectibles: []
  }, 0);

  player.position.set(0, 4.35, -28.0);
  player.resolveRoofLanding(4.35);

  // Slide while on roof
  player.handleInput('DOWN');

  assert(player.isSliding, 'Player is actively sliding');
  assert(player.state === 'SLIDE', 'Player state is SLIDE');
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Support surface remains TRAIN_ROOF');
  assert(Math.abs(player.position.y - 4.35) < 0.05, 'Player remains at 4.35m during roof slide');

  // Step through slide completion (0.7s)
  stepGame(player, trackManager, 0.7, 60);

  assert(!player.isSliding, 'Slide successfully completed');
  assert(player.state === 'ON_TRAIN', `Player resumes ON_TRAIN sprint after slide (got ${player.state})`);
}

// =========================================================================
// Test 9: Running into a train front (at track level)
// =========================================================================
console.log('\n--- Test 9: Running Into Train Front Hazard ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  // Train without ramp in Lane 0 at zOffset = 30 (front at Z = -20)
  chunk.populate({
    name: 'TEST_TRAIN_FRONT_HAZARD',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 30.0, length: 20.0, hasRamp: false }],
    collectibles: []
  }, 0);

  // Player running at ground level Y = 0.9m toward front
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -18.0);
  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -18.0);

  // Step forward into train front
  stepGame(player, trackManager, 0.2, 60);

  assert(player.state === 'CRASH', `Player crashes when hitting train front at unsafe height (got ${player.state})`);
}

// =========================================================================
// Test 10: Hitting a train from the side
// =========================================================================
console.log('\n--- Test 10: Hitting Train From The Side (Flank Stumble vs Impact) ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  // Train in Lane 1
  chunk.populate({
    name: 'TEST_TRAIN_SIDE',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 1, zOffset: 30.0, length: 20.0 }],
    collectibles: []
  }, 0);

  // Player in Lane 0 running alongside train at ground level
  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -30.0);

  // Switch right directly into train body
  player.handleInput('RIGHT');

  // Step until glancing collision occurs
  stepGame(player, trackManager, 0.1, 60);

  assert(player.isStumbling, 'Glancing side impact triggers non-fatal stumble');
  assert(player.state !== 'CRASH', 'Glancing side collision does not kill player');
}

// =========================================================================
// Test 11: Landing close to front roof edge
// =========================================================================
console.log('\n--- Test 11: Landing Close to Front Roof Edge ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  // Train spans Z: -40 to -20 (front edge is Z = -20)
  chunk.populate({
    name: 'TEST_FRONT_EDGE',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 30.0, length: 20.0 }],
    collectibles: []
  }, 0);

  // Player lands within 0.15m of front edge
  player.position.set(0, 4.8, -20.15);
  player.previousPosition.set(0, 5.2, -19.5);
  player.isJumping = true;
  player.state = 'FALLING';
  player.verticalVelocity = -8.0;

  stepGame(player, trackManager, 0.1, 60);

  assert(player.state === 'ON_TRAIN', `Front edge landing captured successfully (got ${player.state})`);
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Support surface is TRAIN_ROOF');
  assert(Math.abs(player.position.y - 4.35) < 0.05, `Height resolved cleanly to 4.35m (got ${player.position.y})`);
}

// =========================================================================
// Test 12: Landing close to rear roof edge
// =========================================================================
console.log('\n--- Test 12: Landing Close to Rear Roof Edge ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  // Train spans Z: -40 to -20 (rear edge is Z = -40)
  chunk.populate({
    name: 'TEST_REAR_EDGE',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 30.0, length: 20.0 }],
    collectibles: []
  }, 0);

  // Player descending toward rear edge (train rear edge is at Z = -40.0m)
  player.position.set(0, 4.6, -38.8);
  player.previousPosition.set(0, 5.0, -38.0);
  player.isJumping = true;
  player.state = 'FALLING';
  player.verticalVelocity = -6.0;

  // Step 3 frames (0.05s) to land right near rear edge at Z = -39.7m
  stepGame(player, trackManager, 0.05, 60);

  assert(player.state === 'ON_TRAIN', `Rear edge landing captured cleanly (got ${player.state})`);
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Support surface is TRAIN_ROOF');
}

// =========================================================================
// Test 13: Seamless ramp-to-roof climb without lethal junction collision
// =========================================================================
console.log('\n--- Test 13: Seamless Ramp Climb Onto Train Roof ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  // Train with ramp: Train spans Z: -40 to -20; Ramp spans Z: -20 to -12
  chunk.populate({
    name: 'TEST_RAMP_CLIMB',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 30.0, length: 20.0, hasRamp: true }],
    collectibles: []
  }, 0);

  // Position player running up ramp from base (Z = -12.5m)
  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -12.5);

  // Step through ramp climb (run 18 m/s for 0.7s -> covers 12.6m, passing ramp top at Z = -20 onto roof)
  stepGame(player, trackManager, 0.7, 60);

  assert(player.state === 'ON_TRAIN', `Player successfully climbed ramp onto roof (got ${player.state})`);
  assert(player.getSupportSurface() === 'TRAIN_ROOF', `Support surface transitioned from RAMP to TRAIN_ROOF (got ${player.getSupportSurface()})`);
  assert(Math.abs(player.position.y - 4.35) < 0.05, `Height smoothly reached 4.35m (got ${player.position.y.toFixed(2)})`);
  assert(player.state !== 'CRASH', 'Zero deaths at the ramp-train junction!');
}

// =========================================================================
// Test 14: Activating hoverboard on a train
// =========================================================================
console.log('\n--- Test 14: Activating Hoverboard While On Train Roof ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_ROOF_HOVERBOARD',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 35.0, length: 26.0 }],
    collectibles: []
  }, 0);

  player.position.set(0, 4.35, -28.0);
  player.resolveRoofLanding(4.35);

  // Deploy hoverboard
  player.hoverboardManager.activate();
  assert(player.hoverboardManager.isBoardActive(), 'Hoverboard is active on train roof');

  stepGame(player, trackManager, 0.5, 60);

  assert(player.state === 'ON_TRAIN', 'Player remains in ON_TRAIN state while surfing');
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Support surface remains TRAIN_ROOF');
  assert(Math.abs(player.position.y - 4.35) < 0.05, 'Height remains 4.35m');
}

// =========================================================================
// Test 15: Using Super Sneakers during rooftop jump
// =========================================================================
console.log('\n--- Test 15: Using Super Sneakers During Rooftop Jump ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_SNEAKERS_ROOF',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 40.0, length: 30.0 }],
    collectibles: []
  }, 0);

  player.position.set(0, 4.35, -28.0);
  player.resolveRoofLanding(4.35);

  // Activate Super Sneakers
  player.powerups.activate('SNEAKERS');
  player.handleInput('UP');

  // Initial jump velocity boosted
  assert(player.verticalVelocity > CONSTANTS.JUMP_INITIAL_VELOCITY, 'Sneakers boosted rooftop jump takeoff velocity');

  // Step 0.3s to reach apex (height > 6.0m)
  stepGame(player, trackManager, 0.3, 60);
  assert(player.position.y > 6.0, `Rooftop high jump reached apex > 6.0m (got ${player.position.y.toFixed(2)}m)`);

  // Step 0.7s to descend and land back on roof
  stepGame(player, trackManager, 0.7, 60);
  assert(player.state === 'ON_TRAIN', `Player landed back on train roof after sneaker jump (got ${player.state})`);
  assert(Math.abs(player.position.y - 4.35) < 0.05, 'Height resolved back to 4.35m');
}

// =========================================================================
// Test 16: Experiencing a collision while shielded
// =========================================================================
console.log('\n--- Test 16: Collision Absorbed While Shielded ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_SHIELD_COLLISION',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 25.0, length: 18.0, hasRamp: false }],
    collectibles: []
  }, 0);

  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -15.0);
  player.powerups.activate('SHIELD');
  assert(player.powerups.hasShieldActive(), 'Shield is active');

  // Run into train front
  stepGame(player, trackManager, 0.2, 60);

  assert(!player.powerups.hasShieldActive(), 'Shield was consumed to absorb impact');
  assert(player.state !== 'CRASH', 'Player survived train impact thanks to shield');
}

// =========================================================================
// Test 17: Running at minimum and maximum configured speeds
// =========================================================================
console.log('\n--- Test 17: Rooftop Traversal at Min and Max Speeds ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_SPEED_BOUNDS',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 60.0, length: 60.0 }],
    collectibles: []
  }, 0);

  // Test at MIN speed (18 m/s)
  player.speed = CONSTANTS.INITIAL_SPEED;
  player.position.set(0, 4.35, -35.0);
  player.resolveRoofLanding(4.35);
  stepGame(player, trackManager, 0.5, 60);
  assert(player.state === 'ON_TRAIN', 'Stable at min speed 18 m/s');

  // Test at MAX speed (38 m/s)
  player.speed = CONSTANTS.MAX_SPEED;
  stepGame(player, trackManager, 0.5, 60);
  assert(player.state === 'ON_TRAIN', 'Stable at max speed 38 m/s');
  assert(player.state !== 'CRASH', 'No tunneling or collisions at 38 m/s');
}

// =========================================================================
// Test 18: Running at simulated 30, 60 and 120 FPS
// =========================================================================
console.log('\n--- Test 18: Frame-Rate Invariance (30, 60, 120 FPS) ---');
{
  const fpsList = [30, 60, 120];

  for (const fps of fpsList) {
    const { trackManager, player } = createTestEnvironment();
    const chunk = trackManager.chunks[0];
    chunk.chunkZ = 0;
    chunk.clearDynamicItems();

    chunk.populate({
      name: `TEST_FPS_${fps}`,
      difficulty: 'EASY',
      obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 30.0, length: 20.0 }],
      collectibles: []
    }, 0);

    // Jump onto roof at specified FPS
    player.position.set(0, 5.0, -28.0);
    player.previousPosition.set(0, 5.5, -26.0);
    player.isJumping = true;
    player.state = 'FALLING';
    player.verticalVelocity = -8.0;

    stepGame(player, trackManager, 0.15, fps);

    assert(player.state === 'ON_TRAIN', `Landing succeeded at ${fps} FPS without tunneling (got ${player.state})`);
    assert(Math.abs(player.position.y - 4.35) < 0.05, `Height is 4.35m at ${fps} FPS`);
  }
}

// =========================================================================
// Test 19: Restarting the game and repeating rooftop traversal
// =========================================================================
console.log('\n--- Test 19: Game Restart & Repeat Rooftop Traversal ---');
{
  const { trackManager, player } = createTestEnvironment();

  // Run 1: Land on train
  trackManager.reset();
  player.reset();
  player.resolveRoofLanding(4.35);
  assert(player.state === 'ON_TRAIN', 'Run 1 on train');

  // Trigger game restart
  trackManager.reset();
  player.reset();

  assert(player.state === 'RUN', 'State reset to RUN');
  assert(player.getSupportSurface() === 'GROUND', 'Support surface reset to GROUND');
  assert(player.position.y === CONSTANTS.PLAYER_BASE_Y, 'Position reset to 0.9m');

  // Run 2: Land on train again
  player.resolveRoofLanding(4.35);
  assert(player.state === 'ON_TRAIN', 'Run 2 on train succeeds after restart');
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Support surface is TRAIN_ROOF');
}

// =========================================================================
// Test 20: Multi-chunk generation and fairness reachability
// =========================================================================
console.log('\n--- Test 20: Multi-Chunk Traversal & Coordinate Alignment in Chunks > 0 ---');
{
  const { trackManager, player } = createTestEnvironment();

  // Verify chunk 1 (Z: -80 to -160) obstacle coordinates
  const chunk1 = trackManager.chunks[1];
  chunk1.clearDynamicItems();
  chunk1.populate({
    name: 'TEST_CHUNK_1_TRAIN',
    difficulty: 'MEDIUM',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 25.0, length: 20.0, hasRamp: true }],
    collectibles: []
  }, -80.0);

  const obs = chunk1.obstacles[0];
  // World Center Z should be -80 + (-25) = -105m!
  assert(Math.abs(obs.collider.min.z - (-115)) < 0.1, `Chunk 1 collider.min.z is in world space: -115m (got ${obs.collider.min.z})`);
  assert(Math.abs(obs.collider.max.z - (-95)) < 0.1, `Chunk 1 collider.max.z is in world space: -95m (got ${obs.collider.max.z})`);
  assert(obs.roofCollider !== undefined, 'Chunk 1 train has roofCollider');
  assert(Math.abs(obs.roofCollider!.max.z - (-94.7)) < 0.5, `Chunk 1 roofCollider is in world space: -95m (got ${obs.roofCollider!.max.z})`);

  // Move player into Chunk 1 on the ramp (Z = -93m)
  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -93.0);

  // Step simulation through ramp climb in Chunk 1
  stepGame(player, trackManager, 0.4, 60);

  assert(player.state === 'ON_TRAIN', `Player successfully climbed ramp in Chunk 1 (> 0m) onto roof! (got ${player.state})`);
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Chunk 1 supportSurface is TRAIN_ROOF');
  assert(Math.abs(player.position.y - 4.35) < 0.05, `Chunk 1 roof height is 4.35m (got ${player.position.y})`);
}

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${passedTests}/${totalTests} TRAIN ROOFTOP COLLISION TESTS PASSED!`);
console.log(`=======================================================\n`);
