import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';

export interface InterlockingGear {
  mesh: THREE.Object3D;
  speed: number;
  axis: 'x' | 'y' | 'z';
  initialRotation?: number;
}

export interface ClockTowerChime {
  clockFaceMesh: THREE.Mesh;
  hammer?: THREE.Object3D;
  resonanceRings?: THREE.Mesh[];
  timer: number;
  cycleInterval: number; // Seconds between chimes
}

export interface RetractableBridge {
  group: THREE.Object3D;
  leftSpan: THREE.Object3D;
  rightSpan: THREE.Object3D;
  maxExtension: number;
  currentExtension: number;
  phase: number;
}

export interface SteamPiston {
  pistonHead: THREE.Object3D;
  connectingRod?: THREE.Object3D;
  steamPlume?: THREE.Mesh;
  strokeAmplitude: number;
  baseY: number;
  frequency: number;
  phaseOffset: number;
}

export interface ObservatoryRingAssembly {
  outerRing: THREE.Object3D;
  middleRing: THREE.Object3D;
  innerRing: THREE.Object3D;
  orreryArm?: THREE.Object3D;
  speedMultiplier: number;
}

export interface SkybridgeTrain {
  group: THREE.Group;
  speed: number;
  minZ: number;
  maxZ: number;
  driveRods?: THREE.Object3D[];
}

export interface TimePortalVortex {
  outerRing: THREE.Object3D;
  innerRing: THREE.Object3D;
  coreVortex: THREE.Mesh;
  sparkles?: THREE.Points;
}

export interface ClockReversalEvent {
  clockFace: THREE.Object3D;
  minuteHand: THREE.Object3D;
  hourHand: THREE.Object3D;
  connectedGears: THREE.Object3D[];
  timer: number;
  duration: number;
  cooldown: number;
}

export interface CelestialAlignmentEvent {
  outerRing: THREE.Object3D;
  middleRing: THREE.Object3D;
  innerRing: THREE.Object3D;
  orreryArm: THREE.Object3D;
  sunBeam?: THREE.Mesh;
  timer: number;
  duration: number;
  cooldown: number;
}

export interface CarillonBell {
  mesh: THREE.Object3D;
  speed: number;
  amplitude: number;
  phase: number;
}

export interface PressureGaugeNeedle {
  mesh: THREE.Object3D;
  frequency: number;
  amplitude: number;
  phase: number;
}

// ============================================================================
// BLOCKBUSTER ACTOR INTERFACES (LEVEL 3 CINEMATIC SPECTACLES)
// ============================================================================

export type CinematicStage = 'DORMANT' | 'ANTICIPATION' | 'ACTIVATION' | 'CLIMAX' | 'AFTERMATH' | 'COMPLETE';

export interface ClockworkTitanActor {
  group: THREE.Group;
  triggerZ: number;
  state: CinematicStage;
  torso: THREE.Object3D;
  head: THREE.Object3D;
  eyes: THREE.Mesh[];
  armLeft?: THREE.Object3D;
  armRight?: THREE.Object3D;
  forearmRight?: THREE.Object3D;
  cuirassLeft?: THREE.Object3D;
  cuirassRight?: THREE.Object3D;
  legPistons?: THREE.Object3D[];
  coreGears: THREE.Object3D[];
  coreLight: THREE.Mesh;
  exhaustPipes?: THREE.Object3D[];
  steamPlumes?: THREE.Mesh[];
  cityVents?: THREE.Mesh[];
  cityLanterns?: THREE.Mesh[];
  timer: number;
  side: number;
}

export interface GreatTimeRiftActor {
  group: THREE.Group;
  triggerZ: number;
  state: CinematicStage;
  outerRing: THREE.Object3D;
  middleRing: THREE.Object3D;
  innerRing: THREE.Object3D;
  lockingClamps: THREE.Object3D[];
  portalVortex: THREE.Mesh | THREE.Object3D;
  portalChamber?: THREE.Group;
  alternateSkyline?: THREE.Group;
  energySingularity?: THREE.Object3D;
  energyRays: THREE.Mesh[];
  sparkles?: THREE.Points | THREE.Group;
  timer: number;
  side: number;
}

export interface MechanicalDragonActor {
  group: THREE.Group;
  triggerZ: number;
  state: 'DORMANT' | 'FLIGHT' | 'ORBIT' | 'DISPERSE' | 'COMPLETE';
  neck: THREE.Object3D;
  head: THREE.Object3D;
  jaw?: THREE.Object3D;
  wingsLeft: THREE.Object3D[];
  wingsRight: THREE.Object3D[];
  tailSegments: THREE.Object3D[];
  flightProgress: number;
  baseY: number;
  flightPathRadius: number;
  timer: number;
}

export interface TransformingCityActor {
  group: THREE.Group;
  triggerZ: number;
  state: CinematicStage;
  telescopingTowers: Array<{ mesh: THREE.Object3D; baseY: number; maxLift: number }>;
  foldingRoofs: Array<{ leftPanel: THREE.Object3D; rightPanel: THREE.Object3D; maxAngle: number }>;
  extendingBridges: Array<{ leftSpan: THREE.Object3D; rightSpan: THREE.Object3D; maxSpan: number }>;
  engagingGears: Array<{ mesh: THREE.Object3D; speed: number; axis: 'x' | 'y' | 'z' }>;
  timer: number;
}

export interface GiantHourglassActor {
  group: THREE.Group;
  triggerZ: number;
  hourglassFrame: THREE.Object3D;
  sandUpper: THREE.Mesh;
  sandLower: THREE.Mesh;
  sandStream: THREE.Mesh;
  pivotGear?: THREE.Object3D;
  rotationProgress: number;
  timer: number;
}

export interface PendulumCathedralActor {
  group: THREE.Group;
  triggerZ: number;
  pendulums: Array<{ rod: THREE.Object3D; bob: THREE.Mesh; speed: number; amplitude: number; phase: number }>;
  carillonSpire?: THREE.Object3D;
  timer: number;
}

export interface ClockworkBirdSwarmActor {
  group: THREE.Group;
  triggerZ: number;
  birds: Array<{ mesh: THREE.Object3D; leftWing: THREE.Object3D; rightWing: THREE.Object3D; offset: THREE.Vector3; flapSpeed: number }>;
  active: boolean;
  timer: number;
}

export interface ClockworkAwakeningActor {
  group: THREE.Group;
  clockTower: THREE.Object3D;
  clockFaceMesh: THREE.Mesh;
  chimeHammer?: THREE.Object3D;
  resonanceRings?: THREE.Mesh[];
  pendulumRod?: THREE.Object3D;
  pendulumBob?: THREE.Mesh;
  interlockingGears: Array<{ mesh: THREE.Object3D; speed: number; axis: 'x' | 'y' | 'z' }>;
  steamPistons: Array<{ head: THREE.Object3D; plume?: THREE.Mesh; stroke: number; freq: number }>;
  telescopingBridges: Array<{ leftSpan: THREE.Object3D; rightSpan: THREE.Object3D; maxSpan: number }>;
  cityLanterns?: THREE.Mesh[];
  steamVents?: THREE.Mesh[];
  triggerZ: number;
  state: CinematicStage;
  timer: number;
}

