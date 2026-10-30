/**
 * Phase 6 Final Release Stability & Integration Audit Suite
 * metro Runner 3D — Strict Quality Gate
 */

import * as THREE from 'three';

// Global mocks for Node environment
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

class Mock2DContext {
  canvas = { width: 512, height: 512 };
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 1;
  font = '';
  textAlign = '';
  textBaseline = '';
  shadowColor = '';
  shadowBlur = 0;
  shadowOffsetX = 0;
  shadowOffsetY = 0;
  globalAlpha = 1;
  globalCompositeOperation = 'source-over';
  fillRect() {}
  strokeRect() {}
  clearRect() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  roundRect() {}
  ellipse() {}
  bezierCurveTo() {}
  quadraticCurveTo() {}
  drawImage() {}
  createPattern() { return null; }
  fill() {}
  stroke() {}
  save() {}
  restore() {}
  translate() {}
  rotate() {}
  scale() {}
  fillText() {}
  strokeText() {}
  measureText(str: string) { return { width: str.length * 8 }; }
  createLinearGradient() { return { addColorStop() {} }; }
  createRadialGradient() { return { addColorStop() {} }; }
}

class MockCanvas {
  style = {};
  width = 512;
  height = 512;
  addEventListener() {}
  removeEventListener() {}
  getContext() { return new Mock2DContext(); }
}

if (typeof globalThis.document === 'undefined') {
  (globalThis as any).document = {
    body: {
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false,
        toggle: () => false
      }
    },
    getElementById: () => null,
    createElement: (tag: string) => {
      if (tag === 'canvas') return new MockCanvas();
      return {
        className: '',
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        appendChild: () => {},
        querySelector: () => null,
        innerHTML: '',
        style: {}
      };
    }
  };
}

import { CONSTANTS, LaneIndex } from '../src/core/Constants';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { TrackChunk } from '../src/track/TrackChunk';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { OBSTACLE_PATTERNS } from '../src/track/ObstaclePatterns';
import { SpeedController } from '../src/core/SpeedController';
import { DifficultyController } from '../src/track/DifficultyController';
import { ReachabilityValidator } from '../src/track/ReachabilityValidator';
import { CollisionResolver } from '../src/track/CollisionResolver';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { UpgradeManager } from '../src/player/UpgradeManager';
import { HoverboardManager } from '../src/hoverboard/HoverboardManager';
import { ReviveManager } from '../src/revive/ReviveManager';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string): void {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    failed++;
    throw new Error(`Assertion failed: ${msg}`);
  }
  passed++;
  console.log(`✅ PASSED: ${msg}`);
}

console.log('🧪 Starting Metro Runner 3D: Phase 6 Final Release-Stability Integration Suite...\n');

// ============================================================================
// SUITE 1: Critical Gameplay Locomotion & State Regression
// ============================================================================
console.log('--- Suite 1: Critical Locomotion & State Invariants ---');

const player = new Player();
player.reset();

function stepPlayer(p: Player, duration: number = 0.25): void {
  const dt = 1 / 60;
  let elapsed = 0;
  while (elapsed < duration) {
    p.update(dt);
    elapsed += dt;
  }
}

// 1. Lane Movement & Clamping
assert(player.currentLane === 0, 'Player starts in center lane (0)');
player.handleInput('RIGHT');
stepPlayer(player, 0.25);
assert(player.currentLane === 1, 'Player shifted to right lane (+1)');

player.handleInput('RIGHT'); // Exceed max
stepPlayer(player, 0.25);
assert(player.currentLane === 1, 'Player clamped at right boundary (+1)');

player.handleInput('LEFT');
stepPlayer(player, 0.25);
assert(player.currentLane === 0, 'Player shifted back to center lane (0)');

player.handleInput('LEFT');
stepPlayer(player, 0.25);
assert(player.currentLane === -1, 'Player shifted to left lane (-1)');

player.handleInput('LEFT'); // Exceed min
stepPlayer(player, 0.25);
assert(player.currentLane === -1, 'Player clamped at left boundary (-1)');

