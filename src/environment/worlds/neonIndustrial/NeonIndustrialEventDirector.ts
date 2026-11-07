import * as THREE from 'three';
import { EventBus } from '../../../core/EventBus';
import {
  CraneBalletHeroActor,
  FactoryAwakeningHeroActor,
  TraversingCraneActor,
  WeldingRobotActor,
  StampingPressActor,
  ForkliftActor,
  ConveyorBeltActor,
  SteamChimneyActor,
  DieselSwitcherActor,
  NEON_INDUSTRIAL_PALETTE
} from './NeonIndustrialTheme';

/**
 * Neon Industrial Event Director:
 * Manages 6-stage lifecycles for Hero Events (Crane Ballet & Factory Awakening),
 * traversing rail-mounted gantry cranes, robotic welding arms with spark emissions,
 * hydraulic stamping presses, forklifts, motorized cargo conveyors, steam exhaust stacks,
 * and background freight diesel switchers.
 */
export class NeonIndustrialEventDirector {
  private static instance: NeonIndustrialEventDirector;

  private craneBallets: CraneBalletHeroActor[] = [];
  private factoryAwakenings: FactoryAwakeningHeroActor[] = [];
  private traversingCranes: TraversingCraneActor[] = [];
  private weldingRobots: WeldingRobotActor[] = [];
  private stampingPresses: StampingPressActor[] = [];
  private forklifts: ForkliftActor[] = [];
  private conveyors: ConveyorBeltActor[] = [];
  private steamChimneys: SteamChimneyActor[] = [];
  private dieselSwitchers: DieselSwitcherActor[] = [];

  private globalTime: number = 0;

  private constructor() {
    this.initEventListeners();
    if (typeof window !== 'undefined') {
      (window as any).__INDUSTRIAL_DIRECTOR__ = this;
    }
  }

  public static getInstance(): NeonIndustrialEventDirector {
    if (!NeonIndustrialEventDirector.instance) {
      NeonIndustrialEventDirector.instance = new NeonIndustrialEventDirector();
    }
    return NeonIndustrialEventDirector.instance;
  }

  // --- Registration API ---

  public registerCraneBallet(actor: CraneBalletHeroActor): void {
    this.craneBallets.push(actor);
  }

  public registerFactoryAwakening(actor: FactoryAwakeningHeroActor): void {
    this.factoryAwakenings.push(actor);
  }

  public registerTraversingCrane(crane: TraversingCraneActor): void {
    this.traversingCranes.push(crane);
  }

  public registerWeldingRobot(robot: WeldingRobotActor): void {
    this.weldingRobots.push(robot);
  }

  public registerStampingPress(press: StampingPressActor): void {
    this.stampingPresses.push(press);
  }

  public registerForklift(forklift: ForkliftActor): void {
    this.forklifts.push(forklift);
  }

  public registerConveyor(conveyor: ConveyorBeltActor): void {
    this.conveyors.push(conveyor);
  }

  public registerSteamChimney(chimney: SteamChimneyActor): void {
    this.steamChimneys.push(chimney);
  }

  public registerDieselSwitcher(switcher: DieselSwitcherActor): void {
    this.dieselSwitchers.push(switcher);
  }

  // --- Diagnostics & Verifications API ---

  public getCraneBallets(): CraneBalletHeroActor[] {
    return this.craneBallets;
  }

  public getFactoryAwakenings(): FactoryAwakeningHeroActor[] {
    return this.factoryAwakenings;
  }

  public getTotalActiveElements(): number {
    return (
      this.craneBallets.length +
      this.factoryAwakenings.length +
      this.traversingCranes.length +
      this.weldingRobots.length +
      this.stampingPresses.length +
      this.forklifts.length +
      this.conveyors.length +
      this.steamChimneys.length +
      this.dieselSwitchers.length
    );
  }

  public getCraneCount(): number {
    return this.traversingCranes.length + this.craneBallets.length * 2;
  }

  public getWelderCount(): number {
    return this.weldingRobots.length;
  }

  public getPressCount(): number {
    return this.stampingPresses.length;
  }

  public getForkliftCount(): number {
    return this.forklifts.length;
  }

