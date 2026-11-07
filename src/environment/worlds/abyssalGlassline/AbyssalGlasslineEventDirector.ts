import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';

/**
 * Actor Interfaces for Abyssal Glassline Oceanic Encounters
 */

export interface GiantMantaActor {
  group: THREE.Group;
  bodyMesh: THREE.Object3D;
  leftWing: THREE.Object3D;
  rightWing: THREE.Object3D;
  leftWingTip?: THREE.Object3D;
  rightWingTip?: THREE.Object3D;
  cephalicLobes: THREE.Object3D[];
  tail: THREE.Object3D;
  photophores: THREE.Mesh[];
  escortRays: Array<{
    group: THREE.Object3D;
    leftWing: THREE.Object3D;
    rightWing: THREE.Object3D;
    offset: THREE.Vector3;
    phase: number;
  }>;
  triggerZ: number;
  baseX: number;
  baseY: number;
  swimSpeed: number;
  state: 'DISTANT_SHADOW' | 'APPROACHING' | 'PASSING_GLIDE' | 'BANKING_TURN' | 'FADING_INTO_ABYSS' | 'COMPLETE';
  timer: number;
  bankAngle: number;
}

export interface AbyssalLeviathanActor {
  group: THREE.Group;
  head: THREE.Object3D;
  jaw?: THREE.Object3D;
  eyes: THREE.Mesh[];
  bodySegments: THREE.Object3D[];
  dorsalSpines: THREE.Object3D[];
  tailFlukes: THREE.Object3D;
  photophores: THREE.Mesh[];
  triggerZ: number;
  baseX: number;
  baseY: number;
  swimSpeed: number;
  state: 'DEEP_SHADOW' | 'APPROACHING' | 'HEAD_REVEAL' | 'PASSING_BODY' | 'TAIL_SWEEP' | 'DESCENDING_TRENCH' | 'COMPLETE';
  timer: number;
}

export interface JellyfishBloomActor {
  group: THREE.Group;
  jellyfish: Array<{
    mesh: THREE.Object3D;
    bell: THREE.Mesh;
    tentacles: THREE.Object3D[];
    basePos: THREE.Vector3;
    pulseFreq: number;
    pulsePhase: number;
    driftRadius: number;
  }>;
  triggerZ: number;
  state: 'GATHERING' | 'BLOOMING' | 'DRIFTING_AWAY';
  timer: number;
}

export interface SunkenTitanActor {
  group: THREE.Group;
  statueHead: THREE.Object3D;
  colonnadeArches: THREE.Object3D[];
  researchSubmersible?: THREE.Object3D;
  searchlightCone?: THREE.Mesh;
  triggerZ: number;
  state: 'DORMANT' | 'ILLUMINATED' | 'RECEDING';
  timer: number;
}

export interface SubmarinePursuitActor {
  group: THREE.Group;
  submarine: THREE.Object3D;
  propellers: THREE.Object3D[];
  searchlights: THREE.Mesh[];
  targetCreature: THREE.Object3D;
  creatureFins: THREE.Object3D[];
  triggerZ: number;
  state: 'CRUISING' | 'PURSUIT_ACCELERATION' | 'BANKING_CHASE' | 'COMPLETE';
  timer: number;
}

export interface HydrothermalEruptionActor {
  group: THREE.Group;
  chimney: THREE.Object3D;
  moltenCalderaGlow: THREE.Mesh;
  thermalPlumes: THREE.Mesh[];
  pressureWaveMesh?: THREE.Mesh;
  triggerZ: number;
  state: 'VENTING_STEADY' | 'ERUPTION_SURGE' | 'PRESSURE_PULSE' | 'SETTLING';
  timer: number;
}

export interface AmbientFishSchool {
  group: THREE.Group;
  fish: Array<{
    mesh: THREE.Object3D;
    baseOffset: THREE.Vector3;
    phase: number;
    speed: number;
  }>;
  center: THREE.Vector3;
  direction: number;
  swirlAngle: number;
}

