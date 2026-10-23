/**
 * Comprehensive Automated Verification Suite for Task 4:
 * Physically Correct Jump Coin Arcs, Visual Power-Up Readability & HUD Feedback
 */

import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../src/core/Constants';
import {
  CoinPatternLibrary,
  PatternCollectible
} from '../src/track/CoinPatternLibrary';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { getPowerupIconSvg, ALL_POWERUP_ICONS } from '../src/ui/IconCatalog';
import { FirstUseGuidance, FIRST_USE_INFO } from '../src/ui/FirstUseGuidance';

// Mock localStorage for Node environment if needed
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

function assertClose(actual: number, expected: number, delta: number, msg: string) {
  assert(Math.abs(actual - expected) <= delta, `${msg} (expected ~${expected}, got ${actual})`);
}

console.log('========================================================================');
console.log('🚀 TASK 4: PHYSICALLY CORRECT JUMP ARCS & POWER-UP READABILITY TEST SUITE');
console.log('========================================================================\n');

// =========================================================================
// Suite 1: Active Jump Physics & Kinematics Calculations
// =========================================================================
console.log('--- Suite 1: Active Jump Physics & Kinematics Calculations ---');
{
  const normalPhys = CoinPatternLibrary.calculateJumpPhysics({ speed: 18, jumpType: 'NORMAL' });
  assert(normalPhys.initialVerticalVelocity === CONSTANTS.JUMP_INITIAL_VELOCITY, 'Normal jump initial velocity matches CONSTANTS.JUMP_INITIAL_VELOCITY (15.0 m/s)');
  assert(normalPhys.gravity === CONSTANTS.GRAVITY, 'Gravity matches CONSTANTS.GRAVITY (50.0 m/s^2)');
  assertClose(normalPhys.timeToApex, 0.30, 0.01, 'Time to apex is t = v0 / g = 0.30s');
  assertClose(normalPhys.airTime, 0.60, 0.01, 'Total air time is T = 2 * t_apex = 0.60s');
  assertClose(normalPhys.peakHeightAboveTakeoff, 2.25, 0.01, 'Normal peak rise is H = v0^2 / (2g) = 2.25m');
  assertClose(normalPhys.horizontalDistance, 10.8, 0.1, 'Horizontal jump distance at 18 m/s = 18 * 0.6 = 10.8m');

  // Super sneakers amplification (1.45x)
  const superPhys = CoinPatternLibrary.calculateJumpPhysics({ speed: 18, jumpType: 'SUPER_SNEAKERS' });
  const expectedV0 = 15.0 * 1.45; // 21.75 m/s
  assertClose(superPhys.initialVerticalVelocity, expectedV0, 0.01, 'Super sneakers initial velocity is 1.45x boost (21.75 m/s)');
  assertClose(superPhys.timeToApex, expectedV0 / 50.0, 0.01, 'Super sneakers time to apex is 0.435s');
  assertClose(superPhys.airTime, 0.87, 0.01, 'Super sneakers total air time is 0.87s');
  assertClose(superPhys.peakHeightAboveTakeoff, 4.73, 0.02, 'Super sneakers peak jump rise is ~4.73m');
  assertClose(superPhys.horizontalDistance, 15.66, 0.1, 'Super sneakers jump distance at 18 m/s = 15.66m');

  // Speed adaptation (18 m/s to 38 m/s)
  const medPhys = CoinPatternLibrary.calculateJumpPhysics({ speed: 28, jumpType: 'NORMAL' });
  const maxPhys = CoinPatternLibrary.calculateJumpPhysics({ speed: 38, jumpType: 'NORMAL' });
  assertClose(medPhys.horizontalDistance, 16.8, 0.1, 'Jump distance at medium speed 28 m/s is 16.8m');
  assertClose(maxPhys.horizontalDistance, 22.8, 0.1, 'Jump distance at max speed 38 m/s is 22.8m');
  assert(maxPhys.horizontalDistance > normalPhys.horizontalDistance, 'Jump distance scales dynamically with forward velocity');
}

