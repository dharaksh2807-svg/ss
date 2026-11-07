import * as THREE from 'three';
import { EventBus } from '../../../core/EventBus';
import {
  GrandSteamArrivalHeroActor,
  HistoricViaductHeroActor,
  ChimneySteamEmitter,
  StationClockActor,
  RailwayWorkerActor,
  SwayingGasLampActor
} from './HistoricQuarterTheme';

/**
 * Historic Railway Quarter Event Director:
 * Manages 6-stage lifecycle for Hero Events (The Grand Steam Arrival & The Historic Viaduct),
 * kinetic chimney steam emissions, animated station clocks, railway workers, and gaslamps.
 */
export class HistoricQuarterEventDirector {
  private static instance: HistoricQuarterEventDirector;

  private grandSteamArrivals: GrandSteamArrivalHeroActor[] = [];
  private historicViaducts: HistoricViaductHeroActor[] = [];
  private chimneySteamEmitters: ChimneySteamEmitter[] = [];
  private stationClocks: StationClockActor[] = [];
  private railwayWorkers: RailwayWorkerActor[] = [];
  private swayingGasLamps: SwayingGasLampActor[] = [];

  private globalTime: number = 0;

  private constructor() {
    this.initEventListeners();
    if (typeof window !== 'undefined') {
      (window as any).__HISTORIC_DIRECTOR__ = this;
    }
  }

  public static getInstance(): HistoricQuarterEventDirector {
    if (!HistoricQuarterEventDirector.instance) {
      HistoricQuarterEventDirector.instance = new HistoricQuarterEventDirector();
    }
    return HistoricQuarterEventDirector.instance;
  }

  // --- Registration API ---

  public registerGrandSteamArrival(actor: GrandSteamArrivalHeroActor): void {
    this.grandSteamArrivals.push(actor);
  }

  public registerHistoricViaduct(actor: HistoricViaductHeroActor): void {
    this.historicViaducts.push(actor);
  }

  public registerChimneySteam(emitter: ChimneySteamEmitter): void {
    this.chimneySteamEmitters.push(emitter);
  }

  public registerStationClock(clock: StationClockActor): void {
    this.stationClocks.push(clock);
  }

  public registerRailwayWorker(worker: RailwayWorkerActor): void {
    this.railwayWorkers.push(worker);
  }

  public registerSwayingGasLamp(lamp: SwayingGasLampActor): void {
    this.swayingGasLamps.push(lamp);
  }

  // --- Getters for Diagnostics & Verifications ---

  public getGrandSteamArrivals(): GrandSteamArrivalHeroActor[] {
    return this.grandSteamArrivals;
  }

  public getHistoricViaducts(): HistoricViaductHeroActor[] {
    return this.historicViaducts;
  }

  public getTotalActiveElements(): number {
    return (
      this.grandSteamArrivals.length +
      this.historicViaducts.length +
      this.chimneySteamEmitters.length +
      this.stationClocks.length +
      this.railwayWorkers.length +
      this.swayingGasLamps.length
    );
  }

  public getGrandSteamArrivalCount(): number {
    return this.grandSteamArrivals.length;
  }

  public getHistoricViaductCount(): number {
    return this.historicViaducts.length;
  }

  public getChimneyCount(): number {
    return this.chimneySteamEmitters.length;
  }

  public getStationClockCount(): number {
    return this.stationClocks.length;
  }

  public getWorkerCount(): number {
    return this.railwayWorkers.length;
  }

  public getGasLampCount(): number {
    return this.swayingGasLamps.length;
  }

  public reset(): void {
    this.grandSteamArrivals = [];
    this.historicViaducts = [];
    this.chimneySteamEmitters = [];
    this.stationClocks = [];
    this.railwayWorkers = [];
    this.swayingGasLamps = [];
    this.globalTime = 0;
  }

  /**
   * Scene-rooted detachment cleaner:
   * Prunes actors whose chunk has been recycled or detached from the scene hierarchy.
   */
  public pruneDetached(): void {
    const isAttached = (obj: THREE.Object3D | null | undefined): boolean => {
      if (!obj || !obj.parent) return false;
      let cur: THREE.Object3D = obj;
      while (cur.parent) {
        cur = cur.parent;
      }
      if (cur.type === 'Scene') return true;
      if (typeof window === 'undefined') {
        return cur !== obj && cur.children.length > 0;
      }
      return false;
    };

    this.grandSteamArrivals = this.grandSteamArrivals.filter((a) => isAttached(a.group));
    this.historicViaducts = this.historicViaducts.filter((a) => isAttached(a.group));
    this.chimneySteamEmitters = this.chimneySteamEmitters.filter((e) => isAttached(e.group));
    this.stationClocks = this.stationClocks.filter((c) => isAttached(c.group));
    this.railwayWorkers = this.railwayWorkers.filter((w) => isAttached(w.group));
    this.swayingGasLamps = this.swayingGasLamps.filter((l) => isAttached(l.group));
  }

