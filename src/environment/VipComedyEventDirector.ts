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

export interface AnimatedParliamentPaper {
  mesh: THREE.Object3D;
  baseY: number;
  baseZ: number;
  speed: number;
  phase: number;
}

export interface AnimatedCountdownBoard {
  mesh: THREE.Object3D;
  material: THREE.Material;
  timer: number;
}

export interface AnimatedRunawayDecoy {
  group: THREE.Object3D;
  cameraCrew: THREE.Object3D;
  baseZ: number;
  speed: number;
}

// ---------------------------------------------------------------------------
// SIGNATURE CINEMATIC SATIRE GAG INTERFACES (MITRON EXPRESS 2.0)
// ---------------------------------------------------------------------------

/** Gag 1: Monumental Teacup Unveiling (District A) */
export interface AnimatedTeacupReveal {
  curtainLeft: THREE.Object3D;
  curtainRight: THREE.Object3D;
  pedestalCup: THREE.Object3D;
  spotlights: THREE.Object3D[];
  vips: THREE.Object3D[];
  timer: number;
}

/** Gag 2: Kettle Mechanical Pourer & Arguing VIPs (District A) */
export interface AnimatedKettlePour {
  kettleGroup: THREE.Object3D;
  kettleSpout: THREE.Object3D;
  teaStream: THREE.Object3D;
  politicianL: THREE.Object3D;
  politicianR: THREE.Object3D;
  vendorGlass: THREE.Object3D;
  timer: number;
}

/** Gag 3: Recursive Scissors Inauguration (District B) */
export interface AnimatedRecursiveScissors {
  shears1L: THREE.Object3D;
  shears1R: THREE.Object3D;
  shears2L: THREE.Object3D;
  shears2R: THREE.Object3D;
  craneGroup: THREE.Object3D;
  rapidRibbonArm: THREE.Object3D;
  ribbonMesh: THREE.Object3D;
  timer: number;
}

/** Gag 4: Prime-Time Remote Revelation (District C) */
export interface AnimatedRemoteRevelation {
  vaultLid: THREE.Object3D;
  craneWinch: THREE.Object3D;
  remoteMesh: THREE.Object3D;
  debateScreens: THREE.Object3D[];
  anchorNPC: THREE.Object3D;
  timer: number;
}

/** Gag 5: Masterstroke Loading Machine (District D) */
export interface AnimatedMasterstrokeMachine {
  vaultDoorL: THREE.Object3D;
  vaultDoorR: THREE.Object3D;
  dialNeedle: THREE.Object3D;
  steamHiss: THREE.Object3D;
  deliveryArm: THREE.Object3D;
  tinyObject: THREE.Object3D;
  timer: number;
}

/** Gag 6: Giant Political Chessboard (District D) */
export interface AnimatedChessboardMatch {
  craneGantry: THREE.Object3D;
  grandPiece: THREE.Object3D;
  teaVendorCart: THREE.Object3D;
  timer: number;
}

/** Gag 7: Microphone Showdown & Self-Interview (District E) */
export interface AnimatedMicrophoneShowdown {
  centerMic: THREE.Object3D;
  micLeft: THREE.Object3D;
  micRight: THREE.Object3D;
  leaderLeft: THREE.Object3D;
  leaderRight: THREE.Object3D;
  timer: number;
}

/** Gag 8: Coalition Musical-Chairs Carousel (District E) */
export interface AnimatedCoalitionCarousel {
  carouselPlatform: THREE.Object3D;
  nitishChair: THREE.Object3D;
  politicians: THREE.Object3D[];
  timer: number;
}

// ---------------------------------------------------------------------------
// GATE A & GATE B POLITICAL MEME UNIVERSE GAG INTERFACES (MODI & CROSSOVERS)
// ---------------------------------------------------------------------------

/** Gate A: The Mango Interview — Superstar Mango with Sunglasses & Swiveling Cameras */
export interface AnimatedMangoInterview {
  stageGroup: THREE.Object3D;
  clocheMesh: THREE.Object3D;
  mangoMesh: THREE.Object3D;
  sunglassesMesh: THREE.Object3D;
  cameras: THREE.Object3D[];
  spotlights: THREE.Object3D[];
  modiFigure: THREE.Object3D;
  interviewerFigure: THREE.Object3D;
  clipboardModi?: THREE.Object3D;
  clipboardInterviewer?: THREE.Object3D;
  sparkleMesh?: THREE.Object3D;
  timer: number;
}

/** Gate B: The Kedarnath Meditation Photo-Shoot Paradox */
export interface AnimatedMeditationParadox {
  caveTurntable: THREE.Object3D;
  modiFigure: THREE.Object3D;
  cameraDollies: THREE.Object3D[];
  softboxUmbrellas: THREE.Object3D[];
  directorFigure?: THREE.Object3D;
  timer: number;
}

/** Gate B: The 360° Camera Magnet */
export interface AnimatedCameraMagnet {
  modiFigure: THREE.Object3D;
  photographers: { group: THREE.Object3D; camera: THREE.Object3D; baseAngle: number }[];
  timer: number;
}

/** Gate B: The Hug Diplomacy Machine */
export interface AnimatedHugDiplomacy {
  hydraulicBase: THREE.Object3D;
  armLeft: THREE.Object3D;
  armRight: THREE.Object3D;
  targetDignitary: THREE.Object3D;
  heartIcon?: THREE.Object3D;
  timer: number;
}

/** Crossover 1: The Hug Loop */
export interface AnimatedHugLoop {
  turntable: THREE.Object3D;
  modiFigure: THREE.Object3D;
  rahulFigure: THREE.Object3D;
  heartIcon: THREE.Object3D;
  timer: number;
}

/** Crossover 2: The Selfie Battle & Chai Vendor Twist */
export interface AnimatedSelfieBattle {
  modiFigure: THREE.Object3D;
  rahulFigure: THREE.Object3D;
  cameraDrone: THREE.Object3D;
  chaiVendor: THREE.Object3D;
  flashLight: THREE.Object3D;
  timer: number;
}

/** Crossover 3: The Runaway Microphone Chase */
export interface AnimatedMicrophoneChase {
  rollingMic: THREE.Object3D;
  modiFigure: THREE.Object3D;
  rahulFigure: THREE.Object3D;
  timer: number;
}

/** Crossover 4: The Party Office Mix-Up */
export interface AnimatedPartyOfficeMixup {
  revolvingPortal: THREE.Object3D;
  politicianFigure: THREE.Object3D;
  signA: THREE.Object3D;
  signB: THREE.Object3D;
  timer: number;
}

/** Roadshow Royale: Spectacular Moving Political Float with Modi waving, petal cannons, and loudspeakers */
export interface AnimatedRoadshowFloat {
  floatGroup: THREE.Object3D;
  modiFigure: THREE.Object3D;
  armRight: THREE.Object3D;
  head: THREE.Object3D;
  petals: THREE.Object3D[];
  petalBaseY: number[];
  loudspeakers: THREE.Object3D[];
  commandos: THREE.Object3D[];
  timer: number;
}

/** Roadshow Royale: Motorcade Pilot Escort SUV with flashing amber/red strobes */
export interface AnimatedPilotEscort {
  suvGroup: THREE.Object3D;
  strobeAmber: THREE.Mesh;
  strobeRed: THREE.Mesh;
  timer: number;
}

/** Roadshow Royale: Animated Cheering Crowd Member waving flags and popping flashbulbs */
export interface AnimatedCrowdMember {
  memberGroup: THREE.Object3D;
  wavingArm?: THREE.Object3D;
  flagMesh?: THREE.Object3D;
  flashMesh?: THREE.Object3D;
  phase: number;
  speed: number;
}

