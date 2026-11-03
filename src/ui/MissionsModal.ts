import { EventBus, EVENTS } from '../core/EventBus';
import { ProgressionManager } from '../progression/ProgressionManager';
import { UpgradeManager } from '../player/UpgradeManager';
import { ACHIEVEMENTS } from '../progression/MissionCatalog';
import { AchievementDefinition, AchievementTier } from '../progression/ProgressionTypes';

export type MissionsTab = 'MISSIONS' | 'DAILY' | 'ACHIEVEMENTS' | 'SEASON';

export class MissionsModal {
  private element: HTMLElement;
  private tabsContainer: HTMLElement;
  private contentContainer: HTMLElement;
  private walletEl: HTMLElement;
  private closeBtn: HTMLButtonElement;
  private progression: ProgressionManager;
  private currentTab: MissionsTab = 'MISSIONS';
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private achievementCategory: AchievementDefinition['category'] | 'ALL' = 'ALL';

  constructor() {
    this.progression = ProgressionManager.getInstance();

    // Check if element exists in DOM or create container dynamically
    let el = document.getElementById('missions-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'missions-modal';
      el.className = 'screen-overlay hidden';
      el.innerHTML = `
        <div class="modal-card glassmorphic missions-modal-card">
          <header class="missions-header">
            <div class="missions-heading"><span class="missions-eyebrow">METRO RUNNER · YOUR PROGRESS</span>
              <h2 class="modal-title">OBJECTIVES & PROGRESSION</h2></div>
            <div class="missions-header-actions"><div class="missions-wallet"><span>🪙</span><span id="missions-wallet-coins">0</span></div>
              <button id="missions-home-btn" class="missions-control">HOME</button>
              <button id="missions-close-btn" class="missions-control missions-close" aria-label="Close objectives and return to previous screen">✕</button></div>
          </header>

          <!-- Navigation Tabs -->
          <nav class="missions-nav-tabs" id="missions-tabs" aria-label="Progression sections">
            <button class="missions-tab-btn active" data-tab="MISSIONS">🎯 MISSIONS</button>
            <button class="missions-tab-btn" data-tab="DAILY">📅 DAILY</button>
            <button class="missions-tab-btn" data-tab="ACHIEVEMENTS">🏆 ACHIEVEMENTS</button>
            <button class="missions-tab-btn" data-tab="SEASON">✨ SEASON PASS</button>
          </nav>

          <!-- Main Tab Content Container -->
          <div class="missions-tab-content custom-scroll" id="missions-content"></div>

          <p id="missions-feedback" class="missions-feedback hidden" role="status" aria-live="polite"></p>
        </div>
      `;
      document.getElementById('ui-overlay')?.appendChild(el);
    }

    this.element = el;
    this.tabsContainer = document.getElementById('missions-tabs')!;
    this.contentContainer = document.getElementById('missions-content')!;
    this.walletEl = document.getElementById('missions-wallet-coins')!;
    this.closeBtn = document.getElementById('missions-close-btn') as HTMLButtonElement;

    this.setupEvents();
  }

