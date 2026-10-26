import { EventBus, EVENTS } from '../core/EventBus';
import { GameMode } from '../progression/ProgressionTypes';
import { ProgressionManager } from '../progression/ProgressionManager';
import { getCharacterById, getOutfitById } from '../characters/CharacterCatalog';
import { CrashReplayManager } from '../replay/CrashReplayManager';
import { SkillComboManager } from '../core/SkillComboManager';
import { ReviveManager } from '../revive/ReviveManager';

export class GameOverModal {
  private element: HTMLElement;
  private progression = ProgressionManager.getInstance();
  private countUpInterval: any = null;
  private onReplayCallback: (() => void) | null = null;
  private isRestarting: boolean = false;

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

        <!-- Selected Character Showcase -->
        <div id="game-over-runner-card" class="game-over-runner-card">
          <div class="runner-card-avatar-wrap">
            <div id="game-over-runner-avatar" class="runner-card-avatar">🏃</div>
          </div>
          <div class="runner-card-details">
            <div class="runner-card-header">
              <span id="game-over-runner-name" class="runner-card-name">Jax</span>
              <span id="game-over-runner-rarity" class="runner-card-badge">COMMON</span>
            </div>
            <div id="game-over-runner-outfit" class="runner-card-outfit">Classic Street</div>
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

        <!-- Style & Skill Combo Breakdown Card (Requirement J) -->
        <div id="game-over-style-card" class="game-over-style-card">
          <div class="style-card-header">
            <div class="style-card-title-group">
              <span class="style-card-icon">⚡</span>
              <span class="style-card-headline">SKILL & STYLE TELEMETRY</span>
            </div>
            <div class="style-card-total-badge" id="game-over-style-total">+0 STYLE PTS</div>
          </div>
          <div class="style-card-grid">
            <div class="style-stat-pill">
              <span class="style-pill-label">MAX COMBO</span>
              <span class="style-pill-val" id="go-stat-max-combo">×0</span>
            </div>
            <div class="style-stat-pill">
              <span class="style-pill-label">PERFECT JUMPS</span>
              <span class="style-pill-val" id="go-stat-perfect-jumps">0</span>
            </div>
            <div class="style-stat-pill">
              <span class="style-pill-label">PERFECT SLIDES</span>
              <span class="style-pill-val" id="go-stat-perfect-slides">0</span>
            </div>
            <div class="style-stat-pill">
              <span class="style-pill-label">NEAR MISSES</span>
              <span class="style-pill-val" id="go-stat-near-misses">0</span>
            </div>
            <div class="style-stat-pill">
              <span class="style-pill-label">ROOFTOP MOVES</span>
              <span class="style-pill-val" id="go-stat-rooftop">0</span>
            </div>
          </div>
        </div>

        <!-- Shareable Challenge Course Code Card (Task 2 Requirement J) -->
        <div id="game-over-share-card" class="game-over-share-card hidden">
          <div class="go-share-header">
            <span class="go-share-label">SHARE THIS SEEDED COURSE</span>
            <code id="go-share-code-text" class="go-share-code">MTR1-DST-HRD-00000000-00</code>
          </div>
          <button id="go-copy-code-btn" class="arcade-btn btn-secondary go-copy-btn" title="Copy challenge code">
            <span id="go-copy-btn-text">📋 COPY CHALLENGE CODE</span>
          </button>
        </div>

        <!-- Crash Analysis & Instant Replay Card -->
        <div id="game-over-crash-card" class="game-over-crash-card hidden">
          <div class="crash-card-header">
            <span id="game-over-crash-icon" class="crash-card-icon">💥</span>
            <div class="crash-card-titles">
              <span class="crash-card-tag">CRASH ANALYSIS</span>
              <h3 id="game-over-crash-title" class="crash-card-headline">FATAL COLLISION</h3>
            </div>
          </div>
          <p id="game-over-crash-desc" class="crash-card-desc">Collision on the rails.</p>
          <div class="crash-card-tip-box">
            <span class="tip-bulb">💡</span>
            <span id="game-over-crash-tip" class="crash-card-tip">Stay centered and switch lanes early!</span>
          </div>
          <button id="game-over-replay-btn" class="arcade-btn replay-action-btn" aria-label="Watch Instant Slow-Motion Replay">
            <span class="btn-icon">📹</span>
            <span>WATCH INSTANT REPLAY (SLOW-MO)</span>
          </button>
          <button id="game-over-bug-report-btn" class="arcade-btn bug-report-action-btn" style="width: 100%; margin-top: 8px; background: rgba(239, 68, 68, 0.18); border: 1.5px solid rgba(239, 68, 68, 0.7); color: #fca5a5; font-size: 0.95rem; font-weight: 700; letter-spacing: 1px;" aria-label="Open Developer Bug Diagnostics">
            <span class="btn-icon">🐛</span>
            <span>CAPTURE BUG REPORT [F9]</span>
          </button>
        </div>

