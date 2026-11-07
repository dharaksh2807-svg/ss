import * as THREE from 'three';
import { SeededRandom } from '../../SceneryFactory';
import { JurassicRushEventDirector } from './JurassicRushEventDirector';
import { JURASSIC_RUSH_TRAIN_LIVERY } from './JurassicRushTheme';
import { CurvedShaderManager } from '../../../scene/CurvedShader';

/**
 * Procedural Texture Cache for Jurassic Rush
 * Self-contained procedural canvas textures for prehistoric ferns, temple ruins, and fossil strata.
 */
class JurassicRushTextureHelper {
  private static cache = new Map<string, THREE.Texture>();

  public static getFernFrondTexture(): THREE.Texture {
    const key = 'jurassic_fern_fronds_v3';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Rich translucent jungle emerald gradient
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#047857');
    grad.addColorStop(0.5, '#059669');
    grad.addColorStop(1, '#065f46');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Fern frond main central spine
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size);
    ctx.quadraticCurveTo(size * 0.48, size * 0.5, size * 0.5, 10);
    ctx.stroke();

    // Leaf leaflets with feathered organic contours
    ctx.fillStyle = '#34d399';
    for (let y = size - 25; y > 25; y -= 20) {
      const progress = y / size;
      const w = Math.sin(progress * Math.PI) * 190 + 25;

      // Left leaflet
      ctx.beginPath();
      ctx.ellipse(size * 0.5 - w * 0.45, y, w * 0.45, 9, -0.28, 0, Math.PI * 2);
      ctx.fill();

      // Right leaflet
      ctx.beginPath();
      ctx.ellipse(size * 0.5 + w * 0.45, y, w * 0.45, 9, 0.28, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 4);
    this.cache.set(key, tex);
    return tex;
  }

  public static getTempleStoneTexture(): THREE.Texture {
    const key = 'jurassic_temple_stone_v3';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Weathered ancient basalt & moss
    ctx.fillStyle = '#27272a';
    ctx.fillRect(0, 0, size, size);

    // Stone block borders
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 16, size - 32, size - 32);

    // Carved ceremonial margin
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 4;
    ctx.strokeRect(32, 32, size - 64, size - 64);

    // Prehistoric Moss Overgrowth Wash
    ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.fillRect(16, 16, size - 32, 110);

    // Glowing Golden Claw Sigil of the Primordial Apex
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#d97706';
    ctx.shadowBlur = 12;

    // 3 Curved Raptor Talons
    [size * 0.33, size * 0.5, size * 0.67].forEach((cx, idx) => {
      ctx.beginPath();
      ctx.moveTo(cx - 12, size * 0.28);
      ctx.quadraticCurveTo(cx + (idx - 1) * 20, size * 0.55, cx + 8, size * 0.78);
      ctx.stroke();
    });

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  public static getFossilStrataTexture(): THREE.Texture {
    const key = 'jurassic_fossil_strata_v3';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Warm canyon sandstone strata bands
    const strata = ['#9a3412', '#c2410c', '#ea580c', '#d97706', '#b45309', '#78350f'];
    const h = size / strata.length;
    strata.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect(0, i * h, size, h);
      ctx.fillStyle = 'rgba(254, 243, 199, 0.12)';
      ctx.fillRect(0, i * h, size, 4);
    });

    // Embedded Giant Fossil Ammonite Shell
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#451a03';
    ctx.shadowBlur = 6;
    const cx = size * 0.5;
    const cy = size * 0.5;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 6.5; a += 0.08) {
      const r = a * 11;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Embedded Dinosaur Rib Skeletal Impressions
    ctx.lineWidth = 4;
    for (let r = -2; r <= 2; r++) {
      ctx.beginPath();
      ctx.moveTo(cx + r * 35 - 30, cy + 90);
      ctx.quadraticCurveTo(cx + r * 35, cy + 140, cx + r * 35 + 25, cy + 180);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }
}

/**
 * JurassicRushWorldBuilder
 * High-performance procedural 3D scenery generator for Jurassic Rush: The Lost World Railway.
 * 
 * Invariants:
 * - Deterministic procedural placement via SeededRandom.
 * - Strict clearance envelope: |X| > 4.2m, Y <= 8.5m (0 meshes in running corridor).
 * - Complete grounding: all walkways, plinths, curbs, trees, cliffs, and ruins anchor down to Y <= -5.35m.
 * - Organic prehistoric landscape: natural stepped crags, lush multi-tier rainforest canopies,
 *   cascading waterfalls with plunge basins, and wide 18m+ viewing vistas.
 * - Articulated sculpted dinosaurs with anatomically correct compound curves, counter-shaded hides,
 *   piercing amber eyes with pupils, and articulated locomotion.
 * - Full geometry and material reuse with zero per-frame allocation.
 * - 4 distinct prehistoric fantasy districts.
 */
export class JurassicRushWorldBuilder {
  private static instance: JurassicRushWorldBuilder | null = null;

  // Geometry Cache
  private geoCache = new Map<string, THREE.BufferGeometry>();

  // Shared Prehistoric Materials
  private jungleLeafMat: THREE.MeshStandardMaterial;
  private cycadLeafMat: THREE.MeshStandardMaterial;
  private goldenFernMat: THREE.MeshStandardMaterial;
  private deepCanopyMat: THREE.MeshStandardMaterial;
  private treeBarkMat: THREE.MeshStandardMaterial;
  private hangingVineMat: THREE.MeshStandardMaterial;
  private flowerOrchidMat: THREE.MeshStandardMaterial;

  private mossyBasaltMat: THREE.MeshStandardMaterial;
  private canyonRockMat: THREE.MeshStandardMaterial;
  private templeStoneMat: THREE.MeshStandardMaterial;
  private templeMossMat: THREE.MeshStandardMaterial;
  private templeGoldReliefMat: THREE.MeshStandardMaterial;

  private dinosaurSkinMat: THREE.MeshStandardMaterial;
  private dinosaurUnderbellyMat: THREE.MeshStandardMaterial;
  private dinosaurEyeMat: THREE.MeshStandardMaterial;
  private dinosaurPupilMat: THREE.MeshBasicMaterial;
  private dinosaurClawMat: THREE.MeshStandardMaterial;

  private carnivoreSkinMat: THREE.MeshStandardMaterial;
  private carnivoreBellyMat: THREE.MeshStandardMaterial;

  private raptorGreenMat: THREE.MeshStandardMaterial;
  private raptorTealMat: THREE.MeshStandardMaterial;

  private herbivoreSkinMat: THREE.MeshStandardMaterial;
  private herbivoreFrillMat: THREE.MeshStandardMaterial;

  private pterosaurWingsMat: THREE.MeshStandardMaterial;

  private waterfallWaterMat: THREE.MeshStandardMaterial;
  private waterfallFoamMat: THREE.MeshStandardMaterial;
  private riverWaterMat: THREE.MeshStandardMaterial;

  private amberCurbMat: THREE.MeshStandardMaterial;
  private expeditionBronzeMat: THREE.MeshStandardMaterial;
  private expeditionSteelMat: THREE.MeshStandardMaterial;
  private observationGlassMat: THREE.MeshBasicMaterial;
  private lanternGlowMat: THREE.MeshBasicMaterial;
  private brazierFireMat: THREE.MeshBasicMaterial;