  private setupEvents(): void {
    this.closeBtn.addEventListener('click', () => {
      this.hide();
    });

    document.getElementById('missions-home-btn')?.addEventListener('click', () => EventBus.getInstance().emit('GO_TO_MENU'));

    // Tab buttons click
    this.tabsContainer.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.missions-tab-btn') as HTMLButtonElement;
      if (target && target.dataset.tab) {
        this.switchTab(target.dataset.tab as MissionsTab);
      }
    });

    const bus = EventBus.getInstance();

    bus.on('WALLET_UPDATED', () => {
      this.updateWallet();
    });
    for (const event of [EVENTS.MISSION_COMPLETED, EVENTS.DAILY_COMPLETED, EVENTS.ACHIEVEMENT_UNLOCKED, EVENTS.REWARD_CLAIMED]) {
      bus.on(event, () => { if (!this.element.classList.contains('hidden')) this.render(); });
    }
  }

  public switchTab(tab: MissionsTab): void {
    this.currentTab = tab;
    const btns = this.tabsContainer.querySelectorAll('.missions-tab-btn');
    btns.forEach((btn) => {
      if ((btn as HTMLElement).dataset.tab === tab) {
        btn.classList.add('active');
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.classList.remove('active');
        btn.removeAttribute('aria-current');
      }
    });

    this.render();
    this.contentContainer.scrollTop = 0;
    document.getElementById('missions-feedback')?.classList.add('hidden');
  }

  public show(): void {
    document.getElementById('missions-feedback')?.classList.add('hidden');
    this.updateWallet();
    this.render();
    this.element.classList.remove('hidden');

    // Start 1-second interval for real-time countdown
    if (!this.timerInterval) {
      this.timerInterval = setInterval(() => {
        if (this.currentTab === 'DAILY') {
          const timerEl = document.getElementById('daily-countdown-val');
          if (timerEl) {
            timerEl.textContent = this.progression.getTimeUntilDailyReset().formatted;
          }
        }
      }, 1000);
    }
  }

  public hide(restorePrevious: boolean = true): void {
    if (restorePrevious) {
      EventBus.getInstance().emit(EVENTS.UI_BACK, 'MISSIONS');
      return;
    }
    this.element.classList.add('hidden');
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private updateWallet(): void {
    if (this.walletEl) {
      this.walletEl.textContent = UpgradeManager.getInstance().getCoins().toLocaleString();
    }
  }

  public render(): void {
    const scrollTop = this.contentContainer.scrollTop;
    const focused = document.activeElement as HTMLElement | null;
    const focusKey = focused && this.contentContainer.contains(focused) ? { ...focused.dataset } : null;
    this.updateWallet();

    switch (this.currentTab) {
      case 'MISSIONS':
        this.renderMissionsTab();
        break;
      case 'DAILY':
        this.renderDailyTab();
        break;
      case 'ACHIEVEMENTS':
        this.renderAchievementsTab();
        break;
      case 'SEASON':
        this.renderSeasonTab();
        break;
    }
    if (focusKey && Object.keys(focusKey).length) {
      const next = [...this.contentContainer.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')].find(button => Object.entries(focusKey).every(([key, value]) => button.dataset[key] === value));
      (next || this.tabsContainer.querySelector<HTMLElement>('.active'))?.focus({ preventScroll: true });
    }
    this.contentContainer.scrollTop = scrollTop;
  }

  // --- 1. Missions Tab ---
  private renderMissionsTab(): void {
    const state = this.progression.getState();
    const setNum = state.currentMissionSet;
    const missions = state.activeMissions;

    let html = `
      <div class="missions-tab-header">
        <div class="mission-set-badge">
          <span class="badge-icon">🎖️</span>
          <span class="set-title">MISSION SET ${setNum}</span>
        </div>
        <p class="tab-subtitle">Complete all three missions to unlock higher tier sets and rewards!</p>
      </div>
      <div class="mission-cards-list">
    `;

    for (const mission of missions) {
      const isCompleted = mission.completed;
      const isClaimed = mission.claimed;

      let statusBadge = '<span class="status-pill status-active">IN PROGRESS</span>';
      let actionBtn = `<button class="btn-claim disabled" disabled>${mission.rewardCoins} 🪙</button>`;

      if (isClaimed) {
        statusBadge = '<span class="status-pill status-claimed">CLAIMED ✓</span>';
        actionBtn = '<button class="btn-claim claimed" disabled>CLAIMED</button>';
      } else if (isCompleted) {
        statusBadge = '<span class="status-pill status-complete">COMPLETED!</span>';
        actionBtn = `<button class="btn-claim claimable" data-action="claim-mission" data-id="${mission.id}">CLAIM ${mission.rewardCoins} 🪙</button>`;
      }

      html += `
        <div data-objective-id="${mission.id}" class="progression-card ${isCompleted ? 'card-complete' : ''} ${isClaimed ? 'card-claimed' : ''}">
          <div class="card-header">
            <div class="card-icon">🎯</div>
            <div class="card-title-group">
              <h3 class="card-title">${mission.title}</h3>
              <p class="card-desc">${mission.description}</p>
            </div>
            ${statusBadge}
          </div>

          ${this.progressMarkup(mission.progress, mission.target, mission.title)}

          <div class="card-footer">
            <span class="reward-tag">REWARD: +${mission.rewardCoins} COINS</span>
            ${actionBtn}
          </div>
        </div>
      `;
    }

    html += `</div>`;
    this.contentContainer.innerHTML = html;
    this.attachClaimListeners();
  }

  // --- 2. Daily Challenges Tab ---
  private renderDailyTab(): void {
    const state = this.progression.getState();
    const countdown = this.progression.getTimeUntilDailyReset();
    const dateStr = state.dailyDate;

    let html = `
      <div class="missions-tab-header">
        <div class="daily-meta-row">
          <div class="daily-date-badge">📅 TODAY: ${dateStr}</div>
          <div class="daily-timer-badge">
            <span>⏳ RESET IN:</span>
            <span id="daily-countdown-val" class="countdown-text">${countdown.formatted}</span>
          </div>
        </div>
        <p class="tab-subtitle">Daily targets refresh automatically every night at local midnight.</p>
      </div>
      <div class="mission-cards-list">
    `;

    for (const challenge of state.dailyChallenges) {
      const isCompleted = challenge.completed;
      const isClaimed = challenge.claimed;

      let statusBadge = '<span class="status-pill status-active">ACTIVE</span>';
      let actionBtn = `<button class="btn-claim disabled" disabled>${challenge.rewardCoins} 🪙</button>`;

      if (isClaimed) {
        statusBadge = '<span class="status-pill status-claimed">CLAIMED ✓</span>';
        actionBtn = '<button class="btn-claim claimed" disabled>CLAIMED</button>';
      } else if (isCompleted) {
        statusBadge = '<span class="status-pill status-complete">READY!</span>';
        actionBtn = `<button class="btn-claim claimable" data-action="claim-daily" data-id="${challenge.id}">CLAIM ${challenge.rewardCoins} 🪙</button>`;
      }

      html += `
        <div data-objective-id="${challenge.id}" class="progression-card ${isCompleted ? 'card-complete' : ''} ${isClaimed ? 'card-claimed' : ''}">
          <div class="card-header">
            <div class="card-icon">${challenge.badgeIcon}</div>
            <div class="card-title-group">
              <h3 class="card-title">${challenge.title}</h3>
              <p class="card-desc">${challenge.description}</p>
            </div>
            ${statusBadge}
          </div>

          ${this.progressMarkup(challenge.progress, challenge.target, challenge.title)}

          <div class="card-footer">
            <span class="reward-tag">DAILY BONUS: +${challenge.rewardCoins} COINS</span>
            ${actionBtn}
          </div>
        </div>
      `;
    }

    html += `</div>`;
    this.contentContainer.innerHTML = html;
    this.attachClaimListeners();
  }

  // --- 3. Achievements Tab ---
  private renderAchievementsTab(): void {
    const state = this.progression.getState();
    const achievements = ACHIEVEMENTS.filter(def => this.achievementCategory === 'ALL' || def.category === this.achievementCategory);

    let html = `
      <div class="missions-tab-header">
        <h3 class="set-title">HALL OF RECORDS</h3>
        <p class="tab-subtitle">Permanent milestones tracking your all-time career achievements.</p>
      </div>
      <div class="achievement-toolbar"><label for="achievement-category">CATEGORY</label>
        <select id="achievement-category">${['ALL', ...new Set(ACHIEVEMENTS.map(def => def.category))].map(category => `<option value="${category}" ${this.achievementCategory === category ? 'selected' : ''}>${category === 'ALL' ? 'All achievements' : this.categoryLabel(category)}</option>`).join('')}</select>
        <span>Showing ${achievements.length} of ${ACHIEVEMENTS.length} achievements · Bronze, Silver and Gold tiers</span></div>
      <div class="mission-cards-list">
    `;

    for (const def of achievements) {
      const achState = state.achievements[def.id] || {
        currentProgress: 0,
        completedTiers: [],
        claimedTiers: []
      };

      // Determine active tier to display
      let currentTier: AchievementTier = 'BRONZE';
      if (achState.claimedTiers.includes('BRONZE')) currentTier = 'SILVER';
      if (achState.claimedTiers.includes('SILVER')) currentTier = 'GOLD';

      const tierConfig = def.tiers.find(t => t.tier === currentTier) || def.tiers[def.tiers.length - 1];
      const allGoldClaimed = achState.claimedTiers.includes('GOLD');

      const progressVal = achState.currentProgress;

      const isTierComplete = achState.completedTiers.includes(currentTier);
      const isTierClaimed = achState.claimedTiers.includes(currentTier);

      let actionBtn = `<button class="btn-claim disabled" disabled>${tierConfig.rewardCoins} 🪙</button>`;
      if (allGoldClaimed) {
        actionBtn = '<button class="btn-claim claimed" disabled>MAX TIER ✓</button>';
      } else if (isTierComplete && !isTierClaimed) {
        actionBtn = `<button class="btn-claim claimable" data-action="claim-achievement" data-id="${def.id}" data-tier="${currentTier}">CLAIM ${tierConfig.rewardCoins} 🪙</button>`;
      }

      html += `
        <div data-achievement-id="${def.id}" class="progression-card ${allGoldClaimed ? 'card-claimed' : isTierComplete ? 'card-complete' : ''}">
          <div class="card-header">
            <div class="card-icon">${def.badgeIcon}</div>
            <div class="card-title-group">
              <span class="achievement-category">${this.categoryLabel(def.category)}</span>
              <div class="achievement-title-row">
                <h3 class="card-title">${def.title}</h3>
                <span class="tier-pill tier-${currentTier.toLowerCase()}">${currentTier}</span>
              </div>
              <p class="card-desc">${def.description}</p>
            </div>
            <span class="status-pill ${allGoldClaimed ? 'status-claimed' : isTierComplete ? 'status-complete' : 'status-active'}">${allGoldClaimed ? 'ALL TIERS CLAIMED' : isTierComplete ? 'READY TO CLAIM' : 'IN PROGRESS'}</span>
          </div>

          ${this.progressMarkup(progressVal, tierConfig.target, def.title, `fill-${currentTier.toLowerCase()}`)}

          <div class="tier-badges-row">
            ${def.tiers.map(t => {
              const completed = achState.completedTiers.includes(t.tier);
              const claimed = achState.claimedTiers.includes(t.tier);
              const active = t.tier === currentTier;
              let cls = 'tier-indicator';
              if (claimed) cls += ' claimed';
              else if (completed) cls += ' unlocked';
              else if (active) cls += ' in-progress';
              return `<span class="${cls}"><strong>${t.tier} · ${claimed ? 'CLAIMED' : completed ? 'READY' : 'TARGET'}</strong><span>${t.target.toLocaleString()} · ${this.rewardLabel(t.rewardCoins, t.rewardKeys)}</span></span>`;
            }).join('')}
          </div>

          <div class="card-footer">
            <span class="reward-tag">TIER REWARD: +${this.rewardLabel(tierConfig.rewardCoins, tierConfig.rewardKeys)}</span>
            ${actionBtn}
          </div>
        </div>
      `;
    }

    html += `</div>`;
    this.contentContainer.innerHTML = html;
    this.contentContainer.querySelector<HTMLSelectElement>('#achievement-category')?.addEventListener('change', event => {
      this.achievementCategory = (event.target as HTMLSelectElement).value as typeof this.achievementCategory;
      this.render();
      this.contentContainer.scrollTop = 0;
      this.contentContainer.querySelector<HTMLElement>('#achievement-category')?.focus({ preventScroll: true });
    });
    this.attachClaimListeners();
  }

  // --- 4. Season Pass Tab ---
  private renderSeasonTab(): void {
    const state = this.progression.getState();
    const pass = state.seasonPass;
    const tokens = pass.tokensCollected;

    let html = `
      <div class="missions-tab-header">
        <div class="season-banner-card">
          <div class="season-banner-info">
            <span class="season-eyebrow">LIMITED TIME EVENT</span>
            <h2 class="season-title">${pass.seasonName}</h2>
            <p class="season-theme">Theme: ${pass.theme}</p>
            <div class="season-dates">🗓️ Active: ${pass.startDate} through ${pass.endDate}</div>
          </div>
          <div class="season-token-tally">
            <span class="token-icon">💎</span>
            <div class="token-tally-text">
              <span class="token-count">${tokens}</span>
              <span class="token-label">EVENT TOKENS</span>
            </div>
          </div>
        </div>
        <p class="tab-subtitle">Collect glowing Diamond Tokens on the subway tracks to unlock exclusive seasonal loot!</p>
      </div>

      <div class="season-milestones-track">
    `;

    for (const m of pass.milestones) {
      const isClaimed = pass.claimedMilestones.includes(m.milestoneIndex);
      const isUnlocked = tokens >= m.tokensRequired;

      let statusCls = 'locked';
      let actionBtn = `<button class="btn-claim disabled" disabled>${m.tokensRequired} 💎</button>`;

      if (isClaimed) {
        statusCls = 'claimed';
        actionBtn = '<button class="btn-claim claimed" disabled>CLAIMED ✓</button>';
      } else if (isUnlocked) {
        statusCls = 'unlocked';
        actionBtn = `<button class="btn-claim claimable" data-action="claim-season" data-index="${m.milestoneIndex}">CLAIM REWARD</button>`;
      }

      html += `
        <div data-milestone="${m.milestoneIndex}" class="season-milestone-card ${statusCls}">
          <div class="milestone-cost">
            <span class="token-cost-icon">💎</span>
            <span>${m.tokensRequired}</span>
          </div>

          <div class="milestone-reward-icon">${m.rewardIcon}</div>

          <div class="milestone-details">
            <span class="milestone-tag">STAGE ${m.milestoneIndex + 1}</span>
            <h4 class="milestone-name">${m.rewardLabel}</h4>
          </div>

          <div class="milestone-progress">${this.progressMarkup(tokens, m.tokensRequired, `Season stage ${m.milestoneIndex + 1}`)}</div>
          <div class="milestone-action"><span class="status-pill ${isClaimed ? 'status-claimed' : isUnlocked ? 'status-complete' : 'status-active'}">${isClaimed ? 'CLAIMED' : isUnlocked ? 'READY TO CLAIM' : 'LOCKED'}</span>${actionBtn}</div>
        </div>
      `;
    }

    html += `</div>`;
    this.contentContainer.innerHTML = html;
    this.attachClaimListeners();
  }

  private categoryLabel(category: string): string {
    const labels: Record<string, string> = { DISTANCE: 'Distance', COINS: 'Coins', RUNS: 'Runs', JUMPS: 'Jumps', SLIDES: 'Slides', EVASIONS: 'Evasions', HOVERBOARD: 'Hoverboards', HIGHSCORE: 'High scores' };
    return labels[category] || category;
  }

  private rewardLabel(coins: number, keys = 0): string {
    return `${coins.toLocaleString()} COINS${keys > 0 ? ` + ${keys} ${keys === 1 ? 'KEY' : 'KEYS'}` : ''}`;
  }

  private progressMarkup(value: number, target: number, label: string, color = ''): string {
    const pct = Math.min(100, Math.max(0, Math.floor(value / target * 100)));
    return `<div class="card-progress-area"><div class="progress-labels"><span>Progress: ${Math.floor(value).toLocaleString()} / ${target.toLocaleString()}</span><span>${pct}%</span></div>
      <div class="progress-bar-track" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${Math.min(target, Math.max(0, value))}">
        <div class="progress-bar-fill ${color}" style="width: ${pct}%"></div></div></div>`;
  }

  private attachClaimListeners(): void {
    this.contentContainer.querySelectorAll<HTMLButtonElement>('.btn-claim[data-action]').forEach(button => {
      button.addEventListener('click', () => {
        if (button.disabled) return;
        button.disabled = true;
        const { action, id, tier, index } = button.dataset;
        let success = false;
        let message = 'Reward is not ready or has already been claimed.';
        if (action === 'claim-mission') success = this.progression.claimMissionReward(id!).success;
        else if (action === 'claim-daily') success = this.progression.claimDailyReward(id!).success;
        else if (action === 'claim-achievement') success = this.progression.claimAchievementReward(id!, tier as AchievementTier).success;
        else if (action === 'claim-season') {
          const result = this.progression.claimSeasonMilestone(Number(index));
          success = result.success;
          message = result.message;
        }
        this.render();
        const feedback = document.getElementById('missions-feedback');
        if (feedback) { feedback.textContent = success ? 'Reward claimed. Your progress is saved.' : message; feedback.classList.remove('hidden'); }
        if (success) {
          EventBus.getInstance().emit(EVENTS.REWARD_CLAIMED);
          EventBus.getInstance().emit('WALLET_UPDATED');
        }
      });
    });
  }
}
