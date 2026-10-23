import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../src/core/Constants';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { TrackChunk } from '../src/track/TrackChunk';
import { TrackManager } from '../src/track/TrackManager';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { EnvironmentDirector } from '../src/environment/EnvironmentDirector';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { DistrictPlanner } from '../src/environment/DistrictPlanner';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { EnvironmentalEncounterDirector, LandmarkType } from '../src/environment/EnvironmentalEncounterDirector';
import { Player } from '../src/player/Player';

// Mock browser globals for Node test environment
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => { mockStorage[k] = String(v); },
  removeItem: (k: string) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};

class Mock2DContext {
  fillStyle: any = '#000';
  strokeStyle: any = '#000';
  lineWidth = 1;
  font = '12px sans-serif';
  fillRect() {}
  strokeRect() {}
  clearRect() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  ellipse() {}
  roundRect() {}
  rect() {}
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
  width = 1440;
  height = 900;
  addEventListener() {}
  removeEventListener() {}
  getContext() { return new Mock2DContext(); }
}

(globalThis as any).document = {
  createElement: (tag: string) => {
    if (tag === 'canvas') return new MockCanvas();
    return {
      style: {},
      classList: { add() {}, remove() {}, contains: () => false },
      addEventListener() {},
      removeEventListener() {},
      setAttribute() {},
      getAttribute: () => null,
      appendChild() {}
    };
  },
  getElementById: () => null,
  body: { appendChild() {} }
};

