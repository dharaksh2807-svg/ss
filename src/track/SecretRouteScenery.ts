import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { CurvedShaderManager } from '../scene/CurvedShader';
import { SecretRouteId } from './SecretRouteTypes';

/**
 * Procedural 3D scenery and atmospheric architecture for Secret Railway Routes.
 * Implements high-quality, authentic railway structures with cached geometries,
 * shared curved materials, and deterministic procedural placement.
 */
export class SecretRouteScenery {
  private static instance: SecretRouteScenery;
  private curvedManager = CurvedShaderManager.getInstance();

  // Cached Materials
  private materials: {
    // Shared / Industrial
    weatheredGraniteMat: THREE.MeshStandardMaterial;
    tactileYellowMat: THREE.MeshStandardMaterial;
    castIronMat: THREE.MeshStandardMaterial;
    vintageWoodMat: THREE.MeshStandardMaterial;
    weatheredBrickMat: THREE.MeshStandardMaterial;
    vintageGreenTileMat: THREE.MeshStandardMaterial;
    amberLampMat: THREE.MeshBasicMaterial;
    amberGlowMat: THREE.MeshBasicMaterial;
    signBoardMat: THREE.MeshStandardMaterial;

    // Highline Skyway
    steelGirderMat: THREE.MeshStandardMaterial;
    safetyYellowMat: THREE.MeshStandardMaterial;
    metalGrilleMat: THREE.MeshStandardMaterial;
    cyanBeaconMat: THREE.MeshBasicMaterial;

    // Sector 04 Maintenance
    bulkheadSteelMat: THREE.MeshStandardMaterial;
    ductSteelMat: THREE.MeshStandardMaterial;
    hazardChevronMat: THREE.MeshStandardMaterial;
    cyanLedMat: THREE.MeshBasicMaterial;
    transformerBoxMat: THREE.MeshStandardMaterial;
  } | null = null;

  private constructor() {
    this.initMaterials();
  }

  public static getInstance(): SecretRouteScenery {
    if (!SecretRouteScenery.instance) {
      SecretRouteScenery.instance = new SecretRouteScenery();
    }
    return SecretRouteScenery.instance;
  }

