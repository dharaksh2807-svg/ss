import { CONSTANTS } from './Constants';
import { EventBus } from './EventBus';
import { SettingsManager, InputAction as GameplayAction } from '../settings/SettingsManager';

export type InputAction = GameplayAction | 'CONFIRM' | 'BACK';

type PadState = { held: Set<InputAction>; x: number; y: number };

/** Device adapters dispatch the same actions; Player owns all movement and lane queueing. */
export class InputManager {
  private eventBus = EventBus.getInstance();
  private settingsManager = SettingsManager.getInstance();
  private enabled = true;
  private gesture: { id: number; x: number; y: number; time: number; used: boolean } | null = null;
  private lastTapTime = -Infinity;
  private pads = new Map<number, PadState>();
  private boundButtons = new WeakSet<HTMLElement>();

  constructor() {
    this.initKeyboard();
    this.initTouch();
    this.initTouchButtons();
    window.addEventListener('gamepaddisconnected', (event) => {
      if (this.pads.delete(event.gamepad.index)) this.eventBus.emit('INPUT_DEVICE_DISCONNECTED');
    });
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.resetTransientState();
  }

  public isEnabled(): boolean { return this.enabled; }

  public resetTransientState(): void {
    this.gesture = null;
    this.lastTapTime = -Infinity;
    // Prime held controls on the next poll, so resuming/reconnecting cannot replay them.
    this.pads.clear();
  }

  private menu(): HTMLElement | null {
    if (typeof document === 'undefined' || !document.querySelectorAll) return null;
    const views = document.querySelectorAll<HTMLElement>('.screen-overlay:not(.hidden), .showroom-overlay:not(.hidden), [role="dialog"]:not(.hidden)');
    return Array.from(views).filter(el => el.getClientRects().length > 0).pop() || null;
  }

  private canPlay(): boolean { return this.enabled && !this.menu(); }

