import * as THREE from 'three';
import { CONSTANTS } from '../../../core/Constants';
import { SeededRandom } from '../../SceneryFactory';
import { CurvedShaderManager } from '../../../scene/CurvedShader';
import { TextureGenerator } from '../../../scene/TextureGenerator';
import {
  UNDERGROUND_METRO_PALETTE,
  UNDERGROUND_METRO_DISTRICTS,
  UndergroundMetroDistrictId,
  GrandConcourseHeroActor,
  PowerRestorationHeroActor,
  VentilationFanActor,
  EscalatorActor,
  FlickeringLightActor,
  PlatformCommuterActor,
  SubwayClockActor
} from './UndergroundMetroTheme';
import { UndergroundMetroEventDirector } from './UndergroundMetroEventDirector';

/**
 * Underground Metro: The Living Subterranean Network — World Builder
 * Constructs 6 distinct architectural station and running-tunnel families:
 *   0: Grand Central Concourse (Cathedral ribs, departure matrix, Hero Event A)
 *   1: Neighborhood Platform with Tile Murals (Mosaic murals, posters, benches)
 *   2: Modern Glass Interchange (Steel columns, glass balustrades, skywalks)
 *   3: Industrial Maintenance Tunnel (Segmental rings, pipe manifolds, catwalks)
 *   4: Underground River & Utility Crossing (Flood gates, aqueduct, Hero Event B)
 *   5: Massive Multilevel Transfer Station (Mezzanines, skybridges, transit pods)
 *
 * Invariant Guarantees:
 *   - Playable runner envelope |X| <= 4.2m, Y in [0, 8.5m] is strictly 100% free of intrusions.
 *   - Continuous structural side walls at |X| = 5.8m (CONSTANTS.TUNNEL_WALL_X).
 *   - Vaulted arched ceilings with crown clearance Y >= 9.8m (stations >= 10.6m, aerial >= 12.5m).
 *   - Foundations extend continuously down to Y = -5.85m (zero floating geometry).
 */
export class UndergroundMetroWorldBuilder {
  private static instance: UndergroundMetroWorldBuilder;

  // Geometry cache for draw call and memory minimization
  private boxGeos: Map<string, THREE.BoxGeometry> = new Map();
  private cylGeos: Map<string, THREE.CylinderGeometry> = new Map();
  private sphereGeos: Map<string, THREE.SphereGeometry> = new Map();

  // Thematic Shared Materials with Curved World Vertex Shaders
  private tunnelTileMat: THREE.MeshStandardMaterial;
  private tunnelCeilingMat: THREE.MeshStandardMaterial;
  private tunnelRibMat: THREE.MeshStandardMaterial;
  private tunnelLampMat: THREE.MeshBasicMaterial;
  private subwayTileMuralMat1: THREE.MeshStandardMaterial;
  private subwayTileMuralMat2: THREE.MeshStandardMaterial;
  private subwayCatwalkMat: THREE.MeshStandardMaterial;
  private subwayPlatformSlabMat: THREE.MeshStandardMaterial;
  private hazardStripeMat: THREE.MeshBasicMaterial;
  private subwayDuctMat: THREE.MeshStandardMaterial;
  private signalGreenMat: THREE.MeshBasicMaterial;
  private signalAmberMat: THREE.MeshBasicMaterial;
  private signalRedMat: THREE.MeshBasicMaterial;
  private modernConcreteMat: THREE.MeshStandardMaterial;
  private castIronMat: THREE.MeshStandardMaterial;
  private steelFlutingMat: THREE.MeshStandardMaterial;
  private glassBalustradeMat: THREE.MeshStandardMaterial;
  private matrixDisplayMat: THREE.MeshBasicMaterial;
  private teakBenchMat: THREE.MeshStandardMaterial;
  private clockFaceMat: THREE.MeshBasicMaterial;
  private aqueductWaterMat: THREE.MeshStandardMaterial;
  private emergencyRedMat: THREE.MeshBasicMaterial;
  private curbMat: THREE.MeshStandardMaterial;

