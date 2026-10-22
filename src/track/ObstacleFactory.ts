import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { CurvedShaderManager } from '../scene/CurvedShader';
import { TextureGenerator } from '../scene/TextureGenerator';

export type ObstacleType = 'TRAIN' | 'TRAIN_RAMP' | 'LOW_BARRIER' | 'HIGH_BARRIER';

export interface ObstacleInstance {
  group: THREE.Group;
  type: ObstacleType;
  lane: LaneIndex;
  collider: THREE.Box3;
  roofCollider?: THREE.Box3; // Train roof walkable surface
  rampCollider?: THREE.Box3; // Sloped climbable ramp
  nearMissBox: THREE.Box3;
  nearMissTriggered: boolean;
  active: boolean;
  hasRamp?: boolean;
}

export class ObstacleFactory {
  private curvedManager = CurvedShaderManager.getInstance();

  // Materials & Geometries
  private barrierMat: THREE.MeshStandardMaterial;
  private trainRoofMat: THREE.MeshStandardMaterial;
  private trainWindowMat: THREE.MeshStandardMaterial;
  private trainChassisMat: THREE.MeshStandardMaterial;
  private trainWheelMat: THREE.MeshStandardMaterial;
  private trainHeadlightMat: THREE.MeshBasicMaterial;
  private trainTaillightMat: THREE.MeshBasicMaterial;
  private rampPlateMat: THREE.MeshStandardMaterial;

  constructor() {
    const hazardTex = TextureGenerator.getHazardTexture();

    this.barrierMat = new THREE.MeshStandardMaterial({
      map: hazardTex,
      roughness: 0.45,
      metalness: 0.2
    });
    this.curvedManager.applyCurvature(this.barrierMat);

    this.trainRoofMat = new THREE.MeshStandardMaterial({
      color: 0x373b44,
      roughness: 0.65,
      metalness: 0.35
    });
    this.curvedManager.applyCurvature(this.trainRoofMat);

    this.trainWindowMat = new THREE.MeshStandardMaterial({
      color: 0x1a2d42,
      roughness: 0.1,
      metalness: 0.9
    });
    this.curvedManager.applyCurvature(this.trainWindowMat);

    this.trainChassisMat = new THREE.MeshStandardMaterial({
      color: 0x1f232b,
      roughness: 0.85,
      metalness: 0.4
    });
    this.curvedManager.applyCurvature(this.trainChassisMat);

    this.trainWheelMat = new THREE.MeshStandardMaterial({
      color: 0x78909c,
      roughness: 0.25,
      metalness: 0.85
    });
    this.curvedManager.applyCurvature(this.trainWheelMat);

    this.trainHeadlightMat = new THREE.MeshBasicMaterial({
      color: 0xfffae6
    });

    this.trainTaillightMat = new THREE.MeshBasicMaterial({
      color: 0xff1744
    });

    this.rampPlateMat = new THREE.MeshStandardMaterial({
      color: 0x455a64,
      roughness: 0.5,
      metalness: 0.6
    });
    this.curvedManager.applyCurvature(this.rampPlateMat);
  }

