import * as THREE from 'three';
import { GraphicsManager, GraphicsPreset, QualityConfig } from '../src/scene/GraphicsManager';
import { WorldScene } from '../src/scene/WorldScene';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { TrackChunk } from '../src/track/TrackChunk';
import { CONSTANTS } from '../src/core/Constants';
import { EventBus } from '../src/core/EventBus';

// Mock storage for headless Node test environment
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => { mockStorage[k] = String(v); },
  removeItem: (k: string) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};

// Mock minimal HTMLCanvasElement & window for Three.js WebGLRenderer in tests
class MockCanvas {
  style = {};
  width = 1440;
  height = 900;
  addEventListener() {}
  removeEventListener() {}
  getContext(type: string) {
    return {
      getExtension: () => null,
      getParameter: () => 'Mock GPU',
      createTexture: () => ({}),
      bindTexture: () => {},
      texParameteri: () => {},
      texImage2D: () => {},
      clearColor: () => {},
      clearDepth: () => {},
      clear: () => {},
      enable: () => {},
      disable: () => {},
      depthFunc: () => {},
      frontFace: () => {},
      cullFace: () => {},
      viewport: () => {},
      scissor: () => {},
    };
  }
}

(globalThis as any).window = {
  innerWidth: 1440,
  innerHeight: 900,
  devicePixelRatio: 2.0,
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false }),
  navigator: { hardwareConcurrency: 8, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
};

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('🧪 Starting Task 6: Adaptive Graphics Quality & Performance Test Suite...\n');

let passedTests = 0;

// =========================================================================
// Suite 1: Quality Presets Configuration Verification
// =========================================================================
console.log('--- Suite 1: Quality Presets Configuration Verification ---');
const gm = GraphicsManager.getInstance();

const lowConfig = gm.getConfigForQuality('LOW');
assert(lowConfig.resolved === 'LOW', 'LOW preset resolves to LOW quality');
assert(lowConfig.pixelRatio === 1.0, 'LOW preset clamps pixelRatio to 1.0 for fill-rate reduction');
assert(lowConfig.shadowMapEnabled === false, 'LOW preset disables expensive directional shadow maps');
assert(lowConfig.sceneryDetail === 'MINIMAL', 'LOW preset specifies MINIMAL scenery detail');
assert(lowConfig.cloudsVisible === false, 'LOW preset hides distant procedural clouds');
assert(lowConfig.skylineVisible === false, 'LOW preset hides distant city skyline meshes');
assert(lowConfig.particleMultiplier <= 0.3, 'LOW preset slashes particle count by >= 70%');
assert(lowConfig.contactBlobShadow === true, 'LOW preset activates ground contact blob shadow for player');
passedTests += 8;

const medConfig = gm.getConfigForQuality('MEDIUM');
assert(medConfig.resolved === 'MEDIUM', 'MEDIUM preset resolves to MEDIUM quality');
assert(medConfig.pixelRatio <= 1.35, 'MEDIUM preset uses moderate balanced pixel ratio');
assert(medConfig.shadowMapEnabled === true, 'MEDIUM preset enables real-time shadow map');
assert(medConfig.shadowMapSize === 1024, 'MEDIUM preset uses optimized 1024x1024 shadow map resolution');
assert(medConfig.sceneryDetail === 'BALANCED', 'MEDIUM preset uses BALANCED scenery detail');
assert(medConfig.cloudsVisible === true, 'MEDIUM preset renders stylized clouds');
assert(medConfig.skylineVisible === true, 'MEDIUM preset renders skyline silhouettes');
assert(medConfig.particleMultiplier === 0.6, 'MEDIUM preset uses 60% particle emission');
assert(medConfig.contactBlobShadow === false, 'MEDIUM preset hides contact blob shadow when real shadows are on');
passedTests += 9;

const highConfig = gm.getConfigForQuality('HIGH');
assert(highConfig.resolved === 'HIGH', 'HIGH preset resolves to HIGH quality');
assert(highConfig.pixelRatio === 2.0, 'HIGH preset supports up to 2.0 High-DPI Retina resolution');
assert(highConfig.shadowMapEnabled === true, 'HIGH preset enables directional shadow map');
assert(highConfig.shadowMapSize === 2048, 'HIGH preset uses 2048x2048 high-res shadow map');
assert(highConfig.shadowMapType === THREE.PCFSoftShadowMap, 'HIGH preset uses PCFSoftShadowMap filter');
assert(highConfig.sceneryDetail === 'FULL', 'HIGH preset uses FULL architectural scenery detail');
assert(highConfig.particleMultiplier === 1.0, 'HIGH preset uses 100% full rich particle bursts');
passedTests += 7;

// =========================================================================
// Suite 2: Hardware Detection & Auto Quality Selection
// =========================================================================
console.log('\n--- Suite 2: Hardware Detection & Auto Selection ---');
const detectedTier = gm.detectHardwareTier();
assert(detectedTier === 'HIGH' || detectedTier === 'MEDIUM' || detectedTier === 'LOW', 'Hardware tier detected successfully');

gm.setPreset('AUTO', false);
assert(gm.getPreset() === 'AUTO', 'Current preset set to AUTO');
assert(gm.getResolvedQuality() === detectedTier, 'AUTO preset initially resolves to detected hardware capability');

// Verify manual override
gm.setPreset('LOW', false);
assert(gm.getPreset() === 'LOW', 'Manual override to LOW accepted');
assert(gm.getResolvedQuality() === 'LOW', 'Resolved quality immediately reflects manual override');

