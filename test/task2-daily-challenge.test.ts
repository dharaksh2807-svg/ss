import * as THREE from 'three';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { DailyChallengeManager, DailyCourseChallenge } from '../src/core/DailyChallengeManager';
import { TrackManager } from '../src/track/TrackManager';
import { SpeedController } from '../src/core/SpeedController';
import { DifficultyController } from '../src/track/DifficultyController';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { UpgradeManager } from '../src/player/UpgradeManager';
import { EnvironmentDirector } from '../src/environment/EnvironmentDirector';
import { EnvironmentManager } from '../src/environment/EnvironmentConfig';

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

console.log('🧪 Starting Metro Runner 3D: Task 2 Daily Seeded Challenges & Shareable Codes Test Suite...\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(msg);
  } else {
    console.log(`✅ PASSED: ${msg}`);
    passedTests++;
  }
}

async function runTests() {
  const dcManager = DailyChallengeManager.getInstance();
  const bus = EventBus.getInstance();
  const progression = ProgressionManager.getInstance();
  const upgradeManager = UpgradeManager.getInstance();

  // Clean test store
  localStorage.clear();

  // =========================================================================
  // Test 1: Same date produces the exact same challenge
  // =========================================================================
  console.log('--- Test 1: Same Date Determinism ---');
  const fixedDate = '2026-10-26';
  const c1 = dcManager.generateDailyChallenge(fixedDate);
  const c2 = dcManager.generateDailyChallenge(fixedDate);

  assert(c1.id === c2.id, `Challenge IDs match (${c1.id})`);
  assert(c1.seed === c2.seed, `Challenge seeds match (${c1.seed})`);
  assert(c1.type === c2.type, `Challenge types match (${c1.type})`);
  assert(c1.difficulty === c2.difficulty, `Challenge difficulties match (${c1.difficulty})`);
  assert(c1.name === c2.name, `Challenge names match (${c1.name})`);
  assert(c1.shareCode === c2.shareCode, `Share codes match (${c1.shareCode})`);

  // =========================================================================
  // Test 2: Different dates produce different challenges
  // =========================================================================
  console.log('\n--- Test 2: Different Dates Progression ---');
  const dates = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30'];
  const generated = dates.map(d => dcManager.generateDailyChallenge(d));

  const seeds = new Set(generated.map(c => c.seed));
  assert(seeds.size === dates.length, `All ${dates.length} distinct dates produced unique seeds`);
  
  const ids = new Set(generated.map(c => c.id));
  assert(ids.size === dates.length, `All ${dates.length} dates produced unique challenge IDs`);

  // UTC clock verification (no timezone offset bias)
  const todayUTC = dcManager.getTodayUTC();
  assert(/^\d{4}-\d{2}-\d{2}$/.test(todayUTC), `Today's UTC date key formatted strictly as YYYY-MM-DD (${todayUTC})`);

  // =========================================================================
  // Test 3: Same seed reproduces identical track gameplay layout on retry
  // =========================================================================
  console.log('\n--- Test 3: Fair Repeat Attempts & Track Seed Reproducibility ---');
  const scene1 = new THREE.Scene();
  const scene2 = new THREE.Scene();

  const tm1 = new TrackManager(scene1);
  const tm2 = new TrackManager(scene2);

  const testSeed = 0x5a8f9b20;
  tm1.setSeed(testSeed, true);
  tm1.reset(false);

  tm2.setSeed(testSeed, true);
  tm2.reset(false);

  assert(tm1.chunks.length === tm2.chunks.length, `Both runs generated ${tm1.chunks.length} chunks`);

  // Compare every obstacle across all chunks: type, lane, position X & Z
  let totalObstaclesChecked = 0;
  for (let c = 0; c < tm1.chunks.length; c++) {
    const chunk1 = tm1.chunks[c];
    const chunk2 = tm2.chunks[c];

    assert(chunk1.obstacles.length === chunk2.obstacles.length, `Chunk ${c} has identical obstacle count (${chunk1.obstacles.length})`);

    for (let o = 0; o < chunk1.obstacles.length; o++) {
      const obs1 = chunk1.obstacles[o];
      const obs2 = chunk2.obstacles[o];

      assert(obs1.type === obs2.type, `Obstacle [c:${c}, o:${o}] type matches (${obs1.type})`);
      assert(obs1.lane === obs2.lane, `Obstacle [c:${c}, o:${o}] lane matches (${obs1.lane})`);
      assert(Math.abs(obs1.group.position.z - obs2.group.position.z) < 0.001, `Obstacle [c:${c}, o:${o}] Z position matches`);
      assert(Math.abs(obs1.group.position.x - obs2.group.position.x) < 0.001, `Obstacle [c:${c}, o:${o}] X position matches`);
      totalObstaclesChecked++;
    }
  }

  assert(totalObstaclesChecked > 0, `Verified ${totalObstaclesChecked} obstacles reproduce with 100% mathematical fidelity across separate instances`);

  // Verify retry on the same TrackManager instance reproduces identical layout
  const firstRunObstacles = tm1.chunks.map(chunk => chunk.obstacles.map(o => ({
    type: o.type,
    lane: o.lane,
    x: o.group.position.x,
    z: o.group.position.z
  })));

  // Player retries: reset with preserved debug seed
  tm1.reset(false);

  for (let c = 0; c < tm1.chunks.length; c++) {
    const chunk = tm1.chunks[c];
    assert(chunk.obstacles.length === firstRunObstacles[c].length, `Chunk ${c} retry has exact same obstacle count`);
    for (let o = 0; o < chunk.obstacles.length; o++) {
      const obs = chunk.obstacles[o];
      const orig = firstRunObstacles[c][o];
      assert(obs.type === orig.type, `Retry obstacle [c:${c}, o:${o}] matches original type`);
      assert(obs.lane === orig.lane, `Retry obstacle [c:${c}, o:${o}] matches original lane`);
      assert(Math.abs(obs.group.position.x - orig.x) < 0.001, `Retry obstacle [c:${c}, o:${o}] matches original X`);
      assert(Math.abs(obs.group.position.z - orig.z) < 0.001, `Retry obstacle [c:${c}, o:${o}] matches original Z`);
    }
  }

  // =========================================================================
  // Test 4: Scenery choices do not change hazards or consume gameplay PRNG
  // =========================================================================
  console.log('\n--- Test 4: Gameplay Randomness Isolated from Scenery Randomness ---');
  const sceneA = new THREE.Scene();
  const sceneB = new THREE.Scene();

  const tmA = new TrackManager(sceneA);
  const tmB = new TrackManager(sceneB);

  // Set identical run seeds under different district environments
  EnvironmentManager.getInstance().savePreference('HISTORIC_QUARTER');
  tmA.setSeed(testSeed, true);
  tmA.reset(false);

  EnvironmentManager.getInstance().savePreference('MODERN_METRO');
  tmB.setSeed(testSeed, true);
  tmB.reset(false);

  // Verify obstacle sequences remain strictly identical
  for (let c = 0; c < tmA.chunks.length; c++) {
    const chunkA = tmA.chunks[c];
    const chunkB = tmB.chunks[c];
    assert(chunkA.obstacles.length === chunkB.obstacles.length, `Chunk ${c} obstacle count unaffected by scenery theme`);
    for (let o = 0; o < chunkA.obstacles.length; o++) {
      assert(chunkA.obstacles[o].type === chunkB.obstacles[o].type, `Hazard type unaffected by scenery variation`);
      assert(chunkA.obstacles[o].lane === chunkB.obstacles[o].lane, `Hazard lane unaffected by scenery variation`);
      assert(Math.abs(chunkA.obstacles[o].group.position.x - chunkB.obstacles[o].group.position.x) < 0.001, `Hazard X unaffected by scenery`);
      assert(Math.abs(chunkA.obstacles[o].group.position.z - chunkB.obstacles[o].group.position.z) < 0.001, `Hazard Z unaffected by scenery`);
    }
  }

  // =========================================================================
  // Test 5: Challenge import/export round-trip
  // =========================================================================
  console.log('\n--- Test 5: Shareable Challenge Code Round-Trip ---');
  const testChallenges: DailyCourseChallenge[] = [
    dcManager.generateDailyChallenge('2026-10-26'),
    dcManager.generateDailyChallenge('2026-11-15'),
    dcManager.generateDailyChallenge('2026-12-31')
  ];

  for (const orig of testChallenges) {
    const code = orig.shareCode;
    assert(typeof code === 'string' && code.startsWith('MTR1-'), `Encoded format starts with MTR1- (${code})`);

    const parseRes = dcManager.parseChallengeCode(code);
    assert(parseRes.success === true, `Parsed code successfully`);
    const decoded = parseRes.challenge!;

    assert(decoded.seed === orig.seed, `Decoded seed matches original (${decoded.seed} vs ${orig.seed})`);
    assert(decoded.type === orig.type, `Decoded type matches original (${decoded.type})`);
    assert(decoded.difficulty === orig.difficulty, `Decoded difficulty matches original (${decoded.difficulty})`);
    assert(decoded.isImported === true, `Decoded challenge correctly flagged as isImported`);
  }

  // =========================================================================
  // Test 6: Rejection of malformed codes and corrupted checksums
  // =========================================================================
  console.log('\n--- Test 6: Safe Import Validation & Corruption Rejection ---');
  const validCode = testChallenges[0].shareCode;

  // Corrupted checksum
  const badChecksumCode = validCode.slice(0, -2) + (validCode.slice(-2) === 'AA' ? 'BB' : 'AA');
  const resBadChecksum = dcManager.parseChallengeCode(badChecksumCode);
  assert(resBadChecksum.success === false, `Corrupted checksum rejected`);
  assert((resBadChecksum.error || '').includes('Checksum mismatch'), `Reports checksum mismatch error`);

  // Malformed segment count
  const resMalformed = dcManager.parseChallengeCode('MTR1-DST-HRD-5A8F9B20');
  assert(resMalformed.success === false, `Incomplete segments rejected`);

  // Invalid challenge type
  const resBadType = dcManager.parseChallengeCode('MTR1-XYZ-HRD-5A8F9B20-4E');
  assert(resBadType.success === false, `Unknown type XYZ rejected`);

  // Invalid difficulty
  const resBadDiff = dcManager.parseChallengeCode('MTR1-DST-GOD-5A8F9B20-4E');
  assert(resBadDiff.success === false, `Unknown difficulty GOD rejected`);

  // Bad seed characters
  const resBadSeed = dcManager.parseChallengeCode('MTR1-DST-HRD-ZZZZZZZZ-4E');
  assert(resBadSeed.success === false, `Non-hex seed rejected`);

  // Empty or nonsensical input
  assert(dcManager.parseChallengeCode('').success === false, `Empty string rejected`);
  assert(dcManager.parseChallengeCode(null as any).success === false, `Null input rejected safely`);

  // =========================================================================
  // Test 7: Multi-day persistence preserves distinct date records
  // =========================================================================
  console.log('\n--- Test 7: Multi-Day Persistence & Record Isolation ---');
  localStorage.clear();

  // Run day 1
  const day1 = dcManager.generateDailyChallenge('2026-10-26');
  dcManager.setActiveChallenge(day1);
  const run1 = dcManager.recordRunResult(12500, 850, 45, 6);

  assert(run1.isNewRecord === true, `First run is a new record`);
  assert(run1.record.bestScore === 12500, `Day 1 bestScore recorded as 12500`);
  assert(run1.record.attempts === 1, `Day 1 attempts is 1`);

  // Run day 2
  const day2 = dcManager.generateDailyChallenge('2026-10-27');
  dcManager.setActiveChallenge(day2);
  const run2 = dcManager.recordRunResult(22000, 1400, 90, 10);

  assert(run2.record.bestScore === 22000, `Day 2 bestScore recorded as 22000`);

  // Check day 1 record was NOT overwritten by day 2
  const day1Record = dcManager.getRecord('2026-10-26');
  assert(day1Record.bestScore === 12500, `Day 1 record preserved at 12500`);
  assert(day1Record.attempts === 1, `Day 1 attempts preserved at 1`);

  const day2Record = dcManager.getRecord('2026-10-27');
  assert(day2Record.bestScore === 22000, `Day 2 record preserved at 22000`);

  // =========================================================================
  // Test 8: Retry behavior and personal record updates
  // =========================================================================
  console.log('\n--- Test 8: Retry Behavior & PB Updates ---');
  dcManager.setActiveChallenge(day1);

  // Attempt 2 on day 1 with lower score
  const retryLower = dcManager.recordRunResult(9000, 600, 30, 4);
  assert(retryLower.isNewRecord === false, `Lower score is not a new record`);
  assert(retryLower.record.bestScore === 12500, `Best score remains 12500 after lower retry`);
  assert(retryLower.record.attempts === 2, `Attempt count incremented to 2`);

  // Attempt 3 on day 1 with higher score (PB breakthrough)
  const retryHigher = dcManager.recordRunResult(18500, 1200, 75, 9);
  assert(retryHigher.isNewRecord === true, `Higher score correctly triggers new record`);
  assert(retryHigher.record.bestScore === 18500, `Best score updated to 18500`);
  assert(retryHigher.record.attempts === 3, `Attempt count incremented to 3`);

  // =========================================================================
  // Test 9: Progression rewards are awarded once and not duplicated
  // =========================================================================
  console.log('\n--- Test 9: Reward Integrity & Anti-Farming ---');
  // Day 1 first completion awarded coins
  assert(run1.rewardGranted === 350, `First completion on Day 1 granted 350 reward coins`);
  assert(retryLower.rewardGranted === 0, `Retry on Day 1 granted 0 bonus coins (no reward duplication)`);
  assert(retryHigher.rewardGranted === 0, `PB retry on Day 1 granted 0 bonus coins`);

  // Imported challenges do not award progression coins
  const importedParsed = dcManager.parseChallengeCode(validCode);
  dcManager.setActiveChallenge(importedParsed.challenge!);
  const importedRun = dcManager.recordRunResult(50000, 3000, 200, 15);
  assert(importedRun.rewardGranted === 0, `Imported/custom challenge awards 0 bonus coins`);

  // =========================================================================
  // Test 10 & 11: Normal and Hard mode records remain completely unaffected
  // =========================================================================
  console.log('\n--- Tests 10 & 11: Normal and Hard Mode Lifetime Stats Isolation ---');
  const normalBefore = progression.getState().lifetimeStats.bestScore;
  const hardBefore = progression.getState().lifetimeStats.hardModeHighScore || 0;

  // Running daily challenge should NOT pollute or mutate normal or hard mode records
  dcManager.setActiveChallenge(day1);
  dcManager.recordRunResult(999999, 50000, 500, 25);

  const normalAfter = progression.getState().lifetimeStats.bestScore;
  const hardAfter = progression.getState().lifetimeStats.hardModeHighScore || 0;

  assert(normalAfter === normalBefore, `Normal mode lifetime best strictly unchanged (${normalAfter} === ${normalBefore})`);
  assert(hardAfter === hardBefore, `Hard mode lifetime best strictly unchanged (${hardAfter} === ${hardBefore})`);

  // =========================================================================
  // Test 12: Speed & Difficulty Controller Integration for Daily Challenge
  // =========================================================================
  console.log('\n--- Test 12: Speed & Difficulty Controller Mode Resolution ---');
  // Set active daily challenge with HARD difficulty
  const hardDaily = dcManager.generateDailyChallenge('2026-10-26');
  (hardDaily as any).difficulty = 'HARD';
  dcManager.setActiveChallenge(hardDaily);

  const speedCtrl = new SpeedController('DAILY_CHALLENGE' as any);
  assert(speedCtrl.getSpeed() > 0, `SpeedController initialized for DAILY_CHALLENGE mode (${speedCtrl.getSpeed()} m/s)`);

  const diffCtrl = new DifficultyController();
  diffCtrl.setGameMode('DAILY_CHALLENGE');
  diffCtrl.reset();
  assert(diffCtrl.getGameMode() === 'DAILY_CHALLENGE', `DifficultyController handles DAILY_CHALLENGE mode`);

  console.log(`\n🎉 All ${passedTests}/${totalTests} Task 2 Daily Seeded Challenge & Shareable Code Tests Passed!\n`);
}

runTests().catch(err => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
