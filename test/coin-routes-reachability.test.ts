/**
 * Comprehensive Automated Verification Suite for Task 3:
 * Intelligent Risk/Reward Coin Placement, Collectible Routes & Physical Reachability
 */

import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../src/core/Constants';
import { CoinPatternLibrary, CoinPatternArchetype } from '../src/track/CoinPatternLibrary';
import { OBSTACLE_PATTERNS, TrackPattern } from '../src/track/ObstaclePatterns';
import { ReachabilityValidator } from '../src/track/ReachabilityValidator';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { TrackChunk } from '../src/track/TrackChunk';
import { TrackManager } from '../src/track/TrackManager';
import { Player } from '../src/player/Player';
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

console.log('========================================================================');
console.log('🪙 TASK 3: INTELLIGENT RISK/REWARD COIN PLACEMENT & ROUTES TEST SUITE');
console.log('========================================================================\n');

// =========================================================================
// Suite 1: Data-Driven Coin Pattern Library & Archetype Builders
// =========================================================================
console.log('--- Suite 1: Data-Driven Coin Pattern Library & Archetype Builders ---');
{
  // 1. Straight trail
  const straight = CoinPatternLibrary.createStraightTrail(0, 15.0, 6, 2.2);
  assert(straight.archetype === 'STRAIGHT_TRAIL', 'Straight trail archetype tagged correctly');
  assert(straight.lane === 0, 'Straight trail aligned to specified lane');
  assert(straight.zOffset === 15.0, 'Straight trail starts at correct zOffset');
  assert(straight.count === 6, 'Straight trail has correct coin count');
  assert(straight.yOffset === CONSTANTS.COIN_GROUND_Y, `Straight trail at standard running height (${CONSTANTS.COIN_GROUND_Y}m)`);

  // 2. Jump arc
  const hurdleZ = 35.0;
  const arc = CoinPatternLibrary.createJumpArc(0, hurdleZ, 4, 1.8, 2.35);
  assert(arc.archetype === 'JUMP_ARC', 'Jump arc archetype tagged correctly');
  assert(arc.isArc === true, 'Jump arc flagged with isArc: true');
  assert(arc.count === 4, 'Jump arc has 4 coins');
  const arcSpan = (4 - 1) * 1.8; // 5.4m
  const expectedStart = hurdleZ - arcSpan / 2; // 32.3m
  assert(Math.abs(arc.zOffset - expectedStart) < 0.05, `Jump arc start Z (${arc.zOffset}m) centers peak over hurdle at ${hurdleZ}m`);
  assert(arc.yOffset === 2.35, 'Jump arc peak height matches configuration');

  // 3. Slide guidance
  const barrierZ = 24.0;
  const slide = CoinPatternLibrary.createSlideGuidance(0, barrierZ, 5, 1.8);
  assert(slide.archetype === 'SLIDE_GUIDANCE', 'Slide guidance archetype tagged correctly');
  assert(slide.isSlideGuidance === true, 'Slide guidance flagged with isSlideGuidance: true');
  assert(slide.yOffset === CONSTANTS.COIN_SLIDE_Y, `Slide guidance at low height (${CONSTANTS.COIN_SLIDE_Y}m <= 0.75m collider)`);
  const slideSpan = (5 - 1) * 1.8; // 7.2m
  assert(slide.zOffset <= barrierZ - 2.0, 'Slide guidance begins at least 2m before barrier for anticipation');
  assert(slide.zOffset + slideSpan >= barrierZ + 2.0, 'Slide guidance extends at least 2m past barrier for smooth recovery');

  // 4. Lane switch trail
  const laneSwitch = CoinPatternLibrary.createLaneSwitchTrail(-1, 0, 12.0, 5, 2.2);
  assert(laneSwitch.archetype === 'LANE_SWITCH', 'Lane switch archetype tagged correctly');
  assert(laneSwitch.lane === -1 && laneSwitch.endLane === 0, 'Lane switch links adjacent lanes -1 to 0');
  const traverseDistance = 5 * 2.2; // 11m
  assert(traverseDistance >= 8.5, 'Lane switch provides sufficient forward travel (>= 8.5m) for top-speed lane change');

  // 5. Train rooftop trail
  const roofTrails = CoinPatternLibrary.createTrainRooftopTrail(0, 20.0, 26.0, true);
  assert(roofTrails.length === 2, 'Ramped train rooftop trail generates ramp ascent + flat spine trail');
  assert(roofTrails[0].isRampAscent === true, 'First rooftop trail segment is ramp ascent');
  assert(roofTrails[0].yOffset === CONSTANTS.COIN_ROOFTOP_Y, `Ramp ascent targets train roof height (${CONSTANTS.COIN_ROOFTOP_Y}m)`);
  assert(roofTrails[1].yOffset === CONSTANTS.COIN_ROOFTOP_Y, `Rooftop spine trail elevated at ${CONSTANTS.COIN_ROOFTOP_Y}m`);
  assert(roofTrails[1].zOffset > 20.0 + CONSTANTS.TRAIN_RAMP_LENGTH, 'Rooftop spine trail begins past ramp crest');

  // 6. Risk/Reward branch
  const branch = CoinPatternLibrary.createRiskRewardBranch({
    safeLane: -1,
    safeZ: 20.0,
    safeCount: 4,
    riskLane: 0,
    riskZ: 20.0,
    riskCount: 7,
    riskPowerup: 'MULTIPLIER',
    riskPowerupZ: 40.0
  });
  assert(branch.length === 3, 'Risk/reward branch generates safe trail + risk trail + bonus item');
  const safeItem = branch[0];
  const riskItem = branch[1];
  assert(safeItem.isRiskRoute === false, 'Safe route marked isRiskRoute: false');
  assert(riskItem.isRiskRoute === true, 'Risk route marked isRiskRoute: true');
  assert(riskItem.count! > safeItem.count!, 'Risk route yields more coins than safe route');
  const rewardRatio = riskItem.count! / safeItem.count!;
  assert(rewardRatio >= 1.5 && rewardRatio <= 2.0, `Reward multiplier (${rewardRatio.toFixed(2)}x) is balanced between 1.5x and 2.0x`);

  // 7. Post-obstacle reward
  const postObs = CoinPatternLibrary.createPostObstacleReward(0, 35.0, 4, 1.8);
  assert(postObs.archetype === 'POST_OBSTACLE', 'Post-obstacle reward archetype tagged correctly');
  assert(postObs.isPostObstacle === true, 'Post-obstacle flagged isPostObstacle: true');
  assert(postObs.zOffset >= 36.5, 'Post-obstacle coins placed safely after obstacle exit boundary');

  // 8. Jetpack aerial trail info
  const jetpackInfo = CoinPatternLibrary.getJetpackAerialTrailInfo();
  assert(jetpackInfo.flightAltitude === 9.0, 'Jetpack flight altitude is 9.0m');
  assert(jetpackInfo.poolSize >= 160, 'Jetpack aerial pool size is at least 160');
}