/**
 * ChronoKingdomEventDirector
 * Singleton managing all animated clockwork, celestial, and temporal world events with high performance,
 * deterministic timing, zero per-frame garbage, and reduced-motion accessibility.
 */
export class ChronoKingdomEventDirector {
  private static instance: ChronoKingdomEventDirector | null = null;

  private gears: InterlockingGear[] = [];
  private chimes: ClockTowerChime[] = [];
  private bridges: RetractableBridge[] = [];
  private pistons: SteamPiston[] = [];
  private observatories: ObservatoryRingAssembly[] = [];
  private skybridgeTrains: SkybridgeTrain[] = [];
  private timePortals: TimePortalVortex[] = [];
  private clockReversals: ClockReversalEvent[] = [];
  private celestialAlignments: CelestialAlignmentEvent[] = [];
  private carillonBells: CarillonBell[] = [];
  private pressureGauges: PressureGaugeNeedle[] = [];

  // Blockbuster Actors (Level 3 Cinematic Spectacles)
  private titans: ClockworkTitanActor[] = [];
  private timeRifts: GreatTimeRiftActor[] = [];
  private dragons: MechanicalDragonActor[] = [];
  private transformingCities: TransformingCityActor[] = [];
  private hourglasses: GiantHourglassActor[] = [];
  private pendulumCathedrals: PendulumCathedralActor[] = [];
  private birdSwarms: ClockworkBirdSwarmActor[] = [];
  private clockworkAwakenings: ClockworkAwakeningActor[] = [];

  private activeScene: THREE.Scene | null = null;
  private globalTime: number = 0;

  private constructor() {
    if (typeof window !== 'undefined') {
      (window as any).__CHRONO_DIRECTOR__ = this;
    }
  }

  public static getInstance(): ChronoKingdomEventDirector {
    if (!this.instance) {
      this.instance = new ChronoKingdomEventDirector();
    }
    return this.instance;
  }

  public setScene(scene: THREE.Scene | null): void {
    this.activeScene = scene;
  }

  /**
   * Prunes detached objects whose chunk parents were recycled.
   * Traverses object ancestor chain to ensure objects whose entire chunk
   * group was unparented from the live scene graph are cleanly purged.
   * Completely prevents unbounded accumulation over long runs.
   */
  private pruneDetached(): void {
    const isAttached = (obj: THREE.Object3D | null | undefined): boolean => {
      if (!obj || !obj.parent) return false;
      let curr: THREE.Object3D = obj;
      let depth = 0;
      while (curr.parent && depth < 25) {
        curr = curr.parent;
        depth++;
      }
      if (this.activeScene) {
        return curr === this.activeScene;
      }
      return (curr as any).isScene === true || curr.type === 'Scene' || (curr instanceof THREE.Group && depth > 0);
    };

    this.gears = this.gears.filter(g => isAttached(g.mesh));
    this.chimes = this.chimes.filter(c => isAttached(c.clockFaceMesh));
    this.bridges = this.bridges.filter(b => isAttached(b.group));
    this.pistons = this.pistons.filter(p => isAttached(p.pistonHead));
    this.observatories = this.observatories.filter(o => isAttached(o.outerRing));
    this.skybridgeTrains = this.skybridgeTrains.filter(t => isAttached(t.group));
    this.timePortals = this.timePortals.filter(p => isAttached(p.outerRing));
    this.clockReversals = this.clockReversals.filter(r => isAttached(r.clockFace));
    this.celestialAlignments = this.celestialAlignments.filter(a => isAttached(a.outerRing));
    this.carillonBells = this.carillonBells.filter(b => isAttached(b.mesh));
    this.pressureGauges = this.pressureGauges.filter(g => isAttached(g.mesh));

    this.titans = this.titans.filter(t => isAttached(t.group));
    this.timeRifts = this.timeRifts.filter(r => isAttached(r.group));
    this.dragons = this.dragons.filter(d => isAttached(d.group));
    this.transformingCities = this.transformingCities.filter(c => isAttached(c.group));
    this.hourglasses = this.hourglasses.filter(h => isAttached(h.group));
    this.pendulumCathedrals = this.pendulumCathedrals.filter(p => isAttached(p.group));
    this.birdSwarms = this.birdSwarms.filter(s => isAttached(s.group));
    this.clockworkAwakenings = this.clockworkAwakenings.filter(a => isAttached(a.group));
  }

  /**
   * Clear all registered animated scene objects (called on world teardown/rebuild)
   */
  public reset(): void {
    this.gears = [];
    this.chimes = [];
    this.bridges = [];
    this.pistons = [];
    this.observatories = [];
    this.skybridgeTrains = [];
    this.timePortals = [];
    this.clockReversals = [];
    this.celestialAlignments = [];
    this.carillonBells = [];
    this.pressureGauges = [];
    this.titans = [];
    this.timeRifts = [];
    this.dragons = [];
    this.transformingCities = [];
    this.hourglasses = [];
    this.pendulumCathedrals = [];
    this.birdSwarms = [];
    this.clockworkAwakenings = [];
    this.globalTime = 0;
  }

  // =========================================================================
  // REGISTRATION API
  // =========================================================================

  /**
   * Event 1: Register Interlocking Gear for mathematical synchronized rotation
   */
  public registerGear(mesh: THREE.Object3D, speed: number = 1.0, axis: 'x' | 'y' | 'z' = 'z'): void {
    this.gears.push({ mesh, speed, axis });
  }

  /**
   * Event 2: Register Monumental Clock Tower with chime hammer and resonance rings
   */
  public registerClockChime(
    clockFaceMesh: THREE.Mesh,
    hammer?: THREE.Object3D,
    resonanceRings?: THREE.Mesh[],
    cycleInterval: number = 12.0
  ): void {
    this.chimes.push({
      clockFaceMesh,
      hammer,
      resonanceRings,
      timer: 0,
      cycleInterval
    });
  }

  /**
   * Event 3: Register Retractable Telescoping Brass Skybridge
   */
  public registerRetractableBridge(
    group: THREE.Object3D,
    leftSpan: THREE.Object3D,
    rightSpan: THREE.Object3D,
    maxExtension: number = 4.5
  ): void {
    this.bridges.push({
      group,
      leftSpan,
      rightSpan,
      maxExtension,
      currentExtension: 0,
      phase: 0
    });
  }

  /**
   * Alias for registerRetractableBridge
   */
  public registerBridge(
    group: THREE.Object3D,
    leftSpan: THREE.Object3D,
    rightSpan: THREE.Object3D,
    maxExtension: number = 4.5
  ): void {
    this.registerRetractableBridge(group, leftSpan, rightSpan, maxExtension);
  }