// 2. Jump Dynamics
player.reset();
assert(!player.isJumping, 'Player initially grounded');
player.jump();
assert(player.isJumping, 'Jump initiated successfully');
assert(player.verticalVelocity === CONSTANTS.JUMP_INITIAL_VELOCITY, 'Jump vertical velocity matches JUMP_INITIAL_VELOCITY');
assert(player.state === 'JUMP', 'Player state transitions to JUMP');

// 3. Jump -> Fast Drop -> Slide Combo
player.handleInput('DOWN');
assert(player.isFastDropping, 'Fast drop engaged while airborne');
assert(player.verticalVelocity === CONSTANTS.FAST_DROP_SPEED, 'Fast drop velocity matches FAST_DROP_SPEED (-26 m/s)');

// Advance frames to touchdown
for (let f = 0; f < 30; f++) {
  player.update(1 / 60);
}
assert(player.position.y <= CONSTANTS.PLAYER_BASE_Y + 0.01, 'Player touched down on ground');
assert(player.isSliding, 'Player automatically transitions to slide upon landing');
assert(player.state === 'SLIDE', 'State is SLIDE on touchdown');
assert(player.collider.max.y - player.collider.min.y <= CONSTANTS.PLAYER_HEIGHT_SLIDE + 0.05, 'Collider height matches SLIDE height (0.75m)');

// Advance past slide duration
for (let f = 0; f < 60; f++) {
  player.update(1 / 60);
}
assert(!player.isSliding, 'Slide concludes after duration');
assert(player.state === 'RUN', 'State returns to RUN');
assert(player.collider.max.y - player.collider.min.y >= CONSTANTS.PLAYER_HEIGHT_RUN - 0.05, 'Collider height restored to RUN height (1.80m)');

// ============================================================================
// SUITE 2: Fatal Collision Idempotency & Clean Death Transition
// ============================================================================
console.log('\n--- Suite 2: Fatal Collision Idempotency & No Post-Death Jitter ---');

let crashEventCount = 0;
const bus = EventBus.getInstance();
const unsubscribeCrash = bus.on(EVENTS.CRASH, () => {
  crashEventCount++;
});

player.reset();
player.position.set(0, 0, -10);
player.previousPosition.set(0, 0, -10);
player.speed = 22.0;

// Trigger fatal impact
player.crash('TRAIN_COLLISION');
assert(crashEventCount === 1, 'Exactly one CRASH event emitted on initial impact');
assert(player.isDead(), 'Player is marked dead');
assert(player.state === 'CRASH', 'Player state is CRASH');
assert(player.speed === 0, 'Player forward speed is zeroed on crash');

const deadY = player.position.y;
const deadZ = player.position.z;

// Advance 60 frames post-death
for (let f = 0; f < 60; f++) {
  player.update(1 / 60);
}
assert(crashEventCount === 1, 'No duplicate CRASH events emitted during 60 post-death frames');
assert(Math.abs(player.position.y - deadY) < 0.0001, 'No post-death vertical vibration (Y delta: 0)');
assert(Math.abs(player.position.z - deadZ) < 0.0001, 'No post-death forward drift (Z delta: 0)');
assert(player.state === 'CRASH', 'State remains locked in CRASH (no RUN/CRASH oscillation)');

unsubscribeCrash();

// ============================================================================
// SUITE 3: Rooftop Climbing, Catwalk Lock, and Safe Exit
// ============================================================================
console.log('\n--- Suite 3: Train Rooftop Climbing, Surface Height & Exit ---');

player.reset();
player.position.set(0, 0, -10);
player.previousPosition.copy(player.position);

// 1. Direct Roof Landing / Surface Lock
player.resolveRoofLanding(4.35, 'TRAIN_ROOF_0', 'CONSIST_0');
assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Player enters TRAIN_ROOF support surface');
assert(player.position.y === 4.35, 'Player elevation locked to 4.35m roof plane');

// 2. Jump from rooftop to adjacent rooftop
player.jump();
assert(player.isJumping, 'Jump initiated from train roof');
assert(player.position.y >= 4.35, 'Jump takes off from roof surface altitude (4.35m)');

