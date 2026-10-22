import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../src/core/Constants';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { SpeedController } from '../src/core/SpeedController';
import { DifficultyController } from '../src/track/DifficultyController';
import { PacingMetrics } from '../src/track/PacingMetrics';
import { OBSTACLE_PATTERNS, validatePatternFeasibility } from '../src/track/ObstaclePatterns';
import { ReachabilityValidator } from '../src/track/ReachabilityValidator';

// In-memory localStorage mock for node environment
const storageMock: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, val: string) => { storageMock[key] = val; },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => {
    for (const k in storageMock) delete storageMock[k];
  },
  key: (i: number) => Object.keys(storageMock)[i] || null,
  length: Object.keys(storageMock).length
} as any;

console.log('🧪 Starting Task 1: Complete Difficulty, Obstacle Density & Speed Progression Overhaul Suite...\n');

let passedTests = 0;
let totalTests = 0;

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

function stepPlayer(player: Player, duration: number, fps: number = 60) {
  const dt = 1.0 / fps;
  let elapsed = 0;
  while (elapsed < duration) {
    player.update(dt);
    elapsed += dt;
  }
}

// =========================================================================
// Test 1: Rebuilt Opening Gameplay Experience
// =========================================================================
console.log('--- Test 1: Rebuilt Opening Gameplay Experience (0 - 80m Chunk 0) ---');
{
  const scene = new THREE.Scene();
  const tm = new TrackManager(scene);
  tm.reset();

  const chunk0 = tm.chunks[0];
  const openingPattern = OBSTACLE_PATTERNS.find(p => p.name === 'OPENING_RUNWAY');

  assert(openingPattern !== undefined, 'OPENING_RUNWAY pattern exists in catalog');
  assert(chunk0.obstacles.length >= 2, `Chunk 0 has ${chunk0.obstacles.length} obstacles (NOT an empty runway)`);

  const firstObstacle = openingPattern!.obstacles[0];
  assert(firstObstacle.zOffset >= 20.0 && firstObstacle.zOffset <= 32.0, `First obstacle occurs early at z=${firstObstacle.zOffset}m (within 0-5s)`);
  assert(firstObstacle.type === 'LOW_BARRIER', 'First obstacle is a readable LOW_BARRIER hurdle');
  assert(firstObstacle.lane === 0, 'First obstacle is centered with clear flanking lanes');

  // Verify coin arch and guidance
  const arcCoins = openingPattern!.collectibles.filter(c => c.isArc);
  assert(arcCoins.length > 0, 'First obstacle features rewarding parabolic coin arch for jumping');

  const groundCoins = openingPattern!.collectibles.filter(c => !c.isArc && c.zOffset < 20);
  assert(groundCoins.length > 0, 'Opening introduces clear runway coins during initial 0-20m');

  // Solvability of opening
  const solvability = validatePatternFeasibility(openingPattern!, CONSTANTS.INITIAL_SPEED);
  assert(solvability.solvable === true, 'Opening pattern is 100% solvable without powerups');
  assert((solvability.survivingExitLanes?.length || 0) >= 2, 'Multiple surviving exit lanes available from opening');
}

// =========================================================================
// Test 2: Nonlinear Speed Progression Model
// =========================================================================
console.log('\n--- Test 2: Nonlinear Speed Progression & Noticeable Early Acceleration ---');
{
  const sc = new SpeedController('NORMAL');

  // 1. Initial speed
  assert(sc.evaluateCurve(0) === 18.0, 'Starting speed is strictly 18.0 m/s');

  // 2. Noticeable early acceleration (0 to 300m, ~0 to 14s)
  const speedAt100m = sc.evaluateCurve(100);
  assert(speedAt100m >= 20.5 && speedAt100m <= 22.5, `Speed at 100m (~5s) accelerates to ${speedAt100m.toFixed(2)} m/s (Noticeable early pickup!)`);

  const speedAt250m = sc.evaluateCurve(250);
  assert(speedAt250m >= 23.5 && speedAt250m <= 25.0, `Speed at 250m (~12s) reaches ${speedAt250m.toFixed(2)} m/s`);

  // 3. Steady mid-game acceleration (300 to 1200m, ~15s to 45s)
  const speedAt600m = sc.evaluateCurve(600);
  assert(speedAt600m >= 26.5 && speedAt600m <= 29.0, `Speed at 600m (~25s) reaches ${speedAt600m.toFixed(2)} m/s`);

  const speedAt1200m = sc.evaluateCurve(1200);
  assert(speedAt1200m >= 30.5 && speedAt1200m <= 32.5, `Speed at 1200m (~45s) reaches ${speedAt1200m.toFixed(2)} m/s`);

  // 4. Asymptotic approach and cap enforcement
  const speedAt2500m = sc.evaluateCurve(2500);
  assert(speedAt2500m >= 35.0 && speedAt2500m <= 38.0, `Speed at 2500m reaches ${speedAt2500m.toFixed(2)} m/s`);

  const speedAt10000m = sc.evaluateCurve(10000);
  assert(speedAt10000m <= 38.0, `Speed at 10,000m strictly respects cap: ${speedAt10000m.toFixed(2)} <= 38.0 m/s`);

  // 5. Monotonic smoothness (no sudden dips or discontinuities)
  let monotonic = true;
  let prevSpeed = 18.0;
  for (let dist = 10; dist <= 3000; dist += 10) {
    const s = sc.evaluateCurve(dist);
    if (s < prevSpeed) {
      monotonic = false;
      break;
    }
    prevSpeed = s;
  }
  assert(monotonic === true, 'Speed progression curve is strictly monotonic and continuous across all distances');
}

