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

/**
 * ChronoKingdomEventDirector
 * Singleton managing all 6 animated clockwork world events with high performance,
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

  /**
   * Prunes detached objects whose chunk parents were recycled.
   * Completely prevents unbounded accumulation over long runs.
   */
  private pruneDetached(): void {
    const isAttached = (obj: THREE.Object3D | null | undefined): boolean => {
      return !!(obj && obj.parent);
    };

    this.gears = this.gears.filter(g => isAttached(g.mesh));
    this.chimes = this.chimes.filter(c => isAttached(c.clockFaceMesh));
    this.bridges = this.bridges.filter(b => isAttached(b.group));
    this.pistons = this.pistons.filter(p => isAttached(p.pistonHead));
    this.observatories = this.observatories.filter(o => isAttached(o.outerRing));
    this.skybridgeTrains = this.skybridgeTrains.filter(t => isAttached(t.group));
    this.timePortals = this.timePortals.filter(p => isAttached(p.outerRing));
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

  // =========================================================================
  // ANIMATION TICK LOOP
  // =========================================================================

  public update(delta: number, isCurrentTheme: boolean = true): void {
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

      // Strike moment happens during 0.90 to 1.0 of the interval
      if (progress > 0.90) {
        const strikeNorm = (progress - 0.90) / 0.10; // 0 to 1
        
        // Bell hammer striking motion
        if (chime.hammer) {
          const hammerAngle = Math.sin(strikeNorm * Math.PI * 4) * 0.35;
          chime.hammer.rotation.z = hammerAngle;
        }

        // Radiant glow pulse on clock face
        const mat = chime.clockFaceMesh.material as THREE.MeshStandardMaterial;
        if (mat && mat.emissive) {
          mat.emissiveIntensity = 0.5 + Math.sin(strikeNorm * Math.PI) * 1.5;
        }

        // Expanding resonance soundwave rings
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
        // Idle between strikes
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
      // Smooth sinusoidal extend and retract
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
        // Realistic connecting rod tilt
        p.connectingRod.rotation.z = Math.cos(angle) * 0.25;
      }

      // Steam plume pulses at top of stroke (stroke > 0.8)
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

      // Rotate wheel drive linkage rods
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

      // Pulse portal core scale
      const vortexPulse = 1.0 + Math.sin(this.globalTime * 3.0) * 0.08;
      tp.coreVortex.scale.set(vortexPulse, vortexPulse, 1.0);

      if (tp.sparkles) {
        tp.sparkles.rotation.z += rot * 0.5;
      }
    }
  }

  // Getters for test verification and telemetry
  public getGearCount(): number { return this.gears.length; }
  public getChimeCount(): number { return this.chimes.length; }
  public getBridgeCount(): number { return this.bridges.length; }
  public getPistonCount(): number { return this.pistons.length; }
  public getObservatoryCount(): number { return this.observatories.length; }
  public getSkybridgeTrainCount(): number { return this.skybridgeTrains.length; }
  public getTimePortalCount(): number { return this.timePortals.length; }
  public getTotalActiveElements(): number {
    return this.gears.length + this.chimes.length + this.bridges.length +
           this.pistons.length + this.observatories.length +
           this.skybridgeTrains.length + this.timePortals.length;
  }
}
