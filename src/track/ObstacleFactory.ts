import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { CurvedShaderManager } from '../scene/CurvedShader';
import { TextureGenerator } from '../scene/TextureGenerator';
import { TrainCompositionDef, CarriageComponent, RooftopObstacleDef } from './TrainComposition';

export type TrainVariant = 'MODERN_METRO' | 'CLASSIC_TRANSIT' | 'STREAMLINED_EXPRESS';

export type ObstacleType = 
  | 'TRAIN' 
  | 'TRAIN_RAMP' 
  | 'MOVING_TRAIN' 
  | 'TRAIN_COMPOSITION'
  | 'ROOFTOP_AC_HURDLE'
  | 'ROOFTOP_VENT'
  | 'LOW_BARRIER' 
  | 'MEDIUM_BARRIER'
  | 'HIGH_BARRIER' 
  | 'SIDE_BARRIER' 
  | 'PILLAR'
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
  isMovingActive?: boolean; // Moving from spawn until removed
  velocityZ?: number;
  initialLocalZ?: number;
  previousWorldZ?: number;
  telegraphed?: boolean;
  headlights?: THREE.Mesh[];
  wheelMeshes?: THREE.Mesh[]; // Bogie wheel meshes for realistic rotation
  headlightBeam?: THREE.Mesh; // Forward track illumination beam
  // Train composition & multi-carriage support
  isComposition?: boolean;
  compositionDef?: TrainCompositionDef;
  carriageGroupId?: string; // Stable group identifier connecting multiple carriages
  carriages?: Array<{ id: string; type: string; length: number; localOffsetZ: number }>;
  hasExitRamp?: boolean;
  exitRampCollider?: THREE.Box3;
  exitRampStartZ?: number; // World Z where exit ramp starts (at roof)
  exitRampEndZ?: number;   // World Z where exit ramp touches ground
  rooftopObstacles?: Array<{
    id: string;
    type: 'ROOFTOP_AC_HURDLE' | 'ROOFTOP_VENT';
    collider: THREE.Box3;
    cleared?: boolean;
  }>;
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
  private mediumBarrierMat: THREE.MeshStandardMaterial;
  private pillarMat: THREE.MeshStandardMaterial;
  private highBarrierGantryMat: THREE.MeshStandardMaterial;
  private lowBarrierMats: THREE.MeshStandardMaterial[] = [];
  private highBarrierMats: THREE.MeshStandardMaterial[] = [];
  private gantryPedestalMat: THREE.MeshStandardMaterial;
  private barrierCastIronMat: THREE.MeshStandardMaterial;
  private gantryDarkSteelMat: THREE.MeshStandardMaterial;
  private gantryTrussSteelMat: THREE.MeshStandardMaterial;
  private beaconAmberMat: THREE.MeshBasicMaterial;
  private beaconRedMat: THREE.MeshBasicMaterial;
  private beaconCyanMat: THREE.MeshBasicMaterial;
  private reflectiveTrimMat: THREE.MeshBasicMaterial;
  private hazardYellowMat: THREE.MeshBasicMaterial;
  private trainSpawnCounter = 0;
  private lowBarrierVariantCounter = 0;
  private highBarrierVariantCounter = 0;

  constructor() {
    this.lowBarrierMats = [0, 1, 2].map(v => {
      const mat = new THREE.MeshStandardMaterial({
        map: TextureGenerator.getLowHurdleTexture(v),
        roughness: 0.36,
        metalness: 0.28
      });
      this.curvedManager.applyCurvature(mat);
      return mat;
    });
    this.barrierMat = this.lowBarrierMats[0];

    this.mediumBarrierMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getMediumBarrierTexture(),
      roughness: 0.40,
      metalness: 0.25
    });
    this.curvedManager.applyCurvature(this.mediumBarrierMat);

    this.pillarMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getPillarTexture(),
      roughness: 0.65,
      metalness: 0.25
    });
    this.curvedManager.applyCurvature(this.pillarMat);

    this.highBarrierMats = [0, 1, 2].map(v => {
      const mat = new THREE.MeshStandardMaterial({
        map: TextureGenerator.getHighBarrierTexture(v),
        roughness: 0.35,
        metalness: 0.35
      });
      this.curvedManager.applyCurvature(mat);
      return mat;
    });
    this.highBarrierGantryMat = this.highBarrierMats[0];

    this.gantryPedestalMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getGantryPedestalTexture(),
      roughness: 0.65,
      metalness: 0.25
    });
    this.curvedManager.applyCurvature(this.gantryPedestalMat);

    this.barrierCastIronMat = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.72,
      metalness: 0.45
    });
    this.curvedManager.applyCurvature(this.barrierCastIronMat);

    this.gantryDarkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x181e29,
      roughness: 0.55,
      metalness: 0.70
    });
    this.curvedManager.applyCurvature(this.gantryDarkSteelMat);

    this.gantryTrussSteelMat = new THREE.MeshStandardMaterial({
      color: 0x242d3d,
      roughness: 0.50,
      metalness: 0.65
    });
    this.curvedManager.applyCurvature(this.gantryTrussSteelMat);

    this.beaconAmberMat = new THREE.MeshBasicMaterial({ color: 0xffab00 });
    this.beaconRedMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    this.beaconCyanMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    this.reflectiveTrimMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    this.hazardYellowMat = new THREE.MeshBasicMaterial({ color: 0xffd600 });

    this.trainRoofMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.48,
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
      color: 0x2d3748,
      roughness: 0.35,
      metalness: 0.55
    });
    this.curvedManager.applyCurvature(this.trainWindowFrameMat);

    this.trainChassisMat = new THREE.MeshStandardMaterial({
      color: 0x2e3846,
      roughness: 0.58,
      metalness: 0.60
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
   * Create High-Detail Low Barrier (Jump Hurdle)
   * Height: ~1.18m (Target 1.10m plank, with beacon caps at 1.18m).
   * Requires jump over or lane change. Cannot slide under (solid to ground).
   * 3 Distinct Visual Variants:
   * 0 = Standard Striped Rail Hurdle (A-frame legs with cast iron shoes, dual hazard rails, amber beacons)
   * 1 = Heavy Track Maintenance Gate (Box tubular uprights, counterweight footings, lower anti-crawl skirt)
   * 2 = Buffer Stop Style Barrier (Cross-braced X trestle legs, timber/steel buffer beam, dual lantern lamps)
   */
  public createLowBarrier(variant?: number): THREE.Group {
    const v = variant !== undefined ? Math.abs(variant) % 3 : (this.lowBarrierVariantCounter++) % 3;
    const group = new THREE.Group();
    group.userData = { type: 'LOW_BARRIER', variant: v };
    const laneW = CONSTANTS.LANE_WIDTH * 0.88; // ~3.16m
    const barrierMat = this.lowBarrierMats[v];

    if (v === 0) {
      // Variant 0: Standard Striped Rail Hurdle (A-frame legs, dual rails, amber beacons)
      // Vertical height increased by ~35% (1.39m -> 1.88m) for enhanced camera recognition
      const STRIPED_BARRIER_HEIGHT_SCALE = 1.35;

      // 1. Primary cross plank (Yellow/Black chevrons, extended proportionally upward)
      const barH = 0.52 * STRIPED_BARRIER_HEIGHT_SCALE; // 0.70m
      const barY = 0.52 + barH * 0.5; // 0.87m (ground clearance preserved, bottom remains at 0.52m)
      const barGeo = new THREE.BoxGeometry(laneW, barH, 0.20);
      const bar = new THREE.Mesh(barGeo, barrierMat);
      bar.position.set(0, barY, 0);
      bar.castShadow = true;
      group.add(bar);

      // Top & Bottom high-visibility reflective trims
      const topTrim = new THREE.Mesh(new THREE.BoxGeometry(laneW, 0.04, 0.22), this.reflectiveTrimMat);
      topTrim.position.set(0, barY + barH * 0.5 - 0.02, 0);
      group.add(topTrim);

      const btmTrim = new THREE.Mesh(new THREE.BoxGeometry(laneW, 0.04, 0.22), this.reflectiveTrimMat);
      btmTrim.position.set(0, barY - barH * 0.5 + 0.02, 0);
      group.add(btmTrim);

      // 2. Lower solid steel ground rail (solid to ground, prevents slide under)
      const lowerBar = new THREE.Mesh(new THREE.BoxGeometry(laneW * 0.94, 0.24, 0.16), this.barrierCastIronMat);
      lowerBar.position.set(0, 0.20, 0);
      lowerBar.castShadow = true;
      group.add(lowerBar);

      // 3. Heavy-duty cast-iron A-Frame support legs (extended proportionally upward to 1.62m)
      const legHeight = 1.20 * STRIPED_BARRIER_HEIGHT_SCALE; // 1.62m
      const legGeo = new THREE.BoxGeometry(0.12, legHeight, 0.12);
      const footGeo = new THREE.BoxGeometry(0.24, 0.06, 0.72);
      const legCenterY = 0.60 * STRIPED_BARRIER_HEIGHT_SCALE; // 0.81m

      [-laneW * 0.45, laneW * 0.45].forEach((xPos) => {
        // Slanted A-frame legs
        const legFront = new THREE.Mesh(legGeo, this.barrierCastIronMat);
        legFront.rotation.z = xPos < 0 ? 0.05 : -0.05;
        legFront.rotation.x = 0.18;
        legFront.position.set(xPos, legCenterY, 0);
        legFront.castShadow = true;
        group.add(legFront);

        const legRear = new THREE.Mesh(legGeo, this.barrierCastIronMat);
        legRear.rotation.z = xPos < 0 ? 0.05 : -0.05;
        legRear.rotation.x = -0.18;
        legRear.position.set(xPos, legCenterY, 0);
        legRear.castShadow = true;
        group.add(legRear);

        // Cast iron ground foot
        const foot = new THREE.Mesh(footGeo, this.barrierCastIronMat);
        foot.position.set(xPos, 0.03, 0);
        foot.castShadow = true;
        group.add(foot);

        // Side clamp bracket with hex bolts
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.26), this.barrierCastIronMat);
        bracket.position.set(xPos, barY, 0);
        group.add(bracket);

        // Top amber strobe caution beacon
        const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.06, 12), this.barrierCastIronMat);
        beaconBase.position.set(xPos, 1.27 * STRIPED_BARRIER_HEIGHT_SCALE, 0);
        group.add(beaconBase);

        const beaconLens = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), this.beaconAmberMat);
        beaconLens.position.set(xPos, 1.35 * STRIPED_BARRIER_HEIGHT_SCALE, 0);
        group.add(beaconLens);
      });

    } else if (v === 1) {
      // Variant 1: Heavy Track Maintenance Gate (Box uprights, orange/white chevrons, counterweight footings)
      const barH = 0.54;
      const barY = 0.80;
      const barGeo = new THREE.BoxGeometry(laneW, barH, 0.22);
      const bar = new THREE.Mesh(barGeo, barrierMat);
      bar.position.set(0, barY, 0);
      bar.castShadow = true;
      group.add(bar);

      // Dual horizontal reinforcement steel pipes
      const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, laneW * 0.98, 10);
      const pipeTop = new THREE.Mesh(pipeGeo, this.barrierCastIronMat);
      pipeTop.rotation.z = Math.PI / 2;
      pipeTop.position.set(0, barY + barH * 0.5 - 0.04, 0.12);
      group.add(pipeTop);

      const pipeBtm = new THREE.Mesh(pipeGeo, this.barrierCastIronMat);
      pipeBtm.rotation.z = Math.PI / 2;
      pipeBtm.position.set(0, barY - barH * 0.5 + 0.04, 0.12);
      group.add(pipeBtm);

      // Lower anti-crawl steel skirt plate (solid to ground)
      const skirtGeo = new THREE.BoxGeometry(laneW * 0.94, 0.26, 0.14);
      const skirt = new THREE.Mesh(skirtGeo, this.barrierCastIronMat);
      skirt.position.set(0, 0.20, 0);
      skirt.castShadow = true;
      group.add(skirt);

      // Heavy rectangular tubular steel upright posts
      const postGeo = new THREE.BoxGeometry(0.16, 1.27, 0.16);
      const weightBaseGeo = new THREE.BoxGeometry(0.32, 0.08, 0.70);

      [-laneW * 0.46, laneW * 0.46].forEach((xPos) => {
        const post = new THREE.Mesh(postGeo, this.barrierCastIronMat);
        post.position.set(xPos, 0.64, 0);
        post.castShadow = true;
        group.add(post);

        const weightBase = new THREE.Mesh(weightBaseGeo, this.barrierCastIronMat);
        weightBase.position.set(xPos, 0.04, 0);
        weightBase.castShadow = true;
        group.add(weightBase);

        // Flasher cap & amber lens
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 0.05, 12), this.barrierCastIronMat);
        cap.position.set(xPos, 1.29, 0);
        group.add(cap);

        const flasher = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.09, 12), this.beaconAmberMat);
        flasher.position.set(xPos, 1.35, 0);
        group.add(flasher);
      });

      // Central reflective warning plate
      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 0.25), this.hazardYellowMat);
      badge.position.set(0, barY, 0.01);
      group.add(badge);

    } else {
      // Variant 2: Buffer Stop Style Barrier (Cross-braced X trestle legs, red/white chevrons)
      const barH = 0.56;
      const barY = 0.77;
      const barGeo = new THREE.BoxGeometry(laneW, barH, 0.24);
      const bar = new THREE.Mesh(barGeo, barrierMat);
      bar.position.set(0, barY, 0);
      bar.castShadow = true;
      group.add(bar);

      // Lower timber/steel sleeper rail
      const sleeperRail = new THREE.Mesh(new THREE.BoxGeometry(laneW * 0.96, 0.24, 0.18), this.barrierCastIronMat);
      sleeperRail.position.set(0, 0.20, 0);
      sleeperRail.castShadow = true;
      group.add(sleeperRail);

      // X-Braced trestle side supports
      const strutGeo = new THREE.BoxGeometry(0.12, 1.25, 0.12);
      const trestleFootGeo = new THREE.BoxGeometry(0.28, 0.06, 0.76);

      [-laneW * 0.45, laneW * 0.45].forEach((xPos) => {
        const strut1 = new THREE.Mesh(strutGeo, this.barrierCastIronMat);
        strut1.rotation.x = 0.30;
        strut1.position.set(xPos, 0.59, 0);
        strut1.castShadow = true;
        group.add(strut1);

        const strut2 = new THREE.Mesh(strutGeo, this.barrierCastIronMat);
        strut2.rotation.x = -0.30;
        strut2.position.set(xPos, 0.59, 0);
        strut2.castShadow = true;
        group.add(strut2);

        const foot = new THREE.Mesh(trestleFootGeo, this.barrierCastIronMat);
        foot.position.set(xPos, 0.03, 0);
        foot.castShadow = true;
        group.add(foot);

        // Railway lantern lamp on top
        const lanternHousing = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.14), this.barrierCastIronMat);
        lanternHousing.position.set(xPos, 1.25, 0);
        group.add(lanternHousing);

        const lanternLens = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), this.beaconRedMat);
        lanternLens.position.set(xPos, 1.33, 0);
        group.add(lanternLens);
      });
    }

    return group;
  }

  /**
   * Create Medium Railway Barrier (Substantial Turnstile / Barrier Gate)
   * Height: 1.65m. Permits peak jumping or lane change. Cannot slide under.
   */
  public createMediumBarrier(): THREE.Group {
    const group = new THREE.Group();
    group.userData = { type: 'MEDIUM_BARRIER' };
    const laneW = CONSTANTS.LANE_WIDTH * 0.90;
    const h = CONSTANTS.MEDIUM_BARRIER_HEIGHT; // 1.65m

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.65 });
    this.curvedManager.applyCurvature(steelMat);

    // 1. Heavy tubular steel vertical posts on left & right
    const postGeo = new THREE.CylinderGeometry(0.12, 0.14, h, 12);
    const padGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.14, 12);

    [-laneW * 0.46, laneW * 0.46].forEach((xPos) => {
      const post = new THREE.Mesh(postGeo, steelMat);
      post.position.set(xPos, h * 0.5, 0);
      post.castShadow = true;
      group.add(post);

      const pad = new THREE.Mesh(padGeo, steelMat);
      pad.position.set(xPos, 0.07, 0);
      group.add(pad);

      // Blue / Amber LED strobe beacon on top of each post
      const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.08, 10), steelMat);
      beaconBase.position.set(xPos, h + 0.04, 0);
      group.add(beaconBase);

      const beaconLens = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0x00e5ff })
      );
      beaconLens.position.set(xPos, h + 0.12, 0);
      group.add(beaconLens);
    });

    // 2. Lower reinforced steel crossbeam
    const lowerBeam = new THREE.Mesh(new THREE.BoxGeometry(laneW, 0.20, 0.18), steelMat);
    lowerBeam.position.set(0, 0.70, 0);
    lowerBeam.castShadow = true;
    group.add(lowerBeam);

    // 3. Upper primary hazard crossbeam (Orange/White diagonal warning stripes)
    const upperBeamGeo = new THREE.BoxGeometry(laneW, 0.48, 0.22);
    const upperBeam = new THREE.Mesh(upperBeamGeo, this.mediumBarrierMat);
    upperBeam.position.set(0, h - 0.24, 0);
    upperBeam.castShadow = true;
    group.add(upperBeam);

    // 4. Vertical anti-crawl security rungs connecting the two beams
    const rungGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.70, 8);
    for (let i = -2; i <= 2; i++) {
      const rx = i * (laneW * 0.18);
      const rung = new THREE.Mesh(rungGeo, steelMat);
      rung.position.set(rx, 1.05, 0);
      rung.castShadow = true;
      group.add(rung);
    }

    // 5. Central reflective safety badge plate
    const badgeMat = new THREE.MeshBasicMaterial({ color: 0xff6d00 });
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.24, 0.26), badgeMat);
    badge.position.set(0, h - 0.24, 0.02);
    group.add(badge);

    return group;
  }

  /**
   * Create High Overhead Barrier (Requires Slide Under)
   * Height: ~4.05m (Substantial train-height presence, matching 4.2m train profile).
   * Ground clearance: EXACTLY 1.40m (CONSTANTS.HIGH_BARRIER_CLEARANCE).
   * Standing player (1.8m) or jumping player (apex 3.15m) collides with the solid overhead girder.
   * Sliding player (height 0.75m, center y = 0.45m, top y = 0.825m in test; ground y = 0.9m in game) slides cleanly underneath with ample clearance.
   * 3 Distinct Visual Variants:
   * 0 = Station Signal Gantry (Transit LED warning board, 3-aspect signal heads, twin aviation red strobes)
   * 1 = Heavy Industrial Truss Portal (Steel lattice truss, maintenance catwalk, work lamps, amber strobes)
   * 2 = Tunnel Clearance Beam (Tunnel gauge portal beam, hanging limit gauge bars, emergency beacons)
   */
  public createHighBarrier(variant?: number): THREE.Group {
    const v = variant !== undefined ? Math.abs(variant) % 3 : (this.highBarrierVariantCounter++) % 3;
    const group = new THREE.Group();
    group.userData = { type: 'HIGH_BARRIER', variant: v };
    const spanW = CONSTANTS.LANE_WIDTH * 0.96; // ~3.45m
    const clearance = CONSTANTS.HIGH_BARRIER_CLEARANCE; // 1.40m
    const gantryTotalH = CONSTANTS.HIGH_BARRIER_HEIGHT || 4.05; // Train-height presence
    const gantryMat = this.highBarrierMats[v];

    // 1. Heavy Vertical Pylons on Left and Right with Concrete Foundation Pedestals
    const colGeo = new THREE.BoxGeometry(0.24, gantryTotalH - 0.32, 0.28);
    const pedestalGeo = new THREE.BoxGeometry(0.48, 0.32, 0.65);

    [-spanW * 0.48, spanW * 0.48].forEach((xPos) => {
      // Concrete foundation base with hazard striping
      const pedestal = new THREE.Mesh(pedestalGeo, this.gantryPedestalMat);
      pedestal.position.set(xPos, 0.16, 0);
      pedestal.castShadow = true;
      group.add(pedestal);

      // Heavy structural vertical steel column
      const col = new THREE.Mesh(colGeo, this.gantryDarkSteelMat);
      col.position.set(xPos, 0.32 + (gantryTotalH - 0.32) * 0.5, 0);
      col.castShadow = true;
      group.add(col);

      // Diagonal gusset steel support bracket under girder
      const gusset = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.60, 0.10), this.gantryDarkSteelMat);
      gusset.rotation.z = xPos < 0 ? -Math.PI / 4 : Math.PI / 4;
      gusset.position.set(xPos < 0 ? xPos + 0.22 : xPos - 0.22, clearance + 0.28, 0);
      group.add(gusset);
    });

    // 2. Solid Primary Overhead Clearance Box Girder
    // Spans from clearance height (1.40m) up to 2.60m (height 1.20m, depth 0.42m)
    const girderH = 1.20;
    const girderGeo = new THREE.BoxGeometry(spanW, girderH, 0.42);
    const girder = new THREE.Mesh(girderGeo, gantryMat);
    girder.position.set(0, clearance + girderH * 0.5, 0);
    girder.castShadow = true;
    group.add(girder);

    // Heavy steel top & bottom flange beams on girder
    const flangeGeo = new THREE.BoxGeometry(spanW + 0.10, 0.08, 0.46);
    const btmFlange = new THREE.Mesh(flangeGeo, this.gantryDarkSteelMat);
    btmFlange.position.set(0, clearance + 0.04, 0);
    group.add(btmFlange);

    // High-contrast luminous warning edge lip along bottom flange
    const warningLipGeo = new THREE.BoxGeometry(spanW + 0.12, 0.03, 0.48);
    const warningLip = new THREE.Mesh(warningLipGeo, this.hazardYellowMat);
    warningLip.position.set(0, clearance + 0.015, 0);
    group.add(warningLip);

    const midFlange = new THREE.Mesh(flangeGeo, this.gantryDarkSteelMat);
    midFlange.position.set(0, clearance + girderH - 0.04, 0);
    group.add(midFlange);

    // 3. High-Contrast Hazard Clearance Warning Teeth / Chevron Indicators
    // Positioned along bottom lip terminating precisely at clearance Y = 1.40m
    // Visually reinforces "LOW CLEARANCE - DUCK / SLIDE" with sharp contrast
    const toothMat = this.hazardYellowMat;
    const toothGeo = new THREE.ConeGeometry(0.07, 0.12, 4);
    for (let t = -4; t <= 4; t++) {
      const tx = t * (spanW * 0.095);
      const tooth = new THREE.Mesh(toothGeo, toothMat);
      tooth.rotation.z = Math.PI; // Point down
      tooth.position.set(tx, clearance + 0.06, 0.22);
      group.add(tooth);
    }

    // 4. Overhead Superstructure & Variant-Specific Architectural Elements
    const trussH = gantryTotalH - (clearance + girderH); // 4.05 - 2.45 = 1.60m
    const trussY = (clearance + girderH) + trussH * 0.5;

    if (v === 0) {
      // Variant 0: Station Signal Gantry (Transit LED, Aspect Signal Heads, Aviation Strobes)
      // Upper structural box trussing
      const upperBox = new THREE.Mesh(new THREE.BoxGeometry(spanW, trussH * 0.65, 0.28), this.gantryTrussSteelMat);
      upperBox.position.set(0, trussY - 0.25, 0);
      upperBox.castShadow = true;
      group.add(upperBox);

      // Top crossbeam crown
      const topBeam = new THREE.Mesh(new THREE.BoxGeometry(spanW + 0.20, 0.16, 0.32), this.gantryDarkSteelMat);
      topBeam.position.set(0, gantryTotalH - 0.08, 0);
      group.add(topBeam);

      // Maintenance access ladder along left column
      for (let r = 0; r < 8; r++) {
        const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 6), this.gantryTrussSteelMat);
        rung.rotation.z = Math.PI / 2;
        rung.position.set(-spanW * 0.48, 1.4 + r * 0.32, 0.16);
        group.add(rung);
      }

      // Railway 3-aspect signal heads on left and right overhead
      [-spanW * 0.32, spanW * 0.32].forEach((sx) => {
        const signalHousing = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.52, 0.18), this.gantryDarkSteelMat);
        signalHousing.position.set(sx, clearance + girderH + 0.45, 0.22);
        group.add(signalHousing);

        // Aspect lenses: Red, Amber, Green
        const redAspect = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), this.beaconRedMat);
        redAspect.position.set(sx, clearance + girderH + 0.60, 0.31);
        group.add(redAspect);

        const ambAspect = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), this.beaconAmberMat);
        ambAspect.position.set(sx, clearance + girderH + 0.45, 0.31);
        group.add(ambAspect);

        const grnAspect = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00e676 }));
        grnAspect.position.set(sx, clearance + girderH + 0.30, 0.31);
        group.add(grnAspect);
      });

      // Twin red aviation warning strobes on top post crowns
      [-spanW * 0.48, spanW * 0.48].forEach((xPos) => {
        const beaconStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.10, 8), this.gantryDarkSteelMat);
        beaconStem.position.set(xPos, gantryTotalH + 0.05, 0);
        group.add(beaconStem);

        const beaconLens = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), this.beaconRedMat);
        beaconLens.position.set(xPos, gantryTotalH + 0.12, 0);
        group.add(beaconLens);
      });

    } else if (v === 1) {
      // Variant 1: Heavy Industrial Truss Portal (Lattice Catwalk, Handrails, Amber Strobes)
      // Open lattice frame
      const trussFrame = new THREE.Mesh(new THREE.BoxGeometry(spanW, trussH, 0.25), this.gantryTrussSteelMat);
      trussFrame.position.set(0, trussY, 0);
      trussFrame.castShadow = true;
      group.add(trussFrame);

      // Walkway diamond plate catwalk with handrail
      const catwalk = new THREE.Mesh(new THREE.BoxGeometry(spanW, 0.08, 0.55), this.gantryDarkSteelMat);
      catwalk.position.set(0, 3.45, 0.20);
      group.add(catwalk);

      const handrail = new THREE.Mesh(new THREE.BoxGeometry(spanW, 0.04, 0.04), this.gantryTrussSteelMat);
      handrail.position.set(0, 3.85, 0.45);
      group.add(handrail);

      // Underside work spotlight lamps pointing down at tracks (mounted above clearance line)
      [-spanW * 0.25, spanW * 0.25].forEach((lx) => {
        const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.16, 8), this.gantryDarkSteelMat);
        lamp.rotation.x = Math.PI / 4;
        lamp.position.set(lx, clearance + 0.18, 0.25);
        group.add(lamp);

        const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfffae6 }));
        lampBulb.position.set(lx, clearance + 0.12, 0.28);
        group.add(lampBulb);
      });

      // Twin amber strobe beacons on top
      [-spanW * 0.48, spanW * 0.48].forEach((xPos) => {
        const beaconLens = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), this.beaconAmberMat);
        beaconLens.position.set(xPos, gantryTotalH + 0.12, 0);
        group.add(beaconLens);
      });

    } else {
      // Variant 2: Tunnel Clearance Beam (Arched portal collar, hanging limit gauge bars, emergency strobes)
      // Upper arched/reinforced beam collar
      const collar = new THREE.Mesh(new THREE.BoxGeometry(spanW, trussH * 0.80, 0.32), this.gantryTrussSteelMat);
      collar.position.set(0, trussY - 0.15, 0);
      collar.castShadow = true;
      group.add(collar);

      // Top impact deflector shield
      const deflector = new THREE.Mesh(new THREE.BoxGeometry(spanW + 0.15, 0.18, 0.38), this.gantryDarkSteelMat);
      deflector.position.set(0, gantryTotalH - 0.09, 0);
      group.add(deflector);

      // Hanging flexible limit bars suspended on chains from underside of girder (terminating precisely at clearance)
      for (let c = -3; c <= 3; c++) {
        const cx = c * (spanW * 0.12);
        // Chain link rod
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 6), this.gantryDarkSteelMat);
        chain.position.set(cx, clearance + 0.08, 0.18);
        group.add(chain);

        // Hanging warning bob (terminates exactly at clearance)
        const bob = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), this.beaconAmberMat);
        bob.position.set(cx, clearance + 0.04, 0.18);
        group.add(bob);
      }

      // Twin blue/cyan emergency strobe beacons on top
      [-spanW * 0.48, spanW * 0.48].forEach((xPos) => {
        const beaconLens = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), this.beaconCyanMat);
        beaconLens.position.set(xPos, gantryTotalH + 0.12, 0);
        group.add(beaconLens);
      });
    }

    return group;
  }

  /**
   * Create Heavy Railway Structural Hazard Pillar (Solid Column)
   * Width: 0.9m, Height: 7.6m. Completely blocks lane.
   * Requires changing lane. Cannot be jumped over or slid under.
   */
  public createPillar(): THREE.Group {
    const group = new THREE.Group();
    group.userData = { type: 'PILLAR' };
    const w = CONSTANTS.PILLAR_WIDTH; // 0.9m
    const h = CONSTANTS.PILLAR_HEIGHT; // 7.6m

    // 1. Reinforced concrete base pedestal with hazard chevrons
    const baseW = w * 0.98;
    const baseH = 0.65;
    const baseGeo = new THREE.BoxGeometry(baseW, baseH, baseW);
    const base = new THREE.Mesh(baseGeo, this.pillarMat);
    base.position.set(0, baseH * 0.5, 0);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // 2. Main octagonal / cylindrical structural column rising to ceiling
    const colGeo = new THREE.CylinderGeometry(w * 0.44, w * 0.48, h - baseH, 12);
    const col = new THREE.Mesh(colGeo, this.pillarMat);
    col.position.set(0, baseH + (h - baseH) * 0.5, 0);
    col.castShadow = true;
    col.receiveShadow = true;
    group.add(col);

    // 3. Heavy riveted steel reinforcement collars at base and mid-height
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.8 });
    this.curvedManager.applyCurvature(steelMat);

    const collar1 = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.49, w * 0.49, 0.22, 12), steelMat);
    collar1.position.set(0, baseH + 0.15, 0);
    group.add(collar1);

    const collar2 = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.48, w * 0.48, 0.22, 12), steelMat);
    collar2.position.set(0, 3.2, 0);
    group.add(collar2);

    // 4. Eye-level high-visibility reflective caution bands with red warning reflectors
    const reflectorMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    const reflectorBandGeo = new THREE.CylinderGeometry(w * 0.47, w * 0.47, 0.28, 12);
    const reflectorBand = new THREE.Mesh(reflectorBandGeo, this.mediumBarrierMat);
    reflectorBand.position.set(0, 1.45, 0);
    group.add(reflectorBand);

    // Red reflector lenses on front and back
    [-0.42, 0.42].forEach((rz) => {
      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), reflectorMat);
      lens.position.set(0, 1.45, rz);
      group.add(lens);
    });

    // 5. Flashing red clearance beacon mounted on front face
    const beaconBox = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.28, 0.12), steelMat);
    beaconBox.position.set(0, 2.8, w * 0.44);
    group.add(beaconBox);

    const beaconLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), reflectorMat);
    beaconLight.position.set(0, 2.8, w * 0.44 + 0.08);
    group.add(beaconLight);

    // 6. Top capital beam interface supporting ceiling
    const capGeo = new THREE.BoxGeometry(w * 0.98, 0.35, w * 0.98);
    const cap = new THREE.Mesh(capGeo, steelMat);
    cap.position.set(0, h - 0.18, 0);
    cap.castShadow = true;
    group.add(cap);

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
    const noseLength = variant === 'STREAMLINED_EXPRESS' ? 1.85 : (variant === 'CLASSIC_TRANSIT' ? 1.15 : 1.45);
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
      const metroNoseLen = 1.45;
      const tipZ = frontZ + metroNoseLen;

      // 1. Sculpted Compound Aerodynamic Nose Hood & Rounded Apron (y: 0.55m to 1.95m)
      const hoodHeight = 1.42;
      const hoodCenterZ = frontZ + metroNoseLen * 0.48;

      // Main central nose body
      const hoodGeo = new THREE.BoxGeometry(w * 0.84, hoodHeight, metroNoseLen * 0.92);
      const hoodMesh = new THREE.Mesh(hoodGeo, bodyMat);
      hoodMesh.position.set(0, 0.55 + hoodHeight * 0.5, hoodCenterZ);
      hoodMesh.castShadow = true;
      group.add(hoodMesh);

      // Rounded front corner fillet columns providing smooth commuter curve
      const filletR = 0.22;
      const filletGeo = new THREE.CylinderGeometry(filletR, filletR, hoodHeight, 14);
      [-1, 1].forEach((side) => {
        const fillet = new THREE.Mesh(filletGeo, bodyMat);
        fillet.position.set(side * (halfW - filletR - 0.04), 0.55 + hoodHeight * 0.5, tipZ - filletR - 0.08);
        fillet.castShadow = true;
        group.add(fillet);
      });

      // Forward curved nose bow apron connecting the fillets
      const bowGeo = new THREE.CylinderGeometry(1.5, 1.5, hoodHeight * 0.92, 16, 1, false, -Math.PI * 0.20, Math.PI * 0.40);
      const bow = new THREE.Mesh(bowGeo, bodyMat);
      bow.position.set(0, 0.55 + hoodHeight * 0.5, tipZ - 1.45);
      bow.castShadow = true;
      group.add(bow);

      // Chamfered cab corner pillars angled forward and inward
      const pillarMat = this.trainWindowFrameMat;
      [-1, 1].forEach((side) => {
        const pillarGeo = new THREE.CylinderGeometry(0.09, 0.14, 1.42, 10);
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(side * halfW * 0.82, 2.62, frontZ + metroNoseLen * 0.44);
        group.add(pillar);
      });

      // 2. Shaded Driver Cab Interior (Console, Pilot Seat & Glowing Dials)
      const cabBackGeo = new THREE.BoxGeometry(w * 0.78, 1.35, 0.08);
      const cabBackMat = new THREE.MeshStandardMaterial({ color: 0x111620, roughness: 0.9 });
      this.curvedManager.applyCurvature(cabBackMat);
      const cabBack = new THREE.Mesh(cabBackGeo, cabBackMat);
      cabBack.position.set(0, 2.65, frontZ + 0.12);
      group.add(cabBack);

      const dashboardGeo = new THREE.BoxGeometry(w * 0.68, 0.32, 0.42);
      const dashboard = new THREE.Mesh(dashboardGeo, this.trainChassisMat);
      dashboard.position.set(0, 2.12, frontZ + 0.36);
      group.add(dashboard);

      // Twin driver illuminated HUD gauges
      [-0.24, 0.24].forEach((gx) => {
        const gaugeGeo = new THREE.CircleGeometry(0.045, 12);
        const gaugeMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
        const gauge = new THREE.Mesh(gaugeGeo, gaugeMat);
        gauge.position.set(gx, 2.30, frontZ + 0.58);
        gauge.rotation.x = -0.35;
        group.add(gauge);
      });

      // 3. Wrap-Around 3-Pane Panoramic Curved Windshield
      // Main Center Pane (slanted back 18 degrees)
      const centerGlassGeo = new THREE.BoxGeometry(w * 0.60, 1.32, 0.06);
      const centerGlass = new THREE.Mesh(centerGlassGeo, this.trainWindowMat);
      centerGlass.rotation.x = -0.31;
      centerGlass.position.set(0, 2.65, frontZ + metroNoseLen * 0.62);
      group.add(centerGlass);

      // Left & Right wrap-around corner glass panes (angled back and flared out)
      [-1, 1].forEach((side) => {
        const wingGlassGeo = new THREE.BoxGeometry(0.24, 1.28, 0.06);
        const wingGlass = new THREE.Mesh(wingGlassGeo, this.trainWindowMat);
        wingGlass.rotation.x = -0.31;
        wingGlass.rotation.y = side * 0.42;
        wingGlass.position.set(side * (w * 0.36), 2.65, frontZ + metroNoseLen * 0.54);
        group.add(wingGlass);
      });

      // Dual polished chrome windshield wipers
      [-0.18, 0.18].forEach((wx) => {
        const wiperGeo = new THREE.BoxGeometry(0.02, 0.52, 0.03);
        const wiper = new THREE.Mesh(wiperGeo, this.trainChromeMat);
        wiper.rotation.z = wx < 0 ? 0.32 : -0.25;
        wiper.rotation.x = -0.31;
        wiper.position.set(wx, 2.38, frontZ + metroNoseLen * 0.70);
        group.add(wiper);
      });

      // 4. Upper Cab Roof Cowl & Modern LED Destination Display
      const cowlGeo = new THREE.BoxGeometry(w * 0.88, 0.85, metroNoseLen * 0.75);
      const cowl = new THREE.Mesh(cowlGeo, bodyMat);
      cowl.position.set(0, 3.82, frontZ + metroNoseLen * 0.38);
      cowl.castShadow = true;
      group.add(cowl);

      // Protruding aerodynamic sun-visor brow
      const visorGeo = new THREE.BoxGeometry(w * 0.84, 0.12, 0.38);
      const visor = new THREE.Mesh(visorGeo, this.trainChassisMat);
      visor.position.set(0, 3.40, frontZ + metroNoseLen * 0.68);
      group.add(visor);

      // High-resolution LED Destination Matrix Display
      const destGeo = new THREE.BoxGeometry(w * 0.60, 0.34, 0.08);
      const destSign = new THREE.Mesh(destGeo, this.trainDestNeoMat);
      destSign.position.set(0, 3.75, frontZ + metroNoseLen * 0.76);
      group.add(destSign);

      // Roof corner amber clearance marker LEDs
      [-halfW * 0.78, halfW * 0.78].forEach((mx) => {
        const markerGeo = new THREE.SphereGeometry(0.045, 8, 8);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(mx, 4.15, frontZ + metroNoseLen * 0.55);
        group.add(marker);
      });

      // 5. Recessed Projector Headlight Pods with DRL Halo Rings
      [-halfW * 0.64, halfW * 0.64].forEach((hx) => {
        // Aerodynamic nacelle housing
        const podGeo = new THREE.BoxGeometry(0.52, 0.36, 0.26);
        const pod = new THREE.Mesh(podGeo, this.trainChassisMat);
        pod.position.set(hx, 1.35, tipZ - 0.08);
        group.add(pod);

        // Chrome bezel ring
        const bezelGeo = new THREE.TorusGeometry(0.18, 0.035, 10, 20);
        const bezel = new THREE.Mesh(bezelGeo, this.trainChromeMat);
        bezel.position.set(hx, 1.35, tipZ + 0.04);
        group.add(bezel);

        // High-intensity Xenon/LED projection lens
        const hlGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.10, 16);
        const hl = new THREE.Mesh(hlGeo, this.trainHeadlightMat);
        hl.rotation.x = Math.PI / 2;
        hl.position.set(hx, 1.35, tipZ + 0.06);
        group.add(hl);
      });

      // 6. Lower Aerodynamic Cowcatcher Apron & Solid Hazard Bumper
      const plowGeo = new THREE.BoxGeometry(w * 0.88, 0.42, 0.58);
      const plow = new THREE.Mesh(plowGeo, this.trainChassisMat);
      plow.position.set(0, 0.26, tipZ - 0.12);
      group.add(plow);

      // Heavy solid obstacle hazard bumper beam across front cab
      const bumperGeo = new THREE.BoxGeometry(w * 0.92, 0.24, 0.20);
      const bumper = new THREE.Mesh(bumperGeo, this.barrierMat);
      bumper.position.set(0, 0.88, tipZ - 0.02);
      bumper.castShadow = true;
      group.add(bumper);

      // Automatic tightlock transit coupler
      const couplerGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.44, 10);
      const coupler = new THREE.Mesh(couplerGeo, this.trainChromeMat);
      coupler.rotation.x = Math.PI / 2;
      coupler.position.set(0, 0.42, tipZ + 0.16);
      group.add(coupler);
    } else if (variant === 'CLASSIC_TRANSIT') {
      const classicNoseLen = 1.15;
      const tipZ = frontZ + classicNoseLen;

      // 1. Heavy Upright Urban Rail Bulkhead & Riveted Apron (y: 0.55m to 1.95m)
      const hoodHeight = 1.40;
      const hoodGeo = new THREE.BoxGeometry(w * 0.94, hoodHeight, classicNoseLen * 0.80);
      const hoodMesh = new THREE.Mesh(hoodGeo, bodyMat);
      hoodMesh.position.set(0, 0.55 + hoodHeight * 0.5, frontZ + classicNoseLen * 0.40);
      hoodMesh.castShadow = true;
      group.add(hoodMesh);

      // Shaded dark cab interior backplane
      const cabBackGeo = new THREE.BoxGeometry(w * 0.80, 1.35, 0.08);
      const cabBackMat = new THREE.MeshStandardMaterial({ color: 0x111620, roughness: 0.95 });
      this.curvedManager.applyCurvature(cabBackMat);
      const cabBack = new THREE.Mesh(cabBackGeo, cabBackMat);
      cabBack.position.set(0, 2.65, frontZ + 0.12);
      group.add(cabBack);

      // 2. Dual-Pane Split Windshield (Driver & Conductor individual panes)
      [-halfW * 0.42, halfW * 0.42].forEach((wx) => {
        const paneGeo = new THREE.BoxGeometry(w * 0.33, 1.25, 0.08);
        const pane = new THREE.Mesh(paneGeo, this.trainWindowMat);
        pane.position.set(wx, 2.65, frontZ + classicNoseLen * 0.72);
        group.add(pane);

        const frameGeo = new THREE.BoxGeometry(w * 0.37, 1.34, 0.06);
        const frame = new THREE.Mesh(frameGeo, this.trainChromeMat);
        frame.position.set(wx, 2.65, frontZ + classicNoseLen * 0.70);
        group.add(frame);

        // Individual vintage pantograph wiper arm
        const wiperGeo = new THREE.BoxGeometry(0.02, 0.48, 0.02);
        const wiper = new THREE.Mesh(wiperGeo, this.trainDarkRubberMat);
        wiper.position.set(wx, 2.45, frontZ + classicNoseLen * 0.76);
        wiper.rotation.z = wx < 0 ? 0.22 : -0.22;
        group.add(wiper);
      });

      // Heavy center structural divider mullion post
      const mullionGeo = new THREE.BoxGeometry(0.14, 1.35, 0.14);
      const mullion = new THREE.Mesh(mullionGeo, this.trainChassisMat);
      mullion.position.set(0, 2.65, frontZ + classicNoseLen * 0.75);
      group.add(mullion);

      // Outer cab heavy corner reinforcement posts
      [-halfW * 0.86, halfW * 0.86].forEach((cx) => {
        const postGeo = new THREE.BoxGeometry(0.14, 1.35, 0.14);
        const post = new THREE.Mesh(postGeo, this.trainChassisMat);
        post.position.set(cx, 2.65, frontZ + classicNoseLen * 0.75);
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
      // STREAMLINED_EXPRESS: Aerodynamic Bullet Nose & Raked Canopy (noseLength = 1.85m)
      const expressNoseLen = 1.85;
      const tipZ = frontZ + expressNoseLen;

      // 1. Aerodynamic Bullet Wedge Hood (y: 0.55m to 1.95m)
      const hoodHeight = 1.38;
      const hoodGeo = new THREE.BoxGeometry(w * 0.88, hoodHeight, expressNoseLen * 0.65);
      const hoodMesh = new THREE.Mesh(hoodGeo, bodyMat);
      hoodMesh.position.set(0, 0.55 + hoodHeight * 0.5, frontZ + expressNoseLen * 0.325);
      hoodMesh.castShadow = true;
      group.add(hoodMesh);

      // Tapered bullet nose cone front tip (Shinkansen / TGV styled rounded nose)
      const noseConeGeo = new THREE.CylinderGeometry(0.35, halfW * 0.85, expressNoseLen * 0.38, 16);
      const noseCone = new THREE.Mesh(noseConeGeo, bodyMat);
      noseCone.rotation.x = Math.PI / 2;
      noseCone.position.set(0, 0.55 + hoodHeight * 0.48, tipZ - expressNoseLen * 0.19);
      noseCone.castShadow = true;
      group.add(noseCone);

      // Swept aerodynamic cheek fairings
      [-1, 1].forEach((side) => {
        const cheekGeo = new THREE.BoxGeometry(0.14, hoodHeight * 0.9, expressNoseLen * 0.55);
        const cheek = new THREE.Mesh(cheekGeo, bodyMat);
        cheek.position.set(side * halfW * 0.84, 0.55 + hoodHeight * 0.5, frontZ + expressNoseLen * 0.38);
        cheek.rotation.y = side * 0.08;
        cheek.castShadow = true;
        group.add(cheek);
      });

      // 2. Shaded Pilot Cockpit Interior (Aeronautic Console & Glowing Avionics)
      const cockpitBackGeo = new THREE.BoxGeometry(w * 0.76, 1.35, 0.08);
      const cockpitBackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 });
      this.curvedManager.applyCurvature(cockpitBackMat);
      const cockpitBack = new THREE.Mesh(cockpitBackGeo, cockpitBackMat);
      cockpitBack.position.set(0, 2.65, frontZ + 0.14);
      group.add(cockpitBack);

      const pilotConsoleGeo = new THREE.BoxGeometry(w * 0.65, 0.28, 0.45);
      const pilotConsole = new THREE.Mesh(pilotConsoleGeo, this.trainChassisMat);
      pilotConsole.position.set(0, 2.12, frontZ + 0.42);
      group.add(pilotConsole);

      // Dual flight-style illuminated avionics navigation displays
      [-0.26, 0.26].forEach((cx, idx) => {
        const screenGeo = new THREE.PlaneGeometry(0.18, 0.11);
        const screenMat = new THREE.MeshBasicMaterial({ color: idx === 0 ? 0x00e5ff : 0x76ff03 });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(cx, 2.32, frontZ + 0.62);
        screen.rotation.x = -0.42;
        group.add(screen);
      });

      // 3. Swept Panoramic Cockpit Canopy Windshield (Raked 28 degrees back)
      const canopyGeo = new THREE.BoxGeometry(w * 0.74, 1.48, 0.08);
      const canopy = new THREE.Mesh(canopyGeo, this.trainWindowMat);
      canopy.rotation.x = -0.48; // Aggressive aerodynamic rake
      canopy.position.set(0, 2.72, frontZ + expressNoseLen * 0.56);
      group.add(canopy);

      // Left & Right sleek raked A-pillars matching windshield rake
      [-1, 1].forEach((side) => {
        const pillarGeo = new THREE.BoxGeometry(0.10, 1.48, 0.12);
        const pillar = new THREE.Mesh(pillarGeo, this.trainChassisMat);
        pillar.rotation.x = -0.48;
        pillar.position.set(side * halfW * 0.78, 2.72, frontZ + expressNoseLen * 0.56);
        group.add(pillar);
      });

      // 4. Upper Aerodynamic Roof Cowl Fairing
      const upperCowlGeo = new THREE.BoxGeometry(w * 0.84, 0.76, expressNoseLen * 0.68);
      const upperCowl = new THREE.Mesh(upperCowlGeo, bodyMat);
      upperCowl.position.set(0, 3.82, frontZ + expressNoseLen * 0.34);
      upperCowl.castShadow = true;
      group.add(upperCowl);

      // Flush-mounted high-res LED destination display
      const destGeo = new THREE.BoxGeometry(w * 0.60, 0.26, 0.08);
      const destSign = new THREE.Mesh(destGeo, this.trainDestExpressMat);
      destSign.position.set(0, 3.68, frontZ + expressNoseLen * 0.68);
      group.add(destSign);

      // Aerodynamic visor brow above destination sign
      const visorGeo = new THREE.BoxGeometry(w * 0.80, 0.08, 0.28);
      const visor = new THREE.Mesh(visorGeo, this.trainChassisMat);
      visor.position.set(0, 3.84, frontZ + expressNoseLen * 0.70);
      group.add(visor);

      // 5. Dual Horizontal Slit LED Headlight Arrays
      [-halfW * 0.60, halfW * 0.60].forEach((hx) => {
        const slitHousingGeo = new THREE.BoxGeometry(0.54, 0.16, 0.14);
        const slitHousing = new THREE.Mesh(slitHousingGeo, this.trainChassisMat);
        slitHousing.position.set(hx, 1.15, tipZ - 0.04);
        group.add(slitHousing);

        // High-beam horizontal projector slit
        const slitLampGeo = new THREE.BoxGeometry(0.46, 0.10, 0.08);
        const slitLamp = new THREE.Mesh(slitLampGeo, this.trainHeadlightMat);
        slitLamp.position.set(hx, 1.15, tipZ);
        group.add(slitLamp);

        // Cyan DRL accent brow strip
        const drlGeo = new THREE.BoxGeometry(0.48, 0.03, 0.06);
        const drlMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
        const drl = new THREE.Mesh(drlGeo, drlMat);
        drl.position.set(hx, 1.25, tipZ + 0.01);
        group.add(drl);
      });

      // 6. Aerodynamic Track-Sweeper Spoiler
      const spoilerGeo = new THREE.BoxGeometry(w * 0.92, 0.28, 0.65);
      const spoiler = new THREE.Mesh(spoilerGeo, this.trainChassisMat);
      spoiler.position.set(0, 0.18, tipZ - 0.08);
      group.add(spoiler);

      // Solid Hazard Anti-Climb Bumper Band (marks lethal front hull boundary)
      const hazardBumperGeo = new THREE.BoxGeometry(w * 0.88, 0.20, 0.18);
      const hazardBumper = new THREE.Mesh(hazardBumperGeo, this.barrierMat);
      hazardBumper.position.set(0, 0.44, tipZ - 0.04);
      group.add(hazardBumper);

      // Concealed Coupler Aerodynamic Nose Cone Hatch
      const hatchGeo = new THREE.BoxGeometry(0.60, 0.32, 0.06);
      const hatch = new THREE.Mesh(hatchGeo, bodyMat);
      hatch.position.set(0, 0.42, tipZ + 0.02);
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
      const edgeGeo = new THREE.BoxGeometry(0.06, 0.14, bodyLength * 0.98);
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
  /** Solid mesh boxes in the root's local coordinates, for generation-time clearance checks. */
  public static getSolidGeometryBounds(root: THREE.Object3D, excluded?: THREE.Object3D): THREE.Box3[] {
    root.updateWorldMatrix(true, true);
    const inverse = root.matrixWorld.clone().invert();
    const boxes: THREE.Box3[] = [];
    root.traverse((node) => {
      if (!(node instanceof THREE.Mesh) || node === excluded) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      // Light beams, glow decals and flat decorative planes do not occupy solid space.
      if (materials.every((material) => !material.depthWrite) || node.geometry.type === 'PlaneGeometry') return;
      if (!node.geometry.boundingBox) node.geometry.computeBoundingBox();
      const geometryBox = node.geometry.boundingBox;
      if (!geometryBox) return;
      const local = new THREE.Matrix4().multiplyMatrices(inverse, node.matrixWorld);
      if (node instanceof THREE.InstancedMesh) {
        const instance = new THREE.Matrix4();
        for (let i = 0; i < node.count; i++) {
          node.getMatrixAt(i, instance);
          boxes.push(geometryBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(local, instance)));
        }
      } else {
        boxes.push(geometryBox.clone().applyMatrix4(local));
      }
    });
    return boxes;
  }

  public createMovingTrain(
    length: number = CONSTANTS.TRAIN_LENGTH_SHORT,
    colorHex: number = CONSTANTS.COLORS.TRAIN_BODY_2
  ): { group: THREE.Group; headlights: THREE.Mesh[]; wheelMeshes: THREE.Mesh[]; headlightBeam?: THREE.Mesh } {
    // Start with base train structure
    const group = this.createTrain(length, false, colorHex);
    group.userData = { isTrain: true, isMoving: true, type: 'MOVING_TRAIN' };

    // Find and reference the twin headlights for flashing telegraph & bogie wheel meshes
    const headlights: THREE.Mesh[] = [];
    const wheelMeshes: THREE.Mesh[] = [];
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material === this.trainHeadlightMat) {
          headlights.push(child);
        } else if (child.material === this.trainWheelMat) {
          wheelMeshes.push(child);
        }
      }
    });

    const halfD = length * 0.5;

    // Add distinctive front cab warning chevron and express beacon marker
    const tipZ = halfD + 1.25;
    const chevronGeo = new THREE.BoxGeometry(CONSTANTS.TRAIN_WIDTH * 0.72, 0.22, 0.16);
    const chevronMesh = new THREE.Mesh(chevronGeo, this.hazardYellowMat);
    chevronMesh.position.set(0, 1.85, tipZ - 0.05);
    group.add(chevronMesh);

    const markerGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
    const markerMesh = new THREE.Mesh(markerGeo, this.beaconAmberMat);
    markerMesh.rotation.x = Math.PI / 2;
    markerMesh.position.set(0, 2.35, tipZ - 0.02);
    group.add(markerMesh);

    // Forward headlight track illumination beam (cast onto rails ahead in +Z to telegraph lane occupancy)
    const beamLength = 36.0;
    const beamGeo = new THREE.PlaneGeometry(CONSTANTS.TRAIN_WIDTH * 0.98, beamLength);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfffae6,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.curvedManager.applyCurvature(beamMat);
    const headlightBeam = new THREE.Mesh(beamGeo, beamMat);
    headlightBeam.rotation.x = -Math.PI / 2; // Flat just above ballast surface
    headlightBeam.position.set(0, 0.08, halfD + beamLength * 0.5);
    group.add(headlightBeam);

    return { group, headlights, wheelMeshes, headlightBeam };
  }

  /**
   * Builds an arcade-quality low-profile rooftop AC hurdle with diamond-plate housing,
   * high-visibility diagonal hazard stripes, twin circular fan grilles, and mounting feet
   */
  public createRooftopACHurdle(
    width: number = 1.6,
    length: number = 1.8,
    height: number = 0.65
  ): THREE.Group {
    const group = new THREE.Group();
    group.userData = { isRooftopObstacle: true, type: 'ROOFTOP_AC_HURDLE' };

    // 1. Heavy industrial housing unit (Y sits right on catwalk top: 4.35m)
    const baseGeo = new THREE.BoxGeometry(width, height - 0.08, length);
    const baseMesh = new THREE.Mesh(baseGeo, this.trainChassisMat);
    baseMesh.position.set(0, 4.35 + (height - 0.08) * 0.5, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // 2. High-visibility diagonal hazard skirt along perimeter base
    const skirtGeo = new THREE.BoxGeometry(width + 0.06, 0.18, length + 0.06);
    const skirtMesh = new THREE.Mesh(skirtGeo, this.barrierMat);
    skirtMesh.position.set(0, 4.35 + 0.09, 0);
    skirtMesh.castShadow = true;
    group.add(skirtMesh);

    // 3. Twin top circular ventilation fan grilles
    [-length * 0.25, length * 0.25].forEach((fz) => {
      const fanGeo = new THREE.CylinderGeometry(width * 0.35, width * 0.35, 0.06, 14);
      const fanMesh = new THREE.Mesh(fanGeo, this.trainVentGrilleMat);
      fanMesh.position.set(0, 4.35 + height - 0.05, fz);
      fanMesh.castShadow = true;
      group.add(fanMesh);

      // Center spin hub
      const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.08, 10);
      const hubMesh = new THREE.Mesh(hubGeo, this.trainChromeMat);
      hubMesh.position.set(0, 4.35 + height - 0.03, fz);
      group.add(hubMesh);
    });

    // 4. Sturdy corner mounting brackets bolted into the catwalk
    [-width * 0.46, width * 0.46].forEach((bx) => {
      [-length * 0.44, length * 0.44].forEach((bz) => {
        const bracketGeo = new THREE.BoxGeometry(0.12, 0.08, 0.12);
        const bracket = new THREE.Mesh(bracketGeo, this.trainChromeMat);
        bracket.position.set(bx, 4.35 + 0.04, bz);
        group.add(bracket);
      });
    });

    return group;
  }

  /**
   * Builds an industrial rooftop ventilator exhaust cowl
   */
  public createRooftopVent(
    width: number = 1.4,
    length: number = 1.4,
    height: number = 0.50
  ): THREE.Group {
    const group = new THREE.Group();
    group.userData = { isRooftopObstacle: true, type: 'ROOFTOP_VENT' };

    // Square plenum base
    const baseGeo = new THREE.BoxGeometry(width, height * 0.6, length);
    const baseMesh = new THREE.Mesh(baseGeo, this.trainChassisMat);
    baseMesh.position.set(0, 4.35 + (height * 0.6) * 0.5, 0);
    baseMesh.castShadow = true;
    group.add(baseMesh);

    // Exhaust louver cowl
    const cowlGeo = new THREE.CylinderGeometry(width * 0.42, width * 0.48, height * 0.45, 12);
    const cowlMesh = new THREE.Mesh(cowlGeo, this.trainVentGrilleMat);
    cowlMesh.position.set(0, 4.35 + height * 0.75, 0);
    cowlMesh.castShadow = true;
    group.add(cowlMesh);

    // Amber perimeter clearance reflectors
    [-width * 0.48, width * 0.48].forEach((rx) => {
      const refGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const refMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
      const ref = new THREE.Mesh(refGeo, refMat);
      ref.position.set(rx, 4.35 + height * 0.4, 0);
      group.add(ref);
    });

    return group;
  }

  /**
   * Builds a safe descent exit ramp at the rear of a train carriage,
   * connecting the 4.35m roof catwalk down to ground track level
   */
  private buildExitRamp(
    group: THREE.Group,
    w: number,
    h: number,
    bodyLength: number
  ): void {
    const rampLength = CONSTANTS.TRAIN_RAMP_LENGTH; // 8.0m
    const rampWidth = w * 0.86;
    const rampHeight = 4.35;

    const halfD = bodyLength * 0.5;
    const rampZCenter = -halfD - rampLength * 0.5;
    const slantLength = Math.sqrt(rampLength * rampLength + rampHeight * rampHeight);
    const rampAngle = Math.atan2(rampHeight, rampLength);

    // 1. Walkway Deck sloping down towards -Z
    const rampGeo = new THREE.BoxGeometry(rampWidth, 0.22, slantLength);
    const rampMesh = new THREE.Mesh(rampGeo, this.trainWalkwayMat);
    rampMesh.rotation.x = -rampAngle;
    rampMesh.position.set(0, rampHeight * 0.5, rampZCenter);
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    group.add(rampMesh);

    // 2. Hazard Skirts and Guide Rails
    const skirtGeo = new THREE.BoxGeometry(0.14, 0.45, slantLength);
    [-rampWidth * 0.51, rampWidth * 0.51].forEach((sx) => {
      const skirt = new THREE.Mesh(skirtGeo, this.barrierMat);
      skirt.rotation.x = -rampAngle;
      skirt.position.set(sx, rampHeight * 0.5 + 0.15, rampZCenter);
      skirt.castShadow = true;
      group.add(skirt);

      const railGeo = new THREE.CylinderGeometry(0.04, 0.04, slantLength * 0.98, 8);
      const rail = new THREE.Mesh(railGeo, this.trainChromeMat);
      rail.rotation.x = -rampAngle + Math.PI / 2;
      rail.position.set(sx, rampHeight * 0.5 + 0.42, rampZCenter);
      group.add(rail);
    });

    // 3. Longitudinal I-Beams
    [-rampWidth * 0.42, rampWidth * 0.42].forEach((bx) => {
      const stringerGeo = new THREE.BoxGeometry(0.12, 0.24, slantLength);
      const stringer = new THREE.Mesh(stringerGeo, this.rampTrussMat);
      stringer.rotation.x = -rampAngle;
      stringer.position.set(bx, rampHeight * 0.5 - 0.14, rampZCenter);
      stringer.castShadow = true;
      group.add(stringer);
    });

    // 4. Ground Toe Plate (at Z = -halfD - rampLength)
    const toeGeo = new THREE.BoxGeometry(rampWidth * 1.02, 0.12, 0.6);
    const toeMesh = new THREE.Mesh(toeGeo, this.barrierMat);
    toeMesh.position.set(0, 0.06, -halfD - rampLength + 0.3);
    group.add(toeMesh);
  }

  /**
   * Create Full Modular Multi-Carriage Train Composition
   * Composes authentic individual carriages with inter-carriage accordion gangways,
   * tightlock couplers, uninterrupted 4.35m catwalk plates, and optional rooftop obstacles
   */
  public createTrainComposition(
    composition: TrainCompositionDef,
    colorHex: number = CONSTANTS.COLORS.TRAIN_BODY_1
  ): THREE.Group {
    const masterGroup = new THREE.Group();
    masterGroup.userData = {
      isTrain: true,
      isComposition: true,
      type: 'TRAIN_COMPOSITION',
      composition
    };

    const w = CONSTANTS.TRAIN_WIDTH;
    const h = CONSTANTS.TRAIN_HEIGHT;
    const variants: TrainVariant[] = ['MODERN_METRO', 'CLASSIC_TRANSIT', 'STREAMLINED_EXPRESS'];

    // 1. Build and position each distinct carriage component
    for (let i = 0; i < composition.carriages.length; i++) {
      const comp = composition.carriages[i];
      const carriageGroup = new THREE.Group();
      carriageGroup.name = comp.id;
      carriageGroup.position.z = comp.localOffsetZ;

      const variant = comp.variant || variants[(this.trainSpawnCounter++) % variants.length];
      const carColor = comp.colorHex || colorHex;

      let accentColor = 0xffd600;
      if (carColor === CONSTANTS.COLORS.TRAIN_BODY_2) accentColor = 0x00e676;
      if (carColor === CONSTANTS.COLORS.TRAIN_BODY_3) accentColor = 0xffffff;

      const bodyMat = new THREE.MeshStandardMaterial({
        color: variant === 'CLASSIC_TRANSIT' ? 0xd0d5dd : carColor,
        roughness: variant === 'CLASSIC_TRANSIT' ? 0.28 : 0.32,
        metalness: variant === 'CLASSIC_TRANSIT' ? 0.85 : 0.35
      });
      this.curvedManager.applyCurvature(bodyMat);

      // Carriage Hull
      const hullMesh = this.buildCarriageHull(w, h, comp.length, bodyMat);
      carriageGroup.add(hullMesh);

      // 3D Side Geometry
      this.buildSideGeometry(carriageGroup, w, h, comp.length, variant, bodyMat, accentColor);

      // Front / Rear end treatment
      const noseLength = variant === 'STREAMLINED_EXPRESS' ? 1.85 : (variant === 'CLASSIC_TRANSIT' ? 1.15 : 1.45);
      if (comp.hasRamp) {
        this.buildRampBulkhead(carriageGroup, w, h, comp.length, bodyMat, accentColor);
        this.buildRamp(carriageGroup, w, h, comp.length, noseLength);
      } else if (comp.type === 'LOCOMOTIVE_CAB') {
        this.buildFrontCab(carriageGroup, w, h, comp.length, noseLength, variant, bodyMat, carColor, accentColor);
      } else {
        // Intermediate front bulkhead connection
        const bellowGeo = new THREE.BoxGeometry(w * 0.52, 2.35, 0.35);
        const bellow = new THREE.Mesh(bellowGeo, this.trainDarkRubberMat);
        bellow.position.set(0, 1.8, comp.length * 0.5 + 0.15);
        carriageGroup.add(bellow);
      }

      if (comp.hasExitRamp) {
        this.buildExitRamp(carriageGroup, w, h, comp.length);
      } else if (comp.type === 'CABOOSE_END' || i === composition.carriages.length - 1) {
        this.buildRearJunction(carriageGroup, w, h, comp.length);
      } else {
        // Intermediate rear bulkhead connection
        const bellowGeo = new THREE.BoxGeometry(w * 0.52, 2.35, 0.35);
        const bellow = new THREE.Mesh(bellowGeo, this.trainDarkRubberMat);
        bellow.position.set(0, 1.8, -comp.length * 0.5 - 0.15);
        carriageGroup.add(bellow);
      }

      // Roof Architecture & Walkable Catwalk Platform (strictly Y = 4.35m)
      this.buildRoofArchitecture(carriageGroup, w, h, comp.length, variant);

      // Wheel Bogies & Underbody
      this.buildBogiesAndUnderbody(carriageGroup, w, h, comp.length, variant);

      masterGroup.add(carriageGroup);
    }

    // 2. Build inter-carriage gangway couplers & continuous roof walkplates
    for (let i = 0; i < composition.carriages.length - 1; i++) {
      const c1 = composition.carriages[i];
      const c2 = composition.carriages[i + 1];
      const junctionZ = (c1.localOffsetZ - c1.length * 0.5 + c2.localOffsetZ + c2.length * 0.5) * 0.5;
      const gap = Math.abs((c1.localOffsetZ - c1.length * 0.5) - (c2.localOffsetZ + c2.length * 0.5));

      // Gangway accordion connection (for standard coupled carriages with gap <= 2.0m)
      if (gap <= 2.0) {
        // Accordion rubber bellow sleeve
        const bellowGeo = new THREE.BoxGeometry(w * 0.54, 2.4, gap + 0.1);
        const bellow = new THREE.Mesh(bellowGeo, this.trainDarkRubberMat);
        bellow.position.set(0, 1.8, junctionZ);
        masterGroup.add(bellow);

        // Transit coupler knuckle
        const couplerGeo = new THREE.CylinderGeometry(0.14, 0.14, gap + 0.3, 10);
        const coupler = new THREE.Mesh(couplerGeo, this.trainChromeMat);
        coupler.rotation.x = Math.PI / 2;
        coupler.position.set(0, 0.42, junctionZ);
        masterGroup.add(coupler);

        // Continuous diamond-plate steel gangway catwalk bridge (top face Y = 4.35m)
        const bridgeGeo = new THREE.BoxGeometry(1.7, 0.14, gap + 0.2);
        const bridge = new THREE.Mesh(bridgeGeo, this.trainWalkwayMat);
        bridge.position.set(0, 4.28, junctionZ);
        bridge.receiveShadow = true;
        masterGroup.add(bridge);

        // Yellow safety edge plates along bridge
        [-1.7 * 0.5, 1.7 * 0.5].forEach((cx) => {
          const edgeGeo = new THREE.BoxGeometry(0.06, 0.14, gap + 0.2);
          const edge = new THREE.Mesh(edgeGeo, this.barrierMat);
          edge.position.set(cx, 4.28, junctionZ);
          masterGroup.add(edge);
        });
      }
    }

    // 3. Build rooftop obstacles (AC units, vents)
    if (composition.rooftopObstacles && composition.rooftopObstacles.length > 0) {
      for (const obs of composition.rooftopObstacles) {
        const obsMesh = obs.type === 'ROOFTOP_AC_HURDLE'
          ? this.createRooftopACHurdle(obs.width || 1.6, obs.length || 1.8, obs.height || 0.65)
          : this.createRooftopVent(obs.width || 1.4, obs.length || 1.4, obs.height || 0.50);

        obsMesh.position.set(0, 0, obs.localOffsetZ);
        masterGroup.add(obsMesh);
      }
    }

    return masterGroup;
  }
}
