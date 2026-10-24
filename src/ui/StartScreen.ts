import { EventBus, EVENTS } from '../core/EventBus';
import { ProgressionManager } from '../progression/ProgressionManager';
import { UpgradeManager } from '../player/UpgradeManager';
import { DailyRewardManager } from '../progression/DailyRewardManager';
import { getCharacterById } from '../characters/CharacterCatalog';
import { getHoverboardById } from '../hoverboard/HoverboardCatalog';
import { EnvironmentManager } from '../environment/EnvironmentConfig';

export class StartScreen {
  private element: HTMLElement;
  private playBtn: HTMLButtonElement;
  private charactersBtn: HTMLButtonElement | null = null;
  private boardsBtn: HTMLButtonElement | null = null;
  private shopBtn: HTMLButtonElement | null = null;
  private missionsBtn: HTMLButtonElement | null = null;
  private eventsBtn: HTMLButtonElement | null = null;
  private practiceBtn: HTMLButtonElement | null = null;
  private profileBtn: HTMLButtonElement | null = null;
  private settingsBtn: HTMLButtonElement;
  private dailyRewardBtn: HTMLElement | null = null;
  private highScoreEl: HTMLElement;
  private walletCoinsEl: HTMLElement | null = null;
  private keysEl: HTMLElement | null = null;
  private boardChargesEl: HTMLElement | null = null;
  private activeMissionEl: HTMLElement | null = null;
  private equippedBadgeEl: HTMLElement | null = null;

  private progression = ProgressionManager.getInstance();
  private upgradeManager = UpgradeManager.getInstance();
  private dailyManager = DailyRewardManager.getInstance();
  private eventBus = EventBus.getInstance();

  constructor() {
    this.element = document.getElementById('start-screen')!;
    this.renderLobbyStructure();
    
    this.playBtn = document.getElementById('start-play-btn') as HTMLButtonElement;
    this.charactersBtn = document.getElementById('start-characters-btn') as HTMLButtonElement;
    this.boardsBtn = document.getElementById('start-boards-btn') as HTMLButtonElement;
    this.shopBtn = document.getElementById('start-shop-btn') as HTMLButtonElement;
    this.missionsBtn = document.getElementById('start-missions-btn') as HTMLButtonElement;
    this.eventsBtn = document.getElementById('start-events-btn') as HTMLButtonElement;
    this.practiceBtn = document.getElementById('start-practice-btn') as HTMLButtonElement;
    this.profileBtn = document.getElementById('start-profile-btn') as HTMLButtonElement;
    this.settingsBtn = document.getElementById('start-settings-btn') as HTMLButtonElement;
    this.dailyRewardBtn = document.getElementById('lobby-daily-widget');
    this.highScoreEl = document.getElementById('start-high-score')!;
    this.walletCoinsEl = document.getElementById('lobby-coins-val');
    this.keysEl = document.getElementById('lobby-keys-val');
    this.boardChargesEl = document.getElementById('lobby-boards-val');
    this.activeMissionEl = document.getElementById('lobby-mission-snippet');
    this.equippedBadgeEl = document.getElementById('lobby-equipped-name');

    this.setupListeners();
  }