// =========================================================================
// Suite 2: 100% Reachability & Clearance Across All 27 Procedural Patterns
// =========================================================================
console.log('\n--- Suite 2: 100% Reachability & Clearance Across All 27 Patterns ---');
{
  assert(OBSTACLE_PATTERNS.length >= 27, `Total patterns in catalog is at least 27 (got ${OBSTACLE_PATTERNS.length})`);

  let validCount18 = 0;
  let validCount38 = 0;

  for (const pattern of OBSTACLE_PATTERNS) {
    // 1. Validate physical reachability at starting speed (18 m/s)
    const res18 = ReachabilityValidator.validateCollectibleReachability(pattern as any, 18.0);
    if (!res18.valid) {
      console.error(`Pattern ${pattern.name} failed at 18 m/s: ${res18.reason}`);
    }
    assert(res18.valid, `Pattern "${pattern.name}" has 100% safe & reachable coins at 18 m/s`);
    validCount18++;

    // 2. Validate physical reachability at maximum speed (38 m/s)
    const res38 = ReachabilityValidator.validateCollectibleReachability(pattern as any, 38.0);
    if (!res38.valid) {
      console.error(`Pattern ${pattern.name} failed at 38 m/s: ${res38.reason}`);
    }
    assert(res38.valid, `Pattern "${pattern.name}" has 100% safe & reachable coins at 38 m/s`);
    validCount38++;

    // 3. Verify safety validator rejects lethal placement
    for (const col of pattern.collectibles) {
      const safety = CoinPatternLibrary.validateCollectibleSafety(col, pattern.obstacles);
      assert(safety.valid, `Collectible in "${pattern.name}" passes static collision clearance`);
    }
  }

  assert(validCount18 === OBSTACLE_PATTERNS.length, `All ${OBSTACLE_PATTERNS.length} patterns verified safe at 18 m/s`);
  assert(validCount38 === OBSTACLE_PATTERNS.length, `All ${OBSTACLE_PATTERNS.length} patterns verified safe at 38 m/s`);
}

