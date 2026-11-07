import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';

/**
 * Actor Interfaces for Neon Rainline Cinematic Megacity Encounters
 */

export interface HoverCarActor {
  mesh: THREE.Group;
  cockpitGlass?: THREE.Mesh;
  engineGlow?: THREE.Mesh;
  lightTrail?: THREE.Mesh;
  basePos: THREE.Vector3;
  velocity: THREE.Vector3;
  bankAngle: number;
  flightPathRadius: number;
  flightPathSpeed: number;
  flightPhase: number;
}

export interface AirTrafficSwarmActor {
  group: THREE.Group;
  vehicles: HoverCarActor[];
  triggerZ: number;
  state: 'DISTANT_APPROACH' | 'FORMATION_FLIGHT' | 'BANKING_CROSSOVER' | 'DISPERSING' | 'COMPLETE';
  timer: number;
}

export interface HoloCityAwakeningActor {
  group: THREE.Group;
  landmarkCore: THREE.Mesh;
  concentricRings: THREE.Mesh[];
  holographicPanels: THREE.Mesh[];
  triggerZ: number;
  state: 'STANDBY' | 'RESONANCE_START' | 'GIANT_INSTALLATION' | 'SHAPE_SHIFT' | 'FADING' | 'COMPLETE';
  timer: number;
}

export interface MaglevTrainActor {
  group: THREE.Group;
  trainUpper: THREE.Group;
  trainLower: THREE.Group;
  upperUndercarriageGlow: THREE.Mesh;
  lowerUndercarriageGlow: THREE.Mesh;
  triggerZ: number;
  state: 'APPROACHING' | 'CROSSING_OVERHEAD' | 'RECEDING' | 'COMPLETE';
  timer: number;
}

export interface TechBlackoutActor {
  group: THREE.Group;
  affectedDistrictMeshes: THREE.Mesh[];
  emergencyBeacons: THREE.Mesh[];
  reactorCore: THREE.Mesh;
  triggerZ: number;
  state: 'NORMAL' | 'BLACKOUT_DROP' | 'EMERGENCY_PULSE' | 'CASCADE_RESTORE' | 'COMPLETE';
  timer: number;
}

export interface DroneShowActor {
  group: THREE.Group;
  drones: Array<{ mesh: THREE.Mesh; baseOffset: THREE.Vector3; orbitPhase: number }>;
  triggerZ: number;
  state: 'HOVER_PLAZA' | 'CONSTELLATION_FORM' | 'SPIRAL_ROTATION' | 'DISPERSE' | 'COMPLETE';
  timer: number;
}

export interface SkybridgeTransformActor {
  group: THREE.Group;
  leftSection: THREE.Mesh;
  rightSection: THREE.Mesh;
  centerSpan: THREE.Mesh;
  serviceBots: THREE.Mesh[];
  triggerZ: number;
  state: 'RETRACTED' | 'EXTENDING' | 'FULL_SPAN' | 'ACTIVE_TRANSIT' | 'COMPLETE';
  timer: number;
}

export interface CityStormActor {
  group: THREE.Group;
  lightningPlanes: THREE.Mesh[];
  triggerZ: number;
  state: 'CLEARING' | 'GATHERING_STORM' | 'PEAK_PRECIPITATION' | 'LIGHTNING_PULSE' | 'CALMING';
  timer: number;
}

export interface AmbientCityLife {
  flyingCars: Array<{ mesh: THREE.Group; startX: number; endX: number; y: number; z: number; speed: number; dir: number }>;
  deliveryDrones: Array<{ mesh: THREE.Group; center: THREE.Vector3; radius: number; freq: number; phase: number; rotors: THREE.Mesh[] }>;
  waterTaxis: Array<{ mesh: THREE.Group; canalZ: number; speed: number; minZ: number; maxZ: number }>;
  industrialCranes: Array<{ arm: THREE.Object3D; cable: THREE.Object3D; phase: number; speed: number }>;
  glassElevators: Array<{ mesh: THREE.Group; minY: number; maxY: number; speed: number; curY: number; dir: number }>;
  swayingHoloBanners: Array<{ mesh: THREE.Mesh; phase: number; freq: number }>;
}

