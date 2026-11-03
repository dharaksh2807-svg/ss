import { EventBus, EVENTS } from '../core/EventBus';

type ScreenId = 'START' | 'PAUSE' | 'GAMEOVER' | 'SHOP' | 'CHARACTERS' | 'BOARDS' | 'WORLDS' | 'MISSIONS' | 'SETTINGS';
interface View {
  element: HTMLElement;
  show: (payload?: any) => void;
  hide: () => void;
  escape?: () => boolean;
}
interface Entry { id: ScreenId; focus?: HTMLElement; }

/** OPEN suspends the current view; BACK/CLOSE restore it. HOME is a game lifecycle action.
 * Only navigation history lives here. Managers remain the source of all saved state.
 */
export class NavigationCoordinator {
  private views = new Map<ScreenId, View>();
  private history: Entry[] = [];
  private unsubscribe: (() => void)[] = [];

  constructor(private bus: EventBus, private origin: () => ScreenId | undefined) {
    this.unsubscribe.push(bus.on(EVENTS.UI_BACK, (id: ScreenId) => this.back(id)));
    window.addEventListener('keydown', this.onEscape, true);
    document.addEventListener('touchstart', this.onMenuTouch, { passive: true });
    document.addEventListener('touchmove', this.onMenuTouch, { passive: true });
  }

  public register(id: ScreenId, view: View, event?: string, payload?: (value: any) => any): void {
    this.views.set(id, view);
    if (event) this.unsubscribe.push(this.bus.on(event, value => this.open(id, payload ? payload(value) : undefined)));
  }

  public get hasOverlay(): boolean { return this.history.length > 1; }

  public open(id: ScreenId, payload?: any): void {
    if (!this.history.length) {
      const root = this.origin();
      // Opening a menu must never silently leave an active run.
      if (!root || !this.views.has(root)) return;
      this.history.push({ id: root });
    }
    const top = this.history[this.history.length - 1];
    if (top.id === id) return; // Repeated OPEN must not start another preview loop.
    const existing = this.history.findIndex(entry => entry.id === id);
    if (existing >= 0) {
      while (this.history.length > existing + 1) this.views.get(this.history.pop()!.id)!.hide();
    } else {
      top.focus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
      this.views.get(top.id)!.hide();
      this.history.push({ id });
    }
    const view = this.views.get(id)!;
    view.show(payload);
    this.focus(view);
  }

  public back(id?: ScreenId): void {
    const top = this.history[this.history.length - 1];
    if (!top || this.history.length < 2 || (id && top.id !== id)) return;
    this.views.get(top.id)!.hide();
    this.history.pop();
    const previous = this.history[this.history.length - 1];
    const view = this.views.get(previous.id)!;
    view.show(); // Restore through the update routine, preserving Shop's current category.
    this.focus(view, previous.focus);
    if (this.history.length === 1) this.history = [];
  }

  /** Lifecycle cleanup: hide without BACK, so Home/restart cannot reopen a suspended view. */
  public clear(): void {
    this.history = [];
    for (const view of this.views.values()) view.hide();
  }

  public dispose(): void {
    this.clear();
    for (const off of this.unsubscribe) off();
    window.removeEventListener('keydown', this.onEscape, true);
    document.removeEventListener('touchstart', this.onMenuTouch);
    document.removeEventListener('touchmove', this.onMenuTouch);
  }

  // Let native menu scrolling finish before the window's gameplay gesture listener.
  // Bubble phase preserves showroom canvas gestures and control handlers at their target.
  private onMenuTouch = (event: TouchEvent): void => {
    if (!(event.target instanceof Node)) return;
    for (const view of this.views.values()) {
      if (!view.element.classList.contains('hidden') && view.element.contains(event.target)) {
        event.stopPropagation();
        return;
      }
    }
  };

  private focus(view: View, previous?: HTMLElement): void {
    const target = previous?.isConnected && view.element.contains(previous)
      ? previous : view.element.querySelector<HTMLElement>('button:not(:disabled), [tabindex="0"]') || view.element;
    if (target === view.element) target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }

  private onEscape = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    // These existing specialist overlays own their keyboard interaction.
    if (document.querySelector('#photo-mode-modal:not(.hidden), #dev-bug-report-modal:not(.hidden)')) {
      event.preventDefault(); // Keep InputManager from resuming the run underneath them.
      return;
    }
    const top = this.history[this.history.length - 1];
    const root = this.origin();
    const id = top?.id || root;
    const view = id && this.views.get(id);
    if (!view || view.element.classList.contains('hidden')) return;
    if (!top && id !== 'PAUSE' && id !== 'GAMEOVER') return;
    event.preventDefault();
    event.stopImmediatePropagation(); // Includes InputManager and screens exposed during BACK.
    if (event.repeat) return;
    if (view.escape?.()) return;
    if (top && this.history.length > 1) this.back();
    else if (id === 'PAUSE') this.bus.emit(EVENTS.GAME_RESUME);
    else if (id === 'GAMEOVER') this.bus.emit('GO_TO_MENU');
  };
}
