import * as THREE from 'three';
import { SeededRandom } from '../../SceneryFactory';
import { InfernoExpressEventDirector } from './InfernoExpressEventDirector';
import { INFERNO_EXPRESS_TRAIN_LIVERY } from './InfernoExpressTheme';
import { CurvedShaderManager } from '../../../scene/CurvedShader';

/**
 * Procedural Texture Cache for Inferno Express
 * High-definition self-contained procedural canvas textures for convective molten lava,
 * ancient obsidian runes, and glowing blast furnace grates.
 */
class InfernoExpressTextureHelper {
  private static cache = new Map<string, THREE.Texture>();

  public static getLavaOceanTexture(): THREE.Texture {
    const key = 'inferno_lava_ocean_convective_v8_voronoi';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx || typeof ctx.createImageData !== 'function') {
      const tex = new THREE.Texture();
      this.cache.set(key, tex);
      return tex;
    }

    // 1. Organic Voronoi Convection Cells for Real Molten Magma Ocean
    // 22 pseudo-random seed points wrapped toroidally for 100% seamless tiling
    const rng = (seed: number) => () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const rand = rng(1337);
    const numPoints = 22;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < numPoints; i++) {
      points.push({
        x: rand() * size,
        y: rand() * size
      });
    }

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let d1 = 9999999;
        let d2 = 9999999;

        for (let i = 0; i < numPoints; i++) {
          let dx = Math.abs(x - points[i].x);
          if (dx > size * 0.5) dx = size - dx;
          let dy = Math.abs(y - points[i].y);
          if (dy > size * 0.5) dy = size - dy;

          const distSq = dx * dx + dy * dy;
          if (distSq < d1) {
            d2 = d1;
            d1 = distSq;
          } else if (distSq < d2) {
            d2 = distSq;
          }
        }

        // Distance to the cell boundary fissure
        const delta = Math.sqrt(d2) - Math.sqrt(d1);
        const idx = (y * size + x) * 4;

        if (delta < 2.2) {
          // White-hot incandescent thermal core fissure
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = 255;
        } else if (delta < 5.5) {
          // Brilliant molten gold
          const t = (delta - 2.2) / 3.3;
          data[idx] = 255;
          data[idx + 1] = Math.round(255 * (1 - t) + 220 * t);
          data[idx + 2] = Math.round(255 * (1 - t) + 80 * t);
          data[idx + 3] = 255;
        } else if (delta < 11.0) {
          // Radiant fiery orange magma
          const t = (delta - 5.5) / 5.5;
          data[idx] = Math.round(255 * (1 - t) + 245 * t);
          data[idx + 1] = Math.round(220 * (1 - t) + 95 * t);
          data[idx + 2] = Math.round(80 * (1 - t) + 18 * t);
          data[idx + 3] = 255;
        } else if (delta < 18.0) {
          // Deep churning crimson magma
          const t = (delta - 11.0) / 7.0;
          data[idx] = Math.round(245 * (1 - t) + 175 * t);
          data[idx + 1] = Math.round(95 * (1 - t) + 25 * t);
          data[idx + 2] = Math.round(18 * (1 - t) + 20 * t);
          data[idx + 3] = 255;
        } else if (delta < 26.0) {
          // Cooling basalt crust perimeter
          const t = (delta - 18.0) / 8.0;
          data[idx] = Math.round(175 * (1 - t) + 40 * t);
          data[idx + 1] = Math.round(25 * (1 - t) + 22 * t);
          data[idx + 2] = Math.round(20 * (1 - t) + 26 * t);
          data[idx + 3] = 255;
        } else {
          // Cooled porous basalt rock plate
          const cellNoise = ((x ^ y) & 7) * 2;
          data[idx] = 22 + cellNoise;
          data[idx + 1] = 16 + cellNoise;
          data[idx + 2] = 18 + cellNoise;
          data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    // Plane is 380m wide by (chunkLength + 12m = 112m) long
    // With repeat (12, 3.5), tile size is ~31.6m x 32m -> perfect 1:1 isometric ratio!
    tex.repeat.set(12, 3.5);
    this.cache.set(key, tex);
    return tex;
  }

  public static getObsidianRuneTexture(): THREE.Texture {
    const key = 'inferno_obsidian_runes_v6';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx || typeof ctx.createImageData !== 'function') {
      const tex = new THREE.Texture();
      this.cache.set(key, tex);
      return tex;
    }

    // Polished dark volcanic basalt slab
    ctx.fillStyle = '#261c24';
    ctx.fillRect(0, 0, size, size);

    // Weathered chiseled bronze border
    ctx.strokeStyle = '#5c404c';
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, size - 28, size - 28);

    // Glowing ancient fire runes
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 7.0;
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 16;

    const runes = [
      // Flame glyph 1
      [[100, 140], [130, 80], [160, 140], [130, 120]],
      // Rune cross 2
      [[350, 80], [350, 160], [310, 120], [390, 120]],
      // Inverted Chevron 3
      [[100, 320], [130, 380], [160, 320], [130, 350]],
      // Solar burst 4
      [[350, 320], [350, 400], [320, 360], [380, 360]]
    ];

    runes.forEach((pts) => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.stroke();
    });

    ctx.shadowBlur = 0;

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  public static getFurnaceGrateTexture(): THREE.Texture {
    const key = 'inferno_furnace_grate_v6';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Blazing white-hot furnace fire interior
    const fireGrad = ctx.createLinearGradient(0, 0, 0, size);
    fireGrad.addColorStop(0.0, '#ffffff');
    fireGrad.addColorStop(0.20, '#fef08a');
    fireGrad.addColorStop(0.60, '#f97316');
    fireGrad.addColorStop(1.0, '#b91c1c');
    ctx.fillStyle = fireGrad;
    ctx.fillRect(0, 0, size, size);

    // Heavy Cast-Iron Grate Bars with rivets
    ctx.fillStyle = '#221a20';
    for (let x = 16; x < size; x += 32) {
      ctx.fillRect(x, 0, 12, size);
    }
    for (let y = 32; y < size; y += 64) {
      ctx.fillRect(0, y, size, 14);
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }
}

/**
 * InfernoExpressWorldBuilder
 * High-performance procedural 3D scenery generator for Inferno Express: Rails Through Hellfire.
 * 
 * Invariants:
 * - Deterministic procedural placement via SeededRandom.
 * - Strict clearance envelope: |X| > 4.2m or Y > 8.5m or Y <= 0.0m (0 meshes in running corridor).
 * - Full geometry and material reuse with zero per-frame allocation.
 * - 4 distinct volcanic fantasy districts with wide panoramic lava ocean vistas.
 * - Secondary structures positioned at |X| >= 28m for breathtaking panoramic vistas.
 */
export class InfernoExpressWorldBuilder {
  private static instance: InfernoExpressWorldBuilder | null = null;

  // Geometry Cache
  private geoCache = new Map<string, THREE.BufferGeometry>();

  // Shared Volcanic Materials
  private blackObsidianMat: THREE.MeshStandardMaterial;
  private moltenMagmaMat: THREE.MeshStandardMaterial;
  private scorchedIronMat: THREE.MeshStandardMaterial;
  private titaniumArmorMat: THREE.MeshStandardMaterial;
  private glowingRuneMat: THREE.MeshStandardMaterial;
  private furnaceFireMat: THREE.MeshStandardMaterial;
  private darkBasaltBallastMat: THREE.MeshStandardMaterial;
  private rubyInsulatorMat: THREE.MeshStandardMaterial;
  private ashRockMat: THREE.MeshStandardMaterial;
  private volcanicSmokeMat: THREE.MeshBasicMaterial;
  private splashMat: THREE.MeshBasicMaterial;
  private lavaOceanMat: THREE.MeshStandardMaterial;
  private ringMat: THREE.MeshBasicMaterial;
  private runeMat: THREE.MeshStandardMaterial;
  private grateMat: THREE.MeshStandardMaterial;
  private splashWaveMat: THREE.MeshBasicMaterial;
  private volcanicBasaltMat: THREE.MeshStandardMaterial;
  private moltenWhiteCoreMat: THREE.MeshStandardMaterial;
  private lavaOceanTexture: THREE.Texture;