  public getConveyorCount(): number {
    return this.conveyors.length;
  }

  public getSteamCount(): number {
    return this.steamChimneys.length;
  }

  public getSwitcherCount(): number {
    return this.dieselSwitchers.length;
  }

  public reset(): void {
    this.craneBallets = [];
    this.factoryAwakenings = [];
    this.traversingCranes = [];
    this.weldingRobots = [];
    this.stampingPresses = [];
    this.forklifts = [];
    this.conveyors = [];
    this.steamChimneys = [];
    this.dieselSwitchers = [];
    this.globalTime = 0;
  }

  /**
   * Scene-rooted detachment cleaner:
   * Prunes actors whose parent chunk has been recycled or detached.
   */
  public pruneDetached(): void {
    const isAttached = (obj: THREE.Object3D | null | undefined): boolean => {
      if (!obj || !obj.parent) return false;
      let cur: THREE.Object3D = obj;
      while (cur.parent) {
        cur = cur.parent;
      }
      return cur.type === 'Scene';
    };

    this.craneBallets = this.craneBallets.filter((a) => isAttached(a.group));
    this.factoryAwakenings = this.factoryAwakenings.filter((a) => isAttached(a.group));
    this.traversingCranes = this.traversingCranes.filter((c) => isAttached(c.group));
    this.weldingRobots = this.weldingRobots.filter((r) => isAttached(r.group));
    this.stampingPresses = this.stampingPresses.filter((p) => isAttached(p.group));
    this.forklifts = this.forklifts.filter((f) => isAttached(f.group));
    this.conveyors = this.conveyors.filter((c) => isAttached(c.group));
    this.steamChimneys = this.steamChimneys.filter((s) => isAttached(s.group));
    this.dieselSwitchers = this.dieselSwitchers.filter((d) => isAttached(d.group));
  }

  private initEventListeners(): void {
    const bus = EventBus.getInstance();
    bus.on('GAME_RESTART', () => {
      this.reset();
    });

    bus.on('PLAYER_REVIVE', () => {
      // Re-arm dormant states without wiping existing geometry
      for (const a of this.craneBallets) {
        if (a.state === 'COMPLETE') a.state = 'DORMANT';
      }
      for (const a of this.factoryAwakenings) {
        if (a.state === 'COMPLETE') a.state = 'DORMANT';
      }
    });

    bus.on('TRACK_RECYCLED', () => {
      this.pruneDetached();
    });
  }

  /**
   * Frame-by-frame simulation update loop:
   * Updates hero event lifecycles and all ambient kinetic machinery.
   */
  public update(dt: number, isActiveTheme: boolean = true, playerZ: number = 0): void {
    if (!isActiveTheme || dt <= 0) return;

    this.globalTime += dt;

    this.updateCraneBallets(dt, playerZ);
    this.updateFactoryAwakenings(dt, playerZ);
    this.updateTraversingCranes(dt);
    this.updateWeldingRobots(dt);
    this.updateStampingPresses(dt);
    this.updateForklifts(dt);
    this.updateConveyors(dt);
    this.updateSteamChimneys(dt);
    this.updateDieselSwitchers(dt);
  }

  // =========================================================================
  // HERO EVENT A: CRANE BALLET
  // =========================================================================

