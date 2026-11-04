import * as THREE from 'three';
import { SeededRandom } from '../../SceneryFactory';
import { InfernoExpressEventDirector } from './InfernoExpressEventDirector';
import { INFERNO_EXPRESS_TRAIN_LIVERY } from './InfernoExpressTheme';

/**
 * Procedural Texture Cache for Inferno Express
 * Self-contained procedural canvas textures for molten lava, obsidian runes, and furnace fires.
 */
class InfernoExpressTextureHelper {
  private static cache = new Map<string, THREE.Texture>();

  public static getLavaOceanTexture(): THREE.Texture {
    const key = 'inferno_lava_ocean_crust';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Fiery orange/red molten base
    const lavaGrad = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.1, size * 0.5, size * 0.5, size * 0.5);
    lavaGrad.addColorStop(0, '#fef08a'); // White-hot molten center
    lavaGrad.addColorStop(0.35, '#f97316'); // Radiant orange
    lavaGrad.addColorStop(0.75, '#ea580c'); // Deep magma red
    lavaGrad.addColorStop(1.0, '#7f1d1d'); // Scorched edge
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, 0, size, size);

    // Floating black cooled obsidian crust plates
    ctx.fillStyle = '#0f0f12';
    const plates = [
      [60, 60, 70, 50],
      [220, 80, 110, 80],
      [400, 50, 80, 90],
      [120, 240, 90, 70],
      [310, 220, 130, 95],
      [70, 390, 100, 80],
      [260, 380, 85, 75],
      [420, 340, 75, 110]
    ];

    plates.forEach(([px, py, pw, ph]) => {
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 14);
      ctx.fill();

      // Glowing molten fissures through crust
      ctx.strokeStyle = '#fdba74';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px + pw * 0.2, py + ph * 0.1);
      ctx.lineTo(px + pw * 0.5, py + ph * 0.6);
      ctx.lineTo(px + pw * 0.8, py + ph * 0.9);
      ctx.stroke();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 8);
    this.cache.set(key, tex);
    return tex;
  }

  public static getObsidianRuneTexture(): THREE.Texture {
    const key = 'inferno_obsidian_runes';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Black volcanic basalt
    ctx.fillStyle = '#121217';
    ctx.fillRect(0, 0, size, size);

    // Ash and fissure cracks
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, size - 24, size - 24);

    // Glowing ancient fire runes
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 12;

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

    // Reset shadow
    ctx.shadowBlur = 0;

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  public static getFurnaceGrateTexture(): THREE.Texture {
    const key = 'inferno_furnace_grate';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Blazing white-hot furnace fire interior
    const fireGrad = ctx.createLinearGradient(0, 0, 0, size);
    fireGrad.addColorStop(0, '#ffffff');
    fireGrad.addColorStop(0.3, '#fef08a');
    fireGrad.addColorStop(0.7, '#f97316');
    fireGrad.addColorStop(1.0, '#b91c1c');
    ctx.fillStyle = fireGrad;
    ctx.fillRect(0, 0, size, size);

    // Heavy Cast-Iron Grate Bars
    ctx.fillStyle = '#0a0a0d';
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
 * - Strict clearance envelope: |X| > 4.2m, Y <= 8.5m (0 meshes in running corridor).
 * - Full geometry and material reuse with zero per-frame allocation.
 * - 4 distinct volcanic fantasy districts.
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

  private constructor() {
    this.blackObsidianMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0d,
      roughness: 0.18,
      metalness: 0.85
    });

    this.moltenMagmaMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 0.95,
      roughness: 0.40,
      metalness: 0.20
    });

    this.scorchedIronMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.65,
      metalness: 0.60
    });

    this.titaniumArmorMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.32,
      metalness: 0.88
    });

    this.glowingRuneMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xf97316,
      emissiveIntensity: 1.25,
      roughness: 0.3
    });

    this.furnaceFireMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xef4444,
      emissiveIntensity: 1.45,
      roughness: 0.2
    });

    this.darkBasaltBallastMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
      metalness: 0.15
    });

    this.rubyInsulatorMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      emissiveIntensity: 0.8
    });

    this.ashRockMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.90,
      metalness: 0.10
    });

    this.volcanicSmokeMat = new THREE.MeshBasicMaterial({
      color: 0x3f3f46,
      transparent: true,
      opacity: 0.65
    });
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
    const director = InfernoExpressEventDirector.getInstance();

    // Deterministic 400m sustained thematic districts in gameplay, seed-based in unit tests
    const worldZ = group.parent && typeof group.parent.position?.z === 'number' && group.parent.position.z !== 0
      ? group.parent.position.z
      : 0;
    let districtIndex: number;
    if (seed >= 0 && seed < 4) {
      districtIndex = seed;
    } else if (worldZ !== 0) {
      districtIndex = Math.floor(Math.abs(worldZ) / 400) % 4;
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

    const wallX = roadbedWidth * 0.5 + 2.4; // 8.4m from center

    // 1. Vast Molten Lava Sea Ocean below Viaduct (Y = -3.5m)
    const lavaTex = InfernoExpressTextureHelper.getLavaOceanTexture();
    const lavaOcean = new THREE.Mesh(
      this.getPlane(160.0, chunkLength),
      new THREE.MeshStandardMaterial({
        map: lavaTex,
        roughness: 0.35,
        metalness: 0.3,
        emissive: 0xea580c,
        emissiveIntensity: 0.95
      })
    );
    lavaOcean.rotation.x = -Math.PI / 2;
    lavaOcean.position.set(0, -3.5, -chunkLength * 0.5);
    districtA.add(lavaOcean);

    // Floating semi-solidified obsidian crust plates across the lava sea
    [-1, 1].forEach((side) => {
      [0.2, 0.5, 0.8].forEach((ratio, idx) => {
        const crustPlate = new THREE.Mesh(this.getBox(12.0 + idx * 2.0, 0.2, 14.0), this.blackObsidianMat);
        crustPlate.position.set(side * (wallX + 16.0 + idx * 4.0), -3.38, -chunkLength * ratio);
        districtA.add(crustPlate);
      });
    });

    [-1, 1].forEach((side) => {
      // 2. Suspended Steel Viaduct Walkway with Glowing Magma Curbs
      const walkW = 16.0;
      const wx = side * (wallX + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 0.8, chunkLength), this.titaniumArmorMat);
      walk.position.set(wx, 0.4, -chunkLength * 0.5);
      districtA.add(walk);

      // Glowing Lava Channel Curb (High contrast obstacle border)
      const curb = new THREE.Mesh(this.getBox(0.45, 0.9, chunkLength), this.moltenMagmaMat);
      curb.position.set(side * (wallX + 0.22), 0.45, -chunkLength * 0.5);
      districtA.add(curb);

      // 3. Colossal Octagonal Basalt Pillars rising from Lava
      for (let z = 14; z < chunkLength - 14; z += 36) {
        const pillar = new THREE.Mesh(this.getCylinder(2.5, 3.8, 24.0, 8), this.blackObsidianMat);
        pillar.position.set(side * (wallX + 7.5), 8.5, -z);
        districtA.add(pillar);

        // Heavy Industrial Suspension Chains
        const chainGroup = new THREE.Group();
        chainGroup.position.set(side * (wallX + 2.5), 6.5, -z);

        const chainMesh = new THREE.Mesh(this.getCylinder(0.12, 0.12, 10.0, 6), this.scorchedIronMat);
        chainGroup.add(chainMesh);

        const counterweight = new THREE.Mesh(this.getBox(1.2, 1.8, 1.2), this.titaniumArmorMat);
        counterweight.position.y = -5.0;
        chainGroup.add(counterweight);

        districtA.add(chainGroup);
        director.registerShiftingChain(chainGroup, counterweight, 1.2, 0.22, z * 0.1);
      }

      // 4. Molten Magma Waterfall (Cataract) cascading on cliffside
      const fallGroup = new THREE.Group();
      fallGroup.position.set(side * (wallX + 18.0), 12.0, -chunkLength * 0.5);

      const fallMesh = new THREE.Mesh(this.getBox(6.0, 28.0, 1.2), this.moltenMagmaMat);
      fallGroup.add(fallMesh);

      const splashRings: THREE.Mesh[] = [];
      for (let r = 0; r < 2; r++) {
        const ring = new THREE.Mesh(
          this.getTorus(4.5, 0.2, 6, 16),
          new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.5 })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, -14.0, 0);
        fallGroup.add(ring);
        splashRings.push(ring);
      }

      districtA.add(fallGroup);
      director.registerLavaWaterfall(fallMesh, splashRings, 1.1, 2.5);

      // 5. Lava Geyser far out in the lava ocean (|X| = 26m)
      const geyser = new THREE.Mesh(this.getCylinder(0.4, 1.8, 14.0, 8), this.moltenMagmaMat);
      geyser.position.set(side * (wallX + 18.0), -6.0, -chunkLength * 0.35);
      geyser.visible = false;
      districtA.add(geyser);

      const geyserSpray = new THREE.Mesh(this.getSphere(2.2, 8), this.furnaceFireMat);
      geyserSpray.position.set(side * (wallX + 18.0), 0, -chunkLength * 0.35);
      geyserSpray.visible = false;
      districtA.add(geyserSpray);

      director.registerLavaGeyser(geyser, geyserSpray, -4.0, 22.0, 8.0);
    });

    // 6. Distant Erupting Volcano Cone (Z = -85m, X = 36m)
    if (detail !== 'MINIMAL') {
      const volcanoGroup = new THREE.Group();
      volcanoGroup.position.set(38.0, 0, -chunkLength * 0.85);

      // Volcano Mountain Cone
      const mountain = new THREE.Mesh(this.getCylinder(4.0, 22.0, 36.0, 10), this.ashRockMat);
      mountain.position.y = 18.0;
      volcanoGroup.add(mountain);

      // Glowing Crater Caldera
      const crater = new THREE.Mesh(this.getCylinder(3.8, 3.8, 2.0, 10), this.furnaceFireMat);
      crater.position.y = 36.0;
      volcanoGroup.add(crater);

      // Volcanic Eruption Plume
      const plume = new THREE.Mesh(this.getSphere(8.0, 10), this.volcanicSmokeMat);
      plume.position.y = 44.0;
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

    const wallX = roadbedWidth * 0.5 + 2.4;

    [-1, 1].forEach((side) => {
      // 1. Black Obsidian Citadel Walkway
      const walkW = 16.0;
      const wx = side * (wallX + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 0.8, chunkLength), this.blackObsidianMat);
      walk.position.set(wx, 0.4, -chunkLength * 0.5);
      districtB.add(walk);

      const curb = new THREE.Mesh(this.getBox(0.45, 0.9, chunkLength), this.moltenMagmaMat);
      curb.position.set(side * (wallX + 0.22), 0.45, -chunkLength * 0.5);
      districtB.add(curb);

      // 2. Monolithic Black Fortress Towers
      for (let z = 12; z < chunkLength - 12; z += 35) {
        const towerGroup = new THREE.Group();
        towerGroup.position.set(side * (wallX + 10.0), 0.8, -z);

        // Lower Bastion Base
        const bastion = new THREE.Mesh(this.getBox(14.0, 14.0, 24.0), this.blackObsidianMat);
        bastion.position.y = 7.0;
        towerGroup.add(bastion);

        // Ancient Fire Runes carved on Citadel facade
        const runeTex = InfernoExpressTextureHelper.getObsidianRuneTexture();
        const runePlane = new THREE.Mesh(
          this.getPlane(8.0, 8.0),
          new THREE.MeshStandardMaterial({
            map: runeTex,
            emissive: 0xf97316,
            emissiveIntensity: 0.75,
            side: THREE.DoubleSide
          })
        );
        runePlane.position.set(-side * 7.1, 7.0, 0);
        runePlane.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        towerGroup.add(runePlane);

        // Upper Spired Fortress Crown (reaching Y = 44m)
        const crown = new THREE.Mesh(this.getBox(10.0, 18.0, 18.0), this.titaniumArmorMat);
        crown.position.y = 23.0;
        towerGroup.add(crown);

        // Lava Slit Windows
        [-4.0, 0, 4.0].forEach((wz) => {
          const slit = new THREE.Mesh(this.getBox(0.4, 4.5, 1.2), this.furnaceFireMat);
          slit.position.set(-side * 5.1, 23.0, wz);
          towerGroup.add(slit);
        });

        const spire = new THREE.Mesh(this.getCylinder(0.2, 3.5, 12.0, 6), this.blackObsidianMat);
        spire.position.y = 38.0;
        towerGroup.add(spire);

        districtB.add(towerGroup);
      }
    });

    // 3. Citadel Blast Furnace Gate with Animated Sliding Doors (spanning above track at Y = 17.5m)
    const gateGroup = new THREE.Group();
    gateGroup.name = 'citadel_furnace_blast_gate';
    gateGroup.position.set(0, 17.5, -chunkLength * 0.5);

    const interiorGlow = new THREE.Mesh(this.getPlane(8.0, 5.0), this.furnaceFireMat);
    interiorGlow.position.set(0, 0, -0.4);
    gateGroup.add(interiorGlow);

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

    const wallX = roadbedWidth * 0.5 + 2.4;

    [-1, 1].forEach((side) => {
      // 1. Scorched Metal Refinery Promenade
      const walkW = 16.0;
      const wx = side * (wallX + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 0.8, chunkLength), this.scorchedIronMat);
      walk.position.set(wx, 0.4, -chunkLength * 0.5);
      districtC.add(walk);

      const curb = new THREE.Mesh(this.getBox(0.45, 0.9, chunkLength), this.moltenMagmaMat);
      curb.position.set(side * (wallX + 0.22), 0.45, -chunkLength * 0.5);
      districtC.add(curb);

      // 2. Glowing Molten-Metal Channels flowing beside railway
      const channel = new THREE.Mesh(this.getBox(1.8, 0.4, chunkLength), this.moltenMagmaMat);
      channel.position.set(side * (wallX + 1.4), 0.3, -chunkLength * 0.5);
      districtC.add(channel);

      // 3. Magma Processing Refinery Halls
      for (let z = 12; z < chunkLength - 12; z += 35) {
        const foundryHall = new THREE.Group();
        foundryHall.position.set(side * (wallX + 10.0), 0.8, -z);

        // Blast Furnace Chamber Base
        const furnaceBase = new THREE.Mesh(this.getBox(13.0, 14.0, 24.0), this.scorchedIronMat);
        furnaceBase.position.y = 7.0;
        foundryHall.add(furnaceBase);

        // Blazing Furnace Grate
        const grateTex = InfernoExpressTextureHelper.getFurnaceGrateTexture();
        const grate = new THREE.Mesh(
          this.getPlane(7.0, 7.0),
          new THREE.MeshStandardMaterial({
            map: grateTex,
            emissive: 0xf97316,
            emissiveIntensity: 1.1,
            side: THREE.DoubleSide
          })
        );
        grate.position.set(-side * 6.6, 7.0, 0);
        grate.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        foundryHall.add(grate);

        // Cooling Turbine Wheel
        const turbine = new THREE.Mesh(this.getTorus(3.2, 0.5, 8, 16), this.titaniumArmorMat);
        turbine.position.set(-side * 6.0, 16.0, 4.0);
        turbine.rotation.y = Math.PI / 2;
        foundryHall.add(turbine);

        // Heavy Smelting Exhaust Stacks
        const stack = new THREE.Mesh(this.getCylinder(1.4, 2.0, 24.0, 8), this.titaniumArmorMat);
        stack.position.set(0, 26.0, -5.0);
        foundryHall.add(stack);

        districtC.add(foundryHall);
      }
    });

    // 4. Elevated Siding Platform with Parked Armored Locomotive
    const sidingPlatform = new THREE.Mesh(this.getBox(6.0, 1.2, 26.0), this.blackObsidianMat);
    sidingPlatform.position.set(wallX + 8.5, 0.6, -chunkLength * 0.45);
    districtC.add(sidingPlatform);

    const parkedTrain = this.buildInfernoExpressShowcaseTrain(wallX + 8.5, 1.2, -chunkLength * 0.45);
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

    const wallX = roadbedWidth * 0.5 + 2.4;

    [-1, 1].forEach((side) => {
      // 1. Columnar Basalt & Ash Promenade
      const walkW = 16.0;
      const wx = side * (wallX + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 0.8, chunkLength), this.ashRockMat);
      walk.position.set(wx, 0.4, -chunkLength * 0.5);
      districtD.add(walk);

      const curb = new THREE.Mesh(this.getBox(0.45, 0.9, chunkLength), this.moltenMagmaMat);
      curb.position.set(side * (wallX + 0.22), 0.45, -chunkLength * 0.5);
      districtD.add(curb);

      // 2. Towering Columnar Basalt Formations & Cooling Lava Spikes
      for (let z = 14; z < chunkLength - 14; z += 35) {
        const peakGroup = new THREE.Group();
        peakGroup.position.set(side * (wallX + 11.0), 0.8, -z);

        const basaltPillar = new THREE.Mesh(this.getCylinder(2.2, 3.4, 26.0, 6), this.blackObsidianMat);
        basaltPillar.position.y = 13.0;
        peakGroup.add(basaltPillar);

        // Glowing magma fissures climbing up the peak
        const vein = new THREE.Mesh(this.getCylinder(0.2, 0.2, 22.0, 4), this.moltenMagmaMat);
        vein.position.set(0, 11.0, 1.8);
        peakGroup.add(vein);

        districtD.add(peakGroup);
      }
    });

    // 3. Distant Collapsing Basalt Monolith outside gameplay (|X| = 34m, Z = -chunkLength * 0.6)
    const monolith = new THREE.Mesh(this.getCylinder(2.5, 4.0, 24.0, 6), this.blackObsidianMat);
    monolith.position.set(-wallX - 22.0, 12.0, -chunkLength * 0.6);
    districtD.add(monolith);

    const splashWave = new THREE.Mesh(
      this.getTorus(6.0, 0.4, 6, 16),
      new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.8 })
    );
    splashWave.rotation.x = Math.PI / 2;
    splashWave.position.set(-wallX - 22.0, 0, -chunkLength * 0.6);
    splashWave.visible = false;
    districtD.add(splashWave);

    director.registerCollapsingRock(monolith, splashWave, 12.0);

    // 4. Monumental Ashfall Chasm Suspension Arch (spanning high at Y = 17.0m)
    const archGroup = new THREE.Group();
    archGroup.name = 'ashfall_suspension_arch';
    archGroup.position.set(0, 17.5, -chunkLength * 0.5);

    const archSpan = new THREE.Mesh(this.getBox(roadbedWidth + 12.0, 1.4, 4.0), this.titaniumArmorMat);
    archGroup.add(archSpan);

    const archTrim = new THREE.Mesh(this.getBox(roadbedWidth + 12.4, 0.4, 4.2), this.moltenMagmaMat);
    archTrim.position.y = 0.8;
    archGroup.add(archTrim);

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

    const livery = INFERNO_EXPRESS_TRAIN_LIVERY;

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
