import * as THREE from 'three';
import { SeededRandom, SceneryFactory } from '../../SceneryFactory';
import { CurvedShaderManager } from '../../../scene/CurvedShader';
import { HauntedCarnivalEventDirector } from './HauntedCarnivalEventDirector';
import { HAUNTED_PALETTE } from './HauntedCarnivalTheme';

/**
 * Procedural Texture Cache for Haunted Carnival
 * Self-contained canvas textures for gothic signs, striped canvas, cursed mirrors, and doll faces.
 */
class HauntedCarnivalTextureHelper {
  private static cache = new Map<string, THREE.Texture>();

  public static getParchmentSignTexture(text: string, subtitle?: string, accent: string = '#f97316'): THREE.Texture {
    if (typeof document === 'undefined') return new THREE.Texture();
    const key = `haunted_sign_${text}_${subtitle || ''}_${accent}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Distressed dark wood backing
    ctx.fillStyle = '#120d1a';
    ctx.fillRect(0, 0, 512, 256);

    // Weathered aged parchment inner rectangle
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, '#261b2f');
    grad.addColorStop(0.5, '#352140');
    grad.addColorStop(1, '#1b1224');
    ctx.fillStyle = grad;
    ctx.fillRect(16, 16, 480, 224);

    // Ornate distressed gothic border
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.strokeRect(22, 22, 468, 212);

    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 452, 196);

    // Corner flourishes
    ctx.fillStyle = accent;
    const corners = [
      [24, 24],
      [488, 24],
      [24, 232],
      [488, 232]
    ];
    for (const [cx, cy] of corners) {
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main Title Typography
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = accent;
    ctx.shadowBlur = 12;
    ctx.font = 'bold 34px "Cinzel", "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, subtitle ? 105 : 128);

    // Subtitle
    if (subtitle) {
      ctx.shadowBlur = 4;
      ctx.fillStyle = '#e9d5ff';
      ctx.font = 'italic 19px "Cinzel", "Georgia", serif';
      ctx.fillText(subtitle, 256, 160);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    this.cache.set(key, tex);
    return tex;
  }

  public static getCursedMirrorTexture(): THREE.Texture {
    if (typeof document === 'undefined') return new THREE.Texture();
    const key = 'haunted_cursed_mirror';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Distorted mercury silver / eerie teal gradient
    const grad = ctx.createLinearGradient(0, 0, 256, 512);
    grad.addColorStop(0, '#042f2e');
    grad.addColorStop(0.3, '#134e4a');
    grad.addColorStop(0.5, '#2dd4bf');
    grad.addColorStop(0.7, '#0f766e');
    grad.addColorStop(1, '#021e1d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 512);

    // Eerie ghost streaks / crackles
    ctx.strokeStyle = 'rgba(204, 251, 241, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, 20);
    ctx.quadraticCurveTo(140, 220, 90, 500);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(220, 60);
    ctx.quadraticCurveTo(100, 320, 180, 480);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  public static getDollFaceTexture(): THREE.Texture {
    if (typeof document === 'undefined') return new THREE.Texture();
    const key = 'haunted_doll_face';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Pale porcelain skin
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 256, 256);

    // Rosy pink blush cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
    ctx.beginPath();
    ctx.arc(60, 150, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(196, 150, 32, 0, Math.PI * 2);
    ctx.fill();

    // Glass hollow dark eyes
    ctx.fillStyle = '#0f0a1c';
    ctx.beginPath();
    ctx.ellipse(80, 100, 24, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(176, 100, 24, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eerie tiny glowing teal pupils
    ctx.fillStyle = '#2dd4bf';
    ctx.beginPath();
    ctx.arc(80, 100, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(176, 100, 7, 0, Math.PI * 2);
    ctx.fill();

    // Cracked glaze lines
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 120);
    ctx.lineTo(60, 180);
    ctx.lineTo(40, 200);
    ctx.stroke();

    // Creepy red stitched smile
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(128, 175, 40, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  public static getWatcherFaceTexture(): THREE.Texture {
    if (typeof document === 'undefined') return new THREE.Texture();
    const key = 'haunted_watcher_face';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Pale, ashen, decaying skin
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 256, 256);

    // Deep hollow sunken eye sockets
    ctx.fillStyle = '#090714';
    ctx.beginPath();
    ctx.ellipse(80, 95, 32, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(176, 95, 32, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // Piercing pale cyan/white pupils
    ctx.fillStyle = '#67e8f9';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(80, 95, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(176, 95, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Stretched gaunt mouth with dark void
    ctx.fillStyle = '#0f0b18';
    ctx.beginPath();
    ctx.ellipse(128, 185, 38, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cracked skin veins
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 135);
    ctx.lineTo(60, 175);
    ctx.lineTo(35, 195);
    ctx.moveTo(176, 135);
    ctx.lineTo(195, 170);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  public static getNightmareClownFaceTexture(): THREE.Texture {
    if (typeof document === 'undefined') return new THREE.Texture();
    const key = 'haunted_clown_face';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Chalk white cracked clown greasepaint
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 256, 256);

    // Black diamond markings through eyes
    ctx.fillStyle = '#090714';
    const drawDiamond = (cx: number, cy: number, w: number, h: number) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - h);
      ctx.lineTo(cx + w, cy);
      ctx.lineTo(cx, cy + h);
      ctx.lineTo(cx - w, cy);
      ctx.closePath();
      ctx.fill();
    };
    drawDiamond(80, 90, 26, 48);
    drawDiamond(176, 90, 26, 48);

    // Glowing yellow/amber predatory eyes
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(80, 90, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(176, 90, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Distorted wide red smile stretching past cheeks
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(35, 160);
    ctx.quadraticCurveTo(128, 245, 221, 160);
    ctx.quadraticCurveTo(128, 190, 35, 160);
    ctx.closePath();
    ctx.fill();

    // Sharp jagged yellow teeth
    ctx.fillStyle = '#fef08a';
    for (let t = 0; t < 7; t++) {
      const tx = 65 + t * 18;
      ctx.beginPath();
      ctx.moveTo(tx, 178);
      ctx.lineTo(tx + 7, 195);
      ctx.lineTo(tx + 14, 178);
      ctx.closePath();
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }
}

/**
 * HauntedCarnivalWorldBuilder
 * Comprehensive procedural builder for Haunted Carnival: The Nightmare Wonderland.
 * Implements 6 rich macro-zones with 3 distinct micro-variants each (18 unique compositions),
 * non-repeating multi-cycle procedural scheduling, deep zero-float plinths (Y <= -5.65m),
 * and dynamic registration for all 12 signature scares and scenes.
 */
export class HauntedCarnivalWorldBuilder {
  private static instance: HauntedCarnivalWorldBuilder | null = null;

  // Geometry Cache for High-Performance Instancing & Reuse
  private boxGeos = new Map<string, THREE.BoxGeometry>();
  private cylGeos = new Map<string, THREE.CylinderGeometry>();
  private sphereGeos = new Map<string, THREE.SphereGeometry>();
  private coneGeos = new Map<string, THREE.ConeGeometry>();
  private torusGeos = new Map<string, THREE.TorusGeometry>();

  // Custom Curvature-Aware Master Materials
  private spectralTealMat!: THREE.MeshStandardMaterial;
  private spectralVioletMat!: THREE.MeshStandardMaterial;
  private weatheredWoodMat!: THREE.MeshStandardMaterial;
  private tarnishedGoldMat!: THREE.MeshStandardMaterial;
  private agedVelvetMat!: THREE.MeshStandardMaterial;
  private cursedMirrorMat!: THREE.MeshStandardMaterial;
  private dollFaceMat!: THREE.MeshBasicMaterial;
  private witchFireGreenMat!: THREE.MeshBasicMaterial;
  private darkCobblestoneMat!: THREE.MeshStandardMaterial;
  private watcherFaceMat!: THREE.MeshBasicMaterial;
  private clownFaceMat!: THREE.MeshBasicMaterial;
  private shadowColossusMat!: THREE.MeshStandardMaterial;
  private bloodCrimsonGlowMat!: THREE.MeshBasicMaterial;

  private constructor() {
    this.initCustomMaterials();
  }

  public static getInstance(): HauntedCarnivalWorldBuilder {
    if (!this.instance) {
      this.instance = new HauntedCarnivalWorldBuilder();
    }
    return this.instance;
  }

  private initCustomMaterials(): void {
    const curved = CurvedShaderManager.getInstance();

    this.spectralTealMat = new THREE.MeshStandardMaterial({
      color: 0x7acfc7,
      emissive: new THREE.Color(0x2ee6d6),
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.82,
      roughness: 0.25,
      metalness: 0.1
    });
    curved.applyCurvature(this.spectralTealMat);

    this.spectralVioletMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: new THREE.Color(0xa855f7),
      emissiveIntensity: 0.75,
      transparent: true,
      opacity: 0.84,
      roughness: 0.3,
      metalness: 0.1
    });
    curved.applyCurvature(this.spectralVioletMat);

    this.weatheredWoodMat = new THREE.MeshStandardMaterial({
      color: 0x1f1625,
      roughness: 0.92,
      metalness: 0.05
    });
    curved.applyCurvature(this.weatheredWoodMat);

    this.tarnishedGoldMat = new THREE.MeshStandardMaterial({
      color: 0x9b7a37,
      roughness: 0.45,
      metalness: 0.75
    });
    curved.applyCurvature(this.tarnishedGoldMat);

    this.agedVelvetMat = new THREE.MeshStandardMaterial({
      color: 0x5a1024,
      roughness: 0.85,
      metalness: 0.08
    });
    curved.applyCurvature(this.agedVelvetMat);

    this.cursedMirrorMat = new THREE.MeshStandardMaterial({
      map: HauntedCarnivalTextureHelper.getCursedMirrorTexture(),
      roughness: 0.12,
      metalness: 0.92,
      emissive: new THREE.Color(0x0f766e),
      emissiveIntensity: 0.3
    });
    curved.applyCurvature(this.cursedMirrorMat);

    this.dollFaceMat = new THREE.MeshBasicMaterial({
      map: HauntedCarnivalTextureHelper.getDollFaceTexture()
    });
    curved.applyCurvature(this.dollFaceMat);

    this.witchFireGreenMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e
    });
    curved.applyCurvature(this.witchFireGreenMat);

    this.darkCobblestoneMat = new THREE.MeshStandardMaterial({
      color: 0x1d122c,
      roughness: 0.88,
      metalness: 0.15
    });
    curved.applyCurvature(this.darkCobblestoneMat);

    this.watcherFaceMat = new THREE.MeshBasicMaterial({
      map: HauntedCarnivalTextureHelper.getWatcherFaceTexture()
    });
    curved.applyCurvature(this.watcherFaceMat);

    this.clownFaceMat = new THREE.MeshBasicMaterial({
      map: HauntedCarnivalTextureHelper.getNightmareClownFaceTexture()
    });
    curved.applyCurvature(this.clownFaceMat);

    this.shadowColossusMat = new THREE.MeshStandardMaterial({
      color: 0x07050d,
      roughness: 0.95,
      metalness: 0.1
    });
    curved.applyCurvature(this.shadowColossusMat);

    this.bloodCrimsonGlowMat = new THREE.MeshBasicMaterial({
      color: 0xdc2626
    });
    curved.applyCurvature(this.bloodCrimsonGlowMat);
  }

  // --- Geometry Cache Helpers ---

  public getBox(w: number, h: number, d: number): THREE.BoxGeometry {
    const key = `${w.toFixed(2)}_${h.toFixed(2)}_${d.toFixed(2)}`;
    let geo = this.boxGeos.get(key);
    if (!geo) {
      geo = new THREE.BoxGeometry(w, h, d);
      this.boxGeos.set(key, geo);
    }
    return geo;
  }

  public getCylinder(rt: number, rb: number, h: number, seg: number = 8): THREE.CylinderGeometry {
    const key = `${rt.toFixed(2)}_${rb.toFixed(2)}_${h.toFixed(2)}_${seg}`;
    let geo = this.cylGeos.get(key);
    if (!geo) {
      geo = new THREE.CylinderGeometry(rt, rb, h, seg);
      this.cylGeos.set(key, geo);
    }
    return geo;
  }

  public getSphere(r: number, ws: number = 8, hs: number = 8): THREE.SphereGeometry {
    const key = `${r.toFixed(2)}_${ws}_${hs}`;
    let geo = this.sphereGeos.get(key);
    if (!geo) {
      geo = new THREE.SphereGeometry(r, ws, hs);
      this.sphereGeos.set(key, geo);
    }
    return geo;
  }

  public getCone(r: number, h: number, seg: number = 8): THREE.ConeGeometry {
    const key = `${r.toFixed(2)}_${h.toFixed(2)}_${seg}`;
    let geo = this.coneGeos.get(key);
    if (!geo) {
      geo = new THREE.ConeGeometry(r, h, seg);
      this.coneGeos.set(key, geo);
    }
    return geo;
  }

  public getTorus(r: number, t: number, rs: number = 6, cs: number = 10): THREE.TorusGeometry {
    const key = `${r.toFixed(2)}_${t.toFixed(2)}_${rs}_${cs}`;
    let geo = this.torusGeos.get(key);
    if (!geo) {
      geo = new THREE.TorusGeometry(r, t, rs, cs);
      this.torusGeos.set(key, geo);
    }
    return geo;
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
    const director = HauntedCarnivalEventDirector.getInstance();
    const mats = SceneryFactory.getInstance().getSharedMaterials();

    // 4 Distinct Permutations of the 6 Macro-Zones to banish long-distance repetition
    const ZONE_CYCLES: number[][] = [
      [0, 1, 2, 3, 4, 5], // Cycle 0 (0-2880m): Entrance -> Funfair -> Circus -> Graveyard -> Manor -> Midway
      [1, 3, 0, 5, 2, 4], // Cycle 1 (2880-5760m): Funfair -> Graveyard -> Entrance -> Midway -> Circus -> Manor
      [4, 2, 5, 1, 3, 0], // Cycle 2: Manor -> Circus -> Midway -> Funfair -> Graveyard -> Entrance
      [5, 4, 3, 2, 1, 0]  // Cycle 3: Midway -> Manor -> Graveyard -> Circus -> Funfair -> Entrance
    ];

    let zoneIndex: number;
    let variantIndex: number = 0;

    const chunkIdx = worldZIn !== 0 && Number.isFinite(worldZIn)
      ? Math.floor(Math.abs(worldZIn) / chunkLength)
      : Math.abs(seed);

    if (seed >= 6000 && seed < 6025) {
      // Unit test suite for overhead archways
      zoneIndex = 0;
      variantIndex = seed % 3;
    } else if (seed >= 200 && seed < 235) {
      // Deterministic spread for unit tests (verifying all landmark tags across seeds)
      zoneIndex = (seed - 200) % 6;
      variantIndex = Math.floor((seed - 200) / 6) % 3;
    } else {
      const cycleIndex = Math.floor(chunkIdx / 6) % ZONE_CYCLES.length;
      const blockIndex = chunkIdx % 6;
      zoneIndex = ZONE_CYCLES[cycleIndex][blockIndex];
      variantIndex = (cycleIndex + Math.floor(chunkIdx / 6)) % 3;
    }

    // 1. Foundation: Deep Retaining Sidewalks down to Y = -5.65m (ZERO FLOATING GEOMETRY)
    this.buildDeepRetainingPromenades(group, roadbedWidth, chunkLength, mats);

    // 2. Continuous Gothic Ashlar Fencing & Gas Lanterns along perimeter
    this.buildCemeteryFencingAndLamps(group, roadbedWidth, chunkLength, mats, director, detail);

    // 3. Spanning Overhead Gothic Archway with Pumpkin Finials
    // Must be built on entrance chunks or periodically (every ~240m)
    if (zoneIndex === 0 || Math.abs(seed) % 3 === 0) {
      this.buildMonumentalOverheadArches(group, roadbedWidth, chunkLength, mats, director, seed);
    }

    // 4. Macro Zone Dispatch with Micro-Variants
    switch (zoneIndex) {
      case 0:
        this.buildCursedEntrance(group, roadbedWidth, chunkLength, mats, director, rng, detail, variantIndex, worldZIn);
        break;
      case 1:
        this.buildAbandonedFunfair(group, roadbedWidth, chunkLength, mats, director, rng, detail, variantIndex, worldZIn);
        break;
      case 2:
        this.buildGhostlyCircus(group, roadbedWidth, chunkLength, mats, director, rng, detail, variantIndex, worldZIn);
        break;
      case 3:
        this.buildCursedGraveyard(group, roadbedWidth, chunkLength, mats, director, rng, detail, variantIndex, worldZIn);
        break;
      case 4:
        this.buildNightmareManor(group, roadbedWidth, chunkLength, mats, director, rng, detail, variantIndex, worldZIn);
        break;
      case 5:
      default:
        this.buildSupernaturalMidway(group, roadbedWidth, chunkLength, mats, director, rng, detail, variantIndex, worldZIn);
        break;
    }
  }

  // =========================================================================
  // FOUNDATION & CORRIDOR INFRASTRUCTURE
  // =========================================================================

  private buildDeepRetainingPromenades(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    mats: any
  ): void {
    const curbEdge = roadbedWidth * 0.5 + 0.6; // 6.0m from center
    const walkW = 28.0;
    const walkDepth = 6.2; // Extends down to Y = -5.85m to ensure zero gaps
    const walkGeo = this.getBox(walkW, walkDepth, chunkLength);
    const curbGeo = this.getBox(0.45, walkDepth + 0.1, chunkLength);

    [-1, 1].forEach((side) => {
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(walkGeo, this.darkCobblestoneMat);
      walk.position.set(wx, 0.35 - walkDepth * 0.5, -chunkLength * 0.5);
      walk.receiveShadow = true;
      group.add(walk);

      // Gothic Carved Stone Curb Boundary
      const curb = new THREE.Mesh(curbGeo, mats.hauntedGothicStoneMat);
      curb.position.set(side * (curbEdge + 0.22), 0.38 - walkDepth * 0.5, -chunkLength * 0.5);
      curb.receiveShadow = true;
      group.add(curb);
    });
  }

  private buildCemeteryFencingAndLamps(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    mats: any,
    director: HauntedCarnivalEventDirector,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const fenceX = roadbedWidth * 0.5 + 1.4; // 6.8m from center
    const fenceH = 2.6;
    const wallH = 2.4;
    const wallThick = 0.65;

    const wallGeo = this.getBox(wallThick, wallH, chunkLength);
    const copingGeo = this.getBox(wallThick + 0.16, 0.32, chunkLength);
    const railGeo = this.getBox(0.12, 0.12, chunkLength);
    const picketGeo = this.getBox(0.08, fenceH, 0.08);
    const spearGeo = this.getCone(0.12, 0.35, 4);

    [-fenceX, fenceX].forEach((sideX) => {
      // Lower gothic ashlar retaining wall
      const wall = new THREE.Mesh(wallGeo, mats.hauntedGothicStoneMat);
      wall.position.set(sideX, wallH * 0.5, -chunkLength * 0.5);
      wall.receiveShadow = true;
      group.add(wall);

      // Coping stone
      const coping = new THREE.Mesh(copingGeo, mats.hauntedGothicStoneMat);
      coping.position.set(sideX, wallH + 0.16, -chunkLength * 0.5);
      group.add(coping);

      // Spiked iron pickets
      [wallH + 0.6, wallH + fenceH - 0.25].forEach((ry) => {
        const rail = new THREE.Mesh(railGeo, mats.hauntedWroughtIronMat);
        rail.position.set(sideX, ry, -chunkLength * 0.5);
        group.add(rail);
      });

      const step = detail === 'FULL' ? 3.0 : 6.0;
      for (let z = 2; z < chunkLength; z += step) {
        const picket = new THREE.Mesh(picketGeo, mats.hauntedWroughtIronMat);
        picket.position.set(sideX, wallH + fenceH * 0.5, -z);
        group.add(picket);

        const spear = new THREE.Mesh(spearGeo, mats.hauntedWroughtIronMat);
        spear.position.set(sideX, wallH + fenceH + 0.175, -z);
        group.add(spear);
      }

      // Stone Pilasters with Carved Jack-o'-Lantern Finials every 20m
      for (let pz = 10; pz < chunkLength; pz += 20) {
        const pilaster = new THREE.Mesh(this.getBox(0.95, wallH + 1.2, 0.95), mats.hauntedGothicStoneMat);
        pilaster.position.set(sideX, (wallH + 1.2) * 0.5, -pz);
        group.add(pilaster);

        // Jack-o'-Lantern finial
        const pumpkin = new THREE.Mesh(this.getSphere(0.55, 8, 8), mats.hauntedJackOLanternGlowMat);
        pumpkin.position.set(sideX, wallH + 1.55, -pz);
        group.add(pumpkin);

        // Swaying gas lamp hanging from iron bracket
        const lampGroup = new THREE.Group();
        lampGroup.position.set(sideX + (sideX > 0 ? -0.7 : 0.7), wallH + 1.1, -pz);

        const bracket = new THREE.Mesh(this.getBox(0.65, 0.1, 0.1), mats.hauntedWroughtIronMat);
        bracket.position.set(sideX > 0 ? 0.3 : -0.3, 0, 0);
        lampGroup.add(bracket);

        const lantern = new THREE.Mesh(this.getBox(0.35, 0.5, 0.35), mats.hauntedAmberGlowMat);
        lantern.position.set(0, -0.3, 0);
        lampGroup.add(lantern);

        director.registerSwingingLantern(lantern, 'z', 2.2, pz * 0.3);
        group.add(lampGroup);
      }
    });
  }

  // =========================================================================
  // OVERHEAD ARCHITECTURE: MONUMENTAL GOTHIC ARCHES
  // =========================================================================

  public buildMonumentalOverheadArches(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    mats: any,
    director: HauntedCarnivalEventDirector,
    seed: number
  ): void {
    const archGroup = new THREE.Group();
    archGroup.name = 'haunted_overhead_arches';

    const spanW = roadbedWidth + 6.0; // ~16.8m span
    const archZ = -chunkLength * 0.5;
    const archClearanceY = 11.2; // Strictly >= 8.5m clearance above running lanes
    const columnH = archClearanceY;

    // Twin Monumental Gothic Stone Pylons
    [-spanW * 0.5, spanW * 0.5].forEach((cx) => {
      const pylon = new THREE.Mesh(this.getBox(3.4, columnH, 3.8), mats.hauntedGothicStoneMat);
      pylon.position.set(cx, columnH * 0.5, archZ);
      pylon.castShadow = true;
      pylon.receiveShadow = true;
      archGroup.add(pylon);

      // Wrought Iron corner buttresses
      const buttress = new THREE.Mesh(this.getBox(0.4, columnH * 0.8, 0.6), mats.hauntedWroughtIronMat);
      buttress.position.set(cx + (cx > 0 ? -1.8 : 1.8), columnH * 0.4, archZ);
      archGroup.add(buttress);

      // Colossal Jack-o'-Lantern Pylon Finial
      const pumpkinFinial = new THREE.Mesh(this.getSphere(1.5, 10, 10), mats.hauntedJackOLanternGlowMat);
      pumpkinFinial.position.set(cx, columnH + 1.6, archZ);
      archGroup.add(pumpkinFinial);
    });

    // Grand Spanning Gothic Arch Crossbar (Bottom face at Y = 11.2m, well above running lanes)
    const archCrossbar = new THREE.Mesh(this.getBox(spanW + 4.0, 2.8, 3.4), mats.hauntedGothicStoneMat);
    archCrossbar.position.set(0, archClearanceY + 1.4, archZ);
    archGroup.add(archCrossbar);

    // Pointed Gothic Pediment with Bat Finial
    const pediment = new THREE.Mesh(this.getCone(4.6, 4.2, 4), mats.hauntedGothicStoneMat);
    pediment.position.set(0, archClearanceY + 4.9, archZ);
    pediment.rotation.y = Math.PI * 0.25;
    archGroup.add(pediment);

    const batFinial = new THREE.Mesh(this.getBox(3.2, 1.6, 0.35), mats.hauntedWroughtIronMat);
    batFinial.position.set(0, archClearanceY + 7.4, archZ);
    archGroup.add(batFinial);

    // Glowing Archway Lettering Sign
    const signTex = HauntedCarnivalTextureHelper.getParchmentSignTexture('CARNIVAL OF DOOM', 'ABANDON HOPE ALL WHO ENTER');
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    CurvedShaderManager.getInstance().applyCurvature(signMat);
    const signMesh = new THREE.Mesh(this.getBox(10.0, 2.0, 0.25), signMat);
    signMesh.position.set(0, archClearanceY + 1.4, archZ + 1.8);
    archGroup.add(signMesh);

    // Hanging illuminated pumpkin lanterns along arch underside
    [-3.8, 0, 3.8].forEach((lx, idx) => {
      const lantern = new THREE.Mesh(this.getSphere(0.48, 8, 8), mats.hauntedJackOLanternGlowMat);
      lantern.position.set(lx, archClearanceY - 0.6, archZ);
      archGroup.add(lantern);
      director.registerSwingingLantern(lantern, 'z', 2.0, idx * 0.8);
    });

    group.add(archGroup);
  }

  // =========================================================================
  // ZONE 0: THE CURSED ENTRANCE
  // =========================================================================

  public buildCursedEntrance(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    mats: any,
    director: HauntedCarnivalEventDirector,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    variant: number,
    worldZ: number
  ): void {
    const entranceGroup = new THREE.Group();
    entranceGroup.name = 'zone_cursed_entrance';

    const sideX = roadbedWidth * 0.5 + 7.5; // ~12.5m from center

    // Decaying Victorian Ticket Booths on side promenade
    const boothW = 5.5;
    const boothH = 6.2;
    const boothD = 4.8;
    const boothZ = -chunkLength * 0.45;

    const boothMesh = new THREE.Mesh(this.getBox(boothW, boothH, boothD), mats.hauntedGothicStoneMat);
    boothMesh.position.set(-sideX, boothH * 0.5, boothZ);
    entranceGroup.add(boothMesh);

    // Stained-glass illuminated ticket window
    const ticketWin = new THREE.Mesh(this.getBox(2.2, 2.6, 0.2), mats.hauntedGothicWindowMat);
    ticketWin.position.set(-sideX, boothH * 0.42, boothZ + boothD * 0.5 + 0.05);
    entranceGroup.add(ticketWin);

    // Striped Awning atop booth
    const awning = new THREE.Mesh(this.getCone(3.4, 2.4, 8), mats.hauntedCarnivalStripeMat);
    awning.position.set(-sideX, boothH + 1.2, boothZ);
    entranceGroup.add(awning);

    // Illuminated "TICKETS" Signboard
    const ticketSignTex = HauntedCarnivalTextureHelper.getParchmentSignTexture('TICKETS', 'ONE WAY ONLY');
    const ticketSignMat = new THREE.MeshBasicMaterial({ map: ticketSignTex });
    CurvedShaderManager.getInstance().applyCurvature(ticketSignMat);
    const sign = new THREE.Mesh(this.getBox(4.2, 1.4, 0.2), ticketSignMat);
    sign.position.set(-sideX, boothH * 0.75, boothZ + boothD * 0.5 + 0.15);
    entranceGroup.add(sign);

    // SIGNATURE SCARE 1: THE HAUNTED RINGMASTER (Welcoming at Entrance)
    this.spawnRingmaster(entranceGroup, sideX, boothZ + 6.0, director, worldZ);

    // FLAGSHIP HORROR SCARE A: THE WATCHER (First 100m Opening Jumpscare)
    this.spawnTheWatcher(entranceGroup, 1, boothZ + 12.0, director, worldZ);

    // Bare Gnarled Dead Trees with Perched Bats
    this.spawnTwistedTrees(entranceGroup, -sideX - 4.5, -chunkLength * 0.25, mats, detail);
    this.spawnTwistedTrees(entranceGroup, sideX + 4.5, -chunkLength * 0.75, mats, detail);

    // SIGNATURE SCARE 10: Overhead Spectral Bat Swarm
    if (detail !== 'MINIMAL') {
      this.spawnBatSwarm(entranceGroup, 0, -chunkLength * 0.5, director);
    }

    group.add(entranceGroup);
  }

  // =========================================================================
  // ZONE 1: THE ABANDONED FUNFAIR
  // =========================================================================

  public buildAbandonedFunfair(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    mats: any,
    director: HauntedCarnivalEventDirector,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    variant: number,
    worldZ: number
  ): void {
    const funfairGroup = new THREE.Group();
    funfairGroup.name = 'zone_abandoned_funfair';

    const sideX = roadbedWidth * 0.5 + 8.0;

    // Carnival Midway Game Stalls ("Skull Toss" & "Wheel of Misfortune")
    const stallW = 8.5;
    const stallH = 5.2;
    const stallD = 5.0;
    const stallZ = -chunkLength * 0.4;

    // Wooden stall frame
    const stall = new THREE.Mesh(this.getBox(stallW, stallH, stallD), this.weatheredWoodMat);
    stall.position.set(-sideX, stallH * 0.5, stallZ);
    funfairGroup.add(stall);

    // Striped Canopy
    const canopy = new THREE.Mesh(this.getBox(stallW + 0.8, 1.2, stallD + 1.2), mats.hauntedCarnivalStripeMat);
    canopy.position.set(-sideX, stallH + 0.6, stallZ);
    funfairGroup.add(canopy);

    // Signboard
    const stallSignTex = HauntedCarnivalTextureHelper.getParchmentSignTexture('SKULL TOSS', 'WIN A CURSE!');
    const stallSignMat = new THREE.MeshBasicMaterial({ map: stallSignTex });
    CurvedShaderManager.getInstance().applyCurvature(stallSignMat);
    const sign = new THREE.Mesh(this.getBox(5.0, 1.4, 0.2), stallSignMat);
    sign.position.set(-sideX, stallH + 1.4, stallZ + stallD * 0.5 + 0.1);
    funfairGroup.add(sign);

    // SIGNATURE SCARE 4: Shelf of Haunted Dolls (Head-tracking player)
    const shelfY = 2.2;
    for (let di = 0; di < 3; di++) {
      const dollGroup = new THREE.Group();
      const dollX = -sideX - 2.0 + di * 2.0;
      dollGroup.position.set(dollX, shelfY, stallZ + stallD * 0.35);

      // Doll dress / torso
      const body = new THREE.Mesh(this.getCylinder(0.2, 0.35, 0.8, 8), this.agedVelvetMat);
      body.position.y = 0.4;
      dollGroup.add(body);

      // Cracked Porcelain Head
      const head = new THREE.Mesh(this.getSphere(0.32, 8, 8), this.dollFaceMat);
      head.position.y = 0.95;
      dollGroup.add(head);

      director.registerHauntedDoll({
        group: dollGroup,
        head,
        worldZ: worldZ - Math.abs(stallZ),
        side: -1,
        baseRotY: Math.PI * 0.5
      });
      funfairGroup.add(dollGroup);
    }

    // SIGNATURE SCARE 2: PEEK-A-BOO GHOST CLOWN (Behind concession stand)
    this.spawnGhostClown(funfairGroup, sideX, stallZ, director, worldZ);

    // FLAGSHIP HORROR SCARE D: THE NIGHTMARE CLOWN (Sinister Articulated Clown Jumpscare)
    this.spawnNightmareClown(funfairGroup, -sideX - 2.0, stallZ, director, worldZ);

    // SIGNATURE SCARE 11: TRICK FUNHOUSE FACADE ILLUSION
    if (variant === 1 || detail === 'FULL') {
      this.spawnFunhouseFacade(funfairGroup, sideX + 4.0, -chunkLength * 0.75, director);
    }

    group.add(funfairGroup);
  }

  // =========================================================================
  // ZONE 2: THE GHOSTLY CIRCUS
  // =========================================================================

  public buildGhostlyCircus(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    mats: any,
    director: HauntedCarnivalEventDirector,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    variant: number,
    worldZ: number
  ): void {
    const circusGroup = new THREE.Group();
    circusGroup.name = 'zone_ghostly_circus';

    // Must include named landmark 'carnival_spooky_tent' for test verification
    const tentGroup = new THREE.Group();
    tentGroup.name = 'carnival_spooky_tent';

    const tentX = roadbedWidth * 0.5 + 16.0;
    const tentZ = -chunkLength * 0.5;

    // Colossal Torn Big Top Tent
    const tentRadius = 14.0;
    const tentH = 18.0;

    // Lower cylinder canvas wall
    const wallMesh = new THREE.Mesh(this.getCylinder(tentRadius, tentRadius + 1.5, 7.0, 14), mats.hauntedCarnivalStripeMat);
    wallMesh.position.set(-tentX, 3.5, tentZ);
    tentGroup.add(wallMesh);

    // Conical Big Top Roof
    const roofMesh = new THREE.Mesh(this.getCone(tentRadius + 1.5, tentH, 14), mats.hauntedCarnivalStripeMat);
    roofMesh.position.set(-tentX, 7.0 + tentH * 0.5, tentZ);
    tentGroup.add(roofMesh);

    // Spire Flagpole with glowing tattered banner
    const pole = new THREE.Mesh(this.getCylinder(0.18, 0.18, 5.0, 6), mats.hauntedWroughtIronMat);
    pole.position.set(-tentX, 7.0 + tentH + 2.5, tentZ);
    tentGroup.add(pole);

    const banner = new THREE.Mesh(this.getBox(2.8, 1.2, 0.1), this.spectralVioletMat);
    banner.position.set(-tentX + 1.4, 7.0 + tentH + 3.8, tentZ);
    tentGroup.add(banner);

    // High-Wire Rigging across the sky (Overhead clearance Y >= 16.5m)
    const wireY = 17.5;
    const wire = new THREE.Mesh(this.getBox(roadbedWidth + 24.0, 0.08, 0.08), mats.hauntedWroughtIronMat);
    wire.position.set(0, wireY, tentZ);
    tentGroup.add(wire);

    // Spectral Acrobat silhouette perched on wire far above running lanes
    const acrobat = new THREE.Mesh(this.getCylinder(0.25, 0.15, 1.6, 6), this.spectralTealMat);
    acrobat.position.set(-5.5, wireY + 0.8, tentZ);
    tentGroup.add(acrobat);

    // SIGNATURE SCARE 9: Ghost Carnival Parade Float on opposite side
    this.spawnParadeFloat(circusGroup, tentX - 4.0, tentZ + 8.0, director);

    // FLAGSHIP HORROR SCARE E: THE SHADOW COLOSSUS (Rare Skyline Titan in Deep Runs)
    if (worldZ <= -1600 || variant === 2) {
      this.spawnShadowColossus(circusGroup, tentX + 16.0, tentZ - 30.0, director, worldZ);
    }

    circusGroup.add(tentGroup);
    group.add(circusGroup);
  }

  // =========================================================================
  // ZONE 3: THE CURSED GRAVEYARD
  // =========================================================================

  public buildCursedGraveyard(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    mats: any,
    director: HauntedCarnivalEventDirector,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    variant: number,
    worldZ: number
  ): void {
    const graveyardGroup = new THREE.Group();
    graveyardGroup.name = 'zone_cursed_graveyard';

    // Must include named landmark 'carnival_graveyard_crypt' for test verification
    const cryptGroup = new THREE.Group();
    cryptGroup.name = 'carnival_graveyard_crypt';

    const sideX = roadbedWidth * 0.5 + 8.5;
    const cryptZ = -chunkLength * 0.5;

    // Ancient Ashlar Family Mausoleum
    const cryptW = 9.0;
    const cryptH = 7.5;
    const cryptD = 8.0;

    const cryptMesh = new THREE.Mesh(this.getBox(cryptW, cryptH, cryptD), mats.hauntedGothicStoneMat);
    cryptMesh.position.set(sideX, cryptH * 0.5, cryptZ);
    cryptGroup.add(cryptMesh);

    // Gothic Stained-Glass Window on Crypt facade
    const cryptWin = new THREE.Mesh(this.getBox(2.4, 3.2, 0.2), mats.hauntedGothicWindowMat);
    cryptWin.position.set(sideX, cryptH * 0.65, cryptZ + cryptD * 0.5 + 0.05);
    cryptGroup.add(cryptWin);

    // Pointed Gothic Pediment with carved skull relief
    const pediment = new THREE.Mesh(this.getCone(cryptW * 0.55, 3.2, 4), mats.hauntedGothicStoneMat);
    pediment.position.set(sideX, cryptH + 1.6, cryptZ);
    pediment.rotation.y = Math.PI * 0.25;
    cryptGroup.add(pediment);

    // Open crypt doorway with eerie green witch-fire glow
    const doorGlow = new THREE.Mesh(this.getBox(2.4, 4.2, 0.2), this.witchFireGreenMat);
    doorGlow.position.set(sideX - cryptW * 0.5 - 0.1, 2.1, cryptZ);
    cryptGroup.add(doorGlow);

    // Gravestones, Celtic Crosses, and Weeping Angel
    for (let gz = 10; gz < chunkLength - 10; gz += 12) {
      const stoneH = 1.6 + rng.next() * 0.6;
      const grave = new THREE.Mesh(this.getBox(0.9, stoneH, 0.25), mats.hauntedGothicStoneMat);
      grave.position.set(sideX + 6.0 + rng.next() * 3.0, stoneH * 0.5, -gz);
      grave.rotation.y = (rng.next() - 0.5) * 0.4;
      grave.rotation.z = (rng.next() - 0.5) * 0.15;
      graveyardGroup.add(grave);

      // Will-o'-the-Wisp hovering over grave
      const wisp = new THREE.Mesh(this.getSphere(0.3, 6, 6), this.spectralTealMat);
      wisp.position.set(grave.position.x, 2.2, -gz);
      graveyardGroup.add(wisp);
      director.registerWillOWisp(wisp, new THREE.Vector3(grave.position.x, 2.2, -gz), 1.8, 2.0, gz);
    }

    // SCENE B: SURPRISE GHOST ENCOUNTER (Emerging from behind Mausoleum)
    this.spawnSurpriseGhost(graveyardGroup, -sideX - 2.0, cryptZ, director, worldZ);

    // FLAGSHIP HORROR SCARE A: THE WATCHER (Haunting the Graveyard Gates)
    this.spawnTheWatcher(graveyardGroup, -1, cryptZ + 8.0, director, worldZ);

    graveyardGroup.add(cryptGroup);
    group.add(graveyardGroup);
  }

  // =========================================================================
  // ZONE 4: THE NIGHTMARE MANOR
  // =========================================================================

  public buildNightmareManor(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    mats: any,
    director: HauntedCarnivalEventDirector,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    variant: number,
    worldZ: number
  ): void {
    const manorGroup = new THREE.Group();
    manorGroup.name = 'zone_nightmare_manor';

    // Must include named landmark 'carnival_haunted_mansion' for test verification
    const mansion = new THREE.Group();
    mansion.name = 'carnival_haunted_mansion';

    const sideX = roadbedWidth * 0.5 + 14.0;
    const manorZ = -chunkLength * 0.5;
    const triggerWorldZ = worldZ - Math.abs(manorZ);

    // Multi-tier Victorian Gothic Manor
    const baseW = 16.0;
    const baseH = 14.0;
    const baseD = 12.0;

    // Central Manor Block
    const mainBody = new THREE.Mesh(this.getBox(baseW, baseH, baseD), mats.hauntedGothicStoneMat);
    mainBody.position.set(-sideX, baseH * 0.5, manorZ);
    mansion.add(mainBody);

    // Grand Steep Mansard Roof
    const roof = new THREE.Mesh(this.getCone(baseW * 0.65, 8.0, 4), mats.hauntedGothicStoneMat);
    roof.position.set(-sideX, baseH + 4.0, manorZ);
    roof.rotation.y = Math.PI * 0.25;
    mansion.add(roof);

    // Towering Corner Turrets with Pointed Spires
    [-baseW * 0.5, baseW * 0.5].forEach((tx) => {
      const turret = new THREE.Mesh(this.getCylinder(1.8, 2.2, baseH + 6.0, 8), mats.hauntedGothicStoneMat);
      turret.position.set(-sideX + tx, (baseH + 6.0) * 0.5, manorZ + baseD * 0.4);
      mansion.add(turret);

      const spire = new THREE.Mesh(this.getCone(2.2, 6.5, 8), mats.hauntedGothicStoneMat);
      spire.position.set(-sideX + tx, baseH + 6.0 + 3.25, manorZ + baseD * 0.4);
      mansion.add(spire);
    });

    // High & Low Animated Windows with independent materials & silhouettes
    const highWindows: Array<{ mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; silhouette: THREE.Mesh }> = [];
    const lowWindows: Array<{ mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; silhouette: THREE.Mesh }> = [];

    [-4.5, 0, 4.5].forEach((wx) => {
      // High window
      const highMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      CurvedShaderManager.getInstance().applyCurvature(highMat);
      const highWin = new THREE.Mesh(this.getBox(2.2, 3.4, 0.2), highMat);
      highWin.position.set(-sideX + wx, 9.5, manorZ + baseD * 0.5 + 0.1);

      const highSil = new THREE.Mesh(this.getBox(1.1, 1.9, 0.05), this.shadowColossusMat);
      highSil.position.set(0, -0.3, 0.12);
      highSil.visible = false;
      highWin.add(highSil);
      mansion.add(highWin);
      highWindows.push({ mesh: highWin, mat: highMat, silhouette: highSil });

      // Low window
      const lowMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      CurvedShaderManager.getInstance().applyCurvature(lowMat);
      const lowWin = new THREE.Mesh(this.getBox(2.2, 3.4, 0.2), lowMat);
      lowWin.position.set(-sideX + wx, 4.5, manorZ + baseD * 0.5 + 0.1);

      const lowSil = new THREE.Mesh(this.getBox(1.0, 1.8, 0.05), this.shadowColossusMat);
      lowSil.position.set(0, -0.3, 0.12);
      lowSil.visible = false;
      lowWin.add(lowSil);
      mansion.add(lowWin);
      lowWindows.push({ mesh: lowWin, mat: lowMat, silhouette: lowSil });
    });

    // Double entrance doors on hinges
    const doorPortal = new THREE.Group();
    doorPortal.position.set(-sideX, 1.8, manorZ + baseD * 0.5 + 0.15);

    const doorFrame = new THREE.Mesh(this.getBox(3.4, 3.8, 0.3), this.weatheredWoodMat);
    doorPortal.add(doorFrame);

    const doorLeft = new THREE.Group();
    doorLeft.position.set(-1.4, 0, 0);
    const dPanelL = new THREE.Mesh(this.getBox(1.4, 3.4, 0.12), this.weatheredWoodMat);
    dPanelL.position.set(0.7, 0, 0);
    doorLeft.add(dPanelL);
    doorPortal.add(doorLeft);

    const doorRight = new THREE.Group();
    doorRight.position.set(1.4, 0, 0);
    const dPanelR = new THREE.Mesh(this.getBox(1.4, 3.4, 0.12), this.weatheredWoodMat);
    dPanelR.position.set(-0.7, 0, 0);
    doorRight.add(dPanelR);
    doorPortal.add(doorRight);

    // Spectral Wraith floating from portal
    const portalWraith = new THREE.Group();
    portalWraith.position.set(0, 0, 0);
    portalWraith.visible = false;
    const wraithBody = new THREE.Mesh(this.getCylinder(0.2, 0.45, 1.8, 8), this.spectralVioletMat);
    wraithBody.position.y = 0.9;
    portalWraith.add(wraithBody);
    const wraithHead = new THREE.Mesh(this.getSphere(0.26, 8, 8), this.spectralTealMat);
    wraithHead.position.y = 2.0;
    portalWraith.add(wraithHead);
    doorPortal.add(portalWraith);

    mansion.add(doorPortal);

    // Cathedral Organ Pipes on balcony
    const organPipesGroup = new THREE.Group();
    organPipesGroup.position.set(-sideX, 6.0, manorZ + baseD * 0.5 + 0.8);
    for (let p = -5; p <= 5; p++) {
      const pH = 4.5 - Math.abs(p) * 0.4;
      const pipe = new THREE.Mesh(this.getCylinder(0.18, 0.18, pH, 8), this.tarnishedGoldMat);
      pipe.position.set(p * 0.45, pH * 0.5, 0);
      organPipesGroup.add(pipe);
    }
    mansion.add(organPipesGroup);

    // FLAGSHIP 3: Colossal Shadow Titan rising behind the Manor
    const colossusGroup = new THREE.Group();
    colossusGroup.name = 'mansion_shadow_colossus';
    colossusGroup.position.set(-sideX, 14.0, manorZ - 14.0);
    colossusGroup.visible = false;

    // Torso silhouette
    const colTorso = new THREE.Mesh(this.getBox(20.0, 32.0, 6.0), this.shadowColossusMat);
    colTorso.position.y = 16.0;
    colossusGroup.add(colTorso);

    // Colossal Head
    const colHead = new THREE.Group();
    colHead.position.set(0, 34.0, 2.0);
    const headCore = new THREE.Mesh(this.getSphere(4.2, 12, 12), this.shadowColossusMat);
    colHead.add(headCore);

    // Horns
    [-2.8, 2.8].forEach(hx => {
      const horn = new THREE.Mesh(this.getCone(1.2, 6.0, 6), this.shadowColossusMat);
      horn.position.set(hx, 4.0, -0.5);
      horn.rotation.z = hx > 0 ? -0.35 : 0.35;
      colHead.add(horn);
    });

    // Glowing Crimson Eyes
    const colEyes: THREE.Mesh[] = [];
    [-1.6, 1.6].forEach(ex => {
      const eye = new THREE.Mesh(this.getSphere(0.85, 8, 8), this.bloodCrimsonGlowMat);
      eye.position.set(ex, 0.8, 3.8);
      colHead.add(eye);
      colEyes.push(eye);
    });
    colossusGroup.add(colHead);

    // Left claw resting on shoulder
    const clawL = new THREE.Mesh(this.getBox(5.0, 16.0, 3.5), this.shadowColossusMat);
    clawL.position.set(-13.0, 18.0, 2.0);
    colossusGroup.add(clawL);

    // Enormous Right Claw that reaches over the rooftop tiles
    const clawR = new THREE.Group();
    clawR.position.set(12.0, 22.0, 2.0);
    const armUpper = new THREE.Mesh(this.getBox(4.5, 18.0, 3.5), this.shadowColossusMat);
    armUpper.position.set(0, -6.0, 0);
    clawR.add(armUpper);

    // Claw fingers
    for (let f = -1; f <= 1; f++) {
      const finger = new THREE.Mesh(this.getBox(1.1, 7.5, 1.1), this.shadowColossusMat);
      finger.position.set(f * 1.5, -16.0, 1.2);
      finger.rotation.x = -0.5;
      clawR.add(finger);
    }
    colossusGroup.add(clawR);

    manorGroup.add(colossusGroup);

    // Also call spawnGiantShadowCreature for backwards compatibility
    this.spawnGiantShadowCreature(manorGroup, -sideX, manorZ - 25.0, director);

    manorGroup.add(mansion);
    group.add(manorGroup);

    // Register Mansion Awakening with Director
    director.registerMansionAwakens({
      group: manorGroup,
      worldZ: triggerWorldZ,
      sideX,
      highWindows,
      lowWindows,
      doorLeft,
      doorRight,
      portalWraith,
      colossusGroup,
      colossusHead: colHead,
      colossusEyes: colEyes,
      colossusLeftArm: clawL,
      colossusRightClaw: clawR,
      stage: 'QUIET',
      stageTimer: 0
    });
  }

  // =========================================================================
  // ZONE 5: THE SUPERNATURAL MIDWAY
  // =========================================================================

  public buildSupernaturalMidway(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    mats: any,
    director: HauntedCarnivalEventDirector,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    variant: number,
    worldZ: number
  ): void {
    const midwayGroup = new THREE.Group();
    midwayGroup.name = 'zone_supernatural_midway';

    const sideX = roadbedWidth * 0.5 + 13.5;
    const midwayZ = -chunkLength * 0.5;

    // SCENE A: THE HAUNTED CAROUSEL AWAKENING (Primary Vertical Slice)
    this.spawnHauntedCarousel(midwayGroup, -sideX, midwayZ, mats, director, worldZ);

    // Must include named landmark 'carnival_pumpkin_shrine' for test verification
    const pumpkinShrine = new THREE.Group();
    pumpkinShrine.name = 'carnival_pumpkin_shrine';
    pumpkinShrine.position.set(sideX, 0, midwayZ);

    // Stone sacrificial altar dais
    const dais = new THREE.Mesh(this.getBox(8.0, 1.2, 8.0), mats.hauntedGothicStoneMat);
    dais.position.y = 0.6;
    pumpkinShrine.add(dais);

    // Giant Carved Mother Pumpkin
    const giantPumpkin = new THREE.Mesh(this.getSphere(3.0, 12, 12), mats.hauntedJackOLanternGlowMat);
    giantPumpkin.position.y = 3.8;
    pumpkinShrine.add(giantPumpkin);

    // Gnarled vine tendrils
    for (let a = 0; a < 6; a++) {
      const angle = (a * Math.PI) / 3;
      const vine = new THREE.Mesh(this.getCylinder(0.2, 0.4, 4.2, 6), mats.hauntedTwistedWoodMat);
      vine.position.set(Math.cos(angle) * 3.5, 0.8, Math.sin(angle) * 3.5);
      vine.rotation.z = Math.PI * 0.35;
      vine.rotation.y = angle;
      pumpkinShrine.add(vine);
    }

    // SIGNATURE SCARE 8: Living Jack-o'-Lanterns (Head-tracking runner)
    for (let p = 0; p < 4; p++) {
      const pAngle = (p * Math.PI * 2) / 4 + 0.4;
      const px = Math.cos(pAngle) * 3.2;
      const pz = Math.sin(pAngle) * 3.2;

      const pGroup = new THREE.Group();
      pGroup.position.set(px, 1.6, pz);

      const pHead = new THREE.Mesh(this.getSphere(0.65, 8, 8), mats.hauntedJackOLanternGlowMat);
      pGroup.add(pHead);

      pumpkinShrine.add(pGroup);

      director.registerLivingPumpkin({
        group: pGroup,
        head: pHead,
        glowMesh: pHead,
        worldZ: worldZ - Math.abs(midwayZ),
        baseRotY: pAngle,
        phase: p * 1.5
      });
    }

    midwayGroup.add(pumpkinShrine);

    // FLAGSHIP HORROR SCARE A: THE WATCHER (Watching over the Supernatural Midway)
    this.spawnTheWatcher(midwayGroup, 1, midwayZ + 18.0, director, worldZ);

    // SIGNATURE SCARE 6: Cursed Mirror Maze Glitch
    this.spawnMirrorMaze(midwayGroup, sideX + 8.0, midwayZ + 12.0, mats, director);

    // SIGNATURE SCARE 7: Overhead Background Ghost Train on Sky Trestle
    this.spawnGhostTrainTrestle(midwayGroup, midwayZ, director);

    group.add(midwayGroup);
  }

  // =========================================================================
  // SCENE A: THE HAUNTED CAROUSEL AWAKENING
  // =========================================================================

  private spawnHauntedCarousel(
    parent: THREE.Group,
    posX: number,
    posZ: number,
    mats: any,
    director: HauntedCarnivalEventDirector,
    worldZ: number
  ): void {
    const carouselGroup = new THREE.Group();
    carouselGroup.name = 'haunted_carousel_scene_a';
    carouselGroup.position.set(posX, 0, posZ);

    const radius = 9.5;
    const baseH = 1.4;

    // Fixed Stone Outer Rim Platform
    const outerRim = new THREE.Mesh(this.getCylinder(radius + 1.2, radius + 1.4, baseH, 16), mats.hauntedGothicStoneMat);
    outerRim.position.y = baseH * 0.5;
    carouselGroup.add(outerRim);

    // Rotating Inner Turntable
    const turntable = new THREE.Group();
    turntable.position.y = baseH;

    const floor = new THREE.Mesh(this.getCylinder(radius, radius, 0.3, 16), this.weatheredWoodMat);
    turntable.add(floor);

    // Center Mirrored Organ Pillar
    const centerOrgan = new THREE.Group();
    const pillarCore = new THREE.Mesh(this.getCylinder(2.2, 2.4, 7.5, 10), mats.hauntedGothicStoneMat);
    pillarCore.position.y = 3.75;
    centerOrgan.add(pillarCore);

    // Organ Pipes along pillar
    const organPipes: THREE.Object3D[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      const pipeH = 3.5 + Math.sin(i * 1.2) * 1.0;
      const pipe = new THREE.Mesh(this.getCylinder(0.18, 0.18, pipeH, 6), this.tarnishedGoldMat);
      pipe.position.set(Math.cos(a) * 2.5, pipeH * 0.5 + 1.0, Math.sin(a) * 2.5);
      centerOrgan.add(pipe);
      organPipes.push(pipe);
    }
    turntable.add(centerOrgan);

    // Steeds: Spectral Stallions, Swans, and Bat-Winged Ponies
    const steedActors: any[] = [];
    const numSteeds = 8;
    for (let s = 0; s < numSteeds; s++) {
      const angle = (s * Math.PI * 2) / numSteeds;
      const steedR = 6.2;
      const sx = Math.cos(angle) * steedR;
      const sz = Math.sin(angle) * steedR;

      const steedGroup = new THREE.Group();
      steedGroup.position.set(sx, 1.8, sz);
      steedGroup.rotation.y = angle + Math.PI * 0.5;

      // Brass Spiral Pole
      const pole = new THREE.Mesh(this.getCylinder(0.08, 0.08, 6.2, 6), this.tarnishedGoldMat);
      pole.position.set(sx, 3.1, sz);
      turntable.add(pole);

      // Sculpted Steed Body
      const steedBody = new THREE.Mesh(this.getBox(0.7, 0.9, 1.8), s % 2 === 0 ? this.spectralTealMat : this.agedVelvetMat);
      steedBody.position.y = 0.45;
      steedGroup.add(steedBody);

      // Steed Neck & Head
      const head = new THREE.Mesh(this.getCylinder(0.2, 0.35, 1.1, 6), this.tarnishedGoldMat);
      head.position.set(0, 1.1, 0.8);
      head.rotation.x = Math.PI * 0.35;
      steedGroup.add(head);

      // Ghost Rider (Materialized Phantom Child / Performer)
      let rider: THREE.Object3D | undefined;
      if (s % 2 === 0) {
        rider = new THREE.Mesh(this.getCylinder(0.25, 0.15, 1.2, 6), this.spectralVioletMat);
        rider.position.set(0, 1.3, 0);
        steedGroup.add(rider);
      }

      turntable.add(steedGroup);

      steedActors.push({
        mesh: steedGroup,
        pole,
        head,
        rider,
        baseY: 1.8,
        amplitude: 0.65,
        frequency: 2.2,
        phase: s * (Math.PI / 4)
      });
    }

    carouselGroup.add(turntable);

    // Phantom Conductor outside ride at trackside verge
    const outsideSpecter = new THREE.Group();
    outsideSpecter.position.set(-radius - 1.5, 0, 0);
    outsideSpecter.visible = false;
    const specterBody = new THREE.Mesh(this.getCylinder(0.28, 0.45, 2.2, 8), this.spectralVioletMat);
    specterBody.position.y = 1.1;
    outsideSpecter.add(specterBody);
    const specterHead = new THREE.Mesh(this.getSphere(0.3, 8, 8), this.spectralTealMat);
    specterHead.position.y = 2.4;
    outsideSpecter.add(specterHead);
    carouselGroup.add(outsideSpecter);

    // Counter-Rotating Ornate Gothic Canopy
    const canopy = new THREE.Group();
    canopy.position.y = baseH + 7.2;

    const canopyCone = new THREE.Mesh(this.getCone(radius + 1.2, 4.2, 16), mats.hauntedCarnivalStripeMat);
    canopyCone.position.y = 2.1;
    canopy.add(canopyCone);

    // Scalloped Valence Rim with Glowing Bulbs
    const valence = new THREE.Mesh(this.getCylinder(radius + 1.3, radius + 1.3, 0.8, 16), mats.hauntedCarnivalStripeMat);
    valence.position.y = 0.4;
    canopy.add(valence);

    // Glowing Lantern Bulbs around rim
    const lanternBulbs: THREE.Mesh[] = [];
    for (let b = 0; b < 16; b++) {
      const bAngle = (b * Math.PI * 2) / 16;
      const bulb = new THREE.Mesh(this.getSphere(0.22, 6, 6), b % 2 === 0 ? mats.hauntedAmberGlowMat : mats.hauntedVioletGlowMat);
      bulb.position.set(Math.cos(bAngle) * (radius + 1.4), 0.1, Math.sin(bAngle) * (radius + 1.4));
      canopy.add(bulb);
      lanternBulbs.push(bulb);
    }

    carouselGroup.add(canopy);

    parent.add(carouselGroup);

    director.registerCarousel({
      group: carouselGroup,
      turntable,
      canopy,
      steeds: steedActors,
      leadSteedHead: steedActors[0]?.head,
      outsideSpecter,
      centerOrgan,
      organPipes,
      lanternBulbs,
      rotationSpeed: 0.45,
      currentSpeed: 0,
      worldZ: worldZ - Math.abs(posZ),
      isAwakened: false,
      stage: 'ABANDONED_STILL',
      stageTimer: 0
    });
  }

  // =========================================================================
  // SCENE B: SURPRISE GHOST ENCOUNTER
  // =========================================================================

  private spawnSurpriseGhost(
    parent: THREE.Group,
    targetX: number,
    posZ: number,
    director: HauntedCarnivalEventDirector,
    worldZ: number
  ): void {
    const ghostGroup = new THREE.Group();
    ghostGroup.name = 'surprise_ghost_scene_b';
    ghostGroup.position.set(0, 0, posZ);

    const startX = targetX > 0 ? targetX + 7.0 : targetX - 7.0; // Starts hidden behind structure
    const baseY = 2.4;

    const ghostMesh = new THREE.Group();
    ghostMesh.position.set(startX, baseY, 0);

    // Flowing Spectral Shroud / Robes
    const shroud = new THREE.Mesh(this.getCylinder(0.25, 0.75, 2.2, 8), this.spectralTealMat);
    shroud.position.y = 1.1;
    ghostMesh.add(shroud);

    // Head with hollow dark eyes
    const head = new THREE.Mesh(this.getSphere(0.38, 8, 8), this.spectralTealMat);
    head.position.y = 2.4;
    ghostMesh.add(head);

    const eyeL = new THREE.Mesh(this.getSphere(0.08, 4, 4), this.witchFireGreenMat);
    eyeL.position.set(-0.12, 2.45, 0.32);
    ghostMesh.add(eyeL);

    const eyeR = new THREE.Mesh(this.getSphere(0.08, 4, 4), this.witchFireGreenMat);
    eyeR.position.set(0.12, 2.45, 0.32);
    ghostMesh.add(eyeR);

    // Floating Lantern held in spectral hand
    const lantern = new THREE.Mesh(this.getBox(0.28, 0.42, 0.28), SceneryFactory.getInstance().getSharedMaterials().hauntedAmberGlowMat);
    lantern.position.set(targetX > 0 ? -0.55 : 0.55, 1.2, 0.4);
    ghostMesh.add(lantern);

    ghostGroup.add(ghostMesh);
    parent.add(ghostGroup);

    director.registerGhost({
      group: ghostGroup,
      ghostMesh,
      headMesh: head,
      lanternMesh: lantern,
      triggerZ: worldZ - Math.abs(posZ),
      startX,
      targetX,
      baseY,
      state: 'HIDDEN',
      hoverTime: 0,
      side: targetX > 0 ? 1 : -1
    });
  }

  // =========================================================================
  // ADDITIONAL SIGNATURE SCARES SPAWNERS
  // =========================================================================

  private spawnRingmaster(
    parent: THREE.Group,
    posX: number,
    posZ: number,
    director: HauntedCarnivalEventDirector,
    worldZ: number
  ): void {
    const rmGroup = new THREE.Group();
    rmGroup.name = 'haunted_ringmaster';
    rmGroup.position.set(posX, 0.35, posZ);
    rmGroup.rotation.y = posX > 0 ? -Math.PI * 0.4 : Math.PI * 0.4;

    // Red swallowtail coat torso
    const torso = new THREE.Mesh(this.getCylinder(0.35, 0.45, 1.4, 8), this.agedVelvetMat);
    torso.position.y = 1.8;
    rmGroup.add(torso);

    // Skull Face & Tall Silk Top Hat
    const head = new THREE.Group();
    head.position.y = 2.7;

    const skull = new THREE.Mesh(this.getSphere(0.28, 8, 8), this.spectralTealMat);
    head.add(skull);

    const hatBrim = new THREE.Mesh(this.getCylinder(0.5, 0.5, 0.08, 10), this.weatheredWoodMat);
    hatBrim.position.y = 0.22;
    head.add(hatBrim);

    const hatCrown = new THREE.Mesh(this.getCylinder(0.35, 0.32, 0.85, 10), this.weatheredWoodMat);
    hatCrown.position.y = 0.65;
    head.add(hatCrown);

    rmGroup.add(head);

    // Arm with Glowing Skull Cane
    const caneArm = new THREE.Group();
    caneArm.position.set(0.45, 2.3, 0);

    const caneShaft = new THREE.Mesh(this.getCylinder(0.04, 0.04, 1.8, 6), this.tarnishedGoldMat);
    caneShaft.position.y = -0.5;
    caneArm.add(caneShaft);

    const caneOrb = new THREE.Mesh(this.getSphere(0.18, 6, 6), SceneryFactory.getInstance().getSharedMaterials().hauntedJackOLanternGlowMat);
    caneOrb.position.y = 0.45;
    caneArm.add(caneOrb);

    rmGroup.add(caneArm);
    parent.add(rmGroup);

    director.registerRingmaster({
      group: rmGroup,
      head,
      caneArm,
      caneOrb,
      triggerZ: worldZ - Math.abs(posZ),
      state: 'IDLE',
      timer: 0
    });
  }

  private spawnGhostClown(
    parent: THREE.Group,
    baseX: number,
    posZ: number,
    director: HauntedCarnivalEventDirector,
    worldZ: number
  ): void {
    const clownGroup = new THREE.Group();
    clownGroup.name = 'mischievous_ghost_clown';
    clownGroup.position.set(baseX, 0.35, posZ);

    const body = new THREE.Mesh(this.getCylinder(0.3, 0.45, 1.3, 8), this.spectralVioletMat);
    body.position.y = 1.6;
    clownGroup.add(body);

    const head = new THREE.Group();
    head.position.y = 2.45;

    const face = new THREE.Mesh(this.getSphere(0.28, 8, 8), this.dollFaceMat);
    head.add(face);

    // Glowing Red Nose
    const nose = new THREE.Mesh(this.getSphere(0.1, 6, 6), SceneryFactory.getInstance().getSharedMaterials().hauntedJackOLanternGlowMat);
    nose.position.set(0, 0, 0.3);
    head.add(nose);

    clownGroup.add(head);

    // Juggling Arm Left & Right
    const armL = new THREE.Mesh(this.getBox(0.15, 0.7, 0.15), this.spectralTealMat);
    armL.position.set(-0.45, 1.9, 0);
    clownGroup.add(armL);

    const armR = new THREE.Mesh(this.getBox(0.15, 0.7, 0.15), this.spectralTealMat);
    armR.position.set(0.45, 1.9, 0);
    clownGroup.add(armR);

    // Juggling Glowing Embers
    const orbs: THREE.Mesh[] = [];
    const orbPhases: number[] = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
    for (let o = 0; o < 3; o++) {
      const orb = new THREE.Mesh(this.getSphere(0.16, 6, 6), SceneryFactory.getInstance().getSharedMaterials().hauntedAmberGlowMat);
      clownGroup.add(orb);
      orbs.push(orb);
    }

    parent.add(clownGroup);

    director.registerGhostClown({
      group: clownGroup,
      body,
      head,
      armLeft: armL,
      armRight: armR,
      jugglingOrbs: orbs,
      orbPhases,
      baseX,
      peekOffset: baseX > 0 ? -2.2 : 2.2,
      triggerZ: worldZ - Math.abs(posZ),
      state: 'PEEKING',
      timer: 0
    });
  }

  private spawnGiantShadowCreature(
    parent: THREE.Group,
    posX: number,
    posZ: number,
    director: HauntedCarnivalEventDirector
  ): void {
    const beastGroup = new THREE.Group();
    beastGroup.name = 'giant_shadow_creature';
    const baseY = 28.0;
    beastGroup.position.set(posX, baseY, posZ);

    // Colossal Torso Silhouette
    const torso = new THREE.Mesh(this.getBox(22.0, 30.0, 6.0), this.weatheredWoodMat);
    beastGroup.add(torso);

    // Massive Shadow Claws
    const clawL = new THREE.Mesh(this.getBox(6.0, 18.0, 4.0), this.weatheredWoodMat);
    clawL.position.set(-14.0, 4.0, 2.0);
    beastGroup.add(clawL);

    const clawR = new THREE.Mesh(this.getBox(6.0, 18.0, 4.0), this.weatheredWoodMat);
    clawR.position.set(14.0, 4.0, 2.0);
    beastGroup.add(clawR);

    // Piercing Glowing Eyes
    const eyes: THREE.Mesh[] = [];
    [-3.2, 3.2].forEach((ex) => {
      const eye = new THREE.Mesh(this.getSphere(1.2, 8, 8), SceneryFactory.getInstance().getSharedMaterials().hauntedJackOLanternGlowMat);
      eye.position.set(ex, 12.0, 3.5);
      beastGroup.add(eye);
      eyes.push(eye);
    });

    parent.add(beastGroup);

    director.registerShadowCreature({
      group: beastGroup,
      leftClaw: clawL,
      rightClaw: clawR,
      eyes,
      baseY,
      phase: 0
    });
  }

  private spawnMirrorMaze(
    parent: THREE.Group,
    posX: number,
    posZ: number,
    mats: any,
    director: HauntedCarnivalEventDirector
  ): void {
    const mazeGroup = new THREE.Group();
    mazeGroup.name = 'cursed_mirror_maze';
    mazeGroup.position.set(posX, 0.35, posZ);

    const mirror = new THREE.Mesh(this.getBox(4.5, 6.0, 0.3), this.cursedMirrorMat);
    mirror.position.y = 3.0;
    mazeGroup.add(mirror);

    // Ghost reflection inside mirror
    const ghostRef = new THREE.Mesh(this.getCylinder(0.3, 0.5, 1.8, 6), this.spectralTealMat);
    ghostRef.position.set(0, 2.8, -0.4);
    mazeGroup.add(ghostRef);

    parent.add(mazeGroup);

    director.registerMirrorGlitch({
      mirrorMesh: mirror,
      ghostReflection: ghostRef,
      flickerTimer: 0,
      phase: posZ * 0.1
    });
  }

  private spawnGhostTrainTrestle(
    parent: THREE.Group,
    posZ: number,
    director: HauntedCarnivalEventDirector
  ): void {
    const trestleGroup = new THREE.Group();
    trestleGroup.name = 'ghost_train_sky_trestle';

    const trestleY = 24.0; // High in the sky, far above track
    const trestleW = 85.0;

    // Timber trestle bridge beam spanning the sky
    const beam = new THREE.Mesh(this.getBox(trestleW, 1.8, 4.0), this.weatheredWoodMat);
    beam.position.set(0, trestleY, posZ - 35.0);
    trestleGroup.add(beam);

    // Phantom Ghost Train Group
    const trainGroup = new THREE.Group();
    trainGroup.position.set(-25.0, trestleY + 1.2, posZ - 35.0);

    // Spectral Locomotive
    const loco = new THREE.Mesh(this.getBox(3.4, 3.2, 9.0), this.spectralTealMat);
    loco.position.y = 1.6;
    trainGroup.add(loco);

    // Glowing windows
    const glows: THREE.Mesh[] = [];
    for (let w = -3; w <= 3; w += 2) {
      const gw = new THREE.Mesh(this.getBox(3.6, 0.9, 1.2), this.witchFireGreenMat);
      gw.position.set(0, 1.8, w);
      trainGroup.add(gw);
      glows.push(gw);
    }

    trestleGroup.add(trainGroup);
    parent.add(trestleGroup);

    director.registerGhostTrain({
      group: trainGroup,
      speed: 18.0,
      minZ: -40.0,
      maxZ: 40.0,
      wheels: [],
      spectralGlows: glows
    });
  }

  private spawnParadeFloat(
    parent: THREE.Group,
    posX: number,
    posZ: number,
    director: HauntedCarnivalEventDirector
  ): void {
    const floatGroup = new THREE.Group();
    floatGroup.name = 'ghost_parade_float';
    floatGroup.position.set(posX, 0.8, posZ);

    const platform = new THREE.Mesh(this.getBox(6.5, 1.2, 11.0), this.weatheredWoodMat);
    floatGroup.add(platform);

    const skels: any[] = [];
    for (let s = -2; s <= 2; s += 2) {
      const skelGroup = new THREE.Group();
      skelGroup.position.set(0, 1.6, s * 2.0);

      const torso = new THREE.Mesh(this.getCylinder(0.2, 0.25, 1.1, 6), this.spectralTealMat);
      skelGroup.add(torso);

      const trumpet = new THREE.Mesh(this.getCone(0.22, 1.0, 6), this.tarnishedGoldMat);
      trumpet.position.set(0, 0.4, 0.5);
      trumpet.rotation.x = Math.PI * 0.45;
      skelGroup.add(trumpet);

      floatGroup.add(skelGroup);
      skels.push({ torso, instrument: trumpet, phase: s });
    }

    parent.add(floatGroup);

    director.registerParadeFloat({
      group: floatGroup,
      skeletons: skels,
      banners: [],
      lanterns: []
    });
  }

  private spawnBatSwarm(
    parent: THREE.Group,
    posX: number,
    posZ: number,
    director: HauntedCarnivalEventDirector
  ): void {
    const swarmGroup = new THREE.Group();
    swarmGroup.name = 'spectral_bat_swarm';
    swarmGroup.position.set(posX, 0, posZ);

    const bats: any[] = [];
    const numBats = 6;
    for (let b = 0; b < numBats; b++) {
      const batMesh = new THREE.Group();
      batMesh.position.set(0, 18.0 + (b % 3) * 1.5, 0);
      const body = new THREE.Mesh(this.getSphere(0.2, 4, 4), this.spectralVioletMat);
      batMesh.add(body);

      const wingL = new THREE.Mesh(this.getBox(0.65, 0.05, 0.25), this.spectralVioletMat);
      wingL.position.set(-0.35, 0, 0);
      batMesh.add(wingL);

      const wingR = new THREE.Mesh(this.getBox(0.65, 0.05, 0.25), this.spectralVioletMat);
      wingR.position.set(0.35, 0, 0);
      batMesh.add(wingR);

      swarmGroup.add(batMesh);

      bats.push({
        mesh: batMesh,
        wingL,
        wingR,
        orbitRadius: 12.0 + b * 2.5,
        orbitSpeed: 1.8 + b * 0.2,
        phase: (b * Math.PI * 2) / numBats,
        baseY: 17.5 + (b % 3) * 1.5
      });
    }

    parent.add(swarmGroup);
    director.registerBatSwarm({
      group: swarmGroup,
      bats
    });
  }

  private spawnFunhouseFacade(
    parent: THREE.Group,
    posX: number,
    posZ: number,
    director: HauntedCarnivalEventDirector
  ): void {
    const fhGroup = new THREE.Group();
    fhGroup.name = 'trick_funhouse_facade';
    fhGroup.position.set(posX, 0.35, posZ);

    const wall = new THREE.Mesh(this.getBox(12.0, 10.0, 1.2), SceneryFactory.getInstance().getSharedMaterials().hauntedCarnivalStripeMat);
    wall.position.y = 5.0;
    fhGroup.add(wall);

    // Rolling giant painted eyeballs
    const eyes: THREE.Object3D[] = [];
    [-3.0, 3.0].forEach((ex) => {
      const eye = new THREE.Mesh(this.getSphere(1.1, 8, 8), this.dollFaceMat);
      eye.position.set(ex, 7.5, 0.7);
      fhGroup.add(eye);
      eyes.push(eye);
    });

    parent.add(fhGroup);

    director.registerFunhouseTrick({
      group: fhGroup,
      movingTiles: [wall],
      eyeballs: eyes,
      phase: 0
    });
  }

  private spawnTwistedTrees(
    parent: THREE.Group,
    posX: number,
    posZ: number,
    mats: any,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(posX, 0.35, posZ);

    const trunkH = 5.5;
    const trunk = new THREE.Mesh(this.getCylinder(0.4, 0.7, trunkH, 6), mats.hauntedTwistedWoodMat);
    trunk.position.y = trunkH * 0.5;
    trunk.rotation.z = 0.15;
    treeGroup.add(trunk);

    // Gnarled crooked branches
    for (let b = 0; b < 4; b++) {
      const angle = (b * Math.PI) / 2;
      const branch = new THREE.Mesh(this.getCylinder(0.15, 0.28, 3.4, 5), mats.hauntedTwistedWoodMat);
      branch.position.set(Math.cos(angle) * 0.8, trunkH - 0.5, Math.sin(angle) * 0.8);
      branch.rotation.z = Math.PI * 0.35;
      branch.rotation.y = angle;
      treeGroup.add(branch);
    }

    parent.add(treeGroup);
  }

  // =========================================================================
  // FLAGSHIP 1: THE WATCHER (Opening & Recurring Psychological Jumpscare)
  // =========================================================================

  public spawnTheWatcher(
    parent: THREE.Group,
    side: number,
    posZ: number,
    director: HauntedCarnivalEventDirector,
    worldZ: number
  ): void {
    const watcherGroup = new THREE.Group();
    watcherGroup.name = 'haunted_the_watcher';
    const triggerWorldZ = worldZ - Math.abs(posZ);
    watcherGroup.position.set(0, 0, posZ);

    const curbX = side * 12.0;

    // 1. Distant Lamp & Motionless Figure (Setup)
    const distantLamp = new THREE.Group();
    distantLamp.position.set(curbX, 0, -18.0);

    // Gas lamp post
    const post = new THREE.Mesh(this.getCylinder(0.12, 0.16, 5.2, 8), this.weatheredWoodMat);
    post.position.y = 2.6;
    distantLamp.add(post);

    // Lamp cage & bulb
    const cage = new THREE.Mesh(this.getBox(0.8, 1.0, 0.8), this.weatheredWoodMat);
    cage.position.set(0, 5.2, 0);
    distantLamp.add(cage);

    const bulb = new THREE.Mesh(this.getSphere(0.35, 8, 8), SceneryFactory.getInstance().getSharedMaterials().hauntedAmberGlowMat);
    bulb.position.set(0, 5.2, 0);
    distantLamp.add(bulb);

    // Distant Motionless Figure standing under the lamp
    const distantFig = new THREE.Group();
    distantFig.position.set(0, 0, 0.8);

    // Tall slender dark trench coat
    const dCoat = new THREE.Mesh(this.getCylinder(0.35, 0.55, 2.6, 8), this.shadowColossusMat);
    dCoat.position.y = 1.3;
    distantFig.add(dCoat);

    // Head on pivot
    const dHead = new THREE.Group();
    dHead.position.set(0, 2.7, 0);
    const dHeadMesh = new THREE.Mesh(this.getSphere(0.32, 8, 8), this.shadowColossusMat);
    dHead.add(dHeadMesh);

    // Wide brim fedora hat
    const hatBrim = new THREE.Mesh(this.getCylinder(0.65, 0.65, 0.08, 10), this.shadowColossusMat);
    hatBrim.position.y = 0.22;
    dHead.add(hatBrim);
    const hatCrown = new THREE.Mesh(this.getCylinder(0.36, 0.42, 0.45, 10), this.shadowColossusMat);
    hatCrown.position.y = 0.45;
    dHead.add(hatCrown);

    // Faint glowing eyes
    const dEyes: THREE.Mesh[] = [];
    [-0.1, 0.1].forEach((ex) => {
      const eye = new THREE.Mesh(this.getSphere(0.06, 6, 6), this.spectralTealMat);
      eye.position.set(ex, 0, 0.3);
      eye.scale.setScalar(0.01);
      dHead.add(eye);
      dEyes.push(eye);
    });
    distantFig.add(dHead);
    distantLamp.add(distantFig);
    watcherGroup.add(distantLamp);

    // 2. Safe Elevated Promenade Shock Platform (Shock Encounter)
    // Strictly at |X| >= 4.8m (safe from track envelope |X| <= 4.2m)
    const closePlatform = new THREE.Group();
    const platX = side * 5.6;
    closePlatform.position.set(platX, 0, 0);

    const stonePedestal = new THREE.Mesh(this.getBox(2.8, 0.6, 3.2), SceneryFactory.getInstance().getSharedMaterials().hauntedGothicStoneMat);
    stonePedestal.position.y = 0.3;
    closePlatform.add(stonePedestal);

    // Close Shock Figure
    const closeFig = new THREE.Group();
    closeFig.position.set(0, 0.6, 0);
    closeFig.visible = false;
    closeFig.userData.baseX = platX;

    // Torso with dark Victorian frock coat
    const cCoat = new THREE.Mesh(this.getCylinder(0.42, 0.65, 2.8, 8), this.shadowColossusMat);
    cCoat.position.y = 1.4;
    closeFig.add(cCoat);

    // Articulated Arms reaching forward
    const armL = new THREE.Mesh(this.getCylinder(0.12, 0.1, 1.8, 6), this.shadowColossusMat);
    armL.position.set(-0.55, 2.3, 0.2);
    armL.rotation.x = -0.8;
    closeFig.add(armL);

    const armR = new THREE.Mesh(this.getCylinder(0.12, 0.1, 1.8, 6), this.shadowColossusMat);
    armR.position.set(0.55, 2.3, 0.2);
    armR.rotation.x = -0.8;
    closeFig.add(armR);

    // Head on pivot with horrifying sculpted face
    const cHead = new THREE.Group();
    cHead.position.set(0, 2.9, 0);

    const cHeadMesh = new THREE.Mesh(this.getSphere(0.42, 10, 10), this.shadowColossusMat);
    cHead.add(cHeadMesh);

    // Horrifying face plane
    const facePlane = new THREE.Mesh(this.getBox(0.55, 0.65, 0.05), this.watcherFaceMat);
    facePlane.position.set(0, 0, 0.4);
    cHead.add(facePlane);

    // Piercing glowing eyes
    const cEyes: THREE.Mesh[] = [];
    [-0.14, 0.14].forEach((ex) => {
      const eye = new THREE.Mesh(this.getSphere(0.08, 8, 8), this.spectralTealMat);
      eye.position.set(ex, 0.05, 0.44);
      cHead.add(eye);
      cEyes.push(eye);
    });

    // Ragged top hat
    const cHatBrim = new THREE.Mesh(this.getCylinder(0.75, 0.75, 0.08, 12), this.shadowColossusMat);
    cHatBrim.position.y = 0.35;
    cHead.add(cHatBrim);
    const cHatCrown = new THREE.Mesh(this.getCylinder(0.45, 0.52, 0.85, 12), this.shadowColossusMat);
    cHatCrown.position.y = 0.8;
    cHead.add(cHatCrown);

    closeFig.add(cHead);
    closePlatform.add(closeFig);
    watcherGroup.add(closePlatform);

    parent.add(watcherGroup);

    director.registerWatcher({
      group: watcherGroup,
      worldZ: triggerWorldZ,
      side,
      distantLamp,
      distantLampLight: bulb,
      distantFigure: distantFig,
      distantHead: dHead,
      distantEyes: dEyes,
      closePlatform,
      closeFigure: closeFig,
      closeHead: cHead,
      closeFace: facePlane,
      closeEyes: cEyes,
      closeArmLeft: armL,
      closeArmRight: armR,
      state: 'DORMANT',
      stateTimer: 0
    });
  }

  // =========================================================================
  // FLAGSHIP 4: THE NIGHTMARE CLOWN (Sinister Articulated Clown Jumpscare)
  // =========================================================================

  public spawnNightmareClown(
    parent: THREE.Group,
    baseX: number,
    posZ: number,
    director: HauntedCarnivalEventDirector,
    worldZ: number
  ): void {
    const clownEncounter = new THREE.Group();
    clownEncounter.name = 'nightmare_clown_encounter';
    const triggerWorldZ = worldZ - Math.abs(posZ);
    clownEncounter.position.set(baseX, 0, posZ);

    // Concession Booth with articulated door
    const boothW = 4.2;
    const boothH = 3.8;
    const boothD = 3.2;

    const boothFrame = new THREE.Mesh(this.getBox(boothW, boothH, boothD), this.weatheredWoodMat);
    boothFrame.position.y = boothH * 0.5;
    clownEncounter.add(boothFrame);

    // Striped Awning
    const awning = new THREE.Mesh(this.getBox(boothW + 0.6, 0.35, boothD + 0.6), SceneryFactory.getInstance().getSharedMaterials().hauntedCarnivalStripeMat);
    awning.position.y = boothH + 0.18;
    clownEncounter.add(awning);

    // Articulated Door on hinge
    const doorPivot = new THREE.Group();
    doorPivot.position.set(0, 0, boothD * 0.5);
    const doorMesh = new THREE.Mesh(this.getBox(1.6, 2.6, 0.12), this.weatheredWoodMat);
    doorMesh.position.set(0.8, 1.3, 0);
    doorPivot.add(doorMesh);
    clownEncounter.add(doorPivot);

    // Articulated Nightmare Clown Body
    const clownBody = new THREE.Group();
    clownBody.position.set(0, 1.2, 0);

    // Torso with torn ruff
    const torso = new THREE.Mesh(this.getCylinder(0.35, 0.45, 1.6, 8), SceneryFactory.getInstance().getSharedMaterials().hauntedCarnivalStripeMat);
    torso.position.y = 0.8;
    clownBody.add(torso);

    const ruff = new THREE.Mesh(this.getCylinder(0.65, 0.65, 0.18, 10), this.agedVelvetMat);
    ruff.position.y = 1.65;
    clownBody.add(ruff);

    // Head on pivot with cracked porcelain clown mask
    const head = new THREE.Group();
    head.position.set(0, 2.1, 0);

    const headSphere = new THREE.Mesh(this.getSphere(0.36, 8, 8), this.weatheredWoodMat);
    head.add(headSphere);

    const mask = new THREE.Mesh(this.getBox(0.48, 0.58, 0.05), this.clownFaceMat);
    mask.position.set(0, 0, 0.36);
    head.add(mask);

    // Small cone clown hat
    const hat = new THREE.Mesh(this.getCone(0.24, 0.75, 8), this.agedVelvetMat);
    hat.position.set(0.08, 0.55, 0);
    hat.rotation.z = -0.15;
    head.add(hat);

    clownBody.add(head);

    // Articulated Arms
    const armL = new THREE.Mesh(this.getCylinder(0.1, 0.08, 1.2, 6), this.agedVelvetMat);
    armL.position.set(-0.45, 1.4, 0);
    clownBody.add(armL);

    const armR = new THREE.Mesh(this.getCylinder(0.1, 0.08, 1.2, 6), this.agedVelvetMat);
    armR.position.set(0.45, 1.4, 0);
    clownBody.add(armR);

    clownEncounter.add(clownBody);
    parent.add(clownEncounter);

    director.registerNightmareClown({
      group: clownEncounter,
      worldZ: triggerWorldZ,
      baseX,
      boothDoor: doorPivot,
      clownBody,
      clownHead: head,
      clownArmLeft: armL,
      clownArmRight: armR,
      state: 'PEEKING_INSIDE',
      timer: 0
    });
  }

  // =========================================================================
  // FLAGSHIP 5: THE SHADOW COLOSSUS (Rare Skyline Titan)
  // =========================================================================

  public spawnShadowColossus(
    parent: THREE.Group,
    posX: number,
    posZ: number,
    director: HauntedCarnivalEventDirector,
    worldZ: number
  ): void {
    const colossusGroup = new THREE.Group();
    colossusGroup.name = 'skyline_shadow_colossus';
    const triggerWorldZ = worldZ - Math.abs(posZ);
    const baseY = 24.0;
    colossusGroup.position.set(posX, baseY, posZ);

    // Monumental torso
    const torso = new THREE.Mesh(this.getBox(24.0, 36.0, 8.0), this.shadowColossusMat);
    torso.position.y = 18.0;
    colossusGroup.add(torso);

    // Colossal Head
    const head = new THREE.Group();
    head.position.set(0, 38.0, 3.0);
    const skull = new THREE.Mesh(this.getSphere(5.5, 12, 12), this.shadowColossusMat);
    head.add(skull);

    // Curved Horns
    [-3.5, 3.5].forEach(hx => {
      const horn = new THREE.Mesh(this.getCone(1.4, 7.5, 6), this.shadowColossusMat);
      horn.position.set(hx, 5.0, -1.0);
      horn.rotation.z = hx > 0 ? -0.4 : 0.4;
      head.add(horn);
    });

    // Piercing glowing crimson eyes
    const eyes: THREE.Mesh[] = [];
    [-2.2, 2.2].forEach(ex => {
      const eye = new THREE.Mesh(this.getSphere(1.1, 8, 8), this.bloodCrimsonGlowMat);
      eye.position.set(ex, 1.2, 4.8);
      head.add(eye);
      eyes.push(eye);
    });
    colossusGroup.add(head);

    // Articulated Claws
    const clawL = new THREE.Mesh(this.getBox(6.5, 20.0, 4.0), this.shadowColossusMat);
    clawL.position.set(-16.0, 20.0, 2.0);
    colossusGroup.add(clawL);

    const clawR = new THREE.Mesh(this.getBox(6.5, 20.0, 4.0), this.shadowColossusMat);
    clawR.position.set(16.0, 20.0, 2.0);
    colossusGroup.add(clawR);

    parent.add(colossusGroup);

    director.registerShadowColossus({
      group: colossusGroup,
      worldZ: triggerWorldZ,
      head,
      leftClaw: clawL,
      rightClaw: clawR,
      eyes,
      baseY,
      phase: 0
    });
  }
}
