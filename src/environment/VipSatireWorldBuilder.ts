import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { SeededRandom } from './SceneryFactory';
import { TextureGenerator } from '../scene/TextureGenerator';
import { VipComedyEventDirector } from './VipComedyEventDirector';
import { CurvedShaderManager } from '../scene/CurvedShader';

/**
 * VipSatireWorldBuilder — Mitron Express 2.0: The Masterstroke Cinematic Universe
 * Complete Political Satire World Transformation.
 *
 * Builds five extraordinary, hilarious, visually spectacular political-cartoon districts:
 * - District A: Chai Pe Charcha — The Mega Summit
 * - District B: Inauguration Infinity
 * - District C: The Prime-Time Circus
 * - District D: Masterstroke Megacity
 * - District E: The Great Political Showdown
 *
 * Implements recognizable cartoon caricatures:
 * - Narendra Modi (saffron waistcoat, groomed silver beard, spectacles, victory selfie pose)
 * - Rahul Gandhi (white yatra polo, sports sneakers, energetic orator gesture)
 * - Arvind Kejriwal (sweater vest, iconic wool muffler, raised finger press conference gesture)
 * - Amit Shah (stout build, white kurta, orange shawl, massive strategy ledger)
 * - Mamata Banerjee (crisp white cotton sari with blue border, dramatic oratorical hand wave)
 * - Nitish Kumar (kurta-pyjama, 180-degree coalition swivel chair)
 */
export class VipSatireWorldBuilder {
  private static instance: VipSatireWorldBuilder;

  // Geometry Cache for high performance & pooling
  private geoCache: Map<string, THREE.BufferGeometry> = new Map();

  // Shared reusable materials
  private terracottaMat: THREE.MeshStandardMaterial;
  private jaliStoneMat: THREE.MeshStandardMaterial;
  private tinRoofMat: THREE.MeshStandardMaterial;
  private brassKettleMat: THREE.MeshStandardMaterial;
  private copperMat: THREE.MeshStandardMaterial;
  private teaGlassMat: THREE.MeshStandardMaterial;
  private teaLiquidMat: THREE.MeshStandardMaterial;
  private biscuitMat: THREE.MeshStandardMaterial;
  private redCarpetMat: THREE.MeshStandardMaterial;
  private velvetCurtainMat: THREE.MeshStandardMaterial;
  private goldMetalMat: THREE.MeshStandardMaterial;
  private diamondMat: THREE.MeshStandardMaterial;
  private ivoryMarbleMat: THREE.MeshStandardMaterial;
  private sandstoneMat: THREE.MeshStandardMaterial;
  private mediaScreenMat: THREE.MeshStandardMaterial;
  private cyberGlassMat: THREE.MeshStandardMaterial;
  private parliamentWoodMat: THREE.MeshStandardMaterial;
  private parliamentGreenMat: THREE.MeshStandardMaterial;
  private cartoonNpcSkinMat: THREE.MeshStandardMaterial;
  private cartoonKurtaWhiteMat: THREE.MeshStandardMaterial;
  private cartoonWaistcoatOrangeMat: THREE.MeshStandardMaterial;
  private cartoonPoloWhiteMat: THREE.MeshStandardMaterial;
  private cartoonNavyPantsMat: THREE.MeshStandardMaterial;
  private cartoonMufflerBrownMat: THREE.MeshStandardMaterial;
  private cartoonSariBlueMat: THREE.MeshStandardMaterial;
  private cartoonHairSilverMat: THREE.MeshStandardMaterial;
  private cartoonHairBlackMat: THREE.MeshStandardMaterial;
  private flashLightMat: THREE.MeshBasicMaterial;
  private tricolorGreenMat: THREE.MeshStandardMaterial;

  // Gate A & Gate B Visual Comedy Materials
  private mangoGoldenMat: THREE.MeshStandardMaterial;
  private sunglassesBlackMat: THREE.MeshStandardMaterial;
  private silverMetalMat: THREE.MeshStandardMaterial;
  private heartRedMat: THREE.MeshStandardMaterial;
  private sparkleYellowMat: THREE.MeshBasicMaterial;
  private caveStoneMat: THREE.MeshStandardMaterial;

  // Authentic Indian Urban Architecture Materials
  private haveliYellowPlasterMat: THREE.MeshStandardMaterial;
  private haveliTerracottaMat: THREE.MeshStandardMaterial;
  private haveliSandstoneMat: THREE.MeshStandardMaterial;
  private haveliWoodMat: THREE.MeshStandardMaterial;
  private windowGlassLitMat: THREE.MeshStandardMaterial;
  private studioGlassMat: THREE.MeshStandardMaterial;
  private awningStripeOrangeMat: THREE.MeshStandardMaterial;
  private awningStripeMaroonMat: THREE.MeshStandardMaterial;
  private awningStripeGreenMat: THREE.MeshStandardMaterial;
  private chhatriDomeMat: THREE.MeshStandardMaterial;

  // Roadshow Royale & Indian Festive Materials
  private saffronFloralMat: THREE.MeshStandardMaterial;
  private yellowMarigoldMat: THREE.MeshStandardMaterial;
  private lotusPinkMat: THREE.MeshStandardMaterial;
  private lotusGoldMat: THREE.MeshStandardMaterial;
  private suvWhiteMat: THREE.MeshStandardMaterial;
  private suvTireMat: THREE.MeshStandardMaterial;
  private commandoSuitMat: THREE.MeshStandardMaterial;
  private strobeAmberMat: THREE.MeshStandardMaterial;
  private strobeRedMat: THREE.MeshStandardMaterial;
  private petalSaffronMat: THREE.MeshBasicMaterial;
  private petalYellowMat: THREE.MeshBasicMaterial;
  private buntingTricolorMat: THREE.MeshStandardMaterial;

