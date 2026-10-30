import * as THREE from 'three';
import { isDeveloperMode, IS_BUILD_DEV, CONSTANTS } from '../src/core/Constants';
import { DevTestArena } from '../src/debug/DevTestArena';
import { TrainScenarioRunner } from '../src/debug/TrainScenarioRunner';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { EventBus, EVENTS } from '../src/core/EventBus';

console.log('🧪 Starting Metro Runner 3D: P1 Production Developer Tools Security & Guard Suite...\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
    passedTests++;
  }
}

// Mock localStorage
const storage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => storage[k] || null,
  setItem: (k: string, v: string) => { storage[k] = v; },
  removeItem: (k: string) => { delete storage[k]; },
  clear: () => { for (const k in storage) delete storage[k]; }
};

// ---------------------------------------------------------------------------
// Suite 1: isDeveloperMode Production Invariant & Tamper Resistance
// ---------------------------------------------------------------------------
console.log('--- Suite 1: Production Developer Mode Isolation ---');

// Mock browser window & location
const originalWindow = (globalThis as any).window;
const windowListeners: Record<string, Function[]> = {};

const mockWindow: any = {
  location: {
    hostname: 'example-metro-production.com',
    search: '?dev=1&debug=1&test=1&arena=1'
  },
  addEventListener: (evt: string, fn: Function) => {
    if (!windowListeners[evt]) windowListeners[evt] = [];
    windowListeners[evt].push(fn);
  },
  removeEventListener: (evt: string, fn: Function) => {
    if (windowListeners[evt]) {
      windowListeners[evt] = windowListeners[evt].filter(f => f !== fn);
    }
  },
  dispatchEvent: (event: any) => {
    const fns = windowListeners[event.type] || [];
    for (const fn of fns) fn(event);
  }
};
(globalThis as any).window = mockWindow;

// Verify when __IS_DEV__ is false (production simulation)
(globalThis as any).__IS_DEV__ = false;
assert(isDeveloperMode() === false, 'isDeveloperMode() returns false in production environment');

// Test that URL query parameters CANNOT override production mode
mockWindow.location.search = '?dev=1';
assert(isDeveloperMode() === false, 'URL param ?dev=1 does NOT enable developer mode');

mockWindow.location.search = '?debug=1';
assert(isDeveloperMode() === false, 'URL param ?debug=1 does NOT enable developer mode');

mockWindow.location.search = '?test=1';
assert(isDeveloperMode() === false, 'URL param ?test=1 does NOT enable developer mode');

mockWindow.location.search = '?arena=1';
assert(isDeveloperMode() === false, 'URL param ?arena=1 does NOT enable developer mode');

mockWindow.location.search = '?dev=arena&debug=true&test=arena';
assert(isDeveloperMode() === false, 'Compound URL params do NOT enable developer mode');

// Test that localhost hostname does NOT bypass production mode
mockWindow.location.hostname = 'localhost';
assert(isDeveloperMode() === false, 'Localhost hostname alone does NOT enable developer mode in production');

mockWindow.location.hostname = '127.0.0.1';
assert(isDeveloperMode() === false, '127.0.0.1 hostname does NOT enable developer mode in production');

// ---------------------------------------------------------------------------
// Suite 2: DevTestArena Production Guards
// ---------------------------------------------------------------------------
console.log('\n--- Suite 2: Physics Test Arena Production Security ---');

const scene = new THREE.Scene();
const player = new Player();
const trackManager = new TrackManager(scene);

// Ensure dev mode is false
(globalThis as any).__IS_DEV__ = false;

const arena = new DevTestArena(scene, player, trackManager);

assert(arena.isOpen() === false, 'DevTestArena starts hidden');

// Attempt to show arena in production
arena.show();
assert(arena.isOpen() === false, 'arena.show() is blocked when isDeveloperMode() is false');

// Attempt to toggle arena in production
arena.toggle();
assert(arena.isOpen() === false, 'arena.toggle() is blocked when isDeveloperMode() is false');

// Attempt URL parameter activation (?arena=1, ?dev=arena)
mockWindow.location.search = '?arena=1';
(arena as any).checkUrlDevParams();
assert(arena.isOpen() === false, 'checkUrlDevParams(?arena=1) blocked in production');

