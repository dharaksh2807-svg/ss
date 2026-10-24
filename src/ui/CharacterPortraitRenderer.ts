import * as THREE from 'three';
import { CharacterId, getCharacterById, getOutfitById } from '../characters/CharacterCatalog';
import { CharacterModel } from '../player/CharacterModel';
import { GlbCharacterLoader, LoadedGlbCharacter } from '../characters/GlbCharacterLoader';
import { EventBus, EVENTS } from '../core/EventBus';
import { ProgressionManager } from '../progression/ProgressionManager';

export type PortraitReaction = 
  | 'NORMAL'
  | 'JUMP'
  | 'SLIDE'
  | 'NEAR_MISS'
  | 'POWERUP'
  | 'SHIELD_HIT'
  | 'JETPACK'
  | 'STUMBLE'
  | 'CRASH'
  | 'VICTORY';

export class CharacterPortraitRenderer {
  private static instance: CharacterPortraitRenderer | null = null;

  private canvas: HTMLCanvasElement | null = null;
  private containerEl: HTMLElement | null = null;
  private nameEl: HTMLElement | null = null;
  private moodEl: HTMLElement | null = null;
  private ringEl: HTMLElement | null = null;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private rimLight: THREE.DirectionalLight | null = null;

  // Active Model
  private charModel: CharacterModel | null = null;
  private glbInstance: LoadedGlbCharacter | null = null;
  private glbGroup: THREE.Group | null = null;
  private currentCharacterId: CharacterId = 'char_jax';
  private currentOutfitId: string = 'jax_classic';

  // Animation & Throttling
  private isEnabled: boolean = true;
  private animTime: number = 0;
  private frameAccumulator: number = 0;
  private readonly targetFrameTime: number = 1.0 / 30.0; // 30 FPS throttle (super-smooth & ultra-low CPU/GPU impact)

  // Reaction State
  private currentReaction: PortraitReaction = 'NORMAL';
  private reactionTimer: number = 0;
  private activeReactionLabel: string = 'READY';

  // Procedural Head Transforms
  private currentHeadRot = new THREE.Euler();
  private targetHeadRot = new THREE.Euler();

  constructor() {
    // Check user preference
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('metro_portrait_enabled');
      if (saved === 'false') {
        this.isEnabled = false;
      }
    }

