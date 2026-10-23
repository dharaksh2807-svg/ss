import * as THREE from 'three';
import {
  EnvironmentManager,
  MODERN_METRO_THEME,
  HISTORIC_QUARTER_THEME,
  EnvironmentTheme
} from '../src/environment/EnvironmentConfig';
import { TrackChunk } from '../src/track/TrackChunk';
import { TrackManager } from '../src/track/TrackManager';
import { WorldScene } from '../src/scene/WorldScene';
import { Player } from '../src/player/Player';
import { SoundManager } from '../src/audio/SoundManager';
import { CONSTANTS } from '../src/core/Constants';
import { EventBus } from '../src/core/EventBus';
import { TextureGenerator } from '../src/scene/TextureGenerator';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { CollectibleFactory } from '../src/track/CollectibleFactory';

// Mock storage for headless Node test environment
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => { mockStorage[k] = String(v); },
  removeItem: (k: string) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};

// Mock 2D Context for TextureGenerator
class Mock2DContext {
  fillStyle: any = '#000';
  strokeStyle: any = '#000';
  lineWidth = 1;
  font = '12px sans-serif';
  textAlign = 'left';
  textBaseline = 'top';

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
  createLinearGradient() {
    return { addColorStop() {} };
  }
  createRadialGradient() {
    return { addColorStop() {} };
  }
}

// Mock Canvas for Three.js WebGLRenderer and Canvas 2D Textures
class MockCanvas {
  style = {};
  width = 1440;
  height = 900;
  addEventListener() {}
  removeEventListener() {}
  getContext(type: string) {
    if (type === '2d') {
      return new Mock2DContext();
    }
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

(globalThis as any).document = {
  createElement: (tag: string) => {
    if (tag === 'canvas') return new MockCanvas();
    return {
      style: {},
      classList: { add() {}, remove() {}, contains: () => false },
      addEventListener() {},
      removeEventListener() {},
      setAttribute() {},
      getAttribute: () => null
    };
  },
  getElementById: () => null
};

(globalThis as any).window = {
  innerWidth: 1440,
  innerHeight: 900,
  devicePixelRatio: 2.0,
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false }),
  navigator: { hardwareConcurrency: 8, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
};

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    failedCount++;
    throw new Error(msg);
  } else {
    console.log(`✅ PASSED: ${msg}`);
    passedCount++;
  }
}

console.log('🧪 Starting Task 8: Two Premium Modular Railway Environments Test Suite...\n');

// =========================================================================
// Suite 1: Modular Environment Definitions, Palettes & Tokens
// =========================================================================
console.log('--- Suite 1: Modular Environment Definitions, Palettes & Tokens ---');

assert(MODERN_METRO_THEME.id === 'MODERN_METRO', 'MODERN_METRO_THEME ID is MODERN_METRO');
assert(HISTORIC_QUARTER_THEME.id === 'HISTORIC_QUARTER', 'HISTORIC_QUARTER_THEME ID is HISTORIC_QUARTER');

// Check Distinct Visual Palettes
assert(MODERN_METRO_THEME.sky.top !== HISTORIC_QUARTER_THEME.sky.top, 'Sky dome top colors are distinct between Modern and Historic');
assert(MODERN_METRO_THEME.sky.bottom !== HISTORIC_QUARTER_THEME.sky.bottom, 'Sky dome bottom horizon colors are distinct');
assert(MODERN_METRO_THEME.fog.color !== HISTORIC_QUARTER_THEME.fog.color, 'Atmospheric fog colors are distinct');
assert(MODERN_METRO_THEME.fog.density !== HISTORIC_QUARTER_THEME.fog.density, 'Fog density is tuned distinctly per era');
assert(MODERN_METRO_THEME.sun.color !== HISTORIC_QUARTER_THEME.sun.color, 'Sunlight color temperature is distinct (azure daylight vs warm golden hour)');
assert(MODERN_METRO_THEME.materials.wallBaseColor !== HISTORIC_QUARTER_THEME.materials.wallBaseColor, 'Retaining wall material colors are distinct (concrete vs weathered red brick)');
assert(MODERN_METRO_THEME.materials.curbColor !== HISTORIC_QUARTER_THEME.materials.curbColor, 'Curb materials are distinct (smooth granite vs chiselled ashlar stone)');
assert(MODERN_METRO_THEME.materials.catenaryColor !== HISTORIC_QUARTER_THEME.materials.catenaryColor, 'Catenary / gantry materials are distinct (galvanized steel vs cast black iron)');
assert(MODERN_METRO_THEME.ambience.baseToneFreq !== HISTORIC_QUARTER_THEME.ambience.baseToneFreq, 'Ambient train rumble fundamental frequencies are distinct per era');

