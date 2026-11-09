import * as THREE from 'three';
import { CONSTANTS } from '../../../core/Constants';
import { SeededRandom } from '../../SceneryFactory';
import { CurvedShaderManager } from '../../../scene/CurvedShader';
import { TextureGenerator } from '../../../scene/TextureGenerator';
import {
  NEON_INDUSTRIAL_PALETTE,
  NEON_INDUSTRIAL_DISTRICTS,
  NeonIndustrialDistrictId,
  CraneBalletHeroActor,
  FactoryAwakeningHeroActor,
  TraversingCraneActor,
  WeldingRobotActor,
  StampingPressActor,
  ForkliftActor,
  ConveyorBeltActor,
  SteamChimneyActor,
  DieselSwitcherActor
} from './NeonIndustrialTheme';
import { NeonIndustrialEventDirector } from './NeonIndustrialEventDirector';

/**
 * Neon Industrial: The Mechanical Logistics City — World Builder
 * Constructs 6 distinct industrial environment families:
 *   0: Container-Freight Terminal (RMG Cranes, ISO Container Stacks, Hero Event A: Crane Ballet)
 *   1: Heavy Engineering Factory (Open-Bay Sheds, Stamping Presses, Robotic Welders with Sparks)
 *   2: Railway Repair Depot (Inspection Tracks, Mechanical Screw Jacks, Idling Switchers)
 *   3: Oil & Refinery Infrastructure Zone (Horton Spheres, Cracking Towers, Elevated Pipe Bridges)
 *   4: Automated Industrial Port (Motorized Cargo Conveyors, Bulk Silos, AGVs)
 *   5: Large Freight-Sorting Yard (Hump Yard Classification, Dispatch Tower, Hero Event B: Factory Awakening)
 *
 * Invariant Guarantees:
 *   - Playable runner corridor |X| <= 4.2m, Y in [0.1m, 8.5m] is strictly 100% free of intrusions.
 *   - Overhead gantry and truss clearances: girder Y >= 9.8m, luminaires Y >= 9.20m.
 *   - Foundations extend continuously down to Y = -5.85m (zero floating geometry).
 *   - Non-monolithic boundaries: open freight yards, loading docks, sidings and pipe crossings.
 */
export class NeonIndustrialWorldBuilder {
  private static instance: NeonIndustrialWorldBuilder;

  // Geometry cache for draw call and memory minimization
  private boxGeos: Map<string, THREE.BoxGeometry> = new Map();
  private cylGeos: Map<string, THREE.CylinderGeometry> = new Map();
  private sphereGeos: Map<string, THREE.SphereGeometry> = new Map();

  // Thematic Shared Materials with Curved World Vertex Shaders
  private steelMat: THREE.MeshStandardMaterial;
  private castIronMat: THREE.MeshStandardMaterial;
  private rustPrimerMat: THREE.MeshStandardMaterial;
  private galvanizedMat: THREE.MeshStandardMaterial;
  private corrugatedSheetMat: THREE.MeshStandardMaterial;
  private concretePlinthMat: THREE.MeshStandardMaterial;
  private hazardStripeMat: THREE.MeshBasicMaterial;
  private safetyYellowMat: THREE.MeshBasicMaterial;
  private sodiumLampMat: THREE.MeshBasicMaterial;
  private sodiumLampWarmMat: THREE.MeshBasicMaterial;
  private warningRedMat: THREE.MeshBasicMaterial;
  private clearanceGreenMat: THREE.MeshBasicMaterial;
  private pipeRustMat: THREE.MeshStandardMaterial;
  private pipeGasSilverMat: THREE.MeshStandardMaterial;
  private hortonSphereMat: THREE.MeshStandardMaterial;
  private diamondPlateMat: THREE.MeshStandardMaterial;
  private glassTintedMat: THREE.MeshStandardMaterial;
  private flareFlameMat: THREE.MeshBasicMaterial;
  private curbMat: THREE.MeshStandardMaterial;

  // Shipping Container Colored Materials
  private containerBlueMat: THREE.MeshStandardMaterial;
  private containerRedMat: THREE.MeshStandardMaterial;
  private containerGreenMat: THREE.MeshStandardMaterial;
  private containerOrangeMat: THREE.MeshStandardMaterial;
  private containerYellowMat: THREE.MeshStandardMaterial;
  private containerWhiteMat: THREE.MeshStandardMaterial;

