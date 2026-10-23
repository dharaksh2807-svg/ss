import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';
import { CharacterModel, JumpPhase } from './CharacterModel';
import { PowerupManager } from './PowerupManager';
import { InputAction } from '../core/InputManager';
import { ProgressionManager } from '../progression/ProgressionManager';
import { CharacterId } from '../characters/CharacterCatalog';
import { HoverboardManager } from '../hoverboard/HoverboardManager';

import { SpeedController } from '../core/SpeedController';
import { PacingMetrics } from '../track/PacingMetrics';
import { GameMode } from '../progression/ProgressionTypes';

export type PlayerState = 
  | 'IDLE' 
  | 'RUN' 
  | 'JUMP' 
  | 'FALLING' 
  | 'CLIMBING' 
  | 'ON_TRAIN' 
  | 'FALLING_FROM_TRAIN' 
  | 'SLIDE' 
  | 'JETPACK' 
  | 'CRASH';

export type SupportSurfaceType = 'GROUND' | 'TRAIN_ROOF' | 'RAMP';

export type JetpackPhase = 'NONE' | 'TAKEOFF' | 'CRUISE' | 'DESCENT' | 'SAFE_LANDING';

export class Player {
  public mesh: THREE.Group;
  public model: CharacterModel;
  public powerups: PowerupManager;
  public hoverboardManager: HoverboardManager;
  public speedController: SpeedController = new SpeedController();

  // Position & Kinematics
  public position: THREE.Vector3 = new THREE.Vector3(0, CONSTANTS.PLAYER_BASE_Y, 0);
  public previousPosition: THREE.Vector3 = new THREE.Vector3(0, CONSTANTS.PLAYER_BASE_Y, 0);
  
  public get speed(): number {
    return this.speedController ? this.speedController.getSpeed() : CONSTANTS.INITIAL_SPEED;
  }
  public set speed(val: number) {
    if (this.speedController) {
      this.speedController.setSpeed(val);
    }
  }

  public currentLane: LaneIndex = 0; // -1: Left, 0: Center, 1: Right
  public get lane(): LaneIndex { return this.currentLane; }
  public targetLane: LaneIndex = 0;
  public groundY: number = CONSTANTS.PLAYER_BASE_Y;
  public supportSurface: SupportSurfaceType = 'GROUND';
  public activeSupportObstacleId: string | null = null;
  public readonly jetpackAltitude: number = 9.0;

  // Lateral lane transition
  private isChangingLane: boolean = false;
  private laneChangeStartX: number = 0;
  private laneChangeTargetX: number = 0;
  private laneChangeTimer: number = 0;
  private laneChangeDuration: number = CONSTANTS.LANE_CHANGE_DURATION;
  private queuedLaneChange: -1 | 1 | null = null;
  private bankingAngle: number = 0;

  // Authoritative Jump & Slide State
  public verticalVelocity: number = 0;
  public isJumping: boolean = false;
  public isFastDropping: boolean = false;
  public jumpTime: number = 0;
  public jumpProgress: number = 0;
  public jumpTakeoffVelocity: number = CONSTANTS.JUMP_INITIAL_VELOCITY;
  public jumpPhase: JumpPhase = 'NONE';
  public landingTimer: number = 0;
  public wasFastDropLand: boolean = false;

  public isSliding: boolean = false;
  private slideTimer: number = 0;
  public isUnderOverheadObstacle: boolean = false;

  // Gameplay State
  public state: PlayerState = 'IDLE';
  public distanceTraveled: number = 0;
  public isStumbling: boolean = false;
  private stumbleTimer: number = 0;
  public isIntroInvincible: boolean = false;
  public lastJumpDist: number = -999;
  public lastSlideDist: number = -999;

  // Jetpack Flight Lifecycle State
  private jetpackPhase: JetpackPhase = 'NONE';
  private jetpackTakeoffTimer: number = 0;
  private jetpackDescentTimer: number = 0;
  private jetpackStartY: number = CONSTANTS.PLAYER_BASE_Y;
  private flightAnimTime: number = 0;

  // Hitbox AABB
  public collider: THREE.Box3 = new THREE.Box3();
  private eventBus = EventBus.getInstance();

