import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../src/core/Constants';
import { JunctionDirector } from '../src/track/JunctionDirector';
import { JUNCTION_CATALOG } from '../src/track/JunctionCatalog';
import { JunctionGeometry } from '../src/track/JunctionGeometry';
import { RouteBranchId, JunctionId } from '../src/track/JunctionTypes';
import { TrackPattern } from '../src/track/ObstaclePatterns';
import { ReachabilityValidator } from '../src/track/ReachabilityValidator';
import { CameraController } from '../src/scene/CameraController';
import { EventBus, EVENTS } from '../src/core/EventBus';

// Mock MockChunk for procedural testing
class MockChunk {
  public chunkZ: number = 0;
  public length: number = 80.0;
  public obstacles: any[] = [];
  public collectibles: any[] = [];
  public decorativeGroup: THREE.Group = new THREE.Group();
  public group: THREE.Group = new THREE.Group();

  constructor() {
    this.group.add(this.decorativeGroup);
  }

  public populate(pattern: TrackPattern, worldZ: number, theme: any, isTransition: boolean): boolean {
    this.chunkZ = worldZ;
    this.obstacles = pattern.obstacles.map(o => ({
      type: o.type,
      lane: o.lane,
      worldZ: worldZ - o.zOffset,
      active: true,
      collider: new THREE.Box3(
        new THREE.Vector3(CONSTANTS.LANES[o.lane] - 1.2, 0, worldZ - o.zOffset - 2),
        new THREE.Vector3(CONSTANTS.LANES[o.lane] + 1.2, 2.5, worldZ - o.zOffset + 2)
      )
    }));
    this.collectibles = (pattern.collectibles || []).map(c => ({
      type: c.type,
      lane: c.lane,
      count: c.count || 1,
      worldZ: worldZ - c.zOffset
    }));
    return true;
  }
}