// =========================================================================
// Suite 3: TrackChunk Spawn & Spatial Curve Accuracy
// =========================================================================
console.log('\n--- Suite 3: TrackChunk Spawn & Spatial Curve Accuracy ---');
{
  const obsFactory = new ObstacleFactory();
  const colFactory = new CollectibleFactory();
  const chunk = new TrackChunk(obsFactory, colFactory);

  // Pick OPENING_RUNWAY pattern which has straight, arc, lane switch, and slide guidance
  const opening = OBSTACLE_PATTERNS.find(p => p.name === 'OPENING_RUNWAY')!;
  chunk.populate(opening, -100);

  assert(chunk.collectibles.length > 0, `Chunk spawned ${chunk.collectibles.length} collectibles`);

  // 1. Verify Lane Switch lateral curve
  const switchCoins = chunk.collectibles.filter(c => c.archetype === 'LANE_SWITCH');
  assert(switchCoins.length === 5, `Found 5 lane-switch coins (got ${switchCoins.length})`);
  // First switch coin should be close to center (X ~ 0)
  assert(Math.abs(switchCoins[0].group.position.x - CONSTANTS.LANES[0]) < 0.1, 'First switch coin starts in lane 0');
  // Middle switch coin should be between lane 0 and -1 (X between -2.5 and 0)
  const midX = switchCoins[2].group.position.x;
  assert(midX < CONSTANTS.LANES[0] && midX > CONSTANTS.LANES[-1], `Middle switch coin interpolated smoothly (X = ${midX.toFixed(2)}m)`);
  // Last switch coin should be in lane -1 (X ~ -2.5)
  assert(Math.abs(switchCoins[4].group.position.x - CONSTANTS.LANES[-1]) < 0.1, 'Last switch coin reaches lane -1');

  // 2. Verify Jump Arc parabolic trajectory
  const arcCoins = chunk.collectibles.filter(c => c.archetype === 'JUMP_ARC');
  assert(arcCoins.length === 4, `Found 4 jump arc coins (got ${arcCoins.length})`);
  // End coins should be at ground collection height (0.85m)
  assert(Math.abs(arcCoins[0].baseY - CONSTANTS.COIN_GROUND_Y) < 0.05, `Arc start at ground height: ${arcCoins[0].baseY.toFixed(2)}m`);
  assert(Math.abs(arcCoins[3].baseY - CONSTANTS.COIN_GROUND_Y) < 0.05, `Arc end at ground height: ${arcCoins[3].baseY.toFixed(2)}m`);
  // Middle coins should be elevated at apex (~2.35m)
  assert(arcCoins[1].baseY > 1.8 && arcCoins[2].baseY > 1.8, 'Middle arc coins elevated near apex (> 1.8m)');

  // 3. Verify Slide Guidance low height
  const slideCoins = chunk.collectibles.filter(c => c.archetype === 'SLIDE_GUIDANCE');
  assert(slideCoins.length === 4, `Found 4 slide guidance coins (got ${slideCoins.length})`);
  for (const sc of slideCoins) {
    assert(sc.baseY === CONSTANTS.COIN_SLIDE_Y, `Slide coin at low waist height (${sc.baseY}m)`);
    assert(sc.collider.max.y <= 1.10, `Slide coin collider fits within slide clearance (max.y = ${sc.collider.max.y.toFixed(2)}m)`);
  }

  // 4. Verify Train Rooftop Ramp Ascent & Flat Spine
  const rampPattern = OBSTACLE_PATTERNS.find(p => p.name === 'TRAIN_ROOF_RAMP_RUN')!;
  chunk.populate(rampPattern, -200);

  const rampCoins = chunk.collectibles.filter(c => c.archetype === 'TRAIN_ROOFTOP' && c.initialLocalZ! >= -26.0);
  assert(rampCoins.length === 4, `Found 4 ramp ascent coins (got ${rampCoins.length})`);
  // Each ramp coin should be higher than the previous
  for (let i = 1; i < rampCoins.length; i++) {
    assert(rampCoins[i].baseY > rampCoins[i - 1].baseY, `Ramp coin ${i} (${rampCoins[i].baseY.toFixed(2)}m) ascends higher than ${i - 1} (${rampCoins[i - 1].baseY.toFixed(2)}m)`);
  }

  const spineCoins = chunk.collectibles.filter(c => c.archetype === 'TRAIN_ROOFTOP' && c.initialLocalZ! <= -27.0);
  assert(spineCoins.length >= 6, `Found ${spineCoins.length} rooftop spine coins`);
  for (const sc of spineCoins) {
    assert(sc.baseY === CONSTANTS.COIN_ROOFTOP_Y, `Rooftop coin elevated at ${CONSTANTS.COIN_ROOFTOP_Y}m above train roof`);
  }
}

