/**
 * Phase 4 Deterministic Audit Suite:
 * Collectible Reliability, Jump Arc Coverage, Jetpack Flight, Power-up Lifecycle & Player Input Handling
 */

import * as THREE from 'three';

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

import { CONSTANTS, LaneIndex } from '../src/core/Constants';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { TrackChunk } from '../src/track/TrackChunk';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { OBSTACLE_PATTERNS } from '../src/track/ObstaclePatterns';
import { AerialCoinManager } from '../src/track/AerialCoinManager';
import { UpgradeManager } from '../src/player/UpgradeManager';
import { HoverboardManager } from '../src/hoverboard/HoverboardManager';
import { ReviveManager } from '../src/revive/ReviveManager';
import { ProgressionManager } from '../src/progression/ProgressionManager';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, msg: string): void {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  passedTests++;
  console.log(`✅ PASSED: ${msg}`);
}

console.log('🧪 Starting Metro Runner 3D: Phase 4 Collectibles, Power-ups & Input Audit Suite...\n');

// ============================================================================
// Suite 1: Correct Ground & Rooftop Coin Collection & Deduplication
// ============================================================================
console.log('--- Suite 1: Correct Ground & Rooftop Coin Collection ---');
{
  const scene = new THREE.Scene();
  const tm = new TrackManager(scene);
  const player = new Player();
  player.state = 'RUN';
  player.speed = 18.0;

  tm.chunks.length = 0;
  const chunk = new TrackChunk(new ObstacleFactory(), new CollectibleFactory());
  const p = OBSTACLE_PATTERNS.find(pat => pat.name === 'OPENING_RUNWAY')!;
  chunk.populate(p, 0);
  tm.chunks.push(chunk);

  let coinCollectedEvents = 0;
  const unsub = EventBus.getInstance().on(EVENTS.COIN_COLLECTED, () => {
    coinCollectedEvents++;
  });

  // Run player straight through ground straight trail (zOffset 6.0 to 14.0)
  player.position.set(0, 0.9, 0);
  player.updateCollider();

  const dt = 1 / 60;
  for (let f = 0; f < 60; f++) {
    player.update(dt);
    tm.update(player, dt, f * dt);
  }

  assert(coinCollectedEvents === 5, `Straight trail coins collected exactly once (expected 5, got ${coinCollectedEvents})`);

  // Verify rooftop coins: running on train roof collects rooftop coins and ignores ground coins below
  const roofChunk = new TrackChunk(new ObstacleFactory(), new CollectibleFactory());
  const roofPattern = OBSTACLE_PATTERNS.find(pat => pat.name === 'TRAIN_ROOF_RAMP_RUN')!;
  roofChunk.populate(roofPattern, -100);
  tm.chunks.push(roofChunk);

  // Position player on roof at y = 4.35m
  player.position.set(0, 4.35, -120);
  player.supportSurface = 'TRAIN_ROOF';
  player.state = 'ON_TRAIN';
  player.updateCollider();

  let roofCoinsCollected = 0;
  const unsubRoof = EventBus.getInstance().on(EVENTS.COIN_COLLECTED, () => {
    roofCoinsCollected++;
  });

  for (let f = 0; f < 60; f++) {
    player.update(dt);
    tm.update(player, dt, f * dt);
  }

  assert(roofCoinsCollected > 0, `Rooftop coins successfully collected while on train roof (${roofCoinsCollected} coins)`);
  unsub();
  unsubRoof();
}

