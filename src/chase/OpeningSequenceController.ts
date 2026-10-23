import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';
import { Player } from '../player/Player';
import { CameraController } from '../scene/CameraController';
import { ChaserModel } from '../characters/ChaserModel';

export type IntroPreference = 'ALWAYS' | 'FIRST_ONLY' | 'DISABLED';

export class OpeningSequenceController {
  private isIntroActive: boolean = false;
  private introElapsed: number = 0;
  private readonly introDuration: number = 2.4; // 2.4s total cinematic
  private skipBtn: HTMLElement | null = null;
  private hasBlownWhistle: boolean = false;

  private onCompleteCallback: (() => void) | null = null;

  constructor(
    private player: Player,
    private cameraController: CameraController,
    private chaser: ChaserModel
  ) {
    this.createSkipUI();
    this.setupInputListeners();
  }

  private createSkipUI(): void {
    if (typeof document === 'undefined') return;

    let btn = document.getElementById('intro-skip-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'intro-skip-btn';
      btn.className = 'intro-skip-pill hidden';
      btn.innerHTML = '<span>SKIP ⏩</span> <kbd>SPACE</kbd>';
      btn.setAttribute('aria-label', 'Skip Opening Cinematic');
      const targetContainer = document.getElementById('ui-overlay') || document.body;
      targetContainer.appendChild(btn);
    }
    this.skipBtn = btn;

    this.skipBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.skip();
    });
  }

  private setupInputListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      if (!this.isIntroActive) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        e.preventDefault();
        this.skip();
      }
    });

    window.addEventListener('touchstart', () => {
      if (!this.isIntroActive) return;
      this.skip();
    }, { passive: true });
  }

  public getPreference(): IntroPreference {
    if (typeof localStorage === 'undefined') return 'FIRST_ONLY';
    const saved = localStorage.getItem('metro_opening_cinematic');
    if (saved === 'ALWAYS' || saved === 'FIRST_ONLY' || saved === 'DISABLED') {
      return saved;
    }
    return 'FIRST_ONLY';
  }

  public setPreference(pref: IntroPreference): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('metro_opening_cinematic', pref);
    }
  }

  public shouldPlayIntro(isRetry: boolean = false): boolean {
    const pref = this.getPreference();
    if (pref === 'DISABLED') return false;
    if (pref === 'FIRST_ONLY' && isRetry) return false;
    return true;
  }

  public start(isRetry: boolean = false, onComplete?: () => void): boolean {
    this.onCompleteCallback = onComplete || null;

    if (!this.shouldPlayIntro(isRetry)) {
      this.finish(true);
      return false;
    }

    this.isIntroActive = true;
    this.introElapsed = 0;
    this.hasBlownWhistle = false;

    // 1. Position runner at start
    this.player.position.set(0, CONSTANTS.PLAYER_BASE_Y, 0);
    this.player.currentLane = 0;
    this.player.targetLane = 0;
    this.player.speed = 0; // Stationary at start
    this.player.mesh.rotation.y = 2.45; // Energetic glance back over shoulder towards security officer
    this.player.isIntroInvincible = true; // Guard against unfair early hazards during intro

    // 2. Position Chaser (Officer Thorne)
    this.chaser.setMode('INTRO');
    this.chaser.mesh.visible = true;

    // 3. Setup Camera for Cinematic Intro
    this.cameraController.setIntroMode(true, this.player.position);

    // 4. Show Skip Button
    if (this.skipBtn) {
      this.skipBtn.classList.remove('hidden');
    }

    EventBus.getInstance().emit(EVENTS.INTRO_STARTED);
    return true;
  }

  public skip(): void {
    if (!this.isIntroActive) return;
    this.finish(false);
  }

  public isActive(): boolean {
    return this.isIntroActive;
  }

  public update(dt: number): void {
    if (!this.isIntroActive) return;

    this.introElapsed += dt;
    const progress = Math.min(1.0, this.introElapsed / this.introDuration);

    // -----------------------------------------------------------------
    // Phase 1 (0.0s – 0.85s): The Encounter & Whistle Alert
    // -----------------------------------------------------------------
    if (progress < 0.35) {
      this.player.speed = 0;
      this.player.mesh.rotation.y = 2.45; // Looking back directly at the guard

      if (!this.hasBlownWhistle && this.introElapsed >= 0.15) {
        this.hasBlownWhistle = true;
        EventBus.getInstance().emit(EVENTS.CHASER_WHISTLE);
      }
    }
    // -----------------------------------------------------------------
    // Phase 2 (0.85s – 1.6s): Sprint Burst & Takeoff
    // -----------------------------------------------------------------
    else if (progress < 0.68) {
      const takeOffT = (progress - 0.35) / 0.33;
      // Smooth cubic acceleration from 0 to full running speed
      const accelFactor = takeOffT * takeOffT * (3.0 - 2.0 * takeOffT);
      this.player.speed = accelFactor * CONSTANTS.INITIAL_SPEED;
      this.player.mesh.rotation.y = (1.0 - takeOffT) * 2.45; // Smoothly whip around to face forward

      // Player advances down the track
      this.player.position.z -= this.player.speed * dt;
      this.player.mesh.position.copy(this.player.position);
      this.player.update(dt);
    }
    // -----------------------------------------------------------------
    // Phase 3 (1.6s – 2.4s): Camera Blend into Gameplay View
    // -----------------------------------------------------------------
    else {
      this.player.speed = CONSTANTS.INITIAL_SPEED;
      this.player.position.z -= this.player.speed * dt;
      this.player.mesh.position.copy(this.player.position);
      this.player.update(dt);
    }

    // Update Chaser in pursuit
    this.chaser.update(dt, this.player.position, this.player.speed, this.player.groundY);

    // Update Cinematic Camera
    this.cameraController.updateIntro(progress, this.player.position, dt);

    // Sequence completed
    if (this.introElapsed >= this.introDuration) {
      this.finish(false);
    }
  }

  private finish(immediateSkip: boolean = false): void {
    this.isIntroActive = false;
    this.introElapsed = 0;

    // Hide Skip UI
    if (this.skipBtn) {
      this.skipBtn.classList.add('hidden');
    }

    // Set player to standard running speed & forward orientation
    this.player.speed = CONSTANTS.INITIAL_SPEED;
    this.player.mesh.rotation.y = 0;
    this.player.isIntroInvincible = false; // Normal collision active

    // Smoothly restore standard camera
    this.cameraController.finishIntro(this.player.position);

    // Put Chaser into standby trailing mode
    this.chaser.setMode('STANDBY');

    EventBus.getInstance().emit(EVENTS.INTRO_FINISHED);

    if (this.onCompleteCallback) {
      this.onCompleteCallback();
      this.onCompleteCallback = null;
    }
  }
}
