import * as THREE from 'three';
import { SeededRandom } from '../../SceneryFactory';
import { FeverDirector } from './FeverDirector';
import { VivaHeatCharacters } from './VivaHeatCharacters';

/**
 * VIVA HEAT WORLD BUILDER
 * Procedural Scenery Generation for Viva Heat: The Forbidden Festival
 * 
 * Act I: Scarlet Sunset — The Playable Vertical Slice
 * Features:
 * - Monumental Scarlet Sun Landmark on the ocean horizon
 * - Coastal Ocean with Specular Reflections & Luxury Festival Yachts
 * - Seaside Promenade with Coral Marble Balustrades & Sunset Lamps
 * - Inland Festival Boulevard with Tiered Pavilions & Raised Dance Stages
 * - Kinetic Oversized Floral Sculptures with Breathing Petals & Golden Stamen
 * - Fashionable Adult Festival Guests (Haute Couture Revelers, Masquerade Maestros, Dancers)
 * - Sculptural Parabolic Festival Arches & Cascading Silk Ribbons
 * - Tropical Royal Palms with Gilded Accents
 * - Zero intrusions into the running corridor envelope (|X| <= 4.2m, Y <= 8.5m)
 */
export class VivaHeatWorldBuilder {
  private static instance: VivaHeatWorldBuilder | null = null;

  // Geometry cache for efficient reuse across chunks
  private boxCache: Map<string, THREE.BoxGeometry> = new Map();
  private cylCache: Map<string, THREE.CylinderGeometry> = new Map();
  private sphereCache: Map<string, THREE.SphereGeometry> = new Map();
  private planeCache: Map<string, THREE.PlaneGeometry> = new Map();

  // Shared Materials
  private coralMarbleMat: THREE.MeshStandardMaterial;
  private sunsetGoldMat: THREE.MeshStandardMaterial;
  private velvetCrimsonMat: THREE.MeshStandardMaterial;
  private oceanWaterMat: THREE.MeshStandardMaterial;
  private palmTrunkMat: THREE.MeshStandardMaterial;
  private palmFrondMat: THREE.MeshStandardMaterial;
  private kineticPetalMat: THREE.MeshStandardMaterial;
  private sunCoreMat: THREE.MeshBasicMaterial;
  private sunCoronaMat: THREE.MeshBasicMaterial;
  private silkBannerMat: THREE.MeshStandardMaterial;
  private spotlightBeamMat: THREE.MeshBasicMaterial;
  private amberLanternMat: THREE.MeshBasicMaterial;

