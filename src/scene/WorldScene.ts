import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { GraphicsManager, QualityConfig, GraphicsPreset, ResolvedQuality } from './GraphicsManager';
import { EventBus } from '../core/EventBus';

export class WorldScene {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  public sunLight: THREE.DirectionalLight;
  public fillLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public skyMesh: THREE.Mesh;
  public cloudsGroup: THREE.Group;
  public skylineGroup: THREE.Group;
  public playerContactShadow: THREE.Mesh;
  private currentConfig: QualityConfig;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONSTANTS.COLORS.FOG);
    // Soft atmospheric distance haze
    this.scene.fog = new THREE.FogExp2(CONSTANTS.COLORS.FOG, 0.0042);

    const graphics = GraphicsManager.getInstance();
    this.currentConfig = graphics.getActiveConfig();

    // High performance WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(this.currentConfig.pixelRatio);
    this.renderer.shadowMap.enabled = this.currentConfig.shadowMapEnabled;
    this.renderer.shadowMap.type = this.currentConfig.shadowMapType;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    // 1. Balanced Daylight Lighting Setup
    // Bright sky hemisphere fill (sky: cyan blue, ground: urban slate)
    this.hemiLight = new THREE.HemisphereLight(0xb3e5fc, 0x455a64, 1.15);
    this.scene.add(this.hemiLight);

    // Warm golden sunlight from 45 degree angle
    this.sunLight = new THREE.DirectionalLight(0xfffaea, 1.4);
    this.sunLight.position.set(24, 42, 18);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 130.0;
    this.sunLight.shadow.camera.left = -24;
    this.sunLight.shadow.camera.right = 24;
    this.sunLight.shadow.camera.top = 36;
    this.sunLight.shadow.camera.bottom = -12;
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Soft sky-blue opposite fill light for shadowed canyon facades
    this.fillLight = new THREE.DirectionalLight(0x90caf9, 0.55);
    this.fillLight.position.set(-24, 28, 14);
    this.scene.add(this.fillLight);

    // Dark asphalt station ground beneath tracks and lobby camera
    const stationGroundGeo = new THREE.PlaneGeometry(80, 80);
    const stationGroundMat = new THREE.MeshStandardMaterial({
      color: 0x151922,
      roughness: 0.95,
      metalness: 0.1
    });
    const stationGround = new THREE.Mesh(stationGroundGeo, stationGroundMat);
    stationGround.rotation.x = -Math.PI / 2;
    stationGround.position.set(0, -0.28, 0);
    stationGround.receiveShadow = true;
    this.scene.add(stationGround);

    // 2. Vibrant Daytime Sky Dome
    this.skyMesh = this.createSkyDome();
    this.scene.add(this.skyMesh);

    // 3. Floating Stylized Cumulus Clouds
    this.cloudsGroup = this.createClouds();
    this.scene.add(this.cloudsGroup);

    // 4. Distant Parallax City Skyline Silhouettes
    this.skylineGroup = this.createDistantSkyline();
    this.scene.add(this.skylineGroup);

    // 5. Subtle high-speed motion streaks (difficulty feedback)
    this.speedLinesMesh = this.createSpeedLines();
    this.scene.add(this.speedLinesMesh);

    // 6. Ground contact blob shadow for player (active when real-time directional shadows are disabled)
    const shadowGeo = new THREE.PlaneGeometry(1.5, 1.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x05070a,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    this.playerContactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.playerContactShadow.rotation.x = -Math.PI / 2;
    this.playerContactShadow.position.set(0, 0.02, 0);
    this.playerContactShadow.visible = this.currentConfig.contactBlobShadow;
    this.scene.add(this.playerContactShadow);

    EventBus.getInstance().on('GRAPHICS_CONFIG_CHANGED', (config: QualityConfig) => {
      this.applyGraphicsConfig(config);
    });

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private speedLinesMesh: THREE.LineSegments;

  private createSpeedLines(): THREE.LineSegments {
    const lineCount = 45;
    const positions = new Float32Array(lineCount * 6);
    for (let i = 0; i < lineCount; i++) {
      const idx = i * 6;
      const angle = Math.random() * Math.PI * 2;
      const radius = 3.5 + Math.random() * 5.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius + 2.5;
      const z = -Math.random() * 45;
      const len = 3.5 + Math.random() * 6.0;

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      positions[idx + 3] = x;
      positions[idx + 4] = y;
      positions[idx + 5] = z + len;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({
      color: 0xe0f7fa,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    return new THREE.LineSegments(geo, mat);
  }

  private createSkyDome(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(450, 32, 20);
    const colors: number[] = [];
    const topColor = new THREE.Color(CONSTANTS.COLORS.SKY_TOP);
    const bottomColor = new THREE.Color(CONSTANTS.COLORS.SKY_BOTTOM);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      // Normalized vertical height for smooth sky transition
      const t = Math.max(0, Math.min(1, (y + 40) / 400));
      const c = bottomColor.clone().lerp(topColor, Math.pow(t, 0.8));
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      fog: false
    });

    return new THREE.Mesh(geo, mat);
  }

  /**
   * Creates puffy stylized 3D cumulus clouds in the sky
   */
  private createClouds(): THREE.Group {
    const group = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.05
    });

    const puffGeo = new THREE.SphereGeometry(1, 8, 8);

    // Spawn 14 distinct fluffy cloud clusters
    for (let c = 0; c < 14; c++) {
      const cloud = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 4);

      for (let p = 0; p < numPuffs; p++) {
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        const sx = 10 + Math.random() * 14;
        const sy = 6 + Math.random() * 8;
        const sz = 10 + Math.random() * 12;
        puff.scale.set(sx, sy, sz);
        puff.position.set(
          (p - numPuffs * 0.5) * 8.0,
          Math.sin(p) * 2.0,
          (Math.random() - 0.5) * 6.0
        );
        cloud.add(puff);
      }

      // Scatter across upper sky hemisphere
      const angle = (c / 14) * Math.PI * 2;
      const dist = 180 + Math.random() * 120;
      const height = 75 + Math.random() * 45;

      cloud.position.set(
        Math.cos(angle) * dist,
        height,
        Math.sin(angle) * dist
      );

      group.add(cloud);
    }

    return group;
  }

  /**
   * Creates distant hazy skyline silhouette towers along horizon
   */
  private createDistantSkyline(): THREE.Group {
    const group = new THREE.Group();
    const skylineMat = new THREE.MeshBasicMaterial({
      color: 0x90caf9,
      transparent: true,
      opacity: 0.75,
      fog: false
    });

    // Ring of stylized skyscraper silhouettes in the far distance
    const towerGeo = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      // Don't obstruct direct forward view
      const dist = 320;
      const h = 40 + Math.random() * 80;
      const w = 15 + Math.random() * 25;
      const d = 15 + Math.random() * 25;

      const tower = new THREE.Mesh(towerGeo, skylineMat);
      tower.scale.set(w, h, d);
      tower.position.set(
        Math.cos(angle) * dist,
        h * 0.5 - 10,
        Math.sin(angle) * dist
      );
      group.add(tower);
    }

    return group;
  }

  public updateSunPosition(playerZ: number, speed: number = CONSTANTS.INITIAL_SPEED): void {
    // Keep directional shadow map frustum centered on active player and oncoming track
    this.sunLight.position.z = playerZ + 20;
    this.sunLight.target.position.z = playerZ - 12;
    this.sunLight.target.updateMatrixWorld();

    this.fillLight.position.z = playerZ + 15;

    // Sky and skyline track player so horizon feels infinite
    this.skyMesh.position.z = playerZ;
    this.cloudsGroup.position.z = playerZ;
    this.skylineGroup.position.z = playerZ;

    // Subtle cloud drift
    this.cloudsGroup.rotation.y += 0.00015;

    // Subtle high-speed motion lines opacity
    if (this.speedLinesMesh) {
      this.speedLinesMesh.position.z = playerZ;
      const speedThreshold = 25.0;
      const ratio = Math.max(0, Math.min(1.0, (speed - speedThreshold) / (CONSTANTS.MAX_SPEED - speedThreshold)));
      (this.speedLinesMesh.material as THREE.LineBasicMaterial).opacity = ratio * 0.32;
    }
  }

  public applyGraphicsConfig(config: QualityConfig): void {
    const wasShadowEnabled = this.renderer.shadowMap.enabled;
    const wasShadowType = this.renderer.shadowMap.type;
    this.currentConfig = config;

    // 1. Reconfigure Pixel Ratio & Viewport Resolution
    this.renderer.setPixelRatio(config.pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // 2. Reconfigure Shadow Maps
    this.renderer.shadowMap.enabled = config.shadowMapEnabled;
    this.renderer.shadowMap.type = config.shadowMapType;
    this.sunLight.castShadow = config.shadowMapEnabled;

    if (config.shadowMapEnabled) {
      this.sunLight.shadow.mapSize.set(config.shadowMapSize, config.shadowMapSize);
      if (this.sunLight.shadow.map) {
        this.sunLight.shadow.map.dispose();
        (this.sunLight.shadow.map as any) = null;
      }
    }

    // Force material shader recompilation if shadow state changed at runtime
    if (wasShadowEnabled !== config.shadowMapEnabled || wasShadowType !== config.shadowMapType) {
      this.scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              if (m) m.needsUpdate = true;
            });
          } else if (mesh.material) {
            mesh.material.needsUpdate = true;
          }
        }
      });
    }

    // 3. Scenery Detail Toggles
    this.cloudsGroup.visible = config.cloudsVisible;
    this.skylineGroup.visible = config.skylineVisible;
    if (this.speedLinesMesh) {
      this.speedLinesMesh.visible = config.speedLinesVisible;
    }

    // 4. Contact Blob Shadow (Active when directional shadows are off)
    if (this.playerContactShadow) {
      this.playerContactShadow.visible = config.contactBlobShadow;
    }
  }

  public updatePlayerContactShadow(playerX: number, playerY: number, playerZ: number, groundY: number = 0.02): void {
    if (!this.playerContactShadow || !this.playerContactShadow.visible) return;

    this.playerContactShadow.position.set(playerX, groundY + 0.02, playerZ);

    // Scale and fade contact shadow as character jumps higher off ground/roof
    const heightAboveSurface = Math.max(0, playerY - groundY);
    const scaleFactor = Math.max(0.4, 1.5 - heightAboveSurface * 0.25);
    this.playerContactShadow.scale.set(scaleFactor, scaleFactor, scaleFactor);

    const mat = this.playerContactShadow.material as THREE.MeshBasicMaterial;
    if (mat) {
      mat.opacity = Math.max(0.12, 0.45 - heightAboveSurface * 0.12);
    }
  }

  public setGraphicsQuality(preset: 'HIGH' | 'MEDIUM' | 'LOW'): void {
    const graphics = GraphicsManager.getInstance();
    graphics.setPreset(preset, true);
  }

  public onWindowResize(): void {
    const config = GraphicsManager.getInstance().getActiveConfig();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(config.pixelRatio);
  }
}
