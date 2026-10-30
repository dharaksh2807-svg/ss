import { EventBus, EVENTS } from '../core/EventBus';
import { isDeveloperMode } from '../core/Constants';

export class PauseModal {
  private element: HTMLElement;
  private isMuted: boolean = false;

  constructor() {
    let el = document.getElementById('pause-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'pause-modal';
      el.className = 'screen-overlay hidden';
      document.getElementById('ui-overlay')?.appendChild(el);
    }
    this.element = el;
    this.render();
  }

  public updateSoundButton(isMuted: boolean): void {
    this.isMuted = isMuted;
    const soundBtn = this.element.querySelector('#pause-sound-btn');
    if (soundBtn) {
      soundBtn.innerHTML = isMuted ? '<span class="btn-icon">🔇</span> AUDIO: MUTED' : '<span class="btn-icon">🔊</span> AUDIO: ACTIVE';
    }
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="modal-card arcade-modal-card pause-modal-card animate-pop">
        <div class="modal-top-bar" style="justify-content: center; margin-bottom: 24px;">
          <div class="modal-title-group" style="text-align: center;">
            <span class="modal-badge-tag cyan-tag">MISSION SUSPENDED</span>
            <h2 class="arcade-title" style="font-size: 2.2rem; letter-spacing: 2px;">GAME PAUSED</h2>
          </div>
        </div>

        <div class="pause-actions-list">
          <!-- Primary Resume Button -->
          <button id="pause-resume-btn" class="arcade-play-btn pulse-glow" style="width: 100%; margin-bottom: 12px;">
            <span class="play-btn-content">
              <span class="play-icon">▶</span>
              <span class="play-text">RESUME RUN</span>
            </span>
          </button>

          <!-- Photo Mode Action Button -->
          <button id="pause-photo-btn" class="arcade-btn btn-photo" style="width: 100%; margin-bottom: 14px; background: linear-gradient(135deg, rgba(0, 229, 255, 0.22), rgba(124, 77, 255, 0.28)); border: 1.5px solid rgba(0, 229, 255, 0.7); color: #00e5ff; font-weight: 800; font-size: 1.05rem; letter-spacing: 1.5px; box-shadow: 0 0 16px rgba(0, 229, 255, 0.25);">
            <span class="btn-icon">📷</span> PHOTO MODE
          </button>

          <!-- Secondary Actions Grid -->
          <div class="pause-buttons-grid">
            <button id="pause-restart-btn" class="arcade-btn btn-secondary">
              <span class="btn-icon">🔄</span> RESTART
            </button>
            <button id="pause-sound-btn" class="arcade-btn btn-secondary">
              <span class="btn-icon">${this.isMuted ? '🔇' : '🔊'}</span> ${this.isMuted ? 'AUDIO: MUTED' : 'AUDIO: ACTIVE'}
            </button>
            <button id="pause-settings-btn" class="arcade-btn btn-secondary">
              <span class="btn-icon">⚙️</span> AUDIO SETTINGS
            </button>
            <button id="pause-bug-report-btn" class="arcade-btn btn-secondary" style="border-color: rgba(239, 68, 68, 0.6); color: #fca5a5; display: none;">
              <span class="btn-icon">🐛</span> BUG REPORT [F9]
            </button>
            <button id="pause-menu-btn" class="arcade-btn btn-danger">
              <span class="btn-icon">🏠</span> RETURN HOME
            </button>
          </div>
        </div>
      </div>
    `;

    const resumeBtn = this.element.querySelector('#pause-resume-btn');
    resumeBtn?.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit(EVENTS.GAME_RESUME);
    });

    const photoBtn = this.element.querySelector('#pause-photo-btn');
    photoBtn?.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit(EVENTS.PHOTO_MODE_ENTER);
    });

    const restartBtn = this.element.querySelector('#pause-restart-btn');
    restartBtn?.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit(EVENTS.GAME_RESTART);
    });

    const soundBtn = this.element.querySelector('#pause-sound-btn');
    soundBtn?.addEventListener('click', () => {
      EventBus.getInstance().emit('TOGGLE_SOUND');
    });

    const settingsBtn = this.element.querySelector('#pause-settings-btn');
    settingsBtn?.addEventListener('click', () => {
      EventBus.getInstance().emit('OPEN_SETTINGS');
    });

    const bugReportBtn = this.element.querySelector('#pause-bug-report-btn');
    bugReportBtn?.addEventListener('click', () => {
      if (isDeveloperMode()) {
        EventBus.getInstance().emit('OPEN_BUG_REPORT_MODAL');
      }
    });

    const menuBtn = this.element.querySelector('#pause-menu-btn');
    menuBtn?.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit('GO_TO_MENU');
    });

    const bus = EventBus.getInstance();
    bus.on(EVENTS.GAME_PAUSE, () => this.show());
    bus.on(EVENTS.GAME_RESUME, () => this.hide());
  }

  public show(): void {
    const bugReportBtn = this.element.querySelector('#pause-bug-report-btn') as HTMLElement;
    if (bugReportBtn) {
      bugReportBtn.style.display = isDeveloperMode() ? 'flex' : 'none';
    }
    this.element.classList.remove('hidden');
    this.element.focus();
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }
}