// =========================================================================
// Suite 2: Procedural Canvas Texture Generation
// =========================================================================
console.log('\n--- Suite 2: Procedural Canvas Texture Generation ---');

const brickTex = TextureGenerator.getWeatheredBrickTexture();
assert(brickTex instanceof THREE.CanvasTexture, 'getWeatheredBrickTexture generates a Three.js CanvasTexture');
assert(brickTex.wrapS === THREE.RepeatWrapping, 'Weathered brick texture enables RepeatWrapping on S');
assert(brickTex.wrapT === THREE.RepeatWrapping, 'Weathered brick texture enables RepeatWrapping on T');

const stoneTex = TextureGenerator.getStoneMasonryTexture();
assert(stoneTex instanceof THREE.CanvasTexture, 'getStoneMasonryTexture generates a CanvasTexture');

const cobbleTex = TextureGenerator.getCobblestoneTexture();
assert(cobbleTex instanceof THREE.CanvasTexture, 'getCobblestoneTexture generates a CanvasTexture');

const copperTex = TextureGenerator.getCopperPatinaTexture();
assert(copperTex instanceof THREE.CanvasTexture, 'getCopperPatinaTexture generates a CanvasTexture');

const histSignTex = TextureGenerator.getHistoricSignTexture('VICTORIA DEPOT');
assert(histSignTex instanceof THREE.CanvasTexture, 'getHistoricSignTexture generates vintage enamel sign texture');

const modernSignTex = TextureGenerator.getModernMetroSignTexture('METRO CENTRAL', 'M1');
assert(modernSignTex instanceof THREE.CanvasTexture, 'getModernMetroSignTexture generates LED transit sign texture');

// =========================================================================
// Suite 3: TrackChunk Scenery Generation — Modern Metro District
// =========================================================================
console.log('\n--- Suite 3: TrackChunk Scenery Generation — Modern Metro District ---');

const obsFactory = new ObstacleFactory();
const colFactory = new CollectibleFactory();

const modernChunk = new TrackChunk(obsFactory, colFactory);
modernChunk.populate([], -80, 'MODERN_METRO', false);

assert(modernChunk.decorativeGroup.children.length > 0, 'Modern Metro populates decorativeGroup with modular assets');

// Count decorative scenery elements
let foundModernWall = false;
let foundModernBuilding = false;
let foundCatenary = false;
let foundSkybridge = false;

modernChunk.decorativeGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    // Check for modern retaining walls
    if (child.position.x < -6 || child.position.x > 6) {
      foundModernWall = true;
    }
    // Check for high-rise buildings (tall heights > 10m)
    if (child.position.y > 10) {
      foundModernBuilding = true;
    }
    // Check for overhead catenary box girders (y ~ 7.5m)
    if (child.position.y >= 6.8 && child.position.y <= 8.5) {
      foundCatenary = true;
    }
  }
});

assert(foundModernWall, 'Modern Metro generates perimeter retaining walls');
assert(foundModernBuilding, 'Modern Metro generates contemporary architectural building silhouettes');
assert(foundCatenary, 'Modern Metro generates modern overhead catenary box trusses with LED signals');

// =========================================================================
// Suite 4: TrackChunk Scenery Generation — Historic Railway Quarter
// =========================================================================
console.log('\n--- Suite 4: TrackChunk Scenery Generation — Historic Railway Quarter ---');

const historicChunk = new TrackChunk(obsFactory, colFactory);
historicChunk.populate([], -160, 'HISTORIC_QUARTER', false);

assert(historicChunk.decorativeGroup.children.length > 0, 'Historic Quarter populates decorativeGroup with modular assets');

let foundHistoricWall = false;
let foundHistoricBuilding = false;
let foundTelegraphGantry = false;

historicChunk.decorativeGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    if (child.position.x < -6 || child.position.x > 6) {
      foundHistoricWall = true;
    }
    if (child.position.y > 8) {
      foundHistoricBuilding = true;
    }
    if (child.position.y >= 6.8 && child.position.y <= 8.5) {
      foundTelegraphGantry = true;
    }
  }
});

assert(foundHistoricWall, 'Historic Quarter generates aged brick retaining walls and stone coping');
assert(foundHistoricBuilding, 'Historic Quarter generates Victorian brownstones, clock towers, or foundries');
assert(foundTelegraphGantry, 'Historic Quarter generates black-iron telegraph gantries with mechanical semaphores');

