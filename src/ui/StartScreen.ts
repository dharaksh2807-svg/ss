import { EventBus, EVENTS } from '../core/EventBus';

export class StartScreen {
  private element: HTMLElement;
  private playBtn: HTMLButtonElement;
  private settingsBtn: HTMLButtonElement;
  private highScoreEl: HTMLElement;

  constructor() {
    this.element = document.getElementById('start-screen')!;
    this.playBtn = document.getElementById('start-play-btn') as HTMLButtonElement;
    this.settingsBtn = document.getElementById('start-settings-btn') as HTMLButtonElement;
    this.highScoreEl = document.getElementById('start-high-score')!;

    this.playBtn.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit(EVENTS.GAME_START);
    });

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