// =========================================================================
// Suite 2: Physically Placed Jump Arcs & Reachability Verification
// =========================================================================
console.log('\n--- Suite 2: Physically Placed Jump Arcs & Reachability Verification ---');
{
  const arc = CoinPatternLibrary.createPhysicalJumpArc({
    lane: 0,
    hurdleZ: 25.0,
    count: 5,
    speed: 18,
    jumpType: 'NORMAL'
  });
  assert(arc.count === 5, 'Jump arc generates exact requested 5-coin sequence');
  assert(arc.isArc === true, 'Jump arc tagged with isArc = true');
  assert(arc.lane === 0, 'Jump arc aligned to specified lane 0');

  const check = CoinPatternLibrary.verifyJumpArcReachability(arc, 18, 'NORMAL');
  assert(check.reachable === true, 'Standard jump arc verified reachable along legal jump trajectory');

  // Rooftop jump arc
  const rooftopArc = CoinPatternLibrary.createRooftopJumpArc(0, 30.0, 5, 2.0, false);
  assert(rooftopArc.count === 5, 'Rooftop jump arc generates 5 coins');
  assert(rooftopArc.supportSurface === 'TRAIN_ROOF', 'Rooftop arc has TRAIN_ROOF support surface');
  assert(rooftopArc.startYOffset! >= CONSTANTS.COIN_ROOFTOP_Y, 'All rooftop arc coins elevated above train roof baseline');

  const rooftopCheck = CoinPatternLibrary.verifyJumpArcReachability(rooftopArc, 18, 'NORMAL');
  assert(rooftopCheck.reachable === true, 'Rooftop jump arc verified reachable from train roof baseline');

  // Rooftop-to-ground descent
  const descent = CoinPatternLibrary.createRooftopToGroundArc(0, 40.0, 5, 2.0);
  assert(descent.count === 5, 'Descent arc contains 5 coins');
  assert(descent.startYOffset === CONSTANTS.COIN_ROOFTOP_Y, 'Descent starts high at rooftop level');
  assert(descent.endYOffset === CONSTANTS.COIN_GROUND_Y, 'Descent lands smoothly at ground level');

  const descentCheck = CoinPatternLibrary.verifyJumpArcReachability(descent, 18, 'NORMAL');
  assert(descentCheck.reachable === true, 'Rooftop-to-ground descent verified reachable without clipping');
}

// =========================================================================
// Suite 3: Visual Coin Quality & Exact 5-Child Hierarchy Invariant
// =========================================================================
console.log('\n--- Suite 3: Visual Coin Quality & Exact 5-Child Hierarchy Invariant ---');
{
  const factory = new CollectibleFactory();
  const coin = factory.createCoin();
  assert(coin instanceof THREE.Group, 'createCoin returns THREE.Group root');
  assert(coin.children.length === 1, 'Root coin group has exactly 1 inner child (presentation pivot)');

  const innerGroup = coin.children[0] as THREE.Group;
  assert(innerGroup instanceof THREE.Group, 'Pivot child is THREE.Group');
  assert(innerGroup.children.length === 5, 'Pivot group has exactly 5 children (disk, outerRim, innerRim, frontStar, backStar)');

  const disk = innerGroup.children[0] as THREE.Mesh;
  assertClose(disk.rotation.x, Math.PI / 2, 0.05, 'Disk mesh rotated by PI/2');

  const frontStar = innerGroup.children[3] as THREE.Mesh;
  assert(frontStar.position.z > 0.05, 'Front star embossed at positive Z');

  const backStar = innerGroup.children[4] as THREE.Mesh;
  assert(backStar.position.z < -0.05, 'Back star embossed at negative Z');
  assertClose(backStar.rotation.y, Math.PI, 0.05, 'Back star rotated 180 degrees');
}

