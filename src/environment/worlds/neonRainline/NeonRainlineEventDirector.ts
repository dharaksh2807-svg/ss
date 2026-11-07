import * as THREE from 'three';
import { EventBus } from '../../../core/EventBus';
import { SettingsManager } from '../../../settings/SettingsManager';
import type {
  HoverCarActor,
  AirTrafficBalletActor,
  FuturisticPlazaAwakeningActor,
  MaglevTrainActor,
  TechBlackoutActor,
  DroneShowActor,
  SkybridgeTransformActor,
  CityStormActor,
  AmbientCityLife
} from './NeonRainlineTheme';

// Re-export actor types for backwards compatibility
export type {
  HoverCarActor,
  AirTrafficBalletActor,
  FuturisticPlazaAwakeningActor,
  MaglevTrainActor,
  TechBlackoutActor,
  DroneShowActor,
  SkybridgeTransformActor,
  CityStormActor,
  AmbientCityLife
};

// Aliases for backwards compatibility with earlier test suites
export type AirTrafficSwarmActor = AirTrafficBalletActor;
export type HoloCityAwakeningActor = FuturisticPlazaAwakeningActor;

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
  private airTrafficBallets: AirTrafficBalletActor[] = [];
  private plazaAwakenings: FuturisticPlazaAwakeningActor[] = [];
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
    swayingHoloBanners: [],
    bioluminescentTrees: []
  };

  private constructor() {
    this.initEventListeners();
  }

  public static getInstance(): NeonRainlineEventDirector {
    if (!this.instance) {
      this.instance = new NeonRainlineEventDirector();
    }
    return this.instance;
  }

  private initEventListeners(): void {
    const bus = EventBus.getInstance();
    bus.on('GAME_RESTART', () => {
      this.reset();
    });

    bus.on('PLAYER_REVIVE', () => {
      // Re-arm dormant states on revive
      for (const a of this.airTrafficBallets) {
        if (a.state === 'COMPLETE') a.state = 'DORMANT';
      }
      for (const a of this.plazaAwakenings) {
        if (a.state === 'COMPLETE') a.state = 'DORMANT';
      }
      for (const a of this.maglevCrossovers) {
        if (a.state === 'COMPLETE') a.state = 'APPROACHING';
      }
    });

    bus.on('TRACK_RECYCLED', () => {
      this.pruneDetached();
    });
  }

  // --- Registration Methods ---

  public registerAirTrafficBallet(actor: AirTrafficBalletActor): void {
    this.airTrafficBallets.push(actor);
  }

  public registerAirTrafficSwarm(actor: AirTrafficBalletActor): void {
    this.registerAirTrafficBallet(actor);
  }

  public registerPlazaAwakening(actor: FuturisticPlazaAwakeningActor): void {
    this.plazaAwakenings.push(actor);
  }

  public registerHoloAwakening(actor: FuturisticPlazaAwakeningActor): void {
    this.registerPlazaAwakening(actor);
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

  public registerFlyingCar(
    mesh: THREE.Group,
    startX: number,
    endX: number,
    y: number,
    z: number,
    speed: number = 42.0,
    dir: number = 1
  ): void {
    this.ambient.flyingCars.push({ mesh, startX, endX, y, z, speed, dir });
  }

  public registerDeliveryDrone(
    mesh: THREE.Group,
    center: THREE.Vector3,
    radius: number = 4.5,
    freq: number = 1.4,
    phase: number = 0,
    rotors: THREE.Mesh[] = []
  ): void {
    this.ambient.deliveryDrones.push({ mesh, center: center.clone(), radius, freq, phase, rotors });
  }

  public registerWaterTaxi(
    mesh: THREE.Group,
    canalZ: number,
    speed: number = 8.5,
    minZ: number = -60,
    maxZ: number = 60
  ): void {
    this.ambient.waterTaxis.push({ mesh, canalZ, speed, minZ, maxZ });
  }

  public registerIndustrialCrane(
    arm: THREE.Object3D,
    cable: THREE.Object3D,
    phase: number = 0,
    speed: number = 0.6
  ): void {
    this.ambient.industrialCranes.push({ arm, cable, phase, speed });
  }

  public registerGlassElevator(
    mesh: THREE.Group,
    minY: number,
    maxY: number,
    speed: number = 12.0
  ): void {
    this.ambient.glassElevators.push({ mesh, minY, maxY, speed, curY: minY + (maxY - minY) * 0.5, dir: 1 });
  }

  public registerSwayingHoloBanner(
    mesh: THREE.Mesh,
    phase: number = 0,
    freq: number = 1.5
  ): void {
    this.ambient.swayingHoloBanners.push({ mesh, phase, freq });
  }

  public registerBioluminescentTree(
    canopy: THREE.Mesh,
    pulsePhase: number = 0
  ): void {
    this.ambient.bioluminescentTrees.push({ canopy, pulsePhase });
  }

  // --- Lifecycle & Pruning ---

  public reset(): void {
    this.airTrafficBallets.length = 0;
    this.plazaAwakenings.length = 0;
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
    this.ambient.bioluminescentTrees.length = 0;
    this.totalTime = 0;
    this.frameCounter = 0;
  }

  private isDetached(obj: THREE.Object3D | null | undefined): boolean {
    let current: THREE.Object3D | null | undefined = obj;
    while (current) {
      if (!current.parent) {
        return current.type !== 'Scene';
      }
      current = current.parent;
    }
    return true;
  }

  public pruneDetached(): void {
    this.airTrafficBallets = this.airTrafficBallets.filter((a) => !this.isDetached(a.group));
    this.plazaAwakenings = this.plazaAwakenings.filter((a) => !this.isDetached(a.group));
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
    this.ambient.bioluminescentTrees = this.ambient.bioluminescentTrees.filter((b) => !this.isDetached(b.canopy));
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
    // FLAGSHIP HERO EVENT A: AIR-TRAFFIC BALLET (6-Stage Lifecycle)
    // =========================================================================
    for (let i = 0; i < this.airTrafficBallets.length; i++) {
      const ballet = this.airTrafficBallets[i];
      const distanceAhead = pZ - ballet.triggerZ;
      ballet.timer += dt;

      // 6-stage lifecycle transitions
      if (distanceAhead > 140) {
        ballet.state = 'DORMANT';
      } else if (distanceAhead > 80) {
        ballet.state = 'ANTICIPATION';
      } else if (distanceAhead > 25) {
        ballet.state = 'ACTION';
      } else if (distanceAhead > -25) {
        ballet.state = 'CLIMAX';
      } else if (distanceAhead > -80) {
        ballet.state = 'AFTERMATH';
      } else {
        ballet.state = 'COMPLETE';
      }

      // Physics-driven hover vehicle flight trajectories with realistic banking
      const vCount = ballet.vehicles.length;
      for (let v = 0; v < vCount; v++) {
        const car = ballet.vehicles[v];
        const routeIdx = car.routeType ?? v;
        const speedMultiplier = 1.0 + routeIdx * 0.15;
        const carT = (t * car.flightPathSpeed * speedMultiplier + car.flightPhase) * motionScale;

        // Spline / orbit evaluation based on state
        let radius = car.flightPathRadius;
        let altOffset = 0;
        let speedBoost = 1.0;

        if (ballet.state === 'ANTICIPATION') {
          speedBoost = 1.2;
          altOffset = Math.sin(carT * 2.0) * 1.5;
        } else if (ballet.state === 'ACTION') {
          speedBoost = 1.6;
          radius *= 0.85; // Tighten formation
          altOffset = Math.sin(carT * 2.5) * 3.0;
        } else if (ballet.state === 'CLIMAX') {
          speedBoost = 2.0; // High speed sweeping dive
          radius *= 0.7;
          altOffset = Math.sin(carT * 3.0) * 4.5;
        } else if (ballet.state === 'AFTERMATH') {
          speedBoost = 1.4;
          radius *= 1.3; // Expand formation outwards into skyline
          altOffset = 6.0 + Math.sin(carT) * 2.0; // Climbing out
        }

        const effectiveT = carT * speedBoost;
        const flightX = car.basePos.x + Math.sin(effectiveT) * radius;
        const flightY = car.basePos.y + altOffset;
        const flightZ = car.basePos.z + Math.cos(effectiveT * 0.8) * (radius * 0.9);

        car.mesh.position.set(flightX, flightY, flightZ);

        // Realistic banking roll proportional to turn rate
        // Tangent angle derivative of (sin(T), cos(0.8 T))
        const turnRate = Math.cos(effectiveT);
        const targetRoll = -turnRate * 0.55 * motionScale;
        // Smoothly interpolate banking roll
        car.bankAngle += (targetRoll - car.bankAngle) * Math.min(1.0, dt * 8.0);
        car.mesh.rotation.z = car.bankAngle;

        // Yaw aligned to trajectory heading
        const heading = Math.atan2(Math.cos(effectiveT), -Math.sin(effectiveT * 0.8) * 0.8);
        car.mesh.rotation.y = heading;

        // Slight pitch tilt into dives
        const pitchAngle = Math.cos(effectiveT * 2.5) * -0.15 * motionScale;
        car.mesh.rotation.x = pitchAngle;

        // Engine glow thrust pulsing
        if (car.engineGlow) {
          const thrust = 0.8 + 0.45 * Math.sin(effectiveT * 6.0) * (ballet.state === 'CLIMAX' ? 1.4 : 1.0);
          car.engineGlow.scale.set(thrust, thrust, 1.0 + thrust * 0.3);
        }
      }
    }

    // =========================================================================
    // FLAGSHIP HERO EVENT B: FUTURISTIC PLAZA AWAKENS (6-Stage Lifecycle)
    // =========================================================================
    for (let i = 0; i < this.plazaAwakenings.length; i++) {
      const plaza = this.plazaAwakenings[i];
      const distanceAhead = pZ - plaza.triggerZ;
      plaza.timer += dt;

      // 6-stage lifecycle transitions
      if (distanceAhead > 130) {
        plaza.state = 'DORMANT';
        plaza.powerLevel = THREE.MathUtils.lerp(plaza.powerLevel, 0.1, dt * 2.0);
      } else if (distanceAhead > 75) {
        plaza.state = 'ANTICIPATION';
        plaza.powerLevel = THREE.MathUtils.lerp(plaza.powerLevel, 0.45, dt * 2.5);
      } else if (distanceAhead > 20) {
        plaza.state = 'ACTION';
        plaza.powerLevel = THREE.MathUtils.lerp(plaza.powerLevel, 0.85, dt * 3.0);
      } else if (distanceAhead > -35) {
        plaza.state = 'CLIMAX';
        plaza.powerLevel = THREE.MathUtils.lerp(plaza.powerLevel, 1.25, dt * 4.0);
      } else if (distanceAhead > -90) {
        plaza.state = 'AFTERMATH';
        plaza.powerLevel = THREE.MathUtils.lerp(plaza.powerLevel, 0.5, dt * 2.0);
      } else {
        plaza.state = 'COMPLETE';
        plaza.powerLevel = THREE.MathUtils.lerp(plaza.powerLevel, 0.2, dt * 1.5);
      }

      const pLevel = plaza.powerLevel;

      // 1. Gyroscopic concentric rings rotation & nutation
      if (plaza.innerRing) {
        plaza.innerRing.rotation.y += dt * 1.8 * pLevel * motionScale;
        plaza.innerRing.rotation.x = Math.sin(t * 2.2) * 0.35 * pLevel * motionScale;
        const innerScale = 1.0 + 0.15 * Math.sin(t * 3.5) * pLevel;
        plaza.innerRing.scale.set(innerScale, innerScale, innerScale);
      }
      if (plaza.outerRing) {
        plaza.outerRing.rotation.y -= dt * 1.2 * pLevel * motionScale; // Counter-rotation
        plaza.outerRing.rotation.z = Math.cos(t * 1.8) * 0.28 * pLevel * motionScale;
        const outerScale = 1.0 + 0.2 * Math.sin(t * 2.8 + 1.0) * pLevel;
        plaza.outerRing.scale.set(outerScale, outerScale, outerScale);
      }

      // 2. Central Superconducting Core elevation (rises 8.5m at peak)
      if (plaza.coreSculpture) {
        const targetElevation = (plaza.state === 'ACTION' || plaza.state === 'CLIMAX')
          ? 6.5 + 4.5 * THREE.MathUtils.clamp(pLevel, 0.5, 1.2)
          : 6.5 + 1.2 * Math.sin(t * 1.5);
        plaza.coreSculpture.position.y = THREE.MathUtils.lerp(
          plaza.coreSculpture.position.y,
          targetElevation,
          dt * 3.0
        );
        const corePulse = 1.0 + 0.25 * Math.sin(t * 5.0) * pLevel;
        plaza.coreSculpture.scale.set(corePulse, corePulse, corePulse);
      }

      // 3. Orbiting Holographic Data Panels
      const panelCount = plaza.holographicPanels ? plaza.holographicPanels.length : 0;
      for (let p = 0; p < panelCount; p++) {
        const panel = plaza.holographicPanels[p];
        const panelAngle = t * 0.8 * motionScale + (p / Math.max(1, panelCount)) * Math.PI * 2;
        const orbitRadius = 8.0 + 2.5 * pLevel;
        panel.position.x = Math.cos(panelAngle) * orbitRadius;
        panel.position.z = Math.sin(panelAngle) * orbitRadius;
        panel.position.y = (plaza.coreSculpture ? plaza.coreSculpture.position.y : 6.5) + Math.sin(t * 2.0 + p) * 1.2;
        panel.rotation.y = -panelAngle + Math.PI * 0.5;
      }

      // 4. Perimeter Lamp Activation Sequence
      if (plaza.perimeterLamps) {
        const lampCount = plaza.perimeterLamps.length;
        for (let l = 0; l < lampCount; l++) {
          const lamp = plaza.perimeterLamps[l];
          const phase = (l / lampCount) * Math.PI * 2;
          const lampBrightness = (Math.sin(t * 3.0 + phase) * 0.5 + 0.5) * pLevel;
          lamp.mesh.scale.setScalar(0.7 + lampBrightness * 0.6);
        }
      }

      // 5. Pedestrian / Maintenance Automatons responding to the plaza center
      if (plaza.pedestrianBots) {
        for (let b = 0; b < plaza.pedestrianBots.length; b++) {
          const bot = plaza.pedestrianBots[b];
          if (plaza.state === 'CLIMAX' || plaza.state === 'ACTION') {
            // Subtle celebratory hop/bob
            bot.position.y = 0.5 + Math.abs(Math.sin(t * 4.0 + b * 1.5)) * 0.25;
          } else {
            bot.position.y = 0.5;
          }
        }
      }
    }

    // =========================================================================
    // CINEMATIC SURPRISE 3: MAGLEV TRANSIT CROSSOVER
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

      // Undercarriage induction glow pulse
      const magPulse1 = 0.85 + 0.25 * Math.sin(t * 8.0);
      const magPulse2 = 0.85 + 0.25 * Math.cos(t * 7.5);
      if (maglev.upperUndercarriageGlow) maglev.upperUndercarriageGlow.scale.set(magPulse1, 1.0, 1.0);
      if (maglev.lowerUndercarriageGlow) maglev.lowerUndercarriageGlow.scale.set(magPulse2, 1.0, 1.0);
    }

    // =========================================================================
    // CINEMATIC SURPRISE 4: TECHNOLOGY BLACKOUT & CASCADING RESTORE
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
        const pulse = 0.4 + 0.6 * Math.sin(t * 2.2);
        for (let b = 0; b < blackout.emergencyBeacons.length; b++) {
          blackout.emergencyBeacons[b].visible = pulse > 0.5;
        }
      } else if (blackout.state === 'CASCADE_RESTORE' || blackout.state === 'NORMAL') {
        for (let m = 0; m < blackout.affectedDistrictMeshes.length; m++) {
          blackout.affectedDistrictMeshes[m].visible = true;
        }
        for (let b = 0; b < blackout.emergencyBeacons.length; b++) {
          blackout.emergencyBeacons[b].visible = false;
        }
      }
    }

    // =========================================================================
    // CINEMATIC SURPRISE 5: MEGACITY DRONE LIGHT SHOW
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

      const dCount = droneShow.drones.length;
      for (let d = 0; d < dCount; d++) {
        const drone = droneShow.drones[d];
        const dtPhase = t * 1.5 * motionScale + drone.orbitPhase;

        if (droneShow.state === 'SPIRAL_ROTATION') {
          const r = 5.0 + Math.sin(dtPhase * 0.8) * 3.5;
          const x = drone.baseOffset.x + Math.cos(dtPhase) * r;
          const z = drone.baseOffset.z + Math.sin(dtPhase) * r;
          const y = drone.baseOffset.y + Math.sin(dtPhase * 2.0) * 1.8;
          drone.mesh.position.set(x, y, z);
        } else if (droneShow.state === 'CONSTELLATION_FORM') {
          const targetY = drone.baseOffset.y + Math.sin(dtPhase) * 0.8;
          drone.mesh.position.set(drone.baseOffset.x, targetY, drone.baseOffset.z);
        } else {
          drone.mesh.position.y = drone.baseOffset.y + Math.sin(dtPhase) * 0.4;
        }

        drone.mesh.scale.setScalar(0.85 + 0.3 * Math.sin(dtPhase * 3.0));
      }
    }

    // =========================================================================
    // CINEMATIC SURPRISE 6: TELESCOPIC SKYBRIDGE TRANSFORMATION
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
        const extendProgress = THREE.MathUtils.clamp((110 - distanceAhead) / 50.0, 0, 1.0);
        if (bridge.centerSpan) {
          bridge.centerSpan.scale.set(1.0, 1.0, extendProgress);
        }

        for (let b = 0; b < bridge.serviceBots.length; b++) {
          const bot = bridge.serviceBots[b];
          bot.position.x = Math.sin(t * 1.2 + b * 2.0) * 8.0 * extendProgress;
          bot.position.y = 0.4 + Math.abs(Math.sin(t * 4.0 + b)) * 0.15;
        }
      }
    }

    // =========================================================================
    // CINEMATIC SURPRISE 7: RAINSTORM OVER THE CITY
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

    // 7. Bioluminescent Cyber Trees Emissive Pulse
    for (let tr = 0; tr < this.ambient.bioluminescentTrees.length; tr++) {
      const tree = this.ambient.bioluminescentTrees[tr];
      const pulse = 0.95 + 0.1 * Math.sin(t * 1.8 + tree.pulsePhase);
      tree.canopy.scale.set(pulse, pulse, pulse);
    }
  }

  // --- Diagnostics & Getters ---

  public getDiagnostics(): Record<string, number> {
    return {
      airTrafficSwarms: this.airTrafficBallets.length,
      airTrafficBallets: this.airTrafficBallets.length,
      holoAwakenings: this.plazaAwakenings.length,
      plazaAwakenings: this.plazaAwakenings.length,
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
      swayingHoloBanners: this.ambient.swayingHoloBanners.length,
      bioluminescentTrees: this.ambient.bioluminescentTrees.length
    };
  }

  public getAirTrafficSwarms(): readonly AirTrafficBalletActor[] {
    return this.airTrafficBallets;
  }

  public getAirTrafficBallets(): readonly AirTrafficBalletActor[] {
    return this.airTrafficBallets;
  }

  public getHoloAwakenings(): readonly FuturisticPlazaAwakeningActor[] {
    return this.plazaAwakenings;
  }

  public getPlazaAwakenings(): readonly FuturisticPlazaAwakeningActor[] {
    return this.plazaAwakenings;
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
