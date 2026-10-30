import { CONSTANTS } from './Constants';
import { EventBus, EVENTS } from './EventBus';
import { SettingsManager, InputAction } from '../settings/SettingsManager';

export type { InputAction };

export class InputManager {
  private eventBus = EventBus.getInstance();
  private settingsManager = SettingsManager.getInstance();

  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private lastTapTime = 0;
  private hasSwipedInCurrentTouch = false;
  private enabled = true;

  // Input buffering
  private bufferedAction: InputAction | null = null;
  private bufferExpiry = 0;
  private readonly BUFFER_DURATION = 0.22; // 220ms buffer window

  constructor() {
    this.initKeyboard();
    this.initTouch();
    this.initTouchButtons();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.bufferedAction = null;
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private initKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      // Always allow Pause / Escape even when gameplay input is disabled (e.g. in game over or pause menu)
      const mappedAction = this.settingsManager.resolveKeyToAction(e.code);

      if (!this.enabled && mappedAction !== 'PAUSE' && e.code !== 'Escape' && e.code !== 'KeyP') return;

      // Ignore automatic keyboard repeat to prevent unintended multiple lane switches
      if (e.repeat) return;

      // Prevent default browser scrolling only for mapped keys or navigation keys
      if (
        mappedAction ||
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)
      ) {
        e.preventDefault();
      }

      if (mappedAction) {
        this.triggerAction(mappedAction);
      }
    });
  }

  private initTouch(): void {
    window.addEventListener(
      'touchstart',
      (e) => {
        if (!this.enabled || e.touches.length === 0) return;
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = performance.now();
        this.hasSwipedInCurrentTouch = false;

        // Double tap check for Hoverboard deployment
        const now = performance.now() / 1000;
        if (now - this.lastTapTime < CONSTANTS.HOVERBOARD_DOUBLE_TAP_WINDOW) {
          this.triggerAction('ACTION');
          this.lastTapTime = 0;
        } else {
          this.lastTapTime = now;
        }
      },
      { passive: false }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        // Prevent pull-to-refresh and native scrolling while playing
        if (this.enabled) {
          e.preventDefault();
        }

        if (!this.enabled || e.touches.length === 0 || this.hasSwipedInCurrentTouch) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        const elapsedMs = performance.now() - this.touchStartTime;

        const settings = this.settingsManager.getState();
        const minSwipeDistance = settings.swipeMinDistancePx || 26;
        const maxIntervalMs = settings.swipeMaxIntervalMs || 400;

        if (elapsedMs <= maxIntervalMs) {
          const absX = Math.abs(deltaX);
          const absY = Math.abs(deltaY);

          // Direction locking: require a 1.25x dominance to avoid accidental diagonal triggers
          if (absX >= minSwipeDistance && absX >= absY * 1.25) {
            this.hasSwipedInCurrentTouch = true;
            this.triggerAction(deltaX < 0 ? 'LEFT' : 'RIGHT');
          } else if (absY >= minSwipeDistance && absY >= absX * 1.25) {
            this.hasSwipedInCurrentTouch = true;
            this.triggerAction(deltaY < 0 ? 'UP' : 'DOWN');
          }
        }
      },
      { passive: false }
    );

    window.addEventListener(
      'touchend',
      (e) => {
        if (!this.enabled || e.changedTouches.length === 0) return;

        if (!this.hasSwipedInCurrentTouch) {
          const touch = e.changedTouches[0];
          const deltaX = touch.clientX - this.touchStartX;
          const deltaY = touch.clientY - this.touchStartY;
          const elapsedMs = performance.now() - this.touchStartTime;

          const settings = this.settingsManager.getState();
          const minSwipeDistance = settings.swipeMinDistancePx || 26;
          const maxIntervalMs = settings.swipeMaxIntervalMs || 400;

          if (elapsedMs <= maxIntervalMs) {
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            if (absX >= minSwipeDistance && absX >= absY * 1.25) {
              this.hasSwipedInCurrentTouch = true;
              this.triggerAction(deltaX < 0 ? 'LEFT' : 'RIGHT');
            } else if (absY >= minSwipeDistance && absY >= absX * 1.25) {
              this.hasSwipedInCurrentTouch = true;
              this.triggerAction(deltaY < 0 ? 'UP' : 'DOWN');
            }
          }
        }

        this.hasSwipedInCurrentTouch = false;
      },
      { passive: true }
    );
  }

  /**
   * Initializes on-screen touch buttons with tactile feedback and duplicate protection.
   */
  public initTouchButtons(): void {
    if (typeof document === 'undefined') return;

    const buttonMap: Array<{ id: string; action: InputAction }> = [
      { id: 'touch-left-btn', action: 'LEFT' },
      { id: 'touch-right-btn', action: 'RIGHT' },
      { id: 'touch-up-btn', action: 'UP' },
      { id: 'touch-down-btn', action: 'DOWN' },
      { id: 'touch-board-btn', action: 'ACTION' }
    ];

    buttonMap.forEach(({ id, action }) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const triggerBtn = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        if (!this.enabled) return;

        btn.classList.add('touch-btn-pressed');
        this.triggerAction(action);
      };

      const releaseBtn = () => {
        btn.classList.remove('touch-btn-pressed');
      };

      btn.addEventListener('pointerdown', triggerBtn, { passive: false });
      btn.addEventListener('pointerup', releaseBtn);
      btn.addEventListener('pointercancel', releaseBtn);
      btn.addEventListener('pointerleave', releaseBtn);
    });
  }

  public triggerAction(action: InputAction): void {
    // Dispatch exactly once via EventBus
    this.eventBus.emit('INPUT_ACTION', action);
  }

  public getSettingsManager(): SettingsManager {
    return this.settingsManager;
  }

  /**
   * Consume and return any active buffered action (kept for interface compatibility)
   */
  public consumeBufferedAction(): InputAction | null {
    return null;
  }
}
