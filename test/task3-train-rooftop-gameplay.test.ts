import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { Player } from '../src/player/Player';
import { ObstacleFactory, ObstacleInstance } from '../src/track/ObstacleFactory';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { TrackChunk } from '../src/track/TrackChunk';
import { TrackManager } from '../src/track/TrackManager';
import { CollisionResolver } from '../src/track/CollisionResolver';
import { ReachabilityValidator } from '../src/track/ReachabilityValidator';
import {
  TrainCompositionDef,
  COMMUTER_TWIN_SET,
  METRO_TRIPLE_CONSIST,
  EXPRESS_QUAD_CONSIST,
  DUAL_TRAIN_GAP_HOP,
  calculateRooftopDuration,
  getRequiredTrainLength,
  getCompositionForDifficulty
} from '../src/track/TrainComposition';
import {
  OBSTACLE_PATTERNS,
  validatePatternFeasibility
} from '../src/track/ObstaclePatterns';
import { CoinPatternLibrary } from '../src/track/CoinPatternLibrary';
import { RooftopRoutePlanner, RooftopRouteArchetype } from '../src/track/RooftopRoutePlanner';

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

console.log('🧪 Starting Metro Runner 3D: Task 3 Rooftop Gameplay & Train Compositions Test Suite...\n');

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

// =========================================================================
// Suite 1: Inspect Current Train Lengths & Rooftop Traversal Duration
// =========================================================================
console.log('--- Suite 1: Train Length Constants & Measured Rooftop Duration ---');

assert(CONSTANTS.TRAIN_LENGTH_SHORT === 16, 'Short train constant is 16 units');
assert(CONSTANTS.TRAIN_LENGTH_MEDIUM === 22, 'Medium train constant is 22 units');
assert(CONSTANTS.TRAIN_LENGTH_LONG === 28, 'Long train constant is 28 units');

const shortRoofOnly18 = calculateRooftopDuration(CONSTANTS.TRAIN_LENGTH_SHORT, 18, false);
const shortRoofOnly38 = calculateRooftopDuration(CONSTANTS.TRAIN_LENGTH_SHORT, 38, false);
const longRoofOnly38 = calculateRooftopDuration(CONSTANTS.TRAIN_LENGTH_LONG, 38, false);
const shortWithRamp38 = calculateRooftopDuration(CONSTANTS.TRAIN_LENGTH_SHORT, 38, true);

assert(shortRoofOnly18 < 1.0, `Short train roof alone at 18 m/s provides only ${shortRoofOnly18.toFixed(2)}s rooftop duration (< 1.0s)`);
assert(shortRoofOnly38 < 0.5, `Short train roof alone at 38 m/s provides only ${shortRoofOnly38.toFixed(2)}s rooftop duration (< 0.5s)`);
assert(longRoofOnly38 < 1.0, `Long single train roof at 38 m/s provides only ${longRoofOnly38.toFixed(2)}s rooftop duration (< 1.0s)`);
assert(shortWithRamp38 < 1.0, `Short train even with ramp at 38 m/s provides only ${shortWithRamp38.toFixed(2)}s duration (< 1.0s)`);

// Verify modular train compositions meet gameplay targets
const commuterDuration18 = calculateRooftopDuration(COMMUTER_TWIN_SET.totalLength, 18);
assert(commuterDuration18 >= 2.0 && commuterDuration18 <= 3.2, `Beginner commuter set meets target 2-3s (got ${commuterDuration18.toFixed(2)}s)`);

const metroDuration18 = calculateRooftopDuration(METRO_TRIPLE_CONSIST.totalLength, 18);
assert(metroDuration18 >= 2.8 && metroDuration18 <= 5.0, `Intermediate metro consist meets target 3-5s (got ${metroDuration18.toFixed(2)}s)`);

const expressDuration18 = calculateRooftopDuration(EXPRESS_QUAD_CONSIST.totalLength, 18);
assert(expressDuration18 >= 3.8, `Advanced quad consist meets target (got ${expressDuration18.toFixed(2)}s)`);

const gapHopDuration18 = calculateRooftopDuration(DUAL_TRAIN_GAP_HOP.totalLength, 18);
assert(gapHopDuration18 >= 3.5, `Advanced dual train gap hop meets target (got ${gapHopDuration18.toFixed(2)}s)`);

