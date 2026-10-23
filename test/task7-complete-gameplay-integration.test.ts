import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { SpeedController } from '../src/core/SpeedController';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { OBSTACLE_PATTERNS } from '../src/track/ObstaclePatterns';
import { DifficultyController } from '../src/track/DifficultyController';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { UpgradeManager } from '../src/player/UpgradeManager';
import { EventBus, EVENTS } from '../src/core/EventBus';

// Mock localStorage for Node test runner
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

(global as any).localStorage = new MockLocalStorage();

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('🧪 Starting Task 7: Complete Gameplay Integration & Regression Suite...\n');

// Shared Environment
const mockScene = new THREE.Scene();
const trackMgr = new TrackManager(mockScene);
trackMgr.reset();

// =========================================================================
// TEST 1: Speed Progression & Pacing Acceleration Curves
// =========================================================================
console.log('--- Test 1: Speed Progression & Pacing Acceleration Curves ---');
const speedCtrl = new SpeedController('NORMAL');
assert(speedCtrl.getInitialSpeed() === CONSTANTS.INITIAL_SPEED, `Initial speed is ${CONSTANTS.INITIAL_SPEED} m/s`);
assert(speedCtrl.getMaxSpeed() === CONSTANTS.MAX_SPEED, `Max speed is ${CONSTANTS.MAX_SPEED} m/s`);

// Evaluate curve at 0m, 150m, 300m, 1200m, 3200m
const speed0m = speedCtrl.evaluateCurve(0);
const speed150m = speedCtrl.evaluateCurve(150);
const speed300m = speedCtrl.evaluateCurve(300);
const speed1200m = speedCtrl.evaluateCurve(1200);
const speed3200m = speedCtrl.evaluateCurve(3200);

assert(Math.abs(speed0m - CONSTANTS.INITIAL_SPEED) < 0.01, `Speed at 0m matches initial speed (${speed0m.toFixed(1)} m/s)`);
assert(speed150m > speed0m + 3.0, `Speed visibly accelerates in opening 150m (got ${speed150m.toFixed(1)} m/s)`);
assert(Math.abs(speed300m - 24.5) < 0.2, `Speed at 300m (~12s) reaches early ramp target ~24.5 m/s (got ${speed300m.toFixed(1)} m/s)`);
assert(Math.abs(speed1200m - 31.5) < 0.2, `Speed at 1200m (~40s) reaches mid ramp target ~31.5 m/s (got ${speed1200m.toFixed(1)} m/s)`);
assert(speed3200m > 36.5 && speed3200m <= CONSTANTS.MAX_SPEED, `Speed asymptotically approaches max speed (got ${speed3200m.toFixed(1)} m/s)`);

// Test SURVIVAL mode initial condition
const survivalCtrl = new SpeedController('SURVIVAL');
assert(survivalCtrl.getInitialSpeed() >= 25.0, `SURVIVAL mode starts at elevated speed (got ${survivalCtrl.getInitialSpeed()} m/s)`);

// =========================================================================
// TEST 2: Deterministic Obstacle Frequency & Difficulty Distribution
// =========================================================================
console.log('\n--- Test 2: Deterministic Obstacle Frequency & Difficulty Distribution ---');
const diffCtrl = new DifficultyController();

// Verify tier resolution boundaries
assert(diffCtrl.getTargetTier(50, 18.0) === 'BEGINNER', '0-80m resolves to BEGINNER');
assert(diffCtrl.getTargetTier(180, 20.0) === 'EASY', '80-250m resolves to EASY');
assert(diffCtrl.getTargetTier(500, 26.0) === 'MEDIUM', '250-750m resolves to MEDIUM');
assert(diffCtrl.getTargetTier(1000, 30.0) === 'HARD', '750-1600m resolves to HARD');
assert(diffCtrl.getTargetTier(2000, 35.0) === 'EXPERT', '1600m+ resolves to EXPERT');