  private renderLobbyStructure(): void {
    this.element.innerHTML = `
      <div class="lobby-layout-container">
        <!-- Top Status & Currency Bar -->
        <header class="lobby-top-bar">
          <div class="lobby-profile-pill" id="lobby-profile-pill" role="button" tabindex="0" title="Open Surfer Profile">
            <span class="profile-avatar-emoji" id="lobby-avatar-icon">🏃</span>
            <div class="profile-info-mini">
              <span class="profile-tag">SURFER</span>
              <span class="profile-name" id="lobby-profile-name">JAX</span>
            </div>
          </div>

          <div class="lobby-logo-center">
            <h1 class="lobby-title-3d">METRO RUNNER</h1>
            <div class="lobby-tagline">3D SUBWAY SURFERS</div>
          </div>

          <div class="lobby-resources-group">
            <div class="resource-pill gold-pill" id="lobby-coins-pill" role="button" tabindex="0" title="Open Shop">
              <span class="hud-coin-icon lobby-coin-icon" aria-hidden="true">
                <svg class="hud-coin-svg" viewBox="0 0 24 24" width="20" height="20">
                  <defs>
                    <radialGradient id="lobbyCoinGold" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stop-color="#fff7a1"/>
                      <stop offset="45%" stop-color="#ffd700"/>
                      <stop offset="85%" stop-color="#f59e0b"/>
                      <stop offset="100%" stop-color="#b45309"/>
                    </radialGradient>
                    <linearGradient id="lobbyCoinRim" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#fef08a"/>
                      <stop offset="50%" stop-color="#d97706"/>
                      <stop offset="100%" stop-color="#78350f"/>
                    </linearGradient>
                  </defs>
                  <circle cx="12" cy="12" r="10.5" fill="url(#lobbyCoinRim)" stroke="#451a03" stroke-width="0.8"/>
                  <circle cx="12" cy="12" r="8.2" fill="url(#lobbyCoinGold)" stroke="#d97706" stroke-width="0.7"/>
                  <polygon points="12,5.2 14.1,9.5 18.8,10.2 15.4,13.5 16.2,18.2 12,16 7.8,18.2 8.6,13.5 5.2,10.2 9.9,9.5" fill="#fffbeb" stroke="#b45309" stroke-width="0.6"/>
                </svg>
              </span>
              <span class="resource-val" id="lobby-coins-val">0</span>
            </div>
            <div class="resource-pill cyan-pill" id="lobby-keys-pill" role="button" tabindex="0" title="Key Wallet">
              <span class="resource-icon">🔑</span>
              <span class="resource-val" id="lobby-keys-val">3</span>
            </div>
            <div class="resource-pill purple-pill" id="lobby-boards-pill" role="button" tabindex="0" title="Open Board Hangar">
              <span class="resource-icon">🛹</span>
              <span class="resource-val" id="lobby-boards-val">5</span>
            </div>
            <button id="start-settings-btn" class="arcade-icon-btn lobby-settings-btn" aria-label="Game Settings" title="Settings">
              ⚙️
            </button>
          </div>
        </header>

        <!-- Left Progression Widgets Rail -->
        <aside class="lobby-side-rail left-rail">
          <!-- All-Time High Score Pill -->
          <div class="lobby-card-widget score-widget">
            <span class="widget-icon">🏆</span>
            <div class="widget-text">
              <span class="widget-label">ALL-TIME BEST</span>
              <span id="start-high-score" class="widget-val">0</span>
            </div>
          </div>

          <!-- Daily Login Reward Ticker -->
          <div class="lobby-card-widget daily-widget" id="lobby-daily-widget" role="button" tabindex="0" title="Claim Daily Reward">
            <span class="widget-icon pulse-icon">🎁</span>
            <div class="widget-text">
              <span class="widget-label" id="lobby-daily-status-lbl">DAILY REWARD</span>
              <span class="widget-val highlight-gold" id="lobby-daily-btn-text">READY! CLAIM</span>
            </div>
          </div>

          <!-- Active Mission Progress Snippet -->
          <div class="lobby-card-widget mission-widget" id="lobby-mission-snippet" role="button" tabindex="0" title="Open Missions & Pass">
            <span class="widget-icon">🎯</span>
            <div class="widget-text">
              <span class="widget-label">ACTIVE OBJECTIVE</span>
              <span class="widget-val" id="lobby-mission-title">Track Warmup</span>
              <div class="widget-progress-bar">
                <div class="widget-progress-fill" id="lobby-mission-bar" style="width: 35%;"></div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Right Side Challenge Modes & Environment Widget -->
        <aside class="lobby-side-rail right-rail">
          <div class="lobby-card-widget event-widget" id="lobby-event-snippet" role="button" tabindex="0" title="Open Event Modes">
            <span class="widget-icon">⚡</span>
            <div class="widget-text">
              <span class="widget-label">FEATURED EVENT</span>
              <span class="widget-val highlight-cyan">TIME TRIAL 2X</span>
              <span class="widget-sub">60s Clock • Double Score</span>
            </div>
          </div>

          <div class="lobby-card-widget env-widget" id="lobby-env-snippet" role="button" tabindex="0" title="Select Railway District">
            <span class="widget-icon" id="lobby-env-icon">🔄</span>
            <div class="widget-text">
              <span class="widget-label">RAILWAY DISTRICT</span>
              <span class="widget-val highlight-cyan" id="lobby-env-title">DYNAMIC DISTRICTS</span>
              <span class="widget-sub" id="lobby-env-sub">Transitions every 800m</span>
            </div>
          </div>
        </aside>

        <!-- Center Bottom Hero Staging & Action Area -->
        <main class="lobby-hero-actions">
          <!-- Equipped Runner & Board Identifier Badge -->
          <div class="lobby-equipped-badge" id="lobby-equipped-badge" role="button" tabindex="0" title="Change Character or Board">
            <span class="equipped-sparkle">⚡</span>
            <span class="equipped-text" id="lobby-equipped-name">JAX • URBAN GLIDE</span>
            <span class="equipped-arrow">✎</span>
          </div>

          <!-- Difficulty Mode Selection Toggle -->
          <div class="lobby-mode-toggle" id="lobby-mode-toggle" role="group" aria-label="Difficulty Mode Selection">
            <button id="mode-toggle-normal" class="mode-toggle-btn active" data-mode="NORMAL" title="Normal Mode: Balanced arcade running">
              <span class="mode-toggle-icon">🏃</span> NORMAL
            </button>
            <button id="mode-toggle-hard" class="mode-toggle-btn" data-mode="HARD" title="Hard Mode: Faster runner, faster trains, tougher challenges">
              <span class="mode-toggle-icon">⚡</span> HARD MODE
            </button>
          </div>

          <!-- Huge Tactile Play Now Button -->
          <button id="start-play-btn" class="arcade-play-btn pulse-glow" aria-label="Play Game Now">
            <span class="play-btn-glow"></span>
            <span class="play-btn-content">
              <span class="play-icon">▶</span>
              <span class="play-text">PLAY NOW</span>
            </span>
          </button>

          <!-- Subtle Controls Helper -->
          <div class="lobby-controls-bar">
            <span><kbd>A</kbd><kbd>D</kbd> or <kbd>◀</kbd><kbd>▶</kbd> Switch Lanes</span>
            <span class="sep">•</span>
            <span><kbd>W</kbd> or <kbd>Space</kbd> Jump</span>
            <span class="sep">•</span>
            <span><kbd>S</kbd> Slide</span>
            <span class="sep">•</span>
            <span><kbd>Double Tap</kbd> Board</span>
          </div>
        </main>

        <!-- Universal Bottom Navigation Dock -->
        <nav class="lobby-dock-nav" id="lobby-bottom-dock" aria-label="Game Navigation Dock">
          <button id="start-characters-btn" class="dock-btn" data-nav="characters">
            <span class="dock-icon">👤</span>
            <span class="dock-label">RUNNERS</span>
          </button>
          <button id="start-boards-btn" class="dock-btn" data-nav="boards">
            <span class="dock-icon">🛹</span>
            <span class="dock-label">BOARDS</span>
          </button>
          <button id="start-shop-btn" class="dock-btn" data-nav="shop">
            <span class="dock-icon">🛒</span>
            <span class="dock-label">SHOP</span>
          </button>
          <button id="start-practice-btn" class="dock-btn" data-nav="practice">
            <span class="dock-icon">🎓</span>
            <span class="dock-label">PRACTICE</span>
          </button>
          <button id="start-missions-btn" class="dock-btn" data-nav="missions">
            <span class="dock-icon">🎯</span>
            <span class="dock-label">MISSIONS</span>
          </button>
          <button id="start-events-btn" class="dock-btn" data-nav="events">
            <span class="dock-icon">🏆</span>
            <span class="dock-label">EVENTS</span>
          </button>
          <button id="start-profile-btn" class="dock-btn" data-nav="profile">
            <span class="dock-icon">📊</span>
            <span class="dock-label">PROFILE</span>
          </button>
        </nav>
      </div>
    `;
  }

