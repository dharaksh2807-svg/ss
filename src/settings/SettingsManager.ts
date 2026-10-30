import { EventBus } from '../core/EventBus';

export type SwipeSensitivityPreset = 'LOW' | 'NORMAL' | 'HIGH';
export type TouchControlsVisibility = 'AUTO' | 'ALWAYS' | 'DISABLED';
export type TouchControlsLayout = 'BOTTOM_CENTER' | 'SPLIT_THUMB' | 'BOTTOM_WIDE';
export type TouchControlsSize = 'NORMAL' | 'LARGE';
export type TouchControlsOpacity = 30 | 60 | 90;

export type CameraShakeLevel = 'OFF' | 'LOW' | 'NORMAL';
export type CameraMotionLevel = 'REDUCED' | 'NORMAL';
export type CameraDistancePreset = 'CLOSE' | 'DEFAULT' | 'FAR';

export type InputAction = 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'ACTION' | 'PAUSE';

export interface KeyBindings {
  LEFT: string[];
  RIGHT: string[];
  UP: string[];
  DOWN: string[];
  ACTION: string[];
  PAUSE: string[];
}

export interface SettingsState {
  version: number;

  // 1. Keyboard Controls
  keyBindings: KeyBindings;

  // 2. Mobile Swipe
  swipeSensitivity: SwipeSensitivityPreset;
  swipeMinDistancePx: number;
  swipeMaxIntervalMs: number;

  // 3. Touch Controls
  touchControlsMode: TouchControlsVisibility;
  touchControlsLayout: TouchControlsLayout;
  touchControlsSize: TouchControlsSize;
  touchControlsOpacity: TouchControlsOpacity;

  // 4. Camera & Comfort
  cameraShake: CameraShakeLevel;
  speedLines: boolean;
  cameraMotion: CameraMotionLevel;
  cameraDistance: CameraDistancePreset;
  cameraMode: 'CLASSIC' | 'CHARACTER_FOCUS';

  // 5. Accessibility
  reducedMotion: boolean;
  highContrastObstacles: boolean;
  visualHazardCues: boolean;
  powerupAlerts: boolean;

  // 6. Audio & Experience (Preserved from existing settings)
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  reducedIntensity: boolean;
  openingCinematic: 'FIRST_ONLY' | 'ALWAYS' | 'DISABLED';
  runningStyle: 'CLASSIC' | 'REVERSE';
  facialPortrait: boolean;
  showFps: boolean;
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  LEFT: ['ArrowLeft', 'KeyA'],
  RIGHT: ['ArrowRight', 'KeyD'],
  UP: ['ArrowUp', 'KeyW', 'Space'],
  DOWN: ['ArrowDown', 'KeyS'],
  ACTION: ['KeyE', 'KeyB'],
  PAUSE: ['Escape', 'KeyP']
};

export const SWIPE_PRESET_CONFIGS: Record<SwipeSensitivityPreset, { minDistance: number; maxInterval: number; label: string }> = {
  LOW: { minDistance: 42, maxInterval: 350, label: 'Low (Firm Swipes, 42px)' },
  NORMAL: { minDistance: 26, maxInterval: 400, label: 'Normal (Standard, 26px)' },
  HIGH: { minDistance: 16, maxInterval: 450, label: 'High (Quick Flick, 16px)' }
};

export const CAMERA_DISTANCE_OFFSETS: Record<CameraDistancePreset, number> = {
  CLOSE: -0.4,   // 5.2m
  DEFAULT: 0.0,  // 5.6m
  FAR: 0.6       // 6.2m
};

const STORAGE_KEY = 'metro_settings_v2';

export class SettingsManager {
  private static instance: SettingsManager | null = null;
  private state: SettingsState;
  private eventBus = EventBus.getInstance();

  private constructor() {
    this.state = this.loadState();
    this.applyGlobalSideEffects();
  }

  public static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  public getState(): Readonly<SettingsState> {
    return this.state;
  }

  // --- Keyboard Customization ---

  public getKeyBindings(): KeyBindings {
    return JSON.parse(JSON.stringify(this.state.keyBindings));
  }

  public getKeysForAction(action: InputAction): string[] {
    return [...(this.state.keyBindings[action] || [])];
  }

  /**
   * Checks if assigning a key to targetAction conflicts with any other core action.
   */
  public checkKeyConflict(targetAction: InputAction, key: string): { conflict: boolean; conflictingAction?: InputAction } {
    const formattedKey = this.formatKeyCode(key);
    for (const actionKey of Object.keys(this.state.keyBindings) as InputAction[]) {
      if (actionKey === targetAction) continue;
      const keys = this.state.keyBindings[actionKey] || [];
      if (keys.includes(formattedKey)) {
        return { conflict: true, conflictingAction: actionKey };
      }
    }
    return { conflict: false };
  }

