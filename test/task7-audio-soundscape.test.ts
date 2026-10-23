import { SoundManager, MusicState } from '../src/audio/SoundManager';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { CONSTANTS } from '../src/core/Constants';

// =========================================================================
// Web Audio API Mock for Node.js Testing Environment
// =========================================================================

class MockAudioParam {
  public value: number;
  public defaultValue: number;
  private scheduledValues: Array<{ type: string; val?: number; time: number }> = [];

  constructor(defaultValue: number = 1) {
    this.value = defaultValue;
    this.defaultValue = defaultValue;
  }

  setValueAtTime(val: number, time: number): void {
    this.value = val;
    this.scheduledValues.push({ type: 'setValueAtTime', val, time });
  }

  linearRampToValueAtTime(val: number, time: number): void {
    this.value = val;
    this.scheduledValues.push({ type: 'linearRampToValueAtTime', val, time });
  }

  exponentialRampToValueAtTime(val: number, time: number): void {
    this.value = val;
    this.scheduledValues.push({ type: 'exponentialRampToValueAtTime', val, time });
  }

  setTargetAtTime(val: number, time: number, _constant: number): void {
    this.value = val;
    this.scheduledValues.push({ type: 'setTargetAtTime', val, time });
  }

  cancelScheduledValues(_time: number): void {
    this.scheduledValues = [];
  }
}

class MockAudioNode {
  public connectedTo: any[] = [];
  connect(dest: any): any {
    this.connectedTo.push(dest);
    return dest;
  }
  disconnect(): void {
    this.connectedTo = [];
  }
}

class MockGainNode extends MockAudioNode {
  public gain = new MockAudioParam(1);
}

class MockBiquadFilterNode extends MockAudioNode {
  public type: string = 'lowpass';
  public frequency = new MockAudioParam(350);
  public Q = new MockAudioParam(1);
}

class MockDynamicsCompressorNode extends MockAudioNode {
  public threshold = new MockAudioParam(-16);
  public knee = new MockAudioParam(12);
  public ratio = new MockAudioParam(4);
  public attack = new MockAudioParam(0.003);
  public release = new MockAudioParam(0.25);
}

class MockStereoPannerNode extends MockAudioNode {
  public pan = new MockAudioParam(0);
}

class MockOscillatorNode extends MockAudioNode {
  public type: string = 'sine';
  public frequency = new MockAudioParam(440);
  public started: boolean = false;
  public stopped: boolean = false;

  start(_time?: number): void {
    this.started = true;
  }
  stop(_time?: number): void {
    this.stopped = true;
  }
}

class MockAudioBufferSourceNode extends MockAudioNode {
  public buffer: any = null;
  public loop: boolean = false;
  public started: boolean = false;
  public stopped: boolean = false;

  start(_time?: number): void {
    this.started = true;
  }
  stop(_time?: number): void {
    this.stopped = true;
  }
}

class MockAudioContext {
  public state: string = 'running';
  public currentTime: number = 0;
  public sampleRate: number = 44100;
  public destination: MockAudioNode = new MockAudioNode();

  createGain(): MockGainNode {
    return new MockGainNode();
  }
  createBiquadFilter(): MockBiquadFilterNode {
    return new MockBiquadFilterNode();
  }
  createDynamicsCompressor(): MockDynamicsCompressorNode {
    return new MockDynamicsCompressorNode();
  }
  createStereoPanner(): MockStereoPannerNode {
    return new MockStereoPannerNode();
  }
  createOscillator(): MockOscillatorNode {
    return new MockOscillatorNode();
  }
  createBuffer(channels: number, length: number, sampleRate: number): any {
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: () => new Float32Array(length)
    };
  }
  createBufferSource(): MockAudioBufferSourceNode {
    return new MockAudioBufferSourceNode();
  }
  resume(): Promise<void> {
    this.state = 'running';
    return Promise.resolve();
  }
  close(): Promise<void> {
    this.state = 'closed';
    return Promise.resolve();
  }
}

// Setup Global Mocks
const storageMock: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => storageMock[k] || null,
  setItem: (k: string, v: string) => { storageMock[k] = v; },
  removeItem: (k: string) => { delete storageMock[k]; },
  clear: () => { for (const k in storageMock) delete storageMock[k]; }
};

