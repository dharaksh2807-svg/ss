import { EventBus, EVENTS } from '../core/EventBus';

export class StartScreen {
  private element: HTMLElement;
  private playBtn: HTMLButtonElement;
  private shopBtn: HTMLButtonElement | null = null;
  private charactersBtn: HTMLButtonElement | null = null;
  private missionsBtn: HTMLButtonElement | null = null;
  private eventsBtn: HTMLButtonElement | null = null;
  private settingsBtn: HTMLButtonElement;
  private highScoreEl: HTMLElement;

  constructor() {
    this.element = document.getElementById('start-screen')!;
    this.playBtn = document.getElementById('start-play-btn') as HTMLButtonElement;
    this.charactersBtn = document.getElementById('start-characters-btn') as HTMLButtonElement;
    this.shopBtn = document.getElementById('start-shop-btn') as HTMLButtonElement;
    this.missionsBtn = document.getElementById('start-missions-btn') as HTMLButtonElement;
    this.eventsBtn = document.getElementById('start-events-btn') as HTMLButtonElement;
    this.settingsBtn = document.getElementById('start-settings-btn') as HTMLButtonElement;
    this.highScoreEl = document.getElementById('start-high-score')!;

    this.playBtn.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit(EVENTS.GAME_START);
    });

    if (this.charactersBtn) {
      this.charactersBtn.addEventListener('click', () => {
        this.hide();
        EventBus.getInstance().emit('OPEN_CHARACTERS', 'START');
      });
    }

    if (this.shopBtn) {
      this.shopBtn.addEventListener('click', () => {
        this.hide();
        EventBus.getInstance().emit('OPEN_SHOP', 'START');
      });
    }

    if (this.missionsBtn) {
      this.missionsBtn.addEventListener('click', () => {
        this.hide();
        EventBus.getInstance().emit('OPEN_MISSIONS', 'START');
      });
    }

    if (this.eventsBtn) {
      this.eventsBtn.addEventListener('click', () => {
        this.hide();
        EventBus.getInstance().emit('OPEN_EVENTS', 'START');
      });
    }

    this.settingsBtn.addEventListener('click', () => {
      EventBus.getInstance().emit('OPEN_SETTINGS');
    });

    this.updateHighScore();
  }

  public updateHighScore(): void {
    const high = localStorage.getItem('metro_surf_high_score') || '0';
    this.highScoreEl.textContent = parseInt(high, 10).toLocaleString();
  }

  public show(): void {
    this.updateHighScore();
    this.element.classList.remove('hidden');
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }
}
