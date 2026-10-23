import { SoundManager } from '../audio/SoundManager';
import { EventBus, EVENTS } from '../core/EventBus';
import { GraphicsManager, GraphicsPreset, QualityConfig } from '../scene/GraphicsManager';

export class SettingsModal {
  private element: HTMLElement;
  private closeBtn: HTMLButtonElement;
  private masterSlider: HTMLInputElement;
  private musicSlider: HTMLInputElement;
  private sfxSlider: HTMLInputElement;
  private muteCheckbox: HTMLInputElement | null;
  private reducedIntensityCheckbox: HTMLInputElement | null;
  private qualitySelect: HTMLSelectElement | null;
  private introSelect: HTMLSelectElement | null;
  private resolvedBadgeEl: HTMLElement | null;
  private qualityDescEl: HTMLElement | null;
  private showFpsCheckbox: HTMLInputElement | null;
  private presetButtons: NodeListOf<HTMLButtonElement>;

  private graphicsManager: GraphicsManager;

  constructor(private soundManager: SoundManager) {
    this.graphicsManager = GraphicsManager.getInstance();

    this.element = document.getElementById('settings-modal')!;
    this.closeBtn = document.getElementById('settings-close-btn') as HTMLButtonElement;
    this.masterSlider = document.getElementById('setting-master-vol') as HTMLInputElement;
    this.musicSlider = document.getElementById('setting-music-vol') as HTMLInputElement;
    this.sfxSlider = document.getElementById('setting-sfx-vol') as HTMLInputElement;
    this.muteCheckbox = document.getElementById('setting-audio-mute') as HTMLInputElement | null;
    this.reducedIntensityCheckbox = document.getElementById('setting-reduced-intensity') as HTMLInputElement | null;
    this.qualitySelect = document.getElementById('setting-graphics-quality') as HTMLSelectElement | null;
    this.introSelect = document.getElementById('setting-opening-cinematic') as HTMLSelectElement | null;

    this.resolvedBadgeEl = document.getElementById('setting-graphics-resolved-badge');
    this.qualityDescEl = document.getElementById('setting-graphics-desc');
    this.showFpsCheckbox = document.getElementById('setting-show-fps') as HTMLInputElement | null;
    this.presetButtons = this.element.querySelectorAll('.preset-segment-btn');

    this.setupListeners();
    this.refreshAudioUI();
    this.refreshGraphicsUI();
  }

  private setupListeners(): void {
    this.closeBtn.addEventListener('click', () => this.hide());

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

    // Segmented Preset Buttons
    this.presetButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset') as GraphicsPreset;
        if (preset) {
          this.graphicsManager.setPreset(preset, true);
          this.refreshGraphicsUI();
        }
      });
    });

    // Programmatic select synchronization
    if (this.qualitySelect) {
      this.qualitySelect.addEventListener('change', () => {
        const preset = this.qualitySelect!.value as GraphicsPreset;
        this.graphicsManager.setPreset(preset, true);
        this.refreshGraphicsUI();
      });
    }

    // FPS Display toggle
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
        const pref = this.introSelect!.value;
        localStorage.setItem('metro_opening_cinematic', pref);
      });
    }

    EventBus.getInstance().on('OPEN_SETTINGS', () => this.show());

    // Update badge when adaptive controller shifts quality in real time
    EventBus.getInstance().on('GRAPHICS_CONFIG_CHANGED', (config: QualityConfig) => {
      this.updateResolvedBadge(config);
    });

    // Synchronize audio controls on external changes
    EventBus.getInstance().on(EVENTS.AUDIO_SETTINGS_CHANGED, () => {
      this.refreshAudioUI();
    });
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

    // 1. Update active class on segmented buttons
    this.presetButtons.forEach((btn) => {
      const btnPreset = btn.getAttribute('data-preset');
      btn.classList.toggle('active', btnPreset === preset);
    });

    // 2. Sync select element
    if (this.qualitySelect) {
      this.qualitySelect.value = preset;
    }

    // 3. Update description and badge
    this.updateResolvedBadge(config);

    // 4. Sync FPS checkbox
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

  public show(): void {
    this.refreshAudioUI();
    this.refreshGraphicsUI();
    if (this.introSelect) {
      this.introSelect.value = localStorage.getItem('metro_opening_cinematic') || 'FIRST_ONLY';
    }
    this.element.classList.remove('hidden');
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }
}
