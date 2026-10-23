import { EventBus } from '../core/EventBus';
import { PRACTICE_MODULES } from '../practice/PracticeCatalog';
import { PracticeController } from '../practice/PracticeController';
import { PracticeModuleId, PracticeMedal } from '../practice/PracticeTypes';

export class PracticeModal {
  private element: HTMLElement;
  private containerEl: HTMLElement;
  private closeBtn: HTMLButtonElement;
  private launchBtn: HTMLButtonElement;
  private harderToggleBtn: HTMLButtonElement;

  private selectedModuleId: PracticeModuleId = 'THREE_LANE_MOVEMENT';
  private isHarder: boolean = false;
  private previousScreen: string | null = null;

  constructor(private practiceController: PracticeController, private onLaunch: (moduleId: PracticeModuleId, isHarder: boolean) => void) {
    let el = document.getElementById('practice-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'practice-modal';
      el.className = 'screen-overlay hidden';
      el.innerHTML = `
        <div class="modal-card glassmorphic practice-modal-card">
          <div class="practice-modal-header">
            <div class="practice-modal-title-row">
              <span class="practice-academy-badge">🎓 METRO ACADEMY</span>
              <h2 class="modal-title">PRACTICE MODE & DRILLS</h2>
            </div>
            <p class="tab-subtitle">Select a dedicated training module to master controls, precision timings, and subway obstacle physics!</p>
          </div>

          <div class="practice-difficulty-bar">
            <span class="difficulty-bar-label">VARIATION:</span>
            <button id="practice-harder-toggle" class="btn btn-secondary practice-toggle-btn">
              <span class="toggle-icon">⚡</span> <span id="practice-toggle-text">STANDARD DRILL</span>
            </button>
            <span class="practice-economy-pill">🔒 Isolated from Run Coins & Missions</span>
          </div>

          <div class="practice-modules-grid" id="practice-modules-list"></div>

          <div class="modal-buttons practice-modal-footer">
            <button id="practice-close-btn" class="btn btn-secondary">BACK</button>
            <button id="practice-launch-btn" class="btn btn-primary pulse-anim">
              <span class="btn-icon">▶</span> START DRILL
            </button>
          </div>
        </div>
      `;
      document.getElementById('ui-overlay')?.appendChild(el);
    }

    this.element = el;
    this.containerEl = document.getElementById('practice-modules-list')!;
    this.closeBtn = document.getElementById('practice-close-btn') as HTMLButtonElement;
    this.launchBtn = document.getElementById('practice-launch-btn') as HTMLButtonElement;
    this.harderToggleBtn = document.getElementById('practice-harder-toggle') as HTMLButtonElement;

    this.setupListeners();
  }

  private setupListeners(): void {
    this.closeBtn.addEventListener('click', () => {
      this.hide();
    });

    this.launchBtn.addEventListener('click', () => {
      this.hide(false);
      this.onLaunch(this.selectedModuleId, this.isHarder);
    });

    this.harderToggleBtn.addEventListener('click', () => {
      this.isHarder = !this.isHarder;
      const textEl = document.getElementById('practice-toggle-text');
      if (textEl) {
        textEl.textContent = this.isHarder ? 'HARDER CHALLENGE' : 'STANDARD DRILL';
      }
      this.harderToggleBtn.classList.toggle('active-harder', this.isHarder);
      this.render();
    });

    EventBus.getInstance().on('OPEN_PRACTICE', (fromScreen?: string) => {
      this.previousScreen = fromScreen || null;
      this.show();
    });
  }

  public show(): void {
    this.render();
    document.getElementById('start-screen')?.classList.add('hidden');
    this.element.classList.remove('hidden');
  }

  public hide(restorePrevious: boolean = true): void {
    this.element.classList.add('hidden');
    if (restorePrevious) {
      document.getElementById('start-screen')?.classList.remove('hidden');
    }
    this.previousScreen = null;
  }

  private render(): void {
    const medals = this.practiceController.getMedals();
    const medalEmoji: Record<PracticeMedal, string> = {
      NONE: '⚪',
      BRONZE: '🥉',
      SILVER: '🥈',
      GOLD: '🥇'
    };

    let html = '';

    for (const mod of PRACTICE_MODULES) {
      const isSelected = mod.id === this.selectedModuleId;
      const medal = medals[mod.id] || 'NONE';

      html += `
        <div class="practice-module-card ${isSelected ? 'selected' : ''}" data-module="${mod.id}">
          <div class="practice-card-top">
            <span class="practice-card-icon">${mod.icon}</span>
            <div class="practice-card-title-area">
              <span class="practice-card-category">${mod.skillCategory.replace('_', ' ')}</span>
              <h3 class="practice-card-title">${mod.title}</h3>
            </div>
            <div class="practice-card-medal" title="Medal: ${medal}">
              <span class="medal-icon">${medalEmoji[medal]}</span>
            </div>
          </div>

          <p class="practice-card-sub">${mod.subtitle}</p>

          <div class="practice-card-objective">
            <span class="objective-label">OBJECTIVE:</span>
            <span class="objective-desc">${mod.objectiveText}</span>
          </div>

          <div class="practice-card-controls">
            <span class="controls-tag">CONTROLS:</span>
            <span class="controls-text">${mod.controlsHint}</span>
          </div>

          ${this.isHarder ? `
            <div class="practice-harder-badge">
              <span class="harder-icon">🔥</span> Variation: ${mod.harderVariationLabel}
            </div>
          ` : ''}
        </div>
      `;
    }

    this.containerEl.innerHTML = html;

    // Attach click listeners to module cards
    const cards = this.containerEl.querySelectorAll('.practice-module-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-module') as PracticeModuleId;
        if (id) {
          this.selectedModuleId = id;
          this.render();
        }
      });
    });
  }
}