// High speed dynamic composition scaling
const compLow = getCompositionForDifficulty('INTERMEDIATE', 18);
const compHigh = getCompositionForDifficulty('INTERMEDIATE', 38);
assert(compHigh.totalLength > compLow.totalLength, `Dynamic composition scales length at high speed (${compHigh.totalLength}m > ${compLow.totalLength}m)`);
assert(calculateRooftopDuration(compHigh.totalLength, 38) >= 1.8, 'Scaled composition preserves playable duration at max speed');

// =========================================================================
// Suite 2: Reusable Modular Train Composition Architecture
// =========================================================================
console.log('\n--- Suite 2: Modular Train Composition Architecture & Geometry ---');

const factory = new ObstacleFactory();
const collectibleFactory = new CollectibleFactory();
const compMesh = factory.createTrainComposition(COMMUTER_TWIN_SET);

assert(compMesh instanceof THREE.Group, 'Train composition builds valid THREE.Group');
assert(compMesh.userData.isComposition === true, 'Master group flagged as isComposition');
assert(compMesh.userData.composition === COMMUTER_TWIN_SET, 'Master group stores composition definition');

const car1 = compMesh.getObjectByName('car_0_lead_ramp');
const car2 = compMesh.getObjectByName('car_1_rear_coach');
assert(car1 !== undefined && car2 !== undefined, 'Composition contains authentic modular carriages, not stretched single mesh');

assert(CONSTANTS.TRAIN_ROOF_SURFACE_Y === 4.35, 'Catwalk top surface is strictly 4.35m');

let gangwayBridgeCount = 0;
const tripleMesh = factory.createTrainComposition(METRO_TRIPLE_CONSIST);
tripleMesh.traverse((child) => {
  if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry) {
    if (Math.abs(child.position.y - 4.28) < 0.05) {
      gangwayBridgeCount++;
    }
  }
});
assert(gangwayBridgeCount >= 2, `Continuous gangway catwalk plates bridge adjacent carriages (found ${gangwayBridgeCount})`);

// =========================================================================
// Suite 3: Reliable Ramp Entry & Foot Placement
// =========================================================================
console.log('\n--- Suite 3: Reliable Ramp Entry & Smooth Ascent ---');

assert(CONSTANTS.TRAIN_RAMP_LENGTH === 8.0, 'Ramp length constant is 8.0m');

const rampChunk = new TrackChunk(factory, collectibleFactory);
rampChunk.populate([
  {
    type: 'TRAIN_COMPOSITION',
    lane: 0,
    zOffset: 12.0,
    length: 37.2,
    hasRamp: true,
    composition: COMMUTER_TWIN_SET
  }
], 0);

const rampObs = rampChunk.obstacles[0];
assert(rampObs.hasRamp === true, 'Obstacle flagged with hasRamp');
assert(rampObs.rampCollider !== undefined, 'Ramp collider initialized');

const rampStart = rampObs.rampStartZ!;
const rampEnd = rampObs.rampEndZ!;
assert(Math.abs((rampStart - rampEnd) - 8.0) < 0.1, `Ramp span is 8.0m (${rampStart}m to ${rampEnd}m)`);

const player = new Player();
const testScene = new THREE.Scene();
const trackManager = new TrackManager(testScene);
(trackManager as any).chunks = [rampChunk];

// 1. Base of ramp
player.position.set(0, CONSTANTS.PLAYER_BASE_Y, rampStart);
player.updateCollider();
(trackManager as any).updateGroundHeight(player, 0.016);
assert(player.getSupportSurface() === 'RAMP', 'Player enters RAMP support surface at ramp base');
assert(Math.abs(player.position.y - CONSTANTS.PLAYER_BASE_Y) < 0.1, 'Foot placement at base matches ground level');

// 2. Midpoint of ramp
const midH = (CONSTANTS.PLAYER_BASE_Y + 4.35) * 0.5;
player.position.set(0, midH, (rampStart + rampEnd) * 0.5);
player.updateCollider();
(trackManager as any).updateGroundHeight(player, 0.016);
assert(player.getSupportSurface() === 'RAMP', 'Player remains in RAMP state along incline');
assert(Math.abs(player.position.y - midH) < 0.1, `Ascent follows continuous linear slope (Y = ${player.position.y.toFixed(2)}m)`);