export interface AmbientMarineEcosystem {
  fishSchools: AmbientFishSchool[];
  patrollingSharks: Array<{ group: THREE.Object3D; tail: THREE.Object3D; basePos: THREE.Vector3; freq: number; phase: number }>;
  swayingCoralFans: Array<{ mesh: THREE.Object3D; phase: number }>;
  floatingPlankton: Array<{ mesh: THREE.Mesh; center: THREE.Vector3; radius: number; freq: number; phase: number }>;
}

/**
 * AbyssalGlasslineEventDirector
 * Coordinates and animates all oceanic megafauna, living ecosystem entities,
 * cinematic setpieces, and ambient marine life with performance-aware lifecycle management.
 * 
 * SIGNED-DISTANCE CONVENTION:
 * For negative-Z forward travel:
 *   distanceAhead = playerZ - encounterZ
 */
export class AbyssalGlasslineEventDirector {
  private static instance: AbyssalGlasslineEventDirector | null = null;

  private totalTime: number = 0;
  private frameCounter: number = 0;

  // Registered Encounters
  private giantMantas: GiantMantaActor[] = [];
  private leviathans: AbyssalLeviathanActor[] = [];
  private jellyfishBlooms: JellyfishBloomActor[] = [];
  private sunkenTitans: SunkenTitanActor[] = [];
  private submarinePursuits: SubmarinePursuitActor[] = [];
  private hydrothermalEruptions: HydrothermalEruptionActor[] = [];

  // Ambient Ecosystem
  private ambient: AmbientMarineEcosystem = {
    fishSchools: [],
    patrollingSharks: [],
    swayingCoralFans: [],
    floatingPlankton: []
  };

  private constructor() {}

  public static getInstance(): AbyssalGlasslineEventDirector {
    if (!this.instance) {
      this.instance = new AbyssalGlasslineEventDirector();
    }
    return this.instance;
  }

  // --- Registration Methods ---

  public registerGiantManta(actor: GiantMantaActor): void {
    this.giantMantas.push(actor);
  }

  public registerLeviathan(actor: AbyssalLeviathanActor): void {
    this.leviathans.push(actor);
  }

  public registerJellyfishBloom(actor: JellyfishBloomActor): void {
    this.jellyfishBlooms.push(actor);
  }

  public registerSunkenTitan(actor: SunkenTitanActor): void {
    this.sunkenTitans.push(actor);
  }

  public registerSubmarinePursuit(actor: SubmarinePursuitActor): void {
    this.submarinePursuits.push(actor);
  }

  public registerHydrothermalEruption(actor: HydrothermalEruptionActor): void {
    this.hydrothermalEruptions.push(actor);
  }

  public registerFishSchool(school: AmbientFishSchool): void {
    this.ambient.fishSchools.push(school);
  }

  public registerPatrollingShark(group: THREE.Object3D, tail: THREE.Object3D, basePos: THREE.Vector3, freq: number = 1.2, phase: number = 0): void {
    this.ambient.patrollingSharks.push({ group, tail, basePos: basePos.clone(), freq, phase });
  }

  public registerSwayingCoralFan(mesh: THREE.Object3D, phase: number = 0): void {
    this.ambient.swayingCoralFans.push({ mesh, phase });
  }

  public registerFloatingPlankton(mesh: THREE.Mesh, center: THREE.Vector3, radius: number = 3.5, freq: number = 1.4, phase: number = 0): void {
    this.ambient.floatingPlankton.push({ mesh, center: center.clone(), radius, freq, phase });
  }

  // --- Lifecycle & Pruning ---

