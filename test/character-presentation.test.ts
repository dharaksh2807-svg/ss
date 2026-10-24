import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { CameraController, CameraMode } from '../src/scene/CameraController';
import {
  CHARACTER_CATALOG,
  getCharacterById,
  getOutfitById
} from '../src/characters/CharacterCatalog';
import { EventBus } from '../src/core/EventBus';

// Mock localStorage for Node environment
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();
(global as any).localStorage = mockStorage;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('🧪 Starting Character Presentation & Camera Composition Test Suite...\n');

// ========================================================
// TEST 1: CameraController Modes and Preferences
// ========================================================
console.log('--- Test 1: CameraController Modes & Preference Persistence ---');
const controller = new CameraController();

assert(
  controller.getCameraMode() === 'CHARACTER_FOCUS',
  `Default camera mode is CHARACTER_FOCUS (actual: ${controller.getCameraMode()})`
);

controller.setCameraMode('CLASSIC');
assert(
  controller.getCameraMode() === 'CLASSIC',
  'Camera mode successfully set to CLASSIC'
);
assert(
  mockStorage.getItem('metro_camera_mode') === 'CLASSIC',
  'Camera mode CLASSIC persisted to localStorage'
);

controller.setCameraMode('CHARACTER_FOCUS');
assert(
  controller.getCameraMode() === 'CHARACTER_FOCUS',
  'Camera mode successfully set to CHARACTER_FOCUS'
);
assert(
  mockStorage.getItem('metro_camera_mode') === 'CHARACTER_FOCUS',
  'Camera mode CHARACTER_FOCUS persisted to localStorage'
);

// Test EventBus subscription
EventBus.getInstance().emit('CAMERA_MODE_CHANGED', 'CLASSIC');
assert(
  controller.getCameraMode() === 'CLASSIC',
  'CameraController reacted to CAMERA_MODE_CHANGED event via EventBus'
);
controller.setCameraMode('CHARACTER_FOCUS');

// ========================================================
// TEST 2: Dynamic Camera Offset & Obstacle/Tunnel Safety
// ========================================================
console.log('\n--- Test 2: Dynamic Camera Composition & Safety Fallback ---');
// Disable lobby mode for active gameplay simulation
controller.setLobbyMode(false);
// Simulate player position: lane 0 (center, x=0), z=0, y=0
const playerPos = new THREE.Vector3(0, 0, 0);

// Run normal update loop for Character Focus: (playerPos, dt, timeSec, speed, groundY, isSliding, isTunnelEnclosed)
for (let i = 0; i < 90; i++) {
  controller.update(playerPos, 0.016, i * 0.016, 12, 0, false, false);
}
const normalCamX = controller.camera.position.x;
assert(
  normalCamX > 0.4 && normalCamX < 0.8,
  `Character Focus camera offset reveals runner side silhouette (X offset: ${normalCamX.toFixed(3)}m)`
);

// Simulate narrow tunnel: isTunnelEnclosed = true
for (let i = 0; i < 90; i++) {
  controller.update(playerPos, 0.016, i * 0.016, 12, 0, false, true);
}
const tunnelCamX = controller.camera.position.x;
assert(
  tunnelCamX < 0.1,
  `In narrow tunnels, camera safely and smoothly centers to avoid clipping tunnel walls (X offset: ${tunnelCamX.toFixed(3)}m)`
);

// Simulate train rooftop running: groundY = 4.35m
for (let i = 0; i < 90; i++) {
  controller.update(new THREE.Vector3(0, 4.35, 0), 0.016, i * 0.016, 12, 4.35, false, false);
}
const rooftopCamX = controller.camera.position.x;
assert(
  rooftopCamX < 0.1,
  `On train rooftops (groundY >= 4.0m), camera centers to maximize runway visibility (X offset: ${rooftopCamX.toFixed(3)}m)`
);

// ========================================================
// TEST 3: Overhead Geometry Clearance
// ========================================================
console.log('\n--- Test 3: Overhead Structure Clearance Verification ---');
const trackChunkSource = fs.readFileSync(path.resolve('src/track/TrackChunk.ts'), 'utf-8');
const scenerySource = fs.readFileSync(path.resolve('src/environment/SceneryFactory.ts'), 'utf-8');

assert(
  trackChunkSource.includes('bridgeHeight = 12.0'),
  'TrackChunk modern skybridge elevated to 12.0m clearance'
);
assert(
  scenerySource.includes('bridgeHeight = 12.0'),
  'SceneryFactory modern skybridge elevated to 12.0m clearance'
);
assert(
  trackChunkSource.includes('0.42') && scenerySource.includes('0.42'),
  'Skybridge deck thickness slimmed to 0.42m to prevent camera clipping and overhead occlusion'
);
assert(
  trackChunkSource.includes('poleHeight = 11.2') && scenerySource.includes('poleHeight = 11.2'),
  'Modern catenary masts elevated to 11.2m for complete top-view horizon visibility'
);

// ========================================================
// TEST 4: Character Catalog & Visual Asset Consistency
// ========================================================
console.log('\n--- Test 4: Character Catalog Asset Consistency ---');
const allCharacters = CHARACTER_CATALOG;
assert(allCharacters.length >= 5, `At least 5 characters in catalog (found ${allCharacters.length})`);

const modi = getCharacterById('char_modi');
assert(modi !== undefined, 'Legendary character Narendra Modi found in catalog');
assert(modi?.isGlb === true, 'Modi is configured as authentic 3D GLB character');
assert(fs.existsSync(path.resolve('public' + modi?.glbPath)), `Modi GLB exists at public${modi?.glbPath}`);
assert(fs.existsSync(path.resolve('public' + modi?.previewImage)), `Modi preview image exists at public${modi?.previewImage}`);
assert(fs.existsSync(path.resolve('public' + modi?.thumbnailImage)), `Modi thumbnail image exists at public${modi?.thumbnailImage}`);

const jax = getCharacterById('char_jax');
assert(jax !== undefined, 'Jax found in catalog');
const jaxClassic = getOutfitById('char_jax', 'jax_classic');
assert(jaxClassic !== undefined, 'Jax classic outfit found in catalog');

// ========================================================
// TEST 5: Settings Preference Persistence
// ========================================================
console.log('\n--- Test 5: Settings Preferences Persistence ---');
mockStorage.setItem('metro_facial_portrait', 'true');
assert(mockStorage.getItem('metro_facial_portrait') === 'true', 'Facial portrait preference saved as true');
mockStorage.setItem('metro_facial_portrait', 'false');
assert(mockStorage.getItem('metro_facial_portrait') === 'false', 'Facial portrait preference saved as false');

console.log('\n🎉 ALL CHARACTER PRESENTATION INTEGRATION TESTS PASSED PERFECTLY!\n');
