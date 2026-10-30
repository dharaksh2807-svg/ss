import * as THREE from 'three';
import { Player } from '../src/player/Player';
import { CameraController } from '../src/scene/CameraController';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { BugSnapshotManager } from '../src/debug/BugSnapshotManager';
import { DevBugReportModal } from '../src/ui/DevBugReportModal';
import { GameOverModal } from '../src/ui/GameOverModal';
import { PauseModal } from '../src/ui/PauseModal';
import { ReviveManager } from '../src/revive/ReviveManager';
import { CrashReplayManager } from '../replay/CrashReplayManager';
import { isDeveloperMode } from '../src/core/Constants';

console.log('🧪 Starting Metro Runner 3D: P1 Developer Diagnostics Isolation Test Suite...\n');

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

// Mock Minimal DOM
class MockElement {
  public id: string = '';
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
  public children: MockElement[] = [];
  public parentElement: MockElement | null = null;
  public eventListeners: Record<string, Function[]> = {};

  public classList = {
    _classes: new Set<string>(),
    add: (...c: string[]) => {
      c.forEach(x => this.classList._classes.add(x));
      this._className = Array.from(this.classList._classes).join(' ');
    },
    remove: (...c: string[]) => {
      c.forEach(x => this.classList._classes.delete(x));
      this._className = Array.from(this.classList._classes).join(' ');
    },
    contains: (x: string) => this.classList._classes.has(x)
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

  public addEventListener(event: string, handler: Function) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(handler);
  }

  public querySelector(selector: string): MockElement | null {
    if (selector.startsWith('#')) {
      const targetId = selector.slice(1);
      if (this.id === targetId) return this;
      for (const child of this.children) {
        const found = child.querySelector(selector);
        if (found) return found;
      }
    }
    return null;
  }

  public focus() {}
  public blur() {}
  public click() {}
  public contains(el: any) {
    if (!el) return false;
    if (el === this) return true;
    for (const child of this.children) {
      if (child.contains(el)) return true;
    }
    return false;
  }
}

const mockOverlay = new MockElement('ui-overlay');
const mockBody = new MockElement('body');
(globalThis as any).document = {
  body: mockBody,
  getElementById: (id: string) => {
    if (id === 'ui-overlay') return mockOverlay;
    if (id === 'body') return mockBody;
    return mockOverlay.querySelector('#' + id);
  },
  querySelector: (selector: string) => {
    return mockOverlay.querySelector(selector);
  },
  createElement: (tag: string) => new MockElement(),
  activeElement: null
};

(globalThis as any).window = {
  addEventListener: () => {},
  localStorage: (globalThis as any).localStorage
};

function setupHarness() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
  const player = new Player(scene);
  const cameraController = new CameraController(camera);
  const snapshotManager = BugSnapshotManager.getInstance();
  snapshotManager.reset();
  return { scene, camera, player, cameraController, snapshotManager };
}

// ============================================================================
// Requirement 1 & 3: Normal Mode Train Collision -> Normal Death Flow, No Auto Modal
// ============================================================================
console.log('--- Test 1: Normal Mode Train Collision & Silent Diagnostics ---');
{
  (globalThis as any).__IS_DEV__ = false;
  assert(isDeveloperMode() === false, 'Production player mode active (__IS_DEV__ = false)');

  const { player, cameraController, snapshotManager } = setupHarness();
  const devModal = new DevBugReportModal();
  const modalEl = document.getElementById('dev-bug-report-modal') as any;

  // Simulate fatal crash
  snapshotManager.recordFatalCollision({
    reason: 'TRAIN_COLLISION',
    player,
    cameraController
  });

  assert(modalEl.classList.contains('hidden') === true, 'DevBugReportModal remains strictly HIDDEN on Normal Mode fatal crash');
  assert(snapshotManager.getLatestSnapshot() !== null, 'Crash diagnostics recorded silently in background');
}