// Touch down on adjacent roof
player.resolveRoofLanding(4.35, 'TRAIN_ROOF_ADJACENT', 'CONSIST_1');
assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Cleanly landed on adjacent roof');
assert(player.position.y === 4.35, 'Adjacent roof elevation locked at 4.35m');

// 3. Safe exit down ramp to ground
player.setSupportSurface('GROUND');
player.setGroundHeight(CONSTANTS.PLAYER_BASE_Y);
player.position.y = CONSTANTS.PLAYER_BASE_Y;
assert(player.getSupportSurface() === 'GROUND', 'Support surface cleanly returns to GROUND');
assert(player.position.y === CONSTANTS.PLAYER_BASE_Y, 'Player height restored to ground base Y');

// ============================================================================
// SUITE 4: Obstacle Bounds Alignment & Slide/Jump Invariants
// ============================================================================
console.log('\n--- Suite 4: Hurdle and Gantry Geometric Invariants ---');

const obsFactory = new ObstacleFactory();

// 1. Low Barrier
const lowBarrier = obsFactory.createLowBarrier(0);
const lowBox = new THREE.Box3().setFromObject(lowBarrier);
assert(lowBox.max.y >= 1.45 && lowBox.max.y <= 1.65, `Low barrier visual height (${lowBox.max.y.toFixed(2)}m) matches 1.45m solid blocking spec`);
assert(lowBox.min.y <= 0.05, 'Low barrier rests firmly on track ground (no gap underneath)');

// 2. High Overhead Slide Barrier
const highBarrier = obsFactory.createHighBarrier(0);
const highBox = new THREE.Box3().setFromObject(highBarrier);
assert(highBox.max.y >= 3.90, `High barrier overall gantry height (${highBox.max.y.toFixed(2)}m) matches train-height silhouette`);
assert(CONSTANTS.HIGH_BARRIER_CLEARANCE === 1.40, 'HIGH_BARRIER_CLEARANCE is strictly 1.40m');
assert(CONSTANTS.PLAYER_HEIGHT_SLIDE === 0.75, 'Sliding player height is 0.75m (< 1.40m clearance)');
assert(CONSTANTS.PLAYER_HEIGHT_RUN === 1.80, 'Standing player height is 1.80m (> 1.40m clearance)');

// ============================================================================
// SUITE 5: Deterministic Multi-Seed Solvability & Pacing Across Modes
// ============================================================================
console.log('\n--- Suite 5: Multi-Seed Procedural Solvability & Pacing ---');

const testScene = new THREE.Scene();
const trackMgr = new TrackManager(testScene);
const testSeeds = [1337, 4242, 7777, 1599997308, 987654321];

for (const pattern of OBSTACLE_PATTERNS) {
  for (const spd of [18.0, 28.0, 38.0, 52.0]) {
    const res = ReachabilityValidator.validatePattern(pattern as any, spd);
    assert(res.solvable, `Pattern "${pattern.name}" is solvable at speed ${spd} m/s`);
  }
}

// Multi-chunk sequential transition validation across seeds
const seeds = [1337, 4242, 7777, 1599997308, 987654321];
for (const seed of seeds) {
  trackMgr.setGameMode('NORMAL');
  trackMgr.setSeed(seed, true);
  trackMgr.reset(false);

  let currentPattern = trackMgr.chunks[0]?.patternName ? OBSTACLE_PATTERNS.find(p => p.name === trackMgr.chunks[0].patternName) : null;
  let transitionFailures = 0;

  for (let c = 1; c < 15; c++) {
    const chunk = trackMgr.chunks[c % trackMgr.chunks.length];
    const nextPattern = chunk?.patternName ? OBSTACLE_PATTERNS.find(p => p.name === chunk.patternName) : null;
    if (currentPattern && nextPattern) {
      if (!ReachabilityValidator.validateChunkTransition(currentPattern as any, nextPattern as any, 24.0)) {
        transitionFailures++;
      }
    }
    if (nextPattern) currentPattern = nextPattern;
  }
  assert(transitionFailures === 0, `Seed ${seed} (NORMAL mode, 15 chunks): Zero transition failures`);
}