  private initEventListeners(): void {
    const bus = EventBus.getInstance();
    bus.on('GAME_RESTART', () => this.reset());
    bus.on('PLAYER_REVIVE', () => this.pruneDetached());
    bus.on('TRACK_RECYCLED', () => this.pruneDetached());
  }

  // =========================================================================
  // MAIN UPDATE LOOP (ZERO-ALLOCATION PER FRAME)
  // =========================================================================

  public update(dt: number, isRunning: boolean = true, playerZ: number = 0): void {
    if (!isRunning || dt <= 0) return;

    this.globalTime += dt;
    this.pruneDetached();

    // 1. Update Hero Event 1: The Grand Steam Arrival
    this.updateGrandSteamArrivals(dt, playerZ);

    // 2. Update Hero Event 2: The Historic Viaduct & Canal Crossing
    this.updateHistoricViaducts(dt, playerZ);

    // 3. Update Kinetic Chimney Steam Emitters
    this.updateChimneySteam(dt);

    // 4. Update Municipal Station Clocks
    this.updateStationClocks(dt);

    // 5. Update Railway Workers & Signalmen
    this.updateRailwayWorkers(dt);

    // 6. Update Swaying Victorian Gaslamps
    this.updateSwayingGasLamps(dt);
  }

  // --- Hero Event 1: The Grand Steam Arrival ---

  private updateGrandSteamArrivals(dt: number, playerZ: number): void {
    for (const actor of this.grandSteamArrivals) {
      if (actor.state === 'COMPLETE') continue;

      actor.timer += dt;

      switch (actor.state) {
        case 'DORMANT':
          // Trigger when player approaches within 160m
          if (playerZ <= actor.triggerZ + 160.0) {
            actor.state = 'ANTICIPATION';
            actor.timer = 0;
            actor.locomotiveGroup.position.z = actor.initialTrainZ;
          }
          break;

        case 'ANTICIPATION':
          // Signal lamps activate; train approaches in distance
          for (const lamp of actor.platformGasLamps) {
            lamp.visible = true;
          }
          if (playerZ <= actor.triggerZ + 95.0 || actor.timer > 0.8) {
            actor.state = 'ACTION';
            actor.timer = 0;
          }
          break;

        case 'ACTION': {
          // Locomotive steams into station platform toward targetStopZ
          const progress = Math.min(1.0, actor.timer / 3.5);
          // Smooth deceleration ease-out curve
          const easeOut = 1 - Math.pow(1 - progress, 2.5);
          const currentZ = THREE.MathUtils.lerp(actor.initialTrainZ, actor.targetStopZ, easeOut);
          actor.locomotiveGroup.position.z = currentZ;

          // Rotate driving wheels & animate connecting rods
          const trainSpeed = (1 - progress) * 22.0 + 3.0;
          actor.wheelAngle += trainSpeed * dt * 2.8;
          for (const wheel of actor.drivingWheels) {
            wheel.rotation.x = actor.wheelAngle;
          }
          // Connecting rod horizontal and vertical eccentric oscillation
          const rodOffsetY = Math.sin(actor.wheelAngle) * 0.28;
          const rodOffsetZ = Math.cos(actor.wheelAngle) * 0.28;
          for (const rod of actor.connectingRods) {
            rod.position.y = rodOffsetY;
            rod.position.z = rodOffsetZ;
          }

          // Volumetric puffing steam plumes from funnel
          for (let p = 0; p < actor.steamPuffPlumes.length; p++) {
            const plume = actor.steamPuffPlumes[p];
            const pPhase = (this.globalTime * 3.5 + p * 0.7) % 1.0;
            plume.position.y = 4.2 + pPhase * 2.8;
            plume.position.z = -1.2 + pPhase * 2.2;
            const sc = 0.4 + pPhase * 1.6;
            plume.scale.set(sc, sc, sc);
            plume.visible = true;
          }

          if (progress >= 1.0 || playerZ <= actor.triggerZ + 30.0) {
            actor.state = 'CLIMAX';
            actor.timer = 0;
          }
          break;
        }

        case 'CLIMAX': {
          // Train has stopped at platform; passengers step forward to board
          actor.locomotiveGroup.position.z = actor.targetStopZ;

          const pStep = Math.min(1.0, actor.timer / 2.2);
          for (let i = 0; i < actor.passengerFigures.length; i++) {
            const pass = actor.passengerFigures[i];
            const baseLateral = pass.userData.baseX || pass.position.x;
            // Commuters walk toward carriage doors (inward toward track)
            pass.position.x = THREE.MathUtils.lerp(baseLateral, baseLateral - 1.1, pStep);
          }

          // Gentle idling steam from cylinder drain cocks
          for (let p = 0; p < actor.steamPuffPlumes.length; p++) {
            const plume = actor.steamPuffPlumes[p];
            const pPhase = (this.globalTime * 1.8 + p * 0.9) % 1.0;
            plume.position.y = 4.2 + pPhase * 1.5;
            const sc = 0.5 + pPhase * 0.9;
            plume.scale.set(sc, sc, sc);
          }

          if (actor.timer > 3.0 || playerZ <= actor.triggerZ - 15.0) {
            actor.state = 'AFTERMATH';
            actor.timer = 0;
          }
          break;
        }

        case 'AFTERMATH': {
          // Whistle blasts, locomotive accelerates into forward departure
          const dProgress = Math.min(1.0, actor.timer / 4.0);
          const easeIn = Math.pow(dProgress, 2.2);
          actor.locomotiveGroup.position.z = THREE.MathUtils.lerp(actor.targetStopZ, actor.departZ, easeIn);

          const accelSpeed = dProgress * 26.0 + 4.0;
          actor.wheelAngle += accelSpeed * dt * 2.8;
          for (const wheel of actor.drivingWheels) {
            wheel.rotation.x = actor.wheelAngle;
          }
          for (const rod of actor.connectingRods) {
            rod.position.y = Math.sin(actor.wheelAngle) * 0.28;
            rod.position.z = Math.cos(actor.wheelAngle) * 0.28;
          }

          if (dProgress >= 1.0 || playerZ <= actor.triggerZ - 65.0) {
            actor.state = 'COMPLETE';
          }
          break;
        }
      }
    }
  }

