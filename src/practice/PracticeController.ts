import { EventBus, EVENTS } from '../core/EventBus';
import { Player } from '../player/Player';
import { TrackManager } from '../track/TrackManager';
import { PRACTICE_MODULES, getPracticeModuleById } from './PracticeCatalog';
import {
  PracticeModuleDef,
  PracticeModuleId,
  PracticeResult,
  PracticeMedal,
  PracticeEvaluation
} from './PracticeTypes';

export class PracticeController {
  private static instance: PracticeController | null = null;

  private activeModule: PracticeModuleDef | null = null;
  private isHarder: boolean = false;
  private isActive: boolean = false;
  private elapsed: number = 0;
  private attempts: number = 0;
  private status: PracticeResult = 'IN_PROGRESS';
  private lastEvaluation: PracticeEvaluation | null = null;

  private overlayEl: HTMLElement | null = null;
  private eventBus = EventBus.getInstance();

  constructor(
    private player: Player,
    private trackManager: TrackManager,
    private onExitToMenu?: () => void
  ) {
    this.initKeyboardListeners();
  }

  public static getInstance(player?: Player, trackManager?: TrackManager, onExitToMenu?: () => void): PracticeController {
    if (!PracticeController.instance && player && trackManager) {
      PracticeController.instance = new PracticeController(player, trackManager, onExitToMenu);
    }
    return PracticeController.instance!;
  }

  public isActiveSession(): boolean {
    return this.isActive;
  }

  public getActiveModule(): PracticeModuleDef | null {
    return this.activeModule;
  }

  public getStatus(): PracticeResult {
    return this.status;
  }

  public getAttempts(): number {
    return this.attempts;
  }

  public getIsHarder(): boolean {
    return this.isHarder;
  }

  /**
   * Starts a practice module with real game physics and obstacles
   */
  public startModule(moduleId: PracticeModuleId, isHarder: boolean = false): void {
    const moduleDef = getPracticeModuleById(moduleId);
    if (!moduleDef) return;

    this.activeModule = moduleDef;
    this.isHarder = isHarder;
    this.isActive = true;
    this.elapsed = 0;
    this.attempts = 1;
    this.status = 'IN_PROGRESS';
    this.lastEvaluation = null;

    // Build the obstacle scenario
    moduleDef.setup(this.player, this.trackManager, isHarder);

    // Mount and display the Gravitas practice HUD
    this.mountHUD();
    this.updateHUD();

    this.eventBus.emit('PRACTICE_STARTED', {
      moduleId,
      isHarder,
      attempts: this.attempts
    });
  }

  /**
   * Immediate instantaneous reload with zero menu delay
   */
  public retry(): void {
    if (!this.activeModule || !this.isActive) return;

    this.elapsed = 0;
    this.attempts++;
    this.status = 'IN_PROGRESS';
    this.lastEvaluation = null;

    // Reset module obstacle state
    this.activeModule.setup(this.player, this.trackManager, this.isHarder);

    this.updateHUD();

    this.eventBus.emit('PRACTICE_RETRY', {
      moduleId: this.activeModule.id,
      isHarder: this.isHarder,
      attempts: this.attempts
    });
  }

  /**
   * Advance to the next practice module in curriculum
   */
  public nextModule(): void {
    if (!this.activeModule) return;
    const currentIndex = PRACTICE_MODULES.findIndex(m => m.id === this.activeModule!.id);
    const nextIndex = (currentIndex + 1) % PRACTICE_MODULES.length;
    this.startModule(PRACTICE_MODULES[nextIndex].id, false);
  }

  /**
   * Update practice evaluation on each physics frame
   */
  public update(dt: number): void {
    if (!this.isActive || !this.activeModule) return;

    if (this.status === 'IN_PROGRESS') {
      this.elapsed += dt;

      const evalResult = this.activeModule.evaluate(
        this.player,
        this.trackManager,
        dt,
        this.elapsed,
        this.isHarder
      );

      this.lastEvaluation = evalResult;

      if (evalResult.result !== 'IN_PROGRESS') {
        this.status = evalResult.result;

        if (this.status === 'SUCCESS') {
          const medal: PracticeMedal = this.isHarder ? 'GOLD' : 'SILVER';
          this.saveMedal(this.activeModule.id, medal);
          this.eventBus.emit('PRACTICE_COMPLETED', {
            moduleId: this.activeModule.id,
            medal,
            attempts: this.attempts
          });
        } else {
          this.eventBus.emit('PRACTICE_FAILED', {
            moduleId: this.activeModule.id,
            reason: evalResult.message,
            attempts: this.attempts
          });
        }

        this.updateHUD();
      }
    }
  }

  /**
   * Explicitly display an evaluation result feedback card
   */
  public showResultFeedback(evalResult: PracticeEvaluation): void {
    this.lastEvaluation = evalResult;
    this.status = evalResult.result;
    if (this.status === 'SUCCESS' && this.activeModule) {
      const medal: PracticeMedal = this.isHarder ? 'GOLD' : 'SILVER';
      this.saveMedal(this.activeModule.id, medal);
    }
    this.updateHUD();
  }

  /**
   * Exit practice session and return to lobby
   */
  public exit(): void {
    if (!this.isActive) return;
    this.isActive = false;
    this.activeModule = null;
    this.status = 'IN_PROGRESS';
    this.dismountHUD();

    if (this.onExitToMenu) {
      this.onExitToMenu();
    }
  }