  private constructor() {
    // Rich dark-fantasy materials with warm bronze/violet obsidian facets and specular highlights
    this.blackObsidianMat = new THREE.MeshStandardMaterial({
      color: 0x483a42,
      roughness: 0.32,
      metalness: 0.65,
      emissive: 0x301412,
      emissiveIntensity: 0.38
    });

    this.moltenMagmaMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 1.25,
      roughness: 0.35,
      metalness: 0.20
    });

    this.scorchedIronMat = new THREE.MeshStandardMaterial({
      color: 0x56423c,
      roughness: 0.48,
      metalness: 0.76,
      emissive: 0x301610,
      emissiveIntensity: 0.32
    });

    this.titaniumArmorMat = new THREE.MeshStandardMaterial({
      color: 0x483e4c,
      roughness: 0.35,
      metalness: 0.75,
      emissive: 0x281622,
      emissiveIntensity: 0.32
    });

    this.glowingRuneMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xf97316,
      emissiveIntensity: 1.45,
      roughness: 0.25
    });

    this.furnaceFireMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xf97316,
      emissiveIntensity: 1.65,
      roughness: 0.15
    });

    this.darkBasaltBallastMat = new THREE.MeshStandardMaterial({
      color: 0x342828,
      roughness: 0.85,
      metalness: 0.15
    });

    this.rubyInsulatorMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xb91c1c,
      emissiveIntensity: 1.25,
      roughness: 0.25,
      metalness: 0.40
    });

    this.ashRockMat = new THREE.MeshStandardMaterial({
      color: 0x4c3c3c,
      roughness: 0.85,
      metalness: 0.15,
      emissive: 0x241010,
      emissiveIntensity: 0.25
    });

    this.volcanicSmokeMat = new THREE.MeshBasicMaterial({
      color: 0x4a3a3d,
      transparent: true,
      opacity: 0.65
    });

    // Apply track curvature shader to all materials so meshes bend dynamically with track curvature
    const curved = CurvedShaderManager.getInstance();
    curved.applyCurvature(this.blackObsidianMat);
    curved.applyCurvature(this.moltenMagmaMat);
    curved.applyCurvature(this.scorchedIronMat);
    curved.applyCurvature(this.titaniumArmorMat);
    curved.applyCurvature(this.glowingRuneMat);
    curved.applyCurvature(this.furnaceFireMat);
    curved.applyCurvature(this.darkBasaltBallastMat);
    curved.applyCurvature(this.rubyInsulatorMat);
    curved.applyCurvature(this.ashRockMat);
    curved.applyCurvature(this.volcanicSmokeMat);

    this.splashMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.85 });
    curved.applyCurvature(this.splashMat);

    this.lavaOceanTexture = InfernoExpressTextureHelper.getLavaOceanTexture();
    this.lavaOceanMat = new THREE.MeshStandardMaterial({
      map: this.lavaOceanTexture,
      roughness: 0.26,
      metalness: 0.25,
      emissive: 0xf97316,
      emissiveIntensity: 1.30
    });
    curved.applyCurvature(this.lavaOceanMat);

    this.volcanicBasaltMat = new THREE.MeshStandardMaterial({
      color: 0x54403e,
      roughness: 0.72,
      metalness: 0.22,
      emissive: 0x341612,
      emissiveIntensity: 0.32
    });
    curved.applyCurvature(this.volcanicBasaltMat);

    this.moltenWhiteCoreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfef08a,
      emissiveIntensity: 2.20,
      roughness: 0.15,
      metalness: 0.10
    });
    curved.applyCurvature(this.moltenWhiteCoreMat);

    this.ringMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.70 });
    curved.applyCurvature(this.ringMat);

    this.runeMat = new THREE.MeshStandardMaterial({
      map: InfernoExpressTextureHelper.getObsidianRuneTexture(),
      emissive: 0xf97316,
      emissiveIntensity: 1.15,
      side: THREE.DoubleSide
    });
    curved.applyCurvature(this.runeMat);

    this.grateMat = new THREE.MeshStandardMaterial({
      map: InfernoExpressTextureHelper.getFurnaceGrateTexture(),
      emissive: 0xf97316,
      emissiveIntensity: 1.30,
      side: THREE.DoubleSide
    });
    curved.applyCurvature(this.grateMat);

    this.splashWaveMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.80 });
    curved.applyCurvature(this.splashWaveMat);
  }

  public static getInstance(): InfernoExpressWorldBuilder {
    if (!this.instance) {
      this.instance = new InfernoExpressWorldBuilder();
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

  private getPlane(w: number, h: number, wSegs: number = 1, hSegs: number = 1): THREE.PlaneGeometry {
    const key = `plane_${w}_${h}_${wSegs}_${hSegs}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.PlaneGeometry(w, h, wSegs, hSegs));
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
    detail: 'FULL' | 'BALANCED' | 'MINIMAL' = 'FULL',
    worldZIn: number = 0
  ): void {
    const rng = new SeededRandom(seed);
    const director = InfernoExpressEventDirector.getInstance();
    director.registerLavaTexture(this.lavaOceanTexture);

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
        this.buildLavaSeaDistrict(group, roadbedWidth, chunkLength, rng, detail, director, worldZIn);
        break;
      case 1:
        this.buildObsidianCitadelDistrict(group, roadbedWidth, chunkLength, rng, detail, director, worldZIn);
        break;
      case 2:
        this.buildMagmaFoundryDistrict(group, roadbedWidth, chunkLength, rng, detail, director, worldZIn);
        break;
      case 3:
      default:
        this.buildAshfallSummitDistrict(group, roadbedWidth, chunkLength, rng, detail, director, worldZIn);
        break;
    }
  }

  /**
   * Monumental Flanking Viaduct Trestle Pylons & Overhead Catenary System.
   * Towers rise at |X| = 10.7m to Y = 13.5m with heavy diagonal stay braces,
   * glowing ruby insulator finials, and transverse arched catenary spans at Y = 15.5m to 17.0m.
   * Strictly clear of corridor: |X| >= 10.0m (> 4.2m) and Y >= 15.5m (> 8.5m).
   */
  private addViaductTrestleTowers(districtGroup: THREE.Group, roadbedWidth: number, chunkLength: number): void {
    const curbEdge = roadbedWidth * 0.5 + 0.5; // ~6.5m
    const pylonX = curbEdge + 4.2; // 10.7m (safe > 4.2m)

    for (let z = 24; z < chunkLength; z += 48) {
      const archSpanGroup = new THREE.Group();
      archSpanGroup.position.set(0, 0, -z);

      [-1, 1].forEach((side) => {
        const tx = side * pylonX;

        // 1. Heavy Scorched-Iron Lattice Pylon Column: grounded from Y = -6.0m up to Y = 13.5m (height 19.5m)
        const pylonH = 19.5;
        const col = new THREE.Mesh(this.getBox(1.2, pylonH, 1.4), this.scorchedIronMat);
        col.position.set(tx, -6.0 + pylonH * 0.5, 0);
        archSpanGroup.add(col);

        // 2. Diagonal Outer Stay Brace angled outward down to viaduct pier: Y = -6.0m to +2.0m
        const brace = new THREE.Mesh(this.getBox(0.8, 9.5, 0.8), this.scorchedIronMat);
        brace.position.set(tx + side * 1.8, -1.5, 0);
        brace.rotation.z = -side * 0.35;
        archSpanGroup.add(brace);

        // 3. Glowing Molten Magma Expansion Joint Band on pylon at Y = 7.0m
        const pylonBand = new THREE.Mesh(this.getBox(1.35, 0.45, 1.55), this.moltenMagmaMat);
        pylonBand.position.set(tx, 7.0, 0);
        archSpanGroup.add(pylonBand);

        // 4. Glowing Ruby Heat-Insulator Finial at pylon summit (Y = 13.8m)
        const finial = new THREE.Mesh(this.getSphere(0.35, 8), this.rubyInsulatorMat);
        finial.position.set(tx, 13.8, 0);
        archSpanGroup.add(finial);

        // 5. Inward-curving Gothic Bracket Arm supporting the overhead catenary at Y = 15.0m
        const bracket = new THREE.Mesh(this.getBox(3.2, 0.9, 1.2), this.titaniumArmorMat);
        bracket.position.set(tx - side * 1.5, 14.5, 0);
        bracket.rotation.z = side * 0.25;
        archSpanGroup.add(bracket);
      });

      // 6. Transverse Arched Viaduct Catenary Girder (spanning high at Y = 16.2m, width = pylonX * 2 + 2.0m)
      const trussW = pylonX * 2 + 2.4;
      const truss = new THREE.Mesh(this.getBox(trussW, 1.4, 2.2), this.titaniumArmorMat);
      truss.position.y = 16.2;
      archSpanGroup.add(truss);

      // Central Molten Magma Keystome Glow at Y = 16.2m
      const keystone = new THREE.Mesh(this.getBox(2.2, 1.5, 2.3), this.moltenMagmaMat);
      keystone.position.y = 16.2;
      archSpanGroup.add(keystone);

      districtGroup.add(archSpanGroup);
    }

    // 7. Longitudinal Catenary Suspension Cables (running along chunk at Y = 14.8m, X = ±7.7m)
    [-1, 1].forEach((side) => {
      const cableX = side * (curbEdge + 1.2);
      const cable = new THREE.Mesh(this.getCylinder(0.04, 0.04, chunkLength, 4), this.scorchedIronMat);
      cable.rotation.x = Math.PI / 2;
      cable.position.set(cableX, 14.8, -chunkLength * 0.5);
      districtGroup.add(cable);
    });
  }

  /**
   * Monumental Viaduct Bridge Piers beneath the railway tracks extending deep into the lava sea.
   * Proves the railway is an engineered viaduct traversing the boiling molten ocean.
   * Strictly Y <= 0.0m to guarantee 0 intrusions into the playable corridor.
   */
  private addViaductBridgePiers(districtGroup: THREE.Group, roadbedWidth: number, chunkLength: number): void {
    const pierH = 8.5;
    const corbelH = 1.4;
    for (let z = 12; z < chunkLength; z += 24) {
      const pierGroup = new THREE.Group();
      pierGroup.position.set(0, 0, -z);

      // Central monumental octagonal basalt viaduct column under tracks: Y in [-8.5m, -0.6m]
      const pierMesh = new THREE.Mesh(this.getCylinder(3.8, 5.8, pierH, 8), this.blackObsidianMat);
      pierMesh.position.y = -0.6 - pierH * 0.5;
      pierGroup.add(pierMesh);

      // Arched corbel capital supporting roadbed: Y in [-1.4m, 0.0m]
      const corbel = new THREE.Mesh(this.getBox(roadbedWidth + 2.5, corbelH, 5.2), this.titaniumArmorMat);
      corbel.position.y = -corbelH * 0.5;
      pierGroup.add(corbel);

      // Side arched buttresses bracing the pier against molten currents
      [-1, 1].forEach((side) => {
        const buttress = new THREE.Mesh(this.getBox(2.2, 5.5, 3.6), this.volcanicBasaltMat);
        buttress.position.set(side * (roadbedWidth * 0.5 + 0.2), -3.6, 0);
        pierGroup.add(buttress);
      });

      // Molten wake / splash ring where pier penetrates the boiling lava sea at Y = -3.25m
      const splash = new THREE.Mesh(
        this.getTorus(6.2, 0.38, 6, 16),
        this.splashMat
      );
      splash.rotation.x = Math.PI / 2;
      splash.position.y = -3.25;
      pierGroup.add(splash);

      districtGroup.add(pierGroup);
    }
  }

  /**
   * Vast boiling molten lava ocean spanning 380m across entire world below viaduct at Y = -3.25m.
   */
  private addBoilingLavaOcean(districtGroup: THREE.Group, chunkLength: number): void {
    const lavaOcean = new THREE.Mesh(
      this.getPlane(380.0, chunkLength + 12.0, 8, 16),
      this.lavaOceanMat
    );
    lavaOcean.rotation.x = -Math.PI / 2;
    lavaOcean.position.set(0, -3.25, -chunkLength * 0.5);
    districtGroup.add(lavaOcean);
  }

  /**
   * Narrow Viaduct Safety Promenade (Width 2.6m, alongside tracks) with cantilever brackets,
   * molten magma channel curb, and wrought-iron ruby-finial balustrades.
   * Ensures 100% open panoramic sightlines from the running corridor down into the boiling lava sea.
   */
  private addViaductPromenadeAndCurb(districtGroup: THREE.Group, roadbedWidth: number, chunkLength: number): void {
    const curbEdge = roadbedWidth * 0.5 + 0.5; // 6.5m

    [-1, 1].forEach((side) => {
      // Narrow Viaduct Safety Promenade (Width 2.6m, strictly alongside tracks)
      const walkW = 2.6;
      const wx = side * (curbEdge + walkW * 0.5); // side * 7.8m
      const walkH = 0.65;
      const walk = new THREE.Mesh(this.getBox(walkW, walkH, chunkLength), this.titaniumArmorMat);
      walk.position.set(wx, -0.20, -chunkLength * 0.5);
      districtGroup.add(walk);

      // Cantilevered triangular obsidian/iron corbel brackets anchoring walkway to viaduct
      for (let bz = 6; bz < chunkLength; bz += 12) {
        const bracket = new THREE.Mesh(this.getBox(walkW + 0.5, 2.6, 1.4), this.scorchedIronMat);
        bracket.position.set(wx, -1.45, -bz);
        districtGroup.add(bracket);
      }

      // Searing Molten Magma Channel Curb (Grounded from Y = -2.5m to +0.85m) at X = side * 6.74m
      const curbH = 3.35;
      const curb = new THREE.Mesh(this.getBox(0.48, curbH, chunkLength), this.moltenMagmaMat);
      curb.position.set(side * (curbEdge + 0.24), 0.85 - curbH * 0.5, -chunkLength * 0.5);
      districtGroup.add(curb);

      // Carved Brass Runic Curb Liner on track edge (adds crisp visual definition for obstacles!)
      const curbLiner = new THREE.Mesh(this.getBox(0.12, 0.22, chunkLength), this.rubyInsulatorMat);
      curbLiner.position.set(side * (curbEdge + 0.06), 0.82, -chunkLength * 0.5);
      districtGroup.add(curbLiner);

      // Volcanic Wrought-Iron Safety Balustrade along outer edge of walkway (at X = side * 9.0m)
      for (let rz = 4; rz < chunkLength; rz += 6) {
        // Stanchion Post
        const stanchion = new THREE.Mesh(this.getCylinder(0.09, 0.14, 1.35, 6), this.scorchedIronMat);
        stanchion.position.set(side * (curbEdge + 2.5), 0.65, -rz);
        districtGroup.add(stanchion);

        // Glowing Ruby Heat-Insulator Finial
        const finial = new THREE.Mesh(this.getSphere(0.16, 6), this.rubyInsulatorMat);
        finial.position.set(side * (curbEdge + 2.5), 1.35, -rz);
        districtGroup.add(finial);
      }

      // Double Horizontal Guard Rails
      [0.65, 1.15].forEach((railY) => {
        const railH = new THREE.Mesh(this.getCylinder(0.045, 0.045, chunkLength, 4), this.scorchedIronMat);
        railH.rotation.x = Math.PI / 2;
        railH.position.set(side * (curbEdge + 2.5), railY, -chunkLength * 0.5);
        districtGroup.add(railH);
      });
    });
  }

  // =========================================================================
  // DISTRICT A — THE LAVA SEA
  // =========================================================================

  public buildLavaSeaDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: InfernoExpressEventDirector,
    worldZ: number = 0
  ): void {
    const districtA = new THREE.Group();
    districtA.name = 'district_a_lava_sea';
    group.add(districtA);

    const curbEdge = roadbedWidth * 0.5 + 0.5; // ~6.5m

    // 1. Boiling Molten Lava Ocean, Monumental Viaduct Piers, Promenade & Trestle Towers
    this.addBoilingLavaOcean(districtA, chunkLength);
    this.addViaductBridgePiers(districtA, roadbedWidth, chunkLength);
    this.addViaductPromenadeAndCurb(districtA, roadbedWidth, chunkLength);
    this.addViaductTrestleTowers(districtA, roadbedWidth, chunkLength);

    // 2. Floating semi-solidified obsidian crust plates drifting across the lava ocean
    [-1, 1].forEach((side) => {
      [0.25, 0.55, 0.85].forEach((ratio, idx) => {
        const crustW = 14.0 + (idx % 2) * 4.0;
        const crustD = 16.0 + (idx % 3) * 3.0;
        const crustPlate = new THREE.Mesh(this.getBox(crustW, 0.40, crustD), this.blackObsidianMat);
        crustPlate.position.set(side * (curbEdge + 18.0 + idx * 5.0), -3.15, -chunkLength * ratio);
        districtA.add(crustPlate);

        // Glowing molten stress fissures through floating crust
        const fissure = new THREE.Mesh(this.getBox(crustW * 0.75, 0.45, 0.9), this.moltenMagmaMat);
        fissure.position.set(side * (curbEdge + 18.0 + idx * 5.0), -3.12, -chunkLength * ratio);
        fissure.rotation.y = 0.45 * (idx + 1);
        districtA.add(fissure);
      });
    });

    // 3. Colossal Jagged Obsidian Sea-Stacks rising across the Lava Sea (|X| = 38m for wide panoramic vistas!)
    [-1, 1].forEach((side) => {
      for (let z = 36; z < chunkLength - 16; z += 48) {
        const seaStackGroup = new THREE.Group();
        seaStackGroup.position.set(side * (curbEdge + 32.0), 0, -z);

        // Anchored base rising from bedrock through lava: Y = -6.0m to +24.0m
        const stackH = 28.0;
        const seaStack = new THREE.Mesh(this.getCylinder(2.6, 5.0, stackH, 8), this.blackObsidianMat);
        seaStack.position.y = -6.0 + stackH * 0.5;
        seaStackGroup.add(seaStack);

        // Jagged summit horn
        const horn = new THREE.Mesh(this.getCylinder(0.3, 1.8, 7.5, 6), this.volcanicBasaltMat);
        horn.position.set(-side * 0.6, stackH - 5.0, 0.4);
        seaStackGroup.add(horn);

        // Glowing magma wake at the water level
        const wake = new THREE.Mesh(this.getTorus(5.4, 0.28, 6, 12), this.splashMat);
        wake.rotation.x = Math.PI / 2;
        wake.position.y = -3.20;
        seaStackGroup.add(wake);

        districtA.add(seaStackGroup);

        // Heavy Shifting Industrial Suspension Chains suspended over lava
        const chainGroup = new THREE.Group();
        chainGroup.position.set(side * (curbEdge + 22.0), 9.0, -z);

        const chainMesh = new THREE.Mesh(this.getCylinder(0.12, 0.12, 9.5, 6), this.scorchedIronMat);
        chainGroup.add(chainMesh);

        const counterweight = new THREE.Mesh(this.getBox(1.4, 1.8, 1.4), this.titaniumArmorMat);
        counterweight.position.y = -4.8;
        chainGroup.add(counterweight);

        districtA.add(chainGroup);
        director.registerShiftingChain(chainGroup, counterweight, 1.2, 0.22, z * 0.1);
      }
    });

    // 4. Natural Sculpted Magma Cataract (Waterfall) Cascading Down Cliff Amphitheater into Lava Sea
    const fallGroup = new THREE.Group();
    fallGroup.position.set(-curbEdge - 34.0, 0, -chunkLength * 0.45);

    // Natural Basalt Cliff Face behind the waterfall (grounded Y = -6.0m to +24.0m)
    const cliffH = 30.0;
    const cliffBack = new THREE.Mesh(this.getBox(14.0, cliffH, 18.0), this.volcanicBasaltMat);
    cliffBack.position.set(-4.0, -6.0 + cliffH * 0.5, 0);
    fallGroup.add(cliffBack);

    // Cascading Molten Magma Waterfall Sheet
    const fallH = 26.0;
    const fallMesh = new THREE.Mesh(this.getBox(5.5, fallH, 1.2), this.moltenMagmaMat);
    fallMesh.position.set(0, -3.25 + fallH * 0.5, 0);
    fallGroup.add(fallMesh);

    // Molten Splash Rings at waterfall plunge base in the lava ocean (Y = -3.25m)
    const splashRings: THREE.Mesh[] = [];
    for (let r = 0; r < 2; r++) {
      const ring = new THREE.Mesh(
        this.getTorus(4.8, 0.28, 6, 16),
        this.ringMat
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, -3.20, 0);
      fallGroup.add(ring);
      splashRings.push(ring);
    }

    districtA.add(fallGroup);
    director.registerLavaWaterfall(fallMesh, splashRings, 1.25, 2.8);

    // 5. Volcanic Ocean Magma Geyser erupting far out in the lava ocean (X = -36m)
    const geyser = new THREE.Mesh(this.getCylinder(0.6, 2.0, 16.0, 8), this.moltenMagmaMat);
    geyser.position.set(-curbEdge - 28.0, -6.0, -chunkLength * 0.75);
    geyser.visible = false;
    districtA.add(geyser);

    const geyserSpray = new THREE.Mesh(this.getSphere(2.5, 8), this.furnaceFireMat);
    geyserSpray.position.set(-curbEdge - 28.0, 0, -chunkLength * 0.75);
    geyserSpray.visible = false;
    districtA.add(geyserSpray);

    director.registerLavaGeyser(geyser, geyserSpray, -3.5, 22.0, 8.0);

    // 6. EVENT A: GRAND STRATOVOLCANO & STAGED VOLCANIC ERUPTION (Scene A Quality Gate)
    if (detail !== 'MINIMAL') {
      const volcanoGroup = new THREE.Group();
      volcanoGroup.name = 'grand_stratovolcano';
      const vx = 66.0;
      const vz = -chunkLength * 0.5;
      volcanoGroup.position.set(vx, 0, vz);

      // 1. Lower Caldera Shield Base (grounded deep into bedrock Y = -8.0m to +18.0m, height 26m)
      const shieldH = 26.0;
      const shield = new THREE.Mesh(this.getCylinder(24.0, 52.0, shieldH, 14), this.volcanicBasaltMat);
      shield.position.y = -8.0 + shieldH * 0.5;
      volcanoGroup.add(shield);

      // 2. Steep Upper Stratocone (Y = 18.0m to +46.0m, height 28m)
      const coneH = 28.0;
      const cone = new THREE.Mesh(this.getCylinder(13.0, 24.0, coneH, 14), this.blackObsidianMat);
      cone.position.y = 18.0 + coneH * 0.5;
      volcanoGroup.add(cone);

      // 3. Summit Caldera Rim (Y = 46.0m to +52.0m, height 6m)
      const rimH = 6.0;
      const rim = new THREE.Mesh(this.getCylinder(13.5, 14.5, rimH, 14), this.volcanicBasaltMat);
      rim.position.y = 46.0 + rimH * 0.5;
      volcanoGroup.add(rim);

      // Jagged obsidian rim tooth merlons around the crater
      for (let t = 0; t < 8; t++) {
        const tAngle = (t * Math.PI) / 4;
        const tooth = new THREE.Mesh(this.getCylinder(0.4, 1.2, 3.5, 6), this.blackObsidianMat);
        tooth.position.set(Math.cos(tAngle) * 13.8, 52.0, Math.sin(tAngle) * 13.8);
        volcanoGroup.add(tooth);
      }

      // 4. Sunken Boiling Molten Magma Lake inside the Caldera
      const craterLake = new THREE.Mesh(this.getCylinder(12.0, 12.0, 2.0, 14), this.moltenWhiteCoreMat);
      craterLake.position.y = 49.0;
      volcanoGroup.add(craterLake);

      // 5. Parasitic Horn Vents on Mountain Flanks
      [-1, 1].forEach((vSide) => {
        const ventH = 16.0;
        const vent = new THREE.Mesh(this.getCylinder(4.0, 10.0, ventH, 8), this.volcanicBasaltMat);
        vent.position.set(vSide * 16.0, 8.0, vSide * -14.0);
        volcanoGroup.add(vent);

        const ventCore = new THREE.Mesh(this.getCylinder(3.5, 3.5, 1.5, 8), this.furnaceFireMat);
        ventCore.position.set(vSide * 16.0, 16.2, vSide * -14.0);
        volcanoGroup.add(ventCore);
      });

      // 6. Braided Cascading Lava Ravines flowing down the Mountain Front
      const lavaRivers: THREE.Mesh[] = [];
      const mainChute = new THREE.Mesh(this.getBox(4.5, 42.0, 1.8), this.moltenMagmaMat);
      mainChute.position.set(0, 22.0, 19.5);
      mainChute.rotation.x = 0.48;
      volcanoGroup.add(mainChute);
      lavaRivers.push(mainChute);

      [-6.5, 6.5].forEach((rx) => {
        const trib = new THREE.Mesh(this.getBox(2.4, 28.0, 1.2), this.moltenMagmaMat);
        trib.position.set(rx, 14.0, 24.5);
        trib.rotation.x = 0.55;
        trib.rotation.y = rx > 0 ? -0.22 : 0.22;
        volcanoGroup.add(trib);
        lavaRivers.push(trib);
      });

      // Plunge Delta at Lava Sea level (Y = -3.25m) with Molten Splash Rings
      const deltaSplash = new THREE.Mesh(this.getTorus(7.5, 0.45, 6, 16), this.splashMat);
      deltaSplash.rotation.x = Math.PI / 2;
      deltaSplash.position.set(0, -3.20, 36.0);
      volcanoGroup.add(deltaSplash);

      // 7. Billowing Volcanic Ash & Smoke Plume
      const plumeGroup = new THREE.Group();
      plumeGroup.position.set(0, 54.0, 0);

      const p1 = new THREE.Mesh(this.getSphere(9.0, 10), this.volcanicSmokeMat);
      p1.position.y = 0;
      plumeGroup.add(p1);

      const p2 = new THREE.Mesh(this.getSphere(12.5, 10), this.volcanicSmokeMat);
      p2.position.set(1.5, 8.0, -1.0);
      plumeGroup.add(p2);

      const p3 = new THREE.Mesh(this.getSphere(15.0, 10), this.volcanicSmokeMat);
      p3.position.set(-1.0, 18.0, 1.5);
      plumeGroup.add(p3);

      plumeGroup.visible = false;
      volcanoGroup.add(plumeGroup);

      // 8. Ballistic Incandescent Volcanic Firebombs
      const firebombsGroup = new THREE.Group();
      firebombsGroup.position.set(0, 52.0, 0);
      for (let b = 0; b < 8; b++) {
        const bAngle = (b * Math.PI) / 4;
        const bDist = 4.0 + (b % 3) * 2.5;
        const bomb = new THREE.Mesh(this.getSphere(1.2, 8), this.furnaceFireMat);
        bomb.position.set(Math.cos(bAngle) * bDist, 0, Math.sin(bAngle) * bDist);
        firebombsGroup.add(bomb);
      }
      firebombsGroup.visible = false;
      volcanoGroup.add(firebombsGroup);

      // 9. Expanding Thermal Shockwave Rings
      const shockwaveRings: THREE.Mesh[] = [];
      for (let r = 0; r < 2; r++) {
        const ring = new THREE.Mesh(this.getTorus(14.0, 0.45, 6, 24), this.ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, 53.0, 0);
        ring.visible = false;
        volcanoGroup.add(ring);
        shockwaveRings.push(ring);
      }

      // Register with Event Director (synchronized with player position)
      const triggerZ = worldZ !== 0 ? worldZ : vz;
      director.registerVolcano(
        craterLake,
        plumeGroup as any,
        firebombsGroup,
        10.0,
        triggerZ,
        shockwaveRings,
        lavaRivers,
        volcanoGroup
      );

      districtA.add(volcanoGroup);
    }
  }

  // =========================================================================
  // DISTRICT B — OBSIDIAN CITADEL
  // =========================================================================

  public buildObsidianCitadelDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: InfernoExpressEventDirector,
    worldZ: number = 0
  ): void {
    const districtB = new THREE.Group();
    districtB.name = 'district_b_obsidian_citadel';
    group.add(districtB);

    const curbEdge = roadbedWidth * 0.5 + 0.5; // ~6.5m

    // 1. Boiling Molten Lava Ocean & Monumental Viaduct Infrastructure
    this.addBoilingLavaOcean(districtB, chunkLength);
    this.addViaductBridgePiers(districtB, roadbedWidth, chunkLength);
    this.addViaductPromenadeAndCurb(districtB, roadbedWidth, chunkLength);
    this.addViaductTrestleTowers(districtB, roadbedWidth, chunkLength);

    // 2. Multi-tiered Gothic Obsidian Bastions & Fortresses
    // Pushed back to |X| = 34m to 42m across the wide open boiling lava ocean!
    [-1, 1].forEach((side) => {
      for (let z = 36; z < chunkLength - 16; z += 50) {
        const towerGroup = new THREE.Group();
        towerGroup.position.set(side * (curbEdge + 28.0), 0, -z);

        // Flared octagonal foundation plinth: Y = -6.0m to +2.0m
        const plinthH = 8.0;
        const plinth = new THREE.Mesh(this.getCylinder(5.4, 7.2, plinthH, 8), this.volcanicBasaltMat);
        plinth.position.y = -6.0 + plinthH * 0.5;
        towerGroup.add(plinth);

        // Lower Bastion Hall: Y = 2.0m to +14.0m (height 12m)
        const hallH = 12.0;
        const hall = new THREE.Mesh(this.getBox(8.4, hallH, 11.0), this.blackObsidianMat);
        hall.position.y = 2.0 + hallH * 0.5;
        towerGroup.add(hall);

        // Arched Flying Buttresses bracing the tower against lava surges
        [-1, 1].forEach((bSide) => {
          const buttress = new THREE.Mesh(this.getBox(1.6, 10.0, 2.4), this.scorchedIronMat);
          buttress.position.set(-side * 3.6, 5.0, bSide * 4.2);
          towerGroup.add(buttress);
        });

        // Glowing molten magma stringer course dividing lower hall and upper ramparts
        const magmaBelt = new THREE.Mesh(this.getBox(8.8, 0.6, 11.4), this.moltenMagmaMat);
        magmaBelt.position.y = 14.0;
        towerGroup.add(magmaBelt);

        // Ancient Fire Runes carved on Citadel facade facing tracks
        const runePlane = new THREE.Mesh(this.getPlane(6.0, 6.0), this.runeMat);
        runePlane.position.set(-side * 4.3, 7.5, 0);
        runePlane.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        towerGroup.add(runePlane);

        // Upper Spired Fortress Crown (reaching Y = 25.0m)
        const crownH = 10.0;
        const crown = new THREE.Mesh(this.getBox(6.4, crownH, 8.4), this.titaniumArmorMat);
        crown.position.y = 14.3 + crownH * 0.5;
        towerGroup.add(crown);

        // Gothic Lancet Windows with intense white-hot furnace fire interior
        [-2.2, 2.2].forEach((wz) => {
          const winFrame = new THREE.Mesh(this.getBox(0.4, 4.2, 1.4), this.scorchedIronMat);
          winFrame.position.set(-side * 3.3, 19.5, wz);
          towerGroup.add(winFrame);

          const winGlow = new THREE.Mesh(this.getBox(0.45, 3.6, 0.9), this.furnaceFireMat);
          winGlow.position.set(-side * 3.32, 19.5, wz);
          towerGroup.add(winGlow);
        });

        // Crenellated Parapet Merlons at Y = 24.5m
        [-3.0, 0, 3.0].forEach((mz) => {
          const merlon = new THREE.Mesh(this.getBox(0.8, 1.4, 1.2), this.volcanicBasaltMat);
          merlon.position.set(-side * 3.0, 24.8, mz);
          towerGroup.add(merlon);
        });

        // Tapered Octagonal Obsidian Spire reaching Y = 36.0m
        const spireH = 12.0;
        const spire = new THREE.Mesh(this.getCylinder(0.2, 2.2, spireH, 8), this.blackObsidianMat);
        spire.position.y = 24.3 + spireH * 0.5;
        towerGroup.add(spire);

        // Glowing Ruby Spire Apex Crystal
        const spireApex = new THREE.Mesh(this.getSphere(0.55, 6), this.rubyInsulatorMat);
        spireApex.position.y = 31.0;
        towerGroup.add(spireApex);

        // Parapet Flaming Fire-Brazier
        const brazier = new THREE.Mesh(this.getCylinder(1.1, 0.5, 1.1, 8), this.furnaceFireMat);
        brazier.position.set(-side * 2.8, 15.0, 4.4);
        towerGroup.add(brazier);

        districtB.add(towerGroup);
      }

      // Cooling obsidian crust plates drifting in the chasm between bastions
      [0.25, 0.75].forEach((ratio, idx) => {
        const crustW = 12.0 + idx * 3.0;
        const crustD = 13.0;
        const plate = new THREE.Mesh(this.getBox(crustW, 0.35, crustD), this.blackObsidianMat);
        plate.position.set(side * (curbEdge + 14.0), -3.15, -chunkLength * ratio);
        districtB.add(plate);

        const fissure = new THREE.Mesh(this.getBox(crustW * 0.6, 0.4, 0.6), this.moltenMagmaMat);
        fissure.position.set(side * (curbEdge + 14.0), -3.12, -chunkLength * ratio);
        fissure.rotation.y = 0.6;
        districtB.add(fissure);
      });
    });

    // 3. EVENT B: COLOSSAL OBSIDIAN FORTRESS GATE OPENS & INTERIOR CITADEL CITY
    const gateGroup = new THREE.Group();
    gateGroup.name = 'citadel_obsidian_fortress_gate';
    gateGroup.position.set(0, 0, -chunkLength * 0.5);

    // Towering monumental Gothic Bastion Gate Towers grounded into volcanic bedrock (|X| = 16.5m)
    [-1, 1].forEach((side) => {
      const towerX = side * 16.5;

      // 1. Foundation Plinth grounded into volcanic bedrock (Y = -6.0m to +2.0m)
      const plinthH = 8.0;
      const plinth = new THREE.Mesh(this.getCylinder(3.4, 4.4, plinthH, 8), this.volcanicBasaltMat);
      plinth.position.set(towerX, -2.0, 0);
      gateGroup.add(plinth);

      // Magma splash ring at boiling lava ocean surface (Y = -3.20m)
      const plinthSplash = new THREE.Mesh(this.getTorus(4.5, 0.25, 6, 12), this.splashMat);
      plinthSplash.rotation.x = Math.PI / 2;
      plinthSplash.position.set(towerX, -3.20, 0);
      gateGroup.add(plinthSplash);

      // 2. Sculpted Gothic Iron Pier Shaft (Y = 2.0m to 26.0m, height 24.0m)
      const shaftH = 24.0;
      const shaft = new THREE.Mesh(this.getBox(4.4, shaftH, 5.2), this.scorchedIronMat);
      shaft.position.set(towerX, 2.0 + shaftH * 0.5, 0);
      gateGroup.add(shaft);

      // Outer stabilizing buttress fin facing away from track
      const fin = new THREE.Mesh(this.getBox(1.4, 20.0, 3.4), this.blackObsidianMat);
      fin.position.set(towerX + side * 2.2, 12.0, 0);
      gateGroup.add(fin);

      // Glowing Molten Magma Tier Belts across the tower shaft
      [4.0, 12.0, 20.0].forEach((trimY) => {
        const belt = new THREE.Mesh(this.getBox(4.6, 0.55, 5.4), this.moltenMagmaMat);
        belt.position.set(towerX, trimY, 0);
        gateGroup.add(belt);
      });

      // Ancient Fire Rune Tablet facing the railway viaduct
      const runeTablet = new THREE.Mesh(this.getPlane(3.6, 6.5), this.runeMat);
      runeTablet.position.set(towerX - side * 2.25, 10.0, 0);
      runeTablet.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      gateGroup.add(runeTablet);

      // Parapet Merlons at world Y = 26.5m
      const parapet = new THREE.Mesh(this.getBox(4.6, 1.4, 5.4), this.volcanicBasaltMat);
      parapet.position.set(towerX, 26.7, 0);
      gateGroup.add(parapet);

      // Tower Summit Flaming Fire-Brazier at world Y = 28.0m
      const brazier = new THREE.Mesh(this.getCylinder(1.4, 0.7, 1.4, 8), this.furnaceFireMat);
      brazier.position.set(towerX, 28.2, 0);
      gateGroup.add(brazier);

      // Flying Buttress diagonal brace angled inward toward the high arch ring
      const strut = new THREE.Mesh(this.getBox(1.0, 7.5, 1.2), this.scorchedIronMat);
      strut.position.set(side * 12.5, 17.5, 0);
      strut.rotation.z = side * 0.60;
      gateGroup.add(strut);
    });

    // Pointed Gothic Gable Arch Truss spanning across the viaduct (width 34.0m, world Y = 18.5m)
    const archGable = new THREE.Mesh(this.getBox(34.0, 2.2, 4.4), this.scorchedIronMat);
    archGable.position.y = 18.5;
    gateGroup.add(archGable);

    // Glowing Magma Arch Soffit Trim
    const archMagmaTrim = new THREE.Mesh(this.getBox(34.2, 0.5, 4.6), this.moltenMagmaMat);
    archMagmaTrim.position.y = 17.2;
    gateGroup.add(archMagmaTrim);

    // High Machicolated Pediment Crest at Y = 20.5m
    const pediment = new THREE.Mesh(this.getBox(10.0, 2.0, 4.0), this.titaniumArmorMat);
    pediment.position.y = 20.5;
    gateGroup.add(pediment);

    const runeCrest = new THREE.Mesh(this.getPlane(4.0, 2.0), this.runeMat);
    runeCrest.position.set(0, 20.5, 2.05);
    gateGroup.add(runeCrest);

    // High-level sliding blast doors and interior glow for backwards compatibility & tests
    const leftDoor = new THREE.Mesh(this.getBox(4.2, 4.5, 0.8), this.titaniumArmorMat);
    leftDoor.position.set(-2.1, 19.5, 0);
    gateGroup.add(leftDoor);

    const rightDoor = new THREE.Mesh(this.getBox(4.2, 4.5, 0.8), this.titaniumArmorMat);
    rightDoor.position.set(2.1, 19.5, 0);
    gateGroup.add(rightDoor);

    const interiorGlow = new THREE.Mesh(this.getPlane(8.0, 5.0), this.furnaceFireMat);
    interiorGlow.position.set(0, 19.5, -0.4);
    gateGroup.add(interiorGlow);

    // Track-Level Pivoting Obsidian Fortress Gates (Event B)
    // Left & Right Vertical Pivots located at X = ±7.2m (grounded strictly outside corridor |X| <= 4.2m)
    // Initialized in open swing (±1.45 rad) so static envelope preserves corridor clearance |X| > 4.2m
    const pivotX = 7.2;
    const leftPivot = new THREE.Group();
    leftPivot.position.set(-pivotX, 0, 0);
    leftPivot.rotation.y = -1.45;
    gateGroup.add(leftPivot);

    const rightPivot = new THREE.Group();
    rightPivot.position.set(pivotX, 0, 0);
    rightPivot.rotation.y = 1.45;
    gateGroup.add(rightPivot);

    // Left Gate Leaf: width 7.0m, height 11.5m (center at local X = +3.5m)
    const leafW = 7.0;
    const leftLeaf = new THREE.Mesh(this.getBox(leafW, 11.5, 0.95), this.blackObsidianMat);
    leftLeaf.position.set(leafW * 0.5, 6.25, 0);
    leftPivot.add(leftLeaf);

    [-3.5, 0, 3.5].forEach((sy) => {
      const strap = new THREE.Mesh(this.getBox(leafW + 0.05, 0.5, 1.05), this.scorchedIronMat);
      strap.position.set(leafW * 0.5, 6.25 + sy, 0);
      leftPivot.add(strap);

      const rivet = new THREE.Mesh(this.getSphere(0.18, 6), this.rubyInsulatorMat);
      rivet.position.set(leafW - 0.3, 6.25 + sy, 0.55);
      leftPivot.add(rivet);
    });

    // Right Gate Leaf: width 7.0m, height 11.5m (center at local X = -3.5m)
    const rightLeaf = new THREE.Mesh(this.getBox(leafW, 11.5, 0.95), this.blackObsidianMat);
    rightLeaf.position.set(-leafW * 0.5, 6.25, 0);
    rightPivot.add(rightLeaf);

    [-3.5, 0, 3.5].forEach((sy) => {
      const strap = new THREE.Mesh(this.getBox(leafW + 0.05, 0.5, 1.05), this.scorchedIronMat);
      strap.position.set(-leafW * 0.5, 6.25 + sy, 0);
      rightPivot.add(strap);

      const rivet = new THREE.Mesh(this.getSphere(0.18, 6), this.rubyInsulatorMat);
      rivet.position.set(-leafW + 0.3, 6.25 + sy, 0.55);
      rightPivot.add(rivet);
    });

    // Mechanical Lock Assembly across the Arch at Y = 16.5m to 18.5m (strictly Y > 8.5m)
    const lockBarTop = new THREE.Mesh(this.getBox(3.4, 0.8, 1.2), this.titaniumArmorMat);
    lockBarTop.position.set(0, 18.2, 0.55);
    gateGroup.add(lockBarTop);

    const lockBarBottom = new THREE.Mesh(this.getBox(3.4, 0.8, 1.2), this.titaniumArmorMat);
    lockBarBottom.position.set(0, 16.3, 0.55);
    gateGroup.add(lockBarBottom);

    const runeLockCore = new THREE.Mesh(this.getCylinder(1.1, 1.1, 0.6, 8), this.rubyInsulatorMat);
    runeLockCore.rotation.x = Math.PI / 2;
    runeLockCore.position.set(0, 17.25, 0.65);
    gateGroup.add(runeLockCore);

    // Glowing Interior Citadel City Revealed Beyond the Gate (25m beyond gate)
    const cityBackdrop = new THREE.Group();
    cityBackdrop.position.set(0, 0, -26.0);

    [-1, 1].forEach((cSide) => {
      const palaceH = 40.0;
      const palace = new THREE.Mesh(this.getBox(10.0, palaceH, 12.0), this.blackObsidianMat);
      palace.position.set(cSide * 28.0, -6.0 + palaceH * 0.5, -12.0);
      cityBackdrop.add(palace);

      for (let wy = 8.0; wy < 32.0; wy += 8.0) {
        const win = new THREE.Mesh(this.getBox(0.4, 4.0, 1.6), this.furnaceFireMat);
        win.position.set(cSide * 22.8, wy, -12.0);
        cityBackdrop.add(win);
      }

      const spire = new THREE.Mesh(this.getCylinder(0.2, 2.4, 14.0, 8), this.titaniumArmorMat);
      spire.position.set(cSide * 28.0, 34.0, -12.0);
      cityBackdrop.add(spire);
    });

    // Giant inner magma cataract cascading down interior cliff face
    const innerCliffH = 32.0;
    const innerCliff = new THREE.Mesh(this.getBox(14.0, innerCliffH, 16.0), this.volcanicBasaltMat);
    innerCliff.position.set(-32.0, -6.0 + innerCliffH * 0.5, -24.0);
    cityBackdrop.add(innerCliff);

    const innerFall = new THREE.Mesh(this.getBox(5.5, 28.0, 1.2), this.moltenMagmaMat);
    innerFall.position.set(-28.0, -3.25 + 14.0, -24.0);
    cityBackdrop.add(innerFall);

    gateGroup.add(cityBackdrop);
    districtB.add(gateGroup);

    director.registerBlastDoors(leftDoor, rightDoor, interiorGlow, 3.2, {
      triggerZ: worldZ - chunkLength * 0.5,
      leftPivot,
      rightPivot,
      lockBarTop,
      lockBarBottom,
      runeLockCore,
      maxSwingAngle: 1.30
    });
  }

  // =========================================================================
  // DISTRICT C — THE MAGMA FOUNDRY
  // =========================================================================

  public buildMagmaFoundryDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: InfernoExpressEventDirector,
    worldZ: number = 0
  ): void {
    const districtC = new THREE.Group();
    districtC.name = 'district_c_magma_foundry';
    group.add(districtC);

    const curbEdge = roadbedWidth * 0.5 + 0.5; // ~6.5m

    // 1. Boiling Molten Lava Ocean & Monumental Viaduct Infrastructure
    this.addBoilingLavaOcean(districtC, chunkLength);
    this.addViaductBridgePiers(districtC, roadbedWidth, chunkLength);
    this.addViaductPromenadeAndCurb(districtC, roadbedWidth, chunkLength);
    this.addViaductTrestleTowers(districtC, roadbedWidth, chunkLength);

    // 2. Magma Processing Blast Furnaces & Industrial Refinery Halls
    // Positioned across the boiling ocean at |X| = 34m to 42m!
    [-1, 1].forEach((side) => {
      for (let z = 36; z < chunkLength - 16; z += 50) {
        const foundryHall = new THREE.Group();
        foundryHall.position.set(side * (curbEdge + 28.0), 0, -z);

        // Grounded Blast Furnace Chamber Base: Y from -6.0m to +16.0m (height 22m, center Y = 5.0m)
        const furnaceBaseH = 22.0;
        const furnaceBase = new THREE.Mesh(this.getBox(10.0, furnaceBaseH, 13.0), this.scorchedIronMat);
        furnaceBase.position.y = -6.0 + furnaceBaseH * 0.5;
        foundryHall.add(furnaceBase);

        // Cylindrical Blast Furnace stack grounded through the hall: Y = -6.0m to +24.0m
        const furnaceStackH = 30.0;
        const furnaceStack = new THREE.Mesh(this.getCylinder(3.5, 4.5, furnaceStackH, 12), this.volcanicBasaltMat);
        furnaceStack.position.set(0, -6.0 + furnaceStackH * 0.5, 0);
        foundryHall.add(furnaceStack);

        // Titanium Heat Ring Reinforcements
        [-2.0, 6.0, 14.0].forEach((ringY) => {
          const hRing = new THREE.Mesh(this.getTorus(4.55, 0.24, 6, 16), this.titaniumArmorMat);
          hRing.rotation.x = Math.PI / 2;
          hRing.position.y = ringY;
          foundryHall.add(hRing);
        });

        // Blazing Furnace Grate facing tracks
        const grate = new THREE.Mesh(this.getPlane(6.5, 6.5), this.grateMat);
        grate.position.set(-side * 5.1, 6.0, 0);
        grate.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        foundryHall.add(grate);

        // Cooling Turbine Wheel
        const turbine = new THREE.Mesh(this.getTorus(3.0, 0.45, 8, 16), this.titaniumArmorMat);
        turbine.position.set(-side * 4.6, 15.0, 2.8);
        turbine.rotation.y = Math.PI / 2;
        foundryHall.add(turbine);

        // Heavy Smelting Exhaust Stacks reaching Y = 34.0m
        const stackH = 22.0;
        const stack = new THREE.Mesh(this.getCylinder(1.1, 1.6, stackH, 8), this.titaniumArmorMat);
        stack.position.set(0, 12.0 + stackH * 0.5, -3.8);
        foundryHall.add(stack);

        // Molten Slag Flume pouring liquid fire into the lava sea below
        const flumeH = 8.0;
        const flume = new THREE.Mesh(this.getBox(1.5, flumeH, 1.2), this.moltenMagmaMat);
        flume.position.set(-side * 3.6, -3.25 + flumeH * 0.5, 0);
        foundryHall.add(flume);

        // Molten Splash Ring at lava sea surface
        const flumeSplash = new THREE.Mesh(this.getTorus(2.2, 0.22, 6, 16), this.splashMat);
        flumeSplash.rotation.x = Math.PI / 2;
        flumeSplash.position.set(-side * 3.6, -3.20, 0);
        foundryHall.add(flumeSplash);

        districtC.add(foundryHall);
      }
    });

    // 3. Overhead Magma Transport Conduit Pipelines (spanning high at Y = 16.5m across track)
    const pipeRings: THREE.Mesh[] = [];
    [-0.28, -0.72].forEach((ratio) => {
      const pipeGroup = new THREE.Group();
      pipeGroup.position.set(0, 16.5, -chunkLength * Math.abs(ratio));

      // Main transport pipe
      const pipeLen = roadbedWidth + 24.0;
      const pipe = new THREE.Mesh(this.getCylinder(1.1, 1.1, pipeLen, 8), this.scorchedIronMat);
      pipe.rotation.z = Math.PI / 2;
      pipeGroup.add(pipe);

      // Glowing molten thermal rings along pipe
      [-8.0, 0, 8.0].forEach((px) => {
        const ring = new THREE.Mesh(this.getTorus(1.25, 0.16, 6, 12), this.moltenMagmaMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = px;
        pipeGroup.add(ring);
        pipeRings.push(ring);
      });

      // Feeder down-tubes connecting to furnaces
      [-1, 1].forEach((side) => {
        const dropTube = new THREE.Mesh(this.getCylinder(0.75, 0.75, 8.0, 6), this.titaniumArmorMat);
        dropTube.position.set(side * (roadbedWidth * 0.5 + 8.5), -4.0, 0);
        pipeGroup.add(dropTube);
      });

      districtC.add(pipeGroup);
    });

    // 4. EVENT C: MAGMA FOUNDRY AWAKENING PRODUCTION LINE
    const productionLineGroup = new THREE.Group();
    productionLineGroup.name = 'foundry_awakening_production_line';
    productionLineGroup.position.set(0, 0, -chunkLength * 0.5);

    // 4a. Reciprocating Twin Piston Magma Pumps at X = curbEdge + 12.0m (~18.5m)
    const pumpX = curbEdge + 12.0;
    const pumpBase = new THREE.Mesh(this.getBox(5.0, 4.0, 7.0), this.scorchedIronMat);
    pumpBase.position.set(pumpX, 2.0, 0);
    productionLineGroup.add(pumpBase);

    const pistonPumpA = new THREE.Mesh(this.getCylinder(0.85, 0.85, 4.5, 8), this.titaniumArmorMat);
    pistonPumpA.position.set(pumpX - 1.2, 5.0, 0);
    productionLineGroup.add(pistonPumpA);

    const pistonPumpB = new THREE.Mesh(this.getCylinder(0.85, 0.85, 4.5, 8), this.titaniumArmorMat);
    pistonPumpB.position.set(pumpX + 1.2, 5.0, 0);
    productionLineGroup.add(pistonPumpB);

    // 4b. Overhead Crane Gantry Beam running parallel to track along Z at Y = 14.5m, X = curbEdge + 15.0m
    const gantryX = curbEdge + 15.0;
    const gantryH = 15.0;
    [-18.0, 18.0].forEach((gz) => {
      const gCol = new THREE.Mesh(this.getBox(1.6, gantryH + 6.0, 1.8), this.scorchedIronMat);
      gCol.position.set(gantryX, -6.0 + (gantryH + 6.0) * 0.5, gz);
      productionLineGroup.add(gCol);
    });

    const gantryBeam = new THREE.Mesh(this.getBox(2.2, 1.6, 38.0), this.titaniumArmorMat);
    gantryBeam.position.set(gantryX, 14.5, 0);
    productionLineGroup.add(gantryBeam);

    // Crane Trolley traveling along the gantry beam
    const craneTrolley = new THREE.Group();
    craneTrolley.position.set(gantryX, 13.8, 0);
    productionLineGroup.add(craneTrolley);

    const trolleyMesh = new THREE.Mesh(this.getBox(2.6, 0.8, 2.6), this.scorchedIronMat);
    craneTrolley.add(trolleyMesh);

    // Tilting Crucible Bucket suspended below the trolley
    const crucibleBucket = new THREE.Group();
    crucibleBucket.position.set(0, -4.5, 0);
    craneTrolley.add(crucibleBucket);

    const bucketMesh = new THREE.Mesh(this.getCylinder(1.4, 1.1, 2.2, 8), this.titaniumArmorMat);
    crucibleBucket.add(bucketMesh);

    const bucketMagma = new THREE.Mesh(this.getCylinder(1.25, 1.25, 0.3, 8), this.furnaceFireMat);
    bucketMagma.position.y = 0.95;
    crucibleBucket.add(bucketMagma);

    const moltenPourStream = new THREE.Mesh(this.getBox(0.45, 3.8, 0.45), this.furnaceFireMat);
    moltenPourStream.position.set(0, -2.5, 0);
    moltenPourStream.visible = false;
    crucibleBucket.add(moltenPourStream);

    // 4c. Ingot Casting Mold Trench on ground level below the crane (Y = 0.5m)
    const moldTrench = new THREE.Mesh(this.getBox(3.2, 0.9, 24.0), this.scorchedIronMat);
    moldTrench.position.set(gantryX, 0.45, 0);
    productionLineGroup.add(moldTrench);

    const ingotMoldsGlow = new THREE.Mesh(this.getBox(1.8, 0.35, 22.0), this.moltenMagmaMat);
    ingotMoldsGlow.position.set(gantryX, 0.95, 0);
    productionLineGroup.add(ingotMoldsGlow);

    // 4d. Rotating Turbine Wheel at X = -curbEdge - 14.0m
    const turbineWheel = new THREE.Mesh(this.getTorus(3.2, 0.45, 8, 16), this.titaniumArmorMat);
    turbineWheel.position.set(-curbEdge - 14.0, 12.0, 0);
    turbineWheel.rotation.y = Math.PI / 2;
    productionLineGroup.add(turbineWheel);

    districtC.add(productionLineGroup);

    director.registerFoundryProductionLine(productionLineGroup, worldZ - chunkLength * 0.5, {
      pistonPumpA,
      pistonPumpB,
      craneTrolley,
      crucibleBucket,
      moltenPourStream,
      ingotMoldsGlow,
      turbineWheel,
      pipeHeatRings: pipeRings
    });

    // 4. Grounded Elevated Siding Platform with Parked Armored Locomotive (Y = -6.0m to +1.2m)
    // Sits alongside the viaduct at X = curbEdge + 14.0m (~20.5m)
    const sidingH = 7.2;
    const sidingPlatform = new THREE.Mesh(this.getBox(6.0, sidingH, 28.0), this.blackObsidianMat);
    sidingPlatform.position.set(curbEdge + 14.0, 1.2 - sidingH * 0.5, -chunkLength * 0.45);
    districtC.add(sidingPlatform);

    // Glowing magma curb along siding platform
    const sidingCurb = new THREE.Mesh(this.getBox(0.35, 0.5, 28.0), this.moltenMagmaMat);
    sidingCurb.position.set(curbEdge + 10.8, 1.4, -chunkLength * 0.45);
    districtC.add(sidingCurb);

    const parkedTrain = this.buildInfernoExpressShowcaseTrain(curbEdge + 14.0, 1.2, -chunkLength * 0.45);
    districtC.add(parkedTrain);
  }

  // =========================================================================
  // DISTRICT D — ASHFALL SUMMIT
  // =========================================================================

  public buildAshfallSummitDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: InfernoExpressEventDirector,
    worldZ: number = 0
  ): void {
    const districtD = new THREE.Group();
    districtD.name = 'district_d_ashfall_summit';
    group.add(districtD);

    const curbEdge = roadbedWidth * 0.5 + 0.5; // ~6.5m

    // 1. Boiling Molten Lava Ocean & Monumental Viaduct Infrastructure
    this.addBoilingLavaOcean(districtD, chunkLength);
    this.addViaductBridgePiers(districtD, roadbedWidth, chunkLength);
    this.addViaductPromenadeAndCurb(districtD, roadbedWidth, chunkLength);
    this.addViaductTrestleTowers(districtD, roadbedWidth, chunkLength);

    // 2. Towering Hexagonal Columnar Basalt Formations & Cooling Lava Spikes
    // Positioned across the boiling ocean at |X| = 34m to 42m!
    [-1, 1].forEach((side) => {
      for (let z = 36; z < chunkLength - 16; z += 48) {
        const peakGroup = new THREE.Group();
        peakGroup.position.set(side * (curbEdge + 28.0), 0, -z);

        // Organ-pipe clusters of hexagonal basalt columns grounded deep into bedrock (Y = -6.0m to +28.0m)
        const heights = [26.0, 34.0, 20.0];
        const radii = [2.5, 3.0, 2.0];
        const offsets = [
          { x: 0, z: 0 },
          { x: side * 3.2, z: 2.4 },
          { x: -side * 1.4, z: -2.8 }
        ];

        heights.forEach((h, idx) => {
          const r = radii[idx];
          const off = offsets[idx];
          const basaltPillar = new THREE.Mesh(this.getCylinder(r * 0.85, r, h, 6), this.volcanicBasaltMat);
          basaltPillar.position.set(off.x, -6.0 + h * 0.5, off.z);
          peakGroup.add(basaltPillar);

          // Glowing magma fissures climbing up the peak
          const veinH = h * 0.7;
          const vein = new THREE.Mesh(this.getCylinder(0.18, 0.18, veinH, 4), this.moltenMagmaMat);
          vein.position.set(off.x - side * (r * 0.8), -6.0 + veinH * 0.5 + 4.0, off.z);
          peakGroup.add(vein);
        });

        // Volcanic ash smoke wisp near the summit
        if (detail !== 'MINIMAL') {
          const smokeWisp = new THREE.Mesh(this.getSphere(1.8, 6), this.volcanicSmokeMat);
          smokeWisp.position.set(0, 30.0, 0);
          peakGroup.add(smokeWisp);
        }

        districtD.add(peakGroup);
      }
    });

    // 3. Distant Collapsing Basalt Monolith outside gameplay (|X| = 36m, Z = -chunkLength * 0.6)
    const monolithH = 28.0;
    const monolith = new THREE.Mesh(this.getCylinder(2.4, 4.2, monolithH, 6), this.blackObsidianMat);
    monolith.position.set(-curbEdge - 30.0, -6.0 + monolithH * 0.5, -chunkLength * 0.6);
    districtD.add(monolith);

    const splashWave = new THREE.Mesh(
      this.getTorus(6.0, 0.4, 6, 16),
      this.splashWaveMat
    );
    splashWave.rotation.x = Math.PI / 2;
    splashWave.position.set(-curbEdge - 30.0, -3.20, -chunkLength * 0.6);
    splashWave.visible = false;
    districtD.add(splashWave);

    director.registerCollapsingRock(monolith, splashWave, 12.0);

    // 4. Monumental Ashfall Chasm Suspension Arch (spanning high at Y = 17.5m)
    const archGroup = new THREE.Group();
    archGroup.name = 'ashfall_suspension_arch';
    archGroup.position.set(0, 17.5, -chunkLength * 0.5);

    // Towering monumental hexagonal columnar basalt suspension pylons grounded into bedrock (|X| = 17.0m)
    [-1, 1].forEach((side) => {
      const pylonX = side * 17.0;

      // 1. Basalt foundation plinth grounded into bedrock (world Y = -6.0m to +2.0m -> archGroup Y = -19.5m)
      const plinthH = 8.0;
      const plinth = new THREE.Mesh(this.getCylinder(3.6, 4.4, plinthH, 6), this.volcanicBasaltMat);
      plinth.position.set(pylonX, -2.0 - 17.5, 0);
      archGroup.add(plinth);

      // Magma splash ring at lava ocean level (world Y = -3.20m)
      const plinthSplash = new THREE.Mesh(this.getTorus(4.5, 0.28, 6, 12), this.splashMat);
      plinthSplash.rotation.x = Math.PI / 2;
      plinthSplash.position.set(pylonX, -3.20 - 17.5, 0);
      archGroup.add(plinthSplash);

      // 2. Stepped hexagonal columnar basalt pylon shaft (world Y = 2.0m to 25.0m -> archGroup Y = -4.0m)
      const pylonH = 23.0;
      const pylon = new THREE.Mesh(this.getCylinder(2.4, 3.4, pylonH, 6), this.blackObsidianMat);
      pylon.position.set(pylonX, 13.5 - 17.5, 0);
      archGroup.add(pylon);

      // Incandescent vertical magma fissure climbing up inner pylon facet
      const fissureH = 20.0;
      const fissure = new THREE.Mesh(this.getCylinder(0.2, 0.2, fissureH, 4), this.moltenMagmaMat);
      fissure.position.set(pylonX - side * 2.3, 13.5 - 17.5, 0);
      archGroup.add(fissure);

      // Glowing molten thermal expansion collars
      [-11.5, 0.5].forEach((cy) => {
        const collar = new THREE.Mesh(this.getBox(3.6, 0.5, 4.2), this.moltenMagmaMat);
        collar.position.set(pylonX, cy, 0);
        archGroup.add(collar);
      });

      // Pylon summit suspension cable saddle at world Y = 25.5m (archGroup Y = 8.0m)
      const saddle = new THREE.Mesh(this.getBox(3.0, 2.0, 4.4), this.titaniumArmorMat);
      saddle.position.set(pylonX, 8.0, 0);
      archGroup.add(saddle);

      // Heavy diagonal suspension stay cables anchored from saddle down to deck truss
      const stayCable = new THREE.Mesh(this.getCylinder(0.12, 0.12, 11.0, 4), this.scorchedIronMat);
      stayCable.position.set(side * 12.75, 4.5, 0);
      stayCable.rotation.z = side * 0.88;
      archGroup.add(stayCable);
    });

    // Main titanium armor suspension arch span beam (width 36.0m, world Y = 17.5m)
    const archSpan = new THREE.Mesh(this.getBox(36.0, 1.8, 4.2), this.titaniumArmorMat);
    archGroup.add(archSpan);

    // Glowing molten magma soffit trim
    const archTrim = new THREE.Mesh(this.getBox(36.2, 0.45, 4.4), this.moltenMagmaMat);
    archTrim.position.y = -0.9;
    archGroup.add(archTrim);

    // Scorched iron upper truss crown
    const archCrown = new THREE.Mesh(this.getBox(36.0, 0.6, 3.6), this.scorchedIronMat);
    archCrown.position.y = 1.2;
    archGroup.add(archCrown);

    districtD.add(archGroup);

    // 5. Giant Magma Waterfall Canyon (Roaring 29m molten cataract cascading into lava sea)
    const canyonGroup = new THREE.Group();
    canyonGroup.position.set(-curbEdge - 34.0, 0, -chunkLength * 0.75);

    // Massive stepped canyon cliff wall grounded down into bedrock: Y = -6.0m to +28.0m (height 34m)
    const canyonWallH = 34.0;
    const canyonWall = new THREE.Mesh(this.getBox(16.0, canyonWallH, 22.0), this.volcanicBasaltMat);
    canyonWall.position.set(-4.0, -6.0 + canyonWallH * 0.5, 0);
    canyonGroup.add(canyonWall);

    // Roaring Molten Magma Waterfall Sheet
    const cataractH = 29.0;
    const cataract = new THREE.Mesh(this.getBox(7.0, cataractH, 1.4), this.moltenMagmaMat);
    cataract.position.set(0, -3.25 + cataractH * 0.5, 0);
    canyonGroup.add(cataract);

    // Magma splash rings at plunge base in the lava sea
    const cataractSplashRings: THREE.Mesh[] = [];
    for (let r = 0; r < 2; r++) {
      const ring = new THREE.Mesh(this.getTorus(5.5, 0.35, 6, 16), this.ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, -3.20, 0);
      canyonGroup.add(ring);
      cataractSplashRings.push(ring);
    }

    districtD.add(canyonGroup);
    director.registerLavaWaterfall(cataract, cataractSplashRings, 1.35, 3.0);

    // 6. Supported Volcanic Skybridge (Monumental Warren-truss skybridge spanning high across at Y = 18.0m)
    const skybridgeGroup = new THREE.Group();
    skybridgeGroup.name = 'volcanic_skybridge';
    skybridgeGroup.position.set(0, 18.0, -chunkLength * 0.25);

    // Double-Deck Warren-Truss Skybridge Span (width 40.0m, height 3.2m, depth 4.8m)
    const trussSpan = new THREE.Mesh(this.getBox(40.0, 3.2, 4.8), this.titaniumArmorMat);
    skybridgeGroup.add(trussSpan);

    // Molten Magma Transport Conduits along the Skybridge
    const skybridgePipe = new THREE.Mesh(this.getCylinder(0.9, 0.9, 40.0, 8), this.moltenMagmaMat);
    skybridgePipe.rotation.z = Math.PI / 2;
    skybridgePipe.position.y = 1.6;
    skybridgeGroup.add(skybridgePipe);

    // Flanking diagonal battered raked support pylons grounded down into canyon bedrock ledges at |X| = 17.5m
    [-1, 1].forEach((side) => {
      const pX = side * 17.5;
      const pylonH = 24.0;
      const pylon = new THREE.Mesh(this.getBox(2.2, pylonH, 2.8), this.scorchedIronMat);
      pylon.position.set(pX, -18.0 + pylonH * 0.5, 0);
      pylon.rotation.z = -side * 0.12;
      skybridgeGroup.add(pylon);

      const beacon = new THREE.Mesh(this.getSphere(0.45, 8), this.rubyInsulatorMat);
      beacon.position.set(pX, 3.2, 0);
      skybridgeGroup.add(beacon);
    });

    districtD.add(skybridgeGroup);
  }

  // =========================================================================
  // COMPLETE STANDALONE SHOWCASE VOLCANIC LOCOMOTIVE
  // Matching exact standard runner envelope (2.6m x 4.5m x 22.4m)
  // =========================================================================

  public buildInfernoExpressShowcaseTrain(x: number = 0, y: number = 0, z: number = 0): THREE.Group {
    const train = new THREE.Group();
    train.name = 'inferno_express_showcase_locomotive';
    train.position.set(x, y, z);

    // Main Armored Body (Heat-resistant black obsidian & titanium, width 2.4m)
    const body = new THREE.Mesh(this.getBox(2.4, 2.2, 21.0), this.blackObsidianMat);
    body.position.y = 1.8;
    train.add(body);

    // Heavy Angled Cowcatcher (width ~1.8m)
    const cowcatcher = new THREE.Mesh(this.getCylinder(0.2, 0.75, 1.8, 4), this.moltenMagmaMat);
    cowcatcher.rotation.y = Math.PI / 4;
    cowcatcher.position.set(0, 1.1, -10.8);
    train.add(cowcatcher);

    // Radiant Glowing Firebox Engine Core
    const firebox = new THREE.Mesh(this.getCylinder(0.95, 0.95, 12.0, 12), this.furnaceFireMat);
    firebox.rotation.x = Math.PI / 2;
    firebox.position.set(0, 2.6, -3.0);
    train.add(firebox);

    // Armored Heat Deflector Hood over Firebox
    const hood = new THREE.Mesh(this.getBox(2.44, 0.4, 13.0), this.titaniumArmorMat);
    hood.position.set(0, 3.7, -3.0);
    train.add(hood);

    // Heavy Twin Smokestacks
    [-7.5, -4.5].forEach((cz) => {
      const stack = new THREE.Mesh(this.getCylinder(0.28, 0.22, 1.0, 8), this.scorchedIronMat);
      stack.position.set(0, 3.5, cz);
      train.add(stack);
    });

    // Side Molten-Orange Radiator Cooling Fins
    [-1.22, 1.22].forEach((fx) => {
      [-6.0, 0, 6.0].forEach((fz) => {
        const fin = new THREE.Mesh(this.getBox(0.08, 0.8, 2.2), this.moltenMagmaMat);
        fin.position.set(fx, 1.8, fz);
        train.add(fin);
      });
    });

    // Glowing Amber Windows
    [-1.21, 1.21].forEach((wx) => {
      const winStrip = new THREE.Mesh(this.getBox(0.08, 0.65, 16.0), this.furnaceFireMat);
      winStrip.position.set(wx, 2.4, 1.0);
      train.add(winStrip);
    });

    // Heavy Industrial Wheel Bogies
    [-1.1, 1.1].forEach((bx) => {
      [-8.5, -5.5, -2.5, 2.5, 5.5, 8.5].forEach((wz) => {
        const wheel = new THREE.Mesh(this.getCylinder(0.48, 0.48, 0.22, 12), this.scorchedIronMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(bx, 0.48, wz);
        train.add(wheel);

        const rim = new THREE.Mesh(this.getCylinder(0.2, 0.2, 0.25, 8), this.moltenMagmaMat);
        rim.rotation.z = Math.PI / 2;
        rim.position.set(bx, 0.48, wz);
        train.add(rim);
      });
    });

    return train;
  }
}