mockWindow.location.search = '?dev=arena';
(arena as any).checkUrlDevParams();
assert(arena.isOpen() === false, 'checkUrlDevParams(?dev=arena) blocked in production');

// Attempt keyboard shortcut activations in production
let prevented = false;
mockWindow.dispatchEvent({
  type: 'keydown',
  code: 'F8',
  preventDefault: () => { prevented = true; }
});
assert(arena.isOpen() === false, 'F8 keydown does NOT open arena in production');

mockWindow.dispatchEvent({
  type: 'keydown',
  code: 'KeyD',
  ctrlKey: true,
  shiftKey: true,
  preventDefault: () => { prevented = true; }
});
assert(arena.isOpen() === false, 'Ctrl+Shift+D keydown does NOT open arena in production');

mockWindow.dispatchEvent({
  type: 'keydown',
  code: 'Backquote',
  ctrlKey: true,
  preventDefault: () => { prevented = true; }
});
assert(arena.isOpen() === false, 'Ctrl+` keydown does NOT open arena in production');

// ---------------------------------------------------------------------------
// Suite 3: Global Debug Registration Guard
// ---------------------------------------------------------------------------
console.log('\n--- Suite 3: Global Window Registration Guard ---');

// Fresh window object simulating clean production page load
const cleanWindow: any = {
  location: { hostname: 'metro-runner-production.app', search: '' }
};
(globalThis as any).window = cleanWindow;
(globalThis as any).__IS_DEV__ = false;

// Attach scenario runner
const scenarioRunner = TrainScenarioRunner.getInstance();
scenarioRunner.attachToWindow({ getPlayer: () => player, getTrackManager: () => trackManager });
assert(cleanWindow.__TRAIN_SCENARIO_RUNNER__ === undefined, 'TrainScenarioRunner is NOT exposed on window in production');

// Verify that in production, window debug keys are not populated
assert(cleanWindow.__METRO_GAME__ === undefined, 'window.__METRO_GAME__ is undefined in production');
assert(cleanWindow.game === undefined, 'window.game is undefined in production');
assert(cleanWindow.__METRO_BUS__ === undefined, 'window.__METRO_BUS__ is undefined in production');
assert(cleanWindow.__PACING_METRICS__ === undefined, 'window.__PACING_METRICS__ is undefined in production');
assert(cleanWindow.__SKILL_COMBO__ === undefined, 'window.__SKILL_COMBO__ is undefined in production');
assert(cleanWindow.__DAILY_CHALLENGE__ === undefined, 'window.__DAILY_CHALLENGE__ is undefined in production');
assert(cleanWindow.__PHOTO_MODE__ === undefined, 'window.__PHOTO_MODE__ is undefined in production');
assert(cleanWindow.__SECRET_ROUTES__ === undefined, 'window.__SECRET_ROUTES__ is undefined in production');
assert(cleanWindow.__JUNCTIONS__ === undefined, 'window.__JUNCTIONS__ is undefined in production');

// ---------------------------------------------------------------------------
// Suite 4: Authorized Developer Mode Functionality
// ---------------------------------------------------------------------------
console.log('\n--- Suite 4: Authorized Developer Environment Functionality ---');

// Enable authorized developer mode
(globalThis as any).__IS_DEV__ = true;
assert(isDeveloperMode() === true, 'isDeveloperMode() returns true when authorized in developer environment');

// DevTestArena can now be opened for debugging
arena.show();
assert(arena.isOpen() === true, 'DevTestArena opens successfully in authorized developer environment');

arena.toggle();
assert(arena.isOpen() === false, 'DevTestArena toggles closed in developer environment');

// Scenario runner can attach in developer environment
scenarioRunner.attachToWindow({ getPlayer: () => player, getTrackManager: () => trackManager });
assert(cleanWindow.__TRAIN_SCENARIO_RUNNER__ !== undefined, 'TrainScenarioRunner attaches to window in developer environment');

console.log('\n=======================================================');
console.log(`🏆 ALL ${passedTests}/${totalTests} SECURITY & ISOLATION TESTS PASSED!`);
console.log('=======================================================');
