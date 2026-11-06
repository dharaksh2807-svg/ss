import * as THREE from 'three';
import { SeededRandom } from '../../SceneryFactory';
import { TextureGenerator } from '../../../scene/TextureGenerator';
import { RahulComedyEventDirector } from './RahulComedyEventDirector';
import { CurvedShaderManager } from '../../../scene/CurvedShader';

/**
 * RahulverseTextureCache
 * Self-contained procedural canvas texture generator for Rahulverse 2.0.
 * Generates satirical billboards, signs, video screens, and caricatures.
 */
class RahulverseTextureCache {
  private static textures: Map<string, THREE.Texture> = new Map();

  private static getOrCreate(key: string, draw: () => HTMLCanvasElement): THREE.Texture {
    if (typeof document === 'undefined') {
      return new THREE.Texture();
    }
    if (this.textures.has(key)) {
      return this.textures.get(key)!;
    }
    const canvas = draw();
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    this.textures.set(key, tex);
    return tex;
  }

  public static getFinishLineFlipTexture(isStart: boolean): THREE.Texture {
    const key = isStart ? 'rv_flip_start_next' : 'rv_flip_finish_line';
    return this.getOrCreate(key, () => {
      const w = 512;
      const h = 160;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      if (!isStart) {
        // Front: Official Finish Line
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(0.5, '#fbbf24');
        grad.addColorStop(1, '#f59e0b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, w - 8, h - 8);

        // Checkered header & footer bars
        const checkW = 16;
        for (let x = 8; x < w - 8; x += checkW) {
          ctx.fillStyle = ((x / checkW) % 2 === 0) ? '#000000' : '#ffffff';
          ctx.fillRect(x, 8, checkW, 14);
          ctx.fillRect(x, h - 22, checkW, 14);
        }

        ctx.fillStyle = '#0f172a';
        ctx.font = '900 36px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏁 FINISH LINE 🏁', w * 0.5, 75);

        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 18px monospace';
        ctx.fillText('★ CONGRATULATIONS! YOU HAVE ARRIVED! ★', w * 0.5, 115);
      } else {
        // Back: Plot twist: Next Yatra Starts Here
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, '#dc2626');
        grad.addColorStop(0.5, '#ea580c');
        grad.addColorStop(1, '#dc2626');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#450a0a';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, w - 8, h - 8);

        // Flashing warning border
        ctx.fillStyle = '#fbbf24';
        ctx.font = '900 30px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚩 NEXT YATRA STARTS HERE 🚩', w * 0.5, 65);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 20px monospace';
        ctx.fillText('REMAINING DISTANCE: 3,000 KM TO GO', w * 0.5, 105);

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('NO REST FOR THE RUNNER • REVISED FINISH IN SIGHT', w * 0.5, 135);
      }

      return canvas;
    });
  }

  public static getRevisedFinishTexture(): THREE.Texture {
    return this.getOrCreate('rv_revised_finish', () => {
      const w = 384;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#0369a1';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, w - 8, h - 8);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('REVISED FINISH LINE: MAYBE', w * 0.5, 52);

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('★ NEXT MILESTONE: INFINITY ★', w * 0.5, 92);

      return canvas;
    });
  }

  public static getPointOfOrderButtonTexture(): THREE.Texture {
    return this.getOrCreate('rv_point_of_order_btn', () => {
      const w = 256;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(128, 128, 118, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 12;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 28px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('POINT OF', 128, 110);
      ctx.fillText('ORDER', 128, 150);

      ctx.fillStyle = '#fef08a';
      ctx.font = '900 16px monospace';
      ctx.fillText('SLAM TO INTERRUPT', 128, 190);

      return canvas;
    });
  }

  public static getPlotTwistBillboardTexture(): THREE.Texture {
    return this.getOrCreate('rv_plot_twist_billboard', () => {
      const w = 512;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#581c87');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 8;
      ctx.strokeRect(6, 6, w - 12, h - 12);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 32px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★ PLOT TWIST UNLOCKED ★', w * 0.5, 68);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('REALITY REVERSED!', w * 0.5, 120);

      ctx.fillStyle = '#f472b6';
      ctx.font = '900 24px "Trebuchet MS", sans-serif';
      ctx.fillText('WHO IS CHASING WHOM?!', w * 0.5, 172);

      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('🌀 MULTIVERSE LOOP ACTIVE 🌀', w * 0.5, 220);

      return canvas;
    });
  }

  public static getEmptyChairSpeechBubbleTexture(): THREE.Texture {
    return this.getOrCreate('rv_empty_chair_bubble', () => {
      const w = 384;
      const h = 192;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, w - 8, h - 8);

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(6, 6, w - 12, 38);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 18px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔴 PRIME TIME SHOWDOWN', w * 0.5, 32);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('"EMPTY CHAIR REFUSES', w * 0.5, 82);
      ctx.fillText('TO ANSWER TOUGH', w * 0.5, 112);
      ctx.fillText('QUESTIONS!"', w * 0.5, 142);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('★ SILENCE DECLARED INTENTIONAL ★', w * 0.5, 175);

      return canvas;
    });
  }

  public static getCarnivalMarqueeTexture(): THREE.Texture {
    return this.getOrCreate('rv_carnival_marquee', () => {
      const w = 512;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#4a044e';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, w - 8, h - 8);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 28px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎪 ALLIANCE MUSICAL CHAIRS 🎪', w * 0.5, 52);

      ctx.fillStyle = '#e879f9';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('EVERYONE DESERVES THE MIDDLE SEAT!', w * 0.5, 94);

      return canvas;
    });
  }
}

/**
 * RahulSatireWorldBuilder
 * High-quality 3D Political Comedy & Satire World Builder for Rahulverse: The Never-Ending Yatra.
 * Transforms the environment into an extraordinary, hilarious, visually spectacular cartoon universe:
 * - District A: The Infinite Yatra (monumental finish flip arch, walking shoe, unfolding route map, cheering crowds)
 * - District B: Parliament.exe Has Stopped Working (grand colonnade, runaway mic keep-away, point-of-order button, reverse debate clock, flying document vortex)
 * - District C: The Press Conference Labyrinth (multi-tier news studios, 4-member media conga line, TV anchor arguing with empty chair, teacup debate)
 * - District D: The Great Alliance Amusement Park (coalition musical chairs carousel, clashing puzzle pieces, kinetic monumental handshake)
 * - District E: The Political Multiverse Glitch (twin rival swap portals with cartoon Rahul/Modi diorama, cosmic microphone space launch, glitch billboards)
 */
export class RahulSatireWorldBuilder {
  private static instance: RahulSatireWorldBuilder;

  // Geometry Cache for performance & pooling
  private geoCache: Map<string, THREE.BufferGeometry> = new Map();

  // Materials Palette
  private roadbedWallMat: THREE.MeshStandardMaterial;
  private yatraWhiteMat: THREE.MeshStandardMaterial;
  private yatraBlueMat: THREE.MeshStandardMaterial;
  private yatraOrangeMat: THREE.MeshStandardMaterial;
  private yatraGreenMat: THREE.MeshStandardMaterial;
  private goldMetalMat: THREE.MeshStandardMaterial;
  private parliamentSandstoneMat: THREE.MeshStandardMaterial;
  private parliamentGreenMat: THREE.MeshStandardMaterial;
  private woodMat: THREE.MeshStandardMaterial;
  private mediaBlueMat: THREE.MeshStandardMaterial;
  private neonMagentaMat: THREE.MeshStandardMaterial;
  private neonCyanMat: THREE.MeshBasicMaterial;
  private neonPinkMat: THREE.MeshBasicMaterial;
  private cartoonSkinMat: THREE.MeshStandardMaterial;
  private cartoonHairDarkMat: THREE.MeshStandardMaterial;
  private cartoonHairSilverMat: THREE.MeshStandardMaterial;
  private paperWhiteMat: THREE.MeshBasicMaterial;
  private redVelvetMat: THREE.MeshStandardMaterial;
  private silverMat: THREE.MeshStandardMaterial;
  private darkSuitMat: THREE.MeshStandardMaterial;
  private saffronWaistcoatMat: THREE.MeshStandardMaterial;
  private royalBlueMat: THREE.MeshStandardMaterial;

  // Authentic Surreal Yatra Architecture Materials
  private yatraYellowMat: THREE.MeshStandardMaterial;
  private yatraLitWindowMat: THREE.MeshStandardMaterial;
  private mediaStudioGlassMat: THREE.MeshStandardMaterial;
  private yatraAwningMat: THREE.MeshStandardMaterial;
  private yatraBannerGreenMat: THREE.MeshStandardMaterial;

