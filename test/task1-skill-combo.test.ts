import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { Player } from '../src/player/Player';
import { SkillComboManager } from '../src/core/SkillComboManager';
import { ObstacleFactory, ObstacleInstance } from '../src/track/ObstacleFactory';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { TrackChunk } from '../src/track/TrackChunk';
import { TrackManager } from '../src/track/TrackManager';
import { CollisionResolver } from '../src/track/CollisionResolver';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { UpgradeManager } from '../src/player/UpgradeManager';

// Polyfill localStorage & DOM for Node test runner
const store: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, val: string) => { store[key] = String(val); },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k in store) delete store[k]; },
  length: 0,
  key: () => null
} as any;

class Mock2DContext {
  fillStyle = '#000';
  strokeStyle = '#000';
  lineWidth = 1;
  font = '10px sans-serif';
  fillRect() {}
  clearRect() {}
  strokeRect() {}
  rect() {}
  roundRect() {}
  beginPath() {}
  arc() {}
  ellipse() {}
  fill() {}
  stroke() {}
  moveTo() {}
  lineTo() {}
  bezierCurveTo() {}
  quadraticCurveTo() {}
  closePath() {}
  clip() {}
  save() {}
  restore() {}
  translate() {}
  rotate() {}
  scale() {}
  setLineDash() {}
  getLineDash() { return []; }
  resetTransform() {}
  fillText() {}
  strokeText() {}
  measureText(str: string) { return { width: (str || '').length * 8 }; }
  createLinearGradient() { return { addColorStop() {} }; }
  createRadialGradient() { return { addColorStop() {} }; }
  createPattern() { return {}; }
  drawImage() {}
  getImageData() { return { data: new Uint8ClampedArray(4) }; }
  putImageData() {}
}

class MockCanvas {
  style = {};
  width = 512;
  height = 512;
  addEventListener() {}
  removeEventListener() {}
  getContext(type: string) {
    if (type === '2d') return new Mock2DContext();
    return null;
  }
}

(globalThis as any).document = {
  getElementById: () => null,
  createElement: (tag: string) => {
    if (tag === 'canvas') return new MockCanvas();
    return {
      appendChild: () => {},
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      style: {}
    };
  },
  body: {
    classList: { add: () => {}, remove: () => {}, contains: () => false }
  }
};

console.log('🧪 Starting Metro Runner 3D: Task 1 Premium Skill Combo, Perfect Dodge & Style System Test Suite...\n');

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

const factory = new ObstacleFactory();
const collectibleFactory = new CollectibleFactory();
const scene = new THREE.Scene();
const trackManager = new TrackManager(scene);
const comboMgr = SkillComboManager.getInstance();

// =========================================================================
// Suite 1: Perfect Jump, Perfect Slide & Clean Lane Dodge
// =========================================================================
console.log('--- Suite 1: Perfect Jump, Slide & Clean Lane Dodge ---');

comboMgr.reset();
const player = new Player();
player.reset();

// 1. Create a LOW_BARRIER obstacle chunk
const jumpChunk = new TrackChunk(factory, collectibleFactory);
jumpChunk.populate([
  { type: 'LOW_BARRIER', lane: 0, zOffset: 15.0 }
], 0);

const lowBarrier = jumpChunk.obstacles[0];
(trackManager as any).chunks = [jumpChunk];

// Position player in lane 0 approaching the barrier
player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -5.0);
player.currentLane = 0;
player.updateCollider();

// Player jumps before the hurdle
player.jump();
player.position.y = 2.4; // Airborne safely above 1.45m barrier
player.updateCollider();

let awardedEvents: any[] = [];
const skillSub = EventBus.getInstance().on(EVENTS.SKILL_EVENT, (payload) => {
  awardedEvents.push(payload);
});

// Run trackManager update as player passes the obstacle
player.position.z = lowBarrier.collider.min.z - 1.0; // Safely behind the hurdle
player.updateCollider();
trackManager.update(player, 0.016, 1.0);

assert(lowBarrier.passed === true, 'Low barrier obstacle marked as passed');
assert(awardedEvents.some(e => e.type === 'PERFECT_JUMP'), 'PERFECT_JUMP awarded when jumping over low hurdle');
assert(comboMgr.getCombo() >= 1, 'Combo counter incremented on perfect jump');

