import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';

/**
 * Actor Interfaces for Orbital Halo Space Megastructure Encounters
 */

export interface GrandSpacecraftDockingActor {
  group: THREE.Group;
  spacecraftMesh: THREE.Group;
  dockingArmLeft: THREE.Group;
  dockingArmRight: THREE.Group;
  dockingClamps: THREE.Mesh[];
  umbilicalTube: THREE.Mesh;
  statusLights: THREE.Mesh[];
  dockingThrusters: THREE.Mesh[];
  triggerZ: number;
  state: 'APPROACH' | 'DECELERATION' | 'ALIGNMENT' | 'CLAMP_LOCK' | 'UMBILICAL_CONNECT' | 'DOCKED';
  timer: number;
}

export interface OrbitalRingAwakeningActor {
  group: THREE.Group;
  ringGroup: THREE.Group;
  bearingCore: THREE.Mesh;
  spokes: THREE.Mesh[];
  habitatPods: THREE.Mesh[];
  statusStrobes: THREE.Mesh[];
  escortCraft?: THREE.Group;
  triggerZ: number;
  state: 'DORMANT' | 'POWER_SURGE' | 'ROTATION_SPINUP' | 'HABITAT_ONLINE' | 'FULL_ROTATION';
  timer: number;
  rotationSpeed: number;
}

export interface AstronautSpacewalkActor {
  group: THREE.Group;
  astronautMesh: THREE.Group;
  tetherLine: THREE.Line | THREE.Mesh;
  repairTool: THREE.Mesh;
  statusIndicator: THREE.Mesh;
  toolSpark?: THREE.Mesh;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  triggerZ: number;
  state: 'AIRLOCK_EXIT' | 'TETHER_TRAVERSAL' | 'PANEL_REPAIR' | 'TOOL_WELDING' | 'RETURN_AIRLOCK';
  timer: number;
}

export interface PlanetaryEclipseActor {
  group: THREE.Group;
  eclipseBody: THREE.Mesh;
  coronaGlowMesh: THREE.Mesh;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  triggerZ: number;
  state: 'TRANSIT_APPROACH' | 'SOLAR_ECLIPSE' | 'CORONA_GLOW' | 'TRANSIT_DEPARTURE' | 'COMPLETE';
  timer: number;
}

export interface MeteorShowerActor {
  group: THREE.Group;
  meteorStreaks: Array<{
    mesh: THREE.Group;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    initialPos: THREE.Vector3;
  }>;
  triggerZ: number;
  state: 'STREAK_ENTRY' | 'ACTIVE_SHOWER' | 'SUBSIDING' | 'COMPLETE';
  timer: number;
}

export interface ColossalResearchVesselActor {
  group: THREE.Group;
  vesselMesh: THREE.Group;
  escortShuttles: THREE.Group[];
  sensorDish: THREE.Mesh;
  engineGlow: THREE.Mesh[];
  triggerZ: number;
  state: 'EMERGENCE' | 'TRANSIT_CROSSING' | 'PLANETARY_BACKDROP' | 'WARP_DEPARTURE' | 'COMPLETE';
  timer: number;
}

export interface SolarArrayTransformationActor {
  group: THREE.Group;
  mainArm: THREE.Group;
  wingLeft: THREE.Group;
  wingRight: THREE.Group;
  radiatorPipes: THREE.Mesh[];
  statusBeacons: THREE.Mesh[];
  triggerZ: number;
  state: 'STOWED' | 'ARM_EXTENSION' | 'WING_UNFOLD' | 'SUN_TRACKING';
  timer: number;
}

export interface OrbitalConstructionSiteActor {
  group: THREE.Group;
  craneArm: THREE.Group;
  trussModule: THREE.Mesh;
  weldingDrone: THREE.Group;
  weldSparks: THREE.Mesh[];
  triggerZ: number;
  state: 'CRANE_RETRIEVE' | 'ROTATION_ALIGN' | 'LOCK_STRUCTURAL' | 'WELDING_BURST';
  timer: number;
}

