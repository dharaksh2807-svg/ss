import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { GraphicsManager, QualityConfig, GraphicsPreset, ResolvedQuality } from './GraphicsManager';
import { EventBus } from '../core/EventBus';
import { SettingsManager } from '../settings/SettingsManager';
import { EnvironmentTheme, EnvironmentManager, MODERN_METRO_THEME, HISTORIC_QUARTER_THEME, UNDERGROUND_METRO_THEME } from '../environment/EnvironmentConfig';
import type { AtmospherePreset } from '../environment/EnvironmentalEncounterDirector';
import { TextureGenerator } from './TextureGenerator';

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
  public skylineMaterial: THREE.MeshBasicMaterial | null = null;
  private historicSkylineMaterial: THREE.MeshBasicMaterial | null = null;
  private neonSkylineMaterial: THREE.MeshBasicMaterial | null = null;
  private orbitalSkylineMaterial: THREE.MeshBasicMaterial | null = null;
  private abyssalSkylineMaterial: THREE.MeshBasicMaterial | null = null;
  private backgroundSpacecraft: THREE.Group[] = [];
  private backgroundMarineCreatures: THREE.Group[] = [];
  private abyssalCreatureTime: number = 0;
  private cloudMaterial: THREE.MeshStandardMaterial | null = null;
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

    this.modernSkyline.visible = this.currentTheme.id === 'MODERN_METRO' || this.currentTheme.id === 'NEON_INDUSTRIAL';
    this.historicSkyline.visible = this.currentTheme.id === 'HISTORIC_QUARTER';
    this.neonSkyline.visible = this.currentTheme.id === 'NEON_RAINLINE';
    this.orbitalSkyline.visible = this.currentTheme.id === 'ORBITAL_HALO';
    this.abyssalSkyline.visible = this.currentTheme.id === 'ABYSSAL_GLASSLINE';

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
    if (this.modernSkyline) this.modernSkyline.visible = modernOpacity > 0.01;
    if (this.historicSkyline) this.historicSkyline.visible = historicOpacity > 0.01;
    if (this.neonSkyline) this.neonSkyline.visible = neonOpacity > 0.01;
    if (this.orbitalSkyline) this.orbitalSkyline.visible = orbitalOpacity > 0.01;
    if (this.abyssalSkyline) this.abyssalSkyline.visible = abyssalOpacity > 0.01;

    // Clouds fade for tunnel, orbital space & underwater abyss transitions and respect graphics settings.
    const cloudOpacity = THREE.MathUtils.lerp(
      base.id === 'UNDERGROUND_METRO' || base.id === 'ORBITAL_HALO' || base.id === 'ABYSSAL_GLASSLINE' ? 0 : 1,
      targetTheme.id === 'UNDERGROUND_METRO' || targetTheme.id === 'ORBITAL_HALO' || targetTheme.id === 'ABYSSAL_GLASSLINE' ? 0 : 1,
      t
    );
    if (this.cloudMaterial) this.cloudMaterial.opacity = cloudOpacity;
    if (this.cloudsGroup) {
      this.cloudsGroup.visible = this.currentConfig.cloudsVisible && cloudOpacity > 0.01;
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