// Verify that it only awards once for this obstacle encounter
const countBefore = awardedEvents.filter(e => e.type === 'PERFECT_JUMP').length;
trackManager.update(player, 0.016, 1.016);
const countAfter = awardedEvents.filter(e => e.type === 'PERFECT_JUMP').length;
assert(countBefore === countAfter, 'PERFECT_JUMP awards strictly once per obstacle encounter');

// 2. PERFECT_SLIDE: Slide under HIGH_BARRIER
awardedEvents = [];
comboMgr.reset();
player.reset();

const slideChunk = new TrackChunk(factory, collectibleFactory);
slideChunk.populate([
  { type: 'HIGH_BARRIER', lane: 0, zOffset: 15.0 }
], 0);

const highBarrier = slideChunk.obstacles[0];
(trackManager as any).chunks = [slideChunk];

player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -5.0);
player.currentLane = 0;
player.slide(); // Slide initiated
player.updateCollider();

// Pass safely under high barrier while sliding
player.position.z = highBarrier.collider.min.z - 1.0;
player.updateCollider();
trackManager.update(player, 0.016, 2.0);

assert(highBarrier.passed === true, 'High barrier obstacle marked as passed');
assert(awardedEvents.some(e => e.type === 'PERFECT_SLIDE'), 'PERFECT_SLIDE awarded when sliding under high barrier');
assert(comboMgr.getCombo() >= 1, 'Combo counter incremented on perfect slide');

// 3. CLEAN_LANE_DODGE: Evading an oncoming obstacle by switching lanes
awardedEvents = [];
comboMgr.reset();
player.reset();

const dodgeChunk = new TrackChunk(factory, collectibleFactory);
dodgeChunk.populate([
  { type: 'TRAIN', lane: 0, zOffset: 25.0, length: 16.0 }
], 0);

const trainObs = dodgeChunk.obstacles[0];
(trackManager as any).chunks = [dodgeChunk];

// Approach train while in lane 0
player.position.set(0, CONSTANTS.PLAYER_BASE_Y, trainObs.collider.max.z + 18.0);
player.currentLane = 0;
player.updateCollider();
trackManager.update(player, 0.016, 3.0);
assert(trainObs.playerEncounterLane === 0, 'Approaching train records player encounter lane as 0');

// Player switches to lane 1 (clean lane change evasion)
player.position.set(CONSTANTS.LANES[1], CONSTANTS.PLAYER_BASE_Y, trainObs.collider.max.z + 10.0);
player.currentLane = 1;
player.updateCollider();

// Pass train in lane 1
player.position.z = trainObs.collider.min.z - 1.0;
player.updateCollider();
trackManager.update(player, 0.016, 3.5);

assert(awardedEvents.some(e => e.type === 'CLEAN_LANE_DODGE'), 'CLEAN_LANE_DODGE awarded when safely switching lanes away from hazard');

// =========================================================================
// Suite 2: Near Miss Detection & Strict Collision Isolation
// =========================================================================
console.log('\n--- Suite 2: Near Miss Detection & Collision Isolation ---');

awardedEvents = [];
comboMgr.reset();
player.reset();

const nearMissChunk = new TrackChunk(factory, collectibleFactory);
nearMissChunk.populate([
  { type: 'TRAIN', lane: 0, zOffset: 20.0, length: 16.0 }
], 0);

const staticTrain = nearMissChunk.obstacles[0];
(trackManager as any).chunks = [nearMissChunk];

// Position runner in close-shave margin laterally (0.50m outside lethal box, within 0.6m near-miss zone)
const lethalBox = staticTrain.bodyCollider || staticTrain.collider;
player.position.set(lethalBox.max.x + 0.50, CONSTANTS.PLAYER_BASE_Y, lethalBox.max.z + 0.5);
player.updateCollider();

// Verify within nearMissBox but NOT intersecting lethal collider
assert(staticTrain.nearMissBox.intersectsBox(player.collider), 'Runner is within near-miss threshold box');
assert(!lethalBox.intersectsBox(player.collider), 'Runner does not intersect train lethal collider');

// Move past front impact plane while remaining in near-miss corridor
player.position.z = lethalBox.max.z - 1.0;
player.updateCollider();
trackManager.update(player, 0.016, 4.0);