  constructor() {
    this.mesh = new THREE.Group();

    const prog = ProgressionManager.getInstance();
    const selChar = prog.getSelectedCharacter() as CharacterId;
    const selOutfit = prog.getSelectedOutfit(selChar);

    this.model = new CharacterModel(selChar, selOutfit);
    this.mesh.add(this.model.mesh);

    this.powerups = new PowerupManager();
    this.hoverboardManager = HoverboardManager.getInstance();
    this.updateCollider();

    this.eventBus.on('CHARACTER_EQUIPPED', (data: { charId: string; outfitId: string }) => {
      this.applyCharacter(data.charId, data.outfitId);
    });
  }

  public applyCharacter(characterId: string, outfitId?: string): void {
    const prevMesh = this.model.mesh;
    this.model.applyCharacter(characterId as CharacterId, outfitId);
    if (this.model.mesh !== prevMesh) {
      this.mesh.remove(prevMesh);
      this.mesh.add(this.model.mesh);
    }
    this.model.mesh.rotation.set(0, 0, 0);
    this.updateCollider();
  }

  public reset(): void {
    this.currentLane = 0; // Center lane
    this.targetLane = 0;
    this.position.set(0, CONSTANTS.PLAYER_BASE_Y, 0);
    this.mesh.position.copy(this.position);
    this.mesh.rotation.set(0, 0, 0);
    this.model.mesh.rotation.set(0, 0, 0);
    this.speedController.reset();
    this.groundY = CONSTANTS.PLAYER_BASE_Y;
    this.verticalVelocity = 0;
    this.isJumping = false;
    this.isFastDropping = false;
    this.jumpTime = 0;
    this.jumpProgress = 0;
    this.jumpPhase = 'NONE';
    this.landingTimer = 0;
    this.wasFastDropLand = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.isUnderOverheadObstacle = false;
    this.isChangingLane = false;
    this.queuedLaneChange = null;
    this.bankingAngle = 0;
    this.distanceTraveled = 0;
    this.isStumbling = false;
    this.stumbleTimer = 0;
    this.isIntroInvincible = false;
    this.lastJumpDist = -999;
    this.lastSlideDist = -999;
    this.supportSurface = 'GROUND';
    this.activeSupportObstacleId = null;
    this.previousPosition.copy(this.position);
    this.state = 'RUN';
    this.jetpackPhase = 'NONE';
    this.jetpackTakeoffTimer = 0;
    this.jetpackDescentTimer = 0;
    this.flightAnimTime = 0;
    this.powerups.reset();
    this.hoverboardManager.reset();

    // Ensure model reflects current selected character & outfit
    const prog = ProgressionManager.getInstance();
    const selChar = prog.getSelectedCharacter() as CharacterId;
    const selOutfit = prog.getSelectedOutfit(selChar);
    if (this.model.getCharacterId() !== selChar || this.model.getOutfitId() !== selOutfit) {
      this.applyCharacter(selChar, selOutfit);
    }

    this.model.setHoverboardVisible(false);
    this.model.setSuperSneakersActive(false);
    this.model.setJetpackVisible(false);
    this.model.setShieldVisible(false);
    this.model.setMagnetVisible(false);
    this.model.setInvulnerable(false);
    this.updateCollider();
  }

  public setGameMode(mode: GameMode): void {
    this.speedController.setMode(mode);
  }

  public handleInput(action: InputAction): void {
    if (this.state === 'CRASH' || this.state === 'IDLE') return;

    PacingMetrics.getInstance().recordAction(performance.now() / 1000);

    // During jetpack flight, jump, slide, and hoverboard are disabled; lateral steering remains fully active
    if (this.state === 'JETPACK' || this.jetpackPhase !== 'NONE') {
      if (action === 'LEFT') this.changeLane(-1);
      if (action === 'RIGHT') this.changeLane(1);
      // Airborne inputs (UP, DOWN, ACTION) are explicitly suppressed and NOT queued for execution after landing
      return;
    }

    switch (action) {
      case 'LEFT':
        this.changeLane(-1);
        break;
      case 'RIGHT':
        this.changeLane(1);
        break;
      case 'UP':
        this.jump();
        break;
      case 'DOWN':
        this.slide();
        break;
      case 'ACTION':
        // Double-tap or spacebar activates hoverboard
        this.hoverboardManager.activate();
        break;
    }
  }

