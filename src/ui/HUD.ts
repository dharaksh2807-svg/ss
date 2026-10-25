import { EventBus, EVENTS } from '../core/EventBus';
import { PowerupManager, PowerupType } from '../player/PowerupManager';
import { HoverboardManager } from '../hoverboard/HoverboardManager';

import { ProgressionManager } from '../progression/ProgressionManager';
import { GraphicsManager } from '../scene/GraphicsManager';
import { getPowerupConfig } from './PowerupRegistry';
import { getPowerupIconSvg } from './IconCatalog';
import { FirstUseGuidance } from './FirstUseGuidance';
import { UpgradeManager, UpgradablePowerup } from '../player/UpgradeManager';
import { CharacterPortraitRenderer } from './CharacterPortraitRenderer';
import { SettingsManager } from '../settings/SettingsManager';

interface PowerupDOMItem {
  key: string;
  badgeEl: HTMLDivElement;
  fillEl: HTMLDivElement;
  timerEl: HTMLElement;
  nameEl: HTMLElement;
  isExpiring: boolean;
  isCritical: boolean;
}

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
  private portraitRenderer: CharacterPortraitRenderer;

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

  // Cached DOM elements for power-up duration cards to avoid 60fps innerHTML rebuilds
  private activePowerupDOMs: Map<string, PowerupDOMItem> = new Map();
  private pickupToastEl: HTMLElement | null = null;
  private pickupToastTimeout: number | null = null;

  private completedCelebrationMissionId: string | null = null;
  private completedCelebrationTimer: number = 0;
  private completedMissionInfo: { title: string; rewardCoins: number } | null = null;

  // Premium Skill Combo & Style Widget Elements
  private comboWidgetEl: HTMLElement | null = null;
  private comboCountEl: HTMLElement | null = null;
  private comboTierEl: HTMLElement | null = null;
  private comboEventEl: HTMLElement | null = null;
  private comboTimerFillEl: HTMLElement | null = null;
  private comboBrokenTimeout: number | null = null;

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
    this.portraitRenderer = CharacterPortraitRenderer.getInstance();

    this.boardBtn = document.getElementById('hud-board-btn') as HTMLButtonElement;
    this.boardChargesBadge = document.getElementById('hud-board-charges');

    this.comboWidgetEl = document.getElementById('hud-skill-combo');
    this.comboCountEl = document.getElementById('hud-combo-count');
    this.comboTierEl = document.getElementById('hud-combo-tier');
    this.comboEventEl = document.getElementById('hud-combo-event');
    this.comboTimerFillEl = document.getElementById('hud-combo-timer-fill');

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

    bus.on('SHOW_TRAIN_SWITCH_CUE', () => {
      this.showTrainSwitchCue();
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
        const config = getPowerupConfig(type);
        this.showPickupToast(type);
        this.showFeedbackBadge(`${config.title} ACTIVE!`, 'precision');
      }
      this.triggerBadgeRefresh(type);
    });

    bus.on(EVENTS.HOVERBOARD_ACTIVATED, (boardDef?: any) => {
      const guidance = FirstUseGuidance.getInstance().checkAndTriggerGuidance('HOVERBOARD');
      const boardName = boardDef?.name || 'HOVERBOARD';
      if (guidance.isFirst && guidance.info && guidance.iconSvg) {
        this.showFirstUseToast(guidance.iconSvg, guidance.info.title, guidance.info.shortDesc);
      } else {
        this.showPickupToast('HOVERBOARD', `${boardName.toUpperCase()} ACTIVE`, 'Crash Immunity & Speed Boost');
        this.showFeedbackBadge(`${boardName.toUpperCase()} READY!`, 'precision');
      }
      this.triggerBadgeRefresh('HOVERBOARD');
    });

    bus.on(EVENTS.GAME_OVER, () => {
      this.clearPowerupCards();
    });

    bus.on(EVENTS.GAME_RESTART, () => {
      this.clearPowerupCards();
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

    bus.on(EVENTS.STUMBLE, () => {
      if (SettingsManager.getInstance().getState().visualHazardCues) {
        this.showVisualHazardCue('⚠️ GUARD IN PURSUIT! REGAIN SPEED!', 'warning');
      }
    });

    bus.on(EVENTS.CHASER_STUMBLE_REACTION, () => {
      if (SettingsManager.getInstance().getState().visualHazardCues) {
        this.showVisualHazardCue('⚠️ INSPECTOR CLOSING IN!', 'danger');
      }
    });

    bus.on('HAZARD_ALERT', (text: string) => {
      if (SettingsManager.getInstance().getState().visualHazardCues) {
        this.showVisualHazardCue(text, 'warning');
      }
    });

    bus.on('FPS_DISPLAY_TOGGLED', (enabled: boolean) => {
      this.fpsCounterEl?.classList.toggle('hidden', !enabled);
    });

    // Skill Combo & Style System Event Handlers
    bus.on(EVENTS.SKILL_EVENT, (payload: any) => {
      this.handleSkillEvent(payload);
    });

    bus.on(EVENTS.COMBO_UPDATED, (data: any) => {
      this.updateComboDisplay(data);
    });

    bus.on(EVENTS.COMBO_MILESTONE, (data: any) => {
      this.handleComboMilestone(data);
    });

    bus.on(EVENTS.COMBO_BROKEN, (data: any) => {
      this.handleComboBroken(data);
    });

    bus.on(EVENTS.COMBO_EXPIRED, () => {
      this.handleComboExpired();
    });
  }

  private handleSkillEvent(payload: any): void {
    if (!this.comboWidgetEl) return;
    if (this.comboBrokenTimeout) {
      clearTimeout(this.comboBrokenTimeout);
      this.comboBrokenTimeout = null;
    }
    this.comboWidgetEl.classList.remove('hidden', 'combo-broken-flash');
    if (this.comboCountEl) this.comboCountEl.textContent = `COMBO ×${payload.combo}`;
    if (this.comboTierEl) {
      this.comboTierEl.textContent = payload.tierLabel || payload.tier;
      this.comboTierEl.style.color = payload.color || '#00f0ff';
      this.comboTierEl.style.borderColor = payload.color || '#00f0ff';
    }
    if (this.comboEventEl) {
      this.comboEventEl.textContent = payload.label;
    }
    if (this.comboTimerFillEl) {
      this.comboTimerFillEl.style.width = '100%';
    }

    if (!SettingsManager.getInstance().isReducedMotion()) {
      this.comboWidgetEl.classList.remove('animate-combo-punch');
      void this.comboWidgetEl.offsetWidth; // Force reflow
      this.comboWidgetEl.classList.add('animate-combo-punch');
    }
  }

  private updateComboDisplay(data: any): void {
    if (!this.comboWidgetEl) return;
    if (data.combo > 0) {
      this.comboWidgetEl.classList.remove('hidden');
      if (this.comboCountEl) this.comboCountEl.textContent = `COMBO ×${data.combo}`;
      if (this.comboTierEl) {
        this.comboTierEl.textContent = data.tierLabel || data.tier;
        this.comboTierEl.style.color = data.color || '#00f0ff';
        this.comboTierEl.style.borderColor = data.color || '#00f0ff';
      }
      if (this.comboTimerFillEl) {
        this.comboTimerFillEl.style.width = `${Math.round(data.ratio * 100)}%`;
      }
    } else if (!this.comboBrokenTimeout) {
      this.comboWidgetEl.classList.add('hidden');
    }
  }

  private handleComboMilestone(data: any): void {
    if (!this.comboWidgetEl) return;
    if (!SettingsManager.getInstance().isReducedMotion()) {
      this.comboWidgetEl.classList.add('milestone-shimmer');
      setTimeout(() => {
        this.comboWidgetEl?.classList.remove('milestone-shimmer');
      }, 700);
    }
    this.showFeedbackBadge(`${data.label} MILESTONE! 👑`, 'streak');
  }

  private handleComboBroken(data: any): void {
    if (!this.comboWidgetEl) return;
    this.comboWidgetEl.classList.add('combo-broken-flash');
    if (this.comboEventEl) {
      this.comboEventEl.textContent = `COMBO BROKEN (${data.reason || 'HIT'})`;
    }
    if (this.comboBrokenTimeout) clearTimeout(this.comboBrokenTimeout);
    this.comboBrokenTimeout = window.setTimeout(() => {
      this.comboWidgetEl?.classList.remove('combo-broken-flash');
      this.comboWidgetEl?.classList.add('hidden');
      this.comboBrokenTimeout = null;
    }, 450);
  }

  private handleComboExpired(): void {
    if (!this.comboWidgetEl) return;
    this.comboWidgetEl.classList.add('hidden');
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

  public update(
    dt: number = 0.016,
    isSliding: boolean = false,
    isJumping: boolean = false,
    speed: number = 18.0
  ): void {
    // Live Animated Character Facial Portrait & Reaction Update
    this.portraitRenderer.update(dt, isSliding, isJumping, speed);

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

    // 3. Render active powerup duration bars & active hoverboard card using cached DOM elements
    const active = this.powerupManager.getActivePowerups().filter(p => p.type !== 'HOVERBOARD');
    const isHoverboardActive = this.hoverboardManager.isBoardActive();
    const activeBoard = this.hoverboardManager.getActiveBoard();

    const activeKeys = new Set<string>();

    const formatTimer = (sec: number): string => {
      if (sec <= 1.0) {
        return `${Math.max(0, sec).toFixed(1)}s`;
      }
      if (sec <= 3.0) {
        return `${sec.toFixed(1)}s`;
      }
      return `${Math.ceil(sec)}s`;
    };

    // Active Hoverboard Card at top of stack (authoritative state from HoverboardManager)
    if (isHoverboardActive && activeBoard) {
      activeKeys.add('HOVERBOARD');
      const remaining = this.hoverboardManager.getRemaining();
      const pct = Math.max(0, Math.min(100, this.hoverboardManager.getProgress() * 100));
      const powerupAlerts = SettingsManager.getInstance().getState().powerupAlerts;
      const isExpiring = powerupAlerts ? remaining <= 3.5 : remaining <= 2.5;
      const isCritical = powerupAlerts ? remaining <= 1.8 : remaining <= 1.0;
      const timerDisplay = formatTimer(remaining);

      let item = this.activePowerupDOMs.get('HOVERBOARD');
      if (item) {
        item.fillEl.style.width = `${pct}%`;
        if (item.timerEl.textContent !== timerDisplay) {
          item.timerEl.textContent = timerDisplay;
        }
        item.badgeEl.classList.toggle('powerup-expiring', isExpiring);
        item.badgeEl.classList.toggle('powerup-critical', isCritical);
        item.isExpiring = isExpiring;
        item.isCritical = isCritical;
      } else {
        const config = getPowerupConfig('HOVERBOARD');
        const badgeEl = document.createElement('div');
        badgeEl.className = `powerup-badge powerup-hoverboard powerup-${activeBoard.id} animate-pop-in`;
        if (isExpiring) badgeEl.classList.add('powerup-expiring');
        if (isCritical) badgeEl.classList.add('powerup-critical');

        badgeEl.innerHTML = `
          <div class="powerup-header">
            <span class="powerup-icon">${config.iconSvg}</span>
            <span class="powerup-name">${activeBoard.name.toUpperCase()} <span class="powerup-lvl-badge">BOARD</span></span>
            <span class="powerup-timer">${timerDisplay}</span>
          </div>
          <div class="powerup-bar-track">
            <div class="powerup-bar-fill" style="width: ${pct}%"></div>
          </div>
        `;
        this.powerupContainer.appendChild(badgeEl);

        const fillEl = badgeEl.querySelector('.powerup-bar-fill') as HTMLDivElement;
        const timerEl = badgeEl.querySelector('.powerup-timer') as HTMLElement;
        const nameEl = badgeEl.querySelector('.powerup-name') as HTMLElement;

        item = {
          key: 'HOVERBOARD',
          badgeEl,
          fillEl,
          timerEl,
          nameEl,
          isExpiring,
          isCritical
        };
        this.activePowerupDOMs.set('HOVERBOARD', item);
      }
    }

    const upgradeManager = UpgradeManager.getInstance();

    for (const p of active) {
      activeKeys.add(p.type);
      const pct = Math.max(0, Math.min(100, (p.remaining / p.duration) * 100));
      const powerupAlerts = SettingsManager.getInstance().getState().powerupAlerts;
      const isExpiring = powerupAlerts ? p.remaining <= 3.5 : p.remaining <= 2.5;
      const isCritical = powerupAlerts ? p.remaining <= 1.8 : p.remaining <= 1.0;
      const timerDisplay = formatTimer(p.remaining);

      let item = this.activePowerupDOMs.get(p.type);
      if (item) {
        item.fillEl.style.width = `${pct}%`;
        if (item.timerEl.textContent !== timerDisplay) {
          item.timerEl.textContent = timerDisplay;
        }
        item.badgeEl.classList.toggle('powerup-expiring', isExpiring);
        item.badgeEl.classList.toggle('powerup-critical', isCritical);
        item.isExpiring = isExpiring;
        item.isCritical = isCritical;
      } else {
        const config = getPowerupConfig(p.type);
        let lvlBadge = '';
        try {
          const lvl = upgradeManager.getLevel(p.type as UpgradablePowerup);
          if (lvl) {
            lvlBadge = `<span class="powerup-lvl-badge">${lvl >= 5 ? 'MAX' : `LV.${lvl}`}</span>`;
          }
        } catch {
          // level optional
        }

        const badgeEl = document.createElement('div');
        badgeEl.className = `powerup-badge ${config.badgeClass} animate-pop-in`;
        if (isExpiring) badgeEl.classList.add('powerup-expiring');
        if (isCritical) badgeEl.classList.add('powerup-critical');

        badgeEl.innerHTML = `
          <div class="powerup-header">
            <span class="powerup-icon">${config.iconSvg}</span>
            <span class="powerup-name">${config.title} ${lvlBadge}</span>
            <span class="powerup-timer">${timerDisplay}</span>
          </div>
          <div class="powerup-bar-track">
            <div class="powerup-bar-fill" style="width: ${pct}%"></div>
          </div>
        `;
        this.powerupContainer.appendChild(badgeEl);

        const fillEl = badgeEl.querySelector('.powerup-bar-fill') as HTMLDivElement;
        const timerEl = badgeEl.querySelector('.powerup-timer') as HTMLElement;
        const nameEl = badgeEl.querySelector('.powerup-name') as HTMLElement;

        item = {
          key: p.type,
          badgeEl,
          fillEl,
          timerEl,
          nameEl,
          isExpiring,
          isCritical
        };
        this.activePowerupDOMs.set(p.type, item);
      }
    }

    // Clean up expired items cleanly without rebuilding the entire stack
    for (const [key, item] of this.activePowerupDOMs.entries()) {
      if (!activeKeys.has(key)) {
        if (item.badgeEl.parentElement === this.powerupContainer) {
          this.powerupContainer.removeChild(item.badgeEl);
        }
        this.activePowerupDOMs.delete(key);
      }
    }

    // Adapt layout style when 3 or more are active simultaneously
    this.powerupContainer?.classList?.toggle?.('powerup-multi-3', activeKeys.size >= 3);
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
    this.portraitRenderer.syncFromProgression();
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
    this.clearPowerupCards();
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

  public clearPowerupCards(): void {
    for (const item of this.activePowerupDOMs.values()) {
      if (item.badgeEl.parentElement === this.powerupContainer) {
        this.powerupContainer.removeChild(item.badgeEl);
      }
    }
    this.activePowerupDOMs.clear();
    this.powerupContainer.innerHTML = '';
    this.powerupContainer?.classList?.remove?.('powerup-multi-3');
    if (this.pickupToastEl) {
      this.pickupToastEl.classList.add('hidden');
    }
  }

  public triggerBadgeRefresh(key: string): void {
    const item = this.activePowerupDOMs.get(key);
    if (item) {
      item.badgeEl.classList.remove('powerup-refreshed');
      void item.badgeEl.offsetWidth;
      item.badgeEl.classList.add('powerup-refreshed');
    }
  }

  public showPickupToast(type: PowerupType, customTitle?: string, customDesc?: string): void {
    if (!this.pickupToastEl) {
      this.pickupToastEl = document.getElementById('hud-pickup-toast');
    }
    if (!this.pickupToastEl) return;

    const config = getPowerupConfig(type);
    const title = customTitle || `${config.title} ACTIVATED`;
    const desc = customDesc || config.tagline;

    this.pickupToastEl.innerHTML = `
      <div class="toast-icon-wrap">${config.iconSvg}</div>
      <div class="toast-text-col">
        <span class="toast-title">${title}</span>
        <span class="toast-desc">${desc}</span>
      </div>
    `;

    this.pickupToastEl.style.borderColor = config.accentColor;
    this.pickupToastEl.style.boxShadow = `0 8px 26px rgba(0, 0, 0, 0.6), 0 0 16px ${config.glowColor}`;
    this.pickupToastEl.classList.remove('hidden');

    if (this.pickupToastTimeout !== null) {
      clearTimeout(this.pickupToastTimeout);
    }

    this.pickupToastTimeout = window.setTimeout(() => {
      if (this.pickupToastEl) {
        this.pickupToastEl.classList.add('hidden');
      }
      this.pickupToastTimeout = null;
    }, 1100);
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

  public showTrainSwitchCue(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        if (localStorage.getItem('metro_runner_train_switch_seen')) return;
        localStorage.setItem('metro_runner_train_switch_seen', 'true');
      } catch (_) {}
    }
    if (!this.toastContainerEl) return;

    const toast = document.createElement('div');
    toast.className = 'train-switch-cue-toast glassmorphic slide-down-anim';
    toast.style.cssText = 'position:fixed;top:18%;left:50%;transform:translateX(-50%);background:rgba(10,25,47,0.85);backdrop-filter:blur(8px);border:1px solid rgba(0,229,255,0.4);border-radius:12px;padding:10px 20px;color:#fff;font-family:sans-serif;font-weight:bold;font-size:16px;letter-spacing:1px;box-shadow:0 8px 32px rgba(0,229,255,0.25);z-index:9999;pointer-events:none;display:flex;align-items:center;gap:10px;';
    toast.innerHTML = `<span>🚆</span><span>JUMP + ← / →  SWITCH TRAIN</span>`;

    this.toastContainerEl.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 400);
    }, 2500);
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

  public showVisualHazardCue(message: string, severity: 'warning' | 'danger' = 'warning'): void {
    let cueEl = document.getElementById('hud-hazard-cue');
    if (!cueEl) {
      cueEl = document.createElement('div');
      cueEl.id = 'hud-hazard-cue';
      cueEl.className = 'hud-hazard-cue';
      this.container.appendChild(cueEl);
    }
    cueEl.textContent = message;
    cueEl.className = `hud-hazard-cue active hazard-${severity}`;

    setTimeout(() => {
      cueEl?.classList.remove('active');
    }, 2400);
  }

  public getScore(): number {
    return this.score;
  }

  public getCoins(): number {
    return this.coins;
  }
}

