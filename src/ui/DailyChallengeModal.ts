import { EventBus, EVENTS } from '../core/EventBus';
import { DailyChallengeManager, DailyCourseChallenge } from '../core/DailyChallengeManager';

export class DailyChallengeModal {
  private element: HTMLElement;
  private manager = DailyChallengeManager.getInstance();
  private eventBus = EventBus.getInstance();
  private previousScreen: string | null = null;
  private previewedImport: DailyCourseChallenge | null = null;

  constructor() {
    let el = document.getElementById('daily-challenge-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'daily-challenge-modal';
      el.className = 'screen-overlay hidden';
      document.getElementById('ui-overlay')?.appendChild(el);
    }
    this.element = el;
    this.renderSkeleton();
    this.bindEvents();

    this.eventBus.on(EVENTS.OPEN_DAILY_CHALLENGE, (fromScreen?: string) => {
      this.previousScreen = fromScreen || 'START';
      this.show();
    });
  }

  private renderSkeleton(): void {
    this.element.innerHTML = `
      <div class="modal-card arcade-modal-card daily-challenge-card animate-pop">
        <!-- Modal Top Bar -->
        <div class="modal-top-bar">
          <button id="dc-close-btn" class="arcade-back-btn" aria-label="Back">
            ◀ BACK
          </button>
          <div class="modal-title-group" style="text-align: center;">
            <h2 class="arcade-title dc-modal-title">DAILY SEEDED CHALLENGE</h2>
            <div id="dc-utc-date-badge" class="tab-subtitle dc-date-badge">UTC CALENDAR SYNCHRONIZED</div>
          </div>
          <div style="width: 60px;"></div> <!-- Spacer for balance -->
        </div>

        <div class="dc-modal-scroll-body custom-scroll">
          <!-- Featured Challenge Showcase Card -->
          <div class="dc-hero-card" id="dc-hero-card">
            <div class="dc-hero-header">
              <div class="dc-badge-group">
                <span id="dc-type-badge" class="dc-type-pill">🏃 DISTANCE</span>
                <span id="dc-diff-badge" class="dc-diff-pill">🔥 HARD</span>
              </div>
              <div id="dc-reward-badge" class="dc-reward-pill">🎁 350 COINS FIRST RUN</div>
            </div>

            <h3 id="dc-challenge-name" class="dc-challenge-title">Neon Horizon Sprint</h3>
            <p id="dc-challenge-desc" class="dc-challenge-desc">Travel as far as humanly possible along today's synchronized railway course.</p>
            <div id="dc-challenge-objective" class="dc-challenge-objective">🎯 Objective: Max Distance • Infinite Track</div>
          </div>

          <!-- Personal Best Telemetry Grid -->
          <div class="dc-records-card">
            <div class="dc-section-label">YOUR PERSONAL BEST (TODAY)</div>
            <div class="dc-stats-grid">
              <div class="dc-stat-box">
                <span class="dc-stat-label">BEST SCORE</span>
                <span id="dc-stat-score" class="dc-stat-val highlight-gold">0</span>
              </div>
              <div class="dc-stat-box">
                <span class="dc-stat-label">BEST DISTANCE</span>
                <span id="dc-stat-distance" class="dc-stat-val">0 m</span>
              </div>
              <div class="dc-stat-box">
                <span class="dc-stat-label">ATTEMPTS</span>
                <span id="dc-stat-attempts" class="dc-stat-val">0</span>
              </div>
              <div class="dc-stat-box">
                <span class="dc-stat-label">MAX COMBO</span>
                <span id="dc-stat-combo" class="dc-stat-val highlight-cyan">×0</span>
              </div>
            </div>
          </div>

          <!-- Launch Action Hero Button -->
          <div class="dc-modal-launch-area" style="margin: 16px 0;">
            <button id="dc-play-btn" class="arcade-play-btn pulse-glow" style="width: 100%;">
              <span class="play-btn-content">
                <span class="play-icon">▶</span>
                <span id="dc-play-btn-text" class="play-text">PLAY TODAY'S CHALLENGE</span>
              </span>
            </button>
          </div>

          <!-- Shareable Challenge Code Section -->
          <div class="dc-share-section">
            <div class="dc-section-label">SHARE TODAY'S SEEDED COURSE</div>
            <div class="dc-code-box">
              <code id="dc-share-code-text" class="dc-code-display">MTR1-DST-HRD-00000000-00</code>
              <button id="dc-copy-code-btn" class="btn btn-secondary dc-copy-btn" title="Copy code to clipboard">
                <span id="dc-copy-btn-text">📋 COPY CODE</span>
              </button>
            </div>
            <div id="dc-copy-feedback" class="dc-feedback-text hidden">✓ Code copied to clipboard! Share with friends to race the exact same course.</div>
          </div>

          <!-- Import Custom Challenge Section -->
          <div class="dc-import-section">
            <div class="dc-section-label">IMPORT FRIEND'S CHALLENGE CODE</div>
            <div class="dc-import-input-row">
              <input type="text" id="dc-import-input" class="arcade-input dc-import-input" placeholder="Paste code (e.g. MTR1-PRC-HRD-5A8F9B20-4E)" spellcheck="false" autocomplete="off" />
              <button id="dc-validate-import-btn" class="btn btn-secondary">
                🔍 PREVIEW
              </button>
            </div>

            <!-- Dynamic Preview Box -->
            <div id="dc-import-preview-box" class="dc-preview-box hidden">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private bindEvents(): void {
    const closeBtn = this.element.querySelector('#dc-close-btn');
    closeBtn?.addEventListener('click', () => {
      this.hide();
    });

    const playBtn = this.element.querySelector('#dc-play-btn');
    playBtn?.addEventListener('click', () => {
      this.launchChallenge(this.manager.getTodayChallenge());
    });

    const copyBtn = this.element.querySelector('#dc-copy-code-btn');
    copyBtn?.addEventListener('click', () => {
      this.copyShareCode();
    });

    const validateBtn = this.element.querySelector('#dc-validate-import-btn');
    validateBtn?.addEventListener('click', () => {
      this.handleImportPreview();
    });

    const importInput = this.element.querySelector('#dc-import-input') as HTMLInputElement;
    importInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleImportPreview();
      }
    });
  }

  public show(): void {
    this.previewedImport = null;
    const previewBox = this.element.querySelector('#dc-import-preview-box');
    if (previewBox) {
      previewBox.classList.add('hidden');
      previewBox.innerHTML = '';
    }
    const importInput = this.element.querySelector('#dc-import-input') as HTMLInputElement;
    if (importInput) importInput.value = '';

    const feedback = this.element.querySelector('#dc-copy-feedback');
    if (feedback) feedback.classList.add('hidden');

    this.renderTodayData();
    this.element.classList.remove('hidden');
  }

  public hide(restorePrevious: boolean = true): void {
    this.element.classList.add('hidden');
    if (restorePrevious && this.previousScreen === 'START') {
      document.getElementById('start-screen')?.classList.remove('hidden');
    }
    this.previousScreen = null;
  }

  private renderTodayData(): void {
    const challenge = this.manager.getTodayChallenge();
    const record = this.manager.getRecord(challenge.date);

    // Header date
    const dateBadge = this.element.querySelector('#dc-utc-date-badge');
    if (dateBadge) {
      dateBadge.textContent = `UTC CALENDAR: ${challenge.date} • SEED #${(challenge.seed >>> 0).toString(16).toUpperCase()}`;
    }

