import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private targetPosition = new THREE.Vector3();
  private currentPosition = new THREE.Vector3();
  private lookTarget = new THREE.Vector3();
  private shakeTrauma = 0;
  private shakeOffset = new THREE.Vector3();

  // Lobby mode staging
  private isLobbyMode: boolean = true;
  private lobbyTargetPos = new THREE.Vector3(0.35, 1.45, 3.8);
  private lobbyLookTarget = new THREE.Vector3(0, 0.95, -1.0);

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      CONSTANTS.CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      0.5,
      600
    );

    // Initial lobby position
    this.currentPosition.copy(this.lobbyTargetPos);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.lobbyLookTarget);

    window.addEventListener('resize', this.onResize.bind(this));

    const bus = EventBus.getInstance();
    bus.on(EVENTS.LAND, () => this.addShake(0.12));
    bus.on(EVENTS.STUMBLE, () => this.addShake(0.35));
    bus.on(EVENTS.CRASH, () => this.addShake(0.85));
    bus.on(EVENTS.HOVERBOARD_BROKEN, () => this.addShake(0.5));
  }

  public setLobbyMode(enabled: boolean): void {
    this.isLobbyMode = enabled;
  }

  public addShake(trauma: number): void {
    this.shakeTrauma = Math.min(1.0, this.shakeTrauma + trauma);
  }

  public update(playerPos: THREE.Vector3, dt: number, timeSec: number = 0, speed: number = CONSTANTS.INITIAL_SPEED): void {
    if (this.isLobbyMode) {
      if (Math.abs(this.camera.fov - CONSTANTS.CAMERA_FOV) > 0.1) {
        this.camera.fov = CONSTANTS.CAMERA_FOV;
        this.camera.updateProjectionMatrix();
      }

      // Cinematic front-quarter framing in the subway lobby
      const isPortrait = this.camera.aspect < 1.0;
      const sway = Math.sin(timeSec * 0.45) * 0.12;
      const bob = Math.cos(timeSec * 0.35) * 0.04;

      if (isPortrait) {
        // Step back further and higher to comfortably frame full runner in mobile portrait
        this.lobbyTargetPos.set(0.25 + sway, 1.85 + bob, 5.6);
        this.lobbyLookTarget.set(0, 1.15, -0.6);
      } else {
        this.lobbyTargetPos.set(0.35 + sway, 1.45 + bob, 3.8);
        this.lobbyLookTarget.set(0, 0.95, -1.0);
      }

      const lerpFactor = 1.0 - Math.exp(-5.0 * dt);
      this.currentPosition.lerp(this.lobbyTargetPos, lerpFactor);
      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.lobbyLookTarget);
      return;
    }

    // Dynamic FOV widening: subtly expands from 65° to 70.5° at high speed to widen peripheral vision
    const speedRatio = Math.max(0, Math.min(1.0, (speed - CONSTANTS.INITIAL_SPEED) / (CONSTANTS.MAX_SPEED - CONSTANTS.INITIAL_SPEED)));
    const targetFov = CONSTANTS.CAMERA_FOV + speedRatio * 5.5;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * (1.0 - Math.exp(-3.0 * dt));
      this.camera.updateProjectionMatrix();
    }

    // Target position behind and above player in gameplay
    this.targetPosition.x = playerPos.x;
    this.targetPosition.y = Math.max(CONSTANTS.PLAYER_BASE_Y, playerPos.y) + CONSTANTS.CAMERA_OFFSET_Y;
    this.targetPosition.z = playerPos.z + CONSTANTS.CAMERA_OFFSET_Z;

    // Frame-rate independent exponential decay interpolation
    const lerpX = 1.0 - Math.exp(-CONSTANTS.CAMERA_LERP_X * dt);
    const lerpY = 1.0 - Math.exp(-CONSTANTS.CAMERA_LERP_Y * dt);

    this.currentPosition.x += (this.targetPosition.x - this.currentPosition.x) * lerpX;
    this.currentPosition.y += (this.targetPosition.y - this.currentPosition.y) * lerpY;
    this.currentPosition.z = this.targetPosition.z; // Exact forward distance lock

    // Process camera shake with noise
    if (this.shakeTrauma > 0.001) {
      const shakeAmt = this.shakeTrauma * this.shakeTrauma; // Non-linear feel
      this.shakeOffset.set(
        (Math.random() * 2 - 1) * shakeAmt * 0.45,
        (Math.random() * 2 - 1) * shakeAmt * 0.35,
        (Math.random() * 2 - 1) * shakeAmt * 0.25
      );
      this.shakeTrauma = Math.max(0, this.shakeTrauma - CONSTANTS.CAMERA_SHAKE_DECAY * dt);
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    this.camera.position.copy(this.currentPosition).add(this.shakeOffset);

    // Look at point slightly ahead and above the character
    this.lookTarget.x = this.currentPosition.x * 0.5 + playerPos.x * 0.5;
    this.lookTarget.y = playerPos.y + CONSTANTS.CAMERA_LOOK_Y;
    this.lookTarget.z = playerPos.z + CONSTANTS.CAMERA_LOOK_AHEAD_Z;

    this.camera.lookAt(this.lookTarget);
  }

  public reset(playerPos: THREE.Vector3): void {
    this.shakeTrauma = 0;
    this.camera.fov = CONSTANTS.CAMERA_FOV;
    this.camera.updateProjectionMatrix();
    if (this.isLobbyMode) {
      this.currentPosition.copy(this.lobbyTargetPos);
      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.lobbyLookTarget);
    } else {
      this.currentPosition.set(
        playerPos.x,
        playerPos.y + CONSTANTS.CAMERA_OFFSET_Y,
        playerPos.z + CONSTANTS.CAMERA_OFFSET_Z
      );
      this.camera.position.copy(this.currentPosition);
    }
  }

  public onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}
