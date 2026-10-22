import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { CurvedShaderManager } from '../scene/CurvedShader';
import { ObstacleFactory, ObstacleInstance } from './ObstacleFactory';
import { CollectibleFactory, CollectibleInstance } from './CollectibleFactory';
import { TrackPattern } from './ObstaclePatterns';
import { TextureGenerator } from '../scene/TextureGenerator';

export class TrackChunk {
  public group: THREE.Group;
  public chunkZ: number = 0; // World Z position of chunk start
  public length: number = CONSTANTS.CHUNK_LENGTH;

  public obstacles: ObstacleInstance[] = [];
  public collectibles: CollectibleInstance[] = [];

  private static sharedMaterials: {
    ballastMat: THREE.MeshStandardMaterial;
    sleeperMat: THREE.MeshStandardMaterial;
    tiePlateMat: THREE.MeshStandardMaterial;
    railTopMat: THREE.MeshStandardMaterial;
    railSideMat: THREE.MeshStandardMaterial;
    curbMat: THREE.MeshStandardMaterial;
    catenarySteelMat: THREE.MeshStandardMaterial;
    insulatorMat: THREE.MeshStandardMaterial;
    cableMat: THREE.MeshBasicMaterial;
    brickMat1: THREE.MeshStandardMaterial;
    brickMat2: THREE.MeshStandardMaterial;
    concreteMat: THREE.MeshStandardMaterial;
    modernGlassMat: THREE.MeshStandardMaterial;
    darkSteelMat: THREE.MeshStandardMaterial;
    accentTrimMat: THREE.MeshStandardMaterial;
    graffitiMat1: THREE.MeshBasicMaterial;
    graffitiMat2: THREE.MeshBasicMaterial;
  } | null = null;

  constructor(
    private obstacleFactory: ObstacleFactory,
    private collectibleFactory: CollectibleFactory
  ) {
    this.group = new THREE.Group();
    this.initSharedMaterials();
    this.buildStaticTrackGeometry();
  }

