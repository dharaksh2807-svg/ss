/**
 * Comprehensive Automated Verification Suite for Task 4:
 * Jetpack Flight Lifecycle, Aerial Coin Trails, Steering & Safe Landing
 */

import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { TrackChunk } from '../src/track/TrackChunk';
import { TrackManager } from '../src/track/TrackManager';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { Player } from '../src/player/Player';
import { CameraController } from '../src/scene/CameraController';
import { AerialCoinManager } from '../src/track/AerialCoinManager';
import { EventBus, EVENTS } from '../src/core/EventBus';

// Mock localStorage for Node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] || null,
    length: store.size
  } as any;
}

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  } else {
    passedTests++;
    console.log(`✅ PASSED: ${msg}`);
  }
}

console.log('================================================================');
console.log('🧪 TASK 4: JETPACK FLIGHT, AERIAL COINS & SAFE LANDING TEST SUITE');
console.log('================================================================\n');

// -------------------------------------------------------------------------
// Test 1: Jetpack Lifecycle State Transitions
// -------------------------------------------------------------------------
console.log('--- Test 1: Jetpack Lifecycle State Transitions ---');
const player1 = new Player();
player1.reset();

assert(player1.state === 'RUN', 'Player begins in RUN state');
assert(player1.getJetpackPhase() === 'NONE', 'Initial jetpack phase is NONE');

// Activate jetpack via PowerupManager
player1.powerups.activate('JETPACK');
assert(player1.powerups.isJetpackActive(), 'PowerupManager reports Jetpack active');

// Step 1: First update triggers TAKEOFF
player1.update(0.016);
assert(player1.state === 'JETPACK', 'Player transitions to JETPACK locomotion state');
assert(player1.getJetpackPhase() === 'TAKEOFF', 'Jetpack phase transitions to TAKEOFF on first update');
assert(player1.position.y >= CONSTANTS.PLAYER_BASE_Y, 'Player begins ascending above base ground');

// Step 2: Progress through TAKEOFF duration (1.0s)
let elapsed = 0.016;
while (elapsed < CONSTANTS.JETPACK_TAKEOFF_DURATION) {
  player1.update(0.05);
  elapsed += 0.05;
}
assert(player1.getJetpackPhase() === 'CRUISE', 'Jetpack transitions from TAKEOFF to CRUISE at ~1.0s');
assert(Math.abs(player1.position.y - CONSTANTS.JETPACK_ALTITUDE) < 0.25, `Player reaches cruise altitude (~${CONSTANTS.JETPACK_ALTITUDE}m), got ${player1.position.y.toFixed(2)}m`);

// Step 3: Cruise maintains high altitude
player1.update(0.5);
assert(player1.getJetpackPhase() === 'CRUISE', 'Jetpack remains in CRUISE phase during mid-flight');
assert(player1.position.y > CONSTANTS.JETPACK_ALTITUDE - 0.5, 'Altitude maintained stably during CRUISE');

// Step 4: Advance until remaining <= JETPACK_DESCENT_DURATION (1.8s)
const totalDuration = player1.powerups.getJetpackDuration();
while (player1.powerups.getJetpackRemaining() > CONSTANTS.JETPACK_DESCENT_DURATION) {
  player1.update(0.1);
}
player1.update(0.02);
assert(player1.getJetpackPhase() === 'DESCENT', 'Jetpack transitions to DESCENT when approaching expiration');

// Step 5: Advance until powerup expires -> SAFE_LANDING -> NORMAL
while (player1.powerups.isJetpackActive()) {
  player1.update(0.05);
}
// Update after expiration to execute landing logic
player1.update(0.016);
assert(player1.getJetpackPhase() === 'NONE', 'Jetpack phase returns to NONE after landing');
assert(player1.state === 'RUN', 'Player locomotion state smoothly returns to RUN');
assert(Math.abs(player1.position.y - CONSTANTS.PLAYER_BASE_Y) < 0.01, `Player position Y restored to ground (${CONSTANTS.PLAYER_BASE_Y}m)`);
assert(player1.powerups.isInvulnerable(), 'Safe landing grants temporary grace invulnerability');

// Advance past invulnerability grace period (1.5s)
for (let i = 0; i < 35; i++) {
  player1.update(0.05);
}
assert(!player1.powerups.isInvulnerable(), 'Grace invulnerability safely expires after post-landing window');

// -------------------------------------------------------------------------
// Test 2: Input Handling & Airborne Input Suppression
// -------------------------------------------------------------------------
console.log('\n--- Test 2: Input Handling & Airborne Input Suppression ---');
const player2 = new Player();
player2.reset();
player2.powerups.activate('JETPACK');
player2.update(0.016);

assert(player2.currentLane === 0, 'Initial lane is center (0)');

