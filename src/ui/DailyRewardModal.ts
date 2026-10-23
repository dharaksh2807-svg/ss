import { EventBus, EVENTS } from '../core/EventBus';
import { DailyRewardManager, DailyRewardDay } from '../progression/DailyRewardManager';
import { UpgradeManager } from '../player/UpgradeManager';

export class DailyRewardModal {
  private element: HTMLElement;
  private dailyManager = DailyRewardManager.getInstance();
  private upgradeManager = UpgradeManager.getInstance();
  private eventBus = EventBus.getInstance();
  private previousScreen: string | null = null;
  private timerInterval: any = null;

  constructor() {
    let el = document.getElementById('daily-reward-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'daily-reward-modal';
      el.className = 'screen-overlay hidden';
      document.getElementById('ui-overlay')?.appendChild(el);
    }
    this.element = el;
    this.setupEvents();
  }

  private setupEvents(): void {
    this.eventBus.on('OPEN_DAILY_REWARDS', (fromScreen?: string) => {
      this.previousScreen = fromScreen || null;
      this.show();
    });
  }

  public show(): void {
    this.render();
    this.element.classList.remove('hidden');
    this.element.focus();
    this.startCountdownTimer();
  }

  public hide(): void {
    if (this.element.classList.contains('hidden')) return;
    this.element.classList.add('hidden');
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    const prev = this.previousScreen;
    this.previousScreen = null;
    if (prev === 'START') {
      this.eventBus.emit('GO_TO_MENU');
    }
  }

  public isVisible(): boolean {
    return !this.element.classList.contains('hidden');
  }

  private startCountdownTimer(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      const timerEl = this.element.querySelector('#daily-reset-timer');
      if (timerEl) {
        timerEl.textContent = this.dailyManager.getTimeUntilReset();
      }
    }, 1000);
  }

  private render(): void {
    const schedule = this.dailyManager.getScheduleStatus();
    const canClaim = this.dailyManager.isClaimAvailable();
    const currentDayNum = this.dailyManager.getCurrentDayNumber();
    const todayReward = schedule.find((s) => s.day.day === currentDayNum)?.day;

    this.element.innerHTML = `
      <div class="modal-card arcade-modal-card daily-reward-card animate-pop">
        <!-- Header -->
        <div class="modal-top-bar">
          <div class="modal-title-group">
            <span class="modal-badge-tag orange-tag">7-DAY SURF STREAK</span>
            <h2 class="arcade-title">DAILY LOGIN REWARDS</h2>
          </div>
          <div class="modal-header-actions">
            <div class="currency-pill gold-pill">
              <span class="pill-icon">🪙</span>
              <span class="pill-value">${this.upgradeManager.getCoins().toLocaleString()}</span>
            </div>
            <button id="daily-close-btn" class="arcade-icon-btn close-btn" aria-label="Close Daily Rewards">✕</button>
          </div>
        </div>

        <div class="daily-reward-scroll-area custom-scroll">
          <p class="daily-subtitle">
            Log in every consecutive day to claim escalating coin stashes, free hoverboard charges, and the Day 7 Epic Jackpot!
          </p>

          <!-- 7-Day Calendar Grid -->
          <div class="daily-calendar-grid">
            ${schedule.map(({ day, status }) => {
              const isToday = day.day === currentDayNum;
              const isClaimed = status === 'CLAIMED';
              const isClaimable = status === 'CLAIMABLE';
              const isLocked = status === 'LOCKED';

              return `
                <div class="daily-day-card ${isToday ? 'today-card' : ''} ${isClaimed ? 'claimed' : ''} ${isClaimable ? 'claimable glow-pulse' : ''} ${day.isJackpot ? 'jackpot-card' : ''}">
                  <div class="day-number">DAY ${day.day}</div>
                  <div class="day-icon">${day.icon}</div>
                  <div class="day-reward-label">
                    ${day.coins > 0 ? `<span>+${day.coins.toLocaleString()} 🪙</span>` : ''}
                    ${day.charges > 0 ? `<span>+${day.charges} 🛹</span>` : ''}
                  </div>
                  <div class="day-status-pill ${isClaimed ? 'pill-claimed' : isClaimable ? 'pill-claimable' : 'pill-locked'}">
                    ${isClaimed ? 'CLAIMED ✓' : isClaimable ? 'READY! 🎁' : 'LOCKED 🔒'}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Active Action Section -->
          <div class="daily-action-box">
            ${canClaim && todayReward ? `
              <div class="claim-ready-panel">
                <div class="claim-icon-pulse">${todayReward.icon}</div>
                <div class="claim-text-block">
                  <div class="claim-header">DAY ${todayReward.day} REWARD READY!</div>
                  <div class="claim-details">${todayReward.description}</div>
                </div>
                <button id="daily-claim-btn" class="arcade-btn btn-primary pulse-btn">
                  🎁 CLAIM NOW
                </button>
              </div>
            ` : `
              <div class="claim-done-panel">
                <div class="claim-check-icon">✓</div>
                <div class="claim-text-block">
                  <div class="claim-header">TODAY'S REWARD CLAIMED!</div>
                  <div class="claim-details">
                    Come back tomorrow for Day ${(currentDayNum % 7) + 1} rewards! Reset in: <strong id="daily-reset-timer">${this.dailyManager.getTimeUntilReset()}</strong>
                  </div>
                </div>
                <button class="arcade-btn btn-disabled" disabled>CLAIMED TODAY ✓</button>
              </div>
            `}
          </div>

          <!-- Toast feedback inside modal -->
          <div id="daily-toast" class="shop-toast hidden"></div>
        </div>

        <div class="modal-footer-row">
          <button id="daily-done-btn" class="arcade-btn btn-secondary">
            BACK TO LOBBY
          </button>
        </div>
      </div>
    `;

    const closeBtn = this.element.querySelector('#daily-close-btn') as HTMLButtonElement;
    if (closeBtn) closeBtn.addEventListener('click', () => this.hide());

    const doneBtn = this.element.querySelector('#daily-done-btn') as HTMLButtonElement;
    if (doneBtn) doneBtn.addEventListener('click', () => this.hide());

    const claimBtn = this.element.querySelector('#daily-claim-btn') as HTMLButtonElement;
    if (claimBtn) {
      claimBtn.addEventListener('click', () => {
        const result = this.dailyManager.claimTodayReward();
        if (result.success && result.reward) {
          this.eventBus.emit(EVENTS.REWARD_CLAIMED);
          const toast = this.element.querySelector('#daily-toast') as HTMLElement;
          if (toast) {
            toast.textContent = `🎉 Claimed ${result.reward.description}! Added to inventory.`;
            toast.className = 'shop-toast toast-success bounce-anim';
            toast.classList.remove('hidden');
          }
          // Re-render calendar after short celebration
          setTimeout(() => {
            this.render();
          }, 1200);
        }
      });
    }
  }
}
