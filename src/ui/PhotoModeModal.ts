import { PhotoModeController, PhotoPresetId, LookAtTargetMode, ColorGradeFilter, ScreenshotExportResult } from '../scene/PhotoModeController';
import { Player } from '../player/Player';
import { WorldScene } from '../scene/WorldScene';
import { PresentationPose } from '../player/CharacterModel';
import { EventBus, EVENTS } from '../core/EventBus';
import { getCharacterById } from '../characters/CharacterCatalog';
import { ProgressionManager } from '../progression/ProgressionManager';

export class PhotoModeModal {
  private element: HTMLElement;
  private vignetteOverlay!: HTMLElement;
  private gridOverlay!: HTMLElement;
  private watermarkPreview!: HTMLElement;
  private controlsPanel!: HTMLElement;
  private flashOverlay!: HTMLElement;
  private previewModal!: HTMLElement;
  private hiddenHint!: HTMLElement;

  private controller: PhotoModeController;
  private activePlayer: Player | null = null;
  private worldScene: WorldScene | null = null;

  private isVisible: boolean = false;
  private isUiHidden: boolean = false;
  private activeTab: 'CAMERA' | 'EFFECTS' | 'CHARACTER' = 'CAMERA';

  // Pointer drag tracking
  private isPointerDown: boolean = false;
  private pointerStartX: number = 0;
  private pointerStartY: number = 0;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;
  private isAltDrag: boolean = false; // Right-click or Shift-drag for elevation

  // Touch pinch tracking
  private activeTouchCount: number = 0;
  private lastTouchDistance: number = 0;

  // Bound event handlers for clean removal
  private boundOnKeyDown: (e: KeyboardEvent) => void;
  private boundOnPointerDown: (e: PointerEvent) => void;
  private boundOnPointerMove: (e: PointerEvent) => void;
  private boundOnPointerUp: (e: PointerEvent) => void;
  private boundOnWheel: (e: WheelEvent) => void;
  private boundOnTouchStart: (e: TouchEvent) => void;
  private boundOnTouchMove: (e: TouchEvent) => void;
  private boundOnTouchEnd: (e: TouchEvent) => void;

  constructor() {
    this.controller = PhotoModeController.getInstance();

    let el = document.getElementById('photo-mode-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'photo-mode-modal';
      el.className = 'photo-mode-container hidden';
      document.getElementById('ui-overlay')?.appendChild(el);
    }
    this.element = el;

    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnPointerDown = this.onPointerDown.bind(this);
    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnPointerUp = this.onPointerUp.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchStart = this.onTouchStart.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchEnd = this.onTouchEnd.bind(this);

    this.render();
  }

  public init(worldScene: WorldScene): void {
    this.worldScene = worldScene;
  }

  public show(player: Player): void {
    if (this.isVisible) return;
    this.activePlayer = player;
    this.isVisible = true;
    this.isUiHidden = false;
    this.element.classList.remove('hidden');

    this.controller.enter(player);
    this.syncUiFromSettings();

    // Attach interaction listeners
    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('wheel', this.boundOnWheel, { passive: false });
    window.addEventListener('pointerdown', this.boundOnPointerDown);
    window.addEventListener('pointermove', this.boundOnPointerMove);
    window.addEventListener('pointerup', this.boundOnPointerUp);
    window.addEventListener('pointercancel', this.boundOnPointerUp);
    window.addEventListener('touchstart', this.boundOnTouchStart, { passive: false });
    window.addEventListener('touchmove', this.boundOnTouchMove, { passive: false });
    window.addEventListener('touchend', this.boundOnTouchEnd);
  }

  public hide(): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.element.classList.add('hidden');

    if (this.activePlayer) {
      this.controller.exit(this.activePlayer);
    }

    // Detach interaction listeners
    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('wheel', this.boundOnWheel);
    window.removeEventListener('pointerdown', this.boundOnPointerDown);
    window.removeEventListener('pointermove', this.boundOnPointerMove);
    window.removeEventListener('pointerup', this.boundOnPointerUp);
    window.removeEventListener('pointercancel', this.boundOnPointerUp);
    window.removeEventListener('touchstart', this.boundOnTouchStart);
    window.removeEventListener('touchmove', this.boundOnTouchMove);
    window.removeEventListener('touchend', this.boundOnTouchEnd);

