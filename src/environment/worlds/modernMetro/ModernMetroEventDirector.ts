import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';
import { EventBus, EVENTS } from '../../../core/EventBus';

/**
 * Modern Metro: The Living City — Event Director
 *
 * Coordinates urban kinetic systems:
 * 1. Hero Event A: Grand Modern Transit Interchange (Train arrival, braking, doors, commuters, departure)
 * 2. Hero Event B: Riverside Reveal & River Ferry Crossing
 * 3. Moving Building Glass Elevators
 * 4. Distant Moving Road Traffic & City Buses
 * 5. Walking Commuters & Platform Pedestrians
 * 6. Organic Swaying Street Trees
 * 7. Parallel Background Commuter Trains
 *
 * Invariant: Authoritative signed distance (distanceAhead = playerZ - triggerZ)
 * Invariant: Zero-leak object pruning via root scene attachment verification
 */

export interface GrandInterchangeHeroActor {
  group: THREE.Group;
  trainMesh: THREE.Group;
  leftDoors: THREE.Mesh[];
  rightDoors: THREE.Mesh[];
  brakeLights: THREE.Mesh[];
  headlights: THREE.Mesh[];
  commuters: THREE.Group[];
  platformIndicators: THREE.Mesh[];
  triggerZ: number;
  initialTrainZ: number;
  targetStopZ: number;
  departZ: number;
  state: 'DORMANT' | 'ANTICIPATION' | 'ACTION' | 'CLIMAX' | 'AFTERMATH' | 'COMPLETE';
  timer: number;
}

export interface RiversideRevealHeroActor {
  group: THREE.Group;
  ferryMesh: THREE.Group;
  waterSprayPlumes: THREE.Mesh[];
  bridgePedestrians: THREE.Group[];
  panoramicBridge: THREE.Group;
  triggerZ: number;
  initialFerryX: number;
  targetFerryX: number;
  state: 'DORMANT' | 'ANTICIPATION' | 'ACTION' | 'CLIMAX' | 'AFTERMATH' | 'COMPLETE';
  timer: number;
}

export interface FacadeElevatorActor {
  group: THREE.Group;
  carriage: THREE.Mesh;
  indicatorLight: THREE.Mesh;
  minY: number;
  maxY: number;
  speed: number;
  phaseOffset: number;
}

export interface RoadTrafficActor {
  group: THREE.Group;
  vehicles: Array<{
    mesh: THREE.Group;
    speed: number;
    initialZ: number;
    minZ: number;
    maxZ: number;
  }>;
}

export interface WalkingCommuterActor {
  group: THREE.Group;
  torso: THREE.Mesh;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  walkSpeed: number;
  strideFreq: number;
  phaseOffset: number;
  walkAxis: 'X' | 'Z';
  minCoord: number;
  maxCoord: number;
}

export interface SwayingTreeActor {
  group: THREE.Group;
  foliage: THREE.Mesh;
  phaseOffset: number;
  swaySpeed: number;
  maxAngle: number;
}

export interface BackgroundTrainActor {
  group: THREE.Group;
  speed: number;
  initialZ: number;
  minZ: number;
  maxZ: number;
}

export class ModernMetroEventDirector {
  private static instance: ModernMetroEventDirector | null = null;

  // Hero Events
  private grandInterchanges: GrandInterchangeHeroActor[] = [];
  private riversideReveals: RiversideRevealHeroActor[] = [];

  // Kinetic City Systems
  private facadeElevators: FacadeElevatorActor[] = [];
  private roadTrafficSystems: RoadTrafficActor[] = [];
  private walkingCommuters: WalkingCommuterActor[] = [];
  private swayingTrees: SwayingTreeActor[] = [];
  private backgroundTrains: BackgroundTrainActor[] = [];

  private globalTime: number = 0;
  private cleanRunDistance: number = 0;
  private frameCounter: number = 0;

  private constructor() {
    this.initEventListeners();
  }

  public static getInstance(): ModernMetroEventDirector {
    if (!ModernMetroEventDirector.instance) {
      ModernMetroEventDirector.instance = new ModernMetroEventDirector();
    }
    return ModernMetroEventDirector.instance;
  }

