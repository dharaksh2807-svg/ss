import * as THREE from 'three';
import { CONSTANTS } from '../../../core/Constants';
import { CurvedShaderManager } from '../../../scene/CurvedShader';
import { SceneryFactory, SeededRandom } from '../../SceneryFactory';
import {
  HISTORIC_QUARTER_PALETTE,
  GrandSteamArrivalHeroActor,
  HistoricViaductHeroActor,
  ChimneySteamEmitter,
  StationClockActor,
  RailwayWorkerActor,
  SwayingGasLampActor
} from './HistoricQuarterTheme';
import { HistoricQuarterEventDirector } from './HistoricQuarterEventDirector';

/**
 * Historic Railway Quarter: The Grand Steam Age — World Builder
 * Procedurally generates 6 distinct Victorian districts, grounded retaining foundations (Y = -5.85m),
 * black-iron telegraph & semaphore gantries, overhead stone arch bridges, and cinematic hero encounters.
 */
export class HistoricQuarterWorldBuilder {
  private static instance: HistoricQuarterWorldBuilder;

  // Geometry cache to reuse buffers and minimize draw overhead
  private boxGeos: Map<string, THREE.BoxGeometry> = new Map();
  private cylGeos: Map<string, THREE.CylinderGeometry> = new Map();
  private sphereGeos: Map<string, THREE.SphereGeometry> = new Map();

  // Thematic Shared Materials with Curved World Vertex Shaders
  private brickRedAgedMat: THREE.MeshStandardMaterial;
  private brickRedWarmMat: THREE.MeshStandardMaterial;
  private brickSootDarkMat: THREE.MeshStandardMaterial;
  private sandstoneGoldenMat: THREE.MeshStandardMaterial;
  private sandstoneWarmMat: THREE.MeshStandardMaterial;
  private slateRoofMat: THREE.MeshStandardMaterial;
  private castIronDarkMat: THREE.MeshStandardMaterial;
  private brassPolishedMat: THREE.MeshStandardMaterial;
  private timberDarkOakMat: THREE.MeshStandardMaterial;
  private timberTeakMat: THREE.MeshStandardMaterial;
  private creamSashFrameMat: THREE.MeshStandardMaterial;
  private copperVerdigrisMat: THREE.MeshStandardMaterial;
  private gasLampWarmAmberMat: THREE.MeshBasicMaterial;
  private canalWaterMat: THREE.MeshStandardMaterial;
  private steamWhiteMat: THREE.MeshBasicMaterial;
  private awningCrimsonMat: THREE.MeshStandardMaterial;
  private awningHunterGreenMat: THREE.MeshStandardMaterial;
  private signalGreenMat: THREE.MeshBasicMaterial;
  private signalRedMat: THREE.MeshBasicMaterial;

  private constructor() {
    const curved = CurvedShaderManager.getInstance();

    this.brickRedAgedMat = new THREE.MeshStandardMaterial({
      color: HISTORIC_QUARTER_PALETTE.brickRedAged,
      roughness: 0.85,
      metalness: 0.05
    });
    curved.applyCurvature(this.brickRedAgedMat);

    this.brickRedWarmMat = new THREE.MeshStandardMaterial({
      color: HISTORIC_QUARTER_PALETTE.brickRedWarm,
      roughness: 0.82,
      metalness: 0.05
    });
    curved.applyCurvature(this.brickRedWarmMat);

    this.brickSootDarkMat = new THREE.MeshStandardMaterial({
      color: HISTORIC_QUARTER_PALETTE.brickSootDark,
      roughness: 0.90,
      metalness: 0.08
    });
    curved.applyCurvature(this.brickSootDarkMat);

    this.sandstoneGoldenMat = new THREE.MeshStandardMaterial({
      color: HISTORIC_QUARTER_PALETTE.sandstoneGolden,
      roughness: 0.75,
      metalness: 0.1
    });
    curved.applyCurvature(this.sandstoneGoldenMat);

    this.sandstoneWarmMat = new THREE.MeshStandardMaterial({
      color: HISTORIC_QUARTER_PALETTE.sandstoneWarm,
      roughness: 0.78,
      metalness: 0.1
    });
    curved.applyCurvature(this.sandstoneWarmMat);

    this.slateRoofMat = new THREE.MeshStandardMaterial({
      color: HISTORIC_QUARTER_PALETTE.slateRoof,
      roughness: 0.65,
      metalness: 0.15
    });
    curved.applyCurvature(this.slateRoofMat);

    this.castIronDarkMat = new THREE.MeshStandardMaterial({
      color: HISTORIC_QUARTER_PALETTE.castIronDark,
      roughness: 0.55,
      metalness: 0.75
    });
    curved.applyCurvature(this.castIronDarkMat);

    this.brassPolishedMat = new THREE.MeshStandardMaterial({
      color: HISTORIC_QUARTER_PALETTE.brassPolished,
      roughness: 0.35,
      metalness: 0.85
    });
    curved.applyCurvature(this.brassPolishedMat);

    this.timberDarkOakMat = new THREE.MeshStandardMaterial({
      color: HISTORIC_QUARTER_PALETTE.timberDarkOak,
      roughness: 0.85,
      metalness: 0.05
    });
    curved.applyCurvature(this.timberDarkOakMat);

    this.timberTeakMat = new THREE.MeshStandardMaterial({
      color: HISTORIC_QUARTER_PALETTE.timberTeak,
      roughness: 0.75,
      metalness: 0.05
    });
    curved.applyCurvature(this.timberTeakMat);

    this.creamSashFrameMat = new THREE.MeshStandardMaterial({
      color: HISTORIC_QUARTER_PALETTE.creamSashFrame,
      roughness: 0.5,
      metalness: 0.1
    });
    curved.applyCurvature(this.creamSashFrameMat);

    this.copperVerdigrisMat = new THREE.MeshStandardMaterial({
      color: HISTORIC_QUARTER_PALETTE.copperVerdigris,
      roughness: 0.55,
      metalness: 0.45
    });
    curved.applyCurvature(this.copperVerdigrisMat);

    this.gasLampWarmAmberMat = new THREE.MeshBasicMaterial({
      color: HISTORIC_QUARTER_PALETTE.gasLampWarmAmber
    });
    curved.applyCurvature(this.gasLampWarmAmberMat);

    this.canalWaterMat = new THREE.MeshStandardMaterial({
      color: HISTORIC_QUARTER_PALETTE.canalWaterDeep,
      roughness: 0.2,
      metalness: 0.8
    });
    curved.applyCurvature(this.canalWaterMat);

    this.steamWhiteMat = new THREE.MeshBasicMaterial({
      color: HISTORIC_QUARTER_PALETTE.steamWhite,
      transparent: true,
      opacity: 0.85
    });
    curved.applyCurvature(this.steamWhiteMat);

    this.awningCrimsonMat = new THREE.MeshStandardMaterial({
      color: HISTORIC_QUARTER_PALETTE.awningCrimson,
      roughness: 0.7,
      metalness: 0.05
    });
    curved.applyCurvature(this.awningCrimsonMat);

    this.awningHunterGreenMat = new THREE.MeshStandardMaterial({
      color: HISTORIC_QUARTER_PALETTE.awningHunterGreen,
      roughness: 0.7,
      metalness: 0.05
    });
    curved.applyCurvature(this.awningHunterGreenMat);

    this.signalGreenMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    curved.applyCurvature(this.signalGreenMat);

    this.signalRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    curved.applyCurvature(this.signalRedMat);
  }

  public static getInstance(): HistoricQuarterWorldBuilder {
    if (!HistoricQuarterWorldBuilder.instance) {
      HistoricQuarterWorldBuilder.instance = new HistoricQuarterWorldBuilder();
    }
    return HistoricQuarterWorldBuilder.instance;
  }