    this.activePlayer = null;
    EventBus.getInstance().emit(EVENTS.PHOTO_MODE_EXIT);
  }

  public isPhotoStudioOpen(): boolean {
    return this.isVisible;
  }

  private render(): void {
    this.element.innerHTML = `
      <!-- Vignette Preview Overlay -->
      <div id="photo-vignette-overlay" class="photo-vignette-overlay"></div>

      <!-- Rule of Thirds Cinematic Grid -->
      <div id="photo-grid-overlay" class="photo-grid-overlay hidden">
        <div class="grid-line grid-line-h h1"></div>
        <div class="grid-line grid-line-h h2"></div>
        <div class="grid-line grid-line-v v1"></div>
        <div class="grid-line grid-line-v v2"></div>
      </div>

      <!-- Live Watermark Preview -->
      <div id="photo-watermark-preview" class="photo-watermark-box">
        <div class="wm-accent-bar"></div>
        <div class="wm-text-group">
          <span class="wm-title">METRO RUNNER 3D</span>
          <span id="wm-meta-line" class="wm-subtitle">Jax  |  Modern District</span>
          <span class="wm-badge">UTC • PHOTO STUDIO</span>
        </div>
      </div>

      <!-- Shutter Flash Animation -->
      <div id="photo-shutter-flash" class="photo-shutter-flash"></div>

      <!-- Floating Unhide Hint (Active when UI is hidden) -->
      <div id="photo-hidden-hint" class="photo-hidden-hint hidden">
        <span class="hint-icon">👁️</span> Click anywhere or press <kbd>H</kbd> to show controls
      </div>

      <!-- Primary Glassmorphic Controls Panel -->
      <div id="photo-controls-panel" class="photo-controls-panel animate-fade-in">
        <!-- Header Bar -->
        <div class="photo-header-bar">
          <div class="photo-title-pill">
            <span class="camera-icon">📷</span>
            <span class="photo-title-text">PHOTO STUDIO</span>
            <span class="photo-badge">PRO 4K</span>
          </div>
          <div class="photo-header-actions">
            <button id="photo-toggle-grid-btn" class="photo-tool-btn" title="Toggle Grid (G)">
              <span class="btn-icon">#</span> GRID
            </button>
            <button id="photo-hide-ui-btn" class="photo-tool-btn" title="Hide UI (H)">
              <span class="btn-icon">👁️</span> HIDE UI
            </button>
            <button id="photo-reset-btn" class="photo-tool-btn" title="Reset Framing (R)">
              <span class="btn-icon">🔄</span> RESET
            </button>
            <button id="photo-exit-btn" class="photo-tool-btn btn-danger" title="Exit Photo Mode (Esc)">
              <span class="btn-icon">✕</span> EXIT
            </button>
          </div>
        </div>

        <!-- Presets Ribbon -->
        <div class="photo-presets-ribbon">
          <span class="ribbon-label">PRESETS</span>
          <div class="presets-scroll-track">
            <button class="preset-pill active" data-preset="RUNNER_PORTRAIT">
              <span class="preset-icon">👤</span> PORTRAIT
            </button>
            <button class="preset-pill" data-preset="ACTION_SHOT">
              <span class="preset-icon">⚡</span> ACTION HERO
            </button>
            <button class="preset-pill" data-preset="TRAIN_ROOFTOP">
              <span class="preset-icon">🚆</span> ROOFTOP
            </button>
            <button class="preset-pill" data-preset="ENVIRONMENTAL_VISTA">
              <span class="preset-icon">🌆</span> CITY VISTA
            </button>
            <button class="preset-pill" data-preset="CLASSIC_GAMEPLAY">
              <span class="preset-icon">🎮</span> CLASSIC
            </button>
          </div>
        </div>

        <!-- Segmented Controls Tabs -->
        <div class="photo-tab-bar">
          <button class="photo-tab-btn active" data-tab="CAMERA">
            <span>🎥</span> CAMERA & LENS
          </button>
          <button class="photo-tab-btn" data-tab="EFFECTS">
            <span>🎨</span> COLOR & EFFECTS
          </button>
          <button class="photo-tab-btn" data-tab="CHARACTER">
            <span>🏃</span> CHARACTER POSE
          </button>
        </div>

        <!-- Tab 1: Camera & Framing -->
        <div id="tab-content-camera" class="photo-tab-content">
          <div class="control-row">
            <div class="slider-label-group">
              <span class="slider-label">FIELD OF VIEW (FOV)</span>
              <span id="label-fov-val" class="slider-value">42°</span>
            </div>
            <input type="range" id="slider-fov" min="25" max="85" step="1" value="42" class="photo-slider" />
          </div>

          <div class="control-row">
            <div class="slider-label-group">
              <span class="slider-label">ZOOM DISTANCE</span>
              <span id="label-dist-val" class="slider-value">2.2m</span>
            </div>
            <input type="range" id="slider-dist" min="1.2" max="18.0" step="0.2" value="2.2" class="photo-slider" />
          </div>

          <div class="control-row">
            <div class="slider-label-group">
              <span class="slider-label">CAMERA ELEVATION</span>
              <span id="label-elev-val" class="slider-value">0.0m</span>
            </div>
            <input type="range" id="slider-elev" min="-0.6" max="2.2" step="0.1" value="0.0" class="photo-slider" />
          </div>

          <div class="control-row">
            <span class="slider-label">LOOK-AT FOCUS TARGET</span>
            <div class="button-group-row">
              <button class="btn-chip active" data-target="HEAD">HEAD / FACE</button>
              <button class="btn-chip" data-target="TORSO">TORSO / OUTFIT</button>
              <button class="btn-chip" data-target="FEET">FEET / BOARD</button>
              <button class="btn-chip" data-target="HORIZON">TRACK HORIZON</button>
            </div>
          </div>
        </div>

        <!-- Tab 2: Effects & Color Tones -->
        <div id="tab-content-effects" class="photo-tab-content hidden">
          <div class="control-row">
            <div class="slider-label-group">
              <span class="slider-label">EXPOSURE (EV)</span>
              <span id="label-exp-val" class="slider-value">+0.05 EV</span>
            </div>
            <input type="range" id="slider-exp" min="-1.0" max="1.0" step="0.05" value="0.05" class="photo-slider" />
          </div>

          <div class="control-row">
            <div class="slider-label-group">
              <span class="slider-label">CINEMATIC VIGNETTE</span>
              <span id="label-vig-val" class="slider-value">25%</span>
            </div>
            <input type="range" id="slider-vig" min="0" max="100" step="5" value="25" class="photo-slider" />
          </div>

          <div class="control-row">
            <span class="slider-label">COLOR GRADE & MOOD</span>
            <div class="button-group-row grid-3col">
              <button class="btn-chip active" data-filter="NATURAL">NATURAL</button>
              <button class="btn-chip" data-filter="VIBRANT">VIBRANT ARCADE</button>
              <button class="btn-chip" data-filter="CYBERPUNK">CYBERPUNK</button>
              <button class="btn-chip" data-filter="WARM_GOLDEN">GOLDEN HOUR</button>
              <button class="btn-chip" data-filter="NOIR">NOIR B&W</button>
              <button class="btn-chip" data-filter="VINTAGE">VINTAGE 90S</button>
            </div>
          </div>

          <div class="control-row toggle-row">
            <label class="toggle-container">
              <input type="checkbox" id="check-watermark" checked />
              <span class="toggle-mark"></span>
              <span class="toggle-text">INCLUDE WATERMARK BANNER</span>
            </label>
          </div>
        </div>

        <!-- Tab 3: Character Pose -->
        <div id="tab-content-character" class="photo-tab-content hidden">
          <div class="control-row">
            <span class="slider-label">PRESENTATION POSE (VISUAL ONLY)</span>
            <div class="button-group-row grid-3col">
              <button class="btn-chip" data-pose="DEFAULT">RUN RUNTIME</button>
              <button class="btn-chip active" data-pose="IDLE">IDLE STANCE</button>
              <button class="btn-chip" data-pose="RUN">SPRINT ATHLETIC</button>
              <button class="btn-chip" data-pose="JUMP">JUMP APEX</button>
              <button class="btn-chip" data-pose="VICTORY">VICTORY CHAMPION</button>
              <button class="btn-chip" data-pose="HOVERBOARD">HOVERBOARD SURF</button>
            </div>
          </div>
          <div class="pose-info-box">
            <span>ℹ️ Poses are purely visual presentations and do not modify player score, velocity, or collision physics.</span>
          </div>
        </div>

        <!-- Shutter Capture Bar -->
        <div class="photo-shutter-bar">
          <div class="touch-hint">
            <span>🖱️ Drag to Orbit  •  Scroll to Zoom  •  Shift+Drag to Pan</span>
          </div>
          <button id="photo-shutter-btn" class="shutter-capture-btn pulse-glow">
            <span class="shutter-icon">📸</span>
            <span class="shutter-text">TAKE SCREENSHOT</span>
            <span class="shutter-shortcut">[SPACE]</span>
          </button>
        </div>
      </div>

      <!-- Screenshot Preview & Download Modal -->
      <div id="photo-preview-modal" class="photo-preview-backdrop hidden">
        <div class="modal-card arcade-modal-card photo-preview-card animate-pop">
          <div class="modal-top-bar">
            <div class="modal-title-group">
              <span class="modal-badge-tag cyan-tag">CAPTURE COMPLETE</span>
              <h3 class="arcade-title" style="font-size: 1.6rem;">SCREENSHOT CAPTURED</h3>
            </div>
            <button id="photo-preview-close-btn" class="modal-close-btn">✕</button>
          </div>

          <div class="photo-preview-thumb-container">
            <img id="photo-preview-img" class="photo-preview-img" alt="Captured screenshot preview" />
            <div class="photo-preview-badge" id="photo-preview-dims">1920 × 1080 • PNG</div>
          </div>

          <div class="photo-preview-actions">
            <a id="photo-preview-download-btn" class="arcade-play-btn" style="flex: 1; text-decoration: none;" download>
              <span class="play-btn-content">
                <span class="play-icon">💾</span>
                <span class="play-text">SAVE PNG IMAGE</span>
              </span>
            </a>
            <button id="photo-preview-copy-btn" class="arcade-btn btn-secondary" style="flex: 1;">
              <span class="btn-icon">📋</span> COPY IMAGE
            </button>
            <button id="photo-preview-dismiss-btn" class="arcade-btn btn-secondary">
              CONTINUE 📷
            </button>
          </div>
        </div>
      </div>
    `;

    this.vignetteOverlay = this.element.querySelector('#photo-vignette-overlay')!;
    this.gridOverlay = this.element.querySelector('#photo-grid-overlay')!;
    this.watermarkPreview = this.element.querySelector('#photo-watermark-preview')!;
    this.controlsPanel = this.element.querySelector('#photo-controls-panel')!;
    this.flashOverlay = this.element.querySelector('#photo-shutter-flash')!;
    this.previewModal = this.element.querySelector('#photo-preview-modal')!;
    this.hiddenHint = this.element.querySelector('#photo-hidden-hint')!;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Header actions
    this.element.querySelector('#photo-toggle-grid-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleGrid();
    });
    this.element.querySelector('#photo-hide-ui-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setUiHidden(true);
    });
    this.element.querySelector('#photo-reset-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.controller.resetToGameplay(this.activePlayer || undefined);
      this.syncUiFromSettings();
    });
    this.element.querySelector('#photo-exit-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.hide();
      EventBus.getInstance().emit(EVENTS.GAME_PAUSE); // Return to pause menu
    });

    // Unhide clicking
    this.hiddenHint.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setUiHidden(false);
    });
    this.element.addEventListener('click', (e) => {
      if (this.isUiHidden) {
        this.setUiHidden(false);
      }
    });

    // Presets
    const presetPills = this.element.querySelectorAll('.preset-pill');
    presetPills.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const preset = btn.getAttribute('data-preset') as PhotoPresetId;
        this.controller.applyPreset(preset, this.activePlayer || undefined);
        this.syncUiFromSettings();
      });
    });

    // Tabs
    const tabBtns = this.element.querySelectorAll('.photo-tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tab = btn.getAttribute('data-tab') as 'CAMERA' | 'EFFECTS' | 'CHARACTER';
        this.switchTab(tab);
      });
    });

    // Camera sliders
    const fovSlider = this.element.querySelector('#slider-fov') as HTMLInputElement;
    fovSlider?.addEventListener('input', () => {
      const val = parseFloat(fovSlider.value);
      this.controller.setSetting('fov', val, this.activePlayer || undefined);
      this.element.querySelector('#label-fov-val')!.textContent = `${Math.round(val)}°`;
    });

    const distSlider = this.element.querySelector('#slider-dist') as HTMLInputElement;
    distSlider?.addEventListener('input', () => {
      const val = parseFloat(distSlider.value);
      this.controller.setSetting('distance', val, this.activePlayer || undefined);
      this.element.querySelector('#label-dist-val')!.textContent = `${val.toFixed(1)}m`;
    });

    const elevSlider = this.element.querySelector('#slider-elev') as HTMLInputElement;
    elevSlider?.addEventListener('input', () => {
      const val = parseFloat(elevSlider.value);
      this.controller.setSetting('elevationOffset', val, this.activePlayer || undefined);
      this.element.querySelector('#label-elev-val')!.textContent = `${val >= 0 ? '+' : ''}${val.toFixed(1)}m`;
    });

    // Look at target chips
    const targetChips = this.element.querySelectorAll('[data-target]');
    targetChips.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = btn.getAttribute('data-target') as LookAtTargetMode;
        this.controller.setSetting('lookAtMode', target, this.activePlayer || undefined);
        this.syncUiFromSettings();
      });
    });

    // Effects sliders
    const expSlider = this.element.querySelector('#slider-exp') as HTMLInputElement;
    expSlider?.addEventListener('input', () => {
      const val = parseFloat(expSlider.value);
      this.controller.setSetting('exposure', val, this.activePlayer || undefined);
      this.element.querySelector('#label-exp-val')!.textContent = `${val >= 0 ? '+' : ''}${val.toFixed(2)} EV`;
    });

    const vigSlider = this.element.querySelector('#slider-vig') as HTMLInputElement;
    vigSlider?.addEventListener('input', () => {
      const val = parseFloat(vigSlider.value) / 100;
      this.controller.setSetting('vignette', val, this.activePlayer || undefined);
      this.element.querySelector('#label-vig-val')!.textContent = `${Math.round(val * 100)}%`;
      this.updateVignetteOverlay(val);
    });

    // Color grade chips
    const filterChips = this.element.querySelectorAll('[data-filter]');
    filterChips.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const filter = btn.getAttribute('data-filter') as ColorGradeFilter;
        this.controller.setSetting('colorGrade', filter, this.activePlayer || undefined);
        this.syncUiFromSettings();
      });
    });

    // Watermark checkbox
    const wmCheck = this.element.querySelector('#check-watermark') as HTMLInputElement;
    wmCheck?.addEventListener('change', () => {
      this.controller.setSetting('showWatermark', wmCheck.checked);
      this.watermarkPreview.classList.toggle('hidden', !wmCheck.checked);
    });

    // Character pose chips
    const poseChips = this.element.querySelectorAll('[data-pose]');
    poseChips.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pose = btn.getAttribute('data-pose') as PresentationPose;
        this.controller.setSetting('characterPose', pose, this.activePlayer || undefined);
        this.syncUiFromSettings();
      });
    });

    // Shutter capture button
    const shutterBtn = this.element.querySelector('#photo-shutter-btn');
    shutterBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerCapture();
    });

    // Preview modal close / dismiss
    this.element.querySelector('#photo-preview-close-btn')?.addEventListener('click', () => this.closePreviewModal());
    this.element.querySelector('#photo-preview-dismiss-btn')?.addEventListener('click', () => this.closePreviewModal());

    // Preview copy button
    const copyBtn = this.element.querySelector('#photo-preview-copy-btn');
    copyBtn?.addEventListener('click', async () => {
      await this.copyCurrentScreenshotToClipboard();
    });
  }

  private switchTab(tab: 'CAMERA' | 'EFFECTS' | 'CHARACTER'): void {
    this.activeTab = tab;
    const tabBtns = this.element.querySelectorAll('.photo-tab-btn');
    tabBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });

    this.element.querySelector('#tab-content-camera')?.classList.toggle('hidden', tab !== 'CAMERA');
    this.element.querySelector('#tab-content-effects')?.classList.toggle('hidden', tab !== 'EFFECTS');
    this.element.querySelector('#tab-content-character')?.classList.toggle('hidden', tab !== 'CHARACTER');
  }

  private toggleGrid(): void {
    const isGrid = this.gridOverlay.classList.contains('hidden');
    this.gridOverlay.classList.toggle('hidden', !isGrid);
    this.controller.setSetting('showGrid', isGrid);
    this.element.querySelector('#photo-toggle-grid-btn')?.classList.toggle('active', isGrid);
  }

  private setUiHidden(hidden: boolean): void {
    this.isUiHidden = hidden;
    this.controlsPanel.classList.toggle('controls-hidden', hidden);
    this.hiddenHint.classList.toggle('hidden', !hidden);
  }

  private updateVignetteOverlay(strength: number): void {
    if (strength <= 0.02) {
      this.vignetteOverlay.style.background = 'none';
      return;
    }
    const alpha = (strength * 0.85).toFixed(2);
    this.vignetteOverlay.style.background = `radial-gradient(circle, transparent 52%, rgba(0, 0, 0, ${alpha}) 100%)`;
  }

  private syncUiFromSettings(): void {
    const s = this.controller.getSettings();

    // Preset pills
    const presetPills = this.element.querySelectorAll('.preset-pill');
    presetPills.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-preset') === s.preset);
    });

    // Camera sliders
    const fovSlider = this.element.querySelector('#slider-fov') as HTMLInputElement;
    if (fovSlider) {
      fovSlider.value = s.fov.toString();
      this.element.querySelector('#label-fov-val')!.textContent = `${Math.round(s.fov)}°`;
    }

    const distSlider = this.element.querySelector('#slider-dist') as HTMLInputElement;
    if (distSlider) {
      distSlider.value = s.distance.toString();
      this.element.querySelector('#label-dist-val')!.textContent = `${s.distance.toFixed(1)}m`;
    }

    const elevSlider = this.element.querySelector('#slider-elev') as HTMLInputElement;
    if (elevSlider) {
      elevSlider.value = s.elevationOffset.toString();
      this.element.querySelector('#label-elev-val')!.textContent = `${s.elevationOffset >= 0 ? '+' : ''}${s.elevationOffset.toFixed(1)}m`;
    }

    // Look at target chips
    const targetChips = this.element.querySelectorAll('[data-target]');
    targetChips.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-target') === s.lookAtMode);
    });

    // Effects sliders
    const expSlider = this.element.querySelector('#slider-exp') as HTMLInputElement;
    if (expSlider) {
      expSlider.value = s.exposure.toString();
      this.element.querySelector('#label-exp-val')!.textContent = `${s.exposure >= 0 ? '+' : ''}${s.exposure.toFixed(2)} EV`;
    }

    const vigSlider = this.element.querySelector('#slider-vig') as HTMLInputElement;
    if (vigSlider) {
      vigSlider.value = Math.round(s.vignette * 100).toString();
      this.element.querySelector('#label-vig-val')!.textContent = `${Math.round(s.vignette * 100)}%`;
      this.updateVignetteOverlay(s.vignette);
    }

    // Filter chips
    const filterChips = this.element.querySelectorAll('[data-filter]');
    filterChips.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === s.colorGrade);
    });

    // Watermark
    const wmCheck = this.element.querySelector('#check-watermark') as HTMLInputElement;
    if (wmCheck) {
      wmCheck.checked = s.showWatermark;
      this.watermarkPreview.classList.toggle('hidden', !s.showWatermark);
    }

    // Update watermark preview text
    const themeName = this.worldScene?.currentTheme?.displayName || 'Modern District';
    const charId = ProgressionManager.getInstance().getSelectedCharacter();
    const charDef = getCharacterById(charId);
    const charName = charDef?.name || 'Jax';
    const isOnRoof = (this.activePlayer as any)?.supportSurface === 'TRAIN_ROOF' || (this.activePlayer?.groundY || 0) >= 3.5;
    const metaLine = isOnRoof ? `${charName}  |  ${themeName} • Rooftops` : `${charName}  |  ${themeName}`;
    const metaEl = this.element.querySelector('#wm-meta-line');
    if (metaEl) {
      metaEl.textContent = metaLine;
    }

    // Pose chips
    const poseChips = this.element.querySelectorAll('[data-pose]');
    poseChips.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-pose') === s.characterPose);
    });

    // Grid button
    this.element.querySelector('#photo-toggle-grid-btn')?.classList.toggle('active', s.showGrid);
    this.gridOverlay.classList.toggle('hidden', !s.showGrid);
  }

  /**
   * Shutter capture trigger with visual camera flash and preview card.
   */
  private async triggerCapture(): Promise<void> {
    if (!this.activePlayer || !this.worldScene) return;

    // Trigger whiteout shutter flash animation
    this.flashOverlay.classList.remove('shutter-flash-active');
    void this.flashOverlay.offsetWidth; // Force CSS reflow
    this.flashOverlay.classList.add('shutter-flash-active');

    try {
      const themeName = this.worldScene.currentTheme?.displayName || 'Modern District';
      const charId = ProgressionManager.getInstance().getSelectedCharacter();
      const charDef = getCharacterById(charId);
      const charName = charDef?.name || 'Jax';

      const res = await this.controller.captureScreenshot(this.activePlayer, themeName, charName);
      this.displayPreviewModal(res);
    } catch (err) {
      console.error('Failed to capture photo mode screenshot:', err);
    }
  }

  private displayPreviewModal(res: ScreenshotExportResult): void {
    const previewImg = this.element.querySelector('#photo-preview-img') as HTMLImageElement;
    if (previewImg) {
      previewImg.src = res.dataUrl;
    }

    const dimsEl = this.element.querySelector('#photo-preview-dims');
    if (dimsEl) {
      dimsEl.textContent = `${res.width} × ${res.height} • PNG • ${res.filename}`;
    }

    const downloadBtn = this.element.querySelector('#photo-preview-download-btn') as HTMLAnchorElement;
    if (downloadBtn) {
      downloadBtn.href = res.dataUrl;
      downloadBtn.download = res.filename;
    }

    this.previewModal.classList.remove('hidden');
  }

  private closePreviewModal(): void {
    this.previewModal.classList.add('hidden');
  }

  private async copyCurrentScreenshotToClipboard(): Promise<void> {
    const previewImg = this.element.querySelector('#photo-preview-img') as HTMLImageElement;
    const copyBtn = this.element.querySelector('#photo-preview-copy-btn');
    if (!previewImg || !previewImg.src) return;

    try {
      const response = await fetch(previewImg.src);
      const blob = await response.blob();
      if ((navigator.clipboard as any)?.write) {
        await (navigator.clipboard as any).write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        if (copyBtn) {
          copyBtn.innerHTML = '<span class="btn-icon">✅</span> COPIED!';
          setTimeout(() => {
            copyBtn.innerHTML = '<span class="btn-icon">📋</span> COPY IMAGE';
          }, 2000);
        }
      } else {
        alert('Clipboard image copying is not supported in this browser. Please use the Save PNG button.');
      }
    } catch (err) {
      console.warn('Could not copy screenshot to clipboard:', err);
      alert('Image copied/downloaded to your device!');
    }
  }

  /**
   * Keyboard shortcuts for Photo Mode.
   */
  private onKeyDown(e: KeyboardEvent): void {
    if (!this.isVisible) return;

    // If UI is hidden, any key unhides it
    if (this.isUiHidden && e.key !== 'h' && e.key !== 'H') {
      this.setUiHidden(false);
      return;
    }

    const player = this.activePlayer || undefined;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.hide();
        EventBus.getInstance().emit(EVENTS.GAME_PAUSE);
        break;

      case ' ':
      case 'Enter':
        e.preventDefault();
        this.triggerCapture();
        break;

      case 'h':
      case 'H':
        e.preventDefault();
        this.setUiHidden(!this.isUiHidden);
        break;

      case 'g':
      case 'G':
        e.preventDefault();
        this.toggleGrid();
        break;

      case 'r':
      case 'R':
        e.preventDefault();
        this.controller.resetToGameplay(player);
        this.syncUiFromSettings();
        break;

      // Orbit controls
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        this.controller.orbit(-0.06, 0, player);
        this.syncUiFromSettings();
        break;

      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        this.controller.orbit(0.06, 0, player);
        this.syncUiFromSettings();
        break;

      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        this.controller.orbit(0, 0.05, player);
        this.syncUiFromSettings();
        break;

      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        this.controller.orbit(0, -0.05, player);
        this.syncUiFromSettings();
        break;

      // Zoom controls
      case 'q':
      case 'Q':
      case '-':
      case 'Minus':
        e.preventDefault();
        this.controller.zoom(0.35, player);
        this.syncUiFromSettings();
        break;

      case 'e':
      case 'E':
      case '=':
      case '+':
        e.preventDefault();
        this.controller.zoom(-0.35, player);
        this.syncUiFromSettings();
        break;

      // Elevation controls
      case 'PageUp':
        e.preventDefault();
        this.controller.elevate(0.15, player);
        this.syncUiFromSettings();
        break;

      case 'PageDown':
        e.preventDefault();
        this.controller.elevate(-0.15, player);
        this.syncUiFromSettings();
        break;
    }
  }

  /**
   * Pointer down: initiates canvas orbital rotation or elevation pan.
   */
  private onPointerDown(e: PointerEvent): void {
    if (!this.isVisible) return;
    // Don't intercept clicks inside the controls panel or preview modal
    if (this.controlsPanel.contains(e.target as Node) || this.previewModal.contains(e.target as Node)) {
      return;
    }

    if (this.isUiHidden) {
      this.setUiHidden(false);
      return;
    }

    this.isPointerDown = true;
    this.pointerStartX = e.clientX;
    this.pointerStartY = e.clientY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.isAltDrag = e.button === 2 || e.shiftKey; // Right-click or shift-drag
  }

  /**
   * Pointer move: performs responsive orbit drag.
   */
  private onPointerMove(e: PointerEvent): void {
    if (!this.isVisible || !this.isPointerDown) return;

    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;

    const player = this.activePlayer || undefined;

    if (this.isAltDrag) {
      // Elevate camera up / down
      this.controller.elevate(-dy * 0.012, player);
    } else {
      // Orbit azimuth and pitch
      const orbitSpeed = 0.006;
      this.controller.orbit(-dx * orbitSpeed, dy * orbitSpeed, player);
    }

    this.syncUiFromSettings();
  }

  private onPointerUp(e: PointerEvent): void {
    this.isPointerDown = false;
  }

  /**
   * Mouse scroll wheel zoom.
   */
  private onWheel(e: WheelEvent): void {
    if (!this.isVisible) return;
    if (this.controlsPanel.contains(e.target as Node) || this.previewModal.contains(e.target as Node)) {
      return;
    }

    e.preventDefault();
    const zoomDelta = e.deltaY * 0.006;
    this.controller.zoom(zoomDelta, this.activePlayer || undefined);
    this.syncUiFromSettings();
  }

  /**
   * Touch drag & pinch zoom support for mobile devices.
   */
  private onTouchStart(e: TouchEvent): void {
    if (!this.isVisible) return;
    if (this.controlsPanel.contains(e.target as Node) || this.previewModal.contains(e.target as Node)) {
      return;
    }

    this.activeTouchCount = e.touches.length;

    if (e.touches.length === 1) {
      this.lastPointerX = e.touches[0].clientX;
      this.lastPointerY = e.touches[0].clientY;
      this.isPointerDown = true;
    } else if (e.touches.length === 2) {
      // Pinch to zoom initialization
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      this.lastTouchDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.isVisible) return;
    if (this.controlsPanel.contains(e.target as Node) || this.previewModal.contains(e.target as Node)) {
      return;
    }

    e.preventDefault();
    const player = this.activePlayer || undefined;

    if (e.touches.length === 1 && this.isPointerDown) {
      const dx = e.touches[0].clientX - this.lastPointerX;
      const dy = e.touches[0].clientY - this.lastPointerY;
      this.lastPointerX = e.touches[0].clientX;
      this.lastPointerY = e.touches[0].clientY;

      const touchOrbitSpeed = 0.007;
      this.controller.orbit(-dx * touchOrbitSpeed, dy * touchOrbitSpeed, player);
      this.syncUiFromSettings();
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const deltaDist = currentDist - this.lastTouchDistance;
      this.lastTouchDistance = currentDist;

      // Pinch in = zoom in (-distance), spread = zoom out (+distance)
      const pinchZoomSpeed = -0.025;
      this.controller.zoom(deltaDist * pinchZoomSpeed, player);
      this.syncUiFromSettings();
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    this.activeTouchCount = e.touches.length;
    if (e.touches.length === 0) {
      this.isPointerDown = false;
    }
  }
}
