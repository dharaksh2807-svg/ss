import { EventBus, EVENTS } from '../core/EventBus';
import { ProgressionManager } from '../progression/ProgressionManager';
import { getCharacterById } from '../characters/CharacterCatalog';
import { ReviveOfferState } from '../revive/ReviveManager';
import { CrashReplayManager, DeathExplanation } from '../replay/CrashReplayManager';

export class ReviveModal {
  private element: HTMLElement;
  private timerCircle: SVGCircleElement | null = null;
  private timerText: HTMLElement | null = null;
  private reviveBtn: HTMLButtonElement | null = null;
  private endRunBtn: HTMLButtonElement | null = null;
  private costValEl: HTMLElement | null = null;
  private balanceValEl: HTMLElement | null = null;
  private scoreValEl: HTMLElement | null = null;
  private coinsValEl: HTMLElement | null = null;
  private runnerNameEl: HTMLElement | null = null;
  private runnerAvatarEl: HTMLElement | null = null;
  private reviveCounterEl: HTMLElement | null = null;
  private alertTextEl: HTMLElement | null = null;
  private alertIconEl: HTMLElement | null = null;

  private totalDuration: number = 5.0;
  private remainingTime: number = 5.0;
  private timerInterval: any = null;
  private isTimerPaused: boolean = false;
  private isProcessing: boolean = false;

  private onReviveCallback: (() => void) | null = null;
  private onEndRunCallback: (() => void) | null = null;
  private eventBus = EventBus.getInstance();
  private progression = ProgressionManager.getInstance();

  // Circle perimeter for r = 45 (2 * PI * 45 = ~282.74)
  private readonly CIRCLE_PERIMETER = 282.74;

  constructor() {
    let el = document.getElementById('revive-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'revive-modal';
      el.className = 'screen-overlay hidden';
      document.getElementById('ui-overlay')?.appendChild(el);
    }
    this.element = el;
    this.renderSkeleton();
    this.queryElements();
    this.setupListeners();
  }

  private renderSkeleton(): void {
    this.element.innerHTML = `
      <div class="modal-card arcade-modal-card revive-modal-card animate-pop" role="dialog" aria-modal="true" aria-labelledby="revive-main-title">
        <!-- Top Emergency Badge -->
        <div class="revive-alert-banner">
          <span class="revive-alert-icon-pulse" id="revive-alert-icon">💥</span>
          <span class="revive-alert-text" id="revive-alert-text">FATAL CRASH!</span>
          <span class="revive-alert-icon-pulse">💥</span>
        </div>

        <div class="modal-top-bar" style="justify-content: center; margin-bottom: 8px;">
          <div class="modal-title-group" style="text-align: center;">
            <h2 id="revive-main-title" class="arcade-title revive-title">SAVE ME!</h2>
            <div class="tab-subtitle">Spend Keys to continue your run with full score & coins!</div>
          </div>
        </div>

        <!-- Middle Card: Runner & Live Telemetry -->
        <div class="revive-hero-strip">
          <div class="revive-runner-badge">
            <span class="revive-runner-avatar" id="revive-runner-avatar">🏃</span>
            <div class="revive-runner-details">
              <span class="revive-runner-tag">ACTIVE SURFER</span>
              <span class="revive-runner-name" id="revive-runner-name">JAX</span>
            </div>
          </div>

          <div class="revive-run-telemetry">
            <div class="telemetry-pill">
              <span class="tel-label">RUN SCORE</span>
              <span class="tel-val" id="revive-score-val">0</span>
            </div>
            <div class="telemetry-pill">
              <span class="tel-label">COINS</span>
              <span class="tel-val gold" id="revive-coins-val">0</span>
            </div>
          </div>
        </div>

        <!-- Center SVG Countdown Ring -->
        <div class="revive-countdown-container">
          <svg class="revive-timer-svg" viewBox="0 0 100 100">
            <circle class="timer-bg-circle" cx="50" cy="50" r="45" />
            <circle class="timer-bar-circle" id="revive-timer-circle" cx="50" cy="50" r="45" />
          </svg>
          <div class="revive-timer-display" aria-live="polite" aria-atomic="true">
            <span class="timer-number" id="revive-timer-sec">5</span>
            <span class="timer-unit">SEC</span>
          </div>
        </div>

        <!-- Economy Status -->
        <div class="revive-economy-panel">
          <div class="revive-cost-box">
            <span class="econ-label">REQUIRED COST</span>
            <div class="econ-value-row">
              <span class="key-icon">🔑</span>
              <span class="cost-num" id="revive-cost-val">1</span>
              <span class="cost-word">KEY</span>
            </div>
          </div>

          <div class="revive-balance-box">
            <span class="econ-label">YOUR KEYS</span>
            <div class="econ-value-row">
              <span class="key-icon">🔑</span>
              <span class="balance-num" id="revive-balance-val">3</span>
            </div>
          </div>

          <div class="revive-attempt-box">
            <span class="econ-label">SAVE CHANCE</span>
            <span class="attempt-num" id="revive-attempt-val">1 / 3</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="revive-modal-actions">
          <button id="revive-confirm-btn" class="btn btn-primary revive-btn-glow" aria-label="Save Me and Revive">
            <span class="btn-icon">🔑</span>
            <span id="revive-btn-text">SAVE ME!</span>
          </button>
          <button id="revive-end-run-btn" class="btn btn-secondary revive-give-up-btn" aria-label="End Run and Collect Rewards">
            <span>END RUN & COLLECT</span>
          </button>
        </div>

        <!-- Protection Note -->
        <div class="revive-footer-note">
          <span>⚡ Includes 2.0s safe recovery immunity & safe obstacle respawn</span>
        </div>
      </div>
    `;
  }