  private changeLane(direction: -1 | 1): void {
    if (this.isChangingLane) {
      // Buffer the next lane switch ONLY if destination from target is within bounds [-1, 1]
      const potentialNextLane = this.targetLane + direction;
      if (potentialNextLane >= -1 && potentialNextLane <= 1) {
        this.queuedLaneChange = direction;
      }
      return;
    }

    const nextLane = THREE.MathUtils.clamp(this.currentLane + direction, -1, 1) as LaneIndex;
    if (nextLane === this.currentLane) {
      // Hit outer side boundary / wall bump feedback
      this.stumble();
      this.bankingAngle = direction * -0.15;
      return;
    }

    this.targetLane = nextLane;
    this.laneChangeStartX = this.position.x;
    this.laneChangeTargetX = CONSTANTS.LANES[nextLane];
    this.laneChangeTimer = 0;
    this.isChangingLane = true;
    this.queuedLaneChange = null;

    // Dynamic duration based on current speed and hoverboard handling ability
    const speedRatio = (this.speed - CONSTANTS.INITIAL_SPEED) / (CONSTANTS.MAX_SPEED - CONSTANTS.INITIAL_SPEED);
    const baseDuration = Math.max(0.12, CONSTANTS.LANE_CHANGE_DURATION * (1.0 - speedRatio * 0.25));
    this.laneChangeDuration = baseDuration * this.hoverboardManager.getLaneChangeDurationMultiplier();

    this.eventBus.emit(EVENTS.LANE_CHANGE, nextLane);
  }

  public jump(): void {
    if (this.isJumping) return;
    if (this.isUnderOverheadObstacle) return; // Cannot jump upright into overhead barrier!

    // Cancel slide if currently sliding
    if (this.isSliding) {
      this.isSliding = false;
      this.slideTimer = 0;
    }

    this.isJumping = true;
    this.isFastDropping = false;
    this.jumpTime = 0;
    this.jumpProgress = 0;
    this.jumpPhase = 'TAKEOFF';
    this.landingTimer = 0;
    this.wasFastDropLand = false;
    this.lastJumpDist = this.distanceTraveled;
    this.state = 'JUMP';
    this.supportSurface = 'GROUND';
    this.activeSupportObstacleId = null;

    let jumpVelocity = CONSTANTS.JUMP_INITIAL_VELOCITY;
    if (this.powerups.isSuperSneakersActive()) {
      jumpVelocity *= this.powerups.getJumpVelocityMultiplier();
    }
    if (this.hoverboardManager.isBoardActive()) {
      jumpVelocity *= this.hoverboardManager.getJumpVelocityMultiplier();
    }
    this.verticalVelocity = jumpVelocity;
    this.jumpTakeoffVelocity = jumpVelocity;

    this.eventBus.emit(EVENTS.JUMP);
  }

  public slide(): void {
    if (this.isJumping) {
      // Fast drop / dive-down mechanic when pressing down while airborne!
      this.verticalVelocity = CONSTANTS.FAST_DROP_SPEED;
      this.isFastDropping = true;
      this.jumpPhase = 'FAST_DROP';
      this.eventBus.emit(EVENTS.FAST_DROP);
      return;
    }

    if (this.isSliding) {
      // Seamlessly refresh slide duration if user re-swipes down while sliding
      this.slideTimer = CONSTANTS.SLIDE_DURATION;
      return;
    }

    this.isSliding = true;
    this.lastSlideDist = this.distanceTraveled;
    this.slideTimer = CONSTANTS.SLIDE_DURATION;
    this.state = 'SLIDE';
    this.updateCollider();
    this.eventBus.emit(EVENTS.SLIDE);
  }