/**
 * VipComedyEventDirector
 * Dedicated coordinator for procedural, animated political satire gags
 * across all five comedy districts in the Mitron Express / VIP Express signature world.
 *
 * Implements theatrical, readable comic timing:
 * 1. Setup / Anticipation (calm before the storm, builds curiosity)
 * 2. Unexpected Twist (the absurd mechanical or situational shift)
 * 3. Theatrical Punchline (the hilarious reveal)
 * 4. Slapstick Reaction Hold (gives the runner time to laugh)
 * 5. Deterministic reset & cooldown
 */
export class VipComedyEventDirector {
  private static instance: VipComedyEventDirector;

  // Background ambient comic elements
  private scissorsList: AnimatedScissor[] = [];
  private debatersList: AnimatedDebater[] = [];
  private steamList: AnimatedSteam[] = [];
  private flashList: AnimatedCameraFlash[] = [];
  private helicopterList: AnimatedHelicopter[] = [];
  private gavelList: AnimatedGavel[] = [];
  private papersList: AnimatedParliamentPaper[] = [];
  private countdownList: AnimatedCountdownBoard[] = [];
  private runawayList: AnimatedRunawayDecoy[] = [];

  // Signature cinematic satirical gags
  private teacupRevealList: AnimatedTeacupReveal[] = [];
  private kettlePourList: AnimatedKettlePour[] = [];
  private recursiveScissorsList: AnimatedRecursiveScissors[] = [];
  private remoteRevelationList: AnimatedRemoteRevelation[] = [];
  private masterstrokeMachineList: AnimatedMasterstrokeMachine[] = [];
  private chessboardMatchList: AnimatedChessboardMatch[] = [];
  private microphoneShowdownList: AnimatedMicrophoneShowdown[] = [];
  private coalitionCarouselList: AnimatedCoalitionCarousel[] = [];

  // Meme Universe & Crossover Gags
  private mangoInterviewList: AnimatedMangoInterview[] = [];
  private meditationParadoxList: AnimatedMeditationParadox[] = [];
  private cameraMagnetList: AnimatedCameraMagnet[] = [];
  private hugDiplomacyList: AnimatedHugDiplomacy[] = [];
  private hugLoopList: AnimatedHugLoop[] = [];
  private selfieBattleList: AnimatedSelfieBattle[] = [];
  private microphoneChaseList: AnimatedMicrophoneChase[] = [];
  private partyOfficeMixupList: AnimatedPartyOfficeMixup[] = [];

  // Roadshow Royale Animations
  private roadshowFloatList: AnimatedRoadshowFloat[] = [];
  private pilotEscortList: AnimatedPilotEscort[] = [];
  private crowdMemberList: AnimatedCrowdMember[] = [];

  private globalClock: number = 0;
  private isEnabled: boolean = true;
  private regCounter: number = 0;

  private constructor() {}

  public static getInstance(): VipComedyEventDirector {
    if (!VipComedyEventDirector.instance) {
      VipComedyEventDirector.instance = new VipComedyEventDirector();
    }
    return VipComedyEventDirector.instance;
  }

  private getDeterministicPhase(): number {
    this.regCounter = (this.regCounter + 1) % 1000;
    return ((this.regCounter * 1.6180339887) % 1) * Math.PI * 2;
  }

  // =========================================================================
  // BASELINE REGISTRATION (Preserves all existing contracts)
  // =========================================================================

  public registerScissors(leftBlade: THREE.Object3D, rightBlade: THREE.Object3D, speed: number = 3.5): void {
    this.scissorsList.push({
      leftBlade,
      rightBlade,
      speed,
      offset: this.getDeterministicPhase() * 0.5
    });
  }

  public registerDebater(arm1: THREE.Object3D, arm2: THREE.Object3D, head?: THREE.Object3D, speed: number = 4.0): void {
    this.debatersList.push({
      arm1,
      arm2,
      head,
      speed,
      phase: this.getDeterministicPhase()
    });
  }

  public registerSteam(mesh: THREE.Object3D, height: number = 4.0): void {
    const phase = this.getDeterministicPhase();
    this.steamList.push({
      mesh,
      initialY: mesh.position.y,
      maxY: mesh.position.y + height,
      speedY: 1.8 + ((phase / (Math.PI * 2)) * 0.8),
      phase
    });
  }

  public registerCameraFlash(mesh: THREE.Object3D, light?: THREE.PointLight): void {
    const phase = this.getDeterministicPhase();
    this.flashList.push({
      mesh,
      light,
      flashTimer: 0,
      nextFlash: 0.2 + ((phase / (Math.PI * 2)) * 0.8)
    });
  }

  public registerHelicopter(group: THREE.Object3D, rotor: THREE.Object3D): void {
    this.helicopterList.push({
      group,
      rotor,
      baseY: group.position.y,
      baseX: group.position.x,
      phase: this.getDeterministicPhase() * 0.5
    });
  }

  public registerGavel(mesh: THREE.Object3D): void {
    this.gavelList.push({
      mesh,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 2.0
    });
  }

  public registerParliamentPaper(mesh: THREE.Object3D, baseY: number, baseZ: number, speed: number = 2.5): void {
    this.papersList.push({
      mesh,
      baseY,
      baseZ,
      speed,
      phase: this.getDeterministicPhase()
    });
  }

  public registerCountdownBoard(mesh: THREE.Object3D, material: THREE.Material): void {
    this.countdownList.push({
      mesh,
      material,
      timer: 0
    });
  }

  public registerRunawayDecoy(group: THREE.Object3D, cameraCrew: THREE.Object3D, speed: number = 1.2): void {
    this.runawayList.push({
      group,
      cameraCrew,
      baseZ: group.position.z,
      speed
    });
  }

  // =========================================================================
  // SIGNATURE CINEMATIC SATIRE GAG REGISTRATIONS
  // =========================================================================

  public registerTeacupReveal(
    curtainLeft: THREE.Object3D,
    curtainRight: THREE.Object3D,
    pedestalCup: THREE.Object3D,
    spotlights: THREE.Object3D[],
    vips: THREE.Object3D[]
  ): void {
    this.teacupRevealList.push({
      curtainLeft,
      curtainRight,
      pedestalCup,
      spotlights,
      vips,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 6.0
    });
  }

  public registerKettlePour(
    kettleGroup: THREE.Object3D,
    kettleSpout: THREE.Object3D,
    teaStream: THREE.Object3D,
    politicianL: THREE.Object3D,
    politicianR: THREE.Object3D,
    vendorGlass: THREE.Object3D
  ): void {
    this.kettlePourList.push({
      kettleGroup,
      kettleSpout,
      teaStream,
      politicianL,
      politicianR,
      vendorGlass,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 7.0
    });
  }

  public registerRecursiveScissors(
    shears1L: THREE.Object3D,
    shears1R: THREE.Object3D,
    shears2L: THREE.Object3D,
    shears2R: THREE.Object3D,
    craneGroup: THREE.Object3D,
    rapidRibbonArm: THREE.Object3D,
    ribbonMesh: THREE.Object3D
  ): void {
    this.recursiveScissorsList.push({
      shears1L,
      shears1R,
      shears2L,
      shears2R,
      craneGroup,
      rapidRibbonArm,
      ribbonMesh,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 6.5
    });
  }

  public registerRemoteRevelation(
    vaultLid: THREE.Object3D,
    craneWinch: THREE.Object3D,
    remoteMesh: THREE.Object3D,
    debateScreens: THREE.Object3D[],
    anchorNPC: THREE.Object3D
  ): void {
    this.remoteRevelationList.push({
      vaultLid,
      craneWinch,
      remoteMesh,
      debateScreens,
      anchorNPC,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 6.0
    });
  }

  public registerMasterstrokeMachine(
    vaultDoorL: THREE.Object3D,
    vaultDoorR: THREE.Object3D,
    dialNeedle: THREE.Object3D,
    steamHiss: THREE.Object3D,
    deliveryArm: THREE.Object3D,
    tinyObject: THREE.Object3D
  ): void {
    this.masterstrokeMachineList.push({
      vaultDoorL,
      vaultDoorR,
      dialNeedle,
      steamHiss,
      deliveryArm,
      tinyObject,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 7.5
    });
  }