  private queryElements(): void {
    this.timerCircle = document.getElementById('revive-timer-circle') as unknown as SVGCircleElement;
    this.timerText = document.getElementById('revive-timer-sec');
    this.reviveBtn = document.getElementById('revive-confirm-btn') as HTMLButtonElement;
    this.endRunBtn = document.getElementById('revive-end-run-btn') as HTMLButtonElement;
    this.costValEl = document.getElementById('revive-cost-val');
    this.balanceValEl = document.getElementById('revive-balance-val');
    this.scoreValEl = document.getElementById('revive-score-val');
    this.coinsValEl = document.getElementById('revive-coins-val');
    this.runnerNameEl = document.getElementById('revive-runner-name');
    this.runnerAvatarEl = document.getElementById('revive-runner-avatar');
    this.reviveCounterEl = document.getElementById('revive-attempt-val');
    this.alertTextEl = document.getElementById('revive-alert-text');
    this.alertIconEl = document.getElementById('revive-alert-icon');
  }

  private setupListeners(): void {
    if (this.reviveBtn) {
      this.reviveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleReviveClick();
      });
    }

    if (this.endRunBtn) {
      this.endRunBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleEndRunClick();
      });
    }

    // Keyboard navigation (Space / Enter to Revive, Escape to End Run)
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.element.classList.contains('hidden')) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        this.handleReviveClick();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.handleEndRunClick();
      }
    });

    // Handle tab visibility change so player doesn't unfairly lose countdown time when switched away
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isTimerPaused = true;
      } else {
        this.isTimerPaused = false;
      }
    });
  }

  public show(
    state: ReviveOfferState,
    score: number,
    coins: number,
    onRevive: () => void,
    onEndRun: () => void,
    deathExplanation?: DeathExplanation | null
  ): void {
    this.onReviveCallback = onRevive;
    this.onEndRunCallback = onEndRun;
    this.isProcessing = false;
    this.totalDuration = 5.0;
    this.remainingTime = 5.0;
    this.isTimerPaused = false;

    // 0. Update Fatal Crash Reason Alert Banner
    const explanation = deathExplanation || CrashReplayManager.getInstance().getActiveExplanation();
    if (explanation) {
      if (this.alertIconEl) this.alertIconEl.textContent = explanation.icon;
      if (this.alertTextEl) this.alertTextEl.textContent = `${explanation.headline} — ${explanation.explanation}`;
    } else {
      if (this.alertIconEl) this.alertIconEl.textContent = '💥';
      if (this.alertTextEl) this.alertTextEl.textContent = 'FATAL CRASH!';
    }

    // 1. Update Telemetry
    if (this.scoreValEl) {
      this.scoreValEl.textContent = Math.floor(score).toLocaleString();
    }
    if (this.coinsValEl) {
      this.coinsValEl.textContent = coins.toLocaleString();
    }

    // 2. Character Runner Presentation
    const selCharId = this.progression.getSelectedCharacter();
    const selChar = getCharacterById(selCharId);
    if (this.runnerNameEl && selChar) {
      this.runnerNameEl.textContent = selChar.name.toUpperCase();
    }
    if (this.runnerAvatarEl && selChar) {
      this.runnerAvatarEl.textContent = selChar.portraitIcon;
    }

    // 3. Economy & Cost Display
    if (this.costValEl) {
      this.costValEl.textContent = state.currentCost.toString();
    }
    if (this.balanceValEl) {
      this.balanceValEl.textContent = state.playerKeys.toString();
    }
    if (this.reviveCounterEl) {
      this.reviveCounterEl.textContent = `${state.revivesUsedThisRun + 1} / ${state.maxRevivesPerRun}`;
    }

    // 4. Button Affordability State
    const canAfford = state.canAfford;
    if (this.reviveBtn) {
      const btnText = document.getElementById('revive-btn-text');
      if (canAfford) {
        this.reviveBtn.disabled = false;
        this.reviveBtn.classList.remove('btn-disabled');
        this.reviveBtn.classList.add('revive-btn-glow');
        if (btnText) {
          btnText.textContent = `SAVE ME! (${state.currentCost} 🔑)`;
        }
      } else {
        this.reviveBtn.disabled = true;
        this.reviveBtn.classList.add('btn-disabled');
        this.reviveBtn.classList.remove('revive-btn-glow');
        if (btnText) {
          btnText.textContent = `NEED ${state.currentCost} 🔑 (HAVE ${state.playerKeys})`;
        }
      }
    }

    // 5. Initialize SVG Countdown
    this.updateTimerDisplay();
    this.startCountdown();

    this.element.classList.remove('hidden');
  }

  public hide(): void {
    this.stopCountdown();
    this.element.classList.add('hidden');
    this.isProcessing = false;
  }

  private startCountdown(): void {
    this.stopCountdown();
    const intervalMs = 100;
    this.timerInterval = setInterval(() => {
      if (this.isTimerPaused || this.isProcessing) return;

      this.remainingTime -= intervalMs / 1000;
      if (this.remainingTime <= 0) {
        this.remainingTime = 0;
        this.updateTimerDisplay();
        this.stopCountdown();
        this.handleTimeout();
      } else {
        this.updateTimerDisplay();
      }
    }, intervalMs);
  }

  private stopCountdown(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private updateTimerDisplay(): void {
    if (this.timerText) {
      this.timerText.textContent = Math.ceil(this.remainingTime).toString();
    }

    if (this.timerCircle) {
      const progress = Math.max(0, Math.min(1, this.remainingTime / this.totalDuration));
      const offset = this.CIRCLE_PERIMETER * (1 - progress);
      this.timerCircle.style.strokeDashoffset = offset.toString();
    }
  }

  private handleReviveClick(): void {
    if (this.isProcessing) return;
    if (this.reviveBtn?.disabled) return;

    this.isProcessing = true;
    this.stopCountdown();
    this.hide();

    if (this.onReviveCallback) {
      this.onReviveCallback();
    }
  }

  private handleEndRunClick(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.stopCountdown();
    this.hide();

    if (this.onEndRunCallback) {
      this.onEndRunCallback();
    }
  }

  private handleTimeout(): void {
    // If countdown expires, decline revive and end run without charging keys
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.hide();

    if (this.onEndRunCallback) {
      this.onEndRunCallback();
    }
  }
}
