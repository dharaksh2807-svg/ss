import { CONSTANTS } from './Constants';
import { EventBus, EVENTS } from './EventBus';

export type InputAction = 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'ACTION' | 'PAUSE';

export class InputManager {
  private eventBus = EventBus.getInstance();
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private lastTapTime = 0;
  private enabled = true;

  // Input buffering
  private bufferedAction: InputAction | null = null;
  private bufferExpiry = 0;
  private readonly BUFFER_DURATION = 0.22; // 220ms buffer window

  constructor() {
    this.initKeyboard();
    this.initTouch();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.bufferedAction = null;
    }
  }

  private initKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled && e.code !== 'Escape' && e.code !== 'KeyP') return;

      // Ignore automatic keyboard repeat to prevent unintended multiple lane switches
      if (e.repeat) return;

      // Prevent default browser scrolling on arrow keys and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.triggerAction('LEFT');
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.triggerAction('RIGHT');
          break;
        case 'ArrowUp':
        case 'KeyW':
          this.triggerAction('UP');
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.triggerAction('DOWN');
          break;
        case 'Space':
          this.triggerAction('ACTION');
          break;
        case 'Escape':
        case 'KeyP':
          this.triggerAction('PAUSE');
          break;
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

        // Double tap check
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
      },
      { passive: false }
    );

    window.addEventListener(
      'touchend',
      (e) => {
        if (!this.enabled || e.changedTouches.length === 0) return;
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        const elapsed = (performance.now() - this.touchStartTime) / 1000;

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        const minSwipeDistance = 25; // Minimum px for swipe detection

        if (elapsed < 0.6 && (absX > minSwipeDistance || absY > minSwipeDistance)) {
          if (absX > absY) {
            // Horizontal swipe
            if (deltaX < 0) {
              this.triggerAction('LEFT');
            } else {
              this.triggerAction('RIGHT');
            }
          } else {
            // Vertical swipe
            if (deltaY < 0) {
              this.triggerAction('UP');
            } else {
              this.triggerAction('DOWN');
            }
          }
        }
      },
      { passive: true }
    );
  }

  private triggerAction(action: InputAction): void {
    // Dispatch exactly once via EventBus
    this.eventBus.emit('INPUT_ACTION', action);
  }

  /**
   * Consume and return any active buffered action (kept for interface compatibility)
   */
  public consumeBufferedAction(): InputAction | null {
    return null;
  }
}