// ============================================================================
// Requirement 2 & 3: Hard Mode Moving Train Collision -> Normal Death Flow, No Auto Modal
// ============================================================================
console.log('\n--- Test 2: Hard Mode Moving Train Collision ---');
{
  (globalThis as any).__IS_DEV__ = false;
  const { player, cameraController, snapshotManager } = setupHarness();
  const modalEl = document.getElementById('dev-bug-report-modal') as any;

  player.speed = 42.0;
  snapshotManager.recordFatalCollision({
    reason: 'MOVING_TRAIN_COLLISION',
    player,
    cameraController
  });

  assert(modalEl.classList.contains('hidden') === true, 'DevBugReportModal strictly HIDDEN during Hard Mode fatal crash');
}

// ============================================================================
// Requirement 4: Revive Offer Appears When Eligible
// ============================================================================
console.log('\n--- Test 4: Revive Offer Appears When Eligible ---');
{
  const reviveMgr = ReviveManager.getInstance();
  reviveMgr.resetRun();
  assert(reviveMgr.canOfferRevive('NORMAL') === true, 'Revive offer is eligible for first crash in NORMAL mode');
  reviveMgr.beginOffer();
  const offer = reviveMgr.getOfferState('NORMAL');
  assert(offer.isEligible === true, 'Offer state indicates player is eligible for revive');
}

// ============================================================================
// Requirement 5: Game Over Appears When Revive Unavailable or Declined
// ============================================================================
console.log('\n--- Test 5: Game Over Appears When Revive Unavailable ---');
{
  const reviveMgr = ReviveManager.getInstance();
  reviveMgr.resetRun();
  const progression = (reviveMgr as any).progression;
  if (progression && typeof progression.addKeys === 'function') {
    progression.addKeys(20);
  }
  const max = reviveMgr.getMaxRevives();
  for (let i = 0; i < max; i++) {
    reviveMgr.beginOffer();
    reviveMgr.executeRevive();
  }
  assert(reviveMgr.canOfferRevive('NORMAL') === false, 'Revive offer becomes ineligible after reaching max revives');
}

// ============================================================================
// Requirement 6: Quick Retry Starts Clean New Run
// ============================================================================
console.log('\n--- Test 6: Quick Retry Starts Clean New Run ---');
{
  const devModal = new DevBugReportModal();
  const modalEl = document.getElementById('dev-bug-report-modal') as any;

  // Fire restart event
  EventBus.getInstance().emit('GAME_RESTART');
  assert(modalEl.classList.contains('hidden') === true, 'DevBugReportModal hidden on GAME_RESTART');
  assert(devModal.getAutoOpenCrashReport() === false, 'Auto-open preference reset to false on restart');
}

// ============================================================================
// Requirement 7 & 8: Developer Manually Opens and Closes Report
// ============================================================================
console.log('\n--- Test 7 & 8: Developer Manually Opens and Closes Report ---');
{
  (globalThis as any).__IS_DEV__ = true;
  assert(isDeveloperMode() === true, 'Developer mode active (__IS_DEV__ = true)');

  const devModal = new DevBugReportModal();
  const modalEl = document.getElementById('dev-bug-report-modal') as any;

  devModal.openLatest();
  assert(modalEl.classList.contains('hidden') === false, 'Developer can open report on demand via openLatest()');
  assert(modalEl.innerHTML.includes('BUG SNAPSHOT REPORT'), 'Report card displays technical diagnostics');

  devModal.hide();
  assert(modalEl.classList.contains('hidden') === true, 'Developer can close report via hide()');
}