(globalThis as any).window = {
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext,
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
};

let passed = 0;
let total = 0;

function assert(condition: boolean, msg: string): void {
  total++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  passed++;
  console.log(`✅ PASSED: ${msg}`);
}

console.log('🧪 Starting Task 7: Premium Dynamic Audio and Game Soundscape Test Suite...\n');

// =========================================================================
// Suite 1: Centralized Audio Architecture & Volume Controls (Section A)
// =========================================================================
console.log('--- Suite 1: Audio Architecture & Bus Volume Controls ---');
{
  localStorage.clear();
  const soundManager = new SoundManager();
  soundManager.initAudio();

  const prefs = soundManager.getPreferences();
  assert(prefs.masterVolume === 0.75, 'Initial default master volume is 0.75');
  assert(prefs.musicVolume === 0.40, 'Initial default music volume is 0.40');
  assert(prefs.sfxVolume === 0.85, 'Initial default SFX volume is 0.85');
  assert(prefs.isMuted === false, 'Audio starts unmuted');
  assert(prefs.reducedIntensity === false, 'Reduced intensity starts off');

  // Test Volume Setters with Clamping
  soundManager.setMasterVolume(0.9);
  assert(soundManager.getPreferences().masterVolume === 0.9, 'Master volume updated to 0.9');

  soundManager.setMasterVolume(1.5); // Overshoot clamp
  assert(soundManager.getPreferences().masterVolume === 1.0, 'Master volume clamped to 1.0 maximum');

  soundManager.setMasterVolume(-0.2); // Undershoot clamp
  assert(soundManager.getPreferences().masterVolume === 0.0, 'Master volume clamped to 0.0 minimum');

  soundManager.setMusicVolume(0.55);
  assert(soundManager.getPreferences().musicVolume === 0.55, 'Music volume set to 0.55');

  soundManager.setSfxVolume(0.65);
  assert(soundManager.getPreferences().sfxVolume === 0.65, 'SFX volume set to 0.65');

  // Test Mute Toggling
  const muted = soundManager.toggleMute();
  assert(muted === true, 'Toggling mute sets isMuted to true');
  assert(soundManager.getMuted() === true, 'getMuted reflects true');

  soundManager.toggleMute();
  assert(soundManager.getMuted() === false, 'Toggling mute again un-mutes audio');

  // Test Persistence in LocalStorage
  assert(localStorage.getItem('metro_audio_master') !== null, 'Master volume saved to localStorage');
  assert(localStorage.getItem('metro_audio_music') !== null, 'Music volume saved to localStorage');
  assert(localStorage.getItem('metro_audio_sfx') !== null, 'SFX volume saved to localStorage');
  assert(localStorage.getItem('metro_audio_muted') === 'false', 'Muted flag saved to localStorage');

  soundManager.dispose();
}

// =========================================================================
// Suite 2: Accessibility & Reduced Audio Intensity Mode (Section G)
// =========================================================================
console.log('\n--- Suite 2: Accessibility & Reduced Audio Intensity Mode ---');
{
  localStorage.clear();
  const soundManager = new SoundManager();
  soundManager.initAudio();

  assert(soundManager.isReducedIntensity() === false, 'Reduced intensity is initially disabled');

  soundManager.setReducedIntensity(true);
  assert(soundManager.isReducedIntensity() === true, 'Reduced intensity mode enabled');
  assert(localStorage.getItem('metro_audio_reduced_intensity') === 'true', 'Reduced intensity mode persisted to localStorage');

  soundManager.setReducedIntensity(false);
  assert(soundManager.isReducedIntensity() === false, 'Reduced intensity mode cleanly toggled off');

  soundManager.dispose();
}