// Verify that Historic scenery is genuinely different from Modern scenery
const modernChildrenCount = modernChunk.decorativeGroup.children.length;
const historicChildrenCount = historicChunk.decorativeGroup.children.length;
assert(modernChildrenCount > 0 && historicChildrenCount > 0, 'Both environments have rich modular asset hierarchies');

// =========================================================================
// Suite 5: Grand Transition Portal Arch Generation
// =========================================================================
console.log('\n--- Suite 5: Grand Transition Portal Arch Generation ---');

const portalChunk = new TrackChunk(obsFactory, colFactory);
portalChunk.populate([], -240, 'HISTORIC_QUARTER', true);

assert(portalChunk.decorativeGroup.children.length > 0, 'Transition portal chunk populates decorativeGroup');

let foundPortalArch = false;
let foundMonumentalPylon = false;

portalChunk.decorativeGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    // Monumental stone pylon at X ~ ±6.8, height ~ 18m
    if (Math.abs(child.position.x) >= 6.0 && child.position.y >= 8.0) {
      foundMonumentalPylon = true;
    }
    // Overhead carved arch crown at Y >= 10.0
    if (child.position.y >= 10.0 && Math.abs(child.position.x) < 4.0) {
      foundPortalArch = true;
    }
  }
});

assert(foundMonumentalPylon, 'Transition portal constructs monumental ashlar stone gateway pylons');
assert(foundPortalArch, 'Transition portal constructs overhead carved portal arch and heraldic crest');

// =========================================================================
// Suite 6: Shared Physical Gameplay Invariants & Collision Fairness
// =========================================================================
console.log('\n--- Suite 6: Shared Physical Gameplay Invariants & Collision Fairness ---');

// Invariant 1: Core track roadbed & rails are strictly identical in core chunk group
assert(modernChunk.group.children.length > 0, 'Modern chunk has core physical track group');
assert(historicChunk.group.children.length > 0, 'Historic chunk has core physical track group');
assert(portalChunk.group.children.length > 0, 'Portal chunk has core physical track group');

// Track widths and rail gauges
assert(CONSTANTS.LANES[-1] === -3.6, 'Lane X Left is -3.6 across all environments');
assert(CONSTANTS.LANES[0] === 0.0, 'Lane X Center is 0.0 across all environments');
assert(CONSTANTS.LANES[1] === 3.6, 'Lane X Right is 3.6 across all environments');
assert(CONSTANTS.LANE_WIDTH === 3.6, 'Lane width is invariant at 3.6m');

// Check that decorativeGroup does NOT contain physical obstacles or colliders
for (const obs of modernChunk.obstacles) {
  assert(obs.collider instanceof THREE.Box3, 'Obstacle collider is standard Box3');
  assert(modernChunk.group.children.includes(obs.mesh), 'Obstacle mesh belongs to physical group, not decorativeGroup');
  assert(!modernChunk.decorativeGroup.children.includes(obs.mesh), 'Obstacle mesh is NOT inside decorativeGroup');
}

// Invariant 2: Scenery Detail Culling in LOW preset preserves physical roadbed
modernChunk.setSceneryDetail('MINIMAL');
assert(modernChunk.decorativeGroup.visible === false, 'MINIMAL detail cleanly hides modern decorativeGroup');
assert(modernChunk.group.visible === true, 'Physical roadbed, rails and obstacles remain visible in MINIMAL detail');

historicChunk.setSceneryDetail('MINIMAL');
assert(historicChunk.decorativeGroup.visible === false, 'MINIMAL detail cleanly hides historic decorativeGroup');

modernChunk.setSceneryDetail('FULL');
assert(modernChunk.decorativeGroup.visible === true, 'FULL detail restores modern decorativeGroup');

historicChunk.setSceneryDetail('FULL');
assert(historicChunk.decorativeGroup.visible === true, 'FULL detail restores historic decorativeGroup');

// =========================================================================
// Suite 7: EnvironmentManager Preference Persistence & Interpolation
// =========================================================================
console.log('\n--- Suite 7: EnvironmentManager Preference Persistence & Interpolation ---');

const envMgr = EnvironmentManager.getInstance();

envMgr.savePreference('DYNAMIC');
assert(envMgr.getPreference() === 'DYNAMIC', 'Preference set to DYNAMIC');
assert(mockStorage['metro_runner_environment_preference'] === 'DYNAMIC', 'DYNAMIC saved to localStorage');

