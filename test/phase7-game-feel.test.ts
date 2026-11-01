import * as THREE from 'three';
import { SoundManager } from '../src/audio/SoundManager';
import { LocomotionVFX } from '../src/scene/LocomotionVFX';
import { CameraController } from '../src/scene/CameraController';
import { CharacterModel } from '../src/player/CharacterModel';
import { HUD } from '../src/ui/HUD';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { SettingsManager } from '../src/settings/SettingsManager';

// =========================================================================
// Web Audio API Mock for Node.js Testing Environment
// =========================================================================

class MockAudioParam {
  public value: number;
  public defaultValue: number;
  private scheduledValues: Array<{ type: string; val?: number; time: number }> = [];

  constructor(defaultValue: number = 1) {
    this.value = defaultValue;
    this.defaultValue = defaultValue;
  }

  setValueAtTime(val: number, time: number): void {
    this.value = val;
    this.scheduledValues.push({ type: 'setValueAtTime', val, time });
  }

  linearRampToValueAtTime(val: number, time: number): void {
    this.value = val;
    this.scheduledValues.push({ type: 'linearRampToValueAtTime', val, time });
  }

  exponentialRampToValueAtTime(val: number, time: number): void {
    this.value = val;
    this.scheduledValues.push({ type: 'exponentialRampToValueAtTime', val, time });
  }

  setTargetAtTime(val: number, time: number, _constant: number): void {
    this.value = val;
    this.scheduledValues.push({ type: 'setTargetAtTime', val, time });
  }

  cancelScheduledValues(_time: number): void {
    this.scheduledValues = [];
  }
}

class MockAudioNode {
  public connectedTo: any[] = [];
  connect(dest: any): any {
    this.connectedTo.push(dest);
    return dest;
  }
  disconnect(): void {
    this.connectedTo = [];
  }
}

class MockGainNode extends MockAudioNode {
  public gain = new MockAudioParam(1);
}

class MockBiquadFilterNode extends MockAudioNode {
  public type: string = 'lowpass';
  public frequency = new MockAudioParam(1000);
  public Q = new MockAudioParam(1);
}

class MockDynamicsCompressorNode extends MockAudioNode {
  public threshold = new MockAudioParam(-16);
  public knee = new MockAudioParam(12);
  public ratio = new MockAudioParam(4);
  public attack = new MockAudioParam(0.003);
  public release = new MockAudioParam(0.25);
}

class MockStereoPannerNode extends MockAudioNode {
  public pan = new MockAudioParam(0);
}

class MockOscillatorNode extends MockAudioNode {
  public type: string = 'sine';
  public frequency = new MockAudioParam(440);
  public started: boolean = false;
  public stopped: boolean = false;

  start(_time?: number): void {
    this.started = true;
  }
  stop(_time?: number): void {
    this.stopped = true;
  }
}

class MockAudioBufferSourceNode extends MockAudioNode {
  public buffer: any = null;
  public loop: boolean = false;
  public started: boolean = false;
  public stopped: boolean = false;

  start(_time?: number): void {
    this.started = true;
  }
  stop(_time?: number): void {
    this.stopped = true;
  }
}

class MockAudioContext {
  public state: string = 'running';
  public currentTime: number = 0;
  public sampleRate: number = 44100;
  public destination: MockAudioNode = new MockAudioNode();
  public createBufferCalls: number = 0;

  createGain(): MockGainNode {
    return new MockGainNode();
  }
  createBiquadFilter(): MockBiquadFilterNode {
    return new MockBiquadFilterNode();
  }
  createDynamicsCompressor(): MockDynamicsCompressorNode {
    return new MockDynamicsCompressorNode();
  }
  createStereoPanner(): MockStereoPannerNode {
    return new MockStereoPannerNode();
  }
  createOscillator(): MockOscillatorNode {
    return new MockOscillatorNode();
  }
  createBuffer(channels: number, length: number, sampleRate: number): any {
    this.createBufferCalls++;
    const data = new Float32Array(length);
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: () => data
    };
  }
  createBufferSource(): MockAudioBufferSourceNode {
    return new MockAudioBufferSourceNode();
  }
  resume(): Promise<void> {
    this.state = 'running';
    return Promise.resolve();
  }
  close(): Promise<void> {
    this.state = 'closed';
    return Promise.resolve();
  }
}

import { CharacterPortraitRenderer } from '../src/ui/CharacterPortraitRenderer';

