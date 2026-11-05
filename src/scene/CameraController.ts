import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';
import { SettingsManager } from '../settings/SettingsManager';

export type CameraMode = 'CLASSIC' | 'CHARACTER_FOCUS';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private settingsManager = SettingsManager.getInstance();
  private targetPosition = new THREE.Vector3();
  private currentPosition = new THREE.Vector3();
  public lookTarget = new THREE.Vector3();
  private shakeTrauma = 0;
  private shakeOffset = new THREE.Vector3();
  private landingDipOffset = 0;

  // Camera Preferences: 'CLASSIC' (rear chase) or 'CHARACTER_FOCUS' (expressive 3/4 side profile)
  private cameraMode: CameraMode = 'CLASSIC';
  private currentLateralOffset: number = 0;
  private targetLateralOffset: number = 0;

  // Lobby mode staging
  private isLobbyMode: boolean = true;
  private lobbyTargetPos = new THREE.Vector3(0.35, 1.48, 3.85);
  private lobbyLookTarget = new THREE.Vector3(0, 0.98, -1.0);

  // Opening cinematic sequence camera state
  private isIntroMode: boolean = false;
  private introStartPos = new THREE.Vector3();
  private introStartLook = new THREE.Vector3();

  // Game-over dramatic reaction framing
  private isGameOverMode: boolean = false;
  private gameOverTargetPos = new THREE.Vector3();
  private gameOverLookTarget = new THREE.Vector3();

  // Dedicated Photo Mode camera state
  private isPhotoMode: boolean = false;
  private photoPos = new THREE.Vector3();
  private photoLookTarget = new THREE.Vector3();
  private savedFov: number = CONSTANTS.CAMERA_FOV;

  // Near-Camera Bounded Occlusion Handling
  private occludedObjects: Set<THREE.Object3D> = new Set();
  private static readonly _tempVec = new THREE.Vector3();
  private static readonly _tempBox = new THREE.Box3();
  private static readonly _tempClosestPt = new THREE.Vector3();

  constructor() {
    const aspect = typeof window !== 'undefined' && window.innerHeight > 0
      ? window.innerWidth / window.innerHeight
      : 16 / 9;

    // Near plane set to 0.2 to prevent near-clipping on adjacent trains and overhead structures
    this.camera = new THREE.PerspectiveCamera(
      CONSTANTS.CAMERA_FOV,
      aspect,
      0.2,
      600
    );

    // Load persisted camera preference
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('metro_camera_mode') as CameraMode | null;
      if (saved === 'CLASSIC' || saved === 'CHARACTER_FOCUS') {
        this.cameraMode = saved;
      }
    }

    // Initial lobby position
    this.currentPosition.copy(this.lobbyTargetPos);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.lobbyLookTarget);

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onResize.bind(this));
    }

    const bus = EventBus.getInstance();
    bus.on(EVENTS.LAND, (data?: { isFastDrop?: boolean; surface?: string }) => {
      const isFastDrop = data?.isFastDrop === true;
      const isRoof = data?.surface === 'TRAIN_ROOF';
      if (this.settingsManager.isReducedMotion()) {
        this.landingDipOffset = 0;
      } else {
        const motionScale = this.settingsManager.getCameraMotionMultiplier();
        this.landingDipOffset = (isFastDrop ? -0.09 : -0.045) * motionScale;
      }
      this.addShake(isFastDrop ? (isRoof ? 0.16 : 0.14) : (isRoof ? 0.08 : 0.06));
    });
    bus.on(EVENTS.NEAR_MISS, () => this.addShake(0.08));
    bus.on(EVENTS.STUMBLE, () => this.addShake(0.35));
    bus.on(EVENTS.CRASH, () => this.addShake(0.85));
    bus.on(EVENTS.HOVERBOARD_BROKEN, () => this.addShake(0.5));
    bus.on('CAMERA_MODE_CHANGED', (mode: CameraMode) => {
      this.setCameraMode(mode);
    });
  }

  private getViewportFraming(): { follow: number; extraZ: number } {
    const aspect = Math.max(0.2, this.camera.aspect);
    // Preserve lane-width coverage without widening vertical FOV to a distorted fisheye.
    // 5.2m half-width includes the outer runner silhouette and track edges at runner depth.
    return {
      follow: Math.min(1, Math.max(0, (aspect - 0.5) / 0.5)),
      extraZ: aspect < 1 ? Math.max(0, 5.2 / (Math.tan(THREE.MathUtils.degToRad(34)) * aspect) - 4.85) : 0
    };
  }

  public getCameraMode(): CameraMode {
    return this.cameraMode;
  }

  public setCameraMode(mode: CameraMode): void {
    this.cameraMode = mode;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('metro_camera_mode', mode);
    }
    EventBus.getInstance().emit('CAMERA_MODE_UPDATED', mode);
  }

  public setLobbyMode(enabled: boolean): void {
    this.isLobbyMode = enabled;
  }

  public setIntroMode(enabled: boolean, playerPos?: THREE.Vector3): void {
    this.isIntroMode = enabled;
    if (enabled && playerPos) {
      this.isLobbyMode = false;
      // Close-up front 3/4 cinematic camera framing runner's face and upper outfit prominently
      const isPortrait = this.camera.aspect < 1.0;
      const camX = playerPos.x - (isPortrait ? 0.95 : 1.35);
      this.introStartPos.set(camX, playerPos.y + 1.25, playerPos.z - 2.1);
      this.introStartLook.set(playerPos.x, playerPos.y + 1.18, playerPos.z + 0.1);
      this.currentPosition.copy(this.introStartPos);
      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.introStartLook);
    }
  }

  public getIntroMode(): boolean {
    return this.isIntroMode;
  }

  public setGameOverMode(enabled: boolean, playerPos?: THREE.Vector3): void {
    this.isGameOverMode = enabled;
    if (enabled && playerPos) {
      this.isLobbyMode = false;
      this.isIntroMode = false;
      const isPortrait = this.camera.aspect < 1.0;
      // Front-side 3/4 dramatic cinematic framing player's face, defeat reaction, and scene context
      const camX = playerPos.x - (isPortrait ? 1.15 : 1.55);
      this.gameOverTargetPos.set(camX, playerPos.y + 1.15, playerPos.z - 2.3);
      this.gameOverLookTarget.set(playerPos.x, playerPos.y + 1.05, playerPos.z);
    }
  }

  public getGameOverMode(): boolean {
    return this.isGameOverMode;
  }

  public enterPhotoMode(playerPos: THREE.Vector3): void {
    this.isPhotoMode = true;
    this.savedFov = this.camera.fov;
    this.photoPos.copy(this.camera.position);
    this.photoLookTarget.copy(this.lookTarget);
  }

  public exitPhotoMode(): void {
    this.isPhotoMode = false;
    this.camera.fov = this.savedFov;
    this.camera.updateProjectionMatrix();
  }

  public isPhotoModeActive(): boolean {
    return this.isPhotoMode;
  }

  public setPhotoCameraTransform(pos: THREE.Vector3, lookAt: THREE.Vector3, fov?: number): void {
    if (!this.isPhotoMode) return;
    this.photoPos.copy(pos);
    this.photoLookTarget.copy(lookAt);
    this.camera.position.copy(this.photoPos);
    this.camera.lookAt(this.photoLookTarget);
    if (fov !== undefined && Math.abs(this.camera.fov - fov) > 0.05) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
  }

  public getPhotoCameraTransform(): { position: THREE.Vector3; lookAt: THREE.Vector3; fov: number } {
    return {
      position: this.camera.position.clone(),
      lookAt: this.photoLookTarget.clone(),
      fov: this.camera.fov
    };
  }

  public updateIntro(progress: number, playerPos: THREE.Vector3, dt: number): void {
    const isPortrait = this.camera.aspect < 1.0;
    this.camera.fov = isPortrait ? 68.0 : CONSTANTS.CAMERA_FOV;
    this.camera.updateProjectionMatrix();

    let t = Math.max(0, Math.min(1.0, progress));

    if (t < 0.35) {
      // Phase 1 (0.0s – 0.85s): Expressive front 3/4 character reveal with gentle push-in
      const p = t / 0.35;
      const push = p * 0.30;
      const camX = playerPos.x - (isPortrait ? 0.95 : 1.35);
      const camY = playerPos.y + 1.25;
      const camZ = playerPos.z - 2.1 + push;

      this.currentPosition.set(camX, camY, camZ);
      this.lookTarget.set(playerPos.x, playerPos.y + 1.18, playerPos.z + 0.1);
    } else {
      // Phase 2 & 3 (0.85s – 2.4s): Smooth orbital arc around runner into active gameplay camera
      const u = (t - 0.35) / 0.65;
      const smoothU = u * u * (3.0 - 2.0 * u);

      const isCharFocus = this.cameraMode === 'CHARACTER_FOCUS';
      const endAngle = isCharFocus ? 0.13 : 0; // ~7.5° offset in character focus
      const startAngle = -2.55; // ~ -146°
      const theta = THREE.MathUtils.lerp(startAngle, endAngle, smoothU);

      const startRadius = isPortrait ? 2.5 : 2.8;
      const framing = this.getViewportFraming();
      const endRadius = (isCharFocus ? 5.25 : CONSTANTS.CAMERA_OFFSET_Z) + framing.extraZ;
      const radius = THREE.MathUtils.lerp(startRadius, endRadius, smoothU);

      const startHeight = 1.25;
      const endHeight = isCharFocus ? 3.12 : CONSTANTS.CAMERA_OFFSET_Y;
      const height = THREE.MathUtils.lerp(startHeight, endHeight, smoothU);

      const orbitX = playerPos.x + radius * Math.sin(theta);
      const camX = isPortrait
        ? THREE.MathUtils.lerp(orbitX, (playerPos.x + (isCharFocus ? 0.68 : 0)) * framing.follow, smoothU)
        : orbitX;
      const camZ = playerPos.z + radius * Math.cos(theta);
      const camY = playerPos.y + height;
      this.currentPosition.set(camX, camY, camZ);

      const startLookX = playerPos.x;
      const endLookX = isCharFocus ? playerPos.x - 0.18 : playerPos.x;
      const lookX = THREE.MathUtils.lerp(startLookX, endLookX, smoothU);

      const startLookY = playerPos.y + 1.18;
      const endLookY = playerPos.y + (isCharFocus ? 1.57 : CONSTANTS.CAMERA_LOOK_Y);
      const lookY = THREE.MathUtils.lerp(startLookY, endLookY, smoothU);

      const lookAheadBlend = Math.max(0, Math.min(1.0, (smoothU - 0.40) / 0.60));
      const smoothLookAhead = lookAheadBlend * lookAheadBlend * (3.0 - 2.0 * lookAheadBlend);
      const startLookZ = playerPos.z + 0.1;
      const endLookZ = playerPos.z + CONSTANTS.CAMERA_LOOK_AHEAD_Z;
      const lookZ = THREE.MathUtils.lerp(startLookZ, endLookZ, smoothLookAhead);

      this.lookTarget.set(lookX, lookY, lookZ);
    }

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.lookTarget);
  }

  public finishIntro(playerPos: THREE.Vector3): void {
    this.isIntroMode = false;
    const isCharFocus = this.cameraMode === 'CHARACTER_FOCUS';
    const offsetX = isCharFocus ? 0.68 : 0;
    const framing = this.getViewportFraming();
    const offsetZ = (isCharFocus ? 5.25 : CONSTANTS.CAMERA_OFFSET_Z) + framing.extraZ;
    const offsetY = isCharFocus ? 3.12 : CONSTANTS.CAMERA_OFFSET_Y;
    const lookY = isCharFocus ? 1.57 : CONSTANTS.CAMERA_LOOK_Y;
    const lookX = isCharFocus ? playerPos.x - 0.18 : playerPos.x;

    this.currentPosition.set(
      (playerPos.x + offsetX) * framing.follow,
      playerPos.y + offsetY,
      playerPos.z + offsetZ
    );
    this.camera.position.copy(this.currentPosition);
    this.lookTarget.set(
      lookX,
      playerPos.y + lookY,
      playerPos.z + CONSTANTS.CAMERA_LOOK_AHEAD_Z
    );
    this.camera.lookAt(this.lookTarget);
  }

  public addShake(trauma: number): void {
    const shakeMult = this.settingsManager.getCameraShakeMultiplier();
    if (shakeMult <= 0 || this.settingsManager.isReducedMotion()) {
      this.shakeTrauma = 0;
      this.shakeOffset.set(0, 0, 0);
      return;
    }
    this.shakeTrauma = Math.min(1.0, this.shakeTrauma + trauma * shakeMult);
  }

  public getShakeTrauma(): number {
    return this.shakeTrauma;
  }

  public getShakeOffset(): THREE.Vector3 {
    return this.shakeOffset;
  }

  public update(
    playerPos: THREE.Vector3,
    dt: number,
    timeSec: number = 0,
    speed: number = CONSTANTS.INITIAL_SPEED,
    groundY: number = CONSTANTS.PLAYER_BASE_Y,
    isSliding: boolean = false,
    isTunnelEnclosed: boolean = false
  ): void {
    if (this.isIntroMode || this.isPhotoMode) {
      return;
    }

    if (this.isGameOverMode) {
      const isPortrait = this.camera.aspect < 1.0;
      const targetFov = isPortrait ? 66.0 : 54.0;
      this.camera.fov += (targetFov - this.camera.fov) * (1.0 - Math.exp(-5.0 * dt)); // Snappier FOV on crash
      this.camera.updateProjectionMatrix();

      const lerpFactor = 1.0 - Math.exp(-5.5 * dt); // Snappier dramatic framing on crash
      this.currentPosition.lerp(this.gameOverTargetPos, lerpFactor);
      this.lookTarget.lerp(this.gameOverLookTarget, lerpFactor);
      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.lookTarget);
      return;
    }

    const isPortrait = this.camera.aspect < 1.0;

    if (this.isLobbyMode) {
      const lobbyBaseFov = isPortrait ? 66.0 : CONSTANTS.CAMERA_FOV;
      if (Math.abs(this.camera.fov - lobbyBaseFov) > 0.1) {
        this.camera.fov = lobbyBaseFov;
        this.camera.updateProjectionMatrix();
      }

      // Cinematic front-quarter framing in the subway lobby
      const motionScale = this.settingsManager.getCameraMotionMultiplier();
      const sway = Math.sin(timeSec * 0.45) * 0.12 * motionScale;
      const bob = Math.cos(timeSec * 0.35) * 0.04 * motionScale;

      if (isPortrait) {
        // Step back further and higher to comfortably frame full runner in mobile portrait
        this.lobbyTargetPos.set(0.20 + sway, 1.95 + bob, 5.8);
        this.lobbyLookTarget.set(0, 1.20, -0.6);
      } else {
        this.lobbyTargetPos.set(0.35 + sway, 1.48 + bob, 3.85);
        this.lobbyLookTarget.set(0, 0.98, -1.0);
      }

      this.currentPosition.copy(this.lobbyTargetPos);
      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.lobbyLookTarget);
      return;
    }

    // Dynamic FOV widening:
    // Base FOV: 60° landscape, 68° portrait to frame all 3 track lanes cleanly.
    // Expands smoothly up to +8.5° at high speed (especially in Hard mode up to 52 m/s)
    // to give intense peripheral velocity cues without distorting track center.
    const baseFov = isPortrait ? 68.0 : CONSTANTS.CAMERA_FOV;
    let targetFov = baseFov;
    if (!this.settingsManager.isReducedMotion()) {
      const minSpd = 19.0;
      const maxSpd = 52.0;
      const speedRatio = Math.max(0, Math.min(1.0, (speed - minSpd) / (maxSpd - minSpd)));
      targetFov = baseFov + speedRatio * 8.5;
    }
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * (1.0 - Math.exp(-3.5 * dt));
      this.camera.updateProjectionMatrix();
    }

    // Coordinated vertical tracking:
    // 1. Jetpack flight: elevates smoothly to cruise altitude, expands lookahead for aerial coins.
    // 2. Ground & train-roof running: tracks support surface authoritatively while dampening
    //    airborne jump bobbing (30% apex follow) so track horizon remains clear and stable.
    const airborneDelta = Math.max(0, playerPos.y - groundY);
    const isJetpackFlight = playerPos.y >= 7.0 || (playerPos.y - groundY > 3.6);

    const isCharFocus = this.cameraMode === 'CHARACTER_FOCUS';

    // Character Focus Lateral Composition:
    // Provides an expressive 3/4 side profile view revealing facial profile, hair/cap, and outfit details.
    // Safety fallback: smoothly return to center chase in narrow tunnels, on train roofs, or in jetpack flight.
    const motionScale = this.settingsManager.getCameraMotionMultiplier();
    const effectiveElevation = Math.max(groundY, playerPos.y);
    const isRooftopLevel = groundY >= 3.8 || effectiveElevation >= 4.0;
    const isUnsafeForOffset = isTunnelEnclosed || isRooftopLevel || isJetpackFlight || this.shakeTrauma > 0.35;
    if (isCharFocus && !isUnsafeForOffset) {
      if (playerPos.x > 1.8) {
        // In the right lane: do not push further right into lateral scenery / curb!
        this.targetLateralOffset = 0;
      } else if (playerPos.x < -1.8) {
        // In the left lane: do not push further left into lateral scenery / curb!
        this.targetLateralOffset = 0;
      } else {
        this.targetLateralOffset = (isPortrait ? 0.58 : 0.70) * motionScale;
      }
    } else {
      this.targetLateralOffset = 0;
    }

    // Smooth exponential decay interpolation for lateral offset
    const lateralBlendRate = 6.0;
    this.currentLateralOffset += (this.targetLateralOffset - this.currentLateralOffset) * (1.0 - Math.exp(-lateralBlendRate * dt));

    const distanceOffset = this.settingsManager.getCameraDistanceOffset();
    let targetCamY: number;
    let targetCamOffsetZ = (isCharFocus && !isJetpackFlight ? 5.25 : CONSTANTS.CAMERA_OFFSET_Z) + distanceOffset;
    let targetLookAheadZ = CONSTANTS.CAMERA_LOOK_AHEAD_Z;
    let targetLookY: number;

    if (isJetpackFlight) {
      targetCamY = playerPos.y + 2.4;
      targetCamOffsetZ = CONSTANTS.CAMERA_OFFSET_Z + 1.8 + distanceOffset; // Step back slightly for wide sky vista
      targetLookY = playerPos.y + 0.6;
      targetLookAheadZ = CONSTANTS.CAMERA_LOOK_AHEAD_Z - 8.0; // Look further down track on flight (increased from -6.0)
    } else {
      const cameraBaseY = Math.max(CONSTANTS.PLAYER_BASE_Y, groundY) + airborneDelta * 0.30;
      const baseOffsetY = isCharFocus ? 3.12 : CONSTANTS.CAMERA_OFFSET_Y;
      const baseLookY = isCharFocus ? 1.57 : CONSTANTS.CAMERA_LOOK_Y;

      targetCamY = cameraBaseY + baseOffsetY;
      targetLookY = cameraBaseY + baseLookY;

      // Train rooftop and ramp climbing perspective: smoothly scale elevation as runner ascends
      // Ensures camera stays comfortably above train roof decks (4.35m) and catwalks/pantographs
      if (effectiveElevation > 1.2) {
        const roofBlend = Math.min(1.0, Math.max(0, (effectiveElevation - 1.2) / 2.8));
        targetCamY += 0.55 * roofBlend;
        targetCamOffsetZ += 0.65 * roofBlend;
        targetLookAheadZ -= 3.5 * roofBlend;
        targetLookY += 0.45 * roofBlend;
        // Authoritative minimum height clearance above the support plane
        targetCamY = Math.max(targetCamY, effectiveElevation + (isCharFocus ? 3.12 : CONSTANTS.CAMERA_OFFSET_Y));
      }

      // Subtle dynamic camera dip during slide for enhanced tactile action feedback
      if (isSliding && !this.settingsManager.isReducedMotion()) {
        const slideScale = this.settingsManager.getCameraMotionMultiplier();
        targetCamY -= 0.18 * slideScale;
        targetLookY -= 0.10 * slideScale;
      }

      // Restrained landing vertical impact compression dip
      if (Math.abs(this.landingDipOffset) > 0.001 && !this.settingsManager.isReducedMotion()) {
        targetCamY += this.landingDipOffset;
        targetLookY += this.landingDipOffset * 0.45;
        this.landingDipOffset += (0 - this.landingDipOffset) * (1.0 - Math.exp(-18.0 * dt));
      } else {
        this.landingDipOffset = 0;
      }
    }

    const framing = this.getViewportFraming();
    targetCamOffsetZ += framing.extraZ;
    // Narrow views center the track so both outer lanes stay readable during lane switches.
    let targetX = (playerPos.x + this.currentLateralOffset) * framing.follow;
    // Bounded camera corridor: clamp |X| <= 3.8 to prevent camera penetration into lateral scenery or curbs
    const maxLateral = 3.8 * (framing.follow || 1.0);
    targetX = Math.max(-maxLateral, Math.min(maxLateral, targetX));
    this.targetPosition.x = targetX;
    this.targetPosition.y = targetCamY;
    this.targetPosition.z = playerPos.z + targetCamOffsetZ;

    // Frame-rate independent exponential decay interpolation
    const lerpX = 1.0 - Math.exp(-CONSTANTS.CAMERA_LERP_X * dt);
    const lerpY = 1.0 - Math.exp(-(isJetpackFlight ? 6.5 : CONSTANTS.CAMERA_LERP_Y) * dt);

    this.currentPosition.x += (this.targetPosition.x - this.currentPosition.x) * lerpX;
    this.currentPosition.y += (this.targetPosition.y - this.currentPosition.y) * lerpY;
    this.currentPosition.z = this.targetPosition.z; // Exact forward distance lock

    // Process camera shake with non-linear decay scaled by comfort settings
    const shakeScale = this.settingsManager.getCameraShakeMultiplier();
    if (this.shakeTrauma > 0.001 && shakeScale > 0) {
      const shakeAmt = this.shakeTrauma * this.shakeTrauma * shakeScale;
      this.shakeOffset.set(
        (Math.random() * 2 - 1) * shakeAmt * 0.40,
        (Math.random() * 2 - 1) * shakeAmt * 0.30,
        (Math.random() * 2 - 1) * shakeAmt * 0.22
      );
      this.shakeTrauma = Math.max(0, this.shakeTrauma - CONSTANTS.CAMERA_SHAKE_DECAY * dt);
    } else {
      this.shakeOffset.set(0, 0, 0);
      if (shakeScale <= 0) this.shakeTrauma = 0;
    }

    this.camera.position.copy(this.currentPosition).add(this.shakeOffset);

    // Look at point slightly ahead and above the character, with centered lateral tracking
    // In Character Focus, angle slightly inward across runner to keep center lane & incoming trains locked in center
    const inwardAimOffset = this.currentLateralOffset * 0.28;
    this.lookTarget.x = this.currentPosition.x * 0.45 + (playerPos.x - inwardAimOffset) * framing.follow * 0.55;
    this.lookTarget.y = targetLookY;
    this.lookTarget.z = playerPos.z + targetLookAheadZ;

    this.camera.lookAt(this.lookTarget);
  }

  public reset(playerPos: THREE.Vector3): void {
    for (const obj of this.occludedObjects) {
      obj.visible = true;
    }
    this.occludedObjects.clear();

    this.shakeTrauma = 0;
    this.landingDipOffset = 0;
    this.isGameOverMode = false;
    this.isPhotoMode = false;
    const isPortrait = this.camera.aspect < 1.0;
    this.camera.fov = isPortrait ? 68.0 : CONSTANTS.CAMERA_FOV;
    this.camera.updateProjectionMatrix();
    if (this.isLobbyMode) {
      this.currentPosition.copy(this.lobbyTargetPos);
      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.lobbyLookTarget);
    } else {
      const framing = this.getViewportFraming();
      this.currentPosition.set(
        playerPos.x * framing.follow,
        playerPos.y + CONSTANTS.CAMERA_OFFSET_Y,
        playerPos.z + CONSTANTS.CAMERA_OFFSET_Z + framing.extraZ
      );
      this.camera.position.copy(this.currentPosition);
    }
  }

  /**
   * Bounded near-camera occlusion handling:
   * Selectively hides/fades confirmed near-camera occluders that are located BEHIND
   * the runner (or lateral scenery) while strictly preserving 100% visibility of active
   * hazards ahead of the runner.
   */
  public resolveNearCameraOcclusion(scene: THREE.Scene, playerPos: THREE.Vector3): void {
    // 1. Restore visibility of objects occluded in previous frame
    for (const obj of this.occludedObjects) {
      obj.visible = true;
    }
    this.occludedObjects.clear();

    if (this.isLobbyMode || this.isIntroMode || this.isPhotoMode) return;

    const camPos = this.camera.position;
    const nearDistSq = 2.4 * 2.4;

    // 2. Scan scene for objects that penetrate the near camera volume
    scene.traverse((obj) => {
      if (!obj.visible) return;
      if (obj.name?.includes('player') || obj.name?.includes('char_') || obj === this.camera) return;

      const userData = obj.userData;
      if (userData?.isTrain || userData?.isObstacle || obj.name?.includes('coach') || obj.name?.includes('car_') || obj.name?.includes('chunk_')) {
        obj.getWorldPosition(CameraController._tempVec);

        // Fast Z rejection: check objects within 25.0m of camera along Z (covers long coach bodies)
        if (Math.abs(CameraController._tempVec.z - camPos.z) < 25.0) {
          CameraController._tempBox.setFromObject(obj);
          const isCamInside = CameraController._tempBox.containsPoint(camPos);
          CameraController._tempBox.clampPoint(camPos, CameraController._tempClosestPt);
          const distSq = camPos.distanceToSquared(CameraController._tempClosestPt);

          // Confirmed near-camera penetration:
          if (isCamInside || distSq < nearDistSq) {
            // CRITICAL INVARIANT: NEVER occlude an active oncoming hazard ahead of the runner.
            // An object is safe to hide ONLY if its front is behind or level with the runner (bbox.min.z > playerPos.z - 0.2).
            if (CameraController._tempBox.min.z > playerPos.z - 0.2) {
              obj.visible = false;
              this.occludedObjects.add(obj);
            }
          }
        }
      }
    });
  }

  public onResize(): void {
    if (window.innerWidth <= 0 || window.innerHeight <= 0) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    const isPortrait = this.camera.aspect < 1.0;
    if (!this.isPhotoMode) this.camera.fov = isPortrait ? 68.0 : CONSTANTS.CAMERA_FOV;
    this.camera.updateProjectionMatrix();
  }
}