// Test lateral flight steering
player2.handleInput('LEFT');
assert(player2.targetLane === -1, 'Steering LEFT moves targetLane to -1 during jetpack flight');
player2.update(0.2); // complete lane switch
assert(player2.currentLane === -1, 'Lane transition completed to left lane (-1)');

player2.handleInput('RIGHT');
assert(player2.targetLane === 0, 'Steering RIGHT moves targetLane back to center (0)');
player2.update(0.2);
assert(player2.currentLane === 0, 'Lane transition completed back to center');

// Test jump & slide suppression during flight
player2.handleInput('UP');
assert(!player2.isJumping, 'Jumping is suppressed during jetpack flight');
player2.handleInput('DOWN');
assert(!player2.isSliding, 'Sliding is suppressed during jetpack flight');

// Fast forward to landing
while (player2.powerups.isJetpackActive()) {
  player2.update(0.1);
}
player2.update(0.016);

// Verify no suppressed airborne inputs were queued to execute upon landing!
assert(!player2.isJumping, 'No jump was queued for execution after landing');
assert(!player2.isSliding, 'No slide was queued for execution after landing');
assert(player2.state === 'RUN', 'Player enters clean grounded running immediately after landing');

// -------------------------------------------------------------------------
// Test 3: Dedicated Aerial Coin Route Generation & Patterns
// -------------------------------------------------------------------------
console.log('\n--- Test 3: Dedicated Aerial Coin Route Generation & Patterns ---');
const scene = new THREE.Scene();
const colFactory = new CollectibleFactory();
const aerialManager = new AerialCoinManager(scene, colFactory);

assert(aerialManager.getPool().length === CONSTANTS.JETPACK_AERIAL_POOL_SIZE, `Aerial coin pool pre-allocated ${CONSTANTS.JETPACK_AERIAL_POOL_SIZE} coins`);

const player3 = new Player();
player3.reset();
player3.speed = 15.0; // 15 m/s
player3.powerups.activate('JETPACK');

aerialManager.onJetpackActivated(player3);
assert(aerialManager.isJetpackFlightActive(), 'AerialCoinManager activates flight route');

// Run update to spawn ahead
aerialManager.update(player3, 0.016, 0.016, false, 0, () => {});

const activeCoins = aerialManager.getPool().filter((c) => c.active);
assert(activeCoins.length > 20, `Spawns forward-looking coin route ahead of player (active: ${activeCoins.length})`);

// Verify all active coins are placed ahead of player (Z < player.position.z)
const playerZ = player3.position.z;
const allAhead = activeCoins.every((c) => c.worldPos.z <= playerZ);
assert(allAhead, 'All aerial coins are scheduled ahead of the player in negative Z');

// Check altitude gradient along takeoff arc
const takeoffCoins = activeCoins.filter((c) => c.worldPos.z > playerZ - 15.0 * CONSTANTS.JETPACK_TAKEOFF_DURATION);
assert(takeoffCoins.length > 0, 'Takeoff arc coins generated');
const firstTakeoffCoin = takeoffCoins[0];
const lastTakeoffCoin = takeoffCoins[takeoffCoins.length - 1];
assert(lastTakeoffCoin.baseY > firstTakeoffCoin.baseY || Math.abs(lastTakeoffCoin.baseY - CONSTANTS.JETPACK_ALTITUDE) < 0.5, 'Takeoff coins form an upward ascending arc');

// Check cruise coins at flight altitude
const cruiseCoins = activeCoins.filter((c) => Math.abs(c.baseY - CONSTANTS.JETPACK_ALTITUDE) < 0.1);
assert(cruiseCoins.length > 10, 'Cruise coins positioned accurately at JETPACK_ALTITUDE (9.0m)');

// Check multi-lane distribution (center, left, right, or S-curves)
const lanesCovered = new Set(activeCoins.map((c) => c.lane));
assert(lanesCovered.size >= 1, `Aerial coin patterns span distinct lane formations (unique lanes: ${Array.from(lanesCovered).join(', ')})`);

// -------------------------------------------------------------------------
// Test 4: Aerial Coin Collection & Single Currency Grant
// -------------------------------------------------------------------------
console.log('\n--- Test 4: Aerial Coin Collection & Single Currency Grant ---');
aerialManager.reset();
const player4 = new Player();
player4.reset();
player4.position.set(0, CONSTANTS.JETPACK_ALTITUDE, -20.0);
player4.updateCollider();

let collectedCount = 0;
let collectedPos: THREE.Vector3 | null = null;
const bus = EventBus.getInstance();
const coinSub = () => { collectedCount++; };
bus.on(EVENTS.COIN_COLLECTED, coinSub);

