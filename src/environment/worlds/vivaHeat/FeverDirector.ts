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
 * Flagship Encounter 1: Grand Mega-Yacht Arrival & Champagne Docking
 * Full 6-Stage Blockbuster Lifecycle:
 * DORMANT → ANTICIPATION → ACTION → CLIMAX → AFTERMATH → COMPLETE
 */
export interface GrandMegaYachtArrivalActor {
  group: THREE.Group;
  yachtMesh: THREE.Group;
  dockingGangway: THREE.Group;
  champagneCannons: THREE.Group[];
  champagneJets: THREE.Mesh[];
  deckStrobes: THREE.Mesh[];
  searchlightL: THREE.Group;
  searchlightR: THREE.Group;
  waterSprayArc: THREE.Mesh;
  triggerZ: number;
  state: 'DORMANT' | 'ANTICIPATION' | 'ACTION' | 'CLIMAX' | 'AFTERMATH' | 'COMPLETE';
  timer: number;
  initialX: number;
  targetX: number;
}

/**
 * Flagship Encounter 2: Colossal Kinetic Flora Awakening & Solar Pulse
 * Full 6-Stage Blockbuster Lifecycle:
 * DORMANT → ANTICIPATION → ACTION → CLIMAX → AFTERMATH → COMPLETE
 */
export interface KineticFloraAwakeningActor {
  group: THREE.Group;
  flowerMesh: THREE.Group;
  outerPetals: THREE.Mesh[];
  innerPetals: THREE.Mesh[];
  stamenCore: THREE.Mesh;
  solarBeamCone: THREE.Mesh;
  groundRunes: THREE.Mesh;
  stemConduits: THREE.Mesh[];
  bloomLevel: number;
  triggerZ: number;
  state: 'DORMANT' | 'ANTICIPATION' | 'ACTION' | 'CLIMAX' | 'AFTERMATH' | 'COMPLETE';
  timer: number;
}

export interface PyrotechnicFlameTowerActor {
  group: THREE.Group;
  flamePlume: THREE.Mesh;
  triggerZ: number;
  phase: number;
  activeTimer: number;
}

export interface FloatingLanternSwarmActor {
  group: THREE.Group;
  lanterns: THREE.Mesh[];
  basePos: THREE.Vector3;
  driftSpeed: number;
}

/**
 * FEVER DIRECTOR
 * Coordinates all cinematic festival encounters, mega-yacht docking sequences,
 * colossal kinetic flora awakenings, theatrical skybeams, and living seaside celebrations.
 *
 * Invariant: Uses signed-distance convention (distanceAhead = playerZ - triggerZ)
 * where negative Z is runner forward travel.
 */
export class FeverDirector {
  private static instance: FeverDirector | null = null;

  // Registered Flagship Cinematic Encounters
  private grandDockings: GrandMegaYachtArrivalActor[] = [];
  private kineticAwakenings: KineticFloraAwakeningActor[] = [];
  private flameTowers: PyrotechnicFlameTowerActor[] = [];
  private lanternSwarms: FloatingLanternSwarmActor[] = [];

  // Ambient Festival Ecosystem
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
  private stateProgress: number = 0;

  private cooldownTimer: number = 0;
  private sparkSpawnTimer: number = 0;
  private frameCounter: number = 0;

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
  public pruneDetached(): void {
    const isAttached = (obj: THREE.Object3D | null | undefined): boolean => {
      if (!obj || !obj.parent) return false;
      let cur: THREE.Object3D = obj;
      while (cur.parent) {
        cur = cur.parent;
      }
      // In live gameplay, all valid rendered objects must be rooted in the active Scene
      if (cur.type === 'Scene') return true;

      // In Node.js / unit tests without an active Scene, check root container attachment
      if (typeof window === 'undefined') {
        return cur !== obj && cur.children.length > 0;
      }

      return false;
    };

    this.grandDockings = this.grandDockings.filter((d) => isAttached(d.group));
    this.kineticAwakenings = this.kineticAwakenings.filter((a) => isAttached(a.group));
    this.flameTowers = this.flameTowers.filter((f) => isAttached(f.group));
    this.lanternSwarms = this.lanternSwarms.filter((l) => isAttached(l.group));

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
    this.grandDockings = [];
    this.kineticAwakenings = [];
    this.flameTowers = [];
    this.lanternSwarms = [];
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
    this.frameCounter = 0;

    for (const spark of this.finaleSparks) {
      spark.active = false;
      spark.mesh.visible = false;
      if (spark.mesh.parent) {
        spark.mesh.parent.remove(spark.mesh);
      }
    }
  }

