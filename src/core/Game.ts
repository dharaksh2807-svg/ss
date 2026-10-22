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
import { UpgradeModal } from '../ui/UpgradeModal';
import { UpgradeManager } from '../player/UpgradeManager';
import { MissionsModal } from '../ui/MissionsModal';
import { EventSelectModal } from '../ui/EventSelectModal';
import { ProgressionManager } from '../progression/ProgressionManager';
import { GameMode } from '../progression/ProgressionTypes';

export type GameLifecycleState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export class Game {
  private canvas: HTMLCanvasElement;
  private worldScene: WorldScene;
  private cameraController: CameraController;
  private player: Player;
  private trackManager: TrackManager;
  private soundManager: SoundManager;
  private inputManager: InputManager;

  private hud: HUD;
  private startScreen: StartScreen;
  private pauseModal: PauseModal;
  private gameOverModal: GameOverModal;
  private settingsModal: SettingsModal;
  private upgradeModal: UpgradeModal;
  private missionsModal: MissionsModal;
  private eventSelectModal: EventSelectModal;

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

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.worldScene = new WorldScene(this.canvas);
    this.cameraController = new CameraController();
    this.player = new Player();
    this.worldScene.scene.add(this.player.mesh);

    this.trackManager = new TrackManager(this.worldScene.scene);
    this.soundManager = new SoundManager();
    this.inputManager = new InputManager();

    this.progression = ProgressionManager.getInstance();

    this.hud = new HUD(this.player.powerups);
    this.startScreen = new StartScreen();
    this.pauseModal = new PauseModal();
    this.gameOverModal = new GameOverModal();
    this.settingsModal = new SettingsModal(this.soundManager);
    this.upgradeModal = new UpgradeModal();
    this.missionsModal = new MissionsModal();
    this.eventSelectModal = new EventSelectModal();

    this.setupEvents();
    this.startScreen.show();
    this.hud.hide();

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
        } else {
          this.player.handleInput(action);
        }
      } else if (this.lifecycleState === 'PAUSED' && action === 'PAUSE') {
        this.resume();
      }
    });

    bus.on(EVENTS.GAME_START, () => this.startRun(this.progression.getActiveGameMode()));
    bus.on('START_MODE_RUN', (mode: GameMode) => this.startRun(mode));
    bus.on(EVENTS.GAME_PAUSE, () => this.pause());
    bus.on(EVENTS.GAME_RESUME, () => this.resume());
    bus.on(EVENTS.GAME_RESTART, () => this.startRun(this.activeGameMode));
    bus.on('GO_TO_MENU', () => this.goToMenu());

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

    bus.on(EVENTS.CRASH, () => {
      this.handleGameOver('CRASH');
    });
  }

  public startRun(mode: GameMode = 'NORMAL'): void {
    this.activeGameMode = mode;
    this.progression.setActiveGameMode(mode);

    this.lifecycleState = 'PLAYING';
    this.score = 0;
    this.coinsCount = 0;
    this.scoreMultiplier = 1;
    this.timeTrialRemaining = 60.0;
    this.coinRushElapsed = 0.0;

    this.player.reset();
    this.trackManager.reset();
    this.cameraController.reset(this.player.position);

    // Apply Mode-Specific Initial Conditions
    if (this.activeGameMode === 'SURVIVAL') {
      // Survival starts fast at 25 m/s immediately!
      this.player.speed = 25.0;
    }

    this.startScreen.hide();
    this.pauseModal.hide();
    this.gameOverModal.hide();
    this.upgradeModal.hide(false);
    this.missionsModal.hide(false);
    this.eventSelectModal.hide(false);

    this.hud.reset();
    this.hud.setMode(this.activeGameMode);
    if (this.activeGameMode === 'TIME_TRIAL') {
      this.hud.setTimeTrialTime(60.0);
    } else if (this.activeGameMode === 'COIN_RUSH') {
      this.hud.setCoinRushProgress(0, 150);
    } else if (this.activeGameMode === 'SURVIVAL') {
      this.hud.setSurvivalDistance(0);
    }
    this.hud.show();
    this.inputManager.setEnabled(true);

    EventBus.getInstance().emit(EVENTS.RUN_STARTED, this.activeGameMode);
  }

  public pause(): void {
    if (this.lifecycleState !== 'PLAYING') return;
    this.lifecycleState = 'PAUSED';
    this.inputManager.setEnabled(false);
    this.pauseModal.show();
  }

  public resume(): void {
    if (this.lifecycleState !== 'PAUSED') return;
    this.lifecycleState = 'PLAYING';
    this.inputManager.setEnabled(true);
    this.pauseModal.hide();
    this.lastTime = performance.now(); // Avoid huge delta jump
  }

  public goToMenu(): void {
    this.lifecycleState = 'MENU';
    this.hud.hide();
    this.pauseModal.hide();
    this.gameOverModal.hide();
    this.upgradeModal.hide();
    this.missionsModal.hide();
    this.eventSelectModal.hide();
    this.startScreen.show();
    this.player.reset();
    this.trackManager.reset();
    this.cameraController.reset(this.player.position);
    this.inputManager.setEnabled(false);
  }

  private handleGameOver(reason: 'CRASH' | 'TIME_TRIAL_COMPLETE' | 'COIN_RUSH_VICTORY' = 'CRASH'): void {
    if (this.lifecycleState === 'GAMEOVER') return;
    this.lifecycleState = 'GAMEOVER';
    this.inputManager.setEnabled(false);

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

    if (this.activeGameMode === 'TIME_TRIAL') {
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
    // Clamp delta-time to avoid simulation instability (e.g. tab switching)
    const dt = Math.min(rawDt, 0.08);

    if (this.lifecycleState === 'PLAYING') {
      // 1. Multiplier calculation (Time Trial awards 2X base multiplier)
      let baseMult = this.player.powerups.is2xMultiplierActive() ? 2 : 1;
      if (this.activeGameMode === 'TIME_TRIAL') {
        baseMult *= 2;
      }
      this.scoreMultiplier = baseMult;
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

      // 4. Update track chunks and collision detection
      this.trackManager.update(this.player, dt, now / 1000);

      // 5. Update score based on forward distance
      this.score += this.player.speed * dt * CONSTANTS.SCORE_PER_METER * this.scoreMultiplier;
      EventBus.getInstance().emit(EVENTS.SCORE_UPDATED, this.score);

      // 6. Update HUD UI
      this.hud.update();

      // 7. Update lighting target to center around player
      this.worldScene.updateSunPosition(this.player.position.z);
    } else if (this.lifecycleState === 'GAMEOVER') {
      // Update tumble animation
      this.player.update(dt);
    } else if (this.lifecycleState === 'MENU') {
      // Idle scene: slow gentle hover
      this.player.position.y = CONSTANTS.PLAYER_BASE_Y + Math.sin(now * 0.003) * 0.08;
      this.player.mesh.position.copy(this.player.position);
    }

    // Camera follow update
    this.cameraController.update(this.player.position, dt);

    // Render 3D Scene
    this.worldScene.renderer.render(this.worldScene.scene, this.cameraController.camera);
  }
}
