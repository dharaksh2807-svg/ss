import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';
import { EventBus, EVENTS } from '../../../core/EventBus';

export type FeverIntensityState = 'ARRIVAL' | 'HEAT_RISING' | 'FEVER_MODE' | 'GRAND_FINALE';

export interface KineticFlower {
  group: THREE.Group;
  petals: THREE.Object3D[];
  stamen: THREE.Mesh;
  phaseOffset: number;
  openAngle: number;
  baseEmissive: THREE.Color;
}

export interface AdultDancer {
  group: THREE.Group;
  torso?: THREE.Object3D;
  head?: THREE.Object3D;
  armL?: THREE.Object3D;
  armR?: THREE.Object3D;
  dressSwish?: THREE.Object3D;
  phaseOffset: number;
  tempo: number;
  baseY: number;
}

export interface SkybeamLight {
  group: THREE.Group;
  beamMesh: THREE.Mesh;
  phaseOffset: number;
  sweepSpeed: number;
  maxAngle: number;
  axis: 'X' | 'Z';
}

export interface CoastalYacht {
  group: THREE.Group;
  speed: number;
  bobOffset: number;
  initialZ: number;
  minZ: number;
  maxZ: number;
}

export interface ScarletSunLandmark {
  group: THREE.Group;
  coreDisc: THREE.Mesh;
  coronaRing: THREE.Mesh;
  solarSpokes: THREE.Group;
  reflectionPath?: THREE.Mesh;
}

export interface FinaleSpark {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

/**
 * FEVER DIRECTOR: Lightweight, deterministic visual spectacle runtime.
 * Reacts dynamically to gameplay progression across 4 intensity states:
 * 1. ARRIVAL: Warm sunset coastal serenity, subtle breathing of kinetic flora.
 * 2. HEAT RISING: Architectural stage lights illuminate, dancer tempo increases.
 * 3. FEVER MODE: Kinetic flower petals expand, golden luminescence, sweeping skybeams.
 * 4. GRAND FINALE: Solar corona pulses, dual converging sea beams, distant celebratory fireworks.
 */
export class FeverDirector {
  private static instance: FeverDirector | null = null;

  private flowers: KineticFlower[] = [];
  private dancers: AdultDancer[] = [];
  private skybeams: SkybeamLight[] = [];
  private yachts: CoastalYacht[] = [];
  private sunLandmarks: ScarletSunLandmark[] = [];
  private finaleSparks: FinaleSpark[] = [];

  private globalTime: number = 0;
  private cleanRunDistance: number = 0;
  private currentState: FeverIntensityState = 'ARRIVAL';
  private forcedState: FeverIntensityState | null = null;
  private stateProgress: number = 0; // 0..1 smooth blend

  private cooldownTimer: number = 0;
  private sparkSpawnTimer: number = 0;

  private constructor() {
    if (typeof window !== 'undefined') {
      (window as any).__FEVER_DIRECTOR__ = this;
    }
    this.initEventListeners();
    this.initSparkPool();
  }

  public static getInstance(): FeverDirector {
    if (!this.instance) {
      this.instance = new FeverDirector();
    }
    return this.instance;
  }

  /**
   * Prunes detached objects whose chunk parents were recycled.
   * Completely prevents memory leaks during infinite runs.
   */
  private pruneDetached(): void {
    const isAttached = (obj: THREE.Object3D | null | undefined): boolean => !!(obj && obj.parent);
    this.flowers = this.flowers.filter((f) => isAttached(f.group));
    this.dancers = this.dancers.filter((d) => isAttached(d.group));
    this.skybeams = this.skybeams.filter((b) => isAttached(b.group));
    this.yachts = this.yachts.filter((y) => isAttached(y.group));
    this.sunLandmarks = this.sunLandmarks.filter((s) => isAttached(s.group));
  }

