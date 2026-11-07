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
    const key = 'inferno_lava_ocean_convective_v6';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // 1. Incandescent Molten Magma Gradient Base
    const lavaGrad = ctx.createLinearGradient(0, 0, size, size);
    lavaGrad.addColorStop(0.0, '#ffffff');  // White-hot incandescent core
    lavaGrad.addColorStop(0.15, '#fef08a'); // Brilliant molten gold
    lavaGrad.addColorStop(0.35, '#f97316'); // Radiant fiery orange
    lavaGrad.addColorStop(0.65, '#ea580c'); // Deep churning lava
    lavaGrad.addColorStop(0.85, '#b91c1c'); // Searing crimson magma
    lavaGrad.addColorStop(1.0, '#5c1111');  // Deep volcanic crust
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, 0, size, size);

    // 2. Polygonal Cooling Basalt Crust Plates
    ctx.fillStyle = '#1c1619';
    const plates = [
      [24, 24, 105, 80],
      [155, 18, 125, 90],
      [310, 28, 95, 75],
      [425, 15, 75, 95],
      [30, 135, 125, 105],
      [190, 130, 120, 100],
      [340, 135, 140, 90],
      [18, 275, 95, 100],
      [135, 265, 135, 115],
      [295, 260, 115, 105],
      [430, 255, 70, 120],
      [25, 405, 120, 85],
      [175, 410, 110, 80],
      [310, 395, 115, 95],
      [445, 405, 55, 85]
    ];

    plates.forEach(([px, py, pw, ph], idx) => {
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 14);
      ctx.fill();

      // Basalt crust shading & cooling rims
      ctx.strokeStyle = '#382b30';
      ctx.lineWidth = 3.2;
      ctx.stroke();

      // Stress fractures glowing through cooling crust
      ctx.strokeStyle = idx % 2 === 0 ? '#f97316' : '#ea580c';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(px + pw * 0.22, py + ph * 0.18);
      ctx.lineTo(px + pw * 0.52, py + ph * 0.52);
      ctx.lineTo(px + pw * 0.82, py + ph * 0.82);
      ctx.stroke();
    });

    // 3. Blazing Convective Molten Fissures between plates
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2.4;
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 12;

    const fissures = [
      [[0, 118], [140, 122], [180, 128], [320, 118], [512, 122]],
      [[0, 252], [130, 248], [175, 256], [300, 248], [425, 252], [512, 248]],
      [[0, 392], [150, 398], [285, 388], [430, 398], [512, 388]],
      [[145, 0], [140, 122], [130, 248], [150, 398], [145, 512]],
      [[295, 0], [320, 118], [300, 248], [285, 388], [305, 512]],
      [[425, 0], [420, 118], [425, 252], [430, 398], [435, 512]]
    ];

    fissures.forEach((pts) => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.stroke();
    });

    ctx.shadowBlur = 0;

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 12);
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
    const ctx = canvas.getContext('2d')!;

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
        this.buildLavaSeaDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 1:
        this.buildObsidianCitadelDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 2:
        this.buildMagmaFoundryDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 3:
      default:
        this.buildAshfallSummitDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
    }
  }

  /**
   * Monumental Viaduct Bridge Piers beneath the railway tracks extending deep into the lava sea.
   * Proves the railway is an engineered viaduct traversing the boiling molten ocean.
   * Strictly Y <= 0.0m to guarantee 0 intrusions into the playable corridor.
   */
  private addViaductBridgePiers(districtGroup: THREE.Group, roadbedWidth: number, chunkLength: number): void {
    const pierH = 7.6;
    const corbelH = 1.2;
    for (let z = 14; z < chunkLength; z += 28) {
      const pierGroup = new THREE.Group();
      pierGroup.position.set(0, 0, -z);

      // Central monumental octagonal basalt viaduct column under tracks: Y in [-8.2m, -0.6m]
      const pierMesh = new THREE.Mesh(this.getCylinder(3.4, 5.0, pierH, 8), this.blackObsidianMat);
      pierMesh.position.y = -0.6 - pierH * 0.5;
      pierGroup.add(pierMesh);

      // Arched corbel capital supporting roadbed: Y in [-1.2m, 0.0m]
      const corbel = new THREE.Mesh(this.getBox(roadbedWidth + 2.0, corbelH, 4.8), this.titaniumArmorMat);
      corbel.position.y = -corbelH * 0.5;
      pierGroup.add(corbel);

      // Side arched buttresses bracing the pier against molten currents
      [-1, 1].forEach((side) => {
        const buttress = new THREE.Mesh(this.getBox(1.8, 4.8, 3.2), this.volcanicBasaltMat);
        buttress.position.set(side * (roadbedWidth * 0.5 - 0.4), -3.2, 0);
        pierGroup.add(buttress);
      });

      // Molten wake / splash ring where pier penetrates the boiling lava sea at Y = -3.25m
      const splash = new THREE.Mesh(
        this.getTorus(5.6, 0.35, 6, 16),
        this.splashMat
      );
      splash.rotation.x = Math.PI / 2;
      splash.position.y = -3.25;
      pierGroup.add(splash);

      districtGroup.add(pierGroup);
    }
  }

  /**
   * Vast boiling molten lava ocean spanning 340m across entire world below viaduct at Y = -3.25m.
   */
  private addBoilingLavaOcean(districtGroup: THREE.Group, chunkLength: number): void {
    const lavaOcean = new THREE.Mesh(
      this.getPlane(340.0, chunkLength + 10.0, 8, 16),
      this.lavaOceanMat
    );
    lavaOcean.rotation.x = -Math.PI / 2;
    lavaOcean.position.set(0, -3.25, -chunkLength * 0.5);
    districtGroup.add(lavaOcean);
  }

  /**
   * Narrow Viaduct Safety Promenade (Width 2.4m, alongside tracks) with cantilever brackets,
   * molten magma channel curb, and wrought-iron ruby-finial balustrades.
   * Ensures 100% open panoramic sightlines from the running corridor down into the boiling lava sea.
   */
  private addViaductPromenadeAndCurb(districtGroup: THREE.Group, roadbedWidth: number, chunkLength: number): void {
    const curbEdge = roadbedWidth * 0.5 + 0.5; // 6.5m

    [-1, 1].forEach((side) => {
      // Narrow Viaduct Safety Promenade (Width 2.4m, strictly alongside tracks)
      const walkW = 2.4;
      const wx = side * (curbEdge + walkW * 0.5); // side * 7.7m
      const walkH = 0.55;
      const walk = new THREE.Mesh(this.getBox(walkW, walkH, chunkLength), this.titaniumArmorMat);
      walk.position.set(wx, -0.25, -chunkLength * 0.5);
      districtGroup.add(walk);

      // Cantilevered triangular obsidian/iron corbel brackets anchoring walkway to viaduct
      for (let bz = 8; bz < chunkLength; bz += 16) {
        const bracket = new THREE.Mesh(this.getBox(walkW + 0.4, 2.2, 1.2), this.scorchedIronMat);
        bracket.position.set(wx, -1.35, -bz);
        districtGroup.add(bracket);
      }

      // Searing Molten Magma Channel Curb (Grounded from Y = -2.5m to +0.85m) at X = side * 6.74m
      const curbH = 3.35;
      const curb = new THREE.Mesh(this.getBox(0.48, curbH, chunkLength), this.moltenMagmaMat);
      curb.position.set(side * (curbEdge + 0.24), 0.85 - curbH * 0.5, -chunkLength * 0.5);
      districtGroup.add(curb);

      // Volcanic Wrought-Iron Safety Balustrade along outer edge of walkway (at X = side * 8.85m)
      for (let rz = 4; rz < chunkLength; rz += 8) {
        // Stanchion Post
        const stanchion = new THREE.Mesh(this.getCylinder(0.08, 0.12, 1.2, 6), this.scorchedIronMat);
        stanchion.position.set(side * (curbEdge + 2.35), 0.60, -rz);
        districtGroup.add(stanchion);

        // Glowing Ruby Heat-Insulator Finial
        const finial = new THREE.Mesh(this.getSphere(0.14, 6), this.rubyInsulatorMat);
        finial.position.set(side * (curbEdge + 2.35), 1.25, -rz);
        districtGroup.add(finial);
      }

      // Horizontal Guard Rail
      const railH = new THREE.Mesh(this.getCylinder(0.04, 0.04, chunkLength, 4), this.scorchedIronMat);
      railH.rotation.x = Math.PI / 2;
      railH.position.set(side * (curbEdge + 2.35), 1.05, -chunkLength * 0.5);
      districtGroup.add(railH);
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
    director: InfernoExpressEventDirector
  ): void {
    const districtA = new THREE.Group();
    districtA.name = 'district_a_lava_sea';
    group.add(districtA);

    const curbEdge = roadbedWidth * 0.5 + 0.5; // ~6.5m

    // 1. Boiling Molten Lava Ocean & Monumental Viaduct Infrastructure
    this.addBoilingLavaOcean(districtA, chunkLength);
    this.addViaductBridgePiers(districtA, roadbedWidth, chunkLength);
    this.addViaductPromenadeAndCurb(districtA, roadbedWidth, chunkLength);

    // 2. Floating semi-solidified obsidian crust plates drifting across the lava ocean
    [-1, 1].forEach((side) => {
      [0.25, 0.55, 0.85].forEach((ratio, idx) => {
        const crustW = 12.0 + (idx % 2) * 4.0;
        const crustD = 14.0 + (idx % 3) * 3.0;
        const crustPlate = new THREE.Mesh(this.getBox(crustW, 0.35, crustD), this.blackObsidianMat);
        crustPlate.position.set(side * (curbEdge + 16.0 + idx * 4.0), -3.15, -chunkLength * ratio);
        districtA.add(crustPlate);

        // Glowing molten stress fissures through floating crust
        const fissure = new THREE.Mesh(this.getBox(crustW * 0.7, 0.4, 0.8), this.moltenMagmaMat);
        fissure.position.set(side * (curbEdge + 16.0 + idx * 4.0), -3.12, -chunkLength * ratio);
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
    fallGroup.position.set(curbEdge + 34.0, 0, -chunkLength * 0.5);

    // Natural Basalt Cliff Face behind the waterfall (grounded Y = -6.0m to +24.0m)
    const cliffH = 30.0;
    const cliffBack = new THREE.Mesh(this.getBox(14.0, cliffH, 18.0), this.volcanicBasaltMat);
    cliffBack.position.set(4.0, -6.0 + cliffH * 0.5, 0);
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
    geyser.position.set(-curbEdge - 28.0, -6.0, -chunkLength * 0.35);
    geyser.visible = false;
    districtA.add(geyser);

    const geyserSpray = new THREE.Mesh(this.getSphere(2.5, 8), this.furnaceFireMat);
    geyserSpray.position.set(-curbEdge - 28.0, 0, -chunkLength * 0.35);
    geyserSpray.visible = false;
    districtA.add(geyserSpray);

    director.registerLavaGeyser(geyser, geyserSpray, -3.5, 22.0, 8.0);

    // 6. Distant Erupting Volcano Cone with Sweeping Lava Ridges (Z = -chunkLength * 0.85, X = 58m)
    if (detail !== 'MINIMAL') {
      const volcanoGroup = new THREE.Group();
      volcanoGroup.position.set(58.0, 0, -chunkLength * 0.85);

      const mtnH = 48.0;
      const mountain = new THREE.Mesh(this.getCylinder(6.5, 30.0, mtnH, 12), this.volcanicBasaltMat);
      mountain.position.y = -6.0 + mtnH * 0.5;
      volcanoGroup.add(mountain);

      // Glowing Crater Caldera
      const crater = new THREE.Mesh(this.getCylinder(6.0, 6.0, 2.5, 12), this.furnaceFireMat);
      crater.position.y = -6.0 + mtnH;
      volcanoGroup.add(crater);

      // Cascading Molten Lava Rivers down the volcano cone
      const vRiver = new THREE.Mesh(this.getBox(3.5, mtnH * 0.7, 1.5), this.moltenMagmaMat);
      vRiver.position.set(0, -6.0 + mtnH * 0.45, 14.5);
      vRiver.rotation.x = 0.55;
      volcanoGroup.add(vRiver);

      // Volcanic Eruption Ash Plume
      const plume = new THREE.Mesh(this.getSphere(10.0, 10), this.volcanicSmokeMat);
      plume.position.y = -6.0 + mtnH + 10.0;
      plume.visible = false;
      volcanoGroup.add(plume);

      director.registerVolcano(crater, plume, undefined, 10.0);
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
    director: InfernoExpressEventDirector
  ): void {
    const districtB = new THREE.Group();
    districtB.name = 'district_b_obsidian_citadel';
    group.add(districtB);

    const curbEdge = roadbedWidth * 0.5 + 0.5; // ~6.5m

    // 1. Boiling Molten Lava Ocean & Monumental Viaduct Infrastructure
    this.addBoilingLavaOcean(districtB, chunkLength);
    this.addViaductBridgePiers(districtB, roadbedWidth, chunkLength);
    this.addViaductPromenadeAndCurb(districtB, roadbedWidth, chunkLength);

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

    // 3. Citadel Blast Furnace Gate with Animated Sliding Doors (spanning high above track at Y = 17.5m)
    const gateGroup = new THREE.Group();
    gateGroup.name = 'citadel_furnace_blast_gate';
    gateGroup.position.set(0, 17.5, -chunkLength * 0.5);

    // Towering monumental Gothic Bastion Gate Towers grounded into volcanic bedrock (|X| = 16.5m)
    [-1, 1].forEach((side) => {
      const towerX = side * 16.5;

      // 1. Foundation Plinth grounded into volcanic bedrock (world Y = -6.0m to +2.0m -> gateGroup Y = -19.5m)
      const plinthH = 8.0;
      const plinth = new THREE.Mesh(this.getCylinder(3.2, 4.0, plinthH, 8), this.volcanicBasaltMat);
      plinth.position.set(towerX, -2.0 - 17.5, 0);
      gateGroup.add(plinth);

      // Magma splash ring at boiling lava ocean surface (world Y = -3.20m)
      const plinthSplash = new THREE.Mesh(this.getTorus(4.1, 0.25, 6, 12), this.splashMat);
      plinthSplash.rotation.x = Math.PI / 2;
      plinthSplash.position.set(towerX, -3.20 - 17.5, 0);
      gateGroup.add(plinthSplash);

      // 2. Sculpted Gothic Iron Pier Shaft (world Y = 2.0m to 22.0m, height 20.0m -> gateGroup Y = -5.5m)
      const shaftH = 20.0;
      const shaft = new THREE.Mesh(this.getBox(3.8, shaftH, 4.6), this.scorchedIronMat);
      shaft.position.set(towerX, 12.0 - 17.5, 0);
      gateGroup.add(shaft);

      // Outer stabilizing buttress fin facing away from track
      const fin = new THREE.Mesh(this.getBox(1.2, 18.0, 3.0), this.blackObsidianMat);
      fin.position.set(towerX + side * 1.8, 11.0 - 17.5, 0);
      gateGroup.add(fin);

      // Glowing Molten Magma Tier Belts across the tower shaft
      [-13.5, -4.5, 3.5].forEach((trimY) => {
        const belt = new THREE.Mesh(this.getBox(4.0, 0.5, 4.8), this.moltenMagmaMat);
        belt.position.set(towerX, trimY, 0);
        gateGroup.add(belt);
      });

      // Ancient Fire Rune Tablet facing the railway viaduct
      const runeTablet = new THREE.Mesh(this.getPlane(3.2, 6.0), this.runeMat);
      runeTablet.position.set(towerX - side * 1.95, -5.5, 0);
      runeTablet.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      gateGroup.add(runeTablet);

      // Parapet Merlons at world Y = 22.5m (gateGroup Y = 5.0m)
      const parapet = new THREE.Mesh(this.getBox(4.2, 1.2, 5.0), this.volcanicBasaltMat);
      parapet.position.set(towerX, 5.0, 0);
      gateGroup.add(parapet);

      // Tower Summit Flaming Fire-Brazier at world Y = 23.5m (gateGroup Y = 6.0m)
      const brazier = new THREE.Mesh(this.getCylinder(1.2, 0.6, 1.2, 8), this.furnaceFireMat);
      brazier.position.set(towerX, 6.0, 0);
      gateGroup.add(brazier);

      // Flying Buttress diagonal brace angled inward toward the high arch ring
      const strut = new THREE.Mesh(this.getBox(1.0, 7.5, 1.2), this.scorchedIronMat);
      strut.position.set(side * 12.5, 0.5, 0);
      strut.rotation.z = side * 0.60;
      gateGroup.add(strut);
    });

    // Pointed Gothic Gable Arch Truss spanning across the viaduct (width 34.0m, world Y = 20.7m)
    const archGable = new THREE.Mesh(this.getBox(34.0, 1.6, 4.2), this.scorchedIronMat);
    archGable.position.y = 3.2;
    gateGroup.add(archGable);

    // Glowing Magma Arch Soffit Trim
    const archMagmaTrim = new THREE.Mesh(this.getBox(34.2, 0.45, 4.4), this.moltenMagmaMat);
    archMagmaTrim.position.y = 2.4;
    gateGroup.add(archMagmaTrim);

    // Central Gothic Pediment Crest at Y = 4.8m
    const pediment = new THREE.Mesh(this.getBox(10.0, 1.8, 4.0), this.titaniumArmorMat);
    pediment.position.y = 4.8;
    gateGroup.add(pediment);

    const runeCrest = new THREE.Mesh(this.getPlane(4.0, 2.0), this.runeMat);
    runeCrest.position.set(0, 4.8, 2.05);
    gateGroup.add(runeCrest);

    // Animated Furnace Chamber Interior Glow
    const interiorGlow = new THREE.Mesh(this.getPlane(8.0, 5.0), this.furnaceFireMat);
    interiorGlow.position.set(0, 0, -0.4);
    gateGroup.add(interiorGlow);

    // Heavy Armored Heat-Resistant Titanium Sliding Blast Doors
    const leftDoor = new THREE.Mesh(this.getBox(4.2, 5.5, 0.8), this.titaniumArmorMat);
    leftDoor.position.set(-2.1, 0, 0);
    gateGroup.add(leftDoor);

    const rightDoor = new THREE.Mesh(this.getBox(4.2, 5.5, 0.8), this.titaniumArmorMat);
    rightDoor.position.set(2.1, 0, 0);
    gateGroup.add(rightDoor);

    director.registerBlastDoors(leftDoor, rightDoor, interiorGlow, 3.2);
    districtB.add(gateGroup);
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
    director: InfernoExpressEventDirector
  ): void {
    const districtC = new THREE.Group();
    districtC.name = 'district_c_magma_foundry';
    group.add(districtC);

    const curbEdge = roadbedWidth * 0.5 + 0.5; // ~6.5m

    // 1. Boiling Molten Lava Ocean & Monumental Viaduct Infrastructure
    this.addBoilingLavaOcean(districtC, chunkLength);
    this.addViaductBridgePiers(districtC, roadbedWidth, chunkLength);
    this.addViaductPromenadeAndCurb(districtC, roadbedWidth, chunkLength);

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
      });

      // Feeder down-tubes connecting to furnaces
      [-1, 1].forEach((side) => {
        const dropTube = new THREE.Mesh(this.getCylinder(0.75, 0.75, 8.0, 6), this.titaniumArmorMat);
        dropTube.position.set(side * (roadbedWidth * 0.5 + 8.5), -4.0, 0);
        pipeGroup.add(dropTube);
      });

      districtC.add(pipeGroup);
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
    director: InfernoExpressEventDirector
  ): void {
    const districtD = new THREE.Group();
    districtD.name = 'district_d_ashfall_summit';
    group.add(districtD);

    const curbEdge = roadbedWidth * 0.5 + 0.5; // ~6.5m

    // 1. Boiling Molten Lava Ocean & Monumental Viaduct Infrastructure
    this.addBoilingLavaOcean(districtD, chunkLength);
    this.addViaductBridgePiers(districtD, roadbedWidth, chunkLength);
    this.addViaductPromenadeAndCurb(districtD, roadbedWidth, chunkLength);

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
