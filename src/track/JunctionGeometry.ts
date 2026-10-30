import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { CurvedShaderManager } from '../scene/CurvedShader';
import { RouteBranchId } from './JunctionTypes';

export class JunctionGeometry {
  private static instance: JunctionGeometry;
  private curvedManager = CurvedShaderManager.getInstance();

  // Cached materials
  private sharedMaterials: {
    gantrySteelMat: THREE.MeshStandardMaterial;
    gantryLatticeMat: THREE.MeshStandardMaterial;
    signBoardMatA: THREE.MeshBasicMaterial;
    signBoardMatB: THREE.MeshBasicMaterial;
    signalHousingMat: THREE.MeshStandardMaterial;
    greenSignalMat: THREE.MeshBasicMaterial;
    amberSignalMat: THREE.MeshBasicMaterial;
    redSignalMat: THREE.MeshBasicMaterial;
    railSteelMat: THREE.MeshStandardMaterial;
    switchBladeSteelMat: THREE.MeshStandardMaterial;
    switchMotorMat: THREE.MeshStandardMaterial;
    hazardStripeMat: THREE.MeshBasicMaterial;
    divergentBallastMat: THREE.MeshStandardMaterial;
  } | null = null;

  // Cached geometries
  private sharedGeometries: {
    columnGeo: THREE.BoxGeometry;
    beamGeo: THREE.BoxGeometry;
    signGeo: THREE.BoxGeometry;
    signalHousingGeo: THREE.BoxGeometry;
    lensGeo: THREE.CylinderGeometry;
    switchBoxGeo: THREE.BoxGeometry;
    divergentRailGeo: THREE.BufferGeometry;
  } | null = null;

  public static getInstance(): JunctionGeometry {
    if (!JunctionGeometry.instance) {
      JunctionGeometry.instance = new JunctionGeometry();
    }
    return JunctionGeometry.instance;
  }