  // --- Registration API ---

  public registerGrandDocking(actor: GrandMegaYachtArrivalActor): void {
    this.grandDockings.push(actor);
  }

  public registerKineticAwakening(actor: KineticFloraAwakeningActor): void {
    this.kineticAwakenings.push(actor);
  }

  public registerFlameTower(tower: PyrotechnicFlameTowerActor): void {
    this.flameTowers.push(tower);
  }

  public registerLanternSwarm(swarm: FloatingLanternSwarmActor): void {
    this.lanternSwarms.push(swarm);
  }

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

  // --- Inspection & Query API ---

  public getGrandDockings(): GrandMegaYachtArrivalActor[] {
    return this.grandDockings;
  }

  public getKineticAwakenings(): KineticFloraAwakeningActor[] {
    return this.kineticAwakenings;
  }

  public getFlameTowers(): PyrotechnicFlameTowerActor[] {
    return this.flameTowers;
  }

  public getLanternSwarms(): FloatingLanternSwarmActor[] {
    return this.lanternSwarms;
  }

  public getFlowerCount(): number {
    return this.flowers.length;
  }

  public getDancerCount(): number {
    return this.dancers.length;
  }

  public getYachtCount(): number {
    return this.yachts.length;
  }

  public getSkybeamCount(): number {
    return this.skybeams.length;
  }

  public getSunLandmarkCount(): number {
    return this.sunLandmarks.length;
  }

  public getTotalActiveElements(): number {
    return (
      this.flowers.length +
      this.dancers.length +
      this.skybeams.length +
      this.yachts.length +
      this.sunLandmarks.length +
      this.grandDockings.length +
      this.kineticAwakenings.length +
      this.flameTowers.length +
      this.lanternSwarms.length
    );
  }

  public getState(): FeverIntensityState {
    return this.forcedState || this.currentState;
  }

  public setForceState(state: FeverIntensityState | null): void {
    this.forcedState = state;
  }

  public setCleanRunDistance(dist: number): void {
    this.cleanRunDistance = dist;
  }

  public getFinaleSparkPool(): FinaleSpark[] {
    return this.finaleSparks;
  }

  // =========================================================================
  // MAIN UPDATE LOOP
  // =========================================================================

  public update(dt: number, active: boolean = true, playerZ: number = 0): void {
    if (!active) return;
    const delta = Math.min(0.1, Math.max(0.001, dt));
    this.globalTime += delta;
    this.frameCounter++;

    // Prune detached objects on update to prevent memory leaks
    this.pruneDetached();

    // Resolve Intensity State based on progression
    this.updateIntensityState();

    // 1. Gate A: Grand Mega-Yacht Arrival & Champagne Docking
    this.updateGrandDockings(delta, playerZ);

    // 2. Gate B: Colossal Kinetic Flora Awakening & Solar Pulse
    this.updateKineticAwakenings(delta, playerZ);

    // 3. Pyrotechnic Flame Towers
    this.updateFlameTowers(delta, playerZ);

    // 4. Floating Sky Lanterns
    this.updateLanternSwarms(delta);

    // 5. Ambient Living Festival Elements
    this.updateAmbientFestival(delta);
  }

