import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { TrackChunk } from '../src/track/TrackChunk';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { CoinPatternLibrary } from '../src/track/CoinPatternLibrary';
import { AerialCoinManager } from '../src/track/AerialCoinManager';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { OBSTACLE_PATTERNS, TrackPattern } from '../src/track/ObstaclePatterns';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

// Mock localStorage for Node environment
if (typeof (global as any).localStorage === 'undefined') {
  const store = new Map<string, string>();
  (global as any).localStorage = {
    getItem: (k: string) => store.get(k) || null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear()
  };
}

console.log('=======================================================');
console.log('🧪 TASK 2: JUMP COIN ARCS & TUNNEL-AWARE JETPACK SUITE');
console.log('=======================================================');

// Setup mock audio/canvas environment if needed
const scene = new THREE.Scene();
const obstacleFactory = new ObstacleFactory();
const collectibleFactory = new CollectibleFactory();
const eventBus = EventBus.getInstance();

// -------------------------------------------------------------
// Test 1: Normal Hurdle Jump Coin Arc - Low Speed (18 m/s)
// -------------------------------------------------------------
console.log('\n--- Test 1: Normal Hurdle Jump Arc (18 m/s, 100% Collection) ---');
{
  const speed = 18.0;
  const hurdleZ = 28.0;
  const arcDef = CoinPatternLibrary.createPhysicalJumpArc({
    speed,
    hurdleZ,
    lane: 0,
    supportSurface: 'GROUND',
    landingSurface: 'GROUND'
  });

  const testPattern: TrackPattern = {
    name: 'TEST_HURDLE_JUMP_LOW_SPEED',
    difficulty: 'EASY',
    entryLanes: [0],
    exitLanes: [0],
    minReactionDist: 15.0,
    obstacles: [{ type: 'LOW_BARRIER', lane: 0, zOffset: hurdleZ }],
    collectibles: [arcDef]
  };

  const chunk = new TrackChunk(obstacleFactory, collectibleFactory);
  chunk.populate(testPattern, 0);

  const arcCoins = chunk.collectibles.filter(c => c.active && c.lane === 0);
  assert(arcCoins.length === 5, `Spawned all 5 intended jump arc coins (got ${arcCoins.length})`);

  // Verify physical trajectory values
  const coin0 = arcCoins[0];
  const apexCoin = arcCoins[2]; // Middle coin at apex
  const coin4 = arcCoins[4];

  assert(Math.abs(coin0.baseY - 0.85) < 0.05, `Takeoff coin is at ground running height: ${coin0.baseY.toFixed(2)}m (expected 0.85m)`);
  assert(Math.abs(apexCoin.baseY - CONSTANTS.COIN_JUMP_PEAK_Y) < 0.05, `Apex coin is at true physical jump peak: ${apexCoin.baseY.toFixed(2)}m (expected ${CONSTANTS.COIN_JUMP_PEAK_Y}m)`);
  assert(Math.abs(coin4.baseY - 0.85) < 0.05, `Landing coin returns to ground level: ${coin4.baseY.toFixed(2)}m (expected 0.85m)`);

  // Simulate deterministic player jump
  const player = new Player(scene);
  player.speed = speed;
  player.state = 'RUNNING';
  const timeToApex = CONSTANTS.JUMP_INITIAL_VELOCITY / CONSTANTS.GRAVITY; // 15 / 50 = 0.30s
  const takeoffZ = hurdleZ - speed * timeToApex; // 28 - 5.4 = 22.6m
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -(takeoffZ - 1.0)); // start 1m before takeoff
  player.updateCollider();

  let coinsCollected = 0;
  const unsubscribe = eventBus.on(EVENTS.COIN_COLLECTED, () => {
    coinsCollected++;
  });

  const trackManager = new TrackManager(scene);
  // Inject our chunk into trackManager
  trackManager.getChunks()[0] = chunk;
  chunk.chunkZ = 0;

  // Step simulation frame by frame
  const dt = 0.016;
  let jumped = false;
  for (let step = 0; step < 75; step++) {
    const currentDistZ = -player.position.z;
    if (!jumped && currentDistZ >= takeoffZ) {
      player.jump();
      jumped = true;
    }

    player.update(dt);
    chunk.update(dt, step * dt, player.position.z);
    (trackManager as any).checkCollisions(player, dt);
  }

  unsubscribe();
  assert(coinsCollected === 5, `100% Collection rate on optimal normal jump at 18 m/s: collected ${coinsCollected}/5 coins`);
}

