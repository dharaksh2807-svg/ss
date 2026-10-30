import { SoundManager } from '../audio/SoundManager';
import { EventBus, EVENTS } from '../core/EventBus';
import { GraphicsManager, GraphicsPreset, QualityConfig } from '../scene/GraphicsManager';
import { CharacterModel, RunningStyle } from '../player/CharacterModel';
import { ProgressionManager } from '../progression/ProgressionManager';
import { UpgradeManager } from '../player/UpgradeManager';
import { SaveBackupManager } from '../persistence/SaveBackupManager';
import { SaveBackupPackage } from '../persistence/SaveBackupTypes';
import {
  SettingsManager,
  InputAction,
  SwipeSensitivityPreset,
  TouchControlsVisibility,
  TouchControlsLayout,
  TouchControlsSize,
  TouchControlsOpacity,
  CameraShakeLevel,
  CameraMotionLevel,
  CameraDistancePreset,
  SWIPE_PRESET_CONFIGS
} from '../settings/SettingsManager';

export class SettingsModal {
  private element: HTMLElement;
  private closeBtn: HTMLButtonElement;
  private resetAllBtn: HTMLButtonElement | null = null;
  private settingsManager: SettingsManager;
  private graphicsManager: GraphicsManager;
  private backupManager = SaveBackupManager.getInstance();

  // Backup & Restore UI
  private btnExportSave: HTMLButtonElement | null = null;
  private btnTriggerImportSave: HTMLButtonElement | null = null;
  private inputImportFile: HTMLInputElement | null = null;
  private backupLastTime: HTMLElement | null = null;
  private chipCoins: HTMLElement | null = null;
  private chipKeys: HTMLElement | null = null;
  private chipChars: HTMLElement | null = null;
  private chipScore: HTMLElement | null = null;
  private backupFeedbackBanner: HTMLElement | null = null;
  private backupFeedbackIcon: HTMLElement | null = null;
  private backupFeedbackText: HTMLElement | null = null;
  private importPreviewCard: HTMLElement | null = null;
  private previewDateText: HTMLElement | null = null;
  private previewDiffGrid: HTMLElement | null = null;
  private btnCancelImport: HTMLButtonElement | null = null;
  private btnConfirmImport: HTMLButtonElement | null = null;
  private pendingPackageToRestore: SaveBackupPackage | null = null;

  // Tabs
  private tabButtons: NodeListOf<HTMLButtonElement>;
  private tabPanes: NodeListOf<HTMLElement>;

  // Controls Rebinding
  private keyRebindBanner: HTMLElement | null = null;
  private keyRebindMessage: HTMLElement | null = null;
  private keyConflictWarning: HTMLElement | null = null;
  private keyConflictMessage: HTMLElement | null = null;
  private keyBadgeButtons: NodeListOf<HTMLButtonElement>;
  private resetKeysBtn: HTMLButtonElement | null = null;
  private activeListeningAction: InputAction | null = null;
  private activeListeningSlot: number = 0;
  private activeListeningBtn: HTMLButtonElement | null = null;

  // Touch Settings
  private swipeSensitivityButtons: NodeListOf<HTMLButtonElement>;
  private swipeSensitivityDesc: HTMLElement | null = null;
  private touchModeSelect: HTMLSelectElement | null = null;
  private touchLayoutButtons: NodeListOf<HTMLButtonElement>;
  private touchSizeButtons: NodeListOf<HTMLButtonElement>;
  private touchOpacityButtons: NodeListOf<HTMLButtonElement>;

  // Camera Settings
  private cameraShakeButtons: NodeListOf<HTMLButtonElement>;
  private speedLinesCheckbox: HTMLInputElement | null = null;
  private cameraMotionButtons: NodeListOf<HTMLButtonElement>;
  private cameraDistButtons: NodeListOf<HTMLButtonElement>;
  private cameraModeSelect: HTMLSelectElement | null = null;

  // Accessibility Settings
  private reducedMotionCheckbox: HTMLInputElement | null = null;
  private highContrastCheckbox: HTMLInputElement | null = null;
  private visualHazardsCheckbox: HTMLInputElement | null = null;
  private powerupAlertsCheckbox: HTMLInputElement | null = null;

  // Audio & Experience Elements
  private masterSlider: HTMLInputElement;
  private musicSlider: HTMLInputElement;
  private sfxSlider: HTMLInputElement;
  private muteCheckbox: HTMLInputElement | null;
  private reducedIntensityCheckbox: HTMLInputElement | null;
  private qualitySelect: HTMLSelectElement | null;
  private introSelect: HTMLSelectElement | null;
  private facialPortraitCheckbox: HTMLInputElement | null;
  private runningStyleSelect: HTMLSelectElement | null;
  private runningStyleBadgeEl: HTMLElement | null;
  private resolvedBadgeEl: HTMLElement | null;
  private qualityDescEl: HTMLElement | null;
  private showFpsCheckbox: HTMLInputElement | null;
  private presetButtons: NodeListOf<HTMLButtonElement>;

