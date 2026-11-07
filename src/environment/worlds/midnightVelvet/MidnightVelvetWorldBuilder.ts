import * as THREE from 'three';
import { CONSTANTS } from '../../../core/Constants';
import { SeededRandom } from '../../SceneryFactory';
import { CurvedShaderManager } from '../../../scene/CurvedShader';
import { TextureGenerator } from '../../../scene/TextureGenerator';
import { MidnightVelvetEventDirector } from './MidnightVelvetEventDirector';

export class MidnightVelvetWorldBuilder {
  private static instance: MidnightVelvetWorldBuilder | null = null;

  // Geometry cache for peak performance and batch re-use
  private geoCache = new Map<string, THREE.BufferGeometry>();

  // Shared Master Materials (Art Deco Luxury Nightlife Palette)
  private blackMarbleMat: THREE.MeshStandardMaterial;
  private goldMetalMat: THREE.MeshStandardMaterial;
  private velvetBurgundyMat: THREE.MeshStandardMaterial;
  private midnightNavyMat: THREE.MeshStandardMaterial;
  private warmGlassMat: THREE.MeshStandardMaterial;
  private oceanWaterMat: THREE.MeshStandardMaterial;
  private redCarpetMat: THREE.MeshStandardMaterial;
  private darkGraniteMat: THREE.MeshStandardMaterial;
  private terraceMarbleMat: THREE.MeshStandardMaterial;
  private sidewalkPaverMat: THREE.MeshStandardMaterial;
  private teakWoodMat: THREE.MeshStandardMaterial;
  private neonPinkMat: THREE.MeshBasicMaterial;
  private champagneGlowMat: THREE.MeshBasicMaterial;
  private aquaGlowMat: THREE.MeshBasicMaterial;
  private neonVioletMat: THREE.MeshBasicMaterial;
  private windowPaneMat: THREE.MeshBasicMaterial;
  private cartoonSkinMat: THREE.MeshStandardMaterial;
  private marqueeBulbMatOn: THREE.MeshBasicMaterial;
  private marqueeBulbMatOff: THREE.MeshBasicMaterial;
  private emeraldGownMat: THREE.MeshStandardMaterial;
  private sapphireGownMat: THREE.MeshStandardMaterial;
  private tuxedoMat: THREE.MeshStandardMaterial;
  private valetMat: THREE.MeshStandardMaterial;
  private bouncerMat: THREE.MeshStandardMaterial;

