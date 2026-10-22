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

  private lifecycleState: GameLifecycleState = 'MENU';
  private lastTime: number = 0;
  private score: number = 0;
  private coinsCount: number = 0;
  private scoreMultiplier: number = 1;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.worldScene = new WorldScene(this.canvas);
    this.cameraController = new CameraController();
    this.player = new Player();
    this.worldScene.scene.add(this.player.mesh);

    this.trackManager = new TrackManager(this.worldScene.scene);
    this.soundManager = new SoundManager();
    this.inputManager = new InputManager();

    this.hud = new HUD(this.player.powerups);
    this.startScreen = new StartScreen();
    this.pauseModal = new PauseModal();
    this.gameOverModal = new GameOverModal();
    this.settingsModal = new SettingsModal(this.soundManager);
    this.upgradeModal = new UpgradeModal();

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

    bus.on(EVENTS.GAME_START, () => this.startRun());
    bus.on(EVENTS.GAME_PAUSE, () => this.pause());
    bus.on(EVENTS.GAME_RESUME, () => this.resume());
    bus.on(EVENTS.GAME_RESTART, () => this.startRun());
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
    });

    bus.on(EVENTS.NEAR_MISS, () => {
      this.score += CONSTANTS.NEAR_MISS_SCORE * this.scoreMultiplier;
      bus.emit(EVENTS.SCORE_UPDATED, this.score);
    });

    bus.on(EVENTS.CRASH, () => {
      this.handleGameOver();
    });
  }

  public startRun(): void {
    this.lifecycleState = 'PLAYING';
    this.score = 0;
    this.coinsCount = 0;
    this.scoreMultiplier = 1;

    this.player.reset();
    this.trackManager.reset();
    this.cameraController.reset(this.player.position);

    this.startScreen.hide();
    this.pauseModal.hide();
    this.gameOverModal.hide();
    this.upgradeModal.hide(false);
    this.hud.reset();
    this.hud.show();
    this.inputManager.setEnabled(true);
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
    this.startScreen.show();
    this.player.reset();
    this.trackManager.reset();
    this.cameraController.reset(this.player.position);
    this.inputManager.setEnabled(false);
  }

  private handleGameOver(): void {
    this.lifecycleState = 'GAMEOVER';
    this.inputManager.setEnabled(false);
    EventBus.getInstance().emit(EVENTS.GAME_OVER);

    // Show Game Over modal after brief collision reaction
    setTimeout(() => {
      this.hud.hide();
      this.gameOverModal.show(this.score, this.coinsCount, this.player.distanceTraveled);
    }, 1100);
  }

  private gameLoop(now: number): void {
    requestAnimationFrame(this.gameLoop.bind(this));

    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    // Clamp delta-time to avoid simulation instability (e.g. tab switching)
    const dt = Math.min(rawDt, 0.08);

    if (this.lifecycleState === 'PLAYING') {
      // 1. Multiplier calculation
      this.scoreMultiplier = this.player.powerups.is2xMultiplierActive() ? 2 : 1;
      this.hud.setMultiplier(this.scoreMultiplier);

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
