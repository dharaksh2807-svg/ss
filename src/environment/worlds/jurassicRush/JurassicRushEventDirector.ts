import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';

export interface SauropodWalker {
  group: THREE.Group;
  neck: THREE.Object3D;
  head: THREE.Object3D;
  tail: THREE.Object3D;
  legs: THREE.Object3D[];
  speed: number;
  walkFreq: number;
  minZ: number;
  maxZ: number;
}

export interface ApexCarnivore {
  group: THREE.Group;
  torso: THREE.Object3D;
  head: THREE.Object3D;
  lowerJaw: THREE.Object3D;
  tail: THREE.Object3D;
  timer: number;
  roarInterval: number;
}

export interface RaptorPackRunner {
  packGroup: THREE.Group;
  raptors: Array<{
    group: THREE.Group;
    legs: THREE.Object3D[];
    tail: THREE.Object3D;
    head: THREE.Object3D;
    phaseOffset: number;
  }>;
  speed: number;
  runFreq: number;
  minZ: number;
  maxZ: number;
}

export interface PterosaurFlock {
  group: THREE.Group;
  gliders: Array<{
    mesh: THREE.Group;
    leftWing: THREE.Object3D;
    rightWing: THREE.Object3D;
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
}

/**
 * JurassicRushEventDirector
 * Singleton managing all 6 animated prehistoric dinosaur encounters with high performance,
 * stylized believable locomotion, zero per-frame garbage, and reduced-motion compliance.
 */
export class JurassicRushEventDirector {
  private static instance: JurassicRushEventDirector | null = null;

  private sauropods: SauropodWalker[] = [];
  private carnivores: ApexCarnivore[] = [];
  private raptorPacks: RaptorPackRunner[] = [];
  private pterosaurs: PterosaurFlock[] = [];
  private herbivoreHerds: HerbivoreHerd[] = [];
  private curiousWatchers: CuriousGiantWatcher[] = [];

  private globalTime: number = 0;

  private constructor() {}

  public static getInstance(): JurassicRushEventDirector {
    if (!this.instance) {
      this.instance = new JurassicRushEventDirector();
    }
    return this.instance;
  }

  public reset(): void {
    this.sauropods = [];
    this.carnivores = [];
    this.raptorPacks = [];
    this.pterosaurs = [];
    this.herbivoreHerds = [];
    this.curiousWatchers = [];
    this.globalTime = 0;
  }

  // =========================================================================
  // REGISTRATION API
  // =========================================================================

  /**
   * Encounter 1: Register Colossal Sauropod Walker
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
    maxZ: number = 40
  ): void {
    this.sauropods.push({
      group,
      neck,
      head,
      tail,
      legs,
      speed,
      walkFreq,
      minZ,
      maxZ
    });
  }

  /**
   * Encounter 2: Register Apex Carnivore Cliff Roar
   */
  public registerCarnivore(
    group: THREE.Group,
    torso: THREE.Object3D,
    head: THREE.Object3D,
    lowerJaw: THREE.Object3D,
    tail: THREE.Object3D,
    roarInterval: number = 9.0
  ): void {
    this.carnivores.push({
      group,
      torso,
      head,
      lowerJaw,
      tail,
      timer: 0,
      roarInterval
    });
  }

