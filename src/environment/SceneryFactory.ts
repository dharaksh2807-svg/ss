import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { CurvedShaderManager } from '../scene/CurvedShader';
import { TextureGenerator } from '../scene/TextureGenerator';
import { EnvironmentTheme, EnvironmentId } from './EnvironmentConfig';
import { LandmarkType, SmallMomentType } from './EnvironmentalEncounterDirector';
import { SceneryPool } from './SceneryPool';
import { VipSatireWorldBuilder } from './VipSatireWorldBuilder';
import { RahulSatireWorldBuilder } from './worlds/rahulverse/RahulSatireWorldBuilder';
import { MidnightVelvetWorldBuilder } from './worlds/midnightVelvet/MidnightVelvetWorldBuilder';
import { ChronoKingdomWorldBuilder } from './worlds/chronoKingdom/ChronoKingdomWorldBuilder';
import { InfernoExpressWorldBuilder } from './worlds/infernoExpress/InfernoExpressWorldBuilder';
import { JurassicRushWorldBuilder } from './worlds/jurassicRush/JurassicRushWorldBuilder';
import { VivaHeatWorldBuilder } from './worlds/vivaHeat/VivaHeatWorldBuilder';

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
    // Neon Rainline Premium Scenery Materials
    neonRainAlloyMat: THREE.MeshStandardMaterial;
    neonRainGlassMat: THREE.MeshStandardMaterial;
    neonRainFacadeMat1: THREE.MeshStandardMaterial;
    neonRainFacadeMat2: THREE.MeshStandardMaterial;
    neonCyanGlowMat: THREE.MeshBasicMaterial;
    neonMagentaGlowMat: THREE.MeshBasicMaterial;
    neonVioletGlowMat: THREE.MeshBasicMaterial;
    neonWhiteLedMat: THREE.MeshBasicMaterial;
    neonHoloAdMat1: THREE.MeshBasicMaterial;
    neonHoloAdMat2: THREE.MeshBasicMaterial;
    neonHoloAdMat3: THREE.MeshBasicMaterial;
    neonTransitSignMat: THREE.MeshBasicMaterial;
    neonWetBallastMat: THREE.MeshStandardMaterial;
    // Orbital Halo Premium Scenery Materials
    orbitalWhiteCompositeMat: THREE.MeshStandardMaterial;
    orbitalTitaniumMat: THREE.MeshStandardMaterial;
    orbitalGraphiteMat: THREE.MeshStandardMaterial;
    orbitalCyanGlowMat: THREE.MeshBasicMaterial;
    orbitalBlueGlowMat: THREE.MeshBasicMaterial;
    orbitalObservationGlassMat: THREE.MeshStandardMaterial;
    orbitalSolarMat: THREE.MeshStandardMaterial;
    orbitalHoloSignMat1: THREE.MeshBasicMaterial;
    orbitalHoloSignMat2: THREE.MeshBasicMaterial;
    orbitalHoloSignMat3: THREE.MeshBasicMaterial;
    orbitalTransitSignMat: THREE.MeshBasicMaterial;
    orbitalGuidewayDeckMat: THREE.MeshStandardMaterial;
    // Abyssal Glassline Premium Scenery Materials
    abyssalGlassTunnelMat: THREE.MeshStandardMaterial;
    abyssalTitaniumRibMat: THREE.MeshStandardMaterial;
    abyssalHydroBrassMat: THREE.MeshStandardMaterial;
    abyssalNavyCompositeMat: THREE.MeshStandardMaterial;
    abyssalBioTealGlowMat: THREE.MeshBasicMaterial;
    abyssalBioCyanGlowMat: THREE.MeshBasicMaterial;
    abyssalBioAmberGlowMat: THREE.MeshBasicMaterial;
    abyssalBioMagentaGlowMat: THREE.MeshBasicMaterial;
    abyssalBasaltRockMat: THREE.MeshStandardMaterial;
    abyssalCoralMat: THREE.MeshStandardMaterial;
    abyssalHoloSignMat1: THREE.MeshBasicMaterial;
    abyssalHoloSignMat2: THREE.MeshBasicMaterial;
    abyssalHoloSignMat3: THREE.MeshBasicMaterial;
    abyssalTransitSignMat: THREE.MeshBasicMaterial;
    abyssalGuidewayDeckMat: THREE.MeshStandardMaterial;
    // Doomsday: Last Transit Premium Scenery Materials
    doomsdayScorchedConcreteMat: THREE.MeshStandardMaterial;
    doomsdayRustedSteelMat: THREE.MeshStandardMaterial;
    doomsdayBlastAlloyMat: THREE.MeshStandardMaterial;
    doomsdayRebarSteelMat: THREE.MeshStandardMaterial;
    doomsdayShatteredGlassMat: THREE.MeshStandardMaterial;
    doomsdayAshBasaltMat: THREE.MeshStandardMaterial;
    doomsdayHazardStripeMat: THREE.MeshStandardMaterial;
    doomsdayMoltenGlowMat: THREE.MeshBasicMaterial;
    doomsdayFireAmberGlowMat: THREE.MeshBasicMaterial;
    doomsdayEmergencyRedGlowMat: THREE.MeshBasicMaterial;
    doomsdayDistressSignMat1: THREE.MeshBasicMaterial;
    doomsdayDistressSignMat2: THREE.MeshBasicMaterial;
    doomsdayDistressSignMat3: THREE.MeshBasicMaterial;
    doomsdayBillboardMat1: THREE.MeshBasicMaterial;
    doomsdayBillboardMat2: THREE.MeshBasicMaterial;
    // Phantom Line: Ghost Horror Premium Scenery Materials
    phantomDecayedTileMat: THREE.MeshStandardMaterial;
    phantomRustedIronMat: THREE.MeshStandardMaterial;
    phantomWeatheredBrickMat: THREE.MeshStandardMaterial;
    phantomOxidizedCopperMat: THREE.MeshStandardMaterial;
    phantomDecayedWoodMat: THREE.MeshStandardMaterial;
    phantomWaterMirrorMat: THREE.MeshStandardMaterial;
    phantomColdFluorescentMat: THREE.MeshBasicMaterial;
    phantomSpectralGlowCyanMat: THREE.MeshBasicMaterial;
    phantomSpectralGlowMintMat: THREE.MeshBasicMaterial;
    phantomBloodCrimsonGlowMat: THREE.MeshBasicMaterial;
    phantomDistortedClockMat: THREE.MeshBasicMaterial;
    phantomDistressSignMat1: THREE.MeshBasicMaterial;
    phantomDistressSignMat2: THREE.MeshBasicMaterial;
    phantomDistressSignMat3: THREE.MeshBasicMaterial;
    phantomSpecterMat: THREE.MeshBasicMaterial;
    // Haunted Carnival: Extravagant Gothic Theme Park Scenery Materials
    hauntedGothicStoneMat: THREE.MeshStandardMaterial;
    hauntedJackOLanternGlowMat: THREE.MeshStandardMaterial;
    hauntedCarnivalStripeMat: THREE.MeshStandardMaterial;
    hauntedWroughtIronMat: THREE.MeshStandardMaterial;
    hauntedTwistedWoodMat: THREE.MeshStandardMaterial;
    hauntedVioletGlowMat: THREE.MeshBasicMaterial;
    hauntedAmberGlowMat: THREE.MeshBasicMaterial;
    hauntedSpookySignMat1: THREE.MeshBasicMaterial;
    hauntedSpookySignMat2: THREE.MeshBasicMaterial;
    hauntedSpookySignMat3: THREE.MeshBasicMaterial;
    hauntedGothicWindowMat: THREE.MeshBasicMaterial;
    // VIP Express: The Great Inauguration Materials
    vipIvoryFacadeMat: THREE.MeshStandardMaterial;
    vipSandstoneMat: THREE.MeshStandardMaterial;
    vipNavyTrimMat: THREE.MeshStandardMaterial;
    vipGoldOrnamentMat: THREE.MeshStandardMaterial;
    vipRedCarpetMat: THREE.MeshStandardMaterial;
    vipSaffronBannerMat: THREE.MeshStandardMaterial;
    vipGlassCanopyMat: THREE.MeshStandardMaterial;
    vipWhiteVehicleMat: THREE.MeshStandardMaterial;
    vipBeaconAmberMat: THREE.MeshBasicMaterial;
    vipBeaconBlueMat: THREE.MeshBasicMaterial;
    vipCameraBodyMat: THREE.MeshStandardMaterial;
    vipCameraLensMat: THREE.MeshBasicMaterial;
    vipMarigoldGarlandMat: THREE.MeshBasicMaterial;
    vipWaterPoolMat: THREE.MeshStandardMaterial;
    vipGrandOpeningSignMat: THREE.MeshBasicMaterial;
    vipPartTwoSignMat: THREE.MeshBasicMaterial;
    vipOneMorePhotoSignMat: THREE.MeshBasicMaterial;
    vipAnnouncementScreenMat1: THREE.MeshBasicMaterial;
    vipAnnouncementScreenMat2: THREE.MeshBasicMaterial;
    vipAnnouncementScreenMat3: THREE.MeshBasicMaterial;
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
      color: 0x475569,
      roughness: 0.52,
      metalness: 0.25,
      emissive: 0x111827,
      emissiveIntensity: 0.15
    });
    curved.applyCurvature(modernSteelMat);

    const modernNeonMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    curved.applyCurvature(modernNeonMat);
    const modernSignMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getModernMetroSignTexture('METRO CENTRAL', 'LINE 1')
    });
    curved.applyCurvature(modernSignMat);

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
    curved.applyCurvature(cableMat);

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
    curved.applyCurvature(gasLampMat);

    const slateRoofMat = new THREE.MeshStandardMaterial({
      color: 0x37474f,
      roughness: 0.65,
      metalness: 0.25
    });
    curved.applyCurvature(slateRoofMat);

    const historicSignMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getHistoricSignTexture('GRAND CENTRAL')
    });
    curved.applyCurvature(historicSignMat);

    const earthenwareInsulatorMat = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      roughness: 0.5,
      metalness: 0.2
    });
    curved.applyCurvature(earthenwareInsulatorMat);

    const copperCableMat = new THREE.MeshBasicMaterial({ color: 0x4e342e });
    curved.applyCurvature(copperCableMat);

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
    curved.applyCurvature(hazardStripeMat);
    const sodiumLampMat = new THREE.MeshBasicMaterial({ color: 0xff8f00 });
    curved.applyCurvature(sodiumLampMat);
    const industrialSignMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getModernMetroSignTexture('FREIGHT YARD', 'TERMINAL 4')
    });
    curved.applyCurvature(industrialSignMat);

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
    curved.applyCurvature(tunnelLampMat);

    // Modern Metro Enhanced Materials
    const modernCurtainGlassMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getCurtainWallGlassTexture(),
      roughness: 0.30,
      metalness: 0.35,
      emissive: 0x0f172a,
      emissiveIntensity: 0.20
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
    curved.applyCurvature(historicClockFaceMat);

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
    curved.applyCurvature(subwayBillboardMat);

    const subwayDuctMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.45,
      metalness: 0.7
    });
    curved.applyCurvature(subwayDuctMat);

    const subwaySignalGreenMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    curved.applyCurvature(subwaySignalGreenMat);
    const subwaySignalAmberMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    curved.applyCurvature(subwaySignalAmberMat);
    const subwaySignalRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    curved.applyCurvature(subwaySignalRedMat);

    const grandStationSignMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getGrandStationSignTexture()
    });
    curved.applyCurvature(grandStationSignMat);

    const hazardChevronMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getIndustrialWarningChevronTexture()
    });
    curved.applyCurvature(hazardChevronMat);

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
      grandStationSignMat,
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
      hazardChevronMat,
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
      })(),
      // Neon Rainline Premium Scenery Materials
      neonRainAlloyMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x0c1220,
          roughness: 0.22,
          metalness: 0.85
        });
        curved.applyCurvature(m);
        return m;
      })(),
      neonRainGlassMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x071526,
          roughness: 0.12,
          metalness: 0.70,
          transparent: true,
          opacity: 0.85
        });
        curved.applyCurvature(m);
        return m;
      })(),
      neonRainFacadeMat1: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getNeonTowerFacadeTexture(0),
          roughness: 0.25,
          metalness: 0.65
        });
        curved.applyCurvature(m);
        return m;
      })(),
      neonRainFacadeMat2: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getNeonTowerFacadeTexture(1),
          roughness: 0.25,
          metalness: 0.65
        });
        curved.applyCurvature(m);
        return m;
      })(),
      neonCyanGlowMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
        curved.applyCurvature(m);
        return m;
      })(),
      neonMagentaGlowMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0xf026d3 });
        curved.applyCurvature(m);
        return m;
      })(),
      neonVioletGlowMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
        curved.applyCurvature(m);
        return m;
      })(),
      neonWhiteLedMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
        curved.applyCurvature(m);
        return m;
      })(),
      neonHoloAdMat1: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getNeonHoloBillboardTexture(0),
          transparent: true,
          opacity: 0.92
        });
        curved.applyCurvature(m);
        return m;
      })(),
      neonHoloAdMat2: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getNeonHoloBillboardTexture(1),
          transparent: true,
          opacity: 0.92
        });
        curved.applyCurvature(m);
        return m;
      })(),
      neonHoloAdMat3: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getNeonHoloBillboardTexture(2),
          transparent: true,
          opacity: 0.92
        });
        curved.applyCurvature(m);
        return m;
      })(),
      neonTransitSignMat: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getNeonTransitSignTexture('RAINLINE CENTRAL', 'SECTOR 04')
        });
        curved.applyCurvature(m);
        return m;
      })(),
      neonWetBallastMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getWetBallastTexture(),
          roughness: 0.35,
          metalness: 0.50
        });
        curved.applyCurvature(m);
        return m;
      })(),
      orbitalWhiteCompositeMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getOrbitalHullTileTexture(),
          color: 0xf8fafc,
          roughness: 0.32,
          metalness: 0.18
        });
        curved.applyCurvature(m);
        return m;
      })(),
      orbitalTitaniumMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.22,
          metalness: 0.82
        });
        curved.applyCurvature(m);
        return m;
      })(),
      orbitalGraphiteMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.38,
          metalness: 0.65
        });
        curved.applyCurvature(m);
        return m;
      })(),
      orbitalCyanGlowMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
        curved.applyCurvature(m);
        return m;
      })(),
      orbitalBlueGlowMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        curved.applyCurvature(m);
        return m;
      })(),
      orbitalObservationGlassMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          roughness: 0.08,
          metalness: 0.45,
          transparent: true,
          opacity: 0.38
        });
        curved.applyCurvature(m);
        return m;
      })(),
      orbitalSolarMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getOrbitalSolarPanelTexture(),
          roughness: 0.25,
          metalness: 0.70
        });
        curved.applyCurvature(m);
        return m;
      })(),
      orbitalHoloSignMat1: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getOrbitalHoloSignTexture(0),
          transparent: true,
          opacity: 0.92
        });
        curved.applyCurvature(m);
        return m;
      })(),
      orbitalHoloSignMat2: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getOrbitalHoloSignTexture(1),
          transparent: true,
          opacity: 0.92
        });
        curved.applyCurvature(m);
        return m;
      })(),
      orbitalHoloSignMat3: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getOrbitalHoloSignTexture(2),
          transparent: true,
          opacity: 0.92
        });
        curved.applyCurvature(m);
        return m;
      })(),
      orbitalTransitSignMat: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getOrbitalTransitSignTexture('ORBITAL HALO CENTRAL', 'DOCK 07')
        });
        curved.applyCurvature(m);
        return m;
      })(),
      orbitalGuidewayDeckMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getOrbitalGuidewayTexture(),
          roughness: 0.45,
          metalness: 0.55
        });
        curved.applyCurvature(m);
        return m;
      })(),
      // Abyssal Glassline Shared Materials
      abyssalGlassTunnelMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x22d3ee,
          roughness: 0.05,
          metalness: 0.55,
          transparent: true,
          opacity: 0.35
        });
        curved.applyCurvature(m);
        return m;
      })(),
      abyssalTitaniumRibMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x0f2738,
          roughness: 0.28,
          metalness: 0.78
        });
        curved.applyCurvature(m);
        return m;
      })(),
      abyssalHydroBrassMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0xd97706,
          roughness: 0.22,
          metalness: 0.85
        });
        curved.applyCurvature(m);
        return m;
      })(),
      abyssalNavyCompositeMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x081d2c,
          roughness: 0.35,
          metalness: 0.60
        });
        curved.applyCurvature(m);
        return m;
      })(),
      abyssalBioTealGlowMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
        curved.applyCurvature(m);
        return m;
      })(),
      abyssalBioCyanGlowMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
        curved.applyCurvature(m);
        return m;
      })(),
      abyssalBioAmberGlowMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        curved.applyCurvature(m);
        return m;
      })(),
      abyssalBioMagentaGlowMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0xf026d3 });
        curved.applyCurvature(m);
        return m;
      })(),
      abyssalBasaltRockMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getAbyssalSeafloorTexture(),
          roughness: 0.90,
          metalness: 0.15
        });
        curved.applyCurvature(m);
        return m;
      })(),
      abyssalCoralMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getAbyssalBioluminescentCoralTexture(),
          roughness: 0.40,
          metalness: 0.25
        });
        curved.applyCurvature(m);
        return m;
      })(),
      abyssalHoloSignMat1: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getAbyssalHoloSignTexture(0),
          transparent: true,
          opacity: 0.92
        });
        curved.applyCurvature(m);
        return m;
      })(),
      abyssalHoloSignMat2: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getAbyssalHoloSignTexture(1),
          transparent: true,
          opacity: 0.92
        });
        curved.applyCurvature(m);
        return m;
      })(),
      abyssalHoloSignMat3: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getAbyssalHoloSignTexture(2),
          transparent: true,
          opacity: 0.92
        });
        curved.applyCurvature(m);
        return m;
      })(),
      abyssalTransitSignMat: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getAbyssalTransitSignTexture()
        });
        curved.applyCurvature(m);
        return m;
      })(),
      abyssalGuidewayDeckMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getAbyssalGuidewayTexture(),
          roughness: 0.42,
          metalness: 0.55
        });
        curved.applyCurvature(m);
        return m;
      })(),
      // Doomsday: Last Transit Premium Scenery Materials
      doomsdayScorchedConcreteMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getDoomsdayScorchedConcreteTexture(),
          roughness: 0.85,
          metalness: 0.15
        });
        curved.applyCurvature(m);
        return m;
      })(),
      doomsdayRustedSteelMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x2e1913,
          roughness: 0.75,
          metalness: 0.65
        });
        curved.applyCurvature(m);
        return m;
      })(),
      doomsdayBlastAlloyMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x140e0c,
          roughness: 0.45,
          metalness: 0.80
        });
        curved.applyCurvature(m);
        return m;
      })(),
      doomsdayRebarSteelMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x5a2312,
          roughness: 0.60,
          metalness: 0.70
        });
        curved.applyCurvature(m);
        return m;
      })(),
      doomsdayShatteredGlassMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x3d271d,
          roughness: 0.35,
          metalness: 0.40,
          transparent: true,
          opacity: 0.45
        });
        curved.applyCurvature(m);
        return m;
      })(),
      doomsdayAshBasaltMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x181311,
          roughness: 0.92,
          metalness: 0.08
        });
        curved.applyCurvature(m);
        return m;
      })(),
      doomsdayHazardStripeMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getDoomsdayHazardStripesTexture(),
          roughness: 0.45,
          metalness: 0.25,
          emissive: new THREE.Color(0x7c2d12),
          emissiveIntensity: 0.45
        });
        curved.applyCurvature(m);
        return m;
      })(),
      doomsdayMoltenGlowMat: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getDoomsdayMoltenFissureTexture()
        });
        curved.applyCurvature(m);
        return m;
      })(),
      doomsdayFireAmberGlowMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0xf97316 });
        curved.applyCurvature(m);
        return m;
      })(),
      doomsdayEmergencyRedGlowMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        curved.applyCurvature(m);
        return m;
      })(),
      doomsdayDistressSignMat1: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getDoomsdayDistressSignTexture(0)
        });
        curved.applyCurvature(m);
        return m;
      })(),
      doomsdayDistressSignMat2: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getDoomsdayDistressSignTexture(1)
        });
        curved.applyCurvature(m);
        return m;
      })(),
      doomsdayDistressSignMat3: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getDoomsdayDistressSignTexture(2)
        });
        curved.applyCurvature(m);
        return m;
      })(),
      doomsdayBillboardMat1: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getDoomsdayBillboardFracturedTexture(0)
        });
        curved.applyCurvature(m);
        return m;
      })(),
      doomsdayBillboardMat2: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getDoomsdayBillboardFracturedTexture(1)
        });
        curved.applyCurvature(m);
        return m;
      })(),
      // Phantom Line: Ghost Horror Premium Scenery Materials
      phantomDecayedTileMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getPhantomDecayedTileTexture(),
          roughness: 0.75,
          metalness: 0.15
        });
        curved.applyCurvature(m);
        return m;
      })(),
      phantomRustedIronMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.85,
          metalness: 0.65
        });
        curved.applyCurvature(m);
        return m;
      })(),
      phantomWeatheredBrickMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.90,
          metalness: 0.10
        });
        curved.applyCurvature(m);
        return m;
      })(),
      phantomOxidizedCopperMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x134e4a,
          roughness: 0.70,
          metalness: 0.55
        });
        curved.applyCurvature(m);
        return m;
      })(),
      phantomDecayedWoodMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x292524,
          roughness: 0.92,
          metalness: 0.05
        });
        curved.applyCurvature(m);
        return m;
      })(),
      phantomWaterMirrorMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getPhantomWaterMirrorTexture(),
          roughness: 0.15,
          metalness: 0.60
        });
        curved.applyCurvature(m);
        return m;
      })(),
      phantomColdFluorescentMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0xa5f3fc });
        curved.applyCurvature(m);
        return m;
      })(),
      phantomSpectralGlowCyanMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
        curved.applyCurvature(m);
        return m;
      })(),
      phantomSpectralGlowMintMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0x34d399 });
        curved.applyCurvature(m);
        return m;
      })(),
      phantomBloodCrimsonGlowMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0x991b1b });
        curved.applyCurvature(m);
        return m;
      })(),
      phantomDistortedClockMat: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getPhantomDistortedClockTexture()
        });
        curved.applyCurvature(m);
        return m;
      })(),
      phantomDistressSignMat1: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getPhantomDistressSignTexture(0)
        });
        curved.applyCurvature(m);
        return m;
      })(),
      phantomDistressSignMat2: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getPhantomDistressSignTexture(1)
        });
        curved.applyCurvature(m);
        return m;
      })(),
      phantomDistressSignMat3: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getPhantomDistressSignTexture(2)
        });
        curved.applyCurvature(m);
        return m;
      })(),
      phantomSpecterMat: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getPhantomSpectralSilhouetteTexture(),
          transparent: true,
          opacity: 0.85
        });
        curved.applyCurvature(m);
        return m;
      })(),
      hauntedGothicStoneMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getHauntedGothicStoneTexture(),
          roughness: 0.85,
          metalness: 0.20
        });
        curved.applyCurvature(m);
        return m;
      })(),
      hauntedJackOLanternGlowMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getHauntedJackOLanternTexture(),
          roughness: 0.45,
          metalness: 0.15,
          emissive: new THREE.Color(0xfb923c),
          emissiveIntensity: 0.85
        });
        curved.applyCurvature(m);
        return m;
      })(),
      hauntedCarnivalStripeMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          map: TextureGenerator.getHauntedCarnivalStripeTexture(),
          roughness: 0.65,
          metalness: 0.12
        });
        curved.applyCurvature(m);
        return m;
      })(),
      hauntedWroughtIronMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x0f0c18,
          roughness: 0.70,
          metalness: 0.85
        });
        curved.applyCurvature(m);
        return m;
      })(),
      hauntedTwistedWoodMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x1f1625,
          roughness: 0.90,
          metalness: 0.05
        });
        curved.applyCurvature(m);
        return m;
      })(),
      hauntedVioletGlowMat: (() => {
        const m = new THREE.MeshBasicMaterial({
          color: 0xc084fc
        });
        curved.applyCurvature(m);
        return m;
      })(),
      hauntedAmberGlowMat: (() => {
        const m = new THREE.MeshBasicMaterial({
          color: 0xfbbf24
        });
        curved.applyCurvature(m);
        return m;
      })(),
      hauntedSpookySignMat1: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getHauntedSpookySignTexture(0)
        });
        curved.applyCurvature(m);
        return m;
      })(),
      hauntedSpookySignMat2: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getHauntedSpookySignTexture(1)
        });
        curved.applyCurvature(m);
        return m;
      })(),
      hauntedSpookySignMat3: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getHauntedSpookySignTexture(2)
        });
        curved.applyCurvature(m);
        return m;
      })(),
      hauntedGothicWindowMat: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getHauntedGothicWindowTexture()
        });
        curved.applyCurvature(m);
        return m;
      })(),
      // VIP Express: The Great Inauguration Materials
      vipIvoryFacadeMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          roughness: 0.35,
          metalness: 0.15
        });
        curved.applyCurvature(m);
        return m;
      })(),
      vipSandstoneMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0xd4a373,
          roughness: 0.80,
          metalness: 0.10
        });
        curved.applyCurvature(m);
        return m;
      })(),
      vipNavyTrimMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x1e3a8a,
          roughness: 0.25,
          metalness: 0.80
        });
        curved.applyCurvature(m);
        return m;
      })(),
      vipGoldOrnamentMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          roughness: 0.20,
          metalness: 0.90
        });
        curved.applyCurvature(m);
        return m;
      })(),
      vipRedCarpetMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0xbe123c,
          roughness: 0.85,
          metalness: 0.05
        });
        curved.applyCurvature(m);
        return m;
      })(),
      vipSaffronBannerMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0xff7700,
          roughness: 0.50,
          metalness: 0.10
        });
        curved.applyCurvature(m);
        return m;
      })(),
      vipGlassCanopyMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x78350f,
          roughness: 0.15,
          metalness: 0.85,
          transparent: true,
          opacity: 0.75
        });
        curved.applyCurvature(m);
        return m;
      })(),
      vipWhiteVehicleMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.20,
          metalness: 0.40
        });
        curved.applyCurvature(m);
        return m;
      })(),
      vipBeaconAmberMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
        curved.applyCurvature(m);
        return m;
      })(),
      vipBeaconBlueMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0x2563eb });
        curved.applyCurvature(m);
        return m;
      })(),
      vipCameraBodyMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x18181b,
          roughness: 0.50,
          metalness: 0.60
        });
        curved.applyCurvature(m);
        return m;
      })(),
      vipCameraLensMat: (() => {
        const m = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        curved.applyCurvature(m);
        return m;
      })(),
      vipMarigoldGarlandMat: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getVipMarigoldGarlandTexture()
        });
        curved.applyCurvature(m);
        return m;
      })(),
      vipWaterPoolMat: (() => {
        const m = new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          roughness: 0.10,
          metalness: 0.80,
          transparent: true,
          opacity: 0.80
        });
        curved.applyCurvature(m);
        return m;
      })(),
      vipGrandOpeningSignMat: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getVipGrandOpeningSignTexture(false)
        });
        curved.applyCurvature(m);
        return m;
      })(),
      vipPartTwoSignMat: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getVipGrandOpeningSignTexture(true)
        });
        curved.applyCurvature(m);
        return m;
      })(),
      vipOneMorePhotoSignMat: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getVipPhotoOpSignTexture()
        });
        curved.applyCurvature(m);
        return m;
      })(),
      vipAnnouncementScreenMat1: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getVipAnnouncementScreenTexture(0)
        });
        curved.applyCurvature(m);
        return m;
      })(),
      vipAnnouncementScreenMat2: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getVipAnnouncementScreenTexture(1)
        });
        curved.applyCurvature(m);
        return m;
      })(),
      vipAnnouncementScreenMat3: (() => {
        const m = new THREE.MeshBasicMaterial({
          map: TextureGenerator.getVipAnnouncementScreenTexture(2)
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
    smallMoment: SmallMomentType | null = null,
    isAerialCorridor: boolean = false
  ): void {
    // Clean previous scenery
    // Scenery geometries and local materials belong to this build. Textures
    // and the material cache are shared across chunks and must remain alive.
    this.sceneryPool.clearDecorativeGroup(decorativeGroup, new Set(Object.values(this.getSharedMaterials())));

    const chunkLength = CONSTANTS.CHUNK_LENGTH;
    const roadbedWidth = CONSTANTS.LANE_WIDTH * 3 + 2.8;
    const curbWidth = 0.5;

    if (landmark) {
      this.buildLandmarkEncounter(landmark, decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail, theme);
    } else if (theme.id === 'UNDERGROUND_METRO' || isTunnel) {
      this.buildUndergroundMetroScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, worldZ, seed, detail, tunnelPortal, isAerialCorridor);
    } else if (isTransition) {
      this.buildTransitionPortalScenery(decorativeGroup, roadbedWidth, curbWidth, theme, chunkLength);
    } else if (theme.id === 'HISTORIC_QUARTER') {
      this.buildHistoricQuarterScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
    } else if (theme.id === 'NEON_INDUSTRIAL') {
      this.buildNeonIndustrialScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
    } else if (theme.id === 'NEON_RAINLINE') {
      this.buildNeonRainlineScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
    } else if (theme.id === 'ORBITAL_HALO') {
      this.buildOrbitalHaloScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
    } else if (theme.id === 'ABYSSAL_GLASSLINE') {
      this.buildAbyssalGlasslineScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
    } else if (theme.id === 'DOOMSDAY_LAST_TRANSIT') {
      this.buildDoomsdayLastTransitScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
    } else if (theme.id === 'PHANTOM_LINE') {
      this.buildPhantomLineScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
    } else if (theme.id === 'HAUNTED_CARNIVAL') {
      this.buildHauntedCarnivalScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
    } else if (theme.id === 'VIP_EXPRESS') {
      this.buildVipExpressScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail, worldZ);
    } else if (theme.id === 'RAHULVERSE') {
      this.buildRahulverseScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail, worldZ);
    } else if (theme.id === 'MIDNIGHT_VELVET') {
      this.buildMidnightVelvetScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail, worldZ);
    } else if (theme.id === 'CHRONO_KINGDOM') {
      this.buildChronoKingdomScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
    } else if (theme.id === 'INFERNO_EXPRESS') {
      this.buildInfernoExpressScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
    } else if (theme.id === 'JURASSIC_RUSH') {
      this.buildJurassicRushScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail, worldZ);
    } else if (theme.id === 'VIVA_HEAT') {
      this.buildVivaHeatScenery(decorativeGroup, roadbedWidth, curbWidth, chunkLength, seed, detail);
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
      CurvedShaderManager.getInstance().applyCurvature(ledMat);

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
    const poleHeight = 11.2;
    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 3.8;

    for (let g = 0; g < gantryCount; g++) {
      const gz = -g * gantrySpacing - 13.0;
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, gz);

      const colGeo = new THREE.BoxGeometry(0.36, poleHeight, 0.36);
      [-spanWidth * 0.5, spanWidth * 0.5].forEach((cx) => {
        const col = new THREE.Mesh(colGeo, mats.catenarySteelMat);
        col.position.set(cx, poleHeight * 0.5, 0);
        col.castShadow = true;
        gantryGroup.add(col);

        const ped = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.8, 0.65), mats.curbMat);
        ped.position.set(cx, 0.4, 0);
        gantryGroup.add(ped);
      });

      const girder = new THREE.Mesh(new THREE.BoxGeometry(spanWidth + 0.6, 0.36, 0.38), mats.catenarySteelMat);
      girder.position.set(0, poleHeight - 0.18, 0);
      girder.castShadow = true;
      gantryGroup.add(girder);

      // Insulators & Signals elevated for 10.4m+ clearance
      CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
        const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.30, 8), mats.insulatorMat);
        ins.position.set(laneX, poleHeight - 0.42, 0);
        gantryGroup.add(ins);

        const sig = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.54, 0.24), mats.modernSteelMat);
        sig.position.set(laneX, poleHeight - 0.70, 0.12);
        gantryGroup.add(sig);

        const greenLens = new THREE.Mesh(new THREE.CircleGeometry(0.08, 10), mats.subwaySignalGreenMat);
        greenLens.position.set(laneX, poleHeight - 0.65, 0.25);
        gantryGroup.add(greenLens);
      });

      group.add(gantryGroup);
    }

    // Overhead catenary contact wires elevated at 10.7m
    CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
      const cable = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, chunkLength, 6, Math.round(chunkLength / 2.0)),
        mats.cableMat
      );
      cable.rotation.x = Math.PI / 2;
      cable.position.set(laneX, poleHeight - 0.50, -chunkLength * 0.5);
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

            const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mats.subwaySignalRedMat);
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
          mainBody.receiveShadow = true;
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
          mainBody.receiveShadow = true;
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

            const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), mats.subwaySignalRedMat);
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
    // Ceiling clearance: 12.0m guarantees wide unobstructed camera headroom during train-roof running (camera Y=7.95m)
    const bridgeHeight = 12.0;
    const bridgeWidth = 6.5;
    const bridgeSpan = 34.0;

    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, bridgeHeight, -chunkLength * 0.5);

    // Floor deck - slim composite deck preventing overhead camera occlusion
    const deck = new THREE.Mesh(new THREE.BoxGeometry(bridgeSpan, 0.42, bridgeWidth), mats.modernSteelMat);
    deck.receiveShadow = true;
    bridgeGroup.add(deck);

    // Translucent blue glass walls
    const glassWallGeo = new THREE.BoxGeometry(bridgeSpan, 2.7, 0.12);
    [-bridgeWidth * 0.5 + 0.1, bridgeWidth * 0.5 - 0.1].forEach((gz) => {
      const gw = new THREE.Mesh(glassWallGeo, mats.modernGlassBridgeMat);
      gw.position.set(0, 1.55, gz);
      bridgeGroup.add(gw);
    });

    // Sleek white aerodynamic roof canopy
    const roof = new THREE.Mesh(new THREE.BoxGeometry(bridgeSpan + 0.8, 0.4, bridgeWidth + 0.6), mats.modernWhiteMat);
    roof.position.set(0, 3.15, 0);
    roof.receiveShadow = true;
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
    const poleHeight = 10.0;
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

      // Earthenware insulators & mechanical semaphores elevated above 8.8m
      CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
        const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 6), mats.earthenwareInsulatorMat);
        ins.position.set(laneX, poleHeight - 0.45, 0);
        gantryGroup.add(ins);

        const sema = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.08), mats.copperPatinaMat);
        sema.position.set(laneX + 0.4, poleHeight - 0.70, 0.1);
        sema.rotation.z = -0.3;
        gantryGroup.add(sema);

        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), mats.gasLampMat);
        lamp.position.set(laneX, poleHeight - 0.70, 0.15);
        gantryGroup.add(lamp);
      });

      group.add(gantryGroup);
    }

    // Copper wires elevated at 9.4m
    CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, chunkLength, 6), mats.copperCableMat);
      cable.rotation.x = Math.PI / 2;
      cable.position.set(laneX, poleHeight - 0.60, -chunkLength * 0.5);
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
    // 9.8m provides ample clearance with deck underside (1.8m thick) at 8.9m, clearing train and jump apex
    const bridgeHeight = 9.8;
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
    const poleHeight = 10.0;
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

      // Warning searchlights elevated at 9.4m
      CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), mats.sodiumLampMat);
        lamp.position.set(laneX, poleHeight - 0.60, 0.15);
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
  // NEON RAINLINE DISTRICT (PREMIUM FUTURISTIC RAIN-SOAKED MEGACITY)
  // -------------------------------------------------------------------------
  private buildNeonRainlineScenery(
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
    const wallThick = 0.65;
    const wallX = roadbedWidth * 0.5 + curbWidth + wallThick * 0.5 + 0.2;
    const wallGeo = new THREE.BoxGeometry(wallThick, wallHeight, chunkLength);

    // 1. Sleek Wet Carbon/Titanium Retaining Walls
    const leftWall = new THREE.Mesh(wallGeo, mats.neonRainAlloyMat);
    leftWall.position.set(-wallX, wallHeight * 0.5, -chunkLength * 0.5);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, mats.neonRainAlloyMat);
    rightWall.position.set(wallX, wallHeight * 0.5, -chunkLength * 0.5);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    group.add(rightWall);

    // Wet reflective curb coping cap
    const capGeo = new THREE.BoxGeometry(wallThick + 0.18, 0.20, chunkLength);
    const leftCap = new THREE.Mesh(capGeo, mats.curbMat);
    leftCap.position.set(-wallX, wallHeight + 0.10, -chunkLength * 0.5);
    group.add(leftCap);

    const rightCap = new THREE.Mesh(capGeo, mats.curbMat);
    rightCap.position.set(wallX, wallHeight + 0.10, -chunkLength * 0.5);
    group.add(rightCap);

    // Continuous luminescent LED race strips along the retaining walls:
    // Upper strip: Electric Cyan; Lower strip: Hot Magenta
    const upperStripGeo = new THREE.BoxGeometry(0.08, 0.08, chunkLength);
    const lowerStripGeo = new THREE.BoxGeometry(0.08, 0.06, chunkLength);

    [-wallX + wallThick * 0.5 + 0.02, wallX - wallThick * 0.5 - 0.02].forEach((nx) => {
      // Upper cyan runner
      const cyanStrip = new THREE.Mesh(upperStripGeo, mats.neonCyanGlowMat);
      cyanStrip.position.set(nx, wallHeight + 0.08, -chunkLength * 0.5);
      group.add(cyanStrip);

      // Lower magenta runner
      const magentaStrip = new THREE.Mesh(lowerStripGeo, mats.neonMagentaGlowMat);
      magentaStrip.position.set(nx, 1.1, -chunkLength * 0.5);
      group.add(magentaStrip);
    });

    // Wet-sheen ground-level third-rail magnetic power shoes along the wall bases
    const thirdRailGeo = new THREE.BoxGeometry(0.18, 0.22, chunkLength);
    const thirdRailX = roadbedWidth * 0.5 + 0.45;
    [-thirdRailX, thirdRailX].forEach((rx) => {
      const railMesh = new THREE.Mesh(thirdRailGeo, mats.neonRainAlloyMat);
      railMesh.position.set(rx, 0.11, -chunkLength * 0.5);
      group.add(railMesh);

      // Embedded glowing cyan energy conduit
      const conduitGeo = new THREE.BoxGeometry(0.06, 0.06, chunkLength);
      const conduit = new THREE.Mesh(conduitGeo, mats.neonCyanGlowMat);
      conduit.position.set(rx, 0.23, -chunkLength * 0.5);
      group.add(conduit);
    });

    // Trackside Holographic Route Repeaters & Angled Cyber Poles
    if (detail !== 'MINIMAL') {
      const poleGeo = new THREE.CylinderGeometry(0.07, 0.09, 7.0, 8);
      const armGeo = new THREE.BoxGeometry(1.6, 0.08, 0.08);
      const holoSignGeo = new THREE.PlaneGeometry(1.4, 0.8);

      for (let z = 14; z < chunkLength; z += 26) {
        [-wallX, wallX].forEach((wx, sideIdx) => {
          const poleGroup = new THREE.Group();
          const inwardSign = wx < 0 ? 1 : -1;
          poleGroup.position.set(wx, wallHeight, -z);

          const pole = new THREE.Mesh(poleGeo, mats.neonRainAlloyMat);
          pole.position.y = 3.5;
          poleGroup.add(pole);

          const arm = new THREE.Mesh(armGeo, mats.neonRainAlloyMat);
          arm.position.set(inwardSign * 0.8, 6.8, 0);
          poleGroup.add(arm);

          // Hanging holographic repeater display
          const signMat = (sideIdx + Math.floor(z / 26)) % 2 === 0 ? mats.neonHoloAdMat1 : mats.neonHoloAdMat2;
          const sign = new THREE.Mesh(holoSignGeo, signMat);
          sign.position.set(inwardSign * 1.5, 6.2, 0);
          sign.rotation.y = inwardSign > 0 ? -0.2 : Math.PI + 0.2;
          poleGroup.add(sign);

          // Downward luminaire
          const lampGeo = new THREE.BoxGeometry(0.5, 0.06, 0.2);
          const lamp = new THREE.Mesh(lampGeo, mats.neonWhiteLedMat);
          lamp.position.set(inwardSign * 1.5, 6.75, 0);
          poleGroup.add(lamp);

          group.add(poleGroup);
        });
      }
    }

    // 2. High-Tech Carbon/Titanium Catenary System with Superconducting Induction Rings
    this.buildNeonCatenaryAndPowerSystem(group, chunkLength, detail);

    // 3. Modular Futuristic Megacity Buildings (4 Architectures with Layered Variation)
    this.buildNeonModularMegacity(group, chunkLength, rng, detail);

    // 4. Monumental Illuminated Transit Arch (Every ~2 chunks, when rng.chance(0.48))
    const hasArch = rng.chance(0.48);
    const archZ = -chunkLength * 0.5;
    if (hasArch) {
      this.buildNeonMonumentalTransitArch(group, chunkLength, archZ);
    }

    // 5. Glass Pedestrian Skybridge (When no arch or staggered away from arch)
    if (detail !== 'MINIMAL' && (!hasArch || rng.chance(0.35))) {
      const bridgeZ = hasArch ? -chunkLength * 0.18 : -chunkLength * 0.5;
      this.buildNeonGlassSkybridge(group, chunkLength, bridgeZ);
    }
  }

  private buildNeonCatenaryAndPowerSystem(group: THREE.Group, chunkLength: number, detail: 'FULL' | 'BALANCED' | 'MINIMAL'): void {
    const mats = this.getSharedMaterials();
    const gantrySpacing = 26.6;
    const gantryCount = Math.floor(chunkLength / gantrySpacing);
    const poleHeight = 10.4;
    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 3.6;

    for (let g = 0; g < gantryCount; g++) {
      const gz = -g * gantrySpacing - 13.3;
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, gz);

      // Heavy faceted carbon masts flanking tracks
      const colGeo = new THREE.BoxGeometry(0.42, poleHeight, 0.42);
      [-spanWidth * 0.5, spanWidth * 0.5].forEach((cx) => {
        const col = new THREE.Mesh(colGeo, mats.neonRainAlloyMat);
        col.position.set(cx, poleHeight * 0.5, 0);
        gantryGroup.add(col);

        // Vertical cyan accent strip climbing mast
        const stripGeo = new THREE.BoxGeometry(0.06, poleHeight * 0.85, 0.06);
        const strip = new THREE.Mesh(stripGeo, mats.neonCyanGlowMat);
        strip.position.set(cx + (cx < 0 ? 0.22 : -0.22), poleHeight * 0.45, 0);
        gantryGroup.add(strip);
      });

      // Overhead cross-truss beam (clearance >= 9.8m)
      const truss = new THREE.Mesh(new THREE.BoxGeometry(spanWidth + 0.8, 0.45, 0.55), mats.neonRainAlloyMat);
      truss.position.set(0, poleHeight - 0.22, 0);
      gantryGroup.add(truss);

      // Horizontal magenta glow strip along lower girder edge
      const girderGlow = new THREE.Mesh(new THREE.BoxGeometry(spanWidth + 0.6, 0.06, 0.06), mats.neonMagentaGlowMat);
      girderGlow.position.set(0, poleHeight - 0.46, 0);
      gantryGroup.add(girderGlow);

      // Superconducting cyan induction ring droppers per lane
      CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
        const ringGeo = new THREE.TorusGeometry(0.24, 0.04, 6, 12);
        const ring = new THREE.Mesh(ringGeo, mats.neonCyanGlowMat);
        ring.position.set(laneX, poleHeight - 0.85, 0);
        gantryGroup.add(ring);

        if (detail !== 'MINIMAL') {
          // Downward luminaire focusing on track
          const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.15), mats.neonWhiteLedMat);
          lamp.position.set(laneX, poleHeight - 0.52, 0.1);
          gantryGroup.add(lamp);
        }
      });

      group.add(gantryGroup);
    }
  }

  private buildNeonMonumentalTransitArch(group: THREE.Group, chunkLength: number, archZ: number): void {
    const mats = this.getSharedMaterials();
    const archGroup = new THREE.Group();
    archGroup.name = 'neon_transit_arch';
    archGroup.position.set(0, 0, archZ);

    const spanW = CONSTANTS.LANE_WIDTH * 3 + 4.8; // ~15.6m
    const archClearanceH = 9.8;
    const archTotalH = 14.5;

    // Heavy faceted pylons flanking track corridor
    const pylonGeo = new THREE.BoxGeometry(1.6, archTotalH, 2.8);
    [-spanW * 0.5 - 0.8, spanW * 0.5 + 0.8].forEach((px) => {
      const pylon = new THREE.Mesh(pylonGeo, mats.neonRainAlloyMat);
      pylon.position.set(px, archTotalH * 0.5, 0);
      pylon.castShadow = true;
      pylon.receiveShadow = true;
      archGroup.add(pylon);

      // Vertical magenta neon edge runners
      const edgeGeo = new THREE.BoxGeometry(0.08, archTotalH * 0.9, 0.08);
      const edge = new THREE.Mesh(edgeGeo, mats.neonMagentaGlowMat);
      edge.position.set(px + (px < 0 ? 0.82 : -0.82), archTotalH * 0.48, 1.4);
      archGroup.add(edge);
    });

    // Massive overhead hexagonal transit bridge beam
    const bridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(spanW + 3.2, 3.2, 2.6), mats.neonRainAlloyMat);
    bridgeBeam.position.set(0, archClearanceH + 1.6, 0);
    bridgeBeam.castShadow = true;
    bridgeBeam.receiveShadow = true;
    archGroup.add(bridgeBeam);

    // Illuminated digital transit route banner facing oncoming runners (Z > 0)
    const signGeo = new THREE.PlaneGeometry(10.5, 2.2);
    const sign = new THREE.Mesh(signGeo, mats.neonTransitSignMat);
    sign.position.set(0, archClearanceH + 1.6, 1.32);
    archGroup.add(sign);

    // Glowing cyan chevron perimeter strips on the bridge frame
    const topStrip = new THREE.Mesh(new THREE.BoxGeometry(spanW + 3.0, 0.1, 0.1), mats.neonCyanGlowMat);
    topStrip.position.set(0, archTotalH - 0.05, 1.34);
    archGroup.add(topStrip);

    const botStrip = new THREE.Mesh(new THREE.BoxGeometry(spanW + 3.0, 0.1, 0.1), mats.neonCyanGlowMat);
    botStrip.position.set(0, archClearanceH + 0.05, 1.34);
    archGroup.add(botStrip);

    // Overhead high-voltage hyperloop tube on top of arch
    const tubeGeo = new THREE.CylinderGeometry(0.8, 0.8, spanW + 3.5, 12);
    const tube = new THREE.Mesh(tubeGeo, mats.neonRainAlloyMat);
    tube.rotation.z = Math.PI / 2;
    tube.position.set(0, archTotalH + 1.2, 0);
    archGroup.add(tube);

    // Superconducting ring halos around the hyperloop tube
    [-4, 0, 4].forEach((rx) => {
      const haloGeo = new THREE.TorusGeometry(1.05, 0.08, 6, 16);
      const halo = new THREE.Mesh(haloGeo, mats.neonCyanGlowMat);
      halo.rotation.y = Math.PI / 2;
      halo.position.set(rx, archTotalH + 1.2, 0);
      archGroup.add(halo);
    });

    group.add(archGroup);
  }

  private buildNeonGlassSkybridge(group: THREE.Group, chunkLength: number, bridgeZ: number): void {
    const mats = this.getSharedMaterials();
    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = 'neon_glass_skybridge';
    bridgeGroup.position.set(0, 0, bridgeZ);

    const spanW = CONSTANTS.LANE_WIDTH * 3 + 6.0; // ~17m
    const bridgeY = 9.4;
    const bridgeH = 3.2;
    const bridgeDepth = 4.2;

    // Structural dark alloy space frame skeleton
    const floorSlab = new THREE.Mesh(new THREE.BoxGeometry(spanW, 0.35, bridgeDepth), mats.neonRainAlloyMat);
    floorSlab.position.set(0, bridgeY, 0);
    bridgeGroup.add(floorSlab);

    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(spanW, 0.35, bridgeDepth), mats.neonRainAlloyMat);
    roofSlab.position.set(0, bridgeY + bridgeH, 0);
    bridgeGroup.add(roofSlab);

    // Aerodynamic tinted glass walls (front & back)
    const glassGeo = new THREE.BoxGeometry(spanW - 0.2, bridgeH - 0.6, 0.12);
    const frontGlass = new THREE.Mesh(glassGeo, mats.neonRainGlassMat);
    frontGlass.position.set(0, bridgeY + bridgeH * 0.5, bridgeDepth * 0.5 - 0.06);
    bridgeGroup.add(frontGlass);

    const backGlass = new THREE.Mesh(glassGeo, mats.neonRainGlassMat);
    backGlass.position.set(0, bridgeY + bridgeH * 0.5, -bridgeDepth * 0.5 + 0.06);
    bridgeGroup.add(backGlass);

    // Interior illuminated floor walkway with soft electric violet glow
    const deckLightGeo = new THREE.PlaneGeometry(spanW - 0.4, bridgeDepth - 0.4);
    const deckLight = new THREE.Mesh(deckLightGeo, mats.neonVioletGlowMat);
    deckLight.rotation.x = -Math.PI / 2;
    deckLight.position.set(0, bridgeY + 0.20, 0);
    bridgeGroup.add(deckLight);

    // Exterior glowing cyan edge trims
    const trimGeo = new THREE.BoxGeometry(spanW, 0.08, 0.08);
    [-bridgeDepth * 0.5, bridgeDepth * 0.5].forEach((bz) => {
      const topTrim = new THREE.Mesh(trimGeo, mats.neonCyanGlowMat);
      topTrim.position.set(0, bridgeY + bridgeH + 0.18, bz);
      bridgeGroup.add(topTrim);

      const botTrim = new THREE.Mesh(trimGeo, mats.neonCyanGlowMat);
      botTrim.position.set(0, bridgeY - 0.18, bz);
      bridgeGroup.add(botTrim);
    });

    group.add(bridgeGroup);
  }

  private buildNeonModularMegacity(
    group: THREE.Group,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const wallX = CONSTANTS.TUNNEL_WALL_X;
    const numBuildings = 5;
    const lotLength = chunkLength / numBuildings;

    for (let b = 0; b < numBuildings; b++) {
      const bz = -b * lotLength - lotLength * 0.5;
      const bStyle = rng.int(0, 3); // 4 distinct modular families

      [-1, 1].forEach((side) => {
        const bGroup = new THREE.Group();
        const lateralJitter = rng.range(0, 2.2);

        if (bStyle === 0) {
          // --- Family 0: Holographic Megastructure Tower (Height 48-78m) ---
          const bW = rng.range(13.0, 16.5);
          const bH = rng.range(48.0, 78.0);
          const bD = lotLength * rng.range(0.88, 0.96);

          const frontX = wallX + 1.8 + lateralJitter;
          const bX = side * (frontX + bW * 0.5);
          bGroup.position.set(bX, 0, bz);

          // Ground-level commercial storefront podium with neon trim
          const podiumH = 5.4;
          const podiumDepth = 0.9;
          const podium = new THREE.Mesh(new THREE.BoxGeometry(podiumDepth, podiumH, bD * 0.92), mats.modernStorefrontMat);
          podium.position.set(-side * (bW * 0.5 + podiumDepth * 0.5), podiumH * 0.5, 0);
          podium.castShadow = true;
          podium.receiveShadow = true;
          bGroup.add(podium);

          // Neon storefront accent strip
          const storeTrim = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, bD * 0.88), mats.neonMagentaGlowMat);
          storeTrim.position.set(-side * (bW * 0.5 + podiumDepth + 0.05), podiumH + 0.04, 0);
          bGroup.add(storeTrim);

          // Main tower alloy body
          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.neonRainAlloyMat);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          mainBody.receiveShadow = true;
          bGroup.add(mainBody);

          // Glass curtain wall with glowing window grid
          const facadeMat = (b % 2 === 0) ? mats.neonRainFacadeMat1 : mats.neonRainFacadeMat2;
          const glass = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.12, bH * 0.88, bD * 0.88), facadeMat);
          glass.position.y = bH * 0.5;
          bGroup.add(glass);

          // Protruding cantilevered 2-sided Holographic Advertising Billboard
          if (detail !== 'MINIMAL') {
            const holoArmH = rng.range(14.0, 20.0);
            const holoW = 6.8;
            const holoH = 3.6;

            // Cantilever support truss
            const trussArm = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.25, 0.25), mats.neonRainAlloyMat);
            trussArm.position.set(-side * (bW * 0.5 + 1.2), holoArmH, 0);
            bGroup.add(trussArm);

            // Double-sided holographic display panel
            const holoMat = (b % 3 === 0) ? mats.neonHoloAdMat1 : ((b % 3 === 1) ? mats.neonHoloAdMat2 : mats.neonHoloAdMat3);
            const holoPlane = new THREE.Mesh(new THREE.BoxGeometry(0.12, holoH, holoW), holoMat);
            holoPlane.position.set(-side * (bW * 0.5 + 2.4), holoArmH, 0);
            bGroup.add(holoPlane);

            // Holographic frame glow borders
            const borderTop = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, holoW + 0.2), mats.neonCyanGlowMat);
            borderTop.position.set(-side * (bW * 0.5 + 2.4), holoArmH + holoH * 0.5, 0);
            bGroup.add(borderTop);

            const borderBot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, holoW + 0.2), mats.neonCyanGlowMat);
            borderBot.position.set(-side * (bW * 0.5 + 2.4), holoArmH - holoH * 0.5, 0);
            bGroup.add(borderBot);
          }

          // Stepped setback rooftop penthouse & communications deck
          if (detail === 'FULL') {
            const pentW = bW * 0.58;
            const pentH = 5.2;
            const pent = new THREE.Mesh(new THREE.BoxGeometry(pentW, pentH, bD * 0.6), mats.neonRainAlloyMat);
            pent.position.set(0, bH + pentH * 0.5, 0);
            bGroup.add(pent);

            // Glowing rooftop edge halo
            const pentHalo = new THREE.Mesh(new THREE.BoxGeometry(pentW + 0.2, 0.1, bD * 0.6 + 0.2), mats.neonCyanGlowMat);
            pentHalo.position.set(0, bH + pentH + 0.05, 0);
            bGroup.add(pentHalo);

            // Satellite dish / transmitter antenna
            const antGeo = new THREE.CylinderGeometry(0.12, 0.22, 10.0, 6);
            const ant = new THREE.Mesh(antGeo, mats.neonRainAlloyMat);
            ant.position.set(0, bH + pentH + 5.0, 0);
            bGroup.add(ant);

            const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), mats.subwaySignalRedMat);
            beacon.position.set(0, bH + pentH + 10.2, 0);
            bGroup.add(beacon);

            // Vertical luminescent data channel climbing facade
            const conduit = new THREE.Mesh(new THREE.BoxGeometry(0.08, bH * 0.9, 0.08), mats.neonCyanGlowMat);
            conduit.position.set(-side * (bW * 0.5 + 0.08), bH * 0.5, side * (bD * 0.25));
            bGroup.add(conduit);
          }
        } else if (bStyle === 1) {
          // --- Family 1: Cyber High-Rise with Diagonal Exoskeleton (Height 36-64m) ---
          const bW = rng.range(12.0, 15.0);
          const bH = rng.range(36.0, 64.0);
          const bD = lotLength * rng.range(0.88, 0.95);

          const frontX = wallX + 1.8 + lateralJitter;
          const bX = side * (frontX + bW * 0.5);
          bGroup.position.set(bX, 0, bz);

          // Main alloy hull
          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.neonRainAlloyMat);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          mainBody.receiveShadow = true;
          bGroup.add(mainBody);

          // Glass curtain panels
          const glass = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.08, bH * 0.85, bD * 0.85), mats.neonRainGlassMat);
          glass.position.y = bH * 0.5;
          bGroup.add(glass);

          // Diagonal structural cross-bracing with glowing magenta LED piping
          const trussArmGeo = new THREE.BoxGeometry(0.25, bH * 0.5, 0.25);
          [-1, 1].forEach((dir) => {
            const diag = new THREE.Mesh(trussArmGeo, mats.neonRainAlloyMat);
            diag.rotation.z = dir * 0.24;
            diag.position.set(-side * (bW * 0.5 + 0.15), bH * 0.5, 0);
            bGroup.add(diag);

            const glowLine = new THREE.Mesh(new THREE.BoxGeometry(0.06, bH * 0.5, 0.06), mats.neonMagentaGlowMat);
            glowLine.rotation.z = dir * 0.24;
            glowLine.position.set(-side * (bW * 0.5 + 0.28), bH * 0.5, 0);
            bGroup.add(glowLine);
          });

          // Protruding cantilevered observation lounge pods with tinted glass
          if (detail !== 'MINIMAL') {
            const podGeo = new THREE.BoxGeometry(1.6, 2.8, 3.8);
            const pod = new THREE.Mesh(podGeo, mats.neonRainGlassMat);
            pod.position.set(-side * (bW * 0.5 + 0.6), bH * 0.42, 0);
            bGroup.add(pod);

            const podFrame = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 4.0), mats.neonCyanGlowMat);
            podFrame.position.set(-side * (bW * 0.5 + 0.6), bH * 0.42 - 1.4, 0);
            bGroup.add(podFrame);
          }

          // Rooftop solar/plasma collectors and transmission antenna
          if (detail === 'FULL') {
            const panel = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.7, 0.2, bD * 0.7), mats.solarPanelMat);
            panel.position.set(0, bH + 0.15, 0);
            panel.rotation.x = 0.12;
            bGroup.add(panel);

            const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 7.0, 6), mats.neonRainAlloyMat);
            mast.position.set(0, bH + 3.6, 0);
            bGroup.add(mast);

            const mastBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), mats.neonCyanGlowMat);
            mastBeacon.position.set(0, bH + 7.2, 0);
            bGroup.add(mastBeacon);
          }
        } else if (bStyle === 2) {
          // --- Family 2: Elevated Transit Platform & Sky-Concourse Station Facade (Height 22-36m) ---
          const bW = rng.range(13.5, 17.0);
          const bH = rng.range(22.0, 36.0);
          const bD = lotLength * rng.range(0.92, 0.98);

          const frontX = wallX + 1.8 + lateralJitter;
          const bX = side * (frontX + bW * 0.5);
          bGroup.position.set(bX, 0, bz);

          // Main station concourse structure
          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.neonRainAlloyMat);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          mainBody.receiveShadow = true;
          bGroup.add(mainBody);

          // Panoramic multi-level glass concourse facing tracks
          const glassDeckGeo = new THREE.BoxGeometry(1.8, bH * 0.55, bD * 0.88);
          const glassDeck = new THREE.Mesh(glassDeckGeo, mats.neonRainGlassMat);
          glassDeck.position.set(-side * (bW * 0.5 + 0.6), bH * 0.45, 0);
          bGroup.add(glassDeck);

          // Illuminated passenger concourse deck floors (visible through glass)
          const floorDeck1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, bD * 0.84), mats.neonVioletGlowMat);
          floorDeck1.position.set(-side * (bW * 0.5 + 0.5), bH * 0.32, 0);
          bGroup.add(floorDeck1);

          const floorDeck2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, bD * 0.84), mats.neonCyanGlowMat);
          floorDeck2.position.set(-side * (bW * 0.5 + 0.5), bH * 0.58, 0);
          bGroup.add(floorDeck2);

          // Overhead platform canopy with integrated white luminaires
          const canopyGeo = new THREE.BoxGeometry(2.4, 0.3, bD * 0.94);
          const canopy = new THREE.Mesh(canopyGeo, mats.neonRainAlloyMat);
          canopy.position.set(-side * (bW * 0.5 + 0.8), bH * 0.74, 0);
          bGroup.add(canopy);

          const canopyLight = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, bD * 0.88), mats.neonWhiteLedMat);
          canopyLight.position.set(-side * (bW * 0.5 + 0.8), bH * 0.74 - 0.18, 0);
          bGroup.add(canopyLight);

          // Glowing transit line display sign
          if (detail !== 'MINIMAL') {
            const stationSign = new THREE.Mesh(new THREE.PlaneGeometry(bD * 0.7, 1.4), mats.neonTransitSignMat);
            stationSign.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
            stationSign.position.set(-side * (bW * 0.5 + 1.82), bH * 0.84, 0);
            bGroup.add(stationSign);
          }

          // Ground-level commercial storefronts with cyber signage
          const storeH = 4.8;
          const store = new THREE.Mesh(new THREE.BoxGeometry(1.2, storeH, bD * 0.9), mats.modernStorefrontMat);
          store.position.set(-side * (bW * 0.5 + 0.5), storeH * 0.5, 0);
          bGroup.add(store);
        } else {
          // --- Family 3: Cyber-Spire Arcology with Stepped Rooftop Antennas (Height 52-85m) ---
          const bW = rng.range(14.0, 18.0);
          const bH = rng.range(52.0, 85.0);
          const bD = lotLength * rng.range(0.90, 0.96);

          const frontX = wallX + 1.8 + lateralJitter;
          const bX = side * (frontX + bW * 0.5);
          bGroup.position.set(bX, 0, bz);

          // 3-Tier Stepped Ziggurat Arcology Body
          // Base tier (0 to 45% height)
          const tier1H = bH * 0.45;
          const tier1 = new THREE.Mesh(new THREE.BoxGeometry(bW, tier1H, bD), mats.neonRainAlloyMat);
          tier1.position.y = tier1H * 0.5;
          bGroup.add(tier1);

          // Mid tier (45% to 75% height)
          const tier2W = bW * 0.78;
          const tier2D = bD * 0.78;
          const tier2H = bH * 0.30;
          const tier2 = new THREE.Mesh(new THREE.BoxGeometry(tier2W, tier2H, tier2D), mats.neonRainAlloyMat);
          tier2.position.y = tier1H + tier2H * 0.5;
          bGroup.add(tier2);

          // Crown tier (75% to 100% height)
          const tier3W = bW * 0.55;
          const tier3D = bD * 0.55;
          const tier3H = bH * 0.25;
          const tier3 = new THREE.Mesh(new THREE.BoxGeometry(tier3W, tier3H, tier3D), mats.neonRainAlloyMat);
          tier3.position.y = tier1H + tier2H + tier3H * 0.5;
          bGroup.add(tier3);

          // Glass curtain facades on all tiers
          const glass1 = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.1, tier1H * 0.85, bD * 0.85), mats.neonRainFacadeMat1);
          glass1.position.y = tier1H * 0.5;
          bGroup.add(glass1);

          const glass2 = new THREE.Mesh(new THREE.BoxGeometry(tier2W + 0.1, tier2H * 0.85, tier2D * 0.85), mats.neonRainFacadeMat2);
          glass2.position.y = tier1H + tier2H * 0.5;
          bGroup.add(glass2);

          // Horizontal neon banding wrapping tiers
          const band1 = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.15, 0.12, bD + 0.15), mats.neonVioletGlowMat);
          band1.position.y = tier1H;
          bGroup.add(band1);

          const band2 = new THREE.Mesh(new THREE.BoxGeometry(tier2W + 0.15, 0.12, tier2D + 0.15), mats.neonCyanGlowMat);
          band2.position.y = tier1H + tier2H;
          bGroup.add(band2);

          // Twin needle transmission spires on top of arcology
          if (detail === 'FULL') {
            const spireH = 16.0;
            const spireGeo = new THREE.CylinderGeometry(0.12, 0.35, spireH, 6);
            [-tier3W * 0.25, tier3W * 0.25].forEach((sx) => {
              const spire = new THREE.Mesh(spireGeo, mats.neonRainAlloyMat);
              spire.position.set(sx, bH + spireH * 0.5, 0);
              bGroup.add(spire);

              const summitBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), mats.neonMagentaGlowMat);
              summitBeacon.position.set(sx, bH + spireH + 0.15, 0);
              bGroup.add(summitBeacon);
            });

            // Rooftop holographic kanji / cyber sign on truss frame
            const signArm = new THREE.Mesh(new THREE.BoxGeometry(tier3W * 0.8, 1.8, 0.2), mats.neonHoloAdMat1);
            signArm.position.set(0, bH + 2.5, 0);
            bGroup.add(signArm);
          }
        }

        group.add(bGroup);
      });
    }
  }

  // -------------------------------------------------------------------------
  // ORBITAL HALO DISTRICT (PREMIUM ORBITAL MEGASTRUCTURE STATION)
  // -------------------------------------------------------------------------
  private buildOrbitalHaloScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const rng = new SeededRandom(seed);

    // 1. Trackside Observation Gallery & Retaining Walls
    this.buildOrbitalGuidewayAndObservationWalls(group, roadbedWidth, curbWidth, chunkLength, detail);

    // 2. High-Tech Cantilever Magnetic Gantries with Induction Rings
    this.buildOrbitalCatenaryAndMagneticGantries(group, chunkLength, detail);

    // 3. Modular Station Modules (Observation Hubs, Solar Wings, Cargo Docks, Gravity Rings)
    this.buildOrbitalModularStationModules(group, chunkLength, rng, detail);

    // 4. Deterministic Landmark Variations
    // Variation 1: Monumental Celestial Gateway Arch (~48% of chunks)
    const hasGateway = rng.chance(0.48);
    const gatewayZ = -chunkLength * 0.5;
    if (hasGateway) {
      this.buildOrbitalMonumentalGatewayArch(group, chunkLength, gatewayZ);
    }

    // Variation 2: Pressurized Observation Skybridge (~38% of chunks when staggered)
    if (detail !== 'MINIMAL' && (!hasGateway || rng.chance(0.38))) {
      const bridgeZ = hasGateway ? -chunkLength * 0.18 : -chunkLength * 0.5;
      this.buildOrbitalObservationSkybridge(group, chunkLength, bridgeZ);
    }

    // Variation 3: Docked Spacecraft Bay (~35% of chunks)
    if (detail !== 'MINIMAL' && rng.chance(0.35)) {
      const craftZ = hasGateway ? -chunkLength * 0.78 : -chunkLength * 0.25;
      this.buildOrbitalDockedSpacecraft(group, chunkLength, craftZ, rng);
    }
  }

  private buildOrbitalGuidewayAndObservationWalls(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const wallHeight = 2.8;
    const wallThick = 0.70;
    const wallX = roadbedWidth * 0.5 + curbWidth + wallThick * 0.5 + 0.2;

    const baseH = 1.25;
    const glassH = wallHeight - baseH;

    // 1. Sleek Aerospace White Composite Lower Retaining Base
    const baseGeo = new THREE.BoxGeometry(wallThick, baseH, chunkLength);
    [-wallX, wallX].forEach((wx) => {
      const baseMesh = new THREE.Mesh(baseGeo, mats.orbitalWhiteCompositeMat);
      baseMesh.position.set(wx, baseH * 0.5, -chunkLength * 0.5);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      // Upper Transparent Observation Glass Panels (Overlooking deep space and planet)
      const glassGeo = new THREE.BoxGeometry(0.14, glassH, chunkLength);
      const glassMesh = new THREE.Mesh(glassGeo, mats.orbitalObservationGlassMat);
      glassMesh.position.set(wx, baseH + glassH * 0.5, -chunkLength * 0.5);
      group.add(glassMesh);

      // Top titanium coping cap with embedded cyan runners
      const capGeo = new THREE.BoxGeometry(wallThick + 0.12, 0.18, chunkLength);
      const capMesh = new THREE.Mesh(capGeo, mats.orbitalTitaniumMat);
      capMesh.position.set(wx, wallHeight + 0.09, -chunkLength * 0.5);
      group.add(capMesh);

      // Continuous Electric Cyan Energy Channels along walls:
      // Upper runner along top cap
      const upperRunner = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, chunkLength), mats.orbitalCyanGlowMat);
      upperRunner.position.set(wx + (wx < 0 ? wallThick * 0.5 : -wallThick * 0.5), wallHeight + 0.08, -chunkLength * 0.5);
      group.add(upperRunner);

      // Lower runner at the base-glass junction
      const lowerRunner = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, chunkLength), mats.orbitalCyanGlowMat);
      lowerRunner.position.set(wx + (wx < 0 ? wallThick * 0.5 : -wallThick * 0.5), baseH, -chunkLength * 0.5);
      group.add(lowerRunner);
    });

    // Vertical titanium frame mullions dividing the observation glass
    const mullionGeo = new THREE.BoxGeometry(wallThick + 0.06, glassH + 0.1, 0.35);
    for (let z = 6; z < chunkLength; z += 12) {
      [-wallX, wallX].forEach((wx) => {
        const mullion = new THREE.Mesh(mullionGeo, mats.orbitalTitaniumMat);
        mullion.position.set(wx, baseH + glassH * 0.5, -z);
        group.add(mullion);
      });
    }

    // Magnetic levitation guide rails (third rail equivalent) along roadbed edges
    const magGuideGeo = new THREE.BoxGeometry(0.20, 0.24, chunkLength);
    const magX = roadbedWidth * 0.5 + 0.45;
    [-magX, magX].forEach((rx) => {
      const guideMesh = new THREE.Mesh(magGuideGeo, mats.orbitalTitaniumMat);
      guideMesh.position.set(rx, 0.12, -chunkLength * 0.5);
      group.add(guideMesh);

      const conduit = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, chunkLength), mats.orbitalCyanGlowMat);
      conduit.position.set(rx, 0.25, -chunkLength * 0.5);
      group.add(conduit);
    });

    // Trackside Holographic Route Monitors & Angled Telemetry Poles
    if (detail !== 'MINIMAL') {
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.10, 7.2, 8);
      const armGeo = new THREE.BoxGeometry(1.6, 0.08, 0.08);
      const holoSignGeo = new THREE.PlaneGeometry(1.5, 0.85);

      for (let z = 16; z < chunkLength; z += 26) {
        [-wallX, wallX].forEach((wx, sideIdx) => {
          const poleGroup = new THREE.Group();
          const inwardSign = wx < 0 ? 1 : -1;
          poleGroup.position.set(wx, wallHeight, -z);

          const pole = new THREE.Mesh(poleGeo, mats.orbitalTitaniumMat);
          pole.position.y = 3.6;
          poleGroup.add(pole);

          const arm = new THREE.Mesh(armGeo, mats.orbitalTitaniumMat);
          arm.position.set(inwardSign * 0.8, 6.9, 0);
          poleGroup.add(arm);

          // Hanging holographic telemetry display
          const signMat = (sideIdx + Math.floor(z / 26)) % 3 === 0
            ? mats.orbitalHoloSignMat1
            : ((sideIdx + Math.floor(z / 26)) % 3 === 1 ? mats.orbitalHoloSignMat2 : mats.orbitalHoloSignMat3);
          const sign = new THREE.Mesh(holoSignGeo, signMat);
          sign.position.set(inwardSign * 1.5, 6.3, 0);
          sign.rotation.y = inwardSign > 0 ? -0.15 : Math.PI + 0.15;
          poleGroup.add(sign);

          // Downward guide luminaire
          const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.2), mats.orbitalBlueGlowMat);
          lamp.position.set(inwardSign * 1.5, 6.85, 0);
          poleGroup.add(lamp);

          group.add(poleGroup);
        });
      }
    }
  }

  private buildOrbitalCatenaryAndMagneticGantries(
    group: THREE.Group,
    chunkLength: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const gantrySpacing = 26.6;
    const gantryCount = Math.floor(chunkLength / gantrySpacing);
    const poleHeight = 10.4;
    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 3.8;

    for (let g = 0; g < gantryCount; g++) {
      const gz = -g * gantrySpacing - 13.3;
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, gz);

      // Heavy faceted titanium/white composite masts flanking tracks
      const colGeo = new THREE.BoxGeometry(0.44, poleHeight, 0.44);
      [-spanWidth * 0.5, spanWidth * 0.5].forEach((cx) => {
        const col = new THREE.Mesh(colGeo, mats.orbitalWhiteCompositeMat);
        col.position.set(cx, poleHeight * 0.5, 0);
        gantryGroup.add(col);

        // Vertical cyan telemetry strip climbing mast
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, poleHeight * 0.85, 0.06), mats.orbitalCyanGlowMat);
        strip.position.set(cx + (cx < 0 ? 0.23 : -0.23), poleHeight * 0.45, 0);
        gantryGroup.add(strip);
      });

      // Overhead cross-truss beam (clearance strictly >= 9.8m)
      const truss = new THREE.Mesh(new THREE.BoxGeometry(spanWidth + 0.8, 0.48, 0.55), mats.orbitalTitaniumMat);
      truss.position.set(0, poleHeight - 0.24, 0);
      gantryGroup.add(truss);

      // Horizontal cyan glow strip along lower girder edge
      const girderGlow = new THREE.Mesh(new THREE.BoxGeometry(spanWidth + 0.6, 0.06, 0.06), mats.orbitalCyanGlowMat);
      girderGlow.position.set(0, poleHeight - 0.48, 0);
      gantryGroup.add(girderGlow);

      // Suspended quantum levitation induction rings per lane (clearance strictly >= 9.3m)
      CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
        const ringGeo = new THREE.TorusGeometry(0.26, 0.04, 6, 14);
        const ring = new THREE.Mesh(ringGeo, mats.orbitalCyanGlowMat);
        ring.position.set(laneX, poleHeight - 0.85, 0);
        gantryGroup.add(ring);

        if (detail !== 'MINIMAL') {
          const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.16), mats.orbitalBlueGlowMat);
          lamp.position.set(laneX, poleHeight - 0.54, 0.1);
          gantryGroup.add(lamp);
        }
      });

      group.add(gantryGroup);
    }
  }

  private buildOrbitalModularStationModules(
    group: THREE.Group,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const wallX = CONSTANTS.TUNNEL_WALL_X;
    // 2 module sites per chunk (every 40m), alternating primary side to preserve open planetary/space vistas
    const numModules = 2;
    const lotLength = chunkLength / numModules;

    for (let m = 0; m < numModules; m++) {
      const mz = -m * lotLength - lotLength * 0.5;
      const mStyle = rng.int(0, 3); // 4 distinct modular typologies
      const primarySide = (m % 2 === 0) ? -1 : 1;

      [-1, 1].forEach((side) => {
        const isPrimary = side === primarySide;
        const mGroup = new THREE.Group();
        const lateralJitter = rng.range(0, 2.0);
        const frontX = wallX + 3.0 + lateralJitter;

        if (isPrimary) {
          if (mStyle === 0) {
            // --- Typology 0: Pressurized Observation Dome & Cylindrical Habitat Hub ---
            const radius = rng.range(6.5, 8.5);
            const height = rng.range(20.0, 30.0);
            const mX = side * (frontX + radius);
            mGroup.position.set(mX, 0, mz);

            // Cylindrical habitat drum
            const drumGeo = new THREE.CylinderGeometry(radius, radius, height, 16);
            const drum = new THREE.Mesh(drumGeo, mats.orbitalWhiteCompositeMat);
            drum.position.y = height * 0.5;
            drum.castShadow = true;
            drum.receiveShadow = true;
            mGroup.add(drum);

            // Transparent Observation Dome facing tracks
            const domeRadius = radius * 0.55;
            const domeGeo = new THREE.SphereGeometry(domeRadius, 16, 12, 0, Math.PI, 0, Math.PI);
            const dome = new THREE.Mesh(domeGeo, mats.orbitalObservationGlassMat);
            dome.position.set(-side * radius * 0.8, height * 0.65, 0);
            dome.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
            mGroup.add(dome);

            // Interior luminescent observation decks
            const deckLight = new THREE.Mesh(new THREE.BoxGeometry(domeRadius * 1.6, 0.2, domeRadius * 1.6), mats.orbitalCyanGlowMat);
            deckLight.position.set(-side * radius * 0.8, height * 0.65 - 0.2, 0);
            mGroup.add(deckLight);

            // Communication antenna spire on summit
            const antH = rng.range(8.0, 14.0);
            const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, antH, 6), mats.orbitalTitaniumMat);
            ant.position.y = height + antH * 0.5;
            mGroup.add(ant);

            const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.8, 6, 6), mats.orbitalCyanGlowMat);
            beacon.position.y = height + antH;
            mGroup.add(beacon);
          } else if (mStyle === 1) {
            // --- Typology 1: Photovoltaic Solar Power Wing ---
            const trussW = 2.8;
            const trussH = rng.range(22.0, 32.0);
            const mX = side * (frontX + trussW * 0.5);
            mGroup.position.set(mX, 0, mz);

            // Central titanium mast truss
            const mast = new THREE.Mesh(new THREE.BoxGeometry(trussW, trussH, trussW), mats.orbitalTitaniumMat);
            mast.position.y = trussH * 0.5;
            mast.castShadow = true;
            mast.receiveShadow = true;
            mGroup.add(mast);

            // Giant dual photovoltaic solar arrays extending outward
            const arrayW = rng.range(16.0, 24.0);
            const arrayH = rng.range(8.0, 12.0);
            const arrayGeo = new THREE.BoxGeometry(arrayW, arrayH, 0.4);

            // Upper solar wing
            const wing1 = new THREE.Mesh(arrayGeo, mats.orbitalSolarMat);
            wing1.position.set(side * (arrayW * 0.5 + trussW * 0.5), trussH * 0.75, 0);
            wing1.rotation.y = side * 0.25;
            wing1.rotation.z = 0.12;
            mGroup.add(wing1);

            // Lower solar wing
            const wing2 = new THREE.Mesh(arrayGeo, mats.orbitalSolarMat);
            wing2.position.set(side * (arrayW * 0.5 + trussW * 0.5), trussH * 0.40, 0);
            wing2.rotation.y = side * 0.25;
            wing2.rotation.z = 0.12;
            mGroup.add(wing2);

            // Superconducting power conduit down the mast
            const conduit = new THREE.Mesh(new THREE.BoxGeometry(0.12, trussH, 0.12), mats.orbitalCyanGlowMat);
            conduit.position.set(-side * (trussW * 0.5 + 0.08), trussH * 0.5, 0);
            mGroup.add(conduit);
          } else if (mStyle === 2) {
            // --- Typology 2: Spacecraft Cargo Dock & Airlock Pylon ---
            const pylonW = rng.range(7.5, 9.5);
            const pylonH = rng.range(22.0, 32.0);
            const pylonD = lotLength * rng.range(0.60, 0.72);
            const mX = side * (frontX + pylonW * 0.5);
            mGroup.position.set(mX, 0, mz);

            // Heavy titanium docking structure
            const pylonMesh = new THREE.Mesh(new THREE.BoxGeometry(pylonW, pylonH, pylonD), mats.orbitalTitaniumMat);
            pylonMesh.position.y = pylonH * 0.5;
            pylonMesh.castShadow = true;
            pylonMesh.receiveShadow = true;
            mGroup.add(pylonMesh);

            // Pressurized cylindrical airlock corridor extending to track gallery
            const tubeLen = frontX - wallX + 1.2;
            const tubeGeo = new THREE.CylinderGeometry(1.6, 1.6, tubeLen, 12);
            const tube = new THREE.Mesh(tubeGeo, mats.orbitalWhiteCompositeMat);
            tube.rotation.z = Math.PI / 2;
            tube.position.set(-side * (pylonW * 0.5 + tubeLen * 0.5), 6.5, 0);
            mGroup.add(tube);

            // Docking clamp arms
            const clampGeo = new THREE.BoxGeometry(pylonW * 0.7, 1.2, 2.2);
            const clamp1 = new THREE.Mesh(clampGeo, mats.orbitalGraphiteMat);
            clamp1.position.set(0, pylonH * 0.65, pylonD * 0.42);
            mGroup.add(clamp1);

            const clamp2 = new THREE.Mesh(clampGeo, mats.orbitalGraphiteMat);
            clamp2.position.set(0, pylonH * 0.65, -pylonD * 0.42);
            mGroup.add(clamp2);

            // Hanging holographic docking advisory
            if (detail !== 'MINIMAL') {
              const holoAd = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 3.0), mats.orbitalHoloSignMat1);
              holoAd.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
              holoAd.position.set(-side * (pylonW * 0.5 + 0.15), 14.5, 0);
              mGroup.add(holoAd);
            }
          } else {
            // --- Typology 3: Centrifugal Gravity Ring Habitat Segment ---
            const bW = rng.range(10.0, 14.0);
            const bH = rng.range(22.0, 32.0);
            const bD = lotLength * rng.range(0.65, 0.78);
            const mX = side * (frontX + bW * 0.5);
            mGroup.position.set(mX, 0, mz);

            // Curved segmented white arcology
            const mainArc = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.orbitalWhiteCompositeMat);
            mainArc.position.y = bH * 0.5;
            mainArc.castShadow = true;
            mainArc.receiveShadow = true;
            mGroup.add(mainArc);

            // Stepped crown observation gallery
            const crownH = 5.5;
            const crown = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.75, crownH, bD * 0.8), mats.orbitalTitaniumMat);
            crown.position.y = bH + crownH * 0.5;
            mGroup.add(crown);

            // Panoramic observation glass strip around crown
            const glassBand = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.78, 1.4, bD * 0.82), mats.orbitalObservationGlassMat);
            glassBand.position.y = bH + crownH * 0.5;
            mGroup.add(glassBand);

            // Glowing electric cyan perimeter trim
            const trim = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.3, 0.3, bD + 0.3), mats.orbitalCyanGlowMat);
            trim.position.y = bH;
            mGroup.add(trim);
          }
        } else {
          // --- Non-primary side: Open Observation Terrace & Solar Collector Array ---
          // Low-profile structure (height <= 4.0m) preserving unobstructed vista of planet, stars and deep space
          if (rng.chance(0.65)) {
            const terraceW = rng.range(6.0, 8.5);
            const terraceH = rng.range(2.2, 3.8);
            const terraceD = lotLength * 0.55;
            const mX = side * (frontX + terraceW * 0.5);
            mGroup.position.set(mX, 0, mz);

            // Low composite maintenance deck
            const deck = new THREE.Mesh(new THREE.BoxGeometry(terraceW, terraceH, terraceD), mats.orbitalTitaniumMat);
            deck.position.y = terraceH * 0.5;
            mGroup.add(deck);

            // Cyan perimeter navigation beacon strip along terrace edge
            const strip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, terraceD), mats.orbitalCyanGlowMat);
            strip.position.set(-side * (terraceW * 0.5 - 0.1), terraceH + 0.06, 0);
            mGroup.add(strip);

            // Articulated small telemetry array or satellite uplink dish
            if (detail !== 'MINIMAL') {
              const dishPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.4, 6), mats.orbitalWhiteCompositeMat);
              dishPole.position.set(0, terraceH + 1.2, 0);
              mGroup.add(dishPole);

              const dish = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.6, 12, 1, true), mats.orbitalCyanGlowMat);
              dish.rotation.x = Math.PI / 4;
              dish.rotation.z = side * 0.3;
              dish.position.set(0, terraceH + 2.4, 0);
              mGroup.add(dish);

              // Compact solar panel
              const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(terraceW * 0.7, 0.1, 4.0), mats.orbitalSolarMat);
              solarPanel.position.set(side * 0.5, terraceH + 0.15, terraceD * 0.25);
              solarPanel.rotation.y = side * 0.2;
              mGroup.add(solarPanel);
            }
          }
        }

        if (mGroup.children.length > 0) {
          group.add(mGroup);
        }
      });
    }
  }

  private buildOrbitalMonumentalGatewayArch(group: THREE.Group, chunkLength: number, archZ: number): void {
    const mats = this.getSharedMaterials();
    const archGroup = new THREE.Group();
    archGroup.name = 'orbital_gateway_arch';
    archGroup.position.set(0, 0, archZ);

    const spanW = CONSTANTS.LANE_WIDTH * 3 + 5.2; // ~16.0m
    const archClearanceH = 10.2;
    const archTotalH = 15.6;

    // Heavy faceted aerospace composite and titanium pylons flanking track corridor
    const pylonGeo = new THREE.BoxGeometry(2.0, archTotalH, 3.2);
    [-spanW * 0.5 - 1.0, spanW * 0.5 + 1.0].forEach((px) => {
      const pylon = new THREE.Mesh(pylonGeo, mats.orbitalWhiteCompositeMat);
      pylon.position.set(px, archTotalH * 0.5, 0);
      pylon.castShadow = true;
      pylon.receiveShadow = true;
      archGroup.add(pylon);

      // Vertical cyan edge runners
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.10, archTotalH * 0.9, 0.10), mats.orbitalCyanGlowMat);
      edge.position.set(px + (px < 0 ? 1.02 : -1.02), archTotalH * 0.48, 1.6);
      archGroup.add(edge);
    });

    // Massive overhead titanium airlock bridge beam (strictly Y >= 10.2m)
    const bridgeBeam = new THREE.Mesh(new THREE.BoxGeometry(spanW + 4.0, 3.4, 3.0), mats.orbitalTitaniumMat);
    bridgeBeam.position.set(0, archClearanceH + 1.7, 0);
    bridgeBeam.castShadow = true;
    bridgeBeam.receiveShadow = true;
    archGroup.add(bridgeBeam);

    // Illuminated digital orbital transit banner facing oncoming runners
    const signGeo = new THREE.PlaneGeometry(10.8, 2.4);
    const sign = new THREE.Mesh(signGeo, mats.orbitalTransitSignMat);
    sign.position.set(0, archClearanceH + 1.7, 1.52);
    archGroup.add(sign);

    // Giant quantum accelerator halo ring spanning over the arch summit
    const haloGeo = new THREE.TorusGeometry(7.2, 0.30, 6, 28);
    const halo = new THREE.Mesh(haloGeo, mats.orbitalCyanGlowMat);
    halo.position.set(0, archTotalH + 2.5, 0);
    archGroup.add(halo);

    // Cyan glowing guide rails along bridge bottom
    const botStrip = new THREE.Mesh(new THREE.BoxGeometry(spanW + 3.8, 0.1, 0.1), mats.orbitalCyanGlowMat);
    botStrip.position.set(0, archClearanceH + 0.05, 1.54);
    archGroup.add(botStrip);

    group.add(archGroup);
  }

  private buildOrbitalObservationSkybridge(group: THREE.Group, chunkLength: number, bridgeZ: number): void {
    const mats = this.getSharedMaterials();
    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = 'orbital_skybridge';
    bridgeGroup.position.set(0, 0, bridgeZ);

    const spanW = CONSTANTS.LANE_WIDTH * 3 + 4.8;
    const bridgeFloorY = 10.5; // strictly >= 10.5m clearance
    const bridgeH = 3.4;
    const bridgeDepth = 5.2;

    // Bridge floor structure
    const floor = new THREE.Mesh(new THREE.BoxGeometry(spanW + 4.0, 0.45, bridgeDepth), mats.orbitalTitaniumMat);
    floor.position.set(0, bridgeFloorY + 0.22, 0);
    bridgeGroup.add(floor);

    // Bridge roof structure
    const roof = new THREE.Mesh(new THREE.BoxGeometry(spanW + 4.0, 0.45, bridgeDepth), mats.orbitalWhiteCompositeMat);
    roof.position.set(0, bridgeFloorY + bridgeH - 0.22, 0);
    bridgeGroup.add(roof);

    // Front & rear transparent observation glass walls
    const glassGeo = new THREE.BoxGeometry(spanW + 3.6, bridgeH - 0.8, 0.12);
    const frontGlass = new THREE.Mesh(glassGeo, mats.orbitalObservationGlassMat);
    frontGlass.position.set(0, bridgeFloorY + bridgeH * 0.5, bridgeDepth * 0.5 - 0.1);
    bridgeGroup.add(frontGlass);

    const rearGlass = new THREE.Mesh(glassGeo, mats.orbitalObservationGlassMat);
    rearGlass.position.set(0, bridgeFloorY + bridgeH * 0.5, -bridgeDepth * 0.5 + 0.1);
    bridgeGroup.add(rearGlass);

    // Illuminated passenger deck glowing strip (visible through glass)
    const deckLight = new THREE.Mesh(new THREE.BoxGeometry(spanW + 3.4, 0.08, 0.6), mats.orbitalCyanGlowMat);
    deckLight.position.set(0, bridgeFloorY + 0.48, 0);
    bridgeGroup.add(deckLight);

    group.add(bridgeGroup);
  }

  private buildOrbitalDockedSpacecraft(group: THREE.Group, chunkLength: number, craftZ: number, rng: SeededRandom): void {
    const mats = this.getSharedMaterials();
    const craftGroup = new THREE.Group();
    craftGroup.name = 'orbital_docked_spacecraft';

    const side = rng.chance(0.5) ? -1 : 1;
    const wallX = CONSTANTS.TUNNEL_WALL_X;
    const craftX = side * (wallX + 8.8);
    craftGroup.position.set(craftX, 5.2, craftZ);

    const cLen = 24.0;
    const cWidth = 7.4;
    const cH = 5.6;

    // Aerospace white fuselage
    const bodyGeo = new THREE.BoxGeometry(cWidth, cH, cLen);
    const body = new THREE.Mesh(bodyGeo, mats.orbitalWhiteCompositeMat);
    body.castShadow = true;
    body.receiveShadow = true;
    craftGroup.add(body);

    // Tapered aerodynamic nose cone facing oncoming direction
    const noseGeo = new THREE.ConeGeometry(cWidth * 0.5, 6.5, 6);
    const nose = new THREE.Mesh(noseGeo, mats.orbitalGraphiteMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0, cLen * 0.5 + 3.25);
    craftGroup.add(nose);

    // Swept delta wings
    const wingGeo = new THREE.BoxGeometry(14.0, 0.4, 9.0);
    const wings = new THREE.Mesh(wingGeo, mats.orbitalWhiteCompositeMat);
    wings.position.set(0, 0, -2.0);
    craftGroup.add(wings);

    // Cockpit observation canopy
    const canopyGeo = new THREE.BoxGeometry(cWidth * 0.6, 1.4, 4.5);
    const canopy = new THREE.Mesh(canopyGeo, mats.orbitalObservationGlassMat);
    canopy.position.set(0, cH * 0.5 + 0.6, 3.5);
    craftGroup.add(canopy);

    // Twin titanium rocket thruster bells
    const thrusterGeo = new THREE.CylinderGeometry(1.2, 1.6, 2.5, 12);
    [-2.0, 2.0].forEach((tx) => {
      const bell = new THREE.Mesh(thrusterGeo, mats.orbitalTitaniumMat);
      bell.rotation.x = Math.PI / 2;
      bell.position.set(tx, 0, -cLen * 0.5 - 1.25);
      craftGroup.add(bell);

      // Cyan ion idling glow inside thruster
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), mats.orbitalCyanGlowMat);
      glow.position.set(tx, 0, -cLen * 0.5 - 1.2);
      craftGroup.add(glow);
    });

    // Pressurized boarding umbilical tube connecting spacecraft to station
    const tubeLen = 5.2;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, tubeLen, 12), mats.orbitalWhiteCompositeMat);
    tube.rotation.z = Math.PI / 2;
    tube.position.set(-side * (cWidth * 0.5 + tubeLen * 0.5), 0, 0);
    craftGroup.add(tube);

    group.add(craftGroup);
  }

  // -------------------------------------------------------------------------
  // ABYSSAL GLASSLINE PROCEDURAL 3D SCENERY (PHASE 3B)
  // -------------------------------------------------------------------------
  private buildAbyssalGlasslineScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const rng = new SeededRandom(seed);

    // 1. Enclosed Transparent Glass Transit Tunnel & Guideway
    this.buildAbyssalGuidewayAndGlassTunnel(group, roadbedWidth, curbWidth, chunkLength, detail);

    // 2. High-Pressure Titanium Compression Ribs & Hydrostatic Gantries
    this.buildAbyssalCompressionRibsGantries(group, chunkLength, detail);

    // 3. Benthic Seafloor, Basalt Slabs, Bioluminescent Corals & Research Pods
    this.buildAbyssalSeabedAndCoralFormations(group, chunkLength, rng, detail);

    // 4. Deterministic Landmark Variations
    // Variation 1: Monumental Trench Sanctum Dome (~48% of chunks)
    const hasSanctumDome = rng.chance(0.48);
    const domeZ = -chunkLength * 0.5;
    if (hasSanctumDome) {
      this.buildAbyssalMonumentalSanctumDome(group, chunkLength, domeZ);
    }

    // Variation 2: Oceanographic Research Skybridge & Submersible Dock (~38% of chunks when staggered)
    if (detail !== 'MINIMAL' && (!hasSanctumDome || rng.chance(0.38))) {
      const bridgeZ = hasSanctumDome ? -chunkLength * 0.18 : -chunkLength * 0.5;
      this.buildAbyssalResearchSkybridge(group, chunkLength, bridgeZ);
    }

    // Variation 3: Hydrothermal Trench Chasm & Geothermal Vent (~35% of chunks)
    if (detail !== 'MINIMAL' && rng.chance(0.35)) {
      const chasmZ = hasSanctumDome ? -chunkLength * 0.80 : -chunkLength * 0.25;
      this.buildAbyssalHydrothermalChasm(group, chunkLength, chasmZ, rng);
    }
  }

  private buildAbyssalGuidewayAndGlassTunnel(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const wallX = CONSTANTS.TUNNEL_WALL_X;
    const wallThick = 0.55;
    const baseH = 1.4;
    const wallHeight = 6.4;
    const glassH = wallHeight - baseH;

    // 1. Reinforced Marine Composite Lower Retaining Base & Upper Glass Walls
    const baseGeo = new THREE.BoxGeometry(wallThick, baseH, chunkLength);
    const footingGeo = new THREE.BoxGeometry(wallThick + 0.35, 0.40, chunkLength);
    [-wallX, wallX].forEach((wx) => {
      // Wall foundation footing using guideway deck material
      const footing = new THREE.Mesh(footingGeo, mats.abyssalGuidewayDeckMat);
      footing.position.set(wx, 0.20, -chunkLength * 0.5);
      footing.receiveShadow = true;
      group.add(footing);

      const baseMesh = new THREE.Mesh(baseGeo, mats.abyssalNavyCompositeMat);
      baseMesh.position.set(wx, baseH * 0.5, -chunkLength * 0.5);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      // Upper Transparent Pressure Glass Walls
      const glassGeo = new THREE.BoxGeometry(0.16, glassH, chunkLength);
      const glassMesh = new THREE.Mesh(glassGeo, mats.abyssalGlassTunnelMat);
      glassMesh.position.set(wx, baseH + glassH * 0.5, -chunkLength * 0.5);
      group.add(glassMesh);

      // Heavy Hydro-Brass Coping Trim at wall-roof junction
      const capGeo = new THREE.BoxGeometry(wallThick + 0.14, 0.22, chunkLength);
      const capMesh = new THREE.Mesh(capGeo, mats.abyssalHydroBrassMat);
      capMesh.position.set(wx, wallHeight + 0.11, -chunkLength * 0.5);
      group.add(capMesh);

      // Continuous Bioluminescent Cyan Light Runners
      const upperRunner = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, chunkLength), mats.abyssalBioCyanGlowMat);
      upperRunner.position.set(wx + (wx < 0 ? wallThick * 0.5 : -wallThick * 0.5), wallHeight + 0.10, -chunkLength * 0.5);
      group.add(upperRunner);

      const lowerRunner = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, chunkLength), mats.abyssalBioTealGlowMat);
      lowerRunner.position.set(wx + (wx < 0 ? wallThick * 0.5 : -wallThick * 0.5), baseH, -chunkLength * 0.5);
      group.add(lowerRunner);
    });

    // 2. Vaulted Enclosed Transparent Pressure Glass Roof Canopy
    // High-arched cylindrical segment spanning between the two walls (Y = 6.4m to apex 11.2m)
    // Span width is 2 * wallX = 22.4m, radius = 13.5m, arc centered at Y = -2.3m, Z = -chunkLength/2
    const canopyRadius = 13.5;
    const canopySpanAngle = Math.PI * 0.40; // Arch segment spanning safely above Y = 8.5m clearance
    const canopyGeo = new THREE.CylinderGeometry(canopyRadius, canopyRadius, chunkLength, 18, 1, true, -canopySpanAngle * 0.5, canopySpanAngle);
    const canopyMesh = new THREE.Mesh(canopyGeo, mats.abyssalGlassTunnelMat);
    canopyMesh.name = 'tunnel_scenery';
    canopyMesh.rotation.x = -Math.PI / 2; // Lie along Z axis with arch apex oriented upward
    canopyMesh.position.set(0, -2.3, -chunkLength * 0.5);
    group.add(canopyMesh);

    // Apex longitudinal hydro-brass compression spine along the roof ridge (Y = 11.2m)
    const spineGeo = new THREE.BoxGeometry(0.45, 0.35, chunkLength);
    const spineMesh = new THREE.Mesh(spineGeo, mats.abyssalHydroBrassMat);
    spineMesh.position.set(0, 11.2, -chunkLength * 0.5);
    group.add(spineMesh);

    const spineGlow = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, chunkLength), mats.abyssalBioCyanGlowMat);
    spineGlow.position.set(0, 11.0, -chunkLength * 0.5);
    group.add(spineGlow);

    // 4. Vertical Titanium Frame Mullions dividing the observation glass
    const mullionGeo = new THREE.BoxGeometry(wallThick + 0.08, glassH + 0.1, 0.38);
    for (let z = 6; z < chunkLength; z += 12) {
      [-wallX, wallX].forEach((wx) => {
        const mullion = new THREE.Mesh(mullionGeo, mats.abyssalTitaniumRibMat);
        mullion.position.set(wx, baseH + glassH * 0.5, -z);
        group.add(mullion);
      });
    }

    // 5. Trackside Magnetic Levitation Cavitation Guide Rails
    const magGuideGeo = new THREE.BoxGeometry(0.20, 0.24, chunkLength);
    const magX = roadbedWidth * 0.5 + 0.45;
    [-magX, magX].forEach((rx) => {
      const guideMesh = new THREE.Mesh(magGuideGeo, mats.abyssalTitaniumRibMat);
      guideMesh.position.set(rx, 0.12, -chunkLength * 0.5);
      group.add(guideMesh);

      const conduit = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, chunkLength), mats.abyssalBioTealGlowMat);
      conduit.position.set(rx, 0.25, -chunkLength * 0.5);
      group.add(conduit);
    });

    // 6. Trackside Bathymetric Depth Displays & Sonar Telemetry Displays
    if (detail !== 'MINIMAL') {
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.10, 7.2, 8);
      const armGeo = new THREE.BoxGeometry(1.6, 0.08, 0.08);
      const holoSignGeo = new THREE.PlaneGeometry(1.5, 0.85);

      for (let z = 16; z < chunkLength; z += 26) {
        [-wallX, wallX].forEach((wx, sideIdx) => {
          const poleGroup = new THREE.Group();
          const inwardSign = wx < 0 ? 1 : -1;
          poleGroup.position.set(wx, wallHeight, -z);

          const pole = new THREE.Mesh(poleGeo, mats.abyssalTitaniumRibMat);
          pole.position.y = 3.6;
          poleGroup.add(pole);

          const arm = new THREE.Mesh(armGeo, mats.abyssalTitaniumRibMat);
          arm.position.set(inwardSign * 0.8, 6.9, 0);
          poleGroup.add(arm);

          // Hanging holographic bathymetric display
          const signMat = (sideIdx + Math.floor(z / 26)) % 3 === 0
            ? mats.abyssalHoloSignMat1
            : ((sideIdx + Math.floor(z / 26)) % 3 === 1 ? mats.abyssalHoloSignMat2 : mats.abyssalHoloSignMat3);
          const sign = new THREE.Mesh(holoSignGeo, signMat);
          sign.position.set(inwardSign * 1.5, 6.3, 0);
          sign.rotation.y = inwardSign > 0 ? -0.15 : Math.PI + 0.15;
          poleGroup.add(sign);

          // Downward ocean spotlight
          const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.2), mats.abyssalBioCyanGlowMat);
          lamp.position.set(inwardSign * 1.5, 6.85, 0);
          poleGroup.add(lamp);

          group.add(poleGroup);
        });
      }
    }
  }

  private buildAbyssalCompressionRibsGantries(
    group: THREE.Group,
    chunkLength: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const gantrySpacing = 16.0; // Compression rib every 16m
    const gantryCount = Math.floor(chunkLength / gantrySpacing);
    const poleHeight = 10.6;
    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 3.8;

    for (let g = 0; g < gantryCount; g++) {
      const gz = -g * gantrySpacing - 8.0;
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, gz);

      // Heavy faceted marine titanium compression columns flanking tracks
      const colGeo = new THREE.BoxGeometry(0.48, poleHeight, 0.52);
      [-spanWidth * 0.5, spanWidth * 0.5].forEach((cx) => {
        const col = new THREE.Mesh(colGeo, mats.abyssalTitaniumRibMat);
        col.position.set(cx, poleHeight * 0.5, 0);
        gantryGroup.add(col);

        // Vertical bioluminescent teal hydrostatic gasket seam
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.08, poleHeight * 0.85, 0.08), mats.abyssalBioTealGlowMat);
        strip.position.set(cx + (cx < 0 ? 0.25 : -0.25), poleHeight * 0.45, 0);
        gantryGroup.add(strip);

        // Anti-corrosion hydro-brass base reinforcement
        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.2, 0.60), mats.abyssalHydroBrassMat);
        boot.position.set(cx, 0.6, 0);
        gantryGroup.add(boot);
      });

      // Overhead cross-truss beam (clearance strictly >= 10.1m)
      const truss = new THREE.Mesh(new THREE.BoxGeometry(spanWidth + 0.8, 0.50, 0.60), mats.abyssalTitaniumRibMat);
      truss.position.set(0, poleHeight - 0.25, 0);
      gantryGroup.add(truss);

      // Arching compression ring rib curving over the vault
      const archRibGeo = new THREE.TorusGeometry(spanWidth * 0.5, 0.25, 6, 20, Math.PI);
      const archRib = new THREE.Mesh(archRibGeo, mats.abyssalHydroBrassMat);
      archRib.position.set(0, poleHeight - 0.25, 0);
      gantryGroup.add(archRib);

      // Horizontal cyan glow strip along lower girder edge (clearance >= 10.0m)
      const girderGlow = new THREE.Mesh(new THREE.BoxGeometry(spanWidth + 0.6, 0.06, 0.06), mats.abyssalBioCyanGlowMat);
      girderGlow.position.set(0, poleHeight - 0.50, 0);
      gantryGroup.add(girderGlow);

      // Hydrostatic levitation induction rings per lane (clearance strictly >= 9.6m)
      CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
        const ringGeo = new THREE.TorusGeometry(0.28, 0.04, 6, 14);
        const ring = new THREE.Mesh(ringGeo, mats.abyssalBioTealGlowMat);
        ring.position.set(laneX, poleHeight - 0.85, 0);
        gantryGroup.add(ring);

        if (detail !== 'MINIMAL') {
          const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.16), mats.abyssalBioAmberGlowMat);
          lamp.position.set(laneX, poleHeight - 0.55, 0.1);
          gantryGroup.add(lamp);
        }
      });

      group.add(gantryGroup);
    }
  }

  private buildAbyssalSeabedAndCoralFormations(
    group: THREE.Group,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const wallX = CONSTANTS.TUNNEL_WALL_X;
    // 2 formation clusters per chunk (every 40m)
    const numClusters = 2;
    const lotLength = chunkLength / numClusters;

    for (let c = 0; c < numClusters; c++) {
      const cz = -c * lotLength - lotLength * 0.5;
      const cStyle = rng.int(0, 3);
      const primarySide = (c % 2 === 0) ? -1 : 1;

      [-1, 1].forEach((side) => {
        const isPrimary = side === primarySide;
        const cGroup = new THREE.Group();
        const lateralJitter = rng.range(0, 2.0);
        const frontX = wallX + 3.0 + lateralJitter;

        if (isPrimary) {
          if (cStyle === 0) {
            // --- Typology 0: Bioluminescent Coral Reef & Sea Fan Garden ---
            const reefW = rng.range(8.0, 11.0);
            const reefH = rng.range(6.0, 12.0);
            const reefD = lotLength * rng.range(0.65, 0.78);
            const cX = side * (frontX + reefW * 0.5);
            cGroup.position.set(cX, 0, cz);

            // Benthic basalt rock mound
            const rockGeo = new THREE.BoxGeometry(reefW, reefH * 0.45, reefD);
            const rock = new THREE.Mesh(rockGeo, mats.abyssalBasaltRockMat);
            rock.position.y = reefH * 0.225;
            rock.castShadow = true;
            cGroup.add(rock);

            // Sprouting coral branches
            const coralCount = detail === 'FULL' ? 6 : (detail === 'BALANCED' ? 4 : 2);
            for (let k = 0; k < coralCount; k++) {
              const coralH = rng.range(3.5, 6.5);
              const coralGeo = new THREE.ConeGeometry(rng.range(1.0, 1.8), coralH, 6);
              const coralMat = k % 2 === 0 ? mats.abyssalBioTealGlowMat : mats.abyssalBioMagentaGlowMat;
              const coral = new THREE.Mesh(coralGeo, coralMat);
              coral.position.set(rng.range(-reefW * 0.3, reefW * 0.3), reefH * 0.45 + coralH * 0.5, rng.range(-reefD * 0.3, reefD * 0.3));
              coral.rotation.z = rng.range(-0.25, 0.25);
              cGroup.add(coral);
            }

            // Luminous coral polyp beacons
            const polypGeo = new THREE.SphereGeometry(0.6, 6, 6);
            for (let p = 0; p < 4; p++) {
              const polyp = new THREE.Mesh(polypGeo, mats.abyssalBioCyanGlowMat);
              polyp.position.set(rng.range(-reefW * 0.4, reefW * 0.4), reefH * 0.45 + rng.range(1.0, 5.0), rng.range(-reefD * 0.4, reefD * 0.4));
              cGroup.add(polyp);
            }
          } else if (cStyle === 1) {
            // --- Typology 1: Hydrothermal Black Smoker Vent Chimney ---
            const ventW = 3.5;
            const ventH = rng.range(18.0, 28.0);
            const cX = side * (frontX + ventW * 0.5);
            cGroup.position.set(cX, 0, cz);

            // Volcanic chimney spire
            const chimneyGeo = new THREE.CylinderGeometry(1.2, 2.8, ventH, 8);
            const chimney = new THREE.Mesh(chimneyGeo, mats.abyssalBasaltRockMat);
            chimney.position.y = ventH * 0.5;
            cGroup.add(chimney);

            // Glowing amber thermal vent orifice at top
            const orificeGeo = new THREE.SphereGeometry(1.6, 8, 8);
            const orifice = new THREE.Mesh(orificeGeo, mats.abyssalBioAmberGlowMat);
            orifice.position.y = ventH;
            cGroup.add(orifice);

            // Geothermal heat transfer conduit descending to seafloor
            const conduitGeo = new THREE.BoxGeometry(0.18, ventH, 0.18);
            const conduit = new THREE.Mesh(conduitGeo, mats.abyssalHydroBrassMat);
            conduit.position.set(-side * (ventW * 0.5 + 0.1), ventH * 0.5, 0);
            cGroup.add(conduit);

            const conduitGlow = new THREE.Mesh(new THREE.BoxGeometry(0.08, ventH, 0.08), mats.abyssalBioAmberGlowMat);
            conduitGlow.position.set(-side * (ventW * 0.5 + 0.15), ventH * 0.5, 0);
            cGroup.add(conduitGlow);
          } else if (cStyle === 2) {
            // --- Typology 2: Subsea Pressure Research Capsule & Airlock Pylon ---
            const pylonW = rng.range(7.5, 9.5);
            const pylonH = rng.range(18.0, 26.0);
            const pylonD = lotLength * rng.range(0.60, 0.72);
            const cX = side * (frontX + pylonW * 0.5);
            cGroup.position.set(cX, 0, cz);

            // Cylindrical research capsule body
            const capRadius = pylonW * 0.45;
            const capGeo = new THREE.CylinderGeometry(capRadius, capRadius, pylonH, 12);
            const capsule = new THREE.Mesh(capGeo, mats.abyssalNavyCompositeMat);
            capsule.position.y = pylonH * 0.5;
            capsule.castShadow = true;
            cGroup.add(capsule);

            // Domed observation cupola facing tracks
            const cupolaRadius = capRadius * 0.6;
            const cupolaGeo = new THREE.SphereGeometry(cupolaRadius, 12, 8, 0, Math.PI, 0, Math.PI);
            const cupola = new THREE.Mesh(cupolaGeo, mats.abyssalGlassTunnelMat);
            cupola.position.set(-side * capRadius * 0.8, pylonH * 0.6, 0);
            cupola.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
            cGroup.add(cupola);

            // Pressurized airlock umbilical bridge connecting to tunnel gallery
            const tubeLen = frontX - wallX + 1.2;
            const tubeGeo = new THREE.CylinderGeometry(1.6, 1.6, tubeLen, 12);
            const tube = new THREE.Mesh(tubeGeo, mats.abyssalNavyCompositeMat);
            tube.rotation.z = Math.PI / 2;
            tube.position.set(-side * (pylonW * 0.5 + tubeLen * 0.5), 6.5, 0);
            cGroup.add(tube);

            // Telemetry mast
            const mastH = rng.range(8.0, 12.0);
            const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, mastH, 6), mats.abyssalHydroBrassMat);
            mast.position.y = pylonH + mastH * 0.5;
            cGroup.add(mast);

            const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 6), mats.abyssalBioCyanGlowMat);
            beacon.position.y = pylonH + mastH;
            cGroup.add(beacon);
          } else {
            // --- Typology 3: Geothermal Extraction Rig & Acoustic Hydrophone Tower ---
            const rigW = rng.range(8.0, 12.0);
            const rigH = rng.range(20.0, 30.0);
            const rigD = lotLength * rng.range(0.65, 0.75);
            const cX = side * (frontX + rigW * 0.5);
            cGroup.position.set(cX, 0, cz);

            const mainRig = new THREE.Mesh(new THREE.BoxGeometry(rigW, rigH, rigD), mats.abyssalTitaniumRibMat);
            mainRig.position.y = rigH * 0.5;
            mainRig.castShadow = true;
            cGroup.add(mainRig);

            // Acoustic sonar dish
            const dish = new THREE.Mesh(new THREE.ConeGeometry(3.0, 1.2, 12, 1, true), mats.abyssalBioTealGlowMat);
            dish.rotation.x = Math.PI / 4;
            dish.rotation.z = side * 0.3;
            dish.position.set(0, rigH + 2.0, 0);
            cGroup.add(dish);

            // Glowing teal perimeter trim
            const trim = new THREE.Mesh(new THREE.BoxGeometry(rigW + 0.3, 0.3, rigD + 0.3), mats.abyssalBioTealGlowMat);
            trim.position.y = rigH;
            cGroup.add(trim);
          }
        } else {
          // --- Non-primary side: Low Benthic Rock Ledge & Coral Terrace ---
          // Low-profile structure (height <= 3.8m) preserving open oceanic abyss vista
          if (rng.chance(0.65)) {
            const ledgeW = rng.range(6.0, 8.5);
            const ledgeH = rng.range(2.0, 3.5);
            const ledgeD = lotLength * 0.55;
            const cX = side * (frontX + ledgeW * 0.5);
            cGroup.position.set(cX, 0, cz);

            const ledge = new THREE.Mesh(new THREE.BoxGeometry(ledgeW, ledgeH, ledgeD), mats.abyssalBasaltRockMat);
            ledge.position.y = ledgeH * 0.5;
            cGroup.add(ledge);

            // Bioluminescent sea fan cluster
            const coralMat = rng.chance(0.5) ? mats.abyssalBioTealGlowMat : mats.abyssalBioCyanGlowMat;
            const fan = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.5, 6), coralMat);
            fan.position.set(0, ledgeH + 1.25, 0);
            cGroup.add(fan);
          }
        }

        if (cGroup.children.length > 0) {
          group.add(cGroup);
        }
      });
    }
  }

  private buildAbyssalMonumentalSanctumDome(group: THREE.Group, chunkLength: number, domeZ: number): void {
    const mats = this.getSharedMaterials();
    const domeGroup = new THREE.Group();
    domeGroup.name = 'abyssal_sanctum_dome';
    domeGroup.position.set(0, 0, domeZ);

    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 4.8;
    const archTotalH = 16.5;

    // 1. Heavy Marine Titanium-Tungsten Support Pylons
    const pylonGeo = new THREE.BoxGeometry(1.8, archTotalH, 2.8);
    [-spanWidth * 0.5 - 1.2, spanWidth * 0.5 + 1.2].forEach((px) => {
      const pylon = new THREE.Mesh(pylonGeo, mats.abyssalTitaniumRibMat);
      pylon.position.set(px, archTotalH * 0.5, 0);
      pylon.castShadow = true;
      pylon.receiveShadow = true;
      domeGroup.add(pylon);

      // Vertical bioluminescent teal pressure seal
      const seal = new THREE.Mesh(new THREE.BoxGeometry(0.12, archTotalH * 0.9, 0.12), mats.abyssalBioTealGlowMat);
      seal.position.set(px + (px < 0 ? 0.95 : -0.95), archTotalH * 0.48, 0);
      domeGroup.add(seal);

      // Hydro-brass structural corner braces
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.4, 3.0), mats.abyssalHydroBrassMat);
      brace.position.set(px, 5.0, 0);
      domeGroup.add(brace);
    });

    // 2. High-Vaulted Arch Crown Girders (Y = 15.6m, clearance strictly >= 10.2m)
    const crown = new THREE.Mesh(new THREE.BoxGeometry(spanWidth + 4.0, 1.2, 3.0), mats.abyssalTitaniumRibMat);
    crown.position.set(0, archTotalH + 0.6, 0);
    crown.castShadow = true;
    domeGroup.add(crown);

    // 3. Geodesic Glass Pressure Dome Shell Vaulting Over Apex
    const domeShellGeo = new THREE.SphereGeometry(spanWidth * 0.65, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeShell = new THREE.Mesh(domeShellGeo, mats.abyssalGlassTunnelMat);
    domeShell.position.set(0, archTotalH + 0.6, 0);
    domeGroup.add(domeShell);

    // 4. Hydrostatic Pressure Halo Ring at Summit (Y = 19.0m, radius 7.2m, clearance >= 11.8m)
    const haloGeo = new THREE.TorusGeometry(7.2, 0.32, 6, 28);
    const halo = new THREE.Mesh(haloGeo, mats.abyssalBioTealGlowMat);
    halo.position.set(0, archTotalH + 2.5, 0);
    domeGroup.add(halo);

    // 5. Central Deep Ocean Transit Destination Banner
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 2.2), mats.abyssalTransitSignMat);
    sign.position.set(0, archTotalH - 1.2, 1.55);
    domeGroup.add(sign);

    // 6. Acoustic Sonar Navigation Beacons
    [-spanWidth * 0.5, spanWidth * 0.5].forEach((bx) => {
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), mats.abyssalBioCyanGlowMat);
      beacon.position.set(bx, archTotalH + 2.5, 1.4);
      domeGroup.add(beacon);
    });

    group.add(domeGroup);
  }

  private buildAbyssalResearchSkybridge(group: THREE.Group, chunkLength: number, bridgeZ: number): void {
    const mats = this.getSharedMaterials();
    const bridgeHeight = 12.5; // Strictly >= 12.0m clearance
    const bridgeDepth = 6.2;
    const spanW = CONSTANTS.LANE_WIDTH * 3 + 5.2;

    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = 'abyssal_skybridge';
    bridgeGroup.position.set(0, bridgeHeight, bridgeZ);

    // Laboratory bottom deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(spanW + 4.0, 0.45, bridgeDepth), mats.abyssalTitaniumRibMat);
    deck.position.set(0, 0, 0);
    deck.castShadow = true;
    deck.receiveShadow = true;
    bridgeGroup.add(deck);

    // Panoramic observation glass walls (height 2.8m)
    const glassGeo = new THREE.BoxGeometry(spanW + 3.8, 2.6, 0.14);
    [-bridgeDepth * 0.5 + 0.1, bridgeDepth * 0.5 - 0.1].forEach((gz) => {
      const gw = new THREE.Mesh(glassGeo, mats.abyssalGlassTunnelMat);
      gw.position.set(0, 1.4, gz);
      bridgeGroup.add(gw);
    });

    // Laboratory roof canopy with hydro-brass coping
    const roof = new THREE.Mesh(new THREE.BoxGeometry(spanW + 4.2, 0.45, bridgeDepth + 0.4), mats.abyssalNavyCompositeMat);
    roof.position.set(0, 2.85, 0);
    roof.castShadow = true;
    bridgeGroup.add(roof);

    const roofGlow = new THREE.Mesh(new THREE.BoxGeometry(spanW + 4.0, 0.08, bridgeDepth + 0.2), mats.abyssalBioCyanGlowMat);
    roofGlow.position.set(0, 3.1, 0);
    bridgeGroup.add(roofGlow);

    // Support columns flanking tracks
    const colGeo = new THREE.BoxGeometry(1.6, bridgeHeight, 2.2);
    [-spanW * 0.45, spanW * 0.45].forEach((cx) => {
      const col = new THREE.Mesh(colGeo, mats.abyssalTitaniumRibMat);
      col.position.set(cx, -bridgeHeight * 0.5, 0);
      col.castShadow = true;
      bridgeGroup.add(col);
    });

    // Docked Exploratory Deep-Sea Submersible
    const subGroup = new THREE.Group();
    subGroup.name = 'abyssal_submersible';
    subGroup.position.set(spanW * 0.35, 1.4, bridgeDepth * 0.5 + 2.8);

    // Submersible hull
    const subHull = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 6.0, 12), mats.abyssalHydroBrassMat);
    subHull.rotation.x = Math.PI / 2;
    subGroup.add(subHull);

    // Panoramic bubble viewport at front
    const viewDome = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), mats.abyssalGlassTunnelMat);
    viewDome.rotation.x = -Math.PI / 2;
    viewDome.position.set(0, 0, 3.0);
    subGroup.add(viewDome);

    // Amber floodlight beacons
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), mats.abyssalBioAmberGlowMat);
    light.position.set(0, -0.6, 3.4);
    subGroup.add(light);

    bridgeGroup.add(subGroup);
    group.add(bridgeGroup);
  }

  private buildAbyssalHydrothermalChasm(group: THREE.Group, chunkLength: number, chasmZ: number, rng: SeededRandom): void {
    const mats = this.getSharedMaterials();
    const chasmGroup = new THREE.Group();
    chasmGroup.name = 'abyssal_chasm';

    const wallX = CONSTANTS.TUNNEL_WALL_X;
    const side = rng.chance(0.5) ? -1 : 1;
    const chasmX = side * (wallX + rng.range(6.0, 8.5));
    chasmGroup.position.set(chasmX, 0, chasmZ);

    // Monumental hydrothermal chimney spire
    const spireH = rng.range(28.0, 36.0);
    const spireGeo = new THREE.CylinderGeometry(2.2, 5.5, spireH, 8);
    const spire = new THREE.Mesh(spireGeo, mats.abyssalBasaltRockMat);
    spire.position.y = spireH * 0.5;
    spire.castShadow = true;
    chasmGroup.add(spire);

    // Luminous sulfur-amber thermal fissures along the spire
    const fissureGeo = new THREE.BoxGeometry(0.25, spireH * 0.7, 0.25);
    const fissure = new THREE.Mesh(fissureGeo, mats.abyssalBioAmberGlowMat);
    fissure.position.set(-side * 1.8, spireH * 0.5, 0);
    chasmGroup.add(fissure);

    // Vent plume beacon at summit
    const plume = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 8), mats.abyssalBioAmberGlowMat);
    plume.position.y = spireH;
    chasmGroup.add(plume);

    group.add(chasmGroup);
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

    if (theme.id === 'NEON_RAINLINE') {
      // --- Monumental Cyber Megacity Transit Gateway (Neon Rainline) ---
      const pylonGeo = new THREE.BoxGeometry(3.6, portalH, 3.8);
      [-spanW * 0.5 - 1.2, spanW * 0.5 + 1.2].forEach((px) => {
        const pylon = new THREE.Mesh(pylonGeo, mats.neonRainAlloyMat);
        pylon.position.set(px, portalH * 0.5, portalZ);
        pylon.castShadow = true;
        pylon.receiveShadow = true;
        portalGroup.add(pylon);

        // Vertical cyan & magenta luminescent data channels
        const cyanStrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, portalH * 0.88, 0.12), mats.neonCyanGlowMat);
        cyanStrip.position.set(px + (px < 0 ? 1.82 : -1.82), portalH * 0.48, portalZ + 1.4);
        portalGroup.add(cyanStrip);

        const magentaStrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, portalH * 0.88, 0.12), mats.neonMagentaGlowMat);
        magentaStrip.position.set(px + (px < 0 ? 1.82 : -1.82), portalH * 0.48, portalZ - 1.4);
        portalGroup.add(magentaStrip);
      });

      // Overhead hexagonal crown beam
      const crown = new THREE.Mesh(new THREE.BoxGeometry(spanW + 5.0, 3.6, 4.2), mats.neonRainAlloyMat);
      crown.position.set(0, portalH + 0.8, portalZ);
      crown.castShadow = true;
      crown.receiveShadow = true;
      portalGroup.add(crown);

      // Illuminated digital transit destination banner
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 2.4), mats.neonTransitSignMat);
      sign.position.set(0, portalH + 0.8, portalZ + 2.12);
      portalGroup.add(sign);

      // Superconducting cyan glow halo
      const haloGeo = new THREE.TorusGeometry(spanW * 0.45, 0.25, 6, 24);
      const halo = new THREE.Mesh(haloGeo, mats.neonCyanGlowMat);
      halo.position.set(0, portalH + 2.8, portalZ);
      portalGroup.add(halo);

      // Pulsing cyan & magenta portal beacons
      [-spanW * 0.5 - 0.5, spanW * 0.5 + 0.5].forEach((bx, idx) => {
        const beaconMat = idx === 0 ? mats.neonCyanGlowMat : mats.neonMagentaGlowMat;
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), beaconMat);
        beacon.position.set(bx, portalH + 2.8, portalZ + 2.1);
        portalGroup.add(beacon);
      });

      group.add(portalGroup);
      return;
    } else if (theme.id === 'ORBITAL_HALO') {
      // --- Monumental Celestial Orbital Gateway Portal ---
      const pylonGeo = new THREE.BoxGeometry(3.6, portalH, 3.8);
      [-spanW * 0.5 - 1.2, spanW * 0.5 + 1.2].forEach((px) => {
        const pylon = new THREE.Mesh(pylonGeo, mats.orbitalWhiteCompositeMat);
        pylon.position.set(px, portalH * 0.5, portalZ);
        pylon.castShadow = true;
        pylon.receiveShadow = true;
        portalGroup.add(pylon);

        // Vertical electric cyan quantum flux runner
        const cyanStrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, portalH * 0.88, 0.12), mats.orbitalCyanGlowMat);
        cyanStrip.position.set(px + (px < 0 ? 1.82 : -1.82), portalH * 0.48, portalZ + 1.4);
        portalGroup.add(cyanStrip);
      });

      // Overhead monumental airlock crown bridge
      const crown = new THREE.Mesh(new THREE.BoxGeometry(spanW + 5.0, 3.6, 4.2), mats.orbitalTitaniumMat);
      crown.position.set(0, portalH + 0.8, portalZ);
      crown.castShadow = true;
      crown.receiveShadow = true;
      portalGroup.add(crown);

      // Orbital Transit Destination Sign
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 2.4), mats.orbitalTransitSignMat);
      sign.position.set(0, portalH + 0.8, portalZ + 2.12);
      portalGroup.add(sign);

      // Sweeping quantum accelerator halo ring
      const haloGeo = new THREE.TorusGeometry(spanW * 0.48, 0.32, 6, 28);
      const halo = new THREE.Mesh(haloGeo, mats.orbitalCyanGlowMat);
      halo.position.set(0, portalH + 2.8, portalZ);
      portalGroup.add(halo);

      // Navigation telemetry beacons
      [-spanW * 0.5 - 0.5, spanW * 0.5 + 0.5].forEach((bx) => {
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), mats.orbitalCyanGlowMat);
        beacon.position.set(bx, portalH + 2.8, portalZ + 2.1);
        portalGroup.add(beacon);
      });

      group.add(portalGroup);
      return;
    } else if (theme.id === 'ABYSSAL_GLASSLINE') {
      // --- Monumental Deep Ocean Trench Pressure Gateway Portal ---
      const pylonGeo = new THREE.BoxGeometry(3.6, portalH, 3.8);
      [-spanW * 0.5 - 1.2, spanW * 0.5 + 1.2].forEach((px) => {
        const pylon = new THREE.Mesh(pylonGeo, mats.abyssalTitaniumRibMat);
        pylon.position.set(px, portalH * 0.5, portalZ);
        pylon.castShadow = true;
        pylon.receiveShadow = true;
        portalGroup.add(pylon);

        // Vertical bioluminescent teal pressure seal channel
        const tealStrip = new THREE.Mesh(new THREE.BoxGeometry(0.12, portalH * 0.88, 0.12), mats.abyssalBioTealGlowMat);
        tealStrip.position.set(px + (px < 0 ? 1.82 : -1.82), portalH * 0.48, portalZ + 1.4);
        portalGroup.add(tealStrip);

        // Hydro-brass trim flange
        const brassFlange = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 3.9), mats.abyssalHydroBrassMat);
        brassFlange.position.set(px + (px < 0 ? 1.82 : -1.82), 4.5, portalZ);
        portalGroup.add(brassFlange);
      });

      // Overhead heavy hydrostatic compression crown
      const crown = new THREE.Mesh(new THREE.BoxGeometry(spanW + 5.0, 3.6, 4.2), mats.abyssalTitaniumRibMat);
      crown.position.set(0, portalH + 0.8, portalZ);
      crown.castShadow = true;
      crown.receiveShadow = true;
      portalGroup.add(crown);

      // Deep Ocean Transit Destination Sign
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 2.4), mats.abyssalTransitSignMat);
      sign.position.set(0, portalH + 0.8, portalZ + 2.12);
      portalGroup.add(sign);

      // Hydrostatic pressure ring
      const haloGeo = new THREE.TorusGeometry(spanW * 0.48, 0.32, 6, 28);
      const halo = new THREE.Mesh(haloGeo, mats.abyssalBioTealGlowMat);
      halo.position.set(0, portalH + 2.8, portalZ);
      portalGroup.add(halo);

      // Sonar bathymetric navigation beacons
      [-spanW * 0.5 - 0.5, spanW * 0.5 + 0.5].forEach((bx) => {
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), mats.abyssalBioCyanGlowMat);
        beacon.position.set(bx, portalH + 2.8, portalZ + 2.1);
        portalGroup.add(beacon);
      });

      group.add(portalGroup);
      return;
    } else if (theme.id === 'DOOMSDAY_LAST_TRANSIT') {
      // --- Fortified Apocalyptic Evacuation Blast Portal (Doomsday: Last Transit) ---
      const pylonGeo = new THREE.BoxGeometry(4.0, portalH, 4.4);
      [-spanW * 0.5 - 1.4, spanW * 0.5 + 1.4].forEach((px) => {
        const pylon = new THREE.Mesh(pylonGeo, mats.doomsdayScorchedConcreteMat);
        pylon.position.set(px, portalH * 0.5, portalZ);
        pylon.castShadow = true;
        pylon.receiveShadow = true;
        portalGroup.add(pylon);

        // Heavy steel blast shutter track guides
        const guideGeo = new THREE.BoxGeometry(0.5, portalH * 0.85, 0.8);
        const guide = new THREE.Mesh(guideGeo, mats.doomsdayRustedSteelMat);
        guide.position.set(px + (px < 0 ? 1.9 : -1.9), portalH * 0.45, portalZ);
        portalGroup.add(guide);

        // Flashing red emergency strobe beacons
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.40, 8, 8), mats.doomsdayEmergencyRedGlowMat);
        beacon.position.set(px + (px < 0 ? 2.0 : -2.0), portalH * 0.9, portalZ + 1.5);
        portalGroup.add(beacon);
      });

      // Overhead heavy reinforced concrete blast lintel crown
      const crown = new THREE.Mesh(new THREE.BoxGeometry(spanW + 5.5, 3.8, 4.8), mats.doomsdayScorchedConcreteMat);
      crown.position.set(0, portalH + 0.8, portalZ);
      crown.castShadow = true;
      crown.receiveShadow = true;
      portalGroup.add(crown);

      // Warning hazard stripe threshold beam (clearance >= 10.2m)
      const hazardBeam = new THREE.Mesh(new THREE.BoxGeometry(spanW + 4.8, 0.65, 0.5), mats.doomsdayHazardStripeMat);
      hazardBeam.position.set(0, portalH - 1.1, portalZ + 2.45);
      portalGroup.add(hazardBeam);

      // Evacuation Sector Distress Sign
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 2.4), mats.doomsdayDistressSignMat1);
      sign.position.set(0, portalH + 0.9, portalZ + 2.45);
      portalGroup.add(sign);

      // Overhead amber warning spotlights
      [-spanW * 0.45, spanW * 0.45].forEach((bx) => {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.5), mats.doomsdayFireAmberGlowMat);
        lamp.position.set(bx, portalH - 1.5, portalZ + 2.2);
        portalGroup.add(lamp);
      });

      group.add(portalGroup);
      return;
    } else if (theme.id === 'PHANTOM_LINE') {
      // --- Decaying Victorian Sepulchral Subway Portal (Phantom Line) ---
      const pylonGeo = new THREE.BoxGeometry(3.8, portalH, 4.4);
      [-spanW * 0.5 - 1.3, spanW * 0.5 + 1.3].forEach((px) => {
        const pylon = new THREE.Mesh(pylonGeo, mats.phantomWeatheredBrickMat);
        pylon.position.set(px, portalH * 0.5, portalZ);
        pylon.castShadow = true;
        pylon.receiveShadow = true;
        portalGroup.add(pylon);

        // Weathered cast-iron architectural pilaster trims
        const trim = new THREE.Mesh(new THREE.BoxGeometry(0.4, portalH * 0.9, 0.6), mats.phantomRustedIronMat);
        trim.position.set(px + (px < 0 ? 1.8 : -1.8), portalH * 0.45, portalZ);
        portalGroup.add(trim);

        // Cold-cathode spectral cyan gas lantern
        const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), mats.phantomSpectralGlowCyanMat);
        lantern.position.set(px + (px < 0 ? 1.9 : -1.9), portalH * 0.88, portalZ + 1.4);
        portalGroup.add(lantern);
      });

      // Overhead heavy weathered brick & iron arch crown (Y >= 10.2m)
      const crown = new THREE.Mesh(new THREE.BoxGeometry(spanW + 5.2, 3.6, 4.8), mats.phantomWeatheredBrickMat);
      crown.position.set(0, portalH + 0.8, portalZ);
      crown.castShadow = true;
      crown.receiveShadow = true;
      portalGroup.add(crown);

      // Decaying Victorian cast-iron arch frieze beam
      const frieze = new THREE.Mesh(new THREE.BoxGeometry(spanW + 4.6, 0.65, 0.5), mats.phantomRustedIronMat);
      frieze.position.set(0, portalH - 1.1, portalZ + 2.45);
      portalGroup.add(frieze);

      // Distorted antique station distress sign
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 2.4), mats.phantomDistressSignMat1);
      sign.position.set(0, portalH + 0.9, portalZ + 2.45);
      portalGroup.add(sign);

      // Overhead deep blood-crimson telegraph beacons
      [-spanW * 0.45, spanW * 0.45].forEach((bx) => {
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), mats.phantomBloodCrimsonGlowMat);
        lamp.position.set(bx, portalH - 1.5, portalZ + 2.2);
        portalGroup.add(lamp);
      });

      group.add(portalGroup);
      return;
    } else if (theme.id === 'HAUNTED_CARNIVAL') {
      // --- Extravagant Gothic Haunted Carnival Gateway Portal ---
      const pylonGeo = new THREE.BoxGeometry(4.0, portalH, 4.6);
      [-spanW * 0.5 - 1.4, spanW * 0.5 + 1.4].forEach((px) => {
        const pylon = new THREE.Mesh(pylonGeo, mats.hauntedGothicStoneMat);
        pylon.position.set(px, portalH * 0.5, portalZ);
        pylon.castShadow = true;
        pylon.receiveShadow = true;
        portalGroup.add(pylon);

        // Giant glowing grinning jack-o'-lantern finial atop pillar
        const pumpkinGeo = new THREE.SphereGeometry(1.6, 12, 12);
        const pumpkin = new THREE.Mesh(pumpkinGeo, mats.hauntedJackOLanternGlowMat);
        pumpkin.position.set(px, portalH + 1.8, portalZ);
        portalGroup.add(pumpkin);

        // Black wrought-iron decorative corner bracket
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.5, portalH * 0.85, 0.6), mats.hauntedWroughtIronMat);
        bracket.position.set(px + (px < 0 ? 1.9 : -1.9), portalH * 0.45, portalZ);
        portalGroup.add(bracket);
      });

      // Overhead grand gothic arch crown with pointed center peak (clearance >= 10.2m)
      const archSpan = new THREE.Mesh(new THREE.BoxGeometry(spanW + 5.5, 3.4, 4.2), mats.hauntedGothicStoneMat);
      archSpan.position.set(0, portalH + 0.8, portalZ);
      archSpan.castShadow = true;
      archSpan.receiveShadow = true;
      portalGroup.add(archSpan);

      // Pointed gothic center pediment
      const pediment = new THREE.Mesh(new THREE.ConeGeometry(5.2, 5.0, 4), mats.hauntedGothicStoneMat);
      pediment.position.set(0, portalH + 4.8, portalZ);
      pediment.rotation.y = Math.PI / 4;
      portalGroup.add(pediment);

      // Wrought-iron bat-wing finial atop pediment
      const batFinial = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 0.4), mats.hauntedWroughtIronMat);
      batFinial.position.set(0, portalH + 7.8, portalZ);
      portalGroup.add(batFinial);

      // Illuminated Carnival Entrance Marquee Sign
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(11.0, 2.5), mats.hauntedSpookySignMat1);
      sign.position.set(0, portalH + 0.8, portalZ + 2.2);
      portalGroup.add(sign);

      // Glowing violet & amber carnival lantern bulbs along bottom arch
      for (let bx = -spanW * 0.42; bx <= spanW * 0.42; bx += 2.4) {
        const isAmber = Math.abs(bx) % 4.8 < 2.4;
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), isAmber ? mats.hauntedAmberGlowMat : mats.hauntedVioletGlowMat);
        bulb.position.set(bx, portalH - 1.2, portalZ + 2.15);
        portalGroup.add(bulb);
      }

      group.add(portalGroup);
      return;
    } else if (theme.id === 'VIP_EXPRESS') {
      // --- Ceremonial Civic Gateway Portal (VIP Express: The Great Inauguration) ---
      const pylonGeo = new THREE.BoxGeometry(4.0, portalH, 4.4);
      [-spanW * 0.5 - 1.4, spanW * 0.5 + 1.4].forEach((px) => {
        // Red-sandstone ceremonial pylon
        const pylon = new THREE.Mesh(pylonGeo, mats.vipSandstoneMat);
        pylon.position.set(px, portalH * 0.5, portalZ);
        pylon.castShadow = true;
        pylon.receiveShadow = true;
        portalGroup.add(pylon);

        // Fluted ivory pilasters
        const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.8, portalH * 0.88, 1.2), mats.vipIvoryFacadeMat);
        pilaster.position.set(px + (px < 0 ? 1.8 : -1.8), portalH * 0.46, portalZ);
        portalGroup.add(pilaster);

        // Golden kalash / finial dome on top of each pylon
        const dome = new THREE.Mesh(new THREE.ConeGeometry(1.8, 3.2, 12), mats.vipGoldOrnamentMat);
        dome.position.set(px, portalH + 1.6, portalZ);
        portalGroup.add(dome);

        const finialBall = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), mats.vipGoldOrnamentMat);
        finialBall.position.set(px, portalH + 3.4, portalZ);
        portalGroup.add(finialBall);
      });

      // Overhead monumental ivory arch beam (clearance >= 10.2m)
      const archSpan = new THREE.Mesh(new THREE.BoxGeometry(spanW + 5.6, 3.4, 4.2), mats.vipIvoryFacadeMat);
      archSpan.position.set(0, portalH + 0.8, portalZ);
      archSpan.castShadow = true;
      archSpan.receiveShadow = true;
      portalGroup.add(archSpan);

      // Royal navy & gold trim frieze
      const frieze = new THREE.Mesh(new THREE.BoxGeometry(spanW + 5.8, 0.6, 4.4), mats.vipNavyTrimMat);
      frieze.position.set(0, portalH - 1.1, portalZ);
      portalGroup.add(frieze);

      // Huge Ceremonial "GRAND OPENING" Gateway Banner
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(12.0, 2.6), mats.vipGrandOpeningSignMat);
      sign.position.set(0, portalH + 0.8, portalZ + 2.22);
      portalGroup.add(sign);

      // Marigold garland swag along arch beam
      const garland = new THREE.Mesh(new THREE.BoxGeometry(spanW + 4.8, 0.5, 0.5), mats.vipMarigoldGarlandMat);
      garland.position.set(0, portalH - 0.7, portalZ + 2.2);
      portalGroup.add(garland);

      // Ceremonial rotating amber & blue VIP beacons atop gateway
      [-spanW * 0.45, -spanW * 0.15, spanW * 0.15, spanW * 0.45].forEach((bx, idx) => {
        const beaconMat = idx % 2 === 0 ? mats.vipBeaconAmberMat : mats.vipBeaconBlueMat;
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), beaconMat);
        beacon.position.set(bx, portalH + 2.8, portalZ + 2.1);
        portalGroup.add(beacon);
      });

      group.add(portalGroup);
      return;
    } else if (theme.id === 'RAHULVERSE') {
      // --- Yatra Grand Gateway Portal (Rahulverse: The Never-Ending Yatra) ---
      const pylonGeo = new THREE.BoxGeometry(3.6, portalH, 4.0);
      [-spanW * 0.5 - 1.2, spanW * 0.5 + 1.2].forEach((px) => {
        const pylon = new THREE.Mesh(pylonGeo, new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
        pylon.position.set(px, portalH * 0.5, portalZ);
        portalGroup.add(pylon);
      });
      const beamGeo = new THREE.BoxGeometry(spanW + 5.5, 1.4, 2.2);
      const beam = new THREE.Mesh(beamGeo, new THREE.MeshStandardMaterial({ color: 0xf97316 }));
      beam.position.set(0, portalH + 0.7, portalZ);
      portalGroup.add(beam);
      group.add(portalGroup);
      return;
    } else if (theme.id === 'MIDNIGHT_VELVET') {
      // --- Midnight Velvet Art Deco Gateway Portal ---
      const pylonGeo = new THREE.BoxGeometry(3.6, portalH, 4.0);
      [-spanW * 0.5 - 1.2, spanW * 0.5 + 1.2].forEach((px) => {
        const pylon = new THREE.Mesh(pylonGeo, new THREE.MeshStandardMaterial({ color: 0x0a0a12, roughness: 0.2, metalness: 0.4 }));
        pylon.position.set(px, portalH * 0.5, portalZ);
        portalGroup.add(pylon);

        const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.2, 4.2), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 }));
        goldTrim.position.set(px, portalH - 0.6, portalZ);
        portalGroup.add(goldTrim);
      });

      const lintelGeo = new THREE.BoxGeometry(spanW + 8.5, 3.2, 4.4);
      const lintel = new THREE.Mesh(lintelGeo, new THREE.MeshStandardMaterial({ color: 0x4a0e17, roughness: 0.7 }));
      lintel.position.set(0, portalH + 1.6, portalZ);
      portalGroup.add(lintel);

      const cornice = new THREE.Mesh(new THREE.BoxGeometry(spanW + 9.5, 1.0, 5.0), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.88, roughness: 0.2 }));
      cornice.position.set(0, portalH + 3.6, portalZ);
      portalGroup.add(cornice);

      group.add(portalGroup);
      return;
    }

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
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), mats.subwaySignalRedMat);
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
    portalType: 'ENTRY' | 'EXIT' | 'BOTH' | 'NONE',
    isAerialCorridor: boolean = false
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
    
    // Vault height:
    // For designated aerial corridors, crown rises to 12.5m (TUNNEL_AERIAL_VAULT_HEIGHT)
    // providing generous overhead clearance for runner at 9.0m and camera at 11.4m with 0 clipping!
    const ceilingH = isAerialCorridor
      ? (CONSTANTS.TUNNEL_AERIAL_VAULT_HEIGHT || 12.5)
      : (isStationHall ? 10.6 : 9.8);
    const wallH = isAerialCorridor ? 10.5 : 6.5;

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
    leftHaunch.position.set(-spanW * 0.5 + haunchW * 0.48, ceilingH - 0.35, -chunkLength * 0.5);
    leftHaunch.receiveShadow = true;
    undergroundGroup.add(leftHaunch);

    const rightHaunch = new THREE.Mesh(new THREE.BoxGeometry(haunchW, ceilingThick, chunkLength), mats.tunnelCeilingMat);
    rightHaunch.rotation.z = haunchAngle;
    rightHaunch.position.set(spanW * 0.5 - haunchW * 0.48, ceilingH - 0.35, -chunkLength * 0.5);
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
        new THREE.BoxGeometry(0.08, 0.04, chunkLength, 1, 1, Math.round(chunkLength / 2.0)),
        mats.hazardStripeMat
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
    duct.position.set(-3.8, ceilingH - 0.5, -chunkLength * 0.5);
    duct.castShadow = true;
    undergroundGroup.add(duct);

    // Duct suspension hangers
    if (detail !== 'MINIMAL') {
      const hangerGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);
      for (let hz = 0; hz < chunkLength; hz += 16) {
        const hanger = new THREE.Mesh(hangerGeo, mats.tunnelRibMat);
        hanger.position.set(-3.8, ceilingH - 0.25, -hz - 8);
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
    const beaconGeo = new THREE.SphereGeometry(0.25, 8, 8);
    [-spanW * 0.42, spanW * 0.42].forEach((bx) => {
      const beacon = new THREE.Mesh(beaconGeo, mats.subwaySignalRedMat);
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
    CurvedShaderManager.getInstance().applyCurvature(birdMat);

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
      CurvedShaderManager.getInstance().applyCurvature(haloMat);
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.set(0, 8.2, z);
      haloGroup.add(halo);
    }

    group.add(haloGroup);
  }

  // -------------------------------------------------------------------------
  // DOOMSDAY: LAST TRANSIT SCENERY
  // -------------------------------------------------------------------------

  /**
   * Builds apocalyptic ruins, blast retaining walls, damaged gantries, and signature landmarks
   * for the DOOMSDAY: LAST TRANSIT premium world.
   */
  private buildDoomsdayLastTransitScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const rng = new SeededRandom(seed);

    // 1. Heavy fortified blast retaining walls and service walkways flanking tracks
    this.buildDoomsdayBlastWallsAndWalkways(group, roadbedWidth, curbWidth, chunkLength, detail);

    // 2. Heavy damaged transit gantries with warning strobes and severed conduits
    this.buildDoomsdayDamagedGantries(group, chunkLength, detail);

    // 3. Rubble piles, fortified barricades, distress signs, and emergency searchlights
    this.buildDoomsdayRubbleAndCraterFormations(group, chunkLength, rng, detail);

    // 4. Deterministic signature landmarks across chunks (varied by seed)
    const landmarkVariant = Math.floor(Math.abs(seed) / 7) % 4;
    if (landmarkVariant === 0) {
      this.buildDoomsdayRuinedSkyscraper(group, chunkLength, -chunkLength * 0.45, rng);
    } else if (landmarkVariant === 1) {
      this.buildDoomsdayBunkerGateway(group, chunkLength, -chunkLength * 0.5);
    } else if (landmarkVariant === 2) {
      this.buildDoomsdayFracturedSkybridge(group, chunkLength, -chunkLength * 0.55);
    } else {
      this.buildDoomsdayFlareStack(group, chunkLength, -chunkLength * 0.4, rng);
    }
  }

  /**
   * Fortified blast retaining walls with rebar ribs, hazard chevrons, and damaged catwalks.
   * Safety invariant: Wall face is at |X| = 6.6m >= 6.5m, safely outside the 4.0m playable zone.
   */
  private buildDoomsdayBlastWallsAndWalkways(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const wallX = CONSTANTS.TUNNEL_WALL_X; // 6.6m
    const wallHeight = 3.6;
    const wallThickness = 0.8;

    // Continuous scorched concrete blast walls flanking tracks
    const wallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, chunkLength);
    [-wallX, wallX].forEach((wx) => {
      const wall = new THREE.Mesh(wallGeo, mats.doomsdayScorchedConcreteMat);
      wall.position.set(wx, wallHeight * 0.5, -chunkLength * 0.5);
      wall.castShadow = true;
      wall.receiveShadow = true;
      group.add(wall);

      // Warning hazard stripe runner along the top coping
      const runnerGeo = new THREE.BoxGeometry(0.12, 0.22, chunkLength);
      const runner = new THREE.Mesh(runnerGeo, mats.doomsdayHazardStripeMat);
      runner.position.set(wx + (wx < 0 ? 0.38 : -0.38), wallHeight - 0.12, -chunkLength * 0.5);
      group.add(runner);

      // Heavy steel rebar buttresses every 10m along the wall exterior
      const buttressSpacing = 10.0;
      const buttressCount = Math.floor(chunkLength / buttressSpacing);
      const buttressGeo = new THREE.BoxGeometry(0.45, wallHeight * 1.15, 0.45);
      for (let b = 0; b < buttressCount; b++) {
        const bz = -b * buttressSpacing - 5.0;
        const buttress = new THREE.Mesh(buttressGeo, mats.doomsdayRustedSteelMat);
        buttress.position.set(wx + (wx < 0 ? -0.35 : 0.35), wallHeight * 0.55, bz);
        buttress.castShadow = true;
        group.add(buttress);
      }
    });

    // Outer service catwalks with rusted industrial grating (|X| >= 7.2m)
    if (detail !== 'MINIMAL') {
      const catwalkWidth = 1.4;
      const catwalkY = 1.8;
      const catwalkGeo = new THREE.BoxGeometry(catwalkWidth, 0.15, chunkLength);
      [-wallX - 0.9, wallX + 0.9].forEach((cx) => {
        const catwalk = new THREE.Mesh(catwalkGeo, mats.doomsdayRustedSteelMat);
        catwalk.position.set(cx, catwalkY, -chunkLength * 0.5);
        group.add(catwalk);

        // Catwalk safety handrails (|X| >= 7.8m)
        const railGeo = new THREE.BoxGeometry(0.08, 0.9, chunkLength);
        const rail = new THREE.Mesh(railGeo, mats.doomsdayRebarSteelMat);
        rail.position.set(cx + (cx < 0 ? -catwalkWidth * 0.45 : catwalkWidth * 0.45), catwalkY + 0.5, -chunkLength * 0.5);
        group.add(rail);
      });
    }

    // Wall-mounted emergency hazard floodlights every 24m
    const lampSpacing = 24.0;
    const lampCount = Math.floor(chunkLength / lampSpacing);
    const lampArmGeo = new THREE.BoxGeometry(0.6, 0.1, 0.1);
    const lampHeadGeo = new THREE.BoxGeometry(0.35, 0.2, 0.25);
    for (let l = 0; l < lampCount; l++) {
      const lz = -l * lampSpacing - 12.0;
      [-wallX, wallX].forEach((wx, sideIdx) => {
        const inwardSign = wx < 0 ? 1 : -1;
        const arm = new THREE.Mesh(lampArmGeo, mats.doomsdayRustedSteelMat);
        arm.position.set(wx + inwardSign * 0.3, wallHeight + 0.5, lz);
        group.add(arm);

        const lampMat = (sideIdx + l) % 2 === 0 ? mats.doomsdayFireAmberGlowMat : mats.doomsdayEmergencyRedGlowMat;
        const lamp = new THREE.Mesh(lampHeadGeo, lampMat);
        lamp.position.set(wx + inwardSign * 0.6, wallHeight + 0.45, lz);
        group.add(lamp);
      });
    }
  }

  /**
   * Damaged transit gantries spanning the track at 16m intervals.
   * Safety invariant: Vertical clearance is strictly >= 10.1m, well above train roof (4.35m) and jump arcs.
   */
  private buildDoomsdayDamagedGantries(
    group: THREE.Group,
    chunkLength: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const gantrySpacing = 16.0;
    const gantryCount = Math.floor(chunkLength / gantrySpacing);
    const poleHeight = 10.8;
    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 3.8; // ~10.4m

    for (let g = 0; g < gantryCount; g++) {
      const gz = -g * gantrySpacing - 8.0;
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, gz);

      // Heavy scorched steel columns flanking tracks (X = ±5.2m, safely outside ±4.0m)
      const colGeo = new THREE.BoxGeometry(0.55, poleHeight, 0.6);
      [-spanWidth * 0.5, spanWidth * 0.5].forEach((px) => {
        const col = new THREE.Mesh(colGeo, mats.doomsdayRustedSteelMat);
        col.position.set(px, poleHeight * 0.5, 0);
        col.castShadow = true;
        gantryGroup.add(col);

        // Flashing emergency warning beacon on column shoulder
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 6), mats.doomsdayEmergencyRedGlowMat);
        beacon.position.set(px, poleHeight * 0.85, (px < 0 ? 0.35 : -0.35));
        gantryGroup.add(beacon);
      });

      // Overhead heavy primary steel box beam (center Y = 10.8m, bottom flange Y = 10.45m >= 10.1m)
      const beamGeo = new THREE.BoxGeometry(spanWidth + 1.2, 0.7, 0.8);
      const beam = new THREE.Mesh(beamGeo, mats.doomsdayRustedSteelMat);
      beam.position.set(0, poleHeight, 0);
      beam.castShadow = true;
      gantryGroup.add(beam);

      // Warning hazard stripe runner under the gantry
      const stripeGeo = new THREE.BoxGeometry(spanWidth, 0.15, 0.82);
      const stripe = new THREE.Mesh(stripeGeo, mats.doomsdayHazardStripeMat);
      stripe.position.set(0, poleHeight - 0.36, 0);
      gantryGroup.add(stripe);

      // Evacuation Sector Distress Sign on alternate gantries
      if (g % 2 === 0) {
        const signMat = (g % 4 === 0) ? mats.doomsdayDistressSignMat1 : mats.doomsdayDistressSignMat3;
        const signGeo = new THREE.PlaneGeometry(3.6, 1.2);
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, poleHeight + 0.75, 0.42);
        gantryGroup.add(sign);
      }

      // Overhead amber track inspection spotlights pointing downward
      [-spanWidth * 0.28, spanWidth * 0.28].forEach((lx) => {
        const spot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.3), mats.doomsdayFireAmberGlowMat);
        spot.position.set(lx, poleHeight - 0.45, 0);
        gantryGroup.add(spot);
      });

      // Sheared/twisted dangling rebar and cables (detail BALANCED/FULL)
      if (detail !== 'MINIMAL' && g % 3 === 1) {
        const dangleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 4);
        const dangle = new THREE.Mesh(dangleGeo, mats.doomsdayRebarSteelMat);
        dangle.position.set(1.4, poleHeight - 0.55, 0.2);
        dangle.rotation.z = 0.25;
        gantryGroup.add(dangle);
      }

      group.add(gantryGroup);
    }
  }

  /**
   * Perimeter rubble clusters, charred barricades, and warning signage.
   * Safety invariant: Placed strictly at |X| >= 4.8m to prevent collision intrusion.
   */
  private buildDoomsdayRubbleAndCraterFormations(
    group: THREE.Group,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const clusterCount = detail === 'MINIMAL' ? 2 : (detail === 'BALANCED' ? 3 : 5);

    for (let i = 0; i < clusterCount; i++) {
      const side = rng.chance(0.5) ? -1 : 1;
      const rubbleX = side * rng.range(5.6, 6.4); // Outside playable corridor and clearance envelope (|X| >= 4.85m)
      const rubbleZ = -rng.range(6.0, chunkLength - 6.0);
      const rubbleGroup = new THREE.Group();
      rubbleGroup.position.set(rubbleX, 0, rubbleZ);

      // Scorched concrete debris block
      const bW = rng.range(0.9, 1.5);
      const bH = rng.range(0.6, 1.2);
      const bD = rng.range(0.8, 1.6);
      const blockGeo = new THREE.BoxGeometry(bW, bH, bD);
      const block = new THREE.Mesh(blockGeo, mats.doomsdayScorchedConcreteMat);
      block.position.y = bH * 0.5;
      block.rotation.y = rng.range(-0.4, 0.4);
      block.rotation.z = side * 0.15;
      block.castShadow = true;
      rubbleGroup.add(block);

      // Twisted rebar spike protruding from rubble
      const rebarGeo = new THREE.CylinderGeometry(0.04, 0.04, rng.range(1.2, 1.8), 4);
      const rebar = new THREE.Mesh(rebarGeo, mats.doomsdayRebarSteelMat);
      rebar.position.set(rng.range(-0.3, 0.3), bH + 0.6, rng.range(-0.3, 0.3));
      rebar.rotation.x = rng.range(-0.3, 0.3);
      rebar.rotation.z = side * rng.range(0.2, 0.5);
      rubbleGroup.add(rebar);

      // Smoldering ember / flare marker atop the debris
      if (rng.chance(0.6)) {
        const ember = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), mats.doomsdayFireAmberGlowMat);
        ember.position.set(0, bH + 0.1, 0);
        rubbleGroup.add(ember);
      }

      // Distress / danger billboard marker along the perimeter (|X| >= 5.0m)
      if (i === 1 && detail !== 'MINIMAL') {
        const boardPost = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.4, 0.15), mats.doomsdayRustedSteelMat);
        boardPost.position.set(side * 0.4, 1.2, 0);
        rubbleGroup.add(boardPost);

        const boardGeo = new THREE.PlaneGeometry(1.8, 1.1);
        const boardMat = rng.chance(0.5) ? mats.doomsdayBillboardMat1 : mats.doomsdayBillboardMat2;
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.set(side * 0.4, 2.0, 0.1);
        board.rotation.y = side < 0 ? 0.3 : Math.PI - 0.3;
        rubbleGroup.add(board);
      }

      group.add(rubbleGroup);
    }
  }

  /**
   * Landmark 0: Shattered Skyscraper Ruin.
   * Imposing sheared corporate tower with exposed twisted rebar framework and flashing beacon.
   */
  private buildDoomsdayRuinedSkyscraper(
    group: THREE.Group,
    chunkLength: number,
    monoZ: number,
    rng: SeededRandom
  ): void {
    const mats = this.getSharedMaterials();
    const towerGroup = new THREE.Group();
    towerGroup.name = 'doomsday_ruined_skyscraper';

    const side = rng.chance(0.5) ? -1 : 1;
    const towerX = side * 18.5; // Well outside tracks
    towerGroup.position.set(towerX, 0, monoZ);

    const towerW = 14.0;
    const towerD = 14.0;
    const towerH = 48.0;

    // Main fractured tower body
    const towerGeo = new THREE.BoxGeometry(towerW, towerH, towerD);
    const tower = new THREE.Mesh(towerGeo, mats.doomsdayScorchedConcreteMat);
    tower.position.y = towerH * 0.5;
    tower.castShadow = true;
    towerGroup.add(tower);

    // Shattered window ribbons on the facade
    const glassRibbonGeo = new THREE.BoxGeometry(towerW * 0.85, towerH * 0.65, 0.2);
    const glassRibbon = new THREE.Mesh(glassRibbonGeo, mats.doomsdayShatteredGlassMat);
    glassRibbon.position.set(0, towerH * 0.45, -side * (towerD * 0.5 + 0.1));
    towerGroup.add(glassRibbon);

    // Sheared diagonal summit cap creating an unmistakable broken skyline silhouette
    const shearedCapGeo = new THREE.BoxGeometry(towerW * 0.75, 12.0, towerD * 0.75);
    const shearedCap = new THREE.Mesh(shearedCapGeo, mats.doomsdayScorchedConcreteMat);
    shearedCap.position.set(-side * 2.0, towerH + 4.5, 0);
    shearedCap.rotation.z = side * 0.22;
    shearedCap.castShadow = true;
    towerGroup.add(shearedCap);

    // Exposed structural rebar spires jutting from the sheared top
    for (let r = 0; r < 5; r++) {
      const spireH = rng.range(6.0, 12.0);
      const spireGeo = new THREE.CylinderGeometry(0.12, 0.15, spireH, 6);
      const spire = new THREE.Mesh(spireGeo, mats.doomsdayRebarSteelMat);
      spire.position.set(rng.range(-4.0, 4.0), towerH + 8.0 + spireH * 0.5, rng.range(-4.0, 4.0));
      spire.rotation.x = rng.range(-0.15, 0.15);
      spire.rotation.z = rng.range(-0.25, 0.25);
      towerGroup.add(spire);

      // Warning aviation beacon atop the tallest spire
      if (r === 0) {
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), mats.doomsdayEmergencyRedGlowMat);
        beacon.position.set(spire.position.x, towerH + 8.0 + spireH, spire.position.z);
        towerGroup.add(beacon);
      }
    }

    group.add(towerGroup);
  }

  /**
   * Landmark 1: Fortified Evacuation Bunker Gateway.
   * Massive blast portal archway with heavy pylons, warning chevrons, and distress transponder.
   * Safety invariant: Vertical clearance is strictly >= 10.2m over the playable track.
   */
  private buildDoomsdayBunkerGateway(group: THREE.Group, chunkLength: number, gateZ: number): void {
    const mats = this.getSharedMaterials();
    const bunkerGroup = new THREE.Group();
    bunkerGroup.name = 'doomsday_bunker_gateway';
    bunkerGroup.position.set(0, 0, gateZ);

    const gateH = 13.5;
    const spanW = 12.0;

    // Massive reinforced concrete bunker pylons (|X| = 6.8m, safely outside ±4.0m)
    const pylonGeo = new THREE.BoxGeometry(3.6, gateH, 4.8);
    [-spanW * 0.5 - 0.8, spanW * 0.5 + 0.8].forEach((px) => {
      const pylon = new THREE.Mesh(pylonGeo, mats.doomsdayScorchedConcreteMat);
      pylon.position.set(px, gateH * 0.5, 0);
      pylon.castShadow = true;
      pylon.receiveShadow = true;
      bunkerGroup.add(pylon);

      // Heavy blast door vertical guide rail
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.4, gateH * 0.9, 0.6), mats.doomsdayRustedSteelMat);
      rail.position.set(px + (px < 0 ? 1.7 : -1.7), gateH * 0.45, 0);
      bunkerGroup.add(rail);

      // Emergency red beacon array
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), mats.doomsdayEmergencyRedGlowMat);
      beacon.position.set(px + (px < 0 ? 1.8 : -1.8), gateH * 0.88, 1.8);
      bunkerGroup.add(beacon);
    });

    // Overhead heavy concrete lintel arch (bottom edge at Y = 10.6m >= 10.1m)
    const lintelGeo = new THREE.BoxGeometry(spanW + 4.5, 3.2, 5.0);
    const lintel = new THREE.Mesh(lintelGeo, mats.doomsdayScorchedConcreteMat);
    lintel.position.set(0, gateH - 0.6, 0);
    lintel.castShadow = true;
    bunkerGroup.add(lintel);

    // Hazard stripe warning boundary beam
    const hazardBeamGeo = new THREE.BoxGeometry(spanW + 3.8, 0.55, 0.4);
    const hazardBeam = new THREE.Mesh(hazardBeamGeo, mats.doomsdayHazardStripeMat);
    hazardBeam.position.set(0, gateH - 2.1, 2.52);
    bunkerGroup.add(hazardBeam);

    // Evacuation Transponder Distress Sign
    const signGeo = new THREE.PlaneGeometry(8.5, 2.0);
    const sign = new THREE.Mesh(signGeo, mats.doomsdayDistressSignMat2);
    sign.position.set(0, gateH - 0.4, 2.55);
    bunkerGroup.add(sign);

    group.add(bunkerGroup);
  }

  /**
   * Landmark 2: Fractured Skybridge & Suspended Rail.
   * Severed overhead maglev transit bridge with dangling cables far above the tracks.
   * Safety invariant: Bridge clearance is strictly >= 12.0m (clearance >= 10.1m).
   */
  private buildDoomsdayFracturedSkybridge(group: THREE.Group, chunkLength: number, bridgeZ: number): void {
    const mats = this.getSharedMaterials();
    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = 'doomsday_fractured_skybridge';
    bridgeGroup.position.set(0, 0, bridgeZ);

    const bridgeY = 13.0; // Well above tracks (Y >= 10.1m)

    // West fractured span (X from -24m to -1.8m)
    const westLen = 22.2;
    const westSpanGeo = new THREE.BoxGeometry(westLen, 1.8, 4.5);
    const westSpan = new THREE.Mesh(westSpanGeo, mats.doomsdayBlastAlloyMat);
    westSpan.position.set(-westLen * 0.5 - 1.8, bridgeY, 0);
    westSpan.castShadow = true;
    bridgeGroup.add(westSpan);

    // East fractured span (X from 2.2m to 24m)
    const eastLen = 21.8;
    const eastSpanGeo = new THREE.BoxGeometry(eastLen, 1.8, 4.5);
    const eastSpan = new THREE.Mesh(eastSpanGeo, mats.doomsdayBlastAlloyMat);
    eastSpan.position.set(eastLen * 0.5 + 2.2, bridgeY - 0.8, 0);
    eastSpan.rotation.z = -0.06;
    eastSpan.castShadow = true;
    bridgeGroup.add(eastSpan);

    // Abandoned damaged transit car on the west elevated deck
    const carGeo = new THREE.BoxGeometry(7.5, 2.2, 3.2);
    const car = new THREE.Mesh(carGeo, mats.doomsdayRustedSteelMat);
    car.position.set(-8.5, bridgeY + 1.8, 0);
    car.rotation.y = 0.12;
    bridgeGroup.add(car);

    // Dangling steel suspension cables at the fracture gap (Y >= 10.4m, safe above track)
    const cable1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 4), mats.doomsdayRebarSteelMat);
    cable1.position.set(-2.0, bridgeY - 1.1, 1.5);
    cable1.rotation.z = 0.18;
    bridgeGroup.add(cable1);

    const cable2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 4), mats.doomsdayRebarSteelMat);
    cable2.position.set(2.4, bridgeY - 1.6, -1.2);
    cable2.rotation.z = -0.22;
    bridgeGroup.add(cable2);

    group.add(bridgeGroup);
  }

  /**
   * Landmark 3: Industrial Thermal Flare Stack & Vent Silo.
   * High-capacity exhaust tower burning off volatile reactor/refinery pressure.
   */
  private buildDoomsdayFlareStack(
    group: THREE.Group,
    chunkLength: number,
    flareZ: number,
    rng: SeededRandom
  ): void {
    const mats = this.getSharedMaterials();
    const flareGroup = new THREE.Group();
    flareGroup.name = 'doomsday_flare_stack';

    const side = rng.chance(0.5) ? -1 : 1;
    const flareX = side * 17.0; // Outside playable tracks
    flareGroup.position.set(flareX, 0, flareZ);

    const stackH = 34.0;
    const stackRadius = 2.4;

    // Industrial exhaust chimney stack
    const stackGeo = new THREE.CylinderGeometry(stackRadius * 0.8, stackRadius, stackH, 12);
    const stack = new THREE.Mesh(stackGeo, mats.doomsdayRustedSteelMat);
    stack.position.y = stackH * 0.5;
    stack.castShadow = true;
    flareGroup.add(stack);

    // Hazard chevron warning collar at mid-height
    const collarGeo = new THREE.CylinderGeometry(stackRadius * 0.95, stackRadius * 0.95, 2.2, 12);
    const collar = new THREE.Mesh(collarGeo, mats.doomsdayHazardStripeMat);
    collar.position.y = stackH * 0.6;
    flareGroup.add(collar);

    // Summit burner nozzle ring
    const burnerGeo = new THREE.CylinderGeometry(stackRadius * 1.15, stackRadius * 0.75, 1.8, 12);
    const burner = new THREE.Mesh(burnerGeo, mats.doomsdayBlastAlloyMat);
    burner.position.y = stackH + 0.9;
    flareGroup.add(burner);

    // Roaring burnoff flame beacon at summit
    const flameGeo = new THREE.ConeGeometry(stackRadius * 1.3, 7.5, 8);
    const flame = new THREE.Mesh(flameGeo, mats.doomsdayFireAmberGlowMat);
    flame.position.y = stackH + 5.2;
    flareGroup.add(flame);

    // Base molten runoff fissure trench
    const fissureGeo = new THREE.BoxGeometry(6.5, 0.4, 6.5);
    const fissure = new THREE.Mesh(fissureGeo, mats.doomsdayMoltenGlowMat);
    fissure.position.y = 0.2;
    flareGroup.add(fissure);

    group.add(flareGroup);
  }

  // -------------------------------------------------------------------------
  // PHANTOM LINE: GHOST HORROR SCENERY
  // -------------------------------------------------------------------------

  /**
   * Builds abandoned Victorian subway architecture, decaying ceramic walls, derelict cast-iron
   * arches, disused platforms, and psychological horror landmarks for PHANTOM LINE.
   */
  private buildPhantomLineScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const rng = new SeededRandom(seed);

    // 1. Decaying ceramic glazed retaining walls, moisture puddles & cold cathode lights
    this.buildPhantomTunnelVaultAndDecayingWalls(group, roadbedWidth, curbWidth, chunkLength, detail);

    // 2. Derelict Victorian cast-iron arches spanning tracks with distorted station clocks
    this.buildPhantomDerelictArches(group, chunkLength, detail);

    // 3. Abandoned platform detritus, discarded luggage, and distress signs
    this.buildPhantomAbandonedPlatformsAndDetails(group, chunkLength, rng, detail);

    // 4. Deterministic signature horror landmarks across chunks (varied by seed)
    const landmarkVariant = Math.floor(Math.abs(seed) / 7) % 4;
    if (landmarkVariant === 0) {
      this.buildPhantomWatcherPlatform(group, chunkLength, -chunkLength * 0.45, rng);
    } else if (landmarkVariant === 1) {
      this.buildPhantomGhostTrainSiding(group, chunkLength, -chunkLength * 0.5, rng);
    } else if (landmarkVariant === 2) {
      this.buildPhantomConcourseArch(group, chunkLength, -chunkLength * 0.55);
    } else {
      this.buildPhantomFloodedCryptViaduct(group, chunkLength, -chunkLength * 0.4, rng);
    }
  }

  /**
   * Decaying Victorian subway retaining walls with cracked ceramic tiles, water seepage,
   * rusted iron pilasters, and cold fluorescent tube fixtures.
   * Safety invariant: Wall face is at |X| = 6.6m >= 6.5m, safely outside the 4.0m playable zone.
   */
  private buildPhantomTunnelVaultAndDecayingWalls(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const wallX = CONSTANTS.TUNNEL_WALL_X; // 6.6m
    const wallHeight = 3.6;
    const wallThickness = 0.8;

    // Continuous decaying ceramic glazed tile retaining walls
    const wallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, chunkLength);
    [-wallX, wallX].forEach((wx) => {
      const wall = new THREE.Mesh(wallGeo, mats.phantomDecayedTileMat);
      wall.position.set(wx, wallHeight * 0.5, -chunkLength * 0.5);
      wall.castShadow = true;
      wall.receiveShadow = true;
      group.add(wall);

      // Tarnished weathered brick coping along the top
      const copingGeo = new THREE.BoxGeometry(0.18, 0.25, chunkLength);
      const coping = new THREE.Mesh(copingGeo, mats.phantomWeatheredBrickMat);
      coping.position.set(wx + (wx < 0 ? 0.35 : -0.35), wallHeight - 0.12, -chunkLength * 0.5);
      group.add(coping);

      // Decaying cast-iron pilasters every 10m
      const pilasterSpacing = 10.0;
      const pilasterCount = Math.floor(chunkLength / pilasterSpacing);
      const pilasterGeo = new THREE.BoxGeometry(0.42, wallHeight * 1.12, 0.45);
      for (let p = 0; p < pilasterCount; p++) {
        const pz = -p * pilasterSpacing - 5.0;
        const pilaster = new THREE.Mesh(pilasterGeo, mats.phantomRustedIronMat);
        pilaster.position.set(wx + (wx < 0 ? -0.32 : 0.32), wallHeight * 0.55, pz);
        pilaster.castShadow = true;
        group.add(pilaster);
      }
    });

    // Water puddle specular reflectors along lower curb (|X| >= 6.5m)
    if (detail !== 'MINIMAL') {
      const puddleGeo = new THREE.BoxGeometry(0.9, 0.05, chunkLength);
      [-wallX - 0.5, wallX + 0.5].forEach((px) => {
        const puddle = new THREE.Mesh(puddleGeo, mats.phantomWaterMirrorMat);
        puddle.position.set(px, 0.04, -chunkLength * 0.5);
        group.add(puddle);
      });
    }

    // Wall-mounted cold cathode fluorescent tube fixtures every 24m
    const lampSpacing = 24.0;
    const lampCount = Math.floor(chunkLength / lampSpacing);
    const bracketGeo = new THREE.BoxGeometry(0.5, 0.08, 0.08);
    const tubeGeo = new THREE.BoxGeometry(0.12, 0.12, 1.8);
    for (let l = 0; l < lampCount; l++) {
      const lz = -l * lampSpacing - 12.0;
      [-wallX, wallX].forEach((wx) => {
        const inwardSign = wx < 0 ? 1 : -1;
        const bracket = new THREE.Mesh(bracketGeo, mats.phantomRustedIronMat);
        bracket.position.set(wx + inwardSign * 0.25, wallHeight - 0.4, lz);
        group.add(bracket);

        const tube = new THREE.Mesh(tubeGeo, mats.phantomColdFluorescentMat);
        tube.position.set(wx + inwardSign * 0.5, wallHeight - 0.45, lz);
        group.add(tube);
      });
    }
  }

  /**
   * Derelict Victorian cast-iron arches spanning the track at 16m intervals.
   * Features distorted station clocks frozen at 3:33, dangling chains, and cold-cyan telegraph lamps.
   * Safety invariant: Clearance strictly >= 10.1m across track.
   */
  private buildPhantomDerelictArches(
    group: THREE.Group,
    chunkLength: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const archSpacing = 16.0;
    const archCount = Math.floor(chunkLength / archSpacing);
    const poleHeight = 10.8;
    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 3.8; // ~10.4m

    for (let a = 0; a < archCount; a++) {
      const az = -a * archSpacing - 8.0;
      const archGroup = new THREE.Group();
      archGroup.position.set(0, 0, az);

      // Rusted Victorian cast-iron columns flanking tracks (|X| = 5.2m, outside ±4.0m)
      const colGeo = new THREE.BoxGeometry(0.52, poleHeight, 0.58);
      [-spanWidth * 0.5, spanWidth * 0.5].forEach((px) => {
        const col = new THREE.Mesh(colGeo, mats.phantomRustedIronMat);
        col.position.set(px, poleHeight * 0.5, 0);
        col.castShadow = true;
        archGroup.add(col);

        // Cold cyan lantern node on column shoulder
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.20, 6, 6), mats.phantomSpectralGlowCyanMat);
        beacon.position.set(px, poleHeight * 0.88, px < 0 ? 0.32 : -0.32);
        archGroup.add(beacon);
      });

      // Overhead heavy primary cast-iron girder beam (center Y = 10.8m, clearance >= 10.1m)
      const beamGeo = new THREE.BoxGeometry(spanWidth + 1.2, 0.72, 0.75);
      const beam = new THREE.Mesh(beamGeo, mats.phantomRustedIronMat);
      beam.position.set(0, poleHeight, 0);
      beam.castShadow = true;
      archGroup.add(beam);

      // Distorted antique station wall clock frozen at 3:33 on alternate arches
      if (a % 2 === 0) {
        const clockGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.22, 16);
        clockGeo.rotateX(Math.PI / 2);
        const clock = new THREE.Mesh(clockGeo, mats.phantomDistortedClockMat);
        clock.position.set(0, poleHeight + 0.8, 0.42);
        archGroup.add(clock);
      }

      // Overhead cold phosphor transit lamps pointing downward
      [-spanWidth * 0.28, spanWidth * 0.28].forEach((lx) => {
        const spot = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.3), mats.phantomColdFluorescentMat);
        spot.position.set(lx, poleHeight - 0.45, 0);
        archGroup.add(spot);
      });

      // Dangling oxidized chains & severed conduits (detail BALANCED/FULL)
      if (detail !== 'MINIMAL' && a % 3 === 1) {
        const chainGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.65, 4);
        const chain = new THREE.Mesh(chainGeo, mats.phantomOxidizedCopperMat);
        chain.position.set(1.5, poleHeight - 0.52, 0.2);
        chain.rotation.z = 0.22;
        archGroup.add(chain);
      }

      group.add(archGroup);
    }
  }

  /**
   * Abandoned passenger benches, vintage luggage, and decaying station signage.
   * Safety invariant: Placed strictly at |X| >= 4.8m to prevent collision intrusion.
   */
  private buildPhantomAbandonedPlatformsAndDetails(
    group: THREE.Group,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const clusterCount = detail === 'MINIMAL' ? 2 : (detail === 'BALANCED' ? 3 : 5);

    for (let i = 0; i < clusterCount; i++) {
      const side = rng.chance(0.5) ? -1 : 1;
      const detailX = side * rng.range(5.6, 6.4); // Outside playable corridor and clearance envelope (|X| >= 4.7m)
      const detailZ = -rng.range(6.0, chunkLength - 6.0);
      const detailGroup = new THREE.Group();
      detailGroup.position.set(detailX, 0, detailZ);

      // Decaying wooden passenger bench
      const benchW = rng.range(1.2, 1.8);
      const benchH = 0.65;
      const benchD = 0.55;
      const benchGeo = new THREE.BoxGeometry(benchW, benchH, benchD);
      const bench = new THREE.Mesh(benchGeo, mats.phantomDecayedWoodMat);
      bench.position.y = benchH * 0.5;
      bench.rotation.y = rng.range(-0.25, 0.25);
      bench.castShadow = true;
      detailGroup.add(bench);

      // Forgotten vintage leather / iron trunk luggage sitting on/beside the bench
      const trunkW = rng.range(0.55, 0.75);
      const trunkH = rng.range(0.35, 0.45);
      const trunkD = rng.range(0.40, 0.50);
      const trunkGeo = new THREE.BoxGeometry(trunkW, trunkH, trunkD);
      const trunk = new THREE.Mesh(trunkGeo, mats.phantomRustedIronMat);
      trunk.position.set(rng.range(-0.3, 0.3), benchH + trunkH * 0.5, 0);
      detailGroup.add(trunk);

      // Decaying station destination signpost along the perimeter
      if (i === 1 && detail !== 'MINIMAL') {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 0.12), mats.phantomRustedIronMat);
        post.position.set(side * 0.35, 1.2, 0);
        detailGroup.add(post);

        const signGeo = new THREE.PlaneGeometry(1.8, 0.55);
        const signMat = rng.chance(0.5) ? mats.phantomDistressSignMat2 : mats.phantomDistressSignMat3;
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(side * 0.35, 2.0, 0.08);
        sign.rotation.y = side < 0 ? 0.3 : Math.PI - 0.3;
        detailGroup.add(sign);
      }

      group.add(detailGroup);
    }
  }

  /**
   * Landmark 0: The Abandoned Grand Platform & The Watcher Silhouette.
   * Expansive derelict passenger platform flanking the tracks with an eerie pale humanoid specter
   * standing motionless at the platform terminus under a solitary cold-cathode lamp.
   */
  private buildPhantomWatcherPlatform(
    group: THREE.Group,
    chunkLength: number,
    platformZ: number,
    rng: SeededRandom
  ): void {
    const mats = this.getSharedMaterials();
    const platGroup = new THREE.Group();
    platGroup.name = 'phantom_watcher_platform';

    const side = rng.chance(0.5) ? -1 : 1;
    const platX = side * 11.0; // Outside playable tracks (|X| >= 8.5m)
    platGroup.position.set(platX, 0, platformZ);

    const platW = 6.5;
    const platH = 1.4;
    const platLen = 32.0;

    // Platform deck (decayed concrete slab with ceramic tile coping)
    const deckGeo = new THREE.BoxGeometry(platW, platH, platLen);
    const deck = new THREE.Mesh(deckGeo, mats.phantomWeatheredBrickMat);
    deck.position.y = platH * 0.5;
    deck.castShadow = true;
    deck.receiveShadow = true;
    platGroup.add(deck);

    // Platform ceramic tile surface runner
    const tileRunner = new THREE.Mesh(new THREE.BoxGeometry(platW * 0.9, 0.05, platLen * 0.95), mats.phantomDecayedTileMat);
    tileRunner.position.y = platH + 0.03;
    platGroup.add(tileRunner);

    // Decaying Victorian passenger shelter canopy
    const roofGeo = new THREE.BoxGeometry(platW * 0.85, 0.35, platLen * 0.6);
    const roof = new THREE.Mesh(roofGeo, mats.phantomRustedIronMat);
    roof.position.set(0, 4.2, 0);
    roof.castShadow = true;
    platGroup.add(roof);

    // Canopy support columns
    [-platLen * 0.25, platLen * 0.25].forEach((cz) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.0, 8), mats.phantomRustedIronMat);
      col.position.set(0, platH + 1.5, cz);
      platGroup.add(col);
    });

    // The Watcher Silhouette standing at the far end of the platform
    const watcherGroup = new THREE.Group();
    watcherGroup.position.set(0, platH, -platLen * 0.42);

    const specterPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.8), mats.phantomSpecterMat);
    specterPlane.position.y = 1.4;
    specterPlane.rotation.y = side > 0 ? -Math.PI * 0.25 : Math.PI * 0.25;
    watcherGroup.add(specterPlane);

    // Solitary cold-cathode lamp illuminating the specter
    const lampPost = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.2, 0.1), mats.phantomRustedIronMat);
    lampPost.position.set(side * 1.2, 1.6, 0.5);
    watcherGroup.add(lampPost);

    const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), mats.phantomColdFluorescentMat);
    lampBulb.position.set(side * 1.2, 3.1, 0.5);
    watcherGroup.add(lampBulb);

    platGroup.add(watcherGroup);
    group.add(platGroup);
  }

  /**
   * Landmark 1: Parallel Disused Ghost Train Siding.
   * Derelict parallel rail siding separated by a weathered iron colonnade, housing a stationary
   * spectral ghost train with cold-cyan interior luminescence and shadowy passenger silhouettes.
   */
  private buildPhantomGhostTrainSiding(
    group: THREE.Group,
    chunkLength: number,
    sidingZ: number,
    rng: SeededRandom
  ): void {
    const mats = this.getSharedMaterials();
    const sidingGroup = new THREE.Group();
    sidingGroup.name = 'phantom_ghost_train_siding';

    const side = rng.chance(0.5) ? -1 : 1;
    const sidingX = side * 13.5; // Well outside playable corridor
    sidingGroup.position.set(sidingX, 0, sidingZ);

    // Colonnade arcade separating playable tracks from ghost siding
    const arcadeGeo = new THREE.BoxGeometry(0.65, 8.5, 34.0);
    const arcade = new THREE.Mesh(arcadeGeo, mats.phantomRustedIronMat);
    arcade.position.set(-side * 4.5, 4.25, 0);
    arcade.castShadow = true;
    sidingGroup.add(arcade);

    // Rusted track bed in the siding
    const trackSlab = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.35, 36.0), mats.phantomWeatheredBrickMat);
    trackSlab.position.y = 0.18;
    sidingGroup.add(trackSlab);

    // Ghost Train Locomotive in siding
    const gTrain = new THREE.Group();
    gTrain.position.set(0, 0.35, 0);

    const cabGeo = new THREE.BoxGeometry(2.8, 3.2, 18.0);
    const cab = new THREE.Mesh(cabGeo, mats.phantomRustedIronMat);
    cab.position.y = 1.6;
    gTrain.add(cab);

    // Eerie pale-cyan glowing window apertures
    const winGeo = new THREE.BoxGeometry(2.85, 0.85, 14.0);
    const win = new THREE.Mesh(winGeo, mats.phantomSpectralGlowCyanMat);
    win.position.y = 2.0;
    gTrain.add(win);

    // Ghostly passenger silhouette inside the window
    const silhouette = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8), mats.phantomSpecterMat);
    silhouette.position.set(-side * 1.45, 2.0, 2.0);
    silhouette.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2;
    gTrain.add(silhouette);

    sidingGroup.add(gTrain);
    group.add(sidingGroup);
  }

  /**
   * Landmark 2: Derelict Station Clocktower & Concourse Arch.
   * Monumental Victorian masonry vaulted archway straddling the tracks with a broken monumental Gothic
   * station clock and cold phosphor destination board.
   * Safety invariant: Vertical clearance is strictly >= 10.5m over the playable tracks.
   */
  private buildPhantomConcourseArch(group: THREE.Group, chunkLength: number, archZ: number): void {
    const mats = this.getSharedMaterials();
    const concourseGroup = new THREE.Group();
    concourseGroup.name = 'phantom_concourse_arch';
    concourseGroup.position.set(0, 0, archZ);

    const archH = 13.8;
    const spanW = 12.0;

    // Massive weathered brick concourse pylons (|X| = 6.8m, outside ±4.0m)
    const pylonGeo = new THREE.BoxGeometry(3.6, archH, 4.8);
    [-spanW * 0.5 - 0.8, spanW * 0.5 + 0.8].forEach((px) => {
      const pylon = new THREE.Mesh(pylonGeo, mats.phantomWeatheredBrickMat);
      pylon.position.set(px, archH * 0.5, 0);
      pylon.castShadow = true;
      pylon.receiveShadow = true;
      concourseGroup.add(pylon);

      // Tarnished copper drain downspout
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, archH, 8), mats.phantomOxidizedCopperMat);
      pipe.position.set(px + (px < 0 ? 1.7 : -1.7), archH * 0.5, 2.2);
      concourseGroup.add(pipe);

      // Deep blood-crimson telegraph lamp on shoulder
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.38, 8, 8), mats.phantomBloodCrimsonGlowMat);
      lamp.position.set(px + (px < 0 ? 1.8 : -1.8), archH * 0.88, 1.8);
      concourseGroup.add(lamp);
    });

    // Overhead heavy Gothic brick vaulted lintel (bottom edge Y = 10.8m >= 10.1m)
    const lintelGeo = new THREE.BoxGeometry(spanW + 4.5, 3.4, 5.0);
    const lintel = new THREE.Mesh(lintelGeo, mats.phantomWeatheredBrickMat);
    lintel.position.set(0, archH - 0.6, 0);
    lintel.castShadow = true;
    concourseGroup.add(lintel);

    // Monumental cracked Gothic station clock suspended from the arch center
    const clockGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.35, 24);
    clockGeo.rotateX(Math.PI / 2);
    const clock = new THREE.Mesh(clockGeo, mats.phantomDistortedClockMat);
    clock.position.set(0, archH - 0.6, 2.65);
    concourseGroup.add(clock);

    // Station distress banner below the clock (clearance >= 10.2m)
    const signGeo = new THREE.PlaneGeometry(8.5, 1.8);
    const sign = new THREE.Mesh(signGeo, mats.phantomDistressSignMat2);
    sign.position.set(0, archH - 2.0, 2.55);
    concourseGroup.add(sign);

    group.add(concourseGroup);
  }

  /**
   * Landmark 3: Flooded Crypt Chamber & Sunken Crypt Viaduct.
   * Flanking subterranean water basin with murky reflective water plane, half-submerged stone obelisks,
   * rusted drainage sluice gates, and eerie pale green mist vents.
   */
  private buildPhantomFloodedCryptViaduct(
    group: THREE.Group,
    chunkLength: number,
    cryptZ: number,
    rng: SeededRandom
  ): void {
    const mats = this.getSharedMaterials();
    const cryptGroup = new THREE.Group();
    cryptGroup.name = 'phantom_flooded_crypt';

    const side = rng.chance(0.5) ? -1 : 1;
    const cryptX = side * 15.0; // Outside playable tracks
    cryptGroup.position.set(cryptX, 0, cryptZ);

    // Murky flooded subterranean water basin
    const waterGeo = new THREE.BoxGeometry(10.5, 0.25, 28.0);
    const water = new THREE.Mesh(waterGeo, mats.phantomWaterMirrorMat);
    water.position.y = 0.12;
    cryptGroup.add(water);

    // Submerged stone obelisk spires jutting from the dark water
    for (let o = 0; o < 3; o++) {
      const obH = rng.range(8.0, 16.0);
      const obGeo = new THREE.CylinderGeometry(0.8, 1.6, obH, 4);
      const ob = new THREE.Mesh(obGeo, mats.phantomWeatheredBrickMat);
      ob.position.set(rng.range(-3.5, 3.5), obH * 0.5 - 1.5, -10.0 + o * 10.0);
      ob.rotation.y = rng.range(-0.4, 0.4);
      ob.rotation.z = side * 0.12;
      ob.castShadow = true;
      cryptGroup.add(ob);

      // Pale mint spectral glow mote atop obelisk tip
      const mote = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), mats.phantomSpectralGlowMintMat);
      mote.position.set(ob.position.x, obH - 1.2, ob.position.z);
      cryptGroup.add(mote);
    }

    // Rusted iron sluice gate flanking the track wall
    const gateGeo = new THREE.BoxGeometry(0.5, 5.5, 6.0);
    const gate = new THREE.Mesh(gateGeo, mats.phantomRustedIronMat);
    gate.position.set(-side * 5.0, 2.75, 0);
    gate.castShadow = true;
    cryptGroup.add(gate);

    group.add(cryptGroup);
  }

  // =========================================================================
  // HAUNTED CARNIVAL DISTRICT: Extravagant Gothic Theme Park Railway
  // =========================================================================

  private buildHauntedCarnivalScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const rng = new SeededRandom(seed);
    const carnivalGroup = new THREE.Group();
    carnivalGroup.name = 'haunted_carnival_scenery';

    // 1. Gothic cemetery retaining stone walls & wrought-iron picket fence
    this.buildHauntedCemeteryFencesAndWalls(carnivalGroup, roadbedWidth, chunkLength, rng, detail);

    // 2. High overhead pointed gothic cast-iron spans with hanging pumpkin lanterns (clearance >= 10.2m)
    this.buildHauntedOverheadGothicArches(carnivalGroup, roadbedWidth, chunkLength, rng, detail);

    // 3. Trackside carnival set dressing & directional signposts
    if (detail !== 'MINIMAL') {
      this.buildHauntedCarnivalProps(carnivalGroup, roadbedWidth, chunkLength, rng, detail);
    }

    // 4. Deterministic Landmark Encounter (Seeded variation across runs)
    const landmarkChoice = Math.abs(seed) % 4;
    const landmarkZ = -chunkLength * 0.5;

    if (landmarkChoice === 0) {
      this.buildCarnivalHauntedMansion(carnivalGroup, chunkLength, landmarkZ, rng);
    } else if (landmarkChoice === 1) {
      this.buildCarnivalSpookyTent(carnivalGroup, chunkLength, landmarkZ, rng);
    } else if (landmarkChoice === 2) {
      this.buildCarnivalPumpkinShrine(carnivalGroup, chunkLength, landmarkZ, rng);
    } else {
      this.buildCarnivalGraveyardCrypt(carnivalGroup, chunkLength, landmarkZ, rng);
    }

    group.add(carnivalGroup);
  }

  /**
   * Gothic Cemetery Ashlar Retaining Walls & Wrought-Iron Spiked Picket Fence
   */
  private buildHauntedCemeteryFencesAndWalls(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const wallX = roadbedWidth * 0.5 + 1.2; // 6.6m from center (strictly outside 4.0m running corridor)
    const wallH = 2.8;
    const wallThick = 0.65;

    const wallGeo = new THREE.BoxGeometry(wallThick, wallH, chunkLength);
    const copingGeo = new THREE.BoxGeometry(wallThick + 0.16, 0.35, chunkLength);

    [-wallX, wallX].forEach((sideX) => {
      // Lower gothic ashlar stone wall
      const wall = new THREE.Mesh(wallGeo, mats.hauntedGothicStoneMat);
      wall.position.set(sideX, wallH * 0.5, -chunkLength * 0.5);
      wall.receiveShadow = true;
      group.add(wall);

      // Coping cap stone
      const coping = new THREE.Mesh(copingGeo, mats.hauntedGothicStoneMat);
      coping.position.set(sideX, wallH + 0.175, -chunkLength * 0.5);
      coping.receiveShadow = true;
      group.add(coping);

      // Wrought-iron spiked cemetery picket fence atop wall
      const fenceH = 2.6;
      const fenceRailGeo = new THREE.BoxGeometry(0.12, 0.12, chunkLength);
      // Horizontal upper and lower rails
      [wallH + 0.6, wallH + fenceH - 0.3].forEach((ry) => {
        const rail = new THREE.Mesh(fenceRailGeo, mats.hauntedWroughtIronMat);
        rail.position.set(sideX, ry, -chunkLength * 0.5);
        group.add(rail);
      });

      // Spiked iron pickets along fence
      const picketStep = detail === 'FULL' ? 2.5 : 5.0;
      const picketGeo = new THREE.BoxGeometry(0.08, fenceH, 0.08);
      const spearGeo = new THREE.ConeGeometry(0.12, 0.35, 4);
      for (let z = 0; z < chunkLength; z += picketStep) {
        const pz = -z;
        const picket = new THREE.Mesh(picketGeo, mats.hauntedWroughtIronMat);
        picket.position.set(sideX, wallH + fenceH * 0.5, pz);
        group.add(picket);

        const spear = new THREE.Mesh(spearGeo, mats.hauntedWroughtIronMat);
        spear.position.set(sideX, wallH + fenceH + 0.18, pz);
        group.add(spear);
      }

      // Stone pilasters with glowing jack-o'-lantern finials
      const pilasterStep = 16.0;
      const pilasterGeo = new THREE.BoxGeometry(wallThick + 0.35, wallH + 0.6, wallThick + 0.35);
      const pumpkinGeo = new THREE.SphereGeometry(0.65, 8, 8);

      for (let z = 0; z <= chunkLength; z += pilasterStep) {
        const pz = -z;
        const pil = new THREE.Mesh(pilasterGeo, mats.hauntedGothicStoneMat);
        pil.position.set(sideX, (wallH + 0.6) * 0.5, pz);
        pil.castShadow = true;
        pil.receiveShadow = true;
        group.add(pil);

        // Glowing carved jack-o'-lantern resting atop pilaster
        const pumpkin = new THREE.Mesh(pumpkinGeo, mats.hauntedJackOLanternGlowMat);
        pumpkin.position.set(sideX, wallH + 0.6 + 0.55, pz);
        pumpkin.rotation.y = sideX < 0 ? Math.PI / 4 : -Math.PI / 4;
        group.add(pumpkin);

        // Twisted dead bare tree beyond the wall
        if (detail === 'FULL' && (z === 16 || z === 48)) {
          const treeGroup = new THREE.Group();
          const treeX = sideX + (sideX < 0 ? -2.2 : 2.2);
          treeGroup.position.set(treeX, 0, pz);

          // Gnarled crooked trunk
          const trunkH = rng.range(9.0, 13.0);
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.85, trunkH, 6), mats.hauntedTwistedWoodMat);
          trunk.position.y = trunkH * 0.5;
          trunk.rotation.z = sideX < 0 ? -0.15 : 0.15;
          treeGroup.add(trunk);

          // Sprawling crooked bare branches
          [-1, 1].forEach((bDir) => {
            const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 6.0, 5), mats.hauntedTwistedWoodMat);
            branch.position.set(bDir * 1.8, trunkH * 0.8, 0);
            branch.rotation.z = bDir * 0.55;
            treeGroup.add(branch);
          });

          group.add(treeGroup);
        }
      }
    });
  }

  /**
   * Overhead Pointed Gothic Cast-Iron Arches with Hanging Pumpkin Lanterns (Clearance >= 10.2m)
   */
  private buildHauntedOverheadGothicArches(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const archesGroup = new THREE.Group();
    archesGroup.name = 'haunted_overhead_arches';

    const spanW = roadbedWidth + 2.4; // 14.0m span
    const archH = 10.5; // Strictly >= 10.2m clearance above tracks!
    const step = detail === 'MINIMAL' ? 40.0 : 20.0;

    const postGeo = new THREE.BoxGeometry(0.65, archH, 0.65);
    const beamGeo = new THREE.BoxGeometry(spanW + 1.2, 0.55, 0.7);

    for (let z = 10.0; z < chunkLength; z += step) {
      const pz = -z;
      const arch = new THREE.Group();
      arch.position.set(0, 0, pz);

      // Flanking upright gothic cast-iron posts
      [-spanW * 0.5, spanW * 0.5].forEach((px) => {
        const post = new THREE.Mesh(postGeo, mats.hauntedWroughtIronMat);
        post.position.set(px, archH * 0.5, 0);
        post.castShadow = true;
        arch.add(post);

        // Bat-wing wrought-iron corner bracket
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.25), mats.hauntedWroughtIronMat);
        bracket.position.set(px + (px < 0 ? 0.8 : -0.8), archH - 0.8, 0);
        arch.add(bracket);
      });

      // Transverse arch lintel beam (Y = 10.5m)
      const beam = new THREE.Mesh(beamGeo, mats.hauntedWroughtIronMat);
      beam.position.set(0, archH, 0);
      beam.castShadow = true;
      arch.add(beam);

      // Pointed gothic center apex pediment
      const apex = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.2, 4), mats.hauntedWroughtIronMat);
      apex.position.set(0, archH + 1.2, 0);
      apex.rotation.y = Math.PI / 4;
      arch.add(apex);

      // Hanging Jack-o'-lantern lanterns suspended over lanes (Y = 8.8m, well above 4.35m roof)
      [-CONSTANTS.LANE_WIDTH, CONSTANTS.LANE_WIDTH].forEach((lx) => {
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 4), mats.hauntedWroughtIronMat);
        chain.position.set(lx, archH - 0.6, 0);
        arch.add(chain);

        const pumpkin = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), mats.hauntedJackOLanternGlowMat);
        pumpkin.position.set(lx, archH - 1.4, 0);
        arch.add(pumpkin);
      });

      archesGroup.add(arch);
    }

    group.add(archesGroup);
  }

  /**
   * Trackside Carnival Amenities: Ticket Booths, Directional Signs & Pumpkin Clusters
   */
  private buildHauntedCarnivalProps(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const propsGroup = new THREE.Group();
    propsGroup.name = 'haunted_carnival_props';

    const safeSideX = roadbedWidth * 0.5 + 0.4; // 5.1m from track center (outside 4.0m)

    // Directional Spooky Carnival Wooden Signs
    [-safeSideX, safeSideX].forEach((px, idx) => {
      const pz = -chunkLength * 0.25 - idx * 25.0;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.8, 0.14), mats.hauntedTwistedWoodMat);
      post.position.set(px, 1.4, pz);
      propsGroup.add(post);

      const signGeo = new THREE.PlaneGeometry(2.4, 0.7);
      const signMat = idx === 0 ? mats.hauntedSpookySignMat2 : mats.hauntedSpookySignMat3;
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(px + (px < 0 ? 0.08 : -0.08), 2.1, pz);
      sign.rotation.y = px < 0 ? Math.PI / 2 : -Math.PI / 2;
      propsGroup.add(sign);

      // Pile of 3 glowing pumpkins near base of signpost
      [[-0.4, -0.4], [0.4, -0.3], [0, 0.4]].forEach(([ox, oz], pIdx) => {
        const r = 0.28 + pIdx * 0.08;
        const pMesh = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 6), mats.hauntedJackOLanternGlowMat);
        pMesh.position.set(px + ox, r, pz + oz);
        propsGroup.add(pMesh);
      });
    });

    group.add(propsGroup);
  }

  /**
   * Landmark 1: Haunted Victorian Manor & Gothic Tower Facade (carnival_haunted_mansion)
   */
  private buildCarnivalHauntedMansion(
    group: THREE.Group,
    chunkLength: number,
    mansionZ: number,
    rng: SeededRandom
  ): void {
    const mats = this.getSharedMaterials();
    const mansionGroup = new THREE.Group();
    mansionGroup.name = 'carnival_haunted_mansion';

    const side = rng.chance(0.5) ? -1 : 1;
    const mansionX = side * 12.5; // Well outside playable tracks
    mansionGroup.position.set(mansionX, 0, mansionZ);

    // Stone base foundation
    const baseW = 16.0;
    const baseH = 14.0;
    const baseD = 18.0;
    const base = new THREE.Mesh(new THREE.BoxGeometry(baseW, baseH, baseD), mats.hauntedGothicStoneMat);
    base.position.y = baseH * 0.5;
    base.castShadow = true;
    base.receiveShadow = true;
    mansionGroup.add(base);

    // Steep pitched Mansard roof
    const roofH = 8.0;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(baseW * 0.75, roofH, 4), mats.hauntedWroughtIronMat);
    roof.position.y = baseH + roofH * 0.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    mansionGroup.add(roof);

    // Towering cylindrical gothic turret with pointed spire
    const turrH = 24.0;
    const turret = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, turrH, 8), mats.hauntedGothicStoneMat);
    turret.position.set(-side * 5.5, turrH * 0.5, 6.0);
    turret.castShadow = true;
    mansionGroup.add(turret);

    const spire = new THREE.Mesh(new THREE.ConeGeometry(3.2, 12.0, 8), mats.hauntedWroughtIronMat);
    spire.position.set(-side * 5.5, turrH + 6.0, 6.0);
    mansionGroup.add(spire);

    // Glowing arched gothic stained glass windows
    [-3.5, 3.5].forEach((wx) => {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 5.0), mats.hauntedGothicWindowMat);
      win.position.set(wx, 7.5, -side * 9.05);
      win.rotation.y = side < 0 ? 0 : Math.PI;
      mansionGroup.add(win);
    });

    // Wrought-iron balcony railing
    const balc = new THREE.Mesh(new THREE.BoxGeometry(9.0, 1.2, 1.4), mats.hauntedWroughtIronMat);
    balc.position.set(0, 5.0, -side * 9.5);
    mansionGroup.add(balc);

    group.add(mansionGroup);
  }

  /**
   * Landmark 2: Spooky Carnival Big-Top Striped Tent & Circus Ticket Booth (carnival_spooky_tent)
   */
  private buildCarnivalSpookyTent(
    group: THREE.Group,
    chunkLength: number,
    tentZ: number,
    rng: SeededRandom
  ): void {
    const mats = this.getSharedMaterials();
    const tentGroup = new THREE.Group();
    tentGroup.name = 'carnival_spooky_tent';

    const side = rng.chance(0.5) ? -1 : 1;
    const tentX = side * 18.0; // Outside playable tracks (canopy edge at |X| >= 7.65m)
    tentGroup.position.set(tentX, 0, tentZ);

    // Cylindrical big top canvas base
    const tentR = 9.0;
    const tentH = 6.5;
    const canvasBase = new THREE.Mesh(new THREE.CylinderGeometry(tentR, tentR * 1.05, tentH, 16), mats.hauntedCarnivalStripeMat);
    canvasBase.position.y = tentH * 0.5;
    canvasBase.castShadow = true;
    tentGroup.add(canvasBase);

    // Conical big-top striped canopy roof
    const roofH = 10.0;
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(tentR * 1.15, roofH, 16), mats.hauntedCarnivalStripeMat);
    canopy.position.y = tentH + roofH * 0.5;
    canopy.castShadow = true;
    tentGroup.add(canopy);

    // Spire center pole & flapping pennant flag
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 4.0, 6), mats.hauntedWroughtIronMat);
    pole.position.y = tentH + roofH + 2.0;
    tentGroup.add(pole);

    const flag = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.05), mats.hauntedVioletGlowMat);
    flag.position.set(0.9, tentH + roofH + 3.2, 0);
    tentGroup.add(flag);

    // Vintage carnival circus ticket booth at tent front
    const boothW = 3.6;
    const boothH = 3.2;
    const boothD = 2.8;
    const booth = new THREE.Mesh(new THREE.BoxGeometry(boothW, boothH, boothD), mats.hauntedTwistedWoodMat);
    booth.position.set(-side * 7.5, boothH * 0.5, 0);
    booth.castShadow = true;
    tentGroup.add(booth);

    // Ticket booth striped awning
    const awning = new THREE.Mesh(new THREE.BoxGeometry(boothW + 0.6, 0.35, boothD + 0.8), mats.hauntedCarnivalStripeMat);
    awning.position.set(-side * 7.5, boothH + 0.2, 0);
    tentGroup.add(awning);

    // Glowing ticket banner
    const ticketSign = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.8), mats.hauntedSpookySignMat2);
    ticketSign.position.set(-side * 7.5, boothH - 0.4, -side * 1.45);
    ticketSign.rotation.y = side < 0 ? 0 : Math.PI;
    tentGroup.add(ticketSign);

    group.add(tentGroup);
  }

  /**
   * Landmark 3: Monumental Glowing Jack-o'-Lantern Shrine & Pumpkin Patch (carnival_pumpkin_shrine)
   */
  private buildCarnivalPumpkinShrine(
    group: THREE.Group,
    chunkLength: number,
    shrineZ: number,
    rng: SeededRandom
  ): void {
    const mats = this.getSharedMaterials();
    const shrineGroup = new THREE.Group();
    shrineGroup.name = 'carnival_pumpkin_shrine';

    const side = rng.chance(0.5) ? -1 : 1;
    const shrineX = side * 12.5;
    shrineGroup.position.set(shrineX, 0, shrineZ);

    // Stepped stone sacrificial pedestal
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.6, 9.0), mats.hauntedGothicStoneMat);
    step1.position.y = 0.3;
    step1.receiveShadow = true;
    shrineGroup.add(step1);

    const step2 = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.6, 7.0), mats.hauntedGothicStoneMat);
    step2.position.y = 0.9;
    step2.receiveShadow = true;
    shrineGroup.add(step2);

    // Monumental 5-meter Giant Glowing Jack-o'-Lantern
    const giantPumpkin = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 16), mats.hauntedJackOLanternGlowMat);
    giantPumpkin.position.y = 3.6;
    giantPumpkin.scale.set(1.15, 0.95, 1.05);
    giantPumpkin.rotation.y = side < 0 ? Math.PI / 4 : -Math.PI / 4;
    giantPumpkin.castShadow = true;
    shrineGroup.add(giantPumpkin);

    // Giant carved gnarled stem atop pumpkin
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.4, 6), mats.hauntedTwistedWoodMat);
    stem.position.set(0, 6.2, 0);
    stem.rotation.z = side * 0.25;
    shrineGroup.add(stem);

    // Surrounding miniature pumpkin patch (clusters of small carved pumpkins)
    const patchOffsets = [
      [-3.2, -2.5], [-2.8, 2.8], [3.0, -2.6], [3.2, 2.4],
      [-4.0, 0], [4.0, 0.5], [0, -3.8], [0, 3.8]
    ];
    patchOffsets.forEach(([ox, oz], pIdx) => {
      const pr = 0.35 + (pIdx % 3) * 0.15;
      const p = new THREE.Mesh(new THREE.SphereGeometry(pr, 8, 8), mats.hauntedJackOLanternGlowMat);
      p.position.set(ox, pr, oz);
      p.rotation.y = (pIdx * 0.8);
      shrineGroup.add(p);
    });

    group.add(shrineGroup);
  }

  /**
   * Landmark 4: Ancient Gothic Cemetery Mausoleum Crypt (carnival_graveyard_crypt)
   */
  private buildCarnivalGraveyardCrypt(
    group: THREE.Group,
    chunkLength: number,
    cryptZ: number,
    rng: SeededRandom
  ): void {
    const mats = this.getSharedMaterials();
    const cryptGroup = new THREE.Group();
    cryptGroup.name = 'carnival_graveyard_crypt';

    const side = rng.chance(0.5) ? -1 : 1;
    const cryptX = side * 14.5;
    cryptGroup.position.set(cryptX, 0, cryptZ);

    // Ancient stone mausoleum structure
    const cryptW = 9.5;
    const cryptH = 7.5;
    const cryptD = 12.0;
    const cryptMesh = new THREE.Mesh(new THREE.BoxGeometry(cryptW, cryptH, cryptD), mats.hauntedGothicStoneMat);
    cryptMesh.position.y = cryptH * 0.5;
    cryptMesh.castShadow = true;
    cryptMesh.receiveShadow = true;
    cryptGroup.add(cryptMesh);

    // Triangular gothic pediment roof
    const pedimentGeo = new THREE.BoxGeometry(cryptW + 0.8, 1.8, cryptD + 0.4);
    const pediment = new THREE.Mesh(pedimentGeo, mats.hauntedGothicStoneMat);
    pediment.position.y = cryptH + 0.9;
    pediment.castShadow = true;
    cryptGroup.add(pediment);

    // Wrought-iron spiked portcullis gate at crypt entrance
    const portcullis = new THREE.Mesh(new THREE.BoxGeometry(3.6, 5.0, 0.4), mats.hauntedWroughtIronMat);
    portcullis.position.set(-side * 4.8, 2.5, 0);
    cryptGroup.add(portcullis);

    // Gothic gargoyle stone sentinels flanking crypt entrance
    [-2.2, 2.2].forEach((gy) => {
      const gargoyle = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.9), mats.hauntedGothicStoneMat);
      gargoyle.position.set(-side * 4.8, 5.5, gy);
      cryptGroup.add(gargoyle);
    });

    // Crooked weathered tombstones clustered in the adjacent graveyard patch
    for (let t = 0; t < 5; t++) {
      const tx = rng.range(-3.5, 3.5);
      const tz = -4.0 + t * 2.0;
      const stoneH = rng.range(1.4, 2.2);
      const tombstone = new THREE.Mesh(new THREE.BoxGeometry(0.8, stoneH, 0.25), mats.hauntedGothicStoneMat);
      tombstone.position.set(tx, stoneH * 0.5, tz);
      tombstone.rotation.y = rng.range(-0.3, 0.3);
      tombstone.rotation.z = rng.range(-0.15, 0.15); // Crooked tilt
      tombstone.castShadow = true;
      cryptGroup.add(tombstone);
    }

    group.add(cryptGroup);
  }

  // =========================================================================
  // VIP EXPRESS: THE GREAT INAUGURATION (Modi Signature World)
  // =========================================================================

  private buildVipExpressScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZ: number = 0
  ): void {
    const rng = new SeededRandom(seed);
    const vipGroup = new THREE.Group();
    vipGroup.name = 'vip_express_scenery';

    // Delegate to the 5 distinct political comedy districts!
    VipSatireWorldBuilder.getInstance().buildDistrictScenery(vipGroup, roadbedWidth, chunkLength, seed, detail, worldZ);

    // Deterministic Landmark Encounter (Seeded variation across runs)
    const landmarkChoice = Math.abs(seed) % 4;
    const landmarkZ = -chunkLength * 0.5;

    if (landmarkChoice === 0) {
      VipSatireWorldBuilder.getInstance().buildCeremonialPlaza(vipGroup, chunkLength, landmarkZ, rng);
    } else if (landmarkChoice === 1) {
      VipSatireWorldBuilder.getInstance().buildPressEnclosure(vipGroup, chunkLength, landmarkZ, rng);
    } else if (landmarkChoice === 2) {
      VipSatireWorldBuilder.getInstance().buildSecretariatColonnade(vipGroup, chunkLength, landmarkZ, rng);
    } else {
      VipSatireWorldBuilder.getInstance().buildConvoyHelipad(vipGroup, chunkLength, landmarkZ, rng);
    }

    group.add(vipGroup);
  }

  // =========================================================================
  // RAHULVERSE: THE NEVER-ENDING YATRA (Rahul Gandhi Signature World)
  // =========================================================================

  private buildRahulverseScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZ: number = 0
  ): void {
    const rahulGroup = new THREE.Group();
    rahulGroup.name = 'rahulverse_scenery';

    // Delegate to the 5 distinct political comedy districts!
    RahulSatireWorldBuilder.getInstance().buildDistrictScenery(rahulGroup, roadbedWidth, chunkLength, seed, detail, worldZ);

    group.add(rahulGroup);
  }

  // =========================================================================
  // MIDNIGHT VELVET: AFTER DARK (Premium Luxury Nightlife World)
  // =========================================================================

  private buildMidnightVelvetScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZ?: number
  ): void {
    const velvetGroup = new THREE.Group();
    velvetGroup.name = 'midnight_velvet_scenery';

    // Delegate to the 4 distinct luxury Art Deco nightlife districts
    MidnightVelvetWorldBuilder.getInstance().buildDistrictScenery(velvetGroup, roadbedWidth, chunkLength, seed, detail, worldZ);

    group.add(velvetGroup);
  }

  // =========================================================================
  // CHRONO KINGDOM: THE CLOCKWORK EMPIRE
  // =========================================================================

  private buildChronoKingdomScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const chronoGroup = new THREE.Group();
    chronoGroup.name = 'chrono_kingdom_scenery';
    ChronoKingdomWorldBuilder.getInstance().buildDistrictScenery(chronoGroup, roadbedWidth, chunkLength, seed, detail);
    group.add(chronoGroup);
  }

  // =========================================================================
  // INFERNO EXPRESS: RAILS THROUGH HELLFIRE
  // =========================================================================

  private buildInfernoExpressScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const infernoGroup = new THREE.Group();
    infernoGroup.name = 'inferno_express_scenery';
    InfernoExpressWorldBuilder.getInstance().buildDistrictScenery(infernoGroup, roadbedWidth, chunkLength, seed, detail);
    group.add(infernoGroup);
  }

  // =========================================================================
  // JURASSIC RUSH: THE LOST WORLD RAILWAY
  // =========================================================================

  private buildJurassicRushScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZ?: number
  ): void {
    const jurassicGroup = new THREE.Group();
    jurassicGroup.name = 'jurassic_rush_scenery';
    JurassicRushWorldBuilder.getInstance().buildDistrictScenery(jurassicGroup, roadbedWidth, chunkLength, seed, detail, worldZ);
    group.add(jurassicGroup);
  }

  // =========================================================================
  // VIVA HEAT: THE FORBIDDEN FESTIVAL
  // =========================================================================

  private buildVivaHeatScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const vivaGroup = new THREE.Group();
    vivaGroup.name = 'viva_heat_scenery';
    VivaHeatWorldBuilder.getInstance().buildDistrictScenery(vivaGroup, roadbedWidth, chunkLength, seed, detail);
    group.add(vivaGroup);
  }

  /**
   * Continuous Red-Carpeted Civic Concourses, Ivory Balustrades & Saffron/Navy Banners
   */
  private buildVipConcoursesAndBanners(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const wallX = roadbedWidth * 0.5 + 1.4; // ~6.8m from center (strictly outside 4.2m running corridor)
    const concourseW = 8.0;
    const concourseH = 1.2;

    const concourseGeo = new THREE.BoxGeometry(concourseW, concourseH, chunkLength);
    const balustradeGeo = new THREE.BoxGeometry(0.35, 1.1, chunkLength);
    const carpetGeo = new THREE.BoxGeometry(2.4, 0.05, chunkLength);
    const bannerGeo = new THREE.BoxGeometry(0.2, 4.8, 1.4);

    [-1, 1].forEach((side) => {
      const cx = side * (wallX + concourseW * 0.5);

      // Elevated sandstone ceremonial concourse platform
      const concourse = new THREE.Mesh(concourseGeo, mats.vipSandstoneMat);
      concourse.position.set(cx, concourseH * 0.5, -chunkLength * 0.5);
      concourse.receiveShadow = true;
      group.add(concourse);

      // Ivory balustrade railing along trackside edge
      const balustrade = new THREE.Mesh(balustradeGeo, mats.vipIvoryFacadeMat);
      balustrade.position.set(side * wallX, concourseH + 0.55, -chunkLength * 0.5);
      balustrade.castShadow = true;
      group.add(balustrade);

      // Fluted balustrade posts at intervals
      const postStep = detail === 'MINIMAL' ? 24 : 12;
      for (let z = 6; z < chunkLength; z += postStep) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.35, 0.5), mats.vipSandstoneMat);
        post.position.set(side * wallX, concourseH + 0.675, -z);
        group.add(post);

        // Golden finial ball atop each post
        if (detail !== 'MINIMAL') {
          const finial = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), mats.vipGoldOrnamentMat);
          finial.position.set(side * wallX, concourseH + 1.45, -z);
          group.add(finial);
        }
      }

      // Continuous royal red carpet path along concourse
      const carpet = new THREE.Mesh(carpetGeo, mats.vipRedCarpetMat);
      carpet.position.set(side * (wallX + 2.2), concourseH + 0.03, -chunkLength * 0.5);
      carpet.receiveShadow = true;
      group.add(carpet);

      // Saffron & Navy ceremonial vertical banners flanking tracks
      if (detail !== 'MINIMAL') {
        for (let z = 14; z < chunkLength; z += 24) {
          const bannerGroup = new THREE.Group();
          bannerGroup.position.set(side * (wallX + 0.6), concourseH + 1.2, -z);

          // Polished brass banner pole
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6.2, 8), mats.vipGoldOrnamentMat);
          pole.position.y = 3.1;
          bannerGroup.add(pole);

          // Saffron or navy banner fabric
          const isSaffron = (z / 24) % 2 === 0;
          const banner = new THREE.Mesh(bannerGeo, isSaffron ? mats.vipSaffronBannerMat : mats.vipNavyTrimMat);
          banner.position.set(side * 0.7, 3.6, 0);
          bannerGroup.add(banner);

          // Golden finial spear atop pole
          const spear = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.6, 8), mats.vipGoldOrnamentMat);
          spear.position.y = 6.4;
          bannerGroup.add(spear);

          group.add(bannerGroup);
        }
      }
    });
  }

  /**
   * Overhead Ceremonial Gateways (Y >= 9.5m clearance strictly above 8.5m running envelope)
   */
  private buildVipOverheadArches(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const spanW = roadbedWidth + 3.2; // ~14m span
    const archY = 10.2; // Beam bottom at 10.2m (safe clearance > 8.5m)
    const archZ = -chunkLength * 0.5;

    const archGroup = new THREE.Group();
    archGroup.name = 'vip_overhead_arch';

    // Supporting ivory fluted pillars flanking tracks at |X| = spanW * 0.5 + 0.8 (~7.8m)
    [-spanW * 0.5 - 0.8, spanW * 0.5 + 0.8].forEach((px) => {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(2.4, 12.0, 2.4), mats.vipSandstoneMat);
      pylon.position.set(px, 6.0, archZ);
      pylon.castShadow = true;
      archGroup.add(pylon);

      // Fluted ivory cladding
      const cladding = new THREE.Mesh(new THREE.BoxGeometry(2.6, 11.0, 2.0), mats.vipIvoryFacadeMat);
      cladding.position.set(px, 6.0, archZ);
      archGroup.add(cladding);

      // Golden kalash finial
      const kalash = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.4, 10), mats.vipGoldOrnamentMat);
      kalash.position.set(px, 13.2, archZ);
      archGroup.add(kalash);
    });

    // Transverse grand arch beam spanning tracks (clearance Y = 9.8m)
    const beam = new THREE.Mesh(new THREE.BoxGeometry(spanW + 4.0, 2.2, 2.6), mats.vipIvoryFacadeMat);
    beam.position.set(0, archY + 1.1, archZ);
    beam.castShadow = true;
    archGroup.add(beam);

    // Polished gold frieze trim
    const frieze = new THREE.Mesh(new THREE.BoxGeometry(spanW + 4.2, 0.4, 2.8), mats.vipGoldOrnamentMat);
    frieze.position.set(0, archY + 2.3, archZ);
    archGroup.add(frieze);

    // Marigold garland swag along beam bottom
    const garland = new THREE.Mesh(new THREE.BoxGeometry(spanW + 2.0, 0.45, 0.45), mats.vipMarigoldGarlandMat);
    garland.position.set(0, archY - 0.25, archZ + 1.35);
    archGroup.add(garland);

    // Amber and Blue ceremonial beacons
    [-spanW * 0.35, -spanW * 0.12, spanW * 0.12, spanW * 0.35].forEach((bx, idx) => {
      const bMat = idx % 2 === 0 ? mats.vipBeaconAmberMat : mats.vipBeaconBlueMat;
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), bMat);
      beacon.position.set(bx, archY + 2.8, archZ + 1.4);
      archGroup.add(beacon);
    });

    group.add(archGroup);
  }

  /**
   * Trackside Ceremonial Props, Marigold Swags & Red Carpet Brass Stanchions
   */
  private buildVipTracksideDecorations(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const stanchionX = roadbedWidth * 0.5 + 2.6; // ~8.0m from center
    const stanchionGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.1, 8);
    const ropeGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.8, 6);
    ropeGeo.rotateZ(Math.PI / 2);

    [-1, 1].forEach((side) => {
      const sx = side * stanchionX;
      for (let z = 10; z < chunkLength - 10; z += 14) {
        // Brass stanchion post
        const post = new THREE.Mesh(stanchionGeo, mats.vipGoldOrnamentMat);
        post.position.set(sx, 1.8, -z);
        group.add(post);

        // Velvet red rope linking stanchions
        const rope = new THREE.Mesh(ropeGeo, mats.vipRedCarpetMat);
        rope.position.set(sx, 2.2, -z - 1.9);
        group.add(rope);

        // Marigold flower pot urn
        if (detail === 'FULL') {
          const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.25, 0.7, 8), mats.vipSandstoneMat);
          urn.position.set(side * (stanchionX + 1.4), 1.6, -z);
          group.add(urn);

          const garlandDome = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), mats.vipMarigoldGarlandMat);
          garlandDome.position.set(side * (stanchionX + 1.4), 2.05, -z);
          group.add(garlandDome);
        }
      }
    });
  }

  /**
   * The 6 Required VIP Background Comedy Events
   */
  private buildVipComedyEvents(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    // Event A: Never-Ending Ribbon Ceremony (Trackside X = -18m)
    this.buildVipRibbonCeremony(group, chunkLength, -chunkLength * 0.3, detail);

    // Event B: Camera Crew Chaos (Trackside X = +16.5m)
    this.buildVipCameraCrew(group, chunkLength, -chunkLength * 0.5, detail);

    // Event C: The Eternal Photo Opportunity ("ONE MORE PHOTO!") (Trackside X = -16m)
    this.buildVipPhotoOp(group, chunkLength, -chunkLength * 0.7, detail);

    // Event D: VIP Traffic Control (Distant X = +36m)
    this.buildVipTrafficJam(group, chunkLength, detail);

    // Event E: Grand Opening of Another Grand Opening (Twin Overhead Arches)
    this.buildVipDoubleOpening(group, roadbedWidth, chunkLength);

    // Event F: Announcement Tower (News Ticker Tower at X = -16.5m)
    this.buildVipAnnouncementTower(group, chunkLength, -chunkLength * 0.85, rng);
  }

  /**
   * Event A: Never-Ending Ribbon Ceremony (vip_ribbon_ceremony)
   * An oversized ceremonial ribbon with giant gold scissors, followed immediately by a second identical ribbon!
   */
  private buildVipRibbonCeremony(
    group: THREE.Group,
    chunkLength: number,
    ribbonZ: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL' = 'FULL'
  ): void {
    const mats = this.getSharedMaterials();
    const ceremonyGroup = new THREE.Group();
    ceremonyGroup.name = 'vip_ribbon_ceremony';
    ceremonyGroup.position.set(-18.0, 1.2, ribbonZ);

    // Raised sandstone ceremonial dais
    const dais = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.6, 12.0), mats.vipSandstoneMat);
    dais.position.y = 0.3;
    dais.receiveShadow = true;
    ceremonyGroup.add(dais);

    // Red carpet across dais
    const daisCarpet = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.05, 12.0), mats.vipRedCarpetMat);
    daisCarpet.position.y = 0.63;
    ceremonyGroup.add(daisCarpet);

    // Successive ceremonial ribbons on brass stanchions ("Never-Ending Ribbon Ceremony")
    const ribbonOffsets = detail === 'FULL' ? [-3.0, 0, 3.0] : (detail === 'BALANCED' ? [-2.0, 2.0] : [0]);
    ribbonOffsets.forEach((rz, idx) => {
      // Flanking brass stanchions
      [-2.8, 2.8].forEach((sx) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.8, 8), mats.vipGoldOrnamentMat);
        post.position.set(sx, 1.5, rz);
        ceremonyGroup.add(post);

        const finial = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mats.vipGoldOrnamentMat);
        finial.position.set(sx, 2.5, rz);
        ceremonyGroup.add(finial);
      });

      // Stretched ceremonial satin ribbon
      const ribbon = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.3, 0.08), idx % 2 === 0 ? mats.vipRedCarpetMat : mats.vipSaffronBannerMat);
      ribbon.position.set(0, 1.8, rz);
      ceremonyGroup.add(ribbon);

      // Comically oversized mechanical gold scissors poised to cut the ribbon
      const scissorGroup = new THREE.Group();
      scissorGroup.position.set(0.6 - idx * 0.4, 2.1, rz + 0.3);
      scissorGroup.rotation.z = 0.35 * (idx % 2 === 0 ? 1 : -1);

      // Blade 1
      const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 0.06), mats.vipGoldOrnamentMat);
      blade1.position.set(-0.2, 0.5, 0);
      blade1.rotation.z = -0.3;
      scissorGroup.add(blade1);

      // Blade 2
      const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 0.06), mats.vipGoldOrnamentMat);
      blade2.position.set(0.2, 0.5, 0);
      blade2.rotation.z = 0.3;
      scissorGroup.add(blade2);

      // Scissor handle rings
      if (detail !== 'MINIMAL') {
        [-0.45, 0.45].forEach((hx) => {
          const handle = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 6, 12), mats.vipGoldOrnamentMat);
          handle.position.set(hx, -0.6, 0);
          scissorGroup.add(handle);
        });
      }

      ceremonyGroup.add(scissorGroup);
    });

    group.add(ceremonyGroup);
  }

  /**
   * Event B: Camera Crew Chaos (vip_camera_crew)
   * High scaffolding media enclosure with cartoonish giant telephoto lenses clamoring for angle
   */
  private buildVipCameraCrew(
    group: THREE.Group,
    chunkLength: number,
    crewZ: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL' = 'FULL'
  ): void {
    const mats = this.getSharedMaterials();
    const crewGroup = new THREE.Group();
    crewGroup.name = 'vip_camera_crew';
    crewGroup.position.set(16.5, 1.2, crewZ);

    // Multi-tier metal press scaffolding tower
    const platformW = 7.5;
    const platformH = 3.6;
    const platformD = 10.0;

    const deck = new THREE.Mesh(new THREE.BoxGeometry(platformW, 0.4, platformD), mats.vipNavyTrimMat);
    deck.position.y = platformH;
    deck.receiveShadow = true;
    crewGroup.add(deck);

    // Scaffolding steel legs
    [-platformW * 0.45, platformW * 0.45].forEach((lx) => {
      [-platformD * 0.45, platformD * 0.45].forEach((lz) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, platformH, 8), mats.vipSandstoneMat);
        leg.position.set(lx, platformH * 0.5, lz);
        crewGroup.add(leg);
      });
    });

    // Guard rails
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, platformD), mats.vipGoldOrnamentMat);
    rail.position.set(-platformW * 0.48, platformH + 0.55, 0);
    crewGroup.add(rail);

    // Camera operators with giant cartoon telephoto lenses pointing at the tracks
    const camCount = detail === 'FULL' ? 4 : (detail === 'BALANCED' ? 2 : 1);
    for (let c = 0; c < camCount; c++) {
      const camGroup = new THREE.Group();
      const cz = -platformD * 0.35 + c * 2.3;
      camGroup.position.set(-platformW * 0.25, platformH + 0.4, cz);

      // Camera body on tripod
      const tripod = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 4), mats.vipCameraBodyMat);
      tripod.position.y = 0.6;
      camGroup.add(tripod);

      const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.6), mats.vipCameraBodyMat);
      body.position.y = 1.35;
      camGroup.add(body);

      // Giant oversized telephoto cylinder lens pointed inward toward tracks (-X direction)
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.36, 1.8, 12), mats.vipCameraBodyMat);
      lens.rotation.z = Math.PI / 2;
      lens.position.set(-1.0, 1.35, 0);
      camGroup.add(lens);

      // Cyan lens reflection glass
      const glass = new THREE.Mesh(new THREE.CircleGeometry(0.24, 12), mats.vipCameraLensMat);
      glass.rotation.y = -Math.PI / 2;
      glass.position.set(-1.91, 1.35, 0);
      camGroup.add(glass);

      // Flashing tally indicator light
      const tally = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), mats.vipBeaconAmberMat);
      tally.position.set(-0.2, 1.65, 0.25);
      camGroup.add(tally);

      // Overhead boom microphone pole extending toward railway
      if (c === 1 || c === 3) {
        const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.2, 6), mats.vipGoldOrnamentMat);
        boom.rotation.z = Math.PI / 3;
        boom.position.set(-1.4, 2.6, 0);
        camGroup.add(boom);

        const mic = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.16), mats.vipCameraBodyMat);
        mic.position.set(-2.8, 3.4, 0);
        camGroup.add(mic);
      }

      crewGroup.add(camGroup);
    }

    group.add(crewGroup);
  }

  /**
   * Event C: The Eternal Photo Opportunity ("ONE MORE PHOTO!") (vip_photo_op)
   * 3 nested gilded baroque portrait frames with an illuminated "ONE MORE PHOTO!" sign
   */
  private buildVipPhotoOp(
    group: THREE.Group,
    chunkLength: number,
    photoZ: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL' = 'FULL'
  ): void {
    const mats = this.getSharedMaterials();
    const photoGroup = new THREE.Group();
    photoGroup.name = 'vip_photo_op';
    photoGroup.position.set(-16.0, 1.2, photoZ);

    // Ceremonial red carpet stage
    const stage = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.5, 8.0), mats.vipSandstoneMat);
    stage.position.y = 0.25;
    stage.receiveShadow = true;
    photoGroup.add(stage);

    const carpet = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.05, 8.0), mats.vipRedCarpetMat);
    carpet.position.y = 0.53;
    photoGroup.add(carpet);

    // Nested gilded baroque frames in perspective depth
    const frameOffsets = detail === 'FULL' ? [0, 1.8, 3.6] : (detail === 'BALANCED' ? [0, 2.0] : [0]);
    frameOffsets.forEach((fz, fIdx) => {
      const scale = 1.0 - fIdx * 0.18;
      const frameGroup = new THREE.Group();
      frameGroup.position.set(0, 0.5, fz);

      const fw = 4.2 * scale;
      const fh = 5.2 * scale;
      const barThick = 0.35 * scale;

      // Top bar
      const top = new THREE.Mesh(new THREE.BoxGeometry(fw, barThick, barThick), mats.vipGoldOrnamentMat);
      top.position.y = fh;
      frameGroup.add(top);

      // Bottom bar
      const bottom = new THREE.Mesh(new THREE.BoxGeometry(fw, barThick, barThick), mats.vipGoldOrnamentMat);
      bottom.position.y = barThick * 0.5;
      frameGroup.add(bottom);

      // Left bar
      const left = new THREE.Mesh(new THREE.BoxGeometry(barThick, fh, barThick), mats.vipGoldOrnamentMat);
      left.position.set(-fw * 0.5, fh * 0.5, 0);
      frameGroup.add(left);

      // Right bar
      const right = new THREE.Mesh(new THREE.BoxGeometry(barThick, fh, barThick), mats.vipGoldOrnamentMat);
      right.position.set(fw * 0.5, fh * 0.5, 0);
      frameGroup.add(right);

      // Corner gold rosettes
      if (detail !== 'MINIMAL') {
        [[-fw * 0.5, fh], [fw * 0.5, fh], [-fw * 0.5, barThick * 0.5], [fw * 0.5, barThick * 0.5]].forEach(([cx, cy]) => {
          const rosette = new THREE.Mesh(new THREE.SphereGeometry(0.24 * scale, 8, 8), mats.vipGoldOrnamentMat);
          rosette.position.set(cx, cy, barThick * 0.5);
          frameGroup.add(rosette);
        });
      }

      photoGroup.add(frameGroup);
    });

    // Illuminated "ONE MORE PHOTO!" Signboard
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.5), mats.vipOneMorePhotoSignMat);
    sign.position.set(0, 6.2, 0);
    photoGroup.add(sign);

    group.add(photoGroup);
  }

  /**
   * Event D: VIP Traffic Control (vip_traffic_jam)
   * Elevated civic expressway at X = +36m with pristine white SUVs stuck behind a single ceremonial cone
   */
  private buildVipTrafficJam(
    group: THREE.Group,
    chunkLength: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const mats = this.getSharedMaterials();
    const trafficGroup = new THREE.Group();
    trafficGroup.name = 'vip_traffic_jam';
    const roadX = 36.0;
    const roadY = 3.5;

    // Elevated expressway concrete viaduct deck
    const viaduct = new THREE.Mesh(new THREE.BoxGeometry(8.5, 1.2, chunkLength), mats.vipSandstoneMat);
    viaduct.position.set(roadX, roadY, -chunkLength * 0.5);
    viaduct.receiveShadow = true;
    trafficGroup.add(viaduct);

    // Highway parapet barriers
    [-4.0, 4.0].forEach((px) => {
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, chunkLength), mats.vipIvoryFacadeMat);
      barrier.position.set(roadX + px, roadY + 1.15, -chunkLength * 0.5);
      trafficGroup.add(barrier);
    });

    // Line of 4 identical pristine white VIP SUVs stuck bumper-to-bumper
    const suvCount = detail === 'FULL' ? 4 : (detail === 'BALANCED' ? 2 : 1);
    for (let s = 0; s < suvCount; s++) {
      const suvGroup = new THREE.Group();
      const suvZ = -14.0 - s * 13.5;
      suvGroup.position.set(roadX, roadY + 0.6, suvZ);

      // Main SUV boxy hull
      const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 6.2), mats.vipWhiteVehicleMat);
      hull.position.y = 1.1;
      hull.castShadow = true;
      suvGroup.add(hull);

      // Dark tinted glass greenhouse cab
      const greenhouse = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.1, 3.6), mats.vipNavyTrimMat);
      greenhouse.position.set(0, 2.2, -0.4);
      suvGroup.add(greenhouse);

      // Polished chrome grille
      const grille = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.2), mats.vipGoldOrnamentMat);
      grille.position.set(0, 0.9, 3.15);
      suvGroup.add(grille);

      // Rotating roof beacons (Amber + Blue VIP flashers)
      [-0.8, 0.8].forEach((bx, idx) => {
        const beaconMat = idx === 0 ? mats.vipBeaconAmberMat : mats.vipBeaconBlueMat;
        const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.25, 8), beaconMat);
        beacon.position.set(bx, 2.85, 0);
        suvGroup.add(beacon);
      });

      trafficGroup.add(suvGroup);
    }

    // The Culprit: A single tiny ceremonial cone and ribbon halting the entire convoy!
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.1, 8), mats.vipSaffronBannerMat);
    cone.position.set(roadX, roadY + 1.15, -6.5);
    trafficGroup.add(cone);

    const miniRibbon = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.15, 0.05), mats.vipRedCarpetMat);
    miniRibbon.position.set(roadX, roadY + 1.25, -6.5);
    trafficGroup.add(miniRibbon);

    group.add(trafficGroup);
  }

  /**
   * Event E: Grand Opening of Another Grand Opening (vip_double_opening)
   * Twin ceremonial gateways at Z = -20m ("GRAND OPENING") and Z = -60m ("GRAND OPENING — PART 2")
   */
  private buildVipDoubleOpening(group: THREE.Group, roadbedWidth: number, chunkLength: number): void {
    const mats = this.getSharedMaterials();
    const doubleGroup = new THREE.Group();
    doubleGroup.name = 'vip_double_opening';

    const spanW = roadbedWidth + 3.0; // ~13.8m
    const clearY = 10.4; // Beam bottom at 10.4m (clearance strictly > 8.5m)

    // Arch 1: "GRAND OPENING" at Z = -20m
    // Arch 2: "GRAND OPENING — PART 2" at Z = -60m
    const gates = [
      { z: -20.0, mat: mats.vipGrandOpeningSignMat },
      { z: -60.0, mat: mats.vipPartTwoSignMat }
    ];

    gates.forEach(({ z, mat }) => {
      const arch = new THREE.Group();
      arch.position.set(0, 0, z);

      // Flanking sandstone pylons at |X| = spanW * 0.5 + 0.8 (~7.7m)
      [-spanW * 0.5 - 0.8, spanW * 0.5 + 0.8].forEach((px) => {
        const pylon = new THREE.Mesh(new THREE.BoxGeometry(2.2, 12.0, 2.2), mats.vipSandstoneMat);
        pylon.position.set(px, 6.0, 0);
        arch.add(pylon);

        const finial = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.2, 10), mats.vipGoldOrnamentMat);
        finial.position.set(px, 13.1, 0);
        arch.add(finial);
      });

      // Overhead arch cross-beam
      const beam = new THREE.Mesh(new THREE.BoxGeometry(spanW + 3.8, 2.2, 2.4), mats.vipIvoryFacadeMat);
      beam.position.set(0, clearY + 1.1, 0);
      arch.add(beam);

      // Huge Illuminated Banner
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 2.2), mat);
      sign.position.set(0, clearY + 1.1, 1.25);
      arch.add(sign);

      // Marigold garland swag
      const garland = new THREE.Mesh(new THREE.BoxGeometry(spanW + 2.0, 0.4, 0.4), mats.vipMarigoldGarlandMat);
      garland.position.set(0, clearY - 0.2, 1.25);
      arch.add(garland);

      doubleGroup.add(arch);
    });

    group.add(doubleGroup);
  }

  /**
   * Event F: Announcement Tower / Ticker Screen (vip_announcement_tower)
   * 14m high sleek digital media monolith displaying cycling satirical news tickers
   */
  private buildVipAnnouncementTower(
    group: THREE.Group,
    chunkLength: number,
    towerZ: number,
    rng: SeededRandom
  ): void {
    const mats = this.getSharedMaterials();
    const towerGroup = new THREE.Group();
    towerGroup.name = 'vip_announcement_tower';
    towerGroup.position.set(-16.5, 0, towerZ);

    const towerH = 14.0;
    const towerW = 6.0;
    const towerD = 3.2;

    // Ivory & sandstone architectural tower shaft
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerD), mats.vipSandstoneMat);
    shaft.position.y = towerH * 0.5;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    towerGroup.add(shaft);

    // Polished gold fluting trim bands
    [-towerW * 0.48, towerW * 0.48].forEach((tx) => {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.3, towerH, 0.3), mats.vipGoldOrnamentMat);
      trim.position.set(tx, towerH * 0.5, towerD * 0.5);
      towerGroup.add(trim);
    });

    // Golden kalash spire atop tower
    const kalash = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.2, 12), mats.vipGoldOrnamentMat);
    kalash.position.y = towerH + 1.6;
    towerGroup.add(kalash);

    // High-resolution digital LED display screen facing toward tracks (+X / +Z angle)
    const screenMat = rng.chance(0.33)
      ? mats.vipAnnouncementScreenMat1
      : rng.chance(0.5)
      ? mats.vipAnnouncementScreenMat2
      : mats.vipAnnouncementScreenMat3;

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 7.8), screenMat);
    screen.position.set(0, 8.2, towerD * 0.5 + 0.08);
    towerGroup.add(screen);

    // Amber and blue status beacons atop screen
    [-1.8, 1.8].forEach((bx, idx) => {
      const beaconMat = idx === 0 ? mats.vipBeaconAmberMat : mats.vipBeaconBlueMat;
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), beaconMat);
      beacon.position.set(bx, 12.6, towerD * 0.5 + 0.2);
      towerGroup.add(beacon);
    });

    group.add(towerGroup);
  }

  /**
   * Landmark 0: Grand Ceremonial Plaza (vip_ceremonial_plaza)
   * Triumphal pavilion with cascading stairs, reflective fountain pool, golden obelisks, and flower carpets
   */
  private buildVipCeremonialPlaza(
    group: THREE.Group,
    chunkLength: number,
    plazaZ: number,
    rng: SeededRandom
  ): void {
    const mats = this.getSharedMaterials();
    const plazaGroup = new THREE.Group();
    plazaGroup.name = 'vip_ceremonial_plaza';
    plazaGroup.position.set(-18.5, 0, plazaZ);

    const plazaW = 16.0;
    const plazaD = 22.0;

    // Raised sandstone pavilion terrace
    const terrace = new THREE.Mesh(new THREE.BoxGeometry(plazaW, 1.8, plazaD), mats.vipSandstoneMat);
    terrace.position.y = 0.9;
    terrace.receiveShadow = true;
    plazaGroup.add(terrace);

    // Reflective civic ceremonial water fountain pool
    const pool = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.4, 12.0), mats.vipWaterPoolMat);
    pool.position.set(0, 1.9, 0);
    plazaGroup.add(pool);

    // Polished marble coping rim
    const rim = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.3, 12.6), mats.vipIvoryFacadeMat);
    rim.position.set(0, 2.0, 0);
    plazaGroup.add(rim);

    // Golden ceremonial obelisk at center of plaza pool
    const obeliskGeo = new THREE.CylinderGeometry(0.4, 0.9, 9.5, 4);
    obeliskGeo.rotateY(Math.PI / 4);
    const obelisk = new THREE.Mesh(obeliskGeo, mats.vipGoldOrnamentMat);
    obelisk.position.set(0, 6.75, 0);
    plazaGroup.add(obelisk);

    // Golden pyramidion cap atop obelisk
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.6, 4), mats.vipGoldOrnamentMat);
    cap.rotation.y = Math.PI / 4;
    cap.position.set(0, 12.0, 0);
    plazaGroup.add(cap);

    // 4 Corner Ivory Colonnade pavilions
    [-plazaW * 0.4, plazaW * 0.4].forEach((px) => {
      [-plazaD * 0.4, plazaD * 0.4].forEach((pz) => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 6.0, 8), mats.vipIvoryFacadeMat);
        pillar.position.set(px, 4.8, pz);
        plazaGroup.add(pillar);

        const finial = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), mats.vipGoldOrnamentMat);
        finial.position.set(px, 8.2, pz);
        plazaGroup.add(finial);
      });
    });

    group.add(plazaGroup);
  }

  /**
   * Landmark 1: Monumental Media Press Enclosure (vip_press_enclosure)
   * Colossal multi-tiered media press pavilion with broadcasting antennas and flashing camera stands
   */
  private buildVipPressEnclosure(
    group: THREE.Group,
    chunkLength: number,
    enclosureZ: number,
    rng: SeededRandom
  ): void {
    const mats = this.getSharedMaterials();
    const pressGroup = new THREE.Group();
    pressGroup.name = 'vip_press_enclosure';
    pressGroup.position.set(18.5, 0, enclosureZ);

    const pressW = 14.0;
    const pressD = 20.0;
    const pressH = 8.5;

    // Multi-tier tiered press grandstand
    const stand = new THREE.Mesh(new THREE.BoxGeometry(pressW, pressH, pressD), mats.vipSandstoneMat);
    stand.position.y = pressH * 0.5;
    stand.receiveShadow = true;
    pressGroup.add(stand);

    // Saffron and Navy canopy roof over media stands
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(pressW + 2.0, 0.6, pressD + 2.0), mats.vipSaffronBannerMat);
    canopy.position.y = pressH + 3.2;
    pressGroup.add(canopy);

    // Broadcast antenna mast extending skyward
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 14.0, 8), mats.vipNavyTrimMat);
    mast.position.set(0, pressH + 10.0, 0);
    pressGroup.add(mast);

    // Flashing red & amber aviation warning beacon atop mast
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), mats.vipBeaconAmberMat);
    beacon.position.set(0, pressH + 17.2, 0);
    pressGroup.add(beacon);

    // Parabolic satellite uplink dish
    const dish = new THREE.Mesh(new THREE.SphereGeometry(1.8, 12, 12, 0, Math.PI), mats.vipIvoryFacadeMat);
    dish.rotation.x = Math.PI / 4;
    dish.position.set(-pressW * 0.3, pressH + 4.8, 0);
    pressGroup.add(dish);

    group.add(pressGroup);
  }

  /**
   * Landmark 2: Monumental Secretariat Colonnade (vip_secretariat_colonnade)
   * Neoclassical civic concourse with endless fluted ivory columns and golden dome cupolas
   */
  private buildVipSecretariatColonnade(
    group: THREE.Group,
    chunkLength: number,
    colonnadeZ: number,
    rng: SeededRandom
  ): void {
    const mats = this.getSharedMaterials();
    const colonnadeGroup = new THREE.Group();
    colonnadeGroup.name = 'vip_secretariat_colonnade';
    colonnadeGroup.position.set(-20.0, 0, colonnadeZ);

    const bldgW = 16.0;
    const bldgH = 14.0;
    const bldgD = 24.0;

    // Massive civic secretariat administrative palace
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bldgW, bldgH, bldgD), mats.vipSandstoneMat);
    mainBody.position.y = bldgH * 0.5;
    mainBody.receiveShadow = true;
    colonnadeGroup.add(mainBody);

    // Row of 6 monumental fluted ivory columns facing toward tracks
    for (let c = 0; c < 6; c++) {
      const colZ = -bldgD * 0.4 + c * (bldgD * 0.8 / 5);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, bldgH, 12), mats.vipIvoryFacadeMat);
      col.position.set(bldgW * 0.5 + 1.2, bldgH * 0.5, colZ);
      colonnadeGroup.add(col);

      // Gold capital ornament atop column
      const capital = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 1.8), mats.vipGoldOrnamentMat);
      capital.position.set(bldgW * 0.5 + 1.2, bldgH + 0.3, colZ);
      colonnadeGroup.add(capital);
    }

    // Overhead entablature and pediment
    const entablature = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.4, bldgD + 2.0), mats.vipIvoryFacadeMat);
    entablature.position.set(bldgW * 0.5 + 1.2, bldgH + 1.3, 0);
    colonnadeGroup.add(entablature);

    // Grand golden central cupola dome atop building
    const dome = new THREE.Mesh(new THREE.SphereGeometry(4.5, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), mats.vipGoldOrnamentMat);
    dome.position.set(0, bldgH, 0);
    colonnadeGroup.add(dome);

    // Golden kalash spire atop central dome
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.6, 10), mats.vipGoldOrnamentMat);
    spire.position.set(0, bldgH + 5.5, 0);
    colonnadeGroup.add(spire);

    group.add(colonnadeGroup);
  }

  /**
   * Landmark 3: Executive VIP Convoy Helipad (vip_convoy_helipad)
   * Elevated landing pad with red carpet runway and standby executive aircraft silhouette
   */
  private buildVipConvoyHelipad(
    group: THREE.Group,
    chunkLength: number,
    helipadZ: number,
    rng: SeededRandom
  ): void {
    const mats = this.getSharedMaterials();
    const helipadGroup = new THREE.Group();
    helipadGroup.name = 'vip_convoy_helipad';
    helipadGroup.position.set(20.0, 0, helipadZ);

    const padRadius = 9.0;
    const padH = 4.2;

    // Raised circular concrete helipad platform
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(padRadius, padRadius + 1.2, padH, 20), mats.vipSandstoneMat);
    platform.position.y = padH * 0.5;
    platform.receiveShadow = true;
    helipadGroup.add(platform);

    // Circular red carpet landing mark
    const landingCircle = new THREE.Mesh(new THREE.CylinderGeometry(padRadius * 0.75, padRadius * 0.75, 0.08, 16), mats.vipRedCarpetMat);
    landingCircle.position.y = padH + 0.04;
    helipadGroup.add(landingCircle);

    // Prominent "H" landing marking in gold
    const hBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 4.2), mats.vipGoldOrnamentMat);
    hBar1.position.set(-1.4, padH + 0.08, 0);
    helipadGroup.add(hBar1);

    const hBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 4.2), mats.vipGoldOrnamentMat);
    hBar2.position.set(1.4, padH + 0.08, 0);
    helipadGroup.add(hBar2);

    const hCross = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.6), mats.vipGoldOrnamentMat);
    hCross.position.set(0, padH + 0.08, 0);
    helipadGroup.add(hCross);

    // Perimeter green & amber boundary lights
    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      const lx = Math.cos(angle) * (padRadius - 0.6);
      const lz = Math.sin(angle) * (padRadius - 0.6);
      const bMat = a % 2 === 0 ? mats.vipBeaconAmberMat : mats.vipBeaconBlueMat;
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), bMat);
      lamp.position.set(lx, padH + 0.25, lz);
      helipadGroup.add(lamp);
    }

    // Standby executive helicopter fuselage silhouette
    const chopperGroup = new THREE.Group();
    chopperGroup.position.set(0, padH + 0.6, 0);

    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 6.2), mats.vipWhiteVehicleMat);
    fuselage.position.y = 1.1;
    chopperGroup.add(fuselage);

    // Dark cockpit windshield
    const glass = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 1.8), mats.vipNavyTrimMat);
    glass.position.set(0, 1.6, 2.2);
    chopperGroup.add(glass);

    // Overhead rotor blade hub & cross blades
    const rotorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8), mats.vipGoldOrnamentMat);
    rotorHub.position.y = 2.3;
    chopperGroup.add(rotorHub);

    const blades = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.08, 0.4), mats.vipNavyTrimMat);
    blades.position.y = 2.6;
    chopperGroup.add(blades);

    helipadGroup.add(chopperGroup);
    group.add(helipadGroup);
  }
}