  private updateCraneBallets(dt: number, playerZ: number): void {
    for (const actor of this.craneBallets) {
      const distAhead = playerZ - actor.triggerZ; // Positive when approaching negative-Z trigger

      switch (actor.state) {
        case 'DORMANT': {
          // Trigger when player is within 140m ahead
          if (distAhead <= 140 && distAhead >= -30) {
            actor.state = 'ANTICIPATION';
            actor.timer = 0;
          }
          break;
        }

        case 'ANTICIPATION': {
          actor.timer += dt;
          // Warning strobes blink rapidly (period 0.16s)
          const strobeVisible = Math.floor(actor.timer / 0.08) % 2 === 0;
          actor.crane1.warningStrobes.forEach((s) => (s.visible = strobeVisible));
          actor.crane2.warningStrobes.forEach((s) => (s.visible = !strobeVisible));

          // Crane 1 trolley aligns subtly over container
          actor.crane1.trolley.position.x = actor.trolleyStartPos;

          if (actor.timer >= 1.2) {
            actor.state = 'ACTION';
            actor.timer = 0;
          }
          break;
        }

        case 'ACTION': {
          actor.timer += dt;
          const t = Math.min(actor.timer / 2.0, 1.0);

          // Phase 1: Spreader lowers down to container (0s -> 0.8s)
          if (t < 0.4) {
            const lowerProgress = t / 0.4;
            actor.crane1.spreader.position.y = THREE.MathUtils.lerp(
              actor.targetLiftY,
              actor.initialContainerY + 1.3,
              lowerProgress
            );
          } else {
            // Container is attached directly to spreader frame hierarchy
            if (actor.crane1.container.parent !== actor.crane1.spreader) {
              actor.crane1.spreader.add(actor.crane1.container);
              actor.crane1.container.position.set(0, -1.3, 0);
              actor.crane1.container.rotation.set(0, 0, 0);
            }

            // Phase 2: Spreader lifts container into the air (0.4s -> 1.0s)
            const liftProgress = (t - 0.4) / 0.6;
            actor.crane1.spreader.position.y = THREE.MathUtils.lerp(
              actor.initialContainerY + 1.3,
              actor.targetLiftY,
              liftProgress
            );

            // Crane 2 hoist performs secondary lift in parallel
            actor.crane2.spreader.position.y = THREE.MathUtils.lerp(
              actor.initialContainerY + 1.3,
              actor.targetLiftY - 1.0,
              liftProgress * 0.8
            );
          }

          // Update hoist cables length and position to match spreader Y
          this.updateCraneCables(actor.crane1.cables, actor.crane1.spreader.position.y);
          this.updateCraneCables(actor.crane2.cables, actor.crane2.spreader.position.y);

          // Strobe lights maintain alternating flash
          const strobeVisible = Math.floor(actor.timer / 0.12) % 2 === 0;
          actor.crane1.warningStrobes.forEach((s) => (s.visible = strobeVisible));
          actor.crane2.warningStrobes.forEach((s) => (s.visible = !strobeVisible));

          if (actor.timer >= 2.0) {
            actor.state = 'CLIMAX';
            actor.timer = 0;
          }
          break;
        }

        case 'CLIMAX': {
          actor.timer += dt;
          const t = Math.min(actor.timer / 2.5, 1.0);
          const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

          // Crane 1 trolley traverses across girder carrying container smoothly
          actor.crane1.trolley.position.x = THREE.MathUtils.lerp(
            actor.trolleyStartPos,
            actor.trolleyTargetPos,
            ease
          );

          // Crane 2 trolley executes synchronized counter-traverse
          actor.crane2.trolley.position.x = THREE.MathUtils.lerp(
            -actor.trolleyStartPos,
            -actor.trolleyTargetPos,
            ease * 0.85
          );

          // Update cables
          this.updateCraneCables(actor.crane1.cables, actor.crane1.spreader.position.y);
          this.updateCraneCables(actor.crane2.cables, actor.crane2.spreader.position.y);

          // Strobe lights
          const strobeVisible = Math.floor(actor.timer / 0.15) % 2 === 0;
          actor.crane1.warningStrobes.forEach((s) => (s.visible = strobeVisible));
          actor.crane2.warningStrobes.forEach((s) => (s.visible = strobeVisible));

          if (actor.timer >= 2.5) {
            actor.state = 'AFTERMATH';
            actor.timer = 0;
          }
          break;
        }

        case 'AFTERMATH': {
          actor.timer += dt;
          const t = Math.min(actor.timer / 2.0, 1.0);

          // Lower container gently into flatcar lock guide position
          const lowerProgress = Math.min(t / 0.7, 1.0);
          actor.crane1.spreader.position.y = THREE.MathUtils.lerp(
            actor.targetLiftY,
            actor.initialContainerY + 1.4,
            lowerProgress
          );

          this.updateCraneCables(actor.crane1.cables, actor.crane1.spreader.position.y);

          // Strobes settle into slow resting flash
          const strobeVisible = Math.floor(actor.timer / 0.4) % 2 === 0;
          actor.crane1.warningStrobes.forEach((s) => (s.visible = strobeVisible));
          actor.crane2.warningStrobes.forEach((s) => (s.visible = strobeVisible));

          if (actor.timer >= 2.0) {
            actor.state = 'COMPLETE';
          }
          break;
        }

        case 'COMPLETE': {
          // Parked safely, warning strobes solid on
          actor.crane1.warningStrobes.forEach((s) => (s.visible = true));
          actor.crane2.warningStrobes.forEach((s) => (s.visible = true));
          break;
        }
      }
    }
  }