    this.initDOM();
    this.initThree();
    this.setupEventListeners();
    this.syncFromProgression();
  }

  public static getInstance(): CharacterPortraitRenderer {
    if (!CharacterPortraitRenderer.instance) {
      CharacterPortraitRenderer.instance = new CharacterPortraitRenderer();
    }
    return CharacterPortraitRenderer.instance;
  }

  private initDOM(): void {
    if (typeof document === 'undefined') return;

    this.containerEl = document.getElementById('hud-character-portrait');
    this.canvas = document.getElementById('hud-portrait-canvas') as HTMLCanvasElement;
    this.nameEl = document.getElementById('hud-portrait-name');
    this.moodEl = document.getElementById('hud-portrait-mood');
    this.ringEl = document.getElementById('hud-portrait-ring');

    if (this.containerEl) {
      this.containerEl.classList.toggle('portrait-disabled', !this.isEnabled);
    }
  }

  private initThree(): void {
    if (!this.canvas) return;

    this.scene = new THREE.Scene();

    // Perspective Camera focused strictly on head and shoulders (3/4 bust framing)
    this.camera = new THREE.PerspectiveCamera(36, 1.0, 0.1, 10);
    // Camera is positioned slightly to the right, looking at face center (Y = 1.54m)
    this.camera.position.set(0.16, 1.56, 0.64);
    this.camera.lookAt(0, 1.53, 0);

    // Dedicated mini WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });
    this.renderer.setSize(128, 128, false);
    this.renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // Portrait Studio Three-Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(1.4, 2.4, 1.8);
    this.scene.add(keyLight);

    this.rimLight = new THREE.DirectionalLight(0x00e5ff, 1.4);
    this.rimLight.position.set(-1.8, 1.8, -1.0);
    this.scene.add(this.rimLight);

    const chestFillLight = new THREE.DirectionalLight(0xffeedd, 0.55);
    chestFillLight.position.set(0.6, 0.8, 1.2);
    this.scene.add(chestFillLight);
  }

  private setupEventListeners(): void {
    const bus = EventBus.getInstance();

    bus.on('CHARACTER_EQUIPPED', (data: any) => {
      const charId = typeof data === 'string' ? data : data?.charId;
      const outfitId = typeof data === 'object' ? data?.outfitId : undefined;
      if (charId) {
        this.setCharacter(charId as CharacterId, outfitId);
      }
    });

    bus.on('OUTFIT_EQUIPPED', (data: any) => {
      const charId = data?.charId;
      const outfitId = data?.outfitId;
      if (charId) {
        this.setCharacter(charId as CharacterId, outfitId);
      }
    });

    bus.on('PORTRAIT_TOGGLED', (enabled: boolean) => {
      this.setEnabled(enabled);
    });

    // Gameplay Reaction Event Bindings
    bus.on(EVENTS.JUMP, () => this.triggerReaction('JUMP', 0.65, 'JUMP! ⚡'));
    bus.on(EVENTS.SLIDE, () => this.triggerReaction('SLIDE', 0.65, 'SLIDE! 👟'));
    bus.on('NEAR_MISS', () => this.triggerReaction('NEAR_MISS', 0.9, 'DODGED! 🔥'));
    bus.on(EVENTS.POWERUP_ACTIVATED, (type: string) => {
      this.triggerReaction('POWERUP', 1.8, `${type}! ⚡`);
    });
    bus.on(EVENTS.HOVERBOARD_BROKEN, () => this.triggerReaction('SHIELD_HIT', 1.2, 'SHIELD HIT! 💥'));
    bus.on(EVENTS.STUMBLE, () => this.triggerReaction('STUMBLE', 1.0, 'STUMBLE! ⚠️'));
    bus.on(EVENTS.CRASH, () => this.triggerReaction('CRASH', 3.0, 'DEFEAT! 💥'));
    bus.on(EVENTS.JETPACK_TAKEOFF, () => this.triggerReaction('JETPACK', 2.0, 'CRUISING! 🚀'));
    bus.on(EVENTS.JETPACK_CRUISE, () => this.triggerReaction('JETPACK', 2.0, 'CRUISING! 🚀'));
    bus.on(EVENTS.MISSION_COMPLETED, () => this.triggerReaction('VICTORY', 2.2, 'SUCCESS! 🎯'));
    bus.on('NEW_RECORD', () => this.triggerReaction('VICTORY', 2.5, 'NEW BEST! 🏆'));
  }

  public isPortraitEnabled(): boolean {
    return this.isEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('metro_portrait_enabled', enabled ? 'true' : 'false');
    }
    if (this.containerEl) {
      this.containerEl.classList.toggle('portrait-disabled', !enabled);
    }
    if (enabled) {
      this.syncFromProgression();
    }
  }

  public syncFromProgression(): void {
    const prog = ProgressionManager.getInstance();
    const charId = (prog.getSelectedCharacter() || 'char_jax') as CharacterId;
    const outfitId = prog.getSelectedOutfit(charId) || 'jax_classic';
    this.setCharacter(charId, outfitId);
  }

  public setCharacter(charId: CharacterId, outfitId?: string): void {
    this.currentCharacterId = charId;
    const charDef = getCharacterById(charId);
    this.currentOutfitId = outfitId || (charDef ? charDef.defaultOutfitId : 'jax_classic');

    if (this.nameEl && charDef) {
      this.nameEl.textContent = charDef.name.toUpperCase();
    }

    const outfit = getOutfitById(charId, this.currentOutfitId);
    if (this.rimLight && outfit) {
      this.rimLight.color.setHex(outfit.colors.accent || outfit.colors.primary || 0x00e5ff);
    }

    this.rebuildPortraitModel();
  }

  private rebuildPortraitModel(): void {
    if (!this.scene) return;

    // Clean up previous model
    if (this.charModel) {
      this.scene.remove(this.charModel.mesh);
      this.charModel = null;
    }
    if (this.glbGroup) {
      this.scene.remove(this.glbGroup);
      this.glbGroup = null;
    }
    if (this.glbInstance) {
      this.glbInstance.mixer.stopAllAction();
      this.glbInstance = null;
    }

    const charDef = getCharacterById(this.currentCharacterId);

    // If GLB character (e.g. Narendra Modi), instantiate GLB into portrait scene
    if (charDef?.isGlb && charDef.glbPath && typeof window !== 'undefined') {
      this.glbGroup = new THREE.Group();
      this.scene.add(this.glbGroup);

      GlbCharacterLoader.getInstance()
        .instantiate(charDef.glbPath)
        .then((loaded) => {
          if (this.glbGroup && this.currentCharacterId === charDef.id) {
            this.glbInstance = loaded;
            this.glbGroup.add(loaded.scene);
            // Face camera directly in portrait studio
            loaded.scene.rotation.y = Math.PI - 0.18; // 3/4 subtle angle
            // Play idle/portrait clip
            const action = loaded.actions.get('selection_idle') || loaded.actions.get('idle') || loaded.actions.get('run');
            if (action) {
              action.play();
            }
          }
        })
        .catch((err) => {
          console.warn('Portrait GLB load error, fallback to procedural bust:', err);
          this.buildProceduralModel();
        });
    } else {
      this.buildProceduralModel();
    }
  }

  private buildProceduralModel(): void {
    if (!this.scene) return;
    this.charModel = new CharacterModel(this.currentCharacterId, this.currentOutfitId);
    // Face towards portrait camera at subtle 3/4 angle
    this.charModel.mesh.rotation.y = Math.PI - 0.22;
    this.charModel.setHoverboardVisible(false);
    this.charModel.setJetpackVisible(false);
    this.charModel.setShieldVisible(false);
    this.scene.add(this.charModel.mesh);
  }

  public triggerReaction(reaction: PortraitReaction, durationSec: number = 1.0, label?: string): void {
    this.currentReaction = reaction;
    this.reactionTimer = durationSec;
    if (label) {
      this.activeReactionLabel = label;
    }

    // Trigger visual pulse on portrait ring
    if (this.ringEl) {
      this.ringEl.className = 'hud-portrait-ring';
      void this.ringEl.offsetWidth; // Force reflow
      if (reaction === 'NEAR_MISS') {
        this.ringEl.classList.add('pulse-amber');
      } else if (reaction === 'POWERUP' || reaction === 'VICTORY') {
        this.ringEl.classList.add('pulse-gold');
      } else if (reaction === 'SHIELD_HIT' || reaction === 'STUMBLE' || reaction === 'CRASH') {
        this.ringEl.classList.add('pulse-red');
      } else if (reaction === 'JETPACK') {
        this.ringEl.classList.add('pulse-cyan');
      }
    }
  }

  public update(dt: number, isSliding: boolean = false, isJumping: boolean = false, speed: number = 18.0): void {
    if (!this.isEnabled || !this.renderer || !this.scene || !this.camera) return;

    this.animTime += dt;
    this.frameAccumulator += dt;

    // Reaction timer countdown
    if (this.reactionTimer > 0) {
      this.reactionTimer -= dt;
      if (this.reactionTimer <= 0) {
        this.currentReaction = isSliding ? 'SLIDE' : (isJumping ? 'JUMP' : 'NORMAL');
        this.activeReactionLabel = isSliding ? 'SLIDING' : (isJumping ? 'AIRBORNE' : 'RUNNING');
      }
    } else {
      if (isSliding) {
        this.currentReaction = 'SLIDE';
        this.activeReactionLabel = 'SLIDING';
      } else if (isJumping) {
        this.currentReaction = 'JUMP';
        this.activeReactionLabel = 'AIRBORNE';
      } else {
        this.currentReaction = 'NORMAL';
        this.activeReactionLabel = 'RUNNING';
      }
    }

    if (this.moodEl) {
      this.moodEl.textContent = this.activeReactionLabel;
    }

    // Throttle rendering to 30 FPS to preserve mobile battery & GPU throughput
    if (this.frameAccumulator < this.targetFrameTime) {
      return;
    }
    const renderDt = this.frameAccumulator;
    this.frameAccumulator = 0;

    // Compute target head transforms based on reaction
    this.computeHeadPose(renderDt, speed);

    // Apply pose to model
    if (this.glbInstance) {
      this.glbInstance.mixer.update(renderDt);
      // Subtle dynamic procedural head bobbing / tilt on the GLB root group
      this.glbGroup?.position.set(0, Math.sin(this.animTime * 8.0) * 0.012, 0);
      if (this.glbGroup) {
        this.glbGroup.rotation.y = (Math.PI - 0.18) + this.currentHeadRot.y * 0.5;
        this.glbGroup.rotation.x = this.currentHeadRot.x * 0.6;
      }
    } else if (this.charModel) {
      this.charModel.animateTurntableIdle(renderDt * 0.5);
      this.charModel.mesh.position.set(0, Math.sin(this.animTime * 8.0) * 0.015, 0);
      this.charModel.mesh.rotation.y = (Math.PI - 0.22) + this.currentHeadRot.y * 0.5;
      this.charModel.mesh.rotation.x = this.currentHeadRot.x * 0.6;
    }

    // Render 128x128 portrait
    this.renderer.render(this.scene, this.camera);
  }

  private computeHeadPose(dt: number, speed: number): void {
    const t = this.animTime;
    const strideCadence = Math.min(24.0, 10.0 + (speed / 38.0) * 12.0);

    switch (this.currentReaction) {
      case 'NORMAL':
        this.targetHeadRot.set(
          Math.sin(t * strideCadence) * 0.03,
          Math.cos(t * strideCadence * 0.5) * 0.035,
          Math.sin(t * strideCadence * 0.5) * 0.02
        );
        break;

      case 'JUMP':
        this.targetHeadRot.set(-0.16, 0, 0);
        break;

      case 'SLIDE':
        this.targetHeadRot.set(0.20, 0, 0);
        break;

      case 'NEAR_MISS':
        this.targetHeadRot.set(-0.06, 0.22, 0.08);
        break;

      case 'POWERUP':
        this.targetHeadRot.set(-0.10, Math.sin(t * 6.0) * 0.08, 0);
        break;

      case 'SHIELD_HIT':
        this.targetHeadRot.set(0.14, -0.22, -0.06);
        break;

      case 'JETPACK':
        this.targetHeadRot.set(-0.18, Math.sin(t * 8.0) * 0.04, Math.sin(t * 5.0) * 0.03);
        break;

      case 'STUMBLE':
        this.targetHeadRot.set(0.16, 0.12, -0.15);
        break;

      case 'CRASH':
        this.targetHeadRot.set(0.26, 0.08, 0.04);
        break;

      case 'VICTORY':
        this.targetHeadRot.set(-0.12, Math.sin(t * 4.0) * 0.10, 0);
        break;
    }

    // Smooth exponential blend
    const blendRate = 12.0;
    const factor = 1.0 - Math.exp(-blendRate * dt);
    this.currentHeadRot.x += (this.targetHeadRot.x - this.currentHeadRot.x) * factor;
    this.currentHeadRot.y += (this.targetHeadRot.y - this.currentHeadRot.y) * factor;
    this.currentHeadRot.z += (this.targetHeadRot.z - this.currentHeadRot.z) * factor;
  }

  public dispose(): void {
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    if (this.scene) {
      this.scene.clear();
      this.scene = null;
    }
    CharacterPortraitRenderer.instance = null;
  }
}