  constructor(private soundManager: SoundManager) {
    this.settingsManager = SettingsManager.getInstance();
    this.graphicsManager = GraphicsManager.getInstance();

    this.element = document.getElementById('settings-modal')!;
    this.closeBtn = document.getElementById('settings-close-btn') as HTMLButtonElement;
    this.resetAllBtn = document.getElementById('settings-reset-all-btn') as HTMLButtonElement | null;

    // Tabs
    this.tabButtons = this.element.querySelectorAll('.settings-tab-btn');
    this.tabPanes = this.element.querySelectorAll('.settings-tab-pane');

    // Controls
    this.keyRebindBanner = document.getElementById('key-rebind-banner');
    this.keyRebindMessage = document.getElementById('key-rebind-message');
    this.keyConflictWarning = document.getElementById('key-conflict-warning');
    this.keyConflictMessage = document.getElementById('key-conflict-message');
    this.keyBadgeButtons = this.element.querySelectorAll('.key-badge-btn');
    this.resetKeysBtn = document.getElementById('btn-reset-keybindings') as HTMLButtonElement | null;

    // Touch
    this.swipeSensitivityButtons = this.element.querySelectorAll('#swipe-sensitivity-selector .segment-btn');
    this.swipeSensitivityDesc = document.getElementById('swipe-sensitivity-desc');
    this.touchModeSelect = document.getElementById('setting-touch-mode') as HTMLSelectElement | null;
    this.touchLayoutButtons = this.element.querySelectorAll('#touch-layout-selector .segment-btn');
    this.touchSizeButtons = this.element.querySelectorAll('#touch-size-selector .segment-btn');
    this.touchOpacityButtons = this.element.querySelectorAll('#touch-opacity-selector .segment-btn');

    // Camera
    this.cameraShakeButtons = this.element.querySelectorAll('#camera-shake-selector .segment-btn');
    this.speedLinesCheckbox = document.getElementById('setting-speed-lines') as HTMLInputElement | null;
    this.cameraMotionButtons = this.element.querySelectorAll('#camera-motion-selector .segment-btn');
    this.cameraDistButtons = this.element.querySelectorAll('#camera-distance-selector .segment-btn');
    this.cameraModeSelect = document.getElementById('setting-camera-mode') as HTMLSelectElement | null;

    // Accessibility
    this.reducedMotionCheckbox = document.getElementById('setting-reduced-motion') as HTMLInputElement | null;
    this.highContrastCheckbox = document.getElementById('setting-high-contrast') as HTMLInputElement | null;
    this.visualHazardsCheckbox = document.getElementById('setting-visual-hazards') as HTMLInputElement | null;
    this.powerupAlertsCheckbox = document.getElementById('setting-powerup-alerts') as HTMLInputElement | null;

    // Audio & Graphics
    this.masterSlider = document.getElementById('setting-master-vol') as HTMLInputElement;
    this.musicSlider = document.getElementById('setting-music-vol') as HTMLInputElement;
    this.sfxSlider = document.getElementById('setting-sfx-vol') as HTMLInputElement;
    this.muteCheckbox = document.getElementById('setting-audio-mute') as HTMLInputElement | null;
    this.reducedIntensityCheckbox = document.getElementById('setting-reduced-intensity') as HTMLInputElement | null;
    this.qualitySelect = document.getElementById('setting-graphics-quality') as HTMLSelectElement | null;
    this.introSelect = document.getElementById('setting-opening-cinematic') as HTMLSelectElement | null;
    this.facialPortraitCheckbox = document.getElementById('setting-facial-portrait') as HTMLInputElement | null;
    this.runningStyleSelect = document.getElementById('setting-running-style') as HTMLSelectElement | null;
    this.runningStyleBadgeEl = document.getElementById('setting-running-style-badge');
    this.resolvedBadgeEl = document.getElementById('setting-graphics-resolved-badge');
    this.qualityDescEl = document.getElementById('setting-graphics-desc');
    this.showFpsCheckbox = document.getElementById('setting-show-fps') as HTMLInputElement | null;
    this.presetButtons = this.element.querySelectorAll('.preset-segment-btn');

    // Backup & Restore Elements
    this.btnExportSave = document.getElementById('btn-export-save') as HTMLButtonElement | null;
    this.btnTriggerImportSave = document.getElementById('btn-trigger-import-save') as HTMLButtonElement | null;
    this.inputImportFile = document.getElementById('input-import-file') as HTMLInputElement | null;
    this.backupLastTime = document.getElementById('backup-last-time');
    this.chipCoins = document.getElementById('chip-coins');
    this.chipKeys = document.getElementById('chip-keys');
    this.chipChars = document.getElementById('chip-chars');
    this.chipScore = document.getElementById('chip-score');
    this.backupFeedbackBanner = document.getElementById('backup-feedback-banner');
    this.backupFeedbackIcon = document.getElementById('backup-feedback-icon');
    this.backupFeedbackText = document.getElementById('backup-feedback-text');
    this.importPreviewCard = document.getElementById('import-preview-card');
    this.previewDateText = document.getElementById('preview-date-text');
    this.previewDiffGrid = document.getElementById('preview-diff-grid');
    this.btnCancelImport = document.getElementById('btn-cancel-import') as HTMLButtonElement | null;
    this.btnConfirmImport = document.getElementById('btn-confirm-import') as HTMLButtonElement | null;

    this.setupListeners();
    this.refreshAllUI();
  }