// ============================================================================
// Suite 2: Jump Arc Collection Across Speeds (Normal & Hard Mode)
// ============================================================================
console.log('\n--- Suite 2: Jump Arc Collection Across Speeds ---');
{
  function testJumpArcAtSpeed(speed: number): void {
    const scene = new THREE.Scene();
    const tm = new TrackManager(scene);
    const player = new Player();
    player.state = 'RUN';
    player.speed = speed;

    tm.chunks.length = 0;
    const chunk = new TrackChunk(new ObstacleFactory(), new CollectibleFactory());
    const p = OBSTACLE_PATTERNS.find(pat => pat.name === 'OPENING_RUNWAY')!;
    chunk.populate(p, 0);
    tm.chunks.push(chunk);

    player.position.set(0, 0.9, -20);
    player.updateCollider();

    const dt = 1 / 60;
    const jumpTriggerZ = -28.0 + speed * 0.25;
    for (let f = 0; f < 60; f++) {
      if (player.position.z <= jumpTriggerZ && !player.isJumping) {
        player.jump();
      }
      player.update(dt);
      tm.update(player, dt, f * dt);
    }

    const arcCoins = chunk.collectibles.filter(c => c.archetype === 'JUMP_ARC');
    const collected = arcCoins.filter(c => !c.active).length;
    assert(collected === arcCoins.length, `At ${speed} m/s: All ${arcCoins.length} jump arc coins collected (got ${collected})`);
  }

  testJumpArcAtSpeed(18.0); // Normal Mode start
  testJumpArcAtSpeed(28.0); // Hard Mode start
  testJumpArcAtSpeed(38.0); // Normal Mode top
  testJumpArcAtSpeed(52.0); // Hard Mode cap

  // Verify adjacent lane coins remain uncollected
  const scene = new THREE.Scene();
  const tm = new TrackManager(scene);
  const player = new Player();
  player.state = 'RUN';
  player.speed = 18.0;

  tm.chunks.length = 0;
  const chunk = new TrackChunk(new ObstacleFactory(), new CollectibleFactory());
  const p = OBSTACLE_PATTERNS.find(pat => pat.name === 'OPENING_RUNWAY')!;
  chunk.populate(p, 0);
  tm.chunks.push(chunk);

  player.position.set(0, 0.9, -20);
  player.updateCollider();

  const dt = 1 / 60;
  for (let f = 0; f < 60; f++) {
    if (player.position.z <= -23.5 && !player.isJumping) {
      player.jump();
    }
    player.update(dt);
    tm.update(player, dt, f * dt);
  }

  const lane1Coins = chunk.collectibles.filter(c => c.lane === 1);
  const untouchedLane1 = lane1Coins.filter(c => c.active).length;
  assert(untouchedLane1 === lane1Coins.length, `Adjacent lane coins not inadvertently collected (${untouchedLane1}/${lane1Coins.length} intact)`);
}

// ============================================================================
// Suite 3: Jetpack Flight Lifecycle & Aerial Coin Continuity
// ============================================================================
console.log('\n--- Suite 3: Jetpack Flight Lifecycle & Aerial Coin Continuity ---');
{
  const scene = new THREE.Scene();
  const aerialManager = new AerialCoinManager(scene);
  const player = new Player();
  player.state = 'RUN';
  player.speed = 22.0;
  player.position.set(0, 0.9, -50);

  // Activate Jetpack
  player.powerups.activate('JETPACK');
  assert(player.powerups.isJetpackActive(), 'Jetpack powerup is active');
  aerialManager.onJetpackActivated(player);
  assert(aerialManager.isJetpackFlightActive(), 'AerialCoinManager flight session is active');

  // Verify flight stages: TAKEOFF -> CRUISE -> DESCENT -> SAFE_LANDING
  const dt = 1 / 60;
  // 1. Takeoff phase
  for (let f = 0; f < 30; f++) {
    player.update(dt);
    aerialManager.update(player, dt, f * dt, false, 0);
  }
  assert(player.getJetpackPhase() === 'TAKEOFF' || player.getJetpackPhase() === 'CRUISE', `Player in flight ascent (phase: ${player.getJetpackPhase()}, Y: ${player.position.y.toFixed(2)}m)`);

  // Advance into Cruise
  for (let f = 0; f < 60; f++) {
    player.update(dt);
    aerialManager.update(player, dt, f * dt, false, 0);
  }
  assert(player.getJetpackPhase() === 'CRUISE', `Player reached stable cruise flight (phase: ${player.getJetpackPhase()})`);
  assert(Math.abs(player.position.y - CONSTANTS.JETPACK_ALTITUDE) < 0.5, `Cruise altitude is at ~${CONSTANTS.JETPACK_ALTITUDE}m (actual: ${player.position.y.toFixed(2)}m)`);

  // Refresh jetpack while descending
  (player.powerups as any).activePowerups.get('JETPACK')!.remaining = 1.0;
  player.update(dt);
  assert(player.getJetpackPhase() === 'DESCENT', 'Player entered descent corridor');

  // Collect second jetpack to refresh
  player.powerups.activate('JETPACK');
  aerialManager.onJetpackRefreshed(player);
  player.update(dt);
  assert(player.getJetpackPhase() === 'CRUISE', 'Jetpack refresh smoothly restored CRUISE phase from descent');

  // Tunnel interaction: deferred takeoff
  const tunnelPlayer = new Player();
  tunnelPlayer.state = 'RUN';
  tunnelPlayer.isTunnelEnclosed = true;
  tunnelPlayer.powerups.activate('JETPACK');
  tunnelPlayer.update(dt);
  assert(tunnelPlayer.isTakeoffDeferred(), 'Jetpack takeoff deferred while inside enclosed tunnel');
  assert(tunnelPlayer.powerups.isJetpackTimerPaused(), 'Jetpack timer paused during tunnel enclosure');

  // Exit tunnel
  tunnelPlayer.isTunnelEnclosed = false;
  tunnelPlayer.update(dt);
  assert(!tunnelPlayer.isTakeoffDeferred(), 'Deferred takeoff released upon exiting tunnel into open sky');
  assert(tunnelPlayer.getJetpackPhase() === 'TAKEOFF', 'Takeoff initiated immediately upon tunnel exit');
}

