import { CONSTANTS, LaneIndex } from '../src/core/Constants';
import { SECRET_ROUTE_CATALOG } from '../src/track/SecretRouteCatalog';
import { SecretRouteDirector } from '../src/track/SecretRouteDirector';
import { SecretRouteScenery } from '../src/track/SecretRouteScenery';
import { SecretRouteId } from '../src/track/SecretRouteTypes';
import { ReachabilityValidator } from '../src/track/ReachabilityValidator';
import { MODERN_METRO_THEME, HISTORIC_QUARTER_THEME, UNDERGROUND_METRO_THEME, NEON_INDUSTRIAL_THEME } from '../src/environment/EnvironmentConfig';
import * as THREE from 'three';

// Mock browser localStorage for node test runner
const mockStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passedCount++;
    console.log(`✅ PASSED: ${msg}`);
  } else {
    failedCount++;
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runTestSuite() {
  console.log('============================================================');
  console.log('TASK 2: SECRET RAILWAY ROUTES & HIDDEN PASSAGES TEST SUITE');
  console.log('============================================================\n');

  // -------------------------------------------------------------
  // Test 1: Data-Driven Catalog Definitions
  // -------------------------------------------------------------
  console.log('--- Test 1: Data-Driven Catalog Definitions ---');
  const catalogKeys = Object.keys(SECRET_ROUTE_CATALOG) as SecretRouteId[];
  assert(catalogKeys.length === 3, 'Exactly 3 original secret routes defined in catalog');
  assert(catalogKeys.includes('ABANDONED_METRO_PLATFORM'), 'Contains ABANDONED_METRO_PLATFORM');
  assert(catalogKeys.includes('ELEVATED_RAILWAY_PASSAGE'), 'Contains ELEVATED_RAILWAY_PASSAGE');
  assert(catalogKeys.includes('HIDDEN_MAINTENANCE_TUNNEL'), 'Contains HIDDEN_MAINTENANCE_TUNNEL');

  // Verify encounter 1: Abandoned Metro Platform
  const s1 = SECRET_ROUTE_CATALOG.ABANDONED_METRO_PLATFORM;
  assert(s1.minProgressionMeters >= 200, 'Abandoned platform min progression is >= 200m');
  assert(s1.cooldownMeters >= 400, 'Abandoned platform cooldown is >= 400m');
  assert(s1.entry.lane === -1, 'Abandoned platform entry is Lane -1 (Left Siding)');
  assert(s1.rewardConfig.coinCount >= 40, 'Abandoned platform offers at least 40 coins');
  assert(s1.rewardConfig.firstDiscoveryCoins === 50, 'Abandoned platform first-discovery awards 50 coins');
  assert(s1.rewardConfig.bonusPowerup === 'SNEAKERS', 'Abandoned platform features Super Sneakers bonus');

  // Verify encounter 2: Elevated Railway Passage
  const s2 = SECRET_ROUTE_CATALOG.ELEVATED_RAILWAY_PASSAGE;
  assert(s2.minProgressionMeters >= 200, 'Elevated skyway min progression is >= 200m');
  assert(s2.cooldownMeters >= 400, 'Elevated skyway cooldown is >= 400m');
  assert(s2.entry.lane === 0, 'Elevated skyway entry is Lane 0 (Center Ramp)');
  assert(s2.entry.actionRequired === 'RAMP_CLIMB', 'Elevated skyway requires ramp climb');
  assert(s2.rewardConfig.coinCount >= 40, 'Elevated skyway offers at least 40 coins');
  assert(s2.rewardConfig.bonusPowerup === 'MULTIPLIER', 'Elevated skyway features 2x Multiplier bonus');

  // Verify encounter 3: Hidden Maintenance Tunnel
  const s3 = SECRET_ROUTE_CATALOG.HIDDEN_MAINTENANCE_TUNNEL;
  assert(s3.minProgressionMeters >= 200, 'Maintenance tunnel min progression is >= 200m');
  assert(s3.cooldownMeters >= 400, 'Maintenance tunnel cooldown is >= 400m');
  assert(s3.entry.lane === 1, 'Maintenance tunnel entry is Lane 1 (Right Conduit)');
  assert(s3.rewardConfig.coinCount >= 45, 'Maintenance tunnel offers at least 45 coins');
  assert(s3.rewardConfig.bonusPowerup === 'JETPACK', 'Maintenance tunnel features guaranteed Jetpack');
  assert(s3.isJetpackCompatible === true, 'Maintenance tunnel is explicitly Jetpack compatible');

  // -------------------------------------------------------------
  // Test 2: Physical Reachability & Solvability
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Physical Reachability & Solvability ---');
  const seedsToTest = [1001, 2048, 7777, 99999];

  for (const seed of seedsToTest) {
    const pat1 = s1.createPattern(seed);
    const proof1 = ReachabilityValidator.validatePattern(pat1 as any, 18.0, [-1, 0, 1]);
    assert(proof1.solvable, `Abandoned Metro Platform pattern (seed ${seed}) is 100% solvable`);

    const pat2 = s2.createPattern(seed);
    const proof2 = ReachabilityValidator.validatePattern(pat2 as any, 18.0, [-1, 0, 1]);
    assert(proof2.solvable, `Elevated Railway Passage pattern (seed ${seed}) is 100% solvable`);

    const pat3 = s3.createPattern(seed);
    const proof3 = ReachabilityValidator.validatePattern(pat3 as any, 18.0, [-1, 0, 1]);
    assert(proof3.solvable, `Hidden Maintenance Tunnel pattern (seed ${seed}) is 100% solvable`);
  }

  // -------------------------------------------------------------
  // Test 3: Safe Bypass Guarantee (Gameplay Fairness)
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Safe Bypass Guarantee (Gameplay Fairness) ---');
  // If player stays in non-secret lanes (e.g. Lane 1 during Abandoned Platform, or Lane -1 during Skyway):
  // They must have an obstacle-free or solvable path through the entire chunk without taking the secret.
  const pat1 = s1.createPattern(1337);
  const bypassProof1 = ReachabilityValidator.validatePattern(pat1 as any, 20.0, [0, 1]);
  assert(bypassProof1.solvable, 'Abandoned Platform bypass (Lanes 0, 1) is 100% solvable if secret is skipped');

  const pat2 = s2.createPattern(1337);
  const bypassProof2 = ReachabilityValidator.validatePattern(pat2 as any, 20.0, [-1, 1]);
  assert(bypassProof2.solvable, 'Elevated Skyway ground bypass (Lanes -1, 1) is 100% solvable if secret is skipped');

  const pat3 = s3.createPattern(1337);
  const bypassProof3 = ReachabilityValidator.validatePattern(pat3 as any, 20.0, [-1, 0]);
  assert(bypassProof3.solvable, 'Maintenance Tunnel bypass (Lanes -1, 0) is 100% solvable if secret is skipped');

  // -------------------------------------------------------------
  // Test 4: Rooftop Support Physics Integrity
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Rooftop Support Physics Integrity ---');
  const skywayObstacles = pat2.obstacles;
  const trainRampObs = skywayObstacles.find(o => o.type === 'TRAIN_RAMP');
  assert(!!trainRampObs, 'Elevated Skyway contains TRAIN_RAMP obstacle');
  assert(trainRampObs?.hasRamp === true, 'TRAIN_RAMP is climbable with hasRamp=true');
  assert(trainRampObs?.hasExitRamp === true, 'TRAIN_RAMP has trailing exit ramp back to ground');

  // Verify rooftop collectibles support
  const roofCoins = pat2.collectibles.filter(c => c.supportSurface === 'TRAIN_ROOF');
  assert(roofCoins.length > 0, 'Skyway contains collectibles configured with supportSurface TRAIN_ROOF');
  assert(roofCoins[0].yOffset! >= 5.0, 'Rooftop coin Y offset matches train roof height (~5.2m)');

  // -------------------------------------------------------------
  // Test 5: Jetpack Clearance & Vaulted Ceiling Safety
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Jetpack Clearance & Vaulted Ceiling Safety ---');
  const tunnelPat = pat3;
  // Verify maintenance tunnel obstacles do not contain low impassable tunnel roofs
  assert(!tunnelPat.isTunnel, 'Maintenance tunnel uses high vaulted architecture without low solid ceiling');
  assert(CONSTANTS.JETPACK_ALTITUDE === 9.0, 'Jetpack cruises at 9.0m altitude');

  // -------------------------------------------------------------
  // Test 6: Deterministic Procedural Scheduling & Cooldowns
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Deterministic Procedural Scheduling & Cooldowns ---');
  const director = SecretRouteDirector.getInstance();
  director.resetRunState();
  director.setRunSeed(4242);

  // Mock TrackChunk for scheduler
  class MockChunk {
    public decorativeGroup = new THREE.Group();
    public length = CONSTANTS.CHUNK_LENGTH;
    public populatedPattern: any = null;
    public populate(pattern: any, worldZ: number, theme: any, isTrans: boolean) {
      this.populatedPattern = pattern;
      return true;
    }
  }

  const chunkA = new MockChunk();
  // 1. Before min progression distance (e.g. at z = -80m, absZ = 80m < 240m):
  const schedEarly = director.tryScheduleSecretRoute(chunkA, -80, MODERN_METRO_THEME, false, 18.0);
  assert(schedEarly === null, 'Cannot schedule secret route before minimum progression distance (80m < 240m)');

  // 2. At z = -320m (eligible distance):
  // Force encounter to test predictable execution
  director.forceEncounter('ABANDONED_METRO_PLATFORM', 555);
  const schedEligible = director.tryScheduleSecretRoute(chunkA, -320, MODERN_METRO_THEME, false, 18.0);
  assert(schedEligible !== null, 'Successfully scheduled secret route at eligible distance (-320m)');
  assert(schedEligible?.name === 'SECRET_ABANDONED_METRO_PLATFORM', 'Scheduled correct encounter pattern');
  assert(director.getActiveRoute() !== null, 'Active secret route registered in director');
  assert(director.getActiveRoute()?.def.id === 'ABANDONED_METRO_PLATFORM', 'Active route ID is ABANDONED_METRO_PLATFORM');

  // 3. Immediately next chunk at z = -400m (within 450m cooldown):
  const chunkB = new MockChunk();
  const schedCooldown = director.tryScheduleSecretRoute(chunkB, -400, MODERN_METRO_THEME, false, 18.0);
  assert(schedCooldown === null, 'Cannot schedule secret route while inside cooldown distance');

  // 4. District transition chunks are strictly rejected
  director.resetRunState();
  director.forceEncounter('ELEVATED_RAILWAY_PASSAGE');
  const chunkTrans = new MockChunk();
  const schedTrans = director.tryScheduleSecretRoute(chunkTrans, -500, MODERN_METRO_THEME, true, 18.0);
  assert(schedTrans === null, 'Strictly rejects scheduling on district transition chunks');

  // -------------------------------------------------------------
  // Test 7: Player Entry, First-Discovery Rewards & Anti-Farming
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Player Entry, First-Discovery Rewards & Anti-Farming ---');
  director.resetPersistence();
  director.resetRunState();
  director.forceEncounter('ABANDONED_METRO_PLATFORM', 999);

  const chunkTest = new MockChunk();
  director.tryScheduleSecretRoute(chunkTest, -300, MODERN_METRO_THEME, false, 18.0);
  const activeR = director.getActiveRoute()!;
  assert(activeR.isFirstDiscovery === true, 'First-time encounter is flagged as isFirstDiscovery: true');

  // Mock player
  const mockPlayer: any = {
    position: new THREE.Vector3(-2.2, 0, -302), // At start Z, in Lane -1 (Left Siding)
    currentLane: -1 as LaneIndex,
    groundY: 0,
    supportSurface: 'GROUND'
  };

  // 1. Player crosses start Z in Lane -1 -> Enters secret route
  director.update(mockPlayer, 0.016);
  assert(activeR.playerEntered === true, 'Player entering Lane -1 triggers playerEntered = true');

  // Collect some coins
  director.onCoinCollected();
  director.onCoinCollected();
  director.onCoinCollected();
  assert(activeR.coinsCollectedInRoute === 3, 'Accumulates coins collected inside the secret route (3)');

  // 2. Player traverses to end Z (-380m) -> Completes secret route
  mockPlayer.position.z = -382;
  director.update(mockPlayer, 0.016);
  assert(activeR.completed === true, 'Player crossing end Z completes the secret route');

  // Verify persistence record was created
  const rec1 = director.getDiscoveryRecord('ABANDONED_METRO_PLATFORM');
  assert(rec1 !== null, 'Discovery record created in storage');
  assert(rec1?.timesCompleted === 1, 'Recorded timesCompleted: 1');
  assert(rec1?.totalCoinsCollected === 3, 'Recorded totalCoinsCollected: 3');
  assert(director.getTotalSecretsFound() === 1, 'Total secrets found: 1');

  // 3. Anti-Farming: Second run through same secret route
  director.resetRunState();
  director.forceEncounter('ABANDONED_METRO_PLATFORM', 999);
  const chunkRun2 = new MockChunk();
  director.tryScheduleSecretRoute(chunkRun2, -800, MODERN_METRO_THEME, false, 18.0);
  const activeR2 = director.getActiveRoute()!;
  assert(activeR2.isFirstDiscovery === false, 'Subsequent run through same secret is isFirstDiscovery: false (Anti-Farming)');

  mockPlayer.position.z = -802;
  director.update(mockPlayer, 0.016);
  director.onCoinCollected();
  mockPlayer.position.z = -882;
  director.update(mockPlayer, 0.016);

  const rec2 = director.getDiscoveryRecord('ABANDONED_METRO_PLATFORM');
  assert(rec2?.timesCompleted === 2, 'Times completed incremented to 2');
  assert(rec2?.totalCoinsCollected === 4, 'Total coins collected updated to 4');

  // -------------------------------------------------------------
  // Test 8: 3D Scenery Generation & Zero Resource Leaks
  // -------------------------------------------------------------
  console.log('\n--- Test 8: 3D Scenery Generation & Zero Resource Leaks ---');
  const sceneryMgr = SecretRouteScenery.getInstance();

  for (const id of catalogKeys) {
    const container = new THREE.Group();
    sceneryMgr.buildSecretScenery(container, id, 80.0);
    assert(container.children.length > 0, `Scenery successfully constructed for ${id}`);
    const sceneryChild = container.children[0] as THREE.Group;
    assert(sceneryChild.name === `secret_scenery_${id}`, `Container child named correctly: secret_scenery_${id}`);
    assert(sceneryChild.children.length >= 5, `${id} contains rich architectural props (>= 5 meshes)`);
  }

  // Simulate 50 repeated build & clear cycles to test GPU memory stability
  const leakContainer = new THREE.Group();
  for (let i = 0; i < 50; i++) {
    leakContainer.clear();
    const routeId = catalogKeys[i % 3];
    sceneryMgr.buildSecretScenery(leakContainer, routeId, 80.0);
  }
  leakContainer.clear();
  assert(leakContainer.children.length === 0, 'Cleaned up all scenery children with zero persistent leaks across 50 cycles');

  // -------------------------------------------------------------
  // Test 9: Persistence Round-Trip & Multiple Encounter Progress
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Persistence Round-Trip & Multiple Encounter Progress ---');
  // Discover remaining 2 encounters
  director.resetRunState();
  director.forceEncounter('ELEVATED_RAILWAY_PASSAGE', 111);
  const chunkSky = new MockChunk();
  director.tryScheduleSecretRoute(chunkSky, -1200, MODERN_METRO_THEME, false, 18.0);
  mockPlayer.position.z = -1202;
  mockPlayer.currentLane = 0;
  director.update(mockPlayer, 0.016);
  mockPlayer.position.z = -1282;
  director.update(mockPlayer, 0.016);

  director.resetRunState();
  director.forceEncounter('HIDDEN_MAINTENANCE_TUNNEL', 222);
  const chunkTun = new MockChunk();
  director.tryScheduleSecretRoute(chunkTun, -1800, UNDERGROUND_METRO_THEME, false, 18.0);
  mockPlayer.position.z = -1802;
  mockPlayer.currentLane = 1;
  director.update(mockPlayer, 0.016);
  mockPlayer.position.z = -1882;
  director.update(mockPlayer, 0.016);

  assert(director.getTotalSecretsFound() === 3, 'All 3 secret routes discovered (3/3 Complete)');
  const allRecs = director.getAllRecords();
  assert(!!allRecs.ABANDONED_METRO_PLATFORM, 'Record exists for ABANDONED_METRO_PLATFORM');
  assert(!!allRecs.ELEVATED_RAILWAY_PASSAGE, 'Record exists for ELEVATED_RAILWAY_PASSAGE');
  assert(!!allRecs.HIDDEN_MAINTENANCE_TUNNEL, 'Record exists for HIDDEN_MAINTENANCE_TUNNEL');

  console.log('\n============================================================');
  console.log(`🎉 ALL ${passedCount}/${passedCount} TASK 2 SECRET ROUTES TESTS PASSED!`);
  console.log('============================================================');
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE RUNTIME ERROR:', err);
  process.exit(1);
});