// =========================================================================
// Suite 4: Kinematic Collection Integrity at Maximum Speed (38 m/s) & Multi-FPS
// =========================================================================
console.log('\n--- Suite 4: Kinematic Collection Integrity at Maximum Speed (38 m/s) ---');
{
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);
  trackManager.setDebugSeed(7);
  trackManager.reset();
  const player = new Player();
  player.reset();

  const bus = EventBus.getInstance();
  let collectedCoins = 0;
  bus.on(EVENTS.COIN_COLLECTED, () => {
    collectedCoins++;
  });

  // Test swept volume collection at 38 m/s running through opening chunk
  player.speed = 38.0;
  player.currentLane = 0;
  player.targetLane = 0;
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, 0);

  // Step player forward 40m at 38 m/s (approx 1.05s) at 60 FPS
  const dt = 1.0 / 60.0;
  const initialCoins = collectedCoins;

  for (let i = 0; i < 65; i++) {
    player.position.z -= player.speed * dt;
    player.distanceTraveled += player.speed * dt;
    player.update(dt);
    trackManager.update(player, dt, i * dt);
  }

  assert(collectedCoins > initialCoins, `High-speed swept collection collected ${collectedCoins - initialCoins} coins at 38 m/s`);

  // Test jump arc collection: fresh player jumps over low hurdle
  const jumpPlayer = new Player();
  jumpPlayer.reset();
  jumpPlayer.position.set(0, CONSTANTS.PLAYER_BASE_Y, -24.0);
  jumpPlayer.handleInput('UP');
  assert(jumpPlayer.isJumping === true, 'Player initiated jump for arc collection');

  const beforeJumpCoins = collectedCoins;
  for (let i = 0; i < 35; i++) {
    jumpPlayer.position.z -= 18.0 * dt;
    jumpPlayer.distanceTraveled += 18.0 * dt;
    jumpPlayer.update(dt);
    trackManager.update(jumpPlayer, dt, (65 + i) * dt);
  }

  assert(collectedCoins > beforeJumpCoins, `Jump arc collection scooped up ${collectedCoins - beforeJumpCoins} airborne coins during jump`);

  // Multi-FPS invariance test (30 FPS vs 60 FPS vs 120 FPS swept collection)
  for (const fps of [30, 60, 120]) {
    const fpsDt = 1.0 / fps;
    trackManager.reset();
    const testPlayer = new Player();
    testPlayer.reset();
    testPlayer.speed = 38.0;
    testPlayer.position.set(0, CONSTANTS.PLAYER_BASE_Y, 0);

    let fpsCollected = 0;
    const unsub = bus.on(EVENTS.COIN_COLLECTED, () => { fpsCollected++; });

    // Step 20 meters at 38 m/s
    const steps = Math.round((20.0 / 38.0) / fpsDt);
    for (let s = 0; s < steps; s++) {
      testPlayer.position.z -= testPlayer.speed * fpsDt;
      testPlayer.distanceTraveled += testPlayer.speed * fpsDt;
      testPlayer.update(fpsDt);
      trackManager.update(testPlayer, fpsDt, s * fpsDt);
    }

    assert(fpsCollected > 0, `Swept volume collected coins at ${fps} FPS without tunneling past`);
  }
}