export interface AmbientSpaceLife {
  patrolShuttles: Array<{
    mesh: THREE.Group;
    speed: number;
    splineRadiusX: number;
    splineRadiusY: number;
    phase: number;
    basePos: THREE.Vector3;
  }>;
  radarDishes: Array<{
    mesh: THREE.Mesh | THREE.Group;
    rotSpeed: number;
  }>;
  trackingSolarPanels: Array<{
    mesh: THREE.Group;
    phase: number;
    speed: number;
  }>;
  maintenanceDrones: Array<{
    mesh: THREE.Group;
    lightCone: THREE.Mesh;
    basePos: THREE.Vector3;
    phase: number;
    radius: number;
  }>;
  navigationBeacons: Array<{
    mesh: THREE.Mesh;
    blinkRate: number;
    phase: number;
  }>;
}

/**
 * OrbitalHaloEventDirector
 * Coordinates all high-impact cinematic spacecraft encounters, orbital ring rotations,
 * spacewalk repairs, celestial spectacles, and living space station activity.
 *
 * Invariant: Uses signed-distance convention (distanceAhead = playerZ - triggerZ)
 * where negative Z is runner forward travel.
 */
export class OrbitalHaloEventDirector {
  private static instance: OrbitalHaloEventDirector | null = null;

  private totalTime: number = 0;
  private frameCounter: number = 0;

  // Registered Flagship Cinematic Encounters
  private grandDockings: GrandSpacecraftDockingActor[] = [];
  private orbitalRings: OrbitalRingAwakeningActor[] = [];
  private astronautSpacewalks: AstronautSpacewalkActor[] = [];
  private planetaryEclipses: PlanetaryEclipseActor[] = [];
  private meteorShowers: MeteorShowerActor[] = [];
  private colossalVessels: ColossalResearchVesselActor[] = [];
  private solarTransformations: SolarArrayTransformationActor[] = [];
  private constructionSites: OrbitalConstructionSiteActor[] = [];

  // Ambient Space Life Ecosystem
  private ambient: AmbientSpaceLife = {
    patrolShuttles: [],
    radarDishes: [],
    trackingSolarPanels: [],
    maintenanceDrones: [],
    navigationBeacons: []
  };

  private constructor() {}

  public static getInstance(): OrbitalHaloEventDirector {
    if (!this.instance) {
      this.instance = new OrbitalHaloEventDirector();
    }
    return this.instance;
  }

  // --- Registration Methods ---

  public registerGrandDocking(actor: GrandSpacecraftDockingActor): void {
    this.grandDockings.push(actor);
  }

  public registerOrbitalRing(actor: OrbitalRingAwakeningActor): void {
    this.orbitalRings.push(actor);
  }

  public registerAstronautSpacewalk(actor: AstronautSpacewalkActor): void {
    this.astronautSpacewalks.push(actor);
  }

  public registerPlanetaryEclipse(actor: PlanetaryEclipseActor): void {
    this.planetaryEclipses.push(actor);
  }

  public registerMeteorShower(actor: MeteorShowerActor): void {
    this.meteorShowers.push(actor);
  }

  public registerColossalVessel(actor: ColossalResearchVesselActor): void {
    this.colossalVessels.push(actor);
  }

  public registerSolarTransformation(actor: SolarArrayTransformationActor): void {
    this.solarTransformations.push(actor);
  }

  public registerConstructionSite(actor: OrbitalConstructionSiteActor): void {
    this.constructionSites.push(actor);
  }

  public registerPatrolShuttle(
    mesh: THREE.Group,
    basePos: THREE.Vector3,
    splineRadiusX: number = 18.0,
    splineRadiusY: number = 6.0,
    speed: number = 0.8
  ): void {
    this.ambient.patrolShuttles.push({
      mesh,
      speed,
      splineRadiusX,
      splineRadiusY,
      phase: Math.random() * Math.PI * 2,
      basePos
    });
  }

  public registerRadarDish(mesh: THREE.Mesh | THREE.Group, rotSpeed: number = 0.5): void {
    this.ambient.radarDishes.push({ mesh, rotSpeed });
  }