assert(staticTrain.nearMissTriggered === true, 'Near miss triggered for close avoidance');
assert(awardedEvents.some(e => e.type === 'NEAR_MISS'), 'NEAR_MISS skill event awarded on close shave');

// Anti-exploit: Collision must NOT award near miss
awardedEvents = [];
comboMgr.reset();
player.reset();

const crashChunk = new TrackChunk(factory, collectibleFactory);
crashChunk.populate([
  { type: 'TRAIN', lane: 0, zOffset: 20.0, length: 16.0 }
], 0);

const crashTrain = crashChunk.obstacles[0];
(trackManager as any).chunks = [crashChunk];

// Directly collide frontally with train in lane 0
player.position.set(CONSTANTS.LANES[0], CONSTANTS.PLAYER_BASE_Y, crashTrain.collider.max.z - 0.2);
player.currentLane = 0;
player.updateCollider();
trackManager.update(player, 0.016, 5.0);

assert(crashTrain.hadCollision === true, 'Direct collision flags hadCollision on obstacle');
assert(!awardedEvents.some(e => e.type === 'NEAR_MISS'), 'Actual collision strictly prevents near-miss award');
assert(comboMgr.getCombo() === 0, 'Collision resets combo to 0');

// =========================================================================
// Suite 3: Combo Streaks, Progression Tiers & Style Multipliers
// =========================================================================
console.log('\n--- Suite 3: Combo Streaks, Progression Tiers & Style Multipliers ---');

comboMgr.reset();

assert(comboMgr.getCombo() === 0, 'Combo starts at 0');
assert(comboMgr.getTier() === 'NORMAL', 'Initial tier is NORMAL');
assert(comboMgr.getMultiplier() === 1.0, 'Initial multiplier is 1.0x');

// 1 event -> Combo 1 (Normal 1.0x)
comboMgr.recordSkillEvent('PERFECT_JUMP', 'obs_t1');
assert(comboMgr.getCombo() === 1, 'Combo is 1');
assert(comboMgr.getTier() === 'NORMAL', 'Tier 1 is NORMAL');

// 3 events -> Combo 3 (Momentum 1.25x)
comboMgr.recordSkillEvent('PERFECT_SLIDE', 'obs_t2');
comboMgr.recordSkillEvent('CLEAN_LANE_DODGE', 'obs_t3');
assert(comboMgr.getCombo() === 3, 'Combo is 3');
assert(comboMgr.getTier() === 'MOMENTUM', 'Tier at 3 is MOMENTUM');
assert(comboMgr.getMultiplier() === 1.25, 'Multiplier at 3 is 1.25x');

// 5 events -> Combo 5 (Great 1.50x)
comboMgr.recordSkillEvent('NEAR_MISS', 'obs_t4');
comboMgr.recordSkillEvent('ROOFTOP_LANDING', 'obs_t5');
assert(comboMgr.getCombo() === 5, 'Combo is 5');
assert(comboMgr.getTier() === 'GREAT', 'Tier at 5 is GREAT');
assert(comboMgr.getMultiplier() === 1.50, 'Multiplier at 5 is 1.5x');

// 8 events -> Combo 8 (Excellent 1.75x)
comboMgr.recordSkillEvent('PERFECT_JUMP', 'obs_t6');
comboMgr.recordSkillEvent('PERFECT_SLIDE', 'obs_t7');
comboMgr.recordSkillEvent('CLEAN_LANE_DODGE', 'obs_t8');
assert(comboMgr.getCombo() === 8, 'Combo is 8');
assert(comboMgr.getTier() === 'EXCELLENT', 'Tier at 8 is EXCELLENT');
assert(comboMgr.getMultiplier() === 1.75, 'Multiplier at 8 is 1.75x');

// 12 events -> Combo 12 (Masterful 2.0x)
comboMgr.recordSkillEvent('ROOFTOP_GAP_JUMP', 'obs_t9');
comboMgr.recordSkillEvent('NEAR_MISS', 'obs_t10');
comboMgr.recordSkillEvent('PERFECT_JUMP', 'obs_t11');
comboMgr.recordSkillEvent('CLEAN_OBSTACLE_CHAIN', 'obs_t12');
assert(comboMgr.getCombo() === 12, 'Combo is 12');
assert(comboMgr.getTier() === 'MASTERFUL', 'Tier at 12 is MASTERFUL');
assert(comboMgr.getMultiplier() === 2.00, 'Multiplier at 12 is 2.0x');