  private initEventListeners(): void {
    const bus = EventBus.getInstance();
    bus.on(EVENTS.DISTANCE_UPDATED, (dist: unknown) => {
      if (typeof dist === 'number' && !isNaN(dist)) {
        this.cleanRunDistance = dist;
      }
    });

    bus.on(EVENTS.GAME_OVER, () => {
      // Cooldown reset on crash
      this.cooldownTimer = 8.0;
      this.cleanRunDistance = 0;
    });

    bus.on(EVENTS.GAME_RESTART, () => {
      this.cleanRunDistance = 0;
      this.cooldownTimer = 0;
      this.currentState = 'ARRIVAL';
    });
  }

  private initSparkPool(): void {
    this.finaleSparks = [];
    const sparkGeo = new THREE.SphereGeometry(0.5, 6, 6);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0 });

    for (let i = 0; i < 16; i++) {
      const mesh = new THREE.Mesh(sparkGeo, sparkMat.clone());
      mesh.visible = false;
      this.finaleSparks.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1.5,
        active: false
      });
    }
  }

  public reset(): void {
    this.flowers = [];
    this.dancers = [];
    this.skybeams = [];
    this.yachts = [];
    this.sunLandmarks = [];
    this.globalTime = 0;
    this.cleanRunDistance = 0;
    this.currentState = 'ARRIVAL';
    this.forcedState = null;
    this.cooldownTimer = 0;
    this.sparkSpawnTimer = 0;

    for (const spark of this.finaleSparks) {
      spark.active = false;
      spark.mesh.visible = false;
      if (spark.mesh.parent) {
        spark.mesh.parent.remove(spark.mesh);
      }
    }
  }

  // --- Registration API ---

  public registerKineticFlower(flower: KineticFlower): void {
    this.flowers.push(flower);
  }

  public registerAdultDancer(dancer: AdultDancer): void {
    this.dancers.push(dancer);
  }

  public registerSkybeam(beam: SkybeamLight): void {
    this.skybeams.push(beam);
  }

  public registerCoastalYacht(yacht: CoastalYacht): void {
    this.yachts.push(yacht);
  }

  public registerScarletSun(sun: ScarletSunLandmark): void {
    this.sunLandmarks.push(sun);
  }

  public getFinaleSparkPool(): FinaleSpark[] {
    return this.finaleSparks;
  }

  // --- State Accessors & Control ---

  public getState(): FeverIntensityState {
    return this.forcedState || this.currentState;
  }

  public setForceState(state: FeverIntensityState | null): void {
    this.forcedState = state;
  }

  public getCleanRunDistance(): number {
    return this.cleanRunDistance;
  }

  public setCleanRunDistance(dist: number): void {
    this.cleanRunDistance = dist;
  }

  public getFlowerCount(): number {
    return this.flowers.length;
  }

  public getDancerCount(): number {
    return this.dancers.length;
  }

  public getSkybeamCount(): number {
    return this.skybeams.length;
  }

  public getYachtCount(): number {
    return this.yachts.length;
  }

  public getSunLandmarkCount(): number {
    return this.sunLandmarks.length;
  }

  public getTotalActiveElements(): number {
    return this.flowers.length + this.dancers.length + this.skybeams.length +
           this.yachts.length + this.sunLandmarks.length;
  }

  // --- Main Per-Frame Update Loop ---

  public update(delta: number, isCurrentTheme: boolean = true): void {
    if (!isCurrentTheme) return;

    this.pruneDetached();

    const dt = Math.min(delta, 0.1);
    this.globalTime += dt;

    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
    }

    // Determine State from Progression
    const previousState = this.currentState;
    if (!this.forcedState) {
      if (this.cooldownTimer > 0) {
        this.currentState = 'ARRIVAL';
      } else if (this.cleanRunDistance >= 900) {
        this.currentState = 'GRAND_FINALE';
      } else if (this.cleanRunDistance >= 500) {
        this.currentState = 'FEVER_MODE';
      } else if (this.cleanRunDistance >= 200) {
        this.currentState = 'HEAT_RISING';
      } else {
        this.currentState = 'ARRIVAL';
      }
    }

    if (this.currentState !== previousState) {
      this.stateProgress = 0.0;
    }
    this.stateProgress = Math.min(1.0, this.stateProgress + dt * 1.5);

    const state = this.getState();
    const reducedMotion = SettingsManager.getInstance().isReducedMotion();
    const speedMult = reducedMotion ? 0.2 : 1.0;

    // Intensity Multipliers
    let tempoMultiplier = 1.0;
    let petalAmplitude = 0.08;
    let beamIntensity = 0.2;
    let haloPulseSpeed = 1.0;

    switch (state) {
      case 'HEAT_RISING':
        tempoMultiplier = 1.35;
        petalAmplitude = 0.18;
        beamIntensity = 0.55;
        haloPulseSpeed = 1.4;
        break;
      case 'FEVER_MODE':
        tempoMultiplier = 1.70;
        petalAmplitude = 0.38;
        beamIntensity = 0.85;
        haloPulseSpeed = 2.0;
        break;
      case 'GRAND_FINALE':
        tempoMultiplier = 2.10;
        petalAmplitude = 0.55;
        beamIntensity = 1.00;
        haloPulseSpeed = 2.8;
        break;
      case 'ARRIVAL':
      default:
        tempoMultiplier = 1.0;
        petalAmplitude = 0.08;
        beamIntensity = 0.2;
        haloPulseSpeed = 1.0;
        break;
    }

    // 1. Update Kinetic Floral Sculptures (Petal breathing & golden stamen luminescence)
    for (const f of this.flowers) {
      const breath = Math.sin(this.globalTime * 2.2 * speedMult + f.phaseOffset) * petalAmplitude;
      const targetOpening = f.openAngle + breath;

      for (let i = 0; i < f.petals.length; i++) {
        const petal = f.petals[i];
        const petalDir = (i % 2 === 0 ? 1 : -1);
        petal.rotation.z = petalDir * targetOpening;
        petal.rotation.x = Math.cos(this.globalTime * 1.5 * speedMult + f.phaseOffset + i) * 0.05 * speedMult;
      }

      // Stamen glowing orbs intensity
      if (f.stamen.material instanceof THREE.MeshStandardMaterial) {
        const emissivePulse = 0.6 + Math.sin(this.globalTime * 3.0 * speedMult + f.phaseOffset) * 0.3 * (beamIntensity + 0.2);
        f.stamen.material.emissiveIntensity = emissivePulse;
      }
    }

    // 2. Update Adult Dancers (Latin/Tango choreo: hip sway, arm elevation, head snap)
    for (const d of this.dancers) {
      const beat = (this.globalTime * d.tempo * tempoMultiplier * speedMult + d.phaseOffset);
      const sway = Math.sin(beat);
      const bounce = Math.abs(Math.cos(beat)) * 0.12 * (reducedMotion ? 0.3 : 1.0);

      d.group.position.y = d.baseY + bounce;

      if (d.torso) {
        d.torso.rotation.y = sway * 0.22;
        d.torso.rotation.z = Math.cos(beat) * 0.08;
      }

      if (d.head) {
        d.head.rotation.y = -sway * 0.18;
        d.head.rotation.x = Math.sin(beat * 2.0) * 0.06;
      }

      if (d.armL) {
        d.armL.rotation.z = 0.5 + Math.sin(beat) * 0.35;
        d.armL.rotation.x = Math.cos(beat) * 0.25;
      }

      if (d.armR) {
        d.armR.rotation.z = -0.5 - Math.sin(beat + Math.PI * 0.5) * 0.35;
        d.armR.rotation.x = -Math.cos(beat) * 0.25;
      }

      if (d.dressSwish) {
        d.dressSwish.rotation.z = -sway * 0.15;
      }
    }

    // 3. Update Skybeams & Theatrical Spotlights
    for (const b of this.skybeams) {
      if (state === 'ARRIVAL') {
        b.beamMesh.visible = false;
        continue;
      }
      b.beamMesh.visible = true;

      const sweep = Math.sin(this.globalTime * b.sweepSpeed * speedMult + b.phaseOffset) * b.maxAngle;
      if (b.axis === 'X') {
        b.group.rotation.x = sweep;
      } else {
        b.group.rotation.z = sweep;
      }

      if (b.beamMesh.material instanceof THREE.MeshBasicMaterial) {
        b.beamMesh.material.opacity = beamIntensity * (0.6 + Math.sin(this.globalTime * 4.0 + b.phaseOffset) * 0.2);
      }
    }

    // 4. Update Luxury Coastal Yachts (Ocean bobbing, pitching, and gentle drift)
    for (const y of this.yachts) {
      const wave = this.globalTime * 1.4 * speedMult + y.bobOffset;
      y.group.position.y = Math.sin(wave) * 0.45;
      y.group.rotation.z = Math.sin(wave * 0.8) * 0.045; // Roll
      y.group.rotation.x = Math.cos(wave * 0.6) * 0.035; // Pitch

      // Slow coastal cruising drift
      y.group.position.z += y.speed * dt * speedMult;
      if (y.group.position.z > y.maxZ) {
        y.group.position.z = y.minZ;
      }
    }

    // 5. Update Scarlet Sun Landmark (Majestic rotating solar corona & pulsating halo)
    for (const s of this.sunLandmarks) {
      if (s.solarSpokes) {
        s.solarSpokes.rotation.z += 0.08 * dt * speedMult;
      }

      if (s.coronaRing && s.coronaRing.material instanceof THREE.MeshBasicMaterial) {
        const pulse = 1.0 + Math.sin(this.globalTime * haloPulseSpeed * speedMult) * 0.12 * beamIntensity;
        s.coronaRing.scale.set(pulse, pulse, 1.0);
      }
    }

    // 6. Grand Finale Spark / Celebration Flare Effects (Only during Grand Finale, reduced motion safe)
    if (state === 'GRAND_FINALE' && !reducedMotion) {
      this.sparkSpawnTimer += dt;
      if (this.sparkSpawnTimer >= 0.35) {
        this.sparkSpawnTimer = 0;
        this.spawnFinaleSpark();
      }
    }

    // Tick active sparks
    for (const spark of this.finaleSparks) {
      if (!spark.active) continue;

      spark.life += dt;
      if (spark.life >= spark.maxLife) {
        spark.active = false;
        spark.mesh.visible = false;
        continue;
      }

      spark.mesh.position.addScaledVector(spark.velocity, dt);
      spark.velocity.y -= 9.8 * 0.5 * dt; // Gravity
      const progress = spark.life / spark.maxLife;

      if (spark.mesh.material instanceof THREE.MeshBasicMaterial) {
        spark.mesh.material.opacity = Math.max(0, (1 - progress) * 0.9);
      }
      const scale = (1 - progress * 0.5);
      spark.mesh.scale.set(scale, scale, scale);
    }
  }

  private spawnFinaleSpark(): void {
    const inactive = this.finaleSparks.find((s) => !s.active);
    if (!inactive || this.sunLandmarks.length === 0) return;

    const sun = this.sunLandmarks[0].group;
    if (!sun.parent) return;

    if (!inactive.mesh.parent) {
      sun.parent.add(inactive.mesh);
    }

    // Spawn above distant ocean horizon near sun
    const angle = Math.random() * Math.PI * 2;
    const radius = 25.0 + Math.random() * 40.0;
    inactive.mesh.position.set(
      sun.position.x + Math.cos(angle) * radius,
      sun.position.y + 15.0 + Math.random() * 25.0,
      sun.position.z + 20.0
    );

    const speed = 12.0 + Math.random() * 15.0;
    inactive.velocity.set(
      Math.cos(angle) * speed * 0.4,
      Math.sin(angle) * speed * 0.7 + 6.0,
      (Math.random() - 0.5) * 5.0
    );

    inactive.life = 0;
    inactive.maxLife = 1.2 + Math.random() * 0.6;
    inactive.active = true;
    inactive.mesh.visible = true;

    if (inactive.mesh.material instanceof THREE.MeshBasicMaterial) {
      const colors = [0xff2d55, 0xf59e0b, 0xfbbf24, 0xf43f5e, 0xffffff];
      inactive.mesh.material.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
      inactive.mesh.material.opacity = 0.9;
    }
  }
}
