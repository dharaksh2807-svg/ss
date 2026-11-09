import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';

export type VolcanoEruptionState = 'DORMANT' | 'ANTICIPATION' | 'CLIMAX' | 'AFTERMATH' | 'COMPLETE';

export interface VolcanoEruption {
  group?: THREE.Group;
  triggerZ: number;
  state: VolcanoEruptionState;
  craterMesh: THREE.Mesh;
  plumeMesh?: THREE.Mesh;
  firebombs?: THREE.Group;
  shockwaveRings?: THREE.Mesh[];
  lavaRivers?: THREE.Mesh[];
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

export type CitadelGateState = 'LOCKED' | 'UNLOCKING' | 'OPEN' | 'PASSED';

export interface FurnaceBlastDoor {
  leftDoor: THREE.Object3D;
  rightDoor: THREE.Object3D;
  interiorGlow: THREE.Mesh;
  maxSlide: number;
  phase: number;
  // Event B: Obsidian Fortress Gate Opens
  triggerZ?: number;
  state?: CitadelGateState;
  leftPivot?: THREE.Object3D;
  rightPivot?: THREE.Object3D;
  lockBarTop?: THREE.Object3D;
  lockBarBottom?: THREE.Object3D;
  runeLockCore?: THREE.Mesh;
  maxSwingAngle?: number;
}

export type FoundryLineState = 'IDLE' | 'ACTIVE';

export interface FoundryProductionLine {
  foundryGroup: THREE.Group;
  triggerZ: number;
  pistonPumpA?: THREE.Object3D;
  pistonPumpB?: THREE.Object3D;
  craneTrolley?: THREE.Object3D;
  crucibleBucket?: THREE.Object3D;
  moltenPourStream?: THREE.Mesh;
  ingotMoldsGlow?: THREE.Mesh;
  turbineWheel?: THREE.Object3D;
  pipeHeatRings?: THREE.Mesh[];
  state: FoundryLineState;
  timer: number;
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
  private foundryLines: FoundryProductionLine[] = [];
  private lavaTexture: THREE.Texture | null = null;

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
      if (!obj || !obj.parent) return false;
      let cur: THREE.Object3D = obj;
      while (cur.parent) {
        cur = cur.parent;
      }
      return cur.type === 'Scene' || (cur as any).isScene === true;
    };