  public registerTrackingSolarPanel(mesh: THREE.Group, speed: number = 0.2): void {
    this.ambient.trackingSolarPanels.push({
      mesh,
      phase: Math.random() * Math.PI * 2,
      speed
    });
  }

  public registerMaintenanceDrone(
    mesh: THREE.Group,
    lightCone: THREE.Mesh,
    basePos: THREE.Vector3,
    radius: number = 8.0
  ): void {
    this.ambient.maintenanceDrones.push({
      mesh,
      lightCone,
      basePos,
      phase: Math.random() * Math.PI * 2,
      radius
    });
  }

  public registerNavigationBeacon(mesh: THREE.Mesh, blinkRate: number = 3.0): void {
    this.ambient.navigationBeacons.push({
      mesh,
      blinkRate,
      phase: Math.random() * Math.PI * 2
    });
  }

  // --- Lifecycle & Pruning ---

  public reset(): void {
    this.grandDockings = [];
    this.orbitalRings = [];
    this.astronautSpacewalks = [];
    this.planetaryEclipses = [];
    this.meteorShowers = [];
    this.colossalVessels = [];
    this.solarTransformations = [];
    this.constructionSites = [];
    this.ambient = {
      patrolShuttles: [],
      radarDishes: [],
      trackingSolarPanels: [],
      maintenanceDrones: [],
      navigationBeacons: []
    };
    this.totalTime = 0;
    this.frameCounter = 0;
  }

  public pruneDetached(): void {
    const isAttached = (g: THREE.Object3D) => {
      let cur: THREE.Object3D | null = g;
      while (cur) {
        if (cur.type === 'Scene' || (cur as any).isTestRoot) return true;
        if (!cur.parent) return cur.type === 'Scene' || (cur as any).isTestRoot === true;
        cur = cur.parent;
      }
      return false;
    };

    this.grandDockings = this.grandDockings.filter(a => isAttached(a.group));
    this.orbitalRings = this.orbitalRings.filter(a => isAttached(a.group));
    this.astronautSpacewalks = this.astronautSpacewalks.filter(a => isAttached(a.group));
    this.planetaryEclipses = this.planetaryEclipses.filter(a => isAttached(a.group));
    this.meteorShowers = this.meteorShowers.filter(a => isAttached(a.group));
    this.colossalVessels = this.colossalVessels.filter(a => isAttached(a.group));
    this.solarTransformations = this.solarTransformations.filter(a => isAttached(a.group));
    this.constructionSites = this.constructionSites.filter(a => isAttached(a.group));

    this.ambient.patrolShuttles = this.ambient.patrolShuttles.filter(s => isAttached(s.mesh));
    this.ambient.radarDishes = this.ambient.radarDishes.filter(d => isAttached(d.mesh));
    this.ambient.trackingSolarPanels = this.ambient.trackingSolarPanels.filter(p => isAttached(p.mesh));
    this.ambient.maintenanceDrones = this.ambient.maintenanceDrones.filter(d => isAttached(d.mesh));
    this.ambient.navigationBeacons = this.ambient.navigationBeacons.filter(b => isAttached(b.mesh));
  }

  // --- Main Tick Update ---

  public update(dt: number, isActive: boolean, playerZ: number = 0): void {
    if (!isActive) return;

    const delta = Math.min(dt, 0.1);
    this.totalTime += delta;
    this.frameCounter++;

    if (this.frameCounter % 180 === 0) {
      this.pruneDetached();
    }

    // 1. Gate A: Grand Spacecraft Docking Sequence
    this.updateGrandDockings(delta, playerZ);

    // 2. Gate B: Orbital Ring Awakening Sequence
    this.updateOrbitalRings(delta, playerZ);

    // 3. Event C: Astronaut EVA Spacewalk
    this.updateAstronautSpacewalks(delta, playerZ);

    // 4. Event D: Planetary Eclipse
    this.updatePlanetaryEclipses(delta, playerZ);

    // 5. Event E: Meteor Shower
    this.updateMeteorShowers(delta, playerZ);

    // 6. Event F: Colossal Research Vessel
    this.updateColossalVessels(delta, playerZ);

    // 7. Event G: Solar Array Transformation
    this.updateSolarTransformations(delta, playerZ);

    // 8. Event H: Orbital Construction Site
    this.updateConstructionSites(delta, playerZ);

    // 9. Ambient Living Space Station Ecosystem
    this.updateAmbientSpaceLife(delta);
  }