  /**
   * Event 4: Register Timed Industrial Steam Piston with reciprocating stroke
   */
  public registerPiston(
    pistonHead: THREE.Object3D,
    baseY: number,
    strokeAmplitude: number = 1.6,
    frequency: number = 3.0,
    phaseOffset: number = 0,
    connectingRod?: THREE.Object3D,
    steamPlume?: THREE.Mesh
  ): void {
    this.pistons.push({
      pistonHead,
      connectingRod,
      steamPlume,
      strokeAmplitude,
      baseY,
      frequency,
      phaseOffset
    });
  }

  /**
   * Event 5: Register Observatory Concentric Astronomical Rings & Orrery
   */
  public registerObservatory(
    outerRing: THREE.Object3D,
    middleRing: THREE.Object3D,
    innerRing: THREE.Object3D,
    orreryArm?: THREE.Object3D,
    speedMultiplier: number = 1.0
  ): void {
    this.observatories.push({
      outerRing,
      middleRing,
      innerRing,
      orreryArm,
      speedMultiplier
    });
  }

  /**
   * Event 6: Register Distant Skybridge Clockwork Train Pass
   */
  public registerSkybridgeTrain(
    train: THREE.Group,
    speed: number = 16.0,
    minZ: number = -160,
    maxZ: number = 40,
    driveRods?: THREE.Object3D[]
  ): void {
    this.skybridgeTrains.push({
      group: train,
      speed,
      minZ,
      maxZ,
      driveRods
    });
  }

  /**
   * Event 7: Register Fractured Time Portal Vortex
   */
  public registerTimePortal(
    outerRing: THREE.Object3D,
    innerRing: THREE.Object3D,
    coreVortex: THREE.Mesh,
    sparkles?: THREE.Points
  ): void {
    this.timePortals.push({
      outerRing,
      innerRing,
      coreVortex,
      sparkles
    });
  }

  /**
   * Surprise 1: The Great Clock Reversal
   * Monumental clock dial and gears rapidly spin backward, pulsating with temporal radiance
   */
  public registerClockReversal(
    clockFace: THREE.Object3D,
    minuteHand: THREE.Object3D,
    hourHand: THREE.Object3D,
    connectedGears: THREE.Object3D[] = [],
    duration: number = 4.0,
    cooldown: number = 18.0
  ): void {
    this.clockReversals.push({
      clockFace,
      minuteHand,
      hourHand,
      connectedGears,
      timer: 0,
      duration,
      cooldown
    });
  }

  /**
   * Surprise 2: The Celestial Alignment
   * Concentric armillary rings accelerate and align to quadrature while central orrery sun flares
   */
  public registerCelestialAlignment(
    outerRing: THREE.Object3D,
    middleRing: THREE.Object3D,
    innerRing: THREE.Object3D,
    orreryArm: THREE.Object3D,
    sunBeam?: THREE.Mesh,
    duration: number = 4.5,
    cooldown: number = 22.0
  ): void {
    this.celestialAlignments.push({
      outerRing,
      middleRing,
      innerRing,
      orreryArm,
      sunBeam,
      timer: 0,
      duration,
      cooldown
    });
  }

  /**
   * Ambient Micro-Detail: Swinging Campanile Carillon Bell
   */
  public registerCarillonBell(
    mesh: THREE.Object3D,
    speed: number = 2.5,
    amplitude: number = 0.45,
    phase: number = 0
  ): void {
    this.carillonBells.push({ mesh, speed, amplitude, phase });
  }

  /**
   * Ambient Micro-Detail: Oscillating Steam Pressure Gauge Needle
   */
  public registerPressureGauge(
    mesh: THREE.Object3D,
    frequency: number = 3.2,
    amplitude: number = 0.35,
    phase: number = 0
  ): void {
    this.pressureGauges.push({ mesh, frequency, amplitude, phase });
  }

  // =========================================================================
  // BLOCKBUSTER REGISTRATION METHODS (LEVEL 3 CINEMATIC SPECTACLES)
  // =========================================================================

  /**
   * Blockbuster Event A: The Clockwork Titan Awakens (Scene A Quality Gate)
   */
  public registerClockworkTitan(actor: ClockworkTitanActor): void {
    this.titans.push(actor);
  }

  /**
   * Blockbuster Event B: The Great Time Rift (Scene B Quality Gate)
   */
  public registerGreatTimeRift(actor: GreatTimeRiftActor): void {
    this.timeRifts.push(actor);
  }

  /**
   * Blockbuster Event C: The Mechanical Dragon
   */
  public registerMechanicalDragon(actor: MechanicalDragonActor): void {
    this.dragons.push(actor);
  }

  /**
   * Blockbuster Event D: The Transforming Clockwork City
   */
  public registerTransformingCity(actor: TransformingCityActor): void {
    this.transformingCities.push(actor);
  }

  /**
   * High-Value Surprise: The Giant Hourglass
   */
  public registerGiantHourglass(actor: GiantHourglassActor): void {
    this.hourglasses.push(actor);
  }

  /**
   * High-Value Surprise: The Pendulum Cathedral
   */
  public registerPendulumCathedral(actor: PendulumCathedralActor): void {
    this.pendulumCathedrals.push(actor);
  }

  /**
   * High-Value Surprise: The Clockwork Bird Swarm
   */
  public registerClockworkBirdSwarm(actor: ClockworkBirdSwarmActor): void {
    this.birdSwarms.push(actor);
  }

  /**
   * Blockbuster Signature A: The Great Clockwork Awakening
   */
  public registerClockworkAwakening(actor: ClockworkAwakeningActor): void {
    this.clockworkAwakenings.push(actor);
  }

  // =========================================================================
  // ANIMATION TICK LOOP
  // =========================================================================

