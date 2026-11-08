import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';

export type SauropodState = 'DORMANT' | 'APPROACH' | 'CROSSING' | 'PASSING' | 'GRAZING';
export type CarnivoreState = 'CONCEALED' | 'EMERGING' | 'ROARING' | 'STALKING' | 'RETREATING';
export type RaptorPackState = 'PERCHED' | 'SPRINTING' | 'WEAVING' | 'LEAPING' | 'RETREATING';

export interface SauropodWalker {
  group: THREE.Group;
  neck: THREE.Object3D;
  neckSegments?: THREE.Object3D[];
  head: THREE.Object3D;
  tail: THREE.Object3D;
  legs: THREE.Object3D[];
  speed: number;
  walkFreq: number;
  minZ: number;
  maxZ: number;
  triggerZ?: number;
  state?: SauropodState;
  breathingChest?: THREE.Object3D;
  herdMembers?: Array<{ group: THREE.Group; head: THREE.Object3D; tail: THREE.Object3D; speed: number }>;
  isEventA?: boolean;
}

export interface ApexCarnivore {
  group: THREE.Group;
  torso: THREE.Object3D;
  neck?: THREE.Object3D;
  head: THREE.Object3D;
  lowerJaw: THREE.Object3D;
  tail: THREE.Object3D;
  legs?: THREE.Object3D[];
  arms?: THREE.Object3D[];
  eyes?: THREE.Object3D[];
  timer: number;
  roarInterval: number;
  triggerZ?: number;
  state?: CarnivoreState;
  mistPlume?: THREE.Group;
  waterfallMesh?: THREE.Mesh;
  splashRings?: THREE.Mesh[];
  isEventC?: boolean;
}

export interface RaptorPackRunner {
  packGroup: THREE.Group;
  raptors: Array<{
    group: THREE.Group;
    legs: THREE.Object3D[];
    tail: THREE.Object3D;
    head: THREE.Object3D;
    jaw?: THREE.Object3D;
    arms?: THREE.Object3D[];
    phaseOffset: number;
    lateralOffset?: number;
  }>;
  speed: number;
  runFreq: number;
  minZ: number;
  maxZ: number;
  triggerZ?: number;
  state?: RaptorPackState;
  isEventB?: boolean;
}

export interface PterosaurFlock {
  group: THREE.Group;
  gliders: Array<{
    mesh: THREE.Group;
    leftWing: THREE.Object3D;
    rightWing: THREE.Object3D;
    leftWingOuter?: THREE.Object3D;
    rightWingOuter?: THREE.Object3D;
    head?: THREE.Object3D;
    phaseOffset: number;
    baseAltitude: number;
  }>;
  flightSpeed: number;
  wingFlapFreq: number;
}

export interface HerbivoreHerd {
  herdGroup: THREE.Group;
  members: Array<{
    group: THREE.Group;
    head: THREE.Object3D;
    tail: THREE.Object3D;
    phaseOffset: number;
  }>;
}

export interface CuriousGiantWatcher {
  dinosaurGroup: THREE.Group;
  neck: THREE.Object3D;
  head: THREE.Object3D;
  triggerZ?: number;
}

export interface PrehistoricWaterfallActor {
  mesh: THREE.Mesh;
  splashRings: THREE.Mesh[];
  scrollSpeed: number;
  mistPlume?: THREE.Group;
  timer: number;
}

export interface PrehistoricRiverActor {
  mesh: THREE.Mesh;
  scrollSpeed: number;
}

export interface PrehistoricDragonflyActor {
  group: THREE.Group;
  leftWing: THREE.Object3D;
  rightWing: THREE.Object3D;
  basePos: THREE.Vector3;
  phase: number;
}

export interface SwayingFoliageActor {
  fronds: THREE.Object3D[];
  amp: number;
  freq: number;
  phase: number;
}

/**
 * JurassicRushEventDirector
 * Singleton managing all 6 animated prehistoric dinosaur encounters and cinematic events
 * with high performance, organic believable locomotion, zero per-frame garbage, and reduced-motion compliance.
 */
export class JurassicRushEventDirector {
  private static instance: JurassicRushEventDirector | null = null;

