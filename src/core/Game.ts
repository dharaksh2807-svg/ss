import * as THREE from 'three';
import { CONSTANTS, isDeveloperMode } from './Constants';
import { EventBus, EVENTS } from './EventBus';
import { InputManager } from './InputManager';
import { SoundManager } from '../audio/SoundManager';
import { WorldScene } from '../scene/WorldScene';
import { CameraController } from '../scene/CameraController';
import { Player } from '../player/Player';
import { TrackManager } from '../track/TrackManager';
import { ObstacleInstance } from '../track/ObstacleFactory';
import { HUD } from '../ui/HUD';
import { StartScreen } from '../ui/StartScreen';
import { PauseModal } from '../ui/PauseModal';
import { GameOverModal } from '../ui/GameOverModal';
import { SettingsModal } from '../ui/SettingsModal';
import { ShopModal } from '../ui/ShopModal';
import { UpgradeManager } from '../player/UpgradeManager';
import { MissionsModal } from '../ui/MissionsModal';
import { EventSelectModal } from '../ui/EventSelectModal';
import { CharacterSelectModal } from '../ui/CharacterSelectModal';
import { HoverboardSelectModal } from '../ui/HoverboardSelectModal';
import { ProfileModal } from '../ui/ProfileModal';
import { DailyRewardModal } from '../ui/DailyRewardModal';
import { ProgressionManager } from '../progression/ProgressionManager';
import { GameMode } from '../progression/ProgressionTypes';
import { TrainScenarioRunner } from '../debug/TrainScenarioRunner';
import { LocomotionVFX } from '../scene/LocomotionVFX';
import { ChaserModel } from '../characters/ChaserModel';
import { OpeningSequenceController } from '../chase/OpeningSequenceController';
import { PracticeController } from '../practice/PracticeController';
import { PracticeModal } from '../ui/PracticeModal';
import { DevTestArena } from '../debug/DevTestArena';
import { PracticeModuleId } from '../practice/PracticeTypes';
import { GraphicsManager } from '../scene/GraphicsManager';
import { EnvironmentSelectModal } from '../ui/EnvironmentSelectModal';
import { EnvironmentManager, EnvironmentId, MODERN_METRO_THEME, HISTORIC_QUARTER_THEME, UNDERGROUND_METRO_THEME } from '../environment/EnvironmentConfig';
import { EnvironmentDirector } from '../environment/EnvironmentDirector';
import { EnvironmentalEncounterDirector, LandmarkType } from '../environment/EnvironmentalEncounterDirector';
import { EnvironmentRegistry } from '../environment/EnvironmentRegistry';
import { ReviveManager } from '../revive/ReviveManager';
import { SkillComboManager } from './SkillComboManager';
import { DailyChallengeManager } from './DailyChallengeManager';
import { ReviveModal } from '../ui/ReviveModal';
import { DailyChallengeModal } from '../ui/DailyChallengeModal';
import { CrashReplayManager } from '../replay/CrashReplayManager';
import { ReplayHUD } from '../ui/ReplayHUD';
import { PhotoModeController } from '../scene/PhotoModeController';
import { PhotoModeModal } from '../ui/PhotoModeModal';
import { SecretRouteDirector } from '../track/SecretRouteDirector';
import { JunctionDirector } from '../track/JunctionDirector';
import { BugSnapshotManager } from '../debug/BugSnapshotManager';
import { BugReproductionLoader } from '../debug/BugReproductionLoader';
import { DebugVisualizer } from '../debug/DebugVisualizer';
import { DevBugReportModal } from '../ui/DevBugReportModal';
import { BugSnapshotPackage } from '../debug/BugSnapshotTypes';

export type GameLifecycleState = 'MENU' | 'PLAYING' | 'PAUSED' | 'DYING' | 'REVIVE_OFFER' | 'GAMEOVER' | 'REPLAY';

export class Game {
  private canvas: HTMLCanvasElement;
  private worldScene: WorldScene;
  private cameraController: CameraController;
  private player: Player;
  private trackManager: TrackManager;
  private soundManager: SoundManager;
  private inputManager: InputManager;
  private locomotionVFX: LocomotionVFX;
  private chaser: ChaserModel;
  private openingSequence: OpeningSequenceController;

  private hud: HUD;
  private startScreen: StartScreen;
  private pauseModal: PauseModal;
  private gameOverModal: GameOverModal;
  private settingsModal: SettingsModal;
  private shopModal: ShopModal;
  private missionsModal: MissionsModal;
  private eventSelectModal: EventSelectModal;
  private characterSelectModal: CharacterSelectModal;
  private hoverboardSelectModal: HoverboardSelectModal;
  private profileModal: ProfileModal;
  private dailyRewardModal: DailyRewardModal;
  private environmentSelectModal: EnvironmentSelectModal;
  private practiceController: PracticeController;
  private practiceModal: PracticeModal;
  private devTestArena: DevTestArena;
  private reviveManager: ReviveManager;
  private reviveModal: ReviveModal;
  private dailyChallengeModal: DailyChallengeModal;
  private replayHUD: ReplayHUD;
  private photoModeController: PhotoModeController;
  private photoModeModal: PhotoModeModal;
  private crashReplayManager: CrashReplayManager = CrashReplayManager.getInstance();
  private bugSnapshotManager: BugSnapshotManager = BugSnapshotManager.getInstance();
  private bugReproductionLoader: BugReproductionLoader = BugReproductionLoader.getInstance();
  private debugVisualizer: DebugVisualizer = DebugVisualizer.getInstance();
  private devBugReportModal: DevBugReportModal;

  private progression: ProgressionManager;
  private lifecycleState: GameLifecycleState = 'MENU';
  private lastTime: number = 0;
  private score: number = 0;
  private coinsCount: number = 0;
  private scoreMultiplier: number = 1;

  // Active Challenge Game Mode State
  private activeGameMode: GameMode = 'NORMAL';
  private timeTrialRemaining: number = 60.0;
  private coinRushElapsed: number = 0.0;

  // Collision Debugging Visualization Group
  private debugGroup: THREE.Group = new THREE.Group();
  private debugOverlayEl: HTMLElement | null = null;
  private worldGenOverlayEl: HTMLElement | null = null;

  // Performance telemetry tracker
  private frameTimes: number[] = [];

  // Fast Retry & Game Over delay handling (Task 2)
  private isRestartInProgress: boolean = false;
  private deathTimeoutId: number | null = null;
  private gameOverTimeoutId: number | null = null;
  private lastResultMeta: any = null;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.worldScene = new WorldScene(this.canvas);
    this.worldScene.scene.add(this.debugGroup);
    this.cameraController = new CameraController();
    this.player = new Player();
    this.worldScene.scene.add(this.player.mesh);

    this.trackManager = new TrackManager(this.worldScene.scene);
    this.soundManager = new SoundManager();
    this.inputManager = new InputManager();
    this.locomotionVFX = new LocomotionVFX(this.worldScene.scene);

    this.chaser = new ChaserModel();
    this.worldScene.scene.add(this.chaser.mesh);
    this.trackManager.setChaser(this.chaser);
    this.player.setChaser(this.chaser);
    this.openingSequence = new OpeningSequenceController(this.player, this.cameraController, this.chaser);

    this.progression = ProgressionManager.getInstance();

    this.hud = new HUD(this.player.powerups);
    this.startScreen = new StartScreen();
    this.pauseModal = new PauseModal();
    this.gameOverModal = new GameOverModal();
    this.settingsModal = new SettingsModal(this.soundManager);
    this.shopModal = new ShopModal();
    this.missionsModal = new MissionsModal();
    this.eventSelectModal = new EventSelectModal();
    this.characterSelectModal = new CharacterSelectModal();
    this.hoverboardSelectModal = new HoverboardSelectModal();
    this.profileModal = new ProfileModal();
    this.dailyRewardModal = new DailyRewardModal();
    this.environmentSelectModal = new EnvironmentSelectModal();
    this.reviveManager = ReviveManager.getInstance();
    this.reviveModal = new ReviveModal();
    this.dailyChallengeModal = new DailyChallengeModal();
    this.replayHUD = new ReplayHUD();
    this.photoModeController = PhotoModeController.getInstance();
    this.photoModeController.init(this.cameraController, this.worldScene);
    this.photoModeModal = new PhotoModeModal();
    this.photoModeModal.init(this.worldScene);

