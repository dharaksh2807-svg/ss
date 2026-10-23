import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../src/core/Constants';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { DifficultyController } from '../src/track/DifficultyController';
import { PacingMetrics } from '../src/track/PacingMetrics';
import { OBSTACLE_PATTERNS, validatePatternFeasibility } from '../src/track/ObstaclePatterns';
import { ReachabilityValidator } from '../src/track/ReachabilityValidator';

console.log('🧪 Starting Metro Runner 3D: Task 3 Procedural Variety & Progressive Difficulty Test Suite...\n');

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

// =========================================================================
// Suite 1: Library of Distinct Opening Templates (Section A)
// =========================================================================
console.log('--- Suite 1: Library of Distinct Opening Templates (Chunk 0) ---');
{
  const openingTemplates = OBSTACLE_PATTERNS.filter((p) => p.isOpening);
  assert(openingTemplates.length >= 8, `Opening templates library contains ${openingTemplates.length} templates (>= 8 required)`);

  const requiredNames = [
    'OPENING_RUNWAY',
    'OPENING_OPEN_CENTER_FLANKS',
    'OPENING_EARLY_SLIDE',
    'OPENING_SIDE_REWARD',
    'OPENING_DISTANT_TRAIN',
    'OPENING_GENTLE_S_CURVE',
    'OPENING_MIXED_HURDLE_GATE',
    'OPENING_INTRO_RAMP'
  ];

  for (const name of requiredNames) {
    const found = openingTemplates.find((p) => p.name === name);
    assert(found !== undefined, `Opening template "${name}" exists in catalog`);
  }

  // Verify beginner accessibility and physical properties of all opening templates
  for (const tmpl of openingTemplates) {
    assert(tmpl.entryLanes && tmpl.entryLanes.length === 3, `"${tmpl.name}" allows all 3 entry lanes [-1, 0, 1]`);
    assert(tmpl.exitLanes && tmpl.exitLanes.length >= 2, `"${tmpl.name}" provides multiple surviving exit lanes`);
    assert(tmpl.obstacles.length >= 2, `"${tmpl.name}" has ${tmpl.obstacles.length} obstacles (not an empty runway)`);

    const hasMovingTrain = tmpl.obstacles.some((o) => o.type === 'MOVING_TRAIN' || o.isMoving);
    assert(!hasMovingTrain, `"${tmpl.name}" contains NO moving trains in opening chunk`);

    const firstObsZ = Math.min(...tmpl.obstacles.map((o) => o.zOffset));
    assert(firstObsZ >= 26.0, `"${tmpl.name}" first obstacle is at z=${firstObsZ}m (>= 26m reaction distance)`);

    // Solvability check
    const feasibility = validatePatternFeasibility(tmpl, CONSTANTS.INITIAL_SPEED);
    assert(feasibility.solvable === true, `"${tmpl.name}" is 100% solvable at starting speed (18 m/s)`);

    // Collectible reachability check
    const colFeasibility = ReachabilityValidator.validateCollectibleReachability(tmpl, CONSTANTS.INITIAL_SPEED);
    assert(colFeasibility.valid === true, `"${tmpl.name}" collectibles are 100% safe and reachable`);
  }
}

