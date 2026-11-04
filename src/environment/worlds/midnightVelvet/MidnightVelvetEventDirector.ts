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

export class MidnightVelvetEventDirector {
  private static instance: MidnightVelvetEventDirector | null = null;

  private motorcadeCars: MotorcadeCar[] = [];
  private partyDancers: PartyDancer[] = [];
  private searchlights: SkylineSearchlight[] = [];
  private marinaYachts: MarinaYacht[] = [];
  private hotelMarquees: HotelMarquee[] = [];
  private clockTowers: ClockTowerGag[] = [];

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
    this.globalTime = 0;
  }

  // --- Registration Hooks ---

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

  // --- Animation Update Loop ---

  public update(delta: number, isActive: boolean = true): void {
    if (!isActive || delta <= 0) return;

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
          if (mat) {
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
  }
}