// -------------------------------------------------------------
// Test 2: Normal Hurdle Jump Coin Arc - High Speed (35 m/s)
// -------------------------------------------------------------
console.log('\n--- Test 2: Normal Hurdle Jump Arc (35 m/s, 100% Collection) ---');
{
  const speed = 35.0;
  const hurdleZ = 45.0;
  const arcDef = CoinPatternLibrary.createPhysicalJumpArc({
    speed,
    hurdleZ,
    lane: 0,
    supportSurface: 'GROUND',
    landingSurface: 'GROUND'
  });

  const testPattern: TrackPattern = {
    name: 'TEST_HURDLE_JUMP_HIGH_SPEED',
    difficulty: 'HARD',
    entryLanes: [0],
    exitLanes: [0],
    minReactionDist: 20.0,
    obstacles: [{ type: 'LOW_BARRIER', lane: 0, zOffset: hurdleZ }],
    collectibles: [arcDef]
  };

  const chunk = new TrackChunk(obstacleFactory, collectibleFactory);
  chunk.populate(testPattern, 0);

  const player = new Player(scene);
  player.speed = speed;
  player.state = 'RUNNING';
  const timeToApex = CONSTANTS.JUMP_INITIAL_VELOCITY / CONSTANTS.GRAVITY; // 0.30s
  const takeoffZ = hurdleZ - speed * timeToApex; // 45 - 35 * 0.3 = 34.5m
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -(takeoffZ - 2.0));
  player.updateCollider();

  let coinsCollected = 0;
  const unsubscribe = eventBus.on(EVENTS.COIN_COLLECTED, () => {
    coinsCollected++;
  });

  const trackManager = new TrackManager(scene);
  trackManager.getChunks()[0] = chunk;
  chunk.chunkZ = 0;

  const dt = 0.016;
  let jumped = false;
  for (let step = 0; step < 75; step++) {
    const currentDistZ = -player.position.z;
    if (!jumped && currentDistZ >= takeoffZ) {
      player.jump();
      jumped = true;
    }

    player.update(dt);
    chunk.update(dt, step * dt, player.position.z);
    (trackManager as any).checkCollisions(player, dt);
  }

  unsubscribe();
  assert(coinsCollected === 5, `100% Collection rate on optimal normal jump at 35 m/s: collected ${coinsCollected}/5 coins`);
}

// -------------------------------------------------------------
// Test 3: Super Sneakers Ballistic Jump Arc
// -------------------------------------------------------------
console.log('\n--- Test 3: Super Sneakers Ballistic Jump Arc ---');
{
  const speed = 20.0;
  const hurdleZ = 35.0;
  const sneakersArc = CoinPatternLibrary.createPhysicalJumpArc({
    speed,
    hurdleZ,
    lane: 0,
    jumpType: 'SUPER_SNEAKERS'
  });

  assert(sneakersArc.isSuperJump === true, 'Arc tagged as Super Jump');
  assert(sneakersArc.yOffset > 4.5, `Super sneakers apex reflects amplified jump height: ${sneakersArc.yOffset}m (expected > 4.5m)`);

  const testPattern: TrackPattern = {
    name: 'TEST_SNEAKERS_JUMP',
    difficulty: 'MEDIUM',
    entryLanes: [0],
    exitLanes: [0],
    minReactionDist: 20.0,
    obstacles: [{ type: 'HIGH_BARRIER', lane: 0, zOffset: hurdleZ }],
    collectibles: [sneakersArc]
  };

  const chunk = new TrackChunk(obstacleFactory, collectibleFactory);
  chunk.populate(testPattern, 0);

  const player = new Player(scene);
  player.speed = speed;
  player.state = 'RUNNING';
  player.powerups.activate('SNEAKERS');
  assert(player.powerups.isSuperSneakersActive(), 'Super Sneakers active on player');

  const v0 = CONSTANTS.JUMP_INITIAL_VELOCITY * CONSTANTS.SUPER_JUMP_MULTIPLIER;
  const timeToApex = v0 / CONSTANTS.GRAVITY;
  const takeoffZ = hurdleZ - speed * timeToApex;
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -(takeoffZ - 1.5));
  player.updateCollider();

  let coinsCollected = 0;
  const unsubscribe = eventBus.on(EVENTS.COIN_COLLECTED, () => {
    coinsCollected++;
  });

  const trackManager = new TrackManager(scene);
  trackManager.getChunks()[0] = chunk;
  chunk.chunkZ = 0;

  const dt = 0.016;
  let jumped = false;
  for (let step = 0; step < 85; step++) {
    const currentDistZ = -player.position.z;
    if (!jumped && currentDistZ >= takeoffZ) {
      player.jump();
      jumped = true;
    }

    player.update(dt);
    chunk.update(dt, step * dt, player.position.z);
    (trackManager as any).checkCollisions(player, dt);
  }

  unsubscribe();
  assert(coinsCollected === sneakersArc.count, `100% Super Sneakers arc coins collected: ${coinsCollected}/${sneakersArc.count}`);
}