  private updateIntensityState(): void {
    if (this.forcedState) return;

    if (this.cleanRunDistance >= 1000) {
      this.currentState = 'GRAND_FINALE';
    } else if (this.cleanRunDistance >= 650) {
      this.currentState = 'FEVER_MODE';
    } else if (this.cleanRunDistance >= 250) {
      this.currentState = 'HEAT_RISING';
    } else {
      this.currentState = 'ARRIVAL';
    }
  }

  // =========================================================================
  // FLAGSHIP 1 (GATE A): GRAND MEGA-YACHT ARRIVAL & CHAMPAGNE DOCKING
  // =========================================================================

  private updateGrandDockings(dt: number, playerZ: number): void {
    const isReducedMotion = SettingsManager.getInstance().isReducedMotion();

    for (const actor of this.grandDockings) {
      // Signed distance ahead: positive when approaching, zero when aligned, negative after passing
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      // 6-Stage Lifecycle State Machine
      if (actor.state === 'DORMANT' && distanceAhead <= 140.0) {
        actor.state = 'ANTICIPATION';
        actor.timer = 0;
      } else if (actor.state === 'ANTICIPATION' && (distanceAhead <= 75.0 || actor.timer > 3.0)) {
        actor.state = 'ACTION';
        actor.timer = 0;
      } else if (actor.state === 'ACTION' && (distanceAhead <= 25.0 || actor.timer > 2.5)) {
        actor.state = 'CLIMAX';
        actor.timer = 0;
      } else if (actor.state === 'CLIMAX' && (distanceAhead <= -15.0 || actor.timer > 2.0)) {
        actor.state = 'AFTERMATH';
        actor.timer = 0;
      } else if (actor.state === 'AFTERMATH' && distanceAhead <= -45.0) {
        actor.state = 'COMPLETE';
      }

      // Visual Animation Logic per Stage
      if (actor.state === 'DORMANT') {
        actor.yachtMesh.position.x = actor.initialX;
        actor.yachtMesh.position.y = isReducedMotion ? 0 : Math.sin(this.globalTime * 1.2) * 0.3;
        actor.dockingGangway.scale.set(0.1, 1.0, 1.0);
        actor.waterSprayArc.visible = false;
        for (const jet of actor.champagneJets) jet.visible = false;
        for (const strobe of actor.deckStrobes) strobe.visible = false;
      } else if (actor.state === 'ANTICIPATION') {
        // Sweeping searchlights searching the water & accelerating
        const p = Math.min(1.0, actor.timer / 3.0);
        actor.yachtMesh.position.x = THREE.MathUtils.lerp(actor.initialX, actor.initialX - 3.0, p);
        actor.yachtMesh.position.y = isReducedMotion ? 0 : Math.sin(this.globalTime * 1.8) * 0.45;
        actor.searchlightL.rotation.y = Math.sin(this.globalTime * 3.0) * 0.6;
        actor.searchlightR.rotation.y = -Math.sin(this.globalTime * 3.0) * 0.6;
        // Foghorn strobe pulse
        const strobeOn = Math.sin(this.globalTime * 12.0) > 0.2;
        for (const strobe of actor.deckStrobes) strobe.visible = strobeOn;
        actor.waterSprayArc.visible = false;
      } else if (actor.state === 'ACTION') {
        // High-speed sweep alongside track + Champagne waterjets firing
        const p = Math.min(1.0, actor.timer / 2.5);
        actor.yachtMesh.position.x = THREE.MathUtils.lerp(actor.initialX - 3.0, actor.targetX + 2.0, p);
        actor.yachtMesh.position.y = isReducedMotion ? 0 : Math.sin(this.globalTime * 2.5) * 0.5;
        actor.waterSprayArc.visible = true;
        actor.waterSprayArc.scale.set(1.0, 1.0 + Math.sin(this.globalTime * 8.0) * 0.2, 1.0);
        for (const jet of actor.champagneJets) {
          jet.visible = true;
          jet.scale.y = 1.0 + Math.sin(this.globalTime * 10.0) * 0.3;
        }
        for (const strobe of actor.deckStrobes) {
          strobe.visible = Math.sin(this.globalTime * 16.0) > -0.2;
        }
      } else if (actor.state === 'CLIMAX') {
        // Precision docking alignment against pier + pyrotechnic bursts + gangway extend
        const p = Math.min(1.0, actor.timer / 1.5);
        actor.yachtMesh.position.x = THREE.MathUtils.lerp(actor.targetX + 2.0, actor.targetX, p);
        actor.yachtMesh.position.y = isReducedMotion ? 0 : Math.sin(this.globalTime * 0.8) * 0.15;
        actor.dockingGangway.scale.set(THREE.MathUtils.lerp(0.1, 1.0, p), 1.0, 1.0);
        actor.waterSprayArc.visible = true;
        for (const jet of actor.champagneJets) jet.visible = true;
        for (const strobe of actor.deckStrobes) strobe.visible = true;
      } else if (actor.state === 'AFTERMATH') {
        // Securely docked, gentle ambient celebratory glow
        actor.yachtMesh.position.x = actor.targetX;
        actor.yachtMesh.position.y = isReducedMotion ? 0 : Math.sin(this.globalTime * 0.6) * 0.08;
        actor.dockingGangway.scale.set(1.0, 1.0, 1.0);
        actor.waterSprayArc.visible = false;
        for (const jet of actor.champagneJets) jet.visible = Math.sin(this.globalTime * 4.0) > 0.3;
      }
    }
  }

