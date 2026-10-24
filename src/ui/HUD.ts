import { EventBus, EVENTS } from '../core/EventBus';
import { PowerupManager, PowerupType } from '../player/PowerupManager';
import { HoverboardManager } from '../hoverboard/HoverboardManager';

import { ProgressionManager } from '../progression/ProgressionManager';
import { GraphicsManager } from '../scene/GraphicsManager';
import { getPowerupIconSvg } from './IconCatalog';
import { FirstUseGuidance } from './FirstUseGuidance';
import { UpgradeManager, UpgradablePowerup } from '../player/UpgradeManager';

export class HUD {
  private container: HTMLDivElement;
  private scoreEl: HTMLElement;
  private coinEl: HTMLElement;
  private multiplierEl: HTMLElement;
  private powerupContainer: HTMLElement;
  private feedbackStack: HTMLElement | null;
  private pauseBtn: HTMLButtonElement;
  private boardBtn: HTMLButtonElement | null = null;
  private boardChargesBadge: HTMLElement | null = null;
  private hoverboardManager: HoverboardManager;

  private score: number = 0;
  private coins: number = 0;
  private multiplier: number = 1;

  private coinBadgeEl: HTMLElement | null = null;
  private bumpTimeout: number | null = null;
  private modeBadgeEl: HTMLElement | null = null;
  private toastContainerEl: HTMLElement | null = null;
  private missionTickerEl: HTMLElement | null = null;
  private fpsCounterEl: HTMLElement | null = null;
  private fpsUpdateTimer: number = 0;

  private completedCelebrationMissionId: string | null = null;
  private completedCelebrationTimer: number = 0;
  private completedMissionInfo: { title: string; rewardCoins: number } | null = null;

