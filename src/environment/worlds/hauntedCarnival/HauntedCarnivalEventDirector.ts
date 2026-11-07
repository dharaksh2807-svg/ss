import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';

/**
 * Actor Interfaces for Haunted Carnival Dynamic Encounters
 */

export interface SteedActor {
  mesh: THREE.Object3D;
  pole: THREE.Object3D;
  rider?: THREE.Object3D;
  baseY: number;
  amplitude: number;
  frequency: number;
  phase: number;
}

export interface HauntedCarouselActor {
  group: THREE.Group;
  turntable: THREE.Object3D;
  canopy: THREE.Object3D;
  steeds: SteedActor[];
  centerOrgan?: THREE.Object3D;
  organPipes?: THREE.Object3D[];
  lanternBulbs?: THREE.Mesh[];
  rotationSpeed: number;
  worldZ: number;
  isAwakened: boolean;
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
 * HauntedCarnivalEventDirector
 * Coordinates and animates all 12 signature scares, Scene A (Carousel), Scene B (Ghost Encounter),
 * and ambient hauntings with performance safety, reduced-motion awareness, and leak-free lifecycle pruning.
 */
export class HauntedCarnivalEventDirector {
  private static instance: HauntedCarnivalEventDirector | null = null;

  private totalTime: number = 0;
  private frameCounter: number = 0;

  // Registered Actors
  private carousels: HauntedCarouselActor[] = [];
  private ghosts: SurpriseGhostActor[] = [];
  private ringmasters: RingmasterActor[] = [];
  private ghostClowns: GhostClownActor[] = [];
  private hauntedDolls: HauntedDollActor[] = [];
  private shadowCreatures: GiantShadowCreatureActor[] = [];
  private mirrorGlitches: MirrorGlitchActor[] = [];
  private ghostTrains: GhostTrainActor[] = [];
  private livingPumpkins: LivingPumpkinActor[] = [];
  private paradeFloats: GhostParadeFloatActor[] = [];
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

  public registerCarousel(actor: HauntedCarouselActor): void {
    this.carousels.push(actor);
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

  // --- Lifecycle & Pruning ---

  public reset(): void {
    this.carousels.length = 0;
    this.ghosts.length = 0;
    this.ringmasters.length = 0;
    this.ghostClowns.length = 0;
    this.hauntedDolls.length = 0;
    this.shadowCreatures.length = 0;
    this.mirrorGlitches.length = 0;
    this.ghostTrains.length = 0;
    this.livingPumpkins.length = 0;
    this.paradeFloats.length = 0;
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
        return current.type !== 'Scene';
      }
      current = current.parent;
    }
    return true;
  }

