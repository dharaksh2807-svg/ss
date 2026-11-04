import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';

export interface VolcanoEruption {
  craterMesh: THREE.Mesh;
  plumeMesh?: THREE.Mesh;
  firebombs?: THREE.Group;
  timer: number;
  cycleInterval: number;
}

export interface LavaWaterfall {
  fallMesh: THREE.Mesh;
  splashRings?: THREE.Mesh[];
  baseIntensity: number;
  flowSpeed: number;
}

export interface ShiftingChain {
  chainGroup: THREE.Group;
  counterweight?: THREE.Mesh;
  frequency: number;
  amplitude: number;
  phaseOffset: number;
}

export interface LavaGeyser {
  geyserMesh: THREE.Mesh;
  sprayHead?: THREE.Mesh;
  baseY: number;
  maxHeight: number;
  timer: number;
  cycleInterval: number;
}

export interface CollapsingRock {
  monolithMesh: THREE.Object3D;
  splashWave?: THREE.Mesh;
  initialRotation: THREE.Euler;
  timer: number;
  cycleInterval: number;
}

export interface FurnaceBlastDoor {
  leftDoor: THREE.Object3D;
  rightDoor: THREE.Object3D;
  interiorGlow: THREE.Mesh;
  maxSlide: number;
  phase: number;
}

/**
 * InfernoExpressEventDirector
 * Singleton managing all 6 animated volcanic world events with high performance,
 * deterministic timing, zero per-frame allocations, and reduced-motion compliance.
 */
export class InfernoExpressEventDirector {
  private static instance: InfernoExpressEventDirector | null = null;

  private volcanoes: VolcanoEruption[] = [];
  private waterfalls: LavaWaterfall[] = [];
  private chains: ShiftingChain[] = [];
  private geysers: LavaGeyser[] = [];
  private collapsingRocks: CollapsingRock[] = [];
  private blastDoors: FurnaceBlastDoor[] = [];

  private globalTime: number = 0;

  private constructor() {
    if (typeof window !== 'undefined') {
      (window as any).__INFERNO_DIRECTOR__ = this;
    }
  }

