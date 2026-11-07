import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';

/**
 * Actor Interfaces for Doomsday Apocalypse Disaster Events
 */

export interface SkyscraperCollapseActor {
  group: THREE.Group;
  baseTower: THREE.Mesh;
  upperCrown: THREE.Group;
  supportBeams: THREE.Mesh[];
  fallingChunks: Array<{ mesh: THREE.Mesh; velocity: THREE.Vector3; rotSpeed: THREE.Vector3; initialPos: THREE.Vector3 }>;
  dustPlume: THREE.Group;
  sparks: THREE.Mesh[];
  triggerZ: number;
  state: 'ANTICIPATION' | 'STRUCTURAL_FAIL' | 'COLLAPSING' | 'IMPACT_DUST' | 'AFTERMATH' | 'COMPLETE';
  timer: number;
}

export interface MeteorImpactActor {
  group: THREE.Group;
  meteorMesh: THREE.Group;
  startPos: THREE.Vector3;
  impactPos: THREE.Vector3;
  fireballPlume: THREE.Group;
  shockwaveRing: THREE.Mesh;
  triggerZ: number;
  state: 'ENTRY_APPROACH' | 'ATMOSPHERIC_DESCENT' | 'GROUND_DETONATION' | 'SHOCKWAVE_EXPAND' | 'SETTLING' | 'COMPLETE';
  timer: number;
}

export interface EvacuationConvoyActor {
  group: THREE.Group;
  vehicles: Array<{ mesh: THREE.Group; wheels: THREE.Mesh[]; beaconLight: THREE.Mesh; speed: number }>;
  bridgeRamp: THREE.Mesh;
  searchlightDrones: Array<{ mesh: THREE.Group; lightCone: THREE.Mesh; orbitPhase: number }>;
  rescueHelicopter?: {
    mesh: THREE.Group;
    mainRotor: THREE.Mesh;
    tailRotor: THREE.Mesh;
    searchlight: THREE.Mesh;
    dustPuff: THREE.Mesh;
    startPos: THREE.Vector3;
    landPos: THREE.Vector3;
  };
  triggerZ: number;
  state: 'HIGHWAY_ESCAPE' | 'RAMP_FRACTURE' | 'DRONE_ESCORT' | 'COMPLETE';
  timer: number;
}

export interface LastRescueTrainActor {
  group: THREE.Group;
  locomotive: THREE.Group;
  coaches: THREE.Group[];
  doors: THREE.Mesh[];
  headlights: THREE.Mesh[];
  beaconLights: THREE.Mesh[];
  dustEmitter?: THREE.Group;
  triggerZ: number;
  state: 'STATION_BOARDING' | 'DOORS_CLOSING' | 'THROTTLE_SURGE' | 'DEPARTING' | 'COMPLETE';
  timer: number;
  speed: number;
  targetSpeed: number;
}

export interface FracturingSkybridgeActor {
  group: THREE.Group;
  leftSpan: THREE.Mesh;
  rightSpan: THREE.Mesh;
  danglingCar: THREE.Mesh;
  cables: THREE.Mesh[];
  triggerZ: number;
  state: 'TENSION_WARNING' | 'CABLE_SNAP' | 'BRIDGE_DROP' | 'AFTERMATH' | 'COMPLETE';
  timer: number;
}

export interface IndustrialFirestormActor {
  group: THREE.Group;
  tanks: THREE.Mesh[];
  fireJets: THREE.Mesh[];
  explosionPlume: THREE.Group;
  triggerZ: number;
  state: 'PRESSURE_VENT' | 'SECONDARY_IGNITION' | 'DETONATION' | 'SMOKE_VORTEX' | 'COMPLETE';
  timer: number;
}

export interface FinalTransitGateActor {
  group: THREE.Group;
  leftDoor: THREE.Mesh;
  rightDoor: THREE.Mesh;
  pistons: THREE.Mesh[];
  warningSirens: THREE.Mesh[];
  triggerZ: number;
  state: 'GATE_OPEN' | 'KLAXON_ALARM' | 'HYDRAULIC_CLOSING' | 'SEALED_AFTERMATH' | 'COMPLETE';
  timer: number;
}

