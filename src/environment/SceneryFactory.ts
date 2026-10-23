import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { CurvedShaderManager } from '../scene/CurvedShader';
import { TextureGenerator } from '../scene/TextureGenerator';
import { EnvironmentTheme, EnvironmentId } from './EnvironmentConfig';
import { SceneryPool } from './SceneryPool';

export class SeededRandom {
  private s: number;

  constructor(seed: number) {
    this.s = (seed >>> 0) || 1337;
  }

  public next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  public pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  public chance(p: number): boolean {
    return this.next() < p;
  }
}

export class SceneryFactory {
  private static instance: SceneryFactory;
  private sceneryPool = SceneryPool.getInstance();

  private sharedMaterials: {
    // Core roadbed/curb
    curbMat: THREE.MeshStandardMaterial;
    // Modern Metro
    modernGlassMat: THREE.MeshStandardMaterial;
    modernConcreteMat: THREE.MeshStandardMaterial;
    modernWhiteMat: THREE.MeshStandardMaterial;
    modernSteelMat: THREE.MeshStandardMaterial;
    modernNeonMat: THREE.MeshBasicMaterial;
    modernSignMat: THREE.MeshBasicMaterial;
    solarPanelMat: THREE.MeshStandardMaterial;
    catenarySteelMat: THREE.MeshStandardMaterial;
    insulatorMat: THREE.MeshStandardMaterial;
    cableMat: THREE.MeshBasicMaterial;
    graffitiMat1: THREE.MeshBasicMaterial;
    graffitiMat2: THREE.MeshBasicMaterial;
    // Historic Quarter
    weatheredBrickMat1: THREE.MeshStandardMaterial;
    weatheredBrickMat2: THREE.MeshStandardMaterial;
    stoneMasonryMat: THREE.MeshStandardMaterial;
    copperPatinaMat: THREE.MeshStandardMaterial;
    castIronMat: THREE.MeshStandardMaterial;
    gasLampMat: THREE.MeshBasicMaterial;
    slateRoofMat: THREE.MeshStandardMaterial;
    historicSignMat: THREE.MeshBasicMaterial;
    earthenwareInsulatorMat: THREE.MeshStandardMaterial;
    copperCableMat: THREE.MeshBasicMaterial;
    // Neon Industrial
    industrialSteelMat: THREE.MeshStandardMaterial;
    industrialConcreteMat: THREE.MeshStandardMaterial;
    rustIronMat: THREE.MeshStandardMaterial;
    corrugatedMetalMat: THREE.MeshStandardMaterial;
    industrialPipeMat: THREE.MeshStandardMaterial;
    hazardStripeMat: THREE.MeshBasicMaterial;
    sodiumLampMat: THREE.MeshBasicMaterial;
    industrialSignMat: THREE.MeshBasicMaterial;
    // Subway Tunnel
    tunnelTileMat: THREE.MeshStandardMaterial;
    tunnelCeilingMat: THREE.MeshStandardMaterial;
    tunnelRibMat: THREE.MeshStandardMaterial;
    tunnelLampMat: THREE.MeshBasicMaterial;
  } | null = null;

  public static getInstance(): SceneryFactory {
    if (!SceneryFactory.instance) {
      SceneryFactory.instance = new SceneryFactory();
    }
    return SceneryFactory.instance;
  }

  private constructor() {
    this.initSharedMaterials();
  }

  public getSharedMaterials() {
    if (!this.sharedMaterials) {
      this.initSharedMaterials();
    }
    return this.sharedMaterials!;
  }

