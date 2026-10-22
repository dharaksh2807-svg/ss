import { EventBus, EVENTS } from '../core/EventBus';
import { ProgressionManager } from '../progression/ProgressionManager';
import { UpgradeManager } from '../player/UpgradeManager';
import { ACHIEVEMENTS } from '../progression/MissionCatalog';
import { AchievementTier } from '../progression/ProgressionTypes';

export type MissionsTab = 'MISSIONS' | 'DAILY' | 'ACHIEVEMENTS' | 'SEASON';

export class MissionsModal {
  private element: HTMLElement;
  private tabsContainer: HTMLElement;
  private contentContainer: HTMLElement;
  private walletEl: HTMLElement;
  private closeBtn: HTMLButtonElement;
  private progression: ProgressionManager;
  private currentTab: MissionsTab = 'MISSIONS';
  private timerInterval: any = null;
  private previousScreen: string | null = null;

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
          <div class="missions-header">
            <h2 class="modal-title">OBJECTIVES & PROGRESSION</h2>
            <div class="shop-wallet-badge">
              <span>🪙 COINS:</span>
              <span id="missions-wallet-coins">0</span>
            </div>
          </div>

          <!-- Navigation Tabs -->
          <div class="missions-nav-tabs" id="missions-tabs">
            <button class="missions-tab-btn active" data-tab="MISSIONS">🎯 MISSIONS</button>
            <button class="missions-tab-btn" data-tab="DAILY">📅 DAILY</button>
            <button class="missions-tab-btn" data-tab="ACHIEVEMENTS">🏆 ACHIEVEMENTS</button>
            <button class="missions-tab-btn" data-tab="SEASON">✨ SEASON PASS</button>
          </div>

          <!-- Main Tab Content Container -->
          <div class="missions-tab-content custom-scroll" id="missions-content"></div>

          <div class="modal-buttons" style="margin-top: 16px;">
            <button id="missions-close-btn" class="btn btn-primary">DONE</button>
          </div>
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

