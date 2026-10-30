import { EventBus, EVENTS } from '../src/core/EventBus';
import { GameOverModal } from '../src/ui/GameOverModal';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { Player } from '../src/player/Player';
import { ChaserModel } from '../src/characters/ChaserModel';
import { TrackManager } from '../src/track/TrackManager';
import { OpeningSequenceController } from '../src/chase/OpeningSequenceController';
import { CameraController } from '../src/scene/CameraController';
import { ReviveManager } from '../src/revive/ReviveManager';
import { UpgradeManager } from '../src/player/UpgradeManager';
import { CONSTANTS } from '../src/core/Constants';
import * as THREE from 'three';

// Mock DOM elements for Headless Node test environment
class MockHTMLElement {
  id: string = '';
  className: string = '';
  classList = {
    classes: new Set<string>(),
    add: (c: string) => this.classList.classes.add(c),
    remove: (c: string) => this.classList.classes.delete(c),
    contains: (c: string) => this.classList.classes.has(c),
    toggle: (c: string) => {
      if (this.classList.classes.has(c)) this.classList.classes.delete(c);
      else this.classList.classes.add(c);
    }
  };
  style: Record<string, string> = {};
  children: MockHTMLElement[] = [];
  innerHTML: string = '';
  textContent: string = '';
  disabled: boolean = false;
  parentElement: any = null;
  dataset: Record<string, string> = {};
  focused: boolean = false;
  setAttribute(k: string, v: string) {}
  getAttribute(k: string) { return null; }
  listeners: Record<string, Function[]> = {};

  appendChild(child: any) {
    this.children.push(child);
    child.parentElement = this;
    return child;
  }
  removeChild(child: any) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) this.children.splice(idx, 1);
    child.parentElement = null;
    return child;
  }
  querySelector(sel: string): any {
    if (sel === '#game-over-retry-btn') {
      return this.findChildById('game-over-retry-btn') || this.createMockBtn('game-over-retry-btn', 'PLAY AGAIN');
    }
    if (sel === '#game-over-menu-btn') {
      return this.findChildById('game-over-menu-btn') || this.createMockBtn('game-over-menu-btn', 'MAIN MENU');
    }
    if (sel === '#game-over-score') return this.findChildById('game-over-score') || this.createMockEl('game-over-score');
    if (sel === '#game-over-coins') return this.findChildById('game-over-coins') || this.createMockEl('game-over-coins');
    if (sel === '#game-over-distance') return this.findChildById('game-over-distance') || this.createMockEl('game-over-distance');
    return this.createMockEl(sel.replace('#', ''));
  }
  querySelectorAll(sel: string): any[] {
    return [];
  }
  findChildById(id: string): any {
    if (this.id === id) return this;
    for (const ch of this.children) {
      const res = ch.findChildById(id);
      if (res) return res;
    }
    return null;
  }
  createMockBtn(id: string, text: string) {
    const btn = new MockHTMLElement();
    btn.id = id;
    btn.textContent = text;
    this.appendChild(btn);
    return btn;
  }
  createMockEl(id: string) {
    const el = new MockHTMLElement();
    el.id = id;
    this.appendChild(el);
    return el;
  }
  addEventListener(evt: string, fn: Function) {
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(fn);
  }
  removeEventListener(evt: string, fn: Function) {
    if (this.listeners[evt]) {
      this.listeners[evt] = this.listeners[evt].filter(f => f !== fn);
    }
  }
  dispatchEvent(event: { type: string; stopPropagation?: () => void }) {
    const fns = this.listeners[event.type] || [];
    for (const fn of fns) fn(event);
  }
  click() {
    this.dispatchEvent({ type: 'click', stopPropagation: () => {} });
  }
  focus() {
    this.focused = true;
  }
}

// In-memory localStorage mock
const storageMock: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, val: string) => { storageMock[key] = String(val); },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => { for (const k in storageMock) delete storageMock[k]; }
} as any;

