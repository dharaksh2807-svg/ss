import * as THREE from 'three';
import { SettingsManager } from '../settings/SettingsManager';

export interface AnimatedScissor {
  leftBlade: THREE.Object3D;
  rightBlade: THREE.Object3D;
  speed: number;
  offset: number;
}

export interface AnimatedDebater {
  arm1: THREE.Object3D;
  arm2: THREE.Object3D;
  head?: THREE.Object3D;
  speed: number;
  phase: number;
}

export interface AnimatedSteam {
  mesh: THREE.Object3D;
  initialY: number;
  maxY: number;
  speedY: number;
  phase: number;
}

export interface AnimatedCameraFlash {
  mesh: THREE.Object3D;
  light?: THREE.PointLight;
  flashTimer: number;
  nextFlash: number;
}

export interface AnimatedHelicopter {
  group: THREE.Object3D;
  rotor: THREE.Object3D;
  baseY: number;
  baseX: number;
  phase: number;
}

export interface AnimatedGavel {
  mesh: THREE.Object3D;
  timer: number;
}

export interface AnimatedParliamentPaper {
  mesh: THREE.Object3D;
  baseY: number;
  baseZ: number;
  speed: number;
  phase: number;
}

export interface AnimatedCountdownBoard {
  mesh: THREE.Object3D;
  material: THREE.Material;
  timer: number;
}

export interface AnimatedRunawayDecoy {
  group: THREE.Object3D;
  cameraCrew: THREE.Object3D;
  baseZ: number;
  speed: number;
}

/**
 * VipComedyEventDirector
 * Dedicated coordinator for procedural, animated political satire gags
 * across all five comedy districts in the Mitron Express / VIP Express signature world.
 */
export class VipComedyEventDirector {
  private static instance: VipComedyEventDirector;

  private scissorsList: AnimatedScissor[] = [];
  private debatersList: AnimatedDebater[] = [];
  private steamList: AnimatedSteam[] = [];
  private flashList: AnimatedCameraFlash[] = [];
  private helicopterList: AnimatedHelicopter[] = [];
  private gavelList: AnimatedGavel[] = [];
  private papersList: AnimatedParliamentPaper[] = [];
  private countdownList: AnimatedCountdownBoard[] = [];
  private runawayList: AnimatedRunawayDecoy[] = [];

  private globalClock: number = 0;
  private isEnabled: boolean = true;
  private regCounter: number = 0;

  private constructor() {}

  public static getInstance(): VipComedyEventDirector {
    if (!VipComedyEventDirector.instance) {
      VipComedyEventDirector.instance = new VipComedyEventDirector();
    }
    return VipComedyEventDirector.instance;
  }

  private getDeterministicPhase(): number {
    this.regCounter = (this.regCounter + 1) % 1000;
    return ((this.regCounter * 1.6180339887) % 1) * Math.PI * 2;
  }

  public registerScissors(leftBlade: THREE.Object3D, rightBlade: THREE.Object3D, speed: number = 3.5): void {
    this.scissorsList.push({
      leftBlade,
      rightBlade,
      speed,
      offset: this.getDeterministicPhase() * 0.5
    });
  }

  public registerDebater(arm1: THREE.Object3D, arm2: THREE.Object3D, head?: THREE.Object3D, speed: number = 4.0): void {
    this.debatersList.push({
      arm1,
      arm2,
      head,
      speed,
      phase: this.getDeterministicPhase()
    });
  }

  public registerSteam(mesh: THREE.Object3D, height: number = 4.0): void {
    const phase = this.getDeterministicPhase();
    this.steamList.push({
      mesh,
      initialY: mesh.position.y,
      maxY: mesh.position.y + height,
      speedY: 1.8 + ((phase / (Math.PI * 2)) * 0.8),
      phase
    });
  }

  public registerCameraFlash(mesh: THREE.Object3D, light?: THREE.PointLight): void {
    const phase = this.getDeterministicPhase();
    this.flashList.push({
      mesh,
      light,
      flashTimer: 0,
      nextFlash: 0.2 + ((phase / (Math.PI * 2)) * 0.8)
    });
  }

  public registerHelicopter(group: THREE.Object3D, rotor: THREE.Object3D): void {
    this.helicopterList.push({
      group,
      rotor,
      baseY: group.position.y,
      baseX: group.position.x,
      phase: this.getDeterministicPhase() * 0.5
    });
  }

  public registerGavel(mesh: THREE.Object3D): void {
    this.gavelList.push({
      mesh,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 2.0
    });
  }