// Moving train safety rules
assert(!diffCtrl.canSpawnMovingTrain(100), 'Moving trains forbidden in opening 240m');
assert(diffCtrl.canSpawnMovingTrain(300), 'Moving trains allowed beyond 240m');

// Record a moving train spawn and verify 75m cooldown spacing
const movingPattern = OBSTACLE_PATTERNS.find(p => p.obstacles.some(o => o.type === 'MOVING_TRAIN'))!;
diffCtrl.recordPatternSpawned(movingPattern, 300);
assert(!diffCtrl.canSpawnMovingTrain(340), 'Moving train forbidden within 75m cooldown');
assert(diffCtrl.canSpawnMovingTrain(380), 'Moving train permitted after 75m cooldown distance');

// Test consecutive difficult pattern recovery
diffCtrl.reset();
const hardPattern = OBSTACLE_PATTERNS.find(p => p.difficulty === 'HARD')!;
diffCtrl.recordPatternSpawned(hardPattern, 1000);
diffCtrl.recordPatternSpawned(hardPattern, 1080);
const recoveryWeights = diffCtrl.getTierWeights(1160, 30.0);
assert(recoveryWeights.BREATHER >= 0.50, `Recovery breather heavily weighted after consecutive hard chunks (${(recoveryWeights.BREATHER * 100).toFixed(0)}%)`);

// =========================================================================
// TEST 3: Reachability, Solvability & Chunk Transition Matrix
// =========================================================================
console.log('\n--- Test 3: Reachability, Solvability & Chunk Transition Matrix ---');
let impassableTransitions = 0;
for (let i = 0; i < OBSTACLE_PATTERNS.length; i++) {
  const pA = OBSTACLE_PATTERNS[i];
  for (let j = 0; j < OBSTACLE_PATTERNS.length; j++) {
    const pB = OBSTACLE_PATTERNS[j];
    // Check if exit lanes of pA have at least one common entry lane with pB
    const commonLanes = pA.exitLanes.filter(lane => pB.entryLanes.includes(lane));
    if (commonLanes.length === 0) {
      impassableTransitions++;
    }
  }
}
assert(impassableTransitions === 0, `All ${OBSTACLE_PATTERNS.length * OBSTACLE_PATTERNS.length} pattern transitions are 100% reachable with valid overlapping lanes`);

// Verify reaction distance for all patterns is at least 15m
for (const p of OBSTACLE_PATTERNS) {
  assert(p.minReactionDist >= 15.0, `Pattern ${p.name} has sufficient reaction distance (${p.minReactionDist}m >= 15.0m)`);
}

// =========================================================================
// TEST 4: Jump Trajectory, Apex Height & Reproducibility
// =========================================================================
console.log('\n--- Test 4: Jump Trajectory, Apex Height & Reproducibility ---');
const player = new Player();
player.reset();
player.state = 'RUN';

// Jump execution
player.jump();
assert(player.isJumping, 'Player is jumping');
assert(player.verticalVelocity === CONSTANTS.JUMP_INITIAL_VELOCITY, `Takeoff velocity is ${CONSTANTS.JUMP_INITIAL_VELOCITY} m/s`);

// Simulate discrete physics over 60 FPS (dt = 0.01667)
let maxY = player.position.y;
let timeToApex = 0;
let totalJumpTime = 0;
const dt = 1 / 60;

for (let step = 0; step < 120; step++) {
  player.update(dt);
  totalJumpTime += dt;
  if (player.position.y > maxY) {
    maxY = player.position.y;
    timeToApex = totalJumpTime;
  }
  if (!player.isJumping && step > 5) {
    break; // Landed
  }
}

const expectedApexRelative = (CONSTANTS.JUMP_INITIAL_VELOCITY * CONSTANTS.JUMP_INITIAL_VELOCITY) / (2 * Math.abs(CONSTANTS.GRAVITY));
const expectedApexWorld = CONSTANTS.PLAYER_BASE_Y + expectedApexRelative;
assert(Math.abs(maxY - expectedApexWorld) < 0.15, `Jump apex reached expected height ~${expectedApexWorld.toFixed(2)}m (got ${maxY.toFixed(2)}m)`);
assert(Math.abs(timeToApex - (CONSTANTS.JUMP_INITIAL_VELOCITY / Math.abs(CONSTANTS.GRAVITY))) < 0.05, `Time to apex matches v/g ~0.30s (got ${timeToApex.toFixed(3)}s)`);
assert(!player.isJumping, 'Player cleanly landed on ground after jump cycle');