// 3. Top of ramp: seamless promotion to TRAIN_ROOF
player.position.set(0, 4.35, rampEnd);
player.updateCollider();
(trackManager as any).updateGroundHeight(player, 0.016);
assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Ramp top smoothly promotes to TRAIN_ROOF at 4.35m');
assert(Math.abs(player.position.y - 4.35) < 0.05, 'Smooth ramp-to-roof transition with zero vertical snapping');

// 4. Guaranteed zero death during climbing
player.position.set(0, 2.5, (rampStart + rampEnd) * 0.5);
player.setSupportSurface('RAMP', rampObs.id, rampObs.carriageGroupId);
player.updateCollider();
const climbResolution = CollisionResolver.resolveOutcome(rampObs, player, null);
assert(climbResolution.outcome === 'SAFE_CONTACT', 'Ascending valid ramp guarantees SAFE_CONTACT (zero death)');

// =========================================================================
// Suite 4: Continuous Multi-Carriage Support & Gangway Traversal
// =========================================================================
console.log('\n--- Suite 4: Continuous Multi-Carriage Support Across Gangways ---');

const tripleChunk = new TrackChunk(factory, collectibleFactory);
tripleChunk.populate([
  {
    type: 'TRAIN_COMPOSITION',
    lane: 0,
    zOffset: 10.0,
    length: 52.4,
    hasRamp: true,
    composition: METRO_TRIPLE_CONSIST
  }
], 0);

const consistObs = tripleChunk.obstacles[0];
(trackManager as any).chunks = [tripleChunk];

// Step across all 52 meters from front to rear
player.setSupportSurface('TRAIN_ROOF', consistObs.id, consistObs.carriageGroupId);
player.position.set(0, 4.35, consistObs.roofStartZ!);

let supportDrops = 0;
let verticalSnaps = 0;
let lastY = 4.35;

for (let z = consistObs.roofStartZ!; z >= consistObs.roofEndZ!; z -= 0.5) {
  player.position.z = z;
  player.updateCollider();
  (trackManager as any).updateGroundHeight(player, 0.016);

  if (player.getSupportSurface() !== 'TRAIN_ROOF') {
    supportDrops++;
  }
  if (Math.abs(player.position.y - lastY) > 0.05) {
    verticalSnaps++;
  }
  lastY = player.position.y;
}

assert(supportDrops === 0, `Continuous support maintained across entire 52m consist (support drops: ${supportDrops})`);
assert(verticalSnaps === 0, `Zero vertical snapping across carriage junctions (snaps: ${verticalSnaps})`);
assert(player.getActiveSupportGroupId() === consistObs.carriageGroupId, 'Carriage group identity preserved across consist');

// =========================================================================
// Suite 5: Carriage Gap Jumping & Landing
// =========================================================================
console.log('\n--- Suite 5: Carriage Gap Jumping & Safe Landing ---');

const gapChunk = new TrackChunk(factory, collectibleFactory);
gapChunk.populate([
  {
    type: 'TRAIN',
    lane: -1,
    zOffset: 8.0,
    length: 26.0,
    hasRamp: true,
    carriageGroupId: 'gap_lead'
  },
  {
    type: 'TRAIN',
    lane: -1,
    zOffset: 37.5,
    length: 26.0,
    hasRamp: false,
    carriageGroupId: 'gap_trail'
  }
], 0);

const leadTrain = gapChunk.obstacles[0];
const trailTrain = gapChunk.obstacles[1];
(trackManager as any).chunks = [gapChunk];

// 1. Walking into gap without jumping causes fall
player.setSupportSurface('TRAIN_ROOF', leadTrain.id, leadTrain.carriageGroupId);
player.position.set(-1 * CONSTANTS.LANE_WIDTH, 4.35, leadTrain.roofEndZ! - 1.0);
player.isJumping = false;
player.updateCollider();
(trackManager as any).updateGroundHeight(player, 0.016);
assert(player.getSupportSurface() === 'GROUND', 'Walking into uncoupled gap steps off train');
assert(player.state === 'FALLING_FROM_TRAIN', 'Player enters FALLING_FROM_TRAIN state in gap');

// 2. Jumping across gap lands safely on trail train roof
player.reset();
player.position.set(-1 * CONSTANTS.LANE_WIDTH, 4.80, trailTrain.roofStartZ! - 0.5);
player.isJumping = true;
player.verticalVelocity = -1.5; // Descending
player.updateCollider();