  public registerChessboardMatch(
    craneGantry: THREE.Object3D,
    grandPiece: THREE.Object3D,
    teaVendorCart: THREE.Object3D
  ): void {
    this.chessboardMatchList.push({
      craneGantry,
      grandPiece,
      teaVendorCart,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 8.0
    });
  }

  public registerMicrophoneShowdown(
    centerMic: THREE.Object3D,
    micLeft: THREE.Object3D,
    micRight: THREE.Object3D,
    leaderLeft: THREE.Object3D,
    leaderRight: THREE.Object3D
  ): void {
    this.microphoneShowdownList.push({
      centerMic,
      micLeft,
      micRight,
      leaderLeft,
      leaderRight,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 6.5
    });
  }

  public registerCoalitionCarousel(
    carouselPlatform: THREE.Object3D,
    nitishChair: THREE.Object3D,
    politicians: THREE.Object3D[]
  ): void {
    this.coalitionCarouselList.push({
      carouselPlatform,
      nitishChair,
      politicians,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 8.0
    });
  }

  // =========================================================================
  // GATE A & GATE B REGISTRATION METHODS
  // =========================================================================

  public registerMangoInterview(
    stageGroup: THREE.Object3D,
    clocheMesh: THREE.Object3D,
    mangoMesh: THREE.Object3D,
    sunglassesMesh: THREE.Object3D,
    cameras: THREE.Object3D[],
    spotlights: THREE.Object3D[],
    modiFigure: THREE.Object3D,
    interviewerFigure: THREE.Object3D,
    sparkleMesh?: THREE.Object3D
  ): void {
    this.mangoInterviewList.push({
      stageGroup,
      clocheMesh,
      mangoMesh,
      sunglassesMesh,
      cameras,
      spotlights,
      modiFigure,
      interviewerFigure,
      sparkleMesh,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 6.5
    });
  }

  public registerMeditationParadox(
    caveTurntable: THREE.Object3D,
    modiFigure: THREE.Object3D,
    cameraDollies: THREE.Object3D[],
    softboxUmbrellas: THREE.Object3D[],
    directorFigure?: THREE.Object3D
  ): void {
    this.meditationParadoxList.push({
      caveTurntable,
      modiFigure,
      cameraDollies,
      softboxUmbrellas,
      directorFigure,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 7.0
    });
  }

  public registerCameraMagnet(
    modiFigure: THREE.Object3D,
    photographers: { group: THREE.Object3D; camera: THREE.Object3D; baseAngle: number }[]
  ): void {
    this.cameraMagnetList.push({
      modiFigure,
      photographers,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 5.0
    });
  }

  public registerHugDiplomacy(
    hydraulicBase: THREE.Object3D,
    armLeft: THREE.Object3D,
    armRight: THREE.Object3D,
    targetDignitary: THREE.Object3D,
    heartIcon?: THREE.Object3D
  ): void {
    this.hugDiplomacyList.push({
      hydraulicBase,
      armLeft,
      armRight,
      targetDignitary,
      heartIcon,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 6.0
    });
  }

  public registerHugLoop(
    turntable: THREE.Object3D,
    modiFigure: THREE.Object3D,
    rahulFigure: THREE.Object3D,
    heartIcon: THREE.Object3D
  ): void {
    this.hugLoopList.push({
      turntable,
      modiFigure,
      rahulFigure,
      heartIcon,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 6.0
    });
  }

  public registerSelfieBattle(
    modiFigure: THREE.Object3D,
    rahulFigure: THREE.Object3D,
    cameraDrone: THREE.Object3D,
    chaiVendor: THREE.Object3D,
    flashLight: THREE.Object3D
  ): void {
    this.selfieBattleList.push({
      modiFigure,
      rahulFigure,
      cameraDrone,
      chaiVendor,
      flashLight,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 6.0
    });
  }

  public registerMicrophoneChase(
    rollingMic: THREE.Object3D,
    modiFigure: THREE.Object3D,
    rahulFigure: THREE.Object3D
  ): void {
    this.microphoneChaseList.push({
      rollingMic,
      modiFigure,
      rahulFigure,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 6.5
    });
  }

  public registerPartyOfficeMixup(
    revolvingPortal: THREE.Object3D,
    politicianFigure: THREE.Object3D,
    signA: THREE.Object3D,
    signB: THREE.Object3D
  ): void {
    this.partyOfficeMixupList.push({
      revolvingPortal,
      politicianFigure,
      signA,
      signB,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 6.0
    });
  }

  // --- Roadshow Royale Registrations ---
  public registerRoadshowFloat(
    floatGroup: THREE.Object3D,
    modiFigure: THREE.Object3D,
    armRight: THREE.Object3D,
    head: THREE.Object3D,
    petals: THREE.Object3D[],
    petalBaseY: number[],
    loudspeakers: THREE.Object3D[],
    commandos: THREE.Object3D[]
  ): void {
    this.roadshowFloatList.push({
      floatGroup,
      modiFigure,
      armRight,
      head,
      petals,
      petalBaseY,
      loudspeakers,
      commandos,
      timer: (this.getDeterministicPhase() / (Math.PI * 2)) * 4.0
    });
  }

  public registerPilotEscort(
    suvGroup: THREE.Object3D,
    strobeAmber: THREE.Mesh,
    strobeRed: THREE.Mesh
  ): void {
    this.pilotEscortList.push({
      suvGroup,
      strobeAmber,
      strobeRed,
      timer: this.getDeterministicPhase()
    });
  }

  public registerCrowdMember(
    memberGroup: THREE.Object3D,
    wavingArm?: THREE.Object3D,
    flagMesh?: THREE.Object3D,
    flashMesh?: THREE.Object3D,
    speed: number = 3.5
  ): void {
    this.crowdMemberList.push({
      memberGroup,
      wavingArm,
      flagMesh,
      flashMesh,
      phase: this.getDeterministicPhase(),
      speed
    });
  }

  // --- Public Diagnostics Getters ---
  public getScissorsCount(): number { return this.scissorsList.length; }
  public getDebatersCount(): number { return this.debatersList.length; }
  public getSteamCount(): number { return this.steamList.length; }
  public getFlashCount(): number { return this.flashList.length; }
  public getHelicopterCount(): number { return this.helicopterList.length; }
  public getGavelCount(): number { return this.gavelList.length; }
  public getPapersCount(): number { return this.papersList.length; }
  public getCountdownCount(): number { return this.countdownList.length; }
  public getRunawayDecoyCount(): number { return this.runawayList.length; }

  // New cinematic getters
  public getTeacupRevealCount(): number { return this.teacupRevealList.length; }
  public getKettlePourCount(): number { return this.kettlePourList.length; }
  public getRecursiveScissorsCount(): number { return this.recursiveScissorsList.length; }
  public getRemoteRevelationCount(): number { return this.remoteRevelationList.length; }
  public getMasterstrokeMachineCount(): number { return this.masterstrokeMachineList.length; }
  public getChessboardMatchCount(): number { return this.chessboardMatchList.length; }
  public getMicrophoneShowdownCount(): number { return this.microphoneShowdownList.length; }
  public getCoalitionCarouselCount(): number { return this.coalitionCarouselList.length; }

  // Gate A & B Getters
  public getMangoInterviewCount(): number { return this.mangoInterviewList.length; }
  public getMeditationParadoxCount(): number { return this.meditationParadoxList.length; }
  public getCameraMagnetCount(): number { return this.cameraMagnetList.length; }
  public getHugDiplomacyCount(): number { return this.hugDiplomacyList.length; }
  public getHugLoopCount(): number { return this.hugLoopList.length; }
  public getSelfieBattleCount(): number { return this.selfieBattleList.length; }
  public getMicrophoneChaseCount(): number { return this.microphoneChaseList.length; }
  public getPartyOfficeMixupCount(): number { return this.partyOfficeMixupList.length; }
  public getRoadshowFloatCount(): number { return this.roadshowFloatList.length; }
  public getPilotEscortCount(): number { return this.pilotEscortList.length; }
  public getCrowdMemberCount(): number { return this.crowdMemberList.length; }