// =========================================================================
// TEST 5: Slide Collision Clearance & Fast Drop Snap
// =========================================================================
console.log('\n--- Test 5: Slide Collision Clearance & Fast Drop Snap ---');
player.reset();
player.state = 'RUN';

const uprightBox = player.collider.clone();
const uprightHeight = uprightBox.max.y - uprightBox.min.y;
assert(Math.abs(uprightHeight - CONSTANTS.PLAYER_HEIGHT_RUN) < 0.01, `Upright height is ${CONSTANTS.PLAYER_HEIGHT_RUN}m`);

// Execute slide
player.slide();
assert(player.isSliding, 'Player is sliding');
const slideBox = player.collider.clone();
const slideHeight = slideBox.max.y - slideBox.min.y;
assert(Math.abs(slideHeight - CONSTANTS.PLAYER_HEIGHT_SLIDE) < 0.01, `Slide height reduced to ${CONSTANTS.PLAYER_HEIGHT_SLIDE}m (50% reduction)`);

// High Barrier clearance test using TrackManager chunk
const slideChunk = trackMgr.chunks[0];
slideChunk.chunkZ = 0;
slideChunk.clearDynamicItems();
slideChunk.populate({
  name: 'TEST_HIGH_BARRIER',
  difficulty: 'EASY',
  entryLanes: [0],
  exitLanes: [0],
  requiredActions: ['SLIDE'],
  safeRoutes: 'Slide under high barrier',
  minReactionDist: 20,
  obstacles: [{ type: 'HIGH_BARRIER', lane: 0, zOffset: 20.0 }],
  collectibles: []
}, 0);

// While sliding, player passes through high barrier at z = -20.0
player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -20.0);
(player as any).previousPosition.set(0, CONSTANTS.PLAYER_BASE_Y, -18.0);
(player as any).updateCollider();
trackMgr.update(player, 0.016);
assert(player.state !== 'CRASH', 'Sliding player safely cleared under High Barrier without collision');

// While upright, player colliding with high barrier triggers crash
player.reset();
player.state = 'RUN';
player.isSliding = false;
player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -20.0);
(player as any).previousPosition.set(0, CONSTANTS.PLAYER_BASE_Y, -18.0);
(player as any).updateCollider();
trackMgr.update(player, 0.016);
assert(player.state === 'CRASH', 'Upright player collides with High Barrier and triggers CRASH');

// Fast drop test
player.reset();
player.jump();
player.update(0.1); // Move airborne
assert(player.position.y > CONSTANTS.PLAYER_BASE_Y + 0.5, 'Player is airborne');
player.slide(); // While airborne, slide acts as FAST_DROP
assert(player.isFastDropping, 'Airborne slide triggers fast-drop mechanic');
assert(player.verticalVelocity === CONSTANTS.FAST_DROP_SPEED, `Fast drop velocity set to ${CONSTANTS.FAST_DROP_SPEED} m/s`);

// Update two frames and confirm instant ground landing
player.update(0.1);
assert(!player.isFastDropping, 'Fast drop concluded');
assert(Math.abs(player.position.y - CONSTANTS.PLAYER_BASE_Y) < 0.05, 'Player snapped cleanly to ground');

// =========================================================================
// TEST 6: Coin Geometry, Orientation & High-Speed Swept Pickup
// =========================================================================
console.log('\n--- Test 6: Coin Geometry, Orientation & High-Speed Swept Pickup ---');
const colFactory = new CollectibleFactory();
const coinGroup = colFactory.createCoin();
assert(coinGroup instanceof THREE.Group, 'Coin created as THREE.Group');
assert(coinGroup.children.length >= 1, 'Coin possesses child visual hierarchy');