// Event score cap anti-exploit
const hugeEvent = comboMgr.recordSkillEvent('ROOFTOP_GAP_JUMP', 'obs_huge', 1000);
assert(hugeEvent !== null && hugeEvent.finalPoints <= CONSTANTS.SKILL_COMBO.MAX_EVENT_SCORE, `Single event score is capped at ${CONSTANTS.SKILL_COMBO.MAX_EVENT_SCORE} (got ${hugeEvent?.finalPoints})`);

// =========================================================================
// Suite 4: Combo Expiration, Simulation Time & Pause Immunity
// =========================================================================
console.log('\n--- Suite 4: Combo Expiration, Simulation Time & Pause Immunity ---');

comboMgr.reset();
comboMgr.recordSkillEvent('PERFECT_JUMP', 'obs_decay_1');
assert(comboMgr.getCombo() === 1, 'Combo active at 1');
assert(comboMgr.getTimeRemaining() > 3.9, 'Combo window initialized to ~4.0s');

// Simulation update advances timer
comboMgr.update(1.5);
assert(Math.abs(comboMgr.getTimeRemaining() - 2.5) < 0.05, `Combo timer decayed by 1.5s (remaining: ${comboMgr.getTimeRemaining().toFixed(2)}s)`);
assert(comboMgr.getCombo() === 1, 'Combo still active');

// Pause: zero dt simulated, timer does NOT advance
comboMgr.update(0.0);
assert(Math.abs(comboMgr.getTimeRemaining() - 2.5) < 0.05, 'Pause (dt=0) freezes combo timer perfectly');
assert(comboMgr.getCombo() === 1, 'Combo preserved during pause');

// New skill action refreshes combo window
comboMgr.recordSkillEvent('PERFECT_SLIDE', 'obs_decay_2');
assert(comboMgr.getTimeRemaining() >= 3.95, 'New skill action resets combo window back to full 4.0s');
assert(comboMgr.getCombo() === 2, 'Combo incremented to 2');

// Expiration through prolonged inactivity
let expiredPayload: any = null;
const expireSub = EventBus.getInstance().on(EVENTS.COMBO_EXPIRED, (p) => { expiredPayload = p; });
comboMgr.update(4.1);
assert(comboMgr.getCombo() === 0, 'Combo expired to 0 after inactivity exceeds window');
assert(expiredPayload !== null && expiredPayload.expiredCombo === 2, 'COMBO_EXPIRED emitted with previous combo count');
expireSub();

// =========================================================================
// Suite 5: Stumbles, Fatal Collisions & Revival Isolation
// =========================================================================
console.log('\n--- Suite 5: Stumbles, Fatal Collisions & Revival Isolation ---');

comboMgr.reset();
comboMgr.recordSkillEvent('PERFECT_JUMP', 'obs_col_1');
comboMgr.recordSkillEvent('PERFECT_SLIDE', 'obs_col_2');
assert(comboMgr.getCombo() === 2, 'Combo built up to 2');

// Minor stumble breaks combo
EventBus.getInstance().emit(EVENTS.STUMBLE);
assert(comboMgr.getCombo() === 0, 'Minor stumble breaks active combo to 0');

// Build combo again
comboMgr.recordSkillEvent('PERFECT_JUMP', 'obs_col_3');
comboMgr.recordSkillEvent('PERFECT_JUMP', 'obs_col_4');
assert(comboMgr.getCombo() === 2, 'Combo rebuilt to 2');

// Fatal collision resets combo
EventBus.getInstance().emit(EVENTS.CRASH, 'TRAIN_COLLISION');
assert(comboMgr.getCombo() === 0, 'Fatal crash breaks combo to 0');

// Revival executed does NOT restore broken combo (Requirement D)
EventBus.getInstance().emit(EVENTS.REVIVE_EXECUTED);
assert(comboMgr.getCombo() === 0, 'Revival strictly does NOT restore broken combo');