  // --- Hero Event 2: The Historic Viaduct & Canal Crossing ---

  private updateHistoricViaducts(dt: number, playerZ: number): void {
    for (const actor of this.historicViaducts) {
      if (actor.state === 'COMPLETE') continue;

      actor.timer += dt;

      switch (actor.state) {
        case 'DORMANT':
          if (playerZ <= actor.triggerZ + 160.0) {
            actor.state = 'ANTICIPATION';
            actor.timer = 0;
          }
          break;

        case 'ANTICIPATION':
          if (playerZ <= actor.triggerZ + 95.0 || actor.timer > 0.6) {
            actor.state = 'ACTION';
            actor.timer = 0;
          }
          break;

        case 'ACTION': {
          // Canal narrowboat glides along the water basin
          const boatProg = Math.min(1.0, actor.timer / 7.0);
          actor.canalBoatGroup.position.z = THREE.MathUtils.lerp(actor.initialBoatZ, actor.targetBoatZ, boatProg);

          // Boat chimney steam puffing
          for (let p = 0; p < actor.boatChimneySteam.length; p++) {
            const plume = actor.boatChimneySteam[p];
            const phase = (this.globalTime * 2.5 + p * 0.5) % 1.0;
            plume.position.y = 2.4 + phase * 1.8;
            plume.position.z = phase * 1.2;
            const sc = 0.3 + phase * 1.2;
            plume.scale.set(sc, sc, sc);
            plume.visible = true;
          }

          // Foaming water wake ripple expansion
          for (let w = 0; w < actor.waterWakePlumes.length; w++) {
            const wake = actor.waterWakePlumes[w];
            const wPhase = (this.globalTime * 1.5 + w * 0.3) % 1.0;
            wake.scale.set(1.0 + wPhase * 2.2, 1.0, 1.0 + wPhase * 1.5);
            wake.position.z = 2.2 + wPhase * 2.5;
            wake.visible = true;
          }

          // Distant steam train crossing background viaduct bridge horizontally
          const trainProg = Math.min(1.0, actor.timer / 6.0);
          actor.distantSteamTrain.position.x = THREE.MathUtils.lerp(
            actor.initialDistantTrainX,
            actor.targetDistantTrainX,
            trainProg
          );
          // Distant train driving rods
          for (const rod of actor.distantTrainRods) {
            rod.position.y = Math.sin(this.globalTime * 14.0) * 0.15;
          }

          // Bridge pedestrians waving from balustrade
          for (let i = 0; i < actor.bridgePedestrians.length; i++) {
            const ped = actor.bridgePedestrians[i];
            ped.rotation.z = Math.sin(this.globalTime * 4.0 + i) * 0.12;
          }

          if ((boatProg >= 0.5 && actor.state === 'ACTION') || playerZ <= actor.triggerZ + 30.0) {
            actor.state = 'CLIMAX';
          }
          break;
        }

        case 'CLIMAX': {
          const boatProg = Math.min(1.0, (actor.timer + 3.5) / 7.0);
          actor.canalBoatGroup.position.z = THREE.MathUtils.lerp(actor.initialBoatZ, actor.targetBoatZ, boatProg);

          const trainProg = Math.min(1.0, (actor.timer + 3.0) / 6.0);
          actor.distantSteamTrain.position.x = THREE.MathUtils.lerp(
            actor.initialDistantTrainX,
            actor.targetDistantTrainX,
            trainProg
          );

          if ((boatProg >= 1.0 && trainProg >= 1.0) || playerZ <= actor.triggerZ - 15.0) {
            actor.state = 'AFTERMATH';
            actor.timer = 0;
          }
          break;
        }

        case 'AFTERMATH':
          if (actor.timer > 1.5 || playerZ <= actor.triggerZ - 65.0) {
            actor.state = 'COMPLETE';
          }
          break;
      }
    }
  }