  /**
   * Encounter 3: Register Sprinting Raptor Pack
   */
  public registerRaptorPack(
    packGroup: THREE.Group,
    raptors: Array<{
      group: THREE.Group;
      legs: THREE.Object3D[];
      tail: THREE.Object3D;
      head: THREE.Object3D;
      phaseOffset: number;
    }>,
    speed: number = 22.0,
    runFreq: number = 8.0,
    minZ: number = -140,
    maxZ: number = 30
  ): void {
    this.raptorPacks.push({
      packGroup,
      raptors,
      speed,
      runFreq,
      minZ,
      maxZ
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
    head: THREE.Object3D
  ): void {
    this.curiousWatchers.push({
      dinosaurGroup,
      neck,
      head
    });
  }

  // =========================================================================
  // ANIMATION TICK LOOP
  // =========================================================================

  public update(delta: number, isCurrentTheme: boolean = true): void {
    if (!isCurrentTheme || delta <= 0) return;

    const clampedDelta = Math.min(delta, 0.1);
    this.globalTime += clampedDelta;

    const reducedMotion = SettingsManager.getInstance().isReducedMotion();
    const motionScale = reducedMotion ? 0.2 : 1.0;

    // --- 1. Colossal Sauropod Walker ---
    for (let i = 0; i < this.sauropods.length; i++) {
      const s = this.sauropods[i];
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
      s.neck.rotation.z = Math.sin(walkCycle * 0.5) * 0.15;
      s.neck.rotation.x = 0.35 + Math.cos(walkCycle * 0.5) * 0.12;
      s.head.rotation.x = -0.3 + Math.sin(walkCycle * 0.5) * 0.10;

      // Tail counterbalancing swing
      s.tail.rotation.y = Math.sin(walkCycle * 0.5) * 0.25;
      s.tail.rotation.x = -0.15 + Math.cos(walkCycle * 0.5) * 0.08;
    }

    // --- 2. Apex Carnivore Cliff Roar ---
    for (let i = 0; i < this.carnivores.length; i++) {
      const c = this.carnivores[i];
      c.timer += clampedDelta;
      const progress = (c.timer % c.roarInterval) / c.roarInterval;

      // Roar sequence happens from 0.75 to 0.95 of interval
      if (progress > 0.75 && progress < 0.95) {
        const roarNorm = (progress - 0.75) / 0.20; // 0 to 1
        const roarCurve = Math.sin(roarNorm * Math.PI);

        // Body leans forward aggressively
        c.torso.rotation.x = 0.25 + roarCurve * 0.35 * motionScale;

        // Head tilts back to roar at the sky
        c.head.rotation.x = -roarCurve * 0.55 * motionScale;

        // Lower jaw opens wide
        c.lowerJaw.rotation.x = roarCurve * 0.65 * motionScale;

        // Tail whips for balance
        c.tail.rotation.y = Math.sin(this.globalTime * 8.0) * 0.35 * motionScale;
      } else {
        // Idle breathing stance
        const breath = Math.sin(this.globalTime * 2.5) * 0.05;
        c.torso.rotation.x = 0.25 + breath;
        c.head.rotation.x = -breath;
        c.lowerJaw.rotation.x = 0.05;
        c.tail.rotation.y = Math.sin(this.globalTime * 1.5) * 0.12;
      }
    }

    // --- 3. Sprinting Raptor Pack ---
    for (let i = 0; i < this.raptorPacks.length; i++) {
      const rp = this.raptorPacks[i];
      rp.packGroup.position.z += rp.speed * motionScale * clampedDelta;
      if (rp.packGroup.position.z > rp.maxZ) {
        rp.packGroup.position.z = rp.minZ;
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

        // Wing flapping cycle
        const wingFlap = Math.sin(flightTime) * 0.45;
        glider.leftWing.rotation.z = wingFlap;
        glider.rightWing.rotation.z = -wingFlap;

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
      // Neck and head smoothly turn back and forth tracking track
      const trackAngle = Math.sin(this.globalTime * 0.8 * motionScale) * 0.45;
      cw.neck.rotation.y = trackAngle;
      cw.head.rotation.y = trackAngle * 0.8;
      cw.head.rotation.x = 0.15 + Math.cos(this.globalTime * 0.8 * motionScale) * 0.10;
    }
  }

  // Inspection getters for verification suite
  public getSauropodCount(): number { return this.sauropods.length; }
  public getCarnivoreCount(): number { return this.carnivores.length; }
  public getRaptorPackCount(): number { return this.raptorPacks.length; }
  public getPterosaurCount(): number { return this.pterosaurs.length; }
  public getHerbivoreHerdCount(): number { return this.herbivoreHerds.length; }
  public getCuriousWatcherCount(): number { return this.curiousWatchers.length; }
}
