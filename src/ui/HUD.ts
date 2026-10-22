import { EventBus, EVENTS } from '../core/EventBus';
import { PowerupManager, PowerupType } from '../player/PowerupManager';

export class HUD {
  private container: HTMLDivElement;
  private scoreEl: HTMLElement;
  private coinEl: HTMLElement;
  private multiplierEl: HTMLElement;
  private powerupContainer: HTMLElement;
  private pauseBtn: HTMLButtonElement;

  private score: number = 0;
  private coins: number = 0;
  private multiplier: number = 1;

  constructor(private powerupManager: PowerupManager) {
    this.container = document.getElementById('hud') as HTMLDivElement;
    this.scoreEl = document.getElementById('hud-score')!;
    this.coinEl = document.getElementById('hud-coins')!;
    this.multiplierEl = document.getElementById('hud-multiplier')!;
    this.powerupContainer = document.getElementById('hud-powerups')!;
    this.pauseBtn = document.getElementById('hud-pause-btn') as HTMLButtonElement;

    this.setupEvents();
  }

  private setupEvents(): void {
    const bus = EventBus.getInstance();
    bus.on(EVENTS.SCORE_UPDATED, (score: number) => {
      this.score = score;
      this.scoreEl.textContent = Math.floor(score).toLocaleString();
    });

    bus.on(EVENTS.COIN_COLLECTED, () => {
      this.coins++;
      this.coinEl.textContent = this.coins.toLocaleString();
    });

    this.pauseBtn.addEventListener('click', () => {
      bus.emit(EVENTS.GAME_PAUSE);
    });
  }

  public setMultiplier(val: number): void {
    this.multiplier = val;
    this.multiplierEl.textContent = `${val}X`;
    if (val > 1) {
      this.multiplierEl.classList.add('active');
    } else {
      this.multiplierEl.classList.remove('active');
    }
  }

  public update(): void {
    // Render active powerup duration bars
    const active = this.powerupManager.getActivePowerups();
    if (active.length === 0) {
      this.powerupContainer.innerHTML = '';
      return;
    }

    let html = '';
    for (const p of active) {
      const pct = Math.max(0, Math.min(100, (p.remaining / p.duration) * 100));
      let icon = '⚡';
      let name = 'Powerup';
      let colorClass = 'powerup-default';

      if (p.type === 'MAGNET') {
        icon = '🧲';
        name = 'MAGNET';
        colorClass = 'powerup-magnet';
      } else if (p.type === 'SNEAKERS') {
        icon = '👟';
        name = 'SNEAKERS';
        colorClass = 'powerup-sneakers';
      } else if (p.type === 'MULTIPLIER') {
        icon = '2X';
        name = 'SCORE 2X';
        colorClass = 'powerup-multiplier';
      } else if (p.type === 'HOVERBOARD') {
        icon = '🛹';
        name = 'HOVERBOARD';
        colorClass = 'powerup-hoverboard';
      }

      html += `
        <div class="powerup-badge ${colorClass}">
          <div class="powerup-header">
            <span class="powerup-icon">${icon}</span>
            <span class="powerup-name">${name}</span>
            <span class="powerup-timer">${Math.ceil(p.remaining)}s</span>
          </div>
          <div class="powerup-bar-track">
            <div class="powerup-bar-fill" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }
    this.powerupContainer.innerHTML = html;
  }

  public show(): void {
    this.container.classList.remove('hidden');
  }

  public hide(): void {
    this.container.classList.add('hidden');
  }

  public reset(): void {
    this.score = 0;
    this.coins = 0;
    this.multiplier = 1;
    this.scoreEl.textContent = '0';
    this.coinEl.textContent = '0';
    this.multiplierEl.textContent = '1X';
    this.powerupContainer.innerHTML = '';
  }

  public getScore(): number {
    return this.score;
  }

  public getCoins(): number {
    return this.coins;
  }
}