  /**
   * Rebinds key for action.
   * If replaceIndex is provided, replaces that specific slot; otherwise appends or swaps.
   * Removes the key from any conflicting action automatically to prevent dual-trigger bugs.
   */
  public rebindKey(action: InputAction, newKey: string, slotIndex: number = 0): { success: boolean; conflictRemovedFrom?: InputAction } {
    if (!newKey) return { success: false };
    const formattedKey = this.formatKeyCode(newKey);

    let conflictRemovedFrom: InputAction | undefined;

    // Check conflict and remove from conflicting action
    for (const actionKey of Object.keys(this.state.keyBindings) as InputAction[]) {
      if (actionKey === action) continue;
      const existingKeys = this.state.keyBindings[actionKey] || [];
      const conflictIdx = existingKeys.indexOf(formattedKey);
      if (conflictIdx !== -1) {
        existingKeys.splice(conflictIdx, 1);
        this.state.keyBindings[actionKey] = existingKeys;
        conflictRemovedFrom = actionKey;
      }
    }

    const currentKeys = this.state.keyBindings[action] || [];
    if (slotIndex >= 0 && slotIndex < currentKeys.length) {
      currentKeys[slotIndex] = formattedKey;
    } else {
      if (!currentKeys.includes(formattedKey)) {
        currentKeys.push(formattedKey);
      }
    }
    this.state.keyBindings[action] = currentKeys;
    this.saveState();

    this.eventBus.emit('KEY_BINDINGS_CHANGED', this.state.keyBindings);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);

