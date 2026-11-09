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

  public static getYatraProcessionBannerTexture(): THREE.Texture {
    return this.getOrCreate('rv_yatra_procession_banner', () => {
      const w = 512;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Saffron to Green gradient with white band
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#ea580c');
      grad.addColorStop(0.35, '#f97316');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(0.65, '#16a34a');
      grad.addColorStop(1, '#15803d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, w - 8, h - 8);

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 26px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚩 THE NEVER-ENDING YATRA 🚩', w * 0.5, 48);

      ctx.fillStyle = '#1e3a8a';
      ctx.font = '900 18px monospace';
      ctx.fillText('3,570 KM DONE • 3,000 KM TO GO!', w * 0.5, 82);

      ctx.fillStyle = '#7c2d12';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('EVERYONE KEEP WALKING • NO SHORTCUTS ALLOWED', w * 0.5, 110);

      return canvas;
    });
  }

  public static getHugAndWinkMarqueeTexture(): THREE.Texture {
    return this.getOrCreate('rv_hug_and_wink_marquee', () => {
      const w = 512;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#064e3b'; // Parliamentary Green
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#f59e0b'; // Gold border
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, w - 8, h - 8);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 24px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏛️ PARLIAMENT THEATRE: THE EMBRACE & WINK 😉', w * 0.5, 48);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('★ UNEXPECTED DIPLOMATIC ACCORD ★', w * 0.5, 82);

      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('LIVE COVERAGE • PRESS GALLERY IN SHOCK', w * 0.5, 110);

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
  private yatraSandstonePlasterMat: THREE.MeshStandardMaterial;
  private yatraTerracottaMat: THREE.MeshStandardMaterial;
  private yatraIvoryMat: THREE.MeshStandardMaterial;
  private yatraTealMat: THREE.MeshStandardMaterial;
  private yatraIndigoMat: THREE.MeshStandardMaterial;
  private yatraMarigoldMat: THREE.MeshStandardMaterial;
  private yatraFoliageGreenMat: THREE.MeshStandardMaterial;
  private yatraBarkBrownMat: THREE.MeshStandardMaterial;
  private parliamentMarbleMat: THREE.MeshStandardMaterial;
  private shadowMat: THREE.MeshBasicMaterial;

  private constructor() {
    this.roadbedWallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    this.yatraWhiteMat = new THREE.MeshStandardMaterial({ color: 0xfdfbf7, roughness: 0.5 });
    // Rich Indian peacock teal instead of flat electric blue
    this.yatraBlueMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.45, metalness: 0.2 });
    this.yatraOrangeMat = new THREE.MeshStandardMaterial({ color: 0xe05615, roughness: 0.55 });
    this.yatraGreenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55 });
    this.goldMetalMat = new THREE.MeshStandardMaterial({ color: 0xd99b26, roughness: 0.25, metalness: 0.85 });
    this.parliamentSandstoneMat = new THREE.MeshStandardMaterial({ color: 0xcfa774, roughness: 0.75 });
    this.parliamentGreenMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.6 });
    this.woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2810, roughness: 0.75 });
    // Architectural deep slate navy
    this.mediaBlueMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.25 });
    this.neonMagentaMat = new THREE.MeshStandardMaterial({ color: 0xa21caf, roughness: 0.35, metalness: 0.3 });
    this.neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.neonPinkMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    this.cartoonSkinMat = new THREE.MeshStandardMaterial({ color: 0xd9a27c, roughness: 0.7 });
    this.cartoonHairDarkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    this.cartoonHairSilverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
    this.paperWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    this.redVelvetMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.85 });
    this.silverMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.7 });
    this.darkSuitMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.7 });
    this.saffronWaistcoatMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.6 });
    this.royalBlueMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 });

    // Initializing Surreal Yatra Architecture Materials
    this.yatraYellowMat = new THREE.MeshStandardMaterial({ color: 0xdfb76c, roughness: 0.75 });
    this.yatraLitWindowMat = new THREE.MeshStandardMaterial({ color: 0xffe4a0, emissive: 0xf59e0b, emissiveIntensity: 0.65, roughness: 0.2 });
    this.mediaStudioGlassMat = new THREE.MeshStandardMaterial({ color: 0x162a3f, roughness: 0.2, metalness: 0.6, emissive: 0x0f172a, emissiveIntensity: 0.25 });
    this.yatraAwningMat = new THREE.MeshStandardMaterial({ color: 0xe05615, roughness: 0.75 });
    this.yatraBannerGreenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 });
    this.yatraSandstonePlasterMat = new THREE.MeshStandardMaterial({ color: 0xdfb76c, roughness: 0.8 });
    this.yatraTerracottaMat = new THREE.MeshStandardMaterial({ color: 0x943d2c, roughness: 0.85 });
    this.yatraIvoryMat = new THREE.MeshStandardMaterial({ color: 0xfdfbf7, roughness: 0.65 });
    this.yatraTealMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.5, metalness: 0.15 });
    this.yatraIndigoMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 });
    this.yatraMarigoldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 });
    this.yatraFoliageGreenMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.85 });
    this.yatraBarkBrownMat = new THREE.MeshStandardMaterial({ color: 0x3e2312, roughness: 0.9 });
    this.parliamentMarbleMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35 });
    this.shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });

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
      this.yatraAwningMat, this.yatraBannerGreenMat, this.yatraSandstonePlasterMat,
      this.yatraTerracottaMat, this.yatraIvoryMat, this.yatraTealMat, this.yatraIndigoMat,
      this.yatraMarigoldMat, this.yatraFoliageGreenMat, this.yatraBarkBrownMat,
      this.parliamentMarbleMat
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
   * Deterministically rotates through the 6 distinct Indian political comedy environments!
   * Alternates scenic travel with theatrical public-event set pieces.
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

    const effectiveZ = (typeof worldZIn === 'number' && !isNaN(worldZIn))
      ? worldZIn
      : (group.parent && typeof group.parent.position?.z === 'number' ? group.parent.position.z : 0);

    let districtIndex: number;
    if (seed >= 0 && seed < 6) {
      districtIndex = seed;
    } else {
      // Canonical 6-environment progression:
      // 0: Never-Ending Yatra
      // 1: Parliament Pandemonium
      // 2: Press Conference Panic
      // 3: Alliance Circus & Musical Chairs
      // 4: Political Glitch Multiverse
      // 5: Regional Town & Roadshow
      const canonicalOrder = [0, 1, 2, 3, 4, 5];
      districtIndex = canonicalOrder[Math.floor(Math.abs(effectiveZ) / 400) % 6];
    }

    switch (districtIndex) {
      case 0:
        this.buildYatraNeverEndsDistrict(group, roadbedWidth, chunkLength, rng, detail, director, effectiveZ);
        break;
      case 1:
        this.buildParliamentPandemoniumDistrict(group, roadbedWidth, chunkLength, rng, detail, director, effectiveZ);
        break;
      case 2:
        this.buildPressConferencePanicDistrict(group, roadbedWidth, chunkLength, rng, detail, director, effectiveZ);
        break;
      case 3:
        this.buildAllianceRollercoasterDistrict(group, roadbedWidth, chunkLength, rng, detail, director, effectiveZ);
        break;
      case 4:
        this.buildPoliticalMultiverseDistrict(group, roadbedWidth, chunkLength, rng, detail, director, effectiveZ);
        break;
      case 5:
      default:
        this.buildRegionalRoadshowDistrict(group, roadbedWidth, chunkLength, rng, detail, director, effectiveZ);
        break;
    }
  }

  // =========================================================================
  // SURREAL YATRA ARCHITECTURE BUILDER
  // =========================================================================

  /**
   * Roadside lush green Neem/Peepal tree with circular stone sitting platform (chabutra)
   */
  public buildRoadsideTree(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    scale: number = 1.0
  ): THREE.Group {
    const tree = new THREE.Group();
    tree.position.set(x, y, z);
    tree.scale.setScalar(scale);

    // Deep Subterranean Foundation Plinth down to Y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(3.4, 5.5, 3.4), this.parliamentSandstoneMat);
    plinth.position.y = -2.45;
    tree.add(plinth);

    // Circular stone sitting bench / chabutra
    const chabutra = new THREE.Mesh(this.getCylinder(2.2, 2.4, 0.65, 10), this.parliamentSandstoneMat);
    chabutra.position.y = 0.325;
    tree.add(chabutra);

    // Weathered timber trunk
    const trunk = new THREE.Mesh(this.getCylinder(0.35, 0.52, 4.2, 8), this.yatraBarkBrownMat);
    trunk.position.y = 2.4;
    tree.add(trunk);

    // Multi-tiered leafy green canopy with organic organic silhouette
    const canopy1 = new THREE.Mesh(this.getCylinder(0.8, 2.6, 2.0, 8), this.yatraFoliageGreenMat);
    canopy1.position.y = 4.6;
    tree.add(canopy1);

    const canopy2 = new THREE.Mesh(this.getCylinder(0.5, 2.0, 1.8, 8), this.yatraFoliageGreenMat);
    canopy2.position.y = 6.0;
    tree.add(canopy2);

    const canopyTop = new THREE.Mesh(this.getSphere(1.2, 8), this.yatraFoliageGreenMat);
    canopyTop.position.y = 7.1;
    tree.add(canopyTop);

    group.add(tree);
    return tree;
  }

  /**
   * Roadside Yatra rest area canopy (Shamiana) with striped fabric & earthen water pots
   */
  public buildRoadsideCanopy(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    width: number,
    depth: number,
    fabricColorMat: THREE.Material
  ): THREE.Group {
    const canopy = new THREE.Group();
    canopy.position.set(x, y, z);

    // Foundation plinth
    const plinth = new THREE.Mesh(this.getBox(width + 0.6, 5.5, depth + 0.6), this.parliamentSandstoneMat);
    plinth.position.y = -2.45;
    canopy.add(plinth);

    // Platform
    const floor = new THREE.Mesh(this.getBox(width, 0.3, depth), this.parliamentSandstoneMat);
    floor.position.y = 0.15;
    canopy.add(floor);

    // 4 Corner Timber Poles
    const hwx = (width * 0.5) - 0.25;
    const hwz = (depth * 0.5) - 0.25;
    [[-hwx, -hwz], [-hwx, hwz], [hwx, -hwz], [hwx, hwz]].forEach(([px, pz]) => {
      const pole = new THREE.Mesh(this.getCylinder(0.08, 0.08, 3.8, 6), this.woodMat);
      pole.position.set(px, 1.9, pz);
      canopy.add(pole);
    });

    // Sloped Fabric Canopy Top
    const roof = new THREE.Mesh(this.getBox(width + 0.4, 0.1, depth + 0.4), fabricColorMat);
    roof.position.y = 3.8;
    canopy.add(roof);

    // Clay water pot (Matka) for water distribution
    const matka = new THREE.Mesh(this.getSphere(0.38, 8), this.yatraTerracottaMat);
    matka.position.set(0, 0.65, 0);
    canopy.add(matka);

    group.add(canopy);
    return canopy;
  }

  /**
   * Builds rich, modular, articulated surreal political architecture with setbacks,
   * haveli verandas, carved sandstone pillars, cantilevered balconies, jali screens,
   * warm lit windows, rooftop chhatris, and open courtyards with lush neem trees.
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
    // Setback building facade line: X = 20.1m, front face at X = 16.6m (well outside running envelope |X| <= 4.2m)
    const facadeX = side * (wallX + 10.5);
    const facingAngle = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;

    // Three articulated modules per side with varied story heights and open courtyards
    const buildingDefs = [
      {
        z: -14,
        length: 16,
        stories: 3,
        roofType: districtIndex === 1 ? 'KANGURA' : (districtIndex === 2 ? 'STUDIO_DISH' : (districtIndex === 4 ? 'GLITCH_OBELISK' : 'TERRACOTTA_TILES'))
      },
      {
        z: -40,
        length: 18,
        stories: (detail !== 'MINIMAL' && (districtIndex === 1 || districtIndex === 2 || districtIndex === 4)) ? 4 : 3,
        roofType: districtIndex === 0 ? 'CHHATRI' :
                  districtIndex === 1 ? 'ROTUNDA_DOME' :
                  districtIndex === 2 ? 'BROADCAST_TOWER' :
                  districtIndex === 3 ? 'CARNIVAL_CROWN' :
                  districtIndex === 4 ? 'QUANTUM_SPIRE' :
                  'CHHATRI'
      },
      {
        z: -66,
        length: 16,
        stories: 3,
        roofType: districtIndex === 1 ? 'KANGURA' : (districtIndex === 2 ? 'STUDIO_DISH' : (districtIndex === 4 ? 'GLITCH_OBELISK' : 'TERRACOTTA_TILES'))
      }
    ];

    buildingDefs.forEach((bDef, bIdx) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(facadeX, 0, bDef.z);
      bGroup.rotation.y = facingAngle;

      const bWidth = bDef.length;
      const bDepth = 7.0;
      const storyH = 4.8;
      const totalH = bDef.stories * storyH;

      // Select district authentic regional Indian palette
      let wallMat: THREE.MeshStandardMaterial;
      let trimMat: THREE.MeshStandardMaterial = this.parliamentSandstoneMat;
      let accentMat: THREE.MeshStandardMaterial = this.yatraTealMat;

      if (districtIndex === 0) {
        // Yatra Never Ends: Jaisalmer Sandstone Plaster, Warm Terracotta & Ivory
        wallMat = bIdx % 2 === 0 ? this.yatraSandstonePlasterMat : this.yatraTerracottaMat;
        trimMat = this.parliamentSandstoneMat;
        accentMat = this.yatraOrangeMat;
      } else if (districtIndex === 1) {
        // Parliament Pandemonium: Classical Makrana Marble & Buff Sandstone
        wallMat = bIdx % 2 === 0 ? this.parliamentMarbleMat : this.parliamentSandstoneMat;
        trimMat = this.parliamentSandstoneMat;
        accentMat = this.parliamentGreenMat;
      } else if (districtIndex === 2) {
        // Press Conference Panic: High-Tech Studio Navy & Glass
        wallMat = bIdx === 1 ? this.mediaStudioGlassMat : this.mediaBlueMat;
        trimMat = this.parliamentSandstoneMat;
        accentMat = this.yatraIvoryMat;
      } else if (districtIndex === 3) {
        // Alliance Circus: Festive Marigold & Sandstone Meeting Pavilions
        wallMat = bIdx % 2 === 0 ? this.yatraSandstonePlasterMat : this.yatraMarigoldMat;
        trimMat = this.parliamentSandstoneMat;
        accentMat = this.yatraIndigoMat;
      } else if (districtIndex === 4) {
        // Political Multiverse: Deep Indigo & Sandstone Obelisks
        wallMat = bIdx % 2 === 0 ? this.yatraIndigoMat : this.yatraSandstonePlasterMat;
        trimMat = this.mediaBlueMat;
        accentMat = this.yatraTealMat;
      } else {
        // Regional Roadshow: Regional Brick Township, Warm Terracotta & Ivory Plaster
        wallMat = bIdx % 2 === 0 ? this.yatraTerracottaMat : this.yatraIvoryMat;
        trimMat = this.parliamentSandstoneMat;
        accentMat = this.yatraTealMat;
      }

      // 0. Subterranean Foundation Plinth down to Y = -5.2m (prevents floating scenery)
      const plinth = new THREE.Mesh(this.getBox(bWidth + 0.8, 5.5, bDepth + 0.8), trimMat);
      plinth.position.y = -2.45;
      bGroup.add(plinth);

      // 1. Ground Floor Plinth & Main Mass
      const mainBuilding = new THREE.Mesh(this.getBox(bWidth, totalH, bDepth), wallMat);
      mainBuilding.position.y = totalH * 0.5;
      bGroup.add(mainBuilding);

      // Carved Stringcourse Ledges between floors
      for (let s = 1; s <= bDef.stories; s++) {
        const cornice = new THREE.Mesh(this.getBox(bWidth + 0.6, 0.45, bDepth + 0.6), trimMat);
        cornice.position.y = s * storyH;
        bGroup.add(cornice);
      }

      // In MINIMAL tier, retain massing and cornice ledges for visual silhouette while maintaining lightweight budget
      if (detail === 'MINIMAL') {
        group.add(bGroup);
        return;
      }

      // 2. Ground-Floor Colonnaded Verandas with Wooden Shuttered Shopfronts
      const stallCount = Math.floor(bWidth / 5.2);
      const stallSpacing = bWidth / (stallCount + 1);
      const awningMats = [this.yatraOrangeMat, this.yatraIvoryMat, this.yatraGreenMat, this.yatraTealMat];

      for (let sh = 0; sh < stallCount; sh++) {
        const stallX = -bWidth * 0.5 + (sh + 1) * stallSpacing;

        // Sandstone Colonnade Pillars
        const pillarL = new THREE.Mesh(this.getBox(0.35, 3.4, 0.35), trimMat);
        pillarL.position.set(stallX - 1.4, 1.7, bDepth * 0.5 + 0.9);
        bGroup.add(pillarL);

        const pillarR = new THREE.Mesh(this.getBox(0.35, 3.4, 0.35), trimMat);
        pillarR.position.set(stallX + 1.4, 1.7, bDepth * 0.5 + 0.9);
        bGroup.add(pillarR);

        // Recessed wooden shopfront door
        const door = new THREE.Mesh(this.getBox(2.4, 3.0, 0.3), this.woodMat);
        door.position.set(stallX, 1.5, bDepth * 0.5 + 0.1);
        bGroup.add(door);

        // Warm lit interior window
        const glow = new THREE.Mesh(this.getBox(1.6, 2.2, 0.05), this.yatraLitWindowMat);
        glow.position.set(stallX, 1.4, bDepth * 0.5 + 0.26);
        bGroup.add(glow);

        // Sloped stone or fabric chhajja / awning
        const awningMat = awningMats[(sh + bIdx) % awningMats.length];
        const awning = new THREE.Mesh(this.getBox(3.0, 0.12, 1.6), awningMat);
        awning.position.set(stallX, 3.4, bDepth * 0.5 + 0.75);
        awning.rotation.x = 0.28;
        bGroup.add(awning);

        // Hanging brass lantern
        const lantern = new THREE.Mesh(this.getSphere(0.2, 6), this.yatraLitWindowMat);
        lantern.position.set(stallX, 3.1, bDepth * 0.5 + 0.9);
        bGroup.add(lantern);
      }

      // 3. Cantilevered Jharokha Balconies on Upper Floors
      for (let s = 1; s < bDef.stories; s++) {
        const floorY = s * storyH;
        const galleryCount = Math.floor(bWidth / 5.5);
        const gSpacing = bWidth / (galleryCount + 1);

        for (let g = 0; g < galleryCount; g++) {
          const gX = -bWidth * 0.5 + (g + 1) * gSpacing;

          // Carved stone corbel supports
          const corbel = new THREE.Mesh(this.getBox(0.4, 0.8, 1.0), trimMat);
          corbel.position.set(gX, floorY + 0.2, bDepth * 0.5 + 0.4);
          bGroup.add(corbel);

          // Cantilevered balcony base
          const gBase = new THREE.Mesh(this.getBox(2.2, 0.35, 1.4), trimMat);
          gBase.position.set(gX, floorY + 0.6, bDepth * 0.5 + 0.7);
          bGroup.add(gBase);

          // Pierced jali lattice balustrade
          const railing = new THREE.Mesh(this.getBox(2.2, 0.85, 0.12), trimMat);
          railing.position.set(gX, floorY + 1.15, bDepth * 0.5 + 1.35);
          bGroup.add(railing);

          // Warm arched window
          const win = new THREE.Mesh(this.getBox(1.5, 2.0, 0.05), this.yatraLitWindowMat);
          win.position.set(gX, floorY + 1.8, bDepth * 0.5 + 0.05);
          bGroup.add(win);
        }
      }

      // 4. Rooftops: Rajasthani Chhatris, Terracotta Tiles or Broadcast Towers
      // 4. Rooftops: Rajasthani Chhatris, Terracotta Tiles, Parliament Domes, Carnival Crowns, Quantum Spires
      if (bDef.roofType === 'BROADCAST_TOWER') {
        const towerGroup = new THREE.Group();
        towerGroup.position.set(0, totalH, 0);

        const mast = new THREE.Mesh(this.getCylinder(0.18, 0.5, 8.0, 6), this.silverMat);
        mast.position.y = 4.0;
        towerGroup.add(mast);

        const beacon = new THREE.Mesh(this.getSphere(0.3, 6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        beacon.position.y = 8.2;
        towerGroup.add(beacon);

        const dish = new THREE.Mesh(this.getCylinder(1.2, 0.15, 0.35, 8), this.yatraIvoryMat);
        dish.position.set(2.0, 1.8, 0);
        dish.rotation.z = 0.55;
        towerGroup.add(dish);

        bGroup.add(towerGroup);
      } else if (bDef.roofType === 'STUDIO_DISH') {
        // Parapet with twin studio satellite dishes
        const dishL = new THREE.Mesh(this.getCylinder(0.8, 0.1, 0.25, 8), this.yatraIvoryMat);
        dishL.position.set(-bWidth * 0.25, totalH + 1.0, 0);
        dishL.rotation.x = -0.5;
        bGroup.add(dishL);

        const dishR = new THREE.Mesh(this.getCylinder(0.8, 0.1, 0.25, 8), this.yatraIvoryMat);
        dishR.position.set(bWidth * 0.25, totalH + 1.0, 0);
        dishR.rotation.x = -0.5;
        bGroup.add(dishR);
      } else if (bDef.roofType === 'CHHATRI') {
        // Traditional Rajasthani domed Chhatri pavilion with golden kalash
        const chhatri = new THREE.Group();
        chhatri.position.set(0, totalH, bDepth * 0.5 - 1.2);

        // 4 Sandstone pillars
        [[-1.2, -1.2], [-1.2, 1.2], [1.2, -1.2], [1.2, 1.2]].forEach(([px, pz]) => {
          const col = new THREE.Mesh(this.getCylinder(0.12, 0.14, 2.4, 6), trimMat);
          col.position.set(px, 1.2, pz);
          chhatri.add(col);
        });

        // Dome roof
        const dome = new THREE.Mesh(this.getSphere(1.8, 8), this.yatraTerracottaMat);
        dome.position.y = 2.8;
        chhatri.add(dome);

        // Golden kalash finial
        const finial = new THREE.Mesh(this.getCylinder(0.08, 0.22, 0.8, 6), this.goldMetalMat);
        finial.position.y = 4.4;
        chhatri.add(finial);

        bGroup.add(chhatri);
      } else if (bDef.roofType === 'ROTUNDA_DOME') {
        // Classical Parliament Dome with Drum
        const rotunda = new THREE.Group();
        rotunda.position.set(0, totalH, bDepth * 0.5 - 1.5);

        const drum = new THREE.Mesh(this.getCylinder(2.4, 2.6, 1.2, 12), trimMat);
        drum.position.y = 0.6;
        rotunda.add(drum);

        const dome = new THREE.Mesh(this.getSphere(2.2, 10), this.parliamentMarbleMat);
        dome.position.y = 1.6;
        rotunda.add(dome);

        const finial = new THREE.Mesh(this.getCylinder(0.06, 0.2, 1.2, 6), this.goldMetalMat);
        finial.position.y = 3.8;
        rotunda.add(finial);

        bGroup.add(rotunda);
      } else if (bDef.roofType === 'CARNIVAL_CROWN') {
        // Festive Tiered Marquee Roof
        const canopy = new THREE.Mesh(this.getCylinder(0.3, 3.2, 1.4, 8), this.yatraMarigoldMat);
        canopy.position.set(0, totalH + 0.7, 0);
        bGroup.add(canopy);

        const finial = new THREE.Mesh(this.getCylinder(0.04, 0.1, 1.2, 6), this.goldMetalMat);
        finial.position.y = totalH + 1.8;
        bGroup.add(finial);
      } else if (bDef.roofType === 'QUANTUM_SPIRE' || bDef.roofType === 'GLITCH_OBELISK') {
        // Surreal Geometric Obelisk with Neon Accents
        const obelisk = new THREE.Group();
        obelisk.position.set(0, totalH, 0);

        const obBody = new THREE.Mesh(this.getCylinder(0.15, 0.55, 4.5, 4), this.mediaBlueMat);
        obBody.position.y = 2.25;
        obelisk.add(obBody);

        const neonRing = new THREE.Mesh(this.getTorus(0.7, 0.08, 6), this.neonCyanMat);
        neonRing.position.y = 2.5;
        obelisk.add(neonRing);

        bGroup.add(obelisk);
      } else if (bDef.roofType === 'KANGURA') {
        // Stepped Battlements along Roof Edge
        for (let k = -bWidth * 0.44; k <= bWidth * 0.44; k += 1.6) {
          const battlement = new THREE.Mesh(this.getBox(0.8, 0.7, 0.25), trimMat);
          battlement.position.set(k, totalH + 0.35, bDepth * 0.5);
          bGroup.add(battlement);
        }
      } else {
        // Terracotta tile sloped roof eaves and parapet
        const roofShed = new THREE.Mesh(this.getBox(bWidth + 0.6, 0.8, bDepth + 0.6), this.yatraTerracottaMat);
        roofShed.position.set(0, totalH + 0.4, 0);
        bGroup.add(roofShed);

        // Black Sintex rooftop water tank
        const tank = new THREE.Mesh(this.getCylinder(0.85, 0.85, 1.4, 10), this.mediaBlueMat);
        tank.position.set(-bWidth * 0.3, totalH + 1.5, 0);
        bGroup.add(tank);

        // TV dish antenna
        const dish = new THREE.Mesh(this.getCylinder(0.5, 0.08, 0.2, 8), this.silverMat);
        dish.position.set(bWidth * 0.3, totalH + 1.2, 0);
        dish.rotation.x = 0.5;
        bGroup.add(dish);
      }

      // Tricolor campaign pennant
      const pennantMast = new THREE.Mesh(this.getCylinder(0.04, 0.04, 2.5, 6), this.silverMat);
      pennantMast.position.set(bWidth * 0.45, totalH + 1.25, bDepth * 0.5);
      bGroup.add(pennantMast);

      const flag = new THREE.Mesh(this.getBox(0.02, 0.6, 1.2), this.yatraOrangeMat);
      flag.position.set(bWidth * 0.45, totalH + 2.0, bDepth * 0.5 + 0.6);
      bGroup.add(flag);

      group.add(bGroup);
    });

    if (detail === 'MINIMAL') return;

    // 5. Open Courtyard Setbacks: Lush Roadside Neem Trees with Chabutra & Canopies
    const courtyardZs = [-25.5, -53.5];
    courtyardZs.forEach((cyZ, cyIdx) => {
      const cyX = facadeX + (side > 0 ? -2.2 : 2.2);
      if (cyIdx % 2 === 0) {
        this.buildRoadsideTree(group, cyX, 0, cyZ, 1.0);
      } else {
        this.buildRoadsideCanopy(group, cyX, 0, cyZ, 4.2, 4.2, this.yatraMarigoldMat);
      }
    });
  }

  // =========================================================================
  // DISTRICT A — YATRA NEVER ENDS
  // =========================================================================

  /**
   * Animated Moving Yatra March Procession along the sidewalk promenade.
   * Features:
   * - Column of animated supporters in white kurtas, tricolor sashes, and sneakers
   * - High-knee marching strides, counter-cadence arm swings, swaying flags
   * - Supporter carrying giant golden megaphone with pulsing cyan sound waves
   * - Supporter carrying official "3,570 KM DONE • 3,000 KM TO GO!" tricolor banner
   * - Supporter jogging with water bottle and sweat towel
   * - Registered with RahulComedyEventDirector for continuous animated motion
   */
  public buildYatraMarchProcession(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: RahulComedyEventDirector,
    worldZ?: number
  ): THREE.Group {
    const procGroup = new THREE.Group();
    procGroup.name = 'rahul_yatra_march_procession';
    procGroup.position.set(x, y, z);

    // Deep Subterranean Foundation Plinth down to Y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(6.5, 5.5, 22.0), this.parliamentSandstoneMat);
    plinth.position.y = -2.45;
    procGroup.add(plinth);

    const marchers: {
      figure: THREE.Group;
      legL: THREE.Object3D;
      legR: THREE.Object3D;
      armL: THREE.Object3D;
      armR: THREE.Object3D;
      flag?: THREE.Object3D;
      banner?: THREE.Object3D;
      phaseOffset: number;
    }[] = [];

    const soundWaves: THREE.Mesh[] = [];

    const marcherDefs = [
      { z: 6.0, type: 'FLAG', phase: 0.0 },
      { z: 2.0, type: 'MEGAPHONE', phase: 1.2 },
      { z: -2.0, type: 'BANNER', phase: 2.4 },
      { z: -6.0, type: 'WATER', phase: 3.6 }
    ];

    marcherDefs.forEach((mDef) => {
      const mFig = new THREE.Group();
      mFig.position.set(0, 0.4, mDef.z);

      // Left Leg & Sneaker
      const legL = new THREE.Group();
      legL.position.set(-0.18, 0.75, 0);
      const legMeshL = new THREE.Mesh(this.getBox(0.18, 0.75, 0.22), this.yatraWhiteMat);
      legMeshL.position.y = -0.375;
      legL.add(legMeshL);
      const shoeL = new THREE.Mesh(this.getBox(0.20, 0.12, 0.32), this.goldMetalMat);
      shoeL.position.set(0, -0.75, 0.05);
      legL.add(shoeL);
      mFig.add(legL);

      // Right Leg & Sneaker
      const legR = new THREE.Group();
      legR.position.set(0.18, 0.75, 0);
      const legMeshR = new THREE.Mesh(this.getBox(0.18, 0.75, 0.22), this.yatraWhiteMat);
      legMeshR.position.y = -0.375;
      legR.add(legMeshR);
      const shoeR = new THREE.Mesh(this.getBox(0.20, 0.12, 0.32), this.goldMetalMat);
      shoeR.position.set(0, -0.75, 0.05);
      legR.add(shoeR);
      mFig.add(legR);

      // Torso with Tricolor Sash
      const torso = new THREE.Mesh(this.getBox(0.48, 0.7, 0.32), this.yatraWhiteMat);
      torso.position.y = 1.1;
      mFig.add(torso);

      const sash = new THREE.Mesh(this.getBox(0.50, 0.18, 0.34), this.yatraOrangeMat);
      sash.position.set(0, 1.1, 0);
      sash.rotation.z = 0.3;
      mFig.add(sash);

      // Head with Hair
      const head = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.32, 8), this.cartoonSkinMat);
      head.position.y = 1.62;
      mFig.add(head);

      const hair = new THREE.Mesh(this.getSphere(0.20, 8), this.cartoonHairDarkMat);
      hair.position.set(0, 1.76, -0.02);
      mFig.add(hair);

      // Arms
      const armL = new THREE.Group();
      armL.position.set(-0.32, 1.35, 0);
      const armMeshL = new THREE.Mesh(this.getBox(0.14, 0.55, 0.14), this.yatraWhiteMat);
      armMeshL.position.y = -0.275;
      armL.add(armMeshL);
      mFig.add(armL);

      const armR = new THREE.Group();
      armR.position.set(0.32, 1.35, 0);
      const armMeshR = new THREE.Mesh(this.getBox(0.14, 0.55, 0.14), this.yatraWhiteMat);
      armMeshR.position.y = -0.275;
      armR.add(armMeshR);
      mFig.add(armR);

      let flagObj: THREE.Object3D | undefined;
      let bannerObj: THREE.Object3D | undefined;

      if (mDef.type === 'FLAG') {
        const flagStaff = new THREE.Mesh(this.getCylinder(0.04, 0.04, 3.2, 6), this.woodMat);
        flagStaff.position.set(0.15, 0.8, 0.3);
        armR.add(flagStaff);

        const flagCloth = new THREE.Mesh(this.getBox(0.03, 0.9, 1.5), this.yatraOrangeMat);
        flagCloth.position.set(0.15, 2.0, 1.0);
        armR.add(flagCloth);
        flagObj = flagCloth;
      } else if (mDef.type === 'MEGAPHONE') {
        const megaphone = new THREE.Mesh(this.getCylinder(0.28, 0.08, 0.7, 8), this.goldMetalMat);
        megaphone.position.set(0.15, 0.1, 0.4);
        megaphone.rotation.x = Math.PI / 2;
        armR.add(megaphone);

        // Animated sound waves
        for (let s = 0; s < 2; s++) {
          const waveMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });
          const ring = new THREE.Mesh(this.getCylinder(0.35 + s * 0.2, 0.35 + s * 0.2, 0.04, 8), waveMat);
          ring.position.set(0.15, 0.1, 0.8 + s * 0.4);
          ring.rotation.x = Math.PI / 2;
          armR.add(ring);
          soundWaves.push(ring);
        }
      } else if (mDef.type === 'BANNER') {
        const bTex = RahulverseTextureCache.getYatraProcessionBannerTexture();
        const bMesh = new THREE.Mesh(this.getBox(3.4, 0.9, 0.06), new THREE.MeshBasicMaterial({ map: bTex }));
        bMesh.position.set(0, 1.6, 0.4);
        mFig.add(bMesh);
        bannerObj = bMesh;
      } else if (mDef.type === 'WATER') {
        const bottle = new THREE.Mesh(this.getCylinder(0.14, 0.14, 0.5, 8), this.mediaStudioGlassMat);
        bottle.position.set(0.15, 0, 0.25);
        armR.add(bottle);
      }

      procGroup.add(mFig);
      marchers.push({
        figure: mFig,
        legL,
        legR,
        armL,
        armR,
        flag: flagObj,
        banner: bannerObj,
        phaseOffset: mDef.phase
      });
    });

    director.registerYatraMarchProcession(procGroup, marchers, undefined, undefined, undefined, soundWaves, undefined, undefined, worldZ);
    group.add(procGroup);
    return procGroup;
  }

  public buildYatraNeverEndsDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: RahulComedyEventDirector,
    worldZ: number = 0
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
      const walk = new THREE.Mesh(this.getBox(walkW, 7.0, chunkLength), this.parliamentSandstoneMat);
      walk.position.set(wx, -3.2, -chunkLength * 0.5);
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

    // 1a. Roadside Chai & Snack Dhaba Kiosk at X = -11.5m
    const dhabaGroup = new THREE.Group();
    dhabaGroup.position.set(-11.5, 0.6, -chunkLength * 0.25);

    // Deep Subterranean Foundation Plinth
    const dhabaPlinth = new THREE.Mesh(this.getBox(7.0, 5.5, 5.0), this.parliamentSandstoneMat);
    dhabaPlinth.position.y = -2.45;
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

    // 1b. Moving Yatra March Procession with animated marchers & banners (East sidewalk)
    this.buildYatraMarchProcession(districtA, 11.2, 0.6, -chunkLength * 0.22, director, worldZ - chunkLength * 0.22);

    // 1c. 3D Open-Top Campaign Support Van with 4 Loudspeaker Horns & Supply Crates (East sidewalk)
    const vanGroup = new THREE.Group();
    vanGroup.name = 'rahul_campaign_van';
    vanGroup.position.set(11.5, 0.6, -chunkLength * 0.42);

    // Sunken Subterranean Van Foundation Plinth (bottom Y <= -5.2m, top beneath road pavement)
    const vanPlinth = new THREE.Mesh(this.getBox(7.0, 5.0, 4.6), this.parliamentSandstoneMat);
    vanPlinth.position.y = -2.8;
    vanGroup.add(vanPlinth);

    // Automotive Van Body (Cream & Saffron Indian commercial tempo)
    const vanBody = new THREE.Mesh(this.getBox(5.6, 2.0, 2.7), this.yatraIvoryMat);
    vanBody.position.y = 1.45;
    vanGroup.add(vanBody);

    const vanCab = new THREE.Mesh(this.getBox(2.2, 1.4, 2.5), this.yatraIvoryMat);
    vanCab.position.set(1.5, 2.8, 0);
    vanGroup.add(vanCab);

    // Chrome Horizontal Grille & Bumper
    const grille = new THREE.Mesh(this.getBox(0.1, 0.65, 2.1), this.silverMat);
    grille.position.set(2.62, 1.4, 0);
    vanGroup.add(grille);

    // Dual LED Headlights
    [-0.85, 0.85].forEach((hz) => {
      const lamp = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.1, 8), this.yatraLitWindowMat);
      lamp.position.set(2.64, 1.4, hz);
      lamp.rotation.z = Math.PI / 2;
      vanGroup.add(lamp);
    });

    // Front Black Bullbar
    const bullbar = new THREE.Mesh(this.getBox(0.2, 0.8, 2.4), this.darkSuitMat);
    bullbar.position.set(2.75, 1.2, 0);
    vanGroup.add(bullbar);

    // Raked Windshield
    const windshield = new THREE.Mesh(this.getBox(0.1, 1.1, 2.3), this.mediaStudioGlassMat);
    windshield.position.set(2.55, 2.8, 0);
    windshield.rotation.z = -0.15;
    vanGroup.add(windshield);

    // 4 Wheels touching pavement naturally
    const vanWheels: THREE.Mesh[] = [];
    [[-1.8, -1.3], [-1.8, 1.3], [1.6, -1.3], [1.6, 1.3]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(this.getCylinder(0.55, 0.55, 0.45, 12), this.darkSuitMat);
      wheel.position.set(wx, 0.55, wz);
      wheel.rotation.x = Math.PI / 2;
      vanGroup.add(wheel);
      vanWheels.push(wheel);

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

    // Campaign leader waving to supporters from rear bed of van
    const leaderFig = this.buildRahulCaricature(vanGroup, -1.0, 1.8, 0, 'VICTORY', director);
    leaderFig.name = 'yatra_van_leader_rahul';

    districtA.add(vanGroup);

    // 2. Animated Giant Golden Walking Shoe Monument on Motorized Treadmill
    const shoeGroup = new THREE.Group();
    shoeGroup.name = 'rahul_shoe_monument';
    shoeGroup.position.set(-11.8, 0.6, -chunkLength * 0.55);

    // Deep Subterranean Treadmill Foundation Plinth
    const shoePlinth = new THREE.Mesh(this.getBox(8.0, 5.5, 8.5), this.parliamentSandstoneMat);
    shoePlinth.position.y = -2.45;
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
    archGroup.position.set(0, 0, -chunkLength * 0.68);

    // High side pillars outside running envelope (|X| = 8.8m > 4.2m)
    const archH = 9.4;
    [-roadbedWidth * 0.5 - 2.8, roadbedWidth * 0.5 + 2.8].forEach((px) => {
      // Subterranean pedestal plinth down to Y = -5.2m
      const base = new THREE.Mesh(this.getBox(2.6, 5.5, 2.6), this.parliamentSandstoneMat);
      base.position.set(px, -2.45, 0);
      archGroup.add(base);

      // Fluted sandstone pillar
      const p = new THREE.Mesh(this.getCylinder(0.9, 1.0, archH, 8), this.parliamentSandstoneMat);
      p.position.set(px, archH * 0.5, 0);
      archGroup.add(p);

      // Carved column capital
      const cap = new THREE.Mesh(this.getBox(2.2, 0.6, 2.2), this.parliamentSandstoneMat);
      cap.position.set(px, archH + 0.3, 0);
      archGroup.add(cap);

      // Gold kalash finial on top of each pillar
      const finial = new THREE.Mesh(this.getSphere(0.9, 8), this.goldMetalMat);
      finial.position.set(px, archH + 1.2, 0);
      archGroup.add(finial);
    });

    // Overhead lintel beam (lowest point Y = 9.4m > 8.5m)
    const lintel = new THREE.Mesh(this.getBox(roadbedWidth + 7.5, 1.2, 2.0), this.yatraSandstonePlasterMat);
    lintel.position.set(0, archH + 0.6, 0);
    archGroup.add(lintel);

    // Decorative victory marigold garland
    const garland = new THREE.Mesh(this.getBox(roadbedWidth + 6.0, 0.25, 0.25), this.yatraMarigoldMat);
    garland.position.set(0, archH + 0.1, 1.05);
    archGroup.add(garland);

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

    // Celebrating Crowd of Volunteers & Supporters lining the sidewalks
    const crowdMembers: {
      group: THREE.Group;
      armL: THREE.Object3D;
      armR: THREE.Object3D;
      head: THREE.Object3D;
      baseY: number;
    }[] = [];

    const crowdPositions = [
      { x: -roadbedWidth * 0.5 - 3.8, z: -2.0 },
      { x: -roadbedWidth * 0.5 - 4.8, z: -5.0 },
      { x: -roadbedWidth * 0.5 - 3.5, z: -8.0 },
      { x: roadbedWidth * 0.5 + 5.5, z: -2.0 },
      { x: roadbedWidth * 0.5 + 6.2, z: -5.5 },
      { x: roadbedWidth * 0.5 + 5.0, z: -8.5 }
    ];

    crowdPositions.forEach((pos, cIdx) => {
      const cGroup = new THREE.Group();
      cGroup.position.set(pos.x, 0.6, pos.z);

      // Kurta & Trousers
      const cLegs = new THREE.Mesh(this.getBox(0.38, 0.7, 0.3), this.yatraWhiteMat);
      cLegs.position.y = 0.35;
      cGroup.add(cLegs);

      const cTorso = new THREE.Mesh(this.getBox(0.44, 0.65, 0.3), cIdx % 2 === 0 ? this.yatraWhiteMat : this.yatraSandstonePlasterMat);
      cTorso.position.y = 0.95;
      cGroup.add(cTorso);

      // Tricolor sash
      const sash = new THREE.Mesh(this.getBox(0.46, 0.16, 0.32), this.yatraOrangeMat);
      sash.position.set(0, 0.95, 0);
      sash.rotation.z = 0.3;
      cGroup.add(sash);

      // Head
      const cHead = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.32, 8), this.cartoonSkinMat);
      cHead.position.y = 1.45;
      cGroup.add(cHead);

      // Arms
      const armL = new THREE.Group();
      armL.position.set(-0.28, 1.25, 0);
      const armMeshL = new THREE.Mesh(this.getBox(0.1, 0.45, 0.1), this.yatraWhiteMat);
      armMeshL.position.y = 0.225;
      armL.add(armMeshL);
      cGroup.add(armL);

      const armR = new THREE.Group();
      armR.position.set(0.28, 1.25, 0);
      const armMeshR = new THREE.Mesh(this.getBox(0.1, 0.45, 0.1), this.yatraWhiteMat);
      armMeshR.position.y = 0.225;
      armR.add(armMeshR);
      cGroup.add(armR);

      // Flag held by right arm
      const flagPole = new THREE.Mesh(this.getCylinder(0.02, 0.02, 1.2, 4), this.woodMat);
      flagPole.position.set(0, 0.6, 0);
      armR.add(flagPole);
      const flagBanner = new THREE.Mesh(this.getBox(0.02, 0.35, 0.6), cIdx % 2 === 0 ? this.yatraOrangeMat : this.yatraGreenMat);
      flagBanner.position.set(0, 1.0, 0.3);
      armR.add(flagBanner);

      archGroup.add(cGroup);
      crowdMembers.push({
        group: cGroup,
        armL,
        armR,
        head: cHead,
        baseY: 0.6
      });
    });

    // GATE A: Animated Running Rahul Caricature sprinting toward finish line along sidewalk
    const runnerRahul = this.buildRahulCaricature(archGroup, roadbedWidth * 0.5 + 4.2, 0.6, -12.0, 'RUN', director);

    // White Sweat Towel
    const towel = new THREE.Mesh(this.getBox(0.25, 0.45, 0.08), this.yatraWhiteMat);
    towel.position.set(0, 1.2, 0.2);
    towel.visible = false;
    runnerRahul.add(towel);

    director.registerNeverEndingYatra(archGroup, flipPivot, ratchetGear, accordionMap, runnerRahul, towel, crowdMembers, worldZ - chunkLength * 0.55);

    archGroup.add(flipPivot);
    group.add(archGroup);

    // 5. Second Distant Finish Line Arch ("REVISED FINISH LINE: MAYBE")
    // Only placed on extended chunks so Chunk 0 has an unobstructed view of the flip arch
    if (chunkLength > 120) {
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
    }

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
    this.buildHugLoopStage(group, 16.5, 0.6, -chunkLength * 0.85, director, worldZ - chunkLength * 0.85);
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
    director: RahulComedyEventDirector,
    worldZ: number = 0
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
      const gallery = new THREE.Mesh(this.getBox(gallW, 7.0, chunkLength), this.parliamentSandstoneMat);
      gallery.position.set(gx, -3.2, -chunkLength * 0.5);
      districtB.add(gallery);

      // Grand Sandstone Columns
      for (let z = 6; z < chunkLength - 6; z += 12) {
        // Skip columns on the right side directly in front of the Parliament Hug & Wink stage
        // to guarantee an unobstructed, cinematic sightline from the oncoming railway tracks
        if (side > 0 && z >= 16 && z <= 56) continue;

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
        if (side > 0 && z >= 16 && z <= 56) continue;

        const bench = new THREE.Mesh(this.getBox(3.4, 0.9, 1.4), this.parliamentGreenMat);
        bench.position.set(side * (curbEdge + 5.2), 1.5, -z);
        districtB.add(bench);
      }
    });

    // 2. Animated Runaway Mechanical Microphone Gag & Point of Order Button
    const micStage = new THREE.Group();
    micStage.name = 'runaway_microphone_arm';
    micStage.position.set(-16.0, 0.6, -chunkLength * 0.65);

    // Deep Subterranean Foundation Plinth
    const micPlinth = new THREE.Mesh(this.getBox(6.5, 5.5, 6.0), this.parliamentSandstoneMat);
    micPlinth.position.y = -2.45;
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
    clockGroup.position.set(16.5, 0.6, -chunkLength * 0.7);

    // Deep Subterranean Clock Plinth
    const clockPlinth = new THREE.Mesh(this.getBox(6.0, 5.5, 6.0), this.parliamentSandstoneMat);
    clockPlinth.position.y = -2.45;
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

    // 3b. Strategy War-Room Pavilion with Giant Whiteboard Flowchart & Relaunch 5.0 Reset Button (West sidewalk)
    const warRoomGroup = new THREE.Group();
    warRoomGroup.name = 'rahul_strategy_war_room';
    warRoomGroup.position.set(-16.5, 0.6, -chunkLength * 0.35);

    // Deep Subterranean War-Room Plinth
    const warPlinth = new THREE.Mesh(this.getBox(8.0, 5.5, 8.0), this.parliamentSandstoneMat);
    warPlinth.position.y = -2.45;
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
    doorGroup.position.set(16.0, 0.6, -chunkLength * 0.15);
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

    // GATE A HERO GAG: THE PARLIAMENT HUG & WINK
    // Placed directly along the right sidewalk curb at X = +8.6m with an unobstructed sightline
    const hugStage = this.buildParliamentHugAndWinkStage(districtB, 8.6, 0.6, -chunkLength * 0.36, director, worldZ - chunkLength * 0.36);
    hugStage.scale.set(1.15, 1.15, 1.15);

    // GATE B HERO GAG: PARLIAMENTARY MICROPHONE CHAOS (West side at X = -16.5m, Z = -chunkLength * 0.85)
    this.buildMicrophoneChaosStage(districtB, -16.5, 0.6, -chunkLength * 0.85, director, worldZ - chunkLength * 0.85);

    // 5. OVERHEAD POINT-OF-ORDER WARNING GANTRY (Z = -36m, overhead truss at Y = 9.8m, clearance > 8.5m)
    if (detail !== 'MINIMAL') {
      const orderGantry = new THREE.Group();
      orderGantry.name = 'rv_parliament_order_gantry';
      orderGantry.position.set(0, 0, -36);

      [-8.8, 8.8].forEach((px) => {
        const plinth = new THREE.Mesh(this.getBox(1.6, 5.0, 1.6), this.parliamentSandstoneMat);
        plinth.position.set(px, -2.5, 0);
        orderGantry.add(plinth);

        const col = new THREE.Mesh(this.getCylinder(0.3, 0.38, 9.8, 8), this.parliamentSandstoneMat);
        col.position.set(px, 4.9, 0);
        orderGantry.add(col);
      });

      const beam = new THREE.Mesh(this.getBox(19.2, 0.8, 1.4), this.parliamentSandstoneMat);
      beam.position.set(0, 9.8, 0);
      orderGantry.add(beam);

      // Warning Signboard
      const sign = new THREE.Mesh(this.getBox(8.0, 0.6, 0.1), this.yatraOrangeMat);
      sign.position.set(0, 9.8, 0.75);
      orderGantry.add(sign);

      districtB.add(orderGantry);
    }
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
    director: RahulComedyEventDirector,
    worldZ: number = 0
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
      const walk = new THREE.Mesh(this.getBox(walkW, 7.0, chunkLength), this.parliamentSandstoneMat);
      walk.position.set(wx, -3.2, -chunkLength * 0.5);
      districtC.add(walk);
    });

    // 1b. 3D OB Broadcast Satellite Van (Replacing giant billboard walls with high-production 3D set piece)
    const vanGroup = new THREE.Group();
    vanGroup.name = 'rahul_broadcast_van';
    vanGroup.position.set(15.5, 0.6, -chunkLength * 0.5);

    // Deep Subterranean Van Foundation Plinth
    const vanPlinth = new THREE.Mesh(this.getBox(7.0, 5.5, 5.0), this.parliamentSandstoneMat);
    vanPlinth.position.y = -2.45;
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

    const monPlinth = new THREE.Mesh(this.getBox(4.0, 5.5, 1.0), this.parliamentSandstoneMat);
    monPlinth.position.y = -2.45;
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

    const scrumPlinth = new THREE.Mesh(this.getBox(5.0, 5.5, 4.0), this.parliamentSandstoneMat);
    scrumPlinth.position.y = -2.45;
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
    const congaPlinth = new THREE.Mesh(this.getBox(4.0, 5.5, 10.0), this.parliamentSandstoneMat);
    congaPlinth.position.y = -2.45;
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
    const anchorPlinth = new THREE.Mesh(this.getBox(7.2, 5.5, 7.2), this.parliamentSandstoneMat);
    anchorPlinth.position.y = -2.45;
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
    const teacupPlinth = new THREE.Mesh(this.getBox(6.0, 5.5, 6.0), this.parliamentSandstoneMat);
    teacupPlinth.position.y = -2.45;
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
    this.buildPressScrumStage(group, -16.5, 0.6, -chunkLength * 0.75, director, worldZ - chunkLength * 0.75);

    // CROSSOVER GAG: THE SELFIE BATTLE & CHAI VENDOR TWIST (East side at X = +16.5m, Z = -chunkLength * 0.75)
    this.buildSelfieBattleStage(group, 16.5, 0.6, -chunkLength * 0.75, director, worldZ - chunkLength * 0.75);

    // 4. OVERHEAD PRESS MEDIA LIGHTING TRUSS (Z = -40m, overhead truss at Y = 9.8m, clearance > 8.5m)
    if (detail !== 'MINIMAL') {
      const mediaTruss = new THREE.Group();
      mediaTruss.name = 'rv_press_lighting_truss';
      mediaTruss.position.set(0, 0, -40);

      [-8.8, 8.8].forEach((px) => {
        const plinth = new THREE.Mesh(this.getBox(1.6, 5.0, 1.6), this.parliamentSandstoneMat);
        plinth.position.set(px, -2.5, 0);
        mediaTruss.add(plinth);

        const pylon = new THREE.Mesh(this.getBox(0.8, 9.8, 0.8), this.silverMat);
        pylon.position.set(px, 4.9, 0);
        mediaTruss.add(pylon);
      });

      const trussSpan = new THREE.Mesh(this.getBox(19.2, 0.8, 1.4), this.silverMat);
      trussSpan.position.set(0, 9.8, 0);
      mediaTruss.add(trussSpan);

      // Studio floodlight pods suspended at Y = 9.3m (> 8.5m)
      for (let lx = -6.0; lx <= 6.0; lx += 3.0) {
        const flood = new THREE.Mesh(this.getCylinder(0.2, 0.35, 0.4, 6), this.goldMetalMat);
        flood.position.set(lx, 9.3, 0);
        mediaTruss.add(flood);
      }

      districtC.add(mediaTruss);
    }
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
    director: RahulComedyEventDirector,
    worldZ: number = 0
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
      const walk = new THREE.Mesh(this.getBox(walkW, 7.0, chunkLength), this.parliamentSandstoneMat);
      walk.position.set(wx, -3.2, -chunkLength * 0.5);
      districtD.add(walk);
    });

    // 1. Festive Rollercoaster Carnival Overhead Arches (strictly Y >= 11.2m, warm festive palette)
    for (let z = 15; z < chunkLength - 15; z += 40) {
      const arch = new THREE.Group();
      arch.position.set(0, 0, -z);

      // Side Pylons at |X| = 9.2m (strictly outside |X| <= 4.2m)
      [-roadbedWidth * 0.5 - 3.2, roadbedWidth * 0.5 + 3.2].forEach((px) => {
        const pylon = new THREE.Mesh(this.getBox(1.4, 15.5, 1.4), this.yatraSandstonePlasterMat);
        pylon.position.set(px, 3.75, 0); // goes down to Y = -4.0m
        arch.add(pylon);

        const finial = new THREE.Mesh(this.getSphere(0.8, 8), this.goldMetalMat);
        finial.position.set(px, 12.0, 0);
        arch.add(finial);
      });

      // Overhead Carnival Track Arch (Y = 11.8m, height 0.6m -> min.y = 11.5m > 8.5m)
      const overheadArch = new THREE.Mesh(this.getBox(roadbedWidth + 8.0, 0.6, 1.2), this.yatraTerracottaMat);
      overheadArch.position.set(0, 11.8, 0);
      arch.add(overheadArch);

      // Decorative Marigold Garland Trim
      const marigoldTrim = new THREE.Mesh(this.getBox(roadbedWidth + 7.6, 0.25, 1.3), this.yatraMarigoldMat);
      marigoldTrim.position.set(0, 11.35, 0);
      arch.add(marigoldTrim);

      // Festive Marquee Lamps along the overhead arch
      for (let l = -5; l <= 5; l += 2.5) {
        const lamp = new THREE.Mesh(this.getSphere(0.28, 6), this.goldMetalMat);
        lamp.position.set(l, 11.0, 0);
        arch.add(lamp);
      }

      districtD.add(arch);
    }

    // 2. Kinetic Monumental Handshake Statues on Pedestals
    [-1, 1].forEach((side) => {
      const statueGroup = new THREE.Group();
      statueGroup.position.set(side * 16.5, 0.6, -chunkLength * 0.5);

      // Deep Subterranean Statue Plinth
      const statuePlinth = new THREE.Mesh(this.getBox(6.0, 5.5, 6.0), this.parliamentSandstoneMat);
      statuePlinth.position.y = -2.45;
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

    // Deep Subterranean Carousel Plinth down to Y = -5.2m
    const arenaPlinth = new THREE.Mesh(this.getBox(10.5, 5.5, 10.5), this.parliamentSandstoneMat);
    arenaPlinth.position.y = -2.45;
    disputeStage.add(arenaPlinth);

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
    // Placed prominently on the west sidewalk at X = -7.4m for direct player sightline
    this.buildAllianceChairsRunawayStage(districtD, -7.4, 0.6, -chunkLength * 0.72, director, worldZ - chunkLength * 0.72);

    // 6. Crossover Gag: The Microphone Chase
    this.buildMicrophoneChaseStage(districtD, 16.5, 0.6, -chunkLength * 0.75, director, worldZ - chunkLength * 0.75);
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
    director: RahulComedyEventDirector,
    worldZ: number = 0
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
      const walk = new THREE.Mesh(this.getBox(walkW, 7.0, chunkLength), this.parliamentSandstoneMat);
      walk.position.set(wx, -3.2, -chunkLength * 0.5);
      districtE.add(walk);
    });

    // 1. Cosmic Floating Spires & Dimensional Quantum Obelisks
    [-1, 1].forEach((side) => {
      for (let z = 12; z < chunkLength - 12; z += 30) {
        const spireGroup = new THREE.Group();
        spireGroup.position.set(side * 16.5, 0.6, -z);

        // Deep Subterranean Spire Plinth
        const spirePlinth = new THREE.Mesh(this.getBox(4.2, 5.5, 4.2), this.parliamentSandstoneMat);
        spirePlinth.position.y = -2.45;
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
    this.buildPartyOfficeMixupStage(group, -16.5, 0.6, -chunkLength * 0.75, director, worldZ - chunkLength * 0.75);

    // 5. OVERHEAD QUANTUM ENERGY CONDUIT ARCH (Z = -40m, overhead conduit at Y = 9.8m, clearance > 8.5m)
    if (detail !== 'MINIMAL') {
      const conduitArch = new THREE.Group();
      conduitArch.name = 'rv_quantum_conduit_arch';
      conduitArch.position.set(0, 0, -40);

      [-8.8, 8.8].forEach((px) => {
        const plinth = new THREE.Mesh(this.getBox(1.6, 5.0, 1.6), this.mediaBlueMat);
        plinth.position.set(px, -2.5, 0);
        conduitArch.add(plinth);

        const obelisk = new THREE.Mesh(this.getCylinder(0.25, 0.45, 9.8, 4), this.mediaBlueMat);
        obelisk.position.set(px, 4.9, 0);
        conduitArch.add(obelisk);

        const ring = new THREE.Mesh(this.getTorus(0.8, 0.12, 6), this.neonCyanMat);
        ring.position.set(px, 10.4, 0);
        conduitArch.add(ring);
      });

      const conduitBeam = new THREE.Mesh(this.getBox(19.2, 0.8, 1.4), this.mediaBlueMat);
      conduitBeam.position.set(0, 9.8, 0);
      conduitArch.add(conduitBeam);

      // Glowing neon energy core along beam
      const energyCore = new THREE.Mesh(this.getCylinder(0.12, 0.12, 17.0, 6), this.neonCyanMat);
      energyCore.rotation.z = Math.PI / 2;
      energyCore.position.set(0, 9.8, 0.75);
      conduitArch.add(energyCore);

      districtE.add(conduitArch);
    }
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

    // Dynamic articulated legs with white-soled running shoes
    const legL = new THREE.Group();
    legL.name = 'rahul_leg_l';
    legL.position.set(-0.16, 0.72, 0);
    const trousersL = new THREE.Mesh(this.getCylinder(0.12, 0.10, 0.65, 8), this.darkSuitMat);
    trousersL.position.y = -0.32;
    legL.add(trousersL);
    const shoeL = new THREE.Mesh(this.getBox(0.14, 0.08, 0.28), this.darkSuitMat);
    shoeL.position.set(0, -0.66, 0.04);
    legL.add(shoeL);
    const soleL = new THREE.Mesh(this.getBox(0.15, 0.03, 0.29), this.yatraWhiteMat);
    soleL.position.set(0, -0.70, 0.04);
    legL.add(soleL);
    char.add(legL);

    const legR = new THREE.Group();
    legR.name = 'rahul_leg_r';
    legR.position.set(0.16, 0.72, 0);
    const trousersR = new THREE.Mesh(this.getCylinder(0.12, 0.10, 0.65, 8), this.darkSuitMat);
    trousersR.position.y = -0.32;
    legR.add(trousersR);
    const shoeR = new THREE.Mesh(this.getBox(0.14, 0.08, 0.28), this.darkSuitMat);
    shoeR.position.set(0, -0.66, 0.04);
    legR.add(shoeR);
    const soleR = new THREE.Mesh(this.getBox(0.15, 0.03, 0.29), this.yatraWhiteMat);
    soleR.position.set(0, -0.70, 0.04);
    legR.add(soleR);
    char.add(legR);

    // Standalone base legs mesh for child-count preservation
    const legs = new THREE.Mesh(this.getBox(0.42, 0.8, 0.32), this.darkSuitMat);
    legs.position.y = 0.4;
    legs.visible = false;
    char.add(legs);

    // Crisp White Yatra Kurta / Polo Torso
    const torso = new THREE.Mesh(this.getBox(0.48, 0.70, 0.34), this.yatraWhiteMat);
    torso.position.y = 1.10;
    char.add(torso);

    // Polo collar & placket
    const placket = new THREE.Mesh(this.getBox(0.08, 0.35, 0.02), this.yatraWhiteMat);
    placket.position.set(0, 1.25, 0.18);
    char.add(placket);

    const collar = new THREE.Mesh(this.getCylinder(0.18, 0.20, 0.10, 8), this.yatraWhiteMat);
    collar.position.y = 1.44;
    char.add(collar);

    // Articulated Head & Neck Group (neck pivot for turning and nodding)
    const headGroup = new THREE.Group();
    headGroup.name = 'rahul_head_group';
    headGroup.position.set(0, 1.48, 0);

    // Sculpted Head & Cheeks
    const head = new THREE.Mesh(this.getCylinder(0.19, 0.18, 0.36, 12), this.cartoonSkinMat);
    head.position.y = 0.14;
    headGroup.add(head);

    // Nose
    const nose = new THREE.Mesh(this.getCylinder(0.03, 0.045, 0.10, 6), this.cartoonSkinMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.16, 0.20);
    headGroup.add(nose);

    // Smiling cartoon mouth
    const mouth = new THREE.Mesh(this.getBox(0.12, 0.03, 0.02), this.darkSuitMat);
    mouth.position.set(0, 0.06, 0.19);
    headGroup.add(mouth);

    // Swept Dark Hair with Cowlick Tuft
    const hair = new THREE.Mesh(this.getSphere(0.23, 10), this.cartoonHairDarkMat);
    hair.scale.set(1.02, 1.12, 1.05);
    hair.position.set(0, 0.26, -0.03);
    headGroup.add(hair);

    const cowlick = new THREE.Mesh(this.getBox(0.06, 0.10, 0.12), this.cartoonHairDarkMat);
    cowlick.position.set(-0.06, 0.38, 0.08);
    cowlick.rotation.z = -0.3;
    headGroup.add(cowlick);

    // Eyebrows
    const eyebrowL = new THREE.Mesh(this.getBox(0.10, 0.025, 0.02), this.cartoonHairDarkMat);
    eyebrowL.position.set(-0.08, 0.24, 0.20);
    headGroup.add(eyebrowL);

    const eyebrowR = new THREE.Mesh(this.getBox(0.10, 0.025, 0.02), this.cartoonHairDarkMat);
    eyebrowR.position.set(0.08, 0.24, 0.20);
    headGroup.add(eyebrowR);

    // Signature Wink Eyelid on left eye (ready for animated wink closure)
    const winkLid = new THREE.Mesh(this.getBox(0.09, 0.05, 0.02), this.cartoonSkinMat);
    winkLid.position.set(-0.08, 0.17, 0.205);
    headGroup.add(winkLid);

    // Gold tooth sparkle star for the signature wink smile
    const sparkleStar = new THREE.Group();
    sparkleStar.name = 'rahul_sparkle_star';
    sparkleStar.position.set(0.16, 0.08, 0.22);
    const s1 = new THREE.Mesh(this.getBox(0.24, 0.04, 0.02), this.goldMetalMat);
    sparkleStar.add(s1);
    const s2 = new THREE.Mesh(this.getBox(0.04, 0.24, 0.02), this.goldMetalMat);
    sparkleStar.add(s2);
    sparkleStar.visible = false;
    headGroup.add(sparkleStar);

    char.add(headGroup);

    // Articulated Arms with shoulder, elbow, and hand joints
    const armL = new THREE.Group();
    armL.name = 'rahul_arm_l';
    armL.position.set(-0.32, 1.25, 0);
    const sleeveL = new THREE.Mesh(this.getCylinder(0.075, 0.065, 0.24, 8), this.yatraWhiteMat);
    sleeveL.position.y = -0.12;
    armL.add(sleeveL);

    const elbowL = new THREE.Group();
    elbowL.name = 'rahul_elbow_l';
    elbowL.position.set(0, -0.24, 0);
    const forearmL = new THREE.Mesh(this.getCylinder(0.065, 0.055, 0.20, 8), this.cartoonSkinMat);
    forearmL.position.y = -0.10;
    elbowL.add(forearmL);
    const handL = new THREE.Mesh(this.getSphere(0.06, 6), this.cartoonSkinMat);
    handL.position.y = -0.20;
    elbowL.add(handL);
    armL.add(elbowL);
    char.add(armL);

    const armR = new THREE.Group();
    armR.name = 'rahul_arm_r';
    armR.position.set(0.32, 1.25, 0);
    const sleeveR = new THREE.Mesh(this.getCylinder(0.075, 0.065, 0.24, 8), this.yatraWhiteMat);
    sleeveR.position.y = -0.12;
    armR.add(sleeveR);

    const elbowR = new THREE.Group();
    elbowR.name = 'rahul_elbow_r';
    elbowR.position.set(0, -0.24, 0);
    const forearmR = new THREE.Mesh(this.getCylinder(0.065, 0.055, 0.20, 8), this.cartoonSkinMat);
    forearmR.position.y = -0.10;
    elbowR.add(forearmR);
    const handR = new THREE.Mesh(this.getSphere(0.06, 6), this.cartoonSkinMat);
    handR.position.y = -0.20;
    elbowR.add(handR);
    armR.add(elbowR);
    char.add(armR);

    // Save joint handles on userData for expressive character animations
    char.userData.joints = {
      headGroup,
      eyebrowL,
      eyebrowR,
      winkLid,
      mouth,
      sparkleStar,
      armL,
      elbowL,
      handL,
      armR,
      elbowR,
      handR,
      legL,
      legR
    };

    // Configure initial pose
    if (pose === 'VICTORY') {
      armR.rotation.x = -1.6;
      armR.rotation.z = 0.2;
      elbowR.rotation.x = -0.3;
      armL.rotation.set(-0.4, 0.2, -0.2);
    } else if (pose === 'RUN') {
      legL.rotation.x = 0.5;
      legR.rotation.x = -0.5;
      armL.rotation.x = -0.7;
      armR.rotation.x = 0.7;
      elbowL.rotation.x = -0.6;
      elbowR.rotation.x = -0.6;
    } else if (pose === 'CHASE') {
      char.rotation.x = 0.25;
      armL.rotation.x = -1.2;
      armR.rotation.x = -1.4;
      legL.rotation.x = -0.6;
      legR.rotation.x = 0.6;
    } else {
      // DEBATE
      armR.rotation.x = -1.1;
      elbowR.rotation.x = -0.4;
      armL.rotation.z = 0.35;
    }

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

    // Traditional shoes with upturned toes
    [-0.14, 0.14].forEach((fx) => {
      const shoe = new THREE.Mesh(this.getBox(0.14, 0.10, 0.30), this.woodMat);
      shoe.position.set(fx, 0.05, 0.05);
      char.add(shoe);
    });

    // White Kurta legs
    const legs = new THREE.Mesh(this.getBox(0.44, 0.78, 0.34), this.yatraWhiteMat);
    legs.position.y = 0.39;
    char.add(legs);

    // Kurta skirt hem
    const kurtaSkirt = new THREE.Mesh(this.getCylinder(0.26, 0.30, 0.32, 10), this.yatraWhiteMat);
    kurtaSkirt.position.y = 0.74;
    char.add(kurtaSkirt);

    // Saffron Nehru Waistcoat Torso
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

    // Drop-jaw for shock/surprise
    const jaw = new THREE.Mesh(this.getCylinder(0.17, 0.10, 0.10, 8), this.cartoonHairSilverMat);
    jaw.position.set(0, 1.38, 0.14);
    char.add(jaw);

    // Spectacles frame
    const specs = new THREE.Mesh(this.getBox(0.36, 0.08, 0.04), this.goldMetalMat);
    specs.position.set(0, 1.68, 0.2);
    char.add(specs);

    // Eyebrows
    const eyebrowL = new THREE.Mesh(this.getBox(0.08, 0.025, 0.02), this.cartoonHairSilverMat);
    eyebrowL.position.set(-0.09, 1.74, 0.22);
    char.add(eyebrowL);

    const eyebrowR = new THREE.Mesh(this.getBox(0.08, 0.025, 0.02), this.cartoonHairSilverMat);
    eyebrowR.position.set(0.09, 1.74, 0.22);
    char.add(eyebrowR);

    // Articulated Arms
    const armL = new THREE.Group();
    armL.name = 'modi_arm_l';
    armL.position.set(-0.36, 1.1, 0);
    const sleeveL = new THREE.Mesh(this.getBox(0.13, 0.52, 0.13), this.yatraWhiteMat);
    sleeveL.position.y = -0.26;
    armL.add(sleeveL);
    armL.rotation.z = pose === 'VICTORY' ? 0.75 : 0.3;
    char.add(armL);

    const armR = new THREE.Group();
    armR.name = 'modi_arm_r';
    armR.position.set(0.36, 1.1, 0);
    const sleeveR = new THREE.Mesh(this.getBox(0.13, 0.52, 0.13), this.yatraWhiteMat);
    sleeveR.position.y = -0.26;
    armR.add(sleeveR);
    armR.rotation.z = -0.65;
    armR.position.y = 1.35;
    char.add(armR);

    // Save joint handles
    char.userData.joints = {
      headGroup: head,
      jaw,
      glasses: specs,
      eyebrowL,
      eyebrowR,
      armL,
      armR
    };

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

    // Dangling muffler tail
    const mufflerTail = new THREE.Mesh(this.getBox(0.12, 0.45, 0.08), this.yatraOrangeMat);
    mufflerTail.position.set(0.16, 1.15, 0.18);
    char.add(mufflerTail);

    const head = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.36, 8), this.cartoonSkinMat);
    head.position.y = 1.58;
    char.add(head);

    const specs = new THREE.Mesh(this.getBox(0.34, 0.08, 0.04), this.darkSuitMat);
    specs.position.set(0, 1.62, 0.18);
    char.add(specs);

    const armL = new THREE.Mesh(this.getBox(0.12, 0.48, 0.12), this.woodMat);
    armL.position.set(-0.32, 1.05, 0);
    char.add(armL);

    const armR = new THREE.Mesh(this.getBox(0.12, 0.48, 0.12), this.woodMat);
    armR.position.set(0.32, 1.05, 0);
    char.add(armR);

    char.userData.joints = {
      headGroup: head,
      glasses: specs,
      muffler,
      mufflerTail,
      armL,
      armR
    };

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

    const armL = new THREE.Mesh(this.getBox(0.10, 0.46, 0.10), this.yatraWhiteMat);
    armL.position.set(-0.30, 1.05, 0);
    char.add(armL);

    const armR = new THREE.Mesh(this.getBox(0.10, 0.46, 0.10), this.yatraWhiteMat);
    armR.position.set(0.30, 1.05, 0);
    char.add(armR);

    char.userData.joints = {
      headGroup: head,
      bun,
      pallu,
      armL,
      armR
    };

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

    const armL = new THREE.Mesh(this.getBox(0.11, 0.46, 0.11), this.yatraWhiteMat);
    armL.position.set(-0.32, 1.05, 0);
    char.add(armL);

    const armR = new THREE.Mesh(this.getBox(0.11, 0.46, 0.11), this.yatraWhiteMat);
    armR.position.set(0.32, 1.05, 0);
    char.add(armR);

    char.userData.joints = {
      headGroup: head,
      glasses: specs,
      armL,
      armR
    };

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
    director: RahulComedyEventDirector,
    worldZ?: number
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'rahul_parliament_hug_and_wink';
    stage.position.set(x, y, z);

    // Deep Subterranean Sandstone Foundation Plinth down to Y = -5.2m
    // Width 6.0m, centered at X = 7.6m -> Left edge at 7.6 - 3.0 = 4.6m (strictly outside |X| <= 4.2m envelope)
    const plinth = new THREE.Mesh(this.getBox(6.0, 5.5, 8.4), this.parliamentSandstoneMat);
    plinth.position.y = -2.45;
    stage.add(plinth);

    // Pristine White Makrana Marble Concourse Floor
    const marbleFloor = new THREE.Mesh(this.getBox(5.8, 0.12, 8.0), this.parliamentMarbleMat);
    marbleFloor.position.set(0, 0.35, 0);
    stage.add(marbleFloor);

    // Inlaid Green Carpet Center Aisle
    const greenCarpet = new THREE.Mesh(this.getBox(2.4, 0.14, 7.6), this.parliamentGreenMat);
    greenCarpet.position.set(0, 0.36, 0);
    stage.add(greenCarpet);

    // Fluted Sandstone Colonnade along back wall (z = -3.8)
    const backWall = new THREE.Mesh(this.getBox(5.8, 4.6, 0.4), this.parliamentSandstoneMat);
    backWall.position.set(0, 2.65, -3.9);
    stage.add(backWall);

    for (let c = -2.4; c <= 2.4; c += 1.6) {
      const col = new THREE.Mesh(this.getCylinder(0.20, 0.22, 4.4, 12), this.parliamentSandstoneMat);
      col.position.set(c, 2.55, -3.7);
      stage.add(col);

      // Scalloped arch cap
      const cap = new THREE.Mesh(this.getBox(0.60, 0.22, 0.60), this.goldMetalMat);
      cap.position.set(c, 4.75, -3.7);
      stage.add(cap);
    }

    // Overhead Marquee Banner
    const marqueeTex = RahulverseTextureCache.getHugAndWinkMarqueeTexture();
    const marqueeMesh = new THREE.Mesh(this.getBox(5.6, 1.4, 0.14), new THREE.MeshBasicMaterial({ map: marqueeTex }));
    marqueeMesh.position.set(0, 5.1, -3.5);
    stage.add(marqueeMesh);

    // Warm parliamentary brass chandeliers / spotlights
    [-1.8, 1.8].forEach((lx) => {
      const lamp = new THREE.Mesh(this.getCylinder(0.28, 0.12, 0.45, 8), this.goldMetalMat);
      lamp.position.set(lx, 4.9, -3.4);
      lamp.rotation.x = 0.35;
      stage.add(lamp);
    });

    // Treasury Bench with Seated Modi on Left
    const treasuryBench = new THREE.Mesh(this.getBox(2.4, 1.15, 1.5), this.parliamentGreenMat);
    treasuryBench.position.set(-0.8, 1.1, 0);
    stage.add(treasuryBench);

    // Polished Wooden Desk with Microphones & Papers
    const desk = new THREE.Mesh(this.getBox(2.2, 0.85, 0.7), this.woodMat);
    desk.position.set(-0.8, 0.8, 0.85);
    stage.add(desk);

    const deskMic = new THREE.Mesh(this.getCylinder(0.02, 0.02, 0.35, 6), this.silverMat);
    deskMic.position.set(-0.8, 1.35, 0.85);
    stage.add(deskMic);

    // Modi Caricature in Seated Pose
    const modi = new THREE.Group();
    modi.name = 'seated_modi';
    modi.position.set(-0.8, 0.8, 0);

    const mLegs = new THREE.Mesh(this.getBox(0.44, 0.5, 0.4), this.yatraWhiteMat);
    mLegs.position.y = 0.25;
    modi.add(mLegs);

    const mTorso = new THREE.Mesh(this.getBox(0.54, 0.68, 0.40), this.saffronWaistcoatMat);
    mTorso.position.y = 0.85;
    modi.add(mTorso);

    const mCollar = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.10, 8), this.saffronWaistcoatMat);
    mCollar.position.y = 1.22;
    modi.add(mCollar);

    const mHead = new THREE.Mesh(this.getCylinder(0.22, 0.20, 0.38, 10), this.cartoonSkinMat);
    mHead.position.y = 1.45;
    modi.add(mHead);

    const mHair = new THREE.Mesh(this.getSphere(0.24, 8), this.cartoonHairSilverMat);
    mHair.position.set(0, 1.62, -0.04);
    modi.add(mHair);

    const mBeard = new THREE.Mesh(this.getBox(0.30, 0.22, 0.20), this.cartoonHairSilverMat);
    mBeard.position.set(0, 1.34, 0.14);
    modi.add(mBeard);

    // Articulated Spectacles that pop up in surprise
    const specs = new THREE.Mesh(this.getBox(0.38, 0.08, 0.04), this.goldMetalMat);
    specs.position.set(0, 1.52, 0.22);
    modi.add(specs);

    // Articulated Modi Arms that fling up in disbelief when hugged
    const modiArmL = new THREE.Mesh(this.getBox(0.12, 0.48, 0.12), this.yatraWhiteMat);
    modiArmL.position.set(-0.36, 0.95, 0);
    modi.add(modiArmL);

    const modiArmR = new THREE.Mesh(this.getBox(0.12, 0.48, 0.12), this.yatraWhiteMat);
    modiArmR.position.set(0.36, 0.95, 0);
    modi.add(modiArmR);

    modi.userData.joints = {
      headGroup: mHead,
      jaw: mBeard,
      glasses: specs,
      armL: modiArmL,
      armR: modiArmR
    };

    stage.add(modi);

    // Rahul Caricature that strides across floor, hugs & winks
    const rahul = new THREE.Group();
    rahul.name = 'striding_rahul';
    rahul.position.set(-2.8, 0.8, 0);

    const rLegs = new THREE.Mesh(this.getBox(0.42, 0.8, 0.32), this.darkSuitMat);
    rLegs.position.y = 0.4;
    rahul.add(rLegs);

    const rTorso = new THREE.Mesh(this.getBox(0.50, 0.72, 0.36), this.yatraWhiteMat);
    rTorso.position.y = 1.1;
    rahul.add(rTorso);

    const rHead = new THREE.Mesh(this.getCylinder(0.20, 0.20, 0.38, 10), this.cartoonSkinMat);
    rHead.position.y = 1.65;
    rahul.add(rHead);

    const rHair = new THREE.Mesh(this.getSphere(0.23, 8), this.cartoonHairDarkMat);
    rHair.position.set(0, 1.82, -0.02);
    rahul.add(rHair);

    // Left Eyebrow for arched winking
    const eyebrowL = new THREE.Mesh(this.getBox(0.13, 0.03, 0.03), this.cartoonHairDarkMat);
    eyebrowL.position.set(-0.08, 1.78, 0.21);
    rahul.add(eyebrowL);

    // Left Eyelid that snaps shut
    const eyelidL = new THREE.Mesh(this.getBox(0.11, 0.06, 0.02), this.cartoonSkinMat);
    eyelidL.position.set(-0.08, 1.70, 0.22);
    rahul.add(eyelidL);

    // Tooth sparkle star (pops up at corner of wink smile)
    const sparkleStar = new THREE.Group();
    sparkleStar.position.set(0.22, 1.65, 0.26);
    const sBeam1 = new THREE.Mesh(this.getBox(0.38, 0.05, 0.03), this.goldMetalMat);
    sparkleStar.add(sBeam1);
    const sBeam2 = new THREE.Mesh(this.getBox(0.05, 0.38, 0.03), this.goldMetalMat);
    sparkleStar.add(sBeam2);
    sparkleStar.visible = false;
    rahul.add(sparkleStar);

    // Arms
    const rArmL = new THREE.Mesh(this.getBox(0.12, 0.54, 0.12), this.yatraWhiteMat);
    rArmL.position.set(-0.35, 1.15, 0);
    rahul.add(rArmL);

    const rArmR = new THREE.Mesh(this.getBox(0.12, 0.54, 0.12), this.yatraWhiteMat);
    rArmR.position.set(0.35, 1.15, 0);
    rahul.add(rArmR);

    rahul.userData.joints = {
      headGroup: rHead,
      eyebrowL,
      eyelidL,
      winkLid: eyelidL,
      sparkleStar,
      armL: rArmL,
      armR: rArmR
    };

    stage.add(rahul);

    // Cartoon Floating Heart Mesh
    const heartMesh = new THREE.Mesh(this.getSphere(0.50, 10), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.6 }));
    heartMesh.position.set(-0.8, 3.2, 0);
    heartMesh.scale.set(0.01, 0.01, 0.01);
    stage.add(heartMesh);

    // Press Gallery Scaffold in background with Cameraman and Spectator MPs
    const galleryGroup = new THREE.Group();
    galleryGroup.position.set(2.8, 0.8, -2.5);

    const gallRailing = new THREE.Mesh(this.getBox(3.4, 1.2, 0.2), this.goldMetalMat);
    gallRailing.position.set(0, 0.6, 0);
    galleryGroup.add(gallRailing);

    // Cameraman Tripod
    const tripod = new THREE.Mesh(this.getCylinder(0.06, 0.18, 1.4, 6), this.silverMat);
    tripod.position.set(-0.4, 1.3, 0.4);
    galleryGroup.add(tripod);

    const cameraBox = new THREE.Mesh(this.getBox(0.38, 0.26, 0.52), this.darkSuitMat);
    cameraBox.position.set(-0.4, 2.05, 0.4);
    galleryGroup.add(cameraBox);

    // Cameraman Figure that falls backwards
    const cameraman = new THREE.Group();
    cameraman.position.set(-0.4, 0.6, -0.2);

    const cBody = new THREE.Mesh(this.getBox(0.42, 0.65, 0.28), this.royalBlueMat);
    cBody.position.y = 0.75;
    cameraman.add(cBody);

    const cHead = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.32, 8), this.cartoonSkinMat);
    cHead.position.y = 1.25;
    cameraman.add(cHead);
    galleryGroup.add(cameraman);

    // Spectator MPs in the gallery with articulated arms that throw arms up in disbelief
    const gallerySpectators: { group: THREE.Group; armL: THREE.Mesh; armR: THREE.Mesh }[] = [];
    [0.6, 1.3].forEach((sx, idx) => {
      const mpGroup = new THREE.Group();
      mpGroup.position.set(sx, 0.6, -0.2);

      const mpBody = new THREE.Mesh(this.getBox(0.38, 0.60, 0.26), idx === 0 ? this.yatraSandstonePlasterMat : this.yatraWhiteMat);
      mpBody.position.y = 0.70;
      mpGroup.add(mpBody);

      const mpHead = new THREE.Mesh(this.getCylinder(0.16, 0.16, 0.28, 8), this.cartoonSkinMat);
      mpHead.position.y = 1.15;
      mpGroup.add(mpHead);

      const sArmL = new THREE.Mesh(this.getBox(0.10, 0.42, 0.10), this.yatraWhiteMat);
      sArmL.position.set(-0.25, 0.75, 0);
      mpGroup.add(sArmL);

      const sArmR = new THREE.Mesh(this.getBox(0.10, 0.42, 0.10), this.yatraWhiteMat);
      sArmR.position.set(0.25, 0.75, 0);
      mpGroup.add(sArmR);

      galleryGroup.add(mpGroup);
      gallerySpectators.push({ group: mpGroup, armL: sArmL, armR: sArmR });
    });

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
      heartMesh,
      modiArmL,
      modiArmR,
      gallerySpectators,
      worldZ
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
    director: RahulComedyEventDirector,
    worldZ?: number
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'rahul_mic_chaos';
    stage.position.set(x, y, z);

    const base = new THREE.Mesh(this.getBox(8.0, 5.5, 8.0), this.parliamentSandstoneMat);
    base.position.y = -2.45;
    stage.add(base);

    const stageFloor = new THREE.Mesh(this.getBox(7.6, 0.08, 7.6), this.parliamentSandstoneMat);
    stageFloor.position.y = 0.34;
    stage.add(stageFloor);

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

    director.registerMicrophoneChaos(stage, mics, worldZ);
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
    director: RahulComedyEventDirector,
    worldZ?: number
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'rahul_press_scrum';
    stage.position.set(x, y, z);

    const base = new THREE.Mesh(this.getBox(8.0, 5.5, 8.0), this.parliamentSandstoneMat);
    base.position.y = -2.45;
    stage.add(base);

    const stageFloor = new THREE.Mesh(this.getBox(7.6, 0.08, 7.6), this.parliamentSandstoneMat);
    stageFloor.position.y = 0.34;
    stage.add(stageFloor);

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

    director.registerPressScrum(stage, reporters, worldZ);
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
    director: RahulComedyEventDirector,
    worldZ?: number
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'rahul_alliance_chairs_runaway';
    stage.position.set(x, y, z);

    // Deep Subterranean Foundation Plinth down to Y = -5.2m
    // Width 6.0m at X = -7.4m -> Right edge at -7.4 + 3.0 = -4.4m (strictly outside |X| <= 4.2m envelope)
    const base = new THREE.Mesh(this.getBox(6.0, 5.5, 7.6), this.parliamentSandstoneMat);
    base.position.y = -2.45;
    stage.add(base);

    const deck = new THREE.Mesh(this.getBox(5.8, 0.1, 7.4), this.parliamentSandstoneMat);
    deck.position.y = 0.34;
    stage.add(deck);

    // Large Round Conference Table
    const table = new THREE.Mesh(this.getCylinder(1.8, 1.9, 0.9, 16), this.woodMat);
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
      cGroup.position.set(Math.cos(cAng) * 1.8, 0.8, Math.sin(cAng) * 1.8);

      const cSeat = new THREE.Mesh(this.getBox(0.7, 0.7, 0.7), this.yatraTealMat);
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

    director.registerAllianceChairsRunaway(stage, nitishChairGroup, runningChairs, worldZ);
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
    director: RahulComedyEventDirector,
    worldZ?: number
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'rahul_crossover_hug_loop';
    stage.position.set(x, y, z);

    const base = new THREE.Mesh(this.getBox(8.5, 5.5, 8.5), this.parliamentSandstoneMat);
    base.position.y = -2.45;
    stage.add(base);

    const deck = new THREE.Mesh(this.getBox(8.0, 0.1, 8.0), this.parliamentSandstoneMat);
    deck.position.y = 0.34;
    stage.add(deck);

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
    director.registerHugLoop(turntable, modiFig, rahulFig, heartIcon, worldZ);

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
    director: RahulComedyEventDirector,
    worldZ?: number
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'rahul_crossover_selfie_battle';
    stage.position.set(x, y, z);

    const base = new THREE.Mesh(this.getBox(8.5, 5.5, 8.5), this.parliamentSandstoneMat);
    base.position.y = -2.45;
    stage.add(base);

    const deck = new THREE.Mesh(this.getBox(8.0, 0.1, 8.0), this.parliamentSandstoneMat);
    deck.position.y = 0.34;
    stage.add(deck);

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

    director.registerSelfieBattle(modi, rahul, drone, vendor, flash, worldZ);

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
    director: RahulComedyEventDirector,
    worldZ?: number
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'rahul_crossover_mic_chase';
    stage.position.set(x, y, z);

    const base = new THREE.Mesh(this.getBox(7.5, 5.5, 12.0), this.parliamentSandstoneMat);
    base.position.y = -2.45;
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

    director.registerMicrophoneChase(cart, modi, rahul, worldZ);

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
    director: RahulComedyEventDirector,
    worldZ?: number
  ): THREE.Group {
    const stage = new THREE.Group();
    stage.name = 'rahul_crossover_office_mixup';
    stage.position.set(x, y, z);

    const base = new THREE.Mesh(this.getBox(8.5, 5.5, 8.5), this.parliamentSandstoneMat);
    base.position.y = -2.45;
    stage.add(base);

    const deck = new THREE.Mesh(this.getBox(8.0, 0.1, 8.0), this.parliamentSandstoneMat);
    deck.position.y = 0.34;
    stage.add(deck);

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

    director.registerPartyOfficeMixup(portal, pol, signA, signB, worldZ);

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

  // =========================================================================
  // DISTRICT F — REGIONAL TOWN AND ROADSHOW (AUTHENTIC INDIAN STREETSCAPE)
  // =========================================================================

  /**
   * District F: Regional Town and Roadshow
   * Authentic bustling Indian regional bazaar, wooden verandas, terracotta & marigold
   * shopfronts, flower garland stalls, open chabutras with neem trees, campaign van
   * with rotating loudspeakers and animated soundwaves, cheering roadside crowds with tricolor flags.
   */
  public buildRegionalRoadshowDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: RahulComedyEventDirector,
    worldZ: number = 0
  ): void {
    const districtF = new THREE.Group();
    districtF.name = 'district_f_regional_roadshow';
    group.add(districtF);

    const curbEdge = roadbedWidth * 0.5 + 0.5;

    // 1. Vibrant Regional Bazaar Facade on both sides with verandas, jharokhas, and terracotta roofs
    [-1, 1].forEach((side) => {
      this.buildSurrealYatraFacade(districtF, roadbedWidth, chunkLength, side, 5, rng, detail);

      const walkW = 22.0;
      const wx = side * (curbEdge + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 7.0, chunkLength), this.parliamentSandstoneMat);
      walk.position.set(wx, -3.2, -chunkLength * 0.5);
      districtF.add(walk);

      // Yellow/white crowd barricades with cheering spectators along sidewalk curb
      for (let z = 10; z < chunkLength - 10; z += 18) {
        this.buildRoadsideBarricadeWithCrowd(districtF, side * (curbEdge + 1.2), 0.6, -z, side > 0);
      }
    });

    // 2. Open-Roof Campaign Support Van with 4 Loudspeaker Horns & Waving Leader (East promenade at X = 6.8m)
    this.buildCampaignSupportVan(districtF, 6.8, 0.6, -chunkLength * 0.32, director, worldZ - chunkLength * 0.32);

    // 3. Roadside Tea Dhaba & Flower Garland Bazaar Stall (West promenade at X = -7.2m)
    this.buildMarketplaceBazaar(districtF, -7.2, 0.6, -chunkLength * 0.35);

    // 4. Circular Stone Sitting Chabutra wrapping around lush green Peepal/Neem Tree (East promenade at X = 8.2m)
    this.buildChabutraWithPeepal(districtF, 8.2, 0.6, -chunkLength * 0.68);

    // 5. Yatra Water Hydration Station with Earthen Clay Matkas & Volunteers (West promenade at X = -7.0m)
    this.buildWaterStation(districtF, -7.0, 0.6, -chunkLength * 0.72);

    // 6. Overhead Festoon Bunting Cable (Z = -40m, overhead cable at Y = 9.8m, clearance > 8.5m)
    if (detail !== 'MINIMAL') {
      const festoonGroup = new THREE.Group();
      festoonGroup.name = 'rv_regional_festoon_cable';
      festoonGroup.position.set(0, 0, -40);

      [-8.8, 8.8].forEach((px) => {
        const plinth = new THREE.Mesh(this.getBox(1.2, 5.0, 1.2), this.parliamentSandstoneMat);
        plinth.position.set(px, -2.5, 0);
        festoonGroup.add(plinth);

        const pole = new THREE.Mesh(this.getCylinder(0.2, 0.28, 9.8, 8), this.woodMat);
        pole.position.set(px, 4.9, 0);
        festoonGroup.add(pole);
      });

      const cable = new THREE.Mesh(this.getCylinder(0.03, 0.03, 19.2, 6), this.parliamentSandstoneMat);
      cable.rotation.z = Math.PI / 2;
      cable.position.set(0, 9.8, 0);
      festoonGroup.add(cable);

      // Hanging tricolor festoon pennants at Y = 9.3m (> 8.5m)
      for (let fx = -6.0; fx <= 6.0; fx += 2.0) {
        const pennantMat = Math.abs(fx) % 4 === 0 ? this.yatraOrangeMat : (Math.abs(fx) % 4 === 2 ? this.yatraGreenMat : this.yatraWhiteMat);
        const pennant = new THREE.Mesh(this.getPlane(0.5, 0.65), pennantMat);
        pennant.position.set(fx, 9.3, 0);
        festoonGroup.add(pennant);
      }

      districtF.add(festoonGroup);
    }
  }

  /**
   * Roadside Yellow/White Crowd Barricade with cheering spectator waving tricolor flag
   */
  public buildRoadsideBarricadeWithCrowd(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    isRight: boolean
  ): THREE.Group {
    const barGroup = new THREE.Group();
    barGroup.position.set(x, y, z);

    // Deep Subterranean Foundation Plinth down to Y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(0.8, 5.5, 4.2), this.parliamentSandstoneMat);
    plinth.position.y = -2.45;
    barGroup.add(plinth);

    // Yellow & White Traffic Barricade Frame
    const railBottom = new THREE.Mesh(this.getBox(0.12, 0.12, 3.8), this.yatraMarigoldMat);
    railBottom.position.y = 0.35;
    barGroup.add(railBottom);

    const railTop = new THREE.Mesh(this.getBox(0.12, 0.12, 3.8), this.yatraMarigoldMat);
    railTop.position.y = 0.95;
    barGroup.add(railTop);

    // Vertical barrier legs
    [-1.7, 1.7].forEach((lz) => {
      const leg = new THREE.Mesh(this.getCylinder(0.04, 0.04, 1.1, 6), this.silverMat);
      leg.position.set(0, 0.55, lz);
      barGroup.add(leg);

      const foot = new THREE.Mesh(this.getBox(0.6, 0.08, 0.15), this.silverMat);
      foot.position.set(0, 0.04, lz);
      barGroup.add(foot);
    });

    // Barricade signboard panel
    const panel = new THREE.Mesh(this.getBox(0.06, 0.45, 3.4), this.yatraMarigoldMat);
    panel.position.y = 0.65;
    barGroup.add(panel);

    // 2 Cheering crowd figures behind barricade
    [-0.8, 0.8].forEach((cz, cIdx) => {
      const crowdX = isRight ? 0.45 : -0.45;
      this.buildCheeringCrowdMember(barGroup, crowdX, 0, cz, isRight);
    });

    group.add(barGroup);
    return barGroup;
  }

  /**
   * Yatra Water Hydration Station
   * Folding table with terracotta earthen pots (matkas), copper ladles, paper cups,
   * hydration banner, and 2 volunteer caricatures in white kurtas.
   */
  public buildWaterStation(
    group: THREE.Group,
    x: number,
    y: number,
    z: number
  ): THREE.Group {
    const station = new THREE.Group();
    station.name = 'rahul_yatra_water_station';
    station.position.set(x, y, z);

    // Deep Subterranean Foundation Plinth down to Y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(3.4, 5.5, 4.8), this.parliamentSandstoneMat);
    plinth.position.y = -2.45;
    station.add(plinth);

    // Sandstone platform
    const platform = new THREE.Mesh(this.getBox(3.2, 0.25, 4.6), this.parliamentSandstoneMat);
    platform.position.y = 0.125;
    station.add(platform);

    // Folding wooden table
    const tableTop = new THREE.Mesh(this.getBox(1.6, 0.12, 3.6), this.woodMat);
    tableTop.position.set(0, 0.85, 0);
    station.add(tableTop);

    [-1.6, 1.6].forEach((tz) => {
      const tLeg = new THREE.Mesh(this.getCylinder(0.04, 0.04, 0.8, 6), this.woodMat);
      tLeg.position.set(0, 0.4, tz);
      station.add(tLeg);
    });

    // 3 Traditional Earthen Clay Water Pots (Matkas) with flared rims
    [-1.0, 0, 1.0].forEach((mz, mIdx) => {
      const matkaBody = new THREE.Mesh(this.getSphere(0.32, 10), this.yatraTerracottaMat);
      matkaBody.position.set(-0.2, 1.25, mz);
      station.add(matkaBody);

      const matkaRim = new THREE.Mesh(this.getCylinder(0.16, 0.14, 0.12, 8), this.yatraTerracottaMat);
      matkaRim.position.set(-0.2, 1.58, mz);
      station.add(matkaRim);

      // Long copper water ladle
      const ladle = new THREE.Mesh(this.getCylinder(0.015, 0.015, 0.65, 4), this.goldMetalMat);
      ladle.position.set(-0.2, 1.7, mz);
      ladle.rotation.z = 0.25;
      station.add(ladle);
    });

    // Paper cups stacked on table
    [0.3, 0.6].forEach((cz) => {
      const cupStack = new THREE.Mesh(this.getCylinder(0.06, 0.05, 0.35, 6), this.paperWhiteMat);
      cupStack.position.set(0.35, 1.05, cz);
      station.add(cupStack);
    });

    // Overhead Tricolor Hydration Banner on bamboo poles
    [-1.9, 1.9].forEach((pz) => {
      const pole = new THREE.Mesh(this.getCylinder(0.05, 0.05, 3.2, 6), this.woodMat);
      pole.position.set(0, 1.6, pz);
      station.add(pole);
    });

    const bannerBeam = new THREE.Mesh(this.getBox(0.08, 0.65, 4.0), this.yatraOrangeMat);
    bannerBeam.position.set(0, 3.0, 0);
    station.add(bannerBeam);

    const bannerBottom = new THREE.Mesh(this.getBox(0.08, 0.3, 4.0), this.yatraBannerGreenMat);
    bannerBottom.position.set(0, 2.65, 0);
    station.add(bannerBottom);

    // 2 Volunteers in White Kurtas serving water
    [-0.8, 0.8].forEach((vz, vIdx) => {
      const volGroup = new THREE.Group();
      volGroup.position.set(0.8, 0.25, vz);

      const vLegs = new THREE.Mesh(this.getBox(0.36, 0.7, 0.28), this.yatraWhiteMat);
      vLegs.position.y = 0.35;
      volGroup.add(vLegs);

      const vTorso = new THREE.Mesh(this.getBox(0.42, 0.65, 0.3), this.yatraWhiteMat);
      vTorso.position.y = 0.95;
      volGroup.add(vTorso);

      // Tricolor sash
      const sash = new THREE.Mesh(this.getBox(0.44, 0.14, 0.32), this.yatraOrangeMat);
      sash.position.set(0, 0.95, 0);
      sash.rotation.z = 0.35;
      volGroup.add(sash);

      const vHead = new THREE.Mesh(this.getCylinder(0.16, 0.16, 0.32, 8), this.cartoonSkinMat);
      vHead.position.y = 1.42;
      volGroup.add(vHead);

      station.add(volGroup);
    });

    group.add(station);
    return station;
  }

  /**
   * 3D Open-Top Campaign Support Van (Mahindra/Tata Tempo)
   * With roof-mounted loudspeakers, pulsing soundwaves, rotating wheels, and waving leader.
   */
  public buildCampaignSupportVan(
    group: THREE.Group,
    x: number,
    y: number,
    z: number,
    director: RahulComedyEventDirector,
    worldZ?: number
  ): THREE.Group {
    const vanGroup = new THREE.Group();
    vanGroup.name = 'rahul_campaign_van';
    vanGroup.position.set(x, y, z);

    // Deep Subterranean Foundation Plinth down to Y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(4.4, 5.5, 6.8), this.parliamentSandstoneMat);
    plinth.position.y = -2.45;
    vanGroup.add(plinth);

    // Automotive Van Chassis & Body (Cream & Saffron Indian commercial vehicle)
    const vanBody = new THREE.Mesh(this.getBox(2.6, 1.8, 5.6), this.yatraIvoryMat);
    vanBody.position.y = 1.35;
    vanGroup.add(vanBody);

    const vanCab = new THREE.Mesh(this.getBox(2.5, 1.4, 2.2), this.yatraIvoryMat);
    vanCab.position.set(0, 2.5, -1.5);
    vanGroup.add(vanCab);

    // Tinted windshield & side windows
    const windshield = new THREE.Mesh(this.getBox(2.3, 0.9, 0.1), this.mediaStudioGlassMat);
    windshield.position.set(0, 2.6, -2.62);
    vanGroup.add(windshield);

    // Front grille and bumper
    const bumper = new THREE.Mesh(this.getBox(2.7, 0.45, 0.4), this.darkSuitMat);
    bumper.position.set(0, 0.6, -2.85);
    vanGroup.add(bumper);

    const grille = new THREE.Mesh(this.getBox(1.8, 0.5, 0.1), this.goldMetalMat);
    grille.position.set(0, 1.1, -2.82);
    vanGroup.add(grille);

    // Headlights
    [-1.0, 1.0].forEach((hx) => {
      const headlight = new THREE.Mesh(this.getSphere(0.2, 8), this.yatraLitWindowMat);
      headlight.position.set(hx, 1.1, -2.82);
      vanGroup.add(headlight);
    });

    // Roof rack luggage rack
    const rack = new THREE.Mesh(this.getBox(2.4, 0.25, 3.2), this.goldMetalMat);
    rack.position.set(0, 3.3, 0.5);
    vanGroup.add(rack);

    // Spare wheel mounted on tailgate
    const spareWheel = new THREE.Mesh(this.getCylinder(0.48, 0.48, 0.28, 10), this.cartoonHairDarkMat);
    spareWheel.position.set(0, 1.4, 2.9);
    spareWheel.rotation.x = Math.PI / 2;
    vanGroup.add(spareWheel);

    // 4 Megaphone Loudspeakers on crossbars pointing in 4 directions
    const speakers: THREE.Object3D[] = [];
    const soundWaves: THREE.Object3D[] = [];
    const speakerAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];

    speakerAngles.forEach((ang) => {
      const spkGroup = new THREE.Group();
      spkGroup.position.set(Math.sin(ang) * 0.8, 3.8, Math.cos(ang) * 0.8);
      spkGroup.rotation.y = ang;

      const horn = new THREE.Mesh(this.getCylinder(0.26, 0.08, 0.65, 8), this.goldMetalMat);
      horn.rotation.x = Math.PI / 2;
      spkGroup.add(horn);

      // Cyan sound wave ring
      const wave = new THREE.Mesh(this.getTorus(0.4, 0.04, 6, 12), this.neonCyanMat);
      wave.position.z = 0.5;
      spkGroup.add(wave);

      vanGroup.add(spkGroup);
      speakers.push(spkGroup);
      soundWaves.push(wave);
    });

    // 4 Animated Rubber Wheels
    const wheels: THREE.Object3D[] = [];
    [[-1.3, -1.6], [1.3, -1.6], [-1.3, 1.6], [1.3, 1.6]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(this.getCylinder(0.45, 0.45, 0.35, 12), this.cartoonHairDarkMat);
      wheel.position.set(wx, 0.45, wz);
      wheel.rotation.z = Math.PI / 2;
      vanGroup.add(wheel);
      wheels.push(wheel);

      // Hubcap
      const hub = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.38, 8), this.goldMetalMat);
      hub.position.set(wx, 0.45, wz);
      hub.rotation.z = Math.PI / 2;
      vanGroup.add(hub);
    });

    // Open Rear Deck Platform with Animated Waving Leader
    const wavingArm = new THREE.Mesh(this.getBox(0.14, 0.65, 0.14), this.yatraWhiteMat);
    wavingArm.position.set(0.45, 3.2, 1.2);
    vanGroup.add(wavingArm);

    const leaderBody = new THREE.Mesh(this.getBox(0.5, 0.75, 0.35), this.yatraWhiteMat);
    leaderBody.position.set(0, 2.7, 1.2);
    vanGroup.add(leaderBody);

    const leaderHead = new THREE.Mesh(this.getCylinder(0.2, 0.2, 0.35, 8), this.cartoonSkinMat);
    leaderHead.position.set(0, 3.25, 1.2);
    vanGroup.add(leaderHead);

    director.registerYatraMarchProcession(vanGroup, [], vanGroup, wheels, speakers, soundWaves, wavingArm, undefined, worldZ);

    group.add(vanGroup);
    return vanGroup;
  }

  /**
   * Regional Marketplace Bazaar
   * Traditional Indian flower garland stall & tea dhaba with samovar and marigold ropes.
   */
  public buildMarketplaceBazaar(
    group: THREE.Group,
    x: number,
    y: number,
    z: number
  ): THREE.Group {
    const bazaar = new THREE.Group();
    bazaar.name = 'rahul_marketplace_bazaar';
    bazaar.position.set(x, y, z);

    // Deep Subterranean Foundation Plinth down to Y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(3.4, 5.5, 5.8), this.parliamentSandstoneMat);
    plinth.position.y = -2.45;
    bazaar.add(plinth);

    // Sandstone paved bazaar stall platform
    const platform = new THREE.Mesh(this.getBox(3.2, 0.25, 5.6), this.parliamentSandstoneMat);
    platform.position.y = 0.125;
    bazaar.add(platform);

    // 1. Flower Garland Stall (Marigold strings)
    const flowerStall = new THREE.Group();
    flowerStall.position.set(0, 0.25, -1.4);

    const fCounter = new THREE.Mesh(this.getBox(1.6, 0.85, 2.2), this.woodMat);
    fCounter.position.y = 0.425;
    flowerStall.add(fCounter);

    // Sloped marigold awning
    const fAwning = new THREE.Mesh(this.getBox(1.8, 0.1, 2.4), this.yatraMarigoldMat);
    fAwning.position.set(0, 2.6, 0);
    fAwning.rotation.x = 0.18;
    flowerStall.add(fAwning);

    // Bamboo awning posts
    [[-0.8, -1.0], [0.8, -1.0], [-0.8, 1.0], [0.8, 1.0]].forEach(([px, pz]) => {
      const p = new THREE.Mesh(this.getCylinder(0.03, 0.03, 2.4, 4), this.woodMat);
      p.position.set(px, 1.2, pz);
      flowerStall.add(p);
    });

    // Hanging ropes of bright orange & yellow marigolds (Genda Phool)
    for (let r = -0.7; r <= 0.7; r += 0.35) {
      const garland = new THREE.Mesh(this.getCylinder(0.08, 0.08, 1.2, 6), this.yatraMarigoldMat);
      garland.position.set(0.65, 1.6, r);
      flowerStall.add(garland);
    }
    bazaar.add(flowerStall);

    // 2. Roadside Chai Dhaba with Brass Samovar
    const chaiStall = new THREE.Group();
    chaiStall.position.set(0, 0.25, 1.4);

    const cCounter = new THREE.Mesh(this.getBox(1.6, 0.85, 2.2), this.parliamentSandstoneMat);
    cCounter.position.y = 0.425;
    chaiStall.add(cCounter);

    // Striped green awning
    const cAwning = new THREE.Mesh(this.getBox(1.8, 0.1, 2.4), this.yatraBannerGreenMat);
    cAwning.position.set(0, 2.6, 0);
    cAwning.rotation.x = -0.18;
    chaiStall.add(cAwning);

    // Giant brass chai kettle / samovar on counter
    const samovar = new THREE.Mesh(this.getCylinder(0.28, 0.35, 0.75, 10), this.goldMetalMat);
    samovar.position.set(0, 1.225, 0);
    chaiStall.add(samovar);

    const samovarChimney = new THREE.Mesh(this.getCylinder(0.08, 0.08, 0.35, 6), this.goldMetalMat);
    samovarChimney.position.set(0, 1.65, 0);
    chaiStall.add(samovarChimney);

    // Wire tray of cutting chai glasses
    const tray = new THREE.Mesh(this.getBox(0.45, 0.04, 0.7), this.silverMat);
    tray.position.set(0.45, 0.88, 0.5);
    chaiStall.add(tray);

    bazaar.add(chaiStall);

    group.add(bazaar);
    return bazaar;
  }

  /**
   * Circular Stone Chabutra wrapping around a massive lush Peepal/Neem Tree
   * With 3 village elder onlooker figures in traditional dhotis and kurtas.
   */
  public buildChabutraWithPeepal(
    group: THREE.Group,
    x: number,
    y: number,
    z: number
  ): THREE.Group {
    const chabutraGroup = new THREE.Group();
    chabutraGroup.name = 'rahul_chabutra_peepal';
    chabutraGroup.position.set(x, y, z);

    // Deep Subterranean Foundation Plinth down to Y = -5.2m
    const plinth = new THREE.Mesh(this.getBox(5.2, 5.5, 5.2), this.parliamentSandstoneMat);
    plinth.position.y = -2.45;
    chabutraGroup.add(plinth);

    // Circular stone sitting platform (Chabutra)
    const chabutra = new THREE.Mesh(this.getCylinder(2.4, 2.6, 0.75, 12), this.parliamentSandstoneMat);
    chabutra.position.y = 0.375;
    chabutraGroup.add(chabutra);

    // Sandstone coping rim
    const coping = new THREE.Mesh(this.getTorus(2.45, 0.12, 6, 16), this.yatraSandstonePlasterMat);
    coping.position.y = 0.75;
    coping.rotation.x = Math.PI / 2;
    chabutraGroup.add(coping);

    // Massive branching tree trunk
    const trunk = new THREE.Mesh(this.getCylinder(0.55, 0.85, 4.8, 8), this.yatraBarkBrownMat);
    trunk.position.y = 2.8;
    chabutraGroup.add(trunk);

    // Spreading canopy layers
    const tier1 = new THREE.Mesh(this.getCylinder(1.2, 2.9, 2.4, 8), this.yatraFoliageGreenMat);
    tier1.position.y = 5.2;
    chabutraGroup.add(tier1);

    const tier2 = new THREE.Mesh(this.getCylinder(0.8, 2.4, 2.0, 8), this.yatraFoliageGreenMat);
    tier2.position.y = 6.8;
    chabutraGroup.add(tier2);

    const crown = new THREE.Mesh(this.getSphere(1.6, 8), this.yatraFoliageGreenMat);
    crown.position.y = 8.2;
    chabutraGroup.add(crown);

    // 3 Village Elders seated on the stone chabutra
    const elderAngles = [-0.8, 0, 0.8];
    elderAngles.forEach((ang) => {
      const elder = new THREE.Group();
      elder.position.set(Math.sin(ang) * 1.8, 0.75, Math.cos(ang) * 1.8);
      elder.rotation.y = ang + Math.PI; // Looking outward toward the railway tracks

      const eDhoti = new THREE.Mesh(this.getBox(0.42, 0.45, 0.42), this.yatraWhiteMat);
      eDhoti.position.y = 0.225;
      elder.add(eDhoti);

      const eKurta = new THREE.Mesh(this.getBox(0.46, 0.58, 0.35), this.yatraSandstonePlasterMat);
      eKurta.position.y = 0.72;
      elder.add(eKurta);

      const eHead = new THREE.Mesh(this.getCylinder(0.16, 0.16, 0.32, 8), this.cartoonSkinMat);
      eHead.position.y = 1.15;
      elder.add(eHead);

      const eTurban = new THREE.Mesh(this.getCylinder(0.24, 0.2, 0.22, 8), this.yatraMarigoldMat);
      eTurban.position.y = 1.34;
      elder.add(eTurban);

      chabutraGroup.add(elder);
    });

    group.add(chabutraGroup);
    return chabutraGroup;
  }
}