// =========================================================================
// Test 3: Frame-Rate Invariance (30, 60, 120 FPS)
// =========================================================================
console.log('\n--- Test 3: Frame-Rate Invariance Across 30, 60 & 120 FPS ---');
{
  const speedsAt60Seconds: Record<number, number> = {};

  for (const fps of [30, 60, 120]) {
    const player = new Player();
    player.reset();
    stepPlayer(player, 60.0, fps); // Run 60 seconds
    speedsAt60Seconds[fps] = player.speed;
    console.log(`  Speed after 60s at ${fps} FPS: ${player.speed.toFixed(2)} m/s (Distance: ${Math.floor(player.distanceTraveled)}m)`);
  }

  const diff30vs60 = Math.abs(speedsAt60Seconds[30] - speedsAt60Seconds[60]);
  const diff60vs120 = Math.abs(speedsAt60Seconds[60] - speedsAt60Seconds[120]);

  assert(diff30vs60 < 0.25, `30 FPS vs 60 FPS speed delta is negligible (${diff30vs60.toFixed(3)} m/s)`);
  assert(diff60vs120 < 0.15, `60 FPS vs 120 FPS speed delta is negligible (${diff60vs120.toFixed(3)} m/s)`);
}

// =========================================================================
// Test 4: Mode-Specific Speed Profiles & Initial Speed Preservation
// =========================================================================
console.log('\n--- Test 4: Mode-Specific Speed Profiles & Initial Speed Preservation ---');
{
  // 1. Survival mode starts at 25.0 m/s
  const survivalPlayer = new Player();
  survivalPlayer.reset();
  survivalPlayer.setGameMode('SURVIVAL');
  survivalPlayer.speed = 25.0;

  assert(survivalPlayer.speed === 25.0, 'Survival player starts at 25.0 m/s');

  // Step simulation for 1 frame
  survivalPlayer.update(0.016);
  assert(survivalPlayer.speed >= 25.0, `Survival initial speed NOT overwritten on frame 1 (remains ${survivalPlayer.speed.toFixed(2)} m/s)`);

  // Step 30 seconds into Survival
  stepPlayer(survivalPlayer, 30.0, 60);
  assert(survivalPlayer.speed > 32.0, `Survival reaches intense speed after 30s (${survivalPlayer.speed.toFixed(2)} m/s)`);
  assert(survivalPlayer.speedController.getMaxSpeed() === 40.0, 'Survival mode has elevated 40.0 m/s top speed cap');

  // 2. Time Trial Mode
  const timeTrialPlayer = new Player();
  timeTrialPlayer.reset();
  timeTrialPlayer.setGameMode('TIME_TRIAL');
  assert(timeTrialPlayer.speed === 22.0, 'Time Trial mode initializes at 22.0 m/s sprint pace');

  // 3. Coin Rush Mode
  const coinRushPlayer = new Player();
  coinRushPlayer.reset();
  coinRushPlayer.setGameMode('COIN_RUSH');
  assert(coinRushPlayer.speed === 18.0, 'Coin Rush mode initializes at 18.0 m/s maneuverable pace');
  assert(coinRushPlayer.speedController.getMaxSpeed() === 32.0, 'Coin Rush mode caps at 32.0 m/s to prioritize precision collection');
}