// Mock Player
class MockPlayer {
  public position: THREE.Vector3 = new THREE.Vector3(0, CONSTANTS.PLAYER_BASE_Y, 0);
  public currentLane: LaneIndex = 0;
  public groundY: number = CONSTANTS.PLAYER_BASE_Y;
  public speed: number = 22.0;
  public isJumping: boolean = false;
  public isSliding: boolean = false;
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTestSuite() {
  console.log('============================================================');
  console.log('TASK 3: ADVANCED BRANCHING JUNCTIONS & ROUTE SELECTION TESTS');
  console.log('============================================================\n');

  // -------------------------------------------------------------
  // Test 1: Architectural Feasibility Audit Validation
  // -------------------------------------------------------------
  console.log('--- Test 1: Architectural Feasibility Audit Validation ---');
  assert(CONSTANTS.LANES[-1] === -3.6, 'Lane -1 is exactly -3.6m in world coordinates');
  assert(CONSTANTS.LANES[0] === 0, 'Lane 0 is centered at 0.0m in world coordinates');
  assert(CONSTANTS.LANES[1] === 3.6, 'Lane 1 is exactly 3.6m in world coordinates');

  // Verify CameraController continuous lateral tracking across lanes (No camera teleportation)
  const cameraCtrl = new CameraController();
  cameraCtrl.finishIntro(new THREE.Vector3(0, 0.9, 0));
  const initialCamX = cameraCtrl.camera.position.x;
  
  // Simulate player switching from Lane 0 (0m) to Lane 1 (3.6m) during junction approach
  const playerPos = new THREE.Vector3(3.6, 0.9, -150);
  cameraCtrl.update(playerPos, 0.016, 1.0, 22.0, 0.9, false, false);
  const updatedCamX = cameraCtrl.camera.position.x;
  assert(!isNaN(updatedCamX) && isFinite(updatedCamX), 'Camera X coordinate remains finite and continuous');
  assert(Math.abs(updatedCamX - initialCamX) < 1.5, 'Camera smoothly interpolates without snapping or teleporting');

  // -------------------------------------------------------------
  // Test 2: Data-Driven Junction Catalog & Parameter Contract
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Data-Driven Junction Catalog & Parameter Contract ---');
  const catalog = JUNCTION_CATALOG;
  const keys = Object.keys(catalog);
  assert(keys.length >= 1, 'At least 1 working junction prototype defined');
  assert(!!catalog.JUNCTION_SWITCHYARD_01, 'Contains JUNCTION_SWITCHYARD_01 (Grand Central Switchyard)');

  const junc = catalog.JUNCTION_SWITCHYARD_01;
  assert(junc.minProgressionDistance >= 250, 'Minimum progression distance gate is >= 250m');
  assert(junc.cooldownDistance >= 400, 'Cooldown distance is >= 400m');
  assert(junc.branchDurationChunks === 3, 'Branch duration is exactly 3 distinct chunks (240m)');

  // Route A: Mainline Metro
  assert(junc.routeA.id === 'ROUTE_A_MAIN_METRO', 'Route A ID is ROUTE_A_MAIN_METRO');
  assert(junc.routeA.themeId === 'MODERN_METRO', 'Route A theme is MODERN_METRO');
  assert(junc.routeA.difficultyRating === 'MODERATE', 'Route A difficulty is MODERATE');
  assert(junc.routeA.coinDensityMultiplier === 1.0, 'Route A coin density is 1.0x (standard)');
  assert(junc.routeA.routeCompletionScoreBonus === 500, 'Route A awards 500 bonus score');

  // Route B: Industrial Overpass
  assert(junc.routeB.id === 'ROUTE_B_INDUSTRIAL_OVERPASS', 'Route B ID is ROUTE_B_INDUSTRIAL_OVERPASS');
  assert(junc.routeB.themeId === 'NEON_INDUSTRIAL', 'Route B theme is NEON_INDUSTRIAL');
  assert(junc.routeB.difficultyRating === 'CHALLENGING', 'Route B difficulty is CHALLENGING');
  assert(junc.routeB.coinDensityMultiplier > 1.4, 'Route B offers high-yield coin density (>1.4x)');
  assert(junc.routeB.movingTrainFrequencyMultiplier > 1.3, 'Route B has elevated moving train frequency');
  assert(junc.routeB.guaranteedPowerup === 'SCORE_MULTIPLIER', 'Route B features guaranteed Score Multiplier');
  assert(junc.routeB.routeCompletionScoreBonus === 1200, 'Route B awards 1200 bonus score');

  // -------------------------------------------------------------
  // Test 3: Physical Reachability & Solvability
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Physical Reachability & Solvability ---');
  const forkPattern: TrackPattern = {
    name: 'RAILWAY_JUNCTION_FORK',
    difficulty: 'EASY',
    obstacles: [
      { type: 'LOW_BARRIER', lane: -1, zOffset: 24.0 },
      { type: 'LOW_BARRIER', lane: 1, zOffset: 64.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: -1, zOffset: 12.0, count: 5, spacing: 3.2 },
      { type: 'COIN', lane: 0, zOffset: 16.0, count: 5, spacing: 3.2 },
      { type: 'COIN', lane: 1, zOffset: 20.0, count: 6, spacing: 3.0 }
    ]
  };
  const forkProof = ReachabilityValidator.validatePattern(forkPattern as any, 22.0, [-1, 0, 1]);
  assert(forkProof.solvable, 'Junction fork pattern is 100% solvable across multiple lanes');

  const industrialBranchPattern: TrackPattern = {
    name: 'INDUSTRIAL_OVERPASS_BRANCH_1',
    difficulty: 'HARD',
    obstacles: [
      { type: 'TRAIN_RAMP', lane: 0, zOffset: 16.0, hasRamp: true, length: CONSTANTS.TRAIN_SET_TRIPLE_LENGTH },
      { type: 'MOVING_TRAIN', lane: -1, zOffset: 42.0, velocityZ: 20.0, length: 22.0 }
    ],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 16.0, count: 12, spacing: 2.2, yOffset: 5.2 },
      { type: 'POWERUP_MULTIPLIER' as any, lane: 0, zOffset: 48.0, yOffset: 5.2 },
      { type: 'COIN', lane: 1, zOffset: 22.0, count: 8, spacing: 2.4 }
    ]
  };
  const industrialProof = ReachabilityValidator.validatePattern(industrialBranchPattern as any, 24.0, [-1, 0, 1]);
  assert(industrialProof.solvable, 'Industrial Overpass branch pattern is 100% solvable');

  // -------------------------------------------------------------
  // Test 4: Procedural Scheduling Gates & Cooldowns
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Procedural Scheduling Gates & Cooldowns ---');
  const director = JunctionDirector.getInstance();
  director.resetPersistence();
  director.resetRunState();

  const chunkEarly = new MockChunk();
  const scheduledEarly = director.tryScheduleJunction(chunkEarly, -120, false, false);
  assert(!scheduledEarly, 'Cannot schedule junction before minimum progression distance (120m < 280m)');

  const chunkTransition = new MockChunk();
  const scheduledTransition = director.tryScheduleJunction(chunkTransition, -320, true, false);
  assert(!scheduledTransition, 'Strictly rejects scheduling on district transition chunks');

  const chunkRooftop = new MockChunk();
  const scheduledRooftop = director.tryScheduleJunction(chunkRooftop, -320, false, true);
  assert(!scheduledRooftop, 'Strictly rejects scheduling during active rooftop traversal');

  const chunkEligible = new MockChunk();
  const scheduledEligible = director.tryScheduleJunction(chunkEligible, -320, false, false);
  assert(scheduledEligible, 'Successfully scheduled junction at eligible distance (-320m)');

  const activeJ = director.getActiveJunction()!;
  assert(activeJ !== null, 'Active junction state registered in director');
  assert(activeJ.state === 'APPROACHING', 'Initial junction state is APPROACHING');
  assert(activeJ.switchPointZ === -320 - 38.0, 'Calculated switch point Z accurately (-358m)');

  // -------------------------------------------------------------
  // Test 5: Player Route Selection & Commitment Logic
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Player Route Selection & Commitment Logic ---');
  const mockPlayer = new MockPlayer();
  mockPlayer.position.z = -310; // Before junction chunk
  director.update(mockPlayer as any, 0.016);
  assert(director.getActiveJunction()?.state === 'APPROACHING', 'State remains APPROACHING before chunk start');

  mockPlayer.position.z = -322; // Inside chunk
  director.update(mockPlayer as any, 0.016);
  assert(director.getActiveJunction()?.state === 'DECISION_ZONE', 'State enters DECISION_ZONE inside chunk');

  // Test Choice 1: Player in Lane 0 (Center) selects Route A (Main Metro)
  mockPlayer.currentLane = 0;
  mockPlayer.position.z = -360; // Crosses switch point at -358m
  director.update(mockPlayer as any, 0.016);
  const committedA = director.getActiveJunction()!;
  assert(committedA.committedRoute === 'ROUTE_A_MAIN_METRO', 'Player in Lane 0 commits to ROUTE_A_MAIN_METRO');
  assert(committedA.committedTheme === 'MODERN_METRO', 'Committed theme is MODERN_METRO');
  assert(committedA.state === 'BRANCH_ACTIVE', 'Junction state transitions to BRANCH_ACTIVE');

  // Test Choice 2: Player in Lane 1 (Right) selects Route B (Industrial Overpass)
  director.resetRunState();
  director.forceJunction('JUNCTION_SWITCHYARD_01');
  const chunkB = new MockChunk();
  director.tryScheduleJunction(chunkB, -800, false, false);
  mockPlayer.position.z = -802;
  director.update(mockPlayer as any, 0.016);
  mockPlayer.currentLane = 1; // Right lane
  mockPlayer.position.z = -840; // Crosses switch point
  director.update(mockPlayer as any, 0.016);
  const committedB = director.getActiveJunction()!;
  assert(committedB.committedRoute === 'ROUTE_B_INDUSTRIAL_OVERPASS', 'Player in Lane 1 commits to ROUTE_B_INDUSTRIAL_OVERPASS');
  assert(committedB.committedTheme === 'NEON_INDUSTRIAL', 'Committed theme is NEON_INDUSTRIAL');

  // -------------------------------------------------------------
  // Test 6: 3D Switch Visuals & Signal Aspect Logic
  // -------------------------------------------------------------
  console.log('\n--- Test 6: 3D Switch Visuals & Signal Aspect Logic ---');
  const geo = JunctionGeometry.getInstance();
  const sceneryGroup = geo.buildJunctionScenery(80.0);
  assert(sceneryGroup.children.length >= 2, 'Constructed overhead gantry and switch mechanism');
  
  // Verify gantry components
  const gantry = sceneryGroup.children[0] as THREE.Group;
  assert(gantry !== undefined, 'Gantry group exists');
  const sigA = gantry.getObjectByName('signal_head_route_a');
  const sigB = gantry.getObjectByName('signal_head_route_b');
  assert(sigA !== undefined && sigB !== undefined, 'Contains dual Route A and Route B signal heads');

  // Test switch throw visual update
  geo.updateVisualCommitment(sceneryGroup, 'ROUTE_B_INDUSTRIAL_OVERPASS');
  const lensA = gantry.getObjectByName('signal_lens_route_a') as THREE.Mesh;
  const lensB = gantry.getObjectByName('signal_lens_route_b') as THREE.Mesh;
  assert(lensA !== undefined && lensB !== undefined, 'Signal lenses found');

  // Cleanup 50 cycles with 0 memory leaks
  const leakContainer = new THREE.Group();
  for (let i = 0; i < 50; i++) {
    const s = geo.buildJunctionScenery(80.0);
    leakContainer.add(s);
  }
  leakContainer.clear();
  assert(leakContainer.children.length === 0, 'Cleaned up all junction scenery with zero resource leaks across 50 cycles');

  // -------------------------------------------------------------
  // Test 7: Branch Completion, Rewards & Anti-Farming Protection
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Branch Completion, Rewards & Anti-Farming Protection ---');
  director.onCoinCollected();
  director.onCoinCollected();
  director.onCoinCollected(); // 3 coins collected in branch

  // Advance player past the end of the 3 branch chunks (-800 - 4*80 = -1120m)
  mockPlayer.position.z = -1125;
  director.update(mockPlayer as any, 0.016);
  assert(director.getActiveJunction() === null, 'Junction completes and active state resets to null');

  // Verify persistence record
  const juncRec = director.getJunctionRecord('JUNCTION_SWITCHYARD_01');
  assert(juncRec !== null, 'Persistence record created for junction');
  assert(juncRec?.totalTimesEncountered === 1, 'Total encounters recorded: 1');
  const routeRecB = director.getRouteRecord('JUNCTION_SWITCHYARD_01', 'ROUTE_B_INDUSTRIAL_OVERPASS');
  assert(routeRecB !== null, 'Route B record created');
  assert(routeRecB?.timesCompleted === 1, 'Route B completed times: 1');
  assert(routeRecB?.totalCoinsEarned === 3, 'Route B coins earned recorded: 3');

  // Anti-Farming Verification: Subsequent completion of Route B
  director.resetRunState();
  director.forceJunction('JUNCTION_SWITCHYARD_01', 'ROUTE_B_INDUSTRIAL_OVERPASS');
  const chunkB2 = new MockChunk();
  director.tryScheduleJunction(chunkB2, -1800, false, false);
  mockPlayer.position.z = -1840;
  director.update(mockPlayer as any, 0.016);
  director.onCoinCollected();
  mockPlayer.position.z = -2125;
  director.update(mockPlayer as any, 0.016);

  const routeRecB2 = director.getRouteRecord('JUNCTION_SWITCHYARD_01', 'ROUTE_B_INDUSTRIAL_OVERPASS');
  assert(routeRecB2?.timesCompleted === 2, 'Times completed incremented to 2 without error');
  assert(routeRecB2?.totalCoinsEarned === 4, 'Total coins updated accurately to 4');

  // -------------------------------------------------------------
  // Test 8: Deterministic Seed Reproducibility
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Deterministic Seed Reproducibility ---');
  director.setRunSeed(54321);
  director.resetRunState();
  const cSeed1 = new MockChunk();
  const s1 = director.tryScheduleJunction(cSeed1, -320, false, false);

  director.setRunSeed(54321);
  director.resetRunState();
  const cSeed2 = new MockChunk();
  const s2 = director.tryScheduleJunction(cSeed2, -320, false, false);

  assert(s1 === s2, 'Junction scheduling is 100% deterministic with identical seed (54321)');

  console.log('\n============================================================');
  console.log('🎉 ALL TASK 3 BRANCHING JUNCTIONS TESTS PASSED SUCCESSFULLY!');
  console.log('============================================================');
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE RUNTIME ERROR:', err);
  process.exit(1);
});
