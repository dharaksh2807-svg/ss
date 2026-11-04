import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';

export interface FlipBoardEvent {
  pivotGroup: THREE.Group;
  finishMesh: THREE.Mesh;
  startMesh: THREE.Mesh;
  angle: number;
  confettiGroup?: THREE.Group;
  armGroup?: THREE.Group;
  confettiParticles?: { mesh: THREE.Mesh; origY: number; origZ: number; vy: number; vz: number; rotSpeed: number }[];
}

export interface RunawayMicEvent {
  armGroup: THREE.Group;
  initialY: number;
  initialZ: number;
  buttonGroup?: THREE.Group;
  debaterL?: THREE.Group;
  debaterR?: THREE.Group;
  stateTimer?: number;
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
  table?: THREE.Object3D;
  allChairs?: { group: THREE.Group; baseAngle: number; radius: number }[];
  figures?: THREE.Group[];
}

export interface MultiversePortalEvent {
  ringMesh: THREE.Mesh;
  vortexMesh: THREE.Mesh;
  hologramMesh: THREE.Mesh;
  portalPair?: {
    portalA: THREE.Group;
    portalB: THREE.Group;
    signMesh?: THREE.Mesh;
    baseXA: number;
    baseXB: number;
    phase: number;
    swapped: boolean;
  };
}

export interface ShoeMonumentEvent {
  toeMesh: THREE.Mesh;
  legs?: {
    legL: THREE.Group;
    legR: THREE.Group;
    armL?: THREE.Group;
    armR?: THREE.Group;
    bodyGroup?: THREE.Group;
    baseZ?: number;
  };
}

export interface PuzzlePieceEvent {
  pieceL: THREE.Group;
  pieceR: THREE.Group;
  armL?: THREE.Group;
  armR?: THREE.Group;
}

export interface EmptyChairDebateEvent {
  anchorArmL: THREE.Mesh;
  anchorArmR: THREE.Mesh;
  anchorHead: THREE.Mesh;
  chair: THREE.Group;
  speechBubble?: THREE.Mesh;
}

export interface TeacupDebateEvent {
  steamPuffs: { mesh: THREE.Mesh; baseY: number; speed: number; phase: number }[];
  debater1?: THREE.Group;
  debater2?: THREE.Group;
}

export interface CosmicMicLaunchEvent {
  micGroup: THREE.Group;
  boosterGlow: THREE.Mesh;
  onlookerHead?: THREE.Mesh;
  baseY: number;
}

export interface AccordionMapEvent {
  segments: { group: THREE.Group; foldIndex: number }[];
  indicator?: THREE.Mesh;
}

export interface HandshakeStatueEvent {
  handL: THREE.Mesh;
  handR: THREE.Mesh;
  gears: THREE.Mesh[];
}