  private setupListeners(): void {
    // Modal Close
    this.closeBtn.addEventListener('click', () => this.hide());
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) this.hide();
    });

    // Reset All Defaults
    if (this.resetAllBtn) {
      this.resetAllBtn.addEventListener('click', () => {
        this.settingsManager.resetAllToDefaults();
        this.refreshAllUI();
        this.showConflictNotice('✓ All settings reset to original defaults.', false);
      });
    }

    // Tab Navigation
    this.setupTabs();

    // 1. Controls Listeners
    this.setupKeyboardRebinding();

    // 2. Touch Listeners
    this.setupTouchSettings();

    // 3. Camera Listeners
    this.setupCameraSettings();

    // 4. Accessibility Listeners
    this.setupAccessibilitySettings();

    // 5. Audio & Graphics Listeners
    this.setupAudioAndGraphicsSettings();

    // 6. Backup & Restore Listeners
    this.setupBackupRestore();

    // External EventBus Sync
    EventBus.getInstance().on('OPEN_SETTINGS', () => this.show());
    EventBus.getInstance().on(EVENTS.RUNNING_STYLE_CHANGED, () => {
      this.refreshRunningStyleUI();
    });
    EventBus.getInstance().on('GRAPHICS_CONFIG_CHANGED', (config: QualityConfig) => {
      this.updateResolvedBadge(config);
    });
    EventBus.getInstance().on(EVENTS.AUDIO_SETTINGS_CHANGED, () => {
      this.refreshAudioUI();
    });
  }

  // --- TAB NAVIGATION ---

  private setupTabs(): void {
    this.tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetTabId = btn.getAttribute('data-tab');
        if (targetTabId) {
          this.switchTab(targetTabId);
        }
      });
    });
  }

  public switchTab(targetTabId: string): void {
    this.tabButtons.forEach((btn) => {
      const isTarget = btn.getAttribute('data-tab') === targetTabId;
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    this.tabPanes.forEach((pane) => {
      const isTarget = pane.id === targetTabId;
      pane.classList.toggle('active', isTarget);
    });

    // If switching tabs while rebinding was active, cancel rebinding safely
    if (this.activeListeningAction) {
      this.stopListeningForKey();
    }
  }

  // --- KEYBOARD REBINDING ---

  private setupKeyboardRebinding(): void {
    this.keyBadgeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action') as InputAction;
        const slot = parseInt(btn.getAttribute('data-slot') || '0', 10);
        if (action) {
          this.startListeningForKey(action, slot, btn);
        }
      });
    });

    window.addEventListener('keydown', (e) => {
      // If modal is hidden, ignore
      if (this.element.classList.contains('hidden')) return;

      // Handle active rebinding
      if (this.activeListeningAction) {
        e.preventDefault();
        e.stopPropagation();

        if (e.key === 'Escape') {
          this.stopListeningForKey();
          return;
        }

        const newKey = e.code;
        const action = this.activeListeningAction;
        const slot = this.activeListeningSlot;

        // Check conflict first
        const conflict = this.settingsManager.checkKeyConflict(action, newKey);
        const result = this.settingsManager.rebindKey(action, newKey, slot);

        if (conflict.conflict && conflict.conflictingAction) {
          this.showConflictNotice(
            `⚠️ Moved "${this.formatKeyDisplay(newKey)}" from ${this.formatActionName(conflict.conflictingAction)} to ${this.formatActionName(action)} to prevent duplicate conflicting triggers.`,
            true
          );
        } else {
          this.showConflictNotice(`✓ Assigned "${this.formatKeyDisplay(newKey)}" to ${this.formatActionName(action)}.`, false);
        }

        this.stopListeningForKey();
        this.refreshKeyBindingsUI();
        return;
      }

      // Close modal on Escape if not rebinding
      if (e.key === 'Escape') {
        this.hide();
      }
    });

    if (this.resetKeysBtn) {
      this.resetKeysBtn.addEventListener('click', () => {
        this.settingsManager.resetKeyBindings();
        this.refreshKeyBindingsUI();
        this.showConflictNotice('✓ Keyboard controls reset to defaults.', false);
      });
    }
  }

  private startListeningForKey(action: InputAction, slot: number, btn: HTMLButtonElement): void {
    this.stopListeningForKey();

    this.activeListeningAction = action;
    this.activeListeningSlot = slot;
    this.activeListeningBtn = btn;

    btn.classList.add('key-listening');
    btn.textContent = '...';

    if (this.keyRebindBanner && this.keyRebindMessage) {
      this.keyRebindMessage.innerHTML = `Press any key to assign to <strong>${this.formatActionName(action)}</strong>... <span class="rebind-hint">(Press ESC to cancel)</span>`;
      this.keyRebindBanner.classList.remove('hidden');
    }
  }

  private stopListeningForKey(): void {
    if (this.activeListeningBtn) {
      this.activeListeningBtn.classList.remove('key-listening');
      this.activeListeningBtn = null;
    }
    this.activeListeningAction = null;
    this.activeListeningSlot = 0;

    if (this.keyRebindBanner) {
      this.keyRebindBanner.classList.add('hidden');
    }
  }

  private showConflictNotice(message: string, isWarning: boolean): void {
    if (!this.keyConflictWarning || !this.keyConflictMessage) return;

    this.keyConflictMessage.textContent = message;
    this.keyConflictWarning.classList.remove('hidden');
    this.keyConflictWarning.classList.toggle('is-warning', isWarning);
    this.keyConflictWarning.classList.toggle('is-success', !isWarning);

    setTimeout(() => {
      this.keyConflictWarning?.classList.add('hidden');
    }, 4500);
  }

  public formatKeyDisplay(code: string): string {
    if (!code) return '—';
    if (code.startsWith('Key')) return code.substring(3);
    if (code.startsWith('Digit')) return code.substring(5);
    if (code === 'ArrowLeft') return '←';
    if (code === 'ArrowRight') return '→';
    if (code === 'ArrowUp') return '↑';
    if (code === 'ArrowDown') return '↓';
    if (code === 'Space') return 'SPACE';
    if (code === 'Escape') return 'ESC';
    if (code === 'Enter') return 'ENTER';
    if (code === 'ShiftLeft' || code === 'ShiftRight') return 'SHIFT';
    if (code === 'ControlLeft' || code === 'ControlRight') return 'CTRL';
    if (code === 'AltLeft' || code === 'AltRight') return 'ALT';
    return code;
  }

  private formatActionName(action: InputAction): string {
    switch (action) {
      case 'LEFT': return 'Move Left';
      case 'RIGHT': return 'Move Right';
      case 'UP': return 'Jump';
      case 'DOWN': return 'Slide / Fast Drop';
      case 'ACTION': return 'Hoverboard';
      case 'PAUSE': return 'Pause Game';
    }
  }

  private refreshKeyBindingsUI(): void {
    const bindings = this.settingsManager.getKeyBindings();

    this.keyBadgeButtons.forEach((btn) => {
      const action = btn.getAttribute('data-action') as InputAction;
      const slot = parseInt(btn.getAttribute('data-slot') || '0', 10);
      if (action && bindings[action]) {
        const keys = bindings[action];
        const assignedKey = keys[slot];
        btn.textContent = assignedKey ? this.formatKeyDisplay(assignedKey) : '—';
      }
    });
  }

  // --- TOUCH SETTINGS ---

  private setupTouchSettings(): void {
    // Swipe sensitivity presets
    this.swipeSensitivityButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset') as SwipeSensitivityPreset;
        if (preset) {
          this.settingsManager.setSwipeSensitivity(preset);
          this.refreshTouchUI();
        }
      });
    });

    // Touch controls display mode
    if (this.touchModeSelect) {
      this.touchModeSelect.addEventListener('change', () => {
        this.settingsManager.setTouchControlsMode(this.touchModeSelect!.value as TouchControlsVisibility);
      });
    }

    // Touch layout preset
    this.touchLayoutButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const layout = btn.getAttribute('data-layout') as TouchControlsLayout;
        if (layout) {
          this.settingsManager.setTouchControlsLayout(layout);
          this.refreshTouchUI();
        }
      });
    });

    // Touch button size
    this.touchSizeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const size = btn.getAttribute('data-size') as TouchControlsSize;
        if (size) {
          this.settingsManager.setTouchControlsSize(size);
          this.refreshTouchUI();
        }
      });
    });

    // Touch opacity
    this.touchOpacityButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const opacity = parseInt(btn.getAttribute('data-opacity') || '60', 10) as TouchControlsOpacity;
        if (opacity) {
          this.settingsManager.setTouchControlsOpacity(opacity);
          this.refreshTouchUI();
        }
      });
    });
  }

  private refreshTouchUI(): void {
    const state = this.settingsManager.getState();

    // Swipe sensitivity
    this.swipeSensitivityButtons.forEach((btn) => {
      const preset = btn.getAttribute('data-preset');
      btn.classList.toggle('active', preset === state.swipeSensitivity);
    });
    if (this.swipeSensitivityDesc) {
      const config = SWIPE_PRESET_CONFIGS[state.swipeSensitivity];
      this.swipeSensitivityDesc.textContent = `${config.label}: Responsive swipe sampling with strict 1.25x diagonal locking.`;
    }

    // Touch display select
    if (this.touchModeSelect) {
      this.touchModeSelect.value = state.touchControlsMode;
    }

    // Layout
    this.touchLayoutButtons.forEach((btn) => {
      const layout = btn.getAttribute('data-layout');
      btn.classList.toggle('active', layout === state.touchControlsLayout);
    });

    // Size
    this.touchSizeButtons.forEach((btn) => {
      const size = btn.getAttribute('data-size');
      btn.classList.toggle('active', size === state.touchControlsSize);
    });

    // Opacity
    this.touchOpacityButtons.forEach((btn) => {
      const opacity = parseInt(btn.getAttribute('data-opacity') || '0', 10);
      btn.classList.toggle('active', opacity === state.touchControlsOpacity);
    });
  }

  // --- CAMERA SETTINGS ---

  private setupCameraSettings(): void {
    // Camera shake
    this.cameraShakeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const shake = btn.getAttribute('data-shake') as CameraShakeLevel;
        if (shake) {
          this.settingsManager.setCameraShake(shake);
          this.refreshCameraUI();
        }
      });
    });

    // Speed lines
    if (this.speedLinesCheckbox) {
      this.speedLinesCheckbox.addEventListener('change', () => {
        this.settingsManager.setSpeedLines(this.speedLinesCheckbox!.checked);
      });
    }

    // Camera motion
    this.cameraMotionButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const motion = btn.getAttribute('data-motion') as CameraMotionLevel;
        if (motion) {
          this.settingsManager.setCameraMotion(motion);
          this.refreshCameraUI();
        }
      });
    });

    // Camera distance
    this.cameraDistButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const dist = btn.getAttribute('data-dist') as CameraDistancePreset;
        if (dist) {
          this.settingsManager.setCameraDistance(dist);
          this.refreshCameraUI();
        }
      });
    });

    // Camera mode
    if (this.cameraModeSelect) {
      this.cameraModeSelect.addEventListener('change', () => {
        const mode = this.cameraModeSelect!.value as 'CLASSIC' | 'CHARACTER_FOCUS';
        this.settingsManager.setCameraMode(mode);
        localStorage.setItem('metro_camera_mode', mode);
      });
    }
  }

  private refreshCameraUI(): void {
    const state = this.settingsManager.getState();

    // Shake
    this.cameraShakeButtons.forEach((btn) => {
      const shake = btn.getAttribute('data-shake');
      btn.classList.toggle('active', shake === state.cameraShake);
    });

    // Speed lines
    if (this.speedLinesCheckbox) {
      this.speedLinesCheckbox.checked = state.speedLines;
    }

    // Motion
    this.cameraMotionButtons.forEach((btn) => {
      const motion = btn.getAttribute('data-motion');
      btn.classList.toggle('active', motion === state.cameraMotion);
    });

    // Distance
    this.cameraDistButtons.forEach((btn) => {
      const dist = btn.getAttribute('data-dist');
      btn.classList.toggle('active', dist === state.cameraDistance);
    });

    // Camera mode
    if (this.cameraModeSelect) {
      this.cameraModeSelect.value = state.cameraMode;
    }
  }

  // --- ACCESSIBILITY SETTINGS ---

  private setupAccessibilitySettings(): void {
    if (this.reducedMotionCheckbox) {
      this.reducedMotionCheckbox.addEventListener('change', () => {
        const enabled = this.reducedMotionCheckbox!.checked;
        this.settingsManager.setReducedMotion(enabled);
        this.refreshCameraUI();
      });
    }

    if (this.highContrastCheckbox) {
      this.highContrastCheckbox.addEventListener('change', () => {
        this.settingsManager.setHighContrastObstacles(this.highContrastCheckbox!.checked);
      });
    }

    if (this.visualHazardsCheckbox) {
      this.visualHazardsCheckbox.addEventListener('change', () => {
        this.settingsManager.setVisualHazardCues(this.visualHazardsCheckbox!.checked);
      });
    }

    if (this.powerupAlertsCheckbox) {
      this.powerupAlertsCheckbox.addEventListener('change', () => {
        this.settingsManager.setPowerupAlerts(this.powerupAlertsCheckbox!.checked);
      });
    }
  }

  private refreshAccessibilityUI(): void {
    const state = this.settingsManager.getState();

    if (this.reducedMotionCheckbox) {
      this.reducedMotionCheckbox.checked = state.reducedMotion;
    }
    if (this.highContrastCheckbox) {
      this.highContrastCheckbox.checked = state.highContrastObstacles;
    }
    if (this.visualHazardsCheckbox) {
      this.visualHazardsCheckbox.checked = state.visualHazardCues;
    }
    if (this.powerupAlertsCheckbox) {
      this.powerupAlertsCheckbox.checked = state.powerupAlerts;
    }
  }

  // --- AUDIO & GRAPHICS ---

  private setupAudioAndGraphicsSettings(): void {
    this.masterSlider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.soundManager.setMasterVolume(val);
    });

    this.musicSlider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.soundManager.setMusicVolume(val);
    });

    this.sfxSlider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.soundManager.setSfxVolume(val);
    });

    if (this.muteCheckbox) {
      this.muteCheckbox.addEventListener('change', () => {
        this.soundManager.setMuted(this.muteCheckbox!.checked);
      });
    }

    if (this.reducedIntensityCheckbox) {
      this.reducedIntensityCheckbox.addEventListener('change', () => {
        this.soundManager.setReducedIntensity(this.reducedIntensityCheckbox!.checked);
      });
    }

    this.presetButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset') as GraphicsPreset;
        if (preset) {
          this.graphicsManager.setPreset(preset, true);
          this.refreshGraphicsUI();
        }
      });
    });

    if (this.qualitySelect) {
      this.qualitySelect.addEventListener('change', () => {
        const preset = this.qualitySelect!.value as GraphicsPreset;
        this.graphicsManager.setPreset(preset, true);
        this.refreshGraphicsUI();
      });
    }

    if (this.showFpsCheckbox) {
      this.showFpsCheckbox.checked = this.graphicsManager.isFpsDisplayEnabled();
      this.showFpsCheckbox.addEventListener('change', () => {
        this.graphicsManager.setFpsDisplayEnabled(this.showFpsCheckbox!.checked);
      });
    }

    if (this.introSelect) {
      const savedIntro = localStorage.getItem('metro_opening_cinematic') || 'FIRST_ONLY';
      this.introSelect.value = savedIntro;
      this.introSelect.addEventListener('change', () => {
        const pref = this.introSelect!.value as 'FIRST_ONLY' | 'ALWAYS' | 'DISABLED';
        this.settingsManager.setOpeningCinematic(pref);
      });
    }

    if (this.facialPortraitCheckbox) {
      const savedPortrait = localStorage.getItem('metro_portrait_enabled') !== 'false';
      this.facialPortraitCheckbox.checked = savedPortrait;
      this.facialPortraitCheckbox.addEventListener('change', () => {
        const enabled = this.facialPortraitCheckbox!.checked;
        this.settingsManager.setFacialPortrait(enabled);
      });
    }

    if (this.runningStyleSelect) {
      const savedStyle = localStorage.getItem('metro_running_style') || 'CLASSIC';
      this.runningStyleSelect.value = savedStyle;
      this.updateRunningStyleBadge(savedStyle);
      this.runningStyleSelect.addEventListener('change', () => {
        const style = this.runningStyleSelect!.value as RunningStyle;
        this.settingsManager.setRunningStyle(style);
        const equippedChar = ProgressionManager.getInstance().getSelectedCharacter();
        CharacterModel.setRunningStyleForCharacter(equippedChar, style);
        this.updateRunningStyleBadge(style);
        EventBus.getInstance().emit(EVENTS.RUNNING_STYLE_CHANGED, style);
      });
    }
  }

  private refreshRunningStyleUI(): void {
    if (this.runningStyleSelect) {
      const style = localStorage.getItem('metro_running_style') || 'CLASSIC';
      this.runningStyleSelect.value = style;
      this.updateRunningStyleBadge(style);
    }
  }

  private updateRunningStyleBadge(style: string): void {
    if (this.runningStyleBadgeEl) {
      if (style === 'REVERSE') {
        this.runningStyleBadgeEl.textContent = '🕺 Facing Player (Front)';
        this.runningStyleBadgeEl.style.color = '#ff9100';
        this.runningStyleBadgeEl.style.borderColor = 'rgba(255, 145, 0, 0.4)';
        this.runningStyleBadgeEl.style.background = 'rgba(255, 145, 0, 0.18)';
      } else {
        this.runningStyleBadgeEl.textContent = '🏃 Rear Chase (Default)';
        this.runningStyleBadgeEl.style.color = '#00e5ff';
        this.runningStyleBadgeEl.style.borderColor = 'rgba(0, 176, 255, 0.4)';
        this.runningStyleBadgeEl.style.background = 'rgba(0, 176, 255, 0.18)';
      }
    }
  }

  private refreshAudioUI(): void {
    const prefs = this.soundManager.getPreferences();
    this.masterSlider.value = prefs.masterVolume.toString();
    this.musicSlider.value = prefs.musicVolume.toString();
    this.sfxSlider.value = prefs.sfxVolume.toString();
    if (this.muteCheckbox) {
      this.muteCheckbox.checked = prefs.isMuted;
    }
    if (this.reducedIntensityCheckbox) {
      this.reducedIntensityCheckbox.checked = prefs.reducedIntensity;
    }
  }

  private refreshGraphicsUI(): void {
    const preset = this.graphicsManager.getPreset();
    const config = this.graphicsManager.getActiveConfig();

    this.presetButtons.forEach((btn) => {
      const btnPreset = btn.getAttribute('data-preset');
      btn.classList.toggle('active', btnPreset === preset);
    });

    if (this.qualitySelect) {
      this.qualitySelect.value = preset;
    }

    this.updateResolvedBadge(config);

    if (this.showFpsCheckbox) {
      this.showFpsCheckbox.checked = this.graphicsManager.isFpsDisplayEnabled();
    }
  }

  private updateResolvedBadge(config: QualityConfig): void {
    if (this.resolvedBadgeEl) {
      const preset = this.graphicsManager.getPreset();
      if (preset === 'AUTO') {
        this.resolvedBadgeEl.textContent = `Auto (${config.resolved})`;
        this.resolvedBadgeEl.className = `quality-resolved-badge auto-badge tier-${config.resolved.toLowerCase()}`;
      } else {
        this.resolvedBadgeEl.textContent = `${config.resolved}`;
        this.resolvedBadgeEl.className = `quality-resolved-badge manual-badge tier-${config.resolved.toLowerCase()}`;
      }
    }

    if (this.qualityDescEl) {
      this.qualityDescEl.textContent = config.description;
    }
  }

  public refreshAllUI(): void {
    this.refreshKeyBindingsUI();
    this.refreshTouchUI();
    this.refreshCameraUI();
    this.refreshAccessibilityUI();
    this.refreshAudioUI();
    this.refreshGraphicsUI();
    this.refreshRunningStyleUI();
    this.refreshBackupUI();
    if (this.introSelect) {
      this.introSelect.value = localStorage.getItem('metro_opening_cinematic') || 'FIRST_ONLY';
    }
  }

  // --- BACKUP & RESTORE ---

  private setupBackupRestore(): void {
    if (this.btnExportSave) {
      this.btnExportSave.addEventListener('click', () => {
        try {
          const res = this.backupManager.downloadBackupFile();
          this.refreshBackupUI();
          this.showBackupFeedback(`✓ Exported ${res.filename} successfully. Keep it in a safe place!`, 'success');
        } catch (e: any) {
          this.showBackupFeedback(`❌ Export failed: ${e.message || 'Unknown error'}`, 'error');
        }
      });
    }

    if (this.btnTriggerImportSave && this.inputImportFile) {
      this.btnTriggerImportSave.addEventListener('click', () => {
        this.inputImportFile?.click();
      });

      this.inputImportFile.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          const content = reader.result as string;
          const validation = this.backupManager.parseAndValidateSave(content, file.name, file.size);

          if (!validation.valid || !validation.package) {
            this.pendingPackageToRestore = null;
            if (this.importPreviewCard) this.importPreviewCard.classList.add('hidden');
            const errStr = validation.errors.join(' ') || 'Save file is invalid or corrupted.';
            this.showBackupFeedback(`❌ Import rejected: ${errStr}`, 'error');
            return;
          }

          this.pendingPackageToRestore = validation.package;
          this.renderImportPreview(validation.package, validation.warnings);
          this.showBackupFeedback(
            `Save backup file verified. Review comparison below and confirm restoration.`,
            'info'
          );
        };
        reader.onerror = () => {
          this.showBackupFeedback('❌ Failed to read selected backup file.', 'error');
        };
        reader.readAsText(file);
        target.value = '';
      });
    }

    if (this.btnCancelImport) {
      this.btnCancelImport.addEventListener('click', () => {
        this.pendingPackageToRestore = null;
        if (this.importPreviewCard) this.importPreviewCard.classList.add('hidden');
        this.showBackupFeedback('Import cancelled. Current progress untouched.', 'info');
      });
    }

    if (this.btnConfirmImport) {
      this.btnConfirmImport.addEventListener('click', () => {
        this.handleConfirmRestore();
      });
    }
  }

  private renderImportPreview(pkg: SaveBackupPackage, warnings: string[]): void {
    if (!this.importPreviewCard || !this.previewDiffGrid) return;

    const preview = this.backupManager.generatePreview(pkg);

    if (this.previewDateText) {
      const d = new Date(preview.timestamp);
      const dateStr = isNaN(d.getTime()) ? preview.timestamp : d.toLocaleString();
      this.previewDateText.textContent = `Backup Date: ${dateStr} (v${preview.backupVersion})`;
    }

    const coinsDiff = preview.backupCoins - preview.currentCoins;
    const coinsDiffClass = coinsDiff >= 0 ? 'pos' : 'neg';
    const coinsDiffText = coinsDiff >= 0 ? `+${coinsDiff.toLocaleString()}` : `${coinsDiff.toLocaleString()}`;

    const scoreDiff = preview.backupScore - preview.currentScore;
    const scoreDiffClass = scoreDiff >= 0 ? 'pos' : 'neg';
    const scoreDiffText = scoreDiff >= 0 ? `+${scoreDiff.toLocaleString()}` : `${scoreDiff.toLocaleString()}`;

    this.previewDiffGrid.innerHTML = `
      <div class="diff-box">
        <span class="diff-label">COINS</span>
        <span class="diff-value">🪙 ${preview.backupCoins.toLocaleString()}</span>
        <span class="diff-delta ${coinsDiffClass}">${coinsDiffText} vs Current</span>
      </div>
      <div class="diff-box">
        <span class="diff-label">KEYS</span>
        <span class="diff-value">🔑 ${preview.backupKeys}</span>
        <span class="diff-delta">Current: ${preview.currentKeys}</span>
      </div>
      <div class="diff-box">
        <span class="diff-label">CHARACTERS</span>
        <span class="diff-value">🏃 ${preview.backupCharsCount} Unlocked</span>
        <span class="diff-delta">Current: ${preview.currentCharsCount}</span>
      </div>
      <div class="diff-box">
        <span class="diff-label">HIGH SCORE</span>
        <span class="diff-value">🏆 ${preview.backupScore.toLocaleString()}</span>
        <span class="diff-delta ${scoreDiffClass}">${scoreDiffText}</span>
      </div>
      <div class="diff-box">
        <span class="diff-label">UPGRADES</span>
        <span class="diff-value">⚡ ${preview.upgradesCount} Configured</span>
        <span class="diff-delta">Settings Included: ${preview.hasSettings ? 'Yes' : 'No'}</span>
      </div>
    `;

    this.importPreviewCard.classList.remove('hidden');
    setTimeout(() => {
      this.importPreviewCard?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  }

  private handleConfirmRestore(): void {
    if (!this.pendingPackageToRestore) return;

    const res = this.backupManager.restoreSave(this.pendingPackageToRestore);
    if (res.success) {
      this.pendingPackageToRestore = null;
      if (this.importPreviewCard) this.importPreviewCard.classList.add('hidden');
      this.refreshAllUI();
      this.showBackupFeedback('✓ Progress successfully restored from backup! (Rollback snapshot preserved)', 'success');
    } else {
      this.showBackupFeedback(`❌ Restoration failed and was rolled back: ${res.error}`, 'error');
    }
  }

  private showBackupFeedback(msg: string, type: 'success' | 'error' | 'info'): void {
    if (!this.backupFeedbackBanner || !this.backupFeedbackText || !this.backupFeedbackIcon) return;

    this.backupFeedbackBanner.className = `backup-feedback-banner feedback-${type}`;
    this.backupFeedbackText.textContent = msg;

    if (type === 'success') {
      this.backupFeedbackIcon.textContent = '✓';
    } else if (type === 'error') {
      this.backupFeedbackIcon.textContent = '❌';
    } else {
      this.backupFeedbackIcon.textContent = 'ℹ️';
    }

    this.backupFeedbackBanner.classList.remove('hidden');
  }

  private refreshBackupUI(): void {
    const progressionMgr = ProgressionManager.getInstance();
    const upgradeMgr = UpgradeManager.getInstance();

    const state = progressionMgr.getState();
    const coins = upgradeMgr.getCoins();
    const keys = progressionMgr.getKeys();
    const charsCount = state.unlockedCharacters?.length || 1;
    const bestScore = state.lifetimeStats?.bestScore || 0;

    if (this.chipCoins) this.chipCoins.textContent = coins.toLocaleString();
    if (this.chipKeys) this.chipKeys.textContent = keys.toString();
    if (this.chipChars) this.chipChars.textContent = charsCount.toString();
    if (this.chipScore) this.chipScore.textContent = bestScore.toLocaleString();

    if (this.backupLastTime) {
      const info = this.backupManager.getLastBackupInfo();
      this.backupLastTime.textContent = info.formatted;
    }
  }

  public show(): void {
    this.refreshAllUI();
    this.element.classList.remove('hidden');
  }

  public hide(): void {
    this.stopListeningForKey();
    this.element.classList.add('hidden');
  }
}
