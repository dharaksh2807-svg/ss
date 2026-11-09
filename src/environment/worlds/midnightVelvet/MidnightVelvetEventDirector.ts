import * as THREE from 'three';
import { SettingsManager } from '../../../settings/SettingsManager';

interface MotorcadeCar {
  group: THREE.Group;
  speed: number;
  minZ: number;
  maxZ: number;
}

interface PartyDancer {
  group: THREE.Group;
  offset: number;
  speed: number;
  armL?: THREE.Object3D;
  armR?: THREE.Object3D;
}

interface SkylineSearchlight {
  group: THREE.Group;
  offset: number;
  speed: number;
  maxAngle: number;
}

interface MarinaYacht {
  group: THREE.Group;
  speed: number;
  bobOffset: number;
  initialZ: number;
}

interface HotelMarquee {
  bulbs: THREE.Mesh[];
  timer: number;
}

interface ClockTowerGag {
  pendulum: THREE.Object3D;
  minuteHand?: THREE.Object3D;
}

interface PaparazziFlash {
  mesh: THREE.Mesh;
  timer: number;
  interval: number;
}

export interface VipArrivalActor {
  group: THREE.Group;
  limousine: THREE.Group;
  rearDoorPivot: THREE.Group;
  valetGroup: THREE.Group;
  valetTorso?: THREE.Object3D;
  valetArm?: THREE.Object3D;
  gentlemanGroup: THREE.Group;
  ladyGroup: THREE.Group;
  photographers: Array<{
    group: THREE.Group;
    camArm?: THREE.Object3D;
    initialRotY: number;
    flashMesh: THREE.Mesh;
  }>;
  cycleTimer: number;
  initialLimoZ: number;
  carpetCenterZ: number;
  doorLimoX: number;
  redCarpetX: number;
  worldZ?: number;
  stage?: 'APPROACH' | 'DOOR_OPEN' | 'RED_CARPET_EXIT' | 'HOTEL_WALK' | 'RESET';
}

export interface NightclubRevealActor {
  group: THREE.Group;
  kineticSculpture: {
    outerRing: THREE.Object3D;
    midRing: THREE.Object3D;
    innerSpokes: THREE.Object3D;
    coreSphere: THREE.Mesh;
  };
  marqueeBulbs: THREE.Mesh[];
  verticalPillars: THREE.Mesh[];
  signMesh: THREE.Mesh;
  queueGuests: Array<{
    group: THREE.Group;
    swayPhase: number;
    armWine?: THREE.Object3D;
  }>;
  bouncer: {
    group: THREE.Group;
    clipboardArm?: THREE.Object3D;
  };
  revealTimer: number;
  worldZ?: number;
  stage?: 'IDLE_WARM' | 'LIGHTS_ACCELERATE' | 'KINETIC_CLIMAX' | 'AFTERMATH';
}

export class MidnightVelvetEventDirector {
  private static instance: MidnightVelvetEventDirector | null = null;

  private motorcadeCars: MotorcadeCar[] = [];
  private partyDancers: PartyDancer[] = [];
  private searchlights: SkylineSearchlight[] = [];
  private marinaYachts: MarinaYacht[] = [];
  private hotelMarquees: HotelMarquee[] = [];
  private clockTowers: ClockTowerGag[] = [];
  private paparazziFlashes: PaparazziFlash[] = [];
  private vipArrivals: VipArrivalActor[] = [];
  private nightclubReveals: NightclubRevealActor[] = [];

  private globalTime: number = 0;

  private constructor() {}

  public static getInstance(): MidnightVelvetEventDirector {
    if (!this.instance) {
      this.instance = new MidnightVelvetEventDirector();
    }
    return this.instance;
  }

  public reset(): void {
    this.motorcadeCars = [];
    this.partyDancers = [];
    this.searchlights = [];
    this.marinaYachts = [];
    this.hotelMarquees = [];
    this.clockTowers = [];
    this.paparazziFlashes = [];
    this.vipArrivals = [];
    this.nightclubReveals = [];
    this.globalTime = 0;
  }

  // --- Registration Hooks ---

  public registerPaparazziFlash(mesh: THREE.Mesh, interval: number = 1.2): void {
    this.paparazziFlashes.push({ mesh, timer: Math.random() * interval, interval });
  }

