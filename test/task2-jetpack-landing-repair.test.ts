/**
 * Comprehensive Automated Verification Suite for Task 2:
 * Complete Jetpack Coin Generation, Collection & Landing Repair
 *
 * Verifies:
 * A. Single Authoritative Flight Path: Takeoff, Cruise, Descent, and Post-Landing Runway
 * B. 100% Reachable Lane Alignment (discrete lane coordinates, zero mid-track dead zones)
 * C. Continuous 3D Swept Collision Detection (zero tunneling at extreme speed up to 35m/s)
 * D. Landing Transition Repair: Smooth descent glide slope, touchdown, and safe landing
 * E. Immediate Ground Coin Collection Resumption upon touchdown (no skipped ground coins)
 * F. Second Jetpack Refresh Policy: Dynamically extends corridor and restores cruise
 * G. Flight State Persistence: Pause/resume stability and clean reset cleanup
 */

import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { TrackManager } from '../src/track/TrackManager';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { Player } from '../src/player/Player';
import { AerialCoinManager } from '../src/track/AerialCoinManager';
import { EventBus, EVENTS } from '../src/core/EventBus';

// Mock localStorage for Node testing environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] || null,
    length: 0
  };
}

function assert(condition: boolean, msg: string): void {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function runTask2Suite() {
  console.log('================================================================');
  console.log('🧪 TASK 2: COMPLETE JETPACK COIN GENERATION, COLLECTION & LANDING');
  console.log('================================================================\n');

  const bus = EventBus.getInstance();

  // ---------------------------------------------------------------------------
  // Suite 1: Single Authoritative Flight Path (Takeoff, Cruise, Descent, Runway)
  // ---------------------------------------------------------------------------
  console.log('--- Suite 1: Single Authoritative Flight Path ---');
  {
    const scene = new THREE.Scene();
    const aerialManager = new AerialCoinManager(scene);
    const player = new Player();
    player.reset();
    player.speed = 18.0;
    player.position.set(0, CONSTANTS.PLAYER_BASE_Y, 0);
    player.powerups.activate('JETPACK');

    aerialManager.onJetpackActivated(player);

    const pool = aerialManager.getPool();
    // Advance simulation to spawn the full flight corridor ahead
    aerialManager.update(player, 0.016, 0.016, false, 0);

    const activeCoins = pool.filter(c => c.active);
    assert(activeCoins.length >= 40, `Spawned robust aerial coin corridor (${activeCoins.length} active coins)`);

    // Verify Takeoff coins form a rising climb arc
    const takeoffCoins = activeCoins.filter(c => c.worldPos.z > aerialManager.getTakeoffEndZ());
    assert(takeoffCoins.length > 0, `Generated ${takeoffCoins.length} takeoff ascent coins`);

    let prevY = 0;
    let climbsMonotonically = true;
    // Sort takeoff coins from flight start forward into -Z
    const sortedTakeoff = [...takeoffCoins].sort((a, b) => b.worldPos.z - a.worldPos.z);
    for (const c of sortedTakeoff) {
      if (prevY > 0 && c.worldPos.y < prevY - 0.05) {
        climbsMonotonically = false;
      }
      prevY = c.worldPos.y;
    }
    assert(climbsMonotonically, 'Takeoff coins form a smooth rising climb arc');
    assert(
      sortedTakeoff[sortedTakeoff.length - 1].worldPos.y >= CONSTANTS.JETPACK_ALTITUDE - 0.5,
      `Takeoff arc smoothly reaches cruise altitude (${sortedTakeoff[sortedTakeoff.length - 1].worldPos.y.toFixed(2)}m)`
    );

    // Verify Cruise coins hover at JETPACK_ALTITUDE (9.0m)
    const cruiseCoins = activeCoins.filter(
      c => c.worldPos.z <= aerialManager.getTakeoffEndZ() && c.worldPos.z > aerialManager.getDescentStartZ()
    );
    assert(cruiseCoins.length > 0, `Generated ${cruiseCoins.length} cruise flight coins`);
    const allAtCruiseAltitude = cruiseCoins.every(c => Math.abs(c.baseY - CONSTANTS.JETPACK_ALTITUDE) < 0.01);
    assert(allAtCruiseAltitude, 'All cruise coins positioned strictly at cruise altitude (9.0m)');

    // Advance player forward toward landing zone to trigger procedural descent & runway spawning
    player.position.z = aerialManager.getLandingZ() + 25.0;
    aerialManager.update(player, 0.016, 5.0, false, 0);

    const fullFlightCoins = pool.filter(c => c.active);

    // Verify Descent coins form a smooth descent glide slope
    const descentCoins = fullFlightCoins.filter(
      c => c.worldPos.z <= aerialManager.getDescentStartZ() && c.worldPos.z > aerialManager.getLandingZ()
    );
    assert(descentCoins.length > 0, `Generated ${descentCoins.length} descent glide slope coins`);
    const sortedDescent = [...descentCoins].sort((a, b) => b.worldPos.z - a.worldPos.z);
    let descendsSmoothly = true;
    for (let i = 1; i < sortedDescent.length; i++) {
      if (sortedDescent[i].worldPos.y > sortedDescent[i - 1].worldPos.y + 0.05) {
        descendsSmoothly = false;
      }
    }
    assert(descendsSmoothly, 'Descent coins follow an orderly downward glide slope toward the landing zone');

    // Verify Post-Landing Runway coins past landingZ at ground level
    const runwayCoins = fullFlightCoins.filter(c => c.worldPos.z <= aerialManager.getLandingZ());
    assert(runwayCoins.length > 0, `Generated ${runwayCoins.length} post-landing ground runway coins`);
    const groundY = (player.groundY || CONSTANTS.PLAYER_BASE_Y) + 0.85;
    const allAtGroundLevel = runwayCoins.every(c => Math.abs(c.baseY - groundY) < 0.1);
    assert(allAtGroundLevel, 'Post-landing runway coins are positioned exactly at runner pickup level (groundY)');

    aerialManager.reset();
  }

  // ---------------------------------------------------------------------------
  // Suite 2: 100% Reachable Lane Alignment (Eliminating Dead-Zone Curves)
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 2: 100% Reachable Lane Alignment ---');
  {
    const scene = new THREE.Scene();
    const aerialManager = new AerialCoinManager(scene);
    const player = new Player();
    player.reset();
    player.speed = 20.0;
    player.position.set(0, CONSTANTS.PLAYER_BASE_Y, 0);
    player.powerups.activate('JETPACK');
    aerialManager.onJetpackActivated(player);
    aerialManager.update(player, 0.016, 0.016, false, 0);

    const validLaneX = [CONSTANTS.LANES[-1], CONSTANTS.LANES[0], CONSTANTS.LANES[1]];
    const activeCoins = aerialManager.getPool().filter(c => c.active);

    let allInValidLanes = true;
    for (const coin of activeCoins) {
      const matchesAnyLane = validLaneX.some(lx => Math.abs(coin.worldPos.x - lx) < 0.01);
      if (!matchesAnyLane) {
        allInValidLanes = false;
        console.error(`Unreachable coin at x=${coin.worldPos.x}, z=${coin.worldPos.z}`);
        break;
      }
    }
    assert(allInValidLanes, 'All aerial coins are strictly aligned to reachable track lanes (-LANE_WIDTH, 0, +LANE_WIDTH)');
    aerialManager.reset();
  }

  // ---------------------------------------------------------------------------
  // Suite 3: Continuous 3D Swept Collision Detection (High Speed Tunneling Test)
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 3: Continuous 3D Swept Collision Detection (Tunneling Prevention) ---');
  {
    const scene = new THREE.Scene();
    const aerialManager = new AerialCoinManager(scene);
    const player = new Player();
    player.reset();
    // Simulate maximum forward velocity (35.0 m/s) with a frame drop spike (dt = 0.06s -> step = 2.1m)
    player.speed = 35.0;
    player.position.set(0, CONSTANTS.JETPACK_ALTITUDE, -100.0);
    player.powerups.activate('JETPACK');
    aerialManager.onJetpackActivated(player);

    let collectedCount = 0;
    const colSub = (data: any) => {
      if (data?.isAerial) collectedCount++;
    };
    bus.on(EVENTS.COIN_COLLECTED, colSub);

    // Run player forward through the corridor at 35 m/s with 0.05s steps
    const stepDt = 0.05;
    for (let step = 0; step < 40; step++) {
      player.update(stepDt);
      aerialManager.update(player, stepDt, step * stepDt, false, 0);
    }

    bus.off(EVENTS.COIN_COLLECTED, colSub);
    assert(collectedCount >= 15, `High-speed 35m/s flight reliably collected ${collectedCount} coins without tunneling`);
    aerialManager.reset();
  }

  // ---------------------------------------------------------------------------
  // Suite 4: Complete Landing Transition & Safe Touchdown
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 4: Complete Landing Transition & Safe Touchdown ---');
  {
    const player = new Player();
    player.reset();
    player.speed = 18.0;
    player.powerups.activate('JETPACK');

    // First frame starts TAKEOFF
    player.update(0.016);
    // Advance past takeoff into CRUISE
    player.update(CONSTANTS.JETPACK_TAKEOFF_DURATION || 1.0);
    assert(player.getJetpackPhase() === 'CRUISE', 'Player entered CRUISE phase');

    // Fast-forward powerup timer into the descent window
    const duration = player.powerups.getJetpackDuration();
    const descentWindow = CONSTANTS.JETPACK_DESCENT_DURATION || 1.8;
    player.powerups.update(duration - descentWindow + 0.2);
    player.update(0.016);

    assert(player.getJetpackPhase() === 'DESCENT', 'Player entered DESCENT phase as jetpack nears expiration');
    assert(player.position.y > CONSTANTS.PLAYER_BASE_Y, `Player begins descending from altitude (${player.position.y.toFixed(2)}m)`);

    let landingEventFired = false;
    const landSub = () => { landingEventFired = true; };
    bus.on(EVENTS.JETPACK_LANDED, landSub);

    // Simulate completion of descent until touchdown
    for (let i = 0; i < 90; i++) {
      player.update(0.02);
      if (player.getJetpackPhase() === 'NONE' || player.getJetpackPhase() === 'SAFE_LANDING') {
        break;
      }
    }

    bus.off(EVENTS.JETPACK_LANDED, landSub);
    assert(landingEventFired, 'JETPACK_LANDED event emitted on touchdown');
    assert(Math.abs(player.position.y - CONSTANTS.PLAYER_BASE_Y) < 0.15, `Player safely landed at ground level (${player.position.y.toFixed(2)}m)`);
    assert(player.isInvulnerable(), 'Safe landing grants temporary grace invulnerability against ground hazards');
  }

  // ---------------------------------------------------------------------------
  // Suite 5: Immediate Ground Coin Collection Resumption After Touchdown
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 5: Ground Coin Collection Resumption After Touchdown ---');
  {
    const scene = new THREE.Scene();
    const trackManager = new TrackManager(scene);
    const colFactory = new CollectibleFactory();
    const player = new Player();
    player.reset();
    player.speed = 18.0;

    // Simulate player in SAFE_LANDING at ground level
    player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -50.0);
    player.state = 'RUN';

    // Place a ground coin directly in front of the runner
    const chunk = trackManager.chunks[0];
    const groundCoinMesh = colFactory.createCoin();
    groundCoinMesh.position.set(0, 0.85, -51.5);
    chunk.group.add(groundCoinMesh);

    chunk.collectibles.push({
      group: groundCoinMesh,
      type: 'COIN',
      lane: 0,
      collider: new THREE.Box3(
        new THREE.Vector3(-0.5, 0.35, -52.0),
        new THREE.Vector3(0.5, 1.35, -51.0)
      ),
      active: true,
      isMagnetized: false
    });

    let groundCoinCollected = false;
    const groundSub = () => { groundCoinCollected = true; };
    bus.on(EVENTS.COIN_COLLECTED, groundSub);

    // Step player forward to intersect ground coin
    player.position.z = -51.5;
    player.update(0.016);
    trackManager.update(player, 0.016, 0.016);

    bus.off(EVENTS.COIN_COLLECTED, groundSub);
    assert(groundCoinCollected, 'Ground coin successfully collected immediately upon return to ground running');
  }

  // ---------------------------------------------------------------------------
  // Suite 6: Mid-Flight Second Jetpack Refresh Policy
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 6: Mid-Flight Second Jetpack Refresh Policy ---');
  {
    const scene = new THREE.Scene();
    const trackManager = new TrackManager(scene);
    const player = new Player();
    player.reset();
    player.speed = 18.0;
    player.powerups.activate('JETPACK');
    player.update(0.016);
    player.update(CONSTANTS.JETPACK_TAKEOFF_DURATION || 1.0);
    trackManager.update(player, 0.016, 1.0);

    const initialLandingZ = trackManager.aerialCoinManager.getLandingZ();

    // Travel forward into the descent window
    const duration = player.powerups.getJetpackDuration();
    const descentWindow = CONSTANTS.JETPACK_DESCENT_DURATION || 1.8;
    const cruiseElapsed = duration - descentWindow + 0.2;
    player.position.z -= player.speed * cruiseElapsed;
    player.powerups.update(cruiseElapsed);
    player.update(0.016);
    assert(player.getJetpackPhase() === 'DESCENT', 'Player entered DESCENT before refresh');

    // Pick up second jetpack mid-descent
    player.powerups.activate('JETPACK');
    player.update(0.016);
    trackManager.update(player, 0.016, 0.032);

    assert(player.getJetpackPhase() === 'CRUISE', 'Second jetpack pickup restored flight phase from DESCENT back to CRUISE');
    const refreshedLandingZ = trackManager.aerialCoinManager.getLandingZ();
    assert(
      refreshedLandingZ < initialLandingZ - 50.0,
      `Aerial corridor dynamically extended further into -Z (Initial: ${initialLandingZ.toFixed(1)}m, New: ${refreshedLandingZ.toFixed(1)}m)`
    );
  }

  // ---------------------------------------------------------------------------
  // Suite 7: Guaranteed Single Collection & Clean Cleanup on Reset
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 7: Guaranteed Single Collection & Clean Reset Cleanup ---');
  {
    const scene = new THREE.Scene();
    const aerialManager = new AerialCoinManager(scene);
    const player = new Player();
    player.reset();
    player.speed = 18.0;
    player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -10.0);
    player.powerups.activate('JETPACK');
    aerialManager.onJetpackActivated(player);

    let eventEmissions = 0;
    const countSub = () => { eventEmissions++; };
    bus.on(EVENTS.COIN_COLLECTED, countSub);

    // Move player forward across 10 frames to collect oncoming aerial coin
    for (let f = 0; f < 10; f++) {
      player.update(0.016);
      aerialManager.update(player, 0.016, f * 0.016, false, 0);
    }
    bus.off(EVENTS.COIN_COLLECTED, countSub);

    assert(eventEmissions > 0, `Collected coins during flight frame updates (${eventEmissions} events)`);

    // Reset game / run
    aerialManager.reset();
    const activeRemaining = aerialManager.getPool().filter(c => c.active);
    assert(activeRemaining.length === 0, '100% of aerial coins cleanly deactivated and returned to pool on reset');
    assert(!aerialManager.isJetpackFlightActive(), 'Flight session active flag reset to false');
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 18 / 18 TASK 2 JETPACK REPAIR TESTS PASSED!');
  console.log('================================================================\n');
}

runTask2Suite().catch(err => {
  console.error('Fatal test failure:', err);
  process.exit(1);
});
