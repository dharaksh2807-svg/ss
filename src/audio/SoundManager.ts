import { EventBus, EVENTS } from '../core/EventBus';
import { CONSTANTS } from '../core/Constants';

export type MusicState =
  | 'LOBBY'
  | 'RUNNING_NORMAL'
  | 'RUNNING_FAST'
  | 'RUNNING_INTENSE'
  | 'JETPACK'
  | 'GAME_OVER';

export interface AudioPreferences {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  reducedIntensity: boolean;
}

const STORAGE_KEYS = {
  MASTER_VOL: 'metro_audio_master',
  MUSIC_VOL: 'metro_audio_music',
  SFX_VOL: 'metro_audio_sfx',
  MUTED: 'metro_audio_muted',
  REDUCED_INTENSITY: 'metro_audio_reduced_intensity'
};

export class SoundManager {
  private ctx: AudioContext | null = null;

  // Central Gain Buses
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private uiGain: GainNode | null = null;

  // Master Dynamics & Accessibility
  private masterCompressor: DynamicsCompressorNode | null = null;
  private reducedIntensityFilter: BiquadFilterNode | null = null;

  // Volumes & Preferences
  private masterVolume: number = 0.75;
  private musicVolume: number = 0.40;
  private sfxVolume: number = 0.85;
  private isMuted: boolean = false;
  private reducedIntensity: boolean = false;

  // Music State Machine & Adaptive Stems
  private musicState: MusicState = 'LOBBY';
  private isMusicPlaying: boolean = false;
  private musicTimer: number | null = null;
  private currentStep: number = 0;

  // Music Stem Gain Nodes (for seamless crossfading without clicks)
  private lobbyStemGain: GainNode | null = null;
  private drumStemGain: GainNode | null = null;
  private bassStemGain: GainNode | null = null;
  private arpStemGain: GainNode | null = null;
  private intenseStemGain: GainNode | null = null;
  private jetpackStemGain: GainNode | null = null;

  // Movement & Footstep State
  private footstepTimer: number = 0;
  private isLeftFoot: boolean = false;

  // Continuous Sound Loops
  private isSlidingLoopActive: boolean = false;
  private slideLoopGain: GainNode | null = null;
  private slideLoopSource: AudioNode | null = null;

  private isHoverboardLoopActive: boolean = false;
  private hoverboardOsc1: OscillatorNode | null = null;
  private hoverboardOsc2: OscillatorNode | null = null;
  private hoverboardGain: GainNode | null = null;

  private isJetpackLoopActive: boolean = false;
  private jetpackNoiseSource: AudioBufferSourceNode | null = null;
  private jetpackGain: GainNode | null = null;

  // Environmental Ambient Train Rumble
  private trainRumbleOsc: OscillatorNode | null = null;
  private trainRumbleFilter: BiquadFilterNode | null = null;
  private trainRumbleGain: GainNode | null = null;
  private activeEnvironmentId: string = 'MODERN_METRO';

  // Train Horn Prioritization & Cooldown
  private lastTrainHornTime: number = -999;
  private readonly TRAIN_HORN_COOLDOWN: number = 1.4; // 1.4s minimum separation

  // Coin Streak & Anti-Clipping Rate Limiter
  private coinStreak: number = 0;
  private lastCoinTime: number = 0;
  private coinAudioScheduledTime: number = 0;

  // Cleanup listeners list
  private unsubscribers: Array<() => void> = [];

  constructor() {
    this.loadPreferences();
    this.setupEventListeners();
    this.setupAutoplayUnlocking();
  }

  // --- AudioContext Initialization & Master Graph ---