  public registerParliamentPaper(mesh: THREE.Object3D, baseY: number, baseZ: number, speed: number = 2.5): void {
    this.papersList.push({
      mesh,
      baseY,
      baseZ,
      speed,
      phase: this.getDeterministicPhase()
    });
  }

  public registerCountdownBoard(mesh: THREE.Object3D, material: THREE.Material): void {
    this.countdownList.push({
      mesh,
      material,
      timer: 0
    });
  }

  public registerRunawayDecoy(group: THREE.Object3D, cameraCrew: THREE.Object3D, speed: number = 1.2): void {
    this.runawayList.push({
      group,
      cameraCrew,
      baseZ: group.position.z,
      speed
    });
  }

  // --- Public Diagnostics Getters ---
  public getScissorsCount(): number { return this.scissorsList.length; }
  public getDebatersCount(): number { return this.debatersList.length; }
  public getSteamCount(): number { return this.steamList.length; }
  public getFlashCount(): number { return this.flashList.length; }
  public getHelicopterCount(): number { return this.helicopterList.length; }
  public getGavelCount(): number { return this.gavelList.length; }
  public getPapersCount(): number { return this.papersList.length; }
  public getCountdownCount(): number { return this.countdownList.length; }
  public getRunawayDecoyCount(): number { return this.runawayList.length; }
  public getTotalActiveElements(): number {
    return this.scissorsList.length + this.debatersList.length + this.steamList.length +
      this.flashList.length + this.helicopterList.length + this.gavelList.length +
      this.papersList.length + this.countdownList.length + this.runawayList.length;
  }

  public clear(): void {
    this.scissorsList = [];
    this.debatersList = [];
    this.steamList = [];
    this.flashList = [];
    this.helicopterList = [];
    this.gavelList = [];
    this.papersList = [];
    this.countdownList = [];
    this.runawayList = [];
    this.globalClock = 0;
  }

  /**
   * Prunes detached objects whose parents were severed when chunks were recycled.
   * This completely prevents unbounded object accumulation.
   */
  private pruneDetached(): void {
    const isAttached = (obj: THREE.Object3D | null | undefined): boolean => {
      return !!(obj && obj.parent);
    };

    this.scissorsList = this.scissorsList.filter(s => isAttached(s.leftBlade) && isAttached(s.rightBlade));
    this.debatersList = this.debatersList.filter(d => isAttached(d.arm1) && isAttached(d.arm2));
    this.steamList = this.steamList.filter(st => isAttached(st.mesh));
    this.flashList = this.flashList.filter(f => isAttached(f.mesh));
    this.helicopterList = this.helicopterList.filter(h => isAttached(h.group) && isAttached(h.rotor));
    this.gavelList = this.gavelList.filter(g => isAttached(g.mesh));
    this.papersList = this.papersList.filter(p => isAttached(p.mesh));
    this.countdownList = this.countdownList.filter(c => isAttached(c.mesh));
    this.runawayList = this.runawayList.filter(r => isAttached(r.group));
  }