export interface AmbientDisasterLife {
  patrolDrones: Array<{ mesh: THREE.Group; lightCone: THREE.Mesh; basePos: THREE.Vector3; phase: number; radius: number }>;
  emergencyVehicles: Array<{ mesh: THREE.Group; startX: number; endX: number; y: number; z: number; speed: number; dir: number }>;
  smokingBreaches: Array<{ mesh: THREE.Group; rotSpeed: number }>;
  flickeringSearchlights: Array<{ arm: THREE.Object3D; beam: THREE.Mesh; phase: number; speed: number }>;
  electricalArcs: Array<{ mesh: THREE.Mesh; phase: number }>;
}

/**
 * DoomsdayEventDirector
 * Orchestrates and animates all 6 cinematic apocalypse catastrophes, ambient rescue drones,
 * evacuation convoys, collapsing structures, and shockwave propagation with high performance.
 *
 * SIGNED-DISTANCE CONVENTION:
 * For negative-Z forward travel:
 *   distanceAhead = playerZ - triggerZ
 */
export class DoomsdayEventDirector {
  private static instance: DoomsdayEventDirector | null = null;

  private totalTime: number = 0;
  private frameCounter: number = 0;

  // Registered Encounters
  private skyscraperCollapses: SkyscraperCollapseActor[] = [];
  private meteorImpacts: MeteorImpactActor[] = [];
  private evacuationConvoys: EvacuationConvoyActor[] = [];
  private fracturingSkybridges: FracturingSkybridgeActor[] = [];
  private industrialFirestorms: IndustrialFirestormActor[] = [];
  private finalTransitGates: FinalTransitGateActor[] = [];
  private lastRescueTrains: LastRescueTrainActor[] = [];

  // Ambient Living Disaster Ecosystem
  private ambient: AmbientDisasterLife = {
    patrolDrones: [],
    emergencyVehicles: [],
    smokingBreaches: [],
    flickeringSearchlights: [],
    electricalArcs: []
  };

  private constructor() {}

  public static getInstance(): DoomsdayEventDirector {
    if (!this.instance) {
      this.instance = new DoomsdayEventDirector();
    }
    return this.instance;
  }

  // --- Registration Methods ---

  public registerSkyscraperCollapse(actor: SkyscraperCollapseActor): void {
    this.skyscraperCollapses.push(actor);
  }

  public registerMeteorImpact(actor: MeteorImpactActor): void {
    this.meteorImpacts.push(actor);
  }

  public registerEvacuationConvoy(actor: EvacuationConvoyActor): void {
    this.evacuationConvoys.push(actor);
  }

  public registerFracturingSkybridge(actor: FracturingSkybridgeActor): void {
    this.fracturingSkybridges.push(actor);
  }

  public registerIndustrialFirestorm(actor: IndustrialFirestormActor): void {
    this.industrialFirestorms.push(actor);
  }

  public registerFinalTransitGate(actor: FinalTransitGateActor): void {
    this.finalTransitGates.push(actor);
  }

  public registerLastRescueTrain(actor: LastRescueTrainActor): void {
    this.lastRescueTrains.push(actor);
  }

  public registerPatrolDrone(mesh: THREE.Group, lightCone: THREE.Mesh, basePos: THREE.Vector3, radius: number = 10.0): void {
    this.ambient.patrolDrones.push({
      mesh,
      lightCone,
      basePos,
      phase: Math.random() * Math.PI * 2,
      radius
    });
  }

  public registerEmergencyVehicle(mesh: THREE.Group, startX: number, endX: number, y: number, z: number, speed: number = 24.0): void {
    this.ambient.emergencyVehicles.push({
      mesh,
      startX,
      endX,
      y,
      z,
      speed,
      dir: startX < endX ? 1 : -1
    });
  }

  public registerSmokingBreach(mesh: THREE.Group, rotSpeed: number = 0.4): void {
    this.ambient.smokingBreaches.push({ mesh, rotSpeed });
  }

  public registerSearchlight(arm: THREE.Object3D, beam: THREE.Mesh, phase: number = 0, speed: number = 1.2): void {
    this.ambient.flickeringSearchlights.push({ arm, beam, phase, speed });
  }