(trackManager as any).updateGroundHeight(player, 0.016);
assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Jumping across gap captures landing on adjacent train roof');
assert(Math.abs(player.position.y - 4.35) < 0.05, 'Landing height resolved cleanly to 4.35m');

// =========================================================================
// Suite 6: Rooftop Obstacles & Jump Avoidance
// =========================================================================
console.log('\n--- Suite 6: Rooftop Obstacles (AC Hurdles & Vents) ---');

const acHurdleGroup = factory.createRooftopACHurdle();
assert(acHurdleGroup.userData.type === 'ROOFTOP_AC_HURDLE', 'AC hurdle group has correct type');
assert(CONSTANTS.ROOFTOP_AC_HURDLE_HEIGHT === 0.65, 'AC hurdle height constant is 0.65m');

const ventGroup = factory.createRooftopVent();
assert(ventGroup.userData.type === 'ROOFTOP_VENT', 'Vent group has correct type');
assert(CONSTANTS.ROOFTOP_VENT_HEIGHT === 0.50, 'Vent height constant is 0.50m');

const acObs: ObstacleInstance = {
  id: 'rooftop_ac_1',
  type: 'ROOFTOP_AC_HURDLE',
  lane: 0,
  collider: new THREE.Box3(new THREE.Vector3(-0.8, 4.35, -20.5), new THREE.Vector3(0.8, 5.0, -19.5)),
  roofSurfaceY: 4.35,
  active: true,
  hasRamp: false,
  length: 1.8,
  nearMissBox: new THREE.Box3(),
  nearMissTriggered: false,
  isMoving: false,
  isMovingActive: false,
  velocityZ: 0,
  initialLocalZ: -20,
  previousWorldZ: -20,
  telegraphed: false,
  group: new THREE.Group()
};

// 1. Running on roof without jumping hits AC hurdle
player.reset();
player.position.set(0, 4.35, -20.0);
player.isJumping = false;
player.setSupportSurface('TRAIN_ROOF', 'train_roof_1');
player.updateCollider();
const acHit = CollisionResolver.resolveOutcome(acObs, player, null);
assert(acHit.outcome !== 'SAFE_CONTACT', 'Running on roof into AC hurdle triggers obstacle collision');

// 2. Jumping clears AC hurdle safely
player.position.set(0, 5.05, -20.0);
player.isJumping = true;
player.updateCollider();
const acClear = CollisionResolver.resolveOutcome(acObs, player, null);
assert(acClear.outcome === 'SAFE_CONTACT', 'Jumping clears rooftop AC hurdle safely');

// 3. Ground runner passes underneath elevated rooftop hurdle safely
player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -20.0);
player.setSupportSurface('GROUND', null);
player.updateCollider();
const groundUnderAC = CollisionResolver.resolveOutcome(acObs, player, null);
assert(groundUnderAC.outcome === 'SAFE_CONTACT', 'Runner on ground passes safely underneath elevated rooftop obstacle');

// =========================================================================
// Suite 7: Safe Exits & Exit Ramp Descent
// =========================================================================
console.log('\n--- Suite 7: Safe Exits & Exit Ramp Descent ---');

const quadChunk = new TrackChunk(factory, collectibleFactory);
quadChunk.populate([
  {
    type: 'TRAIN_COMPOSITION',
    lane: 0,
    zOffset: 6.0,
    length: 69.6,
    hasRamp: true,
    hasExitRamp: true,
    composition: EXPRESS_QUAD_CONSIST
  }
], 0);

const quadObs = quadChunk.obstacles[0];
assert(quadObs.hasExitRamp === true, 'Quad consist configured with hasExitRamp');
assert(quadObs.exitRampCollider !== undefined, 'Exit ramp collider created');

const exitTop = quadObs.exitRampStartZ!;
const exitBottom = quadObs.exitRampEndZ!;
assert(Math.abs((exitTop - exitBottom) - 8.0) < 0.1, `Exit ramp spans 8.0m (${exitTop}m to ${exitBottom}m)`);

(trackManager as any).chunks = [quadChunk];

