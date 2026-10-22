import { EventBus } from '../core/EventBus';
import { ProgressionManager } from '../progression/ProgressionManager';
import { UpgradeManager } from '../player/UpgradeManager';
import { getCharacterById } from '../characters/CharacterCatalog';
import { getHoverboardById } from '../hoverboard/HoverboardCatalog';

export class ProfileModal {
  private element: HTMLElement;
  private progression = ProgressionManager.getInstance();
  private upgradeManager = UpgradeManager.getInstance();
  private eventBus = EventBus.getInstance();
  private previousScreen: string | null = null;

  constructor() {
    let el = document.getElementById('profile-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'profile-modal';
      el.className = 'screen-overlay hidden';
      document.getElementById('ui-overlay')?.appendChild(el);
    }
    this.element = el;
    this.setupEvents();
  }

  private setupEvents(): void {
    this.eventBus.on('OPEN_PROFILE', (fromScreen?: string) => {
      this.previousScreen = fromScreen || null;
      this.show();
    });
  }

  public show(): void {
    this.render();
    this.element.classList.remove('hidden');
    this.element.focus();
  }

  public hide(): void {
    if (this.element.classList.contains('hidden')) return;
    this.element.classList.add('hidden');
    const prev = this.previousScreen;
    this.previousScreen = null;
    if (prev === 'START') {
      this.eventBus.emit('GO_TO_MENU');
    }
  }

  public isVisible(): boolean {
    return !this.element.classList.contains('hidden');
  }

  private calculatePlayerRank(stats: any): { title: string; tier: string; badge: string } {
    const totalRuns = stats.totalRuns || 0;
    const bestScore = stats.bestScore || 0;

    if (bestScore >= 50000 || totalRuns >= 50) {
      return { title: 'SUBWAY LEGEND', tier: 'Tier IV — Grandmaster', badge: '👑' };
    } else if (bestScore >= 20000 || totalRuns >= 20) {
      return { title: 'TRACK ACE', tier: 'Tier III — Diamond', badge: '💎' };
    } else if (bestScore >= 5000 || totalRuns >= 8) {
      return { title: 'STREET RUNNER', tier: 'Tier II — Gold', badge: '🥇' };
    }
    return { title: 'ROOKIE SURFER', tier: 'Tier I — Bronze', badge: '🥉' };
  }

