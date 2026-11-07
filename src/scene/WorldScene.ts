import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { GraphicsManager, QualityConfig, GraphicsPreset, ResolvedQuality } from './GraphicsManager';
import { EventBus } from '../core/EventBus';
import { SettingsManager } from '../settings/SettingsManager';
import { EnvironmentTheme, EnvironmentManager, MODERN_METRO_THEME, HISTORIC_QUARTER_THEME, UNDERGROUND_METRO_THEME } from '../environment/EnvironmentConfig';
import type { AtmospherePreset } from '../environment/EnvironmentalEncounterDirector';
import { TextureGenerator } from './TextureGenerator';
import { SeededRandom } from '../environment/SceneryFactory';
import { VipComedyEventDirector } from '../environment/VipComedyEventDirector';
import { RahulComedyEventDirector } from '../environment/worlds/rahulverse/RahulComedyEventDirector';
import { MidnightVelvetEventDirector } from '../environment/worlds/midnightVelvet/MidnightVelvetEventDirector';
import { ChronoKingdomEventDirector } from '../environment/worlds/chronoKingdom/ChronoKingdomEventDirector';
import { InfernoExpressEventDirector } from '../environment/worlds/infernoExpress/InfernoExpressEventDirector';
import { JurassicRushEventDirector } from '../environment/worlds/jurassicRush/JurassicRushEventDirector';
import { FeverDirector } from '../environment/worlds/vivaHeat/FeverDirector';
import { HauntedCarnivalEventDirector } from '../environment/worlds/hauntedCarnival/HauntedCarnivalEventDirector';
import { PhantomLineEventDirector } from '../environment/worlds/phantomLine/PhantomLineEventDirector';

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
  public neonSkyline: THREE.Group | null = null;
  public orbitalSkyline: THREE.Group | null = null;
  public abyssalSkyline: THREE.Group | null = null;
  public doomsdaySkyline: THREE.Group | null = null;
  public phantomSkyline: THREE.Group | null = null;
  public hauntedCarnivalSkyline: THREE.Group | null = null;
  public vipExpressSkyline: THREE.Group | null = null;
  public midnightVelvetSkyline: THREE.Group | null = null;
  public jurassicSkyline: THREE.Group | null = null;
  public infernoSkyline: THREE.Group | null = null;
  public skylineMaterial: THREE.MeshBasicMaterial | null = null;
  private historicSkylineMaterial: THREE.MeshBasicMaterial | null = null;
  private neonSkylineMaterial: THREE.MeshBasicMaterial | null = null;
  private orbitalSkylineMaterial: THREE.MeshBasicMaterial | null = null;
  private abyssalSkylineMaterial: THREE.MeshBasicMaterial | null = null;
  private doomsdaySkylineMaterial: THREE.MeshBasicMaterial | null = null;
  private phantomSkylineMaterial: THREE.MeshBasicMaterial | null = null;
  private hauntedCarnivalSkylineMaterial: THREE.MeshBasicMaterial | null = null;
  private vipExpressSkylineMaterial: THREE.MeshBasicMaterial | null = null;
  private midnightVelvetSkylineMaterial: THREE.MeshBasicMaterial | null = null;
  private jurassicSkylineMaterial: THREE.MeshBasicMaterial | null = null;
  private infernoSkylineMaterial: THREE.MeshBasicMaterial | null = null;
  private infernoSkylineVolcanoes: Array<{ craterGlow: THREE.Mesh; plume: THREE.Mesh; phase: number }> = [];
  private infernoSkylineTime: number = 0;
  private vipSearchlights: THREE.Mesh[] = [];
  private midnightSkylineSearchlights: THREE.Mesh[] = [];
  private jurassicPterosaurFlocks: Array<{ group: THREE.Group; leftWing: THREE.Object3D; rightWing: THREE.Object3D; phase: number; basePos: THREE.Vector3 }> = [];
  private vipConfettiGeo: THREE.BufferGeometry | null = null;
  private vipConfettiPos: Float32Array | null = null;
  private vipSearchlightTime: number = 0;
  private midnightSkylineSearchlightTime: number = 0;
  private jurassicSkylineTime: number = 0;
  private backgroundSpacecraft: THREE.Group[] = [];
  private backgroundMarineCreatures: THREE.Group[] = [];
  private abyssalCreatureTime: number = 0;
  private doomsdaySmokePlumes: THREE.Group[] = [];
  private doomsdayMeteorStreaks: THREE.Mesh[] = [];
  private doomsdayEmbersTime: number = 0;
  private doomsdayEmbersGeo: THREE.BufferGeometry | null = null;
  private doomsdayEmbersPositions: Float32Array | null = null;
  private phantomEctoParticlesGeo: THREE.BufferGeometry | null = null;
  private phantomEctoParticlesPos: Float32Array | null = null;
  private phantomEctoTime: number = 0;
  private phantomGhostTrain: THREE.Group | null = null;
  private phantomFlickerLamps: THREE.Mesh[] = [];
  private phantomFlickerTime: number = 0;
  private hauntedFerrisWheel: THREE.Group | null = null;
  private hauntedFerrisGondolas: THREE.Mesh[] = [];
  private hauntedAnimatedBats: THREE.Group[] = [];
  private hauntedBatTime: number = 0;
  private cloudMaterial: THREE.MeshStandardMaterial | null = null;
  public playerContactShadow: THREE.Mesh;
  public rainParticles: THREE.Points | null = null;
  public infiniteSubterraneanBed!: THREE.Mesh;
  public currentAtmospherePreset: AtmospherePreset = 'CLEAR_DAYLIGHT';
  private currentConfig: QualityConfig;

  // Environment and smooth atmospheric transition states
  public currentTheme: EnvironmentTheme = MODERN_METRO_THEME;
  public targetTheme: EnvironmentTheme = MODERN_METRO_THEME;
  public prevTheme: EnvironmentTheme | null = null;
  public transitionProgress: number = 1.0;
  private transitionSpeed: number = 0.5; // Smooth 2s transition
  private lastPlayerZ: number = 0;

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
    this.renderer.toneMappingExposure = 1.22;

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
    this.scene.add(this.fillLight.target);

    // Draw the flat fallback between the sky and gameplay geometry so it cannot
    // cover rails and terrain that bend below it in the curvature shader.
    const subBedGeo = new THREE.PlaneGeometry(360, 1200);
    const subBedMat = new THREE.MeshStandardMaterial({
      color: 0x263238,
      roughness: 0.90,
      metalness: 0.15,
      depthWrite: false
    });
    this.infiniteSubterraneanBed = new THREE.Mesh(subBedGeo, subBedMat);
    this.infiniteSubterraneanBed.name = 'infinite_subterranean_bed';
    this.infiniteSubterraneanBed.renderOrder = -1;
    this.infiniteSubterraneanBed.rotation.x = -Math.PI / 2;
    this.infiniteSubterraneanBed.position.set(0, -0.32, 0);
    this.infiniteSubterraneanBed.receiveShadow = true;
    this.scene.add(this.infiniteSubterraneanBed);

    // 2. Vibrant Daytime Sky Dome
    this.skyMesh = this.createSkyDome();
    this.skyMesh.renderOrder = -2;
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
      metalness: 0.05,
      transparent: true
    });
    this.cloudMaterial = cloudMat;

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
    this.historicSkylineMaterial = this.skylineMaterial.clone();

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
      const base = new THREE.Mesh(towerGeo, this.historicSkylineMaterial);
      base.scale.set(w, h, d);
      base.position.y = h * 0.5;
      bGroup.add(base);

      if (i % 2 === 0) {
        // Pointed church spire
        const spireGeo = new THREE.ConeGeometry(w * 0.28, h * 0.55, 6);
        const spire = new THREE.Mesh(spireGeo, this.historicSkylineMaterial);
        spire.position.y = h + h * 0.27;
        bGroup.add(spire);
      } else {
        // Clocktower gable or dual chimneys
        const gableGeo = new THREE.BoxGeometry(w * 0.45, h * 0.35, d * 0.45);
        const gable = new THREE.Mesh(gableGeo, this.historicSkylineMaterial);
        gable.position.y = h + h * 0.17;
        bGroup.add(gable);
      }

      this.historicSkyline.add(bGroup);
    }
    group.add(this.historicSkyline);

    // 3. Ring of Futuristic Cyber Megacity Silhouettes (Neon Rainline)
    this.neonSkyline = new THREE.Group();
    this.neonSkylineMaterial = this.skylineMaterial.clone();
    const neonCyanTrimMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, fog: false });
    const neonMagentaTrimMat = new THREE.MeshBasicMaterial({ color: 0xf026d3, fog: false });

    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const dist = 320;
      const isSignatureAngle = Math.abs(angle - (-Math.PI * 0.5 + 0.22)) < 0.15;

      const nGroup = new THREE.Group();
      nGroup.position.set(
        Math.cos(angle) * dist,
        -10,
        Math.sin(angle) * dist
      );

      if (isSignatureAngle) {
        // --- SIGNATURE SKYLINE LANDMARK: "Hyperion Apex / Neo-Sky Spire" (240m tall) ---
        const spireBaseH = 140;
        const spireBaseW = 20;
        const spireBase = new THREE.Mesh(towerGeo, this.neonSkylineMaterial);
        spireBase.scale.set(spireBaseW, spireBaseH, spireBaseW);
        spireBase.position.y = spireBaseH * 0.5;
        nGroup.add(spireBase);

        // Upper tapering spire shaft
        const spireTopH = 100;
        const spireTopGeo = new THREE.ConeGeometry(spireBaseW * 0.45, spireTopH, 6);
        const spireTop = new THREE.Mesh(spireTopGeo, this.neonSkylineMaterial);
        spireTop.position.y = spireBaseH + spireTopH * 0.5;
        nGroup.add(spireTop);

        // Concentric illuminated superconductor rings
        const ringGeo1 = new THREE.TorusGeometry(spireBaseW * 0.75, 0.9, 6, 18);
        const ring1 = new THREE.Mesh(ringGeo1, neonCyanTrimMat);
        ring1.rotation.x = Math.PI / 2;
        ring1.position.y = 75;
        nGroup.add(ring1);

        const ringGeo2 = new THREE.TorusGeometry(spireBaseW * 0.60, 0.8, 6, 18);
        const ring2 = new THREE.Mesh(ringGeo2, neonMagentaTrimMat);
        ring2.rotation.x = Math.PI / 2;
        ring2.position.y = 135;
        nGroup.add(ring2);

        const ringGeo3 = new THREE.TorusGeometry(spireBaseW * 0.40, 0.7, 6, 18);
        const ring3 = new THREE.Mesh(ringGeo3, neonCyanTrimMat);
        ring3.rotation.x = Math.PI / 2;
        ring3.position.y = 190;
        nGroup.add(ring3);

        // Summit beacon
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 8), neonCyanTrimMat);
        beacon.position.y = spireBaseH + spireTopH + 1.2;
        nGroup.add(beacon);
      } else {
        // Modular megacity skyscraper
        const h = 55 + Math.random() * 95;
        const w = 16 + Math.random() * 24;
        const d = 16 + Math.random() * 24;

        const mainTower = new THREE.Mesh(towerGeo, this.neonSkylineMaterial);
        mainTower.scale.set(w, h, d);
        mainTower.position.y = h * 0.5;
        nGroup.add(mainTower);

        // Stepped crown setback
        const crownH = 12 + Math.random() * 20;
        const crownW = w * 0.6;
        const crown = new THREE.Mesh(towerGeo, this.neonSkylineMaterial);
        crown.scale.set(crownW, crownH, d * 0.6);
        crown.position.y = h + crownH * 0.5;
        nGroup.add(crown);

        // Glowing crown accent trim
        const trimMat = i % 2 === 0 ? neonCyanTrimMat : neonMagentaTrimMat;
        const trimGeo = new THREE.BoxGeometry(w + 0.4, 1.2, d + 0.4);
        const trim = new THREE.Mesh(trimGeo, trimMat);
        trim.position.y = h;
        nGroup.add(trim);

        // Spire antenna
        if (i % 3 === 0) {
          const antH = 15 + Math.random() * 25;
          const antGeo = new THREE.CylinderGeometry(0.3, 0.5, antH, 6);
          const ant = new THREE.Mesh(antGeo, this.neonSkylineMaterial);
          ant.position.y = h + crownH + antH * 0.5;
          nGroup.add(ant);

          const antBeacon = new THREE.Mesh(new THREE.SphereGeometry(1.0, 6, 6), trimMat);
          antBeacon.position.y = h + crownH + antH;
          nGroup.add(antBeacon);
        }
      }

      this.neonSkyline.add(nGroup);
    }
    group.add(this.neonSkyline);

    // 4. Celestial Megastructure & Planet Skyline (Orbital Halo)
    const orbitalSkyline = new THREE.Group();
    this.orbitalSkyline = orbitalSkyline;
    this.orbitalSkylineMaterial = this.skylineMaterial.clone();
    const orbitalCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, fog: false });
    const orbitalWhiteMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, fog: false });
    const orbitalGoldMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, fog: false });

    // 4a. Starfield (Deep space star points)
    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 380 + Math.random() * 80;
      const sx = r * Math.sin(phi) * Math.cos(theta);
      const sy = Math.abs(r * Math.cos(phi)) + 15; // Above horizon
      const sz = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 0] = sx;
      starPos[i * 3 + 1] = sy;
      starPos[i * 3 + 2] = sz;

      // Color variation: 70% pure white, 20% electric cyan, 10% warm amber
      const type = Math.random();
      if (type < 0.70) {
        starColors[i * 3 + 0] = 1.0; starColors[i * 3 + 1] = 1.0; starColors[i * 3 + 2] = 1.0;
      } else if (type < 0.90) {
        starColors[i * 3 + 0] = 0.4; starColors[i * 3 + 1] = 0.9; starColors[i * 3 + 2] = 1.0;
      } else {
        starColors[i * 3 + 0] = 1.0; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 0.5;
      }
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      fog: false
    });
    const stars = new THREE.Points(starGeo, starMat);
    this.orbitalSkyline.add(stars);

    // 4b. Gigantic Planet Dominating the Forward Horizon
    const planetGroup = new THREE.Group();
    // Positioned prominently in forward-right vista, dominating upper view from running camera
    planetGroup.position.set(75, 50, -280);

    const planetRadius = 130;
    const planetGeo = new THREE.SphereGeometry(planetRadius, 36, 24);
    const planetMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getOrbitalPlanetTexture(),
      fog: false
    });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    planetMesh.rotation.set(0.25, -0.75, 0.2);
    planetGroup.add(planetMesh);

    // Atmospheric Glow Halo / Limb Rings
    // Sharp razor-thin cyan atmospheric crescent
    const atmoLimbGeo = new THREE.RingGeometry(planetRadius + 0.5, planetRadius + 18, 48);
    const atmoLimbMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      fog: false
    });
    const atmoLimb = new THREE.Mesh(atmoLimbGeo, atmoLimbMat);
    atmoLimb.lookAt(new THREE.Vector3(-75, -45, 280));
    planetGroup.add(atmoLimb);

    // Soft outer atmosphere aura
    const atmoOuterGeo = new THREE.RingGeometry(planetRadius + 16, planetRadius + 38, 48);
    const atmoOuterMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      fog: false
    });
    const atmoOuter = new THREE.Mesh(atmoOuterGeo, atmoOuterMat);
    atmoOuter.lookAt(new THREE.Vector3(-75, -45, 280));
    planetGroup.add(atmoOuter);

    this.orbitalSkyline.add(planetGroup);

    // 4c. Enormous Sweeping Megastructure Orbital Ring / Halo Arc
    const ringGroup = new THREE.Group();
    ringGroup.position.set(0, -80, -260);
    ringGroup.rotation.set(1.15, 0.40, -0.25);

    const mainRingGeo = new THREE.TorusGeometry(540, 5.5, 12, 72, Math.PI * 0.95);
    const mainRing = new THREE.Mesh(mainRingGeo, this.orbitalSkylineMaterial);
    ringGroup.add(mainRing);

    // Companion illuminated cyan superconductor induction rail along ring
    const glowRingGeo = new THREE.TorusGeometry(540, 1.4, 6, 72, Math.PI * 0.95);
    const glowRing = new THREE.Mesh(glowRingGeo, orbitalCyanMat);
    ringGroup.add(glowRing);

    // Modular structural truss ribs along ring
    const ribGeo = new THREE.BoxGeometry(4.0, 14.0, 8.0);
    for (let r = 0; r < 24; r++) {
      const angle = (r / 24) * (Math.PI * 0.95);
      const rx = Math.cos(angle) * 540;
      const ry = Math.sin(angle) * 540;
      const rib = new THREE.Mesh(ribGeo, orbitalWhiteMat);
      rib.position.set(rx, ry, 0);
      rib.rotation.z = angle + Math.PI / 2;
      ringGroup.add(rib);
    }
    this.orbitalSkyline.add(ringGroup);

    // 4d. Distant Space Station Modules & Orbital Docks
    const stationSpireMat = this.orbitalSkylineMaterial;
    const stationCoords = [
      { x: -160, y: 55, z: -320, scale: 1.2 },
      { x: -90, y: 110, z: -340, scale: 0.9 },
      { x: 190, y: 95, z: -330, scale: 1.1 },
      { x: 40, y: 130, z: -350, scale: 0.85 }
    ];

    stationCoords.forEach((coord, sIdx) => {
      const station = new THREE.Group();
      station.position.set(coord.x, coord.y, coord.z);
      const sc = coord.scale;

      // Central cylindrical habitat drum
      const drumGeo = new THREE.CylinderGeometry(8 * sc, 8 * sc, 34 * sc, 12);
      const drum = new THREE.Mesh(drumGeo, stationSpireMat);
      drum.rotation.z = Math.PI / 2 + 0.2;
      station.add(drum);

      // Observation cupola dome
      const domeGeo = new THREE.SphereGeometry(7 * sc, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const dome = new THREE.Mesh(domeGeo, orbitalCyanMat);
      dome.position.set(18 * sc, 0, 0);
      dome.rotation.z = -Math.PI / 2;
      station.add(dome);

      // Articulated Photovoltaic Solar Wings
      const wingGeo = new THREE.BoxGeometry(26 * sc, 0.4, 8 * sc);
      const wingMat = new THREE.MeshBasicMaterial({
        map: TextureGenerator.getOrbitalSolarPanelTexture(),
        fog: false
      });
      const wing1 = new THREE.Mesh(wingGeo, wingMat);
      wing1.position.set(0, 16 * sc, 0);
      station.add(wing1);

      const wing2 = new THREE.Mesh(wingGeo, wingMat);
      wing2.position.set(0, -16 * sc, 0);
      station.add(wing2);

      // Telemetry beacon lights
      const beaconGeo = new THREE.SphereGeometry(1.6 * sc, 6, 6);
      const beaconMat = sIdx % 2 === 0 ? orbitalCyanMat : orbitalGoldMat;
      const beacon1 = new THREE.Mesh(beaconGeo, beaconMat);
      beacon1.position.set(-18 * sc, 0, 0);
      station.add(beacon1);

      this.orbitalSkyline!.add(station);
    });

    // 4e. Moving Background Spacecraft (Lightweight Traffic)
    this.backgroundSpacecraft = [];
    const craftSpecs = [
      { startX: -160, y: 75, z: -280, vx: 18.0, vy: 0.5, minX: -220, maxX: 220, scale: 1.0, type: 'SHUTTLE' },
      { startX: 180, y: 45, z: -250, vx: -14.0, vy: -0.3, minX: -220, maxX: 220, scale: 1.3, type: 'FREIGHTER' },
      { startX: -80, y: 115, z: -300, vx: 28.0, vy: 1.2, minX: -220, maxX: 220, scale: 0.7, type: 'SCOUT' },
      { startX: 120, y: 88, z: -340, vx: -8.0, vy: 0.2, minX: -220, maxX: 220, scale: 1.1, type: 'CARGO' }
    ];

    craftSpecs.forEach((spec) => {
      const craft = new THREE.Group();
      craft.position.set(spec.startX, spec.y, spec.z);
      craft.userData = {
        vx: spec.vx,
        vy: spec.vy,
        minX: spec.minX,
        maxX: spec.maxX
      };

      const s = spec.scale;
      // Fuselage body
      const bodyGeo = new THREE.ConeGeometry(2.2 * s, 8.5 * s, 6);
      const body = new THREE.Mesh(bodyGeo, orbitalWhiteMat);
      body.rotation.z = spec.vx > 0 ? -Math.PI / 2 : Math.PI / 2;
      craft.add(body);

      // Ion thruster plume
      const thrusterGeo = new THREE.ConeGeometry(1.2 * s, 5.0 * s, 6);
      const thruster = new THREE.Mesh(thrusterGeo, orbitalCyanMat);
      thruster.position.set(spec.vx > 0 ? -5.5 * s : 5.5 * s, 0, 0);
      thruster.rotation.z = spec.vx > 0 ? Math.PI / 2 : -Math.PI / 2;
      craft.add(thruster);

      this.backgroundSpacecraft.push(craft);
      this.orbitalSkyline!.add(craft);
    });

    group.add(this.orbitalSkyline);

    // 5. Deep Ocean Oceanic Megacity & Benthic Skyline (Abyssal Glassline)
    const abyssalSkyline = new THREE.Group();
    this.abyssalSkyline = abyssalSkyline;
    this.abyssalSkylineMaterial = this.skylineMaterial.clone();
    const abyssalTealMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, fog: false });
    const abyssalCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, fog: false });
    const abyssalAmberMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, fog: false });
    const abyssalNavyMat = new THREE.MeshBasicMaterial({ color: 0x051d2f, fog: false });

    // 5a. Marine Snow / Bioluminescent Particulate
    const planktonCount = 450;
    const planktonGeo = new THREE.BufferGeometry();
    const planktonPos = new Float32Array(planktonCount * 3);
    const planktonColors = new Float32Array(planktonCount * 3);
    for (let i = 0; i < planktonCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 180 + Math.random() * 120;
      planktonPos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      planktonPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 8;
      planktonPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const type = Math.random();
      if (type < 0.60) {
        // Cyan-teal bioluminescence
        planktonColors[i * 3 + 0] = 0.13; planktonColors[i * 3 + 1] = 0.83; planktonColors[i * 3 + 2] = 0.93;
      } else if (type < 0.85) {
        // Electric white-cyan
        planktonColors[i * 3 + 0] = 0.8; planktonColors[i * 3 + 1] = 0.95; planktonColors[i * 3 + 2] = 1.0;
      } else {
        // Warm hydrothermal amber
        planktonColors[i * 3 + 0] = 0.96; planktonColors[i * 3 + 1] = 0.62; planktonColors[i * 3 + 2] = 0.1;
      }
    }
    planktonGeo.setAttribute('position', new THREE.BufferAttribute(planktonPos, 3));
    planktonGeo.setAttribute('color', new THREE.BufferAttribute(planktonColors, 3));
    const planktonMat = new THREE.PointsMaterial({
      size: 2.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      fog: false
    });
    const plankton = new THREE.Points(planktonGeo, planktonMat);
    this.abyssalSkyline.add(plankton);

    // 5b. Giant Submerged Geodesic Biodomes
    // Main forward-left Trench Sanctum Dome
    const domeGroup = new THREE.Group();
    domeGroup.position.set(-75, 38, -260);

    const domeRadius = 95;
    const domeGeo = new THREE.SphereGeometry(domeRadius, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const domeMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getAbyssalDomeHexTexture(),
      fog: false,
      transparent: true,
      opacity: 0.92
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    domeGroup.add(domeMesh);

    // Glowing interior city spire core inside the dome
    const coreSpireGeo = new THREE.CylinderGeometry(1.2, 14, 75, 8);
    const coreSpire = new THREE.Mesh(coreSpireGeo, abyssalCyanMat);
    coreSpire.position.y = 35;
    domeGroup.add(coreSpire);

    // Concentric hydrostatic compression ring at dome base
    const domeRingGeo = new THREE.RingGeometry(domeRadius - 2, domeRadius + 8, 32);
    const domeRing = new THREE.Mesh(domeRingGeo, abyssalTealMat);
    domeRing.rotation.x = -Math.PI / 2;
    domeGroup.add(domeRing);

    this.abyssalSkyline.add(domeGroup);

    // Secondary distant research dome on the right
    const dome2 = new THREE.Mesh(new THREE.SphereGeometry(50, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), domeMat);
    dome2.position.set(145, 25, -290);
    this.abyssalSkyline.add(dome2);

    // 5c. Hydrothermal Vent Spires with Amber Thermal Plumes
    const ventCoords = [
      { x: -160, y: 0, z: -270, h: 65 },
      { x: 185, y: 0, z: -250, h: 55 }
    ];
    ventCoords.forEach((coord) => {
      const vent = new THREE.Group();
      vent.position.set(coord.x, 0, coord.z);

      const chimneyGeo = new THREE.CylinderGeometry(2.5, 9.0, coord.h, 8);
      const chimney = new THREE.Mesh(chimneyGeo, abyssalNavyMat);
      chimney.position.y = coord.h * 0.5;
      vent.add(chimney);

      // Amber thermal beacon glow at summit
      const glowGeo = new THREE.SphereGeometry(3.5, 8, 8);
      const glow = new THREE.Mesh(glowGeo, abyssalAmberMat);
      glow.position.y = coord.h;
      vent.add(glow);

      this.abyssalSkyline!.add(vent);
    });

    // 5d. Shimmering Downwelling Caustics Plane
    const causticGeo = new THREE.PlaneGeometry(360, 240);
    const causticMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getAbyssalCausticTexture(),
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      fog: false
    });
    const causticPlane = new THREE.Mesh(causticGeo, causticMat);
    causticPlane.position.set(0, 92, -180);
    causticPlane.rotation.set(Math.PI / 2 + 0.12, 0, 0);
    this.abyssalSkyline.add(causticPlane);

    // 5e. Swimming Background Marine Leviathans (Creatures)
    this.backgroundMarineCreatures = [];
    const creatureSpecs = [
      { startX: -140, y: 52, z: -240, vx: 14.0, verticalAmp: 4.5, swimFreq: 1.4, swimPhase: 0.0, minX: -220, maxX: 220, scale: 1.4, type: 'MANTA' },
      { startX: 160, y: 72, z: -280, vx: -11.0, verticalAmp: 3.2, swimFreq: 1.1, swimPhase: 2.1, minX: -220, maxX: 220, scale: 1.8, type: 'LEVIATHAN' },
      { startX: -60, y: 92, z: -310, vx: 22.0, verticalAmp: 5.0, swimFreq: 1.9, swimPhase: 4.2, minX: -220, maxX: 220, scale: 0.9, type: 'SCOUT_RAY' }
    ];

    creatureSpecs.forEach((spec) => {
      const creature = new THREE.Group();
      creature.position.set(spec.startX, spec.y, spec.z);
      creature.userData = {
        vx: spec.vx,
        verticalAmp: spec.verticalAmp,
        swimFreq: spec.swimFreq,
        swimPhase: spec.swimPhase,
        minX: spec.minX,
        maxX: spec.maxX
      };

      const sc = spec.scale;
      // Fusiform hydrodynamic body
      const bodyGeo = new THREE.ConeGeometry(2.4 * sc, 16 * sc, 8);
      const body = new THREE.Mesh(bodyGeo, abyssalNavyMat);
      body.rotation.z = spec.vx > 0 ? -Math.PI / 2 : Math.PI / 2;
      creature.add(body);

      // Wide undulating pectoral wings
      const wingGeo = new THREE.BoxGeometry(22 * sc, 0.4, 7 * sc);
      const wing = new THREE.Mesh(wingGeo, abyssalTealMat);
      creature.add(wing);

      // Bioluminescent dorsal spine light strip
      const dorsalGeo = new THREE.BoxGeometry(0.3 * sc, 0.8 * sc, 14 * sc);
      const dorsal = new THREE.Mesh(dorsalGeo, abyssalCyanMat);
      dorsal.position.y = 1.4 * sc;
      creature.add(dorsal);

      this.backgroundMarineCreatures.push(creature);
      this.abyssalSkyline!.add(creature);
    });

    group.add(this.abyssalSkyline);

    // 6. Apocalyptic Burning Metropolis Skyline (Doomsday: Last Transit)
    const doomsdaySkyline = new THREE.Group();
    this.doomsdaySkyline = doomsdaySkyline;
    this.doomsdaySkylineMaterial = this.skylineMaterial.clone();
    const doomsdaySootMat = new THREE.MeshBasicMaterial({ color: 0x140806, fog: false });
    const doomsdayCharcoalMat = new THREE.MeshBasicMaterial({ color: 0x22130e, fog: false });
    const doomsdayAmberMat = new THREE.MeshBasicMaterial({ color: 0xf97316, fog: false });
    const doomsdayFlameMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, fog: false });
    const doomsdayLavaMat = new THREE.MeshBasicMaterial({ color: 0xef4444, fog: false });
    const doomsdaySmokeMat = new THREE.MeshBasicMaterial({
      color: 0x1c0b06,
      transparent: true,
      opacity: 0.65,
      fog: false
    });

    // 6a. Falling Embers & Atmospheric Volcanic Ash Particles
    const emberCount = 450;
    const emberGeo = new THREE.BufferGeometry();
    const emberPositions = new Float32Array(emberCount * 3);
    const emberColors = new Float32Array(emberCount * 3);

    const emberColorPalette = [
      new THREE.Color(0xffedd5), // incandescent white-gold
      new THREE.Color(0xf97316), // intense amber flame
      new THREE.Color(0xef4444), // glowing thermal red
      new THREE.Color(0x78716c)  // dark drifting soot flake
    ];

    for (let i = 0; i < emberCount; i++) {
      emberPositions[i * 3 + 0] = (Math.random() - 0.5) * 160;
      emberPositions[i * 3 + 1] = Math.random() * 60;
      emberPositions[i * 3 + 2] = -Math.random() * 220 + 20;

      const col = emberColorPalette[Math.floor(Math.random() * emberColorPalette.length)];
      emberColors[i * 3 + 0] = col.r;
      emberColors[i * 3 + 1] = col.g;
      emberColors[i * 3 + 2] = col.b;
    }

    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
    emberGeo.setAttribute('color', new THREE.BufferAttribute(emberColors, 3));
    this.doomsdayEmbersGeo = emberGeo;
    this.doomsdayEmbersPositions = emberPositions;

    const emberMat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.90,
      fog: false
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    this.doomsdaySkyline.add(embers);

    // 6b. 18 Massive Distant Shattered Monolith Skyscrapers
    const ruinedTowerSpecs = [
      // Left cluster: Financial district ruins
      { x: -80, z: -290, w: 26, d: 24, h: 88, tiltZ: 0.12, shearAngle: 0.28 },
      { x: -115, z: -340, w: 32, d: 28, h: 110, tiltZ: -0.08, shearAngle: -0.22 },
      { x: -155, z: -310, w: 24, d: 24, h: 72, tiltZ: 0.05, shearAngle: 0.35 },
      { x: -190, z: -380, w: 36, d: 32, h: 125, tiltZ: -0.15, shearAngle: -0.18 },
      { x: -70, z: -430, w: 28, d: 26, h: 95, tiltZ: 0.08, shearAngle: 0.25 },
      { x: -130, z: -460, w: 30, d: 30, h: 84, tiltZ: -0.10, shearAngle: -0.30 },
      { x: -175, z: -510, w: 40, d: 35, h: 130, tiltZ: 0.06, shearAngle: 0.15 },
      { x: -95, z: -540, w: 25, d: 22, h: 76, tiltZ: -0.05, shearAngle: -0.25 },

      // Right cluster: Megacity commercial / communications monoliths
      { x: 85, z: -280, w: 28, d: 25, h: 92, tiltZ: -0.10, shearAngle: -0.26 },
      { x: 120, z: -330, w: 34, d: 30, h: 118, tiltZ: 0.14, shearAngle: 0.20 },
      { x: 160, z: -315, w: 22, d: 22, h: 68, tiltZ: -0.06, shearAngle: -0.32 },
      { x: 195, z: -375, w: 38, d: 34, h: 135, tiltZ: 0.12, shearAngle: 0.18 },
      { x: 75, z: -425, w: 26, d: 24, h: 86, tiltZ: -0.07, shearAngle: -0.22 },
      { x: 135, z: -455, w: 32, d: 28, h: 98, tiltZ: 0.09, shearAngle: 0.28 },
      { x: 180, z: -505, w: 42, d: 36, h: 140, tiltZ: -0.11, shearAngle: -0.16 },
      { x: 100, z: -535, w: 26, d: 24, h: 80, tiltZ: 0.08, shearAngle: 0.24 },

      // Center distant colossal ruined spires
      { x: -35, z: -520, w: 44, d: 38, h: 155, tiltZ: 0.06, shearAngle: 0.22 },
      { x: 40, z: -550, w: 48, d: 40, h: 165, tiltZ: -0.07, shearAngle: -0.19 }
    ];

    ruinedTowerSpecs.forEach((spec, idx) => {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(spec.x, 0, spec.z);
      towerGroup.rotation.z = spec.tiltZ;

      // Lower intact structural base
      const baseH = spec.h * 0.65;
      const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(spec.w, baseH, spec.d), doomsdaySootMat);
      baseMesh.position.y = baseH * 0.5;
      towerGroup.add(baseMesh);

      // Sheared upper fractured section
      const topH = spec.h * 0.35;
      const topMesh = new THREE.Mesh(new THREE.BoxGeometry(spec.w * 0.85, topH, spec.d * 0.85), doomsdayCharcoalMat);
      topMesh.position.set(spec.shearAngle * 10, baseH + topH * 0.45, 0);
      topMesh.rotation.z = spec.shearAngle;
      towerGroup.add(topMesh);

      // Jagged exposed steel rebar spires protruding from sheared roof
      [-spec.w * 0.25, 0, spec.w * 0.25].forEach((rx, rIdx) => {
        const rebarH = 8.0 + (rIdx * 5);
        const rebar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, rebarH, 4), doomsdayAmberMat);
        rebar.position.set(rx + (spec.shearAngle * 8), spec.h + rebarH * 0.4, (rIdx - 1) * 4);
        rebar.rotation.z = spec.shearAngle * 0.8;
        towerGroup.add(rebar);
      });

      // Glowing internal firestorm blast cavities / broken window fissures
      if (idx % 2 === 0) {
        const breachMesh = new THREE.Mesh(new THREE.BoxGeometry(spec.w * 0.6, 6.0, spec.d + 0.5), doomsdayAmberMat);
        breachMesh.position.set(0, baseH * 0.55, 0);
        towerGroup.add(breachMesh);

        const flameLick = new THREE.Mesh(new THREE.BoxGeometry(spec.w * 0.35, 3.5, spec.d + 0.8), doomsdayFlameMat);
        flameLick.position.set(spec.w * 0.1, baseH * 0.55 + 2.5, 0);
        towerGroup.add(flameLick);
      }

      this.doomsdaySkyline!.add(towerGroup);
    });

    // 6c. Massive Smoke Columns (6 Billowing Plumes rising into the atmosphere)
    this.doomsdaySmokePlumes = [];
    const plumeCoords = [
      { x: -120, z: -330, baseR: 12, topR: 32, h: 120, speed: 0.15 },
      { x: -170, z: -480, baseR: 16, topR: 44, h: 145, speed: 0.12 },
      { x: -60, z: -440, baseR: 10, topR: 28, h: 110, speed: 0.18 },
      { x: 95, z: -320, baseR: 14, topR: 36, h: 130, speed: 0.14 },
      { x: 165, z: -460, baseR: 18, topR: 48, h: 150, speed: 0.11 },
      { x: 50, z: -530, baseR: 20, topR: 52, h: 160, speed: 0.10 }
    ];

    plumeCoords.forEach((coord) => {
      const plumeGroup = new THREE.Group();
      plumeGroup.position.set(coord.x, 0, coord.z);
      plumeGroup.userData = { speed: coord.speed, baseY: 0, rotSpeed: (Math.random() - 0.5) * 0.05 };

      // Stacked low-poly conical billows for volumetric appearance
      const segments = 4;
      for (let s = 0; s < segments; s++) {
        const segH = coord.h / segments;
        const r1 = THREE.MathUtils.lerp(coord.baseR, coord.topR, s / segments);
        const r2 = THREE.MathUtils.lerp(coord.baseR, coord.topR, (s + 1) / segments);
        const billowGeo = new THREE.CylinderGeometry(r2, r1, segH * 1.1, 7, 1);
        const billow = new THREE.Mesh(billowGeo, doomsdaySmokeMat);
        billow.position.y = (s + 0.5) * segH;
        billow.rotation.y = (s * Math.PI) / 3;
        plumeGroup.add(billow);
      }

      this.doomsdaySmokePlumes.push(plumeGroup);
      this.doomsdaySkyline!.add(plumeGroup);
    });

    // 6d. High-Altitude Atmospheric Re-entry / Meteor Streaks
    this.doomsdayMeteorStreaks = [];
    const meteorSpecs = [
      { x: -90, y: 135, z: -360, len: 45, rotZ: -0.42, rotX: 0.15 },
      { x: 45, y: 148, z: -420, len: 60, rotZ: -0.36, rotX: 0.10 },
      { x: -160, y: 125, z: -480, len: 40, rotZ: -0.48, rotX: 0.20 },
      { x: 130, y: 140, z: -510, len: 50, rotZ: -0.38, rotX: 0.12 }
    ];

    meteorSpecs.forEach((spec) => {
      const meteorGeo = new THREE.CylinderGeometry(0.35, 1.8, spec.len, 5);
      const meteorMat = new THREE.MeshBasicMaterial({ color: 0xffedd5, fog: false });
      const meteor = new THREE.Mesh(meteorGeo, meteorMat);
      meteor.position.set(spec.x, spec.y, spec.z);
      meteor.rotation.set(spec.rotX, 0, spec.rotZ);
      meteor.userData = { vx: -8.0, vy: -3.2, startX: spec.x, startY: spec.y };

      // Fiery ionization tail
      const tailGeo = new THREE.CylinderGeometry(0.1, 1.4, spec.len * 0.7, 4);
      const tail = new THREE.Mesh(tailGeo, doomsdayAmberMat);
      tail.position.y = spec.len * 0.5;
      meteor.add(tail);

      this.doomsdayMeteorStreaks.push(meteor);
      this.doomsdaySkyline!.add(meteor);
    });

    // 6e. Distant Collapsed Suspension Bridge Corridor
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, 0, -440);

    // Twin shattered suspension towers (X = -65, +65)
    [-65, 65].forEach((bx) => {
      const towerH = 105;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(10, towerH, 12), doomsdaySootMat);
      tower.position.set(bx, towerH * 0.5, 0);
      tower.rotation.z = bx < 0 ? -0.06 : 0.08;
      bridgeGroup.add(tower);

      // Snapped suspension cables dangling downward
      const cableGeo = new THREE.CylinderGeometry(0.3, 0.3, 45, 4);
      const cable = new THREE.Mesh(cableGeo, doomsdayCharcoalMat);
      cable.position.set(bx + (bx < 0 ? 12 : -12), 48, 0);
      cable.rotation.z = bx < 0 ? -0.38 : 0.42;
      bridgeGroup.add(cable);
    });

    // Molten lava trench beneath the collapsed span
    const lavaTrench = new THREE.Mesh(new THREE.PlaneGeometry(160, 45), doomsdayLavaMat);
    lavaTrench.rotation.x = -Math.PI / 2;
    lavaTrench.position.set(0, 1.0, 0);
    bridgeGroup.add(lavaTrench);

    this.doomsdaySkyline.add(bridgeGroup);
    group.add(this.doomsdaySkyline);

    // =========================================================================
    // 6. PHANTOM LINE SKYLINE: Derelict Subterranean Catacombs, Gliding Ghost
    //    Train, Ectoplasmic Vapor Motes & Motionless Watcher Silhouettes
    // =========================================================================
    this.phantomFlickerLamps = [];
    const phantomSkyline = new THREE.Group();
    this.phantomSkyline = phantomSkyline;
    this.phantomSkylineMaterial = this.skylineMaterial.clone();
    this.phantomSkylineMaterial.color.setHex(0x071520);
    this.phantomSkylineMaterial.transparent = true;
    this.phantomSkylineMaterial.opacity = 0.85;

    const phantomMat = this.phantomSkylineMaterial;
    const ghostTrainMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.38
    });
    const phantomGlowMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee
    });

    // Subterranean Catacomb Archway Monoliths & Derelict Gallery Vaults (Z in [-220, -540])
    const archRng = new SeededRandom(666);
    for (let i = 0; i < 16; i++) {
      const archGroup = new THREE.Group();
      const side = (i % 2 === 0) ? -1 : 1;
      const ax = side * (55.0 + (i % 4) * 18.0);
      const az = -220.0 - i * 20.0;
      const ah = 48.0 + (i % 3) * 14.0;
      archGroup.position.set(ax, 0, az);

      // Massive catacomb pillar
      const pillarGeo = new THREE.BoxGeometry(10.0, ah, 12.0);
      const pillar = new THREE.Mesh(pillarGeo, phantomMat);
      pillar.position.y = ah * 0.5;
      archGroup.add(pillar);

      // Transverse vaulted ceiling rib
      const ribGeo = new THREE.BoxGeometry(28.0, 4.5, 6.0);
      const rib = new THREE.Mesh(ribGeo, phantomMat);
      rib.position.set(-side * 10.0, ah - 2.0, 0);
      rib.rotation.z = side * 0.12;
      archGroup.add(rib);

      // Distant flickering gas / cold fluorescent fixture on pillar
      if (i % 3 === 0) {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.8), phantomGlowMat);
        lamp.position.set(-side * 5.2, ah * 0.45, 6.1);
        archGroup.add(lamp);
        this.phantomFlickerLamps.push(lamp);
      }

      // Motionless watcher silhouette standing on high gallery ledge
      if (i === 3 || i === 7 || i === 11) {
        const watcher = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 4.2, 6), phantomMat);
        watcher.position.set(-side * 4.5, ah * 0.52 + 2.1, 5.0);
        archGroup.add(watcher);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), phantomMat);
        head.position.set(-side * 4.5, ah * 0.52 + 4.6, 5.0);
        archGroup.add(head);
      }

      this.phantomSkyline.add(archGroup);
    }

    // Distant Parallel Disused Railway Viaduct with Gliding Ghost Train
    const ghostTrackGroup = new THREE.Group();
    const ghostTrackX = -42.0;
    const ghostTrackY = 14.0;
    const ghostTrackLen = 420.0;
    const trackBedGeo = new THREE.BoxGeometry(6.5, 1.8, ghostTrackLen);
    const trackBed = new THREE.Mesh(trackBedGeo, phantomMat);
    trackBed.position.set(ghostTrackX, ghostTrackY, -320.0);
    ghostTrackGroup.add(trackBed);

    // Silent Gliding Ghost Train (Cab + 2 Carriages)
    const ghostTrain = new THREE.Group();
    ghostTrain.position.set(ghostTrackX, ghostTrackY + 2.2, -260.0);

    // Locomotive Cab
    const cabGeo = new THREE.BoxGeometry(3.2, 3.4, 14.0);
    const cab = new THREE.Mesh(cabGeo, ghostTrainMat);
    ghostTrain.add(cab);

    // Glowing spectral window strips on cab
    const winGeo = new THREE.BoxGeometry(3.24, 0.9, 11.5);
    const cabWin = new THREE.Mesh(winGeo, phantomGlowMat);
    cabWin.position.y = 0.4;
    ghostTrain.add(cabWin);

    // Two trailing carriages
    [-15.5, -31.0].forEach((offZ) => {
      const carGeo = new THREE.BoxGeometry(3.0, 3.2, 13.5);
      const car = new THREE.Mesh(carGeo, ghostTrainMat);
      car.position.z = offZ;
      ghostTrain.add(car);

      const cWin = new THREE.Mesh(new THREE.BoxGeometry(3.04, 0.85, 11.0), phantomGlowMat);
      cWin.position.set(0, 0.35, offZ);
      ghostTrain.add(cWin);
    });

    ghostTrackGroup.add(ghostTrain);
    this.phantomGhostTrain = ghostTrain;
    this.phantomSkyline.add(ghostTrackGroup);

    // 300 Floating Ectoplasmic Motes & Spectral Vapor Particles
    const ectoCount = 300;
    const ectoGeo = new THREE.BufferGeometry();
    const ectoPositions = new Float32Array(ectoCount * 3);
    const ectoColors = new Float32Array(ectoCount * 3);
    const ectoRng = new SeededRandom(777);

    for (let i = 0; i < ectoCount; i++) {
      ectoPositions[i * 3 + 0] = ectoRng.range(-90, 90);
      ectoPositions[i * 3 + 1] = ectoRng.range(2, 52);
      ectoPositions[i * 3 + 2] = ectoRng.range(-80, -380);

      // Vertex color variation: cold cyan to pale mint jade to ghostly white
      const cRoll = ectoRng.range(0, 1);
      if (cRoll < 0.55) {
        // Pale cyan (0x67e8f9)
        ectoColors[i * 3 + 0] = 0.40;
        ectoColors[i * 3 + 1] = 0.91;
        ectoColors[i * 3 + 2] = 0.97;
      } else if (cRoll < 0.85) {
        // Mint jade (0x34d399)
        ectoColors[i * 3 + 0] = 0.20;
        ectoColors[i * 3 + 1] = 0.83;
        ectoColors[i * 3 + 2] = 0.60;
      } else {
        // Dim ghostly white (0xe2e8f0)
        ectoColors[i * 3 + 0] = 0.88;
        ectoColors[i * 3 + 1] = 0.91;
        ectoColors[i * 3 + 2] = 0.94;
      }
    }

    ectoGeo.setAttribute('position', new THREE.BufferAttribute(ectoPositions, 3));
    ectoGeo.setAttribute('color', new THREE.BufferAttribute(ectoColors, 3));
    this.phantomEctoParticlesGeo = ectoGeo;
    this.phantomEctoParticlesPos = ectoPositions;

    const ectoMat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.65
    });
    const ectoPoints = new THREE.Points(ectoGeo, ectoMat);
    this.phantomSkyline.add(ectoPoints);

    group.add(this.phantomSkyline);

    // =========================================================================
    // 7. HAUNTED CARNIVAL SKYLINE: Rotating Haunted Ferris Wheel, Gothic Castle
    //    Spires, Giant Harvest Moon & Animated Flying Bat Silhouettes
    // =========================================================================
    this.hauntedFerrisGondolas = [];
    this.hauntedAnimatedBats = [];
    const carnivalSkyline = new THREE.Group();
    this.hauntedCarnivalSkyline = carnivalSkyline;
    this.hauntedCarnivalSkylineMaterial = this.skylineMaterial.clone();
    this.hauntedCarnivalSkylineMaterial.color.setHex(0x1a0b2e);
    this.hauntedCarnivalSkylineMaterial.transparent = true;
    this.hauntedCarnivalSkylineMaterial.opacity = 0.88;

    const carnivalMat = this.hauntedCarnivalSkylineMaterial;
    const carnivalGlowAmber = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const carnivalGlowViolet = new THREE.MeshBasicMaterial({ color: 0xc084fc });
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    // 7a. Giant Rotating Haunted Ferris Wheel (X = 72, Y = 60, Z = -430)
    const ferrisGroup = new THREE.Group();
    ferrisGroup.position.set(72, 60, -430);

    // Static A-frame support stanchions
    const legGeo = new THREE.BoxGeometry(2.5, 66.0, 2.5);
    [-14.0, 14.0].forEach((lx) => {
      const leg = new THREE.Mesh(legGeo, carnivalMat);
      leg.position.set(lx, -30.0, 0);
      leg.rotation.z = lx < 0 ? -0.22 : 0.22;
      carnivalSkyline.add(leg);
    });

    // Central axle hub
    const hubMesh = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 4.0, 16), carnivalMat);
    hubMesh.rotation.x = Math.PI / 2;
    hubMesh.position.set(72, 60, -429);
    carnivalSkyline.add(hubMesh);

    // Rotating Wheel Structure
    const wheelRotGroup = new THREE.Group();
    this.hauntedFerrisWheel = wheelRotGroup;

    // Outer & inner rim rings (polygonal cylinders with open ends or boxes)
    const rimCount = 24;
    const wheelR = 36.0;
    const innerR = 24.0;
    const segLen = (2 * Math.PI * wheelR) / rimCount;
    const innerSegLen = (2 * Math.PI * innerR) / rimCount;

    for (let i = 0; i < rimCount; i++) {
      const theta = (i / rimCount) * Math.PI * 2;
      // Outer rim chord
      const outerSeg = new THREE.Mesh(new THREE.BoxGeometry(segLen * 1.05, 1.2, 1.2), carnivalMat);
      outerSeg.position.set(Math.cos(theta) * wheelR, Math.sin(theta) * wheelR, 0);
      outerSeg.rotation.z = theta + Math.PI / 2;
      wheelRotGroup.add(outerSeg);

      // Inner rim chord
      const innerSeg = new THREE.Mesh(new THREE.BoxGeometry(innerSegLen * 1.05, 0.8, 0.8), carnivalMat);
      innerSeg.position.set(Math.cos(theta) * innerR, Math.sin(theta) * innerR, 0);
      innerSeg.rotation.z = theta + Math.PI / 2;
      wheelRotGroup.add(innerSeg);
    }

    // 12 Spokes & 12 Hanging Passenger Gondolas
    const spokeCount = 12;
    const spokeGeo = new THREE.BoxGeometry(0.8, wheelR, 0.8);
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;

      // Spoke strut
      const spoke = new THREE.Mesh(spokeGeo, carnivalMat);
      spoke.position.set(Math.cos(angle) * (wheelR * 0.5), Math.sin(angle) * (wheelR * 0.5), 0);
      spoke.rotation.z = angle - Math.PI / 2;
      wheelRotGroup.add(spoke);

      // Hanging Gondola cabin
      const gondola = new THREE.Group();
      gondola.position.set(Math.cos(angle) * wheelR, Math.sin(angle) * wheelR, 0);

      // Cabin body
      const cabinGeo = new THREE.BoxGeometry(4.0, 3.6, 3.2);
      const cabin = new THREE.Mesh(cabinGeo, carnivalMat);
      gondola.add(cabin);

      // Glowing amber passenger window slit
      const winGeo = new THREE.BoxGeometry(3.2, 1.2, 3.3);
      const win = new THREE.Mesh(winGeo, carnivalGlowAmber);
      gondola.add(win);

      // Top decorative roof crest
      const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.6, 6), carnivalGlowViolet);
      roofMesh.position.y = 2.4;
      gondola.add(roofMesh);

      wheelRotGroup.add(gondola);
      this.hauntedFerrisGondolas.push(gondola as any);
    }

    ferrisGroup.add(wheelRotGroup);
    carnivalSkyline.add(ferrisGroup);

    // 7b. Monumental Gothic Dracula Castles & Spire Mansions (Left & Right Flanks)
    const castleGroup = new THREE.Group();
    // Central Main Castle Keep (X = -90, Z = -460)
    const keepH = 92.0;
    const keep = new THREE.Mesh(new THREE.BoxGeometry(30.0, keepH, 26.0), carnivalMat);
    keep.position.set(-90.0, keepH * 0.5, -460.0);
    castleGroup.add(keep);

    // Jagged crenelated battlements atop keep
    const battlement = new THREE.Mesh(new THREE.BoxGeometry(32.0, 4.0, 28.0), carnivalMat);
    battlement.position.set(-90.0, keepH + 2.0, -460.0);
    castleGroup.add(battlement);

    // Soaring Central Spire
    const spire = new THREE.Mesh(new THREE.ConeGeometry(8.5, 42.0, 8), carnivalMat);
    spire.position.set(-90.0, keepH + 23.0, -460.0);
    castleGroup.add(spire);

    // Glowing arched windows on castle keep
    [-6.0, 6.0].forEach((wx) => {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 8.0), carnivalGlowAmber);
      win.position.set(-90.0 + wx, 45.0, -446.5);
      castleGroup.add(win);
    });

    // Twin Flanking Gothic Turrets with Pointed Conical Roofs
    [-112.0, -68.0].forEach((tx) => {
      const turrH = 104.0;
      const turret = new THREE.Mesh(new THREE.CylinderGeometry(5.0, 6.5, turrH, 8), carnivalMat);
      turret.position.set(tx, turrH * 0.5, -450.0);
      castleGroup.add(turret);

      const turrRoof = new THREE.Mesh(new THREE.ConeGeometry(6.5, 26.0, 8), carnivalMat);
      turrRoof.position.set(tx, turrH + 13.0, -450.0);
      castleGroup.add(turrRoof);
    });

    // Right Flank Haunted Victorian Manor & Twisted Spire (X = 145, Z = -470)
    const manorH = 68.0;
    const manor = new THREE.Mesh(new THREE.BoxGeometry(34.0, manorH, 22.0), carnivalMat);
    manor.position.set(145.0, manorH * 0.5, -470.0);
    castleGroup.add(manor);

    const manorSpire = new THREE.Mesh(new THREE.ConeGeometry(5.5, 28.0, 6), carnivalMat);
    manorSpire.position.set(145.0, manorH + 14.0, -470.0);
    castleGroup.add(manorSpire);

    // Illuminated manor attic window
    const manorWin = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 7.0), carnivalGlowAmber);
    manorWin.position.set(145.0, manorH - 8.0, -458.5);
    castleGroup.add(manorWin);

    carnivalSkyline.add(castleGroup);

    // 7c. Giant Glowing Harvest Moon (X = -45, Y = 118, Z = -580)
    const moonMesh = new THREE.Mesh(new THREE.CircleGeometry(32.0, 32), moonMat);
    moonMesh.position.set(-45.0, 118.0, -580.0);
    carnivalSkyline.add(moonMesh);

    // Soft outer moon corona halo
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.22
    });
    const coronaMesh = new THREE.Mesh(new THREE.CircleGeometry(42.0, 32), coronaMat);
    coronaMesh.position.set(-45.0, 118.0, -581.0);
    carnivalSkyline.add(coronaMesh);

    // 7d. Animated Flying Bat Silhouettes (6 bats flapping across the sky)
    const batGeoBody = new THREE.BoxGeometry(0.7, 0.4, 1.2);
    const batWingGeo = new THREE.BoxGeometry(1.6, 0.1, 0.9);
    for (let b = 0; b < 6; b++) {
      const batGroup = new THREE.Group();
      const bx = -50.0 + (b % 3) * 55.0 + Math.sin(b * 1.5) * 20.0;
      const by = 42.0 + (b % 4) * 12.0;
      const bz = -220.0 - b * 32.0;
      batGroup.position.set(bx, by, bz);

      const body = new THREE.Mesh(batGeoBody, carnivalMat);
      batGroup.add(body);

      const leftWing = new THREE.Mesh(batWingGeo, carnivalMat);
      leftWing.position.set(-1.0, 0, 0);
      batGroup.add(leftWing);

      const rightWing = new THREE.Mesh(batWingGeo, carnivalMat);
      rightWing.position.set(1.0, 0, 0);
      batGroup.add(rightWing);

      carnivalSkyline.add(batGroup);
      this.hauntedAnimatedBats.push(batGroup);
    }

    group.add(this.hauntedCarnivalSkyline);

    // 8. Monumental Civic Secretariat Domed Palace & Searchlights (VIP Express: The Great Inauguration)
    this.vipSearchlights = [];
    const vipSkyline = new THREE.Group();
    this.vipExpressSkyline = vipSkyline;
    this.vipExpressSkylineMaterial = this.skylineMaterial.clone();
    this.vipExpressSkylineMaterial.color.setHex(0xd4a373);
    this.vipExpressSkylineMaterial.transparent = true;
    this.vipExpressSkylineMaterial.opacity = 0.88;

    const vipMat = this.vipExpressSkylineMaterial;
    const goldMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Distant Secretariat Palace Architecture (Z = -440m)
    // Flanking ceremonial palace wings with open central vista above track
    const palaceGroup = new THREE.Group();
    palaceGroup.position.set(0, 0, -440.0);

    // Left and right monumental wings with colonnaded openings
    [-85.0, 85.0].forEach((wx) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(60.0, 36.0, 35.0), vipMat);
      wing.position.set(wx, 18.0, 0);
      palaceGroup.add(wing);

      const wingDome = new THREE.Mesh(new THREE.SphereGeometry(14.0, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), goldMat);
      wingDome.position.set(wx, 36.0, 0);
      palaceGroup.add(wingDome);
    });

    // Elevated Central Ceremonial Arch bridging high above the track
    const centralArchL = new THREE.Mesh(new THREE.BoxGeometry(16.0, 42.0, 24.0), vipMat);
    centralArchL.position.set(-24.0, 21.0, 0);
    palaceGroup.add(centralArchL);

    const centralArchR = new THREE.Mesh(new THREE.BoxGeometry(16.0, 42.0, 24.0), vipMat);
    centralArchR.position.set(24.0, 21.0, 0);
    palaceGroup.add(centralArchR);

    const archLintel = new THREE.Mesh(new THREE.BoxGeometry(64.0, 10.0, 26.0), vipMat);
    archLintel.position.set(0, 47.0, 0);
    palaceGroup.add(archLintel);

    // Central Grand Dome crowning high above the central arch
    const vipDomeGeo = new THREE.SphereGeometry(22.0, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const mainDome = new THREE.Mesh(vipDomeGeo, goldMat);
    mainDome.position.set(0, 52.0, 0);
    palaceGroup.add(mainDome);

    // Golden Kalash Spire
    const spireGeo = new THREE.ConeGeometry(3.5, 18.0, 8);
    const vipSpire = new THREE.Mesh(spireGeo, goldMat);
    vipSpire.position.set(0, 83.0, 0);
    palaceGroup.add(vipSpire);

    vipSkyline.add(palaceGroup);

    // Monumental Twin Golden Obelisks (height 65m at X = ±85m)
    [-85.0, 85.0].forEach((ox) => {
      const obeliskGeo = new THREE.CylinderGeometry(1.8, 3.8, 65.0, 4);
      obeliskGeo.rotateY(Math.PI / 4);
      const obelisk = new THREE.Mesh(obeliskGeo, goldMat);
      obelisk.position.set(ox, 32.5, -420.0);
      vipSkyline.add(obelisk);
    });

    // 4 Celebration Searchlight Beams swaying gently in the celebratory sky
    const searchlightGeo = new THREE.ConeGeometry(9.0, 150.0, 8);
    searchlightGeo.translate(0, 75.0, 0);
    searchlightGeo.rotateX(Math.PI); // Tip down, wide beam skyward
    const searchlightMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    [-60.0, -20.0, 20.0, 60.0].forEach((lx) => {
      const beam = new THREE.Mesh(searchlightGeo, searchlightMat);
      beam.position.set(lx, 24.0, -430.0);
      vipSkyline.add(beam);
      this.vipSearchlights.push(beam);
    });

    // Celebratory Tricolor Floating Confetti Particles
    const confettiCount = 120;
    const confettiGeo = new THREE.BufferGeometry();
    const confettiPositions = new Float32Array(confettiCount * 3);
    const confettiColors = new Float32Array(confettiCount * 3);
    const colors = [
      [1.0, 0.47, 0.0],  // Saffron
      [1.0, 1.0, 1.0],   // White
      [0.07, 0.53, 0.03], // Green
      [0.96, 0.62, 0.04]  // Gold
    ];

    for (let i = 0; i < confettiCount; i++) {
      confettiPositions[i * 3] = (Math.random() - 0.5) * 160.0;
      confettiPositions[i * 3 + 1] = 6.0 + Math.random() * 54.0;
      confettiPositions[i * 3 + 2] = -120.0 - Math.random() * 260.0;

      const c = colors[i % colors.length];
      confettiColors[i * 3] = c[0];
      confettiColors[i * 3 + 1] = c[1];
      confettiColors[i * 3 + 2] = c[2];
    }

    confettiGeo.setAttribute('position', new THREE.BufferAttribute(confettiPositions, 3));
    confettiGeo.setAttribute('color', new THREE.BufferAttribute(confettiColors, 3));
    this.vipConfettiGeo = confettiGeo;
    this.vipConfettiPos = confettiPositions;

    const confettiMat = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });
    const confettiPoints = new THREE.Points(confettiGeo, confettiMat);
    vipSkyline.add(confettiPoints);

    group.add(this.vipExpressSkyline);

    // 9. Art Deco Metropolis Skyline & Searchlights (Midnight Velvet: After Dark)
    this.midnightSkylineSearchlights = [];
    const velvetSkyline = new THREE.Group();
    this.midnightVelvetSkyline = velvetSkyline;
    this.midnightVelvetSkylineMaterial = this.skylineMaterial.clone();
    this.midnightVelvetSkylineMaterial.color.setHex(0x0f0b1a);
    this.midnightVelvetSkylineMaterial.transparent = true;
    this.midnightVelvetSkylineMaterial.opacity = 0.88;

    const velvetMat = this.midnightVelvetSkylineMaterial;
    const goldSpireMat = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
    const warmWindowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.65 });

    // Ring of 24 Stepped-Back Art Deco Skyscrapers around the horizon (dist = 330m)
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const dist = 330;

      const towerGroup = new THREE.Group();
      towerGroup.position.set(
        Math.cos(angle) * dist,
        -10,
        Math.sin(angle) * dist
      );

      // Art Deco Step-back heights and tiers
      const baseH = 70 + (i % 5) * 16;
      const baseW = 24 + (i % 3) * 6;
      const baseMesh = new THREE.Mesh(towerGeo, velvetMat);
      baseMesh.scale.set(baseW, baseH, baseW);
      baseMesh.position.y = baseH * 0.5;
      towerGroup.add(baseMesh);

      // Glowing warm window grids on facade facing tracks
      const winMesh = new THREE.Mesh(new THREE.PlaneGeometry(baseW * 0.75, baseH * 0.70), warmWindowMat);
      winMesh.position.set(0, baseH * 0.5, baseW * 0.52);
      winMesh.rotation.y = Math.PI;
      towerGroup.add(winMesh);

      // Stepped tier 1
      const tier1H = baseH * 0.45;
      const tier1W = baseW * 0.68;
      const tier1Mesh = new THREE.Mesh(towerGeo, velvetMat);
      tier1Mesh.scale.set(tier1W, tier1H, tier1W);
      tier1Mesh.position.y = baseH + tier1H * 0.5;
      towerGroup.add(tier1Mesh);

      // Stepped tier 2
      const tier2H = tier1H * 0.55;
      const tier2W = tier1W * 0.62;
      const tier2Mesh = new THREE.Mesh(towerGeo, velvetMat);
      tier2Mesh.scale.set(tier2W, tier2H, tier2W);
      tier2Mesh.position.y = baseH + tier1H + tier2H * 0.5;
      towerGroup.add(tier2Mesh);

      // Crown Spire with gilded needle
      const spireH = 22 + (i % 4) * 8;
      const spireMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 1.2, spireH, 6), goldSpireMat);
      spireMesh.position.y = baseH + tier1H + tier2H + spireH * 0.5;
      towerGroup.add(spireMesh);

      velvetSkyline.add(towerGroup);
    }

    // Horizon Sweeping Nightclub Searchlights (2 pairs cutting through violet twilight)
    const velvetSearchlightGeo = new THREE.CylinderGeometry(0.6, 7.5, 95.0, 10);
    velvetSearchlightGeo.translate(0, 47.5, 0);
    const velvetSearchlightMat = new THREE.MeshBasicMaterial({
      color: 0xffeedd,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    [-110.0, -45.0, 45.0, 110.0].forEach((lx) => {
      const beam = new THREE.Mesh(velvetSearchlightGeo, velvetSearchlightMat);
      beam.position.set(lx, 20.0, -380.0);
      velvetSkyline.add(beam);
      this.midnightSkylineSearchlights.push(beam);
    });

    group.add(this.midnightVelvetSkyline);

    // 10. Primordial Volcanic Peaks & Misty Jungle Mountain Horizon (Jurassic Rush: The Lost World)
    this.jurassicPterosaurFlocks = [];
    const jurassicSkyline = new THREE.Group();
    this.jurassicSkyline = jurassicSkyline;
    this.jurassicSkylineMaterial = this.skylineMaterial.clone();
    this.jurassicSkylineMaterial.color.setHex(0x164e3b);
    this.jurassicSkylineMaterial.transparent = true;
    this.jurassicSkylineMaterial.opacity = 0.88;

    const jurassicMat = this.jurassicSkylineMaterial;
    const volcanicRockMat = jurassicMat;
    const magmaGlowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.75 });
    const pterosaurWingMat = new THREE.MeshBasicMaterial({ color: 0x064e3b });

    // Ring of 18 Primordial Mountain Ridges & Sprawling Volcanoes around the horizon (dist = 335m)
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const dist = 335;

      const peakGroup = new THREE.Group();
      peakGroup.position.set(
        Math.cos(angle) * dist,
        -18,
        Math.sin(angle) * dist
      );

      // Sprawling Majestic Ancient Mountain Ridge (broad volcanic shield slope)
      const coneH = 38 + (i % 5) * 8;
      const coneR = 85 + (i % 3) * 18;
      const coneGeo = new THREE.CylinderGeometry(coneR * 0.18, coneR, coneH, 10);
      const coneMesh = new THREE.Mesh(coneGeo, volcanicRockMat);
      coneMesh.position.y = coneH * 0.5;
      peakGroup.add(coneMesh);

      // Glowing Magma Summit Caldera on key volcanic peaks
      if (i % 3 === 0) {
        const craterRim = new THREE.Mesh(new THREE.CylinderGeometry(coneR * 0.20, coneR * 0.26, 4.0, 10), volcanicRockMat);
        craterRim.position.y = coneH - 0.5;
        peakGroup.add(craterRim);

        const magmaGlow = new THREE.Mesh(new THREE.CylinderGeometry(coneR * 0.16, coneR * 0.16, 1.8, 10), magmaGlowMat);
        magmaGlow.position.y = coneH + 0.2;
        peakGroup.add(magmaGlow);
      }

      // Flanking Craggy Foothills & Jungle Ridges
      const ridgeH = coneH * 0.55;
      const ridgeW = coneR * 0.75;
      const ridgeMesh = new THREE.Mesh(new THREE.CylinderGeometry(ridgeW * 0.20, ridgeW, ridgeH, 8), jurassicMat);
      ridgeMesh.position.set(coneR * 0.55, ridgeH * 0.5, 0);
      peakGroup.add(ridgeMesh);

      const ridgeMesh2 = new THREE.Mesh(new THREE.CylinderGeometry(ridgeW * 0.18, ridgeW * 0.85, ridgeH * 0.75, 8), jurassicMat);
      ridgeMesh2.position.set(-coneR * 0.55, ridgeH * 0.38, 0);
      peakGroup.add(ridgeMesh2);

      // Distant Sauropod silhouette walking on foothills
      if (i % 4 === 1) {
        const distantDino = new THREE.Group();
        distantDino.position.set(coneR * 0.4, 8.0, 10.0);

        const dTorso = new THREE.Mesh(new THREE.BoxGeometry(7, 6, 12), jurassicMat);
        dTorso.position.y = 8;
        distantDino.add(dTorso);

        const dNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 16, 6), jurassicMat);
        dNeck.position.set(0, 16, -5);
        dNeck.rotation.x = -0.4;
        distantDino.add(dNeck);

        const dTail = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.2, 14, 6), jurassicMat);
        dTail.position.set(0, 8, 7);
        dTail.rotation.x = 1.3;
        distantDino.add(dTail);

        [-2.0, 2.0].forEach(lx => {
          [-4.0, 4.0].forEach(lz => {
            const dLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 9, 6), jurassicMat);
            dLeg.position.set(lx, 4.5, lz);
            distantDino.add(dLeg);
          });
        });

        peakGroup.add(distantDino);
      }

      jurassicSkyline.add(peakGroup);
    }

    // Horizon Pterosaur Flocks Soaring in the Prehistoric Sky
    const flockCoords = [
      { x: -95, y: 52, z: -320 },
      { x: 75, y: 58, z: -330 },
      { x: -35, y: 44, z: -310 },
      { x: 120, y: 48, z: -340 }
    ];

    flockCoords.forEach((fc, idx) => {
      const pterGroup = new THREE.Group();
      pterGroup.position.set(fc.x, fc.y, fc.z);

      const pBody = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.2, 5), pterosaurWingMat);
      pBody.rotation.x = Math.PI / 2;
      pterGroup.add(pBody);

      const pLeftWing = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.0), pterosaurWingMat);
      pLeftWing.position.set(-2.8, 0, 0);
      pLeftWing.rotation.x = Math.PI / 2;
      pterGroup.add(pLeftWing);

      const pRightWing = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.0), pterosaurWingMat);
      pRightWing.position.set(2.8, 0, 0);
      pRightWing.rotation.x = Math.PI / 2;
      pterGroup.add(pRightWing);

      jurassicSkyline.add(pterGroup);
      this.jurassicPterosaurFlocks.push({
        group: pterGroup,
        leftWing: pLeftWing,
        rightWing: pRightWing,
        phase: idx * 1.3,
        basePos: new THREE.Vector3(fc.x, fc.y, fc.z)
      });
    });

    group.add(this.jurassicSkyline);

    // =========================================================================
    // 11. INFERNO EXPRESS: Ring of 18 Active Colossal Volcanoes, Glowing Calderas,
    //     Molten Magma Cataracts, Spewing Ash Plumes & Basalt Spire Citadels
    // =========================================================================
    this.infernoSkylineVolcanoes = [];
    const infernoSkyline = new THREE.Group();
    this.infernoSkyline = infernoSkyline;
    this.infernoSkylineMaterial = this.skylineMaterial.clone();
    this.infernoSkylineMaterial.color.setHex(0x180806);
    this.infernoSkylineMaterial.transparent = true;
    this.infernoSkylineMaterial.opacity = 0.88;

    const basaltMat = this.infernoSkylineMaterial;
    const calderaMat = new THREE.MeshBasicMaterial({ color: 0x1f0a08 });
    const infernoMagmaGlowMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.90 });
    const innerCoreMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const lavaVeinMat = new THREE.MeshBasicMaterial({ color: 0xea580c });
    const ashPlumeMat = new THREE.MeshBasicMaterial({ color: 0x271714, transparent: true, opacity: 0.70 });

    // Ring of 18 Primordial Active Volcanoes around the horizon (dist = 335m)
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const dist = 335;

      const peakGroup = new THREE.Group();
      peakGroup.position.set(
        Math.cos(angle) * dist,
        -15,
        Math.sin(angle) * dist
      );

      // Broad Volcanic Shield Mountain (sweeping base, dramatic caldera)
      const coneH = 44 + (i % 5) * 10;
      const coneR = 88 + (i % 4) * 16;
      const coneGeo = new THREE.CylinderGeometry(coneR * 0.18, coneR, coneH, 10);
      const coneMesh = new THREE.Mesh(coneGeo, calderaMat);
      coneMesh.position.y = coneH * 0.5;
      peakGroup.add(coneMesh);

      // Summit Caldera Crater Rim
      const rimGeo = new THREE.CylinderGeometry(coneR * 0.20, coneR * 0.26, 4.0, 10);
      const craterRim = new THREE.Mesh(rimGeo, basaltMat);
      craterRim.position.y = coneH - 0.5;
      peakGroup.add(craterRim);

      // Incandescent Glowing Magma Caldera Lake
      const magmaGeo = new THREE.CylinderGeometry(coneR * 0.16, coneR * 0.16, 1.8, 10);
      const magmaGlow = new THREE.Mesh(magmaGeo, infernoMagmaGlowMat);
      magmaGlow.position.y = coneH + 0.2;
      peakGroup.add(magmaGlow);

      // White-hot center core
      const coreGeo = new THREE.CylinderGeometry(coneR * 0.08, coneR * 0.08, 2.0, 10);
      const core = new THREE.Mesh(coreGeo, innerCoreMat);
      core.position.y = coneH + 0.4;
      peakGroup.add(core);

      // Cascading Molten Magma River streaming down the volcano slope
      const riverW = 4.5 + (i % 3) * 2.0;
      const riverGeo = new THREE.BoxGeometry(riverW, coneH * 0.70, 1.5);
      const river = new THREE.Mesh(riverGeo, lavaVeinMat);
      river.position.set(0, coneH * 0.45, coneR * 0.52);
      river.rotation.x = 0.58;
      peakGroup.add(river);

      // Flanking Craggy Basalt Foothills & Molten Ridges
      const footH = coneH * 0.52;
      const footW = coneR * 0.75;
      const footMesh = new THREE.Mesh(new THREE.CylinderGeometry(footW * 0.20, footW, footH, 8), calderaMat);
      footMesh.position.set(coneR * 0.55, footH * 0.5, 0);
      peakGroup.add(footMesh);

      const footMesh2 = new THREE.Mesh(new THREE.CylinderGeometry(footW * 0.18, footW * 0.85, footH * 0.70, 8), calderaMat);
      footMesh2.position.set(-coneR * 0.55, footH * 0.35, 0);
      peakGroup.add(footMesh2);

      // Billowing Volcanic Ash & Smoke Plume
      const plumeR = 12.0 + (i % 3) * 4.0;
      const plumeGeo = new THREE.SphereGeometry(plumeR, 8, 8);
      const plume = new THREE.Mesh(plumeGeo, ashPlumeMat);
      plume.position.set(0, coneH + plumeR * 0.85, 0);
      plume.userData = { baseY: coneH + plumeR * 0.85 };
      peakGroup.add(plume);

      this.infernoSkylineVolcanoes.push({
        craterGlow: magmaGlow,
        plume,
        phase: i * 0.85
      });

      // Flanking Jagged Basalt Outer Ridges
      const outerRidgeH = coneH * 0.45;
      const outerRidgeW = coneR * 0.70;
      const outerRidgeMesh1 = new THREE.Mesh(new THREE.ConeGeometry(outerRidgeW, outerRidgeH, 5), basaltMat);
      outerRidgeMesh1.position.set(coneR * 0.65, outerRidgeH * 0.5, 0);
      peakGroup.add(outerRidgeMesh1);

      const outerRidgeMesh2 = new THREE.Mesh(new THREE.ConeGeometry(outerRidgeW * 0.8, outerRidgeH * 0.8, 5), basaltMat);
      outerRidgeMesh2.position.set(-coneR * 0.65, outerRidgeH * 0.4, 0);
      peakGroup.add(outerRidgeMesh2);

      // Distant Spired Basalt Citadel Monoliths
      if (i % 3 === 1) {
        const citadelSpire = new THREE.Mesh(new THREE.ConeGeometry(3.5, 32.0, 6), basaltMat);
        citadelSpire.position.set(coneR * 0.45, outerRidgeH + 12.0, 8.0);
        peakGroup.add(citadelSpire);
      }

      infernoSkyline.add(peakGroup);
    }

    group.add(this.infernoSkyline);

    this.modernSkyline.visible = this.currentTheme.id === 'MODERN_METRO' || this.currentTheme.id === 'NEON_INDUSTRIAL';
    this.historicSkyline.visible = this.currentTheme.id === 'HISTORIC_QUARTER';
    this.neonSkyline.visible = this.currentTheme.id === 'NEON_RAINLINE';
    this.orbitalSkyline.visible = this.currentTheme.id === 'ORBITAL_HALO';
    this.abyssalSkyline.visible = this.currentTheme.id === 'ABYSSAL_GLASSLINE';
    this.doomsdaySkyline.visible = this.currentTheme.id === 'DOOMSDAY_LAST_TRANSIT';
    this.phantomSkyline.visible = this.currentTheme.id === 'PHANTOM_LINE';
    this.hauntedCarnivalSkyline.visible = this.currentTheme.id === 'HAUNTED_CARNIVAL';
    this.vipExpressSkyline.visible = this.currentTheme.id === 'VIP_EXPRESS';
    this.midnightVelvetSkyline.visible = this.currentTheme.id === 'MIDNIGHT_VELVET';
    this.jurassicSkyline.visible = this.currentTheme.id === 'JURASSIC_RUSH';
    this.infernoSkyline.visible = this.currentTheme.id === 'INFERNO_EXPRESS';

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
    if (targetTheme.sun.position) {
      this.sunLight.position.x = THREE.MathUtils.lerp(base.sun.position?.x ?? 20, targetTheme.sun.position.x, t);
      this.sunLight.position.y = THREE.MathUtils.lerp(base.sun.position?.y ?? 40, targetTheme.sun.position.y, t);
    }

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

    // 6. Independent skyline materials allow all theme variants to cross-fade.
    const skylineColor = EnvironmentManager.lerpColor(base.skyline.color, targetTheme.skyline.color, t);
    const isModern = (theme: EnvironmentTheme) => theme.id === 'MODERN_METRO' || theme.id === 'NEON_INDUSTRIAL';
    const isNeon = (theme: EnvironmentTheme) => theme.id === 'NEON_RAINLINE';
    const isOrbital = (theme: EnvironmentTheme) => theme.id === 'ORBITAL_HALO';
    const isAbyssal = (theme: EnvironmentTheme) => theme.id === 'ABYSSAL_GLASSLINE';
    const modernOpacity = THREE.MathUtils.lerp(
      isModern(base) ? base.skyline.opacity : 0,
      isModern(targetTheme) ? targetTheme.skyline.opacity : 0,
      t
    );
    const historicOpacity = THREE.MathUtils.lerp(
      base.id === 'HISTORIC_QUARTER' ? base.skyline.opacity : 0,
      targetTheme.id === 'HISTORIC_QUARTER' ? targetTheme.skyline.opacity : 0,
      t
    );
    const neonOpacity = THREE.MathUtils.lerp(
      isNeon(base) ? base.skyline.opacity : 0,
      isNeon(targetTheme) ? targetTheme.skyline.opacity : 0,
      t
    );
    const orbitalOpacity = THREE.MathUtils.lerp(
      isOrbital(base) ? base.skyline.opacity : 0,
      isOrbital(targetTheme) ? targetTheme.skyline.opacity : 0,
      t
    );
    const abyssalOpacity = THREE.MathUtils.lerp(
      isAbyssal(base) ? base.skyline.opacity : 0,
      isAbyssal(targetTheme) ? targetTheme.skyline.opacity : 0,
      t
    );
    const isDoomsday = (env: EnvironmentTheme) => env.id === 'DOOMSDAY_LAST_TRANSIT';
    const doomsdayOpacity = THREE.MathUtils.lerp(
      isDoomsday(base) ? base.skyline.opacity : 0,
      isDoomsday(targetTheme) ? targetTheme.skyline.opacity : 0,
      t
    );
    const isPhantom = (env: EnvironmentTheme) => env.id === 'PHANTOM_LINE';
    const phantomOpacity = THREE.MathUtils.lerp(
      isPhantom(base) ? base.skyline.opacity : 0,
      isPhantom(targetTheme) ? targetTheme.skyline.opacity : 0,
      t
    );
    const isHaunted = (env: EnvironmentTheme) => env.id === 'HAUNTED_CARNIVAL';
    const hauntedOpacity = THREE.MathUtils.lerp(
      isHaunted(base) ? base.skyline.opacity : 0,
      isHaunted(targetTheme) ? targetTheme.skyline.opacity : 0,
      t
    );
    const isVip = (env: EnvironmentTheme) => env.id === 'VIP_EXPRESS';
    const vipOpacity = THREE.MathUtils.lerp(
      isVip(base) ? base.skyline.opacity : 0,
      isVip(targetTheme) ? targetTheme.skyline.opacity : 0,
      t
    );
    const isMidnightVelvet = (env: EnvironmentTheme) => env.id === 'MIDNIGHT_VELVET';
    const midnightVelvetOpacity = THREE.MathUtils.lerp(
      isMidnightVelvet(base) ? base.skyline.opacity : 0,
      isMidnightVelvet(targetTheme) ? targetTheme.skyline.opacity : 0,
      t
    );
    const isJurassic = (env: EnvironmentTheme) => env.id === 'JURASSIC_RUSH';
    const jurassicOpacity = THREE.MathUtils.lerp(
      isJurassic(base) ? base.skyline.opacity : 0,
      isJurassic(targetTheme) ? targetTheme.skyline.opacity : 0,
      t
    );
    const isInferno = (env: EnvironmentTheme) => env.id === 'INFERNO_EXPRESS';
    const infernoOpacity = THREE.MathUtils.lerp(
      isInferno(base) ? base.skyline.opacity : 0,
      isInferno(targetTheme) ? targetTheme.skyline.opacity : 0,
      t
    );
    if (this.skylineMaterial) {
      this.skylineMaterial.color.copy(skylineColor);
      this.skylineMaterial.opacity = modernOpacity;
    }
    if (this.historicSkylineMaterial) {
      this.historicSkylineMaterial.color.copy(skylineColor);
      this.historicSkylineMaterial.opacity = historicOpacity;
    }
    if (this.neonSkylineMaterial) {
      this.neonSkylineMaterial.color.copy(skylineColor);
      this.neonSkylineMaterial.opacity = neonOpacity;
    }
    if (this.orbitalSkylineMaterial) {
      this.orbitalSkylineMaterial.color.copy(skylineColor);
      this.orbitalSkylineMaterial.opacity = orbitalOpacity;
    }
    if (this.abyssalSkylineMaterial) {
      this.abyssalSkylineMaterial.color.copy(skylineColor);
      this.abyssalSkylineMaterial.opacity = abyssalOpacity;
    }
    if (this.doomsdaySkylineMaterial) {
      this.doomsdaySkylineMaterial.color.copy(skylineColor);
      this.doomsdaySkylineMaterial.opacity = doomsdayOpacity;
    }
    if (this.phantomSkylineMaterial) {
      this.phantomSkylineMaterial.color.copy(skylineColor);
      this.phantomSkylineMaterial.opacity = phantomOpacity;
    }
    if (this.hauntedCarnivalSkylineMaterial) {
      this.hauntedCarnivalSkylineMaterial.color.copy(skylineColor);
      this.hauntedCarnivalSkylineMaterial.opacity = hauntedOpacity;
    }
    if (this.vipExpressSkylineMaterial) {
      this.vipExpressSkylineMaterial.color.copy(skylineColor);
      this.vipExpressSkylineMaterial.opacity = vipOpacity;
    }
    if (this.midnightVelvetSkylineMaterial) {
      this.midnightVelvetSkylineMaterial.color.copy(skylineColor);
      this.midnightVelvetSkylineMaterial.opacity = midnightVelvetOpacity;
    }
    if (this.jurassicSkylineMaterial) {
      this.jurassicSkylineMaterial.color.copy(skylineColor);
      this.jurassicSkylineMaterial.opacity = jurassicOpacity;
    }
    if (this.infernoSkylineMaterial) {
      this.infernoSkylineMaterial.color.copy(skylineColor);
      this.infernoSkylineMaterial.opacity = infernoOpacity;
    }
    if (this.modernSkyline) this.modernSkyline.visible = modernOpacity > 0.01;
    if (this.historicSkyline) this.historicSkyline.visible = historicOpacity > 0.01;
    if (this.neonSkyline) this.neonSkyline.visible = neonOpacity > 0.01;
    if (this.orbitalSkyline) this.orbitalSkyline.visible = orbitalOpacity > 0.01;
    if (this.abyssalSkyline) this.abyssalSkyline.visible = abyssalOpacity > 0.01;
    if (this.doomsdaySkyline) this.doomsdaySkyline.visible = doomsdayOpacity > 0.01;
    if (this.phantomSkyline) this.phantomSkyline.visible = phantomOpacity > 0.01;
    if (this.hauntedCarnivalSkyline) this.hauntedCarnivalSkyline.visible = hauntedOpacity > 0.01;
    if (this.vipExpressSkyline) this.vipExpressSkyline.visible = vipOpacity > 0.01;
    if (this.midnightVelvetSkyline) this.midnightVelvetSkyline.visible = midnightVelvetOpacity > 0.01;
    if (this.jurassicSkyline) this.jurassicSkyline.visible = jurassicOpacity > 0.01;
    if (this.infernoSkyline) this.infernoSkyline.visible = infernoOpacity > 0.01;

    // Clouds fade for tunnel, orbital space, underwater abyss & subterranean crypt transitions
    const cloudOpacity = THREE.MathUtils.lerp(
      base.id === 'UNDERGROUND_METRO' || base.id === 'ORBITAL_HALO' || base.id === 'ABYSSAL_GLASSLINE' || base.id === 'PHANTOM_LINE' ? 0 : 1,
      targetTheme.id === 'UNDERGROUND_METRO' || targetTheme.id === 'ORBITAL_HALO' || targetTheme.id === 'ABYSSAL_GLASSLINE' || targetTheme.id === 'PHANTOM_LINE' ? 0 : 1,
      t
    );
    if (this.cloudMaterial) this.cloudMaterial.opacity = cloudOpacity;
    if (this.cloudsGroup) {
      this.cloudsGroup.visible = this.currentConfig.cloudsVisible && cloudOpacity > 0.01;
    }

    // 7. Continuous subterranean foundation bed color
    if (this.infiniteSubterraneanBed) {
      const getThemeGroundColor = (id: string): number => {
        switch (id) {
          case 'INFERNO_EXPRESS': return 0x7f1d1d;
          case 'JURASSIC_RUSH': return 0x143522;
          case 'VIP_EXPRESS':
          case 'RAHULVERSE': return 0x8a623a;
          case 'MIDNIGHT_VELVET': return 0x121720;
          case 'CHRONO_KINGDOM': return 0x2c2214;
          case 'VIVA_HEAT': return 0x7c2626;
          case 'ORBITAL_HALO': return 0x0f172a;
          case 'ABYSSAL_GLASSLINE': return 0x021626;
          case 'DOOMSDAY_LAST_TRANSIT': return 0x140f0d;
          case 'HISTORIC_QUARTER': return 0x2c2620;
          default: return 0x263238;
        }
      };
      const baseGround = getThemeGroundColor(base.id);
      const targetGround = getThemeGroundColor(targetTheme.id);
      (this.infiniteSubterraneanBed.material as THREE.MeshStandardMaterial).color.copy(
        EnvironmentManager.lerpColor(baseGround, targetGround, t)
      );
    }

    if (t >= 0.999) {
      this.currentTheme = targetTheme;
      this.prevTheme = null;
    }
  }

  public startAtmosphericTransition(targetTheme: EnvironmentTheme, durationSeconds: number = 2.5): void {
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
        sunIntensity = 0.35;
        skyTopHex = 0x0f172a;
        skyBottomHex = 0x1e293b;
        fogColorHex = 0x111827;
        fogDensity = 0.0055;
        fillColorHex = 0x38bdf8;
        fillIntensity = 0.95;
        break;
      case 'NEON_MIDNIGHT_RAIN':
        sunColorHex = 0x8be9fd;
        sunIntensity = 0.70;
        skyTopHex = 0x050814;
        skyBottomHex = 0x1f0b38;
        fogColorHex = 0x0d1226;
        fogDensity = 0.0032;
        fillColorHex = 0xf026d3;
        fillIntensity = 0.55;
        isRain = true;
        break;
      case 'ORBITAL_CELESTIAL_DAWN':
        sunColorHex = 0xffffff;
        sunIntensity = 1.45;
        skyTopHex = 0x01030a;
        skyBottomHex = 0x0b1a30;
        fogColorHex = 0x050914;
        fogDensity = 0.0020;
        fillColorHex = 0x00d2ff;
        fillIntensity = 0.65;
        isRain = false;
        break;
      case 'ABYSSAL_BIOLUMINESCENT_CHASM':
        sunColorHex = 0x38bdf8;
        sunIntensity = 1.15;
        skyTopHex = 0x011324;
        skyBottomHex = 0x033852;
        fogColorHex = 0x021b2d;
        fogDensity = 0.0035;
        fillColorHex = 0x0d9488;
        fillIntensity = 0.75;
        isRain = false;
        break;
      case 'DOOMSDAY_FIRESTORM_FALLOUT':
        sunColorHex = 0xff6a20;
        sunIntensity = 1.15;
        skyTopHex = 0x140402;
        skyBottomHex = 0x4a1104;
        fogColorHex = 0x1a0705;
        fogDensity = 0.0038;
        fillColorHex = 0x7c2d12;
        fillIntensity = 0.75;
        isRain = false;
        break;
      case 'PHANTOM_SPECTRAL_VOID':
        sunColorHex = 0x67e8f9;
        sunIntensity = 1.10;
        skyTopHex = 0x030712;
        skyBottomHex = 0x082f49;
        fogColorHex = 0x051b24;
        fogDensity = 0.0036;
        fillColorHex = 0x064e3b;
        fillIntensity = 0.65;
        isRain = false;
        break;
      case 'CARNIVAL_HAUNTED_NIGHT':
        sunColorHex = 0xfb923c;
        sunIntensity = 1.15;
        skyTopHex = 0x0c071e;
        skyBottomHex = 0x3b0764;
        fogColorHex = 0x1e0e38;
        fogDensity = 0.0034;
        fillColorHex = 0x581c87;
        fillIntensity = 0.70;
        isRain = false;
        break;
      case 'CHRONO_CELESTIAL_CLOCKWORK':
        sunColorHex = 0xffe6a3;
        sunIntensity = 1.45;
        skyTopHex = 0x0c1e3d;
        skyBottomHex = 0x7c3417;
        fogColorHex = 0x241712;
        fogDensity = 0.0022;
        fillColorHex = 0x854d27;
        fillIntensity = 0.85;
        isRain = false;
        break;
      case 'CHRONO_STEAM_RAIN':
        sunColorHex = 0xeab308;
        sunIntensity = 1.05;
        skyTopHex = 0x081324;
        skyBottomHex = 0x4a1f0e;
        fogColorHex = 0x1a1210;
        fogDensity = 0.0035;
        fillColorHex = 0x6e3c1b;
        fillIntensity = 0.70;
        isRain = true;
        break;
      case 'MIDNIGHT_VELVET_AFTERDARK':
        sunColorHex = 0xfff4e6;
        sunIntensity = 1.65;
        skyTopHex = 0x080c1e;
        skyBottomHex = 0x241228;
        fogColorHex = 0x151226;
        fogDensity = 0.0018;
        fillColorHex = 0x3b1d60;
        fillIntensity = 0.65;
        isRain = false;
        break;
      case 'MIDNIGHT_VELVET_RAIN':
        sunColorHex = 0xd8c8b8;
        sunIntensity = 0.85;
        skyTopHex = 0x03040a;
        skyBottomHex = 0x160812;
        fogColorHex = 0x0e0816;
        fogDensity = 0.0040;
        fillColorHex = 0x220c4a;
        fillIntensity = 0.45;
        isRain = true;
        break;
      case 'VIP_CEREMONIAL_SUNSET':
        sunColorHex = 0xfffbeb;
        sunIntensity = 1.45;
        skyTopHex = 0x1e3a8a;
        skyBottomHex = 0xffedd5;
        fogColorHex = 0xfef3c7;
        fogDensity = 0.0016;
        fillColorHex = 0x1e3a8a;
        fillIntensity = 0.65;
        isRain = false;
        break;
      case 'RAHULVERSE_MORNING_YATRA':
        sunColorHex = 0xffedd5;
        sunIntensity = 1.45;
        skyTopHex = 0x0284c7;
        skyBottomHex = 0xfef08a;
        fogColorHex = 0xe0f2fe;
        fogDensity = 0.0028;
        fillColorHex = 0x0284c7;
        fillIntensity = 0.65;
        isRain = false;
        break;
      case 'INFERNO_VOLCANIC_MAGMA':
        sunColorHex = 0xff6622;
        sunIntensity = 1.65;
        skyTopHex = 0x0a0305;
        skyBottomHex = 0x581111;
        fogColorHex = 0x22080a;
        fogDensity = 0.0022;
        fillColorHex = 0x3d0b0b;
        fillIntensity = 0.85;
        isRain = false;
        break;
      case 'JURASSIC_PRIMORDIAL_DAWN':
        sunColorHex = 0xfff1c2;
        sunIntensity = 1.55;
        skyTopHex = 0x0a5c44;
        skyBottomHex = 0xfcd34d;
        fogColorHex = 0x184e3d;
        fogDensity = 0.0022;
        fillColorHex = 0x15803d;
        fillIntensity = 0.95;
        isRain = false;
        break;
      case 'VIVA_HEAT_SUNSET_FEVER':
        sunColorHex = 0xffedd5;
        sunIntensity = 1.45;
        skyTopHex = 0x3b0764;
        skyBottomHex = 0xf43f5e;
        fogColorHex = 0x4a044e;
        fogDensity = 0.0028;
        fillColorHex = 0x831843;
        fillIntensity = 0.60;
        isRain = false;
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
      if (isRain && (this.rainParticles.material as THREE.PointsMaterial)) {
        (this.rainParticles.material as THREE.PointsMaterial).opacity =
          this.currentConfig?.sceneryDetail === 'MINIMAL' ? 0.25 : 0.60;
      }
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
    this.lastPlayerZ = playerZ;
    // Keep directional shadow map frustum centered on active player and oncoming track
    this.sunLight.position.z = playerZ + 20;
    this.sunLight.target.position.z = playerZ - 12;
    this.sunLight.target.updateMatrixWorld();

    this.fillLight.position.z = playerZ + 15;
    this.fillLight.target.position.z = playerZ - 12;
    this.fillLight.target.updateMatrixWorld();

    // Sky and skyline track player so horizon feels infinite
    this.skyMesh.position.z = playerZ;
    this.cloudsGroup.position.z = playerZ;
    this.skylineGroup.position.z = playerZ;

    // Continuous subterranean ground bed tracks player along run corridor
    if (this.infiniteSubterraneanBed) {
      this.infiniteSubterraneanBed.position.z = playerZ - 360.0;
      this.infiniteSubterraneanBed.position.x = 0;
    }

    // Subtle cloud drift
    this.cloudsGroup.rotation.y += 0.00015;

    // Subtle high-speed motion lines opacity
    if (this.speedLinesMesh) {
      const isEnabled = SettingsManager.getInstance().isSpeedLinesEnabled();
      this.speedLinesMesh.visible = isEnabled;
      if (isEnabled) {
        this.speedLinesMesh.position.z = playerZ;
        const speedThreshold = 21.0;
        const maxSpd = 52.0;
        const ratio = Math.max(0, Math.min(1.0, (speed - speedThreshold) / (maxSpd - speedThreshold)));
        (this.speedLinesMesh.material as THREE.LineBasicMaterial).opacity = ratio * 0.52;
      }
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

    // Moving background spacecraft in orbital space
    if (this.backgroundSpacecraft.length > 0 && this.orbitalSkyline && this.orbitalSkyline.visible) {
      const delta = dt || 0.016;
      for (let i = 0; i < this.backgroundSpacecraft.length; i++) {
        const craft = this.backgroundSpacecraft[i];
        craft.position.x += craft.userData.vx * delta;
        craft.position.y += craft.userData.vy * delta;
        if (craft.userData.vx > 0 && craft.position.x > craft.userData.maxX) {
          craft.position.x = craft.userData.minX;
        } else if (craft.userData.vx < 0 && craft.position.x < craft.userData.minX) {
          craft.position.x = craft.userData.maxX;
        }
      }
    }

    // Swimming background marine leviathans in oceanic abyss
    if (this.backgroundMarineCreatures.length > 0 && this.abyssalSkyline && this.abyssalSkyline.visible) {
      const delta = dt || 0.016;
      this.abyssalCreatureTime += delta;
      for (let i = 0; i < this.backgroundMarineCreatures.length; i++) {
        const creature = this.backgroundMarineCreatures[i];
        creature.position.x += creature.userData.vx * delta;
        creature.position.y += Math.sin(this.abyssalCreatureTime * creature.userData.swimFreq + creature.userData.swimPhase) * creature.userData.verticalAmp * delta;
        creature.rotation.z = Math.cos(this.abyssalCreatureTime * creature.userData.swimFreq + creature.userData.swimPhase) * 0.08;
        if (creature.userData.vx > 0 && creature.position.x > creature.userData.maxX) {
          creature.position.x = creature.userData.minX;
        } else if (creature.userData.vx < 0 && creature.position.x < creature.userData.minX) {
          creature.position.x = creature.userData.maxX;
        }
      }
    }

    // Falling embers, billowing smoke and meteor streaks in Doomsday skyline
    if (this.doomsdaySkyline && this.doomsdaySkyline.visible) {
      const delta = dt || 0.016;
      this.doomsdayEmbersTime += delta;

      // Animate falling ash/ember particles
      if (this.doomsdayEmbersGeo && this.doomsdayEmbersPositions) {
        const count = this.doomsdayEmbersPositions.length / 3;
        for (let i = 0; i < count; i++) {
          this.doomsdayEmbersPositions[i * 3 + 1] -= delta * 14.0; // Fall downward
          this.doomsdayEmbersPositions[i * 3 + 0] += Math.sin(this.doomsdayEmbersTime * 1.6 + i) * delta * 2.8; // Turbulent drift
          if (this.doomsdayEmbersPositions[i * 3 + 1] < 0) {
            this.doomsdayEmbersPositions[i * 3 + 1] = 58.0; // Wrap back to top
          }
        }
        this.doomsdayEmbersGeo.attributes.position.needsUpdate = true;
      }

      // Animate smoke plume billows
      for (let i = 0; i < this.doomsdaySmokePlumes.length; i++) {
        const plume = this.doomsdaySmokePlumes[i];
        plume.rotation.y += plume.userData.rotSpeed * delta;
      }

      // Animate meteor streaks
      for (let i = 0; i < this.doomsdayMeteorStreaks.length; i++) {
        const meteor = this.doomsdayMeteorStreaks[i];
        meteor.position.x += meteor.userData.vx * delta;
        meteor.position.y += meteor.userData.vy * delta;
        if (meteor.position.x < -240) {
          meteor.position.x = meteor.userData.startX + 60;
          meteor.position.y = meteor.userData.startY + 24;
        }
      }
    }

    // Drifting ectoplasmic motes, silent ghost train & subtle flickering lamps in Phantom Line skyline
    if (this.phantomSkyline && this.phantomSkyline.visible) {
      const delta = dt || 0.016;
      this.phantomEctoTime += delta;
      this.phantomFlickerTime += delta;

      // Animate drifting ectoplasmic motes
      if (this.phantomEctoParticlesGeo && this.phantomEctoParticlesPos) {
        const count = this.phantomEctoParticlesPos.length / 3;
        for (let i = 0; i < count; i++) {
          this.phantomEctoParticlesPos[i * 3 + 1] += delta * 1.5; // Rise gently upward
          this.phantomEctoParticlesPos[i * 3 + 0] += Math.sin(this.phantomEctoTime * 0.8 + i) * delta * 1.2; // Ethereal lateral wander
          if (this.phantomEctoParticlesPos[i * 3 + 1] > 54.0) {
            this.phantomEctoParticlesPos[i * 3 + 1] = 2.0; // Wrap back to bottom
          }
        }
        this.phantomEctoParticlesGeo.attributes.position.needsUpdate = true;
      }

      // Animate silent gliding background ghost train along far viaduct
      if (this.phantomGhostTrain) {
        this.phantomGhostTrain.position.z -= delta * 14.0;
        if (this.phantomGhostTrain.position.z < -440.0) {
          this.phantomGhostTrain.position.z = -140.0;
        }
      }

      // Gentle, restrained atmospheric flicker on distant lamps (non-epileptogenic smooth pulsation)
      if (this.phantomFlickerLamps && this.phantomFlickerLamps.length > 0) {
        for (let i = 0; i < this.phantomFlickerLamps.length; i++) {
          const lamp = this.phantomFlickerLamps[i];
          const s = 0.85 + 0.15 * Math.sin(this.phantomFlickerTime * 3.5 + i * 2.1);
          lamp.scale.set(s, s, s);
        }
      }
    }

    // Rotating Haunted Ferris Wheel & Animated Bats in Haunted Carnival skyline
    if (this.hauntedCarnivalSkyline && this.hauntedCarnivalSkyline.visible) {
      const delta = dt || 0.016;
      this.hauntedBatTime += delta;

      if (this.hauntedFerrisWheel) {
        this.hauntedFerrisWheel.rotation.z += delta * 0.14;
        const currentRot = this.hauntedFerrisWheel.rotation.z;
        if (this.hauntedFerrisGondolas && this.hauntedFerrisGondolas.length > 0) {
          for (let i = 0; i < this.hauntedFerrisGondolas.length; i++) {
            this.hauntedFerrisGondolas[i].rotation.z = -currentRot;
          }
        }
      }

      if (this.hauntedAnimatedBats && this.hauntedAnimatedBats.length > 0) {
        for (let i = 0; i < this.hauntedAnimatedBats.length; i++) {
          const bat = this.hauntedAnimatedBats[i];
          const phase = this.hauntedBatTime * 12.0 + i * 1.8;
          if (bat.children.length >= 3) {
            const leftWing = bat.children[1];
            const rightWing = bat.children[2];
            leftWing.rotation.z = Math.sin(phase) * 0.50;
            rightWing.rotation.z = -Math.sin(phase) * 0.50;
          }
          bat.position.x += Math.sin(this.hauntedBatTime * 0.9 + i) * delta * 3.5;
          bat.position.y += Math.cos(this.hauntedBatTime * 1.4 + i * 2.0) * delta * 1.8;
        }
      }
    }

    // Swaying celebration searchlights & falling confetti in VIP Express skyline
    if (this.vipExpressSkyline && this.vipExpressSkyline.visible) {
      const delta = dt || 0.016;
      this.vipSearchlightTime += delta;

      for (let i = 0; i < this.vipSearchlights.length; i++) {
        const light = this.vipSearchlights[i];
        const offset = i * 1.57;
        light.rotation.z = Math.sin(this.vipSearchlightTime * 0.75 + offset) * 0.25;
      }

      if (this.vipConfettiPos && this.vipConfettiGeo) {
        for (let i = 0; i < this.vipConfettiPos.length / 3; i++) {
          this.vipConfettiPos[i * 3 + 1] -= delta * 5.0;
          if (this.vipConfettiPos[i * 3 + 1] < 2.0) {
            this.vipConfettiPos[i * 3 + 1] = 60.0;
          }
        }
        this.vipConfettiGeo.attributes.position.needsUpdate = true;
      }

      // Update VipComedyEventDirector animated satire gags across districts
      VipComedyEventDirector.getInstance().update(delta, true);
    }

    if (this.currentTheme && this.currentTheme.id === 'RAHULVERSE') {
      const delta = dt || 0.016;
      RahulComedyEventDirector.getInstance().update(delta, true);
    }

    if (this.currentTheme && this.currentTheme.id === 'MIDNIGHT_VELVET') {
      const delta = dt || 0.016;
      MidnightVelvetEventDirector.getInstance().update(delta, true);

      // Animate sweeping Art Deco nightclub skyline searchlights
      if (this.midnightVelvetSkyline && this.midnightVelvetSkyline.visible) {
        this.midnightSkylineSearchlightTime += delta;
        for (let i = 0; i < this.midnightSkylineSearchlights.length; i++) {
          const light = this.midnightSkylineSearchlights[i];
          const offset = i * 1.57;
          light.rotation.z = Math.sin(this.midnightSkylineSearchlightTime * 0.65 + offset) * 0.32;
          light.rotation.x = Math.cos(this.midnightSkylineSearchlightTime * 0.45 + offset) * 0.15;
        }
      }
    }

    if (this.currentTheme && this.currentTheme.id === 'CHRONO_KINGDOM') {
      const delta = dt || 0.016;
      ChronoKingdomEventDirector.getInstance().setScene(this.scene);
      ChronoKingdomEventDirector.getInstance().update(delta, true, this.lastPlayerZ);
    }

    if (this.currentTheme && this.currentTheme.id === 'HAUNTED_CARNIVAL') {
      const delta = dt || 0.016;
      HauntedCarnivalEventDirector.getInstance().update(delta, true);
    }

    if (this.currentTheme && this.currentTheme.id === 'PHANTOM_LINE') {
      const delta = dt || 0.016;
      PhantomLineEventDirector.getInstance().update(delta, true);
    }

    if (this.currentTheme && this.currentTheme.id === 'INFERNO_EXPRESS') {
      const delta = dt || 0.016;
      InfernoExpressEventDirector.getInstance().update(delta, true);

      // Animate pulsing magma calderas and drifting ash plumes across volcanic skyline
      if (this.infernoSkyline && this.infernoSkyline.visible) {
        this.infernoSkylineTime += delta;
        for (let i = 0; i < this.infernoSkylineVolcanoes.length; i++) {
          const v = this.infernoSkylineVolcanoes[i];
          const t = this.infernoSkylineTime * 1.8 + v.phase;
          const glowScale = 0.9 + 0.2 * Math.sin(t * 2.2);
          v.craterGlow.scale.set(glowScale, 1.0, glowScale);
          v.plume.scale.set(
            1.0 + 0.12 * Math.sin(t * 0.8),
            1.0 + 0.15 * Math.cos(t * 0.9),
            1.0 + 0.12 * Math.sin(t * 0.8)
          );
          v.plume.position.y = (v.plume.userData.baseY || 100) + Math.sin(t * 0.7) * 2.5;
        }
      }
    }

    if (this.currentTheme && this.currentTheme.id === 'JURASSIC_RUSH') {
      const delta = dt || 0.016;
      JurassicRushEventDirector.getInstance().update(delta, true);

      // Animate soaring pterosaur flocks in prehistoric sky
      if (this.jurassicSkyline && this.jurassicSkyline.visible) {
        this.jurassicSkylineTime += delta;
        for (let i = 0; i < this.jurassicPterosaurFlocks.length; i++) {
          const flock = this.jurassicPterosaurFlocks[i];
          const t = this.jurassicSkylineTime * 2.2 + flock.phase;
          // Wing flapping cycle
          flock.leftWing.rotation.z = Math.sin(t * 3.2) * 0.42;
          flock.rightWing.rotation.z = -Math.sin(t * 3.2) * 0.42;
          // Gentle soaring drift
          flock.group.position.x = flock.basePos.x + Math.sin(t * 0.4) * 16.0;
          flock.group.position.y = flock.basePos.y + Math.cos(t * 0.3) * 4.0;
          flock.group.rotation.z = Math.cos(t * 0.4) * 0.12;
        }
      }
    }

    if (this.currentTheme && this.currentTheme.id === 'VIVA_HEAT') {
      const delta = dt || 0.016;
      FeverDirector.getInstance().update(delta, true);
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
    if (window.innerWidth <= 0 || window.innerHeight <= 0) return;
    const config = GraphicsManager.getInstance().getActiveConfig();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(config.pixelRatio);
  }
}