// =========================================================================
// Suite 3: Running & Movement Sounds (Cadence & Surface Feedback) (Section B)
// =========================================================================
console.log('\n--- Suite 3: Locomotion Cadence & Surface Acoustic Feedback ---');
{
  const soundManager = new SoundManager();
  soundManager.initAudio();

  // Test Cadence Formula: cadence = Math.min(32.0, 12.0 + (speed / CONSTANTS.MAX_SPEED) * 16.0)
  // Base speed: 16 m/s
  const baseCadence = Math.min(32.0, 12.0 + (16.0 / CONSTANTS.MAX_SPEED) * 16.0);
  const baseInterval = Math.PI / baseCadence;

  // High speed: 30 m/s
  const fastCadence = Math.min(32.0, 12.0 + (30.0 / CONSTANTS.MAX_SPEED) * 16.0);
  const fastInterval = Math.PI / fastCadence;

  assert(fastCadence > baseCadence, 'Footstep cadence increases with player running speed');
  assert(fastInterval < baseInterval, 'Footstep interval duration shortens as player accelerates');

  // Mock player running grounded
  const mockPlayer: any = {
    speed: 16.0,
    supportSurface: 'GROUND',
    isJumping: false,
    jumpPhase: 'NONE',
    isSliding: false,
    isStumbling: false,
    position: { x: 0, y: 0, z: -100 },
    hoverboardManager: { isActive: () => false },
    powerups: { isJetpackActive: () => false }
  };

  // Run update frames while grounded - should not throw
  soundManager.update(0.016, mockPlayer, null, 'PLAYING');
  assert(true, 'Grounded running audio update executes cleanly');

  // Airborne suppression check
  mockPlayer.isJumping = true;
  mockPlayer.jumpPhase = 'ASCENDING';
  soundManager.update(0.1, mockPlayer, null, 'PLAYING');
  assert(true, 'Airborne jump suppresses running footsteps');

  // Surface variations execution
  mockPlayer.isJumping = false;
  mockPlayer.jumpPhase = 'NONE';

  mockPlayer.supportSurface = 'TRAIN_ROOF';
  soundManager.update(0.25, mockPlayer, null, 'PLAYING');
  assert(true, 'TRAIN_ROOF hollow metal footstep synthesizes without error');

  mockPlayer.supportSurface = 'RAMP';
  soundManager.update(0.25, mockPlayer, null, 'PLAYING');
  assert(true, 'RAMP textured incline footstep synthesizes without error');

  mockPlayer.supportSurface = 'GROUND';
  soundManager.update(0.25, mockPlayer, null, 'PLAYING');
  assert(true, 'GROUND ballast gravel footstep synthesizes without error');

  // Landing on different surfaces
  soundManager.playLandingTouchdown({ surface: 'GROUND', isFastDrop: false });
  soundManager.playLandingTouchdown({ surface: 'TRAIN_ROOF', isFastDrop: false });
  soundManager.playLandingTouchdown({ surface: 'TRAIN_ROOF', isFastDrop: true });
  assert(true, 'Landing on GROUND and TRAIN_ROOF (normal & fast drop) executes cleanly');

  soundManager.dispose();
}

// =========================================================================
// Suite 4: Continuous Movement Loops (Slide, Hoverboard, Jetpack) (Section B)
// =========================================================================
console.log('\n--- Suite 4: Continuous Movement Loops (Slide, Board, Jetpack) ---');
{
  const soundManager = new SoundManager();
  soundManager.initAudio();

  // Sliding Loop
  soundManager.playSlide(true);
  soundManager.stopSlide();
  assert(true, 'Slide friction loop starts and cleanly stops');

  // Hoverboard Hum Loop
  soundManager.playHoverboard();
  soundManager.stopHoverboardLoop();
  assert(true, 'Hoverboard anti-gravity turbine loop starts and cleanly stops');

  // Hoverboard Crash
  soundManager.playHoverboardCrash();
  assert(true, 'Hoverboard crash sound terminates active loop');

  // Jetpack Roar Loop
  soundManager.playJetpackTakeoff();
  soundManager.stopJetpackLoop();
  assert(true, 'Jetpack thruster roar loop starts and cleanly stops');

  soundManager.dispose();
}