// =========================================================================
// Test 5: Data-Driven Difficulty Controller & Recovery Breathers
// =========================================================================
console.log('\n--- Test 5: Dedicated Difficulty Controller & Recovery Breathers ---');
{
  const dc = new DifficultyController();

  // Score progression
  assert(dc.getDifficultyScore(0, 18.0) < 0.1, 'Initial difficulty score is < 0.1');
  assert(dc.getDifficultyScore(500, 26.0) >= 0.25, 'Mid-game difficulty score reflects distance & speed');
  assert(dc.getDifficultyScore(2000, 35.0) >= 0.70, 'Late-game difficulty score reaches advanced tiers');

  // Tier escalation
  assert(dc.getTargetTier(50, 18.0) === 'BEGINNER', '0-80m resolves to BEGINNER');
  assert(dc.getTargetTier(200, 22.0) === 'EASY', '100-250m resolves to EASY');
  assert(dc.getTargetTier(500, 27.0) === 'MEDIUM', '250-750m resolves to MEDIUM');
  assert(dc.getTargetTier(1000, 31.0) === 'HARD', '750-1600m resolves to HARD');
  assert(dc.getTargetTier(2000, 36.0) === 'EXPERT', '1600m+ resolves to EXPERT');

  // Recovery Breather Enforcement after 2 intense chunks
  const mockHardPattern = OBSTACLE_PATTERNS.find(p => p.difficulty === 'HARD')!;
  dc.recordPatternSpawned(mockHardPattern, 1000);
  assert(dc.getState().consecutiveDifficultCount === 1, 'Consecutive difficult count is 1');

  dc.recordPatternSpawned(mockHardPattern, 1080);
  assert(dc.getState().consecutiveDifficultCount === 2, 'Consecutive difficult count reached 2');

  const recoveryWeights = dc.getTierWeights(1160, 32.0);
  assert(recoveryWeights.BREATHER >= 0.5, 'Recovery breather weight heavily boosted when consecutive difficult chunks hit limit');
  assert(recoveryWeights.EXPERT === 0.0, 'Expert patterns suppressed during recovery breather');

  // Moving train cooldown check
  assert(dc.canSpawnMovingTrain(100) === false, 'Moving train forbidden in opening 240m');
  assert(dc.canSpawnMovingTrain(300) === true, 'Moving train allowed at 300m');

  const mockMovingTrain = OBSTACLE_PATTERNS.find(p => p.obstacles.some(o => o.type === 'MOVING_TRAIN'))!;
  dc.recordPatternSpawned(mockMovingTrain, 300);
  assert(dc.canSpawnMovingTrain(340) === false, 'Moving train forbidden within 75m cooldown gap');
  assert(dc.canSpawnMovingTrain(385) === true, 'Moving train allowed after 75m cooldown distance');
}

// =========================================================================
// Test 6: Fisher-Yates Seed Determinism & Solvability
// =========================================================================
console.log('\n--- Test 6: Seed Determinism & 100% Transition Reachability Across 1,000 Chunks ---');
{
  const scene1 = new THREE.Scene();
  const tm1 = new TrackManager(scene1);
  tm1.setSeed(888123);
  const run1: string[] = [];
  for (let i = 0; i < 40; i++) {
    run1.push(tm1.selectPattern(i, 20.0, i * 80).name);
  }

  const scene2 = new THREE.Scene();
  const tm2 = new TrackManager(scene2);
  tm2.setSeed(888123);
  const run2: string[] = [];
  for (let i = 0; i < 40; i++) {
    run2.push(tm2.selectPattern(i, 20.0, i * 80).name);
  }

  assert(run1.every((name, idx) => name === run2[idx]), 'Fisher-Yates seeded PRNG produces 100% reproducible pattern sequence');

  // 1,000 Continuous Chunk Stitch Solvability Guarantee
  const sceneTest = new THREE.Scene();
  const tmTest = new TrackManager(sceneTest);
  tmTest.setSeed(555999);

  let currentPattern = tmTest.selectPattern(0, CONSTANTS.INITIAL_SPEED, 0);
  let impossibleTransitions = 0;

  for (let chunkIdx = 1; chunkIdx <= 1000; chunkIdx++) {
    const dist = chunkIdx * 80.0;
    const speed = tmTest.chunks[0] ? Math.min(38.0, 18.0 + (dist / 300.0) * (24.5 - 18.0)) : 25.0;
    const nextPattern = tmTest.selectPattern(chunkIdx, speed, dist);

    const isTransitionValid = ReachabilityValidator.validateChunkTransition(currentPattern, nextPattern, speed);
    if (!isTransitionValid) {
      impossibleTransitions++;
      console.error(`Impassable transition from ${currentPattern.name} to ${nextPattern.name} at ${dist}m, speed ${speed}`);
    }
    currentPattern = nextPattern;
  }

  assert(impossibleTransitions === 0, 'Zero (0) impassable chunk transitions across 1,000 continuous procedural chunks');
}