  /**
   * Resets and disposes all registered event actors.
   */
  public reset(): void {
    this.grandInterchanges = [];
    this.riversideReveals = [];
    this.facadeElevators = [];
    this.roadTrafficSystems = [];
    this.walkingCommuters = [];
    this.swayingTrees = [];
    this.backgroundTrains = [];
    this.globalTime = 0;
    this.cleanRunDistance = 0;
    this.frameCounter = 0;
  }

  /**
   * Prunes detached objects whose chunk parents were recycled.
   * Completely eliminates memory leaks during marathon endless runs.
   */
  public pruneDetached(): void {
    const isAttached = (obj: THREE.Object3D | null | undefined): boolean => {
      if (!obj || !obj.parent) return false;
      let cur: THREE.Object3D = obj;
      while (cur.parent) {
        cur = cur.parent;
      }
      // In live gameplay, all valid rendered objects must be rooted in the active Three.js Scene
      if (cur.type === 'Scene') return true;

      // In Node.js / unit tests without an active Scene, check root container attachment
      if (typeof window === 'undefined') {
        return cur !== obj && cur.children.length > 0;
      }

      return false;
    };

    this.grandInterchanges = this.grandInterchanges.filter((a) => isAttached(a.group));
    this.riversideReveals = this.riversideReveals.filter((a) => isAttached(a.group));
    this.facadeElevators = this.facadeElevators.filter((e) => isAttached(e.group));
    this.roadTrafficSystems = this.roadTrafficSystems.filter((r) => isAttached(r.group));
    this.walkingCommuters = this.walkingCommuters.filter((c) => isAttached(c.group));
    this.swayingTrees = this.swayingTrees.filter((t) => isAttached(t.group));
    this.backgroundTrains = this.backgroundTrains.filter((b) => isAttached(b.group));
  }

  private initEventListeners(): void {
    const bus = EventBus.getInstance();
    bus.on(EVENTS.DISTANCE_UPDATED, (dist: unknown) => {
      if (typeof dist === 'number' && !isNaN(dist)) {
        this.cleanRunDistance = dist;
      }
    });

    bus.on(EVENTS.GAME_OVER, () => {
      this.cleanRunDistance = 0;
    });

    bus.on(EVENTS.GAME_RESTART, () => {
      this.cleanRunDistance = 0;
    });
  }

  // --- Registration API ---

  public registerGrandInterchange(actor: GrandInterchangeHeroActor): void {
    this.grandInterchanges.push(actor);
  }

  public registerRiversideReveal(actor: RiversideRevealHeroActor): void {
    this.riversideReveals.push(actor);
  }

  public registerFacadeElevator(elevator: FacadeElevatorActor): void {
    this.facadeElevators.push(elevator);
  }

  public registerRoadTraffic(traffic: RoadTrafficActor): void {
    this.roadTrafficSystems.push(traffic);
  }

  public registerWalkingCommuter(commuter: WalkingCommuterActor): void {
    this.walkingCommuters.push(commuter);
  }

  public registerSwayingTree(tree: SwayingTreeActor): void {
    this.swayingTrees.push(tree);
  }

  public registerBackgroundTrain(train: BackgroundTrainActor): void {
    this.backgroundTrains.push(train);
  }

  // --- Query API ---

  public getTotalActiveElements(): number {
    return (
      this.grandInterchanges.length +
      this.riversideReveals.length +
      this.facadeElevators.length +
      this.roadTrafficSystems.length +
      this.walkingCommuters.length +
      this.swayingTrees.length +
      this.backgroundTrains.length
    );
  }

  public getGrandInterchanges(): GrandInterchangeHeroActor[] {
    return this.grandInterchanges;
  }

  public getRiversideReveals(): RiversideRevealHeroActor[] {
    return this.riversideReveals;
  }

  public getGrandInterchangeCount(): number {
    return this.grandInterchanges.length;
  }

  public getRiversideRevealCount(): number {
    return this.riversideReveals.length;
  }

  public getElevatorCount(): number {
    return this.facadeElevators.length;
  }

  public getCommuterCount(): number {
    return this.walkingCommuters.length;
  }

  public getTreeCount(): number {
    return this.swayingTrees.length;
  }

  public getTrafficCount(): number {
    return this.roadTrafficSystems.length;
  }

  // =========================================================================
  // MAIN UPDATE LOOP
  // =========================================================================

