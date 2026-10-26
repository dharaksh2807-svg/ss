import * as THREE from 'three';
import { Player } from '../src/player/Player';
import { CameraController } from '../src/scene/CameraController';
import { ObstacleFactory, ObstacleInstance } from '../src/track/ObstacleFactory';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { BugSnapshotManager } from '../src/debug/BugSnapshotManager';
import { DevBugReportModal } from '../src/ui/DevBugReportModal';
import { ReviveManager } from '../src/revive/ReviveManager';
import { BugSnapshotPackage } from '../src/debug/BugSnapshotTypes';

console.log('🧪 Starting Metro Runner 3D: No Auto-Open Crash Report Verification Suite...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
  }
  passedTests++;
}

// In-memory mock localStorage
const storageMock: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, val: string) => { storageMock[key] = val; },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => {
    for (const k in storageMock) delete storageMock[k];
  },
  key: (i: number) => Object.keys(storageMock)[i] || null,
  length: Object.keys(storageMock).length
};

// DOM Mock Element Hierarchy
class MockElement {
  private _className: string = '';
  public get className(): string {
    return this._className;
  }
  public set className(val: string) {
    this._className = val;
    this.classList._classes = new Set(val.split(/\s+/).filter(Boolean));
  }
  public innerHTML: string = '';
  public textContent: string = '';
  public style: Record<string, string> = {};
  public attributes: Record<string, string> = {};
  public children: MockElement[] = [];
  public parentElement: MockElement | null = null;
  public eventListeners: Record<string, Array<(...args: any[]) => void>> = {};

  public classList = {
    _classes: new Set<string>(),
    add: (...tokens: string[]) => {
      tokens.forEach(t => this.classList._classes.add(t));
      this.className = Array.from(this.classList._classes).join(' ');
    },
    remove: (...tokens: string[]) => {
      tokens.forEach(t => this.classList._classes.delete(t));
      this.className = Array.from(this.classList._classes).join(' ');
    },
    contains: (token: string) => this.classList._classes.has(token),
    toggle: (token: string) => {
      if (this.classList.contains(token)) {
        this.classList.remove(token);
        return false;
      } else {
        this.classList.add(token);
        return true;
      }
    }
  };

  constructor(id: string = '') {
    this.id = id;
  }

  public appendChild(child: MockElement) {
    this.children.push(child);
    child.parentElement = this;
    return child;
  }

  public removeChild(child: MockElement) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentElement = null;
    }
    return child;
  }

  public addEventListener(event: string, handler: (...args: any[]) => void) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(handler);
  }

  public dispatchEvent(event: string, ...args: any[]) {
    if (this.eventListeners[event]) {
      for (const fn of this.eventListeners[event]) {
        fn(...args);
      }
    }
  }

  public click() {
    this.dispatchEvent('click', { type: 'click' });
  }

  public querySelector(selector: string): MockElement | null {
    if (selector.startsWith('#')) {
      const targetId = selector.slice(1);
      if (this.id === targetId) return this;
      for (const child of this.children) {
        const found = child.querySelector(selector);
        if (found) return found;
      }
      // If innerHTML was rendered, parse known buttons
      return mockDOMRegistry[targetId] || null;
    }
    return null;
  }
}

const mockDOMRegistry: Record<string, MockElement> = {};
const uiOverlay = new MockElement('ui-overlay');
mockDOMRegistry['ui-overlay'] = uiOverlay;

const windowListeners: Record<string, Array<(e: any) => void>> = {};
(globalThis as any).window = {
  localStorage: globalThis.localStorage,
  addEventListener: (event: string, handler: (e: any) => void) => {
    if (!windowListeners[event]) windowListeners[event] = [];
    windowListeners[event].push(handler);
  },
  setTimeout: (fn: Function) => fn(),
  clearTimeout: () => {}
};

(globalThis as any).document = {
  body: new MockElement('body'),
  querySelector: (sel: string) => {
    return null;
  },
  getElementById: (id: string) => {
    return mockDOMRegistry[id] || null;
  },
  createElement: (tag: string) => {
    const el = new MockElement();
    // Intercept setter for id
    return new Proxy(el, {
      set(target, prop, value) {
        if (prop === 'id') {
          mockDOMRegistry[value] = target;
        } else if (prop === 'innerHTML') {
          target.innerHTML = value;
          // Automatically register known button IDs when innerHTML is set
          const matches = value.match(/id="([^"]+)"/g);
          if (matches) {
            for (const m of matches) {
              const matchedId = m.replace('id="', '').replace('"', '');
              if (!mockDOMRegistry[matchedId]) {
                const childEl = new MockElement(matchedId);
                mockDOMRegistry[matchedId] = childEl;
                target.appendChild(childEl);
              }
            }
          }
        }
        (target as any)[prop] = value;
        return true;
      }
    });
  }
};