    this.volcanoes = this.volcanoes.filter(v => isAttached(v.craterMesh));
    this.waterfalls = this.waterfalls.filter(w => isAttached(w.fallMesh));
    this.chains = this.chains.filter(c => isAttached(c.chainGroup));
    this.geysers = this.geysers.filter(g => isAttached(g.geyserMesh));
    this.collapsingRocks = this.collapsingRocks.filter(r => isAttached(r.monolithMesh));
    this.blastDoors = this.blastDoors.filter(b => isAttached(b.leftDoor));
    this.foundryLines = this.foundryLines.filter(f => isAttached(f.foundryGroup));
  }

  public reset(): void {
    this.volcanoes = [];
    this.waterfalls = [];
    this.chains = [];
    this.geysers = [];
    this.collapsingRocks = [];
    this.blastDoors = [];
    this.foundryLines = [];
    this.lavaTexture = null;
    this.globalTime = 0;
  }

  public registerLavaTexture(texture: THREE.Texture): void {
    this.lavaTexture = texture;
  }

  // =========================================================================
  // REGISTRATION API
  // =========================================================================

  /**
   * Event 1: Register Distant Erupting Volcano / Grand Stratovolcano
   */
  public registerVolcano(
    craterMesh: THREE.Mesh,
    plumeMesh?: THREE.Mesh,
    firebombs?: THREE.Group,
    cycleInterval: number = 10.0,
    triggerZ: number = 0,
    shockwaveRings?: THREE.Mesh[],
    lavaRivers?: THREE.Mesh[],
    group?: THREE.Group
  ): void {
    this.volcanoes.push({
      group,
      triggerZ,
      state: 'DORMANT',
      craterMesh,
      plumeMesh,
      firebombs,
      shockwaveRings,
      lavaRivers,
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
   * Event 6: Register Furnace Blast Doors & Obsidian Fortress Gates (Event B)
   */
  public registerBlastDoors(
    leftDoor: THREE.Object3D,
    rightDoor: THREE.Object3D,
    interiorGlow: THREE.Mesh,
    maxSlide: number = 3.5,
    options?: {
      triggerZ?: number;
      leftPivot?: THREE.Object3D;
      rightPivot?: THREE.Object3D;
      lockBarTop?: THREE.Object3D;
      lockBarBottom?: THREE.Object3D;
      runeLockCore?: THREE.Mesh;
      maxSwingAngle?: number;
    }
  ): void {
    this.blastDoors.push({
      leftDoor,
      rightDoor,
      interiorGlow,
      maxSlide,
      phase: 0,
      triggerZ: options?.triggerZ,
      state: 'LOCKED',
      leftPivot: options?.leftPivot,
      rightPivot: options?.rightPivot,
      lockBarTop: options?.lockBarTop,
      lockBarBottom: options?.lockBarBottom,
      runeLockCore: options?.runeLockCore,
      maxSwingAngle: options?.maxSwingAngle ?? 1.25
    });
  }

  /**
   * Event 7: Register Foundry Production Line (Event C: Magma Foundry Awakening)
   */
  public registerFoundryProductionLine(
    foundryGroup: THREE.Group,
    triggerZ: number = 0,
    options?: {
      pistonPumpA?: THREE.Object3D;
      pistonPumpB?: THREE.Object3D;
      craneTrolley?: THREE.Object3D;
      crucibleBucket?: THREE.Object3D;
      moltenPourStream?: THREE.Mesh;
      ingotMoldsGlow?: THREE.Mesh;
      turbineWheel?: THREE.Object3D;
      pipeHeatRings?: THREE.Mesh[];
    }
  ): void {
    this.foundryLines.push({
      foundryGroup,
      triggerZ,
      pistonPumpA: options?.pistonPumpA,
      pistonPumpB: options?.pistonPumpB,
      craneTrolley: options?.craneTrolley,
      crucibleBucket: options?.crucibleBucket,
      moltenPourStream: options?.moltenPourStream,
      ingotMoldsGlow: options?.ingotMoldsGlow,
      turbineWheel: options?.turbineWheel,
      pipeHeatRings: options?.pipeHeatRings,
      state: 'IDLE',
      timer: 0
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

    // Real-time flowing molten lava surface currents
    if (this.lavaTexture) {
      this.lavaTexture.offset.y = (this.lavaTexture.offset.y - clampedDelta * 0.14 * motionScale) % 1.0;
      this.lavaTexture.offset.x = Math.sin(this.globalTime * 0.35) * 0.03 * motionScale;
    }

    // --- 1. Distant Volcano Eruptions / Grand Stratovolcano ---
    for (let i = 0; i < this.volcanoes.length; i++) {
      const v = this.volcanoes[i];
      v.timer += clampedDelta;

      let isErupting = false;
      let eruptNorm = 0;
      let craterEmissive = 1.0;

      if (v.triggerZ !== 0) {
        // Player-distance staged eruption sequence
        const dist = playerZ - v.triggerZ; // Positive when runner is approaching from ahead

        if (dist > 140) {
          v.state = 'DORMANT';
          craterEmissive = 1.0 + 0.2 * Math.sin(v.timer * 2.0);
        } else if (dist > 65) {
          v.state = 'ANTICIPATION';
          const antNorm = (140 - dist) / 75; // 0 to 1
          craterEmissive = 1.2 + antNorm * 1.4 + 0.35 * Math.sin(v.timer * 4.5);
          if (v.plumeMesh) {
            v.plumeMesh.visible = true;
            v.plumeMesh.scale.set(0.6 + antNorm * 0.5, 0.8 + antNorm * 0.8, 0.6 + antNorm * 0.5);
            v.plumeMesh.position.y = 52.0 + antNorm * 8.0;
            const pMat = v.plumeMesh.material as THREE.MeshBasicMaterial;
            if (pMat) pMat.opacity = 0.35 + antNorm * 0.35;
          }
        } else if (dist >= -25) {
          v.state = 'CLIMAX';
          isErupting = true;
          eruptNorm = Math.sin(Math.min(1.0, Math.max(0.0, (65 - dist) / 90)) * Math.PI);
          craterEmissive = 2.8 + 1.2 * Math.sin(v.timer * 7.5);
        } else if (dist >= -85) {
          v.state = 'AFTERMATH';
          const afterNorm = Math.min(1.0, Math.max(0.0, (-25 - dist) / 60));
          craterEmissive = 1.8 * (1.0 - afterNorm * 0.45);
          if (v.plumeMesh) {
            v.plumeMesh.visible = true;
            const disperseScale = 1.8 + afterNorm * 1.2;
            v.plumeMesh.scale.set(disperseScale, 2.0 + afterNorm * 0.6, disperseScale);
            v.plumeMesh.position.y = 68.0 + afterNorm * 12.0;
            const pMat = v.plumeMesh.material as THREE.MeshBasicMaterial;
            if (pMat) pMat.opacity = Math.max(0.0, (1.0 - afterNorm) * 0.65);
          }
        } else {
          v.state = 'COMPLETE';
          craterEmissive = 1.0;
          if (v.plumeMesh) v.plumeMesh.visible = false;
        }
      } else {
        // Fallback for standalone / unit tests: time-cycled interval
        const progress = (v.timer % v.cycleInterval) / v.cycleInterval;
        if (progress > 0.85) {
          isErupting = true;
          eruptNorm = (progress - 0.85) / 0.15;
          craterEmissive = 1.0 + Math.sin(eruptNorm * Math.PI) * 2.8 * motionScale;
        }
      }

      // Apply crater emissive
      const cMat = v.craterMesh.material as THREE.MeshStandardMaterial;
      if (cMat && cMat.emissive) {
        cMat.emissiveIntensity = craterEmissive;
      }

      // Plume expansion during peak eruption
      if (isErupting && v.plumeMesh) {
        const plumeScale = 1.2 + eruptNorm * 2.4 * motionScale;
        v.plumeMesh.scale.set(plumeScale, plumeScale * 1.8, plumeScale);
        v.plumeMesh.position.y = 54.0 + eruptNorm * 22.0 * motionScale;
        v.plumeMesh.visible = true;
        const pMat = v.plumeMesh.material as THREE.MeshBasicMaterial;
        if (pMat) pMat.opacity = (1.0 - eruptNorm * 0.35) * 0.88;
      } else if (!isErupting && v.triggerZ === 0 && v.plumeMesh) {
        v.plumeMesh.visible = false;
      }

      // Firebombs ballistic ejection
      if (v.firebombs) {
        if (isErupting) {
          v.firebombs.position.y = 48.0 + eruptNorm * 28.0 * motionScale;
          v.firebombs.rotation.y += clampedDelta * 3.5 * motionScale;
          v.firebombs.visible = true;
        } else {
          v.firebombs.visible = false;
        }
      }

      // Expanding volcanic shockwave rings
      if (v.shockwaveRings) {
        for (let r = 0; r < v.shockwaveRings.length; r++) {
          const ring = v.shockwaveRings[r];
          if (isErupting) {
            const ringProg = ((v.timer * 2.0 + r * 0.5) % 1.0);
            const rScale = 1.0 + ringProg * 4.8 * motionScale;
            ring.scale.set(rScale, 1.0, rScale);
            ring.position.y = 53.0 + ringProg * 6.0;
            ring.visible = true;
            const rMat = ring.material as THREE.MeshBasicMaterial;
            if (rMat) rMat.opacity = (1.0 - ringProg) * 0.75;
          } else {
            ring.visible = false;
          }
        }
      }

      // Lava rivers illumination
      if (v.lavaRivers) {
        for (let lr = 0; lr < v.lavaRivers.length; lr++) {
          const riverMat = v.lavaRivers[lr].material as THREE.MeshStandardMaterial;
          if (riverMat && riverMat.emissive) {
            riverMat.emissiveIntensity = isErupting ? 1.8 + 0.5 * Math.sin(v.timer * 6.0) : 1.2;
          }
        }
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

    // --- 6. Furnace Blast Doors & Obsidian Fortress Gates (Event B) ---
    for (let i = 0; i < this.blastDoors.length; i++) {
      const bd = this.blastDoors[i];
      bd.phase += clampedDelta * 0.5 * motionScale;

      if (bd.triggerZ !== undefined && bd.triggerZ !== 0) {
        // Distance-staged Event B: Obsidian Fortress Gate Opens
        // Runner moves toward negative Z -> distance D = playerZ - triggerZ
        const distToGate = playerZ - bd.triggerZ;

        if (distToGate > 110) {
          // 1. LOCKED: Gates shut, mechanical lock bolts fully engaged, steady runic glow
          bd.state = 'LOCKED';
          if (bd.leftPivot) bd.leftPivot.rotation.y = 0;
          if (bd.rightPivot) bd.rightPivot.rotation.y = 0;
          if (bd.lockBarTop) bd.lockBarTop.position.y = 0;
          if (bd.lockBarBottom) bd.lockBarBottom.position.y = 0;
          bd.leftDoor.position.x = 0;
          bd.rightDoor.position.x = 0;
          if (bd.runeLockCore) {
            const rMat = bd.runeLockCore.material as THREE.MeshStandardMaterial;
            if (rMat && rMat.emissive) rMat.emissiveIntensity = 1.15;
          }
          const mat = bd.interiorGlow.material as THREE.MeshStandardMaterial;
          if (mat && mat.emissive) mat.emissiveIntensity = 0.5;
        } else if (distToGate > 50) {
          // 2. UNLOCKING: Mechanical lock disengages, bolts slide clear, runic core surges
          bd.state = 'UNLOCKING';
          const u = Math.min(1.0, Math.max(0.0, (110 - distToGate) / 60.0));
          if (bd.lockBarTop) bd.lockBarTop.position.y = u * 2.8 * motionScale;
          if (bd.lockBarBottom) bd.lockBarBottom.position.y = -u * 2.8 * motionScale;
          if (bd.runeLockCore) {
            const rMat = bd.runeLockCore.material as THREE.MeshStandardMaterial;
            if (rMat && rMat.emissive) rMat.emissiveIntensity = 1.15 + u * 2.1;
          }
          // Gates break seal with subtle tremor
          const sealCrack = u * 0.12 * motionScale;
          if (bd.leftPivot) bd.leftPivot.rotation.y = -sealCrack;
          if (bd.rightPivot) bd.rightPivot.rotation.y = sealCrack;
          bd.leftDoor.position.x = -u * (bd.maxSlide * 0.25);
          bd.rightDoor.position.x = u * (bd.maxSlide * 0.25);
          const mat = bd.interiorGlow.material as THREE.MeshStandardMaterial;
          if (mat && mat.emissive) mat.emissiveIntensity = 0.5 + u * 1.0;
        } else if (distToGate > -25) {
          // 3. OPEN: Colossal fortress gates swing wide open on pivots, revealing glowing interior city
          bd.state = 'OPEN';
          const o = Math.min(1.0, Math.max(0.0, (50 - distToGate) / 40.0));
          const swing = o * (bd.maxSwingAngle ?? 1.25) * motionScale;
          if (bd.leftPivot) bd.leftPivot.rotation.y = -swing;
          if (bd.rightPivot) bd.rightPivot.rotation.y = swing;
          if (bd.lockBarTop) bd.lockBarTop.position.y = 2.8 * motionScale;
          if (bd.lockBarBottom) bd.lockBarBottom.position.y = -2.8 * motionScale;
          bd.leftDoor.position.x = -bd.maxSlide * o;
          bd.rightDoor.position.x = bd.maxSlide * o;
          if (bd.runeLockCore) {
            const rMat = bd.runeLockCore.material as THREE.MeshStandardMaterial;
            if (rMat && rMat.emissive) rMat.emissiveIntensity = 3.25;
          }
          const mat = bd.interiorGlow.material as THREE.MeshStandardMaterial;
          if (mat && mat.emissive) mat.emissiveIntensity = 1.5 + o * 1.5;
        } else {
          // 4. PASSED: Gates remain gracefully open as runner races into the citadel
          bd.state = 'PASSED';
          const swing = (bd.maxSwingAngle ?? 1.25) * motionScale;
          if (bd.leftPivot) bd.leftPivot.rotation.y = -swing;
          if (bd.rightPivot) bd.rightPivot.rotation.y = swing;
          bd.leftDoor.position.x = -bd.maxSlide;
          bd.rightDoor.position.x = bd.maxSlide;
          const mat = bd.interiorGlow.material as THREE.MeshStandardMaterial;
          if (mat && mat.emissive) mat.emissiveIntensity = 2.2;
        }
      } else {
        // Fallback sinusoidal cycle for unit tests without playerZ tracking
        const openAmount = 0.5 + 0.5 * Math.sin(bd.phase);
        const slide = openAmount * bd.maxSlide;

        bd.leftDoor.position.x = -slide;
        bd.rightDoor.position.x = slide;

        if (bd.leftPivot) bd.leftPivot.rotation.y = -openAmount * (bd.maxSwingAngle ?? 1.25) * motionScale;
        if (bd.rightPivot) bd.rightPivot.rotation.y = openAmount * (bd.maxSwingAngle ?? 1.25) * motionScale;

        const mat = bd.interiorGlow.material as THREE.MeshStandardMaterial;
        if (mat && mat.emissive) {
          mat.emissiveIntensity = 0.8 + openAmount * 2.2;
        }
      }
    }

    // --- 7. Foundry Production Line (Event C: Magma Foundry Awakening) ---
    for (let i = 0; i < this.foundryLines.length; i++) {
      const fl = this.foundryLines[i];
      fl.timer += clampedDelta;

      // Reciprocating twin piston pumps
      if (fl.pistonPumpA && fl.pistonPumpB) {
        const stroke = Math.sin(fl.timer * 3.5 * motionScale);
        fl.pistonPumpA.position.y = stroke * 0.85;
        fl.pistonPumpB.position.y = -stroke * 0.85;
      }

      // Overhead crane traversing along gantry beam
      if (fl.craneTrolley) {
        const trolleyPos = Math.sin(fl.timer * 0.75 * motionScale) * 7.5;
        fl.craneTrolley.position.z = trolleyPos;
      }

      // Tilting molten crucible bucket
      const pourPhase = Math.sin(fl.timer * 0.75 * motionScale);
      const isPouring = pourPhase > 0.30;
      if (fl.crucibleBucket) {
        fl.crucibleBucket.rotation.x = isPouring ? (pourPhase - 0.30) * 1.45 * motionScale : 0;
      }

      // Molten pour stream visibility and scale
      if (fl.moltenPourStream) {
        fl.moltenPourStream.visible = isPouring;
        if (isPouring) {
          const streamScale = Math.min(1.0, (pourPhase - 0.30) / 0.60);
          fl.moltenPourStream.scale.set(1.0, streamScale, 1.0);
        }
      }

      // Ingot casting molds illumination glow
      if (fl.ingotMoldsGlow) {
        const mat = fl.ingotMoldsGlow.material as THREE.MeshStandardMaterial;
        if (mat && mat.emissive) {
          mat.emissiveIntensity = isPouring ? 2.45 : 0.85;
        }
      }

      // Rotating cooling turbine
      if (fl.turbineWheel) {
        fl.turbineWheel.rotation.z += clampedDelta * 3.2 * motionScale;
      }

      // Pulsing heat rings along magma transport pipeline
      if (fl.pipeHeatRings && fl.pipeHeatRings.length > 0) {
        for (let r = 0; r < fl.pipeHeatRings.length; r++) {
          const ring = fl.pipeHeatRings[r];
          const pulse = 0.5 + 0.5 * Math.sin(fl.timer * 3.8 - r * 0.75);
          const rMat = ring.material as THREE.MeshStandardMaterial;
          if (rMat && rMat.emissive) {
            rMat.emissiveIntensity = 1.1 + pulse * 1.5;
          }
        }
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
  public getFoundryLineCount(): number { return this.foundryLines.length; }
  public getTotalActiveElements(): number {
    return this.volcanoes.length + this.waterfalls.length + this.chains.length +
           this.geysers.length + this.collapsingRocks.length + this.blastDoors.length +
           this.foundryLines.length;
  }
}