  private initMaterials(): void {
    if (this.materials) return;

    // 1. Weathered Stone & Vintage Tile
    const weatheredGraniteMat = new THREE.MeshStandardMaterial({
      color: 0x5a5752,
      roughness: 0.88,
      metalness: 0.12
    });
    this.curvedManager.applyCurvature(weatheredGraniteMat);

    const tactileYellowMat = new THREE.MeshStandardMaterial({
      color: 0xdfa010,
      roughness: 0.65,
      metalness: 0.20
    });
    this.curvedManager.applyCurvature(tactileYellowMat);

    const castIronMat = new THREE.MeshStandardMaterial({
      color: 0x222428,
      roughness: 0.70,
      metalness: 0.75
    });
    this.curvedManager.applyCurvature(castIronMat);

    const vintageWoodMat = new THREE.MeshStandardMaterial({
      color: 0x523924,
      roughness: 0.82,
      metalness: 0.05
    });
    this.curvedManager.applyCurvature(vintageWoodMat);

    const weatheredBrickMat = new THREE.MeshStandardMaterial({
      color: 0x7a3d31,
      roughness: 0.90,
      metalness: 0.08
    });
    this.curvedManager.applyCurvature(weatheredBrickMat);

    const vintageGreenTileMat = new THREE.MeshStandardMaterial({
      color: 0x1b4d3e,
      roughness: 0.35,
      metalness: 0.25
    });
    this.curvedManager.applyCurvature(vintageGreenTileMat);

    const amberLampMat = new THREE.MeshBasicMaterial({
      color: 0xffaa33
    });
    this.curvedManager.applyCurvature(amberLampMat);

    const amberGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.45
    });
    this.curvedManager.applyCurvature(amberGlowMat);

    const signBoardMat = new THREE.MeshStandardMaterial({
      color: 0x1a2130,
      roughness: 0.50,
      metalness: 0.30
    });
    this.curvedManager.applyCurvature(signBoardMat);

    // 2. Highline Skyway Materials
    const steelGirderMat = new THREE.MeshStandardMaterial({
      color: 0x3d4450,
      roughness: 0.55,
      metalness: 0.80
    });
    this.curvedManager.applyCurvature(steelGirderMat);

    const safetyYellowMat = new THREE.MeshStandardMaterial({
      color: 0xf0b800,
      roughness: 0.45,
      metalness: 0.35
    });
    this.curvedManager.applyCurvature(safetyYellowMat);

    const metalGrilleMat = new THREE.MeshStandardMaterial({
      color: 0x282c34,
      roughness: 0.60,
      metalness: 0.70,
      wireframe: false
    });
    this.curvedManager.applyCurvature(metalGrilleMat);

    const cyanBeaconMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff
    });
    this.curvedManager.applyCurvature(cyanBeaconMat);

    // 3. Sector 04 Maintenance Materials
    const bulkheadSteelMat = new THREE.MeshStandardMaterial({
      color: 0x2a303c,
      roughness: 0.60,
      metalness: 0.75
    });
    this.curvedManager.applyCurvature(bulkheadSteelMat);

    const ductSteelMat = new THREE.MeshStandardMaterial({
      color: 0x485160,
      roughness: 0.40,
      metalness: 0.85
    });
    this.curvedManager.applyCurvature(ductSteelMat);

    const hazardChevronMat = new THREE.MeshStandardMaterial({
      color: 0xffc400,
      roughness: 0.50,
      metalness: 0.20
    });
    this.curvedManager.applyCurvature(hazardChevronMat);

    const cyanLedMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff
    });
    this.curvedManager.applyCurvature(cyanLedMat);

    const transformerBoxMat = new THREE.MeshStandardMaterial({
      color: 0x38404e,
      roughness: 0.65,
      metalness: 0.60
    });
    this.curvedManager.applyCurvature(transformerBoxMat);

    this.materials = {
      weatheredGraniteMat,
      tactileYellowMat,
      castIronMat,
      vintageWoodMat,
      weatheredBrickMat,
      vintageGreenTileMat,
      amberLampMat,
      amberGlowMat,
      signBoardMat,
      steelGirderMat,
      safetyYellowMat,
      metalGrilleMat,
      cyanBeaconMat,
      bulkheadSteelMat,
      ductSteelMat,
      hazardChevronMat,
      cyanLedMat,
      transformerBoxMat
    };
  }

  /**
   * Builds custom 3D architectural scenery for the specified secret route.
   */
  public buildSecretScenery(
    container: THREE.Group,
    routeId: SecretRouteId,
    chunkLength: number = CONSTANTS.CHUNK_LENGTH
  ): void {
    if (!this.materials) this.initMaterials();

    const sceneryRoot = new THREE.Group();
    sceneryRoot.name = `secret_scenery_${routeId}`;

    switch (routeId) {
      case 'ABANDONED_METRO_PLATFORM':
        this.buildAbandonedPlatformScenery(sceneryRoot, chunkLength);
        break;
      case 'ELEVATED_RAILWAY_PASSAGE':
        this.buildElevatedSkywayScenery(sceneryRoot, chunkLength);
        break;
      case 'HIDDEN_MAINTENANCE_TUNNEL':
        this.buildMaintenanceTunnelScenery(sceneryRoot, chunkLength);
        break;
    }

    container.add(sceneryRoot);
  }

  // =========================================================================
  // SECRET 1: Abandoned Metro Platform Scenery
  // =========================================================================
  private buildAbandonedPlatformScenery(root: THREE.Group, chunkLength: number): void {
    const m = this.materials!;
    const platformX = CONSTANTS.LANES[-1]; // -2.2m (along left track)
    const platformWidth = 2.4;
    const platformHeight = 0.95;
    const platformZStart = -4.0;
    const platformLength = chunkLength - 8.0; // ~72m

    // 1. Concrete / Granite Platform Deck
    const platformGeo = new THREE.BoxGeometry(platformWidth, platformHeight, platformLength);
    const platformMesh = new THREE.Mesh(platformGeo, m.weatheredGraniteMat);
    platformMesh.position.set(platformX, platformHeight * 0.5, -chunkLength * 0.5);
    platformMesh.receiveShadow = true;
    root.add(platformMesh);

    // 2. Yellow Tactile Warning Edge Strip (along the inner edge toward track 0)
    const stripGeo = new THREE.BoxGeometry(0.25, 0.04, platformLength);
    const stripMesh = new THREE.Mesh(stripGeo, m.tactileYellowMat);
    stripMesh.position.set(platformX + platformWidth * 0.5 - 0.125, platformHeight + 0.02, -chunkLength * 0.5);
    root.add(stripMesh);

    // 3. Left Wall Backdrop: Weathered Brick & Green Victorian Subway Tile
    const wallX = platformX - platformWidth * 0.5 - 0.25;
    const wallHeight = 5.2;
    const wallGeo = new THREE.BoxGeometry(0.5, wallHeight, platformLength);
    const wallMesh = new THREE.Mesh(wallGeo, m.vintageGreenTileMat);
    wallMesh.position.set(wallX, wallHeight * 0.5, -chunkLength * 0.5);
    wallMesh.receiveShadow = true;
    root.add(wallMesh);

    // 4. Victorian Cast-Iron Columns along the platform edge every 16m
    const columnGeo = new THREE.CylinderGeometry(0.12, 0.16, 4.2, 8);
    for (let z = -12; z >= -chunkLength + 12; z -= 16) {
      const col = new THREE.Mesh(columnGeo, m.castIronMat);
      col.position.set(platformX - 0.6, 2.1, z);
      col.castShadow = true;
      root.add(col);

      // Antique gas lamp sconce on the column
      const lampArmGeo = new THREE.BoxGeometry(0.4, 0.06, 0.06);
      const arm = new THREE.Mesh(lampArmGeo, m.castIronMat);
      arm.position.set(platformX - 0.4, 3.4, z);
      root.add(arm);

      const lanternGeo = new THREE.OctahedronGeometry(0.18);
      const lantern = new THREE.Mesh(lanternGeo, m.amberLampMat);
      lantern.position.set(platformX - 0.2, 3.4, z);
      root.add(lantern);

      // Subtle warm amber glow halo
      const glowGeo = new THREE.SphereGeometry(0.4, 6, 6);
      const glow = new THREE.Mesh(glowGeo, m.amberGlowMat);
      glow.position.set(platformX - 0.2, 3.4, z);
      root.add(glow);
    }

    // 5. Vintage Wooden Benches & Luggage Trunks
    const benchGeo = new THREE.BoxGeometry(0.6, 0.45, 2.2);
    const bench1 = new THREE.Mesh(benchGeo, m.vintageWoodMat);
    bench1.position.set(platformX - 0.7, platformHeight + 0.225, -24.0);
    root.add(bench1);

    const bench2 = new THREE.Mesh(benchGeo, m.vintageWoodMat);
    bench2.position.set(platformX - 0.7, platformHeight + 0.225, -52.0);
    root.add(bench2);

    // 6. Vintage Enamel Signboard: "OLD CROSSING 1984 • SIDING 3"
    const signGeo = new THREE.BoxGeometry(0.1, 0.8, 3.8);
    const sign = new THREE.Mesh(signGeo, m.signBoardMat);
    sign.position.set(wallX + 0.3, 3.6, -18.0);
    root.add(sign);

    // Approach warning beacon at platform entrance
    const beaconGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.35, 8);
    const beacon = new THREE.Mesh(beaconGeo, m.amberLampMat);
    beacon.position.set(platformX, platformHeight + 0.2, -6.0);
    root.add(beacon);
  }

  // =========================================================================
  // SECRET 2: Elevated Railway Passage Scenery
  // =========================================================================
  private buildElevatedSkywayScenery(root: THREE.Group, chunkLength: number): void {
    const m = this.materials!;
    const skywayX = CONSTANTS.LANES[0]; // Center lane
    const elevatedY = 4.2; // Match train roof level

    // 1. Highline Steel Truss Pillars underneath elevating structure
    const pilarGeo = new THREE.BoxGeometry(0.6, elevatedY, 0.6);
    for (let z = -14; z >= -chunkLength + 14; z -= 18) {
      // Left and right support piers
      const pierL = new THREE.Mesh(pilarGeo, m.steelGirderMat);
      pierL.position.set(skywayX - 1.6, elevatedY * 0.5, z);
      root.add(pierL);

      const pierR = new THREE.Mesh(pilarGeo, m.steelGirderMat);
      pierR.position.set(skywayX + 1.6, elevatedY * 0.5, z);
      root.add(pierR);

      // Cross-girder bracing
      const braceGeo = new THREE.BoxGeometry(3.4, 0.35, 0.4);
      const brace = new THREE.Mesh(braceGeo, m.steelGirderMat);
      brace.position.set(skywayX, elevatedY - 0.2, z);
      root.add(brace);
    }

    // 2. High-Altitude Overhead Signal Bridges (Gantries) spanning tracks
    const gantryH = elevatedY + 3.4;
    const gantryZ = -30.0;
    const gantryGeo = new THREE.BoxGeometry(7.2, 0.45, 0.8);
    const gantry = new THREE.Mesh(gantryGeo, m.steelGirderMat);
    gantry.position.set(0, gantryH, gantryZ);
    root.add(gantry);

    // Glowing cyan transit beacons on the gantry
    for (let lx of [-2.2, 0, 2.2]) {
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), m.cyanBeaconMat);
      beacon.position.set(lx, gantryH - 0.4, gantryZ);
      root.add(beacon);
    }

    // 3. Safety Catwalk Railings along the elevated section
    const railPostGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6);
    const railBarGeo = new THREE.BoxGeometry(0.06, 0.06, 12.0);

    for (let z = -20; z >= -chunkLength + 20; z -= 12) {
      // Post on outer left and right of skyway
      const postL = new THREE.Mesh(railPostGeo, m.safetyYellowMat);
      postL.position.set(skywayX - 1.25, elevatedY + 0.55, z);
      root.add(postL);

      const postR = new THREE.Mesh(railPostGeo, m.safetyYellowMat);
      postR.position.set(skywayX + 1.25, elevatedY + 0.55, z);
      root.add(postR);

      const barL = new THREE.Mesh(railBarGeo, m.safetyYellowMat);
      barL.position.set(skywayX - 1.25, elevatedY + 1.0, z - 6.0);
      root.add(barL);

      const barR = new THREE.Mesh(railBarGeo, m.safetyYellowMat);
      barR.position.set(skywayX + 1.25, elevatedY + 1.0, z - 6.0);
      root.add(barR);
    }

    // 4. Skyline Horizon Vista Silhouette Backdrops
    // Add distant skyscraper silhouettes to give a stunning sense of open high-altitude height
    const vistaGroup = new THREE.Group();
    const bldgGeo = new THREE.BoxGeometry(10.0, 35.0, 8.0);
    const bldgMat = new THREE.MeshBasicMaterial({
      color: 0x0f1828,
      transparent: true,
      opacity: 0.82
    });
    this.curvedManager.applyCurvature(bldgMat);

    const b1 = new THREE.Mesh(bldgGeo, bldgMat);
    b1.position.set(-28.0, 14.0, -chunkLength * 0.5 - 10.0);
    vistaGroup.add(b1);

    const b2 = new THREE.Mesh(new THREE.BoxGeometry(8.0, 42.0, 8.0), bldgMat);
    b2.position.set(30.0, 18.0, -chunkLength * 0.5 + 5.0);
    vistaGroup.add(b2);

    root.add(vistaGroup);
  }

  // =========================================================================
  // SECRET 3: Hidden Maintenance Tunnel Scenery
  // =========================================================================
  private buildMaintenanceTunnelScenery(root: THREE.Group, chunkLength: number): void {
    const m = this.materials!;
    const tunnelX = CONSTANTS.LANES[1]; // Right lane (+2.2m)
    const vaultHeight = 14.5; // High clearance: full Jetpack compatibility (cruises at 9m)
    const tunnelWidth = 3.2;

    // 1. Ribbed Steel Bulkhead Arches every 9 meters
    const archThick = 0.45;
    for (let z = -6; z >= -chunkLength + 6; z -= 9) {
      // Left upright column
      const colL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 7.5, archThick), m.bulkheadSteelMat);
      colL.position.set(tunnelX - tunnelWidth * 0.5, 3.75, z);
      root.add(colL);

      // Right upright column
      const colR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 7.5, archThick), m.bulkheadSteelMat);
      colR.position.set(tunnelX + tunnelWidth * 0.5, 3.75, z);
      root.add(colR);

      // Overhead arch cross-beam at Y = 7.5m
      const beam = new THREE.Mesh(new THREE.BoxGeometry(tunnelWidth + 0.35, 0.4, archThick), m.bulkheadSteelMat);
      beam.position.set(tunnelX, 7.5, z);
      root.add(beam);

      // Cyan LED strip marker on the arch
      const led = new THREE.Mesh(new THREE.BoxGeometry(tunnelWidth * 0.7, 0.08, 0.08), m.cyanLedMat);
      led.position.set(tunnelX, 7.3, z + 0.22);
      root.add(led);
    }

    // 2. High-Pressure Steam Pipes running along the tunnel wall
    const pipeGeo = new THREE.CylinderGeometry(0.18, 0.18, chunkLength - 4.0, 10);
    const pipe = new THREE.Mesh(pipeGeo, m.ductSteelMat);
    pipe.rotation.x = Math.PI * 0.5;
    pipe.position.set(tunnelX + tunnelWidth * 0.5 - 0.2, 2.8, -chunkLength * 0.5);
    root.add(pipe);

    // 3. Heavy-Duty Corrugated Air Ventilation Ducts overhead
    const ductGeo = new THREE.CylinderGeometry(0.38, 0.38, chunkLength - 6.0, 12);
    const duct = new THREE.Mesh(ductGeo, m.ductSteelMat);
    duct.rotation.x = Math.PI * 0.5;
    duct.position.set(tunnelX - 0.6, 6.2, -chunkLength * 0.5);
    root.add(duct);

    // 4. Electrical Transformer Junction Boxes with hazard stripes
    const boxGeo = new THREE.BoxGeometry(0.4, 0.9, 0.6);
    const box1 = new THREE.Mesh(boxGeo, m.transformerBoxMat);
    box1.position.set(tunnelX + tunnelWidth * 0.5 - 0.25, 1.2, -22.0);
    root.add(box1);

    const box2 = new THREE.Mesh(boxGeo, m.transformerBoxMat);
    box2.position.set(tunnelX + tunnelWidth * 0.5 - 0.25, 1.2, -48.0);
    root.add(box2);

    // 5. Entrance Bulkhead Portal Frame with yellow/black hazard chevrons
    const portalZ = -6.0;
    const portalSignGeo = new THREE.BoxGeometry(tunnelWidth + 0.6, 0.65, 0.2);
    const portalSign = new THREE.Mesh(portalSignGeo, m.hazardChevronMat);
    portalSign.position.set(tunnelX, 5.2, portalZ);
    root.add(portalSign);

    // Twin flashing cyan entrance beacons
    const strobeL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), m.cyanBeaconMat);
    strobeL.position.set(tunnelX - tunnelWidth * 0.45, 5.2, portalZ + 0.15);
    root.add(strobeL);

    const strobeR = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), m.cyanBeaconMat);
    strobeR.position.set(tunnelX + tunnelWidth * 0.45, 5.2, portalZ + 0.15);
    root.add(strobeR);
  }
}