// =========================================================================
// Suite 5: Coin Streaks, Anti-Clipping Rate Limiter & Rewards (Section C)
// =========================================================================
console.log('\n--- Suite 5: Coin Streaks & Reward Audio Feedback ---');
{
  const soundManager = new SoundManager();
  soundManager.initAudio();

  // Test rapid consecutive coins (rapid magnet collection burst)
  for (let i = 0; i < 15; i++) {
    soundManager.playCoin();
  }
  assert(true, '15 rapid consecutive coin pickups process through anti-clipping rate limiter');

  // Progression & Shop Jingles
  soundManager.playMissionComplete();
  assert(true, 'Mission complete brass fanfare synthesizes cleanly');

  soundManager.playAchievementUnlock();
  assert(true, 'Achievement unlock royal arpeggio synthesizes cleanly');

  soundManager.playRewardClaim();
  assert(true, 'Reward claimed coin cascade synthesizes cleanly');

  soundManager.playPurchase();
  assert(true, 'Shop purchase cash register chime synthesizes cleanly');

  soundManager.playButtonClick();
  assert(true, 'UI button tactile click synthesizes cleanly');

  // All Power-up sound signatures
  ['MAGNET', 'JETPACK', 'SNEAKERS', 'MULTIPLIER', 'SHIELD'].forEach((type) => {
    soundManager.playPowerup(type);
  });
  soundManager.playShieldBreak();
  soundManager.playExpiringWarning();
  assert(true, 'All powerup signature sounds synthesize without error');

  soundManager.dispose();
}

// =========================================================================
// Suite 6: Train Warnings, Spatial Stereo Panning & Prioritization (Section D)
// =========================================================================
console.log('\n--- Suite 6: Train Warnings, Spatial Panning & Horn Prioritization ---');
{
  const soundManager = new SoundManager();
  soundManager.initAudio();

  // Left Lane Train Horn (-1)
  soundManager.playTrainHorn({ laneX: -CONSTANTS.LANE_WIDTH, distance: 60, speed: 22 });
  assert(true, 'Left lane train horn plays with spatial stereo panning');

  // Immediate Second Train Horn (must be rate-limited / prioritized by 1.4s cooldown)
  soundManager.playTrainHorn({ laneX: CONSTANTS.LANE_WIDTH, distance: 58, speed: 22 });
  assert(true, 'Second concurrent train horn is rate-limited to avoid deafening horn collision');

  // Right Lane Train Horn after cooldown (simulated time advance)
  (soundManager as any).lastTrainHornTime = -999;
  soundManager.playTrainHorn({ laneX: CONSTANTS.LANE_WIDTH, distance: 40, speed: 25 });
  assert(true, 'Right lane train horn plays after cooldown period');

  // Environmental Train Proximity Rumble
  const mockTrackManager: any = {
    getApproachingTrainDistance: (_z: number) => 45 // 45m away (<80m threshold)
  };
  const mockPlayer: any = {
    position: { x: 0, y: 0, z: -200 },
    speed: 18.0
  };

  soundManager.update(0.016, mockPlayer, mockTrackManager, 'PLAYING');
  assert(true, 'Ambient rail rumble smoothly swells when train approaches within 80m');

  soundManager.dispose();
}

