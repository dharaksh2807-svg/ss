import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { GraphicsManager, QualityConfig, GraphicsPreset, ResolvedQuality } from './GraphicsManager';
import { EventBus } from '../core/EventBus';
import { EnvironmentTheme, EnvironmentManager, MODERN_METRO_THEME, HISTORIC_QUARTER_THEME, UNDERGROUND_METRO_THEME } from '../environment/EnvironmentConfig';
import type { AtmospherePreset } from '../environment/EnvironmentalEncounterDirector';

export class WorldScene {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  public sunLight: THREE.DirectionalLight;
  public fillLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public skyMesh: THREE.Mesh;
  public cloudsGroup: THREE.Group;
  public skylineGroup: THREE.Group;
  public modernSkyline: THREE.Group | null = null;
  public historicSkyline: THREE.Group | null = null;
  public skylineMaterial: THREE.MeshBasicMaterial | null = null;
  public playerContactShadow: THREE.Mesh;
  public rainParticles: THREE.Points | null = null;
  public currentAtmospherePreset: AtmospherePreset = 'CLEAR_DAYLIGHT';
  private currentConfig: QualityConfig;

  // Environment and smooth atmospheric transition states
  public currentTheme: EnvironmentTheme = MODERN_METRO_THEME;
  public targetTheme: EnvironmentTheme = MODERN_METRO_THEME;
  public prevTheme: EnvironmentTheme | null = null;
  public transitionProgress: number = 1.0;
  private transitionSpeed: number = 0.5; // Smooth 2s transition

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    const envManager = EnvironmentManager.getInstance();
    const initialEnvId = envManager.getStartingEnvironment();
    this.currentTheme = envManager.getTheme(initialEnvId);
    this.targetTheme = this.currentTheme;

    this.scene.background = new THREE.Color(this.currentTheme.fog.color);
    // Soft atmospheric distance haze
    this.scene.fog = new THREE.FogExp2(this.currentTheme.fog.color, this.currentTheme.fog.density);

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
    this.renderer.toneMappingExposure = 1.15;

    // 1. Balanced Lighting Setup initialized to active theme
    this.hemiLight = new THREE.HemisphereLight(
      this.currentTheme.hemi.sky,
      this.currentTheme.hemi.ground,
      this.currentTheme.hemi.intensity
    );
    this.scene.add(this.hemiLight);

    // Directional sunlight
    this.sunLight = new THREE.DirectionalLight(
      this.currentTheme.sun.color,
      this.currentTheme.sun.intensity
    );
    this.sunLight.position.set(
      this.currentTheme.sun.position.x,
      this.currentTheme.sun.position.y,
      this.currentTheme.sun.position.z
    );
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
    this.fillLight = new THREE.DirectionalLight(0xa0c4e8, 0.70);
    this.fillLight.position.set(-24, 28, 14);
    this.scene.add(this.fillLight);