try {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      clipboard: {
        writeText: async (text: string) => Promise.resolve()
      }
    },
    configurable: true,
    writable: true
  });
} catch {
  // If navigator already exists, mock clipboard
  if ((globalThis as any).navigator) {
    (globalThis as any).navigator.clipboard = {
      writeText: async (text: string) => Promise.resolve()
    };
  }
}

function createTestHarness() {
  const scene = new THREE.Scene();
  const player = new Player();
  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.2, 500);
  const cameraController = new CameraController(camera);
  const snapshotManager = BugSnapshotManager.getInstance();
  snapshotManager.reset();

  return { scene, player, camera, cameraController, snapshotManager };
}

// ============================================================================
// SUITE 1: Authoritative Preference Defaults & Initial State
// ============================================================================
console.log('--- Test Suite 1: Authoritative Preference Defaults & Initial State ---');
{
  globalThis.localStorage.clear();
  const devModal = new DevBugReportModal();
  const snapshotMgr = BugSnapshotManager.getInstance();

  assert(devModal.getAutoOpenCrashReport() === false, 'DevBugReportModal autoOpenCrashReport defaults to FALSE');
  assert(snapshotMgr.getAutoOpenCrashReport() === false, 'BugSnapshotManager authoritative autoOpenCrashReport defaults to FALSE');

  const modalEl = document.getElementById('dev-bug-report-modal') as any;
  assert(modalEl !== null, 'dev-bug-report-modal element created in DOM');
  assert(modalEl.classList.contains('hidden') === true, 'dev-bug-report-modal starts HIDDEN with .hidden class');
}

// ============================================================================
// SUITE 2: Normal Mode Fatal Stationary-Train Collision — Silent Recording
// ============================================================================
console.log('\n--- Test Suite 2: Normal Mode Fatal Collision — Silent Diagnostics ---');
{
  const { player, cameraController, snapshotManager } = createTestHarness();
  const devModal = new DevBugReportModal();
  const modalEl = document.getElementById('dev-bug-report-modal') as any;

  // Set up stationary train collision
  player.position.set(0, 0, -50);
  player.speed = 18.0;

  // Simulate fatal crash record
  snapshotManager.recordFatalCollision({
    reason: 'TRAIN_FRONTAL_CRASH',
    player,
    cameraController,
    nearbyObstacles: [
      {
        id: 'train_stationary_0',
        type: 'TRAIN',
        lane: 0,
        group: new THREE.Group(),
        collider: new THREE.Box3(),
        active: true
      } as any
    ]
  });

  const latest = snapshotManager.getLatestSnapshot();
  assert(latest !== null, 'Fatal crash snapshot was successfully recorded in memory');
  assert(latest!.trigger.type === 'FATAL_COLLISION', 'Snapshot trigger type is FATAL_COLLISION');
  assert(modalEl.classList.contains('hidden') === true, 'CRITICAL: DevBugReportModal remains strictly HIDDEN after fatal collision');
}

// ============================================================================
// SUITE 3: Hard Mode Fatal Moving-Train Collision — Silent Diagnostics
// ============================================================================
console.log('\n--- Test Suite 3: Hard Mode Moving-Train Collision — Silent Diagnostics ---');
{
  const { player, cameraController, snapshotManager } = createTestHarness();
  const modalEl = document.getElementById('dev-bug-report-modal') as any;

  // Simulate Hard Mode fatal crash at Z=-871.7, Speed=44.8 (exact conditions from screenshot)
  player.position.set(0, 0, -871.7);
  player.speed = 44.8;
  snapshotManager.setRunContext({
    seed: 1599997308,
    gameMode: 'HARD',
    difficulty: 'HARD',
    activeEnvironment: 'MODERN_METRO'
  });

  snapshotManager.recordFatalCollision({
    reason: 'FATAL_COLLISION',
    player,
    cameraController,
    nearbyObstacles: [
      {
        id: 'train_moving_1',
        type: 'MOVING_TRAIN',
        lane: 0,
        group: new THREE.Group(),
        collider: new THREE.Box3(),
        active: true,
        velocityZ: 25.0
      } as any
    ]
  });

  const hardSnap = snapshotManager.getLatestSnapshot();
  assert(hardSnap !== null, 'Hard Mode moving train snapshot captured');
  assert(hardSnap!.runContext.speed === 44.8, 'Recorded player speed matches 44.8 m/s');
  assert(hardSnap!.frames.length > 0, 'Buffer frames captured');
  assert(modalEl.classList.contains('hidden') === true, 'CRITICAL: DevBugReportModal remains HIDDEN during Hard Mode fatal crash');
}