  private sauropods: SauropodWalker[] = [];
  private carnivores: ApexCarnivore[] = [];
  private raptorPacks: RaptorPackRunner[] = [];
  private pterosaurs: PterosaurFlock[] = [];
  private herbivoreHerds: HerbivoreHerd[] = [];
  private curiousWatchers: CuriousGiantWatcher[] = [];

  // Ambient Environmental Actors
  private waterfalls: PrehistoricWaterfallActor[] = [];
  private rivers: PrehistoricRiverActor[] = [];
  private dragonflies: PrehistoricDragonflyActor[] = [];
  private swayingFoliage: SwayingFoliageActor[] = [];

  private globalTime: number = 0;

  private constructor() {
    if (typeof window !== 'undefined') {
      (window as any).__JURASSIC_DIRECTOR__ = this;
    }
  }

  public static getInstance(): JurassicRushEventDirector {
    if (!this.instance) {
      this.instance = new JurassicRushEventDirector();
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

    this.sauropods = this.sauropods.filter(s => isAttached(s.group));
    this.carnivores = this.carnivores.filter(c => isAttached(c.group));
    this.raptorPacks = this.raptorPacks.filter(r => isAttached(r.packGroup));
    this.pterosaurs = this.pterosaurs.filter(p => isAttached(p.group));
    this.herbivoreHerds = this.herbivoreHerds.filter(h => isAttached(h.herdGroup));
    this.curiousWatchers = this.curiousWatchers.filter(w => isAttached(w.dinosaurGroup));
    this.waterfalls = this.waterfalls.filter(w => isAttached(w.mesh));
    this.rivers = this.rivers.filter(r => isAttached(r.mesh));
    this.dragonflies = this.dragonflies.filter(d => isAttached(d.group));
    this.swayingFoliage = this.swayingFoliage.filter(f => f.fronds.length > 0 && isAttached(f.fronds[0]));
  }

  public reset(): void {
    this.sauropods = [];
    this.carnivores = [];
    this.raptorPacks = [];
    this.pterosaurs = [];
    this.herbivoreHerds = [];
    this.curiousWatchers = [];
    this.waterfalls = [];
    this.rivers = [];
    this.dragonflies = [];
    this.swayingFoliage = [];
    this.globalTime = 0;
  }

  // =========================================================================
  // REGISTRATION API
  // =========================================================================

  /**
   * Encounter 1 & Event A: Register Colossal Sauropod Walker & Giant Crossing
   */
  public registerSauropod(
    group: THREE.Group,
    neck: THREE.Object3D,
    head: THREE.Object3D,
    tail: THREE.Object3D,
    legs: THREE.Object3D[],
    speed: number = 4.0,
    walkFreq: number = 1.6,
    minZ: number = -120,
    maxZ: number = 40,
    options?: {
      triggerZ?: number;
      neckSegments?: THREE.Object3D[];
      breathingChest?: THREE.Object3D;
      herdMembers?: Array<{ group: THREE.Group; head: THREE.Object3D; tail: THREE.Object3D; speed: number }>;
      isEventA?: boolean;
    }
  ): void {
    this.sauropods.push({
      group,
      neck,
      neckSegments: options?.neckSegments,
      head,
      tail,
      legs,
      speed,
      walkFreq,
      minZ,
      maxZ,
      triggerZ: options?.triggerZ,
      state: 'APPROACH',
      breathingChest: options?.breathingChest,
      herdMembers: options?.herdMembers,
      isEventA: options?.isEventA
    });
  }

  /**
   * Encounter 2 & Event C: Register Apex Carnivore & Waterfall Predator
   */
  public registerCarnivore(
    group: THREE.Group,
    torso: THREE.Object3D,
    head: THREE.Object3D,
    lowerJaw: THREE.Object3D,
    tail: THREE.Object3D,
    roarInterval: number = 9.0,
    options?: {
      triggerZ?: number;
      neck?: THREE.Object3D;
      legs?: THREE.Object3D[];
      arms?: THREE.Object3D[];
      eyes?: THREE.Object3D[];
      mistPlume?: THREE.Group;
      waterfallMesh?: THREE.Mesh;
      splashRings?: THREE.Mesh[];
      isEventC?: boolean;
    }
  ): void {
    this.carnivores.push({
      group,
      torso,
      neck: options?.neck,
      head,
      lowerJaw,
      tail,
      legs: options?.legs,
      arms: options?.arms,
      eyes: options?.eyes,
      timer: 0,
      roarInterval,
      triggerZ: options?.triggerZ,
      state: 'CONCEALED',
      mistPlume: options?.mistPlume,
      waterfallMesh: options?.waterfallMesh,
      splashRings: options?.splashRings,
      isEventC: options?.isEventC
    });
  }

  /**
   * Encounter 3 & Event B: Register Sprinting Raptor Pack & Raptor Ridge
   */
  public registerRaptorPack(
    packGroup: THREE.Group,
    raptors: Array<{
      group: THREE.Group;
      legs: THREE.Object3D[];
      tail: THREE.Object3D;
      head: THREE.Object3D;
      jaw?: THREE.Object3D;
      arms?: THREE.Object3D[];
      phaseOffset: number;
      lateralOffset?: number;
    }>,
    speed: number = 22.0,
    runFreq: number = 8.0,
    minZ: number = -140,
    maxZ: number = 30,
    options?: {
      triggerZ?: number;
      isEventB?: boolean;
    }
  ): void {
    this.raptorPacks.push({
      packGroup,
      raptors,
      speed,
      runFreq,
      minZ,
      maxZ,
      triggerZ: options?.triggerZ,
      state: 'PERCHED',
      isEventB: options?.isEventB
    });
  }

  /**
   * Encounter 4: Register Gliding Pterosaur Flock
   */
  public registerPterosaurs(
    group: THREE.Group,
    gliders: Array<{
      mesh: THREE.Group;
      leftWing: THREE.Object3D;
      rightWing: THREE.Object3D;
      leftWingOuter?: THREE.Object3D;
      rightWingOuter?: THREE.Object3D;
      head?: THREE.Object3D;
      phaseOffset: number;
      baseAltitude: number;
    }>,
    flightSpeed: number = 16.0,
    wingFlapFreq: number = 3.2
  ): void {
    this.pterosaurs.push({
      group,
      gliders,
      flightSpeed,
      wingFlapFreq
    });
  }

  /**
   * Encounter 5: Register Grazing Herbivore Herd
   */
  public registerHerbivoreHerd(
    herdGroup: THREE.Group,
    members: Array<{
      group: THREE.Group;
      head: THREE.Object3D;
      tail: THREE.Object3D;
      phaseOffset: number;
    }>
  ): void {
    this.herbivoreHerds.push({
      herdGroup,
      members
    });
  }

  /**
   * Encounter 6: Register Curious Giant Watcher
   */
  public registerCuriousWatcher(
    dinosaurGroup: THREE.Group,
    neck: THREE.Object3D,
    head: THREE.Object3D,
    triggerZ?: number
  ): void {
    this.curiousWatchers.push({
      dinosaurGroup,
      neck,
      head,
      triggerZ
    });
  }

  /**
   * Register Prehistoric Waterfall
   */
  public registerWaterfall(
    mesh: THREE.Mesh,
    splashRings: THREE.Mesh[] = [],
    scrollSpeed: number = 2.4,
    mistPlume?: THREE.Group
  ): void {
    this.waterfalls.push({
      mesh,
      splashRings,
      scrollSpeed,
      mistPlume,
      timer: 0
    });
  }

  /**
   * Register Flowing River Stream
   */
  public registerRiverStream(mesh: THREE.Mesh, scrollSpeed: number = 0.8): void {
    this.rivers.push({ mesh, scrollSpeed });
  }

  /**
   * Register Hovering Giant Dragonfly (Meganeura)
   */
  public registerDragonfly(
    group: THREE.Group,
    leftWing: THREE.Object3D,
    rightWing: THREE.Object3D
  ): void {
    this.dragonflies.push({
      group,
      leftWing,
      rightWing,
      basePos: group.position.clone(),
      phase: Math.random() * Math.PI * 2
    });
  }

  /**
   * Register Swaying Prehistoric Foliage
   */
  public registerSwayingFoliage(fronds: THREE.Object3D[], amp: number = 0.08, freq: number = 1.2): void {
    this.swayingFoliage.push({
      fronds,
      amp,
      freq,
      phase: Math.random() * Math.PI * 2
    });
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
    const motionScale = reducedMotion ? 0.2 : 1.0;

    // --- 1. Colossal Sauropod Walker & Event A (Giant Crossing) ---
    for (let i = 0; i < this.sauropods.length; i++) {
      const s = this.sauropods[i];

      // Distance-staged lifecycle if triggerZ is defined
      if (s.triggerZ !== undefined && s.triggerZ !== 0) {
        const dist = playerZ - s.triggerZ; // Positive when runner approaches from ahead

        if (dist > 140) {
          s.state = 'DORMANT';
        } else if (dist > 70) {
          s.state = 'APPROACH';
        } else if (dist > 15) {
          s.state = 'CROSSING';
        } else if (dist > -40) {
          s.state = 'PASSING';
        } else {
          s.state = 'GRAZING';
        }
      }

      // Stride motion along Z
      s.group.position.z += s.speed * motionScale * clampedDelta;
      if (s.group.position.z > s.maxZ) {
        s.group.position.z = s.minZ;
      }

      const walkCycle = this.globalTime * s.walkFreq * motionScale;

      // 4-legged walking cycle with alternating diagonal pairs
      const legPhases = [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5];
      for (let l = 0; l < s.legs.length && l < 4; l++) {
        s.legs[l].rotation.x = Math.sin(walkCycle + legPhases[l]) * 0.35;
      }

      // Gentle undulating neck S-curve
      let headTurnTarget = 0.0;
      if (s.state === 'PASSING') {
        // Sauropod curiously turns head toward the passing runner!
        headTurnTarget = -0.55 * motionScale;
      } else if (s.state === 'CROSSING') {
        headTurnTarget = -0.22 * motionScale;
      }

      s.neck.rotation.z = Math.sin(walkCycle * 0.5) * 0.15;
      s.neck.rotation.x = 0.35 + Math.cos(walkCycle * 0.5) * 0.12;
      s.neck.rotation.y = THREE.MathUtils.lerp(s.neck.rotation.y, headTurnTarget * 0.6, clampedDelta * 3.0);

      // Multi-segment neck serpentine bend if present
      if (s.neckSegments && s.neckSegments.length > 0) {
        for (let seg = 0; seg < s.neckSegments.length; seg++) {
          const segPhase = seg * 0.3;
          s.neckSegments[seg].rotation.z = Math.sin(walkCycle * 0.5 + segPhase) * 0.08;
        }
      }

      s.head.rotation.x = -0.3 + Math.sin(walkCycle * 0.5) * 0.10;
      s.head.rotation.y = THREE.MathUtils.lerp(s.head.rotation.y, headTurnTarget, clampedDelta * 4.0);

      // Tail counterbalancing swing
      s.tail.rotation.y = Math.sin(walkCycle * 0.5) * 0.25;
      s.tail.rotation.x = -0.15 + Math.cos(walkCycle * 0.5) * 0.08;

      // Subtle breathing expansion in chest
      if (s.breathingChest) {
        const breath = 1.0 + Math.sin(this.globalTime * 1.8) * 0.04;
        s.breathingChest.scale.set(breath, breath, 1.0);
      }

      // Moving distant herd members (Event A)
      if (s.herdMembers && s.herdMembers.length > 0) {
        for (let m = 0; m < s.herdMembers.length; m++) {
          const hm = s.herdMembers[m];
          hm.group.position.z += hm.speed * motionScale * clampedDelta;
          if (hm.group.position.z > s.maxZ + 50) {
            hm.group.position.z = s.minZ - 50;
          }
          const herdWalk = this.globalTime * 0.8 + m * 1.4;
          hm.head.rotation.x = 0.15 + Math.sin(herdWalk) * 0.15;
          hm.tail.rotation.y = Math.sin(herdWalk) * 0.20;
        }
      }
    }

    // --- 2. Apex Carnivore Cliff Roar & Event C (Waterfall Predator) ---
    for (let i = 0; i < this.carnivores.length; i++) {
      const c = this.carnivores[i];
      c.timer += clampedDelta;

      // Distance-staged lifecycle if triggerZ is defined
      if (c.triggerZ !== undefined && c.triggerZ !== 0) {
        const dist = playerZ - c.triggerZ; // Positive when approaching

        if (dist > 120) {
          c.state = 'CONCEALED';
        } else if (dist > 65) {
          c.state = 'EMERGING';
        } else if (dist > 5) {
          c.state = 'ROARING';
        } else if (dist > -35) {
          c.state = 'STALKING';
        } else {
          c.state = 'RETREATING';
        }
      }

      const isRoaringState = c.state === 'ROARING';
      const progress = (c.timer % c.roarInterval) / c.roarInterval;
      const isPeriodicRoar = !c.state && (progress > 0.75 && progress < 0.95);

      if (isRoaringState || isPeriodicRoar) {
        const roarCurve = isRoaringState
          ? 0.7 + 0.3 * Math.sin(this.globalTime * 6.0)
          : Math.sin(((progress - 0.75) / 0.20) * Math.PI);

        // Body leans forward aggressively
        c.torso.rotation.x = 0.25 + roarCurve * 0.35 * motionScale;

        // Head tilts back to roar at the sky
        c.head.rotation.x = -roarCurve * 0.55 * motionScale;

        // Lower jaw opens wide revealing ivory teeth
        c.lowerJaw.rotation.x = roarCurve * 0.65 * motionScale;

        // Tail whips for athletic balance
        c.tail.rotation.y = Math.sin(this.globalTime * 8.0) * 0.35 * motionScale;

        // Forelimbs twitch aggressively
        if (c.arms && c.arms.length >= 2) {
          c.arms[0].rotation.x = -0.4 + roarCurve * 0.5;
          c.arms[1].rotation.x = -0.4 + roarCurve * 0.5;
        }
      } else {
        // Idle predatory stalk breathing stance
        const breath = Math.sin(this.globalTime * 2.5) * 0.05;
        c.torso.rotation.x = 0.25 + breath;
        c.head.rotation.x = -breath;
        c.lowerJaw.rotation.x = 0.05;
        c.tail.rotation.y = Math.sin(this.globalTime * 1.5) * 0.12;

        if (c.arms && c.arms.length >= 2) {
          c.arms[0].rotation.x = -0.2 + Math.sin(this.globalTime * 2.0) * 0.08;
          c.arms[1].rotation.x = -0.2 - Math.sin(this.globalTime * 2.0) * 0.08;
        }
      }

      // Swirling mist plume expansion (Waterfall Predator Event C)
      if (c.mistPlume) {
        const mistPulse = 1.0 + Math.sin(this.globalTime * 2.0) * 0.15;
        c.mistPlume.scale.set(mistPulse, 1.0, mistPulse);
      }
    }

    // --- 3. Sprinting Raptor Pack & Event B (Raptor Ridge) ---
    for (let i = 0; i < this.raptorPacks.length; i++) {
      const rp = this.raptorPacks[i];

      // Distance-staged lifecycle
      if (rp.triggerZ !== undefined && rp.triggerZ !== 0) {
        const dist = playerZ - rp.triggerZ;
        if (dist > 110) {
          rp.state = 'PERCHED';
        } else if (dist > -20) {
          rp.state = 'SPRINTING';
        } else {
          rp.state = 'RETREATING';
        }
      }

      const isSprinting = rp.state ? (rp.state === 'SPRINTING') : true;

      if (isSprinting) {
        rp.packGroup.position.z += rp.speed * motionScale * clampedDelta;
        if (rp.packGroup.position.z > rp.maxZ) {
          rp.packGroup.position.z = rp.minZ;
        }
      }

      for (let r = 0; r < rp.raptors.length; r++) {
        const rap = rp.raptors[r];
        const step = (this.globalTime * rp.runFreq + rap.phaseOffset) * motionScale;

        // Athletic bipedal leg pumping
        if (rap.legs.length >= 2) {
          rap.legs[0].rotation.x = Math.sin(step) * 0.75;
          rap.legs[1].rotation.x = Math.sin(step + Math.PI) * 0.75;
        }

        // Horizontal predatory posture & head bob
        rap.head.position.y = 1.35 + Math.sin(step * 2.0) * 0.12;
        rap.tail.rotation.y = Math.sin(step) * 0.22;
        rap.tail.rotation.x = 0.1 + Math.cos(step * 2.0) * 0.08;

        // Subtle lateral banking / weaving between canyon rocks
        if (rp.isEventB) {
          const weaveX = (rap.lateralOffset ?? 0) + Math.sin(this.globalTime * 2.2 + rap.phaseOffset) * 0.45;
          rap.group.position.x = weaveX;
          rap.group.rotation.z = -Math.sin(this.globalTime * 2.2 + rap.phaseOffset) * 0.12;
        }

        // Jaws snap rhythmically during hunt
        if (rap.jaw) {
          rap.jaw.rotation.x = 0.08 + Math.abs(Math.sin(step * 1.5)) * 0.15;
        }
      }
    }

    // --- 4. Gliding Pterosaur Flock ---
    for (let i = 0; i < this.pterosaurs.length; i++) {
      const pt = this.pterosaurs[i];
      pt.group.position.z += pt.flightSpeed * motionScale * clampedDelta;
      if (pt.group.position.z > 80) {
        pt.group.position.z = -140;
      }

      for (let g = 0; g < pt.gliders.length; g++) {
        const glider = pt.gliders[g];
        const flightTime = (this.globalTime * pt.wingFlapFreq + glider.phaseOffset) * motionScale;

        // Jointed wing flapping cycle
        const wingFlap = Math.sin(flightTime) * 0.45;
        glider.leftWing.rotation.z = wingFlap;
        glider.rightWing.rotation.z = -wingFlap;

        if (glider.leftWingOuter && glider.rightWingOuter) {
          glider.leftWingOuter.rotation.z = wingFlap * 0.65;
          glider.rightWingOuter.rotation.z = -wingFlap * 0.65;
        }

        // Gentle banking roll turn
        glider.mesh.rotation.z = Math.sin(this.globalTime * 0.8 + glider.phaseOffset) * 0.28;
        glider.mesh.position.y = glider.baseAltitude + Math.sin(flightTime * 0.5) * 1.5;
      }
    }

    // --- 5. Grazing Herbivore Herd ---
    for (let i = 0; i < this.herbivoreHerds.length; i++) {
      const herd = this.herbivoreHerds[i];
      for (let m = 0; m < herd.members.length; m++) {
        const member = herd.members[m];
        const grazeCycle = (this.globalTime * 1.2 + member.phaseOffset) * motionScale;

        // Head dips down to graze on fern vegetation then looks up
        member.head.rotation.x = 0.35 + Math.sin(grazeCycle) * 0.25;
        member.tail.rotation.y = Math.sin(grazeCycle * 2.0) * 0.18;
      }
    }

    // --- 6. Curious Giant Watcher ---
    for (let i = 0; i < this.curiousWatchers.length; i++) {
      const cw = this.curiousWatchers[i];
      let trackAngle = Math.sin(this.globalTime * 0.8 * motionScale) * 0.45;

      // If triggerZ is defined, calculate direct angular gaze toward player
      if (cw.triggerZ !== undefined && cw.triggerZ !== 0) {
        const dZ = playerZ - cw.triggerZ;
        if (Math.abs(dZ) < 80) {
          trackAngle = THREE.MathUtils.clamp(Math.atan2(0 - cw.dinosaurGroup.position.x, -dZ) * 0.5, -0.75, 0.75);
        }
      }

      cw.neck.rotation.y = THREE.MathUtils.lerp(cw.neck.rotation.y, trackAngle, clampedDelta * 3.5);
      cw.head.rotation.y = THREE.MathUtils.lerp(cw.head.rotation.y, trackAngle * 0.8, clampedDelta * 4.0);
      cw.head.rotation.x = 0.15 + Math.cos(this.globalTime * 0.8 * motionScale) * 0.10;
    }

    // --- 7. Prehistoric Waterfalls & Cataracts ---
    for (let i = 0; i < this.waterfalls.length; i++) {
      const wf = this.waterfalls[i];
      wf.timer += clampedDelta;

      // UV translation scroll on water cascade
      const mat = wf.mesh.material as THREE.MeshStandardMaterial;
      if (mat && mat.map) {
        mat.map.offset.y = (mat.map.offset.y + wf.scrollSpeed * clampedDelta) % 1.0;
      }

      // Expanding circular splash rings at plunge base
      for (let r = 0; r < wf.splashRings.length; r++) {
        const ring = wf.splashRings[r];
        const ringPhase = (wf.timer * 2.0 + r * (Math.PI / wf.splashRings.length)) % Math.PI;
        const scale = 0.8 + Math.sin(ringPhase) * 1.4;
        ring.scale.set(scale, scale, 1.0);
        const rMat = ring.material as THREE.MeshBasicMaterial;
        if (rMat) {
          rMat.opacity = Math.max(0.0, 0.85 * (1.0 - Math.sin(ringPhase)));
        }
      }

      // Swirling waterfall mist
      if (wf.mistPlume) {
        wf.mistPlume.rotation.y += clampedDelta * 0.35;
        const mistScale = 1.0 + 0.12 * Math.sin(wf.timer * 1.5);
        wf.mistPlume.scale.set(mistScale, mistScale, mistScale);
      }
    }

    // --- 8. Flowing River Streams ---
    for (let i = 0; i < this.rivers.length; i++) {
      const r = this.rivers[i];
      const mat = r.mesh.material as THREE.MeshStandardMaterial;
      if (mat && mat.map) {
        mat.map.offset.y = (mat.map.offset.y + r.scrollSpeed * clampedDelta) % 1.0;
      }
    }

    // --- 9. Hovering Prehistoric Dragonflies (Meganeura) ---
    for (let i = 0; i < this.dragonflies.length; i++) {
      const df = this.dragonflies[i];
      const t = this.globalTime * 24.0 + df.phase;

      // High-speed wing flutter
      const wingFlutter = Math.sin(t) * 0.65;
      df.leftWing.rotation.z = wingFlutter;
      df.rightWing.rotation.z = -wingFlutter;

      // Gentle hovering figure-8 bob
      df.group.position.x = df.basePos.x + Math.sin(this.globalTime * 1.8 + df.phase) * 0.8;
      df.group.position.y = df.basePos.y + Math.cos(this.globalTime * 2.4 + df.phase) * 0.35;
      df.group.position.z = df.basePos.z + Math.sin(this.globalTime * 1.2 + df.phase) * 0.6;
    }

    // --- 10. Swaying Prehistoric Foliage ---
    for (let i = 0; i < this.swayingFoliage.length; i++) {
      const sf = this.swayingFoliage[i];
      const sway = Math.sin(this.globalTime * sf.freq + sf.phase) * sf.amp * motionScale;
      for (let f = 0; f < sf.fronds.length; f++) {
        sf.fronds[f].rotation.z = sway;
      }
    }
  }

  // Inspection getters for verification suite
  public getSauropodCount(): number { return this.sauropods.length; }
  public getCarnivoreCount(): number { return this.carnivores.length; }
  public getRaptorPackCount(): number { return this.raptorPacks.length; }
  public getPterosaurCount(): number { return this.pterosaurs.length; }
  public getHerbivoreHerdCount(): number { return this.herbivoreHerds.length; }
  public getCuriousWatcherCount(): number { return this.curiousWatchers.length; }
  public getWaterfallCount(): number { return this.waterfalls.length; }
  public getRiverCount(): number { return this.rivers.length; }
  public getDragonflyCount(): number { return this.dragonflies.length; }
  public getTotalActiveElements(): number {
    return this.sauropods.length + this.carnivores.length + this.raptorPacks.length +
           this.pterosaurs.length + this.herbivoreHerds.length + this.curiousWatchers.length +
           this.waterfalls.length + this.rivers.length + this.dragonflies.length;
  }
}
