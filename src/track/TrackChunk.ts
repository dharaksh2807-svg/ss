import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';
import { CurvedShaderManager } from '../scene/CurvedShader';
import { ObstacleFactory, ObstacleInstance, getTrainAccessibilityProfile } from './ObstacleFactory';
import { CollectibleFactory, CollectibleInstance } from './CollectibleFactory';
import { TrackPattern } from './ObstaclePatterns';
import { TextureGenerator } from '../scene/TextureGenerator';
import { PacingMetrics } from './PacingMetrics';

export class TrackChunk {
  public group: THREE.Group;
  public chunkZ: number = 0; // World Z position of chunk start
  public length: number = CONSTANTS.CHUNK_LENGTH;

  public obstacles: ObstacleInstance[] = [];
  public collectibles: CollectibleInstance[] = [];
  public chunkHadCollision: boolean = false;
  public decorativeGroup: THREE.Group;

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

  private static sleeperGeo: THREE.BoxGeometry | null = null;
  private static tiePlateGeo: THREE.BoxGeometry | null = null;
  private static railGeo: THREE.BoxGeometry | null = null;

  constructor(
    private obstacleFactory: ObstacleFactory,
    private collectibleFactory: CollectibleFactory
  ) {
    this.group = new THREE.Group();
    this.decorativeGroup = new THREE.Group();
    this.decorativeGroup.name = 'chunk_decorative_scenery';
    this.group.add(this.decorativeGroup);
    this.initSharedMaterials();
    this.buildStaticTrackGeometry();
  }

