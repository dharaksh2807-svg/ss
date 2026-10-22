import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';
import { CharacterModel } from './CharacterModel';
import { PowerupManager } from './PowerupManager';
import { InputAction } from '../core/InputManager';

export type PlayerState = 'IDLE' | 'RUN' | 'JUMP' | 'SLIDE' | 'CRASH';

export class Player {
  public mesh: THREE.Group;
  public model: CharacterModel;
  public powerups: PowerupManager;

  // Position & Kinematics
  public position: THREE.Vector3 = new THREE.Vector3(0, CONSTANTS.PLAYER_BASE_Y, 0);
  public speed: number = CONSTANTS.INITIAL_SPEED;
  public currentLane: LaneIndex = 0; // -1: Left, 0: Center, 1: Right
  public targetLane: LaneIndex = 0;
  public groundY: number = CONSTANTS.PLAYER_BASE_Y;

  // Lateral lane transition
  private isChangingLane: boolean = false;
  private laneChangeStartX: number = 0;
  private laneChangeTargetX: number = 0;
  private laneChangeTimer: number = 0;
  private laneChangeDuration: number = CONSTANTS.LANE_CHANGE_DURATION;
  private queuedLaneChange: -1 | 1 | null = null;
  private bankingAngle: number = 0;

  // Vertical Jump & Slide
  private verticalVelocity: number = 0;
  public isJumping: boolean = false;
  public isSliding: boolean = false;
  private slideTimer: number = 0;

  // Gameplay State
  public state: PlayerState = 'IDLE';
  public distanceTraveled: number = 0;

  // Hitbox AABB
  public collider: THREE.Box3 = new THREE.Box3();
  private eventBus = EventBus.getInstance();

  constructor() {
    this.mesh = new THREE.Group();
    this.model = new CharacterModel();
    this.mesh.add(this.model.mesh);

    this.powerups = new PowerupManager();
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
    this.state = 'RUN';
    this.powerups.reset();
    this.model.setHoverboardVisible(false);
    this.model.setSuperSneakersActive(false);
    this.updateCollider();
  }

  public handleInput(action: InputAction): void {
    if (this.state === 'CRASH' || this.state === 'IDLE') return;

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
        this.powerups.activate('HOVERBOARD');
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
      this.eventBus.emit(EVENTS.STUMBLE);
      this.bankingAngle = direction * -0.15;
      return;
    }

    this.targetLane = nextLane;
    this.laneChangeStartX = this.position.x;
    this.laneChangeTargetX = CONSTANTS.LANES[nextLane];
    this.laneChangeTimer = 0;
    this.isChangingLane = true;
    this.queuedLaneChange = null;

    // Dynamic duration based on current speed
    const speedRatio = (this.speed - CONSTANTS.INITIAL_SPEED) / (CONSTANTS.MAX_SPEED - CONSTANTS.INITIAL_SPEED);
    this.laneChangeDuration = Math.max(0.12, CONSTANTS.LANE_CHANGE_DURATION * (1.0 - speedRatio * 0.25));

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
    this.state = 'JUMP';

    let jumpVelocity = CONSTANTS.JUMP_INITIAL_VELOCITY;
    if (this.powerups.isSuperSneakersActive()) {
      jumpVelocity *= CONSTANTS.SUPER_JUMP_MULTIPLIER;
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
    this.slideTimer = CONSTANTS.SLIDE_DURATION;
    this.state = 'SLIDE';
    this.eventBus.emit(EVENTS.SLIDE);
  }

  public update(dt: number): void {
    if (this.state === 'IDLE') return;

    // Powerups status
    this.powerups.update(dt);
    this.model.setHoverboardVisible(this.powerups.isHoverboardActive());
    this.model.setSuperSneakersActive(this.powerups.isSuperSneakersActive());

    if (this.state === 'CRASH') {
      this.model.updateAnimation(this.state, this.speed, 0, this.groundY, dt);
      return;
    }

    // 1. Forward Movement
    const forwardStep = this.speed * dt;
    this.position.z -= forwardStep; // Moving forward along negative Z
    this.distanceTraveled += forwardStep;

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

    // 3. Vertical Movement (Jump, Gravity, Ground Check)
    if (this.isJumping) {
      this.position.y += this.verticalVelocity * dt;
      this.verticalVelocity -= CONSTANTS.GRAVITY * dt;

      // Landing check on current ground height (supports ground or train roofs!)
      if (this.position.y <= this.groundY) {
        this.position.y = this.groundY;
        this.verticalVelocity = 0;
        this.isJumping = false;
        if (!this.isSliding) {
          this.state = 'RUN';
        }
        this.eventBus.emit(EVENTS.LAND);
      }
    } else {
      // Keep grounded or handle falling off train roofs
      if (this.position.y > this.groundY + 0.1) {
        // Fall down
        this.isJumping = true;
        this.verticalVelocity = -4.0;
      } else {
        this.position.y = this.groundY;
      }
    }

    // 4. Slide Timer
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        if (!this.isJumping) {
          this.state = 'RUN';
        }
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

  public crash(): boolean {
    // If hoverboard is active, shield saves player!
    if (this.powerups.breakHoverboard()) {
      return false; // Not a fatal crash
    }

    this.state = 'CRASH';
    this.eventBus.emit(EVENTS.CRASH);
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
}
