import * as THREE from 'three';
import { CameraController } from './CameraController';
import { WorldScene } from './WorldScene';
import { Player } from '../player/Player';
import { PresentationPose } from '../player/CharacterModel';
import { CONSTANTS } from '../core/Constants';
import { getCharacterById } from '../characters/CharacterCatalog';
import { EventBus, EVENTS } from '../core/EventBus';

export type PhotoPresetId = 
  | 'RUNNER_PORTRAIT'
  | 'ACTION_SHOT'
  | 'TRAIN_ROOFTOP'
  | 'ENVIRONMENTAL_VISTA'
  | 'CLASSIC_GAMEPLAY';

export type LookAtTargetMode = 'HEAD' | 'TORSO' | 'FEET' | 'HORIZON';

export type ColorGradeFilter = 
  | 'NATURAL'
  | 'VIBRANT'
  | 'CYBERPUNK'
  | 'WARM_GOLDEN'
  | 'NOIR'
  | 'VINTAGE';

export interface PhotoPresetDefinition {
  id: PhotoPresetId;
  name: string;
  description: string;
  azimuth: number; // radians
  pitch: number;   // radians
  distance: number;// meters
  elevationOffset: number; // meters
  lookAtMode: LookAtTargetMode;
  fov: number;     // degrees
  exposure: number;// EV
  colorGrade: ColorGradeFilter;
  vignette: number;// 0.0 - 1.0
  characterPose: PresentationPose;
}

export interface PhotoModeSettings {
  preset: PhotoPresetId;
  azimuth: number;
  pitch: number;
  distance: number;
  elevationOffset: number;
  lookAtMode: LookAtTargetMode;
  fov: number;
  exposure: number;
  colorGrade: ColorGradeFilter;
  vignette: number;
  showWatermark: boolean;
  showGrid: boolean;
  characterPose: PresentationPose;
}

export interface ScreenshotExportResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  filename: string;
  themeName: string;
  characterName: string;
}

export class PhotoModeController {
  private static instance: PhotoModeController;

  private cameraController!: CameraController;
  private worldScene!: WorldScene;

  private isActive: boolean = false;
  private originalExposure: number = 1.15;
  private originalFov: number = CONSTANTS.CAMERA_FOV;
  private originalCanvasFilter: string = '';

  // Preset dictionary
  public readonly presets: Record<PhotoPresetId, PhotoPresetDefinition> = {
    RUNNER_PORTRAIT: {
      id: 'RUNNER_PORTRAIT',
      name: 'Runner Portrait',
      description: 'Front 3/4 telephoto view focused on character face, hair, and upper outfit',
      azimuth: 2.72,       // ~156 deg (front 3/4)
      pitch: 0.06,         // Level eye height
      distance: 2.2,       // Intimate close-up
      elevationOffset: 0.0,
      lookAtMode: 'HEAD',
      fov: 42,             // Portrait lens (compressed perspective)
      exposure: 0.05,
      colorGrade: 'NATURAL',
      vignette: 0.25,
      characterPose: 'IDLE'
    },
    ACTION_SHOT: {
      id: 'ACTION_SHOT',
      name: 'Action Hero',
      description: 'Dynamic low-angle 3/4 perspective showing runner, tracks, and nearby trains',
      azimuth: -0.96,      // ~ -55 deg
      pitch: -0.12,        // Dramatic low upward angle
      distance: 3.8,
      elevationOffset: -0.15,
      lookAtMode: 'TORSO',
      fov: 64,
      exposure: 0.10,
      colorGrade: 'VIBRANT',
      vignette: 0.30,
      characterPose: 'RUN'
    },
    TRAIN_ROOFTOP: {
      id: 'TRAIN_ROOFTOP',
      name: 'Train Rooftop',
      description: 'High-angle composition highlighting roof elevation and subway skyline',
      azimuth: 0.65,       // ~37 deg
      pitch: 0.44,         // Looking down at roof and track
      distance: 6.8,
      elevationOffset: 1.1,
      lookAtMode: 'TORSO',
      fov: 68,
      exposure: 0.0,
      colorGrade: 'NATURAL',
      vignette: 0.20,
      characterPose: 'HOVERBOARD'
    },
    ENVIRONMENTAL_VISTA: {
      id: 'ENVIRONMENTAL_VISTA',
      name: 'City Vista',
      description: 'Wide framing showcasing active district skyline, atmosphere, and sun',
      azimuth: 1.57,       // 90 deg (side profile across track corridor)
      pitch: 0.20,
      distance: 11.5,
      elevationOffset: 1.6,
      lookAtMode: 'HORIZON',
      fov: 76,             // Wide-angle vista
      exposure: 0.0,
      colorGrade: 'WARM_GOLDEN',
      vignette: 0.15,
      characterPose: 'DEFAULT'
    },
    CLASSIC_GAMEPLAY: {
      id: 'CLASSIC_GAMEPLAY',
      name: 'Classic Chase',
      description: 'Authentic rear chase camera view with standard gameplay framing',
      azimuth: 0.0,        // Directly behind
      pitch: 0.28,
      distance: 5.6,
      elevationOffset: 0.0,
      lookAtMode: 'HORIZON',
      fov: 60,
      exposure: 0.0,
      colorGrade: 'NATURAL',
      vignette: 0.0,
      characterPose: 'DEFAULT'
    }
  };