  private pruneDetached(): void {
    this.carousels = this.carousels.filter((a) => !this.isDetached(a.group));
    this.ghosts = this.ghosts.filter((a) => !this.isDetached(a.group));
    this.ringmasters = this.ringmasters.filter((a) => !this.isDetached(a.group));
    this.ghostClowns = this.ghostClowns.filter((a) => !this.isDetached(a.group));
    this.hauntedDolls = this.hauntedDolls.filter((a) => !this.isDetached(a.group));
    this.shadowCreatures = this.shadowCreatures.filter((a) => !this.isDetached(a.group));
    this.mirrorGlitches = this.mirrorGlitches.filter((a) => !this.isDetached(a.mirrorMesh));
    this.ghostTrains = this.ghostTrains.filter((a) => !this.isDetached(a.group));
    this.livingPumpkins = this.livingPumpkins.filter((a) => !this.isDetached(a.group));
    this.paradeFloats = this.paradeFloats.filter((a) => !this.isDetached(a.group));
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

    // 1. SCENE A: THE HAUNTED CAROUSEL AWAKENING
    for (let i = 0; i < this.carousels.length; i++) {
      const c = this.carousels[i];
      const dist = Math.abs(c.worldZ - pZ);

      // Proximity awakening: starts slow, accelerates and pulses lights when player approaches
      const awakenDistance = 140;
      if (dist < awakenDistance && !c.isAwakened) {
        c.isAwakened = true;
      }

      const activeSpeed = (c.isAwakened ? c.rotationSpeed : c.rotationSpeed * 0.3) * motionScale;

      // Rotate circular platform
      c.turntable.rotation.y += activeSpeed * dt;

      // Canopy subtle counter-rotation
      c.canopy.rotation.y -= activeSpeed * 0.45 * dt;

      // Vertical sinusoidal bobbing steeds & ghostly riders
      for (let s = 0; s < c.steeds.length; s++) {
        const steed = c.steeds[s];
        const bob = Math.sin(t * steed.frequency * motionScale + steed.phase) * steed.amplitude;
        steed.mesh.position.y = steed.baseY + bob;
        steed.pole.position.y = steed.baseY + bob * 0.5;

        if (steed.rider) {
          steed.rider.position.y = steed.baseY + bob + 0.65;
          // Ghost rider undulating spectral sway
          steed.rider.rotation.z = Math.sin(t * 3.0 + steed.phase) * 0.08 * motionScale;
        }
      }

      // Center organ pipe puffing animation
      if (c.organPipes) {
        for (let p = 0; p < c.organPipes.length; p++) {
          const pipe = c.organPipes[p];
          const scaleY = 1.0 + Math.sin(t * 6.0 + p * 0.7) * 0.08 * motionScale;
          pipe.scale.set(1.0, scaleY, 1.0);
        }
      }

      // Bulb lights chasing pattern
      if (c.lanternBulbs) {
        for (let b = 0; b < c.lanternBulbs.length; b++) {
          const bulb = c.lanternBulbs[b];
          const pulse = 0.5 + 0.5 * Math.sin(t * 5.0 + b * 0.4);
          if ((bulb.material as THREE.MeshBasicMaterial).color) {
            bulb.scale.setScalar(0.85 + pulse * 0.3);
          }
        }
      }
    }

    // 2. SCENE B: SURPRISE GHOST ENCOUNTER
    for (let i = 0; i < this.ghosts.length; i++) {
      const g = this.ghosts[i];
      const distToTrigger = g.triggerZ - pZ; // Positive when player is approaching (running towards negative Z)

      // State Machine for elegant emergence and dissolution
      if (g.state === 'HIDDEN') {
        if (distToTrigger < 95 && distToTrigger > -10) {
          g.state = 'EMERGING';
          g.hoverTime = 0;
          g.group.visible = true;
        }
      } else if (g.state === 'EMERGING') {
        g.hoverTime += dt;
        const progress = Math.min(1.0, g.hoverTime * 1.6);
        // Smooth slide out from behind booth into side vista (strictly outside corridor)
        g.ghostMesh.position.x = THREE.MathUtils.lerp(g.startX, g.targetX, progress);
        g.ghostMesh.position.y = g.baseY + Math.sin(t * 2.8) * 0.4 * motionScale;

        if (progress >= 1.0) {
          g.state = 'HOVERING';
        }
      } else if (g.state === 'HOVERING') {
        g.hoverTime += dt;
        // Spectral floating hover motion
        g.ghostMesh.position.y = g.baseY + Math.sin(t * 2.2 + g.side) * 0.38 * motionScale;
        g.ghostMesh.rotation.z = Math.sin(t * 1.5) * 0.07 * motionScale;

        // Head turns smoothly toward the oncoming runner
        if (g.headMesh) {
          const lookAngle = THREE.MathUtils.clamp((pZ - g.triggerZ) * 0.015, -0.65, 0.65);
          g.headMesh.rotation.y = lookAngle * (g.side > 0 ? 1 : -1);
        }

        // Lantern swinging
        if (g.lanternMesh) {
          g.lanternMesh.rotation.z = Math.sin(t * 3.2) * 0.22 * motionScale;
        }

        // Dissolve when player runs past
        if (distToTrigger < -22) {
          g.state = 'DISSOLVING';
          g.hoverTime = 0;
        }
      } else if (g.state === 'DISSOLVING') {
        g.hoverTime += dt;
        const dissolveProg = Math.min(1.0, g.hoverTime * 2.2);
        const scaleVal = 1.0 - dissolveProg;
        g.ghostMesh.scale.set(scaleVal, scaleVal, scaleVal);
        g.ghostMesh.position.y += dt * 1.8; // Drifts upward into mist

        if (dissolveProg >= 1.0) {
          g.state = 'INACTIVE';
          g.group.visible = false;
        }
      }
    }

    // 3. THE HAUNTED RINGMASTER
    for (let i = 0; i < this.ringmasters.length; i++) {
      const rm = this.ringmasters[i];
      const dist = rm.triggerZ - pZ;

      if (dist < 110 && dist > -15) {
        rm.timer += dt;
        // Theatrical greeting: swings cane, tips hat / bows
        const bow = Math.sin(rm.timer * 2.5) * 0.25 * motionScale;
        rm.head.rotation.x = bow;
        rm.caneArm.rotation.z = Math.sin(rm.timer * 3.0) * 0.45 * motionScale;

        if (rm.caneOrb) {
          const orbGlow = 0.8 + 0.3 * Math.sin(t * 6.0);
          rm.caneOrb.scale.setScalar(orbGlow);
        }
      }
    }

    // 4. MISCHIEVOUS GHOST CLOWN
    for (let i = 0; i < this.ghostClowns.length; i++) {
      const clown = this.ghostClowns[i];
      const dist = clown.triggerZ - pZ;

      if (dist < 85 && dist > -15) {
        clown.timer += dt;
        // Peeks out from tent edge
        const peek = Math.sin(clown.timer * 2.8) * clown.peekOffset * motionScale;
        clown.group.position.x = clown.baseX + peek;

        // Honk horn / wave hands
        clown.armLeft.rotation.z = Math.sin(clown.timer * 5.0) * 0.35 * motionScale;
        clown.armRight.rotation.x = Math.cos(clown.timer * 4.0) * 0.35 * motionScale;

        // Juggling glowing embers in parabolic loops
        for (let j = 0; j < clown.jugglingOrbs.length; j++) {
          const orb = clown.jugglingOrbs[j];
          const phase = clown.orbPhases[j] + t * 4.0 * motionScale;
          const orbX = Math.cos(phase) * 0.9;
          const orbY = Math.abs(Math.sin(phase)) * 1.4;
          orb.position.set(orbX, 2.2 + orbY, 0);
        }
      }
    }

    // 5. HAUNTED DOLLS (Head Tracking Player)
    for (let i = 0; i < this.hauntedDolls.length; i++) {
      const doll = this.hauntedDolls[i];
      const dz = doll.worldZ - pZ;

      if (Math.abs(dz) < 65) {
        // Smoothly rotate head to look at runner
        const targetRotY = THREE.MathUtils.clamp(-dz * 0.022 * doll.side, -0.85, 0.85);
        doll.head.rotation.y = THREE.MathUtils.lerp(doll.head.rotation.y, doll.baseRotY + targetRotY, dt * 4.0);
        // Subtle creepy tilt
        doll.head.rotation.z = Math.sin(t * 1.8) * 0.08 * motionScale;
      }
    }

    // 6. GIANT SHADOW CREATURE (Background Loom)
    for (let i = 0; i < this.shadowCreatures.length; i++) {
      const beast = this.shadowCreatures[i];
      const beastT = t * 0.65 + beast.phase;

      // Colossal breathing silhouette rise and fall
      beast.group.position.y = beast.baseY + Math.sin(beastT) * 1.8 * motionScale;

      // Slow sweeping claw gestures through the purple fog
      beast.leftClaw.rotation.z = Math.sin(beastT * 1.2) * 0.22 * motionScale;
      beast.rightClaw.rotation.z = -Math.cos(beastT * 0.9) * 0.25 * motionScale;

      // Glowing crimson/amber eyes pulsing
      for (let e = 0; e < beast.eyes.length; e++) {
        const eye = beast.eyes[e];
        const pulse = 0.8 + 0.35 * Math.sin(t * 3.5 + e);
        eye.scale.set(pulse, pulse, pulse);
      }
    }

    // 7. CURSED MIRROR MAZE GLITCH
    for (let i = 0; i < this.mirrorGlitches.length; i++) {
      const mg = this.mirrorGlitches[i];
      mg.flickerTimer += dt;

      if (mg.ghostReflection) {
        // Reflection moves slightly desynced from reality
        mg.ghostReflection.position.y = Math.sin(t * 4.0 + mg.phase) * 0.12 * motionScale;
        mg.ghostReflection.rotation.y = Math.cos(t * 2.5 + mg.phase) * 0.18 * motionScale;

        // Occasional ghostly flicker
        const isFlicker = Math.sin(mg.flickerTimer * 9.0) > 0.85;
        mg.ghostReflection.visible = !isFlicker;
      }
    }

    // 8. SPECTRAL GHOST TRAIN (Sky Viaduct Cross-Over)
    for (let i = 0; i < this.ghostTrains.length; i++) {
      const gt = this.ghostTrains[i];
      gt.group.position.z += gt.speed * dt * motionScale;

      if (gt.group.position.z > gt.maxZ) {
        gt.group.position.z = gt.minZ;
      } else if (gt.group.position.z < gt.minZ) {
        gt.group.position.z = gt.maxZ;
      }

      // Wheels rotation
      const wheelRot = gt.speed * dt * 2.5;
      for (let w = 0; w < gt.wheels.length; w++) {
        gt.wheels[w].rotation.x += wheelRot;
      }

      // Spectral window glow pulses
      for (let g = 0; g < gt.spectralGlows.length; g++) {
        const glow = gt.spectralGlows[g];
        const p = 0.75 + 0.25 * Math.sin(t * 4.0 + g * 0.6);
        glow.scale.set(1.0, p, 1.0);
      }
    }

    // 9. LIVING PUMPKIN PATCH (Watchful Jack-o'-Lanterns)
    for (let i = 0; i < this.livingPumpkins.length; i++) {
      const p = this.livingPumpkins[i];
      const dz = p.worldZ - pZ;

      if (Math.abs(dz) < 70) {
        // Swivel toward runner
        const targetAngle = THREE.MathUtils.clamp(-dz * 0.025, -0.9, 0.9);
        p.head.rotation.y = THREE.MathUtils.lerp(p.head.rotation.y, p.baseRotY + targetAngle, dt * 5.0);

        // Jack-o'-lantern flicker
        const flicker = 0.8 + 0.3 * Math.sin(t * 12.0 + p.phase) * Math.cos(t * 7.5);
        p.glowMesh.scale.setScalar(flicker);
      }
    }

    // 10. GHOST CARNIVAL PARADE FLOAT
    for (let i = 0; i < this.paradeFloats.length; i++) {
      const pf = this.paradeFloats[i];
      // Float rocking
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

    // 11. SPECTRAL BAT SWARM (Overhead Sky Arcs)
    for (let i = 0; i < this.batSwarms.length; i++) {
      const swarm = this.batSwarms[i];
      for (let b = 0; b < swarm.bats.length; b++) {
        const bat = swarm.bats[b];
        const angle = t * bat.orbitSpeed * motionScale + bat.phase;
        const bx = Math.cos(angle) * bat.orbitRadius;
        const bz = Math.sin(angle) * bat.orbitRadius;
        bat.mesh.position.set(bx, bat.baseY + Math.sin(t * 4.0 + b) * 1.2, bz);
        bat.mesh.rotation.y = -angle + Math.PI * 0.5;

        // Wing flapping
        const flap = Math.sin(t * 16.0 + b * 2.0) * 0.55 * motionScale;
        bat.wingL.rotation.z = flap;
        bat.wingR.rotation.z = -flap;
      }
    }

    // 12. TRICK FUNHOUSE FACADE ILLUSION
    for (let i = 0; i < this.funhouseTricks.length; i++) {
      const fh = this.funhouseTricks[i];
      fh.phase += dt * 1.5 * motionScale;

      // Crooked facade tiles subtly shift
      for (let k = 0; k < fh.movingTiles.length; k++) {
        const tile = fh.movingTiles[k];
        tile.rotation.z = Math.sin(fh.phase + k * 1.2) * 0.06 * motionScale;
      }

      // Rolling eyes
      for (let e = 0; e < fh.eyeballs.length; e++) {
        const eye = fh.eyeballs[e];
        eye.rotation.y = Math.sin(t * 2.2 + e) * 0.45 * motionScale;
      }

      // Jaw dropping
      if (fh.mouthJaw) {
        fh.mouthJaw.position.y = -0.3 + Math.sin(t * 1.8) * 0.25 * motionScale;
      }
    }

    // 13. AMBIENT HAUNTINGS: LANTERNS, WILL-O'-THE-WISPS, CREAKING SIGNS
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
      carousels: this.carousels.length,
      ghosts: this.ghosts.length,
      ringmasters: this.ringmasters.length,
      ghostClowns: this.ghostClowns.length,
      hauntedDolls: this.hauntedDolls.length,
      shadowCreatures: this.shadowCreatures.length,
      mirrorGlitches: this.mirrorGlitches.length,
      ghostTrains: this.ghostTrains.length,
      livingPumpkins: this.livingPumpkins.length,
      paradeFloats: this.paradeFloats.length,
      batSwarms: this.batSwarms.length,
      funhouseTricks: this.funhouseTricks.length,
      swingingLanterns: this.ambient.swingingLanterns.length,
      willOWisps: this.ambient.willOWisps.length,
      creakingSigns: this.ambient.creakingSigns.length
    };
  }
}