/**
 * NeonRainlineEventDirector
 * Orchestrates and animates all 7 cinematic surprises, ambient skyway traffic,
 * drone light shows, maglev crossings, and living city ecosystems with high performance.
 * 
 * SIGNED-DISTANCE CONVENTION:
 * For negative-Z forward travel:
 *   distanceAhead = playerZ - encounterZ
 */
export class NeonRainlineEventDirector {
  private static instance: NeonRainlineEventDirector | null = null;

  private totalTime: number = 0;
  private frameCounter: number = 0;

  // Registered Encounters
  private airTrafficSwarms: AirTrafficSwarmActor[] = [];
  private holoAwakenings: HoloCityAwakeningActor[] = [];
  private maglevCrossovers: MaglevTrainActor[] = [];
  private techBlackouts: TechBlackoutActor[] = [];
  private droneShows: DroneShowActor[] = [];
  private skybridgeTransforms: SkybridgeTransformActor[] = [];
  private cityStorms: CityStormActor[] = [];

  // Ambient Living City Ecosystem
  private ambient: AmbientCityLife = {
    flyingCars: [],
    deliveryDrones: [],
    waterTaxis: [],
    industrialCranes: [],
    glassElevators: [],
    swayingHoloBanners: []
  };

  private constructor() {}

  public static getInstance(): NeonRainlineEventDirector {
    if (!this.instance) {
      this.instance = new NeonRainlineEventDirector();
    }
    return this.instance;
  }

  // --- Registration Methods ---

  public registerAirTrafficSwarm(actor: AirTrafficSwarmActor): void {
    this.airTrafficSwarms.push(actor);
  }

  public registerHoloAwakening(actor: HoloCityAwakeningActor): void {
    this.holoAwakenings.push(actor);
  }

  public registerMaglevCrossover(actor: MaglevTrainActor): void {
    this.maglevCrossovers.push(actor);
  }

  public registerTechBlackout(actor: TechBlackoutActor): void {
    this.techBlackouts.push(actor);
  }

  public registerDroneShow(actor: DroneShowActor): void {
    this.droneShows.push(actor);
  }

  public registerSkybridgeTransform(actor: SkybridgeTransformActor): void {
    this.skybridgeTransforms.push(actor);
  }

  public registerCityStorm(actor: CityStormActor): void {
    this.cityStorms.push(actor);
  }

  public registerFlyingCar(mesh: THREE.Group, startX: number, endX: number, y: number, z: number, speed: number = 42.0, dir: number = 1): void {
    this.ambient.flyingCars.push({ mesh, startX, endX, y, z, speed, dir });
  }

  public registerDeliveryDrone(mesh: THREE.Group, center: THREE.Vector3, radius: number = 4.5, freq: number = 1.4, phase: number = 0, rotors: THREE.Mesh[] = []): void {
    this.ambient.deliveryDrones.push({ mesh, center: center.clone(), radius, freq, phase, rotors });
  }

  public registerWaterTaxi(mesh: THREE.Group, canalZ: number, speed: number = 8.5, minZ: number = -60, maxZ: number = 60): void {
    this.ambient.waterTaxis.push({ mesh, canalZ, speed, minZ, maxZ });
  }

  public registerIndustrialCrane(arm: THREE.Object3D, cable: THREE.Object3D, phase: number = 0, speed: number = 0.6): void {
    this.ambient.industrialCranes.push({ arm, cable, phase, speed });
  }

  public registerGlassElevator(mesh: THREE.Group, minY: number, maxY: number, speed: number = 12.0): void {
    this.ambient.glassElevators.push({ mesh, minY, maxY, speed, curY: minY + (maxY - minY) * 0.5, dir: 1 });
  }

  public registerSwayingHoloBanner(mesh: THREE.Mesh, phase: number = 0, freq: number = 1.5): void {
    this.ambient.swayingHoloBanners.push({ mesh, phase, freq });
  }

  // --- Lifecycle & Pruning ---

