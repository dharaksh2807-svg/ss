import * as THREE from 'three';
import { EventBus } from '../../../core/EventBus';
import {
  GrandConcourseHeroActor,
  PowerRestorationHeroActor,
  VentilationFanActor,
  EscalatorActor,
  FlickeringLightActor,
  PlatformCommuterActor,
  SubwayClockActor,
  UNDERGROUND_METRO_PALETTE
} from './UndergroundMetroTheme';

/**
 * Underground Metro Event Director:
 * Manages 6-stage lifecycles for Hero Events (Grand Concourse Reveal & Power Restoration),
 * motorized escalators, ventilation exhaust turbines, gas-discharge flickering luminaires,
 * platform commuters, and animated double-sided station clocks.
 */
export class UndergroundMetroEventDirector {
  private static instance: UndergroundMetroEventDirector;

  private grandConcourses: GrandConcourseHeroActor[] = [];
  private powerRestorations: PowerRestorationHeroActor[] = [];
  private ventilationFans: VentilationFanActor[] = [];
  private escalators: EscalatorActor[] = [];
  private flickeringLights: FlickeringLightActor[] = [];
  private commuters: PlatformCommuterActor[] = [];
  private stationClocks: SubwayClockActor[] = [];

  private globalTime: number = 0;

  private constructor() {
    this.initEventListeners();
    if (typeof window !== 'undefined') {
      (window as any).__UNDERGROUND_DIRECTOR__ = this;
    }
  }

  public static getInstance(): UndergroundMetroEventDirector {
    if (!UndergroundMetroEventDirector.instance) {
      UndergroundMetroEventDirector.instance = new UndergroundMetroEventDirector();
    }
    return UndergroundMetroEventDirector.instance;
  }

  // --- Registration API ---

  public registerGrandConcourse(actor: GrandConcourseHeroActor): void {
    this.grandConcourses.push(actor);
  }

  public registerPowerRestoration(actor: PowerRestorationHeroActor): void {
    this.powerRestorations.push(actor);
  }

  public registerVentilationFan(fan: VentilationFanActor): void {
    this.ventilationFans.push(fan);
  }

  public registerEscalator(escalator: EscalatorActor): void {
    this.escalators.push(escalator);
  }

  public registerFlickeringLight(light: FlickeringLightActor): void {
    this.flickeringLights.push(light);
  }

  public registerCommuter(commuter: PlatformCommuterActor): void {
    this.commuters.push(commuter);
  }

  public registerStationClock(clock: SubwayClockActor): void {
    this.stationClocks.push(clock);
  }

  // --- Diagnostics & Verifications API ---

  public getGrandConcourses(): GrandConcourseHeroActor[] {
    return this.grandConcourses;
  }

  public getPowerRestorations(): PowerRestorationHeroActor[] {
    return this.powerRestorations;
  }

  public getTotalActiveElements(): number {
    return (
      this.grandConcourses.length +
      this.powerRestorations.length +
      this.ventilationFans.length +
      this.escalators.length +
      this.flickeringLights.length +
      this.commuters.length +
      this.stationClocks.length
    );
  }

  public getFanCount(): number {
    return this.ventilationFans.length;
  }

  public getEscalatorCount(): number {
    return this.escalators.length;
  }

  public getCommuterCount(): number {
    return this.commuters.length;
  }

  public reset(): void {
    this.grandConcourses = [];
    this.powerRestorations = [];
    this.ventilationFans = [];
    this.escalators = [];
    this.flickeringLights = [];
    this.commuters = [];
    this.stationClocks = [];
    this.globalTime = 0;
  }

