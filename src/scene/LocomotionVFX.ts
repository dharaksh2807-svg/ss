import * as THREE from 'three';
import { EventBus, EVENTS } from '../core/EventBus';
import { SupportSurfaceType } from '../player/Player';
import { GraphicsManager, QualityConfig } from './GraphicsManager';

interface DustParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  age: number;
  maxAge: number;
  startScale: number;
  endScale: number;
  startOpacity: number;
  active: boolean;
}

export class LocomotionVFX {
  private group: THREE.Group;
  private landingPool: DustParticle[] = [];
  private slidePool: DustParticle[] = [];
  private slideSpawnAccumulator: number = 0;
  private particleMultiplier: number = 1.0;
  private eventBus = EventBus.getInstance();
  private unsubs: Array<() => void> = [];

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'locomotion_vfx_group';
    scene.add(this.group);

    const initialConfig = GraphicsManager.getInstance().getActiveConfig();
    this.particleMultiplier = initialConfig.particleMultiplier;

    this.initPools();
    this.setupListeners();
  }

  private initPools(): void {
    // 1. Landing dust ring particles (low-profile ground discs)
    const landingGeo = new THREE.PlaneGeometry(0.28, 0.28);
    for (let i = 0; i < 32; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xd8dde4,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(landingGeo, mat);
      mesh.rotation.x = -Math.PI / 2; // Flat on ground/roof plane
      mesh.visible = false;
      this.group.add(mesh);

      this.landingPool.push({
        mesh,
        velocity: new THREE.Vector3(),
        age: 0,
        maxAge: 0.22,
        startScale: 0.4,
        endScale: 1.4,
        startOpacity: 0.65,
        active: false
      });
    }

    // 2. Slide friction sparks / dust particles
    const slideGeo = new THREE.PlaneGeometry(0.16, 0.16);
    for (let i = 0; i < 20; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(slideGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      this.group.add(mesh);

      this.slidePool.push({
        mesh,
        velocity: new THREE.Vector3(),
        age: 0,
        maxAge: 0.18,
        startScale: 0.3,
        endScale: 0.9,
        startOpacity: 0.55,
        active: false
      });
    }
  }

  private setupListeners(): void {
    const unsub = this.eventBus.on(EVENTS.LAND, (data?: {
      isFastDrop?: boolean;
      surface?: SupportSurfaceType;
      position?: THREE.Vector3;
    }) => {
      if (data && data.position) {
        this.spawnLandingDust(data.position, data.isFastDrop === true, data.surface || 'GROUND');
      }
    });
    this.unsubs.push(unsub);

    const unsubGraphics = this.eventBus.on('GRAPHICS_CONFIG_CHANGED', (config: QualityConfig) => {
      this.particleMultiplier = config.particleMultiplier;
    });
    this.unsubs.push(unsubGraphics);
  }

  public spawnLandingDust(
    pos: THREE.Vector3,
    isFastDrop: boolean,
    surface: SupportSurfaceType
  ): void {
    const rawCount = isFastDrop ? 12 : 8;
    const particleCount = Math.max(1, Math.round(rawCount * this.particleMultiplier));
    const baseColor = surface === 'TRAIN_ROOF' ? 0xa0aec0 : 0xd8dde4;
    const speed = isFastDrop ? 2.6 : 1.8;
    const maxAge = isFastDrop ? 0.25 : 0.20;

    let spawned = 0;
    for (const p of this.landingPool) {
      if (p.active) continue;

      const angle = (spawned / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const radialSpeed = speed * (0.8 + Math.random() * 0.4);

      p.active = true;
      p.age = 0;
      p.maxAge = maxAge;
      p.startScale = isFastDrop ? 0.5 : 0.35;
      p.endScale = isFastDrop ? 1.6 : 1.25;
      p.startOpacity = isFastDrop ? 0.8 : 0.65;

      p.mesh.position.set(
        pos.x + Math.cos(angle) * 0.12,
        pos.y + 0.02,
        pos.z + Math.sin(angle) * 0.12
      );
      p.mesh.scale.setScalar(p.startScale);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(baseColor);
      mat.opacity = p.startOpacity;
      p.mesh.visible = true;

      p.velocity.set(
        Math.cos(angle) * radialSpeed,
        0.18 + Math.random() * 0.22,
        Math.sin(angle) * radialSpeed
      );

      spawned++;
      if (spawned >= particleCount) break;
    }
  }

  public spawnSlideFriction(pos: THREE.Vector3, dt: number, isBoard: boolean = false): void {
    this.slideSpawnAccumulator += dt;
    const threshold = (isBoard ? 0.035 : 0.045) / Math.max(0.2, this.particleMultiplier);
    if (this.slideSpawnAccumulator < threshold) return;
    this.slideSpawnAccumulator = 0;

    // Pick 1-2 inactive particles from slide pool
    let spawned = 0;
    const count = isBoard ? 2 : 1;
    for (const p of this.slidePool) {
      if (p.active) continue;

      p.active = true;
      p.age = 0;
      p.maxAge = 0.18;
      p.startScale = 0.35;
      p.endScale = 0.95;
      p.startOpacity = 0.6;

      // Trailing behind sliding foot or board tail
      const lateralSpread = (Math.random() - 0.5) * (isBoard ? 0.45 : 0.25);
      p.mesh.position.set(
        pos.x + lateralSpread,
        pos.y + 0.025,
        pos.z + 0.38 + Math.random() * 0.15
      );
      p.mesh.scale.setScalar(p.startScale);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(isBoard ? 0x93c5fd : 0xd8dde4);
      mat.opacity = p.startOpacity;
      p.mesh.visible = true;

      p.velocity.set(
        lateralSpread * 0.8,
        0.15 + Math.random() * 0.2,
        0.8 + Math.random() * 0.6
      );

      spawned++;
      if (spawned >= count) break;
    }
  }

  public update(dt: number, player?: { isSliding: boolean; position: THREE.Vector3; hoverboardManager?: { isBoardActive: () => boolean } }): void {
    // 1. Update landing particles
    for (const p of this.landingPool) {
      if (!p.active) continue;
      p.age += dt;
      const progress = p.age / p.maxAge;
      if (progress >= 1.0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;

      // Expand and dissolve
      const scale = THREE.MathUtils.lerp(p.startScale, p.endScale, progress);
      p.mesh.scale.setScalar(scale);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = p.startOpacity * (1.0 - progress);
    }

    // 2. Spawn & update slide particles
    if (player && player.isSliding) {
      const isBoard = player.hoverboardManager ? player.hoverboardManager.isBoardActive() : false;
      this.spawnSlideFriction(player.position, dt, isBoard);
    }

    for (const p of this.slidePool) {
      if (!p.active) continue;
      p.age += dt;
      const progress = p.age / p.maxAge;
      if (progress >= 1.0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;

      const scale = THREE.MathUtils.lerp(p.startScale, p.endScale, progress);
      p.mesh.scale.setScalar(scale);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = p.startOpacity * (1.0 - progress);
    }
  }

  public reset(): void {
    for (const p of this.landingPool) {
      p.active = false;
      p.mesh.visible = false;
    }
    for (const p of this.slidePool) {
      p.active = false;
      p.mesh.visible = false;
    }
    this.slideSpawnAccumulator = 0;
  }

  public dispose(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.reset();
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