// -------------------------------------------------------------
// Test 4: Train Rooftop Jump Arc
// -------------------------------------------------------------
console.log('\n--- Test 4: Train Rooftop Jump Arc ---');
{
  const rooftopArc = CoinPatternLibrary.createRooftopJumpArc(0, 25.0, 4, 2.0);
  assert(rooftopArc.supportSurface === 'TRAIN_ROOF', 'Support surface correctly set to TRAIN_ROOF');
  assert(rooftopArc.startYOffset === CONSTANTS.COIN_ROOFTOP_Y, `Takeoff height matches roof deck: ${rooftopArc.startYOffset}m`);
  assert(rooftopArc.yOffset === CONSTANTS.COIN_ROOFTOP_Y + CONSTANTS.JUMP_HEIGHT, `Apex height is ${rooftopArc.yOffset}m (5.20 + 2.25 = 7.45m)`);

  const chunk = new TrackChunk(obstacleFactory, collectibleFactory);
  chunk.populate({
    name: 'TEST_ROOFTOP_JUMP',
    difficulty: 'MEDIUM',
    entryLanes: [0],
    exitLanes: [0],
    minReactionDist: 15.0,
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 10.0, length: 30.0 }],
    collectibles: [rooftopArc]
  }, 0);

  const rooftopCoins = chunk.collectibles.filter(c => c.active && c.baseY >= 5.0);
  assert(rooftopCoins.length === 4, `All 4 rooftop jump coins spawned (got ${rooftopCoins.length})`);
  assert(rooftopCoins[0].baseY >= 5.15, `First rooftop coin is at torso level above roof: ${rooftopCoins[0].baseY.toFixed(2)}m`);
  assert(rooftopCoins[2].baseY > 6.8, `Apex rooftop coin rises gracefully above roof hurdle: ${rooftopCoins[2].baseY.toFixed(2)}m`);
}

// -------------------------------------------------------------
// Test 5: Rooftop-to-Ground Ballistic Descent
// -------------------------------------------------------------
console.log('\n--- Test 5: Rooftop-to-Ground Ballistic Descent ---');
{
  const descentArc = CoinPatternLibrary.createRooftopToGroundArc(0, 30.0, 5, 2.2);
  assert(descentArc.supportSurface === 'TRAIN_ROOF', 'Takeoff support is TRAIN_ROOF');
  assert(descentArc.landingSurface === 'GROUND', 'Landing support is GROUND');

  const chunk = new TrackChunk(obstacleFactory, collectibleFactory);
  chunk.populate({
    name: 'TEST_ROOFTOP_TO_GROUND',
    difficulty: 'MEDIUM',
    entryLanes: [0],
    exitLanes: [0],
    minReactionDist: 15.0,
    obstacles: [],
    collectibles: [descentArc]
  }, 0);

  const descentCoins = chunk.collectibles.filter(c => c.active && c.type === 'COIN');
  assert(descentCoins.length === 5, `Spawned all 5 descent coins (got ${descentCoins.length})`);
  assert(descentCoins[0].baseY > 4.5, `First coin starts at rooftop level: ${descentCoins[0].baseY.toFixed(2)}m`);
  assert(descentCoins[4].baseY <= 1.0, `Final coin lands at ground level: ${descentCoins[4].baseY.toFixed(2)}m`);
}