  public getSignatureGagsCount(): number {
    return this.teacupRevealList.length + this.kettlePourList.length +
      this.recursiveScissorsList.length + this.remoteRevelationList.length +
      this.masterstrokeMachineList.length + this.chessboardMatchList.length +
      this.microphoneShowdownList.length + this.coalitionCarouselList.length +
      this.mangoInterviewList.length + this.meditationParadoxList.length +
      this.cameraMagnetList.length + this.hugDiplomacyList.length +
      this.hugLoopList.length + this.selfieBattleList.length +
      this.microphoneChaseList.length + this.partyOfficeMixupList.length +
      this.roadshowFloatList.length + this.pilotEscortList.length;
  }

  public getTotalActiveElements(): number {
    return this.scissorsList.length + this.debatersList.length + this.steamList.length +
      this.flashList.length + this.helicopterList.length + this.gavelList.length +
      this.papersList.length + this.countdownList.length + this.runawayList.length +
      this.crowdMemberList.length + this.getSignatureGagsCount();
  }

  public reset(): void {
    this.clear();
  }

  public clear(): void {
    this.scissorsList = [];
    this.debatersList = [];
    this.steamList = [];
    this.flashList = [];
    this.helicopterList = [];
    this.gavelList = [];
    this.papersList = [];
    this.countdownList = [];
    this.runawayList = [];

    this.teacupRevealList = [];
    this.kettlePourList = [];
    this.recursiveScissorsList = [];
    this.remoteRevelationList = [];
    this.masterstrokeMachineList = [];
    this.chessboardMatchList = [];
    this.microphoneShowdownList = [];
    this.coalitionCarouselList = [];

    this.mangoInterviewList = [];
    this.meditationParadoxList = [];
    this.cameraMagnetList = [];
    this.hugDiplomacyList = [];
    this.hugLoopList = [];
    this.selfieBattleList = [];
    this.microphoneChaseList = [];
    this.partyOfficeMixupList = [];

    this.roadshowFloatList = [];
    this.pilotEscortList = [];
    this.crowdMemberList = [];

    this.globalClock = 0;
  }

  /**
   * Prunes detached objects whose parents were severed when chunks were recycled.
   * This completely prevents unbounded object accumulation.
   */
  private pruneDetached(): void {
    const isAttached = (obj: THREE.Object3D | null | undefined): boolean => {
      return !!(obj && obj.parent);
    };

    this.scissorsList = this.scissorsList.filter(s => isAttached(s.leftBlade) && isAttached(s.rightBlade));
    this.debatersList = this.debatersList.filter(d => isAttached(d.arm1) && isAttached(d.arm2));
    this.steamList = this.steamList.filter(st => isAttached(st.mesh));
    this.flashList = this.flashList.filter(f => isAttached(f.mesh));
    this.helicopterList = this.helicopterList.filter(h => isAttached(h.group) && isAttached(h.rotor));
    this.gavelList = this.gavelList.filter(g => isAttached(g.mesh));
    this.papersList = this.papersList.filter(p => isAttached(p.mesh));
    this.countdownList = this.countdownList.filter(c => isAttached(c.mesh));
    this.runawayList = this.runawayList.filter(r => isAttached(r.group));

    this.teacupRevealList = this.teacupRevealList.filter(g => isAttached(g.curtainLeft) && isAttached(g.pedestalCup));
    this.kettlePourList = this.kettlePourList.filter(g => isAttached(g.kettleGroup) && isAttached(g.politicianL));
    this.recursiveScissorsList = this.recursiveScissorsList.filter(g => isAttached(g.shears1L) && isAttached(g.craneGroup));
    this.remoteRevelationList = this.remoteRevelationList.filter(g => isAttached(g.vaultLid) && isAttached(g.remoteMesh));
    this.masterstrokeMachineList = this.masterstrokeMachineList.filter(g => isAttached(g.vaultDoorL) && isAttached(g.deliveryArm));
    this.chessboardMatchList = this.chessboardMatchList.filter(g => isAttached(g.craneGantry) && isAttached(g.grandPiece));
    this.microphoneShowdownList = this.microphoneShowdownList.filter(g => isAttached(g.centerMic) && isAttached(g.leaderLeft));
    this.coalitionCarouselList = this.coalitionCarouselList.filter(g => isAttached(g.carouselPlatform) && isAttached(g.nitishChair));

    this.mangoInterviewList = this.mangoInterviewList.filter(g => isAttached(g.stageGroup) && isAttached(g.mangoMesh));
    this.meditationParadoxList = this.meditationParadoxList.filter(g => isAttached(g.caveTurntable) && isAttached(g.modiFigure));
    this.cameraMagnetList = this.cameraMagnetList.filter(g => isAttached(g.modiFigure));
    this.hugDiplomacyList = this.hugDiplomacyList.filter(g => isAttached(g.hydraulicBase) && isAttached(g.armLeft));
    this.hugLoopList = this.hugLoopList.filter(g => isAttached(g.turntable) && isAttached(g.modiFigure));
    this.selfieBattleList = this.selfieBattleList.filter(g => isAttached(g.cameraDrone) && isAttached(g.chaiVendor));
    this.microphoneChaseList = this.microphoneChaseList.filter(g => isAttached(g.rollingMic) && isAttached(g.modiFigure));
    this.partyOfficeMixupList = this.partyOfficeMixupList.filter(g => isAttached(g.revolvingPortal) && isAttached(g.politicianFigure));

    this.roadshowFloatList = this.roadshowFloatList.filter(g => isAttached(g.floatGroup) && isAttached(g.modiFigure));
    this.pilotEscortList = this.pilotEscortList.filter(g => isAttached(g.suvGroup));
    this.crowdMemberList = this.crowdMemberList.filter(g => isAttached(g.memberGroup));
  }