  public initAudio(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();

      // 1. Master Output Chain with Dynamics Compressor & Sensory Accessibility Filter
      this.masterCompressor = this.ctx.createDynamicsCompressor();
      this.masterCompressor.threshold.setValueAtTime(this.reducedIntensity ? -24 : -16, this.ctx.currentTime);
      this.masterCompressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.masterCompressor.ratio.setValueAtTime(this.reducedIntensity ? 6 : 4, this.ctx.currentTime);
      this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.masterCompressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.reducedIntensityFilter = this.ctx.createBiquadFilter();
      this.reducedIntensityFilter.type = 'lowpass';
      this.reducedIntensityFilter.frequency.setValueAtTime(
        this.reducedIntensity ? 4200 : 20000,
        this.ctx.currentTime
      );
      this.reducedIntensityFilter.Q.setValueAtTime(0.707, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);

      // Node Graph:
      // [musicGain, sfxGain, ambientGain, uiGain] -> masterGain -> reducedIntensityFilter -> masterCompressor -> destination
      this.masterGain.connect(this.reducedIntensityFilter);
      this.reducedIntensityFilter.connect(this.masterCompressor);
      this.masterCompressor.connect(this.ctx.destination);

      // 2. Individual Audio Buses
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.sfxVolume * 0.75, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.uiGain = this.ctx.createGain();
      this.uiGain.gain.setValueAtTime(this.sfxVolume * 0.9, this.ctx.currentTime);
      this.uiGain.connect(this.masterGain);

      // 3. Adaptive Music Stems (Sub-buses connected to musicGain)
      this.lobbyStemGain = this.ctx.createGain();
      this.drumStemGain = this.ctx.createGain();
      this.bassStemGain = this.ctx.createGain();
      this.arpStemGain = this.ctx.createGain();
      this.intenseStemGain = this.ctx.createGain();
      this.jetpackStemGain = this.ctx.createGain();

      [
        this.lobbyStemGain,
        this.drumStemGain,
        this.bassStemGain,
        this.arpStemGain,
        this.intenseStemGain,
        this.jetpackStemGain
      ].forEach((stem) => stem.connect(this.musicGain!));

      this.applyStemGains(this.musicState, true);

      // 4. Initialize Environmental Train Rail Rumble Loop
      this.initAmbientTrainRumble();

      // Resume context if suspended
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('Web Audio API unavailable or blocked:', e);
    }
  }

  private setupAutoplayUnlocking(): void {
    const unlock = () => {
      if (!this.ctx) {
        this.initAudio();
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  // --- Preferences Persistence ---

  private loadPreferences(): void {
    try {
      const savedMaster = localStorage.getItem(STORAGE_KEYS.MASTER_VOL);
      if (savedMaster !== null) this.masterVolume = Math.max(0, Math.min(1, parseFloat(savedMaster)));

      const savedMusic = localStorage.getItem(STORAGE_KEYS.MUSIC_VOL);
      if (savedMusic !== null) this.musicVolume = Math.max(0, Math.min(1, parseFloat(savedMusic)));

      const savedSfx = localStorage.getItem(STORAGE_KEYS.SFX_VOL);
      if (savedSfx !== null) this.sfxVolume = Math.max(0, Math.min(1, parseFloat(savedSfx)));

      const savedMuted = localStorage.getItem(STORAGE_KEYS.MUTED);
      if (savedMuted !== null) this.isMuted = savedMuted === 'true';

      const savedReduced = localStorage.getItem(STORAGE_KEYS.REDUCED_INTENSITY);
      if (savedReduced !== null) this.reducedIntensity = savedReduced === 'true';
    } catch {
      // LocalStorage unavailable in certain sandboxed environments
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MASTER_VOL, this.masterVolume.toFixed(2));
      localStorage.setItem(STORAGE_KEYS.MUSIC_VOL, this.musicVolume.toFixed(2));
      localStorage.setItem(STORAGE_KEYS.SFX_VOL, this.sfxVolume.toFixed(2));
      localStorage.setItem(STORAGE_KEYS.MUTED, String(this.isMuted));
      localStorage.setItem(STORAGE_KEYS.REDUCED_INTENSITY, String(this.reducedIntensity));
    } catch {
      // Ignore storage errors
    }
  }

  public getPreferences(): AudioPreferences {
    return {
      masterVolume: this.masterVolume,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      isMuted: this.isMuted,
      reducedIntensity: this.reducedIntensity
    };
  }

  // --- Volume & Master Controls ---

  public setMasterVolume(val: number): void {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, now);
    }
    this.savePreferences();
    EventBus.getInstance().emit(EVENTS.AUDIO_SETTINGS_CHANGED, this.getPreferences());
  }

  public setMusicVolume(val: number): void {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicVolume, now);
    }
    this.savePreferences();
    EventBus.getInstance().emit(EVENTS.AUDIO_SETTINGS_CHANGED, this.getPreferences());
  }

  public setSfxVolume(val: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ambientGain && this.uiGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.sfxGain.gain.cancelScheduledValues(now);
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, now);
      this.ambientGain.gain.setValueAtTime(this.sfxVolume * 0.75, now);
      this.uiGain.gain.setValueAtTime(this.sfxVolume * 0.9, now);
    }
    this.savePreferences();
    EventBus.getInstance().emit(EVENTS.AUDIO_SETTINGS_CHANGED, this.getPreferences());
  }

  public toggleMute(): boolean {
    return this.setMuted(!this.isMuted);
  }

  public setMuted(muted: boolean): boolean {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, now);
    }
    this.savePreferences();
    EventBus.getInstance().emit(EVENTS.AUDIO_SETTINGS_CHANGED, this.getPreferences());
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setReducedIntensity(enabled: boolean): void {
    this.reducedIntensity = enabled;
    if (this.reducedIntensityFilter && this.masterCompressor && this.ctx) {
      const now = this.ctx.currentTime;
      this.reducedIntensityFilter.frequency.setValueAtTime(this.reducedIntensity ? 4200 : 20000, now);
      this.masterCompressor.threshold.setValueAtTime(this.reducedIntensity ? -24 : -16, now);
      this.masterCompressor.ratio.setValueAtTime(this.reducedIntensity ? 6 : 4, now);
    }
    this.savePreferences();
    EventBus.getInstance().emit(EVENTS.AUDIO_SETTINGS_CHANGED, this.getPreferences());
  }

  public isReducedIntensity(): boolean {
    return this.reducedIntensity;
  }

  // --- Event Listeners Setup ---

  private setupEventListeners(): void {
    const bus = EventBus.getInstance();

    this.unsubscribers.push(bus.on(EVENTS.JUMP, () => this.playJump()));
    this.unsubscribers.push(bus.on(EVENTS.SLIDE, () => this.playSlide(true)));
    this.unsubscribers.push(bus.on(EVENTS.SLIDE_COMPLETED, () => this.stopSlide()));
    this.unsubscribers.push(bus.on(EVENTS.FAST_DROP, () => this.playFastDrop()));
    this.unsubscribers.push(bus.on(EVENTS.LANE_CHANGE, () => this.playLaneChange()));
    this.unsubscribers.push(bus.on(EVENTS.COIN_COLLECTED, () => this.playCoin()));
    this.unsubscribers.push(bus.on(EVENTS.POWERUP_COLLECTED, (type: string) => this.playPowerup(type)));
    this.unsubscribers.push(bus.on('SHIELD_BROKEN', () => this.playShieldBreak()));
    this.unsubscribers.push(bus.on('POWERUP_EXPIRING', () => this.playExpiringWarning()));

    // Hoverboard & Jetpack Loops
    this.unsubscribers.push(bus.on(EVENTS.HOVERBOARD_ACTIVATED, () => this.playHoverboard()));
    this.unsubscribers.push(bus.on(EVENTS.HOVERBOARD_BROKEN, () => this.playHoverboardCrash()));
    this.unsubscribers.push(bus.on(EVENTS.JETPACK_TAKEOFF, () => this.playJetpackTakeoff()));
    this.unsubscribers.push(bus.on(EVENTS.JETPACK_LANDED, () => this.playLandingTouchdown({ isFastDrop: true })));
    this.unsubscribers.push(
      bus.on(EVENTS.LAND, (data?: { isFastDrop?: boolean; surface?: string }) => this.playLandingTouchdown(data))
    );

    // Hazard & Obstacle Audio
    this.unsubscribers.push(bus.on(EVENTS.CRASH, () => this.playCrash()));
    this.unsubscribers.push(bus.on(EVENTS.STUMBLE, () => this.playStumble()));
    this.unsubscribers.push(bus.on(EVENTS.NEAR_MISS, () => this.playNearMiss()));
    this.unsubscribers.push(
      bus.on(EVENTS.TRAIN_HORN, (data?: { laneX?: number; distance?: number; speed?: number }) =>
        this.playTrainHorn(data)
      )
    );
    this.unsubscribers.push(bus.on(EVENTS.CHASER_WHISTLE, () => this.playWhistle()));

    // Rewards & UI Progression Feedback
    this.unsubscribers.push(bus.on(EVENTS.MISSION_COMPLETED, () => this.playMissionComplete()));
    this.unsubscribers.push(bus.on(EVENTS.DAILY_COMPLETED, () => this.playMissionComplete()));
    this.unsubscribers.push(bus.on(EVENTS.ACHIEVEMENT_UNLOCKED, () => this.playAchievementUnlock()));
    this.unsubscribers.push(bus.on(EVENTS.REWARD_CLAIMED, () => this.playRewardClaim()));
    this.unsubscribers.push(bus.on(EVENTS.ITEM_PURCHASED, () => this.playPurchase()));
    this.unsubscribers.push(bus.on(EVENTS.UI_CLICK, () => this.playButtonClick()));

    // Environmental District Transitions & Audio Feedback
    this.unsubscribers.push(bus.on('ENVIRONMENT_TRANSITION_APPROACHING', () => this.playEnvironmentTransition()));
    this.unsubscribers.push(bus.on('ENVIRONMENT_CHANGED', (envId: string) => this.setEnvironmentAmbience(envId)));
    this.unsubscribers.push(bus.on('ENVIRONMENT_PREFERENCE_CHANGED', (pref: string) => {
      if (pref !== 'DYNAMIC') {
        this.setEnvironmentAmbience(pref);
      }
    }));

    // Game Lifecycle
    this.unsubscribers.push(
      bus.on(EVENTS.GAME_START, () => {
        this.initAudio();
        this.setMusicState('RUNNING_NORMAL');
        this.startMusic();
      })
    );
    this.unsubscribers.push(
      bus.on(EVENTS.GAME_OVER, () => {
        this.stopSlide();
        this.stopHoverboardLoop();
        this.stopJetpackLoop();
        this.setMusicState('GAME_OVER');
      })
    );
    this.unsubscribers.push(bus.on(EVENTS.GAME_PAUSE, () => this.pauseMusic()));
    this.unsubscribers.push(bus.on(EVENTS.GAME_RESUME, () => this.resumeMusic()));
    this.unsubscribers.push(
      bus.on(EVENTS.GO_TO_LOBBY, () => {
        this.stopSlide();
        this.stopHoverboardLoop();
        this.stopJetpackLoop();
        this.setMusicState('LOBBY');
        this.startMusic();
      })
    );
  }

  // --- Per-Frame Update (Speed Cadence, Ambient Soundscape & Transitions) ---

  public update(dt: number, player?: any, trackManager?: any, lifecycleState?: string): void {
    if (!this.ctx || this.isMuted) return;

    if (lifecycleState === 'PLAYING' && player) {
      // 1. Cadence-synchronized Footsteps
      const isAirborne = player.isJumping || player.jumpPhase === 'ASCENDING' || player.jumpPhase === 'APEX' || player.jumpPhase === 'DESCENDING';
      const isSliding = player.isSliding === true;
      const isBoard = (typeof player.hoverboardManager?.isBoardActive === 'function' ? player.hoverboardManager.isBoardActive() : typeof player.hoverboardManager?.isActive === 'function' ? player.hoverboardManager.isActive() : false) === true;
      const isJet = (typeof player.powerups?.isJetpackActive === 'function' ? player.powerups.isJetpackActive() : typeof player.powerups?.isActive === 'function' ? player.powerups.isActive('JETPACK') : false) === true;
      const isStumbling = player.isStumbling === true;

      if (!isAirborne && !isSliding && !isBoard && !isJet && !isStumbling) {
        const speed = Math.max(1, player.speed || CONSTANTS.INITIAL_SPEED);
        // Stride cadence matching CharacterModel animation:
        // cadence = Math.min(32.0, 12.0 + (speed / CONSTANTS.MAX_SPEED) * 16.0) rad/s
        const cadence = Math.min(32.0, 12.0 + (speed / CONSTANTS.MAX_SPEED) * 16.0);
        const stepInterval = Math.PI / cadence;

        this.footstepTimer += dt;
        if (this.footstepTimer >= stepInterval) {
          this.footstepTimer %= stepInterval;
          this.playFootstep(player.supportSurface || 'GROUND');
        }
      } else {
        this.footstepTimer = 0;
      }

      // 2. Sliding Loop Maintenance
      if (isSliding && !this.isSlidingLoopActive) {
        this.playSlide(true);
      } else if (!isSliding && this.isSlidingLoopActive) {
        this.stopSlide();
      }

      // 3. Hoverboard & Jetpack Loop Verification
      if (isBoard && !this.isHoverboardLoopActive) {
        this.startHoverboardLoop();
      } else if (!isBoard && this.isHoverboardLoopActive) {
        this.stopHoverboardLoop();
      }

      if (isJet && !this.isJetpackLoopActive) {
        this.startJetpackLoop();
      } else if (!isJet && this.isJetpackLoopActive) {
        this.stopJetpackLoop();
      }

      // 4. Adaptive Music State Evaluation (with speed hysteresis)
      if (isJet) {
        if (this.musicState !== 'JETPACK') this.setMusicState('JETPACK');
      } else {
        const speed = player.speed || CONSTANTS.INITIAL_SPEED;
        if (this.musicState === 'RUNNING_INTENSE') {
          if (speed < 21.5) this.setMusicState('RUNNING_FAST');
        } else if (this.musicState === 'RUNNING_FAST') {
          if (speed >= 24.0) {
            this.setMusicState('RUNNING_INTENSE');
          } else if (speed < 16.0) {
            this.setMusicState('RUNNING_NORMAL');
          }
        } else {
          // In RUNNING_NORMAL or transitional
          if (speed >= 24.0) {
            this.setMusicState('RUNNING_INTENSE');
          } else if (speed >= 18.0) {
            this.setMusicState('RUNNING_FAST');
          } else if (this.musicState !== 'RUNNING_NORMAL') {
            this.setMusicState('RUNNING_NORMAL');
          }
        }
      }

      // 5. Environmental Ambient Train Proximity Rumble
      this.updateAmbientTrainRumble(player, trackManager);
    } else if (lifecycleState === 'MENU' && this.musicState !== 'LOBBY') {
      this.setMusicState('LOBBY');
    }
  }

  // --- Running and Movement Sound Synthesizers ---

  private playFootstep(surface: 'GROUND' | 'TRAIN_ROOF' | 'RAMP'): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    this.isLeftFoot = !this.isLeftFoot;
    const pitchShift = this.isLeftFoot ? 0.975 : 1.025;

    if (surface === 'TRAIN_ROOF') {
      // Hollow corrugated steel rooftop footstep
      const osc = this.ctx.createOscillator();
      const overtone = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190 * pitchShift, now);
      osc.frequency.exponentialRampToValueAtTime(110 * pitchShift, now + 0.05);

      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(620 * pitchShift, now);
      overtone.frequency.exponentialRampToValueAtTime(320 * pitchShift, now + 0.04);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      osc.connect(gain);
      overtone.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      overtone.start(now);
      osc.stop(now + 0.055);
      overtone.stop(now + 0.055);
    } else if (surface === 'RAMP') {
      // Textured wooden/steel incline footstep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(115 * pitchShift, now);
      osc.frequency.exponentialRampToValueAtTime(55 * pitchShift, now + 0.05);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.055);
    } else {
      // GROUND: Ballast gravel dampened thump + textured crunch
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(85 * pitchShift, now);
      osc.frequency.exponentialRampToValueAtTime(38 * pitchShift, now + 0.06);

      gain.gain.setValueAtTime(0.20, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.065);

      // Soft gravel click
      try {
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.035);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800 * pitchShift, now);
        filter.Q.setValueAtTime(1.5, now);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + 0.035);
      } catch {}
    }
  }

  public playJump(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.16);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.20);
  }

  public playLandingTouchdown(options?: boolean | { isFastDrop?: boolean; surface?: string }): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const isFastDrop = typeof options === 'boolean' ? options : options?.isFastDrop === true;
    const surface = typeof options === 'object' ? options?.surface || 'GROUND' : 'GROUND';

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (surface === 'TRAIN_ROOF') {
      // Resonant metallic roof touchdown
      const metallic = this.ctx.createOscillator();
      metallic.type = 'sine';
      metallic.frequency.setValueAtTime(isFastDrop ? 680 : 540, now);
      metallic.frequency.exponentialRampToValueAtTime(220, now + 0.14);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isFastDrop ? 220 : 160, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);

      gain.gain.setValueAtTime(isFastDrop ? 0.38 : 0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      metallic.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      metallic.start(now);
      osc.stop(now + 0.18);
      metallic.stop(now + 0.18);
    } else {
      // Ground / Ramp touchdown
      osc.type = 'triangle';
      const startFreq = isFastDrop ? 150 : 110;
      const endFreq = isFastDrop ? 30 : 40;
      const duration = isFastDrop ? 0.19 : 0.13;
      const peakVol = isFastDrop ? 0.42 : 0.26;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration * 0.85);

      gain.gain.setValueAtTime(peakVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + duration);
    }
  }

  public playSlide(continuous: boolean = false): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Initial downward friction swoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.22);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);

    // 2. Continuous ground friction texture loop
    if (continuous && !this.isSlidingLoopActive) {
      this.startSlideLoop();
    }
  }

  private startSlideLoop(): void {
    if (!this.ctx || !this.sfxGain || this.isSlidingLoopActive) return;
    try {
      this.isSlidingLoopActive = true;
      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      this.slideLoopGain = this.ctx.createGain();
      this.slideLoopGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.slideLoopGain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.05);

      noise.connect(filter);
      filter.connect(this.slideLoopGain);
      this.slideLoopGain.connect(this.sfxGain);

      noise.start();
      this.slideLoopSource = noise;
    } catch {}
  }

  public stopSlide(): void {
    if (!this.isSlidingLoopActive) return;
    this.isSlidingLoopActive = false;
    if (this.slideLoopGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.slideLoopGain.gain.cancelScheduledValues(now);
      this.slideLoopGain.gain.linearRampToValueAtTime(0.001, now + 0.06);
      setTimeout(() => {
        try {
          if (this.slideLoopSource && 'stop' in this.slideLoopSource) {
            (this.slideLoopSource as AudioBufferSourceNode).stop();
            this.slideLoopSource.disconnect();
          }
          this.slideLoopGain?.disconnect();
          this.slideLoopSource = null;
          this.slideLoopGain = null;
        } catch {}
      }, 70);
    }
  }

  public playFastDrop(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.15);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playLaneChange(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(290, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.10);
  }

  // --- Hoverboard Movement Hum Loop ---

  public playHoverboard(): void {
    this.startHoverboardLoop();
  }

  private startHoverboardLoop(): void {
    if (!this.ctx || !this.ambientGain || this.isHoverboardLoopActive) return;
    try {
      this.isHoverboardLoopActive = true;
      const now = this.ctx.currentTime;

      this.hoverboardOsc1 = this.ctx.createOscillator();
      this.hoverboardOsc2 = this.ctx.createOscillator();
      this.hoverboardGain = this.ctx.createGain();

      this.hoverboardOsc1.type = 'sawtooth';
      this.hoverboardOsc1.frequency.setValueAtTime(88, now);

      this.hoverboardOsc2.type = 'sine';
      this.hoverboardOsc2.frequency.setValueAtTime(176, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      this.hoverboardGain.gain.setValueAtTime(0.001, now);
      this.hoverboardGain.gain.linearRampToValueAtTime(0.14, now + 0.25);

      this.hoverboardOsc1.connect(filter);
      this.hoverboardOsc2.connect(filter);
      filter.connect(this.hoverboardGain);
      this.hoverboardGain.connect(this.ambientGain);

      this.hoverboardOsc1.start(now);
      this.hoverboardOsc2.start(now);
    } catch {}
  }

  public stopHoverboardLoop(): void {
    if (!this.isHoverboardLoopActive) return;
    this.isHoverboardLoopActive = false;
    if (this.hoverboardGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.hoverboardGain.gain.linearRampToValueAtTime(0.001, now + 0.15);
      setTimeout(() => {
        try {
          this.hoverboardOsc1?.stop();
          this.hoverboardOsc2?.stop();
          this.hoverboardOsc1?.disconnect();
          this.hoverboardOsc2?.disconnect();
          this.hoverboardGain?.disconnect();
          this.hoverboardOsc1 = null;
          this.hoverboardOsc2 = null;
          this.hoverboardGain = null;
        } catch {}
      }, 160);
    }
  }

  public playHoverboardCrash(): void {
    this.stopHoverboardLoop();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.30);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  // --- Jetpack Takeoff & Thruster Flight Loop ---

  public playJetpack(): void {
    this.playJetpackTakeoff();
  }

  public playJetpackTakeoff(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Rocket thruster launch roar
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
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
    noiseGain.gain.setValueAtTime(0.40, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + 0.45);

    // Rising energy charge
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.35);

    oscGain.gain.setValueAtTime(0.22, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.38);

    this.startJetpackLoop();
  }

  private startJetpackLoop(): void {
    if (!this.ctx || !this.ambientGain || this.isJetpackLoopActive) return;
    try {
      this.isJetpackLoopActive = true;
      const bufferSize = this.ctx.sampleRate * 0.6;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.jetpackNoiseSource = this.ctx.createBufferSource();
      this.jetpackNoiseSource.buffer = buffer;
      this.jetpackNoiseSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(480, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.2, this.ctx.currentTime);

      this.jetpackGain = this.ctx.createGain();
      this.jetpackGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.jetpackGain.gain.linearRampToValueAtTime(0.20, this.ctx.currentTime + 0.3);

      this.jetpackNoiseSource.connect(filter);
      filter.connect(this.jetpackGain);
      this.jetpackGain.connect(this.ambientGain);

      this.jetpackNoiseSource.start();
    } catch {}
  }

  public stopJetpackLoop(): void {
    if (!this.isJetpackLoopActive) return;
    this.isJetpackLoopActive = false;
    if (this.jetpackGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.jetpackGain.gain.linearRampToValueAtTime(0.001, now + 0.2);
      setTimeout(() => {
        try {
          this.jetpackNoiseSource?.stop();
          this.jetpackNoiseSource?.disconnect();
          this.jetpackGain?.disconnect();
          this.jetpackNoiseSource = null;
          this.jetpackGain = null;
        } catch {}
      }, 220);
    }
  }

  // --- Coin & Reward Sounds (Dynamic Limiter & Musical Arpeggios) ---

  public playCoin(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Reset streak if gap exceeds 0.40s
    if (now - this.lastCoinTime < 0.40) {
      this.coinStreak = Math.min(this.coinStreak + 1, 12);
    } else {
      this.coinStreak = 0;
    }
    this.lastCoinTime = now;

    // Rate limiter: schedule coins at least 25ms apart to avoid clipping when magnet pulls 8+ coins in one frame
    const scheduledTime = Math.max(now, this.coinAudioScheduledTime + 0.025);
    this.coinAudioScheduledTime = scheduledTime;

    // Ascending pentatonic scale (C5, D5, E5, G5, A5, C6, D6, E6, G6, A6, C7, D7)
    const scale = [
      523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0, 2093.0, 2349.32
    ];
    const freq = scale[this.coinStreak % scale.length];

    // Dynamic gain reduction for rapid bursts to keep master level completely clear
    const peakGain = 0.22 * Math.pow(0.92, Math.min(this.coinStreak, 10));

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, scheduledTime);
    osc.frequency.setValueAtTime(freq * 1.5, scheduledTime + 0.04);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, scheduledTime);

    gain.gain.setValueAtTime(peakGain, scheduledTime);
    gain.gain.exponentialRampToValueAtTime(0.001, scheduledTime + 0.14);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(scheduledTime);
    osc2.start(scheduledTime);
    osc.stop(scheduledTime + 0.14);
    osc2.stop(scheduledTime + 0.14);
  }

  public playPowerup(type: string): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    switch (type) {
      case 'MAGNET':
        this.playMagnet();
        break;
      case 'JETPACK':
        this.playJetpackTakeoff();
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
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.055;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.24, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.13);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.13);
    });
  }

  public playMagnet(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(280, now);
    osc1.frequency.exponentialRampToValueAtTime(780, now + 0.30);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(560, now);
    osc2.frequency.exponentialRampToValueAtTime(1560, now + 0.30);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  public playSneakers(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.25);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playMultiplier(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const freqs = [440, 554.37, 659.25, 880, 1108.73];
    freqs.forEach((freq, i) => {
      const startTime = now + i * 0.05;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  public playShield(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    [523.25, 783.99, 1046.5, 1567.98].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      gain.gain.setValueAtTime(0.20, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.03);
      osc.stop(now + 0.38);
    });
  }

  public playShieldBreak(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
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
    noiseGain.gain.setValueAtTime(0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + 0.30);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);

    oscGain.gain.setValueAtTime(0.28, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playExpiringWarning(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    [0, 0.11].forEach((offset) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(920, now + offset);

      gain.gain.setValueAtTime(0.24, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.075);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.075);
    });
  }

  // --- Progression, Shop & UI Reward Audio ---

  public playMissionComplete(): void {
    if (!this.ctx || !this.uiGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Celebratory 4-note brass fanfare (F4, A4, C5, F5)
    const notes = [349.23, 440.0, 523.25, 698.46];
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, startTime);
      filter.frequency.exponentialRampToValueAtTime(600, startTime + 0.25);

      gain.gain.setValueAtTime(0.26, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.uiGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  public playAchievementUnlock(): void {
    if (!this.ctx || !this.uiGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Triumphant 5-note royal arpeggio (C5, G5, C6, E6, G6)
    const notes = [523.25, 783.99, 1046.5, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.065;
      const osc = this.ctx!.createOscillator();
      const osc2 = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 1.5, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.uiGain!);

      osc.start(startTime);
      osc2.start(startTime);
      osc.stop(startTime + 0.32);
      osc2.stop(startTime + 0.32);
    });
  }

  public playRewardClaim(): void {
    if (!this.ctx || !this.uiGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Cheerful double chime & coin register chime
    const freqs = [1318.51, 1567.98, 2093.0];
    freqs.forEach((freq, idx) => {
      const startTime = now + idx * 0.05;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.24, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

      osc.connect(gain);
      gain.connect(this.uiGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.22);
    });
  }

  public playPurchase(): void {
    if (!this.ctx || !this.uiGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Cash register / purchase transaction double bell chime
    [987.77, 1318.51].forEach((freq, idx) => {
      const startTime = now + idx * 0.07;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.28, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(this.uiGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.28);
    });
  }

  public playButtonClick(): void {
    if (!this.ctx || !this.uiGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.015);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    osc.connect(gain);
    gain.connect(this.uiGain);

    osc.start(now);
    osc.stop(now + 0.015);
  }

  // --- Train Warnings & 3D Spatial Audio ---

  public playTrainHorn(options?: { laneX?: number; distance?: number; speed?: number }): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Rate-limiting prioritization: enforce minimum 1.4s cooldown between train horns
    if (now - this.lastTrainHornTime < this.TRAIN_HORN_COOLDOWN) {
      return;
    }
    this.lastTrainHornTime = now;

    const laneX = options?.laneX ?? 0;
    const distance = options?.distance ?? 65;

    // Distance attenuation: scale volume smoothly based on distance
    const distFactor = Math.max(0.4, Math.min(1.0, 1.0 - (distance - 30) / 70));
    const hornVolume = 0.32 * distFactor;

    // Directional stereo panning based on track lane
    let panner: StereoPannerNode | null = null;
    if (typeof this.ctx.createStereoPanner === 'function') {
      panner = this.ctx.createStereoPanner();
      const panVal = Math.max(-0.85, Math.min(0.85, laneX / CONSTANTS.LANE_WIDTH));
      panner.pan.setValueAtTime(panVal, now);
      panner.connect(this.sfxGain);
    }

    // Two-tone brass locomotive air horn (311Hz + 233Hz)
    [311.13, 233.08].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.985, now + 0.55);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(hornVolume, now + 0.04);
      gain.gain.setValueAtTime(hornVolume * 0.9, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

      osc.connect(gain);
      if (panner) {
        gain.connect(panner);
      } else {
        gain.connect(this.sfxGain!);
      }

      osc.start(now);
      osc.stop(now + 0.58);
    });
  }

  // --- Ambient Train Rail Rumble ---

  private initAmbientTrainRumble(): void {
    if (!this.ctx || !this.ambientGain) return;
    try {
      this.trainRumbleOsc = this.ctx.createOscillator();
      this.trainRumbleOsc.type = 'sawtooth';
      const baseFreq = this.activeEnvironmentId === 'HISTORIC_QUARTER' ? 38 : 50;
      this.trainRumbleOsc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      this.trainRumbleFilter = this.ctx.createBiquadFilter();
      this.trainRumbleFilter.type = 'lowpass';
      const filterCutoff = this.activeEnvironmentId === 'HISTORIC_QUARTER' ? 105 : 155;
      this.trainRumbleFilter.frequency.setValueAtTime(filterCutoff, this.ctx.currentTime);

      this.trainRumbleGain = this.ctx.createGain();
      this.trainRumbleGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.trainRumbleOsc.connect(this.trainRumbleFilter);
      this.trainRumbleFilter.connect(this.trainRumbleGain);
      this.trainRumbleGain.connect(this.ambientGain);

      this.trainRumbleOsc.start();
    } catch {}
  }

  public setEnvironmentAmbience(envId: string): void {
    this.activeEnvironmentId = envId;
    if (!this.ctx || !this.trainRumbleOsc || !this.trainRumbleFilter) return;
    const now = this.ctx.currentTime;
    if (envId === 'HISTORIC_QUARTER') {
      // Deeper industrial mechanical rumble, heavier steam/iron frequencies
      this.trainRumbleOsc.frequency.setTargetAtTime(38, now, 1.2);
      this.trainRumbleFilter.frequency.setTargetAtTime(105, now, 1.2);
    } else {
      // Modern electric traction, higher frequency resonant hum
      this.trainRumbleOsc.frequency.setTargetAtTime(50, now, 1.2);
      this.trainRumbleFilter.frequency.setTargetAtTime(155, now, 1.2);
    }
  }

  public playEnvironmentTransition(): void {
    if (!this.ctx || !this.ambientGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;

      // Resonant transition chime (C5 -> G5 ascending bell tone)
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(523.25, now);
      chimeOsc.frequency.exponentialRampToValueAtTime(783.99, now + 0.35);
      chimeGain.gain.setValueAtTime(0.0001, now);
      chimeGain.gain.linearRampToValueAtTime(0.18, now + 0.08);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ambientGain);
      chimeOsc.start(now);
      chimeOsc.stop(now + 1.25);

      // Atmospheric whoosh noise
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.8);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / bufferSize);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const whooshFilter = this.ctx.createBiquadFilter();
      whooshFilter.type = 'bandpass';
      whooshFilter.frequency.setValueAtTime(320, now);
      whooshFilter.frequency.exponentialRampToValueAtTime(880, now + 0.4);
      whooshFilter.frequency.exponentialRampToValueAtTime(240, now + 0.8);
      whooshFilter.Q.value = 2.0;

      const whooshGain = this.ctx.createGain();
      whooshGain.gain.setValueAtTime(0.0001, now);
      whooshGain.gain.linearRampToValueAtTime(0.2, now + 0.35);
      whooshGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      noise.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(this.ambientGain);
      noise.start(now);
      noise.stop(now + 0.85);
    } catch {}
  }

  private updateAmbientTrainRumble(player: any, trackManager?: any): void {
    if (!this.ctx || !this.trainRumbleGain || this.isMuted) return;

    let nearestApproachingDist = 999;
    if (trackManager && typeof trackManager.getApproachingTrainDistance === 'function') {
      nearestApproachingDist = trackManager.getApproachingTrainDistance(player.position.z);
    } else if (trackManager && trackManager.chunks) {
      const pZ = player.position.z;
      for (const chunk of trackManager.chunks) {
        if (!chunk.obstacles) continue;
        for (const obs of chunk.obstacles) {
          if (obs.type === 'TRAIN' && obs.speed && obs.speed > 0) {
            const worldZ = chunk.chunkZ + obs.localZ;
            // Approaching ahead of player (worldZ is negative, further ahead in negative direction)
            if (worldZ < pZ) {
              const d = Math.abs(pZ - worldZ);
              if (d < nearestApproachingDist) nearestApproachingDist = d;
            }
          }
        }
      }
    }

    const now = this.ctx.currentTime;
    if (nearestApproachingDist <= 80) {
      const proximity = 1.0 - nearestApproachingDist / 80;
      const targetGain = 0.16 * proximity;
      this.trainRumbleGain.gain.setTargetAtTime(targetGain, now, 0.15);
    } else {
      this.trainRumbleGain.gain.setTargetAtTime(0.0001, now, 0.3);
    }
  }

  // --- Hazard Reactions & Chaser Feedback ---

  public playCrash(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
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
    filter.frequency.exponentialRampToValueAtTime(35, now + 0.32);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.35);
  }

  public playStumble(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.20);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playNearMiss(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.15);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playWhistle(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    try {
      // Dual-tone security whistle with 22Hz pea vibrato trill
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const gain = this.ctx.createGain();

      lfo.frequency.setValueAtTime(22, now);
      lfoGain.gain.setValueAtTime(65, now);
      lfo.connect(osc1.frequency);
      lfo.connect(osc2.frequency);

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(2450, now);
      osc2.frequency.setValueAtTime(2880, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.025);
      gain.gain.setValueAtTime(0.25, now + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      lfo.start(now);
      osc1.start(now);
      osc2.start(now);
      lfo.stop(now + 0.30);
      osc1.stop(now + 0.30);
      osc2.stop(now + 0.30);
    } catch {}
  }

  // --- Adaptive Procedural Music Engine ---

  public setMusicState(state: MusicState): void {
    if (this.musicState === state) return;
    this.musicState = state;
    this.applyStemGains(state, false);
  }

  public getMusicState(): MusicState {
    return this.musicState;
  }

  private applyStemGains(state: MusicState, instant: boolean = false): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const rampTime = instant ? 0.01 : 0.35;

    const setGain = (gainNode: GainNode | null, targetVal: number) => {
      if (!gainNode) return;
      gainNode.gain.cancelScheduledValues(now);
      if (instant) {
        gainNode.gain.setValueAtTime(targetVal, now);
      } else {
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(targetVal, now + rampTime);
      }
    };

    switch (state) {
      case 'LOBBY':
        setGain(this.lobbyStemGain, 1.0);
        setGain(this.drumStemGain, 0.4);
        setGain(this.bassStemGain, 0.5);
        setGain(this.arpStemGain, 0.0);
        setGain(this.intenseStemGain, 0.0);
        setGain(this.jetpackStemGain, 0.0);
        break;
      case 'RUNNING_NORMAL':
        setGain(this.lobbyStemGain, 0.0);
        setGain(this.drumStemGain, 1.0);
        setGain(this.bassStemGain, 1.0);
        setGain(this.arpStemGain, 0.0);
        setGain(this.intenseStemGain, 0.0);
        setGain(this.jetpackStemGain, 0.0);
        break;
      case 'RUNNING_FAST':
        setGain(this.lobbyStemGain, 0.0);
        setGain(this.drumStemGain, 1.0);
        setGain(this.bassStemGain, 1.0);
        setGain(this.arpStemGain, 0.85);
        setGain(this.intenseStemGain, 0.0);
        setGain(this.jetpackStemGain, 0.0);
        break;
      case 'RUNNING_INTENSE':
        setGain(this.lobbyStemGain, 0.0);
        setGain(this.drumStemGain, 1.0);
        setGain(this.bassStemGain, 1.0);
        setGain(this.arpStemGain, 1.0);
        setGain(this.intenseStemGain, 0.95);
        setGain(this.jetpackStemGain, 0.0);
        break;
      case 'JETPACK':
        // Drums and bass drop out; ethereal soaring pad takes over
        setGain(this.lobbyStemGain, 0.0);
        setGain(this.drumStemGain, 0.0);
        setGain(this.bassStemGain, 0.0);
        setGain(this.arpStemGain, 0.3);
        setGain(this.intenseStemGain, 0.0);
        setGain(this.jetpackStemGain, 1.0);
        break;
      case 'GAME_OVER':
        setGain(this.lobbyStemGain, 0.0);
        setGain(this.drumStemGain, 0.0);
        setGain(this.bassStemGain, 0.0);
        setGain(this.arpStemGain, 0.0);
        setGain(this.intenseStemGain, 0.0);
        setGain(this.jetpackStemGain, 0.0);
        this.playGameOverChord();
        break;
    }
  }

  public startMusic(): void {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.currentStep = 0;
    this.scheduleNextMusicStep();
  }

  public pauseMusic(): void {
    this.isMusicPlaying = false;
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public resumeMusic(): void {
    if (!this.isMusicPlaying && this.musicState !== 'GAME_OVER') {
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

  private scheduleNextMusicStep(): void {
    if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;

    // Tempo: 104 BPM in Lobby, 132 BPM during runner gameplay
    const tempo = this.musicState === 'LOBBY' ? 104 : 132;
    const stepDuration = 60 / tempo / 4; // 16th note

    this.renderMusicStep(this.currentStep, stepDuration);
    this.currentStep = (this.currentStep + 1) % 64;

    this.musicTimer = window.setTimeout(() => {
      this.scheduleNextMusicStep();
    }, stepDuration * 1000);
  }

  private renderMusicStep(step: number, stepDuration: number): void {
    if (!this.ctx || !this.musicGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Drums (Kicks on 0, 4, 8, 12; Snare on 4, 12; Hi-Hats on odd 16ths)
    if (step % 16 === 0 || (step % 16 === 8 && this.musicState !== 'LOBBY')) {
      this.playKickDrum(now);
    }
    if ((step % 16 === 4 || step % 16 === 12) && this.musicState !== 'LOBBY') {
      this.playSnareDrum(now);
    }
    if (step % 2 === 1) {
      this.playHiHat(now, step % 4 === 1);
    }

    // 2. Bassline Pattern (D minor pentatonic groove)
    const bassline = [
      146.83, 0, 146.83, 174.61, // D3, -, D3, F3
      0, 196.0, 207.65, 196.0,   // -, G3, G#3, G3
      174.61, 0, 146.83, 0,      // F3, -, D3, -
      130.81, 146.83, 0, 174.61  // C3, D3, -, F3
    ];
    const bassFreq = bassline[step % 16];
    if (bassFreq > 0) {
      this.playBassNote(bassFreq, now, stepDuration);
    }

    // 3. Arpeggiator Stem (Active during RUNNING_FAST & RUNNING_INTENSE)
    if (this.arpStemGain && this.arpStemGain.gain.value > 0.01) {
      const arpNotes = [587.33, 698.46, 783.99, 880.0, 1046.5, 880.0, 783.99, 698.46];
      const arpFreq = arpNotes[step % 8];
      this.playArpNote(arpFreq, now, stepDuration);
    }

    // 4. Intense Lead Stabs (Active during RUNNING_INTENSE)
    if (this.intenseStemGain && this.intenseStemGain.gain.value > 0.01 && (step % 16 === 0 || step % 16 === 14)) {
      this.playIntenseStab(now, stepDuration);
    }

    // 5. Lobby Electric Piano Warm Chords
    if (this.musicState === 'LOBBY' && step % 16 === 0) {
      const chords = [
        [146.83, 220.0, 261.63, 329.63], // Dm9
        [116.54, 174.61, 220.0, 261.63], // Bbmaj7
        [174.61, 220.0, 261.63, 329.63], // Fmaj7
        [130.81, 164.81, 196.0, 233.08]  // C7
      ];
      const chord = chords[Math.floor(step / 16) % 4];
      this.playLobbyChord(chord, now, stepDuration * 14);
    }

    // 6. Jetpack Ethereal Pad
    if (this.musicState === 'JETPACK' && step % 16 === 0) {
      this.playJetpackPad(now, stepDuration * 15);
    }
  }

  // --- Music Synthesizer Stems ---

  private playKickDrum(now: number): void {
    if (!this.ctx || !this.drumStemGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(135, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.09);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

    osc.connect(gain);
    gain.connect(this.drumStemGain);

    osc.start(now);
    osc.stop(now + 0.10);
  }

  private playSnareDrum(now: number): void {
    if (!this.ctx || !this.drumStemGain) return;
    // Tone component
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    oscGain.gain.setValueAtTime(0.25, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(oscGain);
    oscGain.connect(this.drumStemGain);
    osc.start(now);
    osc.stop(now + 0.09);

    // Noise snap
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.22, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.drumStemGain);
      noise.start(now);
      noise.stop(now + 0.12);
    } catch {}
  }

  private playHiHat(now: number, accent: boolean): void {
    if (!this.ctx || !this.drumStemGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(8500, now);

    const vol = accent ? 0.07 : 0.045;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

    osc.connect(gain);
    gain.connect(this.drumStemGain);

    osc.start(now);
    osc.stop(now + 0.038);
  }

  private playBassNote(freq: number, now: number, duration: number): void {
    if (!this.ctx || !this.bassStemGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq / 2, now); // Sub-octave

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(580, now);
    filter.frequency.exponentialRampToValueAtTime(110, now + duration * 0.9);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.92);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bassStemGain);

    osc.start(now);
    osc.stop(now + duration * 0.92);
  }

  private playArpNote(freq: number, now: number, duration: number): void {
    if (!this.ctx || !this.arpStemGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.Q.setValueAtTime(2.5, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.85);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.arpStemGain);

    osc.start(now);
    osc.stop(now + duration * 0.85);
  }

  private playIntenseStab(now: number, duration: number): void {
    if (!this.ctx || !this.intenseStemGain) return;
    [293.66, 349.23, 440.0, 523.25].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 1.8);

      osc.connect(gain);
      gain.connect(this.intenseStemGain!);

      osc.start(now);
      osc.stop(now + duration * 1.8);
    });
  }

  private playLobbyChord(chord: number[], now: number, duration: number): void {
    if (!this.ctx || !this.lobbyStemGain) return;
    chord.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.lobbyStemGain!);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  private playJetpackPad(now: number, duration: number): void {
    if (!this.ctx || !this.jetpackStemGain) return;
    // Soaring high suspended pad chords (Dmaj9: D5, F#5, A5, C#6)
    [587.33, 739.99, 880.0, 1108.73].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.linearRampToValueAtTime(1600, now + duration * 0.5);
      filter.frequency.linearRampToValueAtTime(700, now + duration);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.jetpackStemGain!);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  private playGameOverChord(): void {
    if (!this.ctx || !this.musicGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Descending melancholy resolution chords: Dm -> Bb -> A7sus4
    const chords = [
      [146.83, 220.0, 261.63, 349.23], // Dm
      [116.54, 174.61, 233.08, 349.23], // Bb
      [110.0, 164.81, 220.0, 293.66]   // A7sus4
    ];
    chords.forEach((chord, chordIdx) => {
      const startTime = now + chordIdx * 0.45;
      chord.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

        osc.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });
    });
  }

  // --- Resource Cleanup ---

  public dispose(): void {
    this.stopMusic();
    this.stopSlide();
    this.stopHoverboardLoop();
    this.stopJetpackLoop();

    if (this.trainRumbleOsc) {
      try {
        this.trainRumbleOsc.stop();
        this.trainRumbleOsc.disconnect();
      } catch {}
      this.trainRumbleOsc = null;
    }

    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}