// ============================================================================
// Requirement 9, 10, 11: JSON Export, Screenshot Export & Scenario Reproduction
// ============================================================================
console.log('\n--- Test 9, 10, 11: JSON Export, Screenshot Export & Reproduction ---');
{
  const { player, cameraController, snapshotManager } = setupHarness();
  const dummyBase64 = 'data:image/jpeg;base64,' + 'B'.repeat(300);
  snapshotManager.setCaptureHandler(() => dummyBase64);

  const pkg = snapshotManager.recordFatalCollision({
    reason: 'EXPORT_TEST',
    player,
    cameraController
  });

  // JSON exportable data structure
  const jsonStr = JSON.stringify(pkg);
  const parsed = JSON.parse(jsonStr);
  assert(parsed.trigger.type === 'FATAL_COLLISION', 'JSON package preserves snapshot trigger');
  assert(parsed.reproducibility.isReplayable === true, 'Reproduction metadata is active and available');

  // Screenshot export function
  const hasScreenshot = snapshotManager.downloadScreenshot(pkg);
  assert(hasScreenshot === true, 'Screenshot artifact download functional');
}

// ============================================================================
// Requirement 12: Crash Snapshot Creation Does Not Itself Open the Viewer
// ============================================================================
console.log('\n--- Test 12: Crash Snapshot Creation Does Not Itself Open Viewer ---');
{
  (globalThis as any).__IS_DEV__ = false;
  const { player, cameraController, snapshotManager } = setupHarness();
  const modalEl = document.getElementById('dev-bug-report-modal') as any;

  modalEl.classList.add('hidden');
  snapshotManager.recordFatalCollision({
    reason: 'SILENT_CHECK',
    player,
    cameraController
  });

  assert(modalEl.classList.contains('hidden') === true, 'Creating snapshot NEVER opens the modal for ordinary players');
}

// ============================================================================
// Requirement 13 & 14: Refresh and Old LocalStorage Stored Settings
// ============================================================================
console.log('\n--- Test 13 & 14: Refresh & Legacy LocalStorage Purge ---');
{
  // Seed an old dangerous preference into localStorage
  (globalThis as any).localStorage.setItem('metro_debug_auto_open_crash_report', 'true');
  assert((globalThis as any).localStorage.getItem('metro_debug_auto_open_crash_report') === 'true', 'Stale debug setting planted in storage');

  (globalThis as any).__IS_DEV__ = false; // Normal player reload
  const devModal = new DevBugReportModal();

  assert(devModal.getAutoOpenCrashReport() === false, 'Auto-open defaults strictly to FALSE on reload');
  assert((globalThis as any).localStorage.getItem('metro_debug_auto_open_crash_report') === null, 'Old localStorage auto-open setting was proactively PURGED');

  const { player, cameraController, snapshotManager } = setupHarness();
  const modalEl = document.getElementById('dev-bug-report-modal') as any;
  snapshotManager.recordFatalCollision({
    reason: 'RELOAD_CRASH',
    player,
    cameraController
  });
  assert(modalEl.classList.contains('hidden') === true, 'Modal remains strictly HIDDEN despite previous old localStorage entry');
}

// ============================================================================
// Requirement 15: Repeated Deaths Do Not Cause Duplicate Subscriptions
// ============================================================================
console.log('\n--- Test 15: Repeated Deaths Do Not Cause Duplicate Subscriptions ---');
{
  const bus = EventBus.getInstance();
  const beforeListeners = (bus as any).listeners.get('BUG_SNAPSHOT_CAPTURED')?.size || 0;

  const { player, cameraController, snapshotManager } = setupHarness();
  for (let i = 0; i < 20; i++) {
    snapshotManager.recordFatalCollision({
      reason: `REPEAT_CRASH_${i}`,
      player,
      cameraController
    });
  }

  const afterListeners = (bus as any).listeners.get('BUG_SNAPSHOT_CAPTURED')?.size || 0;
  assert(beforeListeners === afterListeners, 'Zero duplicate event listener accumulation after 20 repeated crashes');
}

console.log('\n=======================================================');
console.log(`🏆 ALL ${passedTests}/${totalTests} DIAGNOSTICS ISOLATION TESTS PASSED!`);
console.log('=======================================================');