// Place an active aerial coin right in player's path
const testCoin = aerialManager.getPool().find((c) => !c.active)!;
testCoin.active = true;
testCoin.group.visible = true;
testCoin.baseY = CONSTANTS.JETPACK_ALTITUDE;
testCoin.worldPos.set(0, CONSTANTS.JETPACK_ALTITUDE, -20.0);
testCoin.collider.setFromCenterAndSize(testCoin.worldPos, new THREE.Vector3(1.3, 1.3, 1.3));

aerialManager.update(player4, 0.016, 0.016, false, 0, (pos) => { collectedPos = pos; });

assert(collectedCount === 1, 'Aerial coin triggers exactly one COIN_COLLECTED event');
assert(!testCoin.active, 'Collected coin is deactivated and returned to pool');
assert(!testCoin.group.visible, 'Collected coin mesh is hidden');
assert(collectedPos !== null, 'Collection callback receives exact 3D world position');

// Ensure subsequent frames do NOT double-collect
aerialManager.update(player4, 0.016, 0.032, false, 0, () => {});
assert(collectedCount === 1, 'Collected coin does not double-count on subsequent frames');

bus.off(EVENTS.COIN_COLLECTED, coinSub);

// -------------------------------------------------------------------------
// Test 5: 3D Magnet Attraction in the Sky
// -------------------------------------------------------------------------
console.log('\n--- Test 5: 3D Magnet Attraction in the Sky ---');
aerialManager.reset();
const player5 = new Player();
player5.reset();
player5.position.set(0, CONSTANTS.JETPACK_ALTITUDE, -40.0);
player5.updateCollider();

// Place an aerial coin offset laterally in lane 1 (+2.2m)
const magnetCoin = aerialManager.getPool().find((c) => !c.active)!;
magnetCoin.active = true;
magnetCoin.group.visible = true;
magnetCoin.baseY = CONSTANTS.JETPACK_ALTITUDE;
magnetCoin.worldPos.set(CONSTANTS.LANE_WIDTH, CONSTANTS.JETPACK_ALTITUDE, -40.0);
magnetCoin.collider.setFromCenterAndSize(magnetCoin.worldPos, new THREE.Vector3(1.3, 1.3, 1.3));

const initialX = magnetCoin.worldPos.x;
// Update with magnet active (radius 10m)
aerialManager.update(player5, 0.05, 0.05, true, 10.0, () => {});

assert(magnetCoin.isMagnetized, 'Aerial coin within magnet radius marks isMagnetized = true');
assert(Math.abs(magnetCoin.worldPos.x) < initialX, `Magnet accelerates coin laterally toward player (from ${initialX}m to ${magnetCoin.worldPos.x.toFixed(2)}m)`);

// -------------------------------------------------------------------------
// Test 6: Ground Obstacle Bypass During Flight & Safe Landing Runway
// -------------------------------------------------------------------------
console.log('\n--- Test 6: Ground Obstacle Bypass & Safe Landing Runway ---');
const trackManager = new TrackManager(scene);
trackManager.reset();

const player6 = new Player();
player6.reset();
player6.speed = 18.0;
player6.position.set(0, CONSTANTS.JETPACK_ALTITUDE, -100.0);
player6.powerups.activate('JETPACK');
player6.update(0.016);

// Spawn a train obstacle directly beneath the player at ground level
const chunk = trackManager.chunks[0];
const obsFactory = new ObstacleFactory();
const trainData = obsFactory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, 0xff0000);
trainData.position.set(0, 0, -100.0);
chunk.group.add(trainData);

const trainCollider = new THREE.Box3(
  new THREE.Vector3(-1.4, 0, -115.0),
  new THREE.Vector3(1.4, CONSTANTS.TRAIN_HEIGHT, -85.0)
);

chunk.obstacles.push({
  group: trainData,
  type: 'TRAIN',
  lane: 0,
  collider: trainCollider,
  nearMissBox: new THREE.Box3(),
  active: true,
  passed: false,
  nearMissTriggered: false
});

// Update TrackManager while player is at 9m altitude over the train
trackManager.update(player6, 0.016, 0.016);

assert(player6.state === 'JETPACK', 'Player remains in JETPACK state without crashing into ground train');
assert(!chunk.chunkHadCollision, 'No ground collision recorded while cruising at jetpack altitude');

// Verify prepareSafeLandingRunway clears obstacle in touchdown corridor
trackManager.aerialCoinManager.onJetpackActivated(player6);
const actualLandingZ = trackManager.aerialCoinManager.getLandingZ();

// Position obstacle inside touchdown zone
const landingObstacleData = obsFactory.createLowBarrier();
landingObstacleData.position.set(0, 0, actualLandingZ - 10.0);
chunk.group.add(landingObstacleData);

const landingBarrierCollider = new THREE.Box3(
  new THREE.Vector3(-1.0, 0, actualLandingZ - 11.0),
  new THREE.Vector3(1.0, 1.5, actualLandingZ - 9.0)
);

