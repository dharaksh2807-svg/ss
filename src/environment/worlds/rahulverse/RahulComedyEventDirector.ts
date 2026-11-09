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

// ---------------------------------------------------------------------------
// GATE A & GATE B POLITICAL MEME UNIVERSE GAG INTERFACES (RAHUL & CROSSOVERS)
// ---------------------------------------------------------------------------

/** Gate A: The Parliament Hug & Wink */
export interface ParliamentHugAndWinkEvent {
  rahulFigure: THREE.Group;
  modiFigure: THREE.Group;
  modiSpectacles: THREE.Object3D;
  cameramanFigure: THREE.Group;
  cameramanTripod: THREE.Object3D;
  eyebrowL: THREE.Object3D;
  eyelidL: THREE.Object3D;
  sparkleStar: THREE.Object3D;
  heartMesh: THREE.Object3D;
  modiArmL?: THREE.Object3D;
  modiArmR?: THREE.Object3D;
  gallerySpectators?: {
    group: THREE.Group;
    armL: THREE.Object3D;
    armR: THREE.Object3D;
  }[];
  worldZ?: number;
  timer: number;
}

/** Gate A: Moving Yatra March Procession with Animated Marchers & Support Van */
export interface YatraMarchProcessionEvent {
  processionGroup: THREE.Group;
  vanGroup?: THREE.Group;
  vanWheels?: THREE.Object3D[];
  vanLoudspeakers?: THREE.Object3D[];
  soundWaves?: THREE.Object3D[];
  marchers: {
    figure: THREE.Group;
    legL: THREE.Object3D;
    legR: THREE.Object3D;
    armL: THREE.Object3D;
    armR: THREE.Object3D;
    flag?: THREE.Object3D;
    banner?: THREE.Object3D;
    phaseOffset: number;
  }[];
  leaderWavingArm?: THREE.Object3D;
  bannerMesh?: THREE.Object3D;
  worldZ?: number;
  timer: number;
}

/** Gate A: The Never-Ending Yatra Mechanical Flip & Infinite Map */
export interface NeverEndingYatraEvent {
  archGroup: THREE.Group;
  flipBanner: THREE.Object3D;
  ratchetGear: THREE.Object3D;
  accordionMap: THREE.Object3D;
  runnerRahul: THREE.Group;
  sweatTowel?: THREE.Object3D;
  crowdMembers?: {
    group: THREE.Group;
    armL: THREE.Object3D;
    armR: THREE.Object3D;
    head: THREE.Object3D;
    baseY: number;
  }[];
  worldZ?: number;
  timer: number;
}

/** Gate B: Parliamentary Microphone Chaos */
export interface MicrophoneChaosEvent {
  tableGroup: THREE.Group;
  mics: { group: THREE.Group; stem: THREE.Object3D; head: THREE.Object3D; wheels?: THREE.Object3D }[];
  worldZ?: number;
  timer: number;
}

/** Gate B: The Great Press Scrum Daisy-Chain */
export interface PressScrumEvent {
  scrumGroup: THREE.Group;
  reporters: { group: THREE.Group; micArm: THREE.Object3D; baseAngle: number }[];
  worldZ?: number;
  timer: number;
}

/** Gate B: The Alliance Musical Chairs with Running Legs */
export interface AllianceChairsRunawayEvent {
  tableGroup: THREE.Group;
  nitishChair: THREE.Group;
  runningChairs: { chair: THREE.Group; legL: THREE.Object3D; legR: THREE.Object3D; baseAngle: number }[];
  worldZ?: number;
  timer: number;
}

/** Crossover 1: The Hug Loop */
export interface AnimatedHugLoop {
  turntable: THREE.Object3D;
  modiFigure: THREE.Object3D;
  rahulFigure: THREE.Object3D;
  heartIcon: THREE.Object3D;
  worldZ?: number;
  timer: number;
}

/** Crossover 2: The Selfie Battle & Chai Vendor Twist */
export interface AnimatedSelfieBattle {
  modiFigure: THREE.Object3D;
  rahulFigure: THREE.Object3D;
  cameraDrone: THREE.Object3D;
  chaiVendor: THREE.Object3D;
  flashLight: THREE.Object3D;
  worldZ?: number;
  timer: number;
}

/** Crossover 3: The Runaway Microphone Chase */
export interface AnimatedMicrophoneChase {
  rollingMic: THREE.Object3D;
  modiFigure: THREE.Object3D;
  rahulFigure: THREE.Object3D;
  worldZ?: number;
  timer: number;
}

/** Crossover 4: The Party Office Mix-Up */
export interface AnimatedPartyOfficeMixup {
  revolvingPortal: THREE.Object3D;
  politicianFigure: THREE.Object3D;
  signA: THREE.Object3D;
  signB: THREE.Object3D;
  worldZ?: number;
  timer: number;
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

  // Gate A, B & Crossover Gags
  private parliamentHugAndWinks: ParliamentHugAndWinkEvent[] = [];
  private yatraMarchProcessions: YatraMarchProcessionEvent[] = [];
  private neverEndingYatras: NeverEndingYatraEvent[] = [];
  private microphoneChaoses: MicrophoneChaosEvent[] = [];
  private pressScrums: PressScrumEvent[] = [];
  private allianceChairsRunaways: AllianceChairsRunawayEvent[] = [];
  private hugLoops: AnimatedHugLoop[] = [];
  private selfieBattles: AnimatedSelfieBattle[] = [];
  private microphoneChases: AnimatedMicrophoneChase[] = [];
  private partyOfficeMixups: AnimatedPartyOfficeMixup[] = [];

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