  private setupListeners(): void {
    // Play Game
    this.playBtn.addEventListener('click', () => {
      this.hide();
      this.eventBus.emit(EVENTS.GAME_START);
    });

    // Mode Toggle Buttons
    const normalToggle = document.getElementById('mode-toggle-normal');
    const hardToggle = document.getElementById('mode-toggle-hard');

    normalToggle?.addEventListener('click', () => {
      this.progression.setActiveGameMode('NORMAL');
      this.updateState();
    });

    hardToggle?.addEventListener('click', () => {
      this.progression.setActiveGameMode('HARD');
      this.updateState();
    });

    // Navigation dock items
    if (this.charactersBtn) {
      this.charactersBtn.addEventListener('click', () => {
        this.hide();
        this.eventBus.emit('OPEN_CHARACTERS', 'START');
      });
    }

    if (this.boardsBtn) {
      this.boardsBtn.addEventListener('click', () => {
        this.hide();
        this.eventBus.emit('OPEN_BOARDS', 'START');
      });
    }

    if (this.shopBtn) {
      this.shopBtn.addEventListener('click', () => {
        this.hide();
        this.eventBus.emit('OPEN_SHOP', 'START');
      });
    }

    if (this.missionsBtn) {
      this.missionsBtn.addEventListener('click', () => {
        this.hide();
        this.eventBus.emit('OPEN_MISSIONS', 'START');
      });
    }

    if (this.eventsBtn) {
      this.eventsBtn.addEventListener('click', () => {
        this.hide();
        this.eventBus.emit('OPEN_EVENTS', 'START');
      });
    }

    if (this.practiceBtn) {
      this.practiceBtn.addEventListener('click', () => {
        this.hide();
        this.eventBus.emit('OPEN_PRACTICE', 'START');
      });
    }

    if (this.profileBtn) {
      this.profileBtn.addEventListener('click', () => {
        this.hide();
        this.eventBus.emit('OPEN_PROFILE', 'START');
      });
    }

    this.settingsBtn.addEventListener('click', () => {
      this.eventBus.emit('OPEN_SETTINGS');
    });

    // Top Header Pills
    const profilePill = document.getElementById('lobby-profile-pill');
    if (profilePill) {
      profilePill.addEventListener('click', () => {
        this.hide();
        this.eventBus.emit('OPEN_PROFILE', 'START');
      });
    }

    const coinsPill = document.getElementById('lobby-coins-pill');
    if (coinsPill) {
      coinsPill.addEventListener('click', () => {
        this.hide();
        this.eventBus.emit('OPEN_SHOP', 'START');
      });
    }

    const boardsPill = document.getElementById('lobby-boards-pill');
    if (boardsPill) {
      boardsPill.addEventListener('click', () => {
        this.hide();
        this.eventBus.emit('OPEN_BOARDS', 'START');
      });
    }

    // Side Widgets
    if (this.dailyRewardBtn) {
      this.dailyRewardBtn.addEventListener('click', () => {
        this.hide();
        this.eventBus.emit('OPEN_DAILY_REWARDS', 'START');
      });
    }

    if (this.activeMissionEl) {
      this.activeMissionEl.addEventListener('click', () => {
        this.hide();
        this.eventBus.emit('OPEN_MISSIONS', 'START');
      });
    }

    const eventSnippet = document.getElementById('lobby-event-snippet');
    if (eventSnippet) {
      eventSnippet.addEventListener('click', () => {
        this.hide();
        this.eventBus.emit('OPEN_EVENTS', 'START');
      });
    }

    const equippedBadge = document.getElementById('lobby-equipped-badge');
    if (equippedBadge) {
      equippedBadge.addEventListener('click', () => {
        this.hide();
        this.eventBus.emit('OPEN_CHARACTERS', 'START');
      });
    }

    const envSnippet = document.getElementById('lobby-env-snippet');
    if (envSnippet) {
      envSnippet.addEventListener('click', () => {
        this.eventBus.emit('OPEN_ENVIRONMENT_SELECT');
      });
    }

    // Event updates
    this.eventBus.on('WALLET_UPDATED', () => this.updateState());
    this.eventBus.on(EVENTS.KEYS_UPDATED, () => this.updateState());
    this.eventBus.on('BOARD_CHARGES_UPDATED', () => this.updateState());
    this.eventBus.on('CHARACTER_EQUIPPED', () => this.updateState());
    this.eventBus.on('BOARD_EQUIPPED', () => this.updateState());
    this.eventBus.on('DAILY_REWARD_CLAIMED', () => this.updateState());
    this.eventBus.on('ENVIRONMENT_PREFERENCE_CHANGED', () => this.updateState());
    this.eventBus.on('ENVIRONMENT_CHANGED', () => this.updateState());

    this.updateState();
  }