const windowListeners: Record<string, Function[]> = {};
globalThis.requestAnimationFrame = (cb: Function) => { cb(Date.now()); return 1; };
(globalThis as any).window = {
  innerWidth: 1280,
  innerHeight: 720,
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
  },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  requestAnimationFrame: (cb: Function) => { cb(Date.now()); return 1; }
};

class MockCanvas {
  style: Record<string, string> = {};
  width = 1280;
  height = 720;
  addEventListener() {}
  removeEventListener() {}
  getContext(type: string = '2d') {
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      fillRect: () => {},
      strokeRect: () => {},
      clearRect: () => {},
      roundRect: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      ellipse: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      drawImage: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      measureText: () => ({ width: 10 }),
      fillText: () => {},
      strokeText: () => {},
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

const rootOverlay = new MockHTMLElement();
rootOverlay.id = 'ui-overlay';

(globalThis as any).document = {
  getElementById: (id: string) => {
    if (id === 'ui-overlay') return rootOverlay;
    return rootOverlay.findChildById(id) || null;
  },
  createElement: (tag: string) => tag === 'canvas' ? new MockCanvas() : new MockHTMLElement(),
  body: new MockHTMLElement(),
  activeElement: null
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`✅ PASSED: ${msg}`);
    passed++;
  } else {
    console.error(`❌ FAILED: ${msg}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('🧪 Starting Metro Runner 3D: Instant Retry / Play Again Architecture & Contract Suite...\n');

  const bus = EventBus.getInstance();
  const progression = ProgressionManager.getInstance();
  progression.resetAll();

  // ---------------------------------------------------------------------------
  // Test 1: GameOverModal Structure & Primary / Secondary Action Design
  // ---------------------------------------------------------------------------
  console.log('--- Suite 1: GameOverModal Action Buttons & Design System ---');
  const modal = new GameOverModal();
  const modalEl = (modal as any).element as MockHTMLElement;

  assert(modalEl !== null, 'GameOverModal element successfully instantiated');
  assert(modalEl.innerHTML.includes('id="game-over-retry-btn"'), 'Primary button #game-over-retry-btn exists in HTML');
  assert(modalEl.innerHTML.includes('PLAY AGAIN'), 'Primary button clearly displays "PLAY AGAIN" text');
  assert(modalEl.innerHTML.includes('id="game-over-menu-btn"'), 'Secondary button #game-over-menu-btn exists in HTML');
  assert(modalEl.innerHTML.includes('MAIN MENU'), 'Secondary button clearly displays "MAIN MENU" text');
  assert(modalEl.innerHTML.includes('aria-label="Play Again (Instant Retry)"'), 'Play Again has accessible aria-label');
  assert(modalEl.innerHTML.includes('aria-label="Return to Main Menu"'), 'Main Menu has accessible aria-label');

  // ---------------------------------------------------------------------------
  // Test 2: Instant Retry Debounce & Rapid Multi-Click Protection
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 2: Rapid Multi-Click Prevention & Debounce Guard ---');
  modal.show(5000, 25, 350, 'NORMAL');
  assert(!modalEl.classList.contains('hidden'), 'GameOverModal is visible on show');

  let restartEventCount = 0;
  const unsubRestart = bus.on(EVENTS.GAME_RESTART, () => {
    restartEventCount++;
  });

  // Rapidly trigger Play Again 5 times
  modal.handlePlayAgain();
  modal.handlePlayAgain();
  modal.handlePlayAgain();
  modal.handlePlayAgain();
  modal.handlePlayAgain();

  assert(restartEventCount === 1, `Rapid clicks emitted exactly 1 GAME_RESTART event (got ${restartEventCount})`);
  assert(modalEl.classList.contains('hidden'), 'GameOverModal hid immediately upon first click');
  unsubRestart();

  // Show again and verify isRestarting reset & button re-enabled
  modal.show(6000, 30, 400, 'NORMAL');
  assert((modal as any).isRestarting === false, 'isRestarting guard reset to false on show()');
  const retryBtn = modalEl.querySelector('#game-over-retry-btn');
  assert(retryBtn.disabled === false, 'Play Again button re-enabled on show()');

  // ---------------------------------------------------------------------------
  // Test 3: Keyboard Shortcuts (R Key, Enter / Space, Escape for Main Menu)
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 3: Keyboard Accessibility & Direct Hotkeys ---');
  let restartFromKey = 0;
  const unsubKey = bus.on(EVENTS.GAME_RESTART, () => { restartFromKey++; });

  // Simulate pressing 'R'
  (window as any).dispatchEvent({ type: 'keydown', key: 'r', preventDefault: () => {}, stopPropagation: () => {} });
  assert(restartFromKey === 1, 'Pressing "r" hotkey triggered Play Again');
  unsubKey();

  // Show modal again and test Escape key for Main Menu
  modal.show(2000, 10, 100, 'NORMAL');
  let menuFromKey = 0;
  const unsubMenuKey = bus.on('GO_TO_MENU', () => { menuFromKey++; });
  (window as any).dispatchEvent({ type: 'keydown', key: 'Escape', preventDefault: () => {}, stopPropagation: () => {} });
  assert(menuFromKey === 1, 'Pressing Escape key triggered Main Menu navigation');
  assert(modalEl.classList.contains('hidden'), 'Modal closed on Escape');
  unsubMenuKey();

  // Verify that keydown does nothing when modal is hidden
  let hiddenKeyRestart = 0;
  const unsubHidden = bus.on(EVENTS.GAME_RESTART, () => { hiddenKeyRestart++; });
  (window as any).dispatchEvent({ type: 'keydown', key: 'r', preventDefault: () => {}, stopPropagation: () => {} });
  assert(hiddenKeyRestart === 0, 'Keyboard shortcut ignored when GameOverModal is hidden');
  unsubHidden();

  // ---------------------------------------------------------------------------
  // Test 4: Player Kinematics, Movement & Surface Invariants
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 4: Player Kinematics & Movement State Reset ---');
  const player = new Player();
  // Dirty state: Lane 1, elevated on train roof, jumping, sliding, powerup active
  player.currentLane = 1;
  player.targetLane = 1;
  player.position.set(3.6, 4.35, -450);
  player.supportSurface = 'TRAIN_ROOF';
  player.state = 'ON_TRAIN';
  player.isJumping = true;
  player.isSliding = true;
  player.distanceTraveled = 450;
  player.powerups.activate('SHIELD');
  player.powerups.activate('MAGNET');

  // Execute player reset
  player.reset();

  assert(player.currentLane === 0, 'Player currentLane reset to 0 (center)');
  assert(player.targetLane === 0, 'Player targetLane reset to 0 (center)');
  assert(player.position.x === 0, 'Player position.x reset to 0');
  assert(player.position.y === CONSTANTS.PLAYER_BASE_Y, `Player position.y reset to base ${CONSTANTS.PLAYER_BASE_Y}`);
  assert(player.position.z === 0, 'Player position.z reset to 0');
  assert(player.supportSurface === 'GROUND', 'Support surface restored to GROUND');
  assert(player.state === 'RUN', `Player state restored to RUN (got ${player.state})`);
  assert(player.isJumping === false, 'isJumping cleared');
  assert(player.isSliding === false, 'isSliding cleared');
  assert(player.distanceTraveled === 0, 'distanceTraveled reset to 0');
  assert(!player.powerups.hasShieldActive(), 'Shield powerup cleared');
  assert(!player.powerups.isMagnetActive(), 'Magnet powerup cleared');
  assert(!player.hoverboardManager.isBoardActive(), 'Hoverboard cleared');
  assert(!player.isInvulnerable(), 'Invulnerability cleared');

  // ---------------------------------------------------------------------------
  // Test 5: TrackManager Seed & Obstacle Invariants
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 5: TrackManager Chunk & Obstacle Regeneration ---');
  const mockScene = new THREE.Scene();
  const trackMgr = new TrackManager(mockScene);
  trackMgr.setGameMode('NORMAL');
  trackMgr.reset(true);

  assert(trackMgr.chunks.length > 0, `Track chunks initialized (${trackMgr.chunks.length} active chunks)`);
  assert(trackMgr.furthestZ < 0, `Furthest track Z populated (${trackMgr.furthestZ}m)`);
  assert(trackMgr.cleanStreakCount === 0, 'Clean streak counter reset to 0');

  // ---------------------------------------------------------------------------
  // Test 6: Chaser Reset State
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 6: Chaser State & Starting Distance ---');
  const chaser = new ChaserModel();
  chaser.setMode('CAUGHT');
  assert(chaser.mode === 'CAUGHT', 'Chaser was in CAUGHT state');

  chaser.reset();
  assert(chaser.getChaseState() === 'DISTANT', 'Chaser state reset to DISTANT');
  assert(chaser.mode === 'STANDBY', 'Chaser mode reset to STANDBY');
  assert(chaser.mesh.visible === false, 'Chaser mesh hidden in standby');

  // ---------------------------------------------------------------------------
  // Test 7: Opening Sequence Controller & Mode Initial Speed Preservation
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 7: Opening Sequence Skip & Hard Mode Speed Profile ---');
  const camera = new CameraController();
  const openingSeq = new OpeningSequenceController(player, camera, chaser);

  // Normal Mode retry
  player.reset();
  player.setGameMode('NORMAL');
  openingSeq.start(true); // Retry skip
  assert(player.speed === CONSTANTS.INITIAL_SPEED, `Normal Mode retry speed is ${CONSTANTS.INITIAL_SPEED} m/s (got ${player.speed})`);

  // Hard Mode retry
  player.reset();
  player.setGameMode('HARD');
  openingSeq.start(true); // Retry skip
  assert(player.speed >= 24.0, `Hard Mode retry speed preserved >= 24.0 m/s (got ${player.speed})`);

  // ---------------------------------------------------------------------------
  // Test 8: Permanent Progression & Currency Preservation
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 8: Permanent Currency & Achievement Persistence ---');
  progression.resetAll();
  const upgradeMgr = UpgradeManager.getInstance();
  const baseCoins = upgradeMgr.getCoins();
  const baseKeys = progression.getKeys();

  // Simulate Run 1 finish
  bus.emit(EVENTS.RUN_STARTED, 'NORMAL');
  upgradeMgr.addCoins(40);
  bus.emit(EVENTS.RUN_FINISHED);

  const updatedCoins = upgradeMgr.getCoins();
  assert(updatedCoins === baseCoins + 40, `Run coins safely finalized (+40, total: ${updatedCoins})`);
  assert(progression.getKeys() === baseKeys, `Keys preserved (${progression.getKeys()})`);

  // Simulate Instant Retry
  bus.emit(EVENTS.GAME_RESTART);
  bus.emit(EVENTS.RUN_STARTED, 'NORMAL');
  assert(upgradeMgr.getCoins() === updatedCoins, 'Starting new run via Play Again did not modify coins');
  assert(progression.getKeys() === baseKeys, 'Starting new run via Play Again did not modify keys');

  // ---------------------------------------------------------------------------
  // Test 9: Revive Manager Compatibility
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 9: Revive Manager Compatibility ---');
  const reviveMgr = ReviveManager.getInstance();
  reviveMgr.resetRun();
  assert(reviveMgr.canOfferRevive('NORMAL'), 'Revive is eligible at run start');
  assert(reviveMgr.getRevivesUsed() === 0, 'Revives used count is 0');

  // Execute revive in run 1
  reviveMgr.beginOffer();
  const revResult = reviveMgr.executeRevive();
  assert(revResult.success, 'Revive execution succeeded');
  assert(reviveMgr.getRevivesUsed() === 1, 'Revives used count is now 1');

  // Play Again resets run revives
  reviveMgr.resetRun();
  assert(reviveMgr.getRevivesUsed() === 0, 'Play Again reset revives used count back to 0');
  assert(reviveMgr.getReviveCost() === 1, 'First revive cost reset back to 1 Key');

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n=============================================================');
  console.log(`🏁 FINISHED INSTANT RETRY SUITE: ${passed} passed, ${failed} failed`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
