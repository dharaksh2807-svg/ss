import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';

/**
 * Actor Interfaces for Phantom Line Supernatural Encounters
 */

export interface WatcherActor {
  group: THREE.Group;
  head: THREE.Object3D;
  eyes: THREE.Mesh[];
  coatTails: THREE.Object3D[];
  columnMesh?: THREE.Object3D;
  triggerZ: number;
  baseX: number;
  hideX: number;
  state: 'WATCHING' | 'STEPPING_BACK' | 'VANISHED';
  timer: number;
}

export interface LastTrainActor {
  group: THREE.Group;
  locomotive: THREE.Object3D;
  carriages: THREE.Object3D[];
  headlight?: THREE.Mesh;
  windowGlows: THREE.Mesh[];
  ghostPassengers: THREE.Object3D[];
  wheels: THREE.Object3D[];
  speed: number;
  triggerZ: number;
  minZ: number;
  maxZ: number;
  state: 'APPROACHING' | 'PASSING' | 'FADING_INTO_FOG';
  fogFadeTimer: number;
}

export interface LostConductorActor {
  group: THREE.Group;
  head: THREE.Object3D;
  armLantern: THREE.Object3D;
  lanternBulb?: THREE.Mesh;
  triggerZ: number;
  timer: number;
  state: 'INSPECTING' | 'SIGNALING' | 'DISSOLVING';
}

export interface PassengerCrowdActor {
  group: THREE.Group;
  passengers: Array<{
    mesh: THREE.Object3D;
    head: THREE.Object3D;
    arm?: THREE.Object3D;
    phase: number;
    initialRotY: number;
  }>;
  triggerZ: number;
  state: 'MATERIALIZING' | 'TURNING' | 'POINTING' | 'VANISHED';
  timer: number;
}

export interface FloodedReflectionActor {
  group: THREE.Group;
  waterPlane: THREE.Mesh;
  waterReflection: THREE.Object3D;
  emergingSpecter: THREE.Object3D;
  triggerZ: number;
  phase: number;
  state: 'INDEPENDENT_DRIFT' | 'RISING' | 'DISSOLVED';
  timer: number;
}

export interface IlluminatedBuildingActor {
  group: THREE.Group;
  windows: THREE.Mesh[];
  shadowFigures: THREE.Object3D[];
  solitaryWindow: THREE.Mesh;
  triggerZ: number;
  state: 'DARK' | 'GRADUAL_LIGHT' | 'FIGURES_VISIBLE' | 'SOLITARY_WINDOW';
  timer: number;
}

export interface ShadowEntityActor {
  group: THREE.Group;
  limbs: THREE.Object3D[];
  eyes: THREE.Mesh[];
  baseY: number;
  phase: number;
}

export interface ImpossibleClockActor {
  group: THREE.Group;
  clockFace: THREE.Mesh;
  clockHand: THREE.Object3D;
  shadowFigure: THREE.Object3D;
  triggerZ: number;
  isReversed: boolean;
  handAngle: number;
  timer: number;
}

export interface SpectralFootstepsActor {
  group: THREE.Group;
  footprints: THREE.Mesh[];
  doorMesh?: THREE.Object3D;
  triggerZ: number;
  revealedCount: number;
  timer: number;
}

export interface AmbientHauntingActor {
  flickeringLamps: Array<{ mesh: THREE.Mesh; phase: number; freq: number }>;
  willOWisps: Array<{ mesh: THREE.Mesh; center: THREE.Vector3; radius: number; freq: number; phase: number }>;
  creakingSigns: Array<{ mesh: THREE.Object3D; phase: number }>;
}

/**
 * PhantomLineEventDirector
 * Coordinates and animates all flagship encounters, 6 haunted regions, character systems,
 * and ambient supernatural activity with performance safety and leak-free lifecycle pruning.
 */
export class PhantomLineEventDirector {
  private static instance: PhantomLineEventDirector | null = null;

  private totalTime: number = 0;
  private frameCounter: number = 0;

  // Registered Actors
  private watchers: WatcherActor[] = [];
  private lastTrains: LastTrainActor[] = [];
  private conductors: LostConductorActor[] = [];
  private passengerCrowds: PassengerCrowdActor[] = [];
  private floodedReflections: FloodedReflectionActor[] = [];
  private illuminatedBuildings: IlluminatedBuildingActor[] = [];
  private shadowEntities: ShadowEntityActor[] = [];
  private impossibleClocks: ImpossibleClockActor[] = [];
  private spectralFootsteps: SpectralFootstepsActor[] = [];
  private ambient: AmbientHauntingActor = {
    flickeringLamps: [],
    willOWisps: [],
    creakingSigns: []
  };

