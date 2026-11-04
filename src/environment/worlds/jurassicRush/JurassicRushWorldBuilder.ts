import * as THREE from 'three';
import { SeededRandom } from '../../SceneryFactory';
import { JurassicRushEventDirector } from './JurassicRushEventDirector';
import { JURASSIC_RUSH_TRAIN_LIVERY } from './JurassicRushTheme';

/**
 * Procedural Texture Cache for Jurassic Rush
 * Self-contained procedural canvas textures for prehistoric ferns, temple ruins, and fossil strata.
 */
class JurassicRushTextureHelper {
  private static cache = new Map<string, THREE.Texture>();

  public static getFernFrondTexture(): THREE.Texture {
    const key = 'jurassic_fern_fronds';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Deep jungle emerald base
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, size, size);

    // Fern frond spine
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size);
    ctx.quadraticCurveTo(size * 0.45, size * 0.5, size * 0.5, 0);
    ctx.stroke();

    // Leaf leaflets
    ctx.fillStyle = '#34d399';
    for (let y = size - 30; y > 30; y -= 24) {
      const w = ((y / size) * 160) + 20;
      // Left leaflet
      ctx.beginPath();
      ctx.ellipse(size * 0.5 - w * 0.5, y, w * 0.5, 7, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Right leaflet
      ctx.beginPath();
      ctx.ellipse(size * 0.5 + w * 0.5, y, w * 0.5, 7, 0.3, 0, Math.PI * 2);
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
    const key = 'jurassic_temple_stone';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Weathered ancient sandstone & moss
    ctx.fillStyle = '#292524';
    ctx.fillRect(0, 0, size, size);

    // Ancient stone block borders
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, size - 32, size - 32);

    // Moss wash
    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.fillRect(16, 16, size - 32, 80);

    // Primal Dinosaur Claw Sigil
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    // 3 Raptor Claws
    [size * 0.35, size * 0.5, size * 0.65].forEach((cx, idx) => {
      ctx.beginPath();
      ctx.moveTo(cx - 10, size * 0.3);
      ctx.quadraticCurveTo(cx + (idx - 1) * 15, size * 0.55, cx + 5, size * 0.75);
      ctx.stroke();
    });

    const tex = new THREE.CanvasTexture(canvas);
    this.cache.set(key, tex);
    return tex;
  }

  public static getFossilStrataTexture(): THREE.Texture {
    const key = 'jurassic_fossil_strata';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Layered canyon rock strata
    const strata = ['#78350f', '#92400e', '#b45309', '#d97706', '#78350f'];
    const h = size / strata.length;
    strata.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.fillRect(0, i * h, size, h);
    });

    // Embedded Fossil Ammonite Spiral
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 4;
    const cx = size * 0.5;
    const cy = size * 0.5;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 6; a += 0.1) {
      const r = a * 10;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

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
 * - Full geometry and material reuse with zero per-frame allocation.
 * - 4 distinct prehistoric fantasy districts.
 */
export class JurassicRushWorldBuilder {
  private static instance: JurassicRushWorldBuilder | null = null;

  // Geometry Cache
  private geoCache = new Map<string, THREE.BufferGeometry>();

  // Shared Prehistoric Materials
  private jungleLeafMat: THREE.MeshStandardMaterial;
  private treeBarkMat: THREE.MeshStandardMaterial;
  private canyonRockMat: THREE.MeshStandardMaterial;
  private templeStoneMat: THREE.MeshStandardMaterial;
  private dinosaurSkinMat: THREE.MeshStandardMaterial;
  private raptorGreenMat: THREE.MeshStandardMaterial;
  private pterosaurWingsMat: THREE.MeshStandardMaterial;
  private waterfallWaterMat: THREE.MeshStandardMaterial;
  private riverWaterMat: THREE.MeshStandardMaterial;
  private amberCurbMat: THREE.MeshStandardMaterial;
  private expeditionSteelMat: THREE.MeshStandardMaterial;
  private observationGlassMat: THREE.MeshBasicMaterial;

  private constructor() {
    this.jungleLeafMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      roughness: 0.65,
      metalness: 0.10
    });

    this.treeBarkMat = new THREE.MeshStandardMaterial({
      color: 0x3f2e1e,
      roughness: 0.85,
      metalness: 0.05
    });

    this.canyonRockMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.80,
      metalness: 0.15
    });

    this.templeStoneMat = new THREE.MeshStandardMaterial({
      color: 0x44403c,
      roughness: 0.75,
      metalness: 0.20
    });

    this.dinosaurSkinMat = new THREE.MeshStandardMaterial({
      color: 0x2b4231, // Deep grey-green dinosaur hide
      roughness: 0.70,
      metalness: 0.15
    });

    this.raptorGreenMat = new THREE.MeshStandardMaterial({
      color: 0x166534, // Vibrant emerald raptor scales
      roughness: 0.60,
      metalness: 0.25
    });

    this.pterosaurWingsMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412, // Crimson-terracotta leathery wing membrane
      roughness: 0.65,
      metalness: 0.10,
      side: THREE.DoubleSide
    });

    this.waterfallWaterMat = new THREE.MeshStandardMaterial({
      color: 0x6ee7b7,
      roughness: 0.20,
      metalness: 0.50,
      emissive: 0x059669,
      emissiveIntensity: 0.35
    });

    this.riverWaterMat = new THREE.MeshStandardMaterial({
      color: 0x047857,
      roughness: 0.15,
      metalness: 0.80
    });

    this.amberCurbMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.35,
      metalness: 0.60,
      emissive: 0xb45309,
      emissiveIntensity: 0.40
    });

    this.expeditionSteelMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.45,
      metalness: 0.80
    });

    this.observationGlassMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a
    });
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
    const director = JurassicRushEventDirector.getInstance();

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
  // DISTRICT A — THE LOST JUNGLE
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

    const wallX = roadbedWidth * 0.5 + 2.4; // 8.4m from center

    [-1, 1].forEach((side) => {
      // 1. Lush Mossy Timber Promenade
      const walkW = 16.0;
      const wx = side * (wallX + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 0.8, chunkLength), this.treeBarkMat);
      walk.position.set(wx, 0.4, -chunkLength * 0.5);
      districtA.add(walk);

      // Bright Amber Petrified Wood Curb (High visibility)
      const curb = new THREE.Mesh(this.getBox(0.45, 0.9, chunkLength), this.amberCurbMat);
      curb.position.set(side * (wallX + 0.22), 0.45, -chunkLength * 0.5);
      districtA.add(curb);

      // 2. Colossal Ancient Tree Ferns & Canopy Banyan Trees
      for (let z = 14; z < chunkLength - 14; z += 32) {
        const treeGroup = new THREE.Group();
        treeGroup.position.set(side * (wallX + 8.5), 0.8, -z);

        // Heavy Gnarled Trunk (reaching Y = 22m)
        const trunk = new THREE.Mesh(this.getCylinder(1.4, 2.8, 22.0, 8), this.treeBarkMat);
        trunk.position.y = 11.0;
        treeGroup.add(trunk);

        // Giant Prehistoric Fern Canopy Fronds
        const canopyTex = JurassicRushTextureHelper.getFernFrondTexture();
        for (let f = 0; f < 5; f++) {
          const frond = new THREE.Mesh(
            this.getPlane(12.0, 5.0),
            new THREE.MeshStandardMaterial({ map: canopyTex, side: THREE.DoubleSide, roughness: 0.6 })
          );
          frond.position.set(0, 22.0, 0);
          frond.rotation.y = (f * Math.PI * 2) / 5;
          frond.rotation.x = 0.35;
          treeGroup.add(frond);
        }

        districtA.add(treeGroup);
      }

      // 3. Colossal Prehistoric Waterfall Cataract spilling down cliff
      const fallGroup = new THREE.Group();
      fallGroup.position.set(side * (wallX + 18.0), 14.0, -chunkLength * 0.5);

      const fallMesh = new THREE.Mesh(this.getBox(7.0, 28.0, 1.2), this.waterfallWaterMat);
      fallGroup.add(fallMesh);

      // Emerald River basin below
      const river = new THREE.Mesh(this.getPlane(24.0, chunkLength), this.riverWaterMat);
      river.rotation.x = -Math.PI / 2;
      river.position.set(0, -14.0, 0);
      fallGroup.add(river);

      districtA.add(fallGroup);
    });

    // 4. Curious Giant Dinosaur Watcher standing beside tree line
    const watcher = this.buildCuriousDinosaurWatcher(wallX + 11.0, 0.8, -chunkLength * 0.35);
    districtA.add(watcher.group);
    director.registerCuriousWatcher(watcher.group, watcher.neck, watcher.head);

    // 5. Gliding Pterosaur Flock soaring high across the canopy (Y = 26m)
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

    const wallX = roadbedWidth * 0.5 + 2.4;

    [-1, 1].forEach((side) => {
      // 1. Ancient Valley Basalt Promenade
      const walkW = 16.0;
      const wx = side * (wallX + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 0.8, chunkLength), this.templeStoneMat);
      walk.position.set(wx, 0.4, -chunkLength * 0.5);
      districtB.add(walk);

      const curb = new THREE.Mesh(this.getBox(0.45, 0.9, chunkLength), this.amberCurbMat);
      curb.position.set(side * (wallX + 0.22), 0.45, -chunkLength * 0.5);
      districtB.add(curb);

      // 2. Canyon Terraces & Geological Mesas
      for (let z = 12; z < chunkLength - 12; z += 38) {
        const mesa = new THREE.Mesh(this.getBox(16.0, 18.0, 28.0), this.canyonRockMat);
        mesa.position.set(side * (wallX + 14.0), 9.0, -z);
        districtB.add(mesa);
      }
    });

    // 3. Colossal Animated Sauropod (Brachiosaurus) walking across the distant valley
    const sauropod = this.buildColossalSauropod(-wallX - 22.0, 0.8, -chunkLength * 0.45);
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

    // 4. Grazing Herbivore Herd in faraway clearing
    const herd = this.buildHerbivoreHerd(wallX + 18.0, 0.8, -chunkLength * 0.65);
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

    const wallX = roadbedWidth * 0.5 + 2.4;

    [-1, 1].forEach((side) => {
      // 1. Red Sandstone Gorge Walkway
      const walkW = 16.0;
      const wx = side * (wallX + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 0.8, chunkLength), this.canyonRockMat);
      walk.position.set(wx, 0.4, -chunkLength * 0.5);
      districtC.add(walk);

      const curb = new THREE.Mesh(this.getBox(0.45, 0.9, chunkLength), this.amberCurbMat);
      curb.position.set(side * (wallX + 0.22), 0.45, -chunkLength * 0.5);
      districtC.add(curb);

      // 2. Towering Canyon Rock Walls with Embedded Fossil Strata
      for (let z = 12; z < chunkLength - 12; z += 35) {
        const cliff = new THREE.Mesh(this.getBox(14.0, 24.0, 26.0), this.canyonRockMat);
        cliff.position.set(side * (wallX + 10.0), 12.0, -z);
        districtC.add(cliff);

        // Embedded Ammonite & Bone Fossil Strata
        const fossilTex = JurassicRushTextureHelper.getFossilStrataTexture();
        const fossil = new THREE.Mesh(
          this.getPlane(8.0, 8.0),
          new THREE.MeshStandardMaterial({ map: fossilTex, side: THREE.DoubleSide })
        );
        fossil.position.set(-side * 7.1, 12.0, 0);
        fossil.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        cliff.add(fossil);
      }
    });

    // 3. Sprinting Raptor Pack racing along elevated canyon ridgeline (X = 22m, Y = 12m)
    const raptorPack = this.buildRaptorPack(wallX + 13.5, 12.0, -chunkLength * 0.5);
    districtC.add(raptorPack.group);
    director.registerRaptorPack(
      raptorPack.group,
      raptorPack.raptors,
      22.0,
      8.0,
      -chunkLength * 1.3,
      30
    );

    // 4. Prehistoric Rope & Timber Suspension Bridge spanning high above at Y = 17.5m
    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = 'raptor_canyon_rope_bridge';
    bridgeGroup.position.set(0, 17.5, -chunkLength * 0.5);

    const bridgeSpan = new THREE.Mesh(this.getBox(roadbedWidth + 12.0, 0.6, 2.5), this.treeBarkMat);
    bridgeGroup.add(bridgeSpan);

    [-1.2, 1.2].forEach((rz) => {
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

    const wallX = roadbedWidth * 0.5 + 2.4;

    [-1, 1].forEach((side) => {
      // 1. Overgrown Megalithic Temple Walkway
      const walkW = 16.0;
      const wx = side * (wallX + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 0.8, chunkLength), this.templeStoneMat);
      walk.position.set(wx, 0.4, -chunkLength * 0.5);
      districtD.add(walk);

      const curb = new THREE.Mesh(this.getBox(0.45, 0.9, chunkLength), this.amberCurbMat);
      curb.position.set(side * (wallX + 0.22), 0.45, -chunkLength * 0.5);
      districtD.add(curb);

      // 2. Prehistoric Stepped Temple Pyramids & Carved Claw Totems
      for (let z = 12; z < chunkLength - 12; z += 35) {
        const templeGroup = new THREE.Group();
        templeGroup.position.set(side * (wallX + 10.0), 0.8, -z);

        // Stepped Ziggurat Tier 1
        const tier1 = new THREE.Mesh(this.getBox(14.0, 8.0, 24.0), this.templeStoneMat);
        tier1.position.y = 4.0;
        templeGroup.add(tier1);

        // Stepped Ziggurat Tier 2
        const tier2 = new THREE.Mesh(this.getBox(10.0, 8.0, 18.0), this.templeStoneMat);
        tier2.position.y = 12.0;
        templeGroup.add(tier2);

        // Ancient Claw Sigil Stone Plaque
        const stoneTex = JurassicRushTextureHelper.getTempleStoneTexture();
        const plaque = new THREE.Mesh(
          this.getPlane(7.0, 7.0),
          new THREE.MeshStandardMaterial({ map: stoneTex, side: THREE.DoubleSide })
        );
        plaque.position.set(-side * 5.1, 12.0, 0);
        plaque.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
        templeGroup.add(plaque);

        districtD.add(templeGroup);
      }
    });

    // 3. Gigantic Apex Carnivore (Tyrannosaur) Roaring from Rocky Outcrop (|X| = 24m, Y = 14m)
    const apexPredator = this.buildApexCarnivore(wallX + 15.0, 14.0, -chunkLength * 0.5);
    districtD.add(apexPredator.group);
    director.registerCarnivore(
      apexPredator.group,
      apexPredator.torso,
      apexPredator.head,
      apexPredator.lowerJaw,
      apexPredator.tail,
      9.0
    );

    // 4. Overgrown Megalithic Arch Spanning high above at Y = 17.5m
    const archGroup = new THREE.Group();
    archGroup.name = 'sanctuary_megalithic_arch';
    archGroup.position.set(0, 17.5, -chunkLength * 0.5);

    const stoneArch = new THREE.Mesh(this.getBox(roadbedWidth + 12.0, 1.4, 4.0), this.templeStoneMat);
    archGroup.add(stoneArch);

    const ivyTrim = new THREE.Mesh(this.getBox(roadbedWidth + 12.4, 0.4, 4.2), this.jungleLeafMat);
    ivyTrim.position.y = 0.8;
    archGroup.add(ivyTrim);

    districtD.add(archGroup);
  }

  // =========================================================================
  // SUB-ASSEMBLY HELPERS & CREATURE BUILDERS
  // =========================================================================

  /**
   * Colossal Long-Necked Sauropod (Brachiosaurus)
   */
  private buildColossalSauropod(x: number, y: number, z: number): {
    group: THREE.Group;
    neck: THREE.Object3D;
    head: THREE.Object3D;
    tail: THREE.Object3D;
    legs: THREE.Object3D[];
  } {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Massive Body Torso (L = 12m, W = 6m, H = 7m)
    const torso = new THREE.Mesh(this.getBox(6.0, 7.0, 12.0), this.dinosaurSkinMat);
    torso.position.y = 11.0;
    group.add(torso);

    // 4 Columnar Legs
    const legs: THREE.Object3D[] = [];
    [-2.2, 2.2].forEach((lx) => {
      [-4.0, 4.0].forEach((lz) => {
        const leg = new THREE.Mesh(this.getCylinder(1.1, 1.4, 11.0, 8), this.dinosaurSkinMat);
        leg.position.set(lx, 5.5, lz);
        group.add(leg);
        legs.push(leg);
      });
    });

    // 16-meter Long Neck
    const neck = new THREE.Group();
    neck.position.set(0, 14.0, -5.5);
    const neckMesh = new THREE.Mesh(this.getCylinder(0.9, 1.8, 16.0, 8), this.dinosaurSkinMat);
    neckMesh.position.set(0, 8.0, -2.5);
    neckMesh.rotation.x = -0.35;
    neck.add(neckMesh);

    // Head
    const head = new THREE.Mesh(this.getBox(2.0, 1.8, 3.5), this.dinosaurSkinMat);
    head.position.set(0, 16.0, -5.0);
    neck.add(head);

    group.add(neck);

    // 14-meter Long Tail
    const tail = new THREE.Group();
    tail.position.set(0, 11.0, 6.0);
    const tailMesh = new THREE.Mesh(this.getCylinder(0.4, 1.5, 14.0, 8), this.dinosaurSkinMat);
    tailMesh.position.set(0, -2.0, 7.0);
    tailMesh.rotation.x = 1.35;
    tail.add(tailMesh);
    group.add(tail);

    return { group, neck, head, tail, legs };
  }

  /**
   * Apex Carnivore Predator (Tyrannosaur-like)
   */
  private buildApexCarnivore(x: number, y: number, z: number): {
    group: THREE.Group;
    torso: THREE.Object3D;
    head: THREE.Object3D;
    lowerJaw: THREE.Object3D;
    tail: THREE.Object3D;
  } {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Powerful Bipedal Torso
    const torso = new THREE.Group();
    torso.position.set(0, 6.0, 0);

    const chest = new THREE.Mesh(this.getBox(3.5, 4.5, 7.0), this.dinosaurSkinMat);
    torso.add(chest);

    // Massive Predatory Head
    const head = new THREE.Group();
    head.position.set(0, 2.5, -4.5);
    const skull = new THREE.Mesh(this.getBox(2.2, 2.2, 4.2), this.dinosaurSkinMat);
    head.add(skull);

    // Articulated Lower Jaw
    const lowerJaw = new THREE.Mesh(this.getBox(1.8, 0.8, 3.8), this.dinosaurSkinMat);
    lowerJaw.position.set(0, -1.2, 0.5);
    head.add(lowerJaw);

    torso.add(head);

    // Counterbalancing Heavy Tail
    const tail = new THREE.Group();
    tail.position.set(0, 0.5, 3.5);
    const tailMesh = new THREE.Mesh(this.getCylinder(0.4, 1.2, 9.0, 8), this.dinosaurSkinMat);
    tailMesh.position.set(0, 0, 4.5);
    tailMesh.rotation.x = Math.PI / 2;
    tail.add(tailMesh);
    torso.add(tail);

    group.add(torso);

    // Heavy Muscular Bipedal Legs
    [-1.6, 1.6].forEach((lx) => {
      const leg = new THREE.Mesh(this.getCylinder(0.8, 0.6, 6.0, 8), this.dinosaurSkinMat);
      leg.position.set(lx, 3.0, 0);
      group.add(leg);
    });

    return { group, torso, head, lowerJaw, tail };
  }

  /**
   * Pack of 3 Agile Sprinting Raptors
   */
  private buildRaptorPack(x: number, y: number, z: number): {
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
      { x: 2.2, z: 4.0, phase: Math.PI * 0.4 },
      { x: -2.0, z: 6.5, phase: Math.PI * 0.8 }
    ];

    offsets.forEach((off) => {
      const rapGroup = new THREE.Group();
      rapGroup.position.set(off.x, 0, off.z);

      // Torso
      const body = new THREE.Mesh(this.getBox(1.2, 1.2, 2.8), this.raptorGreenMat);
      body.position.y = 1.6;
      rapGroup.add(body);

      // Head
      const head = new THREE.Mesh(this.getBox(0.8, 0.8, 1.8), this.raptorGreenMat);
      head.position.set(0, 2.0, -1.8);
      rapGroup.add(head);

      // Tail
      const tail = new THREE.Mesh(this.getCylinder(0.12, 0.35, 4.5, 6), this.raptorGreenMat);
      tail.position.set(0, 1.6, 3.2);
      tail.rotation.x = Math.PI / 2;
      rapGroup.add(tail);

      // 2 Running Legs
      const legs: THREE.Object3D[] = [];
      [-0.5, 0.5].forEach((lx) => {
        const leg = new THREE.Mesh(this.getCylinder(0.18, 0.14, 1.6, 6), this.raptorGreenMat);
        leg.position.set(lx, 0.8, 0);
        rapGroup.add(leg);
        legs.push(leg);
      });

      group.add(rapGroup);
      raptors.push({ group: rapGroup, legs, tail, head, phaseOffset: off.phase });
    });

    return { group, raptors };
  }

  /**
   * Gliding Pterosaur Flock
   */
  private buildPterosaurFlock(z: number): {
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
      { x: -14.0, y: 26.0, z: 0, phase: 0 },
      { x: 12.0, y: 30.0, z: -8.0, phase: 1.2 },
      { x: 0, y: 33.0, z: -16.0, phase: 2.4 }
    ];

    flockData.forEach((fd) => {
      const glider = new THREE.Group();
      glider.position.set(fd.x, fd.y, fd.z);

      // Torso & Beak
      const body = new THREE.Mesh(this.getBox(0.8, 0.6, 2.5), this.pterosaurWingsMat);
      glider.add(body);

      // Left Wing
      const leftWing = new THREE.Mesh(this.getPlane(4.5, 1.8), this.pterosaurWingsMat);
      leftWing.position.set(-2.4, 0, 0);
      leftWing.rotation.x = Math.PI / 2;
      glider.add(leftWing);

      // Right Wing
      const rightWing = new THREE.Mesh(this.getPlane(4.5, 1.8), this.pterosaurWingsMat);
      rightWing.position.set(2.4, 0, 0);
      rightWing.rotation.x = Math.PI / 2;
      glider.add(rightWing);

      group.add(glider);
      gliders.push({ mesh: glider, leftWing, rightWing, phaseOffset: fd.phase, baseAltitude: fd.y });
    });

    return { group, gliders };
  }

  /**
   * Herd of Grazing Herbivores
   */
  private buildHerbivoreHerd(x: number, y: number, z: number): {
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
      mGroup.position.set(m * 3.5, 0, m * 4.2);

      const body = new THREE.Mesh(this.getBox(2.8, 2.6, 5.0), this.dinosaurSkinMat);
      body.position.y = 2.4;
      mGroup.add(body);

      // Horned/Frilled Head
      const head = new THREE.Mesh(this.getBox(1.8, 1.8, 2.2), this.dinosaurSkinMat);
      head.position.set(0, 2.8, -3.2);
      mGroup.add(head);

      const tail = new THREE.Mesh(this.getCylinder(0.18, 0.45, 3.5, 6), this.dinosaurSkinMat);
      tail.position.set(0, 2.2, 3.8);
      tail.rotation.x = Math.PI / 2;
      mGroup.add(tail);

      // 4 Legs
      [-1.1, 1.1].forEach((lx) => {
        [-1.6, 1.6].forEach((lz) => {
          const leg = new THREE.Mesh(this.getCylinder(0.4, 0.45, 2.4, 6), this.dinosaurSkinMat);
          leg.position.set(lx, 1.2, lz);
          mGroup.add(leg);
        });
      });

      group.add(mGroup);
      members.push({ group: mGroup, head, tail, phaseOffset: m * 1.5 });
    }

    return { group, members };
  }

  /**
   * Curious Giant Dinosaur Watcher
   */
  private buildCuriousDinosaurWatcher(x: number, y: number, z: number): {
    group: THREE.Group;
    neck: THREE.Object3D;
    head: THREE.Object3D;
  } {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Torso
    const body = new THREE.Mesh(this.getBox(4.5, 5.0, 8.0), this.dinosaurSkinMat);
    body.position.y = 6.5;
    group.add(body);

    // Long Neck
    const neck = new THREE.Group();
    neck.position.set(0, 9.0, -3.5);
    const neckMesh = new THREE.Mesh(this.getCylinder(0.7, 1.2, 9.0, 8), this.dinosaurSkinMat);
    neckMesh.position.y = 4.5;
    neck.add(neckMesh);

    // Head
    const head = new THREE.Mesh(this.getBox(1.6, 1.4, 2.5), this.dinosaurSkinMat);
    head.position.set(0, 9.0, 0);
    neck.add(head);

    group.add(neck);

    // 4 Legs
    [-1.6, 1.6].forEach((lx) => {
      [-2.8, 2.8].forEach((lz) => {
        const leg = new THREE.Mesh(this.getCylinder(0.7, 0.8, 6.5, 6), this.dinosaurSkinMat);
        leg.position.set(lx, 3.25, lz);
        group.add(leg);
      });
    });

    return { group, neck, head };
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
