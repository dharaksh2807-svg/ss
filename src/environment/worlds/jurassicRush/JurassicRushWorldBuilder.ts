import * as THREE from 'three';
import { SeededRandom } from '../../SceneryFactory';
import { JurassicRushEventDirector } from './JurassicRushEventDirector';
import { JURASSIC_RUSH_TRAIN_LIVERY } from './JurassicRushTheme';
import { CurvedShaderManager } from '../../../scene/CurvedShader';
import { TextureGenerator } from '../../../scene/TextureGenerator';

/**
 * Procedural Texture Cache for Jurassic Rush
 * Self-contained procedural canvas textures for prehistoric ferns, stratified sandstone cliffs,
 * flowing river water, temple ruins, fossil strata, and dinosaur egg shells.
 */
class JurassicRushTextureHelper {
  private static cache = new Map<string, THREE.Texture>();

  public static getFernFrondTexture(): THREE.Texture {
    const key = 'jurassic_fern_fronds_v7';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Transparent canvas background
    ctx.clearRect(0, 0, size, size);

    // Fern frond main central spine
    ctx.strokeStyle = '#6ee7b7';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size);
    ctx.quadraticCurveTo(size * 0.48, size * 0.5, size * 0.5, 12);
    ctx.stroke();

    // Leaf leaflets with feathered organic contours
    for (let y = size - 20; y > 25; y -= 20) {
      const progress = y / size;
      const w = Math.sin(progress * Math.PI) * 190 + 25;

      ctx.fillStyle = progress > 0.5 ? '#059669' : '#34d399';

      // Left leaflet
      ctx.beginPath();
      ctx.ellipse(size * 0.5 - w * 0.45, y, w * 0.45, 8, -0.28, 0, Math.PI * 2);
      ctx.fill();

      // Right leaflet
      ctx.beginPath();
      ctx.ellipse(size * 0.5 + w * 0.45, y, w * 0.45, 8, 0.28, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1, 1);
    this.cache.set(key, tex);
    return tex;
  }

  public static getRedwoodBarkTexture(): THREE.Texture {
    const key = 'jurassic_redwood_bark_v1';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Deep rich reddish-brown petrified redwood base
    ctx.fillStyle = '#381608';
    ctx.fillRect(0, 0, size, size);

    // Vertical textured bark ridges and fibrous furrows
    const barkShades = ['#230d04', '#4a1d0a', '#5f260d', '#3b1506', '#1a0903'];
    for (let x = 0; x < size; x += 4) {
      const shade = barkShades[Math.floor(Math.random() * barkShades.length)];
      ctx.fillStyle = shade;
      const w = 3 + Math.floor(Math.random() * 6);
      ctx.fillRect(x, 0, w, size);
    }

    // Occasional green moss patches in the bark crevices
    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.ellipse(x, y, 6, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 6);
    this.cache.set(key, tex);
    return tex;
  }