  /**
   * Called every animation frame from WorldScene / Game loop
   */
  public update(dt: number, isVipActive: boolean = true): void {
    if (!this.isEnabled || !isVipActive) return;

    // Prune any elements whose chunks have been recycled
    this.pruneDetached();

    const delta = Math.min(dt || 0.016, 0.1);
    this.globalClock += delta;

    const isReducedMotion = typeof window !== 'undefined' &&
      SettingsManager.getInstance().isReducedMotion();

    const motionMultiplier = isReducedMotion ? 0.35 : 1.0;

    // =======================================================================
    // 1. BASELINE AMBIENT ANIMATIONS
    // =======================================================================

    // Ceremonial Scissors snip
    for (let i = 0; i < this.scissorsList.length; i++) {
      const s = this.scissorsList[i];
      const angle = Math.abs(Math.sin((this.globalClock + s.offset) * s.speed * motionMultiplier)) * 0.42;
      s.leftBlade.rotation.z = angle;
      s.rightBlade.rotation.z = -angle;
    }

    // Debater Cartoon NPCs (Gesticulating, nodding)
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

    // Chai Steam Wisps
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

    // Camera Paparazzi Flashes
    for (let i = 0; i < this.flashList.length; i++) {
      const f = this.flashList[i];
      f.flashTimer += delta;
      if (f.flashTimer >= f.nextFlash) {
        f.flashTimer = 0;
        const pseudoRand = ((i * 1.618033 + this.globalClock * 0.8) % 1);
        f.nextFlash = 0.25 + pseudoRand * 0.75;
        f.mesh.visible = true;
        if (f.light) f.light.intensity = 3.5;
      } else if (f.mesh.visible && f.flashTimer > 0.08) {
        f.mesh.visible = false;
        if (f.light) f.light.intensity = 0;
      }
    }

    // News Helicopter
    for (let i = 0; i < this.helicopterList.length; i++) {
      const h = this.helicopterList[i];
      h.rotor.rotation.y += delta * 28.0;
      h.group.position.y = h.baseY + Math.sin(this.globalClock * 1.4 + h.phase) * 0.75;
      h.group.position.x = h.baseX + Math.cos(this.globalClock * 0.9 + h.phase) * 1.2;
      h.group.rotation.z = Math.sin(this.globalClock * 1.1 + h.phase) * 0.06;
      h.group.rotation.x = Math.cos(this.globalClock * 0.8 + h.phase) * 0.04;
    }

    // Parliament Gavel
    for (let i = 0; i < this.gavelList.length; i++) {
      const g = this.gavelList[i];
      g.timer += delta;
      const cycle = g.timer % 2.4;
      if (cycle < 1.8) {
        g.mesh.rotation.x = -0.55 + (cycle / 1.8) * 0.15;
      } else if (cycle < 2.0) {
        g.mesh.rotation.x = -0.85; // Raise high
      } else {
        g.mesh.rotation.x = 0.10; // SLAM!
      }
    }

    // Question Hour Flying Papers
    if (!isReducedMotion) {
      for (let i = 0; i < this.papersList.length; i++) {
        const p = this.papersList[i];
        const pt = (this.globalClock * p.speed + p.phase);
        p.mesh.position.y = p.baseY + Math.abs(Math.sin(pt * 1.6)) * 1.2;
        p.mesh.position.z = p.baseZ + Math.cos(pt * 1.2) * 1.5;
        p.mesh.rotation.x = pt * 2.0;
        p.mesh.rotation.y = pt * 1.5;
        p.mesh.rotation.z = pt * 0.8;
      }
    }

    // Announcement Countdown Board
    for (let i = 0; i < this.countdownList.length; i++) {
      const c = this.countdownList[i];
      c.timer += delta;
      const beat = 1.0 + Math.abs(Math.sin(c.timer * Math.PI)) * 0.04;
      c.mesh.scale.set(beat, beat, beat);
    }

    // Runaway Decoy & Camera Crew Chase
    for (let i = 0; i < this.runawayList.length; i++) {
      const r = this.runawayList[i];
      const cycle = Math.sin(this.globalClock * r.speed);
      r.group.position.z = r.baseZ + cycle * 4.5;
      r.cameraCrew.rotation.y = -cycle * 0.35;
    }

    // =======================================================================
    // 2. SIGNATURE CINEMATIC SATIRE GAG ANIMATIONS
    // =======================================================================

    // GAG 1: Monumental Teacup Unveiling (District A)
    // 6.0 second cycle: Fanfare (0-2s) -> Curtain Parting (2-3s) -> Tiny Cup Spotlight (3-4.5s) -> Wild Selfie Celebration (4.5-6s)
    for (let i = 0; i < this.teacupRevealList.length; i++) {
      const g = this.teacupRevealList[i];
      g.timer += delta * motionMultiplier;
      const cycle = g.timer % 6.0;

      if (cycle < 2.0) {
        // Closed curtains, building anticipation
        g.curtainLeft.position.x = -1.5;
        g.curtainRight.position.x = 1.5;
        g.pedestalCup.scale.set(1.0, 1.0, 1.0);
        g.vips.forEach(vip => {
          vip.rotation.z = Math.sin(this.globalClock * 3.0) * 0.05;
          vip.position.y = 0;
        });
      } else if (cycle < 3.2) {
        // Dramatic curtain sweep open
        const t = (cycle - 2.0) / 1.2;
        g.curtainLeft.position.x = -1.5 - t * 2.5;
        g.curtainRight.position.x = 1.5 + t * 2.5;
      } else if (cycle < 4.5) {
        // The Punchline: Curtains wide open, tiny teacup highlighted!
        g.curtainLeft.position.x = -4.0;
        g.curtainRight.position.x = 4.0;
        // Subtle golden glow pulse on tiny cup
        const pulse = 1.0 + Math.sin(this.globalClock * 8.0) * 0.15;
        g.pedestalCup.scale.set(pulse, pulse, pulse);
        // Spotlights sweeping down onto tiny cup
        g.spotlights.forEach((spot, idx) => {
          spot.rotation.x = 0.5 + Math.sin(this.globalClock * 4.0 + idx) * 0.08;
        });
      } else {
        // Euphoric celebration: VIPs jumping up and taking selfies
        const jump = Math.abs(Math.sin(this.globalClock * 9.0)) * 0.35;
        g.vips.forEach((vip, idx) => {
          vip.position.y = jump * ((idx % 2 === 0) ? 1.0 : 0.8);
          vip.rotation.y = Math.sin(this.globalClock * 5.0 + idx) * 0.25;
        });
      }
    }

    // GAG 2: Kettle Mechanical Pourer & Arguing VIPs (District A)
    // 7.0 second cycle: Kettle Tilts (0-2s) -> Tea Stream Pours (2-3.5s) -> VIPs Dive & Collide (3.5-5s) -> Tea Vendor Wins (5-7s)
    for (let i = 0; i < this.kettlePourList.length; i++) {
      const g = this.kettlePourList[i];
      g.timer += delta * motionMultiplier;
      const cycle = g.timer % 7.0;

      if (cycle < 2.0) {
        // Upright kettle heating up
        g.kettleGroup.rotation.z = 0;
        g.teaStream.visible = false;
        g.politicianL.position.x = -1.8;
        g.politicianR.position.x = 1.8;
      } else if (cycle < 3.5) {
        // Dramatic tilt & pouring tea stream
        const tilt = Math.min(1.0, (cycle - 2.0) / 0.8) * 0.45;
        g.kettleGroup.rotation.z = -tilt;
        g.teaStream.visible = true;
        g.teaStream.scale.y = Math.sin((cycle - 2.0) * 3.0) * 0.2 + 1.0;
        // VIP politicians start leaning forward competitively
        g.politicianL.position.x = -1.8 + (cycle - 2.0) * 0.6;
        g.politicianR.position.x = 1.8 - (cycle - 2.0) * 0.6;
      } else if (cycle < 5.0) {
        // Politicians collide headfirst under spout!
        g.kettleGroup.rotation.z = -0.45;
        g.teaStream.visible = true;
        g.politicianL.position.x = -0.4;
        g.politicianL.rotation.z = 0.35; // Knocked back
        g.politicianR.position.x = 0.4;
        g.politicianR.rotation.z = -0.35;
        // Tea vendor smoothly holds cup right in between them
        g.vendorGlass.position.y = 0.45 + Math.sin(this.globalClock * 3.0) * 0.05;
      } else {
        // Recovery & bewildered politician expressions
        g.kettleGroup.rotation.z = 0;
        g.teaStream.visible = false;
        g.politicianL.rotation.z = 0;
        g.politicianR.rotation.z = 0;
      }
    }

    // GAG 3: Recursive Scissors Inauguration (District B)
    // 6.5 second cycle: First Shears Snip (0-2s) -> Crane Shears Descend (2-3.8s) -> Second Shears Cut (3.8-5s) -> Rapid Ribbon Arm snaps new ribbon (5-6.5s)
    for (let i = 0; i < this.recursiveScissorsList.length; i++) {
      const g = this.recursiveScissorsList[i];
      g.timer += delta * motionMultiplier;
      const cycle = g.timer % 6.5;

      if (cycle < 2.0) {
        // Primary shears snip at ribbon
        const snip = Math.abs(Math.sin(cycle * 4.0)) * 0.38;
        g.shears1L.rotation.z = snip;
        g.shears1R.rotation.z = -snip;
        g.craneGroup.position.y = 4.5; // Crane shears high above
        g.rapidRibbonArm.rotation.z = 1.4; // Arm hidden below
        g.ribbonMesh.visible = true;
      } else if (cycle < 3.8) {
        // Massive diamond crane shears lower down over primary shears!
        const t = (cycle - 2.0) / 1.8;
        g.craneGroup.position.y = 4.5 - t * 3.2;
        // Crane shears open wide
        g.shears2L.rotation.z = 0.55;
        g.shears2R.rotation.z = -0.55;
      } else if (cycle < 5.0) {
        // Crane shears inaugural cut on primary shears!
        const snip = Math.abs(Math.sin((cycle - 3.8) * 5.0)) * 0.55;
        g.shears2L.rotation.z = snip;
        g.shears2R.rotation.z = -snip;
        g.ribbonMesh.visible = false; // Ribbon cut!
      } else {
        // Automated pneumatic arm whips out, restores fresh ribbon!
        const t = (cycle - 5.0) / 1.5;
        g.rapidRibbonArm.rotation.z = 1.4 - t * 1.4;
        if (cycle > 5.8) {
          g.ribbonMesh.visible = true; // Instantly replaced!
        }
      }
    }

    // GAG 4: Prime-Time Remote Revelation (District C)
    // 6.0 second cycle: Building Revelation (0-2s) -> Crane Hoists Vault Dome (2-3.5s) -> Remote Exposed (3.5-4.8s) -> Studio Pandemonium (4.8-6s)
    for (let i = 0; i < this.remoteRevelationList.length; i++) {
      const g = this.remoteRevelationList[i];
      g.timer += delta * motionMultiplier;
      const cycle = g.timer % 6.0;

      if (cycle < 2.0) {
        g.vaultLid.position.y = 0.6; // Closed vault
        g.anchorNPC.rotation.y = Math.sin(this.globalClock * 4.0) * 0.15;
      } else if (cycle < 3.5) {
        // Vault dome raised high by crane
        const t = (cycle - 2.0) / 1.5;
        g.vaultLid.position.y = 0.6 + t * 3.8;
        g.remoteMesh.rotation.y += delta * 4.0;
      } else if (cycle < 4.8) {
        // Remote spotlighted on rotating pedestal!
        g.vaultLid.position.y = 4.4;
        g.remoteMesh.rotation.y += delta * 6.0;
        // Anchor gestures frantically at the remote
        g.anchorNPC.rotation.x = -0.3 + Math.sin(this.globalClock * 8.0) * 0.15;
      } else {
        // All screens shake, anchor holds head
        g.debateScreens.forEach((scr, idx) => {
          scr.position.y = 11.0 + Math.sin(this.globalClock * 12.0 + idx) * 0.12;
        });
        g.anchorNPC.rotation.z = Math.sin(this.globalClock * 10.0) * 0.25;
      }
    }

    // GAG 5: Masterstroke Loading Machine (District D)
    // 7.5 second cycle: Computing 85% (0-2.5s) -> Critical 99.9% (2.5-4.2s) -> Vault Slide (4.2-5.5s) -> Spoon Delivery (5.5-7.5s)
    for (let i = 0; i < this.masterstrokeMachineList.length; i++) {
      const g = this.masterstrokeMachineList[i];
      g.timer += delta * motionMultiplier;
      const cycle = g.timer % 7.5;

      if (cycle < 2.5) {
        // Dial ticking upward
        g.dialNeedle.rotation.z = -1.2 + (cycle / 2.5) * 1.8;
        g.vaultDoorL.position.x = -1.1;
        g.vaultDoorR.position.x = 1.1;
        g.deliveryArm.position.z = -1.0;
        g.steamHiss.scale.set(0.2, 0.2, 0.2);
      } else if (cycle < 4.2) {
        // Needle vibrating near 99.9%, steam huffing
        g.dialNeedle.rotation.z = 0.6 + Math.sin(this.globalClock * 18.0) * 0.08;
        const steamScale = 1.0 + Math.sin(this.globalClock * 12.0) * 0.35;
        g.steamHiss.scale.set(steamScale, steamScale, steamScale);
      } else if (cycle < 5.5) {
        // Vault doors slide apart with heavy hydraulic hissing
        const t = (cycle - 4.2) / 1.3;
        g.vaultDoorL.position.x = -1.1 - t * 1.6;
        g.vaultDoorR.position.x = 1.1 + t * 1.6;
        g.deliveryArm.position.z = -1.0 + t * 2.2;
      } else {
        // Tiny wooden tea-stirring spoon proudly presented on cushion!
        g.deliveryArm.position.z = 1.2;
        g.tinyObject.rotation.y += delta * 2.0;
        g.tinyObject.scale.set(1.2, 1.2, 1.2);
      }
    }

    // GAG 6: Giant Political Chessboard (District D)
    // 8.0 second cycle: Crane positions King (0-3s) -> Grand Strategy (3-4.5s) -> Chai Vendor Rolls In (4.5-6.5s) -> Tea Checkmate (6.5-8s)
    for (let i = 0; i < this.chessboardMatchList.length; i++) {
      const g = this.chessboardMatchList[i];
      g.timer += delta * motionMultiplier;
      const cycle = g.timer % 8.0;

      if (cycle < 3.0) {
        const t = cycle / 3.0;
        g.craneGantry.position.x = Math.sin(t * Math.PI) * 2.5;
        g.grandPiece.position.y = 1.8 + Math.cos(t * Math.PI) * 0.6;
        g.teaVendorCart.position.z = 8.0; // Vendor outside board
      } else if (cycle < 4.5) {
        g.grandPiece.position.y = 0.9; // King placed on square
        g.teaVendorCart.position.z = 8.0 - (cycle - 3.0) * 3.5; // Vendor rolls across board!
      } else if (cycle < 6.5) {
        // Vendor right in the center of the grand chessboard!
        g.teaVendorCart.position.z = 2.5;
        g.grandPiece.rotation.y += delta * 5.0; // Grand piece spun around by cart
      } else {
        // Tea placed on King's square, vendor rolls away
        g.teaVendorCart.position.z = 2.5 - (cycle - 6.5) * 3.0;
      }
    }

    // GAG 7: Microphone Showdown & Self-Interview (District E)
    // 6.5 second cycle: Leaders Approach (0-2s) -> Mic Rises High (2-3.5s) -> Side Mics Sprout (3.5-5s) -> Mics Interview Each Other (5-6.5s)
    for (let i = 0; i < this.microphoneShowdownList.length; i++) {
      const g = this.microphoneShowdownList[i];
      g.timer += delta * motionMultiplier;
      const cycle = g.timer % 6.5;

      if (cycle < 2.0) {
        // Leaders rushing forward to center
        g.leaderLeft.position.x = -1.8 + (cycle / 2.0) * 0.9;
        g.leaderRight.position.x = 1.8 - (cycle / 2.0) * 0.9;
        g.centerMic.position.y = 1.4;
        g.micLeft.scale.set(0.01, 0.01, 0.01);
        g.micRight.scale.set(0.01, 0.01, 0.01);
      } else if (cycle < 3.5) {
        // Center mic stretches high into the air!
        const t = (cycle - 2.0) / 1.5;
        g.centerMic.position.y = 1.4 + t * 2.4;
        // Leaders looking up baffled
        g.leaderLeft.rotation.x = -0.4;
        g.leaderRight.rotation.x = -0.4;
      } else if (cycle < 5.0) {
        // Side microphones sprout from floor
        const t = (cycle - 3.5) / 1.5;
        g.micLeft.scale.set(t, t, t);
        g.micRight.scale.set(t, t, t);
      } else {
        // Microphones turn toward each other and begin nodding / interviewing each other!
        g.micLeft.rotation.y = 0.6 + Math.sin(this.globalClock * 6.0) * 0.25;
        g.micRight.rotation.y = -0.6 - Math.sin(this.globalClock * 6.0) * 0.25;
        g.centerMic.rotation.z = Math.sin(this.globalClock * 5.0) * 0.18;
      }
    }

    // GAG 8: Coalition Musical-Chairs Carousel (District E)
    // 8.0 second cycle: Carousel Rotation (0-4s) -> Gavel Strike Stop (4-5s) -> Nitish Chair Swivel (5-6.5s) -> Scramble (6.5-8s)
    for (let i = 0; i < this.coalitionCarouselList.length; i++) {
      const g = this.coalitionCarouselList[i];
      g.timer += delta * motionMultiplier;
      const cycle = g.timer % 8.0;

      if (cycle < 4.0) {
        // Carousel rotating, politicians marching
        g.carouselPlatform.rotation.y += delta * 1.5;
        g.politicians.forEach((p, idx) => {
          p.rotation.y = Math.sin(this.globalClock * 4.0 + idx) * 0.2;
        });
      } else if (cycle < 5.0) {
        // Abrupt halt on gavel strike!
        g.politicians.forEach(p => {
          p.rotation.x = 0.25; // Bracing
        });
      } else if (cycle < 6.8) {
        // Nitish chair does a 180-degree swivel from one side of coalition to other!
        const t = (cycle - 5.0) / 1.8;
        g.nitishChair.rotation.y = t * Math.PI;
      } else {
        // Scramble recovery
        g.politicians.forEach((p, idx) => {
          p.rotation.x = 0;
          p.position.y = Math.abs(Math.sin(this.globalClock * 6.0 + idx)) * 0.15;
        });
      }
    }

    // =======================================================================
    // 3. GATE A & GATE B POLITICAL MEME UNIVERSE GAG ANIMATIONS
    // =======================================================================

    // ROADSHOW ROYALE: Moving Political Float with Modi waving, petal cannons, and loudspeakers
    for (let i = 0; i < this.roadshowFloatList.length; i++) {
      const rf = this.roadshowFloatList[i];
      rf.timer += delta * motionMultiplier;

      // Modi dynamic victory wave & head turn
      const waveAngle = -1.4 + Math.sin(rf.timer * 3.8) * 0.35;
      rf.armRight.rotation.x = waveAngle;
      rf.armRight.rotation.z = Math.sin(rf.timer * 2.5) * 0.20;
      rf.head.rotation.y = Math.sin(rf.timer * 1.8) * 0.35;

      // Float gentle chassis rumble/sway
      rf.floatGroup.position.y = (rf.floatGroup.userData.baseY || 0) + Math.sin(this.globalClock * 6.0) * 0.04;
      rf.floatGroup.rotation.z = Math.sin(this.globalClock * 3.0) * 0.015;

      // Petal cannons shooting petals into the sky
      for (let p = 0; p < rf.petals.length; p++) {
        const petal = rf.petals[p];
        const baseY = rf.petalBaseY[p] || 4.0;
        const phase = (this.globalClock * 2.5 + p * 0.6) % 3.0;
        petal.position.y = baseY + phase * 1.8;
        petal.rotation.x += delta * 4.0;
        petal.rotation.y += delta * 5.0;
        petal.rotation.z += delta * 3.0;
        petal.scale.setScalar(0.7 + Math.sin(phase * Math.PI) * 0.4);
      }

      // Loudspeakers pulsating with rally sound
      for (let ls = 0; ls < rf.loudspeakers.length; ls++) {
        const horn = rf.loudspeakers[ls];
        const pulse = 1.0 + Math.sin(this.globalClock * 12.0 + ls) * 0.08;
        horn.scale.set(pulse, pulse, pulse);
      }

      // Commandos running alongside (rhythmic stride)
      for (let cm = 0; cm < rf.commandos.length; cm++) {
        const cmd = rf.commandos[cm];
        const stride = Math.sin(this.globalClock * 8.0 + cm * Math.PI);
        cmd.position.y = (cmd.userData.baseY || 0) + Math.abs(stride) * 0.08;
        cmd.rotation.x = stride * 0.12;
      }
    }

    // Pilot Escorts: Flashing amber/red strobes
    for (let i = 0; i < this.pilotEscortList.length; i++) {
      const pe = this.pilotEscortList[i];
      pe.timer += delta * motionMultiplier;
      const strobePhase = Math.floor(this.globalClock * 8.0) % 2;
      (pe.strobeAmber.material as THREE.MeshStandardMaterial).emissiveIntensity = strobePhase === 0 ? 2.5 : 0.2;
      (pe.strobeRed.material as THREE.MeshStandardMaterial).emissiveIntensity = strobePhase === 1 ? 2.5 : 0.2;
    }

    // Cheering Crowd Members
    for (let i = 0; i < this.crowdMemberList.length; i++) {
      const cm = this.crowdMemberList[i];
      const time = this.globalClock * cm.speed * motionMultiplier + cm.phase;
      if (cm.wavingArm) {
        cm.wavingArm.rotation.x = -1.2 + Math.sin(time) * 0.45;
        cm.wavingArm.rotation.z = Math.cos(time * 0.7) * 0.25;
      }
      if (cm.flagMesh) {
        cm.flagMesh.rotation.z = Math.sin(time * 1.2) * 0.35;
        cm.flagMesh.rotation.y = Math.cos(time * 0.8) * 0.25;
      }
      if (cm.flashMesh) {
        const isFlash = (Math.sin(time * 3.5) > 0.88);
        cm.flashMesh.visible = isFlash;
      }
    }

    // GATE A: The Mango Interview — Superstar Mango with Sunglasses & Swiveling Cameras
    // Enhanced for instant readability from running camera! The Golden Mango Superstar is ALWAYS proudly visible.
    for (let i = 0; i < this.mangoInterviewList.length; i++) {
      const g = this.mangoInterviewList[i];
      g.timer += delta * motionMultiplier;

      // Cloche sits firmly grounded on its gold side-table waiter tray, tilted open to reveal the superstar
      g.clocheMesh.position.y = 0.8;

      // Mango is an active superstar pop icon: bobbing, grooving rotation, and sunglasses
      const bob = Math.abs(Math.sin(this.globalClock * 7.0)) * 0.24;
      g.mangoMesh.position.y = 3.8 + bob;
      g.mangoMesh.rotation.y += delta * 2.8;

      // Celebrity sunglasses mounted on mango
      g.sunglassesMesh.position.y = g.mangoMesh.position.y;
      g.sunglassesMesh.rotation.y = g.mangoMesh.rotation.y;
      g.sunglassesMesh.scale.set(1.0, 1.0, 1.0);

      // Rotating sparkle stars
      if (g.sparkleMesh) {
        g.sparkleMesh.visible = true;
        g.sparkleMesh.position.y = g.mangoMesh.position.y + 0.65;
        g.sparkleMesh.rotation.z += delta * 4.0;
        const spScale = 0.9 + Math.sin(this.globalClock * 10.0) * 0.3;
        g.sparkleMesh.scale.set(spScale, spScale, spScale);
      }

      // Cameras and spotlights actively locked onto the mango superstar!
      g.cameras.forEach(cam => {
        cam.rotation.y = Math.sin(this.globalClock * 2.0) * 0.15;
        cam.rotation.x = -0.22;
      });
      g.spotlights.forEach(spot => {
        spot.rotation.x = 0.82; // Focused squarely on the mango
      });

      // Leaders in animated debate & comic dropped-jaw double-take
      const debateCycle = Math.sin(this.globalClock * 3.0);
      g.modiFigure.rotation.x = -0.12 + debateCycle * 0.12;
      g.modiFigure.rotation.z = debateCycle > 0 ? 0.22 : -0.04;
      g.interviewerFigure.rotation.x = -0.12 - debateCycle * 0.12;
      g.interviewerFigure.rotation.z = debateCycle > 0 ? -0.22 : 0.04;
    }

    // GATE B: The Kedarnath Meditation Photo-Shoot Paradox
    // 7.0s cycle: Cave continuously rotates on movie turntable while Modi remains motionless in meditation
    for (let i = 0; i < this.meditationParadoxList.length; i++) {
      const g = this.meditationParadoxList[i];
      g.timer += delta * motionMultiplier;

      // Turntable rotation
      g.caveTurntable.rotation.y += delta * 0.35;

      // Modi is completely motionless in serene lotus pose
      g.modiFigure.rotation.set(0, 0, 0);

      // Camera dollies glide smoothly back and forth on curved tracks around the cave
      g.cameraDollies.forEach((dolly, idx) => {
        dolly.position.x = Math.sin(this.globalClock * 1.5 + idx * 1.8) * 3.2;
        dolly.position.z = Math.cos(this.globalClock * 1.5 + idx * 1.8) * 1.2;
        dolly.rotation.y = -Math.sin(this.globalClock * 1.5 + idx * 1.8) * 0.45;
      });

      // Softbox umbrellas gently breathe warm lighting
      g.softboxUmbrellas.forEach((umbrella, idx) => {
        umbrella.rotation.z = Math.sin(this.globalClock * 2.0 + idx) * 0.08;
      });

      // Film Director waving megaphone frantically
      if (g.directorFigure) {
        g.directorFigure.rotation.y = Math.sin(this.globalClock * 4.5) * 0.35;
        g.directorFigure.rotation.x = -0.2 + Math.cos(this.globalClock * 3.0) * 0.15;
      }
    }

    // GATE B: The 360° Camera Magnet
    // 5.0s cycle: Modi turns on podium; all photographers snap instantly in unison to keep framing
    for (let i = 0; i < this.cameraMagnetList.length; i++) {
      const g = this.cameraMagnetList[i];
      g.timer += delta * motionMultiplier;
      const modiAngle = Math.sin(this.globalClock * 1.6) * 1.2;
      g.modiFigure.rotation.y = modiAngle;

      g.photographers.forEach(p => {
        // Photographers dynamically pivot their whole body and lens to match Modi
        p.group.rotation.y = p.baseAngle - modiAngle * 0.65;
        p.camera.position.z = 0.5 + Math.abs(Math.sin(this.globalClock * 4.0)) * 0.08;
      });
    }

    // GATE B: The Hug Diplomacy Machine
    // 6.0s cycle: Arms Open (0-2s) -> Squeeze Embrace (2-4s) -> Lift & Heart (4-5.2s) -> Release (5.2-6s)
    for (let i = 0; i < this.hugDiplomacyList.length; i++) {
      const g = this.hugDiplomacyList[i];
      g.timer += delta * motionMultiplier;
      const cycle = g.timer % 6.0;

      if (cycle < 2.0) {
        // Arms opening wide
        const openT = cycle / 2.0;
        g.armLeft.rotation.y = 0.8 * openT;
        g.armRight.rotation.y = -0.8 * openT;
        g.targetDignitary.position.y = 0.4;
        if (g.heartIcon) g.heartIcon.scale.set(0.01, 0.01, 0.01);
      } else if (cycle < 4.0) {
        // Powerful hydraulic bear hug squeeze!
        g.armLeft.rotation.y = -0.55;
        g.armRight.rotation.y = 0.55;
        g.targetDignitary.position.y = 0.4 + Math.sin(this.globalClock * 6.0) * 0.05;
      } else if (cycle < 5.2) {
        // Lift dignitary into the air with popping cartoon heart
        g.targetDignitary.position.y = 0.85;
        if (g.heartIcon) {
          const hp = 1.0 + Math.sin(this.globalClock * 12.0) * 0.25;
          g.heartIcon.scale.set(hp, hp, hp);
        }
      } else {
        // Gentle setdown and release
        const relT = (cycle - 5.2) / 0.8;
        g.targetDignitary.position.y = 0.85 - relT * 0.45;
        g.armLeft.rotation.y = -0.55 + relT * 0.55;
        g.armRight.rotation.y = 0.55 - relT * 0.55;
        if (g.heartIcon) g.heartIcon.scale.set(0.01, 0.01, 0.01);
      }
    }

    // CROSSOVER 1: The Hug Loop
    // 6.0s cycle: Continuous rotation bringing Modi and Rahul into synchronized cartoon hug
    for (let i = 0; i < this.hugLoopList.length; i++) {
      const g = this.hugLoopList[i];
      g.timer += delta * motionMultiplier;
      g.turntable.rotation.y += delta * 1.2;

      const cycle = g.timer % 6.0;
      if (cycle > 2.2 && cycle < 4.2) {
        // Embrace!
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

    // CROSSOVER 2: The Selfie Battle & Chai Vendor Twist
    // 6.0s cycle: Pose (0-3s) -> Drone Swoops & Blinding Flash (3-4.5s) -> Vendor Smile & Bewilderment (4.5-6s)
    for (let i = 0; i < this.selfieBattleList.length; i++) {
      const g = this.selfieBattleList[i];
      g.timer += delta * motionMultiplier;
      const cycle = g.timer % 6.0;

      if (cycle < 3.0) {
        // Dramatic leader poses for drone
        g.cameraDrone.position.y = 3.5 + Math.sin(this.globalClock * 2.5) * 0.25;
        g.cameraDrone.position.z = 2.0;
        g.cameraDrone.rotation.x = 0.3;
        g.modiFigure.rotation.y = 0.35;
        g.rahulFigure.rotation.y = -0.35;
        g.flashLight.scale.set(0.01, 0.01, 0.01);
      } else if (cycle < 4.5) {
        // Drone swoops low between them and flashes at chai vendor!
        g.cameraDrone.position.y = 1.8;
        g.cameraDrone.position.z = 1.2;
        g.cameraDrone.rotation.x = 0;

        // Blinding camera flash
        const isFlash = (cycle - 3.0 < 0.25) || (cycle - 3.0 > 0.5 && cycle - 3.0 < 0.75);
        if (isFlash) {
          g.flashLight.scale.set(1.6, 1.6, 1.6);
        } else {
          g.flashLight.scale.set(0.01, 0.01, 0.01);
        }
      } else {
        // Punchline: Vendor beams happily, leaders turn heads in disbelief!
        g.flashLight.scale.set(0.01, 0.01, 0.01);
        g.chaiVendor.rotation.y = Math.sin(this.globalClock * 4.0) * 0.15;
        g.modiFigure.rotation.y = 1.2; // Look at vendor
        g.rahulFigure.rotation.y = -1.2; // Look at vendor
      }
    }

    // CROSSOVER 3: The Runaway Microphone Chase
    // 6.5s cycle: Chase (0-3.2s) -> Mic Stop & Tap (3.2-4.5s) -> Reverse Dash (4.5-6.5s)
    for (let i = 0; i < this.microphoneChaseList.length; i++) {
      const g = this.microphoneChaseList[i];
      g.timer += delta * motionMultiplier;
      const cycle = g.timer % 6.5;

      if (cycle < 3.2) {
        // Rolling mic leads the sprint
        const t = cycle / 3.2;
        g.rollingMic.position.z = -3.5 + t * 7.0;
        g.rollingMic.rotation.y = 0;
        g.modiFigure.position.z = g.rollingMic.position.z - 1.4;
        g.rahulFigure.position.z = g.rollingMic.position.z - 2.2;
        g.modiFigure.rotation.x = -0.4;
        g.rahulFigure.rotation.x = -0.4;
      } else if (cycle < 4.5) {
        // Mic abruptly halts, spins to camera, taps its head!
        g.rollingMic.rotation.y = Math.PI;
        g.rollingMic.rotation.z = Math.sin(this.globalClock * 12.0) * 0.22;
        // Leaders skid to a halt!
        g.modiFigure.rotation.x = 0.3;
        g.rahulFigure.rotation.x = 0.3;
      } else {
        // Mic zooms in reverse right past them!
        const revT = (cycle - 4.5) / 2.0;
        g.rollingMic.position.z = 3.5 - revT * 7.0;
        g.modiFigure.rotation.y = Math.PI * 0.5;
        g.rahulFigure.rotation.y = -Math.PI * 0.5;
      }
    }

    // CROSSOVER 4: The Party Office Mix-Up
    // 6.0s cycle: Politician enters revolving door, spins 360°, exits opposite party office looking confused!
    for (let i = 0; i < this.partyOfficeMixupList.length; i++) {
      const g = this.partyOfficeMixupList[i];
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
        g.politicianFigure.rotation.z = Math.sin(this.globalClock * 6.0) * 0.2; // Scratching head
      }
    }
  }
}