  public updateState(): void {
    // 1. High Score & Active Mode Toggle
    const activeMode = this.progression.getActiveGameMode();
    const stats = this.progression.getState().lifetimeStats;
    const scoreLabelEl = document.querySelector('.score-widget .widget-label');

    const normalToggle = document.getElementById('mode-toggle-normal');
    const hardToggle = document.getElementById('mode-toggle-hard');

    if (activeMode === 'HARD') {
      normalToggle?.classList.remove('active');
      hardToggle?.classList.add('active');
      if (scoreLabelEl) scoreLabelEl.textContent = 'HARD MODE BEST';
      if (this.highScoreEl) {
        this.highScoreEl.textContent = (stats.hardModeHighScore || 0).toLocaleString();
      }
    } else {
      normalToggle?.classList.add('active');
      hardToggle?.classList.remove('active');
      if (scoreLabelEl) scoreLabelEl.textContent = 'ALL-TIME BEST';
      if (this.highScoreEl) {
        const high = localStorage.getItem('metro_surf_high_score') || '0';
        this.highScoreEl.textContent = parseInt(high, 10).toLocaleString();
      }
    }

    // 2. Wallet & Charges
    if (this.walletCoinsEl) {
      this.walletCoinsEl.textContent = this.upgradeManager.getCoins().toLocaleString();
    }
    if (this.keysEl) {
      this.keysEl.textContent = this.progression.getKeys().toString();
    }
    if (this.boardChargesEl) {
      this.boardChargesEl.textContent = this.progression.getHoverboardCharges().toString();
    }

    // 3. Equipped Runner & Board
    const selCharId = this.progression.getSelectedCharacter();
    const selChar = getCharacterById(selCharId);
    const selBoardId = this.progression.getSelectedBoard();
    const selBoard = getHoverboardById(selBoardId);

    if (this.equippedBadgeEl) {
      const charName = selChar?.name || 'JAX';
      const boardName = selBoard?.name || 'URBAN GLIDE';
      this.equippedBadgeEl.textContent = `${charName.toUpperCase()} • ${boardName.toUpperCase()}`;
    }

    const avatarIcon = document.getElementById('lobby-avatar-icon');
    if (avatarIcon && selChar) {
      avatarIcon.textContent = selChar.portraitIcon;
    }
    const profileName = document.getElementById('lobby-profile-name');
    if (profileName && selChar) {
      profileName.textContent = selChar.name.toUpperCase();
    }

    // 4. Daily Reward Ticker
    const dailyStatus = document.getElementById('lobby-daily-status-lbl');
    const dailyBtnText = document.getElementById('lobby-daily-btn-text');
    const canClaim = this.dailyManager.isClaimAvailable();
    if (dailyStatus && dailyBtnText) {
      if (canClaim) {
        dailyStatus.textContent = 'DAILY REWARD';
        dailyBtnText.textContent = 'READY! 🎁';
        dailyBtnText.className = 'widget-val highlight-gold pulse-text';
      } else {
        dailyStatus.textContent = 'DAILY STREAK';
        dailyBtnText.textContent = `DAY ${this.dailyManager.getCurrentDayNumber()} ✓`;
        dailyBtnText.className = 'widget-val highlight-green';
      }
    }

    // 5. Active Mission
    const activeMissions = this.progression.getActiveMissions();
    const currentMission = activeMissions.find((m) => !m.completed) || activeMissions[0];
    const missionTitleEl = document.getElementById('lobby-mission-title');
    const missionBarEl = document.getElementById('lobby-mission-bar');
    if (currentMission && missionTitleEl && missionBarEl) {
      const pct = Math.min(100, Math.floor((currentMission.progress / currentMission.target) * 100));
      missionTitleEl.textContent = `${currentMission.title} (${pct}%)`;
      missionBarEl.style.width = `${pct}%`;
    }

    // 6. Railway District Environment Selector
    const envPref = EnvironmentManager.getInstance().getPreference();
    const envIconEl = document.getElementById('lobby-env-icon');
    const envTitleEl = document.getElementById('lobby-env-title');
    const envSubEl = document.getElementById('lobby-env-sub');
    if (envIconEl && envTitleEl && envSubEl) {
      if (envPref === 'DYNAMIC') {
        envIconEl.textContent = '🔄';
        envTitleEl.textContent = 'DYNAMIC DISTRICTS';
        envTitleEl.className = 'widget-val highlight-cyan';
        envSubEl.textContent = 'Transitions every 800m';
      } else if (envPref === 'MODERN_METRO') {
        envIconEl.textContent = '🏙️';
        envTitleEl.textContent = 'MODERN METRO';
        envTitleEl.className = 'widget-val highlight-cyan';
      } else if (envPref === 'HISTORIC_QUARTER') {
        envIconEl.textContent = '🏛️';
        envTitleEl.textContent = 'HISTORIC QUARTER';
        envTitleEl.className = 'widget-val highlight-gold';
        envSubEl.textContent = 'Brick viaducts & golden hour';
      } else if (envPref === 'UNDERGROUND_METRO') {
        envIconEl.textContent = '🚇';
        envTitleEl.textContent = 'UNDERGROUND METRO';
        envTitleEl.className = 'widget-val highlight-cyan';
        envSubEl.textContent = 'Vaulted caverns & tile murals';
      }
    }
  }

  public show(): void {
    this.updateState();
    this.element.classList.remove('hidden');
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }
}