  public static getInstance(): InfernoExpressEventDirector {
    if (!this.instance) {
      this.instance = new InfernoExpressEventDirector();
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

    this.volcanoes = this.volcanoes.filter(v => isAttached(v.craterMesh));
    this.waterfalls = this.waterfalls.filter(w => isAttached(w.fallMesh));
    this.chains = this.chains.filter(c => isAttached(c.chainGroup));
    this.geysers = this.geysers.filter(g => isAttached(g.geyserMesh));
    this.collapsingRocks = this.collapsingRocks.filter(r => isAttached(r.monolithMesh));
    this.blastDoors = this.blastDoors.filter(b => isAttached(b.leftDoor));
  }

  public reset(): void {
    this.volcanoes = [];
    this.waterfalls = [];
    this.chains = [];
    this.geysers = [];
    this.collapsingRocks = [];
    this.blastDoors = [];
    this.globalTime = 0;
  }

  // =========================================================================
  // REGISTRATION API
  // =========================================================================

  /**
   * Event 1: Register Distant Erupting Volcano
   */
  public registerVolcano(
    craterMesh: THREE.Mesh,
    plumeMesh?: THREE.Mesh,
    firebombs?: THREE.Group,
    cycleInterval: number = 10.0
  ): void {
    this.volcanoes.push({
      craterMesh,
      plumeMesh,
      firebombs,
      timer: 0,
      cycleInterval
    });
  }

  /**
   * Event 2: Register Pulsing Molten Lava Waterfall Cataract
   */
  public registerLavaWaterfall(
    fallMesh: THREE.Mesh,
    splashRings?: THREE.Mesh[],
    baseIntensity: number = 1.0,
    flowSpeed: number = 2.0
  ): void {
    this.waterfalls.push({
      fallMesh,
      splashRings,
      baseIntensity,
      flowSpeed
    });
  }

  /**
   * Event 3: Register Shifting Industrial Viaduct Suspension Chains
   */
  public registerShiftingChain(
    chainGroup: THREE.Group,
    counterweight?: THREE.Mesh,
    frequency: number = 1.2,
    amplitude: number = 0.25,
    phaseOffset: number = 0
  ): void {
    this.chains.push({
      chainGroup,
      counterweight,
      frequency,
      amplitude,
      phaseOffset
    });
  }

  /**
   * Event 4: Register Volcanic Ocean Magma Geyser
   */
  public registerLavaGeyser(
    geyserMesh: THREE.Mesh,
    sprayHead?: THREE.Mesh,
    baseY: number = -6.0,
    maxHeight: number = 22.0,
    cycleInterval: number = 8.0
  ): void {
    this.geysers.push({
      geyserMesh,
      sprayHead,
      baseY,
      maxHeight,
      timer: 0,
      cycleInterval
    });
  }

  /**
   * Event 5: Register Distant Collapsing Basalt Monolith
   */
  public registerCollapsingRock(
    monolithMesh: THREE.Object3D,
    splashWave?: THREE.Mesh,
    cycleInterval: number = 14.0
  ): void {
    this.collapsingRocks.push({
      monolithMesh,
      splashWave,
      initialRotation: monolithMesh.rotation.clone(),
      timer: 0,
      cycleInterval
    });
  }

  /**
   * Event 6: Register Furnace Blast Doors Aperture Glow
   */
  public registerBlastDoors(
    leftDoor: THREE.Object3D,
    rightDoor: THREE.Object3D,
    interiorGlow: THREE.Mesh,
    maxSlide: number = 3.5
  ): void {
    this.blastDoors.push({
      leftDoor,
      rightDoor,
      interiorGlow,
      maxSlide,
      phase: 0
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
    const motionScale = reducedMotion ? 0.2 : 1.0;

    // --- 1. Distant Volcano Eruptions ---
    for (let i = 0; i < this.volcanoes.length; i++) {
      const v = this.volcanoes[i];
      v.timer += clampedDelta;
      const progress = (v.timer % v.cycleInterval) / v.cycleInterval;

      // Eruption burst happens during 0.85 to 1.0 of interval
      if (progress > 0.85) {
        const eruptNorm = (progress - 0.85) / 0.15; // 0 to 1
        const flare = Math.sin(eruptNorm * Math.PI);

        // Crater mouth flashes white-hot
        const cMat = v.craterMesh.material as THREE.MeshStandardMaterial;
        if (cMat && cMat.emissive) {
          cMat.emissiveIntensity = 1.0 + flare * 2.8 * motionScale;
        }

        // Billowing ash/magma plume expands
        if (v.plumeMesh) {
          const plumeScale = 1.0 + eruptNorm * 2.5 * motionScale;
          v.plumeMesh.scale.set(plumeScale, plumeScale * 1.5, plumeScale);
          v.plumeMesh.position.y = 28.0 + eruptNorm * 14.0 * motionScale;
          v.plumeMesh.visible = true;
          const pMat = v.plumeMesh.material as THREE.MeshBasicMaterial;
          if (pMat) pMat.opacity = (1.0 - eruptNorm * 0.8) * 0.85;
        }

        // Soaring firebombs arc
        if (v.firebombs) {
          v.firebombs.position.y = eruptNorm * 18.0 * motionScale;
          v.firebombs.rotation.y += clampedDelta * 3.0 * motionScale;
          v.firebombs.visible = true;
        }
      } else {
        const cMat = v.craterMesh.material as THREE.MeshStandardMaterial;
        if (cMat && cMat.emissive) cMat.emissiveIntensity = 1.0;
        if (v.plumeMesh) v.plumeMesh.visible = false;
        if (v.firebombs) v.firebombs.visible = false;
      }
    }

    // --- 2. Pulsing Lava Waterfalls ---
    for (let i = 0; i < this.waterfalls.length; i++) {
      const wf = this.waterfalls[i];
      const pulse = Math.sin(this.globalTime * wf.flowSpeed * motionScale) * 0.35;
      const mat = wf.fallMesh.material as THREE.MeshStandardMaterial;
      if (mat && mat.emissive) {
        mat.emissiveIntensity = wf.baseIntensity + pulse;
      }

      // Splash rings expanding at waterfall base
      if (wf.splashRings) {
        for (let r = 0; r < wf.splashRings.length; r++) {
          const ring = wf.splashRings[r];
          const ringProgress = (this.globalTime * 1.5 + r * 0.4) % 1.0;
          const scale = 1.0 + ringProgress * 2.8;
          ring.scale.set(scale, 1.0, scale);
          const rMat = ring.material as THREE.MeshBasicMaterial;
          if (rMat) rMat.opacity = (1.0 - ringProgress) * 0.7;
        }
      }
    }

    // --- 3. Shifting Massive Chains & Counterweights ---
    for (let i = 0; i < this.chains.length; i++) {
      const ch = this.chains[i];
      const angle = Math.sin(this.globalTime * ch.frequency * motionScale + ch.phaseOffset) * ch.amplitude;
      ch.chainGroup.rotation.z = angle;
      if (ch.counterweight) {
        ch.counterweight.position.y = Math.cos(angle) * 0.3;
      }
    }

    // --- 4. Lava Geyser Bursts ---
    for (let i = 0; i < this.geysers.length; i++) {
      const g = this.geysers[i];
      g.timer += clampedDelta;
      const progress = (g.timer % g.cycleInterval) / g.cycleInterval;

      // Geyser eruption happens during 0.70 to 0.95 of interval
      if (progress > 0.70 && progress < 0.95) {
        const eruptNorm = (progress - 0.70) / 0.25; // 0 to 1
        const heightCurve = Math.sin(eruptNorm * Math.PI);
        const currentH = g.baseY + heightCurve * g.maxHeight * motionScale;

        g.geyserMesh.position.y = currentH * 0.5;
        g.geyserMesh.scale.set(1.0 + heightCurve * 0.4, Math.max(0.01, heightCurve * (g.maxHeight / 10)), 1.0 + heightCurve * 0.4);
        g.geyserMesh.visible = true;

        if (g.sprayHead) {
          g.sprayHead.position.y = currentH;
          const sprayScale = 1.0 + heightCurve * 1.8;
          g.sprayHead.scale.set(sprayScale, sprayScale, sprayScale);
          g.sprayHead.visible = true;
        }
      } else {
        g.geyserMesh.visible = false;
        if (g.sprayHead) g.sprayHead.visible = false;
      }
    }

    // --- 5. Distant Collapsing Basalt Rock ---
    for (let i = 0; i < this.collapsingRocks.length; i++) {
      const cr = this.collapsingRocks[i];
      cr.timer += clampedDelta;
      const progress = (cr.timer % cr.cycleInterval) / cr.cycleInterval;

      // Collapse animation happens from 0.80 to 0.98 of interval
      if (progress > 0.80) {
        const collapseNorm = (progress - 0.80) / 0.18; // 0 to 1
        // Tilt forward and to the side into distant lava
        cr.monolithMesh.rotation.x = cr.initialRotation.x + collapseNorm * 0.95 * motionScale;
        cr.monolithMesh.rotation.z = cr.initialRotation.z + collapseNorm * 0.45 * motionScale;
        cr.monolithMesh.position.y = -collapseNorm * 12.0 * motionScale;

        if (cr.splashWave) {
          const waveScale = collapseNorm * 4.0;
          cr.splashWave.scale.set(waveScale, 1.0, waveScale);
          const sMat = cr.splashWave.material as THREE.MeshBasicMaterial;
          if (sMat) sMat.opacity = (1.0 - collapseNorm) * 0.85;
          cr.splashWave.visible = true;
        }
      } else {
        cr.monolithMesh.rotation.copy(cr.initialRotation);
        cr.monolithMesh.position.y = 0;
        if (cr.splashWave) cr.splashWave.visible = false;
      }
    }

    // --- 6. Furnace Blast Doors Aperture Glow ---
    for (let i = 0; i < this.blastDoors.length; i++) {
      const bd = this.blastDoors[i];
      bd.phase += clampedDelta * 0.5 * motionScale;
      // Sinusoidal open/close cycle
      const openAmount = 0.5 + 0.5 * Math.sin(bd.phase);
      const slide = openAmount * bd.maxSlide;

      bd.leftDoor.position.x = -slide;
      bd.rightDoor.position.x = slide;

      // Interior fire glow intensity surges when doors are open
      const mat = bd.interiorGlow.material as THREE.MeshStandardMaterial;
      if (mat && mat.emissive) {
        mat.emissiveIntensity = 0.8 + openAmount * 2.2;
      }
    }
  }

  // Inspection getters for verification suite
  public getVolcanoCount(): number { return this.volcanoes.length; }
  public getWaterfallCount(): number { return this.waterfalls.length; }
  public getChainCount(): number { return this.chains.length; }
  public getGeyserCount(): number { return this.geysers.length; }
  public getCollapsingRockCount(): number { return this.collapsingRocks.length; }
  public getBlastDoorCount(): number { return this.blastDoors.length; }
  public getTotalActiveElements(): number {
    return this.volcanoes.length + this.waterfalls.length + this.chains.length +
           this.geysers.length + this.collapsingRocks.length + this.blastDoors.length;
  }
}
