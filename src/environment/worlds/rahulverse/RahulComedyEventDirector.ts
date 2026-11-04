import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';

export interface FlipBoardEvent {
  pivotGroup: THREE.Group;
  finishMesh: THREE.Mesh;
  startMesh: THREE.Mesh;
  angle: number;
}

export interface RunawayMicEvent {
  armGroup: THREE.Group;
  initialY: number;
  initialZ: number;
}

export interface FlyingPapersEvent {
  paperGroup: THREE.Group;
  papers: { mesh: THREE.Mesh; baseY: number; baseZ: number; speed: number; phase: number }[];
}

export interface RevolvingDoorEvent {
  rotorGroup: THREE.Group;
  speed: number;
}

export interface MiddleSeatDisputeEvent {
  chair1: THREE.Group;
  chair2: THREE.Group;
  baseX1: number;
  baseX2: number;
}

export interface MultiversePortalEvent {
  ringMesh: THREE.Mesh;
  vortexMesh: THREE.Mesh;
  hologramMesh: THREE.Mesh;
}

export interface ShoeMonumentEvent {
  toeMesh: THREE.Mesh;
}

export interface PuzzlePieceEvent {
  pieceL: THREE.Group;
  pieceR: THREE.Group;
}

/**
 * RahulComedyEventDirector
 * Isolated singleton coordinating animated physical-comedy gags for Rahulverse: The Never-Ending Yatra.
 * Manages 10 distinct animated satire events with deterministic seeding and reduced-motion accessibility support.
 */
export class RahulComedyEventDirector {
  private static instance: RahulComedyEventDirector;

  private isEnabled: boolean = true;
  private globalClock: number = 0;

  // Active animated gag registries
  private flipBoards: FlipBoardEvent[] = [];
  private runawayMics: RunawayMicEvent[] = [];
  private flyingPapers: FlyingPapersEvent[] = [];
  private revolvingDoors: RevolvingDoorEvent[] = [];
  private middleSeatDisputes: MiddleSeatDisputeEvent[] = [];
  private multiversePortals: MultiversePortalEvent[] = [];
  private shoeMonuments: ShoeMonumentEvent[] = [];
  private puzzlePieces: PuzzlePieceEvent[] = [];
  private mediaCongaLines: THREE.Group[] = [];
  private timerMeshes: THREE.Mesh[] = [];

  private constructor() {}

  public static getInstance(): RahulComedyEventDirector {
    if (!RahulComedyEventDirector.instance) {
      RahulComedyEventDirector.instance = new RahulComedyEventDirector();
    }
    return RahulComedyEventDirector.instance;
  }

  public reset(): void {
    this.flipBoards = [];
    this.runawayMics = [];
    this.flyingPapers = [];
    this.revolvingDoors = [];
    this.middleSeatDisputes = [];
    this.multiversePortals = [];
    this.shoeMonuments = [];
    this.puzzlePieces = [];
    this.mediaCongaLines = [];
    this.timerMeshes = [];
  }

  // Registration hooks called during procedural district generation
  public registerFlipBoard(pivot: THREE.Group, finish: THREE.Mesh, start: THREE.Mesh): void {
    this.flipBoards.push({ pivotGroup: pivot, finishMesh: finish, startMesh: start, angle: 0 });
  }

  public registerRunawayMic(arm: THREE.Group, y: number, z: number): void {
    this.runawayMics.push({ armGroup: arm, initialY: y, initialZ: z });
  }

  public registerFlyingPapers(group: THREE.Group, papers: any[]): void {
    this.flyingPapers.push({ paperGroup: group, papers });
  }

  public registerRevolvingDoor(rotor: THREE.Group, speed: number = 1.0): void {
    this.revolvingDoors.push({ rotorGroup: rotor, speed });
  }

  public registerMiddleSeatDispute(c1: THREE.Group, c2: THREE.Group, x1: number, x2: number): void {
    this.middleSeatDisputes.push({ chair1: c1, chair2: c2, baseX1: x1, baseX2: x2 });
  }

  public registerMultiversePortal(ring: THREE.Mesh, vortex: THREE.Mesh, holo: THREE.Mesh): void {
    this.multiversePortals.push({ ringMesh: ring, vortexMesh: vortex, hologramMesh: holo });
  }

  public registerShoeMonument(toe: THREE.Mesh): void {
    this.shoeMonuments.push({ toeMesh: toe });
  }

  public registerPuzzlePieces(pL: THREE.Group, pR: THREE.Group): void {
    this.puzzlePieces.push({ pieceL: pL, pieceR: pR });
  }

  public registerMediaCongaLine(group: THREE.Group): void {
    this.mediaCongaLines.push(group);
  }

  public registerTimerMesh(timer: THREE.Mesh): void {
    this.timerMeshes.push(timer);
  }