  public update(delta: number, isCurrentTheme: boolean = true, playerZ: number = 0): void {
    if (!isCurrentTheme || delta <= 0) return;

    this.pruneDetached();

    const clampedDelta = Math.min(delta, 0.1);
    this.globalTime += clampedDelta;

    const reducedMotion = SettingsManager.getInstance().isReducedMotion();
    const motionScale = reducedMotion ? 0.15 : 1.0;

    // --- 1. Synchronized Gear Rotation ---
    for (let i = 0; i < this.gears.length; i++) {
      const g = this.gears[i];
      const dRot = g.speed * motionScale * clampedDelta;
      if (g.axis === 'x') g.mesh.rotation.x += dRot;
      else if (g.axis === 'y') g.mesh.rotation.y += dRot;
      else g.mesh.rotation.z += dRot;
    }

    // --- 2. Clock Tower Chime Event ---
    for (let i = 0; i < this.chimes.length; i++) {
      const chime = this.chimes[i];
      chime.timer += clampedDelta;
      const progress = (chime.timer % chime.cycleInterval) / chime.cycleInterval;

      if (progress > 0.90) {
        const strikeNorm = (progress - 0.90) / 0.10;
        if (chime.hammer) {
          const hammerAngle = Math.sin(strikeNorm * Math.PI * 4) * 0.35;
          chime.hammer.rotation.z = hammerAngle;
        }
        const mat = chime.clockFaceMesh.material as THREE.MeshStandardMaterial;
        if (mat && mat.emissive) {
          mat.emissiveIntensity = 0.5 + Math.sin(strikeNorm * Math.PI) * 1.5;
        }
        if (chime.resonanceRings) {
          for (let r = 0; r < chime.resonanceRings.length; r++) {
            const ring = chime.resonanceRings[r];
            const ringProgress = (strikeNorm + r * 0.3) % 1.0;
            const scale = 1.0 + ringProgress * 3.5;
            ring.scale.set(scale, scale, scale);
            const ringMat = ring.material as THREE.MeshBasicMaterial;
            if (ringMat) {
              ringMat.opacity = (1.0 - ringProgress) * 0.65;
            }
          }
        }
      } else {
        if (chime.hammer) chime.hammer.rotation.z = 0;
        const mat = chime.clockFaceMesh.material as THREE.MeshStandardMaterial;
        if (mat && mat.emissive) {
          mat.emissiveIntensity = 0.5;
        }
        if (chime.resonanceRings) {
          chime.resonanceRings.forEach(r => {
            const rMat = r.material as THREE.MeshBasicMaterial;
            if (rMat) rMat.opacity = 0;
          });
        }
      }
    }

    // --- 3. Retractable Telescoping Bridge ---
    for (let i = 0; i < this.bridges.length; i++) {
      const b = this.bridges[i];
      b.phase += clampedDelta * 0.4 * motionScale;
      const extensionFactor = 0.5 + 0.5 * Math.sin(b.phase);
      const ext = extensionFactor * b.maxExtension;
      b.leftSpan.position.x = -ext;
      b.rightSpan.position.x = ext;
    }

    // --- 4. Timed Steam Piston Sequence ---
    for (let i = 0; i < this.pistons.length; i++) {
      const p = this.pistons[i];
      const angle = this.globalTime * p.frequency * motionScale + p.phaseOffset;
      const stroke = Math.sin(angle);
      p.pistonHead.position.y = p.baseY + stroke * p.strokeAmplitude;

      if (p.connectingRod) {
        p.connectingRod.rotation.z = Math.cos(angle) * 0.25;
      }
      if (p.steamPlume) {
        if (stroke > 0.75) {
          const puff = (stroke - 0.75) / 0.25;
          p.steamPlume.scale.set(1.0 + puff * 1.5, 1.0 + puff * 2.2, 1.0 + puff * 1.5);
          const pMat = p.steamPlume.material as THREE.MeshBasicMaterial;
          if (pMat) pMat.opacity = (1.0 - puff) * 0.8;
          p.steamPlume.visible = true;
        } else {
          p.steamPlume.visible = false;
        }
      }
    }

    // --- 5. Astronomical Observatory Rings Rotation ---
    for (let i = 0; i < this.observatories.length; i++) {
      const obs = this.observatories[i];
      const rate = clampedDelta * obs.speedMultiplier * motionScale;
      obs.outerRing.rotation.z += rate * 0.35;
      obs.middleRing.rotation.y += rate * 0.55;
      obs.innerRing.rotation.x += rate * 0.75;
      if (obs.orreryArm) {
        obs.orreryArm.rotation.y += rate * 1.2;
      }
    }

    // --- 6. Distant Skybridge Clockwork Train Pass ---
    for (let i = 0; i < this.skybridgeTrains.length; i++) {
      const train = this.skybridgeTrains[i];
      train.group.position.z += train.speed * motionScale * clampedDelta;
      if (train.group.position.z > train.maxZ) {
        train.group.position.z = train.minZ;
      }
      if (train.driveRods) {
        const wheelAngle = this.globalTime * 8.0 * motionScale;
        for (let r = 0; r < train.driveRods.length; r++) {
          train.driveRods[r].position.y = Math.sin(wheelAngle) * 0.15;
          train.driveRods[r].position.z = Math.cos(wheelAngle) * 0.15;
        }
      }
    }

    // --- 7. Fractured Time Portal Vortex ---
    for (let i = 0; i < this.timePortals.length; i++) {
      const tp = this.timePortals[i];
      const rot = clampedDelta * 1.2 * motionScale;
      tp.outerRing.rotation.z += rot;
      tp.innerRing.rotation.z -= rot * 1.4;
      tp.coreVortex.rotation.z += rot * 2.0;

      const vortexPulse = 1.0 + Math.sin(this.globalTime * 3.0) * 0.08;
      tp.coreVortex.scale.set(vortexPulse, vortexPulse, 1.0);

      if (tp.sparkles) {
        tp.sparkles.rotation.z += rot * 0.5;
      }
    }

    // --- 8. Surprise 1: The Great Clock Reversal ---
    for (let i = 0; i < this.clockReversals.length; i++) {
      const rev = this.clockReversals[i];
      rev.timer += clampedDelta;
      const cycle = rev.duration + rev.cooldown;
      const progressInCycle = rev.timer % cycle;

      if (progressInCycle < rev.duration) {
        const norm = progressInCycle / rev.duration;
        const speedMultiplier = Math.sin(norm * Math.PI);
        const reverseDelta = -4.5 * speedMultiplier * motionScale * clampedDelta;
        
        rev.minuteHand.rotation.z += reverseDelta;
        rev.hourHand.rotation.z += reverseDelta * 0.2;

        for (let g = 0; g < rev.connectedGears.length; g++) {
          rev.connectedGears[g].rotation.z -= reverseDelta * 0.75;
        }

        const faceMat = (rev.clockFace as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (faceMat && faceMat.emissive) {
          faceMat.emissiveIntensity = 0.5 + speedMultiplier * 1.8;
        }
      } else {
        const faceMat = (rev.clockFace as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (faceMat && faceMat.emissive) {
          faceMat.emissiveIntensity = 0.45;
        }
      }
    }

    // --- 9. Surprise 2: The Celestial Alignment ---
    for (let i = 0; i < this.celestialAlignments.length; i++) {
      const align = this.celestialAlignments[i];
      align.timer += clampedDelta;
      const cycle = align.duration + align.cooldown;
      const progressInCycle = align.timer % cycle;

      if (progressInCycle < align.duration) {
        const norm = progressInCycle / align.duration;
        const curve = Math.sin(norm * Math.PI);

        const alignRate = (1.5 + curve * 4.0) * motionScale * clampedDelta;
        align.outerRing.rotation.z += alignRate * 0.4;
        align.middleRing.rotation.y += alignRate * 0.6;
        align.innerRing.rotation.x += alignRate * 0.8;

        if (align.orreryArm) {
          align.orreryArm.rotation.y += alignRate * 1.5;
        }

        if (align.sunBeam) {
          align.sunBeam.visible = true;
          const beamPulse = 1.0 + curve * 1.5;
          align.sunBeam.scale.set(beamPulse, 1.0 + curve * 0.8, beamPulse);
          const bMat = align.sunBeam.material as THREE.MeshBasicMaterial;
          if (bMat) bMat.opacity = curve * 0.85;
        }
      } else {
        if (align.sunBeam) align.sunBeam.visible = false;
      }
    }

    // --- 10. Ambient Carillon Bells ---
    for (let i = 0; i < this.carillonBells.length; i++) {
      const bell = this.carillonBells[i];
      bell.mesh.rotation.z = Math.sin(this.globalTime * bell.speed * motionScale + bell.phase) * bell.amplitude;
    }

    // --- 11. Oscillating Pressure Gauges ---
    for (let i = 0; i < this.pressureGauges.length; i++) {
      const gauge = this.pressureGauges[i];
      const j = Math.sin(this.globalTime * 12.0 + gauge.phase) * 0.08;
      const o = Math.sin(this.globalTime * gauge.frequency + gauge.phase) * gauge.amplitude;
      gauge.mesh.rotation.z = o + j;
    }

    // =======================================================================
    // 12. BLOCKBUSTER EVENT A: THE CLOCKWORK TITAN AWAKENS (SCENE A GATE)
    // =======================================================================
    for (let i = 0; i < this.titans.length; i++) {
      const titan = this.titans[i];
      titan.timer += clampedDelta;
      const dist = playerZ - titan.triggerZ; // Positive when runner is approaching from ahead (greater Z)

      // Distance-aware state transitions
      if (dist > 120) {
        titan.state = 'DORMANT';
      } else if (dist > 65) {
        titan.state = 'ANTICIPATION';
      } else if (dist > 25) {
        titan.state = 'ACTIVATION';
      } else if (dist >= -30) {
        titan.state = 'CLIMAX';
      } else if (dist >= -80) {
        titan.state = 'AFTERMATH';
      } else {
        titan.state = 'COMPLETE';
      }

      // Internal gear train velocity
      let gearSpeed = 0.4;
      if (titan.state === 'ANTICIPATION') gearSpeed = 1.8;
      else if (titan.state === 'ACTIVATION') gearSpeed = 3.8;
      else if (titan.state === 'CLIMAX') gearSpeed = 5.8;
      else if (titan.state === 'AFTERMATH') gearSpeed = 1.2;

      for (let g = 0; g < titan.coreGears.length; g++) {
        titan.coreGears[g].rotation.z += (g % 2 === 0 ? 1 : -1) * gearSpeed * motionScale * clampedDelta;
      }

      // Unfolding Bi-Fold Pectoral Cuirass Armor
      let targetCuirassAngle = 0.0;
      if (titan.state === 'ANTICIPATION') {
        targetCuirassAngle = 0.32 * motionScale;
      } else if (titan.state === 'ACTIVATION') {
        targetCuirassAngle = 0.82 * motionScale;
      } else if (titan.state === 'CLIMAX') {
        targetCuirassAngle = 0.95 * motionScale;
      } else if (titan.state === 'AFTERMATH') {
        targetCuirassAngle = 0.15 * motionScale;
      }

      if (titan.cuirassLeft) {
        titan.cuirassLeft.rotation.y = THREE.MathUtils.lerp(titan.cuirassLeft.rotation.y, -targetCuirassAngle, clampedDelta * 4.5);
      }
      if (titan.cuirassRight) {
        titan.cuirassRight.rotation.y = THREE.MathUtils.lerp(titan.cuirassRight.rotation.y, targetCuirassAngle, clampedDelta * 4.5);
      }

      // Core luminescence & eye flaring
      let targetCoreEmissive = 0.35;
      let targetEyeScale = 0.0;
      if (titan.state === 'ANTICIPATION') {
        targetCoreEmissive = 1.0 + 0.35 * Math.sin(titan.timer * 4.5);
        targetEyeScale = 0.65;
      } else if (titan.state === 'ACTIVATION') {
        targetCoreEmissive = 1.8 + 0.45 * Math.sin(titan.timer * 7.0);
        targetEyeScale = 1.1;
      } else if (titan.state === 'CLIMAX') {
        targetCoreEmissive = 2.6 + 0.6 * Math.sin(titan.timer * 9.0);
        targetEyeScale = 1.35;
      } else if (titan.state === 'AFTERMATH') {
        targetCoreEmissive = 0.7;
        targetEyeScale = 0.4;
      }

      const coreMat = titan.coreLight.material as THREE.MeshBasicMaterial;
      if (coreMat) {
        coreMat.opacity = Math.min(1.0, targetCoreEmissive * 0.45);
      }
      for (let e = 0; e < titan.eyes.length; e++) {
        titan.eyes[e].scale.set(targetEyeScale, targetEyeScale, targetEyeScale);
      }

      // Head articulation: rises from dormant bow, turns toward runner
      let headPitch = 0.28; // resting head bowed down
      let headYaw = 0.0;
      if (titan.state === 'ACTIVATION' || titan.state === 'CLIMAX') {
        const runnerAngle = Math.atan2(0 - titan.group.position.x, playerZ - titan.triggerZ);
        headYaw = runnerAngle * 0.60 * motionScale;
        headPitch = -0.18; // looking up and at runner
      } else if (titan.state === 'AFTERMATH') {
        headYaw = 0.0;
        headPitch = 0.05;
      }
      titan.head.rotation.y = THREE.MathUtils.lerp(titan.head.rotation.y, headYaw, clampedDelta * 4.0);
      titan.head.rotation.x = THREE.MathUtils.lerp(titan.head.rotation.x, headPitch, clampedDelta * 3.0);

      // Arm articulation: salutes runner during climax
      if (titan.armRight) {
        let armAngle = 0.0;
        if (titan.state === 'CLIMAX') {
          armAngle = -0.85 * motionScale;
        } else if (titan.state === 'ACTIVATION') {
          armAngle = -0.42 * motionScale;
        }
        titan.armRight.rotation.z = THREE.MathUtils.lerp(titan.armRight.rotation.z, armAngle, clampedDelta * 3.5);
      }

      // Steam plumes from shoulder exhaust stacks
      if (titan.steamPlumes) {
        const steamActive = titan.state === 'ACTIVATION' || titan.state === 'CLIMAX';
        for (let s = 0; s < titan.steamPlumes.length; s++) {
          const plume = titan.steamPlumes[s];
          plume.visible = steamActive;
          if (steamActive) {
            const pScale = 1.0 + 0.45 * Math.sin(titan.timer * 9.0 + s * 1.5);
            plume.scale.set(pScale, pScale * 1.6, pScale);
          }
        }
      }

      // Nearby City Responds: Street steam vents & resonant lantern flares
      if (titan.cityVents) {
        const citySteamActive = titan.state === 'ACTIVATION' || titan.state === 'CLIMAX';
        for (let v = 0; v < titan.cityVents.length; v++) {
          const cv = titan.cityVents[v];
          cv.visible = citySteamActive;
          if (citySteamActive) {
            const vScale = 0.8 + 0.5 * Math.sin(titan.timer * 8.0 + v * 2.0);
            cv.scale.set(vScale, vScale * 2.0, vScale);
          }
        }
      }
      if (titan.cityLanterns) {
        const lanternActive = titan.state === 'ACTIVATION' || titan.state === 'CLIMAX';
        for (let l = 0; l < titan.cityLanterns.length; l++) {
          const cl = titan.cityLanterns[l];
          const mat = cl.material as THREE.MeshStandardMaterial;
          if (mat && mat.emissive) {
            mat.emissiveIntensity = lanternActive ? 1.8 + 0.5 * Math.sin(titan.timer * 6.0) : 0.6;
          }
        }
      }
    }

    // =======================================================================
    // 13. BLOCKBUSTER EVENT B: THE GREAT TIME RIFT (SCENE B GATE)
    // =======================================================================
    for (let i = 0; i < this.timeRifts.length; i++) {
      const rift = this.timeRifts[i];
      rift.timer += clampedDelta;
      const dist = playerZ - rift.triggerZ; // Positive when runner is approaching from ahead (greater Z)

      if (dist > 130) rift.state = 'DORMANT';
      else if (dist > 70) rift.state = 'ANTICIPATION';
      else if (dist > 25) rift.state = 'ACTIVATION';
      else if (dist >= -25) rift.state = 'CLIMAX';
      else if (dist >= -80) rift.state = 'AFTERMATH';
      else rift.state = 'COMPLETE';

      let spinMult = 0.2;
      if (rift.state === 'ANTICIPATION') spinMult = 1.4;
      else if (rift.state === 'ACTIVATION') spinMult = 3.5;
      else if (rift.state === 'CLIMAX') spinMult = 5.8;
      else if (rift.state === 'AFTERMATH') spinMult = 0.8;

      const rate = spinMult * motionScale * clampedDelta;
      // Signature B: Time Fracture Temporal Reversal (Middle ring reverses spin direction during ACTIVATION)
      const reversalSign = rift.state === 'ACTIVATION' ? -1.0 : 1.0;
      rift.outerRing.rotation.z += rate * 0.8;
      rift.middleRing.rotation.y += rate * 1.25 * reversalSign;
      rift.innerRing.rotation.x += rate * 1.65 * -reversalSign;

      // Locking dog clamps: unlock and pivot outward
      let clampAngle = 0.0;
      if (rift.state === 'ANTICIPATION') clampAngle = 0.32;
      else if (rift.state === 'ACTIVATION' || rift.state === 'CLIMAX') clampAngle = 0.78;
      for (let c = 0; c < rift.lockingClamps.length; c++) {
        rift.lockingClamps[c].rotation.z = (c % 2 === 0 ? 1 : -1) * clampAngle;
      }

      // Vortex core, 3D Singularity, and radiating energy rays
      let coreScale = 0.2;
      let energyRayScale = 0.0;
      if (rift.state === 'ANTICIPATION') {
        coreScale = 0.65 + 0.12 * Math.sin(rift.timer * 4.5);
      } else if (rift.state === 'ACTIVATION') {
        coreScale = 1.35 + 0.22 * Math.sin(rift.timer * 6.5);
        energyRayScale = 0.65;
      } else if (rift.state === 'CLIMAX') {
        coreScale = 2.15 + 0.35 * Math.sin(rift.timer * 10.5);
        energyRayScale = 1.6;
      } else if (rift.state === 'AFTERMATH') {
        coreScale = 0.45;
      }

      rift.portalVortex.scale.set(coreScale, coreScale, 1.0);
      rift.portalVortex.rotation.z += rate * 2.6;

      if (rift.energySingularity) {
        rift.energySingularity.scale.set(coreScale * 0.8, coreScale * 0.8, coreScale * 0.8);
        rift.energySingularity.rotation.y += rate * 1.5;
        rift.energySingularity.rotation.x += rate * 1.1;
      }

      // Alternate mechanical skyline ambient motion inside deep chamber
      if (rift.alternateSkyline) {
        const skylineActive = rift.state === 'ACTIVATION' || rift.state === 'CLIMAX';
        rift.alternateSkyline.visible = true;
        rift.alternateSkyline.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mat = child.material as THREE.MeshStandardMaterial;
            if (mat && mat.emissive) {
              mat.emissiveIntensity = skylineActive ? 1.4 + 0.4 * Math.sin(rift.timer * 5.0) : 0.3;
            }
          }
        });
      }

      for (let r = 0; r < rift.energyRays.length; r++) {
        const ray = rift.energyRays[r];
        ray.visible = energyRayScale > 0.1;
        ray.scale.set(energyRayScale, energyRayScale, energyRayScale);
        ray.rotation.z += rate * (r % 2 === 0 ? 1 : -1) * 0.6;
      }

      if (rift.sparkles) {
        rift.sparkles.rotation.z -= rate * 1.4;
      }
    }

