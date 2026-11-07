import * as THREE from 'three';
import { SeededRandom } from '../../SceneryFactory';
import { CurvedShaderManager } from '../../../scene/CurvedShader';
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

    // Solid dark bronze rim fill to eliminate transparent edge artifacts
    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, 0, size, size);

    // Antique aged parchment dial background with radial vignette
    const bgGrad = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.1, size * 0.5, size * 0.5, size * 0.48);
    bgGrad.addColorStop(0, '#fef9c3');
    bgGrad.addColorStop(0.65, '#fde68a');
    bgGrad.addColorStop(0.92, '#d97706');
    bgGrad.addColorStop(1.0, '#451a03');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.48, 0, Math.PI * 2);
    ctx.fill();

    // Outer Gilded Bezel Rings
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.47, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.44, 0, Math.PI * 2);
    ctx.stroke();

    // Roman Numerals
    const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    ctx.fillStyle = '#1c0f04';
    ctx.font = 'bold 38px "Cinzel", "Georgia", "Times New Roman", serif';
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
      ctx.strokeStyle = isHour ? '#1c0f04' : '#92400e';
      ctx.lineWidth = isHour ? 3.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(size * 0.5 + Math.cos(angle) * rInner, size * 0.5 + Math.sin(angle) * rInner);
      ctx.lineTo(size * 0.5 + Math.cos(angle) * rOuter, size * 0.5 + Math.sin(angle) * rOuter);
      ctx.stroke();
    }

    // Ornate Center Boss & Escapement Star
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, 26, 0, Math.PI * 2);
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

    // Deep midnight slate backing to prevent unpainted transparent edges
    ctx.fillStyle = '#060d19';
    ctx.fillRect(0, 0, size, size);

    // Inner dial radial gradient disk
    const discGrad = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.05, size * 0.5, size * 0.5, size * 0.48);
    discGrad.addColorStop(0, '#172554');
    discGrad.addColorStop(0.7, '#0c1b33');
    discGrad.addColorStop(1.0, '#060d19');
    ctx.fillStyle = discGrad;
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

    // Cast iron / dark bronze backing
    ctx.fillStyle = '#261b14';
    ctx.fillRect(0, 0, size, size);

    // Dial background
    ctx.fillStyle = '#fef3c7';
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
 * - Deep grounding: all plinths extend to Y <= -5.65m (zero floating geometry).
 * - 4 distinct architectural districts with unmistakable identities.
 */
export class ChronoKingdomWorldBuilder {
  private static instance: ChronoKingdomWorldBuilder | null = null;

  // Geometry Cache
  private geoCache = new Map<string, THREE.BufferGeometry>();

  // Shared Master Materials (Authentic Victorian Steampunk Palette)
  private darkBronzeMat: THREE.MeshStandardMaterial;
  private antiqueGoldMat: THREE.MeshStandardMaterial;
  private burnishedCopperMat: THREE.MeshStandardMaterial;
  private midnightSteelMat: THREE.MeshStandardMaterial;
  private agedBrassMat: THREE.MeshStandardMaterial;
  private warmGlassAmberMat: THREE.MeshStandardMaterial;
  private furnaceFireMat: THREE.MeshStandardMaterial;
  private darkIronstoneMat: THREE.MeshStandardMaterial;
  private steamedOakMat: THREE.MeshStandardMaterial;
  private glowingCyanMat: THREE.MeshBasicMaterial;
  private steamPuffMat: THREE.MeshBasicMaterial;