// Global Mocks for Node Environment
const storageMock: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => storageMock[k] || null,
  setItem: (k: string, v: string) => { storageMock[k] = v; },
  removeItem: (k: string) => { delete storageMock[k]; },
  clear: () => { for (const k in storageMock) delete storageMock[k]; }
};

const mockElements: Map<string, any> = new Map();
function createMockElement(id: string = '', tag: string = 'div'): any {
  const el: any = {
    id,
    tagName: tag.toUpperCase(),
    className: '',
    children: [] as any[],
    style: {} as any,
    classList: {
      _classes: new Set<string>(),
      add: (c: string) => el.classList._classes.add(c),
      remove: (c: string) => el.classList._classes.delete(c),
      contains: (c: string) => el.classList._classes.has(c),
      toggle: (c: string, force?: boolean) => {
        if (force === undefined) {
          if (el.classList._classes.has(c)) el.classList._classes.delete(c);
          else el.classList._classes.add(c);
        } else if (force) {
          el.classList._classes.add(c);
        } else {
          el.classList._classes.delete(c);
        }
      }
    },
    innerHTML: '',
    textContent: '',
    appendChild: (child: any) => {
      child.parentElement = el;
      el.children.push(child);
      return child;
    },
    removeChild: (child: any) => {
      const idx = el.children.indexOf(child);
      if (idx !== -1) {
        el.children.splice(idx, 1);
        child.parentElement = null;
      }
      return child;
    },
    querySelector: (selector: string) => {
      const cls = selector.replace('.', '');
      return el.children.find((c: any) => c.className?.includes(cls)) || null;
    },
    getContext: () => ({
      getExtension: () => null,
      getParameter: () => 0,
      createTexture: () => ({}),
      bindTexture: () => {},
      texParameteri: () => {},
      viewport: () => {},
      clear: () => {}
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 100, height: 100 })
  };
  return el;
}

(globalThis as any).document = {
  getElementById: (id: string) => {
    if (!mockElements.has(id)) {
      mockElements.set(id, createMockElement(id));
    }
    return mockElements.get(id);
  },
  createElement: (tag: string) => createMockElement('', tag),
  body: createMockElement('body')
};

(globalThis as any).window = {
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext,
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};

let passed = 0;
let total = 0;

function assert(condition: boolean, msg: string): void {
  total++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  passed++;
  console.log(`✅ PASSED: ${msg}`);
}

console.log('🧪 Starting Phase 7: Game Feel, Audio & Feedback Polish Test Suite...\n');

// =========================================================================
// Suite 1: Audio Polish, Shared Buffers & Cooldown Management
// =========================================================================
console.log('--- Suite 1: Audio Polish, Shared Buffers & Cooldown Management ---');

const soundManager = new SoundManager();
soundManager.initAudio();

const mockCtx = (soundManager as any).ctx as MockAudioContext;
assert(mockCtx !== null, 'AudioContext initialized cleanly');

const bufferCountAfterInit = mockCtx.createBufferCalls;
assert(bufferCountAfterInit > 0, 'Shared noise buffer pre-warmed during init');

// Trigger 15 consecutive footsteps on GROUND
for (let i = 0; i < 15; i++) {
  (soundManager as any).playFootstep('GROUND');
}
assert(
  mockCtx.createBufferCalls === bufferCountAfterInit,
  'Footsteps reuse shared noise buffer without creating per-step AudioBuffers'
);

// Trigger slide loop
(soundManager as any).startSlideLoop();
assert(
  mockCtx.createBufferCalls === bufferCountAfterInit,
  'Slide friction loop reuses shared noise buffer without allocating'
);
soundManager.stopSlide();

// Test Crash sound debounce rate limiter
mockCtx.currentTime = 10.0;
soundManager.playCrash();
assert((soundManager as any).lastCrashTime === 10.0, 'First crash sound plays at currentTime 10.0s');

mockCtx.currentTime = 10.2; // 200ms later (well within 600ms debounce)
soundManager.playCrash();
assert(
  (soundManager as any).lastCrashTime === 10.0,
  'Duplicate rapid crash at 10.2s blocked by debounce to prevent distorted stacking'
);

mockCtx.currentTime = 10.7; // 700ms later (cooldown elapsed)
soundManager.playCrash();
assert((soundManager as any).lastCrashTime === 10.7, 'Subsequent crash plays cleanly after cooldown');

