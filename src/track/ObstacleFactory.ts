import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { CurvedShaderManager } from '../scene/CurvedShader';

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

  // Shared Geometries & Materials for high-efficiency batching
  private lowBarrierGeo: THREE.BufferGeometry;
  private highBarrierLegGeo: THREE.BufferGeometry;
  private highBarrierTopGeo: THREE.BufferGeometry;
  private stripeTexture: THREE.CanvasTexture;

  private barrierMat: THREE.MeshStandardMaterial;
  private trainRoofMat: THREE.MeshStandardMaterial;
  private trainWindowMat: THREE.MeshStandardMaterial;
  private trainLightMat: THREE.MeshBasicMaterial;

  constructor() {
    this.stripeTexture = this.createStripeTexture();

    this.barrierMat = new THREE.MeshStandardMaterial({
      map: this.stripeTexture,
      roughness: 0.5,
      metalness: 0.2
    });
    this.curvedManager.applyCurvature(this.barrierMat);

    this.trainRoofMat = new THREE.MeshStandardMaterial({
      color: CONSTANTS.COLORS.TRAIN_ROOF,
      roughness: 0.6,
      metalness: 0.3
    });
    this.curvedManager.applyCurvature(this.trainRoofMat);

    this.trainWindowMat = new THREE.MeshStandardMaterial({
      color: 0x112233,
      roughness: 0.1,
      metalness: 0.8
    });
    this.curvedManager.applyCurvature(this.trainWindowMat);

    this.trainLightMat = new THREE.MeshBasicMaterial({
      color: 0xffffaa
    });

    this.lowBarrierGeo = new THREE.BoxGeometry(CONSTANTS.LANE_WIDTH * 0.85, CONSTANTS.LOW_BARRIER_HEIGHT, 0.4);
    this.highBarrierLegGeo = new THREE.BoxGeometry(0.2, CONSTANTS.HIGH_BARRIER_HEIGHT, 0.2);
    this.highBarrierTopGeo = new THREE.BoxGeometry(CONSTANTS.LANE_WIDTH * 0.9, 0.9, 0.4);
  }

  private createStripeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Yellow & black diagonal caution stripes
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = '#222222';
    ctx.beginPath();
    for (let i = -128; i < 256; i += 32) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 16, 0);
      ctx.lineTo(i - 16, 128);
      ctx.lineTo(i - 32, 128);
      ctx.closePath();
    }
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1);
    return tex;
  }

  /**
   * Create Low Barrier (Requires Jump)
   */
  public createLowBarrier(): THREE.Group {
    const group = new THREE.Group();

    // Crossbar
    const bar = new THREE.Mesh(this.lowBarrierGeo, this.barrierMat);
    bar.position.y = CONSTANTS.LOW_BARRIER_HEIGHT * 0.5;
    bar.castShadow = true;
    group.add(bar);

    // Two support feet
    const footGeo = new THREE.BoxGeometry(0.35, 0.15, 0.7);
    const footMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    this.curvedManager.applyCurvature(footMat);

    const leftFoot = new THREE.Mesh(footGeo, footMat);
    leftFoot.position.set(-CONSTANTS.LANE_WIDTH * 0.35, 0.08, 0);
    leftFoot.castShadow = true;
    group.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeo, footMat);
    rightFoot.position.set(CONSTANTS.LANE_WIDTH * 0.35, 0.08, 0);
    rightFoot.castShadow = true;
    group.add(rightFoot);

    return group;
  }

  /**
   * Create High Overhead Barrier (Requires Slide Under)
   */
  public createHighBarrier(): THREE.Group {
    const group = new THREE.Group();

    // Left leg
    const leftLeg = new THREE.Mesh(this.highBarrierLegGeo, this.barrierMat);
    leftLeg.position.set(-CONSTANTS.LANE_WIDTH * 0.42, CONSTANTS.HIGH_BARRIER_HEIGHT * 0.5, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    // Right leg
    const rightLeg = new THREE.Mesh(this.highBarrierLegGeo, this.barrierMat);
    rightLeg.position.set(CONSTANTS.LANE_WIDTH * 0.42, CONSTANTS.HIGH_BARRIER_HEIGHT * 0.5, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // Overhead bar starting at height clearance (1.25m to 2.15m)
    const topBar = new THREE.Mesh(this.highBarrierTopGeo, this.barrierMat);
    topBar.position.set(0, CONSTANTS.HIGH_BARRIER_CLEARANCE + 0.45, 0);
    topBar.castShadow = true;
    group.add(topBar);

    return group;
  }

  /**
   * Create Full Subway Train (Optionally with walkable roof & climbable front ramp)
   */
  public createTrain(length: number = CONSTANTS.TRAIN_LENGTH_SHORT, hasRamp: boolean = false, colorHex: number = CONSTANTS.COLORS.TRAIN_BODY_1): THREE.Group {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.4,
      metalness: 0.4
    });
    this.curvedManager.applyCurvature(bodyMat);

    // Main train carriage body
    const bodyGeo = new THREE.BoxGeometry(CONSTANTS.TRAIN_WIDTH, CONSTANTS.TRAIN_HEIGHT, length);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = CONSTANTS.TRAIN_HEIGHT * 0.5;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Roof panel (walkable top)
    const roofGeo = new THREE.BoxGeometry(CONSTANTS.TRAIN_WIDTH * 0.95, 0.25, length * 0.98);
    const roofMesh = new THREE.Mesh(roofGeo, this.trainRoofMat);
    roofMesh.position.y = CONSTANTS.TRAIN_HEIGHT + 0.12;
    roofMesh.receiveShadow = true;
    group.add(roofMesh);

    // Windows along both sides
    const windowCols = Math.floor(length / 2.8);
    for (let i = 0; i < windowCols; i++) {
      const zOffset = -length * 0.45 + i * 2.8;
      const winGeo = new THREE.BoxGeometry(0.08, 0.9, 1.4);

      const leftWin = new THREE.Mesh(winGeo, this.trainWindowMat);
      leftWin.position.set(-CONSTANTS.TRAIN_WIDTH * 0.51, CONSTANTS.TRAIN_HEIGHT * 0.65, zOffset);
      group.add(leftWin);

      const rightWin = new THREE.Mesh(winGeo, this.trainWindowMat);
      rightWin.position.set(CONSTANTS.TRAIN_WIDTH * 0.51, CONSTANTS.TRAIN_HEIGHT * 0.65, zOffset);
      group.add(rightWin);
    }

    // Front headlights (facing the player, towards positive Z in local space)
    const lightGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.1, 12);
    const leftLight = new THREE.Mesh(lightGeo, this.trainLightMat);
    leftLight.rotation.x = Math.PI / 2;
    leftLight.position.set(-CONSTANTS.TRAIN_WIDTH * 0.35, 1.2, length * 0.5 + 0.05);
    group.add(leftLight);

    const rightLight = new THREE.Mesh(lightGeo, this.trainLightMat);
    rightLight.rotation.x = Math.PI / 2;
    rightLight.position.set(CONSTANTS.TRAIN_WIDTH * 0.35, 1.2, length * 0.5 + 0.05);
    group.add(rightLight);

    // Optional Climbable Ramp at Front
    if (hasRamp) {
      const rampGeo = new THREE.BoxGeometry(CONSTANTS.TRAIN_WIDTH * 0.85, 0.4, CONSTANTS.TRAIN_RAMP_LENGTH);
      // Slope the ramp from ground up to train roof height
      const rampMesh = new THREE.Mesh(rampGeo, this.barrierMat);
      rampMesh.rotation.x = Math.atan2(CONSTANTS.TRAIN_HEIGHT, CONSTANTS.TRAIN_RAMP_LENGTH);
      rampMesh.position.set(0, CONSTANTS.TRAIN_HEIGHT * 0.5, length * 0.5 + CONSTANTS.TRAIN_RAMP_LENGTH * 0.45);
      rampMesh.castShadow = true;
      rampMesh.receiveShadow = true;
      group.add(rampMesh);
    }

    return group;
  }
}