    return { success: true, conflictRemovedFrom };
  }

  public resetKeyBindings(): void {
    this.state.keyBindings = JSON.parse(JSON.stringify(DEFAULT_KEY_BINDINGS));
    this.saveState();
    this.eventBus.emit('KEY_BINDINGS_CHANGED', this.state.keyBindings);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  public resolveKeyToAction(keyCode: string): InputAction | null {
    for (const [action, keys] of Object.entries(this.state.keyBindings) as [InputAction, string[]][]) {
      if (keys.includes(keyCode)) {
        return action;
      }
    }
    return null;
  }

  // --- Mobile Swipe Sensitivity ---

  public setSwipeSensitivity(preset: SwipeSensitivityPreset): void {
    this.state.swipeSensitivity = preset;
    const config = SWIPE_PRESET_CONFIGS[preset];
    this.state.swipeMinDistancePx = config.minDistance;
    this.state.swipeMaxIntervalMs = config.maxInterval;
    this.saveState();
    this.eventBus.emit('SWIPE_SETTINGS_CHANGED', {
      preset,
      minDistance: config.minDistance,
      maxInterval: config.maxInterval
    });
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  // --- Touch Controls Settings ---

  public setTouchControlsMode(mode: TouchControlsVisibility): void {
    this.state.touchControlsMode = mode;
    this.saveState();
    this.applyTouchControlsDOM();
    this.eventBus.emit('TOUCH_SETTINGS_CHANGED', this.state);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  public setTouchControlsLayout(layout: TouchControlsLayout): void {
    this.state.touchControlsLayout = layout;
    this.saveState();
    this.applyTouchControlsDOM();
    this.eventBus.emit('TOUCH_SETTINGS_CHANGED', this.state);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  public setTouchControlsSize(size: TouchControlsSize): void {
    this.state.touchControlsSize = size;
    this.saveState();
    this.applyTouchControlsDOM();
    this.eventBus.emit('TOUCH_SETTINGS_CHANGED', this.state);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  public setTouchControlsOpacity(opacity: TouchControlsOpacity): void {
    this.state.touchControlsOpacity = opacity;
    this.saveState();
    this.applyTouchControlsDOM();
    this.eventBus.emit('TOUCH_SETTINGS_CHANGED', this.state);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  // --- Camera Comfort Settings ---

  public setCameraShake(level: CameraShakeLevel): void {
    this.state.cameraShake = level;
    this.saveState();
    this.eventBus.emit('CAMERA_SHAKE_CHANGED', level);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  public setSpeedLines(enabled: boolean): void {
    this.state.speedLines = enabled;
    this.saveState();
    this.eventBus.emit('SPEED_LINES_CHANGED', enabled);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  public setCameraMotion(level: CameraMotionLevel): void {
    this.state.cameraMotion = level;
    this.saveState();
    this.eventBus.emit('CAMERA_MOTION_CHANGED', level);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  public setCameraDistance(preset: CameraDistancePreset): void {
    this.state.cameraDistance = preset;
    this.saveState();
    this.eventBus.emit('CAMERA_DISTANCE_CHANGED', {
      preset,
      offsetZ: CAMERA_DISTANCE_OFFSETS[preset]
    });
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  public setCameraMode(mode: 'CLASSIC' | 'CHARACTER_FOCUS'): void {
    this.state.cameraMode = mode;
    this.saveState();
    this.eventBus.emit('CAMERA_MODE_CHANGED', mode);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  // --- Accessibility Settings ---

  public setReducedMotion(enabled: boolean): void {
    this.state.reducedMotion = enabled;
    if (enabled) {
      // Comfort preset auto-adjustments
      this.state.cameraShake = 'OFF';
      this.state.speedLines = false;
      this.state.cameraMotion = 'REDUCED';
    }
    this.saveState();
    this.applyGlobalSideEffects();
    this.eventBus.emit('REDUCED_MOTION_CHANGED', enabled);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  public setHighContrastObstacles(enabled: boolean): void {
    this.state.highContrastObstacles = enabled;
    this.saveState();
    this.applyGlobalSideEffects();
    this.eventBus.emit('HIGH_CONTRAST_CHANGED', enabled);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  public setVisualHazardCues(enabled: boolean): void {
    this.state.visualHazardCues = enabled;
    this.saveState();
    this.eventBus.emit('VISUAL_HAZARD_CUES_CHANGED', enabled);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  public setPowerupAlerts(enabled: boolean): void {
    this.state.powerupAlerts = enabled;
    this.saveState();
    this.eventBus.emit('POWERUP_ALERTS_CHANGED', enabled);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  // --- Audio & System ---

  public setOpeningCinematic(pref: 'FIRST_ONLY' | 'ALWAYS' | 'DISABLED'): void {
    this.state.openingCinematic = pref;
    this.saveState();
    localStorage.setItem('metro_opening_cinematic', pref);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  public setRunningStyle(style: 'CLASSIC' | 'REVERSE'): void {
    this.state.runningStyle = style;
    this.saveState();
    localStorage.setItem('metro_running_style', style);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  public setFacialPortrait(enabled: boolean): void {
    this.state.facialPortrait = enabled;
    this.saveState();
    localStorage.setItem('metro_portrait_enabled', enabled ? 'true' : 'false');
    this.eventBus.emit('PORTRAIT_TOGGLED', enabled);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  public setShowFps(enabled: boolean): void {
    this.state.showFps = enabled;
    this.saveState();
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  public resetAllToDefaults(): void {
    this.state = this.getDefaultState();
    this.saveState();
    this.applyGlobalSideEffects();
    this.eventBus.emit('SETTINGS_RESET_DEFAULTS', this.state);
    this.eventBus.emit('SETTINGS_UPDATED', this.state);
  }

  // --- Computed Multipliers & Parameters ---

  public getCameraShakeMultiplier(): number {
    if (this.state.reducedMotion) return 0.0;
    switch (this.state.cameraShake) {
      case 'OFF': return 0.0;
      case 'LOW': return 0.40;
      case 'NORMAL':
      default:
        return 1.0;
    }
  }

  public getCameraMotionMultiplier(): number {
    if (this.state.reducedMotion) return 0.30;
    return this.state.cameraMotion === 'REDUCED' ? 0.35 : 1.0;
  }

  public getCameraDistanceOffset(): number {
    return CAMERA_DISTANCE_OFFSETS[this.state.cameraDistance] ?? 0.0;
  }

  public isSpeedLinesEnabled(): boolean {
    if (this.state.reducedMotion) return false;
    return this.state.speedLines;
  }

  public isReducedMotion(): boolean {
    return !!this.state.reducedMotion;
  }

  // --- DOM & Class Side Effects ---

  public applyGlobalSideEffects(): void {
    if (typeof document === 'undefined' || !document.body) return;

    // 1. Reduced Motion
    if (this.state.reducedMotion) {
      document.body.classList.add('reduced-motion-mode');
    } else {
      document.body.classList.remove('reduced-motion-mode');
    }

    // 2. High Contrast Obstacles & Hazards
    if (this.state.highContrastObstacles) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }

    // 3. Touch Controls Classes
    this.applyTouchControlsDOM();
  }

  public applyTouchControlsDOM(): void {
    if (typeof document === 'undefined') return;
    const touchBar = document.getElementById('touch-controls');
    if (!touchBar) return;

    // Remove legacy positioning/size classes
    touchBar.classList.remove(
      'touch-layout-center',
      'touch-layout-split',
      'touch-layout-wide',
      'touch-size-normal',
      'touch-size-large',
      'touch-opacity-30',
      'touch-opacity-60',
      'touch-opacity-90',
      'touch-mode-always',
      'touch-mode-disabled'
    );

    // Apply layout
    switch (this.state.touchControlsLayout) {
      case 'SPLIT_THUMB':
        touchBar.classList.add('touch-layout-split');
        break;
      case 'BOTTOM_WIDE':
        touchBar.classList.add('touch-layout-wide');
        break;
      case 'BOTTOM_CENTER':
      default:
        touchBar.classList.add('touch-layout-center');
        break;
    }

    // Apply size
    touchBar.classList.add(this.state.touchControlsSize === 'LARGE' ? 'touch-size-large' : 'touch-size-normal');

    // Apply opacity
    touchBar.classList.add(`touch-opacity-${this.state.touchControlsOpacity}`);

    // Apply visibility mode
    if (this.state.touchControlsMode === 'ALWAYS') {
      touchBar.classList.add('touch-mode-always');
    } else if (this.state.touchControlsMode === 'DISABLED') {
      touchBar.classList.add('touch-mode-disabled');
    }
  }

  // --- Persistence & Migrations ---

  private getDefaultState(): SettingsState {
    return {
      version: 2,
      keyBindings: JSON.parse(JSON.stringify(DEFAULT_KEY_BINDINGS)),
      swipeSensitivity: 'NORMAL',
      swipeMinDistancePx: 26,
      swipeMaxIntervalMs: 400,
      touchControlsMode: 'AUTO',
      touchControlsLayout: 'BOTTOM_CENTER',
      touchControlsSize: 'NORMAL',
      touchControlsOpacity: 60,
      cameraShake: 'NORMAL',
      speedLines: true,
      cameraMotion: 'NORMAL',
      cameraDistance: 'DEFAULT',
      cameraMode: 'CLASSIC',
      reducedMotion: false,
      highContrastObstacles: false,
      visualHazardCues: true,
      powerupAlerts: true,
      masterVolume: 0.8,
      musicVolume: 0.4,
      sfxVolume: 0.85,
      isMuted: false,
      reducedIntensity: false,
      openingCinematic: 'FIRST_ONLY',
      runningStyle: 'CLASSIC',
      facialPortrait: true,
      showFps: false
    };
  }

  private loadState(): SettingsState {
    const defaults = this.getDefaultState();
    if (typeof localStorage === 'undefined') return defaults;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          // Merge with defaults to guarantee all fields exist
          const merged: SettingsState = {
            ...defaults,
            ...parsed,
            keyBindings: {
              ...defaults.keyBindings,
              ...(parsed.keyBindings || {})
            }
          };

          // Validate keyBindings integrity
          for (const action of Object.keys(defaults.keyBindings) as InputAction[]) {
            if (!Array.isArray(merged.keyBindings[action]) || merged.keyBindings[action].length === 0) {
              merged.keyBindings[action] = [...defaults.keyBindings[action]];
            }
          }

          return merged;
        }
      }

      // Backward compatible migration from loose localStorage keys
      const legacyCameraMode = localStorage.getItem('metro_camera_mode');
      if (legacyCameraMode === 'CLASSIC' || legacyCameraMode === 'CHARACTER_FOCUS') {
        defaults.cameraMode = legacyCameraMode;
      }

      const legacyIntro = localStorage.getItem('metro_opening_cinematic');
      if (legacyIntro === 'FIRST_ONLY' || legacyIntro === 'ALWAYS' || legacyIntro === 'DISABLED') {
        defaults.openingCinematic = legacyIntro;
      }

      const legacyPortrait = localStorage.getItem('metro_portrait_enabled');
      if (legacyPortrait !== null) {
        defaults.facialPortrait = legacyPortrait !== 'false';
      }

      const legacyStyle = localStorage.getItem('metro_running_style');
      if (legacyStyle === 'CLASSIC' || legacyStyle === 'REVERSE') {
        defaults.runningStyle = legacyStyle;
      }

      return defaults;
    } catch (e) {
      console.warn('Failed to parse settings, falling back to defaults:', e);
      return defaults;
    }
  }

  public saveState(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  public importState(newState: Partial<SettingsState>): void {
    const defaults = this.getDefaultState();
    this.state = {
      ...defaults,
      ...newState,
      keyBindings: {
        ...defaults.keyBindings,
        ...(newState.keyBindings || {})
      }
    };
    this.saveState();
    this.applyGlobalSideEffects();
    this.eventBus.emit('SETTINGS_CHANGED', this.state);
  }

  private formatKeyCode(code: string): string {
    return code.trim();
  }
}