  // Current active settings
  private settings: PhotoModeSettings = {
    preset: 'RUNNER_PORTRAIT',
    azimuth: 2.72,
    pitch: 0.06,
    distance: 2.2,
    elevationOffset: 0.0,
    lookAtMode: 'HEAD',
    fov: 42,
    exposure: 0.05,
    colorGrade: 'NATURAL',
    vignette: 0.25,
    showWatermark: true,
    showGrid: false,
    characterPose: 'IDLE'
  };

  // Reusable vectors for frame-rate allocation safety
  private currentCamPos = new THREE.Vector3();
  private currentLookTarget = new THREE.Vector3();

  public static getInstance(): PhotoModeController {
    if (!PhotoModeController.instance) {
      PhotoModeController.instance = new PhotoModeController();
    }
    return PhotoModeController.instance;
  }

  private constructor() {}

  public init(cameraController: CameraController, worldScene: WorldScene): void {
    this.cameraController = cameraController;
    this.worldScene = worldScene;
  }

  public getIsActive(): boolean {
    return this.isActive;
  }

  public getSettings(): PhotoModeSettings {
    return { ...this.settings };
  }

  /**
   * Enter Photo Mode: freezes time, preserves run state, initializes photo camera framing.
   */
  public enter(player: Player): void {
    if (this.isActive) return;
    if (!this.cameraController || !this.worldScene) {
      console.warn('PhotoModeController: Not initialized with CameraController / WorldScene');
      return;
    }

    this.isActive = true;
    this.originalExposure = this.worldScene.renderer.toneMappingExposure;
    this.originalFov = this.cameraController.camera.fov;
    this.originalCanvasFilter = this.worldScene.renderer.domElement.style.filter || '';

    // Tell CameraController to enter photo mode state
    this.cameraController.enterPhotoMode(player.position);

    // Auto-select smart initial preset based on player context:
    // If player is on train roof, choose Train Rooftop preset; otherwise Runner Portrait
    const isOnRoof = (player as any).supportSurface === 'TRAIN_ROOF' || player.groundY >= 3.5;
    if (isOnRoof) {
      this.applyPreset('TRAIN_ROOFTOP', player);
    } else {
      this.applyPreset('RUNNER_PORTRAIT', player);
    }

    this.update(player);
  }

  /**
   * Exit Photo Mode: smoothly restores camera, exposure, filters, and character poses.
   */
  public exit(player?: Player): void {
    if (!this.isActive) return;
    this.isActive = false;

    // Restore exposure and CSS filters
    if (this.worldScene && this.worldScene.renderer) {
      this.worldScene.renderer.toneMappingExposure = this.originalExposure;
      this.worldScene.renderer.domElement.style.filter = this.originalCanvasFilter;
    }

    // Restore character presentation pose
    if (player && player.model) {
      player.model.clearPresentationPose();
    }

    // Restore camera
    if (this.cameraController) {
      this.cameraController.exitPhotoMode();
    }
  }