  public registerMotorcadeCar(car: THREE.Group, speed: number = 18.0, minZ: number = -140, maxZ: number = 40): void {
    this.motorcadeCars.push({ group: car, speed, minZ, maxZ });
  }

  public registerPartyDancer(dancer: THREE.Group, offset: number, speed: number = 4.0, armL?: THREE.Object3D, armR?: THREE.Object3D): void {
    this.partyDancers.push({ group: dancer, offset, speed, armL, armR });
  }

  public registerSearchlight(light: THREE.Group, offset: number, speed: number = 0.8, maxAngle: number = 0.45): void {
    this.searchlights.push({ group: light, offset, speed, maxAngle });
  }

  public registerMarinaYacht(yacht: THREE.Group, speed: number = 3.5, bobOffset: number = 0): void {
    this.marinaYachts.push({ group: yacht, speed, bobOffset, initialZ: yacht.position.z });
  }

  public registerHotelMarquee(bulbs: THREE.Mesh[]): void {
    this.hotelMarquees.push({ bulbs, timer: 0 });
  }

  public registerClockTower(pendulum: THREE.Object3D, minuteHand?: THREE.Object3D): void {
    this.clockTowers.push({ pendulum, minuteHand });
  }

  public registerVipArrival(actor: VipArrivalActor): void {
    this.vipArrivals.push(actor);
  }

  public registerNightclubReveal(actor: NightclubRevealActor): void {
    this.nightclubReveals.push(actor);
  }

  // --- Diagnostics Getters ---
  public getMotorcadeCarCount(): number { return this.motorcadeCars.length; }
  public getPartyDancerCount(): number { return this.partyDancers.length; }
  public getSearchlightCount(): number { return this.searchlights.length; }
  public getMarinaYachtCount(): number { return this.marinaYachts.length; }
  public getHotelMarqueeCount(): number { return this.hotelMarquees.length; }
  public getClockTowerCount(): number { return this.clockTowers.length; }
  public getVipArrivalCount(): number { return this.vipArrivals.length; }
  public getNightclubRevealCount(): number { return this.nightclubReveals.length; }
  public getTotalActiveElements(): number {
    return this.motorcadeCars.length + this.partyDancers.length + this.searchlights.length +
      this.marinaYachts.length + this.hotelMarquees.length + this.clockTowers.length +
      this.vipArrivals.length + this.nightclubReveals.length;
  }