/**
 * RahulComedyEventDirector
 * Isolated singleton coordinating animated physical-comedy gags for Rahulverse: The Never-Ending Yatra.
 * Manages 15 distinct animated satire events with deterministic timing, full leak pruning,
 * and reduced-motion accessibility support.
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

  // Extended gags
  private emptyChairDebates: EmptyChairDebateEvent[] = [];
  private teacupDebates: TeacupDebateEvent[] = [];
  private cosmicMicLaunches: CosmicMicLaunchEvent[] = [];
  private accordionMaps: AccordionMapEvent[] = [];
  private handshakeStatues: HandshakeStatueEvent[] = [];
  private clockHands: { hourHand: THREE.Mesh; minuteHand: THREE.Mesh }[] = [];

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
    this.emptyChairDebates = [];
    this.teacupDebates = [];
    this.cosmicMicLaunches = [];
    this.accordionMaps = [];
    this.handshakeStatues = [];
    this.clockHands = [];
    this.globalClock = 0;
  }

  // --- Registration hooks called during procedural district generation ---

  public registerFlipBoard(
    pivot: THREE.Group,
    finish: THREE.Mesh,
    start: THREE.Mesh,
    confettiGroup?: THREE.Group,
    armGroup?: THREE.Group,
    particles?: { mesh: THREE.Mesh; origY: number; origZ: number; vy: number; vz: number; rotSpeed: number }[]
  ): void {
    this.flipBoards.push({
      pivotGroup: pivot,
      finishMesh: finish,
      startMesh: start,
      angle: 0,
      confettiGroup,
      armGroup,
      confettiParticles: particles
    });
  }

  public registerRunawayMic(
    arm: THREE.Group,
    y: number,
    z: number,
    buttonGroup?: THREE.Group,
    debaterL?: THREE.Group,
    debaterR?: THREE.Group
  ): void {
    this.runawayMics.push({
      armGroup: arm,
      initialY: y,
      initialZ: z,
      buttonGroup,
      debaterL,
      debaterR,
      stateTimer: 0
    });
  }

  public registerFlyingPapers(group: THREE.Group, papers: any[]): void {
    this.flyingPapers.push({ paperGroup: group, papers });
  }

  public registerRevolvingDoor(rotor: THREE.Group, speed: number = 1.0): void {
    this.revolvingDoors.push({ rotorGroup: rotor, speed });
  }

  public registerMiddleSeatDispute(
    c1: THREE.Group,
    c2: THREE.Group,
    x1: number,
    x2: number,
    table?: THREE.Object3D,
    allChairs?: { group: THREE.Group; baseAngle: number; radius: number }[],
    figures?: THREE.Group[]
  ): void {
    this.middleSeatDisputes.push({
      chair1: c1,
      chair2: c2,
      baseX1: x1,
      baseX2: x2,
      table,
      allChairs,
      figures
    });
  }

  public registerMultiversePortal(
    ring: THREE.Mesh,
    vortex: THREE.Mesh,
    holo: THREE.Mesh,
    portalPair?: {
      portalA: THREE.Group;
      portalB: THREE.Group;
      signMesh?: THREE.Mesh;
      baseXA: number;
      baseXB: number;
      phase: number;
      swapped: boolean;
    }
  ): void {
    this.multiversePortals.push({
      ringMesh: ring,
      vortexMesh: vortex,
      hologramMesh: holo,
      portalPair
    });
  }

  public registerShoeMonument(
    toe: THREE.Mesh,
    legs?: {
      legL: THREE.Group;
      legR: THREE.Group;
      armL?: THREE.Group;
      armR?: THREE.Group;
      bodyGroup?: THREE.Group;
      baseZ?: number;
    }
  ): void {
    this.shoeMonuments.push({ toeMesh: toe, legs });
  }

  public registerPuzzlePieces(
    pL: THREE.Group,
    pR: THREE.Group,
    armL?: THREE.Group,
    armR?: THREE.Group
  ): void {
    this.puzzlePieces.push({ pieceL: pL, pieceR: pR, armL, armR });
  }

  public registerMediaCongaLine(group: THREE.Group): void {
    this.mediaCongaLines.push(group);
  }

  public registerTimerMesh(
    timer: THREE.Mesh,
    clockHands?: { hourHand: THREE.Mesh; minuteHand: THREE.Mesh }
  ): void {
    this.timerMeshes.push(timer);
    if (clockHands) {
      this.clockHands.push(clockHands);
    }
  }

  public registerEmptyChairDebate(
    anchorArmL: THREE.Mesh,
    anchorArmR: THREE.Mesh,
    anchorHead: THREE.Mesh,
    chair: THREE.Group,
    speechBubble?: THREE.Mesh
  ): void {
    this.emptyChairDebates.push({ anchorArmL, anchorArmR, anchorHead, chair, speechBubble });
  }

  public registerTeacupDebate(
    steamPuffs: { mesh: THREE.Mesh; baseY: number; speed: number; phase: number }[],
    debater1?: THREE.Group,
    debater2?: THREE.Group
  ): void {
    this.teacupDebates.push({ steamPuffs, debater1, debater2 });
  }

  public registerCosmicMicLaunch(
    micGroup: THREE.Group,
    boosterGlow: THREE.Mesh,
    onlookerHead?: THREE.Mesh,
    baseY: number = 0
  ): void {
    this.cosmicMicLaunches.push({ micGroup, boosterGlow, onlookerHead, baseY });
  }

  public registerAccordionMap(
    segments: { group: THREE.Group; foldIndex: number }[],
    indicator?: THREE.Mesh
  ): void {
    this.accordionMaps.push({ segments, indicator });
  }

  public registerHandshakeStatue(
    handL: THREE.Mesh,
    handR: THREE.Mesh,
    gears: THREE.Mesh[]
  ): void {
    this.handshakeStatues.push({ handL, handR, gears });
  }

  // --- Public Diagnostics Getters ---
  public getFlipBoardCount(): number { return this.flipBoards.length; }
  public getRunawayMicCount(): number { return this.runawayMics.length; }
  public getFlyingPapersCount(): number { return this.flyingPapers.length; }
  public getRevolvingDoorCount(): number { return this.revolvingDoors.length; }
  public getMiddleSeatDisputeCount(): number { return this.middleSeatDisputes.length; }
  public getMultiversePortalCount(): number { return this.multiversePortals.length; }
  public getShoeMonumentCount(): number { return this.shoeMonuments.length; }
  public getPuzzlePieceCount(): number { return this.puzzlePieces.length; }
  public getMediaCongaLineCount(): number { return this.mediaCongaLines.length; }
  public getTimerMeshCount(): number { return this.timerMeshes.length; }
  public getTotalActiveElements(): number {
    return this.flipBoards.length + this.runawayMics.length + this.flyingPapers.length +
      this.revolvingDoors.length + this.middleSeatDisputes.length + this.multiversePortals.length +
      this.shoeMonuments.length + this.puzzlePieces.length + this.mediaCongaLines.length +
      this.timerMeshes.length + this.emptyChairDebates.length + this.teacupDebates.length +
      this.cosmicMicLaunches.length + this.accordionMaps.length + this.handshakeStatues.length;
  }

  /**
   * Prunes detached objects whose parent chunks were recycled, fixing memory leak.
   */
  private pruneDetached(): void {
    const isAttached = (obj: THREE.Object3D | null | undefined): boolean => {
      return !!(obj && obj.parent);
    };

    this.flipBoards = this.flipBoards.filter(fb => isAttached(fb.pivotGroup));
    this.runawayMics = this.runawayMics.filter(rm => isAttached(rm.armGroup));
    this.flyingPapers = this.flyingPapers.filter(fp => isAttached(fp.paperGroup));
    this.revolvingDoors = this.revolvingDoors.filter(rd => isAttached(rd.rotorGroup));
    this.middleSeatDisputes = this.middleSeatDisputes.filter(msd => isAttached(msd.chair1) && isAttached(msd.chair2));
    this.multiversePortals = this.multiversePortals.filter(mp => isAttached(mp.ringMesh));
    this.shoeMonuments = this.shoeMonuments.filter(sm => isAttached(sm.toeMesh));
    this.puzzlePieces = this.puzzlePieces.filter(pp => isAttached(pp.pieceL) && isAttached(pp.pieceR));
    this.mediaCongaLines = this.mediaCongaLines.filter(mcl => isAttached(mcl));
    this.timerMeshes = this.timerMeshes.filter(tm => isAttached(tm));
    this.emptyChairDebates = this.emptyChairDebates.filter(ecd => isAttached(ecd.chair));
    this.teacupDebates = this.teacupDebates.filter(td => td.steamPuffs.length > 0 && isAttached(td.steamPuffs[0].mesh));
    this.cosmicMicLaunches = this.cosmicMicLaunches.filter(cml => isAttached(cml.micGroup));
    this.accordionMaps = this.accordionMaps.filter(am => am.segments.length > 0 && isAttached(am.segments[0].group));
    this.handshakeStatues = this.handshakeStatues.filter(hs => isAttached(hs.handL));
    this.clockHands = this.clockHands.filter(ch => isAttached(ch.hourHand));
  }

  /**
   * Main animation loop update hook
   */
  public update(dt: number, isWorldActive: boolean = true): void {
    if (!this.isEnabled || !isWorldActive) return;

    this.pruneDetached();

    const delta = Math.min(dt || 0.016, 0.1);
    this.globalClock += delta;

    const isReducedMotion = typeof window !== 'undefined' &&
      SettingsManager.getInstance().isReducedMotion();
    const motionMultiplier = isReducedMotion ? 0.35 : 1.0;

    // 1. Flip Board on Finish Line Arch & Exploding Confetti (Flips every 4.0 seconds)
    for (let i = 0; i < this.flipBoards.length; i++) {
      const fb = this.flipBoards[i];
      const cycle = (this.globalClock * 0.35 * motionMultiplier) % 2.0;
      const flipTarget = cycle > 1.0 ? Math.PI : 0;
      fb.angle += (flipTarget - fb.angle) * 0.15;
      fb.pivotGroup.rotation.x = fb.angle;

      // Mechanical Hand arm animation
      if (fb.armGroup) {
        const armSwing = Math.sin(this.globalClock * 2.2 * motionMultiplier) * 0.25;
        fb.armGroup.rotation.z = armSwing;
      }

      // Confetti burst particles when flipped to "NEXT YATRA STARTS HERE"
      if (fb.confettiParticles && fb.confettiParticles.length > 0) {
        const isFlipped = fb.angle > Math.PI * 0.5;
        for (let p = 0; p < fb.confettiParticles.length; p++) {
          const cp = fb.confettiParticles[p];
          if (isFlipped) {
            const burstProgress = (this.globalClock * 2.0 + p * 0.1) % 2.5;
            cp.mesh.position.y = cp.origY + burstProgress * cp.vy - (burstProgress * burstProgress * 1.5);
            cp.mesh.position.z = cp.origZ + Math.sin(burstProgress * 3.0) * cp.vz;
            cp.mesh.rotation.x += delta * cp.rotSpeed;
            cp.mesh.rotation.y += delta * cp.rotSpeed * 1.3;
            cp.mesh.visible = true;
          } else {
            cp.mesh.position.y = cp.origY;
            cp.mesh.position.z = cp.origZ;
            cp.mesh.visible = false;
          }
        }
      }
    }

    // 2. Runaway Mechanical Microphone Gag (With Point of Order Button & Debater Lunge)
    for (let i = 0; i < this.runawayMics.length; i++) {
      const rm = this.runawayMics[i];
      const t = (this.globalClock * 1.6 * motionMultiplier) % (Math.PI * 2);
      const jerk = Math.sin(t);

      // Upward jerk, rotation away, and lateral sweep
      rm.armGroup.rotation.z = Math.max(-0.55, jerk * 0.65);
      rm.armGroup.rotation.y = Math.sin(t * 0.8) * 0.45;
      rm.armGroup.position.y = rm.initialY + (jerk > 0 ? jerk * 0.75 : 0);
      rm.armGroup.position.z = rm.initialZ + Math.sin(t * 0.5) * 0.45;

      // Point of order button visibly depresses when mic jerks away
      if (rm.buttonGroup) {
        const buttonDepressed = jerk > 0.2 ? -0.15 : 0;
        rm.buttonGroup.position.y = buttonDepressed;
      }

      // Debaters lunging to reach the mic
      if (rm.debaterL) {
        rm.debaterL.rotation.z = jerk > 0 ? -0.25 : 0.05;
      }
      if (rm.debaterR) {
        rm.debaterR.rotation.z = jerk > 0 ? 0.25 : -0.05;
      }
    }

    // 3. Flying Parliament Documents in Swirling Arcs
    for (let i = 0; i < this.flyingPapers.length; i++) {
      const fp = this.flyingPapers[i];
      for (let p = 0; p < fp.papers.length; p++) {
        const item = fp.papers[p];
        const pt = (this.globalClock * item.speed * motionMultiplier + item.phase) % 10.0;
        item.mesh.position.y = item.baseY + Math.sin(pt * 2.2) * 1.1;
        item.mesh.position.z = item.baseZ + Math.cos(pt * 1.6) * 1.8;
        item.mesh.rotation.x = pt * 2.0;
        item.mesh.rotation.y = pt * 2.8;
        item.mesh.rotation.z = Math.sin(pt * 3.0) * 0.5;
      }
    }

    // 4. Revolving Coalition Door
    for (let i = 0; i < this.revolvingDoors.length; i++) {
      const rd = this.revolvingDoors[i];
      rd.rotorGroup.rotation.y += delta * rd.speed * 2.0 * motionMultiplier;
    }

    // 5. Middle Seat Dispute & Musical Chairs Coalition Carousel
    for (let i = 0; i < this.middleSeatDisputes.length; i++) {
      const msd = this.middleSeatDisputes[i];
      const cycle = this.globalClock * 1.8 * motionMultiplier;

      // Basic two-chair dispute displacement for backward compatibility
      const disputeShift = Math.sin(cycle * 1.2) * 0.55;
      msd.chair1.position.x = msd.baseX1 + disputeShift;
      msd.chair2.position.x = msd.baseX2 - disputeShift;

      // Advanced Musical Chairs carousel animation
      if (msd.allChairs && msd.allChairs.length > 0) {
        const carouselPhase = (this.globalClock * 0.8 * motionMultiplier) % 6.0;
        const isRotating = carouselPhase < 4.0;
        const rotateSpeed = isRotating ? (4.0 - carouselPhase) * 1.5 : 0;

        for (let c = 0; c < msd.allChairs.length; c++) {
          const ch = msd.allChairs[c];
          if (isRotating) {
            // Rotating around the table
            const currentAngle = ch.baseAngle + this.globalClock * 2.2;
            ch.group.position.x = Math.cos(currentAngle) * ch.radius;
            ch.group.position.z = Math.sin(currentAngle) * ch.radius;
            ch.group.rotation.y = -currentAngle + Math.PI * 0.5;
          } else {
            // Musical chairs stop! All scramble to the same front side of table
            const squeezeX = -1.5 + c * 1.0;
            const targetX = squeezeX;
            const targetZ = 1.4;
            ch.group.position.x += (targetX - ch.group.position.x) * 0.15;
            ch.group.position.z += (targetZ - ch.group.position.z) * 0.15;
            ch.group.rotation.y = 0;
          }
        }
      }

      if (msd.table) {
        msd.table.rotation.y += delta * 0.25 * motionMultiplier;
      }
    }

    // 6. Multiverse Hologram, Swirling Vortex & Twin Portal Swap Gag!
    for (let i = 0; i < this.multiversePortals.length; i++) {
      const mp = this.multiversePortals[i];
      mp.ringMesh.rotation.z += delta * 1.8 * motionMultiplier;
      mp.vortexMesh.rotation.z -= delta * 2.6 * motionMultiplier;
      const pulse = 1.0 + Math.sin(this.globalClock * 3.8 * motionMultiplier) * 0.12;
      mp.vortexMesh.scale.set(pulse, pulse, pulse);
      if (mp.hologramMesh) {
        mp.hologramMesh.rotation.y += delta * 1.2 * motionMultiplier;
      }

      // Twin Portals Swap Gag (Rahul chasing Modi vs Modi chasing Rahul)
      if (mp.portalPair) {
        const pp = mp.portalPair;
        // Every 5.5 seconds, swap positions with orbit
        const swapTime = (this.globalClock * 0.45 * motionMultiplier) % 2.0;
        const swapTarget = swapTime > 1.0 ? 1 : 0;
        pp.phase += (swapTarget - pp.phase) * 0.08;

        const separation = Math.abs(pp.baseXB - pp.baseXA) * 0.5;
        const midX = (pp.baseXA + pp.baseXB) * 0.5;
        const angle = pp.phase * Math.PI;

        pp.portalA.position.x = midX - Math.cos(angle) * separation;
        pp.portalA.position.z = -Math.sin(angle) * 3.0;

        pp.portalB.position.x = midX + Math.cos(angle) * separation;
        pp.portalB.position.z = Math.sin(angle) * 3.0;

        // Sign flip / highlight
        if (pp.signMesh) {
          const signBob = Math.sin(this.globalClock * 4.0 * motionMultiplier) * 0.08;
          pp.signMesh.position.y = 7.2 + signBob;
        }
      }
    }

    // 7. Giant Walking Shoe Monument (Full Walking Motion: legs, arms, and tapping toe)
    for (let i = 0; i < this.shoeMonuments.length; i++) {
      const sm = this.shoeMonuments[i];
      const walkFreq = 3.2 * motionMultiplier;
      const tap = Math.abs(Math.sin(this.globalClock * walkFreq)) * 0.35;
      sm.toeMesh.rotation.x = -tap;

      if (sm.legs) {
        const walkPhase = this.globalClock * walkFreq;
        const swingL = Math.sin(walkPhase) * 0.45;
        const swingR = -swingL;

        sm.legs.legL.rotation.x = swingL;
        sm.legs.legR.rotation.x = swingR;

        if (sm.legs.armL) sm.legs.armL.rotation.x = -swingL * 0.8;
        if (sm.legs.armR) sm.legs.armR.rotation.x = -swingR * 0.8;

        if (sm.legs.bodyGroup && sm.legs.baseZ !== undefined) {
          const stepBob = Math.abs(Math.cos(walkPhase)) * 0.22;
          sm.legs.bodyGroup.position.y = stepBob;
          // Step along the side path
          const stride = Math.sin(walkPhase * 0.5) * 1.5;
          sm.legs.bodyGroup.position.z = sm.legs.baseZ + stride;
        }
      }
    }

    // 8. Interlocking Puzzle Pieces on Mechanical Arms
    for (let i = 0; i < this.puzzlePieces.length; i++) {
      const pp = this.puzzlePieces[i];
      const cycle = Math.sin(this.globalClock * 2.0 * motionMultiplier);
      const dist = Math.abs(cycle) * 1.1;
      pp.pieceL.position.x = -dist;
      pp.pieceR.position.x = dist;

      if (pp.armL) pp.armL.rotation.z = -dist * 0.3;
      if (pp.armR) pp.armR.rotation.z = dist * 0.3;
    }

    // 9. Media Conga Line (4-member Synchronized Trot)
    for (let i = 0; i < this.mediaCongaLines.length; i++) {
      const cl = this.mediaCongaLines[i];
      for (let c = 0; c < cl.children.length; c++) {
        const child = cl.children[c];
        const bob = Math.abs(Math.sin((this.globalClock * 5.5 + c * 0.9) * motionMultiplier)) * 0.25;
        child.position.y = bob;
        // Comedic side-to-side waddle
        const waddle = Math.sin((this.globalClock * 5.5 + c * 0.9) * motionMultiplier) * 0.12;
        child.rotation.z = waddle;
      }
    }

    // 10. Debate Clocks: Blinking & Reverse Rotating Clock Hands
    for (let i = 0; i < this.timerMeshes.length; i++) {
      const tm = this.timerMeshes[i];
      const blink = Math.sin(this.globalClock * 5.0) > -0.3;
      tm.visible = blink;
    }
    for (let i = 0; i < this.clockHands.length; i++) {
      const ch = this.clockHands[i];
      // Clock hands frantically spinning BACKWARDS
      ch.minuteHand.rotation.z += delta * 6.0 * motionMultiplier;
      ch.hourHand.rotation.z += delta * 1.5 * motionMultiplier;
    }

    // 11. TV News Anchor Interviewing Empty Chair
    for (let i = 0; i < this.emptyChairDebates.length; i++) {
      const ecd = this.emptyChairDebates[i];
      const gesture = Math.sin(this.globalClock * 3.8 * motionMultiplier);
      ecd.anchorArmL.rotation.x = -0.4 + gesture * 0.4;
      ecd.anchorArmR.rotation.x = -0.2 - gesture * 0.5;
      ecd.anchorHead.rotation.y = Math.sin(this.globalClock * 2.5 * motionMultiplier) * 0.35;
      if (ecd.speechBubble) {
        const bubblePulse = 1.0 + Math.sin(this.globalClock * 4.5 * motionMultiplier) * 0.08;
        ecd.speechBubble.scale.set(bubblePulse, bubblePulse, bubblePulse);
      }
    }

    // 12. Teacup Storm Debate
    for (let i = 0; i < this.teacupDebates.length; i++) {
      const td = this.teacupDebates[i];
      for (let s = 0; s < td.steamPuffs.length; s++) {
        const puff = td.steamPuffs[s];
        const t = (this.globalClock * puff.speed * motionMultiplier + puff.phase) % 3.0;
        puff.mesh.position.y = puff.baseY + t * 0.8;
        const scale = 0.5 + t * 0.5;
        puff.mesh.scale.set(scale, scale, scale);
        (puff.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1.0 - t / 3.0);
      }
      if (td.debater1) {
        td.debater1.rotation.y = Math.sin(this.globalClock * 3.5 * motionMultiplier) * 0.3;
      }
      if (td.debater2) {
        td.debater2.rotation.y = -Math.sin(this.globalClock * 3.5 * motionMultiplier) * 0.3;
      }
    }

    // 13. Cosmic Microphone Space Launch
    for (let i = 0; i < this.cosmicMicLaunches.length; i++) {
      const cml = this.cosmicMicLaunches[i];
      const cycle = (this.globalClock * 0.35 * motionMultiplier) % 5.0;
      // Ascends into space from y=0 to y=18
      const launchY = cml.baseY + (cycle * cycle * 0.7);
      cml.micGroup.position.y = launchY;
      cml.micGroup.rotation.y += delta * 2.5 * motionMultiplier;
      cml.boosterGlow.scale.setScalar(1.0 + Math.sin(this.globalClock * 12.0) * 0.3);

      if (cml.onlookerHead) {
        // Looks straight up in bewilderment
        cml.onlookerHead.rotation.x = -Math.min(1.2, cycle * 0.3);
      }
    }

    // 14. Unfolding Accordion Route Map
    for (let i = 0; i < this.accordionMaps.length; i++) {
      const am = this.accordionMaps[i];
      const unrollPhase = (Math.sin(this.globalClock * 1.4 * motionMultiplier) + 1.0) * 0.5; // 0 to 1
      for (let s = 0; s < am.segments.length; s++) {
        const seg = am.segments[s];
        const foldAngle = (1.0 - unrollPhase) * (s % 2 === 0 ? 0.65 : -0.65);
        seg.group.rotation.y = foldAngle;
      }
      if (am.indicator) {
        am.indicator.position.x = -2.0 + unrollPhase * 4.0;
      }
    }

    // 15. Monumental Handshake Statue
    for (let i = 0; i < this.handshakeStatues.length; i++) {
      const hs = this.handshakeStatues[i];
      const pump = Math.sin(this.globalClock * 4.5 * motionMultiplier) * 0.22;
      hs.handL.position.y = 3.8 + pump;
      hs.handR.position.y = 3.8 + pump;
      for (let g = 0; g < hs.gears.length; g++) {
        hs.gears[g].rotation.z += delta * (g % 2 === 0 ? 3.5 : -3.5) * motionMultiplier;
      }
    }
  }
}