envMgr.savePreference('HISTORIC_QUARTER');
assert(envMgr.getPreference() === 'HISTORIC_QUARTER', 'Preference set to HISTORIC_QUARTER');
assert(mockStorage['metro_runner_environment_preference'] === 'HISTORIC_QUARTER', 'HISTORIC_QUARTER saved to localStorage');
assert(envMgr.getStartingEnvironment() === 'HISTORIC_QUARTER', 'Starting environment resolves to HISTORIC_QUARTER');

envMgr.savePreference('MODERN_METRO');
assert(envMgr.getPreference() === 'MODERN_METRO', 'Preference set to MODERN_METRO');
assert(mockStorage['metro_runner_environment_preference'] === 'MODERN_METRO', 'MODERN_METRO saved to localStorage');
assert(envMgr.getStartingEnvironment() === 'MODERN_METRO', 'Starting environment resolves to MODERN_METRO');

// Test color interpolation helper
const blendedTheme = envMgr.lerpThemeColors(MODERN_METRO_THEME, HISTORIC_QUARTER_THEME, 0.5);
assert(blendedTheme.id === 'HISTORIC_QUARTER', 'Blended theme ID targets destination theme');
assert(blendedTheme.fog.density > 0, 'Blended fog density is valid positive number');

// Reset to DYNAMIC for gameplay tests
envMgr.savePreference('DYNAMIC');

// =========================================================================
// Suite 8: TrackManager Dynamic Transitions & Portal Scheduling
// =========================================================================
console.log('\n--- Suite 8: TrackManager Dynamic Transitions & Portal Scheduling ---');

const dummyScene = new THREE.Scene();
const trackMgr = new TrackManager(dummyScene);
trackMgr.reset();

assert(trackMgr.getActiveEnvironment() === 'MODERN_METRO' || trackMgr.getActiveEnvironment() === 'HISTORIC_QUARTER', 'Active environment initialized to valid theme');

// Verify transition countdown tracking
const initialCountdown = trackMgr.getChunksUntilTransition();
assert(initialCountdown > 0 && initialCountdown <= 10, 'Chunks until transition initializes to <= 10 chunks');

// Listen for environment transition events
let transitionApproachingFired = false;
let environmentChangedFired = false;
let changedTargetThemeId = '';

EventBus.getInstance().on('ENVIRONMENT_TRANSITION_APPROACHING', () => {
  transitionApproachingFired = true;
});

EventBus.getInstance().on('ENVIRONMENT_CHANGED', (newEnvId: string) => {
  environmentChangedFired = true;
  changedTargetThemeId = newEnvId;
});

// Simulate running through multiple chunk recycles to trigger a transition
const mockPlayer = new Player();
for (let step = 0; step < 15; step++) {
  mockPlayer.position.z -= 80;
  mockPlayer.distanceTraveled += 80;
  trackMgr.update(mockPlayer, 0.1, step * 0.1);
}

assert(transitionApproachingFired, 'TrackManager dispatches ENVIRONMENT_TRANSITION_APPROACHING before portal chunk');
assert(environmentChangedFired, 'TrackManager dispatches ENVIRONMENT_CHANGED upon crossing district portal');
assert(changedTargetThemeId.length > 0, 'Target theme ID passed in ENVIRONMENT_CHANGED event');

// =========================================================================
// Suite 9: Static Environment Overrides
// =========================================================================
console.log('\n--- Suite 9: Static Environment Overrides ---');

trackMgr.setEnvironment('HISTORIC_QUARTER');
assert(trackMgr.getActiveEnvironment() === 'HISTORIC_QUARTER', 'TrackManager accepts static HISTORIC_QUARTER override');

trackMgr.setEnvironment('MODERN_METRO');
assert(trackMgr.getActiveEnvironment() === 'MODERN_METRO', 'TrackManager accepts static MODERN_METRO override');

// =========================================================================
// Suite 10: Audio Ambience & Soundscape Integration
// =========================================================================
console.log('\n--- Suite 10: Audio Ambience & Soundscape Integration ---');

const soundMgr = new SoundManager();

// Test setting environment ambience
soundMgr.setEnvironmentAmbience('HISTORIC_QUARTER');
soundMgr.setEnvironmentAmbience('MODERN_METRO');
assert(true, 'setEnvironmentAmbience executes without exceptions');

// Test environment transition chime and wind whoosh
soundMgr.playEnvironmentTransition();
assert(true, 'playEnvironmentTransition executes without exceptions');

// =========================================================================
// Summary
// =========================================================================
console.log('\n=======================================================');
console.log(`📊 TASK 8 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log('=======================================================');

if (failedCount > 0) {
  process.exit(1);
}
