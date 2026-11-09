import * as THREE from 'three';
import { SeededRandom, SceneryFactory } from '../../SceneryFactory';
import { CurvedShaderManager } from '../../../scene/CurvedShader';
import { MODERN_METRO_PALETTE, MODERN_METRO_DISTRICTS } from './ModernMetroTheme';
import {
  ModernMetroEventDirector,
  GrandInterchangeHeroActor,
  RiversideRevealHeroActor,
  FacadeElevatorActor,
  RoadTrafficActor,
  WalkingCommuterActor,
  SwayingTreeActor,
  BackgroundTrainActor
} from './ModernMetroEventDirector';

/**
 * Modern Metro: The Living City — World Builder
 *
 * Procedurally generates 6 distinct, rich architectural districts:
 * 1. Central Business District (CBD with stepped glass skyscrapers & facade elevators)
 * 2. Residential Boulevard (Balconies, trees, cafes, awnings, bicycle stands)
 * 3. Riverside District (Open skyline, suspension bridges & cruising ferries)
 * 4. Grand Modern Railway Interchange (Hero Event A: Commuter arrival & departure)
 * 5. Shopping & Cafe Plaza (Pedestrian plazas, cafe tables, bus stops, public sculpture)
 * 6. Elevated Urban Rail Overlook (Rooftop vistas, distant traffic, Hero Event B: Riverside Reveal)
 *
 * Invariant: Playable envelope |X| <= 4.2m below Y = 8.5m is strictly clear.
 * Invariant: Retaining plinths grounded down to Y = -5.85m.
 */
export class ModernMetroWorldBuilder {
  private static instance: ModernMetroWorldBuilder | null = null;

  // Cached Geometries for performance
  private boxGeos = new Map<string, THREE.BoxGeometry>();
  private cylGeos = new Map<string, THREE.CylinderGeometry>();
  private sphereGeos = new Map<string, THREE.SphereGeometry>();

  // Cached Materials
  private riverWaterMat: THREE.MeshStandardMaterial;
  private asphaltMat: THREE.MeshStandardMaterial;
  private facadeGlassMat: THREE.MeshStandardMaterial;
  private concreteWhiteMat: THREE.MeshStandardMaterial;
  private concreteLimestoneMat: THREE.MeshStandardMaterial;
  private structuralSteelMat: THREE.MeshStandardMaterial;
  private bronzeTrimMat: THREE.MeshStandardMaterial;
  private awningCrimsonMat: THREE.MeshStandardMaterial;
  private awningNavyMat: THREE.MeshStandardMaterial;
  private teakWoodMat: THREE.MeshStandardMaterial;
  private lushFoliageMat: THREE.MeshStandardMaterial;
  private neonCyanMat: THREE.MeshBasicMaterial;
  private amberBeaconMat: THREE.MeshBasicMaterial;
  private redSignalMat: THREE.MeshBasicMaterial;
  private greenSignalMat: THREE.MeshBasicMaterial;
  private ferryHullMat: THREE.MeshStandardMaterial;