// ============================================================================
// Suite 4: Power-Up Lifecycle, Protection Rules & State Agreement
// ============================================================================
console.log('\n--- Suite 4: Power-Up Lifecycle & Protection Rules ---');
{
  const player = new Player();
  player.state = 'RUN';

  // 1. Shield active duration and single impact absorption
  player.powerups.activate('SHIELD');
  assert(player.powerups.hasShieldActive(), 'Shield is active');
  assert(player.powerups.getRemaining('SHIELD') > 0, 'Shield has active duration remaining');

  // Crash into obstacle -> absorbed by shield
  const hit1Result = player.crash('LOW_BARRIER');
  assert(!hit1Result, 'First impact successfully absorbed by shield (crash returned false)');
  assert(!player.powerups.hasShieldActive(), 'Shield was consumed on impact');
  assert(player.isInvulnerable(), 'Post-hit invulnerability grace period granted');

  // Immediate second hit during grace window is ignored
  const hit2Result = player.crash('LOW_BARRIER');
  assert(!hit2Result, 'Second impact during grace window ignored');

  // After grace expires, subsequent hit is fatal
  (player.powerups as any).invulnerabilityTimer = 0;
  assert(!player.isInvulnerable(), 'Invulnerability ended after grace duration');
  const hit3Result = player.crash('LOW_BARRIER');
  assert(hit3Result, 'Subsequent impact after grace is genuinely fatal (crash returned true)');
  assert(player.state === 'CRASH', 'Player transitioned to CRASH state');

  // 2. Shield expiration without impact
  const player2 = new Player();
  player2.state = 'RUN';
  player2.powerups.activate('SHIELD');
  // Fast forward past duration
  player2.powerups.update(50.0);
  assert(!player2.powerups.hasShieldActive(), 'Shield expired after duration');
  assert(!player2.isInvulnerable(), 'Expired shield does not grant false invulnerability');

  // 3. Super Sneakers jump modifier only while active
  const playerSneakers = new Player();
  playerSneakers.state = 'RUN';
  playerSneakers.jump();
  const normalV0 = playerSneakers.verticalVelocity;
  playerSneakers.setGroundHeight(CONSTANTS.PLAYER_BASE_Y);
  playerSneakers.update(2.0); // Land

  playerSneakers.powerups.activate('SNEAKERS');
  playerSneakers.jump();
  const sneakerV0 = playerSneakers.verticalVelocity;
  assert(sneakerV0 > normalV0 * 1.3, `Sneakers increased jump velocity (${sneakerV0.toFixed(2)} vs ${normalV0.toFixed(2)})`);

  playerSneakers.setGroundHeight(CONSTANTS.PLAYER_BASE_Y);
  playerSneakers.update(2.0); // Land
  playerSneakers.powerups.update(50.0); // Expire sneakers
  assert(!playerSneakers.powerups.isSuperSneakersActive(), 'Sneakers expired');
  playerSneakers.jump();
  const expiredV0 = playerSneakers.verticalVelocity;
  assert(Math.abs(expiredV0 - normalV0) < 1e-4, 'Jump velocity returned to normal after sneakers expired');

  // 4. Revive idempotency: does not consume keys twice
  const prog = ProgressionManager.getInstance();
  prog.addKeys(5);
  const initialKeys = prog.getKeys();
  const reviveMgr = ReviveManager.getInstance();
  reviveMgr.resetRun();
  reviveMgr.beginOffer();

  const res1 = reviveMgr.executeRevive();
  assert(res1.success, 'First revive execution succeeds');
  const keysAfterFirst = prog.getKeys();
  assert(keysAfterFirst < initialKeys, `Keys deducted for revive (${keysAfterFirst} vs ${initialKeys})`);

  const res2 = reviveMgr.executeRevive();
  assert(!res2.success, 'Second revive execution blocked (cannot consume keys twice)');
  assert(prog.getKeys() === keysAfterFirst, 'Keys balance unchanged after blocked duplicate call');

  // 5. Crash freezes powerup timers
  const playerFrozen = new Player();
  playerFrozen.state = 'RUN';
  playerFrozen.powerups.activate('MAGNET');
  const remainingBefore = playerFrozen.powerups.getRemaining('MAGNET');
  playerFrozen.crash('TRAIN_COLLISION');
  playerFrozen.update(1.0); // 1.0s elapsed in death tumble
  const remainingAfter = playerFrozen.powerups.getRemaining('MAGNET');
  assert(remainingAfter === remainingBefore, 'Powerup duration frozen during death/crash presentation');
}

