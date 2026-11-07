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
  platformLamp?: THREE.Mesh;
  closeVergeMesh?: THREE.Object3D;
  closeVergeEyes?: THREE.Mesh[];
  closeVergeHead?: THREE.Object3D;
  triggerZ: number;
  baseX: number;
  hideX: number;
  closeX?: number;
  closeZ?: number;
  state: 'WATCHING' | 'STEPPING_BACK' | 'VANISHED' | 'DISTANT_WATCHING' | 'TURNING_HEAD' | 'LAMP_DIMMING' | 'REAPPEAR_CLOSE' | 'FADING_OUT';
  timer: number;
}

export interface LastTrainActor {
  group: THREE.Group;
  locomotive: THREE.Object3D;
  carriages: THREE.Object3D[];
  headlight?: THREE.Mesh;
  headlightBeam?: THREE.Mesh;
  stationSignalLight?: THREE.Mesh;
  windowGlows: THREE.Mesh[];
  ghostPassengers: THREE.Object3D[];
  emptyCarriage?: THREE.Object3D;
  finalWindowSpecter?: THREE.Object3D;
  wheels: THREE.Object3D[];
  speed: number;
  triggerZ: number;
  minZ: number;
  maxZ: number;
  state: 'APPROACHING' | 'PASSING' | 'FADING_INTO_FOG' | 'DISTANT_SIGNAL' | 'EMERGING' | 'PASSING_ALONGSIDE' | 'FADING_INTO_MIST' | 'VANISHED';
  timer: number;
  fogFadeTimer: number;
}

export interface StationAwakensActor {
  group: THREE.Group;
  solitaryWindow: THREE.Mesh;
  windows: THREE.Mesh[];
  platformLamps: THREE.Mesh[];
  ghostPassengers: Array<{ group: THREE.Object3D; head: THREE.Object3D; initialRotY: number }>;
  departureClock?: THREE.Object3D;
  departureClockHand?: THREE.Object3D;
  shadowSilhouetteSweep?: THREE.Object3D;
  finalDistantFigure?: THREE.Object3D;
  triggerZ: number;
  state: 'DESERTED' | 'SINGLE_WINDOW' | 'LIGHTS_ACTIVATING' | 'PASSENGERS_APPEARING' | 'CLOCK_REVERSING' | 'SHADOW_SWEEP' | 'PASSENGERS_TURNING' | 'BLACKOUT' | 'FINAL_REVEAL';
  timer: number;
  clockAngle: number;
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
 * 
 * SIGNED-DISTANCE CONVENTION:
 * For negative-Z forward travel (player running toward -Z):
 *   distanceAhead = playerZ - encounterZ
 * When player is at -400m and encounter is at -500m:
 *   distanceAhead = (-400) - (-500) = +100m (100m ahead).
 * When player reaches encounter at -500m:
 *   distanceAhead = (-500) - (-500) = 0m.
 * When player passes to -520m:
 *   distanceAhead = (-520) - (-500) = -20m (20m behind).
 */
export class PhantomLineEventDirector {
  private static instance: PhantomLineEventDirector | null = null;

  private totalTime: number = 0;
  private frameCounter: number = 0;

  // Registered Actors
  private watchers: WatcherActor[] = [];
  private lastTrains: LastTrainActor[] = [];
  private stationAwakens: StationAwakensActor[] = [];
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