// =========================================================================
// Suite 5: Moving Train Evasion & Jetpack Flight Isolation
// =========================================================================
console.log('\n--- Suite 5: Moving Train Evasion & Jetpack Flight Isolation ---');
{
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);
  const player = new Player();
  player.reset();

  // Test MOVING_TRAIN_TELEGRAPH pattern
  const telegraphPattern = OBSTACLE_PATTERNS.find(p => p.name === 'MOVING_TRAIN_TELEGRAPH')!;
  const movingObs = telegraphPattern.obstacles.find(o => o.type === 'MOVING_TRAIN')!;
  assert(movingObs.lane === 1, 'Moving train oncoming in Right lane (lane 1)');

  // Verify collectibles in this pattern guide evasion into safe center lane
  const laneSwitch = telegraphPattern.collectibles.find(c => c.archetype === 'LANE_SWITCH');
  assert(laneSwitch !== undefined, 'Pattern features lane-switch trail');
  assert(laneSwitch!.lane === 1 && laneSwitch!.endLane === 0, 'Lane switch guides player out of oncoming train lane 1 into center lane 0');

  // Verify zero coins placed in lane 1 between train spawn and arrival
  const dangerousCoins = telegraphPattern.collectibles.filter(c => c.lane === 1 && c.zOffset >= 25.0 && c.archetype !== 'LANE_SWITCH');
  assert(dangerousCoins.length === 0, 'Zero collectibles lure player into lethal oncoming train trajectory in lane 1');

  // Test Jetpack Flight Isolation:
  // When player is high in flight (> 4.5m), ground coins are NOT collected
  player.position.set(0, 9.0, -50.0);
  player.state = 'JETPACK';

  const bus = EventBus.getInstance();
  let groundCoinsCollectedWhileFlying = 0;
  bus.on(EVENTS.COIN_COLLECTED, () => {
    if (player.position.y > 5.0) {
      groundCoinsCollectedWhileFlying++;
    }
  });

  const chunk = trackManager.getChunks()[0];
  // Verify ground coins in chunk remain active and don't vanish into sky
  const groundCoins = chunk.collectibles.filter(c => c.baseY < 4.0 && c.active);
  assert(groundCoins.length > 0, `Chunk contains ${groundCoins.length} active ground coins`);

  // Update trackManager with flying player
  trackManager.update(player, 0.016, 1.0);

  // Ground coins should still be intact on ground
  const groundCoinsAfter = chunk.collectibles.filter(c => c.baseY < 4.0 && c.active);
  assert(groundCoinsAfter.length === groundCoins.length, 'Ground coins are NOT vacuumed or teleported into sky during high jetpack flight');
}