    // =======================================================================
    // 14. BLOCKBUSTER EVENT C: THE MECHANICAL DRAGON
    // =======================================================================
    for (let i = 0; i < this.dragons.length; i++) {
      const dragon = this.dragons[i];
      dragon.timer += clampedDelta;

      // Flap wings with realistic sinusoidal curve
      const flapAngle = Math.sin(dragon.timer * 4.6 * motionScale) * 0.55 * motionScale;
      for (let w = 0; w < dragon.wingsLeft.length; w++) {
        dragon.wingsLeft[w].rotation.z = flapAngle;
      }
      for (let w = 0; w < dragon.wingsRight.length; w++) {
        dragon.wingsRight[w].rotation.z = -flapAngle;
      }

      // Articulated neck and jaw
      dragon.neck.rotation.y = Math.sin(dragon.timer * 1.5) * 0.16;
      if (dragon.jaw) {
        dragon.jaw.rotation.x = 0.15 + Math.sin(dragon.timer * 2.2) * 0.18;
      }

      // Segmented tail follows on delayed wave
      for (let t = 0; t < dragon.tailSegments.length; t++) {
        dragon.tailSegments[t].rotation.y = Math.sin(dragon.timer * 2.4 - t * 0.5) * 0.22 * motionScale;
        dragon.tailSegments[t].rotation.z = Math.cos(dragon.timer * 2.4 - t * 0.5) * 0.08 * motionScale;
      }

      // Smooth flight trajectory across skyline
      dragon.flightProgress += clampedDelta * 0.075 * motionScale;
      const angle = dragon.flightProgress * Math.PI * 2;
      const rx = Math.cos(angle) * dragon.flightPathRadius;
      const rz = Math.sin(angle) * (dragon.flightPathRadius * 0.65);
      dragon.group.position.x = rx;
      dragon.group.position.y = dragon.baseY + Math.sin(angle * 2.0) * 4.5;
      dragon.group.position.z = dragon.triggerZ + rz;
      dragon.group.rotation.y = -angle + Math.PI * 0.5;
      dragon.group.rotation.z = -Math.sin(angle) * 0.28; // banking on curves
    }