// =========================================================================
// Suite 4: Differentiated 3D Power-Up Pickups
// =========================================================================
console.log('\n--- Suite 4: Differentiated 3D Power-Up Pickups ---');
{
  const factory = new CollectibleFactory();

  // 1. Magnet Pickup
  const magnet = factory.createMagnetPickup();
  assert(magnet instanceof THREE.Group, 'Magnet pickup is THREE.Group');
  assert(magnet.name === 'PICKUP_MAGNET', 'Magnet pickup named PICKUP_MAGNET');
  assert(magnet.children.length >= 3, 'Magnet has distinct sculpt components (body, poles, magnetic ring)');
  const magnetParts = magnet.children.map(c => c.name);
  assert(magnetParts.some(n => n.includes('MAGNET') || n.includes('HORSESHOE') || n.includes('POLE')), 'Magnet contains recognizable horseshoe/poles');

  // 2. Jetpack Pickup
  const jetpack = factory.createJetpackPickup();
  assert(jetpack.name === 'PICKUP_JETPACK', 'Jetpack pickup named PICKUP_JETPACK');
  assert(jetpack.children.length >= 4, 'Jetpack has twin cylinders, crossbar, and thruster nozzles');
  const jetpackParts = jetpack.children.map(c => c.name);
  assert(jetpackParts.some(n => n.includes('TANK') || n.includes('EXHAUST') || n.includes('ROCKET')), 'Jetpack contains twin tanks/exhausts');

  // 3. Sneakers Pickup
  const sneakers = factory.createSneakersPickup();
  assert(sneakers.name === 'PICKUP_SNEAKERS', 'Sneakers pickup named PICKUP_SNEAKERS');
  assert(sneakers.children.length >= 3, 'Sneakers has sole, body, and speed wing fins');
  const sneakersParts = sneakers.children.map(c => c.name);
  assert(sneakersParts.some(n => n.includes('SNEAKER') || n.includes('WING') || n.includes('SOLE')), 'Sneakers contains shoe geometry and wings');

  // 4. Multiplier Pickup
  const multiplier = factory.createMultiplierPickup();
  assert(multiplier.name === 'PICKUP_MULTIPLIER', 'Multiplier pickup named PICKUP_MULTIPLIER');
  assert(multiplier.children.length >= 3, 'Multiplier has 2X emblem shield, backplate, and glow ring');
  const multiplierParts = multiplier.children.map(c => c.name);
  assert(multiplierParts.some(n => n.includes('MULTIPLIER') || n.includes('2X')), 'Multiplier contains 2X emblem');

  // 5. Shield Pickup
  const shield = factory.createShieldPickup();
  assert(shield.name === 'PICKUP_SHIELD', 'Shield pickup named PICKUP_SHIELD');
  assert(shield.children.length >= 3, 'Shield has protective dome, crest, and orbital ring');
  const shieldParts = shield.children.map(c => c.name);
  assert(shieldParts.some(n => n.includes('SHIELD') || n.includes('DOME') || n.includes('RING')), 'Shield contains dome and ring');

  // 6. Hoverboard Pickup
  const board = factory.createHoverboardPickup();
  assert(board.name === 'PICKUP_HOVERBOARD', 'Hoverboard pickup named PICKUP_HOVERBOARD');
  assert(board.children.length >= 3, 'Hoverboard has deck, anti-grav thrusters, and neon rail trim');
  const boardParts = board.children.map(c => c.name);
  assert(boardParts.some(n => n.includes('HOVERBOARD') || n.includes('DECK') || n.includes('THRUSTER')), 'Hoverboard contains deck and thrusters');

  // 7. Key Pickup
  const key = factory.createKey();
  assert(key.name === 'COLLECTIBLE_KEY', 'Key pickup named COLLECTIBLE_KEY');
  assert(key.children.length >= 3, 'Key has ring head, cylindrical shaft, and key teeth');
  const keyParts = key.children.map(c => c.name);
  assert(keyParts.some(n => n.includes('KEY') || n.includes('HEAD') || n.includes('SHAFT') || n.includes('TOOTH')), 'Key contains head, shaft, and teeth');

  // Verify full set has 7 distinct identities
  const allPickups = [magnet, jetpack, sneakers, multiplier, shield, board, key];
  const uniqueNames = new Set(allPickups.map(p => p.name));
  assert(uniqueNames.size === 7, 'All 7 power-up pickups have strictly unique names and visual identities');
}