// Test Revive event handler
soundManager.setMusicState('GAME_OVER');
EventBus.getInstance().emit(EVENTS.REVIVE_EXECUTED);
assert(
  (soundManager as any).musicState === 'RUNNING_NORMAL',
  'REVIVE_EXECUTED restores soundtrack back to RUNNING_NORMAL'
);
assert((soundManager as any).lastCrashTime === -999, 'REVIVE_EXECUTED resets crash cooldown');

// Test Pause loop silencing
(soundManager as any).isSlidingLoopActive = true;
EventBus.getInstance().emit(EVENTS.GAME_PAUSE);
assert((soundManager as any).isSlidingLoopActive === false, 'GAME_PAUSE immediately silences sliding loop');

EventBus.getInstance().emit(EVENTS.GO_TO_LOBBY);
assert((soundManager as any).musicState === 'LOBBY', 'GO_TO_LOBBY transitions soundtrack cleanly to LOBBY');

soundManager.dispose();

// =========================================================================
// Suite 2: Camera Motion Feedback & Accessibility
// =========================================================================
console.log('\n--- Suite 2: Camera Motion Feedback & Accessibility ---');

const settings = SettingsManager.getInstance();
settings.resetAllToDefaults();

const camera = new CameraController();
camera.setLobbyMode(false);

// Near Miss camera shake
EventBus.getInstance().emit(EVENTS.NEAR_MISS);
assert(camera.getShakeTrauma() > 0.05, 'NEAR_MISS triggers subtle tactile camera shake');

// Reduced Motion Accessibility
settings.setReducedMotion(true);

camera.addShake(0.6);
assert(camera.getShakeTrauma() === 0, 'addShake rejected when Reduced Motion is enabled');

EventBus.getInstance().emit(EVENTS.LAND, { isFastDrop: true, surface: 'GROUND' });
assert((camera as any).landingDipOffset === 0, 'Landing dip eliminated when Reduced Motion is enabled');

// Check FOV during high speed running with reduced motion
const playerPos = new THREE.Vector3(0, 0, 0);
camera.update(playerPos, 0.016, 1.0, 48.0, 0, true, false);
assert(
  Math.abs(camera.camera.fov - 60.0) < 0.2,
  'High-speed FOV expansion disabled when Reduced Motion is enabled'
);

// Reset settings to normal
settings.resetAllToDefaults();

// Roof landing vs ground landing shake
const camGround = new CameraController();
EventBus.getInstance().emit(EVENTS.LAND, { isFastDrop: false, surface: 'GROUND' });
const groundShake = camGround.getShakeTrauma();

const camRoof = new CameraController();
EventBus.getInstance().emit(EVENTS.LAND, { isFastDrop: false, surface: 'TRAIN_ROOF' });
const roofShake = camRoof.getShakeTrauma();

assert(roofShake > groundShake, 'TRAIN_ROOF landing produces crisper tactile impact than GROUND');

// =========================================================================
// Suite 3: Controlled Pooled VFX Systems
// =========================================================================
console.log('\n--- Suite 3: Controlled Pooled VFX Systems ---');

const scene = new THREE.Scene();
const vfx = new LocomotionVFX(scene);

// Coin pickup sparkles
EventBus.getInstance().emit(EVENTS.COIN_COLLECTED, { position: new THREE.Vector3(0, 1, -10) });
const activeCoins = (vfx as any).coinBurstPool.filter((p: any) => p.active);
assert(activeCoins.length > 0, 'COIN_COLLECTED spawns golden sparkle burst');
assert(activeCoins[0].mesh.visible === true, 'Coin sparkle mesh made visible');

// Advance past maxAge
vfx.update(0.30);
const remainingCoins = (vfx as any).coinBurstPool.filter((p: any) => p.active);
assert(remainingCoins.length === 0, 'Coin sparkle particles cleanly dissolve after maxAge');

// Jump takeoff puff
EventBus.getInstance().emit(EVENTS.JUMP, { position: new THREE.Vector3(0, 0, -5) });
const activeTakeoff = (vfx as any).takeoffPool.filter((p: any) => p.active);
assert(activeTakeoff.length > 0, 'JUMP spawns takeoff dust puff at runner feet');

