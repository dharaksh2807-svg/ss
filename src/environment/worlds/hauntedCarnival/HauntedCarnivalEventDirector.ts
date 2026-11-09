import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';

/**
 * HAUNTED CARNIVAL: THE NIGHTMARE EXPERIENCE
 * Dynamic Horror Event Director
 * 
 * Enforces canonical negative-Z signed-distance triggers:
 *   distanceAhead = playerZ - eventWorldZ
 * 
 * Coordinates the 5 Flagship Horror Encounters:
 *   1. THE WATCHER: Lone figure under dim lamp -> head turns -> vanishes -> close platform shock lunge
 *   2. THE POSSESSED CAROUSEL: 12-stage cinematic awakening, independent steed turn, ghostly riders, abrupt stop
 *   3. THE HAUNTED MANSION AWAKENS: Window silhouettes, darkening sequence, wraith emergence, giant skyline colossus
 *   4. THE NIGHTMARE CLOWN: Sinister articulated clown peeking in booth, startling lurch to curb, unnatural head snap
 *   5. THE SHADOW COLOSSUS: Monumental breathing skyline titan with glowing beacons
 */

// --- Actor Interfaces ---

export interface SteedActor {
  mesh: THREE.Object3D;
  pole: THREE.Object3D;
  head?: THREE.Object3D;
  rider?: THREE.Object3D;
  baseY: number;
  amplitude: number;
  frequency: number;
  phase: number;
}

export type CarouselStage =
  | 'ABANDONED_STILL'
  | 'MUSIC_CUE'
  | 'STEED_HEAD_TURN'
  | 'RIDER_MATERIALIZE_1'
  | 'SLOW_ROTATION'
  | 'ALL_RIDERS_FADE_IN'
  | 'LIGHTING_PALETTE_SHIFT'
  | 'RIDERS_TURN_TO_TRACK'
  | 'OUTSIDE_SPECTER'
  | 'ABRUPT_STOP'
  | 'ALL_RIDERS_VANISH'
  | 'LINGERING_SWAY';

export interface HauntedCarouselActor {
  group: THREE.Group;
  turntable: THREE.Object3D;
  canopy: THREE.Object3D;
  steeds: SteedActor[];
  leadSteedHead?: THREE.Object3D;
  outsideSpecter?: THREE.Group;
  centerOrgan?: THREE.Object3D;
  organPipes?: THREE.Object3D[];
  lanternBulbs?: THREE.Mesh[];
  rotationSpeed: number;
  currentSpeed: number;
  worldZ: number;
  isAwakened: boolean;
  stage: CarouselStage;
  stageTimer: number;
}

export interface SurpriseGhostActor {
  group: THREE.Group;
  ghostMesh: THREE.Object3D;
  headMesh?: THREE.Object3D;
  lanternMesh?: THREE.Object3D;
  mistParticles?: THREE.Points;
  triggerZ: number;
  startX: number;
  targetX: number;
  baseY: number;
  state: 'HIDDEN' | 'EMERGING' | 'HOVERING' | 'DISSOLVING' | 'INACTIVE';
  hoverTime: number;
  side: number;
}

export type WatcherState =
  | 'DORMANT'
  | 'DISTANT_WATCHING'
  | 'SUSPENSE_TURNING'
  | 'VANISHED'
  | 'CLOSE_SHOCK'
  | 'DISSOLVING'
  | 'COMPLETED';

export interface WatcherActor {
  group: THREE.Group;
  worldZ: number;
  side: number;
  distantLamp: THREE.Group;
  distantLampLight: THREE.Mesh;
  distantFigure: THREE.Group;
  distantHead: THREE.Object3D;
  distantEyes: THREE.Mesh[];
  closePlatform: THREE.Group;
  closeFigure: THREE.Group;
  closeHead: THREE.Object3D;
  closeFace?: THREE.Mesh;
  closeEyes: THREE.Mesh[];
  closeArmLeft: THREE.Object3D;
  closeArmRight: THREE.Object3D;
  mistCloud?: THREE.Mesh;
  aftermathSilhouette?: THREE.Group;
  state: WatcherState;
  stateTimer: number;
}

export type MansionStage =
  | 'QUIET'
  | 'HIGH_WINDOW_SILHOUETTE'
  | 'LOW_WINDOW_SILHOUETTE'
  | 'WINDOWS_DARKEN'
  | 'DOORS_OPENING'
  | 'WRAITH_EMERGE'
  | 'COLOSSUS_RISE'
  | 'HAND_OVER_ROOF'
  | 'FADE_TO_DARKNESS';

export interface MansionAwakensActor {
  group: THREE.Group;
  worldZ: number;
  sideX: number;
  highWindows: Array<{ mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; silhouette: THREE.Mesh }>;
  lowWindows: Array<{ mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; silhouette: THREE.Mesh }>;
  doorLeft: THREE.Object3D;
  doorRight: THREE.Object3D;
  portalWraith: THREE.Group;
  colossusGroup: THREE.Group;
  colossusHead: THREE.Object3D;
  colossusEyes: THREE.Mesh[];
  colossusLeftArm: THREE.Object3D;
  colossusRightClaw: THREE.Object3D;
  stage: MansionStage;
  stageTimer: number;
}

export type NightmareClownState =
  | 'PEEKING_INSIDE'
  | 'DUCKING'
  | 'DOOR_OPENING'
  | 'EMERGING'
  | 'NOTICING_RUNNER'
  | 'STARTLING_LURCH'
  | 'FROZEN_TWIST'
  | 'HEAD_SNAP'
  | 'VANISHED';

export interface NightmareClownActor {
  group: THREE.Group;
  worldZ: number;
  baseX: number;
  boothDoor: THREE.Object3D;
  clownBody: THREE.Group;
  clownHead: THREE.Object3D;
  clownArmLeft: THREE.Object3D;
  clownArmRight: THREE.Object3D;
  jugglingEmbers?: THREE.Mesh[];
  state: NightmareClownState;
  timer: number;
}

export interface ShadowColossusActor {
  group: THREE.Group;
  worldZ: number;
  head: THREE.Object3D;
  leftClaw: THREE.Object3D;
  rightClaw: THREE.Object3D;
  eyes: THREE.Mesh[];
  baseY: number;
  phase: number;
}

export interface RingmasterActor {
  group: THREE.Group;
  head: THREE.Object3D;
  caneArm: THREE.Object3D;
  coatTails?: THREE.Object3D[];
  caneOrb?: THREE.Mesh;
  triggerZ: number;
  state: 'IDLE' | 'HAILING' | 'BOWING';
  timer: number;
}

export interface GhostClownActor {
  group: THREE.Group;
  body: THREE.Object3D;
  head: THREE.Object3D;
  armLeft: THREE.Object3D;
  armRight: THREE.Object3D;
  jugglingOrbs: THREE.Mesh[];
  orbPhases: number[];
  baseX: number;
  peekOffset: number;
  triggerZ: number;
  state: 'PEEKING' | 'JUGGLING' | 'ZIPPING_BACK';
  timer: number;
}

export interface HauntedDollActor {
  group: THREE.Group;
  head: THREE.Object3D;
  worldZ: number;
  side: number;
  baseRotY: number;
}

export interface GiantShadowCreatureActor {
  group: THREE.Group;
  leftClaw: THREE.Object3D;
  rightClaw: THREE.Object3D;
  eyes: THREE.Mesh[];
  baseY: number;
  phase: number;
}

export interface MirrorGlitchActor {
  mirrorMesh: THREE.Mesh;
  ghostReflection?: THREE.Object3D;
  flickerTimer: number;
  phase: number;
}

export interface GhostTrainActor {
  group: THREE.Group;
  speed: number;
  minZ: number;
  maxZ: number;
  wheels: THREE.Object3D[];
  spectralGlows: THREE.Mesh[];
}

export interface LivingPumpkinActor {
  group: THREE.Group;
  head: THREE.Object3D;
  glowMesh: THREE.Mesh;
  worldZ: number;
  baseRotY: number;
  phase: number;
}

