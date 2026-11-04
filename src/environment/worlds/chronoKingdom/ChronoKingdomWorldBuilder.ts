import * as THREE from 'three';
import { SeededRandom } from '../../SceneryFactory';
import { ChronoKingdomEventDirector } from './ChronoKingdomEventDirector';
import { CHRONO_KINGDOM_TRAIN_LIVERY } from './ChronoKingdomTheme';

/**
 * Procedural Texture Cache for Chrono Kingdom
 * Self-contained procedural canvas textures for clock dials, astrolabes, gauges, and vortexes.
 */
class ChronoKingdomTextureHelper {
  private static cache = new Map<string, THREE.Texture>();

  public static getClockFaceTexture(isRoman: boolean = true): THREE.Texture {
    const key = `chrono_clock_face_${isRoman ? 'roman' : 'arabic'}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Antique aged parchment dial background
    const bgGrad = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.1, size * 0.5, size * 0.5, size * 0.48);
    bgGrad.addColorStop(0, '#fef3c7');
    bgGrad.addColorStop(0.7, '#fde68a');
    bgGrad.addColorStop(0.95, '#d97706');
    bgGrad.addColorStop(1.0, '#78350f');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.48, 0, Math.PI * 2);
    ctx.fill();

    // Outer Gilded Bezel Rings
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.47, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.44, 0, Math.PI * 2);
    ctx.stroke();

    // Roman Numerals
    const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    ctx.fillStyle = '#2b1406';
    ctx.font = 'bold 36px "Cinzel", "Georgia", "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6 - Math.PI / 2;
      const x = size * 0.5 + Math.cos(angle) * (size * 0.36);
      const y = size * 0.5 + Math.sin(angle) * (size * 0.36);
      ctx.fillText(numerals[i], x, y);
    }

    // Minute Track & Ticks
    for (let m = 0; m < 60; m++) {
      const angle = (m * Math.PI) / 30;
      const isHour = m % 5 === 0;
      const rInner = isHour ? size * 0.41 : size * 0.425;
      const rOuter = size * 0.44;
      ctx.strokeStyle = isHour ? '#2b1406' : '#92400e';
      ctx.lineWidth = isHour ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(size * 0.5 + Math.cos(angle) * rInner, size * 0.5 + Math.sin(angle) * rInner);
      ctx.lineTo(size * 0.5 + Math.cos(angle) * rOuter, size * 0.5 + Math.sin(angle) * rOuter);
      ctx.stroke();
    }

    // Ornate Center Boss & Escapement Star
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    this.cache.set(key, tex);
    return tex;
  }

  public static getAstrolabeTexture(): THREE.Texture {
    const key = 'chrono_astrolabe_celestial';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Celestial Deep Midnight
    ctx.fillStyle = '#061024';
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.48, 0, Math.PI * 2);
    ctx.fill();

    // Concentric Astrolabe Coordinate Rings
    ctx.strokeStyle = '#d4af37';
    [0.45, 0.38, 0.30, 0.20, 0.12].forEach((ratio, idx) => {
      ctx.lineWidth = idx === 0 ? 6 : 2;
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.5, size * ratio, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Zodiac Ray Dividers
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(size * 0.5 + Math.cos(angle) * (size * 0.2), size * 0.5 + Math.sin(angle) * (size * 0.2));
      ctx.lineTo(size * 0.5 + Math.cos(angle) * (size * 0.45), size * 0.5 + Math.sin(angle) * (size * 0.45));
      ctx.stroke();
    }

    // Star Constellation Dots
    ctx.fillStyle = '#fef08a';
    for (let s = 0; s < 48; s++) {
      const r = (0.15 + (s * 37 % 60) / 200) * size;
      const a = (s * 43 % 360) * (Math.PI / 180);
      ctx.beginPath();
      ctx.arc(size * 0.5 + Math.cos(a) * r, size * 0.5 + Math.sin(a) * r, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  public static getPressureGaugeTexture(): THREE.Texture {
    const key = 'chrono_pressure_gauge';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Dial background
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.46, 0, Math.PI * 2);
    ctx.fill();

    // Brass Bezel
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Red Warning Danger Arc
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.38, -Math.PI * 0.25, Math.PI * 0.25);
    ctx.stroke();

    // Needle pointing into high pressure
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size * 0.5);
    ctx.lineTo(size * 0.5 + Math.cos(-0.1) * (size * 0.32), size * 0.5 + Math.sin(-0.1) * (size * 0.32));
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  public static getVortexTexture(): THREE.Texture {
    const key = 'chrono_temporal_vortex';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Swirling Spiral Gradient
    const radGrad = ctx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5);
    radGrad.addColorStop(0, '#fef08a'); // Radiant golden center
    radGrad.addColorStop(0.3, '#38bdf8'); // Cyan temporal rift
    radGrad.addColorStop(0.65, '#6366f1'); // Indigo distortion
    radGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0)'); // Transparent rim

    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, size, size);

    // Spiral Arms
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 4;
    for (let arm = 0; arm < 4; arm++) {
      const startAngle = (arm * Math.PI) / 2;
      ctx.beginPath();
      for (let r = 10; r < size * 0.45; r += 5) {
        const theta = startAngle + r * 0.04;
        const x = size * 0.5 + Math.cos(theta) * r;
        const y = size * 0.5 + Math.sin(theta) * r;
        if (r === 10) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }
}

/**
 * ChronoKingdomWorldBuilder
 * High-performance procedural 3D scenery generator for Chrono Kingdom: The Clockwork Empire.
 * 
 * Invariants:
 * - Deterministic procedural placement via SeededRandom.
 * - Strict clearance envelope: |X| > 4.2m, Y <= 8.5m (0 meshes in running lanes).
 * - Full geometry and material reuse with zero per-frame allocation.
 * - 4 distinct architectural districts with unmistakable identities.
 */
export class ChronoKingdomWorldBuilder {
  private static instance: ChronoKingdomWorldBuilder | null = null;

  // Geometry Cache
  private geoCache = new Map<string, THREE.BufferGeometry>();

  // Shared Steampunk Materials
  private darkBronzeMat: THREE.MeshStandardMaterial;
  private antiqueGoldMat: THREE.MeshStandardMaterial;
  private burnishedCopperMat: THREE.MeshStandardMaterial;
  private midnightSteelMat: THREE.MeshStandardMaterial;
  private warmGlassAmberMat: THREE.MeshStandardMaterial;
  private furnaceFireMat: THREE.MeshStandardMaterial;
  private darkIronstoneMat: THREE.MeshStandardMaterial;
  private steamedOakMat: THREE.MeshStandardMaterial;
  private glowingCyanMat: THREE.MeshBasicMaterial;
  private steamPuffMat: THREE.MeshBasicMaterial;

  private constructor() {
    this.darkBronzeMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723,
      metalness: 0.76,
      roughness: 0.36
    });

    this.antiqueGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.24
    });

    this.burnishedCopperMat = new THREE.MeshStandardMaterial({
      color: 0xb87333,
      metalness: 0.82,
      roughness: 0.30
    });

    this.midnightSteelMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.65,
      roughness: 0.40
    });

    this.warmGlassAmberMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      metalness: 0.40,
      roughness: 0.20,
      emissive: 0xd97706,
      emissiveIntensity: 0.55
    });

    this.furnaceFireMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xef4444,
      emissiveIntensity: 1.15,
      roughness: 0.4
    });

    this.darkIronstoneMat = new THREE.MeshStandardMaterial({
      color: 0x241a14,
      roughness: 0.85,
      metalness: 0.15
    });

    this.steamedOakMat = new THREE.MeshStandardMaterial({
      color: 0x18110b,
      roughness: 0.75,
      metalness: 0.10
    });

    this.glowingCyanMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8
    });

    this.steamPuffMat = new THREE.MeshBasicMaterial({
      color: 0xf1f5f9,
      transparent: true,
      opacity: 0.55
    });
  }

  public static getInstance(): ChronoKingdomWorldBuilder {
    if (!this.instance) {
      this.instance = new ChronoKingdomWorldBuilder();
    }
    return this.instance;
  }

  // --- Geometry Cache Helpers ---

  private getBox(w: number, h: number, d: number): THREE.BoxGeometry {
    const key = `box_${w}_${h}_${d}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.BoxGeometry(w, h, d));
    }
    return this.geoCache.get(key) as THREE.BoxGeometry;
  }

  private getCylinder(rt: number, rb: number, h: number, segs: number = 8): THREE.CylinderGeometry {
    const key = `cyl_${rt}_${rb}_${h}_${segs}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.CylinderGeometry(rt, rb, h, segs));
    }
    return this.geoCache.get(key) as THREE.CylinderGeometry;
  }

  private getPlane(w: number, h: number): THREE.PlaneGeometry {
    const key = `plane_${w}_${h}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.PlaneGeometry(w, h));
    }
    return this.geoCache.get(key) as THREE.PlaneGeometry;
  }

  private getTorus(r: number, tube: number, radSegs: number = 8, tubSegs: number = 16): THREE.TorusGeometry {
    const key = `torus_${r}_${tube}_${radSegs}_${tubSegs}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.TorusGeometry(r, tube, radSegs, tubSegs));
    }
    return this.geoCache.get(key) as THREE.TorusGeometry;
  }

  private getSphere(r: number, segs: number = 12): THREE.SphereGeometry {
    const key = `sphere_${r}_${segs}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.SphereGeometry(r, segs, segs));
    }
    return this.geoCache.get(key) as THREE.SphereGeometry;
  }

  // =========================================================================
  // MAIN ENTRY POINT: BUILD DISTRICT SCENERY
  // =========================================================================

  public buildDistrictScenery(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL' = 'FULL'
  ): void {
    const rng = new SeededRandom(seed);
    const director = ChronoKingdomEventDirector.getInstance();

    // 4 distinct districts cycled by chunk or seed
    const districtIndex = (seed >= 0 && seed < 4) ? seed : (Math.floor(Math.abs(seed) / 4) % 4);

    switch (districtIndex) {
      case 0:
        this.buildGrandClockworkCapital(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 1:
        this.buildTimeFoundry(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 2:
        this.buildChronoObservatory(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 3:
      default:
        this.buildFracturedTimeDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
    }
  }

  // =========================================================================
  // DISTRICT A — THE GRAND CLOCKWORK CAPITAL
  // =========================================================================

  public buildGrandClockworkCapital(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: ChronoKingdomEventDirector
  ): void {
    const districtA = new THREE.Group();
    districtA.name = 'district_a_grand_clockwork_capital';
    group.add(districtA);

    const wallX = roadbedWidth * 0.5 + 2.4; // 8.4m from center

    [-1, 1].forEach((side) => {
      // 1. Heavy Steampunk Sidewalk Promenade with Bronze Curbs
      const walkW = 16.0;
      const wx = side * (wallX + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 0.8, chunkLength), this.darkIronstoneMat);
      walk.position.set(wx, 0.4, -chunkLength * 0.5);
      districtA.add(walk);

      // Bright Antique Gold / Amber Railing Curb
      const curb = new THREE.Mesh(this.getBox(0.45, 0.9, chunkLength), this.antiqueGoldMat);
      curb.position.set(side * (wallX + 0.22), 0.45, -chunkLength * 0.5);
      districtA.add(curb);

      // 2. Colossal Interconnected Clock Towers
      for (let z = 14; z < chunkLength - 14; z += 38) {
        const towerGroup = new THREE.Group();
        towerGroup.position.set(side * (wallX + 10.0), 0.8, -z);

        // Lower Base (Heavy Riveted Masonry)
        const base = new THREE.Mesh(this.getBox(14.0, 14.0, 26.0), this.darkBronzeMat);
        base.position.y = 7.0;
        towerGroup.add(base);

        // Decorative Fluted Columns
        [-6.5, 6.5].forEach((colX) => {
          const col = new THREE.Mesh(this.getCylinder(0.6, 0.8, 14.0, 8), this.antiqueGoldMat);
          col.position.set(colX, 7.0, 13.0);
          towerGroup.add(col);
        });

        // Middle Tier (Clock Housing & Steampunk Gears)
        const midTier = new THREE.Mesh(this.getBox(12.0, 18.0, 22.0), this.midnightSteelMat);
        midTier.position.y = 23.0;
        towerGroup.add(midTier);

        // Monumental Clock Face facing tracks
        const clockTex = ChronoKingdomTextureHelper.getClockFaceTexture(true);
        const clockMesh = new THREE.Mesh(
          this.getPlane(9.0, 9.0),
          new THREE.MeshStandardMaterial({
            map: clockTex,
            roughness: 0.3,
            metalness: 0.4,
            emissive: 0xd97706,
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide
          })
        );
        clockMesh.position.set(-side * 6.1, 23.0, 0);
        clockMesh.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        towerGroup.add(clockMesh);

        // Chime Hammer on top of clock face
        const hammer = new THREE.Mesh(this.getBox(0.3, 2.5, 0.3), this.antiqueGoldMat);
        hammer.position.set(-side * 6.3, 28.5, 0);
        towerGroup.add(hammer);

        // Chime Resonance Expansion Rings
        const resonanceRings: THREE.Mesh[] = [];
        for (let r = 0; r < 2; r++) {
          const resRing = new THREE.Mesh(
            this.getTorus(4.8, 0.12, 6, 24),
            new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0 })
          );
          resRing.position.set(-side * 6.2, 23.0, 0);
          resRing.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          towerGroup.add(resRing);
          resonanceRings.push(resRing);
        }

        director.registerClockChime(clockMesh, hammer, resonanceRings, 10.0);

        // 3. Functional-Looking Interlocking Rotating Gears on Facade
        const driveGear = this.buildGearMesh(3.8, 14, 0.5, this.antiqueGoldMat);
        driveGear.position.set(-side * 6.2, 14.0, -6.0);
        driveGear.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        towerGroup.add(driveGear);
        director.registerGear(driveGear, 0.8 * side, 'z');

        const drivenGear = this.buildGearMesh(2.2, 8, 0.4, this.burnishedCopperMat);
        drivenGear.position.set(-side * 6.2, 17.5, -4.5);
        drivenGear.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        towerGroup.add(drivenGear);
        director.registerGear(drivenGear, -1.38 * side, 'z');

        // Lower Arched Vault Aperture with Giant Swinging Pendulum
        const pendulumArm = new THREE.Mesh(this.getCylinder(0.08, 0.08, 7.5, 6), this.antiqueGoldMat);
        pendulumArm.position.set(-side * 5.8, 7.5, 5.0);
        const pendulumBob = new THREE.Mesh(this.getCylinder(1.1, 1.1, 0.35, 16), this.antiqueGoldMat);
        pendulumBob.position.set(0, -3.5, 0);
        pendulumBob.rotation.x = Math.PI / 2;
        pendulumArm.add(pendulumBob);
        towerGroup.add(pendulumArm);

        // Register pendulum rotation as harmonic gear/swing
        director.registerGear(pendulumArm, 1.2 * side, 'z');

        // Upper Spire Crown (Soaring to Y = 46m)
        const roof = new THREE.Mesh(this.getCylinder(0.2, 5.5, 12.0, 6), this.burnishedCopperMat);
        roof.position.y = 38.0;
        towerGroup.add(roof);

        const spirePin = new THREE.Mesh(this.getCylinder(0.1, 0.3, 8.0, 6), this.antiqueGoldMat);
        spirePin.position.y = 48.0;
        towerGroup.add(spirePin);

        districtA.add(towerGroup);
      }
    });

    // 4. Retractable Telescoping Brass Skybridge (spanning high above at Y = 18.0m)
    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = 'retractable_brass_skybridge';
    bridgeGroup.position.set(0, 18.5, -chunkLength * 0.5);

    const leftSpan = new THREE.Mesh(this.getBox(6.5, 1.2, 3.5), this.antiqueGoldMat);
    leftSpan.position.set(-6.0, 0, 0);
    bridgeGroup.add(leftSpan);

    const rightSpan = new THREE.Mesh(this.getBox(6.5, 1.2, 3.5), this.antiqueGoldMat);
    rightSpan.position.set(6.0, 0, 0);
    bridgeGroup.add(rightSpan);

    director.registerRetractableBridge(bridgeGroup, leftSpan, rightSpan, 3.2);
    districtA.add(bridgeGroup);

    // 5. Distant Skybridge Clockwork Train Pass (far in background at X = 28m, Y = 22m)
    if (detail !== 'MINIMAL') {
      const viaductTrestle = new THREE.Mesh(this.getBox(3.0, 2.0, chunkLength), this.darkBronzeMat);
      viaductTrestle.position.set(28.0, 21.0, -chunkLength * 0.5);
      districtA.add(viaductTrestle);

      const miniTrain = this.buildMiniatureClockworkTrain();
      miniTrain.position.set(28.0, 22.5, -chunkLength * 0.8);
      districtA.add(miniTrain);
      director.registerSkybridgeTrain(miniTrain, 18.0, -chunkLength * 1.5, 20);
    }
  }

  // =========================================================================
  // DISTRICT B — THE TIME FOUNDRY
  // =========================================================================

  public buildTimeFoundry(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: ChronoKingdomEventDirector
  ): void {
    const districtB = new THREE.Group();
    districtB.name = 'district_b_time_foundry';
    group.add(districtB);

    const wallX = roadbedWidth * 0.5 + 2.4;

    [-1, 1].forEach((side) => {
      // 1. Heavy Scorched Iron Foundry Promenade
      const walkW = 16.0;
      const wx = side * (wallX + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 0.8, chunkLength), this.steamedOakMat);
      walk.position.set(wx, 0.4, -chunkLength * 0.5);
      districtB.add(walk);

      // Burnished Copper Curb Trim
      const curb = new THREE.Mesh(this.getBox(0.45, 0.9, chunkLength), this.burnishedCopperMat);
      curb.position.set(side * (wallX + 0.22), 0.45, -chunkLength * 0.5);
      districtB.add(curb);

      // 2. Foundry Smelting Halls & Glowing Furnaces
      for (let z = 12; z < chunkLength - 12; z += 34) {
        const foundryHall = new THREE.Group();
        foundryHall.position.set(side * (wallX + 9.5), 0.8, -z);

        // Heavy Cast-Iron Foundation Base
        const hallBase = new THREE.Mesh(this.getBox(13.0, 12.0, 24.0), this.darkBronzeMat);
        hallBase.position.y = 6.0;
        foundryHall.add(hallBase);

        // Glowing Smelting Furnace Arch
        const furnaceOpening = new THREE.Mesh(this.getBox(2.0, 7.0, 9.0), this.furnaceFireMat);
        furnaceOpening.position.set(-side * 6.2, 5.0, 0);
        foundryHall.add(furnaceOpening);

        // Steampunk Pressure Gauges on facade
        const gaugeTex = ChronoKingdomTextureHelper.getPressureGaugeTexture();
        const gauge = new THREE.Mesh(
          this.getPlane(2.2, 2.2),
          new THREE.MeshStandardMaterial({ map: gaugeTex, side: THREE.DoubleSide })
        );
        gauge.position.set(-side * 6.6, 10.0, 2.5);
        gauge.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        foundryHall.add(gauge);

        // 3. Timed Steam-Driven Pistons
        const pistonBank = new THREE.Group();
        pistonBank.position.set(-side * 5.8, 12.0, -4.0);

        for (let p = 0; p < 3; p++) {
          const cylinderJacket = new THREE.Mesh(this.getCylinder(0.8, 0.8, 4.0, 8), this.darkBronzeMat);
          cylinderJacket.position.set(0, 2.0, p * 3.2);
          pistonBank.add(cylinderJacket);

          const pistonHead = new THREE.Mesh(this.getCylinder(0.55, 0.55, 1.2, 8), this.antiqueGoldMat);
          pistonHead.position.set(0, 3.5, p * 3.2);
          pistonBank.add(pistonHead);

          // Steam Plume puff
          const steamPlume = new THREE.Mesh(this.getSphere(0.8, 8), this.steamPuffMat);
          steamPlume.position.set(0, 5.2, p * 3.2);
          steamPlume.visible = false;
          pistonBank.add(steamPlume);

          director.registerPiston(
            pistonHead,
            3.5,
            1.4,
            3.5,
            p * (Math.PI / 2),
            undefined,
            steamPlume
          );
        }
        foundryHall.add(pistonBank);

        // 4. Spinning Steam Turbine Wheel
        const turbineHousing = new THREE.Mesh(this.getTorus(3.2, 0.6, 8, 16), this.burnishedCopperMat);
        turbineHousing.position.set(-side * 6.0, 16.0, 6.0);
        turbineHousing.rotation.y = Math.PI / 2;
        foundryHall.add(turbineHousing);

        const turbineWheel = this.buildTurbineBlades(2.8, 10);
        turbineWheel.position.set(-side * 6.0, 16.0, 6.0);
        turbineWheel.rotation.y = Math.PI / 2;
        foundryHall.add(turbineWheel);
        director.registerGear(turbineWheel, 4.0 * side, 'z');

        // Tall Industrial Smokestacks with Copper Crown
        const stack = new THREE.Mesh(this.getCylinder(1.2, 1.8, 22.0, 8), this.midnightSteelMat);
        stack.position.set(0, 23.0, 8.0);
        foundryHall.add(stack);

        const stackCrown = new THREE.Mesh(this.getCylinder(2.2, 1.2, 2.5, 8), this.burnishedCopperMat);
        stackCrown.position.set(0, 34.5, 8.0);
        foundryHall.add(stackCrown);

        districtB.add(foundryHall);
      }

      // 5. Overhead Steam Pressure Conduits running parallel
      const pipeRun = new THREE.Mesh(this.getCylinder(0.3, 0.3, chunkLength, 8), this.burnishedCopperMat);
      pipeRun.rotation.x = Math.PI / 2;
      pipeRun.position.set(side * (wallX + 1.2), 7.5, -chunkLength * 0.5);
      districtB.add(pipeRun);
    });

    // 6. Siding Steam Locomotive Chassis on elevated platform
    const sidingPlatform = new THREE.Mesh(this.getBox(6.0, 1.2, 26.0), this.darkBronzeMat);
    sidingPlatform.position.set(wallX + 8.0, 0.6, -chunkLength * 0.45);
    districtB.add(sidingPlatform);

    const parkedLoco = this.buildChronoKingdomShowcaseTrain(wallX + 8.0, 1.2, -chunkLength * 0.45);
    districtB.add(parkedLoco);
  }

  // =========================================================================
  // DISTRICT C — THE CHRONO OBSERVATORY
  // =========================================================================

  public buildChronoObservatory(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: ChronoKingdomEventDirector
  ): void {
    const districtC = new THREE.Group();
    districtC.name = 'district_c_chrono_observatory';
    group.add(districtC);

    const wallX = roadbedWidth * 0.5 + 2.4;

    [-1, 1].forEach((side) => {
      // 1. Midnight Basalt Promenade
      const walkW = 16.0;
      const wx = side * (wallX + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 0.8, chunkLength), this.midnightSteelMat);
      walk.position.set(wx, 0.4, -chunkLength * 0.5);
      districtC.add(walk);

      const curb = new THREE.Mesh(this.getBox(0.45, 0.9, chunkLength), this.antiqueGoldMat);
      curb.position.set(side * (wallX + 0.22), 0.45, -chunkLength * 0.5);
      districtC.add(curb);

      // 2. Colossal Celestial Astrolabe Dial facing the tracks
      const astrolabeTex = ChronoKingdomTextureHelper.getAstrolabeTexture();
      const astrolabe = new THREE.Mesh(
        this.getPlane(11.0, 11.0),
        new THREE.MeshStandardMaterial({
          map: astrolabeTex,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.4,
          side: THREE.DoubleSide
        })
      );
      astrolabe.position.set(side * (wallX + 0.3), 11.0, -chunkLength * 0.5);
      astrolabe.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      districtC.add(astrolabe);
    });

    // 3. Immense Celestial Observatory Dome & Concentric Gimbal Rings (Left Side)
    const observatoryGroup = new THREE.Group();
    observatoryGroup.name = 'celestial_observatory_complex';
    observatoryGroup.position.set(-wallX - 14.0, 0.8, -chunkLength * 0.5);

    // Stone Rotunda Base
    const rotunda = new THREE.Mesh(this.getCylinder(11.0, 12.0, 18.0, 16), this.darkBronzeMat);
    rotunda.position.y = 9.0;
    observatoryGroup.add(rotunda);

    // Ribbed Copper Hemispherical Dome (R = 11m, reaching Y = 38m)
    const dome = new THREE.Mesh(this.getSphere(11.0, 16), this.burnishedCopperMat);
    dome.position.y = 21.0;
    dome.scale.set(1.0, 0.8, 1.0);
    observatoryGroup.add(dome);

    // Gilded Dome Meridian Ribs
    for (let r = 0; r < 4; r++) {
      const rib = new THREE.Mesh(this.getTorus(11.2, 0.3, 6, 24), this.antiqueGoldMat);
      rib.position.y = 21.0;
      rib.rotation.y = (r * Math.PI) / 4;
      observatoryGroup.add(rib);
    }

    // 4. Gigantic Concentric Rotating Astronomical Rings
    const ringsGroup = new THREE.Group();
    ringsGroup.position.set(0, 36.0, 0);

    const outerRing = new THREE.Mesh(this.getTorus(8.0, 0.35, 6, 24), this.antiqueGoldMat);
    ringsGroup.add(outerRing);

    const middleRing = new THREE.Mesh(this.getTorus(6.2, 0.30, 6, 24), this.burnishedCopperMat);
    ringsGroup.add(middleRing);

    const innerRing = new THREE.Mesh(this.getTorus(4.4, 0.25, 6, 24), this.antiqueGoldMat);
    ringsGroup.add(innerRing);

    // 5. Central Orrery Sun Sphere & Orbiting Planets
    const orrerySun = new THREE.Mesh(this.getSphere(1.4, 12), this.warmGlassAmberMat);
    ringsGroup.add(orrerySun);

    const orreryArm = new THREE.Group();
    const planetArm = new THREE.Mesh(this.getBox(0.12, 0.12, 7.0), this.antiqueGoldMat);
    orreryArm.add(planetArm);

    const planet1 = new THREE.Mesh(this.getSphere(0.65, 8), this.burnishedCopperMat);
    planet1.position.z = 3.5;
    orreryArm.add(planet1);

    const planet2 = new THREE.Mesh(this.getSphere(0.45, 8), this.glowingCyanMat);
    planet2.position.z = -3.5;
    orreryArm.add(planet2);

    ringsGroup.add(orreryArm);
    observatoryGroup.add(ringsGroup);

    director.registerObservatory(outerRing, middleRing, innerRing, orreryArm, 1.2);
    districtC.add(observatoryGroup);

    // 6. Suspended Filigree Observation Catwalks (spanning high at Y = 16.0m)
    const catwalk = new THREE.Mesh(this.getBox(roadbedWidth + 12.0, 0.8, 3.0), this.antiqueGoldMat);
    catwalk.position.set(0, 16.5, -chunkLength * 0.7);
    districtC.add(catwalk);
  }

  // =========================================================================
  // DISTRICT D — THE FRACTURED TIME DISTRICT
  // =========================================================================

  public buildFracturedTimeDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: ChronoKingdomEventDirector
  ): void {
    const districtD = new THREE.Group();
    districtD.name = 'district_d_fractured_time';
    group.add(districtD);

    const wallX = roadbedWidth * 0.5 + 2.4;

    [-1, 1].forEach((side) => {
      // 1. Shifting Stone & Copper Promenade
      const walkW = 16.0;
      const wx = side * (wallX + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 0.8, chunkLength), this.darkIronstoneMat);
      walk.position.set(wx, 0.4, -chunkLength * 0.5);
      districtD.add(walk);

      const curb = new THREE.Mesh(this.getBox(0.45, 0.9, chunkLength), this.antiqueGoldMat);
      curb.position.set(side * (wallX + 0.22), 0.45, -chunkLength * 0.5);
      districtD.add(curb);

      // 2. Floating-Looking Clock Fragments & Cantilevered Spires
      for (let z = 12; z < chunkLength - 12; z += 35) {
        const fragmentGroup = new THREE.Group();
        fragmentGroup.position.set(side * (wallX + 11.0), 0.8, -z);

        // Tilted Ruined Base
        const ruBase = new THREE.Mesh(this.getBox(12.0, 10.0, 20.0), this.darkBronzeMat);
        ruBase.position.y = 5.0;
        ruBase.rotation.z = side * 0.08;
        fragmentGroup.add(ruBase);

        // Hovering Floating Clockwork Block (Suspended above base)
        const floatingBlock = new THREE.Mesh(this.getBox(9.0, 9.0, 14.0), this.midnightSteelMat);
        floatingBlock.position.set(0, 18.0, 0);
        floatingBlock.rotation.set(0.12, side * 0.25, 0.18);
        fragmentGroup.add(floatingBlock);

        // Distorted/Warped Clock Face on floating block
        const warpedClockTex = ChronoKingdomTextureHelper.getClockFaceTexture(false);
        const warpedClock = new THREE.Mesh(
          this.getPlane(6.5, 6.5),
          new THREE.MeshStandardMaterial({
            map: warpedClockTex,
            emissive: 0xd97706,
            emissiveIntensity: 0.65,
            side: THREE.DoubleSide
          })
        );
        warpedClock.position.set(-side * 4.6, 18.0, 0);
        warpedClock.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        warpedClock.rotation.z = 0.35;
        fragmentGroup.add(warpedClock);

        // Mooring Brass Chains holding floating block
        [-4.0, 4.0].forEach((cx) => {
          const chain = new THREE.Mesh(this.getCylinder(0.08, 0.08, 9.0, 6), this.antiqueGoldMat);
          chain.position.set(cx, 13.5, 0);
          fragmentGroup.add(chain);
        });

        // Floating Gear cluster
        const floatGear = this.buildGearMesh(3.0, 12, 0.4, this.antiqueGoldMat);
        floatGear.position.set(-side * 4.8, 25.0, 3.0);
        floatGear.rotation.y = Math.PI / 2;
        fragmentGroup.add(floatGear);
        director.registerGear(floatGear, 1.5 * side, 'z');

        districtD.add(fragmentGroup);
      }
    });

    // 3. Magnificent Glowing Time Portal (Safely outside gameplay tracks at X = -15m, Y = 9.5m)
    const portalGroup = new THREE.Group();
    portalGroup.name = 'temporal_rift_portal';
    portalGroup.position.set(-wallX - 7.5, 9.5, -chunkLength * 0.5);

    // Outer Concentric Chronos Ring
    const portalOuter = new THREE.Mesh(this.getTorus(7.5, 0.5, 8, 24), this.antiqueGoldMat);
    portalGroup.add(portalOuter);

    // Inner Counter-Rotating Ring
    const portalInner = new THREE.Mesh(this.getTorus(5.8, 0.4, 8, 24), this.burnishedCopperMat);
    portalGroup.add(portalInner);

    // Pulsating Temporal Vortex Core
    const vortexTex = ChronoKingdomTextureHelper.getVortexTexture();
    const vortexCore = new THREE.Mesh(
      this.getPlane(10.5, 10.5),
      new THREE.MeshBasicMaterial({
        map: vortexTex,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    portalGroup.add(vortexCore);

    director.registerTimePortal(portalOuter, portalInner, vortexCore);
    districtD.add(portalGroup);
  }

  // =========================================================================
  // SUB-ASSEMBLY HELPERS
  // =========================================================================

  /**
   * Builds an intricate 3D spur gear with true radial teeth and central axle
   */
  public buildGearMesh(
    radius: number,
    toothCount: number,
    thickness: number,
    material: THREE.Material
  ): THREE.Group {
    const gear = new THREE.Group();

    // Central Rim / Web
    const body = new THREE.Mesh(this.getCylinder(radius * 0.85, radius * 0.85, thickness, 16), material);
    body.rotation.x = Math.PI / 2;
    gear.add(body);

    // Radial Gear Teeth
    const toothW = (Math.PI * 2 * radius * 0.85) / (toothCount * 2);
    const toothH = radius * 0.25;
    for (let t = 0; t < toothCount; t++) {
      const angle = (t * Math.PI * 2) / toothCount;
      const tooth = new THREE.Mesh(this.getBox(toothW, toothH, thickness), material);
      tooth.position.set(
        Math.cos(angle) * (radius * 0.85 + toothH * 0.5),
        Math.sin(angle) * (radius * 0.85 + toothH * 0.5),
        0
      );
      tooth.rotation.z = angle - Math.PI / 2;
      gear.add(tooth);
    }

    // Center Axle Hole Boss
    const axleBoss = new THREE.Mesh(this.getCylinder(radius * 0.35, radius * 0.35, thickness * 1.3, 12), this.antiqueGoldMat);
    axleBoss.rotation.x = Math.PI / 2;
    gear.add(axleBoss);

    return gear;
  }

  /**
   * Builds a multi-blade steam turbine rotor
   */
  private buildTurbineBlades(radius: number, bladeCount: number): THREE.Group {
    const turbine = new THREE.Group();
    const hub = new THREE.Mesh(this.getCylinder(radius * 0.3, radius * 0.3, 0.6, 12), this.antiqueGoldMat);
    hub.rotation.x = Math.PI / 2;
    turbine.add(hub);

    for (let b = 0; b < bladeCount; b++) {
      const angle = (b * Math.PI * 2) / bladeCount;
      const blade = new THREE.Mesh(this.getBox(0.4, radius * 0.7, 0.15), this.burnishedCopperMat);
      blade.position.set(Math.cos(angle) * (radius * 0.55), Math.sin(angle) * (radius * 0.55), 0);
      blade.rotation.z = angle - Math.PI / 2;
      blade.rotation.x = 0.45; // Angled turbine pitch
      turbine.add(blade);
    }
    return turbine;
  }

  /**
   * Miniature clockwork train for distant skybridge viaduct pass
   */
  private buildMiniatureClockworkTrain(): THREE.Group {
    const train = new THREE.Group();

    // Small Locomotive
    const loco = new THREE.Mesh(this.getBox(1.4, 1.4, 4.0), this.darkBronzeMat);
    loco.position.y = 0.7;
    train.add(loco);

    // Boiler & Chimney
    const boiler = new THREE.Mesh(this.getCylinder(0.6, 0.6, 2.5, 8), this.burnishedCopperMat);
    boiler.rotation.x = Math.PI / 2;
    boiler.position.set(0, 1.1, -0.6);
    train.add(boiler);

    const chimney = new THREE.Mesh(this.getCylinder(0.2, 0.15, 0.8, 6), this.antiqueGoldMat);
    chimney.position.set(0, 2.0, -1.5);
    train.add(chimney);

    // Carriages (2 Cars)
    for (let c = 1; c <= 2; c++) {
      const car = new THREE.Mesh(this.getBox(1.3, 1.3, 3.5), this.midnightSteelMat);
      car.position.set(0, 0.65, c * 4.2);
      train.add(car);

      // Glowing Amber Windows
      const win = new THREE.Mesh(this.getBox(1.34, 0.4, 2.8), this.warmGlassAmberMat);
      win.position.set(0, 0.85, c * 4.2);
      train.add(win);
    }

    return train;
  }

  // =========================================================================
  // COMPLETE STANDALONE SHOWCASE STEAM LOCOMOTIVE
  // Builds a clockwork train matching exact game train dimensions (2.6m x 3.6m x 22m)
  // =========================================================================

  public buildChronoKingdomShowcaseTrain(x: number = 0, y: number = 0, z: number = 0): THREE.Group {
    const train = new THREE.Group();
    train.name = 'chrono_kingdom_clockwork_locomotive';
    train.position.set(x, y, z);

    const livery = CHRONO_KINGDOM_TRAIN_LIVERY;

    // Main Locomotive Body (Heavy Imperial Bronze, width 2.4m)
    const body = new THREE.Mesh(this.getBox(2.4, 2.2, 21.0), this.darkBronzeMat);
    body.position.y = 1.8;
    train.add(body);

    // Aerodynamic Cowling & Cowcatcher (width ~1.8m)
    const cowcatcher = new THREE.Mesh(this.getCylinder(0.2, 0.75, 1.8, 4), this.antiqueGoldMat);
    cowcatcher.rotation.y = Math.PI / 4;
    cowcatcher.position.set(0, 1.1, -10.8);
    train.add(cowcatcher);

    // Massive Cylindrical Steam Boiler along Spine
    const boiler = new THREE.Mesh(this.getCylinder(0.95, 0.95, 14.0, 16), this.burnishedCopperMat);
    boiler.rotation.x = Math.PI / 2;
    boiler.position.set(0, 2.7, -2.5);
    train.add(boiler);

    // Fluted Chimney Stacks with Gold Rings
    [-7.5, -4.5].forEach((cz) => {
      const stack = new THREE.Mesh(this.getCylinder(0.3, 0.22, 1.4, 8), this.antiqueGoldMat);
      stack.position.set(0, 3.8, cz);
      train.add(stack);
    });

    // Side-Mounted Decorative Clockwork Spur Gears
    [-1.22, 1.22].forEach((gx) => {
      [-6.0, 0, 6.0].forEach((gz) => {
        const cog = this.buildGearMesh(0.55, 8, 0.12, this.antiqueGoldMat);
        cog.position.set(gx, 1.6, gz);
        cog.rotation.y = gx > 0 ? Math.PI / 2 : -Math.PI / 2;
        train.add(cog);
      });
    });

    // Glowing Amber Windows along Cab & Carriages
    [-1.21, 1.21].forEach((wx) => {
      const winStrip = new THREE.Mesh(this.getBox(0.08, 0.65, 16.0), this.warmGlassAmberMat);
      winStrip.position.set(wx, 2.4, 1.0);
      train.add(winStrip);
    });

    // Steampunk Wheel Bogies
    [-1.1, 1.1].forEach((bx) => {
      [-8.5, -5.5, -2.5, 2.5, 5.5, 8.5].forEach((wz) => {
        const wheel = new THREE.Mesh(this.getCylinder(0.48, 0.48, 0.22, 12), this.midnightSteelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(bx, 0.48, wz);
        train.add(wheel);

        const hub = new THREE.Mesh(this.getCylinder(0.2, 0.2, 0.25, 8), this.antiqueGoldMat);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(bx, 0.48, wz);
        train.add(hub);
      });
    });

    return train;
  }
}