  public update(dt: number): void {
    if (this.state === 'IDLE') return;

    // Cache position for swept / continuous collision detection
    this.previousPosition.copy(this.position);

    // Powerups & Hoverboard status & visual accessories
    this.powerups.update(dt);
    this.hoverboardManager.update(dt);

    const isBoardActive = this.hoverboardManager.isBoardActive();
    this.model.setHoverboardVisible(isBoardActive, this.hoverboardManager.getActiveBoard()?.id);
    this.model.setSuperSneakersActive(this.powerups.isSuperSneakersActive());
    this.model.setJetpackVisible(this.powerups.isJetpackActive());
    this.model.setShieldVisible(this.powerups.hasShieldActive());
    this.model.setMagnetVisible(this.powerups.isMagnetActive() || (isBoardActive && this.hoverboardManager.getMagnetRadiusBonus() > 0));
    this.model.setInvulnerable(this.powerups.isInvulnerable() || this.hoverboardManager.isInvulnerableAfterCrash());

    if (this.state === 'CRASH') {
      this.model.updateAnimation(this.state, this.speed, 0, this.groundY, dt);
      return;
    }

    // Handle stumble timer decay
    if (this.isStumbling) {
      this.stumbleTimer -= dt;
      if (this.stumbleTimer <= 0) {
        this.isStumbling = false;
        this.stumbleTimer = 0;
      }
    }

    // 1. Forward Movement (with smooth stumble speed dip and hoverboard speed boost)
    let effectiveSpeed = this.isStumbling
      ? this.speed * (1.0 - CONSTANTS.STUMBLE_SPEED_DROP)
      : this.speed;
    effectiveSpeed *= this.hoverboardManager.getSpeedMultiplier();
    const forwardStep = effectiveSpeed * dt;
    this.position.z -= forwardStep; // Moving forward along negative Z
    this.distanceTraveled += forwardStep;
    this.eventBus.emit(EVENTS.DISTANCE_TRAVELED, forwardStep);

    // Speed progression (Nonlinear, configurable, frame-rate independent)
    this.speedController.update(dt, this.distanceTraveled);
    PacingMetrics.getInstance().recordSpeed(this.distanceTraveled / Math.max(1, this.speed), this.speed);

    // 2. Lateral Movement (Lane Transition)
    if (this.isChangingLane) {
      this.laneChangeTimer += dt;
      const progress = Math.min(1.0, this.laneChangeTimer / this.laneChangeDuration);

      // Smooth cosine easing
      const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI);
      this.position.x = THREE.MathUtils.lerp(this.laneChangeStartX, this.laneChangeTargetX, eased);

      // Banking angle tilts towards direction of turn
      const targetDelta = this.laneChangeTargetX - this.laneChangeStartX;
      this.bankingAngle = Math.sin(progress * Math.PI) * Math.sign(targetDelta) * CONSTANTS.LANE_BANK_ANGLE;

      if (progress >= 1.0) {
        this.position.x = this.laneChangeTargetX;
        this.currentLane = this.targetLane;
        this.isChangingLane = false;
        this.bankingAngle = 0;

        // Process queued lane change
        if (this.queuedLaneChange !== null) {
          const queued = this.queuedLaneChange;
          this.queuedLaneChange = null;
          this.changeLane(queued);
        }
      }
    } else {
      this.bankingAngle *= Math.exp(-12.0 * dt); // Smooth decay back to upright
    }