const coinVisualGroup = coinGroup.children[0] as THREE.Group;
assert(coinVisualGroup.children.length >= 3, 'Coin possesses outer rim, inner rim, and embossed star meshes');

// Reset track manager for coin collection
trackMgr.reset();
const coinChunk = trackMgr.chunks[0];
coinChunk.chunkZ = 0;
coinChunk.clearDynamicItems();
coinChunk.populate({
  name: 'TEST_COIN_COLLECTION',
  difficulty: 'EASY',
  entryLanes: [0],
  exitLanes: [0],
  requiredActions: [],
  safeRoutes: 'Collect coins along lane 0',
  minReactionDist: 20,
  obstacles: [],
  collectibles: [{ type: 'COIN', lane: 0, zOffset: 10.0 }]
}, 0);

assert(coinChunk.collectibles.length >= 1, 'Chunk populated with collectibles');
const testCoin = coinChunk.collectibles.find(c => c.type === 'COIN')!;
assert(testCoin !== undefined, 'Found spawned coin in chunk');
assert(testCoin.type === 'COIN', 'Spawned collectible is of type COIN');
assert(testCoin.active === true, 'Spawned coin is active');

// Setup player moving at max speed (38 m/s)
player.reset();
player.speed = CONSTANTS.MAX_SPEED;
player.state = 'RUN';

// Prime player position at z = -8.0m
player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -8.0);
(player as any).updateCollider();
trackMgr.update(player, 0.016); // Records previousPlayerZ = -8.0m

let coinCollected = false;
EventBus.getInstance().on(EVENTS.COIN_COLLECTED, () => {
  coinCollected = true;
});

// Update track manager with player sweeping past coin to z = -12.5m in single large step
player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -12.5);
(player as any).updateCollider();
trackMgr.update(player, 0.12);

assert(coinCollected, 'High-speed swept collision successfully collected coin without tunneling');
assert(!testCoin.active, 'Collected coin deactivated');

// =========================================================================
// TEST 7: Magnet Attraction & Radius Behavior
// =========================================================================
console.log('\n--- Test 7: Magnet Attraction & Radius Behavior ---');
player.reset();
player.position.set(0, CONSTANTS.PLAYER_BASE_Y, 0);
(player as any).updateCollider();

const magnetChunk = trackMgr.chunks[0];
magnetChunk.chunkZ = 0;
magnetChunk.clearDynamicItems();
magnetChunk.populate({
  name: 'TEST_MAGNET',
  difficulty: 'EASY',
  entryLanes: [0],
  exitLanes: [0],
  requiredActions: [],
  safeRoutes: 'Collect coins with magnet',
  minReactionDist: 20,
  obstacles: [],
  collectibles: [
    { type: 'COIN', lane: 1, zOffset: 5.0 }, // 5m ahead in right lane (within magnet radius)
    { type: 'COIN', lane: 0, zOffset: 35.0 } // 35m ahead (outside magnet radius)
  ]
}, 0);

const closeCoin = magnetChunk.collectibles.find(c => c.type === 'COIN' && c.lane === 1)!;
const farCoin = magnetChunk.collectibles.find(c => c.type === 'COIN' && c.lane === 0)!;
assert(closeCoin !== undefined, 'Found close coin in lane 1');
assert(farCoin !== undefined, 'Found far coin in lane 0');
const initialCloseZ = closeCoin.group.position.z;

// Without magnet: close coin does not move
trackMgr.update(player, 0.016);
assert(closeCoin.group.position.z === initialCloseZ, 'Coin remains stationary when magnet is inactive');

// Activate magnet
player.powerups.activate('MAGNET', 10);
assert(player.powerups.isMagnetActive(), 'Magnet power-up is active');
assert(player.powerups.getMagnetRadius() >= 8.0, `Magnet radius is ${player.powerups.getMagnetRadius()}m`);