// -------------------------------------------------------------
// Test 6: Jump During Lateral Lane Transition (3D Swept Volume)
// -------------------------------------------------------------
console.log('\n--- Test 6: Jump During Lateral Lane Transition ---');
{
  const chunk = new TrackChunk(obstacleFactory, collectibleFactory);
  // Diagonal coin placed at x = -1.8 (between lane -1 and lane 0), y = 2.5 (mid-jump)
  chunk.populate({
    name: 'TEST_DIAGONAL_JUMP',
    difficulty: 'MEDIUM',
    entryLanes: [-1],
    exitLanes: [0],
    minReactionDist: 15.0,
    obstacles: [],
    collectibles: [
      { type: 'COIN', lane: 0, zOffset: 20.0, yOffset: 2.5, count: 1 }
    ]
  }, 0);

  const targetCoin = chunk.collectibles[0];
  // Reposition slightly between lanes for diagonal test
  targetCoin.group.position.x = -1.8;
  targetCoin.collider.setFromCenterAndSize(
    new THREE.Vector3(-1.8, 2.5, -20.0),
    new THREE.Vector3(0.9, 0.9, 0.9)
  );

  const player = new Player(scene);
  player.speed = 20.0;
  player.state = 'RUNNING';
  player.position.set(-3.6, CONSTANTS.PLAYER_BASE_Y, -18.0);
  player.updateCollider();

  const trackManager = new TrackManager(scene);
  trackManager.getChunks()[0] = chunk;
  chunk.chunkZ = 0;

  // Jump and switch lane simultaneously
  player.jump();
  player.changeLane(1); // shift towards lane 0

  let collected = false;
  const unsubscribe = eventBus.on(EVENTS.COIN_COLLECTED, () => {
    collected = true;
  });

  const dt = 0.016;
  for (let i = 0; i < 20; i++) {
    player.update(dt);
    chunk.update(dt, i * dt, player.position.z);
    (trackManager as any).checkCollisions(player, dt);
    if (collected) break;
  }

  unsubscribe();
  assert(collected === true, 'Successfully collected coin diagonally during concurrent jump and lane shift');
}

// -------------------------------------------------------------
// Test 7: Jetpack Takeoff, Cruise, and Descent Route Continuity
// -------------------------------------------------------------
console.log('\n--- Test 7: Jetpack Flight Corridor Alignment ---');
{
  const player = new Player(scene);
  player.speed = 20.0;
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -50.0);
  player.updateCollider();
  player.powerups.activate('JETPACK');
  player.state = 'JETPACK';

  const aerialManager = new AerialCoinManager(scene, collectibleFactory);
  aerialManager.onJetpackActivated(player);

  assert(aerialManager.isJetpackFlightActive() === true, 'Jetpack flight activated in AerialCoinManager');
  assert(aerialManager.getTakeoffEndZ() < -50.0, 'Takeoff end Z is ahead of start Z');
  assert(aerialManager.getLandingZ() < aerialManager.getDescentStartZ(), 'Landing Z follows descent start Z');

  // Step aerial manager to spawn coins
  const dt = 0.016;
  aerialManager.update(player, dt, 0, false, 0);

  const activeAerialCoins = aerialManager.getPool().filter(c => c.active);
  assert(activeAerialCoins.length > 20, `Spawned continuous aerial coin corridor: ${activeAerialCoins.length} coins`);

  // Verify takeoff ascent curve
  const takeoffCoins = activeAerialCoins.filter(c => c.worldPos.z > aerialManager.getTakeoffEndZ());
  if (takeoffCoins.length >= 2) {
    const early = takeoffCoins[0]; // closest to start (highest Z, earliest takeoff)
    const late = takeoffCoins[takeoffCoins.length - 1]; // near cruise (lowest Z, latest takeoff)
    assert(late.worldPos.y > early.worldPos.y, `Takeoff coins ascend smoothly (${early.worldPos.y.toFixed(2)}m -> ${late.worldPos.y.toFixed(2)}m)`);
  }

  // Verify cruise altitude matches JETPACK_ALTITUDE (9.0m)
  const cruiseCoins = activeAerialCoins.filter(c => c.worldPos.z <= aerialManager.getTakeoffEndZ() && c.worldPos.z >= aerialManager.getDescentStartZ());
  assert(cruiseCoins.length > 0, `Cruise coins generated along high-altitude ribbon: ${cruiseCoins.length} coins`);
  const cruiseCoin = cruiseCoins[0];
  assert(Math.abs(cruiseCoin.baseY - CONSTANTS.JETPACK_ALTITUDE) < 0.1, `Cruise coin baseY matches JETPACK_ALTITUDE: ${cruiseCoin.baseY}m (expected ${CONSTANTS.JETPACK_ALTITUDE}m)`);
}