    // 3. Vertical Movement & Flight Modes (NORMAL -> TAKEOFF -> CRUISE -> DESCENT -> SAFE_LANDING)
    if (this.powerups.isJetpackActive()) {
      if (this.jetpackPhase === 'NONE') {
        this.jetpackPhase = 'TAKEOFF';
        this.state = 'JETPACK';
        this.isJumping = false;
        this.isFastDropping = false;
        this.isSliding = false;
        this.jetpackStartY = this.position.y;
        this.jetpackTakeoffTimer = 0;
        this.flightAnimTime = 0;
        this.model.setJetpackVisible(true);
        this.eventBus.emit(EVENTS.JETPACK_TAKEOFF);
      }

      this.flightAnimTime += dt;
      const remaining = this.powerups.getJetpackRemaining();

      if (this.jetpackPhase === 'TAKEOFF') {
        this.jetpackTakeoffTimer += dt;
        const takeoffDuration = CONSTANTS.JETPACK_TAKEOFF_DURATION || 1.0;
        const t = Math.min(1.0, this.jetpackTakeoffTimer / takeoffDuration);
        const ease = t * t * (3.0 - 2.0 * t); // Smoothstep cubic ease-in-out
        this.position.y = this.jetpackStartY + (this.jetpackAltitude - this.jetpackStartY) * ease;

        if (t >= 1.0) {
          this.jetpackPhase = 'CRUISE';
          this.eventBus.emit(EVENTS.JETPACK_CRUISE);
        }
      } else if (this.jetpackPhase === 'CRUISE') {
        const descentWindow = CONSTANTS.JETPACK_DESCENT_DURATION || 1.8;
        if (remaining <= descentWindow) {
          this.jetpackPhase = 'DESCENT';
          this.jetpackDescentTimer = 0;
          this.eventBus.emit(EVENTS.JETPACK_DESCENT);
        } else {
          // Subtle aerodynamic harmonic float bobbing at cruise altitude
          const bob = Math.sin(this.flightAnimTime * 2.8) * 0.08;
          this.position.y = this.jetpackAltitude + bob;
        }
      } else if (this.jetpackPhase === 'DESCENT') {
        this.jetpackDescentTimer += dt;
        const descentDuration = CONSTANTS.JETPACK_DESCENT_DURATION || 1.8;
        const t = Math.min(1.0, this.jetpackDescentTimer / descentDuration);
        const ease = t * t * (3.0 - 2.0 * t);
        this.position.y = this.jetpackAltitude - (this.jetpackAltitude - this.groundY) * ease;
      }
    } else {
      // If exiting jetpack state
      if (this.state === 'JETPACK' || this.jetpackPhase !== 'NONE') {
        this.jetpackPhase = 'SAFE_LANDING';
        this.position.y = this.groundY;
        this.state = this.supportSurface === 'TRAIN_ROOF' ? 'ON_TRAIN' : 'RUN';
        this.model.setJetpackVisible(false);
        this.landingTimer = CONSTANTS.LANDING_ABSORB_DURATION;
        this.powerups.grantInvulnerability(1.5);
        this.eventBus.emit(EVENTS.JETPACK_LANDED);
        this.eventBus.emit(EVENTS.LAND);
        this.jetpackPhase = 'NONE';
      }

      // Regular Ground & Airborne Jump Physics (Authoritative delta-time simulation)
      if (this.isJumping) {
        const effectiveGravity = this.hoverboardManager.isBoardActive()
          ? CONSTANTS.GRAVITY * this.hoverboardManager.getGravityMultiplier()
          : CONSTANTS.GRAVITY;

        this.jumpTime += dt;
        // Midpoint / Velocity-Verlet ballistic integration: exactly reproduces continuous ballistic motion at any dt
        this.position.y += (this.verticalVelocity - 0.5 * effectiveGravity * dt) * dt;
        this.verticalVelocity -= effectiveGravity * dt;

        // Dynamic jump phase determination
        if (this.isFastDropping) {
          this.jumpPhase = 'FAST_DROP';
        } else if (this.jumpTime < 0.06) {
          this.jumpPhase = 'TAKEOFF';
        } else if (this.verticalVelocity > 2.0) {
          this.jumpPhase = 'ASCENDING';
        } else if (Math.abs(this.verticalVelocity) <= 2.0) {
          this.jumpPhase = 'APEX';
        } else {
          this.jumpPhase = 'DESCENDING';
        }

        if (this.verticalVelocity < -0.1 && this.state === 'JUMP') {
          this.state = 'FALLING';
        }

        // Normalized progress across jump
        const totalAirtimeEst = (2.0 * this.jumpTakeoffVelocity) / effectiveGravity;
        this.jumpProgress = Math.min(1.0, this.jumpTime / Math.max(0.01, totalAirtimeEst));

        // Landing check on current ground height (supports track ground or train roofs!)
        if (this.position.y <= this.groundY) {
          this.position.y = this.groundY;
          this.verticalVelocity = 0;
          this.isJumping = false;
          const fastDrop = this.isFastDropping;
          this.isFastDropping = false;
          this.wasFastDropLand = fastDrop;
          this.jumpPhase = 'LANDING';
          this.landingTimer = CONSTANTS.LANDING_ABSORB_DURATION;

          if (this.groundY > CONSTANTS.PLAYER_BASE_Y + 1.0) {
            this.supportSurface = 'TRAIN_ROOF';
            if (!this.isSliding) {
              this.state = 'ON_TRAIN';
            }
          } else {
            this.supportSurface = 'GROUND';
            if (!this.isSliding) {
              this.state = 'RUN';
            }
          }
          this.eventBus.emit(EVENTS.LAND, {
            isFastDrop: fastDrop,
            surface: this.supportSurface,
            position: this.position
          });
          this.eventBus.emit(EVENTS.JUMP_COMPLETED);
        }
      } else {
        // Landing absorption timer decay
        if (this.landingTimer > 0) {
          this.landingTimer -= dt;
          if (this.landingTimer <= 0) {
            this.landingTimer = 0;
            this.jumpPhase = 'NONE';
            this.wasFastDropLand = false;
          }
        }

        // Keep grounded or handle stepping off elevated train roofs
        if (this.position.y > this.groundY + 0.15) {
          this.isJumping = true;
          this.isFastDropping = false;
          this.jumpTime = 0.2;
          this.jumpPhase = 'DESCENDING';
          this.state = this.supportSurface === 'TRAIN_ROOF' ? 'FALLING_FROM_TRAIN' : 'FALLING';
          this.supportSurface = 'GROUND';
          this.activeSupportObstacleId = null;
          this.verticalVelocity = Math.min(this.verticalVelocity, -2.0);
        } else {
          this.position.y = this.groundY;
          if (this.state !== 'SLIDE') {
            if (this.supportSurface === 'TRAIN_ROOF') {
              this.state = 'ON_TRAIN';
            } else if (this.supportSurface === 'RAMP') {
              this.state = 'CLIMBING';
            } else {
              this.state = 'RUN';
            }
          }
        }
      }
    }