  private constructor() {
    this.roadbedWallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    this.yatraWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    this.yatraBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.2 });
    this.yatraOrangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
    this.yatraGreenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });
    this.goldMetalMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.85 });
    this.parliamentSandstoneMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.8 });
    this.parliamentGreenMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.6 });
    this.woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    // Bright vibrant media blue instead of pitch-black
    this.mediaBlueMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.35, metalness: 0.3, emissive: 0x0f172a, emissiveIntensity: 0.2 });
    this.neonMagentaMat = new THREE.MeshStandardMaterial({ color: 0xd946ef, roughness: 0.2, metalness: 0.5 });
    this.neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.neonPinkMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    this.cartoonSkinMat = new THREE.MeshStandardMaterial({ color: 0xd9a27c, roughness: 0.7 });
    this.cartoonHairDarkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    this.cartoonHairSilverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
    this.paperWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    this.redVelvetMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.85 });
    this.silverMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.7 });
    this.darkSuitMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.7 });
    this.saffronWaistcoatMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.6 });
    this.royalBlueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.5 });

    // Initializing Surreal Yatra Architecture Materials
    this.yatraYellowMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.75 });
    this.yatraLitWindowMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.75, roughness: 0.2 });
    this.mediaStudioGlassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.25, metalness: 0.5, emissive: 0x0284c7, emissiveIntensity: 0.25 });
    this.yatraAwningMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.75 });
    this.yatraBannerGreenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.75 });

    // CRITICAL FIX: Apply track world-curvature shader to all Rahulverse materials!
    // Without this, as the track curves downward along Y = -0.00045 * Z^2,
    // all buildings and props stay unbent in view space, floating high in mid-air above the rails.
    const allMaterials: THREE.Material[] = [
      this.roadbedWallMat, this.yatraWhiteMat, this.yatraBlueMat, this.yatraOrangeMat,
      this.yatraGreenMat, this.goldMetalMat, this.parliamentSandstoneMat, this.parliamentGreenMat,
      this.woodMat, this.mediaBlueMat, this.neonMagentaMat, this.neonCyanMat, this.neonPinkMat,
      this.cartoonSkinMat, this.cartoonHairDarkMat, this.cartoonHairSilverMat, this.paperWhiteMat,
      this.redVelvetMat, this.silverMat, this.darkSuitMat, this.saffronWaistcoatMat,
      this.royalBlueMat, this.yatraYellowMat, this.yatraLitWindowMat, this.mediaStudioGlassMat,
      this.yatraAwningMat, this.yatraBannerGreenMat
    ];

    const curvedShader = CurvedShaderManager.getInstance();
    allMaterials.forEach((mat) => {
      curvedShader.applyCurvature(mat);
    });
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

  public static getInstance(): RahulSatireWorldBuilder {
    if (!RahulSatireWorldBuilder.instance) {
      RahulSatireWorldBuilder.instance = new RahulSatireWorldBuilder();
    }
    return RahulSatireWorldBuilder.instance;
  }

  private getBox(w: number, h: number, d: number): THREE.BoxGeometry {
    const key = `box_${w}_${h}_${d}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.BoxGeometry(w, h, d));
    }
    return this.geoCache.get(key) as THREE.BoxGeometry;
  }

  private getCylinder(rt: number, rb: number, h: number, seg: number = 10): THREE.CylinderGeometry {
    const key = `cyl_${rt}_${rb}_${h}_${seg}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.CylinderGeometry(rt, rb, h, seg));
    }
    return this.geoCache.get(key) as THREE.CylinderGeometry;
  }

  private getSphere(r: number, seg: number = 8): THREE.SphereGeometry {
    const key = `sphere_${r}_${seg}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.SphereGeometry(r, seg, seg));
    }
    return this.geoCache.get(key) as THREE.SphereGeometry;
  }

  private getPlane(w: number, h: number): THREE.PlaneGeometry {
    const key = `plane_${w}_${h}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.PlaneGeometry(w, h));
    }
    return this.geoCache.get(key) as THREE.PlaneGeometry;
  }

  private getTorus(r: number, t: number, radSeg: number = 8, tubSeg: number = 16): THREE.TorusGeometry {
    const key = `torus_${r}_${t}_${radSeg}_${tubSeg}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.TorusGeometry(r, t, radSeg, tubSeg));
    }
    return this.geoCache.get(key) as THREE.TorusGeometry;
  }

  /**
   * Main Entrypoint for building a chunk's scenery in Rahulverse.
   * Deterministically rotates through the 5 distinct comedy districts!
   */
  public buildDistrictScenery(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    worldZIn: number = 0
  ): void {
    const rng = new SeededRandom(seed);
    const director = RahulComedyEventDirector.getInstance();

    let districtIndex: number;
    let worldZ = (worldZIn !== 0 && seed !== 999) ? worldZIn : 0;
    if (worldZ === 0 && group.parent && typeof group.parent.position?.z === 'number' && group.parent.position.z !== 0) {
      worldZ = group.parent.position.z;
    }

    if (seed >= 0 && seed < 5) {
      districtIndex = seed;
    } else if (worldZ !== 0) {
      districtIndex = Math.floor(Math.abs(worldZ) / 400) % 5;
    } else {
      districtIndex = Math.floor(Math.abs(seed) / 4) % 5;
    }

    switch (districtIndex) {
      case 0:
        this.buildYatraNeverEndsDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 1:
        this.buildParliamentPandemoniumDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 2:
        this.buildPressConferencePanicDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 3:
        this.buildAllianceRollercoasterDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 4:
      default:
        this.buildPoliticalMultiverseDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
    }
  }

  // =========================================================================
  // SURREAL YATRA ARCHITECTURE BUILDER
  // =========================================================================

  /**
   * Builds rich, modular, articulated surreal political architecture with setbacks,
   * campaign pavilions, cantilevered press galleries, glowing window bands,
   * striped awnings, rooftop transmission antennas, and open courtyards.
   * Completely eliminates monolithic black/dark walls and empty voids!
   */
  public buildSurrealYatraFacade(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    side: number,
    districtIndex: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const wallX = roadbedWidth * 0.5 + 2.5;
    // Setback building facade line: X = 24.5m, front face at X = 21.0m (outside track envelope |X| <= 4.2m)
    const facadeX = side * (wallX + 17.0);
    const facingAngle = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;

    // Three articulated modules per side with open courtyard gaps
    const buildingDefs = [
      { z: -14, length: 16, stories: 3, roofType: 'PAVILION' },
      { z: -40, length: 18, stories: (districtIndex === 2 ? 4 : 3), roofType: (districtIndex === 2 ? 'BROADCAST_TOWER' : 'MILESTONE') },
      { z: -66, length: 16, stories: 3, roofType: 'PAVILION' }
    ];

    buildingDefs.forEach((bDef, bIdx) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(facadeX, 0, bDef.z);
      bGroup.rotation.y = facingAngle;

      const bWidth = bDef.length;
      const bDepth = 7.0;
      const storyH = 4.8;
      const totalH = bDef.stories * storyH;

      // Select district palette
      let wallMat: THREE.MeshStandardMaterial;
      if (districtIndex === 0) {
        // Yatra Never Ends: Saffron, White & Green Vernacular
        wallMat = bIdx % 2 === 0 ? this.yatraWhiteMat : this.yatraOrangeMat;
      } else if (districtIndex === 1) {
        // Parliament Pandemonium: Sandstone & Royal Blue
        wallMat = bIdx % 2 === 0 ? this.parliamentSandstoneMat : this.royalBlueMat;
      } else if (districtIndex === 2) {
        // Press Conference Panic: High-tech Media Studio Glass & Deep Navy
        wallMat = bIdx === 1 ? this.mediaStudioGlassMat : this.mediaBlueMat;
      } else if (districtIndex === 3) {
        // Alliance Rollercoaster: Festive Carnival Magenta & Yellow
        wallMat = bIdx % 2 === 0 ? this.neonMagentaMat : this.yatraYellowMat;
      } else {
        // Political Multiverse: Deep Cosmic Navy & Sandstone
        wallMat = bIdx % 2 === 0 ? this.mediaBlueMat : this.parliamentSandstoneMat;
      }

      // 0. Subterranean Foundation Plinth down to Y = -4.0m (prevents floating scenery)
      const plinth = new THREE.Mesh(this.getBox(bWidth + 0.8, 4.0, bDepth + 0.8), this.parliamentSandstoneMat);
      plinth.position.y = -2.0;
      bGroup.add(plinth);

      // 1. Ground Floor Plinth & Main Mass
      const mainBuilding = new THREE.Mesh(this.getBox(bWidth, totalH, bDepth), wallMat);
      mainBuilding.position.y = totalH * 0.5;
      bGroup.add(mainBuilding);

      // Carved Stringcourse Ledges between floors
      for (let s = 1; s <= bDef.stories; s++) {
        const cornice = new THREE.Mesh(this.getBox(bWidth + 0.6, 0.45, bDepth + 0.6), this.parliamentSandstoneMat);
        cornice.position.y = s * storyH;
        bGroup.add(cornice);
      }

      // In MINIMAL tier, retain massing and cornice ledges for visual silhouette while maintaining lightweight budget
      if (detail === 'MINIMAL') {
        group.add(bGroup);
        return;
      }

      // 2. Ground-Floor Campaign Centers with Striped Awnings
      const stallCount = Math.floor(bWidth / 5.0);
      const stallSpacing = bWidth / (stallCount + 1);
      const awningMats = [this.yatraOrangeMat, this.yatraWhiteMat, this.yatraGreenMat];

      for (let sh = 0; sh < stallCount; sh++) {
        const stallX = -bWidth * 0.5 + (sh + 1) * stallSpacing;

        const door = new THREE.Mesh(this.getBox(2.6, 3.2, 0.4), this.woodMat);
        door.position.set(stallX, 1.6, bDepth * 0.5 + 0.1);
        bGroup.add(door);

        const glow = new THREE.Mesh(this.getBox(1.8, 2.4, 0.05), this.yatraLitWindowMat);
        glow.position.set(stallX, 1.4, bDepth * 0.5 + 0.22);
        bGroup.add(glow);

        const awningMat = awningMats[(sh + bIdx) % awningMats.length];
        const awning = new THREE.Mesh(this.getBox(3.0, 0.08, 1.6), awningMat);
        awning.position.set(stallX, 3.4, bDepth * 0.5 + 0.75);
        awning.rotation.x = 0.28;
        bGroup.add(awning);
      }

      // 3. Cantilevered Press Galleries on Upper Floors
      for (let s = 1; s < bDef.stories; s++) {
        const floorY = s * storyH;
        const galleryCount = Math.floor(bWidth / 5.5);
        const gSpacing = bWidth / (galleryCount + 1);

        for (let g = 0; g < galleryCount; g++) {
          const gX = -bWidth * 0.5 + (g + 1) * gSpacing;

          const gBase = new THREE.Mesh(this.getBox(2.0, 0.35, 1.2), this.parliamentSandstoneMat);
          gBase.position.set(gX, floorY + 0.6, bDepth * 0.5 + 0.6);
          bGroup.add(gBase);

          const railing = new THREE.Mesh(this.getBox(2.0, 0.85, 0.12), this.goldMetalMat);
          railing.position.set(gX, floorY + 1.15, bDepth * 0.5 + 1.15);
          bGroup.add(railing);

          const win = new THREE.Mesh(this.getBox(1.4, 1.8, 0.05), this.yatraLitWindowMat);
          win.position.set(gX, floorY + 1.8, bDepth * 0.5 + 0.05);
          bGroup.add(win);
        }
      }

      // 4. Rooftops: Broadcast Towers or Milestone Crowns
      if (bDef.roofType === 'BROADCAST_TOWER') {
        const towerGroup = new THREE.Group();
        towerGroup.position.set(0, totalH, 0);

        const mast = new THREE.Mesh(this.getCylinder(0.18, 0.5, 8.0, 6), this.silverMat);
        mast.position.y = 4.0;
        towerGroup.add(mast);

        const beacon = new THREE.Mesh(this.getSphere(0.3, 6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        beacon.position.y = 8.2;
        towerGroup.add(beacon);

        const dish = new THREE.Mesh(this.getCylinder(1.2, 0.15, 0.35, 8), this.yatraWhiteMat);
        dish.position.set(2.0, 1.8, 0);
        dish.rotation.z = 0.55;
        towerGroup.add(dish);

        bGroup.add(towerGroup);
      } else {
        // Decorative Tri-Color Milestone Arch Crown
        const archCrown = new THREE.Mesh(this.getBox(4.0, 1.2, 0.8), this.yatraOrangeMat);
        archCrown.position.set(0, totalH + 0.6, bDepth * 0.5 - 0.5);
        bGroup.add(archCrown);

        const archDome = new THREE.Mesh(this.getCylinder(0.1, 1.2, 0.8, 6), this.yatraGreenMat);
        archDome.position.set(0, totalH + 1.6, bDepth * 0.5 - 0.5);
        bGroup.add(archDome);
      }

      group.add(bGroup);
    });

    if (detail === 'MINIMAL') return;

    // 5. Open Courtyard Setbacks: Milestone arches and festival lamps
    const courtyardZs = [-25.5, -53.5];
    courtyardZs.forEach((cyZ) => {
      const cyGroup = new THREE.Group();
      cyGroup.position.set(facadeX + (side > 0 ? -1.5 : 1.5), 0, cyZ);

      // Subterranean Courtyard Foundation Plinth
      const cyPlinth = new THREE.Mesh(this.getBox(3.2, 4.0, 6.2), this.parliamentSandstoneMat);
      cyPlinth.position.y = -2.0;
      cyGroup.add(cyPlinth);

      const postL = new THREE.Mesh(this.getCylinder(0.18, 0.24, 4.8, 6), this.yatraBlueMat);
      postL.position.set(0, 2.4, -2.2);
      cyGroup.add(postL);

      const postR = new THREE.Mesh(this.getCylinder(0.18, 0.24, 4.8, 6), this.yatraBlueMat);
      postR.position.set(0, 2.4, 2.2);
      cyGroup.add(postR);

      const lintel = new THREE.Mesh(this.getBox(0.7, 0.6, 5.2), this.yatraOrangeMat);
      lintel.position.set(0, 5.0, 0);
      cyGroup.add(lintel);

      const lamp = new THREE.Mesh(this.getSphere(0.35, 6), this.yatraLitWindowMat);
      lamp.position.set(0, 4.4, 0);
      cyGroup.add(lamp);

      group.add(cyGroup);
    });
  }

  // =========================================================================
  // DISTRICT A — YATRA NEVER ENDS
  // =========================================================================
  public buildYatraNeverEndsDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: RahulComedyEventDirector
  ): void {
    const districtA = new THREE.Group();
    districtA.name = 'district_a_yatra_never_ends';
    group.add(districtA);

    // Strict boundary: all roadside structures placed at |X| >= 8.5m
    const curbEdge = roadbedWidth * 0.5 + 0.5;

    // 1. Streetscape continuous sidewalks with vernacular buildings & cheering crowds
    [-1, 1].forEach((side) => {
      // Articulated Surreal Yatra Streetscape behind promenade
      this.buildSurrealYatraFacade(districtA, roadbedWidth, chunkLength, side, 0, rng, detail);

      const walkW = 22.0;
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 4.3, chunkLength), this.parliamentSandstoneMat);
      walk.position.set(wx, -1.85, -chunkLength * 0.5);
      districtA.add(walk);

      // Cheerful cartoon cheering crowd lining sidewalks
      for (let z = 8; z < chunkLength - 8; z += 12) {
        this.buildCheeringCrowdMember(districtA, side * (curbEdge + 2.2), 0.6, -z, side > 0);
      }

      // Traditional Indian Highway Milestone Markers
      for (let z = 16; z < chunkLength - 16; z += 32) {
        const milestoneGroup = new THREE.Group();
        milestoneGroup.position.set(side * (curbEdge + 1.2), 0.6, -z);

        const base = new THREE.Mesh(this.getBox(0.9, 1.2, 0.45), this.yatraWhiteMat);
        base.position.y = 0.6;
        milestoneGroup.add(base);

        const cap = new THREE.Mesh(this.getCylinder(0.45, 0.45, 0.45, 8), this.yatraOrangeMat);
        cap.position.y = 1.25;
        cap.rotation.z = Math.PI / 2;
        milestoneGroup.add(cap);

        districtA.add(milestoneGroup);
      }
    });

    // 1a. Roadside Chai & Snack Dhaba Kiosk at X = -15.5m
    const dhabaGroup = new THREE.Group();
    dhabaGroup.position.set(-15.5, 0.6, -chunkLength * 0.2);

    // Deep Subterranean Foundation Plinth
    const dhabaPlinth = new THREE.Mesh(this.getBox(7.0, 4.0, 5.0), this.parliamentSandstoneMat);
    dhabaPlinth.position.y = -2.0;
    dhabaGroup.add(dhabaPlinth);

    const dhabaBase = new THREE.Mesh(this.getBox(6.5, 3.2, 4.5), this.parliamentSandstoneMat);
    dhabaBase.position.y = 1.6;
    dhabaGroup.add(dhabaBase);

    // Awning with striped tri-color pattern
    const awning = new THREE.Mesh(this.getBox(7.0, 0.2, 3.0), this.yatraOrangeMat);
    awning.position.set(0, 3.3, 1.0);
    awning.rotation.x = 0.15;
    dhabaGroup.add(awning);

    // Giant steaming brass chai kettle on counter
    const kettle = new THREE.Mesh(this.getCylinder(0.5, 0.7, 1.2, 10), this.goldMetalMat);
    kettle.position.set(-1.5, 3.8, 1.0);
    dhabaGroup.add(kettle);

    districtA.add(dhabaGroup);

    // 1b. 3D Open-Top Campaign Support Van with 4 Loudspeaker Horns & Supply Crates (East sidewalk)
    const vanGroup = new THREE.Group();
    vanGroup.name = 'rahul_campaign_van';
    vanGroup.position.set(14.5, 0.6, -chunkLength * 0.25);

    // Deep Subterranean Van Foundation Plinth
    const vanPlinth = new THREE.Mesh(this.getBox(6.5, 4.0, 4.5), this.parliamentSandstoneMat);
    vanPlinth.position.y = -2.0;
    vanGroup.add(vanPlinth);

    // Van Body (Campaign Navy & Saffron)
    const vanBody = new THREE.Mesh(this.getBox(5.6, 2.2, 2.8), this.yatraBlueMat);
    vanBody.position.y = 1.6;
    vanGroup.add(vanBody);

    const vanCab = new THREE.Mesh(this.getBox(2.2, 1.4, 2.6), this.yatraWhiteMat);
    vanCab.position.set(1.5, 3.0, 0);
    vanGroup.add(vanCab);

    // Windshield
    const windshield = new THREE.Mesh(this.getBox(0.1, 1.0, 2.4), this.mediaStudioGlassMat);
    windshield.position.set(2.65, 3.0, 0);
    vanGroup.add(windshield);

    // 4 Wheels
    [[-1.8, -1.3], [-1.8, 1.3], [1.6, -1.3], [1.6, 1.3]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(this.getCylinder(0.55, 0.55, 0.45, 12), this.darkSuitMat);
      wheel.position.set(wx, 0.55, wz);
      wheel.rotation.x = Math.PI / 2;
      vanGroup.add(wheel);

      const hubcap = new THREE.Mesh(this.getCylinder(0.22, 0.22, 0.48, 8), this.silverMat);
      hubcap.position.set(wx, 0.55, wz);
      hubcap.rotation.x = Math.PI / 2;
      vanGroup.add(hubcap);
    });

    // Roof Luggage Rack with Spare Sneakers and Water Crates
    const rack = new THREE.Mesh(this.getBox(2.8, 0.15, 2.4), this.silverMat);
    rack.position.set(-1.0, 2.8, 0);
    vanGroup.add(rack);

    // Crates of water
    const crate1 = new THREE.Mesh(this.getBox(0.9, 0.6, 0.8), this.yatraOrangeMat);
    crate1.position.set(-1.4, 3.2, -0.6);
    vanGroup.add(crate1);

    const crate2 = new THREE.Mesh(this.getBox(0.9, 0.6, 0.8), this.yatraGreenMat);
    crate2.position.set(-1.4, 3.2, 0.6);
    vanGroup.add(crate2);

    // Spare giant sneakers on rack
    const spareSneaker = new THREE.Mesh(this.getBox(0.7, 0.4, 1.4), this.goldMetalMat);
    spareSneaker.position.set(-0.6, 3.1, 0);
    vanGroup.add(spareSneaker);

    // 4 Golden Loudspeaker Horns angled outwards
    const hornAngles = [-0.6, -0.2, 0.2, 0.6];
    hornAngles.forEach((ang, hIdx) => {
      const hornGroup = new THREE.Group();
      hornGroup.position.set(0.2, 3.9, -1.0 + hIdx * 0.65);
      hornGroup.rotation.y = ang;

      const hornStem = new THREE.Mesh(this.getCylinder(0.08, 0.08, 0.5, 6), this.silverMat);
      hornGroup.add(hornStem);

      const hornCone = new THREE.Mesh(this.getCylinder(0.35, 0.1, 0.6, 10), this.goldMetalMat);
      hornCone.position.set(0.3, 0.25, 0);
      hornCone.rotation.z = -Math.PI / 2;
      hornGroup.add(hornCone);

      vanGroup.add(hornGroup);
    });

    // 2 Fluttering Tricolor Campaign Flags
    [-0.8, 0.8].forEach((fz) => {
      const mast = new THREE.Mesh(this.getCylinder(0.05, 0.05, 2.4, 6), this.silverMat);
      mast.position.set(-2.5, 3.6, fz);
      vanGroup.add(mast);

      const flag = new THREE.Mesh(this.getBox(0.05, 0.7, 1.2), this.yatraOrangeMat);
      flag.position.set(-2.5, 4.4, fz + 0.6);
      vanGroup.add(flag);
    });

    districtA.add(vanGroup);

    // 2. Animated Giant Golden Walking Shoe Monument on Motorized Treadmill
    const shoeGroup = new THREE.Group();
    shoeGroup.name = 'rahul_shoe_monument';
    shoeGroup.position.set(-16.0, 0.6, -chunkLength * 0.5);

    // Deep Subterranean Treadmill Foundation Plinth
    const shoePlinth = new THREE.Mesh(this.getBox(8.0, 4.0, 8.5), this.parliamentSandstoneMat);
    shoePlinth.position.y = -2.0;
    shoeGroup.add(shoePlinth);

    const pedestal = new THREE.Mesh(this.getBox(7.2, 1.4, 7.8), this.parliamentSandstoneMat);
    pedestal.position.y = 0.7;
    shoeGroup.add(pedestal);

    // High-Tech Treadmill Conveyor Base
    const treadmillBase = new THREE.Mesh(this.getBox(4.4, 0.6, 7.2), this.darkSuitMat);
    treadmillBase.position.y = 1.7;
    shoeGroup.add(treadmillBase);

    // Treadmill Belt (Conveyor surface)
    const treadBelt = new THREE.Mesh(this.getBox(3.8, 0.05, 6.4), this.silverMat);
    treadBelt.position.y = 2.03;
    shoeGroup.add(treadBelt);

    // Front Treadmill Control Console with LED Odometer
    const consolePillarL = new THREE.Mesh(this.getCylinder(0.08, 0.08, 1.6, 6), this.silverMat);
    consolePillarL.position.set(-1.8, 2.8, -3.2);
    shoeGroup.add(consolePillarL);

    const consolePillarR = new THREE.Mesh(this.getCylinder(0.08, 0.08, 1.6, 6), this.silverMat);
    consolePillarR.position.set(1.8, 2.8, -3.2);
    shoeGroup.add(consolePillarR);

    const consoleTop = new THREE.Mesh(this.getBox(4.0, 0.5, 0.6), this.darkSuitMat);
    consoleTop.position.set(0, 3.6, -3.2);
    shoeGroup.add(consoleTop);

    // Glowing LED Odometer Screen ("KM: 12,450")
    const ledScreen = new THREE.Mesh(this.getBox(2.2, 0.35, 0.1), this.neonCyanMat);
    ledScreen.position.set(0, 3.6, -2.88);
    shoeGroup.add(ledScreen);

    // Animated walking shoe body group
    const walkerBodyGroup = new THREE.Group();
    walkerBodyGroup.position.y = 2.1;

    // Colossal Sneaker Sole & Body
    const sole = new THREE.Mesh(this.getBox(3.4, 0.9, 6.2), this.yatraWhiteMat);
    sole.position.y = 0.45;
    walkerBodyGroup.add(sole);

    const sneakerBody = new THREE.Mesh(this.getBox(3.0, 2.2, 5.4), this.goldMetalMat);
    sneakerBody.position.set(0, 1.9, -0.2);
    walkerBodyGroup.add(sneakerBody);

    // Dynamic tapping toe
    const toeMesh = new THREE.Mesh(this.getBox(2.8, 1.1, 2.0), this.yatraOrangeMat);
    toeMesh.position.set(0, 0.65, -2.8);
    walkerBodyGroup.add(toeMesh);

    // Cartoon Legs wearing white athletic socks & navy shorts
    const legL = new THREE.Group();
    legL.position.set(-1.0, 3.2, 0);
    const legMeshL = new THREE.Mesh(this.getCylinder(0.35, 0.35, 2.0, 8), this.yatraWhiteMat);
    legMeshL.position.y = 1.0;
    legL.add(legMeshL);
    walkerBodyGroup.add(legL);

    const legR = new THREE.Group();
    legR.position.set(1.0, 3.2, 0);
    const legMeshR = new THREE.Mesh(this.getCylinder(0.35, 0.35, 2.0, 8), this.yatraWhiteMat);
    legMeshR.position.y = 1.0;
    legR.add(legMeshR);
    walkerBodyGroup.add(legR);

    // Cartoon swinging arms with wristbands
    const armL = new THREE.Group();
    armL.position.set(-1.8, 3.8, 0);
    const armMeshL = new THREE.Mesh(this.getBox(0.4, 1.6, 0.4), this.cartoonSkinMat);
    armMeshL.position.y = -0.8;
    armL.add(armMeshL);
    walkerBodyGroup.add(armL);

    const armR = new THREE.Group();
    armR.position.set(1.8, 3.8, 0);
    const armMeshR = new THREE.Mesh(this.getBox(0.4, 1.6, 0.4), this.cartoonSkinMat);
    armMeshR.position.y = -0.8;
    armR.add(armMeshR);
    walkerBodyGroup.add(armR);

    shoeGroup.add(walkerBodyGroup);
    director.registerShoeMonument(toeMesh, { legL, legR, armL, armR, bodyGroup: walkerBodyGroup, baseZ: 0 });
    districtA.add(shoeGroup);

    // 3. Unfolding Accordion Route Map on Massive Surveyor Gantry at X = 16.5m
    const mapGantry = new THREE.Group();
    mapGantry.position.set(16.5, 0.6, -chunkLength * 0.55);

    // Gantry tower legs
    const p1 = new THREE.Mesh(this.getCylinder(0.2, 0.2, 7.0, 6), this.woodMat);
    p1.position.set(-2.5, 3.5, 0);
    mapGantry.add(p1);

    const p2 = new THREE.Mesh(this.getCylinder(0.2, 0.2, 7.0, 6), this.woodMat);
    p2.position.set(2.5, 3.5, 0);
    mapGantry.add(p2);

    const topBeam = new THREE.Mesh(this.getBox(6.0, 0.4, 0.4), this.woodMat);
    topBeam.position.set(0, 7.0, 0);
    mapGantry.add(topBeam);

    // Accordion fold segments
    const mapTex = TextureGenerator.getYatraMapTexture();
    const mapMat = new THREE.MeshBasicMaterial({ map: mapTex, side: THREE.DoubleSide });

    const foldSegments: { group: THREE.Group; foldIndex: number }[] = [];
    for (let f = 0; f < 3; f++) {
      const segGroup = new THREE.Group();
      segGroup.position.set(-1.8 + f * 1.8, 4.2, 0);

      const panel = new THREE.Mesh(this.getPlane(1.7, 4.2), mapMat);
      segGroup.add(panel);
      mapGantry.add(segGroup);
      foldSegments.push({ group: segGroup, foldIndex: f });
    }

    // Animated indicator needle
    const indicator = new THREE.Mesh(this.getSphere(0.25, 8), this.yatraOrangeMat);
    indicator.position.set(0, 4.5, 0.2);
    mapGantry.add(indicator);

    director.registerAccordionMap(foldSegments, indicator);
    group.add(mapGantry);

    // 4. Special Animated Finish Line Flip Arch (High clearance envelope Y > 8.8m, lintel at Y = 9.4m)
    const archGroup = new THREE.Group();
    archGroup.name = 'yatra_finish_flip_arch';
    archGroup.position.set(0, 0, -chunkLength * 0.35);

    // High side pillars outside running envelope (|X| = 8.8m > 4.2m)
    const archH = 9.4;
    [-roadbedWidth * 0.5 - 2.8, roadbedWidth * 0.5 + 2.8].forEach((px) => {
      const p = new THREE.Mesh(this.getBox(1.8, archH, 1.8), this.yatraBlueMat);
      p.position.set(px, archH * 0.5, 0);
      archGroup.add(p);

      // Gold finial on top of each pillar
      const finial = new THREE.Mesh(this.getSphere(0.9, 8), this.goldMetalMat);
      finial.position.set(px, archH + 1.2, 0);
      archGroup.add(finial);
    });

    // Overhead lintel beam (lowest point Y = 9.4m > 8.5m)
    const lintel = new THREE.Mesh(this.getBox(roadbedWidth + 7.5, 1.2, 2.0), this.yatraOrangeMat);
    lintel.position.set(0, archH + 0.6, 0);
    archGroup.add(lintel);

    // Mechanical Flip Board
    const flipPivot = new THREE.Group();
    flipPivot.position.set(0, archH + 0.6, 0.1);

    const finishTex = RahulverseTextureCache.getFinishLineFlipTexture(false);
    const startTex = RahulverseTextureCache.getFinishLineFlipTexture(true);

    const finishMesh = new THREE.Mesh(this.getBox(roadbedWidth + 2.0, 1.8, 0.1), new THREE.MeshBasicMaterial({ map: finishTex }));
    finishMesh.position.z = 0.06;
    flipPivot.add(finishMesh);

    const startMesh = new THREE.Mesh(this.getBox(roadbedWidth + 2.0, 1.8, 0.1), new THREE.MeshBasicMaterial({ map: startTex }));
    startMesh.position.z = -0.06;
    startMesh.rotation.y = Math.PI;
    flipPivot.add(startMesh);

    // Mechanical swinging arm holding the board
    const armGroup = new THREE.Group();
    armGroup.position.set(roadbedWidth * 0.5 + 1.2, archH + 1.2, 0);
    const armMesh = new THREE.Mesh(this.getCylinder(0.12, 0.12, 2.5, 6), this.goldMetalMat);
    armMesh.position.y = -1.2;
    armGroup.add(armMesh);
    archGroup.add(armGroup);

    // Confetti particles overhead
    const confettiGroup = new THREE.Group();
    confettiGroup.position.set(0, archH + 2.0, 0);
    const particles = [];
    const colors = [0xf97316, 0x16a34a, 0x38bdf8, 0xfacc15, 0xe11d48];
    for (let c = 0; c < 20; c++) {
      const cMesh = new THREE.Mesh(this.getPlane(0.25, 0.25), new THREE.MeshBasicMaterial({
        color: colors[c % colors.length],
        side: THREE.DoubleSide
      }));
      const px = -6.0 + (c % 7) * 2.0;
      const py = (c % 3) * 0.5;
      const pz = -1.5 + (c % 4) * 1.0;
      cMesh.position.set(px, py, pz);
      confettiGroup.add(cMesh);

      particles.push({
        mesh: cMesh,
        origY: py,
        origZ: pz,
        vy: 2.5 + (c % 3) * 1.0,
        vz: 1.2 + (c % 2) * 0.8,
        rotSpeed: 3.0 + (c % 4) * 2.0
      });
    }
    archGroup.add(confettiGroup);

    director.registerFlipBoard(flipPivot, finishMesh, startMesh, confettiGroup, armGroup, particles);

    // GATE A: Motorized Ratchet Gear on pillar
    const ratchetGear = new THREE.Mesh(this.getCylinder(0.65, 0.65, 0.25, 8), this.goldMetalMat);
    ratchetGear.position.set(roadbedWidth * 0.5 + 2.8, archH * 0.5, 1.0);
    ratchetGear.rotation.x = Math.PI / 2;
    archGroup.add(ratchetGear);

    // GATE A: Animated Unrolling Accordion Map stretching toward the horizon
    const accordionMap = new THREE.Mesh(this.getBox(3.4, 0.1, 8.5), this.yatraOrangeMat);
    accordionMap.position.set(roadbedWidth * 0.5 + 4.2, 0.6, -4.0);
    archGroup.add(accordionMap);

    // GATE A: Animated Running Rahul Caricature sprinting toward finish line along sidewalk
    const runnerRahul = this.buildRahulCaricature(archGroup, roadbedWidth * 0.5 + 4.2, 0.6, -12.0, 'RUN', director);

    // White Sweat Towel
    const towel = new THREE.Mesh(this.getBox(0.25, 0.45, 0.08), this.yatraWhiteMat);
    towel.position.set(0, 1.2, 0.2);
    towel.visible = false;
    runnerRahul.add(towel);

    director.registerNeverEndingYatra(archGroup, flipPivot, ratchetGear, accordionMap, runnerRahul, towel);

    archGroup.add(flipPivot);
    group.add(archGroup);

    // 5. Second Distant Finish Line Arch ("REVISED FINISH LINE: MAYBE")
    const distantArch = new THREE.Group();
    distantArch.position.set(0, 0, -chunkLength * 0.85);

    [-roadbedWidth * 0.5 - 2.8, roadbedWidth * 0.5 + 2.8].forEach((px) => {
      const dp = new THREE.Mesh(this.getBox(1.5, 9.4, 1.5), this.yatraBlueMat);
      dp.position.set(px, 4.7, 0);
      distantArch.add(dp);
    });

    const dLintel = new THREE.Mesh(this.getBox(roadbedWidth + 6.0, 1.0, 1.4), this.yatraOrangeMat);
    dLintel.position.set(0, 10.0, 0);
    distantArch.add(dLintel);

    const revTex = RahulverseTextureCache.getRevisedFinishTexture();
    const revSign = new THREE.Mesh(this.getBox(roadbedWidth + 1.0, 1.5, 0.1), new THREE.MeshBasicMaterial({ map: revTex }));
    revSign.position.set(0, 10.0, 0.1);
    distantArch.add(revSign);

    group.add(distantArch);

    // Distant Scenic Mountain Ridges along Yatra route
    [-1, 1].forEach((side) => {
      const ridgeGroup = new THREE.Group();
      ridgeGroup.position.set(side * 34.0, 0, -chunkLength * 0.5);
      for (let m = 0; m < 3; m++) {
        const peak = new THREE.Mesh(this.getCylinder(0.2, 8.0, 16.0 + m * 3.0, 4), this.parliamentSandstoneMat);
        peak.position.set(0, 8.0 + m * 1.5, (m - 1) * 24.0);
        peak.rotation.y = m * 0.5;
        ridgeGroup.add(peak);
      }
      group.add(ridgeGroup);
    });

    // CROSSOVER GAG: THE HUG LOOP (East side at X = +16.5m, Z = -chunkLength * 0.85)
    this.buildHugLoopStage(group, 16.5, 0.6, -chunkLength * 0.85, director);
  }

  // =========================================================================
  // DISTRICT B — PARLIAMENT PANDEMONIUM
  // =========================================================================
  public buildParliamentPandemoniumDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: RahulComedyEventDirector
  ): void {
    const districtB = new THREE.Group();
    districtB.name = 'district_b_parliament_pandemonium';
    group.add(districtB);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    // 1. Parliamentary Colonnade Galleries with Green Leather Benches & Solid Sidewalks
    [-1, 1].forEach((side) => {
      // Articulated Parliament Gallery Facade behind colonnade
      this.buildSurrealYatraFacade(districtB, roadbedWidth, chunkLength, side, 1, rng, detail);

      const gallW = 22.0;
      const gx = side * (curbEdge + gallW * 0.5);
      const gallery = new THREE.Mesh(this.getBox(gallW, 4.3, chunkLength), this.parliamentSandstoneMat);
      gallery.position.set(gx, -1.85, -chunkLength * 0.5);
      districtB.add(gallery);

      // Grand Sandstone Columns
      for (let z = 6; z < chunkLength - 6; z += 12) {
        const col = new THREE.Mesh(this.getCylinder(0.6, 0.6, 8.5, 8), this.parliamentSandstoneMat);
        col.position.set(side * (curbEdge + 2.2), 4.85, -z);
        districtB.add(col);

        // Ornate column capital
        const cap = new THREE.Mesh(this.getBox(1.6, 0.6, 1.6), this.parliamentSandstoneMat);
        cap.position.set(side * (curbEdge + 2.2), 9.2, -z);
        districtB.add(cap);
      }

      // Rows of Green Leather Parliament Benches
      for (let z = 8; z < chunkLength - 8; z += 10) {
        const bench = new THREE.Mesh(this.getBox(3.4, 0.9, 1.4), this.parliamentGreenMat);
        bench.position.set(side * (curbEdge + 5.2), 1.5, -z);
        districtB.add(bench);
      }
    });

    // 2. Animated Runaway Mechanical Microphone Gag & Point of Order Button
    const micStage = new THREE.Group();
    micStage.name = 'runaway_microphone_arm';
    micStage.position.set(-16.0, 0.6, -chunkLength * 0.5);

    // Deep Subterranean Foundation Plinth
    const micPlinth = new THREE.Mesh(this.getBox(6.5, 4.0, 6.0), this.parliamentSandstoneMat);
    micPlinth.position.y = -2.0;
    micStage.add(micPlinth);

    // Mahogany Speaker Podium
    const podium = new THREE.Mesh(this.getBox(3.0, 1.8, 2.2), this.woodMat);
    podium.position.y = 0.9;
    micStage.add(podium);

    // Golden Speaker Mace on pedestal
    const mace = new THREE.Mesh(this.getCylinder(0.08, 0.08, 2.4, 6), this.goldMetalMat);
    mace.position.set(0, 1.9, 0.8);
    mace.rotation.z = Math.PI / 2;
    micStage.add(mace);

    // Robotic Articulated Crane Arm holding microphone
    const armGroup = new THREE.Group();
    armGroup.position.set(0, 2.2, 0);

    const armPillar = new THREE.Mesh(this.getCylinder(0.08, 0.08, 2.2, 6), this.goldMetalMat);
    armPillar.position.set(0, 1.1, 0);
    armGroup.add(armPillar);

    const micHead = new THREE.Mesh(this.getCylinder(0.22, 0.22, 0.55, 8), this.yatraBlueMat);
    micHead.position.set(0, 2.2, 0);
    armGroup.add(micHead);

    micStage.add(armGroup);

    // Enormous "POINT OF ORDER" Slam Button
    const buttonGroup = new THREE.Group();
    buttonGroup.position.set(0, 1.8, -1.2);

    const btnTex = RahulverseTextureCache.getPointOfOrderButtonTexture();
    const btnMat = this.createBasicMaterial({ map: btnTex });
    const btnMesh = new THREE.Mesh(this.getCylinder(0.9, 0.9, 0.35, 16), btnMat);
    buttonGroup.add(btnMesh);
    micStage.add(buttonGroup);

    // Two Cartoon Debater Caricatures competing for the mic
    const debaterL = this.buildRahulCaricature(micStage, -1.2, 0, 0, 'DEBATE', director);
    const debaterR = this.buildModiCaricature(micStage, 1.2, 0, 0, 'DEBATE', director);

    director.registerRunawayMic(armGroup, 2.2, 0, buttonGroup, debaterL, debaterR);
    districtB.add(micStage);

    // 3. Reverse Debate Countdown Clock with Backwards Spinning Hands
    const clockGroup = new THREE.Group();
    clockGroup.position.set(16.5, 0.6, -chunkLength * 0.5);

    // Deep Subterranean Clock Plinth
    const clockPlinth = new THREE.Mesh(this.getBox(6.0, 4.0, 6.0), this.parliamentSandstoneMat);
    clockPlinth.position.y = -2.0;
    clockGroup.add(clockPlinth);

    const clockStand = new THREE.Mesh(this.getBox(1.5, 5.5, 1.5), this.parliamentSandstoneMat);
    clockStand.position.y = 2.75;
    clockGroup.add(clockStand);

    const clockSignTex = TextureGenerator.getParliamentPandemoniumSignTexture(rng.int(0, 3));
    const clockDisplayMat = this.createBasicMaterial({ map: clockSignTex });
    const clockDisplay = new THREE.Mesh(this.getBox(5.0, 2.4, 0.25), clockDisplayMat);
    clockDisplay.position.set(0, 6.0, 0);
    clockDisplay.rotation.y = -Math.PI * 0.45;
    clockGroup.add(clockDisplay);

    // Analog clock with backwards rotating hands
    const clockFace = new THREE.Mesh(this.getCylinder(1.2, 1.2, 0.15, 16), this.yatraWhiteMat);
    clockFace.position.set(0, 7.8, 0);
    clockFace.rotation.x = Math.PI / 2;
    clockGroup.add(clockFace);

    const hourHand = new THREE.Mesh(this.getBox(0.08, 0.65, 0.05), this.darkSuitMat);
    hourHand.position.set(0, 7.8, 0.1);
    clockGroup.add(hourHand);

    const minuteHand = new THREE.Mesh(this.getBox(0.06, 0.95, 0.05), this.yatraOrangeMat);
    minuteHand.position.set(0, 7.8, 0.12);
    clockGroup.add(minuteHand);

    director.registerTimerMesh(clockDisplay, { hourHand, minuteHand });
    districtB.add(clockGroup);

    // 3b. Strategy War-Room Pavilion with Giant Whiteboard Flowchart & Relaunch 5.0 Reset Button
    const warRoomGroup = new THREE.Group();
    warRoomGroup.name = 'rahul_strategy_war_room';
    warRoomGroup.position.set(16.5, 0.6, -chunkLength * 0.35);

    // Deep Subterranean War-Room Plinth
    const warPlinth = new THREE.Mesh(this.getBox(8.0, 4.0, 8.0), this.parliamentSandstoneMat);
    warPlinth.position.y = -2.0;
    warRoomGroup.add(warPlinth);

    // Hardwood War-Room Platform
    const warPlatform = new THREE.Mesh(this.getBox(7.5, 0.6, 7.5), this.woodMat);
    warPlatform.position.y = 0.3;
    warRoomGroup.add(warPlatform);

    // Giant Whiteboard Flowchart on Wooden Studio Easel (5.0m x 2.8m)
    const easelL = new THREE.Mesh(this.getCylinder(0.08, 0.08, 4.2, 6), this.woodMat);
    easelL.position.set(-1.8, 2.1, -1.0);
    easelL.rotation.z = -0.15;
    warRoomGroup.add(easelL);

    const easelR = new THREE.Mesh(this.getCylinder(0.08, 0.08, 4.2, 6), this.woodMat);
    easelR.position.set(1.8, 2.1, -1.0);
    easelR.rotation.z = 0.15;
    warRoomGroup.add(easelR);

    const wbTex = TextureGenerator.getStrategyWhiteboardTexture();
    const wbMat = this.createBasicMaterial({ map: wbTex });
    const whiteboard = new THREE.Mesh(this.getBox(5.0, 2.8, 0.15), wbMat);
    whiteboard.position.set(0, 2.8, -0.8);
    whiteboard.rotation.y = -Math.PI * 0.45;
    warRoomGroup.add(whiteboard);

    // Pedestal for the "RELAUNCH 5.0" Big Red Reset Button
    const btnPedestal = new THREE.Mesh(this.getBox(2.2, 1.2, 2.2), this.redVelvetMat);
    btnPedestal.position.set(0, 0.9, 1.2);
    warRoomGroup.add(btnPedestal);

    // Hazard-striped border ring around button
    const hazardRing = new THREE.Mesh(this.getCylinder(1.0, 1.0, 0.15, 16), this.goldMetalMat);
    hazardRing.position.set(0, 1.55, 1.2);
    warRoomGroup.add(hazardRing);

    // Massive Glowing Red Hemisphere "RELAUNCH 5.0" Reset Button
    const bigRedButton = new THREE.Mesh(this.getSphere(0.75, 12), this.createStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.6,
      roughness: 0.2
    }));
    bigRedButton.position.set(0, 1.7, 1.2);
    warRoomGroup.add(bigRedButton);

    // 5-Tier Spinning Strategy Wheel on 4m Chrome Mast
    const wheelMast = new THREE.Mesh(this.getCylinder(0.1, 0.1, 4.0, 6), this.silverMat);
    wheelMast.position.set(-2.5, 2.0, 1.5);
    warRoomGroup.add(wheelMast);

    const wheelDials = [0xf97316, 0x16a34a, 0x38bdf8, 0xfacc15, 0xd946ef];
    wheelDials.forEach((col, wIdx) => {
      const dial = new THREE.Mesh(this.getCylinder(0.9 - wIdx * 0.12, 0.9 - wIdx * 0.12, 0.12, 10), this.createBasicMaterial({ color: col }));
      dial.position.set(-2.5, 3.2 + wIdx * 0.18, 1.5);
      warRoomGroup.add(dial);
    });

    districtB.add(warRoomGroup);

    // 4. Flying Parliament Documents Vortex (Placed over side galleries at X = -14m, outside track envelope)
    const paperGroup = new THREE.Group();
    paperGroup.position.set(-14.0, 4.5, -chunkLength * 0.45);

    const papers = [];
    for (let p = 0; p < 10; p++) {
      const pMesh = new THREE.Mesh(this.getPlane(0.5, 0.7), this.paperWhiteMat);
      const px = -2.5 + (p % 3) * 2.5;
      const py = 1.0 + (p * 0.4);
      const pz = -4.0 + (p * 1.0);
      pMesh.position.set(px, py, pz);
      paperGroup.add(pMesh);

      papers.push({
        mesh: pMesh,
        baseY: py,
        baseZ: pz,
        speed: 1.2 + (p % 3) * 0.6,
        phase: p * 0.7
      });
    }

    director.registerFlyingPapers(paperGroup, papers);
    group.add(paperGroup);

    // Revolving Coalition Door at X = 16.0m
    const doorGroup = new THREE.Group();
    doorGroup.position.set(16.0, 0.6, -chunkLength * 0.25);
    const doorFrame = new THREE.Mesh(this.getCylinder(2.2, 2.2, 4.0, 12), this.woodMat);
    doorFrame.position.y = 2.0;
    doorGroup.add(doorFrame);

    const rotorGroup = new THREE.Group();
    rotorGroup.position.y = 2.0;
    for (let wing = 0; wing < 4; wing++) {
      const panel = new THREE.Mesh(this.getBox(0.1, 3.6, 2.0), this.parliamentSandstoneMat);
      panel.rotation.y = wing * (Math.PI / 2);
      panel.position.set(Math.cos(wing * (Math.PI / 2)) * 1.0, 0, Math.sin(wing * (Math.PI / 2)) * 1.0);
      rotorGroup.add(panel);
    }
    doorGroup.add(rotorGroup);
    director.registerRevolvingDoor(rotorGroup, 1.4);
    group.add(doorGroup);

    // GATE A HERO GAG: THE PARLIAMENT HUG & WINK (East side at X = +16.5m, Z = -chunkLength * 0.75)
    this.buildParliamentHugAndWinkStage(group, 16.5, 0.6, -chunkLength * 0.75, director);

    // GATE B HERO GAG: PARLIAMENTARY MICROPHONE CHAOS (West side at X = -16.5m, Z = -chunkLength * 0.85)
    this.buildMicrophoneChaosStage(group, -16.5, 0.6, -chunkLength * 0.85, director);
  }

  // =========================================================================
  // DISTRICT C — PRESS CONFERENCE PANIC
  // =========================================================================
  public buildPressConferencePanicDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: RahulComedyEventDirector
  ): void {
    const districtC = new THREE.Group();
    districtC.name = 'district_c_press_conference_panic';
    group.add(districtC);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    // 1. High-Tech Media Studio Towers, Articulated Press Center & Continuous Sidewalks
    [-1, 1].forEach((side) => {
      // Articulated media studio complex with transmission towers, open courtyards, and zero monolithic black walls
      this.buildSurrealYatraFacade(districtC, roadbedWidth, chunkLength, side, 2, rng, detail);

      const walkW = 22.0;
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 4.3, chunkLength), this.parliamentSandstoneMat);
      walk.position.set(wx, -1.85, -chunkLength * 0.5);
      districtC.add(walk);
    });

    // 1b. 3D OB Broadcast Satellite Van (Replacing giant billboard walls with high-production 3D set piece)
    const vanGroup = new THREE.Group();
    vanGroup.name = 'rahul_broadcast_van';
    vanGroup.position.set(15.5, 0.6, -chunkLength * 0.5);

    // Deep Subterranean Van Foundation Plinth
    const vanPlinth = new THREE.Mesh(this.getBox(7.0, 4.0, 5.0), this.parliamentSandstoneMat);
    vanPlinth.position.y = -2.0;
    vanGroup.add(vanPlinth);

    // Broadcast Truck Body
    const truckBody = new THREE.Mesh(this.getBox(6.2, 2.6, 2.8), this.mediaBlueMat);
    truckBody.position.y = 1.8;
    vanGroup.add(truckBody);

    const truckCab = new THREE.Mesh(this.getBox(2.2, 1.8, 2.6), this.yatraWhiteMat);
    truckCab.position.set(2.0, 1.9, 0);
    vanGroup.add(truckCab);

    // Windshield
    const windshield = new THREE.Mesh(this.getBox(0.1, 1.2, 2.3), this.mediaStudioGlassMat);
    windshield.position.set(3.15, 2.1, 0);
    vanGroup.add(windshield);

    // 4 Heavy-duty Wheels
    [[-1.8, -1.3], [-1.8, 1.3], [1.6, -1.3], [1.6, 1.3]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(this.getCylinder(0.6, 0.6, 0.45, 12), this.darkSuitMat);
      wheel.position.set(wx, 0.6, wz);
      wheel.rotation.x = Math.PI / 2;
      vanGroup.add(wheel);

      const hubcap = new THREE.Mesh(this.getCylinder(0.25, 0.25, 0.48, 8), this.silverMat);
      hubcap.position.set(wx, 0.6, wz);
      hubcap.rotation.x = Math.PI / 2;
      vanGroup.add(hubcap);
    });

    // Roof-Mounted High-Gain Satellite Parabolic Dish (2.2m diameter)
    const dishMast = new THREE.Mesh(this.getCylinder(0.15, 0.2, 1.2, 8), this.silverMat);
    dishMast.position.set(-0.8, 3.7, 0);
    vanGroup.add(dishMast);

    const dishDish = new THREE.Mesh(this.getCylinder(1.2, 0.2, 0.35, 12), this.yatraWhiteMat);
    dishDish.position.set(-0.8, 4.5, 0);
    dishDish.rotation.z = 0.65;
    vanGroup.add(dishDish);

    // Feed horn receiver
    const feedHorn = new THREE.Mesh(this.getCylinder(0.04, 0.08, 0.8, 6), this.goldMetalMat);
    feedHorn.position.set(-0.4, 4.7, 0);
    feedHorn.rotation.z = -0.8;
    vanGroup.add(feedHorn);

    // Flashing Red & Yellow Broadcast Beacons
    const beaconR = new THREE.Mesh(this.getSphere(0.2, 8), this.createBasicMaterial({ color: 0xef4444 }));
    beaconR.position.set(2.4, 3.3, -0.9);
    vanGroup.add(beaconR);

    const beaconY = new THREE.Mesh(this.getSphere(0.2, 8), this.createBasicMaterial({ color: 0xfacc15 }));
    beaconY.position.set(2.4, 3.3, 0.9);
    vanGroup.add(beaconY);

    // Compact Mobile Field Monitor Stand showing crisp TV News Feed (3.6m x 2.0m instead of 24m billboard!)
    const monitorGroup = new THREE.Group();
    monitorGroup.position.set(2.2, 0, -2.4);

    const monPlinth = new THREE.Mesh(this.getBox(4.0, 4.0, 1.0), this.parliamentSandstoneMat);
    monPlinth.position.y = -2.0;
    monitorGroup.add(monPlinth);

    const monPole = new THREE.Mesh(this.getCylinder(0.08, 0.08, 2.0, 6), this.silverMat);
    monPole.position.y = 1.0;
    monitorGroup.add(monPole);

    const screenTex = TextureGenerator.getPressConferencePanicSignTexture(0);
    const screenMat = this.createBasicMaterial({ map: screenTex });
    const screen = new THREE.Mesh(this.getBox(3.6, 2.0, 0.2), screenMat);
    screen.position.set(0, 2.4, 0);
    screen.rotation.y = -Math.PI * 0.45;
    monitorGroup.add(screen);

    vanGroup.add(monitorGroup);
    districtC.add(vanGroup);

    // 1c. The 20-Microphone Press Briefing Podium Scrum (West sidewalk)
    const podiumScrumGroup = new THREE.Group();
    podiumScrumGroup.name = 'rahul_podium_scrum';
    podiumScrumGroup.position.set(-15.5, 0.6, -chunkLength * 0.25);

    const scrumPlinth = new THREE.Mesh(this.getBox(5.0, 4.0, 4.0), this.parliamentSandstoneMat);
    scrumPlinth.position.y = -2.0;
    podiumScrumGroup.add(scrumPlinth);

    const scrumPodium = new THREE.Mesh(this.getBox(2.4, 1.8, 1.4), this.woodMat);
    scrumPodium.position.y = 0.9;
    podiumScrumGroup.add(scrumPodium);

    // 20 Microphones jammed onto podium in an exaggerated fan arc
    const micColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899];
    for (let m = 0; m < 20; m++) {
      const angle = -0.9 + (m / 19) * 1.8;
      const stem = new THREE.Mesh(this.getCylinder(0.02, 0.02, 0.7, 4), this.silverMat);
      stem.position.set(Math.sin(angle) * 0.9, 2.0, -0.4 + Math.cos(angle) * 0.3);
      stem.rotation.z = -angle * 0.4;
      podiumScrumGroup.add(stem);

      const micCap = new THREE.Mesh(this.getCylinder(0.06, 0.06, 0.18, 6), this.createBasicMaterial({ color: micColors[m % micColors.length] }));
      micCap.position.set(stem.position.x, 2.35, stem.position.z);
      podiumScrumGroup.add(micCap);
    }

    // 4 Paparazzi Strobe Lights
    for (let f = 0; f < 4; f++) {
      const flash = new THREE.Mesh(this.getSphere(0.18, 6), this.createBasicMaterial({ color: 0xffffff }));
      flash.position.set(-1.2 + f * 0.8, 2.6, 0.8);
      podiumScrumGroup.add(flash);
    }

    districtC.add(podiumScrumGroup);

    // 2. The 4-Member Media Conga Line (Reporter 1 -> Reporter 2 -> Cameraman -> Boom Operator)
    const congaGroup = new THREE.Group();
    congaGroup.name = 'media_conga_line';
    congaGroup.position.set(-15.5, 0.6, -chunkLength * 0.45);

    // Deep Subterranean Conga Plinth
    const congaPlinth = new THREE.Mesh(this.getBox(4.0, 4.0, 10.0), this.parliamentSandstoneMat);
    congaPlinth.position.y = -2.0;
    congaGroup.add(congaPlinth);

    for (let c = 0; c < 4; c++) {
      const member = new THREE.Group();
      member.position.set(0, 0, c * 2.2);

      // Body / Suit
      const bodyMat = c === 0 ? this.royalBlueMat : (c === 1 ? this.darkSuitMat : (c === 2 ? this.yatraOrangeMat : this.yatraGreenMat));
      const body = new THREE.Mesh(this.getBox(0.5, 0.85, 0.35), bodyMat);
      body.position.y = 0.72;
      member.add(body);

      // Head
      const head = new THREE.Mesh(this.getCylinder(0.2, 0.2, 0.4, 8), this.cartoonSkinMat);
      head.position.y = 1.35;
      member.add(head);

      // Hair / Hat
      const hair = new THREE.Mesh(this.getSphere(0.22, 6), this.cartoonHairDarkMat);
      hair.position.set(0, 1.5, -0.04);
      member.add(hair);

      // Equipment according to comedy role:
      if (c === 0) {
        // Reporter 1: Huge red microphone pointing forward
        const mic = new THREE.Mesh(this.getCylinder(0.08, 0.08, 0.7, 6), this.goldMetalMat);
        mic.position.set(0, 1.1, -0.6);
        mic.rotation.x = -Math.PI * 0.45;
        member.add(mic);
      } else if (c === 1) {
        // Reporter 2: Interviewing Reporter 1 with a notepad & mic
        const pad = new THREE.Mesh(this.getBox(0.3, 0.4, 0.05), this.paperWhiteMat);
        pad.position.set(-0.25, 1.1, -0.4);
        member.add(pad);
      } else if (c === 2) {
        // Cameraman: Rolling broadcast camera
        const cam = new THREE.Mesh(this.getBox(0.4, 0.4, 0.7), this.cartoonHairDarkMat);
        cam.position.set(0, 1.2, -0.5);
        member.add(cam);
        const lens = new THREE.Mesh(this.getCylinder(0.12, 0.12, 0.3, 8), this.goldMetalMat);
        lens.position.set(0, 1.2, -0.9);
        lens.rotation.x = Math.PI / 2;
        member.add(lens);
      } else {
        // Boom Operator: 5m Boom Pole pointing down at Cameraman
        const boom = new THREE.Mesh(this.getCylinder(0.03, 0.03, 2.5, 6), this.silverMat);
        boom.position.set(0, 1.8, -1.0);
        boom.rotation.x = -Math.PI * 0.3;
        member.add(boom);
      }

      congaGroup.add(member);
    }

    director.registerMediaCongaLine(congaGroup);
    districtC.add(congaGroup);

    // 3. Signature Gag: TV News Anchor Interviewing Empty Chair at X = 16.5m
    const anchorStage = new THREE.Group();
    anchorStage.position.set(16.5, 0.6, -chunkLength * 0.3);

    // Deep Subterranean Foundation Plinth
    const anchorPlinth = new THREE.Mesh(this.getBox(7.2, 4.0, 7.2), this.parliamentSandstoneMat);
    anchorPlinth.position.y = -2.0;
    anchorStage.add(anchorPlinth);

    const stagePlatform = new THREE.Mesh(this.getCylinder(3.5, 3.5, 0.8, 16), this.woodMat);
    stagePlatform.position.y = 0.4;
    anchorStage.add(stagePlatform);

    // Empty Luxury Crimson Velvet Chair
    const emptyChair = new THREE.Group();
    emptyChair.position.set(-1.2, 0.8, 0);

    const seat = new THREE.Mesh(this.getBox(1.1, 0.3, 1.1), this.redVelvetMat);
    seat.position.y = 0.6;
    emptyChair.add(seat);

    const backrest = new THREE.Mesh(this.getBox(1.1, 1.4, 0.25), this.redVelvetMat);
    backrest.position.set(0, 1.3, -0.45);
    emptyChair.add(backrest);

    anchorStage.add(emptyChair);

    // Furious Animated TV Anchor Caricature
    const anchorFigure = new THREE.Group();
    anchorFigure.position.set(1.2, 0.8, 0);

    const anchorBody = new THREE.Mesh(this.getBox(0.5, 0.8, 0.35), this.darkSuitMat);
    anchorBody.position.y = 0.8;
    anchorFigure.add(anchorBody);

    const anchorHead = new THREE.Mesh(this.getCylinder(0.2, 0.2, 0.4, 8), this.cartoonSkinMat);
    anchorHead.position.y = 1.45;
    anchorFigure.add(anchorHead);

    const anchorArmL = new THREE.Mesh(this.getBox(0.12, 0.5, 0.12), this.darkSuitMat);
    anchorArmL.position.set(-0.35, 0.9, 0);
    anchorFigure.add(anchorArmL);

    const anchorArmR = new THREE.Mesh(this.getBox(0.12, 0.5, 0.12), this.darkSuitMat);
    anchorArmR.position.set(0.35, 0.9, 0);
    anchorFigure.add(anchorArmR);

    anchorStage.add(anchorFigure);

    // Comic speech bubble overhead
    const bubbleTex = RahulverseTextureCache.getEmptyChairSpeechBubbleTexture();
    const bubbleMat = this.createBasicMaterial({ map: bubbleTex });
    const bubbleMesh = new THREE.Mesh(this.getBox(3.4, 1.7, 0.1), bubbleMat);
    bubbleMesh.position.set(0, 3.6, 0);
    bubbleMesh.rotation.y = -Math.PI * 0.45;
    anchorStage.add(bubbleMesh);

    director.registerEmptyChairDebate(anchorArmL, anchorArmR, anchorHead, emptyChair, bubbleMesh);
    districtC.add(anchorStage);

    // 4. Secondary Stage: "Storm in a Teacup" Debate Platform at X = -16.5m
    const teacupStage = new THREE.Group();
    teacupStage.position.set(-16.5, 0.6, -chunkLength * 0.65);

    // Deep Subterranean Foundation Plinth
    const teacupPlinth = new THREE.Mesh(this.getBox(6.0, 4.0, 6.0), this.parliamentSandstoneMat);
    teacupPlinth.position.y = -2.0;
    teacupStage.add(teacupPlinth);

    const teacupStand = new THREE.Mesh(this.getBox(5.0, 1.0, 5.0), this.parliamentSandstoneMat);
    teacupStand.position.y = 0.5;
    teacupStage.add(teacupStand);

    // Giant Porcelain Teacup
    const cup = new THREE.Mesh(this.getCylinder(1.2, 0.8, 1.8, 12), this.yatraWhiteMat);
    cup.position.y = 1.9;
    teacupStage.add(cup);

    // Animated Steam Puffs
    const steamPuffs: { mesh: THREE.Mesh; baseY: number; speed: number; phase: number }[] = [];
    for (let s = 0; s < 4; s++) {
      const puff = new THREE.Mesh(this.getSphere(0.35, 6), new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7
      }));
      puff.position.set(0, 2.8 + s * 0.5, 0);
      teacupStage.add(puff);
      steamPuffs.push({ mesh: puff, baseY: 2.8, speed: 1.2 + s * 0.3, phase: s * 1.5 });
    }

    const deb1 = this.buildKejriwalCaricature(teacupStage, -1.8, 1.0, 0, director);
    const deb2 = this.buildMamataCaricature(teacupStage, 1.8, 1.0, 0, director);

    director.registerTeacupDebate(steamPuffs, deb1, deb2);
    group.add(teacupStage);

    // GATE B HERO GAG: THE GREAT PRESS SCRUM DAISY-CHAIN (West side at X = -16.5m, Z = -chunkLength * 0.75)
    this.buildPressScrumStage(group, -16.5, 0.6, -chunkLength * 0.75, director);

    // CROSSOVER GAG: THE SELFIE BATTLE & CHAI VENDOR TWIST (East side at X = +16.5m, Z = -chunkLength * 0.75)
    this.buildSelfieBattleStage(group, 16.5, 0.6, -chunkLength * 0.75, director);
  }

  // =========================================================================
  // DISTRICT D — ALLIANCE ROLLERCOASTER
  // =========================================================================
  public buildAllianceRollercoasterDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: RahulComedyEventDirector
  ): void {
    const districtD = new THREE.Group();
    districtD.name = 'district_d_alliance_rollercoaster';
    group.add(districtD);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    // Articulated Surreal Carnival Facades behind the rollercoasters with continuous sidewalks
    [-1, 1].forEach((side) => {
      this.buildSurrealYatraFacade(districtD, roadbedWidth, chunkLength, side, 3, rng, detail);

      const walkW = 22.0;
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 4.3, chunkLength), this.parliamentSandstoneMat);
      walk.position.set(wx, -1.85, -chunkLength * 0.5);
      districtD.add(walk);
    });

    // 1. Festive Rollercoaster Carnival Overhead Arches (strictly Y >= 9.6m)
    for (let z = 15; z < chunkLength - 15; z += 40) {
      const arch = new THREE.Group();
      arch.position.set(0, 0, -z);

      // Side Pylons at |X| = 9.2m (strictly outside |X| <= 4.2m)
      [-roadbedWidth * 0.5 - 3.2, roadbedWidth * 0.5 + 3.2].forEach((px) => {
        const pylon = new THREE.Mesh(this.getBox(1.4, 14.5, 1.4), this.neonMagentaMat);
        pylon.position.set(px, 3.25, 0); // goes down to Y = -4.0m
        arch.add(pylon);

        const finial = new THREE.Mesh(this.getSphere(0.8, 8), this.goldMetalMat);
        finial.position.set(px, 11.0, 0);
        arch.add(finial);
      });

      // Overhead Carnival Track Arch (Y = 10.2m, height 0.8m -> min.y = 9.8m > 8.5m)
      const overheadArch = new THREE.Mesh(this.getBox(roadbedWidth + 8.0, 0.8, 1.8), this.neonMagentaMat);
      overheadArch.position.set(0, 10.2, 0);
      arch.add(overheadArch);

      // Festive Marquee Lamps along the overhead arch
      for (let l = -5; l <= 5; l += 2.5) {
        const lamp = new THREE.Mesh(this.getSphere(0.28, 6), this.goldMetalMat);
        lamp.position.set(l, 9.6, 0);
        arch.add(lamp);
      }

      districtD.add(arch);
    }

    // 2. Kinetic Monumental Handshake Statues on Pedestals
    [-1, 1].forEach((side) => {
      const statueGroup = new THREE.Group();
      statueGroup.position.set(side * 16.5, 0.6, -chunkLength * 0.5);

      // Deep Subterranean Statue Plinth
      const statuePlinth = new THREE.Mesh(this.getBox(6.0, 4.0, 6.0), this.parliamentSandstoneMat);
      statuePlinth.position.y = -2.0;
      statueGroup.add(statuePlinth);

      const pedestal = new THREE.Mesh(this.getBox(5.0, 3.0, 5.0), this.yatraWhiteMat);
      pedestal.position.y = 1.5;
      statueGroup.add(pedestal);

      // Two Golden Hands clasped in handshake
      const hand1 = new THREE.Mesh(this.getBox(1.2, 1.2, 2.2), this.goldMetalMat);
      hand1.position.set(-0.5, 3.8, 0);
      statueGroup.add(hand1);

      const hand2 = new THREE.Mesh(this.getBox(1.2, 1.2, 2.2), this.goldMetalMat);
      hand2.position.set(0.5, 3.8, 0);
      statueGroup.add(hand2);

      // Mechanical rotating wrist gears
      const gear1 = new THREE.Mesh(this.getCylinder(0.6, 0.6, 0.2, 8), this.silverMat);
      gear1.position.set(-1.2, 3.8, 0);
      gear1.rotation.x = Math.PI / 2;
      statueGroup.add(gear1);

      const gear2 = new THREE.Mesh(this.getCylinder(0.6, 0.6, 0.2, 8), this.silverMat);
      gear2.position.set(1.2, 3.8, 0);
      gear2.rotation.x = Math.PI / 2;
      statueGroup.add(gear2);

      director.registerHandshakeStatue(hand1, hand2, [gear1, gear2]);
      group.add(statueGroup);
    });

    // 3. Signature Gag: Coalition Musical Chairs Carousel Arena at X = -16.0m
    const disputeStage = new THREE.Group();
    disputeStage.name = 'middle_seat_dispute';
    disputeStage.position.set(-16.0, 0.6, -chunkLength * 0.4);

    const arenaBase = new THREE.Mesh(this.getCylinder(4.8, 5.2, 0.8, 16), this.parliamentSandstoneMat);
    arenaBase.position.y = 0.4;
    disputeStage.add(arenaBase);

    // Central Conference Negotiation Table
    const table = new THREE.Mesh(this.getCylinder(2.2, 2.2, 1.0, 16), this.woodMat);
    table.position.y = 1.0;
    disputeStage.add(table);

    // 4 Coalition Chairs with 4 Cartoon Leader Figures (Rahul, Kejriwal, Mamata, Nitish)
    const allChairs: { group: THREE.Group; baseAngle: number; radius: number }[] = [];
    const leaderBuilders = [
      (g: THREE.Group) => this.buildRahulCaricature(g, 0, 0.7, 0, 'VICTORY', director),
      (g: THREE.Group) => this.buildKejriwalCaricature(g, 0, 0.7, 0, director),
      (g: THREE.Group) => this.buildMamataCaricature(g, 0, 0.7, 0, director),
      (g: THREE.Group) => this.buildNitishCaricature(g, 0, 0.7, 0, director)
    ];

    const chairColors = [this.yatraBlueMat, this.yatraOrangeMat, this.royalBlueMat, this.yatraGreenMat];
    let chair1Group: THREE.Group | undefined;
    let chair2Group: THREE.Group | undefined;

    for (let i = 0; i < 4; i++) {
      const chairGroup = new THREE.Group();
      const angle = (i / 4) * Math.PI * 2;
      const radius = 2.8;
      chairGroup.position.set(Math.cos(angle) * radius, 0.8, Math.sin(angle) * radius);

      const seatMesh = new THREE.Mesh(this.getBox(0.9, 0.3, 0.9), chairColors[i]);
      seatMesh.position.y = 0.5;
      chairGroup.add(seatMesh);

      const backMesh = new THREE.Mesh(this.getBox(0.9, 0.9, 0.15), chairColors[i]);
      backMesh.position.set(0, 1.05, -0.4);
      chairGroup.add(backMesh);

      // Add cartoon politician seated on chair
      leaderBuilders[i](chairGroup);

      disputeStage.add(chairGroup);
      allChairs.push({ group: chairGroup, baseAngle: angle, radius });

      if (i === 0) chair1Group = chairGroup;
      if (i === 1) chair2Group = chairGroup;
    }

    director.registerMiddleSeatDispute(chair1Group!, chair2Group!, -0.8, 0.8, table, allChairs);
    group.add(disputeStage);

    // 4. Interlocking Jigsaw Puzzle Pieces on Robotic Crane Arms at X = 16.5m
    const puzzleGroup = new THREE.Group();
    puzzleGroup.position.set(16.5, 4.5, -chunkLength * 0.4);

    const armL = new THREE.Group();
    armL.position.set(-2.5, 0, 0);
    const craneL = new THREE.Mesh(this.getCylinder(0.12, 0.12, 3.5, 6), this.goldMetalMat);
    craneL.position.y = 1.75;
    armL.add(craneL);
    puzzleGroup.add(armL);

    const pL = new THREE.Group();
    pL.position.set(0, 0, 0);
    const pLMesh = new THREE.Mesh(this.getBox(2.2, 2.2, 0.45), this.neonCyanMat);
    pL.add(pLMesh);
    // Puzzle tab
    const tab = new THREE.Mesh(this.getCylinder(0.4, 0.4, 0.45, 8), this.neonCyanMat);
    tab.position.set(1.1, 0, 0);
    pL.add(tab);
    puzzleGroup.add(pL);

    const armR = new THREE.Group();
    armR.position.set(2.5, 0, 0);
    const craneR = new THREE.Mesh(this.getCylinder(0.12, 0.12, 3.5, 6), this.goldMetalMat);
    craneR.position.y = 1.75;
    armR.add(craneR);
    puzzleGroup.add(armR);

    const pR = new THREE.Group();
    pR.position.set(0, 0, 0);
    const pRMesh = new THREE.Mesh(this.getBox(2.2, 2.2, 0.45), this.yatraOrangeMat);
    pR.add(pRMesh);
    puzzleGroup.add(pR);

    director.registerPuzzlePieces(pL, pR, armL, armR);
    group.add(puzzleGroup);

    // Satirical Alliance Carnival Marquee Billboard
    const marqueeTex = RahulverseTextureCache.getCarnivalMarqueeTexture();
    const marquee = new THREE.Mesh(this.getBox(6.5, 1.8, 0.1), new THREE.MeshBasicMaterial({ map: marqueeTex }));
    marquee.position.set(-15.5, 3.2, -chunkLength * 0.65);
    marquee.rotation.y = Math.PI * 0.4;
    group.add(marquee);

    // 5. Gate B Hero Gag: The Alliance Musical Chairs & Nitish 360 Spin
    this.buildAllianceChairsRunawayStage(group, 16.5, 0.6, -chunkLength * 0.75, director);

    // 6. Crossover Gag: The Microphone Chase
    this.buildMicrophoneChaseStage(group, -16.5, 0.6, -chunkLength * 0.75, director);
  }

  // =========================================================================
  // DISTRICT E — THE GREAT POLITICAL MULTIVERSE
  // =========================================================================
  public buildPoliticalMultiverseDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: RahulComedyEventDirector
  ): void {
    const districtE = new THREE.Group();
    districtE.name = 'district_e_political_multiverse';
    group.add(districtE);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    // Articulated Surreal Multiverse Facades behind quantum monuments with continuous sidewalks
    [-1, 1].forEach((side) => {
      this.buildSurrealYatraFacade(districtE, roadbedWidth, chunkLength, side, 4, rng, detail);

      const walkW = 22.0;
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 4.3, chunkLength), this.parliamentSandstoneMat);
      walk.position.set(wx, -1.85, -chunkLength * 0.5);
      districtE.add(walk);
    });

    // 1. Cosmic Floating Spires & Dimensional Quantum Obelisks
    [-1, 1].forEach((side) => {
      for (let z = 12; z < chunkLength - 12; z += 30) {
        const spireGroup = new THREE.Group();
        spireGroup.position.set(side * 16.5, 0.6, -z);

        // Deep Subterranean Spire Plinth
        const spirePlinth = new THREE.Mesh(this.getBox(4.2, 4.0, 4.2), this.parliamentSandstoneMat);
        spirePlinth.position.y = -2.0;
        spireGroup.add(spirePlinth);

        const base = new THREE.Mesh(this.getBox(3.4, 1.0, 3.4), this.yatraBlueMat);
        spireGroup.add(base);

        const spire = new THREE.Mesh(this.getCylinder(0.2, 0.9, 16.0, 6), this.goldMetalMat);
        spire.position.y = 8.0;
        spireGroup.add(spire);

        // Floating glowing quantum ring
        const ring = new THREE.Mesh(this.getTorus(1.8, 0.2, 8, 16), this.neonCyanMat);
        ring.position.y = 12.0;
        spireGroup.add(ring);

        districtE.add(spireGroup);
      }
    });

    // 2. Signature Spectacle: Twin Swirling Multiverse Portals with Dynamic Rival Swap!
    const portalGroup = new THREE.Group();
    portalGroup.name = 'multiverse_vortex_portal';
    portalGroup.position.set(-15.5, 4.5, -chunkLength * 0.5);

    // Primary Swirling Vortex Ring (maintains backward compatibility with unit tests)
    const ringMesh = new THREE.Mesh(this.getTorus(3.4, 0.4, 10, 24), this.neonCyanMat);
    portalGroup.add(ringMesh);

    const vortexMesh = new THREE.Mesh(this.getPlane(6.0, 6.0), new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    }));
    portalGroup.add(vortexMesh);

    const holoMesh = new THREE.Mesh(this.getCylinder(0.4, 0.2, 1.4, 6), this.goldMetalMat);
    holoMesh.position.y = 0.2;
    portalGroup.add(holoMesh);

    // Twin Multiverse Gateway Dioramas:
    // Portal A (Cyan energy): Rahul running forward, frantically chased by Modi!
    const portalA = new THREE.Group();
    portalA.position.set(-3.5, 0, 0);

    const ringA = new THREE.Mesh(this.getTorus(2.4, 0.3, 8, 20), this.neonCyanMat);
    portalA.add(ringA);

    const innerA = new THREE.Mesh(this.getPlane(4.2, 4.2), new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    }));
    portalA.add(innerA);

    // Diorama A figures: Rahul in lead, Modi chasing
    const leadRahul = this.buildRahulCaricature(portalA, 0.6, -1.0, 0.3, 'RUN', director);
    leadRahul.scale.setScalar(0.75);
    const chaseModi = this.buildModiCaricature(portalA, -0.6, -1.0, 0.3, 'CHASE', director);
    chaseModi.scale.setScalar(0.75);
    portalGroup.add(portalA);

    // Portal B (Magenta energy): Modi running forward, frantically chased by Rahul!
    const portalB = new THREE.Group();
    portalB.position.set(3.5, 0, 0);

    const ringB = new THREE.Mesh(this.getTorus(2.4, 0.3, 8, 20), this.neonPinkMat);
    portalB.add(ringB);

    const innerB = new THREE.Mesh(this.getPlane(4.2, 4.2), new THREE.MeshBasicMaterial({
      color: 0xd946ef,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    }));
    portalB.add(innerB);

    // Diorama B figures: Modi in lead, Rahul chasing
    const leadModi = this.buildModiCaricature(portalB, 0.6, -1.0, 0.3, 'RUN', director);
    leadModi.scale.setScalar(0.75);
    const chaseRahul = this.buildRahulCaricature(portalB, -0.6, -1.0, 0.3, 'CHASE', director);
    chaseRahul.scale.setScalar(0.75);
    portalGroup.add(portalB);

    // "PLOT TWIST UNLOCKED" Billboard suspended above twin portals
    const twistTex = RahulverseTextureCache.getPlotTwistBillboardTexture();
    const twistSign = new THREE.Mesh(this.getBox(6.8, 3.2, 0.15), new THREE.MeshBasicMaterial({ map: twistTex }));
    twistSign.position.set(0, 7.2, 0);
    twistSign.rotation.y = Math.PI * 0.45;
    portalGroup.add(twistSign);

    director.registerMultiversePortal(ringMesh, vortexMesh, holoMesh, {
      portalA,
      portalB,
      signMesh: twistSign,
      baseXA: -3.5,
      baseXB: 3.5,
      phase: 0,
      swapped: false
    });
    group.add(portalGroup);

    // 3. Signature Gag: Cosmic Microphone Space Launch at X = 16.0m
    const launchPad = new THREE.Group();
    launchPad.position.set(16.0, 0.6, -chunkLength * 0.4);

    const padBase = new THREE.Mesh(this.getCylinder(3.0, 3.5, 1.2, 12), this.parliamentSandstoneMat);
    padBase.position.y = 0.6;
    launchPad.add(padBase);

    // Rocket Pod & Giant Cosmic Microphone ascending vertically
    const rocketMicGroup = new THREE.Group();
    rocketMicGroup.position.set(0, 1.2, 0);

    const micShaft = new THREE.Mesh(this.getCylinder(0.25, 0.25, 3.0, 8), this.goldMetalMat);
    micShaft.position.y = 1.5;
    rocketMicGroup.add(micShaft);

    const micBall = new THREE.Mesh(this.getSphere(0.65, 10), this.yatraBlueMat);
    micBall.position.y = 3.2;
    rocketMicGroup.add(micBall);

    // Booster exhaust glow cone
    const exhaustCone = new THREE.Mesh(this.getCylinder(0.1, 0.5, 0.8, 8), this.neonCyanMat);
    exhaustCone.position.y = -0.4;
    rocketMicGroup.add(exhaustCone);

    launchPad.add(rocketMicGroup);

    // Bewildered politician looking straight up into the sky
    const onlooker = new THREE.Group();
    onlooker.position.set(1.5, 1.2, 0);

    const oBody = new THREE.Mesh(this.getBox(0.48, 0.75, 0.32), this.yatraWhiteMat);
    oBody.position.y = 0.45;
    onlooker.add(oBody);

    const oHead = new THREE.Mesh(this.getCylinder(0.2, 0.2, 0.4, 8), this.cartoonSkinMat);
    oHead.position.y = 1.05;
    onlooker.add(oHead);

    launchPad.add(onlooker);

    director.registerCosmicMicLaunch(rocketMicGroup, exhaustCone, oHead, 1.2);
    group.add(launchPad);

    // 4. Crossover Gag: The Party Office Mix-Up
    this.buildPartyOfficeMixupStage(group, -16.5, 0.6, -chunkLength * 0.75, director);
  }

  // =========================================================================
  // CARICATURE PARODY CHARACTER BUILDERS
  // =========================================================================

  /**
   * Builds cartoon caricature of Rahul Gandhi
   * Features: Athletic crisp white kurta / polo, navy trousers, dark swept hair,
   * energetic gesture, namaste / wave / debate poses.
   */
  public buildRahulCaricature(
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    pose: 'VICTORY' | 'RUN' | 'DEBATE' | 'CHASE' = 'DEBATE',
    director?: RahulComedyEventDirector
  ): THREE.Group {
    const char = new THREE.Group();
    char.name = 'caricature_rahul';
    char.position.set(x, y, z);

    // Navy athletic trousers
    const legs = new THREE.Mesh(this.getBox(0.42, 0.8, 0.32), this.darkSuitMat);
    legs.position.y = 0.4;
    char.add(legs);

    // Crisp White Yatra Kurta / Polo
    const torso = new THREE.Mesh(this.getBox(0.48, 0.7, 0.34), this.yatraWhiteMat);
    torso.position.y = 1.1;
    char.add(torso);

    // Head
    const head = new THREE.Mesh(this.getCylinder(0.19, 0.19, 0.38, 10), this.cartoonSkinMat);
    head.position.y = 1.65;
    char.add(head);

    // Dark swept hair
    const hair = new THREE.Mesh(this.getSphere(0.22, 8), this.cartoonHairDarkMat);
    hair.position.set(0, 1.8, -0.02);
    char.add(hair);

    // Expressive arms
    const armL = new THREE.Mesh(this.getBox(0.12, 0.52, 0.12), this.yatraWhiteMat);
    armL.position.set(-0.34, 1.15, 0);
    if (pose === 'VICTORY' || pose === 'RUN') {
      armL.rotation.z = 0.7;
      armL.position.y = 1.35;
    } else {
      armL.rotation.z = 0.4;
    }
    char.add(armL);

    const armR = new THREE.Mesh(this.getBox(0.12, 0.52, 0.12), this.yatraWhiteMat);
    armR.position.set(0.34, 1.15, 0);
    if (pose === 'VICTORY') {
      armR.rotation.z = -0.7;
      armR.position.y = 1.35;
    } else if (pose === 'RUN' || pose === 'CHASE') {
      armR.rotation.x = -0.8;
    } else {
      armR.rotation.z = -0.4;
    }
    char.add(armR);

    parent.add(char);
    return char;
  }

  /**
   * Builds cartoon caricature of Narendra Modi
   * Features: Saffron Nehru waistcoat over white kurta, mandarin collar, silver hair,
   * silver trimmed beard/mustache, waving gesture.
   */
  public buildModiCaricature(
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    pose: 'VICTORY' | 'RUN' | 'DEBATE' | 'CHASE' = 'DEBATE',
    director?: RahulComedyEventDirector
  ): THREE.Group {
    const char = new THREE.Group();
    char.name = 'caricature_modi';
    char.position.set(x, y, z);

    // White Kurta legs
    const legs = new THREE.Mesh(this.getBox(0.44, 0.78, 0.34), this.yatraWhiteMat);
    legs.position.y = 0.39;
    char.add(legs);

    // Saffron Nehru Waistcoat
    const torso = new THREE.Mesh(this.getBox(0.52, 0.68, 0.38), this.saffronWaistcoatMat);
    torso.position.y = 1.05;
    char.add(torso);

    // Mandarin Collar
    const collar = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.12, 8), this.saffronWaistcoatMat);
    collar.position.y = 1.42;
    char.add(collar);

    // Head
    const head = new THREE.Mesh(this.getCylinder(0.21, 0.19, 0.38, 10), this.cartoonSkinMat);
    head.position.y = 1.62;
    char.add(head);

    // Silver swept hair
    const hair = new THREE.Mesh(this.getSphere(0.23, 8), this.cartoonHairSilverMat);
    hair.position.set(0, 1.78, -0.04);
    char.add(hair);

    // Silver trimmed beard & mustache
    const beard = new THREE.Mesh(this.getBox(0.28, 0.22, 0.18), this.cartoonHairSilverMat);
    beard.position.set(0, 1.5, 0.14);
    char.add(beard);

    // Spectacles frame
    const specs = new THREE.Mesh(this.getBox(0.36, 0.08, 0.04), this.goldMetalMat);
    specs.position.set(0, 1.68, 0.2);
    char.add(specs);

    // Arms
    const armL = new THREE.Mesh(this.getBox(0.13, 0.52, 0.13), this.yatraWhiteMat);
    armL.position.set(-0.36, 1.1, 0);
    armL.rotation.z = pose === 'VICTORY' ? 0.75 : 0.3;
    char.add(armL);

    const armR = new THREE.Mesh(this.getBox(0.13, 0.52, 0.13), this.yatraWhiteMat);
    armR.position.set(0.36, 1.1, 0);
    armR.rotation.z = -0.65;
    armR.position.y = 1.35;
    char.add(armR);

    parent.add(char);
    return char;
  }

  /**
   * Builds cartoon caricature of Arvind Kejriwal
   * Features: Signature woolen muffler wrapped around neck, brown sweater vest, spectacles.
   */
  public buildKejriwalCaricature(
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    director?: RahulComedyEventDirector
  ): THREE.Group {
    const char = new THREE.Group();
    char.name = 'caricature_kejriwal';
    char.position.set(x, y, z);

    const legs = new THREE.Mesh(this.getBox(0.4, 0.75, 0.3), this.roadbedWallMat);
    legs.position.y = 0.38;
    char.add(legs);

    // Brown sweater vest
    const torso = new THREE.Mesh(this.getBox(0.48, 0.65, 0.34), this.woodMat);
    torso.position.y = 1.0;
    char.add(torso);

    // Woolen Muffler wrapped around neck
    const muffler = new THREE.Mesh(this.getTorus(0.28, 0.12, 6, 12), this.yatraOrangeMat);
    muffler.position.set(0, 1.36, 0);
    char.add(muffler);

    const head = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.36, 8), this.cartoonSkinMat);
    head.position.y = 1.58;
    char.add(head);

    const specs = new THREE.Mesh(this.getBox(0.34, 0.08, 0.04), this.darkSuitMat);
    specs.position.set(0, 1.62, 0.18);
    char.add(specs);

    parent.add(char);
    return char;
  }

  /**
   * Builds cartoon caricature of Mamata Banerjee
   * Features: White cotton saree with royal blue border, hawai chappals, animated gestures.
   */
  public buildMamataCaricature(
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    director?: RahulComedyEventDirector
  ): THREE.Group {
    const char = new THREE.Group();
    char.name = 'caricature_mamata';
    char.position.set(x, y, z);

    // White Saree with blue border
    const saree = new THREE.Mesh(this.getCylinder(0.24, 0.35, 1.2, 10), this.yatraWhiteMat);
    saree.position.y = 0.6;
    char.add(saree);

    const blueBorder = new THREE.Mesh(this.getTorus(0.36, 0.05, 6, 12), this.royalBlueMat);
    blueBorder.position.y = 0.1;
    char.add(blueBorder);

    // Upper Pallu draped diagonally
    const pallu = new THREE.Mesh(this.getBox(0.45, 0.6, 0.32), this.yatraWhiteMat);
    pallu.position.y = 1.1;
    char.add(pallu);

    const head = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.35, 8), this.cartoonSkinMat);
    head.position.y = 1.55;
    char.add(head);

    // Swept bun hair
    const bun = new THREE.Mesh(this.getSphere(0.18, 8), this.cartoonHairSilverMat);
    bun.position.set(0, 1.65, -0.15);
    char.add(bun);

    parent.add(char);
    return char;
  }

  /**
   * Builds cartoon caricature of Nitish Kumar
   */
  public buildNitishCaricature(
    parent: THREE.Group,
    x: number,
    y: number,
    z: number,
    director?: RahulComedyEventDirector
  ): THREE.Group {
    const char = new THREE.Group();
    char.name = 'caricature_nitish';
    char.position.set(x, y, z);

    const legs = new THREE.Mesh(this.getBox(0.42, 0.75, 0.32), this.yatraWhiteMat);
    legs.position.y = 0.38;
    char.add(legs);

    const torso = new THREE.Mesh(this.getBox(0.48, 0.65, 0.34), this.parliamentSandstoneMat);
    torso.position.y = 1.0;
    char.add(torso);

    const head = new THREE.Mesh(this.getCylinder(0.19, 0.19, 0.36, 8), this.cartoonSkinMat);
    head.position.y = 1.55;
    char.add(head);

    const specs = new THREE.Mesh(this.getBox(0.32, 0.08, 0.04), this.goldMetalMat);
    specs.position.set(0, 1.6, 0.18);
    char.add(specs);

    parent.add(char);
    return char;
  }

  // =========================================================================
  // GATE A & GATE B POLITICAL MEME UNIVERSE SCENES & CROSSOVERS
  // =========================================================================

  /**
   * GATE A: The Parliament Hug & Wink
   * Parliamentary green bench chamber with seated Modi, walking Rahul who wraps him in a cartoon bear hug,
   * pops a floating heart and makes Modi's spectacles jump, then turns to the player camera to deliver
   * an iconic wink with arched eyebrow and yellow sparkle star while the gallery cameraman topples backwards!
   */
  public buildParliamentHugAndWinkStage(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: RahulComedyEventDirector
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'rahul_parliament_hug_and_wink';
    stage.position.set(x, y, z);

    // Sandstone Plinth & Green Leather Floor
    const plinth = new THREE.Mesh(this.getBox(9.0, 0.8, 9.0), this.parliamentSandstoneMat);
    plinth.position.y = 0.4;
    stage.add(plinth);

    const greenFloor = new THREE.Mesh(this.getBox(8.2, 0.06, 8.2), this.parliamentGreenMat);
    greenFloor.position.set(0, 0.83, 0);
    stage.add(greenFloor);

    // Treasury Bench with Seated Modi on Left
    const treasuryBench = new THREE.Mesh(this.getBox(2.2, 1.1, 1.4), this.parliamentGreenMat);
    treasuryBench.position.set(-0.7, 1.1, 0);
    stage.add(treasuryBench);

    // Modi Caricature in Seated Pose
    const modi = new THREE.Group();
    modi.name = 'seated_modi';
    modi.position.set(-0.7, 0.8, 0);

    const mLegs = new THREE.Mesh(this.getBox(0.44, 0.5, 0.4), this.yatraWhiteMat);
    mLegs.position.y = 0.25;
    modi.add(mLegs);

    const mTorso = new THREE.Mesh(this.getBox(0.52, 0.65, 0.38), this.saffronWaistcoatMat);
    mTorso.position.y = 0.85;
    modi.add(mTorso);

    const mHead = new THREE.Mesh(this.getCylinder(0.21, 0.19, 0.38, 10), this.cartoonSkinMat);
    mHead.position.y = 1.45;
    modi.add(mHead);

    const mHair = new THREE.Mesh(this.getSphere(0.23, 8), this.cartoonHairSilverMat);
    mHair.position.set(0, 1.62, -0.04);
    modi.add(mHair);

    const mBeard = new THREE.Mesh(this.getBox(0.28, 0.22, 0.18), this.cartoonHairSilverMat);
    mBeard.position.set(0, 1.34, 0.14);
    modi.add(mBeard);

    // Articulated Spectacles that pop up in surprise
    const specs = new THREE.Mesh(this.getBox(0.36, 0.08, 0.04), this.goldMetalMat);
    specs.position.set(0, 1.52, 0.20);
    modi.add(specs);
    stage.add(modi);

    // Rahul Caricature that strides across floor & winks
    const rahul = new THREE.Group();
    rahul.name = 'striding_rahul';
    rahul.position.set(-2.8, 0.8, 0);

    const rLegs = new THREE.Mesh(this.getBox(0.42, 0.8, 0.32), this.darkSuitMat);
    rLegs.position.y = 0.4;
    rahul.add(rLegs);

    const rTorso = new THREE.Mesh(this.getBox(0.48, 0.7, 0.34), this.yatraWhiteMat);
    rTorso.position.y = 1.1;
    rahul.add(rTorso);

    const rHead = new THREE.Mesh(this.getCylinder(0.19, 0.19, 0.38, 10), this.cartoonSkinMat);
    rHead.position.y = 1.65;
    rahul.add(rHead);

    const rHair = new THREE.Mesh(this.getSphere(0.22, 8), this.cartoonHairDarkMat);
    rHair.position.set(0, 1.8, -0.02);
    rahul.add(rHair);

    // Left Eyebrow for arched winking
    const eyebrowL = new THREE.Mesh(this.getBox(0.12, 0.03, 0.03), this.cartoonHairDarkMat);
    eyebrowL.position.set(-0.08, 1.78, 0.20);
    rahul.add(eyebrowL);

    // Left Eyelid that snaps shut
    const eyelidL = new THREE.Mesh(this.getBox(0.10, 0.06, 0.02), this.cartoonSkinMat);
    eyelidL.position.set(-0.08, 1.70, 0.21);
    rahul.add(eyelidL);

    // Tooth sparkle star (pops up at corner of wink smile)
    const sparkleStar = new THREE.Group();
    sparkleStar.position.set(0.22, 1.65, 0.25);
    const sBeam1 = new THREE.Mesh(this.getBox(0.35, 0.05, 0.03), this.neonCyanMat);
    sparkleStar.add(sBeam1);
    const sBeam2 = new THREE.Mesh(this.getBox(0.05, 0.35, 0.03), this.neonCyanMat);
    sparkleStar.add(sBeam2);
    sparkleStar.visible = false;
    rahul.add(sparkleStar);

    // Arms
    const rArmL = new THREE.Mesh(this.getBox(0.12, 0.52, 0.12), this.yatraWhiteMat);
    rArmL.position.set(-0.34, 1.15, 0);
    rahul.add(rArmL);

    const rArmR = new THREE.Mesh(this.getBox(0.12, 0.52, 0.12), this.yatraWhiteMat);
    rArmR.position.set(0.34, 1.15, 0);
    rahul.add(rArmR);
    stage.add(rahul);

    // Cartoon Floating Heart Mesh
    const heartMesh = new THREE.Mesh(this.getSphere(0.45, 8), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.5 }));
    heartMesh.position.set(-0.7, 3.2, 0);
    heartMesh.scale.set(0.01, 0.01, 0.01);
    stage.add(heartMesh);

    // Press Gallery Scaffold in background with Cameraman that topples backwards!
    const galleryGroup = new THREE.Group();
    galleryGroup.position.set(2.8, 0.8, -2.5);

    const gallRailing = new THREE.Mesh(this.getBox(2.8, 1.2, 0.2), this.goldMetalMat);
    gallRailing.position.set(0, 0.6, 0);
    galleryGroup.add(gallRailing);

    // Cameraman Tripod
    const tripod = new THREE.Mesh(this.getCylinder(0.06, 0.16, 1.4, 5), this.silverMat);
    tripod.position.set(0, 1.3, 0.4);
    galleryGroup.add(tripod);

    const cameraBox = new THREE.Mesh(this.getBox(0.35, 0.25, 0.5), this.darkSuitMat);
    cameraBox.position.set(0, 2.05, 0.4);
    galleryGroup.add(cameraBox);

    // Cameraman Figure that falls backwards
    const cameraman = new THREE.Group();
    cameraman.position.set(0, 0.6, -0.2);

    const cBody = new THREE.Mesh(this.getBox(0.42, 0.65, 0.28), this.royalBlueMat);
    cBody.position.y = 0.75;
    cameraman.add(cBody);

    const cHead = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.32, 8), this.cartoonSkinMat);
    cHead.position.y = 1.25;
    cameraman.add(cHead);
    galleryGroup.add(cameraman);
    stage.add(galleryGroup);

    director.registerParliamentHugAndWink(
      rahul,
      modi,
      specs,
      cameraman,
      tripod,
      eyebrowL,
      eyelidL,
      sparkleStar,
      heartMesh
    );

    group.add(stage);
    return stage;
  }

  /**
   * GATE B: Parliamentary Microphone Chaos
   * Round conference table with gooseneck microphones on wheels that duck, stretch, and debate each other!
   */
  public buildMicrophoneChaosStage(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: RahulComedyEventDirector
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'rahul_mic_chaos';
    stage.position.set(x, y, z);

    const base = new THREE.Mesh(this.getBox(8.0, 0.8, 8.0), this.parliamentSandstoneMat);
    base.position.y = 0.4;
    stage.add(base);

    // Central Debating Table
    const table = new THREE.Mesh(this.getCylinder(2.4, 2.5, 0.9, 12), this.woodMat);
    table.position.y = 1.25;
    stage.add(table);

    // 4 Animated Gooseneck Mics on table
    const mics: { group: THREE.Group; stem: THREE.Object3D; head: THREE.Object3D; wheels?: THREE.Object3D }[] = [];
    for (let m = 0; m < 4; m++) {
      const ang = (m / 4) * Math.PI * 2;
      const mGroup = new THREE.Group();
      mGroup.position.set(Math.cos(ang) * 1.4, 1.7, Math.sin(ang) * 1.4);

      const mBase = new THREE.Mesh(this.getBox(0.3, 0.1, 0.3), this.goldMetalMat);
      mGroup.add(mBase);

      const stem = new THREE.Mesh(this.getCylinder(0.04, 0.05, 1.1, 6), this.silverMat);
      stem.position.y = 0.55;
      mGroup.add(stem);

      const head = new THREE.Mesh(this.getSphere(0.12, 8), this.yatraBlueMat);
      head.position.y = 1.1;
      mGroup.add(head);

      stage.add(mGroup);
      mics.push({ group: mGroup, stem, head });
    }

    director.registerMicrophoneChaos(stage, mics);
    group.add(stage);
    return stage;
  }

  /**
   * GATE B: The Great Press Scrum Daisy-Chain
   * 4 reporters arranged in a circle, each holding a mic to the next reporter's mouth!
   */
  public buildPressScrumStage(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: RahulComedyEventDirector
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'rahul_press_scrum';
    stage.position.set(x, y, z);

    const base = new THREE.Mesh(this.getBox(8.0, 0.8, 8.0), this.parliamentSandstoneMat);
    base.position.y = 0.4;
    stage.add(base);

    const reporters: { group: THREE.Group; micArm: THREE.Object3D; baseAngle: number }[] = [];
    const radius = 2.0;

    for (let r = 0; r < 4; r++) {
      const ang = (r / 4) * Math.PI * 2;
      const rGroup = new THREE.Group();
      rGroup.position.set(Math.cos(ang) * radius, 0.8, Math.sin(ang) * radius);

      const rTorso = new THREE.Mesh(this.getBox(0.42, 0.65, 0.28), this.royalBlueMat);
      rTorso.position.y = 0.75;
      rGroup.add(rTorso);

      const rHead = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.32, 8), this.cartoonSkinMat);
      rHead.position.y = 1.25;
      rGroup.add(rHead);

      // Arm lunging with microphone
      const micArm = new THREE.Mesh(this.getBox(0.1, 0.1, 0.65), this.goldMetalMat);
      micArm.position.set(0.2, 0.9, 0.35);
      rGroup.add(micArm);

      const micHead = new THREE.Mesh(this.getSphere(0.12, 6), this.yatraOrangeMat);
      micHead.position.set(0.2, 0.9, 0.7);
      rGroup.add(micHead);

      rGroup.rotation.y = ang + Math.PI * 0.5; // Facing the next reporter in circle
      stage.add(rGroup);

      reporters.push({ group: rGroup, micArm, baseAngle: ang + Math.PI * 0.5 });
    }

    director.registerPressScrum(stage, reporters);
    group.add(stage);
    return stage;
  }

  /**
   * GATE B: The Alliance Musical Chairs with Running Legs
   * Round conference table with Nitish in 360-degree swivel chair and chairs that run away with legs!
   */
  public buildAllianceChairsRunawayStage(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: RahulComedyEventDirector
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'rahul_alliance_chairs_runaway';
    stage.position.set(x, y, z);

    const base = new THREE.Mesh(this.getBox(8.5, 0.8, 8.5), this.parliamentSandstoneMat);
    base.position.y = 0.4;
    stage.add(base);

    // Large Round Conference Table
    const table = new THREE.Mesh(this.getCylinder(2.6, 2.7, 0.9, 16), this.woodMat);
    table.position.y = 1.25;
    stage.add(table);

    // Nitish Chair in Center with 360° Swivel
    const nitishChairGroup = new THREE.Group();
    nitishChairGroup.position.set(0, 1.3, 0);

    const nSeat = new THREE.Mesh(this.getBox(0.9, 0.8, 0.9), this.parliamentGreenMat);
    nSeat.position.y = 0.4;
    nitishChairGroup.add(nSeat);

    // Nitish Caricature seated on chair
    this.buildNitishCaricature(nitishChairGroup, 0, 0.4, 0, director);
    stage.add(nitishChairGroup);

    // 4 Runaway Chairs with Mechanical Legs
    const runningChairs: { chair: THREE.Group; legL: THREE.Object3D; legR: THREE.Object3D; baseAngle: number }[] = [];
    for (let c = 0; c < 4; c++) {
      const cAng = (c / 4) * Math.PI * 2;
      const cGroup = new THREE.Group();
      cGroup.position.set(Math.cos(cAng) * 3.2, 0.8, Math.sin(cAng) * 3.2);

      const cSeat = new THREE.Mesh(this.getBox(0.7, 0.7, 0.7), this.neonMagentaMat);
      cSeat.position.y = 0.6;
      cGroup.add(cSeat);

      // Running Legs on chair
      const legL = new THREE.Mesh(this.getCylinder(0.06, 0.06, 0.7, 6), this.goldMetalMat);
      legL.position.set(-0.25, 0.35, 0);
      cGroup.add(legL);

      const legR = new THREE.Mesh(this.getCylinder(0.06, 0.06, 0.7, 6), this.goldMetalMat);
      legR.position.set(0.25, 0.35, 0);
      cGroup.add(legR);

      stage.add(cGroup);
      runningChairs.push({ chair: cGroup, legL, legR, baseAngle: cAng });
    }

    director.registerAllianceChairsRunaway(stage, nitishChairGroup, runningChairs);
    group.add(stage);
    return stage;
  }

  /**
   * CROSSOVER 1: The Hug Loop
   */
  public buildHugLoopStage(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: RahulComedyEventDirector
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'rahul_crossover_hug_loop';
    stage.position.set(x, y, z);

    const base = new THREE.Mesh(this.getBox(8.5, 0.8, 8.5), this.parliamentSandstoneMat);
    base.position.y = 0.4;
    stage.add(base);

    const turntable = new THREE.Group();
    turntable.position.set(0, 0.8, 0);

    const plat = new THREE.Mesh(this.getCylinder(3.4, 3.6, 0.25, 16), this.yatraOrangeMat);
    plat.position.y = 0.12;
    turntable.add(plat);

    const modiFig = this.buildModiCaricature(turntable, -1.2, 0.25, 0, 'DEBATE', director);
    const rahulFig = this.buildRahulCaricature(turntable, 1.2, 0.25, 0, 'DEBATE', director);

    const heartIcon = new THREE.Mesh(this.getSphere(0.4, 8), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.5 }));
    heartIcon.position.set(0, 2.8, 0);
    heartIcon.scale.set(0.01, 0.01, 0.01);
    turntable.add(heartIcon);

    stage.add(turntable);
    director.registerHugLoop(turntable, modiFig, rahulFig, heartIcon);

    group.add(stage);
    return stage;
  }

  /**
   * CROSSOVER 2: The Selfie Battle & Chai Vendor Twist
   */
  public buildSelfieBattleStage(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: RahulComedyEventDirector
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'rahul_crossover_selfie_battle';
    stage.position.set(x, y, z);

    const base = new THREE.Mesh(this.getBox(8.5, 0.8, 8.5), this.parliamentSandstoneMat);
    base.position.y = 0.4;
    stage.add(base);

    const modi = this.buildModiCaricature(stage, -2.2, 0.8, 0, 'VICTORY', director);
    const rahul = this.buildRahulCaricature(stage, 2.2, 0.8, 0, 'VICTORY', director);

    const vendor = new THREE.Group();
    vendor.name = 'chai_vendor_hero';
    vendor.position.set(0, 0.8, 0);

    const vTorso = new THREE.Mesh(this.getBox(0.42, 0.65, 0.28), this.woodMat);
    vTorso.position.y = 0.75;
    vendor.add(vTorso);

    const vHead = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.32, 8), this.cartoonSkinMat);
    vHead.position.y = 1.25;
    vendor.add(vHead);

    const vKettle = new THREE.Mesh(this.getCylinder(0.18, 0.22, 0.35, 8), this.goldMetalMat);
    vKettle.position.set(0.35, 0.8, 0.25);
    vendor.add(vKettle);
    stage.add(vendor);

    const drone = new THREE.Group();
    drone.position.set(0, 3.5, 1.5);

    const dBody = new THREE.Mesh(this.getBox(0.65, 0.15, 0.65), this.goldMetalMat);
    drone.add(dBody);

    const lens = new THREE.Mesh(this.getCylinder(0.12, 0.14, 0.25, 8), this.neonCyanMat);
    lens.position.set(0, -0.15, 0.2);
    lens.rotation.x = Math.PI / 2;
    drone.add(lens);

    const flash = new THREE.Mesh(this.getSphere(0.8, 8), this.neonCyanMat);
    flash.position.set(0, -0.2, 0.4);
    flash.scale.set(0.01, 0.01, 0.01);
    drone.add(flash);
    stage.add(drone);

    director.registerSelfieBattle(modi, rahul, drone, vendor, flash);

    group.add(stage);
    return stage;
  }

  /**
   * CROSSOVER 3: The Runaway Microphone Chase
   */
  public buildMicrophoneChaseStage(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: RahulComedyEventDirector
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'rahul_crossover_mic_chase';
    stage.position.set(x, y, z);

    const base = new THREE.Mesh(this.getBox(7.5, 0.8, 12.0), this.parliamentSandstoneMat);
    base.position.y = 0.4;
    stage.add(base);

    const runway = new THREE.Mesh(this.getBox(3.0, 0.06, 11.0), this.yatraOrangeMat);
    runway.position.set(0, 0.83, 0);
    stage.add(runway);

    const cart = new THREE.Group();
    cart.name = 'rolling_microphone';
    cart.position.set(0, 0.9, -3.5);

    const cBody = new THREE.Mesh(this.getBox(0.6, 0.2, 0.8), this.woodMat);
    cBody.position.y = 0.15;
    cart.add(cBody);

    [-0.3, 0.3].forEach(wx => {
      [-0.25, 0.25].forEach(wz => {
        const wheel = new THREE.Mesh(this.getCylinder(0.12, 0.12, 0.08, 8), this.silverMat);
        wheel.position.set(wx, 0.12, wz);
        wheel.rotation.z = Math.PI / 2;
        cart.add(wheel);
      });
    });

    const micStem = new THREE.Mesh(this.getCylinder(0.06, 0.08, 1.2, 8), this.goldMetalMat);
    micStem.position.set(0, 0.8, 0);
    cart.add(micStem);

    const micBall = new THREE.Mesh(this.getSphere(0.18, 8), this.silverMat);
    micBall.position.set(0, 1.45, 0);
    cart.add(micBall);
    stage.add(cart);

    const modi = this.buildModiCaricature(stage, -0.8, 0.8, -5.0, 'CHASE', director);
    const rahul = this.buildRahulCaricature(stage, 0.8, 0.8, -6.0, 'CHASE', director);

    director.registerMicrophoneChase(cart, modi, rahul);

    group.add(stage);
    return stage;
  }

  /**
   * CROSSOVER 4: The Party Office Mix-Up
   */
  public buildPartyOfficeMixupStage(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: RahulComedyEventDirector
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'rahul_crossover_office_mixup';
    stage.position.set(x, y, z);

    const base = new THREE.Mesh(this.getBox(8.5, 0.8, 8.5), this.parliamentSandstoneMat);
    base.position.y = 0.4;
    stage.add(base);

    const portal = new THREE.Group();
    portal.position.set(0, 0.8, 0);

    // Brass Top Canopy and Floor Plinth Rings
    const canopy = new THREE.Mesh(this.getCylinder(1.9, 1.9, 0.25, 16), this.goldMetalMat);
    canopy.position.y = 3.2;
    portal.add(canopy);
    const bottomRing = new THREE.Mesh(this.getCylinder(1.9, 1.9, 0.15, 16), this.silverMat);
    bottomRing.position.y = 0.08;
    portal.add(bottomRing);

    // 4 Brass Corner Posts
    for (let p = 0; p < 4; p++) {
      const pAngle = (p * Math.PI) / 2 + Math.PI / 4;
      const post = new THREE.Mesh(this.getCylinder(0.06, 0.06, 3.2, 6), this.goldMetalMat);
      post.position.set(Math.cos(pAngle) * 1.85, 1.6, Math.sin(pAngle) * 1.85);
      portal.add(post);
    }

    const wing1 = new THREE.Mesh(this.getBox(3.4, 3.0, 0.08), this.mediaStudioGlassMat);
    wing1.position.y = 1.6;
    portal.add(wing1);

    const wing2 = new THREE.Mesh(this.getBox(0.08, 3.0, 3.4), this.mediaStudioGlassMat);
    wing2.position.y = 1.6;
    portal.add(wing2);
    stage.add(portal);

    const signA = new THREE.Mesh(this.getBox(2.2, 0.6, 0.08), this.saffronWaistcoatMat);
    signA.position.set(-2.0, 3.2, 1.8);
    stage.add(signA);

    const signB = new THREE.Mesh(this.getBox(2.2, 0.6, 0.08), this.yatraBannerGreenMat);
    signB.position.set(2.0, 3.2, 1.8);
    stage.add(signB);

    const pol = this.buildKejriwalCaricature(stage, 0, 0.8, 2.2, director);

    director.registerPartyOfficeMixup(portal, pol, signA, signB);

    group.add(stage);
    return stage;
  }

  /**
   * Builds Cheerful Cartoon Cheering Crowd Member waving tricolor flag
   */
  private buildCheeringCrowdMember(group: THREE.Group, x: number, y: number, z: number, isRight: boolean): void {
    const crowdGroup = new THREE.Group();
    crowdGroup.position.set(x, y, z);

    // White kurta body
    const body = new THREE.Mesh(this.getBox(0.45, 0.75, 0.3), this.yatraWhiteMat);
    body.position.y = 0.55;
    crowdGroup.add(body);

    // Head with colorful turban
    const head = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.35, 8), this.cartoonSkinMat);
    head.position.y = 1.15;
    crowdGroup.add(head);

    const turban = new THREE.Mesh(this.getCylinder(0.24, 0.22, 0.22, 8), isRight ? this.yatraOrangeMat : this.yatraGreenMat);
    turban.position.y = 1.35;
    crowdGroup.add(turban);

    // Small waving tricolor flag
    const pole = new THREE.Mesh(this.getCylinder(0.02, 0.02, 1.2, 4), this.goldMetalMat);
    pole.position.set(0.25, 1.1, -0.15);
    pole.rotation.x = -0.2;
    crowdGroup.add(pole);

    const flag = new THREE.Mesh(this.getPlane(0.35, 0.22), isRight ? this.yatraOrangeMat : this.yatraGreenMat);
    flag.position.set(0.42, 1.5, -0.15);
    crowdGroup.add(flag);

    group.add(crowdGroup);
  }
}