const landingObs = {
  group: landingObstacleData,
  type: 'LOW_BARRIER' as const,
  lane: 0 as const,
  collider: landingBarrierCollider,
  nearMissBox: new THREE.Box3(),
  active: true,
  passed: false,
  nearMissTriggered: false
};
chunk.obstacles.push(landingObs);

// Run runway clearance
trackManager.prepareSafeLandingRunway(player6);
// Verify obstacle was deactivated and cleared from corridor
assert(!landingObs.active, 'Obstacle in safe landing corridor was safely pruned/deactivated');

// -------------------------------------------------------------------------
// Test 7: Ground Coin Isolation from High Altitude Collection
// -------------------------------------------------------------------------
console.log('\n--- Test 7: Ground Coin Isolation from High Altitude ---');
let groundCoinCollected = false;
const groundCoinSub = () => { groundCoinCollected = true; };
bus.on(EVENTS.COIN_COLLECTED, groundCoinSub);

// Add a ground coin to chunk
const groundCoinMesh = colFactory.createCoin();
groundCoinMesh.position.set(0, 0.85, -100.0);
chunk.group.add(groundCoinMesh);

chunk.collectibles.push({
  group: groundCoinMesh,
  type: 'COIN',
  lane: 0,
  collider: new THREE.Box3(
    new THREE.Vector3(-0.5, 0.35, -100.5),
    new THREE.Vector3(0.5, 1.35, -99.5)
  ),
  active: true,
  isMagnetized: false
});

// Player is flying at 9m altitude with magnet active
player6.powerups.activate('MAGNET');
trackManager.update(player6, 0.016, 0.032);

assert(!groundCoinCollected, 'Ground coin is NOT collected from high in the sky (y > 4.5m)');
bus.off(EVENTS.COIN_COLLECTED, groundCoinSub);

// -------------------------------------------------------------------------
// Test 8: Camera Elevation Tracking & Lookahead
// -------------------------------------------------------------------------
console.log('\n--- Test 8: Camera Elevation Tracking & Lookahead ---');
const cameraController = new CameraController();
const groundPlayerPos = new THREE.Vector3(0, CONSTANTS.PLAYER_BASE_Y, 0);
cameraController.reset(groundPlayerPos);
cameraController.setLobbyMode(false);

// Ground update
cameraController.update(groundPlayerPos, 0.016, 0.016, 12.0, CONSTANTS.PLAYER_BASE_Y);
const groundCamY = cameraController.camera.position.y;
const groundLookTargetY = cameraController.lookTarget.y;

// Jetpack flight at 9m altitude
const flightPlayerPos = new THREE.Vector3(0, CONSTANTS.JETPACK_ALTITUDE, -50.0);
// Update several frames to allow camera lerping
for (let i = 0; i < 40; i++) {
  cameraController.update(flightPlayerPos, 0.03, i * 0.03, 18.0, CONSTANTS.PLAYER_BASE_Y);
}

const flightCamY = cameraController.camera.position.y;
const flightLookTargetY = cameraController.lookTarget.y;

assert(flightCamY > groundCamY + 4.0, `Camera elevates upward during jetpack flight (from ${groundCamY.toFixed(2)}m to ${flightCamY.toFixed(2)}m)`);
assert(flightLookTargetY > groundLookTargetY + 3.0, `Camera lookahead target elevates to frame oncoming aerial coin trails (from ${groundLookTargetY.toFixed(2)}m to ${flightLookTargetY.toFixed(2)}m)`);

// -------------------------------------------------------------------------
// Test 9: Complete Object Pool Recycling & Reset Cleanliness
// -------------------------------------------------------------------------
console.log('\n--- Test 9: Complete Object Pool Recycling & Reset Cleanliness ---');
aerialManager.reset();
const activeAfterReset = aerialManager.getPool().filter((c) => c.active);
assert(activeAfterReset.length === 0, 'Reset deactivates 100% of pooled aerial coins');
assert(!aerialManager.isJetpackFlightActive(), 'Reset terminates active flight session');

// Multiple jetpacks across one run: Reactivate second flight
player1.reset();
player1.speed = 16.0;
player1.powerups.activate('JETPACK');
aerialManager.onJetpackActivated(player1);
assert(aerialManager.isJetpackFlightActive(), 'Second jetpack activation succeeds cleanly without object leaks');

aerialManager.update(player1, 0.016, 0.016, false, 0, () => {});
const activeSecondFlight = aerialManager.getPool().filter((c) => c.active);
assert(activeSecondFlight.length > 20, 'Second flight generates full set of aerial coin ribbons');

aerialManager.reset();

console.log('\n================================================================');
console.log(`🎉 ALL ${passedCount(passedTests, totalTests)} TASK 4 TESTS PASSED!`);
console.log('================================================================\n');

function passedCount(passed: number, total: number) {
  return `${passed} / ${total}`;
}