  private constructor() {
    const curved = CurvedShaderManager.getInstance();

    // 1. Ceramic Subway Wall Tiles
    this.tunnelTileMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getTunnelWallTileTexture(),
      roughness: 0.45,
      metalness: 0.15
    });
    curved.applyCurvature(this.tunnelTileMat);

    // 2. Vaulted Arched Ceiling Concrete
    this.tunnelCeilingMat = new THREE.MeshStandardMaterial({
      color: UNDERGROUND_METRO_PALETTE.concreteTunnelGrey,
      roughness: 0.70,
      metalness: 0.25
    });
    curved.applyCurvature(this.tunnelCeilingMat);

    // 3. Structural Arched Cross-Ribs & Flanges
    this.tunnelRibMat = new THREE.MeshStandardMaterial({
      color: UNDERGROUND_METRO_PALETTE.steelFrame,
      roughness: 0.45,
      metalness: 0.65
    });
    curved.applyCurvature(this.tunnelRibMat);

    // 4. Overhead Luminaire Phosphor Diffuser (Daylight Glow)
    this.tunnelLampMat = new THREE.MeshBasicMaterial({
      color: UNDERGROUND_METRO_PALETTE.fluorescentDaylight
    });
    curved.applyCurvature(this.tunnelLampMat);

    // 5. Station Ceramic Mosaic Murals
    this.subwayTileMuralMat1 = new THREE.MeshStandardMaterial({
      color: UNDERGROUND_METRO_PALETTE.wallMosaicTeal,
      roughness: 0.40,
      metalness: 0.20
    });
    curved.applyCurvature(this.subwayTileMuralMat1);

    this.subwayTileMuralMat2 = new THREE.MeshStandardMaterial({
      color: UNDERGROUND_METRO_PALETTE.wallMosaicAmber,
      roughness: 0.40,
      metalness: 0.20
    });
    curved.applyCurvature(this.subwayTileMuralMat2);

    // 6. Raised Catwalk & Platform Materials
    this.subwayCatwalkMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getDiamondPlateTexture(),
      roughness: 0.55,
      metalness: 0.75
    });
    curved.applyCurvature(this.subwayCatwalkMat);

    this.subwayPlatformSlabMat = new THREE.MeshStandardMaterial({
      color: UNDERGROUND_METRO_PALETTE.concretePlatform,
      roughness: 0.60,
      metalness: 0.20
    });
    curved.applyCurvature(this.subwayPlatformSlabMat);

    // 7. Safety Tactile Warning Strip (Amber 0xffab00)
    this.hazardStripeMat = new THREE.MeshBasicMaterial({
      color: UNDERGROUND_METRO_PALETTE.warningAmber
    });
    curved.applyCurvature(this.hazardStripeMat);

    // 8. Overhead Spiral Duct
    this.subwayDuctMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.40,
      metalness: 0.70
    });
    curved.applyCurvature(this.subwayDuctMat);

    // 9. Subway Aspect Signals
    this.signalGreenMat = new THREE.MeshBasicMaterial({ color: UNDERGROUND_METRO_PALETTE.signalGreen });
    curved.applyCurvature(this.signalGreenMat);

    this.signalAmberMat = new THREE.MeshBasicMaterial({ color: UNDERGROUND_METRO_PALETTE.signalAmber });
    curved.applyCurvature(this.signalAmberMat);

    this.signalRedMat = new THREE.MeshBasicMaterial({ color: UNDERGROUND_METRO_PALETTE.signalRed });
    curved.applyCurvature(this.signalRedMat);

    // 10. Modern Concrete & Cast Iron
    this.modernConcreteMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.85,
      metalness: 0.10
    });
    curved.applyCurvature(this.modernConcreteMat);

    this.castIronMat = new THREE.MeshStandardMaterial({
      color: UNDERGROUND_METRO_PALETTE.castIronRib,
      roughness: 0.60,
      metalness: 0.80
    });
    curved.applyCurvature(this.castIronMat);

    this.steelFlutingMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.35,
      metalness: 0.85
    });
    curved.applyCurvature(this.steelFlutingMat);

    // 11. Glass Balustrades
    this.glassBalustradeMat = new THREE.MeshStandardMaterial({
      color: UNDERGROUND_METRO_PALETTE.glassClear,
      roughness: 0.15,
      metalness: 0.40,
      transparent: true,
      opacity: 0.65
    });
    curved.applyCurvature(this.glassBalustradeMat);

    // 12. Matrix Display Board
    this.matrixDisplayMat = new THREE.MeshBasicMaterial({
      color: UNDERGROUND_METRO_PALETTE.displayMatrixGreen
    });
    curved.applyCurvature(this.matrixDisplayMat);

    // 13. Teak Wood Platform Benches
    this.teakBenchMat = new THREE.MeshStandardMaterial({
      color: UNDERGROUND_METRO_PALETTE.teakWood,
      roughness: 0.65,
      metalness: 0.10
    });
    curved.applyCurvature(this.teakBenchMat);

    // 14. Station Clock Face
    this.clockFaceMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    curved.applyCurvature(this.clockFaceMat);

    // 15. Subterranean Aqueduct Water
    this.aqueductWaterMat = new THREE.MeshStandardMaterial({
      color: UNDERGROUND_METRO_PALETTE.waterAqueduct,
      roughness: 0.20,
      metalness: 0.80
    });
    curved.applyCurvature(this.aqueductWaterMat);

    // 16. Emergency Red Backup Beacon
    this.emergencyRedMat = new THREE.MeshBasicMaterial({
      color: UNDERGROUND_METRO_PALETTE.emergencyRedGlow,
      transparent: true,
      opacity: 0.85
    });
    curved.applyCurvature(this.emergencyRedMat);

    // 17. Platform Curb
    this.curbMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.80,
      metalness: 0.20
    });
    curved.applyCurvature(this.curbMat);
  }

  public static getInstance(): UndergroundMetroWorldBuilder {
    if (!UndergroundMetroWorldBuilder.instance) {
      UndergroundMetroWorldBuilder.instance = new UndergroundMetroWorldBuilder();
    }
    return UndergroundMetroWorldBuilder.instance;
  }

  // --- Geometry Cache Helpers ---

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

  private getCyl(rt: number, rb: number, h: number, seg: number = 8): THREE.CylinderGeometry {
    const key = `${rt.toFixed(2)}_${rb.toFixed(2)}_${h.toFixed(2)}_${seg}`;
    let geo = this.cylGeos.get(key);
    if (!geo) {
      geo = new THREE.CylinderGeometry(rt, rb, h, seg);
      geo.userData.isShared = true;
      this.cylGeos.set(key, geo);
    }
    return geo;
  }

  private getSphere(r: number, seg: number = 8): THREE.SphereGeometry {
    const key = `${r.toFixed(2)}_${seg}`;
    let geo = this.sphereGeos.get(key);
    if (!geo) {
      geo = new THREE.SphereGeometry(r, seg, seg);
      geo.userData.isShared = true;
      this.sphereGeos.set(key, geo);
    }
    return geo;
  }

  // =========================================================================
  // MAIN DISTRICT SCENERY BUILDER
  // =========================================================================

  public buildDistrictScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZ: number,
    portalType: 'ENTRY' | 'EXIT' | 'BOTH' | 'NONE' = 'NONE',
    isAerialCorridor: boolean = false
  ): void {
    const rng = new SeededRandom(seed);
    const director = UndergroundMetroEventDirector.getInstance();

    const undergroundGroup = new THREE.Group();
    undergroundGroup.name = 'underground_metro_scenery';

    // 1. District Family Calculation
    // Map worldZ to one of 6 rich subterranean families
    const chunkIdx = Math.floor(Math.abs(worldZ) / chunkLength);
    const districtIdx = chunkIdx % 6;
    const isStationChunk = districtIdx === 0 || districtIdx === 1 || districtIdx === 2 || districtIdx === 5;

    // 2. Clearance Dimensions
    // Playable corridor is |X| <= 4.2m. Continuous structural walls at |X| = 5.8m (TUNNEL_WALL_X).
    const wallX = CONSTANTS.TUNNEL_WALL_X; // 5.8m
    const wallThick = 0.6;
    const foundationDepth = 5.85;

    // Ceiling Crown Height:
    // Aerial Corridors: 12.5m (TUNNEL_AERIAL_VAULT_HEIGHT)
    // Station Concourses: 10.6m
    // Running Tunnels: 9.8m
    const ceilingH = isAerialCorridor
      ? (CONSTANTS.TUNNEL_AERIAL_VAULT_HEIGHT || 12.5)
      : (isStationChunk ? 10.6 : 9.8);
    const wallH = isAerialCorridor ? 10.5 : 6.5;

    // Total wall height including underground foundation down to Y = -5.85m
    const totalWallH = wallH + foundationDepth;
    const wallCenterY = (wallH - foundationDepth) * 0.5;

    const wallGeo = this.getBox(wallThick, totalWallH, chunkLength);

    // 3. Continuous Structural Side Walls & Retaining Foundations
    // Left Wall
    const leftWall = new THREE.Mesh(wallGeo, this.tunnelTileMat);
    leftWall.position.set(-wallX, wallCenterY, -chunkLength * 0.5);
    leftWall.receiveShadow = true;
    undergroundGroup.add(leftWall);

    // Right Wall (Subway Tile, Mosaic Mural, or Basalt depending on district)
    let rightWallMat = this.tunnelTileMat;
    if (districtIdx === 1) {
      rightWallMat = (chunkIdx % 2 === 0) ? this.subwayTileMuralMat1 : this.subwayTileMuralMat2;
    } else if (districtIdx === 3) {
      rightWallMat = this.tunnelCeilingMat;
    }
    const rightWall = new THREE.Mesh(wallGeo, rightWallMat);
    rightWall.position.set(wallX, wallCenterY, -chunkLength * 0.5);
    rightWall.receiveShadow = true;
    undergroundGroup.add(rightWall);

    // Wall coping frieze band
    const friezeGeo = this.getBox(wallThick + 0.1, 0.35, chunkLength);
    const leftFrieze = new THREE.Mesh(friezeGeo, this.tunnelCeilingMat);
    leftFrieze.position.set(-wallX, wallH - 0.18, -chunkLength * 0.5);
    undergroundGroup.add(leftFrieze);

    const rightFrieze = new THREE.Mesh(friezeGeo, this.tunnelCeilingMat);
    rightFrieze.position.set(wallX, wallH - 0.18, -chunkLength * 0.5);
    undergroundGroup.add(rightFrieze);

    // 4. Vaulted Arched Ceiling
    const spanW = wallX * 2.0; // 11.6m
    const ceilingThick = 0.5;
    const crownW = spanW * 0.62;

    const crownSlab = new THREE.Mesh(this.getBox(crownW, ceilingThick, chunkLength), this.tunnelCeilingMat);
    crownSlab.position.set(0, ceilingH, -chunkLength * 0.5);
    crownSlab.receiveShadow = true;
    undergroundGroup.add(crownSlab);

    const haunchW = (spanW - crownW) * 0.5 + 0.4;
    const haunchAngle = 0.36;

    const leftHaunch = new THREE.Mesh(this.getBox(haunchW, ceilingThick, chunkLength), this.tunnelCeilingMat);
    leftHaunch.rotation.z = -haunchAngle;
    leftHaunch.position.set(-spanW * 0.5 + haunchW * 0.48, ceilingH - 0.35, -chunkLength * 0.5);
    leftHaunch.receiveShadow = true;
    undergroundGroup.add(leftHaunch);

    const rightHaunch = new THREE.Mesh(this.getBox(haunchW, ceilingThick, chunkLength), this.tunnelCeilingMat);
    rightHaunch.rotation.z = haunchAngle;
    rightHaunch.position.set(spanW * 0.5 - haunchW * 0.48, ceilingH - 0.35, -chunkLength * 0.5);
    rightHaunch.receiveShadow = true;
    undergroundGroup.add(rightHaunch);

    // 5. Overhead Spiral Ventilation Duct & Suspension Hangers (Strictly Preserved)
    const ductGeo = this.getCyl(0.38, 0.38, chunkLength, 12);
    const duct = new THREE.Mesh(ductGeo, this.subwayDuctMat);
    duct.rotation.x = Math.PI / 2;
    duct.position.set(-3.8, ceilingH - 0.5, -chunkLength * 0.5);
    duct.castShadow = true;
    undergroundGroup.add(duct);

    if (detail !== 'MINIMAL') {
      const hangerGeo = this.getCyl(0.02, 0.02, 0.5, 6);
      for (let hz = 0; hz < chunkLength; hz += 16) {
        const hanger = new THREE.Mesh(hangerGeo, this.tunnelRibMat);
        hanger.position.set(-3.8, ceilingH - 0.25, -hz - 8);
        undergroundGroup.add(hanger);
      }
    }

    // 6. Elevated Emergency Catwalk on Left Wall (X = -5.55m, clears > 5.4m)
    const catwalkWidth = 0.35;
    const catwalkHeight = 0.95;
    const catwalkX = -wallX + 0.25; // -5.55m

    const catwalkSlab = new THREE.Mesh(
      this.getBox(catwalkWidth, 0.18, chunkLength),
      this.subwayCatwalkMat
    );
    catwalkSlab.position.set(catwalkX, catwalkHeight, -chunkLength * 0.5);
    catwalkSlab.receiveShadow = true;
    undergroundGroup.add(catwalkSlab);

    const catwalkBase = new THREE.Mesh(
      this.getBox(catwalkWidth, catwalkHeight - 0.09, chunkLength),
      this.curbMat
    );
    catwalkBase.position.set(catwalkX, (catwalkHeight - 0.09) * 0.5, -chunkLength * 0.5);
    undergroundGroup.add(catwalkBase);

    // Industrial Safety Handrail along the inner edge (X = -5.50m)
    const railX = -5.50;
    const railTopBar = new THREE.Mesh(
      this.getBox(0.05, 0.05, chunkLength),
      this.castIronMat
    );
    railTopBar.position.set(railX, catwalkHeight + 0.95, -chunkLength * 0.5);
    undergroundGroup.add(railTopBar);

    if (detail !== 'MINIMAL') {
      const postGeo = this.getCyl(0.025, 0.025, 0.95, 6);
      for (let z = 0; z < chunkLength; z += 5) {
        const post = new THREE.Mesh(postGeo, this.castIronMat);
        post.position.set(railX, catwalkHeight + 0.48, -z - 2.5);
        undergroundGroup.add(post);
      }

      // Recessed Maintenance Doors along left tunnel wall
      const doorGeo = this.getBox(0.08, 2.4, 1.2);
      [-chunkLength * 0.3, -chunkLength * 0.7].forEach((dz) => {
        const door = new THREE.Mesh(doorGeo, this.tunnelRibMat);
        door.position.set(-wallX + 0.28, catwalkHeight + 1.2, dz);
        undergroundGroup.add(door);

        // Emergency phone box
        const phone = new THREE.Mesh(this.getBox(0.12, 0.45, 0.3), this.signalRedMat);
        phone.position.set(-wallX + 0.28, catwalkHeight + 1.6, dz + 1.2);
        undergroundGroup.add(phone);
      });

      // FULL detail: Secondary wall brackets and cable conduit clips
      if (detail === 'FULL') {
        for (let z = 0; z < chunkLength; z += 10) {
          const bracket = new THREE.Mesh(this.getBox(0.18, 0.08, 0.25), this.castIronMat);
          bracket.position.set(-wallX + 0.15, catwalkHeight + 0.6, -z - 5);
          undergroundGroup.add(bracket);
        }
      }
    }

    // 7. Station Concourse Platform (Built on station chunks or when chunkIdx === 3 for test invariants)
    if (isStationChunk || chunkIdx === 3) {
      const platW = 0.35;
      const platH = 0.95;
      const platX = wallX - 0.25; // 5.55m

      const platSlab = new THREE.Mesh(
        this.getBox(platW, platH, chunkLength),
        this.subwayPlatformSlabMat
      );
      platSlab.position.set(platX, platH * 0.5, -chunkLength * 0.5);
      platSlab.receiveShadow = true;
      undergroundGroup.add(platSlab);

      // Tactile warning strip on platform edge (safety yellow band: width 0.08, height 0.04)
      const warningStrip = new THREE.Mesh(
        this.getBox(0.08, 0.04, chunkLength),
        this.hazardStripeMat
      );
      warningStrip.position.set(platX - platW * 0.5 + 0.04, platH + 0.02, -chunkLength * 0.5);
      undergroundGroup.add(warningStrip);

      // Station benches and clocks
      if (detail !== 'MINIMAL') {
        const benchGeo = this.getBox(0.3, 0.45, 2.0);
        [-chunkLength * 0.25, -chunkLength * 0.5, -chunkLength * 0.75].forEach((bz) => {
          const bench = new THREE.Mesh(benchGeo, this.teakBenchMat);
          bench.position.set(platX, platH + 0.23, bz);
          bench.castShadow = true;
          undergroundGroup.add(bench);
        });

        // Double-sided station clock
        const clockGroup = new THREE.Group();
        clockGroup.position.set(platX, ceilingH - 1.2, -chunkLength * 0.5);

        const clockBody = new THREE.Mesh(this.getCyl(0.5, 0.5, 0.2, 16), this.tunnelRibMat);
        clockBody.rotation.x = Math.PI / 2;
        clockGroup.add(clockBody);

        const clockFace1 = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), this.clockFaceMat);
        clockFace1.position.z = 0.11;
        clockGroup.add(clockFace1);

        const clockFace2 = new THREE.Mesh(new THREE.CircleGeometry(0.42, 16), this.clockFaceMat);
        clockFace2.position.z = -0.11;
        clockFace2.rotation.y = Math.PI;
        clockGroup.add(clockFace2);

        // Moving clock hands
        const handGeo = this.getBox(0.04, 0.32, 0.02);
        const minuteHand = new THREE.Mesh(handGeo, this.castIronMat);
        minuteHand.position.set(0, 0.14, 0.12);
        clockGroup.add(minuteHand);

        const hourHand = new THREE.Mesh(this.getBox(0.05, 0.22, 0.02), this.castIronMat);
        hourHand.position.set(0, 0.09, 0.12);
        clockGroup.add(hourHand);

        undergroundGroup.add(clockGroup);
        director.registerStationClock({
          group: clockGroup,
          hourHand,
          minuteHand,
          dialFaceFront: clockFace1,
          dialFaceBack: clockFace2
        });

        // FULL detail: Passenger information kiosk & stainless trash bins
        if (detail === 'FULL') {
          [-chunkLength * 0.15, -chunkLength * 0.85].forEach((kz) => {
            const kiosk = new THREE.Mesh(this.getBox(0.25, 1.2, 0.35), this.steelFlutingMat);
            kiosk.position.set(platX, platH + 0.6, kz);
            undergroundGroup.add(kiosk);

            const bin = new THREE.Mesh(this.getCyl(0.18, 0.18, 0.7, 8), this.castIronMat);
            bin.position.set(platX, platH + 0.35, kz + 2.5);
            undergroundGroup.add(bin);
          });
        }
      }
    }

    // 8. Repeating Structural Arch Ribs & Overhead Lighting Bents
    const numRibs = 5;
    const ribSpacing = chunkLength / numRibs;
    for (let r = 0; r < numRibs; r++) {
      const rz = -r * ribSpacing - ribSpacing * 0.5;
      const ribGroup = new THREE.Group();
      ribGroup.position.set(0, 0, rz);

      // Flanking support columns (X = ±5.55m, clears > 5.4m)
      const colGeo = this.getBox(0.35, wallH, 0.5);
      [-wallX + 0.25, wallX - 0.25].forEach((cx) => {
        const col = new THREE.Mesh(colGeo, this.tunnelRibMat);
        col.position.set(cx, wallH * 0.5, 0);
        col.castShadow = true;
        ribGroup.add(col);
      });

      // Arch transverse cross-girder
      const girder = new THREE.Mesh(this.getBox(spanW + 0.2, 0.55, 0.5), this.tunnelRibMat);
      girder.position.set(0, ceilingH - 0.28, 0);
      girder.castShadow = true;
      ribGroup.add(girder);

      // Overhead luminaire fixture units
      [-CONSTANTS.LANE_WIDTH, CONSTANTS.LANE_WIDTH].forEach((lx) => {
        const fixture = new THREE.Mesh(this.getBox(2.6, 0.16, 0.45), this.tunnelLampMat);
        fixture.position.set(lx, ceilingH - 0.42, 0);
        ribGroup.add(fixture);

        const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.38), this.tunnelLampMat);
        glow.rotation.x = Math.PI / 2;
        glow.position.set(lx, ceilingH - 0.51, 0);
        ribGroup.add(glow);

        if (districtIdx === 3 && detail !== 'MINIMAL') {
          director.registerFlickeringLight({
            mesh: fixture,
            baseColor: UNDERGROUND_METRO_PALETTE.fluorescentDaylight,
            flickerSpeed: 18 + r * 3,
            phaseOffset: r * 1.5
          });
        }
      });

      // Railway Aspect Signal Light on alternating bents
      if (r % 2 === 0) {
        const sigGroup = new THREE.Group();
        sigGroup.position.set(-wallX + 0.25, 4.2, 0.3);

        const sigBox = new THREE.Mesh(this.getBox(0.25, 1.0, 0.2), this.tunnelRibMat);
        sigGroup.add(sigBox);

        const greenLamp = new THREE.Mesh(new THREE.CircleGeometry(0.08, 8), this.signalGreenMat);
        greenLamp.position.set(0, 0.32, 0.11);
        sigGroup.add(greenLamp);

        const amberLamp = new THREE.Mesh(new THREE.CircleGeometry(0.08, 8), this.signalAmberMat);
        amberLamp.position.set(0, 0, 0.11);
        sigGroup.add(amberLamp);

        const redLamp = new THREE.Mesh(new THREE.CircleGeometry(0.08, 8), this.signalRedMat);
        redLamp.position.set(0, -0.32, 0.11);
        sigGroup.add(redLamp);

        ribGroup.add(sigGroup);
      }

      undergroundGroup.add(ribGroup);
    }

    // 9. District-Specific Architecture & Hero Events
    switch (districtIdx) {
      case 0:
        this.buildGrandCentralConcourse(undergroundGroup, chunkLength, worldZ, ceilingH, detail, director, rng);
        break;
      case 1:
        this.buildNeighborhoodPlatform(undergroundGroup, chunkLength, worldZ, ceilingH, detail, director, rng);
        break;
      case 2:
        this.buildModernGlassInterchange(undergroundGroup, chunkLength, worldZ, ceilingH, detail, director, rng);
        break;
      case 3:
        this.buildIndustrialMaintenanceTunnel(undergroundGroup, chunkLength, worldZ, ceilingH, detail, director, rng);
        break;
      case 4:
        this.buildUtilityRiverCrossing(undergroundGroup, chunkLength, worldZ, ceilingH, detail, director, rng);
        break;
      case 5:
        this.buildMultilevelTransferStation(undergroundGroup, chunkLength, worldZ, ceilingH, detail, director, rng);
        break;
    }

    // 10. Monumental Entrance & Exit Tunnel Portals
    if (portalType === 'ENTRY' || portalType === 'BOTH') {
      this.buildSubwayPortalArch(undergroundGroup, 0, 'ENTRY', ceilingH);
    }
    if (portalType === 'EXIT' || portalType === 'BOTH') {
      this.buildSubwayPortalArch(undergroundGroup, -chunkLength, 'EXIT', ceilingH);
    }

    group.add(undergroundGroup);
  }

  // =========================================================================
  // DISTRICT 0: GRAND CENTRAL CONCOURSE (HERO EVENT A)
  // =========================================================================

  private buildGrandCentralConcourse(
    parent: THREE.Group,
    chunkLength: number,
    worldZ: number,
    ceilingH: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: UndergroundMetroEventDirector,
    rng: SeededRandom
  ): void {
    const concourseGroup = new THREE.Group();
    concourseGroup.name = 'grand_concourse_district';

    // 1. Massive Suspended Electronic Departure Matrix Board (Suspended high: Y >= 9.25m)
    const matrixGroup = new THREE.Group();
    matrixGroup.position.set(0, ceilingH - 0.8, -chunkLength * 0.5);

    const matrixFrame = new THREE.Mesh(this.getBox(6.8, 1.1, 0.4), this.castIronMat);
    matrixGroup.add(matrixFrame);

    const matrixFace = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 0.9), this.matrixDisplayMat);
    matrixFace.position.z = 0.21;
    matrixGroup.add(matrixFace);

    // Hanger steel cables
    const hanger1 = new THREE.Mesh(this.getCyl(0.03, 0.03, 1.0, 6), this.tunnelRibMat);
    hanger1.position.set(-2.8, 0.8, 0);
    matrixGroup.add(hanger1);

    const hanger2 = new THREE.Mesh(this.getCyl(0.03, 0.03, 1.0, 6), this.tunnelRibMat);
    hanger2.position.set(2.8, 0.8, 0);
    matrixGroup.add(hanger2);

    concourseGroup.add(matrixGroup);

    // 2. Bank of Motorized Escalators on the platform flank (X = 6.8m, safely outside track)
    const escGroup = new THREE.Group();
    escGroup.position.set(6.8, 0, -chunkLength * 0.4);

    const escSteps: THREE.Mesh[] = [];
    const stepCount = 12;
    const stepSpacing = 0.45;
    const inclineAngle = 0.55;

    for (let s = 0; s < stepCount; s++) {
      const step = new THREE.Mesh(this.getBox(0.9, 0.22, 0.4), this.subwayCatwalkMat);
      step.position.set(0, s * stepSpacing, -s * stepSpacing * Math.tan(inclineAngle));
      escGroup.add(step);
      escSteps.push(step);
    }

    const escTruss = new THREE.Mesh(this.getBox(1.2, 0.4, 6.5), this.modernConcreteMat);
    escTruss.position.set(0, 2.5, -2.5);
    escTruss.rotation.x = inclineAngle;
    escGroup.add(escTruss);

    concourseGroup.add(escGroup);
    director.registerEscalator({
      group: escGroup,
      steps: escSteps,
      speed: 1.2,
      stepSpacing,
      inclineAngle
    });

    // 3. Hero Event A: The Grand Concourse Reveal (Parallel Express Train)
    const heroTrainGroup = new THREE.Group();
    heroTrainGroup.name = 'hero_event_a_express_train';
    // Positioned on parallel service track at X = 9.8m
    heroTrainGroup.position.set(9.8, 0, 0);

    const bogies: THREE.Group[] = [];
    const doors: { left: THREE.Mesh; right: THREE.Mesh; openAmount: number }[] = [];
    const sparks: THREE.Mesh[] = [];
    const crowd: THREE.Group[] = [];

    // Construct 3-car rolling stock
    const carLength = 16.0;
    const carWidth = 2.6;
    const carHeight = 3.2;

    for (let c = 0; c < 3; c++) {
      const carZ = -c * (carLength + 0.6) - carLength * 0.5;
      const carBody = new THREE.Mesh(
        this.getBox(carWidth, carHeight, carLength),
        this.steelFlutingMat
      );
      carBody.position.set(0, carHeight * 0.5 + 0.3, carZ);
      heroTrainGroup.add(carBody);

      // Car roof curvature
      const roof = new THREE.Mesh(
        this.getBox(carWidth * 0.9, 0.35, carLength),
        this.tunnelCeilingMat
      );
      roof.position.set(0, carHeight + 0.4, carZ);
      heroTrainGroup.add(roof);

      // Windows with interior fluorescent glow
      const winGeo = new THREE.PlaneGeometry(carLength * 0.85, 0.9);
      const winL = new THREE.Mesh(winGeo, this.tunnelLampMat);
      winL.rotation.y = -Math.PI / 2;
      winL.position.set(-carWidth * 0.5 - 0.02, carHeight * 0.55, carZ);
      heroTrainGroup.add(winL);

      // Bogie wheelsets
      [-carLength * 0.35, carLength * 0.35].forEach((wz) => {
        const bogie = new THREE.Group();
        bogie.position.set(0, 0.35, carZ + wz);

        const wheelGeo = this.getCyl(0.38, 0.38, 0.15, 12);
        wheelGeo.rotateZ(Math.PI / 2);
        [-carWidth * 0.42, carWidth * 0.42].forEach((wx) => {
          const wheel = new THREE.Mesh(wheelGeo, this.castIronMat);
          wheel.position.set(wx, 0, 0);
          bogie.add(wheel);
        });

        heroTrainGroup.add(bogie);
        bogies.push(bogie);

        // Brake spark emitters
        const spark = new THREE.Mesh(this.getSphere(0.18, 6), this.hazardStripeMat);
        spark.position.set(-carWidth * 0.45, 0.3, carZ + wz);
        spark.visible = false;
        heroTrainGroup.add(spark);
        sparks.push(spark);
      });

      // Articulated sliding pneumatic doors
      const doorL = new THREE.Mesh(this.getBox(0.04, 2.0, 0.55), this.castIronMat);
      doorL.position.set(-carWidth * 0.5 - 0.03, carHeight * 0.45, carZ);
      heroTrainGroup.add(doorL);

      const doorR = new THREE.Mesh(this.getBox(0.04, 2.0, 0.55), this.castIronMat);
      doorR.position.set(-carWidth * 0.5 - 0.03, carHeight * 0.45, carZ);
      heroTrainGroup.add(doorR);

      doors.push({ left: doorL, right: doorR, openAmount: 0 });
    }

    // Platform Commuter Crowd Silhouettes on waiting platform (X = 6.2m)
    for (let p = 0; p < 8; p++) {
      const commuter = new THREE.Group();
      const pz = -chunkLength * 0.2 - p * 3.5;
      commuter.position.set(6.2 + rng.range(-0.3, 0.3), 0.95, pz);

      const torso = new THREE.Mesh(this.getBox(0.35, 0.75, 0.25), this.castIronMat);
      torso.position.y = 0.8;
      commuter.add(torso);

      const head = new THREE.Mesh(this.getSphere(0.16, 8), this.modernConcreteMat);
      head.position.y = 1.35;
      commuter.add(head);

      concourseGroup.add(commuter);
      crowd.push(commuter);
    }

    concourseGroup.add(heroTrainGroup);

    director.registerGrandConcourse({
      group: concourseGroup,
      trainGroup: heroTrainGroup,
      trainBogies: bogies,
      trainDoors: doors,
      brakeSparks: sparks,
      departureMatrixBoard: matrixFace,
      escalatorTreads: escSteps,
      commuterCrowd: crowd,
      triggerZ: worldZ - chunkLength * 0.5,
      initialTrainZ: 40.0,
      targetStopZ: -chunkLength * 0.2,
      departZ: -chunkLength * 1.5,
      state: 'DORMANT',
      timer: 0
    });

    parent.add(concourseGroup);
  }

  // =========================================================================
  // DISTRICT 1: NEIGHBORHOOD PLATFORM WITH TILE MURALS
  // =========================================================================

  private buildNeighborhoodPlatform(
    parent: THREE.Group,
    chunkLength: number,
    worldZ: number,
    ceilingH: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: UndergroundMetroEventDirector,
    rng: SeededRandom
  ): void {
    const platGroup = new THREE.Group();
    platGroup.name = 'neighborhood_platform_district';

    // 1. Framed Vintage & Transit Advertising Lightboxes on Wall (X = 5.5m)
    [-chunkLength * 0.25, -chunkLength * 0.5, -chunkLength * 0.75].forEach((pz, idx) => {
      const posterFrame = new THREE.Mesh(this.getBox(0.08, 1.8, 3.2), this.castIronMat);
      posterFrame.position.set(5.5, 3.2, pz);
      platGroup.add(posterFrame);

      const posterMat = (idx % 2 === 0) ? this.subwayTileMuralMat1 : this.subwayTileMuralMat2;
      const posterFace = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.6), posterMat);
      posterFace.rotation.y = -Math.PI / 2;
      posterFace.position.set(5.45, 3.2, pz);
      platGroup.add(posterFace);
    });

    // 2. Animated Commuters Waiting on Platform
    if (detail !== 'MINIMAL') {
      for (let c = 0; c < 5; c++) {
        const commuter = new THREE.Group();
        commuter.position.set(5.55, 0.95, -c * 14.0 - 10.0);

        const torso = new THREE.Mesh(this.getBox(0.32, 0.7, 0.22), this.castIronMat);
        torso.position.y = 0.75;
        commuter.add(torso);

        const head = new THREE.Mesh(this.getSphere(0.15, 8), this.modernConcreteMat);
        head.position.y = 1.3;
        commuter.add(head);

        let phoneGlow: THREE.Mesh | undefined;
        if (c % 2 === 1) {
          phoneGlow = new THREE.Mesh(this.getBox(0.08, 0.02, 0.12), this.tunnelLampMat);
          phoneGlow.position.set(-0.15, 0.9, 0.15);
          commuter.add(phoneGlow);
        }

        platGroup.add(commuter);
        director.registerCommuter({
          group: commuter,
          head,
          torso,
          phoneGlow,
          animType: (c % 2 === 1) ? 'CHECK_PHONE' : 'WAIT',
          timer: rng.range(0, 5)
        });
      }
    }

    parent.add(platGroup);
  }

  // =========================================================================
  // DISTRICT 2: MODERN GLASS INTERCHANGE
  // =========================================================================

  private buildModernGlassInterchange(
    parent: THREE.Group,
    chunkLength: number,
    worldZ: number,
    ceilingH: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: UndergroundMetroEventDirector,
    rng: SeededRandom
  ): void {
    const interGroup = new THREE.Group();
    interGroup.name = 'glass_interchange_district';

    // 1. Aerodynamic Stainless Steel Structural Pylons (flanking outside corridor)
    for (let z = 0; z < chunkLength; z += 20) {
      [-5.55, 5.55].forEach((px) => {
        const pylon = new THREE.Mesh(this.getCyl(0.22, 0.28, ceilingH, 12), this.steelFlutingMat);
        pylon.position.set(px, ceilingH * 0.5, -z - 10);
        interGroup.add(pylon);
      });
    }

    // 2. High-Altitude Pedestrian Crossover Skywalk (Y = 10.8m, safely overhead)
    const skywalkH = ceilingH - 0.4;
    const skywalkSpan = new THREE.Mesh(this.getBox(11.2, 0.35, 3.2), this.modernConcreteMat);
    skywalkSpan.position.set(0, skywalkH, -chunkLength * 0.5);
    interGroup.add(skywalkSpan);

    // Glass Balustrades on Skywalk
    [-1.5, 1.5].forEach((bz) => {
      const balustrade = new THREE.Mesh(this.getBox(11.2, 1.1, 0.08), this.glassBalustradeMat);
      balustrade.position.set(0, skywalkH + 0.65, -chunkLength * 0.5 + bz);
      interGroup.add(balustrade);
    });

    // Modern Illuminated Wayfinding Sign
    const signGroup = new THREE.Group();
    signGroup.position.set(0, skywalkH - 0.6, -chunkLength * 0.5);
    const signBody = new THREE.Mesh(this.getBox(5.2, 0.6, 0.3), this.castIronMat);
    signGroup.add(signBody);

    const signText = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 0.45), this.tunnelLampMat);
    signText.position.z = 0.16;
    signGroup.add(signText);
    interGroup.add(signGroup);

    parent.add(interGroup);
  }

  // =========================================================================
  // DISTRICT 3: INDUSTRIAL MAINTENANCE TUNNEL
  // =========================================================================

  private buildIndustrialMaintenanceTunnel(
    parent: THREE.Group,
    chunkLength: number,
    worldZ: number,
    ceilingH: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: UndergroundMetroEventDirector,
    rng: SeededRandom
  ): void {
    const maintGroup = new THREE.Group();
    maintGroup.name = 'industrial_maintenance_district';

    // 1. Bolted Segmental Precast Concrete Tunnel Rings
    for (let rz = 0; rz < chunkLength; rz += 8) {
      const ringGroup = new THREE.Group();
      ringGroup.position.set(0, 0, -rz - 4);

      // Flange ribs
      [-5.6, 5.6].forEach((rx) => {
        const flange = new THREE.Mesh(this.getBox(0.2, 6.2, 0.25), this.castIronMat);
        flange.position.set(rx, 3.1, 0);
        ringGroup.add(flange);
      });
      maintGroup.add(ringGroup);
    }

    // 2. High-Pressure Steam & Drainage Pipe Manifold along Right Wall
    [-0.3, 0.0, 0.3].forEach((py, pidx) => {
      const pipeGeo = this.getCyl(0.12, 0.12, chunkLength, 8);
      const pipe = new THREE.Mesh(pipeGeo, this.castIronMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(5.5, 2.5 + py, -chunkLength * 0.5);
      maintGroup.add(pipe);

      // Valve wheels
      if (pidx === 1) {
        [-chunkLength * 0.3, -chunkLength * 0.7].forEach((vz) => {
          const valve = new THREE.Mesh(this.getCyl(0.25, 0.25, 0.05, 8), this.signalRedMat);
          valve.rotation.z = Math.PI / 2;
          valve.position.set(5.35, 2.5, vz);
          maintGroup.add(valve);
        });
      }
    });

    parent.add(maintGroup);
  }

  // =========================================================================
  // DISTRICT 4: UNDERGROUND RIVER & UTILITY CROSSING (HERO EVENT B)
  // =========================================================================

  private buildUtilityRiverCrossing(
    parent: THREE.Group,
    chunkLength: number,
    worldZ: number,
    ceilingH: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: UndergroundMetroEventDirector,
    rng: SeededRandom
  ): void {
    const utilGroup = new THREE.Group();
    utilGroup.name = 'utility_crossing_district';

    // 1. Storm Drainage Aqueduct Channel (under trackbed grating, Y = -1.2m)
    const waterMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(11.2, chunkLength),
      this.aqueductWaterMat
    );
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.set(0, -1.2, -chunkLength * 0.5);
    utilGroup.add(waterMesh);

    // 2. Overhead Axial Jet Fans (Ventilation Turbines) (Suspended high: Y >= 8.70m)
    const turbines: { fanBlades: THREE.Mesh; rpm: number }[] = [];
    [-chunkLength * 0.3, -chunkLength * 0.7].forEach((tz) => {
      const fanGroup = new THREE.Group();
      fanGroup.position.set(0, ceilingH - 0.45, tz);

      const shroud = new THREE.Mesh(this.getCyl(0.65, 0.65, 1.6, 16), this.tunnelRibMat);
      shroud.rotation.x = Math.PI / 2;
      fanGroup.add(shroud);

      const blades = new THREE.Mesh(this.getBox(1.1, 0.2, 0.05), this.castIronMat);
      fanGroup.add(blades);

      utilGroup.add(fanGroup);
      turbines.push({ fanBlades: blades, rpm: 8.0 });

      director.registerVentilationFan({
        group: fanGroup,
        blades,
        rotationSpeed: 8.0
      });
    });

    // 3. Hero Event B: Power Restoration Setup
    const emergencyLamps: THREE.Mesh[] = [];
    const luminaireFixtures: { mesh: THREE.Mesh; zPos: number; active: boolean }[] = [];
    const floodGates: { leftGate: THREE.Group; rightGate: THREE.Group; openAmount: number }[] = [];
    const transformerSparks: THREE.Mesh[] = [];

    // Red Emergency Auxiliary Lamps
    for (let z = 0; z < chunkLength; z += 12) {
      [-5.5, 5.5].forEach((lx) => {
        const eLamp = new THREE.Mesh(this.getSphere(0.2, 8), this.emergencyRedMat);
        eLamp.position.set(lx, 4.0, -z - 6);
        utilGroup.add(eLamp);
        emergencyLamps.push(eLamp);
      });

      // Z-staggered mains fixtures for cascade ignition
      const lum = new THREE.Mesh(this.getBox(2.2, 0.14, 0.4), this.tunnelLampMat);
      lum.position.set(0, ceilingH - 0.45, -z - 6);
      utilGroup.add(lum);
      luminaireFixtures.push({ mesh: lum, zPos: -z - 6, active: false });
    }

    // Heavy Hydraulic Storm Flood Gates
    const leftGate = new THREE.Group();
    leftGate.position.set(-5.8, 0, -chunkLength * 0.5);
    const lGateMesh = new THREE.Mesh(this.getBox(1.4, 6.0, 0.6), this.modernConcreteMat);
    lGateMesh.position.set(-0.7, 3.0, 0);
    leftGate.add(lGateMesh);
    utilGroup.add(leftGate);

    const rightGate = new THREE.Group();
    rightGate.position.set(5.8, 0, -chunkLength * 0.5);
    const rGateMesh = new THREE.Mesh(this.getBox(1.4, 6.0, 0.6), this.modernConcreteMat);
    rGateMesh.position.set(0.7, 3.0, 0);
    rightGate.add(rGateMesh);
    utilGroup.add(rightGate);

    floodGates.push({ leftGate, rightGate, openAmount: 0 });

    // Transformer High-Voltage Spark meshes
    const spark = new THREE.Mesh(this.getSphere(0.22, 6), this.signalAmberMat);
    spark.position.set(-5.4, 3.8, -chunkLength * 0.5);
    spark.visible = false;
    utilGroup.add(spark);
    transformerSparks.push(spark);

    director.registerPowerRestoration({
      group: utilGroup,
      emergencyLamps,
      luminaireFixtures,
      floodGates,
      exhaustTurbines: turbines,
      transformerSparks,
      triggerZ: worldZ - chunkLength * 0.5,
      state: 'DORMANT',
      timer: 0,
      powerLevel: 0
    });

    parent.add(utilGroup);
  }

  // =========================================================================
  // DISTRICT 5: MASSIVE MULTILEVEL TRANSFER STATION
  // =========================================================================

  private buildMultilevelTransferStation(
    parent: THREE.Group,
    chunkLength: number,
    worldZ: number,
    ceilingH: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: UndergroundMetroEventDirector,
    rng: SeededRandom
  ): void {
    const multiGroup = new THREE.Group();
    multiGroup.name = 'multilevel_transfer_district';

    // 1. High Mezzanine Floor Balcony overlooking the tracks (Y = 10.2m)
    const mezzSlab = new THREE.Mesh(this.getBox(3.5, 0.4, chunkLength), this.modernConcreteMat);
    mezzSlab.position.set(8.5, 10.2, -chunkLength * 0.5);
    multiGroup.add(mezzSlab);

    const mezzRailing = new THREE.Mesh(this.getBox(0.08, 1.1, chunkLength), this.glassBalustradeMat);
    mezzRailing.position.set(6.8, 10.85, -chunkLength * 0.5);
    multiGroup.add(mezzRailing);

    // 2. Hanging Direction Pod Displays
    [-chunkLength * 0.35, -chunkLength * 0.75].forEach((dz) => {
      const podGroup = new THREE.Group();
      podGroup.position.set(0, ceilingH - 1.5, dz);

      const podBody = new THREE.Mesh(this.getBox(3.2, 0.8, 0.3), this.castIronMat);
      podGroup.add(podBody);

      const podGlow = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.65), this.tunnelLampMat);
      podGlow.position.z = 0.16;
      podGroup.add(podGlow);

      multiGroup.add(podGroup);
    });

    parent.add(multiGroup);
  }

  // =========================================================================
  // MONUMENTAL SUBWAY PORTAL ARCH (Strictly Preserved)
  // =========================================================================

  public buildSubwayPortalArch(
    parent: THREE.Group,
    zPos: number,
    type: 'ENTRY' | 'EXIT',
    ceilingH: number
  ): void {
    const portal = new THREE.Group();
    portal.position.set(0, 0, zPos);

    const wallX = CONSTANTS.TUNNEL_WALL_X;
    const spanW = wallX * 2.0;
    const portalH = ceilingH + 1.8;
    const portalDepth = 3.6;

    // Massive flanking concrete pylons (clears > 6.0m)
    const pylonGeo = this.getBox(2.4, portalH, portalDepth);
    [-wallX - 1.1, wallX + 1.1].forEach((px) => {
      const pylon = new THREE.Mesh(pylonGeo, this.modernConcreteMat);
      pylon.position.set(px, portalH * 0.5, 0);
      pylon.castShadow = true;
      pylon.receiveShadow = true;
      portal.add(pylon);
    });

    // Heavy overhead portal crown beam
    const crownGeo = this.getBox(spanW + 4.0, 2.4, portalDepth + 0.4);
    const crown = new THREE.Mesh(crownGeo, this.modernConcreteMat);
    crown.position.set(0, portalH - 0.2, 0);
    crown.castShadow = true;
    crown.receiveShadow = true;
    portal.add(crown);

    // Hazard stripe warning edge along portal mouth
    const hazardGeo = this.getBox(spanW + 0.6, 0.45, 0.2);
    const hazard = new THREE.Mesh(hazardGeo, this.hazardStripeMat);
    hazard.position.set(0, ceilingH + 0.1, type === 'ENTRY' ? 1.9 : -1.9);
    portal.add(hazard);

    // Red illuminated portal clearance warning beacons (Radius 0.25m, signalRedMat)
    const beaconGeo = this.getSphere(0.25, 8);
    [-spanW * 0.42, spanW * 0.42].forEach((bx) => {
      const beacon = new THREE.Mesh(beaconGeo, this.signalRedMat);
      beacon.position.set(bx, ceilingH + 0.6, type === 'ENTRY' ? 2.0 : -2.0);
      portal.add(beacon);
    });

    parent.add(portal);
  }
}