// ============================================================================
// SUITE 4: Player Crash Lifecycle — Revive Offer & Game Over Independence
// ============================================================================
console.log('\n--- Test Suite 4: Player Crash Lifecycle (Revive / Game Over Flow) ---');
{
  const reviveMgr = ReviveManager.getInstance();
  reviveMgr.resetRun();

  assert(reviveMgr.canOfferRevive('NORMAL') === true, 'Revive offer is eligible for first crash in NORMAL mode');
  reviveMgr.beginOffer();
  const offer = reviveMgr.getOfferState('NORMAL');
  assert(offer.isEligible === true, 'Offer state indicates player is eligible for revive');

  const modalEl = document.getElementById('dev-bug-report-modal') as any;
  assert(modalEl.classList.contains('hidden') === true, 'Revive offer is unobstructed by technical bug report overlay');

  // Ensure player has keys to execute revives
  const progression = (reviveMgr as any).progression;
  if (progression && typeof progression.addKeys === 'function') {
    progression.addKeys(20);
  }

  // Ineligible revive (e.g. max revives reached)
  const max = reviveMgr.getMaxRevives();
  for (let i = 0; i < max; i++) {
    reviveMgr.beginOffer();
    reviveMgr.executeRevive();
  }
  assert(reviveMgr.canOfferRevive('NORMAL') === false, 'Revive offer becomes ineligible after cap reached');
  assert(modalEl.classList.contains('hidden') === true, 'Game Over flow is unobstructed by technical bug report overlay');
}

// ============================================================================
// SUITE 5: Explicit Developer Action Opens Report
// ============================================================================
console.log('\n--- Test Suite 5: Explicit Developer Opening (Keybind / Button) ---');
{
  const devModal = new DevBugReportModal();
  const modalEl = document.getElementById('dev-bug-report-modal') as any;

  // 5A: Open via openLatest()
  devModal.openLatest();
  assert(modalEl.classList.contains('hidden') === false, 'Modal unhides when openLatest() is explicitly invoked');
  assert(modalEl.innerHTML.includes('BUG SNAPSHOT REPORT'), 'Modal card rendered technical diagnostic contents');

  // 5B: Close modal via ✕ close button
  devModal.hide();
  assert(modalEl.classList.contains('hidden') === true, 'Modal hides cleanly upon hide() / close button');

  // 5C: Open via EventBus OPEN_BUG_REPORT_MODAL
  EventBus.getInstance().emit('OPEN_BUG_REPORT_MODAL');
  assert(modalEl.classList.contains('hidden') === false, 'Modal opens upon explicit OPEN_BUG_REPORT_MODAL event');

  // 5D: Close modal
  devModal.hide();
  assert(modalEl.classList.contains('hidden') === true, 'Modal hides cleanly after close');
}

// ============================================================================
// SUITE 6: Modal Lifecycle & Stale State Prevention on Run Restart
// ============================================================================
console.log('\n--- Test Suite 6: Modal Lifecycle & Restart Clearance ---');
{
  const devModal = new DevBugReportModal();
  const snapshotMgr = BugSnapshotManager.getInstance();
  const modalEl = document.getElementById('dev-bug-report-modal') as any;

  // Open modal explicitly
  devModal.openLatest();
  assert(modalEl.classList.contains('hidden') === false, 'Modal opened before restart');

  // Emit GAME_START / GAME_RESTART event
  EventBus.getInstance().emit(EVENTS.GAME_START);
  assert(modalEl.classList.contains('hidden') === true, 'Modal automatically hides on GAME_START event');

  // Re-open and test GAME_RESTART
  devModal.show();
  EventBus.getInstance().emit('GAME_RESTART');
  assert(modalEl.classList.contains('hidden') === true, 'Modal automatically hides on GAME_RESTART event');

  // Re-open and test GO_TO_MENU
  devModal.show();
  EventBus.getInstance().emit('GO_TO_MENU');
  assert(modalEl.classList.contains('hidden') === true, 'Modal automatically hides on GO_TO_MENU event');

  // Verify restart clears snapshot state so previous crash is not stale
  snapshotMgr.reset();
  assert(snapshotMgr.getLatestSnapshot() === null, 'snapshotManager.reset() clears latestSnapshot');
  assert(snapshotMgr.getBufferCount() === 0, 'snapshotManager.reset() clears frame buffer count');
}