  private constructor() {}

  public static getInstance(): PhantomLineEventDirector {
    if (!this.instance) {
      this.instance = new PhantomLineEventDirector();
    }
    return this.instance;
  }

  // --- Registration Methods ---

  public registerWatcher(actor: WatcherActor): void {
    this.watchers.push(actor);
  }

  public registerLastTrain(actor: LastTrainActor): void {
    this.lastTrains.push(actor);
  }

  public registerConductor(actor: LostConductorActor): void {
    this.conductors.push(actor);
  }

  public registerPassengerCrowd(actor: PassengerCrowdActor): void {
    this.passengerCrowds.push(actor);
  }

  public registerFloodedReflection(actor: FloodedReflectionActor): void {
    this.floodedReflections.push(actor);
  }

  public registerIlluminatedBuilding(actor: IlluminatedBuildingActor): void {
    this.illuminatedBuildings.push(actor);
  }

  public registerShadowEntity(actor: ShadowEntityActor): void {
    this.shadowEntities.push(actor);
  }

  public registerImpossibleClock(actor: ImpossibleClockActor): void {
    this.impossibleClocks.push(actor);
  }

  public registerSpectralFootsteps(actor: SpectralFootstepsActor): void {
    this.spectralFootsteps.push(actor);
  }

  public registerFlickeringLamp(mesh: THREE.Mesh, freq: number = 1.5, phase: number = 0): void {
    this.ambient.flickeringLamps.push({ mesh, freq, phase });
  }

  public registerWillOWisp(mesh: THREE.Mesh, center: THREE.Vector3, radius: number = 2.2, freq: number = 1.6, phase: number = 0): void {
    this.ambient.willOWisps.push({ mesh, center: center.clone(), radius, freq, phase });
  }

  public registerCreakingSign(mesh: THREE.Object3D, phase: number = 0): void {
    this.ambient.creakingSigns.push({ mesh, phase });
  }

  // --- Lifecycle & Pruning ---