    // 4. Slide Timer & Obstacle Overhead Protection
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        if (this.isUnderOverheadObstacle) {
          // Keep sliding safely until completely cleared of overhead obstacle!
          this.slideTimer = 0.05;
        } else {
          this.isSliding = false;
          this.slideTimer = 0;
          if (!this.isJumping && this.state !== 'JETPACK') {
            this.state = this.supportSurface === 'TRAIN_ROOF' ? 'ON_TRAIN' : 'RUN';
          }
          this.eventBus.emit(EVENTS.SLIDE_COMPLETED);
        }
      }
    }

    // Update mesh position
    this.mesh.position.copy(this.position);

    // Compute progress values for animation controller
    let slideProgress = 0;
    if (this.isSliding) {
      if (this.isUnderOverheadObstacle) {
        // Lock at full SLIDE_HOLD depth (progress 0.50) while under barrier to guarantee low silhouette
        slideProgress = 0.50;
      } else {
        slideProgress = 1.0 - Math.max(0, this.slideTimer / CONSTANTS.SLIDE_DURATION);
      }
    }
    const landingProgress = this.landingTimer > 0 ? 1.0 - (this.landingTimer / CONSTANTS.LANDING_ABSORB_DURATION) : 0;

    // Update model locomotion animation with full phase and progress context
    const activeLocomotionState = (this.isStumbling && !this.isJumping && !this.isSliding)
      ? 'STUMBLE'
      : this.state;

    this.model.updateAnimation(
      activeLocomotionState,
      this.speed,
      this.bankingAngle,
      this.groundY,
      dt,
      this.jumpPhase,
      this.jumpProgress,
      slideProgress,
      landingProgress,
      this.wasFastDropLand
    );

    // Update AABB collider
    this.updateCollider();
  }

  public setGroundHeight(targetY: number): void {
    this.groundY = targetY;
  }

  public setSupportSurface(surface: SupportSurfaceType, obstacleId?: string | null): void {
    this.supportSurface = surface;
    if (surface === 'GROUND') {
      this.activeSupportObstacleId = null;
    } else if (obstacleId !== undefined) {
      this.activeSupportObstacleId = obstacleId;
    }
  }

  public getSupportSurface(): SupportSurfaceType {
    return this.supportSurface;
  }

  public getActiveSupportObstacleId(): string | null {
    return this.activeSupportObstacleId;
  }

  public setActiveSupportObstacleId(id: string | null): void {
    this.activeSupportObstacleId = id;
  }

  public resolveRoofLanding(roofY: number, obstacleId?: string | null): void {
    const fastDrop = this.isFastDropping;
    this.position.y = roofY;
    this.groundY = roofY;
    this.verticalVelocity = 0;
    this.isJumping = false;
    this.isFastDropping = false;
    this.wasFastDropLand = fastDrop;
    this.jumpPhase = 'LANDING';
    this.landingTimer = CONSTANTS.LANDING_ABSORB_DURATION;
    this.setSupportSurface('TRAIN_ROOF', obstacleId);
    if (!this.isSliding) {
      this.state = 'ON_TRAIN';
    }
    this.eventBus.emit(EVENTS.LAND, {
      isFastDrop: fastDrop,
      surface: this.supportSurface,
      position: this.position
    });
    this.eventBus.emit(EVENTS.JUMP_COMPLETED);
    this.updateCollider();
  }

  public crash(reason: string = 'OBSTACLE_COLLISION'): boolean {
    // 0. Intro cinematic invulnerability protection
    if (this.isIntroInvincible) {
      return false;
    }

    // 1. Invulnerability grace window active
    if (this.powerups.isInvulnerable() || this.hoverboardManager.isInvulnerableAfterCrash()) {
      return false; // Ignored during grace period
    }

    // 2. Protective Shield absorbs collision
    if (this.powerups.consumeShield()) {
      this.eventBus.emit(EVENTS.CHASER_STUMBLE_REACTION);
      return false; // Absorbed by shield!
    }

    // 3. Hoverboard absorbs collision
    if (this.hoverboardManager.breakBoard()) {
      this.eventBus.emit(EVENTS.CHASER_STUMBLE_REACTION);
      return false; // Absorbed by hoverboard!
    }

    this.state = 'CRASH';
    this.eventBus.emit(EVENTS.CRASH, reason);
    return true; // Fatal crash
  }

  public updateCollider(): void {
    const halfW = CONSTANTS.PLAYER_WIDTH * 0.5;
    const halfD = CONSTANTS.PLAYER_DEPTH * 0.5;
    const height = this.isSliding ? CONSTANTS.PLAYER_HEIGHT_SLIDE : CONSTANTS.PLAYER_HEIGHT_RUN;

    this.collider.min.set(
      this.position.x - halfW,
      this.position.y,
      this.position.z - halfD
    );
    this.collider.max.set(
      this.position.x + halfW,
      this.position.y + height,
      this.position.z + halfD
    );
  }

  public getCollider(): THREE.Box3 {
    return this.collider;
  }

  public isChangingLaneActive(): boolean {
    return this.isChangingLane;
  }

  public getJetpackPhase(): JetpackPhase {
    return this.jetpackPhase;
  }

  public stumble(): void {
    if (this.isIntroInvincible) return;
    if (this.state === 'CRASH' || this.state === 'IDLE') return;
    if (this.powerups.isInvulnerable()) return;

    this.isStumbling = true;
    this.stumbleTimer = CONSTANTS.STUMBLE_DURATION;
    this.eventBus.emit(EVENTS.STUMBLE);
  }

  public bounceBackFromSide(): void {
    if (this.state === 'CRASH' || this.state === 'IDLE') return;
    if (this.isChangingLane) {
      this.isChangingLane = false;
      this.targetLane = this.currentLane;
      this.position.x = CONSTANTS.LANES[this.currentLane];
      this.queuedLaneChange = null;
      this.bankingAngle = 0;
      this.updateCollider();
    }
    this.stumble();
  }

  public getEffectiveSpeed(): number {
    return this.isStumbling ? this.speed * (1.0 - CONSTANTS.STUMBLE_SPEED_DROP) : this.speed;
  }

  public setUnderOverheadObstacle(under: boolean): void {
    this.isUnderOverheadObstacle = under;
  }

  public isUnderOverhead(): boolean {
    return this.isUnderOverheadObstacle;
  }

  public getJumpPhase(): JumpPhase {
    return this.jumpPhase;
  }

  public getJumpProgress(): number {
    return this.jumpProgress;
  }

  public getSlideProgress(): number {
    return this.isSliding ? 1.0 - Math.max(0, this.slideTimer / CONSTANTS.SLIDE_DURATION) : 0;
  }
}