  public registerElectricalArc(mesh: THREE.Mesh, phase: number = 0): void {
    this.ambient.electricalArcs.push({ mesh, phase });
  }

  // --- Lifecycle & Pruning ---

  public reset(): void {
    this.skyscraperCollapses = [];
    this.meteorImpacts = [];
    this.evacuationConvoys = [];
    this.fracturingSkybridges = [];
    this.industrialFirestorms = [];
    this.finalTransitGates = [];
    this.lastRescueTrains = [];
    this.ambient = {
      patrolDrones: [],
      emergencyVehicles: [],
      smokingBreaches: [],
      flickeringSearchlights: [],
      electricalArcs: []
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

    this.skyscraperCollapses = this.skyscraperCollapses.filter(a => isAttached(a.group));
    this.meteorImpacts = this.meteorImpacts.filter(a => isAttached(a.group));
    this.evacuationConvoys = this.evacuationConvoys.filter(a => isAttached(a.group));
    this.fracturingSkybridges = this.fracturingSkybridges.filter(a => isAttached(a.group));
    this.industrialFirestorms = this.industrialFirestorms.filter(a => isAttached(a.group));
    this.finalTransitGates = this.finalTransitGates.filter(a => isAttached(a.group));
    this.lastRescueTrains = this.lastRescueTrains.filter(a => isAttached(a.group));

    this.ambient.patrolDrones = this.ambient.patrolDrones.filter(d => isAttached(d.mesh));
    this.ambient.emergencyVehicles = this.ambient.emergencyVehicles.filter(v => isAttached(v.mesh));
    this.ambient.smokingBreaches = this.ambient.smokingBreaches.filter(s => isAttached(s.mesh));
    this.ambient.flickeringSearchlights = this.ambient.flickeringSearchlights.filter(s => isAttached(s.arm));
    this.ambient.electricalArcs = this.ambient.electricalArcs.filter(e => isAttached(e.mesh));
  }

  // --- Main Tick Update ---

  public update(dt: number, isActive: boolean, playerZ: number = 0): void {
    if (!isActive) return;

    const delta = Math.min(dt, 0.1);
    this.totalTime += delta;
    this.frameCounter++;

    // Prune detached actors every 180 frames (~3s at 60fps)
    if (this.frameCounter % 180 === 0) {
      this.pruneDetached();
    }

    // 1. Animate Event A: The Collapsing Skyscraper
    this.updateSkyscraperCollapses(delta, playerZ);

    // 2. Animate Event B: The Meteor Impact
    this.updateMeteorImpacts(delta, playerZ);

    // 3. Animate Event C: The Last Evacuation Convoy
    this.updateEvacuationConvoys(delta, playerZ);

    // 4. Animate Event D: The Fracturing Skybridge
    this.updateFracturingSkybridges(delta, playerZ);

    // 5. Animate Event E: Industrial Firestorm
    this.updateIndustrialFirestorms(delta, playerZ);

    // 6. Animate Event F: The Final Transit Gate
    this.updateFinalTransitGates(delta, playerZ);

    // 7. Animate Event C: The Last Rescue Train & Evacuation Viaduct
    this.updateLastRescueTrains(delta, playerZ);

    // 8. Animate Dynamic Ambient Disaster Ecosystem
    this.updateAmbientDisasterLife(delta);
  }

  // =========================================================================
  // DISASTER 1: THE COLLAPSING SKYSCRAPER (Event A)
  // =========================================================================

  private updateSkyscraperCollapses(dt: number, playerZ: number): void {
    for (const actor of this.skyscraperCollapses) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      // State Progression based on signed distance
      if (actor.state === 'ANTICIPATION' && distanceAhead <= 140.0) {
        actor.state = 'STRUCTURAL_FAIL';
        actor.timer = 0;
      } else if (actor.state === 'STRUCTURAL_FAIL' && (distanceAhead <= 90.0 || actor.timer > 2.0)) {
        actor.state = 'COLLAPSING';
        actor.timer = 0;
      } else if (actor.state === 'COLLAPSING' && (distanceAhead <= 25.0 || actor.timer > 2.8)) {
        actor.state = 'IMPACT_DUST';
        actor.timer = 0;
      } else if (actor.state === 'IMPACT_DUST' && (distanceAhead <= -40.0 || actor.timer > 3.5)) {
        actor.state = 'AFTERMATH';
        actor.timer = 0;
      } else if (actor.state === 'AFTERMATH' && distanceAhead <= -120.0) {
        actor.state = 'COMPLETE';
      }

      // Visual Animation Logic
      if (actor.state === 'STRUCTURAL_FAIL') {
        // Warning beacons strobe and internal sparks flash
        for (let s = 0; s < actor.sparks.length; s++) {
          actor.sparks[s].visible = Math.sin(this.totalTime * 25.0 + s) > 0.0;
        }
        // Micro-tremor shudder
        actor.upperCrown.position.x = Math.sin(actor.timer * 35.0) * 0.18;
      } else if (actor.state === 'COLLAPSING') {
        // Believable structural tilt with rotational acceleration
        const progress = Math.min(1.0, actor.timer / 2.6);
        const easeQuad = progress * progress;
        actor.upperCrown.rotation.z = THREE.MathUtils.lerp(0, 0.45, easeQuad);
        actor.upperCrown.rotation.x = THREE.MathUtils.lerp(0, 0.18, easeQuad);
        actor.upperCrown.position.y = THREE.MathUtils.lerp(0, -14.0, easeQuad);
        actor.upperCrown.position.x = THREE.MathUtils.lerp(0, 8.5, easeQuad);

        // Debris chunks break away and fall
        for (const chunk of actor.fallingChunks) {
          chunk.mesh.visible = true;
          chunk.mesh.position.y += chunk.velocity.y * dt;
          chunk.mesh.position.x += chunk.velocity.x * dt;
          chunk.velocity.y -= 18.0 * dt; // Gravity
          chunk.mesh.rotation.x += chunk.rotSpeed.x * dt;
          chunk.mesh.rotation.y += chunk.rotSpeed.y * dt;
        }
      } else if (actor.state === 'IMPACT_DUST' || actor.state === 'AFTERMATH') {
        // Expand and rise dust plume
        actor.dustPlume.visible = true;
        const scale = Math.min(3.2, 1.0 + actor.timer * 0.7);
        actor.dustPlume.scale.set(scale, scale * 1.2, scale);
        actor.dustPlume.position.y += dt * 2.2;
        actor.dustPlume.rotation.y += dt * 0.15;
      }
    }
  }