// =========================================================================
// Suite 2: Procedural Randomization & Dual Modes (Section B)
// =========================================================================
console.log('\n--- Suite 2: Procedural Randomization & Dual Modes (Normal vs Debug/Replay) ---');
{
  const scene = new THREE.Scene();
  const tm = new TrackManager(scene);

  // 1. Normal play mode generates fresh seeds
  const seedA = tm.generateFreshSeed();
  const seedB = tm.generateFreshSeed();
  assert(seedA !== seedB, `Fresh seeds are randomized and distinct: ${seedA} vs ${seedB}`);
  assert(!tm.isDebugMode(), 'Normal mode has isDebugMode === false');

  // 2. Debug replay mode produces 100% identical sequence
  const debugSeed = 998877;
  tm.setSeed(debugSeed, true);
  assert(tm.isDebugMode() === true, 'Explicit seed activates debug mode');
  assert(tm.getRunSeed() === debugSeed, `Run seed matches set debug seed: ${debugSeed}`);

  const run1Patterns: string[] = [];
  for (let i = 0; i < 25; i++) {
    run1Patterns.push(tm.selectPattern(i, 20.0, i * 80).name);
  }

  // Replaying identical seed reproduces exact same sequence
  tm.setSeed(debugSeed, true);
  const run2Patterns: string[] = [];
  for (let i = 0; i < 25; i++) {
    run2Patterns.push(tm.selectPattern(i, 20.0, i * 80).name);
  }

  assert(
    run1Patterns.every((name, idx) => name === run2Patterns[idx]),
    'Seeded replay reproduces 100% identical pattern sequence across 25 chunks'
  );

  // 3. Reset in debug mode preserves run seed and reproduces identical initial chunk layout
  tm.reset(false);
  assert(tm.getRunSeed() === debugSeed, 'Run seed preserved across reset in debug mode');
  const chunksRunA = tm.getChunks().map((c) => c.pattern ? c.pattern.name : '');

  tm.reset(false);
  const chunksRunB = tm.getChunks().map((c) => c.pattern ? c.pattern.name : '');
  assert(
    chunksRunA.every((name, idx) => name === chunksRunB[idx]),
    'Debug reset populates identical initial chunks across multiple replays'
  );

  // 4. Normal reset generates fresh seed when not in debug mode
  tm.clearDebugSeed();
  assert(!tm.isDebugMode(), 'clearDebugSeed restores normal play mode');
  const prevSeed = tm.getRunSeed();
  tm.reset(true);
  assert(tm.getRunSeed() !== prevSeed, 'Normal reset produces a fresh seed automatically');
}

// =========================================================================
// Suite 3: Hidden Repetition Removal & Recent-History Penalty (Section C)
// =========================================================================
console.log('\n--- Suite 3: Hidden Repetition Removal & Recent-History Penalties ---');
{
  const scene = new THREE.Scene();
  const tm = new TrackManager(scene);
  tm.setSeed(456789, true);

  const sequence: string[] = [];
  let backToBackRepetitions = 0;

  for (let i = 0; i < 60; i++) {
    const pattern = tm.selectPattern(i, 22.0, i * 80);
    sequence.push(pattern.name);
    if (i > 0 && sequence[i] === sequence[i - 1]) {
      backToBackRepetitions++;
    }
  }

  assert(backToBackRepetitions === 0, `Zero back-to-back pattern repetitions across 60 chunks (found: ${backToBackRepetitions})`);

  // Verify unique pattern variety
  const uniquePatterns = new Set(sequence);
  assert(uniquePatterns.size >= 15, `High pattern variety: ${uniquePatterns.size} unique patterns spawned across 60 chunks (>= 15 required)`);
}

// =========================================================================
// Suite 4: Guaranteed Safe Fallback Verification (Section D)
// =========================================================================
console.log('\n--- Suite 4: Guaranteed Safe Fallback & Zero Unreachable Patterns ---');
{
  const recoveryPattern = OBSTACLE_PATTERNS.find((p) => p.name === 'SAFE_RECOVERY_CONNECTOR');
  assert(recoveryPattern !== undefined, 'SAFE_RECOVERY_CONNECTOR pattern exists in catalog');
  assert(recoveryPattern!.isBreather === true, 'SAFE_RECOVERY_CONNECTOR is marked as a breather');
  assert(recoveryPattern!.obstacles.length <= 1, 'SAFE_RECOVERY_CONNECTOR has minimal obstacles');

  // Verify that SAFE_RECOVERY_CONNECTOR can connect safely from ANY combination of exit lanes
  const testExitLaneCombinations: LaneIndex[][] = [
    [-1],
    [0],
    [1],
    [-1, 0],
    [0, 1],
    [-1, 1],
    [-1, 0, 1]
  ];

  for (const exitLanes of testExitLaneCombinations) {
    const res = ReachabilityValidator.validatePattern(recoveryPattern as any, CONSTANTS.INITIAL_SPEED, exitLanes);
    assert(res.solvable === true, `SAFE_RECOVERY_CONNECTOR is 100% solvable from entry lanes: [${exitLanes.join(', ')}]`);
  }

  // 1,000 Continuous Chunk Procedural Run: Zero Impossible Transitions Guaranteed
  const scene = new THREE.Scene();
  const tm = new TrackManager(scene);
  tm.setSeed(777123, true);

  let currentPattern = tm.selectPattern(0, CONSTANTS.INITIAL_SPEED, 0);
  let impossibleTransitions = 0;

  for (let chunkIdx = 1; chunkIdx <= 1000; chunkIdx++) {
    const dist = chunkIdx * 80.0;
    const speed = Math.min(38.0, 18.0 + (dist / 300.0) * (24.5 - 18.0));
    const nextPattern = tm.selectPattern(chunkIdx, speed, dist);

    const isTransitionValid = ReachabilityValidator.validateChunkTransition(currentPattern, nextPattern, speed);
    if (!isTransitionValid) {
      impossibleTransitions++;
    }
    currentPattern = nextPattern;
  }

  assert(impossibleTransitions === 0, `Zero (0) impossible chunk transitions across 1,000 continuous procedural chunks`);
  const pacingReport = PacingMetrics.getInstance().getReport();
  assert(pacingReport.unreachablePatternCount === 0, 'PacingMetrics confirms zero unreachable patterns');
}

