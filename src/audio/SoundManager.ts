import { EventBus, EVENTS } from '../core/EventBus';

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicTimer: number | null = null;
  private coinStreak: number = 0;
  private lastCoinTime: number = 0;

  constructor() {
    this.setupEventListeners();
  }

  private initAudio(): void {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.setMasterVolume(0.7);
      this.setMusicVolume(0.35);
      this.setSfxVolume(0.85);

      if (this.ctx.state === 'suspended') {
        const resumeAudio = () => {
          this.ctx?.resume();
          window.removeEventListener('click', resumeAudio);
          window.removeEventListener('keydown', resumeAudio);
          window.removeEventListener('touchstart', resumeAudio);
        };
        window.addEventListener('click', resumeAudio);
        window.addEventListener('keydown', resumeAudio);
        window.addEventListener('touchstart', resumeAudio);
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  private setupEventListeners(): void {
    const bus = EventBus.getInstance();
    bus.on(EVENTS.JUMP, () => this.playJump());
    bus.on(EVENTS.SLIDE, () => this.playSlide());
    bus.on(EVENTS.FAST_DROP, () => this.playFastDrop());
    bus.on(EVENTS.LANE_CHANGE, () => this.playLaneChange());
    bus.on(EVENTS.COIN_COLLECTED, () => this.playCoin());
    bus.on(EVENTS.POWERUP_COLLECTED, (type: string) => this.playPowerup(type));
    bus.on('SHIELD_BROKEN', () => this.playShieldBreak());
    bus.on('POWERUP_EXPIRING', () => this.playExpiringWarning());
    bus.on(EVENTS.HOVERBOARD_ACTIVATED, () => this.playHoverboard());
    bus.on(EVENTS.HOVERBOARD_BROKEN, () => this.playHoverboardCrash());
    bus.on(EVENTS.JETPACK_TAKEOFF, () => this.playJetpack());
    bus.on(EVENTS.JETPACK_LANDED, () => this.playLandingTouchdown(true));
    bus.on(EVENTS.LAND, (data?: { isFastDrop?: boolean }) => this.playLandingTouchdown(data?.isFastDrop === true));
    bus.on(EVENTS.CRASH, () => this.playCrash());
    bus.on(EVENTS.STUMBLE, () => this.playStumble());
    bus.on(EVENTS.NEAR_MISS, () => this.playNearMiss());
    bus.on(EVENTS.TRAIN_HORN, () => this.playTrainHorn());
    bus.on(EVENTS.GAME_START, () => {
      this.initAudio();
      this.startMusic();
    });
    bus.on(EVENTS.GAME_OVER, () => this.stopMusic());
    bus.on(EVENTS.GAME_PAUSE, () => this.pauseMusic());
    bus.on(EVENTS.GAME_RESUME, () => this.resumeMusic());
  }

  public setMasterVolume(val: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : val, this.ctx.currentTime);
    }
  }

  public setMusicVolume(val: number): void {
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  public setSfxVolume(val: number): void {
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // --- Sound Effects Synthesizers ---

  public playJump(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.18);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playSlide(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.25);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playFastDrop(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playLaneChange(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playCoin(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Pitch escalation for rapid consecutive coins
    if (now - this.lastCoinTime < 0.35) {
      this.coinStreak = Math.min(this.coinStreak + 1, 8);
    } else {
      this.coinStreak = 0;
    }
    this.lastCoinTime = now;

    const baseFreq = 987.77; // B5
    const freqMultiplier = Math.pow(1.06, this.coinStreak); // Minor pentatonic scale step
    const freq = baseFreq * freqMultiplier;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.setValueAtTime(freq * 1.5, now + 0.04);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.18);
    osc2.stop(now + 0.18);
  }

  public playPowerup(type: string): void {
    if (!this.ctx || !this.sfxGain) return;
    switch (type) {
      case 'MAGNET':
        this.playMagnet();
        break;
      case 'JETPACK':
        this.playJetpack();
        break;
      case 'SNEAKERS':
        this.playSneakers();
        break;
      case 'MULTIPLIER':
        this.playMultiplier();
        break;
      case 'SHIELD':
        this.playShield();
        break;
      default:
        this.playDefaultPowerup();
        break;
    }
  }

  private playDefaultPowerup(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.06;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.14);
    });
  }

  public playMagnet(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Electro-magnetic resonant sweep
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(280, now);
    osc1.frequency.exponentialRampToValueAtTime(740, now + 0.3);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(560, now);
    osc2.frequency.exponentialRampToValueAtTime(1480, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  public playJetpack(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // 1. Rocket thruster roar (filtered noise)
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
    filter.Q.setValueAtTime(3.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + 0.45);

    // 2. Rising power pitch
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.35);

    oscGain.gain.setValueAtTime(0.2, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playLandingTouchdown(isFastDrop: boolean = false): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Cushioned low-frequency footstep impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';

    const startFreq = isFastDrop ? 150 : 115;
    const endFreq = isFastDrop ? 36 : 42;
    const duration = isFastDrop ? 0.18 : 0.14;
    const peakVol = isFastDrop ? 0.40 : 0.28;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration * 0.85);

    gain.gain.setValueAtTime(peakVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  public playSneakers(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Bouncy spring boing
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.25);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playMultiplier(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // High-voltage power chime
    const freqs = [440, 554.37, 659.25, 880, 1108.73]; // A major arpeggio
    freqs.forEach((freq, i) => {
      const startTime = now + i * 0.05;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.16);
    });
  }

  public playShield(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Shimmering crystal force field
    [523.25, 783.99, 1046.5, 1567.98].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      gain.gain.setValueAtTime(0.2, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.03);
      osc.stop(now + 0.4);
    });
  }

  public playShieldBreak(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Glass shatter + dispersion noise
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.28);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + 0.3);

    // Resonant crash chime
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);

    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playExpiringWarning(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Rapid urgent double pulse warning
    [0, 0.12].forEach((offset) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(920, now + offset);

      gain.gain.setValueAtTime(0.25, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.08);
    });
  }

  public playHoverboard(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playHoverboardCrash(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  public playCrash(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Noise buffer for impact sound
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.35);
  }

  public playNearMiss(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playTrainHorn(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Classic two-tone brassy locomotive air horn (311Hz + 233Hz)
    [311.13, 233.08].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      // Subtle horn pitch drift
      osc.frequency.linearRampToValueAtTime(freq * 0.98, now + 0.55);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.05); // Rapid attack
      gain.gain.setValueAtTime(0.26, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6); // Release

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now);
      osc.stop(now + 0.6);
    });
  }

  public playStumble(): void {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // --- Procedural Synth Background Groove ---

  public startMusic(): void {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.playMusicStep(0);
  }

  public pauseMusic(): void {
    this.isMusicPlaying = false;
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public resumeMusic(): void {
    if (!this.isMusicPlaying) {
      this.startMusic();
    }
  }

  public stopMusic(): void {
    this.isMusicPlaying = false;
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playMusicStep(step: number): void {
    if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;

    const tempo = 132; // BPM
    const stepDuration = 60 / tempo / 4; // 16th note in seconds

    // 16-step funk/electro bassline pattern: D - F - G - G# - G - F - D - C
    const bassline = [
      146.83, 0, 146.83, 174.61, // D3, -, D3, F3
      0, 196.00, 207.65, 196.00, // -, G3, G#3, G3
      174.61, 0, 146.83, 0,      // F3, -, D3, -
      130.81, 146.83, 0, 174.61  // C3, D3, -, F3
    ];

    const freq = bassline[step % 16];
    const now = this.ctx.currentTime;

    if (freq > 0) {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq / 2, now); // Sub-bass octave

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + stepDuration * 0.9);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + stepDuration * 0.9);
    }

    // Drum beat: kick on 0, 4, 8, 12, hi-hat on every odd 16th
    if (step % 4 === 0) {
      this.playKick(now);
    }
    if (step % 2 === 1) {
      this.playHiHat(now);
    }

    this.musicTimer = window.setTimeout(() => {
      this.playMusicStep(step + 1);
    }, stepDuration * 1000);
  }

  private playKick(now: number): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  private playHiHat(now: number): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(8000, now);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }
}