    this.parliamentHugAndWinks = [];
    this.yatraMarchProcessions = [];
    this.neverEndingYatras = [];
    this.microphoneChaoses = [];
    this.pressScrums = [];
    this.allianceChairsRunaways = [];
    this.hugLoops = [];
    this.selfieBattles = [];
    this.microphoneChases = [];
    this.partyOfficeMixups = [];

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

  // =========================================================================
  // GATE A & GATE B REGISTRATION METHODS
  // =========================================================================

  public registerParliamentHugAndWink(
    rahulFigure: THREE.Group,
    modiFigure: THREE.Group,
    modiSpectacles: THREE.Object3D,
    cameramanFigure: THREE.Group,
    cameramanTripod: THREE.Object3D,
    eyebrowL: THREE.Object3D,
    eyelidL: THREE.Object3D,
    sparkleStar: THREE.Object3D,
    heartMesh: THREE.Object3D,
    modiArmL?: THREE.Object3D,
    modiArmR?: THREE.Object3D,
    gallerySpectators?: {
      group: THREE.Group;
      armL: THREE.Object3D;
      armR: THREE.Object3D;
    }[],
    worldZ?: number
  ): void {
    this.parliamentHugAndWinks.push({
      rahulFigure,
      modiFigure,
      modiSpectacles,
      cameramanFigure,
      cameramanTripod,
      eyebrowL,
      eyelidL,
      sparkleStar,
      heartMesh,
      modiArmL,
      modiArmR,
      gallerySpectators,
      worldZ,
      timer: 0
    });
  }

  public registerYatraMarchProcession(
    processionGroup: THREE.Group,
    marchers: {
      figure: THREE.Group;
      legL: THREE.Object3D;
      legR: THREE.Object3D;
      armL: THREE.Object3D;
      armR: THREE.Object3D;
      flag?: THREE.Object3D;
      banner?: THREE.Object3D;
      phaseOffset: number;
    }[],
    vanGroup?: THREE.Group,
    vanWheels?: THREE.Object3D[],
    vanLoudspeakers?: THREE.Object3D[],
    soundWaves?: THREE.Object3D[],
    leaderWavingArm?: THREE.Object3D,
    bannerMesh?: THREE.Object3D,
    worldZ?: number
  ): void {
    this.yatraMarchProcessions.push({
      processionGroup,
      marchers,
      vanGroup,
      vanWheels,
      vanLoudspeakers,
      soundWaves,
      leaderWavingArm,
      bannerMesh,
      worldZ,
      timer: 0
    });
  }

  public registerNeverEndingYatra(
    archGroup: THREE.Group,
    flipBanner: THREE.Object3D,
    ratchetGear: THREE.Object3D,
    accordionMap: THREE.Object3D,
    runnerRahul: THREE.Group,
    sweatTowel?: THREE.Object3D,
    crowdMembers?: {
      group: THREE.Group;
      armL: THREE.Object3D;
      armR: THREE.Object3D;
      head: THREE.Object3D;
      baseY: number;
    }[],
    worldZ?: number
  ): void {
    this.neverEndingYatras.push({
      archGroup,
      flipBanner,
      ratchetGear,
      accordionMap,
      runnerRahul,
      sweatTowel,
      crowdMembers,
      worldZ,
      timer: 0
    });
  }

  public registerMicrophoneChaos(
    tableGroup: THREE.Group,
    mics: { group: THREE.Group; stem: THREE.Object3D; head: THREE.Object3D; wheels?: THREE.Object3D }[],
    worldZ?: number
  ): void {
    this.microphoneChaoses.push({ tableGroup, mics, worldZ, timer: 0 });
  }

  public registerPressScrum(
    scrumGroup: THREE.Group,
    reporters: { group: THREE.Group; micArm: THREE.Object3D; baseAngle: number }[],
    worldZ?: number
  ): void {
    this.pressScrums.push({ scrumGroup, reporters, worldZ, timer: 0 });
  }

  public registerAllianceChairsRunaway(
    tableGroup: THREE.Group,
    nitishChair: THREE.Group,
    runningChairs: { chair: THREE.Group; legL: THREE.Object3D; legR: THREE.Object3D; baseAngle: number }[],
    worldZ?: number
  ): void {
    this.allianceChairsRunaways.push({ tableGroup, nitishChair, runningChairs, worldZ, timer: 0 });
  }

  public registerHugLoop(
    turntable: THREE.Object3D,
    modiFigure: THREE.Object3D,
    rahulFigure: THREE.Object3D,
    heartIcon: THREE.Object3D,
    worldZ?: number
  ): void {
    this.hugLoops.push({ turntable, modiFigure, rahulFigure, heartIcon, worldZ, timer: 0 });
  }

  public registerSelfieBattle(
    modiFigure: THREE.Object3D,
    rahulFigure: THREE.Object3D,
    cameraDrone: THREE.Object3D,
    chaiVendor: THREE.Object3D,
    flashLight: THREE.Object3D,
    worldZ?: number
  ): void {
    this.selfieBattles.push({ modiFigure, rahulFigure, cameraDrone, chaiVendor, flashLight, worldZ, timer: 0 });
  }

  public registerMicrophoneChase(
    rollingMic: THREE.Object3D,
    modiFigure: THREE.Object3D,
    rahulFigure: THREE.Object3D,
    worldZ?: number
  ): void {
    this.microphoneChases.push({ rollingMic, modiFigure, rahulFigure, worldZ, timer: 0 });
  }

