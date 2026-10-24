import { EventBus, EVENTS } from '../core/EventBus';
import { ProgressionManager } from '../progression/ProgressionManager';
import { GAME_MODES } from '../progression/MissionCatalog';
import { GameMode } from '../progression/ProgressionTypes';

export class EventSelectModal {
  private element: HTMLElement;
  private modesContainer: HTMLElement;
  private closeBtn: HTMLButtonElement;
  private progression: ProgressionManager;
  private selectedMode: GameMode = 'NORMAL';
  private previousScreen: string | null = null;

  constructor() {
    this.progression = ProgressionManager.getInstance();

    let el = document.getElementById('events-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'events-modal';
      el.className = 'screen-overlay hidden';
      el.innerHTML = `
        <div class="modal-card glassmorphic events-modal-card">
          <div class="events-modal-header">
            <h2 class="modal-title">CHALLENGE EVENT MODES</h2>
            <p class="tab-subtitle">Pick a challenge operation with specialized rules, modifiers, and rewards!</p>
          </div>

          <div class="event-modes-grid" id="event-modes-list"></div>

          <div class="modal-buttons" style="margin-top: 20px;">
            <button id="events-close-btn" class="btn btn-secondary">BACK</button>
            <button id="events-launch-btn" class="btn btn-primary pulse-anim">
              <span class="btn-icon">▶</span> LAUNCH MISSION
            </button>
          </div>
        </div>
      `;
      document.getElementById('ui-overlay')?.appendChild(el);
    }

    this.element = el;
    this.modesContainer = document.getElementById('event-modes-list')!;
    this.closeBtn = document.getElementById('events-close-btn') as HTMLButtonElement;
    const launchBtn = document.getElementById('events-launch-btn') as HTMLButtonElement;

    this.closeBtn.addEventListener('click', () => {
      this.hide();
    });

    launchBtn.addEventListener('click', () => {
      this.launchSelectedMode();
    });

    const bus = EventBus.getInstance();
    bus.on('OPEN_EVENTS', (fromScreen?: string) => {
      this.previousScreen = fromScreen || null;
      this.show();
    });
  }

  public show(): void {
    this.selectedMode = this.progression.getActiveGameMode();
    this.render();
    this.element.classList.remove('hidden');
  }

  public hide(restorePrevious: boolean = true): void {
    this.element.classList.add('hidden');
    if (restorePrevious && this.previousScreen === 'START') {
      document.getElementById('start-screen')?.classList.remove('hidden');
    }
    this.previousScreen = null;
  }

  private render(): void {
    const stats = this.progression.getState().lifetimeStats;
    let html = '';

    for (const mode of GAME_MODES) {
      const isSelected = mode.id === this.selectedMode;

      let recordLabel = 'BEST SCORE:';
      let recordValue = `${stats.bestScore.toLocaleString()} pts`;

      if (mode.id === 'HARD') {
        recordLabel = 'HARD MODE RECORD:';
        recordValue = `${(stats.hardModeHighScore || 0).toLocaleString()} pts | ${(stats.hardModeBestDistance || 0).toLocaleString()} m`;
      } else if (mode.id === 'TIME_TRIAL') {
        recordLabel = 'TIME TRIAL BEST:';
        recordValue = `${stats.timeTrialHighScore.toLocaleString()} pts`;
      } else if (mode.id === 'COIN_RUSH') {
        recordLabel = 'RUSH RECORD:';
        recordValue = stats.coinRushBestTime > 0 ? `${stats.coinRushBestTime.toFixed(1)}s` : 'Unbeaten';
      } else if (mode.id === 'SURVIVAL') {
        recordLabel = 'MAX DISTANCE:';
        recordValue = `${stats.survivalBestDistance.toLocaleString()} m`;
      }

      html += `
        <div class="event-mode-card ${isSelected ? 'selected' : ''}" data-mode="${mode.id}">
          <div class="mode-card-top">
            <span class="mode-icon">${mode.icon}</span>
            <div class="mode-title-area">
              <span class="mode-tagline">${mode.tagline}</span>
              <h3 class="mode-title">${mode.name}</h3>
            </div>
            <div class="mode-select-radio">${isSelected ? '●' : '○'}</div>
          </div>

          <p class="mode-desc">${mode.description}</p>

          <div class="mode-rules-box">
            <span class="rules-label">SPECIAL RULES:</span>
            <ul class="rules-list">
              ${mode.rules.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>

          <div class="mode-reward-badge">
            <span class="reward-icon">🎁</span>
            <span class="reward-text">${mode.rewardDescription}</span>
          </div>

          <div class="mode-record-row">
            <span class="record-title">${recordLabel}</span>
            <span class="record-val">${recordValue}</span>
          </div>
        </div>
      `;
    }

    this.modesContainer.innerHTML = html;

    const cards = this.modesContainer.querySelectorAll('.event-mode-card');
    cards.forEach((card) => {
      card.addEventListener('click', (e) => {
        const el = (e.currentTarget as HTMLElement);
        const mode = el.dataset.mode as GameMode;
        if (mode) {
          this.selectedMode = mode;
          this.render();
        }
      });
    });
  }

  private launchSelectedMode(): void {
    this.progression.setActiveGameMode(this.selectedMode);
    this.hide(false);
    EventBus.getInstance().emit('START_MODE_RUN', this.selectedMode);
  }
}