  // =========================================================================
  // DISASTER 2: THE METEOR IMPACT & SHOCKWAVE (Event B)
  // =========================================================================

  private updateMeteorImpacts(dt: number, playerZ: number): void {
    for (const actor of this.meteorImpacts) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      if (actor.state === 'ENTRY_APPROACH' && distanceAhead <= 180.0) {
        actor.state = 'ATMOSPHERIC_DESCENT';
        actor.timer = 0;
      } else if (actor.state === 'ATMOSPHERIC_DESCENT' && (distanceAhead <= 65.0 || actor.timer > 2.2)) {
        actor.state = 'GROUND_DETONATION';
        actor.timer = 0;
      } else if (actor.state === 'GROUND_DETONATION' && (distanceAhead <= 15.0 || actor.timer > 0.6)) {
        actor.state = 'SHOCKWAVE_EXPAND';
        actor.timer = 0;
      } else if (actor.state === 'SHOCKWAVE_EXPAND' && (distanceAhead <= -50.0 || actor.timer > 4.0)) {
        actor.state = 'SETTLING';
        actor.timer = 0;
      } else if (actor.state === 'SETTLING' && distanceAhead <= -130.0) {
        actor.state = 'COMPLETE';
      }

      // Visual Animation Logic
      if (actor.state === 'ATMOSPHERIC_DESCENT') {
        actor.meteorMesh.visible = true;
        const t = Math.min(1.0, actor.timer / 2.0);
        actor.meteorMesh.position.lerpVectors(actor.startPos, actor.impactPos, t);
        // Trailing angle
        actor.meteorMesh.rotation.z = 0.42;
      } else if (actor.state === 'GROUND_DETONATION') {
        actor.meteorMesh.visible = false;
        actor.fireballPlume.visible = true;
        actor.fireballPlume.position.copy(actor.impactPos);
        actor.fireballPlume.scale.set(1.5, 2.0, 1.5);
      } else if (actor.state === 'SHOCKWAVE_EXPAND') {
        // Spectacular expanding circular shockwave ring
        actor.shockwaveRing.visible = true;
        actor.shockwaveRing.position.set(actor.impactPos.x, 2.0, actor.impactPos.z);
        const ringScale = Math.min(28.0, 2.0 + actor.timer * 7.5);
        actor.shockwaveRing.scale.set(ringScale, ringScale, 1.0);

        // Rising mushroom fireball plume
        actor.fireballPlume.visible = true;
        const plumeScale = Math.min(4.5, 2.0 + actor.timer * 0.8);
        actor.fireballPlume.scale.set(plumeScale, plumeScale * 1.5, plumeScale);
        actor.fireballPlume.position.y = actor.impactPos.y + actor.timer * 5.0;
      } else if (actor.state === 'SETTLING') {
        actor.shockwaveRing.visible = false;
        actor.fireballPlume.visible = true;
        actor.fireballPlume.position.y += dt * 1.5;
      }
    }
  }

  // =========================================================================
  // DISASTER 3: THE LAST EVACUATION CONVOY (Event C)
  // =========================================================================

  private updateEvacuationConvoys(dt: number, playerZ: number): void {
    for (const actor of this.evacuationConvoys) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      if (actor.state === 'HIGHWAY_ESCAPE' && distanceAhead <= 90.0) {
        actor.state = 'RAMP_FRACTURE';
        actor.timer = 0;
      } else if (actor.state === 'RAMP_FRACTURE' && (distanceAhead <= 10.0 || actor.timer > 3.0)) {
        actor.state = 'DRONE_ESCORT';
        actor.timer = 0;
      } else if (actor.state === 'DRONE_ESCORT' && distanceAhead <= -100.0) {
        actor.state = 'COMPLETE';
      }

      // Convoy vehicle motion & rolling wheels
      for (const v of actor.vehicles) {
        v.mesh.position.z -= v.speed * dt;
        for (const w of v.wheels) {
          w.rotation.x += v.speed * dt * 0.8;
        }
        // Strobe emergency lights
        v.beaconLight.visible = Math.sin(this.totalTime * 14.0) > 0.0;
      }

      // Collapsing highway ramp behind the last vehicle
      if (actor.state === 'RAMP_FRACTURE' || actor.state === 'DRONE_ESCORT') {
        const tilt = Math.min(0.38, actor.timer * 0.15);
        actor.bridgeRamp.rotation.x = tilt;
        actor.bridgeRamp.position.y = THREE.MathUtils.lerp(actor.bridgeRamp.position.y, -2.5, dt * 1.8);
      }

      // Hovering searchlight drones
      for (const drone of actor.searchlightDrones) {
        drone.orbitPhase += dt * 1.4;
        drone.mesh.position.y += Math.sin(drone.orbitPhase) * dt * 1.2;
        drone.lightCone.rotation.z = Math.sin(drone.orbitPhase * 0.8) * 0.15;
      }

      // Articulated rescue helicopter landing progression
      if (actor.rescueHelicopter) {
        const chopper = actor.rescueHelicopter;
        chopper.mainRotor.rotation.y += dt * 38.0;
        chopper.tailRotor.rotation.x += dt * 44.0;

        if (actor.state === 'HIGHWAY_ESCAPE') {
          // Approach from sky toward landing pad
          const t = Math.min(1.0, actor.timer / 4.5);
          chopper.mesh.position.lerpVectors(chopper.startPos, chopper.landPos, t);
          chopper.mesh.rotation.z = Math.sin(this.totalTime * 3.0) * 0.08 - 0.06;
          chopper.searchlight.rotation.z = Math.sin(this.totalTime * 2.5) * 0.25;
          chopper.dustPuff.visible = false;
        } else if (actor.state === 'RAMP_FRACTURE' || actor.state === 'DRONE_ESCORT') {
          // Touchdown / hover at landing pad with dust swirl
          chopper.mesh.position.copy(chopper.landPos);
          chopper.mesh.position.y += Math.sin(this.totalTime * 2.0) * 0.15;
          chopper.mesh.rotation.z = 0;
          chopper.searchlight.rotation.z = 0;
          chopper.dustPuff.visible = true;
          const dustScale = 1.0 + Math.sin(this.totalTime * 8.0) * 0.35;
          chopper.dustPuff.scale.set(dustScale, 0.5, dustScale);
        }
      }
    }
  }

  // =========================================================================
  // DISASTER 4: THE FRACTURING SKYBRIDGE (Event D)
  // =========================================================================

  private updateFracturingSkybridges(dt: number, playerZ: number): void {
    for (const actor of this.fracturingSkybridges) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      if (actor.state === 'TENSION_WARNING' && distanceAhead <= 120.0) {
        actor.state = 'CABLE_SNAP';
        actor.timer = 0;
      } else if (actor.state === 'CABLE_SNAP' && (distanceAhead <= 60.0 || actor.timer > 1.8)) {
        actor.state = 'BRIDGE_DROP';
        actor.timer = 0;
      } else if (actor.state === 'BRIDGE_DROP' && (distanceAhead <= -20.0 || actor.timer > 3.2)) {
        actor.state = 'AFTERMATH';
        actor.timer = 0;
      } else if (actor.state === 'AFTERMATH' && distanceAhead <= -100.0) {
        actor.state = 'COMPLETE';
      }

      // Snap cables & tilt severed bridge deck safely in decorative space
      if (actor.state === 'BRIDGE_DROP' || actor.state === 'AFTERMATH') {
        const dropProgress = Math.min(1.0, actor.timer / 2.5);
        actor.rightSpan.rotation.z = -0.25 * dropProgress;
        actor.rightSpan.position.y = 12.2 - 3.8 * dropProgress;
        actor.danglingCar.position.y = 13.8 - 4.5 * dropProgress;
        actor.danglingCar.rotation.z = -0.35 * dropProgress;

        for (const cable of actor.cables) {
          cable.rotation.z = Math.sin(this.totalTime * 8.0) * 0.25;
        }
      }
    }
  }

  // =========================================================================
  // DISASTER 5: INDUSTRIAL FIRESTORM & EXPLOSION (Event E)
  // =========================================================================

  private updateIndustrialFirestorms(dt: number, playerZ: number): void {
    for (const actor of this.industrialFirestorms) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      if (actor.state === 'PRESSURE_VENT' && distanceAhead <= 130.0) {
        actor.state = 'SECONDARY_IGNITION';
        actor.timer = 0;
      } else if (actor.state === 'SECONDARY_IGNITION' && (distanceAhead <= 70.0 || actor.timer > 2.0)) {
        actor.state = 'DETONATION';
        actor.timer = 0;
      } else if (actor.state === 'DETONATION' && (distanceAhead <= 0.0 || actor.timer > 1.2)) {
        actor.state = 'SMOKE_VORTEX';
        actor.timer = 0;
      } else if (actor.state === 'SMOKE_VORTEX' && distanceAhead <= -90.0) {
        actor.state = 'COMPLETE';
      }

      // Fire vents surge
      for (let f = 0; f < actor.fireJets.length; f++) {
        const jet = actor.fireJets[f];
        const s = 1.0 + Math.sin(this.totalTime * 18.0 + f) * 0.45;
        jet.scale.set(1.0, s, 1.0);
      }

      // Detonation plume expansion
      if (actor.state === 'DETONATION' || actor.state === 'SMOKE_VORTEX') {
        actor.explosionPlume.visible = true;
        const scale = Math.min(3.8, 1.0 + actor.timer * 2.2);
        actor.explosionPlume.scale.set(scale, scale * 1.4, scale);
        actor.explosionPlume.position.y += dt * 4.5;
        actor.explosionPlume.rotation.y += dt * 0.28;
      }
    }
  }

  // =========================================================================
  // DISASTER 6: THE FINAL TRANSIT GATE (Event F)
  // =========================================================================

  private updateFinalTransitGates(dt: number, playerZ: number): void {
    for (const actor of this.finalTransitGates) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      if (actor.state === 'GATE_OPEN' && distanceAhead <= 120.0) {
        actor.state = 'KLAXON_ALARM';
        actor.timer = 0;
      } else if (actor.state === 'KLAXON_ALARM' && (distanceAhead <= 75.0 || actor.timer > 1.8)) {
        actor.state = 'HYDRAULIC_CLOSING';
        actor.timer = 0;
      } else if (actor.state === 'HYDRAULIC_CLOSING' && (distanceAhead <= -10.0 || actor.timer > 3.0)) {
        actor.state = 'SEALED_AFTERMATH';
        actor.timer = 0;
      } else if (actor.state === 'SEALED_AFTERMATH' && distanceAhead <= -100.0) {
        actor.state = 'COMPLETE';
      }

      // Klaxon flashing beacons
      for (const siren of actor.warningSirens) {
        siren.visible = Math.sin(this.totalTime * 18.0) > 0.0;
      }

      // Massive sliding blast doors close inward while preserving safe central lane clearance
      if (actor.state === 'HYDRAULIC_CLOSING' || actor.state === 'SEALED_AFTERMATH') {
        const closeProgress = Math.min(1.0, actor.timer / 2.8);
        // Left door slides right (from -12.5m towards -6.2m, staying safely outside running lanes)
        actor.leftDoor.position.x = THREE.MathUtils.lerp(-12.5, -6.2, closeProgress);
        // Right door slides left (from 12.5m towards 6.2m)
        actor.rightDoor.position.x = THREE.MathUtils.lerp(12.5, 6.2, closeProgress);

        for (const piston of actor.pistons) {
          piston.scale.x = 1.0 + closeProgress * 0.8;
        }
      }
    }
  }

  // =========================================================================
  // DISASTER 7: THE LAST RESCUE TRAIN (Event C - Parallel Viaduct Line)
  // =========================================================================

  private updateLastRescueTrains(dt: number, playerZ: number): void {
    for (const actor of this.lastRescueTrains) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      if (actor.state === 'STATION_BOARDING' && distanceAhead <= 140.0) {
        actor.state = 'DOORS_CLOSING';
        actor.timer = 0;
      } else if (actor.state === 'DOORS_CLOSING' && (distanceAhead <= 85.0 || actor.timer > 2.0)) {
        actor.state = 'THROTTLE_SURGE';
        actor.timer = 0;
      } else if (actor.state === 'THROTTLE_SURGE' && (distanceAhead <= 40.0 || actor.timer > 1.5)) {
        actor.state = 'DEPARTING';
        actor.timer = 0;
      } else if (actor.state === 'DEPARTING' && distanceAhead <= -160.0) {
        actor.state = 'COMPLETE';
      }

      // Strobe emergency lights along roofline
      for (const b of actor.beaconLights) {
        b.visible = Math.sin(this.totalTime * 20.0) > 0.0;
      }

      // Headlight pulsing and glow
      const headlightIntensity = actor.state === 'STATION_BOARDING' ? 0.7 : 1.0;
      for (const hl of actor.headlights) {
        hl.scale.setScalar(headlightIntensity + Math.sin(this.totalTime * 12.0) * 0.15);
      }

      // Sliding emergency doors animation
      if (actor.state === 'DOORS_CLOSING' || actor.state === 'THROTTLE_SURGE' || actor.state === 'DEPARTING') {
        const doorProgress = Math.min(1.0, actor.timer / 1.6);
        for (let d = 0; d < actor.doors.length; d++) {
          const door = actor.doors[d];
          const dir = d % 2 === 0 ? 1 : -1;
          door.position.x = dir * THREE.MathUtils.lerp(0.85, 0.0, doorProgress);
        }
      }

      // Throttle acceleration and forward motion
      if (actor.state === 'THROTTLE_SURGE') {
        // Minor engine rev vibration
        actor.locomotive.position.y = Math.sin(actor.timer * 40.0) * 0.04;
        actor.speed = THREE.MathUtils.lerp(actor.speed, 12.0, dt * 2.0);
        actor.group.position.z -= actor.speed * dt;
      } else if (actor.state === 'DEPARTING') {
        actor.locomotive.position.y = 0;
        actor.speed = THREE.MathUtils.lerp(actor.speed, actor.targetSpeed, dt * 2.5);
        actor.group.position.z -= actor.speed * dt;

        // Dust / spark emitter
        if (actor.dustEmitter) {
          actor.dustEmitter.visible = true;
          const dustScale = 1.0 + Math.sin(this.totalTime * 10.0) * 0.35;
          actor.dustEmitter.scale.set(dustScale, 1.0, dustScale);
        }
      }
    }
  }

  // =========================================================================
  // AMBIENT LIVING DISASTER ECOSYSTEM
  // =========================================================================

  private updateAmbientDisasterLife(dt: number): void {
    // 1. Patrol Drones with Spotlight Cones
    for (const drone of this.ambient.patrolDrones) {
      drone.phase += dt * 1.6;
      drone.mesh.position.x = drone.basePos.x + Math.sin(drone.phase) * drone.radius;
      drone.mesh.position.z = drone.basePos.z + Math.cos(drone.phase) * (drone.radius * 0.6);
      drone.mesh.position.y = drone.basePos.y + Math.sin(drone.phase * 2.0) * 1.2;
      drone.lightCone.rotation.z = Math.sin(drone.phase) * 0.2;
    }

    // 2. Emergency Evacuation Vehicles
    for (const v of this.ambient.emergencyVehicles) {
      v.mesh.position.x += v.dir * v.speed * dt;
      if (v.dir > 0 && v.mesh.position.x > v.endX) {
        v.mesh.position.x = v.startX;
      } else if (v.dir < 0 && v.mesh.position.x < v.endX) {
        v.mesh.position.x = v.startX;
      }
    }

    // 3. Smoking Structural Breaches
    for (const s of this.ambient.smokingBreaches) {
      s.mesh.rotation.y += s.rotSpeed * dt;
      s.mesh.position.y += dt * 0.8;
      if (s.mesh.position.y > 22.0) {
        s.mesh.position.y = 8.0;
      }
    }

    // 4. Ground Searchlight Towers
    for (const s of this.ambient.flickeringSearchlights) {
      s.phase += s.speed * dt;
      s.arm.rotation.y = Math.sin(s.phase) * 0.65;
      s.arm.rotation.z = Math.cos(s.phase * 0.7) * 0.25;
    }

    // 5. Electrical Arcs
    for (const arc of this.ambient.electricalArcs) {
      arc.phase += dt * 20.0;
      arc.mesh.visible = Math.sin(arc.phase) > 0.4;
    }
  }

  // --- Diagnostics & Getters for Testing ---

  public getDiagnostics(): {
    skyscraperCollapses: number;
    meteorImpacts: number;
    evacuationConvoys: number;
    fracturingSkybridges: number;
    industrialFirestorms: number;
    finalTransitGates: number;
    lastRescueTrains: number;
    patrolDrones: number;
    emergencyVehicles: number;
    smokingBreaches: number;
    searchlights: number;
  } {
    return {
      skyscraperCollapses: this.skyscraperCollapses.length,
      meteorImpacts: this.meteorImpacts.length,
      evacuationConvoys: this.evacuationConvoys.length,
      fracturingSkybridges: this.fracturingSkybridges.length,
      industrialFirestorms: this.industrialFirestorms.length,
      finalTransitGates: this.finalTransitGates.length,
      lastRescueTrains: this.lastRescueTrains.length,
      patrolDrones: this.ambient.patrolDrones.length,
      emergencyVehicles: this.ambient.emergencyVehicles.length,
      smokingBreaches: this.ambient.smokingBreaches.length,
      searchlights: this.ambient.flickeringSearchlights.length
    };
  }

  public getSkyscraperCollapses(): readonly SkyscraperCollapseActor[] {
    return this.skyscraperCollapses;
  }

  public getMeteorImpacts(): readonly MeteorImpactActor[] {
    return this.meteorImpacts;
  }

  public getEvacuationConvoys(): readonly EvacuationConvoyActor[] {
    return this.evacuationConvoys;
  }

  public getFracturingSkybridges(): readonly FracturingSkybridgeActor[] {
    return this.fracturingSkybridges;
  }

  public getIndustrialFirestorms(): readonly IndustrialFirestormActor[] {
    return this.industrialFirestorms;
  }

  public getFinalTransitGates(): readonly FinalTransitGateActor[] {
    return this.finalTransitGates;
  }

  public getLastRescueTrains(): readonly LastRescueTrainActor[] {
    return this.lastRescueTrains;
  }
}