  /**
   * Scene-rooted detachment cleaner:
   * Prunes actors whose parent chunk has been recycled or detached.
   */
  public pruneDetached(): void {
    const isAttached = (obj: THREE.Object3D | null | undefined): boolean => {
      if (!obj || !obj.parent) return false;
      let cur: THREE.Object3D = obj;
      while (cur.parent) {
        cur = cur.parent;
      }
      return cur.type === 'Scene';
    };

    this.grandConcourses = this.grandConcourses.filter((a) => isAttached(a.group));
    this.powerRestorations = this.powerRestorations.filter((a) => isAttached(a.group));
    this.ventilationFans = this.ventilationFans.filter((f) => isAttached(f.group));
    this.escalators = this.escalators.filter((e) => isAttached(e.group));
    this.flickeringLights = this.flickeringLights.filter((l) => isAttached(l.mesh));
    this.commuters = this.commuters.filter((c) => isAttached(c.group));
    this.stationClocks = this.stationClocks.filter((c) => isAttached(c.group));
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

    // 1. UPDATE HERO EVENT A: GRAND CONCOURSE REVEAL
    for (let i = 0; i < this.grandConcourses.length; i++) {
      const actor = this.grandConcourses[i];
      const distAhead = playerZ - actor.triggerZ; // Positive when approaching negative-Z trigger

      switch (actor.state) {
        case 'DORMANT': {
          if (distAhead <= 140 && distAhead >= -30) {
            actor.state = 'ANTICIPATION';
            actor.timer = 0;
          }
          break;
        }

        case 'ANTICIPATION': {
          actor.timer += dt;
          // Approaching train headlight glow visible in distance
          if (actor.timer >= 1.2) {
            actor.state = 'ACTION';
            actor.timer = 0;
          }
          break;
        }

        case 'ACTION': {
          actor.timer += dt;
          // Train decelerates from initialTrainZ to targetStopZ
          const progress = Math.min(1.0, actor.timer / 3.0);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const currentZ = actor.initialTrainZ + (actor.targetStopZ - actor.initialTrainZ) * easeOut;
          actor.trainGroup.position.z = currentZ;

          // Rotate wheels proportionally to movement
          const wheelDelta = (1 - progress) * dt * 25.0;
          for (let b = 0; b < actor.trainBogies.length; b++) {
            actor.trainBogies[b].rotation.x += wheelDelta;
          }

          // Brake sparks flicker near stopping point
          const sparkVisible = progress > 0.4 && progress < 0.95 && Math.sin(this.globalTime * 45) > 0.0;
          for (let s = 0; s < actor.brakeSparks.length; s++) {
            actor.brakeSparks[s].visible = sparkVisible;
          }

          if (progress >= 1.0) {
            actor.state = 'CLIMAX';
            actor.timer = 0;
            for (let s = 0; s < actor.brakeSparks.length; s++) {
              actor.brakeSparks[s].visible = false;
            }
          }
          break;
        }

        case 'CLIMAX': {
          actor.timer += dt;
          // Automatic pneumatic doors slide open
          for (let d = 0; d < actor.trainDoors.length; d++) {
            const door = actor.trainDoors[d];
            door.openAmount = Math.min(1.0, door.openAmount + dt * 2.2);
            door.left.position.x = -door.openAmount * 0.55;
            door.right.position.x = door.openAmount * 0.55;
          }

          // Destination matrix board flips / blinks
          if (actor.departureMatrixBoard && actor.departureMatrixBoard.material instanceof THREE.MeshBasicMaterial) {
            actor.departureMatrixBoard.material.color.setHex(
              Math.sin(this.globalTime * 6) > 0 ? UNDERGROUND_METRO_PALETTE.displayMatrixGreen : 0x15803d
            );
          }

          // Commuter crowd silhouettes stir
          for (let c = 0; c < actor.commuterCrowd.length; c++) {
            const figure = actor.commuterCrowd[c];
            figure.position.z += Math.sin(this.globalTime * 3 + c) * 0.003;
          }

          if (actor.timer >= 2.5) {
            actor.state = 'AFTERMATH';
            actor.timer = 0;
          }
          break;
        }

        case 'AFTERMATH': {
          actor.timer += dt;
          // Doors seal shut
          let allClosed = true;
          for (let d = 0; d < actor.trainDoors.length; d++) {
            const door = actor.trainDoors[d];
            door.openAmount = Math.max(0.0, door.openAmount - dt * 2.8);
            door.left.position.x = -door.openAmount * 0.55;
            door.right.position.x = door.openAmount * 0.55;
            if (door.openAmount > 0.01) allClosed = false;
          }

          // Train accelerates smoothly away into departing tunnel
          if (actor.timer > 0.8) {
            const accelProgress = Math.min(1.0, (actor.timer - 0.8) / 3.0);
            const easeIn = Math.pow(accelProgress, 2.5);
            const departZ = actor.targetStopZ + (actor.departZ - actor.targetStopZ) * easeIn;
            actor.trainGroup.position.z = departZ;

            const wheelDelta = easeIn * dt * 30.0;
            for (let b = 0; b < actor.trainBogies.length; b++) {
              actor.trainBogies[b].rotation.x += wheelDelta;
            }
          }

          if (actor.timer >= 4.0) {
            actor.state = 'COMPLETE';
          }
          break;
        }

        case 'COMPLETE':
          // Kept in quiescent state until recycled
          break;
      }
    }

    // 2. UPDATE HERO EVENT B: POWER RESTORATION
    for (let i = 0; i < this.powerRestorations.length; i++) {
      const actor = this.powerRestorations[i];
      const distAhead = playerZ - actor.triggerZ;

      switch (actor.state) {
        case 'DORMANT': {
          // Emergency red lamps pulse softly
          const pulse = 0.5 + 0.5 * Math.sin(this.globalTime * 2.5);
          for (let r = 0; r < actor.emergencyLamps.length; r++) {
            const lamp = actor.emergencyLamps[r];
            if (lamp.material instanceof THREE.MeshBasicMaterial) {
              lamp.material.opacity = 0.4 + 0.6 * pulse;
            }
          }

          if (distAhead <= 130 && distAhead >= -30) {
            actor.state = 'ANTICIPATION';
            actor.timer = 0;
          }
          break;
        }

        case 'ANTICIPATION': {
          actor.timer += dt;
          // High-voltage transformer sparks flicker
          const sparkOn = Math.sin(this.globalTime * 35) > 0.3;
          for (let s = 0; s < actor.transformerSparks.length; s++) {
            actor.transformerSparks[s].visible = sparkOn;
          }

          if (actor.timer >= 1.0) {
            actor.state = 'ACTION';
            actor.timer = 0;
            actor.powerLevel = 0.05;
          }
          break;
        }

        case 'ACTION': {
          actor.timer += dt;
          // Power level ramps up
          actor.powerLevel = Math.min(1.0, actor.timer / 2.2);

          // Sequential Z-staggered luminaire cascade
          const numFixtures = actor.luminaireFixtures.length;
          for (let f = 0; f < numFixtures; f++) {
            const fix = actor.luminaireFixtures[f];
            const threshold = f / Math.max(1, numFixtures);
            if (actor.powerLevel >= threshold) {
              fix.active = true;
              if (fix.mesh.material instanceof THREE.MeshBasicMaterial) {
                // Gas discharge strike flicker before solid daylight
                const strikeFlicker = actor.powerLevel < threshold + 0.15 && Math.sin(this.globalTime * 50 + f) > 0.0;
                fix.mesh.material.color.setHex(
                  strikeFlicker ? 0xffffff : UNDERGROUND_METRO_PALETTE.fluorescentDaylight
                );
              }
            }
          }

          // Emergency red lamps fade out as mains power takes over
          for (let r = 0; r < actor.emergencyLamps.length; r++) {
            const lamp = actor.emergencyLamps[r];
            if (lamp.material instanceof THREE.MeshBasicMaterial) {
              lamp.material.opacity = Math.max(0.1, 1.0 - actor.powerLevel);
            }
          }

          // Turbines begin accelerating
          for (let t = 0; t < actor.exhaustTurbines.length; t++) {
            const turb = actor.exhaustTurbines[t];
            turb.rpm = actor.powerLevel * 25.0;
            turb.fanBlades.rotation.z += turb.rpm * dt;
          }

          if (actor.powerLevel >= 1.0) {
            actor.state = 'CLIMAX';
            actor.timer = 0;
            for (let s = 0; s < actor.transformerSparks.length; s++) {
              actor.transformerSparks[s].visible = false;
            }
          }
          break;
        }

        case 'CLIMAX': {
          actor.timer += dt;
          // Hydraulic flood gates slide open smoothly
          for (let g = 0; g < actor.floodGates.length; g++) {
            const gate = actor.floodGates[g];
            gate.openAmount = Math.min(1.0, gate.openAmount + dt * 1.2);
            gate.leftGate.position.x = -5.8 - gate.openAmount * 1.5;
            gate.rightGate.position.x = 5.8 + gate.openAmount * 1.5;
          }

          // Turbines run at maximum RPM
          for (let t = 0; t < actor.exhaustTurbines.length; t++) {
            const turb = actor.exhaustTurbines[t];
            turb.fanBlades.rotation.z += 25.0 * dt;
          }

          if (actor.timer >= 2.0) {
            actor.state = 'AFTERMATH';
            actor.timer = 0;
          }
          break;
        }

        case 'AFTERMATH': {
          actor.timer += dt;
          // Turbines sustain steady speed
          for (let t = 0; t < actor.exhaustTurbines.length; t++) {
            const turb = actor.exhaustTurbines[t];
            turb.fanBlades.rotation.z += 22.0 * dt;
          }

          if (actor.timer >= 2.0) {
            actor.state = 'COMPLETE';
          }
          break;
        }

        case 'COMPLETE': {
          // Maintain steady illuminated state
          for (let t = 0; t < actor.exhaustTurbines.length; t++) {
            const turb = actor.exhaustTurbines[t];
            turb.fanBlades.rotation.z += 20.0 * dt;
          }
          break;
        }
      }
    }

    // 3. UPDATE VENTILATION FANS
    for (let i = 0; i < this.ventilationFans.length; i++) {
      const fan = this.ventilationFans[i];
      fan.blades.rotation.z += fan.rotationSpeed * dt;
    }

    // 4. UPDATE MOTORIZED ESCALATORS
    for (let i = 0; i < this.escalators.length; i++) {
      const esc = this.escalators[i];
      const stepCount = esc.steps.length;
      for (let s = 0; s < stepCount; s++) {
        const step = esc.steps[s];
        step.position.y += esc.speed * dt;
        step.position.z -= esc.speed * dt * Math.tan(esc.inclineAngle);

        // Loop steps along escalator truss bounds
        if (step.position.y > esc.stepSpacing * stepCount * 0.5) {
          step.position.y -= esc.stepSpacing * stepCount;
          step.position.z += esc.stepSpacing * stepCount * Math.tan(esc.inclineAngle);
        } else if (step.position.y < -esc.stepSpacing * stepCount * 0.5) {
          step.position.y += esc.stepSpacing * stepCount;
          step.position.z -= esc.stepSpacing * stepCount * Math.tan(esc.inclineAngle);
        }
      }
    }

    // 5. UPDATE FLICKERING LIGHTS
    for (let i = 0; i < this.flickeringLights.length; i++) {
      const light = this.flickeringLights[i];
      const flicker = Math.sin(this.globalTime * light.flickerSpeed + light.phaseOffset);
      light.mesh.visible = flicker < 0.92;
    }

    // 6. UPDATE PLATFORM COMMUTERS
    for (let i = 0; i < this.commuters.length; i++) {
      const commuter = this.commuters[i];
      commuter.timer += dt;
      if (commuter.animType === 'CHECK_PHONE') {
        commuter.head.rotation.x = 0.32 + Math.sin(this.globalTime * 1.5 + commuter.timer) * 0.05;
        if (commuter.phoneGlow) {
          commuter.phoneGlow.visible = Math.sin(this.globalTime * 3.0) > -0.7;
        }
      } else {
        commuter.head.rotation.y = Math.sin(this.globalTime * 0.8 + commuter.timer) * 0.15;
        commuter.torso.position.y = Math.sin(this.globalTime * 1.8 + commuter.timer) * 0.015;
      }
    }

    // 7. UPDATE SUBWAY CLOCKS
    for (let i = 0; i < this.stationClocks.length; i++) {
      const clock = this.stationClocks[i];
      clock.minuteHand.rotation.z = -this.globalTime * 0.12;
      clock.hourHand.rotation.z = -this.globalTime * 0.01;
    }
  }
}