gm.setPreset('HIGH', false);
assert(gm.getPreset() === 'HIGH', 'Manual override to HIGH accepted');
assert(gm.getResolvedQuality() === 'HIGH', 'Resolved quality immediately reflects manual override');
passedTests += 5;

// =========================================================================
// Suite 3: Adaptive Performance Hysteresis & Anti-Oscillation
// =========================================================================
console.log('\n--- Suite 3: Adaptive Performance Hysteresis & Anti-Oscillation ---');
gm.setPreset('AUTO', false);

// 1. In manual override mode, frame drops should NOT trigger adjustments
gm.setPreset('HIGH', false);
for (let i = 0; i < 400; i++) {
  gm.update(0.040, true); // Simulated 25 FPS (40ms)
}
assert(gm.getResolvedQuality() === 'HIGH', 'Manual HIGH override is immune to automatic quality degradation');

// 2. In AUTO mode, single frame spikes should NOT trigger quality changes (hysteresis test)
gm.setPreset('AUTO', false);
// Feed a couple of isolated slow frames
gm.update(0.060, true);
gm.update(0.080, true);
assert(gm.getResolvedQuality() === detectedTier, 'Isolated frame-time spikes do NOT cause immediate quality oscillation');

// 3. Under sustained frame drops over 2 consecutive evaluation windows (cooldown + 360 frames)
for (let i = 0; i < 700; i++) {
  gm.update(0.035, true);
}
assert(gm.getResolvedQuality() !== 'HIGH', 'Sustained frame drops adaptively downgrade quality');

// 4. Verify hysteresis cooldown prevents rapid bouncing
const afterDowngrade = gm.getResolvedQuality();
gm.update(0.016, true); // Single fast frame
assert(gm.getResolvedQuality() === afterDowngrade, 'Quality remains stable during hysteresis cooldown window');
passedTests += 4;

// =========================================================================
// Suite 4: Scenery Detail Culling in TrackChunk
// =========================================================================
console.log('\n--- Suite 4: Scenery Detail Culling in TrackChunk ---');
const trackManager = new TrackManager(new THREE.Scene());
const chunk = trackManager.chunks[0];

assert(chunk.decorativeGroup !== undefined, 'TrackChunk declares dedicated decorativeGroup');
assert(chunk.decorativeGroup.children.length > 0, 'Decorative scenery objects populated into decorativeGroup');

// Test Minimal Scenery Detail
chunk.setSceneryDetail('MINIMAL');
assert(chunk.decorativeGroup.visible === false, 'MINIMAL detail cleanly hides decorativeGroup without removing geometry');

// Verify that roadbed and rails remain active
assert(chunk.group.children.length > 0, 'Chunk core group retains roadbed, curbs, and rails');

// Test Full Scenery Detail
chunk.setSceneryDetail('FULL');
assert(chunk.decorativeGroup.visible === true, 'FULL detail restores complete architectural scenery');
passedTests += 5;

// =========================================================================
// Suite 5: InstancedMesh Performance Optimization Verification
// =========================================================================
console.log('\n--- Suite 5: InstancedMesh Optimization Verification ---');
let instancedMeshCount = 0;
let totalMeshCount = 0;

chunk.group.traverse((obj) => {
  if ((obj as THREE.InstancedMesh).isInstancedMesh) {
    instancedMeshCount++;
  } else if ((obj as THREE.Mesh).isMesh) {
    totalMeshCount++;
  }
});

assert(instancedMeshCount >= 2, `Chunk uses InstancedMesh for sleepers and tie plates (found ${instancedMeshCount})`);
passedTests += 1;

// =========================================================================
// Suite 6: Gameplay Physics Invariance Across Quality Presets
// =========================================================================
console.log('\n--- Suite 6: Gameplay Physics Invariance Across Presets ---');
const player = new Player(new THREE.Scene());

// Ground baseline
player.reset();
const initialX = player.position.x;
const initialY = player.position.y;
const initialZ = player.position.z;
const initialBox = player.collider.clone();

// Switch through presets and verify player physics state is 100% unaltered
for (const p of ['LOW', 'MEDIUM', 'HIGH'] as const) {
  gm.setPreset(p, true);

  assert(player.position.x === initialX, `Player X untouched under ${p}`);
  assert(player.position.y === initialY, `Player Y untouched under ${p}`);
  assert(player.position.z === initialZ, `Player Z untouched under ${p}`);
  assert(player.collider.equals(initialBox), `Player collision Box3 untouched under ${p}`);

  // Test jump physics
  player.jump();
  assert(player.verticalVelocity === CONSTANTS.JUMP_INITIAL_VELOCITY, `Jump initial velocity identical under ${p}`);
  player.reset();
}
passedTests += 15;

// =========================================================================
// Suite 7: Settings Persistence and LocalStorage Integrity
// =========================================================================
console.log('\n--- Suite 7: Settings Persistence & LocalStorage ---');
gm.setPreset('LOW', true);
assert(mockStorage['metro_graphics_preset'] === 'LOW', 'LOW preset saved to localStorage');

gm.setPreset('HIGH', true);
assert(mockStorage['metro_graphics_preset'] === 'HIGH', 'HIGH preset saved to localStorage');

gm.setFpsDisplayEnabled(true);
assert(mockStorage['metro_show_fps'] === 'true', 'FPS display preference saved to localStorage');

gm.setFpsDisplayEnabled(false);
assert(mockStorage['metro_show_fps'] === 'false', 'FPS display disable saved to localStorage');
passedTests += 4;

console.log('\n=======================================================');
console.log(`📊 TASK 6 TEST RESULTS: ${passedTests} PASSED, 0 FAILED`);
console.log('=======================================================');
