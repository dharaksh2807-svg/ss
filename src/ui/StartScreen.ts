import { EventBus, EVENTS } from '../core/EventBus';
import { ProgressionManager } from '../progression/ProgressionManager';
import { UpgradeManager } from '../player/UpgradeManager';
import { DailyRewardManager } from '../progression/DailyRewardManager';
import { getCharacterById } from '../characters/CharacterCatalog';
import { getHoverboardById } from '../hoverboard/HoverboardCatalog';
import { EnvironmentManager } from '../environment/EnvironmentConfig';
import { DailyChallengeManager } from '../core/DailyChallengeManager';

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

        <!-- TOP BAR — Identity + Currency + Settings -->
        <header class="lobby-top-bar">

          <!-- Profile pill (left) -->
          <div class="lobby-profile-pill" id="lobby-profile-pill" role="button" tabindex="0" title="Open Surfer Profile" aria-label="Open profile">
            <span class="profile-avatar-ring" aria-hidden="true">
              <span class="profile-avatar-emoji" id="lobby-avatar-icon">🏃</span>
            </span>
            <div class="profile-info-mini">
              <span class="profile-tag">SURFER</span>
              <span class="profile-name" id="lobby-profile-name">JAX</span>
            </div>
          </div>

          <!-- Wordmark (center) -->
          <div class="lobby-logo-center" aria-label="Metro Runner 3D">
            <h1 class="lobby-title-3d">METRO RUNNER</h1>
            <div class="lobby-tagline">3D · SUBWAY SURFERS</div>
          </div>

          <!-- Currency + Settings (right) -->
          <div class="lobby-resources-group">
            <!-- Coins -->
            <div class="resource-pill gold-pill" id="lobby-coins-pill" role="button" tabindex="0" title="Open Shop" aria-label="Coins — open shop">
              <span class="lobby-coin-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="lCoinG" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stop-color="#fff7a1"/>
                      <stop offset="45%" stop-color="#ffd700"/>
                      <stop offset="85%" stop-color="#f59e0b"/>
                      <stop offset="100%" stop-color="#b45309"/>
                    </radialGradient>
                    <linearGradient id="lCoinR" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#fef08a"/>
                      <stop offset="50%" stop-color="#d97706"/>
                      <stop offset="100%" stop-color="#78350f"/>
                    </linearGradient>
                  </defs>
                  <circle cx="12" cy="12" r="10.5" fill="url(#lCoinR)" stroke="#451a03" stroke-width="0.8"/>
                  <circle cx="12" cy="12" r="8.2" fill="url(#lCoinG)" stroke="#d97706" stroke-width="0.7"/>
                  <polygon points="12,5.2 14.1,9.5 18.8,10.2 15.4,13.5 16.2,18.2 12,16 7.8,18.2 8.6,13.5 5.2,10.2 9.9,9.5" fill="#fffbeb" stroke="#b45309" stroke-width="0.6"/>
                </svg>
              </span>
              <span class="resource-val" id="lobby-coins-val">0</span>
            </div>

            <!-- Keys -->
            <div class="resource-pill cyan-pill" id="lobby-keys-pill" role="button" tabindex="0" title="Key Wallet" aria-label="Keys">
              <svg class="resource-svg-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="7.5" cy="15.5" r="5.5"/>
                <path d="M21 2l-9.6 9.6M15.5 7.5l2 2M13 10l2 2"/>
              </svg>
              <span class="resource-val" id="lobby-keys-val">3</span>
            </div>

            <!-- Boards -->
            <div class="resource-pill purple-pill" id="lobby-boards-pill" role="button" tabindex="0" title="Open Board Hangar" aria-label="Hoverboard charges">
              <svg class="resource-svg-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="2" y="9" width="20" height="6" rx="3"/>
                <circle cx="6.5" cy="18.5" r="2"/>
                <circle cx="17.5" cy="18.5" r="2"/>
              </svg>
              <span class="resource-val" id="lobby-boards-val">5</span>
            </div>

            <!-- Settings -->
            <button id="start-settings-btn" class="lobby-settings-btn" aria-label="Game Settings" title="Settings">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- LEFT RAIL — Score + Daily + Mission -->
        <aside class="lobby-side-rail left-rail">
          <div class="lobby-card-widget score-widget" tabindex="-1" aria-label="All-time best score">
            <span class="widget-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ffbe0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 0 0 5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18"/>
                <path d="M4 22h16M8 22V12m8 10V12"/>
              </svg>
            </span>
            <div class="widget-text">
              <span class="widget-label">ALL-TIME BEST</span>
              <span id="start-high-score" class="widget-val">0</span>
            </div>
          </div>

          <div class="lobby-card-widget daily-widget" id="lobby-daily-widget" role="button" tabindex="0" title="Claim Daily Reward" aria-label="Daily reward">
            <span class="widget-icon widget-icon-pulse" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ffbe0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 12v10H4V12"/>
                <path d="M22 7H2v5h20V7z"/>
                <path d="M12 22V7"/>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
            </span>
            <div class="widget-text">
              <span class="widget-label" id="lobby-daily-status-lbl">DAILY REWARD</span>
              <span class="widget-val highlight-gold" id="lobby-daily-btn-text">READY! CLAIM</span>
            </div>
          </div>

          <div class="lobby-card-widget mission-widget" id="lobby-mission-snippet" role="button" tabindex="0" title="Open Missions &amp; Pass" aria-label="Active mission">
            <span class="widget-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00e5ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
                <line x1="12" y1="2" x2="12" y2="5"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="5" y2="12"/>
                <line x1="19" y1="12" x2="22" y2="12"/>
              </svg>
            </span>
            <div class="widget-text">
              <span class="widget-label">ACTIVE OBJECTIVE</span>
              <span class="widget-val" id="lobby-mission-title">Track Warmup</span>
              <div class="widget-progress-bar">
                <div class="widget-progress-fill" id="lobby-mission-bar" style="width: 35%;"></div>
              </div>
            </div>
          </div>
        </aside>

        <!-- RIGHT RAIL — Challenge + Event + District -->
        <aside class="lobby-side-rail right-rail">
          <div class="lobby-card-widget daily-challenge-widget" id="lobby-daily-challenge-btn" role="button" tabindex="0" title="Open Daily Seeded Challenge" aria-label="Daily challenge">
            <span class="widget-icon widget-icon-pulse" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ffbe0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </span>
            <div class="widget-text">
              <span class="widget-label">DAILY CHALLENGE</span>
              <span class="widget-val highlight-gold" id="lobby-dc-title-snippet">SEEDED RUN</span>
              <span class="widget-sub" id="lobby-dc-sub-snippet">Global track · Share code</span>
            </div>
          </div>

          <div class="lobby-card-widget event-widget" id="lobby-event-snippet" role="button" tabindex="0" title="Open Event Modes" aria-label="Featured event">
            <span class="widget-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#00e5ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </span>
            <div class="widget-text">
              <span class="widget-label">FEATURED EVENT</span>
              <span class="widget-val highlight-cyan">TIME TRIAL 2X</span>
              <span class="widget-sub">60s Clock · Double Score</span>
            </div>
          </div>

          <div class="lobby-card-widget env-widget" id="lobby-env-snippet" role="button" tabindex="0" title="Select Railway District" aria-label="Select railway district">
            <span class="widget-icon" id="lobby-env-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="3" width="16" height="12" rx="2"/>
                <path d="M8 19l4-4 4 4"/>
                <path d="M2 19h20"/>
              </svg>
            </span>
            <div class="widget-text">
              <span class="widget-label">RAILWAY DISTRICT</span>
              <span class="widget-val highlight-cyan" id="lobby-env-title">DYNAMIC DISTRICTS</span>
              <span class="widget-sub" id="lobby-env-sub">Transitions every 800m</span>
            </div>
          </div>
        </aside>

        <!-- HERO ZONE — Badge + Difficulty + PLAY -->
        <main class="lobby-hero-actions">
          <!-- Equipped Runner & Board Identifier Badge -->
          <div class="lobby-equipped-badge" id="lobby-equipped-badge" role="button" tabindex="0" title="Change Character or Board" aria-label="Equipped character and board — tap to change">
            <svg class="equipped-icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span class="equipped-text" id="lobby-equipped-name">JAX · URBAN GLIDE</span>
            <svg class="equipped-edit-svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>

          <!-- Difficulty Mode Selection Toggle -->
          <div class="lobby-mode-toggle" id="lobby-mode-toggle" role="group" aria-label="Difficulty Mode Selection">
            <button id="mode-toggle-beginner" class="mode-toggle-btn active" data-mode="BEGINNER" title="Beginner Mode: Accessible — regular hazards, forgiving curve">
              <svg class="mode-toggle-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="5" r="3"/>
                <path d="M6 21v-4a6 6 0 0 1 12 0v4"/>
              </svg>
              BEGINNER
            </button>
            <button id="mode-toggle-easy" class="mode-toggle-btn" data-mode="EASY" title="Easy Mode: Elevated pace — frequent trains, medium challenge">
              <svg class="mode-toggle-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              EASY
            </button>
            <button id="mode-toggle-hard" class="mode-toggle-btn" data-mode="HARD" title="Hard Mode: High intensity — fast runner, relentless trains">
              <svg class="mode-toggle-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
              </svg>
              HARD
            </button>
          </div>

          <!-- Primary Play Button -->
          <button id="start-play-btn" class="arcade-play-btn" aria-label="Play Game Now">
            <span class="play-btn-shimmer" aria-hidden="true"></span>
            <span class="play-btn-content">
              <svg class="play-icon-svg" viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              <span class="play-text">PLAY NOW</span>
            </span>
          </button>

          <!-- Controls hint — desktop only -->
          <div class="lobby-controls-bar" aria-hidden="true">
            <span><kbd>A</kbd><kbd>D</kbd> Lane</span>
            <span class="sep">·</span>
            <span><kbd>W</kbd> Jump</span>
            <span class="sep">·</span>
            <span><kbd>S</kbd> Slide</span>
            <span class="sep">·</span>
            <span><kbd>Space</kbd> Board</span>
          </div>
        </main>

        <!-- BOTTOM NAV DOCK -->
        <nav class="lobby-dock-nav" id="lobby-bottom-dock" aria-label="Game Navigation">
          <button id="start-characters-btn" class="dock-btn" data-nav="characters" aria-label="Runners">
            <span class="dock-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="7" r="4"/>
                <path d="M5.5 20a8.38 8.38 0 0 1 .9-3.8 8.5 8.5 0 0 1 7.6-4.7 8.38 8.38 0 0 1 3.8.9"/>
              </svg>
            </span>
            <span class="dock-label">RUNNERS</span>
          </button>

          <button id="start-boards-btn" class="dock-btn" data-nav="boards" aria-label="Boards">
            <span class="dock-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="9" width="20" height="6" rx="3"/>
                <circle cx="6.5" cy="18.5" r="1.8"/>
                <circle cx="17.5" cy="18.5" r="1.8"/>
              </svg>
            </span>
            <span class="dock-label">BOARDS</span>
          </button>

          <button id="start-shop-btn" class="dock-btn" data-nav="shop" aria-label="Shop">
            <span class="dock-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </span>
            <span class="dock-label">SHOP</span>
          </button>

          <button id="start-practice-btn" class="dock-btn" data-nav="practice" aria-label="Practice">
            <span class="dock-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </span>
            <span class="dock-label">PRACTICE</span>
          </button>

          <button id="start-missions-btn" class="dock-btn" data-nav="missions" aria-label="Missions">
            <span class="dock-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
                <line x1="12" y1="2" x2="12" y2="5"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="5" y2="12"/>
                <line x1="19" y1="12" x2="22" y2="12"/>
              </svg>
            </span>
            <span class="dock-label">MISSIONS</span>
          </button>

          <button id="start-events-btn" class="dock-btn" data-nav="events" aria-label="Events">
            <span class="dock-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 0 0 5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 1 0 5H18"/>
                <path d="M4 22h16M8 22V11m8 11V11M12 2v4M8 6l4 6 4-6"/>
              </svg>
            </span>
            <span class="dock-label">EVENTS</span>
          </button>

          <button id="start-profile-btn" class="dock-btn" data-nav="profile" aria-label="Profile">
            <span class="dock-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
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
    const beginnerToggle = document.getElementById('mode-toggle-beginner');
    const easyToggle = document.getElementById('mode-toggle-easy');
    const hardToggle = document.getElementById('mode-toggle-hard');

    beginnerToggle?.addEventListener('click', () => {
      this.progression.setActiveGameMode('BEGINNER');
      this.updateState();
    });

    easyToggle?.addEventListener('click', () => {
      this.progression.setActiveGameMode('EASY');
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

    const dailyChallengeBtn = document.getElementById('lobby-daily-challenge-btn');
    if (dailyChallengeBtn) {
      dailyChallengeBtn.addEventListener('click', () => {
        this.hide();
        this.eventBus.emit(EVENTS.OPEN_DAILY_CHALLENGE, 'START');
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

    const beginnerToggle = document.getElementById('mode-toggle-beginner');
    const easyToggle = document.getElementById('mode-toggle-easy');
    const hardToggle = document.getElementById('mode-toggle-hard');

    beginnerToggle?.classList.remove('active');
    easyToggle?.classList.remove('active');
    hardToggle?.classList.remove('active');

    if (activeMode === 'HARD') {
      hardToggle?.classList.add('active');
      if (scoreLabelEl) scoreLabelEl.textContent = 'HARD MODE BEST';
      if (this.highScoreEl) {
        this.highScoreEl.textContent = (stats.hardModeHighScore || 0).toLocaleString();
      }
    } else if (activeMode === 'EASY') {
      easyToggle?.classList.add('active');
      if (scoreLabelEl) scoreLabelEl.textContent = 'EASY MODE BEST';
      if (this.highScoreEl) {
        this.highScoreEl.textContent = (stats.easyModeHighScore || stats.hardModeHighScore || 0).toLocaleString();
      }
    } else {
      beginnerToggle?.classList.add('active');
      if (scoreLabelEl) scoreLabelEl.textContent = 'BEGINNER BEST';
      if (this.highScoreEl) {
        const high = stats.beginnerModeHighScore || stats.bestScore || parseInt(localStorage.getItem('metro_surf_high_score') || '0', 10);
        this.highScoreEl.textContent = high.toLocaleString();
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
    const activeMissions = this.progression.getActiveMissions() || [];
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

    // 7. Daily Challenge Snippet
    try {
      const dcManager = DailyChallengeManager.getInstance();
      const todayChallenge = dcManager.getTodayChallenge();
      const record = dcManager.getTodayRecord();
      const dcTitleEl = document.getElementById('lobby-dc-title-snippet');
      const dcSubEl = document.getElementById('lobby-dc-sub-snippet');
      if (dcTitleEl) {
        dcTitleEl.textContent = todayChallenge.title.toUpperCase();
      }
      if (dcSubEl) {
        if (record && record.bestScore > 0) {
          dcSubEl.textContent = `BEST: ${record.bestScore.toLocaleString()} pts (${record.attempts} run${record.attempts > 1 ? 's' : ''})`;
        } else {
          dcSubEl.textContent = `${todayChallenge.difficulty} • Unbeaten Track`;
        }
      }
    } catch (e) {
      // safe fallback
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