  /**
   * Create High-Detail Low Barrier (Construction A-Frame Hazard with Beacons)
   */
  public createLowBarrier(): THREE.Group {
    const group = new THREE.Group();
    const laneW = CONSTANTS.LANE_WIDTH * 0.88;

    // 1. Cross plank with yellow/black hazard chevrons
    const barGeo = new THREE.BoxGeometry(laneW, CONSTANTS.LOW_BARRIER_HEIGHT * 0.45, 0.16);
    const bar = new THREE.Mesh(barGeo, this.barrierMat);
    bar.position.y = CONSTANTS.LOW_BARRIER_HEIGHT * 0.65;
    bar.castShadow = true;
    group.add(bar);

    // 2. Heavy-duty cast-iron A-Frame support legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.7, metalness: 0.4 });
    this.curvedManager.applyCurvature(legMat);

    const legGeo = new THREE.BoxGeometry(0.12, CONSTANTS.LOW_BARRIER_HEIGHT, 0.12);
    const footGeo = new THREE.BoxGeometry(0.24, 0.08, 0.85);

    [-laneW * 0.45, laneW * 0.45].forEach((xPos) => {
      // Slanted A-frame legs
      const leg1 = new THREE.Mesh(legGeo, legMat);
      leg1.rotation.z = xPos < 0 ? 0.08 : -0.08;
      leg1.rotation.x = 0.22;
      leg1.position.set(xPos, CONSTANTS.LOW_BARRIER_HEIGHT * 0.45, 0);
      leg1.castShadow = true;
      group.add(leg1);

      const leg2 = new THREE.Mesh(legGeo, legMat);
      leg2.rotation.z = xPos < 0 ? 0.08 : -0.08;
      leg2.rotation.x = -0.22;
      leg2.position.set(xPos, CONSTANTS.LOW_BARRIER_HEIGHT * 0.45, 0);
      leg2.castShadow = true;
      group.add(leg2);

      // Cast iron ground foot
      const foot = new THREE.Mesh(footGeo, legMat);
      foot.position.set(xPos, 0.04, 0);
      foot.castShadow = true;
      group.add(foot);

      // Flashing amber caution beacon lamp on top
      const beaconBaseGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.08, 10);
      const beaconBase = new THREE.Mesh(beaconBaseGeo, legMat);
      beaconBase.position.set(xPos, CONSTANTS.LOW_BARRIER_HEIGHT + 0.04, 0);
      group.add(beaconBase);

      const beaconLensGeo = new THREE.SphereGeometry(0.075, 10, 8);
      const beaconLensMat = new THREE.MeshBasicMaterial({ color: 0xffa000 });
      const beaconLens = new THREE.Mesh(beaconLensGeo, beaconLensMat);
      beaconLens.position.set(xPos, CONSTANTS.LOW_BARRIER_HEIGHT + 0.12, 0);
      group.add(beaconLens);
    });