    // Hero Card
    const nameEl = this.element.querySelector('#dc-challenge-name');
    if (nameEl) nameEl.textContent = challenge.name;

    const descEl = this.element.querySelector('#dc-challenge-desc');
    if (descEl) descEl.textContent = challenge.description;

    const objEl = this.element.querySelector('#dc-challenge-objective');
    if (objEl) objEl.textContent = `🎯 ${challenge.objectiveText}`;

    const typeBadge = this.element.querySelector('#dc-type-badge');
    if (typeBadge) {
      typeBadge.textContent = `${this.getTypeEmoji(challenge.type)} ${challenge.type}`;
    }

    const diffBadge = this.element.querySelector('#dc-diff-badge');
    if (diffBadge) {
      diffBadge.textContent = `${challenge.difficulty === 'HARD' ? '🔥' : (challenge.difficulty === 'EASY' ? '⚡' : '🏃')} ${challenge.difficulty}`;
      diffBadge.className = `dc-diff-pill diff-${challenge.difficulty.toLowerCase()}`;
    }

    const rewardBadge = this.element.querySelector('#dc-reward-badge');
    if (rewardBadge) {
      if (record.rewardClaimed) {
        rewardBadge.textContent = '✓ 350 COINS CLAIMED';
        rewardBadge.className = 'dc-reward-pill claimed';
      } else {
        rewardBadge.textContent = '🎁 350 COINS FIRST RUN BONUS';
        rewardBadge.className = 'dc-reward-pill available';
      }
    }