  private render(): void {
    const stats = this.progression.getLifetimeStats();
    const unlockedChars = this.progression.getUnlockedCharacters();
    const unlockedBoards = this.progression.getUnlockedBoards();
    const selCharId = this.progression.getSelectedCharacter();
    const selChar = getCharacterById(selCharId);
    const selBoardId = this.progression.getSelectedBoard();
    const selBoard = getHoverboardById(selBoardId);
    const coins = this.upgradeManager.getCoins();
    const rank = this.calculatePlayerRank(stats);

    // Achievements count
    const achList = this.progression.getAchievementsList();
    const completedAchCount = achList.filter((a) => a.state.completedTiers.length > 0).length;

    // High score fallback to localStorage if not yet updated in stats
    const storedHighScore = parseInt(localStorage.getItem('metro_surf_high_score') || '0', 10);
    const bestScore = Math.max(stats.bestScore || 0, storedHighScore);

    this.element.innerHTML = `
      <div class="modal-card arcade-modal-card profile-card animate-pop">
        <!-- Header -->
        <div class="modal-top-bar">
          <div class="modal-title-group">
            <span class="modal-badge-tag cyan-tag">PLAYER DOSSIER</span>
            <h2 class="arcade-title">SURFER PROFILE</h2>
          </div>
          <div class="modal-header-actions">
            <button id="profile-close-btn" class="arcade-icon-btn close-btn" aria-label="Close Profile">✕</button>
          </div>
        </div>

        <div class="profile-scroll-area custom-scroll">
          <!-- Hero Identity Card -->
          <div class="profile-identity-banner">
            <div class="profile-avatar-box">
              <span class="avatar-emoji">${selChar?.portraitIcon || '🏃'}</span>
              <span class="avatar-rank-badge">${rank.badge}</span>
            </div>
            <div class="profile-meta-info">
              <div class="profile-rank-tag">${rank.tier}</div>
              <h3 class="profile-player-name">${rank.title}</h3>
              <div class="profile-equipped-chips">
                <span class="chip-item">👤 ${selChar?.name || 'Jax'}</span>
                <span class="chip-item">🛹 ${selBoard?.name || 'Urban Glide'}</span>
                <span class="chip-item">🪙 ${coins.toLocaleString()} Coins</span>
              </div>
            </div>
          </div>

          <!-- Local Record Notice -->
          <div class="local-records-banner">
            <span class="banner-icon">💾</span>
            <div class="banner-text">
              <strong>OFFLINE PERSONAL RECORDS</strong>
              <span>All statistics and personal bests are verified and recorded locally on this device.</span>
            </div>
          </div>

          <!-- Primary Career Records Grid -->
          <div class="profile-section-label">CAREER HIGHLIGHTS</div>
          <div class="profile-stats-grid">
            <div class="stat-card gold-border">
              <span class="stat-icon">🏆</span>
              <div class="stat-content">
                <span class="stat-label">ALL-TIME BEST SCORE</span>
                <span class="stat-num">${bestScore.toLocaleString()}</span>
              </div>
            </div>

            <div class="stat-card cyan-border">
              <span class="stat-icon">📍</span>
              <div class="stat-content">
                <span class="stat-label">TOTAL DISTANCE</span>
                <span class="stat-num">${Math.floor(stats.totalDistance || 0).toLocaleString()} m</span>
              </div>
            </div>

            <div class="stat-card orange-border">
              <span class="stat-icon">🪙</span>
              <div class="stat-content">
                <span class="stat-label">LIFETIME COINS EARNED</span>
                <span class="stat-num">${(stats.totalCoins || 0).toLocaleString()}</span>
              </div>
            </div>

            <div class="stat-card purple-border">
              <span class="stat-icon">🏃</span>
              <div class="stat-content">
                <span class="stat-label">TOTAL SUBWAY RUNS</span>
                <span class="stat-num">${(stats.totalRuns || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <!-- Secondary Technique & Evasion Metrics -->
          <div class="profile-section-label">PARKOUR & DODGING METRICS</div>
          <div class="profile-metrics-row">
            <div class="metric-pill">
              <span class="metric-icon">🦘</span>
              <span class="metric-val">${(stats.totalJumps || 0).toLocaleString()}</span>
              <span class="metric-lbl">Jumps</span>
            </div>
            <div class="metric-pill">
              <span class="metric-icon">⚡</span>
              <span class="metric-val">${(stats.totalSlides || 0).toLocaleString()}</span>
              <span class="metric-lbl">Slides</span>
            </div>
            <div class="metric-pill">
              <span class="metric-icon">🛡️</span>
              <span class="metric-val">${(stats.totalDodges || 0).toLocaleString()}</span>
              <span class="metric-lbl">Dodges</span>
            </div>
            <div class="metric-pill">
              <span class="metric-icon">🛹</span>
              <span class="metric-val">${(stats.totalHoverboardsUsed || 0).toLocaleString()}</span>
              <span class="metric-lbl">Boards Used</span>
            </div>
          </div>

          <!-- Collection Progress Bar -->
          <div class="profile-section-label">COLLECTION STATUS</div>
          <div class="profile-collection-card">
            <div class="collection-row">
              <div class="collection-title">
                <span>👤 Unlocked Runners:</span>
                <strong>${unlockedChars.length} / 4</strong>
              </div>
              <div class="collection-chips-list">
                ${['char_jax', 'char_luna', 'char_cruz', 'char_nova'].map((id) => {
                  const c = getCharacterById(id);
                  const isOwned = unlockedChars.includes(id);
                  return `<span class="col-chip ${isOwned ? 'owned' : 'locked'}">${c?.portraitIcon} ${c?.name}</span>`;
                }).join('')}
              </div>
            </div>

            <div class="collection-row" style="margin-top: 14px;">
              <div class="collection-title">
                <span>🛹 Unlocked Hoverboards:</span>
                <strong>${unlockedBoards.length} / 4</strong>
              </div>
              <div class="collection-chips-list">
                ${['board_urban_glide', 'board_pulse_rider', 'board_aero_drift', 'board_street_phantom'].map((id) => {
                  const b = getHoverboardById(id);
                  const isOwned = unlockedBoards.includes(id);
                  return `<span class="col-chip ${isOwned ? 'owned' : 'locked'}">${b?.icon} ${b?.name}</span>`;
                }).join('')}
              </div>
            </div>

            <div class="collection-row" style="margin-top: 14px;">
              <div class="collection-title">
                <span>🏆 Achievements Completed:</span>
                <strong>${completedAchCount} / ${achList.length}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer-row">
          <button id="profile-done-btn" class="arcade-btn btn-primary">
            DONE
          </button>
        </div>
      </div>
    `;

    const closeBtn = this.element.querySelector('#profile-close-btn') as HTMLButtonElement;
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    const doneBtn = this.element.querySelector('#profile-done-btn') as HTMLButtonElement;
    if (doneBtn) {
      doneBtn.addEventListener('click', () => this.hide());
    }
  }
}