  /**
   * Apply one of the 5 curated cinematic presets.
   */
  public applyPreset(presetId: PhotoPresetId, player?: Player): void {
    const p = this.presets[presetId];
    if (!p) return;

    this.settings.preset = presetId;
    this.settings.azimuth = p.azimuth;
    this.settings.pitch = p.pitch;
    this.settings.distance = p.distance;
    this.settings.elevationOffset = p.elevationOffset;
    this.settings.lookAtMode = p.lookAtMode;
    this.settings.fov = p.fov;
    this.settings.exposure = p.exposure;
    this.settings.colorGrade = p.colorGrade;
    this.settings.vignette = p.vignette;
    this.settings.characterPose = p.characterPose;

    if (player && player.model) {
      player.model.setPresentationPose(p.characterPose);
    }

    if (player) {
      this.update(player);
    }
  }

  /**
   * Safe clamped parameter updates with immediate feedback.
   */
  public setSetting<K extends keyof PhotoModeSettings>(key: K, value: PhotoModeSettings[K], player?: Player): void {
    (this.settings as any)[key] = value;

    // Enforce safe numerical bounds
    this.settings.distance = THREE.MathUtils.clamp(this.settings.distance, 1.2, 20.0);
    this.settings.pitch = THREE.MathUtils.clamp(this.settings.pitch, -0.45, 1.35); // -25° to +77°
    this.settings.elevationOffset = THREE.MathUtils.clamp(this.settings.elevationOffset, -0.8, 2.5);
    this.settings.fov = THREE.MathUtils.clamp(this.settings.fov, 25.0, 85.0);
    this.settings.exposure = THREE.MathUtils.clamp(this.settings.exposure, -1.0, 1.0);
    this.settings.vignette = THREE.MathUtils.clamp(this.settings.vignette, 0.0, 1.0);

    // Keep azimuth in [-PI, PI] range
    while (this.settings.azimuth > Math.PI) this.settings.azimuth -= Math.PI * 2;
    while (this.settings.azimuth < -Math.PI) this.settings.azimuth += Math.PI * 2;

    if (key === 'characterPose' && player && player.model) {
      player.model.setPresentationPose(value as PresentationPose);
    }

    if (player) {
      this.update(player);
    }
  }

  /**
   * Controlled horizontal & vertical orbital rotation.
   */
  public orbit(deltaAzimuth: number, deltaPitch: number, player?: Player): void {
    this.settings.azimuth += deltaAzimuth;
    this.settings.pitch += deltaPitch;
    this.setSetting('azimuth', this.settings.azimuth, player);
    this.setSetting('pitch', this.settings.pitch, player);
  }

  /**
   * Controlled zoom (radial distance).
   */
  public zoom(deltaDistance: number, player?: Player): void {
    this.setSetting('distance', this.settings.distance + deltaDistance, player);
  }

  /**
   * Controlled camera elevation adjustment.
   */
  public elevate(deltaElevation: number, player?: Player): void {
    this.setSetting('elevationOffset', this.settings.elevationOffset + deltaElevation, player);
  }

  /**
   * Reset camera framing to default gameplay view.
   */
  public resetToGameplay(player?: Player): void {
    this.applyPreset('CLASSIC_GAMEPLAY', player);
  }

