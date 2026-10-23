import * as THREE from 'three';
import { CONSTANTS } from './Constants';
import { EventBus, EVENTS } from './EventBus';
import { InputManager } from './InputManager';
import { SoundManager } from '../audio/SoundManager';
import { WorldScene } from '../scene/WorldScene';
import { CameraController } from '../scene/CameraController';
import { Player } from '../player/Player';
import { TrackManager } from '../track/TrackManager';
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
import { EnvironmentManager, MODERN_METRO_THEME, HISTORIC_QUARTER_THEME } from '../environment/EnvironmentConfig';
import { ReviveManager } from '../revive/ReviveManager';
import { ReviveModal } from '../ui/ReviveModal';

export type GameLifecycleState = 'MENU' | 'PLAYING' | 'PAUSED' | 'REVIVE_OFFER' | 'GAMEOVER';

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

  // Performance telemetry tracker
  private frameTimes: number[] = [];

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
    // Apply saved graphics quality preset
    const graphics = GraphicsManager.getInstance();
    const config = graphics.getActiveConfig();
    this.worldScene.applyGraphicsConfig(config);

    if (typeof window !== 'undefined') {
      (window as any).__METRO_GAME__ = this;
      (window as any).__GRAPHICS_MANAGER__ = graphics;
      (window as any).__SOUND_MANAGER__ = this.soundManager;
    }

    // Stage hero character in Lobby pose facing the camera
    this.player.mesh.rotation.y = Math.PI - 0.2;
    this.cameraController.setLobbyMode(true);

    this.setupEvents();
    this.startScreen.show();
    this.hud.hide();

    // Attach development scenario runner to window
    TrainScenarioRunner.getInstance().attachToWindow(this);

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
    bus.on(EVENTS.GAME_RESTART, () => this.startRun(this.activeGameMode, true));
    bus.on('GO_TO_MENU', () => this.goToMenu());

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
      this.coinsCount++;
      const bonus = CONSTANTS.COIN_SCORE_VALUE * this.scoreMultiplier;
      this.score += bonus;
      bus.emit(EVENTS.SCORE_UPDATED, this.score);
      UpgradeManager.getInstance().addCoins(1);

      // Check Coin Rush Mode victory condition (150 coins target)
      if (this.activeGameMode === 'COIN_RUSH' && this.coinsCount >= 150) {
        this.handleGameOver('COIN_RUSH_VICTORY');
      }
    });

    bus.on('CHRONO_ORB_COLLECTED', (seconds: number = 5) => {
      if (this.activeGameMode === 'TIME_TRIAL') {
        this.timeTrialRemaining += seconds;
        this.hud.setTimeTrialTime(this.timeTrialRemaining);
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
  }

  public startRun(mode: GameMode = 'NORMAL', isRetry: boolean = false): void {
    this.activeGameMode = mode;
    this.progression.setActiveGameMode(mode);

    this.lifecycleState = 'PLAYING';
    this.score = 0;
    this.coinsCount = 0;
    this.scoreMultiplier = 1;
    this.timeTrialRemaining = 60.0;
    this.coinRushElapsed = 0.0;

    this.player.reset();
    this.player.setGameMode(this.activeGameMode);
    this.trackManager.reset();
    const startEnvId = this.trackManager.getActiveEnvironment();
    const startTheme = EnvironmentManager.getInstance().getTheme(startEnvId);
    this.worldScene.applyEnvironment(startTheme);
    this.soundManager.setEnvironmentAmbience(startEnvId);
    this.locomotionVFX.reset();
    this.chaser.reset();
    this.cameraController.reset(this.player.position);

    // Apply Mode-Specific Initial Conditions
    if (this.activeGameMode === 'SURVIVAL') {
      // Survival starts fast at 25 m/s immediately!
      this.player.speed = 25.0;
    }

    this.cameraController.setLobbyMode(false);
    this.player.mesh.rotation.y = 0;

    // Start opening cinematic sequence if eligible
    this.openingSequence.start(isRetry);

    this.reviveManager.resetRun();
    this.reviveModal.hide();
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
    this.hud.hide();
    this.pauseModal.hide();
    this.reviveModal.hide();
    this.reviveManager.resetRun();
    this.gameOverModal.hide();
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

  private handleGameOver(reason: 'CRASH' | 'TIME_TRIAL_COMPLETE' | 'COIN_RUSH_VICTORY' | 'CHASER_CAPTURE' = 'CRASH'): void {
    if (this.lifecycleState === 'GAMEOVER') return;

    this.reviveModal.hide();
    this.reviveManager.cancelOffer();

    if (this.activeGameMode === 'PRACTICE' || this.activeGameMode === 'ARENA') {
      // In Practice & Arena modes, collision results are handled directly by PracticeController / DevTestArena
      // Economy, high scores, and mission rewards are strictly isolated to prevent reward farming!
      return;
    }

    this.lifecycleState = 'GAMEOVER';
    this.inputManager.setEnabled(false);
    this.chaser.triggerCaughtReaction();

    EventBus.getInstance().emit(EVENTS.RUN_FINISHED, {
      score: this.score,
      coins: this.coinsCount,
      distance: this.player.distanceTraveled,
      mode: this.activeGameMode,
      reason
    });
    EventBus.getInstance().emit(EVENTS.GAME_OVER);

    // Calculate Mode-Specific Results & Bonus Rewards
    let resultMeta: { title: string; subtitle?: string; bonusCoins?: number } = {
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
    }

    // Show Game Over modal after brief collision reaction
    setTimeout(() => {
      this.hud.hide();
      this.gameOverModal.show(
        this.score,
        this.coinsCount,
        this.player.distanceTraveled,
        this.activeGameMode,
        resultMeta
      );
    }, 1100);
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

    const effectiveDt = dt * (this.devTestArena ? this.devTestArena.getTimeScale() : 1.0);

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

        // 6. Update HUD UI
        this.hud.update(dt);

        // 7. Update lighting target to center around player and update speed lines
        this.worldScene.updateSunPosition(this.player.position.z, this.player.speed);
      }
    } else if (this.lifecycleState === 'GAMEOVER') {
      // Update tumble animation
      this.player.update(dt);
      this.chaser.update(dt, this.player.position, this.player.speed, this.player.groundY);
    } else if (this.lifecycleState === 'MENU') {
      // Idle scene: slow gentle hover & subtle sway facing camera
      this.player.position.y = CONSTANTS.PLAYER_BASE_Y + Math.sin(now * 0.003) * 0.08;
      this.player.mesh.position.copy(this.player.position);
      this.player.mesh.rotation.y = Math.PI - 0.2 + Math.sin(now * 0.001) * 0.08;
    }

    // Camera follow update with dynamic speed-based FOV and coordinated elevation tracking
    this.cameraController.update(
      this.player.position,
      dt,
      now / 1000,
      this.player.speed,
      this.player.groundY,
      this.player.isSliding
    );

    // Collision Debug Visualization (Enabled only when window.__DEBUG_COLLIDERS__ is true)
    this.updateCollisionDebugVisuals();

    // Update adaptive graphics profiling, atmospheric transitions, and ground contact shadow
    this.worldScene.updateAtmosphere(effectiveDt);
    GraphicsManager.getInstance().update(effectiveDt, this.lifecycleState === 'PLAYING');
    this.worldScene.updatePlayerContactShadow(
      this.player.position.x,
      this.player.position.y,
      this.player.position.z,
      this.player.groundY
    );

    // Update dynamic audio soundscape (speed-synchronized footsteps, loops, spatial rail rumble, adaptive music)
    this.soundManager.update(effectiveDt, this.player, this.trackManager, this.lifecycleState);

    // Render 3D Scene
    this.worldScene.renderer.render(this.worldScene.scene, this.cameraController.camera);

    if (this.devTestArena) {
      this.devTestArena.update(effectiveDt);
    }
  }

  private updateCollisionDebugVisuals(): void {
    const isDebug = typeof window !== 'undefined' && !!(window as any).__DEBUG_COLLIDERS__;
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

    // Clear previous frame debug boxes
    while (this.debugGroup.children.length > 0) {
      this.debugGroup.remove(this.debugGroup.children[0]);
    }

    // 1. Player Bounding Box (Lime Green)
    const pHelper = new THREE.Box3Helper(this.player.collider, new THREE.Color(0x00ff00));
    this.debugGroup.add(pHelper);

    // 2. Active Obstacle Collision Zones
    for (const chunk of this.trackManager.chunks) {
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;
        if (Math.abs(obs.collider.min.z - this.player.position.z) > 80) continue;

        if (obs.bodyCollider) {
          // Red for lethal lower hull
          this.debugGroup.add(new THREE.Box3Helper(obs.bodyCollider, new THREE.Color(0xff1744)));
        }
        if (obs.frontBumperCollider) {
          // Orange for front bumper
          this.debugGroup.add(new THREE.Box3Helper(obs.frontBumperCollider, new THREE.Color(0xff9100)));
        }
        if (obs.roofCollider) {
          // Cyan for traversable rooftop & landing capture zone
          this.debugGroup.add(new THREE.Box3Helper(obs.roofCollider, new THREE.Color(0x00e5ff)));
        }
        if (obs.rampCollider) {
          // Yellow for sloped climbable ramp
          this.debugGroup.add(new THREE.Box3Helper(obs.rampCollider, new THREE.Color(0xffea00)));

          // Green line showing exact mathematical support slope from ground to roof
          const roofY = obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15);
          const laneX = CONSTANTS.LANES[obs.lane];
          const slopeGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(laneX, 0.05, obs.rampCollider.max.z),
            new THREE.Vector3(laneX, roofY, obs.rampCollider.min.z)
          ]);
          const slopeLine = new THREE.Line(slopeGeo, new THREE.LineBasicMaterial({ color: 0x00ff88 }));
          this.debugGroup.add(slopeLine);
        }
        if (!obs.bodyCollider && !obs.roofCollider) {
          // Standard barriers (magenta)
          this.debugGroup.add(new THREE.Box3Helper(obs.collider, new THREE.Color(0xe91e63)));
        }
      }
    }

    // 3. Player Feet Marker (Magenta cross indicator at exact foot plane)
    const feetGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const feetMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true });
    const feetMarker = new THREE.Mesh(feetGeo, feetMat);
    feetMarker.position.set(this.player.position.x, this.player.position.y, this.player.position.z);
    this.debugGroup.add(feetMarker);

    // 4. Telemetry HUD Overlay
    if (!this.debugOverlayEl && typeof document !== 'undefined') {
      this.debugOverlayEl = document.createElement('div');
      this.debugOverlayEl.id = 'collision-debug-overlay';
      this.debugOverlayEl.style.position = 'fixed';
      this.debugOverlayEl.style.bottom = '12px';
      this.debugOverlayEl.style.left = '12px';
      this.debugOverlayEl.style.zIndex = '99999';
      this.debugOverlayEl.style.background = 'rgba(10, 14, 23, 0.92)';
      this.debugOverlayEl.style.border = '1px solid #00e5ff';
      this.debugOverlayEl.style.padding = '8px 12px';
      this.debugOverlayEl.style.borderRadius = '6px';
      this.debugOverlayEl.style.fontFamily = 'monospace';
      this.debugOverlayEl.style.fontSize = '12px';
      this.debugOverlayEl.style.color = '#e0f7fa';
      this.debugOverlayEl.style.pointerEvents = 'none';
      document.body.appendChild(this.debugOverlayEl);
    }

    if (this.debugOverlayEl) {
      this.debugOverlayEl.style.display = 'block';
      const lastDiag = (window as any).__LAST_COLLISION_DIAGNOSTIC__;
      this.debugOverlayEl.innerHTML = `
        <div style="font-weight:bold;color:#00e5ff;margin-bottom:4px;">[COLLISION DIAGNOSTICS & SCENARIO]</div>
        <div>STATE: <span style="color:#ffd600;">${this.player.state}</span> | SURFACE: <span style="color:#00e676;">${this.player.getSupportSurface()}</span></div>
        <div>SUPPORT ID: <span style="color:#00e5ff;">${this.player.getActiveSupportObstacleId() || 'NONE (GROUND)'}</span></div>
        <div>POS: Y=${this.player.position.y.toFixed(2)} (GroundY=${this.player.groundY.toFixed(2)}) | Vy=${this.player.verticalVelocity.toFixed(1)}</div>
        <div>SPEED: ${this.player.speed.toFixed(1)} m/s | Z=${this.player.position.z.toFixed(1)} (Lane=${this.player.currentLane})</div>
        <div style="font-size:10px;color:#90a4ae;margin-top:4px;">LAST EVENT: ${lastDiag ? `${lastDiag.collidingObject} (${lastDiag.classification}) ObsID=${lastDiag.obstacleId || 'N/A'}` : 'NONE'}</div>
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
    if (this.lifecycleState === 'GAMEOVER' || this.lifecycleState === 'REVIVE_OFFER') return;

    if (this.activeGameMode === 'PRACTICE' || this.activeGameMode === 'ARENA') {
      return;
    }

    if (this.reviveManager.canOfferRevive(this.activeGameMode)) {
      this.lifecycleState = 'REVIVE_OFFER';
      this.inputManager.setEnabled(false);
      this.reviveManager.beginOffer();
      const offerState = this.reviveManager.getOfferState(this.activeGameMode);

      this.reviveModal.show(
        offerState,
        this.score,
        this.coinsCount,
        () => this.onReviveAccepted(),
        () => this.onReviveDeclined(reason)
      );
    } else {
      this.handleGameOver(reason === 'CHASER_CAPTURE' ? 'CHASER_CAPTURE' : 'CRASH');
    }
  }

  private onReviveAccepted(): void {
    const result = this.reviveManager.executeRevive();
    if (!result.success) {
      this.handleGameOver('CRASH');
      return;
    }

    // 1. Safe track respawn & obstacle clearance
    const safeLane = this.trackManager.prepareSafeReviveRespawn(this.player);

    // 2. Restore player state with safe lane, 2.0s grace period, and speed dampening
    this.player.revive(safeLane);

    // 3. Reset Chaser distance to 14m standby behind runner
    this.chaser.reset();

    // 4. Play audio feedback
    this.soundManager.playReviveSound();

    // 5. Show celebratory HUD badge
    this.hud.showFeedbackBadge(`SAVED! 🔑 -${result.keysSpent}`, 'precision');

    // 6. Resume game simulation
    this.inputManager.setEnabled(true);
    this.lastTime = performance.now();
    this.lifecycleState = 'PLAYING';
  }

  private onReviveDeclined(reason: string = 'CRASH'): void {
    this.reviveManager.cancelOffer();
    this.handleGameOver(reason === 'CHASER_CAPTURE' ? 'CHASER_CAPTURE' : 'CRASH');
  }
}