  public setSceneryDetail(detail: 'FULL' | 'BALANCED' | 'MINIMAL'): void {
    if (detail === 'MINIMAL') {
      this.decorativeGroup.visible = false;
    } else {
      this.decorativeGroup.visible = true;
    }
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

    // 4. Rails & Wooden Sleepers with Tie Plates for all 3 lanes using InstancedMesh
    const sleeperSpacing = 1.4;
    const sleeperCount = Math.floor(this.length / sleeperSpacing);
    const railGauge = 1.6; // Distance between rails in lane
    const railHeadW = 0.12;
    const railHeadH = 0.18;

    if (!TrackChunk.sleeperGeo) {
      TrackChunk.sleeperGeo = new THREE.BoxGeometry(CONSTANTS.LANE_WIDTH * 0.82, 0.16, 0.36);
      TrackChunk.tiePlateGeo = new THREE.BoxGeometry(0.24, 0.04, 0.38);
      TrackChunk.railGeo = new THREE.BoxGeometry(railHeadW, railHeadH, this.length);
    }

    const totalSleepers = sleeperCount * CONSTANTS.LANE_POSITIONS.length;
    const totalTiePlates = totalSleepers * 2;

    const sleeperInstanced = new THREE.InstancedMesh(TrackChunk.sleeperGeo!, mats.sleeperMat, totalSleepers);
    sleeperInstanced.receiveShadow = true;
    this.group.add(sleeperInstanced);

    const tiePlateInstanced = new THREE.InstancedMesh(TrackChunk.tiePlateGeo!, mats.tiePlateMat, totalTiePlates);
    tiePlateInstanced.receiveShadow = true;
    this.group.add(tiePlateInstanced);

    const dummy = new THREE.Object3D();
    let sleeperIdx = 0;
    let tiePlateIdx = 0;

    CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
      // Chrome polished steel running rails (left & right rail per lane)
      const leftRail = new THREE.Mesh(TrackChunk.railGeo!, mats.railTopMat);
      leftRail.position.set(laneX - railGauge * 0.5, railHeadH * 0.5 + 0.05, -this.length * 0.5);
      leftRail.castShadow = true;
      leftRail.receiveShadow = true;
      this.group.add(leftRail);

      const rightRail = new THREE.Mesh(TrackChunk.railGeo!, mats.railTopMat);
      rightRail.position.set(laneX + railGauge * 0.5, railHeadH * 0.5 + 0.05, -this.length * 0.5);
      rightRail.castShadow = true;
      rightRail.receiveShadow = true;
      this.group.add(rightRail);

      // Sleepers & Tie Plates along lane
      for (let s = 0; s < sleeperCount; s++) {
        const sz = -s * sleeperSpacing - sleeperSpacing * 0.5;

        dummy.position.set(laneX, 0.06, sz);
        dummy.updateMatrix();
        sleeperInstanced.setMatrixAt(sleeperIdx++, dummy.matrix);

        // Left tie plate
        dummy.position.set(laneX - railGauge * 0.5, 0.14, sz);
        dummy.updateMatrix();
        tiePlateInstanced.setMatrixAt(tiePlateIdx++, dummy.matrix);

        // Right tie plate
        dummy.position.set(laneX + railGauge * 0.5, 0.14, sz);
        dummy.updateMatrix();
        tiePlateInstanced.setMatrixAt(tiePlateIdx++, dummy.matrix);
      }
    });

    sleeperInstanced.instanceMatrix.needsUpdate = true;
    tiePlateInstanced.instanceMatrix.needsUpdate = true;

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
      this.decorativeGroup.add(topBar);

      // Stanchion posts every 6m
      for (let z = 0; z < this.length; z += 6) {
        const post = new THREE.Mesh(railPostGeo, yellowMat);
        post.position.set(wx, wallHeight + 0.45, -z - 3);
        this.decorativeGroup.add(post);
      }
    });

    // Street graffiti decals placed along retaining walls
    const decalGeo = new THREE.PlaneGeometry(6.0, 1.8);

    const decal1 = new THREE.Mesh(decalGeo, mats.graffitiMat1);
    decal1.rotation.y = Math.PI / 2;
    decal1.position.set(-wallX + wallThick * 0.5 + 0.02, 1.3, -this.length * 0.3);
    this.decorativeGroup.add(decal1);

    const decal2 = new THREE.Mesh(decalGeo, mats.graffitiMat2);
    decal2.rotation.y = -Math.PI / 2;
    decal2.position.set(wallX - wallThick * 0.5 - 0.02, 1.3, -this.length * 0.7);
    this.decorativeGroup.add(decal2);

    // Industrial electrical conduits & transformers along wall
    const pipeGeo = new THREE.CylinderGeometry(0.06, 0.06, this.length, 8);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8 });
    const leftPipe = new THREE.Mesh(pipeGeo, pipeMat);
    leftPipe.rotation.x = Math.PI / 2;
    leftPipe.position.set(-wallX + wallThick * 0.5 + 0.08, 0.65, -this.length * 0.5);
    this.decorativeGroup.add(leftPipe);

    // Trackside utility transformer cabinet
    const transGeo = new THREE.BoxGeometry(0.8, 1.4, 1.1);
    const transMat = new THREE.MeshStandardMaterial({ color: 0x546e7a, metalness: 0.6 });
    const trans = new THREE.Mesh(transGeo, transMat);
    trans.position.set(-wallX + wallThick * 0.5 + 0.5, 0.7, -this.length * 0.55);
    trans.castShadow = true;
    this.decorativeGroup.add(trans);
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

      this.decorativeGroup.add(gantryGroup);
    }

    // Overhead catenary contact power cables stretching along the chunk for each lane
    CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
      const cableGeo = new THREE.CylinderGeometry(0.02, 0.02, this.length, 6);
      const cable = new THREE.Mesh(cableGeo, mats.cableMat);
      cable.rotation.x = Math.PI / 2;
      cable.position.set(laneX, poleHeight - 1.0, -this.length * 0.5);
      this.decorativeGroup.add(cable);
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

        this.decorativeGroup.add(bGroup);
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

    this.decorativeGroup.add(bridgeGroup);
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
    this.chunkHadCollision = false;

    // Spawn Obstacles from pattern
    for (const obsData of pattern.obstacles) {
      let group: THREE.Group;
      const laneX = CONSTANTS.LANES[obsData.lane];
      const localZ = -obsData.zOffset;
      const isTrain = obsData.type === 'TRAIN' || obsData.type === 'MOVING_TRAIN' || obsData.type === 'TRAIN_RAMP';
      const hasRamp = !!(obsData.hasRamp || obsData.type === 'TRAIN_RAMP');
      const length = obsData.length || (isTrain ? CONSTANTS.TRAIN_LENGTH_SHORT : 2.0);
      let headlights: THREE.Mesh[] | undefined;

      if (obsData.type === 'TRAIN' || obsData.type === 'TRAIN_RAMP') {
        const colors = [
          CONSTANTS.COLORS.TRAIN_BODY_1,
          CONSTANTS.COLORS.TRAIN_BODY_2,
          CONSTANTS.COLORS.TRAIN_BODY_3
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        group = this.obstacleFactory.createTrain(length, hasRamp, color);
      } else if (obsData.type === 'MOVING_TRAIN') {
        const movingData = this.obstacleFactory.createMovingTrain(length, CONSTANTS.COLORS.TRAIN_BODY_2);
        group = movingData.group;
        headlights = movingData.headlights;
      } else if (obsData.type === 'LOW_BARRIER') {
        group = this.obstacleFactory.createLowBarrier();
      } else if (obsData.type === 'HIGH_BARRIER') {
        group = this.obstacleFactory.createHighBarrier();
      } else if (obsData.type === 'SIDE_BARRIER') {
        group = this.obstacleFactory.createSideBarrier();
      } else if (obsData.type === 'TUNNEL_ARCH') {
        group = this.obstacleFactory.createTunnelArch();
      } else {
        group = this.obstacleFactory.createLowBarrier();
      }

      group.position.set(laneX, 0, localZ);
      this.group.add(group);

      // World Z position of this obstacle center
      const worldCenterZ = this.chunkZ + localZ;

      // Construct accurate separated collision volumes
      const collider = new THREE.Box3();
      const nearMissBox = new THREE.Box3();
      let bodyCollider: THREE.Box3 | undefined;
      let frontBumperCollider: THREE.Box3 | undefined;
      let roofCollider: THREE.Box3 | undefined;
      let rampCollider: THREE.Box3 | undefined;
      let roofSurfaceY: number | undefined;

      let halfW: number;
      let height: number;
      let halfD: number;

      if (isTrain) {
        halfW = CONSTANTS.TRAIN_WIDTH * 0.5;
        height = CONSTANTS.TRAIN_HEIGHT;
        halfD = length * 0.5;
        roofSurfaceY = 4.35; // Exact walkable roof surface (CONSTANTS.TRAIN_HEIGHT + 0.15 = 4.35m)

        // 1. Separate lower train hull lethal zone (below roof)
        bodyCollider = new THREE.Box3(
          new THREE.Vector3(laneX - halfW, 0, worldCenterZ - halfD),
          new THREE.Vector3(laneX + halfW, height - 0.45, worldCenterZ + halfD)
        );

        // 2. Front bumper hazard (active at unsafe heights on non-ramp trains)
        frontBumperCollider = new THREE.Box3(
          new THREE.Vector3(laneX - halfW, 0, worldCenterZ + halfD - 0.25),
          new THREE.Vector3(laneX + halfW, height - 0.45, worldCenterZ + halfD + 0.35)
        );

        // 3. Traversable Roof Platform & Landing Capture Surface
        // Generous deck width + edge margin (halfW + 0.15) to prevent slipping into lethal box at edges,
        // and landing capture Y interval [height - 0.45, height + 1.2]
        roofCollider = new THREE.Box3(
          new THREE.Vector3(laneX - halfW - 0.15, height - 0.45, worldCenterZ - halfD - 0.3),
          new THREE.Vector3(laneX + halfW + 0.15, height + 1.2, worldCenterZ + halfD + 0.3)
        );

        // 4. Sloped Ramp Collider
        if (hasRamp) {
          const rampD = CONSTANTS.TRAIN_RAMP_LENGTH;
          rampCollider = new THREE.Box3(
            new THREE.Vector3(laneX - halfW * 0.92, 0, worldCenterZ + halfD),
            new THREE.Vector3(laneX + halfW * 0.92, roofSurfaceY, worldCenterZ + halfD + rampD)
          );
        }
      } else if (obsData.type === 'LOW_BARRIER') {
        halfW = CONSTANTS.LANE_WIDTH * 0.42;
        height = CONSTANTS.LOW_BARRIER_HEIGHT;
        halfD = 0.35;
      } else if (obsData.type === 'HIGH_BARRIER') {
        halfW = CONSTANTS.LANE_WIDTH * 0.42;
        height = CONSTANTS.HIGH_BARRIER_HEIGHT;
        halfD = 0.35;
      } else if (obsData.type === 'SIDE_BARRIER') {
        halfW = CONSTANTS.SIDE_BARRIER_WIDTH * 0.5;
        height = CONSTANTS.SIDE_BARRIER_HEIGHT;
        halfD = 0.45;
      } else { // TUNNEL_ARCH
        halfW = CONSTANTS.LANE_WIDTH * 0.48;
        height = CONSTANTS.TUNNEL_ARCH_HEIGHT;
        halfD = 0.5;
      }

      collider.min.set(laneX - halfW, 0, worldCenterZ - halfD);
      collider.max.set(laneX + halfW, height, worldCenterZ + halfD);

      nearMissBox.min.set(laneX - halfW - 0.6, 0, worldCenterZ - halfD - 0.6);
      nearMissBox.max.set(laneX + halfW + 0.6, height + 0.6, worldCenterZ + halfD + 0.6);

      const obstacleId = `chunk_${Math.round(worldZ)}_obs_${this.obstacles.length}_${obsData.type}_${obsData.lane}`;
      const rampD = CONSTANTS.TRAIN_RAMP_LENGTH;
      const isMoving = obsData.type === 'MOVING_TRAIN' || !!obsData.isMoving;
      const accessibilityProfile = isTrain ? getTrainAccessibilityProfile(obsData.type, hasRamp, isMoving) : undefined;
      group.userData.accessibilityProfile = accessibilityProfile;

      this.obstacles.push({
        id: obstacleId,
        group,
        type: obsData.type,
        lane: obsData.lane,
        collider,
        bodyCollider,
        frontBumperCollider,
        roofCollider,
        rampCollider,
        roofSurfaceY,
        rampStartZ: hasRamp ? worldCenterZ + halfD + rampD : undefined,
        rampEndZ: hasRamp ? worldCenterZ + halfD : undefined,
        roofStartZ: isTrain ? worldCenterZ + halfD : undefined,
        roofEndZ: isTrain ? worldCenterZ - halfD : undefined,
        accessibilityProfile,
        nearMissBox,
        nearMissTriggered: false,
        active: true,
        hasRamp,
        length,
        variant: group.userData.variant,
        isMoving,
        velocityZ: obsData.velocityZ || CONSTANTS.MOVING_TRAIN_SPEED,
        initialLocalZ: localZ,
        telegraphed: false,
        headlights
      });

      PacingMetrics.getInstance().recordObstacle(
        Math.abs(worldZ - obsData.zOffset) / Math.max(1, CONSTANTS.INITIAL_SPEED),
        obsData.type,
        worldZ - obsData.zOffset
      );
    }

    // Spawn Collectibles from pattern
    for (const colData of pattern.collectibles) {
      const startLaneX = CONSTANTS.LANES[colData.lane];
      const endLaneX = colData.endLane !== undefined ? CONSTANTS.LANES[colData.endLane] : startLaneX;
      const count = colData.count || 1;
      const spacing = colData.spacing || CONSTANTS.COIN_DEFAULT_SPACING;

      for (let c = 0; c < count; c++) {
        const offsetZ = colData.zOffset + c * spacing;
        const localZ = -offsetZ;
        const t = count > 1 ? c / (count - 1) : 0;

        // Smooth lateral interpolation for lane-switch trails (Hermite ease: 3t^2 - 2t^3)
        let posX = startLaneX;
        if (colData.endLane !== undefined && colData.endLane !== colData.lane) {
          const ease = t * t * (3.0 - 2.0 * t);
          posX = startLaneX + (endLaneX - startLaneX) * ease;
        }

        // Height calculation based on pattern archetype
        let baseY = colData.yOffset !== undefined ? colData.yOffset : (colData.isSlideGuidance ? CONSTANTS.COIN_SLIDE_Y : CONSTANTS.COIN_GROUND_Y);

        if (colData.isArc && count > 1) {
          // Exact ballistic parabola: ground height (0.85m), peak (colData.yOffset or 2.35m), lands at 0.85m
          const groundY = CONSTANTS.COIN_GROUND_Y;
          const peakY = colData.yOffset !== undefined ? colData.yOffset : CONSTANTS.COIN_JUMP_PEAK_Y;
          baseY = groundY + (peakY - groundY) * 4.0 * t * (1.0 - t);
        } else if (colData.isRampAscent && count > 1) {
          // Smooth ascending coin ramp: starts at 0.85m ground height and ascends continuously up the incline to 5.20m roof height
          const groundY = CONSTANTS.COIN_GROUND_Y;
          const roofY = colData.endYOffset !== undefined ? colData.endYOffset : (colData.yOffset !== undefined ? colData.yOffset : CONSTANTS.COIN_ROOFTOP_Y);
          baseY = groundY + t * (roofY - groundY);
        } else if (colData.endYOffset !== undefined && count > 1) {
          // Custom linear height transition (e.g. descending from roof to ground)
          const startY = colData.yOffset !== undefined ? colData.yOffset : CONSTANTS.COIN_GROUND_Y;
          baseY = startY + t * (colData.endYOffset - startY);
        }

        let group: THREE.Group;
        if (colData.type === 'COIN') {
          group = this.collectibleFactory.createCoin();
        } else if (colData.type === 'SEASON_TOKEN') {
          group = this.collectibleFactory.createSeasonToken();
        } else if (colData.type === 'CHRONO_ORB') {
          group = this.collectibleFactory.createChronoOrb();
        } else {
          group = this.collectibleFactory.createPowerup(colData.type);
        }

        group.position.set(posX, baseY, localZ);
        this.group.add(group);

        const worldColZ = this.chunkZ + localZ;
        const collider = new THREE.Box3();
        const radius = colData.type === 'COIN' ? CONSTANTS.COIN_RADIUS : 0.55;
        collider.min.set(posX - radius, baseY - radius, worldColZ - radius);
        collider.max.set(posX + radius, baseY + radius, worldColZ + radius);

        this.collectibles.push({
          group,
          type: colData.type,
          lane: (colData.endLane !== undefined && t >= 0.5) ? colData.endLane : colData.lane,
          collider,
          active: true,
          baseY,
          initialLocalZ: localZ,
          isMagnetized: false,
          animOffsetY: 0,
          archetype: colData.archetype,
          isRiskRoute: colData.isRiskRoute
        });
      }
    }

    // Occasionally spawn a Seasonal Event Token or Chrono Orb in safe open areas (35% probability)
    if (Math.random() < 0.35) {
      // Pick an open lane
      const safeLanes: LaneIndex[] = [-1, 0, 1];
      const randomLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
      const laneX = CONSTANTS.LANES[randomLane];
      const localZ = -18 - Math.random() * 20;
      const worldTokenZ = this.chunkZ + localZ;
      const baseY = 1.0;

      const group = this.collectibleFactory.createSeasonToken();
      group.position.set(laneX, baseY, localZ);
      this.group.add(group);

      const collider = new THREE.Box3();
      collider.min.set(laneX - 0.5, baseY - 0.5, worldTokenZ - 0.5);
      collider.max.set(laneX + 0.5, baseY + 0.5, worldTokenZ + 0.5);

      this.collectibles.push({
        group,
        type: 'SEASON_TOKEN',
        lane: randomLane,
        collider,
        active: true,
        baseY,
        initialLocalZ: localZ,
        isMagnetized: false,
        animOffsetY: 0
      });
    }
  }

  public update(dt: number, time: number = 0, playerZ: number = 0): void {
    const animTime = typeof time === 'number' && !isNaN(time) ? time : 0;
    // 1. Animate and update moving trains
    for (const obs of this.obstacles) {
      if (!obs.active) continue;

      if (obs.isMoving) {
        // Advance moving train along +Z toward oncoming player
        const speed = obs.velocityZ || CONSTANTS.MOVING_TRAIN_SPEED;
        obs.group.position.z += speed * dt;

        // Recalculate collision volumes in world coordinates
        const currentLocalZ = obs.group.position.z;
        const currentWorldZ = this.chunkZ + currentLocalZ;
        const laneX = CONSTANTS.LANES[obs.lane];
        const halfW = CONSTANTS.TRAIN_WIDTH * 0.5;
        const height = CONSTANTS.TRAIN_HEIGHT;
        const halfD = (obs.length || CONSTANTS.TRAIN_LENGTH_SHORT) * 0.5;

        obs.collider.min.set(laneX - halfW, 0, currentWorldZ - halfD);
        obs.collider.max.set(laneX + halfW, height, currentWorldZ + halfD);

        if (obs.bodyCollider) {
          obs.bodyCollider.min.set(laneX - halfW, 0, currentWorldZ - halfD);
          obs.bodyCollider.max.set(laneX + halfW, height - 0.45, currentWorldZ + halfD);
        }

        if (obs.frontBumperCollider) {
          obs.frontBumperCollider.min.set(laneX - halfW, 0, currentWorldZ + halfD - 0.25);
          obs.frontBumperCollider.max.set(laneX + halfW, height - 0.45, currentWorldZ + halfD + 0.35);
        }

        if (obs.roofCollider) {
          obs.roofCollider.min.set(laneX - halfW - 0.15, height - 0.45, currentWorldZ - halfD - 0.3);
          obs.roofCollider.max.set(laneX + halfW + 0.15, height + 1.2, currentWorldZ + halfD + 0.3);
        }

        if (obs.rampCollider) {
          const rampD = CONSTANTS.TRAIN_RAMP_LENGTH;
          const roofY = obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15);
          obs.rampCollider.min.set(laneX - halfW * 0.92, 0, currentWorldZ + halfD);
          obs.rampCollider.max.set(laneX + halfW * 0.92, roofY, currentWorldZ + halfD + rampD);
          obs.rampStartZ = currentWorldZ + halfD + rampD;
          obs.rampEndZ = currentWorldZ + halfD;
        }

        obs.roofStartZ = currentWorldZ + halfD;
        obs.roofEndZ = currentWorldZ - halfD;

        obs.nearMissBox.min.set(laneX - halfW - 0.6, 0, currentWorldZ - halfD - 0.6);
        obs.nearMissBox.max.set(laneX + halfW + 0.6, height + 0.6, currentWorldZ + halfD + 0.6);

        // Telegraph check: if approaching player within 65m
        const worldTrainFrontZ = this.chunkZ + currentLocalZ + halfD;
        const distToPlayer = worldTrainFrontZ - playerZ;

        // When train is approaching ahead of player (worldTrainFrontZ is negative, player is moving negative Z)
        const separation = Math.abs(playerZ - worldTrainFrontZ);
        if (separation <= CONSTANTS.MOVING_TRAIN_TELEGRAPH_DIST && worldTrainFrontZ < playerZ) {
          if (!obs.telegraphed) {
            EventBus.getInstance().emit(EVENTS.TRAIN_HORN, {
              laneX,
              distance: separation,
              speed: obs.velocityZ || CONSTANTS.MOVING_TRAIN_SPEED
            });
            obs.telegraphed = true;
          }

          // Strobe twin headlights at high frequency (12 Hz)
          if (obs.headlights && obs.headlights.length > 0) {
            const strobe = Math.sin(animTime * 30.0) > 0;
            obs.headlights.forEach((h) => {
              h.visible = strobe;
            });
          }
        }
      }
    }

    // 2. Animate coin rotation and powerup bobbing with synchronized collider
    for (const col of this.collectibles) {
      if (!col.active) continue;

      // Only apply ambient bobbing if not currently magnetized
      if (!col.isMagnetized) {
        const bob = Math.sin(animTime * 3.0 + (col.initialLocalZ || col.group.position.z) * 0.25) * 0.08;
        col.animOffsetY = bob;
        col.group.position.y = (col.baseY ?? 0.85) + bob;
        col.group.rotation.y += CONSTANTS.COIN_ROTATION_SPEED * dt;
      }

      // Synchronize world-space collider with authoritative rendering position
      const worldX = col.group.position.x;
      const worldY = col.group.position.y;
      const worldZ = this.chunkZ + col.group.position.z;
      const r = col.type === 'COIN' ? CONSTANTS.COIN_RADIUS : 0.55;
      col.collider.min.set(worldX - r, worldY - r, worldZ - r);
      col.collider.max.set(worldX + r, worldY + r, worldZ + r);
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