  private initSharedMaterials(): void {
    if (this.sharedMaterials) return;
    const curved = CurvedShaderManager.getInstance();

    const concreteTex = TextureGenerator.getConcreteTexture();
    const curbMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      color: 0xdde2e6,
      roughness: 0.85,
      metalness: 0.1
    });
    curved.applyCurvature(curbMat);

    // 1. Modern Metro Materials
    const modernGlassMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      roughness: 0.1,
      metalness: 0.85
    });
    curved.applyCurvature(modernGlassMat);

    const modernConcreteMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      color: 0x78909c,
      roughness: 0.7,
      metalness: 0.2
    });
    curved.applyCurvature(modernConcreteMat);

    const modernWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xe8edf2,
      roughness: 0.45,
      metalness: 0.15
    });
    curved.applyCurvature(modernWhiteMat);

    const modernSteelMat = new THREE.MeshStandardMaterial({
      color: 0x374151,
      roughness: 0.42,
      metalness: 0.75
    });
    curved.applyCurvature(modernSteelMat);

    const modernNeonMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const modernSignMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getModernMetroSignTexture('METRO CENTRAL', 'LINE 1')
    });

    const solarPanelMat = new THREE.MeshStandardMaterial({
      color: 0x152238,
      roughness: 0.2,
      metalness: 0.9
    });
    curved.applyCurvature(solarPanelMat);

    const catenarySteelMat = new THREE.MeshStandardMaterial({
      color: 0x455a64,
      roughness: 0.45,
      metalness: 0.75
    });
    curved.applyCurvature(catenarySteelMat);

    const insulatorMat = new THREE.MeshStandardMaterial({
      color: 0x81d4fa,
      roughness: 0.2,
      metalness: 0.3
    });
    curved.applyCurvature(insulatorMat);

    const cableMat = new THREE.MeshBasicMaterial({ color: 0x263238 });

    const graffitiMat1 = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getGraffitiDecal(0),
      transparent: true,
      depthWrite: false
    });
    curved.applyCurvature(graffitiMat1);

    const graffitiMat2 = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getGraffitiDecal(1),
      transparent: true,
      depthWrite: false
    });
    curved.applyCurvature(graffitiMat2);

    // 2. Historic Quarter Materials
    const weatheredBrickMat1 = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getWeatheredBrickTexture(),
      roughness: 0.85,
      metalness: 0.05
    });
    curved.applyCurvature(weatheredBrickMat1);

    const brickTex2 = TextureGenerator.getBrickTexture('#a04030');
    const weatheredBrickMat2 = new THREE.MeshStandardMaterial({
      map: brickTex2,
      roughness: 0.82,
      metalness: 0.08
    });
    curved.applyCurvature(weatheredBrickMat2);

    const stoneMasonryMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getStoneMasonryTexture(),
      roughness: 0.88,
      metalness: 0.1
    });
    curved.applyCurvature(stoneMasonryMat);

    const copperPatinaMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getCopperPatinaTexture(),
      roughness: 0.6,
      metalness: 0.35
    });
    curved.applyCurvature(copperPatinaMat);

    const castIronMat = new THREE.MeshStandardMaterial({
      color: 0x212121,
      roughness: 0.7,
      metalness: 0.85
    });
    curved.applyCurvature(castIronMat);

    const gasLampMat = new THREE.MeshBasicMaterial({ color: 0xffe082 });

    const slateRoofMat = new THREE.MeshStandardMaterial({
      color: 0x37474f,
      roughness: 0.65,
      metalness: 0.25
    });
    curved.applyCurvature(slateRoofMat);

    const historicSignMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getHistoricSignTexture('GRAND CENTRAL')
    });

    const earthenwareInsulatorMat = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      roughness: 0.5,
      metalness: 0.2
    });
    curved.applyCurvature(earthenwareInsulatorMat);

    const copperCableMat = new THREE.MeshBasicMaterial({ color: 0x4e342e });

    // 3. Neon Industrial Materials
    const industrialSteelMat = new THREE.MeshStandardMaterial({
      color: 0x37474f,
      roughness: 0.55,
      metalness: 0.70
    });
    curved.applyCurvature(industrialSteelMat);

    const industrialConcreteMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      color: 0x546e7a,
      roughness: 0.85,
      metalness: 0.15
    });
    curved.applyCurvature(industrialConcreteMat);

    const rustIronMat = new THREE.MeshStandardMaterial({
      color: 0x8d4925,
      roughness: 0.90,
      metalness: 0.30
    });
    curved.applyCurvature(rustIronMat);

    const corrugatedMetalMat = new THREE.MeshStandardMaterial({
      color: 0x607d8b,
      roughness: 0.50,
      metalness: 0.65
    });
    curved.applyCurvature(corrugatedMetalMat);

    const industrialPipeMat = new THREE.MeshStandardMaterial({
      color: 0xd84315,
      roughness: 0.60,
      metalness: 0.50
    });
    curved.applyCurvature(industrialPipeMat);

    const hazardStripeMat = new THREE.MeshBasicMaterial({ color: 0xffab00 });
    const sodiumLampMat = new THREE.MeshBasicMaterial({ color: 0xff8f00 });
    const industrialSignMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getModernMetroSignTexture('FREIGHT YARD', 'TERMINAL 4')
    });

    // 4. Subway Tunnel Materials
    const tunnelTileMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getTunnelWallTileTexture(),
      roughness: 0.45,
      metalness: 0.15
    });
    curved.applyCurvature(tunnelTileMat);

    const tunnelCeilingMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.70,
      metalness: 0.25
    });
    curved.applyCurvature(tunnelCeilingMat);

    const tunnelRibMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.45,
      metalness: 0.65
    });
    curved.applyCurvature(tunnelRibMat);

    const tunnelLampMat = new THREE.MeshBasicMaterial({ color: 0xffd54f });

    this.sharedMaterials = {
      curbMat,
      modernGlassMat,
      modernConcreteMat,
      modernWhiteMat,
      modernSteelMat,
      modernNeonMat,
      modernSignMat,
      solarPanelMat,
      catenarySteelMat,
      insulatorMat,
      cableMat,
      graffitiMat1,
      graffitiMat2,
      weatheredBrickMat1,
      weatheredBrickMat2,
      stoneMasonryMat,
      copperPatinaMat,
      castIronMat,
      gasLampMat,
      slateRoofMat,
      historicSignMat,
      earthenwareInsulatorMat,
      copperCableMat,
      industrialSteelMat,
      industrialConcreteMat,
      rustIronMat,
      corrugatedMetalMat,
      industrialPipeMat,
      hazardStripeMat,
      sodiumLampMat,
      industrialSignMat,
      tunnelTileMat,
      tunnelCeilingMat,
      tunnelRibMat,
      tunnelLampMat
    };
  }

  /**
   * Builds rich procedural scenery for a chunk based on its district theme and deterministic seed
   */
  public buildScenery(
    decorativeGroup: THREE.Group,
    theme: EnvironmentTheme,
    worldZ: number,
    isTransition: boolean,
    isTunnel: boolean,
    tunnelPortal: 'ENTRY' | 'EXIT' | 'BOTH' | 'NONE' = 'NONE',
    detail: 'FULL' | 'BALANCED' | 'MINIMAL' = 'FULL',
    seed: number = 1337
  ): void {
    // Clean previous scenery
    this.sceneryPool.clearDecorativeGroup(decorativeGroup);

    const chunkLength = CONSTANTS.CHUNK_LENGTH;
    const roadbedWidth = CONSTANTS.LANE_WIDTH * 3 + 2.8;
    const curbWidth = 0.5;

    let meshCountBefore = 0;

    if (isTunnel) {
      this.buildTunnelScenery(decorativeGroup, tunnelPortal, chunkLength);
    } else if (isTransition) {
      this.buildTransitionPortalScenery(decorativeGroup, roadbedWidth, curbWidth, theme, chunkLength);
    } else if (theme.id === 'HISTORIC_QUARTER') {
      this.buildHistoricQuarterScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
    } else if (theme.id === 'NEON_INDUSTRIAL') {
      this.buildNeonIndustrialScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
    } else {
      this.buildModernMetroScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
    }

    let meshesAdded = 0;
    decorativeGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) meshesAdded++;
    });
    this.sceneryPool.recordMeshesAdded(meshesAdded);
  }

  // -------------------------------------------------------------------------
  // MODERN METRO DISTRICT
  // -------------------------------------------------------------------------
  private buildModernMetroScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const rng = new SeededRandom(seed);

    const wallHeight = 2.4;
    const wallThick = 0.6;
    const wallX = roadbedWidth * 0.5 + curbWidth + wallThick * 0.5 + 0.2;
    const wallGeo = new THREE.BoxGeometry(wallThick, wallHeight, chunkLength);

    // 1. Concrete Retaining Walls
    const leftWall = new THREE.Mesh(wallGeo, mats.modernConcreteMat);
    leftWall.position.set(-wallX, wallHeight * 0.5, -chunkLength * 0.5);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, mats.modernConcreteMat);
    rightWall.position.set(wallX, wallHeight * 0.5, -chunkLength * 0.5);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    group.add(rightWall);

    // Coping caps
    const capGeo = new THREE.BoxGeometry(wallThick + 0.15, 0.18, chunkLength);
    const leftCap = new THREE.Mesh(capGeo, mats.curbMat);
    leftCap.position.set(-wallX, wallHeight + 0.09, -chunkLength * 0.5);
    group.add(leftCap);

    const rightCap = new THREE.Mesh(capGeo, mats.curbMat);
    rightCap.position.set(wallX, wallHeight + 0.09, -chunkLength * 0.5);
    group.add(rightCap);

    // Neon cyan accent strip
    const neonGeo = new THREE.BoxGeometry(0.06, 0.06, chunkLength);
    [-wallX + wallThick * 0.5, wallX - wallThick * 0.5].forEach((nx) => {
      const neon = new THREE.Mesh(neonGeo, mats.modernNeonMat);
      neon.position.set(nx, wallHeight + 0.05, -chunkLength * 0.5);
      group.add(neon);
    });

    // Yellow safety railing
    const railBarGeo = new THREE.BoxGeometry(0.06, 0.06, chunkLength);
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffd600, roughness: 0.3 });
    CurvedShaderManager.getInstance().applyCurvature(yellowMat);

    [-wallX, wallX].forEach((wx) => {
      const topBar = new THREE.Mesh(railBarGeo, yellowMat);
      topBar.position.set(wx, wallHeight + 0.8, -chunkLength * 0.5);
      group.add(topBar);

      if (detail !== 'MINIMAL') {
        const railPostGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6);
        for (let z = 0; z < chunkLength; z += 6) {
          const post = new THREE.Mesh(railPostGeo, yellowMat);
          post.position.set(wx, wallHeight + 0.45, -z - 3);
          group.add(post);
        }
      }
    });

    // Street graffiti decals
    if (detail !== 'MINIMAL') {
      const decalGeo = new THREE.PlaneGeometry(6.0, 1.8);
      const decal1 = new THREE.Mesh(decalGeo, mats.graffitiMat1);
      decal1.rotation.y = Math.PI / 2;
      decal1.position.set(-wallX + wallThick * 0.5 + 0.02, 1.3, -chunkLength * 0.3);
      group.add(decal1);

      const decal2 = new THREE.Mesh(decalGeo, mats.graffitiMat2);
      decal2.rotation.y = -Math.PI / 2;
      decal2.position.set(wallX - wallThick * 0.5 - 0.02, 1.3, -chunkLength * 0.7);
      group.add(decal2);
    }

    // 2. Modern Overhead Catenaries
    this.buildModernCatenarySystem(group, chunkLength);

    // 3. Modular Modern Buildings with Dynamic Architectural Variations
    this.buildModernModularCity(group, chunkLength, rng, detail);

    // 4. Overhead Skybridge (deterministic placement based on seed)
    if (rng.chance(0.55)) {
      this.buildModernSkybridge(group, chunkLength);
    }
  }

  private buildModernCatenarySystem(group: THREE.Group, chunkLength: number): void {
    const mats = this.getSharedMaterials();
    const gantrySpacing = 26.0;
    const gantryCount = Math.floor(chunkLength / gantrySpacing);
    const poleHeight = 7.8;
    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 3.8;

    for (let g = 0; g < gantryCount; g++) {
      const gz = -g * gantrySpacing - 13.0;
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, gz);

      const colGeo = new THREE.BoxGeometry(0.4, poleHeight, 0.4);
      [-spanWidth * 0.5, spanWidth * 0.5].forEach((cx) => {
        const col = new THREE.Mesh(colGeo, mats.catenarySteelMat);
        col.position.set(cx, poleHeight * 0.5, 0);
        col.castShadow = true;
        gantryGroup.add(col);

        const ped = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), mats.curbMat);
        ped.position.set(cx, 0.4, 0);
        gantryGroup.add(ped);
      });

      const girder = new THREE.Mesh(new THREE.BoxGeometry(spanWidth + 0.6, 0.55, 0.45), mats.catenarySteelMat);
      girder.position.set(0, poleHeight - 0.28, 0);
      girder.castShadow = true;
      gantryGroup.add(girder);

      // Insulators & Signals
      CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
        const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.45, 8), mats.insulatorMat);
        ins.position.set(laneX, poleHeight - 0.75, 0);
        gantryGroup.add(ins);

        const sig = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.85, 0.28), mats.modernSteelMat);
        sig.position.set(laneX, poleHeight - 1.15, 0.12);
        gantryGroup.add(sig);

        const greenLens = new THREE.Mesh(new THREE.CircleGeometry(0.1, 10), new THREE.MeshBasicMaterial({ color: 0x00e676 }));
        greenLens.position.set(laneX, poleHeight - 1.05, 0.27);
        gantryGroup.add(greenLens);
      });

      group.add(gantryGroup);
    }

    // Overhead catenary contact wires
    CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, chunkLength, 6), mats.cableMat);
      cable.rotation.x = Math.PI / 2;
      cable.position.set(laneX, poleHeight - 1.0, -chunkLength * 0.5);
      group.add(cable);
    });
  }

  private buildModernModularCity(
    group: THREE.Group,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const setback = 10.5;
    const numBuildings = 5;
    const lotLength = chunkLength / numBuildings;

    for (let b = 0; b < numBuildings; b++) {
      const bz = -b * lotLength - lotLength * 0.5;
      const bStyle = rng.int(0, 3); // 4 distinct modular families

      [-1, 1].forEach((side) => {
        const bGroup = new THREE.Group();
        const lateralJitter = rng.range(0, 2.5);
        const bX = side * (setback + 5.5 + (side > 0 ? 0.5 : 0) + lateralJitter);
        bGroup.position.set(bX, 0, bz);

        if (bStyle === 0) {
          // Family 1: Commercial Glass Curtain Skyscraper with Stepped Tiers
          const bW = rng.range(10.5, 13.0);
          const bH = rng.range(24.0, 42.0); // High-rise silhouette
          const bD = lotLength * rng.range(0.88, 0.96);

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.modernSteelMat);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          mainBody.receiveShadow = true;
          bGroup.add(mainBody);

          const glass = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.1, bH * 0.85, bD * 0.85), mats.modernGlassMat);
          glass.position.y = bH * 0.5;
          bGroup.add(glass);

          // Helipad or Roof Penthouse
          if (detail !== 'MINIMAL') {
            const pad = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.7, 0.25, bD * 0.7), mats.curbMat);
            pad.position.y = bH + 0.12;
            bGroup.add(pad);

            const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff1744 }));
            beacon.position.set(0, bH + 0.5, 0);
            bGroup.add(beacon);

            // Exterior glass elevator column
            const elev = new THREE.Mesh(new THREE.BoxGeometry(1.6, bH * 0.75, 1.8), mats.modernGlassMat);
            elev.position.set(-side * (bW * 0.5 + 0.7), bH * 0.45, 0);
            bGroup.add(elev);
          }
        } else if (bStyle === 1) {
          // Family 2: Residential Lofts with Cantilevered Balconies
          const bW = rng.range(11.0, 14.0);
          const bH = rng.range(18.0, 28.0);
          const bD = lotLength * rng.range(0.88, 0.95);

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.modernWhiteMat);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          bGroup.add(mainBody);

          // Horizontal window louvers
          const band = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.2, bH * 0.4, bD * 0.9), mats.modernConcreteMat);
          band.position.y = bH * 0.5;
          bGroup.add(band);

          // Stacked balconies facing track
          if (detail !== 'MINIMAL') {
            const balconyCount = Math.floor(bH / 4.5);
            for (let k = 1; k < balconyCount; k++) {
              const balc = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 3.2), mats.modernGlassMat);
              balc.position.set(-side * (bW * 0.5 + 0.5), k * 4.5, 0);
              bGroup.add(balc);
            }

            // Rooftop solar panels
            const solar = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.6, 0.15, bD * 0.5), mats.solarPanelMat);
            solar.position.set(0, bH + 0.1, 0);
            bGroup.add(solar);
          }
        } else if (bStyle === 2) {
          // Family 3: Metro Transit Concourse & High-Tech Plaza
          const bW = rng.range(12.0, 15.0);
          const bH = rng.range(14.0, 22.0);
          const bD = lotLength * 0.95;

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.modernConcreteMat);
          mainBody.position.y = bH * 0.5;
          bGroup.add(mainBody);

          // Cantilever station entrance canopy extending toward tracks
          const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.3, bD * 0.8), mats.modernSteelMat);
          canopy.position.set(-side * (bW * 0.5 + 1.6), 5.5, 0);
          bGroup.add(canopy);

          // Digital LED transit sign on facade
          const sign = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 2.0), mats.modernSignMat);
          sign.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
          sign.position.set(-side * (bW * 0.5 + 0.06), 7.2, 0);
          bGroup.add(sign);
        } else {
          // Family 4: High-Tech Prow Tower with Communications Spire
          const bW = rng.range(10.0, 12.5);
          const bH = rng.range(26.0, 46.0);
          const bD = lotLength * 0.90;

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.modernSteelMat);
          mainBody.position.y = bH * 0.5;
          bGroup.add(mainBody);

          // Glass front prow
          const prow = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.7, bH * 0.9, bD * 0.3), mats.modernGlassMat);
          prow.position.set(-side * (bW * 0.2), bH * 0.5, 0);
          bGroup.add(prow);

          // Communications mast
          if (detail !== 'MINIMAL') {
            const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 8.0, 6), mats.modernSteelMat);
            spire.position.set(0, bH + 4.0, 0);
            bGroup.add(spire);

            const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff1744 }));
            redLight.position.set(0, bH + 8.1, 0);
            bGroup.add(redLight);
          }
        }

        group.add(bGroup);
      });
    }
  }

  private buildModernSkybridge(group: THREE.Group, chunkLength: number): void {
    const mats = this.getSharedMaterials();
    const bridgeHeight = 8.5;
    const bridgeWidth = 7.0;
    const bridgeSpan = 32.0;

    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, bridgeHeight, -chunkLength * 0.5);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(bridgeSpan, 0.8, bridgeWidth), mats.modernSteelMat);
    deck.castShadow = true;
    deck.receiveShadow = true;
    bridgeGroup.add(deck);

    const glassWallGeo = new THREE.BoxGeometry(bridgeSpan, 2.8, 0.15);
    [-bridgeWidth * 0.5 + 0.1, bridgeWidth * 0.5 - 0.1].forEach((gz) => {
      const gw = new THREE.Mesh(glassWallGeo, mats.modernGlassMat);
      gw.position.set(0, 1.8, gz);
      bridgeGroup.add(gw);
    });

    const roof = new THREE.Mesh(new THREE.BoxGeometry(bridgeSpan + 0.6, 0.45, bridgeWidth + 0.4), mats.modernWhiteMat);
    roof.position.set(0, 3.4, 0);
    roof.castShadow = true;
    bridgeGroup.add(roof);

    const colGeo = new THREE.BoxGeometry(1.4, bridgeHeight, 2.2);
    [-bridgeSpan * 0.38, bridgeSpan * 0.38].forEach((cx) => {
      const col = new THREE.Mesh(colGeo, mats.modernSteelMat);
      col.position.set(cx, -bridgeHeight * 0.5, 0);
      col.castShadow = true;
      bridgeGroup.add(col);
    });

    group.add(bridgeGroup);
  }

  // -------------------------------------------------------------------------
  // HISTORIC RAILWAY QUARTER
  // -------------------------------------------------------------------------
  private buildHistoricQuarterScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const rng = new SeededRandom(seed);

    const wallHeight = 2.6;
    const wallThick = 0.7;
    const wallX = roadbedWidth * 0.5 + curbWidth + wallThick * 0.5 + 0.2;
    const wallGeo = new THREE.BoxGeometry(wallThick, wallHeight, chunkLength);

    // 1. Weathered Brick Retaining Walls
    const leftWall = new THREE.Mesh(wallGeo, mats.weatheredBrickMat1);
    leftWall.position.set(-wallX, wallHeight * 0.5, -chunkLength * 0.5);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, mats.weatheredBrickMat1);
    rightWall.position.set(wallX, wallHeight * 0.5, -chunkLength * 0.5);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    group.add(rightWall);

    // Stone coping cap
    const capGeo = new THREE.BoxGeometry(wallThick + 0.2, 0.25, chunkLength);
    const leftCap = new THREE.Mesh(capGeo, mats.stoneMasonryMat);
    leftCap.position.set(-wallX, wallHeight + 0.12, -chunkLength * 0.5);
    group.add(leftCap);

    const rightCap = new THREE.Mesh(capGeo, mats.stoneMasonryMat);
    rightCap.position.set(wallX, wallHeight + 0.12, -chunkLength * 0.5);
    group.add(rightCap);

    // Black wrought iron railing
    const railBarGeo = new THREE.BoxGeometry(0.08, 0.08, chunkLength);
    [-wallX, wallX].forEach((wx) => {
      const topBar = new THREE.Mesh(railBarGeo, mats.castIronMat);
      topBar.position.set(wx, wallHeight + 0.85, -chunkLength * 0.5);
      group.add(topBar);

      if (detail !== 'MINIMAL') {
        const railPostGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.85, 6);
        for (let z = 0; z < chunkLength; z += 5) {
          const post = new THREE.Mesh(railPostGeo, mats.castIronMat);
          post.position.set(wx, wallHeight + 0.45, -z - 2.5);
          group.add(post);
        }
      }
    });

    // 2. Black-Iron Telegraph & Semaphore Gantries
    this.buildHistoricGantrySystem(group, chunkLength);

    // 3. Victorian Modular Buildings
    this.buildHistoricModularBuildings(group, chunkLength, rng, detail);

    // 4. Masonry Arched Viaduct Bridge (deterministic placement)
    if (rng.chance(0.50)) {
      this.buildHistoricArchBridge(group, chunkLength);
    }
  }

  private buildHistoricGantrySystem(group: THREE.Group, chunkLength: number): void {
    const mats = this.getSharedMaterials();
    const gantrySpacing = 28.0;
    const gantryCount = Math.floor(chunkLength / gantrySpacing);
    const poleHeight = 7.6;
    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 3.8;

    for (let g = 0; g < gantryCount; g++) {
      const gz = -g * gantrySpacing - 14.0;
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, gz);

      const colGeo = new THREE.CylinderGeometry(0.2, 0.25, poleHeight, 8);
      [-spanWidth * 0.5, spanWidth * 0.5].forEach((cx) => {
        const col = new THREE.Mesh(colGeo, mats.castIronMat);
        col.position.set(cx, poleHeight * 0.5, 0);
        col.castShadow = true;
        gantryGroup.add(col);

        const ped = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.8), mats.stoneMasonryMat);
        ped.position.set(cx, 0.45, 0);
        gantryGroup.add(ped);
      });

      const girder = new THREE.Mesh(new THREE.BoxGeometry(spanWidth + 0.8, 0.4, 0.35), mats.castIronMat);
      girder.position.set(0, poleHeight - 0.2, 0);
      girder.castShadow = true;
      gantryGroup.add(girder);

      // Earthenware insulators & mechanical semaphores
      CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
        const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 6), mats.earthenwareInsulatorMat);
        ins.position.set(laneX, poleHeight - 0.6, 0);
        gantryGroup.add(ins);

        const sema = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.08), mats.copperPatinaMat);
        sema.position.set(laneX + 0.4, poleHeight - 0.9, 0.1);
        sema.rotation.z = -0.3;
        gantryGroup.add(sema);

        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), mats.gasLampMat);
        lamp.position.set(laneX, poleHeight - 0.9, 0.15);
        gantryGroup.add(lamp);
      });

      group.add(gantryGroup);
    }

    // Copper wires
    CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, chunkLength, 6), mats.copperCableMat);
      cable.rotation.x = Math.PI / 2;
      cable.position.set(laneX, poleHeight - 0.8, -chunkLength * 0.5);
      group.add(cable);
    });
  }

  private buildHistoricModularBuildings(
    group: THREE.Group,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const setback = 10.5;
    const numBuildings = 4;
    const lotLength = chunkLength / numBuildings;

    for (let b = 0; b < numBuildings; b++) {
      const bz = -b * lotLength - lotLength * 0.5;
      const bStyle = rng.int(0, 3);

      [-1, 1].forEach((side) => {
        const bGroup = new THREE.Group();
        const lateralJitter = rng.range(0, 2.0);
        const bX = side * (setback + 5.5 + (side > 0 ? 0.5 : 0) + lateralJitter);
        bGroup.position.set(bX, 0, bz);

        if (bStyle === 0) {
          // Victorian Brownstone with Bay Windows and Mansard Roof
          const bW = rng.range(12.0, 15.0);
          const bH = rng.range(18.0, 28.0);
          const bD = lotLength * rng.range(0.88, 0.96);

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.weatheredBrickMat1);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          bGroup.add(mainBody);

          // Slanted mansard roof
          const roof = new THREE.Mesh(new THREE.ConeGeometry(bW * 0.65, 5.0, 4), mats.slateRoofMat);
          roof.rotation.y = Math.PI / 4;
          roof.position.y = bH + 2.5;
          bGroup.add(roof);

          // Chimneys
          if (detail !== 'MINIMAL') {
            [-bW * 0.35, bW * 0.35].forEach((cx) => {
              const chim = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.8, 0.9), mats.weatheredBrickMat2);
              chim.position.set(cx, bH + 1.4, 0);
              bGroup.add(chim);
            });
          }
        } else if (bStyle === 1) {
          // Municipal Clock Tower & Hall
          const bW = rng.range(13.0, 16.0);
          const bH = rng.range(15.0, 22.0);
          const bD = lotLength * 0.92;

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.stoneMasonryMat);
          mainBody.position.y = bH * 0.5;
          bGroup.add(mainBody);

          // Clock Tower rising 32m
          const towerW = 4.8;
          const towerH = 32.0;
          const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerW), mats.weatheredBrickMat1);
          tower.position.set(-side * (bW * 0.2), towerH * 0.5, 0);
          bGroup.add(tower);

          // Copper spire on tower
          const spire = new THREE.Mesh(new THREE.ConeGeometry(towerW * 0.7, 6.0, 4), mats.copperPatinaMat);
          spire.rotation.y = Math.PI / 4;
          spire.position.set(-side * (bW * 0.2), towerH + 3.0, 0);
          bGroup.add(spire);

          // Glowing clock face
          const clockFace = new THREE.Mesh(new THREE.CircleGeometry(1.2, 16), mats.gasLampMat);
          clockFace.position.set(-side * (bW * 0.2) + (side > 0 ? -towerW * 0.51 : towerW * 0.51), towerH - 3.0, 0);
          clockFace.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
          bGroup.add(clockFace);
        } else if (bStyle === 2) {
          // Industrial Iron Foundry & Brick Warehouse
          const bW = rng.range(12.0, 15.0);
          const bH = rng.range(12.0, 18.0);
          const bD = lotLength * 0.95;

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.weatheredBrickMat2);
          mainBody.position.y = bH * 0.5;
          bGroup.add(mainBody);

          // Rooftop wooden water tank on iron stilts
          if (detail !== 'MINIMAL') {
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 2.5, 10), mats.weatheredBrickMat1);
            tank.position.set(0, bH + 2.5, 0);
            bGroup.add(tank);

            const stilts = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 2.4), mats.castIronMat);
            stilts.position.set(0, bH + 0.7, 0);
            bGroup.add(stilts);
          }
        } else {
          // Victorian Railway Depot / Hotel
          const bW = rng.range(13.0, 16.0);
          const bH = rng.range(16.0, 24.0);
          const bD = lotLength * 0.95;

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.weatheredBrickMat1);
          mainBody.position.y = bH * 0.5;
          bGroup.add(mainBody);

          // Enamel historic station sign
          const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.0, 1.8), mats.historicSignMat);
          sign.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
          sign.position.set(-side * (bW * 0.5 + 0.05), 6.5, 0);
          bGroup.add(sign);
        }

        group.add(bGroup);
      });
    }
  }

  private buildHistoricArchBridge(group: THREE.Group, chunkLength: number): void {
    const mats = this.getSharedMaterials();
    const bridgeHeight = 8.2;
    const bridgeSpan = 30.0;
    const bridgeDepth = 8.0;

    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, bridgeHeight, -chunkLength * 0.5);

    const arch = new THREE.Mesh(new THREE.BoxGeometry(bridgeSpan, 1.8, bridgeDepth), mats.stoneMasonryMat);
    arch.castShadow = true;
    arch.receiveShadow = true;
    bridgeGroup.add(arch);

    const balustrade = new THREE.Mesh(new THREE.BoxGeometry(bridgeSpan, 0.9, bridgeDepth + 0.4), mats.copperPatinaMat);
    balustrade.position.y = 1.35;
    bridgeGroup.add(balustrade);

    const pylonGeo = new THREE.BoxGeometry(2.2, bridgeHeight, bridgeDepth);
    [-bridgeSpan * 0.4, bridgeSpan * 0.4].forEach((px) => {
      const pylon = new THREE.Mesh(pylonGeo, mats.stoneMasonryMat);
      pylon.position.set(px, -bridgeHeight * 0.5, 0);
      pylon.castShadow = true;
      bridgeGroup.add(pylon);
    });

    group.add(bridgeGroup);
  }

  // -------------------------------------------------------------------------
  // NEON INDUSTRIAL DISTRICT
  // -------------------------------------------------------------------------
  private buildNeonIndustrialScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const rng = new SeededRandom(seed);

    const wallHeight = 2.5;
    const wallThick = 0.65;
    const wallX = roadbedWidth * 0.5 + curbWidth + wallThick * 0.5 + 0.2;
    const wallGeo = new THREE.BoxGeometry(wallThick, wallHeight, chunkLength);

    // 1. Heavy Board-Formed Concrete & Rusted Steel Retaining Walls
    const leftWall = new THREE.Mesh(wallGeo, mats.industrialConcreteMat);
    leftWall.position.set(-wallX, wallHeight * 0.5, -chunkLength * 0.5);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, mats.industrialConcreteMat);
    rightWall.position.set(wallX, wallHeight * 0.5, -chunkLength * 0.5);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    group.add(rightWall);

    // Hazard stripe coping cap
    const capGeo = new THREE.BoxGeometry(wallThick + 0.15, 0.2, chunkLength);
    const leftCap = new THREE.Mesh(capGeo, mats.hazardStripeMat);
    leftCap.position.set(-wallX, wallHeight + 0.1, -chunkLength * 0.5);
    group.add(leftCap);

    const rightCap = new THREE.Mesh(capGeo, mats.hazardStripeMat);
    rightCap.position.set(wallX, wallHeight + 0.1, -chunkLength * 0.5);
    group.add(rightCap);

    // 2. Heavy Lattice Gantries
    this.buildIndustrialGantrySystem(group, chunkLength);

    // 3. Modular Industrial Warehouses & Refineries
    this.buildIndustrialModularBuildings(group, chunkLength, rng, detail);
  }

  private buildIndustrialGantrySystem(group: THREE.Group, chunkLength: number): void {
    const mats = this.getSharedMaterials();
    const gantrySpacing = 26.0;
    const gantryCount = Math.floor(chunkLength / gantrySpacing);
    const poleHeight = 7.8;
    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 3.8;

    for (let g = 0; g < gantryCount; g++) {
      const gz = -g * gantrySpacing - 13.0;
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, gz);

      const colGeo = new THREE.BoxGeometry(0.45, poleHeight, 0.45);
      [-spanWidth * 0.5, spanWidth * 0.5].forEach((cx) => {
        const col = new THREE.Mesh(colGeo, mats.industrialSteelMat);
        col.position.set(cx, poleHeight * 0.5, 0);
        gantryGroup.add(col);
      });

      const girder = new THREE.Mesh(new THREE.BoxGeometry(spanWidth + 0.8, 0.5, 0.5), mats.industrialSteelMat);
      girder.position.set(0, poleHeight - 0.25, 0);
      gantryGroup.add(girder);

      // Warning searchlights
      CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), mats.sodiumLampMat);
        lamp.position.set(laneX, poleHeight - 0.7, 0.15);
        gantryGroup.add(lamp);
      });

      group.add(gantryGroup);
    }
  }

  private buildIndustrialModularBuildings(
    group: THREE.Group,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const setback = 10.5;
    const numBuildings = 4;
    const lotLength = chunkLength / numBuildings;

    for (let b = 0; b < numBuildings; b++) {
      const bz = -b * lotLength - lotLength * 0.5;
      const bStyle = rng.int(0, 2);

      [-1, 1].forEach((side) => {
        const bGroup = new THREE.Group();
        const bX = side * (setback + 5.5 + (side > 0 ? 0.5 : 0));
        bGroup.position.set(bX, 0, bz);

        if (bStyle === 0) {
          // Corrugated Steel Warehouse
          const bW = rng.range(12.0, 15.0);
          const bH = rng.range(14.0, 24.0);
          const bD = lotLength * 0.94;

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.corrugatedMetalMat);
          mainBody.position.y = bH * 0.5;
          bGroup.add(mainBody);

          // Roof exhaust turbine
          if (detail !== 'MINIMAL') {
            const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 4.0, 8), mats.rustIronMat);
            stack.position.set(0, bH + 2.0, 0);
            bGroup.add(stack);
          }
        } else if (bStyle === 1) {
          // Refining Complex with Twin Storage Silos
          const siloGeo = new THREE.CylinderGeometry(3.5, 3.5, 20.0, 12);
          const silo1 = new THREE.Mesh(siloGeo, mats.industrialSteelMat);
          silo1.position.set(0, 10.0, -lotLength * 0.22);
          bGroup.add(silo1);

          const silo2 = new THREE.Mesh(siloGeo, mats.industrialSteelMat);
          silo2.position.set(0, 10.0, lotLength * 0.22);
          bGroup.add(silo2);

          // Connecting pipeline
          const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, lotLength * 0.5, 6), mats.industrialPipeMat);
          pipe.rotation.x = Math.PI / 2;
          pipe.position.set(0, 16.0, 0);
          bGroup.add(pipe);
        } else {
          // Railroad Dispatch Tower
          const bW = 10.0;
          const bH = rng.range(22.0, 32.0);
          const bD = lotLength * 0.85;

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.industrialConcreteMat);
          mainBody.position.y = bH * 0.5;
          bGroup.add(mainBody);

          // Top observation cab with panoramic windows
          const cab = new THREE.Mesh(new THREE.BoxGeometry(bW * 1.15, 4.5, bD * 1.15), mats.industrialSteelMat);
          cab.position.y = bH - 2.0;
          bGroup.add(cab);
        }

        group.add(bGroup);
      });
    }
  }

  // -------------------------------------------------------------------------
  // TRANSITION PORTAL SCENERY
  // -------------------------------------------------------------------------
  private buildTransitionPortalScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    theme: EnvironmentTheme,
    chunkLength: number
  ): void {
    const mats = this.getSharedMaterials();
    const portalGroup = new THREE.Group();
    portalGroup.name = 'transition_portal';

    const portalZ = -chunkLength * 0.5;
    const portalH = 18.0;
    const spanW = roadbedWidth + curbWidth * 2.0 + 1.2;

    // Monumental ashlar stone gateway pylons flanking tracks (X ~ ±6.8, height ~ 18m)
    const pylonGeo = new THREE.BoxGeometry(3.6, portalH, 4.2);
    [-spanW * 0.5 - 1.2, spanW * 0.5 + 1.2].forEach((px) => {
      const pylon = new THREE.Mesh(pylonGeo, mats.stoneMasonryMat);
      pylon.position.set(px, portalH * 0.5, portalZ);
      pylon.castShadow = true;
      pylon.receiveShadow = true;
      portalGroup.add(pylon);
    });

    // Overhead carved portal arch crown beam (Y >= 10.0, |X| < 4.0)
    const archCrown = new THREE.Mesh(new THREE.BoxGeometry(spanW + 5.0, 3.2, 4.6), mats.stoneMasonryMat);
    archCrown.position.set(0, portalH + 0.8, portalZ);
    archCrown.castShadow = true;
    archCrown.receiveShadow = true;
    portalGroup.add(archCrown);

    // Decorative heraldic crest / badge
    const crest = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.8, 0.4), mats.copperPatinaMat);
    crest.position.set(0, portalH + 2.0, portalZ + 2.35);
    portalGroup.add(crest);

    // Clearance warning sign
    const sign = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.9, 0.25), mats.curbMat);
    sign.position.set(0, portalH - 1.2, portalZ + 2.32);
    portalGroup.add(sign);

    // Red portal warning beacons
    [-spanW * 0.5, spanW * 0.5].forEach((bx) => {
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff1744 }));
      beacon.position.set(bx, portalH + 2.8, portalZ + 2.3);
      portalGroup.add(beacon);
    });

    group.add(portalGroup);
  }

  // -------------------------------------------------------------------------
  // SUBWAY TUNNEL SCENERY
  // -------------------------------------------------------------------------
  private buildTunnelScenery(
    group: THREE.Group,
    portalType: 'ENTRY' | 'EXIT' | 'BOTH' | 'NONE',
    chunkLength: number
  ): void {
    const mats = this.getSharedMaterials();
    const tunnelGroup = new THREE.Group();
    tunnelGroup.name = 'tunnel_scenery';

    const wallX = CONSTANTS.TUNNEL_WALL_X; // 5.8m
    const wallH = 6.4;
    const wallThick = 0.6;
    const ceilingH = CONSTANTS.TUNNEL_CEILING_HEIGHT; // 7.6m
    const wallGeo = new THREE.BoxGeometry(wallThick, wallH, chunkLength);

    const leftWall = new THREE.Mesh(wallGeo, mats.tunnelTileMat);
    leftWall.position.set(-wallX, wallH * 0.5, -chunkLength * 0.5);
    tunnelGroup.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, mats.tunnelTileMat);
    rightWall.position.set(wallX, wallH * 0.5, -chunkLength * 0.5);
    tunnelGroup.add(rightWall);

    // Vaulted Arched Ceiling Geometry
    const spanW = wallX * 2.0;
    const ceilingThick = 0.45;
    const crownW = spanW * 0.65;
    const crownSlab = new THREE.Mesh(new THREE.BoxGeometry(crownW, ceilingThick, chunkLength), mats.tunnelCeilingMat);
    crownSlab.position.set(0, ceilingH, -chunkLength * 0.5);
    tunnelGroup.add(crownSlab);

    const haunchW = (spanW - crownW) * 0.5 + 0.35;
    const haunchAngle = 0.38;

    const leftHaunch = new THREE.Mesh(new THREE.BoxGeometry(haunchW, ceilingThick, chunkLength), mats.tunnelCeilingMat);
    leftHaunch.rotation.z = -haunchAngle;
    leftHaunch.position.set(-spanW * 0.5 + haunchW * 0.48, ceilingH - 0.55, -chunkLength * 0.5);
    tunnelGroup.add(leftHaunch);

    const rightHaunch = new THREE.Mesh(new THREE.BoxGeometry(haunchW, ceilingThick, chunkLength), mats.tunnelCeilingMat);
    rightHaunch.rotation.z = haunchAngle;
    rightHaunch.position.set(spanW * 0.5 - haunchW * 0.48, ceilingH - 0.55, -chunkLength * 0.5);
    tunnelGroup.add(rightHaunch);

    // Steel rib arches
    const numRibs = 5;
    const ribSpacing = chunkLength / numRibs;
    for (let r = 0; r < numRibs; r++) {
      const rz = -r * ribSpacing - ribSpacing * 0.5;
      const girder = new THREE.Mesh(new THREE.BoxGeometry(spanW + 0.2, 0.50, 0.45), mats.tunnelRibMat);
      girder.position.set(0, ceilingH - 0.25, rz);
      tunnelGroup.add(girder);

      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.3), mats.tunnelLampMat);
      lamp.position.set(0, ceilingH - 0.55, rz);
      tunnelGroup.add(lamp);
    }

    group.add(tunnelGroup);
  }
}