// ============================================================================
// Suite 5: Fast Player Inputs & State Transitions
// ============================================================================
console.log('\n--- Suite 5: Fast Player Inputs & State Transitions ---');
{
  const player = new Player();
  player.state = 'RUN';
  player.position.set(0, 0.9, 0);

  // 1. Single Left moves one lane
  player.handleInput('LEFT');
  assert(player.targetLane === -1, 'Single LEFT targets lane -1');
  const dt = 1 / 60;
  for (let f = 0; f < 20; f++) player.update(dt);
  assert(player.currentLane === -1, 'Player arrived at lane -1');

  // 2. Rapid double RIGHT buffered without dropping
  player.handleInput('RIGHT');
  player.handleInput('RIGHT');
  // In flight towards 0 with +1 queued
  for (let f = 0; f < 30; f++) player.update(dt);
  assert(player.currentLane === 1, 'Rapid double RIGHT transitions smoothly from -1 through 0 to 1');

  // 3. Jump followed by Down triggers fast drop and lands into slide
  player.handleInput('UP');
  assert(player.isJumping, 'Player initiated jump');
  player.update(0.1);
  assert(player.position.y > 1.2, 'Player airborne');

  player.handleInput('DOWN');
  assert(player.isFastDropping, 'DOWN while airborne engaged fast drop');
  assert(player.pendingSlideOnLanding, 'Slide registered for execution upon landing');

  // Fast drop down to ground
  for (let f = 0; f < 20; f++) {
    player.update(dt);
    if (!player.isJumping) break;
  }
  assert(!player.isJumping, 'Player landed on ground');
  assert(player.isSliding, 'Landing immediately transitioned into slide');
  assert(player.state === 'SLIDE', 'Player state is SLIDE');

  // 4. Repeated Down while sliding does not create infinite state transitions
  const slideTimerBefore = (player as any).slideTimer;
  player.handleInput('DOWN');
  assert(player.isSliding, 'Player remains sliding');
  assert(player.state === 'SLIDE', 'Player state remains SLIDE without transition churn');

  // 5. Rooftop landing handles pending slide
  const roofPlayer = new Player();
  roofPlayer.state = 'RUN';
  roofPlayer.handleInput('UP');
  roofPlayer.handleInput('DOWN');
  assert(roofPlayer.pendingSlideOnLanding, 'Pending slide registered on rooftop approach');
  roofPlayer.resolveRoofLanding(4.35, 'TRAIN_1', 'GROUP_1');
  assert(roofPlayer.isSliding, 'Rooftop landing immediately executed pending slide');
  assert(roofPlayer.supportSurface === 'TRAIN_ROOF', 'Player supported on TRAIN_ROOF');

  // 6. Jetpack activation clears queued inputs and incompatible movement states
  const jpPlayer = new Player();
  jpPlayer.state = 'RUN';
  jpPlayer.handleInput('UP');
  jpPlayer.handleInput('DOWN');
  jpPlayer.powerups.activate('JETPACK');
  jpPlayer.update(dt);
  assert(!jpPlayer.isJumping, 'Jetpack takeoff canceled jump');
  assert(!jpPlayer.isSliding, 'Jetpack takeoff canceled slide');
  assert(!jpPlayer.pendingSlideOnLanding, 'Jetpack takeoff cleared pending slide');

  // 7. Crash and restart clean up movement intentions
  const crashPlayer = new Player();
  crashPlayer.state = 'RUN';
  crashPlayer.handleInput('UP');
  crashPlayer.handleInput('DOWN');
  crashPlayer.crash('OBSTACLE');
  assert(!crashPlayer.isJumping, 'Crash cleared jump');
  assert(!crashPlayer.isSliding, 'Crash cleared slide');
  assert(!crashPlayer.pendingSlideOnLanding, 'Crash cleared pending slide');

  crashPlayer.reset();
  assert(crashPlayer.state === 'RUN', 'Reset restored RUN state');
  assert(crashPlayer.currentLane === 0, 'Reset restored center lane');
  assert(!crashPlayer.isJumping && !crashPlayer.isSliding, 'Reset cleared all action flags');
}

console.log('\n================================================================');
console.log(`🏁 FINISHED PHASE 4 AUDIT SUITE: ${passedTests} passed, 0 failed out of ${totalTests} assertions`);
console.log('================================================================');