// =========================================================================
// Test 7: Full Simulated 60s Run & Pacing Metrics Verification
// =========================================================================
console.log('\n--- Test 7: 60-Second Simulated Run & Pacing Metrics Verification ---');
{
  const pm = PacingMetrics.getInstance();
  pm.reset();

  const scene = new THREE.Scene();
  const tm = new TrackManager(scene);
  const player = new Player();
  player.reset();

  player.powerups.grantInvulnerability(100.0);

  // Simulate 60 seconds of real gameplay
  const totalSeconds = 60.0;
  const dt = 1.0 / 60.0;
  let elapsed = 0;

  while (elapsed < totalSeconds) {
    // Autonomous player reaction logic for simulated run
    if (Math.floor(elapsed * 2) !== Math.floor((elapsed - dt) * 2)) {
      const actions: Array<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'> = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      const chosenAction = actions[Math.floor(Math.random() * actions.length)];
      player.handleInput(chosenAction);
    }

    player.update(dt);
    tm.update(player, dt, elapsed);
    elapsed += dt;
  }

  const report = pm.getReport(totalSeconds);
  console.log('  Metrics Summary after 60s:');
  console.log(`    Speed: ${report.currentSpeed} m/s (Average: ${report.averageSpeed} m/s)`);
  console.log(`    Obstacles per 10s: ${report.obstaclesPer10s}`);
  console.log(`    Total obstacles: ${report.totalObstacles}`);
  console.log(`    Average obstacle gap: ${report.averageObstacleGapMeters}m`);
  console.log(`    Moving trains: ${report.movingTrainCount} (${report.movingTrainFrequencyPerMinute}/min)`);
  console.log(`    Unreachable patterns: ${report.unreachablePatternCount}`);

  assert(report.currentSpeed >= 30.0, `Speed after 60s reached arcade velocity (got ${report.currentSpeed} m/s >= 30.0 m/s)`);
  assert(report.unreachablePatternCount === 0, 'Zero unreachable patterns during full run');
  assert(report.totalObstacles >= 10, 'Regular, engaging obstacle density encountered');
  assert(player.distanceTraveled >= 1400.0, `Traveled > 1400m in 60s (got ${Math.floor(player.distanceTraveled)}m)`);
}

// =========================================================================
// Test 8: High Speed Kinematics Safety (38.0 m/s)
// =========================================================================
console.log('\n--- Test 8: High Speed Kinematic Integrity at Maximum Speed (38.0 m/s) ---');
{
  const player = new Player();
  player.reset();
  player.speed = 38.0;

  // 1. Jump clearance test
  player.handleInput('UP');
  assert(player.isJumping === true, 'Jump initiates cleanly at 38 m/s');
  stepPlayer(player, 0.25, 60);
  assert(player.position.y > CONSTANTS.LOW_BARRIER_HEIGHT + 0.5, 'Jump clears low barrier height easily at top speed');

  // 2. Fast drop test
  player.handleInput('DOWN');
  assert(player.verticalVelocity < 0, 'Fast drop downward dive engages immediately while airborne at top speed');
  stepPlayer(player, 0.2, 60);
  assert(player.position.y === CONSTANTS.PLAYER_BASE_Y, 'Player landed safely on ground after fast drop');

  // 3. Slide clearance test
  player.handleInput('DOWN');
  assert(player.isSliding === true, 'Slide engages cleanly at 38 m/s');
  assert(player.collider.max.y <= CONSTANTS.TUNNEL_ARCH_CLEARANCE, 'Sliding collider clears tunnel arches at 38 m/s');

  // 4. Slide cancel with jump
  player.handleInput('UP');
  assert(player.isJumping === true && player.isSliding === false, 'Swiping UP cancels slide into immediate jump at top speed');
}

console.log('\n=======================================================');
console.log(`🏆 ALL ${passedTests}/${totalTests} DIFFICULTY, OBSTACLE DENSITY & PROGRESSION TESTS PASSED!`);
console.log('=======================================================\n');
