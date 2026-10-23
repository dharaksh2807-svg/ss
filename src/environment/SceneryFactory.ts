import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { CurvedShaderManager } from '../scene/CurvedShader';
import { TextureGenerator } from '../scene/TextureGenerator';
import { EnvironmentTheme, EnvironmentId } from './EnvironmentConfig';
import { LandmarkType, SmallMomentType } from './EnvironmentalEncounterDirector';
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
    modernCurtainGlassMat: THREE.MeshStandardMaterial;
    modernStorefrontMat: THREE.MeshStandardMaterial;
    modernConcreteMat: THREE.MeshStandardMaterial;
    modernWhiteMat: THREE.MeshStandardMaterial;
    modernSteelMat: THREE.MeshStandardMaterial;
    modernNeonMat: THREE.MeshBasicMaterial;
    modernSignMat: THREE.MeshBasicMaterial;
    solarPanelMat: THREE.MeshStandardMaterial;
    modernSolarMat: THREE.MeshStandardMaterial;
    modernFoliageMat: THREE.MeshStandardMaterial;
    modernTeakMat: THREE.MeshStandardMaterial;
    modernGlassBridgeMat: THREE.MeshStandardMaterial;
    catenarySteelMat: THREE.MeshStandardMaterial;
    insulatorMat: THREE.MeshStandardMaterial;
    cableMat: THREE.MeshBasicMaterial;
    graffitiMat1: THREE.MeshBasicMaterial;
    graffitiMat2: THREE.MeshBasicMaterial;
    // Historic Quarter
    weatheredBrickMat1: THREE.MeshStandardMaterial;
    weatheredBrickMat2: THREE.MeshStandardMaterial;
    historicSashWindowMat: THREE.MeshStandardMaterial;
    stoneMasonryMat: THREE.MeshStandardMaterial;
    copperPatinaMat: THREE.MeshStandardMaterial;
    castIronMat: THREE.MeshStandardMaterial;
    gasLampMat: THREE.MeshBasicMaterial;
    slateRoofMat: THREE.MeshStandardMaterial;
    historicSignMat: THREE.MeshBasicMaterial;
    historicWaterTankWoodMat: THREE.MeshStandardMaterial;
    historicClockFaceMat: THREE.MeshBasicMaterial;
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
    // Subway Tunnel & Underground Metro
    tunnelTileMat: THREE.MeshStandardMaterial;
    tunnelCeilingMat: THREE.MeshStandardMaterial;
    tunnelRibMat: THREE.MeshStandardMaterial;
    tunnelLampMat: THREE.MeshBasicMaterial;
    subwayTileMuralMat1: THREE.MeshStandardMaterial;
    subwayTileMuralMat2: THREE.MeshStandardMaterial;
    subwayCatwalkMat: THREE.MeshStandardMaterial;
    subwayPlatformSlabMat: THREE.MeshStandardMaterial;
    subwayBillboardMat: THREE.MeshBasicMaterial;
    subwayDuctMat: THREE.MeshStandardMaterial;
    subwaySignalGreenMat: THREE.MeshBasicMaterial;
    subwaySignalAmberMat: THREE.MeshBasicMaterial;
    subwaySignalRedMat: THREE.MeshBasicMaterial;
    // Task 3 Landmarks & Environmental Moments
    grandStationSignMat: THREE.MeshBasicMaterial;
    spaceFrameGlassMat: THREE.MeshStandardMaterial;
    hazardChevronMat: THREE.MeshBasicMaterial;
    industrialCorrugatedSheetMat: THREE.MeshStandardMaterial;
    waterfrontRipplesMat: THREE.MeshStandardMaterial;
    marineBollardMat: THREE.MeshStandardMaterial;
    whiteEnamelMat: THREE.MeshStandardMaterial;
    lighthouseRedMat: THREE.MeshStandardMaterial;
    undergroundCathedralMuralMat: THREE.MeshStandardMaterial;
    goldFiligreeMat: THREE.MeshStandardMaterial;
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

    // 4. Subway Tunnel & Underground Metro Materials
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

    // Modern Metro Enhanced Materials
    const modernCurtainGlassMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getCurtainWallGlassTexture(),
      roughness: 0.15,
      metalness: 0.85
    });
    curved.applyCurvature(modernCurtainGlassMat);

    const modernStorefrontMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getModernStorefrontTexture(),
      roughness: 0.35,
      metalness: 0.2
    });
    curved.applyCurvature(modernStorefrontMat);

    const modernSolarMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getModernSolarPanelTexture(),
      roughness: 0.2,
      metalness: 0.85
    });
    curved.applyCurvature(modernSolarMat);

    const modernFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.85,
      metalness: 0.05
    });
    curved.applyCurvature(modernFoliageMat);

    const modernTeakMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412,
      roughness: 0.65,
      metalness: 0.1
    });
    curved.applyCurvature(modernTeakMat);

    const modernGlassBridgeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.1,
      metalness: 0.6,
      transparent: true,
      opacity: 0.75
    });
    curved.applyCurvature(modernGlassBridgeMat);

    // Historic Quarter Enhanced Materials
    const historicSashWindowMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getHistoricWindowBayTexture(),
      roughness: 0.85,
      metalness: 0.05
    });
    curved.applyCurvature(historicSashWindowMat);

    const historicWaterTankWoodMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.9,
      metalness: 0.05
    });
    curved.applyCurvature(historicWaterTankWoodMat);

    const historicClockFaceMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    // Underground Metro System Enhanced Materials
    const subwayTileMuralMat1 = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getSubwayTileMuralTexture('METRO CENTRAL', '#0284c7'),
      roughness: 0.35,
      metalness: 0.15
    });
    curved.applyCurvature(subwayTileMuralMat1);

    const subwayTileMuralMat2 = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getSubwayTileMuralTexture('SUBWAY CONCOURSE', '#059669'),
      roughness: 0.35,
      metalness: 0.15
    });
    curved.applyCurvature(subwayTileMuralMat2);

    const subwayCatwalkMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getSubwaySafetyWalkwayTexture(),
      roughness: 0.6,
      metalness: 0.5
    });
    curved.applyCurvature(subwayCatwalkMat);

    const subwayPlatformSlabMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.75,
      metalness: 0.15
    });
    curved.applyCurvature(subwayPlatformSlabMat);

    const subwayBillboardMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getSubwayStationBillboardTexture()
    });

    const subwayDuctMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.45,
      metalness: 0.7
    });
    curved.applyCurvature(subwayDuctMat);

    const subwaySignalGreenMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const subwaySignalAmberMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const subwaySignalRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    this.sharedMaterials = {
      curbMat,
      modernGlassMat,
      modernCurtainGlassMat,
      modernStorefrontMat,
      modernConcreteMat,
      modernWhiteMat,
      modernSteelMat,
      modernNeonMat,
      modernSignMat,
      solarPanelMat,
      modernSolarMat,
      modernFoliageMat,
      modernTeakMat,
      modernGlassBridgeMat,
      catenarySteelMat,
      insulatorMat,
      cableMat,
      graffitiMat1,
      graffitiMat2,
      weatheredBrickMat1,
      weatheredBrickMat2,
      historicSashWindowMat,
      stoneMasonryMat,
      copperPatinaMat,
      castIronMat,
      gasLampMat,
      slateRoofMat,
      historicSignMat,
      historicWaterTankWoodMat,
      historicClockFaceMat,
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
      tunnelLampMat,
      subwayTileMuralMat1,
      subwayTileMuralMat2,
      subwayCatwalkMat,
      subwayPlatformSlabMat,
      subwayBillboardMat,
      subwayDuctMat,
      subwaySignalGreenMat,
      subwaySignalAmberMat,
      subwaySignalRedMat,
      grandStationSignMat: new THREE.MeshBasicMaterial({
        map: TextureGenerator.getGrandStationSignTexture()
      }),
      spaceFrameGlassMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getModernSpaceFrameGlassTexture(),
          roughness: 0.15,
          metalness: 0.75,
          transparent: true,
          opacity: 0.88
        });
        curved.applyCurvature(m);
        return m;
      })(),
      industrialCorrugatedSheetMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getIndustrialCorrugatedSheetTexture(),
          roughness: 0.65,
          metalness: 0.55
        });
        curved.applyCurvature(m);
        return m;
      })(),
      hazardChevronMat: new THREE.MeshBasicMaterial({
        map: TextureGenerator.getIndustrialWarningChevronTexture()
      }),
      waterfrontRipplesMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getWaterfrontRipplesTexture(),
          roughness: 0.12,
          metalness: 0.85
        });
        curved.applyCurvature(m);
        return m;
      })(),
      undergroundCathedralMuralMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getUndergroundCathedralMuralTexture(),
          roughness: 0.35,
          metalness: 0.25
        });
        curved.applyCurvature(m);
        return m;
      })(),
      goldFiligreeMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          roughness: 0.3,
          metalness: 0.8
        });
        curved.applyCurvature(m);
        return m;
      })(),
      marineBollardMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.5,
          metalness: 0.7
        });
        curved.applyCurvature(m);
        return m;
      })(),
      whiteEnamelMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          roughness: 0.25,
          metalness: 0.1
        });
        curved.applyCurvature(m);
        return m;
      })(),
      lighthouseRedMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0xdc2626,
          roughness: 0.4,
          metalness: 0.2
        });
        curved.applyCurvature(m);
        return m;
      })()
    };
  }

  /**
   * Builds rich procedural scenery for a chunk based on its district theme, deterministic seed, and landmark encounters
   */
  public buildScenery(
    decorativeGroup: THREE.Group,
    theme: EnvironmentTheme,
    worldZ: number,
    isTransition: boolean,
    isTunnel: boolean,
    tunnelPortal: 'ENTRY' | 'EXIT' | 'BOTH' | 'NONE' = 'NONE',
    detail: 'FULL' | 'BALANCED' | 'MINIMAL' = 'FULL',
    seed: number = 1337,
    landmark: LandmarkType | null = null,
    smallMoment: SmallMomentType | null = null
  ): void {
    // Clean previous scenery
    this.sceneryPool.clearDecorativeGroup(decorativeGroup);

    const chunkLength = CONSTANTS.CHUNK_LENGTH;
    const roadbedWidth = CONSTANTS.LANE_WIDTH * 3 + 2.8;
    const curbWidth = 0.5;

    if (landmark) {
      this.buildLandmarkEncounter(landmark, decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail, theme);
    } else if (theme.id === 'UNDERGROUND_METRO' || isTunnel) {
      this.buildUndergroundMetroScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, worldZ, seed, detail, tunnelPortal);
    } else if (isTransition) {
      this.buildTransitionPortalScenery(decorativeGroup, roadbedWidth, curbWidth, theme, chunkLength);
    } else if (theme.id === 'HISTORIC_QUARTER') {
      this.buildHistoricQuarterScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
    } else if (theme.id === 'NEON_INDUSTRIAL') {
      this.buildNeonIndustrialScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
    } else {
      this.buildModernMetroScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
    }

    if (smallMoment) {
      this.buildSmallMoment(smallMoment, decorativeGroup, chunkLength, seed);
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

    // Modern curved LED streetlights along retaining walls
    if (detail !== 'MINIMAL') {
      const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 6.2, 8);
      const armGeo = new THREE.BoxGeometry(1.4, 0.08, 0.08);
      const lampHeadGeo = new THREE.BoxGeometry(0.8, 0.12, 0.3);
      const lampLightGeo = new THREE.PlaneGeometry(0.7, 0.24);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

      for (let z = 12; z < chunkLength; z += 26) {
        [-wallX, wallX].forEach((wx) => {
          const lightGroup = new THREE.Group();
          const inwardSign = wx < 0 ? 1 : -1;
          lightGroup.position.set(wx, wallHeight, -z);

          const pole = new THREE.Mesh(poleGeo, mats.modernSteelMat);
          pole.position.y = 3.1;
          lightGroup.add(pole);

          const arm = new THREE.Mesh(armGeo, mats.modernSteelMat);
          arm.position.set(inwardSign * 0.6, 6.1, 0);
          lightGroup.add(arm);

          const head = new THREE.Mesh(lampHeadGeo, mats.modernSteelMat);
          head.position.set(inwardSign * 1.2, 6.05, 0);
          lightGroup.add(head);

          const lightPlane = new THREE.Mesh(lampLightGeo, ledMat);
          lightPlane.rotation.x = Math.PI / 2;
          lightPlane.position.set(inwardSign * 1.2, 5.98, 0);
          lightGroup.add(lightPlane);

          group.add(lightGroup);
        });
      }
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
    const wallX = CONSTANTS.TUNNEL_WALL_X;
    const setback = 10.5;
    const numBuildings = 5;
    const lotLength = chunkLength / numBuildings;

    for (let b = 0; b < numBuildings; b++) {
      const bz = -b * lotLength - lotLength * 0.5;
      const bStyle = rng.int(0, 3); // 4 distinct modular families

      [-1, 1].forEach((side) => {
        const bGroup = new THREE.Group();
        const lateralJitter = rng.range(0, 2.0);

        if (bStyle === 0) {
          // Family 1: Commercial Glass Curtain Skyscraper with Stepped Tiers & Rooftop Terrace
          const bW = rng.range(11.0, 14.0);
          const bH = rng.range(28.0, 48.0); // High-rise silhouette
          const bD = lotLength * rng.range(0.88, 0.96);

          const frontX = wallX + 1.6 + lateralJitter;
          const bX = side * (frontX + bW * 0.5);
          bGroup.position.set(bX, 0, bz);

          // Ground-level commercial storefront podium
          const podiumH = 5.2;
          const podiumDepth = 0.8;
          const podium = new THREE.Mesh(new THREE.BoxGeometry(podiumDepth, podiumH, bD * 0.92), mats.modernStorefrontMat);
          podium.position.set(-side * (bW * 0.5 + podiumDepth * 0.5), podiumH * 0.5, 0);
          podium.castShadow = true;
          podium.receiveShadow = true;
          bGroup.add(podium);

          // Glass entrance canopy over storefront
          const canopy = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, bD * 0.7), mats.modernSteelMat);
          canopy.position.set(-side * (bW * 0.5 + podiumDepth + 0.2), 3.8, 0);
          bGroup.add(canopy);

          // Main tower shaft
          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.modernSteelMat);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          mainBody.receiveShadow = true;
          bGroup.add(mainBody);

          // Glass curtain wall facade with illuminated floor plates
          const glass = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.12, bH * 0.88, bD * 0.88), mats.modernCurtainGlassMat);
          glass.position.y = bH * 0.5;
          bGroup.add(glass);

          // Stepped setback rooftop garden & penthouse
          if (detail === 'FULL') {
            // Teak rooftop decking
            const deck = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.85, 0.2, bD * 0.8), mats.modernTeakMat);
            deck.position.y = bH + 0.1;
            bGroup.add(deck);

            // Landscaped perimeter hedges & foliage planters
            const planter = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.8, 0.6, 0.8), mats.modernFoliageMat);
            planter.position.set(0, bH + 0.4, -side * (bD * 0.35));
            bGroup.add(planter);

            // Upper penthouse pavilion
            const pentW = bW * 0.55;
            const pentH = 4.5;
            const pent = new THREE.Mesh(new THREE.BoxGeometry(pentW, pentH, bD * 0.55), mats.modernSteelMat);
            pent.position.set(0, bH + pentH * 0.5 + 0.2, 0);
            bGroup.add(pent);

            // Helipad on top of penthouse
            const pad = new THREE.Mesh(new THREE.BoxGeometry(pentW * 0.8, 0.2, pentW * 0.8), mats.curbMat);
            pad.position.y = bH + pentH + 0.3;
            bGroup.add(pad);

            const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff1744 }));
            beacon.position.set(0, bH + pentH + 0.6, 0);
            bGroup.add(beacon);

            // Exterior glass elevator column running up track-facing facade
            const elev = new THREE.Mesh(new THREE.BoxGeometry(0.8, bH * 0.8, 2.0), mats.modernGlassBridgeMat);
            elev.position.set(-side * (bW * 0.5 + 0.35), bH * 0.48, 0);
            bGroup.add(elev);
          }
        } else if (bStyle === 1) {
          // Family 2: Residential Lofts with Cantilevered Balconies & Solar Arrays
          const bW = rng.range(12.0, 15.0);
          const bH = rng.range(20.0, 32.0);
          const bD = lotLength * rng.range(0.88, 0.95);

          const frontX = wallX + 1.6 + lateralJitter;
          const bX = side * (frontX + bW * 0.5);
          bGroup.position.set(bX, 0, bz);

          // Ground floor boutique retail
          const podiumH = 4.8;
          const podiumDepth = 0.8;
          const podium = new THREE.Mesh(new THREE.BoxGeometry(podiumDepth, podiumH, bD * 0.88), mats.modernStorefrontMat);
          podium.position.set(-side * (bW * 0.5 + podiumDepth * 0.5), podiumH * 0.5, 0);
          podium.castShadow = true;
          bGroup.add(podium);

          // Tower body in sleek off-white architectural concrete
          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.modernWhiteMat);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          mainBody.receiveShadow = true;
          bGroup.add(mainBody);

          // Recessed horizontal dark spandrels
          const band = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.15, bH * 0.35, bD * 0.92), mats.modernConcreteMat);
          band.position.y = bH * 0.52;
          bGroup.add(band);

          // Stacked cantilevered balconies facing the railway tracks
          if (detail !== 'MINIMAL') {
            const balconyCount = Math.floor(bH / 4.5);
            for (let k = 1; k < balconyCount; k++) {
              const balcGroup = new THREE.Group();
              balcGroup.position.set(-side * (bW * 0.5 + 0.35), k * 4.5, 0);

              // Balcony floor slab
              const floor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 4.0), mats.modernConcreteMat);
              balcGroup.add(floor);

              // Balcony glass railing
              const glassRailing = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 3.9), mats.modernGlassBridgeMat);
              glassRailing.position.y = 0.55;
              balcGroup.add(glassRailing);

              bGroup.add(balcGroup);
            }

            // Photovoltaic solar pergolas on roof
            const solar = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.7, 0.15, bD * 0.6), mats.modernSolarMat);
            solar.position.set(0, bH + 0.35, 0);
            solar.rotation.x = 0.12;
            bGroup.add(solar);
          }
        } else if (bStyle === 2) {
          // Family 3: Contemporary Metro Station Concourse & High-Tech Plaza
          const bW = rng.range(13.0, 16.0);
          const bH = rng.range(15.0, 24.0);
          const bD = lotLength * 0.95;

          const frontX = wallX + 1.6 + lateralJitter;
          const bX = side * (frontX + bW * 0.5);
          bGroup.position.set(bX, 0, bz);

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.modernConcreteMat);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          bGroup.add(mainBody);

          // Station entrance canopy
          const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, bD * 0.85), mats.modernSteelMat);
          canopy.position.set(-side * (bW * 0.5 + 0.5), 6.2, 0);
          canopy.castShadow = true;
          bGroup.add(canopy);

          // Street-level illuminated retail storefronts under the station concourse
          const concourseStore = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.8, bD * 0.75), mats.modernStorefrontMat);
          concourseStore.position.set(-side * (bW * 0.5 + 0.35), 2.4, 0);
          bGroup.add(concourseStore);

          // Large digital transit departures indicator screen on facade
          const sign = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 2.4), mats.modernSignMat);
          sign.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
          sign.position.set(-side * (bW * 0.5 + 0.08), 8.5, 0);
          bGroup.add(sign);

          // Public art plaza sculpture (faceted geometric steel/glass prism)
          if (detail === 'FULL') {
            const sculpture = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), mats.modernGlassBridgeMat);
            sculpture.position.set(-side * (bW * 0.5 + 0.5), 2.5, bD * 0.25);
            sculpture.rotation.y = Math.PI / 6;
            bGroup.add(sculpture);
          }
        } else {
          // Family 4: High-Tech Prow Tower with Communications Mast
          const bW = rng.range(11.0, 13.5);
          const bH = rng.range(30.0, 52.0); // Tallest skyline landmark
          const bD = lotLength * 0.90;

          const frontX = wallX + 1.6 + lateralJitter;
          const bX = side * (frontX + bW * 0.5);
          bGroup.position.set(bX, 0, bz);

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.modernSteelMat);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          bGroup.add(mainBody);

          // Angular glass prow projecting towards the railway
          const prow = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.5, bH * 0.92, bD * 0.35), mats.modernCurtainGlassMat);
          prow.position.set(-side * (bW * 0.2), bH * 0.5, 0);
          bGroup.add(prow);

          // Slender communications spire rising above apex
          if (detail !== 'MINIMAL') {
            const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.35, 9.5, 8), mats.modernSteelMat);
            spire.position.set(0, bH + 4.75, 0);
            bGroup.add(spire);

            const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff1744 }));
            redLight.position.set(0, bH + 9.6, 0);
            bGroup.add(redLight);
          }
        }

        group.add(bGroup);
      });
    }
  }

  private buildModernSkybridge(group: THREE.Group, chunkLength: number): void {
    const mats = this.getSharedMaterials();
    // Ceiling clearance: 8.8m guarantees complete clearance of train (4.35m) and jump apex (7.61m)
    const bridgeHeight = 8.8;
    const bridgeWidth = 6.5;
    const bridgeSpan = 34.0;

    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, bridgeHeight, -chunkLength * 0.5);

    // Floor deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(bridgeSpan, 0.8, bridgeWidth), mats.modernSteelMat);
    deck.castShadow = true;
    deck.receiveShadow = true;
    bridgeGroup.add(deck);

    // Translucent blue glass walls
    const glassWallGeo = new THREE.BoxGeometry(bridgeSpan, 2.9, 0.12);
    [-bridgeWidth * 0.5 + 0.1, bridgeWidth * 0.5 - 0.1].forEach((gz) => {
      const gw = new THREE.Mesh(glassWallGeo, mats.modernGlassBridgeMat);
      gw.position.set(0, 1.85, gz);
      bridgeGroup.add(gw);
    });

    // Sleek white aerodynamic roof canopy
    const roof = new THREE.Mesh(new THREE.BoxGeometry(bridgeSpan + 0.8, 0.5, bridgeWidth + 0.6), mats.modernWhiteMat);
    roof.position.set(0, 3.55, 0);
    roof.castShadow = true;
    bridgeGroup.add(roof);

    // Structural support pylons flanking the railway
    const colGeo = new THREE.BoxGeometry(1.6, bridgeHeight, 2.4);
    [-bridgeSpan * 0.4, bridgeSpan * 0.4].forEach((cx) => {
      const col = new THREE.Mesh(colGeo, mats.modernSteelMat);
      col.position.set(cx, -bridgeHeight * 0.5, 0);
      col.castShadow = true;
      bridgeGroup.add(col);
    });

    // Overhead Cable-Stayed Suspension Tower & Cables
    const mast = new THREE.Mesh(new THREE.BoxGeometry(1.4, 9.0, 1.4), mats.modernSteelMat);
    mast.position.set(0, 8.0, 0);
    bridgeGroup.add(mast);

    [-bridgeSpan * 0.35, -bridgeSpan * 0.2, bridgeSpan * 0.2, bridgeSpan * 0.35].forEach((dx) => {
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 12.0, 6), mats.cableMat);
      const angle = Math.atan2(dx, 8.0);
      cable.rotation.z = angle;
      cable.position.set(dx * 0.5, 5.5, 0);
      bridgeGroup.add(cable);
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

    // Cast-iron gas streetlamps along retaining wall coping
    if (detail !== 'MINIMAL') {
      const postGeo = new THREE.CylinderGeometry(0.07, 0.1, 5.8, 8);
      const lanternGeo = new THREE.BoxGeometry(0.5, 0.8, 0.5);
      const lanternGlass = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.65, 0.42), mats.gasLampMat);

      for (let z = 14; z < chunkLength; z += 24) {
        [-wallX, wallX].forEach((wx) => {
          const lampGroup = new THREE.Group();
          lampGroup.position.set(wx, wallHeight, -z);

          const post = new THREE.Mesh(postGeo, mats.castIronMat);
          post.position.y = 2.9;
          lampGroup.add(post);

          const lanternFrame = new THREE.Mesh(lanternGeo, mats.castIronMat);
          lanternFrame.position.y = 6.0;
          lampGroup.add(lanternFrame);

          const glow = lanternGlass.clone();
          glow.position.y = 6.0;
          lampGroup.add(glow);

          group.add(lampGroup);
        });
      }
    }

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
    const wallX = CONSTANTS.TUNNEL_WALL_X;
    const setback = 10.5;
    const numBuildings = 4;
    const lotLength = chunkLength / numBuildings;

    for (let b = 0; b < numBuildings; b++) {
      const bz = -b * lotLength - lotLength * 0.5;
      const bStyle = rng.int(0, 3);

      [-1, 1].forEach((side) => {
        const bGroup = new THREE.Group();
        const lateralJitter = rng.range(0, 2.0);

        if (bStyle === 0) {
          // Style 1: Victorian Red Brick Brownstone with Arched Windows & Multi-Tier Fire Escapes
          const bW = rng.range(12.0, 15.0);
          const bH = rng.range(18.0, 28.0);
          const bD = lotLength * rng.range(0.88, 0.96);

          const frontX = wallX + 1.6 + lateralJitter;
          const bX = side * (frontX + bW * 0.5);
          bGroup.position.set(bX, 0, bz);

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.weatheredBrickMat1);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          mainBody.receiveShadow = true;
          bGroup.add(mainBody);

          // Arched sash window bays with internal gaslight glow
          const windowBay = new THREE.Mesh(new THREE.BoxGeometry(0.1, bH * 0.75, bD * 0.85), mats.historicSashWindowMat);
          windowBay.position.set(-side * (bW * 0.5 + 0.05), bH * 0.5, 0);
          bGroup.add(windowBay);

          // Multi-tier wrought-iron fire escapes facing the tracks
          if (detail !== 'MINIMAL') {
            const tiers = Math.floor(bH / 4.8);
            for (let t = 1; t < tiers; t++) {
              const feGroup = new THREE.Group();
              feGroup.position.set(-side * (bW * 0.5 + 0.35), t * 4.8, 0);

              // Grated landing platform
              const plat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 3.2), mats.castIronMat);
              feGroup.add(plat);

              // Iron safety railing
              const rail = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 3.15), mats.castIronMat);
              rail.position.y = 0.5;
              feGroup.add(rail);

              // Diagonal egress escape ladder to lower tier
              const ladder = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.8, 0.45), mats.castIronMat);
              ladder.rotation.z = side * 0.35;
              ladder.position.set(0, -2.2, 1.2);
              feGroup.add(ladder);

              bGroup.add(feGroup);
            }
          }

          // Slanted slate mansard roof
          const roof = new THREE.Mesh(new THREE.ConeGeometry(bW * 0.65, 5.0, 4), mats.slateRoofMat);
          roof.rotation.y = Math.PI / 4;
          roof.position.y = bH + 2.5;
          roof.castShadow = true;
          bGroup.add(roof);

          // Weathered brick chimneys
          if (detail !== 'MINIMAL') {
            [-bW * 0.35, bW * 0.35].forEach((cx) => {
              const chim = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.0, 0.9), mats.weatheredBrickMat2);
              chim.position.set(cx, bH + 1.5, 0);
              bGroup.add(chim);
            });
          }
        } else if (bStyle === 1) {
          // Style 2: Stately Municipal Clock Tower & Grand Station Hall
          const bW = rng.range(13.0, 16.0);
          const bH = rng.range(15.0, 22.0);
          const bD = lotLength * 0.92;

          const frontX = wallX + 1.6 + lateralJitter;
          const bX = side * (frontX + bW * 0.5);
          bGroup.position.set(bX, 0, bz);

          // Rusticated ashlar stone base hall
          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.stoneMasonryMat);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          bGroup.add(mainBody);

          // Stately Clock Tower rising 34m tall
          const towerW = 5.0;
          const towerH = 34.0;
          const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerW), mats.weatheredBrickMat1);
          tower.position.set(-side * (bW * 0.2), towerH * 0.5, 0);
          tower.castShadow = true;
          bGroup.add(tower);

          // 4 Illuminated Clock Dials
          const clockRadius = 1.35;
          const clockDialGeo = new THREE.CircleGeometry(clockRadius, 16);
          const clockY = towerH - 3.2;
          const tPos = -side * (bW * 0.2);

          // Front dial (facing track)
          const dial1 = new THREE.Mesh(clockDialGeo, mats.historicClockFaceMat);
          dial1.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
          dial1.position.set(tPos + (side > 0 ? -towerW * 0.51 : towerW * 0.51), clockY, 0);
          bGroup.add(dial1);

          // North & South dials
          [-towerW * 0.51, towerW * 0.51].forEach((dz) => {
            const dial = new THREE.Mesh(clockDialGeo, mats.historicClockFaceMat);
            dial.position.set(tPos, clockY, dz);
            bGroup.add(dial);
          });

          // Verdigris Copper Spire & Spire Finial
          const spire = new THREE.Mesh(new THREE.ConeGeometry(towerW * 0.72, 7.5, 4), mats.copperPatinaMat);
          spire.rotation.y = Math.PI / 4;
          spire.position.set(tPos, towerH + 3.75, 0);
          spire.castShadow = true;
          bGroup.add(spire);

          const weatherVane = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), mats.castIronMat);
          weatherVane.position.set(tPos, towerH + 8.2, 0);
          bGroup.add(weatherVane);
        } else if (bStyle === 2) {
          // Style 3: Industrial Iron Foundry & Freight Warehouse with Water Tank
          const bW = rng.range(12.0, 15.0);
          const bH = rng.range(13.0, 19.0);
          const bD = lotLength * 0.95;

          const frontX = wallX + 1.6 + lateralJitter;
          const bX = side * (frontX + bW * 0.5);
          bGroup.position.set(bX, 0, bz);

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.weatheredBrickMat2);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          bGroup.add(mainBody);

          // Arched sash windows along warehouse side
          const win = new THREE.Mesh(new THREE.BoxGeometry(0.1, bH * 0.6, bD * 0.8), mats.historicSashWindowMat);
          win.position.set(-side * (bW * 0.5 + 0.05), bH * 0.5, 0);
          bGroup.add(win);

          // Rooftop cedar timber water tank on iron stilts
          if (detail !== 'MINIMAL') {
            const tankGroup = new THREE.Group();
            tankGroup.position.set(0, bH, 0);

            // Black iron angle-iron stilts
            const stilts = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, 2.6), mats.castIronMat);
            stilts.position.y = 1.0;
            tankGroup.add(stilts);

            // Cedar wood vat
            const tankVat = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 2.8, 12), mats.historicWaterTankWoodMat);
            tankVat.position.y = 3.4;
            tankGroup.add(tankVat);

            // Conical timber roof
            const tankRoof = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.4, 12), mats.weatheredBrickMat1);
            tankRoof.position.y = 5.4;
            tankGroup.add(tankRoof);

            bGroup.add(tankGroup);

            // Projecting iron crane hoist arm
            const craneArm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 0.18), mats.castIronMat);
            craneArm.position.set(-side * (bW * 0.5 + 0.5), bH - 1.5, 0);
            bGroup.add(craneArm);
          }
        } else {
          // Style 4: Victorian Station Hotel with Tapered Brick Industrial Smokestack
          const bW = rng.range(13.0, 16.0);
          const bH = rng.range(16.0, 24.0);
          const bD = lotLength * 0.95;

          const frontX = wallX + 1.6 + lateralJitter;
          const bX = side * (frontX + bW * 0.5);
          bGroup.position.set(bX, 0, bz);

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.weatheredBrickMat1);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          bGroup.add(mainBody);

          // Enamel historic station sign
          const sign = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 2.0), mats.historicSignMat);
          sign.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
          sign.position.set(-side * (bW * 0.5 + 0.06), 7.0, 0);
          bGroup.add(sign);

          // Tapered brick industrial smelting smokestack rising 28m
          if (detail !== 'MINIMAL') {
            const stack = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.2, 28.0, 10), mats.weatheredBrickMat2);
            stack.position.set(-side * (bW * 0.3), 14.0, bD * 0.35);
            stack.castShadow = true;
            bGroup.add(stack);
          }
        }

        group.add(bGroup);
      });
    }
  }

  private buildHistoricArchBridge(group: THREE.Group, chunkLength: number): void {
    const mats = this.getSharedMaterials();
    // 8.8m provides ample clearance above trains (4.35m) and player jump apex (7.61m)
    const bridgeHeight = 8.8;
    const bridgeSpan = 32.0;
    const bridgeDepth = 9.0;

    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, bridgeHeight, -chunkLength * 0.5);

    // Rusticated stone masonry double arch structure
    const archDeck = new THREE.Mesh(new THREE.BoxGeometry(bridgeSpan, 1.8, bridgeDepth), mats.stoneMasonryMat);
    archDeck.castShadow = true;
    archDeck.receiveShadow = true;
    bridgeGroup.add(archDeck);

    // Pierced classical balustrade with copper coping
    const balustrade = new THREE.Mesh(new THREE.BoxGeometry(bridgeSpan, 1.0, bridgeDepth + 0.4), mats.stoneMasonryMat);
    balustrade.position.y = 1.4;
    bridgeGroup.add(balustrade);

    // Heavy stone support abutments / pylons flanking tracks
    const pylonGeo = new THREE.BoxGeometry(2.6, bridgeHeight, bridgeDepth);
    [-bridgeSpan * 0.42, bridgeSpan * 0.42].forEach((px) => {
      const pylon = new THREE.Mesh(pylonGeo, mats.stoneMasonryMat);
      pylon.position.set(px, -bridgeHeight * 0.5, 0);
      pylon.castShadow = true;
      bridgeGroup.add(pylon);
    });

    // Cast-iron gas lanterns mounted on balustrade plinths
    [-bridgeSpan * 0.3, 0, bridgeSpan * 0.3].forEach((lx) => {
      [-bridgeDepth * 0.5 - 0.2, bridgeDepth * 0.5 + 0.2].forEach((lz) => {
        const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.6, 0.35), mats.gasLampMat);
        lantern.position.set(lx, 2.2, lz);
        bridgeGroup.add(lantern);
      });
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
  // UNDERGROUND METRO SYSTEM SCENERY
  // -------------------------------------------------------------------------
  private buildUndergroundMetroScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    worldZ: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    portalType: 'ENTRY' | 'EXIT' | 'BOTH' | 'NONE'
  ): void {
    const mats = this.getSharedMaterials();
    const rng = new SeededRandom(seed);
    const undergroundGroup = new THREE.Group();
    undergroundGroup.name = 'underground_metro_scenery';

    // Clearance calculation:
    // Roadbed is ~13.6m. Lanes are at X = -3.6, 0.0, +3.6.
    // Left & Right continuous structural walls at X = ±TUNNEL_WALL_X (5.8m).
    const wallX = CONSTANTS.TUNNEL_WALL_X; // 5.8m
    const wallThick = 0.6;
    
    // Station Concourse vs Running Tunnel chunk:
    // Alternating chunks feature a wide station hall platform with ceramic mosaic murals and billboards
    const chunkIdx = Math.round(Math.abs(worldZ / chunkLength));
    const isStationHall = (chunkIdx % 2) === 1;
    
    // Vault height: Crown at 8.8m (running tunnel) or 9.6m (station hall)
    // Train roof is 4.35m. Jump apex is 7.61m. Camera follow height is 7.60m.
    // A crown of 8.8m - 9.6m provides >1.2m headroom and 0 camera clipping!
    const ceilingH = isStationHall ? 9.6 : 8.8;
    const wallH = 6.5;

    const wallGeo = new THREE.BoxGeometry(wallThick, wallH, chunkLength);

    // 1. Continuous Glazed Subway Wall Tiling
    // Left Wall
    const leftWall = new THREE.Mesh(wallGeo, mats.tunnelTileMat);
    leftWall.position.set(-wallX, wallH * 0.5, -chunkLength * 0.5);
    leftWall.receiveShadow = true;
    undergroundGroup.add(leftWall);

    // Right Wall (Subway Tile or Decorative Station Name Mosaic Mural)
    const rightWallMat = isStationHall
      ? (rng.chance(0.5) ? mats.subwayTileMuralMat1 : mats.subwayTileMuralMat2)
      : mats.tunnelTileMat;
    const rightWall = new THREE.Mesh(wallGeo, rightWallMat);
    rightWall.position.set(wallX, wallH * 0.5, -chunkLength * 0.5);
    rightWall.receiveShadow = true;
    undergroundGroup.add(rightWall);

    // Wall coping frieze band
    const friezeGeo = new THREE.BoxGeometry(wallThick + 0.1, 0.35, chunkLength);
    const leftFrieze = new THREE.Mesh(friezeGeo, mats.tunnelCeilingMat);
    leftFrieze.position.set(-wallX, wallH - 0.18, -chunkLength * 0.5);
    undergroundGroup.add(leftFrieze);

    const rightFrieze = new THREE.Mesh(friezeGeo, mats.tunnelCeilingMat);
    rightFrieze.position.set(wallX, wallH - 0.18, -chunkLength * 0.5);
    undergroundGroup.add(rightFrieze);

    // 2. Vaulted Arched Ceiling
    const spanW = wallX * 2.0; // 11.6m
    const ceilingThick = 0.5;
    const crownW = spanW * 0.62;

    const crownSlab = new THREE.Mesh(new THREE.BoxGeometry(crownW, ceilingThick, chunkLength), mats.tunnelCeilingMat);
    crownSlab.position.set(0, ceilingH, -chunkLength * 0.5);
    crownSlab.receiveShadow = true;
    undergroundGroup.add(crownSlab);

    const haunchW = (spanW - crownW) * 0.5 + 0.4;
    const haunchAngle = 0.36;

    const leftHaunch = new THREE.Mesh(new THREE.BoxGeometry(haunchW, ceilingThick, chunkLength), mats.tunnelCeilingMat);
    leftHaunch.rotation.z = -haunchAngle;
    leftHaunch.position.set(-spanW * 0.5 + haunchW * 0.48, ceilingH - 0.6, -chunkLength * 0.5);
    leftHaunch.receiveShadow = true;
    undergroundGroup.add(leftHaunch);

    const rightHaunch = new THREE.Mesh(new THREE.BoxGeometry(haunchW, ceilingThick, chunkLength), mats.tunnelCeilingMat);
    rightHaunch.rotation.z = haunchAngle;
    rightHaunch.position.set(spanW * 0.5 - haunchW * 0.48, ceilingH - 0.6, -chunkLength * 0.5);
    rightHaunch.receiveShadow = true;
    undergroundGroup.add(rightHaunch);

    // 3. Repeating Structural Steel / Concrete Arch Ribs & Overhead Lighting Bents
    const numRibs = 5;
    const ribSpacing = chunkLength / numRibs;
    for (let r = 0; r < numRibs; r++) {
      const rz = -r * ribSpacing - ribSpacing * 0.5;
      const ribGroup = new THREE.Group();
      ribGroup.position.set(0, 0, rz);

      // Flanking support columns (X = ±5.55m, clears > 5.4m)
      const colGeo = new THREE.BoxGeometry(0.35, wallH, 0.5);
      [-wallX + 0.25, wallX - 0.25].forEach((cx) => {
        const col = new THREE.Mesh(colGeo, mats.tunnelRibMat);
        col.position.set(cx, wallH * 0.5, 0);
        col.castShadow = true;
        ribGroup.add(col);
      });

      // Arch transverse cross-girder
      const girder = new THREE.Mesh(new THREE.BoxGeometry(spanW + 0.2, 0.55, 0.5), mats.tunnelRibMat);
      girder.position.set(0, ceilingH - 0.28, 0);
      girder.castShadow = true;
      ribGroup.add(girder);

      // Overhead luminaire fixture units (dual high-output fluorescent strips casting downward light)
      [-CONSTANTS.LANE_WIDTH, CONSTANTS.LANE_WIDTH].forEach((lx) => {
        const fixture = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 0.45), mats.tunnelLampMat);
        fixture.position.set(lx, ceilingH - 0.42, 0);
        ribGroup.add(fixture);

        // Diffuse luminous downward face
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.38), mats.tunnelLampMat);
        glow.rotation.x = Math.PI / 2;
        glow.position.set(lx, ceilingH - 0.51, 0);
        ribGroup.add(glow);
      });

      // Railway Aspect Signal Light on alternating bents
      if (r % 2 === 0) {
        const sigGroup = new THREE.Group();
        sigGroup.position.set(-wallX + 0.25, 4.2, 0.3);

        const sigBox = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.0, 0.2), mats.tunnelRibMat);
        sigGroup.add(sigBox);

        const greenLamp = new THREE.Mesh(new THREE.CircleGeometry(0.08, 8), mats.subwaySignalGreenMat);
        greenLamp.position.set(0, 0.32, 0.11);
        sigGroup.add(greenLamp);

        const amberLamp = new THREE.Mesh(new THREE.CircleGeometry(0.08, 8), mats.subwaySignalAmberMat);
        amberLamp.position.set(0, 0, 0.11);
        sigGroup.add(amberLamp);

        const redLamp = new THREE.Mesh(new THREE.CircleGeometry(0.08, 8), mats.subwaySignalRedMat);
        redLamp.position.set(0, -0.32, 0.11);
        sigGroup.add(redLamp);

        ribGroup.add(sigGroup);
      }

      undergroundGroup.add(ribGroup);
    }

    // 4. Elevated Emergency Catwalk (Left side: X = -5.55m, clears > 5.4m)
    // Raised service walkway with diamond plate tread and safety yellow kickplate
    const catwalkWidth = 0.35;
    const catwalkHeight = 0.95;
    const catwalkX = -wallX + 0.25;

    const catwalkSlab = new THREE.Mesh(
      new THREE.BoxGeometry(catwalkWidth, 0.18, chunkLength),
      mats.subwayCatwalkMat
    );
    catwalkSlab.position.set(catwalkX, catwalkHeight, -chunkLength * 0.5);
    catwalkSlab.receiveShadow = true;
    undergroundGroup.add(catwalkSlab);

    // Concrete foundation curb under catwalk
    const catwalkBase = new THREE.Mesh(
      new THREE.BoxGeometry(catwalkWidth, catwalkHeight - 0.09, chunkLength),
      mats.curbMat
    );
    catwalkBase.position.set(catwalkX, (catwalkHeight - 0.09) * 0.5, -chunkLength * 0.5);
    undergroundGroup.add(catwalkBase);

    // Industrial Safety Handrail along the inner edge (X = -5.50m)
    const railX = -5.50;
    const railTopBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, chunkLength),
      mats.castIronMat
    );
    railTopBar.position.set(railX, catwalkHeight + 0.95, -chunkLength * 0.5);
    undergroundGroup.add(railTopBar);

    if (detail !== 'MINIMAL') {
      const postGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.95, 6);
      for (let z = 0; z < chunkLength; z += 5) {
        const post = new THREE.Mesh(postGeo, mats.castIronMat);
        post.position.set(railX, catwalkHeight + 0.48, -z - 2.5);
        undergroundGroup.add(post);
      }

      // Recessed Maintenance Doors along left tunnel wall
      const doorGeo = new THREE.BoxGeometry(0.08, 2.4, 1.2);
      [-chunkLength * 0.3, -chunkLength * 0.7].forEach((dz) => {
        const door = new THREE.Mesh(doorGeo, mats.tunnelRibMat);
        door.position.set(-wallX + 0.28, catwalkHeight + 1.2, dz);
        undergroundGroup.add(door);

        // Emergency phone box
        const phone = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.3), mats.subwaySignalRedMat);
        phone.position.set(-wallX + 0.28, catwalkHeight + 1.6, dz + 1.2);
        undergroundGroup.add(phone);
      });
    }

    // 5. Station Concourse Platform (Right side on station chunks, X = 5.55m, clears > 5.4m)
    if (isStationHall) {
      const platW = 0.35;
      const platH = 0.95;
      const platX = wallX - 0.25;

      const platSlab = new THREE.Mesh(
        new THREE.BoxGeometry(platW, platH, chunkLength),
        mats.subwayPlatformSlabMat
      );
      platSlab.position.set(platX, platH * 0.5, -chunkLength * 0.5);
      platSlab.receiveShadow = true;
      undergroundGroup.add(platSlab);

      // Tactile warning strip on platform edge (safety yellow band)
      const warningStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.04, chunkLength),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      warningStrip.position.set(platX - platW * 0.5 + 0.04, platH + 0.02, -chunkLength * 0.5);
      undergroundGroup.add(warningStrip);

      // Platform details (benches, billboards, station clocks)
      if (detail !== 'MINIMAL') {
        // Platform Waiting Benches
        const benchGeo = new THREE.BoxGeometry(0.3, 0.45, 2.0);
        [-chunkLength * 0.25, -chunkLength * 0.5, -chunkLength * 0.75].forEach((bz) => {
          const bench = new THREE.Mesh(benchGeo, mats.modernTeakMat);
          bench.position.set(platX, platH + 0.23, bz);
          bench.castShadow = true;
          undergroundGroup.add(bench);
        });

        // Suspended Illuminated Transit Advertising Billboards along the wall
        [-chunkLength * 0.35, -chunkLength * 0.65].forEach((bz) => {
          const bb = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.2), mats.subwayBillboardMat);
          bb.rotation.y = -Math.PI / 2;
          bb.position.set(wallX - 0.28, platH + 2.4, bz);
          undergroundGroup.add(bb);
        });

        // Suspended Double-Sided Station Clock
        const clockGroup = new THREE.Group();
        clockGroup.position.set(platX, ceilingH - 1.2, -chunkLength * 0.5);
        const clockBody = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16), mats.tunnelRibMat);
        clockBody.rotation.x = Math.PI / 2;
        clockGroup.add(clockBody);

        const clockFace1 = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), mats.historicClockFaceMat);
        clockFace1.position.z = 0.11;
        clockGroup.add(clockFace1);

        const clockFace2 = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), mats.historicClockFaceMat);
        clockFace2.position.z = -0.11;
        clockFace2.rotation.y = Math.PI;
        clockGroup.add(clockFace2);

        undergroundGroup.add(clockGroup);
      }
    }

    // 6. Overhead Spiral Ventilation Ducts & Cable Conduit Trays
    const ductGeo = new THREE.CylinderGeometry(0.38, 0.38, chunkLength, 12);
    const duct = new THREE.Mesh(ductGeo, mats.subwayDuctMat);
    duct.rotation.x = Math.PI / 2;
    duct.position.set(-3.8, ceilingH - 0.7, -chunkLength * 0.5);
    duct.castShadow = true;
    undergroundGroup.add(duct);

    // Duct suspension hangers
    if (detail !== 'MINIMAL') {
      const hangerGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6);
      for (let hz = 0; hz < chunkLength; hz += 16) {
        const hanger = new THREE.Mesh(hangerGeo, mats.tunnelRibMat);
        hanger.position.set(-3.8, ceilingH - 0.35, -hz - 8);
        undergroundGroup.add(hanger);
      }
    }

    // 7. Monumental Entrance & Exit Tunnel Portals
    if (portalType === 'ENTRY' || portalType === 'BOTH') {
      this.buildSubwayPortalArch(undergroundGroup, 0, 'ENTRY', ceilingH);
    }
    if (portalType === 'EXIT' || portalType === 'BOTH') {
      this.buildSubwayPortalArch(undergroundGroup, -chunkLength, 'EXIT', ceilingH);
    }

    group.add(undergroundGroup);
  }

  /**
   * Constructs heavy reinforced-concrete subway portal gateway
   */
  private buildSubwayPortalArch(
    parent: THREE.Group,
    zPos: number,
    type: 'ENTRY' | 'EXIT',
    ceilingH: number
  ): void {
    const mats = this.getSharedMaterials();
    const portal = new THREE.Group();
    portal.position.set(0, 0, zPos);

    const wallX = CONSTANTS.TUNNEL_WALL_X;
    const spanW = wallX * 2.0;
    const portalH = ceilingH + 1.8;
    const portalDepth = 3.6;

    // Massive flanking concrete pylons
    const pylonGeo = new THREE.BoxGeometry(2.4, portalH, portalDepth);
    [-wallX - 1.1, wallX + 1.1].forEach((px) => {
      const pylon = new THREE.Mesh(pylonGeo, mats.modernConcreteMat);
      pylon.position.set(px, portalH * 0.5, 0);
      pylon.castShadow = true;
      pylon.receiveShadow = true;
      portal.add(pylon);
    });

    // Heavy overhead portal crown beam
    const crownGeo = new THREE.BoxGeometry(spanW + 4.0, 2.4, portalDepth + 0.4);
    const crown = new THREE.Mesh(crownGeo, mats.modernConcreteMat);
    crown.position.set(0, portalH - 0.2, 0);
    crown.castShadow = true;
    crown.receiveShadow = true;
    portal.add(crown);

    // Hazard stripe warning edge along portal mouth
    const hazardGeo = new THREE.BoxGeometry(spanW + 0.6, 0.45, 0.2);
    const hazard = new THREE.Mesh(hazardGeo, mats.hazardStripeMat);
    hazard.position.set(0, ceilingH + 0.1, type === 'ENTRY' ? 1.9 : -1.9);
    portal.add(hazard);

    // Red illuminated portal clearance warning beacons
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    const beaconGeo = new THREE.SphereGeometry(0.25, 8, 8);
    [-spanW * 0.42, spanW * 0.42].forEach((bx) => {
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(bx, ceilingH + 0.6, type === 'ENTRY' ? 2.0 : -2.0);
      portal.add(beacon);
    });

    parent.add(portal);
  }

  // -------------------------------------------------------------------------
  // LANDMARK ENCOUNTERS & RARE MOMENTS
  // -------------------------------------------------------------------------

  private buildLandmarkEncounter(
    landmark: LandmarkType,
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    theme: EnvironmentTheme
  ): void {
    switch (landmark) {
      case 'GRAND_RAILWAY_STATION':
        this.buildGrandRailwayStation(group, roadbedWidth, curbWidth, chunkLength, seed, detail, theme);
        break;
      case 'HISTORIC_STONE_VIADUCT':
        this.buildHistoricStoneViaduct(group, roadbedWidth, curbWidth, chunkLength, seed, detail);
        break;
      case 'MODERN_GLASS_TRANSIT_HUB':
        this.buildModernGlassTransitHub(group, roadbedWidth, curbWidth, chunkLength, seed, detail);
        break;
      case 'INDUSTRIAL_MAINTENANCE_YARD':
        this.buildIndustrialMaintenanceYard(group, roadbedWidth, curbWidth, chunkLength, seed, detail);
        break;
      case 'OPEN_WATERFRONT_VISTA':
        this.buildOpenWaterfrontVista(group, roadbedWidth, curbWidth, chunkLength, seed, detail, theme);
        break;
      case 'UNDERGROUND_GRAND_STATION':
        this.buildUndergroundGrandStation(group, roadbedWidth, curbWidth, chunkLength, seed, detail);
        break;
      case 'ROOFTOP_SKYLINE_MOMENT':
        this.buildRooftopSkylineMoment(group, roadbedWidth, curbWidth, chunkLength, seed, detail, theme);
        break;
    }
  }

  /**
   * Landmark 1: Grand Railway Station Terminal
   */
  private buildGrandRailwayStation(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    theme: EnvironmentTheme
  ): void {
    const mats = this.getSharedMaterials();
    const stationGroup = new THREE.Group();

    const wallX = roadbedWidth * 0.5 + curbWidth + 0.6; // 6.5m
    const platformW = 4.2;
    const platformH = 0.65;
    const platformX = wallX + platformW * 0.5 + 0.1; // 8.7m

    // 1. Raised Passenger Platforms (Left & Right)
    const platGeo = new THREE.BoxGeometry(platformW, platformH, chunkLength);
    [-1, 1].forEach((side) => {
      const plat = new THREE.Mesh(platGeo, mats.subwayPlatformSlabMat);
      plat.position.set(side * platformX, platformH * 0.5, -chunkLength * 0.5);
      plat.receiveShadow = true;
      stationGroup.add(plat);

      // Yellow tactile safety warning line along track edge
      const lineGeo = new THREE.BoxGeometry(0.35, 0.04, chunkLength);
      const line = new THREE.Mesh(lineGeo, mats.hazardStripeMat);
      line.position.set(side * (platformX - platformW * 0.5 + 0.2), platformH + 0.02, -chunkLength * 0.5);
      stationGroup.add(line);

      // Classical cast-iron platform columns & platform roofs
      const colGeo = new THREE.CylinderGeometry(0.22, 0.28, 4.2, 8);
      const colX = side * (platformX + 0.6);
      for (let z = -8; z >= -chunkLength + 8; z -= 16) {
        const col = new THREE.Mesh(colGeo, mats.castIronMat);
        col.position.set(colX, 2.1, z);
        col.castShadow = true;
        stationGroup.add(col);

        // Platform canopy roof above waiting area
        const canopyGeo = new THREE.BoxGeometry(platformW - 0.4, 0.25, 14.5);
        const canopy = new THREE.Mesh(canopyGeo, mats.slateRoofMat);
        canopy.position.set(side * platformX, 4.3, z);
        canopy.castShadow = true;
        stationGroup.add(canopy);

        // Platform waiting bench (High / Medium)
        if (detail !== 'MINIMAL') {
          const benchGeo = new THREE.BoxGeometry(1.4, 0.45, 0.7);
          const bench = new THREE.Mesh(benchGeo, mats.historicWaterTankWoodMat);
          bench.position.set(side * platformX, platformH + 0.25, z);
          bench.receiveShadow = true;
          stationGroup.add(bench);
        }
      }
    });

    // 2. Monumental Overhead Barrel Vault Arches & Canopy
    // Crown apex: Y = 22.3m, springing line clearance: Y = 8.8m (well above 7.6m jump apex)
    const spanW = 27.0;
    const archSpringY = 8.8;
    for (let z = -10; z >= -chunkLength + 10; z -= 18) {
      // Arched cross truss rib
      const ribGeo = new THREE.CylinderGeometry(spanW * 0.5, spanW * 0.5, 0.8, 16, 1, true, 0, Math.PI);
      const rib = new THREE.Mesh(ribGeo, mats.industrialSteelMat);
      rib.rotation.z = Math.PI / 2;
      rib.rotation.y = Math.PI / 2;
      rib.position.set(0, archSpringY, z);
      stationGroup.add(rib);

      // Flanking support columns at outer station perimeter (X = ±13.5m)
      [-spanW * 0.5, spanW * 0.5].forEach((cx) => {
        const pier = new THREE.Mesh(new THREE.BoxGeometry(0.8, archSpringY, 0.8), mats.industrialSteelMat);
        pier.position.set(cx, archSpringY * 0.5, z);
        stationGroup.add(pier);
      });
    }

    // Glass vaulted skylight roof
    const roofGeo = new THREE.CylinderGeometry(spanW * 0.5 - 0.1, spanW * 0.5 - 0.1, chunkLength - 4, 16, 1, true, 0, Math.PI);
    const roof = new THREE.Mesh(roofGeo, mats.spaceFrameGlassMat);
    roof.rotation.z = Math.PI / 2;
    roof.rotation.y = Math.PI / 2;
    roof.position.set(0, archSpringY, -chunkLength * 0.5);
    stationGroup.add(roof);

    // 3. Grand Entrance Crossover Bridge & Sign
    // Overhead bridge at Z = -40m with clearance at Y = 9.2m
    const bridgeGeo = new THREE.BoxGeometry(spanW + 2, 2.2, 8.0);
    const bridge = new THREE.Mesh(bridgeGeo, mats.stoneMasonryMat);
    bridge.position.set(0, 10.3, -40);
    bridge.castShadow = true;
    stationGroup.add(bridge);

    // Monumental Terminal Sign facing oncoming runners
    const signGeo = new THREE.PlaneGeometry(16.0, 3.2);
    const signMesh = new THREE.Mesh(signGeo, mats.grandStationSignMat);
    signMesh.position.set(0, 10.3, -35.9);
    stationGroup.add(signMesh);

    // Illuminated golden terminal clock above bridge center
    const clockGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.4, 24);
    const clock = new THREE.Mesh(clockGeo, mats.historicClockFaceMat);
    clock.rotation.x = Math.PI / 2;
    clock.position.set(0, 12.8, -35.8);
    stationGroup.add(clock);

    // Ornate gold clock bezel ring
    const bezelGeo = new THREE.TorusGeometry(1.7, 0.18, 12, 32);
    const bezel = new THREE.Mesh(bezelGeo, mats.goldFiligreeMat);
    bezel.position.set(0, 12.8, -35.75);
    stationGroup.add(bezel);

    group.add(stationGroup);
  }

  /**
   * Landmark 2: Historic Monumental Stone Viaduct & Aqueduct
   */
  private buildHistoricStoneViaduct(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const viaductGroup = new THREE.Group();

    // Regular retaining walls along track
    const wallX = roadbedWidth * 0.5 + curbWidth + 0.6;
    const wallGeo = new THREE.BoxGeometry(0.8, 2.5, chunkLength);
    [-1, 1].forEach((side) => {
      const wall = new THREE.Mesh(wallGeo, mats.stoneMasonryMat);
      wall.position.set(side * wallX, 1.25, -chunkLength * 0.5);
      wall.receiveShadow = true;
      viaductGroup.add(wall);
    });

    // Colossal Multi-Arch Stone Viaduct Crossing Overhead at Z = -40m
    // Clearance: Y = 9.8m, Top deck: Y = 14.5m
    const bridgeZ = -40;
    const bridgeThick = 9.0;
    const spanW = 28.0;

    // Heavy rusticated stone piers outside active lanes
    const bridgeHeight = 16.5;
    const pierGeo = new THREE.BoxGeometry(2.4, bridgeHeight, bridgeThick);
    [-12.0, -7.2, 7.2, 12.0].forEach((px) => {
      const pier = new THREE.Mesh(pierGeo, mats.stoneMasonryMat);
      pier.position.set(px, bridgeHeight * 0.5, bridgeZ);
      pier.castShadow = true;
      pier.receiveShadow = true;
      viaductGroup.add(pier);
    });

    // Central Arch Over Tracks (Clearance Y = 8.8m at springing line, apex Y = 15.6m)
    const archRadius = 6.8;
    const archGeo = new THREE.CylinderGeometry(archRadius, archRadius, bridgeThick, 20, 1, true, 0, Math.PI);
    const arch = new THREE.Mesh(archGeo, mats.stoneMasonryMat);
    arch.rotation.z = Math.PI / 2;
    arch.rotation.y = Math.PI / 2;
    arch.position.set(0, 8.8, bridgeZ);
    viaductGroup.add(arch);

    // Upper Spandrel & Roadway Deck
    const deckGeo = new THREE.BoxGeometry(spanW + 8, 3.2, bridgeThick);
    const deck = new THREE.Mesh(deckGeo, mats.stoneMasonryMat);
    deck.position.set(0, bridgeHeight, bridgeZ);
    deck.castShadow = true;
    viaductGroup.add(deck);

    // Classical Stone Balustrade and Antique Gas Lanterns
    const balustradeGeo = new THREE.BoxGeometry(spanW + 8, 1.1, 0.4);
    [-bridgeThick * 0.45, bridgeThick * 0.45].forEach((bz) => {
      const bal = new THREE.Mesh(balustradeGeo, mats.stoneMasonryMat);
      bal.position.set(0, bridgeHeight + 2.1, bridgeZ + bz);
      viaductGroup.add(bal);

      // Gas lamps along viaduct balustrade
      [-10, 0, 10].forEach((lx) => {
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.6, 6), mats.castIronMat);
        lamp.position.set(lx, bridgeHeight + 3.2, bridgeZ + bz);
        viaductGroup.add(lamp);

        const globe = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), mats.gasLampMat);
        globe.position.set(lx, bridgeHeight + 4.1, bridgeZ + bz);
        viaductGroup.add(globe);
      });
    });

    // Flanking Industrial Brick Chimney (Right side: X = +14.5m)
    const chimneyH = 36.0;
    const chimneyGeo = new THREE.CylinderGeometry(1.6, 2.5, chimneyH, 12);
    const chimney = new THREE.Mesh(chimneyGeo, mats.weatheredBrickMat1);
    chimney.position.set(14.5, chimneyH * 0.5, -25);
    chimney.castShadow = true;
    viaductGroup.add(chimney);

    // Chimney crown ring
    const crown = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.25, 8, 16), mats.castIronMat);
    crown.rotation.x = Math.PI / 2;
    crown.position.set(14.5, chimneyH, -25);
    viaductGroup.add(crown);

    group.add(viaductGroup);
  }

  /**
   * Landmark 3: Modern Glass Transit Hub Space-Frame
   */
  private buildModernGlassTransitHub(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const hubGroup = new THREE.Group();

    const wallX = roadbedWidth * 0.5 + curbWidth + 0.6;

    // Polished concrete retaining walls with glowing cyan LED base strips
    const wallGeo = new THREE.BoxGeometry(0.6, 2.2, chunkLength);
    [-1, 1].forEach((side) => {
      const wall = new THREE.Mesh(wallGeo, mats.modernConcreteMat);
      wall.position.set(side * wallX, 1.1, -chunkLength * 0.5);
      wall.receiveShadow = true;
      hubGroup.add(wall);

      // Cyan LED guidance strip
      const ledGeo = new THREE.BoxGeometry(0.1, 0.15, chunkLength);
      const led = new THREE.Mesh(ledGeo, mats.modernNeonMat);
      led.position.set(side * (wallX - 0.28), 1.8, -chunkLength * 0.5);
      hubGroup.add(led);
    });

    // Sweeping Futuristic Space-Frame Glass Wings Overhead
    // Clearance at apex: Y = 12.5m, eaves: Y = 9.8m
    const wingW = 14.0;
    const wingH = 12.0;
    [-1, 1].forEach((side) => {
      // Angled glass space-frame roof
      const canopyGeo = new THREE.PlaneGeometry(wingW, chunkLength);
      const canopy = new THREE.Mesh(canopyGeo, mats.spaceFrameGlassMat);
      canopy.position.set(side * 8.5, wingH, -chunkLength * 0.5);
      canopy.rotation.x = Math.PI / 2;
      canopy.rotation.y = side * 0.25; // Gentle upward slope
      hubGroup.add(canopy);

      // Angled steel support pylons (X = side * 10.5m)
      const pylonGeo = new THREE.CylinderGeometry(0.35, 0.5, 14.0, 8);
      for (let z = -12; z >= -chunkLength + 12; z -= 24) {
        const pylon = new THREE.Mesh(pylonGeo, mats.modernSteelMat);
        pylon.position.set(side * 10.5, 7.0, z);
        pylon.rotation.z = -side * 0.15;
        pylon.castShadow = true;
        hubGroup.add(pylon);
      }
    });

    // High-Tech Elevated Mezzanine Skybridge at Z = -40m (Clearance Y = 10.0m)
    const bridgeGeo = new THREE.BoxGeometry(26.0, 1.8, 6.0);
    const bridge = new THREE.Mesh(bridgeGeo, mats.modernConcreteMat);
    bridge.position.set(0, 10.8, -40);
    bridge.castShadow = true;
    hubGroup.add(bridge);

    // Transparent Tinted Glass Balustrade
    const glassBalGeo = new THREE.BoxGeometry(26.0, 1.2, 0.15);
    [-2.8, 2.8].forEach((bz) => {
      const gBal = new THREE.Mesh(glassBalGeo, mats.modernGlassBridgeMat);
      gBal.position.set(0, 12.3, -40 + bz);
      hubGroup.add(gBal);
    });

    // Digital Transit Indicator Screen on skybridge
    const screenGeo = new THREE.PlaneGeometry(12.0, 1.6);
    const screen = new THREE.Mesh(screenGeo, mats.modernSignMat);
    screen.position.set(0, 10.8, -36.9);
    hubGroup.add(screen);

    // Vertical Glass Elevator Shafts outside track envelope (X = ±9.5m)
    [-1, 1].forEach((side) => {
      const elevGeo = new THREE.BoxGeometry(2.4, 20.0, 2.4);
      const elev = new THREE.Mesh(elevGeo, mats.spaceFrameGlassMat);
      elev.position.set(side * 9.5, 10.0, -40);
      elev.castShadow = true;
      hubGroup.add(elev);

      // Glowing elevator cab inside
      const cabGeo = new THREE.BoxGeometry(1.8, 2.5, 1.8);
      const cab = new THREE.Mesh(cabGeo, mats.modernNeonMat);
      cab.position.set(side * 9.5, 7.5, -40);
      hubGroup.add(cab);
    });

    group.add(hubGroup);
  }

  /**
   * Landmark 4: Heavy Industrial Rail Maintenance Depot
   */
  private buildIndustrialMaintenanceYard(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const yardGroup = new THREE.Group();

    const wallX = roadbedWidth * 0.5 + curbWidth + 0.6;

    // Heavy weathered retaining walls
    const wallGeo = new THREE.BoxGeometry(0.7, 2.4, chunkLength);
    [-1, 1].forEach((side) => {
      const wall = new THREE.Mesh(wallGeo, mats.industrialConcreteMat);
      wall.position.set(side * wallX, 1.2, -chunkLength * 0.5);
      wall.receiveShadow = true;
      yardGroup.add(wall);
    });

    // 1. Colossal Industrial Gantry Crane at Z = -40m (Clearance Y = 10.0m)
    const craneZ = -40;
    const spanW = 24.0;
    const craneH = 12.8;

    // Steel truss crossbeam
    const beamGeo = new THREE.BoxGeometry(spanW + 4, 1.4, 1.6);
    const beam = new THREE.Mesh(beamGeo, mats.industrialSteelMat);
    beam.position.set(0, craneH, craneZ);
    beam.castShadow = true;
    yardGroup.add(beam);

    // Yellow hazard warning stripe along crossbeam
    const chevronGeo = new THREE.BoxGeometry(spanW + 4, 0.4, 1.65);
    const chevron = new THREE.Mesh(chevronGeo, mats.hazardChevronMat);
    chevron.position.set(0, craneH - 0.45, craneZ);
    yardGroup.add(chevron);

    // Crane vertical legs at X = ±11.5m
    const legGeo = new THREE.BoxGeometry(1.2, craneH, 1.4);
    [-spanW * 0.5, spanW * 0.5].forEach((lx) => {
      const leg = new THREE.Mesh(legGeo, mats.industrialSteelMat);
      leg.position.set(lx, craneH * 0.5, craneZ);
      leg.castShadow = true;
      yardGroup.add(leg);
    });

    // Crane Hoist Trolley & Hook (Offset to X = +3.5m over track lane 2)
    const trolleyGeo = new THREE.BoxGeometry(2.0, 0.8, 1.8);
    const trolley = new THREE.Mesh(trolleyGeo, mats.rustIronMat);
    trolley.position.set(3.5, craneH - 0.8, craneZ);
    yardGroup.add(trolley);

    // Hoist cable & Hook (Suspended safely at Y = 8.5m > 7.6m apex)
    const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6);
    const cable = new THREE.Mesh(cableGeo, mats.cableMat);
    cable.position.set(3.5, craneH - 1.8, craneZ);
    yardGroup.add(cable);

    const hookGeo = new THREE.TorusGeometry(0.35, 0.08, 6, 12, Math.PI * 1.5);
    const hook = new THREE.Mesh(hookGeo, mats.castIronMat);
    hook.position.set(3.5, craneH - 2.8, craneZ);
    yardGroup.add(hook);

    // 2. Corrugated Metal Repair Shed (Left side: X = -13.5m)
    const shedW = 10.0;
    const shedH = 7.5;
    const shedGeo = new THREE.BoxGeometry(shedW, shedH, 28.0);
    const shed = new THREE.Mesh(shedGeo, mats.industrialCorrugatedSheetMat);
    shed.position.set(-13.5, shedH * 0.5, -35);
    shed.castShadow = true;
    yardGroup.add(shed);

    // 3. Parked Heavy Switcher Locomotive on Siding (Right side: X = +9.5m, Z = -35m)
    // Strictly outside hazard envelope (|X| = 9.5m > 5.5m)
    const locoGroup = new THREE.Group();
    locoGroup.position.set(9.5, 0, -35);

    // Locomotive main chassis
    const chassisGeo = new THREE.BoxGeometry(2.6, 2.2, 12.0);
    const chassis = new THREE.Mesh(chassisGeo, mats.hazardChevronMat);
    chassis.position.y = 1.6;
    chassis.castShadow = true;
    locoGroup.add(chassis);

    // Locomotive engineer cab
    const cabGeo = new THREE.BoxGeometry(2.5, 2.2, 4.0);
    const cab = new THREE.Mesh(cabGeo, mats.industrialSteelMat);
    cab.position.set(0, 3.2, 2.5);
    cab.castShadow = true;
    locoGroup.add(cab);

    // Locomotive headlights
    const lightGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.2, 8);
    [-0.8, 0.8].forEach((lx) => {
      const light = new THREE.Mesh(lightGeo, mats.sodiumLampMat);
      light.rotation.x = Math.PI / 2;
      light.position.set(lx, 2.0, -6.0);
      locoGroup.add(light);
    });

    yardGroup.add(locoGroup);

    // 4. Industrial Prop Details: Wheelset racks & Floodlight Tower
    if (detail !== 'MINIMAL') {
      const towerGeo = new THREE.CylinderGeometry(0.3, 0.6, 14.0, 8);
      const tower = new THREE.Mesh(towerGeo, mats.industrialSteelMat);
      tower.position.set(13.0, 7.0, -12);
      tower.castShadow = true;
      yardGroup.add(tower);

      const lampGeo = new THREE.BoxGeometry(1.6, 0.8, 0.6);
      const lamp = new THREE.Mesh(lampGeo, mats.sodiumLampMat);
      lamp.position.set(13.0, 14.0, -12);
      yardGroup.add(lamp);
    }

    group.add(yardGroup);
  }

  /**
   * Landmark 5: Open Waterfront Vista & Harbor Suspension Bridge
   */
  private buildOpenWaterfrontVista(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    theme: EnvironmentTheme
  ): void {
    const mats = this.getSharedMaterials();
    const waterGroup = new THREE.Group();

    const wallX = roadbedWidth * 0.5 + curbWidth + 0.6;

    // Left retaining wall (City side continues normally)
    const leftWallGeo = new THREE.BoxGeometry(0.8, 2.6, chunkLength);
    const leftWall = new THREE.Mesh(leftWallGeo, mats.stoneMasonryMat);
    leftWall.position.set(-wallX, 1.3, -chunkLength * 0.5);
    leftWall.receiveShadow = true;
    waterGroup.add(leftWall);

    // Left side coastal embankment buildings
    const bW = 14.0, bH = 28.0, bD = Math.min(60.0, chunkLength - 8.0);
    const coastalBuildingGeo = new THREE.BoxGeometry(bW, bH, bD);
    const coastalBuilding = new THREE.Mesh(coastalBuildingGeo, mats.modernCurtainGlassMat);
    coastalBuilding.position.set(-wallX - 8.0, bH * 0.5, -chunkLength * 0.5);
    coastalBuilding.castShadow = true;
    coastalBuilding.receiveShadow = true;
    waterGroup.add(coastalBuilding);

    // RIGHT SIDE OPENS COMPLETELY TO THE OCEAN WATERFRONT!
    // Low decorative stone promenade seawall (Y = 0.9m)
    const seaWallGeo = new THREE.BoxGeometry(0.6, 0.9, chunkLength);
    const seaWall = new THREE.Mesh(seaWallGeo, mats.stoneMasonryMat);
    seaWall.position.set(wallX, 0.45, -chunkLength * 0.5);
    seaWall.receiveShadow = true;
    waterGroup.add(seaWall);

    // Cast-iron maritime promenade railing
    const railGeo = new THREE.BoxGeometry(0.12, 0.6, chunkLength);
    const rail = new THREE.Mesh(railGeo, mats.castIronMat);
    rail.position.set(wallX, 1.15, -chunkLength * 0.5);
    waterGroup.add(rail);

    // Maritime Bollards along promenade
    const bollardGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.7, 8);
    for (let z = -6; z >= -chunkLength + 6; z -= 14) {
      const bollard = new THREE.Mesh(bollardGeo, mats.marineBollardMat);
      bollard.position.set(wallX + 0.5, 0.35, z);
      waterGroup.add(bollard);
    }

    // Vast Reflective Water Plane extending to the horizon (X = 6.5m to 120m)
    const waterW = 110.0;
    const waterGeo = new THREE.PlaneGeometry(waterW, chunkLength + 40);
    const water = new THREE.Mesh(waterGeo, mats.waterfrontRipplesMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(wallX + waterW * 0.5, -0.45, -chunkLength * 0.5);
    waterGroup.add(water);

    // Distant Twin Suspension Bridge Silhouette Across Harbor (X = +55m, Z = -110m)
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(55.0, 0, -110);

    const towerH = 38.0;
    const towerGeo = new THREE.BoxGeometry(3.0, towerH, 3.0);
    [-14.0, 14.0].forEach((tx) => {
      const tower = new THREE.Mesh(towerGeo, mats.industrialSteelMat);
      tower.position.set(tx, towerH * 0.5, 0);
      bridgeGroup.add(tower);

      // Cross struts
      const strut = new THREE.Mesh(new THREE.BoxGeometry(tx === -14.0 ? 28.0 : 0.1, 1.2, 1.2), mats.industrialSteelMat);
      strut.position.set(0, towerH * 0.7, 0);
      bridgeGroup.add(strut);
    });

    // Suspension bridge vehicle deck
    const deckGeo = new THREE.BoxGeometry(60.0, 1.6, 6.0);
    const deck = new THREE.Mesh(deckGeo, mats.modernConcreteMat);
    deck.position.set(0, 12.0, 0);
    bridgeGroup.add(deck);

    waterGroup.add(bridgeGroup);

    // Harbor Lighthouse (X = +35m, Z = -35m)
    const lighthouseGroup = new THREE.Group();
    lighthouseGroup.position.set(35.0, 0, -35);

    const lightH = 18.0;
    // Striped lighthouse tower
    const lhBase = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 3.2, lightH * 0.5, 12), mats.whiteEnamelMat);
    lhBase.position.y = lightH * 0.25;
    lighthouseGroup.add(lhBase);

    const lhMid = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, lightH * 0.5, 12), mats.lighthouseRedMat);
    lhMid.position.y = lightH * 0.75;
    lighthouseGroup.add(lhMid);

    // Glowing lantern room
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.2, 12), mats.gasLampMat);
    lantern.position.y = lightH + 1.1;
    lighthouseGroup.add(lantern);

    waterGroup.add(lighthouseGroup);

    group.add(waterGroup);
  }

  /**
   * Landmark 6: Subterranean Grand Concourse Vault
   */
  private buildUndergroundGrandStation(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const stationGroup = new THREE.Group();

    const wallX = roadbedWidth * 0.5 + curbWidth + 0.6; // 6.5m
    const platformW = 4.0;
    const platformH = 0.65;
    const platformX = wallX + platformW * 0.5; // 8.5m

    // 1. Raised Terrazzo Passenger Platforms with Yellow Tactile Warning Edge
    const platGeo = new THREE.BoxGeometry(platformW, platformH, chunkLength);
    [-1, 1].forEach((side) => {
      const plat = new THREE.Mesh(platGeo, mats.subwayPlatformSlabMat);
      plat.position.set(side * platformX, platformH * 0.5, -chunkLength * 0.5);
      plat.receiveShadow = true;
      stationGroup.add(plat);

      const tactileGeo = new THREE.BoxGeometry(0.35, 0.04, chunkLength);
      const tactile = new THREE.Mesh(tactileGeo, mats.hazardStripeMat);
      tactile.position.set(side * (platformX - platformW * 0.5 + 0.18), platformH + 0.02, -chunkLength * 0.5);
      stationGroup.add(tactile);

      // Station benches along platform
      for (let z = -12; z >= -chunkLength + 12; z -= 20) {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.7), mats.historicWaterTankWoodMat);
        bench.position.set(side * (platformX + 0.5), platformH + 0.25, z);
        stationGroup.add(bench);
      }
    });

    // 2. Colossal Subterranean Vaulted Ceiling (Clearance Y = 8.8m at springing line, apex Y = 23.3m)
    const vaultRadius = 14.5;
    const vaultGeo = new THREE.CylinderGeometry(vaultRadius, vaultRadius, chunkLength, 24, 1, true, 0, Math.PI);
    const vault = new THREE.Mesh(vaultGeo, mats.tunnelCeilingMat);
    vault.rotation.z = Math.PI / 2;
    vault.rotation.y = Math.PI / 2;
    vault.position.set(0, 8.8, -chunkLength * 0.5);
    stationGroup.add(vault);

    // 3. Ornate Bronze Chandelier Ring Fixtures (Suspended at Y = 9.2m > 8.6m envelope)
    for (let z = -16; z >= -chunkLength + 16; z -= 24) {
      // Suspension stem
      const stemGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6);
      const stem = new THREE.Mesh(stemGeo, mats.castIronMat);
      stem.position.set(0, 10.7, z);
      stationGroup.add(stem);

      // Chandelier ring
      const ringGeo = new THREE.TorusGeometry(2.2, 0.16, 8, 24);
      const ring = new THREE.Mesh(ringGeo, mats.goldFiligreeMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 9.4, z);
      stationGroup.add(ring);

      // Glowing chandelier core
      const coreGeo = new THREE.SphereGeometry(0.5, 8, 8);
      const core = new THREE.Mesh(coreGeo, mats.tunnelLampMat);
      core.position.set(0, 9.4, z);
      stationGroup.add(core);
    }

    // 4. Royal Cobalt Blue & Gold Leaf Mosaic Murals along side walls
    const muralGeo = new THREE.PlaneGeometry(24.0, 5.0);
    [-1, 1].forEach((side) => {
      const mural = new THREE.Mesh(muralGeo, mats.undergroundCathedralMuralMat);
      mural.position.set(side * (platformX + platformW * 0.5 - 0.05), 3.8, -chunkLength * 0.5);
      mural.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
      stationGroup.add(mural);
    });

    // 5. Overhead Grand Mezzanine Balcony at Z = -40m (Clearance Y = 9.8m)
    const mezzGeo = new THREE.BoxGeometry(25.0, 1.4, 6.0);
    const mezz = new THREE.Mesh(mezzGeo, mats.stoneMasonryMat);
    mezz.position.set(0, 10.5, -40);
    mezz.castShadow = true;
    stationGroup.add(mezz);

    // Brass balustrade along mezzanine
    const mezzRailGeo = new THREE.BoxGeometry(25.0, 1.0, 0.12);
    [-2.8, 2.8].forEach((bz) => {
      const rail = new THREE.Mesh(mezzRailGeo, mats.goldFiligreeMat);
      rail.position.set(0, 11.7, -40 + bz);
      stationGroup.add(rail);
    });

    group.add(stationGroup);
  }

  /**
   * Landmark 7: Rooftop Skyline Moment & Panoramic Elevated Viaduct
   */
  private buildRooftopSkylineMoment(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    theme: EnvironmentTheme
  ): void {
    const mats = this.getSharedMaterials();
    const roofGroup = new THREE.Group();

    const wallX = roadbedWidth * 0.5 + curbWidth + 0.6;

    // Side retaining walls drop to low safety crash barrier (Y = 0.8m)
    // Opening up panoramic view of the cityscape below
    const barrierGeo = new THREE.BoxGeometry(0.4, 0.8, chunkLength);
    [-1, 1].forEach((side) => {
      const barrier = new THREE.Mesh(barrierGeo, mats.modernConcreteMat);
      barrier.position.set(side * wallX, 0.4, -chunkLength * 0.5);
      barrier.receiveShadow = true;
      roofGroup.add(barrier);

      // Sleek brushed aluminum safety top rail
      const railGeo = new THREE.CylinderGeometry(0.08, 0.08, chunkLength, 8);
      const rail = new THREE.Mesh(railGeo, mats.modernSteelMat);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(side * wallX, 0.85, -chunkLength * 0.5);
      roofGroup.add(rail);
    });

    // Elevated Skyway Suspension Pylons at ends (Z = -4m and Z = -chunkLength + 4m)
    [-4, -chunkLength + 4].forEach((pz) => {
      [-wallX - 2.5, wallX + 2.5].forEach((px) => {
        const pylonGeo = new THREE.CylinderGeometry(0.35, 0.5, 18.0, 8);
        const pylon = new THREE.Mesh(pylonGeo, mats.modernSteelMat);
        pylon.position.set(px, 9.0, pz);
        pylon.castShadow = true;
        roofGroup.add(pylon);

        // Angled stay cables stretching down along viaduct deck outer flank
        const stayGeo = new THREE.CylinderGeometry(0.03, 0.03, 14.0, 6);
        const stay = new THREE.Mesh(stayGeo, mats.cableMat);
        stay.position.set(px, 8.0, pz + (pz < -20 ? -6 : 6));
        stay.rotation.x = pz < -20 ? -0.4 : 0.4;
        roofGroup.add(stay);
      });
    });

    // Distant City Towers rising from below track elevation (Y = -25m up to -1.5m)
    // Giving an unforgettable impression of traveling high on an elevated railway
    const rng = new SeededRandom(seed + 999);
    [-1, 1].forEach((side) => {
      for (let z = -10; z >= -chunkLength + 10; z -= 26) {
        const bW = rng.range(12, 18);
        const bD = rng.range(14, 22);
        const bH = rng.range(16, 24); // Rises from Y = -26 to Y = -2
        const bX = side * (wallX + 10.0 + bW * 0.5);

        const towerGeo = new THREE.BoxGeometry(bW, bH, bD);
        const tower = new THREE.Mesh(towerGeo, mats.modernCurtainGlassMat);
        tower.position.set(bX, -bH * 0.5 - 1.0, z);
        tower.castShadow = true;
        roofGroup.add(tower);
      }
    });

    group.add(roofGroup);
  }

  // -------------------------------------------------------------------------
  // SMALL MOMENTS & ATMOSPHERIC SURPRISES
  // -------------------------------------------------------------------------

  private buildSmallMoment(
    moment: SmallMomentType,
    group: THREE.Group,
    chunkLength: number,
    seed: number
  ): void {
    switch (moment) {
      case 'PASSING_BACKGROUND_TRAIN':
        this.buildPassingBackgroundTrain(group, chunkLength, seed);
        break;
      case 'DISTANT_BIRDS_FLOCK':
        this.buildDistantBirdsFlock(group, chunkLength, seed);
        break;
      case 'ILLUMINATED_SUBWAY_HALO':
        this.buildIlluminatedSubwayHalo(group, chunkLength, seed);
        break;
    }
  }

  /**
   * Distant passing passenger train on parallel outer track (X = ±13.5m, well outside 5.5m hazard envelope)
   */
  private buildPassingBackgroundTrain(group: THREE.Group, chunkLength: number, seed: number): void {
    const mats = this.getSharedMaterials();
    const trainGroup = new THREE.Group();
    const side = (seed % 2 === 0) ? 1 : -1;
    trainGroup.position.set(side * 13.5, 0.4, -chunkLength * 0.5);

    // Locomotive + 2 passenger cars (Total length 34m)
    const carLen = 10.5;
    const carH = 3.2;
    const carW = 2.4;

    for (let c = 0; c < 3; c++) {
      const zOffset = (c - 1) * (carLen + 0.8);
      const carGeo = new THREE.BoxGeometry(carW, carH, carLen);
      const carMat = (c === 0) ? mats.hazardChevronMat : mats.modernWhiteMat;
      const car = new THREE.Mesh(carGeo, carMat);
      car.position.set(0, carH * 0.5, zOffset);
      trainGroup.add(car);

      // Glowing interior passenger window strip
      const winGeo = new THREE.BoxGeometry(carW + 0.08, 0.7, carLen - 1.2);
      const win = new THREE.Mesh(winGeo, mats.sodiumLampMat);
      win.position.set(0, carH * 0.65, zOffset);
      trainGroup.add(win);
    }

    group.add(trainGroup);
  }

  /**
   * Stylized low-poly birds flock banking across upper skyline (Y = 28m to 34m)
   */
  private buildDistantBirdsFlock(group: THREE.Group, chunkLength: number, seed: number): void {
    const mats = this.getSharedMaterials();
    const flockGroup = new THREE.Group();
    const rng = new SeededRandom(seed);
    const startX = rng.range(-15, 15);
    const startY = rng.range(28, 35);

    // 6 birds in V-formation
    const birdGeo = new THREE.ConeGeometry(0.35, 1.2, 4);
    birdGeo.rotateX(Math.PI / 2);
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });

    for (let i = 0; i < 6; i++) {
      const bird = new THREE.Mesh(birdGeo, birdMat);
      const row = Math.floor(i / 2);
      const wingSide = (i % 2 === 0) ? -1 : 1;
      bird.position.set(
        startX + wingSide * row * 2.2,
        startY + Math.sin(row) * 0.8,
        -15 - row * 3.5
      );
      bird.rotation.z = wingSide * 0.2;
      flockGroup.add(bird);
    }

    group.add(flockGroup);
  }

  /**
   * Illuminated subterranean station lantern halos
   */
  private buildIlluminatedSubwayHalo(group: THREE.Group, chunkLength: number, seed: number): void {
    const mats = this.getSharedMaterials();
    const haloGroup = new THREE.Group();

    // Halo glow spheres along tunnel ceiling
    for (let z = -12; z >= -chunkLength + 12; z -= 24) {
      const haloGeo = new THREE.SphereGeometry(0.8, 8, 8);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0.35
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.set(0, 8.2, z);
      haloGroup.add(halo);
    }

    group.add(haloGroup);
  }
}