  // ---------------------------------------------------------------------------
  // Medal Persistence (Isolated from progression economy)
  // ---------------------------------------------------------------------------
  public getMedals(): Record<string, PracticeMedal> {
    try {
      const stored = localStorage.getItem('metro_practice_medals');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  public getMedal(moduleId: string): PracticeMedal {
    const medals = this.getMedals();
    return medals[moduleId] || 'NONE';
  }

  private saveMedal(moduleId: string, newMedal: PracticeMedal): void {
    try {
      const medals = this.getMedals();
      const current = medals[moduleId] || 'NONE';
      const medalRank: Record<PracticeMedal, number> = {
        NONE: 0,
        BRONZE: 1,
        SILVER: 2,
        GOLD: 3
      };

      if (medalRank[newMedal] > medalRank[current]) {
        medals[moduleId] = newMedal;
        localStorage.setItem('metro_practice_medals', JSON.stringify(medals));
      }
    } catch (e) {
      console.warn('Failed to persist practice medal:', e);
    }
  }

  // ---------------------------------------------------------------------------
  // Gravitas In-Game Practice HUD
  // ---------------------------------------------------------------------------
  private mountHUD(): void {
    if (this.overlayEl) return;
    if (typeof document === 'undefined') return;

    const overlay = document.createElement('div');
    overlay.id = 'practice-hud-overlay';
    overlay.className = 'practice-hud-overlay';

    document.getElementById('ui-overlay')?.appendChild(overlay);
    this.overlayEl = overlay;
  }

  private dismountHUD(): void {
    if (this.overlayEl && this.overlayEl.parentNode) {
      this.overlayEl.parentNode.removeChild(this.overlayEl);
      this.overlayEl = null;
    }
  }

  private updateHUD(): void {
    if (!this.overlayEl || !this.activeModule) return;

    const mod = this.activeModule;
    const medal = this.getMedal(mod.id);
    const medalEmoji: Record<PracticeMedal, string> = {
      NONE: '⚪',
      BRONZE: '🥉',
      SILVER: '🥈',
      GOLD: '🥇'
    };

    let resultBannerHtml = '';
    if (this.status === 'SUCCESS') {
      resultBannerHtml = `
        <div class="practice-result-card success pulse-glow">
          <div class="practice-result-badge">🏆 SUCCESS!</div>
          <h3 class="practice-result-title">${this.lastEvaluation?.message || 'Module Mastered!'}</h3>
          <p class="practice-result-tip">${this.lastEvaluation?.tip || ''}</p>
          <div class="practice-action-buttons">
            <button id="practice-retry-btn" class="btn btn-secondary practice-btn">
              <span class="btn-icon">🔄</span> RETRY [R]
            </button>
            <button id="practice-next-btn" class="btn btn-primary practice-btn pulse-anim">
              <span class="btn-icon">▶</span> NEXT MODULE
            </button>
            <button id="practice-exit-btn" class="btn btn-tertiary practice-btn">
              <span class="btn-icon">🏠</span> MENU
            </button>
          </div>
        </div>
      `;
    } else if (this.status === 'FAILED') {
      resultBannerHtml = `
        <div class="practice-result-card failure shake-anim">
          <div class="practice-result-badge failure-badge">💥 ATTEMPT FAILED</div>
          <h3 class="practice-result-title">${this.lastEvaluation?.message || 'Obstacle collision'}</h3>
          <p class="practice-result-tip">${this.lastEvaluation?.tip || ''}</p>
          <div class="practice-action-buttons">
            <button id="practice-retry-btn" class="btn btn-primary practice-btn pulse-anim">
              <span class="btn-icon">🔄</span> RETRY NOW [R]
            </button>
            <button id="practice-exit-btn" class="btn btn-tertiary practice-btn">
              <span class="btn-icon">🏠</span> MENU
            </button>
          </div>
        </div>
      `;
    }

    this.overlayEl.innerHTML = `
      <div class="practice-top-banner glassmorphic">
        <div class="practice-banner-left">
          <span class="practice-mod-icon">${mod.icon}</span>
          <div class="practice-mod-info">
            <div class="practice-mod-header">
              <span class="practice-tag">PRACTICE DRILL</span>
              <span class="practice-mod-tier ${this.isHarder ? 'harder-tier' : ''}">
                ${this.isHarder ? 'HARDER CHALLENGE' : 'STANDARD'}
              </span>
              <span class="practice-medal-badge" title="Medal Earned">${medalEmoji[medal]}</span>
            </div>
            <h2 class="practice-mod-title">${mod.title}</h2>
          </div>
        </div>

        <div class="practice-banner-center">
          <div class="practice-objective-text">${mod.objectiveText}</div>
          <div class="practice-controls-hint">💡 ${mod.controlsHint}</div>
        </div>

        <div class="practice-banner-right">
          <div class="practice-attempt-pill">
            <span class="attempt-label">ATTEMPT</span>
            <span class="attempt-num">#${this.attempts}</span>
          </div>
          <button id="practice-hud-exit-btn" class="practice-exit-icon-btn" title="Exit Practice">✕</button>
        </div>
      </div>

      ${resultBannerHtml}
    `;

    // Wire up buttons
    document.getElementById('practice-retry-btn')?.addEventListener('click', () => this.retry());
    document.getElementById('practice-next-btn')?.addEventListener('click', () => this.nextModule());
    document.getElementById('practice-exit-btn')?.addEventListener('click', () => this.exit());
    document.getElementById('practice-hud-exit-btn')?.addEventListener('click', () => this.exit());
  }

  private initKeyboardListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      if (!this.isActive) return;

      if (e.code === 'KeyR' && !e.repeat) {
        e.preventDefault();
        this.retry();
      }

      if (e.code === 'Escape' && this.status !== 'IN_PROGRESS') {
        e.preventDefault();
        this.exit();
      }
    });
  }
}
