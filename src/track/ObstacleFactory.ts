import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { CurvedShaderManager } from '../scene/CurvedShader';
import { TextureGenerator } from '../scene/TextureGenerator';

export type TrainVariant = 'MODERN_METRO' | 'CLASSIC_TRANSIT' | 'STREAMLINED_EXPRESS';

export type ObstacleType = 
  | 'TRAIN' 
  | 'TRAIN_RAMP' 
  | 'MOVING_TRAIN' 
  | 'LOW_BARRIER' 
  | 'HIGH_BARRIER' 
  | 'SIDE_BARRIER' 
  | 'TUNNEL_ARCH';

export type TrainAccessibility = 
  | 'RAMP_CLIMBABLE'      // Has accessible physical ramp; climbable from ground approach
  | 'SOLID_GROUND_HAZARD' // Impassable front at ground; roof only accessible from above (jump/powerup/adjacent roof)
  | 'ONCOMING_HAZARD';    // Moving train, impassable front, roof landable from above only

export interface TrainAccessibilityProfile {
  type: TrainAccessibility;
  accessibility: TrainAccessibility;
  isClimbableFromGround: boolean;
  isSolidFrontAtGround: boolean;
  isRoofTraversable: boolean;
  isMoving: boolean;
  roofSurfaceY: number; // 4.35m
  canJumpToFromAdjacentRoof: boolean;
  canReachWithSuperSneakers: boolean; // Ground jump with Sneakers clears 4.2m
  canReachWithJetpackDrop: boolean;
  visualAffordance: {
    hasInclineRamp: boolean;
    hasHazardBumper: boolean;
    hasRoofCatwalk: boolean;
  };
}

export function getTrainAccessibilityProfile(
  type: ObstacleType,
  hasRamp: boolean = false,
  isMoving: boolean = false
): TrainAccessibilityProfile {
  if (isMoving || type === 'MOVING_TRAIN') {
    return {
      type: 'ONCOMING_HAZARD',
      accessibility: 'ONCOMING_HAZARD',
      isClimbableFromGround: false,
      isSolidFrontAtGround: true,
      isRoofTraversable: true,
      isMoving: true,
      roofSurfaceY: 4.35,
      canJumpToFromAdjacentRoof: true,
      canReachWithSuperSneakers: true,
      canReachWithJetpackDrop: true,
      visualAffordance: {
        hasInclineRamp: false,
        hasHazardBumper: true,
        hasRoofCatwalk: true
      }
    };
  }
  if (hasRamp || type === 'TRAIN_RAMP') {
    return {
      type: 'RAMP_CLIMBABLE',
      accessibility: 'RAMP_CLIMBABLE',
      isClimbableFromGround: true,
      isSolidFrontAtGround: false,
      isRoofTraversable: true,
      isMoving: false,
      roofSurfaceY: 4.35,
      canJumpToFromAdjacentRoof: true,
      canReachWithSuperSneakers: true,
      canReachWithJetpackDrop: true,
      visualAffordance: {
        hasInclineRamp: true,
        hasHazardBumper: false,
        hasRoofCatwalk: true
      }
    };
  }
  return {
    type: 'SOLID_GROUND_HAZARD',
    accessibility: 'SOLID_GROUND_HAZARD',
    isClimbableFromGround: false,
    isSolidFrontAtGround: true,
    isRoofTraversable: true,
    isMoving: false,
    roofSurfaceY: 4.35,
    canJumpToFromAdjacentRoof: true,
    canReachWithSuperSneakers: true,
    canReachWithJetpackDrop: true,
    visualAffordance: {
      hasInclineRamp: false,
      hasHazardBumper: true,
      hasRoofCatwalk: true
    }
  };
}

export interface ObstacleInstance {
  id: string; // Unique obstacle instance identifier for binding active support
  group: THREE.Group;
  type: ObstacleType;
  lane: LaneIndex;
  collider: THREE.Box3;
  bodyCollider?: THREE.Box3; // Lower train hull lethal zone [0, TRAIN_HEIGHT - 0.45]
  frontBumperCollider?: THREE.Box3; // Front bumper lethal impact zone
  roofCollider?: THREE.Box3; // Train roof walkable & landing capture surface
  rampCollider?: THREE.Box3; // Sloped climbable ramp
  roofSurfaceY?: number; // Walkable roof elevation plane (CONSTANTS.TRAIN_HEIGHT + 0.15)
  rampStartZ?: number; // World Z where ramp touches ground
  rampEndZ?: number;   // World Z where ramp meets roof
  roofStartZ?: number; // World Z where roof starts (front)
  roofEndZ?: number;   // World Z where roof ends (rear)
  nearMissBox: THREE.Box3;
  nearMissTriggered: boolean;
  active: boolean;
  passed?: boolean;
  hasRamp?: boolean;
  length?: number;
  variant?: TrainVariant;
  accessibilityProfile?: TrainAccessibilityProfile; // Authoritative accessibility metadata
  // Dynamic moving train behavior
  isMoving?: boolean;
  velocityZ?: number;
  initialLocalZ?: number;
  telegraphed?: boolean;
  headlights?: THREE.Mesh[];
}

export class ObstacleFactory {
  private curvedManager = CurvedShaderManager.getInstance();