  private initSharedMaterials(): void {
    if (TrackChunk.sharedMaterials) return;
    const curved = CurvedShaderManager.getInstance();

    const ballastTex = TextureGenerator.getBallastTexture();
    const ballastMat = new THREE.MeshStandardMaterial({
      map: ballastTex,
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.1
    });
    curved.applyCurvature(ballastMat);

    const sleeperMat = new THREE.MeshStandardMaterial({
      color: 0x42362b, // Dark weathered creosote timber
      roughness: 0.85,
      metalness: 0.15
    });
    curved.applyCurvature(sleeperMat);

    const tiePlateMat = new THREE.MeshStandardMaterial({
      color: 0x212529, // Steel tie plate
      roughness: 0.6,
      metalness: 0.8
    });
    curved.applyCurvature(tiePlateMat);

    // Chrome steel top of rail where train wheels polish it
    const railTopMat = new THREE.MeshStandardMaterial({
      color: 0xe0e6ed,
      metalness: 0.95,
      roughness: 0.15
    });
    curved.applyCurvature(railTopMat);

    // Weathered steel sides of rail
    const railSideMat = new THREE.MeshStandardMaterial({
      color: 0x4a444d,
      metalness: 0.8,
      roughness: 0.6
    });
    curved.applyCurvature(railSideMat);

    const concreteTex = TextureGenerator.getConcreteTexture();
    const curbMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      color: 0xdde2e6,
      roughness: 0.85,
      metalness: 0.1
    });
    curved.applyCurvature(curbMat);

    const catenarySteelMat = new THREE.MeshStandardMaterial({
      color: 0x455a64,
      roughness: 0.45,
      metalness: 0.75
    });
    curved.applyCurvature(catenarySteelMat);

    const insulatorMat = new THREE.MeshStandardMaterial({
      color: 0x81d4fa, // Ceramic porcelain turquoise
      roughness: 0.2,
      metalness: 0.3
    });
    curved.applyCurvature(insulatorMat);

    const cableMat = new THREE.MeshBasicMaterial({
      color: 0x263238
    });

    const brickTex1 = TextureGenerator.getBrickTexture('#c0392b'); // Classic red brick
    const brickMat1 = new THREE.MeshStandardMaterial({
      map: brickTex1,
      roughness: 0.75,
      metalness: 0.05
    });
    curved.applyCurvature(brickMat1);

    const brickTex2 = TextureGenerator.getBrickTexture('#d35400'); // Warm amber brick
    const brickMat2 = new THREE.MeshStandardMaterial({
      map: brickTex2,
      roughness: 0.75,
      metalness: 0.05
    });
    curved.applyCurvature(brickMat2);

    const concreteMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      color: 0x78909c,
      roughness: 0.7,
      metalness: 0.2
    });
    curved.applyCurvature(concreteMat);

    const modernGlassMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      roughness: 0.1,
      metalness: 0.85
    });
    curved.applyCurvature(modernGlassMat);

    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x1f242e,
      roughness: 0.5,
      metalness: 0.8
    });
    curved.applyCurvature(darkSteelMat);

    const accentTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf39c12, // Architectural warm gold accent
      roughness: 0.4,
      metalness: 0.5
    });
    curved.applyCurvature(accentTrimMat);

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

    TrackChunk.sharedMaterials = {
      ballastMat,
      sleeperMat,
      tiePlateMat,
      railTopMat,
      railSideMat,
      curbMat,
      catenarySteelMat,
      insulatorMat,
      cableMat,
      brickMat1,
      brickMat2,
      concreteMat,
      modernGlassMat,
      darkSteelMat,
      accentTrimMat,
      graffitiMat1,
      graffitiMat2
    };
  }

  private buildStaticTrackGeometry(): void {
    const mats = TrackChunk.sharedMaterials!;
    const roadbedWidth = CONSTANTS.LANE_WIDTH * 3 + 2.8; // 13.6m

    // 1. Ballast Roadbed Base (High-detail crushed stone)
    const roadbedGeo = new THREE.BoxGeometry(roadbedWidth, 0.45, this.length);
    const roadbed = new THREE.Mesh(roadbedGeo, mats.ballastMat);
    roadbed.position.set(0, -0.22, -this.length * 0.5);
    roadbed.receiveShadow = true;
    this.group.add(roadbed);

    // 2. Concrete Trackside Retaining Curbs
    const curbWidth = 0.5;
    const curbHeight = 0.55;
    const curbGeo = new THREE.BoxGeometry(curbWidth, curbHeight, this.length);

    const leftCurb = new THREE.Mesh(curbGeo, mats.curbMat);
    leftCurb.position.set(-roadbedWidth * 0.5 - curbWidth * 0.5, 0.05, -this.length * 0.5);
    leftCurb.receiveShadow = true;
    this.group.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, mats.curbMat);
    rightCurb.position.set(roadbedWidth * 0.5 + curbWidth * 0.5, 0.05, -this.length * 0.5);
    rightCurb.receiveShadow = true;
    this.group.add(rightCurb);

    // 3. Trackside Brick / Concrete Retaining Walls with Graffiti & Conduits
    this.buildTracksideRetainingWalls(roadbedWidth, curbWidth);

    // 4. Rails & Wooden Sleepers with Tie Plates for all 3 lanes
    const sleeperSpacing = 1.4;
    const sleeperCount = Math.floor(this.length / sleeperSpacing);
    const sleeperGeo = new THREE.BoxGeometry(CONSTANTS.LANE_WIDTH * 0.82, 0.16, 0.36);
    const tiePlateGeo = new THREE.BoxGeometry(0.24, 0.04, 0.38);

    const railGauge = 1.6; // Distance between rails in lane
    const railHeadW = 0.12;
    const railHeadH = 0.18;
    const railGeo = new THREE.BoxGeometry(railHeadW, railHeadH, this.length);

    CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
      // Chrome polished steel running rails (left & right rail per lane)
      const leftRail = new THREE.Mesh(railGeo, mats.railTopMat);
      leftRail.position.set(laneX - railGauge * 0.5, railHeadH * 0.5 + 0.05, -this.length * 0.5);
      leftRail.castShadow = true;
      leftRail.receiveShadow = true;
      this.group.add(leftRail);

      const rightRail = new THREE.Mesh(railGeo, mats.railTopMat);
      rightRail.position.set(laneX + railGauge * 0.5, railHeadH * 0.5 + 0.05, -this.length * 0.5);
      rightRail.castShadow = true;
      rightRail.receiveShadow = true;
      this.group.add(rightRail);

      // Sleepers & Tie Plates along lane
      for (let s = 0; s < sleeperCount; s++) {
        const sz = -s * sleeperSpacing - sleeperSpacing * 0.5;

        const sleeper = new THREE.Mesh(sleeperGeo, mats.sleeperMat);
        sleeper.position.set(laneX, 0.06, sz);
        sleeper.receiveShadow = true;
        this.group.add(sleeper);

        // Left & right steel tie plates under rails
        const leftPlate = new THREE.Mesh(tiePlateGeo, mats.tiePlateMat);
        leftPlate.position.set(laneX - railGauge * 0.5, 0.14, sz);
        this.group.add(leftPlate);

        const rightPlate = new THREE.Mesh(tiePlateGeo, mats.tiePlateMat);
        rightPlate.position.set(laneX + railGauge * 0.5, 0.14, sz);
        this.group.add(rightPlate);
      }
    });

    // 5. Overhead Catenary Steel Truss Gantries & Power Cables
    this.buildCatenarySystem();

    // 6. Modular Urban Architecture & Streetscape
    this.buildModularCity();

    // 7. Occasional Elevated Bridge / Tunnel Feature
    this.buildSpecialArchitecturalFeature();
  }

  /**
   * Builds trackside retaining wall with street graffiti, safety handrails, conduits and transformers
   */
  private buildTracksideRetainingWalls(roadbedWidth: number, curbWidth: number): void {
    const mats = TrackChunk.sharedMaterials!;
    const wallHeight = 2.4;
    const wallThick = 0.6;
    const wallX = roadbedWidth * 0.5 + curbWidth + wallThick * 0.5 + 0.2;
    const wallGeo = new THREE.BoxGeometry(wallThick, wallHeight, this.length);

    // Left & Right brick retaining walls
    const leftWall = new THREE.Mesh(wallGeo, mats.brickMat1);
    leftWall.position.set(-wallX, wallHeight * 0.5, -this.length * 0.5);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.group.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, mats.brickMat2);
    rightWall.position.set(wallX, wallHeight * 0.5, -this.length * 0.5);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.group.add(rightWall);

    // Stone coping cap along top of retaining walls
    const capGeo = new THREE.BoxGeometry(wallThick + 0.15, 0.18, this.length);
    const leftCap = new THREE.Mesh(capGeo, mats.curbMat);
    leftCap.position.set(-wallX, wallHeight + 0.09, -this.length * 0.5);
    this.group.add(leftCap);

    const rightCap = new THREE.Mesh(capGeo, mats.curbMat);
    rightCap.position.set(wallX, wallHeight + 0.09, -this.length * 0.5);
    this.group.add(rightCap);

    // Yellow safety handrail on top of wall
    const railPostGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6);
    const railBarGeo = new THREE.BoxGeometry(0.06, 0.06, this.length);
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffd600, roughness: 0.3 });

    [-wallX, wallX].forEach((wx) => {
      const topBar = new THREE.Mesh(railBarGeo, yellowMat);
      topBar.position.set(wx, wallHeight + 0.8, -this.length * 0.5);
      this.group.add(topBar);

      // Stanchion posts every 6m
      for (let z = 0; z < this.length; z += 6) {
        const post = new THREE.Mesh(railPostGeo, yellowMat);
        post.position.set(wx, wallHeight + 0.45, -z - 3);
        this.group.add(post);
      }
    });

    // Street graffiti decals placed along retaining walls
    const decalGeo = new THREE.PlaneGeometry(6.0, 1.8);

    const decal1 = new THREE.Mesh(decalGeo, mats.graffitiMat1);
    decal1.rotation.y = Math.PI / 2;
    decal1.position.set(-wallX + wallThick * 0.5 + 0.02, 1.3, -this.length * 0.3);
    this.group.add(decal1);

    const decal2 = new THREE.Mesh(decalGeo, mats.graffitiMat2);
    decal2.rotation.y = -Math.PI / 2;
    decal2.position.set(wallX - wallThick * 0.5 - 0.02, 1.3, -this.length * 0.7);
    this.group.add(decal2);

    // Industrial electrical conduits & transformers along wall
    const pipeGeo = new THREE.CylinderGeometry(0.06, 0.06, this.length, 8);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8 });
    const leftPipe = new THREE.Mesh(pipeGeo, pipeMat);
    leftPipe.rotation.x = Math.PI / 2;
    leftPipe.position.set(-wallX + wallThick * 0.5 + 0.08, 0.65, -this.length * 0.5);
    this.group.add(leftPipe);

    // Trackside utility transformer cabinet
    const transGeo = new THREE.BoxGeometry(0.8, 1.4, 1.1);
    const transMat = new THREE.MeshStandardMaterial({ color: 0x546e7a, metalness: 0.6 });
    const trans = new THREE.Mesh(transGeo, transMat);
    trans.position.set(-wallX + wallThick * 0.5 + 0.5, 0.7, -this.length * 0.55);
    trans.castShadow = true;
    this.group.add(trans);
  }

  /**
   * Builds realistic steel truss catenary gantries with insulator bells and overhead cables
   */
  private buildCatenarySystem(): void {
    const mats = TrackChunk.sharedMaterials!;
    const gantrySpacing = 26.0;
    const gantryCount = Math.floor(this.length / gantrySpacing);
    const poleHeight = 7.8;
    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 3.8;

    for (let g = 0; g < gantryCount; g++) {
      const gz = -g * gantrySpacing - 13.0;
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, gz);

      // Left & Right steel lattice vertical columns
      const colGeo = new THREE.BoxGeometry(0.4, poleHeight, 0.4);
      [-spanWidth * 0.5, spanWidth * 0.5].forEach((cx) => {
        const col = new THREE.Mesh(colGeo, mats.catenarySteelMat);
        col.position.set(cx, poleHeight * 0.5, 0);
        col.castShadow = true;
        gantryGroup.add(col);

        // Heavy concrete base pedestal
        const pedGeo = new THREE.BoxGeometry(0.7, 0.8, 0.7);
        const ped = new THREE.Mesh(pedGeo, mats.concreteMat);
        ped.position.set(cx, 0.4, 0);
        gantryGroup.add(ped);
      });

      // Overhead steel horizontal truss girder
      const girderGeo = new THREE.BoxGeometry(spanWidth + 0.6, 0.55, 0.45);
      const girder = new THREE.Mesh(girderGeo, mats.catenarySteelMat);
      girder.position.set(0, poleHeight - 0.28, 0);
      girder.castShadow = true;
      gantryGroup.add(girder);

      // Diagonal corner truss braces
      const braceGeo = new THREE.BoxGeometry(0.1, 1.4, 0.1);
      [-spanWidth * 0.5 + 0.5, spanWidth * 0.5 - 0.5].forEach((bx, idx) => {
        const brace = new THREE.Mesh(braceGeo, mats.catenarySteelMat);
        brace.rotation.z = idx === 0 ? Math.PI / 4 : -Math.PI / 4;
        brace.position.set(bx, poleHeight - 0.8, 0);
        gantryGroup.add(brace);
      });

      // Suspended Ceramic Insulator Bells & 3-Aspect Signal Lights over each lane
      CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
        // Ribbed insulator bell
        const insGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 8);
        const ins = new THREE.Mesh(insGeo, mats.insulatorMat);
        ins.position.set(laneX, poleHeight - 0.75, 0);
        gantryGroup.add(ins);

        // 3-Aspect Railway Signal Box
        const sigGeo = new THREE.BoxGeometry(0.4, 0.85, 0.28);
        const sig = new THREE.Mesh(sigGeo, mats.darkSteelMat);
        sig.position.set(laneX, poleHeight - 1.15, 0.12);
        gantryGroup.add(sig);

        // Green signal lamp lens
        const lensGeo = new THREE.CircleGeometry(0.1, 10);
        const greenMat = new THREE.MeshBasicMaterial({ color: 0x00e676 });
        const greenLens = new THREE.Mesh(lensGeo, greenMat);
        greenLens.position.set(laneX, poleHeight - 1.05, 0.27);
        gantryGroup.add(greenLens);
      });

      this.group.add(gantryGroup);
    }

    // Overhead catenary contact power cables stretching along the chunk for each lane
    CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
      const cableGeo = new THREE.CylinderGeometry(0.02, 0.02, this.length, 6);
      const cable = new THREE.Mesh(cableGeo, mats.cableMat);
      cable.rotation.x = Math.PI / 2;
      cable.position.set(laneX, poleHeight - 1.0, -this.length * 0.5);
      this.group.add(cable);
    });
  }

  /**
   * Modular Urban Cityscape featuring 3 distinct building families set back from tracks
   */
  private buildModularCity(): void {
    const mats = TrackChunk.sharedMaterials!;
    const setback = 10.5; // Generous setback from center
    const numBuildings = 5;
    const lotLength = this.length / numBuildings;

    for (let b = 0; b < numBuildings; b++) {
      const bz = -b * lotLength - lotLength * 0.5;
      const bStyle = (b + Math.floor(Math.abs(this.chunkZ / 80))) % 3;

      // Left building & Right building
      [-1, 1].forEach((side) => {
        const bGroup = new THREE.Group();
        const bX = side * (setback + 5.5 + (side > 0 ? 0.5 : 0));
        bGroup.position.set(bX, 0, bz);

        if (bStyle === 0) {
          // --- FAMILY 1: Classic Brick Brownstone Apartment ---
          const bW = 10.0;
          const bH = 16.0 + (b % 3) * 4.0;
          const bD = lotLength * 0.94;

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.brickMat1);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          mainBody.receiveShadow = true;
          bGroup.add(mainBody);

          // Classical cornice roof parapet
          const cornice = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.6, 0.6, bD + 0.6), mats.curbMat);
          cornice.position.y = bH + 0.3;
          bGroup.add(cornice);

          // Rooftop Cedar Water Tower on Steel Stilts
          const tower = this.createRooftopWaterTower();
          tower.position.set(side * 1.5, bH + 0.6, 0);
          bGroup.add(tower);

          // Fire escape platforms on facade facing tracks
          const feW = 1.6;
          const feD = bD * 0.6;
          const feGeo = new THREE.BoxGeometry(feW, 0.1, feD);
          for (let f = 4; f < bH; f += 4.5) {
            const platform = new THREE.Mesh(feGeo, mats.darkSteelMat);
            platform.position.set(-side * (bW * 0.5 + feW * 0.5 - 0.1), f, 0);
            bGroup.add(platform);
          }
        } else if (bStyle === 1) {
          // --- FAMILY 2: Modern Glass & Concrete Commercial Mid-Rise ---
          const bW = 11.0;
          const bH = 22.0 + ((b * 2) % 4) * 3.0;
          const bD = lotLength * 0.92;

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.concreteMat);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          mainBody.receiveShadow = true;
          bGroup.add(mainBody);

          // Ribbon glass window facade
          const glassGeo = new THREE.BoxGeometry(bW + 0.05, bH * 0.8, bD * 0.75);
          const glass = new THREE.Mesh(glassGeo, mats.modernGlassMat);
          glass.position.y = bH * 0.5;
          bGroup.add(glass);

          // Rooftop Telecommunication Antennas & HVAC Penthouse
          const antenna = this.createRooftopAntenna();
          antenna.position.set(0, bH, 0);
          bGroup.add(antenna);
        } else {
          // --- FAMILY 3: Industrial Rail Warehouse & Brick Depot ---
          const bW = 12.0;
          const bH = 12.0 + (b % 2) * 3.0;
          const bD = lotLength * 0.95;

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.brickMat2);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          mainBody.receiveShadow = true;
          bGroup.add(mainBody);

          // Pitched industrial roof
          const roofGeo = new THREE.CylinderGeometry(0.1, bW * 0.65, bH * 0.25, 4);
          const roof = new THREE.Mesh(roofGeo, mats.catenarySteelMat);
          roof.rotation.y = Math.PI / 4;
          roof.scale.set(1.0, 1.0, bD / (bW * 0.65));
          roof.position.set(0, bH + bH * 0.12, 0);
          bGroup.add(roof);

          // Industrial exhaust vents on roof
          const ventGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.8, 8);
          const vent = new THREE.Mesh(ventGeo, mats.catenarySteelMat);
          vent.position.set(side * 2.0, bH + 1.2, -bD * 0.2);
          bGroup.add(vent);
        }

        this.group.add(bGroup);
      });
    }
  }

  /**
   * Occasional elevated roadway bridge or highway overpass crossing high above tracks
   */
  private buildSpecialArchitecturalFeature(): void {
    const mats = TrackChunk.sharedMaterials!;
    // Place an elevated road bridge on alternate chunks (e.g. chunk index % 2 === 1)
    const chunkIdx = Math.floor(Math.abs(this.chunkZ / this.length));
    if (chunkIdx % 2 !== 1) return;

    const bridgeHeight = 8.5; // High clearance above trains and gantries
    const bridgeWidth = 9.0;
    const bridgeSpan = 32.0;

    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, bridgeHeight, -this.length * 0.5);

    // Main steel deck girder
    const deckGeo = new THREE.BoxGeometry(bridgeSpan, 1.2, bridgeWidth);
    const deck = new THREE.Mesh(deckGeo, mats.concreteMat);
    deck.castShadow = true;
    deck.receiveShadow = true;
    bridgeGroup.add(deck);

    // Highway crash barriers along bridge deck
    const barrierGeo = new THREE.BoxGeometry(bridgeSpan, 0.8, 0.25);
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffd600 });
    [-bridgeWidth * 0.5 + 0.15, bridgeWidth * 0.5 - 0.15].forEach((bz) => {
      const b = new THREE.Mesh(barrierGeo, yellowMat);
      b.position.set(0, 0.9, bz);
      bridgeGroup.add(b);
    });

    // Heavy concrete bridge support piers outside tracks
    const pierGeo = new THREE.BoxGeometry(1.6, bridgeHeight, 3.5);
    [-bridgeSpan * 0.38, bridgeSpan * 0.38].forEach((px) => {
      const pier = new THREE.Mesh(pierGeo, mats.concreteMat);
      pier.position.set(px, -bridgeHeight * 0.5, 0);
      pier.castShadow = true;
      bridgeGroup.add(pier);
    });

    this.group.add(bridgeGroup);
  }

  /**
   * Helper to create rooftop water tower
   */
  private createRooftopWaterTower(): THREE.Group {
    const tower = new THREE.Group();
    const mats = TrackChunk.sharedMaterials!;

    // 4 steel stilt legs
    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6);
    [-0.6, 0.6].forEach((x) => {
      [-0.6, 0.6].forEach((z) => {
        const leg = new THREE.Mesh(legGeo, mats.darkSteelMat);
        leg.position.set(x, 1.1, z);
        tower.add(leg);
      });
    });

    // Cedar barrel tank
    const tankGeo = new THREE.CylinderGeometry(1.1, 1.1, 2.0, 14);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.85 });
    CurvedShaderManager.getInstance().applyCurvature(woodMat);
    const tank = new THREE.Mesh(tankGeo, woodMat);
    tank.position.y = 3.2;
    tank.castShadow = true;
    tower.add(tank);

    // Conical roof cap
    const capGeo = new THREE.ConeGeometry(1.25, 0.8, 14);
    const cap = new THREE.Mesh(capGeo, mats.darkSteelMat);
    cap.position.y = 4.6;
    tower.add(cap);

    return tower;
  }

  /**
   * Helper to create rooftop antenna tower
   */
  private createRooftopAntenna(): THREE.Group {
    const ant = new THREE.Group();
    const mats = TrackChunk.sharedMaterials!;

    // Mast
    const mastGeo = new THREE.CylinderGeometry(0.05, 0.12, 4.5, 6);
    const mast = new THREE.Mesh(mastGeo, mats.darkSteelMat);
    mast.position.y = 2.25;
    ant.add(mast);

    // Red warning beacon on top
    const beaconGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 4.55;
    ant.add(beacon);

    return ant;
  }

  /**
   * Populate chunk with curated obstacle and collectible patterns
   */
  public populate(pattern: TrackPattern, worldZ: number): void {
    this.chunkZ = worldZ;
    this.group.position.z = worldZ;

    // Clear previous dynamic items
    this.clearDynamicItems();

    // Spawn Obstacles from pattern
    for (const obsData of pattern.obstacles) {
      let group: THREE.Group;
      const laneX = CONSTANTS.LANES[obsData.lane];
      const localZ = -obsData.zOffset;
      const length = obsData.length || 2.0;

      if (obsData.type === 'TRAIN') {
        const colors = [
          CONSTANTS.COLORS.TRAIN_BODY_1,
          CONSTANTS.COLORS.TRAIN_BODY_2,
          CONSTANTS.COLORS.TRAIN_BODY_3
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        group = this.obstacleFactory.createTrain(length, obsData.hasRamp, color);
      } else if (obsData.type === 'LOW_BARRIER') {
        group = this.obstacleFactory.createLowBarrier();
      } else {
        group = this.obstacleFactory.createHighBarrier();
      }

      group.position.set(laneX, 0, localZ);
      this.group.add(group);

      // Construct accurate collision volumes
      const collider = new THREE.Box3();
      const nearMissBox = new THREE.Box3();
      let roofCollider: THREE.Box3 | undefined;
      let rampCollider: THREE.Box3 | undefined;

      const halfW = (obsData.type === 'TRAIN' ? CONSTANTS.TRAIN_WIDTH : CONSTANTS.LANE_WIDTH * 0.85) * 0.5;
      const height = obsData.type === 'TRAIN' ? CONSTANTS.TRAIN_HEIGHT : (obsData.type === 'LOW_BARRIER' ? CONSTANTS.LOW_BARRIER_HEIGHT : CONSTANTS.HIGH_BARRIER_HEIGHT);
      const halfD = length * 0.5;

      // Note: Coordinates in world space when updating in TrackManager
      collider.min.set(laneX - halfW, 0, localZ - halfD);
      collider.max.set(laneX + halfW, height, localZ + halfD);

      if (obsData.type === 'TRAIN') {
        roofCollider = new THREE.Box3(
          new THREE.Vector3(laneX - halfW * 0.9, height * 0.9, localZ - halfD),
          new THREE.Vector3(laneX + halfW * 0.9, height + 0.6, localZ + halfD)
        );

        if (obsData.hasRamp) {
          const rampD = CONSTANTS.TRAIN_RAMP_LENGTH;
          rampCollider = new THREE.Box3(
            new THREE.Vector3(laneX - halfW * 0.85, 0, localZ + halfD),
            new THREE.Vector3(laneX + halfW * 0.85, height, localZ + halfD + rampD)
          );
        }
      }

      nearMissBox.min.set(laneX - halfW - 0.6, 0, localZ - halfD - 0.6);
      nearMissBox.max.set(laneX + halfW + 0.6, height + 0.6, localZ + halfD + 0.6);

      this.obstacles.push({
        group,
        type: obsData.type,
        lane: obsData.lane,
        collider,
        roofCollider,
        rampCollider,
        nearMissBox,
        nearMissTriggered: false,
        active: true,
        hasRamp: obsData.hasRamp
      });
    }

    // Spawn Collectibles from pattern
    for (const colData of pattern.collectibles) {
      const laneX = CONSTANTS.LANES[colData.lane];
      const localZ = -colData.zOffset;
      const baseY = colData.yOffset || 0.8;

      let group: THREE.Group;
      if (colData.type === 'COIN') {
        group = this.collectibleFactory.createCoin();
      } else {
        group = this.collectibleFactory.createPowerup(colData.type);
      }

      group.position.set(laneX, baseY, localZ);
      this.group.add(group);

      const collider = new THREE.Box3();
      const radius = CONSTANTS.COIN_RADIUS;
      collider.min.set(laneX - radius, baseY - radius, localZ - radius);
      collider.max.set(laneX + radius, baseY + radius, localZ + radius);

      this.collectibles.push({
        group,
        type: colData.type,
        lane: colData.lane,
        collider,
        active: true,
        baseY
      });
    }
  }

  public update(dt: number, time: number): void {
    // Animate coin rotation and powerup bobbing
    for (const col of this.collectibles) {
      if (!col.active) continue;
      col.group.rotation.y += CONSTANTS.COIN_ROTATION_SPEED * dt;
      col.group.position.y = col.baseY + Math.sin(time * 3.5 + col.group.position.z * 0.1) * 0.12;
    }
  }

  public clearDynamicItems(): void {
    for (const obs of this.obstacles) {
      this.group.remove(obs.group);
    }
    this.obstacles = [];

    for (const col of this.collectibles) {
      this.group.remove(col.group);
    }
    this.collectibles = [];
  }
}