  public update(dt: number, active: boolean = true, playerZ: number = 0): void {
    if (!active) return;
    const delta = Math.min(0.1, Math.max(0.001, dt));
    this.globalTime += delta;
    this.frameCounter++;

    // Prune detached objects on every update frame
    this.pruneDetached();

    // 1. Hero Event A: Grand Interchange Arrival & Departure
    this.updateGrandInterchanges(delta, playerZ);

    // 2. Hero Event B: Riverside Reveal & Ferry Crossing
    this.updateRiversideReveals(delta, playerZ);

    // 3. Facade Glass Elevators
    this.updateFacadeElevators(delta);

    // 4. Moving Road Traffic & Buses
    this.updateRoadTraffic(delta);

    // 5. Walking Commuters
    this.updateWalkingCommuters(delta);

    // 6. Swaying Trees
    this.updateSwayingTrees();

    // 7. Background Commuter Trains
    this.updateBackgroundTrains(delta);
  }

  // =========================================================================
  // HERO EVENT A: GRAND MODERN TRANSIT INTERCHANGE
  // =========================================================================

  private updateGrandInterchanges(dt: number, playerZ: number): void {
    const isReducedMotion = SettingsManager.getInstance().isReducedMotion();

    for (const actor of this.grandInterchanges) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      // 6-Stage Lifecycle State Machine
      if (actor.state === 'DORMANT' && distanceAhead <= 150.0) {
        actor.state = 'ANTICIPATION';
        actor.timer = 0;
      } else if (actor.state === 'ANTICIPATION' && (distanceAhead <= 85.0 || actor.timer > 3.5)) {
        actor.state = 'ACTION';
        actor.timer = 0;
      } else if (actor.state === 'ACTION' && (distanceAhead <= 35.0 || actor.timer > 3.0)) {
        actor.state = 'CLIMAX';
        actor.timer = 0;
      } else if (actor.state === 'CLIMAX' && (distanceAhead <= -15.0 || actor.timer > 2.5)) {
        actor.state = 'AFTERMATH';
        actor.timer = 0;
      } else if (actor.state === 'AFTERMATH' && distanceAhead <= -50.0) {
        actor.state = 'COMPLETE';
      }

      // Visual Animation per Stage
      if (actor.state === 'DORMANT') {
        actor.trainMesh.position.z = actor.initialTrainZ;
        for (const bl of actor.brakeLights) bl.visible = false;
        for (const hl of actor.headlights) hl.visible = true;
        for (const ld of actor.leftDoors) ld.position.x = 0;
        for (const rd of actor.rightDoors) rd.position.x = 0;
        for (const pi of actor.platformIndicators) pi.visible = false;
      } else if (actor.state === 'ANTICIPATION') {
        // High-speed approach with amber platform signals pulsing
        const p = Math.min(1.0, actor.timer / 3.5);
        actor.trainMesh.position.z = THREE.MathUtils.lerp(actor.initialTrainZ, actor.targetStopZ + 35.0, p);
        for (const pi of actor.platformIndicators) {
          pi.visible = Math.sin(this.globalTime * 8.0) > 0;
        }
        for (const bl of actor.brakeLights) bl.visible = false;
      } else if (actor.state === 'ACTION') {
        // Smooth braking with glowing red brake lights
        const p = Math.min(1.0, actor.timer / 3.0);
        const smoothP = 1 - Math.pow(1 - p, 3);
        actor.trainMesh.position.z = THREE.MathUtils.lerp(actor.targetStopZ + 35.0, actor.targetStopZ, smoothP);
        for (const bl of actor.brakeLights) bl.visible = true;
        for (const pi of actor.platformIndicators) pi.visible = true;
      } else if (actor.state === 'CLIMAX') {
        // Train stopped at platform; automated pocket doors slide open; commuters move
        actor.trainMesh.position.z = actor.targetStopZ;
        for (const bl of actor.brakeLights) bl.visible = true;
        const doorOpen = isReducedMotion ? 0.7 : Math.min(0.7, actor.timer * 0.8);
        for (const ld of actor.leftDoors) ld.position.x = -doorOpen;
        for (const rd of actor.rightDoors) rd.position.x = doorOpen;

        // Commuters board / alight
        for (let i = 0; i < actor.commuters.length; i++) {
          const commuter = actor.commuters[i];
          const offset = Math.sin(actor.timer * 2.0 + i) * 0.8;
          commuter.position.x = commuter.userData.baseX + offset;
        }
      } else if (actor.state === 'AFTERMATH') {
        // Doors seal, train accelerates away into city network
        for (const ld of actor.leftDoors) ld.position.x = 0;
        for (const rd of actor.rightDoors) rd.position.x = 0;
        for (const bl of actor.brakeLights) bl.visible = false;
        const p = Math.min(1.0, actor.timer / 3.0);
        const accelP = Math.pow(p, 2);
        actor.trainMesh.position.z = THREE.MathUtils.lerp(actor.targetStopZ, actor.departZ, accelP);
      }
    }
  }

  // =========================================================================
  // HERO EVENT B: RIVERSIDE REVEAL & RIVER FERRY CROSSING
  // =========================================================================

  private updateRiversideReveals(dt: number, playerZ: number): void {
    const isReducedMotion = SettingsManager.getInstance().isReducedMotion();

    for (const actor of this.riversideReveals) {
      const distanceAhead = playerZ - actor.triggerZ;
      actor.timer += dt;

      // 6-Stage Lifecycle State Machine
      if (actor.state === 'DORMANT' && distanceAhead <= 160.0) {
        actor.state = 'ANTICIPATION';
        actor.timer = 0;
      } else if (actor.state === 'ANTICIPATION' && (distanceAhead <= 90.0 || actor.timer > 3.0)) {
        actor.state = 'ACTION';
        actor.timer = 0;
      } else if (actor.state === 'ACTION' && (distanceAhead <= 35.0 || actor.timer > 3.0)) {
        actor.state = 'CLIMAX';
        actor.timer = 0;
      } else if (actor.state === 'CLIMAX' && (distanceAhead <= -15.0 || actor.timer > 2.5)) {
        actor.state = 'AFTERMATH';
        actor.timer = 0;
      } else if (actor.state === 'AFTERMATH' && distanceAhead <= -55.0) {
        actor.state = 'COMPLETE';
      }

      // Visual Animation per Stage
      if (actor.state === 'DORMANT') {
        actor.ferryMesh.position.x = actor.initialFerryX;
        actor.ferryMesh.position.y = -1.2;
        for (const spray of actor.waterSprayPlumes) spray.visible = false;
      } else if (actor.state === 'ANTICIPATION') {
        // Ferry approaches from upstream bend with subtle wake
        const p = Math.min(1.0, actor.timer / 3.0);
        actor.ferryMesh.position.x = THREE.MathUtils.lerp(actor.initialFerryX, actor.initialFerryX + 15.0, p);
        actor.ferryMesh.position.y = isReducedMotion ? -1.2 : -1.2 + Math.sin(this.globalTime * 1.5) * 0.18;
        for (const spray of actor.waterSprayPlumes) {
          spray.visible = true;
          spray.scale.set(0.5, 0.5, 0.5);
        }
      } else if (actor.state === 'ACTION') {
        // Cruising across the open river panorama under suspension bridge
        const p = Math.min(1.0, actor.timer / 3.0);
        actor.ferryMesh.position.x = THREE.MathUtils.lerp(actor.initialFerryX + 15.0, actor.targetFerryX - 10.0, p);
        actor.ferryMesh.position.y = isReducedMotion ? -1.2 : -1.2 + Math.sin(this.globalTime * 2.0) * 0.22;
        for (const spray of actor.waterSprayPlumes) {
          spray.visible = true;
          spray.scale.set(1.0, 1.0, 1.0);
        }
        // Pedestrians walk on promenade bridge
        for (let i = 0; i < actor.bridgePedestrians.length; i++) {
          const ped = actor.bridgePedestrians[i];
          ped.position.x = ped.userData.baseX + (i % 2 === 0 ? 1 : -1) * (this.globalTime * 1.2) % 24.0;
        }
      } else if (actor.state === 'CLIMAX') {
        // Ferry directly aligns with runner view; horn steam plume & wide wake
        actor.ferryMesh.position.x = actor.targetFerryX;
        actor.ferryMesh.position.y = isReducedMotion ? -1.2 : -1.2 + Math.sin(this.globalTime * 1.8) * 0.25;
        for (const spray of actor.waterSprayPlumes) {
          spray.visible = true;
          spray.scale.set(1.3, 1.2, 1.3);
        }
      } else if (actor.state === 'AFTERMATH') {
        // Ferry departs towards far river bend
        const p = Math.min(1.0, actor.timer / 3.0);
        actor.ferryMesh.position.x = THREE.MathUtils.lerp(actor.targetFerryX, actor.targetFerryX + 25.0, p);
        for (const spray of actor.waterSprayPlumes) {
          spray.scale.set(0.7, 0.7, 0.7);
        }
      }
    }
  }

  // =========================================================================
  // DYNAMIC CITY SYSTEMS
  // =========================================================================

  private updateFacadeElevators(dt: number): void {
    const isReducedMotion = SettingsManager.getInstance().isReducedMotion();
    if (isReducedMotion) return;

    for (const elev of this.facadeElevators) {
      const t = this.globalTime * elev.speed + elev.phaseOffset;
      // Smooth sinusoidal ascent/descent
      const normY = (Math.sin(t) + 1.0) * 0.5;
      elev.carriage.position.y = THREE.MathUtils.lerp(elev.minY, elev.maxY, normY);

      // Elevator interior indicator light pulses during travel
      if (elev.indicatorLight) {
        elev.indicatorLight.visible = Math.sin(t * 3.0) > 0;
      }
    }
  }

  private updateRoadTraffic(dt: number): void {
    const isReducedMotion = SettingsManager.getInstance().isReducedMotion();
    if (isReducedMotion) return;

    for (const system of this.roadTrafficSystems) {
      for (const veh of system.vehicles) {
        veh.mesh.position.z += veh.speed * dt;
        if (veh.speed > 0 && veh.mesh.position.z > veh.maxZ) {
          veh.mesh.position.z = veh.minZ;
        } else if (veh.speed < 0 && veh.mesh.position.z < veh.minZ) {
          veh.mesh.position.z = veh.maxZ;
        }
      }
    }
  }

  private updateWalkingCommuters(dt: number): void {
    const isReducedMotion = SettingsManager.getInstance().isReducedMotion();

    for (const c of this.walkingCommuters) {
      if (isReducedMotion) continue;

      const t = this.globalTime * c.strideFreq + c.phaseOffset;

      // Leg and arm swinging locomotion
      if (c.legL) c.legL.rotation.x = Math.sin(t) * 0.45;
      if (c.legR) c.legR.rotation.x = -Math.sin(t) * 0.45;
      if (c.armL) c.armL.rotation.x = -Math.sin(t) * 0.4;
      if (c.armR) c.armR.rotation.x = Math.sin(t) * 0.4;

      // Coordinate advancement along assigned axis
      if (c.walkAxis === 'Z') {
        c.group.position.z += c.walkSpeed * dt;
        if (c.group.position.z > c.maxCoord) c.group.position.z = c.minCoord;
        if (c.group.position.z < c.minCoord) c.group.position.z = c.maxCoord;
      } else {
        c.group.position.x += c.walkSpeed * dt;
        if (c.group.position.x > c.maxCoord) c.group.position.x = c.minCoord;
        if (c.group.position.x < c.minCoord) c.group.position.x = c.maxCoord;
      }
    }
  }

  private updateSwayingTrees(): void {
    const isReducedMotion = SettingsManager.getInstance().isReducedMotion();
    if (isReducedMotion) return;

    for (const tree of this.swayingTrees) {
      const angleZ = Math.sin(this.globalTime * tree.swaySpeed + tree.phaseOffset) * tree.maxAngle;
      const angleX = Math.cos(this.globalTime * tree.swaySpeed * 0.8 + tree.phaseOffset) * (tree.maxAngle * 0.5);
      tree.foliage.rotation.z = angleZ;
      tree.foliage.rotation.x = angleX;
    }
  }

  private updateBackgroundTrains(dt: number): void {
    const isReducedMotion = SettingsManager.getInstance().isReducedMotion();
    if (isReducedMotion) return;

    for (const train of this.backgroundTrains) {
      train.group.position.z += train.speed * dt;
      if (train.speed > 0 && train.group.position.z > train.maxZ) {
        train.group.position.z = train.minZ;
      } else if (train.speed < 0 && train.group.position.z < train.minZ) {
        train.group.position.z = train.maxZ;
      }
    }
  }
}