  private updateCraneCables(cables: THREE.Mesh[], spreaderY: number): void {
    const girderY = 12.0; // Top of gantry crane girder
    const cableLength = Math.max(0.5, girderY - spreaderY);
    for (const cable of cables) {
      cable.scale.y = cableLength;
      cable.position.y = girderY - cableLength * 0.5;
    }
  }

  // =========================================================================
  // HERO EVENT B: FACTORY AWAKENING
  // =========================================================================

  private updateFactoryAwakenings(dt: number, playerZ: number): void {
    for (const actor of this.factoryAwakenings) {
      const distAhead = playerZ - actor.triggerZ;

      switch (actor.state) {
        case 'DORMANT': {
          if (distAhead <= 150 && distAhead >= -30) {
            actor.state = 'ANTICIPATION';
            actor.timer = 0;
            actor.powerLevel = 0.1;
          }
          break;
        }

        case 'ANTICIPATION': {
          actor.timer += dt;
          // Sequential high-bay sodium vapor floodlight strike
          const progress = Math.min(actor.timer / 1.5, 1.0);
          actor.powerLevel = 0.1 + progress * 0.9;

          const activeCount = Math.floor(progress * actor.floodlights.length);
          for (let i = 0; i < actor.floodlights.length; i++) {
            if (i <= activeCount && !actor.floodlights[i].active) {
              actor.floodlights[i].active = true;
              actor.floodlights[i].mesh.visible = true;
              const mat = actor.floodlights[i].mesh.material as THREE.MeshBasicMaterial;
              if (mat && mat.color) {
                mat.color.setHex(NEON_INDUSTRIAL_PALETTE.sodiumLamp);
              }
            }
          }

          if (actor.timer >= 1.5) {
            actor.state = 'ACTION';
            actor.timer = 0;
          }
          break;
        }

        case 'ACTION': {
          actor.timer += dt;

          // Steam safety valves open and exhaust vertical plumes
          for (const puffer of actor.steamPuffers) {
            const plumeScale = Math.min(actor.timer * 2.5, 3.5);
            puffer.mesh.scale.set(1.0 + plumeScale * 0.3, plumeScale, 1.0 + plumeScale * 0.3);
            puffer.mesh.position.y = puffer.initialY + plumeScale * 1.2;
            puffer.mesh.visible = true;
          }

          // Hydraulic presses begin rhythmic reciprocating strokes
          for (let p = 0; p < actor.stampingPresses.length; p++) {
            const press = actor.stampingPresses[p];
            const pressCycle = Math.sin(actor.timer * 7.0 + p * 1.5);
            press.ram.position.y = press.baseY - Math.max(0, pressCycle) * press.stroke;
          }

          // Welding robots strike electric arcs with spark bursts
          for (let r = 0; r < actor.weldingRobots.length; r++) {
            const robot = actor.weldingRobots[r];
            robot.active = true;
            robot.sparks.visible = Math.sin(actor.timer * 12.0 + r) > -0.2;
            robot.arm.rotation.y = Math.sin(actor.timer * 3.0 + r) * 0.35;
          }

          if (actor.timer >= 2.0) {
            actor.state = 'CLIMAX';
            actor.timer = 0;
          }
          break;
        }

        case 'CLIMAX': {
          actor.timer += dt;

          // Presses & welders continue full operational speed
          for (let p = 0; p < actor.stampingPresses.length; p++) {
            const press = actor.stampingPresses[p];
            const pressCycle = Math.sin((actor.timer + 2.0) * 7.0 + p * 1.5);
            press.ram.position.y = press.baseY - Math.max(0, pressCycle) * press.stroke;
          }
          for (let r = 0; r < actor.weldingRobots.length; r++) {
            const robot = actor.weldingRobots[r];
            robot.sparks.visible = Math.sin(actor.timer * 14.0 + r) > -0.1;
            robot.arm.rotation.y = Math.sin(actor.timer * 4.0 + r) * 0.4;
          }

          // Conveyor belt drives parts crates along
          const crateTravel = (actor.timer * 4.0) % 24.0;
          for (let c = 0; c < actor.conveyor.crates.length; c++) {
            const crate = actor.conveyor.crates[c];
            crate.position.z = -12.0 + ((c * 4.0 + crateTravel) % 24.0);
          }

          // Freight diesel locomotive revs up and starts rolling forward along siding
          actor.locomotive.headlights.forEach((h) => (h.visible = true));
          const locoAccel = Math.min(actor.timer / 3.0, 1.0);
          const currentSpeed = actor.locomotive.speed * locoAccel;
          actor.locomotive.currentZ -= currentSpeed * dt;
          actor.locomotive.trainGroup.position.z = actor.locomotive.currentZ;

          // Exhaust stack puffs
          const exhaustPulse = 1.0 + Math.sin(actor.timer * 10.0) * 0.3;
          actor.locomotive.exhaustStack.scale.set(exhaustPulse, exhaustPulse * 1.5, exhaustPulse);

          if (actor.timer >= 3.0) {
            actor.state = 'AFTERMATH';
            actor.timer = 0;
          }
          break;
        }

        case 'AFTERMATH': {
          actor.timer += dt;

          // Locomotive cruises smoothly past at steady speed
          actor.locomotive.currentZ -= actor.locomotive.speed * dt;
          actor.locomotive.trainGroup.position.z = actor.locomotive.currentZ;

          // Maintain plant active machinery
          for (let p = 0; p < actor.stampingPresses.length; p++) {
            const press = actor.stampingPresses[p];
            const pressCycle = Math.sin((actor.timer + 5.0) * 7.0 + p * 1.5);
            press.ram.position.y = press.baseY - Math.max(0, pressCycle) * press.stroke;
          }
          for (let r = 0; r < actor.weldingRobots.length; r++) {
            const robot = actor.weldingRobots[r];
            robot.sparks.visible = Math.sin(actor.timer * 10.0 + r) > 0.0;
          }

          if (actor.timer >= 6.0) {
            actor.state = 'COMPLETE';
          }
          break;
        }

        case 'COMPLETE': {
          // Keep locomotive rolling forward outside active view
          actor.locomotive.currentZ -= actor.locomotive.speed * dt;
          actor.locomotive.trainGroup.position.z = actor.locomotive.currentZ;
          break;
        }
      }
    }
  }