  private constructor() {
    const curved = CurvedShaderManager.getInstance();

    // 1. Structural Steel & Iron
    this.steelMat = new THREE.MeshStandardMaterial({
      color: NEON_INDUSTRIAL_PALETTE.industrialSteel,
      roughness: 0.55,
      metalness: 0.70
    });
    curved.applyCurvature(this.steelMat);

    this.castIronMat = new THREE.MeshStandardMaterial({
      color: NEON_INDUSTRIAL_PALETTE.castIron,
      roughness: 0.75,
      metalness: 0.85
    });
    curved.applyCurvature(this.castIronMat);

    this.rustPrimerMat = new THREE.MeshStandardMaterial({
      color: NEON_INDUSTRIAL_PALETTE.rustPrimer,
      roughness: 0.65,
      metalness: 0.40
    });
    curved.applyCurvature(this.rustPrimerMat);

    this.galvanizedMat = new THREE.MeshStandardMaterial({
      color: NEON_INDUSTRIAL_PALETTE.galvanizedTruss,
      roughness: 0.50,
      metalness: 0.60
    });
    curved.applyCurvature(this.galvanizedMat);

    this.corrugatedSheetMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getIndustrialCorrugatedSheetTexture(),
      roughness: 0.70,
      metalness: 0.45
    });
    curved.applyCurvature(this.corrugatedSheetMat);

    // 2. Concrete Foundations & Ballast Plinths
    this.concretePlinthMat = new THREE.MeshStandardMaterial({
      color: NEON_INDUSTRIAL_PALETTE.concreteFoundation,
      roughness: 0.85,
      metalness: 0.15
    });
    curved.applyCurvature(this.concretePlinthMat);

    this.curbMat = new THREE.MeshStandardMaterial({
      color: 0x4b5563,
      roughness: 0.80,
      metalness: 0.20
    });
    curved.applyCurvature(this.curbMat);

    // 3. Safety & Warning Indicators
    this.hazardStripeMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getIndustrialWarningChevronTexture()
    });
    curved.applyCurvature(this.hazardStripeMat);

    this.safetyYellowMat = new THREE.MeshBasicMaterial({
      color: NEON_INDUSTRIAL_PALETTE.safetyYellow
    });
    curved.applyCurvature(this.safetyYellowMat);

    this.warningRedMat = new THREE.MeshBasicMaterial({
      color: NEON_INDUSTRIAL_PALETTE.warningRed
    });
    curved.applyCurvature(this.warningRedMat);

    this.clearanceGreenMat = new THREE.MeshBasicMaterial({
      color: NEON_INDUSTRIAL_PALETTE.clearanceGreen
    });
    curved.applyCurvature(this.clearanceGreenMat);

    // 4. Illumination & Process Glow
    this.sodiumLampMat = new THREE.MeshBasicMaterial({
      color: NEON_INDUSTRIAL_PALETTE.sodiumLamp
    });
    curved.applyCurvature(this.sodiumLampMat);

    this.sodiumLampWarmMat = new THREE.MeshBasicMaterial({
      color: NEON_INDUSTRIAL_PALETTE.sodiumLampWarm
    });
    curved.applyCurvature(this.sodiumLampWarmMat);

    this.flareFlameMat = new THREE.MeshBasicMaterial({
      color: NEON_INDUSTRIAL_PALETTE.flareFlameAmber
    });
    curved.applyCurvature(this.flareFlameMat);

    // 5. Piping & Vessels
    this.pipeRustMat = new THREE.MeshStandardMaterial({
      color: NEON_INDUSTRIAL_PALETTE.pipeRust,
      roughness: 0.60,
      metalness: 0.50
    });
    curved.applyCurvature(this.pipeRustMat);

    this.pipeGasSilverMat = new THREE.MeshStandardMaterial({
      color: NEON_INDUSTRIAL_PALETTE.pipeGasSilver,
      roughness: 0.40,
      metalness: 0.75
    });
    curved.applyCurvature(this.pipeGasSilverMat);

    this.hortonSphereMat = new THREE.MeshStandardMaterial({
      color: NEON_INDUSTRIAL_PALETTE.hortonSphereSilver,
      roughness: 0.35,
      metalness: 0.65
    });
    curved.applyCurvature(this.hortonSphereMat);

    this.diamondPlateMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getDiamondPlateTexture(),
      roughness: 0.55,
      metalness: 0.65
    });
    curved.applyCurvature(this.diamondPlateMat);

    this.glassTintedMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.20,
      metalness: 0.85,
      transparent: true,
      opacity: 0.75
    });
    curved.applyCurvature(this.glassTintedMat);

    // 6. ISO Shipping Container Color Schemes
    this.containerBlueMat = new THREE.MeshStandardMaterial({
      color: NEON_INDUSTRIAL_PALETTE.containerMaritimeBlue,
      roughness: 0.65,
      metalness: 0.35
    });
    curved.applyCurvature(this.containerBlueMat);

    this.containerRedMat = new THREE.MeshStandardMaterial({
      color: NEON_INDUSTRIAL_PALETTE.containerCargoCrimson,
      roughness: 0.65,
      metalness: 0.35
    });
    curved.applyCurvature(this.containerRedMat);

    this.containerGreenMat = new THREE.MeshStandardMaterial({
      color: NEON_INDUSTRIAL_PALETTE.containerFreightGreen,
      roughness: 0.65,
      metalness: 0.35
    });
    curved.applyCurvature(this.containerGreenMat);

    this.containerOrangeMat = new THREE.MeshStandardMaterial({
      color: NEON_INDUSTRIAL_PALETTE.containerIntermodalOrange,
      roughness: 0.65,
      metalness: 0.35
    });
    curved.applyCurvature(this.containerOrangeMat);

    this.containerYellowMat = new THREE.MeshStandardMaterial({
      color: NEON_INDUSTRIAL_PALETTE.containerHighCubeYellow,
      roughness: 0.65,
      metalness: 0.35
    });
    curved.applyCurvature(this.containerYellowMat);

    this.containerWhiteMat = new THREE.MeshStandardMaterial({
      color: NEON_INDUSTRIAL_PALETTE.containerLogisticsWhite,
      roughness: 0.60,
      metalness: 0.25
    });
    curved.applyCurvature(this.containerWhiteMat);
  }

  public static getInstance(): NeonIndustrialWorldBuilder {
    if (!NeonIndustrialWorldBuilder.instance) {
      NeonIndustrialWorldBuilder.instance = new NeonIndustrialWorldBuilder();
    }
    return NeonIndustrialWorldBuilder.instance;
  }

  // --- Geometry Cache Helpers ---

  public getBox(w: number, h: number, d: number): THREE.BoxGeometry {
    const key = `${w.toFixed(2)}_${h.toFixed(2)}_${d.toFixed(2)}`;
    let geo = this.boxGeos.get(key);
    if (!geo) {
      geo = new THREE.BoxGeometry(w, h, d);
      geo.userData.isShared = true;
      this.boxGeos.set(key, geo);
    }
    return geo;
  }

  public getCyl(rt: number, rb: number, h: number, seg: number = 8): THREE.CylinderGeometry {
    const key = `${rt.toFixed(2)}_${rb.toFixed(2)}_${h.toFixed(2)}_${seg}`;
    let geo = this.cylGeos.get(key);
    if (!geo) {
      geo = new THREE.CylinderGeometry(rt, rb, h, seg);
      geo.userData.isShared = true;
      this.cylGeos.set(key, geo);
    }
    return geo;
  }

  public getSphere(r: number, segW: number = 12, segH: number = 10): THREE.SphereGeometry {
    const key = `${r.toFixed(2)}_${segW}_${segH}`;
    let geo = this.sphereGeos.get(key);
    if (!geo) {
      geo = new THREE.SphereGeometry(r, segW, segH);
      geo.userData.isShared = true;
      this.sphereGeos.set(key, geo);
    }
    return geo;
  }

  // =========================================================================
  // MAIN DISTRICT SCENERY BUILDER
  // =========================================================================

  public buildDistrictScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZ: number = 0
  ): void {
    const rng = new SeededRandom(seed);
    const director = NeonIndustrialEventDirector.getInstance();

    const industrialGroup = new THREE.Group();
    industrialGroup.name = 'neon_industrial_scenery';

    // 1. District Family Calculation
    const chunkIdx = Math.floor(Math.abs(worldZ) / chunkLength);
    const districtIdx = chunkIdx % 6;

    // 2. Playable Corridor & Foundation Invariants
    // Runner corridor: |X| <= 4.2m. Setbacks: |X| >= 6.2m. Foundations down to Y = -5.85m.
    const curbX = roadbedWidth * 0.5 + curbWidth * 0.5;
    const foundationDepth = 5.85;

    // Build grounded side plinths with foundation drop
    const plinthThick = 0.8;
    const plinthHeight = 1.2;
    const totalPlinthH = plinthHeight + foundationDepth;
    const plinthCenterY = (plinthHeight - foundationDepth) * 0.5;
    const plinthGeo = this.getBox(plinthThick, totalPlinthH, chunkLength);

    [-1, 1].forEach((side) => {
      const plinth = new THREE.Mesh(plinthGeo, this.concretePlinthMat);
      plinth.position.set(side * (curbX + 0.5), plinthCenterY, -chunkLength * 0.5);
      plinth.receiveShadow = true;
      industrialGroup.add(plinth);

      // Hazard stripe safety coping cap
      const capGeo = this.getBox(plinthThick + 0.15, 0.2, chunkLength);
      const cap = new THREE.Mesh(capGeo, this.hazardStripeMat);
      cap.position.set(side * (curbX + 0.5), plinthHeight + 0.1, -chunkLength * 0.5);
      industrialGroup.add(cap);
    });

    // 3. Overhead Heavy Industrial Gantries (Guaranteed Girder Y >= 9.8m, Lamps Y >= 9.20m)
    this.buildLatticeGantries(industrialGroup, chunkLength, detail);

    // 4. District-Specific Architectural Scenery
    switch (districtIdx) {
      case 0:
        this.buildContainerTerminalDistrict(industrialGroup, chunkLength, rng, detail, worldZ, director);
        break;
      case 1:
        this.buildHeavyEngineeringDistrict(industrialGroup, chunkLength, rng, detail, worldZ, director);
        break;
      case 2:
        this.buildRailwayRepairDepotDistrict(industrialGroup, chunkLength, rng, detail, worldZ, director);
        break;
      case 3:
        this.buildRefineryInfrastructureDistrict(industrialGroup, chunkLength, rng, detail, worldZ, director);
        break;
      case 4:
        this.buildAutomatedPortDistrict(industrialGroup, chunkLength, rng, detail, worldZ, director);
        break;
      case 5:
        this.buildFreightSortingYardDistrict(industrialGroup, chunkLength, rng, detail, worldZ, director);
        break;
    }

    group.add(industrialGroup);
  }

  // =========================================================================
  // OVERHEAD HEAVY INDUSTRIAL GANTRIES
  // =========================================================================

  private buildLatticeGantries(
    parent: THREE.Group,
    chunkLength: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    // Gantries spaced every 40m along the chunk
    const gantryPositions = [-20.0, -60.0];
    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 4.2; // 15.0m span
    const poleHeight = 10.4; // Girder bottom at Y = 9.9m, top at Y = 10.4m

    for (const gz of gantryPositions) {
      const gantry = new THREE.Group();
      gantry.position.set(0, 0, gz);

      // Vertical Columns with foundation legs down to Y = -5.85m
      const totalColH = poleHeight + 5.85;
      const colCenterY = (poleHeight - 5.85) * 0.5;
      const colGeo = this.getBox(0.55, totalColH, 0.55);

      [-spanWidth * 0.5, spanWidth * 0.5].forEach((cx) => {
        const col = new THREE.Mesh(colGeo, this.steelMat);
        col.position.set(cx, colCenterY, 0);
        gantry.add(col);

        // Yellow column base collision guard
        const guard = new THREE.Mesh(this.getBox(0.85, 1.4, 0.85), this.safetyYellowMat);
        guard.position.set(cx, 0.7, 0);
        gantry.add(guard);
      });

      // Main Crossbeam / Girder (bottom at Y = 9.9m, Y center = 10.15m)
      const girder = new THREE.Mesh(this.getBox(spanWidth + 1.2, 0.5, 0.6), this.steelMat);
      girder.position.set(0, poleHeight - 0.25, 0);
      gantry.add(girder);

      // Top secondary truss rail
      const topRail = new THREE.Mesh(this.getBox(spanWidth + 0.8, 0.25, 0.25), this.galvanizedMat);
      topRail.position.set(0, poleHeight + 0.15, 0);
      gantry.add(topRail);

      // Sodium floodlight fixtures elevated at Y = 9.45m
      CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
        const lamp = new THREE.Mesh(this.getBox(0.35, 0.3, 0.35), this.sodiumLampMat);
        lamp.position.set(laneX, poleHeight - 0.70, 0.2);
        gantry.add(lamp);

        if (detail === 'FULL') {
          // Luminaire bracket
          const bracket = new THREE.Mesh(this.getCyl(0.04, 0.04, 0.45, 6), this.steelMat);
          bracket.position.set(laneX, poleHeight - 0.48, 0.1);
          gantry.add(bracket);
        }
      });

      // Warning red clearance obstruction beacons at outer gantry horns
      [-spanWidth * 0.5 - 0.2, spanWidth * 0.5 + 0.2].forEach((bx) => {
        const beacon = new THREE.Mesh(this.getBox(0.2, 0.3, 0.2), this.warningRedMat);
        beacon.position.set(bx, poleHeight + 0.35, 0);
        gantry.add(beacon);
      });

      parent.add(gantry);
    }
  }

  // =========================================================================
  // DISTRICT 0: CONTAINER-FREIGHT TERMINAL & HERO EVENT A (CRANE BALLET)
  // =========================================================================

  private buildContainerTerminalDistrict(
    parent: THREE.Group,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZ: number,
    director: NeonIndustrialEventDirector
  ): void {
    // Container Stacks on Left & Right Sides (Outside |X| >= 8.5m)
    const containerColors = [
      this.containerBlueMat,
      this.containerRedMat,
      this.containerGreenMat,
      this.containerOrangeMat,
      this.containerYellowMat,
      this.containerWhiteMat
    ];

    [-1, 1].forEach((side) => {
      const baseX = side * 11.5;
      const stackRows = 3;

      for (let r = 0; r < stackRows; r++) {
        const sz = -r * 24.0 - 12.0;
        const tiers = rng.int(2, 3);

        for (let t = 0; t < tiers; t++) {
          const mat = containerColors[(r + t + (side > 0 ? 2 : 0)) % containerColors.length];
          const is40ft = (r % 2 === 0);
          const cLen = is40ft ? 12.2 : 6.1;
          const cWidth = 2.44;
          const cHeight = 2.6;

          const container = this.buildContainerMesh(cWidth, cHeight, cLen, mat, detail);
          container.position.set(baseX + (side * (t % 2) * 1.5), t * (cHeight + 0.05) + cHeight * 0.5, sz);
          parent.add(container);
        }
      }
    });

    // Concrete loading ramp with foundation
    const rampGroup = new THREE.Group();
    const rampPlinth = new THREE.Mesh(this.getBox(4.5, 1.2 + 5.85, 30.0), this.concretePlinthMat);
    rampPlinth.position.set(-16.5, (1.2 - 5.85) * 0.5, -40.0);
    rampGroup.add(rampPlinth);
    parent.add(rampGroup);

    // Forklift delivering palletized cargo (Ambient Actor)
    if (detail !== 'MINIMAL') {
      const forkliftActor = this.buildForkliftActor(-16.0, -15.0, -65.0);
      parent.add(forkliftActor.group);
      director.registerForklift(forkliftActor);
    }

    // Hero Event A: Crane Ballet (Spawned in District 0)
    const craneBallet = this.buildCraneBalletHeroActor(worldZ);
    parent.add(craneBallet.group);
    director.registerCraneBallet(craneBallet);
  }

  private buildContainerMesh(
    w: number,
    h: number,
    d: number,
    mat: THREE.MeshStandardMaterial,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): THREE.Group {
    const group = new THREE.Group();

    // Main corrugated body
    const body = new THREE.Mesh(this.getBox(w, h, d), mat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Corner casting structural pillars (pruned in MINIMAL for draw-call scalability)
    if (detail !== 'MINIMAL') {
      const cornerW = 0.22;
      const cornerGeo = this.getBox(cornerW, h + 0.04, cornerW);
      [
        [-w * 0.5 + cornerW * 0.5, -d * 0.5 + cornerW * 0.5],
        [w * 0.5 - cornerW * 0.5, -d * 0.5 + cornerW * 0.5],
        [-w * 0.5 + cornerW * 0.5, d * 0.5 - cornerW * 0.5],
        [w * 0.5 - cornerW * 0.5, d * 0.5 - cornerW * 0.5]
      ].forEach(([cx, cz]) => {
        const corner = new THREE.Mesh(cornerGeo, this.castIronMat);
        corner.position.set(cx, 0, cz);
        group.add(corner);
      });
    }

    if (detail === 'FULL') {
      // Rear door frame & locking rods
      const rodGeo = this.getCyl(0.03, 0.03, h * 0.85, 6);
      [-0.4, 0.4].forEach((rx) => {
        const rod = new THREE.Mesh(rodGeo, this.galvanizedMat);
        rod.position.set(rx, 0, d * 0.5 + 0.05);
        group.add(rod);
      });
    }

    return group;
  }

  private buildCraneBalletHeroActor(worldZ: number): CraneBalletHeroActor {
    const group = new THREE.Group();
    group.name = 'hero_event_a_crane_ballet';

    // Crane 1: Rail-Mounted Gantry Crane spanning Left Side (X = -10m to -20m)
    const crane1 = this.buildGantryCraneHierarchy(-14.0, 14.5, -40.0, this.containerOrangeMat);
    group.add(crane1.gantryFrame);

    // Crane 2: Symmetrical RMG Crane spanning Right Side (X = 10m to 20m)
    const crane2 = this.buildGantryCraneHierarchy(14.0, 14.5, -45.0, this.containerBlueMat);
    group.add(crane2.gantryFrame);

    // Waiting rail flatcar on siding at X = -9.5m
    const railFlatcar = new THREE.Group();
    const flatcarBed = new THREE.Mesh(this.getBox(2.8, 0.6, 14.0), this.castIronMat);
    flatcarBed.position.set(-9.5, 0.4, -40.0);
    railFlatcar.add(flatcarBed);

    // Twistlock guide pins
    const pinGeo = this.getBox(0.2, 0.35, 0.2);
    [
      [-1.1, -6.0], [1.1, -6.0],
      [-1.1, 6.0], [1.1, 6.0]
    ].forEach(([px, pz]) => {
      const pin = new THREE.Mesh(pinGeo, this.safetyYellowMat);
      pin.position.set(-9.5 + px, 0.8, -40.0 + pz);
      railFlatcar.add(pin);
    });
    group.add(railFlatcar);

    return {
      group,
      crane1: {
        gantryFrame: crane1.gantryFrame,
        trolley: crane1.trolley,
        spreader: crane1.spreader,
        cables: crane1.cables,
        container: crane1.container,
        warningStrobes: crane1.warningStrobes
      },
      crane2: {
        gantryFrame: crane2.gantryFrame,
        trolley: crane2.trolley,
        spreader: crane2.spreader,
        cables: crane2.cables,
        container: crane2.container,
        warningStrobes: crane2.warningStrobes
      },
      railFlatcar,
      triggerZ: worldZ - 40.0,
      state: 'DORMANT',
      timer: 0,
      initialContainerY: 1.4,
      targetLiftY: 9.8,
      trolleyStartPos: -15.5,
      trolleyTargetPos: -9.5
    };
  }

  private buildGantryCraneHierarchy(
    centerX: number,
    girderY: number,
    centerZ: number,
    containerMat: THREE.MeshStandardMaterial
  ): {
    gantryFrame: THREE.Group;
    trolley: THREE.Group;
    spreader: THREE.Group;
    cables: THREE.Mesh[];
    container: THREE.Group;
    warningStrobes: THREE.Mesh[];
  } {
    const gantryFrame = new THREE.Group();
    gantryFrame.position.set(0, 0, centerZ);

    const spanWidth = 11.0;
    const legX1 = centerX - spanWidth * 0.5;
    const legX2 = centerX + spanWidth * 0.5;

    // A-frame vertical gantry legs with foundation
    const legGeo = this.getBox(0.7, girderY + 5.85, 0.8);
    const legCenterY = (girderY - 5.85) * 0.5;

    const warningStrobes: THREE.Mesh[] = [];

    [legX1, legX2].forEach((lx) => {
      const leg = new THREE.Mesh(legGeo, this.steelMat);
      leg.position.set(lx, legCenterY, 0);
      gantryFrame.add(leg);

      // Warning amber strobe light on crane leg
      const strobe = new THREE.Mesh(this.getBox(0.35, 0.35, 0.35), this.hazardStripeMat);
      strobe.position.set(lx, 6.0, 0.5);
      gantryFrame.add(strobe);
      warningStrobes.push(strobe);
    });

    // Horizontal gantry girder spanning across the legs
    const girder = new THREE.Mesh(this.getBox(spanWidth + 2.0, 1.2, 1.4), this.steelMat);
    girder.position.set(centerX, girderY, 0);
    gantryFrame.add(girder);

    // Crane Hoist Trolley
    const trolley = new THREE.Group();
    trolley.position.set(centerX, girderY - 0.4, 0);

    const trolleyHousing = new THREE.Mesh(this.getBox(2.2, 0.6, 2.4), this.castIronMat);
    trolley.add(trolleyHousing);

    // Motorized Spreader Frame
    const spreader = new THREE.Group();
    spreader.position.set(0, -4.5, 0);

    const spreaderFrame = new THREE.Mesh(this.getBox(2.6, 0.45, 12.4), this.safetyYellowMat);
    spreader.add(spreaderFrame);

    // 4 Corner twistlocks
    const lockGeo = this.getBox(0.35, 0.4, 0.35);
    [
      [-1.1, -5.9], [1.1, -5.9],
      [-1.1, 5.9], [1.1, 5.9]
    ].forEach(([lx, lz]) => {
      const lock = new THREE.Mesh(lockGeo, this.castIronMat);
      lock.position.set(lx, -0.3, lz);
      spreader.add(lock);
    });

    // 4 Steel Wire Hoist Cables
    const cables: THREE.Mesh[] = [];
    const cableGeo = this.getCyl(0.04, 0.04, 1.0, 6);
    [
      [-1.1, -5.9], [1.1, -5.9],
      [-1.1, 5.9], [1.1, 5.9]
    ].forEach(([cx, cz]) => {
      const cable = new THREE.Mesh(cableGeo, this.galvanizedMat);
      cable.position.set(cx, 0, cz);
      trolley.add(cable);
      cables.push(cable);
    });

    // 40ft Shipping Container (Starts as child of spreader for hierarchical coherence)
    const container = this.buildContainerMesh(2.44, 2.6, 12.2, containerMat, 'FULL');
    container.position.set(0, -1.3, 0);
    spreader.add(container);

    trolley.add(spreader);
    gantryFrame.add(trolley);

    return {
      gantryFrame,
      trolley,
      spreader,
      cables,
      container,
      warningStrobes
    };
  }

  // =========================================================================
  // DISTRICT 1: HEAVY ENGINEERING FACTORY
  // =========================================================================

  private buildHeavyEngineeringDistrict(
    parent: THREE.Group,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZ: number,
    director: NeonIndustrialEventDirector
  ): void {
    [-1, 1].forEach((side) => {
      const shedGroup = new THREE.Group();
      const shedX = side * 13.5;
      shedGroup.position.set(shedX, 0, -chunkLength * 0.5);

      // Open-bay factory shed with steel I-beam pillars
      const shedW = 12.0;
      const shedH = 11.5;
      const shedL = chunkLength * 0.92;

      // Vertical Columns with foundation
      const colGeo = this.getBox(0.6, shedH + 5.85, 0.6);
      const colCenterY = (shedH - 5.85) * 0.5;

      [-shedW * 0.5, shedW * 0.5].forEach((cx) => {
        for (let b = 0; b < 4; b++) {
          const bz = -shedL * 0.5 + b * (shedL / 3);
          const col = new THREE.Mesh(colGeo, this.steelMat);
          col.position.set(cx, colCenterY, bz);
          shedGroup.add(col);
        }
      });

      // Pitched Truss Roof Decking
      const roof = new THREE.Mesh(this.getBox(shedW + 1.0, 0.4, shedL), this.corrugatedSheetMat);
      roof.position.set(0, shedH, 0);
      shedGroup.add(roof);

      // Interior Hydraulic Stamping Press (Ambient Actor)
      const pressGroup = new THREE.Group();
      pressGroup.position.set(0, 0, -12.0);

      const frame = new THREE.Mesh(this.getBox(3.2, 7.5, 3.2), this.castIronMat);
      frame.position.y = 3.75;
      pressGroup.add(frame);

      const ram = new THREE.Mesh(this.getBox(1.8, 2.4, 1.8), this.steelMat);
      ram.position.y = 4.2;
      pressGroup.add(ram);

      const die = new THREE.Mesh(this.getBox(2.2, 0.8, 2.2), this.hazardStripeMat);
      die.position.y = 0.4;
      pressGroup.add(die);

      shedGroup.add(pressGroup);

      const pressActor: StampingPressActor = {
        group: pressGroup,
        ram,
        baseY: 4.2,
        stroke: 2.2,
        cycleSpeed: 4.5,
        phase: side > 0 ? Math.PI : 0
      };
      director.registerStampingPress(pressActor);

      // Articulated Robotic Welding Arm with Spark Emissions (Ambient Actor)
      if (detail !== 'MINIMAL') {
        const welderActor = this.buildWeldingRobotActor(side * 2.2, 0, 12.0);
        shedGroup.add(welderActor.group);
        director.registerWeldingRobot(welderActor);
      }

      // Slag Ladle Car & Steel Coils (Microdetails)
      if (detail === 'FULL') {
        const coilGeo = this.getCyl(1.1, 1.1, 1.6, 12);
        const coil = new THREE.Mesh(coilGeo, this.galvanizedMat);
        coil.rotation.z = Math.PI / 2;
        coil.position.set(side > 0 ? 3.0 : -3.0, 1.1, 22.0);
        shedGroup.add(coil);
      }

      parent.add(shedGroup);
    });
  }

  private buildWeldingRobotActor(x: number, y: number, z: number): WeldingRobotActor {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Heavy concrete pedestal base
    const base = new THREE.Mesh(this.getCyl(0.6, 0.8, 0.8, 8), this.castIronMat);
    base.position.y = 0.4;
    group.add(base);

    // Shoulder Joint
    const shoulderJoint = new THREE.Group();
    shoulderJoint.position.set(0, 0.8, 0);

    const shoulderMesh = new THREE.Mesh(this.getBox(0.6, 0.8, 0.6), this.safetyYellowMat);
    shoulderJoint.add(shoulderMesh);

    // Elbow Joint
    const elbowJoint = new THREE.Group();
    elbowJoint.position.set(0, 0.8, 0);

    const upperArm = new THREE.Mesh(this.getBox(0.35, 1.6, 0.35), this.steelMat);
    upperArm.position.y = 0.8;
    elbowJoint.add(upperArm);

    // Wrist Joint with Welding Torch
    const wristJoint = new THREE.Group();
    wristJoint.position.set(0, 1.6, 0);

    const forearm = new THREE.Mesh(this.getBox(0.28, 1.2, 0.28), this.safetyYellowMat);
    forearm.position.y = 0.6;
    wristJoint.add(forearm);

    const torch = new THREE.Mesh(this.getCyl(0.04, 0.08, 0.4, 6), this.castIronMat);
    torch.position.set(0, 1.2, 0.1);
    wristJoint.add(torch);

    elbowJoint.add(wristJoint);
    shoulderJoint.add(elbowJoint);
    group.add(shoulderJoint);

    // Electric Arc Welding Spark Particles
    const sparkCount = 35;
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities = new Float32Array(sparkCount * 3);

    for (let i = 0; i < sparkCount; i++) {
      const idx = i * 3;
      sparkPositions[idx] = (Math.random() - 0.5) * 0.2;
      sparkPositions[idx + 1] = 0.2;
      sparkPositions[idx + 2] = (Math.random() - 0.5) * 0.2;

      sparkVelocities[idx] = (Math.random() - 0.5) * 4.0;
      sparkVelocities[idx + 1] = Math.random() * 4.5 + 1.0;
      sparkVelocities[idx + 2] = (Math.random() - 0.5) * 4.0;
    }

    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

    const sparkMat = new THREE.PointsMaterial({
      color: NEON_INDUSTRIAL_PALETTE.weldingArcBlue,
      size: 0.22,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });

    const sparks = new THREE.Points(sparkGeo, sparkMat);
    sparks.position.set(0, 0.4, 0.8);
    group.add(sparks);

    return {
      group,
      shoulderJoint,
      elbowJoint,
      wristJoint,
      sparks,
      sparkPositions,
      sparkVelocities,
      phase: Math.random() * Math.PI,
      weldCycleTimer: 0,
      isWelding: true
    };
  }

  // =========================================================================
  // DISTRICT 2: RAILWAY REPAIR DEPOT
  // =========================================================================

  private buildRailwayRepairDepotDistrict(
    parent: THREE.Group,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZ: number,
    director: NeonIndustrialEventDirector
  ): void {
    // Left Side: Inspection shed with screw jacks & locomotive switcher
    const shedGroup = new THREE.Group();
    shedGroup.position.set(-13.5, 0, -chunkLength * 0.5);

    // Foundation plinth with inspection pit recess
    const plinth = new THREE.Mesh(this.getBox(8.0, 1.2 + 5.85, chunkLength * 0.9), this.concretePlinthMat);
    plinth.position.y = (1.2 - 5.85) * 0.5;
    shedGroup.add(plinth);

    // 4 Mechanical Screw Jack lifting pillars
    const jackGeo = this.getBox(0.65, 3.8, 0.65);
    [
      [-2.4, -14.0], [2.4, -14.0],
      [-2.4, 14.0], [2.4, 14.0]
    ].forEach(([jx, jz]) => {
      const jack = new THREE.Mesh(jackGeo, this.safetyYellowMat);
      jack.position.set(jx, 1.9, jz);
      shedGroup.add(jack);
    });

    // Idling Diesel Switcher Locomotive (Ambient Actor)
    const switcherActor = this.buildDieselSwitcherActor(-13.5, -chunkLength * 0.5);
    parent.add(switcherActor.group);
    director.registerDieselSwitcher(switcherActor);

    // Right Side: Wheelset racks & oil drum storage
    const storageGroup = new THREE.Group();
    storageGroup.position.set(12.5, 0, -chunkLength * 0.5);

    // Wheelsets lined up on storage rails
    const wheelCount = 4;
    for (let w = 0; w < wheelCount; w++) {
      const wz = -18.0 + w * 8.0;
      const axle = new THREE.Mesh(this.getCyl(0.08, 0.08, 2.2, 6), this.steelMat);
      axle.rotation.z = Math.PI / 2;
      axle.position.set(0, 0.8, wz);
      storageGroup.add(axle);

      // Pair of flanged wheels
      [-1.0, 1.0].forEach((wx) => {
        const wheel = new THREE.Mesh(this.getCyl(0.8, 0.8, 0.22, 12), this.castIronMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.8, wz);
        storageGroup.add(wheel);
      });
    }

    // Oil drums with hazard labels
    if (detail !== 'MINIMAL') {
      const drumGeo = this.getCyl(0.42, 0.42, 1.1, 8);
      for (let d = 0; d < 5; d++) {
        const drum = new THREE.Mesh(drumGeo, (d % 2 === 0) ? this.pipeRustMat : this.steelMat);
        drum.position.set(2.4 + (d % 2) * 0.9, 0.55, -8.0 + d * 1.2);
        storageGroup.add(drum);
      }
    }

    parent.add(shedGroup);
    parent.add(storageGroup);
  }

  private buildDieselSwitcherActor(x: number, z: number): DieselSwitcherActor {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Switcher Hood & Cab
    const chassis = new THREE.Mesh(this.getBox(3.0, 0.8, 14.0), this.castIronMat);
    chassis.position.y = 0.8;
    group.add(chassis);

    // Engine hood with radiator grilles
    const hood = new THREE.Mesh(this.getBox(2.6, 2.6, 8.5), this.steelMat);
    hood.position.set(0, 2.3, -1.5);
    group.add(hood);

    // Elevated engineer cab
    const cab = new THREE.Mesh(this.getBox(2.8, 3.4, 4.0), this.safetyYellowMat);
    cab.position.set(0, 2.7, 4.2);
    group.add(cab);

    // Warm glowing cab interior window
    const cabGlow = new THREE.Mesh(this.getBox(2.85, 1.2, 2.2), this.sodiumLampWarmMat);
    cabGlow.position.set(0, 3.4, 4.2);
    group.add(cabGlow);

    // High-output forward headlight
    const headlight = new THREE.Mesh(this.getBox(0.4, 0.4, 0.3), this.sodiumLampMat);
    headlight.position.set(0, 3.2, -5.8);
    group.add(headlight);

    // Exhaust stack with diesel exhaust
    const exhaustStack = new THREE.Mesh(this.getCyl(0.25, 0.3, 1.2, 6), this.rustPrimerMat);
    exhaustStack.position.set(0, 4.0, -3.5);
    group.add(exhaustStack);

    return {
      group,
      cabGlow,
      headlight,
      exhaustStack,
      side: -1,
      speed: 1.5,
      baseZ: z,
      travelDistance: 12.0,
      currentOffsetZ: 0,
      dir: 1
    };
  }

  // =========================================================================
  // DISTRICT 3: OIL & REFINERY INFRASTRUCTURE ZONE
  // =========================================================================

  private buildRefineryInfrastructureDistrict(
    parent: THREE.Group,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZ: number,
    director: NeonIndustrialEventDirector
  ): void {
    // Left Side: Pressurized Spherical Horton Gas Sphere ($R = 5.0m$)
    const hortonGroup = new THREE.Group();
    hortonGroup.position.set(-14.5, 0, -chunkLength * 0.5);

    const sphereRadius = 5.0;
    const sphereCenterY = 7.5;
    const sphere = new THREE.Mesh(this.getSphere(sphereRadius, 14, 12), this.hortonSphereMat);
    sphere.position.y = sphereCenterY;
    sphere.castShadow = true;
    hortonGroup.add(sphere);

    // 8 Tubular structural legs supporting sphere down to foundation
    const legCount = 8;
    const legGeo = this.getCyl(0.3, 0.3, sphereCenterY + 5.85, 6);
    const legCenterY = (sphereCenterY - 5.85) * 0.5;

    for (let l = 0; l < legCount; l++) {
      const angle = (l / legCount) * Math.PI * 2;
      const lx = Math.cos(angle) * (sphereRadius * 0.85);
      const lz = Math.sin(angle) * (sphereRadius * 0.85);
      const leg = new THREE.Mesh(legGeo, this.steelMat);
      leg.position.set(lx, legCenterY, lz);
      hortonGroup.add(leg);
    }

    // Concrete Plinth with foundation
    const plinth = new THREE.Mesh(this.getBox(12.0, 1.2 + 5.85, 12.0), this.concretePlinthMat);
    plinth.position.y = (1.2 - 5.85) * 0.5;
    hortonGroup.add(plinth);

    parent.add(hortonGroup);

    // Right Side: Distillation Cracking Tower & Tall Gas Flare Stack
    const refineryRight = new THREE.Group();
    refineryRight.position.set(14.5, 0, -chunkLength * 0.5);

    // Fractional Cracking Column ($H = 24.0m, R = 2.0m$)
    const columnH = 24.0;
    const columnR = 2.0;
    const colTotalH = columnH + 5.85;
    const column = new THREE.Mesh(this.getCyl(columnR, columnR, colTotalH, 12), this.galvanizedMat);
    column.position.set(0, (columnH - 5.85) * 0.5, -12.0);
    refineryRight.add(column);

    // Catwalk Rings on Cracking Column
    for (let r = 0; r < 3; r++) {
      const ringY = 6.0 + r * 6.5;
      const ring = new THREE.Mesh(this.getCyl(columnR + 0.6, columnR + 0.6, 0.25, 12), this.castIronMat);
      ring.position.set(0, ringY, -12.0);
      refineryRight.add(ring);
    }

    // Tall Gas Flare Stack with Flickering Amber Flame Tip ($H = 26.0m$)
    const flareH = 26.0;
    const flareDerrick = new THREE.Mesh(this.getCyl(0.4, 0.8, flareH + 5.85, 6), this.steelMat);
    flareDerrick.position.set(5.0, (flareH - 5.85) * 0.5, 12.0);
    refineryRight.add(flareDerrick);

    const flame = new THREE.Mesh(this.getCyl(0.1, 0.6, 2.5, 6), this.flareFlameMat);
    flame.position.set(5.0, flareH + 1.25, 12.0);
    refineryRight.add(flame);

    parent.add(refineryRight);

    // Elevated Pipe Rack Bridge Spanning Over Tracks (Girder Bottom Y >= 10.2m)
    this.buildElevatedPipeBridge(parent, -40.0, detail);
  }

  private buildElevatedPipeBridge(parent: THREE.Group, zPos: number, detail: 'FULL' | 'BALANCED' | 'MINIMAL'): void {
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, 0, zPos);

    const spanW = 20.0;
    const trussH = 1.6;
    const bridgeY = 10.8; // Bottom clearance at Y = 10.0m

    // Main steel truss bridge crossbeam
    const bridgeTruss = new THREE.Mesh(this.getBox(spanW, trussH, 1.8), this.steelMat);
    bridgeTruss.position.set(0, bridgeY, 0);
    bridgeGroup.add(bridgeTruss);

    // Trestle legs with foundation
    const legGeo = this.getBox(0.8, bridgeY + 5.85, 0.8);
    const legCenterY = (bridgeY - 5.85) * 0.5;

    [-spanW * 0.5 + 0.5, spanW * 0.5 - 0.5].forEach((lx) => {
      const leg = new THREE.Mesh(legGeo, this.steelMat);
      leg.position.set(lx, legCenterY, 0);
      bridgeGroup.add(leg);
    });

    // 4 Parallel Multi-Pipe Manifolds
    const pipeCount = 4;
    for (let p = 0; p < pipeCount; p++) {
      const px = -0.6 + p * 0.4;
      const isSteam = p % 2 === 0;
      const mat = isSteam ? this.pipeRustMat : this.pipeGasSilverMat;
      const pipeGeo = this.getCyl(0.14, 0.14, spanW - 1.0, 6);
      const pipe = new THREE.Mesh(pipeGeo, mat);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0, bridgeY + 0.3 + (p % 2) * 0.35, px);
      bridgeGroup.add(pipe);
    }

    parent.add(bridgeGroup);
  }

  // =========================================================================
  // DISTRICT 4: AUTOMATED INDUSTRIAL PORT
  // =========================================================================

  private buildAutomatedPortDistrict(
    parent: THREE.Group,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZ: number,
    director: NeonIndustrialEventDirector
  ): void {
    // Left Side: Continuous Motorized Cargo Conveyor Belt (Ambient Actor)
    const conveyorActor = this.buildConveyorActor(-12.5, 4.5, -chunkLength * 0.5, 45.0);
    parent.add(conveyorActor.group);
    director.registerConveyor(conveyorActor);

    // Right Side: Bulk Storage Silos & Ship-Loading Gantry Boom
    const siloGroup = new THREE.Group();
    siloGroup.position.set(14.0, 0, -chunkLength * 0.5);

    const siloRadius = 3.2;
    const siloHeight = 20.0;
    const siloTotalH = siloHeight + 5.85;

    // Bank of 2 Silos
    [-6.5, 6.5].forEach((sz) => {
      const silo = new THREE.Mesh(this.getCyl(siloRadius, siloRadius, siloTotalH, 12), this.galvanizedMat);
      silo.position.set(0, (siloHeight - 5.85) * 0.5, sz);
      siloGroup.add(silo);

      // Conical roof cap
      const cap = new THREE.Mesh(this.getCyl(0.2, siloRadius + 0.3, 2.5, 12), this.castIronMat);
      cap.position.set(0, siloHeight + 1.25, sz);
      siloGroup.add(cap);
    });

    // Concrete Plinth with foundation
    const plinth = new THREE.Mesh(this.getBox(9.0, 1.2 + 5.85, 26.0), this.concretePlinthMat);
    plinth.position.y = (1.2 - 5.85) * 0.5;
    siloGroup.add(plinth);

    // Ship-loading boom angled towards the background
    const boom = new THREE.Mesh(this.getBox(1.2, 1.2, 18.0), this.steelMat);
    boom.rotation.x = -0.25;
    boom.position.set(2.5, 14.0, -10.0);
    siloGroup.add(boom);

    parent.add(siloGroup);

    // Factory Exhaust Steam Chimney (Ambient Actor)
    if (detail !== 'MINIMAL') {
      const chimneyActor = this.buildSteamChimneyActor(18.0, 0, -chunkLength * 0.5 + 15.0);
      parent.add(chimneyActor.group);
      director.registerSteamChimney(chimneyActor);
    }
  }

  private buildConveyorActor(x: number, y: number, z: number, length: number): ConveyorBeltActor {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Continuous truss support frame
    const truss = new THREE.Mesh(this.getBox(2.2, 0.6, length), this.steelMat);
    group.add(truss);

    // Moving belt surface
    const beltSurface = new THREE.Mesh(this.getBox(1.8, 0.1, length), this.castIronMat);
    beltSurface.position.y = 0.35;
    group.add(beltSurface);

    // Support trestle legs down to foundation
    const legCount = 3;
    const legGeo = this.getBox(0.45, y + 5.85, 0.45);
    const legCenterY = (-y - 5.85) * 0.5;

    for (let l = 0; l < legCount; l++) {
      const lz = -length * 0.5 + l * (length / (legCount - 1));
      const leg = new THREE.Mesh(legGeo, this.steelMat);
      leg.position.set(0, legCenterY, lz);
      group.add(leg);
    }

    // Moving cargo crates on conveyor belt
    const crateCount = 6;
    const crates: THREE.Mesh[] = [];
    const crateGeo = this.getBox(1.1, 0.9, 1.1);

    for (let c = 0; c < crateCount; c++) {
      const crate = new THREE.Mesh(crateGeo, (c % 2 === 0) ? this.rustPrimerMat : this.galvanizedMat);
      crate.position.set(0, 0.85, -length * 0.5 + c * (length / crateCount));
      group.add(crate);
      crates.push(crate);
    }

    return {
      group,
      beltSurface,
      crates,
      speed: 4.5,
      length
    };
  }

  private buildSteamChimneyActor(x: number, y: number, z: number): SteamChimneyActor {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const stackH = 16.0;
    const stack = new THREE.Mesh(this.getCyl(0.8, 1.2, stackH + 5.85, 8), this.rustPrimerMat);
    stack.position.y = (stackH - 5.85) * 0.5;
    group.add(stack);

    // Steam mesh rising above stack
    const steamMat = new THREE.MeshBasicMaterial({
      color: 0xf1f5f9,
      transparent: true,
      opacity: 0.65
    });
    const steamMesh = new THREE.Mesh(this.getSphere(1.2, 8, 8), steamMat);
    steamMesh.position.y = stackH + 0.5;
    group.add(steamMesh);

    return {
      group,
      steamMesh,
      baseY: stackH + 0.5,
      riseSpeed: 1.2,
      maxScale: 3.5,
      cyclePhase: 0
    };
  }

  private buildForkliftActor(x: number, startZ: number, endZ: number): ForkliftActor {
    const group = new THREE.Group();
    group.position.set(x, 0, startZ);

    // Counterbalanced chassis
    const body = new THREE.Mesh(this.getBox(1.8, 1.4, 2.8), this.safetyYellowMat);
    body.position.y = 0.9;
    group.add(body);

    // Overhead protective guard cage
    const cage = new THREE.Mesh(this.getBox(1.6, 1.6, 1.6), this.castIronMat);
    cage.position.set(0, 2.4, -0.2);
    group.add(cage);

    // Vertical mast & forks
    const mast = new THREE.Group();
    mast.position.set(0, 0, 1.5);

    const mastBeams = new THREE.Mesh(this.getBox(1.4, 2.4, 0.2), this.steelMat);
    mastBeams.position.y = 1.4;
    mast.add(mastBeams);

    // Pallet with cargo crate
    const crate = new THREE.Mesh(this.getBox(1.2, 1.0, 1.2), this.rustPrimerMat);
    crate.position.set(0, 0.7, 0.6);
    mast.add(crate);

    group.add(mast);

    return {
      group,
      crate,
      mast,
      startZ: Math.min(startZ, endZ),
      endZ: Math.max(startZ, endZ),
      currentZ: startZ,
      speed: 3.0,
      dir: 1,
      pauseTimer: 0
    };
  }

  // =========================================================================
  // DISTRICT 5: LARGE FREIGHT-SORTING YARD & HERO EVENT B (FACTORY AWAKENING)
  // =========================================================================

  private buildFreightSortingYardDistrict(
    parent: THREE.Group,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZ: number,
    director: NeonIndustrialEventDirector
  ): void {
    // Classification yard tracks outside runner lanes (Decorative ballast & rails)
    const trackX = -13.0;
    const yardTrack = new THREE.Group();
    yardTrack.position.set(trackX, 0, -chunkLength * 0.5);

    const ballast = new THREE.Mesh(this.getBox(4.5, 0.4 + 5.85, chunkLength), this.concretePlinthMat);
    ballast.position.y = (0.4 - 5.85) * 0.5;
    yardTrack.add(ballast);

    // Switch stand with aspect lantern
    const switchStand = new THREE.Mesh(this.getCyl(0.08, 0.08, 1.6, 6), this.steelMat);
    switchStand.position.set(2.4, 0.8, -10.0);
    yardTrack.add(switchStand);

    const lantern = new THREE.Mesh(this.getBox(0.25, 0.25, 0.25), this.clearanceGreenMat);
    lantern.position.set(2.4, 1.7, -10.0);
    yardTrack.add(lantern);

    parent.add(yardTrack);

    // Elevated Railroad Dispatch Control Tower ($H = 24.0m$)
    const towerGroup = new THREE.Group();
    towerGroup.position.set(14.5, 0, -chunkLength * 0.5);

    const towerH = 24.0;
    const towerBody = new THREE.Mesh(this.getBox(7.0, towerH + 5.85, 7.0), this.concretePlinthMat);
    towerBody.position.y = (towerH - 5.85) * 0.5;
    towerGroup.add(towerBody);

    // Observation Cab with 360-degree windows
    const cab = new THREE.Mesh(this.getBox(9.0, 4.0, 9.0), this.glassTintedMat);
    cab.position.y = towerH - 1.0;
    towerGroup.add(cab);

    // Radio antenna mast
    const antenna = new THREE.Mesh(this.getCyl(0.08, 0.2, 6.0, 6), this.galvanizedMat);
    antenna.position.set(0, towerH + 4.0, 0);
    towerGroup.add(antenna);

    parent.add(towerGroup);

    // Hero Event B: Factory Awakening (Spawned in District 5)
    const factoryAwakening = this.buildFactoryAwakeningHeroActor(worldZ);
    parent.add(factoryAwakening.group);
    director.registerFactoryAwakening(factoryAwakening);
  }

  private buildFactoryAwakeningHeroActor(worldZ: number): FactoryAwakeningHeroActor {
    const group = new THREE.Group();
    group.name = 'hero_event_b_factory_awakening';

    // 1. Substation Breakers
    const substationBreakers: THREE.Mesh[] = [];
    const breakerGeo = this.getBox(0.8, 1.8, 0.8);
    for (let b = 0; b < 3; b++) {
      const breaker = new THREE.Mesh(breakerGeo, this.castIronMat);
      breaker.position.set(11.0 + b * 1.5, 0.9, -20.0);
      group.add(breaker);
      substationBreakers.push(breaker);
    }

    // 2. High-Bay Sodium Vapor Floodlights (6 sequential fixtures)
    const floodlights: { mesh: THREE.Mesh; zPos: number; active: boolean }[] = [];
    const floodlightGeo = this.getBox(0.45, 0.35, 0.45);

    for (let f = 0; f < 6; f++) {
      const fz = -10.0 - f * 10.0;
      const mesh = new THREE.Mesh(floodlightGeo, new THREE.MeshBasicMaterial({ color: 0x222222 }));
      mesh.position.set(-11.5, 9.6, fz);
      group.add(mesh);
      floodlights.push({ mesh, zPos: fz, active: false });
    }

    // 3. Steam Safety Valve Puffers
    const steamPuffers: { mesh: THREE.Mesh; initialY: number; initialScale: number }[] = [];
    const puffMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });

    for (let s = 0; s < 3; s++) {
      const sz = -25.0 - s * 15.0;
      const puff = new THREE.Mesh(this.getSphere(0.8, 8, 8), puffMat);
      puff.position.set(-12.5, 8.5, sz);
      puff.visible = false;
      group.add(puff);
      steamPuffers.push({ mesh: puff, initialY: 8.5, initialScale: 1.0 });
    }

    // 4. Stamping Presses
    const stampingPresses: { ram: THREE.Mesh; baseY: number; stroke: number }[] = [];
    for (let p = 0; p < 2; p++) {
      const pz = -30.0 - p * 16.0;
      const ram = new THREE.Mesh(this.getBox(1.6, 2.0, 1.6), this.steelMat);
      ram.position.set(-14.0, 4.0, pz);
      group.add(ram);
      stampingPresses.push({ ram, baseY: 4.0, stroke: 1.8 });
    }

    // 5. Welding Robots
    const weldingRobots: { arm: THREE.Group; sparks: THREE.Points; active: boolean }[] = [];
    for (let r = 0; r < 2; r++) {
      const rz = -22.0 - r * 20.0;
      const robotActor = this.buildWeldingRobotActor(-13.0, 0, rz);
      robotActor.sparks.visible = false;
      group.add(robotActor.group);
      weldingRobots.push({ arm: robotActor.group, sparks: robotActor.sparks, active: false });
    }

    // 6. Parts Conveyor
    const conveyorBelt = new THREE.Mesh(this.getBox(1.6, 0.4, 24.0), this.castIronMat);
    conveyorBelt.position.set(12.5, 3.5, -40.0);
    group.add(conveyorBelt);

    const crates: THREE.Mesh[] = [];
    for (let c = 0; c < 5; c++) {
      const crate = new THREE.Mesh(this.getBox(0.9, 0.8, 0.9), this.rustPrimerMat);
      crate.position.set(12.5, 4.1, -50.0 + c * 4.5);
      group.add(crate);
      crates.push(crate);
    }

    // 7. Heavy Freight Diesel Locomotive on Exterior Siding (X = -13.5m)
    const trainGroup = new THREE.Group();
    trainGroup.position.set(-13.5, 0, -10.0);

    const locoBody = new THREE.Mesh(this.getBox(3.2, 3.4, 18.0), this.steelMat);
    locoBody.position.y = 2.4;
    trainGroup.add(locoBody);

    const headlights: THREE.Mesh[] = [];
    [-0.6, 0.6].forEach((hx) => {
      const headlight = new THREE.Mesh(this.getBox(0.35, 0.35, 0.3), this.sodiumLampMat);
      headlight.position.set(hx, 3.2, -9.1);
      headlight.visible = false;
      trainGroup.add(headlight);
      headlights.push(headlight);
    });

    const exhaustStack = new THREE.Mesh(this.getCyl(0.3, 0.35, 1.4, 6), this.rustPrimerMat);
    exhaustStack.position.set(0, 4.5, -4.0);
    trainGroup.add(exhaustStack);

    group.add(trainGroup);

    return {
      group,
      substationBreakers,
      floodlights,
      steamPuffers,
      stampingPresses,
      weldingRobots,
      conveyor: { belt: conveyorBelt, crates },
      locomotive: {
        trainGroup,
        headlights,
        exhaustStack,
        speed: 12.0,
        currentZ: -10.0
      },
      triggerZ: worldZ - 40.0,
      state: 'DORMANT',
      timer: 0,
      powerLevel: 0
    };
  }
}