    // Modern asphalt transit ground beneath tracks and lobby camera
    const stationGroundGeo = new THREE.PlaneGeometry(80, 80);
    const stationGroundMat = new THREE.MeshStandardMaterial({
      color: 0x263238,
      roughness: 0.85,
      metalness: 0.2
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

    // 7. Light atmospheric rain particle streaks
    this.rainParticles = this.createRainParticles();
    this.scene.add(this.rainParticles);

    EventBus.getInstance().on('GRAPHICS_CONFIG_CHANGED', (config: QualityConfig) => {
      this.applyGraphicsConfig(config);
    });

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private createRainParticles(): THREE.Points {
    const count = 350;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 36;
      positions[i * 3 + 1] = Math.random() * 22;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 55;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.20,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    const p = new THREE.Points(geo, mat);
    p.visible = false;
    return p;
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
    const topColor = new THREE.Color(this.currentTheme.sky.top);
    const bottomColor = new THREE.Color(this.currentTheme.sky.bottom);

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

  public updateSkyDomeColors(topColor: THREE.Color, bottomColor: THREE.Color): void {
    if (!this.skyMesh) return;
    const geo = this.skyMesh.geometry as THREE.BufferGeometry;
    const colorAttr = geo.getAttribute('color') as THREE.BufferAttribute;
    if (!colorAttr) return;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = Math.max(0, Math.min(1, (y + 40) / 400));
      const c = bottomColor.clone().lerp(topColor, Math.pow(t, 0.8));
      colorAttr.setXYZ(i, c.r, c.g, c.b);
    }
    colorAttr.needsUpdate = true;
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
   * Creates distant hazy skyline silhouettes for both Modern Metro and Historic Quarter
   */
  private createDistantSkyline(): THREE.Group {
    const group = new THREE.Group();
    this.skylineMaterial = new THREE.MeshBasicMaterial({
      color: this.currentTheme.skyline.color,
      transparent: true,
      opacity: this.currentTheme.skyline.opacity,
      fog: false
    });

    const towerGeo = new THREE.BoxGeometry(1, 1, 1);

    // 1. Ring of Modern Skyscraper Silhouettes
    this.modernSkyline = new THREE.Group();
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const dist = 320;
      const h = 40 + Math.random() * 80;
      const w = 15 + Math.random() * 25;
      const d = 15 + Math.random() * 25;

      const tower = new THREE.Mesh(towerGeo, this.skylineMaterial);
      tower.scale.set(w, h, d);
      tower.position.set(
        Math.cos(angle) * dist,
        h * 0.5 - 10,
        Math.sin(angle) * dist
      );
      this.modernSkyline.add(tower);
    }
    group.add(this.modernSkyline);

    // 2. Ring of Historic Victorian Silhouettes (Spires, Clocktowers, Mansard Roofs)
    this.historicSkyline = new THREE.Group();
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const dist = 320;
      const h = 25 + Math.random() * 45;
      const w = 18 + Math.random() * 18;
      const d = 15 + Math.random() * 18;

      const bGroup = new THREE.Group();
      bGroup.position.set(
        Math.cos(angle) * dist,
        -10,
        Math.sin(angle) * dist
      );

      // Base masonry building
      const base = new THREE.Mesh(towerGeo, this.skylineMaterial);
      base.scale.set(w, h, d);
      base.position.y = h * 0.5;
      bGroup.add(base);

      if (i % 2 === 0) {
        // Pointed church spire
        const spireGeo = new THREE.ConeGeometry(w * 0.28, h * 0.55, 6);
        const spire = new THREE.Mesh(spireGeo, this.skylineMaterial);
        spire.position.y = h + h * 0.27;
        bGroup.add(spire);
      } else {
        // Clocktower gable or dual chimneys
        const gableGeo = new THREE.BoxGeometry(w * 0.45, h * 0.35, d * 0.45);
        const gable = new THREE.Mesh(gableGeo, this.skylineMaterial);
        gable.position.y = h + h * 0.17;
        bGroup.add(gable);
      }

      this.historicSkyline.add(bGroup);
    }
    group.add(this.historicSkyline);

    this.modernSkyline.visible = this.currentTheme.id === 'MODERN_METRO';
    this.historicSkyline.visible = this.currentTheme.id === 'HISTORIC_QUARTER';

    return group;
  }

  public applyEnvironment(
    targetTheme: EnvironmentTheme,
    blendFactor: number = 1.0,
    prevTheme?: EnvironmentTheme
  ): void {
    const t = Math.max(0, Math.min(1, blendFactor));
    const base = prevTheme || this.currentTheme || targetTheme;

    // 1. Fog & Background Color
    const fogColor = EnvironmentManager.lerpColor(base.fog.color, targetTheme.fog.color, t);
    this.scene.background = fogColor;
    if (this.scene.fog && (this.scene.fog as THREE.FogExp2).isFogExp2) {
      this.scene.fog.color.copy(fogColor);
      (this.scene.fog as THREE.FogExp2).density = THREE.MathUtils.lerp(base.fog.density, targetTheme.fog.density, t);
    }

    // 2. Sun Directional Light
    const sunColor = EnvironmentManager.lerpColor(base.sun.color, targetTheme.sun.color, t);
    this.sunLight.color.copy(sunColor);
    this.sunLight.intensity = THREE.MathUtils.lerp(base.sun.intensity, targetTheme.sun.intensity, t);

    // 3. Fill Directional Light
    const fillColor = EnvironmentManager.lerpColor(base.fill.color, targetTheme.fill.color, t);
    this.fillLight.color.copy(fillColor);
    this.fillLight.intensity = THREE.MathUtils.lerp(base.fill.intensity, targetTheme.fill.intensity, t);

    // 4. Hemisphere Light
    const hemiSky = EnvironmentManager.lerpColor(base.hemi.sky, targetTheme.hemi.sky, t);
    const hemiGround = EnvironmentManager.lerpColor(base.hemi.ground, targetTheme.hemi.ground, t);
    this.hemiLight.color.copy(hemiSky);
    this.hemiLight.groundColor.copy(hemiGround);
    this.hemiLight.intensity = THREE.MathUtils.lerp(base.hemi.intensity, targetTheme.hemi.intensity, t);

    // 5. Sky Dome Vertex Colors
    const topColor = EnvironmentManager.lerpColor(base.sky.top, targetTheme.sky.top, t);
    const bottomColor = EnvironmentManager.lerpColor(base.sky.bottom, targetTheme.sky.bottom, t);
    this.updateSkyDomeColors(topColor, bottomColor);

    // 6. Skyline Silhouettes
    if (this.skylineMaterial) {
      const skylineColor = EnvironmentManager.lerpColor(base.skyline.color, targetTheme.skyline.color, t);
      this.skylineMaterial.color.copy(skylineColor);
      this.skylineMaterial.opacity = THREE.MathUtils.lerp(base.skyline.opacity, targetTheme.skyline.opacity, t);
    }

    if (this.modernSkyline && this.historicSkyline) {
      const activeId = t < 0.5 ? base.id : targetTheme.id;
      this.modernSkyline.visible = activeId === 'MODERN_METRO';
      this.historicSkyline.visible = activeId === 'HISTORIC_QUARTER';
      if (this.cloudsGroup) {
        this.cloudsGroup.visible = activeId !== 'UNDERGROUND_METRO';
      }
    }

    if (t >= 0.999) {
      this.currentTheme = targetTheme;
      this.prevTheme = null;
    }
  }

  public startAtmosphericTransition(targetTheme: EnvironmentTheme, durationSeconds: number = 2.0): void {
    if (this.currentTheme.id === targetTheme.id && this.transitionProgress >= 1.0) return;
    this.prevTheme = this.currentTheme;
    this.targetTheme = targetTheme;
    this.transitionProgress = 0.0;
    this.transitionSpeed = durationSeconds > 0 ? 1.0 / durationSeconds : 10.0;
  }

  public updateAtmosphere(dt: number): void {
    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + dt * this.transitionSpeed);
      this.applyEnvironment(this.targetTheme, this.transitionProgress, this.prevTheme || this.currentTheme);
    }
  }

  /**
   * Applies a weather or time-of-day atmospheric lighting and fog preset
   */
  public applyAtmospherePreset(preset: AtmospherePreset, blendFactor: number = 1.0): void {
    this.currentAtmospherePreset = preset;
    const t = Math.max(0, Math.min(1, blendFactor));

    let sunColorHex = 0xfff8eb;
    let sunIntensity = 1.35;
    let skyTopHex = 0x3a82f7;
    let skyBottomHex = 0xcfe2ff;
    let fogColorHex = 0x88c4ff;
    let fogDensity = 0.0022;
    let fillColorHex = 0xa0c4e8;
    let fillIntensity = 0.70;
    let isRain = false;

    switch (preset) {
      case 'WARM_GOLDEN_HOUR':
        sunColorHex = 0xffb366;
        sunIntensity = 1.25;
        skyTopHex = 0xd9531e;
        skyBottomHex = 0xfed7aa;
        fogColorHex = 0xe6915b;
        fogDensity = 0.0030;
        fillColorHex = 0xffaa77;
        fillIntensity = 0.65;
        break;
      case 'SOFT_OVERCAST':
        sunColorHex = 0xd0e0f0;
        sunIntensity = 0.95;
        skyTopHex = 0x64748b;
        skyBottomHex = 0xc8d6e5;
        fogColorHex = 0x94a3b8;
        fogDensity = 0.0038;
        fillColorHex = 0x94a3b8;
        fillIntensity = 0.60;
        break;
      case 'LIGHT_RAIN':
        sunColorHex = 0x94a3b8;
        sunIntensity = 0.75;
        skyTopHex = 0x334155;
        skyBottomHex = 0x64748b;
        fogColorHex = 0x475569;
        fogDensity = 0.0050;
        fillColorHex = 0x64748b;
        fillIntensity = 0.50;
        isRain = true;
        break;
      case 'ILLUMINATED_UNDERGROUND':
        sunColorHex = 0xfff5e6;
        sunIntensity = 0.45;
        skyTopHex = 0x0f172a;
        skyBottomHex = 0x1e293b;
        fogColorHex = 0x111827;
        fogDensity = 0.0055;
        fillColorHex = 0x38bdf8;
        fillIntensity = 0.85;
        break;
      case 'CLEAR_DAYLIGHT':
      default:
        sunColorHex = 0xfff8eb;
        sunIntensity = 1.35;
        skyTopHex = 0x3a82f7;
        skyBottomHex = 0xcfe2ff;
        fogColorHex = 0x88c4ff;
        fogDensity = 0.0022;
        fillColorHex = 0xa0c4e8;
        fillIntensity = 0.70;
        break;
    }

    if (this.rainParticles) {
      this.rainParticles.visible = isRain;
    }

    // Smoothly lerp towards target
    const targetFog = new THREE.Color(fogColorHex);
    this.scene.background = targetFog;
    if (this.scene.fog && (this.scene.fog as THREE.FogExp2).isFogExp2) {
      this.scene.fog.color.lerp(targetFog, t);
      (this.scene.fog as THREE.FogExp2).density = THREE.MathUtils.lerp((this.scene.fog as THREE.FogExp2).density, fogDensity, t);
    }

    this.sunLight.color.lerp(new THREE.Color(sunColorHex), t);
    this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, sunIntensity, t);

    this.fillLight.color.lerp(new THREE.Color(fillColorHex), t);
    this.fillLight.intensity = THREE.MathUtils.lerp(this.fillLight.intensity, fillIntensity, t);

    this.updateSkyDomeColors(new THREE.Color(skyTopHex), new THREE.Color(skyBottomHex));
  }

  public updateSunPosition(playerZ: number, speed: number = CONSTANTS.INITIAL_SPEED, dt: number = 0.016): void {
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
      const speedThreshold = 21.0;
      const maxSpd = 52.0;
      const ratio = Math.max(0, Math.min(1.0, (speed - speedThreshold) / (maxSpd - speedThreshold)));
      (this.speedLinesMesh.material as THREE.LineBasicMaterial).opacity = ratio * 0.52;
    }

    // Atmospheric rain particles tracking & animation
    if (this.rainParticles && this.rainParticles.visible) {
      this.rainParticles.position.z = playerZ - 12;
      const pos = (this.rainParticles.geometry as THREE.BufferGeometry).attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - 28 * (dt || 0.016);
        if (y < 0) y = 22;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
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