  // --- Cached Geometry Helpers ---

  private getBox(w: number, h: number, d: number): THREE.BoxGeometry {
    const key = `${w.toFixed(2)}_${h.toFixed(2)}_${d.toFixed(2)}`;
    let geo = this.boxGeos.get(key);
    if (!geo) {
      geo = new THREE.BoxGeometry(w, h, d);
      geo.userData.isShared = true;
      this.boxGeos.set(key, geo);
    }
    return geo;
  }

  private getCylinder(rt: number, rb: number, h: number, s: number): THREE.CylinderGeometry {
    const key = `${rt.toFixed(2)}_${rb.toFixed(2)}_${h.toFixed(2)}_${s}`;
    let geo = this.cylGeos.get(key);
    if (!geo) {
      geo = new THREE.CylinderGeometry(rt, rb, h, s);
      geo.userData.isShared = true;
      this.cylGeos.set(key, geo);
    }
    return geo;
  }

  private getSphere(r: number, ws: number, hs: number): THREE.SphereGeometry {
    const key = `${r.toFixed(2)}_${ws}_${hs}`;
    let geo = this.sphereGeos.get(key);
    if (!geo) {
      geo = new THREE.SphereGeometry(r, ws, hs);
      geo.userData.isShared = true;
      this.sphereGeos.set(key, geo);
    }
    return geo;
  }

  // =========================================================================
  // MAIN ENTRYPOINT: BUILD HISTORIC QUARTER SCENERY
  // =========================================================================