  public reset(): void {
    this.giantMantas.length = 0;
    this.leviathans.length = 0;
    this.jellyfishBlooms.length = 0;
    this.sunkenTitans.length = 0;
    this.submarinePursuits.length = 0;
    this.hydrothermalEruptions.length = 0;
    this.ambient.fishSchools.length = 0;
    this.ambient.patrollingSharks.length = 0;
    this.ambient.swayingCoralFans.length = 0;
    this.ambient.floatingPlankton.length = 0;
    this.totalTime = 0;
    this.frameCounter = 0;
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
    this.giantMantas = this.giantMantas.filter((a) => !this.isDetached(a.group));
    this.leviathans = this.leviathans.filter((a) => !this.isDetached(a.group));
    this.jellyfishBlooms = this.jellyfishBlooms.filter((a) => !this.isDetached(a.group));
    this.sunkenTitans = this.sunkenTitans.filter((a) => !this.isDetached(a.group));
    this.submarinePursuits = this.submarinePursuits.filter((a) => !this.isDetached(a.group));
    this.hydrothermalEruptions = this.hydrothermalEruptions.filter((a) => !this.isDetached(a.group));
    this.ambient.fishSchools = this.ambient.fishSchools.filter((a) => !this.isDetached(a.group));
    this.ambient.patrollingSharks = this.ambient.patrollingSharks.filter((a) => !this.isDetached(a.group));
    this.ambient.swayingCoralFans = this.ambient.swayingCoralFans.filter((a) => !this.isDetached(a.mesh));
    this.ambient.floatingPlankton = this.ambient.floatingPlankton.filter((a) => !this.isDetached(a.mesh));
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
    // GATE A: THE GIANT MANTA ENCOUNTER (10-Stage Performance)
    // =========================================================================
    for (let i = 0; i < this.giantMantas.length; i++) {
      const gm = this.giantMantas[i];
      const distanceAhead = pZ - gm.triggerZ;

      gm.timer += dt;

      // Realistic sinusoidal wing undulation propagating along span
      const wingFlap = Math.sin(t * 1.8 * motionScale) * 0.28 * motionScale;
      const wingTipFlap = Math.sin(t * 1.8 * motionScale - 0.4) * 0.42 * motionScale;

      gm.leftWing.rotation.z = -wingFlap;
      gm.rightWing.rotation.z = wingFlap;

      if (gm.leftWingTip) gm.leftWingTip.rotation.z = -wingTipFlap;
      if (gm.rightWingTip) gm.rightWingTip.rotation.z = wingTipFlap;

      // Cephalic lobes gentle curl
      for (let l = 0; l < gm.cephalicLobes.length; l++) {
        gm.cephalicLobes[l].rotation.y = Math.sin(t * 1.4 + l) * 0.12 * motionScale;
      }

      // Whip tail sinusoidal wave
      gm.tail.rotation.x = Math.sin(t * 1.6) * 0.15 * motionScale;
      gm.tail.rotation.y = Math.cos(t * 1.2) * 0.12 * motionScale;

      // Photophores pulse gently with bioluminescence
      for (let p = 0; p < gm.photophores.length; p++) {
        const pulse = 0.82 + 0.25 * Math.sin(t * 3.0 + p * 0.6);
        gm.photophores[p].scale.setScalar(pulse);
      }

      // Escort rays follow in synchronized formation
      for (let e = 0; e < gm.escortRays.length; e++) {
        const escort = gm.escortRays[e];
        const eWing = Math.sin(t * 2.4 * motionScale + escort.phase) * 0.35 * motionScale;
        escort.leftWing.rotation.z = -eWing;
        escort.rightWing.rotation.z = eWing;

        // Position relative to giant manta with slight wave lag
        escort.group.position.x = gm.group.position.x + escort.offset.x;
        escort.group.position.y = gm.group.position.y + escort.offset.y + Math.sin(t * 1.8 + escort.phase) * 0.8;
        escort.group.position.z = gm.group.position.z + escort.offset.z;
        escort.group.rotation.z = gm.group.rotation.z * 1.1;
      }

      // 10-Stage Performance along distanceAhead
      if (distanceAhead > 140) {
        // Stage 1 & 2: Distant shadow moves across oceanic water column; small fish scatter
        gm.state = 'DISTANT_SHADOW';
        gm.group.visible = true;
        gm.group.position.set(gm.baseX + 18.0, gm.baseY + 8.0, gm.triggerZ - 45.0);
        gm.group.rotation.set(0, -Math.PI * 0.65, 0);
      } else if (distanceAhead > 85) {
        // Stage 3 & 4: Gigantic manta ray becomes visible; natural wing undulation
        gm.state = 'APPROACHING';
        gm.group.visible = true;
        const prog = (140 - distanceAhead) / 55;
        gm.group.position.x = THREE.MathUtils.lerp(gm.baseX + 18.0, gm.baseX + 6.0, prog);
        gm.group.position.y = gm.baseY + 4.0 + Math.sin(t * 1.2) * 1.5;
        gm.group.position.z = THREE.MathUtils.lerp(gm.triggerZ - 45.0, gm.triggerZ - 10.0, prog);
        gm.group.rotation.y = THREE.MathUtils.lerp(-Math.PI * 0.65, -Math.PI * 0.45, prog);
        gm.group.rotation.z = THREE.MathUtils.lerp(0.05, -0.15, prog); // Slight banking toward tunnel
      } else if (distanceAhead > -15) {
        // Stage 5, 6, 7 & 8: Passes across player's side/upper view; bioluminescent patterns glow; escorts follow
        gm.state = 'PASSING_GLIDE';
        gm.group.visible = true;
        // Bounded forward cruise along ocean track
        gm.group.position.x = gm.baseX + Math.sin(t * 0.6) * 2.5;
        gm.group.position.y = gm.baseY + Math.sin(t * 0.8) * 1.2;
        gm.group.position.z -= gm.swimSpeed * dt * motionScale;
        gm.group.rotation.y = -Math.PI * 0.35;
        gm.group.rotation.z = Math.sin(t * 1.2) * 0.12 * motionScale;
      } else if (distanceAhead > -75) {
        // Stage 9: Banks gracefully away into deep ocean
        gm.state = 'BANKING_TURN';
        gm.group.visible = true;
        const turnProg = Math.min(1.0, (-distanceAhead - 15) / 60);
        gm.group.position.x += dt * 14.0 * motionScale; // Turns away from track
        gm.group.position.y += dt * 4.5 * motionScale;  // Rises into open ocean
        gm.group.position.z -= gm.swimSpeed * dt * motionScale;
        gm.group.rotation.z = THREE.MathUtils.lerp(-0.15, -0.55, turnProg); // Majestic bank angle
        gm.group.rotation.y = THREE.MathUtils.lerp(-Math.PI * 0.35, -Math.PI * 0.15, turnProg);
      } else {
        // Stage 10: Disappears into abyss
        gm.state = 'FADING_INTO_ABYSS';
        const fadeProg = Math.min(1.0, (-distanceAhead - 75) / 40);
        const scale = Math.max(0.01, 1.0 - fadeProg * 0.7);
        gm.group.scale.setScalar(scale);
        if (fadeProg >= 1.0) {
          gm.group.visible = false;
          gm.state = 'COMPLETE';
        }
      }
    }

    // =========================================================================
    // GATE B: THE ABYSSAL LEVIATHAN (10-Stage Colossal Megafauna Encounter)
    // =========================================================================
    for (let i = 0; i < this.leviathans.length; i++) {
      const lev = this.leviathans[i];
      const distanceAhead = pZ - lev.triggerZ;

      lev.timer += dt;

      // Sinuous serpentine swimming wave propagating down segmented colossal spine
      const waveFreq = 1.2 * motionScale;
      for (let s = 0; s < lev.bodySegments.length; s++) {
        const seg = lev.bodySegments[s];
        const segPhase = s * 0.42;
        seg.rotation.y = Math.sin(t * waveFreq - segPhase) * 0.16 * motionScale;
        seg.rotation.z = Math.cos(t * waveFreq * 0.5 - segPhase) * 0.06 * motionScale;
      }

      // Dorsal spines rhythmic ripple
      for (let d = 0; d < lev.dorsalSpines.length; d++) {
        lev.dorsalSpines[d].rotation.z = Math.sin(t * 1.5 - d * 0.35) * 0.18 * motionScale;
      }

      // Caudal tail flukes massive horizontal propulsion beat
      lev.tailFlukes.rotation.x = Math.sin(t * waveFreq - lev.bodySegments.length * 0.42) * 0.35 * motionScale;
      lev.tailFlukes.rotation.y = Math.cos(t * waveFreq - lev.bodySegments.length * 0.42) * 0.22 * motionScale;

      // Piercing bioluminescent eyes & photophore ridge pulse
      for (let e = 0; e < lev.eyes.length; e++) {
        lev.eyes[e].scale.setScalar(1.0 + 0.28 * Math.sin(t * 4.0 + e));
      }
      for (let p = 0; p < lev.photophores.length; p++) {
        lev.photophores[p].scale.setScalar(0.85 + 0.22 * Math.sin(t * 2.8 + p * 0.4));
      }

      // 10-Stage Performance along distanceAhead
      if (distanceAhead > 150) {
        // Stage 1 & 2: Subdued ocean gloom; colossal silhouette lurking in the distance
        lev.state = 'DEEP_SHADOW';
        lev.group.visible = true;
        lev.group.position.set(lev.baseX - 35.0, lev.baseY - 12.0, lev.triggerZ - 60.0);
        lev.group.rotation.set(0, Math.PI * 0.25, 0);
      } else if (distanceAhead > 90) {
        // Stage 3 & 4: Colossal body emerges; small marine life scatters
        lev.state = 'APPROACHING';
        lev.group.visible = true;
        const prog = (150 - distanceAhead) / 60;
        lev.group.position.x = THREE.MathUtils.lerp(lev.baseX - 35.0, lev.baseX - 16.0, prog);
        lev.group.position.y = THREE.MathUtils.lerp(lev.baseY - 12.0, lev.baseY + 2.0, prog) + Math.sin(t * 0.8) * 1.2;
        lev.group.position.z = THREE.MathUtils.lerp(lev.triggerZ - 60.0, lev.triggerZ - 20.0, prog);
        lev.group.rotation.y = THREE.MathUtils.lerp(Math.PI * 0.25, Math.PI * 0.45, prog);
      } else if (distanceAhead > 40) {
        // Stage 5 & 6: Colossal head emerges; turns slowly toward railway
        lev.state = 'HEAD_REVEAL';
        lev.group.visible = true;
        const prog = (90 - distanceAhead) / 50;
        lev.group.position.x = THREE.MathUtils.lerp(lev.baseX - 16.0, lev.baseX - 8.0, prog);
        lev.group.position.y = lev.baseY + 4.0 + Math.sin(t * 0.9) * 1.5;
        lev.group.position.z -= lev.swimSpeed * dt * 0.8 * motionScale;
        // Head turns toward glass tunnel
        const lookAngle = THREE.MathUtils.clamp((distanceAhead - 65) * 0.015, -0.45, 0.45);
        lev.head.rotation.y = THREE.MathUtils.lerp(lev.head.rotation.y, lookAngle, dt * 2.5);
      } else if (distanceAhead > -25) {
        // Stage 7 & 8: Segmented colossal body glides past glass; massive tail fluke sweep
        lev.state = 'PASSING_BODY';
        lev.group.visible = true;
        lev.group.position.x = lev.baseX - 6.0 + Math.sin(t * 0.5) * 2.0;
        lev.group.position.y = lev.baseY + 5.0 + Math.cos(t * 0.7) * 1.8;
        lev.group.position.z -= lev.swimSpeed * dt * motionScale;
        lev.group.rotation.y = Math.PI * 0.55;
      } else if (distanceAhead > -95) {
        // Stage 9: Glides into the abyssal trench depths
        lev.state = 'DESCENDING_TRENCH';
        lev.group.visible = true;
        const descendProg = Math.min(1.0, (-distanceAhead - 25) / 70);
        lev.group.position.x -= dt * 12.0 * motionScale;  // Glides into trench
        lev.group.position.y -= dt * 6.5 * motionScale;   // Dives deep
        lev.group.position.z -= lev.swimSpeed * dt * motionScale;
        lev.group.rotation.x = THREE.MathUtils.lerp(0, 0.25, descendProg); // Nose down dive
      } else {
        // Stage 10: Disappears into abyss; ocean returns to normal
        lev.state = 'COMPLETE';
        lev.group.visible = false;
      }
    }

    // =========================================================================
    // EVENT C: THE JELLYFISH BLOOM
    // =========================================================================
    for (let i = 0; i < this.jellyfishBlooms.length; i++) {
      const jb = this.jellyfishBlooms[i];
      const distanceAhead = pZ - jb.triggerZ;

      jb.timer += dt;

      if (distanceAhead < 130 && distanceAhead > -60) {
        jb.group.visible = true;

        for (let j = 0; j < jb.jellyfish.length; j++) {
          const jelly = jb.jellyfish[j];
          const jt = t * jelly.pulseFreq * motionScale + jelly.pulsePhase;

          // Rhythmic bell contraction and expansion
          const contraction = Math.sin(jt);
          const scaleY = 1.0 + contraction * 0.32;
          const scaleXZ = 1.0 - contraction * 0.18;
          jelly.bell.scale.set(scaleXZ, scaleY, scaleXZ);

          // Pulsating bioluminescent glow
          const glow = 0.75 + 0.35 * Math.max(0, contraction);
          jelly.bell.scale.multiplyScalar(glow * 0.9 + 0.1);

          // Drifting movement around base position
          const ox = Math.cos(jt * 0.4) * jelly.driftRadius;
          const oz = Math.sin(jt * 0.35) * jelly.driftRadius;
          const oy = Math.sin(jt * 0.6) * 1.8;
          jelly.mesh.position.set(jelly.basePos.x + ox, jelly.basePos.y + oy, jelly.basePos.z + oz);

          // Trailing tentacles flutter in water current
          for (let tn = 0; tn < jelly.tentacles.length; tn++) {
            jelly.tentacles[tn].rotation.z = Math.sin(jt * 1.4 + tn) * 0.25 * motionScale;
            jelly.tentacles[tn].rotation.x = Math.cos(jt * 1.2 + tn) * 0.18 * motionScale;
          }
        }
      } else {
        jb.group.visible = false;
      }
    }

    // =========================================================================
    // EVENT D: THE SUNKEN TITAN REVEAL
    // =========================================================================
    for (let i = 0; i < this.sunkenTitans.length; i++) {
      const st = this.sunkenTitans[i];
      const distanceAhead = pZ - st.triggerZ;

      st.timer += dt;

      if (distanceAhead < 140 && distanceAhead > -50) {
        st.group.visible = true;

        // Submersible searchlight beam sweeps across ancient stone titan
        if (st.searchlightCone && st.researchSubmersible) {
          const sweepAngle = Math.sin(t * 1.2 * motionScale) * 0.38;
          st.searchlightCone.rotation.y = sweepAngle;
          st.researchSubmersible.position.y = 8.5 + Math.sin(t * 0.8) * 0.8;
          st.researchSubmersible.position.x = 16.0 + Math.cos(t * 0.6) * 1.2;
        }

        if (distanceAhead < 90 && distanceAhead > 10) {
          st.state = 'ILLUMINATED';
        } else if (distanceAhead <= 10) {
          st.state = 'RECEDING';
        }
      } else {
        st.group.visible = false;
      }
    }

    // =========================================================================
    // EVENT E: THE SUBMARINE PURSUIT
    // =========================================================================
    for (let i = 0; i < this.submarinePursuits.length; i++) {
      const sp = this.submarinePursuits[i];
      const distanceAhead = pZ - sp.triggerZ;

      sp.timer += dt;

      if (distanceAhead < 130 && distanceAhead > -60) {
        sp.group.visible = true;

        // Propellers spin rapidly
        const propRot = dt * 18.0 * motionScale;
        for (let p = 0; p < sp.propellers.length; p++) {
          sp.propellers[p].rotation.z += propRot;
        }

        // Submarine advances and follows target creature
        const speed = 22.0 * motionScale;
        sp.submarine.position.z -= speed * dt;
        sp.targetCreature.position.z -= (speed + 2.5) * dt;

        // Dynamic banking and avoidance
        const bank = Math.sin(sp.timer * 1.6) * 0.28 * motionScale;
        sp.submarine.rotation.z = bank;
        sp.targetCreature.rotation.z = bank * 1.3;

        // Creature tail fins beat rapidly
        for (let f = 0; f < sp.creatureFins.length; f++) {
          sp.creatureFins[f].rotation.y = Math.sin(t * 8.0 + f) * 0.45 * motionScale;
        }

        // Searchlights sweep across creature path
        for (let s = 0; s < sp.searchlights.length; s++) {
          sp.searchlights[s].rotation.x = Math.sin(t * 2.5 + s) * 0.15;
          sp.searchlights[s].scale.setScalar(0.9 + 0.2 * Math.sin(t * 6.0));
        }
      } else {
        sp.group.visible = false;
      }
    }

    // =========================================================================
    // EVENT F: THE HYDROTHERMAL ERUPTION & PRESSURE-WAVE
    // =========================================================================
    for (let i = 0; i < this.hydrothermalEruptions.length; i++) {
      const he = this.hydrothermalEruptions[i];
      const distanceAhead = pZ - he.triggerZ;

      he.timer += dt;

      if (distanceAhead < 120 && distanceAhead > -40) {
        he.group.visible = true;

        // Molten caldera glow pulse
        const calderaPulse = 0.9 + 0.35 * Math.sin(t * 4.5);
        he.moltenCalderaGlow.scale.setScalar(calderaPulse);

        // Towering thermal plumes billowing upward
        for (let p = 0; p < he.thermalPlumes.length; p++) {
          const plume = he.thermalPlumes[p];
          const pt = t * 1.8 + p * 1.2;
          const pScaleY = 1.0 + 0.3 * Math.sin(pt);
          const pScaleXZ = 1.0 + 0.2 * Math.cos(pt * 0.8);
          plume.scale.set(pScaleXZ, pScaleY, pScaleXZ);
          plume.rotation.y += dt * 0.8;
        }

        // Pressure wave decorative ripple expands outward
        if (he.pressureWaveMesh) {
          if (distanceAhead < 65 && distanceAhead > 15) {
            he.state = 'PRESSURE_PULSE';
            he.pressureWaveMesh.visible = true;
            const waveCycle = (t * 1.5) % 1.0;
            const waveScale = 1.0 + waveCycle * 2.8;
            he.pressureWaveMesh.scale.set(waveScale, 1.0, waveScale);
            (he.pressureWaveMesh.material as THREE.Material).opacity = Math.max(0.01, 0.4 * (1.0 - waveCycle));
          } else {
            he.pressureWaveMesh.visible = false;
          }
        }
      } else {
        he.group.visible = false;
      }
    }

    // =========================================================================
    // AMBIENT MARINE ECOSYSTEM
    // =========================================================================
    // 1. Swirling schools of small fish
    for (let s = 0; s < this.ambient.fishSchools.length; s++) {
      const school = this.ambient.fishSchools[s];
      school.swirlAngle += dt * 1.2 * school.direction * motionScale;

      for (let f = 0; f < school.fish.length; f++) {
        const fish = school.fish[f];
        const fishT = t * fish.speed + fish.phase;
        const radius = 4.5 + Math.sin(fishT * 0.5) * 1.5;
        const fx = school.center.x + Math.cos(school.swirlAngle + fish.phase) * radius;
        const fz = school.center.z + Math.sin(school.swirlAngle + fish.phase) * radius;
        const fy = school.center.y + Math.sin(fishT) * 0.8;

        fish.mesh.position.set(fx, fy, fz);
        fish.mesh.rotation.y = school.swirlAngle + fish.phase + Math.PI * 0.5 * school.direction;
        fish.mesh.rotation.z = Math.sin(fishT * 2.5) * 0.15;
      }
    }

    // 2. Patrolling sharks with bounded sinusoidal swimming paths
    for (let sh = 0; sh < this.ambient.patrollingSharks.length; sh++) {
      const shark = this.ambient.patrollingSharks[sh];
      const st = t * shark.freq * motionScale + shark.phase;
      // Stable, bounded swimming path around base position (fixes unbounded drift bug)
      const sy = shark.basePos.y + Math.sin(st) * 1.5;
      const sx = shark.basePos.x + Math.sin(st * 0.6) * 3.5;
      const sz = shark.basePos.z + Math.cos(st * 0.4) * 5.0;

      shark.group.position.set(sx, sy, sz);
      shark.tail.rotation.y = Math.sin(st * 3.0) * 0.35 * motionScale;
      shark.group.rotation.y = Math.sin(st * 0.6) * 0.25;
      shark.group.rotation.z = Math.cos(st * 0.6) * 0.08;
    }

    // 3. Swaying sea fans in ocean currents
    for (let c = 0; c < this.ambient.swayingCoralFans.length; c++) {
      const fan = this.ambient.swayingCoralFans[c];
      fan.mesh.rotation.z = Math.sin(t * 1.4 * motionScale + fan.phase) * 0.14 * motionScale;
      fan.mesh.rotation.x = Math.cos(t * 1.1 * motionScale + fan.phase) * 0.08 * motionScale;
    }

    // 4. Bioluminescent drifting plankton particles
    for (let pl = 0; pl < this.ambient.floatingPlankton.length; pl++) {
      const plank = this.ambient.floatingPlankton[pl];
      const plt = t * plank.freq * motionScale + plank.phase;
      const px = Math.cos(plt) * plank.radius;
      const pz = Math.sin(plt * 0.7) * plank.radius;
      const py = Math.sin(plt * 1.4) * 0.8;
      plank.mesh.position.set(plank.center.x + px, plank.center.y + py, plank.center.z + pz);
      plank.mesh.scale.setScalar(0.8 + 0.3 * Math.sin(plt * 3.2));
    }
  }