  public reset(): void {
    this.watchers.length = 0;
    this.lastTrains.length = 0;
    this.conductors.length = 0;
    this.passengerCrowds.length = 0;
    this.floodedReflections.length = 0;
    this.illuminatedBuildings.length = 0;
    this.shadowEntities.length = 0;
    this.impossibleClocks.length = 0;
    this.spectralFootsteps.length = 0;
    this.ambient.flickeringLamps.length = 0;
    this.ambient.willOWisps.length = 0;
    this.ambient.creakingSigns.length = 0;
    this.totalTime = 0;
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
    this.watchers = this.watchers.filter((a) => !this.isDetached(a.group));
    this.lastTrains = this.lastTrains.filter((a) => !this.isDetached(a.group));
    this.conductors = this.conductors.filter((a) => !this.isDetached(a.group));
    this.passengerCrowds = this.passengerCrowds.filter((a) => !this.isDetached(a.group));
    this.floodedReflections = this.floodedReflections.filter((a) => !this.isDetached(a.group));
    this.illuminatedBuildings = this.illuminatedBuildings.filter((a) => !this.isDetached(a.group));
    this.shadowEntities = this.shadowEntities.filter((a) => !this.isDetached(a.group));
    this.impossibleClocks = this.impossibleClocks.filter((a) => !this.isDetached(a.group));
    this.spectralFootsteps = this.spectralFootsteps.filter((a) => !this.isDetached(a.group));
    this.ambient.flickeringLamps = this.ambient.flickeringLamps.filter((a) => !this.isDetached(a.mesh));
    this.ambient.willOWisps = this.ambient.willOWisps.filter((a) => !this.isDetached(a.mesh));
    this.ambient.creakingSigns = this.ambient.creakingSigns.filter((a) => !this.isDetached(a.mesh));
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

    // 1. VERTICAL SLICE B: THE WATCHER ENCOUNTER
    for (let i = 0; i < this.watchers.length; i++) {
      const w = this.watchers[i];
      const dist = w.triggerZ - pZ; // Positive when player is running towards negative Z

      if (w.state === 'WATCHING') {
        // Subtle unnatural stillness with soft breathing coat sway
        for (let c = 0; c < w.coatTails.length; c++) {
          w.coatTails[c].rotation.x = Math.sin(t * 1.8 + c) * 0.05 * motionScale;
        }

        // Slowly turns head toward oncoming runner
        if (dist < 95 && dist > 15) {
          const lookAngle = THREE.MathUtils.clamp((pZ - w.triggerZ) * 0.016, -0.65, 0.65);
          w.head.rotation.y = THREE.MathUtils.lerp(w.head.rotation.y, lookAngle, dt * 3.5);
          w.head.rotation.z = Math.sin(t * 2.0) * 0.05 * motionScale; // Eerie head tilt
        }

        // Stepping back behind column when player passes closely
        if (dist <= 15 && dist > -15) {
          w.state = 'STEPPING_BACK';
          w.timer = 0;
        }
      } else if (w.state === 'STEPPING_BACK') {
        w.timer += dt;
        const progress = Math.min(1.0, w.timer * 2.2);
        w.group.position.x = THREE.MathUtils.lerp(w.baseX, w.hideX, progress);

        // Eyes pulse and fade into shadow
        for (let e = 0; e < w.eyes.length; e++) {
          w.eyes[e].scale.setScalar(Math.max(0.01, 1.0 - progress));
        }

        if (progress >= 1.0) {
          w.state = 'VANISHED';
          w.group.visible = false;
        }
      }
    }

    // 2. VERTICAL SLICE A: THE LAST TRAIN ARRIVAL & DEPARTURE
    for (let i = 0; i < this.lastTrains.length; i++) {
      const lt = this.lastTrains[i];
      const dist = lt.triggerZ - pZ;

      // Moves along parallel siding
      lt.group.position.z += lt.speed * dt * motionScale;

      if (lt.group.position.z > lt.maxZ) {
        lt.group.position.z = lt.minZ;
      }

      // Wheels rotation
      const wheelRot = lt.speed * dt * 2.2;
      for (let w = 0; w < lt.wheels.length; w++) {
        lt.wheels[w].rotation.x += wheelRot;
      }

      // State progression
      if (lt.state === 'APPROACHING') {
        if (dist < 120) {
          lt.state = 'PASSING';
        }
      } else if (lt.state === 'PASSING') {
        // Glowing cyan passenger windows pulse softly
        for (let g = 0; g < lt.windowGlows.length; g++) {
          const glow = lt.windowGlows[g];
          const pulse = 0.8 + 0.2 * Math.sin(t * 3.2 + g * 0.5);
          glow.scale.set(1.0, pulse, 1.0);
        }

        // Ghost passengers visible through windows sway gently with the train
        for (let p = 0; p < lt.ghostPassengers.length; p++) {
          lt.ghostPassengers[p].rotation.z = Math.sin(t * 2.5 + p) * 0.06 * motionScale;
        }

        if (dist < -20) {
          lt.state = 'FADING_INTO_FOG';
          lt.fogFadeTimer = 0;
        }
      } else if (lt.state === 'FADING_INTO_FOG') {
        lt.fogFadeTimer += dt;
        const fadeProg = Math.min(1.0, lt.fogFadeTimer * 1.5);
        const scaleVal = 1.0 - fadeProg * 0.6;
        lt.group.scale.set(scaleVal, scaleVal, scaleVal);

        if (fadeProg >= 1.0) {
          lt.group.visible = false;
        }
      }
    }

    // 3. THE LOST CONDUCTOR
    for (let i = 0; i < this.conductors.length; i++) {
      const cond = this.conductors[i];
      const dist = cond.triggerZ - pZ;

      if (dist < 90 && dist > -20) {
        cond.timer += dt;

        if (cond.state === 'INSPECTING') {
          // Checks antique pocket watch / invisible ticket
          cond.head.rotation.x = 0.25;
          cond.armLantern.rotation.z = Math.sin(t * 2.0) * 0.12 * motionScale;

          if (dist < 50) {
            cond.state = 'SIGNALING';
          }
        } else if (cond.state === 'SIGNALING') {
          // Raises glowing lantern to signal track
          cond.armLantern.rotation.z = THREE.MathUtils.lerp(cond.armLantern.rotation.z, 0.75, dt * 3.0);
          cond.head.rotation.y = THREE.MathUtils.lerp(cond.head.rotation.y, -0.45, dt * 3.0);

          if (cond.lanternBulb) {
            const glow = 0.85 + 0.25 * Math.sin(t * 5.0);
            cond.lanternBulb.scale.setScalar(glow);
          }

          if (dist < -10) {
            cond.state = 'DISSOLVING';
            cond.timer = 0;
          }
        } else if (cond.state === 'DISSOLVING') {
          cond.timer += dt;
          const dissolveProg = Math.min(1.0, cond.timer * 2.0);
          cond.group.scale.setScalar(1.0 - dissolveProg);
          cond.group.position.y += dt * 1.2; // Rises into mist

          if (dissolveProg >= 1.0) {
            cond.group.visible = false;
          }
        }
      }
    }

    // 4. THE MISSING PASSENGER CROWD
    for (let i = 0; i < this.passengerCrowds.length; i++) {
      const crowd = this.passengerCrowds[i];
      const dist = crowd.triggerZ - pZ;

      if (dist < 110 && dist > -15) {
        crowd.timer += dt;

        for (let p = 0; p < crowd.passengers.length; p++) {
          const pass = crowd.passengers[p];

          // Staggered head turns toward player
          const turnDelay = p * 0.15;
          if (crowd.timer > turnDelay) {
            const targetRot = pass.initialRotY + Math.sin(crowd.timer * 1.8 + pass.phase) * 0.35 * motionScale;
            pass.head.rotation.y = THREE.MathUtils.lerp(pass.head.rotation.y, targetRot, dt * 3.0);
          }

          // Passenger pointing arm towards distant ghost siding
          if (pass.arm) {
            pass.arm.rotation.z = Math.sin(crowd.timer * 2.5 + pass.phase) * 0.25 * motionScale + 0.45;
          }
        }

        // Fade away before player passes
        if (dist < 12) {
          crowd.state = 'VANISHED';
          crowd.group.visible = false;
        }
      }
    }

    // 5. FLOODED GHOST REFLECTION
    for (let i = 0; i < this.floodedReflections.length; i++) {
      const fr = this.floodedReflections[i];
      const dist = fr.triggerZ - pZ;

      if (dist < 85 && dist > -20) {
        fr.timer += dt;

        // Reflection drifts independently across water basin
        fr.waterReflection.position.z = Math.sin(fr.timer * 1.5 + fr.phase) * 1.8 * motionScale;
        fr.waterReflection.position.x = Math.cos(fr.timer * 1.2 + fr.phase) * 0.8 * motionScale;

        // Spectral figure rises slowly from the dark water
        if (dist < 45 && fr.state === 'INDEPENDENT_DRIFT') {
          fr.state = 'RISING';
        }

        if (fr.state === 'RISING') {
          fr.emergingSpecter.visible = true;
          fr.emergingSpecter.position.y = Math.min(2.2, fr.emergingSpecter.position.y + dt * 1.2 * motionScale);
          fr.emergingSpecter.rotation.z = Math.sin(t * 2.2) * 0.08 * motionScale;

          if (dist < -10) {
            fr.state = 'DISSOLVED';
            fr.emergingSpecter.visible = false;
          }
        }
      }
    }

    // 6. ILLUMINATED SURREAL APARTMENT WINDOWS
    for (let i = 0; i < this.illuminatedBuildings.length; i++) {
      const bldg = this.illuminatedBuildings[i];
      const dist = bldg.triggerZ - pZ;

      if (dist < 120 && dist > -30) {
        bldg.timer += dt;

        // Windows gradually illuminate
        if (bldg.timer < 3.0) {
          const count = Math.min(bldg.windows.length, Math.floor(bldg.timer * 4.0));
          for (let w = 0; w < count; w++) {
            bldg.windows[w].visible = true;
          }
        } else if (bldg.timer < 5.5) {
          // Shadow inhabitants visible and moving
          for (let s = 0; s < bldg.shadowFigures.length; s++) {
            bldg.shadowFigures[s].position.x = Math.sin(t * 2.5 + s) * 0.35 * motionScale;
          }
        } else {
          // All windows go dark except for one solitary window
          for (let w = 0; w < bldg.windows.length; w++) {
            bldg.windows[w].visible = false;
          }
          bldg.solitaryWindow.visible = true;
        }
      }
    }

    // 7. SHADOW ENTITY (Rare Distant Silhouette)
    for (let i = 0; i < this.shadowEntities.length; i++) {
      const se = this.shadowEntities[i];
      const entityT = t * 0.65 + se.phase;

      se.group.position.y = se.baseY + Math.sin(entityT) * 1.2 * motionScale;

      for (let l = 0; l < se.limbs.length; l++) {
        se.limbs[l].rotation.z = Math.sin(entityT * 1.2 + l) * 0.18 * motionScale;
      }

      for (let e = 0; e < se.eyes.length; e++) {
        const pulse = 0.75 + 0.3 * Math.sin(t * 3.0 + e);
        se.eyes[e].scale.setScalar(pulse);
      }
    }

    // 8. IMPOSSIBLE CLOCKS
    for (let i = 0; i < this.impossibleClocks.length; i++) {
      const ic = this.impossibleClocks[i];
      const dist = ic.triggerZ - pZ;

      if (dist < 90 && dist > -20) {
        ic.timer += dt;

        // Clock hand sweeps retrograde (counter-clockwise)
        ic.handAngle -= dt * 3.5 * motionScale;
        ic.clockHand.rotation.z = ic.handAngle;

        // Shadow figure underneath manifests
        ic.shadowFigure.visible = true;
        ic.shadowFigure.rotation.y = Math.sin(ic.timer * 2.0) * 0.25 * motionScale;
      }
    }

    // 9. SPECTRAL FOOTSTEPS
    for (let i = 0; i < this.spectralFootsteps.length; i++) {
      const sf = this.spectralFootsteps[i];
      const dist = sf.triggerZ - pZ;

      if (dist < 80 && dist > -15) {
        sf.timer += dt;
        const revealTarget = Math.min(sf.footprints.length, Math.floor(sf.timer * 2.5));

        for (let f = 0; f < sf.footprints.length; f++) {
          sf.footprints[f].visible = f < revealTarget;
        }

        // Door slowly swings open
        if (sf.doorMesh && revealTarget >= sf.footprints.length) {
          sf.doorMesh.rotation.y = THREE.MathUtils.lerp(sf.doorMesh.rotation.y, -Math.PI * 0.4, dt * 2.5);
        }
      }
    }

    // 10. AMBIENT HAUNTINGS: SOFT FLICKERING LAMPS & WILL-O'-THE-WISPS
    for (let i = 0; i < this.ambient.flickeringLamps.length; i++) {
      const lamp = this.ambient.flickeringLamps[i];
      // Gentle sine-wave pulse (no obnoxious high-frequency strobe)
      const glow = 0.8 + 0.2 * Math.sin(t * lamp.freq + lamp.phase);
      lamp.mesh.scale.setScalar(glow);
    }

    for (let i = 0; i < this.ambient.willOWisps.length; i++) {
      const w = this.ambient.willOWisps[i];
      const wt = t * w.freq * motionScale + w.phase;
      const ox = Math.cos(wt) * w.radius;
      const oz = Math.sin(wt * 0.7) * w.radius;
      const oy = Math.sin(wt * 1.4) * 0.55;
      w.mesh.position.set(w.center.x + ox, w.center.y + oy, w.center.z + oz);
      w.mesh.scale.setScalar(0.8 + 0.25 * Math.sin(wt * 2.8));
    }

    for (let i = 0; i < this.ambient.creakingSigns.length; i++) {
      const s = this.ambient.creakingSigns[i];
      s.mesh.rotation.z = Math.sin(t * 1.2 * motionScale + s.phase) * 0.08 * motionScale;
    }
  }

  // --- Diagnostics ---

  public getDiagnostics(): Record<string, number> {
    return {
      watchers: this.watchers.length,
      lastTrains: this.lastTrains.length,
      conductors: this.conductors.length,
      passengerCrowds: this.passengerCrowds.length,
      floodedReflections: this.floodedReflections.length,
      illuminatedBuildings: this.illuminatedBuildings.length,
      shadowEntities: this.shadowEntities.length,
      impossibleClocks: this.impossibleClocks.length,
      spectralFootsteps: this.spectralFootsteps.length,
      flickeringLamps: this.ambient.flickeringLamps.length,
      willOWisps: this.ambient.willOWisps.length,
      creakingSigns: this.ambient.creakingSigns.length
    };
  }
}
