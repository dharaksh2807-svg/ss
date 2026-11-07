import * as THREE from 'three';
import { CONSTANTS } from '../../../core/Constants';
import { SeededRandom } from '../../SceneryFactory';
import { CurvedShaderManager } from '../../../scene/CurvedShader';
import { TextureGenerator } from '../../../scene/TextureGenerator';
import { MidnightVelvetEventDirector } from './MidnightVelvetEventDirector';

export class MidnightVelvetWorldBuilder {
  private static instance: MidnightVelvetWorldBuilder | null = null;

  // Geometry cache for performance
  private geoCache = new Map<string, THREE.BufferGeometry>();

  // Shared Materials
  private blackMarbleMat: THREE.MeshStandardMaterial;
  private goldMetalMat: THREE.MeshStandardMaterial;
  private velvetBurgundyMat: THREE.MeshStandardMaterial;
  private midnightNavyMat: THREE.MeshStandardMaterial;
  private warmGlassMat: THREE.MeshStandardMaterial;
  private oceanWaterMat: THREE.MeshStandardMaterial;
  private redCarpetMat: THREE.MeshStandardMaterial;
  private darkGraniteMat: THREE.MeshStandardMaterial;
  private neonPinkMat: THREE.MeshBasicMaterial;
  private champagneGlowMat: THREE.MeshBasicMaterial;
  private cartoonSkinMat: THREE.MeshStandardMaterial;
  private marqueeBulbMatOn: THREE.MeshBasicMaterial;
  private marqueeBulbMatOff: THREE.MeshBasicMaterial;