  /**
   * Automatically prunes detached objects from recycled chunks, preventing memory leaks.
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

    this.motorcadeCars = this.motorcadeCars.filter(c => isAttached(c.group));
    this.partyDancers = this.partyDancers.filter(d => isAttached(d.group));
    this.searchlights = this.searchlights.filter(s => isAttached(s.group));
    this.marinaYachts = this.marinaYachts.filter(y => isAttached(y.group));
    this.hotelMarquees = this.hotelMarquees.filter(m => m.bulbs.length > 0 && isAttached(m.bulbs[0]));
    this.clockTowers = this.clockTowers.filter(ct => isAttached(ct.pendulum));
    this.paparazziFlashes = this.paparazziFlashes.filter(p => isAttached(p.mesh));
    this.vipArrivals = this.vipArrivals.filter(v => isAttached(v.group));
    this.nightclubReveals = this.nightclubReveals.filter(nr => isAttached(nr.group));
  }

  // --- Animation Update Loop ---

  public update(delta: number, isActive: boolean = true, _playerZ?: number): void {
    if (!isActive || delta <= 0) return;

    this.pruneDetached();

    const reducedMotion = SettingsManager.getInstance().isReducedMotion();
    this.globalTime += delta;

    // 1. Luxury Motorcade Limousines gliding smoothly along boulevard street
    if (!reducedMotion) {
      for (let i = 0; i < this.motorcadeCars.length; i++) {
        const car = this.motorcadeCars[i];
        car.group.position.z -= car.speed * delta;
        if (car.group.position.z < car.minZ) {
          car.group.position.z = car.maxZ;
        }
      }
    }

    // 2. Rooftop Party Dancers grooving to nightlife rhythm
    if (!reducedMotion) {
      for (let i = 0; i < this.partyDancers.length; i++) {
        const d = this.partyDancers[i];
        const t = this.globalTime * d.speed + d.offset;
        const bounce = Math.sin(t * 2.0) * 0.08;
        const sway = Math.cos(t) * 0.12;

        d.group.position.y += bounce * delta * 4.0;
        d.group.rotation.y = sway;

        if (d.armL) {
          d.armL.rotation.z = -0.6 + Math.sin(t * 1.5) * 0.35;
        }
        if (d.armR) {
          d.armR.rotation.z = 0.6 - Math.cos(t * 1.5) * 0.35;
        }
      }
    }

    // 3. Elegant Skyline Searchlights sweeping through midnight air
    if (!reducedMotion) {
      for (let i = 0; i < this.searchlights.length; i++) {
        const s = this.searchlights[i];
        const angle = Math.sin(this.globalTime * s.speed + s.offset) * s.maxAngle;
        s.group.rotation.z = angle;
        s.group.rotation.x = Math.cos(this.globalTime * s.speed * 0.7 + s.offset) * 0.18;
      }
    }

    // 4. Marina Yachts cruising and gently bobbing on sea waves
    for (let i = 0; i < this.marinaYachts.length; i++) {
      const yacht = this.marinaYachts[i];
      if (!reducedMotion) {
        yacht.group.position.z -= yacht.speed * delta;
        if (yacht.group.position.z < yacht.initialZ - 80) {
          yacht.group.position.z = yacht.initialZ + 20;
        }
        // Hydrodynamic wave heave and pitch
        const waveT = this.globalTime * 1.8 + yacht.bobOffset;
        yacht.group.position.y = 0.15 + Math.sin(waveT) * 0.12;
        yacht.group.rotation.z = Math.sin(waveT * 0.8) * 0.04;
        yacht.group.rotation.x = Math.cos(waveT * 0.9) * 0.03;
      }
    }

    // 5. Grand Hotel Marquee Light Chaser Animation
    if (!reducedMotion) {
      for (let m = 0; m < this.hotelMarquees.length; m++) {
        const marquee = this.hotelMarquees[m];
        marquee.timer += delta * 6.0;
        const activeIndex = Math.floor(marquee.timer) % (marquee.bulbs.length || 1);
        for (let b = 0; b < marquee.bulbs.length; b++) {
          const bulb = marquee.bulbs[b];
          const isActive = (b % 3) === (activeIndex % 3);
          const mat = bulb.material as THREE.MeshBasicMaterial;
          if (mat && typeof mat.color?.setHex === 'function') {
            mat.color.setHex(isActive ? 0xfffbeb : 0x78350f);
          }
        }
      }
    }

    // 6. Monumental Clock Tower Pendulum & Hands
    for (let c = 0; c < this.clockTowers.length; c++) {
      const ct = this.clockTowers[c];
      if (!reducedMotion) {
        const pendAngle = Math.sin(this.globalTime * 2.2) * 0.22;
        ct.pendulum.rotation.z = pendAngle;
      }
      if (ct.minuteHand) {
        ct.minuteHand.rotation.z = -(this.globalTime * 0.05) % (Math.PI * 2);
      }
    }

    // 7. Paparazzi Flash Bulbs flashing on the red carpet
    if (!reducedMotion) {
      for (let p = 0; p < this.paparazziFlashes.length; p++) {
        const pf = this.paparazziFlashes[p];
        pf.timer += delta;
        if (pf.timer >= pf.interval) {
          pf.mesh.visible = true;
          if (pf.timer >= pf.interval + 0.08) {
            pf.mesh.visible = false;
            pf.timer = Math.random() * 0.4; // slight jitter for next flash
          }
        } else {
          pf.mesh.visible = false;
        }
      }
    }

    // 8. SIGNATURE ANIMATION A: VIP Red-Carpet Arrival Sequence
    if (!reducedMotion) {
      for (let v = 0; v < this.vipArrivals.length; v++) {
        const actor = this.vipArrivals[v];
        actor.cycleTimer += delta;

        let t = actor.cycleTimer % 16.0;
        if (_playerZ !== undefined && actor.worldZ !== undefined) {
          const dist = _playerZ - actor.worldZ;
          if (dist >= -25 && dist <= 120) {
            if (dist > 70) {
              const frac = (120 - dist) / 50;
              t = frac * 4.0;
              actor.stage = 'APPROACH';
            } else if (dist > 25) {
              const frac = (70 - dist) / 45;
              t = 4.0 + frac * 2.5;
              actor.stage = 'DOOR_OPEN';
            } else if (dist > -5) {
              const frac = (25 - dist) / 30;
              t = 6.5 + frac * 4.0;
              actor.stage = 'RED_CARPET_EXIT';
            } else {
              const frac = (-5 - dist) / 20;
              t = 10.5 + Math.min(1.0, frac) * 4.0;
              actor.stage = 'HOTEL_WALK';
            }
          }
        } else {
          if (t < 4.0) actor.stage = 'APPROACH';
          else if (t < 6.5) actor.stage = 'DOOR_OPEN';
          else if (t < 10.5) actor.stage = 'RED_CARPET_EXIT';
          else if (t < 14.5) actor.stage = 'HOTEL_WALK';
          else actor.stage = 'RESET';
        }

        if (t < 4.0) {
          // Approach: Limousine rolls in smoothly along boulevard
          const p = t / 4.0;
          const ease = 1 - Math.pow(1 - p, 3);
          actor.limousine.position.z = actor.initialLimoZ + 22.0 * (1 - ease);
          actor.rearDoorPivot.rotation.y = 0;
          actor.gentlemanGroup.visible = false;
          actor.ladyGroup.visible = false;
          if (actor.valetTorso) actor.valetTorso.rotation.x = 0;
          if (actor.valetArm) actor.valetArm.rotation.z = 0;
          for (const phot of actor.photographers) {
            phot.group.rotation.y = phot.initialRotY;
            phot.flashMesh.visible = false;
          }
        } else if (t < 6.5) {
          // Valet Greeting & Door Open: Valet approaches, bows, door swings open
          actor.limousine.position.z = actor.initialLimoZ;
          const pOpen = (t - 4.0) / 2.5;
          const doorAngle = -Math.PI * 0.38 * Math.sin(pOpen * Math.PI * 0.5);
          actor.rearDoorPivot.rotation.y = doorAngle;
          if (actor.valetTorso) actor.valetTorso.rotation.x = 0.28 * Math.sin(pOpen * Math.PI * 0.5);
          if (actor.valetArm) actor.valetArm.rotation.z = -0.55 * Math.sin(pOpen * Math.PI * 0.5);
          actor.gentlemanGroup.visible = false;
          actor.ladyGroup.visible = false;
        } else if (t < 10.5) {
          // VIP Exit: Couple steps down out of limousine onto red carpet, photographers fire flashes
          actor.limousine.position.z = actor.initialLimoZ;
          actor.gentlemanGroup.visible = true;
          actor.ladyGroup.visible = true;
          const pExit = (t - 6.5) / 4.0;
          actor.gentlemanGroup.position.x = THREE.MathUtils.lerp(actor.doorLimoX, actor.redCarpetX, Math.min(1, pExit * 1.6));
          actor.gentlemanGroup.position.z = actor.carpetCenterZ;
          actor.gentlemanGroup.position.y = 0.03 + Math.abs(Math.sin(t * 6.0)) * 0.05;

          actor.ladyGroup.position.x = THREE.MathUtils.lerp(actor.doorLimoX, actor.redCarpetX - 0.7, Math.min(1, Math.max(0, (pExit - 0.2) * 1.5)));
          actor.ladyGroup.position.z = actor.carpetCenterZ + 0.6;
          actor.ladyGroup.position.y = 0.03 + Math.abs(Math.sin(t * 6.0)) * 0.04;

          // Photographers pivot & flash
          for (const phot of actor.photographers) {
            phot.group.rotation.y = phot.initialRotY + Math.sin(t * 2.0) * 0.25;
            const flashActive = Math.sin(t * 24.0) > 0.65;
            phot.flashMesh.visible = flashActive;
          }
        } else if (t < 14.5) {
          // Walk into Hotel: Couple walks gracefully along red carpet into grand illuminated entrance
          actor.limousine.position.z = actor.initialLimoZ;
          const pWalk = (t - 10.5) / 4.0;
          actor.gentlemanGroup.position.x = actor.redCarpetX;
          actor.gentlemanGroup.position.z = THREE.MathUtils.lerp(actor.carpetCenterZ, actor.carpetCenterZ - 3.8, pWalk);
          actor.gentlemanGroup.position.y = 0.03 + Math.abs(Math.sin(t * 7.0)) * 0.06;

          actor.ladyGroup.position.x = actor.redCarpetX - 0.7;
          actor.ladyGroup.position.z = THREE.MathUtils.lerp(actor.carpetCenterZ + 0.6, actor.carpetCenterZ - 3.2, pWalk);
          actor.ladyGroup.position.y = 0.03 + Math.abs(Math.sin(t * 7.0)) * 0.05;

          // Valet straightens and gestures
          if (actor.valetTorso) actor.valetTorso.rotation.x = THREE.MathUtils.lerp(0.28, 0, pWalk);
          actor.rearDoorPivot.rotation.y = THREE.MathUtils.lerp(-Math.PI * 0.38, 0, Math.min(1, pWalk * 2.2));

          // Intermittent flashes
          for (const phot of actor.photographers) {
            phot.flashMesh.visible = Math.sin(t * 14.0) > 0.8;
          }
        } else {
          // Reset / loop
          actor.gentlemanGroup.visible = false;
          actor.ladyGroup.visible = false;
          actor.rearDoorPivot.rotation.y = 0;
          for (const phot of actor.photographers) {
            phot.group.rotation.y = phot.initialRotY;
            phot.flashMesh.visible = false;
          }
        }
      }
    }

    // 9. SIGNATURE ANIMATION B: Grand Nightclub Reveal Sequence
    if (!reducedMotion) {
      for (let n = 0; n < this.nightclubReveals.length; n++) {
        const actor = this.nightclubReveals[n];
        actor.revealTimer += delta;

        let revealSpeed = 1.0;
        if (_playerZ !== undefined && actor.worldZ !== undefined) {
          const dist = _playerZ - actor.worldZ;
          if (dist > 80) {
            actor.stage = 'IDLE_WARM';
            revealSpeed = 0.7;
          } else if (dist > 35) {
            actor.stage = 'LIGHTS_ACCELERATE';
            revealSpeed = 1.4;
          } else if (dist > -10) {
            actor.stage = 'KINETIC_CLIMAX';
            revealSpeed = 2.2;
          } else {
            actor.stage = 'AFTERMATH';
            revealSpeed = 0.9;
          }
        } else {
          actor.stage = 'KINETIC_CLIMAX';
        }

        // Kinetic Art Deco Sculpture revolving in 3D
        if (actor.kineticSculpture) {
          actor.kineticSculpture.outerRing.rotation.z += 0.55 * delta;
          actor.kineticSculpture.midRing.rotation.x += 0.75 * delta;
          actor.kineticSculpture.innerSpokes.rotation.y += 1.10 * delta;
          const pulse = 1.0 + 0.14 * Math.sin(this.globalTime * 3.5);
          actor.kineticSculpture.coreSphere.scale.set(pulse, pulse, pulse);
        }

        // Sequential marquee light chaser
        const activeIdx = Math.floor(actor.revealTimer * 7.0) % (actor.marqueeBulbs.length || 1);
        for (let b = 0; b < actor.marqueeBulbs.length; b++) {
          const bulb = actor.marqueeBulbs[b];
          const active = (b % 3) === (activeIdx % 3);
          const mat = bulb.material as THREE.MeshBasicMaterial;
          if (mat && typeof mat.color?.setHex === 'function') {
            mat.color.setHex(active ? 0xfffbeb : 0x78350f);
          }
        }

        // Vertical pillar light column ascending glow waves
        for (let p = 0; p < actor.verticalPillars.length; p++) {
          const pillar = actor.verticalPillars[p];
          const phase = (this.globalTime * 1.8 + p * 0.35) % 1.0;
          const lum = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
          const mat = pillar.material as THREE.MeshStandardMaterial;
          if (mat) {
            mat.emissiveIntensity = 0.8 + lum * 1.6;
          }
        }

        // Queue crowd conversational sway
        for (let q = 0; q < actor.queueGuests.length; q++) {
          const g = actor.queueGuests[q];
          g.group.rotation.y = Math.sin(this.globalTime * 1.6 + g.swayPhase) * 0.12;
          if (g.armWine) {
            g.armWine.rotation.z = -0.4 + Math.sin(this.globalTime * 2.2 + g.swayPhase) * 0.18;
          }
        }

        // Bouncer checking VIP guest list
        if (actor.bouncer.clipboardArm) {
          actor.bouncer.clipboardArm.rotation.x = 0.22 + Math.sin(this.globalTime * 1.1) * 0.12;
        }
      }
    }
  }
}