        <!-- Completed Missions Claim Area -->
        <div id="game-over-missions-container" class="game-over-rewards-area custom-scroll">
          <!-- Dynamically populated completed missions / rewards -->
        </div>

        <!-- Revive Telemetry Badge (Requirement F) -->
        <div id="game-over-revive-badge" class="game-over-revive-pill">
          <span class="revive-pill-icon">🔑</span>
          <span id="game-over-revive-text">REVIVES: 0 / 3 USED • KEYS PRESERVED</span>
        </div>

        <!-- Action Buttons -->
        <div class="game-over-actions-flow">
          <button id="game-over-retry-btn" class="arcade-play-btn pulse-glow quick-retry-btn" style="width: 100%; margin-bottom: 12px;" aria-label="Quick Retry (Press R or Space)">
            <span class="play-btn-content">
              <span class="play-icon">🔄</span>
              <span id="game-over-retry-text" class="play-text">QUICK RETRY</span>
              <span class="retry-key-badge"><kbd>R</kbd></span>
            </span>
          </button>

          <div class="game-over-nav-row">
            <button id="game-over-menu-btn" class="arcade-btn btn-secondary" aria-label="Return to Lobby (Press ESC)">
              <span class="btn-icon">🏠</span> LOBBY <span class="nav-key-badge"><kbd>ESC</kbd></span>
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
    const copyBtn = this.element.querySelector('#go-copy-code-btn');
    copyBtn?.addEventListener('click', () => {
      const codeEl = this.element.querySelector('#go-share-code-text');
      const text = codeEl?.textContent || '';
      if (text && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
      const btnText = this.element.querySelector('#go-copy-btn-text');
      if (btnText) btnText.textContent = '✓ COPIED!';
      setTimeout(() => {
        if (btnText) btnText.textContent = '📋 COPY CHALLENGE CODE';
      }, 2500);
    });

    const retryBtn = this.element.querySelector('#game-over-retry-btn');
    retryBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleRetry();
    });

    // Keyboard shortcuts for results screen: R / Space / Enter to retry, ESC to Lobby
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.element.classList.contains('hidden')) return;

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        e.stopPropagation();
        this.handleRetry();
      } else if (e.key === ' ' || e.key === 'Enter') {
        const active = document.activeElement;
        if (!active || active === document.body || active === this.element || active.id === 'game-over-retry-btn') {
          e.preventDefault();
          e.stopPropagation();
          this.handleRetry();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
        EventBus.getInstance().emit('GO_TO_MENU');
      }
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

    const replayBtn = this.element.querySelector('#game-over-replay-btn');
    replayBtn?.addEventListener('click', () => {
      if (this.onReplayCallback) {
        this.onReplayCallback();
      } else {
        EventBus.getInstance().emit('REQUEST_INSTANT_REPLAY');
      }
    });

    const bugReportBtn = this.element.querySelector('#game-over-bug-report-btn');
    bugReportBtn?.addEventListener('click', () => {
      EventBus.getInstance().emit('OPEN_BUG_REPORT_MODAL');
    });
  }

  public handleRetry(): void {
    if (this.isRestarting) return;
    this.isRestarting = true;

    const retryBtn = this.element.querySelector('#game-over-retry-btn') as HTMLButtonElement;
    if (retryBtn) {
      retryBtn.disabled = true;
      retryBtn.classList.add('btn-processing');
    }

    this.hide();
    EventBus.getInstance().emit(EVENTS.GAME_RESTART);

    setTimeout(() => {
      this.isRestarting = false;
      if (retryBtn) {
        retryBtn.disabled = false;
        retryBtn.classList.remove('btn-processing');
      }
    }, 400);
  }

  public show(
    score: number,
    coins: number,
    distanceMeters: number,
    mode: GameMode = 'NORMAL',
    modeResult?: {
      title?: string;
      subtitle?: string;
      bonusCoins?: number;
      challenge?: any;
      challengeRecord?: any;
      isNewRecord?: boolean;
    },
    onReplay?: () => void
  ): void {
    this.onReplayCallback = onReplay || null;
    let highScore = 0;
    let isNewRecord = false;
    const stats = this.progression.getState().lifetimeStats;

    if (mode === 'DAILY_CHALLENGE') {
      highScore = modeResult?.challengeRecord?.bestScore || 0;
      isNewRecord = modeResult?.isNewRecord || (score > highScore);
    } else if (mode === 'HARD') {
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
      if (mode === 'DAILY_CHALLENGE') {
        const cName = modeResult?.challenge?.name || 'SEEDED COURSE';
        const cDiff = modeResult?.challenge?.difficulty || '';
        modeBadge.className = 'game-over-mode-pill mode-daily-pill';
        modeBadge.innerHTML = `📅 DAILY CHALLENGE • ${cName.toUpperCase()}${cDiff ? ` (${cDiff})` : ''}`;
        modeBadge.style.display = 'inline-block';
      } else if (mode === 'HARD') {
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
        if (mode === 'DAILY_CHALLENGE') {
          recordBadge.innerHTML = `<span>🏆 NEW CHALLENGE RECORD! 🏆</span>`;
        } else if (mode === 'HARD') {
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
      if (mode === 'DAILY_CHALLENGE') {
        highLabelEl.textContent = 'CHALLENGE BEST';
      } else if (mode === 'HARD') {
        highLabelEl.textContent = 'HARD MODE BEST';
      } else {
        highLabelEl.textContent = 'ALL-TIME BEST';
      }
    }

    // Shareable Course Code & Retry Button
    const shareCard = this.element.querySelector('#game-over-share-card') as HTMLElement;
    const retryText = this.element.querySelector('#game-over-retry-text') as HTMLElement;

    if (mode === 'DAILY_CHALLENGE' && modeResult?.challenge?.shareCode) {
      shareCard?.classList.remove('hidden');
      const shareCodeEl = this.element.querySelector('#go-share-code-text');
      if (shareCodeEl) shareCodeEl.textContent = modeResult.challenge.shareCode;
      if (retryText) retryText.textContent = 'RETRY COURSE';
    } else {
      shareCard?.classList.add('hidden');
      if (retryText) retryText.textContent = 'QUICK RETRY';
    }

    // Revive Telemetry Display (Requirement F)
    const reviveMgr = ReviveManager.getInstance();
    const revivesUsed = reviveMgr.getRevivesUsed();
    const maxRevives = reviveMgr.getMaxRevives();
    const reviveBadge = this.element.querySelector('#game-over-revive-badge');
    const reviveTextEl = this.element.querySelector('#game-over-revive-text');
    if (reviveTextEl) {
      if (mode === 'PRACTICE' || mode === 'ARENA') {
        if (reviveBadge) (reviveBadge as HTMLElement).style.display = 'none';
      } else {
        if (reviveBadge) (reviveBadge as HTMLElement).style.display = 'flex';
        if (revivesUsed === 0) {
          reviveTextEl.textContent = `REVIVES: 0 / ${maxRevives} USED • KEYS PRESERVED`;
        } else if (revivesUsed >= maxRevives) {
          reviveTextEl.textContent = `REVIVES: ${revivesUsed} / ${maxRevives} EXPENDED • RETRY IS FREE`;
        } else {
          reviveTextEl.textContent = `REVIVES: ${revivesUsed} / ${maxRevives} USED • RETRY IS FREE`;
        }
      }
    }

    // First completion bonus banner
    if (modeResult && modeResult.bonusCoins && modeResult.bonusCoins > 0) {
      const missionsContainer = this.element.querySelector('#game-over-missions-container');
      if (missionsContainer) {
        missionsContainer.innerHTML = `
          <div class="go-reward-card pulse-glow">
            <div class="reward-card-left">
              <span class="reward-icon">🎁</span>
              <div class="reward-meta">
                <span class="reward-title">Daily Challenge Completion Reward!</span>
                <span class="reward-desc">First successful completion of today's seeded railway course</span>
              </div>
            </div>
            <div class="reward-val highlight-gold">+${modeResult.bonusCoins} 🪙</div>
          </div>
        `;
      }
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

    // Populate Style & Skill Combo Telemetry
    const styleStats = SkillComboManager.getInstance().getStats();
    const styleTotalEl = this.element.querySelector('#game-over-style-total');
    if (styleTotalEl) styleTotalEl.textContent = `+${styleStats.totalStylePoints.toLocaleString()} STYLE PTS`;

    const maxComboEl = this.element.querySelector('#go-stat-max-combo');
    if (maxComboEl) maxComboEl.textContent = `×${styleStats.bestCombo}`;

    const perfJumpsEl = this.element.querySelector('#go-stat-perfect-jumps');
    if (perfJumpsEl) perfJumpsEl.textContent = `${styleStats.perfectJumps}`;

    const perfSlidesEl = this.element.querySelector('#go-stat-perfect-slides');
    if (perfSlidesEl) perfSlidesEl.textContent = `${styleStats.perfectSlides}`;

    const nearMissesEl = this.element.querySelector('#go-stat-near-misses');
    if (nearMissesEl) nearMissesEl.textContent = `${styleStats.nearMisses}`;

    const rooftopEl = this.element.querySelector('#go-stat-rooftop');
    if (rooftopEl) rooftopEl.textContent = `${styleStats.totalRooftopManeuvers}`;

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

    // Populate equipped runner showcase
    const selCharId = this.progression.getSelectedCharacter();
    const selChar = getCharacterById(selCharId);
    const selOutfitId = this.progression.getSelectedOutfit(selCharId);
    const selOutfit = selOutfitId ? getOutfitById(selCharId, selOutfitId) : undefined;

    const runnerNameEl = this.element.querySelector('#game-over-runner-name') as HTMLElement;
    const runnerRarityEl = this.element.querySelector('#game-over-runner-rarity') as HTMLElement;
    const runnerOutfitEl = this.element.querySelector('#game-over-runner-outfit') as HTMLElement;
    const runnerAvatarEl = this.element.querySelector('#game-over-runner-avatar') as HTMLElement;

    if (selChar) {
      if (runnerNameEl) runnerNameEl.textContent = selChar.name;
      if (runnerRarityEl) {
        runnerRarityEl.textContent = selChar.rarity || 'COMMON';
        runnerRarityEl.className = `runner-card-badge rarity-${(selChar.rarity || 'COMMON').toLowerCase()}`;
      }
      if (runnerOutfitEl) {
        runnerOutfitEl.textContent = selOutfit ? `${selOutfit.name} • ${selChar.title}` : selChar.title;
      }
      if (runnerAvatarEl) {
        if (selChar.thumbnailImage || selChar.previewImage) {
          const imgSrc = selChar.thumbnailImage || selChar.previewImage;
          runnerAvatarEl.innerHTML = `<img src="${imgSrc}" alt="${selChar.name}" class="runner-avatar-img" />`;
        } else {
          runnerAvatarEl.textContent = selChar.portraitIcon || '🏃';
        }
      }
    }

    // Render Claimable Missions Section
    this.renderCompletedMissions();

    // Populate Crash Analysis Card & Instant Replay Action
    const crashCard = this.element.querySelector('#game-over-crash-card') as HTMLElement;
    const crashAnalysis = CrashReplayManager.getInstance().getActiveAnalysis();
    const isSpecialVictory = modeResult?.title === 'VAULT CLEARED! 🪙' || modeResult?.title === "TIME'S UP! ⏱️";

    if (crashCard && crashAnalysis && !isSpecialVictory) {
      const expl = crashAnalysis.explanation;
      const iconEl = crashCard.querySelector('#game-over-crash-icon');
      const titleEl = crashCard.querySelector('#game-over-crash-title');
      const descEl = crashCard.querySelector('#game-over-crash-desc');
      const tipEl = crashCard.querySelector('#game-over-crash-tip');
      const replayBtn = crashCard.querySelector('#game-over-replay-btn') as HTMLElement;

      if (iconEl) iconEl.textContent = expl.icon;
      if (titleEl) titleEl.textContent = expl.headline;
      if (descEl) descEl.textContent = expl.explanation;
      if (tipEl) tipEl.textContent = expl.proTip;

      // Show replay button only if sufficient replay data is available
      if (replayBtn) {
        if (CrashReplayManager.getInstance().hasReplayData()) {
          replayBtn.style.display = 'flex';
        } else {
          replayBtn.style.display = 'none';
        }
      }

      crashCard.classList.remove('hidden');
    } else if (crashCard) {
      crashCard.classList.add('hidden');
    }

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
