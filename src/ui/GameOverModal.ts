import { EventBus, EVENTS } from '../core/EventBus';

export class GameOverModal {
  private element: HTMLElement;
  private retryBtn: HTMLButtonElement;
  private shopBtn: HTMLButtonElement | null = null;
  private menuBtn: HTMLButtonElement;
  private scoreValEl: HTMLElement;
  private highScoreValEl: HTMLElement;
  private coinsValEl: HTMLElement;
  private distanceValEl: HTMLElement;
  private newRecordBadge: HTMLElement;

  constructor() {
    this.element = document.getElementById('game-over-modal')!;
    this.retryBtn = document.getElementById('game-over-retry-btn') as HTMLButtonElement;
    this.shopBtn = document.getElementById('game-over-shop-btn') as HTMLButtonElement;
    this.menuBtn = document.getElementById('game-over-menu-btn') as HTMLButtonElement;
    this.scoreValEl = document.getElementById('game-over-score')!;
    this.highScoreValEl = document.getElementById('game-over-high-score')!;
    this.coinsValEl = document.getElementById('game-over-coins')!;
    this.distanceValEl = document.getElementById('game-over-distance')!;
    this.newRecordBadge = document.getElementById('new-record-badge')!;

    this.retryBtn.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit(EVENTS.GAME_RESTART);
    });

    if (this.shopBtn) {
      this.shopBtn.addEventListener('click', () => {
        this.hide();
        EventBus.getInstance().emit('OPEN_SHOP', 'GAMEOVER');
      });
    }

    this.menuBtn.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit('GO_TO_MENU');
    });
  }

  public show(score: number, coins: number, distanceMeters: number): void {
    const rawHigh = localStorage.getItem('metro_surf_high_score') || '0';
    let highScore = parseInt(rawHigh, 10);
    let isNewRecord = false;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem('metro_surf_high_score', Math.floor(score).toString());
      isNewRecord = true;
    }

    this.scoreValEl.textContent = Math.floor(score).toLocaleString();
    this.highScoreValEl.textContent = Math.floor(highScore).toLocaleString();
    this.coinsValEl.textContent = coins.toLocaleString();
    this.distanceValEl.textContent = `${Math.floor(distanceMeters)} m`;

    if (isNewRecord) {
      this.newRecordBadge.classList.remove('hidden');
    } else {
      this.newRecordBadge.classList.add('hidden');
    }

    this.element.classList.remove('hidden');
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }
}