    // =======================================================================
    // 15. BLOCKBUSTER EVENT D: THE TRANSFORMING CLOCKWORK CITY
    // =======================================================================
    for (let i = 0; i < this.transformingCities.length; i++) {
      const city = this.transformingCities[i];
      city.timer += clampedDelta;
      const dist = playerZ - city.triggerZ; // Positive when runner is approaching from ahead (greater Z)

      if (dist > 110) city.state = 'DORMANT';
      else if (dist > 70) city.state = 'ANTICIPATION';
      else if (dist > 30) city.state = 'ACTIVATION';
      else if (dist >= -40) city.state = 'CLIMAX';
      else if (dist >= -90) city.state = 'AFTERMATH';
      else city.state = 'COMPLETE';

      let transProgress = 0.0;
      if (city.state === 'ANTICIPATION') {
        transProgress = ((110 - dist) / 40) * 0.25;
      } else if (city.state === 'ACTIVATION') {
        transProgress = 0.25 + ((70 - dist) / 40) * 0.75;
      } else if (city.state === 'CLIMAX') {
        transProgress = 1.0;
      } else if (city.state === 'AFTERMATH') {
        transProgress = Math.max(0.0, 1.0 - ((-40 - dist) / 50));
      } else if (city.state === 'COMPLETE') {
        transProgress = 0.0;
      }

      // Telescoping towers rise
      for (let t = 0; t < city.telescopingTowers.length; t++) {
        const tow = city.telescopingTowers[t];
        tow.mesh.position.y = tow.baseY + transProgress * tow.maxLift;
      }

      // Mansard roofs fold open
      for (let r = 0; r < city.foldingRoofs.length; r++) {
        const roof = city.foldingRoofs[r];
        const angle = transProgress * roof.maxAngle;
        roof.leftPanel.rotation.z = angle;
        roof.rightPanel.rotation.z = -angle;
      }

      // Skybridges extend
      for (let b = 0; b < city.extendingBridges.length; b++) {
        const br = city.extendingBridges[b];
        const span = transProgress * br.maxSpan;
        br.leftSpan.position.x = -span;
        br.rightSpan.position.x = span;
      }

      // Engaging gears spin rapidly during transformation
      for (let g = 0; g < city.engagingGears.length; g++) {
        const gear = city.engagingGears[g];
        const speed = (gear.speed * (1.0 + transProgress * 3.2)) * motionScale * clampedDelta;
        if (gear.axis === 'x') gear.mesh.rotation.x += speed;
        else if (gear.axis === 'y') gear.mesh.rotation.y += speed;
        else gear.mesh.rotation.z += speed;
      }
    }