  // =========================================================================
  // GATE A: THE GRAND SPACECRAFT DOCKING SEQUENCE
  // =========================================================================

  private updateGrandDockings(dt: number, playerZ: number): void {
    for (const actor of this.grandDockings) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      // State Progression based on signed distance
      if (actor.state === 'APPROACH' && distanceAhead <= 150.0) {
        actor.state = 'DECELERATION';
        actor.timer = 0;
      } else if (actor.state === 'DECELERATION' && (distanceAhead <= 75.0 || actor.timer > 2.5)) {
        actor.state = 'ALIGNMENT';
        actor.timer = 0;
      } else if (actor.state === 'ALIGNMENT' && (distanceAhead <= 25.0 || actor.timer > 2.0)) {
        actor.state = 'CLAMP_LOCK';
        actor.timer = 0;
      } else if (actor.state === 'CLAMP_LOCK' && (distanceAhead <= 0.0 || actor.timer > 1.2)) {
        actor.state = 'UMBILICAL_CONNECT';
        actor.timer = 0;
      } else if (actor.state === 'UMBILICAL_CONNECT' && (distanceAhead <= -35.0 || actor.timer > 1.5)) {
        actor.state = 'DOCKED';
      }

      // Visual Animation Logic
      if (actor.state === 'APPROACH') {
        actor.spacecraftMesh.position.x = 22.0 + Math.sin(this.totalTime * 1.5) * 0.8;
        actor.spacecraftMesh.position.y = 8.5;
        actor.spacecraftMesh.position.z = 24.0;
        actor.dockingArmLeft.rotation.z = -0.5;
        actor.dockingArmRight.rotation.z = 0.5;
        actor.umbilicalTube.scale.set(0.1, 1.0, 1.0);
      } else if (actor.state === 'DECELERATION') {
        const progress = Math.min(1.0, actor.timer / 2.5);
        actor.spacecraftMesh.position.z = THREE.MathUtils.lerp(24.0, 8.0, progress);
        actor.spacecraftMesh.position.x = THREE.MathUtils.lerp(22.0, 14.5, progress);
        // Thruster puffs firing reverse
        for (const thruster of actor.dockingThrusters) {
          thruster.visible = Math.sin(actor.timer * 25.0) > 0.0;
        }
      } else if (actor.state === 'ALIGNMENT') {
        const progress = Math.min(1.0, actor.timer / 2.0);
        actor.spacecraftMesh.position.z = THREE.MathUtils.lerp(8.0, 0.0, progress);
        actor.spacecraftMesh.position.x = THREE.MathUtils.lerp(14.5, 11.2, progress);
        actor.spacecraftMesh.rotation.y = THREE.MathUtils.lerp(0.12, 0.0, progress);
        // Mechanical arms begin closing in
        actor.dockingArmLeft.rotation.z = THREE.MathUtils.lerp(-0.5, -0.1, progress);
        actor.dockingArmRight.rotation.z = THREE.MathUtils.lerp(0.5, 0.1, progress);
      } else if (actor.state === 'CLAMP_LOCK') {
        const progress = Math.min(1.0, actor.timer / 1.2);
        // Clamps lock onto spacecraft hull
        for (const clamp of actor.dockingClamps) {
          clamp.scale.set(1.0, 1.0 + progress * 0.4, 1.0);
        }
        actor.dockingArmLeft.rotation.z = 0.0;
        actor.dockingArmRight.rotation.z = 0.0;
        // Navigation lights switch to green/cyan lock
        for (const light of actor.statusLights) {
          (light.material as any).color?.setHex?.(0x00f5ff);
        }
      } else if (actor.state === 'UMBILICAL_CONNECT' || actor.state === 'DOCKED') {
        const progress = Math.min(1.0, actor.timer / 1.5);
        actor.umbilicalTube.scale.set(progress, 1.0, 1.0);
        for (const thruster of actor.dockingThrusters) {
          thruster.visible = false;
        }
      }
    }
  }

  // =========================================================================
  // GATE B: THE ORBITAL RING AWAKENING SEQUENCE
  // =========================================================================

  private updateOrbitalRings(dt: number, playerZ: number): void {
    for (const actor of this.orbitalRings) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      if (actor.state === 'DORMANT' && distanceAhead <= 160.0) {
        actor.state = 'POWER_SURGE';
        actor.timer = 0;
      } else if (actor.state === 'POWER_SURGE' && (distanceAhead <= 110.0 || actor.timer > 1.8)) {
        actor.state = 'ROTATION_SPINUP';
        actor.timer = 0;
      } else if (actor.state === 'ROTATION_SPINUP' && (distanceAhead <= 40.0 || actor.timer > 3.0)) {
        actor.state = 'HABITAT_ONLINE';
        actor.timer = 0;
      } else if (actor.state === 'HABITAT_ONLINE' && (distanceAhead <= -20.0 || actor.timer > 2.5)) {
        actor.state = 'FULL_ROTATION';
      }

      // Visual Animation Logic
      if (actor.state === 'DORMANT') {
        actor.ringGroup.rotation.z = 0;
        actor.rotationSpeed = 0;
        for (const strobe of actor.statusStrobes) strobe.visible = false;
      } else if (actor.state === 'POWER_SURGE') {
        // Strobes pulse along radial spokes
        for (let i = 0; i < actor.statusStrobes.length; i++) {
          actor.statusStrobes[i].visible = Math.sin(actor.timer * 8.0 + i) > 0.2;
        }
      } else if (actor.state === 'ROTATION_SPINUP') {
        const t = Math.min(1.0, actor.timer / 3.0);
        actor.rotationSpeed = THREE.MathUtils.lerp(0.0, 0.45, t);
        actor.ringGroup.rotation.z += actor.rotationSpeed * dt;
        // Pods illuminate progressively
        for (let p = 0; p < actor.habitatPods.length; p++) {
          actor.habitatPods[p].visible = t > p / actor.habitatPods.length;
        }
      } else if (actor.state === 'HABITAT_ONLINE' || actor.state === 'FULL_ROTATION') {
        actor.rotationSpeed = 0.45;
        actor.ringGroup.rotation.z += actor.rotationSpeed * dt;
        for (const pod of actor.habitatPods) pod.visible = true;
        for (const strobe of actor.statusStrobes) strobe.visible = true;

        if (actor.escortCraft) {
          actor.escortCraft.position.x += dt * 18.0;
          actor.escortCraft.position.y += Math.sin(actor.timer * 2.0) * dt * 2.0;
        }
      }
    }
  }

  // =========================================================================
  // EVENT C: ASTRONAUT EVA SPACEWALK
  // =========================================================================

  private updateAstronautSpacewalks(dt: number, playerZ: number): void {
    for (const actor of this.astronautSpacewalks) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      if (actor.state === 'AIRLOCK_EXIT' && distanceAhead <= 130.0) {
        actor.state = 'TETHER_TRAVERSAL';
        actor.timer = 0;
      } else if (actor.state === 'TETHER_TRAVERSAL' && (distanceAhead <= 60.0 || actor.timer > 3.0)) {
        actor.state = 'PANEL_REPAIR';
        actor.timer = 0;
      } else if (actor.state === 'PANEL_REPAIR' && (distanceAhead <= 10.0 || actor.timer > 2.0)) {
        actor.state = 'TOOL_WELDING';
        actor.timer = 0;
      } else if (actor.state === 'TOOL_WELDING' && (distanceAhead <= -40.0 || actor.timer > 2.5)) {
        actor.state = 'RETURN_AIRLOCK';
        actor.timer = 0;
      }

      // Visual Animation Logic
      if (actor.state === 'TETHER_TRAVERSAL') {
        const t = Math.min(1.0, actor.timer / 3.0);
        actor.astronautMesh.position.lerpVectors(actor.startPos, actor.targetPos, t);
        // Micro-gravity floating limb sway
        actor.astronautMesh.rotation.z = Math.sin(actor.timer * 1.8) * 0.15;
        actor.astronautMesh.rotation.x = Math.cos(actor.timer * 1.5) * 0.12;
      } else if (actor.state === 'PANEL_REPAIR' || actor.state === 'TOOL_WELDING') {
        actor.astronautMesh.position.copy(actor.targetPos);
        actor.astronautMesh.position.y += Math.sin(actor.timer * 3.0) * 0.08;
        if (actor.toolSpark) {
          actor.toolSpark.visible = Math.sin(actor.timer * 35.0) > 0.2;
        }
        if (actor.state === 'TOOL_WELDING' && actor.timer > 1.2) {
          (actor.statusIndicator.material as any).color?.setHex?.(0x00f5ff); // Green/Cyan complete
        }
      } else if (actor.state === 'RETURN_AIRLOCK') {
        const t = Math.min(1.0, actor.timer / 3.0);
        actor.astronautMesh.position.lerpVectors(actor.targetPos, actor.startPos, t);
        if (actor.toolSpark) actor.toolSpark.visible = false;
      }
    }
  }

  // =========================================================================
  // EVENT D: PLANETARY ECLIPSE
  // =========================================================================

  private updatePlanetaryEclipses(dt: number, playerZ: number): void {
    for (const actor of this.planetaryEclipses) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      if (actor.state === 'TRANSIT_APPROACH' && distanceAhead <= 160.0) {
        actor.state = 'SOLAR_ECLIPSE';
        actor.timer = 0;
      } else if (actor.state === 'SOLAR_ECLIPSE' && (distanceAhead <= 30.0 || actor.timer > 4.0)) {
        actor.state = 'CORONA_GLOW';
        actor.timer = 0;
      } else if (actor.state === 'CORONA_GLOW' && (distanceAhead <= -60.0 || actor.timer > 3.0)) {
        actor.state = 'TRANSIT_DEPARTURE';
        actor.timer = 0;
      } else if (actor.state === 'TRANSIT_DEPARTURE' && actor.timer > 3.0) {
        actor.state = 'COMPLETE';
      }

      if (actor.state === 'SOLAR_ECLIPSE' || actor.state === 'CORONA_GLOW') {
        const t = Math.min(1.0, actor.timer / 4.0);
        actor.eclipseBody.position.lerpVectors(actor.startPos, actor.endPos, t);
        const coronaScale = 1.0 + Math.sin(actor.timer * 2.0) * 0.15;
        actor.coronaGlowMesh.scale.set(coronaScale, coronaScale, 1.0);
        actor.coronaGlowMesh.visible = true;
      } else {
        actor.coronaGlowMesh.visible = false;
      }
    }
  }

  // =========================================================================
  // EVENT E: METEOR SHOWER & DEBRIS TRAILS
  // =========================================================================

  private updateMeteorShowers(dt: number, playerZ: number): void {
    for (const actor of this.meteorShowers) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      if (actor.state === 'STREAK_ENTRY' && distanceAhead <= 150.0) {
        actor.state = 'ACTIVE_SHOWER';
        actor.timer = 0;
      } else if (actor.state === 'ACTIVE_SHOWER' && (distanceAhead <= -60.0 || actor.timer > 6.0)) {
        actor.state = 'SUBSIDING';
        actor.timer = 0;
      } else if (actor.state === 'SUBSIDING' && actor.timer > 2.0) {
        actor.state = 'COMPLETE';
      }

      if (actor.state === 'ACTIVE_SHOWER' || actor.state === 'STREAK_ENTRY') {
        for (const streak of actor.meteorStreaks) {
          streak.life += dt;
          streak.mesh.position.addScaledVector(streak.velocity, dt);
          if (streak.life >= streak.maxLife) {
            streak.life = 0;
            streak.mesh.position.copy(streak.initialPos);
          }
        }
      }
    }
  }

  // =========================================================================
  // EVENT F: COLOSSAL RESEARCH VESSEL
  // =========================================================================

  private updateColossalVessels(dt: number, playerZ: number): void {
    for (const actor of this.colossalVessels) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      if (actor.state === 'EMERGENCE' && distanceAhead <= 180.0) {
        actor.state = 'TRANSIT_CROSSING';
        actor.timer = 0;
      } else if (actor.state === 'TRANSIT_CROSSING' && (distanceAhead <= 20.0 || actor.timer > 6.0)) {
        actor.state = 'PLANETARY_BACKDROP';
        actor.timer = 0;
      } else if (actor.state === 'PLANETARY_BACKDROP' && (distanceAhead <= -80.0 || actor.timer > 5.0)) {
        actor.state = 'WARP_DEPARTURE';
        actor.timer = 0;
      } else if (actor.state === 'WARP_DEPARTURE' && actor.timer > 3.0) {
        actor.state = 'COMPLETE';
      }

      // Smooth slow majestic flight across planetary vista
      actor.vesselMesh.position.x += dt * 14.0;
      actor.vesselMesh.position.y += Math.sin(actor.timer * 0.5) * dt * 1.5;
      actor.sensorDish.rotation.z += dt * 0.6;

      // Escort fighters flanking
      for (let e = 0; e < actor.escortShuttles.length; e++) {
        const escort = actor.escortShuttles[e];
        escort.position.x += dt * 14.0;
        escort.position.y += Math.sin(actor.timer * 1.5 + e) * dt * 3.0;
      }
    }
  }

  // =========================================================================
  // EVENT G: SOLAR ARRAY TRANSFORMATION
  // =========================================================================

  private updateSolarTransformations(dt: number, playerZ: number): void {
    for (const actor of this.solarTransformations) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      if (actor.state === 'STOWED' && distanceAhead <= 130.0) {
        actor.state = 'ARM_EXTENSION';
        actor.timer = 0;
      } else if (actor.state === 'ARM_EXTENSION' && (distanceAhead <= 65.0 || actor.timer > 2.5)) {
        actor.state = 'WING_UNFOLD';
        actor.timer = 0;
      } else if (actor.state === 'WING_UNFOLD' && (distanceAhead <= 10.0 || actor.timer > 3.0)) {
        actor.state = 'SUN_TRACKING';
        actor.timer = 0;
      }

      if (actor.state === 'ARM_EXTENSION') {
        const t = Math.min(1.0, actor.timer / 2.5);
        actor.mainArm.rotation.z = THREE.MathUtils.lerp(0.0, Math.PI * 0.25, t);
      } else if (actor.state === 'WING_UNFOLD' || actor.state === 'SUN_TRACKING') {
        const t = Math.min(1.0, actor.timer / 3.0);
        actor.wingLeft.rotation.y = THREE.MathUtils.lerp(Math.PI * 0.5, 0.0, t);
        actor.wingRight.rotation.y = THREE.MathUtils.lerp(-Math.PI * 0.5, 0.0, t);
        if (actor.state === 'SUN_TRACKING') {
          // Slow sun tracking rotation
          actor.mainArm.rotation.y += dt * 0.08;
        }
      }
    }
  }

  // =========================================================================
  // EVENT H: ORBITAL CONSTRUCTION SITE
  // =========================================================================

  private updateConstructionSites(dt: number, playerZ: number): void {
    for (const actor of this.constructionSites) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      if (actor.state === 'CRANE_RETRIEVE' && distanceAhead <= 120.0) {
        actor.state = 'ROTATION_ALIGN';
        actor.timer = 0;
      } else if (actor.state === 'ROTATION_ALIGN' && (distanceAhead <= 50.0 || actor.timer > 2.5)) {
        actor.state = 'LOCK_STRUCTURAL';
        actor.timer = 0;
      } else if (actor.state === 'LOCK_STRUCTURAL' && (distanceAhead <= 0.0 || actor.timer > 1.5)) {
        actor.state = 'WELDING_BURST';
        actor.timer = 0;
      }

      if (actor.state === 'CRANE_RETRIEVE' || actor.state === 'ROTATION_ALIGN') {
        const t = Math.min(1.0, actor.timer / 2.5);
        actor.craneArm.rotation.y = THREE.MathUtils.lerp(-0.4, 0.4, t);
        actor.trussModule.position.y = THREE.MathUtils.lerp(18.0, 12.0, t);
      } else if (actor.state === 'WELDING_BURST') {
        // Welding sparks flashing
        for (const spark of actor.weldSparks) {
          spark.visible = Math.sin(actor.timer * 40.0) > 0.15;
        }
      }
    }
  }

  // =========================================================================
  // AMBIENT LIVING SPACE ECOSYSTEM
  // =========================================================================

  private updateAmbientSpaceLife(dt: number): void {
    // 1. Patrol Shuttles along curved flight paths with yaw/roll banking
    for (const shuttle of this.ambient.patrolShuttles) {
      shuttle.phase += shuttle.speed * dt;
      const x = shuttle.basePos.x + Math.cos(shuttle.phase) * shuttle.splineRadiusX;
      const y = shuttle.basePos.y + Math.sin(shuttle.phase * 0.8) * shuttle.splineRadiusY;
      const z = shuttle.basePos.z + Math.sin(shuttle.phase) * 12.0;

      shuttle.mesh.position.set(x, y, z);
      // Banking roll into curves
      shuttle.mesh.rotation.z = -Math.sin(shuttle.phase) * 0.25;
      shuttle.mesh.rotation.y = Math.cos(shuttle.phase) * 0.35;
    }

    // 2. Rotating Radar Dishes & Radio Telescopes
    for (const dish of this.ambient.radarDishes) {
      dish.mesh.rotation.y += dish.rotSpeed * dt;
    }

    // 3. Tracking Solar Panels
    for (const panel of this.ambient.trackingSolarPanels) {
      panel.phase += panel.speed * dt;
      panel.mesh.rotation.y = Math.sin(panel.phase) * 0.35;
    }

    // 4. Maintenance Drones
    for (const drone of this.ambient.maintenanceDrones) {
      drone.phase += dt * 1.5;
      const dx = drone.basePos.x + Math.sin(drone.phase) * drone.radius;
      const dz = drone.basePos.z + Math.cos(drone.phase) * (drone.radius * 0.7);
      drone.mesh.position.set(dx, drone.basePos.y + Math.sin(drone.phase * 2.0) * 0.8, dz);
      drone.lightCone.rotation.z = Math.sin(drone.phase) * 0.2;
    }

    // 5. Navigation Beacons
    for (const beacon of this.ambient.navigationBeacons) {
      beacon.phase += beacon.blinkRate * dt;
      beacon.mesh.visible = Math.sin(beacon.phase) > 0.0;
    }
  }

  // --- Diagnostics & Getters for Testing ---

  public getDiagnostics(): {
    grandDockings: number;
    orbitalRings: number;
    astronautSpacewalks: number;
    planetaryEclipses: number;
    meteorShowers: number;
    colossalVessels: number;
    solarTransformations: number;
    constructionSites: number;
    patrolShuttles: number;
    radarDishes: number;
    trackingSolarPanels: number;
    maintenanceDrones: number;
    navigationBeacons: number;
  } {
    return {
      grandDockings: this.grandDockings.length,
      orbitalRings: this.orbitalRings.length,
      astronautSpacewalks: this.astronautSpacewalks.length,
      planetaryEclipses: this.planetaryEclipses.length,
      meteorShowers: this.meteorShowers.length,
      colossalVessels: this.colossalVessels.length,
      solarTransformations: this.solarTransformations.length,
      constructionSites: this.constructionSites.length,
      patrolShuttles: this.ambient.patrolShuttles.length,
      radarDishes: this.ambient.radarDishes.length,
      trackingSolarPanels: this.ambient.trackingSolarPanels.length,
      maintenanceDrones: this.ambient.maintenanceDrones.length,
      navigationBeacons: this.ambient.navigationBeacons.length
    };
  }

  public getGrandDockings(): readonly GrandSpacecraftDockingActor[] {
    return this.grandDockings;
  }

  public getOrbitalRings(): readonly OrbitalRingAwakeningActor[] {
    return this.orbitalRings;
  }

  public getAstronautSpacewalks(): readonly AstronautSpacewalkActor[] {
    return this.astronautSpacewalks;
  }
}