  /**
   * Main animation loop update hook
   */
  public update(dt: number, isWorldActive: boolean = true): void {
    if (!this.isEnabled || !isWorldActive) return;

    const delta = Math.min(dt || 0.016, 0.1);
    this.globalClock += delta;

    const isReducedMotion = typeof window !== 'undefined' &&
      SettingsManager.getInstance().isReducedMotion();
    const motionMultiplier = isReducedMotion ? 0.35 : 1.0;

    // 1. Flip Board on Finish Line Arch (Rotates every 4.5 seconds)
    for (let i = 0; i < this.flipBoards.length; i++) {
      const fb = this.flipBoards[i];
      const cycle = (this.globalClock * 0.4 * motionMultiplier) % 2.0;
      // Smooth flip transition
      const flipTarget = cycle > 1.0 ? Math.PI : 0;
      fb.angle += (flipTarget - fb.angle) * 0.12;
      fb.pivotGroup.rotation.x = fb.angle;
    }

    // 2. Runaway Mechanical Microphone (Jerks up and away from speaker)
    for (let i = 0; i < this.runawayMics.length; i++) {
      const rm = this.runawayMics[i];
      const t = (this.globalClock * 1.5 * motionMultiplier) % (Math.PI * 2);
      const jerk = Math.sin(t);
      // Upward jerk & backward recoil
      rm.armGroup.rotation.z = Math.max(-0.4, jerk * 0.5);
      rm.armGroup.position.y = rm.initialY + (jerk > 0 ? jerk * 0.6 : 0);
      rm.armGroup.position.z = rm.initialZ + Math.sin(t * 0.5) * 0.35;
    }

    // 3. Flying Parliament Documents in Arcs
    for (let i = 0; i < this.flyingPapers.length; i++) {
      const fp = this.flyingPapers[i];
      for (let p = 0; p < fp.papers.length; p++) {
        const item = fp.papers[p];
        const pt = (this.globalClock * item.speed * motionMultiplier + item.phase) % 10.0;
        item.mesh.position.y = item.baseY + Math.sin(pt * 2.0) * 0.85;
        item.mesh.position.z = item.baseZ + Math.cos(pt * 1.5) * 1.4;
        item.mesh.rotation.x = pt * 1.5;
        item.mesh.rotation.y = pt * 2.2;
      }
    }

    // 4. Revolving Coalition Door
    for (let i = 0; i < this.revolvingDoors.length; i++) {
      const rd = this.revolvingDoors[i];
      rd.rotorGroup.rotation.y += delta * rd.speed * 1.8 * motionMultiplier;
    }

    // 5. Middle Seat Dispute (Chairs shifting back and forth)
    for (let i = 0; i < this.middleSeatDisputes.length; i++) {
      const msd = this.middleSeatDisputes[i];
      const disputeShift = Math.sin(this.globalClock * 2.2 * motionMultiplier) * 0.42;
      msd.chair1.position.x = msd.baseX1 + disputeShift;
      msd.chair2.position.x = msd.baseX2 - disputeShift;
    }

    // 6. Multiverse Hologram & Swirling Vortex
    for (let i = 0; i < this.multiversePortals.length; i++) {
      const mp = this.multiversePortals[i];
      mp.ringMesh.rotation.z += delta * 1.5 * motionMultiplier;
      mp.vortexMesh.rotation.z -= delta * 2.2 * motionMultiplier;
      const pulse = 1.0 + Math.sin(this.globalClock * 3.5 * motionMultiplier) * 0.08;
      mp.vortexMesh.scale.set(pulse, pulse, pulse);
      if (mp.hologramMesh) {
        mp.hologramMesh.rotation.y += delta * 0.8 * motionMultiplier;
      }
    }

    // 7. Giant Walking Shoe Monument (Tapping toe rhythm)
    for (let i = 0; i < this.shoeMonuments.length; i++) {
      const sm = this.shoeMonuments[i];
      const tap = Math.abs(Math.sin(this.globalClock * 3.0 * motionMultiplier)) * 0.28;
      sm.toeMesh.rotation.x = -tap;
    }

    // 8. Interlocking Puzzle Pieces (Try to snap, bounce apart)
    for (let i = 0; i < this.puzzlePieces.length; i++) {
      const pp = this.puzzlePieces[i];
      const cycle = Math.sin(this.globalClock * 1.8 * motionMultiplier);
      const dist = Math.abs(cycle) * 0.85;
      pp.pieceL.position.x = -dist;
      pp.pieceR.position.x = dist;
    }

    // 9. Media Conga Line (Bobbing run animation)
    for (let i = 0; i < this.mediaCongaLines.length; i++) {
      const cl = this.mediaCongaLines[i];
      for (let c = 0; c < cl.children.length; c++) {
        const child = cl.children[c];
        const bob = Math.abs(Math.sin((this.globalClock * 5.0 + c * 0.8) * motionMultiplier)) * 0.18;
        child.position.y = bob;
      }
    }

    // 10. Digital Debate Clock Blinking
    for (let i = 0; i < this.timerMeshes.length; i++) {
      const tm = this.timerMeshes[i];
      const blink = Math.sin(this.globalClock * 6.0) > 0;
      tm.visible = blink;
    }
  }
}
