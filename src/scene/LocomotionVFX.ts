import * as THREE from 'three';
import { EventBus, EVENTS } from '../core/EventBus';
import { SupportSurfaceType } from '../player/Player';
import { GraphicsManager, QualityConfig } from './GraphicsManager';
import { SettingsManager } from '../settings/SettingsManager';

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
  private footfallPool: DustParticle[] = [];   // Phase 4: per-step ground puff
  private coinBurstPool: DustParticle[] = [];  // Phase 7: sparkling coin pickup burst
  private impactPool: DustParticle[] = [];     // Phase 7: energetic collision / stumble impact sparks
  private energyRingPool: DustParticle[] = []; // Phase 7: shield / board / powerup shockwave ring
  private takeoffPool: DustParticle[] = [];    // Phase 7: athletic jump takeoff puff
  private streakPool: DustParticle[] = [];     // Phase 7: near-miss slipstream streak

  private lastPlayerPos: THREE.Vector3 = new THREE.Vector3();
  private slideSpawnAccumulator: number = 0;
  private particleMultiplier: number = 1.0;
  private eventBus = EventBus.getInstance();
  private settingsManager = SettingsManager.getInstance();
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

    // 3. Phase 4: Per-footfall ground puff (subtle ground contact feedback)
    const footfallGeo = new THREE.PlaneGeometry(0.14, 0.14);
    for (let i = 0; i < 16; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xcbd5e1,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(footfallGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      this.group.add(mesh);

      this.footfallPool.push({
        mesh,
        velocity: new THREE.Vector3(),
        age: 0,
        maxAge: 0.14,
        startScale: 0.2,
        endScale: 0.72,
        startOpacity: 0.38,
        active: false
      });
    }

    // 4. Phase 7: Coin pickup golden sparkle bursts
    const coinGeo = new THREE.PlaneGeometry(0.12, 0.12);
    for (let i = 0; i < 24; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(coinGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.coinBurstPool.push({
        mesh,
        velocity: new THREE.Vector3(),
        age: 0,
        maxAge: 0.24,
        startScale: 0.15,
        endScale: 0.04,
        startOpacity: 0.85,
        active: false
      });
    }

    // 5. Phase 7: Impact sparks on collision / stumble / shield break
    const impactGeo = new THREE.PlaneGeometry(0.15, 0.15);
    for (let i = 0; i < 16; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(impactGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.impactPool.push({
        mesh,
        velocity: new THREE.Vector3(),
        age: 0,
        maxAge: 0.22,
        startScale: 0.25,
        endScale: 0.05,
        startOpacity: 0.9,
        active: false
      });
    }

    // 6. Phase 7: Expanding energy shockwave rings (shield / board / powerup)
    const ringGeo = new THREE.RingGeometry(0.24, 0.32, 24);
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      this.group.add(mesh);
      this.energyRingPool.push({
        mesh,
        velocity: new THREE.Vector3(),
        age: 0,
        maxAge: 0.32,
        startScale: 0.4,
        endScale: 2.2,
        startOpacity: 0.75,
        active: false
      });
    }

    // 7. Phase 7: Jump takeoff mini-puff
    const takeoffGeo = new THREE.PlaneGeometry(0.18, 0.18);
    for (let i = 0; i < 8; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(takeoffGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.visible = false;
      this.group.add(mesh);
      this.takeoffPool.push({
        mesh,
        velocity: new THREE.Vector3(),
        age: 0,
        maxAge: 0.18,
        startScale: 0.25,
        endScale: 0.85,
        startOpacity: 0.5,
        active: false
      });
    }

    // 8. Phase 7: Near-miss slipstream speed streaks
    const streakGeo = new THREE.PlaneGeometry(0.08, 0.32);
    for (let i = 0; i < 8; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(streakGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.streakPool.push({
        mesh,
        velocity: new THREE.Vector3(),
        age: 0,
        maxAge: 0.20,
        startScale: 0.3,
        endScale: 1.1,
        startOpacity: 0.7,
        active: false
      });
    }
  }

  private setupListeners(): void {
    this.unsubs.push(
      this.eventBus.on(EVENTS.LAND, (data?: {
        isFastDrop?: boolean;
        surface?: SupportSurfaceType;
        position?: THREE.Vector3;
      }) => {
        const pos = data?.position || this.lastPlayerPos;
        this.spawnLandingDust(pos, data?.isFastDrop === true, data?.surface || 'GROUND');
      })
    );

    this.unsubs.push(
      this.eventBus.on(EVENTS.JUMP, (data?: { position?: THREE.Vector3 }) => {
        this.spawnTakeoffPuff(data?.position || this.lastPlayerPos);
      })
    );

    this.unsubs.push(
      this.eventBus.on(EVENTS.FAST_DROP, (data?: { position?: THREE.Vector3 }) => {
        this.spawnFastDropStreak(data?.position || this.lastPlayerPos);
      })
    );

    this.unsubs.push(
      this.eventBus.on(EVENTS.COIN_COLLECTED, (data?: { position?: THREE.Vector3 }) => {
        this.spawnCoinBurst(data?.position || this.lastPlayerPos);
      })
    );

    this.unsubs.push(
      this.eventBus.on(EVENTS.CRASH, (data?: { position?: THREE.Vector3 }) => {
        this.spawnImpactSparks(data?.position || this.lastPlayerPos, 0xff2200);
      })
    );

    this.unsubs.push(
      this.eventBus.on(EVENTS.STUMBLE, (data?: { position?: THREE.Vector3 }) => {
        this.spawnImpactSparks(data?.position || this.lastPlayerPos, 0xffaa00);
      })
    );

    this.unsubs.push(
      this.eventBus.on('SHIELD_BROKEN', (data?: { position?: THREE.Vector3 }) => {
        const pos = data?.position || this.lastPlayerPos;
        this.spawnEnergyRing(pos, 0x00e5ff);
        this.spawnImpactSparks(pos, 0x00e5ff);
      })
    );

    this.unsubs.push(
      this.eventBus.on(EVENTS.HOVERBOARD_BROKEN, (data?: { position?: THREE.Vector3 }) => {
        const pos = data?.position || this.lastPlayerPos;
        this.spawnEnergyRing(pos, 0xf59e0b);
        this.spawnImpactSparks(pos, 0xf59e0b);
      })
    );

    this.unsubs.push(
      this.eventBus.on(EVENTS.POWERUP_ACTIVATED, (type?: string, data?: { position?: THREE.Vector3 }) => {
        const color = type === 'MAGNET' ? 0xff3b30 : type === 'JETPACK' ? 0xf59e0b : 0x00f0ff;
        this.spawnEnergyRing(data?.position || this.lastPlayerPos, color);
      })
    );

    this.unsubs.push(
      this.eventBus.on(EVENTS.HOVERBOARD_ACTIVATED, (data?: { position?: THREE.Vector3 }) => {
        this.spawnEnergyRing(data?.position || this.lastPlayerPos, 0x38bdf8);
      })
    );

    this.unsubs.push(
      this.eventBus.on(EVENTS.REVIVE_EXECUTED, (data?: { position?: THREE.Vector3 }) => {
        const pos = data?.position || this.lastPlayerPos;
        this.spawnEnergyRing(pos, 0x10b981);
        this.spawnCoinBurst(pos);
      })
    );

    this.unsubs.push(
      this.eventBus.on(EVENTS.NEAR_MISS, (data?: { position?: THREE.Vector3 }) => {
        this.spawnNearMissStreak(data?.position || this.lastPlayerPos);
      })
    );

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

  public spawnFootfall(pos: THREE.Vector3, surface: SupportSurfaceType): void {
    if (this.particleMultiplier < 0.5) return; // Skip on low-quality preset
    const count = Math.max(1, Math.round(3 * this.particleMultiplier));
    const baseColor = surface === 'TRAIN_ROOF' ? 0x94a3b8 : 0xcbd5e1;
    let spawned = 0;
    for (const p of this.footfallPool) {
      if (p.active) continue;
      const angle = (spawned / count) * Math.PI * 2 + Math.random() * 0.6;
      const radialSpeed = 0.55 + Math.random() * 0.35;
      p.active = true;
      p.age = 0;
      p.maxAge = 0.14;
      p.startScale = 0.18 + Math.random() * 0.08;
      p.endScale = 0.55 + Math.random() * 0.22;
      p.startOpacity = 0.32 + Math.random() * 0.12;
      p.mesh.position.set(
        pos.x + Math.cos(angle) * 0.06,
        pos.y + 0.015,
        pos.z + Math.sin(angle) * 0.06
      );
      p.mesh.scale.setScalar(p.startScale);
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(baseColor);
      mat.opacity = p.startOpacity;
      p.mesh.visible = true;
      p.velocity.set(
        Math.cos(angle) * radialSpeed,
        0.08 + Math.random() * 0.10,
        Math.sin(angle) * radialSpeed
      );
      spawned++;
      if (spawned >= count) break;
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

  public spawnCoinBurst(pos: THREE.Vector3): void {
    const isReduced = this.settingsManager.isReducedMotion();
    const count = isReduced ? 2 : Math.max(1, Math.round(5 * this.particleMultiplier));
    const isHighContrast = !!this.settingsManager.getState().highContrastObstacles;
    const colorHex = isHighContrast ? 0xffeb3b : 0xffd700;

    let spawned = 0;
    for (const p of this.coinBurstPool) {
      if (p.active) continue;
      const angle = (spawned / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = isReduced ? 0.6 : (1.4 + Math.random() * 0.8);
      p.active = true;
      p.age = 0;
      p.maxAge = isReduced ? 0.18 : 0.26;
      p.startScale = 0.16;
      p.endScale = 0.04;
      p.startOpacity = 0.95;

      p.mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.15,
        pos.y + 0.6 + (Math.random() - 0.5) * 0.2,
        pos.z + (Math.random() - 0.5) * 0.15
      );
      p.mesh.scale.setScalar(p.startScale);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(colorHex);
      mat.opacity = p.startOpacity;
      p.mesh.visible = true;

      p.velocity.set(
        Math.cos(angle) * speed * 0.6,
        speed * 0.8,
        Math.sin(angle) * speed * 0.6
      );

      spawned++;
      if (spawned >= count) break;
    }
  }

  public spawnImpactSparks(pos: THREE.Vector3, colorHex: number = 0xff8800): void {
    const isReduced = this.settingsManager.isReducedMotion();
    const count = isReduced ? 3 : Math.max(2, Math.round(8 * this.particleMultiplier));
    const isHighContrast = !!this.settingsManager.getState().highContrastObstacles;
    const finalColor = isHighContrast ? 0xff1744 : colorHex;

    let spawned = 0;
    for (const p of this.impactPool) {
      if (p.active) continue;
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.3) * Math.PI * 0.5;
      const speed = isReduced ? 1.0 : (2.4 + Math.random() * 1.6);

      p.active = true;
      p.age = 0;
      p.maxAge = 0.22;
      p.startScale = 0.22;
      p.endScale = 0.04;
      p.startOpacity = 0.9;

      p.mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.2,
        pos.y + 0.5 + (Math.random() - 0.5) * 0.2,
        pos.z + (Math.random() - 0.5) * 0.2
      );
      p.mesh.scale.setScalar(p.startScale);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(finalColor);
      mat.opacity = p.startOpacity;
      p.mesh.visible = true;

      p.velocity.set(
        Math.cos(angle) * Math.cos(elevation) * speed,
        Math.sin(elevation) * speed + 0.5,
        Math.sin(angle) * Math.cos(elevation) * speed
      );

      spawned++;
      if (spawned >= count) break;
    }
  }

  public spawnEnergyRing(pos: THREE.Vector3, colorHex: number = 0x00f0ff): void {
    if (this.settingsManager.isReducedMotion()) return;
    for (const p of this.energyRingPool) {
      if (p.active) continue;
      p.active = true;
      p.age = 0;
      p.maxAge = 0.32;
      p.startScale = 0.4;
      p.endScale = 2.2;
      p.startOpacity = 0.8;

      p.mesh.position.set(pos.x, pos.y + 0.1, pos.z);
      p.mesh.scale.setScalar(p.startScale);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(colorHex);
      mat.opacity = p.startOpacity;
      p.mesh.visible = true;

      p.velocity.set(0, 0.2, 0);
      break;
    }
  }

  public spawnTakeoffPuff(pos: THREE.Vector3): void {
    const isReduced = this.settingsManager.isReducedMotion();
    const count = isReduced ? 2 : Math.max(1, Math.round(4 * this.particleMultiplier));
    let spawned = 0;
    for (const p of this.takeoffPool) {
      if (p.active) continue;
      const angle = (spawned / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      p.active = true;
      p.age = 0;
      p.maxAge = 0.18;
      p.startScale = 0.22;
      p.endScale = 0.85;
      p.startOpacity = 0.55;

      p.mesh.position.set(
        pos.x + Math.cos(angle) * 0.08,
        pos.y + 0.02,
        pos.z + Math.sin(angle) * 0.08
      );
      p.mesh.scale.setScalar(p.startScale);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(0xe2e8f0);
      mat.opacity = p.startOpacity;
      p.mesh.visible = true;

      p.velocity.set(
        Math.cos(angle) * 0.9,
        0.15,
        Math.sin(angle) * 0.9
      );

      spawned++;
      if (spawned >= count) break;
    }
  }

  public spawnNearMissStreak(pos: THREE.Vector3): void {
    if (this.settingsManager.isReducedMotion()) return;
    for (const p of this.streakPool) {
      if (p.active) continue;
      p.active = true;
      p.age = 0;
      p.maxAge = 0.20;
      p.startScale = 0.3;
      p.endScale = 1.2;
      p.startOpacity = 0.75;

      const side = Math.random() > 0.5 ? 0.45 : -0.45;
      p.mesh.position.set(pos.x + side, pos.y + 0.6, pos.z + 0.2);
      p.mesh.scale.setScalar(p.startScale);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(0x38bdf8);
      mat.opacity = p.startOpacity;
      p.mesh.visible = true;

      p.velocity.set(side * 0.3, 0.1, 1.8);
      break;
    }
  }

  public spawnFastDropStreak(pos: THREE.Vector3): void {
    if (this.settingsManager.isReducedMotion()) return;
    const offsets = [-0.35, 0.35];
    for (let i = 0; i < offsets.length; i++) {
      for (const p of this.streakPool) {
        if (p.active) continue;
        p.active = true;
        p.age = 0;
        p.maxAge = 0.16;
        p.startScale = 0.25;
        p.endScale = 1.0;
        p.startOpacity = 0.85;

        p.mesh.position.set(pos.x + offsets[i], pos.y + 0.8, pos.z + 0.1);
        p.mesh.scale.setScalar(p.startScale);

        const mat = p.mesh.material as THREE.MeshBasicMaterial;
        mat.color.setHex(0xe2e8f0);
        mat.opacity = p.startOpacity;
        p.mesh.visible = true;

        p.velocity.set(0, 5.5, 0.5);
        break;
      }
    }
  }

  public update(dt: number, player?: { isSliding: boolean; position: THREE.Vector3; hoverboardManager?: { isBoardActive: () => boolean } }): void {
    if (player?.position) {
      this.lastPlayerPos.copy(player.position);
    }

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

    // 3. Update footfall puff particles (Phase 4)
    for (const p of this.footfallPool) {
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

    // 4. Update coin burst sparkles
    for (const p of this.coinBurstPool) {
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

    // 5. Update impact sparks
    for (const p of this.impactPool) {
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

    // 6. Update energy shockwave rings
    for (const p of this.energyRingPool) {
      if (!p.active) continue;
      p.age += dt;
      const progress = p.age / p.maxAge;
      if (progress >= 1.0) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.mesh.position.y += p.velocity.y * dt;
      const scale = THREE.MathUtils.lerp(p.startScale, p.endScale, progress);
      p.mesh.scale.setScalar(scale);
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = p.startOpacity * (1.0 - progress);
    }

    // 7. Update takeoff puffs
    for (const p of this.takeoffPool) {
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

    // 8. Update near-miss streaks
    for (const p of this.streakPool) {
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
    const pools = [
      this.landingPool,
      this.slidePool,
      this.footfallPool,
      this.coinBurstPool,
      this.impactPool,
      this.energyRingPool,
      this.takeoffPool,
      this.streakPool
    ];
    for (const pool of pools) {
      for (const p of pool) {
        p.active = false;
        p.mesh.visible = false;
      }
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
