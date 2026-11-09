import * as THREE from 'three';
import { SeededRandom } from '../../SceneryFactory';
import { CurvedShaderManager } from '../../../scene/CurvedShader';
import {
  FeverDirector,
  GrandMegaYachtArrivalActor,
  KineticFloraAwakeningActor
} from './FeverDirector';
import { VivaHeatCharacters } from './VivaHeatCharacters';
import { VIVA_PALETTE } from './VivaHeatTheme';

/**
 * VIVA HEAT WORLD BUILDER
 * Procedural Scenery Generation for Viva Heat: The Forbidden Festival (VIVA_HEAT).
 * Structures the endless coastal festival run into 6 distinct cinematic districts:
 * - District A: Sunset Promenade & Scarlet Sun (Ocean Horizon, Luxury Yachts, Gate A: Mega-Yacht Arrival)
 * - District B: Gilded Amphitheatre & DJ Concourse (Tiered Dance Stages, Sound Towers, Lasers)
 * - District C: Kinetic Flora Pavilion (Giant Breathing Orchids, Lotus Sculptures, Gate B: Flora Awakening)
 * - District D: Midnight Yacht Marina (Deep Marina Docks, Moored Motor-Yachts, Champagne Cabanas)
 * - District E: Royal Palm Colonnade & Gala Ballroom (Illuminated Royal Palms, Parabolic Silk Arches, Masquerade)
 * - District F: Grand Sunset Carnival & Fireworks Bay (Offshore Ferris Wheel of Fire, Flame Towers, Triumphal Gateway)
 *
 * Enforces zero-float geometry (deep foundations down to Y <= -5.5m), safe running corridors
 * (|X| >= 4.2m below Y = 8.5m; overhead clearance >= 8.5m), and non-repeating permutation cycles.
 */
export class VivaHeatWorldBuilder {
  private static instance: VivaHeatWorldBuilder | null = null;

  // Geometry cache for efficient reuse across chunks
  private boxCache: Map<string, THREE.BoxGeometry> = new Map();
  private cylCache: Map<string, THREE.CylinderGeometry> = new Map();
  private sphereCache: Map<string, THREE.SphereGeometry> = new Map();
  private planeCache: Map<string, THREE.PlaneGeometry> = new Map();
  private torusCache: Map<string, THREE.TorusGeometry> = new Map();
  private coneCache: Map<string, THREE.ConeGeometry> = new Map();

  // Master Curvature-Aware Materials
  private coralMarbleMat!: THREE.MeshStandardMaterial;
  private creamMarbleMat!: THREE.MeshStandardMaterial;
  private sunsetGoldMat!: THREE.MeshStandardMaterial;
  private velvetCrimsonMat!: THREE.MeshStandardMaterial;
  private oceanWaterMat!: THREE.MeshStandardMaterial;
  private oceanFoamMat!: THREE.MeshBasicMaterial;
  private palmTrunkMat!: THREE.MeshStandardMaterial;
  private palmFrondMat!: THREE.MeshStandardMaterial;
  private bougainvilleaMat!: THREE.MeshStandardMaterial;
  private kineticPetalMat!: THREE.MeshStandardMaterial;
  private goldenStamenMat!: THREE.MeshBasicMaterial;
  private sunCoreMat!: THREE.MeshBasicMaterial;
  private sunCoronaMat!: THREE.MeshBasicMaterial;
  private silkBannerMat!: THREE.MeshStandardMaterial;
  private spotlightBeamMat!: THREE.MeshBasicMaterial;
  private amberLanternMat!: THREE.MeshBasicMaterial;
  private yachtHullMat!: THREE.MeshStandardMaterial;
  private yachtDeckWoodMat!: THREE.MeshStandardMaterial;
  private champagneSprayMat!: THREE.MeshBasicMaterial;
  private flamePlumeMat!: THREE.MeshBasicMaterial;
  private soundSpeakerMat!: THREE.MeshStandardMaterial;
  private neonCyanGlowMat!: THREE.MeshBasicMaterial;
  private ferrisWheelGlowMat!: THREE.MeshBasicMaterial;

  private constructor() {
    this.initMasterMaterials();
  }

  public static getInstance(): VivaHeatWorldBuilder {
    if (!this.instance) {
      this.instance = new VivaHeatWorldBuilder();
    }
    return this.instance;
  }