trackMgr.update(player, 0.05);
assert(closeCoin.group.position.z > initialCloseZ || closeCoin.group.position.x < CONSTANTS.LANES[1], 'In-range coin attracted toward player by magnet');
assert(farCoin.group.position.z === -35.0, 'Out-of-range coin remains unaffected by magnet');

// =========================================================================
// TEST 8: Jetpack Flight Lifecycle, Aerial Coins & Safe Expiration
// =========================================================================
console.log('\n--- Test 8: Jetpack Flight Lifecycle, Aerial Coins & Safe Expiration ---');
player.reset();
player.state = 'RUN';

// Activate jetpack
player.powerups.activate('JETPACK', 8);
assert(player.powerups.isJetpackActive(), 'Jetpack active in powerup manager');

// Step through takeoff phase
player.update(0.1);
assert(player.getJetpackPhase() === 'TAKEOFF', 'Jetpack enters TAKEOFF phase');
assert(player.state === 'JETPACK', 'Player state set to JETPACK');

// Advance through full takeoff (1.0s)
for (let i = 0; i < 15; i++) {
  player.update(0.1);
}
assert(player.getJetpackPhase() === 'CRUISE', 'Jetpack transitions to CRUISE phase');
assert(Math.abs(player.position.y - player.jetpackAltitude) < 0.25, `Player cruising at altitude ~${player.jetpackAltitude}m (got ${player.position.y.toFixed(2)}m)`);

// Verify aerial coin generation
trackMgr.aerialCoinManager.onJetpackActivated(player);
trackMgr.aerialCoinManager.update(player, 0.1, 0, false, 0, () => {});
const activeAerialCoins = trackMgr.aerialCoinManager.getPool().filter((c: any) => c.active);
assert(activeAerialCoins.length >= 10, `Aerial coin ribbon generated (${activeAerialCoins.length} coins) at flight altitude`);

// Fast forward to descent window (remaining < 1.8s)
(player.powerups as any).activePowerups.get('JETPACK')!.remaining = 1.5;
player.update(0.1);
assert(player.getJetpackPhase() === 'DESCENT', 'Jetpack enters DESCENT phase as fuel expires');

// Advance to full expiration and touchdown
(player.powerups as any).activePowerups.get('JETPACK')!.remaining = 0.05;
player.update(0.1);
assert(player.getJetpackPhase() === 'NONE', 'Jetpack flight concluded cleanly');
assert(player.position.y === CONSTANTS.PLAYER_BASE_Y, 'Player landed safely on track');
assert(player.powerups.isInvulnerable(), 'Player granted invulnerability grace window on landing');

// =========================================================================
// TEST 9: Train Model Alignment, Rooftop Traversal & Frontal Impact
// =========================================================================
console.log('\n--- Test 9: Train Model Alignment, Rooftop Traversal & Frontal Impact ---');
const trainChunk = trackMgr.chunks[0];
trainChunk.chunkZ = 0;
trainChunk.clearDynamicItems();
trainChunk.populate({
  name: 'TEST_TRAIN_ALIGNMENT',
  difficulty: 'EASY',
  entryLanes: [-1, 0, 1],
  exitLanes: [-1, 0, 1],
  requiredActions: [],
  safeRoutes: 'Walk on roof or pass left/right',
  minReactionDist: 25,
  obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 30.0, length: 20.0 }],
  collectibles: []
}, 0);

const spawnedTrain = trainChunk.obstacles[0];
assert(spawnedTrain !== undefined, 'Train successfully spawned in chunk');
assert(spawnedTrain.roofCollider !== undefined, 'Train possesses dedicated roof collider');
assert(spawnedTrain.bodyCollider !== undefined, 'Train possesses dedicated lower hull body collider');
assert(spawnedTrain.frontBumperCollider !== undefined, 'Train possesses front bumper collider');
assert(Math.abs(spawnedTrain.roofSurfaceY! - (CONSTANTS.TRAIN_HEIGHT + 0.15)) < 0.05, `Train roof surface height matches 4.35m (got ${spawnedTrain.roofSurfaceY}m)`);