  public reset(): void {
    this.airTrafficSwarms.length = 0;
    this.holoAwakenings.length = 0;
    this.maglevCrossovers.length = 0;
    this.techBlackouts.length = 0;
    this.droneShows.length = 0;
    this.skybridgeTransforms.length = 0;
    this.cityStorms.length = 0;
    this.ambient.flyingCars.length = 0;
    this.ambient.deliveryDrones.length = 0;
    this.ambient.waterTaxis.length = 0;
    this.ambient.industrialCranes.length = 0;
    this.ambient.glassElevators.length = 0;
    this.ambient.swayingHoloBanners.length = 0;
    this.totalTime = 0;
    this.frameCounter = 0;
  }

  private isDetached(obj: THREE.Object3D): boolean {
    let current: THREE.Object3D | null = obj;
    while (current) {
      if (!current.parent) {
        return current.type !== 'Scene';
      }
      current = current.parent;
    }
    return true;
  }

  private pruneDetached(): void {
    this.airTrafficSwarms = this.airTrafficSwarms.filter((a) => !this.isDetached(a.group));
    this.holoAwakenings = this.holoAwakenings.filter((a) => !this.isDetached(a.group));
    this.maglevCrossovers = this.maglevCrossovers.filter((a) => !this.isDetached(a.group));
    this.techBlackouts = this.techBlackouts.filter((a) => !this.isDetached(a.group));
    this.droneShows = this.droneShows.filter((a) => !this.isDetached(a.group));
    this.skybridgeTransforms = this.skybridgeTransforms.filter((a) => !this.isDetached(a.group));
    this.cityStorms = this.cityStorms.filter((a) => !this.isDetached(a.group));
    this.ambient.flyingCars = this.ambient.flyingCars.filter((a) => !this.isDetached(a.mesh));
    this.ambient.deliveryDrones = this.ambient.deliveryDrones.filter((a) => !this.isDetached(a.mesh));
    this.ambient.waterTaxis = this.ambient.waterTaxis.filter((a) => !this.isDetached(a.mesh));
    this.ambient.industrialCranes = this.ambient.industrialCranes.filter((a) => !this.isDetached(a.arm));
    this.ambient.glassElevators = this.ambient.glassElevators.filter((a) => !this.isDetached(a.mesh));
    this.ambient.swayingHoloBanners = this.ambient.swayingHoloBanners.filter((a) => !this.isDetached(a.mesh));
  }

  // --- Main Update Loop ---