export interface GhostParadeFloatActor {
  group: THREE.Group;
  skeletons: Array<{ torso: THREE.Object3D; instrument?: THREE.Object3D; phase: number }>;
  banners: THREE.Object3D[];
  lanterns: THREE.Mesh[];
}

export type CursedFerrisWheelStage =
  | 'ABANDONED'
  | 'LIGHTS_AWAKENING'
  | 'ROTATING'
  | 'SILHOUETTES_REVEAL'
  | 'FAIRGROUND_ALIVE'
  | 'SETTLED';

export interface CursedFerrisWheelActor {
  group: THREE.Group;
  wheelRim: THREE.Object3D;
  spokes: THREE.Object3D[];
  gondolas: Array<{
    pivot: THREE.Object3D;
    carriage: THREE.Object3D;
    specter?: THREE.Object3D;
    lantern?: THREE.Mesh;
  }>;
  rimBulbs: THREE.Mesh[];
  supportAFrame: THREE.Object3D;
  groundPlinth: THREE.Object3D;
  wheelRotation: number;
  rotationSpeed: number;
  currentSpeed: number;
  worldZ: number;
  stage: CursedFerrisWheelStage;
  stageTimer: number;
  illuminatedBulbsCount: number;
}

export type GhostParadeStage =
  | 'CONCEALED'
  | 'EMERGENCE'
  | 'PROCESSION'
  | 'REACTION'
  | 'DISAPPEARANCE'
  | 'SETTLED';

export interface GhostParadeSpecter {
  mesh: THREE.Object3D;
  head: THREE.Object3D;
  arms: THREE.Object3D[];
  tail: THREE.Object3D;
  lantern?: THREE.Mesh;
  halo?: THREE.Mesh;
  lateralOffset: number;
  phaseOffset: number;
}

export interface GhostParadeActor {
  group: THREE.Group;
  specters: GhostParadeSpecter[];
  destinationStructure: THREE.Object3D;
  mistPortal?: THREE.Mesh;
  worldZ: number;
  stage: GhostParadeStage;
  stageTimer: number;
  progress: number;
}

export interface BatSwarmActor {
  group: THREE.Group;
  bats: Array<{
    mesh: THREE.Object3D;
    wingL: THREE.Object3D;
    wingR: THREE.Object3D;
    orbitRadius: number;
    orbitSpeed: number;
    phase: number;
    baseY: number;
  }>;
}

export interface FunhouseTrickActor {
  group: THREE.Group;
  movingTiles: THREE.Object3D[];
  eyeballs: THREE.Object3D[];
  mouthJaw?: THREE.Object3D;
  phase: number;
}

export interface AmbientHauntingActor {
  swingingLanterns: Array<{ mesh: THREE.Object3D; axis: 'x' | 'z'; phase: number; freq: number }>;
  willOWisps: Array<{ mesh: THREE.Mesh; center: THREE.Vector3; radius: number; freq: number; phase: number }>;
  creakingSigns: Array<{ mesh: THREE.Object3D; phase: number }>;
}

/**
 * Procedural Web Audio Synthesizer for Supernatural Cues
 */
class HauntedAudioEngine {
  private static ctx: AudioContext | null = null;
  private static lastSoundTime: Record<string, number> = {};

  private static getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (this.ctx) return this.ctx;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch {}
    return this.ctx;
  }

  public static playWatcherShock(): void {
    const ctx = this.getAudioContext();
    if (!ctx || SettingsManager.getInstance().getState().isMuted) return;
    const now = ctx.currentTime;
    if (now - (this.lastSoundTime['watcher_shock'] || 0) < 3.0) return;
    this.lastSoundTime['watcher_shock'] = now;

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Dissonant minor-second cluster
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(82.4, now); // Low E
      osc2.frequency.setValueAtTime(87.3, now); // Low F (dissonant friction)

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, now);
      filter.frequency.exponentialRampToValueAtTime(140, now + 0.8);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.25);
      osc2.stop(now + 1.25);
    } catch {}
  }

  public static playCarouselMusicBox(): void {
    const ctx = this.getAudioContext();
    if (!ctx || SettingsManager.getInstance().getState().isMuted) return;
    const now = ctx.currentTime;
    if (now - (this.lastSoundTime['carousel_chime'] || 0) < 4.0) return;
    this.lastSoundTime['carousel_chime'] = now;

    try {
      // Four descending detuned music box chimes
      const notes = [587.33, 523.25, 440.0, 392.0];
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.22;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * (1.0 + (Math.random() * 0.01 - 0.005)), t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.65);
      });
    } catch {}
  }

  public static playColossusRumble(): void {
    const ctx = this.getAudioContext();
    if (!ctx || SettingsManager.getInstance().getState().isMuted) return;
    const now = ctx.currentTime;
    if (now - (this.lastSoundTime['colossus_rumble'] || 0) < 6.0) return;
    this.lastSoundTime['colossus_rumble'] = now;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(45.0, now);
      osc.frequency.linearRampToValueAtTime(65.0, now + 1.2);
      osc.frequency.linearRampToValueAtTime(38.0, now + 2.8);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 3.1);
    } catch {}
  }
}

/**
 * HauntedCarnivalEventDirector
 * Coordinates and animates all flagship horror encounters, signature scares, and ambient hauntings.
 */
export class HauntedCarnivalEventDirector {
  private static instance: HauntedCarnivalEventDirector | null = null;

  private totalTime: number = 0;
  private frameCounter: number = 0;

  // Registered Flagship Actors
  private watchers: WatcherActor[] = [];
  private carousels: HauntedCarouselActor[] = [];
  private mansionAwakens: MansionAwakensActor[] = [];
  private nightmareClowns: NightmareClownActor[] = [];
  private shadowColossi: ShadowColossusActor[] = [];

  // Existing Signature Scares
  private ghosts: SurpriseGhostActor[] = [];
  private ringmasters: RingmasterActor[] = [];
  private ghostClowns: GhostClownActor[] = [];
  private hauntedDolls: HauntedDollActor[] = [];
  private shadowCreatures: GiantShadowCreatureActor[] = [];
  private mirrorGlitches: MirrorGlitchActor[] = [];
  private ghostTrains: GhostTrainActor[] = [];
  private livingPumpkins: LivingPumpkinActor[] = [];
  private paradeFloats: GhostParadeFloatActor[] = [];
  private ferrisWheels: CursedFerrisWheelActor[] = [];
  private ghostParades: GhostParadeActor[] = [];
  private batSwarms: BatSwarmActor[] = [];
  private funhouseTricks: FunhouseTrickActor[] = [];
  private ambient: AmbientHauntingActor = {
    swingingLanterns: [],
    willOWisps: [],
    creakingSigns: []
  };

  private constructor() {}

  public static getInstance(): HauntedCarnivalEventDirector {
    if (!this.instance) {
      this.instance = new HauntedCarnivalEventDirector();
    }
    return this.instance;
  }

  // --- Registration Methods ---

  public registerWatcher(actor: WatcherActor): void {
    this.watchers.push(actor);
  }

  public registerCarousel(actor: HauntedCarouselActor): void {
    this.carousels.push(actor);
  }

  public registerMansionAwakens(actor: MansionAwakensActor): void {
    this.mansionAwakens.push(actor);
  }

  public registerNightmareClown(actor: NightmareClownActor): void {
    this.nightmareClowns.push(actor);
  }

  public registerShadowColossus(actor: ShadowColossusActor): void {
    this.shadowColossi.push(actor);
  }

  public registerGhost(actor: SurpriseGhostActor): void {
    this.ghosts.push(actor);
  }

  public registerRingmaster(actor: RingmasterActor): void {
    this.ringmasters.push(actor);
  }

  public registerGhostClown(actor: GhostClownActor): void {
    this.ghostClowns.push(actor);
  }

  public registerHauntedDoll(actor: HauntedDollActor): void {
    this.hauntedDolls.push(actor);
  }

  public registerShadowCreature(actor: GiantShadowCreatureActor): void {
    this.shadowCreatures.push(actor);
  }

  public registerMirrorGlitch(actor: MirrorGlitchActor): void {
    this.mirrorGlitches.push(actor);
  }

  public registerGhostTrain(actor: GhostTrainActor): void {
    this.ghostTrains.push(actor);
  }