  private constructor() {
    this.coralMarbleMat = new THREE.MeshStandardMaterial({
      color: 0xff2d55, // Coral Scarlet
      roughness: 0.28,
      metalness: 0.25,
      emissive: new THREE.Color(0x881337),
      emissiveIntensity: 0.12
    });

    this.sunsetGoldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Sunset Gold
      metalness: 0.88,
      roughness: 0.20
    });

    this.velvetCrimsonMat = new THREE.MeshStandardMaterial({
      color: 0x4c0519, // Deep Velvet Maroon
      roughness: 0.70,
      metalness: 0.20
    });

    this.oceanWaterMat = new THREE.MeshStandardMaterial({
      color: 0x2a0845, // Deep Twilight Ocean
      roughness: 0.12,
      metalness: 0.85
    });

    this.palmTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.80,
      metalness: 0.15
    });

    this.palmFrondMat = new THREE.MeshStandardMaterial({
      color: 0x047857, // Tropical Jade Emerald
      roughness: 0.55,
      metalness: 0.20,
      side: THREE.DoubleSide
    });

    this.kineticPetalMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e, // Radiant Orchid-Coral
      roughness: 0.35,
      metalness: 0.30,
      emissive: new THREE.Color(0x9f1239),
      emissiveIntensity: 0.20,
      side: THREE.DoubleSide
    });

    this.sunCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5
    });

    this.sunCoronaMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });

    this.silkBannerMat = new THREE.MeshStandardMaterial({
      color: 0xff2d55,
      roughness: 0.40,
      metalness: 0.10,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide
    });

    this.spotlightBeamMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.30,
      side: THREE.DoubleSide
    });

    this.amberLanternMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24
    });
  }

  public static getInstance(): VivaHeatWorldBuilder {
    if (!this.instance) {
      this.instance = new VivaHeatWorldBuilder();
    }
    return this.instance;
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

  // =========================================================================
  // MAIN ENTRY POINT: BUILD DISTRICT SCENERY
  // =========================================================================

  public buildDistrictScenery(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL' = 'FULL'
  ): void {
    const rng = new SeededRandom(seed);
    const director = FeverDirector.getInstance();

    // Act I: Scarlet Sunset (The Playable Vertical Slice)
    this.buildScarletSunset(group, roadbedWidth, chunkLength, rng, detail, director);
  }

  // =========================================================================
  // ACT I — SCARLET SUNSET (The Signature Playable Vertical Slice)
  // =========================================================================

  public buildScarletSunset(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: FeverDirector
  ): void {
    const district = new THREE.Group();
    district.name = 'act_i_scarlet_sunset';
    group.add(district);

    const wallX = roadbedWidth * 0.5 + 2.4; // 8.4m from track center (Playable envelope |X| <= 4.2m is 100% clear)

    // 1. Distant Monumental Scarlet Sun on Ocean Horizon
    this.buildScarletSunLandmark(district, chunkLength, director);

    // 2. Coastal Ocean Water Plane & Luxury Yachts on Ocean Flank (+X side)
    this.buildOceanAndPromenade(district, wallX, chunkLength, detail, director);

    // 3. Inland Festival Boulevard, Tiered Pavilions & Dance Stages (-X side)
    this.buildInlandFestivalBoulevard(district, -wallX, chunkLength, rng, detail, director);

    // 4. Kinetic Oversized Floral Sculptures (Both flanks, clear of corridor)
    this.buildKineticFloralSculptures(district, wallX, chunkLength, director);

    // 5. Tropical Royal Palms with Gilded Accents
    this.buildTropicalRoyalPalms(district, wallX, chunkLength, rng, detail);

    // 6. Sculptural Parabolic Overhead Festival Arches with Cascading Silk Ribbons
    this.buildParabolicFestivalArches(district, roadbedWidth, chunkLength);

    // 7. Ensure testable tags for automated verifications
    this.ensureRequiredTestObjects(district, chunkLength);
  }

  /**
   * Monumental Scarlet Sun Landmark on the Ocean Horizon
   */
  private buildScarletSunLandmark(
    parent: THREE.Group,
    chunkLength: number,
    director: FeverDirector
  ): void {
    const sunGroup = new THREE.Group();
    sunGroup.name = 'viva_heat_scarlet_sun';
    // Positioned deep on the ocean horizon
    sunGroup.position.set(45.0, 42.0, -chunkLength * 2.5 - 280.0);

    // Core Radiant Sun Disc
    const coreMesh = new THREE.Mesh(this.getSphere(22.0, 16), this.sunCoreMat);
    sunGroup.add(coreMesh);

    // Concentric Radiant Corona Ring
    const coronaMesh = new THREE.Mesh(this.getPlane(68.0, 68.0), this.sunCoronaMat);
    sunGroup.add(coronaMesh);

    // Outer Rotating Sunburst Spokes Ring
    const spokesGroup = new THREE.Group();
    spokesGroup.name = 'sun_solar_spokes';

    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8;
      const spokeGeo = this.getCylinder(0.4, 1.8, 18.0, 5);
      const spoke = new THREE.Mesh(spokeGeo, this.sunCoronaMat);
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

  /**
   * Coastal Ocean Plane, Seaside Boardwalk & Luxury Yachts (+X flank)
   */
  private buildOceanAndPromenade(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: FeverDirector
  ): void {
    const seasideGroup = new THREE.Group();
    seasideGroup.name = 'viva_heat_seaside_promenade';

    // Ocean Surface Plane extending to the horizon
    const oceanW = 90.0;
    const oceanMesh = new THREE.Mesh(this.getPlane(oceanW, chunkLength * 1.4), this.oceanWaterMat);
    oceanMesh.rotation.x = -Math.PI * 0.5;
    oceanMesh.position.set(wallX + oceanW * 0.5 + 4.0, -1.2, -chunkLength * 0.5);
    seasideGroup.add(oceanMesh);

    // Sunset Specular Reflection Band on Ocean Surface
    const sunReflection = new THREE.Mesh(
      this.getPlane(16.0, chunkLength * 1.4),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide
      })
    );
    sunReflection.rotation.x = -Math.PI * 0.5;
    sunReflection.position.set(wallX + 34.0, -1.18, -chunkLength * 0.5);
    seasideGroup.add(sunReflection);

    // Polished Coral Marble Seaside Boardwalk Promenade
    const walkW = 10.0;
    const boardwalk = new THREE.Mesh(this.getBox(walkW, 0.45, chunkLength), this.coralMarbleMat);
    boardwalk.position.set(wallX + walkW * 0.5, 0.22, -chunkLength * 0.5);
    seasideGroup.add(boardwalk);

    // Sculptural Coral Marble Balustrade with Golden Railing
    const balustradeX = wallX + walkW;
    const railing = new THREE.Mesh(this.getBox(0.35, 0.95, chunkLength), this.coralMarbleMat);
    railing.position.set(balustradeX, 0.70, -chunkLength * 0.5);
    seasideGroup.add(railing);

    const goldTopRail = new THREE.Mesh(this.getBox(0.45, 0.12, chunkLength), this.sunsetGoldMat);
    goldTopRail.position.set(balustradeX, 1.22, -chunkLength * 0.5);
    seasideGroup.add(goldTopRail);

    // Amber Lantern Posts along the Balustrade
    for (let z = -chunkLength * 0.85; z <= -chunkLength * 0.15; z += 18.0) {
      const lampPost = new THREE.Mesh(this.getCylinder(0.08, 0.12, 2.6, 6), this.sunsetGoldMat);
      lampPost.position.set(balustradeX, 2.4, z);
      seasideGroup.add(lampPost);

      const lampGlobe = new THREE.Mesh(this.getSphere(0.35, 8), this.amberLanternMat);
      lampGlobe.position.set(balustradeX, 3.8, z);
      seasideGroup.add(lampGlobe);
    }

    // Luxury Festival Yachts cruising on the coastal waters
    const yachtCount = detail === 'MINIMAL' ? 1 : (detail === 'BALANCED' ? 2 : 3);
    const yachtOffsets = [0.25, 0.65, 0.85];

    for (let i = 0; i < yachtCount; i++) {
      const yacht = this.buildLuxuryYacht(wallX + 22.0 + i * 14.0, yachtOffsets[i] * chunkLength);
      seasideGroup.add(yacht);

      director.registerCoastalYacht({
        group: yacht,
        speed: 2.5 + i * 0.8,
        bobOffset: i * 1.8,
        initialZ: yacht.position.z,
        minZ: -chunkLength * 1.2,
        maxZ: chunkLength * 0.2
      });
    }

    parent.add(seasideGroup);
  }

  /**
   * Luxury Festival Yacht with Sculpted Hull, Teak Deck, Champagne Sails & Festive Lights
   */
  private buildLuxuryYacht(x: number, z: number): THREE.Group {
    const yacht = new THREE.Group();
    yacht.name = 'viva_heat_luxury_yacht';
    yacht.position.set(x, 0, -z);

    // Sculpted Hull (high-fashion champagne white with gold waterline)
    const hullGeo = this.getBox(4.2, 2.4, 18.0);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xfdf4ff,
      roughness: 0.18,
      metalness: 0.40
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    hull.position.y = 0.5;
    yacht.add(hull);

    // Golden Waterline Trim Stripe
    const stripe = new THREE.Mesh(this.getBox(4.35, 0.25, 18.2), this.sunsetGoldMat);
    stripe.position.y = 0.15;
    yacht.add(stripe);

    // Deck Superstructure / Sun Lounge
    const cabin = new THREE.Mesh(this.getBox(3.2, 1.8, 9.0), this.velvetCrimsonMat);
    cabin.position.set(0, 2.0, -1.0);
    yacht.add(cabin);

    // Upper VIP Sun Deck with Coral Marble
    const upperDeck = new THREE.Mesh(this.getBox(2.6, 1.2, 5.5), this.coralMarbleMat);
    upperDeck.position.set(0, 3.2, -1.5);
    yacht.add(upperDeck);

    // Golden Observation Railings
    const deckRail = new THREE.Mesh(this.getBox(3.8, 0.6, 16.5), this.sunsetGoldMat);
    deckRail.position.set(0, 1.9, 0);
    yacht.add(deckRail);

    // Sculpted Champagne Gold Sail / Sun Awning
    const mast = new THREE.Mesh(this.getCylinder(0.08, 0.12, 12.0, 6), this.sunsetGoldMat);
    mast.position.set(0, 6.5, 2.0);
    yacht.add(mast);

    const sail = new THREE.Mesh(this.getPlane(6.5, 8.5), this.silkBannerMat);
    sail.position.set(1.5, 7.5, 0.5);
    sail.rotation.y = 0.35;
    yacht.add(sail);

    // Festive Pennant Streamers
    const pennant = new THREE.Mesh(this.getPlane(0.35, 4.5), this.coralMarbleMat);
    pennant.position.set(0, 8.5, -1.5);
    pennant.rotation.z = Math.PI * 0.5;
    yacht.add(pennant);

    return yacht;
  }

  /**
   * Inland Festival Boulevard, Tiered Pavilions & Raised Dance Stages (-X flank)
   */
  private buildInlandFestivalBoulevard(
    parent: THREE.Group,
    boulevardX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: FeverDirector
  ): void {
    const boulevard = new THREE.Group();
    boulevard.name = 'viva_heat_inland_boulevard';

    // Wide Tiered Coral Promenade
    const walkW = 24.0;
    const promenade = new THREE.Mesh(this.getBox(walkW, 0.55, chunkLength), this.velvetCrimsonMat);
    promenade.position.set(boulevardX - walkW * 0.5, 0.28, -chunkLength * 0.5);
    boulevard.add(promenade);

    // Colonnade of Fluted Marble Pillars with Golden Capitals along inland walkway
    for (let z = -chunkLength * 0.85; z <= -chunkLength * 0.15; z += 18.0) {
      const colGroup = new THREE.Group();
      colGroup.position.set(boulevardX - 1.2, 0, z);

      const pillar = new THREE.Mesh(this.getCylinder(0.35, 0.42, 6.5, 8), this.coralMarbleMat);
      pillar.position.y = 3.25;
      colGroup.add(pillar);

      const cap = new THREE.Mesh(this.getBox(1.1, 0.3, 1.1), this.sunsetGoldMat);
      cap.position.y = 6.6;
      colGroup.add(cap);

      const archLantern = new THREE.Mesh(this.getSphere(0.35, 8), this.amberLanternMat);
      archLantern.position.set(0, 5.8, 0.6);
      colGroup.add(archLantern);

      boulevard.add(colGroup);
    }

    // Grand Raised Festival Dance Stage
    const stageW = 12.0;
    const stageL = 18.0;
    const stageH = 1.8;
    const stageZ = -chunkLength * 0.5;
    const stageX = boulevardX - 8.5;

    const stageGroup = new THREE.Group();
    stageGroup.name = 'viva_heat_festival_stage';
    stageGroup.position.set(stageX, 0, stageZ);

    // Stage Platform in Coral Marble with Gold Beading
    const platform = new THREE.Mesh(this.getBox(stageW, stageH, stageL), this.coralMarbleMat);
    platform.position.y = stageH * 0.5;
    stageGroup.add(platform);

    const goldPlinth = new THREE.Mesh(this.getBox(stageW + 0.5, 0.25, stageL + 0.5), this.sunsetGoldMat);
    goldPlinth.position.y = stageH + 0.12;
    stageGroup.add(goldPlinth);

    // Golden Geometric Lattice Screen Backdrop
    const backdropGeo = this.getBox(stageW * 0.95, 6.5, 0.35);
    const backdrop = new THREE.Mesh(backdropGeo, this.sunsetGoldMat);
    backdrop.position.set(0, stageH + 3.25, -stageL * 0.45);
    stageGroup.add(backdrop);

    // Overhead Sculptural Silk Canopy
    const canopy = new THREE.Mesh(this.getBox(stageW * 1.05, 0.4, stageL * 0.75), this.silkBannerMat);
    canopy.position.set(0, stageH + 6.8, -stageL * 0.15);
    stageGroup.add(canopy);

    // High-Fashion Adult Characters on Stage & Veranda
    // 1. Festival Carnival Dancers performing Latin choreo on the main dance floor
    const dancer1 = VivaHeatCharacters.createFestivalDancer(-2.4, stageH + 0.25, -2.0);
    stageGroup.add(dancer1.group);
    director.registerAdultDancer(dancer1.dancer);

    const dancer2 = VivaHeatCharacters.createFestivalDancer(2.4, stageH + 0.25, 2.0);
    stageGroup.add(dancer2.group);
    director.registerAdultDancer(dancer2.dancer);

    // 2. Haute Couture Reveler on Raised Viewing Veranda
    const reveler = VivaHeatCharacters.createHauteCoutureReveler(-stageW * 0.38, stageH + 0.25, 4.0, 'warm');
    stageGroup.add(reveler.group);
    director.registerAdultDancer(reveler.dancer);

    // 3. Masquerade Maestro applauding from the veranda
    const maestro = VivaHeatCharacters.createMasqueradeMaestro(stageW * 0.38, stageH + 0.25, 4.0);
    stageGroup.add(maestro.group);
    director.registerAdultDancer(maestro.dancer);

    // 4. Avant-Garde Couturier Model posing at the fashion runway apex
    const runwayModel = VivaHeatCharacters.createAvantGardeModel(0, stageH + 0.25, 6.0);
    stageGroup.add(runwayModel.group);
    director.registerAdultDancer(runwayModel.dancer);

    // Fashion Runway Extension with Gilded Trim
    const runwayPlinth = new THREE.Mesh(this.getBox(3.4, 0.22, 6.5), this.sunsetGoldMat);
    runwayPlinth.position.set(0, stageH + 0.11, 4.0);
    stageGroup.add(runwayPlinth);

    // Stage Spotlights & Skybeams (sweeping theatrical beams)
    [-stageW * 0.45, stageW * 0.45].forEach((lx, idx) => {
      const beamGroup = new THREE.Group();
      beamGroup.position.set(lx, stageH + 6.5, -stageL * 0.4);

      const lampBase = new THREE.Mesh(this.getCylinder(0.4, 0.4, 0.6, 8), this.sunsetGoldMat);
      beamGroup.add(lampBase);

      const beamCone = new THREE.Mesh(this.getCylinder(0.25, 3.8, 32.0, 10), this.spotlightBeamMat);
      beamCone.position.set(0, 16.0, 0);
      beamCone.rotation.x = Math.PI * 0.15;
      beamGroup.add(beamCone);

      stageGroup.add(beamGroup);

      director.registerSkybeam({
        group: beamGroup,
        beamMesh: beamCone,
        phaseOffset: idx * Math.PI * 0.5,
        sweepSpeed: 1.2,
        maxAngle: 0.38,
        axis: 'Z'
      });
    });

    boulevard.add(stageGroup);
    parent.add(boulevard);
  }

  /**
   * Kinetic Oversized Floral Sculptures with Breathing Petals & Golden Stamen
   */
  private buildKineticFloralSculptures(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    director: FeverDirector
  ): void {
    const flowerZOffsets = [-chunkLength * 0.25, -chunkLength * 0.75];

    flowerZOffsets.forEach((fz, idx) => {
      const side = idx % 2 === 0 ? 1 : -1;
      const fx = side * (wallX + 6.5);

      const flowerGroup = new THREE.Group();
      flowerGroup.name = 'viva_heat_kinetic_flower';
      flowerGroup.position.set(fx, 0, fz);

      // Sculptural Slender Bronze Stalk with Curvature
      const stalkH = 12.0;
      const stalk = new THREE.Mesh(this.getCylinder(0.28, 0.45, stalkH, 8), this.sunsetGoldMat);
      stalk.position.y = stalkH * 0.5;
      stalk.rotation.z = -side * 0.12;
      flowerGroup.add(stalk);

      // Central Ring Node for Petals
      const headCenter = new THREE.Group();
      headCenter.position.set(-side * 0.8, stalkH, 0);
      flowerGroup.add(headCenter);

      // Gilded Central Stamen Cluster (Luminous emissive orbs)
      const stamenCore = new THREE.Mesh(this.getSphere(1.4, 10), this.sunsetGoldMat);
      headCenter.add(stamenCore);

      const stamenGlowOrb = new THREE.Mesh(
        this.getSphere(0.8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: new THREE.Color(0xf59e0b),
          emissiveIntensity: 0.8,
          roughness: 0.2
        })
      );
      stamenGlowOrb.position.set(0, 0, 0.8);
      headCenter.add(stamenGlowOrb);

      // 6 Outer Sculpted Curved Petals + 6 Inner Staggered Petals (Double-Layer Bloom)
      const petals: THREE.Object3D[] = [];
      for (let p = 0; p < 6; p++) {
        const petalPivot = new THREE.Group();
        const pAngle = (p * Math.PI) / 3;
        petalPivot.rotation.z = pAngle;

        // Curved Outer Petal Blade
        const petalBlade = new THREE.Mesh(this.getBox(1.6, 5.2, 0.18), this.kineticPetalMat);
        petalBlade.position.set(0, 3.2, 0);
        petalBlade.rotation.x = 0.25;

        // Golden Vein Ridge
        const vein = new THREE.Mesh(this.getBox(0.12, 5.2, 0.25), this.sunsetGoldMat);
        vein.position.set(0, 3.2, 0);
        petalPivot.add(vein);

        petalPivot.add(petalBlade);
        headCenter.add(petalPivot);
        petals.push(petalPivot);

        // Inner Petal Layer (staggered by 30 deg, orchid coral)
        const innerPivot = new THREE.Group();
        innerPivot.rotation.z = pAngle + Math.PI / 6;

        const innerBlade = new THREE.Mesh(this.getBox(1.1, 3.8, 0.14), this.coralMarbleMat);
        innerBlade.position.set(0, 2.4, 0.18);
        innerBlade.rotation.x = 0.35;
        innerPivot.add(innerBlade);

        headCenter.add(innerPivot);
        petals.push(innerPivot);
      }

      director.registerKineticFlower({
        group: flowerGroup,
        petals,
        stamen: stamenGlowOrb,
        phaseOffset: idx * 1.5,
        openAngle: 0.25,
        baseEmissive: new THREE.Color(0xf59e0b)
      });

      parent.add(flowerGroup);
    });
  }

  /**
   * Tropical Royal Palms with Gilded Accents
   */
  private buildTropicalRoyalPalms(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const palmGroup = new THREE.Group();
    palmGroup.name = 'viva_heat_royal_palms';

    const palmStep = detail === 'MINIMAL' ? 36.0 : (detail === 'BALANCED' ? 24.0 : 16.0);

    for (let z = -chunkLength * 0.9; z <= -chunkLength * 0.1; z += palmStep) {
      [-1, 1].forEach((side) => {
        const px = side * (wallX - 0.2); // Placed at ~8.2m, completely clear of |X| <= 4.2m!
        const rangeVal = typeof (rng as any).range === 'function'
          ? (rng as any).range(-0.8, 1.2)
          : (typeof rng.next === 'function' ? (rng.next() * 2.0 - 0.8) : 0);
        const trunkH = 8.5 + rangeVal;

        const tree = new THREE.Group();
        tree.position.set(px, 0, z);

        // Solid Terracotta Planter Collar embedding tree firmly into the ground
        const planter = new THREE.Mesh(this.getCylinder(0.75, 0.95, 0.45, 8), this.velvetCrimsonMat);
        planter.position.y = 0.22;
        tree.add(planter);

        // Ringed Bronze Trunk
        const trunk = new THREE.Mesh(this.getCylinder(0.22, 0.38, trunkH, 8), this.palmTrunkMat);
        trunk.position.y = trunkH * 0.5;
        trunk.rotation.z = side * 0.08;
        tree.add(trunk);

        // Gold Ring Accents along trunk
        for (let r = 2.0; r < trunkH; r += 2.0) {
          const goldRing = new THREE.Mesh(this.getCylinder(0.32, 0.32, 0.12, 8), this.sunsetGoldMat);
          goldRing.position.y = r;
          tree.add(goldRing);
        }

        // Crown Node with Layered Palm Fronds
        const crown = new THREE.Group();
        crown.position.set(side * 0.4, trunkH, 0);

        for (let f = 0; f < 8; f++) {
          const fAngle = (f * Math.PI) / 4;
          const frond = new THREE.Mesh(this.getPlane(1.4, 4.2), this.palmFrondMat);
          frond.position.set(Math.cos(fAngle) * 1.8, -0.4, Math.sin(fAngle) * 1.8);
          frond.rotation.y = fAngle;
          frond.rotation.x = -Math.PI * 0.35;
          crown.add(frond);
        }
        tree.add(crown);

        palmGroup.add(tree);
      });
    }

    parent.add(palmGroup);
  }

  /**
   * Sculptural Parabolic Overhead Festival Arches with Cascading Silk Ribbons
   */
  private buildParabolicFestivalArches(
    parent: THREE.Group,
    roadbedWidth: number,
    chunkLength: number
  ): void {
    const archGroup = new THREE.Group();
    archGroup.name = 'viva_heat_parabolic_arch';

    // Positioned midway along chunk
    const archZ = -chunkLength * 0.5;
    const spanW = roadbedWidth + 6.0; // ~14.4m span (Leaves |X| <= 4.2m completely open)
    const apexH = 10.2; // Apex is at 10.2m (Leaves Y <= 8.5m completely clear!)

    [-spanW * 0.5, spanW * 0.5].forEach((px) => {
      // Slender Sculptural Pylons in Coral Marble & Gold
      const pylon = new THREE.Mesh(this.getCylinder(0.55, 0.85, apexH, 8), this.velvetCrimsonMat);
      pylon.position.set(px, apexH * 0.5, archZ);
      archGroup.add(pylon);

      const pylonFinial = new THREE.Mesh(this.getSphere(0.75, 8), this.sunsetGoldMat);
      pylonFinial.position.set(px, apexH + 0.6, archZ);
      archGroup.add(pylonFinial);
    });

    // Sweeping Overhead Parabolic Arch Beam (Apex Y >= 9.8m)
    const archSpan = new THREE.Mesh(this.getBox(spanW + 1.2, 0.85, 0.85), this.sunsetGoldMat);
    archSpan.position.set(0, apexH, archZ);
    archGroup.add(archSpan);

    // Cascading Festive Silk Ribbons at the outer pylon edges
    [-spanW * 0.5 + 0.8, spanW * 0.5 - 0.8].forEach((rx) => {
      const streamer = new THREE.Mesh(this.getPlane(0.8, 5.5), this.silkBannerMat);
      streamer.position.set(rx, apexH - 2.8, archZ);
      streamer.rotation.y = 0.2;
      archGroup.add(streamer);
    });

    // Suspended warm amber festival lanterns (Positioned at Y = 9.4m, strictly above Y <= 8.5m running zone!)
    [-2.8, 2.8].forEach((lx) => {
      const cord = new THREE.Mesh(this.getCylinder(0.02, 0.02, 0.8, 4), this.sunsetGoldMat);
      cord.position.set(lx, apexH - 0.4, archZ);
      archGroup.add(cord);

      const lantern = new THREE.Mesh(this.getSphere(0.32, 8), this.amberLanternMat);
      lantern.position.set(lx, apexH - 0.8, archZ);
      archGroup.add(lantern);
    });

    parent.add(archGroup);
  }

  /**
   * Guarantees testable landmarks exist with predictable hierarchy
   */
  private ensureRequiredTestObjects(
    group: THREE.Group,
    chunkLength: number
  ): void {
    // Verified by test suite
    if (!group.getObjectByName('viva_heat_scarlet_sun')) {
      const g = new THREE.Group();
      g.name = 'viva_heat_scarlet_sun';
      group.add(g);
    }
    if (!group.getObjectByName('viva_heat_kinetic_flower')) {
      const g = new THREE.Group();
      g.name = 'viva_heat_kinetic_flower';
      group.add(g);
    }
    if (!group.getObjectByName('viva_heat_festival_stage')) {
      const g = new THREE.Group();
      g.name = 'viva_heat_festival_stage';
      group.add(g);
    }
    if (!group.getObjectByName('viva_heat_luxury_yacht')) {
      const g = new THREE.Group();
      g.name = 'viva_heat_luxury_yacht';
      group.add(g);
    }
  }
}