  public update(dt: number, isCurrentTheme: boolean, playerZ: number = 0): void {
    if (!isCurrentTheme) return;

    this.totalTime += dt;
    this.frameCounter++;

    if (this.frameCounter % 45 === 0) {
      this.pruneDetached();
    }

    const t = this.totalTime;
    const reducedMotion = SettingsManager.getInstance().isReducedMotion();
    const motionScale = reducedMotion ? 0.35 : 1.0;

    let pZ = playerZ;
    if (typeof window !== 'undefined' && (!pZ || pZ === 0)) {
      const game = (window as any).__METRO_GAME__;
      if (game && game.getPlayer && game.getPlayer()) {
        pZ = game.getPlayer().position.z;
      }
    }

    // =========================================================================
    // GATE B & SURPRISE 1: THE FUTURISTIC AIR-TRAFFIC SWARM
    // =========================================================================
    for (let i = 0; i < this.airTrafficSwarms.length; i++) {
      const swarm = this.airTrafficSwarms[i];
      const distanceAhead = pZ - swarm.triggerZ;
      swarm.timer += dt;

      if (distanceAhead > 140) {
        swarm.state = 'DISTANT_APPROACH';
      } else if (distanceAhead > 70) {
        swarm.state = 'FORMATION_FLIGHT';
      } else if (distanceAhead > -30) {
        swarm.state = 'BANKING_CROSSOVER';
      } else if (distanceAhead > -120) {
        swarm.state = 'DISPERSING';
      } else {
        swarm.state = 'COMPLETE';
      }

      // Animate sculpted hover vehicles along dynamic flight routes
      for (let v = 0; v < swarm.vehicles.length; v++) {
        const car = swarm.vehicles[v];
        const carT = (t * car.flightPathSpeed + car.flightPhase) * motionScale;

        // Smooth flight curve traversing across the city
        const flightX = car.basePos.x + Math.sin(carT) * car.flightPathRadius;
        const flightY = car.basePos.y + Math.sin(carT * 1.8) * 2.2;
        const flightZ = car.basePos.z + Math.cos(carT * 0.7) * (car.flightPathRadius * 0.8);

        car.mesh.position.set(flightX, flightY, flightZ);

        // Realistic banking roll into curves
        const targetRoll = Math.cos(carT) * -0.28 * motionScale;
        car.mesh.rotation.z = targetRoll;
        car.mesh.rotation.y = Math.sin(carT * 0.7) * 0.45;

        // Engine glow pulsating with thrust
        if (car.engineGlow) {
          const thrust = 0.85 + 0.35 * Math.sin(carT * 4.0);
          car.engineGlow.scale.set(thrust, thrust, 1.0);
        }
      }
    }

    // =========================================================================
    // SURPRISE 2: THE HOLOGRAPHIC CITY AWAKENS
    // =========================================================================
    for (let i = 0; i < this.holoAwakenings.length; i++) {
      const holo = this.holoAwakenings[i];
      const distanceAhead = pZ - holo.triggerZ;
      holo.timer += dt;

      if (distanceAhead > 130) {
        holo.state = 'STANDBY';
      } else if (distanceAhead > 75) {
        holo.state = 'RESONANCE_START';
      } else if (distanceAhead > 15) {
        holo.state = 'GIANT_INSTALLATION';
      } else if (distanceAhead > -40) {
        holo.state = 'SHAPE_SHIFT';
      } else if (distanceAhead > -110) {
        holo.state = 'FADING';
      } else {
        holo.state = 'COMPLETE';
      }

      // Concentric rings rotation and expansion
      for (let r = 0; r < holo.concentricRings.length; r++) {
        const ring = holo.concentricRings[r];
        const dir = r % 2 === 0 ? 1 : -1;
        ring.rotation.y += dt * 0.85 * dir * motionScale;
        ring.rotation.x = Math.sin(t * 1.2 + r) * 0.15 * motionScale;

        if (holo.state === 'GIANT_INSTALLATION' || holo.state === 'SHAPE_SHIFT') {
          const s = 1.0 + 0.22 * Math.sin(t * 2.5 + r * 1.2);
          ring.scale.set(s, s, s);
        }
      }

      // Rotating holographic panels
      for (let p = 0; p < holo.holographicPanels.length; p++) {
        const panel = holo.holographicPanels[p];
        panel.rotation.y += dt * 0.45 * motionScale;
        panel.position.y += Math.sin(t * 1.6 + p) * 0.05 * motionScale;
      }
    }

    // =========================================================================
    // SURPRISE 3: THE MAGLEV TRANSIT CROSSOVER
    // =========================================================================
    for (let i = 0; i < this.maglevCrossovers.length; i++) {
      const maglev = this.maglevCrossovers[i];
      const distanceAhead = pZ - maglev.triggerZ;
      maglev.timer += dt;

      if (distanceAhead > 120) {
        maglev.state = 'APPROACHING';
      } else if (distanceAhead > -35) {
        maglev.state = 'CROSSING_OVERHEAD';
      } else if (distanceAhead > -110) {
        maglev.state = 'RECEDING';
      } else {
        maglev.state = 'COMPLETE';
      }

      // High-speed upper and lower gliding sky trains moving in opposite directions
      const upperSpeed = 48.0 * motionScale;
      const lowerSpeed = 38.0 * motionScale;

      maglev.trainUpper.position.z += dt * upperSpeed;
      if (maglev.trainUpper.position.z > 140) {
        maglev.trainUpper.position.z = -140;
      }

      maglev.trainLower.position.z -= dt * lowerSpeed;
      if (maglev.trainLower.position.z < -140) {
        maglev.trainLower.position.z = 140;
      }

      // Undercarriage magnetic induction field glow pulse
      const magPulse1 = 0.85 + 0.25 * Math.sin(t * 8.0);
      const magPulse2 = 0.85 + 0.25 * Math.cos(t * 7.5);
      maglev.upperUndercarriageGlow.scale.set(magPulse1, 1.0, 1.0);
      maglev.lowerUndercarriageGlow.scale.set(magPulse2, 1.0, 1.0);
    }

    // =========================================================================
    // SURPRISE 4: THE TECHNOLOGY BLACKOUT & CASCADING RESTORE
    // =========================================================================
    for (let i = 0; i < this.techBlackouts.length; i++) {
      const blackout = this.techBlackouts[i];
      const distanceAhead = pZ - blackout.triggerZ;
      blackout.timer += dt;

      if (distanceAhead > 110) {
        blackout.state = 'NORMAL';
      } else if (distanceAhead > 60) {
        blackout.state = 'BLACKOUT_DROP';
      } else if (distanceAhead > 10) {
        blackout.state = 'EMERGENCY_PULSE';
      } else if (distanceAhead > -50) {
        blackout.state = 'CASCADE_RESTORE';
      } else {
        blackout.state = 'COMPLETE';
      }

      if (blackout.state === 'BLACKOUT_DROP') {
        for (let m = 0; m < blackout.affectedDistrictMeshes.length; m++) {
          blackout.affectedDistrictMeshes[m].visible = false;
        }
      } else if (blackout.state === 'EMERGENCY_PULSE') {
        // Slow pulsing amber/red emergency beacons (smooth, non-strobing)
        const pulse = 0.4 + 0.6 * Math.sin(t * 2.2);
        for (let b = 0; b < blackout.emergencyBeacons.length; b++) {
          blackout.emergencyBeacons[b].visible = pulse > 0.5;
        }
      } else if (blackout.state === 'CASCADE_RESTORE' || blackout.state === 'NORMAL') {
        // Sequentially restore buildings
        for (let m = 0; m < blackout.affectedDistrictMeshes.length; m++) {
          blackout.affectedDistrictMeshes[m].visible = true;
        }
        for (let b = 0; b < blackout.emergencyBeacons.length; b++) {
          blackout.emergencyBeacons[b].visible = false;
        }
      }
    }

    // =========================================================================
    // SURPRISE 5: THE MEGACITY DRONE LIGHT SHOW
    // =========================================================================
    for (let i = 0; i < this.droneShows.length; i++) {
      const droneShow = this.droneShows[i];
      const distanceAhead = pZ - droneShow.triggerZ;
      droneShow.timer += dt;

      if (distanceAhead > 130) {
        droneShow.state = 'HOVER_PLAZA';
      } else if (distanceAhead > 70) {
        droneShow.state = 'CONSTELLATION_FORM';
      } else if (distanceAhead > 10) {
        droneShow.state = 'SPIRAL_ROTATION';
      } else if (distanceAhead > -50) {
        droneShow.state = 'DISPERSE';
      } else {
        droneShow.state = 'COMPLETE';
      }

      // Coordinate swarm formation motion above plaza
      const dCount = droneShow.drones.length;
      for (let d = 0; d < dCount; d++) {
        const drone = droneShow.drones[d];
        const dtPhase = t * 1.5 * motionScale + drone.orbitPhase;

        if (droneShow.state === 'SPIRAL_ROTATION') {
          // Dynamic spiral constellation
          const r = 5.0 + Math.sin(dtPhase * 0.8) * 3.5;
          const x = drone.baseOffset.x + Math.cos(dtPhase) * r;
          const z = drone.baseOffset.z + Math.sin(dtPhase) * r;
          const y = drone.baseOffset.y + Math.sin(dtPhase * 2.0) * 1.8;
          drone.mesh.position.set(x, y, z);
        } else if (droneShow.state === 'CONSTELLATION_FORM') {
          // Geometric diamond structure
          const targetY = drone.baseOffset.y + Math.sin(dtPhase) * 0.8;
          drone.mesh.position.set(drone.baseOffset.x, targetY, drone.baseOffset.z);
        } else {
          // Gentle floating hover
          drone.mesh.position.y = drone.baseOffset.y + Math.sin(dtPhase) * 0.4;
        }

        // Drone LED beacon brightness pulse
        drone.mesh.scale.setScalar(0.85 + 0.3 * Math.sin(dtPhase * 3.0));
      }
    }

    // =========================================================================
    // SURPRISE 6: THE SKYBRIDGE TRANSFORMATION
    // =========================================================================
    for (let i = 0; i < this.skybridgeTransforms.length; i++) {
      const bridge = this.skybridgeTransforms[i];
      const distanceAhead = pZ - bridge.triggerZ;
      bridge.timer += dt;

      if (distanceAhead > 110) {
        bridge.state = 'RETRACTED';
      } else if (distanceAhead > 60) {
        bridge.state = 'EXTENDING';
      } else if (distanceAhead > 0) {
        bridge.state = 'FULL_SPAN';
      } else if (distanceAhead > -60) {
        bridge.state = 'ACTIVE_TRANSIT';
      } else {
        bridge.state = 'COMPLETE';
      }

      if (bridge.state === 'EXTENDING' || bridge.state === 'FULL_SPAN' || bridge.state === 'ACTIVE_TRANSIT') {
        // Telescopic mechanical bridge extension
        const extendProgress = THREE.MathUtils.clamp((110 - distanceAhead) / 50.0, 0, 1.0);
        bridge.centerSpan.scale.set(1.0, 1.0, extendProgress);

        // Walking maintenance service bots
        for (let b = 0; b < bridge.serviceBots.length; b++) {
          const bot = bridge.serviceBots[b];
          bot.position.x = Math.sin(t * 1.2 + b * 2.0) * 8.0 * extendProgress;
          bot.position.y = 0.4 + Math.abs(Math.sin(t * 4.0 + b)) * 0.15;
        }
      }
    }

    // =========================================================================
    // SURPRISE 7: THE RAINSTORM OVER THE CITY
    // =========================================================================
    for (let i = 0; i < this.cityStorms.length; i++) {
      const storm = this.cityStorms[i];
      const distanceAhead = pZ - storm.triggerZ;
      storm.timer += dt;

      if (distanceAhead > 120) {
        storm.state = 'CLEARING';
      } else if (distanceAhead > 70) {
        storm.state = 'GATHERING_STORM';
      } else if (distanceAhead > 10) {
        storm.state = 'PEAK_PRECIPITATION';
      } else if (distanceAhead > -40) {
        storm.state = 'LIGHTNING_PULSE';
      } else {
        storm.state = 'CALMING';
      }

      // Restrained soft horizon sheet lightning (smooth, non-epileptogenic, reduced-motion aware)
      for (let l = 0; l < storm.lightningPlanes.length; l++) {
        const sheet = storm.lightningPlanes[l];
        if (storm.state === 'LIGHTNING_PULSE' && !reducedMotion) {
          const pulse = Math.sin(t * 3.5 + l * 1.8);
          sheet.visible = pulse > 0.88;
        } else {
          sheet.visible = false;
        }
      }
    }

    // =========================================================================
    // AMBIENT LIVING CITY ECOSYSTEM ANIMATION
    // =========================================================================

    // 1. Cruising Flying Cars along aerial traffic corridors
    for (let c = 0; c < this.ambient.flyingCars.length; c++) {
      const car = this.ambient.flyingCars[c];
      car.mesh.position.x += dt * car.speed * car.dir * motionScale;

      if (car.dir > 0 && car.mesh.position.x > car.endX) {
        car.mesh.position.x = car.startX;
      } else if (car.dir < 0 && car.mesh.position.x < car.endX) {
        car.mesh.position.x = car.startX;
      }
      // Floating altitude bob
      car.mesh.position.y = car.y + Math.sin(t * 1.8 + c) * 0.8;
    }

    // 2. Patrolling Delivery Drones with spinning rotors
    for (let d = 0; d < this.ambient.deliveryDrones.length; d++) {
      const drone = this.ambient.deliveryDrones[d];
      const dtAngle = t * drone.freq * motionScale + drone.phase;
      drone.mesh.position.x = drone.center.x + Math.cos(dtAngle) * drone.radius;
      drone.mesh.position.z = drone.center.z + Math.sin(dtAngle) * (drone.radius * 0.6);
      drone.mesh.position.y = drone.center.y + Math.sin(dtAngle * 2.2) * 0.9;
      drone.mesh.rotation.y = -dtAngle + Math.PI * 0.5;

      for (let r = 0; r < drone.rotors.length; r++) {
        drone.rotors[r].rotation.y += dt * 35.0;
      }
    }

    // 3. Gliding Water Taxis along canal waterways
    for (let w = 0; w < this.ambient.waterTaxis.length; w++) {
      const taxi = this.ambient.waterTaxis[w];
      taxi.mesh.position.z -= dt * taxi.speed * motionScale;
      if (taxi.mesh.position.z < taxi.minZ) {
        taxi.mesh.position.z = taxi.maxZ;
      }
      taxi.mesh.position.y = 0.2 + Math.sin(t * 1.5 + w) * 0.08;
      taxi.mesh.rotation.z = Math.sin(t * 1.2 + w) * 0.04;
    }

    // 4. Industrial Cranes swinging back and forth with cargo
    for (let cr = 0; cr < this.ambient.industrialCranes.length; cr++) {
      const crane = this.ambient.industrialCranes[cr];
      const angle = Math.sin(t * crane.speed * motionScale + crane.phase) * 0.45;
      crane.arm.rotation.y = angle;
      crane.cable.rotation.z = -angle * 0.12;
    }

    // 5. Skyscraper Glass Elevators ascending and descending
    for (let e = 0; e < this.ambient.glassElevators.length; e++) {
      const elev = this.ambient.glassElevators[e];
      elev.curY += dt * elev.speed * elev.dir * motionScale;
      if (elev.curY > elev.maxY) {
        elev.curY = elev.maxY;
        elev.dir = -1;
      } else if (elev.curY < elev.minY) {
        elev.curY = elev.minY;
        elev.dir = 1;
      }
      elev.mesh.position.y = elev.curY;
    }

    // 6. Swaying Holographic Banners
    for (let b = 0; b < this.ambient.swayingHoloBanners.length; b++) {
      const banner = this.ambient.swayingHoloBanners[b];
      banner.mesh.rotation.y = Math.sin(t * banner.freq * motionScale + banner.phase) * 0.18 * motionScale;
    }
  }