  public registerStationAwakens(actor: StationAwakensActor): void {
    this.stationAwakens.push(actor);
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
    this.stationAwakens.length = 0;
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
    this.watchers = this.watchers.filter((a) => !this.isDetached(a.group));
    this.lastTrains = this.lastTrains.filter((a) => !this.isDetached(a.group));
    this.stationAwakens = this.stationAwakens.filter((a) => !this.isDetached(a.group));
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

    // =========================================================================
    // FLAGSHIP 1: THE WATCHER ENCOUNTER
    // =========================================================================
    for (let i = 0; i < this.watchers.length; i++) {
      const w = this.watchers[i];
      // CANONICAL SIGNED DISTANCE FOR NEGATIVE-Z TRAVEL:
      // Positive when player is running towards the encounter from greater Z
      const distanceAhead = pZ - w.triggerZ;

      w.timer += dt;

      // Soft breathing coat sway whenever body is visible
      for (let c = 0; c < w.coatTails.length; c++) {
        w.coatTails[c].rotation.x = Math.sin(t * 1.8 + c) * 0.05 * motionScale;
      }

      // Check state progression based on distanceAhead
      if (distanceAhead > 130) {
        // Distant observation: standing motionless under distant lamp
        w.state = 'WATCHING';
        if (w.platformLamp) w.platformLamp.scale.setScalar(1.0);
        if (w.closeVergeMesh) w.closeVergeMesh.visible = false;
        w.group.visible = true;
      } else if (distanceAhead > 65) {
        // Player notices figure during approach; subtle head tracking begins
        w.state = 'WATCHING';
        const lookAngle = THREE.MathUtils.clamp((distanceAhead - 90) * 0.015, -0.65, 0.65);
        w.head.rotation.y = THREE.MathUtils.lerp(w.head.rotation.y, lookAngle, dt * 3.5);
        w.head.rotation.z = Math.sin(t * 2.0) * 0.04 * motionScale; // Eerie head tilt
        if (w.platformLamp) w.platformLamp.scale.setScalar(1.0);
        if (w.closeVergeMesh) w.closeVergeMesh.visible = false;
      } else if (distanceAhead > 32) {
        // 3. Figure slowly turns its head toward player; 4. Platform stillness
        w.state = 'WATCHING';
        w.head.rotation.y = THREE.MathUtils.lerp(w.head.rotation.y, 0, dt * 4.0); // Directly facing track
        w.head.rotation.z = Math.sin(t * 1.5) * 0.06 * motionScale;
        if (w.platformLamp) w.platformLamp.scale.setScalar(0.95);
        if (w.closeVergeMesh) w.closeVergeMesh.visible = false;
      } else if (distanceAhead > 18) {
        // 5. Lamp dims briefly; 6. Figure vanishes
        w.state = 'STEPPING_BACK';
        // Platform lamp dips to low eerie pulse
        if (w.platformLamp) {
          const dim = Math.max(0.15, 0.4 + 0.3 * Math.sin(t * 12.0));
          w.platformLamp.scale.setScalar(dim);
        }
        // Figure steps behind column / dissolves into shadows
        const stepProgress = Math.min(1.0, (32 - distanceAhead) / 14);
        w.group.position.x = THREE.MathUtils.lerp(w.baseX, w.hideX, stepProgress);
        for (let e = 0; e < w.eyes.length; e++) {
          w.eyes[e].scale.setScalar(Math.max(0.01, 1.0 - stepProgress));
        }
        if (w.closeVergeMesh) w.closeVergeMesh.visible = false;
      } else if (distanceAhead > -4) {
        // 7. Figure unexpectedly reappears at closer, safe trackside location!
        // 8. Stares toward the moving runner!
        w.state = 'VANISHED'; // Platform watcher is vanished
        w.group.visible = false;

        if (w.closeVergeMesh) {
          w.closeVergeMesh.visible = true;
          // Shock reveal: twin cyan eyes pierce through fog at trackside verge
          if (w.closeVergeHead) {
            const trackAngle = THREE.MathUtils.clamp(-distanceAhead * 0.04, -0.85, 0.85);
            w.closeVergeHead.rotation.y = trackAngle;
            w.closeVergeHead.rotation.z = 0.08 * motionScale;
          }
          if (w.closeVergeEyes) {
            for (let e = 0; e < w.closeVergeEyes.length; e++) {
              w.closeVergeEyes[e].scale.setScalar(1.25 + 0.25 * Math.sin(t * 8.0));
            }
          }
        }
      } else {
        // 9. Figure fades into darkness as player rushes past
        w.state = 'VANISHED';
        w.group.visible = false;
        if (w.closeVergeMesh) {
          w.closeVergeMesh.visible = false;
        }
      }
    }

    // =========================================================================
    // FLAGSHIP 2: THE LAST TRAIN ARRIVAL, PASSENGER REVEAL & DEPARTURE
    // =========================================================================
    for (let i = 0; i < this.lastTrains.length; i++) {
      const lt = this.lastTrains[i];
      const distanceAhead = pZ - lt.triggerZ;

      lt.timer += dt;

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

      // 1. Distant station signal turns on
      if (lt.stationSignalLight) {
        lt.stationSignalLight.visible = distanceAhead < 160 && distanceAhead > -60;
        const sigPulse = 0.8 + 0.25 * Math.sin(t * 4.0);
        lt.stationSignalLight.scale.setScalar(sigPulse);
      }

      // State progression along distance
      if (distanceAhead > 130) {
        lt.state = 'APPROACHING';
        lt.group.visible = true;
        if (lt.headlightBeam) lt.headlightBeam.scale.set(0.4, 0.4, 0.4);
      } else if (distanceAhead > 70) {
        // 2. Spectral train emerges from tunnel; 3. Headlights illuminate fog
        lt.state = 'APPROACHING';
        lt.group.visible = true;
        if (lt.headlightBeam) {
          const beamPulse = 1.0 + 0.15 * Math.sin(t * 3.0);
          lt.headlightBeam.scale.set(beamPulse, beamPulse, beamPulse * 1.3);
          lt.headlightBeam.visible = true;
        }
      } else if (distanceAhead > -25) {
        // 4. Ghost passengers turn toward runner; 5. Travels alongside; 6. Empty car; 7. Final window figure
        lt.state = 'PASSING';
        lt.group.visible = true;

        // Glowing cyan passenger windows pulse softly
        for (let g = 0; g < lt.windowGlows.length; g++) {
          const glow = lt.windowGlows[g];
          const pulse = 0.85 + 0.18 * Math.sin(t * 3.2 + g * 0.6);
          glow.scale.set(1.0, pulse, 1.0);
        }

        // Ghost passengers visible through windows turn toward runner
        for (let p = 0; p < lt.ghostPassengers.length; p++) {
          const pass = lt.ghostPassengers[p];
          pass.rotation.z = Math.sin(t * 2.2 + p) * 0.06 * motionScale;
          const turnAngle = THREE.MathUtils.clamp((distanceAhead - 25) * 0.02, -0.6, 0.6);
          pass.rotation.y = THREE.MathUtils.lerp(pass.rotation.y, turnAngle, dt * 3.0);
        }

        // Final window lone figure staring intently
        if (lt.finalWindowSpecter) {
          lt.finalWindowSpecter.rotation.y = THREE.MathUtils.lerp(lt.finalWindowSpecter.rotation.y, -0.75, dt * 4.0);
          lt.finalWindowSpecter.rotation.z = 0.08 * Math.sin(t * 3.5);
        }
      } else {
        // 8. Train vanishes into mist
        lt.state = 'FADING_INTO_FOG';
        lt.fogFadeTimer += dt;
        const fadeProg = Math.min(1.0, lt.fogFadeTimer * 1.5);
        const scaleVal = Math.max(0.01, 1.0 - fadeProg * 0.7);
        lt.group.scale.set(scaleVal, scaleVal, scaleVal);

        if (fadeProg >= 1.0) {
          lt.group.visible = false;
        }
      }
    }

    // =========================================================================
    // FLAGSHIP 3: THE STATION AWAKENS (Grand Large-Scale Environment Event)
    // =========================================================================
    for (let i = 0; i < this.stationAwakens.length; i++) {
      const sa = this.stationAwakens[i];
      const distanceAhead = pZ - sa.triggerZ;

      sa.timer += dt;

      if (distanceAhead > 130) {
        // 1. Deserted station: dark and silent
        sa.state = 'DESERTED';
        sa.solitaryWindow.visible = false;
        for (let w = 0; w < sa.windows.length; w++) sa.windows[w].visible = false;
        for (let l = 0; l < sa.platformLamps.length; l++) sa.platformLamps[l].visible = false;
        for (let p = 0; p < sa.ghostPassengers.length; p++) sa.ghostPassengers[p].group.visible = false;
        if (sa.shadowSilhouetteSweep) sa.shadowSilhouetteSweep.visible = false;
        if (sa.finalDistantFigure) sa.finalDistantFigure.visible = false;
      } else if (distanceAhead > 105) {
        // 2. A single window illuminates
        sa.state = 'SINGLE_WINDOW';
        sa.solitaryWindow.visible = true;
        const pulse = 0.85 + 0.15 * Math.sin(t * 5.0);
        sa.solitaryWindow.scale.setScalar(pulse);
        for (let w = 0; w < sa.windows.length; w++) sa.windows[w].visible = false;
        for (let l = 0; l < sa.platformLamps.length; l++) sa.platformLamps[l].visible = false;
        for (let p = 0; p < sa.ghostPassengers.length; p++) sa.ghostPassengers[p].group.visible = false;
      } else if (distanceAhead > 75) {
        // 3. More station lights activate gradually
        sa.state = 'LIGHTS_ACTIVATING';
        sa.solitaryWindow.visible = true;
        const litCount = Math.min(sa.windows.length, Math.floor((105 - distanceAhead) * 0.4));
        for (let w = 0; w < sa.windows.length; w++) {
          sa.windows[w].visible = w < litCount;
        }
        for (let l = 0; l < sa.platformLamps.length; l++) {
          sa.platformLamps[l].visible = l < litCount * 0.6;
        }
      } else if (distanceAhead > 55) {
        // 4. Ghostly figures appear along the platform; 5. Departure clock moves backward
        sa.state = 'PASSENGERS_APPEARING';
        sa.solitaryWindow.visible = true;
        for (let w = 0; w < sa.windows.length; w++) sa.windows[w].visible = true;
        for (let l = 0; l < sa.platformLamps.length; l++) sa.platformLamps[l].visible = true;
        for (let p = 0; p < sa.ghostPassengers.length; p++) {
          sa.ghostPassengers[p].group.visible = true;
          sa.ghostPassengers[p].head.rotation.y = sa.ghostPassengers[p].initialRotY;
        }
        // Departure clock spins backward
        if (sa.departureClockHand) {
          sa.clockAngle -= dt * 4.5 * motionScale;
          sa.departureClockHand.rotation.z = sa.clockAngle;
        }
      } else if (distanceAhead > 35) {
        // 6. A shadow crosses the terminal; Clock continuing reverse
        sa.state = 'SHADOW_SWEEP';
        if (sa.departureClockHand) {
          sa.clockAngle -= dt * 6.0 * motionScale;
          sa.departureClockHand.rotation.z = sa.clockAngle;
        }
        if (sa.shadowSilhouetteSweep) {
          sa.shadowSilhouetteSweep.visible = true;
          // Sweeps smoothly across terminal vault
          const sweepProg = (55 - distanceAhead) / 20;
          sa.shadowSilhouetteSweep.position.x = THREE.MathUtils.lerp(-18, 18, sweepProg);
        }
      } else if (distanceAhead > 16) {
        // 7. ALL ghost passengers suddenly snap heads to turn toward runner!
        sa.state = 'PASSENGERS_TURNING';
        if (sa.departureClockHand) {
          sa.clockAngle -= dt * 8.0 * motionScale;
          sa.departureClockHand.rotation.z = sa.clockAngle;
        }
        for (let p = 0; p < sa.ghostPassengers.length; p++) {
          const pass = sa.ghostPassengers[p];
          pass.group.visible = true;
          // Synchronous snap toward runner
          pass.head.rotation.y = THREE.MathUtils.lerp(pass.head.rotation.y, 0, dt * 8.0);
          pass.head.rotation.z = Math.sin(t * 3.0 + p) * 0.08 * motionScale;
        }
      } else if (distanceAhead > 6) {
        // 8. Sudden blackout! All station lights and passengers go dark
        sa.state = 'BLACKOUT';
        sa.solitaryWindow.visible = false;
        for (let w = 0; w < sa.windows.length; w++) sa.windows[w].visible = false;
        for (let l = 0; l < sa.platformLamps.length; l++) sa.platformLamps[l].visible = false;
        for (let p = 0; p < sa.ghostPassengers.length; p++) sa.ghostPassengers[p].group.visible = false;
        if (sa.shadowSilhouetteSweep) sa.shadowSilhouetteSweep.visible = false;
      } else if (distanceAhead > -35) {
        // 9. One solitary distant figure remains for unsettling final reveal
        sa.state = 'FINAL_REVEAL';
        sa.solitaryWindow.visible = false;
        for (let w = 0; w < sa.windows.length; w++) sa.windows[w].visible = false;
        for (let l = 0; l < sa.platformLamps.length; l++) sa.platformLamps[l].visible = false;
        for (let p = 0; p < sa.ghostPassengers.length; p++) sa.ghostPassengers[p].group.visible = false;

        if (sa.finalDistantFigure) {
          sa.finalDistantFigure.visible = true;
          sa.finalDistantFigure.rotation.y = Math.sin(t * 2.0) * 0.25 * motionScale;
        }
      } else {
        // Fully resolved
        sa.state = 'DESERTED';
        if (sa.finalDistantFigure) sa.finalDistantFigure.visible = false;
      }
    }

    // =========================================================================
    // 4. THE LOST CONDUCTOR
    // =========================================================================
    for (let i = 0; i < this.conductors.length; i++) {
      const cond = this.conductors[i];
      const distanceAhead = pZ - cond.triggerZ;

      if (distanceAhead < 90 && distanceAhead > -20) {
        cond.timer += dt;

        if (distanceAhead > 45) {
          cond.state = 'INSPECTING';
          // Checks antique pocket watch / invisible ticket
          cond.head.rotation.x = 0.25;
          cond.armLantern.rotation.z = Math.sin(t * 2.0) * 0.12 * motionScale;
        } else if (distanceAhead > -5) {
          cond.state = 'SIGNALING';
          // Raises glowing lantern to signal track
          cond.armLantern.rotation.z = THREE.MathUtils.lerp(cond.armLantern.rotation.z, 0.75, dt * 3.5);
          cond.head.rotation.y = THREE.MathUtils.lerp(cond.head.rotation.y, -0.45, dt * 3.5);

          if (cond.lanternBulb) {
            const glow = 0.85 + 0.25 * Math.sin(t * 5.0);
            cond.lanternBulb.scale.setScalar(glow);
          }
        } else {
          cond.state = 'DISSOLVING';
          const dissolveProg = Math.min(1.0, (-distanceAhead - 5) / 12);
          cond.group.scale.setScalar(Math.max(0.01, 1.0 - dissolveProg));
          cond.group.position.y += dt * 1.2; // Rises into mist
          if (dissolveProg >= 1.0) {
            cond.group.visible = false;
          }
        }
      }
    }

    // =========================================================================
    // 5. THE MISSING PASSENGER CROWD
    // =========================================================================
    for (let i = 0; i < this.passengerCrowds.length; i++) {
      const crowd = this.passengerCrowds[i];
      const distanceAhead = pZ - crowd.triggerZ;

      if (distanceAhead < 110 && distanceAhead > -15) {
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
        if (distanceAhead < 10) {
          crowd.state = 'VANISHED';
          crowd.group.visible = false;
        }
      }
    }

    // =========================================================================
    // 6. FLOODED GHOST REFLECTION
    // =========================================================================
    for (let i = 0; i < this.floodedReflections.length; i++) {
      const fr = this.floodedReflections[i];
      const distanceAhead = pZ - fr.triggerZ;

      if (distanceAhead < 90 && distanceAhead > -25) {
        fr.timer += dt;

        // Reflection drifts independently across water basin
        fr.waterReflection.position.z = Math.sin(fr.timer * 1.5 + fr.phase) * 1.8 * motionScale;
        fr.waterReflection.position.x = Math.cos(fr.timer * 1.2 + fr.phase) * 0.8 * motionScale;

        // Spectral figure rises slowly from the dark water
        if (distanceAhead < 50 && fr.state === 'INDEPENDENT_DRIFT') {
          fr.state = 'RISING';
        }

        if (fr.state === 'RISING') {
          fr.emergingSpecter.visible = true;
          fr.emergingSpecter.position.y = Math.min(2.2, fr.emergingSpecter.position.y + dt * 1.2 * motionScale);
          fr.emergingSpecter.rotation.z = Math.sin(t * 2.2) * 0.08 * motionScale;

          if (distanceAhead < -10) {
            fr.state = 'DISSOLVED';
            fr.emergingSpecter.visible = false;
          }
        }
      }
    }

    // =========================================================================
    // 7. ILLUMINATED SURREAL APARTMENT WINDOWS
    // =========================================================================
    for (let i = 0; i < this.illuminatedBuildings.length; i++) {
      const bldg = this.illuminatedBuildings[i];
      const distanceAhead = pZ - bldg.triggerZ;

      if (distanceAhead < 120 && distanceAhead > -30) {
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

    // =========================================================================
    // 8. SHADOW ENTITY (Rare Distant Silhouette)
    // =========================================================================
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

    // =========================================================================
    // 9. IMPOSSIBLE CLOCKS
    // =========================================================================
    for (let i = 0; i < this.impossibleClocks.length; i++) {
      const ic = this.impossibleClocks[i];
      const distanceAhead = pZ - ic.triggerZ;

      if (distanceAhead < 90 && distanceAhead > -20) {
        ic.timer += dt;

        // Clock hand sweeps retrograde (counter-clockwise)
        ic.handAngle -= dt * 3.5 * motionScale;
        ic.clockHand.rotation.z = ic.handAngle;

        // Shadow figure underneath manifests
        ic.shadowFigure.visible = true;
        ic.shadowFigure.rotation.y = Math.sin(ic.timer * 2.0) * 0.25 * motionScale;
      }
    }

    // =========================================================================
    // 10. SPECTRAL FOOTSTEPS
    // =========================================================================
    for (let i = 0; i < this.spectralFootsteps.length; i++) {
      const sf = this.spectralFootsteps[i];
      const distanceAhead = pZ - sf.triggerZ;

      if (distanceAhead < 80 && distanceAhead > -15) {
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

    // =========================================================================
    // 11. AMBIENT HAUNTINGS: SOFT FLICKERING LAMPS & WILL-O'-THE-WISPS
    // =========================================================================
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

  // --- Diagnostics & Getters ---

  public getDiagnostics(): Record<string, number> {
    return {
      watchers: this.watchers.length,
      lastTrains: this.lastTrains.length,
      stationAwakens: this.stationAwakens.length,
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

  public getWatchers(): readonly WatcherActor[] {
    return this.watchers;
  }

  public getLastTrains(): readonly LastTrainActor[] {
    return this.lastTrains;
  }

  public getStationAwakens(): readonly StationAwakensActor[] {
    return this.stationAwakens;
  }
}