  public registerPartyOfficeMixup(
    revolvingPortal: THREE.Object3D,
    politicianFigure: THREE.Object3D,
    signA: THREE.Object3D,
    signB: THREE.Object3D,
    worldZ?: number
  ): void {
    this.partyOfficeMixups.push({ revolvingPortal, politicianFigure, signA, signB, worldZ, timer: 0 });
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

  // Gate A, B & Crossover Getters
  public getParliamentHugAndWinkCount(): number { return this.parliamentHugAndWinks.length; }
  public getYatraMarchProcessionCount(): number { return this.yatraMarchProcessions.length; }
  public getNeverEndingYatraCount(): number { return this.neverEndingYatras.length; }
  public getMicrophoneChaosCount(): number { return this.microphoneChaoses.length; }
  public getPressScrumCount(): number { return this.pressScrums.length; }
  public getAllianceChairsRunawayCount(): number { return this.allianceChairsRunaways.length; }
  public getHugLoopCount(): number { return this.hugLoops.length; }
  public getSelfieBattleCount(): number { return this.selfieBattles.length; }
  public getMicrophoneChaseCount(): number { return this.microphoneChases.length; }
  public getPartyOfficeMixupCount(): number { return this.partyOfficeMixups.length; }

  public getTotalActiveElements(): number {
    return this.flipBoards.length + this.runawayMics.length + this.flyingPapers.length +
      this.revolvingDoors.length + this.middleSeatDisputes.length + this.multiversePortals.length +
      this.shoeMonuments.length + this.puzzlePieces.length + this.mediaCongaLines.length +
      this.timerMeshes.length + this.emptyChairDebates.length + this.teacupDebates.length +
      this.cosmicMicLaunches.length + this.accordionMaps.length + this.handshakeStatues.length +
      this.parliamentHugAndWinks.length + this.yatraMarchProcessions.length + this.neverEndingYatras.length + this.microphoneChaoses.length +
      this.pressScrums.length + this.allianceChairsRunaways.length + this.hugLoops.length +
      this.selfieBattles.length + this.microphoneChases.length + this.partyOfficeMixups.length;
  }

  /**
   * Prunes detached objects whose parent chunks were recycled, fixing memory leak.
   */
  private pruneDetached(): void {
    const isAttached = (obj: THREE.Object3D | null | undefined): boolean => {
      if (!obj || !obj.parent) return false;
      let cur: THREE.Object3D = obj;
      while (cur.parent) {
        cur = cur.parent;
      }
      return cur.type === 'Scene';
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

    this.parliamentHugAndWinks = this.parliamentHugAndWinks.filter(hw => isAttached(hw.rahulFigure) && isAttached(hw.modiFigure));
    this.yatraMarchProcessions = this.yatraMarchProcessions.filter(p => isAttached(p.processionGroup));
    this.neverEndingYatras = this.neverEndingYatras.filter(ney => isAttached(ney.archGroup) && isAttached(ney.runnerRahul));
    this.microphoneChaoses = this.microphoneChaoses.filter(mc => isAttached(mc.tableGroup));
    this.pressScrums = this.pressScrums.filter(ps => isAttached(ps.scrumGroup));
    this.allianceChairsRunaways = this.allianceChairsRunaways.filter(ac => isAttached(ac.tableGroup));
    this.hugLoops = this.hugLoops.filter(hl => isAttached(hl.turntable) && isAttached(hl.modiFigure));
    this.selfieBattles = this.selfieBattles.filter(sb => isAttached(sb.cameraDrone) && isAttached(sb.chaiVendor));
    this.microphoneChases = this.microphoneChases.filter(mc => isAttached(mc.rollingMic) && isAttached(mc.modiFigure));
    this.partyOfficeMixups = this.partyOfficeMixups.filter(pom => isAttached(pom.revolvingPortal) && isAttached(pom.politicianFigure));
  }

  /**
   * Deterministic approach-aware 4-beat cycle calculation.
   * When approaching on the track (playerZ and gagWorldZ defined), maps the 75m approach window
   * across Beat 1 (Setup), Beat 2 (Approach/Anticipation), Beat 3 (PUNCHLINE in third-person view 38m->10m),
   * and Beat 4 (Reaction/hold as player passes).
   * Otherwise falls back cleanly to autonomous timer % cycleDuration.
   */
  public getGagCycle(timer: number, cycleDuration: number, gagWorldZ?: number, playerZ?: number): number {
    if (playerZ !== undefined && gagWorldZ !== undefined) {
      const distanceAhead = playerZ - gagWorldZ;
      // Approach window: from 75m ahead down to 15m past
      if (distanceAhead >= -15 && distanceAhead <= 75) {
        const approachT = (75 - distanceAhead) / 75; // 0.0 at 75m, 1.0 at 0m (passing)
        if (approachT < 0.25) {
          // Beat 1: Setup
          return (approachT / 0.25) * (cycleDuration * 0.25);
        } else if (approachT < 0.50) {
          // Beat 2: Anticipation / Approach
          return (cycleDuration * 0.25) + ((approachT - 0.25) / 0.25) * (cycleDuration * 0.25);
        } else if (approachT < 0.85) {
          // Beat 3: PAYOFF & PUNCHLINE (38m to 10m ahead, in full runner camera view!)
          return (cycleDuration * 0.50) + ((approachT - 0.50) / 0.35) * (cycleDuration * 0.25);
        } else {
          // Beat 4: Reaction & laugh hold as runner sweeps past
          return (cycleDuration * 0.75) + Math.min(1.0, (approachT - 0.85) / 0.35) * (cycleDuration * 0.25);
        }
      }
    }
    return timer % cycleDuration;
  }

  /**
   * Main animation loop update hook
   */
  public update(dt: number, isWorldActive: boolean = true, _playerZ?: number): void {
    if (!this.isEnabled || !isWorldActive) return;

    this.pruneDetached();

    const delta = Math.min(dt || 0.016, 0.1);
    this.globalClock += delta;

    const isReducedMotion = typeof window !== 'undefined' &&
      SettingsManager.getInstance().isReducedMotion();
    const motionMultiplier = isReducedMotion ? 0.35 : 1.0;

    // 1. Flip Board on Finish Line Arch & Exploding Confetti
    // Synchronized to player distance when running; continuous timer fallback when stationary
    for (let i = 0; i < this.flipBoards.length; i++) {
      const fb = this.flipBoards[i];
      let flipTarget: number;

      if (typeof _playerZ === 'number' && fb.pivotGroup.parent) {
        const wp = new THREE.Vector3();
        fb.pivotGroup.getWorldPosition(wp);
        const distAhead = _playerZ - wp.z; // positive when player is approaching from behind
        // Flip to "NEXT YATRA STARTS HERE" as player arrives within 28m, reset after passing by 16m
        if (distAhead <= 28.0 && distAhead >= -16.0) {
          flipTarget = Math.PI;
        } else {
          flipTarget = 0;
        }
      } else {
        const cycle = (this.globalClock * 0.35 * motionMultiplier) % 2.0;
        flipTarget = cycle > 1.0 ? Math.PI : 0;
      }

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

    // =======================================================================
    // 16. GATE A & GATE B POLITICAL MEME UNIVERSE GAG ANIMATIONS
    // =======================================================================

    // GATE A: The Parliament Hug & Wink
    // 7.0s cycle: Stride (0-2.2s) -> Bear Hug & Heart (2.2-3.8s) -> Turn & Wink + Cameraman Fall (3.8-5.4s) -> Recovery (5.4-7s)
    // Synchronized to oncoming player distance; smooth continuous fallback timer when stationary
    for (let i = 0; i < this.parliamentHugAndWinks.length; i++) {
      const g = this.parliamentHugAndWinks[i];
      g.timer += delta * motionMultiplier;

      const gagZ = (typeof g.worldZ === 'number')
        ? g.worldZ
        : (g.rahulFigure.parent ? g.rahulFigure.getWorldPosition(new THREE.Vector3()).z : undefined);
      const cycle = this.getGagCycle(g.timer, 7.0, gagZ, _playerZ);

      const rJoints = (g.rahulFigure.userData && g.rahulFigure.userData.joints) ? g.rahulFigure.userData.joints : null;
      const mJoints = (g.modiFigure.userData && g.modiFigure.userData.joints) ? g.modiFigure.userData.joints : null;

      if (cycle < 2.2) {
        // Stride across parliament floor
        const t = cycle / 2.2;
        g.rahulFigure.position.x = -2.8 + t * 2.1;
        g.rahulFigure.rotation.y = Math.PI * 0.5;
        g.rahulFigure.position.y = Math.abs(Math.sin(this.globalClock * 8.0)) * 0.15;
        g.modiSpectacles.position.y = 1.62; // Spectacles on Modi's face
        if (g.modiArmL) g.modiArmL.rotation.z = 0.3;
        if (g.modiArmR) g.modiArmR.rotation.z = -0.3;
        if (mJoints && mJoints.jaw) mJoints.jaw.position.y = -0.06;
        g.heartMesh.scale.set(0.01, 0.01, 0.01);
        g.eyebrowL.position.y = 0;
        g.eyelidL.scale.y = 1.0;
        g.sparkleStar.visible = false;
        g.cameramanFigure.rotation.x = 0;
        g.cameramanTripod.rotation.z = 0;
        if (g.gallerySpectators) {
          for (let s = 0; s < g.gallerySpectators.length; s++) {
            g.gallerySpectators[s].armL.rotation.z = 0.2;
            g.gallerySpectators[s].armR.rotation.z = -0.2;
          }
        }
        if (rJoints) {
          if (rJoints.legL) rJoints.legL.rotation.x = Math.sin(this.globalClock * 10.0) * 0.5;
          if (rJoints.legR) rJoints.legR.rotation.x = -Math.sin(this.globalClock * 10.0) * 0.5;
          if (rJoints.armL) rJoints.armL.rotation.x = -Math.sin(this.globalClock * 10.0) * 0.4;
          if (rJoints.armR) rJoints.armR.rotation.x = Math.sin(this.globalClock * 10.0) * 0.4;
          if (rJoints.headGroup) rJoints.headGroup.rotation.y = 0;
          if (rJoints.winkLid) rJoints.winkLid.scale.y = 1.0;
          if (rJoints.sparkleStar) rJoints.sparkleStar.visible = false;
        }
      } else if (cycle < 3.8) {
        // Bear Hug!
        g.rahulFigure.position.x = -0.7;
        g.rahulFigure.rotation.y = 0;
        g.rahulFigure.position.y = 0;
        // Modi spectacles pop up comically in surprise
        g.modiSpectacles.position.y = 1.62 + Math.abs(Math.sin((cycle - 2.2) * 5.0)) * 0.35;
        // Modi arms throw up in shock
        if (g.modiArmL) g.modiArmL.rotation.z = 1.2;
        if (g.modiArmR) g.modiArmR.rotation.z = -1.2;
        if (mJoints && mJoints.jaw) mJoints.jaw.position.y = -0.14; // Jaw drops in shock
        // Heart icon pulses above
        const heartPulse = 1.0 + Math.sin(this.globalClock * 10.0) * 0.25;
        g.heartMesh.scale.set(heartPulse, heartPulse, heartPulse);
        if (rJoints) {
          if (rJoints.armL) rJoints.armL.rotation.set(-0.8, 0.6, 0.4);
          if (rJoints.armR) rJoints.armR.rotation.set(-0.8, -0.6, -0.4);
          if (rJoints.elbowL) rJoints.elbowL.rotation.set(-0.5, 0.3, 0);
          if (rJoints.elbowR) rJoints.elbowR.rotation.set(-0.5, -0.3, 0);
          if (rJoints.legL) rJoints.legL.rotation.x = 0;
          if (rJoints.legR) rJoints.legR.rotation.x = 0;
        }
      } else if (cycle < 5.4) {
        // The Turn & Iconic Wink directly to player camera!
        g.rahulFigure.position.x = 0;
        g.rahulFigure.rotation.y = 0;
        g.heartMesh.scale.set(0.01, 0.01, 0.01);
        g.modiSpectacles.position.y = 1.62;
        if (g.modiArmL) g.modiArmL.rotation.z = 0.4;
        if (g.modiArmR) g.modiArmR.rotation.z = -0.4;
        if (mJoints && mJoints.jaw) mJoints.jaw.position.y = -0.06;

        // Eyebrow arches high, left eyelid snaps shut in wink
        g.eyebrowL.position.y = 0.16;
        g.eyelidL.scale.y = 0.08;

        // Sparkle star pops and spins
        g.sparkleStar.visible = true;
        g.sparkleStar.rotation.z += delta * 6.0;
        const spScale = 1.1 + Math.sin(this.globalClock * 12.0) * 0.3;
        g.sparkleStar.scale.set(spScale, spScale, spScale);

        if (rJoints) {
          if (rJoints.armR) rJoints.armR.rotation.set(-0.6, 0.2, 0.1);
          if (rJoints.elbowR) rJoints.elbowR.rotation.x = -0.4;
          if (rJoints.armL) rJoints.armL.rotation.set(0.2, 0, 0.3);
          if (rJoints.winkLid) rJoints.winkLid.scale.y = 0.08;
          if (rJoints.eyebrowL) rJoints.eyebrowL.position.y = 0.28;
          if (rJoints.sparkleStar) {
            rJoints.sparkleStar.visible = true;
            rJoints.sparkleStar.rotation.z += delta * 6.0;
          }
        }

        // Cameraman in press gallery topples backwards in shock!
        const fallT = Math.min(1.0, (cycle - 3.8) / 0.8);
        g.cameramanFigure.rotation.x = -Math.PI * 0.45 * fallT;
        g.cameramanTripod.rotation.z = -0.55 * fallT;

        // Spectator MPs throw their arms up in animated disbelief
        if (g.gallerySpectators) {
          for (let s = 0; s < g.gallerySpectators.length; s++) {
            g.gallerySpectators[s].armL.rotation.z = 1.3 * fallT;
            g.gallerySpectators[s].armR.rotation.z = -1.3 * fallT;
          }
        }
      } else {
        // Recovery
        const recT = (cycle - 5.4) / 1.6;
        g.eyebrowL.position.y = 0.16 * (1.0 - recT);
        g.eyelidL.scale.y = 0.08 + recT * 0.92;
        g.sparkleStar.visible = false;
        g.cameramanFigure.rotation.x = -Math.PI * 0.45 * (1.0 - recT);
        g.cameramanTripod.rotation.z = -0.55 * (1.0 - recT);
        if (rJoints) {
          if (rJoints.winkLid) rJoints.winkLid.scale.y = 0.08 + recT * 0.92;
          if (rJoints.eyebrowL) rJoints.eyebrowL.position.y = 0.24 + (1.0 - recT) * 0.04;
          if (rJoints.sparkleStar) rJoints.sparkleStar.visible = false;
        }
        if (g.gallerySpectators) {
          for (let s = 0; s < g.gallerySpectators.length; s++) {
            g.gallerySpectators[s].armL.rotation.z = 1.3 * (1.0 - recT);
            g.gallerySpectators[s].armR.rotation.z = -1.3 * (1.0 - recT);
          }
        }
      }
    }

    // GATE A: Moving Yatra March Procession with Animated Marchers & Support Van
    for (let i = 0; i < this.yatraMarchProcessions.length; i++) {
      const g = this.yatraMarchProcessions[i];
      g.timer += delta * motionMultiplier;
      const t = g.timer;

      // Animate Marchers with rhythmic high-knee strides
      for (let mIdx = 0; mIdx < g.marchers.length; mIdx++) {
        const m = g.marchers[mIdx];
        const marchPhase = t * 6.0 + m.phaseOffset;

        // Dynamic marching strides: legs swing back & forth
        m.legL.rotation.x = Math.sin(marchPhase) * 0.45;
        m.legR.rotation.x = -Math.sin(marchPhase) * 0.45;

        // Arms swing in counter-cadence
        m.armL.rotation.x = -Math.sin(marchPhase) * 0.45;
        m.armR.rotation.x = Math.sin(marchPhase) * 0.45;

        // Vertical step bounce
        m.figure.position.y = Math.abs(Math.sin(marchPhase * 2.0)) * 0.12;

        // Flags fluttering & swaying with march cadence
        if (m.flag) {
          m.flag.rotation.z = Math.sin(t * 3.5 + mIdx) * 0.15;
          m.flag.rotation.y = Math.cos(t * 4.0 + mIdx) * 0.18;
        }

        // Banners swaying
        if (m.banner) {
          m.banner.rotation.z = Math.sin(t * 2.5) * 0.08;
        }
      }

      // Leader waving arm from open platform
      if (g.leaderWavingArm) {
        g.leaderWavingArm.rotation.z = -0.5 + Math.sin(t * 6.0) * 0.45;
        g.leaderWavingArm.rotation.x = Math.sin(t * 4.0) * 0.15;
      }

      // Support van wheels rotating
      if (g.vanWheels) {
        for (let w = 0; w < g.vanWheels.length; w++) {
          g.vanWheels[w].rotation.x += delta * 6.0 * motionMultiplier;
        }
      }

      // Support van body suspension bounce
      if (g.vanGroup) {
        g.vanGroup.position.y = 0.6 + Math.sin(t * 8.0) * 0.04;
      }

      // Megaphone pulsing sound waves
      if (g.soundWaves) {
        for (let sw = 0; sw < g.soundWaves.length; sw++) {
          const wave = g.soundWaves[sw];
          const waveCycle = (t * 2.5 + sw * 0.3) % 1.0;
          wave.scale.set(1.0 + waveCycle * 1.5, 1.0 + waveCycle * 1.5, 1.0 + waveCycle * 1.5);
          if ((wave as THREE.Mesh).material) {
            const mat = (wave as THREE.Mesh).material as THREE.MeshBasicMaterial;
            mat.opacity = Math.max(0, 1.0 - waveCycle);
            mat.transparent = true;
          }
        }
      }
    }

    // GATE A: The Never-Ending Yatra Mechanical Flip & Infinite Map
    // 6.5s cycle: Sprint (0-2.5s) -> Ratchet Spin & Flip (2.5-3.5s) -> Map Unroll & Synchronized Disbelief (3.5-5s) -> Resume (5-6.5s)
    // Synchronized to player approach distance with continuous looping fallback
    for (let i = 0; i < this.neverEndingYatras.length; i++) {
      const g = this.neverEndingYatras[i];
      g.timer += delta * motionMultiplier;

      const gagZ = (typeof g.worldZ === 'number')
        ? g.worldZ
        : (g.archGroup.parent ? g.archGroup.getWorldPosition(new THREE.Vector3()).z : undefined);
      const cycle = this.getGagCycle(g.timer, 6.5, gagZ, _playerZ);

      const rJoints = (g.runnerRahul.userData && g.runnerRahul.userData.joints) ? g.runnerRahul.userData.joints : null;

      if (cycle < 2.5) {
        // Sprint towards finish arch
        const t = cycle / 2.5;
        g.runnerRahul.position.z = -12.0 + t * 10.0;
        g.runnerRahul.position.y = Math.abs(Math.sin(this.globalClock * 12.0)) * 0.2;
        g.flipBanner.rotation.x = 0;
        g.accordionMap.scale.z = 0.05;
        if (g.sweatTowel) g.sweatTowel.visible = false;
        g.runnerRahul.rotation.y = 0;
        g.archGroup.position.z = 0;

        if (rJoints) {
          if (rJoints.legL) rJoints.legL.rotation.x = Math.sin(this.globalClock * 12.0) * 0.7;
          if (rJoints.legR) rJoints.legR.rotation.x = -Math.sin(this.globalClock * 12.0) * 0.7;
          if (rJoints.armL) rJoints.armL.rotation.x = -Math.sin(this.globalClock * 12.0) * 0.6;
          if (rJoints.armR) rJoints.armR.rotation.x = Math.sin(this.globalClock * 12.0) * 0.6;
          if (rJoints.elbowL) rJoints.elbowL.rotation.x = -0.5;
          if (rJoints.elbowR) rJoints.elbowR.rotation.x = -0.5;
        }

        // Crowd jumps and waves in victory celebration anticipation
        if (g.crowdMembers) {
          for (let c = 0; c < g.crowdMembers.length; c++) {
            const cm = g.crowdMembers[c];
            cm.group.position.y = cm.baseY + Math.abs(Math.sin(this.globalClock * 8.0 + c * 1.2)) * 0.25;
            cm.armL.rotation.z = 0.6 + Math.sin(this.globalClock * 10.0 + c) * 0.4;
            cm.armR.rotation.z = -0.6 - Math.sin(this.globalClock * 10.0 + c) * 0.4;
            cm.head.rotation.y = Math.sin(this.globalClock * 4.0 + c) * 0.15;
          }
        }
      } else if (cycle < 3.5) {
        // Ratchet gear spins furiously & arch mechanically rolls farther away!
        g.ratchetGear.rotation.z += delta * 20.0;
        const flipT = (cycle - 2.5) / 1.0;
        g.flipBanner.rotation.x = flipT * Math.PI; // 180° flip to STARTING LINE 2
        g.archGroup.position.z = -flipT * 3.0; // Arch rolls backwards comically!

        if (rJoints) {
          if (rJoints.legL) rJoints.legL.rotation.x = 0;
          if (rJoints.legR) rJoints.legR.rotation.x = 0;
          if (rJoints.armL) rJoints.armL.rotation.set(-0.8, 0, 0.4);
          if (rJoints.armR) rJoints.armR.rotation.set(-0.8, 0, -0.4);
        }

        // Crowd freezes in shock
        if (g.crowdMembers) {
          for (let c = 0; c < g.crowdMembers.length; c++) {
            const cm = g.crowdMembers[c];
            cm.group.position.y = cm.baseY;
            cm.armL.rotation.z = 0.1;
            cm.armR.rotation.z = -0.1;
          }
        }
      } else if (cycle < 5.0) {
        // Accordion map unrolls across horizon; runner does double take
        g.flipBanner.rotation.x = Math.PI;
        const mapT = (cycle - 3.5) / 1.5;
        g.accordionMap.scale.z = 0.05 + mapT * 1.8;
        // Head shakes left-right in classic cartoon double-take
        g.runnerRahul.rotation.y = Math.sin(this.globalClock * 12.0) * 0.45;

        if (rJoints && rJoints.headGroup) {
          rJoints.headGroup.rotation.y = Math.sin(this.globalClock * 12.0) * 0.5;
        }

        // Synchronized disbelief: crowd drops arms and shakes heads in disbelief
        if (g.crowdMembers) {
          for (let c = 0; c < g.crowdMembers.length; c++) {
            const cm = g.crowdMembers[c];
            cm.group.position.y = cm.baseY;
            cm.armL.rotation.z = 0.05;
            cm.armR.rotation.z = -0.05;
            cm.head.rotation.y = Math.sin(this.globalClock * 6.0) * 0.35;
          }
        }
      } else {
        // Wipes brow, shrugs, and jogs forward along loop!
        g.flipBanner.rotation.x = Math.PI;
        if (g.sweatTowel) g.sweatTowel.visible = true;
        g.runnerRahul.rotation.y = 0;
        const jogT = (cycle - 5.0) / 1.5;
        g.runnerRahul.position.z = -2.0 + jogT * 3.0;
        g.runnerRahul.position.y = Math.abs(Math.sin(this.globalClock * 8.0)) * 0.15;

        if (rJoints) {
          if (rJoints.headGroup) rJoints.headGroup.rotation.y = 0;
          if (rJoints.legL) rJoints.legL.rotation.x = Math.sin(this.globalClock * 8.0) * 0.4;
          if (rJoints.legR) rJoints.legR.rotation.x = -Math.sin(this.globalClock * 8.0) * 0.4;
          if (rJoints.armR) rJoints.armR.rotation.set(-1.2, 0, 0.3); // wiping brow
        }

        if (g.crowdMembers) {
          for (let c = 0; c < g.crowdMembers.length; c++) {
            const cm = g.crowdMembers[c];
            cm.group.position.y = cm.baseY;
            cm.armL.rotation.z = 0.1;
            cm.armR.rotation.z = -0.1;
            cm.head.rotation.y = 0;
          }
        }
      }
    }

    // GATE B: Parliamentary Microphone Chaos
    for (let i = 0; i < this.microphoneChaoses.length; i++) {
      const g = this.microphoneChaoses[i];
      g.timer += delta * motionMultiplier;
      g.mics.forEach((m, idx) => {
        // Microphones bend, duck, and nod at each other in debate
        const bend = Math.sin(this.globalClock * 4.0 + idx * 1.5) * 0.35;
        m.stem.rotation.z = bend;
        m.head.rotation.y = Math.sin(this.globalClock * 5.0 + idx) * 0.5;
        if (m.wheels) {
          m.wheels.rotation.x += delta * 4.0;
        }
      });
    }

    // GATE B: The Great Press Scrum Daisy-Chain
    for (let i = 0; i < this.pressScrums.length; i++) {
      const g = this.pressScrums[i];
      g.timer += delta * motionMultiplier;
      g.reporters.forEach((r, idx) => {
        // Reporters interviewing each other in a circle, arms lunging forward with mics
        const lunge = 0.3 + Math.sin(this.globalClock * 4.0 + idx * 1.2) * 0.15;
        r.micArm.position.z = lunge;
        r.group.rotation.y = r.baseAngle + Math.sin(this.globalClock * 3.0 + idx) * 0.15;
      });
    }

    // GATE B: The Alliance Musical Chairs with Running Legs
    // Synchronized to oncoming player: dignified rotation -> chairs run away -> leaders squeeze
    for (let i = 0; i < this.allianceChairsRunaways.length; i++) {
      const g = this.allianceChairsRunaways[i];
      g.timer += delta * motionMultiplier;

      // Nitish chair in continuous 360-degree comical swivel
      g.nitishChair.rotation.y += delta * 2.8;

      let scamperPhase: number;
      let isScramble: boolean = false;

      if (typeof _playerZ === 'number' && g.tableGroup.parent) {
        const wp = new THREE.Vector3();
        g.tableGroup.getWorldPosition(wp);
        const distanceAhead = _playerZ - wp.z;
        if (distanceAhead > -10.0 && distanceAhead < 55.0) {
          isScramble = distanceAhead < 18.0;
          scamperPhase = (55.0 - distanceAhead) * 0.15;
        } else {
          scamperPhase = this.globalClock * 1.8;
          isScramble = ((this.globalClock * 0.4) % 2.0) > 1.2;
        }
      } else {
        scamperPhase = this.globalClock * 1.8;
        isScramble = ((this.globalClock * 0.4) % 2.0) > 1.2;
      }

      // Chairs with legs scampering around table or scrambling for front seat
      g.runningChairs.forEach((rc, idx) => {
        const scamper = scamperPhase * 3.0 + idx * 1.5;
        if (!isScramble) {
          rc.chair.position.x = Math.sin(scamper * 0.4 + rc.baseAngle) * 3.2;
          rc.chair.position.z = Math.cos(scamper * 0.4 + rc.baseAngle) * 3.2;
          rc.chair.rotation.y = -scamper * 0.4 - rc.baseAngle + Math.PI * 0.5;
        } else {
          // Scramble for front seat!
          const targetX = -1.5 + idx * 1.0;
          const targetZ = 1.4;
          rc.chair.position.x += (targetX - rc.chair.position.x) * 0.12;
          rc.chair.position.z += (targetZ - rc.chair.position.z) * 0.12;
          rc.chair.rotation.y = 0;
        }
        rc.legL.rotation.x = Math.sin(scamper * 4.0) * 0.5;
        rc.legR.rotation.x = -Math.sin(scamper * 4.0) * 0.5;
      });
    }

    // CROSSOVERS (Shared Animation Logic)
    for (let i = 0; i < this.hugLoops.length; i++) {
      const g = this.hugLoops[i];
      g.timer += delta * motionMultiplier;
      g.turntable.rotation.y += delta * 1.2;

      const cycle = g.timer % 6.0;
      if (cycle > 2.2 && cycle < 4.2) {
        g.modiFigure.position.x = -0.35;
        g.rahulFigure.position.x = 0.35;
        const pulse = 1.0 + Math.sin(this.globalClock * 10.0) * 0.25;
        g.heartIcon.scale.set(pulse, pulse, pulse);
      } else {
        g.modiFigure.position.x = -1.2;
        g.rahulFigure.position.x = 1.2;
        g.heartIcon.scale.set(0.01, 0.01, 0.01);
      }
    }

    for (let i = 0; i < this.selfieBattles.length; i++) {
      const g = this.selfieBattles[i];
      g.timer += delta * motionMultiplier;
      const cycle = g.timer % 6.0;

      if (cycle < 3.0) {
        g.cameraDrone.position.y = 3.5 + Math.sin(this.globalClock * 2.5) * 0.25;
        g.cameraDrone.position.z = 2.0;
        g.cameraDrone.rotation.x = 0.3;
        g.modiFigure.rotation.y = 0.35;
        g.rahulFigure.rotation.y = -0.35;
        g.flashLight.scale.set(0.01, 0.01, 0.01);
      } else if (cycle < 4.5) {
        g.cameraDrone.position.y = 1.8;
        g.cameraDrone.position.z = 1.2;
        g.cameraDrone.rotation.x = 0;
        const isFlash = (cycle - 3.0 < 0.25) || (cycle - 3.0 > 0.5 && cycle - 3.0 < 0.75);
        if (isFlash) {
          g.flashLight.scale.set(1.6, 1.6, 1.6);
        } else {
          g.flashLight.scale.set(0.01, 0.01, 0.01);
        }
      } else {
        g.flashLight.scale.set(0.01, 0.01, 0.01);
        g.chaiVendor.rotation.y = Math.sin(this.globalClock * 4.0) * 0.15;
        g.modiFigure.rotation.y = 1.2;
        g.rahulFigure.rotation.y = -1.2;
      }
    }

    for (let i = 0; i < this.microphoneChases.length; i++) {
      const g = this.microphoneChases[i];
      g.timer += delta * motionMultiplier;
      const cycle = g.timer % 6.5;

      if (cycle < 3.2) {
        const t = cycle / 3.2;
        g.rollingMic.position.z = -3.5 + t * 7.0;
        g.rollingMic.rotation.y = 0;
        g.modiFigure.position.z = g.rollingMic.position.z - 1.4;
        g.rahulFigure.position.z = g.rollingMic.position.z - 2.2;
        g.modiFigure.rotation.x = -0.4;
        g.rahulFigure.rotation.x = -0.4;
      } else if (cycle < 4.5) {
        g.rollingMic.rotation.y = Math.PI;
        g.rollingMic.rotation.z = Math.sin(this.globalClock * 12.0) * 0.22;
        g.modiFigure.rotation.x = 0.3;
        g.rahulFigure.rotation.x = 0.3;
      } else {
        const revT = (cycle - 4.5) / 2.0;
        g.rollingMic.position.z = 3.5 - revT * 7.0;
        g.modiFigure.rotation.y = Math.PI * 0.5;
        g.rahulFigure.rotation.y = -Math.PI * 0.5;
      }
    }

    for (let i = 0; i < this.partyOfficeMixups.length; i++) {
      const g = this.partyOfficeMixups[i];
      g.timer += delta * motionMultiplier;
      g.revolvingPortal.rotation.y += delta * 2.2;
      const cycle = g.timer % 6.0;

      if (cycle < 2.0) {
        g.politicianFigure.position.z = -2.0 + cycle;
        g.politicianFigure.rotation.y = 0;
      } else if (cycle < 4.0) {
        g.politicianFigure.position.z = 0;
        g.politicianFigure.rotation.y = (cycle - 2.0) * Math.PI;
      } else {
        g.politicianFigure.position.z = (cycle - 4.0) * 1.2;
        g.politicianFigure.rotation.z = Math.sin(this.globalClock * 6.0) * 0.2;
      }
    }
  }
}