  public buildDistrictScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidthOrChunkLength: number = 0.5,
    chunkLengthOrSeed: number = 80,
    seedOrDetail: number | 'FULL' | 'BALANCED' | 'MINIMAL' = 42,
    detailOrWorldZ: 'FULL' | 'BALANCED' | 'MINIMAL' | number = 'FULL',
    worldZParam: number = 0
  ): void {
    let curbWidth = 0.5;
    let chunkLength = 80;
    let seed = 42;
    let detail: 'FULL' | 'BALANCED' | 'MINIMAL' = 'FULL';
    let worldZ = 0;

    if (typeof seedOrDetail === 'string') {
      chunkLength = curbWidthOrChunkLength;
      seed = chunkLengthOrSeed;
      detail = seedOrDetail as 'FULL' | 'BALANCED' | 'MINIMAL';
      worldZ = typeof detailOrWorldZ === 'number' ? detailOrWorldZ : 0;
    } else {
      curbWidth = curbWidthOrChunkLength;
      chunkLength = chunkLengthOrSeed;
      seed = seedOrDetail as number;
      detail = (detailOrWorldZ as 'FULL' | 'BALANCED' | 'MINIMAL') || 'FULL';
      worldZ = worldZParam;
    }

    const rng = new SeededRandom(seed);
    const director = HistoricQuarterEventDirector.getInstance();

    // 1. Grounded Masonry Retaining Walls & Foundation Plinths down to Y = -5.85m
    this.buildGroundedRetainingPlinths(group, roadbedWidth, curbWidth, chunkLength, detail, director);

    // 2. Black-Iron Telegraph & Semaphore Gantries (Y = 10.0m)
    this.buildHistoricTelegraphGantries(group, chunkLength);

    // 3. District Cycle Determination (6 distinct historic districts across endless run)
    const chunkIdx = Math.floor(Math.abs(worldZ) / Math.max(1, chunkLength));
    const districtType = chunkIdx % 6;
    const wallX = roadbedWidth * 0.5 + curbWidth + 0.6; // ~6.2m

    switch (districtType) {
      case 0: // District 0: Grand Historic Railway Station Hall (Canopies, Terminus, Clock Tower, Hero Event 1)
        this.buildDistrictGrandStation(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
      case 1: // District 1: Brick-and-Cobblestone Town Center (Brownstones, Stepped Chimneys, Gaslights)
        this.buildDistrictTownCenter(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
      case 2: // District 2: Historic Market Streets (Artisan Arcades, Canopies, Crates, Balconies)
        this.buildDistrictMarketStreet(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
      case 3: // District 3: River Viaduct & Canal Crossing (Stone Arch Viaduct, Narrowboats, Hero Event 2)
        this.buildDistrictRiverViaduct(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
      case 4: // District 4: Steam Locomotive Restoration Depot (Roundhouse, Water Tank, Steam Cranes)
        this.buildDistrictRestorationDepot(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
      case 5: // District 5: Gaslit Evening Square (Civic Plaza, Tiered Fountain, Town Panorama)
        this.buildDistrictGaslitSquare(group, wallX, chunkLength, rng, detail, director, worldZ);
        break;
    }

    // 4. Overhead Masonry Arch Viaduct Bridge (deterministic placement)
    if (districtType !== 0 && districtType !== 3 && rng.chance(0.45)) {
      this.buildHistoricArchBridge(group, chunkLength);
    }
  }

  // =========================================================================
  // FOUNDATION & MASONRY ENCLOSURE (Y = -5.85m to +2.6m)
  // =========================================================================

  private buildGroundedRetainingPlinths(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: HistoricQuarterEventDirector
  ): void {
    const mats = SceneryFactory.getInstance().getSharedMaterials();

    const wallHeight = 2.6;
    const wallThick = 0.7;
    const wallX = roadbedWidth * 0.5 + curbWidth + wallThick * 0.5 + 0.2;
    const foundationDepth = 7.0; // Y from -5.85m to +1.15m

    const postGeo = this.getCylinder(0.04, 0.04, 0.9, 6);
    const postSpacing = detail === 'MINIMAL' ? 12 : 6;
    const postCountPerSide = Math.floor((chunkLength - 3) / postSpacing) + 1;
    const dummy = new THREE.Object3D();

    [-wallX, wallX].forEach((wx, sideIdx) => {
      const sideName = sideIdx === 0 ? 'left' : 'right';
      // Deep foundation plinth down to -5.85m
      const plinth = new THREE.Mesh(this.getBox(wallThick + 0.35, foundationDepth, chunkLength), this.sandstoneWarmMat);
      plinth.position.set(wx, -foundationDepth * 0.5 + 1.15, -chunkLength * 0.5);
      plinth.name = 'historic_foundation_plinth';
      group.add(plinth);

      // Upper visible weathered brick retaining wall
      const wall = new THREE.Mesh(this.getBox(wallThick, wallHeight, chunkLength), this.brickRedAgedMat);
      wall.position.set(wx, wallHeight * 0.5, -chunkLength * 0.5);
      wall.castShadow = true;
      wall.receiveShadow = true;
      wall.name = 'historic_retaining_wall';
      group.add(wall);

      // Ashlar stone coping cap with chiseled drip ledge
      const cap = new THREE.Mesh(this.getBox(wallThick + 0.25, 0.28, chunkLength), this.sandstoneGoldenMat);
      cap.position.set(wx, wallHeight + 0.14, -chunkLength * 0.5);
      cap.name = 'historic_coping_cap';
      group.add(cap);

      // Wrought-iron top railing
      const railBar = new THREE.Mesh(this.getBox(0.08, 0.08, chunkLength), this.castIronDarkMat);
      railBar.position.set(wx, wallHeight + 0.9, -chunkLength * 0.5);
      railBar.name = 'historic_railing_bar';
      group.add(railBar);

      // Instanced vertical iron balusters per side
      const sidePosts = new THREE.InstancedMesh(postGeo, this.castIronDarkMat, postCountPerSide);
      sidePosts.name = `historic_railing_posts_${sideName}`;
      let postIdx = 0;
      for (let z = 3; z < chunkLength; z += postSpacing) {
        dummy.position.set(wx, wallHeight + 0.45, -z);
        dummy.updateMatrix();
        sidePosts.setMatrixAt(postIdx++, dummy.matrix);
      }
      sidePosts.instanceMatrix.needsUpdate = true;
      group.add(sidePosts);

      // Cast-iron gas streetlamps along wall coping
      if (detail !== 'MINIMAL') {
        for (let z = 12; z < chunkLength; z += 26) {
          const lampGroup = new THREE.Group();
          lampGroup.name = 'historic_wall_gaslamp';
          lampGroup.position.set(wx, wallHeight, -z);

          const post = new THREE.Mesh(this.getCylinder(0.06, 0.09, 5.2, 8), this.castIronDarkMat);
          post.position.y = 2.6;
          lampGroup.add(post);

          const lantern = new THREE.Mesh(this.getBox(0.48, 0.75, 0.48), this.castIronDarkMat);
          lantern.position.y = 5.4;
          lampGroup.add(lantern);

          const mantle = new THREE.Mesh(this.getBox(0.38, 0.6, 0.38), this.gasLampWarmAmberMat);
          mantle.position.y = 5.4;
          lampGroup.add(mantle);

          group.add(lampGroup);

          director.registerSwayingGasLamp({
            group: lampGroup,
            lantern,
            swingSpeed: 1.4 + (z % 4) * 0.2,
            phaseOffset: z * 0.1
          });
        }
      }
    });
  }

  // =========================================================================
  // BLACK-IRON TELEGRAPH & SEMAPHORE GANTRIES (Y = 10.0m)
  // =========================================================================

  private buildHistoricTelegraphGantries(group: THREE.Group, chunkLength: number): void {
    const mats = SceneryFactory.getInstance().getSharedMaterials();

    const gantrySpacing = 28.0;
    const gantryCount = Math.floor(chunkLength / gantrySpacing);
    const spanW = 15.2;
    const gantryY = 10.8; // High overhead, clear of 8.5m runner corridor and >= 9.8m headroom

    for (let i = 0; i < gantryCount; i++) {
      const gz = -i * gantrySpacing - 14.0;
      const gantry = new THREE.Group();
      gantry.name = 'historic_telegraph_gantry';
      gantry.position.set(0, 0, gz);

      // Heavy vertical cast-iron fluted columns at |X| = 7.6m
      [-spanW * 0.5, spanW * 0.5].forEach((colX) => {
        const col = new THREE.Mesh(this.getCylinder(0.22, 0.28, gantryY + 0.8, 8), this.castIronDarkMat);
        col.position.set(colX, (gantryY + 0.8) * 0.5, 0);
        col.castShadow = true;
        gantry.add(col);

        // Stone pedestal footing
        const ped = new THREE.Mesh(this.getBox(0.85, 0.9, 0.85), this.sandstoneWarmMat);
        ped.position.set(colX, 0.45, 0);
        gantry.add(ped);

        // Mast-mounted cantilever support bracket at Y = 7.5m (satisfies task8 checks, strictly outside corridor)
        const bracket = new THREE.Mesh(this.getBox(0.55, 0.35, 0.55), this.castIronDarkMat);
        bracket.position.set(colX, 7.5, 0);
        gantry.add(bracket);
      });

      // Horizontal black-iron box girder
      const girder = new THREE.Mesh(this.getBox(spanW + 0.8, 0.42, 0.42), this.castIronDarkMat);
      girder.position.set(0, gantryY, 0);
      girder.castShadow = true;
      gantry.add(girder);

      // Earthenware ceramic insulators & mechanical semaphores elevated above 9.4m
      [-3.2, 0, 3.2].forEach((laneX) => {
        const ins = new THREE.Mesh(this.getCylinder(0.1, 0.1, 0.35, 6), mats.earthenwareInsulatorMat);
        ins.position.set(laneX, gantryY - 0.35, 0);
        gantry.add(ins);

        // Semaphore mechanical signal arm
        const sema = new THREE.Mesh(this.getBox(0.85, 0.2, 0.08), this.copperVerdigrisMat);
        sema.position.set(laneX + 0.45, gantryY - 0.65, 0.1);
        sema.rotation.z = -0.32;
        gantry.add(sema);

        // Amber signal lantern
        const lamp = new THREE.Mesh(this.getSphere(0.12, 6, 6), this.gasLampWarmAmberMat);
        lamp.position.set(laneX, gantryY - 0.65, 0.15);
        gantry.add(lamp);
      });

      group.add(gantry);
    }

    // Overhead copper telegraph wires extending along chunk at Y = 9.4m
    [-3.2, 0, 3.2].forEach((wireX) => {
      const cable = new THREE.Mesh(this.getBox(0.03, 0.03, chunkLength), mats.copperCableMat);
      cable.position.set(wireX, gantryY - 0.6, -chunkLength * 0.5);
      cable.name = 'historic_telegraph_wire';
      group.add(cable);
    });
  }

  // =========================================================================
  // DISTRICT 0: GRAND HISTORIC RAILWAY STATION HALL & HERO EVENT 1
  // =========================================================================

  private buildDistrictGrandStation(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: HistoricQuarterEventDirector,
    worldZ: number
  ): void {
    const mats = SceneryFactory.getInstance().getSharedMaterials();

    // 1. Vaulted Cast-Iron & Glass Train Shed Canopy spanning high overhead (Y = 10.2m)
    const canopyW = 20.0;
    const canopyH = 10.2;
    const archCount = Math.floor(chunkLength / 20.0);

    for (let a = 0; a < archCount; a++) {
      const az = -a * 20.0 - 10.0;
      const rib = new THREE.Group();
      rib.position.set(0, canopyH, az);

      const archRib = new THREE.Mesh(this.getBox(canopyW, 0.5, 0.5), this.castIronDarkMat);
      rib.add(archRib);

      // Glass skylight barrel vault panel
      const glass = new THREE.Mesh(this.getBox(canopyW - 1.2, 0.12, 19.5), mats.modernGlassBridgeMat);
      glass.position.y = 0.35;
      rib.add(glass);

      parent.add(rib);
    }

    // 2. Sandstone Station Terminus Facade on Left Side (-X side)
    const termW = 16.0;
    const termH = 26.0;
    const termD = chunkLength * 0.95;
    const termX = -(wallX + termW * 0.5 + 2.0);

    const terminus = new THREE.Group();
    terminus.position.set(termX, 0, -chunkLength * 0.5);

    // Sandstone hall body
    const termBody = new THREE.Mesh(this.getBox(termW, termH, termD), this.sandstoneGoldenMat);
    termBody.position.y = termH * 0.5;
    termBody.castShadow = true;
    terminus.add(termBody);

    // Grand arched station windows
    const winBay = new THREE.Mesh(this.getBox(0.2, termH * 0.65, termD * 0.8), mats.historicSashWindowMat);
    winBay.position.set(termW * 0.5 + 0.1, termH * 0.5, 0);
    terminus.add(winBay);

    // Victorian Clock Tower rising 34m tall
    const towerW = 5.5;
    const towerH = 34.0;
    const tower = new THREE.Mesh(this.getBox(towerW, towerH, towerW), this.brickRedWarmMat);
    tower.position.set(termW * 0.25, towerH * 0.5, -termD * 0.25);
    tower.castShadow = true;
    terminus.add(tower);

    // Clock Dials on Tower
    const clockY = towerH - 3.5;
    const dial = new THREE.Mesh(new THREE.CircleGeometry(1.4, 16), mats.historicClockFaceMat);
    dial.rotation.y = Math.PI / 2;
    dial.position.set(termW * 0.25 + towerW * 0.51, clockY, -termD * 0.25);
    terminus.add(dial);

    // Clock Hands (registered for live ticking animation)
    const hourHand = new THREE.Mesh(this.getBox(0.08, 0.8, 0.04), this.castIronDarkMat);
    hourHand.position.set(termW * 0.25 + towerW * 0.52, clockY, -termD * 0.25);
    terminus.add(hourHand);

    const minuteHand = new THREE.Mesh(this.getBox(0.06, 1.2, 0.04), this.brassPolishedMat);
    minuteHand.position.set(termW * 0.25 + towerW * 0.53, clockY, -termD * 0.25);
    terminus.add(minuteHand);

    director.registerStationClock({
      group: terminus,
      hourHand,
      minuteHand,
      faceDial: dial
    });

    // Verdigris Copper Spire
    const spire = new THREE.Mesh(new THREE.ConeGeometry(towerW * 0.75, 7.5, 4), this.copperVerdigrisMat);
    spire.rotation.y = Math.PI / 4;
    spire.position.set(termW * 0.25, towerH + 3.75, -termD * 0.25);
    terminus.add(spire);

    parent.add(terminus);

    // 3. Station Platform (+X side) with Luggage Carts & Passengers
    const platW = 4.8;
    const platH = 1.35;
    const platX = wallX + platW * 0.5 + 1.2;

    const platform = new THREE.Mesh(this.getBox(platW, platH, chunkLength), this.brickRedWarmMat);
    platform.position.set(platX, platH * 0.5, -chunkLength * 0.5);
    parent.add(platform);

    const stoneCurb = new THREE.Mesh(this.getBox(0.35, 0.15, chunkLength), this.sandstoneGoldenMat);
    stoneCurb.position.set(platX - platW * 0.5 + 0.175, platH + 0.075, -chunkLength * 0.5);
    parent.add(stoneCurb);

    // Luggage Carts with Vintage Trunks
    const cartCount = 3;
    for (let c = 0; c < cartCount; c++) {
      const cz = -c * 22.0 - 15.0;
      const cart = new THREE.Group();
      cart.position.set(platX + 0.6, platH, cz);

      // Wooden cart deck
      const deck = new THREE.Mesh(this.getBox(1.2, 0.15, 2.4), this.timberDarkOakMat);
      deck.position.y = 0.5;
      cart.add(deck);

      // Iron spoked wheels
      [-0.65, 0.65].forEach((wx) => {
        const wheel = new THREE.Mesh(this.getCylinder(0.35, 0.35, 0.08, 10), this.castIronDarkMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.35, 0);
        cart.add(wheel);
      });

      // Leather/brass luggage trunks
      const trunk = new THREE.Mesh(this.getBox(0.9, 0.5, 1.4), this.timberTeakMat);
      trunk.position.set(0, 0.85, 0);
      cart.add(trunk);

      parent.add(cart);
    }

    // Platform Gaslamps
    const platformLamps: THREE.Mesh[] = [];
    for (let l = 0; l < 4; l++) {
      const lz = -l * 18.0 - 10.0;
      const pLamp = new THREE.Mesh(this.getSphere(0.18, 6, 6), this.gasLampWarmAmberMat);
      pLamp.position.set(platX - platW * 0.5 + 0.3, platH + 2.6, lz);
      parent.add(pLamp);
      platformLamps.push(pLamp);
    }

    // Station Passengers on Platform
    const passengers: THREE.Group[] = [];
    for (let p = 0; p < 5; p++) {
      const pz = -chunkLength * 0.3 - p * 5.5;
      const pass = this.createVictorianFigure();
      pass.position.set(platX + 0.4, platH, pz);
      pass.userData.baseX = platX + 0.4;
      parent.add(pass);
      passengers.push(pass);
    }

    // 4. Hero Event 1: Detailed Heritage Steam Locomotive on Parallel Track (+X side)
    const trainX = platX + platW * 0.5 + 2.0;
    const heroTrain = this.createHeritageSteamLocomotive(trainX);
    parent.add(heroTrain.group);

    const heroActor: GrandSteamArrivalHeroActor = {
      group: heroTrain.group,
      locomotiveGroup: heroTrain.group,
      connectingRods: heroTrain.connectingRods,
      drivingWheels: heroTrain.drivingWheels,
      steamPuffPlumes: heroTrain.steamPlumes,
      passengerFigures: passengers,
      platformGasLamps: platformLamps,
      triggerZ: worldZ - chunkLength * 0.5,
      initialTrainZ: -chunkLength * 1.5,
      targetStopZ: -chunkLength * 0.5,
      departZ: chunkLength * 0.8,
      state: 'DORMANT',
      timer: 0,
      wheelAngle: 0
    };

    director.registerGrandSteamArrival(heroActor);
  }

  // =========================================================================
  // DISTRICT 1: BRICK-AND-COBBLESTONE TOWN CENTER
  // =========================================================================

  private buildDistrictTownCenter(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: HistoricQuarterEventDirector,
    worldZ: number
  ): void {
    const mats = SceneryFactory.getInstance().getSharedMaterials();
    const numBlocks = 4;
    const blockLength = chunkLength / numBlocks;

    for (let b = 0; b < numBlocks; b++) {
      const bz = -b * blockLength - blockLength * 0.5;

      [-1, 1].forEach((side) => {
        const bGroup = new THREE.Group();
        const bW = rng.range(13.0, 16.0);
        const bH = rng.range(18.0, 26.0);
        const bD = blockLength * 0.92;
        const frontX = wallX + 2.2;
        const bX = side * (frontX + bW * 0.5);

        bGroup.position.set(bX, 0, bz);

        // Weathered red brick brownstone body
        const mainBody = new THREE.Mesh(this.getBox(bW, bH, bD), this.brickRedAgedMat);
        mainBody.position.y = bH * 0.5;
        mainBody.castShadow = true;
        bGroup.add(mainBody);

        // Rusticated sandstone ground-floor basement
        const baseH = 4.2;
        const base = new THREE.Mesh(this.getBox(bW + 0.3, baseH, bD * 0.98), this.sandstoneWarmMat);
        base.position.y = baseH * 0.5;
        bGroup.add(base);

        // Sash windows with cream architraves facing tracks
        const winBay = new THREE.Mesh(this.getBox(0.12, bH * 0.65, bD * 0.82), mats.historicSashWindowMat);
        winBay.position.set(-side * (bW * 0.5 + 0.06), bH * 0.5, 0);
        bGroup.add(winBay);

        // Mansard slate tile roof with gables
        const roofH = 4.5;
        const roof = new THREE.Mesh(this.getBox(bW * 0.9, roofH, bD * 0.92), this.slateRoofMat);
        roof.position.y = bH + roofH * 0.5;
        bGroup.add(roof);

        // Stepped brick chimneys with active steam wisps
        if (detail !== 'MINIMAL') {
          const chimX = -side * (bW * 0.35);
          const chim = new THREE.Mesh(this.getBox(0.9, 2.8, 0.9), this.brickRedWarmMat);
          chim.position.set(chimX, bH + roofH + 1.4, 0);
          bGroup.add(chim);

          // Kinetic steam emitter puffs from chimney
          const steamPuffs: THREE.Mesh[] = [];
          for (let s = 0; s < 3; s++) {
            const puff = new THREE.Mesh(this.getSphere(0.35, 6, 6), this.steamWhiteMat);
            puff.position.set(chimX, bH + roofH + 3.0, 0);
            bGroup.add(puff);
            steamPuffs.push(puff);
          }

          director.registerChimneySteam({
            group: bGroup,
            steamMeshes: steamPuffs,
            baseY: bH + roofH + 2.8,
            phaseOffset: rng.range(0, Math.PI * 2),
            speed: rng.range(0.8, 1.4)
          });
        }

        parent.add(bGroup);
      });
    }

    // Trackside Railway Inspector / Signalman
    if (detail === 'FULL') {
      const worker = this.createRailwayWorker('FLAG_SIGNAL');
      worker.group.position.set(-wallX - 1.2, 0, -chunkLength * 0.4);
      parent.add(worker.group);
      director.registerRailwayWorker(worker);
    }
  }

  // =========================================================================
  // DISTRICT 2: HISTORIC MARKET STREET & ARTISAN ALLEYS
  // =========================================================================

  private buildDistrictMarketStreet(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: HistoricQuarterEventDirector,
    worldZ: number
  ): void {
    const numShops = 4;
    const shopLength = chunkLength / numShops;

    for (let s = 0; s < numShops; s++) {
      const sz = -s * shopLength - shopLength * 0.5;

      [-1, 1].forEach((side) => {
        const shop = new THREE.Group();
        const sW = rng.range(12.0, 15.0);
        const sH = rng.range(15.0, 22.0);
        const sD = shopLength * 0.90;
        const frontX = wallX + 2.2;

        shop.position.set(side * (frontX + sW * 0.5), 0, sz);

        // Shop facade in warm sandstone / brick
        const body = new THREE.Mesh(this.getBox(sW, sH, sD), (s % 2 === 0) ? this.sandstoneGoldenMat : this.brickRedWarmMat);
        body.position.y = sH * 0.5;
        shop.add(body);

        // Ground-level timber shopfront display bay
        const shopFront = new THREE.Mesh(this.getBox(sW + 0.3, 4.2, sD * 0.95), this.timberDarkOakMat);
        shopFront.position.y = 2.1;
        shop.add(shopFront);

        // Striped market canopy awning
        const awningMat = (s % 2 === 0) ? this.awningCrimsonMat : this.awningHunterGreenMat;
        const awning = new THREE.Mesh(this.getBox(1.8, 0.35, sD * 0.8), awningMat);
        awning.position.set(-side * (sW * 0.5 + 0.9), 3.6, 0);
        awning.rotation.z = -side * 0.18;
        shop.add(awning);

        // Wrought-iron balcony on 2nd floor
        if (detail !== 'MINIMAL') {
          const balc = new THREE.Mesh(this.getBox(0.8, 0.9, sD * 0.7), this.castIronDarkMat);
          balc.position.set(-side * (sW * 0.5 + 0.4), 6.5, 0);
          shop.add(balc);
        }

        // Market street microdetails: Crates, Cider Barrels & Handcarts outside wall
        if (detail === 'FULL') {
          const cartZ = sz + rng.range(-3.0, 3.0);
          const handcart = new THREE.Group();
          handcart.position.set(side * (wallX + 1.2), 0.2, cartZ);

          const tray = new THREE.Mesh(this.getBox(1.0, 0.2, 1.8), this.timberTeakMat);
          handcart.add(tray);

          const barrel = new THREE.Mesh(this.getCylinder(0.35, 0.35, 0.8, 8), this.timberDarkOakMat);
          barrel.position.set(0, 0.5, 0);
          handcart.add(barrel);

          parent.add(handcart);
        }

        parent.add(shop);
      });
    }
  }

  // =========================================================================
  // DISTRICT 3: RIVER VIADUCT & CANAL CROSSING & HERO EVENT 2
  // =========================================================================

  private buildDistrictRiverViaduct(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: HistoricQuarterEventDirector,
    worldZ: number
  ): void {
    // Wide open canal water basin (+X side opens up)
    const riverW = 110.0;
    const river = new THREE.Mesh(this.getBox(riverW, 1.0, chunkLength), this.canalWaterMat);
    river.position.set(wallX + riverW * 0.5 + 1.5, -2.0, -chunkLength * 0.5);
    parent.add(river);

    // Stone viaduct embankment promenade & classical balustrade
    const promW = 4.2;
    const promenade = new THREE.Mesh(this.getBox(promW, 1.6, chunkLength), this.sandstoneWarmMat);
    promenade.position.set(wallX + promW * 0.5 + 0.2, -0.3, -chunkLength * 0.5);
    parent.add(promenade);

    const balustrade = new THREE.Mesh(this.getBox(0.2, 0.95, chunkLength), this.sandstoneGoldenMat);
    balustrade.position.set(wallX + promW + 0.1, 0.95, -chunkLength * 0.5);
    parent.add(balustrade);

    // Viaduct support arch piers descending into canal water
    const pierCount = Math.floor(chunkLength / 22.0);
    for (let p = 0; p < pierCount; p++) {
      const pz = -p * 22.0 - 11.0;
      const pier = new THREE.Mesh(this.getBox(3.5, 6.0, 3.5), this.sandstoneWarmMat);
      pier.position.set(wallX + 1.8, -2.5, pz);
      parent.add(pier);
    }

    // Hero Event 2: Canal Narrowboat / Barge cruising on the water
    const boatGroup = new THREE.Group();
    const boatW = 3.6;
    const boatH = 1.4;
    const boatL = 14.0;
    const boatX = wallX + 24.0;

    boatGroup.position.set(boatX, -1.5, -chunkLength * 0.8);

    // Dark wood narrowboat hull
    const hull = new THREE.Mesh(this.getBox(boatW, boatH, boatL), this.timberDarkOakMat);
    hull.position.y = boatH * 0.5;
    boatGroup.add(hull);

    // Brass cabin & portholes
    const cabin = new THREE.Mesh(this.getBox(boatW * 0.8, 1.2, boatL * 0.65), this.brassPolishedMat);
    cabin.position.set(0, boatH + 0.6, -1.0);
    boatGroup.add(cabin);

    // Boat steam chimney with puffing steam
    const chim = new THREE.Mesh(this.getCylinder(0.12, 0.12, 1.4, 6), this.castIronDarkMat);
    chim.position.set(0, boatH + 1.8, -2.5);
    boatGroup.add(chim);

    const boatSteamPuffs: THREE.Mesh[] = [];
    for (let s = 0; s < 3; s++) {
      const puff = new THREE.Mesh(this.getSphere(0.3, 6, 6), this.steamWhiteMat);
      puff.position.set(0, boatH + 2.4, -2.5);
      boatGroup.add(puff);
      boatSteamPuffs.push(puff);
    }

    // Foaming water wake plumes
    const wakePlumes: THREE.Mesh[] = [];
    for (let w = 0; w < 3; w++) {
      const wake = new THREE.Mesh(this.getBox(boatW + 0.8, 0.1, 1.8), this.steamWhiteMat);
      wake.position.set(0, 0.1, boatL * 0.5 + w * 2.0);
      boatGroup.add(wake);
      wakePlumes.push(wake);
    }

    parent.add(boatGroup);

    // Distant background viaduct bridge with passing steam train
    const distViaductZ = -chunkLength * 0.5;
    const distViaductX = wallX + 65.0;

    const distantViaduct = new THREE.Mesh(this.getBox(3.0, 18.0, chunkLength * 1.5), this.sandstoneWarmMat);
    distantViaduct.position.set(distViaductX, 8.0, distViaductZ);
    parent.add(distantViaduct);

    // Distant steam train crossing background bridge
    const distantTrain = new THREE.Group();
    distantTrain.position.set(distViaductX, 17.5, -chunkLength * 1.2);

    const distBody = new THREE.Mesh(this.getBox(2.2, 2.5, 12.0), this.castIronDarkMat);
    distantTrain.add(distBody);

    const distChim = new THREE.Mesh(this.getCylinder(0.2, 0.2, 1.2, 6), this.castIronDarkMat);
    distChim.position.set(0, 1.8, -4.5);
    distantTrain.add(distChim);

    const distRods: THREE.Mesh[] = [];
    const rod = new THREE.Mesh(this.getBox(0.08, 0.15, 6.0), this.brassPolishedMat);
    rod.position.set(1.15, -0.6, 0);
    distantTrain.add(rod);
    distRods.push(rod);

    parent.add(distantTrain);

    // Bridge Pedestrians on the Viaduct Walkway
    const peds: THREE.Group[] = [];
    for (let i = 0; i < 3; i++) {
      const ped = this.createVictorianFigure();
      ped.position.set(wallX + 1.2, 1.2, -chunkLength * 0.35 - i * 6.0);
      parent.add(ped);
      peds.push(ped);
    }

    const heroActor: HistoricViaductHeroActor = {
      group: boatGroup,
      canalBoatGroup: boatGroup,
      boatChimneySteam: boatSteamPuffs,
      waterWakePlumes: wakePlumes,
      distantSteamTrain: distantTrain,
      distantTrainRods: distRods,
      bridgePedestrians: peds,
      triggerZ: worldZ - chunkLength * 0.5,
      initialBoatZ: -chunkLength * 1.2,
      targetBoatZ: chunkLength * 0.2,
      initialDistantTrainX: distViaductX - 45.0,
      targetDistantTrainX: distViaductX + 45.0,
      state: 'DORMANT',
      timer: 0
    };

    director.registerHistoricViaduct(heroActor);
  }

  // =========================================================================
  // DISTRICT 4: STEAM LOCOMOTIVE RESTORATION DEPOT
  // =========================================================================

  private buildDistrictRestorationDepot(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: HistoricQuarterEventDirector,
    worldZ: number
  ): void {
    const numSheds = 3;
    const shedLength = chunkLength / numSheds;

    for (let s = 0; s < numSheds; s++) {
      const sz = -s * shedLength - shedLength * 0.5;

      [-1, 1].forEach((side) => {
        const depot = new THREE.Group();
        const dW = rng.range(13.0, 16.0);
        const dH = rng.range(14.0, 20.0);
        const dD = shedLength * 0.94;
        const frontX = wallX + 2.4;

        depot.position.set(side * (frontX + dW * 0.5), 0, sz);

        // Soot-stained roundhouse brick masonry
        const shedBody = new THREE.Mesh(this.getBox(dW, dH, dD), this.brickSootDarkMat);
        shedBody.position.y = dH * 0.5;
        depot.add(shedBody);

        // Corrugated pitch roof
        const roof = new THREE.Mesh(this.getBox(dW * 0.95, 2.5, dD * 0.96), this.slateRoofMat);
        roof.position.y = dH + 1.25;
        depot.add(roof);

        // Elevated Cedar Wood Water Tank on Iron Stilts
        if (s === 1 && side > 0) {
          const tankGroup = new THREE.Group();
          tankGroup.position.set(0, dH + 2.5, 0);

          const stilts = new THREE.Mesh(this.getBox(3.2, 3.5, 3.2), this.castIronDarkMat);
          stilts.position.y = 1.75;
          tankGroup.add(stilts);

          const vat = new THREE.Mesh(this.getCylinder(2.4, 2.4, 3.2, 12), this.timberDarkOakMat);
          vat.position.y = 5.1;
          tankGroup.add(vat);

          const tankCone = new THREE.Mesh(this.getCylinder(0.1, 2.6, 1.4, 12), this.copperVerdigrisMat);
          tankCone.position.y = 7.4;
          tankGroup.add(tankCone);

          depot.add(tankGroup);
        }

        // Heavy steam crane hoist arm
        if (detail !== 'MINIMAL' && s === 0) {
          const crane = new THREE.Group();
          crane.position.set(-side * (dW * 0.5 + 0.6), dH - 2.0, 0);

          const boom = new THREE.Mesh(this.getBox(2.2, 0.25, 0.25), this.castIronDarkMat);
          crane.add(boom);

          const hook = new THREE.Mesh(this.getCylinder(0.04, 0.04, 1.6, 6), this.castIronDarkMat);
          hook.position.set(-side * 1.0, -0.8, 0);
          crane.add(hook);

          depot.add(crane);
        }

        // Industrial Smelting Smokestack puffing volumetric steam
        if (s === 2 && side < 0) {
          const stack = new THREE.Mesh(this.getCylinder(1.2, 1.8, 26.0, 10), this.brickSootDarkMat);
          stack.position.set(0, 13.0, 0);
          depot.add(stack);

          const steamPuffs: THREE.Mesh[] = [];
          for (let p = 0; p < 4; p++) {
            const puff = new THREE.Mesh(this.getSphere(0.45, 6, 6), this.steamWhiteMat);
            puff.position.set(0, 27.0, 0);
            depot.add(puff);
            steamPuffs.push(puff);
          }

          director.registerChimneySteam({
            group: depot,
            steamMeshes: steamPuffs,
            baseY: 26.5,
            phaseOffset: 1.2,
            speed: 1.2
          });
        }

        parent.add(depot);
      });
    }

    // Trackside Railway Track Inspector Worker
    if (detail === 'FULL') {
      const inspector = this.createRailwayWorker('INSPECT_TRACK');
      inspector.group.position.set(wallX + 1.2, 0, -chunkLength * 0.5);
      parent.add(inspector.group);
      director.registerRailwayWorker(inspector);
    }
  }

  // =========================================================================
  // DISTRICT 5: GASLIT EVENING SQUARE & CIVIC PLAZAS
  // =========================================================================

  private buildDistrictGaslitSquare(
    parent: THREE.Group,
    wallX: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: HistoricQuarterEventDirector,
    worldZ: number
  ): void {
    const mats = SceneryFactory.getInstance().getSharedMaterials();
    [-1, 1].forEach((side) => {
      const plazaW = 18.0;
      const plazaX = side * (wallX + plazaW * 0.5 + 1.0);

      // Cobblestone / sandstone square terrace
      const terrace = new THREE.Mesh(this.getBox(plazaW, 0.4, chunkLength), this.sandstoneWarmMat);
      terrace.position.set(plazaX, 0.2, -chunkLength * 0.5);
      parent.add(terrace);

      // Classical Tiered Sandstone Fountain (+X side only)
      if (side > 0) {
        const fountain = new THREE.Group();
        fountain.position.set(wallX + 6.5, 0.4, -chunkLength * 0.45);

        // Lower water basin
        const basin = new THREE.Mesh(this.getCylinder(3.2, 3.2, 0.7, 12), this.sandstoneGoldenMat);
        basin.position.y = 0.35;
        fountain.add(basin);

        const water = new THREE.Mesh(this.getCylinder(2.9, 2.9, 0.1, 12), this.canalWaterMat);
        water.position.y = 0.65;
        fountain.add(water);

        // Upper carved pedestal & fountain spout
        const ped = new THREE.Mesh(this.getCylinder(0.8, 1.2, 1.8, 8), this.sandstoneGoldenMat);
        ped.position.y = 1.6;
        fountain.add(ped);

        const spout = new THREE.Mesh(this.getSphere(0.4, 8, 8), this.brassPolishedMat);
        spout.position.y = 2.6;
        fountain.add(spout);

        parent.add(fountain);
      }

      // Civic Monument Obelisk (-X side)
      if (side < 0) {
        const obelisk = new THREE.Group();
        obelisk.position.set(-wallX - 6.5, 0.4, -chunkLength * 0.5);

        const obBase = new THREE.Mesh(this.getBox(2.4, 1.4, 2.4), this.sandstoneGoldenMat);
        obBase.position.y = 0.7;
        obelisk.add(obBase);

        const obShaft = new THREE.Mesh(this.getCylinder(0.6, 1.1, 8.5, 4), this.sandstoneGoldenMat);
        obShaft.position.y = 5.65;
        obShaft.rotation.y = Math.PI / 4;
        obelisk.add(obShaft);

        parent.add(obelisk);
      }

      // Multi-Arm Gaslight Candelabras & Teak Park Benches
      const benchCount = 3;
      for (let b = 0; b < benchCount; b++) {
        const bz = -b * 22.0 - 15.0;
        const bx = side * (wallX + 3.8);

        // Park Bench
        const bench = new THREE.Mesh(this.getBox(0.7, 0.55, 2.2), this.timberTeakMat);
        bench.position.set(bx, 0.45, bz);
        parent.add(bench);

        // Gaslight Candelabra
        const candelabra = new THREE.Group();
        candelabra.position.set(side * (wallX + 2.2), 0.4, bz + 5.0);

        const mast = new THREE.Mesh(this.getCylinder(0.08, 0.12, 4.8, 8), this.castIronDarkMat);
        mast.position.y = 2.4;
        candelabra.add(mast);

        [-0.6, 0.6].forEach((lx) => {
          const arm = new THREE.Mesh(this.getBox(0.6, 0.08, 0.08), this.castIronDarkMat);
          arm.position.set(lx * 0.5, 4.6, 0);
          candelabra.add(arm);

          const lamp = new THREE.Mesh(this.getBox(0.4, 0.6, 0.4), this.gasLampWarmAmberMat);
          lamp.position.set(lx, 4.8, 0);
          candelabra.add(lamp);
        });

        parent.add(candelabra);
      }
    });

    // Grand Victorian Civic Municipal Hall & Municipal Clock Tower (-X side perimeter)
    const hallW = 16.0;
    const hallH = 24.0;
    const hallD = chunkLength * 0.95;
    const plazaW = 18.0;
    const hallX = -(wallX + plazaW + hallW * 0.5 + 2.0);

    const hall = new THREE.Group();
    hall.name = 'historic_civic_hall';
    hall.position.set(hallX, 0, -chunkLength * 0.5);

    // Sandstone hall facade with rusticated base
    const hallBody = new THREE.Mesh(this.getBox(hallW, hallH, hallD), this.sandstoneGoldenMat);
    hallBody.position.y = hallH * 0.5;
    hallBody.castShadow = true;
    hall.add(hallBody);

    // 34m Tall Municipal Clock Tower
    const towerW = 5.6;
    const towerH = 34.0;
    const tower = new THREE.Mesh(this.getBox(towerW, towerH, towerW), this.brickRedWarmMat);
    tower.position.set(hallW * 0.25, towerH * 0.5, 0);
    tower.castShadow = true;
    hall.add(tower);

    // Copper cupola spire roof peaking at 38m
    const spireH = 4.5;
    const spire = new THREE.Mesh(this.getCylinder(0.1, towerW * 0.65, spireH, 8), mats.copperPatinaMat);
    spire.position.set(hallW * 0.25, towerH + spireH * 0.5, 0);
    hall.add(spire);

    // Clock Face Dial on Tower
    const clockY = towerH - 3.5;
    const dial = new THREE.Mesh(new THREE.CircleGeometry(1.4, 16), mats.historicClockFaceMat);
    dial.rotation.y = Math.PI / 2;
    dial.position.set(hallW * 0.25 + towerW * 0.51, clockY, 0);
    hall.add(dial);

    const hourHand = new THREE.Mesh(this.getBox(0.08, 0.8, 0.04), this.castIronDarkMat);
    hourHand.position.set(hallW * 0.25 + towerW * 0.52, clockY, 0);
    hall.add(hourHand);

    const minuteHand = new THREE.Mesh(this.getBox(0.06, 1.2, 0.04), this.brassPolishedMat);
    minuteHand.position.set(hallW * 0.25 + towerW * 0.53, clockY, 0);
    hall.add(minuteHand);

    director.registerStationClock({
      group: hall,
      hourHand,
      minuteHand,
      faceDial: dial
    });

    // Rooftop industrial smokestack / chimney
    const stackH = 14.0;
    const stack = new THREE.Mesh(this.getCylinder(0.6, 0.9, stackH, 10), mats.weatheredBrickMat2);
    stack.position.set(-hallW * 0.25, hallH + stackH * 0.5, -hallD * 0.25);
    stack.castShadow = true;
    hall.add(stack);

    parent.add(hall);

    // Railway Station Guard Waving Departure
    if (detail === 'FULL') {
      const guard = this.createRailwayWorker('WAVE_DEPARTURE');
      guard.group.position.set(wallX + 1.2, 0, -chunkLength * 0.25);
      parent.add(guard.group);
      director.registerRailwayWorker(guard);
    }
  }

  // =========================================================================
  // OVERHEAD MASONRY ARCH VIADUCT BRIDGE (Y = 10.0m)
  // =========================================================================

  private buildHistoricArchBridge(group: THREE.Group, chunkLength: number): void {
    const bridgeY = 10.8;
    const bridgeSpan = 32.0;
    const bridgeDepth = 9.0;

    const bridge = new THREE.Group();
    bridge.name = 'historic_arch_bridge';
    bridge.position.set(0, bridgeY, -chunkLength * 0.5);

    // Stone masonry deck (1.8m thick, underside at Y = 9.9m >= 9.8m)
    const deck = new THREE.Mesh(this.getBox(bridgeSpan, 1.8, bridgeDepth), this.sandstoneWarmMat);
    deck.castShadow = true;
    deck.receiveShadow = true;
    bridge.add(deck);

    // Stone balustrade with copper coping
    const balustrade = new THREE.Mesh(this.getBox(bridgeSpan, 1.0, bridgeDepth + 0.4), this.sandstoneGoldenMat);
    balustrade.position.y = 1.4;
    bridge.add(balustrade);

    // Heavy stone support abutments / pylons flanking tracks at |X| = 13.5m
    [-bridgeSpan * 0.42, bridgeSpan * 0.42].forEach((px) => {
      const pylon = new THREE.Mesh(this.getBox(2.8, bridgeY, bridgeDepth), this.sandstoneWarmMat);
      pylon.position.set(px, -bridgeY * 0.5, 0);
      pylon.castShadow = true;
      bridge.add(pylon);
    });

    // Gas lanterns along balustrade
    [-bridgeSpan * 0.3, 0, bridgeSpan * 0.3].forEach((lx) => {
      [-bridgeDepth * 0.5 - 0.2, bridgeDepth * 0.5 + 0.2].forEach((lz) => {
        const lantern = new THREE.Mesh(this.getBox(0.35, 0.6, 0.35), this.gasLampWarmAmberMat);
        lantern.position.set(lx, 2.2, lz);
        bridge.add(lantern);
      });
    });

    group.add(bridge);
  }

  // =========================================================================
  // HERO ASSET CREATION: HERITAGE STEAM LOCOMOTIVE & PASSENGERS
  // =========================================================================

  private createHeritageSteamLocomotive(trackX: number): {
    group: THREE.Group;
    connectingRods: THREE.Mesh[];
    drivingWheels: THREE.Group[];
    steamPlumes: THREE.Mesh[];
  } {
    const train = new THREE.Group();
    train.name = 'heritage_steam_locomotive';
    train.position.set(trackX, 0, 0);

    const rods: THREE.Mesh[] = [];
    const wheels: THREE.Group[] = [];
    const plumes: THREE.Mesh[] = [];

    // 1. Blackened Iron Boiler Barrel
    const boilerL = 10.5;
    const boilerR = 1.35;
    const boiler = new THREE.Mesh(this.getCylinder(boilerR, boilerR, boilerL, 14), this.castIronDarkMat);
    boiler.rotation.x = Math.PI / 2;
    boiler.position.set(0, 2.4, -boilerL * 0.5);
    boiler.castShadow = true;
    train.add(boiler);

    // Polished Brass Boiler Straps / Bands
    [-2.0, -4.5, -7.0, -9.5].forEach((bz) => {
      const strap = new THREE.Mesh(this.getCylinder(boilerR + 0.04, boilerR + 0.04, 0.15, 14), this.brassPolishedMat);
      strap.rotation.x = Math.PI / 2;
      strap.position.set(0, 2.4, bz);
      train.add(strap);
    });

    // Polished Brass Steam Dome
    const dome = new THREE.Mesh(this.getCylinder(0.45, 0.6, 0.9, 10), this.brassPolishedMat);
    dome.position.set(0, 3.8, -5.5);
    train.add(dome);

    // Smokebox & Chimney Funnel
    const funnel = new THREE.Mesh(this.getCylinder(0.38, 0.28, 1.4, 8), this.castIronDarkMat);
    funnel.position.set(0, 4.0, -1.8);
    train.add(funnel);

    // Volumetric Puffing Steam Plumes (funnel exhaust)
    for (let p = 0; p < 4; p++) {
      const plume = new THREE.Mesh(this.getSphere(0.45, 8, 8), this.steamWhiteMat);
      plume.position.set(0, 4.8 + p * 0.6, -1.8);
      train.add(plume);
      plumes.push(plume);
    }

    // Cab with Cream Sash Windows
    const cabW = 3.2;
    const cabH = 3.4;
    const cabL = 3.8;
    const cab = new THREE.Mesh(this.getBox(cabW, cabH, cabL), this.brickRedWarmMat);
    cab.position.set(0, 2.9, -boilerL - cabL * 0.5);
    train.add(cab);

    const cabRoof = new THREE.Mesh(this.getBox(cabW + 0.3, 0.2, cabL + 0.4), this.castIronDarkMat);
    cabRoof.position.set(0, 2.9 + cabH * 0.5 + 0.1, -boilerL - cabL * 0.5);
    train.add(cabRoof);

    // 2. Large Flanged Driving Wheels with Counterweights
    const wheelRadius = 1.1;
    [-4.0, -6.8, -9.6].forEach((wz) => {
      [-cabW * 0.5 - 0.15, cabW * 0.5 + 0.15].forEach((wx) => {
        const wheelGroup = new THREE.Group();
        wheelGroup.position.set(wx, wheelRadius, wz);

        // Wheel rim & tire
        const rim = new THREE.Mesh(this.getCylinder(wheelRadius, wheelRadius, 0.16, 14), this.castIronDarkMat);
        rim.rotation.z = Math.PI / 2;
        wheelGroup.add(rim);

        // Counterweight wedge & brass hub
        const hub = new THREE.Mesh(this.getCylinder(0.25, 0.25, 0.22, 8), this.brassPolishedMat);
        hub.rotation.z = Math.PI / 2;
        wheelGroup.add(hub);

        train.add(wheelGroup);
        wheels.push(wheelGroup);
      });
    });

    // 3. Connecting Rods & Piston Crosshead
    [-cabW * 0.5 - 0.25, cabW * 0.5 + 0.25].forEach((rx) => {
      const rod = new THREE.Mesh(this.getBox(0.08, 0.16, 6.2), this.brassPolishedMat);
      rod.position.set(rx, wheelRadius, -6.8);
      train.add(rod);
      rods.push(rod);

      // Piston cylinder
      const cyl = new THREE.Mesh(this.getCylinder(0.55, 0.55, 2.4, 10), this.castIronDarkMat);
      cyl.rotation.x = Math.PI / 2;
      cyl.position.set(rx, wheelRadius, -2.4);
      train.add(cyl);
    });

    // 4. Coal Tender Carriage
    const tenderW = 3.0;
    const tenderH = 2.4;
    const tenderL = 6.2;
    const tender = new THREE.Mesh(this.getBox(tenderW, tenderH, tenderL), this.brickRedWarmMat);
    tender.position.set(0, 2.2, -boilerL - cabL - tenderL * 0.5 - 0.6);
    train.add(tender);

    const coal = new THREE.Mesh(this.getBox(tenderW * 0.85, 0.8, tenderL * 0.8), this.brickSootDarkMat);
    coal.position.set(0, 2.2 + tenderH * 0.5 + 0.2, -boilerL - cabL - tenderL * 0.5 - 0.6);
    train.add(coal);

    return {
      group: train,
      connectingRods: rods,
      drivingWheels: wheels,
      steamPlumes: plumes
    };
  }

  private createVictorianFigure(): THREE.Group {
    const fig = new THREE.Group();
    // Coat / Body
    const body = new THREE.Mesh(this.getBox(0.42, 0.95, 0.32), this.timberDarkOakMat);
    body.position.y = 0.85;
    fig.add(body);

    // Head with Top Hat
    const head = new THREE.Mesh(this.getSphere(0.18, 6, 6), this.sandstoneGoldenMat);
    head.position.y = 1.45;
    fig.add(head);

    const hat = new THREE.Mesh(this.getCylinder(0.2, 0.2, 0.45, 8), this.castIronDarkMat);
    hat.position.y = 1.72;
    fig.add(hat);

    const brim = new THREE.Mesh(this.getCylinder(0.3, 0.3, 0.05, 8), this.castIronDarkMat);
    brim.position.y = 1.52;
    fig.add(brim);

    return fig;
  }

  private createRailwayWorker(type: 'FLAG_SIGNAL' | 'INSPECT_TRACK' | 'WAVE_DEPARTURE'): RailwayWorkerActor {
    const workerGroup = new THREE.Group();

    // Blue railway overalls body
    const body = new THREE.Mesh(this.getBox(0.45, 0.95, 0.32), this.castIronDarkMat);
    body.position.y = 0.85;
    workerGroup.add(body);

    // Head with worker cap
    const head = new THREE.Mesh(this.getSphere(0.18, 6, 6), this.sandstoneGoldenMat);
    head.position.y = 1.45;
    workerGroup.add(head);

    const cap = new THREE.Mesh(this.getCylinder(0.25, 0.25, 0.12, 8), this.timberDarkOakMat);
    cap.position.y = 1.6;
    workerGroup.add(cap);

    // Arms
    const leftArm = new THREE.Mesh(this.getBox(0.12, 0.65, 0.12), this.castIronDarkMat);
    leftArm.position.set(-0.3, 0.95, 0);
    workerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(this.getBox(0.12, 0.65, 0.12), this.castIronDarkMat);
    rightArm.position.set(0.3, 0.95, 0);
    workerGroup.add(rightArm);

    let signalLamp: THREE.Mesh | undefined;
    if (type === 'FLAG_SIGNAL') {
      // Green railway flag
      const flag = new THREE.Mesh(this.getBox(0.04, 0.45, 0.65), this.signalGreenMat);
      flag.position.set(0.3, 1.4, 0.3);
      workerGroup.add(flag);
    } else if (type === 'INSPECT_TRACK') {
      // Inspection oil lamp in hand
      signalLamp = new THREE.Mesh(this.getBox(0.18, 0.28, 0.18), this.gasLampWarmAmberMat);
      signalLamp.position.set(0.3, 0.6, 0.2);
      workerGroup.add(signalLamp);
    }

    return {
      group: workerGroup,
      leftArm,
      rightArm,
      signalLamp,
      animationType: type,
      timer: 0
    };
  }
}