// -------------------------------------------------------------
// Test 8: Jetpack Flight Corridor Above / Through Compatible Tunnel
// -------------------------------------------------------------
console.log('\n--- Test 8: High-Clearance Aerial Corridor Tunnel Geometry ---');
{
  // Test SceneryFactory high-clearance aerial corridor vs normal underground tunnel
  const standardTunnel = new THREE.Group();
  const aerialCorridorTunnel = new THREE.Group();
  const theme = { id: 'UNDERGROUND_METRO' } as any;

  SceneryFactory.getInstance().buildScenery(standardTunnel, theme, 0, false, true, 'NONE', 'FULL', 1337, null, null, false);
  SceneryFactory.getInstance().buildScenery(aerialCorridorTunnel, theme, 0, false, true, 'NONE', 'FULL', 1337, null, null, true);

  // Measure bounding box heights of both tunnel structures
  const standardBox = new THREE.Box3().setFromObject(standardTunnel);
  const aerialBox = new THREE.Box3().setFromObject(aerialCorridorTunnel);

  const standardHeight = standardBox.max.y;
  const aerialHeight = aerialBox.max.y;

  assert(aerialHeight > standardHeight, `Aerial corridor tunnel is substantially taller: ${aerialHeight.toFixed(2)}m vs standard ${standardHeight.toFixed(2)}m`);
  assert(aerialHeight >= CONSTANTS.TUNNEL_AERIAL_VAULT_HEIGHT, `Aerial vault height meets or exceeds TUNNEL_AERIAL_VAULT_HEIGHT (12.5m): ${aerialHeight.toFixed(2)}m`);

  // Clearance verification:
  // Player cruise altitude: 9.0m
  // Overhead clearance above player: 12.5m - 9.0m = 3.5m clearance
  // Camera height: ~11.4m
  // Overhead clearance above camera: 12.5m - 11.4m = 1.1m clearance
  const playerClearance = aerialHeight - CONSTANTS.JETPACK_ALTITUDE;
  const cameraClearance = aerialHeight - 11.4;
  assert(playerClearance >= 3.0, `Overhead clearance above flying runner is generous: ${playerClearance.toFixed(2)}m (>= 3.0m)`);
  assert(cameraClearance >= 0.8, `Overhead clearance above elevated third-person camera prevents clipping: ${cameraClearance.toFixed(2)}m (>= 0.8m)`);
}

// -------------------------------------------------------------
// Test 9: Jetpack Activation Inside Enclosed Low Tunnel (Deferred Takeoff)
// -------------------------------------------------------------
console.log('\n--- Test 9: Jetpack Activation Inside Low Tunnel (Deferred Takeoff) ---');
{
  const player = new Player(scene);
  player.speed = 18.0;
  player.state = 'RUNNING';
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -30.0);
  player.updateCollider();

  // Enclosed in low tunnel
  player.setTunnelEnclosed(true);
  assert(player.isTakeoffDeferred() === false, 'Takeoff not deferred before jetpack active');

  // Collect jetpack powerup inside tunnel
  player.powerups.activate('JETPACK');
  player.update(0.016);

  assert(player.isTakeoffDeferred() === true, 'Takeoff deferred safely because tunnel ceiling is low');
  assert(player.position.y === CONSTANTS.PLAYER_BASE_Y, `Player remains grounded without clipping into ceiling: ${player.position.y}m`);
  assert(player.powerups.isJetpackTimerPaused() === true, 'Jetpack duration timer paused during deferred phase');

  // Player reaches tunnel exit portal
  player.setTunnelEnclosed(false);
  assert(player.isTakeoffDeferred() === false, 'Takeoff deferred flag cleared upon exiting tunnel portal');
  assert(player.powerups.isJetpackTimerPaused() === false, 'Jetpack duration timer unpaused');

  // Next frame launches vertical climb into open sky
  player.update(0.016);
  assert(player.position.y > CONSTANTS.PLAYER_BASE_Y, `Player successfully initiates vertical takeoff: ${player.position.y.toFixed(2)}m`);
}