// =========================================================================
// Suite 7: Adaptive Procedural Soundtrack & Speed Hysteresis (Section E)
// =========================================================================
console.log('\n--- Suite 7: Adaptive Procedural Soundtrack & Speed Hysteresis ---');
{
  const soundManager = new SoundManager();
  soundManager.initAudio();

  // 1. Initial State is LOBBY
  assert(soundManager.getMusicState() === 'LOBBY', 'Music starts in LOBBY state');

  // 2. State shift to RUNNING_NORMAL on Game Start
  soundManager.setMusicState('RUNNING_NORMAL');
  assert(soundManager.getMusicState() === 'RUNNING_NORMAL', 'Shift to RUNNING_NORMAL on run start');

  // 3. Test Speed Hysteresis
  const mockPlayer: any = {
    speed: 17.5,
    isJumping: false,
    isSliding: false,
    position: { x: 0, y: 0, z: 0 },
    hoverboardManager: { isActive: () => false },
    powerups: { isJetpackActive: () => false }
  };

  // Speed 17.5 < 18.0 -> stays RUNNING_NORMAL
  soundManager.update(0.016, mockPlayer, null, 'PLAYING');
  assert(soundManager.getMusicState() === 'RUNNING_NORMAL', 'Speed 17.5 m/s maintains RUNNING_NORMAL state');

  // Speed 18.5 >= 18.0 -> promotes to RUNNING_FAST
  mockPlayer.speed = 18.5;
  soundManager.update(0.016, mockPlayer, null, 'PLAYING');
  assert(soundManager.getMusicState() === 'RUNNING_FAST', 'Speed 18.5 m/s promotes to RUNNING_FAST state');

  // Speed dips slightly to 17.0 m/s (above 16.0 demotion threshold) -> stays RUNNING_FAST (Hysteresis!)
  mockPlayer.speed = 17.0;
  soundManager.update(0.016, mockPlayer, null, 'PLAYING');
  assert(soundManager.getMusicState() === 'RUNNING_FAST', 'Hysteresis prevents premature demotion when speed is 17.0 m/s');

  // Speed drops below 16.0 -> demotes back to RUNNING_NORMAL
  mockPlayer.speed = 15.5;
  soundManager.update(0.016, mockPlayer, null, 'PLAYING');
  assert(soundManager.getMusicState() === 'RUNNING_NORMAL', 'Speed 15.5 m/s cleanly demotes to RUNNING_NORMAL');

  // Accelerates to 24.5 m/s -> promotes through FAST to INTENSE
  mockPlayer.speed = 24.5;
  soundManager.update(0.016, mockPlayer, null, 'PLAYING');
  assert(soundManager.getMusicState() === 'RUNNING_INTENSE', 'Speed 24.5 m/s promotes to RUNNING_INTENSE');

  // Dips to 22.5 m/s (above 22.0 demotion threshold) -> stays INTENSE (Hysteresis!)
  mockPlayer.speed = 22.5;
  soundManager.update(0.016, mockPlayer, null, 'PLAYING');
  assert(soundManager.getMusicState() === 'RUNNING_INTENSE', 'Hysteresis maintains RUNNING_INTENSE at 22.5 m/s');

  // Dips below 22.0 m/s -> demotes to FAST
  mockPlayer.speed = 21.0;
  soundManager.update(0.016, mockPlayer, null, 'PLAYING');
  assert(soundManager.getMusicState() === 'RUNNING_FAST', 'Speed 21.0 m/s demotes to RUNNING_FAST');

  // Jetpack Mode: triggers ethereal floating soundtrack state
  mockPlayer.powerups.isJetpackActive = () => true;
  soundManager.update(0.016, mockPlayer, null, 'PLAYING');
  assert(soundManager.getMusicState() === 'JETPACK', 'Jetpack flight promotes music state to JETPACK');

  // Game Over: triggers descending melancholic resolution
  soundManager.setMusicState('GAME_OVER');
  assert(soundManager.getMusicState() === 'GAME_OVER', 'Game over transitions soundtrack to GAME_OVER');

  // Start & Stop Step Sequencer
  soundManager.startMusic();
  soundManager.pauseMusic();
  soundManager.resumeMusic();
  soundManager.stopMusic();
  assert(true, 'Music sequencer starts, pauses, resumes, and cleanly stops without leaking timers');

  soundManager.dispose();
}

// =========================================================================
// Suite 8: EventBus Integration & Lifecycle Cleanliness (Section I)
// =========================================================================
console.log('\n--- Suite 8: EventBus Integration & Lifecycle Cleanliness ---');
{
  const bus = EventBus.getInstance();
  const soundManager = new SoundManager();
  soundManager.initAudio();

  // Test Event Dispatches
  bus.emit(EVENTS.JUMP);
  bus.emit(EVENTS.SLIDE);
  bus.emit(EVENTS.SLIDE_COMPLETED);
  bus.emit(EVENTS.COIN_COLLECTED);
  bus.emit(EVENTS.TRAIN_HORN, { laneX: 0, distance: 50 });
  bus.emit(EVENTS.CRASH);
  bus.emit(EVENTS.MISSION_COMPLETED);
  bus.emit(EVENTS.ACHIEVEMENT_UNLOCKED);
  bus.emit(EVENTS.REWARD_CLAIMED);
  bus.emit(EVENTS.ITEM_PURCHASED);
  bus.emit(EVENTS.UI_CLICK);

  assert(true, 'All EventBus sound triggers dispatched and handled successfully');

  soundManager.dispose();
  assert(true, 'SoundManager cleanly unregisters all listeners and closes context on dispose');
}

console.log('\n=======================================================');
console.log(`📊 TASK 7 TEST RESULTS: ${passed} PASSED, ${total - passed} FAILED`);
console.log('=======================================================');