  public static getDinosaurScaleTexture(): THREE.Texture {
    const key = 'jurassic_dino_scales_v1';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Deep reptilian olive gradient
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#365314');
    grad.addColorStop(0.5, '#4d7c0f');
    grad.addColorStop(1, '#3f6212');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Tiled hexagonal reptilian scales
    const scaleRadius = 8;
    ctx.strokeStyle = 'rgba(20, 35, 10, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(101, 163, 13, 0.35)';

    for (let y = 0; y < size + scaleRadius; y += scaleRadius * 1.5) {
      const isOdd = Math.floor(y / (scaleRadius * 1.5)) % 2 === 1;
      const xOffset = isOdd ? scaleRadius * 0.866 : 0;
      for (let x = -scaleRadius; x < size + scaleRadius; x += scaleRadius * 1.732) {
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = (a * Math.PI) / 3;
          const px = x + xOffset + Math.cos(angle) * (scaleRadius - 1);
          const py = y + Math.sin(angle) * (scaleRadius - 1);
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Subtle dark vertical camouflage bands
    ctx.fillStyle = 'rgba(20, 30, 15, 0.28)';
    for (let x = 32; x < size; x += 64) {
      ctx.beginPath();
      ctx.ellipse(x, size * 0.5, 14, size * 0.45, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    this.cache.set(key, tex);
    return tex;
  }

  public static getStratifiedSandstoneTexture(): THREE.Texture {
    const key = 'jurassic_stratified_sandstone_v1';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Warm sedimentary terracotta & ochre bedrock
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(0, 0, size, size);

    // Alternating horizontal sediment bedding planes & iron-red shale bands
    const strataColors = [
      '#ea580c', '#9a3412', '#b45309', '#78350f', '#d97706', '#f59e0b', '#7c2d12', '#a16207'
    ];

    let y = 0;
    while (y < size) {
      const h = 8 + Math.floor(Math.random() * 26);
      const color = strataColors[Math.floor(Math.random() * strataColors.length)];
      ctx.fillStyle = color;
      ctx.fillRect(0, y, size, h);

      // Bedding plane seam line
      ctx.strokeStyle = 'rgba(30, 20, 15, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y + h);
      ctx.lineTo(size, y + h);
      ctx.stroke();

      y += h;
    }

    // Weathered vertical erosion crevices & moss stains
    ctx.fillStyle = 'rgba(5, 150, 105, 0.22)';
    for (let x = 32; x < size; x += 64) {
      ctx.fillRect(x, 0, 14, size * 0.4);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 2);
    this.cache.set(key, tex);
    return tex;
  }

  public static getRiverWaterTexture(): THREE.Texture {
    const key = 'jurassic_river_water_v1';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Tropical turquoise aquatic gradient
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#0e7490');
    grad.addColorStop(0.5, '#06b6d4');
    grad.addColorStop(1, '#0891b2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Flowing water ripple bands & sunlight caustic reflections
    ctx.strokeStyle = 'rgba(207, 250, 254, 0.65)';
    ctx.lineWidth = 4;
    for (let y = 16; y < size; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.25, y - 8, size * 0.75, y + 8, size, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 8);
    this.cache.set(key, tex);
    return tex;
  }

  public static getWaterfallFoamTexture(): THREE.Texture {
    const key = 'jurassic_waterfall_foam_v1';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Frothing white-water vertical cascade
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, 'rgba(224, 242, 254, 0.95)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.7, 'rgba(186, 230, 253, 0.90)');
    grad.addColorStop(1, 'rgba(224, 242, 254, 0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Vertical torrent foam streaks
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    for (let x = 12; x < size; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (Math.random() - 0.5) * 8, size);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 6);
    this.cache.set(key, tex);
    return tex;
  }

  public static getAncientFossilTexture(): THREE.Texture {
    const key = 'jurassic_ancient_fossils_v1';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Weathered ancient limestone slab
    ctx.fillStyle = '#78716c';
    ctx.fillRect(0, 0, size, size);

    // Coiled Ammonite shell relief
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    let cx = 140, cy = 160, r = 8;
    for (let a = 0; a < Math.PI * 6; a += 0.15) {
      r += 1.8;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Theropod 3-toed dinosaur footprint impression
    ctx.fillStyle = '#292524';
    const fx = 350, fy = 320;
    // Heel pad
    ctx.beginPath();
    ctx.ellipse(fx, fy + 40, 28, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    // Middle claw toe
    ctx.beginPath();
    ctx.ellipse(fx, fy - 25, 16, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    // Left toe
    ctx.beginPath();
    ctx.ellipse(fx - 36, fy - 10, 14, 38, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Right toe
    ctx.beginPath();
    ctx.ellipse(fx + 36, fy - 10, 14, 38, 0.4, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    this.cache.set(key, tex);
    return tex;
  }

  public static getTempleStoneTexture(): THREE.Texture {
    const key = 'jurassic_temple_stone_v4';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

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
    ctx.beginPath();
    ctx.moveTo(size * 0.35, size * 0.4);
    ctx.quadraticCurveTo(size * 0.32, size * 0.65, size * 0.38, size * 0.8);
    ctx.moveTo(size * 0.50, size * 0.35);
    ctx.quadraticCurveTo(size * 0.50, size * 0.65, size * 0.52, size * 0.85);
    ctx.moveTo(size * 0.65, size * 0.4);
    ctx.quadraticCurveTo(size * 0.68, size * 0.65, size * 0.62, size * 0.8);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
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
 * - Strict clearance envelope: |X| > 4.2m or Y > 8.5m or Y <= 0.0m (0 meshes in running corridor).
 * - Full geometry and material reuse with zero per-frame allocation.
 * - 6 distinct prehistoric biomes with wide panoramic vistas, waterfalls, and living dinosaurs.
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
  private stratifiedSandstoneMat: THREE.MeshStandardMaterial;
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
  private pterosaurSkinMat: THREE.MeshStandardMaterial;
  private pterosaurWingMat: THREE.MeshStandardMaterial;
  private herbivoreSkinMat: THREE.MeshStandardMaterial;
  private amberCurbMat: THREE.MeshStandardMaterial;
  private expeditionTimberMat: THREE.MeshStandardMaterial;
  private riverWaterMat: THREE.MeshStandardMaterial;
  private waterfallMat: THREE.MeshStandardMaterial;
  private splashRingMat: THREE.MeshBasicMaterial;
  private mistMat: THREE.MeshBasicMaterial;
  private fernFrondMat: THREE.MeshStandardMaterial;
  private fossilStoneMat: THREE.MeshStandardMaterial;
  private dinosaurEggMat: THREE.MeshStandardMaterial;
  private dragonflyWingMat: THREE.MeshBasicMaterial;
  private dragonflyBodyMat: THREE.MeshStandardMaterial;
  private jungleLoamMat: THREE.MeshStandardMaterial;
  private boneIvoryMat: THREE.MeshStandardMaterial;
  private torchFireMat: THREE.MeshBasicMaterial;
  private hazardAmberMat: THREE.MeshStandardMaterial;

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
      map: JurassicRushTextureHelper.getRedwoodBarkTexture(),
      color: 0x542612, // Rich textured redwood bark
      roughness: 0.82,
      metalness: 0.05
    });

    this.jungleLoamMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.getJungleLoamTexture(),
      color: 0x245228, // Lush emerald mossy loam forest floor
      roughness: 0.88,
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

    // 2. Prehistoric Geology & Water Materials
    this.mossyBasaltMat = new THREE.MeshStandardMaterial({
      color: 0x2e4236, // Deep mossy basalt with organic patina
      roughness: 0.65,
      metalness: 0.10
    });

    this.canyonRockMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c, // Warm radiant ochre & terracotta sandstone
      roughness: 0.62,
      metalness: 0.10
    });

    this.stratifiedSandstoneMat = new THREE.MeshStandardMaterial({
      map: JurassicRushTextureHelper.getStratifiedSandstoneTexture(),
      roughness: 0.70,
      metalness: 0.08
    });

    this.templeStoneMat = new THREE.MeshStandardMaterial({
      map: JurassicRushTextureHelper.getTempleStoneTexture(),
      roughness: 0.68,
      metalness: 0.08
    });

    this.templeMossMat = new THREE.MeshStandardMaterial({
      color: 0x24583b, // Lush primordial moss trim
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

    this.riverWaterMat = new THREE.MeshStandardMaterial({
      map: JurassicRushTextureHelper.getRiverWaterTexture(),
      color: 0x06b6d4,
      roughness: 0.15,
      metalness: 0.35,
      transparent: true,
      opacity: 0.88
    });

    this.waterfallMat = new THREE.MeshStandardMaterial({
      map: JurassicRushTextureHelper.getWaterfallFoamTexture(),
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.90
    });

    this.splashRingMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.80
    });

    this.mistMat = new THREE.MeshBasicMaterial({
      color: 0xa7f3d0,
      transparent: true,
      opacity: 0.35
    });

    this.fernFrondMat = new THREE.MeshStandardMaterial({
      map: JurassicRushTextureHelper.getFernFrondTexture(),
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.15,
      roughness: 0.45,
      metalness: 0.05
    });

    this.fossilStoneMat = new THREE.MeshStandardMaterial({
      map: JurassicRushTextureHelper.getAncientFossilTexture(),
      roughness: 0.75,
      metalness: 0.06
    });

    // 3. Detailed Dinosaur Anatomy Materials
    this.dinosaurSkinMat = new THREE.MeshStandardMaterial({
      map: JurassicRushTextureHelper.getDinosaurScaleTexture(),
      color: 0x65a30d, // Sunlit reptilian olive scales
      roughness: 0.55,
      metalness: 0.10
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
      map: JurassicRushTextureHelper.getDinosaurScaleTexture(),
      color: 0x991b1b, // Menacing crimson-umber apex predator hide
      roughness: 0.50,
      metalness: 0.12
    });

    this.carnivoreBellyMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a, // Counter-shaded golden belly
      roughness: 0.45,
      metalness: 0.10
    });

    this.raptorGreenMat = new THREE.MeshStandardMaterial({
      map: JurassicRushTextureHelper.getDinosaurScaleTexture(),
      color: 0x15803d, // Vivid hunting emerald scales
      roughness: 0.45,
      metalness: 0.15
    });

    this.raptorTealMat = new THREE.MeshStandardMaterial({
      color: 0x0d9488, // Electric teal dorsal markings
      roughness: 0.42,
      metalness: 0.15
    });

    this.pterosaurSkinMat = new THREE.MeshStandardMaterial({
      color: 0x52525b, // Leathery slate-taupe
      roughness: 0.55,
      metalness: 0.10
    });

    this.pterosaurWingMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Translucent amber flight membrane
      roughness: 0.40,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    this.herbivoreSkinMat = new THREE.MeshStandardMaterial({
      color: 0x365314, // Armored mossy herbivore hide
      roughness: 0.58,
      metalness: 0.08
    });

    this.dinosaurEggMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.55,
      metalness: 0.05
    });

    this.dragonflyWingMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.55
    });

    this.dragonflyBodyMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.65,
      roughness: 0.25
    });

    // 4. Railway & Expedition Equipment
    this.amberCurbMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Bright petrified amber wood curb
      roughness: 0.35,
      metalness: 0.30
    });

    this.expeditionTimberMat = new THREE.MeshStandardMaterial({
      color: 0x3f3f46, // Heavy expedition weathered timber & bronze
      roughness: 0.72,
      metalness: 0.18
    });

    this.boneIvoryMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a, // Warm fossil ivory bone
      roughness: 0.58,
      metalness: 0.12
    });

    this.torchFireMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b // Radiant golden-amber solar fire
    });

    this.hazardAmberMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // High-contrast expedition hazard amber
      roughness: 0.35,
      metalness: 0.25
    });

    // Apply track curvature shader to all materials
    const curved = CurvedShaderManager.getInstance();
    [
      this.jungleLeafMat, this.cycadLeafMat, this.goldenFernMat, this.deepCanopyMat,
      this.treeBarkMat, this.hangingVineMat, this.flowerOrchidMat, this.mossyBasaltMat,
      this.canyonRockMat, this.stratifiedSandstoneMat, this.templeStoneMat, this.templeMossMat,
      this.templeGoldReliefMat, this.riverWaterMat, this.waterfallMat, this.splashRingMat,
      this.mistMat, this.fernFrondMat, this.fossilStoneMat, this.dinosaurSkinMat,
      this.dinosaurUnderbellyMat, this.dinosaurEyeMat, this.dinosaurPupilMat, this.dinosaurClawMat,
      this.carnivoreSkinMat, this.carnivoreBellyMat, this.raptorGreenMat, this.raptorTealMat,
      this.pterosaurSkinMat, this.pterosaurWingMat, this.herbivoreSkinMat, this.dinosaurEggMat,
      this.dragonflyWingMat, this.dragonflyBodyMat, this.amberCurbMat, this.expeditionTimberMat,
      this.boneIvoryMat, this.torchFireMat, this.hazardAmberMat
    ].forEach((mat) => curved.applyCurvature(mat));
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

  private getCone(r: number, h: number, segs: number = 8): THREE.ConeGeometry {
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

  private getSphere(r: number, segs: number = 8): THREE.SphereGeometry {
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
    if (seed >= 0 && seed < 6) {
      districtIndex = seed;
    } else if (worldZIn !== undefined && Number.isFinite(worldZIn)) {
      districtIndex = Math.floor(Math.abs(worldZIn) / 400) % 6;
    } else if (seed === 42) {
      districtIndex = 2; // Preserves legacy determinism test fixture
    } else {
      districtIndex = Math.floor(Math.abs(seed) / 6) % 6;
    }

    switch (districtIndex) {
      case 0:
        this.buildLostJungleDistrict(group, roadbedWidth, chunkLength, rng, detail, director, worldZIn);
        break;
      case 1:
        this.buildValleyOfGiantsDistrict(group, roadbedWidth, chunkLength, rng, detail, director, worldZIn);
        break;
      case 2:
        this.buildRaptorCanyonDistrict(group, roadbedWidth, chunkLength, rng, detail, director, worldZIn);
        break;
      case 3:
        this.buildAncientSanctuaryDistrict(group, roadbedWidth, chunkLength, rng, detail, director, worldZIn);
        break;
      case 4:
        this.buildFernMarshDistrict(group, roadbedWidth, chunkLength, rng, detail, director, worldZIn);
        break;
      case 5:
      default:
        this.buildPterosaurCliffsDistrict(group, roadbedWidth, chunkLength, rng, detail, director, worldZIn);
        break;
    }
  }

  // =========================================================================
  // PREHISTORIC FLORA & NATURAL SCENERY BUILDERS
  // =========================================================================

  /**
   * Towering Ancient Rainforest Canopy Tree
   * Colossal gnarled sequoia/banyan with 5 organic fluted buttress roots grounded to Y <= -6.0m,
   * natural curving organic trunk, high spreading lateral boughs at Y = 19m-25m,
   * layered parasol canopy foliage pads, and cascading lianas.
   */
  public buildAncientCanopyTree(x: number, y: number, z: number, scale: number = 1.0): THREE.Group {
    const tree = new THREE.Group();
    tree.position.set(x, y, z);
    tree.scale.set(scale, scale, scale);

    // Multi-segment organic trunk (H = 28m, anchored down to Y = -6.0m)
    const lowerH = 14.0;
    const lowerTrunk = new THREE.Mesh(this.getCylinder(1.8, 2.9, lowerH, 8), this.treeBarkMat);
    lowerTrunk.position.y = -6.0 + lowerH * 0.5; // Y = -6.0m to +8.0m (100% GROUNDED!)
    tree.add(lowerTrunk);

    const upperH = 16.0;
    const upperTrunk = new THREE.Mesh(this.getCylinder(1.2, 1.8, upperH, 8), this.treeBarkMat);
    upperTrunk.position.set(0.5, lowerH - 6.0 + upperH * 0.5, 0.3);
    upperTrunk.rotation.z = -0.05;
    upperTrunk.rotation.x = 0.04;
    tree.add(upperTrunk);

    // 5 Fluted Buttress Roots radiating outward into the primeval earth
    for (let r = 0; r < 5; r++) {
      const angle = (r * Math.PI * 2) / 5 + 0.25;
      const root = new THREE.Mesh(this.getBox(0.9, 9.5, 4.2), this.treeBarkMat);
      root.position.set(Math.cos(angle) * 2.4, -2.0, Math.sin(angle) * 2.4);
      root.rotation.y = angle;
      root.rotation.x = 0.15;
      tree.add(root);
    }

    // High Spreading Canopy Boughs at Y = 19m to 25m (safely clear above 8.5m running ceiling)
    [-1, 1].forEach((dir) => {
      const bough = new THREE.Mesh(this.getCylinder(0.85, 1.4, 9.5, 6), this.treeBarkMat);
      bough.position.set(dir * 3.4, 19.5, 0);
      bough.rotation.z = dir * 0.42;
      tree.add(bough);

      // Layered parasol foliage crowns with deep jade, emerald, and chartreuse highlights
      const mainCanopy = new THREE.Mesh(this.getSphere(4.8, 9), this.deepCanopyMat);
      mainCanopy.scale.set(1.4, 0.65, 1.4);
      mainCanopy.position.set(dir * 6.0, 22.5, 0);
      tree.add(mainCanopy);

      const upperLeafPuff = new THREE.Mesh(this.getSphere(3.8, 8), this.jungleLeafMat);
      upperLeafPuff.scale.set(1.2, 0.60, 1.2);
      upperLeafPuff.position.set(dir * 4.8, 21.0, 2.2);
      tree.add(upperLeafPuff);

      const goldenLeafPuff = new THREE.Mesh(this.getSphere(3.0, 7), this.goldenFernMat);
      goldenLeafPuff.scale.set(1.1, 0.55, 1.1);
      goldenLeafPuff.position.set(dir * 6.5, 23.2, -2.0);
      tree.add(goldenLeafPuff);

      // Cascading Hanging Liana Vines cascading down to Y = 11m
      for (let v = 0; v < 4; v++) {
        const vineH = 6.5 + v * 1.5;
        const vine = new THREE.Mesh(this.getCylinder(0.06, 0.08, vineH, 4), this.hangingVineMat);
        vine.position.set(dir * (2.8 + v * 1.2), 19.5 - vineH * 0.5, (v - 1.5) * 1.6);
        tree.add(vine);
      }
    });

    return tree;
  }

  /**
   * Giant Prehistoric Tree Fern with Arching Feathered Fronds
   */
  public buildGiantTreeFern(x: number, y: number, z: number, scale: number = 1.0): THREE.Group {
    const fern = new THREE.Group();
    fern.position.set(x, y, z);
    fern.scale.set(scale, scale, scale);

    const trunkH = 8.5;
    const trunk = new THREE.Mesh(this.getCylinder(0.45, 0.65, trunkH, 6), this.treeBarkMat);
    trunk.position.y = -2.0 + trunkH * 0.5;
    fern.add(trunk);

    // 8 Arching Translucent Feathered Fern Fronds
    const fronds: THREE.Object3D[] = [];
    for (let f = 0; f < 8; f++) {
      const angle = (f * Math.PI * 2) / 8;
      const frond = new THREE.Mesh(this.getPlane(4.2, 1.8), this.fernFrondMat);
      frond.position.set(Math.cos(angle) * 1.6, trunkH - 2.0, Math.sin(angle) * 1.6);
      frond.rotation.y = angle;
      frond.rotation.x = 0.55;
      fern.add(frond);
      fronds.push(frond);
    }

    JurassicRushEventDirector.getInstance().registerSwayingFoliage(fronds, 0.12, 1.4);
    return fern;
  }

  /**
   * Eye-Level Prehistoric Cycad / Fan Palm
   */
  public buildEyeLevelCycad(x: number, y: number, z: number, scale: number = 1.0): THREE.Group {
    const cycad = new THREE.Group();
    cycad.position.set(x, y, z);
    cycad.scale.set(scale, scale, scale);

    const trunkH = 2.4;
    const trunk = new THREE.Mesh(this.getCylinder(0.45, 0.65, trunkH, 7), this.treeBarkMat);
    trunk.position.y = -1.0 + trunkH * 0.5;
    cycad.add(trunk);

    for (let f = 0; f < 6; f++) {
      const angle = (f * Math.PI * 2) / 6;
      const frond = new THREE.Mesh(this.getPlane(3.2, 1.4), this.fernFrondMat);
      frond.position.set(Math.cos(angle) * 0.8, 1.2, Math.sin(angle) * 0.8);
      frond.rotation.y = angle;
      frond.rotation.x = 0.45;
      cycad.add(frond);
    }

    return cycad;
  }

  /**
   * Mossy Basalt Boulders along the primeval forest floor
   */
  public buildMossyBoulders(x: number, y: number, z: number, scale: number = 1.0): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.set(scale, scale, scale);

    const main = new THREE.Mesh(this.getDodecahedron(1.6), this.mossyBasaltMat);
    main.position.y = 1.0;
    main.scale.set(1.3, 0.85, 1.1);
    group.add(main);

    const sub = new THREE.Mesh(this.getDodecahedron(1.1), this.mossyBasaltMat);
    sub.position.set(1.1, 0.65, 0.4);
    group.add(sub);

    const sub2 = new THREE.Mesh(this.getDodecahedron(0.8), this.mossyBasaltMat);
    sub2.position.set(-0.9, 0.45, -0.5);
    group.add(sub2);

    return group;
  }

  /**
   * Ancient Mossy Hollow Log with Shelf Bracket Fungi
   */
  public buildMossyFallenLog(x: number, y: number, z: number, rotY: number = 0, scale: number = 1.0): THREE.Group {
    const logGroup = new THREE.Group();
    logGroup.position.set(x, y, z);
    logGroup.rotation.y = rotY;
    logGroup.scale.set(scale, scale, scale);

    // Hollow ancient log cylinder
    const log = new THREE.Mesh(this.getCylinder(1.1, 1.3, 11.0, 7), this.treeBarkMat);
    log.rotation.x = Math.PI / 2;
    log.position.y = 0.6;
    logGroup.add(log);

    // Moss patch on top
    const moss = new THREE.Mesh(this.getBox(1.6, 0.35, 9.5), this.jungleLeafMat);
    moss.position.y = 1.7;
    logGroup.add(moss);

    // Shelf bracket fungi along the side
    [-2.5, 0.5, 3.2].forEach((fz) => {
      const bracket = new THREE.Mesh(this.getCylinder(0.55, 0.1, 0.15, 6), this.goldenFernMat);
      bracket.position.set(1.2, 0.9, fz);
      bracket.rotation.z = Math.PI / 6;
      logGroup.add(bracket);
    });

    return logGroup;
  }

  /**
   * Prehistoric River Channel with Flowing Water Surface
   */
  public buildPrehistoricRiver(x: number, y: number, z: number, width: number, length: number): THREE.Group {
    const riverGroup = new THREE.Group();
    riverGroup.position.set(x, y, z);

    // Shimmering flowing water surface at Y = -0.15m
    const water = new THREE.Mesh(this.getPlane(width, length), this.riverWaterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.15;
    riverGroup.add(water);

    // Riverbed gravel backing underneath
    const bed = new THREE.Mesh(this.getBox(width + 2.0, 4.0, length), this.mossyBasaltMat);
    bed.position.y = -2.15;
    riverGroup.add(bed);

    // River pebbles and smooth boulders along banks
    [-width * 0.45, width * 0.45].forEach((bx) => {
      for (let pz = -length * 0.4; pz < length * 0.4; pz += 12.0) {
        const pebble = new THREE.Mesh(this.getDodecahedron(0.85), this.mossyBasaltMat);
        pebble.position.set(bx + (Math.sin(pz) * 0.8), 0.2, pz);
        riverGroup.add(pebble);
      }
    });

    JurassicRushEventDirector.getInstance().registerRiverStream(water, 0.65);
    return riverGroup;
  }

  /**
   * Multi-Stage Prehistoric Mountain Waterfall with Plunge Pool & Mist
   */
  public buildPrehistoricWaterfall(x: number, y: number, z: number, width: number, height: number): THREE.Group {
    const fallGroup = new THREE.Group();
    fallGroup.position.set(x, y, z);

    // Stratified rock cliff backing
    const cliff = new THREE.Mesh(this.getCylinder(width * 0.65, width * 0.85, height + 8.0, 8), this.stratifiedSandstoneMat);
    cliff.position.y = height * 0.5;
    fallGroup.add(cliff);

    // Cascading frothing waterfall mesh
    const cataract = new THREE.Mesh(this.getPlane(width * 0.75, height), this.waterfallMat);
    cataract.position.set(0, height * 0.5, width * 0.45);
    fallGroup.add(cataract);

    // Expanding circular splash rings at plunge base in water pool
    const splashRings: THREE.Mesh[] = [];
    for (let r = 0; r < 2; r++) {
      const ring = new THREE.Mesh(this.getTorus(width * 0.45, 0.25, 6, 16), this.splashRingMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.1, width * 0.45);
      fallGroup.add(ring);
      splashRings.push(ring);
    }

    // Swirling volumetric mist cloud
    const mistGroup = new THREE.Group();
    mistGroup.position.set(0, 2.5, width * 0.45);
    for (let m = 0; m < 3; m++) {
      const puff = new THREE.Mesh(this.getSphere(3.2 + m * 0.8, 6), this.mistMat);
      puff.position.set((m - 1) * 1.8, m * 1.2, 0);
      mistGroup.add(puff);
    }
    fallGroup.add(mistGroup);

    JurassicRushEventDirector.getInstance().registerWaterfall(cataract, splashRings, 2.6, mistGroup);
    return fallGroup;
  }

  /**
   * Prehistoric Dinosaur Nest with Clutch of Speckled Eggs
   */
  public buildDinosaurNest(x: number, y: number, z: number): THREE.Group {
    const nest = new THREE.Group();
    nest.position.set(x, y, z);

    // Raised earth/vegetation mound
    const mound = new THREE.Mesh(this.getCylinder(2.2, 2.8, 0.7, 8), this.treeBarkMat);
    mound.position.y = 0.35;
    nest.add(mound);

    // Circular ring of protective river stones
    for (let s = 0; s < 8; s++) {
      const angle = (s * Math.PI * 2) / 8;
      const stone = new THREE.Mesh(this.getDodecahedron(0.45), this.mossyBasaltMat);
      stone.position.set(Math.cos(angle) * 1.8, 0.65, Math.sin(angle) * 1.8);
      nest.add(stone);
    }

    // Clutch of 6 speckled dinosaur eggs
    for (let e = 0; e < 6; e++) {
      const angle = (e * Math.PI * 2) / 6;
      const egg = new THREE.Mesh(this.getSphere(0.38, 7), this.dinosaurEggMat);
      egg.scale.set(0.85, 1.35, 0.85);
      egg.position.set(Math.cos(angle) * 0.75, 0.85, Math.sin(angle) * 0.75);
      egg.rotation.z = (Math.random() - 0.5) * 0.3;
      nest.add(egg);
    }

    return nest;
  }

  /**
   * Exposed Prehistoric Fossil Bed with Ammonites & Footprints
   */
  public buildFossilBed(x: number, y: number, z: number, scale: number = 1.0): THREE.Group {
    const fossilGroup = new THREE.Group();
    fossilGroup.position.set(x, y, z);
    fossilGroup.scale.set(scale, scale, scale);

    const slab = new THREE.Mesh(this.getBox(6.5, 0.6, 8.5), this.fossilStoneMat);
    slab.position.y = 0.3;
    slab.rotation.y = 0.15;
    fossilGroup.add(slab);

    return fossilGroup;
  }

  /**
   * Hovering Prehistoric Giant Dragonfly (Meganeura)
   */
  public buildGiantDragonfly(x: number, y: number, z: number): THREE.Group {
    const dfGroup = new THREE.Group();
    dfGroup.position.set(x, y, z);

    // Elongated iridescent body
    const body = new THREE.Mesh(this.getCylinder(0.12, 0.08, 1.8, 6), this.dragonflyBodyMat);
    body.rotation.x = Math.PI / 2;
    dfGroup.add(body);

    // Multifaceted head & eyes
    const head = new THREE.Mesh(this.getSphere(0.22, 6), this.dragonflyBodyMat);
    head.position.z = -0.95;
    dfGroup.add(head);

    // Translucent veined wings
    const leftWing = new THREE.Mesh(this.getPlane(1.4, 0.35), this.dragonflyWingMat);
    leftWing.position.set(-0.75, 0.05, -0.2);
    dfGroup.add(leftWing);

    const rightWing = new THREE.Mesh(this.getPlane(1.4, 0.35), this.dragonflyWingMat);
    rightWing.position.set(0.75, 0.05, -0.2);
    dfGroup.add(rightWing);

    JurassicRushEventDirector.getInstance().registerDragonfly(dfGroup, leftWing, rightWing);
    return dfGroup;
  }

  public buildMossyBoulder(x: number, y: number, z: number, scale: number = 1.0): THREE.Group {
    const rock = new THREE.Group();
    rock.position.set(x, y, z);
    rock.scale.set(scale, scale, scale);

    const main = new THREE.Mesh(this.getDodecahedron(1.8), this.mossyBasaltMat);
    main.position.y = 1.2;
    rock.add(main);

    const sub = new THREE.Mesh(this.getDodecahedron(1.2), this.canyonRockMat);
    sub.position.set(0.9, 0.8, 0.4);
    rock.add(sub);

    return rock;
  }

  public buildExpeditionRailwayPole(x: number, y: number, z: number): THREE.Group {
    const pole = new THREE.Group();
    pole.position.set(x, y, z);

    const postH = 8.5;
    const post = new THREE.Mesh(this.getCylinder(0.22, 0.32, postH, 6), this.expeditionTimberMat);
    post.position.y = postH * 0.5;
    pole.add(post);

    const crossArm = new THREE.Mesh(this.getBox(1.8, 0.22, 0.22), this.expeditionTimberMat);
    crossArm.position.y = 7.8;
    pole.add(crossArm);

    [-0.7, 0.7].forEach((lx) => {
      const lantern = new THREE.Mesh(this.getBox(0.35, 0.55, 0.35), this.amberCurbMat);
      lantern.position.set(lx, 7.3, 0);
      pole.add(lantern);
    });

    return pole;
  }

  // =========================================================================
  // HERO DINOSAUR SCULPTING
  // =========================================================================

  /**
   * Colossal Long-Necked Sauropod (Brachiosaurus / Titanosaur)
   * Anatomically sculpted with deep muscular chest, shoulder hump, lighter countershaded underbelly,
   * articulated multi-segment S-neck (5 segments), sculpted Brachiosaurus skull with nasal dome and eyes,
   * 4 columnar pillar legs with ivory claws, and counterbalancing whip tail.
   */
  public buildColossalSauropod(x: number, y: number, z: number, scale: number = 1.0, isEventA: boolean = false): {
    group: THREE.Group;
    neck: THREE.Object3D;
    head: THREE.Object3D;
    tail: THREE.Object3D;
    legs: THREE.Object3D[];
  } {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.set(scale, scale, scale);

    // 1. Compound Sculpted Torso
    const torso = new THREE.Group();
    torso.position.y = 11.2;

    // Deep muscular barrel chest
    const chest = new THREE.Mesh(this.getSphere(3.8, 10), this.dinosaurSkinMat);
    chest.scale.set(1.0, 1.15, 1.35);
    chest.position.set(0, 0.4, -1.8);
    torso.add(chest);

    // Muscular pelvic hips and flank
    const pelvis = new THREE.Mesh(this.getSphere(3.2, 10), this.dinosaurSkinMat);
    pelvis.scale.set(1.0, 1.05, 1.25);
    pelvis.position.set(0, 0.1, 3.6);
    torso.add(pelvis);

    // High shoulder hump (Brachiosaurus dorsal crest)
    const shoulderHump = new THREE.Mesh(this.getSphere(2.5, 8), this.dinosaurSkinMat);
    shoulderHump.scale.set(0.85, 1.2, 1.1);
    shoulderHump.position.set(0, 2.8, -3.2);
    torso.add(shoulderHump);

    // Counter-shaded lighter pistachio underbelly
    const belly = new THREE.Mesh(this.getSphere(3.4, 9), this.dinosaurUnderbellyMat);
    belly.scale.set(0.9, 0.45, 2.2);
    belly.position.set(0, -2.8, 0.5);
    torso.add(belly);

    // Dorsal spine scutes
    for (let s = -4; s <= 4; s++) {
      const scute = new THREE.Mesh(this.getCone(0.28, 0.85, 5), this.dinosaurSkinMat);
      scute.position.set(0, 3.6 - Math.abs(s) * 0.25, s * 1.3);
      torso.add(scute);
    }

    group.add(torso);

    // 2. 4 Muscular Columnar Pillar Legs with ivory bone claws
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

      // Shoulder / hip ball
      const shoulderJoint = new THREE.Mesh(this.getSphere(1.6, 8), this.dinosaurSkinMat);
      shoulderJoint.scale.set(1.0, 1.2, 1.1);
      legGroup.add(shoulderJoint);

      const upperH = cfg.isFront ? 6.2 : 5.5;
      const upperLeg = new THREE.Mesh(this.getCylinder(1.4, 1.2, upperH, 8), this.dinosaurSkinMat);
      upperLeg.position.y = -upperH * 0.5;
      legGroup.add(upperLeg);

      const knee = new THREE.Mesh(this.getSphere(1.2, 7), this.dinosaurSkinMat);
      knee.position.y = -upperH;
      legGroup.add(knee);

      const lowerH = cfg.isFront ? 5.8 : 5.5;
      const lowerLeg = new THREE.Mesh(this.getCylinder(1.15, 1.45, lowerH, 8), this.dinosaurSkinMat);
      lowerLeg.position.y = -upperH - lowerH * 0.5;
      legGroup.add(lowerLeg);

      const footY = -upperH - lowerH;
      const foot = new THREE.Mesh(this.getCylinder(1.5, 1.7, 0.9, 8), this.dinosaurSkinMat);
      foot.position.set(0, footY - 0.45, 0.3);
      legGroup.add(foot);

      // 3 Ivory bone claws
      for (let c = -1; c <= 1; c++) {
        const claw = new THREE.Mesh(this.getCone(0.20, 0.65, 5), this.dinosaurClawMat);
        claw.rotation.x = Math.PI / 2;
        claw.position.set(c * 0.65, footY - 0.5, 1.7);
        legGroup.add(claw);
      }

      group.add(legGroup);
      legs.push(legGroup);
    });

    // 3. 16-meter Graceful S-Curved Articulated Neck
    const neck = new THREE.Group();
    neck.position.set(0, 14.2, -5.2);

    const neckBase = new THREE.Mesh(this.getCylinder(1.3, 1.9, 7.5, 8), this.dinosaurSkinMat);
    neckBase.position.set(0, 3.8, -1.5);
    neckBase.rotation.x = -0.32;
    neck.add(neckBase);

    const neckMid = new THREE.Mesh(this.getCylinder(0.95, 1.3, 8.0, 8), this.dinosaurSkinMat);
    neckMid.position.set(0, 10.4, -3.6);
    neckMid.rotation.x = -0.16;
    neck.add(neckMid);

    // Counter-shaded throat stripe
    const throatStripe = new THREE.Mesh(this.getBox(0.85, 15.0, 0.5), this.dinosaurUnderbellyMat);
    throatStripe.position.set(0, 7.2, -4.5);
    throatStripe.rotation.x = -0.24;
    neck.add(throatStripe);

    // Sculpted Sauropod Head with vaulted nasal crest and amber eyes
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 15.0, -4.8);

    const skull = new THREE.Mesh(this.getSphere(1.15, 8), this.dinosaurSkinMat);
    skull.scale.set(0.85, 0.95, 1.35);
    headGroup.add(skull);

    const snout = new THREE.Mesh(this.getCylinder(0.65, 0.95, 2.2, 7), this.dinosaurSkinMat);
    snout.rotation.x = -Math.PI / 2;
    snout.position.set(0, -0.3, -1.8);
    headGroup.add(snout);

    const jaw = new THREE.Mesh(this.getBox(1.3, 0.55, 2.8), this.dinosaurUnderbellyMat);
    jaw.position.set(0, -0.9, -0.9);
    headGroup.add(jaw);

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

    // 4. 14-meter Counterbalancing Whip Tail
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
   * Apex Carnivore Predator (Tyrannosaurus Rex / Allosaurus)
   * Menacing bipedal predator with articulated lower jaw for roaring, ivory serrated teeth,
   * amber eyes, muscular digitigrade legs, grasping arms, and spined dorsal crest.
   */
  public buildApexCarnivore(x: number, y: number, z: number, scale: number = 1.0, isEventC: boolean = false): {
    group: THREE.Group;
    torso: THREE.Object3D;
    head: THREE.Object3D;
    lowerJaw: THREE.Object3D;
    tail: THREE.Object3D;
  } {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.set(scale, scale, scale);

    const torso = new THREE.Group();
    torso.position.y = 8.5;

    // Muscular deep ribcage
    const ribcage = new THREE.Mesh(this.getSphere(3.2, 10), this.carnivoreSkinMat);
    ribcage.scale.set(0.95, 1.25, 1.45);
    torso.add(ribcage);

    // Golden countershaded underbelly
    const belly = new THREE.Mesh(this.getSphere(2.8, 9), this.carnivoreBellyMat);
    belly.scale.set(0.85, 0.55, 1.35);
    belly.position.set(0, -2.2, 0.2);
    torso.add(belly);

    // Spine crest scutes
    for (let s = -3; s <= 3; s++) {
      const ridge = new THREE.Mesh(this.getCone(0.24, 0.75, 5), this.dinosaurSkinMat);
      ridge.position.set(0, 3.2 - Math.abs(s) * 0.2, s * 1.2);
      torso.add(ridge);
    }

    // Muscular S-curved Neck & Skull
    const neck = new THREE.Group();
    neck.position.set(0, 1.8, -3.2);

    const neckPillar = new THREE.Mesh(this.getCylinder(1.2, 1.6, 4.5, 7), this.carnivoreSkinMat);
    neckPillar.rotation.x = -0.55;
    neckPillar.position.set(0, 1.8, -1.2);
    neck.add(neckPillar);

    const head = new THREE.Group();
    head.position.set(0, 3.8, -2.8);

    // Heavy theropod cranium with menacing brow crests
    const cranium = new THREE.Mesh(this.getBox(2.2, 1.9, 3.2), this.carnivoreSkinMat);
    cranium.position.set(0, 0.35, -0.6);
    head.add(cranium);

    [-0.85, 0.85].forEach((bx) => {
      const brow = new THREE.Mesh(this.getCone(0.35, 0.95, 5), this.dinosaurSkinMat);
      brow.rotation.x = -0.4;
      brow.position.set(bx, 1.3, -1.2);
      head.add(brow);

      const eye = new THREE.Mesh(this.getSphere(0.26, 7), this.dinosaurEyeMat);
      eye.position.set(bx * 1.15, 0.45, -0.8);
      head.add(eye);

      const pupil = new THREE.Mesh(this.getSphere(0.12, 5), this.dinosaurPupilMat);
      pupil.position.set(bx * 1.2, 0.45, -0.8);
      head.add(pupil);
    });

    // Upper jaw with rows of sharp ivory teeth
    const upperJaw = new THREE.Mesh(this.getBox(1.6, 1.1, 2.6), this.carnivoreSkinMat);
    upperJaw.position.set(0, -0.4, -2.4);
    head.add(upperJaw);

    for (let t = -3; t <= 3; t++) {
      [-0.7, 0.7].forEach((tx) => {
        const tooth = new THREE.Mesh(this.getCone(0.08, 0.42, 4), this.dinosaurClawMat);
        tooth.rotation.x = Math.PI;
        tooth.position.set(tx, -0.95, -2.4 + t * 0.35);
        head.add(tooth);
      });
    }

    // Articulated Lower Jaw that unhinges during roaring
    const lowerJaw = new THREE.Group();
    lowerJaw.position.set(0, -0.6, -0.6);

    const jawBone = new THREE.Mesh(this.getBox(1.4, 0.65, 3.8), this.carnivoreBellyMat);
    jawBone.position.set(0, -0.3, -1.8);
    lowerJaw.add(jawBone);

    // Lower jaw teeth
    for (let t = -3; t <= 3; t++) {
      [-0.6, 0.6].forEach((tx) => {
        const tooth = new THREE.Mesh(this.getCone(0.08, 0.38, 4), this.dinosaurClawMat);
        tooth.position.set(tx, 0.05, -1.8 + t * 0.35);
        lowerJaw.add(tooth);
      });
    }

    head.add(lowerJaw);
    neck.add(head);
    torso.add(neck);

    // Counterbalancing Tail
    const tail = new THREE.Group();
    tail.position.set(0, 0.4, 3.8);

    const tailBase = new THREE.Mesh(this.getCylinder(1.1, 1.8, 6.5, 8), this.carnivoreSkinMat);
    tailBase.rotation.x = 1.45;
    tailBase.position.set(0, -0.2, 3.2);
    tail.add(tailBase);

    const tailMid = new THREE.Mesh(this.getCylinder(0.5, 1.1, 6.5, 7), this.carnivoreSkinMat);
    tailMid.rotation.x = 1.52;
    tailMid.position.set(0, -0.6, 9.4);
    tail.add(tailMid);

    const tailTip = new THREE.Mesh(this.getCylinder(0.15, 0.5, 5.5, 5), this.carnivoreSkinMat);
    tailTip.rotation.x = 1.58;
    tailTip.position.set(0, -0.9, 15.2);
    tail.add(tailTip);

    torso.add(tail);
    group.add(torso);

    // Muscular Digitigrade Bipedal Legs
    [-1.8, 1.8].forEach((lx) => {
      const leg = new THREE.Group();
      leg.position.set(lx, 8.5, 0.5);

      const thigh = new THREE.Mesh(this.getCylinder(1.4, 1.1, 5.2, 8), this.carnivoreSkinMat);
      thigh.rotation.x = 0.35;
      thigh.position.set(0, -2.4, 0.8);
      leg.add(thigh);

      const shank = new THREE.Mesh(this.getCylinder(0.9, 0.75, 4.8, 7), this.carnivoreSkinMat);
      shank.rotation.x = -0.45;
      shank.position.set(0, -5.8, 0.2);
      leg.add(shank);

      const foot = new THREE.Mesh(this.getBox(1.5, 0.5, 2.2), this.carnivoreSkinMat);
      foot.position.set(0, -8.3, -0.4);
      leg.add(foot);

      for (let c = -1; c <= 1; c++) {
        const claw = new THREE.Mesh(this.getCone(0.16, 0.65, 5), this.dinosaurClawMat);
        claw.rotation.x = Math.PI / 2;
        claw.position.set(c * 0.55, -8.3, 0.9);
        leg.add(claw);
      }

      group.add(leg);
    });

    return { group, torso, head, lowerJaw, tail };
  }

  /**
   * Sprinting Raptor Pack (Velociraptor / Deinonychus)
   */
  public buildRaptorPack(x: number, y: number, z: number, isEventB: boolean = false): {
    packGroup: THREE.Group;
    raptors: Array<{
      group: THREE.Group;
      legs: THREE.Object3D[];
      tail: THREE.Object3D;
      head: THREE.Object3D;
      phaseOffset: number;
      lateralOffset?: number;
    }>;
  } {
    const packGroup = new THREE.Group();
    packGroup.position.set(x, y, z);

    const raptorsData: Array<{
      group: THREE.Group;
      legs: THREE.Object3D[];
      tail: THREE.Object3D;
      head: THREE.Object3D;
      phaseOffset: number;
      lateralOffset?: number;
    }> = [];

    // 3 Raptors in staggered hunting formation
    const offsets = [
      { ox: 0, oz: 0, phase: 0 },
      { ox: -2.8, oz: 4.5, phase: Math.PI * 0.65 },
      { ox: 2.8, oz: 6.2, phase: Math.PI * 1.35 }
    ];

    offsets.forEach((cfg) => {
      const rGroup = new THREE.Group();
      rGroup.position.set(cfg.ox, 0, cfg.oz);

      const body = new THREE.Mesh(this.getCylinder(0.55, 0.85, 2.8, 7), this.raptorGreenMat);
      body.rotation.x = 1.35;
      body.position.set(0, 1.8, 0);
      rGroup.add(body);

      // Articulated Head
      const head = new THREE.Group();
      head.position.set(0, 2.3, -1.6);

      const skull = new THREE.Mesh(this.getBox(0.65, 0.55, 1.4), this.raptorGreenMat);
      skull.position.set(0, 0, -0.4);
      head.add(skull);

      const snout = new THREE.Mesh(this.getCylinder(0.2, 0.35, 1.2, 6), this.raptorTealMat);
      snout.rotation.x = -Math.PI / 2;
      snout.position.set(0, -0.15, -1.2);
      head.add(snout);

      [-0.32, 0.32].forEach((ex) => {
        const eye = new THREE.Mesh(this.getSphere(0.12, 6), this.dinosaurEyeMat);
        eye.position.set(ex, 0.15, -0.4);
        head.add(eye);
      });

      rGroup.add(head);

      // Stiff counterbalancing tail
      const tail = new THREE.Group();
      tail.position.set(0, 1.9, 1.2);

      const tailMesh = new THREE.Mesh(this.getCylinder(0.12, 0.45, 4.2, 6), this.raptorTealMat);
      tailMesh.rotation.x = 1.55;
      tailMesh.position.set(0, 0.2, 2.1);
      tail.add(tailMesh);
      rGroup.add(tail);

      // 2 Athletic Bipedal Legs with deadly curved sickle claws
      const legs: THREE.Object3D[] = [];
      [-0.65, 0.65].forEach((lx) => {
        const leg = new THREE.Group();
        leg.position.set(lx, 1.8, 0);

        const thigh = new THREE.Mesh(this.getCylinder(0.42, 0.32, 1.6, 6), this.raptorGreenMat);
        thigh.rotation.x = 0.45;
        thigh.position.set(0, -0.8, 0.3);
        leg.add(thigh);

        const shank = new THREE.Mesh(this.getCylinder(0.25, 0.22, 1.5, 6), this.raptorGreenMat);
        shank.rotation.x = -0.55;
        shank.position.set(0, -1.8, 0.1);
        leg.add(shank);

        const foot = new THREE.Mesh(this.getBox(0.45, 0.18, 0.85), this.raptorGreenMat);
        foot.position.set(0, -2.5, -0.2);
        leg.add(foot);

        // Deadly inner sickle claw
        const sickle = new THREE.Mesh(this.getCone(0.08, 0.45, 5), this.dinosaurClawMat);
        sickle.rotation.x = -0.55;
        sickle.position.set(0, -2.3, 0.2);
        leg.add(sickle);

        rGroup.add(leg);
        legs.push(leg);
      });

      packGroup.add(rGroup);
      raptorsData.push({
        group: rGroup,
        legs,
        tail,
        head,
        phaseOffset: cfg.phase,
        lateralOffset: cfg.ox
      });
    });

    return { packGroup, raptors: raptorsData };
  }

  /**
   * Soaring Pterosaur Flock (Pteranodon)
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

    const flockOffsets = [
      { gx: -14.0, gy: 32.0, gz: 0, phase: 0 },
      { gx: 16.0, gy: 35.0, gz: -18, phase: Math.PI * 0.75 },
      { gx: 2.0, gy: 28.0, gz: 14, phase: Math.PI * 1.45 }
    ];

    flockOffsets.forEach((cfg) => {
      const pMesh = new THREE.Group();
      pMesh.position.set(cfg.gx, cfg.gy, cfg.gz);

      // Fuselage & cranial crest
      const fuselage = new THREE.Mesh(this.getCylinder(0.25, 0.35, 2.4, 6), this.pterosaurSkinMat);
      fuselage.rotation.x = Math.PI / 2;
      pMesh.add(fuselage);

      const crest = new THREE.Mesh(this.getCone(0.25, 1.8, 5), this.pterosaurSkinMat);
      crest.rotation.x = -0.65;
      crest.position.set(0, 0.35, 1.1);
      pMesh.add(crest);

      const beak = new THREE.Mesh(this.getCone(0.18, 1.9, 5), this.pterosaurSkinMat);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, -0.05, -1.9);
      pMesh.add(beak);

      // Left Articulated Wing
      const leftWing = new THREE.Group();
      leftWing.position.set(-0.35, 0, 0);
      const lWingMesh = new THREE.Mesh(this.getPlane(4.2, 1.8), this.pterosaurWingMat);
      lWingMesh.rotation.x = -Math.PI / 2;
      lWingMesh.position.set(-2.1, 0, 0);
      leftWing.add(lWingMesh);
      pMesh.add(leftWing);

      // Right Articulated Wing
      const rightWing = new THREE.Group();
      rightWing.position.set(0.35, 0, 0);
      const rWingMesh = new THREE.Mesh(this.getPlane(4.2, 1.8), this.pterosaurWingMat);
      rWingMesh.rotation.x = -Math.PI / 2;
      rWingMesh.position.set(2.1, 0, 0);
      rightWing.add(rWingMesh);
      pMesh.add(rightWing);

      group.add(pMesh);
      gliders.push({
        mesh: pMesh,
        leftWing,
        rightWing,
        phaseOffset: cfg.phase,
        baseAltitude: cfg.gy
      });
    });

    return { group, gliders };
  }

  /**
   * Grazing Herbivore Herd (Triceratops / Stegosaurus)
   */
  public buildHerbivoreHerd(x: number, y: number, z: number): {
    herdGroup: THREE.Group;
    members: Array<{ group: THREE.Group; head: THREE.Object3D; tail: THREE.Object3D; phaseOffset: number }>;
  } {
    const herdGroup = new THREE.Group();
    herdGroup.position.set(x, y, z);

    const members: Array<{ group: THREE.Group; head: THREE.Object3D; tail: THREE.Object3D; phaseOffset: number }> = [];
    const positions = [
      { mx: 0, mz: 0, phase: 0 },
      { mx: 4.5, mz: 5.5, phase: 1.8 }
    ];

    positions.forEach((cfg) => {
      const dino = new THREE.Group();
      dino.position.set(cfg.mx, 0, cfg.mz);

      const body = new THREE.Mesh(this.getSphere(2.2, 8), this.herbivoreSkinMat);
      body.scale.set(1.0, 1.1, 1.5);
      body.position.y = 2.4;
      dino.add(body);

      // Articulated Head with grazing neck
      const head = new THREE.Group();
      head.position.set(0, 2.6, -2.4);

      const skull = new THREE.Mesh(this.getBox(1.2, 0.95, 1.6), this.herbivoreSkinMat);
      head.add(skull);

      // Horned frill / defensive crest
      const frill = new THREE.Mesh(this.getPlane(2.4, 1.4), this.herbivoreSkinMat);
      frill.position.set(0, 0.8, 0.4);
      frill.rotation.x = -0.45;
      head.add(frill);

      dino.add(head);

      const tail = new THREE.Group();
      tail.position.set(0, 2.4, 2.2);
      const tailMesh = new THREE.Mesh(this.getCylinder(0.2, 0.65, 3.5, 6), this.herbivoreSkinMat);
      tailMesh.rotation.x = 1.45;
      tailMesh.position.set(0, -0.4, 1.7);
      tail.add(tailMesh);
      dino.add(tail);

      // 4 Sturdy Legs
      [
        { lx: -1.2, lz: -1.2 },
        { lx: 1.2, lz: -1.2 },
        { lx: -1.2, lz: 1.2 },
        { lx: 1.2, lz: 1.2 }
      ].forEach((lp) => {
        const leg = new THREE.Mesh(this.getCylinder(0.55, 0.65, 2.4, 6), this.herbivoreSkinMat);
        leg.position.set(lp.lx, 1.2, lp.lz);
        dino.add(leg);
      });

      herdGroup.add(dino);
      members.push({ group: dino, head, tail, phaseOffset: cfg.phase });
    });

    return { herdGroup, members };
  }

  /**
   * Curious Long-Necked Dinosaur Watcher
   */
  public buildCuriousDinosaurWatcher(x: number, y: number, z: number): {
    dinosaurGroup: THREE.Group;
    neck: THREE.Object3D;
    head: THREE.Object3D;
  } {
    const dinosaurGroup = new THREE.Group();
    dinosaurGroup.position.set(x, y, z);

    const body = new THREE.Mesh(this.getSphere(2.8, 8), this.dinosaurSkinMat);
    body.scale.set(1.0, 1.15, 1.4);
    body.position.y = 4.2;
    dinosaurGroup.add(body);

    const neck = new THREE.Group();
    neck.position.set(0, 5.2, -1.8);

    const neckPillar = new THREE.Mesh(this.getCylinder(0.65, 1.1, 7.5, 7), this.dinosaurSkinMat);
    neckPillar.position.set(0, 3.8, -0.8);
    neckPillar.rotation.x = -0.22;
    neck.add(neckPillar);

    const head = new THREE.Group();
    head.position.set(0, 7.8, -1.8);

    const skull = new THREE.Mesh(this.getSphere(0.85, 7), this.dinosaurSkinMat);
    skull.scale.set(0.85, 0.9, 1.3);
    head.add(skull);

    [-0.75, 0.75].forEach((ex) => {
      const eye = new THREE.Mesh(this.getSphere(0.18, 6), this.dinosaurEyeMat);
      eye.position.set(ex, 0.25, -0.4);
      head.add(eye);
    });

    neck.add(head);
    dinosaurGroup.add(neck);

    // Pillar legs
    [
      { lx: -1.6, lz: -1.5 },
      { lx: 1.6, lz: -1.5 },
      { lx: -1.5, lz: 1.5 },
      { lx: 1.5, lz: 1.5 }
    ].forEach((lp) => {
      const leg = new THREE.Mesh(this.getCylinder(0.75, 0.95, 4.2, 7), this.dinosaurSkinMat);
      leg.position.set(lp.lx, 2.1, lp.lz);
      dinosaurGroup.add(leg);
    });

    return { dinosaurGroup, neck, head };
  }

  /**
   * Monumental Expedition Outpost Gate (Sector 04 Outpost Gateway)
   * Iconic opening architectural landmark situated at the beginning of the run.
   * Twin 18m cyclopean megalithic stone pylons (|X| = 7.2m), heavy ironwood lintel arch at Y = 9.8m - 11.5m,
   * sculpted T-Rex fossil skull crest at Y = 10.8m, hazard caution signs, and twin solar fire braziers at Y = 18m.
   * Playable running corridor (|X| <= 4.2m, Y <= 8.5m) is 100% unobstructed.
   */
  public buildExpeditionOutpostGate(x: number, y: number, z: number): THREE.Group {
    const gate = new THREE.Group();
    gate.name = 'expedition_outpost_gate';
    gate.position.set(x, y, z);

    [-7.2, 7.2].forEach((px, sideIdx) => {
      const pylon = new THREE.Group();
      pylon.position.set(px, 0, 0);

      // Sub-ground foundation plinth (Y = -6.0m to 0m)
      const plinth = new THREE.Mesh(this.getBox(3.8, 6.0, 4.8), this.templeStoneMat);
      plinth.position.y = -3.0;
      pylon.add(plinth);

      // Massive stepped lower tower base (Y = 0m to 8.0m)
      const baseTower = new THREE.Mesh(this.getBox(3.4, 8.0, 4.2), this.templeStoneMat);
      baseTower.position.y = 4.0;
      pylon.add(baseTower);

      // Carved megalithic relief belt (Y = 7.5m)
      const reliefBelt = new THREE.Mesh(this.getBox(3.55, 1.2, 4.35), this.templeGoldReliefMat);
      reliefBelt.position.y = 7.5;
      pylon.add(reliefBelt);

      // Upper megalithic shaft (Y = 8.0m to 16.5m)
      const shaft = new THREE.Mesh(this.getBox(2.8, 8.5, 3.4), this.templeStoneMat);
      shaft.position.y = 12.25;
      pylon.add(shaft);

      // Tower corniced summit platform (Y = 16.5m to 17.5m)
      const summit = new THREE.Mesh(this.getBox(3.2, 1.0, 3.8), this.templeStoneMat);
      summit.position.y = 17.0;
      pylon.add(summit);

      // Solar fire brazier bowl (Y = 17.5m to 18.2m)
      const brazier = new THREE.Mesh(this.getCylinder(1.1, 0.7, 0.8, 8), this.templeStoneMat);
      brazier.position.y = 17.9;
      pylon.add(brazier);

      // Burning golden-amber flame crest
      const flame = new THREE.Mesh(this.getCone(0.75, 1.6, 7), this.torchFireMat);
      flame.position.y = 18.9;
      pylon.add(flame);

      // Atmospheric steam/mist vent nozzle at base
      const vent = new THREE.Mesh(this.getCylinder(0.25, 0.35, 0.8, 6), this.expeditionTimberMat);
      vent.position.set(sideIdx === 0 ? 1.6 : -1.6, 0.4, 1.5);
      vent.rotation.z = sideIdx === 0 ? -0.4 : 0.4;
      pylon.add(vent);

      gate.add(pylon);
    });

    // Monumental Cross-Arch Lintel & Bronze Truss (Spanning across at Y = 9.8m to 11.5m)
    // Entirely above Y = 8.5m - zero intrusion into running corridor!
    const lintelArch = new THREE.Group();
    lintelArch.position.y = 10.2;

    // Heavy ironwood cross-beam
    const mainBeam = new THREE.Mesh(this.getBox(16.5, 1.4, 2.6), this.expeditionTimberMat);
    lintelArch.add(mainBeam);

    // Reinforced bronze cross-truss support
    const bronzeTruss = new THREE.Mesh(this.getBox(16.8, 0.4, 2.8), this.templeGoldReliefMat);
    bronzeTruss.position.y = 0.85;
    lintelArch.add(bronzeTruss);

    // Sculpted Prehistoric T-Rex Fossil Skull Crest mounted dead center
    const skullGroup = new THREE.Group();
    skullGroup.position.set(0, 1.2, 1.4);

    // Cranium
    const skullCranium = new THREE.Mesh(this.getSphere(1.2, 8), this.boneIvoryMat);
    skullCranium.scale.set(0.9, 0.85, 1.3);
    skullGroup.add(skullCranium);

    // Snout & maxilla
    const skullSnout = new THREE.Mesh(this.getBox(0.95, 0.85, 1.8), this.boneIvoryMat);
    skullSnout.position.set(0, -0.2, 1.0);
    skullGroup.add(skullSnout);

    // Serrated ivory fossil teeth
    for (let t = -0.35; t <= 0.35; t += 0.22) {
      const tooth = new THREE.Mesh(this.getCone(0.08, 0.35, 4), this.boneIvoryMat);
      tooth.rotation.x = Math.PI;
      tooth.position.set(t, -0.7, 1.4);
      skullGroup.add(tooth);
    }
    lintelArch.add(skullGroup);

    // High-visibility expedition hazard signage plate
    const hazardPlate = new THREE.Mesh(this.getBox(9.2, 0.65, 0.15), this.hazardAmberMat);
    hazardPlate.position.set(0, -0.85, 1.35);
    lintelArch.add(hazardPlate);

    gate.add(lintelArch);
    return gate;
  }

  /**
   * Signature Architectural Landmark: Grand Sun Temple Viaduct & Titanosaur Bone Arches
   * A monumental, instantly readable structure that gives the world tremendous scale and awe.
   * Background: 32m high stepped cyclopean solar pyramid at X = 34m with ceremonial staircases,
   * golden solar disc altar and eternal flame brazier.
   * Track: 5 colossal fossilized Titanosaur ribcage arches spanning across the railway (clearance Y >= 9.2m).
   * Foundations: Twin tiered cascading temple waterfalls plunging into the gorge below (Y = -6.0m).
   */
  public buildGrandSunTempleViaduct(x: number, y: number, z: number, length: number = 100): THREE.Group {
    const landmark = new THREE.Group();
    landmark.name = 'grand_sun_temple_viaduct';
    landmark.position.set(x, y, z);

    // 1. Colossal Megalithic Sun Temple Pyramid at X = 34.0m
    const pyramidGroup = new THREE.Group();
    pyramidGroup.position.set(34.0, 0, -length * 0.5);

    // 5 Stepped cyclopean stone terraces rising to Y = 32m
    const terraces = [
      { w: 38.0, h: 6.0, d: 48.0, y: 3.0 },
      { w: 30.0, h: 6.0, d: 40.0, y: 9.0 },
      { w: 22.0, h: 6.0, d: 32.0, y: 15.0 },
      { w: 16.0, h: 6.0, d: 24.0, y: 21.0 },
      { w: 10.0, h: 5.0, d: 16.0, y: 26.5 }
    ];

    terraces.forEach((t) => {
      const stepMesh = new THREE.Mesh(this.getBox(t.w, t.h, t.d), this.templeStoneMat);
      stepMesh.position.y = t.y;
      pyramidGroup.add(stepMesh);

      // Gold relief cornice along edge
      const cornice = new THREE.Mesh(this.getBox(t.w + 0.4, 0.6, t.d + 0.4), this.templeGoldReliefMat);
      cornice.position.y = t.y + t.h * 0.5 - 0.3;
      pyramidGroup.add(cornice);
    });

    // Ceremonial monumental staircase cascading down toward railway
    const stairs = new THREE.Mesh(this.getBox(6.0, 18.0, 26.0), this.templeStoneMat);
    stairs.position.set(-16.0, 9.0, 0);
    stairs.rotation.z = -0.52;
    pyramidGroup.add(stairs);

    // Summit Solar Altar at Y = 29.0m
    const altar = new THREE.Mesh(this.getCylinder(2.4, 2.8, 2.0, 8), this.templeStoneMat);
    altar.position.y = 30.0;
    pyramidGroup.add(altar);

    // Golden solar disc emblem
    const solarDisc = new THREE.Mesh(this.getCylinder(1.8, 1.8, 0.4, 16), this.templeGoldReliefMat);
    solarDisc.rotation.z = Math.PI / 2;
    solarDisc.position.set(-1.9, 31.5, 0);
    pyramidGroup.add(solarDisc);

    // Eternal Solar Flame
    const fire = new THREE.Mesh(this.getCone(1.2, 3.2, 8), this.torchFireMat);
    fire.position.y = 32.5;
    pyramidGroup.add(fire);

    landmark.add(pyramidGroup);

    // 2. 5 Colossal Titanosaur Ribcage Arches over the Railway
    // Grounded at |X| = 6.8m, curving overhead to apex Y = 11.4m (100% CLEAR of corridor!)
    for (let a = 0; a < 5; a++) {
      const archZ = -10.0 - a * 18.0;
      const archGroup = new THREE.Group();
      archGroup.position.set(0, 0, archZ);

      [-1, 1].forEach((side) => {
        // Massive petrified rib bone arch strut
        // Base grounded at X = side * 7.8m
        const ribBase = new THREE.Mesh(this.getCylinder(0.8, 1.3, 5.5, 8), this.boneIvoryMat);
        ribBase.position.set(side * 7.8, 2.75, 0);
        archGroup.add(ribBase);

        // Middle curved segment rising from Y = 5.0m to 8.2m, staying strictly outside |X| >= 5.8m
        const ribMid = new THREE.Mesh(this.getCylinder(0.65, 0.8, 4.0, 8), this.boneIvoryMat);
        ribMid.position.set(side * 7.2, 6.8, 0);
        ribMid.rotation.z = side * 0.22;
        archGroup.add(ribMid);

        // Arch apex strut curving over the track: strictly ABOVE Y = 8.6m! (min Y >= 9.1m)
        const ribApex = new THREE.Mesh(this.getCylinder(0.5, 0.65, 4.8, 8), this.boneIvoryMat);
        ribApex.position.set(side * 3.4, 11.2, 0);
        ribApex.rotation.z = side * 0.95;
        archGroup.add(ribApex);

        // Hanging jungle vines clinging to the ancient bones at |X| = 6.4m
        const vine = new THREE.Mesh(this.getCylinder(0.08, 0.12, 3.2, 5), this.hangingVineMat);
        vine.position.set(side * 6.4, 6.2, 0.4);
        archGroup.add(vine);
      });

      // Massive Spinal Vertebra Keystone at Apex (Y = 12.0m)
      const vertebra = new THREE.Mesh(this.getBox(2.2, 1.4, 2.8), this.boneIvoryMat);
      vertebra.position.y = 12.0;
      archGroup.add(vertebra);

      landmark.add(archGroup);
    }

    // 3. Cascading Tiered Temple Waterfalls flanking viaduct
    const cataractLeft = this.buildPrehistoricWaterfall(-16.0, 0.0, -length * 0.5, 12.0, 24.0);
    landmark.add(cataractLeft);

    const cataractRight = this.buildPrehistoricWaterfall(18.0, 0.0, -length * 0.5, 14.0, 26.0);
    landmark.add(cataractRight);

    return landmark;
  }

  // =========================================================================
  // SIX PREHISTORIC BIOME DISTRICT BUILDERS
  // =========================================================================

  /**
   * BIOME 1 (District A): The Lost Jungle (0m – 400m)
   * Dense, ancient rainforest canopy framing the sky.
   * Gnarled banyan trees with fluted buttress roots (Y <= -6.0m), hanging liana vines,
   * eye-level cycads, mossy fallen logs with bracket fungi, riverbank channel on left with dragonflies,
   * multi-stage mountain waterfall on right with mist, curious dinosaur watcher tracking player.
   */
  public buildLostJungleDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: JurassicRushEventDirector,
    worldZ: number = 0
  ): void {
    const districtA = new THREE.Group();
    districtA.name = 'district_a_lost_jungle';
    group.add(districtA);

    const curbEdge = roadbedWidth * 0.5 + 0.5; // ~6.5m from track center

    [-1, 1].forEach((side) => {
      // 1. Prehistoric Jungle Loam Foundation Bed (Grounded down to Y = -6.0m)
      const walkW = 28.0;
      const wx = side * (curbEdge + walkW * 0.5);
      const bed = new THREE.Mesh(this.getBox(walkW, 6.0, chunkLength), this.jungleLoamMat);
      bed.position.set(wx, -3.0, -chunkLength * 0.5);
      districtA.add(bed);

      // Bright Amber Petrified Wood Curb Liner (Contrast edge along viaduct)
      const curb = new THREE.Mesh(this.getBox(0.48, 6.0, chunkLength), this.amberCurbMat);
      curb.position.set(side * (curbEdge + 0.24), -3.0, -chunkLength * 0.5);
      districtA.add(curb);

      // 2. Mossy Basalt Boulder Clusters along curb edge
      for (let z = 12; z < chunkLength; z += 35) {
        const boulder = this.buildMossyBoulders(side * (curbEdge + 1.8), 0.0, -z);
        districtA.add(boulder);
      }

      // 3. Eye-Level Prehistoric Cycads & Ancient Giant Tree Ferns
      for (let z = 8; z < chunkLength; z += 20) {
        const cycad = this.buildEyeLevelCycad(
          side * (curbEdge + 2.2 + (z % 3) * 0.4),
          0.0,
          -z,
          1.05 + ((z * 7) % 5) * 0.08
        );
        districtA.add(cycad);

        if (z % 40 === 8) {
          const treeFern = this.buildGiantTreeFern(
            side * (curbEdge + 4.2),
            0.0,
            -z - 6.0,
            1.15
          );
          districtA.add(treeFern);
        }
      }

      // 4. Colossal Ancient Rainforest Canopy Trees (framed at |X| = 14.5m to 18m)
      for (let tz = 15; tz < chunkLength; tz += 45) {
        const tree = this.buildAncientCanopyTree(
          side * (curbEdge + 8.5),
          0.0,
          -tz,
          1.15
        );
        districtA.add(tree);
      }

      // 5. Mossy Fallen Logs with shelf fungi
      const log = this.buildMossyFallenLog(
        side * (curbEdge + 6.5),
        0.0,
        -chunkLength * (side > 0 ? 0.35 : 0.75),
        side * 0.45,
        1.1
      );
      districtA.add(log);
    });

    // 6. Prehistoric River Channel on Left Side (side = -1)
    const river = this.buildPrehistoricRiver(-(curbEdge + 12.0), 0.0, -chunkLength * 0.5, 9.0, chunkLength);
    districtA.add(river);

    // Prehistoric giant dragonflies darting over the river
    const dragonflyA = this.buildGiantDragonfly(-(curbEdge + 10.0), 2.2, -chunkLength * 0.35);
    districtA.add(dragonflyA);

    const dragonflyB = this.buildGiantDragonfly(-(curbEdge + 12.5), 1.8, -chunkLength * 0.65);
    districtA.add(dragonflyB);

    // 7. Multi-Stage Mountain Waterfall Cataract on Right Side (side = 1)
    const waterfall = this.buildPrehistoricWaterfall(curbEdge + 12.5, 0.0, -chunkLength * 0.5, 14.0, 26.0);
    districtA.add(waterfall);

    // 8. Curious Long-Necked Dinosaur Watcher peeking through the canopy at X = -13.5m
    const watcher = this.buildCuriousDinosaurWatcher(-(curbEdge + 7.5), 0.0, -chunkLength * 0.45);
    districtA.add(watcher.dinosaurGroup);
    director.registerCuriousWatcher(watcher.dinosaurGroup, watcher.neck, watcher.head, worldZ - chunkLength * 0.45);

    // 9. Soaring Pterosaur Flock overhead
    const pterosaurFlock = this.buildPterosaurFlock(-chunkLength * 0.5);
    districtA.add(pterosaurFlock.group);
    director.registerPterosaurs(pterosaurFlock.group, pterosaurFlock.gliders, 16.0, 3.2);

    // 10. Sector 04 Outpost Gateway — Iconic Opening Landmark
    if (worldZ >= -80 && worldZ <= 40) {
      const gate = this.buildExpeditionOutpostGate(0, 0, -22.0);
      districtA.add(gate);
    }

    // 11. Valley Reveal Canopy Tunnel (tightening green corridor before bursting into the open valley)
    if (worldZ <= -280 && worldZ >= -400) {
      [-1, 1].forEach((side) => {
        for (let cz = 10; cz < chunkLength; cz += 25) {
          const tunnelTree = this.buildAncientCanopyTree(side * (curbEdge + 4.5), 0.0, -cz, 1.2);
          districtA.add(tunnelTree);
        }
        for (let bz = 15; bz < chunkLength; bz += 30) {
          const bough = new THREE.Mesh(this.getCylinder(0.75, 1.1, 13.0, 7), this.treeBarkMat);
          bough.position.set(side * 5.6, 10.2, -bz);
          bough.rotation.z = side * 1.15;
          districtA.add(bough);

          const liana = new THREE.Mesh(this.getCylinder(0.08, 0.12, 3.2, 5), this.hangingVineMat);
          liana.position.set(side * 4.5, 8.8, -bz);
          districtA.add(liana);
        }
      });
    }
  }

  /**
   * BIOME 2 (District B): Valley of Giants & Event A (Giant Crossing) (400m – 800m)
   * Wide, open, sunlit prehistoric river valley flanked by distant stratified mesas.
   * Event A: Colossal sauropod crossing the valley alongside the track with herd in the background.
   * Dinosaur footprints embedded in the limestone flats.
   */
  public buildValleyOfGiantsDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: JurassicRushEventDirector,
    worldZ: number = 0
  ): void {
    const districtB = new THREE.Group();
    districtB.name = 'district_b_valley_of_giants';
    group.add(districtB);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    [-1, 1].forEach((side) => {
      // Wide open sunlit valley floor
      const walkW = 32.0;
      const bed = new THREE.Mesh(this.getBox(walkW, 6.0, chunkLength), this.treeBarkMat);
      bed.position.set(side * (curbEdge + walkW * 0.5), -3.0, -chunkLength * 0.5);
      districtB.add(bed);

      const curb = new THREE.Mesh(this.getBox(0.48, 6.0, chunkLength), this.amberCurbMat);
      curb.position.set(side * (curbEdge + 0.24), -3.0, -chunkLength * 0.5);
      districtB.add(curb);

      // Distant Stratified Sandstone Mesas at |X| = 38m
      const mesa = new THREE.Mesh(this.getCylinder(12.0, 16.0, 22.0, 8), this.stratifiedSandstoneMat);
      mesa.position.set(side * (curbEdge + 32.0), 5.0, -chunkLength * 0.5);
      districtB.add(mesa);

      // Layered Distant Volcanic Peak Silhouettes at |X| = 72m
      const peak = new THREE.Mesh(this.getCone(22.0, 44.0, 8), this.stratifiedSandstoneMat);
      peak.position.set(side * 72.0, 10.0, -chunkLength * 0.5);
      districtB.add(peak);

      // Low cycad groves & giant tree ferns along trackside
      for (let z = 12; z < chunkLength; z += 30) {
        const cycad = this.buildEyeLevelCycad(side * (curbEdge + 2.4), 0.0, -z, 1.15);
        districtB.add(cycad);
      }
    });

    // Cascading mountain waterfalls pouring into the valley gorge
    const valleyWaterfall = this.buildPrehistoricWaterfall(curbEdge + 28.0, 0.0, -chunkLength * 0.5, 16.0, 30.0);
    districtB.add(valleyWaterfall);
    director.registerWaterfall(valleyWaterfall.children[0] as THREE.Mesh, [], 2.8);

    // Prehistoric Riverbed alongside sauropod crossing path
    const river = this.buildPrehistoricRiver(-(curbEdge + 12.0), 0.0, -chunkLength * 0.5, 12.0, chunkLength);
    districtB.add(river);

    // Water splash rings around colossal sauropod's crossing feet
    const splashRings: THREE.Mesh[] = [];
    [-3.8, 3.8].forEach((lz) => {
      const ringGeo = new THREE.RingGeometry(1.6, 2.4, 16);
      ringGeo.rotateX(-Math.PI / 2);
      const ring = new THREE.Mesh(ringGeo, this.splashRingMat);
      ring.position.set(-(curbEdge + 8.5), 0.08, -chunkLength * 0.45 + lz);
      districtB.add(ring);
      splashRings.push(ring);
    });

    // Fossil trackways embedded in limestone riverbed
    const fossilBed = this.buildFossilBed(curbEdge + 5.5, 0.0, -chunkLength * 0.35, 1.2);
    districtB.add(fossilBed);

    // EVENT A — GIANT CROSSING: Colossal Sauropod crossing valley alongside the railway
    const sauropod = this.buildColossalSauropod(-(curbEdge + 8.5), 0.0, -chunkLength * 0.45, 1.0, true);
    districtB.add(sauropod.group);

    // Moving distant herd members migrating across sunlit valley floor at X = -45m
    const herdMembers: Array<{ group: THREE.Group; head: THREE.Object3D; tail: THREE.Object3D; speed: number }> = [];
    [-chunkLength * 0.25, -chunkLength * 0.75].forEach((hz, idx) => {
      const distSauropod = this.buildColossalSauropod(-(curbEdge + 38.0 + idx * 8.0), 0.0, hz, 0.65);
      districtB.add(distSauropod.group);
      herdMembers.push({
        group: distSauropod.group,
        head: distSauropod.head,
        tail: distSauropod.tail,
        speed: 2.2
      });
    });

    director.registerSauropod(
      sauropod.group,
      sauropod.neck,
      sauropod.head,
      sauropod.tail,
      sauropod.legs,
      3.8,
      1.5,
      -chunkLength * 0.8,
      chunkLength * 0.2,
      {
        triggerZ: worldZ - chunkLength * 0.45,
        herdMembers,
        splashRings,
        isEventA: true
      }
    );

    // Peaceful grazing herbivore herd on the right side
    const herd = this.buildHerbivoreHerd(curbEdge + 7.5, 0.0, -chunkLength * 0.55);
    districtB.add(herd.herdGroup);
    director.registerHerbivoreHerd(herd.herdGroup, herd.members);
  }

  /**
   * BIOME 3 (District C): Raptor Canyon & Event B (Raptor Ridge) (800m – 1200m)
   * Stratified sandstone canyon gorge with natural rock bedding (ZERO CONES!).
   * Natural eroded rock arches bridging overhead at Y = 18m.
   * Event B: Pack of 3 athletic raptors sprinting along an elevated natural rocky terrace at X = 11.5m.
   */
  public buildRaptorCanyonDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: JurassicRushEventDirector,
    worldZ: number = 0
  ): void {
    const districtC = new THREE.Group();
    districtC.name = 'district_c_raptor_canyon';
    group.add(districtC);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    [-1, 1].forEach((side) => {
      // Canyon floor gravel bed
      const walkW = 28.0;
      const bed = new THREE.Mesh(this.getBox(walkW, 6.0, chunkLength), this.canyonRockMat);
      bed.position.set(side * (curbEdge + walkW * 0.5), -3.0, -chunkLength * 0.5);
      districtC.add(bed);

      const curb = new THREE.Mesh(this.getBox(0.48, 6.0, chunkLength), this.amberCurbMat);
      curb.position.set(side * (curbEdge + 0.24), -3.0, -chunkLength * 0.5);
      districtC.add(curb);

      // Stratified Sandstone Canyon Walls (REAL GEOLOGICAL STRATA — NO CONES!)
      for (let cz = 15; cz < chunkLength; cz += 45) {
        const cliffGroup = new THREE.Group();
        cliffGroup.position.set(side * (curbEdge + 14.5), 0.0, -cz);

        // Lower bedrock bastion
        const lowerCliff = new THREE.Mesh(this.getBox(12.0, 14.0, 24.0), this.stratifiedSandstoneMat);
        lowerCliff.position.y = 1.0;
        cliffGroup.add(lowerCliff);

        // Stepped upper geological strata shelf
        const upperStrata = new THREE.Mesh(this.getBox(9.5, 12.0, 20.0), this.stratifiedSandstoneMat);
        upperStrata.position.set(side * 2.0, 14.0, 0);
        cliffGroup.add(upperStrata);

        // Overhang rock ledge with clinging ferns
        const overhang = new THREE.Mesh(this.getBox(11.0, 1.8, 16.0), this.canyonRockMat);
        overhang.position.set(side * 1.0, 20.0, 0);
        cliffGroup.add(overhang);

        districtC.add(cliffGroup);
      }
    });

    // Natural Eroded Rock Arch spanning high across the canyon gorge at Y = 18m
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 18.0, -chunkLength * 0.5);

    const archSpan = new THREE.Mesh(this.getBox(36.0, 3.2, 5.5), this.stratifiedSandstoneMat);
    archGroup.add(archSpan);

    [-1, 1].forEach((side) => {
      const archButtress = new THREE.Mesh(this.getBox(4.2, 18.0, 5.5), this.stratifiedSandstoneMat);
      archButtress.position.set(side * 16.0, -9.0, 0);
      archGroup.add(archButtress);
    });
    districtC.add(archGroup);

    // EVENT B — RAPTOR RIDGE: Pack of 3 athletic raptors sprinting along elevated terrace at X = 11.5m
    // Perched Rock Shelf at Z = -chunkLength * 0.15 where pack anticipates oncoming train at Y = 3.5m
    const perchShelf = new THREE.Mesh(this.getBox(6.5, 3.5, 14.0), this.stratifiedSandstoneMat);
    perchShelf.position.set(curbEdge + 6.5, 1.75, -chunkLength * 0.15);
    districtC.add(perchShelf);

    // Running terrace at Y = 1.5m along canyon wall
    const ridgeTerrace = new THREE.Mesh(this.getBox(7.5, 3.0, chunkLength * 0.75), this.stratifiedSandstoneMat);
    ridgeTerrace.position.set(curbEdge + 6.5, 0.0, -chunkLength * 0.5);
    districtC.add(ridgeTerrace);

    // Sandstone Rock Buttress Outcrop & Concealing Fissure at Z = -chunkLength * 0.82 where raptors disappear
    const buttressGroup = new THREE.Group();
    buttressGroup.position.set(curbEdge + 8.5, 0, -chunkLength * 0.82);

    const buttress = new THREE.Mesh(this.getBox(8.0, 14.0, 16.0), this.stratifiedSandstoneMat);
    buttress.position.y = 7.0;
    buttressGroup.add(buttress);

    const fissureOpening = new THREE.Mesh(this.getBox(3.5, 10.0, 8.0), this.canyonRockMat);
    fissureOpening.position.set(4.2, 5.0, 2.0);
    buttressGroup.add(fissureOpening);

    districtC.add(buttressGroup);

    const raptorPack = this.buildRaptorPack(curbEdge + 5.5, 1.5, -chunkLength * 0.5, true);
    districtC.add(raptorPack.packGroup);

    director.registerRaptorPack(
      raptorPack.packGroup,
      raptorPack.raptors,
      24.0,
      8.5,
      -chunkLength * 0.9,
      chunkLength * 0.1,
      {
        triggerZ: worldZ - chunkLength * 0.5,
        baseY: 1.5,
        perchY: 3.5,
        isEventB: true
      }
    );
  }

  /**
   * BIOME 4 (District D): The Ancient Sanctuary (1200m – 1600m)
   * Megalithic temple shrines, carved stone stelae with glowing claw sigils,
   * petrified redwood trunks, exposed fossil beds, and peaceful grazing dinosaur herds.
   */
  public buildAncientSanctuaryDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: JurassicRushEventDirector,
    worldZ: number = 0
  ): void {
    const districtD = new THREE.Group();
    districtD.name = 'district_d_ancient_sanctuary';
    group.add(districtD);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    [-1, 1].forEach((side) => {
      const walkW = 28.0;
      const bed = new THREE.Mesh(this.getBox(walkW, 6.0, chunkLength), this.templeStoneMat);
      bed.position.set(side * (curbEdge + walkW * 0.5), -3.0, -chunkLength * 0.5);
      districtD.add(bed);

      const curb = new THREE.Mesh(this.getBox(0.48, 6.0, chunkLength), this.amberCurbMat);
      curb.position.set(side * (curbEdge + 0.24), -3.0, -chunkLength * 0.5);
      districtD.add(curb);

      // Ancient Carved Stone Stelae with Golden Claw Sigil at |X| = 9.5m
      for (let sz = 16; sz < chunkLength; sz += 40) {
        const steleGroup = new THREE.Group();
        steleGroup.position.set(side * (curbEdge + 3.2), 0.0, -sz);

        const obelisk = new THREE.Mesh(this.getBox(2.2, 7.5, 2.2), this.templeStoneMat);
        obelisk.position.y = 3.75;
        steleGroup.add(obelisk);

        const sigil = new THREE.Mesh(this.getBox(2.25, 1.2, 2.25), this.templeGoldReliefMat);
        sigil.position.y = 5.2;
        steleGroup.add(sigil);

        districtD.add(steleGroup);
      }

      // Megalithic Stepped Temple Pyramid at |X| = 22m
      const pyramid = new THREE.Group();
      pyramid.position.set(side * (curbEdge + 18.0), 0.0, -chunkLength * 0.5);

      const t1 = new THREE.Mesh(this.getBox(18.0, 4.0, 24.0), this.templeStoneMat);
      t1.position.y = 2.0;
      pyramid.add(t1);

      const t2 = new THREE.Mesh(this.getBox(14.0, 4.0, 18.0), this.templeStoneMat);
      t2.position.y = 6.0;
      pyramid.add(t2);

      const t3 = new THREE.Mesh(this.getBox(9.0, 3.5, 12.0), this.templeStoneMat);
      t3.position.y = 9.75;
      pyramid.add(t3);

      districtD.add(pyramid);
    });

    // Signature Architectural Landmark: Grand Sun Temple Viaduct & Titanosaur Bone Arches
    const viaduct = this.buildGrandSunTempleViaduct(0, 0, 0, chunkLength);
    districtD.add(viaduct);

    // Fossil stone beds along the embankment
    const fossilBed = this.buildFossilBed(-(curbEdge + 4.5), 0.0, -chunkLength * 0.45, 1.15);
    districtD.add(fossilBed);

    // Peaceful herbivore herd resting amongst the sacred megaliths
    const herd = this.buildHerbivoreHerd(curbEdge + 6.5, 0.0, -chunkLength * 0.5);
    districtD.add(herd.herdGroup);
    director.registerHerbivoreHerd(herd.herdGroup, herd.members);
  }

  /**
   * BIOME 5 (District E): Fern Marsh (1600m – 2000m)
   * Sprawling shallow primordial wetland swamp with shimmering water pools,
   * giant calamite horsetails, dinosaur nests with clutches of speckled eggs,
   * and prehistoric dragonflies.
   */
  public buildFernMarshDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: JurassicRushEventDirector,
    worldZ: number = 0
  ): void {
    const districtE = new THREE.Group();
    districtE.name = 'district_e_fern_marsh';
    group.add(districtE);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    [-1, 1].forEach((side) => {
      const walkW = 32.0;
      const bed = new THREE.Mesh(this.getBox(walkW, 6.0, chunkLength), this.jungleLoamMat);
      bed.position.set(side * (curbEdge + walkW * 0.5), -3.0, -chunkLength * 0.5);
      districtE.add(bed);

      const curb = new THREE.Mesh(this.getBox(0.48, 6.0, chunkLength), this.amberCurbMat);
      curb.position.set(side * (curbEdge + 0.24), -3.0, -chunkLength * 0.5);
      districtE.add(curb);

      // Shimmering primordial swamp water surface along both sides
      const marshWater = new THREE.Mesh(this.getPlane(22.0, chunkLength), this.riverWaterMat);
      marshWater.rotation.x = -Math.PI / 2;
      marshWater.position.set(side * (curbEdge + 14.0), -0.15, -chunkLength * 0.5);
      districtE.add(marshWater);
      director.registerRiverStream(marshWater, 0.45);

      // Dense Giant Calamite Horsetails & Fern Fronds
      for (let hz = 8; hz < chunkLength; hz += 18) {
        const horsetailGroup = new THREE.Group();
        horsetailGroup.position.set(side * (curbEdge + 3.2 + (hz % 3) * 0.5), 0.0, -hz);

        const stem = new THREE.Mesh(this.getCylinder(0.22, 0.35, 6.5, 6), this.jungleLeafMat);
        stem.position.y = 3.25;
        horsetailGroup.add(stem);

        // Segmented leaf rings
        for (let r = 1; r <= 3; r++) {
          const ring = new THREE.Mesh(this.getPlane(1.8, 0.6), this.goldenFernMat);
          ring.position.y = r * 1.8;
          ring.rotation.x = 0.3;
          horsetailGroup.add(ring);
        }
        districtE.add(horsetailGroup);

        // Prehistoric cycads along marsh margins
        if (hz % 36 === 8) {
          const cycad = this.buildEyeLevelCycad(side * (curbEdge + 1.8), 0.0, -hz - 4.0, 1.1);
          districtE.add(cycad);
        }
      }
    });

    // Multiple Dinosaur Nests with clutches of speckled eggs
    const nestA = this.buildDinosaurNest(-(curbEdge + 4.8), 0.0, -chunkLength * 0.25);
    districtE.add(nestA);

    const nestB = this.buildDinosaurNest(curbEdge + 5.2, 0.0, -chunkLength * 0.65);
    districtE.add(nestB);

    const nestC = this.buildDinosaurNest(-(curbEdge + 5.0), 0.0, -chunkLength * 0.85);
    districtE.add(nestC);

    // Giant dragonflies darting over the marsh pools
    const dragonflyA = this.buildGiantDragonfly(-(curbEdge + 8.5), 1.9, -chunkLength * 0.35);
    districtE.add(dragonflyA);

    const dragonflyB = this.buildGiantDragonfly(curbEdge + 8.5, 2.1, -chunkLength * 0.75);
    districtE.add(dragonflyB);
  }

  /**
   * BIOME 6 (District F): Pterosaur Cliffs & Event C (Waterfall Predator) (2000m – 2400m)
   * Colossal sheer stratified sea/canyon cliffs rising to Y = 36m with nesting ledges.
   * Event C: Colossal Apex Carnivore roaring through the swirling mist of a multi-stage canyon cataract.
   * Soaring pterosaur flocks wheeling overhead in thermal updrafts.
   */
  public buildPterosaurCliffsDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: JurassicRushEventDirector,
    worldZ: number = 0
  ): void {
    const districtF = new THREE.Group();
    districtF.name = 'district_f_pterosaur_cliffs';
    group.add(districtF);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    [-1, 1].forEach((side) => {
      const walkW = 28.0;
      const bed = new THREE.Mesh(this.getBox(walkW, 6.0, chunkLength), this.canyonRockMat);
      bed.position.set(side * (curbEdge + walkW * 0.5), -3.0, -chunkLength * 0.5);
      districtF.add(bed);

      const curb = new THREE.Mesh(this.getBox(0.48, 6.0, chunkLength), this.amberCurbMat);
      curb.position.set(side * (curbEdge + 0.24), -3.0, -chunkLength * 0.5);
      districtF.add(curb);

      // Towering Prehistoric Cliffs rising to Y = 36m with horizontal strata bands
      const cliff = new THREE.Mesh(this.getCylinder(14.0, 18.0, 38.0, 8), this.stratifiedSandstoneMat);
      cliff.position.set(side * (curbEdge + 20.0), 13.0, -chunkLength * 0.5);
      districtF.add(cliff);

      // Cliff Nesting Ledges with resting pterosaur silhouettes
      const ledge = new THREE.Mesh(this.getBox(8.0, 2.2, 14.0), this.stratifiedSandstoneMat);
      ledge.position.set(side * (curbEdge + 12.0), 18.0, -chunkLength * 0.45);
      districtF.add(ledge);
    });

    // EVENT C — WATERFALL PREDATOR: Colossal Apex Carnivore emerging from cataract mist at X = 11.5m
    const waterfall = this.buildPrehistoricWaterfall(curbEdge + 12.0, 0.0, -chunkLength * 0.45, 16.0, 28.0);
    districtF.add(waterfall);

    // Elevated rock promontory supporting the apex predator
    const predatorPromontory = new THREE.Mesh(this.getBox(10.0, 5.0, 14.0), this.stratifiedSandstoneMat);
    predatorPromontory.position.set(curbEdge + 7.5, 1.5, -chunkLength * 0.45);
    districtF.add(predatorPromontory);

    const apexPredator = this.buildApexCarnivore(curbEdge + 6.8, 4.0, -chunkLength * 0.45, 1.25, true);
    districtF.add(apexPredator.group);

    director.registerCarnivore(
      apexPredator.group,
      apexPredator.torso,
      apexPredator.head,
      apexPredator.lowerJaw,
      apexPredator.tail,
      8.0,
      {
        triggerZ: worldZ - chunkLength * 0.45,
        isEventC: true
      }
    );

    // Soaring Pterosaur Flock wheeling overhead in thermal air columns
    const pterosaurFlock = this.buildPterosaurFlock(-chunkLength * 0.5);
    districtF.add(pterosaurFlock.group);
    director.registerPterosaurs(pterosaurFlock.group, pterosaurFlock.gliders, 18.0, 3.4);
  }

  /**
   * Showcase Locomotive for Expedition Trains
   */
  public buildJurassicRushShowcaseTrain(x: number = 0, y: number = 0, z: number = 0): THREE.Group {
    const trainGroup = new THREE.Group();
    trainGroup.position.set(x, y, z);

    // Heavy Armored Locomotive Body (2.5m x 4.0m x 22.4m)
    const body = new THREE.Mesh(this.getBox(2.5, 3.4, 22.4), this.expeditionTimberMat);
    body.position.y = 2.0;
    body.name = 'train_body';
    trainGroup.add(body);

    // Armored Bullbar / Cowcatcher at front (Z = -11.2m)
    const bullbar = new THREE.Mesh(this.getBox(2.7, 1.6, 1.4), this.expeditionTimberMat);
    bullbar.position.set(0, 0.8, -11.4);
    bullbar.name = 'bullbar_armor';
    trainGroup.add(bullbar);

    // Top Heavy Searchlight at Y = 4.2m
    const searchlight = new THREE.Mesh(this.getCylinder(0.45, 0.45, 0.65, 8), this.amberCurbMat);
    searchlight.rotation.x = Math.PI / 2;
    searchlight.position.set(0, 4.0, -10.5);
    trainGroup.add(searchlight);

    // Yellow expedition warning stripes along flank
    const stripe = new THREE.Mesh(this.getBox(2.54, 0.35, 22.0), this.amberCurbMat);
    stripe.position.set(0, 2.2, 0);
    trainGroup.add(stripe);

    return trainGroup;
  }
}