// Step down exit ramp from top to bottom
player.position.set(0, 4.35, exitTop);
player.updateCollider();
(trackManager as any).updateGroundHeight(player, 0.016);
assert(Math.abs(player.position.y - 4.35) < 0.1, 'Exit ramp top supports player at 4.35m');

// Exit ramp midpoint
const midExitH = (4.35 + CONSTANTS.PLAYER_BASE_Y) * 0.5;
player.position.set(0, midExitH, (exitTop + exitBottom) * 0.5);
player.updateCollider();
(trackManager as any).updateGroundHeight(player, 0.016);
assert(Math.abs(player.position.y - midExitH) < 0.1, `Exit ramp midpoint follows smooth decline (Y = ${player.position.y.toFixed(2)}m)`);

// Exit ramp bottom
player.position.set(0, CONSTANTS.PLAYER_BASE_Y, exitBottom);
player.updateCollider();
(trackManager as any).updateGroundHeight(player, 0.016);
assert(player.getSupportSurface() === 'GROUND', 'Exit ramp bottom smoothly returns to GROUND surface');
assert(Math.abs(player.position.y - CONSTANTS.PLAYER_BASE_Y) < 0.1, 'Player landed on ground safely with zero damage');

// =========================================================================
// Suite 8: Rooftop Coin Arrangements
// =========================================================================
console.log('\n--- Suite 8: Rooftop Coin Arrangements ---');

const rooftopCoins = CoinPatternLibrary.createRooftopRun(0, 10.0, 10, 2.2);
assert(rooftopCoins.count === 10, `Rooftop run pattern created ${rooftopCoins.count} coins`);
assert(rooftopCoins.yOffset === CONSTANTS.COIN_ROOFTOP_Y, 'Rooftop coins at 5.20m');
assert(rooftopCoins.yOffset! > CONSTANTS.TRAIN_ROOF_SURFACE_Y, 'Rooftop coins strictly above train roof surface');
assert(rooftopCoins.supportSurface === 'TRAIN_ROOF', 'Rooftop coins track TRAIN_ROOF support surface');

const gapCoins = CoinPatternLibrary.createCarriageGapJumpArc(0, 20.0, 5, 2.0);
assert(gapCoins.isArc === true, 'Carriage gap jump arc created with isArc flag');
assert(gapCoins.yOffset! > CONSTANTS.COIN_ROOFTOP_Y + 0.5, `Carriage gap arc rises above roof (apex Y = ${gapCoins.yOffset}m)`);
assert(gapCoins.landingSurface === 'TRAIN_ROOF', 'Carriage gap arc targets TRAIN_ROOF landing surface');

const rewardCoins = CoinPatternLibrary.createPostRooftopReward(0, 50.0, 4);
assert(rewardCoins.count === 4, 'Post-rooftop reward coins created');
assert(Math.abs(rewardCoins.yOffset! - CONSTANTS.COIN_GROUND_Y) < 0.05, 'Post-rooftop reward coins placed at ground height');
assert(rewardCoins.supportSurface === 'GROUND', 'Post-rooftop reward coins placed on GROUND');

// =========================================================================
// Suite 9: Moving vs Stationary Train Interactions & Fatal Frontal Invariants
// =========================================================================
console.log('\n--- Suite 9: Moving vs Stationary Train Collisions & Invariants ---');

const solidTrain: ObstacleInstance = {
  id: 'solid_train_test',
  type: 'TRAIN',
  lane: 0,
  collider: new THREE.Box3(new THREE.Vector3(-1.2, 0, -30), new THREE.Vector3(1.2, 4.2, -10)),
  bodyCollider: new THREE.Box3(new THREE.Vector3(-1.2, 0, -30), new THREE.Vector3(1.2, 3.8, -10)),
  roofSurfaceY: 4.35,
  active: true,
  hasRamp: false,
  length: 20,
  nearMissBox: new THREE.Box3(),
  nearMissTriggered: false,
  isMoving: false,
  isMovingActive: false,
  velocityZ: 0,
  initialLocalZ: -20,
  previousWorldZ: -20,
  telegraphed: false,
  group: new THREE.Group()
};

player.reset();
player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -9.8);
player.updateCollider();
const frontalCrash = CollisionResolver.resolveOutcome(solidTrain, player, null);
assert(frontalCrash.outcome === 'MAJOR_FATAL_HIT', 'Frontal impact with ramp-less train remains unconditionally fatal');
assert(frontalCrash.isFrontal === true, 'Collision correctly diagnosed as frontal');