  private initResources(): void {
    if (this.sharedMaterials && this.sharedGeometries) return;

    // 1. Textures & Materials
    const steelColor = 0x2b303a;
    const gantrySteelMat = new THREE.MeshStandardMaterial({
      color: steelColor,
      roughness: 0.45,
      metalness: 0.8
    });
    this.curvedManager.applyCurvature(gantrySteelMat);

    const gantryLatticeMat = new THREE.MeshStandardMaterial({
      color: 0x3d4454,
      roughness: 0.5,
      metalness: 0.7
    });
    this.curvedManager.applyCurvature(gantryLatticeMat);

    const signalHousingMat = new THREE.MeshStandardMaterial({
      color: 0x111318,
      roughness: 0.6,
      metalness: 0.6
    });
    this.curvedManager.applyCurvature(signalHousingMat);

    const greenSignalMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
    const amberSignalMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const redSignalMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });

    const railSteelMat = new THREE.MeshStandardMaterial({
      color: 0xe6ecf5,
      roughness: 0.18,
      metalness: 0.95
    });
    this.curvedManager.applyCurvature(railSteelMat);

    const switchBladeSteelMat = new THREE.MeshStandardMaterial({
      color: 0xffd54f, // High-visibility cadmium zinc switch blade tips
      roughness: 0.35,
      metalness: 0.85
    });
    this.curvedManager.applyCurvature(switchBladeSteelMat);

    const switchMotorMat = new THREE.MeshStandardMaterial({
      color: 0x2e3440,
      roughness: 0.7,
      metalness: 0.5
    });
    this.curvedManager.applyCurvature(switchMotorMat);

    const divergentBallastMat = new THREE.MeshStandardMaterial({
      color: 0x5a554c,
      roughness: 0.95,
      metalness: 0.05
    });
    this.curvedManager.applyCurvature(divergentBallastMat);

    // Dynamic Route Direction Canvas Signboards (with Node.js headless environment fallback)
    let signBoardMatA = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    let signBoardMatB = new THREE.MeshBasicMaterial({ color: 0x1e1005 });
    let hazardStripeMat = new THREE.MeshBasicMaterial({ color: 0xffd600 });

    if (typeof document !== 'undefined') {
      const signCanvasA = document.createElement('canvas');
      signCanvasA.width = 512;
      signCanvasA.height = 128;
      const ctxA = signCanvasA.getContext('2d')!;
      ctxA.fillStyle = '#0f172a';
      ctxA.fillRect(0, 0, 512, 128);
      ctxA.strokeStyle = '#00ff66';
      ctxA.lineWidth = 6;
      ctxA.strokeRect(4, 4, 504, 120);
      ctxA.fillStyle = '#00ff66';
      ctxA.font = 'bold 36px sans-serif';
      ctxA.textAlign = 'center';
      ctxA.fillText('◀ ROUTE A: MAIN METRO', 256, 52);
      ctxA.fillStyle = '#94a3b8';
      ctxA.font = '22px sans-serif';
      ctxA.fillText('SAFE • MODERATE REWARDS', 256, 92);
      const signTexA = new THREE.CanvasTexture(signCanvasA);
      signBoardMatA = new THREE.MeshBasicMaterial({ map: signTexA });

      const signCanvasB = document.createElement('canvas');
      signCanvasB.width = 512;
      signCanvasB.height = 128;
      const ctxB = signCanvasB.getContext('2d')!;
      ctxB.fillStyle = '#1e1005';
      ctxB.fillRect(0, 0, 512, 128);
      ctxB.strokeStyle = '#ff9900';
      ctxB.lineWidth = 6;
      ctxB.strokeRect(4, 4, 504, 120);
      ctxB.fillStyle = '#ffaa00';
      ctxB.font = 'bold 36px sans-serif';
      ctxB.textAlign = 'center';
      ctxB.fillText('ROUTE B: INDUSTRIAL ▶', 256, 52);
      ctxB.fillStyle = '#fdba74';
      ctxB.font = '22px sans-serif';
      ctxB.fillText('HIGH RISK • RICH REWARDS', 256, 92);
      const signTexB = new THREE.CanvasTexture(signCanvasB);
      signBoardMatB = new THREE.MeshBasicMaterial({ map: signTexB });

      const hazardCanvas = document.createElement('canvas');
      hazardCanvas.width = 128;
      hazardCanvas.height = 32;
      const hCtx = hazardCanvas.getContext('2d')!;
      hCtx.fillStyle = '#ffd600';
      hCtx.fillRect(0, 0, 128, 32);
      hCtx.fillStyle = '#212121';
      for (let i = -32; i < 160; i += 24) {
        hCtx.beginPath();
        hCtx.moveTo(i, 0);
        hCtx.lineTo(i + 14, 0);
        hCtx.lineTo(i - 4, 32);
        hCtx.lineTo(i - 18, 32);
        hCtx.closePath();
        hCtx.fill();
      }
      const hazardTex = new THREE.CanvasTexture(hazardCanvas);
      hazardTex.wrapS = THREE.RepeatWrapping;
      hazardTex.repeat.set(4, 1);
      hazardStripeMat = new THREE.MeshBasicMaterial({ map: hazardTex });
    }

    this.curvedManager.applyCurvature(signBoardMatA);
    this.curvedManager.applyCurvature(signBoardMatB);
    this.curvedManager.applyCurvature(hazardStripeMat);

    this.sharedMaterials = {
      gantrySteelMat,
      gantryLatticeMat,
      signBoardMatA,
      signBoardMatB,
      signalHousingMat,
      greenSignalMat,
      amberSignalMat,
      redSignalMat,
      railSteelMat,
      switchBladeSteelMat,
      switchMotorMat,
      hazardStripeMat,
      divergentBallastMat
    };

    // 2. Geometries
    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 3.8; // ~14.6m
    const columnGeo = new THREE.BoxGeometry(0.65, 7.5, 0.65);
    const beamGeo = new THREE.BoxGeometry(spanWidth, 0.95, 0.85);
    const signGeo = new THREE.BoxGeometry(4.8, 1.35, 0.15);
    const signalHousingGeo = new THREE.BoxGeometry(0.7, 1.8, 0.5);
    const lensGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.1, 16);
    lensGeo.rotateX(Math.PI / 2);
    const switchBoxGeo = new THREE.BoxGeometry(0.85, 0.65, 1.2);

    // Build curved divergent rail geometry using cubic curve
    const divergentCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(CONSTANTS.LANES[0], 0.12, 0),
      new THREE.Vector3(CONSTANTS.LANES[0], 0.12, -18),
      new THREE.Vector3(CONSTANTS.LANES[1] + 1.2, 0.12, -28),
      new THREE.Vector3(CONSTANTS.LANES[1] + 2.4, 0.12, -45)
    );
    const divergentRailGeo = new THREE.TubeGeometry(divergentCurve, 32, 0.08, 8, false);

    this.sharedGeometries = {
      columnGeo,
      beamGeo,
      signGeo,
      signalHousingGeo,
      lensGeo,
      switchBoxGeo,
      divergentRailGeo
    };
  }

  /**
   * Builds the complete 3D railway switch visuals on a given chunk.
   * Returns a THREE.Group to attach into chunk.decorativeGroup or chunk.group.
   */
  public buildJunctionScenery(chunkLength: number = 80.0): THREE.Group {
    this.initResources();
    const mats = this.sharedMaterials!;
    const geos = this.sharedGeometries!;

    const rootGroup = new THREE.Group();
    rootGroup.name = 'junction_switch_scenery';

    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 3.8;

    // =========================================================================
    // 1. OVERHEAD RAILWAY SIGNAL & ROUTE GANTRY (at Z = -14m)
    // =========================================================================
    const gantryGroup = new THREE.Group();
    gantryGroup.position.set(0, 0, -14.0);

    // Left Column
    const leftCol = new THREE.Mesh(geos.columnGeo, mats.gantrySteelMat);
    leftCol.position.set(-spanWidth * 0.5, 3.75, 0);
    gantryGroup.add(leftCol);

    // Right Column
    const rightCol = new THREE.Mesh(geos.columnGeo, mats.gantrySteelMat);
    rightCol.position.set(spanWidth * 0.5, 3.75, 0);
    gantryGroup.add(rightCol);

    // Cross Beam
    const crossBeam = new THREE.Mesh(geos.beamGeo, mats.gantrySteelMat);
    crossBeam.position.set(0, 7.2, 0);
    gantryGroup.add(crossBeam);

    // Hazard warning banner strip
    const hazardStripe = new THREE.Mesh(new THREE.BoxGeometry(spanWidth * 0.98, 0.28, 0.87), mats.hazardStripeMat);
    hazardStripe.position.set(0, 6.6, 0);
    gantryGroup.add(hazardStripe);

    // ROUTE A SIGNBOARD (Left / Center)
    const signA = new THREE.Mesh(geos.signGeo, mats.signBoardMatA);
    signA.position.set(-2.8, 5.4, 0.2);
    gantryGroup.add(signA);

    // ROUTE B SIGNBOARD (Right)
    const signB = new THREE.Mesh(geos.signGeo, mats.signBoardMatB);
    signB.position.set(2.8, 5.4, 0.2);
    gantryGroup.add(signB);

    // ROUTE A MULTI-ASPECT SIGNAL HEAD
    const signalHeadA = new THREE.Group();
    signalHeadA.name = 'signal_head_route_a';
    signalHeadA.position.set(-5.6, 5.5, 0.5);

    const housingA = new THREE.Mesh(geos.signalHousingGeo, mats.signalHousingMat);
    signalHeadA.add(housingA);

    const lensTopA = new THREE.Mesh(geos.lensGeo, mats.greenSignalMat);
    lensTopA.name = 'signal_lens_route_a';
    lensTopA.position.set(0, 0.45, 0.26);
    signalHeadA.add(lensTopA);

    gantryGroup.add(signalHeadA);

    // ROUTE B MULTI-ASPECT SIGNAL HEAD
    const signalHeadB = new THREE.Group();
    signalHeadB.name = 'signal_head_route_b';
    signalHeadB.position.set(5.6, 5.5, 0.5);

    const housingB = new THREE.Mesh(geos.signalHousingGeo, mats.signalHousingMat);
    signalHeadB.add(housingB);

    const lensTopB = new THREE.Mesh(geos.lensGeo, mats.amberSignalMat);
    lensTopB.name = 'signal_lens_route_b';
    lensTopB.position.set(0, 0.45, 0.26);
    signalHeadB.add(lensTopB);

    gantryGroup.add(signalHeadB);

    rootGroup.add(gantryGroup);

    // =========================================================================
    // 2. PHYSICAL RAILWAY SWITCH POINT & TURNOUT FROG (at Z = -38m to -65m)
    // =========================================================================
    const switchPointGroup = new THREE.Group();
    switchPointGroup.name = 'railway_switch_mechanism';
    switchPointGroup.position.set(0, 0, -38.0);

    // Ground Trackside Switch Motor Actuator
    const switchMotor = new THREE.Mesh(geos.switchBoxGeo, mats.switchMotorMat);
    switchMotor.position.set(CONSTANTS.LANES[1] + 1.8, 0.35, 0);
    switchPointGroup.add(switchMotor);

    // Switch Position Target Lantern
    const targetLampGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.4, 8);
    const targetLamp = new THREE.Mesh(targetLampGeo, mats.amberSignalMat);
    targetLamp.name = 'switch_target_lamp';
    targetLamp.position.set(CONSTANTS.LANES[1] + 1.8, 0.75, 0);
    switchPointGroup.add(targetLamp);

    // Movable Switch Blades (Left and Right point rails)
    const bladeGeo = new THREE.BoxGeometry(0.12, 0.14, 8.5);
    const bladeLeft = new THREE.Mesh(bladeGeo, mats.switchBladeSteelMat);
    bladeLeft.name = 'switch_blade_left';
    bladeLeft.position.set(CONSTANTS.LANES[0] - 0.72, 0.12, -4.2);
    switchPointGroup.add(bladeLeft);

    const bladeRight = new THREE.Mesh(bladeGeo, mats.switchBladeSteelMat);
    bladeRight.name = 'switch_blade_right';
    bladeRight.position.set(CONSTANTS.LANES[0] + 0.72, 0.12, -4.2);
    switchPointGroup.add(bladeRight);

    // Turnout Frog & Check Rails (Cast Manganese Steel Frog)
    const frogGeo = new THREE.BoxGeometry(0.35, 0.16, 2.8);
    const frog = new THREE.Mesh(frogGeo, mats.railSteelMat);
    frog.position.set(CONSTANTS.LANES[0] + 0.45, 0.12, -10.5);
    switchPointGroup.add(frog);

    // Divergent Curved Rail Track running towards Route B
    const divergentRail = new THREE.Mesh(geos.divergentRailGeo, mats.railSteelMat);
    switchPointGroup.add(divergentRail);

    // Divergent Ballast expansion bed
    const divBedGeo = new THREE.BoxGeometry(4.2, 0.35, 28.0);
    const divBed = new THREE.Mesh(divBedGeo, mats.divergentBallastMat);
    divBed.position.set(CONSTANTS.LANES[1] + 1.4, -0.18, -14.0);
    divBed.rotation.y = -0.06;
    switchPointGroup.add(divBed);

    rootGroup.add(switchPointGroup);

    return rootGroup;
  }

  /**
   * Updates visual aspects on the junction gantry and switch mechanism
   * according to player commitment or route selection.
   */
  public updateVisualCommitment(
    junctionGroup: THREE.Group,
    committedRoute: RouteBranchId | null
  ): void {
    if (!this.sharedMaterials) return;
    const mats = this.sharedMaterials;

    const lensA = junctionGroup.getObjectByName('signal_lens_route_a') as THREE.Mesh;
    const lensB = junctionGroup.getObjectByName('signal_lens_route_b') as THREE.Mesh;
    const switchLamp = junctionGroup.getObjectByName('switch_target_lamp') as THREE.Mesh;
    const bladeRight = junctionGroup.getObjectByName('switch_blade_right') as THREE.Mesh;

    if (!lensA || !lensB) return;

    if (committedRoute === 'ROUTE_A_MAIN_METRO') {
      lensA.material = mats.greenSignalMat;
      lensB.material = mats.redSignalMat; // Route B closed
      if (switchLamp) switchLamp.material = mats.greenSignalMat;
      if (bladeRight) bladeRight.position.x = CONSTANTS.LANES[0] + 0.65; // Thrown to Route A
    } else if (committedRoute === 'ROUTE_B_INDUSTRIAL_OVERPASS') {
      lensA.material = mats.redSignalMat; // Route A closed
      lensB.material = mats.greenSignalMat; // Route B open green
      if (switchLamp) switchLamp.material = mats.amberSignalMat;
      if (bladeRight) bladeRight.position.x = CONSTANTS.LANES[0] + 0.85; // Thrown to Route B
    } else {
      // Approaching state: both routes available
      lensA.material = mats.greenSignalMat;
      lensB.material = mats.amberSignalMat;
      if (switchLamp) switchLamp.material = mats.amberSignalMat;
    }
  }
}