    // =======================================================================
    // 16. HIGH-VALUE SURPRISES (HOURGLASS, PENDULUM CATHEDRAL, BIRD SWARM)
    // =======================================================================
    // Giant Hourglass rotation & sand flow
    for (let i = 0; i < this.hourglasses.length; i++) {
      const hg = this.hourglasses[i];
      hg.timer += clampedDelta;
      hg.rotationProgress += clampedDelta * 0.12 * motionScale;
      // Inverts smoothly every cycle
      hg.hourglassFrame.rotation.z = Math.sin(hg.rotationProgress) * Math.PI;

      const sandFactor = 0.5 + 0.5 * Math.cos(hg.rotationProgress * 2.0);
      hg.sandUpper.scale.set(1.0, Math.max(0.15, sandFactor), 1.0);
      hg.sandLower.scale.set(1.0, Math.max(0.15, 1.0 - sandFactor), 1.0);
      const streamPulse = 0.8 + 0.4 * Math.sin(hg.timer * 8.0);
      hg.sandStream.scale.set(streamPulse, 1.0, streamPulse);
    }

    // Pendulum Cathedral harmonic swing
    for (let i = 0; i < this.pendulumCathedrals.length; i++) {
      const cath = this.pendulumCathedrals[i];
      cath.timer += clampedDelta;
      for (let p = 0; p < cath.pendulums.length; p++) {
        const pen = cath.pendulums[p];
        pen.rod.rotation.z = Math.sin(cath.timer * pen.speed * motionScale + pen.phase) * pen.amplitude;
      }
    }

    // Clockwork Bird Swarm formation soaring
    for (let i = 0; i < this.birdSwarms.length; i++) {
      const swarm = this.birdSwarms[i];
      swarm.timer += clampedDelta;
      const swarmProgress = swarm.timer * 0.4 * motionScale;

      for (let b = 0; b < swarm.birds.length; b++) {
        const bird = swarm.birds[b];
        const flap = Math.sin(swarm.timer * bird.flapSpeed * motionScale + b) * 0.52 * motionScale;
        bird.leftWing.rotation.z = flap;
        bird.rightWing.rotation.z = -flap;

        // Path motion: wide figure-8 sweep over skyline
        const t = swarmProgress + b * 0.12;
        bird.mesh.position.x = bird.offset.x + Math.sin(t) * 22.0;
        bird.mesh.position.y = bird.offset.y + Math.cos(t * 2.0) * 4.0;
        bird.mesh.position.z = bird.offset.z + Math.cos(t) * 35.0;
        bird.mesh.rotation.y = -t + Math.PI * 0.5;
      }
    }

