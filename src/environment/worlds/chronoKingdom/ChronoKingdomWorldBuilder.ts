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

    // Swirling Spiral Gradient with warm stasis core, celestial teal, and twilight violet
    const radGrad = ctx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5);
    radGrad.addColorStop(0, '#fffbeb'); // Radiant warm ivory core
    radGrad.addColorStop(0.18, '#fef08a'); // Warm golden amber stasis aura
    radGrad.addColorStop(0.45, '#4e9b9b'); // Muted celestial stasis teal
    radGrad.addColorStop(0.72, '#2e1b38'); // Deep twilight burgundy/violet distortion
    radGrad.addColorStop(1.0, 'rgba(15, 23, 42, 0)'); // Soft transparent rim

    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, size, size);

    // Antique Gold Spiral Arms
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.55)';
    ctx.lineWidth = 3.5;
    for (let arm = 0; arm < 4; arm++) {
      const startAngle = (arm * Math.PI) / 2;
      ctx.beginPath();
      for (let r = 12; r < size * 0.46; r += 4) {
        const theta = startAngle + r * 0.038;
        const x = size * 0.5 + Math.cos(theta) * r;
        const y = size * 0.5 + Math.sin(theta) * r;
        if (r === 12) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Concentric Stasis Wave Rings
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
    [0.15, 0.28, 0.38].forEach((ratio) => {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.5, size * ratio, 0, Math.PI * 2);
      ctx.stroke();
    });

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  public static getStarChartTexture(): THREE.Texture {
    const key = 'chrono_star_chart';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Deep midnight slate / indigo background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, size, size);

    // Celestial celestial grid circles
    ctx.strokeStyle = '#1e293b';
    [0.45, 0.35, 0.25, 0.15].forEach((r) => {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.5, size * r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Outer Gilded Degree Ring
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.46, 0, Math.PI * 2);
    ctx.stroke();

    // Constellation lines & stars
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
    ctx.lineWidth = 1.5;
    const stars = [
      { x: 0.3, y: 0.25 }, { x: 0.4, y: 0.2 }, { x: 0.55, y: 0.28 },
      { x: 0.65, y: 0.35 }, { x: 0.7, y: 0.5 }, { x: 0.6, y: 0.65 },
      { x: 0.45, y: 0.7 }, { x: 0.32, y: 0.6 }, { x: 0.25, y: 0.45 }
    ];
    ctx.beginPath();
    stars.forEach((s, idx) => {
      const px = s.x * size;
      const py = s.y * size;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Star dots
    stars.forEach((s) => {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(s.x * size, s.y * size, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Central Compass Rose
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, 8, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  public static getCarillonDialTexture(): THREE.Texture {
    const key = 'chrono_carillon_dial';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Aged Ivory parchment fill
    ctx.fillStyle = '#3d2415';
    ctx.fillRect(0, 0, size, size);

    const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.1, size * 0.5, size * 0.5, size * 0.48);
    grad.addColorStop(0, '#fef9c3');
    grad.addColorStop(0.7, '#fef08a');
    grad.addColorStop(0.95, '#d97706');
    grad.addColorStop(1.0, '#3d2415');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.48, 0, Math.PI * 2);
    ctx.fill();

    // Burnished Copper Rim
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.46, 0, Math.PI * 2);
    ctx.stroke();

    // Gilded inner bezel
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.5, size * 0.43, 0, Math.PI * 2);
    ctx.stroke();

    // Numerals (12, 3, 6, 9)
    const numerals = ['XII', 'III', 'VI', 'IX'];
    ctx.fillStyle = '#1c0f04';
    ctx.font = 'bold 44px "Cinzel", "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    [0, 3, 6, 9].forEach((h, idx) => {
      const angle = (h * Math.PI) / 6 - Math.PI / 2;
      const x = size * 0.5 + Math.cos(angle) * (size * 0.35);
      const y = size * 0.5 + Math.sin(angle) * (size * 0.35);
      ctx.fillText(numerals[idx], x, y);
    });

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
 * - 4 distinct architectural districts with unmistakable identities and 3-variant replayability.
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
  private agedIvoryMat: THREE.MeshStandardMaterial;
  private celestialBlueMat: THREE.MeshStandardMaterial;

  private constructor() {
    // 1. Heavy Victorian Architectural Bronze (rich metallic luster)
    this.darkBronzeMat = new THREE.MeshStandardMaterial({
      color: 0x5a3d28,
      metalness: 0.40,
      roughness: 0.42
    });

    // 2. Polished Clockmaker's Antique Gold
    this.antiqueGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.75,
      roughness: 0.28
    });

    // 3. Radiant Burnished Copper
    this.burnishedCopperMat = new THREE.MeshStandardMaterial({
      color: 0xae623b,
      metalness: 0.50,
      roughness: 0.35
    });

    // 4. Blued Midnight Steel
    this.midnightSteelMat = new THREE.MeshStandardMaterial({
      color: 0x192334,
      metalness: 0.42,
      roughness: 0.38
    });

    // 5. Ornate Aged Mechanical Brass
    this.agedBrassMat = new THREE.MeshStandardMaterial({
      color: 0xc59b3f,
      metalness: 0.55,
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

    // 10. Glowing Celestial Teal / Temporal Stasis Energy
    this.glowingCyanMat = new THREE.MeshBasicMaterial({
      color: 0x4e9b9b
    });

    // 11. Atmospheric Steam Exhaust Plume
    this.steamPuffMat = new THREE.MeshBasicMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.60
    });

    // 12. Aged Ivory Horological Dial Enamel
    this.agedIvoryMat = new THREE.MeshStandardMaterial({
      color: 0xe9dab7,
      roughness: 0.45,
      metalness: 0.15
    });

    // 13. Deep Celestial Blue Astrolabe Metal
    this.celestialBlueMat = new THREE.MeshStandardMaterial({
      color: 0x26466d,
      roughness: 0.35,
      metalness: 0.40
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
      this.steamPuffMat,
      this.agedIvoryMat,
      this.celestialBlueMat
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

  private getIcosahedron(r: number, detail: number = 0): THREE.IcosahedronGeometry {
    const key = `icosahedron_${r}_${detail}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.IcosahedronGeometry(r, detail));
    }
    return this.geoCache.get(key) as THREE.IcosahedronGeometry;
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

    // 4-cycle district permutations to banish 1,600m visual repetition
    const DISTRICT_CYCLES: number[][] = [
      [0, 1, 2, 3], // Cycle 0 (0-1600m): Capital -> Foundry -> Observatory -> Fractured
      [1, 0, 3, 2], // Cycle 1 (1600-3200m): Foundry -> Capital -> Fractured -> Observatory
      [2, 3, 0, 1], // Cycle 2 (3200-4800m): Observatory -> Fractured -> Capital -> Foundry
      [3, 2, 1, 0], // Cycle 3 (4800-6400m): Fractured -> Observatory -> Foundry -> Capital
    ];

    let districtIndex: number;
    let variantIndex: number = 0;

    if (worldZIn !== 0 && Number.isFinite(worldZIn)) {
      const absZ = Math.abs(worldZIn);
      const cycleIndex = Math.floor(absZ / 1600) % DISTRICT_CYCLES.length;
      const blockIndex = Math.floor((absZ % 1600) / 400);
      districtIndex = DISTRICT_CYCLES[cycleIndex][blockIndex];
      variantIndex = (cycleIndex + blockIndex) % 3;
    } else if (seed >= 0 && seed < 4) {
      districtIndex = seed;
      variantIndex = 0;
    } else if (group.parent && typeof group.parent.position?.z === 'number' && Number.isFinite(group.parent.position.z)) {
      const absZ = Math.abs(group.parent.position.z);
      const cycleIndex = Math.floor(absZ / 1600) % DISTRICT_CYCLES.length;
      const blockIndex = Math.floor((absZ % 1600) / 400);
      districtIndex = DISTRICT_CYCLES[cycleIndex][blockIndex];
      variantIndex = (cycleIndex + blockIndex) % 3;
    } else {
      districtIndex = Math.floor(Math.abs(seed) / 4) % 4;
      variantIndex = Math.abs(seed) % 3;
    }

    switch (districtIndex) {
      case 0:
        this.buildGrandClockworkCapital(group, roadbedWidth, chunkLength, rng, detail, director, variantIndex, worldZIn);
        break;
      case 1:
        this.buildTimeFoundry(group, roadbedWidth, chunkLength, rng, detail, director, variantIndex, worldZIn);
        break;
      case 2:
        this.buildChronoObservatory(group, roadbedWidth, chunkLength, rng, detail, director, variantIndex, worldZIn);
        break;
      case 3:
      default:
        this.buildFracturedTimeDistrict(group, roadbedWidth, chunkLength, rng, detail, director, variantIndex, worldZIn);
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
    director: ChronoKingdomEventDirector,
    variant: number = 0,
    worldZ: number = 0
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

      // 2. HERO LANDMARK ARCHITECTURE: 3 RICH DISTRICT VARIANTS
      if (variant === 0) {
        // --- VARIANT 0: ROYAL HOROLOGIUM PLAZA (The Monumental Clock Tower) ---
        for (let z = 16; z < chunkLength - 16; z += 42) {
          // Reserve z ≈ 50 on the Titan's promenade side for the monumental Colossus Plaza
          if (side === 1 && Math.abs(z - 50) < 28) continue;
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

          // Surprise 1: The Great Clock Reversal
          director.registerClockReversal(clockMesh, minuteHandGroup, hourHandGroup, [gear1, gear2, gear3], 4.0, 14.0);

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
      } else if (variant === 1) {
        // --- VARIANT 1: BRASS CATHEDRAL AVENUE (Gothic Arches & Rose Windows) ---
        for (let z = 18; z < chunkLength - 18; z += 46) {
          if (side === 1 && Math.abs(z - 50) < 28) continue;
          const cathedralGroup = new THREE.Group();
          cathedralGroup.position.set(side * (curbEdge + 7.5), 0.35, -z);

          // Subterranean Plinth down to Y = -5.65m
          const plinth = new THREE.Mesh(this.getBox(14.0, 6.0, 28.0), this.darkBronzeMat);
          plinth.position.set(side * 1.5, -3.0, 0);
          cathedralGroup.add(plinth);

          // Cathedral Nave Wall Base (Y = 0 to 18m)
          const nave = new THREE.Mesh(this.getBox(11.0, 18.0, 26.0), this.darkBronzeMat);
          nave.position.set(side * 1.5, 9.0, 0);
          cathedralGroup.add(nave);

          // Gothic Pointed Lancet Arches along frontage
          [-8.0, 0, 8.0].forEach((az) => {
            const archPillarL = new THREE.Mesh(this.getCylinder(0.4, 0.5, 14.0, 8), this.antiqueGoldMat);
            archPillarL.position.set(-side * 4.8, 7.0, az - 2.0);
            cathedralGroup.add(archPillarL);

            const archPillarR = new THREE.Mesh(this.getCylinder(0.4, 0.5, 14.0, 8), this.antiqueGoldMat);
            archPillarR.position.set(-side * 4.8, 7.0, az + 2.0);
            cathedralGroup.add(archPillarR);

            const archPediment = new THREE.Mesh(this.getBox(0.8, 1.4, 4.4), this.burnishedCopperMat);
            archPediment.position.set(-side * 4.8, 14.5, az);
            cathedralGroup.add(archPediment);

            const lancetWin = new THREE.Mesh(this.getBox(0.4, 10.0, 2.8), this.warmGlassAmberMat);
            lancetWin.position.set(-side * 4.2, 7.0, az);
            cathedralGroup.add(lancetWin);
          });

          // Triple Vertical Gear Train cascading up the central bay
          const cGear1 = this.buildGearMesh(3.0, 14, 0.40, this.antiqueGoldMat);
          cGear1.position.set(-side * 4.6, 9.0, 0);
          cGear1.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          cathedralGroup.add(cGear1);
          director.registerGear(cGear1, 0.8 * side, 'z');

          const cGear2 = this.buildGearMesh(2.0, 10, 0.35, this.burnishedCopperMat);
          cGear2.position.set(-side * 4.6, 14.5, 0);
          cGear2.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          cathedralGroup.add(cGear2);
          director.registerGear(cGear2, -1.2 * side, 'z');

          const cGear3 = this.buildGearMesh(1.4, 8, 0.30, this.agedBrassMat);
          cGear3.position.set(-side * 4.6, 18.5, 0);
          cGear3.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          cathedralGroup.add(cGear3);
          director.registerGear(cGear3, 1.8 * side, 'z');

          // Illuminated Gilded Rose Window at Y = 24m (6.4m diameter)
          const roseWindow = new THREE.Mesh(this.getCircle(3.2, 32), this.warmGlassAmberMat);
          roseWindow.position.set(-side * 4.6, 24.0, 0);
          roseWindow.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          cathedralGroup.add(roseWindow);

          const roseTracery = new THREE.Mesh(this.getTorus(3.25, 0.22, 6, 24), this.antiqueGoldMat);
          roseTracery.position.set(-side * 4.62, 24.0, 0);
          roseTracery.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          cathedralGroup.add(roseTracery);

          // Twin Gothic Spires flanking the roof (reaching Y = 46m)
          [-8.0, 8.0].forEach((sz) => {
            const belfry = new THREE.Mesh(this.getBox(4.0, 14.0, 4.0), this.midnightSteelMat);
            belfry.position.set(side * 1.5, 25.0, sz);
            cathedralGroup.add(belfry);

            const spire = new THREE.Mesh(this.getCylinder(0.2, 2.5, 12.0, 8), this.burnishedCopperMat);
            spire.position.set(side * 1.5, 38.0, sz);
            cathedralGroup.add(spire);
          });

          districtA.add(cathedralGroup);
        }
      } else {
        // --- VARIANT 2: THE THOUSAND-BELL CARILLON (Campanile Towers & Swinging Bells) ---
        for (let z = 20; z < chunkLength - 15; z += 48) {
          if (side === 1 && Math.abs(z - 50) < 28) continue;
          const carillonTower = new THREE.Group();
          carillonTower.position.set(side * (curbEdge + 7.0), 0.35, -z);

          // Subterranean Plinth down to Y = -5.65m
          const plinth = new THREE.Mesh(this.getBox(12.0, 6.0, 14.0), this.darkBronzeMat);
          plinth.position.set(side * 1.0, -3.0, 0);
          carillonTower.add(plinth);

          // Campanile Stone Tower Shaft (Y = 0 to 22m)
          const shaft = new THREE.Mesh(this.getBox(9.0, 22.0, 10.0), this.midnightSteelMat);
          shaft.position.set(side * 1.0, 11.0, 0);
          carillonTower.add(shaft);

          // Antique Ivory Carillon Dial on lower shaft facade (Y = 13m)
          const carillonDialTex = ChronoKingdomTextureHelper.getCarillonDialTexture();
          const dialMesh = new THREE.Mesh(
            this.getCircle(2.5, 24),
            this.createStandardMaterial({
              map: carillonDialTex,
              roughness: 0.35,
              metalness: 0.35,
              emissive: 0xd97706,
              emissiveIntensity: 0.3,
              side: THREE.DoubleSide
            })
          );
          dialMesh.position.set(-side * 3.6, 13.0, 0);
          dialMesh.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          carillonTower.add(dialMesh);

          const dialBezel = new THREE.Mesh(this.getTorus(2.55, 0.16, 6, 24), this.burnishedCopperMat);
          dialBezel.position.set(-side * 3.62, 13.0, 0);
          dialBezel.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          carillonTower.add(dialBezel);

          // Open Arched Belfry at Y = 22m to 32m
          const belfryPillarL = new THREE.Mesh(this.getCylinder(0.5, 0.5, 10.0, 8), this.antiqueGoldMat);
          belfryPillarL.position.set(-side * 3.2, 27.0, -3.5);
          carillonTower.add(belfryPillarL);

          const belfryPillarR = new THREE.Mesh(this.getCylinder(0.5, 0.5, 10.0, 8), this.antiqueGoldMat);
          belfryPillarR.position.set(-side * 3.2, 27.0, 3.5);
          carillonTower.add(belfryPillarR);

          const belfryRoof = new THREE.Mesh(this.getBox(10.0, 1.2, 11.0), this.antiqueGoldMat);
          belfryRoof.position.set(side * 1.0, 32.0, 0);
          carillonTower.add(belfryRoof);

          // Working Swinging Carillon Bell
          const bellPivot = new THREE.Group();
          bellPivot.position.set(-side * 1.5, 30.0, 0);

          const bellCrown = new THREE.Mesh(this.getCylinder(0.35, 0.35, 0.6, 8), this.antiqueGoldMat);
          bellPivot.add(bellCrown);

          const bellBody = new THREE.Mesh(this.getCylinder(0.5, 1.4, 2.2, 16), this.burnishedCopperMat);
          bellBody.position.y = -1.2;
          bellPivot.add(bellBody);

          const bellClapper = new THREE.Mesh(this.getCylinder(0.12, 0.22, 1.8, 6), this.darkBronzeMat);
          bellClapper.position.y = -1.8;
          bellPivot.add(bellClapper);

          carillonTower.add(bellPivot);
          director.registerCarillonBell(bellPivot, 2.2, 0.45, side * 0.8);

          // Copper Mansard Spire (Y = 32m to 48m)
          const spire = new THREE.Mesh(this.getCylinder(0.2, 4.5, 15.0, 8), this.burnishedCopperMat);
          spire.position.set(side * 1.0, 40.0, 0);
          carillonTower.add(spire);

          districtA.add(carillonTower);
        }
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

    // 5. Blockbuster Spectacle: The Clockwork Titan Awakens (Scene A Quality Gate)
    this.spawnClockworkTitan(districtA, director, worldZ, 1);

    // 6. High-Value Surprise: Clockwork Bird Swarm Soaring Formation
    if (variant === 1 || variant === 2) {
      this.spawnClockworkBirdSwarm(districtA, director, worldZ);
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
    director: ChronoKingdomEventDirector,
    variant: number = 0,
    worldZ: number = 0
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

      // 2. HERO FOUNDRY ARCHITECTURE: 3 RICH DISTRICT VARIANTS
      if (variant === 0) {
        // --- VARIANT 0: HYDRAULIC DROP-FORGE HALL (Baseline Drop Hammer & 8m Flywheel) ---
        for (let z = 12; z < chunkLength - 12; z += 38) {
          const foundryHall = new THREE.Group();
          foundryHall.position.set(side * (curbEdge + 12.0), 0.35, -z);

          // Subterranean Cast-Iron Plinth down to Y = -5.65m
          const fPlinth = new THREE.Mesh(this.getBox(16.0, 6.0, 26.0), this.darkBronzeMat);
          fPlinth.position.set(side * 2.0, -3.0, 0);
          foundryHall.add(fPlinth);

          // Heavy Cast-Iron Foundation Base
          const hallBase = new THREE.Mesh(this.getBox(12.0, 13.0, 24.0), this.darkBronzeMat);
          hallBase.position.set(side * 2.0, 6.5, 0);
          foundryHall.add(hallBase);

          // Glowing Smelting Furnace Arch with Fiery Molten Glow
          const furnaceOpening = new THREE.Mesh(this.getBox(1.5, 7.5, 8.5), this.furnaceFireMat);
          furnaceOpening.position.set(-side * 4.1, 5.0, 0);
          foundryHall.add(furnaceOpening);

          const furnaceArch = new THREE.Mesh(this.getBox(1.8, 8.5, 9.5), this.darkIronstoneMat);
          furnaceArch.position.set(-side * 4.3, 5.5, 0);
          foundryHall.add(furnaceArch);

          // Steampunk Pressure Gauge on facade
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

          // 14m Hydraulic Drop-Forge Steam Press
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

          // 8m Monumental Spoked Flywheel & Bevel Gear
          const flywheel = this.buildGearMesh(4.0, 16, 0.45, this.antiqueGoldMat);
          flywheel.position.set(-side * 4.8, 9.0, 6.0);
          flywheel.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          foundryHall.add(flywheel);
          director.registerGear(flywheel, 1.4 * side, 'z');

          // Timed Steam-Driven Pistons
          const pistonBank = new THREE.Group();
          pistonBank.position.set(-side * 4.6, 13.0, -2.0);

          for (let p = 0; p < 3; p++) {
            const cylinderJacket = new THREE.Mesh(this.getCylinder(0.8, 0.8, 4.0, 8), this.darkBronzeMat);
            cylinderJacket.position.set(0, 2.0, p * 3.2);
            pistonBank.add(cylinderJacket);

            const pistonHead = new THREE.Mesh(this.getCylinder(0.55, 0.55, 1.2, 8), this.antiqueGoldMat);
            pistonHead.position.set(0, 4.0, p * 3.2);
            pistonBank.add(pistonHead);

            const steamPlume = new THREE.Mesh(this.getSphere(0.7, 8), this.steamPuffMat);
            steamPlume.position.set(0, 5.2, p * 3.2);
            pistonBank.add(steamPlume);

            director.registerPiston(pistonHead, 4.0, 1.2, 2.5, p * 0.8, undefined, steamPlume);
          }
          foundryHall.add(pistonBank);

          // Gabled Workshop Roof
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
      } else if (variant === 1) {
        // --- VARIANT 1: GREAT TIME ENGINE COMPLEX (Turbine Rotor & Oscillating Gauges) ---
        for (let z = 14; z < chunkLength - 14; z += 42) {
          const engineHall = new THREE.Group();
          engineHall.position.set(side * (curbEdge + 12.0), 0.35, -z);

          // Subterranean Plinth down to Y = -5.65m
          const ePlinth = new THREE.Mesh(this.getBox(16.0, 6.0, 26.0), this.darkBronzeMat);
          ePlinth.position.set(side * 2.0, -3.0, 0);
          engineHall.add(ePlinth);

          // Heavy Iron Turbine Hall Base
          const eBase = new THREE.Mesh(this.getBox(13.0, 14.0, 24.0), this.midnightSteelMat);
          eBase.position.set(side * 2.0, 7.0, 0);
          engineHall.add(eBase);

          // Colossal 10.4m Steam Turbine Rotor spinning on facade
          const turbineGroup = new THREE.Group();
          turbineGroup.position.set(-side * 4.6, 9.5, -4.0);

          const turbineRim = new THREE.Mesh(this.getTorus(5.2, 0.45, 8, 32), this.antiqueGoldMat);
          turbineRim.rotation.y = Math.PI / 2;
          turbineGroup.add(turbineRim);

          const turbineHub = new THREE.Mesh(this.getCylinder(1.8, 1.8, 1.2, 12), this.burnishedCopperMat);
          turbineHub.rotation.z = Math.PI / 2;
          turbineGroup.add(turbineHub);

          for (let v = 0; v < 16; v++) {
            const vAngle = (v * Math.PI * 2) / 16;
            const vane = new THREE.Mesh(this.getBox(0.2, 3.2, 0.6), this.agedBrassMat);
            vane.position.set(0, Math.sin(vAngle) * 3.2, Math.cos(vAngle) * 3.2);
            vane.rotation.x = vAngle + 0.3;
            turbineGroup.add(vane);
          }
          engineHall.add(turbineGroup);
          director.registerGear(turbineGroup, 1.8 * side, 'x');

          // Horizontal Reciprocating Steam Piston Head
          const horizCylinder = new THREE.Mesh(this.getCylinder(0.9, 0.9, 5.0, 8), this.darkBronzeMat);
          horizCylinder.rotation.x = Math.PI / 2;
          horizCylinder.position.set(-side * 4.6, 9.5, 6.5);
          engineHall.add(horizCylinder);

          const horizPistonHead = new THREE.Mesh(this.getCylinder(0.65, 0.65, 1.8, 8), this.antiqueGoldMat);
          horizPistonHead.rotation.x = Math.PI / 2;
          horizPistonHead.position.set(-side * 4.6, 9.5, 6.5);
          engineHall.add(horizPistonHead);
          director.registerPiston(horizPistonHead, 9.5, 1.6, 3.5, side * 0.5);

          // Cluster of 3 Oscillating Pressure Gauges on Facade
          [-2.2, 0, 2.2].forEach((gz, gIdx) => {
            const gaugeGroup = new THREE.Group();
            gaugeGroup.position.set(-side * 4.7, 16.0, gz + 4.0);

            const gTex = ChronoKingdomTextureHelper.getPressureGaugeTexture();
            const gMesh = new THREE.Mesh(
              this.getCircle(1.1, 20),
              this.createStandardMaterial({
                map: gTex,
                roughness: 0.3,
                metalness: 0.4,
                emissive: 0xd97706,
                emissiveIntensity: 0.25,
                side: THREE.DoubleSide
              })
            );
            gMesh.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
            gaugeGroup.add(gMesh);

            const gBezel = new THREE.Mesh(this.getTorus(1.12, 0.12, 6, 20), this.antiqueGoldMat);
            gBezel.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
            gaugeGroup.add(gBezel);

            // Active Oscillating Needle
            const needleGroup = new THREE.Group();
            needleGroup.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
            const needle = new THREE.Mesh(this.getBox(0.08, 0.9, 0.04), this.burnishedCopperMat);
            needle.position.y = 0.4;
            needleGroup.add(needle);
            gaugeGroup.add(needleGroup);
            director.registerPressureGauge(needleGroup, 3.6, 0.42, gIdx * 1.2);

            engineHall.add(gaugeGroup);
          });

          // Dual Heavy Smokestacks reaching Y = 28m
          [-5.0, 5.0].forEach((sz) => {
            const stack = new THREE.Mesh(this.getCylinder(0.9, 1.2, 16.0, 8), this.darkIronstoneMat);
            stack.position.set(side * 3.0, 21.0, sz);
            engineHall.add(stack);

            const stackCap = new THREE.Mesh(this.getCylinder(1.3, 1.3, 0.8, 8), this.antiqueGoldMat);
            stackCap.position.set(side * 3.0, 28.5, sz);
            engineHall.add(stackCap);
          });

          districtB.add(engineHall);
        }
      } else {
        // --- VARIANT 2: PENDULUM ESCAPEMENT WORKSHOP (Deadbeat Escapement & Gantry) ---
        for (let z = 16; z < chunkLength - 16; z += 44) {
          const workshop = new THREE.Group();
          workshop.position.set(side * (curbEdge + 12.0), 0.35, -z);

          // Subterranean Plinth down to Y = -5.65m
          const wPlinth = new THREE.Mesh(this.getBox(16.0, 6.0, 26.0), this.darkBronzeMat);
          wPlinth.position.set(side * 2.0, -3.0, 0);
          workshop.add(wPlinth);

          // Workshop Hall Base
          const wBase = new THREE.Mesh(this.getBox(12.0, 14.0, 24.0), this.darkIronstoneMat);
          wBase.position.set(side * 2.0, 7.0, 0);
          workshop.add(wBase);

          // Colossal Deadbeat Escapement Mechanism on Facade
          const escapeWheel = this.buildGearMesh(4.2, 16, 0.45, this.antiqueGoldMat);
          escapeWheel.position.set(-side * 4.6, 9.0, 0);
          escapeWheel.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          workshop.add(escapeWheel);
          director.registerGear(escapeWheel, 0.5 * side, 'z');

          // Anchor Escapement Pallet Arms rocking above wheel
          const anchorArm = new THREE.Mesh(this.getBox(0.6, 1.4, 7.2), this.burnishedCopperMat);
          anchorArm.position.set(-side * 4.7, 14.5, 0);
          anchorArm.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          workshop.add(anchorArm);

          // Massive Compound Pendulum (Length 11m, Bob R = 1.5m)
          const pendulumShaft = new THREE.Mesh(this.getCylinder(0.12, 0.12, 10.0, 8), this.antiqueGoldMat);
          pendulumShaft.position.set(-side * 4.6, 5.0, 0);
          workshop.add(pendulumShaft);

          const pendulumBob = new THREE.Mesh(this.getCylinder(1.5, 1.5, 0.45, 16), this.antiqueGoldMat);
          pendulumBob.position.set(-side * 4.6, 0.5, 0);
          pendulumBob.rotation.x = Math.PI / 2;
          workshop.add(pendulumBob);

          // Rows of testing gear wheels on exterior work stands
          [-6.0, 6.0].forEach((gz) => {
            const bench = new THREE.Mesh(this.getBox(1.4, 2.5, 3.5), this.steamedOakMat);
            bench.position.set(-side * 4.4, 1.25, gz);
            workshop.add(bench);

            const testGear = this.buildGearMesh(1.5, 10, 0.25, this.agedBrassMat);
            testGear.position.set(-side * 4.4, 3.8, gz);
            testGear.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
            workshop.add(testGear);
            director.registerGear(testGear, -1.0 * side, 'z');
          });

          // Large Boiler Accumulator Tanks with copper bands
          [-6.5, 6.5].forEach((bz) => {
            const tank = new THREE.Mesh(this.getCylinder(1.6, 1.6, 8.0, 12), this.burnishedCopperMat);
            tank.position.set(side * 3.5, 18.0, bz);
            workshop.add(tank);

            const band = new THREE.Mesh(this.getCylinder(1.68, 1.68, 0.35, 12), this.antiqueGoldMat);
            band.position.set(side * 3.5, 18.0, bz);
            workshop.add(band);
          });

          districtB.add(workshop);
        }
      }

      // 3. Continuous Copper Steam Pipelines with Brass Joint Flanges along track
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

    // 4. Siding Steam Locomotive Chassis on elevated platform (Solid depth down to Y = -5.65m)
    const sidingPlatform = new THREE.Mesh(this.getBox(6.5, 6.0, 26.0), this.darkBronzeMat);
    sidingPlatform.position.set(curbEdge + 9.5, -2.65, -chunkLength * 0.45);
    districtB.add(sidingPlatform);

    const platformWood = new THREE.Mesh(this.getBox(6.8, 0.4, 26.2), this.steamedOakMat);
    platformWood.position.set(curbEdge + 9.5, 0.8, -chunkLength * 0.45);
    districtB.add(platformWood);

    const parkedLoco = this.buildChronoKingdomShowcaseTrain(curbEdge + 9.5, 1.0, -chunkLength * 0.45);
    districtB.add(parkedLoco);

    // 5. Blockbuster Spectacle: The Transforming Clockwork City (Event D)
    this.spawnTransformingCity(districtB, director, worldZ, roadbedWidth);
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
    director: ChronoKingdomEventDirector,
    variant: number = 0,
    worldZ: number = 0
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

      // 2. HERO OBSERVATORY ARCHITECTURE: 3 RICH DISTRICT VARIANTS
      if (variant === 0) {
        // --- VARIANT 0: CELESTIAL ASTROLABE PALACE (Astrolabe Pavilion & Celestial Alignment) ---
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

        // Mounted Celestial Astrolabe Dial
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
      } else if (variant === 1) {
        // --- VARIANT 1: DEEP-SPACE ZENITH TELESCOPE (18m Refractor & Star Charts) ---
        // Star Chart Pavilions along promenade
        for (let sz = 16; sz < chunkLength - 16; sz += 44) {
          const starPavilion = new THREE.Group();
          starPavilion.position.set(side * (curbEdge + 6.5), 0.35, -sz);

          const spPlinth = new THREE.Mesh(this.getBox(3.0, 6.0, 10.0), this.darkBronzeMat);
          spPlinth.position.y = -3.0;
          starPavilion.add(spPlinth);

          const spWall = new THREE.Mesh(this.getBox(2.0, 12.0, 9.5), this.darkIronstoneMat);
          spWall.position.y = 6.0;
          starPavilion.add(spWall);

          // Star Chart Canvas Dial
          const starTex = ChronoKingdomTextureHelper.getStarChartTexture();
          const starChartMesh = new THREE.Mesh(
            this.getCircle(3.4, 24),
            this.createStandardMaterial({
              map: starTex,
              roughness: 0.30,
              metalness: 0.40,
              emissive: 0x090d16,
              emissiveIntensity: 0.35,
              side: THREE.DoubleSide
            })
          );
          starChartMesh.position.set(-side * 1.05, 6.0, 0);
          starChartMesh.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          starPavilion.add(starChartMesh);

          const starBezel = new THREE.Mesh(this.getTorus(3.45, 0.20, 6, 24), this.antiqueGoldMat);
          starBezel.position.set(-side * 1.06, 6.0, 0);
          starBezel.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          starPavilion.add(starBezel);

          districtC.add(starPavilion);
        }
      } else {
        // --- VARIANT 2: PLANETARY ORRERY GARDEN (Multi-tier Stepped Amphitheater) ---
        for (let oz = 20; oz < chunkLength - 20; oz += 50) {
          const orreryTerrace = new THREE.Group();
          orreryTerrace.position.set(side * (curbEdge + 9.5), 0.35, -oz);

          const tPlinth = new THREE.Mesh(this.getBox(12.0, 6.0, 20.0), this.darkBronzeMat);
          tPlinth.position.y = -3.0;
          orreryTerrace.add(tPlinth);

          // Stepped Terrace Tiers
          [0, 1, 2].forEach((tier) => {
            const step = new THREE.Mesh(this.getBox(10.0 - tier * 2.0, 1.2, 18.0 - tier * 3.0), this.midnightSteelMat);
            step.position.y = 0.6 + tier * 1.2;
            orreryTerrace.add(step);
          });

          // Sundial Obelisk
          const obelisk = new THREE.Mesh(this.getCylinder(0.3, 0.6, 9.0, 4), this.burnishedCopperMat);
          obelisk.position.set(-side * 1.5, 8.5, 0);
          obelisk.rotation.y = Math.PI / 4;
          orreryTerrace.add(obelisk);

          const gnomon = new THREE.Mesh(this.getBox(0.12, 3.5, 0.8), this.antiqueGoldMat);
          gnomon.position.set(-side * 1.5, 11.5, 0);
          gnomon.rotation.z = side * 0.45;
          orreryTerrace.add(gnomon);

          districtC.add(orreryTerrace);
        }
      }
    });

    if (variant === 0) {
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

      // Surprise 2: The Celestial Alignment
      director.registerCelestialAlignment(outerRing, middleRing, innerRing, orrerySun, undefined, 4.5, 18.0);

      observatoryGroup.add(ringsGroup);
      districtC.add(observatoryGroup);
    } else if (variant === 1) {
      // --- VARIANT 1: 18m Deep-Space Zenith Telescope Complex ---
      const telescopeComplex = new THREE.Group();
      telescopeComplex.position.set(-curbEdge - 15.0, 0.35, -chunkLength * 0.5);

      const tPlinth = new THREE.Mesh(this.getCylinder(13.0, 13.5, 6.0, 16), this.darkBronzeMat);
      tPlinth.position.y = -3.0;
      telescopeComplex.add(tPlinth);

      const rotunda = new THREE.Mesh(this.getCylinder(11.5, 12.5, 16.0, 16), this.midnightSteelMat);
      rotunda.position.y = 8.0;
      telescopeComplex.add(rotunda);

      // Slotted Dome with open observation slit
      const dome = new THREE.Mesh(this.getSphere(11.0, 16), this.burnishedCopperMat);
      dome.position.y = 19.0;
      dome.scale.set(1.0, 0.8, 1.0);
      telescopeComplex.add(dome);

      // 18m Angled Brass Refractor Telescope Tube pointing 45 degrees into zenith
      const telescopeTube = new THREE.Group();
      telescopeTube.position.set(0, 24.0, 0);
      telescopeTube.rotation.z = -Math.PI * 0.25;

      const mainBarrel = new THREE.Mesh(this.getCylinder(0.85, 1.1, 18.0, 12), this.antiqueGoldMat);
      telescopeTube.add(mainBarrel);

      const brassRings = [-6.0, -2.0, 2.0, 6.0];
      brassRings.forEach((ry) => {
        const bRing = new THREE.Mesh(this.getCylinder(1.15, 1.15, 0.35, 12), this.burnishedCopperMat);
        bRing.position.y = ry;
        telescopeTube.add(bRing);
      });

      // Objective Lens with Celestial Glow
      const lens = new THREE.Mesh(this.getCircle(1.12, 16), this.warmGlassAmberMat);
      lens.position.y = 9.05;
      lens.rotation.x = -Math.PI / 2;
      telescopeTube.add(lens);

      telescopeComplex.add(telescopeTube);
      districtC.add(telescopeComplex);

      // Overhead Armillary Archway across track at Y = 17.5m
      const armillaryArch = new THREE.Group();
      armillaryArch.position.set(0, 17.5, -chunkLength * 0.5);

      const archSpan = new THREE.Mesh(this.getTorus(curbEdge + 4.5, 0.45, 6, 24), this.antiqueGoldMat);
      archSpan.rotation.x = Math.PI / 2;
      armillaryArch.add(archSpan);

      const centerSphere = new THREE.Mesh(this.getTorus(2.2, 0.18, 6, 16), this.burnishedCopperMat);
      armillaryArch.add(centerSphere);
      districtC.add(armillaryArch);
    } else {
      // --- VARIANT 2: Multi-Ring Planetary Orrery Structure ---
      const orreryRotunda = new THREE.Group();
      orreryRotunda.position.set(-curbEdge - 15.0, 0.35, -chunkLength * 0.5);

      const rPlinth = new THREE.Mesh(this.getCylinder(12.0, 12.5, 6.0, 16), this.darkBronzeMat);
      rPlinth.position.y = -3.0;
      orreryRotunda.add(rPlinth);

      const rBase = new THREE.Mesh(this.getCylinder(10.5, 11.5, 14.0, 16), this.darkIronstoneMat);
      rBase.position.y = 7.0;
      orreryRotunda.add(rBase);

      // 5 Orbital Concentric Rings with Planets
      const orbitGroup = new THREE.Group();
      orbitGroup.position.set(0, 22.0, 0);

      [
        { r: 2.8, mat: this.antiqueGoldMat, size: 0.4 },
        { r: 4.5, mat: this.burnishedCopperMat, size: 0.55 },
        { r: 6.4, mat: this.celestialBlueMat, size: 0.6 },
        { r: 8.2, mat: this.furnaceFireMat, size: 0.5 },
        { r: 10.2, mat: this.antiqueGoldMat, size: 0.85 }
      ].forEach((orb, oIdx) => {
        const ring = new THREE.Mesh(this.getTorus(orb.r, 0.15, 6, 24), this.agedBrassMat);
        orbitGroup.add(ring);

        const planet = new THREE.Mesh(this.getSphere(orb.size, 8), orb.mat);
        planet.position.set(Math.cos(oIdx * 1.2) * orb.r, 0, Math.sin(oIdx * 1.2) * orb.r);
        orbitGroup.add(planet);
      });

      director.registerGear(orbitGroup, 0.6, 'y');
      orreryRotunda.add(orbitGroup);
      districtC.add(orreryRotunda);

      // Overhead Degree Ring Viaduct across tracks at Y = 17.0m
      const degreeArch = new THREE.Group();
      degreeArch.position.set(0, 17.0, -chunkLength * 0.5);

      const dRing = new THREE.Mesh(this.getTorus(curbEdge + 4.2, 0.45, 6, 24), this.burnishedCopperMat);
      dRing.rotation.x = Math.PI / 2;
      degreeArch.add(dRing);
      districtC.add(degreeArch);
    }

    // 4. Blockbuster Spectacle: The Great Time Rift (Scene B Quality Gate)
    this.spawnGreatTimeRift(districtC, director, worldZ, -1);

    // 5. High-Value Surprise: The Pendulum Cathedral
    if (variant === 1 || variant === 2) {
      this.spawnPendulumCathedral(districtC, director, worldZ, 1);
    }
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
    director: ChronoKingdomEventDirector,
    variant: number = 0,
    worldZ: number = 0
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

      // 2. HERO FRACTURED ARCHITECTURE: 3 RICH DISTRICT VARIANTS
      if (variant === 0) {
        // --- VARIANT 0: ANCHORED TEMPORAL STASIS RIFT (Stasis Chambers & Portal) ---
        for (let z = 12; z < chunkLength - 12; z += 38) {
          const fragmentGroup = new THREE.Group();
          fragmentGroup.position.set(side * (curbEdge + 12.0), 0.35, -z);

          // Subterranean Anchor Plinth down to Y = -5.65m
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

          // Glowing Celestial Teal Energy Beams with Brass Collar Fittings
          [-3.5, 3.5].forEach((ex) => {
            const beam = new THREE.Mesh(this.getCylinder(0.12, 0.12, 10.0, 6), this.glowingCyanMat);
            beam.position.set(ex, 12.5, 0);
            fragmentGroup.add(beam);

            const collar = new THREE.Mesh(this.getCylinder(0.3, 0.3, 0.6, 8), this.antiqueGoldMat);
            collar.position.set(ex, 8.0, 0);
            fragmentGroup.add(collar);
          });

          // Hovering Floating Clockwork Block
          const floatingBlock = new THREE.Mesh(this.getBox(9.0, 9.0, 14.0), this.midnightSteelMat);
          floatingBlock.position.set(0, 18.0, 0);
          floatingBlock.rotation.set(0.12, side * 0.25, 0.18);
          fragmentGroup.add(floatingBlock);

          // Distorted/Warped Clock Face on floating block
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
      } else if (variant === 1) {
        // --- VARIANT 1: THE CLOCKWORK PARADOX (Inverted Suspended Architecture) ---
        for (let z = 14; z < chunkLength - 14; z += 44) {
          const paradoxGroup = new THREE.Group();
          paradoxGroup.position.set(side * (curbEdge + 12.0), 0.35, -z);

          // Subterranean Plinth down to Y = -5.65m
          const plinth = new THREE.Mesh(this.getBox(14.0, 6.0, 20.0), this.darkBronzeMat);
          plinth.position.y = -3.0;
          paradoxGroup.add(plinth);

          // Heavy Ground Anchor Base with Stasis Emitters
          const aBase = new THREE.Mesh(this.getBox(12.0, 8.0, 18.0), this.darkBronzeMat);
          aBase.position.y = 4.0;
          paradoxGroup.add(aBase);

          // Vertical Stasis Beacons projecting upward
          [-5.0, 5.0].forEach((bx) => {
            const beaconPillar = new THREE.Mesh(this.getCylinder(0.4, 0.6, 12.0, 8), this.burnishedCopperMat);
            beaconPillar.position.set(bx, 10.0, 0);
            paradoxGroup.add(beaconPillar);

            const beaconCap = new THREE.Mesh(this.getSphere(0.85, 10), this.warmGlassAmberMat);
            beaconCap.position.set(bx, 16.5, 0);
            paradoxGroup.add(beaconCap);
          });

          // Inverted Suspended Cathedral Tower hanging from overhead (Y = 12m to 28m)
          const invTower = new THREE.Group();
          invTower.position.set(0, 20.0, 0);
          invTower.rotation.z = Math.PI; // Inverted!

          const invBody = new THREE.Mesh(this.getBox(7.0, 12.0, 12.0), this.midnightSteelMat);
          invTower.add(invBody);

          const invSpire = new THREE.Mesh(this.getCylinder(0.2, 3.5, 9.0, 8), this.antiqueGoldMat);
          invSpire.position.y = 10.5;
          invTower.add(invSpire);

          paradoxGroup.add(invTower);

          // Counter-Revolving Gear Arches hovering in stasis
          const pGear1 = this.buildGearMesh(3.2, 14, 0.35, this.antiqueGoldMat);
          pGear1.position.set(-side * 4.4, 18.0, -3.5);
          pGear1.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          paradoxGroup.add(pGear1);
          director.registerGear(pGear1, 1.2 * side, 'z');

          const pGear2 = this.buildGearMesh(2.2, 10, 0.35, this.burnishedCopperMat);
          pGear2.position.set(-side * 4.4, 18.0, 3.5);
          pGear2.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          paradoxGroup.add(pGear2);
          director.registerGear(pGear2, -1.2 * side, 'z');

          districtD.add(paradoxGroup);
        }
      } else {
        // --- VARIANT 2: TIME-SHATTERED HOROLOGIUM (Fragmented Exploded Clockwork) ---
        for (let z = 16; z < chunkLength - 16; z += 46) {
          const shatteredGroup = new THREE.Group();
          shatteredGroup.position.set(side * (curbEdge + 12.0), 0.35, -z);

          // Subterranean Plinth down to Y = -5.65m
          const plinth = new THREE.Mesh(this.getBox(14.0, 6.0, 22.0), this.darkBronzeMat);
          plinth.position.y = -3.0;
          shatteredGroup.add(plinth);

          const sBase = new THREE.Mesh(this.getBox(12.0, 6.0, 18.0), this.darkIronstoneMat);
          sBase.position.y = 3.0;
          shatteredGroup.add(sBase);

          // Fragment 1: Lower Foundation Shard (tilted 15 degrees)
          const frag1 = new THREE.Mesh(this.getBox(8.0, 8.0, 10.0), this.darkBronzeMat);
          frag1.position.set(0, 9.0, -2.0);
          frag1.rotation.set(0.15, side * 0.2, 0.1);
          shatteredGroup.add(frag1);

          // Fragment 2: Mid Dial Shard (tilted -20 degrees) with Frozen Dial
          const frag2 = new THREE.Mesh(this.getBox(7.5, 7.5, 9.0), this.midnightSteelMat);
          frag2.position.set(side * 1.5, 17.0, 2.0);
          frag2.rotation.set(-0.25, side * 0.3, -0.15);

          const frozenDial = new THREE.Mesh(this.getCircle(2.8, 20), this.warmGlassAmberMat);
          frozenDial.position.set(-side * 3.8, 0, 0);
          frozenDial.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
          frag2.add(frozenDial);
          shatteredGroup.add(frag2);

          // Fragment 3: Spire Shard (floating high at Y = 26m)
          const frag3 = new THREE.Mesh(this.getCylinder(0.2, 3.0, 10.0, 8), this.burnishedCopperMat);
          frag3.position.set(-side * 1.0, 26.0, 0);
          frag3.rotation.set(0.3, 0.2, side * 0.4);
          shatteredGroup.add(frag3);

          // Heavy Copper Mooring Cables connecting fragments
          [-2.5, 2.5].forEach((cx) => {
            const cable = new THREE.Mesh(this.getCylinder(0.08, 0.08, 16.0, 6), this.burnishedCopperMat);
            cable.position.set(cx, 16.0, 0);
            shatteredGroup.add(cable);
          });

          // Floating Gear Shards rotating around centroid
          const sGear = this.buildGearMesh(2.8, 12, 0.35, this.antiqueGoldMat);
          sGear.position.set(0, 18.0, 0);
          sGear.rotation.x = Math.PI / 3;
          shatteredGroup.add(sGear);
          director.registerGear(sGear, 0.8 * side, 'y');

          districtD.add(shatteredGroup);
        }
      }
    });

    if (variant === 0) {
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

      // Swirling Central Temporal Vortex with refined stasis palette
      const vortexTex = ChronoKingdomTextureHelper.getVortexTexture();
      const vortexCore = new THREE.Mesh(
        this.getPlane(20.0, 20.0),
        this.createBasicMaterial({
          map: vortexTex,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      portalGroup.add(vortexCore);

      director.registerTimePortal(portalOuter, portalInner, vortexCore);
      districtD.add(portalGroup);
    } else if (variant === 1) {
      // Overhead Paradox Ring Arch across tracks at Y = 18.0m
      const paradoxArch = new THREE.Group();
      paradoxArch.position.set(0, 18.0, -chunkLength * 0.5);

      const ringOuter = new THREE.Mesh(this.getTorus(curbEdge + 4.5, 0.55, 6, 24), this.antiqueGoldMat);
      ringOuter.rotation.x = Math.PI / 2;
      paradoxArch.add(ringOuter);

      const ringInner = new THREE.Mesh(this.getTorus(curbEdge + 2.5, 0.45, 6, 24), this.burnishedCopperMat);
      ringInner.rotation.x = Math.PI / 2;
      paradoxArch.add(ringInner);

      districtD.add(paradoxArch);
    } else {
      // Overhead Temporal Stasis Archway across tracks at Y = 17.0m
      const stasisArch = new THREE.Group();
      stasisArch.position.set(0, 17.0, -chunkLength * 0.5);

      const archTruss = new THREE.Mesh(this.getBox((curbEdge + 6.0) * 2, 1.8, 3.5), this.darkBronzeMat);
      stasisArch.add(archTruss);

      [-curbEdge - 2.0, 0, curbEdge + 2.0].forEach((cx) => {
        const coil = new THREE.Mesh(this.getTorus(1.4, 0.25, 6, 16), this.warmGlassAmberMat);
        coil.position.x = cx;
        stasisArch.add(coil);
      });

      districtD.add(stasisArch);
    }

    // 4. Blockbuster Spectacle: The Mechanical Dragon (Event C)
    this.spawnMechanicalDragon(districtD, director, worldZ);

    // 5. High-Value Surprise: The Giant Hourglass
    if (variant === 0 || variant === 2) {
      this.spawnGiantHourglass(districtD, director, worldZ, 1);
    }
  }

  // =========================================================================
  // BLOCKBUSTER CINEMATIC SPECTACLE SPAWNERS (LEVEL 3 EVENTS & HIGH-VALUE SURPRISES)
  // =========================================================================

  /**
   * Blockbuster Scene A Quality Gate: The Clockwork Titan Awakens
   */
  public spawnClockworkTitan(
    parent: THREE.Group,
    director: ChronoKingdomEventDirector,
    worldZ: number = 0,
    side: number = 1
  ): THREE.Group {
    const titanGroup = new THREE.Group();
    titanGroup.name = 'blockbuster_clockwork_titan';
    const tx = side * 12.0;
    const tz = -50.0;
    titanGroup.position.set(tx, 0, tz);
    titanGroup.rotation.y = -side * 0.22;

    // 1. Deep Subterranean Foundation Pedestal down to Y = -5.65m (Zero floating geometry)
    const plinthDepth = 6.0;
    const plinth = new THREE.Mesh(this.getBox(8.4, plinthDepth, 8.4), this.darkIronstoneMat);
    plinth.position.set(0, 0.35 - plinthDepth * 0.5, 0);
    titanGroup.add(plinth);

    // Imperial Colossus Alcove Backdrop (zero clipping, solid depth down to Y = -5.65m)
    const backdropGroup = new THREE.Group();
    backdropGroup.position.set(5.2, 0, 0);
    const backPlinth = new THREE.Mesh(this.getBox(3.2, plinthDepth, 18.0), this.darkIronstoneMat);
    backPlinth.position.set(0, 0.35 - plinthDepth * 0.5, 0);
    backdropGroup.add(backPlinth);

    const backWall = new THREE.Mesh(this.getBox(2.6, 24.0, 16.0), this.midnightSteelMat);
    backWall.position.set(0, 12.0, 0);
    backdropGroup.add(backWall);

    [-7.2, 7.2].forEach((cz) => {
      const col = new THREE.Mesh(this.getCylinder(0.65, 0.85, 24.0, 10), this.antiqueGoldMat);
      col.position.set(-1.1, 12.0, cz);
      backdropGroup.add(col);
    });

    const archPediment = new THREE.Mesh(this.getBox(3.4, 2.6, 17.5), this.burnishedCopperMat);
    archPediment.position.set(0, 24.5, 0);
    backdropGroup.add(archPediment);

    const alcoveGear = this.buildGearMesh(3.8, 16, 0.3, this.antiqueGoldMat);
    alcoveGear.position.set(-1.2, 18.0, 0);
    alcoveGear.rotation.y = Math.PI * 0.5;
    backdropGroup.add(alcoveGear);
    director.registerGear(alcoveGear, -0.4, 'z');

    titanGroup.add(backdropGroup);

    // Tiered plinth cap with carved classical moldings and brass relief frieze
    const plinthCap1 = new THREE.Mesh(this.getBox(8.8, 0.45, 8.8), this.burnishedCopperMat);
    plinthCap1.position.set(0, 0.55, 0);
    titanGroup.add(plinthCap1);

    const plinthCap2 = new THREE.Mesh(this.getBox(8.2, 0.35, 8.2), this.antiqueGoldMat);
    plinthCap2.position.set(0, 0.85, 0);
    titanGroup.add(plinthCap2);

    // 4 Heavy Octagonal Anchor Bolts with brass nut plates
    [-3.6, 3.6].forEach((bx) => {
      [-3.6, 3.6].forEach((bz) => {
        const bolt = new THREE.Mesh(this.getCylinder(0.28, 0.32, 0.45, 8), this.agedBrassMat);
        bolt.position.set(bx, 1.05, bz);
        titanGroup.add(bolt);
      });
    });

    // Pedestal relief clockwork ring on front facade
    const baseReliefGear = this.buildGearMesh(2.2, 12, 0.18, this.antiqueGoldMat);
    baseReliefGear.position.set(0, 0.35, 4.25);
    titanGroup.add(baseReliefGear);

    // 2. Nearby City Response: Street Steam Vents & Resonant Gas Lanterns
    const cityVents: THREE.Mesh[] = [];
    const cityLanterns: THREE.Mesh[] = [];
    [-4.5, 4.5].forEach((vx) => {
      // Curb-side brass steam grate
      const grateRim = new THREE.Mesh(this.getCylinder(0.75, 0.75, 0.15, 12), this.agedBrassMat);
      grateRim.position.set(vx, 0.4, -4.8);
      titanGroup.add(grateRim);

      const ventSteam = new THREE.Mesh(this.getSphere(0.85, 8), this.steamPuffMat);
      ventSteam.position.set(vx, 1.4, -4.8);
      ventSteam.visible = false;
      titanGroup.add(ventSteam);
      cityVents.push(ventSteam);

      // Ornate Victorian Street Lantern
      const lampPost = new THREE.Mesh(this.getCylinder(0.12, 0.18, 4.2, 8), this.darkBronzeMat);
      lampPost.position.set(vx * 0.8, 2.45, 4.2);
      titanGroup.add(lampPost);

      const lampLantern = new THREE.Mesh(this.getCylinder(0.35, 0.25, 0.8, 6), this.warmGlassAmberMat);
      lampLantern.position.set(vx * 0.8, 4.7, 4.2);
      titanGroup.add(lampLantern);
      cityLanterns.push(lampLantern);
    });

    // 3. Colossal Articulated Legs, Armored Greaves & Hydraulic Pistons
    const legPistons: THREE.Object3D[] = [];
    [-2.2, 2.2].forEach((lx) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(lx, 0.85, 0);
      titanGroup.add(legGroup);

      // Armored Sabatons (Foot)
      const footBox = new THREE.Mesh(this.getBox(2.2, 0.9, 3.2), this.darkBronzeMat);
      footBox.position.set(0, 0.45, 0.3);
      legGroup.add(footBox);

      const toePlate = new THREE.Mesh(this.getBox(2.0, 0.5, 1.2), this.antiqueGoldMat);
      toePlate.position.set(0, 0.25, 1.6);
      legGroup.add(toePlate);

      // Segmented Shin Greave
      const shinCore = new THREE.Mesh(this.getBox(1.9, 5.2, 2.2), this.midnightSteelMat);
      shinCore.position.set(0, 3.4, 0);
      legGroup.add(shinCore);

      const shinArmorPlate = new THREE.Mesh(this.getBox(1.7, 4.4, 0.6), this.darkBronzeMat);
      shinArmorPlate.position.set(0, 3.4, 1.15);
      legGroup.add(shinArmorPlate);

      const calfCowling = new THREE.Mesh(this.getBox(1.7, 3.8, 0.6), this.burnishedCopperMat);
      calfCowling.position.set(0, 3.2, -1.15);
      legGroup.add(calfCowling);

      // Articulated Hydraulic Knee Pistons (outer and inner)
      [-1.05, 1.05].forEach((px) => {
        const pistonCylinder = new THREE.Mesh(this.getCylinder(0.18, 0.22, 2.4, 8), this.midnightSteelMat);
        pistonCylinder.position.set(px, 4.2, 0);
        legGroup.add(pistonCylinder);

        const pistonRod = new THREE.Mesh(this.getCylinder(0.10, 0.10, 1.8, 8), this.agedBrassMat);
        pistonRod.position.set(px, 5.2, 0);
        legGroup.add(pistonRod);
        legPistons.push(pistonRod);
      });

      // Massive Knee Spur Gear
      const kneeGear = this.buildGearMesh(1.2, 10, 0.32, this.antiqueGoldMat);
      kneeGear.position.set(0, 6.2, 0.95);
      legGroup.add(kneeGear);

      // Thigh Casing
      const thighMesh = new THREE.Mesh(this.getBox(2.1, 3.4, 2.4), this.burnishedCopperMat);
      thighMesh.position.set(0, 7.8, 0);
      legGroup.add(thighMesh);
    });

    // 4. Pelvis & Articulated Gear Housing
    const pelvisHousing = new THREE.Mesh(this.getBox(5.6, 1.8, 3.8), this.darkBronzeMat);
    pelvisHousing.position.set(0, 9.8, 0);
    titanGroup.add(pelvisHousing);

    const waistRing = new THREE.Mesh(this.getTorus(2.8, 0.40, 8, 24), this.antiqueGoldMat);
    waistRing.position.set(0, 9.8, 0);
    waistRing.rotation.x = Math.PI / 2;
    titanGroup.add(waistRing);

    // 5. Heavy Armored Torso & Recessed Clockwork Engine Cavity
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 10.7, 0);
    titanGroup.add(torsoGroup);

    // Torso Frame & Interior Cavity
    const torsoFrame = new THREE.Mesh(this.getBox(5.6, 6.2, 3.8), this.midnightSteelMat);
    torsoFrame.position.set(0, 3.1, 0);
    torsoGroup.add(torsoFrame);

    // Recessed Clockwork Engine Cavity (Dark ironstone chamber background)
    const engineChamber = new THREE.Mesh(this.getBox(4.4, 4.8, 1.2), this.darkIronstoneMat);
    engineChamber.position.set(0, 3.1, 1.4);
    torsoGroup.add(engineChamber);

    // Multi-tier Gear Train (Sun gear, 2 planet gears, escapement wheel)
    const coreGears: THREE.Object3D[] = [];
    const sunGear = this.buildGearMesh(1.4, 14, 0.22, this.antiqueGoldMat);
    sunGear.position.set(0.0, 3.4, 1.95);
    torsoGroup.add(sunGear);
    coreGears.push(sunGear);

    const planetGear1 = this.buildGearMesh(0.95, 10, 0.20, this.burnishedCopperMat);
    planetGear1.position.set(-1.15, 4.3, 1.95);
    torsoGroup.add(planetGear1);
    coreGears.push(planetGear1);

    const planetGear2 = this.buildGearMesh(0.75, 8, 0.18, this.agedBrassMat);
    planetGear2.position.set(1.15, 2.5, 1.95);
    torsoGroup.add(planetGear2);
    coreGears.push(planetGear2);

    // Pulsing Temporal Reactor Core with Concentric Orbit Rings
    const reactorCoreGroup = new THREE.Group();
    reactorCoreGroup.position.set(0, 2.2, 1.9);
    torsoGroup.add(reactorCoreGroup);

    const coreMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85 });
    CurvedShaderManager.getInstance().applyCurvature(coreMat);
    const coreMesh = new THREE.Mesh(this.getSphere(0.9, 14), coreMat);
    reactorCoreGroup.add(coreMesh);

    const orbitRing1 = new THREE.Mesh(this.getTorus(1.2, 0.08, 6, 16), this.antiqueGoldMat);
    orbitRing1.rotation.x = Math.PI / 4;
    reactorCoreGroup.add(orbitRing1);

    const orbitRing2 = new THREE.Mesh(this.getTorus(1.4, 0.08, 6, 16), this.burnishedCopperMat);
    orbitRing2.rotation.y = Math.PI / 4;
    reactorCoreGroup.add(orbitRing2);

    // 6. Unfolding Bi-Fold Pectoral Cuirass Armor Wings
    const cuirassLeft = new THREE.Group();
    cuirassLeft.position.set(-2.4, 3.2, 2.0);
    torsoGroup.add(cuirassLeft);

    const armorWingL = new THREE.Mesh(this.getBox(2.3, 4.6, 0.45), this.darkBronzeMat);
    armorWingL.position.set(1.15, 0, 0);
    cuirassLeft.add(armorWingL);

    const armorCrestL = new THREE.Mesh(this.getBox(1.9, 3.8, 0.25), this.burnishedCopperMat);
    armorCrestL.position.set(1.15, 0, 0.25);
    cuirassLeft.add(armorCrestL);

    const armorRivetL = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.35, 6), this.antiqueGoldMat);
    armorRivetL.position.set(1.9, 1.6, 0.35);
    armorRivetL.rotation.x = Math.PI / 2;
    cuirassLeft.add(armorRivetL);

    const cuirassRight = new THREE.Group();
    cuirassRight.position.set(2.4, 3.2, 2.0);
    torsoGroup.add(cuirassRight);

    const armorWingR = new THREE.Mesh(this.getBox(2.3, 4.6, 0.45), this.darkBronzeMat);
    armorWingR.position.set(-1.15, 0, 0);
    cuirassRight.add(armorWingR);

    const armorCrestR = new THREE.Mesh(this.getBox(1.9, 3.8, 0.25), this.burnishedCopperMat);
    armorCrestR.position.set(-1.15, 0, 0.25);
    cuirassRight.add(armorCrestR);

    const armorRivetR = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.35, 6), this.antiqueGoldMat);
    armorRivetR.position.set(-1.9, 1.6, 0.35);
    armorRivetR.rotation.x = Math.PI / 2;
    cuirassRight.add(armorRivetR);

    // Twin Exhaust Stacks at rear
    const exhaustPipes: THREE.Object3D[] = [];
    const steamPlumes: THREE.Mesh[] = [];
    [-1.8, 1.8].forEach((px) => {
      const pipe = new THREE.Mesh(this.getCylinder(0.42, 0.48, 3.6, 8), this.darkIronstoneMat);
      pipe.position.set(px, 6.4, -1.8);
      torsoGroup.add(pipe);
      exhaustPipes.push(pipe);

      const pipeRim = new THREE.Mesh(this.getCylinder(0.55, 0.44, 0.45, 8), this.antiqueGoldMat);
      pipeRim.position.set(px, 8.2, -1.8);
      torsoGroup.add(pipeRim);

      const steamPuff = new THREE.Mesh(this.getSphere(0.9, 8), this.steamPuffMat);
      steamPuff.position.set(px, 9.2, -1.8);
      steamPuff.visible = false;
      torsoGroup.add(steamPuff);
      steamPlumes.push(steamPuff);
    });

    // 7. Sculpted Articulated Head & Imperial Chronometer Crown
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 6.6, 0.6);
    torsoGroup.add(headGroup);

    // Chiseled Bronze Jaw & Faceplate
    const headVisage = new THREE.Mesh(this.getBox(2.2, 2.4, 2.0), this.darkBronzeMat);
    headVisage.position.set(0, 1.2, 0);
    headGroup.add(headVisage);

    const cheekPlateL = new THREE.Mesh(this.getBox(0.4, 1.8, 1.4), this.burnishedCopperMat);
    cheekPlateL.position.set(-1.15, 1.1, 0.1);
    headGroup.add(cheekPlateL);

    const cheekPlateR = new THREE.Mesh(this.getBox(0.4, 1.8, 1.4), this.burnishedCopperMat);
    cheekPlateR.position.set(1.15, 1.1, 0.1);
    headGroup.add(cheekPlateR);

    // Furrowed Aged Brass Brow
    const brow = new THREE.Mesh(this.getBox(2.3, 0.4, 0.6), this.agedBrassMat);
    brow.position.set(0, 2.0, 0.95);
    headGroup.add(brow);

    // Imperial Chronometer Diadem Crown
    const crownBase = new THREE.Mesh(this.getCylinder(1.4, 1.2, 0.6, 12), this.antiqueGoldMat);
    crownBase.position.set(0, 2.6, 0);
    headGroup.add(crownBase);

    const crownSpire = new THREE.Mesh(this.getCylinder(0.2, 0.5, 1.4, 8), this.antiqueGoldMat);
    crownSpire.position.set(0, 3.6, 0);
    headGroup.add(crownSpire);

    // Glowing Optical Sensor Eyes with Brass Bezels
    const eyes: THREE.Mesh[] = [];
    [-0.55, 0.55].forEach((ex) => {
      const bezel = new THREE.Mesh(this.getCylinder(0.32, 0.32, 0.2, 8), this.agedBrassMat);
      bezel.position.set(ex, 1.5, 1.02);
      bezel.rotation.x = Math.PI / 2;
      headGroup.add(bezel);

      const eye = new THREE.Mesh(this.getSphere(0.24, 8), this.warmGlassAmberMat);
      eye.position.set(ex, 1.5, 1.12);
      headGroup.add(eye);
      eyes.push(eye);
    });

    // 8. Articulated Right Arm (Grand Imperial Salute)
    const armRightGroup = new THREE.Group();
    armRightGroup.position.set(3.2, 5.4, 0);
    torsoGroup.add(armRightGroup);

    // Lamellar Shoulder Pauldron
    const pauldronR = new THREE.Mesh(this.getSphere(1.6, 8), this.burnishedCopperMat);
    pauldronR.scale.set(1.2, 1.0, 1.4);
    pauldronR.position.set(0.6, 0.4, 0);
    armRightGroup.add(pauldronR);

    const shoulderR = this.buildGearMesh(1.3, 12, 0.32, this.antiqueGoldMat);
    shoulderR.rotation.y = Math.PI / 2;
    armRightGroup.add(shoulderR);

    const upperArmR = new THREE.Mesh(this.getBox(1.5, 3.8, 1.5), this.burnishedCopperMat);
    upperArmR.position.set(0.6, -2.0, 0);
    armRightGroup.add(upperArmR);

    const forearmRightGroup = new THREE.Group();
    forearmRightGroup.position.set(0.6, -3.8, 0);
    armRightGroup.add(forearmRightGroup);

    const elbowGearR = this.buildGearMesh(0.95, 10, 0.28, this.antiqueGoldMat);
    elbowGearR.rotation.y = Math.PI / 2;
    forearmRightGroup.add(elbowGearR);

    const lowerArmR = new THREE.Mesh(this.getBox(1.3, 3.6, 1.3), this.midnightSteelMat);
    lowerArmR.position.set(0, -1.8, 0);
    forearmRightGroup.add(lowerArmR);

    const gauntletR = new THREE.Mesh(this.getBox(1.6, 1.4, 1.6), this.antiqueGoldMat);
    gauntletR.position.set(0, -3.8, 0);
    forearmRightGroup.add(gauntletR);

    // 9. Articulated Left Arm (Commanding Guard Pose)
    const armLeftGroup = new THREE.Group();
    armLeftGroup.position.set(-3.2, 5.4, 0);
    torsoGroup.add(armLeftGroup);

    const pauldronL = new THREE.Mesh(this.getSphere(1.6, 8), this.burnishedCopperMat);
    pauldronL.scale.set(1.2, 1.0, 1.4);
    pauldronL.position.set(-0.6, 0.4, 0);
    armLeftGroup.add(pauldronL);

    const shoulderL = this.buildGearMesh(1.3, 12, 0.32, this.antiqueGoldMat);
    shoulderL.rotation.y = Math.PI / 2;
    armLeftGroup.add(shoulderL);

    const upperArmL = new THREE.Mesh(this.getBox(1.5, 3.8, 1.5), this.burnishedCopperMat);
    upperArmL.position.set(-0.6, -2.0, 0);
    armLeftGroup.add(upperArmL);

    const lowerArmL = new THREE.Mesh(this.getBox(1.3, 3.6, 1.3), this.midnightSteelMat);
    lowerArmL.position.set(-0.6, -5.6, 0);
    armLeftGroup.add(lowerArmL);

    const gauntletL = new THREE.Mesh(this.getBox(1.6, 1.4, 1.6), this.antiqueGoldMat);
    gauntletL.position.set(-0.6, -7.6, 0);
    armLeftGroup.add(gauntletL);

    // Register with Director
    const triggerZ = worldZ !== 0 ? worldZ : parent.position?.z || 0;
    director.registerClockworkTitan({
      group: titanGroup,
      triggerZ,
      state: 'DORMANT',
      torso: torsoGroup,
      head: headGroup,
      eyes,
      armLeft: armLeftGroup,
      armRight: armRightGroup,
      forearmRight: forearmRightGroup,
      cuirassLeft,
      cuirassRight,
      legPistons,
      coreGears,
      coreLight: coreMesh,
      exhaustPipes,
      steamPlumes,
      cityVents,
      cityLanterns,
      timer: 0,
      side
    });

    parent.add(titanGroup);
    return titanGroup;
  }

  /**
   * Blockbuster Scene B Quality Gate: The Great Time Rift
   */
  public spawnGreatTimeRift(
    parent: THREE.Group,
    director: ChronoKingdomEventDirector,
    worldZ: number = 0,
    side: number = -1
  ): THREE.Group {
    const riftGroup = new THREE.Group();
    riftGroup.name = 'blockbuster_time_rift';
    const rx = side * 12.5;
    const rz = -50.0;
    riftGroup.position.set(rx, 0, rz);
    riftGroup.rotation.y = -side * 0.22;

    // 1. Dual Monumental Gothic Pylons grounded to Y = -5.65m
    const pylonDepth = 6.0;
    [-4.0, 4.0].forEach((px) => {
      const plinth = new THREE.Mesh(this.getBox(3.0, pylonDepth, 3.0), this.darkIronstoneMat);
      plinth.position.set(px, 0.35 - pylonDepth * 0.5, 0);
      riftGroup.add(plinth);

      const pylon = new THREE.Mesh(this.getCylinder(1.2, 1.6, 22.0, 8), this.darkBronzeMat);
      pylon.position.set(px, 11.35, 0);
      riftGroup.add(pylon);

      const capital = new THREE.Mesh(this.getBox(2.8, 1.4, 2.8), this.antiqueGoldMat);
      capital.position.set(px, 22.5, 0);
      riftGroup.add(capital);
    });

    // 2. Heavy Transverse Arch Gantry at Y = 22.0m
    const gantry = new THREE.Mesh(this.getBox(11.0, 1.8, 2.8), this.burnishedCopperMat);
    gantry.position.set(0, 22.2, 0);
    riftGroup.add(gantry);

    // 3. Deep 3D Dimensional Portal Chamber (Recessed along -Z from Z = 0 to Z = -12m)
    const chamberGroup = new THREE.Group();
    chamberGroup.position.set(0, 16.0, 0);
    riftGroup.add(chamberGroup);

    // Outer octagonal barrel shell
    const chamberLength = 12.0;
    const chamberShell = new THREE.Mesh(this.getCylinder(6.8, 6.8, chamberLength, 8), this.darkIronstoneMat);
    chamberShell.position.set(0, 0, -chamberLength * 0.5);
    chamberShell.rotation.x = Math.PI / 2;
    chamberGroup.add(chamberShell);

    // 4 Stepped Concentric Depth Rings inside the chamber creating authentic perspective depth
    [-2.5, -5.5, -8.5, -11.0].forEach((dz, idx) => {
      const ringRadius = 6.4 - idx * 0.45;
      const ringMat = idx % 2 === 0 ? this.antiqueGoldMat : this.burnishedCopperMat;
      const stepRing = new THREE.Mesh(this.getTorus(ringRadius, 0.28, 8, 24), ringMat);
      stepRing.position.set(0, 0, dz);
      chamberGroup.add(stepRing);
    });

    // 4. Alternate Mechanical Skyline Silhouette (visible through deep portal aperture)
    const alternateSkyline = new THREE.Group();
    alternateSkyline.position.set(0, 0, -11.5);
    chamberGroup.add(alternateSkyline);

    // Miniature Inverted Clockwork Metropolis Spire Diorama
    const centerSpire = new THREE.Mesh(this.getBox(1.8, 6.5, 1.2), this.midnightSteelMat);
    centerSpire.position.set(0, -0.5, 0);
    alternateSkyline.add(centerSpire);

    const spireClockFace = new THREE.Mesh(this.getCylinder(0.85, 0.85, 0.2, 12), this.warmGlassAmberMat);
    spireClockFace.position.set(0, 1.2, 0.7);
    spireClockFace.rotation.x = Math.PI / 2;
    alternateSkyline.add(spireClockFace);

    [-2.2, 2.2].forEach((sx) => {
      const subTower = new THREE.Mesh(this.getBox(1.3, 5.0, 1.0), this.midnightSteelMat);
      subTower.position.set(sx, -1.2, 0);
      alternateSkyline.add(subTower);

      const subClock = new THREE.Mesh(this.getCylinder(0.55, 0.55, 0.15, 8), this.warmGlassAmberMat);
      subClock.position.set(sx, 0.2, 0.55);
      subClock.rotation.x = Math.PI / 2;
      alternateSkyline.add(subClock);
    });

    // Floating Celestial Gear Ring suspended inside the dimensional void
    const voidGear = this.buildGearMesh(2.4, 12, 0.16, this.antiqueGoldMat);
    voidGear.position.set(0, 2.5, 0.2);
    alternateSkyline.add(voidGear);

    // Deep Cosmic Nebula Void Backing
    const voidBacking = new THREE.Mesh(this.getCircle(6.2, 16), this.midnightSteelMat);
    voidBacking.position.set(0, 0, -0.4);
    alternateSkyline.add(voidBacking);

    // 5. Gimbal Rings & Center Aperture Assembly at Y = 16.0m
    const ringAssembly = new THREE.Group();
    ringAssembly.position.set(0, 16.0, 0);
    riftGroup.add(ringAssembly);

    // Ring 1: Outer Zodiac Ring (R = 6.5m)
    const outerRing = new THREE.Mesh(this.getTorus(6.5, 0.42, 8, 32), this.antiqueGoldMat);
    ringAssembly.add(outerRing);

    // Ring 2: Middle Escapement Ring (R = 5.0m)
    const middleRing = new THREE.Mesh(this.getTorus(5.0, 0.38, 8, 28), this.burnishedCopperMat);
    ringAssembly.add(middleRing);

    // Ring 3: Inner Celestial Gimbal Ring (R = 3.5m)
    const innerRing = new THREE.Mesh(this.getTorus(3.5, 0.32, 8, 24), this.agedBrassMat);
    ringAssembly.add(innerRing);

    // 4 Articulated Escapement Locking Dog Clamps
    const lockingClamps: THREE.Object3D[] = [];
    [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].forEach((angle) => {
      const clampPivot = new THREE.Group();
      clampPivot.position.set(Math.cos(angle) * 6.5, Math.sin(angle) * 6.5, 0);
      clampPivot.rotation.z = angle;

      const clampJaw = new THREE.Mesh(this.getBox(1.1, 1.9, 0.7), this.darkBronzeMat);
      clampJaw.position.set(0, 0.95, 0);
      clampPivot.add(clampJaw);

      const clampTooth = new THREE.Mesh(this.getBox(0.6, 0.6, 0.8), this.antiqueGoldMat);
      clampTooth.position.set(0, 1.9, 0);
      clampPivot.add(clampTooth);

      ringAssembly.add(clampPivot);
      lockingClamps.push(clampPivot);
    });

    // 6. 3D Faceted Temporal Singularity Energy Core
    const singularityGroup = new THREE.Group();
    ringAssembly.add(singularityGroup);

    // Faceted icosahedral temporal crystal
    const singularityCrystal = new THREE.Mesh(this.getIcosahedron(1.35, 0), this.warmGlassAmberMat);
    singularityGroup.add(singularityCrystal);

    // Inner pulsating singularity heart
    const singularityHeart = new THREE.Mesh(this.getSphere(0.85, 12), this.furnaceFireMat);
    singularityGroup.add(singularityHeart);

    // Counter-rotating concentric fine gimbal rings
    const coreGimbal1 = new THREE.Mesh(this.getTorus(1.85, 0.12, 6, 20), this.antiqueGoldMat);
    coreGimbal1.rotation.x = Math.PI / 3;
    singularityGroup.add(coreGimbal1);

    const coreGimbal2 = new THREE.Mesh(this.getTorus(2.35, 0.12, 6, 20), this.burnishedCopperMat);
    coreGimbal2.rotation.y = Math.PI / 3;
    singularityGroup.add(coreGimbal2);

    // Volumetric stasis lens aura
    const stasisLensMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide
    });
    CurvedShaderManager.getInstance().applyCurvature(stasisLensMat);
    const stasisLens = new THREE.Mesh(this.getSphere(3.2, 16), stasisLensMat);
    singularityGroup.add(stasisLens);

    // 8 Radiating Dimensional Energy Rays (Tapered glowing prisms)
    const energyRays: THREE.Mesh[] = [];
    for (let r = 0; r < 8; r++) {
      const rAngle = (r * Math.PI) / 4;
      const ray = new THREE.Mesh(this.getCylinder(0.04, 0.32, 5.5, 6), this.warmGlassAmberMat);
      ray.position.set(Math.cos(rAngle) * 3.0, Math.sin(rAngle) * 3.0, 0);
      ray.rotation.z = rAngle - Math.PI / 2;
      ray.visible = false;
      ringAssembly.add(ray);
      energyRays.push(ray);
    }

    // 12 Celestial Sparkles
    const sparklesGroup = new THREE.Group();
    for (let p = 0; p < 12; p++) {
      const pAngle = (p * Math.PI) / 6;
      const pRadius = 4.2 + (p % 3) * 0.8;
      const spark = new THREE.Mesh(this.getSphere(0.18, 6), this.warmGlassAmberMat);
      spark.position.set(Math.cos(pAngle) * pRadius, Math.sin(pAngle) * pRadius, (p % 2 === 0 ? 0.4 : -0.4));
      sparklesGroup.add(spark);
    }
    ringAssembly.add(sparklesGroup);

    // Register with Director
    const triggerZ = worldZ !== 0 ? worldZ : parent.position?.z || 0;
    director.registerGreatTimeRift({
      group: riftGroup,
      triggerZ,
      state: 'DORMANT',
      outerRing,
      middleRing,
      innerRing,
      lockingClamps,
      portalVortex: singularityGroup as any,
      portalChamber: chamberGroup,
      alternateSkyline,
      energySingularity: singularityGroup,
      energyRays,
      sparkles: sparklesGroup as any,
      timer: 0,
      side
    });

    parent.add(riftGroup);
    return riftGroup;
  }

  /**
   * Blockbuster Event C: The Mechanical Dragon
   */
  public spawnMechanicalDragon(
    parent: THREE.Group,
    director: ChronoKingdomEventDirector,
    worldZ: number = 0
  ): THREE.Group {
    const dragonGroup = new THREE.Group();
    dragonGroup.name = 'blockbuster_mechanical_dragon';
    const tz = -50.0;
    dragonGroup.position.set(0, 36.0, tz);

    // 1. Aerodynamic Clockwork Fuselage
    const fuselage = new THREE.Mesh(this.getBox(2.2, 1.8, 7.5), this.burnishedCopperMat);
    fuselage.position.y = 0;
    dragonGroup.add(fuselage);

    [-1.15, 1.15].forEach((sx) => {
      const scalePlate = new THREE.Mesh(this.getBox(0.2, 1.4, 6.8), this.darkBronzeMat);
      scalePlate.position.set(sx, 0.1, 0);
      dragonGroup.add(scalePlate);
    });

    // 2. Articulated Neck & Head
    const neckGroup = new THREE.Group();
    neckGroup.position.set(0, 0.4, 3.8);
    dragonGroup.add(neckGroup);

    const neckMesh = new THREE.Mesh(this.getCylinder(0.85, 1.1, 2.4, 8), this.burnishedCopperMat);
    neckMesh.position.set(0, 0.8, 0.8);
    neckMesh.rotation.x = Math.PI / 4;
    neckGroup.add(neckMesh);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.6, 1.8);
    neckGroup.add(headGroup);

    const skull = new THREE.Mesh(this.getBox(1.5, 1.1, 2.4), this.antiqueGoldMat);
    skull.position.set(0, 0.2, 0.8);
    headGroup.add(skull);

    [-0.55, 0.55].forEach((ex) => {
      const eye = new THREE.Mesh(this.getSphere(0.2, 8), this.glowingCyanMat);
      eye.position.set(ex, 0.4, 1.6);
      headGroup.add(eye);
    });

    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, -0.2, 0.5);
    headGroup.add(jawGroup);

    const jawMesh = new THREE.Mesh(this.getBox(1.2, 0.4, 2.0), this.darkBronzeMat);
    jawMesh.position.set(0, -0.2, 0.8);
    jawGroup.add(jawMesh);

    const fireCore = new THREE.Mesh(this.getSphere(0.35, 6), this.furnaceFireMat);
    fireCore.position.set(0, 0.1, 0.8);
    jawGroup.add(fireCore);

    // 3. Articulated Left & Right Wings
    const wingsLeft: THREE.Object3D[] = [];
    const wingsRight: THREE.Object3D[] = [];

    const leftWingRoot = new THREE.Group();
    leftWingRoot.position.set(-1.1, 0.5, 0.8);
    dragonGroup.add(leftWingRoot);
    wingsLeft.push(leftWingRoot);

    const wingSparL = new THREE.Mesh(this.getBox(5.5, 0.25, 1.2), this.burnishedCopperMat);
    wingSparL.position.set(-2.75, 0, 0);
    leftWingRoot.add(wingSparL);

    const wingSailL = new THREE.Mesh(this.getBox(5.2, 0.05, 2.8), this.antiqueGoldMat);
    wingSailL.position.set(-2.6, 0.1, -1.2);
    leftWingRoot.add(wingSailL);

    const rightWingRoot = new THREE.Group();
    rightWingRoot.position.set(1.1, 0.5, 0.8);
    dragonGroup.add(rightWingRoot);
    wingsRight.push(rightWingRoot);

    const wingSparR = new THREE.Mesh(this.getBox(5.5, 0.25, 1.2), this.burnishedCopperMat);
    wingSparR.position.set(2.75, 0, 0);
    rightWingRoot.add(wingSparR);

    const wingSailR = new THREE.Mesh(this.getBox(5.2, 0.05, 2.8), this.antiqueGoldMat);
    wingSailR.position.set(2.6, 0.1, -1.2);
    rightWingRoot.add(wingSailR);

    // 4. 5-Segment Articulated Tail
    const tailSegments: THREE.Object3D[] = [];
    let prevTailParent: THREE.Object3D = dragonGroup;
    let segZ = -3.8;

    for (let t = 0; t < 5; t++) {
      const tailSeg = new THREE.Group();
      tailSeg.position.set(0, 0, segZ);
      prevTailParent.add(tailSeg);
      tailSegments.push(tailSeg);

      const sizeFactor = 1.0 - t * 0.16;
      const segMesh = new THREE.Mesh(this.getBox(1.6 * sizeFactor, 1.3 * sizeFactor, 1.8), this.burnishedCopperMat);
      segMesh.position.set(0, 0, -0.9);
      tailSeg.add(segMesh);

      const spine = new THREE.Mesh(this.getBox(0.2, 0.4 * sizeFactor, 1.6), this.antiqueGoldMat);
      spine.position.set(0, 0.8 * sizeFactor, -0.9);
      tailSeg.add(spine);

      if (t === 4) {
        const fin = new THREE.Mesh(this.getBox(0.1, 2.2, 2.4), this.antiqueGoldMat);
        fin.position.set(0, 0.6, -1.8);
        tailSeg.add(fin);
      }

      prevTailParent = tailSeg;
      segZ = -1.8;
    }

    // Register with Director
    const triggerZ = worldZ !== 0 ? worldZ : parent.position?.z || 0;
    director.registerMechanicalDragon({
      group: dragonGroup,
      triggerZ,
      state: 'FLIGHT',
      neck: neckGroup,
      head: headGroup,
      jaw: jawGroup,
      wingsLeft,
      wingsRight,
      tailSegments,
      flightProgress: 0,
      baseY: 36.0,
      flightPathRadius: 42.0,
      timer: 0
    });

    parent.add(dragonGroup);
    return dragonGroup;
  }

  /**
   * Blockbuster Event D: The Transforming Clockwork City
   */
  public spawnTransformingCity(
    parent: THREE.Group,
    director: ChronoKingdomEventDirector,
    worldZ: number = 0,
    roadbedWidth: number = 10
  ): THREE.Group {
    const cityGroup = new THREE.Group();
    cityGroup.name = 'blockbuster_transforming_city';
    const tz = -50.0;
    cityGroup.position.set(0, 0, tz);

    const curbEdge = roadbedWidth * 0.5 + 0.5;
    const towerDist = 14.5;
    const plinthDepth = 6.0;

    const telescopingTowers: Array<{ mesh: THREE.Object3D; baseY: number; maxLift: number }> = [];
    const foldingRoofs: Array<{ leftPanel: THREE.Object3D; rightPanel: THREE.Object3D; maxAngle: number }> = [];
    const extendingBridges: Array<{ leftSpan: THREE.Object3D; rightSpan: THREE.Object3D; maxSpan: number }> = [];
    const engagingGears: Array<{ mesh: THREE.Object3D; speed: number; axis: 'x' | 'y' | 'z' }> = [];

    [-1, 1].forEach((side) => {
      const bx = side * towerDist;

      // 1. Deep Subterranean Foundation down to Y = -5.65m
      const plinth = new THREE.Mesh(this.getBox(7.0, plinthDepth, 9.0), this.darkIronstoneMat);
      plinth.position.set(bx, 0.35 - plinthDepth * 0.5, 0);
      cityGroup.add(plinth);

      // 2. Base Tower Structure (Y = 0 to 14m)
      const baseTower = new THREE.Mesh(this.getBox(6.5, 13.5, 8.5), this.darkBronzeMat);
      baseTower.position.set(bx, 7.1, 0);
      cityGroup.add(baseTower);

      // Engaging Drive Gear on facade
      const driveGear = this.buildGearMesh(1.8, 14, 0.3, this.antiqueGoldMat);
      driveGear.position.set(bx + (side === 1 ? -3.35 : 3.35), 7.0, 0);
      driveGear.rotation.y = Math.PI / 2;
      cityGroup.add(driveGear);
      engagingGears.push({ mesh: driveGear, speed: 2.2, axis: 'x' });

      // 3. Upper Telescoping Tower Section (lifts +8m)
      const upperTower = new THREE.Group();
      upperTower.position.set(bx, 14.0, 0);
      cityGroup.add(upperTower);

      const upperMesh = new THREE.Mesh(this.getBox(5.0, 10.0, 7.0), this.burnishedCopperMat);
      upperMesh.position.set(0, 5.0, 0);
      upperTower.add(upperMesh);

      telescopingTowers.push({ mesh: upperTower, baseY: 14.0, maxLift: 8.0 });

      // 4. Folding Mansard Roof Panels
      const roofLeft = new THREE.Mesh(this.getBox(2.6, 0.3, 7.2), this.midnightSteelMat);
      roofLeft.position.set(-1.3, 10.2, 0);
      upperTower.add(roofLeft);

      const roofRight = new THREE.Mesh(this.getBox(2.6, 0.3, 7.2), this.midnightSteelMat);
      roofRight.position.set(1.3, 10.2, 0);
      upperTower.add(roofRight);

      foldingRoofs.push({ leftPanel: roofLeft, rightPanel: roofRight, maxAngle: 0.65 });
    });

    // 5. Extending Overhead Skybridge at Y = 18.0m
    const bridgeY = 18.0;
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, bridgeY, 0);
    cityGroup.add(bridgeGroup);

    const bridgeLeft = new THREE.Mesh(this.getBox(7.5, 1.4, 3.2), this.antiqueGoldMat);
    bridgeLeft.position.set(-curbEdge - 3.75, 0, 0);
    bridgeGroup.add(bridgeLeft);

    const bridgeRight = new THREE.Mesh(this.getBox(7.5, 1.4, 3.2), this.antiqueGoldMat);
    bridgeRight.position.set(curbEdge + 3.75, 0, 0);
    bridgeGroup.add(bridgeRight);

    extendingBridges.push({ leftSpan: bridgeLeft, rightSpan: bridgeRight, maxSpan: 4.8 });

    // Register with Director
    const triggerZ = worldZ !== 0 ? worldZ : parent.position?.z || 0;
    director.registerTransformingCity({
      group: cityGroup,
      triggerZ,
      state: 'DORMANT',
      telescopingTowers,
      foldingRoofs,
      extendingBridges,
      engagingGears,
      timer: 0
    });

    parent.add(cityGroup);
    return cityGroup;
  }

  /**
   * High-Value Surprise 1: The Giant Hourglass
   */
  public spawnGiantHourglass(
    parent: THREE.Group,
    director: ChronoKingdomEventDirector,
    worldZ: number = 0,
    side: number = 1
  ): THREE.Group {
    const hgGroup = new THREE.Group();
    hgGroup.name = 'blockbuster_giant_hourglass';
    const hx = side * 13.5;
    const hz = -50.0;
    hgGroup.position.set(hx, 0, hz);

    // Deep plinth to Y = -5.65m
    const plinthDepth = 6.0;
    const plinth = new THREE.Mesh(this.getBox(5.5, plinthDepth, 5.5), this.darkIronstoneMat);
    plinth.position.set(0, 0.35 - plinthDepth * 0.5, 0);
    hgGroup.add(plinth);

    // Twin trunnion support pillars
    [-2.2, 2.2].forEach((px) => {
      const pillar = new THREE.Mesh(this.getCylinder(0.6, 0.8, 12.0, 8), this.darkBronzeMat);
      pillar.position.set(px, 6.35, 0);
      hgGroup.add(pillar);

      const trunnionBearing = this.buildGearMesh(1.0, 10, 0.25, this.antiqueGoldMat);
      trunnionBearing.position.set(px, 11.5, 0);
      trunnionBearing.rotation.y = Math.PI / 2;
      hgGroup.add(trunnionBearing);
    });

    // Rotating Hourglass Frame
    const hgFrame = new THREE.Group();
    hgFrame.position.set(0, 11.5, 0);
    hgGroup.add(hgFrame);

    // Upper bulb
    const upperBulb = new THREE.Mesh(this.getCylinder(1.6, 0.4, 3.6, 12), this.warmGlassAmberMat);
    upperBulb.position.set(0, 1.9, 0);
    hgFrame.add(upperBulb);

    // Lower bulb
    const lowerBulb = new THREE.Mesh(this.getCylinder(0.4, 1.6, 3.6, 12), this.warmGlassAmberMat);
    lowerBulb.position.set(0, -1.9, 0);
    hgFrame.add(lowerBulb);

    // Brass Caps & Waist
    const waistCollar = new THREE.Mesh(this.getTorus(0.65, 0.15, 6, 16), this.antiqueGoldMat);
    hgFrame.add(waistCollar);

    const topCap = new THREE.Mesh(this.getCylinder(1.8, 1.8, 0.4, 12), this.antiqueGoldMat);
    topCap.position.set(0, 3.8, 0);
    hgFrame.add(topCap);

    const botCap = new THREE.Mesh(this.getCylinder(1.8, 1.8, 0.4, 12), this.antiqueGoldMat);
    botCap.position.set(0, -3.8, 0);
    hgFrame.add(botCap);

    // Falling Sand Stream inside
    const sandStream = new THREE.Mesh(this.getCylinder(0.12, 0.12, 3.2, 6), this.warmGlassAmberMat);
    hgFrame.add(sandStream);

    // Register with Director
    const triggerZ = worldZ !== 0 ? worldZ : parent.position?.z || 0;
    director.registerGiantHourglass({
      group: hgGroup,
      triggerZ,
      hourglassFrame: hgFrame,
      sandUpper: upperBulb,
      sandLower: lowerBulb,
      sandStream,
      rotationProgress: 0,
      timer: 0
    });

    parent.add(hgGroup);
    return hgGroup;
  }

  /**
   * High-Value Surprise 2: The Pendulum Cathedral
   */
  public spawnPendulumCathedral(
    parent: THREE.Group,
    director: ChronoKingdomEventDirector,
    worldZ: number = 0,
    side: number = -1
  ): THREE.Group {
    const cathGroup = new THREE.Group();
    cathGroup.name = 'blockbuster_pendulum_cathedral';
    const cx = side * 14.0;
    const cz = -50.0;
    cathGroup.position.set(cx, 0, cz);

    // Deep plinth to Y = -5.65m
    const plinthDepth = 6.0;
    const plinth = new THREE.Mesh(this.getBox(6.5, plinthDepth, 14.0), this.darkIronstoneMat);
    plinth.position.set(0, 0.35 - plinthDepth * 0.5, 0);
    cathGroup.add(plinth);

    // Cathedral Vaulted Columns
    [-2.6, 2.6].forEach((px) => {
      [-5.0, 0, 5.0].forEach((pz) => {
        const pillar = new THREE.Mesh(this.getCylinder(0.65, 0.85, 18.0, 8), this.darkBronzeMat);
        pillar.position.set(px, 9.35, pz);
        cathGroup.add(pillar);
      });
    });

    // Vaulted Ceiling Arch
    const vaultRoof = new THREE.Mesh(this.getBox(6.0, 1.5, 14.5), this.burnishedCopperMat);
    vaultRoof.position.set(0, 18.8, 0);
    cathGroup.add(vaultRoof);

    // 3 Harmonic Pendulums
    const pendulums: Array<{ rod: THREE.Object3D; bob: THREE.Mesh; speed: number; amplitude: number; phase: number }> = [];
    const ratios = [
      { z: -4.0, length: 11.0, speed: 1.0, amp: 0.35, phase: 0.0 },
      { z: 0.0, length: 8.5, speed: 1.414, amp: 0.42, phase: 1.2 },
      { z: 4.0, length: 6.5, speed: 1.732, amp: 0.48, phase: 2.4 }
    ];

    ratios.forEach((p) => {
      const penPivot = new THREE.Group();
      penPivot.position.set(0, 18.0, p.z);
      cathGroup.add(penPivot);

      const rod = new THREE.Mesh(this.getCylinder(0.08, 0.08, p.length, 6), this.antiqueGoldMat);
      rod.position.set(0, -p.length * 0.5, 0);
      penPivot.add(rod);

      const bob = new THREE.Mesh(this.getCylinder(1.1, 1.1, 0.35, 12), this.antiqueGoldMat);
      bob.position.set(0, -p.length, 0);
      penPivot.add(bob);

      pendulums.push({
        rod: penPivot,
        bob,
        speed: p.speed,
        amplitude: p.amp,
        phase: p.phase
      });
    });

    // Register with Director
    const triggerZ = worldZ !== 0 ? worldZ : parent.position?.z || 0;
    director.registerPendulumCathedral({
      group: cathGroup,
      triggerZ,
      pendulums,
      timer: 0
    });

    parent.add(cathGroup);
    return cathGroup;
  }

  /**
   * High-Value Surprise 3: Clockwork Bird Swarm
   */
  public spawnClockworkBirdSwarm(
    parent: THREE.Group,
    director: ChronoKingdomEventDirector,
    worldZ: number = 0
  ): THREE.Group {
    const swarmGroup = new THREE.Group();
    swarmGroup.name = 'blockbuster_clockwork_bird_swarm';
    const sz = -50.0;
    swarmGroup.position.set(0, 24.0, sz);

    const birds: Array<{ mesh: THREE.Object3D; leftWing: THREE.Object3D; rightWing: THREE.Object3D; offset: THREE.Vector3; flapSpeed: number }> = [];

    // 8 Ornithopter drones flying in formation
    for (let i = 0; i < 8; i++) {
      const birdMesh = new THREE.Group();
      const ox = (i % 2 === 0 ? 1 : -1) * (3.5 + Math.floor(i / 2) * 3.0);
      const oy = (i % 3) * 1.5;
      const oz = -Math.floor(i / 2) * 5.0;
      birdMesh.position.set(ox, oy, oz);
      swarmGroup.add(birdMesh);

      // Body
      const bBody = new THREE.Mesh(this.getBox(0.4, 0.35, 1.4), this.burnishedCopperMat);
      birdMesh.add(bBody);

      // Amber eye sensor
      const bEye = new THREE.Mesh(this.getSphere(0.12, 6), this.warmGlassAmberMat);
      bEye.position.set(0, 0.1, 0.75);
      birdMesh.add(bEye);

      // Articulated wings
      const leftWing = new THREE.Group();
      leftWing.position.set(-0.2, 0.1, 0.2);
      birdMesh.add(leftWing);

      const wingMeshL = new THREE.Mesh(this.getBox(1.6, 0.05, 0.8), this.antiqueGoldMat);
      wingMeshL.position.set(-0.8, 0, 0);
      leftWing.add(wingMeshL);

      const rightWing = new THREE.Group();
      rightWing.position.set(0.2, 0.1, 0.2);
      birdMesh.add(rightWing);

      const wingMeshR = new THREE.Mesh(this.getBox(1.6, 0.05, 0.8), this.antiqueGoldMat);
      wingMeshR.position.set(0.8, 0, 0);
      rightWing.add(wingMeshR);

      birds.push({
        mesh: birdMesh,
        leftWing,
        rightWing,
        offset: new THREE.Vector3(ox, oy, oz),
        flapSpeed: 7.0 + (i % 3) * 1.5
      });
    }

    // Register with Director
    const triggerZ = worldZ !== 0 ? worldZ : parent.position?.z || 0;
    director.registerClockworkBirdSwarm({
      group: swarmGroup,
      triggerZ,
      birds,
      active: true,
      timer: 0
    });

    parent.add(swarmGroup);
    return swarmGroup;
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