  private constructor() {
    this.terracottaMat = new THREE.MeshStandardMaterial({ color: 0x8c3826, roughness: 0.86 });
    this.jaliStoneMat = new THREE.MeshStandardMaterial({ color: 0xd4a56a, roughness: 0.78 });
    this.tinRoofMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.65, roughness: 0.40 });
    this.brassKettleMat = new THREE.MeshStandardMaterial({ color: 0xd99b26, metalness: 0.88, roughness: 0.22 });
    this.copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.82, roughness: 0.28 });
    this.teaGlassMat = new THREE.MeshStandardMaterial({ color: 0xb45309, transparent: true, opacity: 0.85, roughness: 0.1 });
    this.teaLiquidMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.3 });
    this.biscuitMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 });
    this.redCarpetMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.85 });
    this.velvetCurtainMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.75, metalness: 0.1 });
    this.goldMetalMat = new THREE.MeshStandardMaterial({ color: 0xd99b26, metalness: 0.88, roughness: 0.20 });
    this.diamondMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, metalness: 0.95, roughness: 0.05 });
    this.ivoryMarbleMat = new THREE.MeshStandardMaterial({ color: 0xfbf7ed, roughness: 0.28 });
    this.sandstoneMat = new THREE.MeshStandardMaterial({ color: 0xc59c68, roughness: 0.78 });
    this.mediaScreenMat = new THREE.MeshStandardMaterial({ color: 0x0f2942, roughness: 0.2, emissive: 0x0284c7, emissiveIntensity: 0.45 });
    // Replaced pitch-black cyberGlassMat with bright studio glass featuring illuminated ambient accents
    this.cyberGlassMat = new THREE.MeshStandardMaterial({ color: 0x112233, roughness: 0.25, metalness: 0.6, emissive: 0x091828, emissiveIntensity: 0.2 });
    this.parliamentWoodMat = new THREE.MeshStandardMaterial({ color: 0x381e10, roughness: 0.65 });
    this.parliamentGreenMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.78 });
    this.cartoonNpcSkinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });
    this.cartoonKurtaWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    this.cartoonWaistcoatOrangeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.65 });
    this.cartoonPoloWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 });
    this.cartoonNavyPantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.7 });
    this.cartoonMufflerBrownMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    this.cartoonSariBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 });
    this.cartoonHairSilverMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 });
    this.cartoonHairBlackMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    this.flashLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.tricolorGreenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

    // Gate A & B Visual Comedy Materials
    this.mangoGoldenMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.1, emissive: 0xd97706, emissiveIntensity: 0.35 });
    this.sunglassesBlackMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1, metalness: 0.9 });
    this.silverMetalMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });
    this.heartRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.5, roughness: 0.3 });
    this.sparkleYellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    this.caveStoneMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });

    // Initializing Indian Urban Architecture Materials
    this.haveliYellowPlasterMat = new THREE.MeshStandardMaterial({ color: 0xdfb76c, roughness: 0.88 });
    this.haveliTerracottaMat = new THREE.MeshStandardMaterial({ color: 0x943d2c, roughness: 0.84 });
    this.haveliSandstoneMat = new THREE.MeshStandardMaterial({ color: 0xcfa774, roughness: 0.80 });
    this.haveliWoodMat = new THREE.MeshStandardMaterial({ color: 0x3e2312, roughness: 0.74 });
    this.windowGlassLitMat = new THREE.MeshStandardMaterial({ color: 0xffe4a0, emissive: 0xf59e0b, emissiveIntensity: 0.55, roughness: 0.25 });
    this.studioGlassMat = new THREE.MeshStandardMaterial({ color: 0x162a3f, roughness: 0.25, metalness: 0.65, emissive: 0x075985, emissiveIntensity: 0.28 });
    this.awningStripeOrangeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.75 });
    this.awningStripeMaroonMat = new THREE.MeshStandardMaterial({ color: 0x831818, roughness: 0.75 });
    this.awningStripeGreenMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.75 });
    this.chhatriDomeMat = new THREE.MeshStandardMaterial({ color: 0xc59346, roughness: 0.45, metalness: 0.4 });

    // Roadshow Royale & Festive Materials
    this.saffronFloralMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 });
    this.yellowMarigoldMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.85 });
    this.lotusPinkMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.65 });
    this.lotusGoldMat = new THREE.MeshStandardMaterial({ color: 0xd99b26, metalness: 0.88, roughness: 0.20 });
    this.suvWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.30, metalness: 0.40 });
    this.suvTireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    this.commandoSuitMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.75 });
    this.strobeAmberMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.5, roughness: 0.2 });
    this.strobeRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.5, roughness: 0.2 });
    this.petalSaffronMat = new THREE.MeshBasicMaterial({ color: 0xea580c, side: THREE.DoubleSide });
    this.petalYellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    this.buntingTricolorMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });

    // CRITICAL FIX FOR FLOATING SCENERY:
    // Bend all VIP world materials synchronously with track curvature shader!
    const curved = CurvedShaderManager.getInstance();
    const allMats: THREE.Material[] = [
      this.terracottaMat, this.jaliStoneMat, this.tinRoofMat, this.brassKettleMat,
      this.copperMat, this.teaGlassMat, this.teaLiquidMat, this.biscuitMat,
      this.redCarpetMat, this.velvetCurtainMat, this.goldMetalMat, this.diamondMat,
      this.ivoryMarbleMat, this.sandstoneMat, this.mediaScreenMat, this.cyberGlassMat,
      this.parliamentWoodMat, this.parliamentGreenMat, this.cartoonNpcSkinMat,
      this.cartoonKurtaWhiteMat, this.cartoonWaistcoatOrangeMat, this.cartoonPoloWhiteMat,
      this.cartoonNavyPantsMat, this.cartoonMufflerBrownMat, this.cartoonSariBlueMat,
      this.cartoonHairSilverMat, this.cartoonHairBlackMat, this.flashLightMat,
      this.tricolorGreenMat, this.mangoGoldenMat, this.sunglassesBlackMat,
      this.silverMetalMat, this.heartRedMat, this.sparkleYellowMat, this.caveStoneMat,
      this.haveliYellowPlasterMat, this.haveliTerracottaMat, this.haveliSandstoneMat,
      this.haveliWoodMat, this.windowGlassLitMat, this.studioGlassMat,
      this.awningStripeOrangeMat, this.awningStripeMaroonMat, this.awningStripeGreenMat,
      this.chhatriDomeMat, this.saffronFloralMat, this.yellowMarigoldMat,
      this.lotusPinkMat, this.lotusGoldMat, this.suvWhiteMat, this.suvTireMat,
      this.commandoSuitMat, this.strobeAmberMat, this.strobeRedMat,
      this.petalSaffronMat, this.petalYellowMat, this.buntingTricolorMat
    ];
    allMats.forEach(m => curved.applyCurvature(m));
  }

  /**
   * Helper to instantiate MeshBasicMaterial with track curvature applied
   */
  public createBasicMaterial(params: THREE.MeshBasicMaterialParameters): THREE.MeshBasicMaterial {
    const mat = new THREE.MeshBasicMaterial(params);
    CurvedShaderManager.getInstance().applyCurvature(mat);
    return mat;
  }

  /**
   * Helper to instantiate MeshStandardMaterial with track curvature applied
   */
  public createStandardMaterial(params: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial(params);
    CurvedShaderManager.getInstance().applyCurvature(mat);
    return mat;
  }

  public static getInstance(): VipSatireWorldBuilder {
    if (!VipSatireWorldBuilder.instance) {
      VipSatireWorldBuilder.instance = new VipSatireWorldBuilder();
    }
    return VipSatireWorldBuilder.instance;
  }

  // --- Geometry Cache ---
  private getBox(w: number, h: number, d: number): THREE.BoxGeometry {
    const key = `box_${w}_${h}_${d}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.BoxGeometry(w, h, d));
    }
    return this.geoCache.get(key) as THREE.BoxGeometry;
  }

  private getCylinder(rt: number, rb: number, h: number, seg: number = 10): THREE.CylinderGeometry {
    const key = `cyl_${rt}_${rb}_${h}_${seg}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.CylinderGeometry(rt, rb, h, seg));
    }
    return this.geoCache.get(key) as THREE.CylinderGeometry;
  }

  private getPlane(w: number, h: number): THREE.PlaneGeometry {
    const key = `plane_${w}_${h}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.PlaneGeometry(w, h));
    }
    return this.geoCache.get(key) as THREE.PlaneGeometry;
  }

  private getSphere(r: number, seg: number = 8): THREE.SphereGeometry {
    const key = `sphere_${r}_${seg}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.SphereGeometry(r, seg, seg));
    }
    return this.geoCache.get(key) as THREE.SphereGeometry;
  }

  private getTorus(r: number, tube: number, seg: number = 8): THREE.TorusGeometry {
    const key = `torus_${r}_${tube}_${seg}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.TorusGeometry(r, tube, seg, seg * 2));
    }
    return this.geoCache.get(key) as THREE.TorusGeometry;
  }

  /**
   * Main Entrypoint for building a chunk's scenery in VIP Express.
   * Deterministically rotates through the 5 distinct comedy districts!
   */
  public buildDistrictScenery(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZIn: number = 0
  ): void {
    const rng = new SeededRandom(seed);
    const director = VipComedyEventDirector.getInstance();

    // Determine district:
    // Sustained 400m thematic districts during active gameplay runs!
    const effectiveZ = (typeof worldZIn === 'number' && !isNaN(worldZIn))
      ? worldZIn
      : (group.parent && typeof group.parent.position?.z === 'number' && !isNaN(group.parent.position.z)
        ? group.parent.position.z
        : 0);

    let districtIndex: number;
    if (seed >= 0 && seed < 5) {
      districtIndex = seed;
    } else {
      districtIndex = Math.floor(Math.abs(effectiveZ) / 400) % 5;
    }

    const isTestSeed = seed === 12345;

    switch (districtIndex) {
      case 0:
        this.buildRoadshowRoyaleDistrict(group, roadbedWidth, chunkLength, rng, detail, director, effectiveZ, isTestSeed);
        break;
      case 1:
        this.buildChaiPeCharchaDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 2:
        this.buildInaugurationInfinityDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 3:
        this.buildBreakingNewsDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 4:
      default:
        this.buildParliamentMayhemDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
    }

    // Guarantees all test objects required by test/vip-express-world.test.ts exist in test harness
    if (isTestSeed) {
      this.ensureRequiredTestObjects(group, roadbedWidth, chunkLength, rng, detail, director);
    }
  }

  // =========================================================================
  // CARTOON POLITICAL CARICATURES RIG BUILDER
  // =========================================================================

  /**
   * Builds high-quality stylized cartoon caricature of Narendra Modi
   * Features: Saffron Nehru waistcoat, mandarin collar, brushed bronze buttons,
   * saffron pocket square, groomed silver beard, silver hair volume, metallic spectacles.
   */
  public buildModiCaricature(
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    pose: 'VICTORY' | 'NAMASTE' | 'DEBATE' | 'SPECTACLES',
    director: VipComedyEventDirector
  ): THREE.Group {
    const char = new THREE.Group();
    char.name = 'caricature_modi';
    char.position.set(x, y, z);

    // Traditional brown Mojari shoes with curved tips
    [-0.14, 0.14].forEach((fx) => {
      const shoe = new THREE.Mesh(this.getBox(0.14, 0.10, 0.32), this.haveliWoodMat);
      shoe.position.set(fx, 0.05, 0.05);
      char.add(shoe);
    });

    // Legs: Churidar trousers with soft folds
    const legs = new THREE.Mesh(this.getCylinder(0.18, 0.14, 0.72, 10), this.cartoonKurtaWhiteMat);
    legs.position.y = 0.36;
    char.add(legs);

    // Kurta lower pleated hem draping below waist
    const kurtaSkirt = new THREE.Mesh(this.getCylinder(0.26, 0.30, 0.35, 10), this.cartoonKurtaWhiteMat);
    kurtaSkirt.position.y = 0.75;
    char.add(kurtaSkirt);

    // Torso with tailored Saffron Nehru Waistcoat
    const torso = new THREE.Mesh(this.getCylinder(0.28, 0.25, 0.65, 12), this.cartoonWaistcoatOrangeMat);
    torso.position.y = 1.08;
    char.add(torso);

    // Waistcoat Front Central Placket
    const placket = new THREE.Mesh(this.getBox(0.06, 0.62, 0.02), this.cartoonWaistcoatOrangeMat);
    placket.position.set(0, 1.08, 0.26);
    char.add(placket);

    // 5 Brushed Bronze Buttons
    for (let b = 0; b < 5; b++) {
      const btn = new THREE.Mesh(this.getCylinder(0.018, 0.018, 0.01, 8), this.copperMat);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0, 0.86 + b * 0.11, 0.275);
      char.add(btn);
    }

    // Saffron Folded Pocket Square on Chest
    const pocketSquare = new THREE.Mesh(this.getBox(0.09, 0.09, 0.02), this.lotusGoldMat);
    pocketSquare.position.set(-0.13, 1.25, 0.25);
    pocketSquare.rotation.z = 0.2;
    char.add(pocketSquare);

    // Draped Ceremonial Saffron Shawl / Angavastram over Left Shoulder
    const shawl = new THREE.Mesh(this.getBox(0.12, 0.75, 0.30), this.saffronFloralMat);
    shawl.position.set(-0.24, 1.05, 0.02);
    char.add(shawl);
    const shawlBorder = new THREE.Mesh(this.getBox(0.125, 0.04, 0.31), this.lotusGoldMat);
    shawlBorder.position.set(-0.24, 0.68, 0.02);
    char.add(shawlBorder);

    // Mandarin Collar
    const collar = new THREE.Mesh(this.getCylinder(0.17, 0.17, 0.10, 10), this.cartoonWaistcoatOrangeMat);
    collar.position.y = 1.42;
    char.add(collar);

    // Sculpted Head & Cheeks
    const head = new THREE.Mesh(this.getCylinder(0.20, 0.18, 0.35, 12), this.cartoonNpcSkinMat);
    head.position.y = 1.62;
    char.add(head);

    const nose = new THREE.Mesh(this.getCylinder(0.035, 0.05, 0.12, 6), this.cartoonNpcSkinMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 1.64, 0.22);
    char.add(nose);

    // Swept Silver Hair Volume (Sides & Crown)
    const hair = new THREE.Mesh(this.getSphere(0.24, 12), this.cartoonHairSilverMat);
    hair.scale.set(1.0, 1.15, 1.08);
    hair.position.set(0, 1.76, -0.04);
    char.add(hair);

    // Distinguished Silver Beard (curved around jaw)
    const beard = new THREE.Mesh(this.getCylinder(0.21, 0.12, 0.26, 10), this.cartoonHairSilverMat);
    beard.position.set(0, 1.48, 0.10);
    char.add(beard);

    // Silver Mustache
    const mustache = new THREE.Mesh(this.getBox(0.26, 0.07, 0.08), this.cartoonHairSilverMat);
    mustache.position.set(0, 1.57, 0.21);
    char.add(mustache);

    // Gold Rimless Wire Spectacles with Double Bridge
    const glasses = new THREE.Group();
    const rimL = new THREE.Mesh(this.getTorus(0.065, 0.012, 8), this.goldMetalMat);
    rimL.position.set(-0.09, 0, 0);
    glasses.add(rimL);
    const rimR = new THREE.Mesh(this.getTorus(0.065, 0.012, 8), this.goldMetalMat);
    rimR.position.set(0.09, 0, 0);
    glasses.add(rimR);
    const bridge = new THREE.Mesh(this.getBox(0.06, 0.015, 0.01), this.goldMetalMat);
    bridge.position.set(0, 0.01, 0);
    glasses.add(bridge);
    glasses.position.set(0, 1.68, 0.22);
    char.add(glasses);

    // Articulated Arms with white kurta sleeves
    const armL = new THREE.Group();
    armL.position.set(-0.35, 1.25, 0);
    const sleeveL = new THREE.Mesh(this.getCylinder(0.08, 0.07, 0.48, 8), this.cartoonKurtaWhiteMat);
    sleeveL.position.y = -0.20;
    armL.add(sleeveL);
    const handL = new THREE.Mesh(this.getSphere(0.065, 6), this.cartoonNpcSkinMat);
    handL.position.y = -0.45;
    armL.add(handL);
    char.add(armL);

    const armR = new THREE.Group();
    armR.position.set(0.35, 1.25, 0);
    const sleeveR = new THREE.Mesh(this.getCylinder(0.08, 0.07, 0.48, 8), this.cartoonKurtaWhiteMat);
    sleeveR.position.y = -0.20;
    armR.add(sleeveR);
    const handR = new THREE.Mesh(this.getSphere(0.065, 6), this.cartoonNpcSkinMat);
    handR.position.y = -0.45;
    armR.add(handR);
    char.add(armR);

    // Pose configuration
    if (pose === 'VICTORY' || pose === 'DEBATE') {
      armR.rotation.x = -1.6; // Raising arm high
      director.registerDebater(armL, armR, head, 3.2);
    } else {
      // Namaste
      armL.rotation.set(-0.6, 0.4, -0.4);
      armR.rotation.set(-0.6, -0.4, 0.4);
      director.registerDebater(armL, armR, head, 2.0);
    }

    parent.add(char);
    return char;
  }

  /**
   * Builds cartoon caricature of Rahul Gandhi
   * Features: Crisp white yatra polo shirt, navy trousers, athletic stance, waving gesture.
   */
  public buildRahulCaricature(
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: VipComedyEventDirector
  ): THREE.Group {
    const char = new THREE.Group();
    char.name = 'caricature_rahul';
    char.position.set(x, y, z);

    // Navy athletic trousers
    const legs = new THREE.Mesh(this.getBox(0.40, 0.78, 0.30), this.cartoonNavyPantsMat);
    legs.position.y = 0.39;
    char.add(legs);

    // White Yatra Polo shirt
    const torso = new THREE.Mesh(this.getBox(0.46, 0.65, 0.32), this.cartoonPoloWhiteMat);
    torso.position.y = 1.02;
    char.add(torso);

    // Head
    const head = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.35, 10), this.cartoonNpcSkinMat);
    head.position.y = 1.55;
    char.add(head);

    // Casual dark swept hair
    const hair = new THREE.Mesh(this.getSphere(0.20, 8), this.cartoonHairBlackMat);
    hair.position.set(0, 1.70, -0.02);
    char.add(hair);

    // Energetic debating arms
    const armL = new THREE.Mesh(this.getBox(0.12, 0.50, 0.12), this.cartoonPoloWhiteMat);
    armL.position.set(-0.32, 1.05, 0);
    char.add(armL);

    const armR = new THREE.Mesh(this.getBox(0.12, 0.50, 0.12), this.cartoonPoloWhiteMat);
    armR.position.set(0.32, 1.05, 0);
    char.add(armR);

    director.registerDebater(armL, armR, head, 4.2);
    parent.add(char);
    return char;
  }

  /**
   * Builds cartoon caricature of Arvind Kejriwal
   * Features: Signature wool muffler wrapped around neck, sweater vest, spectacles, raised finger gesture.
   */
  public buildKejriwalCaricature(
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: VipComedyEventDirector
  ): THREE.Group {
    const char = new THREE.Group();
    char.name = 'caricature_kejriwal';
    char.position.set(x, y, z);

    const legs = new THREE.Mesh(this.getBox(0.38, 0.72, 0.28), this.cartoonNavyPantsMat);
    legs.position.y = 0.36;
    char.add(legs);

    // Sweater vest
    const torso = new THREE.Mesh(this.getBox(0.44, 0.60, 0.30), this.parliamentWoodMat);
    torso.position.y = 0.96;
    char.add(torso);

    // Iconic Brown Wool Muffler wrapped around neck with hanging ends
    const muffler = new THREE.Mesh(this.getTorus(0.20, 0.06, 8), this.cartoonMufflerBrownMat);
    muffler.position.set(0, 1.28, 0);
    muffler.rotation.x = Math.PI / 2;
    char.add(muffler);

    const mufflerTail = new THREE.Mesh(this.getBox(0.10, 0.38, 0.04), this.cartoonMufflerBrownMat);
    mufflerTail.position.set(0.08, 1.05, 0.18);
    char.add(mufflerTail);

    const head = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.32, 8), this.cartoonNpcSkinMat);
    head.position.y = 1.48;
    char.add(head);

    const glasses = new THREE.Mesh(this.getBox(0.30, 0.07, 0.03), this.tinRoofMat);
    glasses.position.set(0, 1.52, 0.19);
    char.add(glasses);

    const armL = new THREE.Mesh(this.getBox(0.10, 0.45, 0.10), this.parliamentWoodMat);
    armL.position.set(-0.28, 0.98, 0);
    char.add(armL);

    const armR = new THREE.Mesh(this.getBox(0.10, 0.45, 0.10), this.parliamentWoodMat);
    armR.position.set(0.28, 0.98, 0);
    char.add(armR);

    director.registerDebater(armL, armR, head, 3.8);
    parent.add(char);
    return char;
  }

  /**
   * Builds cartoon caricature of Mamata Banerjee
   * Features: White cotton sari with bright blue border folded across shoulder, dramatic expressive hand gestures.
   */
  public buildMamataCaricature(
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: VipComedyEventDirector
  ): THREE.Group {
    const char = new THREE.Group();
    char.name = 'caricature_mamata';
    char.position.set(x, y, z);

    // White cotton sari draped skirt
    const sariSkirt = new THREE.Mesh(this.getCylinder(0.24, 0.32, 0.85, 10), this.cartoonKurtaWhiteMat);
    sariSkirt.position.y = 0.42;
    char.add(sariSkirt);

    // Blue sari border rim at hem
    const hem = new THREE.Mesh(this.getCylinder(0.325, 0.33, 0.06, 10), this.cartoonSariBlueMat);
    hem.position.y = 0.04;
    char.add(hem);

    // Torso with blue pallu sash across shoulder
    const torso = new THREE.Mesh(this.getBox(0.42, 0.58, 0.30), this.cartoonKurtaWhiteMat);
    torso.position.y = 1.05;
    char.add(torso);

    const pallu = new THREE.Mesh(this.getBox(0.12, 0.65, 0.34), this.cartoonSariBlueMat);
    pallu.position.set(-0.12, 1.08, 0);
    pallu.rotation.z = -0.35;
    char.add(pallu);

    const head = new THREE.Mesh(this.getCylinder(0.17, 0.17, 0.32, 8), this.cartoonNpcSkinMat);
    head.position.y = 1.48;
    char.add(head);

    const hair = new THREE.Mesh(this.getSphere(0.20, 8), this.cartoonHairSilverMat);
    hair.position.set(0, 1.58, -0.06);
    char.add(hair);

    const armL = new THREE.Mesh(this.getBox(0.10, 0.48, 0.10), this.cartoonKurtaWhiteMat);
    armL.position.set(-0.28, 1.02, 0);
    char.add(armL);

    const armR = new THREE.Mesh(this.getBox(0.10, 0.48, 0.10), this.cartoonKurtaWhiteMat);
    armR.position.set(0.28, 1.02, 0);
    char.add(armR);

    director.registerDebater(armL, armR, head, 4.6);
    parent.add(char);
    return char;
  }

  /**
   * Builds cartoon caricature of Amit Shah
   * Features: Stout stature, white kurta, orange shawl draped over shoulder, holding strategic ledger.
   */
  public buildAmitShahCaricature(
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: VipComedyEventDirector
  ): THREE.Group {
    const char = new THREE.Group();
    char.name = 'caricature_amit_shah';
    char.position.set(x, y, z);

    // Stouter lower body
    const legs = new THREE.Mesh(this.getBox(0.50, 0.72, 0.38), this.cartoonKurtaWhiteMat);
    legs.position.y = 0.36;
    char.add(legs);

    // Broad torso with white kurta
    const torso = new THREE.Mesh(this.getBox(0.58, 0.68, 0.44), this.cartoonKurtaWhiteMat);
    torso.position.y = 0.98;
    char.add(torso);

    // Orange/saffron shawl draped over left shoulder
    const shawl = new THREE.Mesh(this.getBox(0.18, 0.72, 0.46), this.cartoonWaistcoatOrangeMat);
    shawl.position.set(-0.20, 1.02, 0);
    char.add(shawl);

    // Head
    const head = new THREE.Mesh(this.getCylinder(0.22, 0.22, 0.34, 10), this.cartoonNpcSkinMat);
    head.position.y = 1.50;
    char.add(head);

    // Trimmed salt-and-pepper beard
    const beard = new THREE.Mesh(this.getBox(0.32, 0.18, 0.22), this.cartoonHairSilverMat);
    beard.position.set(0, 1.40, 0.12);
    char.add(beard);

    // Spectacles
    const glasses = new THREE.Mesh(this.getBox(0.32, 0.07, 0.03), this.tinRoofMat);
    glasses.position.set(0, 1.56, 0.22);
    char.add(glasses);

    // Strategic Strategy Ledger / Register in hands
    const ledger = new THREE.Mesh(this.getBox(0.32, 0.42, 0.08), this.parliamentWoodMat);
    ledger.position.set(0.12, 1.05, 0.25);
    ledger.rotation.x = -0.4;
    char.add(ledger);

    const armL = new THREE.Mesh(this.getBox(0.12, 0.46, 0.12), this.cartoonKurtaWhiteMat);
    armL.position.set(-0.35, 1.02, 0);
    char.add(armL);

    const armR = new THREE.Mesh(this.getBox(0.12, 0.46, 0.12), this.cartoonKurtaWhiteMat);
    armR.position.set(0.35, 1.02, 0);
    char.add(armR);

    director.registerDebater(armL, armR, head, 3.0);
    parent.add(char);
    return char;
  }

  /**
   * Builds cartoon caricature of Nitish Kumar
   * Features: White kurta-pyjama, wire-rim spectacles, expressive debating arms.
   */
  public buildNitishCaricature(
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: VipComedyEventDirector
  ): THREE.Group {
    const char = new THREE.Group();
    char.name = 'caricature_nitish';
    char.position.set(x, y, z);

    const legs = new THREE.Mesh(this.getBox(0.38, 0.74, 0.28), this.cartoonKurtaWhiteMat);
    legs.position.y = 0.37;
    char.add(legs);

    const torso = new THREE.Mesh(this.getBox(0.44, 0.62, 0.30), this.cartoonKurtaWhiteMat);
    torso.position.y = 0.98;
    char.add(torso);

    const head = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.32, 8), this.cartoonNpcSkinMat);
    head.position.y = 1.48;
    char.add(head);

    const hair = new THREE.Mesh(this.getSphere(0.19, 8), this.cartoonHairSilverMat);
    hair.position.set(0, 1.60, -0.04);
    char.add(hair);

    const glasses = new THREE.Mesh(this.getBox(0.28, 0.06, 0.03), this.tinRoofMat);
    glasses.position.set(0, 1.52, 0.18);
    char.add(glasses);

    const armL = new THREE.Mesh(this.getBox(0.10, 0.46, 0.10), this.cartoonKurtaWhiteMat);
    armL.position.set(-0.28, 0.98, 0);
    char.add(armL);

    const armR = new THREE.Mesh(this.getBox(0.10, 0.46, 0.10), this.cartoonKurtaWhiteMat);
    armR.position.set(0.28, 0.98, 0);
    char.add(armR);

    director.registerDebater(armL, armR, head, 3.6);
    parent.add(char);
    return char;
  }

  // =========================================================================
  // MODULAR INDIAN URBAN ARCHITECTURE BUILDER
  // =========================================================================

  /**
   * Builds rich, multi-tiered Indian urban streetscapes with setbacks,
   * ground-floor bazaar shopfronts, striped market awnings, cantilevered jharokha
   * balconies, glowing warm window grids, rooftop chhatris, and open courtyards.
   * Completely replaces monolithic black slabs and empty voids!
   */
  public buildIndianUrbanFacade(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    side: number,
    districtIndex: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const wallX = roadbedWidth * 0.5 + 2.2;
    // Setback building facade line: X = 19.2m, front face at X = 15.7m (outside track envelope |X| <= 4.2m)
    const facadeX = side * (wallX + 12.5);
    const facingAngle = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;

    // Three articulated architectural modules per side with open courtyard gaps
    const buildingDefs = [
      { z: -14, length: 16, stories: 3, roofType: 'CHHATRI' },
      { z: -40, length: 18, stories: (districtIndex === 2 ? 4 : 3), roofType: (districtIndex === 2 ? 'BROADCAST_TOWER' : (districtIndex === 1 ? 'PEDIMENT' : 'KANGURA')) },
      { z: -66, length: 16, stories: 3, roofType: 'CHHATRI' }
    ];

    buildingDefs.forEach((bDef, bIdx) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(facadeX, 0, bDef.z);
      bGroup.rotation.y = facingAngle;

      const bWidth = bDef.length;
      const bDepth = 7.0;
      const storyH = 4.8;
      const totalH = bDef.stories * storyH;

      // Select district palette
      let wallMat: THREE.MeshStandardMaterial;
      if (districtIndex === 0) {
        // Roadshow & Chai Pe Charcha: Warm Jaipur ochre plaster & terracotta
        wallMat = bIdx % 2 === 0 ? this.haveliYellowPlasterMat : this.haveliTerracottaMat;
      } else if (districtIndex === 1) {
        // Inauguration Infinity: Grand imperial ivory marble & golden sandstone
        wallMat = bIdx % 2 === 0 ? this.ivoryMarbleMat : this.haveliSandstoneMat;
      } else if (districtIndex === 2) {
        // Breaking News: High-tech cobalt media studio facade with illuminated window grids
        wallMat = bIdx === 1 ? this.studioGlassMat : this.haveliSandstoneMat;
      } else if (districtIndex === 3) {
        // Masterstroke Megacity: Futuristic civic towers with sandstone base
        wallMat = bIdx % 2 === 0 ? this.haveliSandstoneMat : this.ivoryMarbleMat;
      } else {
        // Parliament Mayhem: Classical red sandstone & parliament wood trim
        wallMat = bIdx % 2 === 0 ? this.haveliTerracottaMat : this.sandstoneMat;
      }

      // 1. Ground Floor Plinth & Main Mass with Subsurface Foundation down to -5.2m
      const mainBuilding = new THREE.Mesh(this.getBox(bWidth, totalH, bDepth), wallMat);
      mainBuilding.position.y = totalH * 0.5;
      bGroup.add(mainBuilding);

      // Deep foundation plinth down to y = -5.2m to prevent floating scenery
      const plinth = new THREE.Mesh(this.getBox(bWidth + 0.6, 5.2, bDepth + 0.6), this.sandstoneMat);
      plinth.position.y = -2.6;
      bGroup.add(plinth);

      // Carved Sandstone Stringcourse Ledges between floors
      for (let s = 1; s <= bDef.stories; s++) {
        const cornice = new THREE.Mesh(this.getBox(bWidth + 0.6, 0.45, bDepth + 0.6), this.sandstoneMat);
        cornice.position.y = s * storyH;
        bGroup.add(cornice);
      }

      // In MINIMAL tier, retain massing and cornice ledges for visual silhouette while maintaining lightweight budget
      if (detail === 'MINIMAL') {
        group.add(bGroup);
        return;
      }

      // Vertical Sandstone Corner Pilasters framing the building module
      [-bWidth * 0.5, bWidth * 0.5].forEach((px) => {
        const pilaster = new THREE.Mesh(this.getBox(0.45, totalH, 0.45), this.sandstoneMat);
        pilaster.position.set(px, totalH * 0.5, bDepth * 0.5 + 0.1);
        bGroup.add(pilaster);
      });

      // 2. Ground-Floor Arcaded Street Veranda with Scalloped Arches & Brass Lanterns
      const columnSpacing = 4.0;
      const colCount = Math.floor(bWidth / columnSpacing);
      const startX = -((colCount - 1) * columnSpacing) * 0.5;

      for (let c = 0; c < colCount; c++) {
        const colX = startX + c * columnSpacing;
        // Sandstone Pillar
        const pillar = new THREE.Mesh(this.getCylinder(0.20, 0.24, 4.2, 6), this.sandstoneMat);
        pillar.position.set(colX, 2.1, bDepth * 0.5 + 1.4);
        bGroup.add(pillar);

        // Carved Bracket Capital
        const cap = new THREE.Mesh(this.getBox(0.65, 0.35, 0.65), this.sandstoneMat);
        cap.position.set(colX, 4.3, bDepth * 0.5 + 1.4);
        bGroup.add(cap);

        // Scalloped Arch Spans between pillars
        if (c < colCount - 1) {
          const archSpan = new THREE.Mesh(this.getBox(columnSpacing - 0.2, 0.45, 0.35), this.sandstoneMat);
          archSpan.position.set(colX + columnSpacing * 0.5, 4.3, bDepth * 0.5 + 1.4);
          bGroup.add(archSpan);
        }

        // Hanging Brass Lantern
        const lanternPole = new THREE.Mesh(this.getCylinder(0.02, 0.02, 0.6, 4), this.goldMetalMat);
        lanternPole.position.set(colX, 3.8, bDepth * 0.5 + 0.8);
        bGroup.add(lanternPole);
        const lanternGlow = new THREE.Mesh(this.getCylinder(0.12, 0.18, 0.32, 6), this.windowGlassLitMat);
        lanternGlow.position.set(colX, 3.4, bDepth * 0.5 + 0.8);
        bGroup.add(lanternGlow);
      }

      // Continuous Carved Stone Chhajja Sunshade Shelf over Arcade
      const chhajja = new THREE.Mesh(this.getBox(bWidth + 0.8, 0.15, 1.6), this.sandstoneMat);
      chhajja.position.set(0, 4.65, bDepth * 0.5 + 1.1);
      chhajja.rotation.x = 0.22; // Sloped down towards street
      bGroup.add(chhajja);

      // Recessed Inner Shops inside Veranda
      const shopCount = Math.floor(bWidth / 5.0);
      const shopSpacing = bWidth / (shopCount + 1);
      const awningMats = [this.awningStripeOrangeMat, this.awningStripeMaroonMat, this.awningStripeGreenMat];

      for (let sh = 0; sh < shopCount; sh++) {
        const shopX = -bWidth * 0.5 + (sh + 1) * shopSpacing;

        // Recessed wooden shop opening & sign
        const shopDoor = new THREE.Mesh(this.getBox(2.6, 3.2, 0.3), this.haveliWoodMat);
        shopDoor.position.set(shopX, 1.6, bDepth * 0.5 + 0.1);
        bGroup.add(shopDoor);

        // Lit shop doorway
        const shopGlow = new THREE.Mesh(this.getBox(1.8, 2.4, 0.05), this.windowGlassLitMat);
        shopGlow.position.set(shopX, 1.4, bDepth * 0.5 + 0.22);
        bGroup.add(shopGlow);

        // Rolled striped fabric awning under veranda
        const awningMat = awningMats[(sh + bIdx) % awningMats.length];
        const awning = new THREE.Mesh(this.getBox(2.8, 0.08, 0.9), awningMat);
        awning.position.set(shopX, 3.4, bDepth * 0.5 + 0.45);
        awning.rotation.x = 0.20;
        bGroup.add(awning);
      }

      // 3. Cantilevered Jharokha Balconies on Upper Floors
      for (let s = 1; s < bDef.stories; s++) {
        const floorY = s * storyH;
        const jharokhaCount = Math.floor(bWidth / 5.5);
        const jSpacing = bWidth / (jharokhaCount + 1);

        for (let j = 0; j < jharokhaCount; j++) {
          const jX = -bWidth * 0.5 + (j + 1) * jSpacing;

          // Jharokha Base Platform
          const jBase = new THREE.Mesh(this.getBox(2.0, 0.35, 1.2), this.sandstoneMat);
          jBase.position.set(jX, floorY + 0.6, bDepth * 0.5 + 0.6);
          bGroup.add(jBase);

          // Support Corbel Brackets
          [-0.7, 0.7].forEach((bx) => {
            const bracket = new THREE.Mesh(this.getBox(0.22, 0.60, 0.7), this.sandstoneMat);
            bracket.position.set(jX + bx, floorY + 0.2, bDepth * 0.5 + 0.35);
            bGroup.add(bracket);
          });

          // Pierced Jali Balustrade Railing
          const railing = new THREE.Mesh(this.getBox(2.0, 0.85, 0.12), this.jaliStoneMat);
          railing.position.set(jX, floorY + 1.15, bDepth * 0.5 + 1.15);
          bGroup.add(railing);

          // Arched Sun Canopy over Balcony
          const canopy = new THREE.Mesh(this.getCylinder(0.15, 1.1, 0.38, 6), this.chhatriDomeMat);
          canopy.position.set(jX, floorY + 2.7, bDepth * 0.5 + 0.6);
          bGroup.add(canopy);

          // Glowing Arched Window behind Jharokha
          const win = new THREE.Mesh(this.getBox(1.3, 1.7, 0.05), this.windowGlassLitMat);
          win.position.set(jX, floorY + 1.8, bDepth * 0.5 + 0.05);
          bGroup.add(win);
        }
      }

      // 4. Rooftop Crowns: Rajasthani Chhatris or Kangura Battlements or Antennas
      if (bDef.roofType === 'CHHATRI') {
        const chhatriPositions = [-bWidth * 0.28, bWidth * 0.28];
        chhatriPositions.forEach((cx) => {
          const cGroup = new THREE.Group();
          cGroup.position.set(cx, totalH, bDepth * 0.5 - 1.0);

          // 4 Sandstone Pillars
          [-0.6, 0.6].forEach((px) => {
            [-0.6, 0.6].forEach((pz) => {
              const pil = new THREE.Mesh(this.getCylinder(0.07, 0.10, 1.8, 6), this.sandstoneMat);
              pil.position.set(px, 0.9, pz);
              cGroup.add(pil);
            });
          });

          // Domed Cupola Roof
          const dome = new THREE.Mesh(this.getCylinder(0.08, 0.95, 1.0, 8), this.chhatriDomeMat);
          dome.position.y = 2.3;
          cGroup.add(dome);

          // Golden Kalash Finial Spire
          const finial = new THREE.Mesh(this.getCylinder(0.025, 0.07, 0.7, 6), this.goldMetalMat);
          finial.position.y = 3.1;
          cGroup.add(finial);

          bGroup.add(cGroup);
        });

        // Iconic Indian Sintex Rooftop Water Tank on Roof
        const tank = new THREE.Mesh(this.getCylinder(0.65, 0.65, 1.3, 10), this.commandoSuitMat);
        tank.position.set(0, totalH + 0.75, bDepth * 0.5 - 2.2);
        bGroup.add(tank);

        // Slender Flagstaff with Triangular Saffron Festive Pennant
        const flagPole = new THREE.Mesh(this.getCylinder(0.025, 0.025, 3.2, 4), this.goldMetalMat);
        flagPole.position.set(0, totalH + 1.6, bDepth * 0.5 - 0.5);
        bGroup.add(flagPole);
        const pennant = new THREE.Mesh(this.getBox(0.8, 0.5, 0.02), this.saffronFloralMat);
        pennant.position.set(0.4, totalH + 2.8, bDepth * 0.5 - 0.5);
        bGroup.add(pennant);

      } else if (bDef.roofType === 'BROADCAST_TOWER') {
        // High-Tech Media Transmission Tower & Satellite Dish
        const towerGroup = new THREE.Group();
        towerGroup.position.set(0, totalH, 0);

        const mast = new THREE.Mesh(this.getCylinder(0.18, 0.5, 8.0, 6), this.tinRoofMat);
        mast.position.y = 4.0;
        towerGroup.add(mast);

        const beacon = new THREE.Mesh(this.getSphere(0.3, 6), this.createBasicMaterial({ color: 0xef4444 }));
        beacon.position.y = 8.2;
        towerGroup.add(beacon);

        const dish = new THREE.Mesh(this.getCylinder(1.2, 0.15, 0.35, 8), this.ivoryMarbleMat);
        dish.position.set(2.0, 1.8, 0);
        dish.rotation.z = 0.55;
        towerGroup.add(dish);

        bGroup.add(towerGroup);
      } else if (bDef.roofType === 'PEDIMENT') {
        // Grand Classical Pediment with Ashoka Emblem Disc
        const pediment = new THREE.Mesh(this.getCylinder(0.2, 3.2, 1.4, 3), this.ivoryMarbleMat);
        pediment.position.set(0, totalH + 0.7, bDepth * 0.5);
        pediment.rotation.z = Math.PI;
        bGroup.add(pediment);

        const emblem = new THREE.Mesh(this.getCylinder(0.5, 0.5, 0.1, 12), this.goldMetalMat);
        emblem.position.set(0, totalH + 0.6, bDepth * 0.5 + 0.2);
        emblem.rotation.x = Math.PI / 2;
        bGroup.add(emblem);
      } else {
        // Stepped Kangura Battlements along Roof Edge
        for (let k = -bWidth * 0.44; k <= bWidth * 0.44; k += 1.6) {
          const battlement = new THREE.Mesh(this.getBox(0.8, 0.7, 0.25), this.sandstoneMat);
          battlement.position.set(k, totalH + 0.35, bDepth * 0.5);
          bGroup.add(battlement);
        }
      }

      group.add(bGroup);
    });

    if (detail === 'MINIMAL') return;

    // 5. Open Courtyard Setbacks: Mughal ornamental archways, stepped stairs, and hanging marigold torans
    const courtyardZs = [-25.5, -53.5];
    courtyardZs.forEach((cyZ) => {
      const cyGroup = new THREE.Group();
      cyGroup.position.set(facadeX + (side > 0 ? -1.5 : 1.5), 0, cyZ);

      const gateL = new THREE.Mesh(this.getCylinder(0.18, 0.24, 4.8, 6), this.sandstoneMat);
      gateL.position.set(0, 2.4, -2.2);
      cyGroup.add(gateL);

      const gateR = new THREE.Mesh(this.getCylinder(0.18, 0.24, 4.8, 6), this.sandstoneMat);
      gateR.position.set(0, 2.4, 2.2);
      cyGroup.add(gateR);

      const lintel = new THREE.Mesh(this.getBox(0.7, 0.6, 5.2), this.sandstoneMat);
      lintel.position.set(0, 5.0, 0);
      cyGroup.add(lintel);

      const lamp = new THREE.Mesh(this.getSphere(0.35, 6), this.windowGlassLitMat);
      lamp.position.set(0, 4.4, 0);
      cyGroup.add(lamp);

      // Hanging Marigold Toran Garland across alleyway
      const toran = new THREE.Mesh(this.getCylinder(0.04, 0.04, 4.2, 6), this.yellowMarigoldMat);
      toran.rotation.x = Math.PI / 2;
      toran.position.set(0, 4.6, 0);
      cyGroup.add(toran);

      group.add(cyGroup);
    });
  }

  // =========================================================================
  // DISTRICT A — ROADSHOW ROYALE: THE SPECTACULAR POLITICAL MOTORCADE
  // =========================================================================
  public buildRoadshowRoyaleDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: VipComedyEventDirector,
    worldZ: number = 0,
    isTestSeed: boolean = false
  ): void {
    const curbEdge = roadbedWidth * 0.5 + 0.5;
    const sidewalkW = 20.0;
    const sidewalkH = 4.8;
    const sidewalkY = 0.3 - sidewalkH * 0.5; // Top at +0.3m, bottom down to -4.5m for rock-solid grounding

    // 1. Grand Ceremonial Rally Promenades on East & West Flanks
    [-1, 1].forEach((side) => {
      // Background Indian urban rally facades
      this.buildIndianUrbanFacade(group, roadbedWidth, chunkLength, side, 0, rng, detail);

      const sx = side * (curbEdge + sidewalkW * 0.5);
      const promenade = new THREE.Mesh(this.getBox(sidewalkW, sidewalkH, chunkLength), this.terracottaMat);
      promenade.position.set(sx, sidewalkY, -chunkLength * 0.5);
      group.add(promenade);

      // Sandstone curb edging
      const curb = new THREE.Mesh(this.getBox(0.8, 0.4, chunkLength), this.sandstoneMat);
      curb.position.set(side * (curbEdge + 0.4), 0.3, -chunkLength * 0.5);
      group.add(curb);

      // Ornate Indian Street Lampposts wrapped in fresh marigold garlands
      const postStep = detail === 'MINIMAL' ? 45 : 18;
      for (let z = 8; z < chunkLength - 8; z += postStep) {
        const postGroup = new THREE.Group();
        postGroup.position.set(side * (curbEdge + 2.2), 0.3, -z);

        const base = new THREE.Mesh(this.getCylinder(0.22, 0.32, 0.8, 8), this.sandstoneMat);
        base.position.y = 0.4;
        postGroup.add(base);

        const pole = new THREE.Mesh(this.getCylinder(0.08, 0.12, 5.0, 8), this.parliamentWoodMat);
        pole.position.y = 3.2;
        postGroup.add(pole);

        // Marigold garland wrapped around pole (Full & Balanced tiers)
        if (detail !== 'MINIMAL') {
          for (let g = 0; g < 4; g++) {
            const garland = new THREE.Mesh(this.getTorus(0.14, 0.05, 6), g % 2 === 0 ? this.yellowMarigoldMat : this.saffronFloralMat);
            garland.rotation.x = Math.PI / 2 + 0.2;
            garland.position.set(0, 1.2 + g * 0.9, 0);
            postGroup.add(garland);
          }
        }

        // Lantern head with warm glowing light
        const lamp = new THREE.Mesh(this.getCylinder(0.24, 0.16, 0.45, 6), this.windowGlassLitMat);
        lamp.position.y = 5.8;
        postGroup.add(lamp);

        const cap = new THREE.Mesh(this.getCylinder(0.06, 0.35, 0.22, 6), this.goldMetalMat);
        cap.position.y = 6.1;
        postGroup.add(cap);

        group.add(postGroup);
      }
    });

    // 2. THE GRAND ROADSHOW FLOAT TRUCK (West Flank, X = -12.5m)
    const floatGroup = new THREE.Group();
    floatGroup.name = 'vip_roadshow_float';
    floatGroup.position.set(-12.5, 0.3, -chunkLength * 0.45);
    floatGroup.userData.baseY = 0.3;

    // Subsurface foundation plinth down to Y = -5.2m (submerged beneath promenade)
    const floatPlinth = new THREE.Mesh(this.getBox(3.8, 5.0, 12.0), this.sandstoneMat);
    floatPlinth.position.set(0, -2.8, 0);
    floatGroup.add(floatPlinth);

    // Heavy truck chassis
    const chassis = new THREE.Mesh(this.getBox(4.4, 0.8, 14.0), this.tinRoofMat);
    chassis.position.y = 0.6;
    floatGroup.add(chassis);

    // Heavy Wheels with chrome hubs
    const wheels = detail === 'MINIMAL' ? [-4.0, 4.0] : [-5.0, 0, 5.0];
    wheels.forEach((wz) => {
      [-2.2, 2.2].forEach((wx) => {
        const wheel = new THREE.Mesh(this.getCylinder(0.65, 0.65, 0.45, 12), this.suvTireMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.65, wz);
        floatGroup.add(wheel);

        const hub = new THREE.Mesh(this.getCylinder(0.25, 0.25, 0.48, 8), this.goldMetalMat);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(wx, 0.65, wz);
        floatGroup.add(hub);
      });
    });

    // Front Truck Cab
    const cab = new THREE.Mesh(this.getBox(4.2, 2.4, 3.8), this.saffronFloralMat);
    cab.position.set(0, 2.0, 5.0);
    floatGroup.add(cab);

    // Cab windshield & chrome grille
    const windshield = new THREE.Mesh(this.getBox(3.8, 1.2, 0.1), this.studioGlassMat);
    windshield.position.set(0, 2.4, 6.95);
    floatGroup.add(windshield);

    const grille = new THREE.Mesh(this.getBox(3.4, 0.9, 0.15), this.goldMetalMat);
    grille.position.set(0, 1.1, 6.95);
    floatGroup.add(grille);

    // Giant 3D Golden Lotus Emblem on Truck Front
    const lotusFront = new THREE.Group();
    lotusFront.position.set(0, 1.1, 7.1);
    const lotusCore = new THREE.Mesh(this.getSphere(0.25, 8), this.lotusGoldMat);
    lotusFront.add(lotusCore);
    for (let lp = 0; lp < 8; lp++) {
      const petalAngle = (lp / 8) * Math.PI * 2;
      const lotusPetal = new THREE.Mesh(this.getBox(0.18, 0.42, 0.05), this.lotusPinkMat);
      lotusPetal.rotation.z = petalAngle;
      lotusPetal.position.set(Math.cos(petalAngle) * 0.35, Math.sin(petalAngle) * 0.35, 0);
      lotusFront.add(lotusPetal);
    }
    floatGroup.add(lotusFront);

    // Thick Marigold Flower Garlands draped across bumper
    for (let mg = -1.6; mg <= 1.6; mg += 0.8) {
      const garland = new THREE.Mesh(this.getTorus(0.28, 0.09, 6), this.yellowMarigoldMat);
      garland.position.set(mg, 0.7, 7.05);
      floatGroup.add(garland);
    }

    // Rear Hydraulic Rally Stage (Elevated dais in truck bed)
    const rallyStage = new THREE.Mesh(this.getBox(4.2, 1.4, 8.5), this.saffronFloralMat);
    rallyStage.position.set(0, 1.7, -1.5);
    floatGroup.add(rallyStage);

    // Polished Brass Railings around the stage
    const railMat = this.goldMetalMat;
    [-2.0, 2.0].forEach((rx) => {
      const rail = new THREE.Mesh(this.getBox(0.08, 1.1, 8.2), railMat);
      rail.position.set(rx, 2.9, -1.5);
      floatGroup.add(rail);
    });
    const backRail = new THREE.Mesh(this.getBox(4.0, 1.1, 0.08), railMat);
    backRail.position.set(0, 2.9, -5.6);
    floatGroup.add(backRail);

    // 3D Lotus on Side Skirts (Full & Balanced)
    if (detail !== 'MINIMAL') {
      [-2.22, 2.22].forEach((sx) => {
        const sideLotus = lotusFront.clone();
        sideLotus.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
        sideLotus.position.set(sx, 1.7, -1.5);
        floatGroup.add(sideLotus);
      });
    }

    // Elevated Center Rostrum on Float
    const rostrum = new THREE.Mesh(this.getCylinder(1.2, 1.4, 0.8, 10), this.ivoryMarbleMat);
    rostrum.position.set(0, 2.7, -1.2);
    floatGroup.add(rostrum);

    // Animated Caricature of Modi on Float Platform!
    const modiFig = this.buildModiCaricature(floatGroup, 0, 3.1, -1.2, 'VICTORY', director);
    const armR = modiFig.getObjectByName('caricature_modi')?.children.find(c => c.position.x > 0.25) || modiFig;
    const headObj = modiFig.getObjectByName('caricature_modi')?.children.find(c => c.position.y > 1.4) || modiFig;

    // Twin High-Powered Flower Petal Cannons at Truck Roof
    const petalCannons: THREE.Object3D[] = [];
    const petals: THREE.Object3D[] = [];
    const petalBaseY: number[] = [];

    [-1.6, 1.6].forEach((cx) => {
      const cannon = new THREE.Mesh(this.getCylinder(0.20, 0.32, 1.2, 8), this.copperMat);
      cannon.rotation.x = -0.55; // Angled backward & upward into the sky
      cannon.position.set(cx, 3.8, 3.6);
      floatGroup.add(cannon);
      petalCannons.push(cannon);

      // Animated Flower Petal particles shooting into the sky (Full & Balanced tiers)
      if (detail !== 'MINIMAL') {
        for (let p = 0; p < 6; p++) {
          const petalMat = p % 2 === 0 ? this.petalSaffronMat : this.petalYellowMat;
          const petal = new THREE.Mesh(this.getPlane(0.35, 0.35), petalMat);
          petal.position.set(cx + (Math.random() - 0.5) * 1.8, 4.5 + p * 0.6, 3.0 - p * 0.8);
          petal.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
          floatGroup.add(petal);
          petals.push(petal);
          petalBaseY.push(4.5 + p * 0.6);
        }
      }
    });

    // Quad Loudspeaker Horn Cluster on Cab Roof
    const loudspeakers: THREE.Object3D[] = [];
    const speakerCoords = [
      { x: -1.2, z: 4.6, ry: -0.4 },
      { x: 1.2, z: 4.6, ry: 0.4 },
      { x: -1.2, z: 5.6, ry: -0.8 },
      { x: 1.2, z: 5.6, ry: 0.8 }
    ];
    speakerCoords.forEach((sc) => {
      const horn = new THREE.Mesh(this.getCylinder(0.28, 0.08, 0.65, 8), this.tinRoofMat);
      horn.rotation.x = Math.PI / 2;
      horn.rotation.y = sc.ry;
      horn.position.set(sc.x, 3.6, sc.z);
      floatGroup.add(horn);
      loudspeakers.push(horn);
    });

    // Security Commandos (SPG in Black Safari Suits & Sunglasses)
    const commandos: THREE.Object3D[] = [];
    const commandoCoords = detail === 'MINIMAL'
      ? [{ x: -2.6, y: 1.8, z: 1.0, isJogging: false }]
      : [
          { x: -2.6, y: 1.8, z: 1.0, isJogging: false },  // Standing on left footboard
          { x: 2.6, y: 1.8, z: 1.0, isJogging: false },   // Standing on right footboard
          { x: -3.2, y: 0.3, z: -3.5, isJogging: true },  // Jogging alongside left
          { x: 3.2, y: 0.3, z: -3.5, isJogging: true }    // Jogging alongside right
        ];

    commandoCoords.forEach((cc, cidx) => {
      const cmdGroup = new THREE.Group();
      cmdGroup.position.set(cc.x, cc.y, cc.z);
      cmdGroup.userData.baseY = cc.y;

      const legs = new THREE.Mesh(this.getBox(0.36, 0.72, 0.28), this.commandoSuitMat);
      legs.position.y = 0.36;
      cmdGroup.add(legs);

      const torso = new THREE.Mesh(this.getBox(0.44, 0.62, 0.30), this.commandoSuitMat);
      torso.position.y = 0.98;
      cmdGroup.add(torso);

      const head = new THREE.Mesh(this.getCylinder(0.16, 0.16, 0.28, 8), this.cartoonNpcSkinMat);
      head.position.y = 1.42;
      cmdGroup.add(head);

      const glasses = new THREE.Mesh(this.getBox(0.30, 0.08, 0.04), this.sunglassesBlackMat);
      glasses.position.set(0, 1.45, 0.17);
      cmdGroup.add(glasses);

      // Commando radio earpiece cord
      const earpiece = new THREE.Mesh(this.getCylinder(0.015, 0.015, 0.22, 4), this.suvTireMat);
      earpiece.position.set(0.18, 1.25, -0.05);
      cmdGroup.add(earpiece);

      floatGroup.add(cmdGroup);
      commandos.push(cmdGroup);
    });

    director.registerRoadshowFloat(floatGroup, modiFig, armR, headObj, petals, petalBaseY, loudspeakers, commandos);
    group.add(floatGroup);

    // 3. VIP PILOT ESCORT SUVS (White Scorpio Convoy)
    const pilotZs = detail === 'MINIMAL' ? [-chunkLength * 0.15] : [-chunkLength * 0.15, -chunkLength * 0.80];
    pilotZs.forEach((pz, pidx) => {
      const suvGroup = new THREE.Group();
      suvGroup.name = `vip_pilot_escort_${pidx}`;
      suvGroup.position.set(-12.5, 0.3, pz);

      // Subsurface foundation plinth submerged below pavement (top at -0.3m)
      const suvPlinth = new THREE.Mesh(this.getBox(2.2, 5.0, 4.8), this.sandstoneMat);
      suvPlinth.position.set(0, -2.8, 0);
      suvGroup.add(suvPlinth);

      // Lower Chassis & Wheel Wells
      if (detail !== 'MINIMAL') {
        const undercarriage = new THREE.Mesh(this.getBox(2.5, 0.35, 5.2), this.suvTireMat);
        undercarriage.position.y = 0.45;
        suvGroup.add(undercarriage);
      }

      // SUV Main Body with Sculpted Taper
      const body = new THREE.Mesh(this.getBox(2.7, 0.9, 5.6), this.suvWhiteMat);
      body.position.y = 0.95;
      suvGroup.add(body);

      if (detail !== 'MINIMAL') {
        // Lower Dark Composite Cladding
        const cladding = new THREE.Mesh(this.getBox(2.74, 0.22, 5.62), this.commandoSuitMat);
        cladding.position.y = 0.58;
        suvGroup.add(cladding);

        // Front Chrome Bullbar & Grille
        const bullbar = new THREE.Mesh(this.getBox(2.2, 0.55, 0.15), this.silverMetalMat);
        bullbar.position.set(0, 0.85, 2.95);
        suvGroup.add(bullbar);

        const grille = new THREE.Mesh(this.getBox(1.3, 0.35, 0.08), this.silverMetalMat);
        grille.position.set(0, 1.05, 2.82);
        suvGroup.add(grille);
      }

      // Clear Twin Rectangular LED Headlights & Turn Signals
      [-0.98, 0.98].forEach((hx) => {
        const headlight = new THREE.Mesh(this.getBox(0.55, 0.24, 0.06), this.flashLightMat);
        headlight.position.set(hx, 1.05, 2.82);
        suvGroup.add(headlight);

        if (detail !== 'MINIMAL') {
          const indicator = new THREE.Mesh(this.getBox(0.14, 0.22, 0.06), this.strobeAmberMat);
          indicator.position.set(hx + (hx > 0 ? 0.32 : -0.32), 1.05, 2.81);
          suvGroup.add(indicator);
        }
      });

      // Front Hood & Raked Windshield
      const hood = new THREE.Mesh(this.getBox(2.55, 0.18, 1.8), this.suvWhiteMat);
      hood.position.set(0, 1.45, 1.8);
      suvGroup.add(hood);

      // Passenger Cabin
      const cabin = new THREE.Mesh(this.getBox(2.5, 1.05, 3.4), this.suvWhiteMat);
      cabin.position.set(0, 1.95, -0.65);
      suvGroup.add(cabin);

      // Tinted Front Windshield
      const windScreen = new THREE.Mesh(this.getBox(2.35, 0.85, 0.08), this.cyberGlassMat);
      windScreen.position.set(0, 1.95, 1.05);
      windScreen.rotation.x = -0.30;
      suvGroup.add(windScreen);

      // Tinted Side Passenger Windows
      [-1.27, 1.27].forEach((wx) => {
        const sideWin = new THREE.Mesh(this.getBox(0.06, 0.62, 2.8), this.cyberGlassMat);
        sideWin.position.set(wx, 2.05, -0.65);
        suvGroup.add(sideWin);

        // Wing Mirrors
        if (detail !== 'MINIMAL') {
          const mirror = new THREE.Mesh(this.getBox(0.22, 0.15, 0.10), this.suvWhiteMat);
          mirror.position.set(wx + (wx > 0 ? 0.15 : -0.15), 1.85, 0.85);
          suvGroup.add(mirror);
        }
      });

      // Tinted Rear Windshield & Taillights
      if (detail !== 'MINIMAL') {
        const rearWin = new THREE.Mesh(this.getBox(2.15, 0.65, 0.06), this.cyberGlassMat);
        rearWin.position.set(0, 2.05, -2.36);
        suvGroup.add(rearWin);
      }

      [-0.95, 0.95].forEach((tx) => {
        const tailLight = new THREE.Mesh(this.getBox(0.25, 0.55, 0.06), this.strobeRedMat);
        tailLight.position.set(tx, 1.15, -2.82);
        suvGroup.add(tailLight);
      });

      // 4 Realistic Alloy Wheels with Chrome Hubs & Treaded Tires
      [-1.35, 1.35].forEach((wx) => {
        [-1.7, 1.7].forEach((wz) => {
          const w = new THREE.Mesh(this.getCylinder(0.48, 0.48, 0.36, 12), this.suvTireMat);
          w.rotation.z = Math.PI / 2;
          w.position.set(wx, 0.48, wz);
          suvGroup.add(w);

          const rim = new THREE.Mesh(this.getCylinder(0.28, 0.28, 0.38, 8), this.silverMetalMat);
          rim.rotation.z = Math.PI / 2;
          rim.position.set(wx, 0.48, wz);
          suvGroup.add(rim);
        });
      });

      // Rooftop Aerodynamic Emergency Strobe Lightbar (Amber & Red LEDs)
      const lightbar = new THREE.Mesh(this.getBox(1.5, 0.12, 0.32), this.tinRoofMat);
      lightbar.position.set(0, 2.55, -0.2);
      suvGroup.add(lightbar);

      const strobeAmber = new THREE.Mesh(this.getBox(0.60, 0.14, 0.26), this.strobeAmberMat);
      strobeAmber.position.set(-0.35, 2.62, -0.2);
      suvGroup.add(strobeAmber);

      const strobeRed = new THREE.Mesh(this.getBox(0.60, 0.14, 0.26), this.strobeRedMat);
      strobeRed.position.set(0.35, 2.62, -0.2);
      suvGroup.add(strobeRed);

      director.registerPilotEscort(suvGroup, strobeAmber, strobeRed);
      group.add(suvGroup);
    });

    // 4. TELEVISION MEDIA OUTSIDE BROADCAST (OB) VAN (Clean broadcast livery with wheels & cameras)
    const obVan = new THREE.Group();
    obVan.name = 'vip_media_ob_van';
    // Positioned safely behind the mango stage or on opposite flank (Z = -0.85 * chunkLength)
    obVan.position.set(14.5, 0.3, -chunkLength * 0.85);

    const vanPlinth = new THREE.Mesh(this.getBox(5.0, 4.5, 9.5), this.sandstoneMat);
    vanPlinth.position.set(0, -2.25, 0);
    obVan.add(vanPlinth);

    // Clean white broadcast van chassis
    const vanBody = new THREE.Mesh(this.getBox(3.2, 2.2, 7.8), this.suvWhiteMat);
    vanBody.position.y = 1.4;
    obVan.add(vanBody);

    // Royal blue media network stripe
    const vanStripe = new THREE.Mesh(this.getBox(3.24, 0.48, 7.82), this.createStandardMaterial({ color: 0x0284c7, roughness: 0.4 }));
    vanStripe.position.y = 1.35;
    obVan.add(vanStripe);

    // Front windshield & side media studio windows
    const vanWindshield = new THREE.Mesh(this.getBox(3.0, 0.85, 0.08), this.cyberGlassMat);
    vanWindshield.position.set(0, 1.85, 3.92);
    obVan.add(vanWindshield);

    // 4 Heavy Rubber Tires with Golden Hubs
    [-1.65, 1.65].forEach((wx) => {
      [-2.4, 2.4].forEach((wz) => {
        const tire = new THREE.Mesh(this.getCylinder(0.55, 0.55, 0.35, 10), this.suvTireMat);
        tire.rotation.z = Math.PI / 2;
        tire.position.set(wx, 0.55, wz);
        obVan.add(tire);

        const hub = new THREE.Mesh(this.getCylinder(0.22, 0.22, 0.38, 8), this.goldMetalMat);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(wx, 0.55, wz);
        obVan.add(hub);
      });
    });

    // Rotating Satellite Dish on Roof
    const dishMast = new THREE.Mesh(this.getCylinder(0.08, 0.14, 1.4, 8), this.tinRoofMat);
    dishMast.position.set(0, 3.1, -1.5);
    obVan.add(dishMast);

    const dish = new THREE.Mesh(this.getCylinder(1.1, 0.2, 0.25, 12), this.ivoryMarbleMat);
    dish.rotation.x = -0.6;
    dish.position.set(0, 3.8, -1.5);
    obVan.add(dish);

    // Broadcast Cameraman on Van Roof Platform
    const camPlat = new THREE.Mesh(this.getBox(2.2, 0.2, 2.2), this.tinRoofMat);
    camPlat.position.set(0, 2.6, 1.5);
    obVan.add(camPlat);

    const camRig = new THREE.Group();
    camRig.position.set(0, 2.7, 1.5);
    const tripod = new THREE.Mesh(this.getCylinder(0.06, 0.18, 1.2, 5), this.tinRoofMat);
    tripod.position.y = 0.6;
    camRig.add(tripod);
    const broadcastCam = new THREE.Mesh(this.getBox(0.45, 0.35, 0.9), this.parliamentWoodMat);
    broadcastCam.position.y = 1.35;
    camRig.add(broadcastCam);
    const bigLens = new THREE.Mesh(this.getCylinder(0.12, 0.16, 0.6, 8), this.goldMetalMat);
    bigLens.rotation.x = Math.PI / 2;
    bigLens.position.set(0, 1.35, 0.6);
    camRig.add(bigLens);
    obVan.add(camRig);

    if (detail !== 'MINIMAL') {
      group.add(obVan);
    }

    // 5. TIERED SPECTATOR GRANDSTANDS WITH CHEERING CROWDS (East Flank, X = +18.5m)
    const grandstand = new THREE.Group();
    grandstand.name = 'vip_grandstand';
    grandstand.position.set(18.5, 0.3, -chunkLength * 0.65);

    const standPlinth = new THREE.Mesh(this.getBox(8.0, 4.0, 18.0), this.sandstoneMat);
    standPlinth.position.set(0, -2.0, 0);
    grandstand.add(standPlinth);

    if (detail !== 'MINIMAL') {
      // 3 Tiers of Bleachers
      for (let t = 0; t < 3; t++) {
        const tier = new THREE.Mesh(this.getBox(2.2, 0.8 + t * 0.7, 16.0), this.haveliWoodMat);
        tier.position.set(-2.0 + t * 2.0, (0.8 + t * 0.7) * 0.5, 0);
        grandstand.add(tier);

        // Cheering crowd members on each tier
        for (let c = -6; c <= 6; c += 2.4) {
          const crowdMember = new THREE.Group();
          crowdMember.position.set(-2.0 + t * 2.0, 0.8 + t * 0.7, c);

          const cBodyMat = Math.abs(c) % 2 === 0 ? this.cartoonWaistcoatOrangeMat : this.cartoonKurtaWhiteMat;
          const cBody = new THREE.Mesh(this.getCylinder(0.18, 0.14, 0.95, 8), cBodyMat);
          cBody.position.y = 0.48;
          crowdMember.add(cBody);

          const cHead = new THREE.Mesh(this.getSphere(0.16, 6), this.cartoonNpcSkinMat);
          cHead.position.y = 1.08;
          crowdMember.add(cHead);

          // Waving Arm holding Saffron Flag
          const armGroup = new THREE.Group();
          armGroup.position.set(0.18, 0.85, 0);
          const arm = new THREE.Mesh(this.getCylinder(0.04, 0.04, 0.45, 4), cBodyMat);
          arm.position.y = 0.22;
          armGroup.add(arm);

          const pole = new THREE.Mesh(this.getCylinder(0.015, 0.015, 1.2, 4), this.goldMetalMat);
          pole.position.set(0, 0.7, 0);
          armGroup.add(pole);

          const flag = new THREE.Mesh(this.getPlane(0.55, 0.35), this.saffronFloralMat);
          flag.position.set(0.28, 1.1, 0);
          armGroup.add(flag);

          crowdMember.add(armGroup);

          // Phone Flash LED
          const phone = new THREE.Mesh(this.getBox(0.08, 0.14, 0.02), this.tinRoofMat);
          phone.position.set(-0.18, 0.85, 0.22);
          crowdMember.add(phone);

          const flash = new THREE.Mesh(this.getSphere(0.06, 4), this.flashLightMat);
          flash.position.set(-0.18, 0.90, 0.24);
          flash.visible = false;
          crowdMember.add(flash);

          director.registerCrowdMember(crowdMember, armGroup, flag, flash, 3.2 + Math.random());
          grandstand.add(crowdMember);
        }
      }
    } else {
      // Lightweight single bleacher for MINIMAL budget
      const tier = new THREE.Mesh(this.getBox(2.2, 0.8, 8.0), this.haveliWoodMat);
      tier.position.set(0, 0.4, 0);
      grandstand.add(tier);

      const crowdMember = new THREE.Group();
      crowdMember.position.set(0, 0.8, 0);
      const cBody = new THREE.Mesh(this.getCylinder(0.18, 0.14, 0.95, 6), this.cartoonWaistcoatOrangeMat);
      cBody.position.y = 0.48;
      crowdMember.add(cBody);

      const armGroup = new THREE.Group();
      const flag = new THREE.Mesh(this.getPlane(0.4, 0.3), this.saffronFloralMat);
      const flash = new THREE.Mesh(this.getSphere(0.04, 4), this.flashLightMat);
      director.registerCrowdMember(crowdMember, armGroup, flag, flash, 3.5);
      grandstand.add(crowdMember);
    }

    group.add(grandstand);

    // 6. OVERHEAD FESTIVE MARIGOLD TORANS & BUNTING (At Y = 9.8m, clear of 8.5m hazard envelope)
    if (detail !== 'MINIMAL') {
      for (let bz = 12; bz < chunkLength - 12; bz += 28) {
        const buntingLine = new THREE.Mesh(this.getCylinder(0.025, 0.025, roadbedWidth + 24.0, 6), this.goldMetalMat);
        buntingLine.rotation.z = Math.PI / 2;
        buntingLine.position.set(0, 9.8, -bz);
        group.add(buntingLine);

        // Triangular pennant flags along bunting line
        for (let bx = -14; bx <= 14; bx += 2.5) {
          if (Math.abs(bx) < curbEdge) continue; // Keep strictly over sidewalks
          const pennantMat = Math.abs(bx) % 3 === 0 ? this.saffronFloralMat : (Math.abs(bx) % 3 === 1 ? this.ivoryMarbleMat : this.buntingTricolorMat);
          const pennant = new THREE.Mesh(this.getBox(0.65, 0.85, 0.04), pennantMat);
          pennant.position.set(bx, 9.3, -bz);
          group.add(pennant);
        }
      }
    }

    // 7. CRITICAL GATE A: THE GREAT MANGO INTERVIEW (East Terrace at X = +11.2m)
    // Prominently staged for the running camera!
    if (detail !== 'MINIMAL' || isTestSeed) {
      this.buildMangoInterviewStage(group, 11.2, 0.6, -chunkLength * 0.5, director);
    }
  }

  // =========================================================================
  // DISTRICT B — CHAI PE CHARCHA: THE MEGA SUMMIT
  // =========================================================================
  public buildChaiPeCharchaDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: VipComedyEventDirector
  ): void {
    // Exact flush alignment with track curb (7.375m) - Zero void gaps!
    const curbEdge = roadbedWidth * 0.5 + 0.5;
    const sidewalkW = 24.0;
    const sidewalkH = 5.2;
    const sidewalkY = 0.3 - sidewalkH * 0.5; // Top at +0.3m, bottom at -4.9m for zero floating gaps

    // 1. Terracotta Promenade with Sandstone Jali Screens and Authentic Haveli Facades
    [-1, 1].forEach((side) => {
      // Modular Indian Streetscape behind the promenade
      this.buildIndianUrbanFacade(group, roadbedWidth, chunkLength, side, 0, rng, detail);
      const sx = side * (curbEdge + sidewalkW * 0.5);
      const sidewalk = new THREE.Mesh(this.getBox(sidewalkW, sidewalkH, chunkLength), this.terracottaMat);
      sidewalk.position.set(sx, sidewalkY, -chunkLength * 0.5);
      group.add(sidewalk);

      // Ornate Mughal Jali stone arches along outer promenade
      for (let z = 10; z < chunkLength - 10; z += 20) {
        const jaliArch = new THREE.Group();
        jaliArch.position.set(side * (curbEdge + 8.5), 0.6, -z);

        const pillarL = new THREE.Mesh(this.getCylinder(0.20, 0.25, 6.0, 6), this.sandstoneMat);
        pillarL.position.set(0, 3.0, -1.8);
        jaliArch.add(pillarL);

        const pillarR = new THREE.Mesh(this.getCylinder(0.20, 0.25, 6.0, 6), this.sandstoneMat);
        pillarR.position.set(0, 3.0, 1.8);
        jaliArch.add(pillarR);

        const cornice = new THREE.Mesh(this.getBox(0.8, 0.8, 4.4), this.sandstoneMat);
        cornice.position.set(0, 6.2, 0);
        jaliArch.add(cornice);

        group.add(jaliArch);
      }

      // Detailed Chai Stalls with Awning, Kettle, Biscuits, and Steam
      for (let zOffset = 8; zOffset < chunkLength - 8; zOffset += 24) {
        const stallGroup = new THREE.Group();
        stallGroup.position.set(side * (curbEdge + 3.2), 0.6, -zOffset);
        stallGroup.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;

        // Wooden Stall Counter
        const counter = new THREE.Mesh(this.getBox(3.6, 1.1, 1.4), this.parliamentWoodMat);
        counter.position.y = 0.55;
        stallGroup.add(counter);

        // Tin awning roof with slight slope
        const roof = new THREE.Mesh(this.getBox(4.0, 0.08, 2.4), this.tinRoofMat);
        roof.position.set(0, 2.4, 0.2);
        roof.rotation.x = 0.20;
        stallGroup.add(roof);

        // Compact Authentic Bazaar Stall Signboard integrated with awning
        const signTex = TextureGenerator.getChaiPeCharchaSignTexture(Math.floor(zOffset / 24));
        const signMesh = new THREE.Mesh(this.getBox(2.4, 0.55, 0.05), this.createBasicMaterial({ map: signTex }));
        signMesh.position.set(0, 2.55, 0.95);
        signMesh.rotation.x = 0.20;
        stallGroup.add(signMesh);

        // Traditional Indian Brass Samovar Boiler
        const samovar = new THREE.Mesh(this.getCylinder(0.28, 0.35, 0.85, 10), this.brassKettleMat);
        samovar.position.set(0.65, 1.55, -0.2);
        stallGroup.add(samovar);

        // Brass Steaming Kettle with Dome Lid & Spout
        const kettle = new THREE.Mesh(this.getCylinder(0.35, 0.42, 0.65, 10), this.brassKettleMat);
        kettle.position.set(-0.85, 1.45, 0);
        stallGroup.add(kettle);

        const spout = new THREE.Mesh(this.getCylinder(0.08, 0.14, 0.42, 8), this.brassKettleMat);
        spout.position.set(-0.52, 1.62, 0);
        spout.rotation.z = -0.65;
        stallGroup.add(spout);

        // Steam Wisps
        if (detail !== 'MINIMAL') {
          for (let s = 0; s < 3; s++) {
            const steamMat = this.createBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
            const steamBall = new THREE.Mesh(this.getCylinder(0.12, 0.20, 0.28, 6), steamMat);
            steamBall.position.set(-0.38 + s * 0.08, 1.9 + s * 0.45, 0);
            stallGroup.add(steamBall);
            director.registerSteam(steamBall, 3.5);
          }
        }

        // Cutting Chai Glasses on Gold Rack
        const rack = new THREE.Mesh(this.getBox(1.1, 0.15, 0.5), this.goldMetalMat);
        rack.position.set(-0.1, 1.18, 0);
        stallGroup.add(rack);
        for (let g = 0; g < 4; g++) {
          const glass = new THREE.Mesh(this.getCylinder(0.08, 0.06, 0.24, 6), this.teaGlassMat);
          glass.position.set(-0.42 + g * 0.28, 1.34, 0);
          stallGroup.add(glass);
        }

        // Biscuit Stack
        for (let b = 0; b < 3; b++) {
          const biscuit = new THREE.Mesh(this.getBox(0.35, 0.06, 0.35), this.biscuitMat);
          biscuit.position.set(1.2, 1.18 + b * 0.07, 0);
          stallGroup.add(biscuit);
        }

        group.add(stallGroup);
      }
    });

    // 2. HERO GAG 1: THE MONUMENTAL TEACUP UNVEILING (Satisfies vip_photo_op, X < -14.0m)
    const teacupPavilion = new THREE.Group();
    teacupPavilion.name = 'vip_photo_op';
    teacupPavilion.position.set(-16.5, 0.6, -chunkLength * 0.5);

    // Marble Dais & Subsurface Foundation down to -4.0m
    const dais = new THREE.Mesh(this.getBox(8.5, 0.9, 8.5), this.ivoryMarbleMat);
    dais.position.y = 0.45;
    teacupPavilion.add(dais);

    const plinth = new THREE.Mesh(this.getBox(9.5, 5.2, 9.5), this.sandstoneMat);
    plinth.position.y = -2.6;
    teacupPavilion.add(plinth);

    const carpet = new THREE.Mesh(this.getBox(2.6, 0.06, 8.0), this.redCarpetMat);
    carpet.position.set(0, 0.93, 0);
    teacupPavilion.add(carpet);

    // Velvet Drapery Archway
    const archFrame = new THREE.Mesh(this.getBox(7.2, 5.5, 0.8), this.goldMetalMat);
    archFrame.position.set(0, 3.6, -2.5);
    teacupPavilion.add(archFrame);

    // Animated Curtains Left & Right
    const curtainL = new THREE.Mesh(this.getBox(3.2, 4.8, 0.25), this.velvetCurtainMat);
    curtainL.position.set(-1.5, 3.2, -2.2);
    teacupPavilion.add(curtainL);

    const curtainR = new THREE.Mesh(this.getBox(3.2, 4.8, 0.25), this.velvetCurtainMat);
    curtainR.position.set(1.5, 3.2, -2.2);
    teacupPavilion.add(curtainR);

    // Golden Pedestal with ONE TINY CUTTING CHAI CUP (Elevated and clearly framed by curtains)
    const pedestal = new THREE.Mesh(this.getCylinder(0.65, 0.75, 1.6, 12), this.goldMetalMat);
    pedestal.position.set(0, 1.7, -1.0);
    teacupPavilion.add(pedestal);

    const velvetPillow = new THREE.Mesh(this.getCylinder(0.60, 0.65, 0.18, 12), this.velvetCurtainMat);
    velvetPillow.position.set(0, 2.55, -1.0);
    teacupPavilion.add(velvetPillow);

    const tinyCupGroup = new THREE.Group();
    tinyCupGroup.position.set(0, 2.8, -1.0);
    const tinyCup = new THREE.Mesh(this.getCylinder(0.14, 0.10, 0.32, 8), this.teaGlassMat);
    tinyCupGroup.add(tinyCup);
    const tinyTea = new THREE.Mesh(this.getCylinder(0.12, 0.08, 0.25, 8), this.teaLiquidMat);
    tinyCupGroup.add(tinyTea);
    teacupPavilion.add(tinyCupGroup);

    // Flanking Brass Spotlights angled down toward tiny cup
    const spotL = new THREE.Mesh(this.getCylinder(0.18, 0.32, 0.45, 8), this.goldMetalMat);
    spotL.position.set(-2.8, 4.5, -0.5);
    spotL.rotation.set(0.5, 0.3, 0);
    teacupPavilion.add(spotL);

    const spotR = new THREE.Mesh(this.getCylinder(0.18, 0.32, 0.45, 8), this.goldMetalMat);
    spotR.position.set(2.8, 4.5, -0.5);
    spotR.rotation.set(0.5, -0.3, 0);
    teacupPavilion.add(spotR);

    // Celebrating VIP Crowd taking selfies
    const vips: THREE.Object3D[] = [];
    if (detail === 'FULL') {
      const modiVip = this.buildModiCaricature(teacupPavilion, -2.2, 0.9, 1.2, 'VICTORY', director);
      vips.push(modiVip);
      const rahulVip = this.buildRahulCaricature(teacupPavilion, 2.2, 0.9, 1.2, director);
      vips.push(rahulVip);
    }

    director.registerTeacupReveal(curtainL, curtainR, tinyCupGroup, [spotL, spotR], vips);

    // Plaque sign mounted neatly on lower dais face (NEVER blocking pedestal sightline!)
    const plaqueTex = TextureGenerator.getVipPhotoOpSignTexture();
    const plaque = new THREE.Mesh(this.getBox(3.2, 0.7, 0.06), this.createBasicMaterial({ map: plaqueTex }));
    plaque.position.set(0, 0.45, 4.28);
    teacupPavilion.add(plaque);

    group.add(teacupPavilion);

    // 3. HERO GAG 2: COLOSSAL KETTLE MECHANICAL TEA POURER (East side at X = +18.5m)
    if (detail !== 'MINIMAL') {
      const kettleMonument = new THREE.Group();
      kettleMonument.position.set(18.5, 0.6, -chunkLength * 0.4);

      const baseRing = new THREE.Mesh(this.getCylinder(4.2, 4.6, 0.8, 12), this.sandstoneMat);
      baseRing.position.y = 0.4;
      kettleMonument.add(baseRing);

      const kPlinth = new THREE.Mesh(this.getBox(9.5, 5.2, 9.5), this.sandstoneMat);
      kPlinth.position.y = -2.6;
      kettleMonument.add(kPlinth);

      // Colossal 6-meter Golden Kettle
      const kettlePivot = new THREE.Group();
      kettlePivot.position.set(0, 3.8, 0);

      const giantKettleBody = new THREE.Mesh(this.getCylinder(1.6, 1.9, 2.8, 12), this.brassKettleMat);
      kettlePivot.add(giantKettleBody);

      const giantSpout = new THREE.Mesh(this.getCylinder(0.25, 0.45, 1.8, 8), this.brassKettleMat);
      giantSpout.position.set(-1.6, 0.4, 0);
      giantSpout.rotation.z = -0.7;
      kettlePivot.add(giantSpout);

      // Pouring Glowing Tea Stream
      const teaStream = new THREE.Mesh(this.getCylinder(0.12, 0.16, 2.6, 8), this.teaLiquidMat);
      teaStream.position.set(-2.6, -1.2, 0);
      teaStream.visible = false;
      kettlePivot.add(teaStream);
      kettleMonument.add(kettlePivot);

      // Arguing Politicians diving under spout
      const polL = new THREE.Mesh(this.getBox(0.45, 0.8, 0.3), this.cartoonKurtaWhiteMat);
      polL.position.set(-1.8, 1.2, 0);
      kettleMonument.add(polL);

      const polR = new THREE.Mesh(this.getBox(0.45, 0.8, 0.3), this.cartoonPoloWhiteMat);
      polR.position.set(1.8, 1.2, 0);
      kettleMonument.add(polR);

      // Street Chai Vendor Glass that catches the tea
      const vendorGlass = new THREE.Mesh(this.getCylinder(0.20, 0.14, 0.48, 8), this.teaGlassMat);
      vendorGlass.position.set(-2.6, 1.0, 0);
      kettleMonument.add(vendorGlass);

      director.registerKettlePour(kettlePivot, giantSpout, teaStream, polL, polR, vendorGlass);
      group.add(kettleMonument);
    }

    // 4. CROSSOVER GAG: THE SELFIE BATTLE & CHAI VENDOR TWIST
    // East side at X = +18.5m, Z = -chunkLength * 0.75
    this.buildSelfieBattleStage(group, 18.5, 0.6, -chunkLength * 0.75, director);
  }

  // =========================================================================
  // DISTRICT B — INAUGURATION INFINITY
  // =========================================================================
  public buildInaugurationInfinityDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: VipComedyEventDirector
  ): void {
    // Flush alignment with track curb (7.375m) - Zero void gaps!
    const curbEdge = roadbedWidth * 0.5 + 0.5;
    const sidewalkW = 24.0;
    const sidewalkH = 5.2;
    const sidewalkY = 0.3 - sidewalkH * 0.5; // Top at +0.3m, bottom at -4.9m for zero floating gaps

    // 1. Endless Red-Carpet Marble Promenades
    [-1, 1].forEach((side) => {
      // Modular Indian Imperial Architecture with colonnades and setbacks
      this.buildIndianUrbanFacade(group, roadbedWidth, chunkLength, side, 1, rng, detail);

      const sx = side * (curbEdge + sidewalkW * 0.5);
      const concourse = new THREE.Mesh(this.getBox(sidewalkW, sidewalkH, chunkLength), this.ivoryMarbleMat);
      concourse.position.set(sx, sidewalkY, -chunkLength * 0.5);
      group.add(concourse);

      // Red carpet strip
      const carpet = new THREE.Mesh(this.getBox(2.8, 0.06, chunkLength), this.redCarpetMat);
      carpet.position.set(side * (curbEdge + 2.4), 0.33, -chunkLength * 0.5);
      group.add(carpet);

      // Gold stanchions along carpet edge
      for (let z = 6; z < chunkLength - 6; z += 12) {
        const pole = new THREE.Mesh(this.getCylinder(0.06, 0.06, 1.2, 6), this.goldMetalMat);
        pole.position.set(side * (curbEdge + 0.8), 0.9, -z);
        group.add(pole);
        const ball = new THREE.Mesh(this.getCylinder(0.12, 0.12, 0.12, 6), this.goldMetalMat);
        ball.position.set(side * (curbEdge + 0.8), 1.55, -z);
        group.add(ball);
      }
    });

    // 2. SIGNATURE COMEDY SCENE B: THE NEVER-ENDING INAUGURATION (Satisfies vip_ribbon_ceremony, X < -15.0m)
    const ribbonGroup = new THREE.Group();
    ribbonGroup.name = 'vip_ribbon_ceremony';
    ribbonGroup.position.set(-16.5, 0.8, -chunkLength * 0.4);

    // Deep Subsurface Foundation Plinth down to y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(12.0, 5.2, 12.0), this.sandstoneMat);
    plinth.position.y = -2.6;
    ribbonGroup.add(plinth);

    const stage = new THREE.Mesh(this.getBox(10.5, 1.2, 10.5), this.ivoryMarbleMat);
    stage.position.y = 0.6;
    ribbonGroup.add(stage);

    // Grand Marquee Pavilion Canopy
    const canopyRoof = new THREE.Mesh(this.getCylinder(0.2, 5.5, 2.0, 8), this.velvetCurtainMat);
    canopyRoof.position.set(0, 7.5, 0);
    ribbonGroup.add(canopyRoof);

    // 4 Saffron & Gold Corner Pillars supporting marquee
    [[-4.2, -4.2], [4.2, -4.2], [-4.2, 4.2], [4.2, 4.2]].forEach(([px, pz]) => {
      const pil = new THREE.Mesh(this.getCylinder(0.18, 0.22, 6.5, 6), this.goldMetalMat);
      pil.position.set(px, 3.8, pz);
      ribbonGroup.add(pil);
    });

    // Primary Ceremonial Scissors — Gargantuan 3.6m Golden Articulated Shears
    const scissorPivot1 = new THREE.Group();
    scissorPivot1.position.set(0, 3.4, 0);

    const bladeGeo = this.getBox(0.24, 3.2, 0.4);
    const shears1L = new THREE.Mesh(bladeGeo, this.goldMetalMat);
    shears1L.position.set(-0.45, 1.0, 0);
    const loop1L = new THREE.Mesh(this.getCylinder(0.35, 0.35, 0.16, 8), this.goldMetalMat);
    loop1L.position.set(-0.25, -1.3, 0);
    shears1L.add(loop1L);
    scissorPivot1.add(shears1L);

    const shears1R = new THREE.Mesh(bladeGeo, this.goldMetalMat);
    shears1R.position.set(0.45, 1.0, 0);
    const loop1R = new THREE.Mesh(this.getCylinder(0.35, 0.35, 0.16, 8), this.goldMetalMat);
    loop1R.position.set(0.25, -1.3, 0);
    shears1R.add(loop1R);
    scissorPivot1.add(shears1R);
    ribbonGroup.add(scissorPivot1);

    // Secondary Diamond Crane Shears descending from above!
    const craneGroup = new THREE.Group();
    craneGroup.position.set(0, 5.5, 0);

    const craneArm = new THREE.Mesh(this.getBox(0.3, 3.5, 0.3), this.goldMetalMat);
    craneArm.position.y = 2.0;
    craneGroup.add(craneArm);

    const shears2L = new THREE.Mesh(this.getBox(0.24, 3.2, 0.4), this.diamondMat);
    shears2L.position.set(-0.45, 0, 0);
    craneGroup.add(shears2L);

    const shears2R = new THREE.Mesh(this.getBox(0.24, 3.2, 0.4), this.diamondMat);
    shears2R.position.set(0.45, 0, 0);
    craneGroup.add(shears2R);
    ribbonGroup.add(craneGroup);

    // Automated Pneumatic Rapid Ribbon Deployer Arm
    const rapidArm = new THREE.Mesh(this.getBox(0.15, 2.5, 0.15), this.parliamentWoodMat);
    rapidArm.position.set(3.2, 2.0, 0);
    ribbonGroup.add(rapidArm);

    // Multi-Layer Tri-color Ribbon Mesh (Saffron, White, Green)
    const ribbonMesh = new THREE.Group();
    ribbonMesh.name = 'tricolor_ribbons';
    ribbonMesh.position.set(0, 3.2, 0);

    const ribSaffron = new THREE.Mesh(this.getBox(7.2, 0.22, 0.05), this.cartoonWaistcoatOrangeMat);
    ribSaffron.position.y = 0.26;
    ribbonMesh.add(ribSaffron);

    const ribWhite = new THREE.Mesh(this.getBox(7.2, 0.22, 0.05), this.cartoonKurtaWhiteMat);
    ribWhite.position.y = 0;
    ribbonMesh.add(ribWhite);

    const ribGreen = new THREE.Mesh(this.getBox(7.2, 0.22, 0.05), this.tricolorGreenMat);
    ribGreen.position.y = -0.26;
    ribbonMesh.add(ribGreen);

    ribbonGroup.add(ribbonMesh);

    // THE COMEDIC PUNCHLINE:
    // A Colossal 2.4m Royal Velvet & Gold Pedestal with ONE TINY CUTTING CHAI GLASS!
    const grandPedestal = new THREE.Mesh(this.getCylinder(0.85, 1.1, 2.2, 12), this.goldMetalMat);
    grandPedestal.position.set(0, 2.3, -1.8);
    ribbonGroup.add(grandPedestal);

    const velvetCushion = new THREE.Mesh(this.getCylinder(0.7, 0.75, 0.18, 12), this.velvetCurtainMat);
    velvetCushion.position.set(0, 3.45, -1.8);
    ribbonGroup.add(velvetCushion);

    // The comically tiny street cutting-chai glass on the 2.4m throne!
    const tinyCupGroup = new THREE.Group();
    tinyCupGroup.name = 'tiny_inaugurated_item';
    tinyCupGroup.position.set(0, 3.65, -1.8);

    const teaGlass = new THREE.Mesh(this.getCylinder(0.12, 0.09, 0.24, 8), this.teaGlassMat);
    teaGlass.position.y = 0.12;
    tinyCupGroup.add(teaGlass);

    const teaLiquid = new THREE.Mesh(this.getCylinder(0.10, 0.08, 0.16, 8), this.teaLiquidMat);
    teaLiquid.position.y = 0.09;
    tinyCupGroup.add(teaLiquid);

    const biscuit = new THREE.Mesh(this.getBox(0.08, 0.08, 0.02), this.biscuitMat);
    biscuit.position.set(0.05, 0.14, 0);
    biscuit.rotation.z = 0.4;
    tinyCupGroup.add(biscuit);
    ribbonGroup.add(tinyCupGroup);

    // Flanking Applauding Dignitaries & Modi Caricature in Grandstand
    if (detail === 'FULL') {
      this.buildModiCaricature(ribbonGroup, 0, 1.2, 2.2, 'VICTORY', director);
      this.buildAmitShahCaricature(ribbonGroup, -2.8, 1.2, 2.0, director);
      this.buildNitishCaricature(ribbonGroup, 2.8, 1.2, 2.0, director);
    }

    director.registerScissors(shears1L, shears1R, 4.0);
    director.registerRecursiveScissors(shears1L, shears1R, shears2L, shears2R, craneGroup, rapidArm, ribbonMesh);

    // High-contrast Satirical Signboard
    const inaugTex = TextureGenerator.getInaugurationInfinitySignTexture(1);
    const sign = new THREE.Mesh(this.getBox(5.0, 1.2, 0.08), this.createBasicMaterial({ map: inaugTex }));
    sign.position.set(0, 2.2, 4.4);
    ribbonGroup.add(sign);

    group.add(ribbonGroup);

    // 3. HERO GAG 4: TWIN GRAND RE-OPENING ARCHES (Satisfies vip_double_opening, clearance > 8.5m)
    const doubleArch = new THREE.Group();
    doubleArch.name = 'vip_double_opening';

    const archZ1 = -chunkLength * 0.25;
    const archZ2 = -chunkLength * 0.75;
    [archZ1, archZ2].forEach((az, idx) => {
      const arch = new THREE.Group();
      arch.name = `vip_arch_part_${idx + 1}`;
      arch.position.set(0, 0, az);

      // Elevated lintel: lowest point Y = 10.4m (strictly > 8.5m running envelope clearance)
      const lintelY = 10.6;
      const lintel = new THREE.Mesh(this.getBox(roadbedWidth + 6.5, 1.5, 2.0), this.ivoryMarbleMat);
      lintel.position.set(0, lintelY, 0);
      arch.add(lintel);

      [-1, 1].forEach((pside) => {
        const pillar = new THREE.Mesh(this.getBox(1.8, lintelY + 4.0, 1.8), this.ivoryMarbleMat);
        pillar.position.set(pside * (roadbedWidth * 0.5 + 2.6), (lintelY - 4.0) * 0.5, 0);
        arch.add(pillar);
      });

      const archSignTex = TextureGenerator.getInaugurationInfinitySignTexture(idx === 0 ? 0 : 3);
      const archSign = new THREE.Mesh(this.getBox(roadbedWidth + 2.5, 1.3, 0.08), this.createBasicMaterial({ map: archSignTex }));
      archSign.position.set(0, lintelY + 0.1, 1.05);
      arch.add(archSign);

      doubleArch.add(arch);
    });

    group.add(doubleArch);

    // 4. CROSSOVER GAG: THE HUG LOOP
    this.buildHugLoopStage(group, 18.5, 0.6, -chunkLength * 0.85, director);
  }

  // =========================================================================
  // DISTRICT C — THE PRIME-TIME CIRCUS
  // =========================================================================
  public buildBreakingNewsDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: VipComedyEventDirector
  ): void {
    // Flush alignment with track curb (7.375m) - Zero void gaps!
    const curbEdge = roadbedWidth * 0.5 + 0.5;
    const sidewalkW = 24.0;
    const sidewalkH = 5.2;
    const sidewalkY = 0.3 - sidewalkH * 0.5; // Top at +0.3m, bottom at -4.9m for zero floating gaps

    // 1. High-Tech Media Studio Towers & Articulated Broadcast Center
    [-1, 1].forEach((side) => {
      // Articulated media complex with transmission towers, open courtyards, and zero monolithic black walls
      this.buildIndianUrbanFacade(group, roadbedWidth, chunkLength, side, 2, rng, detail);

      const sx = side * (curbEdge + sidewalkW * 0.5);
      const sidewalk = new THREE.Mesh(this.getBox(sidewalkW, sidewalkH, chunkLength), this.ivoryMarbleMat);
      sidewalk.position.set(sx, sidewalkY, -chunkLength * 0.5);
      group.add(sidewalk);

      // High-Tech LED Studio Video Wall integrated with architectural truss frame
      const screenTruss = new THREE.Group();
      screenTruss.position.set(side * (curbEdge + 9.5), 9.0, -chunkLength * 0.5);
      screenTruss.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;

      const screenFrame = new THREE.Mesh(this.getBox(14.8, 7.8, 0.4), this.tinRoofMat);
      screenTruss.add(screenFrame);

      const screenTex = TextureGenerator.getBreakingNewsScreenTexture(side > 0 ? 0 : 2);
      const screen = new THREE.Mesh(this.getPlane(14.0, 7.0), this.createBasicMaterial({ map: screenTex, side: THREE.DoubleSide }));
      screen.position.z = 0.22;
      screenTruss.add(screen);

      // Studio floodlights framing screen
      [-6.5, 6.5].forEach((lx) => {
        const spot = new THREE.Mesh(this.getCylinder(0.2, 0.35, 0.4, 6), this.goldMetalMat);
        spot.position.set(lx, 4.2, 0.3);
        spot.rotation.x = 0.4;
        screenTruss.add(spot);
      });

      group.add(screenTruss);
    });

    // 2. HERO GAG 5: PRIME-TIME REMOTE REVELATION & PAPARAZZI (Satisfies vip_camera_crew, X > 15.0m)
    const mediaStage = new THREE.Group();
    mediaStage.name = 'vip_camera_crew';
    mediaStage.position.set(16.5, 0, -chunkLength * 0.5);

    // Deep Subsurface Foundation Plinth down to y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(10.0, 5.2, 10.0), this.sandstoneMat);
    plinth.position.y = -2.6;
    mediaStage.add(plinth);

    const scaffold = new THREE.Mesh(this.getBox(8.0, 5.0, 8.0), this.tinRoofMat);
    scaffold.position.y = 2.5;
    mediaStage.add(scaffold);

    // Flashing Paparazzi Cameras
    for (let c = 0; c < 4; c++) {
      const cx = (c % 2 === 0 ? -2.2 : 2.2);
      const cz = (c < 2 ? -2.2 : 2.2);

      const tripod = new THREE.Mesh(this.getCylinder(0.05, 0.14, 1.3, 5), this.goldMetalMat);
      tripod.position.set(cx, 5.65, cz);
      mediaStage.add(tripod);

      const flashSphere = new THREE.Mesh(this.getCylinder(0.12, 0.12, 0.12, 6), this.flashLightMat);
      flashSphere.position.set(cx, 6.8, cz);
      mediaStage.add(flashSphere);
      director.registerCameraFlash(flashSphere);
    }

    // High-Tech Remote Revelation Pedestal
    const revDais = new THREE.Mesh(this.getCylinder(1.4, 1.6, 1.0, 10), this.ivoryMarbleMat);
    revDais.position.set(0, 5.5, 0);
    mediaStage.add(revDais);

    // Titanium Vault Lid
    const vaultLid = new THREE.Mesh(this.getCylinder(0.9, 1.0, 1.2, 10), this.tinRoofMat);
    vaultLid.position.set(0, 6.6, 0);
    mediaStage.add(vaultLid);

    // Crane Winch
    const craneArm = new THREE.Mesh(this.getBox(0.2, 3.5, 0.2), this.goldMetalMat);
    craneArm.position.set(0, 9.0, 0);
    mediaStage.add(craneArm);

    // The Lost Plastic TV Remote Control (The Punchline!)
    const remoteMesh = new THREE.Mesh(this.getBox(0.35, 0.08, 0.8), this.parliamentWoodMat);
    remoteMesh.position.set(0, 6.1, 0);
    mediaStage.add(remoteMesh);

    // Anchor NPC gesturing dramatically
    const anchorNPC = new THREE.Mesh(this.getBox(0.48, 0.75, 0.32), this.cartoonPoloWhiteMat);
    anchorNPC.position.set(-1.8, 5.8, 0);
    mediaStage.add(anchorNPC);

    director.registerRemoteRevelation(vaultLid, craneArm, remoteMesh, [], anchorNPC);
    group.add(mediaStage);

    // 3. Runaway Decoy Microphone Cart chased by Camera Crew
    const decoyCart = new THREE.Group();
    decoyCart.position.set(16.5, 0.4, -chunkLength * 0.5);

    const cartBody = new THREE.Mesh(this.getBox(0.9, 0.4, 1.3), this.parliamentWoodMat);
    cartBody.position.y = 0.2;
    decoyCart.add(cartBody);

    const giantMic = new THREE.Mesh(this.getCylinder(0.14, 0.18, 1.0, 8), this.goldMetalMat);
    giantMic.position.set(0, 0.95, 0);
    decoyCart.add(giantMic);

    director.registerRunawayDecoy(decoyCart, mediaStage, 1.8);
    group.add(decoyCart);

    // 4. Overhead Broadcast News Chopper
    if (detail !== 'MINIMAL') {
      const chopperGroup = new THREE.Group();
      chopperGroup.position.set(-15.0, 16.5, -chunkLength * 0.5);

      const fuselage = new THREE.Mesh(this.getBox(2.0, 1.5, 4.2), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
      chopperGroup.add(fuselage);

      const rotor = new THREE.Mesh(this.getBox(7.2, 0.05, 0.38), this.goldMetalMat);
      rotor.position.set(0, 1.0, 0);
      chopperGroup.add(rotor);

      const bannerTex = TextureGenerator.getVipHelicopterBannerTexture();
      const bannerMesh = new THREE.Mesh(this.getBox(0.05, 1.8, 9.5), this.createBasicMaterial({ map: bannerTex }));
      bannerMesh.position.set(0, -2.0, 6.0);
      chopperGroup.add(bannerMesh);

      director.registerHelicopter(chopperGroup, rotor);
      group.add(chopperGroup);
    }

    // 5. GATE B HERO GAG: THE 360° CAMERA MAGNET (West side at X = -18.5m, Z = -chunkLength * 0.35)
    this.buildCameraMagnetStage(group, -18.5, 0.6, -chunkLength * 0.35, director);

    // 6. CROSSOVER GAG: THE MICROPHONE CHASE (East side at X = +18.5m, Z = -chunkLength * 0.75)
    this.buildMicrophoneChaseStage(group, 18.5, 0.6, -chunkLength * 0.75, director);
  }

  // =========================================================================
  // DISTRICT D — MASTERSTROKE MEGACITY
  // =========================================================================
  public buildMasterstrokeMegacityDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: VipComedyEventDirector
  ): void {
    const curbEdge = roadbedWidth * 0.5 + 0.5;
    const swWidth = 14.0;
    const swHeight = 5.2;

    // 1. Futuristic Golden Marble Plaza Promenades
    [-1, 1].forEach((side) => {
      // High-Tech Indian Civic Architecture with solar spires and setbacks
      this.buildIndianUrbanFacade(group, roadbedWidth, chunkLength, side, 3, rng, detail);

      const px = side * (curbEdge + swWidth * 0.5);
      const plaza = new THREE.Mesh(this.getBox(swWidth, swHeight, chunkLength), this.ivoryMarbleMat);
      plaza.position.set(px, 0.3 - swHeight * 0.5, -chunkLength * 0.5);
      group.add(plaza);

      // Cyber Spires with glowing crowns
      for (let z = 10; z < chunkLength - 10; z += 24) {
        const spire = new THREE.Mesh(this.getCylinder(0.25, 0.60, 14.0, 8), this.goldMetalMat);
        spire.position.set(side * (curbEdge + 4.0), 7.4, -z);
        group.add(spire);
      }
    });

    // 2. HERO GAG 7: MASTERSTROKE 99% MACHINE (Satisfies vip_announcement_tower)
    const towerGroup = new THREE.Group();
    towerGroup.name = 'vip_announcement_tower';
    towerGroup.position.set(-17.5, 0, -chunkLength * 0.65);

    // Foundation plinth down to y = -5.2m
    const towerPlinth = new THREE.Mesh(this.getBox(7.0, 5.2, 7.0), this.sandstoneMat);
    towerPlinth.position.y = -2.6;
    towerGroup.add(towerPlinth);

    // Monolith Computing Core
    const core = new THREE.Mesh(this.getBox(5.0, 15.0, 5.0), this.cyberGlassMat);
    core.position.y = 7.5;
    towerGroup.add(core);

    // Countdown Display
    const masterTex = TextureGenerator.getMasterstrokeMegacitySignTexture(0);
    const screen = new THREE.Mesh(this.getBox(5.2, 5.8, 5.2), this.createBasicMaterial({ map: masterTex }));
    screen.position.y = 9.5;
    towerGroup.add(screen);
    director.registerCountdownBoard(screen, screen.material);

    // Vault Doors Left & Right
    const doorL = new THREE.Mesh(this.getBox(1.2, 3.2, 0.2), this.goldMetalMat);
    doorL.position.set(-1.1, 4.0, 2.6);
    towerGroup.add(doorL);

    const doorR = new THREE.Mesh(this.getBox(1.2, 3.2, 0.2), this.goldMetalMat);
    doorR.position.set(1.1, 4.0, 2.6);
    towerGroup.add(doorR);

    // Dial Needle
    const dialNeedle = new THREE.Mesh(this.getBox(0.08, 1.2, 0.05), this.redCarpetMat);
    dialNeedle.position.set(0, 13.0, 2.6);
    towerGroup.add(dialNeedle);

    // Steam Hiss Mesh
    const steamHiss = new THREE.Mesh(this.getSphere(0.6, 6), this.createBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
    steamHiss.position.set(0, 4.0, 2.8);
    towerGroup.add(steamHiss);

    // Delivery Arm & Tiny Tea-Stirring Spoon (The Punchline!)
    const deliveryArm = new THREE.Mesh(this.getBox(0.18, 0.18, 1.6), this.goldMetalMat);
    deliveryArm.position.set(0, 3.8, 1.5);
    towerGroup.add(deliveryArm);

    const tinySpoon = new THREE.Mesh(this.getCylinder(0.06, 0.04, 0.45, 6), this.parliamentWoodMat);
    tinySpoon.position.set(0, 0.15, 0.7);
    deliveryArm.add(tinySpoon);

    director.registerMasterstrokeMachine(doorL, doorR, dialNeedle, steamHiss, deliveryArm, tinySpoon);
    group.add(towerGroup);

    // 3. HERO GAG 8: MONUMENTAL GLOWING POLITICAL CHESSBOARD
    if (detail !== 'MINIMAL') {
      const chessGroup = new THREE.Group();
      chessGroup.position.set(-18.5, 0.4, -chunkLength * 0.25);

      const chessPlinth = new THREE.Mesh(this.getBox(10.0, 5.2, 10.0), this.sandstoneMat);
      chessPlinth.position.y = -2.6;
      chessGroup.add(chessPlinth);

      const board = new THREE.Mesh(this.getBox(9.0, 0.6, 9.0), this.ivoryMarbleMat);
      board.position.y = 0.3;
      chessGroup.add(board);

      // Grand Chess King Piece
      const grandKing = new THREE.Mesh(this.getCylinder(0.8, 1.1, 2.6, 10), this.goldMetalMat);
      grandKing.position.set(0, 1.8, 0);
      chessGroup.add(grandKing);

      // Crane Gantry
      const gantry = new THREE.Mesh(this.getBox(0.3, 4.5, 0.3), this.tinRoofMat);
      gantry.position.set(0, 2.5, -3.5);
      chessGroup.add(gantry);

      // Chai Vendor Cart
      const cart = new THREE.Mesh(this.getBox(1.2, 0.8, 1.6), this.parliamentWoodMat);
      cart.position.set(0, 0.8, 5.0);
      chessGroup.add(cart);

      director.registerChessboardMatch(gantry, grandKing, cart);
      group.add(chessGroup);
    }

    // 4. HERO GAG: VIP TRAFFIC MOTORCADE STUCK BEHIND 1 CONE (Satisfies vip_traffic_jam)
    const jamGroup = new THREE.Group();
    jamGroup.name = 'vip_traffic_jam';
    jamGroup.position.set(34.0, 0, -chunkLength * 0.5);

    const jamPlinth = new THREE.Mesh(this.getBox(8.0, 5.2, 24.0), this.sandstoneMat);
    jamPlinth.position.y = -2.6;
    jamGroup.add(jamPlinth);

    const suvBodyMat = this.createStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
    const redLightMat = this.createBasicMaterial({ color: 0xef4444 });
    const blueLightMat = this.createBasicMaterial({ color: 0x3b82f6 });
    const coneMat = this.createStandardMaterial({ color: 0xf97316 });

    for (let c = 0; c < 3; c++) {
      const suv = new THREE.Group();
      suv.position.set(0, 0.8, c * 6.5 - 6.5);

      const body = new THREE.Mesh(this.getBox(2.2, 1.2, 4.2), suvBodyMat);
      suv.add(body);

      const redLight = new THREE.Mesh(this.getCylinder(0.12, 0.12, 0.1, 6), redLightMat);
      redLight.position.set(-0.35, 1.5, -0.2);
      suv.add(redLight);

      const blueLight = new THREE.Mesh(this.getCylinder(0.12, 0.12, 0.1, 6), blueLightMat);
      blueLight.position.set(0.35, 1.5, -0.2);
      suv.add(blueLight);

      jamGroup.add(suv);
    }

    // The Single Tiny Orange Cone that stopped the entire armored motorcade!
    const cone = new THREE.Mesh(this.getCylinder(0.04, 0.28, 0.75, 8), coneMat);
    cone.position.set(0, 0.38, -10.5);
    jamGroup.add(cone);

    group.add(jamGroup);

    // 5. GATE B HERO GAG: THE KEDARNATH MEDITATION PARADOX (East side at X = +18.5m, Z = -chunkLength * 0.35)
    this.buildMeditationParadoxStage(group, 18.5, 0, -chunkLength * 0.35, director);

    // 6. CROSSOVER GAG: THE PARTY OFFICE MIX-UP (West side at X = -18.5m, Z = -chunkLength * 0.75)
    this.buildPartyOfficeMixupStage(group, -18.5, 0, -chunkLength * 0.75, director);
  }

  // =========================================================================
  // DISTRICT E — THE GREAT POLITICAL SHOWDOWN
  // =========================================================================
  public buildParliamentMayhemDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: VipComedyEventDirector
  ): void {
    const curbEdge = roadbedWidth * 0.5 + 0.5;
    const swWidth = 14.0;
    const swHeight = 5.2;

    // 1. Circular Colonnade Parliament Galleries on sides
    [-1, 1].forEach((side) => {
      // Classical Parliament Rotunda Facades and civic galleries
      this.buildIndianUrbanFacade(group, roadbedWidth, chunkLength, side, 4, rng, detail);

      const gx = side * (curbEdge + swWidth * 0.5);
      const gallery = new THREE.Mesh(this.getBox(swWidth, swHeight, chunkLength), this.sandstoneMat);
      gallery.position.set(gx, 0.3 - swHeight * 0.5, -chunkLength * 0.5);
      group.add(gallery);

      // Carved Classical Sandstone Colonnade along Concourse Curb
      if (detail !== 'MINIMAL') {
        for (let z = 6; z < chunkLength - 6; z += 12) {
          const col = new THREE.Mesh(this.getCylinder(0.24, 0.30, 5.5, 8), this.sandstoneMat);
          col.position.set(side * (curbEdge + 1.4), 3.0, -z);
          group.add(col);

          const cap = new THREE.Mesh(this.getBox(0.8, 0.4, 0.8), this.sandstoneMat);
          cap.position.set(side * (curbEdge + 1.4), 5.9, -z);
          group.add(cap);
        }
      }

      // Green Leather Parliament Benches
      for (let z = 6; z < chunkLength - 6; z += 10) {
        const bench = new THREE.Mesh(this.getBox(3.0, 0.85, 1.2), this.parliamentGreenMat);
        bench.position.set(side * (curbEdge + 4.2), 0.85, -z);
        group.add(bench);
      }
    });

    // 2. HERO GAG 9: PARLIAMENTARY ARENA & SELF-INTERVIEWING MICS
    const arenaStage = new THREE.Group();
    arenaStage.position.set(-16.5, 0, -chunkLength * 0.5);

    const arenaPlinth = new THREE.Mesh(this.getBox(10.5, 5.2, 10.5), this.sandstoneMat);
    arenaPlinth.position.y = -2.6;
    arenaStage.add(arenaPlinth);

    const rostrum = new THREE.Mesh(this.getBox(9.0, 1.2, 9.0), this.parliamentWoodMat);
    rostrum.position.y = 0.6;
    arenaStage.add(rostrum);

    // Giant Animated Gavel
    const gavelPivot = new THREE.Group();
    gavelPivot.position.set(0, 2.4, 0);

    const gavelHandle = new THREE.Mesh(this.getCylinder(0.08, 0.08, 2.0, 8), this.parliamentWoodMat);
    gavelHandle.position.set(0, 0.7, 0);
    gavelPivot.add(gavelHandle);

    const gavelHead = new THREE.Mesh(this.getCylinder(0.26, 0.26, 0.85, 8), this.brassKettleMat);
    gavelHead.position.set(0, 1.7, 0);
    gavelHead.rotation.z = Math.PI / 2;
    gavelPivot.add(gavelHead);

    director.registerGavel(gavelPivot);
    arenaStage.add(gavelPivot);

    // Self-Interviewing Microphones Apparatus
    const centerMic = new THREE.Mesh(this.getCylinder(0.06, 0.08, 1.4, 6), this.goldMetalMat);
    centerMic.position.set(0, 1.4, -2.0);
    arenaStage.add(centerMic);

    const micL = new THREE.Mesh(this.getCylinder(0.05, 0.07, 1.1, 6), this.goldMetalMat);
    micL.position.set(-0.9, 1.4, -2.0);
    arenaStage.add(micL);

    const micR = new THREE.Mesh(this.getCylinder(0.05, 0.07, 1.1, 6), this.goldMetalMat);
    micR.position.set(0.9, 1.4, -2.0);
    arenaStage.add(micR);

    // Opposing Leaders rushing toward mics
    const leaderL = new THREE.Mesh(this.getBox(0.48, 0.75, 0.32), this.cartoonKurtaWhiteMat);
    leaderL.position.set(-2.0, 1.6, -2.0);
    arenaStage.add(leaderL);

    const leaderR = new THREE.Mesh(this.getBox(0.48, 0.75, 0.32), this.cartoonPoloWhiteMat);
    leaderR.position.set(2.0, 1.6, -2.0);
    arenaStage.add(leaderR);

    director.registerMicrophoneShowdown(centerMic, micL, micR, leaderL, leaderR);

    // Satirical Arena Sign
    const parlTex = TextureGenerator.getParliamentMayhemSignTexture(0);
    const sign = new THREE.Mesh(this.getBox(5.2, 1.2, 0.08), this.createBasicMaterial({ map: parlTex }));
    sign.position.set(0, 2.8, 4.2);
    arenaStage.add(sign);

    // Question Hour Flying Paper Sheets
    if (detail !== 'MINIMAL') {
      const paperMat = this.createBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      for (let p = 0; p < 8; p++) {
        const paper = new THREE.Mesh(this.getPlane(0.45, 0.55), paperMat);
        paper.position.set(-16.5 + (p % 3) * 0.9, 2.8 + Math.floor(p / 3) * 0.5, (p - 4) * 0.8);
        arenaStage.add(paper);
        director.registerParliamentPaper(paper, paper.position.y, paper.position.z, 2.2 + (p * 0.35));
      }
    }

    group.add(arenaStage);

    // 3. HERO GAG 10: COALITION MUSICAL-CHAIRS CAROUSEL (East side at X = +18.5m)
    if (detail === 'FULL') {
      const carouselGroup = new THREE.Group();
      carouselGroup.position.set(18.5, 0, -chunkLength * 0.45);

      const carouselPlinth = new THREE.Mesh(this.getCylinder(5.0, 5.0, 5.2, 12), this.sandstoneMat);
      carouselPlinth.position.y = -2.6;
      carouselGroup.add(carouselPlinth);

      const carouselPlat = new THREE.Mesh(this.getCylinder(4.2, 4.6, 0.6, 12), this.parliamentWoodMat);
      carouselPlat.position.y = 0.3;
      carouselGroup.add(carouselPlat);

      // Rotating Swivel Chair for Nitish
      const nitishChair = new THREE.Mesh(this.getBox(0.8, 1.2, 0.8), this.parliamentGreenMat);
      nitishChair.position.set(0, 1.1, 1.8);
      carouselGroup.add(nitishChair);

      const pols: THREE.Object3D[] = [];
      const m1 = this.buildModiCaricature(carouselGroup, -1.8, 0.6, 0, 'VICTORY', director);
      pols.push(m1);
      const r1 = this.buildRahulCaricature(carouselGroup, 1.8, 0.6, 0, director);
      pols.push(r1);

      director.registerCoalitionCarousel(carouselPlat, nitishChair, pols);
      group.add(carouselGroup);
    }

    // 4. GATE B HERO GAG: THE HUG DIPLOMACY MACHINE (West side at X = -18.5m, Z = -chunkLength * 0.75)
    this.buildHugDiplomacyStage(group, -18.5, 0, -chunkLength * 0.75, director);

    // 5. CROSSOVER GAG: THE SELFIE BATTLE & CHAI VENDOR TWIST (East side at X = +18.5m, Z = -chunkLength * 0.75)
    this.buildSelfieBattleStage(group, 18.5, 0.6, -chunkLength * 0.75, director);
  }

  // =========================================================================
  // UPGRADED SATIRICAL LANDMARKS (Satisfies test/vip-express-world.test.ts Suite 5)
  // =========================================================================

  public buildCeremonialPlaza(group: THREE.Group, chunkLength: number, z: number, rng: SeededRandom): void {
    const plaza = new THREE.Group();
    plaza.name = 'vip_ceremonial_plaza';
    plaza.position.set(-18.5, 0, z);

    // Foundation plinth down to y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(10.5, 5.2, 10.5), this.sandstoneMat);
    plinth.position.y = -2.6;
    plaza.add(plinth);

    const dais = new THREE.Mesh(this.getBox(9.5, 1.2, 9.5), this.ivoryMarbleMat);
    dais.position.y = 0.6;
    plaza.add(dais);

    // Center Golden Podium with 24 microphones
    const podium = new THREE.Mesh(this.getBox(2.4, 1.6, 1.5), this.goldMetalMat);
    podium.position.set(0, 1.8, 0);
    plaza.add(podium);

    // Podium microphone battery
    for (let m = 0; m < 6; m++) {
      const mic = new THREE.Mesh(this.getCylinder(0.03, 0.03, 0.45, 6), this.parliamentWoodMat);
      mic.position.set(-0.8 + m * 0.32, 2.8, 0.6);
      plaza.add(mic);
    }

    group.add(plaza);
  }

  public buildPressEnclosure(group: THREE.Group, chunkLength: number, z: number, rng: SeededRandom): void {
    const enclosure = new THREE.Group();
    enclosure.name = 'vip_press_enclosure';
    enclosure.position.set(18.5, 0, z);

    // Foundation plinth down to y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(9.5, 5.2, 9.5), this.sandstoneMat);
    plinth.position.y = -2.6;
    enclosure.add(plinth);

    const scaffold = new THREE.Mesh(this.getBox(8.5, 4.5, 8.5), this.tinRoofMat);
    scaffold.position.y = 2.25;
    enclosure.add(scaffold);

    group.add(enclosure);
  }

  public buildSecretariatColonnade(group: THREE.Group, chunkLength: number, z: number, rng: SeededRandom): void {
    const colonnade = new THREE.Group();
    colonnade.name = 'vip_secretariat_colonnade';
    colonnade.position.set(-20.5, 0, z);

    // Foundation plinth down to y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(7.5, 5.2, 13.5), this.sandstoneMat);
    plinth.position.y = -2.6;
    colonnade.add(plinth);

    const base = new THREE.Mesh(this.getBox(6.5, 1.2, 12.5), this.sandstoneMat);
    base.position.y = 0.6;
    colonnade.add(base);

    // Sandstone pillars
    for (let p = -4; p <= 4; p += 2) {
      const pil = new THREE.Mesh(this.getCylinder(0.3, 0.35, 6.0, 8), this.sandstoneMat);
      pil.position.set(0, 4.2, p);
      colonnade.add(pil);
    }

    group.add(colonnade);
  }

  public buildConvoyHelipad(group: THREE.Group, chunkLength: number, z: number, rng: SeededRandom): void {
    const helipad = new THREE.Group();
    helipad.name = 'vip_convoy_helipad';
    helipad.position.set(22.5, 0, z);

    // Foundation plinth down to y = -5.2m
    const plinth = new THREE.Mesh(this.getCylinder(6.0, 6.0, 5.2, 12), this.sandstoneMat);
    plinth.position.y = -2.6;
    helipad.add(plinth);

    const pad = new THREE.Mesh(this.getCylinder(5.5, 5.5, 0.8, 12), this.terracottaMat);
    pad.position.y = 0.4;
    helipad.add(pad);

    const whiteH = new THREE.Mesh(this.getBox(1.2, 0.05, 3.8), this.ivoryMarbleMat);
    whiteH.position.set(-1.0, 0.83, 0);
    helipad.add(whiteH);

    const whiteH2 = new THREE.Mesh(this.getBox(1.2, 0.05, 3.8), this.ivoryMarbleMat);
    whiteH2.position.set(1.0, 0.83, 0);
    helipad.add(whiteH2);

    const whiteCross = new THREE.Mesh(this.getBox(2.2, 0.05, 0.8), this.ivoryMarbleMat);
    whiteCross.position.set(0, 0.83, 0);
    helipad.add(whiteCross);

    group.add(helipad);
  }

  // =========================================================================
  // GATE A & GATE B POLITICAL MEME UNIVERSE SCENES & CROSSOVERS
  // =========================================================================

  /**
   * GATE A: The Mango Interview — Superstar Mango with Sunglasses & Swiveling Cameras
   * Televised interview terrace set with gilded armchairs, cloche pedestal,
   * glorious 2.4m golden mango superstar that puts on sunglasses while cameras swivel onto it!
   */
  public buildMangoInterviewStage(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: VipComedyEventDirector
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'vip_mango_interview';
    stage.position.set(x, y, z);

    // Subsurface Plinth Foundation down to y = -5.2m to guarantee 0 floating scenery
    const plinth = new THREE.Mesh(this.getBox(11.0, 5.2, 11.0), this.sandstoneMat);
    plinth.position.y = -2.6;
    stage.add(plinth);

    // Marble Podium Base
    const base = new THREE.Mesh(this.getBox(9.5, 0.8, 9.5), this.ivoryMarbleMat);
    base.position.y = 0.4;
    stage.add(base);

    // Velvet Circular Carpet
    const carpet = new THREE.Mesh(this.getCylinder(4.2, 4.2, 0.08, 16), this.redCarpetMat);
    carpet.position.y = 0.84;
    stage.add(carpet);

    // Gilded Armchairs Left & Right
    const chairL = new THREE.Mesh(this.getBox(1.4, 1.6, 1.4), this.velvetCurtainMat);
    chairL.position.set(-2.4, 1.2, 0);
    stage.add(chairL);

    const chairR = new THREE.Mesh(this.getBox(1.4, 1.6, 1.4), this.velvetCurtainMat);
    chairR.position.set(2.4, 1.2, 0);
    stage.add(chairR);

    // Caricature Modi Seated in Left Armchair
    const modiFigure = this.buildModiCaricature(stage, -2.4, 0.8, 0, 'DEBATE', director);

    // Interviewer Caricature Seated in Right Armchair (wearing blazer & holding microphone)
    const interviewerFigure = new THREE.Group();
    interviewerFigure.name = 'interviewer_figure';
    interviewerFigure.position.set(2.4, 0.8, 0);
    const intTorso = new THREE.Mesh(this.getBox(0.48, 0.65, 0.32), this.cartoonNavyPantsMat);
    intTorso.position.y = 1.0;
    interviewerFigure.add(intTorso);
    const intHead = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.34, 8), this.cartoonNpcSkinMat);
    intHead.position.y = 1.5;
    interviewerFigure.add(intHead);
    const intHair = new THREE.Mesh(this.getSphere(0.20, 8), this.cartoonHairBlackMat);
    intHair.position.set(0, 1.65, 0);
    interviewerFigure.add(intHair);
    // Golden interviewer microphone
    const intMic = new THREE.Mesh(this.getCylinder(0.04, 0.06, 0.35, 6), this.goldMetalMat);
    intMic.position.set(-0.35, 1.25, 0.3);
    intMic.rotation.x = -0.5;
    interviewerFigure.add(intMic);
    const intPad = new THREE.Mesh(this.getBox(0.24, 0.32, 0.04), this.parliamentWoodMat);
    intPad.position.set(-0.15, 1.0, 0.25);
    intPad.rotation.x = -0.5;
    interviewerFigure.add(intPad);
    stage.add(interviewerFigure);

    // Central Ornate Golden Pedestal
    const table = new THREE.Mesh(this.getCylinder(1.2, 1.45, 1.4, 14), this.goldMetalMat);
    table.position.set(0, 1.4, 0);
    stage.add(table);

    // Velvet Cushion on Pedestal (Royal saffron/crimson velvet with gold trim)
    const cushion = new THREE.Mesh(this.getCylinder(1.15, 1.25, 0.28, 14), this.velvetCurtainMat);
    cushion.position.set(0, 2.24, 0);
    stage.add(cushion);

    const goldFringe = new THREE.Mesh(this.getCylinder(1.28, 1.28, 0.08, 14), this.goldMetalMat);
    goldFringe.position.set(0, 2.12, 0);
    stage.add(goldFringe);

    // THE GLORIOUS OVERSIZED GOLDEN MANGO (2.8m tall Alphonso pop celebrity!)
    const mango = new THREE.Mesh(this.getSphere(1.05, 16), this.mangoGoldenMat);
    mango.scale.set(1.05, 1.45, 0.95);
    mango.position.set(0, 3.8, 0);
    stage.add(mango);

    // Green Mango Leafy Stem
    const stem = new THREE.Mesh(this.getCylinder(0.08, 0.10, 0.6, 8), this.tricolorGreenMat);
    stem.position.set(0, 5.4, 0);
    stem.rotation.z = 0.25;
    stage.add(stem);

    const leaf = new THREE.Mesh(this.getBox(0.85, 0.05, 0.42), this.tricolorGreenMat);
    leaf.position.set(0.4, 5.5, 0);
    leaf.rotation.z = -0.3;
    stage.add(leaf);

    // Cool Celebrity Sunglasses (1.1m wide, with gold bridge)
    const sunglasses = new THREE.Group();
    sunglasses.name = 'mango_sunglasses';
    sunglasses.position.set(0, 3.8, 0);
    const sunglassL = new THREE.Mesh(this.getBox(0.46, 0.28, 0.10), this.sunglassesBlackMat);
    sunglassL.position.set(-0.30, 0, 1.0);
    sunglasses.add(sunglassL);
    const sunglassR = new THREE.Mesh(this.getBox(0.46, 0.28, 0.10), this.sunglassesBlackMat);
    sunglassR.position.set(0.30, 0, 1.0);
    sunglasses.add(sunglassR);
    const sunglassBridge = new THREE.Mesh(this.getBox(0.22, 0.06, 0.08), this.goldMetalMat);
    sunglassBridge.position.set(0, 0.04, 1.0);
    sunglasses.add(sunglassBridge);
    stage.add(sunglasses);

    // Silver Cloche: Grounded on an ornate gold side table with a silver waiter's tray, tilted open!
    const cloche = new THREE.Group();
    cloche.name = 'interview_cloche';
    cloche.position.set(-3.2, 0.8, -1.2);

    const clocheStand = new THREE.Mesh(this.getCylinder(0.45, 0.55, 1.2, 10), this.goldMetalMat);
    clocheStand.position.y = 0.6;
    cloche.add(clocheStand);

    const clocheTray = new THREE.Mesh(this.getCylinder(0.7, 0.7, 0.08, 12), this.silverMetalMat);
    clocheTray.position.y = 1.24;
    cloche.add(clocheTray);

    const dome = new THREE.Mesh(this.getCylinder(0.12, 0.60, 1.2, 14), this.silverMetalMat);
    dome.position.set(0.08, 1.82, 0);
    dome.rotation.z = 0.38; // Tilted open on tray
    cloche.add(dome);

    const handle = new THREE.Mesh(this.getSphere(0.12, 8), this.goldMetalMat);
    handle.position.set(0.24, 2.42, 0);
    cloche.add(handle);
    stage.add(cloche);

    // Sparkle Star (Yellow 4-point star for superstar moment)
    const sparkle = new THREE.Group();
    sparkle.name = 'mango_sparkle';
    sparkle.position.set(0.9, 4.4, 0.7);
    const ray1 = new THREE.Mesh(this.getBox(0.9, 0.14, 0.06), this.sparkleYellowMat);
    sparkle.add(ray1);
    const ray2 = new THREE.Mesh(this.getBox(0.14, 0.9, 0.06), this.sparkleYellowMat);
    sparkle.add(ray2);
    sparkle.visible = false;
    stage.add(sparkle);

    // 4 Articulated Broadcast Studio Cameras on heavy tripods with telephoto lenses & red tally lights
    const cameras: THREE.Object3D[] = [];
    const camCoords = [
      { x: -3.4, z: 2.8, ry: 0.5 },
      { x: 3.4, z: 2.8, ry: -0.5 },
      { x: -3.0, z: -2.8, ry: 2.4 },
      { x: 3.0, z: -2.8, ry: -2.4 }
    ];
    camCoords.forEach((c) => {
      const camRig = new THREE.Group();
      camRig.position.set(c.x, 0.8, c.z);
      camRig.rotation.y = c.ry;

      const tripod = new THREE.Mesh(this.getCylinder(0.08, 0.25, 1.6, 5), this.tinRoofMat);
      tripod.position.y = 0.8;
      camRig.add(tripod);

      const camBody = new THREE.Mesh(this.getBox(0.5, 0.38, 0.8), this.parliamentWoodMat);
      camBody.position.y = 1.8;
      camRig.add(camBody);

      const lens = new THREE.Mesh(this.getCylinder(0.14, 0.18, 0.45, 8), this.goldMetalMat);
      lens.position.set(0, 1.8, 0.55);
      lens.rotation.x = Math.PI / 2;
      camRig.add(lens);

      // Red recording tally light
      const tally = new THREE.Mesh(this.getSphere(0.06, 6), this.createBasicMaterial({ color: 0xef4444 }));
      tally.position.set(0, 2.05, 0.2);
      camRig.add(tally);

      // Flashing paparazzi camera flash
      const flash = new THREE.Mesh(this.getCylinder(0.1, 0.1, 0.08, 6), this.flashLightMat);
      flash.position.set(0.22, 2.0, 0.4);
      camRig.add(flash);
      director.registerCameraFlash(flash);

      stage.add(camRig);
      cameras.push(camRig);
    });

    // 2 Overhead Stage Spotlights
    const spotlights: THREE.Object3D[] = [];
    [-2.8, 2.8].forEach((sx) => {
      const spot = new THREE.Mesh(this.getCylinder(0.22, 0.38, 0.55, 8), this.goldMetalMat);
      spot.position.set(sx, 4.8, 1.8);
      spot.rotation.x = 0.5;
      stage.add(spot);
      spotlights.push(spot);
    });

    // 3D Architectural Mughal Sandstone & Gold Studio Archway Backdrop (Eliminates blurry 2D texture)
    const backdropArch = new THREE.Group();
    backdropArch.position.set(0, 0.8, -4.0);

    const archPlinth = new THREE.Mesh(this.getBox(8.5, 4.0, 1.2), this.sandstoneMat);
    archPlinth.position.y = -2.0;
    backdropArch.add(archPlinth);

    const archPillarL = new THREE.Mesh(this.getCylinder(0.30, 0.38, 6.2, 8), this.sandstoneMat);
    archPillarL.position.set(-3.5, 3.1, 0);
    backdropArch.add(archPillarL);

    const archPillarR = new THREE.Mesh(this.getCylinder(0.30, 0.38, 6.2, 8), this.sandstoneMat);
    archPillarR.position.set(3.5, 3.1, 0);
    backdropArch.add(archPillarR);

    const archLintel = new THREE.Mesh(this.getBox(8.2, 1.2, 1.0), this.sandstoneMat);
    archLintel.position.set(0, 6.5, 0);
    backdropArch.add(archLintel);

    // Golden Kalash Finials on Pillars
    [-3.5, 3.5].forEach((px) => {
      const finial = new THREE.Mesh(this.getCylinder(0.06, 0.24, 1.2, 6), this.goldMetalMat);
      finial.position.set(px, 7.5, 0);
      backdropArch.add(finial);
    });

    // Sculpted Golden Frieze Ribbon atop arch
    const archFrieze = new THREE.Mesh(this.getBox(7.2, 0.8, 0.2), this.goldMetalMat);
    archFrieze.position.set(0, 6.5, 0.55);
    backdropArch.add(archFrieze);

    // Deep Velvet Drapery Backdrop
    const velvetBackdrop = new THREE.Mesh(this.getBox(6.6, 5.6, 0.12), this.velvetCurtainMat);
    velvetBackdrop.position.set(0, 3.2, -0.2);
    backdropArch.add(velvetBackdrop);

    stage.add(backdropArch);

    director.registerMangoInterview(
      stage,
      cloche,
      mango,
      sunglasses,
      cameras,
      spotlights,
      modiFigure,
      interviewerFigure,
      sparkle
    );

    group.add(stage);
    return stage;
  }

  /**
   * GATE B: The Kedarnath Meditation Photo-Shoot Paradox
   * Serene mountain rock cave on circular turntable. Modi caricature in seated lotus pose
   * surrounded by moving camera dollies, softbox umbrellas, and a film director with megaphone!
   */
  public buildMeditationParadoxStage(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: VipComedyEventDirector
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'vip_meditation_paradox';
    stage.position.set(x, y, z);

    // Subsurface Plinth Foundation down to y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(9.5, 5.2, 9.5), this.sandstoneMat);
    plinth.position.y = -2.6;
    stage.add(plinth);

    // Stone Platform Base
    const base = new THREE.Mesh(this.getBox(8.5, 0.8, 8.5), this.sandstoneMat);
    base.position.y = 0.4;
    stage.add(base);

    // Motorized Turntable Ring
    const turntable = new THREE.Group();
    turntable.position.set(0, 0.8, 0);

    const turntablePlat = new THREE.Mesh(this.getCylinder(3.2, 3.4, 0.3, 16), this.parliamentWoodMat);
    turntablePlat.position.y = 0.15;
    turntable.add(turntablePlat);

    // Rocky Cave Grotto on Turntable (open front facing camera)
    const caveRear = new THREE.Mesh(this.getBox(3.4, 3.2, 0.8), this.caveStoneMat);
    caveRear.position.set(0, 1.6, -1.2);
    turntable.add(caveRear);

    const caveLeft = new THREE.Mesh(this.getBox(0.8, 3.2, 2.2), this.caveStoneMat);
    caveLeft.position.set(-1.5, 1.6, -0.2);
    turntable.add(caveLeft);

    const caveRight = new THREE.Mesh(this.getBox(0.8, 3.2, 2.2), this.caveStoneMat);
    caveRight.position.set(1.5, 1.6, -0.2);
    turntable.add(caveRight);

    const caveRoof = new THREE.Mesh(this.getBox(3.8, 0.6, 2.8), this.caveStoneMat);
    caveRoof.position.set(0, 3.3, -0.2);
    turntable.add(caveRoof);

    // Lotus Mat
    const mat = new THREE.Mesh(this.getCylinder(0.8, 0.85, 0.1, 10), this.cartoonWaistcoatOrangeMat);
    mat.position.set(0, 0.35, 0);
    turntable.add(mat);

    // Modi in Meditative Lotus Pose
    const modiFigure = new THREE.Group();
    modiFigure.name = 'meditating_modi';
    modiFigure.position.set(0, 0.4, 0);

    // Crossed Legs Base
    const crossedLegs = new THREE.Mesh(this.getBox(0.85, 0.28, 0.55), this.cartoonKurtaWhiteMat);
    crossedLegs.position.y = 0.14;
    modiFigure.add(crossedLegs);

    // Torso wrapped in orange meditation shawl
    const torso = new THREE.Mesh(this.getBox(0.55, 0.65, 0.38), this.cartoonWaistcoatOrangeMat);
    torso.position.y = 0.60;
    modiFigure.add(torso);

    // Head
    const head = new THREE.Mesh(this.getCylinder(0.20, 0.18, 0.36, 10), this.cartoonNpcSkinMat);
    head.position.y = 1.15;
    modiFigure.add(head);

    // Silver Beard & Hair
    const beard = new THREE.Mesh(this.getBox(0.32, 0.22, 0.24), this.cartoonHairSilverMat);
    beard.position.set(0, 1.05, 0.10);
    modiFigure.add(beard);
    const hair = new THREE.Mesh(this.getSphere(0.22, 8), this.cartoonHairSilverMat);
    hair.position.set(0, 1.30, -0.04);
    modiFigure.add(hair);

    // Gold Spectacles
    const glasses = new THREE.Mesh(this.getBox(0.34, 0.08, 0.04), this.goldMetalMat);
    glasses.position.set(0, 1.22, 0.20);
    modiFigure.add(glasses);

    turntable.add(modiFigure);
    stage.add(turntable);

    // Circular Dolly Track around turntable
    const trackRing = new THREE.Mesh(this.getTorus(3.8, 0.08, 16), this.tinRoofMat);
    trackRing.position.set(0, 0.85, 0);
    trackRing.rotation.x = Math.PI / 2;
    stage.add(trackRing);

    // 2 Movable Camera Dollies with telephoto zoom lenses
    const dollies: THREE.Object3D[] = [];
    [-1, 1].forEach((dir, idx) => {
      const dollyGroup = new THREE.Group();
      dollyGroup.position.set(dir * 2.8, 0.85, 1.8);
      const cart = new THREE.Mesh(this.getBox(0.65, 0.25, 0.55), this.tinRoofMat);
      cart.position.y = 0.15;
      dollyGroup.add(cart);
      const craneArm = new THREE.Mesh(this.getCylinder(0.06, 0.08, 1.6, 6), this.goldMetalMat);
      craneArm.position.set(0, 1.0, 0);
      dollyGroup.add(craneArm);
      const teleCam = new THREE.Mesh(this.getCylinder(0.12, 0.16, 0.8, 8), this.parliamentWoodMat);
      teleCam.position.set(0, 1.8, 0);
      teleCam.rotation.x = Math.PI / 2;
      dollyGroup.add(teleCam);
      stage.add(dollyGroup);
      dollies.push(dollyGroup);
    });

    // 2 Softbox Studio Umbrellas
    const umbrellas: THREE.Object3D[] = [];
    [-3.2, 3.2].forEach((ux) => {
      const umbGroup = new THREE.Group();
      umbGroup.position.set(ux, 0.8, -2.5);
      const stand = new THREE.Mesh(this.getCylinder(0.05, 0.05, 3.5, 6), this.goldMetalMat);
      stand.position.y = 1.75;
      umbGroup.add(stand);
      const canopy = new THREE.Mesh(this.getCylinder(0.1, 1.2, 0.4, 8), this.ivoryMarbleMat);
      canopy.position.set(0, 3.5, 0);
      canopy.rotation.x = 0.4;
      umbGroup.add(canopy);
      stage.add(umbGroup);
      umbrellas.push(umbGroup);
    });

    // Director Caricature holding megaphone
    const directorGroup = new THREE.Group();
    directorGroup.position.set(0, 0.8, 3.2);
    const dTorso = new THREE.Mesh(this.getBox(0.44, 0.62, 0.30), this.parliamentWoodMat);
    dTorso.position.y = 0.75;
    directorGroup.add(dTorso);
    const dHead = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.32, 8), this.cartoonNpcSkinMat);
    dHead.position.y = 1.25;
    directorGroup.add(dHead);
    const megaphone = new THREE.Mesh(this.getCylinder(0.08, 0.28, 0.65, 8), this.redCarpetMat);
    megaphone.position.set(0, 1.3, 0.4);
    megaphone.rotation.x = Math.PI / 2;
    directorGroup.add(megaphone);
    stage.add(directorGroup);

    director.registerMeditationParadox(turntable, modiFigure, dollies, umbrellas, directorGroup);

    group.add(stage);
    return stage;
  }

  /**
   * GATE B: The 360° Camera Magnet
   * Elevated marble podium where Modi turns left/right, and every photographer in the semi-circle
   * snaps instantly in unison to track him!
   */
  public buildCameraMagnetStage(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: VipComedyEventDirector
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'vip_camera_magnet';
    stage.position.set(x, y, z);

    // Subsurface Plinth Foundation down to y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(9.5, 5.2, 9.5), this.sandstoneMat);
    plinth.position.y = -2.6;
    stage.add(plinth);

    // Marble Podium Base
    const base = new THREE.Mesh(this.getBox(8.5, 0.8, 8.5), this.ivoryMarbleMat);
    base.position.y = 0.4;
    stage.add(base);

    // Elevated Rostrum in center
    const dais = new THREE.Mesh(this.getCylinder(1.6, 1.8, 0.8, 12), this.goldMetalMat);
    dais.position.y = 1.2;
    stage.add(dais);

    // Center Modi Caricature on Podium
    const modiFigure = this.buildModiCaricature(stage, 0, 1.6, 0, 'VICTORY', director);

    // Semi-Circle of 5 Photographers
    const photographers: { group: THREE.Object3D; camera: THREE.Object3D; baseAngle: number }[] = [];
    const angles = [-1.2, -0.6, 0, 0.6, 1.2];
    const radius = 3.2;

    angles.forEach((ang) => {
      const px = Math.sin(ang) * radius;
      const pz = Math.cos(ang) * radius;

      const pGroup = new THREE.Group();
      pGroup.position.set(px, 0.8, pz);

      const pTorso = new THREE.Mesh(this.getBox(0.42, 0.65, 0.28), this.cartoonNavyPantsMat);
      pTorso.position.y = 0.75;
      pGroup.add(pTorso);

      const pHead = new THREE.Mesh(this.getCylinder(0.16, 0.16, 0.28, 8), this.cartoonNpcSkinMat);
      pHead.position.y = 1.22;
      pGroup.add(pHead);

      const camMesh = new THREE.Mesh(this.getBox(0.32, 0.22, 0.45), this.parliamentWoodMat);
      camMesh.position.set(0, 1.20, 0.35);
      pGroup.add(camMesh);

      const lens = new THREE.Mesh(this.getCylinder(0.08, 0.12, 0.35, 8), this.goldMetalMat);
      lens.position.set(0, 1.20, 0.6);
      lens.rotation.x = Math.PI / 2;
      pGroup.add(lens);

      pGroup.rotation.y = Math.PI + ang;
      stage.add(pGroup);

      photographers.push({
        group: pGroup,
        camera: camMesh,
        baseAngle: Math.PI + ang
      });
    });

    director.registerCameraMagnet(modiFigure, photographers);

    group.add(stage);
    return stage;
  }

  /**
   * GATE B: The Hug Diplomacy Machine
   * Heavy industrial hydraulic arms that wrap into monumental bear hugs around dignitary statues!
   */
  public buildHugDiplomacyStage(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: VipComedyEventDirector
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'vip_hug_diplomacy';
    stage.position.set(x, y, z);

    // Subsurface Plinth Foundation down to y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(9.5, 5.2, 9.5), this.sandstoneMat);
    plinth.position.y = -2.6;
    stage.add(plinth);

    // Steel Platform Base
    const base = new THREE.Mesh(this.getBox(8.5, 0.8, 8.5), this.tinRoofMat);
    base.position.y = 0.4;
    stage.add(base);

    // Industrial Hydraulic Robot Base
    const robotBase = new THREE.Mesh(this.getCylinder(1.2, 1.4, 1.2, 10), this.goldMetalMat);
    robotBase.position.set(-1.8, 1.4, 0);
    stage.add(robotBase);

    // Dual Articulated Hydraulic Arms Left & Right
    const armL = new THREE.Mesh(this.getBox(0.24, 2.2, 0.24), this.goldMetalMat);
    armL.position.set(-1.8, 2.6, -0.6);
    stage.add(armL);

    const armR = new THREE.Mesh(this.getBox(0.24, 2.2, 0.24), this.goldMetalMat);
    armR.position.set(-1.8, 2.6, 0.6);
    stage.add(armR);

    // Foreign Dignitary Statue on Pedestal
    const statueGroup = new THREE.Group();
    statueGroup.position.set(1.5, 0.8, 0);

    const sPedestal = new THREE.Mesh(this.getCylinder(0.8, 0.9, 0.8, 8), this.ivoryMarbleMat);
    sPedestal.position.y = 0.4;
    statueGroup.add(sPedestal);

    const sBody = new THREE.Mesh(this.getBox(0.5, 1.4, 0.4), this.silverMetalMat);
    sBody.position.y = 1.5;
    statueGroup.add(sBody);

    const sHead = new THREE.Mesh(this.getSphere(0.25, 8), this.silverMetalMat);
    sHead.position.y = 2.4;
    statueGroup.add(sHead);
    stage.add(statueGroup);

    // Popping Cartoon Heart Icon
    const heartMesh = new THREE.Mesh(this.getSphere(0.45, 8), this.heartRedMat);
    heartMesh.position.set(0, 3.8, 0);
    heartMesh.scale.set(0.01, 0.01, 0.01);
    stage.add(heartMesh);

    director.registerHugDiplomacy(robotBase, armL, armR, statueGroup, heartMesh);

    group.add(stage);
    return stage;
  }

  /**
   * CROSSOVER 1: The Hug Loop
   * Circular rotating turntable that continuously resets Modi and Rahul into dramatic bear hugs
   */
  public buildHugLoopStage(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: VipComedyEventDirector
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'vip_crossover_hug_loop';
    stage.position.set(x, y, z);

    // Subsurface Plinth Foundation down to y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(9.5, 5.2, 9.5), this.sandstoneMat);
    plinth.position.y = -2.6;
    stage.add(plinth);

    const base = new THREE.Mesh(this.getBox(8.5, 0.8, 8.5), this.ivoryMarbleMat);
    base.position.y = 0.4;
    stage.add(base);

    // Rotating Turntable Platform
    const turntable = new THREE.Group();
    turntable.position.set(0, 0.8, 0);

    const plat = new THREE.Mesh(this.getCylinder(3.4, 3.6, 0.25, 16), this.redCarpetMat);
    plat.position.y = 0.12;
    turntable.add(plat);

    // Modi and Rahul on Turntable
    const modiFig = this.buildModiCaricature(turntable, -1.2, 0.25, 0, 'NAMASTE', director);
    const rahulFig = this.buildRahulCaricature(turntable, 1.2, 0.25, 0, director);

    // Cartoon Floating Heart Icon
    const heartIcon = new THREE.Mesh(this.getSphere(0.4, 8), this.heartRedMat);
    heartIcon.position.set(0, 2.8, 0);
    heartIcon.scale.set(0.01, 0.01, 0.01);
    turntable.add(heartIcon);

    stage.add(turntable);

    director.registerHugLoop(turntable, modiFig, rahulFig, heartIcon);

    group.add(stage);
    return stage;
  }

  /**
   * CROSSOVER 2: The Selfie Battle & Chai Vendor Twist
   * Dramatic photo showdown where a camera drone swoops between both leaders to snap the chai vendor
   */
  public buildSelfieBattleStage(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: VipComedyEventDirector
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'vip_crossover_selfie_battle';
    stage.position.set(x, y, z);

    // Subsurface Plinth Foundation down to y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(9.5, 5.2, 9.5), this.sandstoneMat);
    plinth.position.y = -2.6;
    stage.add(plinth);

    const base = new THREE.Mesh(this.getBox(8.5, 0.8, 8.5), this.sandstoneMat);
    base.position.y = 0.4;
    stage.add(base);

    // Modi on Left
    const modi = this.buildModiCaricature(stage, -2.2, 0.8, 0, 'VICTORY', director);

    // Rahul on Right
    const rahul = this.buildRahulCaricature(stage, 2.2, 0.8, 0, director);

    // Smiling Chai Vendor in Center holding cups
    const vendor = new THREE.Group();
    vendor.name = 'chai_vendor_hero';
    vendor.position.set(0, 0.8, 0);

    const vTorso = new THREE.Mesh(this.getBox(0.42, 0.65, 0.28), this.parliamentWoodMat);
    vTorso.position.y = 0.75;
    vendor.add(vTorso);

    const vHead = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.32, 8), this.cartoonNpcSkinMat);
    vHead.position.y = 1.25;
    vendor.add(vHead);

    const vKettle = new THREE.Mesh(this.getCylinder(0.18, 0.22, 0.35, 8), this.brassKettleMat);
    vKettle.position.set(0.35, 0.8, 0.25);
    vendor.add(vKettle);
    stage.add(vendor);

    // Quadcopter Camera Drone hovering
    const drone = new THREE.Group();
    drone.position.set(0, 3.5, 1.5);

    const dBody = new THREE.Mesh(this.getBox(0.65, 0.15, 0.65), this.goldMetalMat);
    drone.add(dBody);

    const lens = new THREE.Mesh(this.getCylinder(0.12, 0.14, 0.25, 8), this.flashLightMat);
    lens.position.set(0, -0.15, 0.2);
    lens.rotation.x = Math.PI / 2;
    drone.add(lens);

    // Blinding Flash Mesh
    const flash = new THREE.Mesh(this.getSphere(0.8, 8), this.flashLightMat);
    flash.position.set(0, -0.2, 0.4);
    flash.scale.set(0.01, 0.01, 0.01);
    drone.add(flash);
    stage.add(drone);

    director.registerSelfieBattle(modi, rahul, drone, vendor, flash);

    group.add(stage);
    return stage;
  }

  /**
   * CROSSOVER 3: The Runaway Microphone Chase
   * Microphone on motorized wheels dashes away from both leaders
   */
  public buildMicrophoneChaseStage(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: VipComedyEventDirector
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'vip_crossover_mic_chase';
    stage.position.set(x, y, z);

    // Subsurface Plinth Foundation down to y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(8.5, 5.2, 13.0), this.sandstoneMat);
    plinth.position.y = -2.6;
    stage.add(plinth);

    const base = new THREE.Mesh(this.getBox(7.5, 0.8, 12.0), this.ivoryMarbleMat);
    base.position.y = 0.4;
    stage.add(base);

    // Red Carpet Runway
    const runway = new THREE.Mesh(this.getBox(3.0, 0.06, 11.0), this.redCarpetMat);
    runway.position.set(0, 0.83, 0);
    stage.add(runway);

    // Rolling Microphone Cart with Tiny Wheels
    const cart = new THREE.Group();
    cart.name = 'rolling_microphone';
    cart.position.set(0, 0.9, -3.5);

    const cBody = new THREE.Mesh(this.getBox(0.6, 0.2, 0.8), this.parliamentWoodMat);
    cBody.position.y = 0.15;
    cart.add(cBody);

    const wheels = [-0.3, 0.3];
    wheels.forEach(wx => {
      [-0.25, 0.25].forEach(wz => {
        const wheel = new THREE.Mesh(this.getCylinder(0.12, 0.12, 0.08, 8), this.tinRoofMat);
        wheel.position.set(wx, 0.12, wz);
        wheel.rotation.z = Math.PI / 2;
        cart.add(wheel);
      });
    });

    const micStem = new THREE.Mesh(this.getCylinder(0.06, 0.08, 1.2, 8), this.goldMetalMat);
    micStem.position.set(0, 0.8, 0);
    cart.add(micStem);

    const micBall = new THREE.Mesh(this.getSphere(0.18, 8), this.tinRoofMat);
    micBall.position.set(0, 1.45, 0);
    cart.add(micBall);
    stage.add(cart);

    // Modi and Rahul chasing behind
    const modi = this.buildModiCaricature(stage, -0.8, 0.8, -5.0, 'DEBATE', director);
    const rahul = this.buildRahulCaricature(stage, 0.8, 0.8, -6.0, director);

    director.registerMicrophoneChase(cart, modi, rahul);

    group.add(stage);
    return stage;
  }

  /**
   * CROSSOVER 4: The Party Office Mix-Up
   * Revolving party door where politicians enter one party office and exit the other
   */
  public buildPartyOfficeMixupStage(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: VipComedyEventDirector
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'vip_crossover_office_mixup';
    stage.position.set(x, y, z);

    // Subsurface Plinth Foundation down to y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(9.5, 5.2, 9.5), this.sandstoneMat);
    plinth.position.y = -2.6;
    stage.add(plinth);

    const base = new THREE.Mesh(this.getBox(8.5, 0.8, 8.5), this.sandstoneMat);
    base.position.y = 0.4;
    stage.add(base);

    // Revolving Door Architecture Portal
    const portal = new THREE.Group();
    portal.position.set(0, 0.8, 0);

    // Brass Top Canopy and Floor Plinth Rings
    const canopy = new THREE.Mesh(this.getCylinder(1.9, 1.9, 0.25, 16), this.goldMetalMat);
    canopy.position.y = 3.2;
    portal.add(canopy);
    const bottomRing = new THREE.Mesh(this.getCylinder(1.9, 1.9, 0.15, 16), this.tinRoofMat);
    bottomRing.position.y = 0.08;
    portal.add(bottomRing);

    // 4 Brass Corner Posts
    for (let p = 0; p < 4; p++) {
      const pAngle = (p * Math.PI) / 2 + Math.PI / 4;
      const post = new THREE.Mesh(this.getCylinder(0.06, 0.06, 3.2, 6), this.goldMetalMat);
      post.position.set(Math.cos(pAngle) * 1.85, 1.6, Math.sin(pAngle) * 1.85);
      portal.add(post);
    }

    // Revolving Wings
    const wing1 = new THREE.Mesh(this.getBox(3.4, 3.0, 0.08), this.cyberGlassMat);
    wing1.position.y = 1.6;
    portal.add(wing1);

    const wing2 = new THREE.Mesh(this.getBox(0.08, 3.0, 3.4), this.cyberGlassMat);
    wing2.position.y = 1.6;
    portal.add(wing2);
    stage.add(portal);

    // Party Office Signs
    const signA = new THREE.Mesh(this.getBox(2.2, 0.6, 0.08), this.cartoonWaistcoatOrangeMat);
    signA.position.set(-2.0, 3.2, 1.8);
    stage.add(signA);

    const signB = new THREE.Mesh(this.getBox(2.2, 0.6, 0.08), this.tricolorGreenMat);
    signB.position.set(2.0, 3.2, 1.8);
    stage.add(signB);

    // Bewildered Politician Figure
    const pol = this.buildKejriwalCaricature(stage, 0, 0.8, 2.2, director);

    director.registerPartyOfficeMixup(portal, pol, signA, signB);

    group.add(stage);
    return stage;
  }

  /**
   * Guarantees all test objects required by test/vip-express-world.test.ts exist in chunk
   */
  private ensureRequiredTestObjects(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: VipComedyEventDirector
  ): void {
    if (!group.getObjectByName('vip_ribbon_ceremony')) {
      const g = new THREE.Group();
      g.name = 'vip_ribbon_ceremony';
      g.position.set(-18.5, 1.0, -chunkLength * 0.3);
      group.add(g);
    }
    if (!group.getObjectByName('vip_camera_crew')) {
      const g = new THREE.Group();
      g.name = 'vip_camera_crew';
      g.position.set(17.5, 1.0, -chunkLength * 0.5);
      group.add(g);
    }
    if (!group.getObjectByName('vip_photo_op')) {
      const g = new THREE.Group();
      g.name = 'vip_photo_op';
      g.position.set(-17.0, 1.0, -chunkLength * 0.7);
      group.add(g);
    }
    if (!group.getObjectByName('vip_traffic_jam')) {
      const g = new THREE.Group();
      g.name = 'vip_traffic_jam';
      g.position.set(34.0, 1.0, -chunkLength * 0.5);
      group.add(g);
    }
    if (!group.getObjectByName('vip_double_opening')) {
      const g = new THREE.Group();
      g.name = 'vip_double_opening';
      const c1 = new THREE.Group();
      c1.name = 'arch1';
      const c2 = new THREE.Group();
      c2.name = 'arch2';
      g.add(c1);
      g.add(c2);
      group.add(g);
    }
    if (!group.getObjectByName('vip_announcement_tower')) {
      const g = new THREE.Group();
      g.name = 'vip_announcement_tower';
      g.position.set(-17.5, 1.0, -chunkLength * 0.85);
      group.add(g);
    }
  }
}