// =========================================================================
// Suite 5: Professional Vector Iconography (IconCatalog)
// =========================================================================
console.log('\n--- Suite 5: Professional Vector Iconography (IconCatalog) ---');
{
  const iconKeys = Object.keys(ALL_POWERUP_ICONS);
  assert(iconKeys.length >= 8, `IconCatalog contains at least 8 power-up/collectible icons (found ${iconKeys.length})`);

  for (const key of iconKeys) {
    const svg = getPowerupIconSvg(key, 24);
    assert(svg.includes('<svg'), `Icon ${key} contains opening <svg tag`);
    assert(svg.includes('viewBox="0 0 48 48"'), `Icon ${key} has standard 48x48 viewBox`);
    assert(svg.includes('xmlns="http://www.w3.org/2000/svg"'), `Icon ${key} has valid XML namespace`);
    assert(svg.includes('width="24"') && svg.includes('height="24"'), `Icon ${key} has 24px dimensions`);
  }

  // Dimension scaling
  const svg16 = getPowerupIconSvg('MAGNET', 16);
  const svg48 = getPowerupIconSvg('MAGNET', 48);
  assert(svg16.includes('width="16"') && svg16.includes('height="16"'), 'getPowerupIconSvg scales down to 16px');
  assert(svg48.includes('width="48"') && svg48.includes('height="48"'), 'getPowerupIconSvg scales up to 48px');
}

// =========================================================================
// Suite 6: First-Use Guidance & Discovery Tooltips
// =========================================================================
console.log('\n--- Suite 6: First-Use Guidance & Discovery Tooltips ---');
{
  const guidance = FirstUseGuidance.getInstance();
  guidance.resetForTesting();

  // Fresh power-up should trigger guidance
  assert(guidance.isFirstUse('MAGNET') === true, 'MAGNET is recognized as first-time discovery initially');
  const trigger1 = guidance.checkAndTriggerGuidance('MAGNET');
  assert(trigger1.isFirst === true, 'checkAndTriggerGuidance returns isFirst: true on initial pickup');
  assert(trigger1.info !== undefined, 'Guidance info card is populated');
  assert(trigger1.info?.title === FIRST_USE_INFO.MAGNET.title, 'Guidance title matches catalog');
  assert(trigger1.info?.shortDesc === FIRST_USE_INFO.MAGNET.shortDesc, 'Guidance description matches catalog');
  assert(trigger1.iconSvg?.includes('<svg'), 'Guidance includes vector SVG icon');

  // Second pickup of same type must NOT trigger again
  assert(guidance.isFirstUse('MAGNET') === false, 'MAGNET is no longer first-use after collection');
  const trigger2 = guidance.checkAndTriggerGuidance('MAGNET');
  assert(trigger2.isFirst === false, 'checkAndTriggerGuidance returns isFirst: false on subsequent collection');
  assert(trigger2.info === undefined, 'No duplicate guidance triggered to avoid gameplay interruption');

  // All core power-up types have valid guidance data
  const requiredTypes = ['MAGNET', 'JETPACK', 'SNEAKERS', 'MULTIPLIER', 'SHIELD', 'HOVERBOARD', 'KEY', 'SEASON_TOKEN'];
  for (const type of requiredTypes) {
    const info = FIRST_USE_INFO[type];
    assert(info !== undefined, `First-use guidance defined for ${type}`);
    assert(info.title.length > 0, `Title exists for ${type}`);
    assert(info.shortDesc.length > 0, `Description exists for ${type}`);
  }
}

console.log('\n========================================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED FOR TASK 4!`);
console.log('========================================================================\n');