// ============================================================================
// SUITE 7: Diagnostic Tooling & Export Actions
// ============================================================================
console.log('\n--- Test Suite 7: Diagnostic Tooling & Export Integrity ---');
{
  const { player, cameraController, snapshotManager } = createTestHarness();
  const devModal = new DevBugReportModal();

  const dummyBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(250);
  snapshotManager.setCaptureHandler(() => dummyBase64);
  snapshotManager.recordFatalCollision({
    reason: 'TEST_CRASH',
    player,
    cameraController
  });

  devModal.openLatest();
  const snap = snapshotManager.getLatestSnapshot();
  assert(snap !== null, 'Snapshot available');
  assert(snap!.screenshotBase64 !== undefined, 'Screenshot base64 preserved in snapshot');

  // Markdown summary generation
  const summary = snapshotManager.generateMarkdownSummary(snap!);
  assert(summary.includes('BUG SNAPSHOT REPORT'), 'AI Summary contains report header');
  assert(summary.includes('FATAL_COLLISION'), 'AI Summary contains collision classification');

  // Download screenshot export function returns true when image is present
  const screenshotSuccess = snapshotManager.downloadScreenshot(snap!);
  assert(screenshotSuccess === true, 'Screenshot download mechanism remains fully functional');
}

// ============================================================================
// SUITE 8: Opt-In Developer Auto-Open Mode (Controlled Preference)
// ============================================================================
console.log('\n--- Test Suite 8: Controlled Developer Opt-In Preference ---');
{
  const { player, cameraController, snapshotManager } = createTestHarness();
  const devModal = new DevBugReportModal();
  const modalEl = document.getElementById('dev-bug-report-modal') as any;

  devModal.hide();
  assert(devModal.getAutoOpenCrashReport() === false, 'Auto-open starts disabled');

  // Explicitly enable auto-open for developer automation testing
  devModal.setAutoOpenCrashReport(true);
  assert(devModal.getAutoOpenCrashReport() === true, 'Auto-open can be explicitly enabled by developer');
  assert(snapshotManager.getAutoOpenCrashReport() === true, 'BugSnapshotManager preference in sync');

  // Trigger fatal crash with auto-open enabled
  snapshotManager.recordFatalCollision({
    reason: 'DEV_TEST_CRASH',
    player,
    cameraController
  });

  assert(modalEl.classList.contains('hidden') === false, 'Modal automatically pops up ONLY when developer opt-in is enabled');

  // Turn it back off and verify return to default silent gameplay behavior
  devModal.setAutoOpenCrashReport(false);
  devModal.hide();
  assert(devModal.getAutoOpenCrashReport() === false, 'Auto-open cleanly turned back off');

  snapshotManager.recordFatalCollision({
    reason: 'NORMAL_GAMEPLAY_CRASH',
    player,
    cameraController
  });
  assert(modalEl.classList.contains('hidden') === true, 'Modal remains strictly silent after preference reverted to default false');
}

// ============================================================================
// SUITE 9: Listener Idempotence & Absence of Duplicate Accumulation
// ============================================================================
console.log('\n--- Test Suite 9: Listener Idempotence & Absence of Duplicate Accumulation ---');
{
  const bus = EventBus.getInstance();
  const initialCapturedListeners = (bus as any).listeners.get('BUG_SNAPSHOT_CAPTURED')?.size || 0;

  // Multiple crash events fired
  const { player, cameraController, snapshotManager } = createTestHarness();
  for (let i = 0; i < 10; i++) {
    snapshotManager.recordFatalCollision({
      reason: `REPEATED_CRASH_${i}`,
      player,
      cameraController
    });
  }

  const finalCapturedListeners = (bus as any).listeners.get('BUG_SNAPSHOT_CAPTURED')?.size || 0;
  assert(initialCapturedListeners === finalCapturedListeners, 'Zero duplicate listener accumulation across 10 repeated crashes');
}

console.log(`\n=================================================`);
console.log(`🎯 ALL ${totalTests} TESTS COMPLETED WITH 100% SUCCESS RATE!`);
console.log(`=================================================`);