  /**
   * Called every animation frame from WorldScene / Game loop
   */
  public update(dt: number, isVipActive: boolean = true): void {
    if (!this.isEnabled || !isVipActive) return;

    // Prune any elements whose chunks have been recycled
    this.pruneDetached();

    const delta = Math.min(dt || 0.016, 0.1);
    this.globalClock += delta;

    const isReducedMotion = typeof window !== 'undefined' &&
      SettingsManager.getInstance().isReducedMotion();

    const motionMultiplier = isReducedMotion ? 0.35 : 1.0;

    // 1. Animate Ceremonial Scissors (Snip snip snip)
    for (let i = 0; i < this.scissorsList.length; i++) {
      const s = this.scissorsList[i];
      const angle = Math.abs(Math.sin((this.globalClock + s.offset) * s.speed * motionMultiplier)) * 0.42;
      s.leftBlade.rotation.z = angle;
      s.rightBlade.rotation.z = -angle;
    }

    // 2. Animate Debater Cartoon NPCs (Gesticulating, waving hands, nodding in dramatic dispute)
    for (let i = 0; i < this.debatersList.length; i++) {
      const d = this.debatersList[i];
      const cycle = (this.globalClock * d.speed + d.phase) * motionMultiplier;
      d.arm1.rotation.x = -0.5 + Math.sin(cycle) * 0.45;
      d.arm1.rotation.z = 0.2 + Math.cos(cycle * 0.8) * 0.35;

      d.arm2.rotation.x = -0.4 - Math.cos(cycle * 1.1) * 0.40;
      d.arm2.rotation.z = -0.2 - Math.sin(cycle * 0.9) * 0.30;

      if (d.head) {
        d.head.rotation.y = Math.sin(cycle * 0.5) * 0.35;
        d.head.rotation.x = Math.cos(cycle * 0.7) * 0.18;
      }
    }

    // 3. Animate Chai Steam Wisps (billowing upward, oscillating, scaling)
    if (!isReducedMotion) {
      for (let i = 0; i < this.steamList.length; i++) {
        const st = this.steamList[i];
        st.mesh.position.y += st.speedY * delta;
        st.mesh.position.x += Math.sin(this.globalClock * 2.0 + st.phase) * delta * 0.35;

        const progress = (st.mesh.position.y - st.initialY) / (st.maxY - st.initialY);
        const scale = 0.8 + progress * 1.4;
        st.mesh.scale.set(scale, scale, scale);

        if (st.mesh.position.y >= st.maxY) {
          st.mesh.position.y = st.initialY;
          st.mesh.scale.set(0.6, 0.6, 0.6);
        }
      }
    }

    // 4. Animate Camera Paparazzi Flashes (deterministic timing)
    for (let i = 0; i < this.flashList.length; i++) {
      const f = this.flashList[i];
      f.flashTimer += delta;
      if (f.flashTimer >= f.nextFlash) {
        f.flashTimer = 0;
        const pseudoRand = ((i * 1.618033 + this.globalClock * 0.8) % 1);
        f.nextFlash = 0.25 + pseudoRand * 0.75;
        f.mesh.visible = true;
        if (f.light) {
          f.light.intensity = 3.5;
        }
      } else if (f.mesh.visible && f.flashTimer > 0.08) {
        f.mesh.visible = false;
        if (f.light) {
          f.light.intensity = 0;
        }
      }
    }

    // 5. Animate News Helicopter (Spinning rotors, hovering bob & bank)
    for (let i = 0; i < this.helicopterList.length; i++) {
      const h = this.helicopterList[i];
      h.rotor.rotation.y += delta * 28.0;
      h.group.position.y = h.baseY + Math.sin(this.globalClock * 1.4 + h.phase) * 0.75;
      h.group.position.x = h.baseX + Math.cos(this.globalClock * 0.9 + h.phase) * 1.2;
      h.group.rotation.z = Math.sin(this.globalClock * 1.1 + h.phase) * 0.06;
      h.group.rotation.x = Math.cos(this.globalClock * 0.8 + h.phase) * 0.04;
    }

    // 6. Animate Parliament Gavel (Lifts up, hovers, then SLAMS down!)
    for (let i = 0; i < this.gavelList.length; i++) {
      const g = this.gavelList[i];
      g.timer += delta;
      const cycle = g.timer % 2.4; // 2.4-second cycle
      if (cycle < 1.8) {
        // Slowly rise back up
        g.mesh.rotation.x = -0.55 + (cycle / 1.8) * 0.15;
      } else if (cycle < 2.0) {
        // Dramatic raise high
        g.mesh.rotation.x = -0.85;
      } else {
        // SLAM down!
        g.mesh.rotation.x = 0.10;
      }
    }

    // 7. Animate Question Hour Flying Papers
    if (!isReducedMotion) {
      for (let i = 0; i < this.papersList.length; i++) {
        const p = this.papersList[i];
        const pt = (this.globalClock * p.speed + p.phase);
        p.mesh.position.y = p.baseY + Math.abs(Math.sin(pt * 1.6)) * 1.2;
        p.mesh.position.z = p.baseZ + Math.cos(pt * 1.2) * 1.5;
        p.mesh.rotation.x = pt * 2.0;
        p.mesh.rotation.y = pt * 1.5;
        p.mesh.rotation.z = pt * 0.8;
      }
    }

    // 8. Animate Announcement Countdown Board
    for (let i = 0; i < this.countdownList.length; i++) {
      const c = this.countdownList[i];
      c.timer += delta;
      // Pulse scale slightly every second
      const beat = 1.0 + Math.abs(Math.sin(c.timer * Math.PI)) * 0.04;
      c.mesh.scale.set(beat, beat, beat);
    }

    // 9. Animate Runaway Decoy & Frantic Camera Crew Chase
    for (let i = 0; i < this.runawayList.length; i++) {
      const r = this.runawayList[i];
      const cycle = Math.sin(this.globalClock * r.speed);
      r.group.position.z = r.baseZ + cycle * 4.5;
      // Camera crew frantically turns to track the decoy
      r.cameraCrew.rotation.y = -cycle * 0.35;
    }
  }
}
