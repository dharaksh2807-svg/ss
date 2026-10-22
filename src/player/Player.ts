import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';
import { CharacterModel } from './CharacterModel';
import { PowerupManager } from './PowerupManager';
import { InputAction } from '../core/InputManager';
import { ProgressionManager } from '../progression/ProgressionManager';
import { CharacterId } from '../characters/CharacterCatalog';
import { HoverboardManager } from '../hoverboard/HoverboardManager';

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

export class Player {
  public mesh: THREE.Group;
  public model: CharacterModel;
  public powerups: PowerupManager;
  public hoverboardManager: HoverboardManager;

  // Position & Kinematics
  public position: THREE.Vector3 = new THREE.Vector3(0, CONSTANTS.PLAYER_BASE_Y, 0);
  public previousPosition: THREE.Vector3 = new THREE.Vector3(0, CONSTANTS.PLAYER_BASE_Y, 0);
  public speed: number = CONSTANTS.INITIAL_SPEED;
  public currentLane: LaneIndex = 0; // -1: Left, 0: Center, 1: Right
  public targetLane: LaneIndex = 0;
  public groundY: number = CONSTANTS.PLAYER_BASE_Y;
  public supportSurface: SupportSurfaceType = 'GROUND';
  public readonly jetpackAltitude: number = 9.0;

  // Lateral lane transition
  private isChangingLane: boolean = false;
  private laneChangeStartX: number = 0;
  private laneChangeTargetX: number = 0;
  private laneChangeTimer: number = 0;
  private laneChangeDuration: number = CONSTANTS.LANE_CHANGE_DURATION;
  private queuedLaneChange: -1 | 1 | null = null;
  private bankingAngle: number = 0;

  // Vertical Jump & Slide
  public verticalVelocity: number = 0;
  public isJumping: boolean = false;
  public isSliding: boolean = false;
  private slideTimer: number = 0;