  // =========================================================================
  // AMBIENT MACHINERY UPDATES
  // =========================================================================

  private updateTraversingCranes(dt: number): void {
    for (const crane of this.traversingCranes) {
      crane.phase += dt * crane.speed;
      const t = (Math.sin(crane.phase) + 1.0) * 0.5;
      crane.trolley.position.x = THREE.MathUtils.lerp(crane.minX, crane.maxX, t);

      // Subtle hoist sway
      const hoistY = 9.0 + Math.sin(crane.phase * 1.5) * 1.2;
      crane.spreader.position.y = hoistY;
      this.updateCraneCables(crane.cables, hoistY);
    }
  }

  private updateWeldingRobots(dt: number): void {
    for (const robot of this.weldingRobots) {
      robot.phase += dt * 2.0;
      robot.weldCycleTimer += dt;

      // Articulated robotic arm IK-style kinematic motion
      robot.shoulderJoint.rotation.y = Math.sin(robot.phase * 0.8) * 0.45;
      robot.elbowJoint.rotation.x = -0.4 + Math.sin(robot.phase * 1.2) * 0.25;
      robot.wristJoint.rotation.z = Math.sin(robot.phase * 1.6) * 0.35;

      // Welding cycle: weld for 2.2s, pause for 0.8s
      const cycleMod = robot.weldCycleTimer % 3.0;
      robot.isWelding = cycleMod < 2.2;
      robot.sparks.visible = robot.isWelding && (Math.sin(robot.phase * 16.0) > -0.3);

      if (robot.isWelding) {
        // Animate spark particles
        const pos = robot.sparkPositions;
        const vel = robot.sparkVelocities;
        const count = pos.length / 3;

        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          // Apply velocity & gravity
          pos[idx] += vel[idx] * dt;
          pos[idx + 1] += vel[idx + 1] * dt - 9.8 * dt * dt;
          pos[idx + 2] += vel[idx + 2] * dt;

          // Reset particle if fallen below ground
          if (pos[idx + 1] < 0) {
            pos[idx] = (Math.random() - 0.5) * 0.15;
            pos[idx + 1] = 0.1;
            pos[idx + 2] = (Math.random() - 0.5) * 0.15;

            vel[idx] = (Math.random() - 0.5) * 3.5;
            vel[idx + 1] = Math.random() * 4.0 + 1.5;
            vel[idx + 2] = (Math.random() - 0.5) * 3.5;
          }
        }
        robot.sparks.geometry.attributes.position.needsUpdate = true;
      }
    }
  }

  private updateStampingPresses(dt: number): void {
    for (const press of this.stampingPresses) {
      press.phase += dt * press.cycleSpeed;
      // Sharp downward strike, gradual upward return
      const sinVal = Math.sin(press.phase);
      const strokeProgress = sinVal > 0 ? Math.pow(sinVal, 2.5) : 0;
      press.ram.position.y = press.baseY - strokeProgress * press.stroke;
    }
  }

  private updateForklifts(dt: number): void {
    for (const fork of this.forklifts) {
      if (fork.pauseTimer > 0) {
        fork.pauseTimer -= dt;
        continue;
      }

      fork.currentZ += fork.dir * fork.speed * dt;
      fork.group.position.z = fork.currentZ;

      // Check turnaround bounds
      if (fork.dir > 0 && fork.currentZ >= fork.endZ) {
        fork.dir = -1;
        fork.pauseTimer = 1.0;
        fork.group.rotation.y = Math.PI;
      } else if (fork.dir < 0 && fork.currentZ <= fork.startZ) {
        fork.dir = 1;
        fork.pauseTimer = 1.0;
        fork.group.rotation.y = 0;
      }
    }
  }

  private updateConveyors(dt: number): void {
    for (const conv of this.conveyors) {
      const travel = (this.globalTime * conv.speed) % conv.length;
      const count = conv.crates.length;
      const spacing = conv.length / Math.max(1, count);

      for (let i = 0; i < count; i++) {
        const crate = conv.crates[i];
        const zPos = -conv.length * 0.5 + ((i * spacing + travel) % conv.length);
        crate.position.z = zPos;
      }
    }
  }

  private updateSteamChimneys(dt: number): void {
    for (const chimney of this.steamChimneys) {
      chimney.cyclePhase += dt * chimney.riseSpeed;
      const progress = (chimney.cyclePhase % 1.0);
      const currentScale = 0.5 + progress * (chimney.maxScale - 0.5);

      chimney.steamMesh.scale.set(currentScale, currentScale * 1.5, currentScale);
      chimney.steamMesh.position.y = chimney.baseY + progress * 4.5;

      const mat = chimney.steamMesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = Math.max(0, 0.7 * (1.0 - progress));
      }
    }
  }

  private updateDieselSwitchers(dt: number): void {
    for (const switcher of this.dieselSwitchers) {
      switcher.currentOffsetZ += switcher.dir * switcher.speed * dt;
      switcher.group.position.z = switcher.baseZ + switcher.currentOffsetZ;

      if (Math.abs(switcher.currentOffsetZ) >= switcher.travelDistance) {
        switcher.dir *= -1;
      }

      // Gentle cab lantern breathing
      const mat = switcher.cabGlow.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.65 + Math.sin(this.globalTime * 3.0) * 0.2;
      }
    }
  }
}