  private constructor() {
    // 1. Lush Prehistoric Vegetation Materials
    this.jungleLeafMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Vibrant prehistoric emerald
      roughness: 0.45,
      metalness: 0.08,
      side: THREE.DoubleSide
    });

    this.cycadLeafMat = new THREE.MeshStandardMaterial({
      color: 0x059669, // Dense cycad fan green
      roughness: 0.48,
      metalness: 0.10,
      side: THREE.DoubleSide
    });

    this.goldenFernMat = new THREE.MeshStandardMaterial({
      color: 0xa3e635, // Sun-dappled chartreuse fern
      roughness: 0.42,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    this.deepCanopyMat = new THREE.MeshStandardMaterial({
      color: 0x065f46, // Towering ancient canopy jade
      roughness: 0.55,
      metalness: 0.08
    });

    this.treeBarkMat = new THREE.MeshStandardMaterial({
      color: 0x451a03, // Gnarled petrified redwood bark
      roughness: 0.78,
      metalness: 0.05
    });

    this.hangingVineMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Dense hanging jungle lianas
      roughness: 0.60,
      metalness: 0.05
    });

    this.flowerOrchidMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e, // Exotic prehistoric jungle orchid
      roughness: 0.40,
      metalness: 0.05
    });

    // 2. Prehistoric Geology & Architecture
    this.mossyBasaltMat = new THREE.MeshStandardMaterial({
      color: 0x2e4236, // Deep mossy basalt with organic patina
      roughness: 0.65,
      metalness: 0.10
    });

    this.canyonRockMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Warm radiant ochre & terracotta sandstone
      roughness: 0.60,
      metalness: 0.12
    });

    this.templeStoneMat = new THREE.MeshStandardMaterial({
      color: 0x6e7864, // Ancient weathered mossy jungle limestone
      roughness: 0.68,
      metalness: 0.08
    });

    this.templeMossMat = new THREE.MeshStandardMaterial({
      color: 0x24583b, // Lush primordial moss trim on temple tiers and ledges
      roughness: 0.85,
      metalness: 0.04
    });

    this.templeGoldReliefMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Glowing primordial gold relief
      emissive: 0xd97706,
      emissiveIntensity: 0.75,
      roughness: 0.30,
      metalness: 0.70
    });

    // 3. Detailed Dinosaur Anatomy Materials
    this.dinosaurSkinMat = new THREE.MeshStandardMaterial({
      color: 0x4d7c0f, // Rich prehistoric olive green hide
      roughness: 0.52,
      metalness: 0.12
    });

    this.dinosaurUnderbellyMat = new THREE.MeshStandardMaterial({
      color: 0xbbf7d0, // Counter-shaded bright pistachio underbelly
      roughness: 0.45,
      metalness: 0.10
    });

    this.dinosaurEyeMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Piercing amber dinosaur eye
      emissive: 0xd97706,
      emissiveIntensity: 0.95,
      roughness: 0.20,
      metalness: 0.10
    });

    this.dinosaurPupilMat = new THREE.MeshBasicMaterial({
      color: 0x09090b // Slit pupil
    });

    this.dinosaurClawMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7, // Polished bone/ivory teeth and talons
      roughness: 0.35,
      metalness: 0.20
    });

    this.carnivoreSkinMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // Menacing crimson-umber apex predator hide
      roughness: 0.48,
      metalness: 0.15
    });

    this.carnivoreBellyMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a, // Counter-shaded golden belly
      roughness: 0.45,
      metalness: 0.10
    });

    this.raptorGreenMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Vivid hunting emerald scales
      roughness: 0.45,
      metalness: 0.18
    });

    this.raptorTealMat = new THREE.MeshStandardMaterial({
      color: 0x0d9488, // Electric teal dorsal markings
      roughness: 0.42,
      metalness: 0.20
    });

    this.herbivoreSkinMat = new THREE.MeshStandardMaterial({
      color: 0x92400e, // Weathered bronze armored hide
      roughness: 0.55,
      metalness: 0.12
    });

    this.herbivoreFrillMat = new THREE.MeshStandardMaterial({
      color: 0xea580c, // Vibrant terracotta & ochre display frill
      roughness: 0.48,
      metalness: 0.15
    });

    this.pterosaurWingsMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // Terracotta leathery wing membrane
      roughness: 0.60,
      metalness: 0.10,
      side: THREE.DoubleSide
    });

    // 4. Waters & Atmospheric Props
    this.waterfallWaterMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.15,
      metalness: 0.70,
      emissive: 0x0284c7,
      emissiveIntensity: 0.65
    });

    this.waterfallFoamMat = new THREE.MeshStandardMaterial({
      color: 0xf0fdfa,
      roughness: 0.25,
      metalness: 0.40,
      emissive: 0x5eead4,
      emissiveIntensity: 0.90
    });

    this.riverWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0f766e,
      roughness: 0.15,
      metalness: 0.85
    });

    this.amberCurbMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.32,
      metalness: 0.60,
      emissive: 0xd97706,
      emissiveIntensity: 0.55
    });

    this.expeditionBronzeMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.40,
      metalness: 0.80
    });

    this.expeditionSteelMat = new THREE.MeshStandardMaterial({
      color: 0x374151,
      roughness: 0.45,
      metalness: 0.80
    });

    this.observationGlassMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a
    });

    this.lanternGlowMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a
    });

    this.brazierFireMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24
    });

    // Apply track curvature shader to all materials so meshes bend smoothly with tracks
    const curved = CurvedShaderManager.getInstance();
    curved.applyCurvature(this.jungleLeafMat);
    curved.applyCurvature(this.cycadLeafMat);
    curved.applyCurvature(this.goldenFernMat);
    curved.applyCurvature(this.deepCanopyMat);
    curved.applyCurvature(this.treeBarkMat);
    curved.applyCurvature(this.hangingVineMat);
    curved.applyCurvature(this.flowerOrchidMat);
    curved.applyCurvature(this.mossyBasaltMat);
    curved.applyCurvature(this.canyonRockMat);
    curved.applyCurvature(this.templeStoneMat);
    curved.applyCurvature(this.templeMossMat);
    curved.applyCurvature(this.templeGoldReliefMat);
    curved.applyCurvature(this.dinosaurSkinMat);
    curved.applyCurvature(this.dinosaurUnderbellyMat);
    curved.applyCurvature(this.dinosaurEyeMat);
    curved.applyCurvature(this.dinosaurClawMat);
    curved.applyCurvature(this.carnivoreSkinMat);
    curved.applyCurvature(this.carnivoreBellyMat);
    curved.applyCurvature(this.raptorGreenMat);
    curved.applyCurvature(this.raptorTealMat);
    curved.applyCurvature(this.herbivoreSkinMat);
    curved.applyCurvature(this.herbivoreFrillMat);
    curved.applyCurvature(this.pterosaurWingsMat);
    curved.applyCurvature(this.waterfallWaterMat);
    curved.applyCurvature(this.waterfallFoamMat);
    curved.applyCurvature(this.riverWaterMat);
    curved.applyCurvature(this.amberCurbMat);
    curved.applyCurvature(this.expeditionBronzeMat);
    curved.applyCurvature(this.expeditionSteelMat);
    curved.applyCurvature(this.observationGlassMat);
    curved.applyCurvature(this.lanternGlowMat);
    curved.applyCurvature(this.brazierFireMat);
  }

  public static getInstance(): JurassicRushWorldBuilder {
    if (!this.instance) {
      this.instance = new JurassicRushWorldBuilder();
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

  private getCone(r: number, h: number, segs: number = 7): THREE.ConeGeometry {
    const key = `cone_${r}_${h}_${segs}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.ConeGeometry(r, h, segs));
    }
    return this.geoCache.get(key) as THREE.ConeGeometry;
  }

  private getPlane(w: number, h: number): THREE.PlaneGeometry {
    const key = `plane_${w}_${h}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.PlaneGeometry(w, h));
    }
    return this.geoCache.get(key) as THREE.PlaneGeometry;
  }

  private getSphere(r: number, segs: number = 10): THREE.SphereGeometry {
    const key = `sphere_${r}_${segs}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.SphereGeometry(r, segs, segs));
    }
    return this.geoCache.get(key) as THREE.SphereGeometry;
  }

  private getTorus(r: number, tube: number, radSegs: number = 6, tubSegs: number = 12): THREE.TorusGeometry {
    const key = `torus_${r}_${tube}_${radSegs}_${tubSegs}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.TorusGeometry(r, tube, radSegs, tubSegs));
    }
    return this.geoCache.get(key) as THREE.TorusGeometry;
  }

  private getDodecahedron(r: number): THREE.DodecahedronGeometry {
    const key = `dodec_${r}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.DodecahedronGeometry(r, 0));
    }
    return this.geoCache.get(key) as THREE.DodecahedronGeometry;
  }

  // =========================================================================
  // MAIN ENTRY POINT: BUILD DISTRICT SCENERY
  // =========================================================================

  public buildDistrictScenery(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL' = 'FULL',
    worldZIn?: number
  ): void {
    const rng = new SeededRandom(seed);
    const director = JurassicRushEventDirector.getInstance();

    // Authoritative deterministic district progression across 400m blocks
    let districtIndex: number;
    if (seed >= 0 && seed < 4) {
      districtIndex = seed;
    } else if (worldZIn !== undefined && Number.isFinite(worldZIn)) {
      districtIndex = Math.floor(Math.abs(worldZIn) / 400) % 4;
    } else {
      districtIndex = Math.floor(Math.abs(seed) / 4) % 4;
    }

    switch (districtIndex) {
      case 0:
        this.buildLostJungleDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 1:
        this.buildValleyOfGiantsDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 2:
        this.buildRaptorCanyonDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 3:
      default:
        this.buildAncientSanctuaryDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
    }
  }

  // =========================================================================
  // PREHISTORIC FLORA & NATURAL SCENERY BUILDERS
  // =========================================================================

  /**
   * Towering Ancient Rainforest Canopy Tree
   * Colossal gnarled banyan/conifer with buttress roots grounded to Y <= -5.5m,
   * high spreading branches at Y = 18m-25m, deep multi-tier canopy crowns, and cascading lianas.
   */
  public buildAncientCanopyTree(x: number, y: number, z: number, scale: number = 1.0): THREE.Group {
    const tree = new THREE.Group();
    tree.position.set(x, y, z);
    tree.scale.set(scale, scale, scale);

    // Main Gnarled Trunk (H = 28m, anchored deep down to Y = -5.5m)
    const trunk = new THREE.Mesh(this.getCylinder(1.6, 2.8, 28.0, 8), this.treeBarkMat);
    trunk.position.y = 8.5; // Top at Y = 22.5m, bottom at Y = -5.5m (100% GROUNDED!)
    tree.add(trunk);

    // 5 Fluted Buttress Roots radiating outward to firmly anchor into the primeval earth
    for (let r = 0; r < 5; r++) {
      const angle = (r * Math.PI * 2) / 5 + 0.2;
      const root = new THREE.Mesh(this.getBox(0.8, 8.5, 3.8), this.treeBarkMat);
      root.position.set(Math.cos(angle) * 2.2, -1.5, Math.sin(angle) * 2.2);
      root.rotation.y = angle;
      tree.add(root);
    }

    // High Spreading Canopy Boughs at Y = 19m to 25m (safely above the 8.5m clearance ceiling)
    [-1, 1].forEach((dir) => {
      const bough = new THREE.Mesh(this.getCylinder(0.85, 1.3, 8.5, 6), this.treeBarkMat);
      bough.position.set(dir * 2.8, 19.5, 0);
      bough.rotation.z = dir * 0.35;
      tree.add(bough);

      // Multi-tier lush foliage domes with rich emerald and jade highlights
      const mainCanopy = new THREE.Mesh(this.getSphere(4.6, 9), this.deepCanopyMat);
      mainCanopy.scale.set(1.4, 0.85, 1.4);
      mainCanopy.position.set(dir * 5.2, 22.8, 0);
      tree.add(mainCanopy);

      const upperLeafPuff = new THREE.Mesh(this.getSphere(3.4, 8), this.jungleLeafMat);
      upperLeafPuff.position.set(dir * 4.2, 21.2, 2.0);
      tree.add(upperLeafPuff);

      const goldenLeafPuff = new THREE.Mesh(this.getSphere(2.6, 7), this.goldenFernMat);
      goldenLeafPuff.position.set(dir * 5.8, 23.5, -1.8);
      tree.add(goldenLeafPuff);

      // Cascading Hanging Liana Vines cascading down to Y = 11m (well above 8.5m running ceiling)
      for (let v = 0; v < 3; v++) {
        const vineH = 6.0 + v * 1.5;
        const vine = new THREE.Mesh(this.getCylinder(0.06, 0.08, vineH, 4), this.hangingVineMat);
        vine.position.set(dir * (2.8 + v * 1.2), 19.5 - vineH * 0.5, (v - 1) * 1.6);
        tree.add(vine);
      }
    });

    return tree;
  }

  /**
   * Eye-Level Prehistoric Cycad / Fan Palm
   * Highly recognizable fan-frond prehistoric foliage placed right along the trackside
   */
  public buildEyeLevelCycad(x: number, y: number, z: number, scale: number = 1.0): THREE.Group {
    const cycad = new THREE.Group();
    cycad.position.set(x, y, z);
    cycad.scale.set(scale, scale, scale);

    // Fibrous textured prehistoric stump anchored into ground (bottom down to Y = -2.6m)
    const trunk = new THREE.Mesh(this.getCylinder(0.32, 0.48, 3.6, 7), this.treeBarkMat);
    trunk.position.y = -0.8;
    cycad.add(trunk);

    // 8 Arched Feathered Fan Fronds radiating out at eye level
    for (let f = 0; f < 8; f++) {
      const angle = (f / 8) * Math.PI * 2;
      const frondMesh = new THREE.Mesh(this.getPlane(2.8, 1.1), f % 2 === 0 ? this.cycadLeafMat : this.goldenFernMat);
      frondMesh.position.set(Math.cos(angle) * 1.2, 1.0 + Math.sin(f) * 0.15, Math.sin(angle) * 1.2);
      frondMesh.rotation.y = angle;
      frondMesh.rotation.x = 0.44;
      cycad.add(frondMesh);
    }

    // Exotic prehistoric orchid blossom near crown
    const orchid = new THREE.Mesh(this.getSphere(0.28, 6), this.flowerOrchidMat);
    orchid.position.set(0.2, 1.15, 0.2);
    cycad.add(orchid);

    return cycad;
  }

  /**
   * Giant Ancient Mossy Crag & Geological Formations
   * Replaces monolithic boxes with organic faceted basalt crags anchored to Y <= -5.5m
   */
  public buildMossyBoulder(x: number, y: number, z: number, scale: number = 1.0): THREE.Group {
    const boulder = new THREE.Group();
    boulder.position.set(x, y, z);
    boulder.scale.set(scale, scale, scale);

    // Main faceted rock crag using dodecahedron for natural crystalline rock look
    const rock = new THREE.Mesh(this.getDodecahedron(2.6), this.mossyBasaltMat);
    rock.scale.set(1.4, 1.1, 1.2);
    rock.position.y = 1.1;
    boulder.add(rock);

    // Secondary stepped shelf with moss
    const shelf = new THREE.Mesh(this.getDodecahedron(1.8), this.mossyBasaltMat);
    shelf.position.set(1.3, 0.4, 0.6);
    boulder.add(shelf);

    // Deep subterranean foundation anchor down to Y = -5.5m (ZERO FLOATING GEOMETRY)
    const anchor = new THREE.Mesh(this.getCylinder(2.2, 2.6, 7.0, 7), this.mossyBasaltMat);
    anchor.position.y = -2.8;
    boulder.add(anchor);

    return boulder;
  }

  /**
   * Rugged Expedition Railway Catenary Pole with Amber Warning Lantern
   */
  public buildExpeditionRailwayPole(x: number, y: number, z: number): THREE.Group {
    const pole = new THREE.Group();
    pole.position.set(x, y, z);

    // Heavy corten bronze mast (anchored down to Y = -5.5m)
    const mast = new THREE.Mesh(this.getCylinder(0.20, 0.28, 14.5, 6), this.expeditionBronzeMat);
    mast.position.y = 1.75; // Base at Y = -5.5m
    pole.add(mast);

    // Cantilever bracket extending toward rail curb
    const bracket = new THREE.Mesh(this.getBox(1.6, 0.16, 0.16), this.expeditionBronzeMat);
    bracket.position.set(x > 0 ? -0.8 : 0.8, 7.5, 0);
    pole.add(bracket);

    // Amber expedition warning lantern with glow
    const lantern = new THREE.Mesh(this.getCylinder(0.18, 0.24, 0.52, 6), this.lanternGlowMat);
    lantern.position.set(x > 0 ? -1.5 : 1.5, 7.2, 0);
    pole.add(lantern);

    return pole;
  }

  // =========================================================================
  // DISTRICT A — THE LOST JUNGLE (VERTICAL SLICE)
  // =========================================================================

  public buildLostJungleDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: JurassicRushEventDirector
  ): void {
    const districtA = new THREE.Group();
    districtA.name = 'district_a_lost_jungle';
    group.add(districtA);

    const curbEdge = roadbedWidth * 0.5 + 0.5; // 6.5m from track center

    [-1, 1].forEach((side) => {
      // 1. Lush Rainforest Bed & Timber Corduroy Walkway (Grounded down to Y = -5.5m)
      const walkW = 20.0;
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 6.0, chunkLength), this.treeBarkMat);
      walk.position.set(wx, -2.55, -chunkLength * 0.5); // Bottom reaches Y = -5.55m!
      districtA.add(walk);

      // Bright Amber Petrified Wood Curb (Grounded down to Y = -5.5m)
      const curb = new THREE.Mesh(this.getBox(0.48, 6.0, chunkLength), this.amberCurbMat);
      curb.position.set(side * (curbEdge + 0.24), -2.52, -chunkLength * 0.5);
      districtA.add(curb);

      // 2. Rugged Expedition Lantern Poles along curb edge
      for (let z = 10; z < chunkLength; z += 38) {
        const pole = this.buildExpeditionRailwayPole(side * (curbEdge + 0.85), 0.45, -z);
        districtA.add(pole);
      }

      // 3. Eye-Level Prehistoric Flora: Cycads & Ancient Mossy Boulders
      for (let z = 6; z < chunkLength; z += 18) {
        const cycad = this.buildEyeLevelCycad(
          side * (curbEdge + 2.0 + (z % 3) * 0.5),
          0.45,
          -z,
          1.0 + ((z * 7) % 5) * 0.1
        );
        districtA.add(cycad);

        if (z % 36 === 6) {
          const boulder = this.buildMossyBoulder(
            side * (curbEdge + 4.2),
            0.45,
            -z - 5.0,
            1.25
          );
          districtA.add(boulder);
        }
      }

      // 4. Towering Ancient Canopy Trees (positioned at X = ±12.0m to frame the railway overhead)
      for (let tz = 12; tz < chunkLength; tz += 42) {
        const tree = this.buildAncientCanopyTree(
          side * (curbEdge + 5.5),
          0.45,
          -tz,
          1.15
        );
        districtA.add(tree);
      }

      // 5. Natural Stratified Jungle Rock Bluffs with 18m Open Viewing Vistas
      // Replaces monolithic rectangular boxes with stepped geological crags
      const bluffPositions = [14, 60];
      bluffPositions.forEach((bz) => {
        const bluffGroup = new THREE.Group();
        bluffGroup.position.set(side * (curbEdge + 12.0), 0.0, -bz);

        // Subterranean anchor plinth (Y <= -5.5m)
        const plinth = new THREE.Mesh(this.getCylinder(7.5, 8.5, 6.5, 7), this.mossyBasaltMat);
        plinth.position.y = -2.8;
        bluffGroup.add(plinth);

        // Lower faceted crag base
        const lowerCrag = new THREE.Mesh(this.getDodecahedron(6.0), this.mossyBasaltMat);
        lowerCrag.scale.set(1.4, 0.9, 1.3);
        lowerCrag.position.set(0, 4.2, 0);
        bluffGroup.add(lowerCrag);

        // Upper stepped rocky shelf with mossy crown
        const upperShelf = new THREE.Mesh(this.getDodecahedron(4.2), this.mossyBasaltMat);
        upperShelf.position.set(side * 1.5, 10.2, 0);
        bluffGroup.add(upperShelf);

        // Prehistoric Tree Fern Fronds crowning the crag at Y = 14m
        const fernTex = JurassicRushTextureHelper.getFernFrondTexture();
        for (let f = 0; f < 5; f++) {
          const frond = new THREE.Mesh(
            this.getPlane(7.5, 3.5),
            new THREE.MeshStandardMaterial({ map: fernTex, side: THREE.DoubleSide, roughness: 0.55 })
          );
          frond.position.set(side * 1.5, 14.0, 0);
          frond.rotation.y = (f * Math.PI * 2) / 5;
          frond.rotation.x = 0.40;
          bluffGroup.add(frond);
        }

        districtA.add(bluffGroup);
      });

      // 6. Magnificent Multi-Stage Cascading Mountain Waterfall (Right side: side = 1)
      if (side === 1) {
        const fallGroup = new THREE.Group();
        fallGroup.position.set(curbEdge + 14.0, 0.0, -chunkLength * 0.5);

        // Solid stratified rock cliff backing grounded down to Y = -5.5m
        const cliffBacking = new THREE.Mesh(this.getCylinder(8.5, 10.5, 28.0, 8), this.mossyBasaltMat);
        cliffBacking.position.set(3.5, 8.5, 0);
        fallGroup.add(cliffBacking);

        // Mid-level rock cataract shelf where water cascades and breaks
        const midShelf = new THREE.Mesh(this.getDodecahedron(4.5), this.mossyBasaltMat);
        midShelf.position.set(0.5, 8.0, 0);
        fallGroup.add(midShelf);

        // Upper cascading waterfall cataract
        const upperFall = new THREE.Mesh(this.getCylinder(3.2, 4.2, 11.0, 8), this.waterfallWaterMat);
        upperFall.position.set(0.2, 16.5, 0);
        fallGroup.add(upperFall);

        // Lower tumbling waterfall torrent
        const lowerFall = new THREE.Mesh(this.getCylinder(4.2, 5.5, 10.0, 8), this.waterfallWaterMat);
        lowerFall.position.set(-1.0, 5.5, 0);
        fallGroup.add(lowerFall);

        // Billowing white-water foam lip and spray crest
        const foamLip = new THREE.Mesh(this.getTorus(3.8, 0.85, 6, 12), this.waterfallFoamMat);
        foamLip.rotation.x = Math.PI / 2;
        foamLip.position.set(-1.0, 0.75, 0);
        fallGroup.add(foamLip);

        // Deep emerald river plunge basin below (grounded to Y = -5.5m)
        const riverBed = new THREE.Mesh(this.getCylinder(11.0, 12.5, 6.0, 8), this.riverWaterMat);
        riverBed.position.set(-1.0, -2.55, 0);
        fallGroup.add(riverBed);

        districtA.add(fallGroup);
      }
    });

    // 7. ANIMATED DINOSAUR ENCOUNTER: Curious Giant Sauropod Watcher
    // Prominently framed on the left in the wide 18m jungle vista at X = -(curbEdge + 6.5m) = -13.0m!
    // Visible clearly peering curiously through the rainforest canopy at the player!
    const watcher = this.buildCuriousDinosaurWatcher(-(curbEdge + 6.5), 0.45, -chunkLength * 0.45);
    districtA.add(watcher.group);
    director.registerCuriousWatcher(watcher.group, watcher.neck, watcher.head);

    // 8. Soaring Pterosaur Flock Banking in the Prehistoric Sky (Y = 22m to 28m)
    if (detail !== 'MINIMAL') {
      const pterosaurFlock = this.buildPterosaurFlock(-chunkLength * 0.5);
      districtA.add(pterosaurFlock.group);
      director.registerPterosaurs(pterosaurFlock.group, pterosaurFlock.gliders, 18.0, 3.2);
    }
  }

  // =========================================================================
  // DISTRICT B — VALLEY OF GIANTS
  // =========================================================================

  public buildValleyOfGiantsDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: JurassicRushEventDirector
  ): void {
    const districtB = new THREE.Group();
    districtB.name = 'district_b_valley_of_giants';
    group.add(districtB);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    [-1, 1].forEach((side) => {
      // 1. Ancient Valley Basalt Promenade (Grounded down to Y = -5.5m)
      const walkW = 20.0;
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 6.0, chunkLength), this.templeStoneMat);
      walk.position.set(wx, -2.55, -chunkLength * 0.5);
      districtB.add(walk);

      const curb = new THREE.Mesh(this.getBox(0.48, 6.0, chunkLength), this.amberCurbMat);
      curb.position.set(side * (curbEdge + 0.24), -2.52, -chunkLength * 0.5);
      districtB.add(curb);

      // Eye-level cycads along valley edge
      for (let z = 8; z < chunkLength; z += 22) {
        const cycad = this.buildEyeLevelCycad(side * (curbEdge + 2.0), 0.45, -z, 1.15);
        districtB.add(cycad);
      }

      // Prehistoric Conifer / Araucaria trees dotting valley margins
      for (let tz = 18; tz < chunkLength; tz += 38) {
        const conifer = this.buildAncientCanopyTree(side * (curbEdge + 6.2), 0.45, -tz, 0.95);
        districtB.add(conifer);
      }

      // 2. Stepped Geological Terraces framing panoramic valley floor
      const mesa = new THREE.Group();
      mesa.position.set(side * (curbEdge + 13.5), 0.0, -18);

      const mAnchor = new THREE.Mesh(this.getCylinder(7.5, 8.5, 6.5, 7), this.canyonRockMat);
      mAnchor.position.y = -2.8;
      mesa.add(mAnchor);

      const m1 = new THREE.Mesh(this.getCylinder(6.5, 7.5, 8.5, 7), this.canyonRockMat);
      m1.position.set(0, 4.2, 0);
      mesa.add(m1);

      const m2 = new THREE.Mesh(this.getCylinder(4.5, 5.8, 7.5, 6), this.canyonRockMat);
      m2.position.set(side * 1.5, 11.5, 0);
      mesa.add(m2);

      districtB.add(mesa);
    });

    // 3. ANIMATED DINOSAUR ENCOUNTER: Colossal Sauropod (Brachiosaurus) & Juvenile
    // Placed in the panoramic viewing vista on the left at X = -(curbEdge + 5.5m) = -12.0m!
    // Its 16m neck, sculpted head, counter-shaded body, and tail loom majestically over the tracks!
    const sauropod = this.buildColossalSauropod(-(curbEdge + 5.5), 0.45, -chunkLength * 0.45);
    districtB.add(sauropod.group);
    director.registerSauropod(
      sauropod.group,
      sauropod.neck,
      sauropod.head,
      sauropod.tail,
      sauropod.legs,
      4.5,
      1.6,
      -chunkLength * 1.2,
      30
    );

    // Accompanying Juvenile Sauropod walking alongside parent
    const babySauropod = this.buildColossalSauropod(-(curbEdge + 9.5), 0.45, -chunkLength * 0.35);
    babySauropod.group.scale.set(0.55, 0.55, 0.55);
    districtB.add(babySauropod.group);
    director.registerSauropod(
      babySauropod.group,
      babySauropod.neck,
      babySauropod.head,
      babySauropod.tail,
      babySauropod.legs,
      4.5,
      1.6,
      -chunkLength * 1.2,
      30
    );

    // 4. ANIMATED DINOSAUR ENCOUNTER: Grazing Armored Herbivore Herd (Triceratops)
    // Placed in the right clearing at X = curbEdge + 5.2m (11.7m) with warning frills & bone horns
    const herd = this.buildHerbivoreHerd(curbEdge + 5.2, 0.45, -chunkLength * 0.55);
    districtB.add(herd.group);
    director.registerHerbivoreHerd(herd.group, herd.members);
  }

  // =========================================================================
  // DISTRICT C — RAPTOR CANYON
  // =========================================================================

  public buildRaptorCanyonDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: JurassicRushEventDirector
  ): void {
    const districtC = new THREE.Group();
    districtC.name = 'district_c_raptor_canyon';
    group.add(districtC);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    [-1, 1].forEach((side) => {
      // 1. Red Sandstone Gorge Walkway (Grounded down to Y = -5.5m)
      const walkW = 20.0;
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 6.0, chunkLength), this.canyonRockMat);
      walk.position.set(wx, -2.55, -chunkLength * 0.5);
      districtC.add(walk);

      const curb = new THREE.Mesh(this.getBox(0.48, 6.0, chunkLength), this.amberCurbMat);
      curb.position.set(side * (curbEdge + 0.24), -2.52, -chunkLength * 0.5);
      districtC.add(curb);

      // Eye-level cycads along canyon path
      for (let z = 8; z < chunkLength; z += 22) {
        const cycad = this.buildEyeLevelCycad(side * (curbEdge + 2.0), 0.45, -z, 1.0);
        districtC.add(cycad);
      }

      // 2. Sculpted Sandstone Hoodoos & Terraced Canyon Formations (No flat boxes!)
      [14, 62].forEach((cz) => {
        const cliffGroup = new THREE.Group();
        cliffGroup.position.set(side * (curbEdge + 12.0), 0.0, -cz);

        // Ground anchor plinth down to Y = -5.5m
        const plinth = new THREE.Mesh(this.getCylinder(7.5, 8.5, 6.5, 7), this.canyonRockMat);
        plinth.position.y = -2.8;
        cliffGroup.add(plinth);

        // Tiered sculpted canyon rock shelf
        const baseCliff = new THREE.Mesh(this.getCylinder(6.2, 7.5, 10.0, 7), this.canyonRockMat);
        baseCliff.position.set(0, 5.0, 0);
        cliffGroup.add(baseCliff);

        // Upper hoodoo pinnacle with natural erosion slope
        const upperPinnacle = new THREE.Mesh(this.getCylinder(4.2, 5.8, 9.0, 6), this.canyonRockMat);
        upperPinnacle.position.set(side * 1.2, 14.0, 0);
        cliffGroup.add(upperPinnacle);

        const hoodooCap = new THREE.Mesh(this.getCone(3.8, 6.0, 6), this.canyonRockMat);
        hoodooCap.position.set(side * 1.5, 20.5, 0);
        cliffGroup.add(hoodooCap);

        // Embedded Ammonite & Bone Fossil Strata Plaque
        const fossilTex = JurassicRushTextureHelper.getFossilStrataTexture();
        const fossil = new THREE.Mesh(
          this.getPlane(6.5, 6.5),
          new THREE.MeshStandardMaterial({ map: fossilTex, side: THREE.DoubleSide })
        );
        fossil.position.set(-side * 5.2, 8.0, 0);
        fossil.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        cliffGroup.add(fossil);

        districtC.add(cliffGroup);
      });
    });

    // 3. ANIMATED DINOSAUR ENCOUNTER: Sprinting Raptor Pack
    // Placed along a raised canyon terrace at X = curbEdge + 3.8m (10.3m), Y = 1.8m!
    // Running right alongside the railway in full clear view of the player!
    const raptorTerrace = new THREE.Mesh(this.getBox(6.5, 6.5, 32.0), this.canyonRockMat);
    raptorTerrace.position.set(curbEdge + 4.5, -1.0, -chunkLength * 0.5);
    districtC.add(raptorTerrace);

    const raptorPack = this.buildRaptorPack(curbEdge + 3.8, 2.2, -chunkLength * 0.5);
    districtC.add(raptorPack.group);
    director.registerRaptorPack(
      raptorPack.group,
      raptorPack.raptors,
      22.0,
      8.0,
      -chunkLength * 1.3,
      30
    );

    // 4. Prehistoric Rope & Timber Suspension Bridge spanning overhead at Y = 16.5m
    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = 'raptor_canyon_rope_bridge';
    bridgeGroup.position.set(0, 16.5, -chunkLength * 0.5);

    const bridgeSpan = new THREE.Mesh(this.getBox(roadbedWidth + 12.0, 0.6, 2.8), this.treeBarkMat);
    bridgeGroup.add(bridgeSpan);

    // Stone anchor abutment towers grounded deep into the canyon floor down to Y = -5.5m
    [-1, 1].forEach((side) => {
      const tower = new THREE.Mesh(this.getBox(3.4, 24.0, 3.8), this.canyonRockMat);
      tower.position.set(side * (roadbedWidth * 0.5 + 4.8), -11.0, 0); // Bottom reaches Y = -23m!
      bridgeGroup.add(tower);
    });

    [-1.3, 1.3].forEach((rz) => {
      const rope = new THREE.Mesh(this.getCylinder(0.08, 0.08, roadbedWidth + 12.0, 6), this.amberCurbMat);
      rope.rotation.z = Math.PI / 2;
      rope.position.set(0, 0.8, rz);
      bridgeGroup.add(rope);
    });

    districtC.add(bridgeGroup);
  }

  // =========================================================================
  // DISTRICT D — THE ANCIENT SANCTUARY
  // =========================================================================

  public buildAncientSanctuaryDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: JurassicRushEventDirector
  ): void {
    const districtD = new THREE.Group();
    districtD.name = 'district_d_ancient_sanctuary';
    group.add(districtD);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    [-1, 1].forEach((side) => {
      // 1. Overgrown Megalithic Temple Walkway (Grounded down to Y = -5.5m)
      const walkW = 22.0;
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 6.0, chunkLength), this.templeStoneMat);
      walk.position.set(wx, -2.55, -chunkLength * 0.5);
      districtD.add(walk);

      const curb = new THREE.Mesh(this.getBox(0.48, 6.0, chunkLength), this.amberCurbMat);
      curb.position.set(side * (curbEdge + 0.24), -2.52, -chunkLength * 0.5);
      districtD.add(curb);

      // Eye-level prehistoric flora & squat carved stone braziers with golden primal fire
      for (let z = 10; z < chunkLength; z += 24) {
        const cycad = this.buildEyeLevelCycad(side * (curbEdge + 1.8), 0.45, -z, 1.15);
        districtD.add(cycad);

        // Carved ceremonial stone totem plinth
        const plinth = new THREE.Mesh(this.getCylinder(0.55, 0.75, 2.2, 6), this.templeStoneMat);
        plinth.position.set(side * (curbEdge + 3.4), 1.1, -z);
        districtD.add(plinth);

        const plinthMoss = new THREE.Mesh(this.getCylinder(0.60, 0.60, 0.25, 6), this.templeMossMat);
        plinthMoss.position.set(side * (curbEdge + 3.4), 2.25, -z);
        districtD.add(plinthMoss);

        // Carved stone fire bowl with vibrant golden flames
        const brazier = new THREE.Mesh(this.getCylinder(0.50, 0.35, 0.9, 6), this.templeStoneMat);
        brazier.position.set(side * (curbEdge + 3.4), 2.75, -z);
        districtD.add(brazier);

        const flame = new THREE.Mesh(this.getCone(0.38, 0.95, 6), this.brazierFireMat);
        flame.position.set(side * (curbEdge + 3.4), 3.55, -z);
        districtD.add(flame);
      }

      // 2. Stepped Ziggurat Temple Pyramids with Ceremonial Stairs & Lush Backdrop Canopy
      [16, 56].forEach((tz) => {
        const templeGroup = new THREE.Group();
        templeGroup.position.set(side * (curbEdge + 12.0), 0.0, -tz);

        // Subterranean Anchor Plinth down to Y = -5.5m
        const tAnchor = new THREE.Mesh(this.getBox(15.0, 6.0, 20.0), this.templeStoneMat);
        tAnchor.position.y = -2.8;
        templeGroup.add(tAnchor);

        // Stepped Ziggurat Tier 1 with lush moss cornice
        const tier1 = new THREE.Mesh(this.getBox(13.0, 4.0, 18.0), this.templeStoneMat);
        tier1.position.y = 2.0;
        templeGroup.add(tier1);

        const mossTier1 = new THREE.Mesh(this.getBox(13.4, 0.35, 18.4), this.templeMossMat);
        mossTier1.position.y = 4.15;
        templeGroup.add(mossTier1);

        // Ceremonial stone stairs cascading toward railway
        for (let st = 0; st < 5; st++) {
          const stair = new THREE.Mesh(this.getBox(0.9, 0.55, 7.5), this.templeStoneMat);
          stair.position.set(-side * (5.5 + st * 0.8), 0.35 + st * 0.55, 0);
          templeGroup.add(stair);

          const stairMoss = new THREE.Mesh(this.getBox(0.92, 0.12, 7.6), this.templeMossMat);
          stairMoss.position.set(-side * (5.5 + st * 0.8), 0.65 + st * 0.55, 0);
          templeGroup.add(stairMoss);
        }

        // Stepped Ziggurat Tier 2 with moss cornice
        const tier2 = new THREE.Mesh(this.getBox(9.5, 3.5, 13.5), this.templeStoneMat);
        tier2.position.y = 5.8;
        templeGroup.add(tier2);

        const mossTier2 = new THREE.Mesh(this.getBox(9.8, 0.35, 13.8), this.templeMossMat);
        mossTier2.position.y = 7.65;
        templeGroup.add(mossTier2);

        // Stepped Ziggurat Tier 3 / Upper Altar Sanctuary
        const tier3 = new THREE.Mesh(this.getBox(6.5, 3.0, 9.5), this.templeStoneMat);
        tier3.position.y = 9.2;
        templeGroup.add(tier3);

        // Temple Colonnade Pillars
        [-2.4, 2.4].forEach((px) => {
          [-3.5, 3.5].forEach((pz) => {
            const pillar = new THREE.Mesh(this.getCylinder(0.38, 0.48, 4.0, 6), this.templeStoneMat);
            pillar.position.set(px, 12.5, pz);
            templeGroup.add(pillar);
          });
        });

        // Temple Roof Pediment
        const pediment = new THREE.Mesh(this.getBox(7.0, 1.2, 10.0), this.templeStoneMat);
        pediment.position.y = 15.0;
        templeGroup.add(pediment);

        // Ancient Claw Sigil Stone Plaque with Glowing Gold Relief
        const stoneTex = JurassicRushTextureHelper.getTempleStoneTexture();
        const plaque = new THREE.Mesh(
          this.getPlane(6.0, 6.0),
          new THREE.MeshStandardMaterial({ map: stoneTex, side: THREE.DoubleSide })
        );
        plaque.position.set(-side * 4.9, 5.8, 0);
        plaque.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        templeGroup.add(plaque);

        districtD.add(templeGroup);

        // Towering Ancient Canopy Tree rising behind the temple into the sky
        const backTree = this.buildAncientCanopyTree(side * (curbEdge + 21.0), 0.45, -tz, 1.05);
        districtD.add(backTree);
      });
    });

    // 3. ANIMATED DINOSAUR ENCOUNTER: Apex Carnivore (Tyrannosaur) Roaring from Sanctuary Altar
    // Prominently perched on an elevated ceremonial temple dais at X = curbEdge + 5.5m, Y = 3.8m!
    // Angled menacingly toward the railway so player sees its roaring jaw, teeth and claws!
    const predatorDais = new THREE.Group();
    predatorDais.position.set(curbEdge + 5.5, 0.0, -chunkLength * 0.5);

    const pAnchor = new THREE.Mesh(this.getBox(10.0, 6.5, 15.0), this.templeStoneMat);
    pAnchor.position.y = -2.8;
    predatorDais.add(pAnchor);

    const pPlinth = new THREE.Mesh(this.getBox(9.0, 3.8, 13.5), this.templeStoneMat);
    pPlinth.position.y = 1.9;
    predatorDais.add(pPlinth);

    const pMoss = new THREE.Mesh(this.getBox(9.4, 0.35, 13.9), this.templeMossMat);
    pMoss.position.y = 3.9;
    predatorDais.add(pMoss);

    // Ceremonial Altar Braziers flanking the predator
    [-5.5, 5.5].forEach((bz) => {
      const bzMesh = new THREE.Mesh(this.getCylinder(0.5, 0.35, 1.8, 6), this.templeStoneMat);
      bzMesh.position.set(0, 4.8, bz);
      predatorDais.add(bzMesh);

      const flame = new THREE.Mesh(this.getCone(0.45, 1.0, 6), this.brazierFireMat);
      flame.position.set(0, 6.0, bz);
      predatorDais.add(flame);
    });

    districtD.add(predatorDais);

    const apexPredator = this.buildApexCarnivore(curbEdge + 5.5, 4.0, -chunkLength * 0.5);
    apexPredator.group.rotation.y = Math.PI - 0.40; // Roaring head, snapping teeth and claws facing oncoming runner!
    districtD.add(apexPredator.group);
    director.registerCarnivore(
      apexPredator.group,
      apexPredator.torso,
      apexPredator.head,
      apexPredator.lowerJaw,
      apexPredator.tail,
      9.0
    );

    // 4. Overgrown Megalithic Arch Spanning overhead at Y = 16.5m
    const archGroup = new THREE.Group();
    archGroup.name = 'sanctuary_megalithic_arch';
    archGroup.position.set(0, 16.5, -chunkLength * 0.5);

    const stoneArch = new THREE.Mesh(this.getBox(roadbedWidth + 12.0, 1.4, 4.0), this.templeStoneMat);
    archGroup.add(stoneArch);

    // Massive stone pillars anchoring the megalithic arch down to Y = -5.5m
    [-1, 1].forEach((side) => {
      const archPillar = new THREE.Mesh(this.getBox(3.4, 24.0, 3.8), this.templeStoneMat);
      archPillar.position.set(side * (roadbedWidth * 0.5 + 4.8), -11.0, 0); // Bottom reaches Y = -23m!
      archGroup.add(archPillar);
    });

    const ivyTrim = new THREE.Mesh(this.getBox(roadbedWidth + 12.4, 0.45, 4.2), this.jungleLeafMat);
    ivyTrim.position.y = 0.8;
    archGroup.add(ivyTrim);

    districtD.add(archGroup);
  }

  // =========================================================================
  // ANATOMICALLY SCULPTED PREHISTORIC DINOSAURS
  // =========================================================================

  /**
   * Colossal Long-Necked Sauropod (Brachiosaurus)
   * High-detail articulated sauropod with sculpted compound curved ribcage, counter-shaded belly,
   * 16m curving neck, detailed head with amber eyes and pupils, whip tail, and muscular columnar legs.
   */
  public buildColossalSauropod(x: number, y: number, z: number): {
    group: THREE.Group;
    neck: THREE.Object3D;
    head: THREE.Object3D;
    tail: THREE.Object3D;
    legs: THREE.Object3D[];
  } {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Compound Sculpted Torso (Massive deep barrel ribcage + pelvic flank)
    const torso = new THREE.Group();
    torso.position.y = 11.2;

    // Massive deep chest / ribcage (compound scaled sphere)
    const chest = new THREE.Mesh(this.getSphere(3.8, 10), this.dinosaurSkinMat);
    chest.scale.set(1.0, 1.15, 1.35);
    chest.position.set(0, 0.4, -1.8);
    torso.add(chest);

    // Muscular pelvic hips and flank
    const pelvis = new THREE.Mesh(this.getSphere(3.2, 10), this.dinosaurSkinMat);
    pelvis.scale.set(1.0, 1.05, 1.25);
    pelvis.position.set(0, 0.1, 3.6);
    torso.add(pelvis);

    // High shoulder hump (characteristic Brachiosaurus dorsal arch)
    const shoulderHump = new THREE.Mesh(this.getSphere(2.5, 8), this.dinosaurSkinMat);
    shoulderHump.scale.set(0.85, 1.2, 1.1);
    shoulderHump.position.set(0, 2.8, -3.2);
    torso.add(shoulderHump);

    // Counter-shaded lighter pistachio underbelly
    const belly = new THREE.Mesh(this.getSphere(3.4, 9), this.dinosaurUnderbellyMat);
    belly.scale.set(0.9, 0.45, 2.2);
    belly.position.set(0, -2.8, 0.5);
    torso.add(belly);

    // Dorsal spine ridge scutes running down back
    for (let s = -4; s <= 4; s++) {
      const scute = new THREE.Mesh(this.getCone(0.28, 0.85, 5), this.dinosaurSkinMat);
      scute.position.set(0, 3.6 - Math.abs(s) * 0.25, s * 1.3);
      torso.add(scute);
    }

    group.add(torso);

    // 4 Muscular Columnar Legs with articulated shoulder/hip bulges and bone claws
    const legs: THREE.Object3D[] = [];
    const legConfigs = [
      { lx: -2.4, lz: -3.8, isFront: true },
      { lx: 2.4, lz: -3.8, isFront: true },
      { lx: -2.3, lz: 3.8, isFront: false },
      { lx: 2.3, lz: 3.8, isFront: false }
    ];

    legConfigs.forEach((cfg) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(cfg.lx, 11.2, cfg.lz);

      // Muscular shoulder / hip ball joint
      const shoulderJoint = new THREE.Mesh(this.getSphere(1.6, 8), this.dinosaurSkinMat);
      shoulderJoint.scale.set(1.0, 1.2, 1.1);
      shoulderJoint.position.set(0, 0, 0);
      legGroup.add(shoulderJoint);

      // Upper muscular limb
      const upperLegH = cfg.isFront ? 6.2 : 5.5;
      const upperLeg = new THREE.Mesh(this.getCylinder(1.4, 1.2, upperLegH, 8), this.dinosaurSkinMat);
      upperLeg.position.y = -upperLegH * 0.5;
      legGroup.add(upperLeg);

      // Knee / wrist joint
      const knee = new THREE.Mesh(this.getSphere(1.2, 7), this.dinosaurSkinMat);
      knee.position.y = -upperLegH;
      legGroup.add(knee);

      // Lower leg column
      const lowerLegH = cfg.isFront ? 5.8 : 5.5;
      const lowerLeg = new THREE.Mesh(this.getCylinder(1.15, 1.45, lowerLegH, 8), this.dinosaurSkinMat);
      lowerLeg.position.y = -upperLegH - lowerLegH * 0.5;
      legGroup.add(lowerLeg);

      // Broad elephantine foot pad with claws
      const footY = -upperLegH - lowerLegH;
      const foot = new THREE.Mesh(this.getCylinder(1.5, 1.7, 0.9, 8), this.dinosaurSkinMat);
      foot.position.set(0, footY - 0.45, 0.3);
      legGroup.add(foot);

      // Bone claws on front of foot
      for (let c = -1; c <= 1; c++) {
        const claw = new THREE.Mesh(this.getCone(0.20, 0.65, 5), this.dinosaurClawMat);
        claw.rotation.x = Math.PI / 2;
        claw.position.set(c * 0.65, footY - 0.5, 1.7);
        legGroup.add(claw);
      }

      group.add(legGroup);
      legs.push(legGroup);
    });

    // 16-meter Graceful Curving Articulated S-Neck
    const neck = new THREE.Group();
    neck.position.set(0, 14.2, -5.2);

    // Base neck transition (thick tapering pillar)
    const neckBase = new THREE.Mesh(this.getCylinder(1.3, 1.9, 7.5, 8), this.dinosaurSkinMat);
    neckBase.position.set(0, 3.8, -1.5);
    neckBase.rotation.x = -0.32;
    neck.add(neckBase);

    // Mid neck segment arching vertically
    const neckMid = new THREE.Mesh(this.getCylinder(0.95, 1.3, 8.0, 8), this.dinosaurSkinMat);
    neckMid.position.set(0, 10.4, -3.6);
    neckMid.rotation.x = -0.16;
    neck.add(neckMid);

    // Throat counter-shaded stripe
    const throatStripe = new THREE.Mesh(this.getBox(0.85, 15.0, 0.5), this.dinosaurUnderbellyMat);
    throatStripe.position.set(0, 7.2, -4.5);
    throatStripe.rotation.x = -0.24;
    neck.add(throatStripe);

    // Sculpted Sauropod Head with arched nostrils, brow crest, amber eyes & pupils
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 15.0, -4.8);

    // Skull with rounded cranial dome and arched nasal crest (Brachiosaurus crest)
    const skull = new THREE.Mesh(this.getSphere(1.15, 8), this.dinosaurSkinMat);
    skull.scale.set(0.85, 0.95, 1.35);
    headGroup.add(skull);

    // Tapering snout / muzzle
    const snout = new THREE.Mesh(this.getCylinder(0.65, 0.95, 2.2, 7), this.dinosaurSkinMat);
    snout.rotation.x = -Math.PI / 2;
    snout.position.set(0, -0.3, -1.8);
    headGroup.add(snout);

    // Lower jaw with counter-shaded throat
    const jaw = new THREE.Mesh(this.getBox(1.3, 0.55, 2.8), this.dinosaurUnderbellyMat);
    jaw.position.set(0, -0.9, -0.9);
    headGroup.add(jaw);

    // Piercing amber dinosaur eyes with dark pupils
    [-0.95, 0.95].forEach((ex) => {
      const eye = new THREE.Mesh(this.getSphere(0.24, 7), this.dinosaurEyeMat);
      eye.position.set(ex, 0.35, -0.6);
      headGroup.add(eye);

      const pupil = new THREE.Mesh(this.getSphere(0.12, 6), this.dinosaurPupilMat);
      pupil.position.set(ex * 1.05, 0.35, -0.6);
      headGroup.add(pupil);
    });

    neck.add(headGroup);
    group.add(neck);

    // 14-meter Counterbalancing Whip Tail
    const tail = new THREE.Group();
    tail.position.set(0, 11.2, 6.5);

    const tailBase = new THREE.Mesh(this.getCylinder(0.8, 1.6, 7.5, 8), this.dinosaurSkinMat);
    tailBase.position.set(0, -0.6, 3.8);
    tailBase.rotation.x = 1.35;
    tail.add(tailBase);

    const tailMid = new THREE.Mesh(this.getCylinder(0.4, 0.8, 7.5, 7), this.dinosaurSkinMat);
    tailMid.position.set(0, -1.8, 10.5);
    tailMid.rotation.x = 1.48;
    tail.add(tailMid);

    const tailWhip = new THREE.Mesh(this.getCylinder(0.12, 0.4, 6.5, 5), this.dinosaurSkinMat);
    tailWhip.position.set(0, -2.8, 16.5);
    tailWhip.rotation.x = 1.55;
    tail.add(tailWhip);

    group.add(tail);

    return { group, neck, head: headGroup, tail, legs };
  }

  /**
   * Apex Carnivore Predator (Tyrannosaurus Rex)
   * Terrifying bipedal predator with articulated lower jaw for roaring,
   * ivory teeth, amber eyes with pupils, muscular digitigrade legs, grasping arms, and spined crest.
   */
  public buildApexCarnivore(x: number, y: number, z: number): {
    group: THREE.Group;
    torso: THREE.Object3D;
    head: THREE.Object3D;
    lowerJaw: THREE.Object3D;
    tail: THREE.Object3D;
  } {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Powerful Bipedal Theropod Torso
    const torso = new THREE.Group();
    torso.position.set(0, 6.5, 0);

    // Heavy muscular ribcage (compound scaled sphere for natural barrel chest)
    const chest = new THREE.Mesh(this.getSphere(2.6, 9), this.carnivoreSkinMat);
    chest.scale.set(0.9, 1.25, 1.65);
    chest.position.set(0, 0.2, -0.5);
    torso.add(chest);

    // Counter-shaded golden belly
    const belly = new THREE.Mesh(this.getSphere(2.2, 8), this.carnivoreBellyMat);
    belly.scale.set(0.85, 0.5, 1.5);
    belly.position.set(0, -1.8, -0.3);
    torso.add(belly);

    // Spined dorsal scutes running along the backbone
    for (let s = -3; s <= 3; s++) {
      const scute = new THREE.Mesh(this.getCone(0.25, 0.9, 4), this.carnivoreSkinMat);
      scute.position.set(0, 2.8, s * 0.9);
      torso.add(scute);
    }

    // Massive Predatory Head & Snapping Jaws
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.4, -4.8);

    // Flared postorbital skull and heavy snout
    const skull = new THREE.Mesh(this.getSphere(1.6, 8), this.carnivoreSkinMat);
    skull.scale.set(0.95, 1.05, 1.5);
    headGroup.add(skull);

    // Snout bridge
    const snout = new THREE.Mesh(this.getCylinder(0.8, 1.1, 2.6, 7), this.carnivoreSkinMat);
    snout.rotation.x = -Math.PI / 2;
    snout.position.set(0, -0.2, -1.8);
    headGroup.add(snout);

    // Upper fangs row (sharp curved ivory teeth)
    for (let t = -1.6; t <= 1.6; t += 0.8) {
      const toothL = new THREE.Mesh(this.getCone(0.09, 0.42, 4), this.dinosaurClawMat);
      toothL.rotation.x = Math.PI;
      toothL.position.set(-0.95, -1.0, t - 1.2);
      headGroup.add(toothL);

      const toothR = new THREE.Mesh(this.getCone(0.09, 0.42, 4), this.dinosaurClawMat);
      toothR.rotation.x = Math.PI;
      toothR.position.set(0.95, -1.0, t - 1.2);
      headGroup.add(toothR);
    }

    // Piercing amber predator eyes with dark pupils under heavy orbital brow
    [-1.25, 1.25].forEach((ex) => {
      const brow = new THREE.Mesh(this.getBox(0.45, 0.25, 0.9), this.carnivoreSkinMat);
      brow.position.set(ex, 0.75, -0.8);
      headGroup.add(brow);

      const eye = new THREE.Mesh(this.getSphere(0.24, 7), this.dinosaurEyeMat);
      eye.position.set(ex, 0.45, -0.8);
      headGroup.add(eye);

      const pupil = new THREE.Mesh(this.getSphere(0.12, 6), this.dinosaurPupilMat);
      pupil.position.set(ex * 1.05, 0.45, -0.8);
      headGroup.add(pupil);
    });

    // Articulated Lower Jaw (Pivots during roaring tick in EventDirector)
    const lowerJaw = new THREE.Group();
    lowerJaw.position.set(0, -1.2, 0.8);

    const jawBone = new THREE.Mesh(this.getBox(1.9, 0.8, 4.0), this.carnivoreSkinMat);
    jawBone.position.set(0, 0, -1.2);
    lowerJaw.add(jawBone);

    // Lower jaw teeth row
    for (let t = -2.6; t <= -0.2; t += 0.8) {
      const toothL = new THREE.Mesh(this.getCone(0.08, 0.38, 4), this.dinosaurClawMat);
      toothL.position.set(-0.85, 0.5, t);
      lowerJaw.add(toothL);

      const toothR = new THREE.Mesh(this.getCone(0.08, 0.38, 4), this.dinosaurClawMat);
      toothR.position.set(0.85, 0.5, t);
      lowerJaw.add(toothR);
    }

    headGroup.add(lowerJaw);
    torso.add(headGroup);

    // Grasping 2-Clawed Forearms
    [-1.6, 1.6].forEach((ax) => {
      const arm = new THREE.Group();
      arm.position.set(ax, -0.8, -2.6);

      const bicep = new THREE.Mesh(this.getCylinder(0.20, 0.16, 1.4, 5), this.carnivoreSkinMat);
      bicep.rotation.x = 0.6;
      arm.add(bicep);

      const claw1 = new THREE.Mesh(this.getCone(0.06, 0.3, 4), this.dinosaurClawMat);
      claw1.rotation.x = 1.2;
      claw1.position.set(-0.1, -0.8, 0.6);
      arm.add(claw1);

      const claw2 = new THREE.Mesh(this.getCone(0.06, 0.3, 4), this.dinosaurClawMat);
      claw2.rotation.x = 1.2;
      claw2.position.set(0.1, -0.8, 0.6);
      arm.add(claw2);

      torso.add(arm);
    });

    // Counterbalancing Heavy Tail
    const tail = new THREE.Group();
    tail.position.set(0, 0.6, 3.8);

    const tailBase = new THREE.Mesh(this.getCylinder(0.65, 1.4, 5.5, 8), this.carnivoreSkinMat);
    tailBase.position.set(0, -0.2, 2.8);
    tailBase.rotation.x = Math.PI / 2;
    tail.add(tailBase);

    const tailEnd = new THREE.Mesh(this.getCylinder(0.25, 0.65, 6.0, 6), this.carnivoreSkinMat);
    tailEnd.position.set(0, 0.3, 7.8);
    tailEnd.rotation.x = Math.PI / 2;
    tail.add(tailEnd);

    torso.add(tail);
    group.add(torso);

    // Powerful Muscular Digitigrade Legs
    [-1.8, 1.8].forEach((lx) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(lx, 6.5, 0);

      // Muscular thigh bulge
      const thigh = new THREE.Mesh(this.getCylinder(0.9, 1.4, 4.0, 7), this.carnivoreSkinMat);
      thigh.position.set(0, -1.8, 0.4);
      thigh.rotation.x = 0.35;
      legGroup.add(thigh);

      // Shin
      const shin = new THREE.Mesh(this.getCylinder(0.65, 0.55, 4.2, 6), this.carnivoreSkinMat);
      shin.position.set(0, -4.5, -0.4);
      shin.rotation.x = -0.30;
      legGroup.add(shin);

      // Taloned foot
      const foot = new THREE.Mesh(this.getBox(1.5, 0.5, 2.2), this.carnivoreSkinMat);
      foot.position.set(0, -6.2, 0.5);
      legGroup.add(foot);

      // 3 Predatory Claws
      for (let c = -1; c <= 1; c++) {
        const claw = new THREE.Mesh(this.getCone(0.12, 0.65, 5), this.dinosaurClawMat);
        claw.rotation.x = Math.PI / 2;
        claw.position.set(c * 0.45, -6.2, 1.8);
        legGroup.add(claw);
      }

      group.add(legGroup);
    });

    return { group, torso, head: headGroup, lowerJaw, tail };
  }

  /**
   * Pack of 3 Agile Sprinting Raptors (Velociraptors)
   * Sleek aerodynamic pack with counter-shaded flank stripes, articulated running legs,
   * raised sickle claws, and grasping 3-clawed arms.
   */
  public buildRaptorPack(x: number, y: number, z: number): {
    group: THREE.Group;
    raptors: Array<{
      group: THREE.Group;
      legs: THREE.Object3D[];
      tail: THREE.Object3D;
      head: THREE.Object3D;
      phaseOffset: number;
    }>;
  } {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const raptors: Array<{
      group: THREE.Group;
      legs: THREE.Object3D[];
      tail: THREE.Object3D;
      head: THREE.Object3D;
      phaseOffset: number;
    }> = [];

    const offsets = [
      { x: 0, z: 0, phase: 0 },
      { x: 2.4, z: 4.5, phase: Math.PI * 0.4 },
      { x: -2.2, z: 7.2, phase: Math.PI * 0.8 }
    ];

    offsets.forEach((off) => {
      const rapGroup = new THREE.Group();
      rapGroup.position.set(off.x, 0, off.z);

      // Aerodynamic Torso (compound tapered shape)
      const body = new THREE.Mesh(this.getSphere(0.9, 8), this.raptorGreenMat);
      body.scale.set(0.7, 0.8, 1.8);
      body.position.y = 1.8;
      rapGroup.add(body);

      // Dorsal speed stripe
      const stripe = new THREE.Mesh(this.getBox(0.35, 0.25, 2.8), this.raptorTealMat);
      stripe.position.set(0, 2.4, 0);
      rapGroup.add(stripe);

      // S-Curved Neck & Snarling Raptor Head
      const head = new THREE.Group();
      head.position.set(0, 2.2, -1.8);

      const skull = new THREE.Mesh(this.getSphere(0.55, 7), this.raptorGreenMat);
      skull.scale.set(0.75, 0.8, 1.6);
      head.add(skull);

      // Yellow predatory eyes with pupils
      [-0.42, 0.42].forEach((ex) => {
        const eye = new THREE.Mesh(this.getSphere(0.12, 6), this.dinosaurEyeMat);
        eye.position.set(ex, 0.2, -0.4);
        head.add(eye);

        const pupil = new THREE.Mesh(this.getSphere(0.06, 5), this.dinosaurPupilMat);
        pupil.position.set(ex * 1.05, 0.2, -0.4);
        head.add(pupil);
      });

      // Snarling white teeth
      const tooth = new THREE.Mesh(this.getCone(0.04, 0.22, 4), this.dinosaurClawMat);
      tooth.rotation.x = Math.PI;
      tooth.position.set(0, -0.45, -0.8);
      head.add(tooth);

      rapGroup.add(head);

      // Stiff Horizontal Balancing Tail
      const tail = new THREE.Mesh(this.getCylinder(0.10, 0.32, 5.2, 6), this.raptorGreenMat);
      tail.position.set(0, 1.8, 3.6);
      tail.rotation.x = Math.PI / 2;
      rapGroup.add(tail);

      // 2 Athletic Running Legs with Raised Sickle Claws
      const legs: THREE.Object3D[] = [];
      [-0.55, 0.55].forEach((lx) => {
        const legGroup = new THREE.Group();
        legGroup.position.set(lx, 1.8, 0);

        const thigh = new THREE.Mesh(this.getCylinder(0.24, 0.18, 1.5, 6), this.raptorGreenMat);
        thigh.position.y = -0.75;
        legGroup.add(thigh);

        const shin = new THREE.Mesh(this.getCylinder(0.16, 0.12, 1.5, 6), this.raptorGreenMat);
        shin.position.set(0, -1.8, -0.2);
        legGroup.add(shin);

        // Raised Curved Sickle Claw
        const sickleClaw = new THREE.Mesh(this.getCone(0.08, 0.38, 4), this.dinosaurClawMat);
        sickleClaw.rotation.x = -0.8;
        sickleClaw.position.set(0, -2.4, 0.4);
        legGroup.add(sickleClaw);

        rapGroup.add(legGroup);
        legs.push(legGroup);
      });

      group.add(rapGroup);
      raptors.push({ group: rapGroup, legs, tail, head, phaseOffset: off.phase });
    });

    return { group, raptors };
  }

  /**
   * Gliding Pterosaur Flock
   */
  public buildPterosaurFlock(z: number): {
    group: THREE.Group;
    gliders: Array<{
      mesh: THREE.Group;
      leftWing: THREE.Object3D;
      rightWing: THREE.Object3D;
      phaseOffset: number;
      baseAltitude: number;
    }>;
  } {
    const group = new THREE.Group();
    group.position.set(0, 0, z);

    const gliders: Array<{
      mesh: THREE.Group;
      leftWing: THREE.Object3D;
      rightWing: THREE.Object3D;
      phaseOffset: number;
      baseAltitude: number;
    }> = [];

    const flockData = [
      { x: -11.0, y: 22.0, z: 0, phase: 0 },
      { x: 10.0, y: 25.0, z: -8.0, phase: 1.2 },
      { x: 0, y: 27.0, z: -16.0, phase: 2.4 }
    ];

    flockData.forEach((fd) => {
      const glider = new THREE.Group();
      glider.position.set(fd.x, fd.y, fd.z);

      // Torso & Cranial Crest (Pteranodon backward crest)
      const body = new THREE.Mesh(this.getCylinder(0.28, 0.42, 2.5, 6), this.pterosaurWingsMat);
      body.rotation.x = Math.PI / 2;
      glider.add(body);

      // Backward cranial crest
      const crest = new THREE.Mesh(this.getCone(0.18, 1.4, 4), this.pterosaurWingsMat);
      crest.rotation.x = Math.PI * 0.75;
      crest.position.set(0, 0.4, 0.8);
      glider.add(crest);

      // Sharp fishing beak
      const beak = new THREE.Mesh(this.getCone(0.22, 1.6, 5), this.dinosaurClawMat);
      beak.rotation.x = -Math.PI / 2;
      beak.position.set(0, 0, -1.9);
      glider.add(beak);

      // Cambered Left Wing with spar
      const leftWingGroup = new THREE.Group();
      leftWingGroup.position.set(-0.4, 0, 0);

      const leftWingMesh = new THREE.Mesh(this.getPlane(4.8, 2.0), this.pterosaurWingsMat);
      leftWingMesh.position.set(-2.4, 0, 0);
      leftWingMesh.rotation.x = Math.PI / 2;
      leftWingGroup.add(leftWingMesh);
      glider.add(leftWingGroup);

      // Cambered Right Wing with spar
      const rightWingGroup = new THREE.Group();
      rightWingGroup.position.set(0.4, 0, 0);

      const rightWingMesh = new THREE.Mesh(this.getPlane(4.8, 2.0), this.pterosaurWingsMat);
      rightWingMesh.position.set(2.4, 0, 0);
      rightWingMesh.rotation.x = Math.PI / 2;
      rightWingGroup.add(rightWingMesh);
      glider.add(rightWingGroup);

      group.add(glider);
      gliders.push({
        mesh: glider,
        leftWing: leftWingGroup,
        rightWing: rightWingGroup,
        phaseOffset: fd.phase,
        baseAltitude: fd.y
      });
    });

    return { group, gliders };
  }

  /**
   * Herd of Grazing Armored Herbivores (Triceratops)
   * Armored quadruped herbivores with authentic scalloped neck frills,
   * triple bone horns, and grazing animation.
   */
  public buildHerbivoreHerd(x: number, y: number, z: number): {
    group: THREE.Group;
    members: Array<{
      group: THREE.Group;
      head: THREE.Object3D;
      tail: THREE.Object3D;
      phaseOffset: number;
    }>;
  } {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const members: Array<{
      group: THREE.Group;
      head: THREE.Object3D;
      tail: THREE.Object3D;
      phaseOffset: number;
    }> = [];

    for (let m = 0; m < 3; m++) {
      const mGroup = new THREE.Group();
      mGroup.position.set(m * 3.8, 0, m * 4.5);

      // Heavy Armored Body (compound barrel shape)
      const body = new THREE.Mesh(this.getSphere(1.8, 9), this.herbivoreSkinMat);
      body.scale.set(0.95, 0.9, 1.55);
      body.position.y = 2.6;
      mGroup.add(body);

      // Sculpted Triceratops Head with Monumental Neck Frill
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 3.0, -3.2);

      const skull = new THREE.Mesh(this.getSphere(1.1, 7), this.herbivoreSkinMat);
      skull.scale.set(0.85, 0.85, 1.2);
      headGroup.add(skull);

      // Massive Armored Neck Frill with Warning Coloration
      const frill = new THREE.Mesh(this.getCylinder(1.9, 1.4, 0.35, 8), this.herbivoreFrillMat);
      frill.position.set(0, 1.2, 0.7);
      frill.rotation.x = 0.45;
      headGroup.add(frill);

      // 2 Long Sweeping Brow Horns
      [-0.85, 0.85].forEach((hx) => {
        const horn = new THREE.Mesh(this.getCone(0.18, 1.9, 6), this.dinosaurClawMat);
        horn.rotation.x = -1.1;
        horn.position.set(hx, 1.2, -1.4);
        headGroup.add(horn);
      });

      // 1 Sharp Nasal Horn
      const noseHorn = new THREE.Mesh(this.getCone(0.14, 0.95, 5), this.dinosaurClawMat);
      noseHorn.rotation.x = -0.5;
      noseHorn.position.set(0, 0.6, -2.0);
      headGroup.add(noseHorn);

      mGroup.add(headGroup);

      // Counterbalancing Tail
      const tail = new THREE.Mesh(this.getCylinder(0.20, 0.50, 4.0, 6), this.herbivoreSkinMat);
      tail.position.set(0, 2.4, 4.2);
      tail.rotation.x = Math.PI / 2;
      mGroup.add(tail);

      // 4 Sturdy Quadruped Legs
      [-1.2, 1.2].forEach((lx) => {
        [-1.8, 1.8].forEach((lz) => {
          const leg = new THREE.Mesh(this.getCylinder(0.45, 0.55, 2.6, 6), this.herbivoreSkinMat);
          leg.position.set(lx, 1.3, lz);
          mGroup.add(leg);
        });
      });

      group.add(mGroup);
      members.push({ group: mGroup, head: headGroup, tail, phaseOffset: m * 1.5 });
    }

    return { group, members };
  }

  /**
   * Curious Giant Dinosaur Watcher (District A)
   * Adolescent long-necked sauropod peering down through the canopy at X = -13.0m
   */
  public buildCuriousDinosaurWatcher(x: number, y: number, z: number): {
    group: THREE.Group;
    neck: THREE.Object3D;
    head: THREE.Object3D;
  } {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Torso with counter-shaded underbelly (compound smooth shapes)
    const body = new THREE.Mesh(this.getSphere(2.8, 9), this.dinosaurSkinMat);
    body.scale.set(0.9, 1.0, 1.45);
    body.position.y = 7.0;
    group.add(body);

    const belly = new THREE.Mesh(this.getSphere(2.4, 8), this.dinosaurUnderbellyMat);
    belly.scale.set(0.85, 0.45, 1.3);
    belly.position.set(0, 5.2, 0);
    group.add(belly);

    // Long Graceful Curving Neck
    const neck = new THREE.Group();
    neck.position.set(0, 9.5, -3.6);

    const neckMesh = new THREE.Mesh(this.getCylinder(0.75, 1.3, 10.0, 8), this.dinosaurSkinMat);
    neckMesh.position.y = 5.0;
    neckMesh.rotation.x = -0.22;
    neck.add(neckMesh);

    // Sculpted Head with amber eyes and pupils turned to watch the runner
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 10.0, 0);

    const head = new THREE.Mesh(this.getSphere(1.0, 8), this.dinosaurSkinMat);
    head.scale.set(0.85, 0.85, 1.35);
    headGroup.add(head);

    [-0.85, 0.85].forEach((ex) => {
      const eye = new THREE.Mesh(this.getSphere(0.20, 6), this.dinosaurEyeMat);
      eye.position.set(ex, 0.3, -0.4);
      headGroup.add(eye);

      const pupil = new THREE.Mesh(this.getSphere(0.10, 5), this.dinosaurPupilMat);
      pupil.position.set(ex * 1.05, 0.3, -0.4);
      headGroup.add(pupil);
    });

    neck.add(headGroup);
    group.add(neck);

    // 4 Columnar Legs
    [-1.7, 1.7].forEach((lx) => {
      [-2.8, 2.8].forEach((lz) => {
        const leg = new THREE.Mesh(this.getCylinder(0.70, 0.90, 7.0, 7), this.dinosaurSkinMat);
        leg.position.set(lx, 3.5, lz);
        group.add(leg);
      });
    });

    return { group, neck, head: headGroup };
  }

  // =========================================================================
  // COMPLETE STANDALONE SHOWCASE EXPEDITION LOCOMOTIVE
  // Matching exact runner train envelope (2.5m x 4.0m x 22.4m)
  // =========================================================================

  public buildJurassicRushShowcaseTrain(x: number = 0, y: number = 0, z: number = 0): THREE.Group {
    const train = new THREE.Group();
    train.name = 'jurassic_rush_expedition_locomotive';
    train.position.set(x, y, z);

    const livery = JURASSIC_RUSH_TRAIN_LIVERY;

    // Main Locomotive Body (Heavy safari olive & expedition steel, width 2.4m)
    const body = new THREE.Mesh(this.getBox(2.4, 2.2, 21.0), new THREE.MeshStandardMaterial({
      color: livery.primaryColors[0],
      metalness: livery.metalness,
      roughness: livery.roughness
    }));
    body.position.y = 1.8;
    train.add(body);

    // Heavy Brush-Guard Cowcatcher
    const cowcatcher = new THREE.Mesh(this.getCylinder(0.2, 0.75, 1.8, 4), new THREE.MeshStandardMaterial({
      color: livery.accentColor,
      metalness: 0.85,
      roughness: 0.25
    }));
    cowcatcher.rotation.y = Math.PI / 4;
    cowcatcher.position.set(0, 1.1, -10.8);
    train.add(cowcatcher);

    // Reinforced Rooftop Observation Dome
    const dome = new THREE.Mesh(this.getCylinder(0.85, 0.85, 10.0, 12), this.expeditionSteelMat);
    dome.rotation.x = Math.PI / 2;
    dome.position.set(0, 2.7, -2.0);
    train.add(dome);

    // Twin Expedition Searchlights on Roof
    [-7.5, -4.5].forEach((cz) => {
      const light = new THREE.Mesh(this.getCylinder(0.28, 0.22, 1.0, 8), this.observationGlassMat);
      light.position.set(0, 3.5, cz);
      train.add(light);
    });

    // High-Visibility Amber Windows along Cab & Carriages
    [-1.21, 1.21].forEach((wx) => {
      const winStrip = new THREE.Mesh(this.getBox(0.08, 0.65, 16.0), this.observationGlassMat);
      winStrip.position.set(wx, 2.4, 1.0);
      train.add(winStrip);
    });

    // Heavy Expedition Wheel Bogies
    [-1.1, 1.1].forEach((bx) => {
      [-8.5, -5.5, -2.5, 2.5, 5.5, 8.5].forEach((wz) => {
        const wheel = new THREE.Mesh(this.getCylinder(0.48, 0.48, 0.22, 12), this.expeditionSteelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(bx, 0.48, wz);
        train.add(wheel);

        const hub = new THREE.Mesh(this.getCylinder(0.2, 0.2, 0.25, 8), new THREE.MeshStandardMaterial({
          color: livery.accentColor,
          metalness: 0.85,
          roughness: 0.25
        }));
        hub.rotation.z = Math.PI / 2;
        hub.position.set(bx, 0.48, wz);
        train.add(hub);
      });
    });

    return train;
  }
}
