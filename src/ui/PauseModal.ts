import { EventBus, EVENTS } from '../core/EventBus';

export class PauseModal {
  private element: HTMLElement;
  private resumeBtn: HTMLButtonElement;
  private restartBtn: HTMLButtonElement;
  private soundBtn: HTMLButtonElement;
  private settingsBtn: HTMLButtonElement;

  constructor() {
    this.element = document.getElementById('pause-modal')!;
    this.resumeBtn = document.getElementById('pause-resume-btn') as HTMLButtonElement;
    this.restartBtn = document.getElementById('pause-restart-btn') as HTMLButtonElement;
    this.soundBtn = document.getElementById('pause-sound-btn') as HTMLButtonElement;
    this.settingsBtn = document.getElementById('pause-settings-btn') as HTMLButtonElement;

    this.resumeBtn.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit(EVENTS.GAME_RESUME);
    });

    this.restartBtn.addEventListener('click', () => {
      this.hide();
      EventBus.getInstance().emit(EVENTS.GAME_RESTART);
    });

    this.soundBtn.addEventListener('click', () => {
      EventBus.getInstance().emit('TOGGLE_SOUND');
    });

    this.settingsBtn.addEventListener('click', () => {
      EventBus.getInstance().emit('OPEN_SETTINGS');
    });

    const bus = EventBus.getInstance();
    bus.on(EVENTS.GAME_PAUSE, () => this.show());
    bus.on(EVENTS.GAME_RESUME, () => this.hide());
  }

  public updateSoundButton(isMuted: boolean): void {
    this.soundBtn.textContent = isMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
  }

  public show(): void {
    this.element.classList.remove('hidden');
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }
}