  // Materials & Geometries
  private barrierMat: THREE.MeshStandardMaterial;
  private trainRoofMat: THREE.MeshStandardMaterial;
  private trainWindowMat: THREE.MeshStandardMaterial;
  private trainWindowFrameMat: THREE.MeshStandardMaterial;
  private trainChassisMat: THREE.MeshStandardMaterial;
  private trainWheelMat: THREE.MeshStandardMaterial;
  private trainChromeMat: THREE.MeshStandardMaterial;
  private trainDarkRubberMat: THREE.MeshStandardMaterial;
  private trainWalkwayMat: THREE.MeshStandardMaterial;
  private trainStainlessFlutingMat: THREE.MeshStandardMaterial;
  private trainVentGrilleMat: THREE.MeshStandardMaterial;
  private trainHeadlightMat: THREE.MeshBasicMaterial;
  private trainTaillightMat: THREE.MeshBasicMaterial;
  private trainDestNeoMat: THREE.MeshBasicMaterial;
  private trainDestClassicMat: THREE.MeshBasicMaterial;
  private trainDestExpressMat: THREE.MeshBasicMaterial;
  private rampPlateMat: THREE.MeshStandardMaterial;
  private rampTrussMat: THREE.MeshStandardMaterial;
  private rampReflectorMat: THREE.MeshBasicMaterial;
  private rampTransitionMat: THREE.MeshStandardMaterial;
  private trainSpawnCounter = 0;

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
      roughness: 0.55,
      metalness: 0.35
    });
    this.curvedManager.applyCurvature(this.trainRoofMat);

    this.trainWindowMat = new THREE.MeshStandardMaterial({
      color: 0x162436,
      roughness: 0.08,
      metalness: 0.92
    });
    this.curvedManager.applyCurvature(this.trainWindowMat);

    this.trainWindowFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1c2028,
      roughness: 0.4,
      metalness: 0.45
    });
    this.curvedManager.applyCurvature(this.trainWindowFrameMat);

    this.trainChassisMat = new THREE.MeshStandardMaterial({
      color: 0x1a1e24,
      roughness: 0.75,
      metalness: 0.55
    });
    this.curvedManager.applyCurvature(this.trainChassisMat);

    this.trainWheelMat = new THREE.MeshStandardMaterial({
      color: 0x90a4ae,
      roughness: 0.18,
      metalness: 0.92
    });
    this.curvedManager.applyCurvature(this.trainWheelMat);

    this.trainChromeMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde6,
      roughness: 0.15,
      metalness: 0.92
    });
    this.curvedManager.applyCurvature(this.trainChromeMat);

    this.trainDarkRubberMat = new THREE.MeshStandardMaterial({
      color: 0x14161a,
      roughness: 0.92,
      metalness: 0.05
    });
    this.curvedManager.applyCurvature(this.trainDarkRubberMat);

    this.trainWalkwayMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getDiamondPlateTexture(),
      roughness: 0.55,
      metalness: 0.6
    });
    this.curvedManager.applyCurvature(this.trainWalkwayMat);

    this.trainStainlessFlutingMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getStainlessSteelFlutingTexture(),
      roughness: 0.22,
      metalness: 0.9
    });
    this.curvedManager.applyCurvature(this.trainStainlessFlutingMat);

    this.trainVentGrilleMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getVentGrilleTexture(),
      roughness: 0.4,
      metalness: 0.65
    });
    this.curvedManager.applyCurvature(this.trainVentGrilleMat);

    this.trainHeadlightMat = new THREE.MeshBasicMaterial({
      color: 0xfffae6
    });

    this.trainTaillightMat = new THREE.MeshBasicMaterial({
      color: 0xff1744
    });

    this.trainDestNeoMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getDestinationSignTexture('METRO 01', 'EXPRESS // DOWNTOWN', 0xffb300)
    });

    this.trainDestClassicMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getDestinationSignTexture('LOCAL 4', '42 ST // BROADWAY', 0x00e5ff)
    });

    this.trainDestExpressMat = new THREE.MeshBasicMaterial({
      map: TextureGenerator.getDestinationSignTexture('AERO 08', 'CENTRAL AIRPORT', 0x76ff03)
    });

    this.rampPlateMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getDiamondPlateTexture(),
      roughness: 0.5,
      metalness: 0.6
    });
    this.curvedManager.applyCurvature(this.rampPlateMat);

    this.rampTrussMat = new THREE.MeshStandardMaterial({
      color: 0x21252b, // Heavy industrial charcoal steel
      roughness: 0.65,
      metalness: 0.55
    });
    this.curvedManager.applyCurvature(this.rampTrussMat);

    this.rampReflectorMat = new THREE.MeshBasicMaterial({
      color: 0xffab00 // High-intensity amber corner reflector
    });

    this.rampTransitionMat = new THREE.MeshStandardMaterial({
      color: 0x78909c, // Steel transition plate
      roughness: 0.35,
      metalness: 0.75
    });
    this.curvedManager.applyCurvature(this.rampTransitionMat);
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
   * Create Full Production-Quality Stylized Metro Train with 3 Distinct Geometric Variants
   */
  public createTrain(
    length: number = CONSTANTS.TRAIN_LENGTH_SHORT,
    hasRamp: boolean = false,
    colorHex: number = CONSTANTS.COLORS.TRAIN_BODY_1,
    variant?: TrainVariant
  ): THREE.Group {
    const group = new THREE.Group();
    group.userData = { isTrain: true, type: hasRamp ? 'TRAIN_RAMP' : 'TRAIN' };
    const w = CONSTANTS.TRAIN_WIDTH;
    const h = CONSTANTS.TRAIN_HEIGHT;
    const bodyLength = length;

    // Pick or cycle variant if not explicitly provided
    if (!variant) {
      const variants: TrainVariant[] = ['MODERN_METRO', 'CLASSIC_TRANSIT', 'STREAMLINED_EXPRESS'];
      if (colorHex === CONSTANTS.COLORS.TRAIN_BODY_2) {
        variant = 'STREAMLINED_EXPRESS';
      } else if (colorHex === CONSTANTS.COLORS.TRAIN_BODY_3) {
        variant = 'CLASSIC_TRANSIT';
      } else {
        variant = variants[(this.trainSpawnCounter++) % variants.length];
      }
    }
    group.userData.variant = variant;

    // Pick accent color
    let accentColor = 0xffd600;
    if (colorHex === CONSTANTS.COLORS.TRAIN_BODY_2) accentColor = 0x00e676;
    if (colorHex === CONSTANTS.COLORS.TRAIN_BODY_3) accentColor = 0xffffff;

    // Livery PBR Material (Automotive / Transit Gloss Enamel)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: variant === 'CLASSIC_TRANSIT' ? 0xd0d5dd : colorHex,
      roughness: variant === 'CLASSIC_TRANSIT' ? 0.28 : 0.32,
      metalness: variant === 'CLASSIC_TRANSIT' ? 0.85 : 0.35
    });
    this.curvedManager.applyCurvature(bodyMat);

    // 1. Carriage Main Hull Body (Sculpted cross-section with tumblehome & cantrail curves)
    const hullMesh = this.buildCarriageHull(w, h, bodyLength, bodyMat);
    group.add(hullMesh);

    // 2. 3D Side Geometry: Windows, Recessed Frames, Doors, Fluting
    this.buildSideGeometry(group, w, h, bodyLength, variant, bodyMat, accentColor);

    // 3. Front Cab Architecture (Solid Impassable Cab vs Climbable Ramp Bulkhead)
    const noseLength = 1.35;
    if (hasRamp) {
      this.buildRampBulkhead(group, w, h, bodyLength, bodyMat, accentColor);
      this.buildRamp(group, w, h, bodyLength, noseLength);
    } else {
      this.buildFrontCab(group, w, h, bodyLength, noseLength, variant, bodyMat, colorHex, accentColor);
    }

    // 4. Rear Gangway & Taillight Details
    this.buildRearJunction(group, w, h, bodyLength);

    // 5. Roof Architecture & Walkable Catwalk Platform (strictly Y = 4.35m)
    this.buildRoofArchitecture(group, w, h, bodyLength, variant);

    // 6. Dual 2-Axle Rail Wheel Bogies & Underbody Equipment
    this.buildBogiesAndUnderbody(group, w, h, bodyLength, variant);

    return group;
  }

  /**
   * Builds the sculpted aerodynamic carriage shell with rounded cantrails, roof camber, and lower tumblehome
   */
  private buildCarriageHull(
    w: number,
    h: number,
    bodyLength: number,
    bodyMat: THREE.Material
  ): THREE.Mesh {
    const shape = new THREE.Shape();
    const halfW = w * 0.5;
    const floorY = 0.55;
    const waistY = 1.15;
    const cantrailY = h - 0.55;
    const roofApexY = h + 0.08;
    const roofCornerX = halfW - 0.42;
    const tumbleX = halfW - 0.12;

    // Closed 2D cross-section in X-Y
    shape.moveTo(-tumbleX, floorY);
    shape.lineTo(-halfW, waistY);
    shape.lineTo(-halfW, cantrailY);
    shape.quadraticCurveTo(-halfW, h, -roofCornerX, roofApexY - 0.04);
    shape.quadraticCurveTo(0, roofApexY, roofCornerX, roofApexY - 0.04);
    shape.quadraticCurveTo(halfW, h, halfW, cantrailY);
    shape.lineTo(halfW, waistY);
    shape.lineTo(tumbleX, floorY);
    shape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: bodyLength,
      bevelEnabled: false,
      steps: Math.max(4, Math.floor(bodyLength / 2.5))
    };
    const hullGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Center along Z axis
    hullGeo.translate(0, 0, -bodyLength * 0.5);

    const hullMesh = new THREE.Mesh(hullGeo, bodyMat);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    return hullMesh;
  }

  /**
   * Adds 3D side features: recessed window frames, tinted glass, passenger doors, and panel fluting
   */
  private buildSideGeometry(
    group: THREE.Group,
    w: number,
    h: number,
    bodyLength: number,
    variant: TrainVariant,
    bodyMat: THREE.Material,
    accentColor: number
  ): void {
    const halfW = w * 0.5;
    const bayCount = Math.max(3, Math.floor(bodyLength / 4.4));
    const usableLength = bodyLength * 0.78;
    const baySpacing = usableLength / bayCount;
    const startZ = -usableLength * 0.5 + baySpacing * 0.5;

    const frameMat = variant === 'CLASSIC_TRANSIT' ? this.trainChromeMat : this.trainWindowFrameMat;

    // Accent waistline stripe for Modern Metro
    if (variant === 'MODERN_METRO') {
      const stripeMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.3,
        metalness: 0.5
      });
      this.curvedManager.applyCurvature(stripeMat);

      [-1, 1].forEach((side) => {
        const stripeGeo = new THREE.BoxGeometry(0.04, 0.16, bodyLength * 0.96);
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(side * (halfW + 0.01), 1.8, 0);
        group.add(stripe);

        const pinGeo = new THREE.BoxGeometry(0.04, 0.04, bodyLength * 0.96);
        const pin = new THREE.Mesh(pinGeo, this.trainChromeMat);
        pin.position.set(side * (halfW + 0.01), 1.95, 0);
        group.add(pin);
      });
    }

    // Classic Subway: Corrugated Stainless Steel Fluting Panels
    if (variant === 'CLASSIC_TRANSIT') {
      [-1, 1].forEach((side) => {
        const flutingGeo = new THREE.BoxGeometry(0.04, 1.45, bodyLength * 0.96);
        const fluting = new THREE.Mesh(flutingGeo, this.trainStainlessFlutingMat);
        fluting.position.set(side * (halfW + 0.01), 1.3, 0);
        fluting.castShadow = true;
        group.add(fluting);

        const moldingGeo = new THREE.BoxGeometry(0.06, 0.08, bodyLength * 0.96);
        const molding = new THREE.Mesh(moldingGeo, this.trainChromeMat);
        molding.position.set(side * (halfW + 0.01), 2.05, 0);
        group.add(molding);
      });
    }

    // Streamlined Express: Low-profile aerodynamic skirt covers
    if (variant === 'STREAMLINED_EXPRESS') {
      [-1, 1].forEach((side) => {
        const skirtGeo = new THREE.BoxGeometry(0.05, 0.42, bodyLength * 0.95);
        const skirt = new THREE.Mesh(skirtGeo, this.trainChassisMat);
        skirt.position.set(side * (halfW - 0.02), 0.52, 0);
        group.add(skirt);

        const speedMat = new THREE.MeshStandardMaterial({
          color: 0x00e5ff,
          roughness: 0.2,
          metalness: 0.8
        });
        this.curvedManager.applyCurvature(speedMat);
        const lineGeo = new THREE.BoxGeometry(0.04, 0.08, bodyLength * 0.98);
        const line = new THREE.Mesh(lineGeo, speedMat);
        line.position.set(side * (halfW + 0.01), 3.4, 0);
        group.add(line);
      });
    }

    // Window bays and passenger doors
    for (let b = 0; b < bayCount; b++) {
      const bz = startZ + b * baySpacing;

      [-1, 1].forEach((side) => {
        const xPos = side * (halfW + 0.01);

        // 1. Recessed Window Frame
        const winWidth = baySpacing * 0.55;
        const winHeight = 1.15;
        const frameGeo = new THREE.BoxGeometry(0.06, winHeight, winWidth);
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(xPos, 2.65, bz);
        group.add(frame);

        // 2. Recessed Tinted Glass Pane
        const glassGeo = new THREE.BoxGeometry(0.04, winHeight - 0.12, winWidth - 0.12);
        const glass = new THREE.Mesh(glassGeo, this.trainWindowMat);
        glass.position.set(side * (halfW - 0.01), 2.65, bz);
        group.add(glass);

        // Window sill trim
        const sillGeo = new THREE.BoxGeometry(0.08, 0.05, winWidth + 0.1);
        const sill = new THREE.Mesh(sillGeo, this.trainChromeMat);
        sill.position.set(xPos, 2.05, bz);
        group.add(sill);

        // 3. Sliding Double Passenger Doors (between window bays)
        if (b < bayCount - 1) {
          const doorZ = bz + baySpacing * 0.5;
          const doorWidth = 1.35;
          const doorHeight = 2.25;

          // Door recess portal
          const doorPortalGeo = new THREE.BoxGeometry(0.06, doorHeight, doorWidth);
          const doorPortal = new THREE.Mesh(doorPortalGeo, frameMat);
          doorPortal.position.set(xPos, 1.7, doorZ);
          group.add(doorPortal);

          // Center rubber split seam
          const seamGeo = new THREE.BoxGeometry(0.08, doorHeight, 0.04);
          const seam = new THREE.Mesh(seamGeo, this.trainDarkRubberMat);
          seam.position.set(xPos, 1.7, doorZ);
          group.add(seam);

          // Door window panes (twin small windows in door leaves)
          [-doorWidth * 0.25, doorWidth * 0.25].forEach((dwOffset) => {
            const doorWinGeo = new THREE.BoxGeometry(0.05, 0.85, 0.38);
            const doorWin = new THREE.Mesh(doorWinGeo, this.trainWindowMat);
            doorWin.position.set(side * (halfW - 0.01), 2.15, doorZ + dwOffset);
            group.add(doorWin);
          });

          // Overhead amber door status indicator LED
          const ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
          const ledMat = new THREE.MeshBasicMaterial({ color: 0xff9100 });
          const led = new THREE.Mesh(ledGeo, ledMat);
          led.position.set(side * (halfW + 0.04), 2.9, doorZ);
          group.add(led);

          // Flush stainless grab handles
          [-doorWidth * 0.08, doorWidth * 0.08].forEach((hx) => {
            const handleGeo = new THREE.BoxGeometry(0.03, 0.35, 0.03);
            const handle = new THREE.Mesh(handleGeo, this.trainChromeMat);
            handle.position.set(side * (halfW + 0.03), 1.6, doorZ + hx);
            group.add(handle);
          });
        }
      });
    }
  }

  /**
   * Builds the front cab architecture with variant-specific aerodynamic nose, windshield, headlights, and bumper
   */
  private buildFrontCab(
    group: THREE.Group,
    w: number,
    h: number,
    bodyLength: number,
    noseLength: number,
    variant: TrainVariant,
    bodyMat: THREE.Material,
    colorHex: number,
    accentColor: number
  ): void {
    const halfW = w * 0.5;
    const frontZ = bodyLength * 0.5;
    const noseCenterZ = frontZ + noseLength * 0.5;
    const tipZ = frontZ + noseLength;

    if (variant === 'MODERN_METRO') {
      // 1. Lower Aerodynamic Nose Hood & Apron (y: 0.55m to 1.95m)
      const hoodHeight = 1.4;
      const hoodGeo = new THREE.BoxGeometry(w * 0.92, hoodHeight, noseLength);
      const hoodMesh = new THREE.Mesh(hoodGeo, bodyMat);
      hoodMesh.position.set(0, 0.55 + hoodHeight * 0.5, noseCenterZ);
      hoodMesh.castShadow = true;
      group.add(hoodMesh);

      // Chamfered front nose corner pillars angled forward
      [-1, 1].forEach((side) => {
        const pillarGeo = new THREE.CylinderGeometry(0.12, 0.18, 1.45, 8);
        const pillar = new THREE.Mesh(pillarGeo, bodyMat);
        pillar.position.set(side * halfW * 0.84, 2.65, frontZ + noseLength * 0.48);
        group.add(pillar);
      });

      // Shaded dark cab interior backplane
      const cabBackGeo = new THREE.BoxGeometry(w * 0.78, 1.35, 0.08);
      const cabBackMat = new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.95 });
      this.curvedManager.applyCurvature(cabBackMat);
      const cabBack = new THREE.Mesh(cabBackGeo, cabBackMat);
      cabBack.position.set(0, 2.65, frontZ + 0.12);
      group.add(cabBack);

      // 2. Large Curved Panoramic Windshield (Angled 16 deg back, visible & proud!)
      const glassGeo = new THREE.BoxGeometry(w * 0.76, 1.35, 0.08);
      const glass = new THREE.Mesh(glassGeo, this.trainWindowMat);
      glass.rotation.x = -0.28; // 16 degree aerodynamic slant
      glass.position.set(0, 2.65, frontZ + noseLength * 0.65);
      group.add(glass);

      // Thin polished chrome windshield wiper
      const wiperGeo = new THREE.BoxGeometry(0.02, 0.55, 0.04);
      const wiper = new THREE.Mesh(wiperGeo, this.trainChromeMat);
      wiper.rotation.z = 0.35;
      wiper.rotation.x = -0.28;
      wiper.position.set(0.15, 2.35, frontZ + noseLength * 0.72);
      group.add(wiper);

      // 3. Upper Cab Roof Cowl & Destination Housing (y: 3.35m to 4.25m)
      const cowlGeo = new THREE.BoxGeometry(w * 0.88, 0.85, noseLength * 0.75);
      const cowl = new THREE.Mesh(cowlGeo, bodyMat);
      cowl.position.set(0, 3.82, frontZ + noseLength * 0.38);
      cowl.castShadow = true;
      group.add(cowl);

      // Sun visor brow protruding over the top of the windshield
      const visorGeo = new THREE.BoxGeometry(w * 0.82, 0.12, 0.35);
      const visor = new THREE.Mesh(visorGeo, this.trainChassisMat);
      visor.position.set(0, 3.38, frontZ + noseLength * 0.68);
      group.add(visor);

      // Luminous LED Matrix Destination Display
      const destGeo = new THREE.BoxGeometry(w * 0.58, 0.34, 0.08);
      const destSign = new THREE.Mesh(destGeo, this.trainDestNeoMat);
      destSign.position.set(0, 3.75, frontZ + noseLength * 0.75);
      group.add(destSign);

      // Twin roof corner amber clearance marker lights
      [-halfW * 0.78, halfW * 0.78].forEach((mx) => {
        const markerGeo = new THREE.SphereGeometry(0.045, 8, 8);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(mx, 4.15, frontZ + noseLength * 0.55);
        group.add(marker);
      });

      // 4. Twin Projector Headlights
      [-halfW * 0.64, halfW * 0.64].forEach((hx) => {
        const podGeo = new THREE.BoxGeometry(0.55, 0.36, 0.22);
        const pod = new THREE.Mesh(podGeo, this.trainChassisMat);
        pod.position.set(hx, 1.35, tipZ - 0.05);
        group.add(pod);

        const bezelGeo = new THREE.TorusGeometry(0.18, 0.04, 8, 16);
        const bezel = new THREE.Mesh(bezelGeo, this.trainChromeMat);
        bezel.position.set(hx, 1.35, tipZ + 0.04);
        group.add(bezel);

        const hlGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 14);
        const hl = new THREE.Mesh(hlGeo, this.trainHeadlightMat);
        hl.rotation.x = Math.PI / 2;
        hl.position.set(hx, 1.35, tipZ + 0.05);
        group.add(hl);
      });

      // 5. Lower Titanium Cowcatcher Wedge
      const plowGeo = new THREE.BoxGeometry(w * 0.88, 0.42, 0.55);
      const plow = new THREE.Mesh(plowGeo, this.trainChassisMat);
      plow.position.set(0, 0.26, tipZ - 0.1);
      group.add(plow);

      // Heavy-Duty Solid Obstacle Hazard Bumper Beam across front cab
      const bumperGeo = new THREE.BoxGeometry(w * 0.92, 0.24, 0.18);
      const bumper = new THREE.Mesh(bumperGeo, this.barrierMat);
      bumper.position.set(0, 0.88, tipZ - 0.02);
      bumper.castShadow = true;
      group.add(bumper);

      // 6. Automatic Coupler
      const couplerGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.42, 8);
      const coupler = new THREE.Mesh(couplerGeo, this.trainChromeMat);
      coupler.rotation.x = Math.PI / 2;
      coupler.position.set(0, 0.42, tipZ + 0.15);
      group.add(coupler);
    } else if (variant === 'CLASSIC_TRANSIT') {
      // 1. Heavy Upright Cab Lower Face (y: 0.55m to 1.95m)
      const hoodHeight = 1.4;
      const hoodGeo = new THREE.BoxGeometry(w * 0.94, hoodHeight, noseLength * 0.75);
      const hoodMesh = new THREE.Mesh(hoodGeo, bodyMat);
      hoodMesh.position.set(0, 0.55 + hoodHeight * 0.5, frontZ + noseLength * 0.38);
      hoodMesh.castShadow = true;
      group.add(hoodMesh);

      // Shaded dark cab interior backplane
      const cabBackGeo = new THREE.BoxGeometry(w * 0.8, 1.35, 0.08);
      const cabBackMat = new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.95 });
      this.curvedManager.applyCurvature(cabBackMat);
      const cabBack = new THREE.Mesh(cabBackGeo, cabBackMat);
      cabBack.position.set(0, 2.65, frontZ + 0.12);
      group.add(cabBack);

      // 2. Dual-Pane Split Windshield
      [-halfW * 0.42, halfW * 0.42].forEach((wx) => {
        const paneGeo = new THREE.BoxGeometry(w * 0.34, 1.25, 0.08);
        const pane = new THREE.Mesh(paneGeo, this.trainWindowMat);
        pane.position.set(wx, 2.65, frontZ + noseLength * 0.72);
        group.add(pane);

        const frameGeo = new THREE.BoxGeometry(w * 0.38, 1.35, 0.06);
        const frame = new THREE.Mesh(frameGeo, this.trainChromeMat);
        frame.position.set(wx, 2.65, frontZ + noseLength * 0.7);
        group.add(frame);
      });

      // Center divider mullion post
      const mullionGeo = new THREE.BoxGeometry(0.14, 1.35, 0.12);
      const mullion = new THREE.Mesh(mullionGeo, this.trainChassisMat);
      mullion.position.set(0, 2.65, frontZ + noseLength * 0.74);
      group.add(mullion);

      // Outer cab corner posts
      [-halfW * 0.86, halfW * 0.86].forEach((cx) => {
        const postGeo = new THREE.BoxGeometry(0.14, 1.35, 0.12);
        const post = new THREE.Mesh(postGeo, this.trainChassisMat);
        post.position.set(cx, 2.65, frontZ + noseLength * 0.74);
        group.add(post);
      });

      // 3. Protruding heavy steel sun visor / rain brow
      const browGeo = new THREE.BoxGeometry(w * 0.94, 0.15, 0.42);
      const brow = new THREE.Mesh(browGeo, this.trainChassisMat);
      brow.position.set(0, 3.35, frontZ + noseLength * 0.85);
      group.add(brow);

      // Upper roof bulkhead housing destination sign
      const upperCowlGeo = new THREE.BoxGeometry(w * 0.9, 0.85, noseLength * 0.65);
      const upperCowl = new THREE.Mesh(upperCowlGeo, bodyMat);
      upperCowl.position.set(0, 3.82, frontZ + noseLength * 0.33);
      group.add(upperCowl);

      // Illuminated Roller-Sign Lightbox
      const signGeo = new THREE.BoxGeometry(w * 0.62, 0.36, 0.12);
      const sign = new THREE.Mesh(signGeo, this.trainDestClassicMat);
      sign.position.set(0, 3.72, frontZ + noseLength * 0.78);
      group.add(sign);

      // 4. Sealed-Beam Round Headlights in Cast-Iron Bezels
      [-halfW * 0.64, halfW * 0.64].forEach((hx) => {
        const bezelGeo = new THREE.TorusGeometry(0.22, 0.06, 8, 16);
        const bezel = new THREE.Mesh(bezelGeo, this.trainChassisMat);
        bezel.position.set(hx, 1.35, frontZ + noseLength * 0.76);
        group.add(bezel);

        const hlGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 14);
        const hl = new THREE.Mesh(hlGeo, this.trainHeadlightMat);
        hl.rotation.x = Math.PI / 2;
        hl.position.set(hx, 1.35, frontZ + noseLength * 0.78);
        group.add(hl);
      });

      // 5. Heavy Wedge Snowplow with Hazard Stripes
      const plowGeo = new THREE.BoxGeometry(w * 0.92, 0.52, 0.65);
      const plow = new THREE.Mesh(plowGeo, this.barrierMat);
      plow.position.set(0, 0.28, frontZ + noseLength * 0.82);
      group.add(plow);

      // 6. Janney Knuckle Coupler & Uncoupling Bar
      const couplerGeo = new THREE.BoxGeometry(0.28, 0.28, 0.45);
      const coupler = new THREE.Mesh(couplerGeo, this.trainChassisMat);
      coupler.position.set(0, 0.42, tipZ + 0.15);
      group.add(coupler);

      const uncoupleBarGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6);
      const uncoupleBar = new THREE.Mesh(uncoupleBarGeo, this.trainChassisMat);
      uncoupleBar.rotation.z = Math.PI / 2;
      uncoupleBar.position.set(0, 0.58, tipZ + 0.1);
      group.add(uncoupleBar);
    } else {
      // STREAMLINED_EXPRESS: Raked Bullet Wedge
      const hoodHeight = 1.35;
      const hoodGeo = new THREE.BoxGeometry(w * 0.9, hoodHeight, noseLength * 0.85);
      const hoodMesh = new THREE.Mesh(hoodGeo, bodyMat);
      hoodMesh.position.set(0, 0.55 + hoodHeight * 0.5, frontZ + noseLength * 0.425);
      hoodMesh.castShadow = true;
      group.add(hoodMesh);

      // Swept Cockpit Canopy Windshield (Angled 26 deg back)
      const canopyGeo = new THREE.BoxGeometry(w * 0.74, 1.45, 0.12);
      const canopy = new THREE.Mesh(canopyGeo, this.trainWindowMat);
      canopy.rotation.x = -0.42; // Aggressive 24 degree aerodynamic rake
      canopy.position.set(0, 2.7, frontZ + noseLength * 0.62);
      group.add(canopy);

      // Left & Right sleek raked A-pillars
      [-1, 1].forEach((side) => {
        const pillarGeo = new THREE.BoxGeometry(0.12, 1.45, 0.14);
        const pillar = new THREE.Mesh(pillarGeo, this.trainChassisMat);
        pillar.rotation.x = -0.42;
        pillar.position.set(side * halfW * 0.82, 2.7, frontZ + noseLength * 0.62);
        group.add(pillar);
      });

      // Upper aerodynamic roof cowl
      const upperCowlGeo = new THREE.BoxGeometry(w * 0.86, 0.78, noseLength * 0.75);
      const upperCowl = new THREE.Mesh(upperCowlGeo, bodyMat);
      upperCowl.position.set(0, 3.82, frontZ + noseLength * 0.38);
      upperCowl.castShadow = true;
      group.add(upperCowl);

      // Flush-mounted high-res LED destination display
      const destGeo = new THREE.BoxGeometry(w * 0.62, 0.28, 0.08);
      const destSign = new THREE.Mesh(destGeo, this.trainDestExpressMat);
      destSign.position.set(0, 3.68, frontZ + noseLength * 0.76);
      group.add(destSign);

      // Aerodynamic visor brow above destination sign
      const visorGeo = new THREE.BoxGeometry(w * 0.82, 0.08, 0.25);
      const visor = new THREE.Mesh(visorGeo, this.trainChassisMat);
      visor.position.set(0, 3.84, frontZ + noseLength * 0.78);
      group.add(visor);

      // Dual Horizontal Slit LED Headlight Arrays
      [-halfW * 0.62, halfW * 0.62].forEach((hx) => {
        const slitHousingGeo = new THREE.BoxGeometry(0.55, 0.18, 0.12);
        const slitHousing = new THREE.Mesh(slitHousingGeo, this.trainChassisMat);
        slitHousing.position.set(hx, 1.15, tipZ + 0.06);
        group.add(slitHousing);

        const slitLampGeo = new THREE.BoxGeometry(0.48, 0.12, 0.08);
        const slitLamp = new THREE.Mesh(slitLampGeo, this.trainHeadlightMat);
        slitLamp.position.set(hx, 1.15, tipZ + 0.1);
        group.add(slitLamp);
      });

      // Aerodynamic Track-Sweeper Spoiler
      const spoilerGeo = new THREE.BoxGeometry(w * 0.94, 0.28, 0.6);
      const spoiler = new THREE.Mesh(spoilerGeo, this.trainChassisMat);
      spoiler.position.set(0, 0.18, tipZ + 0.08);
      group.add(spoiler);

      // Heavy Hazard Anti-Climb Bumper Band (solid non-climbable hazard indicator)
      const hazardBumperGeo = new THREE.BoxGeometry(w * 0.9, 0.22, 0.18);
      const hazardBumper = new THREE.Mesh(hazardBumperGeo, this.barrierMat);
      hazardBumper.position.set(0, 0.45, tipZ + 0.12);
      group.add(hazardBumper);

      // Concealed Coupler Hatch
      const hatchGeo = new THREE.BoxGeometry(0.65, 0.35, 0.06);
      const hatch = new THREE.Mesh(hatchGeo, bodyMat);
      hatch.position.set(0, 0.42, tipZ + 0.14);
      group.add(hatch);
    }
  }

  /**
   * Builds the rear carriage junction with accordion gangway bellows, end door, and twin red taillights
   */
  private buildRearJunction(
    group: THREE.Group,
    w: number,
    h: number,
    bodyLength: number
  ): void {
    const halfW = w * 0.5;
    const rearZ = -bodyLength * 0.5;

    // Pleated accordion rubber gangway bellows
    const bellowGeo = new THREE.BoxGeometry(w * 0.52, 2.35, 0.35);
    const bellow = new THREE.Mesh(bellowGeo, this.trainDarkRubberMat);
    bellow.position.set(0, 1.8, rearZ - 0.15);
    group.add(bellow);

    // Heavy steel bulkhead end door
    const doorGeo = new THREE.BoxGeometry(w * 0.38, 2.1, 0.08);
    const door = new THREE.Mesh(doorGeo, this.trainChassisMat);
    door.position.set(0, 1.8, rearZ - 0.32);
    group.add(door);

    // Twin red LED taillights
    [-halfW * 0.64, halfW * 0.64].forEach((tx) => {
      const bezelGeo = new THREE.TorusGeometry(0.18, 0.04, 8, 16);
      const bezel = new THREE.Mesh(bezelGeo, this.trainChassisMat);
      bezel.position.set(tx, 1.35, rearZ - 0.02);
      group.add(bezel);

      const tlGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 12);
      const tl = new THREE.Mesh(tlGeo, this.trainTaillightMat);
      tl.rotation.x = Math.PI / 2;
      tl.position.set(tx, 1.35, rearZ - 0.03);
      group.add(tl);
    });

    // Rear coupler
    const couplerGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.4, 8);
    const coupler = new THREE.Mesh(couplerGeo, this.trainChassisMat);
    coupler.rotation.x = Math.PI / 2;
    coupler.position.set(0, 0.42, rearZ - 0.35);
    group.add(coupler);
  }

  /**
   * Builds the roof architecture: walkable catwalk platform (top face exactly at Y = 4.35m),
   * low-profile HVAC units, pantographs, and exhaust cowls
   */
  private buildRoofArchitecture(
    group: THREE.Group,
    w: number,
    h: number,
    bodyLength: number,
    variant: TrainVariant
  ): void {
    // 1. Central Walkable Anti-Slip Runway Catwalk (Exacting Y = 4.35m top surface)
    // Thickness = 0.14m, centered at Y = 4.28m, so top face is exactly at 4.35m!
    const catwalkWidth = 1.7;
    const catwalkGeo = new THREE.BoxGeometry(catwalkWidth, 0.14, bodyLength * 0.98);
    const catwalk = new THREE.Mesh(catwalkGeo, this.trainWalkwayMat);
    catwalk.position.set(0, 4.28, 0);
    catwalk.receiveShadow = true;
    group.add(catwalk);

    // Yellow safety edge boundaries along catwalk sides
    [-catwalkWidth * 0.5, catwalkWidth * 0.5].forEach((cx) => {
      const edgeGeo = new THREE.BoxGeometry(0.06, 0.16, bodyLength * 0.98);
      const edge = new THREE.Mesh(edgeGeo, this.barrierMat);
      edge.position.set(cx, 4.28, 0);
      group.add(edge);
    });

    // 2. High-Visibility Rear Hazard Boundary Threshold (marks the physical end of the roof)
    const rearThresholdGeo = new THREE.BoxGeometry(catwalkWidth + 0.08, 0.14, 0.45);
    const rearThreshold = new THREE.Mesh(rearThresholdGeo, this.barrierMat);
    rearThreshold.position.set(0, 4.28, -bodyLength * 0.485);
    rearThreshold.receiveShadow = true;
    group.add(rearThreshold);

    if (variant === 'MODERN_METRO') {
      // 2 Low-profile aerodynamic HVAC Pods
      const hvacCount = Math.max(2, Math.floor(bodyLength / 9));
      const hvacSpacing = bodyLength / (hvacCount + 1);

      for (let c = 0; c < hvacCount; c++) {
        const zOffset = -bodyLength * 0.4 + (c + 0.5) * hvacSpacing;

        const hvacGeo = new THREE.BoxGeometry(w * 0.62, 0.28, 2.3);
        const hvac = new THREE.Mesh(hvacGeo, this.trainRoofMat);
        hvac.position.set(0, 4.45, zOffset);
        hvac.castShadow = true;
        group.add(hvac);

        const fanGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.06, 16);
        const fan = new THREE.Mesh(fanGeo, this.trainChassisMat);
        fan.position.set(0, 4.62, zOffset);
        group.add(fan);
      }

      // Modern single-arm pantograph
      const pantoBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 1.2), this.trainChassisMat);
      pantoBase.position.set(0, 4.42, 0);
      group.add(pantoBase);

      const pantoArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85, 6), this.trainChromeMat);
      pantoArm.rotation.x = -0.45;
      pantoArm.position.set(0, 4.75, 0);
      group.add(pantoArm);
    } else if (variant === 'CLASSIC_TRANSIT') {
      // Heavy Industrial Radiator Pods with Louvers & Circular Fans
      const podCount = Math.max(2, Math.floor(bodyLength / 8.5));
      const podSpacing = bodyLength / (podCount + 1);

      for (let c = 0; c < podCount; c++) {
        const zOffset = -bodyLength * 0.38 + (c + 0.5) * podSpacing;

        const podGeo = new THREE.BoxGeometry(w * 0.68, 0.32, 2.1);
        const pod = new THREE.Mesh(podGeo, this.trainChassisMat);
        pod.position.set(0, 4.47, zOffset);
        pod.castShadow = true;
        group.add(pod);

        const grilleGeo = new THREE.BoxGeometry(w * 0.54, 0.04, 1.6);
        const grille = new THREE.Mesh(grilleGeo, this.trainVentGrilleMat);
        grille.position.set(0, 4.65, zOffset);
        group.add(grille);
      }

      // Exposed electrical conduit pipes along roof
      [-catwalkWidth * 0.58, catwalkWidth * 0.58].forEach((px) => {
        const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, bodyLength * 0.92, 6);
        const pipe = new THREE.Mesh(pipeGeo, this.trainChromeMat);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.set(px, 4.38, 0);
        group.add(pipe);
      });

      // Vintage diamond-frame pantograph
      const pantoBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.14, 1.4), this.trainChassisMat);
      pantoBase.position.set(0, 4.43, 0);
      group.add(pantoBase);

      const pantoArm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), this.trainChassisMat);
      pantoArm1.rotation.x = -0.45;
      pantoArm1.position.set(0, 4.72, -0.2);
      group.add(pantoArm1);

      const pantoArm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), this.trainChassisMat);
      pantoArm2.rotation.x = 0.45;
      pantoArm2.position.set(0, 4.72, 0.2);
      group.add(pantoArm2);
    } else {
      // STREAMLINED_EXPRESS: Continuous Streamlined Roof Fairing
      [-1, 1].forEach((side) => {
        const fairingGeo = new THREE.BoxGeometry(w * 0.28, 0.26, bodyLength * 0.96);
        const fairing = new THREE.Mesh(fairingGeo, this.trainRoofMat);
        fairing.position.set(side * (w * 0.35), 4.41, 0);
        fairing.castShadow = true;
        group.add(fairing);
      });

      // High-speed aerodynamic pantograph
      const pantoGeo = new THREE.BoxGeometry(0.9, 0.18, 0.6);
      const panto = new THREE.Mesh(pantoGeo, this.trainChromeMat);
      panto.position.set(0, 4.45, 0);
      group.add(panto);
    }
  }

  /**
   * Builds the dual 2-axle rail wheel bogies with flanged wheels, coil springs, and underbody equipment
   */
  private buildBogiesAndUnderbody(
    group: THREE.Group,
    w: number,
    h: number,
    bodyLength: number,
    variant: TrainVariant
  ): void {
    // 1. Dual 2-Axle Wheel Bogies (Trucks)
    const bogieZOffsets = [-bodyLength * 0.34, bodyLength * 0.34];
    bogieZOffsets.forEach((bz) => {
      const bogie = this.createDetailedBogie(variant);
      bogie.position.set(0, 0.33, bz);
      group.add(bogie);
    });

    // 2. Underbody Equipment Modules (Center between bogies)
    const midZ = 0;
    [-0.55, 0.55].forEach((tx) => {
      const tankGeo = new THREE.CylinderGeometry(0.24, 0.24, 2.6, 12);
      const tank = new THREE.Mesh(tankGeo, this.trainChassisMat);
      tank.rotation.x = Math.PI / 2;
      tank.position.set(tx, 0.36, midZ - 0.8);
      group.add(tank);

      [-0.8, 0.8].forEach((sz) => {
        const strapGeo = new THREE.TorusGeometry(0.26, 0.03, 6, 12);
        const strap = new THREE.Mesh(strapGeo, this.trainChromeMat);
        strap.position.set(tx, 0.36, midZ - 0.8 + sz);
        group.add(strap);
      });
    });

    const inverterGeo = new THREE.BoxGeometry(1.4, 0.42, 1.8);
    const inverter = new THREE.Mesh(inverterGeo, this.trainChassisMat);
    inverter.position.set(0, 0.35, midZ + 1.1);
    group.add(inverter);

    const finGeo = new THREE.BoxGeometry(1.44, 0.36, 1.6);
    const fin = new THREE.Mesh(finGeo, this.trainVentGrilleMat);
    fin.position.set(0, 0.35, midZ + 1.1);
    group.add(fin);
  }

  /**
   * Helper to construct a high-fidelity 2-axle rail wheel bogie (truck) with flanged wheels
   */
  private createDetailedBogie(variant: TrainVariant): THREE.Group {
    const bogie = new THREE.Group();

    // Heavy cast-steel H-frame bolster subframe
    const frameGeo = new THREE.BoxGeometry(CONSTANTS.TRAIN_WIDTH * 0.72, 0.22, 2.5);
    const frame = new THREE.Mesh(frameGeo, this.trainChassisMat);
    frame.castShadow = true;
    bogie.add(frame);

    // 4 Flanged Steel Rail Wheels on 2 Axles (Gauge ±0.8m)
    const treadGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.12, 16);
    const flangeGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.04, 16);
    const axleGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.85, 8);
    const springGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.26, 8);

    [-0.82, 0.82].forEach((axleZ) => {
      // Solid steel axle bar
      const axle = new THREE.Mesh(axleGeo, this.trainChassisMat);
      axle.rotation.z = Math.PI / 2;
      axle.position.set(0, 0, axleZ);
      bogie.add(axle);

      // Left wheel (-0.8m X)
      const leftWheelTread = new THREE.Mesh(treadGeo, this.trainWheelMat);
      leftWheelTread.rotation.z = Math.PI / 2;
      leftWheelTread.position.set(-0.8, 0, axleZ);
      leftWheelTread.castShadow = true;
      bogie.add(leftWheelTread);

      // Left wheel inner flange (resting inside rail head)
      const leftWheelFlange = new THREE.Mesh(flangeGeo, this.trainWheelMat);
      leftWheelFlange.rotation.z = Math.PI / 2;
      leftWheelFlange.position.set(-0.73, 0, axleZ);
      bogie.add(leftWheelFlange);

      // Right wheel (+0.8m X)
      const rightWheelTread = new THREE.Mesh(treadGeo, this.trainWheelMat);
      rightWheelTread.rotation.z = Math.PI / 2;
      rightWheelTread.position.set(0.8, 0, axleZ);
      rightWheelTread.castShadow = true;
      bogie.add(rightWheelTread);

      // Right wheel inner flange
      const rightWheelFlange = new THREE.Mesh(flangeGeo, this.trainWheelMat);
      rightWheelFlange.rotation.z = Math.PI / 2;
      rightWheelFlange.position.set(0.73, 0, axleZ);
      bogie.add(rightWheelFlange);

      // Coil suspension spring clusters above axle journal boxes
      [-1.02, 1.02].forEach((sx) => {
        const spring = new THREE.Mesh(springGeo, this.trainChromeMat);
        spring.position.set(sx, 0.18, axleZ);
        bogie.add(spring);
      });
    });

    // Third-rail pickup shoe beam on outer flanks
    [-1.15, 1.15].forEach((bx) => {
      const beamGeo = new THREE.BoxGeometry(0.08, 0.08, 1.9);
      const beam = new THREE.Mesh(beamGeo, this.trainChassisMat);
      beam.position.set(bx, 0.04, 0);
      bogie.add(beam);

      const shoeGeo = new THREE.BoxGeometry(0.14, 0.04, 0.35);
      const shoe = new THREE.Mesh(shoeGeo, this.trainChromeMat);
      shoe.position.set(bx, -0.02, 0);
      bogie.add(shoe);
    });

    return bogie;
  }

  /**
   * Builds the front structural mounting bulkhead when a train is equipped with a climbable ramp.
   * Replaces driver cab glass/wipers with a heavy structural bulkhead, maintenance access door,
   * safety grab irons, and frame mounting gussets.
   */
  private buildRampBulkhead(
    group: THREE.Group,
    w: number,
    h: number,
    bodyLength: number,
    bodyMat: THREE.Material,
    accentColor: number
  ): void {
    const halfW = w * 0.5;
    const frontZ = bodyLength * 0.5;

    // 1. Heavy Structural Steel Carriage End Wall Bulkhead
    const bulkheadGeo = new THREE.BoxGeometry(w * 0.94, h * 0.88, 0.22);
    const bulkhead = new THREE.Mesh(bulkheadGeo, this.trainChassisMat);
    bulkhead.position.set(0, h * 0.48, frontZ + 0.11);
    bulkhead.castShadow = true;
    group.add(bulkhead);

    // Outer reinforced doorframe / portal trim
    const trimGeo = new THREE.BoxGeometry(w * 0.82, h * 0.78, 0.12);
    const trimMesh = new THREE.Mesh(trimGeo, bodyMat);
    trimMesh.position.set(0, h * 0.46, frontZ + 0.24);
    group.add(trimMesh);

    // 2. Heavy Industrial Service Bulkhead Door with reinforced cross-bracing
    const doorGeo = new THREE.BoxGeometry(1.3, 2.2, 0.08);
    const doorMesh = new THREE.Mesh(doorGeo, this.trainChassisMat);
    doorMesh.position.set(0, 1.6, frontZ + 0.31);
    group.add(doorMesh);

    // Service door wire-mesh inspection viewport
    const winGeo = new THREE.BoxGeometry(0.55, 0.65, 0.06);
    const winMesh = new THREE.Mesh(winGeo, this.trainWindowMat);
    winMesh.position.set(0, 2.1, frontZ + 0.36);
    group.add(winMesh);

    // 3. Heavy-Duty Steel Mounting Brackets connecting Ramp Stringers to Train Chassis
    [-halfW * 0.65, halfW * 0.65].forEach((bx) => {
      // Lower chassis anchor bracket
      const lowerBracketGeo = new THREE.BoxGeometry(0.24, 0.55, 0.6);
      const lowerBracket = new THREE.Mesh(lowerBracketGeo, this.rampTrussMat);
      lowerBracket.position.set(bx, 0.8, frontZ + 0.3);
      group.add(lowerBracket);

      // Upper roof transition gusset
      const upperBracketGeo = new THREE.BoxGeometry(0.24, 0.45, 0.5);
      const upperBracket = new THREE.Mesh(upperBracketGeo, this.rampTrussMat);
      upperBracket.position.set(bx, 4.1, frontZ + 0.25);
      group.add(upperBracket);

      // Vertical safety grab iron ladder for maintenance crew
      const ladderGeo = new THREE.CylinderGeometry(0.025, 0.025, 2.4, 6);
      const ladder = new THREE.Mesh(ladderGeo, this.trainChromeMat);
      ladder.position.set(bx < 0 ? -halfW * 0.85 : halfW * 0.85, 2.0, frontZ + 0.28);
      group.add(ladder);
    });

    // 4. Overhead Amber Transit Clearance Beacons
    [-halfW * 0.75, halfW * 0.75].forEach((mx) => {
      const beaconGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const beacon = new THREE.Mesh(beaconGeo, this.rampReflectorMat);
      beacon.position.set(mx, 4.22, frontZ + 0.25);
      group.add(beacon);
    });
  }

  /**
   * Builds the climbable steel diamond-plate ramp with believable structural under-deck trusses,
   * high-visibility hazard skirts, tubular safety handrails, and approach toe plate
   */
  private buildRamp(
    group: THREE.Group,
    w: number,
    h: number,
    bodyLength: number,
    noseLength: number
  ): void {
    const rampLength = CONSTANTS.TRAIN_RAMP_LENGTH; // 8.0m
    const rampWidth = w * 0.86;
    const rampHeight = 4.35; // Matches the exact 4.35m catwalk top surface

    const halfD = bodyLength * 0.5;
    const rampZCenter = halfD + rampLength * 0.5;
    const slantLength = Math.sqrt(rampLength * rampLength + rampHeight * rampHeight);
    const rampAngle = Math.atan2(rampHeight, rampLength);

    // 1. Walkway Deck: Exactly connects (Z = halfD + rampLength, Y = 0) to (Z = halfD, Y = 4.35)
    // Box dimensions: [rampWidth, 0.22, slantLength]
    // Rotated by rampAngle around X:
    // At -slantLength/2: Z = rampZCenter - (slant/2)*cos(theta) = halfD; Y = rampHeight/2 + (slant/2)*sin(theta) = 4.35m
    // At +slantLength/2: Z = rampZCenter + (slant/2)*cos(theta) = halfD + rampLength; Y = rampHeight/2 - (slant/2)*sin(theta) = 0.0m
    const rampGeo = new THREE.BoxGeometry(rampWidth, 0.22, slantLength);
    const rampMesh = new THREE.Mesh(rampGeo, this.trainWalkwayMat);
    rampMesh.rotation.x = rampAngle;
    rampMesh.position.set(0, rampHeight * 0.5, rampZCenter);
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    group.add(rampMesh);

    // 2. High-Visibility Side Hazard Warning Skirts running full slant length
    const skirtGeo = new THREE.BoxGeometry(0.14, 0.45, slantLength);
    [-rampWidth * 0.51, rampWidth * 0.51].forEach((sx) => {
      const skirt = new THREE.Mesh(skirtGeo, this.barrierMat);
      skirt.rotation.x = rampAngle;
      skirt.position.set(sx, rampHeight * 0.5 + 0.15, rampZCenter);
      skirt.castShadow = true;
      group.add(skirt);

      // Elevated Tubular Steel Safety Guide-Rails along top of skirts
      const railGeo = new THREE.CylinderGeometry(0.04, 0.04, slantLength * 0.98, 8);
      const rail = new THREE.Mesh(railGeo, this.trainChromeMat);
      rail.rotation.x = rampAngle + Math.PI / 2;
      rail.position.set(sx, rampHeight * 0.5 + 0.42, rampZCenter);
      group.add(rail);
    });

    // 3. Longitudinal Structural I-Beam Stringers under left & right deck edges
    [-rampWidth * 0.42, rampWidth * 0.42].forEach((bx) => {
      const stringerGeo = new THREE.BoxGeometry(0.12, 0.24, slantLength);
      const stringer = new THREE.Mesh(stringerGeo, this.rampTrussMat);
      stringer.rotation.x = rampAngle;
      stringer.position.set(bx, rampHeight * 0.5 - 0.14, rampZCenter);
      stringer.castShadow = true;
      group.add(stringer);
    });

    // 4. Structural Steel Under-Deck Truss Bents (Ground to Incline Deck)
    // Placed at 3 equidistant stations along the ramp:
    // Station 1: DeltaZ = 2.0m from train body (t = 0.75, deck Y = 3.26m)
    // Station 2: DeltaZ = 4.0m from train body (t = 0.50, deck Y = 2.18m)
    // Station 3: DeltaZ = 6.0m from train body (t = 0.25, deck Y = 1.09m)
    const stations = [
      { dZ: 2.0, deckY: 3.26 },
      { dZ: 4.0, deckY: 2.18 },
      { dZ: 6.0, deckY: 1.09 }
    ];

    stations.forEach(({ dZ, deckY }) => {
      const bentZ = halfD + dZ;
      const colHeight = deckY - 0.1;
      const colCenterY = 0.05 + colHeight * 0.5;

      [-rampWidth * 0.44, rampWidth * 0.44].forEach((cx) => {
        const colGeo = new THREE.BoxGeometry(0.12, colHeight, 0.12);
        const col = new THREE.Mesh(colGeo, this.rampTrussMat);
        col.position.set(cx, colCenterY, bentZ);
        col.castShadow = true;
        group.add(col);

        // Ground anchor footplate
        const footGeo = new THREE.BoxGeometry(0.24, 0.06, 0.28);
        const foot = new THREE.Mesh(footGeo, this.rampTrussMat);
        foot.position.set(cx, 0.03, bentZ);
        group.add(foot);
      });

      // Transverse cross-brace beam connecting columns
      const crossBeamGeo = new THREE.BoxGeometry(rampWidth * 0.88, 0.1, 0.1);
      const crossBeam = new THREE.Mesh(crossBeamGeo, this.rampTrussMat);
      crossBeam.position.set(0, deckY - 0.18, bentZ);
      group.add(crossBeam);

      // Diagonal cross-tie X-struts for stations with sufficient height
      if (colHeight > 1.2) {
        const diagLen = Math.sqrt(Math.pow(rampWidth * 0.88, 2) + Math.pow(colHeight * 0.7, 2));
        const diagAngle = Math.atan2(colHeight * 0.7, rampWidth * 0.88);

        const diag1Geo = new THREE.BoxGeometry(diagLen, 0.05, 0.05);
        const diag1 = new THREE.Mesh(diag1Geo, this.rampTrussMat);
        diag1.rotation.z = diagAngle;
        diag1.position.set(0, colCenterY, bentZ);
        group.add(diag1);

        const diag2 = new THREE.Mesh(diag1Geo, this.rampTrussMat);
        diag2.rotation.z = -diagAngle;
        diag2.position.set(0, colCenterY, bentZ);
        group.add(diag2);
      }
    });

    // 5. Ground Entry Transition Toe Plate (smooth steel approach wedge at base Z = halfD + rampLength)
    const toeGeo = new THREE.BoxGeometry(rampWidth * 1.04, 0.08, 0.7);
    const toeMesh = new THREE.Mesh(toeGeo, this.rampTransitionMat);
    toeMesh.position.set(0, 0.04, halfD + rampLength);
    toeMesh.receiveShadow = true;
    group.add(toeMesh);

    // Hazard warning stripe across the toe plate front edge
    const toeStripeGeo = new THREE.BoxGeometry(rampWidth * 1.04, 0.09, 0.14);
    const toeStripe = new THREE.Mesh(toeStripeGeo, this.barrierMat);
    toeStripe.position.set(0, 0.045, halfD + rampLength + 0.28);
    group.add(toeStripe);

    // Twin High-Intensity Amber Corner Reflector Blocks at ramp entrance
    [-rampWidth * 0.52, rampWidth * 0.52].forEach((rx) => {
      const reflectorGeo = new THREE.BoxGeometry(0.12, 0.18, 0.18);
      const reflector = new THREE.Mesh(reflectorGeo, this.rampReflectorMat);
      reflector.position.set(rx, 0.12, halfD + rampLength + 0.15);
      group.add(reflector);
    });

    // 6. Seamless Upper Transition Threshold Plate (at crest Z = halfD, Y = 4.35m)
    const thresholdGeo = new THREE.BoxGeometry(rampWidth * 0.98, 0.08, 0.45);
    const threshold = new THREE.Mesh(thresholdGeo, this.rampTransitionMat);
    threshold.position.set(0, 4.35, halfD);
    threshold.receiveShadow = true;
    group.add(threshold);

    const thresholdStripeGeo = new THREE.BoxGeometry(rampWidth * 0.98, 0.09, 0.12);
    const thresholdStripe = new THREE.Mesh(thresholdStripeGeo, this.barrierMat);
    thresholdStripe.position.set(0, 4.355, halfD);
    group.add(thresholdStripe);
  }

  /**
   * Create Heavy Trackwork Side Barrier (Construction Barricade with Amber Flasher)
   */
  public createSideBarrier(): THREE.Group {
    const group = new THREE.Group();
    const w = CONSTANTS.SIDE_BARRIER_WIDTH;
    const h = CONSTANTS.SIDE_BARRIER_HEIGHT;

    // 1. Concrete K-rail base
    const baseGeo = new THREE.BoxGeometry(w, 0.55, 0.9);
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x607d8b, roughness: 0.85, metalness: 0.1 });
    this.curvedManager.applyCurvature(concreteMat);
    const base = new THREE.Mesh(baseGeo, concreteMat);
    base.position.y = 0.28;
    base.castShadow = true;
    group.add(base);

    // 2. Twin steel vertical posts
    const postGeo = new THREE.BoxGeometry(0.12, h - 0.5, 0.12);
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.6, metalness: 0.5 });
    this.curvedManager.applyCurvature(steelMat);

    [-w * 0.42, w * 0.42].forEach((xPos) => {
      const post = new THREE.Mesh(postGeo, steelMat);
      post.position.set(xPos, 0.55 + (h - 0.5) * 0.5, 0);
      post.castShadow = true;
      group.add(post);
    });

    // 3. Large reflective hazard chevron panel
    const panelGeo = new THREE.BoxGeometry(w * 0.95, 0.9, 0.12);
    const panel = new THREE.Mesh(panelGeo, this.barrierMat);
    panel.position.set(0, 1.35, 0);
    panel.castShadow = true;
    group.add(panel);

    // 4. Flashing amber LED beacon
    const beaconBaseGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.1, 10);
    const beaconBase = new THREE.Mesh(beaconBaseGeo, steelMat);
    beaconBase.position.set(0, h + 0.05, 0);
    group.add(beaconBase);

    const beaconGeo = new THREE.SphereGeometry(0.09, 10, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff9100 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, h + 0.14, 0);
    group.add(beacon);

    return group;
  }

  /**
   * Create Low Tunnel Clearance Archway (Requires Slide Under)
   */
  public createTunnelArch(): THREE.Group {
    const group = new THREE.Group();
    const spanW = CONSTANTS.LANE_WIDTH * 0.96;
    const archH = CONSTANTS.TUNNEL_ARCH_HEIGHT;
    const clearance = CONSTANTS.TUNNEL_ARCH_CLEARANCE;

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7, metalness: 0.6 });
    this.curvedManager.applyCurvature(steelMat);

    // 1. Heavy tubular steel support columns on left & right
    const colGeo = new THREE.CylinderGeometry(0.14, 0.18, archH, 12);
    [-spanW * 0.48, spanW * 0.48].forEach((xPos) => {
      const col = new THREE.Mesh(colGeo, steelMat);
      col.position.set(xPos, archH * 0.5, 0);
      col.castShadow = true;
      group.add(col);
    });

    // 2. Heavy overhead steel truss spanning across
    const trussH = archH - clearance;
    const trussGeo = new THREE.BoxGeometry(spanW, trussH, 0.6);
    const truss = new THREE.Mesh(trussGeo, steelMat);
    truss.position.set(0, clearance + trussH * 0.5, 0);
    truss.castShadow = true;
    group.add(truss);

    // 3. Lower hazard warning strip
    const stripGeo = new THREE.BoxGeometry(spanW * 0.96, 0.28, 0.64);
    const strip = new THREE.Mesh(stripGeo, this.barrierMat);
    strip.position.set(0, clearance + 0.14, 0);
    group.add(strip);

    // 4. Center flashing red clearance warning lamp
    const lampGeo = new THREE.SphereGeometry(0.12, 10, 8);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(0, clearance + trussH * 0.5, 0.35);
    group.add(lamp);

    return group;
  }

  /**
   * Create High-Speed Moving Metro Train with Dynamic Flashing Headlights
   */
  public createMovingTrain(
    length: number = CONSTANTS.TRAIN_LENGTH_SHORT,
    colorHex: number = CONSTANTS.COLORS.TRAIN_BODY_2
  ): { group: THREE.Group; headlights: THREE.Mesh[] } {
    // Start with base train structure
    const group = this.createTrain(length, false, colorHex);
    group.userData = { isTrain: true, isMoving: true, type: 'MOVING_TRAIN' };

    // Find and reference the twin headlights for flashing telegraph
    const headlights: THREE.Mesh[] = [];
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material === this.trainHeadlightMat) {
        headlights.push(child);
      }
    });

    return { group, headlights };
  }
}