// -------------------------------------------------------------
// Test 10: Safe Route Scheduling During Flight
// -------------------------------------------------------------
console.log('\n--- Test 10: Safe Route Scheduling Postpones Low Tunnels During Active Flight ---');
{
  const trackManager = new TrackManager(scene);
  const player = new Player(scene);
  player.speed = 20.0;
  player.powerups.activate('JETPACK');
  trackManager.update(player, 0.016);

  assert(trackManager.aerialCoinManager.isJetpackFlightActive() === true, 'Flight active in TrackManager');

  // Query next procedural pattern while flying
  const selectedPattern = (trackManager as any).selectPattern(5, 20.0, 500.0);
  const hasLowTunnelArch = selectedPattern.obstacles.some((o: any) => o.type === 'TUNNEL_ARCH');
  assert(selectedPattern.isTunnel !== true && !hasLowTunnelArch, `Procedural generation postponed low tunnel pattern while flying (selected: ${selectedPattern.name})`);
}

// -------------------------------------------------------------
// Test 11: Flight Route Recalculation Stability (Fix Phase H)
// -------------------------------------------------------------
console.log('\n--- Test 11: Flight Route Scheduling Invariance During Steady Cruise ---');
{
  const player = new Player(scene);
  player.speed = 20.0;
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -100.0);
  player.powerups.activate('JETPACK');
  player.state = 'JETPACK';

  const aerialManager = new AerialCoinManager(scene, collectibleFactory);
  aerialManager.onJetpackActivated(player);

  const initialLandingZ = aerialManager.getLandingZ();
  const initialDescentZ = aerialManager.getDescentStartZ();

  // Simulate 30 steady cruise frames
  player.setJetpackPhase('CRUISE');
  for (let frame = 0; frame < 30; frame++) {
    player.position.z -= player.speed * 0.016;
    player.powerups.update(0.016);
    aerialManager.update(player, 0.016, frame * 0.016, false, 0);
  }

  const landingZAfterCruise = aerialManager.getLandingZ();
  const descentZAfterCruise = aerialManager.getDescentStartZ();

  assert(initialLandingZ === landingZAfterCruise, `Landing Z remains invariant and stable during steady cruise (${initialLandingZ.toFixed(2)}m === ${landingZAfterCruise.toFixed(2)}m)`);
  assert(initialDescentZ === descentZAfterCruise, `Descent Z remains invariant and stable during steady cruise (${initialDescentZ.toFixed(2)}m === ${descentZAfterCruise.toFixed(2)}m)`);
}

// -------------------------------------------------------------
// Test 12: Collectible Material and Emissive Contrast Under Dark Tunnel
// -------------------------------------------------------------
console.log('\n--- Test 12: Collectible Material Aesthetics & Silhouette ---');
{
  const coinGroup = collectibleFactory.createCoin();
  let foundGold = false;
  let foundRim = false;

  coinGroup.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      if (child.material.metalness >= 0.85) {
        foundGold = true;
        assert(child.material.roughness <= 0.25, `Gold material has smooth specular roughness: ${child.material.roughness}`);
        assert(child.material.emissiveIntensity >= 0.15 && child.material.emissiveIntensity <= 0.35, `Emissive intensity provides contrast without blinding glow: ${child.material.emissiveIntensity}`);
      }
    }
  });

  assert(foundGold, 'Verified high-shine metallic coin material properties for dark and light environment contrast');
}

console.log('\n=======================================================');
console.log('🏆 ALL 12 / 12 TASK 2 DETERMINISTIC TESTS PASSED!');
console.log('=======================================================');