  // --- Diagnostics & Getters ---

  public getDiagnostics(): Record<string, number> {
    return {
      giantMantas: this.giantMantas.length,
      leviathans: this.leviathans.length,
      jellyfishBlooms: this.jellyfishBlooms.length,
      sunkenTitans: this.sunkenTitans.length,
      submarinePursuits: this.submarinePursuits.length,
      hydrothermalEruptions: this.hydrothermalEruptions.length,
      fishSchools: this.ambient.fishSchools.length,
      patrollingSharks: this.ambient.patrollingSharks.length,
      swayingCoralFans: this.ambient.swayingCoralFans.length,
      floatingPlankton: this.ambient.floatingPlankton.length
    };
  }

  public getGiantMantas(): readonly GiantMantaActor[] {
    return this.giantMantas;
  }

  public getLeviathans(): readonly AbyssalLeviathanActor[] {
    return this.leviathans;
  }

  public getJellyfishBlooms(): readonly JellyfishBloomActor[] {
    return this.jellyfishBlooms;
  }

  public getSunkenTitans(): readonly SunkenTitanActor[] {
    return this.sunkenTitans;
  }

  public getSubmarinePursuits(): readonly SubmarinePursuitActor[] {
    return this.submarinePursuits;
  }

  public getHydrothermalEruptions(): readonly HydrothermalEruptionActor[] {
    return this.hydrothermalEruptions;
  }
}