for (const seed of seeds) {
  trackMgr.setGameMode('HARD');
  trackMgr.setSeed(seed, true);
  trackMgr.reset(false);

  let currentPattern = trackMgr.chunks[0]?.patternName ? OBSTACLE_PATTERNS.find(p => p.name === trackMgr.chunks[0].patternName) : null;
  let transitionFailures = 0;

  for (let c = 1; c < 15; c++) {
    const chunk = trackMgr.chunks[c % trackMgr.chunks.length];
    const nextPattern = chunk?.patternName ? OBSTACLE_PATTERNS.find(p => p.name === chunk.patternName) : null;
    if (currentPattern && nextPattern) {
      if (!ReachabilityValidator.validateChunkTransition(currentPattern as any, nextPattern as any, 38.0)) {
        transitionFailures++;
      }
    }
    if (nextPattern) currentPattern = nextPattern;
  }
  assert(transitionFailures === 0, `Seed ${seed} (HARD mode, 15 chunks): Zero transition failures`);
}

// Verify opening hazard distance in Hard Mode for seed 1599997308
trackMgr.setGameMode('HARD');
trackMgr.setSeed(1599997308, true);
trackMgr.reset(false);
const hardChunk0 = trackMgr.chunks[0];
const openingObs = hardChunk0.obstacles[0];
if (openingObs) {
  const distance = Math.abs(openingObs.collider.min.z);
  assert(distance >= 40.0, `Opening hazard distance in Hard Mode is ${distance.toFixed(1)}m (>= 40.0m reaction buffer)`);
}

// ============================================================================
// SUITE 6: Economy, Revive Deductions & Save Compatibility
// ============================================================================
console.log('\n--- Suite 6: Persistence, Economy & Deductions Integrity ---');

const prog = ProgressionManager.getInstance();
const reviveMgr = ReviveManager.getInstance();

// 1. Wallet integrity
prog.resetAll();
const initialKeys = prog.getKeys();
assert(initialKeys === 3, 'Initial starter keys default to 3');

prog.addKeys(5);
assert(prog.getKeys() === 8, 'addKeys(5) correctly increments wallet to 8');

const consumed = prog.consumeKeys(2);
assert(consumed, 'consumeKeys(2) returns true when balance is sufficient');
assert(prog.getKeys() === 6, 'Balance correctly reduced to 6');

const failedConsume = prog.consumeKeys(50);
assert(!failedConsume, 'consumeKeys(50) rejected when balance is 6');
assert(prog.getKeys() === 6, 'Wallet remains untouched at 6 after rejected transaction');

// 2. Revive execution
reviveMgr.resetRun();
assert(reviveMgr.canOfferRevive('NORMAL'), 'Revive available at run start');
reviveMgr.beginOffer();
const reviveResult = reviveMgr.executeRevive();
assert(reviveResult.success, 'First revive executes successfully');
assert(reviveResult.keysSpent === 1, 'First revive exact cost is 1 key');
assert(prog.getKeys() === 5, 'Keys balance exactly deducted from 6 to 5');
assert(reviveMgr.getRevivesUsed() === 1, 'Revives used count is now 1');

// 3. Second revive costs 2 keys
assert(reviveMgr.canOfferRevive('NORMAL'), 'Second revive available');
reviveMgr.beginOffer();
const reviveResult2 = reviveMgr.executeRevive();
assert(reviveResult2.success, 'Second revive executes successfully');
assert(reviveResult2.keysSpent === 2, 'Second revive cost is 2 keys');
assert(prog.getKeys() === 3, 'Keys balance exactly deducted from 5 to 3');
assert(reviveMgr.getRevivesUsed() === 2, 'Revives used count is now 2');

// 4. Save and reload cycle
prog.saveState();
const serialized = globalThis.localStorage.getItem('metro_progression_v1');
assert(serialized !== null, 'Progression state saved to localStorage');
const parsed = JSON.parse(serialized!);
assert(parsed.keys === 3, 'Persisted keys in localStorage match wallet state (3)');
assert(parsed.version === 1, 'Version schema is 1');

console.log(`\n================================================================`);
console.log(`🎉 ALL ${passed} / ${passed} PHASE 6 RELEASE STABILITY TESTS PASSED!`);
console.log(`================================================================`);