  // --- Kinetic Ambient Steam Chimneys ---

  private updateChimneySteam(dt: number): void {
    for (const emitter of this.chimneySteamEmitters) {
      for (let i = 0; i < emitter.steamMeshes.length; i++) {
        const mesh = emitter.steamMeshes[i];
        const phase = (this.globalTime * emitter.speed + emitter.phaseOffset + i * 0.35) % 1.0;
        mesh.position.y = emitter.baseY + phase * 3.5;
        // Natural wind drift along lateral X and back Z
        mesh.position.x = Math.sin(this.globalTime * 1.5 + emitter.phaseOffset) * phase * 0.8;
        mesh.position.z = phase * 1.2;
        const scale = 0.35 + phase * 1.8;
        mesh.scale.set(scale, scale, scale);
      }
    }
  }

  // --- Municipal Station Clocks ---

  private updateStationClocks(dt: number): void {
    for (const clock of this.stationClocks) {
      // Minute hand rotates 1 full turn every 60 seconds
      clock.minuteHand.rotation.z = -(this.globalTime * (Math.PI * 2 / 60.0));
      // Hour hand rotates 1 full turn every 720 seconds
      clock.hourHand.rotation.z = -(this.globalTime * (Math.PI * 2 / 720.0));
    }
  }

  // --- Railway Workers & Signalmen ---

  private updateRailwayWorkers(dt: number): void {
    for (const worker of this.railwayWorkers) {
      worker.timer += dt;

      switch (worker.animationType) {
        case 'FLAG_SIGNAL': {
          // Rhythmic waving of green/amber railway signal flag
          const armAngle = Math.sin(this.globalTime * 3.2) * 0.6 + 0.3;
          worker.rightArm.rotation.z = armAngle;
          break;
        }
        case 'INSPECT_TRACK': {
          // Leaning forward with inspection lamp
          const lean = Math.sin(this.globalTime * 1.4) * 0.18 + 0.2;
          worker.group.rotation.x = lean;
          if (worker.signalLamp) {
            worker.signalLamp.rotation.z = Math.sin(this.globalTime * 1.4) * 0.15;
          }
          break;
        }
        case 'WAVE_DEPARTURE': {
          // Continuous arm wave toward passing train
          worker.rightArm.rotation.z = Math.sin(this.globalTime * 5.0) * 0.45 + 0.8;
          break;
        }
      }
    }
  }

  // --- Swaying Victorian Gaslamps ---

  private updateSwayingGasLamps(dt: number): void {
    for (const lamp of this.swayingGasLamps) {
      const sway = Math.sin(this.globalTime * lamp.swingSpeed + lamp.phaseOffset) * 0.08;
      lamp.lantern.rotation.z = sway;
    }
  }
}