  private initKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      if (e.defaultPrevented) return;
      const mappedAction = this.settingsManager.resolveKeyToAction(e.code);
      if (e.target instanceof Element) {
        if (e.target.closest('input, select, textarea, [contenteditable="true"]')) return;
        if (mappedAction !== 'PAUSE' && e.target.closest('button, a[href], [role="button"]')) return;
      }
      // Menus own native keyboard navigation and Escape through NavigationCoordinator.
      const menu = this.menu();
      if (menu && (e.code === 'Escape' || mappedAction !== 'PAUSE' || menu.id !== 'pause-modal')) return;
      if (!this.enabled && mappedAction !== 'PAUSE') return;
      if (!mappedAction) return;
      e.preventDefault(); // Including held arrows/Space: suppress scrolling, not just actions.
      if (!e.repeat) this.triggerAction(mappedAction);
    });
  }

  private beginGesture(id: number, x: number, y: number): void {
    if (!this.canPlay()) return;
    if (this.gesture) { this.cancelGesture(); return; }
    this.gesture = { id, x, y, time: performance.now(), used: false };
  }

  private cancelGesture(): void {
    this.gesture = null;
    this.lastTapTime = -Infinity;
  }

  private moveGesture(id: number, x: number, y: number): void {
    const g = this.gesture;
    if (!g || g.id !== id || g.used) return;
    if (!this.canPlay()) { this.cancelGesture(); return; }
    const settings = this.settingsManager.getState();
    if (performance.now() - g.time > settings.swipeMaxIntervalMs) return;
    const dx = x - g.x, dy = y - g.y;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    const threshold = settings.swipeMinDistancePx;
    let action: GameplayAction | undefined;
    if (ax >= threshold && ax >= ay * 1.25) action = dx < 0 ? 'LEFT' : 'RIGHT';
    else if (ay >= threshold && ay >= ax * 1.25) action = dy < 0 ? 'UP' : 'DOWN';
    if (action) {
      g.used = true;
      this.lastTapTime = -Infinity;
      this.triggerAction(action);
    }
  }

  private endGesture(id: number, x: number, y: number): void {
    const g = this.gesture;
    if (!g || g.id !== id) return;
    this.moveGesture(id, x, y);
    if (this.gesture && this.canPlay() && !g.used && Math.hypot(x - g.x, y - g.y) < 12 && performance.now() - g.time < 250) {
      const now = performance.now() / 1000;
      if (now - this.lastTapTime < CONSTANTS.HOVERBOARD_DOUBLE_TAP_WINDOW) {
        this.triggerAction('ACTION');
        this.lastTapTime = -Infinity;
      } else this.lastTapTime = now;
    } else this.lastTapTime = -Infinity;
    this.gesture = null;
  }

  private initTouch(): void {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    // Register exactly one event family. Compatibility touch/mouse events cannot duplicate swipes.
    if ('PointerEvent' in window) {
      canvas.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        if (!e.isPrimary) { this.cancelGesture(); return; }
        this.beginGesture(e.pointerId, e.clientX, e.clientY);
        if (this.gesture) canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove', (e) => this.moveGesture(e.pointerId, e.clientX, e.clientY));
      canvas.addEventListener('pointerup', (e) => this.endGesture(e.pointerId, e.clientX, e.clientY));
      canvas.addEventListener('pointercancel', () => this.cancelGesture());
      canvas.addEventListener('lostpointercapture', () => { if (this.gesture) this.cancelGesture(); });
    } else {
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) { this.cancelGesture(); return; }
        const t = e.touches[0];
        this.beginGesture(t.identifier, t.clientX, t.clientY);
      }, { passive: true });
      canvas.addEventListener('touchmove', (e) => {
        if (this.canPlay()) e.preventDefault();
        if (e.touches.length !== 1) { this.cancelGesture(); return; }
        const t = e.touches[0];
        this.moveGesture(t.identifier, t.clientX, t.clientY);
      }, { passive: false });
      canvas.addEventListener('touchend', (e) => {
        for (const t of Array.from(e.changedTouches)) this.endGesture(t.identifier, t.clientX, t.clientY);
      }, { passive: true });
      canvas.addEventListener('touchcancel', () => this.cancelGesture());
    }
  }

  public initTouchButtons(): void {
    const buttons: Array<[string, GameplayAction]> = [
      ['touch-left-btn', 'LEFT'], ['touch-right-btn', 'RIGHT'], ['touch-up-btn', 'UP'],
      ['touch-down-btn', 'DOWN'], ['touch-board-btn', 'ACTION'], ['hud-board-btn', 'ACTION']
    ];
    for (const [id, action] of buttons) {
      const btn = document.getElementById(id);
      if (!btn || this.boundButtons.has(btn)) continue;
      this.boundButtons.add(btn);
      // Native click works for touch, pointer, keyboard and assistive activation, exactly once.
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.triggerAction(action);
      });
    }
  }

  /** Standard mapping only; unknown layouts are deliberately ignored. One edge per held action. */
  public pollGamepads(): void {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    let connected: (Gamepad | null)[];
    try { connected = Array.from(navigator.getGamepads()); } catch { return; }
    const seen = new Set<number>();
    const playing = this.canPlay();
    for (const pad of connected) {
      if (!pad?.connected || pad.mapping !== 'standard') continue;
      seen.add(pad.index);
      const previous = this.pads.get(pad.index);
      const axis = (value: number, old: number): number => {
        if (Math.abs(value) <= 0.25) return 0;
        if (Math.abs(value) >= 0.55) return Math.sign(value);
        return old;
      };
      const x = axis(pad.axes[0] || 0, previous?.x || 0);
      const y = axis(pad.axes[1] || 0, previous?.y || 0);
      const pressed = (i: number) => pad.buttons[i]?.pressed === true;
      const held = new Set<InputAction>();
      if (pressed(14) || x < 0) held.add('LEFT');
      if (pressed(15) || x > 0) held.add('RIGHT');
      if (pressed(12) || y < 0) held.add('UP');
      if (pressed(13) || y > 0) held.add('DOWN');
      // Store physical button meanings consistently across menu/run transitions.
      if (pressed(0)) held.add('CONFIRM');
      if (pressed(1)) held.add('BACK');
      if (pressed(2)) held.add('ACTION');
      if (pressed(9)) held.add('PAUSE');
      this.pads.set(pad.index, { held, x, y });
      if (!previous) continue; // Connecting with a held stick/button must not move or start a run.
      const edges = [...held].filter(action => !previous.held.has(action));
      // Pause takes priority over simultaneous movement/confirm.
      if (edges.includes('PAUSE')) { this.triggerAction('PAUSE'); return; }
      const actions = playing
        ? [...new Set(edges.map(action => action === 'CONFIRM' ? 'UP' : action === 'BACK' ? 'DOWN' : action))]
        : edges;
      for (const action of actions) {
        if (playing) this.triggerAction(action);
        else if (['LEFT', 'RIGHT', 'UP', 'DOWN'].includes(action)) this.focusMenu(action === 'LEFT' || action === 'UP' ? -1 : 1);
        else if (action === 'CONFIRM' || action === 'BACK') { this.triggerAction(action); return; }
      }
    }
    for (const index of this.pads.keys()) {
      if (!seen.has(index)) {
        this.pads.delete(index);
        this.eventBus.emit('INPUT_DEVICE_DISCONNECTED');
      }
    }
  }

  private menuControls(menu: HTMLElement): HTMLElement[] {
    return Array.from(menu.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]'))
      .filter(el => el.getClientRects().length > 0 && !el.closest('[inert], [aria-hidden="true"]'));
  }

  private focusMenu(direction: number): void {
    const menu = this.menu();
    if (!menu) return;
    const controls = this.menuControls(menu);
    if (!controls.length) return;
    const index = controls.indexOf(document.activeElement as HTMLElement);
    controls[(index + direction + controls.length) % controls.length].focus();
  }

  public triggerAction(action: InputAction): void {
    if (action === 'BACK') {
      if (this.menu()) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true, cancelable: true }));
      return;
    }
    if (action === 'CONFIRM') {
      const menu = this.menu();
      if (!menu) return;
      const controls = this.menuControls(menu);
      const focused = document.activeElement as HTMLElement;
      const primary = menu.querySelector<HTMLElement>('#start-play-btn, #pause-resume-btn, #game-over-retry-btn');
      (controls.includes(focused) ? focused : primary || controls[0])?.click();
      return;
    }
    if (action === 'PAUSE') {
      const menu = this.menu();
      if (menu && menu.id !== 'pause-modal') return;
    }
    if (action !== 'PAUSE' && !this.canPlay()) return;
    this.eventBus.emit('INPUT_ACTION', action);
  }

  public getSettingsManager(): SettingsManager { return this.settingsManager; }
  public consumeBufferedAction(): GameplayAction | null { return null; }
}
