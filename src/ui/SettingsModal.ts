import { SoundManager } from '../audio/SoundManager';
import { EventBus } from '../core/EventBus';

export class SettingsModal {
  private element: HTMLElement;
  private closeBtn: HTMLButtonElement;
  private masterSlider: HTMLInputElement;
  private musicSlider: HTMLInputElement;
  private sfxSlider: HTMLInputElement;

  constructor(private soundManager: SoundManager) {
    this.element = document.getElementById('settings-modal')!;
    this.closeBtn = document.getElementById('settings-close-btn') as HTMLButtonElement;
    this.masterSlider = document.getElementById('setting-master-vol') as HTMLInputElement;
    this.musicSlider = document.getElementById('setting-music-vol') as HTMLInputElement;
    this.sfxSlider = document.getElementById('setting-sfx-vol') as HTMLInputElement;

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

    EventBus.getInstance().on('OPEN_SETTINGS', () => this.show());
  }

  public show(): void {
    this.element.classList.remove('hidden');
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }
}