  /**
   * Frame update: positions camera using spherical coordinates relative to selected target.
   */
  public update(player: Player): void {
    if (!this.isActive || !this.cameraController || !this.worldScene) return;

    const pPos = player.position;
    const gY = player.groundY;

    // 1. Resolve Look-At Target Position
    let targetBaseY = pPos.y + 0.85;
    let targetZOffset = 0;

    switch (this.settings.lookAtMode) {
      case 'HEAD':
        targetBaseY = pPos.y + 1.28;
        break;
      case 'TORSO':
        targetBaseY = pPos.y + 0.85;
        break;
      case 'FEET':
        targetBaseY = Math.max(gY, pPos.y) + 0.18;
        break;
      case 'HORIZON':
        targetBaseY = pPos.y + 1.10;
        targetZOffset = -3.5; // Look ahead along track into the distance
        break;
    }

    this.currentLookTarget.set(
      pPos.x,
      targetBaseY + this.settings.elevationOffset,
      pPos.z + targetZOffset
    );

    // 2. Compute Camera Position via Spherical Orbit Coordinates
    // Theta = 0: Camera at +Z (behind player, looking forward along -Z)
    // Theta = PI: Camera at -Z (in front of player, looking back at face)
    const theta = this.settings.azimuth;
    const phi = this.settings.pitch;
    const r = this.settings.distance;

    const horizontalRadius = r * Math.cos(phi);
    const camX = this.currentLookTarget.x + horizontalRadius * Math.sin(theta);
    const camY = this.currentLookTarget.y + r * Math.sin(phi);
    const camZ = this.currentLookTarget.z + horizontalRadius * Math.cos(theta);

    // Ground clipping avoidance: camera Y must stay comfortably above track or rooftop ground
    const minAllowedY = Math.max(0.18, gY + 0.18);
    const safeCamY = Math.max(camY, minAllowedY);

    this.currentCamPos.set(camX, safeCamY, camZ);

    // 3. Apply Camera Transform & Field of View
    this.cameraController.setPhotoCameraTransform(
      this.currentCamPos,
      this.currentLookTarget,
      this.settings.fov
    );

    // 4. Apply Exposure Bias
    const targetExposure = this.originalExposure * Math.pow(2, this.settings.exposure);
    this.worldScene.renderer.toneMappingExposure = targetExposure;

    // 5. Apply Real-time Viewport Color Grade Filter via Canvas CSS
    const cssFilter = this.getColorGradeCss(this.settings.colorGrade);
    this.worldScene.renderer.domElement.style.filter = cssFilter;
  }

  /**
   * Map color grade setting to CSS / 2D Canvas filter string.
   */
  public getColorGradeCss(filter: ColorGradeFilter): string {
    switch (filter) {
      case 'VIBRANT':
        return 'saturate(1.42) contrast(1.12)';
      case 'CYBERPUNK':
        return 'hue-rotate(185deg) saturate(1.45) contrast(1.22)';
      case 'WARM_GOLDEN':
        return 'sepia(0.38) saturate(1.32) contrast(1.08) brightness(1.02)';
      case 'NOIR':
        return 'grayscale(1.0) contrast(1.38) brightness(0.96)';
      case 'VINTAGE':
        return 'sepia(0.55) contrast(1.16) brightness(1.04) saturate(0.85)';
      case 'NATURAL':
      default:
        return 'none';
    }
  }

  /**
   * Premium Screenshot Capture:
   * 1. Synchronously renders the WebGL scene.
   * 2. Renders to offscreen 2D canvas at 100% native resolution.
   * 3. Applies color grade filter.
   * 4. Renders optional vignette gradient.
   * 5. Renders optional watermark banner with metadata.
   * 6. Produces true PNG Blob and triggers browser download.
   */
  public async captureScreenshot(
    player: Player,
    themeName: string = 'Modern District',
    characterName: string = 'Jax'
  ): Promise<ScreenshotExportResult> {
    if (!this.worldScene || !this.cameraController) {
      throw new Error('PhotoModeController: Cannot capture screenshot without active scene');
    }

    // 1. Force authoritative synchronous WebGL frame render with current photo camera
    this.update(player);
    this.worldScene.renderer.render(this.worldScene.scene, this.cameraController.camera);

    const webglCanvas = this.worldScene.renderer.domElement;
    const width = webglCanvas.width || window.innerWidth;
    const height = webglCanvas.height || window.innerHeight;

    // 2. Create offscreen export canvas
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width;
    exportCanvas.height = height;
    const ctx = exportCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('PhotoModeController: Failed to get 2D canvas context for screenshot export');
    }

    // 3. Draw WebGL frame with color filter
    const filterString = this.getColorGradeCss(this.settings.colorGrade);
    if (filterString !== 'none') {
      ctx.filter = filterString;
    }
    ctx.drawImage(webglCanvas, 0, 0, width, height);
    ctx.filter = 'none'; // Reset filter