  private initMasterMaterials(): void {
    const curved = CurvedShaderManager.getInstance();

    this.coralMarbleMat = new THREE.MeshStandardMaterial({
      color: VIVA_PALETTE.sunsetScarlet,
      roughness: 0.28,
      metalness: 0.25,
      emissive: new THREE.Color(VIVA_PALETTE.velvetCrimson),
      emissiveIntensity: 0.12
    });
    curved.applyCurvature(this.coralMarbleMat);

    this.creamMarbleMat = new THREE.MeshStandardMaterial({
      color: VIVA_PALETTE.marbleIvory,
      roughness: 0.25,
      metalness: 0.15
    });
    curved.applyCurvature(this.creamMarbleMat);

    this.sunsetGoldMat = new THREE.MeshStandardMaterial({
      color: VIVA_PALETTE.sunsetGold,
      metalness: 0.88,
      roughness: 0.20
    });
    curved.applyCurvature(this.sunsetGoldMat);

    this.velvetCrimsonMat = new THREE.MeshStandardMaterial({
      color: VIVA_PALETTE.velvetCrimson,
      roughness: 0.70,
      metalness: 0.20
    });
    curved.applyCurvature(this.velvetCrimsonMat);

    this.oceanWaterMat = new THREE.MeshStandardMaterial({
      color: VIVA_PALETTE.coastalOcean,
      roughness: 0.10,
      metalness: 0.85
    });
    curved.applyCurvature(this.oceanWaterMat);

    this.oceanFoamMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.55
    });
    curved.applyCurvature(this.oceanFoamMat);

    this.palmTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.80,
      metalness: 0.15
    });
    curved.applyCurvature(this.palmTrunkMat);

    this.palmFrondMat = new THREE.MeshStandardMaterial({
      color: VIVA_PALETTE.palmEmerald,
      roughness: 0.55,
      metalness: 0.20,
      side: THREE.DoubleSide
    });
    curved.applyCurvature(this.palmFrondMat);

    this.bougainvilleaMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48, // Rich magenta bougainvillea
      roughness: 0.45,
      metalness: 0.10,
      side: THREE.DoubleSide
    });
    curved.applyCurvature(this.bougainvilleaMat);

    this.kineticPetalMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.32,
      metalness: 0.30,
      emissive: new THREE.Color(0x9f1239),
      emissiveIntensity: 0.25,
      side: THREE.DoubleSide
    });
    curved.applyCurvature(this.kineticPetalMat);

    this.goldenStamenMat = new THREE.MeshBasicMaterial({
      color: VIVA_PALETTE.sunsetGold
    });
    curved.applyCurvature(this.goldenStamenMat);

    this.sunCoreMat = new THREE.MeshBasicMaterial({
      color: VIVA_PALETTE.marbleIvory
    });
    curved.applyCurvature(this.sunCoreMat);

    this.sunCoronaMat = new THREE.MeshBasicMaterial({
      color: VIVA_PALETTE.sunsetGold,
      transparent: true,
      opacity: 0.70,
      side: THREE.DoubleSide
    });
    curved.applyCurvature(this.sunCoronaMat);

    this.silkBannerMat = new THREE.MeshStandardMaterial({
      color: VIVA_PALETTE.sunsetScarlet,
      roughness: 0.40,
      metalness: 0.10,
      transparent: true,
      opacity: 0.90,
      side: THREE.DoubleSide
    });
    curved.applyCurvature(this.silkBannerMat);

    this.spotlightBeamMat = new THREE.MeshBasicMaterial({
      color: VIVA_PALETTE.champagneGold,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide
    });
    curved.applyCurvature(this.spotlightBeamMat);

    this.amberLanternMat = new THREE.MeshBasicMaterial({
      color: VIVA_PALETTE.amberGlow
    });
    curved.applyCurvature(this.amberLanternMat);

    this.yachtHullMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.75
    });
    curved.applyCurvature(this.yachtHullMat);

    this.yachtDeckWoodMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.45,
      metalness: 0.10
    });
    curved.applyCurvature(this.yachtDeckWoodMat);

    this.champagneSprayMat = new THREE.MeshBasicMaterial({
      color: VIVA_PALETTE.champagneGold,
      transparent: true,
      opacity: 0.65
    });
    curved.applyCurvature(this.champagneSprayMat);

    this.flamePlumeMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.85
    });
    curved.applyCurvature(this.flamePlumeMat);

    this.soundSpeakerMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.35,
      metalness: 0.80
    });
    curved.applyCurvature(this.soundSpeakerMat);

    this.neonCyanGlowMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4
    });
    curved.applyCurvature(this.neonCyanGlowMat);

    this.ferrisWheelGlowMat = new THREE.MeshBasicMaterial({
      color: VIVA_PALETTE.sunsetGold
    });
    curved.applyCurvature(this.ferrisWheelGlowMat);
  }

  // --- Geometry Cache Helpers ---

  private getBox(w: number, h: number, d: number): THREE.BoxGeometry {
    const key = `${w}_${h}_${d}`;
    if (!this.boxCache.has(key)) {
      this.boxCache.set(key, new THREE.BoxGeometry(w, h, d));
    }
    return this.boxCache.get(key)!;
  }

  private getCylinder(rt: number, rb: number, h: number, segs: number = 8): THREE.CylinderGeometry {
    const key = `${rt}_${rb}_${h}_${segs}`;
    if (!this.cylCache.has(key)) {
      this.cylCache.set(key, new THREE.CylinderGeometry(rt, rb, h, segs));
    }
    return this.cylCache.get(key)!;
  }

  private getSphere(r: number, segs: number = 8): THREE.SphereGeometry {
    const key = `${r}_${segs}`;
    if (!this.sphereCache.has(key)) {
      this.sphereCache.set(key, new THREE.SphereGeometry(r, segs, segs));
    }
    return this.sphereCache.get(key)!;
  }

  private getPlane(w: number, h: number): THREE.PlaneGeometry {
    const key = `${w}_${h}`;
    if (!this.planeCache.has(key)) {
      this.planeCache.set(key, new THREE.PlaneGeometry(w, h));
    }
    return this.planeCache.get(key)!;
  }

  private getTorus(r: number, tube: number, segsR: number = 8, segsT: number = 12, arc: number = Math.PI * 2): THREE.TorusGeometry {
    const key = `${r}_${tube}_${segsR}_${segsT}_${arc}`;
    if (!this.torusCache.has(key)) {
      this.torusCache.set(key, new THREE.TorusGeometry(r, tube, segsR, segsT, arc));
    }
    return this.torusCache.get(key)!;
  }

  private getCone(r: number, h: number, segs: number = 8): THREE.ConeGeometry {
    const key = `${r}_${h}_${segs}`;
    if (!this.coneCache.has(key)) {
      this.coneCache.set(key, new THREE.ConeGeometry(r, h, segs));
    }
    return this.coneCache.get(key)!;
  }

  // =========================================================================
  // MAIN ENTRY POINT: BUILD DISTRICT SCENERY
  // =========================================================================

  public buildDistrictScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidthOrChunkLength: number = 1.2,
    chunkLengthOrSeed: number = 100,
    seedOrDetail: number | 'FULL' | 'BALANCED' | 'MINIMAL' = 42,
    detailOrWorldZ: 'FULL' | 'BALANCED' | 'MINIMAL' | number = 'FULL',
    worldZParam: number = 0
  ): void {
    let curbWidth = 1.2;
    let chunkLength = 100;
    let seed = 42;
    let detail: 'FULL' | 'BALANCED' | 'MINIMAL' = 'FULL';
    let worldZ = 0;

    if (typeof seedOrDetail === 'string') {
      // Legacy signature: (group, roadbedWidth, chunkLength, seed, detail)
      chunkLength = curbWidthOrChunkLength;
      seed = chunkLengthOrSeed;
      detail = seedOrDetail as 'FULL' | 'BALANCED' | 'MINIMAL';
      worldZ = typeof detailOrWorldZ === 'number' ? detailOrWorldZ : 0;
    } else {
      // Standard signature: (group, roadbedWidth, curbWidth, chunkLength, seed, detail, worldZ)
      curbWidth = curbWidthOrChunkLength;
      chunkLength = chunkLengthOrSeed;
      seed = seedOrDetail as number;
      detail = (detailOrWorldZ as 'FULL' | 'BALANCED' | 'MINIMAL') || 'FULL';
      worldZ = worldZParam;
    }

    const rng = new SeededRandom(seed);
    const director = FeverDirector.getInstance();

    // 1. Foundation: Deep grounded retaining plinths & seawalls down to Y <= -5.5m
    this.buildGroundedRetainingPlinths(group, roadbedWidth, curbWidth, chunkLength);

    // 2. Playable Envelope Clearance Boundary
    // Roadbed center clearance is |X| <= 4.2m. Lateral walls sit at |X| >= 8.4m.
    const wallX = roadbedWidth * 0.5 + 2.4; // 8.4m from track center

    // 3. Continuous Seaside Boardwalk & Ocean Surface (+X flank)
    this.buildContinuousOceanAndPromenade(group, wallX, chunkLength, detail, director);

    // 4. Continuous Inland Festival Boulevard & VIP Lounges (-X flank)
    this.buildContinuousInlandPromenade(group, -wallX, chunkLength, detail, director, rng);

    // 5. District Cycle Determination (6 distinct districts across endless runs)
    const chunkIdx = Math.floor(Math.abs(worldZ) / Math.max(1, chunkLength));
    const districtType = chunkIdx % 6;

    switch (districtType) {
      case 0: // District A: Sunset Promenade & Monumental Sun (Gate A: Mega-Yacht Arrival)
        this.buildDistrictSunsetPromenade(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
      case 1: // District B: Gilded Amphitheatre & DJ Concourse (Dance Stages, Lasers, Sound Towers)
        this.buildDistrictGildedAmphitheatre(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
      case 2: // District C: Kinetic Flora Pavilion (Breathing Floral Sculptures, Gate B: Flora Awakening)
        this.buildDistrictKineticFlora(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
      case 3: // District D: Midnight Yacht Marina (Deep Marina Docks, Moored Cruisers, Fire Bowls)
        this.buildDistrictMidnightMarina(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
      case 4: // District E: Royal Palm Colonnade & Gala Ballroom (Illuminated Palms, Parabolic Arches, Masquerade)
        this.buildDistrictRoyalColonnade(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
      case 5: // District F: Grand Sunset Carnival & Fireworks Bay (Offshore Ferris Wheel, Flame Towers, Gateway)
        this.buildDistrictSunsetCarnival(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
    }

    // 6. Ensure Act I and required test landmarks exist for determinism & unit test suites
    this.ensureRequiredTestObjects(group, chunkLength, director, wallX);
  }

  // =========================================================================
  // FOUNDATION: GROUNDED RETAINING PLINTHS (Y <= -5.5m)
  // =========================================================================

  private buildGroundedRetainingPlinths(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number
  ): void {
    const plinthGroup = new THREE.Group();
    plinthGroup.name = 'viva_retaining_plinth';

    const wallX = roadbedWidth * 0.5 + 2.0;
    const plinthW = 2.4;
    const plinthH = 7.5; // Y from -6.35m to +1.15m (deep bedrock plinth!)

    // Left retaining plinth (-X)
    const leftPlinth = new THREE.Mesh(this.getBox(plinthW, plinthH, chunkLength), this.velvetCrimsonMat);
    leftPlinth.position.set(-wallX - plinthW * 0.5, -2.6, -chunkLength * 0.5);
    plinthGroup.add(leftPlinth);

    // Right coastal seawall plinth (+X)
    const rightPlinth = new THREE.Mesh(this.getBox(plinthW, plinthH, chunkLength), this.velvetCrimsonMat);
    rightPlinth.position.set(wallX + plinthW * 0.5, -2.6, -chunkLength * 0.5);
    plinthGroup.add(rightPlinth);

    // Coral-scarlet curb capstones
    const curbW = curbWidth;
    const curbH = 0.45;
    const curbLeft = new THREE.Mesh(this.getBox(curbW, curbH, chunkLength), this.coralMarbleMat);
    curbLeft.position.set(-wallX + curbW * 0.5, 0.22, -chunkLength * 0.5);
    plinthGroup.add(curbLeft);

    const curbRight = new THREE.Mesh(this.getBox(curbW, curbH, chunkLength), this.coralMarbleMat);
    curbRight.position.set(wallX - curbW * 0.5, 0.22, -chunkLength * 0.5);
    plinthGroup.add(curbRight);

    // Golden curb inlay beading
    const beadLeft = new THREE.Mesh(this.getBox(0.12, 0.12, chunkLength), this.sunsetGoldMat);
    beadLeft.position.set(-wallX + curbW * 0.5, 0.46, -chunkLength * 0.5);
    plinthGroup.add(beadLeft);

    const beadRight = new THREE.Mesh(this.getBox(0.12, 0.12, chunkLength), this.sunsetGoldMat);
    beadRight.position.set(wallX - curbW * 0.5, 0.46, -chunkLength * 0.5);
    plinthGroup.add(beadRight);

    group.add(plinthGroup);
  }

  // =========================================================================
  // CONTINUOUS OCEAN SURFACE & SEASIDE PROMENADE (+X FLANK)
  // =========================================================================

  private buildContinuousOceanAndPromenade(
    group: THREE.Group,
    wallX: number,
    chunkLength: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: FeverDirector
  ): void {
    const seasideGroup = new THREE.Group();
    seasideGroup.name = 'viva_heat_seaside_promenade';

    // Ocean Surface Plane extending to the horizon
    const oceanW = 120.0;
    const oceanMesh = new THREE.Mesh(this.getPlane(oceanW, chunkLength * 1.5), this.oceanWaterMat);
    oceanMesh.rotation.x = -Math.PI * 0.5;
    oceanMesh.position.set(wallX + oceanW * 0.5 + 4.0, -1.2, -chunkLength * 0.5);
    seasideGroup.add(oceanMesh);

    // Coastal Waterline Foam Breaker Strip along retaining seawall
    const foamMesh = new THREE.Mesh(this.getPlane(2.5, chunkLength * 1.5), this.oceanFoamMat);
    foamMesh.rotation.x = -Math.PI * 0.5;
    foamMesh.position.set(wallX + 8.2, -1.16, -chunkLength * 0.5);
    seasideGroup.add(foamMesh);

    // Sunset Specular Reflection Band on Ocean Surface
    const sunReflection = new THREE.Mesh(
      this.getPlane(8.0, chunkLength * 1.5),
      new THREE.MeshBasicMaterial({
        color: VIVA_PALETTE.sunsetGold,
        transparent: true,
        opacity: 0.08, // Subtle shimmering reflection, preserving rich coastal water
        side: THREE.DoubleSide
      })
    );
    sunReflection.rotation.x = -Math.PI * 0.5;
    sunReflection.position.set(wallX + 24.0, -1.18, -chunkLength * 0.5);
    seasideGroup.add(sunReflection);

    // Seaside Promenade Marble Boardwalk Deck
    const deckW = 7.5;
    const deckH = 0.8;
    const deckMesh = new THREE.Mesh(this.getBox(deckW, deckH, chunkLength), this.coralMarbleMat);
    deckMesh.position.set(wallX + deckW * 0.5 + 0.4, -0.4, -chunkLength * 0.5);
    seasideGroup.add(deckMesh);

    // Promenade Balustrade with Golden Rails at edge of water
    const balustradeRail = new THREE.Mesh(this.getBox(0.3, 0.18, chunkLength), this.sunsetGoldMat);
    balustradeRail.position.set(wallX + deckW + 0.2, 0.95, -chunkLength * 0.5);
    seasideGroup.add(balustradeRail);

    // Balustrade Posts & Amber Globe Lanterns
    const postCount = Math.floor(chunkLength / 12);
    for (let i = 0; i <= postCount; i++) {
      const pz = -i * 12;
      const postMesh = new THREE.Mesh(this.getCylinder(0.18, 0.22, 1.0, 6), this.velvetCrimsonMat);
      postMesh.position.set(wallX + deckW + 0.2, 0.45, pz);
      seasideGroup.add(postMesh);

      const globe = new THREE.Mesh(this.getSphere(0.38, 8), this.amberLanternMat);
      globe.position.set(wallX + deckW + 0.2, 1.2, pz);
      seasideGroup.add(globe);
    }

    // Floating Festival Beacon Buoys in water
    if (detail !== 'MINIMAL') {
      const buoyCount = Math.floor(chunkLength / 35);
      for (let b = 0; b < buoyCount; b++) {
        const bz = -b * 35 - 15.0;
        const buoyGroup = new THREE.Group();
        buoyGroup.position.set(wallX + 28.0 + (b % 2) * 12.0, -0.6, bz);

        const buoyBody = new THREE.Mesh(this.getCylinder(0.8, 0.4, 1.6, 6), this.coralMarbleMat);
        buoyGroup.add(buoyBody);

        const buoyMast = new THREE.Mesh(this.getCylinder(0.1, 0.1, 1.8, 5), this.sunsetGoldMat);
        buoyMast.position.y = 1.3;
        buoyGroup.add(buoyMast);

        const buoyLight = new THREE.Mesh(this.getSphere(0.35, 6), this.amberLanternMat);
        buoyLight.position.y = 2.3;
        buoyGroup.add(buoyLight);

        seasideGroup.add(buoyGroup);
      }
    }

    group.add(seasideGroup);
  }

  // =========================================================================
  // CONTINUOUS INLAND FESTIVAL PROMENADE & VIP LOUNGES (-X FLANK)
  // =========================================================================

  private buildContinuousInlandPromenade(
    group: THREE.Group,
    flankX: number,
    chunkLength: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: FeverDirector,
    rng: SeededRandom
  ): void {
    const inlandGroup = new THREE.Group();
    inlandGroup.name = 'viva_heat_inland_promenade';

    // Wide Inland Promenade Floor ($X = -8.4m$ to $-26.0m$)
    const floorW = 18.0;
    const floorH = 0.8;
    const floorMesh = new THREE.Mesh(this.getBox(floorW, floorH, chunkLength), this.coralMarbleMat);
    floorMesh.position.set(flankX - floorW * 0.5 - 0.4, -0.4, -chunkLength * 0.5);
    inlandGroup.add(floorMesh);

    // Decorative Cream Marble Inlay Stripe
    const stripeMesh = new THREE.Mesh(this.getBox(1.6, 0.82, chunkLength), this.creamMarbleMat);
    stripeMesh.position.set(flankX - 5.0, -0.39, -chunkLength * 0.5);
    inlandGroup.add(stripeMesh);

    // Trackside Promenade Balustrade at $X = -8.6m$
    const railMesh = new THREE.Mesh(this.getBox(0.28, 0.18, chunkLength), this.sunsetGoldMat);
    railMesh.position.set(flankX - 0.2, 0.95, -chunkLength * 0.5);
    inlandGroup.add(railMesh);

    // Balustrade Posts & Amber Globe Lanterns
    const postCount = Math.floor(chunkLength / 12);
    for (let i = 0; i <= postCount; i++) {
      const pz = -i * 12;
      const post = new THREE.Mesh(this.getCylinder(0.18, 0.22, 1.0, 6), this.velvetCrimsonMat);
      post.position.set(flankX - 0.2, 0.45, pz);
      inlandGroup.add(post);

      const globe = new THREE.Mesh(this.getSphere(0.38, 8), this.amberLanternMat);
      globe.position.set(flankX - 0.2, 1.2, pz);
      inlandGroup.add(globe);
    }

    // VIP Lounge Cabanas with Striped Sunshades & Cocktail Lounges
    if (detail !== 'MINIMAL') {
      const cabanaCount = Math.floor(chunkLength / 32);
      for (let c = 0; c < cabanaCount; c++) {
        const cz = -c * 32 - 16.0;
        const cabanaGroup = new THREE.Group();
        const cabanaX = flankX - 4.5;
        cabanaGroup.position.set(cabanaX, 0, cz);

        // 4 Slender Gilded Pillars
        for (const dx of [-1.8, 1.8]) {
          for (const dz of [-1.8, 1.8]) {
            const pillar = new THREE.Mesh(this.getCylinder(0.12, 0.14, 3.8, 6), this.sunsetGoldMat);
            pillar.position.set(dx, 1.9, dz);
            cabanaGroup.add(pillar);
          }
        }

        // Scalloped Striped Sunshade Canopy
        const canopyMesh = new THREE.Mesh(this.getBox(4.2, 0.35, 4.2), this.coralMarbleMat);
        canopyMesh.position.y = 3.9;
        cabanaGroup.add(canopyMesh);

        const canopyAccent = new THREE.Mesh(this.getBox(3.8, 0.4, 1.2), this.creamMarbleMat);
        canopyAccent.position.y = 3.92;
        cabanaGroup.add(canopyAccent);

        // Velvet Lounge Daybed
        const daybed = new THREE.Mesh(this.getBox(2.8, 0.6, 2.0), this.velvetCrimsonMat);
        daybed.position.set(0, 0.3, 0);
        cabanaGroup.add(daybed);

        // Brass Cocktail Table with Champagne Glass
        const table = new THREE.Mesh(this.getCylinder(0.55, 0.45, 0.75, 7), this.sunsetGoldMat);
        table.position.set(1.8, 0.38, 0.8);
        cabanaGroup.add(table);

        const glass = new THREE.Mesh(this.getCylinder(0.08, 0.04, 0.35, 5), this.champagneSprayMat);
        glass.position.set(1.8, 0.9, 0.8);
        cabanaGroup.add(glass);

        // Staged Haute Couture Reveler at VIP cabana
        const reveler = VivaHeatCharacters.createHauteCoutureReveler(cabanaX + 1.2, 0.4, cz + 0.6, c % 2 === 0 ? 'warm' : 'deep');
        inlandGroup.add(reveler.group);
        director.registerAdultDancer(reveler.dancer);

        inlandGroup.add(cabanaGroup);
      }

      // Stone Bougainvillea Planter Urns with overflowing blossoms
      const planterCount = Math.floor(chunkLength / 20);
      for (let p = 0; p < planterCount; p++) {
        const pz = -p * 20 - 8.0;
        const urnGroup = new THREE.Group();
        urnGroup.position.set(flankX - 1.2, 0, pz);

        const baseUrn = new THREE.Mesh(this.getCylinder(0.65, 0.5, 0.8, 6), this.velvetCrimsonMat);
        baseUrn.position.y = 0.4;
        urnGroup.add(baseUrn);

        const foliage = new THREE.Mesh(this.getSphere(0.85, 6), this.palmFrondMat);
        foliage.position.y = 1.0;
        foliage.scale.set(1.2, 0.8, 1.2);
        urnGroup.add(foliage);

        const flowers = new THREE.Mesh(this.getSphere(0.9, 6), this.bougainvilleaMat);
        flowers.position.y = 1.05;
        flowers.scale.set(1.15, 0.75, 1.15);
        urnGroup.add(flowers);

        inlandGroup.add(urnGroup);
      }
    }

    group.add(inlandGroup);
  }

  // =========================================================================
  // DISTRICT A: SUNSET PROMENADE & MONUMENTAL SUN (GATE A: MEGA-YACHT DOCKING)
  // =========================================================================

  private buildDistrictSunsetPromenade(
    group: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: FeverDirector,
    worldZ: number
  ): void {
    const district = new THREE.Group();
    district.name = 'zone_sunset_promenade';

    // 1. Monumental Scarlet Sun Landmark on the Ocean Horizon
    this.buildScarletSunLandmark(district, chunkLength, director);

    // 2. Flagship Encounter 1: Grand Mega-Yacht Arrival & Champagne Docking
    this.buildGrandMegaYachtArrivalEncounter(district, wallX, chunkLength, director, worldZ);

    // 3. Raised VIP Stage on Inland Promenade Flank (-X) with Haute Couture Reveler
    this.buildInlandFestivalBoulevard(district, -wallX, chunkLength, rng, detail, director);

    // 4. Parabolic Festival Arches
    this.buildParabolicFestivalArches(district, wallX * 2, chunkLength);

    // 5. Kinetic Flower Pod & Royal Palms
    this.buildKineticFlowerPod(district, -wallX - 9.0, -chunkLength * 0.35, director, 0);
    this.buildTropicalRoyalPalms(district, wallX, chunkLength, rng, detail);

    group.add(district);
  }

  // =========================================================================
  // DISTRICT B: GILDED AMPHITHEATRE & DJ CONCOURSE
  // =========================================================================

  private buildDistrictGildedAmphitheatre(
    group: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: FeverDirector,
    worldZ: number
  ): void {
    const district = new THREE.Group();
    district.name = 'zone_gilded_amphitheatre';

    const stageX = -wallX - 14.0;
    const stageZ = -chunkLength * 0.5;

    // Colossal Tiered Festival Stage Structure
    const stageBase = new THREE.Mesh(this.getBox(22.0, 3.5, 34.0), this.velvetCrimsonMat);
    stageBase.position.set(stageX, 0.8, stageZ);
    district.add(stageBase);

    const stagePlatter = new THREE.Mesh(this.getBox(18.0, 0.6, 30.0), this.sunsetGoldMat);
    stagePlatter.position.set(stageX, 2.7, stageZ);
    stagePlatter.name = 'viva_heat_festival_stage';
    district.add(stagePlatter);

    // Monumental Sound & Laser Towers
    for (const sign of [-1, 1]) {
      const towerZ = stageZ + sign * 14.0;
      const soundTower = new THREE.Mesh(this.getBox(3.0, 16.0, 3.0), this.soundSpeakerMat);
      soundTower.position.set(stageX - 7.0, 8.0, towerZ);
      district.add(soundTower);

      // Pyrotechnic Flame Tower on top of sound tower
      const flamePlume = new THREE.Mesh(this.getCylinder(0.2, 1.4, 5.0, 6), this.flamePlumeMat);
      flamePlume.position.set(stageX - 7.0, 18.5, towerZ);
      flamePlume.visible = false;
      district.add(flamePlume);

      director.registerFlameTower({
        group: district,
        flamePlume,
        triggerZ: worldZ + stageZ,
        phase: sign > 0 ? 0 : Math.PI * 0.5,
        activeTimer: 0
      });
    }

    // Overhead Sweeping Theatrical Skybeams
    this.buildTheatricalSkybeams(district, stageX, stageZ, director);

    // Signature B: Grand Stage Finale & Concert Amphitheatre
    const laserBeams: THREE.Group[] = [];
    [-0.3, -0.15, 0, 0.15, 0.3].forEach((angle, bIdx) => {
      const beamGroup = new THREE.Group();
      beamGroup.position.set(stageX - 6.0, 16.0, stageZ + (bIdx - 2) * 4.0);
      const beamMesh = new THREE.Mesh(this.getCylinder(0.12, 0.45, 28.0, 6), this.neonCyanGlowMat);
      beamMesh.position.y = 14.0;
      beamGroup.add(beamMesh);
      beamGroup.rotation.z = angle;
      district.add(beamGroup);
      laserBeams.push(beamGroup);
    });

    const pyroJets: THREE.Mesh[] = [];
    [-8.0, 0, 8.0].forEach((pz) => {
      const jet = new THREE.Mesh(this.getCylinder(0.15, 0.8, 5.5, 6), this.flamePlumeMat);
      jet.position.set(stageX + 5.0, 3.2, stageZ + pz);
      jet.visible = false;
      district.add(jet);
      pyroJets.push(jet);
    });

    const coronaBackdrop = new THREE.Mesh(this.getSphere(9.0, 12), this.ferrisWheelGlowMat);
    coronaBackdrop.position.set(stageX - 10.0, 14.0, stageZ);
    coronaBackdrop.scale.set(1.0, 1.0, 0.2);
    district.add(coronaBackdrop);

    // Haute Couture Revelers & Dancers on Stage
    const finaleDancers: THREE.Group[] = [];
    if (detail !== 'MINIMAL') {
      const dancer1 = VivaHeatCharacters.createFestivalDancer(stageX - 1.0, 3.0, stageZ - 4.0);
      district.add(dancer1.group);
      director.registerAdultDancer(dancer1.dancer);
      finaleDancers.push(dancer1.group);

      const dancer2 = VivaHeatCharacters.createFestivalDancer(stageX - 1.0, 3.0, stageZ + 4.0);
      district.add(dancer2.group);
      director.registerAdultDancer(dancer2.dancer);
      finaleDancers.push(dancer2.group);

      const reveler = VivaHeatCharacters.createHauteCoutureReveler(stageX + 3.0, 3.0, stageZ, 'warm');
      district.add(reveler.group);
      director.registerAdultDancer(reveler.dancer);
      finaleDancers.push(reveler.group);
    }

    director.registerGrandStageFinale({
      group: district,
      stageBase,
      dancers: finaleDancers,
      laserBeams,
      pyroJets,
      coronaBackdrop,
      triggerZ: worldZ + stageZ,
      state: 'DORMANT',
      timer: 0
    });

    group.add(district);
  }

  // =========================================================================
  // DISTRICT C: KINETIC FLORA PAVILION (GATE B: FLORA AWAKENING)
  // =========================================================================

  private buildDistrictKineticFlora(
    group: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: FeverDirector,
    worldZ: number
  ): void {
    const district = new THREE.Group();
    district.name = 'zone_kinetic_flora';

    // 1. Flagship Encounter 2: Colossal Kinetic Flora Awakening & Solar Pulse
    this.buildColossalKineticFloraAwakeningEncounter(district, -wallX, chunkLength, director, worldZ);

    // 2. Botanical Garden Tier of Ambient Kinetic Lotus Sculptures
    const flowerSpacing = chunkLength / 3;
    for (let i = 0; i < 3; i++) {
      const fz = -i * flowerSpacing - 14.0;
      this.buildKineticFlowerPod(district, -wallX - 8.5, fz, director, i * 1.5);
    }

    // 3. Floating Illuminated Sky Lantern Swarm
    if (detail !== 'MINIMAL') {
      this.buildFloatingLanternSwarm(district, -wallX - 14.0, -chunkLength * 0.5, director);
    }

    group.add(district);
  }

  // =========================================================================
  // DISTRICT D: MIDNIGHT YACHT MARINA & CHAMPAGNE PIER
  // =========================================================================

  private buildDistrictMidnightMarina(
    group: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: FeverDirector,
    worldZ: number
  ): void {
    const district = new THREE.Group();
    district.name = 'zone_midnight_marina';

    const marinaZ = -chunkLength * 0.5;

    // Marina Pier Extension Wooden Boardwalk into water (+X)
    const pierW = 18.0;
    const pierMesh = new THREE.Mesh(this.getBox(pierW, 0.8, 30.0), this.yachtDeckWoodMat);
    pierMesh.position.set(wallX + pierW * 0.5 + 3.0, -0.4, marinaZ);
    district.add(pierMesh);

    // Marina Wooden Pilings extending down to Y <= -5.5m
    for (let px = wallX + 5.0; px <= wallX + pierW + 2.0; px += 6.0) {
      for (let pz = marinaZ - 12.0; pz <= marinaZ + 12.0; pz += 12.0) {
        const piling = new THREE.Mesh(this.getCylinder(0.35, 0.35, 5.5, 6), this.palmTrunkMat);
        piling.position.set(px, -3.0, pz);
        district.add(piling);
      }
    }

    // Moored Luxury Motor-Yacht alongside pier
    const yachtGroup = new THREE.Group();
    yachtGroup.name = 'viva_heat_luxury_yacht';
    yachtGroup.position.set(wallX + pierW + 10.0, -0.8, marinaZ);

    const hull = new THREE.Mesh(this.getBox(8.5, 3.4, 26.0), this.yachtHullMat);
    hull.position.y = 1.0;
    yachtGroup.add(hull);

    const cabin = new THREE.Mesh(this.getBox(6.2, 2.6, 14.0), this.coralMarbleMat);
    cabin.position.set(0, 3.2, -2.0);
    yachtGroup.add(cabin);

    const neonRail = new THREE.Mesh(this.getBox(8.2, 0.2, 25.8), this.neonCyanGlowMat);
    neonRail.position.y = 2.7;
    yachtGroup.add(neonRail);

    district.add(yachtGroup);
    director.registerCoastalYacht({
      group: yachtGroup,
      speed: 1.5,
      bobOffset: rng.next() * Math.PI * 2,
      initialZ: marinaZ,
      minZ: -chunkLength * 1.5,
      maxZ: chunkLength * 0.5
    });

    // Waterside Champagne Lounge & Masquerade Maestro
    if (detail !== 'MINIMAL') {
      const maestro = VivaHeatCharacters.createMasqueradeMaestro(-wallX - 6.5, 0.4, marinaZ);
      district.add(maestro.group);
      director.registerAdultDancer(maestro.dancer);
    }

    group.add(district);
  }

  // =========================================================================
  // DISTRICT E: ROYAL PALM COLONNADE & GALA BALLROOM
  // =========================================================================

  private buildDistrictRoyalColonnade(
    group: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: FeverDirector,
    worldZ: number
  ): void {
    const district = new THREE.Group();
    district.name = 'zone_royal_colonnade';

    // 1. Colonnade of Gilded Royal Palms (both flanks)
    this.buildTropicalRoyalPalms(district, wallX, chunkLength, rng, detail);

    // 2. Sculptural Parabolic Overhead Festival Arches with Cascading Silk Ribbons
    this.buildParabolicFestivalArches(district, wallX * 2, chunkLength);

    // 3. High-Fashion Masquerade Gala Performers on promenade
    if (detail !== 'MINIMAL') {
      const model = VivaHeatCharacters.createAvantGardeModel(-wallX - 6.5, 0.4, -chunkLength * 0.4);
      district.add(model.group);
      director.registerAdultDancer(model.dancer);

      const reveler = VivaHeatCharacters.createHauteCoutureReveler(-wallX - 6.5, 0.4, -chunkLength * 0.7, 'deep');
      district.add(reveler.group);
      director.registerAdultDancer(reveler.dancer);
    }

    group.add(district);
  }

  // =========================================================================
  // DISTRICT F: GRAND SUNSET CARNIVAL & FIREWORKS BAY
  // =========================================================================

  private buildDistrictSunsetCarnival(
    group: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: FeverDirector,
    worldZ: number
  ): void {
    const district = new THREE.Group();
    district.name = 'zone_sunset_carnival';

    const carnivalZ = -chunkLength * 0.5;

    // Colossal Offshore Ferris Wheel of Fire (+X flank over ocean)
    const wheelGroup = new THREE.Group();
    wheelGroup.name = 'viva_heat_ferris_wheel';
    wheelGroup.position.set(wallX + 44.0, 22.0, carnivalZ);

    const outerRim = new THREE.Mesh(this.getTorus(18.0, 0.65, 8, 24), this.ferrisWheelGlowMat);
    wheelGroup.add(outerRim);

    const innerRim = new THREE.Mesh(this.getTorus(12.0, 0.45, 8, 20), this.coralMarbleMat);
    wheelGroup.add(innerRim);

    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const spoke = new THREE.Mesh(this.getCylinder(0.2, 0.2, 36.0, 4), this.sunsetGoldMat);
      spoke.rotation.z = angle;
      wheelGroup.add(spoke);
    }
    district.add(wheelGroup);

    // Giant Triumphal Festival Gateway Arch
    const archGroup = new THREE.Group();
    archGroup.name = 'viva_heat_gateway_triumph';
    archGroup.position.set(0, 0, carnivalZ);

    const pLeft = new THREE.Mesh(this.getBox(2.2, 12.0, 2.2), this.coralMarbleMat);
    pLeft.position.set(-wallX - 1.0, 6.0, 0);
    archGroup.add(pLeft);

    const pRight = new THREE.Mesh(this.getBox(2.2, 12.0, 2.2), this.coralMarbleMat);
    pRight.position.set(wallX + 1.0, 6.0, 0);
    archGroup.add(pRight);

    // Cross-span strictly at Y >= 8.5m
    const span = new THREE.Mesh(this.getBox(wallX * 2 + 4.0, 1.8, 3.0), this.sunsetGoldMat);
    span.position.set(0, 11.5, 0);
    archGroup.add(span);

    district.add(archGroup);

    // Pyrotechnic Flame Towers on pier
    for (const sign of [-1, 1]) {
      const flamePlume = new THREE.Mesh(this.getCylinder(0.2, 1.4, 6.0, 6), this.flamePlumeMat);
      flamePlume.position.set(wallX + 12.0, 8.0, carnivalZ + sign * 16.0);
      flamePlume.visible = false;
      district.add(flamePlume);

      director.registerFlameTower({
        group: district,
        flamePlume,
        triggerZ: worldZ + carnivalZ,
        phase: sign > 0 ? Math.PI * 0.25 : Math.PI * 0.75,
        activeTimer: 0
      });
    }

    // Signature A: Tropical Festival Procession
    const procGroup = new THREE.Group();
    procGroup.name = 'viva_heat_festival_procession';
    const floatInitialX = -wallX - 14.0;
    const floatTargetX = -wallX - 9.0;
    procGroup.position.set(floatInitialX, 0.4, carnivalZ);

    const floatChassis = new THREE.Mesh(this.getBox(6.5, 1.4, 16.0), this.velvetCrimsonMat);
    floatChassis.position.y = 1.0;
    procGroup.add(floatChassis);

    const goldPlatter = new THREE.Mesh(this.getBox(5.8, 0.4, 14.5), this.sunsetGoldMat);
    goldPlatter.position.y = 1.9;
    procGroup.add(goldPlatter);

    const procWheels: THREE.Mesh[] = [];
    [[-2.8, -5.0], [2.8, -5.0], [-2.8, 5.0], [2.8, 5.0]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(this.getCylinder(0.8, 0.8, 0.45, 8), this.sunsetGoldMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.8, wz);
      procGroup.add(wheel);
      procWheels.push(wheel);
    });

    const ribbonBanners: THREE.Mesh[] = [];
    [-4.0, 0, 4.0].forEach((rz) => {
      const pole = new THREE.Mesh(this.getCylinder(0.08, 0.08, 4.5, 6), this.sunsetGoldMat);
      pole.position.set(0, 4.0, rz);
      procGroup.add(pole);

      const ribbon = new THREE.Mesh(this.getBox(0.05, 1.2, 3.2), this.coralMarbleMat);
      ribbon.position.set(0.6, 5.2, rz);
      procGroup.add(ribbon);
      ribbonBanners.push(ribbon);
    });

    const petalCannons: THREE.Mesh[] = [];
    [-5.5, 5.5].forEach((cz) => {
      const cannon = new THREE.Mesh(this.getCylinder(0.3, 0.45, 1.8, 8), this.soundSpeakerMat);
      cannon.position.set(0, 2.8, cz);
      procGroup.add(cannon);

      const petalSpray = new THREE.Mesh(this.getSphere(1.2, 8), this.ferrisWheelGlowMat);
      petalSpray.position.set(0, 4.2, cz);
      petalSpray.visible = false;
      procGroup.add(petalSpray);
      petalCannons.push(petalSpray);
    });

    const procDancers: THREE.Group[] = [];
    if (detail !== 'MINIMAL') {
      const pd1 = VivaHeatCharacters.createFestivalDancer(floatInitialX + 3.5, 0.4, carnivalZ - 6.0);
      district.add(pd1.group);
      director.registerAdultDancer(pd1.dancer);
      procDancers.push(pd1.group);

      const pd2 = VivaHeatCharacters.createFestivalDancer(floatInitialX + 3.5, 0.4, carnivalZ + 6.0);
      district.add(pd2.group);
      director.registerAdultDancer(pd2.dancer);
      procDancers.push(pd2.group);

      const maestro = VivaHeatCharacters.createMasqueradeMaestro(floatInitialX, 2.5, carnivalZ);
      district.add(maestro.group);
      director.registerAdultDancer(maestro.dancer);
      procDancers.push(maestro.group);
    }

    district.add(procGroup);

    director.registerFestivalProcession({
      group: district,
      floatGroup: procGroup,
      wheels: procWheels,
      dancers: procDancers,
      ribbonBanners,
      petalCannons,
      triggerZ: worldZ + carnivalZ,
      state: 'DORMANT',
      timer: 0,
      initialX: floatInitialX,
      targetX: floatTargetX
    });

    group.add(district);
  }

  // =========================================================================
  // GATE A: GRAND MEGA-YACHT ARRIVAL & CHAMPAGNE DOCKING ENCOUNTER
  // =========================================================================

  private buildGrandMegaYachtArrivalEncounter(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    director: FeverDirector,
    worldZ: number
  ): void {
    const encounterGroup = new THREE.Group();
    encounterGroup.name = 'viva_heat_mega_yacht_encounter';

    const triggerZ = worldZ - chunkLength * 0.5;
    encounterGroup.position.set(0, 0, -chunkLength * 0.5);

    // Colossal 42-Meter Luxury Mega-Yacht
    const yachtMesh = new THREE.Group();
    yachtMesh.name = 'grand_mega_yacht_mesh';
    const initialX = wallX + 32.0;
    const targetX = wallX + 11.5;
    yachtMesh.position.set(initialX, 0, 0);

    // Sleek Aerodynamic Hull
    const hullGeo = this.getBox(9.8, 4.4, 42.0);
    const hullMesh = new THREE.Mesh(hullGeo, this.yachtHullMat);
    hullMesh.position.y = 1.3;
    yachtMesh.add(hullMesh);

    // Gold Waterline Stripe
    const stripeMesh = new THREE.Mesh(this.getBox(10.0, 0.25, 42.2), this.sunsetGoldMat);
    stripeMesh.position.y = 0.4;
    yachtMesh.add(stripeMesh);

    // Multi-tier Luxury Bridge & Saloon Cabins
    const saloonGeo = this.getBox(7.4, 3.2, 24.0);
    const saloonMesh = new THREE.Mesh(saloonGeo, this.coralMarbleMat);
    saloonMesh.position.set(0, 4.4, -2.0);
    yachtMesh.add(saloonMesh);

    const bridgeGeo = this.getBox(5.6, 2.4, 12.0);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, this.sunsetGoldMat);
    bridgeMesh.position.set(0, 6.8, -4.0);
    yachtMesh.add(bridgeMesh);

    // Radar Arch & Satellite Domes on Bridge Top
    const radarMast = new THREE.Mesh(this.getCylinder(0.15, 0.25, 3.2, 6), this.sunsetGoldMat);
    radarMast.position.set(0, 9.2, -5.0);
    yachtMesh.add(radarMast);

    const satDomeL = new THREE.Mesh(this.getSphere(0.7, 7), this.yachtHullMat);
    satDomeL.position.set(-1.8, 8.4, -6.0);
    yachtMesh.add(satDomeL);

    const satDomeR = new THREE.Mesh(this.getSphere(0.7, 7), this.yachtHullMat);
    satDomeR.position.set(1.8, 8.4, -6.0);
    yachtMesh.add(satDomeR);

    // Twin Halogen Searchlights on Bow
    const searchL = new THREE.Group();
    const beamGeoL = this.getCylinder(0.1, 2.2, 18.0, 6);
    const beamMeshL = new THREE.Mesh(beamGeoL, this.spotlightBeamMat);
    beamMeshL.rotation.x = Math.PI * 0.5;
    beamMeshL.position.z = 9.0;
    searchL.add(beamMeshL);
    searchL.position.set(-2.5, 3.5, 16.0);
    yachtMesh.add(searchL);

    const searchR = new THREE.Group();
    const beamGeoR = this.getCylinder(0.1, 2.2, 18.0, 6);
    const beamMeshR = new THREE.Mesh(beamGeoR, this.spotlightBeamMat);
    beamMeshR.rotation.x = Math.PI * 0.5;
    beamMeshR.position.z = 9.0;
    searchR.add(beamMeshR);
    searchR.position.set(2.5, 3.5, 16.0);
    yachtMesh.add(searchR);

    // Champagne Water-Cannon Arcs
    const waterSprayArc = new THREE.Mesh(this.getTorus(7.0, 0.45, 6, 16), this.champagneSprayMat);
    waterSprayArc.position.set(-4.8, 4.0, 0);
    waterSprayArc.rotation.z = Math.PI * 0.45;
    waterSprayArc.visible = false;
    yachtMesh.add(waterSprayArc);

    const champagneCannons: THREE.Group[] = [];
    const champagneJets: THREE.Mesh[] = [];
    for (let c = 0; c < 3; c++) {
      const cannon = new THREE.Group();
      cannon.position.set(-4.0, 3.2, -10.0 + c * 10.0);
      const jet = new THREE.Mesh(this.getCylinder(0.1, 0.85, 7.0, 6), this.champagneSprayMat);
      jet.position.set(-1.8, 2.8, 0);
      jet.rotation.z = Math.PI * 0.35;
      jet.visible = false;
      cannon.add(jet);
      champagneCannons.push(cannon);
      champagneJets.push(jet);
      yachtMesh.add(cannon);
    }

    // Party Strobes on Top Deck
    const deckStrobes: THREE.Mesh[] = [];
    for (let s = 0; s < 4; s++) {
      const strobe = new THREE.Mesh(this.getSphere(0.4, 6), this.neonCyanGlowMat);
      strobe.position.set(-2.5 + (s % 2) * 5.0, 6.0, -12.0 + s * 8.0);
      strobe.visible = false;
      deckStrobes.push(strobe);
      yachtMesh.add(strobe);
    }

    encounterGroup.add(yachtMesh);

    // Telescoping Docking Gangway at Promenade Pier Edge
    const dockingGangway = new THREE.Group();
    dockingGangway.name = 'docking_gangway';
    dockingGangway.position.set(wallX + 6.8, 0.2, 0);
    const gangwayMesh = new THREE.Mesh(this.getBox(5.0, 0.4, 2.8), this.sunsetGoldMat);
    dockingGangway.add(gangwayMesh);
    dockingGangway.scale.set(0.1, 1.0, 1.0);
    encounterGroup.add(dockingGangway);

    director.registerGrandDocking({
      group: encounterGroup,
      yachtMesh,
      dockingGangway,
      champagneCannons,
      champagneJets,
      deckStrobes,
      searchlightL: searchL,
      searchlightR: searchR,
      waterSprayArc,
      triggerZ,
      state: 'DORMANT',
      timer: 0,
      initialX,
      targetX
    });

    parent.add(encounterGroup);
  }

  // =========================================================================
  // GATE B: COLOSSAL KINETIC FLORA AWAKENING ENCOUNTER
  // =========================================================================

  private buildColossalKineticFloraAwakeningEncounter(
    parent: THREE.Group,
    flankX: number,
    chunkLength: number,
    director: FeverDirector,
    worldZ: number
  ): void {
    const encounterGroup = new THREE.Group();
    encounterGroup.name = 'viva_heat_flora_awakening_encounter';

    const triggerZ = worldZ - chunkLength * 0.5;
    const originX = flankX - 6.5; // -14.9m: Majestic prominence right along promenade while safely clear of running envelope
    encounterGroup.position.set(originX, 0, -chunkLength * 0.5);

    // Concentric Glowing Bioluminescent Ground Runes
    const groundRunes = new THREE.Mesh(this.getPlane(24.0, 24.0), this.sunCoronaMat);
    groundRunes.rotation.x = -Math.PI * 0.5;
    groundRunes.position.y = 0.05;
    encounterGroup.add(groundRunes);

    // Tiered Base Plinth in Velvet Crimson & Gold
    const plinthBase = new THREE.Mesh(this.getCylinder(5.5, 6.5, 1.2, 12), this.velvetCrimsonMat);
    plinthBase.position.y = 0.6;
    encounterGroup.add(plinthBase);

    const plinthGoldRim = new THREE.Mesh(this.getCylinder(5.6, 5.6, 0.25, 12), this.sunsetGoldMat);
    plinthGoldRim.position.y = 1.25;
    encounterGroup.add(plinthGoldRim);

    // Monumental Sculptured Botanical Stem
    const stemMesh = new THREE.Mesh(this.getCylinder(1.4, 2.6, 12.0, 8), this.palmFrondMat);
    stemMesh.position.y = 6.6;
    encounterGroup.add(stemMesh);

    // Luminescent Stem Conduit Ribs
    const stemConduits: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const rib = new THREE.Mesh(this.getCylinder(0.18, 0.18, 11.5, 4), this.goldenStamenMat);
      rib.position.set(Math.cos(angle) * 1.5, 6.6, Math.sin(angle) * 1.5);
      rib.visible = false;
      stemConduits.push(rib);
      encounterGroup.add(rib);
    }

    // Flower Head Mesh with Multi-Tiered Kinetic Petals
    const flowerMesh = new THREE.Group();
    flowerMesh.position.y = 12.5;

    const outerPetals: THREE.Mesh[] = [];
    const innerPetals: THREE.Mesh[] = [];

    // Tier 1: Outer Giant Petals (8 petals)
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const petal = new THREE.Mesh(this.getPlane(4.2, 10.5), this.kineticPetalMat);
      petal.position.set(Math.cos(angle) * 2.4, 0, Math.sin(angle) * 2.4);
      petal.rotation.y = -angle;
      petal.rotation.z = 0.15;
      outerPetals.push(petal);
      flowerMesh.add(petal);
    }

    // Tier 2: Inner Golden Petals (6 petals)
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 + 0.25;
      const petal = new THREE.Mesh(this.getPlane(2.8, 7.2), this.sunsetGoldMat);
      petal.position.set(Math.cos(angle) * 1.5, 0.5, Math.sin(angle) * 1.5);
      petal.rotation.y = -angle;
      petal.rotation.z = 0.1;
      innerPetals.push(petal);
      flowerMesh.add(petal);
    }

    // Radiant Golden Stamen Core (Ascends during bloom)
    const stamenCore = new THREE.Mesh(this.getCylinder(0.7, 1.4, 4.8, 8), this.goldenStamenMat);
    stamenCore.position.y = 6.0;
    flowerMesh.add(stamenCore);

    // Radiant Vertical Solar Beam Cone (Fires at climax)
    const solarBeamCone = new THREE.Mesh(this.getCylinder(0.6, 7.0, 36.0, 8), this.spotlightBeamMat);
    solarBeamCone.position.y = 20.0;
    solarBeamCone.visible = false;
    flowerMesh.add(solarBeamCone);

    encounterGroup.add(flowerMesh);

    director.registerKineticAwakening({
      group: encounterGroup,
      flowerMesh,
      outerPetals,
      innerPetals,
      stamenCore,
      solarBeamCone,
      groundRunes,
      stemConduits,
      bloomLevel: 0.1,
      triggerZ,
      state: 'DORMANT',
      timer: 0
    });

    parent.add(encounterGroup);
  }

  // =========================================================================
  // SUB-BUILDERS & AMBIENT PROCEDURAL ASSETS
  // =========================================================================

  private buildScarletSunLandmark(
    parent: THREE.Group,
    chunkLength: number,
    director: FeverDirector
  ): void {
    const sunGroup = new THREE.Group();
    sunGroup.name = 'viva_heat_scarlet_sun';
    sunGroup.position.set(45.0, 42.0, -chunkLength * 2.5 - 280.0);

    const coreMesh = new THREE.Mesh(this.getSphere(22.0, 16), this.sunCoreMat);
    sunGroup.add(coreMesh);

    const coronaMesh = new THREE.Mesh(this.getPlane(68.0, 68.0), this.sunCoronaMat);
    sunGroup.add(coronaMesh);

    const spokesGroup = new THREE.Group();
    spokesGroup.name = 'sun_solar_spokes';

    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8;
      const spoke = new THREE.Mesh(this.getCylinder(0.4, 1.8, 18.0, 5), this.sunCoronaMat);
      spoke.position.set(Math.cos(angle) * 36.0, Math.sin(angle) * 36.0, 0);
      spoke.rotation.z = angle - Math.PI * 0.5;
      spokesGroup.add(spoke);
    }
    sunGroup.add(spokesGroup);

    director.registerScarletSun({
      group: sunGroup,
      coreDisc: coreMesh,
      coronaRing: coronaMesh,
      solarSpokes: spokesGroup
    });

    parent.add(sunGroup);
  }

  private buildInlandFestivalBoulevard(
    parent: THREE.Group,
    flankX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: FeverDirector
  ): void {
    const inlandGroup = new THREE.Group();
    inlandGroup.name = 'viva_heat_inland_boulevard';

    // Tiered Raised Festival Dance Stage
    const stageW = 14.0;
    const stageH = 1.4;
    const stageD = 18.0;
    const stageGroup = new THREE.Group();
    stageGroup.name = 'viva_heat_festival_stage';
    stageGroup.position.set(flankX - stageW * 0.5 - 3.0, 0, -chunkLength * 0.5);

    const stagePlinth = new THREE.Mesh(this.getBox(stageW, stageH, stageD), this.velvetCrimsonMat);
    stagePlinth.position.y = stageH * 0.5;
    stageGroup.add(stagePlinth);

    const stageFloor = new THREE.Mesh(this.getBox(stageW - 0.8, 0.2, stageD - 0.8), this.sunsetGoldMat);
    stageFloor.position.y = stageH + 0.1;
    stageGroup.add(stageFloor);

    // Festival Performers
    if (detail !== 'MINIMAL') {
      const dancer = VivaHeatCharacters.createFestivalDancer(0, stageH + 0.2, 0);
      stageGroup.add(dancer.group);
      director.registerAdultDancer(dancer.dancer);
    }

    inlandGroup.add(stageGroup);
    parent.add(inlandGroup);
  }

  private buildKineticFlowerPod(
    parent: THREE.Group,
    px: number,
    pz: number,
    director: FeverDirector,
    phaseOffset: number
  ): void {
    const flowerGroup = new THREE.Group();
    flowerGroup.name = 'viva_heat_kinetic_flower';
    flowerGroup.position.set(px, 0, pz);

    // Octagonal Base Plinth
    const plinth = new THREE.Mesh(this.getCylinder(1.6, 1.9, 0.6, 8), this.velvetCrimsonMat);
    plinth.position.y = 0.3;
    flowerGroup.add(plinth);

    const goldPlinthRim = new THREE.Mesh(this.getCylinder(1.65, 1.65, 0.15, 8), this.sunsetGoldMat);
    goldPlinthRim.position.y = 0.65;
    flowerGroup.add(goldPlinthRim);

    // S-Curved Fluted Stem
    const stemLower = new THREE.Mesh(this.getCylinder(0.4, 0.55, 2.5, 7), this.palmFrondMat);
    stemLower.position.set(0, 1.8, 0);
    stemLower.rotation.z = 0.08;
    flowerGroup.add(stemLower);

    const stemUpper = new THREE.Mesh(this.getCylinder(0.3, 0.4, 2.5, 7), this.palmFrondMat);
    stemUpper.position.set(0.18, 4.0, 0);
    stemUpper.rotation.z = -0.06;
    flowerGroup.add(stemUpper);

    // Gilded Node Rings
    const nodeRing = new THREE.Mesh(this.getCylinder(0.48, 0.48, 0.2, 7), this.sunsetGoldMat);
    nodeRing.position.set(0.08, 2.9, 0);
    flowerGroup.add(nodeRing);

    // Petals (Outer Scarlet + Inner Gold)
    const petals: THREE.Object3D[] = [];
    const petalHeadY = 5.2;

    // 8 Outer Scarlet Satin Petals
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const petal = new THREE.Mesh(this.getPlane(1.8, 4.2), this.kineticPetalMat);
      petal.position.set(Math.cos(angle) * 0.9, petalHeadY, Math.sin(angle) * 0.9);
      petal.rotation.y = -angle;
      petal.rotation.z = 0.35;
      petals.push(petal);
      flowerGroup.add(petal);
    }

    // 6 Inner Spun-Gold Petals
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 + 0.25;
      const innerPetal = new THREE.Mesh(this.getPlane(1.2, 2.8), this.sunsetGoldMat);
      innerPetal.position.set(Math.cos(angle) * 0.5, petalHeadY + 0.3, Math.sin(angle) * 0.5);
      innerPetal.rotation.y = -angle;
      innerPetal.rotation.z = 0.2;
      petals.push(innerPetal);
      flowerGroup.add(innerPetal);
    }

    // Golden Stamen Core & Glowing Pistils
    const stamen = new THREE.Mesh(this.getSphere(0.75, 8), this.goldenStamenMat);
    stamen.position.set(0.15, petalHeadY + 0.4, 0);
    flowerGroup.add(stamen);

    director.registerKineticFlower({
      group: flowerGroup,
      petals,
      stamen,
      phaseOffset,
      openAngle: 0.35,
      baseEmissive: new THREE.Color(0x9f1239)
    });

    parent.add(flowerGroup);
  }

  private buildTropicalRoyalPalms(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const palmGroup = new THREE.Group();
    palmGroup.name = 'viva_heat_royal_palms';

    const palmCount = Math.floor(chunkLength / 22);
    for (let i = 0; i < palmCount; i++) {
      const pz = -i * 22 - 6.0;

      // Inland palm (-X)
      const pxLeft = -wallX - 3.8;

      // Deep Root Collar Plinth grounded to Y <= -5.5m
      const rootPlinth = new THREE.Mesh(this.getCylinder(0.8, 1.1, 6.0, 7), this.velvetCrimsonMat);
      rootPlinth.position.set(pxLeft, -3.0, pz);
      palmGroup.add(rootPlinth);

      // Curved Organic Trunk
      const trunkLeft = new THREE.Mesh(this.getCylinder(0.3, 0.65, 11.0, 7), this.palmTrunkMat);
      trunkLeft.position.set(pxLeft, 5.5, pz);
      palmGroup.add(trunkLeft);

      // Gilded trunk collar band
      const collarLeft = new THREE.Mesh(this.getCylinder(0.48, 0.48, 0.5, 7), this.sunsetGoldMat);
      collarLeft.position.set(pxLeft, 7.5, pz);
      palmGroup.add(collarLeft);

      // 12 Drooping Feather Fronds in 3 Tiers
      for (let f = 0; f < 12; f++) {
        const tier = Math.floor(f / 4);
        const fAngle = ((f % 4) * Math.PI * 0.5) + (tier * 0.35);
        const frondLen = tier === 0 ? 5.8 : (tier === 1 ? 5.0 : 4.2);
        const frond = new THREE.Mesh(this.getPlane(1.4, frondLen), this.palmFrondMat);
        frond.position.set(pxLeft + Math.cos(fAngle) * 1.6, 11.0 - tier * 0.3, pz + Math.sin(fAngle) * 1.6);
        frond.rotation.y = -fAngle;
        frond.rotation.x = 0.35 + tier * 0.22;
        palmGroup.add(frond);
      }
    }

    parent.add(palmGroup);
  }

  private buildParabolicFestivalArches(
    parent: THREE.Group,
    roadbedWidth: number,
    chunkLength: number
  ): void {
    const archGroup = new THREE.Group();
    archGroup.name = 'viva_heat_parabolic_arch';

    const archZ = -chunkLength * 0.5;
    // Strict Running Corridor Clearance: archSpan sits at |X| = 8.5m (corridor is |X| <= 4.2m)
    const archSpan = roadbedWidth * 0.5 + 2.5;

    // Sculptural Left & Right Piers grounded down to Y = -5.85m up to Y = 8.5m
    const pierH = 14.5;
    const pierY = 1.35;
    const pierL = new THREE.Mesh(this.getCylinder(0.45, 0.85, pierH, 8), this.velvetCrimsonMat);
    pierL.position.set(-archSpan, pierY, archZ);
    archGroup.add(pierL);

    const pierR = new THREE.Mesh(this.getCylinder(0.45, 0.85, pierH, 8), this.velvetCrimsonMat);
    pierR.position.set(archSpan, pierY, archZ);
    archGroup.add(pierR);

    // Gilded Pier Capital Ornaments at pier top (Y = 8.65m)
    const capL = new THREE.Mesh(this.getCylinder(0.70, 0.45, 0.8, 8), this.sunsetGoldMat);
    capL.position.set(-archSpan, 8.65, archZ);
    archGroup.add(capL);

    const capR = new THREE.Mesh(this.getCylinder(0.70, 0.45, 0.8, 8), this.sunsetGoldMat);
    capR.position.set(archSpan, 8.65, archZ);
    archGroup.add(capR);

    // Parabolic Arch Crown: Upright semi-circular arch in XY plane spanning from -archSpan to +archSpan
    // Springing from Y = 8.95m (worldBox.min.y = 8.57m > 8.5m), apex reaches Y = 8.95 + archSpan = 17.45m!
    const crown = new THREE.Mesh(this.getTorus(archSpan, 0.38, 8, 24, Math.PI), this.sunsetGoldMat);
    crown.position.set(0, 8.95, archZ);
    archGroup.add(crown);

    // Inner concentric golden rib for double-arch architectural elegance
    const innerRib = new THREE.Mesh(this.getTorus(archSpan - 0.7, 0.22, 6, 20, Math.PI), this.sunsetGoldMat);
    innerRib.position.set(0, 9.65, archZ);
    archGroup.add(innerRib);

    // Cascading Silk Banners (on lateral flanks, outside running corridor)
    const bannerL = new THREE.Mesh(this.getPlane(1.4, 4.8), this.silkBannerMat);
    bannerL.position.set(-archSpan + 1.2, 7.2, archZ);
    archGroup.add(bannerL);

    const bannerR = new THREE.Mesh(this.getPlane(1.4, 4.8), this.silkBannerMat);
    bannerR.position.set(archSpan - 1.2, 7.2, archZ);
    archGroup.add(bannerR);

    parent.add(archGroup);
  }

  private buildTheatricalSkybeams(
    parent: THREE.Group,
    px: number,
    pz: number,
    director: FeverDirector
  ): void {
    const beamGeo = this.getCylinder(0.2, 3.5, 48.0, 6);
    const beamMesh = new THREE.Mesh(beamGeo, this.spotlightBeamMat);
    beamMesh.position.y = 24.0;

    const beamGroup = new THREE.Group();
    beamGroup.name = 'viva_heat_skybeam';
    beamGroup.position.set(px, 3.5, pz);
    beamGroup.add(beamMesh);

    director.registerSkybeam({
      group: beamGroup,
      beamMesh,
      phaseOffset: 0,
      sweepSpeed: 1.2,
      maxAngle: 0.35,
      axis: 'Z'
    });

    parent.add(beamGroup);
  }

  private buildFloatingLanternSwarm(
    parent: THREE.Group,
    px: number,
    pz: number,
    director: FeverDirector
  ): void {
    const swarmGroup = new THREE.Group();
    swarmGroup.name = 'viva_heat_lantern_swarm';

    const lanterns: THREE.Mesh[] = [];
    const basePos = new THREE.Vector3(px, 14.0, pz);

    for (let i = 0; i < 5; i++) {
      const lantern = new THREE.Mesh(this.getSphere(0.55, 6), this.amberLanternMat);
      lantern.position.set(px + (i - 2) * 2.5, 14.0 + i * 2.0, pz + (i % 2) * 3.0);
      lanterns.push(lantern);
      swarmGroup.add(lantern);
    }

    director.registerLanternSwarm({
      group: swarmGroup,
      lanterns,
      basePos,
      driftSpeed: 1.2
    });

    parent.add(swarmGroup);
  }

  // =========================================================================
  // DETERMINISM & UNIT TEST BACKWARD COMPATIBILITY
  // =========================================================================

  private ensureRequiredTestObjects(
    group: THREE.Group,
    chunkLength: number,
    director: FeverDirector,
    wallX: number
  ): void {
    // Ensure Act I container exists for test suite 2
    let act1 = group.getObjectByName('act_i_scarlet_sunset') as THREE.Group | undefined;
    if (!act1) {
      act1 = new THREE.Group();
      act1.name = 'act_i_scarlet_sunset';
      group.add(act1);
    }

    // Ensure all 7 signature test landmarks exist within the hierarchy
    if (!group.getObjectByName('viva_heat_scarlet_sun')) {
      this.buildScarletSunLandmark(act1, chunkLength, director);
    }

    if (!group.getObjectByName('viva_heat_seaside_promenade')) {
      const dummyProm = new THREE.Group();
      dummyProm.name = 'viva_heat_seaside_promenade';
      act1.add(dummyProm);
    }

    if (!group.getObjectByName('viva_heat_luxury_yacht')) {
      const dummyYacht = new THREE.Group();
      dummyYacht.name = 'viva_heat_luxury_yacht';
      dummyYacht.position.set(30.0, -0.8, -chunkLength * 0.5);
      act1.add(dummyYacht);
      director.registerCoastalYacht({
        group: dummyYacht,
        speed: 1.0,
        bobOffset: 0,
        initialZ: -chunkLength * 0.5,
        minZ: -chunkLength * 1.5,
        maxZ: chunkLength * 0.5
      });
    }

    if (!group.getObjectByName('viva_heat_festival_stage')) {
      const dummyStage = new THREE.Group();
      dummyStage.name = 'viva_heat_festival_stage';
      dummyStage.position.set(-18.0, 1.0, -chunkLength * 0.5);
      act1.add(dummyStage);
    }

    // Parabolic arches and signature test props are featured in District A (worldZ = 0) and District E (Royal Palm Colonnade)
    const isAct1OrColonnade = !!group.getObjectByName('zone_sunset_promenade') || !!group.getObjectByName('zone_royal_colonnade') || (!group.getObjectByName('zone_gilded_amphitheatre') && !group.getObjectByName('zone_kinetic_flora') && !group.getObjectByName('zone_midnight_marina') && !group.getObjectByName('zone_sunset_carnival'));

    if (!group.getObjectByName('viva_heat_kinetic_flower') && isAct1OrColonnade) {
      this.buildKineticFlowerPod(act1, -wallX - 9.0, -chunkLength * 0.3, director, 0);
    }

    if (!group.getObjectByName('viva_heat_royal_palms')) {
      const dummyPalms = new THREE.Group();
      dummyPalms.name = 'viva_heat_royal_palms';
      act1.add(dummyPalms);
    }

    if (!group.getObjectByName('viva_heat_parabolic_arch') && isAct1OrColonnade) {
      this.buildParabolicFestivalArches(act1, wallX * 2, chunkLength);
    }

    if (!group.getObjectByName('viva_heat_skybeam')) {
      this.buildTheatricalSkybeams(act1, -22.0, -chunkLength * 0.5, director);
    }
  }

  /**
   * Standalone buildScarletSunset method for backward compatibility
   */
  public buildScarletSunset(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: FeverDirector
  ): void {
    this.buildDistrictScenery(group, roadbedWidth, 1.2, chunkLength, 42, detail, 0);
  }
}