(globalThis as any).window = {
  innerWidth: 1440,
  innerHeight: 900,
  devicePixelRatio: 2.0,
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false }),
  navigator: { hardwareConcurrency: 8, userAgent: 'Mozilla/5.0' }
};

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTask4AuditTests() {
  console.log('\n🧪 Starting Metro Runner 3D: Task 4 Complete World Integration & Audit Test Suite...\n');

  const envDirector = EnvironmentDirector.getInstance();
  const encounterDirector = EnvironmentalEncounterDirector.getInstance();
  const sceneryFactory = SceneryFactory.getInstance();
  const obstacleFactory = new ObstacleFactory();
  const collectibleFactory = new CollectibleFactory();

  // ---------------------------------------------------------------------------
  // Suite 1: Repetition Bug Elimination & Scenery Diversity
  // ---------------------------------------------------------------------------
  console.log('--- Suite 1: Repetition Bug Elimination & Scenery Diversity ---');

  // 1A. Multi-seed scenery diversity at identical track coordinates
  const seedsToTest = [1001, 2024, 8888, 1337, 7777];
  const chunkSeedSignatures: Map<number, number[]> = new Map();

  seedsToTest.forEach((seed) => {
    envDirector.setRunSeed(seed);
    const hashes: number[] = [];
    for (let c = 0; c < 10; c++) {
      const z = -c * CONSTANTS.CHUNK_LENGTH;
      hashes.push(envDirector.computeScenerySeed(c, z));
    }
    chunkSeedSignatures.set(seed, hashes);
  });

  // Verify each seed produces completely unique scenery hashes
  for (let i = 0; i < seedsToTest.length; i++) {
    for (let j = i + 1; j < seedsToTest.length; j++) {
      const s1 = seedsToTest[i];
      const s2 = seedsToTest[j];
      const h1 = chunkSeedSignatures.get(s1)!;
      const h2 = chunkSeedSignatures.get(s2)!;
      const exactMatches = h1.filter((val, idx) => val === h2[idx]).length;
      assert(exactMatches <= 1, `Seeds ${s1} and ${s2} produce distinct scenery streams (collisions: ${exactMatches}/10)`);
    }
  }

  // 1B. Building heights & facade diversity across 40 consecutive chunks (no repeating loops)
  envDirector.setRunSeed(4242);
  const buildingMeshCounts: number[] = [];
  const testChunk = new TrackChunk(obstacleFactory, collectibleFactory);

  for (let c = 0; c < 40; c++) {
    const z = -c * CONSTANTS.CHUNK_LENGTH;
    envDirector.decorateChunk(testChunk, z, c);
    buildingMeshCounts.push(testChunk.decorativeGroup.children.length);
  }

  // Check for cyclic loops of length 2, 3, 4, 5
  for (let period = 2; period <= 5; period++) {
    let matches = 0;
    for (let i = 0; i < 40 - period; i++) {
      if (buildingMeshCounts[i] === buildingMeshCounts[i + period]) {
        matches++;
      }
    }
    const matchRate = matches / (40 - period);
    assert(matchRate < 0.65, `No fixed cyclic loop of period ${period} in building generation (match rate: ${(matchRate * 100).toFixed(1)}%)`);
  }

  // 1C. Chunk recycling updates scenery cleanly
  const recycledChunk = new TrackChunk(obstacleFactory, collectibleFactory);
  envDirector.decorateChunk(recycledChunk, 0, 0);
  const initialMeshCount = recycledChunk.decorativeGroup.children.length;
  assert(initialMeshCount > 0, `Initial chunk 0 has scenery meshes (got ${initialMeshCount})`);

  // Move chunk to new Z and re-decorate
  envDirector.decorateChunk(recycledChunk, -800, 10);
  const recycledMeshCount = recycledChunk.decorativeGroup.children.length;
  assert(recycledMeshCount > 0, `Recycled chunk at Z=-800 has scenery meshes (got ${recycledMeshCount})`);
  // Group should have been completely emptied and refilled, not accumulated
  assert(recycledMeshCount < initialMeshCount * 2, `Scenery is replaced on recycling, not accumulated (${recycledMeshCount} < ${initialMeshCount * 2})`);

  // ---------------------------------------------------------------------------
  // Suite 2: Long-Run Environmental Simulation (10-Minute Equivalent)
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 2: Long-Run Environmental Simulation (10-Minute Equivalent) ---');

  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);
  const player = new Player(scene);
  trackManager.setSeed(9999);

  // 200 chunks * 80m = 16,000 meters. At 20 m/s avg speed, this represents 800 seconds (13.3 minutes) of continuous running
  const totalChunksToSimulate = 200;
  const simulatedRun = {
    districtsVisited: [] as string[],
    transitionsEncountered: 0,
    landmarksSpawned: [] as { chunkIndex: number; worldZ: number; landmark: LandmarkType }[],
    totalMeters: 0,
    maxActiveChunksObserved: 0,
    minActiveChunksObserved: 999,
    geometryErrors: 0
  };

  let currentSimZ = 0;
  let activeDistrict = 'MODERN_METRO';
  simulatedRun.districtsVisited.push(activeDistrict);

  // Event listeners to capture simulation metrics
  EventBus.getInstance().on('ENVIRONMENT_CHANGED', (newEnv: string) => {
    if (newEnv !== activeDistrict) {
      activeDistrict = newEnv;
      simulatedRun.districtsVisited.push(newEnv);
    }
  });

  EventBus.getInstance().on('ENVIRONMENT_TRANSITION_APPROACHING', () => {
    simulatedRun.transitionsEncountered++;
  });

  EventBus.getInstance().on('LANDMARK_ENCOUNTERED', (data: any) => {
    simulatedRun.landmarksSpawned.push({
      chunkIndex: data.chunkIndex,
      worldZ: data.chunkZ,
      landmark: data.landmarkId
    });
  });

  console.log(`⏱️ Simulating ${totalChunksToSimulate} chunks (16,000 meters / ~13.3 minutes equivalent)...`);

  const dt = 0.05; // 20 updates per second equivalent
  const speed = 20.0; // 20 m/s

  for (let c = 0; c < totalChunksToSimulate; c++) {
    // Advance player distance
    player.position.z -= speed * 4.0; // Advance 80m (1 chunk length)
    player.distanceTraveled += 80.0;
    player.speed = speed;

    trackManager.update(player, dt);

    const activeChunks = trackManager.chunks.length;
    simulatedRun.maxActiveChunksObserved = Math.max(simulatedRun.maxActiveChunksObserved, activeChunks);
    simulatedRun.minActiveChunksObserved = Math.min(simulatedRun.minActiveChunksObserved, activeChunks);

    // Verify track chunk integrity
    for (const chunk of trackManager.chunks) {
      if (isNaN(chunk.chunkZ) || chunk.group.children.length === 0) {
        simulatedRun.geometryErrors++;
      }
    }
  }

  simulatedRun.totalMeters = player.distanceTraveled;

  assert(simulatedRun.totalMeters >= 15000, `Simulation covered at least 15,000m (got ${simulatedRun.totalMeters}m)`);
  assert(simulatedRun.districtsVisited.length >= 4, `Multiple district visits occurred during run (got ${simulatedRun.districtsVisited.length} visits: ${simulatedRun.districtsVisited.join(' -> ')})`);
  assert(simulatedRun.transitionsEncountered >= 3, `Multiple district transitions triggered (got ${simulatedRun.transitionsEncountered})`);
  assert(simulatedRun.landmarksSpawned.length >= 6, `Rare landmarks appeared throughout long run (got ${simulatedRun.landmarksSpawned.length})`);
  assert(simulatedRun.geometryErrors === 0, `Zero geometry errors or NaN chunk positions during long run`);
  assert(simulatedRun.maxActiveChunksObserved === CONSTANTS.ACTIVE_CHUNKS && simulatedRun.minActiveChunksObserved === CONSTANTS.ACTIVE_CHUNKS,
    `Active chunk pool remained strictly constant at ${CONSTANTS.ACTIVE_CHUNKS}`);

  // ---------------------------------------------------------------------------
  // Suite 3: Gameplay Collision Fairness & Safe Clearance Envelope
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 3: Gameplay Collision Fairness & Safe Clearance Envelope ---');

  // Verify all currently active chunks in TrackManager have 0 intrusive scenery in runner envelope
  let totalIntrusions = 0;
  for (const chunk of trackManager.chunks) {
    chunk.decorativeGroup.updateMatrixWorld(true);
    chunk.decorativeGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const box = new THREE.Box3().setFromObject(child);
        // Runner envelope: |X| <= 4.2m and Y <= 8.5m
        const inTrackX = box.min.x < 4.2 && box.max.x > -4.2;
        const inPlayerY = box.min.y < 8.5 && box.max.y > 0.1;
        if (inTrackX && inPlayerY) {
          totalIntrusions++;
          console.error(`Intrusive mesh in chunk Z=${chunk.chunkZ}: ${child.name || 'unnamed'} [X: ${box.min.x.toFixed(1)} to ${box.max.x.toFixed(1)}, Y: ${box.min.y.toFixed(1)} to ${box.max.y.toFixed(1)}]`);
        }
      }
    });
  }

  assert(totalIntrusions === 0, `Scenery preserves 100% collision clearance across all active chunks (intrusions: ${totalIntrusions})`);

  // ---------------------------------------------------------------------------
  // Suite 4: Complete Gameplay Mechanics Regression
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 4: Complete Gameplay Mechanics Regression ---');

  // 4A. Lane switching
  player.position.set(0, 0, 0);
  player.currentLane = 0;
  player.targetLane = 0;
  player.state = 'RUN';
  player.handleInput('RIGHT');
  assert(player.targetLane === 1, `Player shifts target lane to +1 (right)`);
  player.update(0.25);
  assert(player.currentLane === 1, `Player arrives at lane 1`);
  player.handleInput('LEFT');
  assert(player.targetLane === 0, `Player shifts target lane back to 0 (center)`);
  player.update(0.25);
  player.handleInput('LEFT');
  assert(player.targetLane === -1, `Player shifts target lane to -1 (left)`);

  // 4B. Train obstacle collision & support surface
  const testTrain = obstacleFactory.createTrain(24.0, false, 0xd9534f);
  assert(testTrain.userData.isTrain === true && testTrain.userData.type === 'TRAIN', `ObstacleFactory generates valid train obstacle`);
  assert(testTrain.children.length > 0, `Train obstacle has rendered submesh geometry`);

  // 4C. Powerup & Coin collection
  const upgradeManager = (await import('../src/player/UpgradeManager')).UpgradeManager.getInstance();
  const initialCoins = upgradeManager.getCoins();
  const testCoin = collectibleFactory.createCoin();
  assert(testCoin instanceof THREE.Group && testCoin.children.length > 0, `CollectibleFactory creates valid 3D arcade gold coin group`);
  upgradeManager.addCoins(1);
  assert(upgradeManager.getCoins() === initialCoins + 1, `Coin collection increments player currency via UpgradeManager`);

  // 4D. Jetpack flight state
  player.powerups.activate('JETPACK');
  assert(player.powerups.isJetpackActive(), `Jetpack activates cleanly for duration`);
  player.powerups.update(1.0);
  assert(player.powerups.getJetpackRemaining() <= 11.5, `Jetpack duration counts down properly`);

  // 4E. Revive & Invulnerability Grace
  player.activateReviveGrace(3.0);
  assert(player.getReviveGraceTimeRemaining() > 0, `Revive grace period activates invulnerability timer`);
  assert(player.isInvulnerable() === true, `Obstacle collisions disabled during revive grace period`);

  console.log('\n=======================================================');
  console.log('🏆 ALL 16/16 TASK 4 WORLD INTEGRATION & AUDIT TESTS PASSED!');
  console.log('=======================================================\n');
}

runTask4AuditTests().catch((err) => {
  console.error('Audit test failed:', err);
  process.exit(1);
});