  private constructor() {
    // 1. Heavy Victorian Architectural Bronze (rich metallic luster)
    this.darkBronzeMat = new THREE.MeshStandardMaterial({
      color: 0x6e472a,
      metalness: 0.35,
      roughness: 0.45
    });

    // 2. Polished Clockmaker's Antique Gold
    this.antiqueGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.75,
      roughness: 0.28
    });

    // 3. Radiant Burnished Copper
    this.burnishedCopperMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.45,
      roughness: 0.35
    });

    // 4. Blued Midnight Steel
    this.midnightSteelMat = new THREE.MeshStandardMaterial({
      color: 0x243044,
      metalness: 0.35,
      roughness: 0.40
    });

    // 5. Ornate Aged Mechanical Brass
    this.agedBrassMat = new THREE.MeshStandardMaterial({
      color: 0xc59b3f,
      metalness: 0.50,
      roughness: 0.32
    });

    // 6. Glowing Backlit Amber Glass & Lanterns
    this.warmGlassAmberMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      metalness: 0.25,
      roughness: 0.20,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.5
    });

    // 7. Smelting Furnace Molten Fire
    this.furnaceFireMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xef4444,
      emissiveIntensity: 1.8,
      roughness: 0.30
    });

    // 8. Weathered Dark Ironstone Masonry
    this.darkIronstoneMat = new THREE.MeshStandardMaterial({
      color: 0x473c35,
      roughness: 0.75,
      metalness: 0.15
    });

    // 9. Polished Dark Mahogany / Steamed Industrial Timber
    this.steamedOakMat = new THREE.MeshStandardMaterial({
      color: 0x54321c,
      roughness: 0.60,
      metalness: 0.10
    });

    // 10. Glowing Celestial Cyan / Temporal Energy
    this.glowingCyanMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8
    });

    // 11. Atmospheric Steam Exhaust Plume
    this.steamPuffMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.60
    });

    // Apply track curvature shader to all materials
    const curved = CurvedShaderManager.getInstance();
    [
      this.darkBronzeMat,
      this.antiqueGoldMat,
      this.burnishedCopperMat,
      this.midnightSteelMat,
      this.agedBrassMat,
      this.warmGlassAmberMat,
      this.furnaceFireMat,
      this.darkIronstoneMat,
      this.steamedOakMat,
      this.glowingCyanMat,
      this.steamPuffMat
    ].forEach((mat) => curved.applyCurvature(mat));
  }

  public createStandardMaterial(params: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
    const mat = new THREE.MeshStandardMaterial(params);
    CurvedShaderManager.getInstance().applyCurvature(mat);
    return mat;
  }

  public createBasicMaterial(params: THREE.MeshBasicMaterialParameters): THREE.MeshBasicMaterial {
    const mat = new THREE.MeshBasicMaterial(params);
    CurvedShaderManager.getInstance().applyCurvature(mat);
    return mat;
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

  private getCylinder(rt: number, rb: number, h: number, s: number = 8): THREE.CylinderGeometry {
    const key = `cyl_${rt}_${rb}_${h}_${s}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.CylinderGeometry(rt, rb, h, s));
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

  private getCircle(r: number, s: number = 32): THREE.CircleGeometry {
    const key = `circle_${r}_${s}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.CircleGeometry(r, s));
    }
    return this.geoCache.get(key) as THREE.CircleGeometry;
  }

  private getSphere(r: number, s: number = 12): THREE.SphereGeometry {
    const key = `sphere_${r}_${s}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.SphereGeometry(r, s, s));
    }
    return this.geoCache.get(key) as THREE.SphereGeometry;
  }

  private getTorus(r: number, tube: number, radSegs: number = 8, tubSegs: number = 16): THREE.TorusGeometry {
    const key = `torus_${r}_${tube}_${radSegs}_${tubSegs}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.TorusGeometry(r, tube, radSegs, tubSegs));
    }
    return this.geoCache.get(key) as THREE.TorusGeometry;
  }

  /**
   * Procedural Cog/Gear Generator with central hub, spoke cutouts, and teeth
   */
  public buildGearMesh(
    radius: number,
    numTeeth: number = 12,
    thickness: number = 0.35,
    material: THREE.Material = this.antiqueGoldMat
  ): THREE.Group {
    const gearGroup = new THREE.Group();

    // Central Rim
    const rim = new THREE.Mesh(this.getCylinder(radius, radius, thickness, Math.max(12, numTeeth * 2)), material);
    rim.rotation.x = Math.PI / 2;
    gearGroup.add(rim);

    // Central Hub Boss
    const hub = new THREE.Mesh(this.getCylinder(radius * 0.32, radius * 0.32, thickness * 1.3, 10), material);
    hub.rotation.x = Math.PI / 2;
    gearGroup.add(hub);

    // Axle Shaft Bore
    const bore = new THREE.Mesh(this.getCylinder(radius * 0.12, radius * 0.12, thickness * 1.4, 8), this.midnightSteelMat);
    bore.rotation.x = Math.PI / 2;
    gearGroup.add(bore);

    // Gear Teeth along circumference
    const toothW = (Math.PI * 2 * radius) / (numTeeth * 2.3);
    const toothH = radius * 0.22;
    const toothGeo = this.getBox(toothW, toothH, thickness);

    for (let t = 0; t < numTeeth; t++) {
      const angle = (t * Math.PI * 2) / numTeeth;
      const tooth = new THREE.Mesh(toothGeo, material);
      tooth.position.set(Math.cos(angle) * (radius + toothH * 0.4), Math.sin(angle) * (radius + toothH * 0.4), 0);
      tooth.rotation.z = angle;
      gearGroup.add(tooth);
    }

    return gearGroup;
  }

  // =========================================================================
  // MAIN ENTRY POINT: BUILD DISTRICT SCENERY
  // =========================================================================

  public buildDistrictScenery(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZIn: number = 0
  ): void {
    const rng = new SeededRandom(seed);
    const director = ChronoKingdomEventDirector.getInstance();

    let districtIndex: number;
    if (worldZIn !== 0 && Number.isFinite(worldZIn)) {
      districtIndex = Math.floor(Math.abs(worldZIn) / 400) % 4;
    } else if (seed >= 0 && seed < 4) {
      districtIndex = seed;
    } else if (group.parent && typeof group.parent.position?.z === 'number' && Number.isFinite(group.parent.position.z)) {
      districtIndex = Math.floor(Math.abs(group.parent.position.z) / 400) % 4;
    } else {
      districtIndex = Math.floor(Math.abs(seed) / 4) % 4;
    }

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

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    [-1, 1].forEach((side) => {
      // 1. Continuous Deep Sidewalk Promenade down to Y = -5.65m (ZERO FLOATING SCENERY)
      const walkW = 24.0;
      const walkDepth = 6.0;
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, walkDepth, chunkLength), this.darkIronstoneMat);
      walk.position.set(wx, 0.35 - walkDepth * 0.5, -chunkLength * 0.5);
      districtA.add(walk);

      // Ornate Gilded Brass Curb Strip (high-contrast track boundary)
      const curb = new THREE.Mesh(this.getBox(0.48, walkDepth + 0.1, chunkLength), this.antiqueGoldMat);
      curb.position.set(side * (curbEdge + 0.24), 0.38 - walkDepth * 0.5, -chunkLength * 0.5);
      districtA.add(curb);

      // Sidewalk Art Deco Geometric Gold Diamond Inlays
      for (let iz = 10; iz < chunkLength - 5; iz += 14) {
        const diamond = new THREE.Mesh(this.getBox(1.5, 0.04, 1.5), this.antiqueGoldMat);
        diamond.rotation.y = Math.PI * 0.25;
        diamond.position.set(side * (curbEdge + 2.8), 0.36, -iz);
        districtA.add(diamond);
      }

      // Victorian Gaslight / Clockwork Streetlamps with Glowing Amber Lanterns along curb
      for (let z = 10; z < chunkLength - 10; z += 18) {
        const lampGroup = new THREE.Group();
        lampGroup.position.set(side * (curbEdge + 1.2), 0.35, -z);

        // Fluted Brass Post
        const post = new THREE.Mesh(this.getCylinder(0.12, 0.18, 3.8, 8), this.antiqueGoldMat);
        post.position.y = 1.9;
        lampGroup.add(post);

        // Post Base Pedestal
        const postBase = new THREE.Mesh(this.getBox(0.6, 0.8, 0.6), this.darkBronzeMat);
        postBase.position.y = 0.4;
        lampGroup.add(postBase);

        // Ornamental Scrolling Bracket Arm
        const bracket = new THREE.Mesh(this.getTorus(0.4, 0.05, 6, 12), this.antiqueGoldMat);
        bracket.position.set(0, 3.7, 0);
        lampGroup.add(bracket);

        // Hexagonal Lantern Housing with Glowing Amber Core
        const lanternHousing = new THREE.Mesh(this.getCylinder(0.35, 0.25, 0.7, 6), this.burnishedCopperMat);
        lanternHousing.position.y = 4.1;
        lampGroup.add(lanternHousing);

        const lanternGlow = new THREE.Mesh(this.getCylinder(0.28, 0.20, 0.55, 6), this.warmGlassAmberMat);
        lanternGlow.position.y = 4.1;
        lampGroup.add(lanternGlow);

        districtA.add(lampGroup);

        // Decorative Wrought-Iron & Brass Cog Railing between lamps
        if (detail !== 'MINIMAL') {
          const railSegment = new THREE.Mesh(this.getBox(0.08, 0.9, 12.0), this.midnightSteelMat);
          railSegment.position.set(side * (curbEdge + 0.8), 0.75, -z - 9);
          districtA.add(railSegment);

          const railCog = this.buildGearMesh(0.45, 8, 0.08, this.antiqueGoldMat);
          railCog.position.set(side * (curbEdge + 0.8), 0.75, -z - 9);
          railCog.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          districtA.add(railCog);
        }
      }

      // 2. HERO LANDMARK: GRAND CLOCKWORK PALACE & HOROLOGIUM CATHEDRALS
      // Positioned at X = +/- 13.0m (strictly clear of |X| <= 4.2m)
      for (let z = 16; z < chunkLength - 16; z += 42) {
        const towerGroup = new THREE.Group();
        towerGroup.position.set(side * (curbEdge + 6.5), 0.35, -z);

        // Subterranean Rusticated Plinth down to Y = -5.65m
        const plinth = new THREE.Mesh(this.getBox(14.0, 6.0, 26.0), this.darkBronzeMat);
        plinth.position.set(side * 1.5, -3.0, 0);
        towerGroup.add(plinth);

        // TIER 1: Grand Vaulted Clockwork Atrium (Y = 0 to 14m)
        const mainHall = new THREE.Mesh(this.getBox(10.0, 13.0, 24.0), this.darkBronzeMat);
        mainHall.position.set(side * 1.5, 6.5, 0);
        towerGroup.add(mainHall);

        // Open Victorian Colonnade with Fluted Gold Columns along front promenade line
        [-9.0, -3.0, 3.0, 9.0].forEach((colZ) => {
          const col = new THREE.Mesh(this.getCylinder(0.55, 0.75, 13.0, 10), this.antiqueGoldMat);
          col.position.set(-side * 4.8, 6.5, colZ);
          towerGroup.add(col);

          const cap = new THREE.Mesh(this.getBox(1.5, 0.8, 1.5), this.antiqueGoldMat);
          cap.position.set(-side * 4.8, 13.0, colZ);
          towerGroup.add(cap);
        });

        [-6.0, 0, 6.0].forEach((archZ) => {
          const arch = new THREE.Mesh(this.getBox(0.6, 1.2, 5.8), this.burnishedCopperMat);
          arch.position.set(-side * 4.8, 12.4, archZ);
          towerGroup.add(arch);
        });

        // Center Bay: Recessed Illuminated Clockwork Vault Chamber Aperture
        const vaultPortal = new THREE.Mesh(this.getBox(0.8, 9.0, 5.4), this.warmGlassAmberMat);
        vaultPortal.position.set(-side * 3.5, 5.5, 0);
        towerGroup.add(vaultPortal);

        // Inside Vault: Working Swinging Pendulum
        const pendulumPivot = new THREE.Group();
        pendulumPivot.position.set(-side * 4.6, 11.5, 0);

        const pendulumShaft = new THREE.Mesh(this.getCylinder(0.10, 0.10, 7.5, 8), this.antiqueGoldMat);
        pendulumShaft.position.y = -3.75;
        pendulumPivot.add(pendulumShaft);

        const pendulumBob = new THREE.Mesh(this.getCylinder(1.4, 1.4, 0.45, 16), this.antiqueGoldMat);
        pendulumBob.position.y = -7.5;
        pendulumBob.rotation.x = Math.PI / 2;
        pendulumPivot.add(pendulumBob);

        const bobBoss = new THREE.Mesh(this.getCylinder(0.45, 0.45, 0.55, 10), this.burnishedCopperMat);
        bobBoss.position.y = -7.5;
        bobBoss.rotation.x = Math.PI / 2;
        pendulumPivot.add(bobBoss);

        towerGroup.add(pendulumPivot);
        director.registerGear(pendulumPivot, 0.9 * side, 'z');

        // Side Bays: Warm Stained Glass Windows & Exposed Brass Gear Sets
        [-6.0, 6.0].forEach((wz) => {
          const win = new THREE.Mesh(this.getBox(0.8, 7.5, 4.0), this.warmGlassAmberMat);
          win.position.set(-side * 3.5, 5.5, wz);
          towerGroup.add(win);

          const wallGear = this.buildGearMesh(1.4, 10, 0.22, this.antiqueGoldMat);
          wallGear.position.set(-side * 4.6, 7.0, wz);
          wallGear.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          towerGroup.add(wallGear);
          director.registerGear(wallGear, -1.2 * side, 'z');
        });

        // TIER 2: Victorian Bay Windows & Interconnected Gear Train (Y = 13m to 27m)
        const midHousing = new THREE.Mesh(this.getBox(9.0, 14.0, 20.0), this.midnightSteelMat);
        midHousing.position.set(side * 1.5, 20.0, 0);
        towerGroup.add(midHousing);

        // Gilded Decorative Cornice separating Tier 1 and Tier 2
        const cornice1 = new THREE.Mesh(this.getBox(13.0, 0.9, 24.8), this.antiqueGoldMat);
        cornice1.position.set(side * 1.5, 13.0, 0);
        towerGroup.add(cornice1);

        // Two Arched Bay Windows with Warm Amber Glowing Glass
        [-5.5, 5.5].forEach((wz) => {
          const bayWin = new THREE.Mesh(this.getBox(1.2, 7.0, 4.0), this.warmGlassAmberMat);
          bayWin.position.set(-side * 3.8, 19.5, wz);
          towerGroup.add(bayWin);

          const bayFrame = new THREE.Mesh(this.getBox(1.4, 7.4, 4.4), this.burnishedCopperMat);
          bayFrame.position.set(-side * 3.75, 19.5, wz);
          towerGroup.add(bayFrame);
        });

        // MONUMENTAL INTERCONNECTED GEAR CASCADE (Flanking the central clock face!)
        // Gear 1: Big Drive Gear (R = 3.2m, 16 teeth, Gold)
        const gear1 = this.buildGearMesh(3.2, 16, 0.45, this.antiqueGoldMat);
        gear1.position.set(-side * 4.2, 16.5, -5.8);
        gear1.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        towerGroup.add(gear1);
        director.registerGear(gear1, 0.6 * side, 'z');

        // Gear 2: Driven Secondary Gear (R = 2.2m, 11 teeth, Copper) - meshed above gear 1
        const gear2 = this.buildGearMesh(2.2, 11, 0.4, this.burnishedCopperMat);
        gear2.position.set(-side * 4.2, 21.5, -5.8);
        gear2.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        towerGroup.add(gear2);
        director.registerGear(gear2, -0.9 * side, 'z');

        // Gear 3: Escapement Pinion on opposite flank (R = 1.8m, 9 teeth, Brass)
        const gear3 = this.buildGearMesh(1.8, 9, 0.35, this.agedBrassMat);
        gear3.position.set(-side * 4.2, 18.5, 5.8);
        gear3.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        towerGroup.add(gear3);
        director.registerGear(gear3, 1.4 * side, 'z');

        // TIER 3: The Monumental Clock Belfry (Y = 27m to 39m)
        const belfryCornice = new THREE.Mesh(this.getBox(11.5, 0.8, 21.2), this.antiqueGoldMat);
        belfryCornice.position.set(side * 1.5, 27.0, 0);
        towerGroup.add(belfryCornice);

        const clockBelfry = new THREE.Mesh(this.getBox(9.0, 12.0, 16.0), this.midnightSteelMat);
        clockBelfry.position.set(side * 1.5, 33.0, 0);
        towerGroup.add(clockBelfry);

        // Monumental Clock Dial with Roman Numerals (8.0m diameter at eye-visible Y = 18m!)
        const clockTex = ChronoKingdomTextureHelper.getClockFaceTexture(true);
        const clockMesh = new THREE.Mesh(
          this.getCircle(4.0, 32),
          this.createStandardMaterial({
            map: clockTex,
            roughness: 0.25,
            metalness: 0.35,
            emissive: 0xd97706,
            emissiveIntensity: 0.45,
            side: THREE.DoubleSide
          })
        );
        clockMesh.position.set(-side * 3.8, 18.0, 0);
        clockMesh.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        towerGroup.add(clockMesh);

        // Gilded Bezel Ring Framing the Clock Face
        const clockBezel = new THREE.Mesh(this.getTorus(4.05, 0.22, 8, 32), this.antiqueGoldMat);
        clockBezel.position.set(-side * 3.82, 18.0, 0);
        clockBezel.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        towerGroup.add(clockBezel);

        // Ticking Animated Clock Hands (Hour & Minute hands)
        const hourHandGroup = new THREE.Group();
        hourHandGroup.position.set(-side * 3.85, 18.0, 0);
        hourHandGroup.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        const hourHandMesh = new THREE.Mesh(this.getBox(0.28, 2.6, 0.08), this.darkBronzeMat);
        hourHandMesh.position.y = 1.0;
        hourHandGroup.add(hourHandMesh);
        towerGroup.add(hourHandGroup);
        director.registerGear(hourHandGroup, 0.05 * side, 'z');

        const minuteHandGroup = new THREE.Group();
        minuteHandGroup.position.set(-side * 3.87, 18.0, 0);
        minuteHandGroup.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        const minHandMesh = new THREE.Mesh(this.getBox(0.18, 3.6, 0.08), this.antiqueGoldMat);
        minHandMesh.position.y = 1.5;
        minuteHandGroup.add(minHandMesh);
        towerGroup.add(minuteHandGroup);
        director.registerGear(minuteHandGroup, 0.6 * side, 'z');

        // Belfry Hammer on top of clock face
        const hammer = new THREE.Mesh(this.getBox(0.35, 2.2, 0.35), this.antiqueGoldMat);
        hammer.position.set(-side * 3.9, 22.4, 0);
        towerGroup.add(hammer);

        // Resonance Soundwave Rings expanding from clock center
        const resonanceRings: THREE.Mesh[] = [];
        for (let r = 0; r < 2; r++) {
          const resRing = new THREE.Mesh(
            this.getTorus(4.1, 0.12, 6, 24),
            new THREE.MeshBasicMaterial({
              color: 0xfde047,
              transparent: true,
              opacity: 0,
              depthWrite: false
            })
          );
          resRing.position.set(-side * 3.9, 18.0, 0);
          resRing.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          towerGroup.add(resRing);
          resonanceRings.push(resRing);
        }
        director.registerClockChime(clockMesh, hammer, resonanceRings, 10.0);

        // TIER 4: Steampunk Verdigris Mansard Spire (Y = 39m to 56m)
        const roof = new THREE.Mesh(this.getCylinder(0.4, 5.5, 12.0, 8), this.burnishedCopperMat);
        roof.position.set(side * 1.5, 45.0, 0);
        towerGroup.add(roof);

        // Gilded Spire Needle & Spinning Anemometer
        const spire = new THREE.Mesh(this.getCylinder(0.1, 0.35, 9.0, 6), this.antiqueGoldMat);
        spire.position.set(side * 1.5, 55.0, 0);
        towerGroup.add(spire);

        districtA.add(towerGroup);
      }
    });

    // 3. High Overhead Mechanical Skybridge & Viaduct (spanning above at Y = 16.5m)
    // Strictly clear of running corridor (Y >= 15.0m vs Y <= 8.5m)
    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = 'clockwork_skybridge_viaduct';
    bridgeGroup.position.set(0, 16.5, -chunkLength * 0.5);

    const leftSpan = new THREE.Mesh(this.getBox(12.0, 1.8, 4.5), this.burnishedCopperMat);
    leftSpan.position.set(-curbEdge - 6.0, 0, 0);
    bridgeGroup.add(leftSpan);

    const rightSpan = new THREE.Mesh(this.getBox(12.0, 1.8, 4.5), this.burnishedCopperMat);
    rightSpan.position.set(curbEdge + 6.0, 0, 0);
    bridgeGroup.add(rightSpan);

    const centerArch = new THREE.Mesh(this.getTorus(curbEdge + 4.0, 0.55, 6, 24), this.antiqueGoldMat);
    centerArch.rotation.x = Math.PI / 2;
    bridgeGroup.add(centerArch);

    director.registerRetractableBridge(bridgeGroup, leftSpan, rightSpan, 1.8);
    districtA.add(bridgeGroup);

    // 4. Distant Clockwork Steam Tram Traversing the Skybridge
    const tram = this.buildSkybridgeClockworkTram(-curbEdge - 15.0, 18.2, -chunkLength * 0.5);
    director.registerSkybridgeTrain(tram, 12.0, -curbEdge - 28.0, curbEdge + 28.0);
    districtA.add(tram);
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

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    [-1, 1].forEach((side) => {
      // 1. Heavy Scorched Iron Foundry Promenade (Solid depth down to Y = -5.65m)
      const walkW = 24.0;
      const walkDepth = 6.0;
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, walkDepth, chunkLength), this.steamedOakMat);
      walk.position.set(wx, 0.35 - walkDepth * 0.5, -chunkLength * 0.5);
      districtB.add(walk);

      // Burnished Copper Curb Trim
      const curb = new THREE.Mesh(this.getBox(0.48, walkDepth + 0.1, chunkLength), this.burnishedCopperMat);
      curb.position.set(side * (curbEdge + 0.24), 0.38 - walkDepth * 0.5, -chunkLength * 0.5);
      districtB.add(curb);

      // 2. Foundry Smelting Halls & Glowing Furnaces
      for (let z = 12; z < chunkLength - 12; z += 38) {
        const foundryHall = new THREE.Group();
        foundryHall.position.set(side * (curbEdge + 12.0), 0.35, -z);

        // Subterranean Cast-Iron Plinth down to Y = -5.65m
        const fPlinth = new THREE.Mesh(this.getBox(16.0, 6.0, 26.0), this.darkBronzeMat);
        fPlinth.position.set(side * 2.0, -3.0, 0);
        foundryHall.add(fPlinth);

        // Heavy Cast-Iron Foundation Base (shifted back so machinery sits proudly on facade!)
        const hallBase = new THREE.Mesh(this.getBox(12.0, 13.0, 24.0), this.darkBronzeMat);
        hallBase.position.set(side * 2.0, 6.5, 0);
        foundryHall.add(hallBase);

        // Glowing Smelting Furnace Arch with Fiery Molten Glow (Projecting from facade)
        const furnaceOpening = new THREE.Mesh(this.getBox(1.5, 7.5, 8.5), this.furnaceFireMat);
        furnaceOpening.position.set(-side * 4.1, 5.0, 0);
        foundryHall.add(furnaceOpening);

        const furnaceArch = new THREE.Mesh(this.getBox(1.8, 8.5, 9.5), this.darkIronstoneMat);
        furnaceArch.position.set(-side * 4.3, 5.5, 0);
        foundryHall.add(furnaceArch);

        // Steampunk Pressure Gauges on facade (Circular dial framed by brass bezel)
        const gaugeTex = ChronoKingdomTextureHelper.getPressureGaugeTexture();
        const gauge = new THREE.Mesh(
          this.getCircle(1.2, 24),
          this.createStandardMaterial({
            map: gaugeTex,
            roughness: 0.3,
            metalness: 0.4,
            emissive: 0xd97706,
            emissiveIntensity: 0.25,
            side: THREE.DoubleSide
          })
        );
        gauge.position.set(-side * 4.35, 10.5, 2.5);
        gauge.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        foundryHall.add(gauge);

        const gaugeBezel = new THREE.Mesh(this.getTorus(1.22, 0.12, 6, 24), this.antiqueGoldMat);
        gaugeBezel.position.set(-side * 4.38, 10.5, 2.5);
        gaugeBezel.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        foundryHall.add(gaugeBezel);

        // MONUMENTAL 14m HYDRAULIC DROP-FORGE STEAM PRESS (Standing proud on facade at z = -6.0)
        const pillar1 = new THREE.Mesh(this.getCylinder(0.35, 0.35, 14.0, 8), this.burnishedCopperMat);
        pillar1.position.set(-side * 4.8, 7.0, -7.2);
        foundryHall.add(pillar1);

        const pillar2 = new THREE.Mesh(this.getCylinder(0.35, 0.35, 14.0, 8), this.burnishedCopperMat);
        pillar2.position.set(-side * 4.8, 7.0, -4.8);
        foundryHall.add(pillar2);

        const crownBeam = new THREE.Mesh(this.getBox(1.5, 1.2, 3.2), this.antiqueGoldMat);
        crownBeam.position.set(-side * 4.8, 14.0, -6.0);
        foundryHall.add(crownBeam);

        const anvil = new THREE.Mesh(this.getBox(1.8, 2.0, 2.2), this.darkIronstoneMat);
        anvil.position.set(-side * 4.8, 1.0, -6.0);
        foundryHall.add(anvil);

        const dropHammer = new THREE.Mesh(this.getBox(1.4, 2.4, 1.8), this.midnightSteelMat);
        dropHammer.position.set(-side * 4.8, 7.0, -6.0);
        foundryHall.add(dropHammer);
        director.registerPiston(dropHammer, 7.0, 3.2, 3.0, 0);

        // MONUMENTAL 8m SPOKED FLYWHEEL & BEVEL GEAR (Spinning proud on facade at z = 6.0)
        const flywheel = this.buildGearMesh(4.0, 16, 0.45, this.antiqueGoldMat);
        flywheel.position.set(-side * 4.8, 9.0, 6.0);
        flywheel.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        foundryHall.add(flywheel);
        director.registerGear(flywheel, 1.4 * side, 'z');

        // 3. Timed Steam-Driven Pistons (Reciprocating on exterior gantry)
        const pistonBank = new THREE.Group();
        pistonBank.position.set(-side * 4.6, 13.0, -2.0);

        for (let p = 0; p < 3; p++) {
          const cylinderJacket = new THREE.Mesh(this.getCylinder(0.8, 0.8, 4.0, 8), this.darkBronzeMat);
          cylinderJacket.position.set(0, 2.0, p * 3.2);
          pistonBank.add(cylinderJacket);

          const pistonHead = new THREE.Mesh(this.getCylinder(0.55, 0.55, 1.2, 8), this.antiqueGoldMat);
          pistonHead.position.set(0, 4.0, p * 3.2);
          pistonBank.add(pistonHead);

          // Animated Steam Exhaust Plume
          const steamPlume = new THREE.Mesh(this.getSphere(0.7, 8), this.steamPuffMat);
          steamPlume.position.set(0, 5.2, p * 3.2);
          pistonBank.add(steamPlume);

          director.registerPiston(pistonHead, 4.0, 1.2, 2.5, p * 0.8, undefined, steamPlume);
        }
        foundryHall.add(pistonBank);

        // Gabled Verdigris Workshop Roof with Skylights
        const fRoof = new THREE.Mesh(this.getCylinder(0.3, 8.5, 5.0, 4), this.burnishedCopperMat);
        fRoof.position.set(side * 2.0, 15.5, 0);
        fRoof.rotation.y = Math.PI / 4;
        foundryHall.add(fRoof);

        // Industrial Smoke Stacks with Brass Rings
        for (let s = -6.0; s <= 6.0; s += 6.0) {
          const chimney = new THREE.Mesh(this.getCylinder(0.75, 0.95, 14.0, 8), this.darkIronstoneMat);
          chimney.position.set(side * 2.5, 20.0, s);
          foundryHall.add(chimney);

          const cRing = new THREE.Mesh(this.getCylinder(1.05, 1.05, 0.6, 8), this.antiqueGoldMat);
          cRing.position.set(side * 2.5, 26.5, s);
          foundryHall.add(cRing);
        }

        districtB.add(foundryHall);
      }

      // 4. Continuous Copper Steam Pipelines with Brass Joint Flanges along track
      const pipeX = side * (curbEdge + 1.8);
      const pipe = new THREE.Mesh(this.getCylinder(0.24, 0.24, chunkLength, 8), this.burnishedCopperMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(pipeX, 2.8, -chunkLength * 0.5);
      districtB.add(pipe);

      // Vertical Pipe Supports and Brass Expansion Loops
      for (let pz = 10; pz < chunkLength - 10; pz += 16) {
        const support = new THREE.Mesh(this.getCylinder(0.12, 0.16, 2.8, 6), this.darkBronzeMat);
        support.position.set(pipeX, 1.4, -pz);
        districtB.add(support);

        const flange = new THREE.Mesh(this.getCylinder(0.36, 0.36, 0.15, 8), this.antiqueGoldMat);
        flange.rotation.x = Math.PI / 2;
        flange.position.set(pipeX, 2.8, -pz);
        districtB.add(flange);
      }
    });

    // 5. Siding Steam Locomotive Chassis on elevated platform (Solid depth down to Y = -5.65m)
    const sidingPlatform = new THREE.Mesh(this.getBox(6.5, 6.0, 26.0), this.darkBronzeMat);
    sidingPlatform.position.set(curbEdge + 9.5, -2.65, -chunkLength * 0.45);
    districtB.add(sidingPlatform);

    const platformWood = new THREE.Mesh(this.getBox(6.8, 0.4, 26.2), this.steamedOakMat);
    platformWood.position.set(curbEdge + 9.5, 0.8, -chunkLength * 0.45);
    districtB.add(platformWood);

    const parkedLoco = this.buildChronoKingdomShowcaseTrain(curbEdge + 9.5, 1.0, -chunkLength * 0.45);
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

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    [-1, 1].forEach((side) => {
      // 1. Midnight Basalt Promenade (Solid depth down to Y = -5.65m)
      const walkW = 24.0;
      const walkDepth = 6.0;
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, walkDepth, chunkLength), this.midnightSteelMat);
      walk.position.set(wx, 0.35 - walkDepth * 0.5, -chunkLength * 0.5);
      districtC.add(walk);

      const curb = new THREE.Mesh(this.getBox(0.48, walkDepth + 0.1, chunkLength), this.antiqueGoldMat);
      curb.position.set(side * (curbEdge + 0.24), 0.38 - walkDepth * 0.5, -chunkLength * 0.5);
      districtC.add(curb);

      // 2. Beautiful Stone & Brass Arched Astrolabe Pavilion (Firmly grounded into promenade!)
      const astrolabePavilion = new THREE.Group();
      astrolabePavilion.position.set(side * (curbEdge + 6.5), 0.35, -chunkLength * 0.5);

      // Stone plinth
      const pavPlinth = new THREE.Mesh(this.getBox(3.0, 6.0, 14.0), this.darkBronzeMat);
      pavPlinth.position.y = -3.0;
      astrolabePavilion.add(pavPlinth);

      // Arched Pavilion Wall
      const pavWall = new THREE.Mesh(this.getBox(2.2, 13.0, 13.5), this.darkIronstoneMat);
      pavWall.position.y = 6.5;
      astrolabePavilion.add(pavWall);

      // Flanking Brass Columns
      [-5.5, 5.5].forEach((cz) => {
        const pCol = new THREE.Mesh(this.getCylinder(0.45, 0.55, 13.0, 8), this.antiqueGoldMat);
        pCol.position.set(-side * 1.2, 6.5, cz);
        astrolabePavilion.add(pCol);
      });

      // Gilded Arch Pediment atop pavilion
      const pediment = new THREE.Mesh(this.getBox(2.6, 1.2, 14.2), this.antiqueGoldMat);
      pediment.position.y = 13.5;
      astrolabePavilion.add(pediment);

      // Mounted Celestial Astrolabe Dial (Circular astrolabe disc mounted inside ornate alcove)
      const astrolabeTex = ChronoKingdomTextureHelper.getAstrolabeTexture();
      const astrolabe = new THREE.Mesh(
        this.getCircle(4.5, 32),
        this.createStandardMaterial({
          map: astrolabeTex,
          roughness: 0.25,
          metalness: 0.45,
          emissive: 0x0f172a,
          emissiveIntensity: 0.2,
          side: THREE.DoubleSide
        })
      );
      astrolabe.position.set(-side * 1.15, 6.5, 0);
      astrolabe.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      astrolabePavilion.add(astrolabe);

      // Gilded Bezel Ring Framing the Astrolabe Disc
      const astrolabeRim = new THREE.Mesh(this.getTorus(4.6, 0.26, 8, 32), this.antiqueGoldMat);
      astrolabeRim.position.set(-side * 1.16, 6.5, 0);
      astrolabeRim.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      astrolabePavilion.add(astrolabeRim);

      districtC.add(astrolabePavilion);
    });

    // 3. Immense Celestial Observatory Dome & Concentric Gimbal Rings (Left Side)
    const observatoryGroup = new THREE.Group();
    observatoryGroup.name = 'celestial_observatory_complex';
    observatoryGroup.position.set(-curbEdge - 15.0, 0.35, -chunkLength * 0.5);

    // Subterranean Rotunda Plinth down to Y = -5.65m
    const rotundaPlinth = new THREE.Mesh(this.getCylinder(13.0, 13.5, 6.0, 16), this.darkBronzeMat);
    rotundaPlinth.position.y = -3.0;
    observatoryGroup.add(rotundaPlinth);

    // Stone Rotunda Base
    const rotunda = new THREE.Mesh(this.getCylinder(11.5, 12.5, 18.0, 16), this.darkBronzeMat);
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
    [-4.5, 3.2, 5.8].forEach((planetDist, pIdx) => {
      const armRod = new THREE.Mesh(this.getCylinder(0.06, 0.06, Math.abs(planetDist), 6), this.antiqueGoldMat);
      armRod.rotation.z = Math.PI / 2;
      armRod.position.set(planetDist * 0.5, 0, 0);
      orreryArm.add(armRod);

      const planetMat = pIdx === 0 ? this.burnishedCopperMat : (pIdx === 1 ? this.glowingCyanMat : this.antiqueGoldMat);
      const planetSphere = new THREE.Mesh(this.getSphere(0.45, 8), planetMat);
      planetSphere.position.set(planetDist, 0, 0);
      orreryArm.add(planetSphere);
    });
    ringsGroup.add(orreryArm);

    director.registerObservatory(outerRing, middleRing, innerRing, orreryArm, 1.0);
    observatoryGroup.add(ringsGroup);

    districtC.add(observatoryGroup);
  }

  // =========================================================================
  // DISTRICT D — FRACTURED TIME
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

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    [-1, 1].forEach((side) => {
      // 1. Shifting Stone & Copper Promenade (Solid depth down to Y = -5.65m)
      const walkW = 24.0;
      const walkDepth = 6.0;
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, walkDepth, chunkLength), this.darkIronstoneMat);
      walk.position.set(wx, 0.35 - walkDepth * 0.5, -chunkLength * 0.5);
      districtD.add(walk);

      const curb = new THREE.Mesh(this.getBox(0.48, walkDepth + 0.1, chunkLength), this.antiqueGoldMat);
      curb.position.set(side * (curbEdge + 0.24), 0.38 - walkDepth * 0.5, -chunkLength * 0.5);
      districtD.add(curb);

      // 2. Temporal Stasis Chambers & Mechanically Suspended Clock Fragments
      for (let z = 12; z < chunkLength - 12; z += 38) {
        const fragmentGroup = new THREE.Group();
        fragmentGroup.position.set(side * (curbEdge + 12.0), 0.35, -z);

        // Subterranean Anchor Plinth down to Y = -5.65m (prevents floating scenery)
        const plinth = new THREE.Mesh(this.getBox(14.0, 6.0, 22.0), this.darkBronzeMat);
        plinth.position.y = -3.0;
        fragmentGroup.add(plinth);

        // Heavy Riveted Ground Anchor Base
        const ruBase = new THREE.Mesh(this.getBox(12.0, 10.0, 20.0), this.darkBronzeMat);
        ruBase.position.y = 5.0;
        fragmentGroup.add(ruBase);

        // Heavy Bronze Suspension Pylons & Mooring Girders holding the stasis field
        [-4.5, 4.5].forEach((px) => {
          const pylon = new THREE.Mesh(this.getBox(0.9, 14.0, 0.9), this.burnishedCopperMat);
          pylon.position.set(px, 12.0, 0);
          fragmentGroup.add(pylon);

          const bracket = new THREE.Mesh(this.getBox(1.8, 0.6, 1.8), this.antiqueGoldMat);
          bracket.position.set(px, 18.0, 0);
          fragmentGroup.add(bracket);
        });

        // Glowing Amber Temporal Stasis Ring encircling the floating block
        const stasisRing = new THREE.Mesh(this.getTorus(7.2, 0.35, 8, 24), this.warmGlassAmberMat);
        stasisRing.position.set(0, 18.0, 0);
        stasisRing.rotation.x = Math.PI / 2;
        fragmentGroup.add(stasisRing);
        director.registerGear(stasisRing, 0.5 * side, 'z');

        // Glowing Cyan Energy Beams pinning the block in temporal suspension
        [-3.5, 3.5].forEach((ex) => {
          const beam = new THREE.Mesh(this.getCylinder(0.12, 0.12, 10.0, 6), this.glowingCyanMat);
          beam.position.set(ex, 12.5, 0);
          fragmentGroup.add(beam);
        });

        // Hovering Floating Clockwork Block (Suspended inside temporal stasis field)
        const floatingBlock = new THREE.Mesh(this.getBox(9.0, 9.0, 14.0), this.midnightSteelMat);
        floatingBlock.position.set(0, 18.0, 0);
        floatingBlock.rotation.set(0.12, side * 0.25, 0.18);
        fragmentGroup.add(floatingBlock);

        // Distorted/Warped Clock Face on floating block (Circular dial framed in brass)
        const warpedClockTex = ChronoKingdomTextureHelper.getClockFaceTexture(false);
        const warpedClock = new THREE.Mesh(
          this.getCircle(3.2, 24),
          this.createStandardMaterial({
            map: warpedClockTex,
            roughness: 0.28,
            metalness: 0.35,
            emissive: 0xd97706,
            emissiveIntensity: 0.45,
            side: THREE.DoubleSide
          })
        );
        warpedClock.position.set(-side * 4.6, 18.0, 0);
        warpedClock.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        fragmentGroup.add(warpedClock);

        const warpedBezel = new THREE.Mesh(this.getTorus(3.25, 0.18, 8, 24), this.antiqueGoldMat);
        warpedBezel.position.set(-side * 4.62, 18.0, 0);
        warpedBezel.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        fragmentGroup.add(warpedBezel);

        // Rotating Broken Gear attached to floating fragment
        const brokenGear = this.buildGearMesh(2.5, 12, 0.4, this.antiqueGoldMat);
        brokenGear.position.set(0, 23.5, 0);
        brokenGear.rotation.x = Math.PI / 2;
        fragmentGroup.add(brokenGear);
        director.registerGear(brokenGear, -1.2 * side, 'y');

        districtD.add(fragmentGroup);
      }
    });

    // 3. HERO EVENT 7: MONUMENTAL FRACTURED TIME PORTAL / TEMPORAL RIFT
    const portalGroup = new THREE.Group();
    portalGroup.name = 'fractured_time_portal_complex';
    portalGroup.position.set(0, 24.5, -chunkLength * 0.5);

    // Twin Ground Pylons anchoring the portal (down to Y = -5.65m)
    [-curbEdge - 8.0, curbEdge + 8.0].forEach((px) => {
      const pylonPlinth = new THREE.Mesh(this.getBox(3.2, 8.0, 4.0), this.darkBronzeMat);
      pylonPlinth.position.set(px, -24.5 - 1.65, 0);
      portalGroup.add(pylonPlinth);

      const pylon = new THREE.Mesh(this.getCylinder(1.2, 1.8, 24.0, 8), this.burnishedCopperMat);
      pylon.position.set(px, -11.0, 0);
      portalGroup.add(pylon);

      const cap = new THREE.Mesh(this.getBox(3.2, 1.5, 3.2), this.antiqueGoldMat);
      cap.position.set(px, 1.0, 0);
      portalGroup.add(cap);
    });

    // Outer Gilded Temporal Portal Ring (R = 14m, spanning above the tracks with min Y = 9.65m > 8.5m)
    const portalOuter = new THREE.Mesh(this.getTorus(14.0, 0.85, 8, 32), this.antiqueGoldMat);
    portalGroup.add(portalOuter);

    // Inner Counter-Rotating Bronze Bezel Ring (R = 11.5m)
    const portalInner = new THREE.Mesh(this.getTorus(11.5, 0.65, 8, 32), this.burnishedCopperMat);
    portalGroup.add(portalInner);

    // Swirling Central Temporal Vortex (R = 10m)
    const vortexTex = ChronoKingdomTextureHelper.getVortexTexture();
    const vortexCore = new THREE.Mesh(
      this.getPlane(20.0, 20.0),
      this.createBasicMaterial({
        map: vortexTex,
        transparent: true,
        opacity: 0.75,
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

  private buildSkybridgeClockworkTram(x: number, y: number, z: number): THREE.Group {
    const tram = new THREE.Group();
    tram.name = 'skybridge_clockwork_tram';
    tram.position.set(x, y, z);

    // Body
    const body = new THREE.Mesh(this.getBox(2.8, 2.2, 6.5), this.burnishedCopperMat);
    body.position.y = 1.1;
    tram.add(body);

    // Roof
    const roof = new THREE.Mesh(this.getBox(2.9, 0.5, 6.7), this.antiqueGoldMat);
    roof.position.y = 2.4;
    tram.add(roof);

    // Glowing Amber Passenger Windows
    for (let wz = -2.0; wz <= 2.0; wz += 2.0) {
      [-1.42, 1.42].forEach((wx) => {
        const win = new THREE.Mesh(this.getBox(0.1, 0.9, 1.2), this.warmGlassAmberMat);
        win.position.set(wx, 1.3, wz);
        tram.add(win);
      });
    }

    // Side Drive Gears on tram chassis
    const driveRods: THREE.Object3D[] = [];
    [-1.48, 1.48].forEach((gx) => {
      [-1.8, 1.8].forEach((gz) => {
        const cog = this.buildGearMesh(0.55, 8, 0.12, this.antiqueGoldMat);
        cog.position.set(gx, 0.35, gz);
        cog.rotation.y = Math.PI / 2;
        tram.add(cog);
        driveRods.push(cog);
      });
    });

    return tram;
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

    // Boiler Cowling (Burnished Copper Cylinder)
    const boiler = new THREE.Mesh(this.getCylinder(1.1, 1.1, 14.0, 12), this.burnishedCopperMat);
    boiler.rotation.x = Math.PI / 2;
    boiler.position.set(0, 2.0, -2.5);
    train.add(boiler);

    // Gilded Boiler Straps
    for (let bz = -8.0; bz <= 3.0; bz += 2.5) {
      const strap = new THREE.Mesh(this.getCylinder(1.14, 1.14, 0.18, 12), this.antiqueGoldMat);
      strap.rotation.x = Math.PI / 2;
      strap.position.set(0, 2.0, bz);
      train.add(strap);
    }

    // Victorian Driver's Cab at Rear (Midnight Steel)
    const cab = new THREE.Mesh(this.getBox(2.5, 2.5, 5.5), this.midnightSteelMat);
    cab.position.set(0, 2.45, 6.8);
    train.add(cab);

    // Glowing Amber Cab Windows
    [-1.28, 1.28].forEach((wx) => {
      const cabWin = new THREE.Mesh(this.getBox(0.08, 1.0, 2.2), this.warmGlassAmberMat);
      cabWin.position.set(wx, 2.7, 6.8);
      train.add(cabWin);
    });

    // Smokestack with Gilded Crown
    const stack = new THREE.Mesh(this.getCylinder(0.35, 0.28, 1.4, 8), this.darkIronstoneMat);
    stack.position.set(0, 3.2, -7.5);
    train.add(stack);

    const stackCrown = new THREE.Mesh(this.getCylinder(0.44, 0.32, 0.25, 8), this.antiqueGoldMat);
    stackCrown.position.set(0, 3.95, -7.5);
    train.add(stackCrown);

    // Front Brass Headlight Housing with Intense Amber Beam
    const lampHousing = new THREE.Mesh(this.getCylinder(0.45, 0.35, 0.8, 8), this.antiqueGoldMat);
    lampHousing.rotation.x = Math.PI / 2;
    lampHousing.position.set(0, 2.5, -10.2);
    train.add(lampHousing);

    const lampLens = new THREE.Mesh(this.getCylinder(0.38, 0.38, 0.1, 8), this.warmGlassAmberMat);
    lampLens.rotation.x = Math.PI / 2;
    lampLens.position.set(0, 2.5, -10.6);
    train.add(lampLens);

    // Front Art Deco Cowcatcher / Wedge Plow
    const plow = new THREE.Mesh(this.getBox(2.2, 0.8, 1.4), this.burnishedCopperMat);
    plow.position.set(0, 0.6, -10.5);
    train.add(plow);

    // 8 Spoked Driving Wheels along bogies
    [-1.25, 1.25].forEach((wx) => {
      for (let wz = -7.0; wz <= 7.0; wz += 4.5) {
        const wheel = this.buildGearMesh(0.65, 10, 0.18, this.antiqueGoldMat);
        wheel.position.set(wx, 0.65, wz);
        wheel.rotation.y = Math.PI / 2;
        train.add(wheel);
      }
    });

    return train;
  }
}