  public registerLivingPumpkin(actor: LivingPumpkinActor): void {
    this.livingPumpkins.push(actor);
  }

  public registerParadeFloat(actor: GhostParadeFloatActor): void {
    this.paradeFloats.push(actor);
  }

  public registerCursedFerrisWheel(actor: CursedFerrisWheelActor): void {
    this.ferrisWheels.push(actor);
  }

  public registerGhostParade(actor: GhostParadeActor): void {
    this.ghostParades.push(actor);
  }

  public registerBatSwarm(actor: BatSwarmActor): void {
    this.batSwarms.push(actor);
  }

  public registerFunhouseTrick(actor: FunhouseTrickActor): void {
    this.funhouseTricks.push(actor);
  }

  public registerSwingingLantern(mesh: THREE.Object3D, axis: 'x' | 'z' = 'z', freq: number = 2.0, phase: number = 0): void {
    this.ambient.swingingLanterns.push({ mesh, axis, phase, freq });
  }

  public registerWillOWisp(mesh: THREE.Mesh, center: THREE.Vector3, radius: number = 2.5, freq: number = 1.8, phase: number = 0): void {
    this.ambient.willOWisps.push({ mesh, center: center.clone(), radius, freq, phase });
  }

  public registerCreakingSign(mesh: THREE.Object3D, phase: number = 0): void {
    this.ambient.creakingSigns.push({ mesh, phase });
  }

  // --- Diagnostics Getters ---
  public getWatcherCount(): number { return this.watchers.length; }
  public getCarouselCount(): number { return this.carousels.length; }
  public getMansionAwakensCount(): number { return this.mansionAwakens.length; }
  public getNightmareClownCount(): number { return this.nightmareClowns.length; }
  public getShadowColossusCount(): number { return this.shadowColossi.length; }
  public getGhostCount(): number { return this.ghosts.length; }
  public getRingmasterCount(): number { return this.ringmasters.length; }
  public getGhostClownCount(): number { return this.ghostClowns.length; }
  public getFerrisWheelCount(): number { return this.ferrisWheels.length; }
  public getGhostParadeCount(): number { return this.ghostParades.length; }

  public getTotalActiveElements(): number {
    return this.watchers.length + this.carousels.length + this.mansionAwakens.length +
      this.nightmareClowns.length + this.shadowColossi.length + this.ghosts.length +
      this.ringmasters.length + this.ghostClowns.length + this.hauntedDolls.length +
      this.shadowCreatures.length + this.mirrorGlitches.length + this.ghostTrains.length +
      this.livingPumpkins.length + this.paradeFloats.length + this.ferrisWheels.length +
      this.ghostParades.length + this.batSwarms.length + this.funhouseTricks.length;
  }

  // --- Lifecycle & Pruning ---

  public reset(): void {
    this.watchers.length = 0;
    this.carousels.length = 0;
    this.mansionAwakens.length = 0;
    this.nightmareClowns.length = 0;
    this.shadowColossi.length = 0;
    this.ghosts.length = 0;
    this.ringmasters.length = 0;
    this.ghostClowns.length = 0;
    this.hauntedDolls.length = 0;
    this.shadowCreatures.length = 0;
    this.mirrorGlitches.length = 0;
    this.ghostTrains.length = 0;
    this.livingPumpkins.length = 0;
    this.paradeFloats.length = 0;
    this.ferrisWheels.length = 0;
    this.ghostParades.length = 0;
    this.batSwarms.length = 0;
    this.funhouseTricks.length = 0;
    this.ambient.swingingLanterns.length = 0;
    this.ambient.willOWisps.length = 0;
    this.ambient.creakingSigns.length = 0;
    this.totalTime = 0;
  }

  private isDetached(obj: THREE.Object3D): boolean {
    let current: THREE.Object3D | null = obj;
    while (current) {
      if (!current.parent) {
        return current.type !== 'Scene' && !(current as any).isScene;
      }
      current = current.parent;
    }
    return true;
  }

  private pruneDetached(): void {
    this.watchers = this.watchers.filter((a) => !this.isDetached(a.group));
    this.carousels = this.carousels.filter((a) => !this.isDetached(a.group));
    this.mansionAwakens = this.mansionAwakens.filter((a) => !this.isDetached(a.group));
    this.nightmareClowns = this.nightmareClowns.filter((a) => !this.isDetached(a.group));
    this.shadowColossi = this.shadowColossi.filter((a) => !this.isDetached(a.group));
    this.ghosts = this.ghosts.filter((a) => !this.isDetached(a.group));
    this.ringmasters = this.ringmasters.filter((a) => !this.isDetached(a.group));
    this.ghostClowns = this.ghostClowns.filter((a) => !this.isDetached(a.group));
    this.hauntedDolls = this.hauntedDolls.filter((a) => !this.isDetached(a.group));
    this.shadowCreatures = this.shadowCreatures.filter((a) => !this.isDetached(a.group));
    this.mirrorGlitches = this.mirrorGlitches.filter((a) => !this.isDetached(a.mirrorMesh));
    this.ghostTrains = this.ghostTrains.filter((a) => !this.isDetached(a.group));
    this.livingPumpkins = this.livingPumpkins.filter((a) => !this.isDetached(a.group));
    this.paradeFloats = this.paradeFloats.filter((a) => !this.isDetached(a.group));
    this.ferrisWheels = this.ferrisWheels.filter((a) => !this.isDetached(a.group));
    this.ghostParades = this.ghostParades.filter((a) => !this.isDetached(a.group));
    this.batSwarms = this.batSwarms.filter((a) => !this.isDetached(a.group));
    this.funhouseTricks = this.funhouseTricks.filter((a) => !this.isDetached(a.group));
    this.ambient.swingingLanterns = this.ambient.swingingLanterns.filter((a) => !this.isDetached(a.mesh));
    this.ambient.willOWisps = this.ambient.willOWisps.filter((a) => !this.isDetached(a.mesh));
    this.ambient.creakingSigns = this.ambient.creakingSigns.filter((a) => !this.isDetached(a.mesh));
  }

  // --- Main Update Loop ---