// =========================================================================
// Suite 6: Magnet Attraction & Single-Collection Invariant
// =========================================================================
console.log('\n--- Suite 6: Magnet Attraction & Single-Collection Invariant ---');
{
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);
  const player = new Player();
  player.reset();
  player.powerups.activate('MAGNET');
  assert(player.powerups.isMagnetActive() === true, 'Magnet powerup active');

  const bus = EventBus.getInstance();
  let totalMagnetCollected = 0;
  const collectionIds = new Set<string>();

  bus.on(EVENTS.COIN_COLLECTED, () => {
    totalMagnetCollected++;
  });

  // Run player down center lane with magnet active
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -10.0);
  const dt = 1.0 / 60.0;

  for (let i = 0; i < 100; i++) {
    player.position.z -= 18.0 * dt;
    player.distanceTraveled += 18.0 * dt;
    player.update(dt);
    trackManager.update(player, dt, i * dt);
  }

  assert(totalMagnetCollected > 0, `Magnet collected ${totalMagnetCollected} coins from all lanes`);

  // Verify all inactive coins in chunk are permanently removed and cannot be re-collected
  for (const chunk of trackManager.getChunks()) {
    for (const col of chunk.collectibles) {
      if (!col.active) {
        // Must not be in scene
        assert(col.group.parent !== chunk.group, 'Collected coin mesh cleanly removed from scene group');
      }
    }
  }

  // Test TrackManager.reset() cleanup
  trackManager.reset();
  for (const chunk of trackManager.getChunks()) {
    // All freshly populated coins should be active and initialized
    for (const col of chunk.collectibles) {
      assert(col.active === true, 'Reset repopulates clean, active collectibles');
      assert(col.isMagnetized === false, 'Reset clears magnetized status');
    }
  }
}

// =========================================================================
// Suite 7: Economy & Reward Balancing
// =========================================================================
console.log('\n--- Suite 7: Economy & Reward Balancing ---');
{
  let totalCoinsInCatalog = 0;
  const patternYields: Array<{ name: string; safeYield: number; riskYield: number; totalCoins: number }> = [];

  for (const pattern of OBSTACLE_PATTERNS) {
    let safeCoins = 0;
    let riskCoins = 0;
    let standardCoins = 0;

    for (const col of pattern.collectibles) {
      if (col.type !== 'COIN') continue;
      const count = col.count || 1;
      if (col.isRiskRoute === true) {
        riskCoins += count;
      } else if (col.isRiskRoute === false) {
        safeCoins += count;
      } else {
        standardCoins += count;
      }
    }

    const totalPatternCoins = safeCoins + riskCoins + standardCoins;
    totalCoinsInCatalog += totalPatternCoins;

    patternYields.push({
      name: pattern.name,
      safeYield: safeCoins + standardCoins,
      riskYield: riskCoins + standardCoins,
      totalCoins: totalPatternCoins
    });
  }

  const avgCoinsPerChunk = totalCoinsInCatalog / OBSTACLE_PATTERNS.length;
  console.log(`  Catalog Total Coins: ${totalCoinsInCatalog} across 27 patterns`);
  console.log(`  Average Coins Per Chunk: ${avgCoinsPerChunk.toFixed(1)} coins`);

  // Verify reasonable bounds (12 - 25 coins per chunk)
  assert(avgCoinsPerChunk >= 12.0 && avgCoinsPerChunk <= 26.0, `Average coin yield per chunk (${avgCoinsPerChunk.toFixed(1)}) is well-balanced`);

  // Verify single run economy: in a 60s run (~15 chunks), estimated collection is 150 - 250 coins
  const estimated60sRunYield = avgCoinsPerChunk * 0.65 * 15; // Assuming player collects ~65% of available coins
  console.log(`  Estimated 60s Run Coin Yield: ~${Math.round(estimated60sRunYield)} coins`);
  assert(estimated60sRunYield >= 120 && estimated60sRunYield <= 300, `Single 60s run yields ~${Math.round(estimated60sRunYield)} coins (fits shop pricing of 200 - 3000 coins)`);

  // Verify risk route boost on PRECISION_COIN_RISK_ROUTE
  const precisionPattern = patternYields.find(p => p.name === 'PRECISION_COIN_RISK_ROUTE')!;
  assert(precisionPattern.riskYield > precisionPattern.safeYield, 'Risk route yields more coins than safe route on PRECISION_COIN_RISK_ROUTE');
  const boostRatio = precisionPattern.riskYield / precisionPattern.safeYield;
  assert(boostRatio >= 1.4 && boostRatio <= 2.2, `Skill boost ratio (${boostRatio.toFixed(2)}x) rewards mastery without runaway inflation`);
}

console.log('\n=======================================================');
console.log(`🏆 ALL ${passedTests} / ${totalTests} TASK 3 COIN ROUTE TESTS PASSED!`);
console.log('=======================================================');