  constructor(private powerupManager: PowerupManager) {
    this.container = document.getElementById('hud') as HTMLDivElement;
    this.scoreEl = document.getElementById('hud-score')!;
    this.coinEl = document.getElementById('hud-coins')!;
    this.coinBadgeEl = document.getElementById('hud-coin-badge');
    this.multiplierEl = document.getElementById('hud-multiplier')!;
    this.powerupContainer = document.getElementById('hud-powerups')!;
    this.feedbackStack = document.getElementById('hud-feedback-stack');
    this.pauseBtn = document.getElementById('hud-pause-btn') as HTMLButtonElement;
    this.hoverboardManager = HoverboardManager.getInstance();

    this.boardBtn = document.getElementById('hud-board-btn') as HTMLButtonElement;
    this.boardChargesBadge = document.getElementById('hud-board-charges');

    if (this.boardBtn) {
      this.boardBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hoverboardManager.activate();
      });
      this.boardBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hoverboardManager.activate();
      });
    }

    // Create mode badge container if not present
    let modeEl = document.getElementById('hud-mode-badge');
    if (!modeEl) {
      modeEl = document.createElement('div');
      modeEl.id = 'hud-mode-badge';
      modeEl.className = 'hud-mode-badge hidden';
      this.container.appendChild(modeEl);
    }
    this.modeBadgeEl = modeEl;

    // Create toast notification banner container if not present
    let toastEl = document.getElementById('hud-toast-container');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'hud-toast-container';
      toastEl.className = 'hud-toast-container';
      this.container.appendChild(toastEl);
    }
    this.toastContainerEl = toastEl;

    // Create mini mission ticker if not present
    let tickerEl = document.getElementById('hud-mission-ticker');
    if (!tickerEl) {
      tickerEl = document.createElement('div');
      tickerEl.id = 'hud-mission-ticker';
      tickerEl.className = 'hud-mission-ticker';
      this.container.appendChild(tickerEl);
    }
    this.missionTickerEl = tickerEl;

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
      this.triggerCoinBump();
    });

    this.pauseBtn.addEventListener('click', () => {
      bus.emit(EVENTS.GAME_PAUSE);
    });

    // Progression Event Toasts & HUD Celebration Lifecycle
    bus.on(EVENTS.MISSION_COMPLETED, (mission: any) => {
      this.completedCelebrationMissionId = mission.id;
      this.completedMissionInfo = { title: mission.title, rewardCoins: mission.rewardCoins || 100 };
      this.completedCelebrationTimer = 2.5; // 2.5s celebration in the ticker before advancing
      this.showProgressionToast('MISSION COMPLETED! 🎯', mission.title, `+${mission.rewardCoins} 🪙`);
    });

    bus.on(EVENTS.DAILY_COMPLETED, (daily: any) => {
      this.showProgressionToast('DAILY TARGET REACHED! 📅', daily.title, `+${daily.rewardCoins} 🪙`);
    });

    bus.on(EVENTS.RAMP_ONBOARDING_CUE, () => {
      this.showRampCue();
    });

    bus.on(EVENTS.ACHIEVEMENT_UNLOCKED, (data: any) => {
      this.showProgressionToast(`ACHIEVEMENT ${data.tier}! 🏆`, data.achievement.title, `+${data.rewardCoins} 🪙`);
    });

    bus.on(EVENTS.SEASON_TOKEN_COLLECTED, () => {
      this.showFeedbackBadge('+1 EVENT TOKEN', 'streak');
      const guidance = FirstUseGuidance.getInstance().checkAndTriggerGuidance('SEASON_TOKEN');
      if (guidance.isFirst && guidance.info && guidance.iconSvg) {
        this.showFirstUseToast(guidance.iconSvg, guidance.info.title, guidance.info.shortDesc);
      }
    });

    bus.on('KEY_COLLECTED', () => {
      this.showFeedbackBadge('+1 SAVE ME KEY', 'streak');
      const guidance = FirstUseGuidance.getInstance().checkAndTriggerGuidance('KEY');
      if (guidance.isFirst && guidance.info && guidance.iconSvg) {
        this.showFirstUseToast(guidance.iconSvg, guidance.info.title, guidance.info.shortDesc);
      }
    });

    bus.on(EVENTS.POWERUP_ACTIVATED, (type: PowerupType) => {
      const guidance = FirstUseGuidance.getInstance().checkAndTriggerGuidance(type);
      if (guidance.isFirst && guidance.info && guidance.iconSvg) {
        this.showFirstUseToast(guidance.iconSvg, guidance.info.title, guidance.info.shortDesc);
      } else {
        const name = type === 'MAGNET' ? 'COIN MAGNET'
          : (type === 'JETPACK' ? 'ROCKET JETPACK'
          : (type === 'SNEAKERS' ? 'SUPER SNEAKERS'
          : (type === 'MULTIPLIER' ? '2X MULTIPLIER'
          : (type === 'SHIELD' ? 'PROTECTIVE SHIELD' : 'HOVERBOARD'))));
        this.showFeedbackBadge(`${name} ACTIVE!`, 'precision');
      }
    });

    bus.on('CHRONO_ORB_COLLECTED', (sec: number = 5) => {
      this.showFeedbackBadge(`+${sec}s TIME BONUS! ⏱️`, 'precision');
    });

    // Lightweight In-Game FPS & Diagnostics display
    let fpsEl = document.getElementById('hud-fps-counter');
    if (!fpsEl) {
      fpsEl = document.createElement('div');
      fpsEl.id = 'hud-fps-counter';
      fpsEl.className = 'hud-fps-counter hidden';
      this.container.appendChild(fpsEl);
    }
    this.fpsCounterEl = fpsEl;

    const graphics = GraphicsManager.getInstance();
    if (graphics.isFpsDisplayEnabled()) {
      this.fpsCounterEl.classList.remove('hidden');
    }

    bus.on('FPS_DISPLAY_TOGGLED', (enabled: boolean) => {
      this.fpsCounterEl?.classList.toggle('hidden', !enabled);
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

  public update(dt: number = 0.016): void {
    // 0. Update lightweight FPS & Performance counter if enabled
    if (this.fpsCounterEl && !this.fpsCounterEl.classList.contains('hidden')) {
      this.fpsUpdateTimer += dt;
      if (this.fpsUpdateTimer >= 0.25) {
        this.fpsUpdateTimer = 0;
        const fps = Math.min(120, Math.round(dt > 0 ? 1 / dt : 60));
        const ms = (dt * 1000).toFixed(1);
        const gm = GraphicsManager.getInstance();
        const resolved = gm.getResolvedQuality();
        const preset = gm.getPreset();
        const modeStr = preset === 'AUTO' ? `Auto (${resolved})` : resolved;
        this.fpsCounterEl.textContent = `${fps} FPS • ${ms}ms • ${modeStr}`;
      }
    }

    // 1. Update on-screen hoverboard deploy button
    if (this.boardBtn && this.boardChargesBadge) {
      const isBoardActive = this.hoverboardManager.isBoardActive();
      const cooldown = this.hoverboardManager.getCooldownRemaining();
      const charges = this.hoverboardManager.getCharges();

      if (isBoardActive) {
        this.boardBtn.classList.add('active');
        this.boardBtn.classList.remove('cooldown', 'empty');
        this.boardChargesBadge.textContent = `${Math.ceil(this.hoverboardManager.getRemaining())}s`;
      } else if (cooldown > 0 && charges <= 0) {
        this.boardBtn.classList.add('cooldown');
        this.boardBtn.classList.remove('active', 'empty');
        this.boardChargesBadge.textContent = `${Math.ceil(cooldown)}s`;
      } else if (charges <= 0) {
        this.boardBtn.classList.add('empty');
        this.boardBtn.classList.remove('active', 'cooldown');
        this.boardChargesBadge.textContent = '0';
      } else {
        this.boardBtn.classList.remove('active', 'cooldown', 'empty');
        this.boardChargesBadge.textContent = charges.toString();
      }
    }

    // 2. Update mini mission ticker with full completion celebration & graceful overlay retirement
    if (this.missionTickerEl) {
      if (this.completedCelebrationTimer > 0) {
        this.completedCelebrationTimer -= dt;
      }

      if (this.completedCelebrationTimer > 0) {
        this.missionTickerEl.style.display = 'flex';
        this.missionTickerEl.classList.add('ticker-celebrating');
        const info = this.completedMissionInfo;
        this.missionTickerEl.innerHTML = `
          <span class="ticker-dot">✨</span>
          <span class="ticker-label">${info ? info.title : 'Mission'}:</span>
          <span class="ticker-val completed-gold">COMPLETED! +${info ? info.rewardCoins : 100} 🪙</span>
        `;
      } else {
        this.missionTickerEl.classList.remove('ticker-celebrating');
        const activeMissions = ProgressionManager.getInstance().getActiveMissions();
        const curr = activeMissions.find(m => !m.completed);
        if (curr) {
          this.missionTickerEl.style.display = 'flex';
          const pct = Math.min(100, Math.floor((curr.progress / curr.target) * 100));
          this.missionTickerEl.innerHTML = `
            <span class="ticker-dot">🎯</span>
            <span class="ticker-label">${curr.title}:</span>
            <span class="ticker-val">${Math.floor(curr.progress)} / ${curr.target} (${pct}%)</span>
          `;
        } else {
          // All active objectives completed: gracefully retire from prominent HUD
          this.missionTickerEl.style.display = 'none';
        }
      }
    }

    // 3. Render active powerup duration bars & active hoverboard card
    const active = this.powerupManager.getActivePowerups().filter(p => p.type !== 'HOVERBOARD');
    const isHoverboardActive = this.hoverboardManager.isBoardActive();
    const activeBoard = this.hoverboardManager.getActiveBoard();

    if (active.length === 0 && !isHoverboardActive) {
      this.powerupContainer.innerHTML = '';
      return;
    }

    let html = '';

    // Active Hoverboard Card at top of stack
    if (isHoverboardActive && activeBoard) {
      const remaining = this.hoverboardManager.getRemaining();
      const pct = Math.max(0, Math.min(100, this.hoverboardManager.getProgress() * 100));
      const isExpiring = remaining <= 3.0;
      const expiringClass = isExpiring ? 'powerup-expiring' : '';
      const timerDisplay = isExpiring ? `${remaining.toFixed(1)}s` : `${Math.ceil(remaining)}s`;
      const boardIcon = getPowerupIconSvg('HOVERBOARD', 22);

      html += `
        <div class="powerup-badge powerup-hoverboard powerup-${activeBoard.id} ${expiringClass}">
          <div class="powerup-header">
            <span class="powerup-icon">${boardIcon}</span>
            <span class="powerup-name">${activeBoard.name.toUpperCase()} <span class="powerup-lvl-badge">BOARD</span></span>
            <span class="powerup-timer">${timerDisplay}</span>
          </div>
          <div class="powerup-bar-track">
            <div class="powerup-bar-fill" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }

    const upgradeManager = UpgradeManager.getInstance();

    for (const p of active) {
      const pct = Math.max(0, Math.min(100, (p.remaining / p.duration) * 100));
      const icon = getPowerupIconSvg(p.type, 22);
      let name = 'POWER-UP';
      let colorClass = 'powerup-default';

      if (p.type === 'MAGNET') {
        name = 'MAGNET';
        colorClass = 'powerup-magnet';
      } else if (p.type === 'JETPACK') {
        name = 'JETPACK';
        colorClass = 'powerup-jetpack';
      } else if (p.type === 'SNEAKERS') {
        name = 'SNEAKERS';
        colorClass = 'powerup-sneakers';
      } else if (p.type === 'MULTIPLIER') {
        name = 'SCORE 2X';
        colorClass = 'powerup-multiplier';
      } else if (p.type === 'SHIELD') {
        name = 'SHIELD';
        colorClass = 'powerup-shield';
      }

      let lvlBadge = '';
      try {
        const lvl = upgradeManager.getLevel(p.type as UpgradablePowerup);
        if (lvl) {
          lvlBadge = `<span class="powerup-lvl-badge">${lvl >= 5 ? 'MAX' : `LV.${lvl}`}</span>`;
        }
      } catch {
        // level optional
      }

      const isExpiring = p.remaining <= 3.0;
      const expiringClass = isExpiring ? 'powerup-expiring' : '';
      const timerDisplay = isExpiring ? `${p.remaining.toFixed(1)}s` : `${Math.ceil(p.remaining)}s`;

      html += `
        <div class="powerup-badge ${colorClass} ${expiringClass}">
          <div class="powerup-header">
            <span class="powerup-icon">${icon}</span>
            <span class="powerup-name">${name} ${lvlBadge}</span>
            <span class="powerup-timer">${timerDisplay}</span>
          </div>
          <div class="powerup-bar-track">
            <div class="powerup-bar-fill" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }
    this.powerupContainer.innerHTML = html;
  }

  public showFeedbackBadge(text: string, type: 'streak' | 'precision' | 'nearmiss' = 'precision'): void {
    if (!this.feedbackStack) return;

    // Limit active visible badges to at most 3 to never clutter the screen
    while (this.feedbackStack.children.length >= 3) {
      this.feedbackStack.removeChild(this.feedbackStack.firstChild!);
    }

    const badge = document.createElement('div');
    badge.className = `hud-feedback-pill hud-feedback-${type}`;
    badge.textContent = text;
    this.feedbackStack.appendChild(badge);

    setTimeout(() => {
      if (badge.parentElement) {
        badge.parentElement.removeChild(badge);
      }
    }, 1200);
  }

  public showRampCue(): void {
    if (!this.feedbackStack) return;
    const badge = document.createElement('div');
    badge.className = 'hud-feedback-pill hud-feedback-ramp-cue';
    badge.textContent = '▲ CLIMB RAMP TO ROOF';
    this.feedbackStack.appendChild(badge);

    setTimeout(() => {
      if (badge.parentElement) {
        badge.parentElement.removeChild(badge);
      }
    }, 2800);
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
    if (this.feedbackStack) {
      this.feedbackStack.innerHTML = '';
    }
    if (this.modeBadgeEl) {
      this.modeBadgeEl.classList.add('hidden');
      this.modeBadgeEl.innerHTML = '';
    }
    this.completedCelebrationMissionId = null;
    this.completedCelebrationTimer = 0;
    this.completedMissionInfo = null;
    if (this.missionTickerEl) {
      this.missionTickerEl.classList.remove('ticker-celebrating');
    }
  }

  public setMode(mode: 'BEGINNER' | 'EASY' | 'HARD' | 'NORMAL' | 'TIME_TRIAL' | 'COIN_RUSH' | 'SURVIVAL' | string): void {
    if (!this.modeBadgeEl) return;
    if (mode === 'BEGINNER' || mode === 'NORMAL') {
      this.modeBadgeEl.classList.add('hidden');
      return;
    }

    this.modeBadgeEl.classList.remove('hidden');
    if (mode === 'HARD') {
      this.modeBadgeEl.innerHTML = `
        <span class="mode-badge-icon">🔥</span>
        <span class="mode-badge-title">HARD MODE</span>
        <span id="hud-hard-badge-val" class="mode-badge-val" style="color: #ff3d00; font-weight: 700;">EXPRESS</span>
      `;
    } else if (mode === 'EASY') {
      this.modeBadgeEl.innerHTML = `
        <span class="mode-badge-icon">⚡</span>
        <span class="mode-badge-title">EASY MODE</span>
        <span id="hud-easy-badge-val" class="mode-badge-val" style="color: #00e5ff; font-weight: 700;">ACTIVE</span>
      `;
    } else if (mode === 'TIME_TRIAL') {
      this.modeBadgeEl.innerHTML = `
        <span class="mode-badge-icon">⏱️</span>
        <span class="mode-badge-title">TIME TRIAL</span>
        <span id="hud-time-trial-clock" class="mode-badge-val">60.0s</span>
      `;
    } else if (mode === 'COIN_RUSH') {
      this.modeBadgeEl.innerHTML = `
        <span class="mode-badge-icon">🪙</span>
        <span class="mode-badge-title">COIN RUSH</span>
        <span id="hud-coin-rush-val" class="mode-badge-val">0 / 150</span>
      `;
    } else if (mode === 'SURVIVAL') {
      this.modeBadgeEl.innerHTML = `
        <span class="mode-badge-icon">💀</span>
        <span class="mode-badge-title">SURVIVAL GAUNTLET</span>
        <span id="hud-survival-val" class="mode-badge-val">0 m</span>
      `;
    }
  }

  public setTimeTrialTime(seconds: number): void {
    const clockEl = document.getElementById('hud-time-trial-clock');
    if (clockEl) {
      clockEl.textContent = `${Math.max(0, seconds).toFixed(1)}s`;
      if (seconds <= 10.0) {
        clockEl.classList.add('clock-urgent');
      } else {
        clockEl.classList.remove('clock-urgent');
      }
    }
  }

  public setCoinRushProgress(current: number, target: number = 150): void {
    const rushEl = document.getElementById('hud-coin-rush-val');
    if (rushEl) {
      rushEl.textContent = `${current} / ${target}`;
    }
  }

  public setSurvivalDistance(distanceMeters: number): void {
    const distEl = document.getElementById('hud-survival-val');
    if (distEl) {
      distEl.textContent = `${Math.floor(distanceMeters)} m`;
    }
  }

  public showProgressionToast(header: string, title: string, rewardText: string): void {
    if (!this.toastContainerEl) return;

    const toast = document.createElement('div');
    toast.className = 'progression-toast glassmorphic slide-down-anim';
    toast.innerHTML = `
      <div class="toast-indicator">🎯</div>
      <div class="toast-body">
        <span class="toast-header">${header}</span>
        <span class="toast-title">${title}</span>
      </div>
      <div class="toast-reward">${rewardText}</div>
    `;

    this.toastContainerEl.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('slide-up-anim');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 400);
    }, 3200);
  }

  public showFirstUseToast(iconSvg: string, title: string, shortDesc: string): void {
    if (!this.toastContainerEl) return;

    const toast = document.createElement('div');
    toast.className = 'first-use-guidance-toast glassmorphic slide-down-anim';
    toast.innerHTML = `
      <div class="first-use-icon-wrap">${iconSvg}</div>
      <div class="first-use-body">
        <div class="first-use-tag">⚡ POWER-UP DISCOVERED</div>
        <div class="first-use-title">${title}</div>
        <div class="first-use-desc">${shortDesc}</div>
      </div>
    `;

    this.toastContainerEl.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('slide-up-anim');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 400);
    }, 2800);
  }

  public triggerCoinBump(): void {
    if (!this.coinBadgeEl) return;
    this.coinBadgeEl.classList.remove('coin-pulse');
    // Force DOM reflow to re-trigger CSS keyframe pulse
    void this.coinBadgeEl.offsetWidth;
    this.coinBadgeEl.classList.add('coin-pulse');

    if (this.bumpTimeout !== null) {
      clearTimeout(this.bumpTimeout);
    }
    this.bumpTimeout = window.setTimeout(() => {
      if (this.coinBadgeEl) {
        this.coinBadgeEl.classList.remove('coin-pulse');
      }
      this.bumpTimeout = null;
    }, 220);
  }

  public getScore(): number {
    return this.score;
  }

  public getCoins(): number {
    return this.coins;
  }
}