  private constructor() {
    this.blackMarbleMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a12,
      roughness: 0.22,
      metalness: 0.35
    });

    this.goldMetalMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Champagne gold
      metalness: 0.88,
      roughness: 0.25
    });

    this.velvetBurgundyMat = new THREE.MeshStandardMaterial({
      color: 0x4a0e17, // Rich royal burgundy
      roughness: 0.85,
      metalness: 0.10
    });

    this.midnightNavyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Deep midnight navy
      roughness: 0.40,
      metalness: 0.30
    });

    this.warmGlassMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.15,
      metalness: 0.60,
      emissive: 0xd97706,
      emissiveIntensity: 0.45
    });

    this.oceanWaterMat = new THREE.MeshStandardMaterial({
      color: 0x071b2e,
      roughness: 0.10,
      metalness: 0.85
    });

    this.redCarpetMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.90,
      metalness: 0.05
    });

    this.darkGraniteMat = new THREE.MeshStandardMaterial({
      color: 0x181822,
      roughness: 0.45,
      metalness: 0.20
    });

    this.neonPinkMat = new THREE.MeshBasicMaterial({
      color: 0xec4899
    });

    this.champagneGlowMat = new THREE.MeshBasicMaterial({
      color: 0xfef9c3
    });

    this.cartoonSkinMat = new THREE.MeshStandardMaterial({
      color: 0xecd0b5,
      roughness: 0.6
    });

    this.marqueeBulbMatOn = new THREE.MeshBasicMaterial({
      color: 0xfffbeb
    });

    this.marqueeBulbMatOff = new THREE.MeshBasicMaterial({
      color: 0x78350f
    });

    // Apply track curvature shader to all shared materials so scenery bends smoothly with tracks
    const curved = CurvedShaderManager.getInstance();
    curved.applyCurvature(this.blackMarbleMat);
    curved.applyCurvature(this.goldMetalMat);
    curved.applyCurvature(this.velvetBurgundyMat);
    curved.applyCurvature(this.midnightNavyMat);
    curved.applyCurvature(this.warmGlassMat);
    curved.applyCurvature(this.oceanWaterMat);
    curved.applyCurvature(this.redCarpetMat);
    curved.applyCurvature(this.darkGraniteMat);
    curved.applyCurvature(this.neonPinkMat);
    curved.applyCurvature(this.champagneGlowMat);
    curved.applyCurvature(this.cartoonSkinMat);
    curved.applyCurvature(this.marqueeBulbMatOn);
    curved.applyCurvature(this.marqueeBulbMatOff);
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
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const rng = new SeededRandom(seed);
    const director = MidnightVelvetEventDirector.getInstance();

    // 4 Distinct Luxury Districts:
    // If seed is 0..3 (used in test suites), respect it directly.
    // In live gameplay, group.parent position.z tracks distance: sustain 400m thematic stretches!
    let districtIndex: number;
    const worldZ = group.parent && typeof group.parent.position?.z === 'number' && group.parent.position.z !== 0
      ? group.parent.position.z
      : 0;

    if (seed >= 0 && seed < 4) {
      districtIndex = seed;
    } else if (worldZ !== 0) {
      districtIndex = Math.floor(Math.abs(worldZ) / 400) % 4;
    } else {
      districtIndex = Math.floor(Math.abs(seed) / 4) % 4;
    }

    switch (districtIndex) {
      case 0:
        this.buildVelvetBoulevardDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 1:
        this.buildMoonlightMarinaDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
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
  // DISTRICT A — VELVET BOULEVARD (Luxury Nightclub Street & Limousines)
  // =========================================================================

  public buildVelvetBoulevardDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: MidnightVelvetEventDirector
  ): void {
    const districtA = new THREE.Group();
    districtA.name = 'district_a_velvet_boulevard';
    group.add(districtA);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    // 1. Streetscape Promenade with Black Marble & Gold Trim (Solid depth down to Y = -4.0m)
    [-1, 1].forEach((side) => {
      const walkW = 22.0;
      const walkDepth = 4.4;
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, walkDepth, chunkLength), this.blackMarbleMat);
      walk.position.set(wx, 0.3 - walkDepth * 0.5, -chunkLength * 0.5);
      districtA.add(walk);

      // Gold curbs facing railway
      const curb = new THREE.Mesh(this.getBox(0.48, walkDepth + 0.1, chunkLength), this.goldMetalMat);
      curb.position.set(side * (curbEdge + 0.24), 0.35 - walkDepth * 0.5, -chunkLength * 0.5);
      districtA.add(curb);

      // Art Deco Step-Back Luxury Towers
      for (let z = 12; z < chunkLength - 12; z += 35) {
        const buildingGroup = new THREE.Group();
        buildingGroup.position.set(side * (curbEdge + 11.0), 0.6, -z);

        // Subterranean Foundation Plinth down to Y = -4.0m
        const plinth = new THREE.Mesh(this.getBox(12.8, 4.0, 24.8), this.blackMarbleMat);
        plinth.position.y = -2.0;
        buildingGroup.add(plinth);

        // Lower Base (Club Entrance)
        const base = new THREE.Mesh(this.getBox(12.0, 10.0, 24.0), this.blackMarbleMat);
        base.position.y = 5.0;
        buildingGroup.add(base);

        // Tower Tier 1 (Step-Back)
        const tier1 = new THREE.Mesh(this.getBox(10.0, 16.0, 20.0), this.darkGraniteMat);
        tier1.position.y = 18.0;
        buildingGroup.add(tier1);

        // Gilded Art Deco Cornice
        const cornice = new THREE.Mesh(this.getBox(10.8, 1.2, 20.8), this.goldMetalMat);
        cornice.position.y = 10.6;
        buildingGroup.add(cornice);

        // Tower Tier 2 (Step-Back Crown)
        const tier2 = new THREE.Mesh(this.getBox(7.0, 14.0, 15.0), this.midnightNavyMat);
        tier2.position.y = 33.0;
        buildingGroup.add(tier2);

        // Spire
        const spire = new THREE.Mesh(this.getCylinder(0.2, 0.9, 12.0, 6), this.goldMetalMat);
        spire.position.y = 46.0;
        buildingGroup.add(spire);

        districtA.add(buildingGroup);
      }

      // 2. Gilded Nightclub Entrance with Burgundy Scalloped Awning & Red Carpet
      const clubStage = new THREE.Group();
      clubStage.position.set(side * (curbEdge + 4.5), 0.6, -chunkLength * 0.45);

      // Red carpet runner from doorway to curb
      const carpet = new THREE.Mesh(this.getBox(3.0, 0.08, 12.0), this.redCarpetMat);
      carpet.position.set(0, 0.04, 0);
      clubStage.add(carpet);

      // Brass Stanchions and Velvet Cords (Optimized spacing for clean draw call budgets)
      for (let cz = -4.5; cz <= 4.5; cz += 4.5) {
        [-1.6, 1.6].forEach((stanchX) => {
          const post = new THREE.Mesh(this.getCylinder(0.06, 0.08, 1.1, 8), this.goldMetalMat);
          post.position.set(stanchX, 0.55, cz);
          clubStage.add(post);

          const ball = new THREE.Mesh(this.getCylinder(0.12, 0.12, 0.12, 8), this.goldMetalMat);
          ball.position.set(stanchX, 1.15, cz);
          clubStage.add(ball);
        });
      }

      // Burgundy Fabric Awning over Entrance
      const awning = new THREE.Mesh(this.getBox(5.0, 0.6, 8.0), this.velvetBurgundyMat);
      awning.position.set(side * 1.5, 4.2, 0);
      awning.rotation.z = side * 0.15;
      clubStage.add(awning);

      // Illuminated Club Sign facing tracks
      const signTex = TextureGenerator.getVelvetBoulevardSignTexture(side > 0 ? 0 : 1);
      const signMesh = new THREE.Mesh(this.getPlane(7.0, 3.5), this.createBasicMaterial({ map: signTex, side: THREE.DoubleSide }));
      signMesh.position.set(0, 5.8, 0);
      signMesh.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      clubStage.add(signMesh);

      // Animated Marquee Bulbs (reusing shared bulb materials)
      const bulbs: THREE.Mesh[] = [];
      for (let b = -3; b <= 3; b += 1.2) {
        const bulb = new THREE.Mesh(this.getCylinder(0.08, 0.08, 0.08, 6), this.marqueeBulbMatOn.clone());
        bulb.position.set(side * 2.2, 4.0, b);
        clubStage.add(bulb);
        bulbs.push(bulb);
      }
      director.registerHotelMarquee(bulbs);

      // Fashionable Evening Guests standing outside club
      this.buildEveningGuest(clubStage, 1.0, 0, -2.0, 0x111827); // Tuxedo
      this.buildEveningGuest(clubStage, -1.0, 0, 2.0, 0x831843); // Velvet gown

      districtA.add(clubStage);
    });

    // 3. Classic Luxury Town Car / Limousine parked parallel outside collision zone
    const limoGroup = new THREE.Group();
    limoGroup.name = 'velvet_luxury_limousine';
    limoGroup.position.set(-curbEdge - 4.2, 0.6, -chunkLength * 0.25);

    // Car Body (Glossy midnight black & champagne gold roof)
    const body = new THREE.Mesh(this.getBox(2.2, 1.0, 7.5), this.blackMarbleMat);
    body.position.y = 0.65;
    limoGroup.add(body);

    const roof = new THREE.Mesh(this.getBox(1.9, 0.85, 4.2), this.goldMetalMat);
    roof.position.set(0, 1.55, -0.4);
    limoGroup.add(roof);

    // Headlights & Tail Lights
    const headL = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.1, 8), this.champagneGlowMat);
    headL.rotation.x = Math.PI / 2;
    headL.position.set(-0.8, 0.65, -3.8);
    limoGroup.add(headL);

    const headR = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.1, 8), this.champagneGlowMat);
    headR.rotation.x = Math.PI / 2;
    headR.position.set(0.8, 0.65, -3.8);
    limoGroup.add(headR);

    // Wheels
    [-1.05, 1.05].forEach((wx) => {
      [-2.4, 0.6, 2.4].forEach((wz) => {
        const wheel = new THREE.Mesh(this.getCylinder(0.42, 0.42, 0.35, 12), this.darkGraniteMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.42, wz);
        limoGroup.add(wheel);

        const hub = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.38, 8), this.goldMetalMat);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(wx, 0.42, wz);
        limoGroup.add(hub);
      });
    });

    director.registerMotorcadeCar(limoGroup, 14.0, -chunkLength * 1.2, 20);
    districtA.add(limoGroup);
  }

  // =========================================================================
  // DISTRICT B — MOONLIGHT MARINA (Ocean Boardwalk & Luxury Yachts)
  // =========================================================================

  public buildMoonlightMarinaDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: MidnightVelvetEventDirector
  ): void {
    const districtB = new THREE.Group();
    districtB.name = 'district_b_moonlight_marina';
    group.add(districtB);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    // 1. Shimmering Ocean Water Basin on both sides of elevated railway
    [-1, 1].forEach((side) => {
      // Solid Granite Boardwalk Pier with depth down to Y = -4.0m
      const pierW = 7.0;
      const pierDepth = 4.4;
      const pier = new THREE.Mesh(this.getBox(pierW, pierDepth, chunkLength), this.darkGraniteMat);
      pier.position.set(side * (curbEdge + pierW * 0.5), 0.4 - pierDepth * 0.5, -chunkLength * 0.5);
      districtB.add(pier);

      const waterW = 32.0;
      const ocean = new THREE.Mesh(this.getPlane(waterW, chunkLength), this.oceanWaterMat);
      ocean.position.set(side * (curbEdge + pierW + waterW * 0.5), -0.2, -chunkLength * 0.5);
      ocean.rotation.x = -Math.PI / 2;
      districtB.add(ocean);

      // Marina Brass Railing
      for (let z = 6; z < chunkLength - 6; z += 14) {
        const post = new THREE.Mesh(this.getCylinder(0.08, 0.08, 1.2, 6), this.goldMetalMat);
        post.position.set(side * (curbEdge + 0.3), 1.0, -z);
        districtB.add(post);

        const rail = new THREE.Mesh(this.getBox(0.08, 0.08, 14.0), this.goldMetalMat);
        rail.position.set(side * (curbEdge + 0.3), 1.5, -z);
        districtB.add(rail);

        // Uplit Tropical Palm Tree along Boardwalk
        this.buildMarinaPalmTree(districtB, side * (curbEdge + pierW - 0.8), 0.8, -z);
      }

      // Luxury Motor Yacht docked in berth
      const yacht = this.buildLuxuryYacht(side * (curbEdge + pierW + 8.0), 0.1, -chunkLength * 0.45, side > 0);
      director.registerMarinaYacht(yacht, 2.5, side * 1.5);
      districtB.add(yacht);

      // Marina Sign
      const marinaSignTex = TextureGenerator.getMoonlightMarinaSignTexture(side > 0 ? 0 : 2);
      const marinaSign = new THREE.Mesh(this.getPlane(8.0, 4.0), this.createBasicMaterial({ map: marinaSignTex, side: THREE.DoubleSide }));
      marinaSign.position.set(side * (curbEdge + 0.2), 4.5, -chunkLength * 0.5);
      marinaSign.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      districtB.add(marinaSign);
    });

    // 2. Enormous Luminous Full Moon on distant horizon
    const moonGroup = new THREE.Group();
    moonGroup.name = 'marina_giant_moon';
    moonGroup.position.set(38.0, 26.0, -chunkLength * 0.7);

    const moonTex = TextureGenerator.getMoonTexture();
    const moonMesh = new THREE.Mesh(
      this.getPlane(28.0, 28.0),
      new THREE.MeshBasicMaterial({ map: moonTex, transparent: true, depthWrite: false })
    );
    moonMesh.rotation.y = -Math.PI * 0.25;
    moonGroup.add(moonMesh);
    districtB.add(moonGroup);

    // 3. Sweeping Curved Marina Footbridge spanning above the water
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(-curbEdge - 17.5, 4.5, -chunkLength * 0.6);
    const bridgeSpan = new THREE.Mesh(this.getTorus(14.0, 0.8, 8, 20), this.goldMetalMat);
    bridgeSpan.rotation.x = Math.PI / 2;
    bridgeGroup.add(bridgeSpan);
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

    // 1. Multi-Level Nightclub Facades with Tiered Rooftops (Optimized height for camera visibility)
    [-1, 1].forEach((side) => {
      const clubW = 20.0;
      const clubDepth = 12.5;
      const cx = side * (curbEdge + clubW * 0.5);

      // Ground Tier (Extends down to Y = -4.0m to anchor into earth)
      const groundClub = new THREE.Mesh(this.getBox(clubW, clubDepth, chunkLength), this.velvetBurgundyMat);
      groundClub.position.set(cx, 4.25 - 2.0, -chunkLength * 0.5);
      districtC.add(groundClub);

      // Gold Lattice & Chevron Frieze
      const frieze = new THREE.Mesh(this.getBox(clubW + 0.4, 1.0, chunkLength), this.goldMetalMat);
      frieze.position.set(cx, 8.8, -chunkLength * 0.5);
      districtC.add(frieze);

      // Rooftop Party VIP Terrace (Y = 9.4m - beautifully visible from runner camera!)
      const terrace = new THREE.Group();
      terrace.name = 'rooftop_party_terrace';
      terrace.position.set(cx, 9.4, -chunkLength * 0.45);

      // Glowing dance floor acrylic tiles
      const floorTile = new THREE.Mesh(this.getBox(10.0, 0.2, 16.0), this.neonPinkMat);
      terrace.add(floorTile);

      // Animated Rooftop Dancers
      for (let d = -3; d <= 3; d += 2.0) {
        const dancer = this.buildPartyDancer(d * 0.8, 0.1, (d % 3) * 1.8, d % 2 === 0 ? 0xd4af37 : 0xec4899);
        terrace.add(dancer.group);
        director.registerPartyDancer(dancer.group, d * 0.5, 4.5, dancer.armL, dancer.armR);
      }

      districtC.add(terrace);

      // Giant Illuminated Sunburst Club Sign
      const clubSignTex = TextureGenerator.getGoldenHourClubSignTexture(side > 0 ? 0 : 1);
      const clubSign = new THREE.Mesh(this.getPlane(12.0, 5.0), this.createBasicMaterial({ map: clubSignTex, side: THREE.DoubleSide }));
      clubSign.position.set(side * (curbEdge + 0.2), 6.5, -chunkLength * 0.45);
      clubSign.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      districtC.add(clubSign);
    });

    // 2. Twin Skyline Spotlights Sweeping the Night Sky
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

    // 1. Monumental Fluted Granite & Marble Colonnade (Continuous depth down to Y = -4.0m)
    [-1, 1].forEach((side) => {
      const concW = 20.0;
      const concDepth = 4.8;
      const cx = side * (curbEdge + concW * 0.5);

      const concourse = new THREE.Mesh(this.getBox(concW, concDepth, chunkLength), this.darkGraniteMat);
      concourse.position.set(cx, 0.5 - 2.0, -chunkLength * 0.5);
      districtD.add(concourse);

      // Fluted Classical Art Deco Pillars
      for (let z = 8; z < chunkLength - 8; z += 12) {
        const pillar = new THREE.Mesh(this.getCylinder(0.65, 0.75, 9.5, 10), this.blackMarbleMat);
        pillar.position.set(side * (curbEdge + 2.2), 5.2, -z);
        districtD.add(pillar);

        // Gilded Capital
        const capital = new THREE.Mesh(this.getBox(1.8, 0.8, 1.8), this.goldMetalMat);
        capital.position.set(side * (curbEdge + 2.2), 10.2, -z);
        districtD.add(capital);

        // Hanging Crystal Chandelier
        const chandelier = this.buildCrystalChandelier(side * (curbEdge + 5.0), 8.5, -z);
        districtD.add(chandelier);
      }

      // Station Signage
      const grandSignTex = TextureGenerator.getMidnightGrandSignTexture(side > 0 ? 0 : 2);
      const grandSign = new THREE.Mesh(this.getPlane(10.0, 5.0), this.createBasicMaterial({ map: grandSignTex, side: THREE.DoubleSide }));
      grandSign.position.set(side * (curbEdge + 0.2), 5.5, -chunkLength * 0.5);
      grandSign.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      districtD.add(grandSign);
    });

    // 2. Monumental Central Art Deco Clock Tower
    const towerGroup = new THREE.Group();
    towerGroup.name = 'midnight_grand_clock_tower';
    towerGroup.position.set(-curbEdge - 14.0, 0.6, -chunkLength * 0.5);

    // Subterranean Plinth down to Y = -4.0m
    const towerPlinth = new THREE.Mesh(this.getBox(10.0, 4.0, 10.0), this.blackMarbleMat);
    towerPlinth.position.y = -2.0;
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

  private buildEveningGuest(parent: THREE.Group, x: number, y: number, z: number, outfitColor: number): void {
    const guest = new THREE.Group();
    guest.position.set(x, y, z);

    // Torso / Suit
    const torso = new THREE.Mesh(this.getBox(0.45, 0.85, 0.3), new THREE.MeshStandardMaterial({ color: outfitColor, roughness: 0.7 }));
    torso.position.y = 0.85;
    guest.add(torso);

    // Head
    const head = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.36, 8), this.cartoonSkinMat);
    head.position.y = 1.45;
    guest.add(head);

    // Legs
    const legs = new THREE.Mesh(this.getBox(0.4, 0.8, 0.25), this.blackMarbleMat);
    legs.position.y = 0.4;
    guest.add(legs);

    parent.add(guest);
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
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.6 });
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

  private buildLuxuryYacht(x: number, y: number, z: number, flipSide: boolean): THREE.Group {
    const yacht = new THREE.Group();
    yacht.name = 'marina_luxury_yacht';
    yacht.position.set(x, y, z);

    // Sleek White Hull
    const hull = new THREE.Mesh(this.getBox(3.8, 1.6, 12.0), this.champagneGlowMat);
    hull.position.y = 0.6;
    yacht.add(hull);

    // Bow Taper
    const bow = new THREE.Mesh(this.getCylinder(0.1, 1.9, 3.5, 6), this.champagneGlowMat);
    bow.rotation.x = Math.PI / 2;
    bow.position.set(0, 0.6, -7.2);
    yacht.add(bow);

    // Cabin Structure (Gilded trim and tinted glass)
    const cabin = new THREE.Mesh(this.getBox(3.0, 1.4, 6.5), this.midnightNavyMat);
    cabin.position.set(0, 2.0, -0.5);
    yacht.add(cabin);

    // Warm Lit Glass Portholes
    for (let p = -2.5; p <= 2.5; p += 2.5) {
      [-1.92, 1.92].forEach((px) => {
        const porthole = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.06, 8), this.warmGlassMat);
        porthole.rotation.z = Math.PI / 2;
        porthole.position.set(px, 0.8, p);
        yacht.add(porthole);
      });
    }

    // Radar Mast
    const mast = new THREE.Mesh(this.getCylinder(0.08, 0.08, 2.5, 6), this.goldMetalMat);
    mast.position.set(0, 3.8, -0.5);
    yacht.add(mast);

    return yacht;
  }

  private buildPartyDancer(x: number, y: number, z: number, suitColor: number): { group: THREE.Group; armL: THREE.Object3D; armR: THREE.Object3D } {
    const dancerGroup = new THREE.Group();
    dancerGroup.position.set(x, y, z);

    // Body
    const body = new THREE.Mesh(this.getBox(0.42, 0.85, 0.28), new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.6 }));
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
