import { DeathExplanation } from '../replay/CrashReplayManager';

export class ReplayHUD {
  private element: HTMLElement;
  private speedPillEl: HTMLElement | null = null;
  private impactBannerEl: HTMLElement | null = null;
  private bannerIconEl: HTMLElement | null = null;
  private bannerTitleEl: HTMLElement | null = null;
  private bannerDescEl: HTMLElement | null = null;
  private progressFillEl: HTMLElement | null = null;
  private timeLabelEl: HTMLElement | null = null;
  private skipBtn: HTMLButtonElement | null = null;
  private replayAgainBtn: HTMLButtonElement | null = null;

  private onSkipCallback: (() => void) | null = null;
  private onReplayAgainCallback: (() => void) | null = null;

  constructor() {
    let el = document.getElementById('instant-replay-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'instant-replay-overlay';
      el.className = 'replay-overlay hidden';
      document.getElementById('ui-overlay')?.appendChild(el);
    }
    this.element = el;
    this.renderSkeleton();
    this.queryElements();
    this.setupListeners();
  }

  private renderSkeleton(): void {
    this.element.innerHTML = `
      <div class="replay-inner-container">
        <!-- Top Arcade Replay Banner -->
        <div class="replay-top-badge-container">
          <div class="replay-rec-badge pulse-red">
            <span class="replay-rec-dot"></span>
            <span class="replay-rec-title">INSTANT REPLAY</span>
          </div>
          <div class="replay-speed-pill" id="replay-speed-pill">
            <span id="replay-speed-text">⏱️ 1.0X PLAYBACK</span>
          </div>
        </div>

        <!-- Center Crash Reason Callout (highlights obstacle & collision cause) -->
        <div class="replay-impact-banner" id="replay-impact-banner">
          <div class="replay-banner-accent"></div>
          <span class="replay-impact-icon" id="replay-banner-icon">💥</span>
          <div class="replay-impact-details">
            <div class="replay-impact-tag">CRASH MOMENT REPLAY</div>
            <div class="replay-impact-title" id="replay-banner-title">HEAD-ON TRAIN COLLISION</div>
            <div class="replay-impact-desc" id="replay-banner-desc">Hit an oncoming express train head-on.</div>
          </div>
        </div>

        <!-- Bottom Controls & Scrubber -->
        <div class="replay-bottom-bar">
          <div class="replay-timeline-container">
            <div class="replay-progress-track">
              <div class="replay-progress-fill" id="replay-progress-fill" style="width: 0%;"></div>
              <div class="replay-impact-marker" title="Impact Point">💥</div>
            </div>
            <div class="replay-time-label" id="replay-time-label">0.0s / 3.0s</div>
          </div>

          <div class="replay-actions-row">
            <button id="replay-skip-btn" class="arcade-btn btn-secondary replay-btn" aria-label="Skip Replay and Return to Results">
              <span>⏩ SKIP (ESC)</span>
            </button>
            <button id="replay-again-btn" class="arcade-btn btn-primary replay-btn hidden" aria-label="Replay Slow-Mo Again">
              <span>🔄 REPLAY AGAIN</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private queryElements(): void {
    this.speedPillEl = document.getElementById('replay-speed-pill');
    this.impactBannerEl = document.getElementById('replay-impact-banner');
    this.bannerIconEl = document.getElementById('replay-banner-icon');
    this.bannerTitleEl = document.getElementById('replay-banner-title');
    this.bannerDescEl = document.getElementById('replay-banner-desc');
    this.progressFillEl = document.getElementById('replay-progress-fill');
    this.timeLabelEl = document.getElementById('replay-time-label');
    this.skipBtn = document.getElementById('replay-skip-btn') as HTMLButtonElement;
    this.replayAgainBtn = document.getElementById('replay-again-btn') as HTMLButtonElement;
  }

  private setupListeners(): void {
    this.skipBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleSkip();
    });

    this.replayAgainBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleReplayAgain();
    });

    // Keyboard shortcut Escape or Space
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.element.classList.contains('hidden')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.handleSkip();
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (this.replayAgainBtn && !this.replayAgainBtn.classList.contains('hidden')) {
          e.preventDefault();
          e.stopPropagation();
          this.handleReplayAgain();
        }
      }
    });
  }

  private handleSkip(): void {
    if (this.onSkipCallback) {
      this.onSkipCallback();
    }
  }

  private handleReplayAgain(): void {
    if (this.onReplayAgainCallback) {
      this.onReplayAgainCallback();
    }
  }

  public show(
    explanation: DeathExplanation,
    onSkip: () => void,
    onReplayAgain: () => void
  ): void {
    this.onSkipCallback = onSkip;
    this.onReplayAgainCallback = onReplayAgain;

    if (this.bannerIconEl) this.bannerIconEl.textContent = explanation.icon;
    if (this.bannerTitleEl) this.bannerTitleEl.textContent = explanation.headline;
    if (this.bannerDescEl) this.bannerDescEl.textContent = explanation.explanation;

    // Reset scrubber & banners
    if (this.progressFillEl) this.progressFillEl.style.width = '0%';
    if (this.timeLabelEl) this.timeLabelEl.textContent = '0.0s / 3.0s';
    if (this.replayAgainBtn) this.replayAgainBtn.classList.add('hidden');
    if (this.impactBannerEl) this.impactBannerEl.classList.remove('banner-visible');

    this.element.classList.remove('hidden');
  }

  public update(progress: number, elapsed: number, totalDuration: number): void {
    const pct = Math.max(0, Math.min(100, progress * 100));
    if (this.progressFillEl) {
      this.progressFillEl.style.width = `${pct.toFixed(1)}%`;
    }

    if (this.timeLabelEl) {
      this.timeLabelEl.textContent = `${Math.min(elapsed, totalDuration).toFixed(1)}s / ${totalDuration.toFixed(1)}s`;
    }

    // Dynamic speed indicator pill
    const speedText = document.getElementById('replay-speed-text');
    if (speedText) {
      if (progress >= 0.58) {
        speedText.textContent = '⏱️ 0.38X SLOW-MO';
        this.speedPillEl?.classList.add('speed-slowmo');
      } else {
        speedText.textContent = '⏱️ 1.0X PLAYBACK';
        this.speedPillEl?.classList.remove('speed-slowmo');
      }
    }

    // Show impact explanation banner when nearing the impact moment (> 65% progress)
    if (progress >= 0.65) {
      this.impactBannerEl?.classList.add('banner-visible');
    }

    // Reveal [ 🔄 REPLAY AGAIN ] button when playback nears completion
    if (progress >= 0.95 && this.replayAgainBtn) {
      this.replayAgainBtn.classList.remove('hidden');
    }
  }

  public hide(): void {
    this.element.classList.add('hidden');
    this.impactBannerEl?.classList.remove('banner-visible');
    this.replayAgainBtn?.classList.add('hidden');
  }

  public isVisible(): boolean {
    return !this.element.classList.contains('hidden');
  }
}