  // Gameplay State
  public state: PlayerState = 'IDLE';
  public distanceTraveled: number = 0;
  public isStumbling: boolean = false;
  private stumbleTimer: number = 0;
  public lastJumpDist: number = -999;
  public lastSlideDist: number = -999;

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
    this.updateCollider();
  }

  public reset(): void {
    this.currentLane = 0; // Center lane
    this.targetLane = 0;
    this.position.set(0, CONSTANTS.PLAYER_BASE_Y, 0);
    this.mesh.position.copy(this.position);
    this.speed = CONSTANTS.INITIAL_SPEED;
    this.groundY = CONSTANTS.PLAYER_BASE_Y;
    this.verticalVelocity = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.isChangingLane = false;
    this.queuedLaneChange = null;
    this.slideTimer = 0;
    this.bankingAngle = 0;
    this.distanceTraveled = 0;
    this.isStumbling = false;
    this.stumbleTimer = 0;
    this.lastJumpDist = -999;
    this.lastSlideDist = -999;
    this.supportSurface = 'GROUND';
    this.previousPosition.copy(this.position);
    this.state = 'RUN';
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

  public handleInput(action: InputAction): void {
    if (this.state === 'CRASH' || this.state === 'IDLE') return;

    // During jetpack flight, jump and slide are disabled, lateral steering remains active
    if (this.state === 'JETPACK') {
      if (action === 'LEFT') this.changeLane(-1);
      if (action === 'RIGHT') this.changeLane(1);
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

  private jump(): void {
    if (this.isJumping) return;

    // Cancel slide if currently sliding
    if (this.isSliding) {
      this.isSliding = false;
      this.slideTimer = 0;
    }

    this.isJumping = true;
    this.lastJumpDist = this.distanceTraveled;
    this.state = 'JUMP';
    this.supportSurface = 'GROUND';

    let jumpVelocity = CONSTANTS.JUMP_INITIAL_VELOCITY;
    if (this.powerups.isSuperSneakersActive()) {
      jumpVelocity *= this.powerups.getJumpVelocityMultiplier();
    }
    if (this.hoverboardManager.isBoardActive()) {
      jumpVelocity *= this.hoverboardManager.getJumpVelocityMultiplier();
    }
    this.verticalVelocity = jumpVelocity;

    this.eventBus.emit(EVENTS.JUMP);
  }

  private slide(): void {
    if (this.isJumping) {
      // Fast drop / dive-down mechanic when pressing down while airborne!
      this.verticalVelocity = CONSTANTS.FAST_DROP_SPEED;
      this.eventBus.emit(EVENTS.FAST_DROP);
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

    // Speed progression
    if (this.speed < CONSTANTS.MAX_SPEED) {
      this.speed = Math.min(
        CONSTANTS.MAX_SPEED,
        CONSTANTS.INITIAL_SPEED + (this.distanceTraveled / 100.0) * CONSTANTS.SPEED_ACCELERATION
      );
    }

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

    // 3. Vertical Movement & Flight Modes
    if (this.powerups.isJetpackActive()) {
      if (this.state !== 'JETPACK') {
        this.state = 'JETPACK';
        this.isJumping = false;
        this.isSliding = false;
      }

      // Smooth ascent to flight altitude or descent when expiring
      const remaining = this.powerups.getJetpackRemaining();
      if (remaining > 1.2) {
        // High-altitude flight
        this.position.y += (this.jetpackAltitude - this.position.y) * Math.min(1.0, dt * 7.0);
      } else {
        // Graceful landing descent
        this.position.y += (this.groundY - this.position.y) * Math.min(1.0, dt * 5.5);
      }
    } else {
      // If exiting jetpack state
      if (this.state === 'JETPACK') {
        this.state = 'RUN';
        this.position.y = this.groundY;
        this.powerups.grantInvulnerability(1.5);
      }

      // Regular Ground & Airborne Jump Physics
      if (this.isJumping) {
        this.position.y += this.verticalVelocity * dt;
        const effectiveGravity = this.hoverboardManager.isBoardActive()
          ? CONSTANTS.GRAVITY * this.hoverboardManager.getGravityMultiplier()
          : CONSTANTS.GRAVITY;
        this.verticalVelocity -= effectiveGravity * dt;

        // Dynamic transition from ascending jump to descending fall
        if (this.verticalVelocity < -0.1 && this.state === 'JUMP') {
          this.state = 'FALLING';
        }

        // Landing check on current ground height (supports track ground or train roofs!)
        if (this.position.y <= this.groundY) {
          this.position.y = this.groundY;
          this.verticalVelocity = 0;
          this.isJumping = false;
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
          this.eventBus.emit(EVENTS.LAND);
          this.eventBus.emit(EVENTS.JUMP_COMPLETED);
        }
      } else {
        // Keep grounded or handle falling off train roofs
        if (this.position.y > this.groundY + 0.15) {
          // Stepped off train roof or elevated platform safely!
          this.isJumping = true;
          this.state = this.supportSurface === 'TRAIN_ROOF' ? 'FALLING_FROM_TRAIN' : 'FALLING';
          this.supportSurface = 'GROUND';
          this.verticalVelocity = Math.min(this.verticalVelocity, -2.0);
        } else {
          this.position.y = this.groundY;
          if (this.state !== 'SLIDE') {
            if (this.groundY > CONSTANTS.PLAYER_BASE_Y + 1.0) {
              this.supportSurface = 'TRAIN_ROOF';
              this.state = 'ON_TRAIN';
            } else if (this.supportSurface === 'RAMP') {
              this.state = 'CLIMBING';
            } else {
              this.supportSurface = 'GROUND';
              this.state = 'RUN';
            }
          }
        }
      }
    }

    // 4. Slide Timer
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        if (!this.isJumping && this.state !== 'JETPACK') {
          this.state = this.supportSurface === 'TRAIN_ROOF' ? 'ON_TRAIN' : 'RUN';
        }
        this.eventBus.emit(EVENTS.SLIDE_COMPLETED);
      }
    }

    // Update mesh position
    this.mesh.position.copy(this.position);

    // Update model locomotion animation
    this.model.updateAnimation(this.state, this.speed, this.bankingAngle, this.groundY, dt);

    // Update AABB collider
    this.updateCollider();
  }

  public setGroundHeight(targetY: number): void {
    this.groundY = targetY;
  }

  public setSupportSurface(surface: SupportSurfaceType): void {
    this.supportSurface = surface;
  }

  public getSupportSurface(): SupportSurfaceType {
    return this.supportSurface;
  }

  public resolveRoofLanding(roofY: number): void {
    this.position.y = roofY;
    this.groundY = roofY;
    this.verticalVelocity = 0;
    this.isJumping = false;
    this.supportSurface = 'TRAIN_ROOF';
    if (!this.isSliding) {
      this.state = 'ON_TRAIN';
    }
    this.eventBus.emit(EVENTS.LAND);
    this.eventBus.emit(EVENTS.JUMP_COMPLETED);
    this.updateCollider();
  }

  public crash(reason: string = 'OBSTACLE_COLLISION'): boolean {
    // 1. Invulnerability grace window active
    if (this.powerups.isInvulnerable() || this.hoverboardManager.isInvulnerableAfterCrash()) {
      return false; // Ignored during grace period
    }

    // 2. Protective Shield absorbs collision
    if (this.powerups.consumeShield()) {
      return false; // Absorbed by shield!
    }

    // 3. Hoverboard absorbs collision
    if (this.hoverboardManager.breakBoard()) {
      return false; // Absorbed by hoverboard!
    }

    this.state = 'CRASH';
    this.eventBus.emit(EVENTS.CRASH, reason);
    return true; // Fatal crash
  }

  private updateCollider(): void {
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

  public stumble(): void {
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
}