// =========================================================================
// Suite 5: Multi-Variable Difficulty Progression (Sections E, F, G)
// =========================================================================
console.log('\n--- Suite 5: Multi-Variable Progressive Difficulty Curve ---');
{
  const dc = new DifficultyController();

  // Stage 1: Opening (0-15s / 0-270m)
  const tierOpening = dc.getTargetTier(100, 18.0, 5.0);
  assert(tierOpening === 'EASY' || tierOpening === 'BEGINNER', `Opening tier at 100m is ${tierOpening}`);
  const weightsOpening = dc.getTierWeights(100, 18.0, 5.0);
  assert(weightsOpening.BEGINNER + weightsOpening.EASY > 0.9, 'Opening tier is dominated by BEGINNER and EASY patterns');
  assert(weightsOpening.HARD === 0.0 && weightsOpening.EXPERT === 0.0, 'No HARD or EXPERT patterns in opening stage');
  assert(dc.canSpawnMovingTrain(100) === false, 'Moving trains strictly forbidden at 100m (< 240m gate)');

  // Stage 2: Early Run (15-30s / 270-650m)
  const tierEarly = dc.getTargetTier(450, 22.0, 20.0);
  assert(tierEarly === 'MEDIUM', `Early run tier at 450m is ${tierEarly}`);
  const weightsEarly = dc.getTierWeights(450, 22.0, 20.0);
  assert(weightsEarly.EASY + weightsEarly.MEDIUM > 0.8, 'Early run focuses on EASY and MEDIUM patterns');
  assert(dc.canSpawnMovingTrain(300) === true, 'Moving trains become eligible at >= 240m');

  // Moving train cooldown gap at early run (75m)
  const mockMovingTrain = OBSTACLE_PATTERNS.find((p) => p.obstacles.some((o) => o.type === 'MOVING_TRAIN'))!;
  dc.recordPatternSpawned(mockMovingTrain, 300);
  assert(dc.canSpawnMovingTrain(350) === false, 'Moving train forbidden within 75m cooldown gap at 350m');
  assert(dc.canSpawnMovingTrain(385) === true, 'Moving train allowed after 75m cooldown gap at 385m');

  // Stage 3: Mid Run (30-60s / 650-1500m)
  const tierMid = dc.getTargetTier(1000, 27.0, 40.0);
  assert(tierMid === 'HARD', `Mid run tier at 1000m is ${tierMid}`);
  const weightsMid = dc.getTierWeights(1000, 27.0, 40.0);
  assert(weightsMid.MEDIUM + weightsMid.HARD > 0.75, 'Mid run focuses on MEDIUM and HARD patterns');

  // Stage 4: Advanced (60-120s / 1500-3000m)
  const tierAdv = dc.getTargetTier(2200, 32.0, 80.0);
  assert(tierAdv === 'EXPERT', `Advanced tier at 2200m is ${tierAdv}`);
  const weightsAdv = dc.getTierWeights(2200, 32.0, 80.0);
  assert(weightsAdv.HARD + weightsAdv.EXPERT > 0.70, 'Advanced run focuses on HARD and EXPERT patterns');

  // Stage 5: Expert (120s+ / 3000m+)
  const weightsExpert = dc.getTierWeights(3500, 38.0, 130.0);
  assert(weightsExpert.EXPERT >= 0.35, 'Expert run assigns >= 35% weight to EXPERT patterns');

  // Difficulty Budget evaluation
  const budget = dc.getDifficultyBudget(1500, 30.0, 50.0);
  assert(budget.maxObstaclesPerChunk >= 4, `Difficulty budget allocates ${budget.maxObstaclesPerChunk} obstacles/chunk`);
  assert(budget.minReactionTimeSeconds >= 0.55, 'Reaction time minimum is at least 0.55s');
  assert(budget.minReactionDistMeters >= 24.0, 'Reaction distance minimum is at least 24.0m');

  // Consecutive difficult limiter & mandatory breather
  const mockHard = OBSTACLE_PATTERNS.find((p) => p.difficulty === 'HARD')!;
  dc.recordPatternSpawned(mockHard, 1500);
  dc.recordPatternSpawned(mockHard, 1580);
  const breatherWeights = dc.getTierWeights(1660, 30.0, 55.0);
  assert(breatherWeights.BREATHER >= 0.60, 'Breather weight elevated to >= 60% after 2 consecutive difficult chunks');
}