  // =========================================================================
  // FLAGSHIP 2 (GATE B): COLOSSAL KINETIC FLORA AWAKENING & SOLAR PULSE
  // =========================================================================

  private updateKineticAwakenings(dt: number, playerZ: number): void {
    const isReducedMotion = SettingsManager.getInstance().isReducedMotion();

    for (const actor of this.kineticAwakenings) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      // 6-Stage Lifecycle State Machine
      if (actor.state === 'DORMANT' && distanceAhead <= 140.0) {
        actor.state = 'ANTICIPATION';
        actor.timer = 0;
      } else if (actor.state === 'ANTICIPATION' && (distanceAhead <= 75.0 || actor.timer > 3.0)) {
        actor.state = 'ACTION';
        actor.timer = 0;
      } else if (actor.state === 'ACTION' && (distanceAhead <= 25.0 || actor.timer > 2.5)) {
        actor.state = 'CLIMAX';
        actor.timer = 0;
      } else if (actor.state === 'CLIMAX' && (distanceAhead <= -15.0 || actor.timer > 2.0)) {
        actor.state = 'AFTERMATH';
        actor.timer = 0;
      } else if (actor.state === 'AFTERMATH' && distanceAhead <= -45.0) {
        actor.state = 'COMPLETE';
      }

      // Visual Animation Logic per Stage
      if (actor.state === 'DORMANT') {
        actor.bloomLevel = 0.1;
        actor.solarBeamCone.visible = false;
        actor.groundRunes.scale.set(0.6, 0.6, 0.6);
        for (const p of actor.outerPetals) p.rotation.z = 0.15;
        for (const p of actor.innerPetals) p.rotation.z = 0.1;
        for (const c of actor.stemConduits) c.visible = false;
      } else if (actor.state === 'ANTICIPATION') {
        // Conduits pulse with golden light, petals micro-vibrate
        const p = Math.min(1.0, actor.timer / 3.0);
        actor.bloomLevel = THREE.MathUtils.lerp(0.1, 0.3, p);
        actor.groundRunes.scale.set(THREE.MathUtils.lerp(0.6, 1.0, p), THREE.MathUtils.lerp(0.6, 1.0, p), 1.0);
        for (const c of actor.stemConduits) {
          c.visible = Math.sin(this.globalTime * 8.0) > -0.2;
        }
        for (let i = 0; i < actor.outerPetals.length; i++) {
          const petal = actor.outerPetals[i];
          petal.rotation.z = 0.2 + (isReducedMotion ? 0 : Math.sin(this.globalTime * 12.0 + i) * 0.05);
        }
        actor.solarBeamCone.visible = false;
      } else if (actor.state === 'ACTION') {
        // Multi-tiered petals unfold in majestic bloom, stamen ascends
        const p = Math.min(1.0, actor.timer / 2.5);
        actor.bloomLevel = THREE.MathUtils.lerp(0.3, 0.85, p);
        for (let i = 0; i < actor.outerPetals.length; i++) {
          actor.outerPetals[i].rotation.z = THREE.MathUtils.lerp(0.2, 0.95, p);
        }
        for (let i = 0; i < actor.innerPetals.length; i++) {
          actor.innerPetals[i].rotation.z = THREE.MathUtils.lerp(0.1, 0.75, p);
        }
        actor.stamenCore.position.y = THREE.MathUtils.lerp(6.0, 11.5, p);
        actor.solarBeamCone.visible = p > 0.6;
        if (actor.solarBeamCone.visible) {
          actor.solarBeamCone.scale.set(p, p, p);
        }
      } else if (actor.state === 'CLIMAX') {
        // Full bloom, radiant solar beam flash, horizon sun pulse
        const p = Math.min(1.0, actor.timer / 1.5);
        actor.bloomLevel = 1.0;
        actor.solarBeamCone.visible = true;
        actor.solarBeamCone.scale.set(1.2 + Math.sin(this.globalTime * 10.0) * 0.2, 1.5, 1.2 + Math.sin(this.globalTime * 10.0) * 0.2);
        for (const pMesh of actor.outerPetals) pMesh.rotation.z = 1.05;
        for (const pMesh of actor.innerPetals) pMesh.rotation.z = 0.85;
        actor.stamenCore.position.y = 12.0 + (isReducedMotion ? 0 : Math.sin(this.globalTime * 4.0) * 0.4);

        // Synchronized horizon sun corona pulse
        for (const sun of this.sunLandmarks) {
          sun.coronaRing.scale.set(1.25, 1.25, 1.25);
        }
      } else if (actor.state === 'AFTERMATH') {
        // Gentle breathing in full bloom
        actor.bloomLevel = 0.95;
        actor.solarBeamCone.visible = false;
        const breath = isReducedMotion ? 0 : Math.sin(this.globalTime * 2.0) * 0.08;
        for (const pMesh of actor.outerPetals) pMesh.rotation.z = 0.95 + breath;
        for (const pMesh of actor.innerPetals) pMesh.rotation.z = 0.78 + breath;
        actor.stamenCore.position.y = 11.2;
      }
    }
  }

  // =========================================================================
  // PYROTECHNIC FLAME TOWERS
  // =========================================================================

  private updateFlameTowers(dt: number, playerZ: number): void {
    const isReducedMotion = SettingsManager.getInstance().isReducedMotion();
    for (const tower of this.flameTowers) {
      const distanceAhead = playerZ - tower.triggerZ;
      tower.activeTimer += dt;

      // Burst flame plume when runner is within 80m or periodically
      const shouldBurst = !isReducedMotion && ((distanceAhead <= 60.0 && distanceAhead >= -30.0) || Math.sin(this.globalTime * 2.5 + tower.phase) > 0.6);
      tower.flamePlume.visible = shouldBurst;
      if (shouldBurst) {
        tower.flamePlume.scale.set(
          1.0 + Math.sin(this.globalTime * 14.0) * 0.3,
          1.2 + Math.sin(this.globalTime * 18.0) * 0.4,
          1.0 + Math.sin(this.globalTime * 14.0) * 0.3
        );
      }
    }
  }

  // =========================================================================
  // FLOATING SKY LANTERNS
  // =========================================================================

  private updateLanternSwarms(dt: number): void {
    const isReducedMotion = SettingsManager.getInstance().isReducedMotion();
    if (isReducedMotion) return;

    for (const swarm of this.lanternSwarms) {
      for (let i = 0; i < swarm.lanterns.length; i++) {
        const lantern = swarm.lanterns[i];
        lantern.position.y = swarm.basePos.y + Math.sin(this.globalTime * 0.8 + i) * 2.5 + (i * 1.8);
        lantern.position.x = swarm.basePos.x + Math.sin(this.globalTime * 0.5 + i * 1.5) * 3.0;
      }
    }
  }

  // =========================================================================
  // AMBIENT LIVING FESTIVAL ELEMENTS
  // =========================================================================

  private updateAmbientFestival(dt: number): void {
    const isReducedMotion = SettingsManager.getInstance().isReducedMotion();

    // 1. Kinetic Flowers: Smooth Petal Breathing & Golden Stamen
    const flowerIntensity = this.currentState === 'GRAND_FINALE' ? 1.4 : (this.currentState === 'FEVER_MODE' ? 1.2 : 0.8);
    for (const flower of this.flowers) {
      const angle = isReducedMotion ? 0.35 : (Math.sin(this.globalTime * 1.8 * flowerIntensity + flower.phaseOffset) * 0.22 + 0.35);
      for (let i = 0; i < flower.petals.length; i++) {
        flower.petals[i].rotation.z = angle;
      }
      if (!isReducedMotion) {
        flower.stamen.position.y = 3.6 + Math.sin(this.globalTime * 2.5 + flower.phaseOffset) * 0.25;
      }
    }

    // 2. Adult Festival Dancers & Performers
    const dancerSpeed = this.currentState === 'GRAND_FINALE' ? 1.8 : (this.currentState === 'FEVER_MODE' ? 1.4 : 1.0);
    for (const dancer of this.dancers) {
      if (isReducedMotion) continue;
      const t = this.globalTime * dancer.tempo * dancerSpeed + dancer.phaseOffset;
      dancer.group.position.y = dancer.baseY + Math.abs(Math.sin(t * 2.2)) * 0.2;
      if (dancer.torso) dancer.torso.rotation.y = Math.sin(t) * 0.25;
      if (dancer.head) dancer.head.rotation.y = Math.sin(t * 1.2) * 0.18;
      if (dancer.armL) dancer.armL.rotation.z = 0.4 + Math.sin(t * 1.6) * 0.35;
      if (dancer.armR) dancer.armR.rotation.z = -0.4 - Math.sin(t * 1.6) * 0.35;
      if (dancer.dressSwish) dancer.dressSwish.rotation.z = Math.sin(t * 2.0) * 0.15;
    }

    // 3. Theatrical Skybeams: Lissajous & Sinusoidal Tracking
    for (const beam of this.skybeams) {
      if (isReducedMotion) continue;
      const sweep = Math.sin(this.globalTime * beam.sweepSpeed + beam.phaseOffset) * beam.maxAngle;
      if (beam.axis === 'X') {
        beam.group.rotation.x = sweep;
      } else {
        beam.group.rotation.z = sweep;
      }
    }

    // 4. Coastal Luxury Yachts: Ocean Bobbing & Drift
    for (const yacht of this.yachts) {
      if (isReducedMotion) continue;
      yacht.group.position.y = -0.8 + Math.sin(this.globalTime * 1.2 + yacht.bobOffset) * 0.32;
      yacht.group.rotation.z = Math.sin(this.globalTime * 0.9 + yacht.bobOffset) * 0.04;
      yacht.group.position.z += yacht.speed * dt;
      if (yacht.group.position.z > yacht.maxZ) {
        yacht.group.position.z = yacht.minZ;
      }
    }

    // 5. Monumental Scarlet Sun Landmark: Corona Pulse
    for (const sun of this.sunLandmarks) {
      if (isReducedMotion) continue;
      sun.solarSpokes.rotation.z = this.globalTime * 0.12;
      const basePulse = this.currentState === 'GRAND_FINALE' ? 1.15 : 1.0;
      const pulse = basePulse + Math.sin(this.globalTime * 1.5) * 0.06;
      sun.coronaRing.scale.set(pulse, pulse, 1.0);
    }
  }
}