    // Tab buttons click
    this.tabsContainer.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.missions-tab-btn') as HTMLButtonElement;
      if (target && target.dataset.tab) {
        this.switchTab(target.dataset.tab as MissionsTab);
      }
    });

    const bus = EventBus.getInstance();
    bus.on('OPEN_MISSIONS', (fromScreen?: string) => {
      this.previousScreen = fromScreen || null;
      this.show();
    });

    bus.on('WALLET_UPDATED', () => {
      this.updateWallet();
    });
  }

  public switchTab(tab: MissionsTab): void {
    this.currentTab = tab;
    const btns = this.tabsContainer.querySelectorAll('.missions-tab-btn');
    btns.forEach((btn) => {
      if ((btn as HTMLElement).dataset.tab === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.render();
  }

  public show(): void {
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
    this.element.classList.add('hidden');
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (restorePrevious) {
      if (this.previousScreen === 'START') {
        document.getElementById('start-screen')?.classList.remove('hidden');
      } else if (this.previousScreen === 'GAMEOVER') {
        document.getElementById('game-over-modal')?.classList.remove('hidden');
      }
    }
    this.previousScreen = null;
  }

  private updateWallet(): void {
    if (this.walletEl) {
      this.walletEl.textContent = UpgradeManager.getInstance().getCoins().toLocaleString();
    }
  }

  public render(): void {
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
      const pct = Math.min(100, Math.floor((mission.progress / mission.target) * 100));
      const isCompleted = mission.completed;
      const isClaimed = mission.claimed;

      let statusBadge = '<span class="status-pill status-active">IN PROGRESS</span>';
      let actionBtn = `<button class="btn-claim disabled" disabled>${mission.rewardCoins} 🪙</button>`;

      if (isClaimed) {
        statusBadge = '<span class="status-pill status-claimed">CLAIMED ✓</span>';
        actionBtn = '<button class="btn-claim claimed" disabled>CLAIMED</button>';
      } else if (isCompleted) {
        statusBadge = '<span class="status-pill status-complete pulse-anim">COMPLETED!</span>';
        actionBtn = `<button class="btn-claim claimable pulse-anim" data-action="claim-mission" data-id="${mission.id}">CLAIM ${mission.rewardCoins} 🪙</button>`;
      }

      html += `
        <div class="progression-card ${isCompleted ? 'card-complete' : ''} ${isClaimed ? 'card-claimed' : ''}">
          <div class="card-header">
            <div class="card-icon">🎯</div>
            <div class="card-title-group">
              <h3 class="card-title">${mission.title}</h3>
              <p class="card-desc">${mission.description}</p>
            </div>
            ${statusBadge}
          </div>

          <div class="card-progress-area">
            <div class="progress-labels">
              <span>Progress: ${Math.floor(mission.progress).toLocaleString()} / ${mission.target.toLocaleString()}</span>
              <span>${pct}%</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${pct}%"></div>
            </div>
          </div>

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
      const pct = Math.min(100, Math.floor((challenge.progress / challenge.target) * 100));
      const isCompleted = challenge.completed;
      const isClaimed = challenge.claimed;

      let statusBadge = '<span class="status-pill status-active">ACTIVE</span>';
      let actionBtn = `<button class="btn-claim disabled" disabled>${challenge.rewardCoins} 🪙</button>`;

      if (isClaimed) {
        statusBadge = '<span class="status-pill status-claimed">CLAIMED ✓</span>';
        actionBtn = '<button class="btn-claim claimed" disabled>CLAIMED</button>';
      } else if (isCompleted) {
        statusBadge = '<span class="status-pill status-complete pulse-anim">READY!</span>';
        actionBtn = `<button class="btn-claim claimable pulse-anim" data-action="claim-daily" data-id="${challenge.id}">CLAIM ${challenge.rewardCoins} 🪙</button>`;
      }

      html += `
        <div class="progression-card ${isCompleted ? 'card-complete' : ''} ${isClaimed ? 'card-claimed' : ''}">
          <div class="card-header">
            <div class="card-icon">${challenge.badgeIcon}</div>
            <div class="card-title-group">
              <h3 class="card-title">${challenge.title}</h3>
              <p class="card-desc">${challenge.description}</p>
            </div>
            ${statusBadge}
          </div>

          <div class="card-progress-area">
            <div class="progress-labels">
              <span>Progress: ${Math.floor(challenge.progress).toLocaleString()} / ${challenge.target.toLocaleString()}</span>
              <span>${pct}%</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width: ${pct}%"></div>
            </div>
          </div>

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

    let html = `
      <div class="missions-tab-header">
        <h3 class="set-title">HALL OF RECORDS</h3>
        <p class="tab-subtitle">Permanent milestones tracking your all-time career achievements.</p>
      </div>
      <div class="mission-cards-list">
    `;

    for (const def of ACHIEVEMENTS) {
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
      const pct = allGoldClaimed ? 100 : Math.min(100, Math.floor((progressVal / tierConfig.target) * 100));

      const isTierComplete = achState.completedTiers.includes(currentTier);
      const isTierClaimed = achState.claimedTiers.includes(currentTier);

      let actionBtn = `<button class="btn-claim disabled" disabled>${tierConfig.rewardCoins} 🪙</button>`;
      if (allGoldClaimed) {
        actionBtn = '<button class="btn-claim claimed" disabled>MAX TIER ✓</button>';
      } else if (isTierComplete && !isTierClaimed) {
        actionBtn = `<button class="btn-claim claimable pulse-anim" data-action="claim-achievement" data-id="${def.id}" data-tier="${currentTier}">CLAIM ${tierConfig.rewardCoins} 🪙</button>`;
      }

      html += `
        <div class="progression-card ${allGoldClaimed ? 'card-claimed' : isTierComplete ? 'card-complete' : ''}">
          <div class="card-header">
            <div class="card-icon">${def.badgeIcon}</div>
            <div class="card-title-group">
              <div class="achievement-title-row">
                <h3 class="card-title">${def.title}</h3>
                <span class="tier-pill tier-${currentTier.toLowerCase()}">${currentTier}</span>
              </div>
              <p class="card-desc">${def.description}</p>
            </div>
          </div>

          <div class="card-progress-area">
            <div class="progress-labels">
              <span>Progress: ${Math.floor(progressVal).toLocaleString()} / ${tierConfig.target.toLocaleString()}</span>
              <span>${pct}%</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill fill-${currentTier.toLowerCase()}" style="width: ${pct}%"></div>
            </div>
          </div>

          <div class="tier-badges-row">
            ${def.tiers.map(t => {
              const completed = achState.completedTiers.includes(t.tier);
              const claimed = achState.claimedTiers.includes(t.tier);
              const active = t.tier === currentTier;
              let cls = 'tier-indicator';
              if (claimed) cls += ' claimed';
              else if (completed) cls += ' unlocked';
              else if (active) cls += ' in-progress';
              return `<span class="${cls}">${t.tier}: ${t.target.toLocaleString()}</span>`;
            }).join('')}
          </div>

          <div class="card-footer">
            <span class="reward-tag">TIER REWARD: +${tierConfig.rewardCoins.toLocaleString()} COINS</span>
            ${actionBtn}
          </div>
        </div>
      `;
    }

    html += `</div>`;
    this.contentContainer.innerHTML = html;
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
        actionBtn = `<button class="btn-claim claimable pulse-anim" data-action="claim-season" data-index="${m.milestoneIndex}">CLAIM REWARD</button>`;
      }

      html += `
        <div class="season-milestone-card ${statusCls}">
          <div class="milestone-cost">
            <span class="token-cost-icon">💎</span>
            <span>${m.tokensRequired}</span>
          </div>

          <div class="milestone-reward-icon">${m.rewardIcon}</div>

          <div class="milestone-details">
            <span class="milestone-tag">STAGE ${m.milestoneIndex + 1}</span>
            <h4 class="milestone-name">${m.rewardLabel}</h4>
          </div>

          <div class="milestone-action">
            ${actionBtn}
          </div>
        </div>
      `;
    }

    html += `</div>`;
    this.contentContainer.innerHTML = html;
    this.attachClaimListeners();
  }

  // --- Attach Event Listeners to Claim Buttons ---
  private attachClaimListeners(): void {
    const claimBtns = this.contentContainer.querySelectorAll('[data-action]');
    claimBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const el = e.currentTarget as HTMLElement;
        const action = el.dataset.action;

        if (action === 'claim-mission') {
          const id = el.dataset.id!;
          const res = this.progression.claimMissionReward(id);
          if (res.success) {
            EventBus.getInstance().emit('WALLET_UPDATED');
            this.render();
          }
        } else if (action === 'claim-daily') {
          const id = el.dataset.id!;
          const res = this.progression.claimDailyReward(id);
          if (res.success) {
            EventBus.getInstance().emit('WALLET_UPDATED');
            this.render();
          }
        } else if (action === 'claim-achievement') {
          const id = el.dataset.id!;
          const tier = el.dataset.tier as AchievementTier;
          const res = this.progression.claimAchievementReward(id, tier);
          if (res.success) {
            EventBus.getInstance().emit('WALLET_UPDATED');
            this.render();
          }
        } else if (action === 'claim-season') {
          const index = parseInt(el.dataset.index!, 10);
          const res = this.progression.claimSeasonMilestone(index);
          if (res.success) {
            EventBus.getInstance().emit('WALLET_UPDATED');
            this.render();
          }
        }
      });
    });
  }
}