// =========================================================================
// Suite 6: Verify Normal Runs Differ (Section I)
// =========================================================================
console.log('\n--- Suite 6: Verify Normal Runs Differ Across Fresh Seeds ---');
{
  const seeds = [101, 202, 303, 404, 505];
  const openingNames: string[] = [];
  const chunk1Names: string[] = [];

  for (const seed of seeds) {
    const scene = new THREE.Scene();
    const tm = new TrackManager(scene);
    tm.setSeed(seed, true);

    const chunk0Pattern = tm.selectPattern(0, 18.0, 0);
    const chunk1Pattern = tm.selectPattern(1, 18.0, 80);

    openingNames.push(chunk0Pattern.name);
    chunk1Names.push(chunk1Pattern.name);
  }

  const uniqueOpenings = new Set(openingNames);
  assert(uniqueOpenings.size >= 3, `Distinct seeds generate varied opening templates (${uniqueOpenings.size} distinct templates across 5 seeds)`);

  const uniqueChunk1 = new Set(chunk1Names);
  assert(uniqueChunk1.size >= 3, `Distinct seeds generate varied chunk 1 patterns (${uniqueChunk1.size} distinct patterns across 5 seeds)`);
}

// =========================================================================
// Suite 7: Full 60-Second Simulated Run & Telemetry Metrics (Section J)
// =========================================================================
console.log('\n--- Suite 7: 60-Second Simulated Run & Pacing Metrics Reporting ---');
{
  const pm = PacingMetrics.getInstance();
  pm.reset();

  const scene = new THREE.Scene();
  const tm = new TrackManager(scene);
  const player = new Player();
  player.reset();
  player.powerups.grantInvulnerability(100.0);

  const totalSeconds = 60.0;
  const dt = 1.0 / 60.0;
  let elapsed = 0;

  while (elapsed < totalSeconds) {
    if (Math.floor(elapsed * 2) !== Math.floor((elapsed - dt) * 2)) {
      const actions: Array<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'> = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      player.handleInput(action);
    }

    player.update(dt);
    tm.update(player, dt, elapsed);
    elapsed += dt;
  }

  const report = pm.getReport(totalSeconds);
  console.log('📊 Telemetry Summary for 60s Simulated Run:');
  console.log(`   Speed at 60s: ${report.currentSpeed.toFixed(1)} m/s (Average: ${report.averageSpeed.toFixed(1)} m/s)`);
  console.log(`   Total Obstacles Encountered: ${report.totalObstacles}`);
  console.log(`   Moving Trains Encountered: ${report.movingTrainCount} (${report.movingTrainFrequencyPerMinute.toFixed(1)} / min)`);
  console.log(`   Obstacle Density (per 10s): ${report.obstaclesPer10s}`);
  console.log(`   Actions: JUMP=${report.actionDistribution.JUMP}, SLIDE=${report.actionDistribution.SLIDE}, LANE_CHANGE=${report.actionDistribution.LANE_CHANGE}`);
  console.log(`   Min Reaction Time: ${report.minReactionTimeSeconds.toFixed(2)}s (Safe threshold >= 0.55s)`);
  console.log(`   Unreachable Patterns: ${report.unreachablePatternCount}`);

  assert(report.totalObstacles >= 10, 'Player encountered a healthy cadence of obstacles (>= 10)');
  assert(report.movingTrainCount >= 1, 'Player encountered moving trains after early run threshold');
  assert(report.minReactionTimeSeconds >= 0.55, 'Minimum reaction time preserved above safe threshold (>= 0.55s)');
  assert(report.unreachablePatternCount === 0, 'Zero unreachable patterns during full gameplay simulation');
}

console.log(`\n=======================================================`);
console.log(`📊 TASK 3 TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100%)`);
console.log(`=======================================================`);