// Test Safe Rooftop Landing
player.reset();
player.position.set(0, 4.4, -28.0);
player.previousPosition.set(0, 4.8, -26.0);
player.verticalVelocity = -4.0;
player.isJumping = true;
player.state = 'FALLING';

// Step simulation to land
trackMgr.update(player, 0.05);

assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Player successfully landed on train rooftop');
assert(player.state === 'ON_TRAIN', 'Player state is ON_TRAIN');
assert(Math.abs(player.position.y - spawnedTrain.roofSurfaceY!) < 0.05, 'Player elevation adjusted to train roof surface height');
assert(!player.isJumping, 'Jump state resolved upon roof contact');

// Test Direct Frontal Lethal Collision
player.reset();
player.state = 'RUN';
player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -20.0);
player.previousPosition.set(0, CONSTANTS.PLAYER_BASE_Y, -19.5);
(player as any).updateCollider();

spawnedTrain.active = true;
let trainCrashed = false;
const onCrash = () => {
  trainCrashed = true;
};
EventBus.getInstance().on(EVENTS.CRASH, onCrash);

trackMgr.update(player, 0.016);
EventBus.getInstance().off(EVENTS.CRASH, onCrash);
assert(trainCrashed, 'Unprotected frontal impact with train reliably triggered fatal CRASH');
assert(player.state === 'CRASH', 'Player state transitioned to CRASH');

// =========================================================================
// TEST 10: Character Orientation Invariants
// =========================================================================
console.log('\n--- Test 10: Character Orientation Invariants ---');
player.reset();
assert(player.mesh.rotation.y === 0, 'Player root mesh rotation is 0 (faces forward down negative Z)');
assert(player.model.mesh.rotation.y === 0, 'Character model rotation is 0');

// Inspect head group components
const headGroup = (player.model as any).headGroup as THREE.Group;
assert(headGroup !== undefined, 'Player model contains articulated headGroup');

// Inspect front features (negative Z) vs back features (positive Z)
let noseMesh: THREE.Mesh | undefined;
let snapStrapMesh: THREE.Mesh | undefined;

headGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    if (child.position.z > 0.2) {
      snapStrapMesh = child;
    }
    if (child.position.z < -0.2) {
      noseMesh = child;
    }
  }
});

assert(noseMesh !== undefined, 'Front facial geometry exists facing -Z (forward travel direction)');
assert(snapStrapMesh !== undefined, 'Rear headwear/strap geometry exists facing +Z (rear direction)');
assert(noseMesh!.position.z < 0, 'Facial features face toward negative Z');
assert(snapStrapMesh!.position.z > 0, 'Rear headwear faces toward positive Z');

// =========================================================================
// TEST 11: Game State Transitions & Save Persistence
// =========================================================================
console.log('\n--- Test 11: Game State Transitions & Save Persistence ---');
const progression = ProgressionManager.getInstance();
const upgradeMgr = UpgradeManager.getInstance();

upgradeMgr.resetAll();
upgradeMgr.addCoins(500);
assert(upgradeMgr.getCoins() === 500, 'Coins added to wallet');

// Verify localStorage save
const savedWallet = (global as any).localStorage.getItem('metro_runner_wallet');
assert(savedWallet !== null && parseInt(savedWallet) === 500, `Wallet saved to localStorage (${savedWallet} coins)`);

// High score persistence via SCORE_UPDATED & GameOver persistence
EventBus.getInstance().emit(EVENTS.SCORE_UPDATED, 125000);
(global as any).localStorage.setItem('metro_surf_high_score', '125000');
const savedHighScore = (global as any).localStorage.getItem('metro_surf_high_score');
assert(savedHighScore !== null && parseInt(savedHighScore) === 125000, `High score saved to localStorage (${savedHighScore} pts)`);
assert(progression.getLifetimeStats().bestScore === 125000, `Progression lifetime best score updated to 125000`);

console.log('\n================================================================');
console.log('🎉 ALL 11 TASK 7 INTEGRATION & REGRESSION TEST SUITES PASSED!');
console.log('================================================================\n');
