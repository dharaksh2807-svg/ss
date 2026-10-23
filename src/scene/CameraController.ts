import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private targetPosition = new THREE.Vector3();
  private currentPosition = new THREE.Vector3();
  public lookTarget = new THREE.Vector3();
  private shakeTrauma = 0;
  private shakeOffset = new THREE.Vector3();
  private landingDipOffset = 0;

  // Lobby mode staging
  private isLobbyMode: boolean = true;
  private lobbyTargetPos = new THREE.Vector3(0.35, 1.45, 3.8);
  private lobbyLookTarget = new THREE.Vector3(0, 0.95, -1.0);

  constructor() {
    const aspect = typeof window !== 'undefined' && window.innerHeight > 0
      ? window.innerWidth / window.innerHeight
      : 16 / 9;

    // Near plane lowered from 0.5 to 0.2 to prevent near-clipping on adjacent train carriages
    this.camera = new THREE.PerspectiveCamera(
      CONSTANTS.CAMERA_FOV,
      aspect,
      0.2,
      600
    );

    // Initial lobby position
    this.currentPosition.copy(this.lobbyTargetPos);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.lobbyLookTarget);

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResize.bind(this));
    }

    const bus = EventBus.getInstance();
    bus.on(EVENTS.LAND, (data?: { isFastDrop?: boolean }) => {
      const isFastDrop = data?.isFastDrop === true;
      this.landingDipOffset = isFastDrop ? -0.09 : -0.045;
      this.addShake(isFastDrop ? 0.14 : 0.06);
    });
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

  public update(
    playerPos: THREE.Vector3,
    dt: number,
    timeSec: number = 0,
    speed: number = CONSTANTS.INITIAL_SPEED,
    groundY: number = CONSTANTS.PLAYER_BASE_Y,
    isSliding: boolean = false
  ): void {
    const isPortrait = this.camera.aspect < 1.0;

    if (this.isLobbyMode) {
      const lobbyBaseFov = isPortrait ? 66.0 : CONSTANTS.CAMERA_FOV;
      if (Math.abs(this.camera.fov - lobbyBaseFov) > 0.1) {
        this.camera.fov = lobbyBaseFov;
        this.camera.updateProjectionMatrix();
      }

      // Cinematic front-quarter framing in the subway lobby
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

    // Dynamic FOV widening:
    // Base FOV: 60° landscape, 68° portrait to frame all 3 track lanes cleanly.
    // Expands smoothly by +4.5° at high speed to enhance sense of velocity without stretching trains.
    const baseFov = isPortrait ? 68.0 : CONSTANTS.CAMERA_FOV;
    const speedRatio = Math.max(0, Math.min(1.0, (speed - CONSTANTS.INITIAL_SPEED) / (CONSTANTS.MAX_SPEED - CONSTANTS.INITIAL_SPEED)));
    const targetFov = baseFov + speedRatio * 4.5;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * (1.0 - Math.exp(-3.5 * dt));
      this.camera.updateProjectionMatrix();
    }

    // Coordinated vertical tracking:
    // 1. Jetpack flight: elevates smoothly to cruise altitude, expands lookahead for aerial coins.
    // 2. Ground & train-roof running: tracks support surface authoritatively while dampening
    //    airborne jump bobbing (30% apex follow) so track horizon remains clear and stable.
    const airborneDelta = Math.max(0, playerPos.y - groundY);
    // Jetpack flight occurs at high altitude (>=7.0m) or high vertical clearance above ground (>3.6m)
    // Train rooftop running (groundY = 4.35m, playerPos.y = 4.35m) is ground locomotion, not jetpack flight
    const isJetpackFlight = playerPos.y >= 7.0 || (playerPos.y - groundY > 3.6);

    let targetCamY: number;
    let targetCamOffsetZ = CONSTANTS.CAMERA_OFFSET_Z;
    let targetLookAheadZ = CONSTANTS.CAMERA_LOOK_AHEAD_Z;
    let targetLookY: number;

    if (isJetpackFlight) {
      targetCamY = playerPos.y + 2.4;
      targetCamOffsetZ = CONSTANTS.CAMERA_OFFSET_Z + 1.8; // Step back slightly for wide sky vista
      targetLookY = playerPos.y + 0.6;
      targetLookAheadZ = CONSTANTS.CAMERA_LOOK_AHEAD_Z - 6.0; // Look 24m ahead along flight path
    } else {
      const cameraBaseY = Math.max(CONSTANTS.PLAYER_BASE_Y, groundY) + airborneDelta * 0.30;
      targetCamY = cameraBaseY + CONSTANTS.CAMERA_OFFSET_Y;
      targetLookY = cameraBaseY + CONSTANTS.CAMERA_LOOK_Y;

      // Subtle dynamic camera dip during slide for enhanced tactile action feedback
      if (isSliding) {
        targetCamY -= 0.18;
        targetLookY -= 0.10;
      }

      // Restrained landing vertical impact compression dip
      if (Math.abs(this.landingDipOffset) > 0.001) {
        targetCamY += this.landingDipOffset;
        targetLookY += this.landingDipOffset * 0.45;
        this.landingDipOffset += (0 - this.landingDipOffset) * (1.0 - Math.exp(-18.0 * dt));
      } else {
        this.landingDipOffset = 0;
      }
    }

    // Target position behind and above player in gameplay
    this.targetPosition.x = playerPos.x;
    this.targetPosition.y = targetCamY;
    this.targetPosition.z = playerPos.z + targetCamOffsetZ;

    // Frame-rate independent exponential decay interpolation
    const lerpX = 1.0 - Math.exp(-CONSTANTS.CAMERA_LERP_X * dt);
    const lerpY = 1.0 - Math.exp(-(isJetpackFlight ? 6.5 : CONSTANTS.CAMERA_LERP_Y) * dt);

    this.currentPosition.x += (this.targetPosition.x - this.currentPosition.x) * lerpX;
    this.currentPosition.y += (this.targetPosition.y - this.currentPosition.y) * lerpY;
    this.currentPosition.z = this.targetPosition.z; // Exact forward distance lock

    // Process camera shake with non-linear decay
    if (this.shakeTrauma > 0.001) {
      const shakeAmt = this.shakeTrauma * this.shakeTrauma;
      this.shakeOffset.set(
        (Math.random() * 2 - 1) * shakeAmt * 0.40,
        (Math.random() * 2 - 1) * shakeAmt * 0.30,
        (Math.random() * 2 - 1) * shakeAmt * 0.22
      );
      this.shakeTrauma = Math.max(0, this.shakeTrauma - CONSTANTS.CAMERA_SHAKE_DECAY * dt);
    } else {
      this.shakeOffset.set(0, 0, 0);
    }

    this.camera.position.copy(this.currentPosition).add(this.shakeOffset);

    // Look at point slightly ahead and above the character, with centered lateral tracking
    this.lookTarget.x = this.currentPosition.x * 0.5 + playerPos.x * 0.5;
    this.lookTarget.y = targetLookY;
    this.lookTarget.z = playerPos.z + targetLookAheadZ;

    this.camera.lookAt(this.lookTarget);
  }

  public reset(playerPos: THREE.Vector3): void {
    this.shakeTrauma = 0;
    this.landingDipOffset = 0;
    const isPortrait = this.camera.aspect < 1.0;
    this.camera.fov = isPortrait ? 68.0 : CONSTANTS.CAMERA_FOV;
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
    const isPortrait = this.camera.aspect < 1.0;
    this.camera.fov = isPortrait ? 68.0 : CONSTANTS.CAMERA_FOV;
    this.camera.updateProjectionMatrix();
  }
}
