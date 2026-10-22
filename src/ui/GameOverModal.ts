import { EventBus, EVENTS } from '../core/EventBus';
import { GameMode } from '../progression/ProgressionTypes';

export class GameOverModal {
  private element: HTMLElement;
  private retryBtn: HTMLButtonElement;
  private shopBtn: HTMLButtonElement | null = null;
  private missionsBtn: HTMLButtonElement | null = null;
  private menuBtn: HTMLButtonElement;
  private scoreValEl: HTMLElement;
  private highScoreValEl: HTMLElement;
  private coinsValEl: HTMLElement;
  private distanceValEl: HTMLElement;
  private newRecordBadge: HTMLElement;
  private titleEl: HTMLElement;

  constructor() {
    this.element = document.getElementById('game-over-modal')!;
    this.retryBtn = document.getElementById('game-over-retry-btn') as HTMLButtonElement;
    this.shopBtn = document.getElementById('game-over-shop-btn') as HTMLButtonElement;
    this.missionsBtn = document.getElementById('game-over-missions-btn') as HTMLButtonElement;
    const charactersBtn = document.getElementById('game-over-characters-btn') as HTMLButtonElement;
    this.menuBtn = document.getElementById('game-over-menu-btn') as HTMLButtonElement;
    this.scoreValEl = document.getElementById('game-over-score')!;
    this.highScoreValEl = document.getElementById('game-over-high-score')!;
    this.coinsValEl = document.getElementById('game-over-coins')!;
    this.distanceValEl = document.getElementById('game-over-distance')!;
    this.newRecordBadge = document.getElementById('new-record-badge')!;
    this.titleEl = this.element.querySelector('.game-over-title') as HTMLElement;

    this.retryBtn.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit(EVENTS.GAME_RESTART);
    });

    if (charactersBtn) {
      charactersBtn.addEventListener('click', () => {
        this.hide();
        EventBus.getInstance().emit('OPEN_CHARACTERS', 'START');
      });
    }

    const boardsBtn = document.getElementById('game-over-boards-btn') as HTMLButtonElement;
    if (boardsBtn) {
      boardsBtn.addEventListener('click', () => {
        this.hide();
        EventBus.getInstance().emit('OPEN_BOARDS', 'GAMEOVER');
      });
    }

    if (this.shopBtn) {
      this.shopBtn.addEventListener('click', () => {
        this.hide();
        EventBus.getInstance().emit('OPEN_SHOP', 'GAMEOVER');
      });
    }

    if (this.missionsBtn) {
      this.missionsBtn.addEventListener('click', () => {
        this.hide();
        EventBus.getInstance().emit('OPEN_MISSIONS', 'GAMEOVER');
      });
    }

    this.menuBtn.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit('GO_TO_MENU');
    });
  }

  public show(
    score: number,
    coins: number,
    distanceMeters: number,
    mode: GameMode = 'NORMAL',
    modeResult?: { title?: string; subtitle?: string; bonusCoins?: number }
  ): void {
    const rawHigh = localStorage.getItem('metro_surf_high_score') || '0';
    let highScore = parseInt(rawHigh, 10);
    let isNewRecord = false;

    if (mode === 'NORMAL' && score > highScore) {
      highScore = score;
      localStorage.setItem('metro_surf_high_score', Math.floor(score).toString());
      isNewRecord = true;
    }

    this.scoreValEl.textContent = Math.floor(score).toLocaleString();
    this.highScoreValEl.textContent = Math.floor(highScore).toLocaleString();
    this.coinsValEl.textContent = coins.toLocaleString();
    this.distanceValEl.textContent = `${Math.floor(distanceMeters)} m`;

    if (this.titleEl) {
      if (modeResult && modeResult.title) {
        this.titleEl.textContent = modeResult.title;
      } else if (mode === 'TIME_TRIAL') {
        this.titleEl.textContent = "TIME'S UP!";
      } else if (mode === 'COIN_RUSH') {
        this.titleEl.textContent = coins >= 150 ? 'VAULT CLEARED! 🪙' : 'RUSH COMPLETED!';
      } else if (mode === 'SURVIVAL') {
        this.titleEl.textContent = 'SURVIVAL ENDED! 💀';
      } else {
        this.titleEl.textContent = 'RUN OVER!';
      }
    }

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