  public update(dt: number, isCurrentTheme: boolean, playerZ: number = 0): void {
    if (!isCurrentTheme) return;

    this.totalTime += dt;
    this.frameCounter++;

    if (this.frameCounter % 45 === 0) {
      this.pruneDetached();
    }

    const t = this.totalTime;
    const reducedMotion = SettingsManager.getInstance().isReducedMotion();
    const motionScale = reducedMotion ? 0.35 : 1.0;

    let pZ = playerZ;
    if (typeof window !== 'undefined' && (!pZ || pZ === 0)) {
      const game = (window as any).__METRO_GAME__;
      if (game && game.getPlayer && game.getPlayer()) {
        pZ = game.getPlayer().position.z;
      }
    }

    // =========================================================================
    // FLAGSHIP 1: THE WATCHER (Opening & Recurring Psychological Jumpscare)
    // =========================================================================
    for (let w = 0; w < this.watchers.length; w++) {
      const watcher = this.watchers[w];
      const distanceAhead = pZ - watcher.worldZ; // Canonical negative-Z signed distance
      watcher.stateTimer += dt;

      if (distanceAhead > 130) {
        watcher.state = 'DORMANT';
        watcher.distantFigure.visible = true;
        watcher.closeFigure.visible = false;
        watcher.closeFigure.scale.set(1, 1, 1);
        watcher.closeFigure.position.set(0, 0.6, 0);
        watcher.distantLampLight.scale.setScalar(1.0);
        watcher.distantHead.rotation.y = 0;
      } else if (distanceAhead > 75) {
        watcher.state = 'DISTANT_WATCHING';
        watcher.distantFigure.visible = true;
        watcher.closeFigure.visible = false;
        // Subtle motionless silhouette standing under dim gaslight
        watcher.distantHead.rotation.y = Math.sin(t * 0.8) * 0.05;
      } else if (distanceAhead > 35) {
        watcher.state = 'SUSPENSE_TURNING';
        watcher.distantFigure.visible = true;
        watcher.closeFigure.visible = false;

        // Lamp slowly dims and flickers
        const flicker = 0.35 + 0.25 * Math.sin(t * 14.0) * Math.cos(t * 9.0);
        watcher.distantLampLight.scale.setScalar(flicker);

        // Figure slowly rotates head to face the runner
        const targetRotY = THREE.MathUtils.clamp((distanceAhead - 35) / 40, 0, 1.0);
        watcher.distantHead.rotation.y = (1.0 - targetRotY) * (watcher.side > 0 ? -1.2 : 1.2);

        // Faint pale eyes glow into visibility
        for (let e = 0; e < watcher.distantEyes.length; e++) {
          const eye = watcher.distantEyes[e];
          eye.scale.setScalar(0.7 + 0.3 * Math.sin(t * 6.0));
        }
      } else if (distanceAhead > 22) {
        watcher.state = 'VANISHED';
        // Lamp goes out, distant figure is GONE
        watcher.distantLampLight.scale.setScalar(0.001);
        watcher.distantFigure.visible = false;
        watcher.closeFigure.visible = false;
      } else if (distanceAhead > -12) {
        if (watcher.state !== 'CLOSE_SHOCK') {
          watcher.state = 'CLOSE_SHOCK';
          HauntedAudioEngine.playWatcherShock();
        }
        // SUDDEN CLOSE SHOCK ON SAFE ELEVATED PLATFORM
        watcher.distantFigure.visible = false;
        watcher.closeFigure.visible = true;

        // Unnatural lunging movement toward viewing edge (strictly |X| >= 5.15m)
        const lungeProgress = Math.min(1.0, Math.max(0.0, (22 - distanceAhead) / 10));
        const lungeOffset = lungeProgress * 0.45;
        watcher.closeFigure.position.x = (watcher.side > 0 ? -lungeOffset : lungeOffset);
        watcher.closeFigure.position.z = Math.sin(t * 22.0) * 0.08 * motionScale;

        // Limbs reach forward unnaturally
        watcher.closeArmLeft.rotation.x = -1.2 + Math.sin(t * 18.0) * 0.25 * motionScale;
        watcher.closeArmRight.rotation.x = -1.1 + Math.cos(t * 16.0) * 0.25 * motionScale;
        watcher.closeHead.rotation.x = 0.25;
        watcher.closeHead.rotation.y = watcher.side > 0 ? -0.4 : 0.4;

        // Eyes pulse intensely
        for (let e = 0; e < watcher.closeEyes.length; e++) {
          watcher.closeEyes[e].scale.setScalar(1.2 + 0.3 * Math.sin(t * 25.0));
        }
      } else if (distanceAhead > -40) {
        watcher.state = 'DISSOLVING';
        const dissolveProg = Math.min(1.0, (-12 - distanceAhead) / 28);
        const scaleVal = Math.max(0.001, 1.0 - dissolveProg);
        watcher.closeFigure.scale.set(scaleVal, scaleVal, scaleVal);
        watcher.closeFigure.position.y = 0.6 + dissolveProg * 2.2; // Drifts upward into mist

        if (dissolveProg >= 1.0) {
          watcher.closeFigure.visible = false;
        }

        // Lamp returns to steady ambient glow
        watcher.distantLampLight.scale.setScalar(0.8);
      } else {
        watcher.state = 'COMPLETED';
        watcher.closeFigure.visible = false;
        watcher.distantFigure.visible = false;
      }
    }

    // =========================================================================
    // FLAGSHIP 2: THE POSSESSED CAROUSEL (12-Stage Cinematic Awakening)
    // =========================================================================
    for (let i = 0; i < this.carousels.length; i++) {
      const c = this.carousels[i];
      const distanceAhead = pZ - c.worldZ; // Canonical negative-Z signed distance
      c.stageTimer += dt;

      // 12-Stage Progression
      if (distanceAhead > 140) {
        c.stage = 'ABANDONED_STILL';
        c.currentSpeed = 0;
        if (c.outsideSpecter) c.outsideSpecter.visible = false;
      } else if (distanceAhead > 115) {
        if (c.stage !== 'MUSIC_CUE') {
          c.stage = 'MUSIC_CUE';
          HauntedAudioEngine.playCarouselMusicBox();
        }
        c.currentSpeed = 0;
      } else if (distanceAhead > 95) {
        c.stage = 'STEED_HEAD_TURN';
        c.currentSpeed = 0;
        // Lead steed independently turns head toward oncoming tracks
        if (c.leadSteedHead) {
          c.leadSteedHead.rotation.y = THREE.MathUtils.lerp(c.leadSteedHead.rotation.y, 1.2, dt * 3.0);
        }
      } else if (distanceAhead > 80) {
        c.stage = 'RIDER_MATERIALIZE_1';
        c.currentSpeed = c.rotationSpeed * 0.15;
        // First phantom child silhouette fades in
        if (c.steeds[0] && c.steeds[0].rider) {
          c.steeds[0].rider.visible = true;
          c.steeds[0].rider.scale.setScalar(Math.min(1.0, c.steeds[0].rider.scale.x + dt * 2.0));
        }
      } else if (distanceAhead > 65) {
        c.stage = 'SLOW_ROTATION';
        c.currentSpeed = THREE.MathUtils.lerp(c.currentSpeed, c.rotationSpeed * 0.5, dt * 2.0);
      } else if (distanceAhead > 50) {
        c.stage = 'ALL_RIDERS_FADE_IN';
        c.currentSpeed = THREE.MathUtils.lerp(c.currentSpeed, c.rotationSpeed, dt * 2.5);
        // All riders materialize
        for (let s = 0; s < c.steeds.length; s++) {
          const rider = c.steeds[s]?.rider;
          if (rider) {
            rider.visible = true;
          }
        }
      } else if (distanceAhead > 35) {
        c.stage = 'LIGHTING_PALETTE_SHIFT';
        c.currentSpeed = c.rotationSpeed * 1.35;
        // Bulbs shift to unsettling blood crimson & violet
        if (c.lanternBulbs) {
          for (let b = 0; b < c.lanternBulbs.length; b++) {
            const bulb = c.lanternBulbs[b];
            const mat = bulb.material as THREE.MeshBasicMaterial;
            if (mat && mat.color) {
              mat.color.setHex(b % 2 === 0 ? 0x991b1b : 0x4a044e);
            }
          }
        }
      } else if (distanceAhead > 18) {
        c.stage = 'RIDERS_TURN_TO_TRACK';
        c.currentSpeed = c.rotationSpeed * 1.4;
        // Riders snap heads toward oncoming player
        for (let s = 0; s < c.steeds.length; s++) {
          const rider = c.steeds[s]?.rider;
          if (rider) {
            rider.rotation.y = THREE.MathUtils.lerp(rider.rotation.y, Math.PI * 0.5, dt * 5.0);
          }
        }
      } else if (distanceAhead > 0) {
        c.stage = 'OUTSIDE_SPECTER';
        c.currentSpeed = c.rotationSpeed * 1.2;
        // Phantom conductor appears outside ride at trackside verge
        if (c.outsideSpecter) {
          c.outsideSpecter.visible = true;
          c.outsideSpecter.position.y = Math.sin(t * 3.5) * 0.3;
        }
      } else if (distanceAhead > -15) {
        c.stage = 'ABRUPT_STOP';
        // Carousel halts abruptly with shudder
        c.currentSpeed = 0;
        c.turntable.rotation.y += Math.sin(t * 35.0) * 0.015 * motionScale;
      } else if (distanceAhead > -30) {
        c.stage = 'ALL_RIDERS_VANISH';
        c.currentSpeed = 0;
        // All riders vanish into thin air
        for (let s = 0; s < c.steeds.length; s++) {
          const rider = c.steeds[s]?.rider;
          if (rider) {
            rider.visible = false;
          }
        }
        if (c.outsideSpecter) c.outsideSpecter.visible = false;
      } else {
        c.stage = 'LINGERING_SWAY';
        c.currentSpeed = 0;
        // Lone steed sways faintly in dead silence
        if (c.steeds[0]) {
          c.steeds[0].mesh.rotation.z = Math.sin(t * 1.2) * 0.05 * motionScale;
        }
      }

      // Rotate turntable according to current active speed
      c.turntable.rotation.y += c.currentSpeed * motionScale * dt;
      c.canopy.rotation.y -= c.currentSpeed * 0.4 * motionScale * dt;

      // Sinusoidal bobbing steeds
      for (let s = 0; s < c.steeds.length; s++) {
        const steed = c.steeds[s];
        const bob = Math.sin(t * steed.frequency * motionScale + steed.phase) * steed.amplitude;
        steed.mesh.position.y = steed.baseY + bob;
        steed.pole.position.y = steed.baseY + bob * 0.5;

        if (steed.rider && steed.rider.visible) {
          steed.rider.position.y = steed.baseY + bob + 0.65;
          steed.rider.rotation.z = Math.sin(t * 3.0 + steed.phase) * 0.08 * motionScale;
        }
      }

      // Organ pipes
      if (c.organPipes) {
        for (let p = 0; p < c.organPipes.length; p++) {
          const pipe = c.organPipes[p];
          const scaleY = 1.0 + Math.sin(t * 6.0 + p * 0.7) * 0.08 * motionScale;
          pipe.scale.set(1.0, scaleY, 1.0);
        }
      }
    }

    // =========================================================================
    // FLAGSHIP 3: THE HAUNTED MANSION AWAKENS (858m Cinematic Showpiece)
    // =========================================================================
    for (let m = 0; m < this.mansionAwakens.length; m++) {
      const manor = this.mansionAwakens[m];
      const distanceAhead = pZ - manor.worldZ; // Canonical negative-Z signed distance
      manor.stageTimer += dt;

      if (distanceAhead > 160) {
        manor.stage = 'QUIET';
        manor.highWindows.forEach(w => { w.silhouette.visible = false; w.mat.color.setHex(0xfbbf24); });
        manor.lowWindows.forEach(w => { w.silhouette.visible = false; w.mat.color.setHex(0xfbbf24); });
        manor.doorLeft.rotation.y = 0;
        manor.doorRight.rotation.y = 0;
        manor.portalWraith.visible = false;
        manor.colossusGroup.visible = false;
        manor.colossusGroup.position.y = 12.0;
      } else if (distanceAhead > 130) {
        manor.stage = 'HIGH_WINDOW_SILHOUETTE';
        // Silhouette appears in high window looking down
        if (manor.highWindows[1]) {
          manor.highWindows[1].silhouette.visible = true;
          manor.highWindows[1].silhouette.position.y = Math.sin(t * 1.5) * 0.1;
        }
      } else if (distanceAhead > 105) {
        manor.stage = 'LOW_WINDOW_SILHOUETTE';
        // Figure appears in lower window
        if (manor.lowWindows[0]) {
          manor.lowWindows[0].silhouette.visible = true;
        }
      } else if (distanceAhead > 80) {
        manor.stage = 'WINDOWS_DARKEN';
        // Windows extinguish one by one
        const darkIdx = Math.floor((105 - distanceAhead) / 8);
        manor.highWindows.forEach((w, idx) => {
          if (idx <= darkIdx) w.mat.color.setHex(0x050508);
        });
        manor.lowWindows.forEach((w, idx) => {
          if (idx <= darkIdx) w.mat.color.setHex(0x050508);
        });
      } else if (distanceAhead > 55) {
        manor.stage = 'DOORS_OPENING';
        // Double doors slowly creak open
        manor.doorLeft.rotation.y = THREE.MathUtils.lerp(manor.doorLeft.rotation.y, -Math.PI * 0.45, dt * 1.8);
        manor.doorRight.rotation.y = THREE.MathUtils.lerp(manor.doorRight.rotation.y, Math.PI * 0.45, dt * 1.8);
      } else if (distanceAhead > 35) {
        manor.stage = 'WRAITH_EMERGE';
        // Spectral wraith floats out of portal
        manor.portalWraith.visible = true;
        manor.portalWraith.position.z += dt * 1.8;
        manor.portalWraith.position.y = 2.4 + Math.sin(t * 3.2) * 0.35;
      } else if (distanceAhead > 10) {
        if (manor.stage !== 'COLOSSUS_RISE') {
          manor.stage = 'COLOSSUS_RISE';
          HauntedAudioEngine.playColossusRumble();
        }
        // Monumental shadow colossus rises behind the manor towers
        manor.colossusGroup.visible = true;
        manor.colossusGroup.position.y = THREE.MathUtils.lerp(manor.colossusGroup.position.y, 36.0, dt * 2.2);
        manor.colossusHead.rotation.x = THREE.MathUtils.lerp(manor.colossusHead.rotation.x, 0.35, dt * 2.0);

        // Glowing red beacons pulse
        manor.colossusEyes.forEach(eye => {
          eye.scale.setScalar(1.2 + 0.35 * Math.sin(t * 8.0));
        });
      } else if (distanceAhead > -25) {
        manor.stage = 'HAND_OVER_ROOF';
        // Enormous clawed hand reaches over the rooftop tiles!
        manor.colossusRightClaw.rotation.x = THREE.MathUtils.lerp(manor.colossusRightClaw.rotation.x, -1.2, dt * 3.2);
        manor.colossusRightClaw.position.z = THREE.MathUtils.lerp(manor.colossusRightClaw.position.z, 8.5, dt * 3.0);
      } else {
        manor.stage = 'FADE_TO_DARKNESS';
        // Dissolves into atmospheric fog
        const fadeProg = Math.min(1.0, (-25 - distanceAhead) / 30);
        manor.colossusGroup.scale.setScalar(Math.max(0.001, 1.0 - fadeProg));
        manor.portalWraith.scale.setScalar(Math.max(0.001, 1.0 - fadeProg));
        if (fadeProg >= 1.0) {
          manor.colossusGroup.visible = false;
          manor.portalWraith.visible = false;
        }
      }
    }

    // =========================================================================
    // FLAGSHIP 4: THE NIGHTMARE CLOWN (Sinister Booth Encounter)
    // =========================================================================
    for (let c = 0; c < this.nightmareClowns.length; c++) {
      const clown = this.nightmareClowns[c];
      const distanceAhead = pZ - clown.worldZ; // Canonical negative-Z signed distance
      clown.timer += dt;

      if (distanceAhead > 90) {
        clown.state = 'PEEKING_INSIDE';
        clown.clownBody.visible = true;
        clown.clownBody.position.set(0, 1.2, 0);
        clown.clownHead.rotation.y = Math.sin(t * 2.0) * 0.2;
        clown.boothDoor.rotation.y = 0;
      } else if (distanceAhead > 75) {
        clown.state = 'DUCKING';
        clown.clownBody.position.y = THREE.MathUtils.lerp(clown.clownBody.position.y, 0.4, dt * 6.0);
      } else if (distanceAhead > 60) {
        clown.state = 'DOOR_OPENING';
        clown.boothDoor.rotation.y = THREE.MathUtils.lerp(clown.boothDoor.rotation.y, -Math.PI * 0.4, dt * 2.5);
      } else if (distanceAhead > 45) {
        clown.state = 'EMERGING';
        clown.clownBody.position.y = 0;
        clown.clownBody.position.z = THREE.MathUtils.lerp(clown.clownBody.position.z, 2.5, dt * 2.5);
      } else if (distanceAhead > 30) {
        clown.state = 'NOTICING_RUNNER';
        // Head jerks to face oncoming runner
        clown.clownHead.rotation.y = THREE.MathUtils.lerp(clown.clownHead.rotation.y, Math.PI * 0.5, dt * 8.0);
      } else if (distanceAhead > 10) {
        clown.state = 'STARTLING_LURCH';
        // Startling sudden lurch toward safe viewing edge (strictly |X| >= 4.8m)
        clown.clownBody.position.x = THREE.MathUtils.lerp(clown.clownBody.position.x, clown.baseX > 0 ? -1.8 : 1.8, dt * 7.0);
        clown.clownArmLeft.rotation.z = Math.sin(t * 25.0) * 0.6;
        clown.clownArmRight.rotation.x = -1.2 + Math.cos(t * 22.0) * 0.4;
      } else if (distanceAhead > 0) {
        clown.state = 'FROZEN_TWIST';
        // Rigid frozen contortion
        clown.clownHead.rotation.z = 0.45;
      } else if (distanceAhead > -15) {
        clown.state = 'HEAD_SNAP';
        // Head rotates 90 degrees mechanically
        clown.clownHead.rotation.y = Math.PI;
      } else {
        clown.state = 'VANISHED';
        clown.clownBody.visible = false;
      }
    }

    // =========================================================================
    // FLAGSHIP 5: THE SHADOW COLOSSUS (Rare Deep Skyline Titan)
    // =========================================================================
    for (let sc = 0; sc < this.shadowColossi.length; sc++) {
      const colossus = this.shadowColossi[sc];
      const distanceAhead = pZ - colossus.worldZ;
      const colT = t * 0.45 + colossus.phase;

      // Colossal slow breathing
      colossus.group.position.y = colossus.baseY + Math.sin(colT) * 2.5 * motionScale;
      colossus.leftClaw.rotation.z = Math.sin(colT * 0.8) * 0.22 * motionScale;
      colossus.rightClaw.rotation.z = -Math.cos(colT * 0.7) * 0.25 * motionScale;

      // Piercing eyes pulse
      for (let e = 0; e < colossus.eyes.length; e++) {
        colossus.eyes[e].scale.setScalar(1.0 + 0.35 * Math.sin(t * 4.0 + e));
      }

      // Track head toward runner when within 250m
      if (Math.abs(distanceAhead) < 250) {
        colossus.head.rotation.y = THREE.MathUtils.clamp(distanceAhead * 0.003, -0.4, 0.4);
      }
    }

    // =========================================================================
    // EXISTING SIGNATURE SCARES (WITH FIXED CANONICAL SIGNED DISTANCE)
    // =========================================================================

    // SCENE B: SURPRISE GHOST ENCOUNTER
    for (let i = 0; i < this.ghosts.length; i++) {
      const g = this.ghosts[i];
      // CORRECTED: distanceAhead = pZ - g.triggerZ (positive when approaching in negative-Z)
      const distanceAhead = pZ - g.triggerZ;

      if (g.state === 'HIDDEN') {
        if (distanceAhead <= 100 && distanceAhead >= -10) {
          g.state = 'EMERGING';
          g.hoverTime = 0;
          g.group.visible = true;
        }
      } else if (g.state === 'EMERGING') {
        g.hoverTime += dt;
        const progress = Math.min(1.0, g.hoverTime * 1.6);
        g.ghostMesh.position.x = THREE.MathUtils.lerp(g.startX, g.targetX, progress);
        g.ghostMesh.position.y = g.baseY + Math.sin(t * 2.8) * 0.4 * motionScale;

        if (progress >= 1.0) {
          g.state = 'HOVERING';
        }
      } else if (g.state === 'HOVERING') {
        g.hoverTime += dt;
        g.ghostMesh.position.y = g.baseY + Math.sin(t * 2.2 + g.side) * 0.38 * motionScale;
        g.ghostMesh.rotation.z = Math.sin(t * 1.5) * 0.07 * motionScale;

        // Head turns smoothly toward the oncoming runner
        if (g.headMesh) {
          const lookAngle = THREE.MathUtils.clamp(distanceAhead * 0.015, -0.65, 0.65);
          g.headMesh.rotation.y = lookAngle * (g.side > 0 ? 1 : -1);
        }

        if (g.lanternMesh) {
          g.lanternMesh.rotation.z = Math.sin(t * 3.2) * 0.22 * motionScale;
        }

        // Dissolve when player runs past
        if (distanceAhead < -20) {
          g.state = 'DISSOLVING';
          g.hoverTime = 0;
        }
      } else if (g.state === 'DISSOLVING') {
        g.hoverTime += dt;
        const dissolveProg = Math.min(1.0, g.hoverTime * 2.2);
        const scaleVal = Math.max(0.001, 1.0 - dissolveProg);
        g.ghostMesh.scale.set(scaleVal, scaleVal, scaleVal);
        g.ghostMesh.position.y += dt * 1.8;

        if (dissolveProg >= 1.0) {
          g.state = 'INACTIVE';
          g.group.visible = false;
        }
      }
    }

    // THE HAUNTED RINGMASTER
    for (let i = 0; i < this.ringmasters.length; i++) {
      const rm = this.ringmasters[i];
      const distanceAhead = pZ - rm.triggerZ; // CORRECTED

      if (distanceAhead <= 110 && distanceAhead >= -15) {
        rm.timer += dt;
        const bow = Math.sin(rm.timer * 2.5) * 0.25 * motionScale;
        rm.head.rotation.x = bow;
        rm.caneArm.rotation.z = Math.sin(rm.timer * 3.0) * 0.45 * motionScale;

        if (rm.caneOrb) {
          const orbGlow = 0.8 + 0.3 * Math.sin(t * 6.0);
          rm.caneOrb.scale.setScalar(orbGlow);
        }
      }
    }

    // MISCHIEVOUS GHOST CLOWN
    for (let i = 0; i < this.ghostClowns.length; i++) {
      const clown = this.ghostClowns[i];
      const distanceAhead = pZ - clown.triggerZ; // CORRECTED

      if (distanceAhead <= 85 && distanceAhead >= -15) {
        clown.timer += dt;
        const peek = Math.sin(clown.timer * 2.8) * clown.peekOffset * motionScale;
        clown.group.position.x = clown.baseX + peek;

        clown.armLeft.rotation.z = Math.sin(clown.timer * 5.0) * 0.35 * motionScale;
        clown.armRight.rotation.x = Math.cos(clown.timer * 4.0) * 0.35 * motionScale;

        for (let j = 0; j < clown.jugglingOrbs.length; j++) {
          const orb = clown.jugglingOrbs[j];
          const phase = clown.orbPhases[j] + t * 4.0 * motionScale;
          const orbX = Math.cos(phase) * 0.9;
          const orbY = Math.abs(Math.sin(phase)) * 1.4;
          orb.position.set(orbX, 2.2 + orbY, 0);
        }
      }
    }

    // HAUNTED DOLLS (Head Tracking Player)
    for (let i = 0; i < this.hauntedDolls.length; i++) {
      const doll = this.hauntedDolls[i];
      const distanceAhead = pZ - doll.worldZ; // CORRECTED

      if (Math.abs(distanceAhead) < 70) {
        const targetRotY = THREE.MathUtils.clamp(distanceAhead * 0.022 * doll.side, -0.85, 0.85);
        doll.head.rotation.y = THREE.MathUtils.lerp(doll.head.rotation.y, doll.baseRotY + targetRotY, dt * 4.0);
        doll.head.rotation.z = Math.sin(t * 1.8) * 0.08 * motionScale;
      }
    }

    // GIANT SHADOW CREATURE (Background Loom)
    for (let i = 0; i < this.shadowCreatures.length; i++) {
      const beast = this.shadowCreatures[i];
      const beastT = t * 0.65 + beast.phase;

      beast.group.position.y = beast.baseY + Math.sin(beastT) * 1.8 * motionScale;
      beast.leftClaw.rotation.z = Math.sin(beastT * 1.2) * 0.22 * motionScale;
      beast.rightClaw.rotation.z = -Math.cos(beastT * 0.9) * 0.25 * motionScale;

      for (let e = 0; e < beast.eyes.length; e++) {
        const eye = beast.eyes[e];
        const pulse = 0.8 + 0.35 * Math.sin(t * 3.5 + e);
        eye.scale.set(pulse, pulse, pulse);
      }
    }

    // CURSED MIRROR MAZE GLITCH
    for (let i = 0; i < this.mirrorGlitches.length; i++) {
      const mg = this.mirrorGlitches[i];
      mg.flickerTimer += dt;

      if (mg.ghostReflection) {
        mg.ghostReflection.position.y = Math.sin(t * 4.0 + mg.phase) * 0.12 * motionScale;
        mg.ghostReflection.rotation.y = Math.cos(t * 2.5 + mg.phase) * 0.18 * motionScale;
        const isFlicker = Math.sin(mg.flickerTimer * 9.0) > 0.85;
        mg.ghostReflection.visible = !isFlicker;
      }
    }

    // SPECTRAL GHOST TRAIN (Sky Viaduct Cross-Over)
    for (let i = 0; i < this.ghostTrains.length; i++) {
      const gt = this.ghostTrains[i];
      gt.group.position.z += gt.speed * dt * motionScale;

      if (gt.group.position.z > gt.maxZ) {
        gt.group.position.z = gt.minZ;
      } else if (gt.group.position.z < gt.minZ) {
        gt.group.position.z = gt.maxZ;
      }

      const wheelRot = gt.speed * dt * 2.5;
      for (let w = 0; w < gt.wheels.length; w++) {
        gt.wheels[w].rotation.x += wheelRot;
      }

      for (let g = 0; g < gt.spectralGlows.length; g++) {
        const glow = gt.spectralGlows[g];
        const p = 0.75 + 0.25 * Math.sin(t * 4.0 + g * 0.6);
        glow.scale.set(1.0, p, 1.0);
      }
    }

    // LIVING PUMPKIN PATCH (Watchful Jack-o'-Lanterns)
    for (let i = 0; i < this.livingPumpkins.length; i++) {
      const p = this.livingPumpkins[i];
      const distanceAhead = pZ - p.worldZ; // CORRECTED

      if (Math.abs(distanceAhead) < 70) {
        const targetAngle = THREE.MathUtils.clamp(distanceAhead * 0.025, -0.9, 0.9);
        p.head.rotation.y = THREE.MathUtils.lerp(p.head.rotation.y, p.baseRotY + targetAngle, dt * 5.0);
        const flicker = 0.8 + 0.3 * Math.sin(t * 12.0 + p.phase) * Math.cos(t * 7.5);
        p.glowMesh.scale.setScalar(flicker);
      }
    }

    // GHOST CARNIVAL PARADE FLOAT
    for (let i = 0; i < this.paradeFloats.length; i++) {
      const pf = this.paradeFloats[i];
      pf.group.rotation.z = Math.sin(t * 1.8) * 0.04 * motionScale;

      for (let s = 0; s < pf.skeletons.length; s++) {
        const skel = pf.skeletons[s];
        skel.torso.rotation.x = Math.sin(t * 3.5 + skel.phase) * 0.22 * motionScale;
        if (skel.instrument) {
          skel.instrument.rotation.z = Math.cos(t * 4.0 + skel.phase) * 0.25 * motionScale;
        }
      }

      for (let b = 0; b < pf.banners.length; b++) {
        pf.banners[b].rotation.x = Math.sin(t * 2.0 + b) * 0.12 * motionScale;
      }
    }

    // SPECTRAL BAT SWARM (Overhead Sky Arcs)
    for (let i = 0; i < this.batSwarms.length; i++) {
      const swarm = this.batSwarms[i];
      for (let b = 0; b < swarm.bats.length; b++) {
        const bat = swarm.bats[b];
        const angle = t * bat.orbitSpeed * motionScale + bat.phase;
        const bx = Math.cos(angle) * bat.orbitRadius;
        const bz = Math.sin(angle) * bat.orbitRadius;
        bat.mesh.position.set(bx, bat.baseY + Math.sin(t * 4.0 + b) * 1.2, bz);
        bat.mesh.rotation.y = -angle + Math.PI * 0.5;

        const flap = Math.sin(t * 16.0 + b * 2.0) * 0.55 * motionScale;
        bat.wingL.rotation.z = flap;
        bat.wingR.rotation.z = -flap;
      }
    }

    // TRICK FUNHOUSE FACADE ILLUSION
    for (let i = 0; i < this.funhouseTricks.length; i++) {
      const fh = this.funhouseTricks[i];
      fh.phase += dt * 1.5 * motionScale;

      for (let k = 0; k < fh.movingTiles.length; k++) {
        const tile = fh.movingTiles[k];
        tile.rotation.z = Math.sin(fh.phase + k * 1.2) * 0.06 * motionScale;
      }

      for (let e = 0; e < fh.eyeballs.length; e++) {
        const eye = fh.eyeballs[e];
        eye.rotation.y = Math.sin(t * 2.2 + e) * 0.45 * motionScale;
      }

      if (fh.mouthJaw) {
        fh.mouthJaw.position.y = -0.3 + Math.sin(t * 1.8) * 0.25 * motionScale;
      }
    }

    // =========================================================================
    // SIGNATURE B: THE CURSED FERRIS WHEEL (6-Stage Awakening)
    // =========================================================================
    for (let i = 0; i < this.ferrisWheels.length; i++) {
      const fw = this.ferrisWheels[i];
      const distanceAhead = pZ - fw.worldZ;
      fw.stageTimer += dt;

      if (distanceAhead > 140) {
        fw.stage = 'ABANDONED';
        fw.currentSpeed = 0;
        for (let b = 0; b < fw.rimBulbs.length; b++) fw.rimBulbs[b].visible = false;
        for (let g = 0; g < fw.gondolas.length; g++) {
          fw.gondolas[g].carriage.rotation.z = -fw.wheelRotation;
          if (fw.gondolas[g].specter) fw.gondolas[g].specter!.visible = false;
          if (fw.gondolas[g].lantern) fw.gondolas[g].lantern!.visible = false;
        }
      } else if (distanceAhead > 80) {
        fw.stage = 'LIGHTS_AWAKENING';
        fw.currentSpeed = THREE.MathUtils.lerp(fw.currentSpeed, fw.rotationSpeed * 0.35, dt * 2.0);
        fw.wheelRotation += fw.currentSpeed * dt * motionScale;
        fw.wheelRim.rotation.z = fw.wheelRotation;

        const antProg = (140 - distanceAhead) / 60;
        fw.illuminatedBulbsCount = Math.floor(antProg * fw.rimBulbs.length);
        for (let b = 0; b < fw.rimBulbs.length; b++) {
          const bulb = fw.rimBulbs[b];
          if (b <= fw.illuminatedBulbsCount) {
            bulb.visible = true;
            const bMat = bulb.material as THREE.MeshBasicMaterial;
            if (bMat) bMat.opacity = Math.min(1.0, 0.4 + antProg * 0.6);
          } else {
            bulb.visible = false;
          }
        }
        for (let g = 0; g < fw.gondolas.length; g++) {
          const gon = fw.gondolas[g];
          const sway = Math.sin(t * 1.5 + g * 0.5) * 0.05 * motionScale;
          gon.carriage.rotation.z = -fw.wheelRotation + sway;
          if (gon.specter) gon.specter.visible = false;
          if (gon.lantern) gon.lantern.visible = true;
        }
      } else if (distanceAhead > 25) {
        fw.stage = 'ROTATING';
        fw.currentSpeed = THREE.MathUtils.lerp(fw.currentSpeed, fw.rotationSpeed, dt * 2.5);
        fw.wheelRotation += fw.currentSpeed * dt * motionScale;
        fw.wheelRim.rotation.z = fw.wheelRotation;

        for (let b = 0; b < fw.rimBulbs.length; b++) fw.rimBulbs[b].visible = true;
        for (let g = 0; g < fw.gondolas.length; g++) {
          const gon = fw.gondolas[g];
          const sway = Math.sin(t * 2.0 + g * 0.6) * 0.08 * motionScale;
          gon.carriage.rotation.z = -fw.wheelRotation + sway;
          if (gon.lantern) gon.lantern.visible = true;
        }
      } else if (distanceAhead >= -30) {
        fw.stage = 'SILHOUETTES_REVEAL';
        fw.currentSpeed = THREE.MathUtils.lerp(fw.currentSpeed, fw.rotationSpeed, dt * 2.5);
        fw.wheelRotation += fw.currentSpeed * dt * motionScale;
        fw.wheelRim.rotation.z = fw.wheelRotation;

        for (let b = 0; b < fw.rimBulbs.length; b++) fw.rimBulbs[b].visible = true;
        for (let g = 0; g < fw.gondolas.length; g++) {
          const gon = fw.gondolas[g];
          const sway = Math.sin(t * 2.0 + g * 0.6) * 0.1 * motionScale;
          gon.carriage.rotation.z = -fw.wheelRotation + sway;
          if (gon.specter) {
            gon.specter.visible = true;
            gon.specter.rotation.y = THREE.MathUtils.lerp(gon.specter.rotation.y, -0.45, dt * 3.0);
            gon.specter.rotation.z = Math.sin(t * 3.0 + g) * 0.08;
          }
          if (gon.lantern) gon.lantern.visible = true;
        }
      } else if (distanceAhead >= -80) {
        fw.stage = 'FAIRGROUND_ALIVE';
        fw.wheelRotation += fw.currentSpeed * dt * motionScale;
        fw.wheelRim.rotation.z = fw.wheelRotation;

        for (let b = 0; b < fw.rimBulbs.length; b++) fw.rimBulbs[b].visible = true;
        for (let g = 0; g < fw.gondolas.length; g++) {
          const gon = fw.gondolas[g];
          gon.carriage.rotation.z = -fw.wheelRotation + Math.sin(t * 1.6 + g * 0.5) * 0.06 * motionScale;
          if (gon.specter) gon.specter.visible = true;
          if (gon.lantern) gon.lantern.visible = true;
        }
      } else {
        fw.stage = 'SETTLED';
        fw.currentSpeed = THREE.MathUtils.lerp(fw.currentSpeed, 0, dt * 1.2);
        fw.wheelRotation += fw.currentSpeed * dt * motionScale;
        fw.wheelRim.rotation.z = fw.wheelRotation;
        for (let g = 0; g < fw.gondolas.length; g++) {
          fw.gondolas[g].carriage.rotation.z = -fw.wheelRotation;
          if (fw.gondolas[g].specter) fw.gondolas[g].specter!.visible = false;
        }
      }
    }

    // =========================================================================
    // SIGNATURE A: THE GHOST PARADE (6-Stage Procession)
    // =========================================================================
    for (let i = 0; i < this.ghostParades.length; i++) {
      const gp = this.ghostParades[i];
      const distanceAhead = pZ - gp.worldZ;
      gp.stageTimer += dt;

      if (distanceAhead > 120) {
        gp.stage = 'CONCEALED';
        gp.group.visible = false;
        for (let s = 0; s < gp.specters.length; s++) gp.specters[s].mesh.visible = false;
      } else if (distanceAhead > 65) {
        gp.stage = 'EMERGENCE';
        gp.group.visible = true;
        const emNorm = (120 - distanceAhead) / 55;
        for (let s = 0; s < gp.specters.length; s++) {
          const sp = gp.specters[s];
          sp.mesh.visible = true;
          const sScale = emNorm;
          sp.mesh.scale.set(sScale, sScale, sScale);
          sp.mesh.position.y = 1.2 + emNorm * 1.6 + Math.sin(t * 2.5 + sp.phaseOffset) * 0.3 * motionScale;
          sp.mesh.position.x = sp.lateralOffset + Math.sin(t * 1.2 + sp.phaseOffset) * 0.4;
        }
      } else if (distanceAhead > 15) {
        gp.stage = 'PROCESSION';
        gp.group.visible = true;
        const procProg = (65 - distanceAhead) / 50;
        for (let s = 0; s < gp.specters.length; s++) {
          const sp = gp.specters[s];
          sp.mesh.visible = true;
          sp.mesh.scale.set(1.0, 1.0, 1.0);
          sp.mesh.position.y = 2.8 + Math.sin(t * 2.8 + sp.phaseOffset) * 0.35 * motionScale;
          const snakeZ = -s * 5.0 - procProg * 12.0;
          sp.mesh.position.z = snakeZ;
          sp.mesh.position.x = sp.lateralOffset + Math.sin(t * 2.0 - s * 0.8) * 0.7 * motionScale;
          for (let a = 0; a < sp.arms.length; a++) {
            sp.arms[a].rotation.z = Math.sin(t * 3.5 + s + a * Math.PI) * 0.35 * motionScale;
          }
          sp.tail.rotation.x = Math.sin(t * 2.2 + s) * 0.25 * motionScale;
          sp.head.rotation.y = Math.sin(t * 1.8 + s) * 0.2;
          if (sp.lantern) {
            sp.lantern.position.y = Math.sin(t * 4.0) * 0.15;
          }
        }
      } else if (distanceAhead >= -35) {
        gp.stage = 'REACTION';
        gp.group.visible = true;
        for (let s = 0; s < gp.specters.length; s++) {
          const sp = gp.specters[s];
          sp.mesh.visible = true;
          sp.head.rotation.y = THREE.MathUtils.lerp(sp.head.rotation.y, 0.65, dt * 4.0);
          for (let a = 0; a < sp.arms.length; a++) {
            sp.arms[a].rotation.z = 0.5 + Math.sin(t * 5.0 + s) * 0.45 * motionScale;
          }
          sp.mesh.position.y = 2.8 + Math.sin(t * 3.2 + sp.phaseOffset) * 0.3 * motionScale;
          if (sp.lantern) {
            const lMat = sp.lantern.material as THREE.MeshBasicMaterial;
            if (lMat) lMat.opacity = 0.95;
          }
        }
      } else if (distanceAhead >= -90) {
        gp.stage = 'DISAPPEARANCE';
        gp.group.visible = true;
        const disProg = (-35 - distanceAhead) / 55;
        for (let s = 0; s < gp.specters.length; s++) {
          const sp = gp.specters[s];
          const fadeScale = Math.max(0.01, 1.0 - disProg * 0.9);
          sp.mesh.scale.set(fadeScale, fadeScale, fadeScale);
          sp.mesh.position.y += dt * 1.2;
        }
        if (gp.mistPortal) {
          gp.mistPortal.visible = true;
          gp.mistPortal.rotation.z += dt * 1.8;
        }
      } else {
        gp.stage = 'SETTLED';
        gp.group.visible = false;
      }
    }

    // AMBIENT HAUNTINGS: LANTERNS, WILL-O'-THE-WISPS, CREAKING SIGNS
    for (let i = 0; i < this.ambient.swingingLanterns.length; i++) {
      const l = this.ambient.swingingLanterns[i];
      const angle = Math.sin(t * l.freq * motionScale + l.phase) * 0.22 * motionScale;
      if (l.axis === 'x') {
        l.mesh.rotation.x = angle;
      } else {
        l.mesh.rotation.z = angle;
      }
    }

    for (let i = 0; i < this.ambient.willOWisps.length; i++) {
      const w = this.ambient.willOWisps[i];
      const wt = t * w.freq * motionScale + w.phase;
      const ox = Math.cos(wt) * w.radius;
      const oz = Math.sin(wt * 0.8) * w.radius;
      const oy = Math.sin(wt * 1.5) * 0.65;
      w.mesh.position.set(w.center.x + ox, w.center.y + oy, w.center.z + oz);
      w.mesh.scale.setScalar(0.75 + 0.25 * Math.sin(wt * 3.0));
    }

    for (let i = 0; i < this.ambient.creakingSigns.length; i++) {
      const s = this.ambient.creakingSigns[i];
      s.mesh.rotation.z = Math.sin(t * 1.4 * motionScale + s.phase) * 0.12 * motionScale;
    }
  }

  // --- Diagnostics ---

  public getDiagnostics(): Record<string, number> {
    return {
      watchers: this.watchers.length,
      carousels: this.carousels.length,
      mansionAwakens: this.mansionAwakens.length,
      nightmareClowns: this.nightmareClowns.length,
      shadowColossi: this.shadowColossi.length,
      ghosts: this.ghosts.length,
      ringmasters: this.ringmasters.length,
      ghostClowns: this.ghostClowns.length,
      hauntedDolls: this.hauntedDolls.length,
      shadowCreatures: this.shadowCreatures.length,
      mirrorGlitches: this.mirrorGlitches.length,
      ghostTrains: this.ghostTrains.length,
      livingPumpkins: this.livingPumpkins.length,
      paradeFloats: this.paradeFloats.length,
      ferrisWheels: this.ferrisWheels.length,
      ghostParades: this.ghostParades.length,
      batSwarms: this.batSwarms.length,
      funhouseTricks: this.funhouseTricks.length,
      swingingLanterns: this.ambient.swingingLanterns.length,
      willOWisps: this.ambient.willOWisps.length,
      creakingSigns: this.ambient.creakingSigns.length
    };
  }
}