    // =======================================================================
    // 16. BLOCKBUSTER SIGNATURE A: THE GREAT CLOCKWORK AWAKENING
    // =======================================================================
    for (let i = 0; i < this.clockworkAwakenings.length; i++) {
      const ca = this.clockworkAwakenings[i];
      ca.timer += clampedDelta;
      const dist = playerZ - ca.triggerZ; // Positive when runner is approaching from ahead

      if (dist > 140) ca.state = 'DORMANT';
      else if (dist > 85) ca.state = 'ANTICIPATION';
      else if (dist > 35) ca.state = 'ACTIVATION';
      else if (dist >= -30) ca.state = 'CLIMAX';
      else if (dist >= -80) ca.state = 'AFTERMATH';
      else ca.state = 'COMPLETE';

      // 1. Clock Tower Chime & Resonance Rings
      let strikeNorm = 0.0;
      let chimeActive = false;
      if (ca.state === 'ANTICIPATION' || ca.state === 'ACTIVATION') {
        const chimeProg = (ca.timer * 1.8) % 1.0;
        if (chimeProg > 0.6) {
          chimeActive = true;
          strikeNorm = (chimeProg - 0.6) / 0.4;
        }
      } else if (ca.state === 'CLIMAX') {
        chimeActive = true;
        strikeNorm = Math.sin(ca.timer * 8.0) * 0.5 + 0.5;
      }

      if (ca.chimeHammer) {
        ca.chimeHammer.rotation.z = chimeActive ? Math.sin(strikeNorm * Math.PI) * 0.45 * motionScale : 0;
      }

      const faceMat = ca.clockFaceMesh.material as THREE.MeshStandardMaterial;
      if (faceMat && faceMat.emissive) {
        faceMat.emissiveIntensity = chimeActive ? 1.8 + strikeNorm * 1.2 : 0.6;
      }

      if (ca.resonanceRings) {
        for (let r = 0; r < ca.resonanceRings.length; r++) {
          const ring = ca.resonanceRings[r];
          if (chimeActive) {
            const rProg = (strikeNorm + r * 0.35) % 1.0;
            const rScale = 1.0 + rProg * 4.2 * motionScale;
            ring.scale.set(rScale, rScale, rScale);
            ring.visible = true;
            const rMat = ring.material as THREE.MeshBasicMaterial;
            if (rMat) rMat.opacity = (1.0 - rProg) * 0.75;
          } else {
            ring.visible = false;
          }
        }
      }

      // 2. Colossal Synchronized Pendulum
      if (ca.pendulumRod) {
        const pendAmp = (ca.state === 'DORMANT') ? 0.08 : 0.42;
        ca.pendulumRod.rotation.z = Math.sin(ca.timer * 2.2 * motionScale) * pendAmp * motionScale;
      }

      // 3. Interlocking Gears Mathematically Speed Up
      let gearSpeedMult = 0.5;
      if (ca.state === 'ANTICIPATION') gearSpeedMult = 1.2;
      else if (ca.state === 'ACTIVATION' || ca.state === 'CLIMAX') gearSpeedMult = 2.8;
      else if (ca.state === 'AFTERMATH') gearSpeedMult = 1.0;

      for (let g = 0; g < ca.interlockingGears.length; g++) {
        const gear = ca.interlockingGears[g];
        const rot = gear.speed * gearSpeedMult * clampedDelta * motionScale;
        if (gear.axis === 'x') gear.mesh.rotation.x += rot;
        else if (gear.axis === 'y') gear.mesh.rotation.y += rot;
        else gear.mesh.rotation.z += rot;
      }

      // 4. Steam Pistons & Exhaust Plumes
      for (let p = 0; p < ca.steamPistons.length; p++) {
        const piston = ca.steamPistons[p];
        const pNorm = Math.sin(ca.timer * piston.freq * gearSpeedMult + p * 1.2);
        piston.head.position.y = pNorm * piston.stroke * motionScale;
        if (piston.plume) {
          const plumeActive = pNorm > 0.4 && (ca.state === 'ACTIVATION' || ca.state === 'CLIMAX');
          piston.plume.visible = plumeActive;
          if (plumeActive) {
            piston.plume.scale.setScalar(0.8 + (pNorm - 0.4) * 2.0);
          }
        }
      }

      // 5. Telescoping Bridges Extend Across Canal
      let bridgeExt = 0.0;
      if (ca.state === 'ACTIVATION') bridgeExt = Math.min(1.0, (85 - dist) / 50);
      else if (ca.state === 'CLIMAX' || ca.state === 'AFTERMATH') bridgeExt = 1.0;

      for (let b = 0; b < ca.telescopingBridges.length; b++) {
        const br = ca.telescopingBridges[b];
        br.leftSpan.position.x = -br.maxSpan * bridgeExt;
        br.rightSpan.position.x = br.maxSpan * bridgeExt;
      }

      // 6. Activating City Lanterns & Steam Vents
      const cityActive = ca.state === 'ACTIVATION' || ca.state === 'CLIMAX';
      if (ca.cityLanterns) {
        for (let l = 0; l < ca.cityLanterns.length; l++) {
          const lantMat = ca.cityLanterns[l].material as THREE.MeshBasicMaterial;
          if (lantMat) lantMat.opacity = cityActive ? 0.95 : 0.4;
        }
      }
      if (ca.steamVents) {
        for (let v = 0; v < ca.steamVents.length; v++) {
          ca.steamVents[v].visible = cityActive;
        }
      }
    }
  }

  // Getters for test verification, telemetry, and diagnostics
  public getGearCount(): number { return this.gears.length; }
  public getChimeCount(): number { return this.chimes.length; }
  public getBridgeCount(): number { return this.bridges.length; }
  public getPistonCount(): number { return this.pistons.length; }
  public getObservatoryCount(): number { return this.observatories.length; }
  public getSkybridgeTrainCount(): number { return this.skybridgeTrains.length; }
  public getTimePortalCount(): number { return this.timePortals.length; }
  public getClockReversalCount(): number { return this.clockReversals.length; }
  public getCelestialAlignmentCount(): number { return this.celestialAlignments.length; }
  public getCarillonBellCount(): number { return this.carillonBells.length; }
  public getPressureGaugeCount(): number { return this.pressureGauges.length; }

  public getTitanCount(): number { return this.titans.length; }
  public getTimeRiftCount(): number { return this.timeRifts.length; }
  public getDragonCount(): number { return this.dragons.length; }
  public getTransformingCityCount(): number { return this.transformingCities.length; }
  public getHourglassCount(): number { return this.hourglasses.length; }
  public getPendulumCathedralCount(): number { return this.pendulumCathedrals.length; }
  public getBirdSwarmCount(): number { return this.birdSwarms.length; }
  public getClockworkAwakeningCount(): number { return this.clockworkAwakenings.length; }

  public getTotalActiveElements(): number {
    return this.gears.length + this.chimes.length + this.bridges.length +
           this.pistons.length + this.observatories.length +
           this.skybridgeTrains.length + this.timePortals.length +
           this.clockReversals.length + this.celestialAlignments.length +
           this.carillonBells.length + this.pressureGauges.length +
           this.titans.length + this.timeRifts.length +
           this.dragons.length + this.transformingCities.length +
           this.hourglasses.length + this.pendulumCathedrals.length +
           this.birdSwarms.length + this.clockworkAwakenings.length;
  }

  public getBlockbusterDiagnostics(): Record<string, number> {
    return {
      gears: this.gears.length,
      pistons: this.pistons.length,
      chimes: this.chimes.length,
      bridges: this.bridges.length,
      observatories: this.observatories.length,
      timePortals: this.timePortals.length,
      clockReversals: this.clockReversals.length,
      celestialAlignments: this.celestialAlignments.length,
      carillonBells: this.carillonBells.length,
      pressureGauges: this.pressureGauges.length,
      titans: this.titans.length,
      timeRifts: this.timeRifts.length,
      dragons: this.dragons.length,
      transformingCities: this.transformingCities.length,
      hourglasses: this.hourglasses.length,
      pendulumCathedrals: this.pendulumCathedrals.length,
      birdSwarms: this.birdSwarms.length,
      clockworkAwakenings: this.clockworkAwakenings.length,
      totalActive: this.getTotalActiveElements()
    };
  }
}