    // 4. Render Optional Vignette Overlay directly on canvas
    if (this.settings.vignette > 0.05) {
      const vignetteStrength = this.settings.vignette * 0.88;
      const radiusInner = Math.min(width, height) * 0.32;
      const radiusOuter = Math.max(width, height) * 0.76;
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, radiusInner,
        width / 2, height / 2, radiusOuter
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.7, `rgba(0, 0, 0, ${vignetteStrength * 0.45})`);
      gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteStrength})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // 5. Render Optional Premium Watermark Badge
    if (this.settings.showWatermark) {
      this.drawWatermark(ctx, width, height, themeName, characterName, player);
    }

    // 6. Generate UTC timestamped filename
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}_${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
    const filename = `MetroRunner3D_Photo_${timestamp}.png`;

    // 7. Export PNG Blob & Data URL
    return new Promise<ScreenshotExportResult>((resolve, reject) => {
      exportCanvas.toBlob((blob) => {
        if (!blob) {
          // Fallback to Data URL if toBlob fails
          try {
            const dataUrl = exportCanvas.toDataURL('image/png');
            this.triggerDownload(dataUrl, filename);
            resolve({
              blob: new Blob([], { type: 'image/png' }),
              dataUrl,
              width,
              height,
              filename,
              themeName,
              characterName
            });
          } catch (err) {
            reject(err);
          }
          return;
        }

        const dataUrl = URL.createObjectURL(blob);
        this.triggerDownload(dataUrl, filename);

        resolve({
          blob,
          dataUrl,
          width,
          height,
          filename,
          themeName,
          characterName
        });
      }, 'image/png');
    });
  }

  /**
   * Draw high-fidelity watermark in bottom corner.
   */
  private drawWatermark(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    themeName: string,
    characterName: string,
    player: Player
  ): void {
    const scale = Math.max(0.65, Math.min(1.4, width / 1280));
    const padX = 28 * scale;
    const padY = 28 * scale;

    const boxW = 340 * scale;
    const boxH = 76 * scale;
    const boxX = padX;
    const boxY = height - padY - boxH;

    // Glassmorphic pill backing
    ctx.save();
    ctx.beginPath();
    const radius = 12 * scale;
    ctx.roundRect(boxX, boxY, boxW, boxH, radius);
    ctx.fillStyle = 'rgba(10, 15, 26, 0.78)';
    ctx.fill();
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
    ctx.stroke();

    // Game Title Accent line
    ctx.beginPath();
    ctx.roundRect(boxX + 10 * scale, boxY + 12 * scale, 4 * scale, boxH - 24 * scale, 2 * scale);
    ctx.fillStyle = '#00e5ff';
    ctx.fill();

    // Game Title Text
    ctx.font = `900 ${18 * scale}px "Outfit", "Segoe UI", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('METRO RUNNER 3D', boxX + 22 * scale, boxY + 28 * scale);

    // Subtitle / Location & Character
    const isOnRoof = (player as any).supportSurface === 'TRAIN_ROOF' || player.groundY >= 3.5;
    const locTag = isOnRoof ? `${themeName} • Rooftops` : themeName;
    const subText = `${characterName}  |  ${locTag}`;

    ctx.font = `600 ${12 * scale}px "Outfit", "Segoe UI", sans-serif`;
    ctx.fillStyle = '#ffbe0b';
    ctx.fillText(subText, boxX + 22 * scale, boxY + 48 * scale);

    // Timestamp & Camera Badge
    const nowStr = new Date().toISOString().substring(0, 10);
    ctx.font = `500 ${10 * scale}px "Segoe UI", monospace`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillText(`${nowStr} UTC • PHOTO STUDIO`, boxX + 22 * scale, boxY + 64 * scale);

    ctx.restore();
  }

  /**
   * Trigger safe browser download via anchor element.
   */
  private triggerDownload(url: string, filename: string): void {
    if (typeof document === 'undefined') return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 150);
  }
}