    return group;
  }

  /**
   * Create High Overhead Barrier (Requires Slide Under)
   */
  public createHighBarrier(): THREE.Group {
    const group = new THREE.Group();
    const spanW = CONSTANTS.LANE_WIDTH * 0.92;
    const postHeight = CONSTANTS.HIGH_BARRIER_HEIGHT;

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.6, metalness: 0.5 });
    this.curvedManager.applyCurvature(frameMat);

    // Left & Right vertical steel tubular columns
    const postGeo = new THREE.CylinderGeometry(0.12, 0.14, postHeight, 10);
    [-spanW * 0.48, spanW * 0.48].forEach((xPos) => {
      const post = new THREE.Mesh(postGeo, frameMat);
      post.position.set(xPos, postHeight * 0.5, 0);
      post.castShadow = true;
      group.add(post);

      // Concrete foundation foot
      const padGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.16, 12);
      const pad = new THREE.Mesh(padGeo, frameMat);
      pad.position.set(xPos, 0.08, 0);
      group.add(pad);
    });

    // Overhead clearance crossbar starting at clearance height (1.25m to 2.2m)
    const barGeo = new THREE.BoxGeometry(spanW, 0.95, 0.28);
    const bar = new THREE.Mesh(barGeo, this.barrierMat);
    bar.position.set(0, CONSTANTS.HIGH_BARRIER_CLEARANCE + 0.48, 0);
    bar.castShadow = true;
    group.add(bar);

    // Diagonal reinforcing steel brackets
    const bracketGeo = new THREE.BoxGeometry(0.08, 0.65, 0.08);
    const leftBracket = new THREE.Mesh(bracketGeo, frameMat);
    leftBracket.rotation.z = -Math.PI / 4;
    leftBracket.position.set(-spanW * 0.4, CONSTANTS.HIGH_BARRIER_CLEARANCE + 0.9, 0);
    group.add(leftBracket);

    const rightBracket = new THREE.Mesh(bracketGeo, frameMat);
    rightBracket.rotation.z = Math.PI / 4;
    rightBracket.position.set(spanW * 0.4, CONSTANTS.HIGH_BARRIER_CLEARANCE + 0.9, 0);
    group.add(rightBracket);

    // Overhead illuminated clearance warning sign
    const signGeo = new THREE.BoxGeometry(1.4, 0.4, 0.1);
    const signMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, CONSTANTS.HIGH_BARRIER_CLEARANCE + 1.15, 0.16);
    group.add(sign);

    return group;
  }

  /**
   * Create Full Production-Quality Metro Subway Train
   */
  public createTrain(
    length: number = CONSTANTS.TRAIN_LENGTH_SHORT,
    hasRamp: boolean = false,
    colorHex: number = CONSTANTS.COLORS.TRAIN_BODY_1
  ): THREE.Group {
    const group = new THREE.Group();
    group.userData = { isTrain: true, type: hasRamp ? 'TRAIN_RAMP' : 'TRAIN' };
    const w = CONSTANTS.TRAIN_WIDTH;
    const h = CONSTANTS.TRAIN_HEIGHT;
    const bodyLength = length;

    // Pick accent stripe color
    let accentColor = 0xffd600;
    if (colorHex === CONSTANTS.COLORS.TRAIN_BODY_2) accentColor = 0x00e676;
    if (colorHex === CONSTANTS.COLORS.TRAIN_BODY_3) accentColor = 0xffffff;

    const sideTexture = TextureGenerator.getTrainSideTexture(colorHex, accentColor);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.35,
      metalness: 0.25
    });
    this.curvedManager.applyCurvature(bodyMat);

    const sideMat = new THREE.MeshStandardMaterial({
      map: sideTexture,
      roughness: 0.3,
      metalness: 0.2
    });
    this.curvedManager.applyCurvature(sideMat);

    // 1. Carriage Main Hull Body (Beveled lower skirts and side panels)
    // Multi-material box for sides with windows vs front/rear/roof
    const materials = [
      sideMat, // right (+X)
      sideMat, // left (-X)
      this.trainRoofMat, // top (+Y)
      this.trainChassisMat, // bottom (-Y)
      bodyMat, // front (+Z, facing oncoming player)
      bodyMat  // rear (-Z)
    ];

    const bodyGeo = new THREE.BoxGeometry(w, h * 0.82, bodyLength);
    const bodyMesh = new THREE.Mesh(bodyGeo, materials);
    bodyMesh.position.y = h * 0.48;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // 2. Streamlined Front Cab & Cowl (facing +Z toward player)
    const noseLength = 1.4;
    const noseGeo = new THREE.BoxGeometry(w * 0.96, h * 0.8, noseLength);
    const noseMesh = new THREE.Mesh(noseGeo, bodyMat);
    noseMesh.position.set(0, h * 0.48, bodyLength * 0.5 + noseLength * 0.4);
    noseMesh.castShadow = true;
    group.add(noseMesh);

    // Slanted Front Windshield Glass
    const glassGeo = new THREE.BoxGeometry(w * 0.76, h * 0.35, 0.15);
    const glass = new THREE.Mesh(glassGeo, this.trainWindowMat);
    glass.rotation.x = -0.22; // Aerodynamic slant
    glass.position.set(0, h * 0.62, bodyLength * 0.5 + noseLength * 0.85);
    group.add(glass);

    // LED Destination Matrix Display above windshield
    const destGeo = new THREE.BoxGeometry(w * 0.55, 0.25, 0.08);
    const destMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    const destSign = new THREE.Mesh(destGeo, destMat);
    destSign.position.set(0, h * 0.82, bodyLength * 0.5 + noseLength * 0.8);
    group.add(destSign);

    // Front Heavy-duty Cowcatcher / Pilot Wedge
    const plowGeo = new THREE.BoxGeometry(w * 0.85, 0.45, 0.6);
    const plow = new THREE.Mesh(plowGeo, this.trainChassisMat);
    plow.position.set(0, 0.25, bodyLength * 0.5 + noseLength * 0.85);
    group.add(plow);

    // Center Draft Gear / Coupler
    const couplerGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45, 8);
    const coupler = new THREE.Mesh(couplerGeo, this.trainChassisMat);
    coupler.rotation.x = Math.PI / 2;
    coupler.position.set(0, 0.45, bodyLength * 0.5 + noseLength + 0.1);
    group.add(coupler);

    // 3. Walkable Roof Platform & Details
    const roofPlatformGeo = new THREE.BoxGeometry(w * 0.88, 0.22, bodyLength * 0.98);
    const roofPlatform = new THREE.Mesh(roofPlatformGeo, this.trainRoofMat);
    roofPlatform.position.y = h * 0.92;
    roofPlatform.receiveShadow = true;
    group.add(roofPlatform);

    // Anti-slip roof walkway panels
    const walkGeo = new THREE.BoxGeometry(w * 0.45, 0.06, bodyLength * 0.9);
    const walkMat = new THREE.MeshStandardMaterial({ color: 0x4f5b66, roughness: 0.9 });
    this.curvedManager.applyCurvature(walkMat);
    const walk = new THREE.Mesh(walkGeo, walkMat);
    walk.position.y = h * 0.92 + 0.12;
    walk.receiveShadow = true;
    group.add(walk);

    // Roof HVAC Air-Conditioning Pods (2 units along roof)
    const hvacCount = Math.max(2, Math.floor(bodyLength / 9));
    const hvacSpacing = bodyLength / (hvacCount + 1);
    const hvacGeo = new THREE.BoxGeometry(w * 0.6, 0.35, 2.2);

    for (let c = 0; c < hvacCount; c++) {
      const zOffset = -bodyLength * 0.4 + (c + 0.5) * hvacSpacing;
      const hvac = new THREE.Mesh(hvacGeo, this.trainRoofMat);
      hvac.position.set(0, h * 0.92 + 0.24, zOffset);
      hvac.castShadow = true;
      group.add(hvac);

      // Vent grille lines on HVAC
      const grilleGeo = new THREE.BoxGeometry(w * 0.48, 0.04, 1.6);
      const grilleMat = new THREE.MeshBasicMaterial({ color: 0x111118 });
      const grille = new THREE.Mesh(grilleGeo, grilleMat);
      grille.position.set(0, h * 0.92 + 0.42, zOffset);
      group.add(grille);
    }

    // Pantograph / Overhead Catenary Power Skid (Center of roof)
    const pantoBaseGeo = new THREE.BoxGeometry(1.2, 0.15, 1.4);
    const pantoBase = new THREE.Mesh(pantoBaseGeo, this.trainChassisMat);
    pantoBase.position.set(0, h * 0.92 + 0.15, 0);
    group.add(pantoBase);

    const pantoArmGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6);
    const pantoArm = new THREE.Mesh(pantoArmGeo, this.trainWheelMat);
    pantoArm.rotation.x = -0.5;
    pantoArm.position.set(0, h * 0.92 + 0.45, 0);
    group.add(pantoArm);

    // 4. Undercarriage & Dual 2-Axle Wheel Bogies (Trucks)
    const bogieZOffsets = [-bodyLength * 0.35, bodyLength * 0.35];
    bogieZOffsets.forEach((bz) => {
      const bogie = this.createWheelBogie();
      bogie.position.set(0, 0.32, bz);
      group.add(bogie);
    });

    // 5. Headlights & Taillights
    // Front high-intensity dual headlights
    const hlGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 12);
    const hlBezelGeo = new THREE.TorusGeometry(0.22, 0.05, 8, 16);

    [-w * 0.32, w * 0.32].forEach((xPos) => {
      const hl = new THREE.Mesh(hlGeo, this.trainHeadlightMat);
      hl.rotation.x = Math.PI / 2;
      hl.position.set(xPos, 1.35, bodyLength * 0.5 + noseLength + 0.02);
      group.add(hl);

      const bezel = new THREE.Mesh(hlBezelGeo, this.trainChassisMat);
      bezel.position.set(xPos, 1.35, bodyLength * 0.5 + noseLength + 0.01);
      group.add(bezel);
    });

    // Rear twin red taillights (facing -Z)
    [-w * 0.32, w * 0.32].forEach((xPos) => {
      const tl = new THREE.Mesh(hlGeo, this.trainTaillightMat);
      tl.rotation.x = Math.PI / 2;
      tl.position.set(xPos, 1.35, -bodyLength * 0.5 - 0.02);
      group.add(tl);
    });

    // 6. Optional Climbable Ramp at Front
    if (hasRamp) {
      const rampLength = CONSTANTS.TRAIN_RAMP_LENGTH;
      const rampWidth = w * 0.86;
      const rampHeight = h * 0.92;

      // Heavy industrial steel ramp
      const rampGeo = new THREE.BoxGeometry(rampWidth, 0.32, rampLength);
      const rampMesh = new THREE.Mesh(rampGeo, this.rampPlateMat);
      rampMesh.rotation.x = Math.atan2(rampHeight, rampLength);
      rampMesh.position.set(0, rampHeight * 0.5, bodyLength * 0.5 + noseLength + rampLength * 0.45);
      rampMesh.castShadow = true;
      rampMesh.receiveShadow = true;
      group.add(rampMesh);

      // Yellow/black safety side skirts along the ramp
      const skirtGeo = new THREE.BoxGeometry(0.12, 0.45, rampLength);
      [-rampWidth * 0.51, rampWidth * 0.51].forEach((sx) => {
        const skirt = new THREE.Mesh(skirtGeo, this.barrierMat);
        skirt.rotation.x = Math.atan2(rampHeight, rampLength);
        skirt.position.set(sx, rampHeight * 0.5 + 0.15, bodyLength * 0.5 + noseLength + rampLength * 0.45);
        group.add(skirt);
      });
    }

    return group;
  }

  /**
   * Helper to construct a realistic 2-axle rail wheel bogie (truck)
   */
  private createWheelBogie(): THREE.Group {
    const bogie = new THREE.Group();

    // Steel bolster subframe
    const frameGeo = new THREE.BoxGeometry(CONSTANTS.TRAIN_WIDTH * 0.72, 0.22, 2.4);
    const frame = new THREE.Mesh(frameGeo, this.trainChassisMat);
    frame.castShadow = true;
    bogie.add(frame);

    // 4 Steel Rail Wheels (2 axles at ±0.8m Z, aligned at rail gauge ±0.8m X)
    const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.14, 14);
    const axleGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8);

    [-0.75, 0.75].forEach((axleZ) => {
      // Axle bar
      const axle = new THREE.Mesh(axleGeo, this.trainChassisMat);
      axle.rotation.z = Math.PI / 2;
      axle.position.set(0, 0, axleZ);
      bogie.add(axle);

      // Left wheel (rests on left rail)
      const leftWheel = new THREE.Mesh(wheelGeo, this.trainWheelMat);
      leftWheel.rotation.z = Math.PI / 2;
      leftWheel.position.set(-0.8, 0, axleZ);
      leftWheel.castShadow = true;
      bogie.add(leftWheel);

      // Right wheel (rests on right rail)
      const rightWheel = new THREE.Mesh(wheelGeo, this.trainWheelMat);
      rightWheel.rotation.z = Math.PI / 2;
      rightWheel.position.set(0.8, 0, axleZ);
      rightWheel.castShadow = true;
      bogie.add(rightWheel);
    });

    return bogie;
  }
}