  private constructor() {
    const curved = CurvedShaderManager.getInstance();

    this.riverWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.85
    });
    curved.applyCurvature(this.riverWaterMat);

    this.asphaltMat = new THREE.MeshStandardMaterial({
      color: MODERN_METRO_PALETTE.asphaltStreet,
      roughness: 0.85,
      metalness: 0.1
    });
    curved.applyCurvature(this.asphaltMat);

    this.facadeGlassMat = new THREE.MeshStandardMaterial({
      color: MODERN_METRO_PALETTE.glassDeepBlue,
      roughness: 0.1,
      metalness: 0.9,
      emissive: new THREE.Color(0x002244),
      emissiveIntensity: 0.25
    });
    curved.applyCurvature(this.facadeGlassMat);

    this.concreteWhiteMat = new THREE.MeshStandardMaterial({
      color: MODERN_METRO_PALETTE.concreteWhite,
      roughness: 0.45,
      metalness: 0.1
    });
    curved.applyCurvature(this.concreteWhiteMat);

    this.concreteLimestoneMat = new THREE.MeshStandardMaterial({
      color: MODERN_METRO_PALETTE.concreteLimestone,
      roughness: 0.6,
      metalness: 0.12
    });
    curved.applyCurvature(this.concreteLimestoneMat);

    this.structuralSteelMat = new THREE.MeshStandardMaterial({
      color: MODERN_METRO_PALETTE.steelDark,
      roughness: 0.5,
      metalness: 0.4
    });
    curved.applyCurvature(this.structuralSteelMat);

    this.bronzeTrimMat = new THREE.MeshStandardMaterial({
      color: MODERN_METRO_PALETTE.storefrontBronze,
      roughness: 0.35,
      metalness: 0.6
    });
    curved.applyCurvature(this.bronzeTrimMat);

    this.awningCrimsonMat = new THREE.MeshStandardMaterial({
      color: MODERN_METRO_PALETTE.awningCrimson,
      roughness: 0.7,
      metalness: 0.05
    });
    curved.applyCurvature(this.awningCrimsonMat);

    this.awningNavyMat = new THREE.MeshStandardMaterial({
      color: MODERN_METRO_PALETTE.awningNavy,
      roughness: 0.7,
      metalness: 0.05
    });
    curved.applyCurvature(this.awningNavyMat);

    this.teakWoodMat = new THREE.MeshStandardMaterial({
      color: MODERN_METRO_PALETTE.teakDecking,
      roughness: 0.65,
      metalness: 0.1
    });
    curved.applyCurvature(this.teakWoodMat);

    this.lushFoliageMat = new THREE.MeshStandardMaterial({
      color: MODERN_METRO_PALETTE.foliageEmerald,
      roughness: 0.8,
      metalness: 0.05
    });
    curved.applyCurvature(this.lushFoliageMat);

    this.neonCyanMat = new THREE.MeshBasicMaterial({ color: MODERN_METRO_PALETTE.glassCyan });
    curved.applyCurvature(this.neonCyanMat);

    this.amberBeaconMat = new THREE.MeshBasicMaterial({ color: MODERN_METRO_PALETTE.safetyAmber });
    curved.applyCurvature(this.amberBeaconMat);

    this.redSignalMat = new THREE.MeshBasicMaterial({ color: MODERN_METRO_PALETTE.signalRed });
    curved.applyCurvature(this.redSignalMat);

    this.greenSignalMat = new THREE.MeshBasicMaterial({ color: MODERN_METRO_PALETTE.signalGreen });
    curved.applyCurvature(this.greenSignalMat);

    this.ferryHullMat = new THREE.MeshStandardMaterial({
      color: MODERN_METRO_PALETTE.ferryWhite,
      roughness: 0.3,
      metalness: 0.2
    });
    curved.applyCurvature(this.ferryHullMat);
  }

  public static getInstance(): ModernMetroWorldBuilder {
    if (!ModernMetroWorldBuilder.instance) {
      ModernMetroWorldBuilder.instance = new ModernMetroWorldBuilder();
    }
    return ModernMetroWorldBuilder.instance;
  }

  // --- Geometry Helpers ---

  private getBox(w: number, h: number, d: number): THREE.BoxGeometry {
    return new THREE.BoxGeometry(w, h, d);
  }

  private getCylinder(rt: number, rb: number, h: number, s: number): THREE.CylinderGeometry {
    return new THREE.CylinderGeometry(rt, rb, h, s);
  }

  private getSphere(r: number, ws: number, hs: number): THREE.SphereGeometry {
    return new THREE.SphereGeometry(r, ws, hs);
  }

  // =========================================================================
  // MAIN ENTRYPOINT: BUILD DISTRICT SCENERY
  // =========================================================================

  public buildDistrictScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidthOrChunkLength: number = 1.2,
    chunkLengthOrSeed: number = 80,
    seedOrDetail: number | 'FULL' | 'BALANCED' | 'MINIMAL' = 42,
    detailOrWorldZ: 'FULL' | 'BALANCED' | 'MINIMAL' | number = 'FULL',
    worldZParam: number = 0
  ): void {
    let curbWidth = 1.2;
    let chunkLength = 80;
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
    const director = ModernMetroEventDirector.getInstance();

    // 1. Structural Grounded Retaining Plinths & Rail Enclosure down to Y = -5.85m
    this.buildGroundedRetainingPlinths(group, roadbedWidth, curbWidth, chunkLength);

    // 2. Modern Overhead Catenary Gantries with LED Signals
    this.buildModernCatenarySystem(group, chunkLength);

    // 3. District Cycle Determination (6 distinct districts across endless runs)
    const chunkIdx = Math.floor(Math.abs(worldZ) / Math.max(1, chunkLength));
    const districtType = chunkIdx % 6;

    const wallX = roadbedWidth * 0.5 + curbWidth + 0.5; // ~5.8m (play envelope |X| <= 4.2m is 100% clear)

    switch (districtType) {
      case 0: // District A: Central Business District (Stepped Towers, Glass Elevators, Corporate Plazas)
        this.buildDistrictCBD(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
      case 1: // District B: Residential Boulevard (Balconies, Awnings, Trees, Commuters, Cafes)
        this.buildDistrictResidentialBoulevard(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
      case 2: // District C: Riverside Waterfront (Open River Panorama, Suspension Bridges, Ferries)
        this.buildDistrictRiverside(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
      case 3: // District D: Grand Modern Interchange (Arched Canopy, Platforms, Hero Event A)
        this.buildDistrictGrandInterchange(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
      case 4: // District E: Shopping & Cafe Plaza (Pedestrian Promenade, Outdoor Dining, Public Sculpture, Bus Stops)
        this.buildDistrictShoppingPlaza(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
      case 5: // District F: Elevated Skyline Overlook (Viaduct, Rooftops, Road Traffic, Hero Event B: Riverside Reveal)
        this.buildDistrictElevatedSkyline(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
    }

    // 4. Overhead Skybridge (deterministic placement in appropriate chunks)
    if (districtType !== 3 && districtType !== 2 && rng.chance(0.45)) {
      this.buildModernSkybridge(group, chunkLength);
    }
  }

  // =========================================================================
  // FOUNDATION & WALL ENCLOSURE (Y = -5.85m to +2.4m)
  // =========================================================================

  private buildGroundedRetainingPlinths(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number
  ): void {
    const mats = SceneryFactory.getInstance().getSharedMaterials();

    const wallHeight = 2.4;
    const wallThick = 0.6;
    const wallX = roadbedWidth * 0.5 + curbWidth + wallThick * 0.5 + 0.2;
    const foundationDepth = 7.0; // Y from -5.85m to +1.15m

    // Instanced railing vertical posts per side (prevents cross-track union bounding box)
    const postCountPerSide = Math.floor((chunkLength - 4) / 8) + 1;
    const postGeo = this.getCylinder(0.04, 0.04, 0.85, 6);
    const dummy = new THREE.Object3D();

    [-wallX, wallX].forEach((wx, sideIdx) => {
      const sideName = sideIdx === 0 ? 'left' : 'right';
      const sidePosts = new THREE.InstancedMesh(postGeo, this.structuralSteelMat, postCountPerSide);
      sidePosts.name = `modern_railing_posts_${sideName}`;
      let postIdx = 0;

      // Deep foundation plinth down to -5.85m
      const plinth = new THREE.Mesh(this.getBox(wallThick + 0.4, foundationDepth, chunkLength), this.structuralSteelMat);
      plinth.position.set(wx, -foundationDepth * 0.5 + 1.15, -chunkLength * 0.5);
      plinth.name = 'modern_foundation_plinth';
      group.add(plinth);

      // Upper visible retaining wall
      const wall = new THREE.Mesh(this.getBox(wallThick, wallHeight, chunkLength), mats.modernConcreteMat);
      wall.position.set(wx, wallHeight * 0.5, -chunkLength * 0.5);
      wall.castShadow = true;
      wall.receiveShadow = true;
      wall.name = 'modern_retaining_wall';
      group.add(wall);

      // Coping cap with sleek granite finish
      const cap = new THREE.Mesh(this.getBox(wallThick + 0.2, 0.2, chunkLength), mats.curbMat);
      cap.position.set(wx, wallHeight + 0.1, -chunkLength * 0.5);
      cap.name = 'modern_coping_cap';
      group.add(cap);

      // Neon cyan accent illumination strip
      const neon = new THREE.Mesh(this.getBox(0.08, 0.08, chunkLength), this.neonCyanMat);
      neon.position.set(wx + (wx > 0 ? -wallThick * 0.5 : wallThick * 0.5), wallHeight + 0.06, -chunkLength * 0.5);
      neon.name = 'modern_neon_accent';
      group.add(neon);

      // Yellow safety railing
      const railBar = new THREE.Mesh(this.getBox(0.08, 0.08, chunkLength), this.amberBeaconMat);
      railBar.position.set(wx, wallHeight + 0.85, -chunkLength * 0.5);
      railBar.name = 'modern_railing_bar';
      group.add(railBar);

      // Railing vertical posts every 8m
      for (let z = 4; z < chunkLength; z += 8) {
        dummy.position.set(wx, wallHeight + 0.425, -z);
        dummy.updateMatrix();
        sidePosts.setMatrixAt(postIdx++, dummy.matrix);
      }
      sidePosts.instanceMatrix.needsUpdate = true;
      group.add(sidePosts);
    });
  }

  // =========================================================================
  // MODERN OVERHEAD CATENARY SYSTEM (Y = 7.5m to 8.2m)
  // =========================================================================

  private buildModernCatenarySystem(group: THREE.Group, chunkLength: number): void {
    const mats = SceneryFactory.getInstance().getSharedMaterials();

    const gantrySpacing = 28.0;
    const gantryCount = Math.floor(chunkLength / gantrySpacing);
    const spanW = 15.2;
    const trussY = 10.8; // Overhead truss high above train roofs (catwalk=4.35m, camera=7.95m)

    for (let i = 0; i < gantryCount; i++) {
      const gz = -i * gantrySpacing - 14.0;
      const gantry = new THREE.Group();
      gantry.name = 'modern_catenary_gantry';
      gantry.position.set(0, 0, gz);

      // Side vertical steel columns (strictly outside playable envelope at |X| = 7.6m)
      [-spanW * 0.5, spanW * 0.5].forEach((colX) => {
        const col = new THREE.Mesh(this.getBox(0.35, trussY + 1.2, 0.35), mats.catenarySteelMat);
        col.position.set(colX, (trussY + 1.2) * 0.5, 0);
        gantry.add(col);

        // Mast-mounted cantilever support bracket (at Y=7.5m strictly at |X|=7.6m, outside corridor)
        const bracket = new THREE.Mesh(this.getBox(0.5, 0.35, 0.5), mats.catenarySteelMat);
        bracket.position.set(colX, 7.5, 0);
        gantry.add(bracket);
      });

      // Horizontal catenary box truss girder (Y = 10.8m, clear above 8.5m envelope)
      const truss = new THREE.Mesh(this.getBox(spanW, 0.45, 0.45), mats.catenarySteelMat);
      truss.position.set(0, trussY, 0);
      gantry.add(truss);

      // Electrical ceramic insulators & dropper wires elevated at Y = 10.4m
      [-3.2, 0, 3.2].forEach((wireX) => {
        const ins = new THREE.Mesh(this.getCylinder(0.12, 0.12, 0.35, 8), mats.insulatorMat);
        ins.position.set(wireX, trussY - 0.35, 0);
        gantry.add(ins);

        // Green railway track clearance signal lamp
        const sig = new THREE.Mesh(this.getSphere(0.12, 8, 8), this.greenSignalMat);
        sig.position.set(wireX, trussY + 0.35, 0.25);
        gantry.add(sig);
      });

      group.add(gantry);
    }

    // Longitudinal power cables extending along entire chunk elevated at Y = 10.2m
    [-3.2, 0, 3.2].forEach((wireX) => {
      const cable = new THREE.Mesh(this.getBox(0.04, 0.04, chunkLength), mats.cableMat);
      cable.position.set(wireX, trussY - 0.6, -chunkLength * 0.5);
      cable.name = 'modern_catenary_cable';
      group.add(cable);
    });
  }

  // =========================================================================
  // DISTRICT A: CENTRAL BUSINESS DISTRICT (CBD GLASS SKYSCRAPERS & ELEVATORS)
  // =========================================================================

  private buildDistrictCBD(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: ModernMetroEventDirector,
    worldZ: number
  ): void {
    const mats = SceneryFactory.getInstance().getSharedMaterials();
    const district = new THREE.Group();
    district.name = `modern_district_cbd_${Math.floor(worldZ)}`;

    const numTowers = 4;
    const lotLength = chunkLength / numTowers;

    for (let i = 0; i < numTowers; i++) {
      const bz = -i * lotLength - lotLength * 0.5;

      [-1, 1].forEach((side) => {
        const towerGroup = new THREE.Group();
        const bW = rng.range(12.0, 16.0);
        const bH = rng.range(38.0, 56.0); // Majestic skyscraper skyline
        const bD = lotLength * rng.range(0.88, 0.96);
        const frontX = wallX + 2.5;
        const bX = side * (frontX + bW * 0.5);

        towerGroup.position.set(bX, 0, bz);

        // 1. Ground-level double-height corporate entrance lobby (podium)
        const lobbyH = 6.0;
        const lobby = new THREE.Mesh(this.getBox(bW + 0.8, lobbyH, bD * 0.95), this.concreteWhiteMat);
        lobby.position.y = lobbyH * 0.5;
        towerGroup.add(lobby);

        // Glass lobby entrance facade & revolving doors
        const glassEntry = new THREE.Mesh(this.getBox(0.4, 4.5, bD * 0.7), mats.modernGlassMat);
        glassEntry.position.set(-side * (bW * 0.5 + 0.4), 2.25, 0);
        towerGroup.add(glassEntry);

        // Entrance architectural canopy
        const canopy = new THREE.Mesh(this.getBox(2.2, 0.25, bD * 0.65), mats.modernSteelMat);
        canopy.position.set(-side * (bW * 0.5 + 1.2), 4.8, 0);
        towerGroup.add(canopy);

        // 2. Main Skyscraper Tower Shaft
        const mainBody = new THREE.Mesh(this.getBox(bW, bH, bD), this.structuralSteelMat);
        mainBody.position.y = bH * 0.5;
        towerGroup.add(mainBody);

        // Curtain wall glass panels with recessed mullions
        const curtainGlass = new THREE.Mesh(this.getBox(bW + 0.15, bH * 0.86, bD * 0.9), this.facadeGlassMat);
        curtainGlass.position.y = bH * 0.5 + 1.5;
        towerGroup.add(curtainGlass);

        // 3. Stepped Setback Penthouse & Helipad
        const pentW = bW * 0.65;
        const pentH = 5.5;
        const pent = new THREE.Mesh(this.getBox(pentW, pentH, bD * 0.65), this.concreteWhiteMat);
        pent.position.set(0, bH + pentH * 0.5, 0);
        towerGroup.add(pent);

        // Helipad deck on penthouse roof
        const helipad = new THREE.Mesh(this.getBox(pentW * 0.85, 0.2, pentW * 0.85), mats.curbMat);
        helipad.position.y = bH + pentH + 0.1;
        towerGroup.add(helipad);

        // Aviation red warning beacon
        const beacon = new THREE.Mesh(this.getSphere(0.35, 8, 8), this.redSignalMat);
        beacon.position.set(0, bH + pentH + 0.6, 0);
        towerGroup.add(beacon);

        // 4. Exterior Glass Facade Elevator System
        if (detail !== 'MINIMAL') {
          const elevColumn = new THREE.Mesh(this.getBox(1.2, bH * 0.85, 2.4), mats.modernGlassBridgeMat);
          elevColumn.position.set(-side * (bW * 0.5 + 0.6), bH * 0.48, 0);
          towerGroup.add(elevColumn);

          // Moving elevator carriage
          const carriage = new THREE.Mesh(this.getBox(1.0, 3.2, 2.0), mats.modernSteelMat);
          carriage.position.set(-side * (bW * 0.5 + 0.6), 12.0, 0);
          towerGroup.add(carriage);

          const indicatorLight = new THREE.Mesh(this.getSphere(0.15, 6, 6), this.amberBeaconMat);
          indicatorLight.position.set(-side * (bW * 0.5 + 1.15), 13.0, 0);
          towerGroup.add(indicatorLight);

          director.registerFacadeElevator({
            group: towerGroup,
            carriage,
            indicatorLight,
            minY: 8.0,
            maxY: bH - 6.0,
            speed: rng.range(0.8, 1.4),
            phaseOffset: rng.range(0, Math.PI * 2)
          });
        }

        district.add(towerGroup);
      });
    }

    parent.add(district);
  }

  // =========================================================================
  // DISTRICT B: RESIDENTIAL BOULEVARD (BALCONIES, TREES, CAFES & COMMUTERS)
  // =========================================================================

  private buildDistrictResidentialBoulevard(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: ModernMetroEventDirector,
    worldZ: number
  ): void {
    const mats = SceneryFactory.getInstance().getSharedMaterials();
    const district = new THREE.Group();
    district.name = `modern_district_residential_${Math.floor(worldZ)}`;

    const numBlocks = 4;
    const blockLength = chunkLength / numBlocks;

    for (let i = 0; i < numBlocks; i++) {
      const bz = -i * blockLength - blockLength * 0.5;

      [-1, 1].forEach((side) => {
        const blockGroup = new THREE.Group();
        const bW = rng.range(12.0, 15.0);
        const bH = rng.range(22.0, 34.0);
        const bD = blockLength * 0.90;
        const frontX = wallX + 2.8;
        const bX = side * (frontX + bW * 0.5);

        blockGroup.position.set(bX, 0, bz);

        // Building facade in warm honed limestone
        const mainBody = new THREE.Mesh(this.getBox(bW, bH, bD), this.concreteLimestoneMat);
        mainBody.position.y = bH * 0.5;
        blockGroup.add(mainBody);

        // Ground-floor artisan bakery / boutique cafe
        const cafePodium = new THREE.Mesh(this.getBox(bW + 0.4, 4.5, bD * 0.95), mats.modernStorefrontMat);
        cafePodium.position.y = 2.25;
        blockGroup.add(cafePodium);

        // Striped decorative fabric awning
        const awning = new THREE.Mesh(this.getBox(1.8, 0.4, bD * 0.8), (i % 2 === 0) ? this.awningCrimsonMat : this.awningNavyMat);
        awning.position.set(-side * (bW * 0.5 + 0.9), 3.8, 0);
        awning.rotation.z = -side * 0.2;
        blockGroup.add(awning);

        // Cantilevered residential balconies with glass railings
        if (detail !== 'MINIMAL') {
          const balconyFloors = Math.floor(bH / 4.8);
          for (let f = 1; f < balconyFloors; f++) {
            const balc = new THREE.Group();
            balc.position.set(-side * (bW * 0.5 + 0.5), f * 4.8, 0);

            const floor = new THREE.Mesh(this.getBox(0.9, 0.2, 4.2), this.concreteWhiteMat);
            balc.add(floor);

            const glassRailing = new THREE.Mesh(this.getBox(0.85, 0.9, 4.1), mats.modernGlassBridgeMat);
            glassRailing.position.y = 0.55;
            balc.add(glassRailing);

            blockGroup.add(balc);
          }
        }

        district.add(blockGroup);

        // Tree-lined sidewalk outside retaining walls (swaying street trees)
        const treeX = side * (wallX + 1.2);
        this.buildSwayingStreetTree(district, treeX, bz + rng.range(-4.0, 4.0), director, rng);

        // Street-level microdetails: Commuter bench and planters
        if (detail !== 'MINIMAL') {
          const bench = new THREE.Mesh(this.getBox(0.6, 0.5, 2.0), this.teakWoodMat);
          bench.position.set(side * (wallX + 1.2), 0.25, bz + 5.0);
          district.add(bench);

          const planter = new THREE.Mesh(this.getBox(0.8, 0.6, 2.5), this.lushFoliageMat);
          planter.position.set(side * (wallX + 1.2), 0.3, bz - 5.0);
          district.add(planter);

          // Bicycle stand with parked commuter bikes
          const bikeStand = new THREE.Mesh(this.getBox(0.3, 0.8, 2.2), this.structuralSteelMat);
          bikeStand.position.set(side * (wallX + 1.4), 0.4, bz + 9.0);
          district.add(bikeStand);
        }

        // Animated Walking Commuter on Sidewalk
        if (detail === 'FULL') {
          this.buildWalkingCommuter(district, side * (wallX + 1.5), bz, director, rng);
        }
      });
    }

    parent.add(district);
  }

  // =========================================================================
  // DISTRICT C: RIVERSIDE WATERFRONT (PANORAMIC RIVER, BRIDGES & FERRIES)
  // =========================================================================

  private buildDistrictRiverside(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: ModernMetroEventDirector,
    worldZ: number
  ): void {
    const mats = SceneryFactory.getInstance().getSharedMaterials();
    const district = new THREE.Group();
    district.name = `modern_district_riverside_${Math.floor(worldZ)}`;

    // Wide open river surface (+X side breaks the retaining wall into promenade)
    const riverW = 120.0;
    const riverMesh = new THREE.Mesh(this.getBox(riverW, 1.0, chunkLength), this.riverWaterMat);
    riverMesh.position.set(wallX + riverW * 0.5 + 2.0, -1.8, -chunkLength * 0.5);
    district.add(riverMesh);

    // Polished stone riverside promenade walkway & marine railings
    const promW = 4.5;
    const promenade = new THREE.Mesh(this.getBox(promW, 1.5, chunkLength), this.concreteWhiteMat);
    promenade.position.set(wallX + promW * 0.5 + 0.5, -0.25, -chunkLength * 0.5);
    district.add(promenade);

    // Marine balustrade railings along water edge
    const railing = new THREE.Mesh(this.getBox(0.12, 0.9, chunkLength), this.structuralSteelMat);
    railing.position.set(wallX + promW + 0.4, 0.9, -chunkLength * 0.5);
    district.add(railing);

    // Distant suspension bridge tower spanning across river
    const bridgeTowerX = wallX + 65.0;
    const towerH = 45.0;
    const bridgeTower = new THREE.Group();
    bridgeTower.position.set(bridgeTowerX, 0, -chunkLength * 0.5);

    // Twin suspension bridge legs & cross-struts
    [-6.0, 6.0].forEach((tz) => {
      const leg = new THREE.Mesh(this.getBox(2.2, towerH, 2.2), this.structuralSteelMat);
      leg.position.set(0, towerH * 0.5, tz);
      bridgeTower.add(leg);
    });

    const crossBeam = new THREE.Mesh(this.getBox(2.4, 1.8, 14.0), this.structuralSteelMat);
    crossBeam.position.set(0, towerH * 0.75, 0);
    bridgeTower.add(crossBeam);

    // Bridge deck carrying distant commuter road traffic
    const roadDeck = new THREE.Mesh(this.getBox(riverW * 0.9, 1.2, 8.0), this.asphaltMat);
    roadDeck.position.set(0, 14.0, 0);
    bridgeTower.add(roadDeck);

    district.add(bridgeTower);

    // Cruising Modern Passenger Catamaran Ferry
    this.buildModernRiverFerry(district, wallX + 32.0, -chunkLength * 0.5, director, rng);

    // Opposite riverbank modern skyline buildings
    const farBankX = wallX + riverW - 15.0;
    for (let k = 0; k < 3; k++) {
      const kz = -k * 26.0 - 13.0;
      const farH = rng.range(32.0, 48.0);
      const farTower = new THREE.Mesh(this.getBox(18.0, farH, 20.0), mats.modernGlassMat);
      farTower.position.set(farBankX, farH * 0.5 - 2.0, kz);
      district.add(farTower);
    }

    parent.add(district);
  }

  // =========================================================================
  // DISTRICT D: GRAND MODERN INTERCHANGE (HERO EVENT A: COMMUTER ARRIVAL)
  // =========================================================================

  private buildDistrictGrandInterchange(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: ModernMetroEventDirector,
    worldZ: number
  ): void {
    const mats = SceneryFactory.getInstance().getSharedMaterials();
    const district = new THREE.Group();
    district.name = `modern_district_interchange_${Math.floor(worldZ)}`;

    // Colossal arched steel and glass terminal canopy (Apex Y = 12.0m, wide clear headroom)
    const canopyW = 28.0;
    const canopyArchH = 12.0;
    const canopyGroup = new THREE.Group();
    canopyGroup.name = 'modern_grand_interchange_canopy';
    canopyGroup.position.set(0, 0, -chunkLength * 0.5);

    // Arched glass roof
    const archRibCount = Math.floor(chunkLength / 18.0);
    for (let r = 0; r <= archRibCount; r++) {
      const rz = -chunkLength * 0.5 + r * 18.0;
      const rib = new THREE.Mesh(this.getBox(canopyW, 0.5, 0.5), this.structuralSteelMat);
      rib.position.set(0, canopyArchH, rz);
      canopyGroup.add(rib);

      // Support piers (well outside playable envelope at X = +-14.0m)
      [-canopyW * 0.5, canopyW * 0.5].forEach((px) => {
        const pier = new THREE.Mesh(this.getBox(0.8, canopyArchH, 0.8), this.concreteWhiteMat);
        pier.position.set(px, canopyArchH * 0.5, rz);
        canopyGroup.add(pier);
      });
    }

    // Translucent glazed canopy roof plane
    const roofGlazing = new THREE.Mesh(this.getBox(canopyW - 1.0, 0.2, chunkLength), mats.modernGlassBridgeMat);
    roofGlazing.position.set(0, canopyArchH + 0.2, 0);
    canopyGroup.add(roofGlazing);

    district.add(canopyGroup);

    // Adjacent Commuter Platform (+X side: X = 7.5m to 12.5m)
    const platW = 4.5;
    const platH = 1.4;
    const platX = wallX + platW * 0.5 + 1.2;
    const platform = new THREE.Mesh(this.getBox(platW, platH, chunkLength), this.concreteWhiteMat);
    platform.position.set(platX, platH * 0.5, -chunkLength * 0.5);
    district.add(platform);

    // Platform yellow safety tactile paving strip
    const tactileStrip = new THREE.Mesh(this.getBox(0.3, 0.05, chunkLength), this.amberBeaconMat);
    tactileStrip.position.set(platX - platW * 0.5 + 0.2, platH + 0.025, -chunkLength * 0.5);
    district.add(tactileStrip);

    // Digital Departure Information Screens
    const screen = new THREE.Mesh(this.getBox(3.5, 1.2, 0.2), mats.modernSignMat);
    screen.position.set(platX, platH + 2.8, -chunkLength * 0.5);
    district.add(screen);

    // Station waiting commuters on platform
    const platformCommuters: THREE.Group[] = [];
    for (let c = 0; c < 5; c++) {
      const cz = -chunkLength * 0.3 - c * 5.0;
      const commuter = this.createCommuterFigure();
      commuter.position.set(platX, platH, cz);
      commuter.userData.baseX = platX;
      district.add(commuter);
      platformCommuters.push(commuter);
    }

    // Hero Event A Actor: Detailed Commuter Train on Platform Track (+X side at X = platX + platW * 0.5 + 1.8m)
    const trainX = platX + platW * 0.5 + 1.8;
    const trainMesh = this.createCommuterExpressTrain(trainX);
    district.add(trainMesh);

    // Collect doors, brake lights, indicators for 6-stage lifecycle animation
    const leftDoors: THREE.Mesh[] = [];
    const rightDoors: THREE.Mesh[] = [];
    const brakeLights: THREE.Mesh[] = [];
    const headlights: THREE.Mesh[] = [];
    const platformIndicators: THREE.Mesh[] = [];

    trainMesh.traverse((child) => {
      if (child.name === 'train_door_left') leftDoors.push(child as THREE.Mesh);
      if (child.name === 'train_door_right') rightDoors.push(child as THREE.Mesh);
      if (child.name === 'train_brake_light') brakeLights.push(child as THREE.Mesh);
      if (child.name === 'train_headlight') headlights.push(child as THREE.Mesh);
    });

    // Amber platform boarding indicators
    [-chunkLength * 0.3, -chunkLength * 0.6].forEach((iz) => {
      const ind = new THREE.Mesh(this.getSphere(0.2, 6, 6), this.amberBeaconMat);
      ind.position.set(platX - platW * 0.5 + 0.2, platH + 2.2, iz);
      ind.visible = false;
      district.add(ind);
      platformIndicators.push(ind);
    });

    const heroActor: GrandInterchangeHeroActor = {
      group: district,
      trainMesh,
      leftDoors,
      rightDoors,
      brakeLights,
      headlights,
      commuters: platformCommuters,
      platformIndicators,
      triggerZ: worldZ - chunkLength * 0.5,
      initialTrainZ: -chunkLength * 1.5,
      targetStopZ: -chunkLength * 0.5,
      departZ: chunkLength * 0.8,
      state: 'DORMANT',
      timer: 0
    };

    director.registerGrandInterchange(heroActor);

    parent.add(district);
  }

  // =========================================================================
  // DISTRICT E: SHOPPING & CAFE PLAZA (PROMENADES, OUTDOOR DINING & SCULPTURE)
  // =========================================================================

  private buildDistrictShoppingPlaza(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: ModernMetroEventDirector,
    worldZ: number
  ): void {
    const mats = SceneryFactory.getInstance().getSharedMaterials();
    const district = new THREE.Group();
    district.name = `modern_district_shopping_${Math.floor(worldZ)}`;

    // Wide pedestrian shopping plaza on both flanks
    [-1, 1].forEach((side) => {
      const plazaW = 10.0;
      const plazaX = side * (wallX + plazaW * 0.5 + 1.0);
      const plaza = new THREE.Mesh(this.getBox(plazaW, 0.4, chunkLength), this.concreteWhiteMat);
      plaza.position.set(plazaX, 0.2, -chunkLength * 0.5);
      district.add(plaza);

      // Outdoor Cafe Tables with Canvas Parasols
      const tableCount = 3;
      for (let t = 0; t < tableCount; t++) {
        const tz = -t * 18.0 - 15.0;
        const tx = side * (wallX + 3.2);

        // Cafe Table
        const table = new THREE.Mesh(this.getCylinder(0.65, 0.65, 0.75, 8), this.structuralSteelMat);
        table.position.set(tx, 0.775, tz);
        district.add(table);

        // Parasol Umbrella
        const pole = new THREE.Mesh(this.getCylinder(0.04, 0.04, 2.5, 6), this.structuralSteelMat);
        pole.position.set(tx, 1.65, tz);
        district.add(pole);

        const canopy = new THREE.Mesh(this.getCylinder(1.6, 0.1, 0.45, 8), (t % 2 === 0) ? this.awningCrimsonMat : this.awningNavyMat);
        canopy.position.set(tx, 2.8, tz);
        district.add(canopy);

        // Cafe chairs
        [-0.8, 0.8].forEach((cx) => {
          const chair = new THREE.Mesh(this.getBox(0.45, 0.45, 0.45), this.teakWoodMat);
          chair.position.set(tx + cx, 0.625, tz);
          district.add(chair);
        });
      }

      // Bus Stop with Glass Shelter
      const busStopZ = -chunkLength * 0.65;
      const busX = side * (wallX + 4.5);
      const shelter = new THREE.Group();
      shelter.position.set(busX, 0.4, busStopZ);

      const roof = new THREE.Mesh(this.getBox(2.8, 0.15, 4.5), mats.modernSteelMat);
      roof.position.y = 2.4;
      shelter.add(roof);

      const glassBack = new THREE.Mesh(this.getBox(0.1, 2.3, 4.2), mats.modernGlassBridgeMat);
      glassBack.position.set(-side * 1.3, 1.2, 0);
      shelter.add(glassBack);

      const timetable = new THREE.Mesh(this.getBox(0.12, 1.5, 0.8), mats.modernSignMat);
      timetable.position.set(-side * 1.2, 1.3, -1.2);
      shelter.add(timetable);

      district.add(shelter);

      // Public Geometric Art Sculpture (Faceted Steel/Glass Prism)
      if (side > 0 && detail === 'FULL') {
        const sculptGroup = new THREE.Group();
        sculptGroup.position.set(wallX + 5.5, 0.4, -chunkLength * 0.25);

        const plinth = new THREE.Mesh(this.getBox(2.2, 0.8, 2.2), this.concreteWhiteMat);
        plinth.position.y = 0.4;
        sculptGroup.add(plinth);

        const prism = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 0), mats.modernGlassBridgeMat);
        prism.position.y = 2.2;
        prism.rotation.set(0.3, 0.5, 0.2);
        sculptGroup.add(prism);

        district.add(sculptGroup);
      }
    });

    parent.add(district);
  }

  // =========================================================================
  // DISTRICT F: ELEVATED URBAN RAIL & HERO EVENT B: RIVERSIDE REVEAL
  // =========================================================================

  private buildDistrictElevatedSkyline(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: ModernMetroEventDirector,
    worldZ: number
  ): void {
    const mats = SceneryFactory.getInstance().getSharedMaterials();
    const district = new THREE.Group();
    district.name = `modern_district_elevated_${Math.floor(worldZ)}`;

    // Viaduct support columns holding the elevated track corridor
    for (let vz = 8; vz < chunkLength; vz += 24) {
      [-wallX - 0.5, wallX + 0.5].forEach((vx) => {
        const pier = new THREE.Mesh(this.getBox(1.2, 6.5, 1.2), this.concreteLimestoneMat);
        pier.position.set(vx, -3.25, -vz);
        district.add(pier);
      });
    }

    // Wide peripheral avenues below viaduct with animated road commuter traffic
    [-wallX - 9.0, wallX + 9.0].forEach((roadX) => {
      const road = new THREE.Mesh(this.getBox(8.0, 0.3, chunkLength), this.asphaltMat);
      road.position.set(roadX, -1.2, -chunkLength * 0.5);
      district.add(road);

      // Painted white road lane markings
      const dash = new THREE.Mesh(this.getBox(0.2, 0.05, chunkLength * 0.9), this.concreteWhiteMat);
      dash.position.set(roadX, -1.025, -chunkLength * 0.5);
      district.add(dash);
    });

    // Create animated automotive traffic system
    const trafficVehicles: Array<{
      mesh: THREE.Group;
      speed: number;
      initialZ: number;
      minZ: number;
      maxZ: number;
    }> = [];

    for (let v = 0; v < 4; v++) {
      const vehMesh = this.createRoadVehicle(v % 2 === 0);
      const isBus = (v % 2 === 0);
      const laneX = v % 2 === 0 ? wallX + 9.0 : -wallX - 9.0;
      const speed = (v % 2 === 0 ? 1 : -1) * rng.range(12.0, 18.0);
      const vz = -v * 20.0 - 10.0;

      vehMesh.position.set(laneX, -0.9, vz);
      district.add(vehMesh);

      trafficVehicles.push({
        mesh: vehMesh,
        speed,
        initialZ: vz,
        minZ: -chunkLength * 1.5,
        maxZ: chunkLength * 0.5
      });
    }

    director.registerRoadTraffic({
      group: district,
      vehicles: trafficVehicles
    });

    // Hero Event B: Riverside Reveal (Open River Panorama, Suspension Bridge & Cruising Ferry)
    const riverW = 100.0;
    const riverMesh = new THREE.Mesh(this.getBox(riverW, 1.0, chunkLength), this.riverWaterMat);
    riverMesh.position.set(wallX + riverW * 0.5 + 4.0, -1.8, -chunkLength * 0.5);
    district.add(riverMesh);

    // Panoramic suspension bridge spanning the river
    const panoBridge = new THREE.Group();
    panoBridge.position.set(wallX + 45.0, 12.0, -chunkLength * 0.5);
    const bridgeRoad = new THREE.Mesh(this.getBox(riverW * 0.8, 1.0, 6.0), this.asphaltMat);
    panoBridge.add(bridgeRoad);
    district.add(panoBridge);

    // River ferry cruising beneath
    const ferryGroup = this.createPassengerFerry();
    const initialX = wallX + 18.0;
    const targetX = wallX + 55.0;
    ferryGroup.position.set(initialX, -1.2, -chunkLength * 0.5);
    district.add(ferryGroup);

    // Collect spray plumes
    const waterSprayPlumes: THREE.Mesh[] = [];
    ferryGroup.traverse((child) => {
      if (child.name === 'ferry_spray') waterSprayPlumes.push(child as THREE.Mesh);
    });

    // Pedestrians on bridge
    const bridgePedestrians: THREE.Group[] = [];
    for (let p = 0; p < 4; p++) {
      const ped = this.createCommuterFigure();
      ped.position.set(-15.0 + p * 8.0, 12.8, -chunkLength * 0.5);
      ped.userData.baseX = ped.position.x;
      district.add(ped);
      bridgePedestrians.push(ped);
    }

    const revealActor: RiversideRevealHeroActor = {
      group: district,
      ferryMesh: ferryGroup,
      waterSprayPlumes,
      bridgePedestrians,
      panoramicBridge: panoBridge,
      triggerZ: worldZ - chunkLength * 0.5,
      initialFerryX: initialX,
      targetFerryX: targetX,
      state: 'DORMANT',
      timer: 0
    };

    director.registerRiversideReveal(revealActor);

    parent.add(district);
  }

  // =========================================================================
  // OVERHEAD SKYBRIDGE (Y = 12.0m CLEARANCE)
  // =========================================================================

  private buildModernSkybridge(group: THREE.Group, chunkLength: number): void {
    const mats = SceneryFactory.getInstance().getSharedMaterials();
    const bridgeHeight = 12.0;
    const bridgeWidth = 6.5;
    const bridgeSpan = 32.0;

    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = 'modern_skybridge';
    bridgeGroup.position.set(0, bridgeHeight, -chunkLength * 0.5);

    // Floor deck
    const deck = new THREE.Mesh(this.getBox(bridgeSpan, 0.4, bridgeWidth), mats.modernSteelMat);
    bridgeGroup.add(deck);

    // Translucent glass walls
    [-bridgeWidth * 0.5 + 0.1, bridgeWidth * 0.5 - 0.1].forEach((gz) => {
      const gw = new THREE.Mesh(this.getBox(bridgeSpan, 2.6, 0.12), mats.modernGlassBridgeMat);
      gw.position.set(0, 1.5, gz);
      bridgeGroup.add(gw);
    });

    // Sleek white aerodynamic roof
    const roof = new THREE.Mesh(this.getBox(bridgeSpan + 0.8, 0.4, bridgeWidth + 0.6), this.concreteWhiteMat);
    roof.position.set(0, 3.0, 0);
    bridgeGroup.add(roof);

    group.add(bridgeGroup);
  }

  // =========================================================================
  // ASSET BUILDERS: VEHICLES, FERRIES, COMMUTERS & TREES
  // =========================================================================

  private buildSwayingStreetTree(
    parent: THREE.Group,
    tx: number,
    tz: number,
    director: ModernMetroEventDirector,
    rng: SeededRandom
  ): void {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(tx, 0, tz);

    // Tree trunk
    const trunk = new THREE.Mesh(this.getCylinder(0.18, 0.24, 3.5, 6), this.teakWoodMat);
    trunk.position.y = 1.75;
    treeGroup.add(trunk);

    // Lush rounded foliage canopy
    const foliage = new THREE.Mesh(this.getSphere(1.6, 8, 8), this.lushFoliageMat);
    foliage.position.y = 4.2;
    treeGroup.add(foliage);

    director.registerSwayingTree({
      group: treeGroup,
      foliage,
      phaseOffset: rng.range(0, Math.PI * 2),
      swaySpeed: rng.range(1.2, 1.8),
      maxAngle: 0.08
    });

    parent.add(treeGroup);
  }

  private buildWalkingCommuter(
    parent: THREE.Group,
    cx: number,
    cz: number,
    director: ModernMetroEventDirector,
    rng: SeededRandom
  ): void {
    const commuter = this.createCommuterFigure();
    commuter.position.set(cx, 0.4, cz);

    let legL: THREE.Mesh | null = null;
    let legR: THREE.Mesh | null = null;
    let armL: THREE.Mesh | null = null;
    let armR: THREE.Mesh | null = null;
    let torso: THREE.Mesh | null = null;

    commuter.traverse((child) => {
      if (child.name === 'commuter_leg_l') legL = child as THREE.Mesh;
      if (child.name === 'commuter_leg_r') legR = child as THREE.Mesh;
      if (child.name === 'commuter_arm_l') armL = child as THREE.Mesh;
      if (child.name === 'commuter_arm_r') armR = child as THREE.Mesh;
      if (child.name === 'commuter_torso') torso = child as THREE.Mesh;
    });

    if (legL && legR && armL && armR && torso) {
      director.registerWalkingCommuter({
        group: commuter,
        torso,
        legL,
        legR,
        armL,
        armR,
        walkSpeed: rng.range(1.4, 2.2),
        strideFreq: rng.range(3.5, 5.0),
        phaseOffset: rng.range(0, Math.PI * 2),
        walkAxis: 'Z',
        minCoord: cz - 15.0,
        maxCoord: cz + 15.0
      });
    }

    parent.add(commuter);
  }

  private createCommuterFigure(): THREE.Group {
    const fig = new THREE.Group();
    fig.name = 'walking_commuter';

    // Torso in business suit
    const torso = new THREE.Mesh(this.getBox(0.45, 0.65, 0.28), this.structuralSteelMat);
    torso.name = 'commuter_torso';
    torso.position.y = 0.95;
    fig.add(torso);

    // Head
    const head = new THREE.Mesh(this.getSphere(0.18, 6, 6), this.concreteWhiteMat);
    head.position.y = 1.45;
    fig.add(head);

    // Left & Right Legs
    const legL = new THREE.Mesh(this.getBox(0.16, 0.65, 0.16), this.structuralSteelMat);
    legL.name = 'commuter_leg_l';
    legL.position.set(-0.12, 0.325, 0);
    fig.add(legL);

    const legR = new THREE.Mesh(this.getBox(0.16, 0.65, 0.16), this.structuralSteelMat);
    legR.name = 'commuter_leg_r';
    legR.position.set(0.12, 0.325, 0);
    fig.add(legR);

    // Left & Right Arms
    const armL = new THREE.Mesh(this.getBox(0.12, 0.55, 0.12), this.structuralSteelMat);
    armL.name = 'commuter_arm_l';
    armL.position.set(-0.3, 0.95, 0);
    fig.add(armL);

    const armR = new THREE.Mesh(this.getBox(0.12, 0.55, 0.12), this.structuralSteelMat);
    armR.name = 'commuter_arm_r';
    armR.position.set(0.3, 0.95, 0);
    fig.add(armR);

    // Commuter Briefcase
    const briefcase = new THREE.Mesh(this.getBox(0.08, 0.22, 0.28), this.teakWoodMat);
    briefcase.position.set(0.38, 0.68, 0);
    fig.add(briefcase);

    return fig;
  }

  private createCommuterExpressTrain(trainX: number): THREE.Group {
    const trainGroup = new THREE.Group();
    trainGroup.name = 'grand_interchange_train';
    trainGroup.position.set(trainX, 1.2, 0);

    const trainLen = 32.0;
    const trainW = 3.2;
    const trainH = 3.8;

    // Aerodynamic Commuter Train Body
    const body = new THREE.Mesh(this.getBox(trainW, trainH, trainLen), this.concreteWhiteMat);
    body.position.y = trainH * 0.5;
    trainGroup.add(body);

    // Continuous Dark Glass Window Ribbon
    const win = new THREE.Mesh(this.getBox(trainW + 0.1, 1.1, trainLen * 0.88), this.facadeGlassMat);
    win.position.y = trainH * 0.62;
    trainGroup.add(win);

    // Dual High-Intensity Headlights
    [-0.9, 0.9].forEach((hx) => {
      const hl = new THREE.Mesh(this.getSphere(0.2, 8, 8), this.amberBeaconMat);
      hl.name = 'train_headlight';
      hl.position.set(hx, 1.2, -trainLen * 0.5 - 0.1);
      trainGroup.add(hl);
    });

    // Dual Rear Red Brake Lights
    [-0.9, 0.9].forEach((bx) => {
      const bl = new THREE.Mesh(this.getSphere(0.2, 8, 8), this.redSignalMat);
      bl.name = 'train_brake_light';
      bl.position.set(bx, 1.2, trainLen * 0.5 + 0.1);
      bl.visible = false;
      trainGroup.add(bl);
    });

    // Sliding Pocket Doors
    [-8.0, 8.0].forEach((dz) => {
      const doorL = new THREE.Mesh(this.getBox(0.12, 2.2, 0.7), this.structuralSteelMat);
      doorL.name = 'train_door_left';
      doorL.position.set(-trainW * 0.5 - 0.05, 1.2, dz - 0.38);
      trainGroup.add(doorL);

      const doorR = new THREE.Mesh(this.getBox(0.12, 2.2, 0.7), this.structuralSteelMat);
      doorR.name = 'train_door_right';
      doorR.position.set(-trainW * 0.5 - 0.05, 1.2, dz + 0.38);
      trainGroup.add(doorR);
    });

    return trainGroup;
  }

  private createPassengerFerry(): THREE.Group {
    const ferry = new THREE.Group();
    ferry.name = 'modern_passenger_ferry';

    const ferryL = 22.0;
    const ferryW = 6.8;
    const ferryH = 3.2;

    // Catamaran twin hull
    const hull = new THREE.Mesh(this.getBox(ferryW, ferryH, ferryL), this.ferryHullMat);
    hull.position.y = ferryH * 0.5;
    ferry.add(hull);

    // Tinted passenger cabin
    const cabin = new THREE.Mesh(this.getBox(ferryW * 0.82, 1.8, ferryL * 0.7), this.facadeGlassMat);
    cabin.position.y = ferryH + 0.9;
    ferry.add(cabin);

    // Twin water spray wake plumes
    [-ferryW * 0.4, ferryW * 0.4].forEach((sx) => {
      const spray = new THREE.Mesh(this.getCylinder(0.1, 0.8, 4.0, 8), this.concreteWhiteMat);
      spray.name = 'ferry_spray';
      spray.rotation.x = Math.PI / 2;
      spray.position.set(sx, 0.2, ferryL * 0.5 + 2.0);
      ferry.add(spray);
    });

    return ferry;
  }

  private buildModernRiverFerry(
    parent: THREE.Group,
    fx: number,
    fz: number,
    director: ModernMetroEventDirector,
    rng: SeededRandom
  ): void {
    const ferry = this.createPassengerFerry();
    ferry.position.set(fx, -1.2, fz);
    parent.add(ferry);
  }

  private createRoadVehicle(isBus: boolean): THREE.Group {
    const veh = new THREE.Group();
    veh.name = isBus ? 'city_bus' : 'commuter_car';

    const vL = isBus ? 11.0 : 4.5;
    const vW = isBus ? 2.8 : 1.9;
    const vH = isBus ? 3.0 : 1.5;

    const bodyMat = isBus ? this.awningCrimsonMat : this.concreteWhiteMat;
    const body = new THREE.Mesh(this.getBox(vW, vH, vL), bodyMat);
    body.position.y = vH * 0.5;
    veh.add(body);

    // Windshield & windows
    const win = new THREE.Mesh(this.getBox(vW + 0.08, vH * 0.45, vL * 0.85), this.facadeGlassMat);
    win.position.y = vH * 0.65;
    veh.add(win);

    // Headlights & Taillights
    [-vW * 0.35, vW * 0.35].forEach((hx) => {
      const hl = new THREE.Mesh(this.getSphere(0.12, 6, 6), this.amberBeaconMat);
      hl.position.set(hx, 0.6, -vL * 0.5 - 0.05);
      veh.add(hl);

      const tl = new THREE.Mesh(this.getSphere(0.12, 6, 6), this.redSignalMat);
      tl.position.set(hx, 0.6, vL * 0.5 + 0.05);
      veh.add(tl);
    });

    return veh;
  }
}
