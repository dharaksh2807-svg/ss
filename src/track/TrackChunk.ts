import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';
import { CurvedShaderManager } from '../scene/CurvedShader';
import { ObstacleFactory, ObstacleInstance, getTrainAccessibilityProfile } from './ObstacleFactory';
import { CollectibleFactory, CollectibleInstance } from './CollectibleFactory';
import { TrackPattern } from './ObstaclePatterns';
import { TextureGenerator } from '../scene/TextureGenerator';
import { PacingMetrics } from './PacingMetrics';
import { EnvironmentTheme, EnvironmentManager, MODERN_METRO_THEME, HISTORIC_QUARTER_THEME } from '../environment/EnvironmentConfig';

export class TrackChunk {
  public group: THREE.Group;
  public chunkZ: number = 0; // World Z position of chunk start
  public length: number = CONSTANTS.CHUNK_LENGTH;

  public obstacles: ObstacleInstance[] = [];
  public collectibles: CollectibleInstance[] = [];
  public chunkHadCollision: boolean = false;
  public decorativeGroup: THREE.Group;

  // Environment and theme state
  public currentTheme: EnvironmentTheme = MODERN_METRO_THEME;
  public isTransitionPortal: boolean = false;

  private static sharedMaterials: {
    // Core physical trackbed
    ballastMat: THREE.MeshStandardMaterial;
    sleeperMat: THREE.MeshStandardMaterial;
    tiePlateMat: THREE.MeshStandardMaterial;
    railTopMat: THREE.MeshStandardMaterial;
    railSideMat: THREE.MeshStandardMaterial;
    curbMat: THREE.MeshStandardMaterial;
    // Modern Metro District
    modernGlassMat: THREE.MeshStandardMaterial;
    modernConcreteMat: THREE.MeshStandardMaterial;
    modernWhiteMat: THREE.MeshStandardMaterial;
    modernSteelMat: THREE.MeshStandardMaterial;
    modernNeonMat: THREE.MeshBasicMaterial;
    modernSignMat: THREE.MeshBasicMaterial;
    solarPanelMat: THREE.MeshStandardMaterial;
    catenarySteelMat: THREE.MeshStandardMaterial;
    insulatorMat: THREE.MeshStandardMaterial;
    cableMat: THREE.MeshBasicMaterial;
    graffitiMat1: THREE.MeshBasicMaterial;
    graffitiMat2: THREE.MeshBasicMaterial;
    // Historic Railway Quarter
    weatheredBrickMat1: THREE.MeshStandardMaterial;
    weatheredBrickMat2: THREE.MeshStandardMaterial;
    stoneMasonryMat: THREE.MeshStandardMaterial;
    copperPatinaMat: THREE.MeshStandardMaterial;
    castIronMat: THREE.MeshStandardMaterial;
    gasLampMat: THREE.MeshBasicMaterial;
    slateRoofMat: THREE.MeshStandardMaterial;
    historicSignMat: THREE.MeshBasicMaterial;
    earthenwareInsulatorMat: THREE.MeshStandardMaterial;
    copperCableMat: THREE.MeshBasicMaterial;
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

    const envManager = EnvironmentManager.getInstance();
    this.currentTheme = envManager.getTheme(envManager.getStartingEnvironment());

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

    // 1. Core Railway Trackbed
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

    const railTopMat = new THREE.MeshStandardMaterial({
      color: 0xe0e6ed,
      metalness: 0.95,
      roughness: 0.15
    });
    curved.applyCurvature(railTopMat);

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

    // 2. Modern Metro Materials
    const modernGlassMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      roughness: 0.1,
      metalness: 0.85
    });
    curved.applyCurvature(modernGlassMat);

    const modernConcreteMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      color: 0x78909c,
      roughness: 0.7,
      metalness: 0.2
    });
    curved.applyCurvature(modernConcreteMat);

    const modernWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xe8edf2,
      roughness: 0.45,
      metalness: 0.15
    });
    curved.applyCurvature(modernWhiteMat);

    const modernSteelMat = new THREE.MeshStandardMaterial({
      color: 0x1f242e,
      roughness: 0.5,
      metalness: 0.8
    });
    curved.applyCurvature(modernSteelMat);

    const modernNeonMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff
    });

    const modernSignMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getModernMetroSignTexture('METRO CENTRAL', 'LINE 1')
    });

    const solarPanelMat = new THREE.MeshStandardMaterial({
      color: 0x152238,
      roughness: 0.2,
      metalness: 0.9
    });
    curved.applyCurvature(solarPanelMat);

    const catenarySteelMat = new THREE.MeshStandardMaterial({
      color: 0x455a64,
      roughness: 0.45,
      metalness: 0.75
    });
    curved.applyCurvature(catenarySteelMat);

    const insulatorMat = new THREE.MeshStandardMaterial({
      color: 0x81d4fa,
      roughness: 0.2,
      metalness: 0.3
    });
    curved.applyCurvature(insulatorMat);

    const cableMat = new THREE.MeshBasicMaterial({
      color: 0x263238
    });

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

    // 3. Historic Railway Quarter Materials
    const weatheredBrickMat1 = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getWeatheredBrickTexture(),
      roughness: 0.85,
      metalness: 0.05
    });
    curved.applyCurvature(weatheredBrickMat1);

    const brickTex2 = TextureGenerator.getBrickTexture('#a04030');
    const weatheredBrickMat2 = new THREE.MeshStandardMaterial({
      map: brickTex2,
      roughness: 0.82,
      metalness: 0.08
    });
    curved.applyCurvature(weatheredBrickMat2);

    const stoneMasonryMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getStoneMasonryTexture(),
      roughness: 0.88,
      metalness: 0.1
    });
    curved.applyCurvature(stoneMasonryMat);

    const copperPatinaMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getCopperPatinaTexture(),
      roughness: 0.6,
      metalness: 0.35
    });
    curved.applyCurvature(copperPatinaMat);

    const castIronMat = new THREE.MeshStandardMaterial({
      color: 0x212121,
      roughness: 0.7,
      metalness: 0.85
    });
    curved.applyCurvature(castIronMat);

    const gasLampMat = new THREE.MeshBasicMaterial({
      color: 0xffe082
    });

    const slateRoofMat = new THREE.MeshStandardMaterial({
      color: 0x37474f,
      roughness: 0.65,
      metalness: 0.25
    });
    curved.applyCurvature(slateRoofMat);

    const historicSignMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getHistoricSignTexture('GRAND CENTRAL')
    });

    const earthenwareInsulatorMat = new THREE.MeshStandardMaterial({
      color: 0x8d6e63,
      roughness: 0.5,
      metalness: 0.2
    });
    curved.applyCurvature(earthenwareInsulatorMat);

    const copperCableMat = new THREE.MeshBasicMaterial({
      color: 0x4e342e
    });

    TrackChunk.sharedMaterials = {
      ballastMat,
      sleeperMat,
      tiePlateMat,
      railTopMat,
      railSideMat,
      curbMat,
      modernGlassMat,
      modernConcreteMat,
      modernWhiteMat,
      modernSteelMat,
      modernNeonMat,
      modernSignMat,
      solarPanelMat,
      catenarySteelMat,
      insulatorMat,
      cableMat,
      graffitiMat1,
      graffitiMat2,
      weatheredBrickMat1,
      weatheredBrickMat2,
      stoneMasonryMat,
      copperPatinaMat,
      castIronMat,
      gasLampMat,
      slateRoofMat,
      historicSignMat,
      earthenwareInsulatorMat,
      copperCableMat
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

    // 3. Rails & Wooden Sleepers with Tie Plates for all 3 lanes using InstancedMesh
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

    // 4. Build Environment Scenery in decorative group
    this.buildEnvironmentScenery(this.currentTheme, this.isTransitionPortal);
  }

  /**
   * Rebuilds decorative scenery for active environment theme or transition portal
   */
  public buildEnvironmentScenery(theme: EnvironmentTheme, isTransition: boolean = false): void {
    // Clear existing decorative meshes
    while (this.decorativeGroup.children.length > 0) {
      const child = this.decorativeGroup.children[0];
      this.decorativeGroup.remove(child);
    }

    this.currentTheme = theme;
    this.isTransitionPortal = isTransition;

    const roadbedWidth = CONSTANTS.LANE_WIDTH * 3 + 2.8;
    const curbWidth = 0.5;

    if (isTransition) {
      this.buildTransitionPortalScenery(roadbedWidth, curbWidth, theme);
    } else if (theme.id === 'HISTORIC_QUARTER') {
      this.buildHistoricQuarterScenery(roadbedWidth, curbWidth);
    } else {
      this.buildModernMetroScenery(roadbedWidth, curbWidth);
    }
  }

  /**
   * Builds Modern Metro District Scenery: Glass towers, sleek catenaries, modern skybridge, neon accents
   */
  private buildModernMetroScenery(roadbedWidth: number, curbWidth: number): void {
    const mats = TrackChunk.sharedMaterials!;
    const wallHeight = 2.4;
    const wallThick = 0.6;
    const wallX = roadbedWidth * 0.5 + curbWidth + wallThick * 0.5 + 0.2;
    const wallGeo = new THREE.BoxGeometry(wallThick, wallHeight, this.length);

    // Left & Right smooth concrete retaining walls
    const leftWall = new THREE.Mesh(wallGeo, mats.modernConcreteMat);
    leftWall.position.set(-wallX, wallHeight * 0.5, -this.length * 0.5);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.decorativeGroup.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, mats.modernConcreteMat);
    rightWall.position.set(wallX, wallHeight * 0.5, -this.length * 0.5);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.decorativeGroup.add(rightWall);

    // Sleek top coping cap
    const capGeo = new THREE.BoxGeometry(wallThick + 0.15, 0.18, this.length);
    const leftCap = new THREE.Mesh(capGeo, mats.curbMat);
    leftCap.position.set(-wallX, wallHeight + 0.09, -this.length * 0.5);
    this.decorativeGroup.add(leftCap);

    const rightCap = new THREE.Mesh(capGeo, mats.curbMat);
    rightCap.position.set(wallX, wallHeight + 0.09, -this.length * 0.5);
    this.decorativeGroup.add(rightCap);

    // Neon cyan accent strip running along wall top
    const neonGeo = new THREE.BoxGeometry(0.06, 0.06, this.length);
    [-wallX + wallThick * 0.5, wallX - wallThick * 0.5].forEach((nx) => {
      const neon = new THREE.Mesh(neonGeo, mats.modernNeonMat);
      neon.position.set(nx, wallHeight + 0.05, -this.length * 0.5);
      this.decorativeGroup.add(neon);
    });

    // Modern yellow safety railing
    const railPostGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6);
    const railBarGeo = new THREE.BoxGeometry(0.06, 0.06, this.length);
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffd600, roughness: 0.3 });

    [-wallX, wallX].forEach((wx) => {
      const topBar = new THREE.Mesh(railBarGeo, yellowMat);
      topBar.position.set(wx, wallHeight + 0.8, -this.length * 0.5);
      this.decorativeGroup.add(topBar);

      for (let z = 0; z < this.length; z += 6) {
        const post = new THREE.Mesh(railPostGeo, yellowMat);
        post.position.set(wx, wallHeight + 0.45, -z - 3);
        this.decorativeGroup.add(post);
      }
    });

    // Street graffiti decals
    const decalGeo = new THREE.PlaneGeometry(6.0, 1.8);
    const decal1 = new THREE.Mesh(decalGeo, mats.graffitiMat1);
    decal1.rotation.y = Math.PI / 2;
    decal1.position.set(-wallX + wallThick * 0.5 + 0.02, 1.3, -this.length * 0.3);
    this.decorativeGroup.add(decal1);

    const decal2 = new THREE.Mesh(decalGeo, mats.graffitiMat2);
    decal2.rotation.y = -Math.PI / 2;
    decal2.position.set(wallX - wallThick * 0.5 - 0.02, 1.3, -this.length * 0.7);
    this.decorativeGroup.add(decal2);

    // Overhead Catenary Steel Box-Truss Gantries
    this.buildModernCatenarySystem();

    // Modular Modern Buildings
    this.buildModernModularCity();

    // Overhead Modern Skybridge (on alternate chunks)
    this.buildModernSkybridge();
  }

  /**
   * Modern steel box truss catenaries with 3-aspect LED signals
   */
  private buildModernCatenarySystem(): void {
    const mats = TrackChunk.sharedMaterials!;
    const gantrySpacing = 26.0;
    const gantryCount = Math.floor(this.length / gantrySpacing);
    const poleHeight = 7.8;
    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 3.8;

    for (let g = 0; g < gantryCount; g++) {
      const gz = -g * gantrySpacing - 13.0;
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, gz);

      // Vertical steel columns
      const colGeo = new THREE.BoxGeometry(0.4, poleHeight, 0.4);
      [-spanWidth * 0.5, spanWidth * 0.5].forEach((cx) => {
        const col = new THREE.Mesh(colGeo, mats.catenarySteelMat);
        col.position.set(cx, poleHeight * 0.5, 0);
        col.castShadow = true;
        gantryGroup.add(col);

        const pedGeo = new THREE.BoxGeometry(0.7, 0.8, 0.7);
        const ped = new THREE.Mesh(pedGeo, mats.curbMat);
        ped.position.set(cx, 0.4, 0);
        gantryGroup.add(ped);
      });

      // Horizontal steel girder
      const girderGeo = new THREE.BoxGeometry(spanWidth + 0.6, 0.55, 0.45);
      const girder = new THREE.Mesh(girderGeo, mats.catenarySteelMat);
      girder.position.set(0, poleHeight - 0.28, 0);
      girder.castShadow = true;
      gantryGroup.add(girder);

      // Insulators & Modern 3-Aspect LED Signal Boxes
      CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
        const insGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 8);
        const ins = new THREE.Mesh(insGeo, mats.insulatorMat);
        ins.position.set(laneX, poleHeight - 0.75, 0);
        gantryGroup.add(ins);

        const sigGeo = new THREE.BoxGeometry(0.4, 0.85, 0.28);
        const sig = new THREE.Mesh(sigGeo, mats.modernSteelMat);
        sig.position.set(laneX, poleHeight - 1.15, 0.12);
        gantryGroup.add(sig);

        const lensGeo = new THREE.CircleGeometry(0.1, 10);
        const greenMat = new THREE.MeshBasicMaterial({ color: 0x00e676 });
        const greenLens = new THREE.Mesh(lensGeo, greenMat);
        greenLens.position.set(laneX, poleHeight - 1.05, 0.27);
        gantryGroup.add(greenLens);
      });

      this.decorativeGroup.add(gantryGroup);
    }

    // Overhead catenary contact wires
    CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
      const cableGeo = new THREE.CylinderGeometry(0.02, 0.02, this.length, 6);
      const cable = new THREE.Mesh(cableGeo, mats.cableMat);
      cable.rotation.x = Math.PI / 2;
      cable.position.set(laneX, poleHeight - 1.0, -this.length * 0.5);
      this.decorativeGroup.add(cable);
    });
  }

  /**
   * Builds Modern Modular Buildings (Skyscrapers, Residential Lofts, Transit Concourse)
   */
  private buildModernModularCity(): void {
    const mats = TrackChunk.sharedMaterials!;
    const setback = 10.5;
    const numBuildings = 5;
    const lotLength = this.length / numBuildings;

    for (let b = 0; b < numBuildings; b++) {
      const bz = -b * lotLength - lotLength * 0.5;
      const bStyle = (b + Math.floor(Math.abs(this.chunkZ / 80))) % 3;

      [-1, 1].forEach((side) => {
        const bGroup = new THREE.Group();
        const bX = side * (setback + 5.5 + (side > 0 ? 0.5 : 0));
        bGroup.position.set(bX, 0, bz);

        if (bStyle === 0) {
          // --- FAMILY 1: Commercial Glass Curtain-Wall Skyscraper ---
          const bW = 11.0;
          const bH = 26.0 + (b % 3) * 6.0;
          const bD = lotLength * 0.94;

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.modernSteelMat);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          mainBody.receiveShadow = true;
          bGroup.add(mainBody);

          // Glass facade ribbon
          const glass = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.1, bH * 0.85, bD * 0.85), mats.modernGlassMat);
          glass.position.y = bH * 0.5;
          bGroup.add(glass);

          // Rooftop Helipad with circular ring and red beacons
          const pad = new THREE.Mesh(new THREE.BoxGeometry(bW * 0.7, 0.25, bD * 0.7), mats.curbMat);
          pad.position.y = bH + 0.12;
          bGroup.add(pad);

          [-bW * 0.3, bW * 0.3].forEach((px) => {
            [-bD * 0.3, bD * 0.3].forEach((pz) => {
              const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff1744 }));
              beacon.position.set(px, bH + 0.4, pz);
              bGroup.add(beacon);
            });
          });

          // Exterior glass elevator column
          const elev = new THREE.Mesh(new THREE.BoxGeometry(1.6, bH * 0.75, 1.8), mats.modernGlassMat);
          elev.position.set(-side * (bW * 0.5 + 0.7), bH * 0.45, 0);
          bGroup.add(elev);

        } else if (bStyle === 1) {
          // --- FAMILY 2: Contemporary Residential Lofts with Balconies ---
          const bW = 11.5;
          const bH = 20.0 + ((b * 2) % 3) * 4.0;
          const bD = lotLength * 0.92;

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.modernWhiteMat);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          mainBody.receiveShadow = true;
          bGroup.add(mainBody);

          // Cantilever balconies facing track
          for (let f = 4.5; f < bH - 3; f += 4.5) {
            const balc = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, bD * 0.6), mats.modernSteelMat);
            balc.position.set(-side * (bW * 0.5 + 0.9), f, 0);
            bGroup.add(balc);

            const glassRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, bD * 0.6), mats.modernGlassMat);
            glassRail.position.set(-side * (bW * 0.5 + 1.85), f + 0.45, 0);
            bGroup.add(glassRail);
          }

          // Rooftop solar panel array
          for (let sp = 0; sp < 4; sp++) {
            const panel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 3.2), mats.solarPanelMat);
            panel.rotation.x = 0.4;
            panel.position.set((sp - 1.5) * 2.6, bH + 0.8, 0);
            bGroup.add(panel);
          }

        } else {
          // --- FAMILY 3: Metro Transit Concourse & Plaza ---
          const bW = 12.0;
          const bH = 15.0 + (b % 2) * 3.0;
          const bD = lotLength * 0.95;

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.modernConcreteMat);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          mainBody.receiveShadow = true;
          bGroup.add(mainBody);

          // Cantilever station entrance canopy extending toward tracks
          const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.3, bD * 0.8), mats.modernSteelMat);
          canopy.position.set(-side * (bW * 0.5 + 1.6), 5.5, 0);
          bGroup.add(canopy);

          // Digital LED transit sign on facade
          const sign = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 2.0), mats.modernSignMat);
          sign.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
          sign.position.set(-side * (bW * 0.5 + 0.06), 7.2, 0);
          bGroup.add(sign);
        }

        this.decorativeGroup.add(bGroup);
      });
    }
  }

  /**
   * Sleek Pedestrian Skybridge for Modern Metro
   */
  private buildModernSkybridge(): void {
    const chunkIdx = Math.floor(Math.abs(this.chunkZ / this.length));
    if (chunkIdx % 2 !== 1) return;

    const mats = TrackChunk.sharedMaterials!;
    const bridgeHeight = 8.5;
    const bridgeWidth = 7.0;
    const bridgeSpan = 32.0;

    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, bridgeHeight, -this.length * 0.5);

    // Main floor deck girder
    const deck = new THREE.Mesh(new THREE.BoxGeometry(bridgeSpan, 0.8, bridgeWidth), mats.modernSteelMat);
    deck.castShadow = true;
    deck.receiveShadow = true;
    bridgeGroup.add(deck);

    // Glass enclosed walkway walls
    const glassWallGeo = new THREE.BoxGeometry(bridgeSpan, 2.8, 0.15);
    [-bridgeWidth * 0.5 + 0.1, bridgeWidth * 0.5 - 0.1].forEach((gz) => {
      const gw = new THREE.Mesh(glassWallGeo, mats.modernGlassMat);
      gw.position.set(0, 1.8, gz);
      bridgeGroup.add(gw);
    });

    // Sleek white aerodynamic roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(bridgeSpan + 0.6, 0.45, bridgeWidth + 0.4), mats.modernWhiteMat);
    roof.position.set(0, 3.4, 0);
    roof.castShadow = true;
    bridgeGroup.add(roof);

    // Outside support columns
    const colGeo = new THREE.BoxGeometry(1.4, bridgeHeight, 2.2);
    [-bridgeSpan * 0.38, bridgeSpan * 0.38].forEach((cx) => {
      const col = new THREE.Mesh(colGeo, mats.modernSteelMat);
      col.position.set(cx, -bridgeHeight * 0.5, 0);
      col.castShadow = true;
      bridgeGroup.add(col);
    });

    this.decorativeGroup.add(bridgeGroup);
  }

  /**
   * Builds Historic Railway Quarter Scenery: Weathered brick walls, gas lamps, Victorian rowhouses, stone viaduct
   */
  private buildHistoricQuarterScenery(roadbedWidth: number, curbWidth: number): void {
    const mats = TrackChunk.sharedMaterials!;
    const wallHeight = 2.4;
    const wallThick = 0.6;
    const wallX = roadbedWidth * 0.5 + curbWidth + wallThick * 0.5 + 0.2;
    const wallGeo = new THREE.BoxGeometry(wallThick, wallHeight, this.length);

    // Left & Right Weathered Victorian Brick Retaining Walls
    const leftWall = new THREE.Mesh(wallGeo, mats.weatheredBrickMat1);
    leftWall.position.set(-wallX, wallHeight * 0.5, -this.length * 0.5);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.decorativeGroup.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, mats.weatheredBrickMat2);
    rightWall.position.set(wallX, wallHeight * 0.5, -this.length * 0.5);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.decorativeGroup.add(rightWall);

    // Ashlar stone coping cap along wall top
    const capGeo = new THREE.BoxGeometry(wallThick + 0.18, 0.22, this.length);
    const leftCap = new THREE.Mesh(capGeo, mats.stoneMasonryMat);
    leftCap.position.set(-wallX, wallHeight + 0.11, -this.length * 0.5);
    this.decorativeGroup.add(leftCap);

    const rightCap = new THREE.Mesh(capGeo, mats.stoneMasonryMat);
    rightCap.position.set(wallX, wallHeight + 0.11, -this.length * 0.5);
    this.decorativeGroup.add(rightCap);

    // Cast-iron vintage star-shaped wall tie plates
    const starGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 5);
    [-wallX + wallThick * 0.5 + 0.04, wallX - wallThick * 0.5 - 0.04].forEach((sx, idx) => {
      for (let z = 6; z < this.length; z += 10) {
        const star = new THREE.Mesh(starGeo, mats.castIronMat);
        star.rotation.z = Math.PI / 2;
        star.position.set(sx, 1.4, -z);
        this.decorativeGroup.add(star);
      }
    });

    // Victorian cast-iron gas lamp posts along wall coping
    const lampPoleGeo = new THREE.CylinderGeometry(0.06, 0.09, 1.4, 8);
    const lampLanternGeo = new THREE.BoxGeometry(0.35, 0.5, 0.35);
    const lampCapGeo = new THREE.ConeGeometry(0.32, 0.3, 4);

    [-wallX, wallX].forEach((lx) => {
      for (let z = 8; z < this.length; z += 16) {
        const post = new THREE.Mesh(lampPoleGeo, mats.castIronMat);
        post.position.set(lx, wallHeight + 0.9, -z);
        this.decorativeGroup.add(post);

        const lantern = new THREE.Mesh(lampLanternGeo, mats.gasLampMat);
        lantern.position.set(lx, wallHeight + 1.7, -z);
        this.decorativeGroup.add(lantern);

        const cap = new THREE.Mesh(lampCapGeo, mats.castIronMat);
        cap.position.set(lx, wallHeight + 2.05, -z);
        this.decorativeGroup.add(cap);
      }
    });

    // Heavy cast-iron steam pipes along wall foot
    const pipeGeo = new THREE.CylinderGeometry(0.09, 0.09, this.length, 8);
    const leftPipe = new THREE.Mesh(pipeGeo, mats.castIronMat);
    leftPipe.rotation.x = Math.PI / 2;
    leftPipe.position.set(-wallX + wallThick * 0.5 + 0.12, 0.65, -this.length * 0.5);
    this.decorativeGroup.add(leftPipe);

    // Vintage Riveted Black-Iron Gantries with Mechanical Semaphores
    this.buildHistoricCatenarySystem();

    // Modular Historic Cityscape (Victorian Rowhouses, Terminal Clocktower, Steam Foundry)
    this.buildHistoricModularCity();

    // Monumental Stone & Brick Multi-Arch Viaduct (Alternate chunks)
    this.buildHistoricViaduct();
  }

  /**
   * Riveted black-iron telegraph gantries with mechanical semaphores
   */
  private buildHistoricCatenarySystem(): void {
    const mats = TrackChunk.sharedMaterials!;
    const gantrySpacing = 26.0;
    const gantryCount = Math.floor(this.length / gantrySpacing);
    const poleHeight = 7.6;
    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 3.8;

    for (let g = 0; g < gantryCount; g++) {
      const gz = -g * gantrySpacing - 13.0;
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, gz);

      // Riveted black iron vertical lattice posts
      const postGeo = new THREE.BoxGeometry(0.38, poleHeight, 0.38);
      [-spanWidth * 0.5, spanWidth * 0.5].forEach((cx) => {
        const post = new THREE.Mesh(postGeo, mats.castIronMat);
        post.position.set(cx, poleHeight * 0.5, 0);
        post.castShadow = true;
        gantryGroup.add(post);

        const ped = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.9, 0.75), mats.stoneMasonryMat);
        ped.position.set(cx, 0.45, 0);
        gantryGroup.add(ped);
      });

      // Heavy arched iron girder
      const girder = new THREE.Mesh(new THREE.BoxGeometry(spanWidth + 0.5, 0.5, 0.4), mats.castIronMat);
      girder.position.set(0, poleHeight - 0.25, 0);
      girder.castShadow = true;
      gantryGroup.add(girder);

      // Earthenware ceramic insulators and mechanical semaphore arms
      CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
        const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.4, 8), mats.earthenwareInsulatorMat);
        ins.position.set(laneX, poleHeight - 0.65, 0);
        gantryGroup.add(ins);

        // Mechanical Semaphore Signal Post & Blade
        const semPost = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.12), mats.castIronMat);
        semPost.position.set(laneX, poleHeight - 1.1, 0.15);
        gantryGroup.add(semPost);

        // Signal Arm Blade (Red with white stripe)
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.04), new THREE.MeshStandardMaterial({ color: 0xd32f2f }));
        blade.position.set(laneX + 0.35, poleHeight - 0.7, 0.22);
        blade.rotation.z = -0.3; // Raised clear signal!
        gantryGroup.add(blade);
      });

      this.decorativeGroup.add(gantryGroup);
    }

    // Overhead dark copper telegraph wires
    CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, this.length, 6), mats.copperCableMat);
      wire.rotation.x = Math.PI / 2;
      wire.position.set(laneX, poleHeight - 0.95, -this.length * 0.5);
      this.decorativeGroup.add(wire);
    });
  }

  /**
   * Modular Victorian & Industrial Buildings (Rowhouses, Clock Tower Terminal, Foundry)
   */
  private buildHistoricModularCity(): void {
    const mats = TrackChunk.sharedMaterials!;
    const setback = 10.5;
    const numBuildings = 5;
    const lotLength = this.length / numBuildings;

    for (let b = 0; b < numBuildings; b++) {
      const bz = -b * lotLength - lotLength * 0.5;
      const bStyle = (b + Math.floor(Math.abs(this.chunkZ / 80))) % 3;

      [-1, 1].forEach((side) => {
        const bGroup = new THREE.Group();
        const bX = side * (setback + 5.5 + (side > 0 ? 0.5 : 0));
        bGroup.position.set(bX, 0, bz);

        if (bStyle === 0) {
          // --- FAMILY 1: Victorian Brick Rowhouses with Mansard Roof & Chimneys ---
          const bW = 10.5;
          const bH = 17.0 + (b % 3) * 3.5;
          const bD = lotLength * 0.94;

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.weatheredBrickMat1);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          mainBody.receiveShadow = true;
          bGroup.add(mainBody);

          // Classical stone quoin corners
          const quoinGeo = new THREE.BoxGeometry(0.4, bH, 0.4);
          [-bW * 0.5, bW * 0.5].forEach((qx) => {
            [-bD * 0.5, bD * 0.5].forEach((qz) => {
              const quoin = new THREE.Mesh(quoinGeo, mats.stoneMasonryMat);
              quoin.position.set(qx, bH * 0.5, qz);
              bGroup.add(quoin);
            });
          });

          // Mansard roof
          const roofH = 4.2;
          const mansard = new THREE.Mesh(new THREE.BoxGeometry(bW - 0.4, roofH, bD - 0.4), mats.slateRoofMat);
          mansard.position.y = bH + roofH * 0.5;
          mansard.castShadow = true;
          bGroup.add(mansard);

          // Dual brick chimneys with terracotta pots
          [-bW * 0.25, bW * 0.25].forEach((cx) => {
            const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.8, 1.1), mats.weatheredBrickMat1);
            chimney.position.set(cx, bH + roofH + 1.2, 0);
            bGroup.add(chimney);

            const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0xd35400 }));
            pot.position.set(cx, bH + roofH + 2.8, 0);
            bGroup.add(pot);
          });

          // Wrought-iron fire escapes
          for (let f = 4; f < bH; f += 4.5) {
            const plat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, bD * 0.55), mats.castIronMat);
            plat.position.set(-side * (bW * 0.5 + 0.8), f, 0);
            bGroup.add(plat);
          }

        } else if (bStyle === 1) {
          // --- FAMILY 2: Grand Passenger Terminal & 4-Faced Clock Tower ---
          const bW = 12.0;
          const bH = 20.0 + (b % 2) * 4.0;
          const bD = lotLength * 0.95;

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.stoneMasonryMat);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          mainBody.receiveShadow = true;
          bGroup.add(mainBody);

          // Weathered copper verdigris green patina pitched roof
          const roofH = 5.0;
          const copperRoof = new THREE.Mesh(new THREE.BoxGeometry(bW + 0.2, roofH, bD + 0.2), mats.copperPatinaMat);
          copperRoof.position.y = bH + roofH * 0.5;
          copperRoof.castShadow = true;
          bGroup.add(copperRoof);

          // Prominent 4-Faced Victorian Clock Tower
          const towerW = 4.2;
          const towerH = 7.5;
          const clockTower = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerW), mats.stoneMasonryMat);
          clockTower.position.set(0, bH + roofH + towerH * 0.5, 0);
          clockTower.castShadow = true;
          bGroup.add(clockTower);

          // Clock Faces on all 4 sides with illuminated dial
          const clockDialGeo = new THREE.CircleGeometry(1.1, 16);
          const clockDialMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          [-Math.PI / 2, Math.PI / 2, 0, Math.PI].forEach((angle) => {
            const dial = new THREE.Mesh(clockDialGeo, clockDialMat);
            dial.rotation.y = angle;
            const dist = towerW * 0.5 + 0.04;
            dial.position.set(Math.sin(angle) * dist, bH + roofH + towerH * 0.5 + 0.4, Math.cos(angle) * dist);
            bGroup.add(dial);
          });

          // Spire atop clock tower
          const spire = new THREE.Mesh(new THREE.ConeGeometry(towerW * 0.55, 4.5, 8), mats.copperPatinaMat);
          spire.position.y = bH + roofH + towerH + 2.25;
          spire.castShadow = true;
          bGroup.add(spire);

          // Vintage Enamel Railway Station Sign
          const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 1.8), mats.historicSignMat);
          sign.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
          sign.position.set(-side * (bW * 0.5 + 0.08), 8.5, 0);
          bGroup.add(sign);

        } else {
          // --- FAMILY 3: Industrial Steam Foundry & Locomotive Works ---
          const bW = 12.5;
          const bH = 13.0 + (b % 2) * 3.0;
          const bD = lotLength * 0.95;

          const mainBody = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), mats.weatheredBrickMat2);
          mainBody.position.y = bH * 0.5;
          mainBody.castShadow = true;
          mainBody.receiveShadow = true;
          bGroup.add(mainBody);

          // Industrial sawtooth monitor skylight roof
          const sawGeo = new THREE.BoxGeometry(bW, 2.5, bD * 0.85);
          const sawRoof = new THREE.Mesh(sawGeo, mats.slateRoofMat);
          sawRoof.position.y = bH + 1.25;
          bGroup.add(sawRoof);

          // Industrial steam vents
          for (let v = 0; v < 3; v++) {
            const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.0, 8), mats.castIronMat);
            vent.position.set((v - 1) * 3.0, bH + 3.0, 0);
            bGroup.add(vent);
          }

          // Towering cylindrical factory brick smokestack
          const stackH = 22.0;
          const stack = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, stackH, 12), mats.weatheredBrickMat1);
          stack.position.set(side * 2.8, stackH * 0.5, -bD * 0.25);
          stack.castShadow = true;
          bGroup.add(stack);

          // Decorative stone corbel band at smokestack crown
          const crown = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.3, 1.2, 12), mats.stoneMasonryMat);
          crown.position.set(side * 2.8, stackH + 0.6, -bD * 0.25);
          bGroup.add(crown);
        }

        this.decorativeGroup.add(bGroup);
      });
    }
  }

  /**
   * Monumental Victorian Stone & Brick Multi-Arch Viaduct
   */
  private buildHistoricViaduct(): void {
    const chunkIdx = Math.floor(Math.abs(this.chunkZ / this.length));
    if (chunkIdx % 2 !== 1) return;

    const mats = TrackChunk.sharedMaterials!;
    const viaductHeight = 8.5;
    const viaductWidth = 8.5;
    const viaductSpan = 30.0;

    const viaductGroup = new THREE.Group();
    viaductGroup.position.set(0, viaductHeight, -this.length * 0.5);

    // Monumental stone arch piers outside tracks
    const pierGeo = new THREE.BoxGeometry(2.4, viaductHeight, 5.0);
    [-viaductSpan * 0.42, viaductSpan * 0.42].forEach((px) => {
      const pier = new THREE.Mesh(pierGeo, mats.stoneMasonryMat);
      pier.position.set(px, -viaductHeight * 0.5, 0);
      pier.castShadow = true;
      viaductGroup.add(pier);
    });

    // Segmental brick barrel arch spanning high above tracks
    const archDeck = new THREE.Mesh(new THREE.BoxGeometry(viaductSpan, 1.6, viaductWidth), mats.stoneMasonryMat);
    archDeck.castShadow = true;
    archDeck.receiveShadow = true;
    viaductGroup.add(archDeck);

    // Brick soffit spandrels
    const spandrel = new THREE.Mesh(new THREE.BoxGeometry(viaductSpan - 4.0, 0.4, viaductWidth - 0.2), mats.weatheredBrickMat1);
    spandrel.position.set(0, -0.9, 0);
    viaductGroup.add(spandrel);

    // Decorative cast-iron balustrade parapet along top
    const balustrade = new THREE.Mesh(new THREE.BoxGeometry(viaductSpan, 0.9, 0.25), mats.castIronMat);
    [-viaductWidth * 0.5 + 0.15, viaductWidth * 0.5 - 0.15].forEach((bz) => {
      const b = balustrade.clone();
      b.position.set(0, 1.25, bz);
      viaductGroup.add(b);
    });

    this.decorativeGroup.add(viaductGroup);
  }

  /**
   * Builds the Grand Transition Portal Arch Gateway between Modern Metro and Historic Quarter
   */
  private buildTransitionPortalScenery(roadbedWidth: number, curbWidth: number, targetTheme: EnvironmentTheme): void {
    const mats = TrackChunk.sharedMaterials!;
    const portalHeight = 9.2;
    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 4.2;

    const portalGroup = new THREE.Group();
    portalGroup.position.set(0, 0, -this.length * 0.5);

    // Massive ashlar stone portal pylons flanking tracks
    const pylonGeo = new THREE.BoxGeometry(3.6, portalHeight + 2.5, 4.5);
    [-spanWidth * 0.5 - 1.2, spanWidth * 0.5 + 1.2].forEach((px) => {
      const pylon = new THREE.Mesh(pylonGeo, mats.stoneMasonryMat);
      pylon.position.set(px, (portalHeight + 2.5) * 0.5, 0);
      pylon.castShadow = true;
      pylon.receiveShadow = true;
      portalGroup.add(pylon);

      // Pylon moulded capstone cornice
      const cap = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.6, 5.1), mats.stoneMasonryMat);
      cap.position.set(px, portalHeight + 2.7, 0);
      portalGroup.add(cap);

      // Welcome portal lantern on each pylon
      const lanternMat = new THREE.MeshBasicMaterial({ color: targetTheme.id === 'HISTORIC_QUARTER' ? 0xffb300 : 0x00e5ff });
      const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.6), lanternMat);
      lantern.position.set(px > 0 ? px - 1.6 : px + 1.6, 6.5, 2.3);
      portalGroup.add(lantern);
    });

    // Grand monumental triumphal arch spanning across tracks
    const archGirder = new THREE.Mesh(new THREE.BoxGeometry(spanWidth + 2.0, 1.8, 4.0), mats.stoneMasonryMat);
    archGirder.position.set(0, portalHeight + 0.9, 0);
    archGirder.castShadow = true;
    archGirder.receiveShadow = true;
    portalGroup.add(archGirder);

    // Carved stone inscription banner
    const bannerGeo = new THREE.BoxGeometry(10.0, 0.8, 0.15);
    const banner = new THREE.Mesh(bannerGeo, mats.curbMat);
    banner.position.set(0, portalHeight + 1.2, 2.08);
    portalGroup.add(banner);

    // Also build retaining walls along remainder of chunk
    const wallHeight = 2.4;
    const wallThick = 0.6;
    const wallX = roadbedWidth * 0.5 + curbWidth + wallThick * 0.5 + 0.2;
    const wallMat = targetTheme.id === 'HISTORIC_QUARTER' ? mats.weatheredBrickMat1 : mats.modernConcreteMat;
    const wallGeo = new THREE.BoxGeometry(wallThick, wallHeight, this.length);

    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-wallX, wallHeight * 0.5, 0);
    portalGroup.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(wallX, wallHeight * 0.5, 0);
    portalGroup.add(rightWall);

    this.decorativeGroup.add(portalGroup);
  }

  /**
   * Helper to create rooftop water tower
   */
  private createRooftopWaterTower(): THREE.Group {
    const tower = new THREE.Group();
    const mats = TrackChunk.sharedMaterials!;

    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6);
    [-0.6, 0.6].forEach((x) => {
      [-0.6, 0.6].forEach((z) => {
        const leg = new THREE.Mesh(legGeo, mats.modernSteelMat);
        leg.position.set(x, 1.1, z);
        tower.add(leg);
      });
    });

    const tankGeo = new THREE.CylinderGeometry(1.1, 1.1, 2.0, 14);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.85 });
    CurvedShaderManager.getInstance().applyCurvature(woodMat);
    const tank = new THREE.Mesh(tankGeo, woodMat);
    tank.position.y = 3.2;
    tank.castShadow = true;
    tower.add(tank);

    const capGeo = new THREE.ConeGeometry(1.25, 0.8, 14);
    const cap = new THREE.Mesh(capGeo, mats.modernSteelMat);
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

    const mastGeo = new THREE.CylinderGeometry(0.05, 0.12, 4.5, 6);
    const mast = new THREE.Mesh(mastGeo, mats.modernSteelMat);
    mast.position.y = 2.25;
    ant.add(mast);

    const beaconGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 4.55;
    ant.add(beacon);

    return ant;
  }

  /**
   * Populate chunk with curated obstacle and collectible patterns,
   * with theme and transition support.
   */
  public populate(
    pattern: TrackPattern | any,
    worldZ: number,
    theme: EnvironmentTheme | string = this.currentTheme,
    isTransition: boolean = false
  ): void {
    this.chunkZ = worldZ;
    this.group.position.z = worldZ;

    const resolvedTheme: EnvironmentTheme = typeof theme === 'string'
      ? (theme === 'HISTORIC_QUARTER' ? HISTORIC_QUARTER_THEME : MODERN_METRO_THEME)
      : theme;

    // Check if scenery needs rebuilding for theme change or transition portal
    if (this.currentTheme.id !== resolvedTheme.id || this.isTransitionPortal !== isTransition) {
      this.buildEnvironmentScenery(resolvedTheme, isTransition);
    }

    // Clear previous dynamic items
    this.clearDynamicItems();
    this.chunkHadCollision = false;

    // Spawn Obstacles from pattern
    const obstacleList = Array.isArray(pattern) ? pattern : (pattern?.obstacles || []);
    for (const obsData of obstacleList) {
      let group: THREE.Group;
      const laneX = CONSTANTS.LANES[obsData.lane as LaneIndex];
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
    for (const colData of (pattern?.collectibles || [])) {
      const startLaneX = CONSTANTS.LANES[colData.lane as LaneIndex];
      const endLaneX = colData.endLane !== undefined ? CONSTANTS.LANES[colData.endLane as LaneIndex] : startLaneX;
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