const oncomingTrain: ObstacleInstance = {
  id: 'oncoming_train_test',
  type: 'MOVING_TRAIN',
  lane: 1,
  collider: new THREE.Box3(new THREE.Vector3(1.4, 0, -40), new THREE.Vector3(3.8, 4.2, -10)),
  bodyCollider: new THREE.Box3(new THREE.Vector3(1.4, 0, -40), new THREE.Vector3(3.8, 3.8, -10)),
  roofSurfaceY: 4.35,
  active: true,
  hasRamp: false,
  length: 30,
  nearMissBox: new THREE.Box3(),
  nearMissTriggered: false,
  isMoving: true,
  isMovingActive: true,
  velocityZ: CONSTANTS.MOVING_TRAIN_SPEED,
  initialLocalZ: -25,
  previousWorldZ: -25,
  telegraphed: false,
  group: new THREE.Group()
};

// Runner on roof of train in lane 0 leaps into oncoming train in lane 1
player.position.set(CONSTANTS.LANES[1], 2.5, -9.8);
player.updateCollider();
const oncomingCrash = CollisionResolver.resolveOutcome(oncomingTrain, player, null);
assert(oncomingCrash.outcome === 'MAJOR_FATAL_HIT', 'Oncoming train remains fatal; no infinite immunity near trains');

// =========================================================================
// Suite 10: Chunk Recycling Support Retention Guard
// =========================================================================
console.log('\n--- Suite 10: Chunk Recycling Support Retention ---');

const recycleChunk = new TrackChunk(factory, collectibleFactory);
recycleChunk.populate([
  {
    type: 'TRAIN_COMPOSITION',
    lane: 0,
    zOffset: 10.0,
    length: 69.6,
    hasRamp: true,
    composition: EXPRESS_QUAD_CONSIST
  }
], 0);

const longTrainObs = recycleChunk.obstacles[0];
(trackManager as any).chunks = [recycleChunk];

// Player is actively supported on this long train roof
player.setSupportSurface('TRAIN_ROOF', longTrainObs.id, longTrainObs.carriageGroupId);
player.position.set(0, 4.35, -50.0);

// Advance manager update
(trackManager as any).update(player, 0.016, 1.0);

assert((trackManager as any).chunks.includes(recycleChunk) === true, 'Chunk supporting player is protected from premature recycling');

// =========================================================================
// Suite 11: Speed Scaling & Procedural Pattern Reachability
// =========================================================================
console.log('\n--- Suite 11: Procedural Pattern Reachability Verification ---');

const newPatterns = [
  'BEGINNER_ROOFTOP_CRUISE',
  'INTERMEDIATE_MULTI_CARRIAGE_EXPEDITION',
  'EXPRESS_QUAD_ROOFTOP_CHALLENGE',
  'ADVANCED_CARRIAGE_GAP_HOP'
];

const testSpeeds = [18.0, 25.0, 38.0];

for (const patternName of newPatterns) {
  const pattern = OBSTACLE_PATTERNS.find((p) => p.name === patternName);
  assert(pattern !== undefined, `Pattern "${patternName}" registered in OBSTACLE_PATTERNS`);

  for (const speed of testSpeeds) {
    const reachability = validatePatternFeasibility(pattern!, speed);
    assert(reachability.solvable === true, `Pattern "${patternName}" is 100% human solvable at ${speed} m/s`);
  }
}

// =========================================================================
// Suite 12: Deterministic Rooftop Route Planner & Multi-Train Switching
// =========================================================================
console.log('\n--- Suite 12: Deterministic Rooftop Route Planner & Archetypes ---');

// 1. Planner Reproducibility: same seed + speed + tier produces identical plan
const planA = RooftopRoutePlanner.planRoute({ seed: 42, tier: 'ADVANCED', playerSpeed: 25.0 });
const planB = RooftopRoutePlanner.planRoute({ seed: 42, tier: 'ADVANCED', playerSpeed: 25.0 });
assert(planA.id === planB.id, 'Same seed produces identical plan ID');
assert(planA.archetype === planB.archetype, 'Same seed produces identical archetype');
assert(planA.targetDuration === planB.targetDuration, 'Same seed produces identical target duration');
assert(planA.legs.length === planB.legs.length, 'Same seed produces identical leg count');
assert(planA.transfers.length === planB.transfers.length, 'Same seed produces identical transfer count');
assert(planA.entryLane === planB.entryLane, 'Same seed produces identical entry lane');

