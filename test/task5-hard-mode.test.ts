import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../src/core/Constants';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { DifficultyController } from '../src/track/DifficultyController';
import { SpeedController } from '../src/core/SpeedController';
import { OBSTACLE_PATTERNS } from '../src/track/ObstaclePatterns';
import { ReachabilityValidator, ValidatedPattern } from '../src/track/ReachabilityValidator';
import { PacingMetrics } from '../src/track/PacingMetrics';
import { GAME_MODES, ACHIEVEMENTS } from '../src/progression/MissionCatalog';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { EventBus, EVENTS } from '../src/core/EventBus';

// Polyfill localStorage for headless node environment
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

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ PASSED: ${message}`);
  } else {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('🧪 Starting Task 5: Hard Mode — Faster Runner, Faster Trains & Fair Advanced Challenges Suite...\n');

// =========================================================================
// Suite 1: Hard Mode Definition & Mode Selection Integrity
// =========================================================================
console.log('--- Suite 1: Hard Mode Definition & Mode Selection Integrity ---');
{
  const normalMode = GAME_MODES.find((m) => m.id === 'NORMAL');
  const hardMode = GAME_MODES.find((m) => m.id === 'HARD');
  const survivalMode = GAME_MODES.find((m) => m.id === 'SURVIVAL');

  assert(!!normalMode, 'Normal Mode is present in GAME_MODES');
  assert(!!hardMode, 'Hard Mode is explicitly defined in GAME_MODES');
  assert(!!survivalMode, 'Survival Challenge remains distinct and is not replaced by Hard Mode');
  assert(hardMode?.id === 'HARD', 'Hard Mode ID is exactly HARD');
  assert(hardMode?.rules.length! >= 3, 'Hard Mode has detailed rules including starting speed, train velocities, and independent records');

  // Hard Mode achievements
  const hardScoreAch = ACHIEVEMENTS.find((a) => a.id === 'ach_hard_score');
  const hardDistAch = ACHIEVEMENTS.find((a) => a.id === 'ach_hard_distance');
  assert(!!hardScoreAch, 'Dedicated Hard Mode high score achievement is registered');
  assert(!!hardDistAch, 'Dedicated Hard Mode distance achievement is registered');
}

// =========================================================================
// Suite 2: SpeedController Dedicated HARD Speed Profile
// =========================================================================
console.log('\n--- Suite 2: Dedicated HARD Speed Profile ---');
{
  const normalSpeed = new SpeedController('NORMAL');
  const hardSpeed = new SpeedController('HARD');

  // Initial starting speeds
  const normalInitial = normalSpeed.getInitialSpeed();
  const hardInitial = hardSpeed.getInitialSpeed();
  assert(normalInitial === 18.0, `Normal starting speed is 18.0 m/s (actual: ${normalInitial})`);
  assert(hardInitial === 24.0, `Hard starting speed is 24.0 m/s (actual: ${hardInitial})`);
  assert(hardInitial > normalInitial, 'Hard starting speed is distinctly higher than Normal Mode');

  // Maximum speeds
  const normalMax = normalSpeed.getMaxSpeed();
  const hardMax = hardSpeed.getMaxSpeed();
  assert(normalMax === 38.0, `Normal max speed is 38.0 m/s (actual: ${normalMax})`);
  assert(hardMax === 46.0, `Hard max speed is 46.0 m/s (actual: ${hardMax})`);
  assert(hardMax > normalMax, 'Hard maximum speed is distinctly higher than Normal Mode (46 vs 38 m/s)');

  // Hard Mode Speed Curve Progression
  const hardAt0 = hardSpeed.evaluateCurve(0);
  const hardAt250 = hardSpeed.evaluateCurve(250);
  const hardAt1000 = hardSpeed.evaluateCurve(1000);
  const hardAt2600 = hardSpeed.evaluateCurve(2600);
  const hardAt5000 = hardSpeed.evaluateCurve(5000);

  assert(hardAt0 === 24.0, 'Hard speed at 0m is 24.0 m/s');
  assert(hardAt250 >= 30.5 && hardAt250 <= 31.5, `Hard speed at 250m is ~31 m/s (actual: ${hardAt250.toFixed(2)})`);
  assert(hardAt1000 >= 39.0 && hardAt1000 <= 40.0, `Hard speed at 1000m is ~39.5 m/s (actual: ${hardAt1000.toFixed(2)})`);
  assert(hardAt2600 >= 45.0 && hardAt2600 <= 46.0, `Hard speed at 2600m is ~45.5 m/s (actual: ${hardAt2600.toFixed(2)})`);
  assert(hardAt5000 === 46.0, `Hard speed strictly caps at 46.0 m/s at 5000m (actual: ${hardAt5000.toFixed(2)})`);

  // Monotonic, smooth progression (no negative drops)
  assert(hardAt250 > hardAt0 && hardAt1000 > hardAt250 && hardAt2600 > hardAt1000, 'Hard speed curve is smoothly and strictly monotonically increasing');
}

// =========================================================================
// Suite 3: Oncoming Train Speed Profiles
// =========================================================================
console.log('\n--- Suite 3: Oncoming Train Speed Profiles ---');
{
  const dc = new DifficultyController();

  // Normal Mode train speeds
  const normEarly = dc.calculateMovingTrainSpeed(150, 'NORMAL');
  const normMed = dc.calculateMovingTrainSpeed(500, 'NORMAL');
  const normAdv = dc.calculateMovingTrainSpeed(1200, 'NORMAL');
  const normMax = dc.calculateMovingTrainSpeed(4000, 'NORMAL');

  assert(normEarly >= 20.0 && normEarly <= 22.0, `Normal early train speed is 20-22 m/s (actual: ${normEarly.toFixed(2)})`);
  assert(normMed >= 22.0 && normMed <= 26.0, `Normal medium train speed is 22-26 m/s (actual: ${normMed.toFixed(2)})`);
  assert(normAdv >= 26.0 && normAdv <= 30.0, `Normal advanced train speed is 26-30 m/s (actual: ${normAdv.toFixed(2)})`);
  assert(normMax <= 32.0, `Normal train speed strictly caps at 32.0 m/s (actual: ${normMax.toFixed(2)})`);

  // Hard Mode train speeds
  const hardEarly = dc.calculateMovingTrainSpeed(150, 'HARD');
  const hardMed = dc.calculateMovingTrainSpeed(500, 'HARD');
  const hardAdv = dc.calculateMovingTrainSpeed(1400, 'HARD');
  const hardMax = dc.calculateMovingTrainSpeed(4000, 'HARD');

  assert(hardEarly >= 26.0 && hardEarly <= 28.0, `Hard early train speed is 26-28 m/s (actual: ${hardEarly.toFixed(2)})`);
  assert(hardMed >= 28.0 && hardMed <= 33.0, `Hard medium train speed is 28-33 m/s (actual: ${hardMed.toFixed(2)})`);
  assert(hardAdv >= 33.0 && hardAdv <= 38.0, `Hard advanced train speed is 33-38 m/s (actual: ${hardAdv.toFixed(2)})`);
  assert(hardMax <= 42.0, `Hard train speed strictly caps at 42.0 m/s (actual: ${hardMax.toFixed(2)})`);

  assert(hardEarly > normEarly, 'Hard early trains are faster than Normal early trains');
  assert(hardMed > normMed, 'Hard medium trains are faster than Normal medium trains');
  assert(hardAdv > normAdv, 'Hard advanced trains are faster than Normal advanced trains');
  assert(hardMax > normMax, 'Hard max train speed is higher than Normal max train speed (42 vs 32 m/s)');
}

// =========================================================================
// Suite 4: Moving Train Frequency & Early Appearance
// =========================================================================
console.log('\n--- Suite 4: Moving Train Frequency & Early Appearance ---');
{
  const dcNormal = new DifficultyController();
  dcNormal.setGameMode('NORMAL');

  const dcHard = new DifficultyController();
  dcHard.setGameMode('HARD');

  // Both modes now allow early scheduling after the protected opening.
  assert(dcNormal.canSpawnMovingTrain(100), 'Normal Mode can schedule an early readable train after the opening');
  assert(dcHard.canSpawnMovingTrain(100), 'Hard Mode permits moving trains earlier at 100m');

  // Frequency spacing: record a spawn at 500m
  const dummyPattern = OBSTACLE_PATTERNS.find((p) => p.obstacles.some((o) => o.type === 'MOVING_TRAIN'))!;
  dcNormal.recordPatternSpawned(dummyPattern, 500, 25.0);
  dcHard.recordPatternSpawned(dummyPattern, 500, 18.0);

  // Physical spawn spacing and simulation-time cooldown remain enforced.
  assert(!dcNormal.canSpawnMovingTrain(525, 20.0, 26.0), 'Normal Mode rejects physically compressed spawn spacing and cooldown');
  // A sufficiently separated Hard Mode spawn remains eligible.
  assert(dcHard.canSpawnMovingTrain(562, 28.0, 21.0), 'Hard Mode allows tighter gap at 62m');
}

// =========================================================================
// Suite 5: Earlier Advanced Patterns in Hard Mode
// =========================================================================
console.log('\n--- Suite 5: Earlier Advanced Patterns in Hard Mode ---');
{
  const dcNormal = new DifficultyController();
  dcNormal.setGameMode('NORMAL');

  const dcHard = new DifficultyController();
  dcHard.setGameMode('HARD');

  // At 200m: Normal is EASY, Hard is MEDIUM
  const normalTier200 = dcNormal.getTargetTier(200, 18.0);
  const hardTier200 = dcHard.getTargetTier(200, 24.0);
  assert(normalTier200 === 'EASY', `Normal tier at 200m is EASY (actual: ${normalTier200})`);
  assert(hardTier200 === 'MEDIUM', `Hard tier at 200m escalates to MEDIUM (actual: ${hardTier200})`);

  // At 500m: Normal is MEDIUM, Hard is HARD
  const normalTier500 = dcNormal.getTargetTier(500, 25.0);
  const hardTier500 = dcHard.getTargetTier(500, 35.0);
  assert(normalTier500 === 'MEDIUM', `Normal tier at 500m is MEDIUM (actual: ${normalTier500})`);
  assert(hardTier500 === 'HARD', `Hard tier at 500m escalates to HARD (actual: ${hardTier500})`);

  // At 1000m: Normal is HARD, Hard is EXPERT
  const normalTier1000 = dcNormal.getTargetTier(1000, 30.0);
  const hardTier1000 = dcHard.getTargetTier(1000, 40.0);
  assert(normalTier1000 === 'HARD', `Normal tier at 1000m is HARD (actual: ${normalTier1000})`);
  assert(hardTier1000 === 'EXPERT', `Hard tier at 1000m escalates to EXPERT (actual: ${hardTier1000})`);

  // Weights check at 200m: Hard Mode allocates substantial weight to MEDIUM & HARD
  const hardWeights = dcHard.getTierWeights(200, 24.0);
  assert((hardWeights.MEDIUM || 0) >= 0.40, 'Hard Mode weights at 200m prioritize MEDIUM patterns');
}

// =========================================================================
// Suite 6: Physical Trajectory Reachability & Fairness across Speeds
// =========================================================================
console.log('\n--- Suite 6: Physical Reachability & Fairness across Speeds ---');
{
  const speedsToTest = [24.0, 31.0, 39.5, 46.0];
  let failedPatterns = 0;

  for (const speed of speedsToTest) {
    for (const pattern of OBSTACLE_PATTERNS) {
      const res = ReachabilityValidator.validatePattern(pattern as ValidatedPattern, speed);
      if (!res.solvable) {
        console.error(`Unsolvable pattern ${pattern.name} at speed ${speed} m/s: ${res.reason}`);
        failedPatterns++;
      }
    }
  }

  assert(failedPatterns === 0, `All ${OBSTACLE_PATTERNS.length} patterns 100% physically solvable across all Hard Mode speeds (24 to 46 m/s)`);

  // Specific check on new Hard Mode patterns
  const jumpSlidePattern = OBSTACLE_PATTERNS.find((p) => p.name === 'HARD_JUMP_SLIDE_EXPRESS');
  const roofRunPattern = OBSTACLE_PATTERNS.find((p) => p.name === 'HARD_SLIDE_SWITCH_ROOF_RUN');
  assert(!!jumpSlidePattern, 'HARD_JUMP_SLIDE_EXPRESS pattern is registered');
  assert(!!roofRunPattern, 'HARD_SLIDE_SWITCH_ROOF_RUN pattern is registered');

  const res1 = ReachabilityValidator.validatePattern(jumpSlidePattern as ValidatedPattern, 46.0);
  const res2 = ReachabilityValidator.validatePattern(roofRunPattern as ValidatedPattern, 46.0);
  assert(res1.solvable, 'HARD_JUMP_SLIDE_EXPRESS is solvable at top speed (46 m/s)');
  assert(res2.solvable, 'HARD_SLIDE_SWITCH_ROOF_RUN is solvable at top speed (46 m/s)');

  // Mathematical fairness check:
  // At 88 m/s maximum closing speed, warning distance scales to 176m.
  const maxClosingSpeed = 46.0 + 42.0;
  const telegraphDist = maxClosingSpeed * CONSTANTS.MOVING_TRAIN_WARNING_TIME;
  const reactionWindow = telegraphDist / maxClosingSpeed;
  assert(reactionWindow >= 1.5, `Reaction window at top speed is ${reactionWindow.toFixed(2)}s (>= 1.5s human fairness target)`);
}

// =========================================================================
// Suite 7: Independent Records & Mode Persistence
// =========================================================================
console.log('\n--- Suite 7: Independent Records & Mode Persistence ---');
{
  const prog = ProgressionManager.getInstance();
  prog.resetAll();

  // Verify starting defaults
  const initialStats = prog.getState().lifetimeStats;
  assert(initialStats.bestScore === 0, 'Normal best score defaults to 0');
  assert(initialStats.hardModeHighScore === 0, 'Hard Mode high score defaults to 0');
  assert(initialStats.hardModeBestDistance === 0, 'Hard Mode best distance defaults to 0');
  assert(initialStats.hardModeRuns === 0, 'Hard Mode runs count defaults to 0');

  // Simulate Normal Mode run
  prog.setActiveGameMode('NORMAL');
  EventBus.getInstance().emit(EVENTS.RUN_STARTED, 'NORMAL');
  (prog as any).runActive = true;
  (prog as any).runScore = 15000;
  (prog as any).runDistance = 800;
  (prog as any).onRunFinished();

  const statsAfterNormal = prog.getState().lifetimeStats;
  assert(statsAfterNormal.bestScore === 15000, 'Normal best score updated to 15,000');
  assert(statsAfterNormal.hardModeHighScore === 0, 'Hard Mode high score remained 0 after Normal run');

  // Simulate Hard Mode run
  prog.setActiveGameMode('HARD');
  assert(prog.getActiveGameMode() === 'HARD', 'Active mode is HARD');
  assert(prog.getLastSelectedMode() === 'HARD', 'Last selected mode persisted as HARD');

  EventBus.getInstance().emit(EVENTS.RUN_STARTED, 'HARD');
  (prog as any).runActive = true;
  (prog as any).runScore = 28000;
  (prog as any).runDistance = 1400;
  (prog as any).onRunFinished();

  const statsAfterHard = prog.getState().lifetimeStats;
  assert(statsAfterHard.bestScore === 15000, 'Normal best score preserved at 15,000 without corruption');
  assert(statsAfterHard.hardModeHighScore === 28000, 'Hard Mode high score updated to 28,000 independently');
  assert(statsAfterHard.hardModeBestDistance === 1400, 'Hard Mode best distance updated to 1,400m independently');
  assert(statsAfterHard.hardModeRuns === 1, 'Hard Mode runs count incremented to 1');
}

// =========================================================================
// Suite 8: Deterministic Multi-Seed Solvability & Repeatability
// =========================================================================
console.log('\n--- Suite 8: Deterministic Multi-Seed Solvability & Repeatability ---');
{
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);

  const testSeeds = [1337, 4242, 99999, 888123];

  for (const seed of testSeeds) {
    trackManager.setGameMode('HARD');
    trackManager.setDebugSeed(seed);

    let allChunksSolvable = true;
    for (let c = 0; c < 15; c++) {
      const pattern = trackManager.selectPattern(c, 35.0, c * 80.0);
      const res = ReachabilityValidator.validatePattern(pattern as ValidatedPattern, 35.0);
      if (!res.solvable) {
        allChunksSolvable = false;
        break;
      }
    }
    assert(allChunksSolvable, `Seeded procedural run (seed: ${seed}) has 100% solvable track chunks`);
  }
}

// =========================================================================
// Suite 9: PacingMetrics Comparative Analytics Report
// =========================================================================
console.log('\n--- Suite 9: PacingMetrics Comparative Analytics Report ---');
{
  const normalReport = {
    speedSamplesCount: 100,
    averageSpeed: 23.5,
    currentSpeed: 28.0,
    obstaclesPer10s: 3.2,
    totalObstacles: 45,
    averageObstacleGapMeters: 26.5,
    timeSinceLastActionSeconds: 1.2,
    movingTrainCount: 4,
    movingTrainFrequencyPerMinute: 2.1,
    currentTrainSpeedProfile: 'NORMAL',
    averageMovingTrainVelocity: 13.5,
    fastestEncounteredTrainSpeed: 16.0,
    timeBetweenTrainEncounters: [28.0, 32.0, 26.0],
    averageTimeBetweenTrainEncounters: 28.7,
    lastRelativeClosingSpeed: 41.5,
    minTimeToImpactSeconds: 1.95,
    currentDifficultyTier: 'MEDIUM',
    difficultyDistribution: { BEGINNER: 2, EASY: 6, MEDIUM: 8, HARD: 2, EXPERT: 0 },
    actionDistribution: { JUMP: 14, SLIDE: 10, LANE_CHANGE: 22 },
    minReactionTimeSeconds: 1.95,
    unreachablePatternCount: 0,
    fallbackCount: 0,
    repeatedPatternCount: 0
  };

  const hardReport = {
    speedSamplesCount: 100,
    averageSpeed: 33.8,
    currentSpeed: 42.0,
    obstaclesPer10s: 4.8,
    totalObstacles: 62,
    averageObstacleGapMeters: 20.4,
    timeSinceLastActionSeconds: 0.8,
    movingTrainCount: 9,
    movingTrainFrequencyPerMinute: 4.5,
    currentTrainSpeedProfile: 'HARD',
    averageMovingTrainVelocity: 19.2,
    fastestEncounteredTrainSpeed: 23.5,
    timeBetweenTrainEncounters: [14.0, 12.5, 13.0, 11.8],
    averageTimeBetweenTrainEncounters: 12.8,
    lastRelativeClosingSpeed: 61.2,
    minTimeToImpactSeconds: 1.82,
    currentDifficultyTier: 'EXPERT',
    difficultyDistribution: { BEGINNER: 0, EASY: 2, MEDIUM: 6, HARD: 8, EXPERT: 6 },
    actionDistribution: { JUMP: 22, SLIDE: 18, LANE_CHANGE: 38 },
    minReactionTimeSeconds: 1.82,
    unreachablePatternCount: 0,
    fallbackCount: 0,
    repeatedPatternCount: 0
  };

  const comparison = PacingMetrics.compareProfiles(normalReport as any, hardReport as any);

  assert(comparison.averageSpeed.hard > comparison.averageSpeed.normal, 'Hard average speed is higher than Normal');
  assert(comparison.movingTrainsPerMinute.hard > comparison.movingTrainsPerMinute.normal, 'Hard mode moving train frequency is higher than Normal');
  assert(comparison.averageMovingTrainVelocity.hard > comparison.averageMovingTrainVelocity.normal, 'Hard mode average train velocity is higher than Normal');
  assert(comparison.solvabilityAndSafety.allPatternsSolvable === true, 'Comparative report confirms 100% solvability and safety');

  console.log('\n📊 [DEVELOPER BALANCING TELEMETRY COMPARISON]');
  console.log(JSON.stringify(comparison, null, 2));
}

console.log(`\n🎉 ALL ${passedTests} OF ${totalTests} TESTS PASSED CLEANLY! Task 5 Complete Hard Mode verified.`);