    this.practiceController = new PracticeController(this.player, this.trackManager, () => this.goToMenu());
    this.practiceModal = new PracticeModal(this.practiceController, (modId, isHarder) => this.startPractice(modId, isHarder));
    this.devTestArena = new DevTestArena(
      this.worldScene.scene,
      this.player,
      this.trackManager,
      () => {
        this.activeGameMode = 'ARENA';
        this.progression.setActiveGameMode('ARENA');
        this.lifecycleState = 'PLAYING';
        this.cameraController.setLobbyMode(false);
        this.cameraController.reset(this.player.position);
        this.player.mesh.rotation.y = 0;
        this.openingSequence.skip();
        this.startScreen.hide();
        this.hud.hide();
        this.inputManager.setEnabled(true);
      }
    );
    this.devTestArena.attachToWindow(this);
    this.debugVisualizer.init(this.worldScene.scene);
    this.devBugReportModal = new DevBugReportModal();
    // Apply saved graphics quality preset
    const graphics = GraphicsManager.getInstance();
    const config = graphics.getActiveConfig();
    this.worldScene.applyGraphicsConfig(config);

    if (typeof window !== 'undefined') {
      (window as any).__METRO_GAME__ = this;
      (window as any).__GRAPHICS_MANAGER__ = graphics;
      (window as any).__SOUND_MANAGER__ = this.soundManager;
      (window as any).__ENV_DIRECTOR__ = EnvironmentDirector.getInstance();
      (window as any).__TOGGLE_WORLD_GEN_DEBUG__ = () => {
        (window as any).__DEBUG_WORLD_GEN__ = !(window as any).__DEBUG_WORLD_GEN__;
      };
      (window as any).__PREVIEW_ENVIRONMENT__ = (envId: EnvironmentId) => {
        EnvironmentDirector.getInstance().jumpToDistrict(envId);
      };
      (window as any).__DEV_SET_DISTRICT__ = (envId: EnvironmentId) => {
        EnvironmentDirector.getInstance().jumpToDistrict(envId);
        this.trackManager.setEnvironment(envId);
        const theme = EnvironmentRegistry.getInstance().get(envId);
        this.worldScene.applyEnvironment(theme, 1.0);
      };
      (window as any).__DEV_SPAWN_LANDMARK__ = (landmark: any) => {
        EnvironmentDirector.getInstance().forceLandmark(landmark);
      };
      (window as any).__DEV_SPAWN_SMALL_MOMENT__ = (moment: any) => {
        EnvironmentalEncounterDirector.getInstance().setForcedSmallMoment(moment);
      };
      (window as any).__DEV_SET_ATMOSPHERE__ = (preset: any) => {
        EnvironmentDirector.getInstance().previewAtmosphere(preset);
      };
      (window as any).__DEV_SKIP_DISTANCE__ = (meters: number) => {
        this.player.position.z -= meters;
      };
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.shiftKey && (e.key === 'E' || e.key === 'e')) {
          (window as any).__DEBUG_WORLD_GEN__ = !(window as any).__DEBUG_WORLD_GEN__;
        }
      });
    }

    // Stage hero character in Lobby pose facing the camera
    this.player.mesh.rotation.y = Math.PI - 0.2;
    this.cameraController.setLobbyMode(true);

    this.setupEvents();
    this.startScreen.show();
    this.hud.hide();

    // Attach development scenario runner to window
    TrainScenarioRunner.getInstance().attachToWindow(this);

    // Register synchronous screenshot capture hook for bug snapshots
    this.bugSnapshotManager.setCaptureHandler(() => {
      try {
        if (this.worldScene?.renderer && this.worldScene?.scene && this.cameraController?.camera) {
          this.worldScene.renderer.render(this.worldScene.scene, this.cameraController.camera);
          const canvas = this.worldScene.renderer.domElement;
          if (canvas && typeof canvas.toDataURL === 'function') {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            if (dataUrl && dataUrl.startsWith('data:image/') && dataUrl.length > 200) {
              return dataUrl;
            }
          }
        }
      } catch (err) {
        console.warn('Screenshot capture failed in game handler:', err);
      }
      return undefined;
    });

    // Start requestAnimationFrame loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private setupEvents(): void {
    const bus = EventBus.getInstance();

    bus.on('INPUT_ACTION', (action) => {
      if (this.lifecycleState === 'PLAYING') {
        if (action === 'PAUSE') {
          this.pause();
        } else if (this.openingSequence.isActive()) {
          if (action === 'ACTION') {
            this.openingSequence.skip();
          }
        } else {
          this.player.handleInput(action);
        }
      } else if (this.lifecycleState === 'PAUSED' && action === 'PAUSE') {
        this.resume();
      }
    });

    bus.on('GRAPHICS_QUALITY_CHANGED', (quality: 'HIGH' | 'MEDIUM' | 'LOW') => {
      this.worldScene.setGraphicsQuality(quality);
    });

    bus.on(EVENTS.GAME_START, () => this.startRun(this.progression.getActiveGameMode(), false));
    bus.on('START_MODE_RUN', (mode: GameMode) => this.startRun(mode, false));
    bus.on(EVENTS.GAME_PAUSE, () => this.pause());
    bus.on(EVENTS.GAME_RESUME, () => this.resume());
    bus.on(EVENTS.GAME_RESTART, () => this.quickRestart());
    bus.on('SKIP_GAME_OVER_DELAY', () => this.skipDeathOrGameOverDelay());
    bus.on('GO_TO_MENU', () => this.goToMenu());

    // Instant crash tumble skip / quick restart via keyboard or tap during collision reaction
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const isDeadOrGameOver = this.lifecycleState === 'GAMEOVER' || this.lifecycleState === 'DYING';
      const hasActiveDelay = this.gameOverTimeoutId !== null || this.deathTimeoutId !== null;
      if (isDeadOrGameOver && hasActiveDelay) {
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          this.quickRestart();
        } else if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          this.skipDeathOrGameOverDelay();
        }
      }
    });

    window.addEventListener('pointerdown', () => {
      const isDeadOrGameOver = this.lifecycleState === 'GAMEOVER' || this.lifecycleState === 'DYING';
      const hasActiveDelay = this.gameOverTimeoutId !== null || this.deathTimeoutId !== null;
      if (isDeadOrGameOver && hasActiveDelay) {
        this.skipDeathOrGameOverDelay();
      }
    });

    bus.on(EVENTS.PHOTO_MODE_ENTER, () => {
      if (this.lifecycleState === 'PLAYING') {
        this.pause();
      }
      this.pauseModal.hide();
      this.hud.hide();
      this.photoModeModal.show(this.player);
    });

    bus.on(EVENTS.PHOTO_MODE_EXIT, () => {
      this.photoModeModal.hide();
      if (this.lifecycleState === 'PAUSED') {
        this.pauseModal.show();
      }
    });

    bus.on('REPRODUCE_BUG_SNAPSHOT', (snapshot: BugSnapshotPackage) => {
      this.startReproduction(snapshot);
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.code === 'F8') {
        if (!isDeveloperMode()) return;
        e.preventDefault();
        this.debugVisualizer.toggle();
      } else if (e.code === 'F9' || (e.code === 'KeyB' && e.ctrlKey && e.shiftKey)) {
        if (!isDeveloperMode()) return;
        e.preventDefault();
        const isActivelyRunning = this.lifecycleState === 'PLAYING';
        this.devBugReportModal.openLatest(isActivelyRunning);
      }
    });

    bus.on(EVENTS.STUMBLE, () => {
      this.chaser.onMinorStumble();
    });
    bus.on(EVENTS.CHASER_STUMBLE_REACTION, () => {
      // Audio-visual feedback on shield/board break without advancing guard chase state
      EventBus.getInstance().emit(EVENTS.CHASER_WHISTLE);
    });
    bus.on(EVENTS.NEAR_MISS, () => {
      this.chaser.triggerNearMissReaction();
    });
    bus.on(EVENTS.CHASER_PROXIMITY_WARNING, () => {
      this.hud.showFeedbackBadge('⚠️ GUARD IN PURSUIT!', 'precision');
    });
    bus.on(EVENTS.CHASER_CAPTURED, () => {
      this.hud.showFeedbackBadge('BUSTED! 👮‍♂️', 'nearmiss');
    });

    bus.on('TOGGLE_SOUND', () => {
      const isMuted = this.soundManager.toggleMute();
      this.pauseModal.updateSoundButton(isMuted);
    });

    bus.on(EVENTS.COIN_COLLECTED, () => {
      if (this.activeGameMode === 'PRACTICE' || this.activeGameMode === 'ARENA' || this.bugReproductionLoader.isRunning()) {
        return;
      }
      this.coinsCount++;
      SecretRouteDirector.getInstance().onCoinCollected();
      JunctionDirector.getInstance().onCoinCollected();
      const bonus = CONSTANTS.COIN_SCORE_VALUE * this.scoreMultiplier;
      this.score += bonus;
      bus.emit(EVENTS.SCORE_UPDATED, this.score);
      UpgradeManager.getInstance().addCoins(1);

      // Check Coin Rush Mode victory condition (150 coins target)
      if (this.activeGameMode === 'COIN_RUSH' && this.coinsCount >= 150) {
        this.handleGameOver('COIN_RUSH_VICTORY');
      }
    });

    // Secret Railway Route Event Handlers
    bus.on(EVENTS.SECRET_ROUTE_DISCOVERED, (data: any) => {
      this.hud.showFeedbackBadge(`🌟 SECRET AHEAD: ${data.name.toUpperCase()}`, 'streak');
    });

    bus.on(EVENTS.SECRET_ROUTE_ENTERED, (data: any) => {
      const extra = data.isFirstDiscovery ? ` (+${data.firstDiscoveryCoins} COINS!)` : '';
      this.hud.showFeedbackBadge(`🚀 DISCOVERED: ${data.name.toUpperCase()}${extra}`, 'precision');
    });

    bus.on(EVENTS.SECRET_ROUTE_COMPLETED, (data: any) => {
      this.hud.showFeedbackBadge(`🏆 COMPLETED: ${data.name.toUpperCase()}!`, 'streak');
    });

    // Branching Railway Junction Event Handlers
    bus.on(EVENTS.JUNCTION_APPROACHING, (data: any) => {
      this.hud.showFeedbackBadge(`🔀 JUNCTION: CHOOSE ROUTE (LEFT: METRO / RIGHT: INDUSTRIAL)`, 'streak');
    });

    bus.on(EVENTS.JUNCTION_COMMITTED, (data: any) => {
      this.hud.showFeedbackBadge(`🛤 ROUTE COMMITTED: ${data.chosenRouteName.toUpperCase()}!`, 'precision');
      if (data.themeId) {
        this.trackManager.setEnvironment(data.themeId);
        const theme = this.worldScene ? EnvironmentManager.getInstance().getTheme(data.themeId) : null;
        if (theme) {
          this.worldScene.applyEnvironment(theme);
        }
      }
    });

    bus.on(EVENTS.JUNCTION_COMPLETED, (data: any) => {
      if (data.scoreBonus) {
        this.score += data.scoreBonus;
        bus.emit(EVENTS.SCORE_UPDATED, this.score);
      }
      if (data.firstDiscoveryBonus && data.firstDiscoveryBonus > 0) {
        this.coinsCount += data.firstDiscoveryBonus;
        bus.emit(EVENTS.COIN_COLLECTED);
      }
      this.hud.showFeedbackBadge(`🏆 ROUTE COMPLETED: ${data.routeName.toUpperCase()} (+${data.scoreBonus} PTS)!`, 'streak');
    });

    bus.on('CHRONO_ORB_COLLECTED', (seconds: number = 5) => {
      if (this.activeGameMode === 'TIME_TRIAL') {
        this.timeTrialRemaining += seconds;
        this.hud.setTimeTrialTime(this.timeTrialRemaining);
      }
    });

    bus.on(EVENTS.SKILL_EVENT, (payload: any) => {
      if (payload && payload.finalPoints > 0) {
        this.score += payload.finalPoints;
        bus.emit(EVENTS.SCORE_UPDATED, this.score);
      }
    });

    bus.on(EVENTS.NEAR_MISS, () => {
      const bonus = CONSTANTS.NEAR_MISS_SCORE * this.scoreMultiplier;
      this.score += bonus;
      bus.emit(EVENTS.SCORE_UPDATED, this.score);
      this.hud.showFeedbackBadge(`NEAR MISS! +${bonus}`, 'nearmiss');
    });

    bus.on(EVENTS.CLEAN_STREAK, (streakCount: number) => {
      const bonus = CONSTANTS.CLEAN_STREAK_BONUS * streakCount * this.scoreMultiplier;
      this.score += bonus;
      bus.emit(EVENTS.SCORE_UPDATED, this.score);
      this.hud.showFeedbackBadge(`STREAK x${streakCount} 🔥 +${bonus}`, 'streak');
    });

    bus.on(EVENTS.PRECISION_ACTION, (action: 'JUMP' | 'SLIDE') => {
      const bonus = CONSTANTS.PRECISION_ACTION_BONUS * this.scoreMultiplier;
      this.score += bonus;
      bus.emit(EVENTS.SCORE_UPDATED, this.score);
      const label = action === 'JUMP' ? 'PERFECT JUMP 🦘' : 'PERFECT SLIDE ⚡';
      this.hud.showFeedbackBadge(`${label} +${bonus}`, 'precision');
    });

    bus.on(EVENTS.CRASH, (reason?: string) => {
      this.handleFatalCrash(reason || 'CRASH');
    });

    bus.on('REQUEST_INSTANT_REPLAY', () => {
      this.startInstantReplay();
    });

    // Environment District & Transitions
    bus.on('ENVIRONMENT_PREFERENCE_CHANGED', (pref: string) => {
      if (this.lifecycleState === 'MENU') {
        if (pref === 'HISTORIC_QUARTER') {
          this.trackManager.setEnvironment('HISTORIC_QUARTER');
          this.worldScene.applyEnvironment(HISTORIC_QUARTER_THEME);
          this.soundManager.setEnvironmentAmbience('HISTORIC_QUARTER');
        } else if (pref === 'MODERN_METRO') {
          this.trackManager.setEnvironment('MODERN_METRO');
          this.worldScene.applyEnvironment(MODERN_METRO_THEME);
          this.soundManager.setEnvironmentAmbience('MODERN_METRO');
        } else if (pref === 'UNDERGROUND_METRO') {
          this.trackManager.setEnvironment('UNDERGROUND_METRO');
          this.worldScene.applyEnvironment(UNDERGROUND_METRO_THEME);
          this.soundManager.setEnvironmentAmbience('UNDERGROUND_METRO');
        } else {
          const initialTheme = EnvironmentManager.getInstance().getTheme();
          this.trackManager.setEnvironment(initialTheme.id);
          this.worldScene.applyEnvironment(initialTheme);
          this.soundManager.setEnvironmentAmbience(initialTheme.id);
        }
      }
    });

    bus.on('ENVIRONMENT_TRANSITION_APPROACHING', () => {
      this.soundManager.playEnvironmentTransition();
    });

    bus.on('ENVIRONMENT_CHANGED', (envId: string, targetTheme: any) => {
      if (targetTheme) {
        this.worldScene.startAtmosphericTransition(targetTheme, 3.0);
      }
      this.soundManager.setEnvironmentAmbience(envId);
    });

    bus.on('LANDMARK_ENCOUNTERED', (data: { landmarkId: string; name: string; worldZ: number; districtId: string }) => {
      const def = EnvironmentalEncounterDirector.getInstance().getEncounterDef(data.landmarkId as any);
      if (def && def.audioCue) {
        this.soundManager.playLandmarkAudio(def.audioCue);
      }
    });
  }

  public startRun(mode: GameMode = 'NORMAL', isRetry: boolean = false): void {
    if (this.isRestartInProgress && !isRetry) return;

    if (this.gameOverTimeoutId) {
      clearTimeout(this.gameOverTimeoutId);
      this.gameOverTimeoutId = null;
    }
    if (this.deathTimeoutId) {
      clearTimeout(this.deathTimeoutId);
      this.deathTimeoutId = null;
    }
    this.hud.clearFeedbackBadges();

    // Verify eligibility for trial character: block run with Rahul Gandhi if 0 trials remain and unowned
    const selectedChar = this.progression.getSelectedCharacter();
    const normalizedChar = this.progression.normalizeCharacterId(selectedChar);
    if (normalizedChar === 'char_rahul_gandhi' && !this.progression.isCharacterUnlocked('char_rahul_gandhi')) {
      if (this.progression.getRahulTrialsRemaining() <= 0) {
        this.progression.equipCharacter('char_jax', 'jax_classic');
        this.player.applyCharacter('char_jax', 'jax_classic');
      }
    }

    this.activeGameMode = mode;
    this.progression.setActiveGameMode(mode);

    this.lifecycleState = 'PLAYING';
    this.score = 0;
    this.coinsCount = 0;
    this.scoreMultiplier = mode === 'HARD' ? 1.25 : 1;
    this.timeTrialRemaining = 60.0;
    this.coinRushElapsed = 0.0;

    this.player.reset();
    this.player.setGameMode(this.activeGameMode);
    this.trackManager.setGameMode(this.activeGameMode);
    // In normal play, generate fresh seed; in debug or daily challenge mode, preserve seed
    if (this.activeGameMode === 'DAILY_CHALLENGE') {
      const dailyMgr = DailyChallengeManager.getInstance();
      const challenge = dailyMgr.getActiveChallenge() || dailyMgr.getTodayChallenge();
      dailyMgr.setActiveChallenge(challenge);
      this.trackManager.setSeed(challenge.seed, true);
    } else if (!isRetry && this.trackManager.isDebugMode()) {
      // Retain fixed seed when retrying an explicitly seeded challenge; clear debug seed on fresh run from lobby
      this.trackManager.clearDebugSeed();
    }
    this.trackManager.reset(!this.trackManager.isDebugMode());
    const startEnvId = this.trackManager.getActiveEnvironment();
    const startTheme = EnvironmentManager.getInstance().getTheme(startEnvId);
    this.worldScene.applyEnvironment(startTheme);
    this.soundManager.setEnvironmentAmbience(startEnvId);
    this.locomotionVFX.reset();
    this.chaser.reset();
    this.cameraController.reset(this.player.position);

    // Initialize Bug Snapshot Context for current run
    this.bugSnapshotManager.reset();
    this.bugSnapshotManager.setRunContext({
      seed: this.trackManager.getRunSeed(),
      gameMode: this.activeGameMode,
      difficulty: this.trackManager.getDifficultyLabel(),
      activeEnvironment: this.trackManager.getActiveEnvironment()
    });

    // Apply Mode-Specific Initial Conditions
    if (this.activeGameMode === 'HARD') {
      this.player.speed = 24.0;
    } else if (this.activeGameMode === 'SURVIVAL') {
      // Survival starts fast at 25 m/s immediately!
      this.player.speed = 25.0;
    } else if (this.activeGameMode === 'DAILY_CHALLENGE') {
      const active = DailyChallengeManager.getInstance().getActiveChallenge();
      if (active?.difficulty === 'HARD') {
        this.player.speed = 24.0;
        this.scoreMultiplier = 1.25;
      } else if (active?.difficulty === 'EASY') {
        this.player.speed = 22.0;
        this.scoreMultiplier = 1.15;
      } else {
        this.player.speed = 19.0;
        this.scoreMultiplier = 1.0;
      }
    }

    this.cameraController.setLobbyMode(false);
    this.cameraController.setGameOverMode(false);
    this.player.mesh.rotation.y = 0;

    // Start opening cinematic sequence if eligible
    this.openingSequence.start(isRetry);

    this.reviveManager.resetRun();
    this.crashReplayManager.reset();
    this.replayHUD.hide();
    this.reviveModal.hide();
    this.startScreen.hide();
    this.pauseModal.hide();
    this.gameOverModal.hide();
    this.devBugReportModal.hide();
    this.devBugReportModal.setAutoOpenCrashReport(false);
    this.shopModal.hide();
    this.missionsModal.hide(false);
    this.eventSelectModal.hide(false);
    this.characterSelectModal.hide(false);
    this.hoverboardSelectModal.hide(false);
    this.profileModal.hide();
    this.dailyRewardModal.hide();
    this.dailyChallengeModal.hide(false);
    this.photoModeModal.hide();
    this.environmentSelectModal.hide();
    this.practiceModal.hide(false);
    this.practiceController.exit();

    this.hud.reset();
    const hudMode = (this.activeGameMode === 'PRACTICE' || this.activeGameMode === 'ARENA')
      ? 'NORMAL'
      : this.activeGameMode;
    this.hud.setMode(hudMode);
    if (this.activeGameMode === 'TIME_TRIAL') {
      this.hud.setTimeTrialTime(60.0);
    } else if (this.activeGameMode === 'COIN_RUSH') {
      this.hud.setCoinRushProgress(0, 150);
    } else if (this.activeGameMode === 'SURVIVAL') {
      this.hud.setSurvivalDistance(0);
    }
    this.hud.show();
    this.inputManager.setEnabled(true);

    this.soundManager.initAudio();
    this.soundManager.setMusicState('RUNNING_NORMAL');
    this.soundManager.startMusic();

    EventBus.getInstance().emit(EVENTS.RUN_STARTED, this.activeGameMode);
  }

  public pause(): void {
    if (this.lifecycleState !== 'PLAYING') return;
    this.lifecycleState = 'PAUSED';
    this.inputManager.setEnabled(false);
    this.soundManager.pauseMusic();
    EventBus.getInstance().emit(EVENTS.GAME_PAUSE);
    this.pauseModal.show();
  }

  public resume(): void {
    if (this.lifecycleState !== 'PAUSED') return;
    this.lifecycleState = 'PLAYING';
    this.inputManager.setEnabled(true);
    this.pauseModal.hide();
    this.lastTime = performance.now(); // Avoid huge delta jump
    this.soundManager.resumeMusic();
    EventBus.getInstance().emit(EVENTS.GAME_RESUME);
  }

  public goToMenu(): void {
    this.lifecycleState = 'MENU';
    this.soundManager.setMusicState('LOBBY');
    this.cameraController.setLobbyMode(true);
    this.cameraController.setGameOverMode(false);
    this.hud.hide();
    this.pauseModal.hide();
    this.reviveModal.hide();
    this.reviveManager.resetRun();
    this.gameOverModal.hide();
    this.devBugReportModal.hide();
    this.devBugReportModal.setAutoOpenCrashReport(false);
    this.shopModal.hide();
    this.missionsModal.hide();
    this.eventSelectModal.hide();
    this.characterSelectModal.hide();
    this.hoverboardSelectModal.hide();
    this.profileModal.hide();
    this.dailyRewardModal.hide();
    this.environmentSelectModal.hide();
    this.practiceModal.hide();
    this.practiceController.exit();
    this.photoModeModal.hide();
    this.startScreen.show();
    this.player.reset();
    this.trackManager.reset();
    const menuEnvId = this.trackManager.getActiveEnvironment();
    const menuTheme = EnvironmentManager.getInstance().getTheme(menuEnvId);
    this.worldScene.applyEnvironment(menuTheme);
    this.soundManager.setEnvironmentAmbience(menuEnvId);
    this.locomotionVFX.reset();
    this.chaser.reset();
    this.openingSequence.skip();
    this.player.mesh.rotation.y = Math.PI - 0.2;
    this.cameraController.reset(this.player.position);
    this.inputManager.setEnabled(false);
  }

  public startPractice(moduleId: PracticeModuleId, isHarder: boolean = false): void {
    this.activeGameMode = 'PRACTICE';
    this.progression.setActiveGameMode('PRACTICE');

    this.lifecycleState = 'PLAYING';
    this.score = 0;
    this.coinsCount = 0;
    this.scoreMultiplier = 1;

    this.cameraController.setLobbyMode(false);
    this.cameraController.reset(this.player.position);
    this.player.mesh.rotation.y = 0;

    // Instantly skip opening cinematic sequence in practice drills
    if (this.openingSequence.isActive()) {
      this.openingSequence.skip();
    }

    this.startScreen.hide();
    this.pauseModal.hide();
    this.gameOverModal.hide();
    this.shopModal.hide();
    this.missionsModal.hide(false);
    this.eventSelectModal.hide(false);
    this.characterSelectModal.hide(false);
    this.hoverboardSelectModal.hide(false);
    this.profileModal.hide();
    this.dailyRewardModal.hide();
    this.practiceModal.hide(false);

    // Practice mode uses dedicated objective overlay
    this.hud.hide();

    this.practiceController.startModule(moduleId, isHarder);
    this.inputManager.setEnabled(true);
  }

  private handleGameOver(
    reason: 'CRASH' | 'TIME_TRIAL_COMPLETE' | 'COIN_RUSH_VICTORY' | 'CHASER_CAPTURE' = 'CRASH',
    immediate: boolean = false
  ): void {
    if (this.lifecycleState === 'GAMEOVER') return;

    if (this.gameOverTimeoutId) {
      clearTimeout(this.gameOverTimeoutId);
      this.gameOverTimeoutId = null;
    }
    if (this.deathTimeoutId) {
      clearTimeout(this.deathTimeoutId);
      this.deathTimeoutId = null;
    }
    this.hud.clearFeedbackBadges();

    this.reviveModal.hide();
    this.reviveManager.cancelOffer();
    this.devBugReportModal.hide();

    if (this.activeGameMode === 'PRACTICE' || this.activeGameMode === 'ARENA') {
      // In Practice & Arena modes, collision results are handled directly by PracticeController / DevTestArena
      // Economy, high scores, and mission rewards are strictly isolated to prevent reward farming!
      return;
    }

    this.lifecycleState = 'GAMEOVER';
    this.inputManager.setEnabled(false);
    this.chaser.triggerCaughtReaction();
    this.cameraController.setGameOverMode(true, this.player.position);

    EventBus.getInstance().emit(EVENTS.RUN_FINISHED, {
      score: this.score,
      coins: this.coinsCount,
      distance: this.player.distanceTraveled,
      mode: this.activeGameMode,
      reason
    });
    EventBus.getInstance().emit(EVENTS.GAME_OVER);

    // Calculate Mode-Specific Results & Bonus Rewards
    let resultMeta: {
      title: string;
      subtitle?: string;
      bonusCoins?: number;
      challenge?: any;
      challengeRecord?: any;
      isNewRecord?: boolean;
    } = {
      title: 'RUN OVER!'
    };

    if (reason === 'CHASER_CAPTURE') {
      resultMeta = {
        title: 'BUSTED! 👮‍♂️',
        subtitle: 'Captured by Transit Security Officer Thorne'
      };
    } else if (this.activeGameMode === 'TIME_TRIAL') {
      if (reason === 'TIME_TRIAL_COMPLETE') {
        resultMeta = {
          title: "TIME'S UP! ⏱️",
          subtitle: `Time Trial Sprint Score: ${Math.floor(this.score).toLocaleString()}`
        };
      } else {
        resultMeta = {
          title: 'TIME TRIAL CRASH! 💥',
          subtitle: `Finished before clock expiration`
        };
      }
    } else if (this.activeGameMode === 'COIN_RUSH') {
      if (reason === 'COIN_RUSH_VICTORY') {
        const bonusCoins = 1000;
        UpgradeManager.getInstance().addCoins(bonusCoins);

        const currentBest = this.progression.getState().lifetimeStats.coinRushBestTime;
        if (currentBest === 0 || this.coinRushElapsed < currentBest) {
          this.progression.getState().lifetimeStats.coinRushBestTime = Math.round(this.coinRushElapsed * 10) / 10;
          this.progression.saveState();
        }

        resultMeta = {
          title: 'VAULT CLEARED! 🪙',
          subtitle: `Target 150 coins reached in ${this.coinRushElapsed.toFixed(1)}s! (+${bonusCoins} Vault Bonus!)`,
          bonusCoins
        };
      } else {
        resultMeta = {
          title: 'RUSH FAILED! 💥',
          subtitle: `Collected ${this.coinsCount} / 150 coins before crashing`
        };
      }
    } else if (this.activeGameMode === 'SURVIVAL') {
      const dist = Math.floor(this.player.distanceTraveled);
      let bonusCoins = 0;
      let rank = 'Bronze Survivor';
      if (dist >= 2000) {
        bonusCoins = 1500;
        rank = 'Apex Gold Survivor 🥇';
      } else if (dist >= 1000) {
        bonusCoins = 750;
        rank = 'Silver Survivor 🥈';
      } else if (dist >= 500) {
        bonusCoins = 300;
        rank = 'Bronze Survivor 🥉';
      }

      if (bonusCoins > 0) {
        UpgradeManager.getInstance().addCoins(bonusCoins);
      }

      resultMeta = {
        title: 'SURVIVAL ENDED! 💀',
        subtitle: `${rank} — ${dist}m (+${bonusCoins} Coins)`,
        bonusCoins
      };
    } else if (this.activeGameMode === 'HARD') {
      const dist = Math.floor(this.player.distanceTraveled);
      const stats = this.progression.getState().lifetimeStats;
      const isNewBest = this.score > (stats.hardModeHighScore || 0);
      resultMeta = {
        title: isNewBest ? 'NEW HARD RECORD! ⚡' : 'HARD SPRINT ENDED! ⚡',
        subtitle: `${dist.toLocaleString()}m sprinted at up to 46 m/s`
      };
    } else if (this.activeGameMode === 'DAILY_CHALLENGE') {
      const dailyMgr = DailyChallengeManager.getInstance();
      const comboStats = SkillComboManager.getInstance().getStats();
      const res = dailyMgr.recordRunResult(
        this.score,
        Math.floor(this.player.distanceTraveled),
        this.coinsCount,
        comboStats.bestCombo
      );
      const challenge = dailyMgr.getActiveChallenge() || dailyMgr.getTodayChallenge();
      resultMeta = {
        title: res.isNewRecord ? 'NEW DAILY RECORD! 🏆' : 'DAILY CHALLENGE FINISHED! 🏆',
        subtitle: `${challenge.name} (${challenge.difficulty}) • ${challenge.objectiveText}`,
        bonusCoins: res.rewardGranted > 0 ? res.rewardGranted : undefined,
        challenge,
        challengeRecord: res.record,
        isNewRecord: res.isNewRecord
      };
    }

    this.lastResultMeta = resultMeta;

    if (this.gameOverTimeoutId) {
      clearTimeout(this.gameOverTimeoutId);
      this.gameOverTimeoutId = null;
    }

    const showModal = () => {
      this.gameOverTimeoutId = null;
      if (this.lifecycleState !== 'GAMEOVER') return;
      this.hud.hide();
      this.gameOverModal.show(
        this.score,
        this.coinsCount,
        this.player.distanceTraveled,
        this.activeGameMode,
        resultMeta,
        () => this.startInstantReplay()
      );
    };

    if (immediate) {
      showModal();
    } else {
      this.gameOverTimeoutId = window.setTimeout(showModal, 1100);
    }
  }

  public skipDeathOrGameOverDelay(): void {
    if (this.lifecycleState === 'DYING' && this.deathTimeoutId !== null) {
      clearTimeout(this.deathTimeoutId);
      this.deathTimeoutId = null;
      const reason = this.crashReplayManager.getActiveAnalysis()?.metadata?.reason || 'CRASH';
      const explanation = this.crashReplayManager.getActiveExplanation();
      if (this.reviveManager.canOfferRevive(this.activeGameMode)) {
        this.lifecycleState = 'REVIVE_OFFER';
        this.reviveManager.beginOffer();
        const offerState = this.reviveManager.getOfferState(this.activeGameMode);
        this.reviveModal.show(
          offerState,
          this.score,
          this.coinsCount,
          () => this.onReviveAccepted(),
          () => this.onReviveDeclined(reason),
          explanation
        );
      } else {
        this.handleGameOver(reason === 'CHASER_CAPTURE' ? 'CHASER_CAPTURE' : 'CRASH', true);
      }
      return;
    }
    this.skipGameOverDelay();
  }

  public skipGameOverDelay(): void {
    if (this.lifecycleState === 'GAMEOVER' && this.gameOverTimeoutId) {
      clearTimeout(this.gameOverTimeoutId);
      this.gameOverTimeoutId = null;
      this.hud.hide();
      this.gameOverModal.show(
        this.score,
        this.coinsCount,
        this.player.distanceTraveled,
        this.activeGameMode,
        this.lastResultMeta,
        () => this.startInstantReplay()
      );
    }
  }

  public quickRestart(): void {
    if (this.isRestartInProgress) return;
    this.isRestartInProgress = true;

    if (this.gameOverTimeoutId) {
      clearTimeout(this.gameOverTimeoutId);
      this.gameOverTimeoutId = null;
    }
    if (this.deathTimeoutId) {
      clearTimeout(this.deathTimeoutId);
      this.deathTimeoutId = null;
    }
    this.hud.clearFeedbackBadges();

    this.reviveModal.hide();
    this.reviveManager.cancelOffer();
    this.devBugReportModal.hide();
    this.gameOverModal.hide();

    this.startRun(this.activeGameMode, true);

    requestAnimationFrame(() => {
      this.isRestartInProgress = false;
    });
  }

  private gameLoop(now: number): void {
    requestAnimationFrame(this.gameLoop.bind(this));

    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (rawDt > 0 && rawDt < 1.0) {
      if (this.frameTimes.length >= 60) this.frameTimes.shift();
      this.frameTimes.push(rawDt * 1000);
    }
    // Clamp delta-time to avoid simulation instability (e.g. tab switching)
    const dt = Math.min(rawDt, 0.08);

    // Developer Physics Test Arena Pause / Step Frame check
    if (this.devTestArena && this.devTestArena.isSimulationPaused()) {
      if (!this.devTestArena.consumeStepRequest()) {
        this.worldScene.renderer.render(this.worldScene.scene, this.cameraController.camera);
        return;
      }
    }

    // Dedicated Photo Studio Render Frame
    if (this.photoModeModal && this.photoModeModal.isPhotoStudioOpen()) {
      this.photoModeController.update(this.player);
      this.worldScene.renderer.render(this.worldScene.scene, this.cameraController.camera);
      return;
    }

    const effectiveDt = dt * (this.devTestArena ? this.devTestArena.getTimeScale() : 1.0);

    // Update Bug Reproduction sandbox playback if active
    if (this.bugReproductionLoader.isRunning()) {
      this.bugReproductionLoader.update(effectiveDt, this.player);
    }

    if (this.lifecycleState === 'PLAYING') {
      if (this.activeGameMode === 'PRACTICE') {
        this.player.update(effectiveDt);
        this.chaser.update(effectiveDt, this.player.position, this.player.speed, this.player.groundY);
        this.locomotionVFX.update(effectiveDt, this.player);
        this.trackManager.update(this.player, effectiveDt, now / 1000);
        this.practiceController.update(effectiveDt);
        this.worldScene.updateSunPosition(this.player.position.z, this.player.speed);
      } else if (this.openingSequence.isActive()) {
        this.openingSequence.update(dt);
        this.locomotionVFX.update(dt, this.player);
        this.hud.update(dt);
        this.worldScene.updateSunPosition(this.player.position.z, this.player.speed);
      } else {
        // 1. Multiplier calculation (Time Trial awards 2X base multiplier)
        let baseMult = this.player.powerups.is2xMultiplierActive() ? 2 : 1;
        if (this.activeGameMode === 'TIME_TRIAL') {
          baseMult *= 2;
        }
        this.scoreMultiplier = baseMult + this.player.hoverboardManager.getScoreMultiplierBonus();
        this.hud.setMultiplier(this.scoreMultiplier);

        // 2. Mode Timers & Goals Check
        if (this.activeGameMode === 'TIME_TRIAL') {
          this.timeTrialRemaining -= dt;
          this.hud.setTimeTrialTime(this.timeTrialRemaining);
          if (this.timeTrialRemaining <= 0) {
            this.timeTrialRemaining = 0;
            this.handleGameOver('TIME_TRIAL_COMPLETE');
            return;
          }
        } else if (this.activeGameMode === 'COIN_RUSH') {
          this.coinRushElapsed += dt;
          this.hud.setCoinRushProgress(this.coinsCount, 150);
        } else if (this.activeGameMode === 'SURVIVAL') {
          this.hud.setSurvivalDistance(this.player.distanceTraveled);
        }

        // 3. Update player physics and movement
        this.player.update(dt);
        this.chaser.update(dt, this.player.position, this.player.speed, this.player.groundY);
        this.locomotionVFX.update(dt, this.player);

        // 4. Update track chunks and collision detection
        this.trackManager.update(this.player, dt, now / 1000);

        // 5. Update score based on forward distance
        this.score += this.player.speed * dt * CONSTANTS.SCORE_PER_METER * this.scoreMultiplier;
        EventBus.getInstance().emit(EVENTS.SCORE_UPDATED, this.score);

        // Update skill combo decay & telemetry
        SkillComboManager.getInstance().update(dt);

        // 6. Update HUD UI & live portrait reaction state
        this.hud.update(dt, this.player.isSliding, this.player.isJumping, this.player.speed);

        // 7. Update lighting target to center around player and update speed lines
        this.worldScene.updateSunPosition(this.player.position.z, this.player.speed);

        // 8. Record replay snapshot into bounded circular buffer
        const nearbyObstacles: ObstacleInstance[] = [];
        for (let i = 0; i < this.trackManager.chunks.length; i++) {
          const chunk = this.trackManager.chunks[i];
          for (let j = 0; j < chunk.obstacles.length; j++) {
            if (chunk.obstacles[j].active) {
              nearbyObstacles.push(chunk.obstacles[j]);
            }
          }
        }
        this.crashReplayManager.recordFrame(
          this.player,
          this.cameraController,
          nearbyObstacles,
          this.chaser,
          now / 1000
        );

        // Record bug snapshot frame and run automated failure invariant monitors
        this.bugSnapshotManager.recordFrame({
          player: this.player,
          cameraController: this.cameraController,
          nearbyObstacles,
          nowTime: now / 1000
        });

        const activeChunk = this.trackManager.chunks.find(
          c => this.player.position.z >= c.chunkZ - CONSTANTS.CHUNK_LENGTH && this.player.position.z <= c.chunkZ
        );
        this.bugSnapshotManager.runInvariantChecks(this.player, nearbyObstacles, activeChunk);
      }
    } else if (this.lifecycleState === 'DYING' || this.lifecycleState === 'GAMEOVER') {
      // Gameplay world simulation (movement, track, collision, score) is FROZEN
      // Presentation and animation updates continue smoothly!
      this.player.update(dt);
      this.chaser.update(dt, this.player.position, this.player.speed, this.player.groundY);
      this.locomotionVFX.update(dt, this.player);
    } else if (this.lifecycleState === 'REVIVE_OFFER') {
      this.player.update(dt);
      this.chaser.update(dt, this.player.position, this.player.speed, this.player.groundY);
    } else if (this.lifecycleState === 'REPLAY') {
      this.crashReplayManager.updatePlayback(effectiveDt, this.player, this.cameraController, this.chaser);
      this.replayHUD.update(
        this.crashReplayManager.getPlaybackProgress(),
        this.crashReplayManager.getPlaybackElapsed(),
        this.crashReplayManager.getPlaybackDuration()
      );
    } else if (this.lifecycleState === 'MENU') {
      // Idle scene: slow gentle hover & subtle sway facing camera
      this.player.position.y = CONSTANTS.PLAYER_BASE_Y + Math.sin(now * 0.003) * 0.08;
      this.player.mesh.position.copy(this.player.position);
      this.player.mesh.rotation.y = Math.PI - 0.2 + Math.sin(now * 0.001) * 0.08;
    }

    // Camera follow update with dynamic speed-based FOV and coordinated elevation tracking
    if (this.lifecycleState !== 'REPLAY') {
      this.cameraController.update(
        this.player.position,
        dt,
        now / 1000,
        this.player.speed,
        this.player.groundY,
        this.player.isSliding,
        this.player.isTunnelEnclosed
      );
    }

    // Collision Debug Visualization (Enabled only when window.__DEBUG_COLLIDERS__ is true)
    this.updateCollisionDebugVisuals();

    // Update adaptive graphics profiling, atmospheric transitions, and ground contact shadow
    EnvironmentDirector.getInstance().updateAtmosphere(this.player.position.z, this.worldScene, effectiveDt);
    EnvironmentDirector.getInstance().recordFrameTime(effectiveDt * 1000);
    this.updateWorldGenDiagnostics(effectiveDt);
    this.worldScene.updateAtmosphere(effectiveDt);
    GraphicsManager.getInstance().update(effectiveDt, this.lifecycleState === 'PLAYING');
    this.worldScene.updatePlayerContactShadow(
      this.player.position.x,
      this.player.position.y,
      this.player.position.z,
      this.player.groundY
    );

    // Update Secret Railway Routes & Branching Junctions
    if (this.lifecycleState === 'PLAYING') {
      SecretRouteDirector.getInstance().update(this.player, effectiveDt);
      JunctionDirector.getInstance().update(this.player, effectiveDt);
    }

    // Update dynamic audio soundscape (speed-synchronized footsteps, loops, spatial rail rumble, adaptive music)
    this.soundManager.update(effectiveDt, this.player, this.trackManager, this.lifecycleState);

    // Render 3D Scene
    this.worldScene.renderer.render(this.worldScene.scene, this.cameraController.camera);

    if (this.devTestArena) {
      this.devTestArena.update(effectiveDt);
    }
  }

  private updateCollisionDebugVisuals(): void {
    const isDebug = typeof window !== 'undefined' && (!!(window as any).__DEBUG_COLLIDERS__ || this.debugVisualizer.getIsEnabled());
    this.debugVisualizer.setEnabled(isDebug);
    if (!isDebug) {
      if (this.debugGroup.children.length > 0) {
        while (this.debugGroup.children.length > 0) {
          this.debugGroup.remove(this.debugGroup.children[0]);
        }
      }
      if (this.debugOverlayEl) {
        this.debugOverlayEl.style.display = 'none';
      }
      return;
    }

    const lastDiag = (window as any).__LAST_COLLISION_DIAGNOSTIC__;
    this.debugVisualizer.update(this.player, this.trackManager, lastDiag);
  }

  private updateWorldGenDiagnostics(dt: number): void {
    const isDebug = typeof window !== 'undefined' && !!(window as any).__DEBUG_WORLD_GEN__;
    if (!isDebug) {
      if (this.worldGenOverlayEl) {
        this.worldGenOverlayEl.style.display = 'none';
      }
      return;
    }

    if (!this.worldGenOverlayEl && typeof document !== 'undefined') {
      this.worldGenOverlayEl = document.createElement('div');
      this.worldGenOverlayEl.id = 'worldgen-debug-overlay';
      this.worldGenOverlayEl.style.position = 'fixed';
      this.worldGenOverlayEl.style.top = '12px';
      this.worldGenOverlayEl.style.left = '12px';
      this.worldGenOverlayEl.style.zIndex = '99999';
      this.worldGenOverlayEl.style.background = 'rgba(12, 18, 30, 0.94)';
      this.worldGenOverlayEl.style.border = '1px solid #38bdf8';
      this.worldGenOverlayEl.style.padding = '10px 14px';
      this.worldGenOverlayEl.style.borderRadius = '8px';
      this.worldGenOverlayEl.style.fontFamily = 'monospace';
      this.worldGenOverlayEl.style.fontSize = '11px';
      this.worldGenOverlayEl.style.color = '#f0f9ff';
      this.worldGenOverlayEl.style.maxWidth = '360px';
      this.worldGenOverlayEl.style.boxShadow = '0 8px 24px rgba(0,0,0,0.6)';
      document.body.appendChild(this.worldGenOverlayEl);
    }

    if (this.worldGenOverlayEl) {
      this.worldGenOverlayEl.style.display = 'block';
      const director = EnvironmentDirector.getInstance();
      const diag = director.getDiagnostics(this.player.position.z);
      this.worldGenOverlayEl.innerHTML = `
        <div style="font-weight:bold;color:#38bdf8;margin-bottom:6px;display:flex;justify-content:space-between;">
          <span>[WORLD GEN & ENCOUNTERS]</span>
          <span style="color:#a7f3d0;">${diag.frameTimeMs}ms (${Math.round(1000 / Math.max(1, diag.frameTimeMs))} FPS)</span>
        </div>
        <div>DISTRICT: <strong style="color:#f59e0b;">${diag.currentEnvironment}</strong> (Region #${diag.currentRegionIndex})</div>
        <div>NEXT DISTRICT: <span style="color:#38bdf8;">${diag.nextEnvironment}</span></div>
        <div>DIST TO TRANSITION: <span style="color:#00e676;">${diag.distanceToTransition}m</span></div>
        <div>ATMOSPHERE: <span style="color:#93c5fd;">${diag.activeAtmospherePreset}</span></div>
        <div>ACTIVE LANDMARK: <span style="color:#f43f5e;">${diag.activeLandmark || 'NONE'}</span></div>
        <div>SCENERY MESHES: <span style="color:#ffd600;">${diag.sceneryMeshCount}</span> | EST. DRAWS: <span style="color:#ffd600;">${diag.estimatedDrawCalls}</span></div>
        <div style="margin-top:6px;padding-top:4px;border-top:1px solid #1e293b;">
          <div style="font-weight:bold;color:#f59e0b;font-size:10px;margin-bottom:3px;">DISTRICT PREVIEW:</div>
          <div style="display:flex;gap:4px;margin-bottom:5px;flex-wrap:wrap;">
            <button style="font-size:9px;background:#0284c7;color:#fff;border:none;border-radius:3px;padding:2px 6px;cursor:pointer;" onclick="window.__PREVIEW_ENVIRONMENT__('MODERN_METRO')">Modern</button>
            <button style="font-size:9px;background:#d97706;color:#fff;border:none;border-radius:3px;padding:2px 6px;cursor:pointer;" onclick="window.__PREVIEW_ENVIRONMENT__('HISTORIC_QUARTER')">Historic</button>
            <button style="font-size:9px;background:#475569;color:#fff;border:none;border-radius:3px;padding:2px 6px;cursor:pointer;" onclick="window.__PREVIEW_ENVIRONMENT__('UNDERGROUND_METRO')">Underground</button>
          </div>
          <div style="font-weight:bold;color:#10b981;font-size:10px;margin-bottom:3px;">SPAWN LANDMARK:</div>
          <div style="display:flex;gap:3px;margin-bottom:5px;flex-wrap:wrap;">
            <button style="font-size:8px;background:#15803d;color:#fff;border:none;border-radius:3px;padding:2px 4px;cursor:pointer;" onclick="window.__DEV_SPAWN_LANDMARK__('GRAND_RAILWAY_STATION')">Grand Station</button>
            <button style="font-size:8px;background:#78350f;color:#fff;border:none;border-radius:3px;padding:2px 4px;cursor:pointer;" onclick="window.__DEV_SPAWN_LANDMARK__('HISTORIC_STONE_VIADUCT')">Viaduct</button>
            <button style="font-size:8px;background:#0369a1;color:#fff;border:none;border-radius:3px;padding:2px 4px;cursor:pointer;" onclick="window.__DEV_SPAWN_LANDMARK__('MODERN_GLASS_TRANSIT_HUB')">Glass Hub</button>
            <button style="font-size:8px;background:#ca8a04;color:#fff;border:none;border-radius:3px;padding:2px 4px;cursor:pointer;" onclick="window.__DEV_SPAWN_LANDMARK__('INDUSTRIAL_MAINTENANCE_YARD')">Maint. Yard</button>
            <button style="font-size:8px;background:#0284c7;color:#fff;border:none;border-radius:3px;padding:2px 4px;cursor:pointer;" onclick="window.__DEV_SPAWN_LANDMARK__('OPEN_WATERFRONT_VISTA')">Waterfront</button>
            <button style="font-size:8px;background:#581c87;color:#fff;border:none;border-radius:3px;padding:2px 4px;cursor:pointer;" onclick="window.__DEV_SPAWN_LANDMARK__('UNDERGROUND_GRAND_STATION')">Grand Concourse</button>
            <button style="font-size:8px;background:#0d9488;color:#fff;border:none;border-radius:3px;padding:2px 4px;cursor:pointer;" onclick="window.__DEV_SPAWN_LANDMARK__('ROOFTOP_SKYLINE_MOMENT')">Rooftop</button>
          </div>
          <div style="font-weight:bold;color:#a855f7;font-size:10px;margin-bottom:3px;">ATMOSPHERE PRESET:</div>
          <div style="display:flex;gap:3px;margin-bottom:5px;flex-wrap:wrap;">
            <button style="font-size:8px;background:#3b82f6;color:#fff;border:none;border-radius:3px;padding:2px 4px;cursor:pointer;" onclick="window.__DEV_SET_ATMOSPHERE__('CLEAR_DAYLIGHT')">Clear</button>
            <button style="font-size:8px;background:#f97316;color:#fff;border:none;border-radius:3px;padding:2px 4px;cursor:pointer;" onclick="window.__DEV_SET_ATMOSPHERE__('WARM_GOLDEN_HOUR')">Golden Hour</button>
            <button style="font-size:8px;background:#64748b;color:#fff;border:none;border-radius:3px;padding:2px 4px;cursor:pointer;" onclick="window.__DEV_SET_ATMOSPHERE__('SOFT_OVERCAST')">Overcast</button>
            <button style="font-size:8px;background:#334155;color:#fff;border:none;border-radius:3px;padding:2px 4px;cursor:pointer;" onclick="window.__DEV_SET_ATMOSPHERE__('LIGHT_RAIN')">Light Rain</button>
            <button style="font-size:8px;background:#1e1b4b;color:#fff;border:none;border-radius:3px;padding:2px 4px;cursor:pointer;" onclick="window.__DEV_SET_ATMOSPHERE__('ILLUMINATED_UNDERGROUND')">Subterranean</button>
          </div>
          <div style="font-weight:bold;color:#f43f5e;font-size:10px;margin-bottom:3px;">SKIP CONTROLS:</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;">
            <button style="font-size:8px;background:#e11d48;color:#fff;border:none;border-radius:3px;padding:2px 6px;cursor:pointer;" onclick="window.__DEV_SKIP_DISTANCE__(400)">Skip +400m</button>
            <button style="font-size:8px;background:#9333ea;color:#fff;border:none;border-radius:3px;padding:2px 6px;cursor:pointer;" onclick="window.__DEV_SKIP_DISTANCE__(800)">Skip +800m</button>
          </div>
        </div>
        <div style="margin-top:6px;font-size:10px;color:#94a3b8;border-top:1px solid #1e293b;padding-top:4px;">ACTIVE CHUNK SEEDS:</div>
        <div style="max-height:75px;overflow-y:auto;font-size:10px;color:#cbd5e1;">
          ${diag.activeChunkSeeds.map(c => `<div>Chunk Z=${Math.round(c.chunkZ)} | ${c.districtId} ${c.isPortal ? '🏛️[PORTAL]' : ''} ${c.landmark ? `⭐[${c.landmark}]` : ''} | Seed: ${c.seed.toString(16)}</div>`).join('')}
        </div>
      `;
    }
  }

  public getPlayer(): Player {
    return this.player;
  }

  public getTrackManager(): TrackManager {
    return this.trackManager;
  }

  public getCameraController(): CameraController {
    return this.cameraController;
  }

  public getChaser(): ChaserModel {
    return this.chaser;
  }

  public getOpeningSequence(): OpeningSequenceController {
    return this.openingSequence;
  }

  public getPerformanceMetrics() {
    const avgDt = this.frameTimes.length > 0
      ? this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
      : 16.6;
    return {
      fps: Math.round(1000 / avgDt),
      frameTimeMs: Math.round(avgDt * 10) / 10,
      drawCalls: this.worldScene.renderer.info.render.calls,
      triangles: this.worldScene.renderer.info.render.triangles,
      geometries: this.worldScene.renderer.info.memory.geometries,
      textures: this.worldScene.renderer.info.memory.textures,
      shaderPrograms: (this.worldScene.renderer.info as any).programs?.length || 0
    };
  }

  public getPracticeController(): PracticeController {
    return this.practiceController;
  }

  public getPracticeModal(): PracticeModal {
    return this.practiceModal;
  }

  public getDevTestArena(): DevTestArena {
    return this.devTestArena;
  }

  public getReviveManager(): ReviveManager {
    return this.reviveManager;
  }

  public getReviveModal(): ReviveModal {
    return this.reviveModal;
  }

  private handleFatalCrash(reason: string): void {
    if (
      this.lifecycleState === 'DYING' ||
      this.lifecycleState === 'GAMEOVER' ||
      this.lifecycleState === 'REVIVE_OFFER' ||
      this.lifecycleState === 'REPLAY'
    ) {
      return;
    }

    if (this.activeGameMode === 'PRACTICE' || this.activeGameMode === 'ARENA') {
      return;
    }

    // 1. Authoritative transition to DYING lifecycle state
    this.lifecycleState = 'DYING';
    this.inputManager.setEnabled(false);
    this.devBugReportModal.hide();

    // 2. Chaser capture reaction & camera framing
    this.chaser.triggerCaughtReaction();
    this.cameraController.setGameOverMode(true, this.player.position);

    // 3. Ensure fatal crash analysis is recorded if not already recorded directly from TrackManager
    if (!this.crashReplayManager.getActiveAnalysis()) {
      this.crashReplayManager.recordFatalCrash({
        reason,
        player: this.player,
        chaser: this.chaser
      });
    }

    const nearbyObstacles: ObstacleInstance[] = [];
    for (let i = 0; i < this.trackManager.chunks.length; i++) {
      const chunk = this.trackManager.chunks[i];
      for (let j = 0; j < chunk.obstacles.length; j++) {
        if (chunk.obstacles[j].active) {
          nearbyObstacles.push(chunk.obstacles[j]);
        }
      }
    }

    this.bugSnapshotManager.recordFatalCollision({
      reason,
      player: this.player,
      cameraController: this.cameraController,
      nearbyObstacles
    });

    const explanation = this.crashReplayManager.getActiveExplanation();

    // 4. Smooth death animation presentation window before Revive offer or Game Over screen
    const deathDurationMs = 1200;
    this.deathTimeoutId = window.setTimeout(() => {
      this.deathTimeoutId = null;
      if (this.lifecycleState !== 'DYING') return;

      if (this.reviveManager.canOfferRevive(this.activeGameMode)) {
        this.lifecycleState = 'REVIVE_OFFER';
        this.reviveManager.beginOffer();
        const offerState = this.reviveManager.getOfferState(this.activeGameMode);

        this.reviveModal.show(
          offerState,
          this.score,
          this.coinsCount,
          () => this.onReviveAccepted(),
          () => this.onReviveDeclined(reason),
          explanation
        );
      } else {
        this.handleGameOver(reason === 'CHASER_CAPTURE' ? 'CHASER_CAPTURE' : 'CRASH', true);
      }
    }, deathDurationMs);
  }

  private onReviveAccepted(): void {
    const result = this.reviveManager.executeRevive();
    if (!result.success) {
      this.handleGameOver('CRASH', true);
      return;
    }

    if (this.deathTimeoutId) {
      clearTimeout(this.deathTimeoutId);
      this.deathTimeoutId = null;
    }

    this.reviveModal.hide();

    // 0. Reset crash replay state for fresh clean run life
    this.crashReplayManager.reset();

    // 1. Safe track respawn & obstacle clearance
    const safeLane = this.trackManager.prepareSafeReviveRespawn(this.player);

    // 2. Restore player state with safe lane, 2.0s grace period, and speed dampening
    this.player.revive(safeLane);

    // 3. Reset Chaser distance to 14m standby behind runner
    this.chaser.reset();

    // Restore camera
    this.cameraController.setGameOverMode(false, this.player.position);

    // 4. Play audio feedback
    this.soundManager.playReviveSound();

    // 5. Show celebratory HUD badge
    this.hud.clearFeedbackBadges();
    this.hud.showFeedbackBadge(`SAVED! 🔑 -${result.keysSpent}`, 'precision');

    // 6. Resume game simulation
    this.inputManager.setEnabled(true);
    this.lastTime = performance.now();
    this.lifecycleState = 'PLAYING';
  }

  private onReviveDeclined(reason: string = 'CRASH'): void {
    this.reviveManager.cancelOffer();
    this.handleGameOver(reason === 'CHASER_CAPTURE' ? 'CHASER_CAPTURE' : 'CRASH', true);
  }

  public startInstantReplay(): void {
    if (!this.crashReplayManager.hasReplayData()) return;
    const explanation = this.crashReplayManager.getActiveExplanation();
    if (!explanation) return;

    this.lifecycleState = 'REPLAY';
    this.gameOverModal.hide();
    this.crashReplayManager.startPlayback(this.player, this.cameraController);
    this.replayHUD.show(
      explanation,
      () => this.exitInstantReplay(),
      () => this.replayAgain()
    );
  }

  public exitInstantReplay(): void {
    if (this.lifecycleState !== 'REPLAY') return;
    this.crashReplayManager.stopPlayback(this.player, this.cameraController);
    this.replayHUD.hide();
    this.lifecycleState = 'GAMEOVER';
    this.gameOverModal.show(
      this.score,
      this.coinsCount,
      this.player.distanceTraveled,
      this.activeGameMode,
      undefined,
      () => this.startInstantReplay()
    );
  }

  public replayAgain(): void {
    if (this.lifecycleState !== 'REPLAY') return;
    this.crashReplayManager.startPlayback(this.player, this.cameraController);
    this.replayHUD.update(0, 0, this.crashReplayManager.getPlaybackDuration());
  }

  public getCrashReplayManager(): CrashReplayManager {
    return this.crashReplayManager;
  }

  public getReplayHUD(): ReplayHUD {
    return this.replayHUD;
  }

  /**
   * Deterministic Bug Reproduction Sandbox
   * STRICT GUARANTEE: Does NOT mutate player high scores, wallet coins, or career progression!
   */
  public startReproduction(snapshot: BugSnapshotPackage): void {
    // Sandbox mode: isolate economics & mission progress
    this.activeGameMode = 'ARENA';
    this.progression.setActiveGameMode('ARENA');
    this.lifecycleState = 'PLAYING';
    this.cameraController.setLobbyMode(false);
    this.cameraController.reset(this.player.position);
    this.player.mesh.rotation.y = 0;
    this.openingSequence.skip();
    this.startScreen.hide();
    this.pauseModal.hide();
    this.gameOverModal.hide();
    this.hud.show();
    this.inputManager.setEnabled(true);

    this.bugReproductionLoader.loadSnapshot(
      snapshot,
      this.player,
      this.trackManager,
      this.cameraController,
      (verified, reason) => {
        console.log(`[Bug Reproduction] Verification: ${verified}, Reason: ${reason}`);
        const msg = verified
          ? `✅ REPRO VERIFIED: ${reason}`
          : `⚠️ REPRO INCONCLUSIVE: ${reason}`;
        this.hud.showFeedbackBadge(msg, verified ? 'precision' : 'streak');
        setTimeout(() => {
          if (isDeveloperMode()) {
            this.devBugReportModal.openLatest();
          }
        }, 1200);
      }
    );
  }

  public getBugSnapshotManager(): BugSnapshotManager {
    return this.bugSnapshotManager;
  }

  public getBugReproductionLoader(): BugReproductionLoader {
    return this.bugReproductionLoader;
  }

  public getDebugVisualizer(): DebugVisualizer {
    return this.debugVisualizer;
  }

  public getDevBugReportModal(): DevBugReportModal {
    return this.devBugReportModal;
  }
}