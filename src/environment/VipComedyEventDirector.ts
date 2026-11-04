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

  private globalClock: number = 0;
  private isEnabled: boolean = true;

  private constructor() {}

  public static getInstance(): VipComedyEventDirector {
    if (!VipComedyEventDirector.instance) {
      VipComedyEventDirector.instance = new VipComedyEventDirector();
    }
    return VipComedyEventDirector.instance;
  }

  public registerScissors(leftBlade: THREE.Object3D, rightBlade: THREE.Object3D, speed: number = 3.5): void {
    this.scissorsList.push({
      leftBlade,
      rightBlade,
      speed,
      offset: Math.random() * Math.PI
    });
  }

  public registerDebater(arm1: THREE.Object3D, arm2: THREE.Object3D, head?: THREE.Object3D, speed: number = 4.0): void {
    this.debatersList.push({
      arm1,
      arm2,
      head,
      speed,
      phase: Math.random() * Math.PI * 2
    });
  }

  public registerSteam(mesh: THREE.Object3D, height: number = 4.0): void {
    this.steamList.push({
      mesh,
      initialY: mesh.position.y,
      maxY: mesh.position.y + height,
      speedY: 1.8 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2
    });
  }

  public registerCameraFlash(mesh: THREE.Object3D, light?: THREE.PointLight): void {
    this.flashList.push({
      mesh,
      light,
      flashTimer: 0,
      nextFlash: 0.2 + Math.random() * 0.8
    });
  }

  public registerHelicopter(group: THREE.Object3D, rotor: THREE.Object3D): void {
    this.helicopterList.push({
      group,
      rotor,
      baseY: group.position.y,
      baseX: group.position.x,
      phase: Math.random() * Math.PI
    });
  }

  public registerGavel(mesh: THREE.Object3D): void {
    this.gavelList.push({
      mesh,
      timer: Math.random() * 2.0
    });
  }

  public clear(): void {
    this.scissorsList = [];
    this.debatersList = [];
    this.steamList = [];
    this.flashList = [];
    this.helicopterList = [];
    this.gavelList = [];
    this.globalClock = 0;
  }

  /**
   * Called every animation frame from WorldScene / Game loop
   */
  public update(dt: number, isVipActive: boolean = true): void {
    if (!this.isEnabled || !isVipActive) return;

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

    // 4. Animate Camera Paparazzi Flashes
    for (let i = 0; i < this.flashList.length; i++) {
      const f = this.flashList[i];
      f.flashTimer += delta;
      if (f.flashTimer >= f.nextFlash) {
        f.flashTimer = 0;
        f.nextFlash = 0.25 + Math.random() * 0.75;
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
  }
}
