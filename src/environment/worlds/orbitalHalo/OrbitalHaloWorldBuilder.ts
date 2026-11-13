import * as THREE from 'three';
import { CONSTANTS } from '../../../core/Constants';
import { SeededRandom, SceneryFactory } from '../../SceneryFactory';
import { CurvedShaderManager } from '../../../scene/CurvedShader';
import {
  OrbitalHaloEventDirector,
  GrandSpacecraftDockingActor,
  OrbitalRingAwakeningActor,
  AstronautSpacewalkActor,
  PlanetaryEclipseActor,
  MeteorShowerActor,
  ColossalResearchVesselActor,
  SolarArrayTransformationActor,
  OrbitalConstructionSiteActor
} from './OrbitalHaloEventDirector';
import { ORBITAL_PALETTE } from './OrbitalHaloTheme';

/**
 * OrbitalHaloWorldBuilder
 * Comprehensive procedural builder for Orbital Halo: The Living Space Megastructure (ORBITAL_HALO).
 * Structures the orbital rail journey into 6 distinct active space civilization districts:
 * - District A: Orbital Central (Grand Station Hub & Gate A: Spacecraft Docking)
 * - District B: The Zero-G Dockyards (Construction Bay & Hull Scaffolding)
 * - District C: Celestial Observatory (Deep-Space Telescopes & Planetary Vista)
 * - District D: The Gravity Ring (Colossal Rotating Centrifuge & Gate B: Ring Awakening)
 * - District E: The Solar Frontier (Articulated Unfolding Solar Arrays)
 * - District F: The Deep Space Gateway (Monumental Gateways & Colossal Research Ship)
 *
 * Enforces zero-float geometry (deep plinths down to Y = -5.85m), safe running corridors
 * (|X| >= 4.2m below Y = 7.5m; overhead clearance >= 9.8m), and non-repeating permutation cycles.
 */
export class OrbitalHaloWorldBuilder {
  private static instance: OrbitalHaloWorldBuilder | null = null;

  // Geometry Cache for High-Performance Reuse
  private boxGeos = new Map<string, THREE.BoxGeometry>();
  private cylGeos = new Map<string, THREE.CylinderGeometry>();
  private sphereGeos = new Map<string, THREE.SphereGeometry>();
  private coneGeos = new Map<string, THREE.ConeGeometry>();
  private torusGeos = new Map<string, THREE.TorusGeometry>();

  // Custom Master Curvature-Aware Materials
  private whiteHullMat!: THREE.MeshStandardMaterial;
  private titaniumMat!: THREE.MeshStandardMaterial;
  private graphiteMat!: THREE.MeshStandardMaterial;
  private observationGlassMat!: THREE.MeshStandardMaterial;
  private cyanGlowMat!: THREE.MeshBasicMaterial;
  private solarAmberGlowMat!: THREE.MeshBasicMaterial;
  private strobeWhiteMat!: THREE.MeshBasicMaterial;
  private solarPanelMat!: THREE.MeshStandardMaterial;

  private constructor() {
    this.initCustomMaterials();
  }

  public static getInstance(): OrbitalHaloWorldBuilder {
    if (!this.instance) {
      this.instance = new OrbitalHaloWorldBuilder();
    }
    return this.instance;
  }