// Near miss slipstream streak
EventBus.getInstance().emit(EVENTS.NEAR_MISS, { position: new THREE.Vector3(0, 0, -5) });
const activeStreaks = (vfx as any).streakPool.filter((p: any) => p.active);
assert(activeStreaks.length > 0, 'NEAR_MISS spawns aerodynamic slipstream speed streak');

// Impact sparks on collision
EventBus.getInstance().emit(EVENTS.CRASH, { position: new THREE.Vector3(0, 0, -15) });
const activeSparks = (vfx as any).impactPool.filter((p: any) => p.active);
assert(activeSparks.length > 0, 'CRASH spawns energetic impact sparks');

// Energy shockwave ring on powerup
EventBus.getInstance().emit(EVENTS.POWERUP_ACTIVATED, 'SHIELD', { position: new THREE.Vector3(0, 0, 0) });
const activeRings = (vfx as any).energyRingPool.filter((p: any) => p.active);
assert(activeRings.length > 0, 'POWERUP_ACTIVATED spawns expanding shockwave ring');

// Verify reset cleans up all pools
vfx.reset();
const allPools = [
  (vfx as any).landingPool,
  (vfx as any).slidePool,
  (vfx as any).footfallPool,
  (vfx as any).coinBurstPool,
  (vfx as any).impactPool,
  (vfx as any).energyRingPool,
  (vfx as any).takeoffPool,
  (vfx as any).streakPool
];
let totalActiveAfterReset = 0;
for (const p of allPools) {
  totalActiveAfterReset += p.filter((item: any) => item.active).length;
}
assert(totalActiveAfterReset === 0, 'LocomotionVFX.reset() deactivates all particles across all 8 pools');

vfx.dispose();

// =========================================================================
// Suite 4: CharacterModel Movement Feel & Coordination
// =========================================================================
console.log('\n--- Suite 4: CharacterModel Movement Feel & Coordination ---');

const model = new CharacterModel('char_jax');

// Test lane banking body coordination
model.updateAnimation('RUN', 22.0, 0.28, 0, 0.016);
assert((model as any).targetHeadRot.z < 0, 'Head roll counter-stabilizes during lane banking');
assert((model as any).targetHipsRot.z < 0, 'Hips roll dynamically with runner weight transfer');

// Test streamlined fast-drop posture
model.updateAnimation('JUMP', 22.0, 0, 0, 0.016, 'FAST_DROP', 0.5);
assert((model as any).targetSpineRot.x > 0.35, 'Fast drop posture adopts streamlined aerodynamic dive spine angle');
assert((model as any).targetHeadRot.x > 0.15, 'Fast drop head angles downward into dive');

// model is automatically GC'd

// =========================================================================
// Suite 5: HUD Feedback Timing & Cleanup Lifecycle
// =========================================================================
console.log('\n--- Suite 5: HUD Feedback Timing & Cleanup Lifecycle ---');

(CharacterPortraitRenderer as any).instance = {
  syncFromProgression: () => {},
  render: () => {}
};

const powerupManagerMock = {
  getActivePowerups: () => []
} as any;
const hud = new HUD(powerupManagerMock);

// Progression toast deduplication
hud.showProgressionToast('DAILY', 'COLLECT 100 COINS', '+100 🪙');
hud.showProgressionToast('DAILY', 'COLLECT 100 COINS', '+100 🪙');

const toastContainer = document.getElementById('hud-toast-container');
assert(toastContainer?.children.length === 1, 'Progression toasts deduplicated against identical active items');

// Visual hazard cue deduplication
hud.showVisualHazardCue('⚠️ DANGER AHEAD!', 'warning');
hud.showVisualHazardCue('⚠️ DANGER AHEAD!', 'warning');
const hazardCue = document.getElementById('hud-hazard-cue');
assert(hazardCue?.textContent === '⚠️ DANGER AHEAD!', 'Visual hazard cue set without duplicate element spam');

// Cleanup on GO_TO_LOBBY
assert((hud as any).activeTimeouts.size > 0, 'Active timeouts registered through safeTimeout');
EventBus.getInstance().emit(EVENTS.GO_TO_LOBBY);
assert((hud as any).activeTimeouts.size === 0, 'GO_TO_LOBBY clears all active HUD timeouts');
assert(toastContainer?.innerHTML === '', 'GO_TO_LOBBY clears active toast DOM container');

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${passed} / ${total} PHASE 7 GAME FEEL & POLISH TESTS PASSED!`);
console.log(`=======================================================`);