    // Telemetry Records
    const scoreEl = this.element.querySelector('#dc-stat-score');
    if (scoreEl) scoreEl.textContent = record.bestScore.toLocaleString();

    const distEl = this.element.querySelector('#dc-stat-distance');
    if (distEl) distEl.textContent = `${record.bestDistance.toLocaleString()} m`;

    const attemptsEl = this.element.querySelector('#dc-stat-attempts');
    if (attemptsEl) attemptsEl.textContent = record.attempts.toString();

    const comboEl = this.element.querySelector('#dc-stat-combo');
    if (comboEl) comboEl.textContent = `×${record.bestCombo}`;

    // Share Code
    const codeEl = this.element.querySelector('#dc-share-code-text');
    if (codeEl) codeEl.textContent = challenge.shareCode;

    // Play Button text
    const playBtnText = this.element.querySelector('#dc-play-btn-text');
    if (playBtnText) {
      playBtnText.textContent = record.attempts > 0 ? 'RETRY TODAY\'S CHALLENGE 🔄' : 'PLAY TODAY\'S CHALLENGE ▶';
    }
  }

  private getTypeEmoji(type: string): string {
    switch (type) {
      case 'DISTANCE': return '🏃';
      case 'COIN': return '🪙';
      case 'PRECISION': return '⚡';
      case 'SURVIVAL': return '💀';
      default: return '🏆';
    }
  }

  private copyShareCode(): void {
    const challenge = this.manager.getTodayChallenge();
    const code = challenge.shareCode;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).catch(() => {});
    }

    const btnText = this.element.querySelector('#dc-copy-btn-text');
    if (btnText) btnText.textContent = '✓ COPIED!';

    const feedback = this.element.querySelector('#dc-copy-feedback');
    if (feedback) feedback.classList.remove('hidden');

    setTimeout(() => {
      if (btnText) btnText.textContent = '📋 COPY CODE';
      if (feedback) feedback.classList.add('hidden');
    }, 2500);
  }

  private handleImportPreview(): void {
    const input = this.element.querySelector('#dc-import-input') as HTMLInputElement;
    const previewBox = this.element.querySelector('#dc-import-preview-box') as HTMLElement;
    if (!input || !previewBox) return;

    const raw = input.value.trim();
    if (!raw) {
      previewBox.classList.remove('hidden');
      previewBox.innerHTML = `
        <div class="dc-preview-error">
          <span>⚠️ Please paste or enter a challenge code.</span>
        </div>
      `;
      return;
    }

    const result = this.manager.parseChallengeCode(raw);
    previewBox.classList.remove('hidden');

    if (!result.success || !result.challenge) {
      previewBox.innerHTML = `
        <div class="dc-preview-error">
          <span class="preview-error-title">❌ INVALID CHALLENGE CODE</span>
          <span class="preview-error-detail">${result.error || 'Failed to parse code'}</span>
        </div>
      `;
      this.previewedImport = null;
      return;
    }

    const ch = result.challenge;
    this.previewedImport = ch;

    const record = this.manager.getRecord(ch.id);

    previewBox.innerHTML = `
      <div class="dc-preview-valid">
        <div class="preview-valid-header">
          <span class="preview-tag">VALID COURSE CODE FOUND</span>
          <span class="preview-diff-badge diff-${ch.difficulty.toLowerCase()}">${ch.difficulty}</span>
        </div>
        <div class="preview-challenge-name">${ch.name}</div>
        <div class="preview-challenge-meta">
          <span>Type: <strong>${this.getTypeEmoji(ch.type)} ${ch.type}</strong></span>
          <span>Seed: <strong>#${(ch.seed >>> 0).toString(16).toUpperCase()}</strong></span>
          <span>Best: <strong>${record.bestScore.toLocaleString()} pts</strong></span>
        </div>
        <button id="dc-launch-import-btn" class="btn btn-primary dc-launch-import-btn">
          ▶ LAUNCH IMPORTED COURSE
        </button>
      </div>
    `;

    const launchBtn = previewBox.querySelector('#dc-launch-import-btn');
    launchBtn?.addEventListener('click', () => {
      if (this.previewedImport) {
        this.launchChallenge(this.previewedImport);
      }
    });
  }

  private launchChallenge(challenge: DailyCourseChallenge): void {
    this.manager.setActiveChallenge(challenge);
    this.hide(false);
    this.eventBus.emit(EVENTS.DAILY_CHALLENGE_STARTED, challenge);
    this.eventBus.emit('START_MODE_RUN', 'DAILY_CHALLENGE');
  }
}
