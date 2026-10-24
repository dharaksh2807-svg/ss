import { EventBus, EVENTS } from '../core/EventBus';
import { GameMode } from '../progression/ProgressionTypes';
import { ProgressionManager } from '../progression/ProgressionManager';

export class GameOverModal {
  private element: HTMLElement;
  private progression = ProgressionManager.getInstance();
  private countUpInterval: any = null;

  constructor() {
    let el = document.getElementById('game-over-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'game-over-modal';
      el.className = 'screen-overlay hidden';
      document.getElementById('ui-overlay')?.appendChild(el);
    }
    this.element = el;
    this.renderSkeleton();
  }

  private renderSkeleton(): void {
    this.element.innerHTML = `
      <div class="modal-card arcade-modal-card game-over-card animate-pop">
        <!-- New Record Banner -->
        <div id="new-record-badge" class="badge-new-record hidden">
          <span>🔥 NEW PERSONAL RECORD! 🔥</span>
        </div>

        <div class="modal-top-bar" style="justify-content: center;">
          <div class="modal-title-group" style="text-align: center;">
            <div id="game-over-mode-badge" class="game-over-mode-pill" style="display: none; margin-bottom: 6px;"></div>
            <h2 id="game-over-main-title" class="arcade-title game-over-title">RUN COMPLETED!</h2>
            <div id="game-over-sub-title" class="tab-subtitle" style="margin-top: 4px;">Good hustle out on the rails!</div>
          </div>
        </div>

        <!-- Career Telemetry Stat Grid -->
        <div class="game-over-stats-grid">
          <div class="stat-box highlight-box">
            <span class="stat-label">FINAL SCORE</span>
            <span id="game-over-score" class="stat-value highlight">0</span>
          </div>
          <div class="stat-box">
            <span id="game-over-high-label" class="stat-label">ALL-TIME BEST</span>
            <span id="game-over-high-score" class="stat-value">0</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">COINS COLLECTED</span>
            <span id="game-over-coins" class="stat-value coin-val">
              <span class="hud-coin-icon game-over-coin-icon" aria-hidden="true">
                <svg class="hud-coin-svg" viewBox="0 0 24 24" width="20" height="20">
                  <defs>
                    <radialGradient id="goCoinGold" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stop-color="#fff7a1"/>
                      <stop offset="45%" stop-color="#ffd700"/>
                      <stop offset="85%" stop-color="#f59e0b"/>
                      <stop offset="100%" stop-color="#b45309"/>
                    </radialGradient>
                    <linearGradient id="goCoinRim" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#fef08a"/>
                      <stop offset="50%" stop-color="#d97706"/>
                      <stop offset="100%" stop-color="#78350f"/>
                    </linearGradient>
                  </defs>
                  <circle cx="12" cy="12" r="10.5" fill="url(#goCoinRim)" stroke="#451a03" stroke-width="0.8"/>
                  <circle cx="12" cy="12" r="8.2" fill="url(#goCoinGold)" stroke="#d97706" stroke-width="0.7"/>
                  <polygon points="12,5.2 14.1,9.5 18.8,10.2 15.4,13.5 16.2,18.2 12,16 7.8,18.2 8.6,13.5 5.2,10.2 9.9,9.5" fill="#fffbeb" stroke="#b45309" stroke-width="0.6"/>
                </svg>
              </span>
              <span id="game-over-coins-count">0</span>
            </span>
          </div>
          <div class="stat-box">
            <span class="stat-label">DISTANCE TRAVELED</span>
            <span id="game-over-distance" class="stat-value">0 m</span>
          </div>
        </div>

        <!-- Completed Missions Claim Area -->
        <div id="game-over-missions-container" class="game-over-rewards-area custom-scroll">
          <!-- Dynamically populated completed missions / rewards -->
        </div>

        <!-- Action Buttons -->
        <div class="game-over-actions-flow">
          <button id="game-over-retry-btn" class="arcade-play-btn pulse-glow" style="width: 100%; margin-bottom: 12px;">
            <span class="play-btn-content">
              <span class="play-icon">🔄</span>
              <span class="play-text">PLAY AGAIN</span>
            </span>
          </button>

          <div class="game-over-nav-row">
            <button id="game-over-menu-btn" class="arcade-btn btn-secondary">
              <span class="btn-icon">🏠</span> LOBBY
            </button>
            <button id="game-over-shop-btn" class="arcade-btn btn-gold">
              <span class="btn-icon">🛒</span> SHOP
            </button>
            <button id="game-over-missions-btn" class="arcade-btn btn-secondary">
              <span class="btn-icon">🎯</span> MISSIONS
            </button>
            <button id="game-over-characters-btn" class="arcade-btn btn-secondary">
              <span class="btn-icon">👤</span> RUNNERS
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const retryBtn = this.element.querySelector('#game-over-retry-btn');
    retryBtn?.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit(EVENTS.GAME_RESTART);
    });

    const menuBtn = this.element.querySelector('#game-over-menu-btn');
    menuBtn?.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit('GO_TO_MENU');
    });

    const shopBtn = this.element.querySelector('#game-over-shop-btn');
    shopBtn?.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit('OPEN_SHOP', 'GAMEOVER');
    });

    const missionsBtn = this.element.querySelector('#game-over-missions-btn');
    missionsBtn?.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit('OPEN_MISSIONS', 'GAMEOVER');
    });

    const charsBtn = this.element.querySelector('#game-over-characters-btn');
    charsBtn?.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit('OPEN_CHARACTERS', 'START');
    });
  }

  public show(
    score: number,
    coins: number,
    distanceMeters: number,
    mode: GameMode = 'NORMAL',
    modeResult?: { title?: string; subtitle?: string; bonusCoins?: number }
  ): void {
    let highScore = 0;
    let isNewRecord = false;
    const stats = this.progression.getState().lifetimeStats;

    if (mode === 'HARD') {
      highScore = stats.hardModeHighScore || 0;
      if (score > highScore) {
        highScore = Math.floor(score);
        isNewRecord = true;
      }
    } else if (mode === 'EASY') {
      highScore = stats.easyModeHighScore || 0;
      if (score > highScore) {
        highScore = Math.floor(score);
        isNewRecord = true;
      }
    } else if (mode === 'BEGINNER' || mode === 'NORMAL') {
      const rawHigh = stats.beginnerModeHighScore || parseInt(localStorage.getItem('metro_surf_high_score') || '0', 10);
      highScore = rawHigh;
      if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('metro_surf_high_score', highScore.toString());
        isNewRecord = true;
      }
    } else if (mode === 'TIME_TRIAL') {
      highScore = stats.timeTrialHighScore || 0;
      if (score > highScore) {
        highScore = Math.floor(score);
        isNewRecord = true;
      }
    } else {
      highScore = stats.bestScore || 0;
    }

    const titleEl = this.element.querySelector('#game-over-main-title') as HTMLElement;
    const subTitleEl = this.element.querySelector('#game-over-sub-title') as HTMLElement;
    const recordBadge = this.element.querySelector('#new-record-badge') as HTMLElement;
    const modeBadge = this.element.querySelector('#game-over-mode-badge') as HTMLElement;

    if (modeBadge) {
      if (mode === 'HARD') {
        modeBadge.className = 'game-over-mode-pill mode-hard-pill';
        modeBadge.innerHTML = '🔥 HARD MODE • EXPRESS';
        modeBadge.style.display = 'inline-block';
      } else if (mode === 'EASY') {
        modeBadge.className = 'game-over-mode-pill mode-easy-pill';
        modeBadge.innerHTML = '⚡ EASY MODE';
        modeBadge.style.display = 'inline-block';
      } else if (mode === 'BEGINNER' || mode === 'NORMAL') {
        modeBadge.className = 'game-over-mode-pill mode-normal-pill';
        modeBadge.innerHTML = '🏃 BEGINNER MODE';
        modeBadge.style.display = 'inline-block';
      } else {
        modeBadge.className = 'game-over-mode-pill';
        modeBadge.innerHTML = `🏆 ${mode}`;
        modeBadge.style.display = 'inline-block';
      }
    }

    if (isNewRecord) {
      recordBadge?.classList.remove('hidden');
      if (recordBadge) {
        if (mode === 'HARD') {
          recordBadge.innerHTML = `<span>🔥 NEW HARD MODE RECORD! 🔥</span>`;
        } else if (mode === 'EASY') {
          recordBadge.innerHTML = `<span>⚡ NEW EASY MODE RECORD! ⚡</span>`;
        } else {
          recordBadge.innerHTML = `<span>🏃 NEW BEGINNER RECORD! 🏃</span>`;
        }
      }
    } else {
      recordBadge?.classList.add('hidden');
    }

    if (modeResult && modeResult.title) {
      if (titleEl) titleEl.textContent = modeResult.title;
      if (subTitleEl && modeResult.subtitle) subTitleEl.textContent = modeResult.subtitle;
    } else if (mode === 'HARD') {
      if (titleEl) titleEl.textContent = isNewRecord ? 'NEW HARD RECORD! 🔥' : 'HARD RUN ENDED! 🔥';
      if (subTitleEl) subTitleEl.textContent = `High-velocity sprint: ${Math.floor(distanceMeters).toLocaleString()}m survived`;
    } else if (mode === 'EASY') {
      if (titleEl) titleEl.textContent = isNewRecord ? 'NEW EASY RECORD! ⚡' : 'EASY RUN ENDED! ⚡';
      if (subTitleEl) subTitleEl.textContent = `Dynamic sprint: ${Math.floor(distanceMeters).toLocaleString()}m survived`;
    } else if (mode === 'TIME_TRIAL') {
      if (titleEl) titleEl.textContent = "TIME'S UP! ⏱️";
      if (subTitleEl) subTitleEl.textContent = 'Clock ran out in supersonic gauntlet!';
    } else if (mode === 'COIN_RUSH') {
      if (titleEl) titleEl.textContent = coins >= 150 ? 'VAULT CLEARED! 🪙' : 'RUSH COMPLETED!';
      if (subTitleEl) subTitleEl.textContent = `Gathered ${coins} / 150 gold tokens`;
    } else if (mode === 'SURVIVAL') {
      if (titleEl) titleEl.textContent = 'GAUNTLET FAILED! 💀';
      if (subTitleEl) subTitleEl.textContent = `Endured ${Math.floor(distanceMeters)}m at high speed`;
    } else {
      if (titleEl) titleEl.textContent = 'RUN COMPLETED!';
      if (subTitleEl) subTitleEl.textContent = 'Solid run on the subway rails!';
    }

    // Static stats
    const highLabelEl = this.element.querySelector('#game-over-high-label') as HTMLElement;
    if (highLabelEl) {
      highLabelEl.textContent = mode === 'HARD' ? 'HARD MODE BEST' : 'ALL-TIME BEST';
    }
    const highEl = this.element.querySelector('#game-over-high-score') as HTMLElement;
    if (highEl) {
      highEl.textContent = Math.floor(highScore).toLocaleString();
    }
    const coinsEl = this.element.querySelector('#game-over-coins') as HTMLElement;
    const distEl = this.element.querySelector('#game-over-distance') as HTMLElement;

    const coinsCountEl = this.element.querySelector('#game-over-coins-count') as HTMLElement;
    if (coinsCountEl) {
      coinsCountEl.textContent = coins.toLocaleString();
    } else if (coinsEl) {
      coinsEl.textContent = coins.toLocaleString();
    }
    if (distEl) distEl.textContent = `${Math.floor(distanceMeters).toLocaleString()} m`;

    // Count-up animation for final score
    const scoreEl = this.element.querySelector('#game-over-score') as HTMLElement;
    if (scoreEl) {
      if (this.countUpInterval) clearInterval(this.countUpInterval);
      const targetScore = Math.floor(score);
      const duration = 600; // ms
      const startTime = performance.now();

      const animateCount = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const current = Math.floor(targetScore * (1 - Math.pow(1 - progress, 3)));
        scoreEl.textContent = current.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(animateCount);
        } else {
          scoreEl.textContent = targetScore.toLocaleString();
        }
      };
      requestAnimationFrame(animateCount);
    }

    // Render Claimable Missions Section
    this.renderCompletedMissions();

    this.element.classList.remove('hidden');
    this.element.focus();
  }

  private renderCompletedMissions(): void {
    const container = this.element.querySelector('#game-over-missions-container') as HTMLElement;
    if (!container) return;
    container.innerHTML = '';

    const activeMissions = this.progression.getActiveMissions();
    const claimable = activeMissions.filter((m) => m.completed && !m.claimed);

    if (claimable.length === 0) {
      container.innerHTML = `
        <div class="empty-reward-note">
          Keep running to unlock mission badges and daily season pass rewards!
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="rewards-ready-header">CLAIM COMPLETED OBJECTIVES:</div>
      <div class="claimable-missions-list">
        ${claimable.map((m) => `
          <div class="claimable-mission-row">
            <span class="mission-icon">🎯</span>
            <div class="mission-row-info">
              <span class="mission-name">${m.title}</span>
              <span class="mission-desc">${m.description}</span>
            </div>
            <button class="arcade-btn btn-gold btn-claim-now" data-mission-id="${m.id}">
              CLAIM +${m.rewardCoins} 🪙
            </button>
          </div>
        `).join('')}
      </div>
    `;

    const buttons = container.querySelectorAll('.btn-claim-now');
    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.missionId;
        if (id) {
          const res = this.progression.claimMissionReward(id);
          if (res.success) {
            (e.currentTarget as HTMLButtonElement).disabled = true;
            (e.currentTarget as HTMLButtonElement).textContent = 'CLAIMED ✓';
            (e.currentTarget as HTMLButtonElement).className = 'arcade-btn btn-disabled';
          }
        }
      });
    });
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }
}