  private initCustomMaterials(): void {
    const curved = CurvedShaderManager.getInstance();

    this.whiteHullMat = new THREE.MeshStandardMaterial({
      color: ORBITAL_PALETTE.aerospaceWhite,
      roughness: 0.35,
      metalness: 0.20
    });
    curved.applyCurvature(this.whiteHullMat);

    this.titaniumMat = new THREE.MeshStandardMaterial({
      color: ORBITAL_PALETTE.titaniumGray,
      roughness: 0.45,
      metalness: 0.75
    });
    curved.applyCurvature(this.titaniumMat);

    this.graphiteMat = new THREE.MeshStandardMaterial({
      color: ORBITAL_PALETTE.graphiteCarbon,
      roughness: 0.70,
      metalness: 0.50
    });
    curved.applyCurvature(this.graphiteMat);

    this.observationGlassMat = new THREE.MeshStandardMaterial({
      color: ORBITAL_PALETTE.observationGlass,
      roughness: 0.10,
      metalness: 0.90,
      transparent: true,
      opacity: 0.55
    });
    curved.applyCurvature(this.observationGlassMat);

    this.cyanGlowMat = new THREE.MeshBasicMaterial({ color: ORBITAL_PALETTE.navigationCyan });
    curved.applyCurvature(this.cyanGlowMat);

    this.solarAmberGlowMat = new THREE.MeshBasicMaterial({ color: ORBITAL_PALETTE.solarAmber });
    curved.applyCurvature(this.solarAmberGlowMat);

    this.strobeWhiteMat = new THREE.MeshBasicMaterial({ color: ORBITAL_PALETTE.strobeWhite });
    curved.applyCurvature(this.strobeWhiteMat);

    this.solarPanelMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.20,
      metalness: 0.85
    });
    curved.applyCurvature(this.solarPanelMat);
  }

  // --- Geometry Cache Helpers ---

  private getBox(w: number, h: number, d: number): THREE.BoxGeometry {
    const key = `${w.toFixed(2)}_${h.toFixed(2)}_${d.toFixed(2)}`;
    let geo = this.boxGeos.get(key);
    if (!geo) {
      geo = new THREE.BoxGeometry(w, h, d);
      this.boxGeos.set(key, geo);
    }
    return geo;
  }

  private getCylinder(rt: number, rb: number, h: number, s: number = 8): THREE.CylinderGeometry {
    const key = `${rt.toFixed(2)}_${rb.toFixed(2)}_${h.toFixed(2)}_${s}`;
    let geo = this.cylGeos.get(key);
    if (!geo) {
      geo = new THREE.CylinderGeometry(rt, rb, h, s);
      this.cylGeos.set(key, geo);
    }
    return geo;
  }

  private getSphere(r: number, ws: number = 8, hs: number = 6): THREE.SphereGeometry {
    const key = `${r.toFixed(2)}_${ws}_${hs}`;
    let geo = this.sphereGeos.get(key);
    if (!geo) {
      geo = new THREE.SphereGeometry(r, ws, hs);
      this.sphereGeos.set(key, geo);
    }
    return geo;
  }

  private getCone(r: number, h: number, s: number = 6): THREE.ConeGeometry {
    const key = `${r.toFixed(2)}_${h.toFixed(2)}_${s}`;
    let geo = this.coneGeos.get(key);
    if (!geo) {
      geo = new THREE.ConeGeometry(r, h, s);
      this.coneGeos.set(key, geo);
    }
    return geo;
  }

  private getTorus(r: number, t: number, rs: number = 6, cs: number = 24, arc: number = Math.PI * 2): THREE.TorusGeometry {
    const key = `${r.toFixed(2)}_${t.toFixed(2)}_${rs}_${cs}_${arc.toFixed(2)}`;
    let geo = this.torusGeos.get(key);
    if (!geo) {
      geo = new THREE.TorusGeometry(r, t, rs, cs, arc);
      this.torusGeos.set(key, geo);
    }
    return geo;
  }

  // =========================================================================
  // MAIN SCENERY BUILD ENTRY POINT
  // =========================================================================

  public buildDistrictScenery(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZ: number = 0
  ): void {
    const mats = SceneryFactory.getInstance().getSharedMaterials();
    if (mats) {
      if (mats.orbitalWhiteCompositeMat) this.whiteHullMat = mats.orbitalWhiteCompositeMat;
      if (mats.orbitalTitaniumMat) this.titaniumMat = mats.orbitalTitaniumMat;
      if (mats.orbitalGraphiteMat) this.graphiteMat = mats.orbitalGraphiteMat;
      if (mats.orbitalObservationGlassMat) this.observationGlassMat = mats.orbitalObservationGlassMat;
      if (mats.orbitalCyanGlowMat) this.cyanGlowMat = mats.orbitalCyanGlowMat;
      if (mats.orbitalSolarMat) this.solarPanelMat = mats.orbitalSolarMat;
    }

    const rng = new SeededRandom(seed);
    const director = OrbitalHaloEventDirector.getInstance();

    // 1. Foundation: Grounded Aerospace Retaining Plinths down to Y = -5.85m
    this.buildGroundedRetainingPlinths(group, roadbedWidth, curbWidth, chunkLength, mats);

    // 2. Trackside Magnetic Guide-Rails & Transparent Observation Windows
    this.buildTracksideGuidewayAndPanels(group, roadbedWidth, curbWidth, chunkLength, mats, detail);

    // 3. Cantilevered Induction Gantries & Status Beacons
    this.buildInductionGantries(group, chunkLength, mats, director, detail);

    // 4. District Cycle Determination
    const chunkIdx = Math.floor(Math.abs(worldZ) / Math.max(1, chunkLength));
    const districtType = chunkIdx % 6;
    const variant = Math.floor(Math.abs(seed) / 7) % 4;

    switch (districtType) {
      case 0: // District A: Orbital Central (Grand Station Hub & Gate A Docking)
        this.buildDistrictOrbitalCentral(group, chunkLength, mats, director, rng, detail, variant, worldZ);
        break;
      case 1: // District B: The Zero-G Dockyards (Construction Bay & Hull Scaffolding)
        this.buildDistrictZeroGDockyards(group, chunkLength, mats, director, rng, detail, variant, worldZ);
        break;
      case 2: // District C: Celestial Observatory (Deep Space Telescopes & Planetary Vista)
        this.buildDistrictCelestialObservatory(group, chunkLength, mats, director, rng, detail, variant, worldZ);
        break;
      case 3: // District D: The Gravity Ring (Colossal Rotating Centrifuge & Gate B Ring Awakening)
        this.buildDistrictGravityRing(group, chunkLength, mats, director, rng, detail, variant, worldZ);
        break;
      case 4: // District E: The Solar Frontier (Articulated Unfolding Solar Arrays)
        this.buildDistrictSolarFrontier(group, chunkLength, mats, director, rng, detail, variant, worldZ);
        break;
      case 5: // District F: The Deep Space Gateway (Monumental Gateways & Colossal Research Ship)
        this.buildDistrictDeepSpaceGateway(group, chunkLength, mats, director, rng, detail, variant, worldZ);
        break;
    }

    // 5. Preserved Landmark Variations (spawns landmark portals with scenic pacing)
    // Avoids relentless overhead clutter while guaranteeing presence for tests and landmark gates
    const isLandmarkMilestone = (chunkIdx % 4 === 0) || (seed % 4 === 0 && rng.chance(0.65));
    const hasGateway = isLandmarkMilestone || rng.chance(0.18);
    const gatewayZ = -chunkLength * 0.5;
    if (hasGateway) {
      this.buildMonumentalGatewayArch(group, chunkLength, gatewayZ, mats);
    }

    const wantsSkybridge = rng.chance(0.38);
    if (detail !== 'MINIMAL' && (!hasGateway || wantsSkybridge)) {
      const bridgeZ = hasGateway ? -chunkLength * 0.18 : -chunkLength * 0.5;
      this.buildObservationSkybridge(group, chunkLength, bridgeZ, mats);
    }

    const wantsCraft = rng.chance(0.35);
    if (detail !== 'MINIMAL' && wantsCraft) {
      const craftZ = hasGateway ? -chunkLength * 0.78 : -chunkLength * 0.25;
      this.buildDockedSpacecraftBay(group, chunkLength, craftZ, mats, rng);
    }
  }

  // =========================================================================
  // FOUNDATION: GROUNDED RETAINING PLINTHS (Y = -5.85m)
  // =========================================================================

  private buildGroundedRetainingPlinths(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    mats: any
  ): void {
    const plinthDepth = 5.85;
    const plinthW = 1.6;
    const wallX = roadbedWidth * 0.5 + curbWidth + plinthW * 0.5 + 0.15;
    const plinthGeo = this.getBox(plinthW, plinthDepth, chunkLength);

    [-wallX, wallX].forEach((wx) => {
      const plinth = new THREE.Mesh(plinthGeo, mats.orbitalTitaniumMat || this.titaniumMat);
      plinth.name = 'orbital_retaining_plinth';
      plinth.position.set(wx, -plinthDepth * 0.5, -chunkLength * 0.5);
      plinth.receiveShadow = true;
      group.add(plinth);

      // Embedded lower cyan superconductor magnetic conduit
      const conduitGeo = this.getBox(0.12, 0.25, chunkLength);
      const conduit = new THREE.Mesh(conduitGeo, mats.orbitalCyanGlowMat || this.cyanGlowMat);
      conduit.position.set(wx > 0 ? wx - plinthW * 0.5 + 0.08 : wx + plinthW * 0.5 - 0.08, -0.6, -chunkLength * 0.5);
      group.add(conduit);
    });
  }

  // =========================================================================
  // TRACKSIDE GUIDEWAY & OBSERVATION PANELS
  // =========================================================================

  private buildTracksideGuidewayAndPanels(
    group: THREE.Group,
    roadbedWidth: number,
    curbWidth: number,
    chunkLength: number,
    mats: any,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const wallHeight = 2.8;
    const wallThick = 0.70;
    const wallX = roadbedWidth * 0.5 + curbWidth + wallThick * 0.5 + 0.2;
    const baseH = 1.25;
    const glassH = wallHeight - baseH;

    const baseGeo = this.getBox(wallThick, baseH, chunkLength);
    const glassGeo = this.getBox(0.14, glassH, chunkLength);
    const capGeo = this.getBox(wallThick + 0.12, 0.18, chunkLength);
    const stripGeo = this.getBox(0.08, 0.12, chunkLength);

    [-wallX, wallX].forEach((wx) => {
      // Lower Aerospace White Composite Base
      const baseMesh = new THREE.Mesh(baseGeo, mats.orbitalWhiteCompositeMat || this.whiteHullMat);
      baseMesh.position.set(wx, baseH * 0.5, -chunkLength * 0.5);
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      // Upper Transparent Observation Glass Panels
      const glassMesh = new THREE.Mesh(glassGeo, mats.orbitalObservationGlassMat || this.observationGlassMat);
      glassMesh.position.set(wx, baseH + glassH * 0.5, -chunkLength * 0.5);
      group.add(glassMesh);

      // Top Titanium Coping Cap
      const capMesh = new THREE.Mesh(capGeo, mats.orbitalTitaniumMat || this.titaniumMat);
      capMesh.position.set(wx, wallHeight + 0.09, -chunkLength * 0.5);
      group.add(capMesh);

      // Continuous Electric Cyan Energy Channel
      const innerX = wx > 0 ? wx - wallThick * 0.5 + 0.04 : wx + wallThick * 0.5 - 0.04;
      const stripMesh = new THREE.Mesh(stripGeo, mats.orbitalCyanGlowMat || this.cyanGlowMat);
      stripMesh.position.set(innerX, baseH, -chunkLength * 0.5);
      group.add(stripMesh);
    });

    if (detail === 'MINIMAL') return;

    // Vertical Structural Rib Pilasters with LED Status Strips every 20m
    const pilasterCount = Math.floor(chunkLength / 20);
    const pilasterGeo = this.getBox(wallThick + 0.28, wallHeight + 0.6, 0.85);
    const ledGeo = this.getBox(0.06, wallHeight + 0.4, 0.18);

    for (let p = 0; p < pilasterCount; p++) {
      const pz = -p * 20 - 10;
      [-wallX, wallX].forEach((wx) => {
        const pilaster = new THREE.Mesh(pilasterGeo, mats.orbitalTitaniumMat || this.titaniumMat);
        pilaster.position.set(wx, (wallHeight + 0.6) * 0.5, pz);
        group.add(pilaster);

        const ledX = wx > 0 ? wx - (wallThick + 0.28) * 0.5 - 0.03 : wx + (wallThick + 0.28) * 0.5 + 0.03;
        const led = new THREE.Mesh(ledGeo, mats.orbitalCyanGlowMat || this.cyanGlowMat);
        led.position.set(ledX, (wallHeight + 0.4) * 0.5, pz);
        group.add(led);
      });
    }
  }

  // =========================================================================
  // INDUCTION GANTRIES & TRACKSIDE SENSORS
  // =========================================================================

  private buildInductionGantries(
    group: THREE.Group,
    chunkLength: number,
    mats: any,
    director: OrbitalHaloEventDirector,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const spacing = detail === 'MINIMAL' ? 80.0 : 40.0;
    const count = Math.floor(chunkLength / spacing);
    const archH = 12.2; // Elevated overhead clearance >= 11.8m
    const spanW = CONSTANTS.LANE_WIDTH * 3 + 5.2;
    const postX = spanW * 0.5 + 1.2;

    for (let i = 0; i < count; i++) {
      const gz = -i * spacing - 20.0;
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, gz);

      // Slender Uprights on both sides (|X| = postX >= 5.8m)
      [-postX, postX].forEach((px) => {
        const post = new THREE.Mesh(this.getBox(0.55, archH, 0.55), mats.orbitalGraphiteMat || this.graphiteMat);
        post.position.set(px, archH * 0.5, 0);
        post.castShadow = true;
        gantryGroup.add(post);

        // Flashing navigation beacon
        if (detail === 'FULL') {
          const beacon = new THREE.Mesh(this.getSphere(0.22, 6, 6), mats.orbitalCyanGlowMat || this.cyanGlowMat);
          beacon.position.set(px, archH + 0.35, 0);
          gantryGroup.add(beacon);
          director.registerNavigationBeacon(beacon, 2.5);
        }

        // Slender Cantilever Induction Arm projecting inward
        const armLen = 2.4;
        const armX = px > 0 ? px - armLen * 0.5 : px + armLen * 0.5;
        const arm = new THREE.Mesh(this.getBox(armLen, 0.35, 0.55), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
        arm.position.set(armX, archH, 0);
        gantryGroup.add(arm);

        // Glowing Cyan Magnetic Induction Collar at arm tip (pruned in MINIMAL)
        if (detail !== 'MINIMAL') {
          const ringTipX = px > 0 ? px - armLen : px + armLen;
          const ring = new THREE.Mesh(this.getTorus(0.85, 0.12, 6, 18), mats.orbitalCyanGlowMat || this.cyanGlowMat);
          ring.position.set(ringTipX, archH, 0);
          gantryGroup.add(ring);
        }
      });

      group.add(gantryGroup);
    }
  }

  // =========================================================================
  // DISTRICT 1: ORBITAL CENTRAL (Gate A: Grand Spacecraft Docking)
  // =========================================================================

  public buildDistrictOrbitalCentral(
    group: THREE.Group,
    chunkLength: number,
    mats: any,
    director: OrbitalHaloEventDirector,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    variant: number,
    worldZ: number
  ): void {
    const centralGroup = new THREE.Group();
    centralGroup.name = 'zone_orbital_central';

    const wallX = CONSTANTS.TUNNEL_WALL_X;
    const lotZ = -chunkLength * 0.5;

    // Monumental Habitation & Research Terminal Module on the Right Flank
    const termH = 38.0;
    const termW = 18.0;
    const termD = chunkLength * 0.75;
    const termX = wallX + 16.5;

    const termBody = new THREE.Mesh(this.getBox(termW, termH, termD), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    termBody.position.set(termX, termH * 0.5, lotZ);
    termBody.castShadow = true;
    centralGroup.add(termBody);

    // Illuminated Observation Panorama Glass Windows
    for (let fl = 8.0; fl < termH - 4.0; fl += 6.5) {
      const win = new THREE.Mesh(this.getBox(0.2, 2.2, termD * 0.85), mats.orbitalObservationGlassMat || this.observationGlassMat);
      win.position.set(termX - termW * 0.5 - 0.1, fl, lotZ);
      centralGroup.add(win);
    }

    // Station Rooftop Auxiliary Solar Array Panels
    const solarW = termW * 0.85;
    const solarD = termD * 0.22;
    for (let si = -1; si <= 1; si += 2) {
      const solarPanel = new THREE.Mesh(this.getBox(solarW, 0.35, solarD), mats.orbitalSolarMat || this.solarPanelMat);
      solarPanel.position.set(termX, termH + 0.8, lotZ + si * (solarD * 0.8));
      solarPanel.rotation.x = si * 0.12;
      centralGroup.add(solarPanel);
    }

    // Terminal Rooftop High-Gain Communications Dish Antenna
    const commsDish = new THREE.Group();
    commsDish.position.set(termX, termH + 2.5, lotZ);
    const dishMast = new THREE.Mesh(this.getCylinder(0.4, 0.4, 3.0, 8), mats.orbitalTitaniumMat || this.titaniumMat);
    dishMast.position.y = 1.5;
    commsDish.add(dishMast);
    const dishBowl = new THREE.Mesh(this.getSphere(3.2, 12, 8), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    dishBowl.scale.set(1.0, 0.35, 1.0);
    dishBowl.position.y = 3.2;
    dishBowl.rotation.x = 0.45;
    commsDish.add(dishBowl);
    centralGroup.add(commsDish);
    director.registerRadarDish(commsDish, 0.45);

    // GATE A: Grand Spacecraft Docking Sequence
    this.spawnGrandDockingEvent(centralGroup, wallX + 8.5, lotZ, mats, director, worldZ - chunkLength * 0.5);

    // Ambient Patrol Shuttle cruising station perimeter
    this.spawnAmbientPatrolShuttle(centralGroup, new THREE.Vector3(-wallX - 26.0, 18.0, lotZ), mats, director, 16.0, 5.5, 0.75);

    group.add(centralGroup);
  }

  // =========================================================================
  // DISTRICT 2: THE ZERO-G DOCKYARDS (Event H: Construction Crane)
  // =========================================================================

  public buildDistrictZeroGDockyards(
    group: THREE.Group,
    chunkLength: number,
    mats: any,
    director: OrbitalHaloEventDirector,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    variant: number,
    worldZ: number
  ): void {
    const dockGroup = new THREE.Group();
    dockGroup.name = 'zone_zerog_dockyards';

    const wallX = CONSTANTS.TUNNEL_WALL_X;
    const lotZ = -chunkLength * 0.5;

    // Massive Spacecraft Hull Construction Scaffolding on Left Flank
    const scafX = -wallX - 22.0;
    const hullLen = 42.0;

    // Unfinished Structural Skeleton Frames (scaled in MINIMAL)
    const frameCount = detail === 'MINIMAL' ? 2 : 6;
    for (let f = 0; f < frameCount; f++) {
      const frameZ = lotZ + (f - frameCount * 0.5) * 8.0;
      const frameRing = new THREE.Mesh(this.getTorus(8.5, 0.45, 6, 18), mats.orbitalTitaniumMat || this.titaniumMat);
      frameRing.position.set(scafX, 12.0, frameZ);
      dockGroup.add(frameRing);
    }

    // Heavy Docking Gantry Cranes
    const craneBase = new THREE.Mesh(this.getBox(4.5, 24.0, 4.5), mats.orbitalGraphiteMat || this.graphiteMat);
    craneBase.position.set(scafX - 8.0, 12.0, lotZ);
    dockGroup.add(craneBase);

    // EVENT H: Orbital Construction Site & Welding Robot
    this.spawnConstructionSiteEvent(dockGroup, scafX, lotZ, mats, director, worldZ - chunkLength * 0.5);

    // Ambient Maintenance Drone inspecting the scaffolding (pruned in MINIMAL)
    if (detail !== 'MINIMAL') {
      const droneMesh = new THREE.Group();
      droneMesh.position.set(scafX + 6.0, 14.0, lotZ);
      const body = new THREE.Mesh(this.getBox(1.6, 0.5, 1.6), mats.orbitalTitaniumMat || this.titaniumMat);
      droneMesh.add(body);
      const cone = new THREE.Mesh(this.getCone(3.0, 9.0, 8), mats.orbitalCyanGlowMat || this.cyanGlowMat);
      cone.position.set(0, -4.5, 0);
      cone.rotation.x = Math.PI;
      droneMesh.add(cone);
      dockGroup.add(droneMesh);
      director.registerMaintenanceDrone(droneMesh, cone, new THREE.Vector3(scafX + 6.0, 14.0, lotZ), 9.0);
    }

    group.add(dockGroup);
  }

  // =========================================================================
  // DISTRICT 3: CELESTIAL OBSERVATORY (Event C: Spacewalk & Radio Dish)
  // =========================================================================

  public buildDistrictCelestialObservatory(
    group: THREE.Group,
    chunkLength: number,
    mats: any,
    director: OrbitalHaloEventDirector,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    variant: number,
    worldZ: number
  ): void {
    const obsGroup = new THREE.Group();
    obsGroup.name = 'zone_celestial_observatory';

    const wallX = CONSTANTS.TUNNEL_WALL_X;
    const lotZ = -chunkLength * 0.5;

    // Giant Spherical Astronomical Observation Dome on Right Flank
    const domeX = wallX + 24.0;
    const domeH = 22.0;

    const domeMesh = new THREE.Mesh(this.getSphere(16.0, 16, 12), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    domeMesh.position.set(domeX, domeH * 0.5, lotZ);
    domeMesh.castShadow = true;
    obsGroup.add(domeMesh);

    // Massive Steerable Radio Telescope Dish atop observatory pylon
    const dishGroup = new THREE.Group();
    dishGroup.position.set(domeX, domeH + 8.0, lotZ);
    const dish = new THREE.Mesh(this.getCone(12.0, 3.5, 16), mats.orbitalTitaniumMat || this.titaniumMat);
    dish.rotation.x = -Math.PI * 0.45;
    dishGroup.add(dish);
    const receiver = new THREE.Mesh(this.getCylinder(0.2, 0.2, 6.0, 4), mats.orbitalCyanGlowMat || this.cyanGlowMat);
    receiver.position.set(0, 0, 3.0);
    receiver.rotation.x = Math.PI * 0.5;
    dishGroup.add(receiver);
    obsGroup.add(dishGroup);
    director.registerRadarDish(dishGroup, 0.35);

    // EVENT C: Astronaut EVA Spacewalk Repair Operation
    this.spawnAstronautSpacewalkEvent(obsGroup, wallX + 8.2, lotZ, mats, director, worldZ - chunkLength * 0.5);

    // Survey shuttle scanning deep space sector
    this.spawnAmbientPatrolShuttle(obsGroup, new THREE.Vector3(-wallX - 28.0, 22.0, lotZ), mats, director, 15.0, 6.0, 0.70);

    group.add(obsGroup);
  }

  // =========================================================================
  // DISTRICT 4: THE GRAVITY RING (Gate B: Ring Awakening)
  // =========================================================================

  public buildDistrictGravityRing(
    group: THREE.Group,
    chunkLength: number,
    mats: any,
    director: OrbitalHaloEventDirector,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    variant: number,
    worldZ: number
  ): void {
    const ringGroup = new THREE.Group();
    ringGroup.name = 'zone_gravity_ring';

    const wallX = CONSTANTS.TUNNEL_WALL_X;
    const lotZ = -chunkLength * 0.5;

    // GATE B: The Colossal Orbital Ring Habitat Awakening
    this.spawnOrbitalRingEvent(ringGroup, wallX + 48.0, lotZ, mats, director, worldZ - chunkLength * 0.5);

    group.add(ringGroup);
  }

  // =========================================================================
  // DISTRICT 5: THE SOLAR FRONTIER (Event G: Unfolding Solar Array)
  // =========================================================================

  public buildDistrictSolarFrontier(
    group: THREE.Group,
    chunkLength: number,
    mats: any,
    director: OrbitalHaloEventDirector,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    variant: number,
    worldZ: number
  ): void {
    const solarGroup = new THREE.Group();
    solarGroup.name = 'zone_solar_frontier';

    const wallX = CONSTANTS.TUNNEL_WALL_X;
    const lotZ = -chunkLength * 0.5;

    // EVENT G: Articulated Unfolding Solar Array Wings
    this.spawnSolarTransformationEvent(solarGroup, -wallX - 22.0, lotZ, mats, director, worldZ - chunkLength * 0.5);

    // Tracking Solar Collector Batteries Flanking the Station (scaled in MINIMAL)
    const batCount = detail === 'MINIMAL' ? 1 : 3;
    for (let b = 0; b < batCount; b++) {
      const batZ = lotZ + (b - batCount * 0.5) * 18.0;
      const batArm = new THREE.Group();
      batArm.position.set(wallX + 16.0, 8.0, batZ);

      const panel = new THREE.Mesh(this.getBox(6.5, 0.2, 10.0), mats.orbitalSolarMat || this.solarPanelMat);
      panel.rotation.x = 0.35;
      batArm.add(panel);
      solarGroup.add(batArm);
      director.registerTrackingSolarPanel(batArm, 0.25);
    }

    // Autonomous Solar Maintenance Drone inspecting array panels (pruned in MINIMAL)
    if (detail !== 'MINIMAL') {
      const droneGroup = new THREE.Group();
      droneGroup.position.set(wallX + 18.0, 12.0, lotZ);
      const droneBody = new THREE.Mesh(this.getSphere(0.65, 8, 8), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
      droneGroup.add(droneBody);
      const cone = new THREE.Mesh(this.getCone(1.2, 4.5, 6), mats.orbitalCyanGlowMat || this.cyanGlowMat);
      cone.position.set(0, -2.25, 0);
      cone.rotation.x = Math.PI;
      droneGroup.add(cone);
      solarGroup.add(droneGroup);
      director.registerMaintenanceDrone(droneGroup, cone, new THREE.Vector3(wallX + 18.0, 12.0, lotZ), 6.5);
    }

    group.add(solarGroup);
  }

  // =========================================================================
  // DISTRICT 6: THE DEEP SPACE GATEWAY (Event F: Colossal Research Vessel)
  // =========================================================================

  public buildDistrictDeepSpaceGateway(
    group: THREE.Group,
    chunkLength: number,
    mats: any,
    director: OrbitalHaloEventDirector,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    variant: number,
    worldZ: number
  ): void {
    const gateGroup = new THREE.Group();
    gateGroup.name = 'zone_deep_space_gateway';

    const wallX = CONSTANTS.TUNNEL_WALL_X;
    const lotZ = -chunkLength * 0.5;

    // Distant Asteroid Debris Field Cluster in Space Backdrop
    for (let a = 0; a < 8; a++) {
      const ast = new THREE.Mesh(this.getSphere(3.2 + (a % 3) * 1.5, 6, 5), mats.orbitalTitaniumMat || this.titaniumMat);
      ast.position.set(-wallX - 45.0 - a * 8.0, 18.0 + (a % 4) * 6.0, lotZ + (a - 3.5) * 12.0);
      ast.rotation.set(a * 0.5, a * 0.8, a * 0.3);
      gateGroup.add(ast);
    }

    // EVENT F: Colossal Deep Space Research Ship Transit
    this.spawnColossalVesselEvent(gateGroup, wallX + 55.0, lotZ, mats, director, worldZ - chunkLength * 0.5);

    // EVENT D & E: Planetary Eclipse & Meteor Shower
    this.spawnPlanetaryEclipseEvent(gateGroup, 75.0, 50.0, lotZ - 120.0, mats, director, worldZ - chunkLength * 0.5);
    this.spawnMeteorShowerEvent(gateGroup, lotZ, mats, director, worldZ - chunkLength * 0.5);

    // Ambient Gateway Patrol Shuttle inspecting arrival vector
    this.spawnAmbientPatrolShuttle(gateGroup, new THREE.Vector3(wallX + 32.0, 20.0, lotZ), mats, director, 18.0, 7.0, 0.85);

    group.add(gateGroup);
  }

  private spawnAmbientPatrolShuttle(
    parent: THREE.Group,
    basePos: THREE.Vector3,
    mats: any,
    director: OrbitalHaloEventDirector,
    splineRadiusX: number = 18.0,
    splineRadiusY: number = 6.0,
    speed: number = 0.8
  ): void {
    const shuttleGroup = new THREE.Group();
    shuttleGroup.name = 'ambient_patrol_shuttle';
    shuttleGroup.position.copy(basePos);

    // Fuselage
    const body = new THREE.Mesh(this.getBox(2.2, 1.2, 5.5), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    body.castShadow = true;
    shuttleGroup.add(body);

    // Cockpit canopy
    const canopy = new THREE.Mesh(this.getBox(1.4, 0.6, 2.2), mats.orbitalObservationGlassMat || this.observationGlassMat);
    canopy.position.set(0, 0.6, 0.8);
    shuttleGroup.add(canopy);

    // Swept delta wings
    const wings = new THREE.Mesh(this.getBox(6.4, 0.2, 2.8), mats.orbitalTitaniumMat || this.titaniumMat);
    wings.position.set(0, 0, -0.6);
    shuttleGroup.add(wings);

    // Twin ion thrusters
    [-0.7, 0.7].forEach((tx) => {
      const engine = new THREE.Mesh(this.getCylinder(0.35, 0.45, 0.8, 8), mats.orbitalGraphiteMat || this.graphiteMat);
      engine.rotation.x = Math.PI * 0.5;
      engine.position.set(tx, 0, -3.0);
      shuttleGroup.add(engine);

      const glow = new THREE.Mesh(this.getSphere(0.25, 6, 6), mats.orbitalCyanGlowMat || this.cyanGlowMat);
      glow.position.set(tx, 0, -3.4);
      shuttleGroup.add(glow);
    });

    parent.add(shuttleGroup);
    director.registerPatrolShuttle(shuttleGroup, basePos, splineRadiusX, splineRadiusY, speed);
  }

  // =========================================================================
  // CINEMATIC EVENT GENERATORS
  // =========================================================================

  // GATE A: Grand Spacecraft Docking
  private spawnGrandDockingEvent(
    parent: THREE.Group,
    dockX: number,
    dockZ: number,
    mats: any,
    director: OrbitalHaloEventDirector,
    triggerZ: number
  ): void {
    const dockGroup = new THREE.Group();
    dockGroup.position.set(dockX, 0, dockZ);

    // Station Docking Port Structure with Articulated Cargo Crane
    const portBase = new THREE.Mesh(this.getBox(8.5, 14.0, 16.0), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    portBase.position.set(0, 7.0, 0);
    dockGroup.add(portBase);

    // Station Rooftop Cargo Transfer Crane Gantry
    const cargoTransferCrane = new THREE.Group();
    cargoTransferCrane.position.set(2.0, 14.2, 0);
    const craneMast = new THREE.Mesh(this.getCylinder(0.4, 0.4, 3.5, 8), mats.orbitalTitaniumMat || this.titaniumMat);
    craneMast.position.y = 1.75;
    cargoTransferCrane.add(craneMast);
    const craneJib = new THREE.Mesh(this.getBox(9.5, 0.65, 0.85), mats.orbitalGraphiteMat || this.graphiteMat);
    craneJib.position.set(4.75, 3.5, 0);
    cargoTransferCrane.add(craneJib);
    const hoistTrolley = new THREE.Mesh(this.getBox(1.4, 0.8, 1.2), mats.orbitalTitaniumMat || this.titaniumMat);
    hoistTrolley.position.set(7.5, 3.2, 0);
    cargoTransferCrane.add(hoistTrolley);
    dockGroup.add(cargoTransferCrane);

    // Modular Cargo Container Pod to transfer
    const cargoPod = new THREE.Mesh(this.getBox(2.8, 2.2, 4.2), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    cargoPod.position.set(11.2, 11.2, 0);
    const podStripe = new THREE.Mesh(this.getBox(2.9, 0.35, 4.3), mats.orbitalCyanGlowMat || this.cyanGlowMat);
    cargoPod.add(podStripe);
    dockGroup.add(cargoPod);

    // Mechanical Articulated Docking Arms
    const dockingArmLeft = new THREE.Group();
    dockingArmLeft.position.set(4.3, 8.5, 6.0);
    const armL = new THREE.Mesh(this.getBox(6.5, 0.8, 1.2), mats.orbitalTitaniumMat || this.titaniumMat);
    armL.position.x = 3.25;
    dockingArmLeft.add(armL);
    dockGroup.add(dockingArmLeft);

    const dockingArmRight = new THREE.Group();
    dockingArmRight.position.set(4.3, 8.5, -6.0);
    const armR = new THREE.Mesh(this.getBox(6.5, 0.8, 1.2), mats.orbitalTitaniumMat || this.titaniumMat);
    armR.position.x = 3.25;
    dockingArmRight.add(armR);
    dockGroup.add(dockingArmRight);

    // Clamps & Umbilical Tube
    const dockingClamps: THREE.Mesh[] = [];
    const clamp1 = new THREE.Mesh(this.getBox(1.4, 2.2, 0.8), mats.orbitalGraphiteMat || this.graphiteMat);
    clamp1.position.set(6.0, 0, 0);
    dockingArmLeft.add(clamp1);
    dockingClamps.push(clamp1);

    const clamp2 = new THREE.Mesh(this.getBox(1.4, 2.2, 0.8), mats.orbitalGraphiteMat || this.graphiteMat);
    clamp2.position.set(6.0, 0, 0);
    dockingArmRight.add(clamp2);
    dockingClamps.push(clamp2);

    const umbilicalTube = new THREE.Mesh(this.getCylinder(1.2, 1.2, 5.0, 10), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    umbilicalTube.rotation.z = Math.PI * 0.5;
    umbilicalTube.position.set(6.5, 8.5, 0);
    dockGroup.add(umbilicalTube);

    // Status Navigation Lights (Port and Starboard Docking Beacons)
    const statusLights: THREE.Mesh[] = [];
    const light1 = new THREE.Mesh(this.getSphere(0.35, 6, 6), mats.orbitalCyanGlowMat || this.cyanGlowMat);
    light1.position.set(4.5, 12.0, 4.0);
    dockGroup.add(light1);
    statusLights.push(light1);

    const light2 = new THREE.Mesh(this.getSphere(0.35, 6, 6), mats.orbitalCyanGlowMat || this.cyanGlowMat);
    light2.position.set(4.5, 12.0, -4.0);
    dockGroup.add(light2);
    statusLights.push(light2);

    // Approaching Detailed Spacecraft Mesh
    const spacecraftMesh = new THREE.Group();
    spacecraftMesh.position.set(11.2, 8.5, 0);

    const craftBody = new THREE.Mesh(this.getBox(6.5, 4.5, 18.0), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    spacecraftMesh.add(craftBody);

    const cockpit = new THREE.Mesh(this.getCone(3.0, 5.5, 6), mats.orbitalObservationGlassMat || this.observationGlassMat);
    cockpit.rotation.x = Math.PI * 0.5;
    cockpit.position.set(0, 0.5, 10.5);
    spacecraftMesh.add(cockpit);

    const wings = new THREE.Mesh(this.getBox(14.0, 0.4, 8.0), mats.orbitalTitaniumMat || this.titaniumMat);
    wings.position.set(0, 0, -2.0);
    spacecraftMesh.add(wings);

    // RCS Thrusters
    const dockingThrusters: THREE.Mesh[] = [];
    [-3.5, 3.5].forEach((tx) => {
      const puff = new THREE.Mesh(this.getCone(0.8, 2.5, 6), mats.orbitalCyanGlowMat || this.cyanGlowMat);
      puff.rotation.z = tx > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      puff.position.set(tx, 0, 4.0);
      spacecraftMesh.add(puff);
      dockingThrusters.push(puff);
    });

    dockGroup.add(spacecraftMesh);
    parent.add(dockGroup);

    director.registerGrandDocking({
      group: dockGroup,
      spacecraftMesh,
      dockingArmLeft,
      dockingArmRight,
      dockingClamps,
      umbilicalTube,
      statusLights,
      dockingThrusters,
      cargoTransferCrane,
      cargoPod,
      triggerZ,
      state: 'APPROACH',
      timer: 0
    });
  }

  // GATE B: Orbital Ring Awakening
  private spawnOrbitalRingEvent(
    parent: THREE.Group,
    ringX: number,
    ringZ: number,
    mats: any,
    director: OrbitalHaloEventDirector,
    triggerZ: number
  ): void {
    const ringSuperGroup = new THREE.Group();
    ringSuperGroup.position.set(ringX, 28.0, ringZ);

    // Central Drive Bearing Core
    const bearingCore = new THREE.Mesh(this.getCylinder(5.5, 5.5, 8.0, 16), mats.orbitalTitaniumMat || this.titaniumMat);
    bearingCore.rotation.x = Math.PI * 0.5;
    ringSuperGroup.add(bearingCore);

    // Inner Counter-Rotating Stabilizer Ring
    const counterRing = new THREE.Group();
    const counterTube = new THREE.Mesh(this.getTorus(18.0, 1.2, 6, 24), mats.orbitalTitaniumMat || this.titaniumMat);
    counterRing.add(counterTube);
    ringSuperGroup.add(counterRing);

    // Rotating Ring Structure
    const ringGroup = new THREE.Group();

    const ringRadius = 38.0;
    const ringTube = new THREE.Mesh(this.getTorus(ringRadius, 2.4, 8, 36), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    ringGroup.add(ringTube);

    // Illuminated Superconductor Rim
    const rim = new THREE.Mesh(this.getTorus(ringRadius + 1.2, 0.4, 6, 36), mats.orbitalCyanGlowMat || this.cyanGlowMat);
    ringGroup.add(rim);

    // Radial Connecting Spokes
    const spokes: THREE.Mesh[] = [];
    const statusStrobes: THREE.Mesh[] = [];
    for (let s = 0; s < 4; s++) {
      const angle = (s / 4) * Math.PI * 2;
      const spoke = new THREE.Mesh(this.getCylinder(0.65, 0.65, ringRadius * 0.95, 6), mats.orbitalGraphiteMat || this.graphiteMat);
      spoke.position.set(Math.cos(angle) * ringRadius * 0.5, Math.sin(angle) * ringRadius * 0.5, 0);
      spoke.rotation.z = angle + Math.PI * 0.5;
      ringGroup.add(spoke);
      spokes.push(spoke);

      const strobe = new THREE.Mesh(this.getSphere(0.45, 6, 6), mats.orbitalCyanGlowMat || this.cyanGlowMat);
      strobe.position.set(Math.cos(angle) * ringRadius * 0.85, Math.sin(angle) * ringRadius * 0.85, 0);
      ringGroup.add(strobe);
      statusStrobes.push(strobe);
    }

    // Modular Habitat Pods along ring
    const habitatPods: THREE.Mesh[] = [];
    for (let p = 0; p < 8; p++) {
      const angle = (p / 8) * Math.PI * 2;
      const podMat = p % 2 === 0 ? (mats.orbitalCyanGlowMat || this.cyanGlowMat) : (mats.orbitalSolarAmberGlowMat || this.solarAmberGlowMat);
      const pod = new THREE.Mesh(this.getBox(5.0, 3.2, 6.0), podMat);
      pod.position.set(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, 0);
      pod.rotation.z = angle;
      ringGroup.add(pod);
      habitatPods.push(pod);
    }

    ringSuperGroup.add(ringGroup);

    // Escort Craft passing through open quadrant
    const escortCraft = new THREE.Group();
    escortCraft.position.set(-15.0, -10.0, 8.0);
    const escortBody = new THREE.Mesh(this.getBox(3.0, 1.2, 6.0), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    escortCraft.add(escortBody);
    const escortWings = new THREE.Mesh(this.getBox(6.5, 0.2, 2.5), mats.orbitalTitaniumMat || this.titaniumMat);
    escortWings.position.set(0, 0, -0.8);
    escortCraft.add(escortWings);
    const escortPlume = new THREE.Mesh(this.getCone(0.6, 2.8, 6), mats.orbitalCyanGlowMat || this.cyanGlowMat);
    escortPlume.rotation.x = Math.PI * 0.5;
    escortPlume.position.set(0, 0, -4.0);
    escortCraft.add(escortPlume);
    ringSuperGroup.add(escortCraft);

    parent.add(ringSuperGroup);

    director.registerOrbitalRing({
      group: ringSuperGroup,
      ringGroup,
      bearingCore,
      spokes,
      habitatPods,
      statusStrobes,
      escortCraft,
      counterRing,
      triggerZ,
      state: 'DORMANT',
      timer: 0,
      rotationSpeed: 0
    });
  }

  // EVENT C: Astronaut EVA Spacewalk
  private spawnAstronautSpacewalkEvent(
    parent: THREE.Group,
    airlockX: number,
    airlockZ: number,
    mats: any,
    director: OrbitalHaloEventDirector,
    triggerZ: number
  ): void {
    const evaGroup = new THREE.Group();
    evaGroup.position.set(airlockX, 6.5, airlockZ);

    const startPos = new THREE.Vector3(0, 0, 0);
    const targetPos = new THREE.Vector3(3.5, 2.0, -3.0);

    // Tether Line connecting astronaut to airlock
    const tetherGeo = this.getCylinder(0.04, 0.04, 4.5, 4);
    const tetherLine = new THREE.Mesh(tetherGeo, mats.orbitalTitaniumMat || this.titaniumMat);
    tetherLine.position.set(1.75, 1.0, -1.5);
    tetherLine.rotation.z = Math.PI * 0.35;
    evaGroup.add(tetherLine);

    // Detailed Astronaut Model
    const astronautMesh = new THREE.Group();
    // Torso suit
    const torso = new THREE.Mesh(this.getBox(0.9, 1.2, 0.6), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    astronautMesh.add(torso);
    // Helmet & Visor
    const helmet = new THREE.Mesh(this.getSphere(0.42, 8, 8), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    helmet.position.y = 0.85;
    astronautMesh.add(helmet);
    const visor = new THREE.Mesh(this.getSphere(0.35, 6, 6), mats.orbitalGoldTrimMat || this.solarAmberGlowMat);
    visor.position.set(0, 0.85, 0.18);
    astronautMesh.add(visor);
    // Life-Support Backpack
    const backpack = new THREE.Mesh(this.getBox(0.7, 0.9, 0.4), mats.orbitalTitaniumMat || this.titaniumMat);
    backpack.position.set(0, 0.1, -0.42);
    astronautMesh.add(backpack);

    // Repair tool in hand
    const repairTool = new THREE.Mesh(this.getCylinder(0.06, 0.08, 0.7, 4), mats.orbitalGraphiteMat || this.graphiteMat);
    repairTool.position.set(0.6, -0.2, 0.4);
    repairTool.rotation.x = Math.PI * 0.4;
    astronautMesh.add(repairTool);

    // Welding Spark
    const toolSpark = new THREE.Mesh(this.getSphere(0.25, 4, 4), mats.orbitalCyanGlowMat || this.cyanGlowMat);
    toolSpark.position.set(0.6, -0.2, 0.8);
    toolSpark.visible = false;
    astronautMesh.add(toolSpark);

    evaGroup.add(astronautMesh);

    // Target Maintenance Panel on station hull
    const panel = new THREE.Mesh(this.getBox(1.8, 1.8, 0.2), mats.orbitalGraphiteMat || this.graphiteMat);
    panel.position.copy(targetPos);
    evaGroup.add(panel);

    const statusIndicator = new THREE.Mesh(this.getSphere(0.2, 6, 6), mats.orbitalSolarMat || this.solarAmberGlowMat);
    statusIndicator.position.set(targetPos.x, targetPos.y + 1.1, targetPos.z);
    evaGroup.add(statusIndicator);

    parent.add(evaGroup);

    director.registerAstronautSpacewalk({
      group: evaGroup,
      astronautMesh,
      tetherLine,
      repairTool,
      statusIndicator,
      toolSpark,
      startPos,
      targetPos,
      triggerZ,
      state: 'AIRLOCK_EXIT',
      timer: 0
    });
  }

  // EVENT D: Planetary Eclipse
  private spawnPlanetaryEclipseEvent(
    parent: THREE.Group,
    planetX: number,
    planetY: number,
    planetZ: number,
    mats: any,
    director: OrbitalHaloEventDirector,
    triggerZ: number
  ): void {
    const eclipseGroup = new THREE.Group();
    eclipseGroup.position.set(planetX, planetY, planetZ);

    const startPos = new THREE.Vector3(-45.0, 10.0, 0);
    const endPos = new THREE.Vector3(45.0, -10.0, 0);

    const eclipseBody = new THREE.Mesh(this.getSphere(18.0, 16, 12), mats.orbitalTitaniumMat || this.titaniumMat);
    eclipseBody.position.copy(startPos);
    eclipseGroup.add(eclipseBody);

    const coronaGlowMesh = new THREE.Mesh(this.getTorus(22.0, 2.8, 6, 24), mats.orbitalCyanGlowMat || this.cyanGlowMat);
    coronaGlowMesh.visible = false;
    eclipseGroup.add(coronaGlowMesh);

    parent.add(eclipseGroup);

    director.registerPlanetaryEclipse({
      group: eclipseGroup,
      eclipseBody,
      coronaGlowMesh,
      startPos,
      endPos,
      triggerZ,
      state: 'TRANSIT_APPROACH',
      timer: 0
    });
  }

  // EVENT E: Meteor Shower & Debris Trails
  private spawnMeteorShowerEvent(
    parent: THREE.Group,
    lotZ: number,
    mats: any,
    director: OrbitalHaloEventDirector,
    triggerZ: number
  ): void {
    const showerGroup = new THREE.Group();
    showerGroup.position.set(0, 45.0, lotZ);

    const meteorStreaks: MeteorShowerActor['meteorStreaks'] = [];
    for (let m = 0; m < 6; m++) {
      const sGroup = new THREE.Group();
      const head = new THREE.Mesh(this.getSphere(1.2, 6, 6), mats.orbitalCyanGlowMat || this.cyanGlowMat);
      sGroup.add(head);
      const tail = new THREE.Mesh(this.getCone(0.8, 8.0, 6), mats.orbitalCyanGlowMat || this.cyanGlowMat);
      tail.rotation.x = Math.PI * 0.5;
      tail.position.z = 4.0;
      sGroup.add(tail);

      const initX = -60.0 + m * 24.0;
      const initY = 20.0 + (m % 3) * 8.0;
      const initZ = (m - 3) * 15.0;
      sGroup.position.set(initX, initY, initZ);
      showerGroup.add(sGroup);

      meteorStreaks.push({
        mesh: sGroup,
        velocity: new THREE.Vector3(28.0, -12.0, -18.0),
        life: 0,
        maxLife: 2.5 + Math.random() * 1.5,
        initialPos: new THREE.Vector3(initX, initY, initZ)
      });
    }

    parent.add(showerGroup);

    director.registerMeteorShower({
      group: showerGroup,
      meteorStreaks,
      triggerZ,
      state: 'STREAK_ENTRY',
      timer: 0
    });
  }

  // EVENT F: Colossal Deep Space Research Ship
  private spawnColossalVesselEvent(
    parent: THREE.Group,
    startX: number,
    startZ: number,
    mats: any,
    director: OrbitalHaloEventDirector,
    triggerZ: number
  ): void {
    const vesselGroup = new THREE.Group();
    vesselGroup.position.set(startX, 24.0, startZ);

    const vesselMesh = new THREE.Group();
    // Colossal main fuselage (Length 64m)
    const hull = new THREE.Mesh(this.getBox(16.0, 12.0, 64.0), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    vesselMesh.add(hull);

    // Forward Sensor Dome
    const dome = new THREE.Mesh(this.getSphere(7.5, 12, 10), mats.orbitalObservationGlassMat || this.observationGlassMat);
    dome.position.set(0, 2.0, 34.0);
    vesselMesh.add(dome);

    // Rotating Deep-Space Antenna Dish
    const sensorDish = new THREE.Mesh(this.getCone(8.0, 3.0, 12), mats.orbitalTitaniumMat || this.titaniumMat);
    sensorDish.position.set(0, 9.5, 8.0);
    sensorDish.rotation.x = -Math.PI * 0.4;
    vesselMesh.add(sensorDish);

    // Quad Ion Plasma Thrusters
    const engineGlow: THREE.Mesh[] = [];
    [-5.0, 5.0].forEach((ex) => {
      [-3.0, 3.0].forEach((ey) => {
        const bell = new THREE.Mesh(this.getCylinder(2.2, 3.0, 4.5, 8), mats.orbitalTitaniumMat || this.titaniumMat);
        bell.rotation.x = Math.PI * 0.5;
        bell.position.set(ex, ey, -34.0);
        vesselMesh.add(bell);

        const glow = new THREE.Mesh(this.getSphere(1.8, 6, 6), mats.orbitalCyanGlowMat || this.cyanGlowMat);
        glow.position.set(ex, ey, -35.0);
        vesselMesh.add(glow);
        engineGlow.push(glow);
      });
    });

    vesselGroup.add(vesselMesh);

    // Escort Fighters flanking
    const escortShuttles: THREE.Group[] = [];
    [-18.0, 18.0].forEach((ex) => {
      const escort = new THREE.Group();
      escort.position.set(ex, 6.0, 12.0);
      const eBody = new THREE.Mesh(this.getBox(4.5, 1.8, 9.0), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
      escort.add(eBody);
      vesselGroup.add(escort);
      escortShuttles.push(escort);
    });

    parent.add(vesselGroup);

    director.registerColossalVessel({
      group: vesselGroup,
      vesselMesh,
      escortShuttles,
      sensorDish,
      engineGlow,
      triggerZ,
      state: 'EMERGENCE',
      timer: 0
    });
  }

  // EVENT G: Solar Array Transformation
  private spawnSolarTransformationEvent(
    parent: THREE.Group,
    armX: number,
    armZ: number,
    mats: any,
    director: OrbitalHaloEventDirector,
    triggerZ: number
  ): void {
    const arrayGroup = new THREE.Group();
    arrayGroup.position.set(armX, 10.0, armZ);

    const mainArm = new THREE.Group();
    const pylon = new THREE.Mesh(this.getBox(2.2, 14.0, 2.2), mats.orbitalTitaniumMat || this.titaniumMat);
    pylon.position.y = 7.0;
    mainArm.add(pylon);

    // Articulated Solar Wings
    const wingLeft = new THREE.Group();
    wingLeft.position.set(0, 14.0, 1.5);
    const panelL = new THREE.Mesh(this.getBox(18.0, 0.3, 12.0), mats.orbitalSolarMat || this.solarPanelMat);
    panelL.position.x = 9.0;
    wingLeft.add(panelL);
    mainArm.add(wingLeft);

    const wingRight = new THREE.Group();
    wingRight.position.set(0, 14.0, -1.5);
    const panelR = new THREE.Mesh(this.getBox(18.0, 0.3, 12.0), mats.orbitalSolarMat || this.solarPanelMat);
    panelR.position.x = 9.0;
    wingRight.add(panelR);
    mainArm.add(wingRight);

    arrayGroup.add(mainArm);
    parent.add(arrayGroup);

    director.registerSolarTransformation({
      group: arrayGroup,
      mainArm,
      wingLeft,
      wingRight,
      radiatorPipes: [],
      statusBeacons: [],
      triggerZ,
      state: 'STOWED',
      timer: 0
    });
  }

  // EVENT H: Orbital Construction Site
  private spawnConstructionSiteEvent(
    parent: THREE.Group,
    siteX: number,
    siteZ: number,
    mats: any,
    director: OrbitalHaloEventDirector,
    triggerZ: number
  ): void {
    const constGroup = new THREE.Group();
    constGroup.position.set(siteX, 0, siteZ);

    const craneArm = new THREE.Group();
    craneArm.position.set(0, 16.0, 0);
    const boom = new THREE.Mesh(this.getBox(18.0, 1.4, 1.4), mats.orbitalGraphiteMat || this.graphiteMat);
    boom.position.x = 9.0;
    craneArm.add(boom);
    const cable = new THREE.Mesh(this.getCylinder(0.06, 0.06, 6.0, 4), mats.orbitalTitaniumMat || this.titaniumMat);
    cable.position.set(16.0, -3.0, 0);
    craneArm.add(cable);
    constGroup.add(craneArm);

    // Suspended Structural Truss Module
    const trussModule = new THREE.Mesh(this.getBox(12.0, 3.5, 3.5), mats.orbitalTitaniumMat || this.titaniumMat);
    trussModule.position.set(16.0, 12.0, 0);
    constGroup.add(trussModule);

    // Welding Drone with Spark Bursts
    const weldingDrone = new THREE.Group();
    weldingDrone.position.set(18.0, 13.5, 1.8);
    const dBody = new THREE.Mesh(this.getBox(1.2, 0.8, 1.2), mats.orbitalTitaniumMat || this.titaniumMat);
    weldingDrone.add(dBody);

    const weldSparks: THREE.Mesh[] = [];
    for (let s = 0; s < 3; s++) {
      const spark = new THREE.Mesh(this.getSphere(0.3, 4, 4), mats.orbitalCyanGlowMat || this.cyanGlowMat);
      spark.position.set((s - 1) * 0.4, -0.6, 0);
      spark.visible = false;
      weldingDrone.add(spark);
      weldSparks.push(spark);
    }
    constGroup.add(weldingDrone);

    parent.add(constGroup);

    director.registerConstructionSite({
      group: constGroup,
      craneArm,
      trussModule,
      weldingDrone,
      weldSparks,
      triggerZ,
      state: 'CRANE_RETRIEVE',
      timer: 0
    });
  }

  // =========================================================================
  // PRESERVED COMPATIBILITY LANDMARKS
  // =========================================================================

  private buildMonumentalGatewayArch(
    group: THREE.Group,
    chunkLength: number,
    gatewayZ: number,
    mats: any
  ): void {
    const archGroup = new THREE.Group();
    archGroup.name = 'orbital_gateway_arch';
    archGroup.position.set(0, 0, gatewayZ);

    const archH = 12.8; // Elevated overhead clearance >= 11.6m
    const spanW = CONSTANTS.LANE_WIDTH * 3 + 5.2;
    const postX = spanW * 0.5 + 2.0;

    [-postX, postX].forEach((px) => {
      const pylon = new THREE.Mesh(this.getBox(2.2, archH, 3.2), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
      pylon.position.set(px, archH * 0.5, 0);
      pylon.castShadow = true;
      archGroup.add(pylon);

      // Status indicator band on pylon
      const band = new THREE.Mesh(this.getBox(2.3, 0.4, 3.3), mats.orbitalCyanGlowMat || this.cyanGlowMat);
      band.position.set(px, archH * 0.75, 0);
      archGroup.add(band);
    });

    const lintel = new THREE.Mesh(this.getBox(spanW + 4.2, 1.8, 3.6), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    lintel.name = 'orbital_gateway_arch';
    lintel.position.set(0, archH, 0);
    lintel.castShadow = true;
    archGroup.add(lintel);

    const glowArch = new THREE.Mesh(this.getBox(spanW + 3.6, 0.35, 0.4), mats.orbitalCyanGlowMat || this.cyanGlowMat);
    glowArch.position.set(0, archH - 1.0, 1.85);
    archGroup.add(glowArch);

    group.add(archGroup);
  }

  private buildObservationSkybridge(
    group: THREE.Group,
    chunkLength: number,
    bridgeZ: number,
    mats: any
  ): void {
    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = 'orbital_skybridge';
    bridgeGroup.position.set(0, 0, bridgeZ);

    const spanW = CONSTANTS.LANE_WIDTH * 3 + 5.2;
    const bridgeFloorY = 13.5; // Elevated overhead clearance >= 13.5m
    const bridgeH = 3.2;
    const bridgeDepth = 3.2;

    const floor = new THREE.Mesh(this.getBox(spanW + 4.0, 0.35, bridgeDepth), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    floor.name = 'orbital_skybridge';
    floor.position.set(0, bridgeFloorY + 0.17, 0);
    bridgeGroup.add(floor);

    const roof = new THREE.Mesh(this.getBox(spanW + 4.0, 0.35, bridgeDepth), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    roof.position.set(0, bridgeFloorY + bridgeH - 0.17, 0);
    bridgeGroup.add(roof);

    const glassGeo = this.getBox(spanW + 3.6, bridgeH - 0.7, 0.12);
    const frontGlass = new THREE.Mesh(glassGeo, mats.orbitalObservationGlassMat || this.observationGlassMat);
    frontGlass.position.set(0, bridgeFloorY + bridgeH * 0.5, bridgeDepth * 0.5 - 0.1);
    bridgeGroup.add(frontGlass);

    const rearGlass = new THREE.Mesh(glassGeo, mats.orbitalObservationGlassMat || this.observationGlassMat);
    rearGlass.position.set(0, bridgeFloorY + bridgeH * 0.5, -bridgeDepth * 0.5 + 0.1);
    bridgeGroup.add(rearGlass);

    // Cyan glowing guide rails on skybridge underbelly
    const underGlow = new THREE.Mesh(this.getBox(spanW + 3.2, 0.15, 0.35), mats.orbitalCyanGlowMat || this.cyanGlowMat);
    underGlow.position.set(0, bridgeFloorY - 0.08, 0);
    bridgeGroup.add(underGlow);

    group.add(bridgeGroup);
  }

  private buildDockedSpacecraftBay(
    group: THREE.Group,
    chunkLength: number,
    craftZ: number,
    mats: any,
    rng: SeededRandom
  ): void {
    const craftGroup = new THREE.Group();
    craftGroup.name = 'orbital_docked_spacecraft';

    const side = rng.chance(0.5) ? -1 : 1;
    const wallX = CONSTANTS.TUNNEL_WALL_X;
    const craftX = side * (wallX + 8.8);
    craftGroup.position.set(craftX, 5.2, craftZ);

    const cLen = 24.0;
    const cWidth = 7.4;
    const cH = 5.6;

    const body = new THREE.Mesh(this.getBox(cWidth, cH, cLen), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    body.castShadow = true;
    craftGroup.add(body);

    const nose = new THREE.Mesh(this.getCone(cWidth * 0.5, 6.5, 6), mats.orbitalGraphiteMat || this.graphiteMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0, cLen * 0.5 + 3.25);
    craftGroup.add(nose);

    const wings = new THREE.Mesh(this.getBox(14.0, 0.4, 9.0), mats.orbitalWhiteCompositeMat || this.whiteHullMat);
    wings.position.set(0, 0, -2.0);
    craftGroup.add(wings);

    const canopy = new THREE.Mesh(this.getBox(cWidth * 0.6, 1.4, 4.5), mats.orbitalObservationGlassMat || this.observationGlassMat);
    canopy.position.set(0, cH * 0.5 + 0.6, 3.5);
    craftGroup.add(canopy);

    [-2.0, 2.0].forEach((tx) => {
      const bell = new THREE.Mesh(this.getCylinder(1.2, 1.6, 2.5, 12), mats.orbitalTitaniumMat || this.titaniumMat);
      bell.rotation.x = Math.PI / 2;
      bell.position.set(tx, 0, -cLen * 0.5 - 1.25);
      craftGroup.add(bell);
    });

    group.add(craftGroup);
  }
}