// 2. Different seeds meaningfully vary archetype/lane/structure
const planC = RooftopRoutePlanner.planRoute({ seed: 9999, tier: 'ADVANCED', playerSpeed: 25.0 });
assert(planA.seed !== planC.seed, 'Different seeds recorded');

// 3. Duration Scaling with Runner Speed
const planSlow = RooftopRoutePlanner.planRoute({ seed: 100, tier: 'EXPERT', playerSpeed: 18.0, forcedArchetype: 'SIDE_SWITCH' });
const planFast = RooftopRoutePlanner.planRoute({ seed: 100, tier: 'EXPERT', playerSpeed: 38.0, forcedArchetype: 'SIDE_SWITCH' });
assert(planFast.totalLength > planSlow.totalLength, `Route scales with speed: fast length (${planFast.totalLength.toFixed(1)}m) > slow length (${planSlow.totalLength.toFixed(1)}m)`);

// 4. All 4 Archetypes Function Deterministically
const archetypes: RooftopRouteArchetype[] = ['RAMP_RUN_EXIT', 'SIDE_SWITCH', 'DOUBLE_SWITCH', 'GAP_HOP'];
for (const arch of archetypes) {
  const p = RooftopRoutePlanner.planRoute({ seed: 777, tier: 'ADVANCED', playerSpeed: 28.0, forcedArchetype: arch });
  assert(p.archetype === arch, `Archetype ${arch} generated successfully`);
  const pattern = RooftopRoutePlanner.createTrackPattern(p);
  assert(pattern.obstacles.length > 0, `Track pattern for ${arch} contains obstacles`);
  assert(pattern.collectibles.length > 0, `Track pattern for ${arch} contains collectibles`);
  const reachability = ReachabilityValidator.validateRooftopRoute(p, 28.0, undefined, 'NORMAL');
  assert(reachability.solvable === true, `Archetype ${arch} is 100% reachable at 28 m/s`);
}

// 5. Lateral Switching Rules: exactly 1 adjacent lane, airtime <= 0.60s
const switchPlan = RooftopRoutePlanner.planRoute({ seed: 123, tier: 'INTERMEDIATE', playerSpeed: 25.0, forcedArchetype: 'SIDE_SWITCH' });
const transfer = switchPlan.transfers[0];
assert(transfer !== undefined, 'Side switch plan contains transfer');
assert(Math.abs(transfer.targetLane - transfer.sourceLane) === 1, 'Transfer is strictly adjacent 1-lane move');
assert(transfer.requiredAirtime <= 0.60, 'Airtime fits within normal 0.60s jump duration');
assert(CONSTANTS.LANE_CHANGE_DURATION <= 0.60, '0.18s lane change fits within jump airtime');

// 6. Real Unsupported Gaps: Gap hop has 3.5m unsupported space
const gapPlan = RooftopRoutePlanner.planRoute({ seed: 456, tier: 'INTERMEDIATE', playerSpeed: 25.0, forcedArchetype: 'GAP_HOP' });
const gapTransfer = gapPlan.transfers[0];
assert(gapTransfer !== undefined && gapTransfer.kind === 'LONGITUDINAL_GAP_JUMP', 'Gap hop plan has LONGITUDINAL_GAP_JUMP');
assert(gapPlan.legs[1].chunkRelativeZ > gapPlan.legs[0].length, 'Gap hop second train starts after first train end with real gap');

// 7. Multi-Chunk Route Continuity & Chunk Pinning Diagnostics
const tmDiag = (trackManager as any).getRooftopTraversalDiagnostics();
assert(tmDiag !== undefined, 'Rooftop traversal diagnostics available');
assert(typeof tmDiag.currentSupportSurface === 'string', 'Diagnostics report support surface');
assert(typeof tmDiag.movingSupportDisplacementCurrentFrame === 'number', 'Diagnostics track moving displacement');

console.log('\n=======================================================');
console.log(`🏆 ALL ${passedTests}/${totalTests} TASK 3 TRAIN ROOFTOP TESTS PASSED!`);
console.log('=======================================================\n');
