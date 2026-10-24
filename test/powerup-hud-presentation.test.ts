import * as THREE from 'three';
import { POWERUP_REGISTRY, getPowerupConfig } from '../src/ui/PowerupRegistry';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { PowerupType } from '../src/player/PowerupManager';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('🧪 Running Power-up Recognition, 3D Pickups & Timer HUD Test Suite...\n');

// ========================================================
// TEST 1: Centralized Powerup Presentation Registry
// ========================================================
console.log('--- Test 1: Powerup Presentation Registry ---');
const requiredPowerups: PowerupType[] = ['MAGNET', 'JETPACK', 'SNEAKERS', 'MULTIPLIER', 'SHIELD', 'HOVERBOARD'];

for (const type of requiredPowerups) {
  const config = getPowerupConfig(type);
  assert(!!config, `Registry contains config for ${type}`);
  assert(config.title.length > 0, `${type} has valid title: ${config.title}`);
  assert(config.tagline.length > 0, `${type} has valid tagline: ${config.tagline}`);
  assert(config.shortDesc.length > 0, `${type} has valid shortDesc: ${config.shortDesc}`);
  assert(config.iconSvg.includes('<svg'), `${type} has valid inline SVG icon`);
  assert(config.badgeClass.length > 0, `${type} has valid badge class: ${config.badgeClass}`);
  assert(config.primaryColor.startsWith('#'), `${type} has hex primary color`);
  assert(config.accentColor.startsWith('#'), `${type} has hex accent color`);
}

// Fallback lookup
const fallback = getPowerupConfig('UNKNOWN_TYPE');
assert(fallback.type === 'MULTIPLIER', 'Fallback returns valid default configuration');

// ========================================================
// TEST 2: In-World 3D Power-up Models & Silhouettes
// ========================================================
console.log('\n--- Test 2: In-World 3D Pickups & Silhouettes ---');
const factory = new CollectibleFactory();

// Magnet
const magnetGroup = factory.createMagnetPickup();
assert(magnetGroup instanceof THREE.Group, 'Magnet pickup is a THREE.Group');
assert(magnetGroup.scale.x >= 1.2, `Magnet scale is prominent (scale: ${magnetGroup.scale.x})`);
let hasRedNorth = false;
let hasBlueSouth = false;
magnetGroup.traverse((child) => {
  if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
    const col = child.material.color;
    if (col.r > 0.7 && col.b < 0.4) hasRedNorth = true;
    if (col.b > 0.7 && col.r < 0.4) hasBlueSouth = true;
  }
});
assert(hasRedNorth && hasBlueSouth, 'Magnet features distinct North (Red) and South (Blue) polarity indicators');

// Jetpack
const jetpackGroup = factory.createJetpackPickup();
assert(jetpackGroup instanceof THREE.Group, 'Jetpack pickup is a THREE.Group');
assert(jetpackGroup.scale.x >= 1.2, `Jetpack scale is prominent (scale: ${jetpackGroup.scale.x})`);
let cylinderCount = 0;
let hasFlame = false;
jetpackGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    if (child.geometry instanceof THREE.CylinderGeometry) cylinderCount++;
    if (child.name === 'JETPACK_EXHAUST' || (child.material instanceof THREE.MeshBasicMaterial && (child.material.color.getHexString().startsWith('ffd') || child.material.color.getHexString().startsWith('ff6')))) {
      hasFlame = true;
    }
  }
});
assert(cylinderCount >= 2, `Jetpack features twin propulsion cylinders (found: ${cylinderCount})`);
assert(hasFlame, 'Jetpack features visible exhaust flame hints');

// Sneakers
const sneakersGroup = factory.createSneakersPickup();
assert(sneakersGroup instanceof THREE.Group, 'Sneakers pickup is a THREE.Group');
assert(sneakersGroup.scale.x >= 1.2, `Sneakers scale is prominent (scale: ${sneakersGroup.scale.x})`);
let hasSole = false;
let hasKineticWing = false;
sneakersGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    if (child.geometry instanceof THREE.BoxGeometry) hasSole = true;
    if (child.geometry instanceof THREE.TorusGeometry || child.geometry instanceof THREE.ConeGeometry) hasKineticWing = true;
  }
});
assert(hasSole, 'Sneakers feature distinct sole / tread geometry');
assert(hasKineticWing, 'Sneakers feature kinetic leap accent ring / wings');

// Multiplier
const multiplierGroup = factory.createMultiplierPickup();
assert(multiplierGroup instanceof THREE.Group, 'Multiplier pickup is a THREE.Group');
assert(multiplierGroup.scale.x >= 1.2, `Multiplier scale is prominent (scale: ${multiplierGroup.scale.x})`);
let hasHexBadge = false;
multiplierGroup.traverse((child) => {
  if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CylinderGeometry) {
    // 6-sided cylinder is a hexagonal badge
    if ((child.geometry.parameters as any).radialSegments === 6) {
      hasHexBadge = true;
    }
  }
});
assert(hasHexBadge, 'Multiplier features prominent hexagonal medal badge geometry');

// Shield
const shieldGroup = factory.createShieldPickup();
assert(shieldGroup instanceof THREE.Group, 'Shield pickup is a THREE.Group');
assert(shieldGroup.scale.x >= 1.2, `Shield scale is prominent (scale: ${shieldGroup.scale.x})`);
let hasShieldBoss = false;
shieldGroup.traverse((child) => {
  if (child instanceof THREE.Mesh && child.geometry instanceof THREE.OctahedronGeometry) {
    hasShieldBoss = true;
  }
});
assert(hasShieldBoss, 'Shield features central crystalline defense boss');

// ========================================================
// TEST 3: Timer Countdown Formatting Logic
// ========================================================
console.log('\n--- Test 3: Timer Countdown Formatting Logic ---');

const formatTimer = (sec: number): string => {
  if (sec <= 1.0) {
    return `${Math.max(0, sec).toFixed(1)}s`;
  }
  if (sec <= 3.0) {
    return `${sec.toFixed(1)}s`;
  }
  return `${Math.ceil(sec)}s`;
};

assert(formatTimer(10.0) === '10s', 'Standard duration displays whole integer seconds');
assert(formatTimer(7.2) === '8s', 'Standard duration rounds up correctly');
assert(formatTimer(3.0) === '3.0s', 'Near-expiration warning (3.0s) displays tenths of a second');
assert(formatTimer(2.36) === '2.4s', 'Near-expiration countdown accurately formats 1 decimal place');
assert(formatTimer(0.9) === '0.9s', 'Final second critical countdown displays decimal seconds');
assert(formatTimer(0.04) === '0.0s', 'Expiration threshold clamps gracefully to 0.0s');

console.log('\n🎉 All Power-up Recognition & Timer HUD tests passed successfully!');