// Protected Hit (Shield or Hoverboard) breaks combo (Requirement D & H)
comboMgr.recordSkillEvent('PERFECT_JUMP', 'obs_col_5');
assert(comboMgr.getCombo() === 1, 'Combo is 1 before protected hit');
EventBus.getInstance().emit('COLLISION_OCCURRED', { outcome: 'PROTECTED_HIT' });
assert(comboMgr.getCombo() === 0, 'Shield-protected collision breaks combo and does not count as dodge');

// =========================================================================
// Suite 6: Rooftop Maneuvers (Landing & Gap Hops)
// =========================================================================
console.log('\n--- Suite 6: Rooftop Maneuvers (Landing & Gap Hops) ---');

comboMgr.reset();
player.reset();

// 1. Initial boarding of train roof awards ROOFTOP_LANDING
player.resolveRoofLanding(4.35, 'train_car_A', 'consist_1');
const statsAfterLanding = comboMgr.getStats();
assert(statsAfterLanding.rooftopLandings === 1, 'Landing on train roof awards ROOFTOP_LANDING');
assert(statsAfterLanding.totalRooftopManeuvers === 1, 'Total rooftop maneuvers incremented');

// 2. Continuous running or jumping in place on SAME train roof does NOT award repeated points
player.resolveRoofLanding(4.35, 'train_car_A', 'consist_1');
const statsAfterSameRoof = comboMgr.getStats();
assert(statsAfterSameRoof.rooftopLandings === 1, 'Re-touching same train roof does NOT duplicate landing award');

// 3. Gap Hop across unbridged carriages/trains awards ROOFTOP_GAP_JUMP
// Player jumps while on train roof
player.jump();
assert(player.jumpTakeoffSurface === 'TRAIN_ROOF', 'Player records takeoff from train roof');
assert(player.jumpTakeoffObstacleId === 'train_car_A', 'Takeoff obstacle id recorded');

// Player lands across gap onto adjacent carriage 'train_car_B'
player.position.z -= 6.0; // Moved forward across gap
player.resolveRoofLanding(4.35, 'train_car_B', 'consist_2');

const statsAfterGap = comboMgr.getStats();
assert(statsAfterGap.rooftopGapJumps === 1, 'Jumping across gap to new train car awards ROOFTOP_GAP_JUMP');
assert(statsAfterGap.totalRooftopManeuvers === 2, 'Total rooftop maneuvers is now 2');

// =========================================================================
// Suite 7: Economy Isolation & Anti-Exploit Integrity
// =========================================================================
console.log('\n--- Suite 7: Economy Isolation & Anti-Exploit Integrity ---');

comboMgr.reset();
player.reset();

const coinsBefore = ProgressionManager.getInstance().getState().lifetimeStats.totalCoins;
const walletCoinsBefore = UpgradeManager.getInstance().getCoins();

// Award multiple high-multiplier skill events
comboMgr.recordSkillEvent('PERFECT_JUMP', 'eco_1');
comboMgr.recordSkillEvent('PERFECT_SLIDE', 'eco_2');
comboMgr.recordSkillEvent('ROOFTOP_GAP_JUMP', 'eco_3');

const coinsAfter = ProgressionManager.getInstance().getState().lifetimeStats.totalCoins;
const walletCoinsAfter = UpgradeManager.getInstance().getCoins();

assert(coinsBefore === coinsAfter, 'Lifetime coins strictly unchanged by skill style scoring');
assert(walletCoinsBefore === walletCoinsAfter, 'Wallet spendable coins strictly unchanged by skill style scoring');

// Deduplication anti-exploit
const event1 = comboMgr.recordSkillEvent('PERFECT_JUMP', 'duplicate_obs_id');
assert(event1 !== null, 'First event for obstacle awards points');
const eventDuplicate = comboMgr.recordSkillEvent('PERFECT_JUMP', 'duplicate_obs_id');
assert(eventDuplicate === null, 'Identical event for same obstacle instance rejected (anti-exploit)');

// Recycling resets deduplication
comboMgr.clearScoredObstacle('duplicate_obs_id');
const eventAfterRecycle = comboMgr.recordSkillEvent('PERFECT_JUMP', 'duplicate_obs_id');
assert(eventAfterRecycle !== null, 'Recycled obstacle cleared and eligible for new encounters');

skillSub();

console.log(`\n🎉 All ${passedTests}/${totalTests} Task 1 Skill Combo & Style System Unit Tests Passed!`);