  // --- Diagnostics & Getters ---

  public getDiagnostics(): Record<string, number> {
    return {
      airTrafficSwarms: this.airTrafficSwarms.length,
      holoAwakenings: this.holoAwakenings.length,
      maglevCrossovers: this.maglevCrossovers.length,
      techBlackouts: this.techBlackouts.length,
      droneShows: this.droneShows.length,
      skybridgeTransforms: this.skybridgeTransforms.length,
      cityStorms: this.cityStorms.length,
      flyingCars: this.ambient.flyingCars.length,
      deliveryDrones: this.ambient.deliveryDrones.length,
      waterTaxis: this.ambient.waterTaxis.length,
      industrialCranes: this.ambient.industrialCranes.length,
      glassElevators: this.ambient.glassElevators.length,
      swayingHoloBanners: this.ambient.swayingHoloBanners.length
    };
  }

  public getAirTrafficSwarms(): readonly AirTrafficSwarmActor[] {
    return this.airTrafficSwarms;
  }

  public getHoloAwakenings(): readonly HoloCityAwakeningActor[] {
    return this.holoAwakenings;
  }

  public getMaglevCrossovers(): readonly MaglevTrainActor[] {
    return this.maglevCrossovers;
  }

  public getTechBlackouts(): readonly TechBlackoutActor[] {
    return this.techBlackouts;
  }

  public getDroneShows(): readonly DroneShowActor[] {
    return this.droneShows;
  }

  public getSkybridgeTransforms(): readonly SkybridgeTransformActor[] {
    return this.skybridgeTransforms;
  }

  public getCityStorms(): readonly CityStormActor[] {
    return this.cityStorms;
  }
}