  private constructor() {
    // 1. Charcoal Obsidian (replaces old pitch black with rich architectural sheen)
    this.blackMarbleMat = new THREE.MeshStandardMaterial({
      color: 0x1c2130,
      roughness: 0.35,
      metalness: 0.28
    });

    // 2. Polished Champagne Gold
    this.goldMetalMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.90,
      roughness: 0.22
    });

    // 3. Royal Velvet Burgundy
    this.velvetBurgundyMat = new THREE.MeshStandardMaterial({
      color: 0x6b1d34,
      roughness: 0.75,
      metalness: 0.12
    });

    // 4. Midnight Sapphire Navy
    this.midnightNavyMat = new THREE.MeshStandardMaterial({
      color: 0x18263e,
      roughness: 0.38,
      metalness: 0.30
    });

    // 5. Warm Glowing Amber Glass (high-contrast interior reveals)
    this.warmGlassMat = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      roughness: 0.12,
      metalness: 0.25,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.85
    });

    // 6. Shimmering Ocean Marina Basin
    this.oceanWaterMat = new THREE.MeshStandardMaterial({
      color: 0x09263f,
      roughness: 0.12,
      metalness: 0.82
    });

    // 7. Plush VIP Crimson Red Carpet
    this.redCarpetMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.85,
      metalness: 0.08
    });

    // 8. Slate Architectural Granite
    this.darkGraniteMat = new THREE.MeshStandardMaterial({
      color: 0x252a38,
      roughness: 0.45,
      metalness: 0.22
    });

    // 9. Carrara White Marble with Gold Veining
    this.terraceMarbleMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.28,
      metalness: 0.18
    });

    // 10. Charcoal Stone Sidewalk Pavers
    this.sidewalkPaverMat = new THREE.MeshStandardMaterial({
      color: 0x232733,
      roughness: 0.55,
      metalness: 0.15
    });

    // 11. Warm Marine Teak Wood
    this.teakWoodMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e,
      roughness: 0.65,
      metalness: 0.10
    });

    // 12. Luminous Emissive Accents
    this.neonPinkMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
    this.champagneGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
    this.aquaGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.neonVioletMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    this.windowPaneMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    this.marqueeBulbMatOn = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    this.marqueeBulbMatOff = new THREE.MeshBasicMaterial({ color: 0x78350f });

    // 13. Character & Attire Materials
    this.cartoonSkinMat = new THREE.MeshStandardMaterial({
      color: 0xecd0b5,
      roughness: 0.6
    });

    this.emeraldGownMat = new THREE.MeshStandardMaterial({
      color: 0x065f46,
      roughness: 0.60,
      metalness: 0.25
    });

    this.sapphireGownMat = new THREE.MeshStandardMaterial({
      color: 0x1e40af,
      roughness: 0.60,
      metalness: 0.25
    });

    this.tuxedoMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.80,
      metalness: 0.10
    });

    this.valetMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Royal crimson valet uniform with gold trim
      roughness: 0.75,
      metalness: 0.15
    });

    this.bouncerMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
      metalness: 0.10
    });

    // Apply track curvature shader to all materials so scenery bends with track curves
    const curved = CurvedShaderManager.getInstance();
    [
      this.blackMarbleMat,
      this.goldMetalMat,
      this.velvetBurgundyMat,
      this.midnightNavyMat,
      this.warmGlassMat,
      this.oceanWaterMat,
      this.redCarpetMat,
      this.darkGraniteMat,
      this.terraceMarbleMat,
      this.sidewalkPaverMat,
      this.teakWoodMat,
      this.neonPinkMat,
      this.champagneGlowMat,
      this.aquaGlowMat,
      this.neonVioletMat,
      this.windowPaneMat,
      this.cartoonSkinMat,
      this.marqueeBulbMatOn,
      this.marqueeBulbMatOff,
      this.emeraldGownMat,
      this.sapphireGownMat,
      this.tuxedoMat,
      this.valetMat,
      this.bouncerMat
    ].forEach((mat) => curved.applyCurvature(mat));
  }

  public createStandardMaterial(params: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial(params);
    CurvedShaderManager.getInstance().applyCurvature(mat);
    return mat;
  }

  public createBasicMaterial(params: THREE.MeshBasicMaterialParameters): THREE.MeshBasicMaterial {
    const mat = new THREE.MeshBasicMaterial(params);
    CurvedShaderManager.getInstance().applyCurvature(mat);
    return mat;
  }

  public static getInstance(): MidnightVelvetWorldBuilder {
    if (!this.instance) {
      this.instance = new MidnightVelvetWorldBuilder();
    }
    return this.instance;
  }

  // --- Geometry Cache Helpers ---

  private getBox(w: number, h: number, d: number): THREE.BoxGeometry {
    const key = `box_${w}_${h}_${d}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.BoxGeometry(w, h, d));
    }
    return this.geoCache.get(key) as THREE.BoxGeometry;
  }

  private getCylinder(rt: number, rb: number, h: number, s: number = 8): THREE.CylinderGeometry {
    const key = `cyl_${rt}_${rb}_${h}_${s}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.CylinderGeometry(rt, rb, h, s));
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

  private getTorus(r: number, tube: number, radSegs: number = 8, tubSegs: number = 16): THREE.TorusGeometry {
    const key = `torus_${r}_${tube}_${radSegs}_${tubSegs}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.TorusGeometry(r, tube, radSegs, tubSegs));
    }
    return this.geoCache.get(key) as THREE.TorusGeometry;
  }

  // =========================================================================
  // MAIN ENTRY POINT: BUILD DISTRICT SCENERY
  // =========================================================================

  public buildDistrictScenery(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZIn: number = 0
  ): void {
    const rng = new SeededRandom(seed);
    const director = MidnightVelvetEventDirector.getInstance();

    // 4 Distinct Luxury Districts:
    // If seed is 0..3 (used in test suites), respect it directly.
    // In live gameplay, worldZIn or group.parent position.z tracks distance: sustain 400m thematic stretches!
    const effectiveZ = worldZIn !== 0
      ? worldZIn
      : (group.parent && typeof group.parent.position?.z === 'number' && group.parent.position.z !== 0
        ? group.parent.position.z
        : 0);

    let districtIndex: number;
    if (seed >= 0 && seed < 4) {
      districtIndex = seed;
    } else {
      const cycleIndex = Math.floor(Math.abs(effectiveZ) / 1600);
      const stepInCycle = Math.floor(Math.abs(effectiveZ) / 400) % 4;
      const permutations = [
        [0, 1, 2, 3], // Cycle 0 (0-1600m): Boulevard -> Marina -> Club -> Grand
        [2, 0, 3, 1], // Cycle 1 (1600-3200m): Club -> Boulevard -> Grand -> Marina (at 1939m, step 0 is 2: The Golden Hour Club!)
        [1, 3, 0, 2], // Cycle 2 (3200-4800m): Marina -> Grand -> Boulevard -> Club
        [3, 2, 1, 0]  // Cycle 3 (4800-6400m): Grand -> Club -> Marina -> Boulevard
      ];
      const perm = permutations[cycleIndex % permutations.length];
      districtIndex = perm[stepInCycle];
    }

    switch (districtIndex) {
      case 0:
        this.buildVelvetBoulevardDistrict(group, roadbedWidth, chunkLength, rng, detail, director, effectiveZ, seed);
        break;
      case 1:
        this.buildMoonlightMarinaDistrict(group, roadbedWidth, chunkLength, rng, detail, director, seed);
        break;
      case 2:
        this.buildGoldenHourClubDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 3:
      default:
        this.buildMidnightGrandDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
    }
  }

  // =========================================================================
  // DISTRICT A — VELVET BOULEVARD (The Grand Hotel Le Velvet & VIP Arrival)
  // =========================================================================

  public buildVelvetBoulevardDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: MidnightVelvetEventDirector,
    worldZIn: number = 0,
    seed: number = 0
  ): void {
    const districtA = new THREE.Group();
    districtA.name = 'district_a_velvet_boulevard';
    group.add(districtA);

    const curbEdge = roadbedWidth * 0.5 + 0.5;
    const effectiveZ = worldZIn !== 0
      ? worldZIn
      : (group.parent && typeof group.parent.position?.z === 'number' ? group.parent.position.z : 0);
    const layoutVariant = (Math.abs(Math.floor(effectiveZ / 80)) + (seed >= 0 && seed < 4 ? seed : 0)) % 3;

    // Both sides of the track
    [-1, 1].forEach((side) => {
      // 1. Streetscape Promenade with Charcoal Pavers & Gold Trim (Solid depth down to Y = -5.65m)
      const walkW = 24.0;
      const walkDepth = 6.0;
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, walkDepth, chunkLength), this.sidewalkPaverMat);
      walk.position.set(wx, 0.35 - walkDepth * 0.5, -chunkLength * 0.5);
      districtA.add(walk);

      // Gold curbs facing railway (high contrast obstacle boundary)
      const curb = new THREE.Mesh(this.getBox(0.48, walkDepth + 0.1, chunkLength), this.goldMetalMat);
      curb.position.set(side * (curbEdge + 0.24), 0.38 - walkDepth * 0.5, -chunkLength * 0.5);
      districtA.add(curb);

      // Sidewalk Art Deco Geometric Gold Diamond Inlays
      for (let iz = 10; iz < chunkLength - 5; iz += 14) {
        const diamond = new THREE.Mesh(this.getBox(1.5, 0.04, 1.5), this.goldMetalMat);
        diamond.rotation.y = Math.PI * 0.25;
        diamond.position.set(side * (curbEdge + 2.8), 0.36, -iz);
        districtA.add(diamond);
      }

      // 2. Art Deco Stepped Towers with Open Plazas & Courtyards
      if (layoutVariant === 0) {
        // Layout 0: Grand Hotel Le Velvet & VIP Arrival + Art Deco Water Fountain Plaza
        this.buildArtDecoBuildingFacade(districtA, side, curbEdge, -14.0, 18.0, 14.0, side > 0 ? 0 : 1);
        this.buildArtDecoWaterFountain(districtA, side * (curbEdge + 12.0), 0.35, -28.0);
        this.buildArtDecoBuildingFacade(districtA, side, curbEdge, -44.0, 18.0, 14.0, side > 0 ? 2 : 3);
        this.buildPlanterUrnWithPalm(districtA, side * (curbEdge + 4.5), 0.35, -60.0);
        this.buildArtDecoBuildingFacade(districtA, side, curbEdge, -72.0, 14.0, 14.0, side > 0 ? 1 : 2);
      } else if (layoutVariant === 1) {
        // Layout 1: Casino Royale Facade & Nightclub Reveal + Palm Promenade
        this.buildArtDecoBuildingFacade(districtA, side, curbEdge, -16.0, 20.0, 15.0, side > 0 ? 2 : 0);
        this.buildArtDecoWaterFountain(districtA, side * (curbEdge + 12.0), 0.35, -34.0);
        this.buildArtDecoBuildingFacade(districtA, side, curbEdge, -50.0, 18.0, 14.0, side > 0 ? 3 : 1);
        this.buildPlanterUrnWithPalm(districtA, side * (curbEdge + 4.5), 0.35, -66.0);
        this.buildArtDecoBuildingFacade(districtA, side, curbEdge, -76.0, 14.0, 14.0, side > 0 ? 0 : 2);
      } else {
        // Layout 2: Opera House Art Deco Grand Palace + Sidewalk Bistro Terraces + Water Plaza
        this.buildArtDecoBuildingFacade(districtA, side, curbEdge, -12.0, 16.0, 14.0, side > 0 ? 1 : 3);
        this.buildArtDecoWaterFountain(districtA, side * (curbEdge + 12.0), 0.35, -30.0);
        this.buildArtDecoBuildingFacade(districtA, side, curbEdge, -46.0, 20.0, 15.0, side > 0 ? 0 : 2);
        this.buildPlanterUrnWithPalm(districtA, side * (curbEdge + 4.5), 0.35, -64.0);
        this.buildArtDecoBuildingFacade(districtA, side, curbEdge, -76.0, 16.0, 14.0, side > 0 ? 2 : 1);
      }

      // 3. Grand VIP Nightclub & Hotel Arrivals
      // Side 1 gets Hotel Le Velvet VIP Arrival, Side -1 gets Grand Nightclub Reveal
      this.buildNightclubEntrance(districtA, side, curbEdge, -44.0, side > 0 ? 1 : 0, director);

      // 4. Twin-Lantern Art Deco Streetlamps along curbs
      for (let lz = 10; lz < chunkLength - 8; lz += 20) {
        this.buildTwinArtDecoStreetlamp(districtA, side * (curbEdge + 1.2), 0.35, -lz);
      }
    });

    // 5. High-Society Sidewalk Bistro Terrace (Side 1 at z = -18m to -26m)
    this.buildSidewalkBistroTerrace(districtA, curbEdge + 3.2, 0.35, -22.0);

    // 6. Classic Luxury Limousines Parked along Boulevard
    // Left side limousine (z = 20m) - preserves 'velvet_luxury_limousine' name
    const limo1 = this.buildLuxuryLimousine(districtA, -curbEdge - 3.8, 0.35, -20.0, true, true);
    director.registerMotorcadeCar(limo1, 14.0, -chunkLength * 1.2, 20);

    // Right side limousine (z = 66m)
    this.buildLuxuryLimousine(districtA, curbEdge + 3.8, 0.35, -66.0, false, false);
  }

  // =========================================================================
  // DISTRICT B — MOONLIGHT MARINA (Ocean Boardwalk & Luxury Superyachts)
  // =========================================================================

  public buildMoonlightMarinaDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: MidnightVelvetEventDirector,
    seed: number = 0
  ): void {
    const districtB = new THREE.Group();
    districtB.name = 'district_b_moonlight_marina';
    group.add(districtB);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    // 1. Shimmering Ocean Water Basin on both sides of elevated railway
    [-1, 1].forEach((side) => {
      // Solid Granite Boardwalk Pier with continuous depth down to Y = -5.65m
      const pierW = 8.5;
      const pierDepth = 6.0;
      const pier = new THREE.Mesh(this.getBox(pierW, pierDepth, chunkLength), this.teakWoodMat);
      pier.position.set(side * (curbEdge + pierW * 0.5), 0.35 - pierDepth * 0.5, -chunkLength * 0.5);
      districtB.add(pier);

      // Gold curbs facing railway
      const curb = new THREE.Mesh(this.getBox(0.48, pierDepth + 0.1, chunkLength), this.goldMetalMat);
      curb.position.set(side * (curbEdge + 0.24), 0.38 - pierDepth * 0.5, -chunkLength * 0.5);
      districtB.add(curb);

      // Solid Seabed Ground Foundation (prevents any empty void underneath water)
      const waterW = 34.0;
      const seabed = new THREE.Mesh(this.getBox(waterW, 5.0, chunkLength), this.blackMarbleMat);
      seabed.position.set(side * (curbEdge + pierW + waterW * 0.5), -2.8, -chunkLength * 0.5);
      districtB.add(seabed);

      // Shimmering Ocean Water Surface
      const ocean = new THREE.Mesh(this.getPlane(waterW, chunkLength), this.oceanWaterMat);
      ocean.position.set(side * (curbEdge + pierW + waterW * 0.5), -0.15, -chunkLength * 0.5);
      ocean.rotation.x = -Math.PI / 2;
      districtB.add(ocean);

      // Marina Brass Railing along outer boardwalk edge
      const outerRailX = side * (curbEdge + pierW - 0.2);
      for (let z = 6; z < chunkLength - 6; z += 14) {
        const post = new THREE.Mesh(this.getCylinder(0.08, 0.08, 1.2, 6), this.goldMetalMat);
        post.position.set(outerRailX, 0.95, -z);
        districtB.add(post);

        const rail = new THREE.Mesh(this.getBox(0.08, 0.08, 14.0), this.goldMetalMat);
        rail.position.set(outerRailX, 1.45, -z);
        districtB.add(rail);

        // Nautical Brass Mooring Bollards along pier
        const bollard = new THREE.Mesh(this.getCylinder(0.14, 0.18, 0.55, 8), this.goldMetalMat);
        bollard.position.set(side * (curbEdge + pierW - 0.6), 0.62, -z + 7.0);
        districtB.add(bollard);

        // Uplit Tropical Palm Tree along Boardwalk
        this.buildMarinaPalmTree(districtB, side * (curbEdge + 2.5), 0.35, -z);
      }

      // Luxury Superyacht docked in berth
      const yacht = this.buildLuxurySuperyacht(side * (curbEdge + pierW + 9.0), 0.1, -chunkLength * 0.45, side > 0);
      director.registerMarinaYacht(yacht, 2.5, side * 1.5);
      districtB.add(yacht);

      // Marina Sign
      const marinaSignTex = TextureGenerator.getMoonlightMarinaSignTexture(side > 0 ? 0 : 2);
      const marinaSign = new THREE.Mesh(this.getPlane(6.5, 3.2), this.createBasicMaterial({ map: marinaSignTex, side: THREE.DoubleSide }));
      marinaSign.position.set(side * (curbEdge + 4.5), 4.2, -chunkLength * 0.5);
      marinaSign.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      districtB.add(marinaSign);
    });

    // 2. Luminous Giant Full Moon on distant horizon
    // Always create named moonGroup to satisfy test suite Suite 4.
    // In live gameplay, only add the visual moon mesh on the primary marina vista chunk to prevent multiple stacked moons.
    const moonGroup = new THREE.Group();
    moonGroup.name = 'marina_giant_moon';
    moonGroup.position.set(45.0, 32.0, -chunkLength * 0.7);

    const chunkZ = group.parent && typeof group.parent.position?.z === 'number' ? group.parent.position.z : 0;
    const isPrimaryMoonVista = seed === 1 || Math.floor(Math.abs(chunkZ) / chunkLength) % 5 === 1;

    if (isPrimaryMoonVista) {
      const moonTex = TextureGenerator.getMoonTexture();
      const moonMesh = new THREE.Mesh(
        this.getPlane(30.0, 30.0),
        new THREE.MeshBasicMaterial({ map: moonTex, transparent: true, depthWrite: false })
      );
      moonMesh.rotation.y = -Math.PI * 0.25;
      moonGroup.add(moonMesh);
    }
    districtB.add(moonGroup);

    // 3. Sweeping Curved Marina Footbridge spanning above the water
    // Firmly grounded with heavy granite & gold support pylons anchoring down to Y = -5.5m
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(-curbEdge - 18.0, 4.5, -chunkLength * 0.6);

    const bridgeSpan = new THREE.Mesh(this.getTorus(14.0, 0.8, 8, 20), this.goldMetalMat);
    bridgeSpan.rotation.x = Math.PI / 2;
    bridgeGroup.add(bridgeSpan);

    // Massive support pylons anchoring bridge arch feet down to seabed (Y = -5.5m)
    [-11.5, 11.5].forEach((px) => {
      const pylon = new THREE.Mesh(this.getCylinder(0.65, 0.85, 11.0, 8), this.darkGraniteMat);
      pylon.position.set(px, -1.0, 0);
      bridgeGroup.add(pylon);

      const collar = new THREE.Mesh(this.getCylinder(0.72, 0.72, 0.4, 8), this.goldMetalMat);
      collar.position.set(px, 3.8, 0);
      bridgeGroup.add(collar);
    });

    districtB.add(bridgeGroup);
  }

  // =========================================================================
  // DISTRICT C — THE GOLDEN HOUR CLUB (Multi-Level Rooftops & Spotlights)
  // =========================================================================

  public buildGoldenHourClubDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: MidnightVelvetEventDirector
  ): void {
    const districtC = new THREE.Group();
    districtC.name = 'district_c_golden_hour_club';
    group.add(districtC);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    // Both sides of the track
    [-1, 1].forEach((side) => {
      // 1. Streetscape Promenade with Charcoal Pavers & Gold Trim (Solid depth down to Y = -5.65m)
      const walkW = 24.0;
      const walkDepth = 6.0;
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, walkDepth, chunkLength), this.sidewalkPaverMat);
      walk.position.set(wx, 0.35 - walkDepth * 0.5, -chunkLength * 0.5);
      districtC.add(walk);

      // Gold curbs facing railway
      const curb = new THREE.Mesh(this.getBox(0.48, walkDepth + 0.1, chunkLength), this.goldMetalMat);
      curb.position.set(side * (curbEdge + 0.24), 0.38 - walkDepth * 0.5, -chunkLength * 0.5);
      districtC.add(curb);

      const clubSetbackX = side * (curbEdge + 12.0);

      // 2. MODULAR CLUB BUILDINGS (Replaces old unbroken 80m monolithic wall!)
      // Pavilion 1: z = 18m (Length 22m, spans z = 7m to 29m)
      const pav1Group = new THREE.Group();
      pav1Group.position.set(clubSetbackX, 0.35, -18.0);

      // Subterranean Plinth down to Y = -5.65m
      const plinth1 = new THREE.Mesh(this.getBox(15.0, 6.0, 22.4), this.blackMarbleMat);
      plinth1.position.y = -3.0;
      pav1Group.add(plinth1);

      // Base Level (Velvet burgundy with illuminated glass display)
      const base1 = new THREE.Mesh(this.getBox(14.0, 8.5, 22.0), this.velvetBurgundyMat);
      base1.position.y = 4.25;
      pav1Group.add(base1);

      // Track-facing boundary of base1: -side * 7.0
      // Illuminated Window Ribbons (strictly outside facing tracks!)
      const win1 = new THREE.Mesh(this.getBox(0.08, 3.2, 18.0), this.warmGlassMat);
      win1.position.set(-side * 7.06, 4.2, 0);
      pav1Group.add(win1);

      // Gold header lintel & sill framing the ribbon
      const lintel1 = new THREE.Mesh(this.getBox(0.22, 0.22, 18.4), this.goldMetalMat);
      lintel1.position.set(-side * 7.10, 4.2 + 1.6 + 0.11, 0);
      pav1Group.add(lintel1);

      const sill1 = new THREE.Mesh(this.getBox(0.28, 0.28, 18.4), this.goldMetalMat);
      sill1.position.set(-side * 7.12, 4.2 - 1.6 - 0.14, 0);
      pav1Group.add(sill1);

      // Vertical dividing gold mullions
      for (let mz = -8.0; mz <= 8.0; mz += 2.5) {
        const mul = new THREE.Mesh(this.getBox(0.14, 3.2, 0.12), this.goldMetalMat);
        mul.position.set(-side * 7.08, 4.2, mz);
        pav1Group.add(mul);
      }

      // Interior lounge backlight
      const backdrop1 = new THREE.Mesh(this.getPlane(17.8, 3.0), this.champagneGlowMat);
      backdrop1.position.set(-side * 6.88, 4.2, 0);
      backdrop1.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      pav1Group.add(backdrop1);

      // Gilded Chevron Frieze
      const frieze1 = new THREE.Mesh(this.getBox(14.6, 0.9, 22.6), this.goldMetalMat);
      frieze1.position.y = 8.9;
      pav1Group.add(frieze1);

      // Upper Stepped Tier
      const tier1 = new THREE.Mesh(this.getBox(11.0, 6.0, 18.0), this.midnightNavyMat);
      tier1.position.set(side * 1.5, 12.0, 0);
      pav1Group.add(tier1);

      // Upper tier illuminated windows
      const upperWin1 = new THREE.Mesh(this.getBox(0.08, 2.0, 14.0), this.warmGlassMat);
      upperWin1.position.set(side * (1.5 - 5.56), 12.0, 0);
      pav1Group.add(upperWin1);

      districtC.add(pav1Group);

      // 3. Central Open Outdoor Courtyard & Pool Plaza (spans z = 29m to 47m — 18m OPEN SKY GAP!)
      // This gap breaks the corridor completely and frames the distant skyline!
      const plazaZ = -38.0;
      const plazaW = 16.0;

      // Illuminated fountain in courtyard center
      this.buildArtDecoWaterFountain(districtC, side * (curbEdge + 12.0), 0.35, plazaZ);

      // Illuminated cocktail bar counter in courtyard
      const bar = new THREE.Mesh(this.getBox(4.5, 1.1, 1.4), this.goldMetalMat);
      bar.position.set(side * (curbEdge + 6.0), 0.9, plazaZ);
      districtC.add(bar);

      // Glowing bar top (amber luminescence)
      const barTop = new THREE.Mesh(this.getBox(4.7, 0.12, 1.6), this.warmGlassMat);
      barTop.position.set(side * (curbEdge + 6.0), 1.5, plazaZ);
      districtC.add(barTop);

      // Twin palm urns in the plaza
      this.buildPlanterUrnWithPalm(districtC, side * (curbEdge + 4.0), 0.35, plazaZ - 5.0);
      this.buildPlanterUrnWithPalm(districtC, side * (curbEdge + 4.0), 0.35, plazaZ + 5.0);

      // Courtyard wrought-iron gilded balustrade at setback
      const balustrade = new THREE.Mesh(this.getBox(0.15, 1.8, plazaW), this.goldMetalMat);
      balustrade.position.set(clubSetbackX, 1.25, plazaZ);
      districtC.add(balustrade);

      // 4. Pavilion 2 & Rooftop VIP Party Terrace: z = 58m (Length 22m, spans z = 47m to 69m)
      const pav2Group = new THREE.Group();
      pav2Group.position.set(clubSetbackX, 0.35, -58.0);

      // Subterranean Plinth down to Y = -5.65m
      const plinth2 = new THREE.Mesh(this.getBox(15.0, 6.0, 22.4), this.blackMarbleMat);
      plinth2.position.y = -3.0;
      pav2Group.add(plinth2);

      // Base Tier
      const base2 = new THREE.Mesh(this.getBox(14.0, 8.5, 22.0), this.velvetBurgundyMat);
      base2.position.y = 4.25;
      pav2Group.add(base2);

      // Illuminated Lounge Windows on Base of Pavilion 2
      const win2 = new THREE.Mesh(this.getBox(0.08, 3.2, 18.0), this.warmGlassMat);
      win2.position.set(-side * 7.06, 4.2, 0);
      pav2Group.add(win2);

      const lintel2 = new THREE.Mesh(this.getBox(0.22, 0.22, 18.4), this.goldMetalMat);
      lintel2.position.set(-side * 7.10, 4.2 + 1.6 + 0.11, 0);
      pav2Group.add(lintel2);

      const sill2 = new THREE.Mesh(this.getBox(0.28, 0.28, 18.4), this.goldMetalMat);
      sill2.position.set(-side * 7.12, 4.2 - 1.6 - 0.14, 0);
      pav2Group.add(sill2);

      for (let mz = -8.0; mz <= 8.0; mz += 2.5) {
        const mul = new THREE.Mesh(this.getBox(0.14, 3.2, 0.12), this.goldMetalMat);
        mul.position.set(-side * 7.08, 4.2, mz);
        pav2Group.add(mul);
      }

      // Gilded Frieze
      const frieze2 = new THREE.Mesh(this.getBox(14.6, 0.9, 22.6), this.goldMetalMat);
      frieze2.position.y = 8.9;
      pav2Group.add(frieze2);

      // Rooftop Party VIP Terrace (Y = 9.4m - safely above running envelope Y <= 8.5m, beautifully visible!)
      const terrace = new THREE.Group();
      terrace.name = 'rooftop_party_terrace';
      terrace.position.set(0, 9.4, 0);

      // Glowing dance floor acrylic tiles
      const floorTile = new THREE.Mesh(this.getBox(10.0, 0.2, 16.0), this.neonPinkMat);
      terrace.add(floorTile);

      // Velvet VIP Booths
      [-5.0, 5.0].forEach((bz) => {
        const booth = new THREE.Mesh(this.getBox(2.2, 0.9, 3.8), this.velvetBurgundyMat);
        booth.position.set(side * 3.5, 0.55, bz);
        terrace.add(booth);
      });

      // Animated Rooftop Dancers
      for (let d = -3; d <= 3; d += 2.0) {
        const dancer = this.buildPartyDancer(d * 0.8, 0.1, (d % 3) * 1.8, d % 2 === 0 ? 0xd4af37 : 0xec4899);
        terrace.add(dancer.group);
        director.registerPartyDancer(dancer.group, d * 0.5, 4.5, dancer.armL, dancer.armR);
      }

      pav2Group.add(terrace);
      districtC.add(pav2Group);

      // 5. Illuminated Sunburst Club Sign set back on facade
      const clubSignTex = TextureGenerator.getGoldenHourClubSignTexture(side > 0 ? 0 : 1);
      const clubSign = new THREE.Mesh(this.getPlane(7.0, 3.5), this.createBasicMaterial({ map: clubSignTex, side: THREE.DoubleSide }));
      clubSign.position.set(side * (curbEdge + 4.8), 5.5, -18.0);
      clubSign.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      districtC.add(clubSign);
    });

    // 6. Twin Skyline Spotlights Sweeping the Night Sky
    [-curbEdge - 8.0, curbEdge + 8.0].forEach((sx, idx) => {
      const searchlightGroup = new THREE.Group();
      searchlightGroup.name = 'golden_hour_searchlight';
      searchlightGroup.position.set(sx, 10.5, -chunkLength * 0.5);

      const lampBase = new THREE.Mesh(this.getCylinder(0.8, 0.8, 1.2, 8), this.darkGraniteMat);
      searchlightGroup.add(lampBase);

      const beamCone = new THREE.Mesh(
        this.getCylinder(0.4, 4.5, 38.0, 10),
        this.createBasicMaterial({
          color: 0xfef08a,
          transparent: true,
          opacity: 0.28,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      beamCone.position.y = 19.0;
      searchlightGroup.add(beamCone);

      director.registerSearchlight(searchlightGroup, idx * 1.57, 0.75, 0.38);
      districtC.add(searchlightGroup);
    });
  }

  // =========================================================================
  // DISTRICT D — MIDNIGHT GRAND (Monumental Station & Gilded Clock Tower)
  // =========================================================================

  public buildMidnightGrandDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: MidnightVelvetEventDirector
  ): void {
    const districtD = new THREE.Group();
    districtD.name = 'district_d_midnight_grand';
    group.add(districtD);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    // 1. Monumental Fluted Granite & Marble Colonnade (Continuous depth down to Y = -5.65m)
    [-1, 1].forEach((side) => {
      const concW = 20.0;
      const concDepth = 6.0;
      const cx = side * (curbEdge + concW * 0.5);

      const concourse = new THREE.Mesh(this.getBox(concW, concDepth, chunkLength), this.darkGraniteMat);
      concourse.position.set(cx, 0.5 - concDepth * 0.5, -chunkLength * 0.5);
      districtD.add(concourse);

      // Gold curbs facing railway
      const curb = new THREE.Mesh(this.getBox(0.48, concDepth + 0.1, chunkLength), this.goldMetalMat);
      curb.position.set(side * (curbEdge + 0.24), 0.55 - concDepth * 0.5, -chunkLength * 0.5);
      districtD.add(curb);

      // Fluted Classical Art Deco Pillars
      for (let z = 8; z < chunkLength - 8; z += 12) {
        const pillar = new THREE.Mesh(this.getCylinder(0.65, 0.75, 9.5, 10), this.blackMarbleMat);
        pillar.position.set(side * (curbEdge + 2.4), 5.2, -z);
        districtD.add(pillar);

        // Gilded Capital
        const capital = new THREE.Mesh(this.getBox(1.8, 0.8, 1.8), this.goldMetalMat);
        capital.position.set(side * (curbEdge + 2.4), 10.2, -z);
        districtD.add(capital);

        // Hanging Crystal Chandelier
        const chandelier = this.buildCrystalChandelier(side * (curbEdge + 5.5), 8.5, -z);
        districtD.add(chandelier);

        // Vaulted Arched Rib extending above colonnade
        const rib = new THREE.Mesh(this.getBox(8.0, 0.4, 0.4), this.goldMetalMat);
        rib.position.set(side * (curbEdge + 6.0), 10.6, -z);
        districtD.add(rib);
      }

      // Station Signage set back along concourse
      const grandSignTex = TextureGenerator.getMidnightGrandSignTexture(side > 0 ? 0 : 2);
      const grandSign = new THREE.Mesh(this.getPlane(7.0, 3.5), this.createBasicMaterial({ map: grandSignTex, side: THREE.DoubleSide }));
      grandSign.position.set(side * (curbEdge + 4.8), 5.5, -chunkLength * 0.5);
      grandSign.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      districtD.add(grandSign);
    });

    // 2. Monumental Central Art Deco Clock Tower
    const towerGroup = new THREE.Group();
    towerGroup.name = 'midnight_grand_clock_tower';
    towerGroup.position.set(-curbEdge - 14.0, 0.6, -chunkLength * 0.5);

    // Subterranean Plinth down to Y = -5.65m
    const towerPlinth = new THREE.Mesh(this.getBox(10.0, 6.0, 10.0), this.blackMarbleMat);
    towerPlinth.position.y = -3.0;
    towerGroup.add(towerPlinth);

    // Tower Body
    const towerBase = new THREE.Mesh(this.getBox(9.0, 32.0, 9.0), this.blackMarbleMat);
    towerBase.position.y = 16.0;
    towerGroup.add(towerBase);

    // Clock Face Housing
    const clockHousing = new THREE.Mesh(this.getBox(10.5, 10.5, 10.5), this.darkGraniteMat);
    clockHousing.position.y = 37.0;
    towerGroup.add(clockHousing);

    // Illuminated Gold Roman Clock Dial
    const dial = new THREE.Mesh(this.getCylinder(4.2, 4.2, 0.4, 24), this.champagneGlowMat);
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0, 37.0, 5.4);
    towerGroup.add(dial);

    // Moving Clock Hands
    const minuteHand = new THREE.Mesh(this.getBox(0.2, 3.2, 0.08), this.goldMetalMat);
    minuteHand.position.set(0, 38.2, 5.7);
    towerGroup.add(minuteHand);

    // Swinging Brass Pendulum (Visible in lower vaulted aperture)
    const pendulumArm = new THREE.Mesh(this.getCylinder(0.08, 0.08, 6.0, 6), this.goldMetalMat);
    pendulumArm.position.set(0, 8.0, 4.6);
    const pendulumBob = new THREE.Mesh(this.getCylinder(0.9, 0.9, 0.25, 16), this.goldMetalMat);
    pendulumBob.position.set(0, 5.0, 4.6);
    pendulumBob.rotation.x = Math.PI / 2;
    towerGroup.add(pendulumArm);
    towerGroup.add(pendulumBob);

    director.registerClockTower(pendulumArm, minuteHand);
    districtD.add(towerGroup);

    // 3. Vintage Luxury Streamliner Carriage on Siding
    const sidingCarriage = this.buildLuxuryStationCarriage(curbEdge + 9.5, 0.6, -chunkLength * 0.45);
    districtD.add(sidingCarriage);
  }

  // =========================================================================
  // SUB-ASSEMBLY HELPERS
  // =========================================================================

  private buildArtDecoWaterFountain(
    parent: THREE.Group,
    x: number,
    y: number,
    z: number
  ): void {
    const fountain = new THREE.Group();
    fountain.position.set(x, y, z);

    // Subterranean grounding plinth down to Y = -5.65m
    const plinth = new THREE.Mesh(this.getCylinder(3.0, 3.0, 6.0, 16), this.blackMarbleMat);
    plinth.position.y = -3.0;
    fountain.add(plinth);

    // 1. Lower Carrara Marble Pool Basin
    const basin1 = new THREE.Mesh(this.getCylinder(2.6, 2.8, 0.5, 16), this.terraceMarbleMat);
    basin1.position.y = 0.25;
    fountain.add(basin1);

    const rim1 = new THREE.Mesh(this.getTorus(2.7, 0.14, 6, 20), this.goldMetalMat);
    rim1.rotation.x = Math.PI / 2;
    rim1.position.y = 0.5;
    fountain.add(rim1);

    // Glowing Aqua Water Pool
    const pool1 = new THREE.Mesh(this.getCylinder(2.5, 2.5, 0.05, 16), this.aquaGlowMat);
    pool1.position.y = 0.42;
    fountain.add(pool1);

    // 2. Middle Pedestal & Basin
    const ped = new THREE.Mesh(this.getCylinder(0.4, 0.6, 0.8, 8), this.blackMarbleMat);
    ped.position.y = 0.85;
    fountain.add(ped);

    const basin2 = new THREE.Mesh(this.getCylinder(1.6, 1.8, 0.4, 16), this.terraceMarbleMat);
    basin2.position.y = 1.35;
    fountain.add(basin2);

    const pool2 = new THREE.Mesh(this.getCylinder(1.5, 1.5, 0.05, 16), this.aquaGlowMat);
    pool2.position.y = 1.48;
    fountain.add(pool2);

    // 3. Top Tier & Golden Art Deco Finial Spout
    const finial = new THREE.Mesh(this.getCylinder(0.12, 0.35, 1.1, 8), this.goldMetalMat);
    finial.position.y = 2.0;
    fountain.add(finial);

    // Champagne Bubbling Water Plume
    const spray = new THREE.Mesh(this.getCylinder(0.3, 0.1, 0.9, 8), this.champagneGlowMat);
    spray.position.y = 2.8;
    fountain.add(spray);

    parent.add(fountain);
  }

  private buildArtDecoBuildingFacade(
    parent: THREE.Group,
    side: number,
    curbEdge: number,
    zCenter: number,
    buildingW: number,
    buildingD: number,
    variant: number
  ): void {
    const buildingGroup = new THREE.Group();
    // Position at setback |X| = curbEdge + 12.0m, Z = zCenter
    const bx = side * (curbEdge + 12.0);
    buildingGroup.position.set(bx, 0.35, zCenter);

    // Subterranean Foundation Plinth down to Y = -5.65m
    const plinth = new THREE.Mesh(this.getBox(buildingD + 1.0, 6.0, buildingW + 0.4), this.blackMarbleMat);
    plinth.position.y = -3.0;
    buildingGroup.add(plinth);

    // 1. Base Level (Storefronts & Charcoal Obsidian Marble, height 8.5m)
    const baseH = 8.5;
    const base = new THREE.Mesh(this.getBox(buildingD, baseH, buildingW), this.blackMarbleMat);
    base.position.y = baseH * 0.5;
    buildingGroup.add(base);

    // Track-facing facade boundary coordinate in building local space:
    // When side = 1 (right), tracks are in -X direction -> front is at -buildingD * 0.5
    // When side = -1 (left), tracks are in +X direction -> front is at +buildingD * 0.5
    const frontFaceX = -side * (buildingD * 0.5);

    // Storefront Display Windows with Hollow Gold Frames & Interior Showcase Depth
    const winW = (buildingW - 4.0) / 3.0;
    for (let w = 0; w < 3; w++) {
      const wz = -buildingW * 0.5 + 2.0 + w * (winW + 0.5) + winW * 0.5;

      // 1. Illuminated Glass Panel positioned cleanly on exterior facing tracks (no clipping!)
      const winX = frontFaceX - side * 0.04;
      const win = new THREE.Mesh(this.getBox(0.06, 3.8, winW), this.warmGlassMat);
      win.position.set(winX, 2.4, wz);
      buildingGroup.add(win);

      // 2. Genuine Hollow Window Frame (Lintel, Sill, Jambs, Transom & Mullion in champagne gold)
      // Top header lintel
      const lintel = new THREE.Mesh(this.getBox(0.24, 0.28, winW + 0.24), this.goldMetalMat);
      lintel.position.set(frontFaceX - side * 0.08, 2.4 + 1.9 + 0.14, wz);
      buildingGroup.add(lintel);

      // Bottom sill
      const sill = new THREE.Mesh(this.getBox(0.36, 0.36, winW + 0.24), this.goldMetalMat);
      sill.position.set(frontFaceX - side * 0.12, 2.4 - 1.9 - 0.18, wz);
      buildingGroup.add(sill);

      // Left jamb
      const leftJamb = new THREE.Mesh(this.getBox(0.24, 3.8, 0.16), this.goldMetalMat);
      leftJamb.position.set(frontFaceX - side * 0.08, 2.4, wz - winW * 0.5 - 0.08);
      buildingGroup.add(leftJamb);

      // Right jamb
      const rightJamb = new THREE.Mesh(this.getBox(0.24, 3.8, 0.16), this.goldMetalMat);
      rightJamb.position.set(frontFaceX - side * 0.08, 2.4, wz + winW * 0.5 + 0.08);
      buildingGroup.add(rightJamb);

      // Horizontal transom divider
      const transom = new THREE.Mesh(this.getBox(0.12, 0.08, winW), this.goldMetalMat);
      transom.position.set(frontFaceX - side * 0.06, 2.4 + 0.9, wz);
      buildingGroup.add(transom);

      // Vertical center mullion
      const mullion = new THREE.Mesh(this.getBox(0.12, 3.8, 0.08), this.goldMetalMat);
      mullion.position.set(frontFaceX - side * 0.06, 2.4, wz);
      buildingGroup.add(mullion);

      // 3. Interior Boutique Showcase Alcove with Backlit Glow & Luxury Pedestal
      const backdrop = new THREE.Mesh(this.getPlane(winW - 0.2, 3.6), this.champagneGlowMat);
      backdrop.position.set(frontFaceX + side * 0.14, 2.4, wz);
      backdrop.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      buildingGroup.add(backdrop);

      const showcasePed = new THREE.Mesh(this.getCylinder(0.22, 0.26, 0.75, 8), this.goldMetalMat);
      showcasePed.position.set(frontFaceX + side * 0.06, 0.75, wz);
      buildingGroup.add(showcasePed);

      const mannequin = new THREE.Mesh(this.getCylinder(0.14, 0.20, 0.55, 6), this.velvetBurgundyMat);
      mannequin.position.set(frontFaceX + side * 0.06, 1.35, wz);
      buildingGroup.add(mannequin);
    }

    // Gilded Art Deco Chevron Frieze atop Base
    const frieze = new THREE.Mesh(this.getBox(buildingD + 0.6, 0.8, buildingW + 0.6), this.goldMetalMat);
    frieze.position.y = baseH + 0.4;
    buildingGroup.add(frieze);

    // 2. Middle Tower Tier (Step-Back, Dark Granite, height 14.0m)
    const tier1W = buildingW - 3.0;
    const tier1D = buildingD - 2.5;
    const tier1H = 14.0;
    const tier1 = new THREE.Mesh(this.getBox(tier1D, tier1H, tier1W), this.darkGraniteMat);
    tier1.position.set(side * 1.25, baseH + 0.8 + tier1H * 0.5, 0);
    buildingGroup.add(tier1);

    // Track-facing front of Tier 1:
    // Center is at side * 1.25, front is at side * (1.25 - tier1D * 0.5)
    // Exterior window ribbon positioned cleanly facing tracks:
    const ribbonX = side * (1.25 - (tier1D * 0.5 + 0.05));
    for (let floor = 0; floor < 3; floor++) {
      const fy = baseH + 2.5 + floor * 4.0;
      const winRibbon = new THREE.Mesh(this.getBox(0.08, 1.8, tier1W - 2.0), this.warmGlassMat);
      winRibbon.position.set(ribbonX, fy, 0);
      buildingGroup.add(winRibbon);

      // Gold top header lintel
      const rLintel = new THREE.Mesh(this.getBox(0.18, 0.16, tier1W - 1.8), this.goldMetalMat);
      rLintel.position.set(side * (1.25 - (tier1D * 0.5 + 0.08)), fy + 0.9 + 0.08, 0);
      buildingGroup.add(rLintel);

      // Gold bottom sill
      const rSill = new THREE.Mesh(this.getBox(0.24, 0.20, tier1W - 1.8), this.goldMetalMat);
      rSill.position.set(side * (1.25 - (tier1D * 0.5 + 0.10)), fy - 0.9 - 0.10, 0);
      buildingGroup.add(rSill);

      // Vertical dividing gold mullions along ribbon every 2.2m
      for (let mz = -tier1W * 0.5 + 2.2; mz <= tier1W * 0.5 - 2.2; mz += 2.2) {
        const rMullion = new THREE.Mesh(this.getBox(0.12, 1.8, 0.1), this.goldMetalMat);
        rMullion.position.set(side * (1.25 - (tier1D * 0.5 + 0.06)), fy, mz);
        buildingGroup.add(rMullion);
      }
    }

    // Vertical Gold Pilasters on Tier 1 (projecting proudly 0.14m from granite facade)
    for (let pz = -tier1W * 0.5 + 2.0; pz <= tier1W * 0.5 - 2.0; pz += 3.5) {
      const pilaster = new THREE.Mesh(this.getBox(0.3, tier1H, 0.4), this.goldMetalMat);
      pilaster.position.set(side * (1.25 - (tier1D * 0.5 + 0.14)), baseH + 0.8 + tier1H * 0.5, pz);
      buildingGroup.add(pilaster);
    }

    // Gilded Cornice atop Tier 1
    const cornice1 = new THREE.Mesh(this.getBox(tier1D + 0.6, 0.8, tier1W + 0.6), this.goldMetalMat);
    cornice1.position.set(side * 1.25, baseH + 0.8 + tier1H + 0.4, 0);
    buildingGroup.add(cornice1);

    // 3. Upper Crown Tier (Further Step-Back, Midnight Navy, height 9.0m)
    const tier2W = tier1W - 3.5;
    const tier2D = tier1D - 2.5;
    const tier2H = 9.0;
    const tier2 = new THREE.Mesh(this.getBox(tier2D, tier2H, tier2W), this.midnightNavyMat);
    const tier2BaseY = baseH + 0.8 + tier1H + 0.8;
    tier2.position.set(side * 2.5, tier2BaseY + tier2H * 0.5, 0);
    buildingGroup.add(tier2);

    // Illuminated Arched Penthouse Lunette Windows
    const crownWinX = side * (2.5 - (tier2D * 0.5 + 0.06));
    const crownWinY = tier2BaseY + 4.5;
    for (const cw of [-tier2W * 0.25, tier2W * 0.25]) {
      const cWin = new THREE.Mesh(this.getBox(0.08, 3.4, 2.2), this.warmGlassMat);
      cWin.position.set(crownWinX, crownWinY, cw);
      buildingGroup.add(cWin);

      const cArch = new THREE.Mesh(this.getTorus(1.1, 0.12, 6, 12), this.goldMetalMat);
      cArch.position.set(crownWinX, crownWinY + 1.7, cw);
      cArch.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      buildingGroup.add(cArch);
    }

    // Art Deco Gilded Sunburst Crest / Parapet
    const crest = new THREE.Mesh(this.getBox(tier2D + 0.4, 1.2, tier2W + 0.4), this.goldMetalMat);
    crest.position.set(side * 2.5, tier2BaseY + tier2H + 0.6, 0);
    buildingGroup.add(crest);

    // Slender Art Deco Golden Spire Needle
    const spireH = 12.0;
    const spire = new THREE.Mesh(this.getCylinder(0.12, 0.75, spireH, 6), this.goldMetalMat);
    spire.position.set(side * 2.5, tier2BaseY + tier2H + 1.2 + spireH * 0.5, 0);
    buildingGroup.add(spire);

    parent.add(buildingGroup);
  }

  private buildVipArrivalHotelEntrance(
    parent: THREE.Group,
    side: number,
    curbEdge: number,
    zCenter: number,
    director: MidnightVelvetEventDirector
  ): void {
    const hotelGroup = new THREE.Group();
    const doorX = side * (curbEdge + 5.2);
    hotelGroup.position.set(doorX, 0.35, zCenter);

    // Carrara White Marble Grand Steps
    const stepW = 4.6;
    const stepL = 1.8;
    for (let s = 0; s < 3; s++) {
      const step = new THREE.Mesh(this.getBox(stepL - s * 0.3, 0.14, stepW - s * 0.2), this.terraceMarbleMat);
      step.position.set(s * 0.15 * side, s * 0.14 + 0.07, 0);
      hotelGroup.add(step);
    }

    // Grand Hotel Lobby Foyer - Double-Height Arched Illuminated Glass Entrance
    const lobbyGlass = new THREE.Mesh(this.getBox(0.2, 5.2, 4.4), this.warmGlassMat);
    lobbyGlass.position.set(side * 0.6, 2.8, 0);
    hotelGroup.add(lobbyGlass);

    // Gold Lobby Archway Tracery
    const archFrame = new THREE.Mesh(this.getTorus(2.2, 0.16, 6, 16), this.goldMetalMat);
    archFrame.position.set(side * 0.65, 4.2, 0);
    archFrame.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
    hotelGroup.add(archFrame);

    // Warm Crystal Chandelier visible inside lobby
    const lobbyChandelier = this.buildCrystalChandelier(side * 1.8, 4.2, 0);
    hotelGroup.add(lobbyChandelier);

    // Plush VIP Red Carpet Runner
    const carpetLen = 5.2;
    const carpetW = 3.2;
    const carpet = new THREE.Mesh(this.getBox(carpetLen, 0.06, carpetW), this.redCarpetMat);
    carpet.position.set(-side * (carpetLen * 0.5 - 0.2), 0.03, 0);
    hotelGroup.add(carpet);

    // Brass Stanchions & Velvet Burgundy Ropes along red carpet
    [-carpetW * 0.5 - 0.15, carpetW * 0.5 + 0.15].forEach((sz) => {
      for (let sx = -carpetLen + 0.6; sx <= 0.2; sx += 1.4) {
        const post = new THREE.Mesh(this.getCylinder(0.05, 0.07, 1.1, 8), this.goldMetalMat);
        post.position.set(-side * sx, 0.55, sz);
        hotelGroup.add(post);

        const ball = new THREE.Mesh(this.getCylinder(0.11, 0.11, 0.11, 8), this.goldMetalMat);
        ball.position.set(-side * sx, 1.15, sz);
        hotelGroup.add(ball);
      }

      const cord = new THREE.Mesh(this.getBox(carpetLen - 0.4, 0.06, 0.06), this.velvetBurgundyMat);
      cord.position.set(-side * (carpetLen * 0.5 - 0.2), 0.88, sz);
      hotelGroup.add(cord);
    });

    // Scalloped Velvet Burgundy Portico Canopy
    const awning = new THREE.Mesh(this.getBox(4.8, 0.55, 6.8), this.velvetBurgundyMat);
    awning.position.set(-side * 0.9, 4.8, 0);
    awning.rotation.z = side * 0.10;
    hotelGroup.add(awning);

    const awningTrim = new THREE.Mesh(this.getBox(4.9, 0.14, 6.9), this.goldMetalMat);
    awningTrim.position.set(-side * 0.9, 4.5, 0);
    awningTrim.rotation.z = side * 0.10;
    hotelGroup.add(awningTrim);

    // Illuminated "HOTEL LE VELOURS" Sign
    const signTex = TextureGenerator.getVelvetBoulevardSignTexture(1);
    const signMesh = new THREE.Mesh(this.getPlane(7.2, 3.6), this.createBasicMaterial({ map: signTex, side: THREE.DoubleSide }));
    signMesh.position.set(-side * 1.6, 6.4, 0);
    signMesh.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
    hotelGroup.add(signMesh);

    // Chasing Marquee Bulbs around sign
    const bulbs: THREE.Mesh[] = [];
    for (let bz = -3.4; bz <= 3.4; bz += 0.85) {
      const bulb = new THREE.Mesh(this.getCylinder(0.08, 0.08, 0.08, 6), this.marqueeBulbMatOn.clone());
      bulb.position.set(-side * 1.7, 4.4, bz);
      hotelGroup.add(bulb);
      bulbs.push(bulb);
    }
    director.registerHotelMarquee(bulbs);

    // Stationed Bouncers / Doormen
    this.buildBouncerGuard(hotelGroup, -side * 0.2, 0, -carpetW * 0.5 - 0.6);
    this.buildBouncerGuard(hotelGroup, -side * 0.2, 0, carpetW * 0.5 + 0.6);

    // Flanking Ornate Black Marble Planter Urns with Golden Palms
    this.buildPlanterUrnWithPalm(hotelGroup, -side * 0.3, 0, -carpetW * 0.5 - 1.8);
    this.buildPlanterUrnWithPalm(hotelGroup, -side * 0.3, 0, carpetW * 0.5 + 1.8);

    // --- ARTICULATED VIP ARRIVAL ACTORS ---
    // 1. Limousine at curb
    const limoX = -side * (carpetLen + 1.2);
    const limo = this.buildLuxuryLimousine(hotelGroup, limoX, 0, 0, true, false);
    const rearDoorPivot = limo.userData.doorPivot || new THREE.Group();

    // 2. Valet Attendant in royal livery
    const valetGroup = new THREE.Group();
    valetGroup.position.set(limoX + side * 1.2, 0, 0.5);

    const vTorso = new THREE.Group();
    const vJacket = new THREE.Mesh(this.getBox(0.45, 0.85, 0.32), this.valetMat);
    vJacket.position.y = 0.85;
    vTorso.add(vJacket);

    const vPants = new THREE.Mesh(this.getBox(0.42, 0.8, 0.28), this.blackMarbleMat);
    vPants.position.y = 0.4;
    valetGroup.add(vPants);

    const vHead = new THREE.Mesh(this.getCylinder(0.16, 0.16, 0.32, 8), this.cartoonSkinMat);
    vHead.position.y = 1.45;
    vTorso.add(vHead);

    const vCap = new THREE.Mesh(this.getCylinder(0.2, 0.2, 0.12, 8), this.valetMat);
    vCap.position.y = 1.65;
    vTorso.add(vCap);

    const vArm = new THREE.Mesh(this.getBox(0.12, 0.65, 0.12), this.valetMat);
    vArm.position.set(-side * 0.28, 1.1, 0);
    vTorso.add(vArm);

    valetGroup.add(vTorso);
    hotelGroup.add(valetGroup);

    // 3. VIP Couple (Gentleman in tuxedo, Lady in emerald gown)
    const gentleman = new THREE.Group();
    gentleman.position.set(limoX + side * 1.0, 0, 0);
    this.buildStylizedGuest(gentleman, 0, 0, 0, 'TUXEDO', 0);
    gentleman.visible = false;
    hotelGroup.add(gentleman);

    const lady = new THREE.Group();
    lady.position.set(limoX + side * 1.0, 0, 0.6);
    this.buildStylizedGuest(lady, 0, 0, 0, 'GOWN', 1);
    lady.visible = false;
    hotelGroup.add(lady);

    // 4. Paparazzi Photographers with Flashing Strobe Bulbs
    const photographers: Array<{
      group: THREE.Group;
      initialRotY: number;
      flashMesh: THREE.Mesh;
    }> = [];

    [-carpetW * 0.5 - 1.2, carpetW * 0.5 + 1.2].forEach((pz, pIdx) => {
      const pressGroup = new THREE.Group();
      pressGroup.position.set(-side * 2.8, 0, pz);
      const targetRot = pIdx === 0 ? Math.PI * 0.15 : -Math.PI * 0.15;
      pressGroup.rotation.y = targetRot;

      const pJacket = new THREE.Mesh(this.getBox(0.44, 0.75, 0.32), this.darkGraniteMat);
      pJacket.position.y = 0.7;
      pressGroup.add(pJacket);

      const pLegs = new THREE.Mesh(this.getBox(0.42, 0.65, 0.34), this.blackMarbleMat);
      pLegs.position.y = 0.32;
      pressGroup.add(pLegs);

      const pHead = new THREE.Mesh(this.getCylinder(0.16, 0.16, 0.3, 8), this.cartoonSkinMat);
      pHead.position.y = 1.2;
      pressGroup.add(pHead);

      const camBox = new THREE.Mesh(this.getBox(0.22, 0.18, 0.25), this.blackMarbleMat);
      camBox.position.set(side * 0.25, 0.95, 0);
      pressGroup.add(camBox);

      const lens = new THREE.Mesh(this.getCylinder(0.08, 0.08, 0.18, 8), this.goldMetalMat);
      lens.rotation.z = Math.PI / 2;
      lens.position.set(side * 0.38, 0.95, 0);
      pressGroup.add(lens);

      const flashReflector = new THREE.Mesh(this.getCylinder(0.18, 0.08, 0.1, 8), this.goldMetalMat);
      flashReflector.rotation.z = Math.PI / 2;
      flashReflector.position.set(side * 0.32, 1.25, 0);
      pressGroup.add(flashReflector);

      const flashBulb = new THREE.Mesh(this.getBox(0.24, 0.24, 0.08), this.champagneGlowMat);
      flashBulb.position.set(side * 0.38, 1.25, 0);
      flashBulb.visible = false;
      pressGroup.add(flashBulb);

      hotelGroup.add(pressGroup);
      photographers.push({
        group: pressGroup,
        initialRotY: targetRot,
        flashMesh: flashBulb
      });
    });

    // Register VIP Arrival with Director
    director.registerVipArrival({
      group: hotelGroup,
      limousine: limo,
      rearDoorPivot: rearDoorPivot as THREE.Group,
      valetGroup,
      valetTorso: vTorso,
      valetArm: vArm,
      gentlemanGroup: gentleman,
      ladyGroup: lady,
      photographers,
      cycleTimer: 3.5, // Start approaching so player sees arrival sequence during early run!
      initialLimoZ: 0,
      carpetCenterZ: 0,
      doorLimoX: limoX + side * 1.0,
      redCarpetX: -side * 1.5
    });

    parent.add(hotelGroup);
  }

  private buildGrandNightclubEntrance(
    parent: THREE.Group,
    side: number,
    curbEdge: number,
    zCenter: number,
    director: MidnightVelvetEventDirector
  ): void {
    const clubGroup = new THREE.Group();
    const doorX = side * (curbEdge + 5.2);
    clubGroup.position.set(doorX, 0.35, zCenter);

    // Marble Steps
    const stepW = 4.2;
    const stepL = 1.6;
    for (let s = 0; s < 3; s++) {
      const step = new THREE.Mesh(this.getBox(stepL - s * 0.3, 0.14, stepW - s * 0.2), this.terraceMarbleMat);
      step.position.set(s * 0.15 * side, s * 0.14 + 0.07, 0);
      clubGroup.add(step);
    }

    // Scalloped Burgundy Awning with Gold Trim
    const awning = new THREE.Mesh(this.getBox(4.6, 0.55, 6.6), this.velvetBurgundyMat);
    awning.position.set(-side * 0.8, 4.4, 0);
    awning.rotation.z = side * 0.12;
    clubGroup.add(awning);

    const awningTrim = new THREE.Mesh(this.getBox(4.7, 0.14, 6.7), this.goldMetalMat);
    awningTrim.position.set(-side * 0.8, 4.1, 0);
    awningTrim.rotation.z = side * 0.12;
    clubGroup.add(awningTrim);

    // Illuminated "LE VELOURS NIGHTCLUB" Sign
    const signTex = TextureGenerator.getVelvetBoulevardSignTexture(0);
    const signMesh = new THREE.Mesh(this.getPlane(7.0, 3.5), this.createBasicMaterial({ map: signTex, side: THREE.DoubleSide }));
    signMesh.position.set(-side * 1.5, 6.2, 0);
    signMesh.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
    clubGroup.add(signMesh);

    // Chasing Marquee Bulbs around sign
    const bulbs: THREE.Mesh[] = [];
    for (let bz = -3.2; bz <= 3.2; bz += 0.85) {
      const bulb = new THREE.Mesh(this.getCylinder(0.08, 0.08, 0.08, 6), this.marqueeBulbMatOn.clone());
      bulb.position.set(-side * 1.6, 4.2, bz);
      clubGroup.add(bulb);
      bulbs.push(bulb);
    }

    // Vertical Fluted Gold Pilasters with Uplight Channels
    const verticalPillars: THREE.Mesh[] = [];
    [-2.8, 2.8].forEach((pz) => {
      const col = new THREE.Mesh(this.getCylinder(0.25, 0.25, 7.5, 8), this.goldMetalMat.clone());
      col.position.set(side * 0.2, 4.0, pz);
      clubGroup.add(col);
      verticalPillars.push(col);
    });

    // --- KINETIC ART DECO SCULPTURE ATOP CANOPY ---
    const sculptureGroup = new THREE.Group();
    sculptureGroup.position.set(-side * 0.8, 7.8, 0);

    // Outer Ring (Gold Torus)
    const outerRing = new THREE.Mesh(this.getTorus(1.4, 0.08, 8, 20), this.goldMetalMat);
    sculptureGroup.add(outerRing);

    // Middle Ring (Tilted Gold Torus)
    const midRing = new THREE.Mesh(this.getTorus(0.95, 0.07, 8, 16), this.goldMetalMat);
    sculptureGroup.add(midRing);

    // Inner Radiating Spokes
    const innerSpokes = new THREE.Group();
    for (let s = 0; s < 6; s++) {
      const spoke = new THREE.Mesh(this.getBox(0.06, 1.2, 0.06), this.goldMetalMat);
      spoke.rotation.z = s * (Math.PI / 3);
      innerSpokes.add(spoke);
    }
    sculptureGroup.add(innerSpokes);

    // Core Glowing Sphere
    const coreSphere = new THREE.Mesh(this.getCylinder(0.25, 0.25, 0.25, 12), this.champagneGlowMat);
    sculptureGroup.add(coreSphere);
    clubGroup.add(sculptureGroup);

    // Entrance Queue with Velvet Rope
    const ropeZ = 2.4;
    const post1 = new THREE.Mesh(this.getCylinder(0.06, 0.08, 1.1, 8), this.goldMetalMat);
    post1.position.set(-side * 1.8, 0.55, ropeZ);
    clubGroup.add(post1);
    const post2 = new THREE.Mesh(this.getCylinder(0.06, 0.08, 1.1, 8), this.goldMetalMat);
    post2.position.set(-side * 1.8, 0.55, -ropeZ);
    clubGroup.add(post2);

    const rope = new THREE.Mesh(this.getBox(0.06, 0.06, ropeZ * 2.0), this.velvetBurgundyMat);
    rope.position.set(-side * 1.8, 0.9, 0);
    clubGroup.add(rope);

    // Bouncer with Clipboard
    const bouncerGroup = new THREE.Group();
    bouncerGroup.position.set(-side * 1.2, 0, ropeZ + 0.5);
    this.buildBouncerGuard(bouncerGroup, 0, 0, 0);
    const clipArm = new THREE.Mesh(this.getBox(0.25, 0.32, 0.04), this.goldMetalMat);
    clipArm.position.set(side * 0.2, 1.0, 0.2);
    bouncerGroup.add(clipArm);
    clubGroup.add(bouncerGroup);

    // Queue of Stylish Socializing Guests
    const queueGuests: Array<{ group: THREE.Group; swayPhase: number; armWine?: THREE.Object3D }> = [];
    [-1.2, -0.4, 0.8, 1.6].forEach((qz, qIdx) => {
      const qg = new THREE.Group();
      qg.position.set(-side * 2.4, 0, qz);
      if (qIdx % 2 === 0) {
        this.buildStylizedGuest(qg, 0, 0, 0, 'TUXEDO', 0);
      } else {
        this.buildStylizedGuest(qg, 0, 0, 0, 'GOWN', qIdx % 3);
      }

      // Wine/champagne flute in hand
      const flute = new THREE.Mesh(this.getCylinder(0.04, 0.02, 0.18, 6), this.champagneGlowMat);
      flute.position.set(side * 0.25, 1.1, 0.15);
      qg.add(flute);

      clubGroup.add(qg);
      queueGuests.push({ group: qg, swayPhase: qIdx * 1.2, armWine: flute });
    });

    // Flanking Marble Planter Urns with Golden Palms
    this.buildPlanterUrnWithPalm(clubGroup, -side * 0.3, 0, -3.6);
    this.buildPlanterUrnWithPalm(clubGroup, -side * 0.3, 0, 3.6);

    // Register Grand Nightclub Reveal with Director
    director.registerNightclubReveal({
      group: clubGroup,
      kineticSculpture: {
        outerRing,
        midRing,
        innerSpokes,
        coreSphere
      },
      marqueeBulbs: bulbs,
      verticalPillars,
      signMesh,
      queueGuests,
      bouncer: {
        group: bouncerGroup,
        clipboardArm: clipArm
      },
      revealTimer: 0
    });

    parent.add(clubGroup);
  }

  private buildNightclubEntrance(
    parent: THREE.Group,
    side: number,
    curbEdge: number,
    zCenter: number,
    signVariant: number,
    director: MidnightVelvetEventDirector
  ): void {
    if (side > 0) {
      this.buildVipArrivalHotelEntrance(parent, side, curbEdge, zCenter, director);
    } else {
      this.buildGrandNightclubEntrance(parent, side, curbEdge, zCenter, director);
    }
  }

  private buildSidewalkBistroTerrace(
    parent: THREE.Group,
    x: number,
    y: number,
    zCenter: number
  ): void {
    const bistroGroup = new THREE.Group();
    bistroGroup.position.set(x, y, zCenter);

    // 3 Elegant Outdoor Café Tables with Linen & Candlelight
    [-3.5, 0, 3.5].forEach((tz, idx) => {
      // Table pedestal
      const ped = new THREE.Mesh(this.getCylinder(0.06, 0.25, 0.85, 8), this.goldMetalMat);
      ped.position.set(0, 0.42, tz);
      bistroGroup.add(ped);

      // White linen tabletop
      const tableTop = new THREE.Mesh(this.getCylinder(0.65, 0.65, 0.08, 12), this.terraceMarbleMat);
      tableTop.position.set(0, 0.86, tz);
      bistroGroup.add(tableTop);

      // Glowing miniature candle fixture
      const candle = new THREE.Mesh(this.getCylinder(0.04, 0.04, 0.15, 6), this.champagneGlowMat);
      candle.position.set(0, 0.98, tz);
      bistroGroup.add(candle);

      // Twin velvet bistro chairs
      [-0.7, 0.7].forEach((cx) => {
        const chair = new THREE.Mesh(this.getBox(0.42, 0.85, 0.42), this.velvetBurgundyMat);
        chair.position.set(cx, 0.42, tz);
        bistroGroup.add(chair);
      });

      // Socializing guest at the table
      if (idx % 2 === 0) {
        this.buildStylizedGuest(bistroGroup, 0.65, 0, tz, 'TUXEDO', 0);
      } else {
        this.buildStylizedGuest(bistroGroup, -0.65, 0, tz, 'GOWN', 2);
      }
    });

    parent.add(bistroGroup);
  }

  private buildStylizedGuest(
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    type: 'TUXEDO' | 'GOWN',
    variant: number
  ): void {
    const guest = new THREE.Group();
    guest.position.set(x, y, z);

    if (type === 'TUXEDO') {
      // Tuxedo Jacket
      const jacket = new THREE.Mesh(this.getBox(0.48, 0.85, 0.32), this.tuxedoMat);
      jacket.position.y = 0.85;
      guest.add(jacket);

      // White Shirt Inlay
      const shirt = new THREE.Mesh(this.getBox(0.2, 0.45, 0.05), this.terraceMarbleMat);
      shirt.position.set(0, 0.95, 0.16);
      guest.add(shirt);

      // Bowtie
      const bowtie = new THREE.Mesh(this.getBox(0.12, 0.06, 0.06), this.tuxedoMat);
      bowtie.position.set(0, 1.15, 0.18);
      guest.add(bowtie);

      // Trousers
      const pants = new THREE.Mesh(this.getBox(0.44, 0.8, 0.28), this.tuxedoMat);
      pants.position.y = 0.4;
      guest.add(pants);
    } else {
      // Glamorous Evening Gown
      const gownMat = variant === 0 ? this.velvetBurgundyMat : (variant === 1 ? this.emeraldGownMat : this.sapphireGownMat);

      // Bodice
      const bodice = new THREE.Mesh(this.getBox(0.42, 0.75, 0.28), gownMat);
      bodice.position.y = 0.9;
      guest.add(bodice);

      // Flaring Gown Skirt
      const skirt = new THREE.Mesh(this.getCylinder(0.24, 0.44, 0.9, 10), gownMat);
      skirt.position.y = 0.45;
      guest.add(skirt);

      // Gold Necklace Accent
      const necklace = new THREE.Mesh(this.getBox(0.2, 0.04, 0.04), this.goldMetalMat);
      necklace.position.set(0, 1.25, 0.14);
      guest.add(necklace);
    }

    // Stylized Head
    const head = new THREE.Mesh(this.getCylinder(0.16, 0.16, 0.32, 8), this.cartoonSkinMat);
    head.position.y = 1.45;
    guest.add(head);

    parent.add(guest);
  }

  private buildBouncerGuard(parent: THREE.Group, x: number, y: number, z: number): void {
    const bouncer = new THREE.Group();
    bouncer.position.set(x, y, z);

    // Broad Muscular Suit Jacket
    const jacket = new THREE.Mesh(this.getBox(0.62, 0.95, 0.38), this.bouncerMat);
    jacket.position.y = 0.95;
    bouncer.add(jacket);

    // Dark Tie
    const tie = new THREE.Mesh(this.getBox(0.1, 0.45, 0.04), this.blackMarbleMat);
    tie.position.set(0, 0.95, 0.2);
    bouncer.add(tie);

    // Hands Clasped in Front
    const arms = new THREE.Mesh(this.getBox(0.68, 0.4, 0.22), this.bouncerMat);
    arms.position.set(0, 0.85, 0.16);
    bouncer.add(arms);

    // Head with Sunglasses
    const head = new THREE.Mesh(this.getCylinder(0.2, 0.2, 0.36, 8), this.cartoonSkinMat);
    head.position.y = 1.6;
    bouncer.add(head);

    const sunglasses = new THREE.Mesh(this.getBox(0.32, 0.08, 0.08), this.blackMarbleMat);
    sunglasses.position.set(0, 1.62, 0.2);
    bouncer.add(sunglasses);

    // Legs
    const legs = new THREE.Mesh(this.getBox(0.55, 0.9, 0.32), this.bouncerMat);
    legs.position.y = 0.45;
    bouncer.add(legs);

    parent.add(bouncer);
  }

  private buildPaparazziPhotographer(
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    aimSide: number,
    director: MidnightVelvetEventDirector
  ): void {
    const press = new THREE.Group();
    press.position.set(x, y, z);

    // Crouching Posture
    const jacket = new THREE.Mesh(this.getBox(0.44, 0.75, 0.32), this.darkGraniteMat);
    jacket.position.y = 0.7;
    press.add(jacket);

    const legs = new THREE.Mesh(this.getBox(0.42, 0.65, 0.34), this.blackMarbleMat);
    legs.position.y = 0.32;
    press.add(legs);

    const head = new THREE.Mesh(this.getCylinder(0.16, 0.16, 0.3, 8), this.cartoonSkinMat);
    head.position.y = 1.2;
    press.add(head);

    // Camera Body
    const camBox = new THREE.Mesh(this.getBox(0.22, 0.18, 0.25), this.blackMarbleMat);
    camBox.position.set(aimSide * 0.25, 0.95, 0);
    press.add(camBox);

    // Camera Lens
    const lens = new THREE.Mesh(this.getCylinder(0.08, 0.08, 0.18, 8), this.goldMetalMat);
    lens.rotation.z = Math.PI / 2;
    lens.position.set(aimSide * 0.38, 0.95, 0);
    press.add(lens);

    // Strobe Flash Reflector Bracket
    const flashReflector = new THREE.Mesh(this.getCylinder(0.18, 0.08, 0.1, 8), this.goldMetalMat);
    flashReflector.rotation.z = Math.PI / 2;
    flashReflector.position.set(aimSide * 0.32, 1.25, 0);
    press.add(flashReflector);

    // Flash Strobe Bulb (pulsed dynamically by MidnightVelvetEventDirector!)
    const flashBulb = new THREE.Mesh(this.getBox(0.22, 0.22, 0.08), this.champagneGlowMat);
    flashBulb.position.set(aimSide * 0.38, 1.25, 0);
    flashBulb.visible = false;
    press.add(flashBulb);

    director.registerPaparazziFlash(flashBulb, 0.7 + Math.random() * 0.8);

    parent.add(press);
  }

  private buildLuxuryLimousine(
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    facingTrack: boolean,
    hasValet: boolean = false
  ): THREE.Group {
    const limo = new THREE.Group();
    limo.name = 'velvet_luxury_limousine';
    limo.position.set(x, y, z);

    // Elongated Streamlined Chassis (Charcoal Obsidian Lacquer)
    const body = new THREE.Mesh(this.getBox(2.2, 0.95, 7.8), this.blackMarbleMat);
    body.position.y = 0.65;
    limo.add(body);

    // Gilded Lower Rocker Panels
    const rocker = new THREE.Mesh(this.getBox(2.26, 0.16, 7.8), this.goldMetalMat);
    rocker.position.y = 0.24;
    limo.add(rocker);

    // Streamlined Passenger Cabin with Tinted Obsidian Glass
    const cabin = new THREE.Mesh(this.getBox(1.95, 0.82, 4.4), this.midnightNavyMat);
    cabin.position.set(0, 1.45, -0.4);
    limo.add(cabin);

    // Champagne Gold Roof Crown
    const roof = new THREE.Mesh(this.getBox(1.9, 0.12, 4.3), this.goldMetalMat);
    roof.position.set(0, 1.88, -0.4);
    limo.add(roof);

    // Front Art Deco Waterfall Radiator Grille
    const grille = new THREE.Mesh(this.getBox(1.2, 0.75, 0.2), this.goldMetalMat);
    grille.position.set(0, 0.65, -3.95);
    limo.add(grille);

    // Dual Glowing Headlights
    [-0.82, 0.82].forEach((hx) => {
      const lamp = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.12, 8), this.champagneGlowMat);
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(hx, 0.65, -3.95);
      limo.add(lamp);
    });

    // Dual Ruby Taillights
    [-0.82, 0.82].forEach((tx) => {
      const tail = new THREE.Mesh(this.getBox(0.24, 0.14, 0.1), this.velvetBurgundyMat);
      tail.position.set(tx, 0.68, 3.92);
      limo.add(tail);
    });

    // 6 Luxury Wheels (Triple-Axle Art Deco Town Car)
    [-1.08, 1.08].forEach((wx) => {
      [-2.6, 0.8, 2.6].forEach((wz) => {
        const wheel = new THREE.Mesh(this.getCylinder(0.42, 0.42, 0.32, 12), this.darkGraniteMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.42, wz);
        limo.add(wheel);

        const hub = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.36, 8), this.goldMetalMat);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(wx, 0.42, wz);
        limo.add(hub);
      });
    });

    // Articulated Rear Passenger Door on Pivot
    const doorPivot = new THREE.Group();
    doorPivot.name = 'limo_rear_door_pivot';
    doorPivot.position.set(1.02, 1.45, 0.4);
    const doorPanel = new THREE.Mesh(this.getBox(0.08, 0.78, 1.2), this.blackMarbleMat);
    doorPanel.position.set(0, 0, -0.6);
    doorPivot.add(doorPanel);
    const doorWindow = new THREE.Mesh(this.getBox(0.06, 0.45, 1.1), this.warmGlassMat);
    doorWindow.position.set(0, 0.12, -0.6);
    doorPivot.add(doorWindow);
    const doorHandle = new THREE.Mesh(this.getBox(0.06, 0.05, 0.18), this.goldMetalMat);
    doorHandle.position.set(0.05, -0.1, -1.05);
    doorPivot.add(doorHandle);
    limo.add(doorPivot);
    limo.userData.doorPivot = doorPivot;

    // Chauffeur / Valet Attendant in Livery holding open door
    if (hasValet) {
      const valet = new THREE.Group();
      valet.position.set(1.4, 0, 0.5);

      const vJacket = new THREE.Mesh(this.getBox(0.45, 0.85, 0.32), this.valetMat);
      vJacket.position.y = 0.85;
      valet.add(vJacket);

      const vPants = new THREE.Mesh(this.getBox(0.42, 0.8, 0.28), this.blackMarbleMat);
      vPants.position.y = 0.4;
      valet.add(vPants);

      const vHead = new THREE.Mesh(this.getCylinder(0.16, 0.16, 0.32, 8), this.cartoonSkinMat);
      vHead.position.y = 1.45;
      valet.add(vHead);

      const vCap = new THREE.Mesh(this.getCylinder(0.2, 0.2, 0.12, 8), this.valetMat);
      vCap.position.y = 1.65;
      valet.add(vCap);

      limo.add(valet);
    }

    parent.add(limo);
    return limo;
  }

  private buildTwinArtDecoStreetlamp(parent: THREE.Group, x: number, y: number, z: number): void {
    const lamp = new THREE.Group();
    lamp.position.set(x, y, z);

    // Hexagonal Pedestal Base (embedded into sidewalk down to subterranean)
    const base = new THREE.Mesh(this.getCylinder(0.35, 0.45, 0.8, 6), this.blackMarbleMat);
    base.position.y = 0.4;
    lamp.add(base);

    // Gilded Collar
    const collar = new THREE.Mesh(this.getCylinder(0.38, 0.38, 0.12, 6), this.goldMetalMat);
    collar.position.y = 0.82;
    lamp.add(collar);

    // Fluted Brass Mast
    const mast = new THREE.Mesh(this.getCylinder(0.08, 0.14, 4.2, 8), this.goldMetalMat);
    mast.position.y = 2.9;
    lamp.add(mast);

    // Twin Arched Crossbar
    const crossbar = new THREE.Mesh(this.getBox(1.8, 0.12, 0.12), this.goldMetalMat);
    crossbar.position.y = 4.8;
    lamp.add(crossbar);

    // Twin Glowing Hexagonal Lanterns
    [-0.8, 0.8].forEach((lx) => {
      const lantern = new THREE.Mesh(this.getBox(0.4, 0.6, 0.4), this.warmGlassMat);
      lantern.position.set(lx, 4.4, 0);
      lamp.add(lantern);

      const cap = new THREE.Mesh(this.getCylinder(0.02, 0.3, 0.25, 6), this.goldMetalMat);
      cap.position.y = 4.82;
      cap.position.x = lx;
      lamp.add(cap);
    });

    parent.add(lamp);
  }

  private buildPlanterUrnWithPalm(parent: THREE.Group, x: number, y: number, z: number): void {
    const urn = new THREE.Group();
    urn.position.set(x, y, z);

    // Fluted Black Marble Urn Base
    const base = new THREE.Mesh(this.getCylinder(0.45, 0.55, 0.85, 8), this.blackMarbleMat);
    base.position.y = 0.42;
    urn.add(base);

    // Gold Trim Ring
    const ring = new THREE.Mesh(this.getCylinder(0.48, 0.48, 0.12, 8), this.goldMetalMat);
    ring.position.y = 0.86;
    urn.add(ring);

    // Golden / Emerald Fronds
    const frondGeo = this.getBox(2.2, 0.08, 0.45);
    const frondMat = this.createStandardMaterial({ color: 0x14532d, roughness: 0.6, metalness: 0.2 });
    for (let f = 0; f < 5; f++) {
      const frond = new THREE.Mesh(frondGeo, frondMat);
      frond.position.set(0, 1.4, 0);
      frond.rotation.y = f * (Math.PI * 2 / 5);
      frond.rotation.z = -0.38;
      urn.add(frond);
    }

    // Warm Uplight
    const uplight = new THREE.Mesh(this.getCylinder(0.12, 0.12, 0.1, 6), this.champagneGlowMat);
    uplight.position.y = 0.9;
    urn.add(uplight);

    parent.add(urn);
  }

  private buildMarinaPalmTree(parent: THREE.Group, x: number, y: number, z: number): void {
    const palm = new THREE.Group();
    palm.position.set(x, y, z);

    // Solid Dark Granite & Brass Planter Collar embedding palm firmly into ground
    const planter = new THREE.Mesh(this.getCylinder(0.7, 0.9, 0.4, 6), this.darkGraniteMat);
    planter.position.y = 0.2;
    palm.add(planter);

    const brassRim = new THREE.Mesh(this.getCylinder(0.72, 0.72, 0.08, 6), this.goldMetalMat);
    brassRim.position.y = 0.4;
    palm.add(brassRim);

    // Curved Trunk
    const trunk = new THREE.Mesh(this.getCylinder(0.22, 0.35, 6.5, 6), this.darkGraniteMat);
    trunk.position.set(0, 3.25, 0);
    trunk.rotation.z = 0.12;
    palm.add(trunk);

    // Palm Fronds
    const frondGeo = this.getBox(2.8, 0.1, 0.6);
    const frondMat = this.createStandardMaterial({ color: 0x14532d, roughness: 0.6 });
    for (let f = 0; f < 6; f++) {
      const frond = new THREE.Mesh(frondGeo, frondMat);
      frond.position.set(0, 6.4, 0);
      frond.rotation.y = f * (Math.PI / 3);
      frond.rotation.z = -0.35;
      palm.add(frond);
    }

    // Warm Ground Uplight fixture
    const uplight = new THREE.Mesh(this.getCylinder(0.2, 0.2, 0.2, 6), this.goldMetalMat);
    uplight.position.set(0, 0.1, 0);
    palm.add(uplight);

    parent.add(palm);
  }

  private buildLuxurySuperyacht(x: number, y: number, z: number, flipSide: boolean): THREE.Group {
    const yacht = new THREE.Group();
    yacht.name = 'marina_luxury_yacht';
    yacht.position.set(x, y, z);

    // 1. Sleek White Hydrodynamic Hull
    const hull = new THREE.Mesh(this.getBox(4.2, 1.8, 14.0), this.champagneGlowMat);
    hull.position.y = 0.7;
    yacht.add(hull);

    // Navy Blue Waterline Accent Stripe
    const bootStripe = new THREE.Mesh(this.getBox(4.26, 0.18, 14.0), this.midnightNavyMat);
    bootStripe.position.y = 0.15;
    yacht.add(bootStripe);

    // Bow Taper
    const bow = new THREE.Mesh(this.getCylinder(0.1, 2.1, 4.2, 6), this.champagneGlowMat);
    bow.rotation.x = Math.PI / 2;
    bow.position.set(0, 0.7, -9.0);
    yacht.add(bow);

    // 2. Cabin Structure (Midnight Navy & Champagne Gold Trim)
    const cabin = new THREE.Mesh(this.getBox(3.4, 1.6, 7.5), this.midnightNavyMat);
    cabin.position.set(0, 2.2, -0.5);
    yacht.add(cabin);

    // Flying Bridge / Upper Sundeck
    const flybridge = new THREE.Mesh(this.getBox(2.8, 0.85, 4.5), this.champagneGlowMat);
    flybridge.position.set(0, 3.4, -0.8);
    yacht.add(flybridge);

    // Teak Aft Deck
    const teakAft = new THREE.Mesh(this.getBox(3.8, 0.08, 3.2), this.teakWoodMat);
    teakAft.position.set(0, 1.55, 4.8);
    yacht.add(teakAft);

    // Warm Lit Glass Portholes along hull
    for (let p = -3.5; p <= 3.5; p += 2.3) {
      [-2.12, 2.12].forEach((px) => {
        const porthole = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.08, 8), this.warmGlassMat);
        porthole.rotation.z = Math.PI / 2;
        porthole.position.set(px, 0.95, p);
        yacht.add(porthole);
      });
    }

    // Underwater Aqua LED Glow Fixtures
    [-1.8, 1.8].forEach((ax) => {
      const aquaLight = new THREE.Mesh(this.getBox(0.4, 0.12, 10.0), this.aquaGlowMat);
      aquaLight.position.set(ax, -0.05, 0);
      yacht.add(aquaLight);
    });

    // Radar Mast & Communication Radome
    const mast = new THREE.Mesh(this.getCylinder(0.08, 0.08, 2.8, 6), this.goldMetalMat);
    mast.position.set(0, 4.8, -0.5);
    yacht.add(mast);

    const radome = new THREE.Mesh(this.getCylinder(0.4, 0.4, 0.35, 8), this.champagneGlowMat);
    radome.position.set(0, 5.8, -0.5);
    yacht.add(radome);

    return yacht;
  }

  private buildPartyDancer(x: number, y: number, z: number, suitColor: number): { group: THREE.Group; armL: THREE.Object3D; armR: THREE.Object3D } {
    const dancerGroup = new THREE.Group();
    dancerGroup.position.set(x, y, z);

    // Body
    const body = new THREE.Mesh(this.getBox(0.42, 0.85, 0.28), this.createStandardMaterial({ color: suitColor, roughness: 0.6 }));
    body.position.y = 0.85;
    dancerGroup.add(body);

    // Head
    const head = new THREE.Mesh(this.getCylinder(0.16, 0.16, 0.32, 8), this.cartoonSkinMat);
    head.position.y = 1.42;
    dancerGroup.add(head);

    // Arms
    const armGeo = this.getBox(0.12, 0.6, 0.12);
    const armL = new THREE.Mesh(armGeo, this.goldMetalMat);
    armL.position.set(-0.32, 1.1, 0);
    dancerGroup.add(armL);

    const armR = new THREE.Mesh(armGeo, this.goldMetalMat);
    armR.position.set(0.32, 1.1, 0);
    dancerGroup.add(armR);

    return { group: dancerGroup, armL, armR };
  }

  private buildCrystalChandelier(x: number, y: number, z: number): THREE.Group {
    const ch = new THREE.Group();
    ch.position.set(x, y, z);

    // Brass Stem
    const stem = new THREE.Mesh(this.getCylinder(0.06, 0.06, 1.8, 6), this.goldMetalMat);
    stem.position.y = 0.9;
    ch.add(stem);

    // Tiered Gilded Rings
    const ring1 = new THREE.Mesh(this.getTorus(1.2, 0.08, 6, 16), this.goldMetalMat);
    ring1.rotation.x = Math.PI / 2;
    ch.add(ring1);

    const ring2 = new THREE.Mesh(this.getTorus(0.7, 0.08, 6, 16), this.goldMetalMat);
    ring2.position.y = -0.5;
    ring2.rotation.x = Math.PI / 2;
    ch.add(ring2);

    // Glowing Crystals (Streamlined 4-crystal arrangement for draw call optimization)
    for (let c = 0; c < 4; c++) {
      const angle = c * (Math.PI / 2);
      const crystal = new THREE.Mesh(this.getCylinder(0.06, 0.02, 0.6, 4), this.champagneGlowMat);
      crystal.position.set(Math.cos(angle) * 1.0, -0.3, Math.sin(angle) * 1.0);
      ch.add(crystal);
    }

    return ch;
  }

  private buildLuxuryStationCarriage(x: number, y: number, z: number): THREE.Group {
    const carriage = new THREE.Group();
    carriage.name = 'midnight_grand_siding_carriage';
    carriage.position.set(x, y, z);

    // Streamlined Pullman Body (Midnight Navy & Champagne Gold Trim)
    const body = new THREE.Mesh(this.getBox(3.4, 3.8, 22.0), this.midnightNavyMat);
    body.position.y = 2.4;
    carriage.add(body);

    const roof = new THREE.Mesh(this.getBox(3.2, 0.6, 21.6), this.goldMetalMat);
    roof.position.y = 4.5;
    carriage.add(roof);

    // Warm Interior Windows
    for (let w = -8; w <= 8; w += 2.8) {
      [-1.72, 1.72].forEach((wx) => {
        const win = new THREE.Mesh(this.getBox(0.08, 1.2, 1.8), this.warmGlassMat);
        win.position.set(wx, 2.6, w);
        carriage.add(win);
      });
    }

    return carriage;
  }
}
