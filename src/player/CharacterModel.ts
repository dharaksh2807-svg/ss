import * as THREE from 'three';
import { CharacterId, getCharacterById } from '../characters/CharacterCatalog';
import { CharacterMeshBuilder, BuiltCharacterHierarchy } from '../characters/CharacterMeshBuilder';
import { GlbCharacterLoader, LoadedGlbCharacter } from '../characters/GlbCharacterLoader';
import { HoverboardId } from '../hoverboard/HoverboardCatalog';
import { HoverboardMeshBuilder, BuiltHoverboard } from '../hoverboard/HoverboardMeshBuilder';
import { CONSTANTS } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';

export type RunningStyle = 'CLASSIC' | 'REVERSE';

export type JumpPhase = 'NONE' | 'TAKEOFF' | 'ASCENDING' | 'APEX' | 'DESCENDING' | 'FAST_DROP' | 'LANDING';

export type PresentationPose = 'DEFAULT' | 'IDLE' | 'RUN' | 'JUMP' | 'VICTORY' | 'HOVERBOARD';

export type LocomotionState = 
  | 'IDLE'
  | 'RUN'
  | 'JUMP_TAKEOFF'
  | 'JUMP_ASCEND'
  | 'JUMP_APEX'
  | 'JUMP_DESCEND'
  | 'JUMP_LAND'
  | 'FAST_DROP'
  | 'SLIDE_ENTRY'
  | 'SLIDE_HOLD'
  | 'SLIDE_RECOVER'
  | 'CLIMB'
  | 'TRAIN_ROOF_RUN'
  | 'JETPACK'
  | 'HOVERBOARD'
  | 'VICTORY'
  | 'STUMBLE'
  | 'CRASH';

export class CharacterModel {
  public mesh: THREE.Group;

  // Active identity
  private currentCharacterId: CharacterId;
  private currentOutfitId: string;

  // Root articulation groups
  private hierarchy!: BuiltCharacterHierarchy;
  private rootGroup!: THREE.Group;
  private hipsGroup!: THREE.Group;
  private spineGroup!: THREE.Group;
  private headGroup!: THREE.Group;
  private leftArmGroup!: THREE.Group;
  private leftForearmGroup!: THREE.Group;
  private rightArmGroup!: THREE.Group;
  private rightForearmGroup!: THREE.Group;
  private leftLegGroup!: THREE.Group;
  private leftCalfGroup!: THREE.Group;
  private rightLegGroup!: THREE.Group;
  private rightCalfGroup!: THREE.Group;

  // High-top sneakers / boots
  private leftSneaker!: THREE.Group;
  private rightSneaker!: THREE.Group;

  // Gear & Accessories
  private hoverboardGroup!: THREE.Group;
  private currentBoardId: HoverboardId = 'board_urban_glide';
  private activeBoardBuilt: BuiltHoverboard | null = null;
  private backpackGroup!: THREE.Group;
  private shadowMesh!: THREE.Mesh;

  // Power-up visual attachments
  private jetpackGroup!: THREE.Group;
  private jetpackFire1: THREE.Mesh | null = null;
  private jetpackFire2: THREE.Mesh | null = null;
  private shieldGroup!: THREE.Group;
  private shieldMesh: THREE.Mesh | null = null;
  private magnetAuraGroup!: THREE.Group;
  private isJetpack: boolean = false;
  private isShield: boolean = false;
  private isMagnet: boolean = false;
  private isInvulnerable: boolean = false;
  private isHoverboard: boolean = false;

  // Animation clocks & state
  private animTime: number = 0;
  private isSuperSneakers: boolean = false;
  private presentationPose: PresentationPose = 'DEFAULT';

  // Base articulation rest offsets
  private baseHipsY: number = 0.95;
  private baseHeadY: number = 0.62;

  // Interpolated bone transforms (current active pose)
  private rootPos = new THREE.Vector3();
  private rootRot = new THREE.Euler();
  private hipsPos = new THREE.Vector3();
  private hipsRot = new THREE.Euler();
  private spineRot = new THREE.Euler();
  private headRot = new THREE.Euler();
  private leftArmRot = new THREE.Euler();
  private leftForearmRot = new THREE.Euler();
  private rightArmRot = new THREE.Euler();
  private rightForearmRot = new THREE.Euler();
  private leftLegRot = new THREE.Euler();
  private leftCalfRot = new THREE.Euler();
  private rightLegRot = new THREE.Euler();
  private rightCalfRot = new THREE.Euler();
  private leftSneakerRot = new THREE.Euler();
  private rightSneakerRot = new THREE.Euler();

  // Target bone transforms (calculated by current active state)
  private targetRootPos = new THREE.Vector3();
  private targetRootRot = new THREE.Euler();
  private targetHipsPos = new THREE.Vector3();
  private targetHipsRot = new THREE.Euler();
  private targetSpineRot = new THREE.Euler();
  private targetHeadRot = new THREE.Euler();
  private targetLeftArmRot = new THREE.Euler();
  private targetLeftForearmRot = new THREE.Euler();
  private targetRightArmRot = new THREE.Euler();
  private targetRightForearmRot = new THREE.Euler();
  private targetLeftLegRot = new THREE.Euler();
  private targetLeftCalfRot = new THREE.Euler();
  private targetRightLegRot = new THREE.Euler();
  private targetRightCalfRot = new THREE.Euler();
  private targetLeftSneakerRot = new THREE.Euler();
  private targetRightSneakerRot = new THREE.Euler();

  // Active state machine tracker
  private activeLocomotionState: LocomotionState = 'RUN';

  // Running style preference & visual orientation
  private runningStyle: RunningStyle = 'CLASSIC';
  private visualFacingAngle: number = 0;

  // GLB Character Support
  private glbInstance: LoadedGlbCharacter | null = null;
  private glbContainer: THREE.Group | null = null;
  private currentGlbClip: string = '';

  public static getRunningStyleForCharacter(characterId: string): RunningStyle {
    if (typeof localStorage !== 'undefined') {
      const perChar = localStorage.getItem(`metro_running_style_${characterId}`) as RunningStyle | null;
      if (perChar === 'REVERSE' || perChar === 'CLASSIC') {
        return perChar;
      }
      const globalStyle = localStorage.getItem('metro_running_style') as RunningStyle | null;
      if (globalStyle === 'REVERSE' || globalStyle === 'CLASSIC') {
        return globalStyle;
      }
    }
    return 'CLASSIC';
  }

  public static setRunningStyleForCharacter(characterId: string, style: RunningStyle): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`metro_running_style_${characterId}`, style);
    }
  }

  constructor(characterId: CharacterId = 'char_jax', outfitId?: string) {
    this.mesh = new THREE.Group();
    this.currentCharacterId = characterId;
    this.currentOutfitId = outfitId || 'jax_classic';

    if (typeof localStorage !== 'undefined') {
      const resolvedStyle = CharacterModel.getRunningStyleForCharacter(this.currentCharacterId);
      this.runningStyle = resolvedStyle;
      if (resolvedStyle === 'REVERSE') {
        this.visualFacingAngle = Math.PI;
      }
    }

    EventBus.getInstance().on(EVENTS.RUNNING_STYLE_CHANGED, (style: RunningStyle) => {
      this.setRunningStyle(style);
    });

    this.rebuildModel(this.currentCharacterId, this.currentOutfitId);
  }

  public getRunningStyle(): RunningStyle {
    return this.runningStyle;
  }

  public setRunningStyle(style: RunningStyle): void {
    this.runningStyle = style === 'REVERSE' ? 'REVERSE' : 'CLASSIC';
  }

  public getVisualFacingAngle(): number {
    return this.visualFacingAngle;
  }

  public setPresentationPose(pose: PresentationPose): void {
    this.presentationPose = pose;
    if (pose === 'HOVERBOARD' && this.hoverboardGroup) {
      this.hoverboardGroup.visible = true;
    }
  }

  public getPresentationPose(): PresentationPose {
    return this.presentationPose;
  }

  public clearPresentationPose(): void {
    this.presentationPose = 'DEFAULT';
    if (this.hoverboardGroup) {
      this.hoverboardGroup.visible = this.isHoverboard;
    }
  }

  /**
   * Determine if the current state permits facing toward the camera in reverse run style.
   * Actions like sliding under hurdles, jetpack rocket flight, or impact tumble revert to forward facing.
   */
  public isReverseFacingAllowed(state: LocomotionState): boolean {
    switch (state) {
      case 'SLIDE_ENTRY':
      case 'SLIDE_HOLD':
      case 'SLIDE_RECOVER':
      case 'JETPACK':
      case 'CRASH':
        return false;
      default:
        return true;
    }
  }

  /**
   * Rebuild or swap character model cleanly with full disposal of prior meshes
   */
  public applyCharacter(characterId: CharacterId, outfitId?: string): void {
    const nextOutfit = outfitId || (characterId === this.currentCharacterId ? this.currentOutfitId : undefined);
    this.currentCharacterId = characterId;
    if (nextOutfit) {
      this.currentOutfitId = nextOutfit;
    }

    if (typeof localStorage !== 'undefined') {
      const resolvedStyle = CharacterModel.getRunningStyleForCharacter(this.currentCharacterId);
      this.runningStyle = resolvedStyle;
      if (resolvedStyle === 'REVERSE') {
        this.visualFacingAngle = Math.PI;
      } else {
        this.visualFacingAngle = 0;
      }
    }

    // Preserve active powerup states
    const prevHoverboard = this.isHoverboard;
    const prevSuperSneakers = this.isSuperSneakers;
    const prevJetpack = this.isJetpack;
    const prevShield = this.isShield;
    const prevMagnet = this.isMagnet;
    const prevInvulnerable = this.isInvulnerable;

    // Dispose old hierarchy meshes & materials
    this.disposeHierarchy();

    // Rebuild
    this.rebuildModel(this.currentCharacterId, this.currentOutfitId);

    // Reapply powerup states
    this.setHoverboardVisible(prevHoverboard);
    this.setSuperSneakersActive(prevSuperSneakers);
    this.setJetpackVisible(prevJetpack);
    this.setShieldVisible(prevShield);
    this.setMagnetVisible(prevMagnet);
    this.setInvulnerable(prevInvulnerable);
  }

  private rebuildModel(characterId: CharacterId, outfitId?: string): void {
    // Clear mesh children
    while (this.mesh.children.length > 0) {
      this.mesh.remove(this.mesh.children[0]);
    }

    this.hierarchy = CharacterMeshBuilder.build(characterId, outfitId);

    this.rootGroup = this.hierarchy.rootGroup;
    this.hipsGroup = this.hierarchy.hipsGroup;
    this.spineGroup = this.hierarchy.spineGroup;
    this.headGroup = this.hierarchy.headGroup;
    this.leftArmGroup = this.hierarchy.leftArmGroup;
    this.leftForearmGroup = this.hierarchy.leftForearmGroup;
    this.rightArmGroup = this.hierarchy.rightArmGroup;
    this.rightForearmGroup = this.hierarchy.rightForearmGroup;
    this.leftLegGroup = this.hierarchy.leftLegGroup;
    this.leftCalfGroup = this.hierarchy.leftCalfGroup;
    this.rightLegGroup = this.hierarchy.rightLegGroup;
    this.rightCalfGroup = this.hierarchy.rightCalfGroup;
    this.leftSneaker = this.hierarchy.leftSneaker;
    this.rightSneaker = this.hierarchy.rightSneaker;
    this.backpackGroup = this.hierarchy.backpackGroup;
    this.hoverboardGroup = this.hierarchy.hoverboardGroup;
    this.jetpackGroup = this.hierarchy.jetpackGroup;
    this.jetpackFire1 = this.hierarchy.jetpackFire1;
    this.jetpackFire2 = this.hierarchy.jetpackFire2;
    this.shieldGroup = this.hierarchy.shieldGroup;
    this.shieldMesh = this.hierarchy.shieldMesh;
    this.magnetAuraGroup = this.hierarchy.magnetAuraGroup;
    this.shadowMesh = this.hierarchy.shadowMesh;

    this.baseHipsY = this.hipsGroup.position.y || 0.95;
    this.baseHeadY = this.headGroup.position.y || 0.62;

    this.resetPoseBuffers();

    this.mesh.add(this.rootGroup);

    // If character is GLB-backed (e.g. Narendra Modi), asynchronously instantiate GLB
    const charDef = getCharacterById(characterId);
    if (charDef?.isGlb && charDef.glbPath && typeof window !== 'undefined') {
      this.glbContainer = new THREE.Group();
      this.rootGroup.add(this.glbContainer);

      GlbCharacterLoader.getInstance()
        .instantiate(charDef.glbPath)
        .then((loaded) => {
          if (this.currentCharacterId === characterId && this.glbContainer) {
            this.glbInstance = loaded;
            this.glbContainer.add(loaded.scene);
            // Hide procedural body mesh hierarchy so the authentic 3D GLB model is visible
            this.hipsGroup.visible = false;
            // Start default run clip
            this.playGlbClip('run', true);
          }
        })
        .catch((err) => {
          console.warn('Could not load GLB character model, falling back to procedural rig:', err);
          this.hipsGroup.visible = true;
        });
    }

    // Mount initial hoverboard model
    this.setHoverboardModel(this.currentBoardId);
  }

  private resetPoseBuffers(): void {
    this.rootPos.set(0, 0, 0);
    this.rootRot.set(0, 0, 0);
    this.hipsPos.set(0, this.baseHipsY, 0);
    this.hipsRot.set(0, 0, 0);
    this.spineRot.set(0, 0, 0);
    this.headRot.set(0, 0, 0);
    this.leftArmRot.set(0, 0, 0);
    this.leftForearmRot.set(0, 0, 0);
    this.rightArmRot.set(0, 0, 0);
    this.rightForearmRot.set(0, 0, 0);
    this.leftLegRot.set(0, 0, 0);
    this.leftCalfRot.set(0, 0, 0);
    this.rightLegRot.set(0, 0, 0);
    this.rightCalfRot.set(0, 0, 0);
    this.leftSneakerRot.set(0, 0, 0);
    this.rightSneakerRot.set(0, 0, 0);

    this.targetRootPos.copy(this.rootPos);
    this.targetRootRot.copy(this.rootRot);
    this.targetHipsPos.copy(this.hipsPos);
    this.targetHipsRot.copy(this.hipsRot);
    this.targetSpineRot.copy(this.spineRot);
    this.targetHeadRot.copy(this.headRot);
    this.targetLeftArmRot.copy(this.leftArmRot);
    this.targetLeftForearmRot.copy(this.leftForearmRot);
    this.targetRightArmRot.copy(this.rightArmRot);
    this.targetRightForearmRot.copy(this.rightForearmRot);
    this.targetLeftLegRot.copy(this.leftLegRot);
    this.targetLeftCalfRot.copy(this.leftCalfRot);
    this.targetRightLegRot.copy(this.rightLegRot);
    this.targetRightCalfRot.copy(this.rightCalfRot);
    this.targetLeftSneakerRot.copy(this.leftSneakerRot);
    this.targetRightSneakerRot.copy(this.rightSneakerRot);
  }

  private disposeHierarchy(): void {
    if (!this.rootGroup) return;

    if (this.glbInstance) {
      this.glbInstance.mixer.stopAllAction();
      this.glbInstance = null;
    }
    if (this.glbContainer) {
      while (this.glbContainer.children.length > 0) {
        this.glbContainer.remove(this.glbContainer.children[0]);
      }
      this.glbContainer = null;
    }
    this.currentGlbClip = '';

    this.rootGroup.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });
  }

  public getCharacterId(): CharacterId {
    return this.currentCharacterId;
  }

  public getOutfitId(): string {
    return this.currentOutfitId;
  }

  public getActiveLocomotionState(): LocomotionState {
    return this.activeLocomotionState;
  }

  /**
   * Compatibility bridge for Player.ts update call
   */
  public updateAnimation(
    state: string,
    speed: number,
    bankingAngle: number,
    groundY: number,
    dt: number,
    jumpPhase: JumpPhase = 'NONE',
    jumpProgress: number = 0,
    slideProgress: number = 0,
    landingProgress: number = 0,
    isFastDropLand: boolean = false
  ): void {
    // Map high-level gameplay state into fine-grained animation state
    let locState: LocomotionState = 'RUN';

    if (state === 'CRASH') {
      locState = 'CRASH';
    } else if (state === 'JETPACK') {
      locState = 'JETPACK';
    } else if (state === 'SLIDE') {
      // Slide takes priority to guarantee character crouches/slides even on hoverboard
      if (slideProgress < 0.20) {
        locState = 'SLIDE_ENTRY';
      } else if (slideProgress < 0.75) {
        locState = 'SLIDE_HOLD';
      } else {
        locState = 'SLIDE_RECOVER';
      }
    } else if (state === 'JUMP' || state === 'FALLING' || state === 'FALLING_FROM_TRAIN') {
      if (jumpPhase === 'FAST_DROP') {
        locState = 'FAST_DROP';
      } else if (jumpPhase === 'TAKEOFF') {
        locState = 'JUMP_TAKEOFF';
      } else if (jumpPhase === 'ASCENDING') {
        locState = 'JUMP_ASCEND';
      } else if (jumpPhase === 'APEX') {
        locState = 'JUMP_APEX';
      } else {
        locState = 'JUMP_DESCEND';
      }
    } else if (jumpPhase === 'LANDING' || landingProgress > 0) {
      locState = 'JUMP_LAND';
    } else if (this.isHoverboard) {
      locState = 'HOVERBOARD';
    } else if (state === 'IDLE') {
      locState = 'IDLE';
    } else if (state === 'ON_TRAIN') {
      locState = 'TRAIN_ROOF_RUN';
    } else if (state === 'CLIMBING') {
      locState = 'CLIMB';
    } else {
      locState = 'RUN';
    }

    // Presentation pose override for Photo Mode
    if (this.presentationPose !== 'DEFAULT') {
      switch (this.presentationPose) {
        case 'IDLE':
          locState = 'IDLE';
          break;
        case 'RUN':
          locState = 'RUN';
          break;
        case 'JUMP':
          locState = 'JUMP_APEX';
          break;
        case 'HOVERBOARD':
          locState = 'HOVERBOARD';
          break;
        case 'VICTORY':
          locState = 'VICTORY';
          break;
      }
    }

    this.activeLocomotionState = locState;

    this.updateLocomotion(
      dt,
      locState,
      speed,
      this.isHoverboard,
      this.isSuperSneakers,
      bankingAngle,
      jumpProgress,
      slideProgress,
      landingProgress,
      isFastDropLand
    );
  }

  /**
   * Primary Procedural Animation & Articulation Update
   */
  public update(
    dt: number,
    state: 'RUNNING' | 'JUMPING' | 'SLIDING' | 'JETPACK' | 'STUMBLING' | 'DEAD' | 'IDLE',
    hasHoverboard: boolean,
    hasSneakers: boolean,
    bankAngle: number = 0,
    jumpProgress: number = 0,
    slideProgress: number = 0
  ): void {
    let locState: LocomotionState = 'RUN';
    if (state === 'DEAD') locState = 'CRASH';
    else if (state === 'JETPACK') locState = 'JETPACK';
    else if (hasHoverboard) locState = 'HOVERBOARD';
    else if (state === 'IDLE') locState = 'IDLE';
    else if (state === 'STUMBLING') locState = 'STUMBLE';
    else if (state === 'SLIDING') {
      locState = slideProgress < 0.20 ? 'SLIDE_ENTRY' : (slideProgress < 0.75 ? 'SLIDE_HOLD' : 'SLIDE_RECOVER');
    } else if (state === 'JUMPING') {
      if (jumpProgress < 0.15) locState = 'JUMP_TAKEOFF';
      else if (jumpProgress < 0.45) locState = 'JUMP_ASCEND';
      else if (jumpProgress < 0.55) locState = 'JUMP_APEX';
      else locState = 'JUMP_DESCEND';
    }

    if (this.presentationPose !== 'DEFAULT') {
      switch (this.presentationPose) {
        case 'IDLE': locState = 'IDLE'; break;
        case 'RUN': locState = 'RUN'; break;
        case 'JUMP': locState = 'JUMP_APEX'; break;
        case 'HOVERBOARD': locState = 'HOVERBOARD'; break;
        case 'VICTORY': locState = 'VICTORY'; break;
      }
    }

    this.activeLocomotionState = locState;
    this.updateLocomotion(dt, locState, CONSTANTS.INITIAL_SPEED, hasHoverboard, hasSneakers, bankAngle, jumpProgress, slideProgress, 0);
  }

  private updateLocomotion(
    dt: number,
    state: LocomotionState,
    speed: number,
    hasHoverboard: boolean,
    hasSneakers: boolean,
    bankAngle: number,
    jumpProgress: number,
    slideProgress: number,
    landingProgress: number,
    isFastDropLand: boolean = false
  ): void {
    if (this.presentationPose === 'HOVERBOARD') {
      hasHoverboard = true;
    }

    // 1. Advance animation clock with speed-dependent cadence
    // Stride cadence scales smoothly with forward speed, eliminating foot sliding!
    const cadence = state === 'RUN' || state === 'TRAIN_ROOF_RUN' || state === 'CLIMB'
      ? Math.min(32.0, 12.0 + (speed / CONSTANTS.MAX_SPEED) * 16.0)
      : 14.0;
    this.animTime += dt * cadence;

    this.isHoverboard = hasHoverboard;
    if (this.hoverboardGroup) {
      this.hoverboardGroup.visible = hasHoverboard;
    }

    // Power-up visual FX updates
    this.updatePowerupVisuals(dt, hasSneakers);

    // Visual facing direction logic (Reverse Run / Moonwalk support)
    const isReverseAllowed = this.isReverseFacingAllowed(state);
    const targetFacingAngle = (this.runningStyle === 'REVERSE' && isReverseAllowed) ? Math.PI : 0;
    const facingLerpRate = 18.0;
    this.visualFacingAngle += (targetFacingAngle - this.visualFacingAngle) * (1.0 - Math.exp(-facingLerpRate * dt));
    if (Math.abs(targetFacingAngle - this.visualFacingAngle) < 0.005) {
      this.visualFacingAngle = targetFacingAngle;
    }

    // 2. Compute target joint transforms based on current locomotion state
    this.computeTargetPose(
      state,
      speed,
      dt,
      bankAngle,
      jumpProgress,
      slideProgress,
      landingProgress,
      isFastDropLand,
      hasHoverboard
    );

    // 3. Frame-rate independent exponential pose blending / interpolation
    // Explosive transitions (takeoff, dive) blend snappily; normal transitions blend smoothly
    let blendSpeed = 20.0;
    if (state === 'JUMP_TAKEOFF') blendSpeed = 38.0;
    else if (state === 'FAST_DROP') blendSpeed = 34.0;
    else if (state === 'SLIDE_ENTRY') blendSpeed = 32.0;
    else if (state === 'JUMP_LAND') blendSpeed = 28.0;
    else if (state === 'TRAIN_ROOF_RUN') blendSpeed = 22.0; // 0.10-0.18s crossfade to rooftop running
    else if (state === 'CLIMB') blendSpeed = 24.0; // 0.10-0.16s ramp incline posture blend
    else if (state === 'CRASH') blendSpeed = 16.0;

    const blendWeight = 1.0 - Math.exp(-blendSpeed * dt);
    this.blendPose(blendWeight);

    // 4. Apply blended transforms to Three.js hierarchy
    this.applyBlendedPoseToHierarchy();

    // 4.5. Advance GLB animation mixer if active
    if (this.glbInstance) {
      let targetClip = 'run';
      let loop = true;

      switch (state) {
        case 'IDLE':
          targetClip = 'idle';
          break;
        case 'RUN':
          targetClip = speed >= 28 ? 'run_fast' : 'run';
          break;
        case 'TRAIN_ROOF_RUN':
          targetClip = 'run_fast';
          break;
        case 'JUMP_TAKEOFF':
        case 'JUMP_ASCEND':
          targetClip = 'jump_start';
          loop = false;
          break;
        case 'JUMP_APEX':
        case 'JUMP_DESCEND':
        case 'FAST_DROP':
          targetClip = 'jump_air';
          break;
        case 'JUMP_LAND':
          targetClip = 'jump_land';
          loop = false;
          break;
        case 'SLIDE_ENTRY':
        case 'SLIDE_HOLD':
        case 'SLIDE_RECOVER':
          targetClip = 'slide';
          loop = false;
          break;
        case 'STUMBLE':
          targetClip = 'stumble';
          loop = false;
          break;
        case 'CRASH':
          targetClip = 'defeat';
          loop = false;
          break;
        case 'CLIMB':
          targetClip = 'jump_start';
          break;
        case 'HOVERBOARD':
          targetClip = 'idle';
          break;
        case 'VICTORY':
          targetClip = 'idle';
          break;
        case 'JETPACK':
          targetClip = 'jump_air';
          break;
        default:
          targetClip = 'run';
      }

      this.playGlbClip(targetClip, loop);
      this.glbInstance.mixer.update(dt);
    }

    // 5. Dynamic shadow tracking & scaling
    this.updateShadow(state, jumpProgress);
  }

  private computeTargetPose(
    state: LocomotionState,
    speed: number,
    dt: number,
    bankAngle: number,
    jumpProgress: number,
    slideProgress: number,
    landingProgress: number,
    isFastDropLand: boolean = false,
    hasHoverboard: boolean = false
  ): void {
    // Reset targets to base neutral
    this.targetRootPos.set(0, 0, 0);
    this.targetRootRot.set(0, 0, 0);
    this.targetHipsPos.set(0, this.baseHipsY, 0);
    this.targetHipsRot.set(0, 0, 0);
    this.targetSpineRot.set(0, 0, 0);
    this.targetHeadRot.set(0, 0, 0);
    this.targetLeftArmRot.set(0, 0, 0);
    this.targetLeftForearmRot.set(0, 0, 0);
    this.targetRightArmRot.set(0, 0, 0);
    this.targetRightForearmRot.set(0, 0, 0);
    this.targetLeftLegRot.set(0, 0, 0);
    this.targetLeftCalfRot.set(0, 0, 0);
    this.targetRightLegRot.set(0, 0, 0);
    this.targetRightCalfRot.set(0, 0, 0);
    this.targetLeftSneakerRot.set(0, 0, 0);
    this.targetRightSneakerRot.set(0, 0, 0);

    const t = this.animTime;

    switch (state) {
      case 'IDLE':
        this.computeIdleTarget(dt);
        break;

      case 'RUN':
      case 'TRAIN_ROOF_RUN':
      case 'CLIMB':
        if (this.runningStyle === 'REVERSE') {
          this.computeReverseRunTarget(t, speed, state);
        } else {
          this.computeRunTarget(t, speed, state);
        }
        break;

      case 'JUMP_TAKEOFF':
        this.computeJumpTakeoffTarget();
        break;

      case 'JUMP_ASCEND':
        this.computeJumpAscendTarget(jumpProgress);
        break;

      case 'JUMP_APEX':
        this.computeJumpApexTarget();
        break;

      case 'JUMP_DESCEND':
        this.computeJumpDescendTarget(jumpProgress);
        break;

      case 'JUMP_LAND':
        this.computeJumpLandTarget(landingProgress, isFastDropLand);
        break;

      case 'FAST_DROP':
        this.computeFastDropTarget();
        break;

      case 'SLIDE_ENTRY':
      case 'SLIDE_HOLD':
      case 'SLIDE_RECOVER':
        this.computeSlideTarget(slideProgress, hasHoverboard);
        break;

      case 'JETPACK':
        this.computeJetpackTarget(t);
        break;

      case 'HOVERBOARD':
        this.computeHoverboardTarget(t, dt);
        break;

      case 'VICTORY':
        this.computeVictoryTarget(dt);
        break;

      case 'STUMBLE':
        this.computeStumbleTarget();
        break;

      case 'CRASH':
        this.computeCrashTarget();
        break;
    }

    // Apply lateral banking and weight transfer additively across any active locomotion state.
    // When facing toward the camera (Math.cos(visualFacingAngle) < 0), invert local roll
    // so character naturally leans in the screen-space direction of the lane switch!
    const bankSign = Math.cos(this.visualFacingAngle);
    this.targetRootRot.z += -bankAngle * 0.95 * bankSign;
    this.targetRootRot.y += this.visualFacingAngle + bankAngle * 0.22 * bankSign;
    this.targetSpineRot.z += bankAngle * 0.35 * bankSign;
  }

  /**
   * Biomechanical Backpedal Animation for Reverse Run Style.
   * - Forefoot/ball-of-foot contact reaching backward along the track
   * - High knee flexion (1.28 rads) during forward recovery to clear the ground cleanly (no moonwalk sliding)
   * - Reciprocal arm pump with flexed elbows
   * - Stable head gaze oriented level directly toward the player camera
   */
  private computeReverseRunTarget(t: number, speed: number, variant: 'RUN' | 'TRAIN_ROOF_RUN' | 'CLIMB'): void {
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);

    // 1. Pelvis harmonic vertical bob (2 bobs per full 2-step stride cycle)
    const bob = -Math.cos(2.0 * t) * 0.040;
    this.targetHipsPos.set(0, (this.baseHipsY - 0.02) + bob, 0);

    // 2. Pelvis yaw & roll counter-rotation
    this.targetHipsRot.set(0, sinT * 0.07, -sinT * 0.03);

    // 3. Spine athletic forward balance lean & counter-twist
    // In backpedaling, runner leans slightly forward toward camera for dynamic balance
    let athleticLean = 0.12 + (speed / CONSTANTS.MAX_SPEED) * 0.06;
    if (variant === 'TRAIN_ROOF_RUN') athleticLean += 0.03;
    if (variant === 'CLIMB') athleticLean -= 0.08;

    this.targetSpineRot.set(athleticLean, -sinT * 0.10, 0);

    // 4. Head gaze stabilization (keeps eyes focused level on camera/player)
    this.targetHeadRot.set(-athleticLean * 0.88, sinT * 0.08, sinT * 0.02);

    // 5. Alternating Legs with Authentic Backpedal Kinesiology:
    // Left Leg phase = t, Right Leg phase = t + Math.PI
    // Leg reaches BACKWARD to catch the ground (sinT < 0), sweeps forward during stance,
    // and during recovery (sinT > 0) knee flexes high (1.28 rads) to clear the ground without scuffing/moonwalking!
    const leftLegSwing = sinT * 0.65;
    const rightLegSwing = -sinT * 0.65;
    this.targetLeftLegRot.set(leftLegSwing, 0, 0);
    this.targetRightLegRot.set(rightLegSwing, 0, 0);

    // High knee flexion during forward recovery stroke:
    const leftRecovery = Math.max(0, sinT);
    const rightRecovery = Math.max(0, -sinT);
    this.targetLeftCalfRot.set(0.12 + Math.pow(leftRecovery, 1.2) * 1.28, 0, 0);
    this.targetRightCalfRot.set(0.12 + Math.pow(rightRecovery, 1.2) * 1.28, 0, 0);

    // Foot ankle flexion: forefoot planting reaching backward, rolling flat through stance
    let leftAnklePitch = sinT * 0.16;
    let rightAnklePitch = -sinT * 0.16;
    if (variant === 'CLIMB') {
      leftAnklePitch -= 0.18;
      rightAnklePitch -= 0.18;
    }
    this.targetLeftSneakerRot.set(leftAnklePitch, 0, 0);
    this.targetRightSneakerRot.set(rightAnklePitch, 0, 0);

    // 6. Reciprocal Arm Sprint Pump with Bent Elbows
    const armSwing = sinT * 0.60;
    this.targetLeftArmRot.set(armSwing + 0.10, 0, -0.24);
    this.targetRightArmRot.set(-armSwing + 0.10, 0, 0.24);

    this.targetLeftForearmRot.set(-0.65 - Math.max(0, armSwing) * 0.45, 0, 0);
    this.targetRightForearmRot.set(-0.65 - Math.max(0, -armSwing) * 0.45, 0, 0);
  }

  private computeRunTarget(t: number, speed: number, variant: 'RUN' | 'TRAIN_ROOF_RUN' | 'CLIMB'): void {
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);

    // 1. Pelvis harmonic vertical bob (2 bobs per full 2-step stride cycle)
    const bob = -Math.cos(2.0 * t) * 0.045;
    this.targetHipsPos.set(0, this.baseHipsY + bob, 0);

    // 2. Pelvis yaw & roll counter-rotation
    this.targetHipsRot.set(0, -sinT * 0.08, sinT * 0.035);

    // 3. Spine athletic forward lean & counter-twist
    let forwardLean = 0.14 + (speed / CONSTANTS.MAX_SPEED) * 0.08;
    if (variant === 'TRAIN_ROOF_RUN') forwardLean += 0.04;
    if (variant === 'CLIMB') forwardLean += 0.22;

    this.targetSpineRot.set(forwardLean, sinT * 0.12, 0);

    // 4. Head gaze stabilization (keeps eyes focused level on oncoming track)
    this.targetHeadRot.set(-forwardLean * 0.65, -sinT * 0.10, -sinT * 0.03);

    // 5. Alternating Legs with Biomechanical Knee Delay
    const legSwing = sinT * 0.72;
    this.targetLeftLegRot.set(legSwing, 0, 0);
    this.targetRightLegRot.set(-legSwing, 0, 0);

    // Delayed knee flexion: Knee bends smoothly during recovery swing, clearing the ground
    const leftSwing = Math.max(0, Math.sin(t - 0.35));
    this.targetLeftCalfRot.set(0.06 + leftSwing * 1.15, 0, 0);

    const rightSwing = Math.max(0, Math.sin(t + Math.PI - 0.35));
    this.targetRightCalfRot.set(0.06 + rightSwing * 1.15, 0, 0);

    // Foot ankle flexion (with slope-aligned dorsiflexion during climbing)
    let leftAnklePitch = -sinT * 0.12;
    let rightAnklePitch = sinT * 0.12;
    if (variant === 'CLIMB') {
      leftAnklePitch += 0.24;
      rightAnklePitch += 0.24;
    }
    this.targetLeftSneakerRot.set(leftAnklePitch, 0, 0);
    this.targetRightSneakerRot.set(rightAnklePitch, 0, 0);

    // 6. Natural Arm Swing with Elbow Flexion
    const armSwing = sinT * 0.68;
    this.targetLeftArmRot.set(-armSwing + 0.12, 0, -0.22);
    this.targetRightArmRot.set(armSwing + 0.12, 0, 0.22);

    this.targetLeftForearmRot.set(-0.45 - Math.max(0, -armSwing) * 0.55, 0, 0);
    this.targetRightForearmRot.set(-0.45 - Math.max(0, armSwing) * 0.55, 0, 0);
  }

  private computeJumpTakeoffTarget(): void {
    // Explosive kinetic spring-up compression (micro-crouch without input latency)
    this.targetRootPos.set(0, -0.04, 0);
    this.targetHipsPos.set(0, this.baseHipsY - 0.08, 0);
    this.targetSpineRot.set(0.22, 0, 0);
    this.targetHeadRot.set(-0.12, 0, 0);

    // Deep knee flexion preparing for extension
    this.targetLeftLegRot.set(-0.45, 0, 0);
    this.targetLeftCalfRot.set(1.10, 0, 0);
    this.targetRightLegRot.set(-0.45, 0, 0);
    this.targetRightCalfRot.set(1.10, 0, 0);

    // Dynamic upward arm drive sweeping back to spring forward
    this.targetLeftArmRot.set(-0.75, 0, -0.35);
    this.targetRightArmRot.set(-0.75, 0, 0.35);
    this.targetLeftForearmRot.set(-0.95, 0, 0);
    this.targetRightForearmRot.set(-0.95, 0, 0);
  }

  private computeJumpAscendTarget(jumpProgress: number): void {
    // Dynamic upward leap, lead leg flexing high, arms driving upward
    this.targetRootPos.set(0, 0, 0);
    this.targetHipsPos.set(0, this.baseHipsY, 0);
    this.targetSpineRot.set(0.06, 0, 0);
    this.targetHeadRot.set(-0.10, 0, 0);

    this.targetLeftLegRot.set(-0.85, 0, 0);
    this.targetLeftCalfRot.set(1.25, 0, 0);
    this.targetRightLegRot.set(0.20, 0, 0);
    this.targetRightCalfRot.set(0.55, 0, 0);

    this.targetLeftArmRot.set(-0.65, 0.15, -0.40);
    this.targetRightArmRot.set(-0.65, -0.15, 0.40);
    this.targetLeftForearmRot.set(-0.80, 0, 0);
    this.targetRightForearmRot.set(-0.80, 0, 0);
  }

  private computeJumpApexTarget(): void {
    // Floating weightlessness at the crest of the jump, knees tucked, arms spread for balance
    this.targetHipsPos.set(0, this.baseHipsY + 0.02, 0);
    this.targetSpineRot.set(0.04, 0, 0);
    this.targetHeadRot.set(-0.06, 0, 0);

    this.targetLeftLegRot.set(-0.50, 0, 0);
    this.targetLeftCalfRot.set(0.95, 0, 0);
    this.targetRightLegRot.set(-0.25, 0, 0);
    this.targetRightCalfRot.set(0.80, 0, 0);

    this.targetLeftArmRot.set(-0.25, 0.1, -0.70);
    this.targetRightArmRot.set(-0.25, -0.1, 0.70);
    this.targetLeftForearmRot.set(-0.55, 0, 0);
    this.targetRightForearmRot.set(-0.55, 0, 0);
  }

  private computeJumpDescendTarget(jumpProgress: number): void {
    // Natural descent, legs extending down to meet the ground, gaze downward
    this.targetSpineRot.set(0.14, 0, 0);
    this.targetHeadRot.set(0.08, 0, 0);

    this.targetLeftLegRot.set(-0.18, 0, 0);
    this.targetLeftCalfRot.set(0.20, 0, 0);
    this.targetRightLegRot.set(-0.12, 0, 0);
    this.targetRightCalfRot.set(0.18, 0, 0);

    // Ankles dorsiflexed to prep for impact
    this.targetLeftSneakerRot.set(0.20, 0, 0);
    this.targetRightSneakerRot.set(0.20, 0, 0);

    this.targetLeftArmRot.set(0.25, 0, -0.30);
    this.targetRightArmRot.set(0.25, 0, 0.30);
    this.targetLeftForearmRot.set(-0.35, 0, 0);
    this.targetRightForearmRot.set(-0.35, 0, 0);
  }

  private computeJumpLandTarget(landingProgress: number, isFastDrop: boolean = false): void {
    // Landing impact absorption (0.12s window): two-stage squash and elastic rebound
    const p = Math.min(1.0, Math.max(0, landingProgress));
    // Asymmetric impact curve: rapid compression in first 40%, elastic spring rebound in remaining 60%
    const compressionCurve = p < 0.40
      ? Math.sin((p / 0.40) * (Math.PI / 2))
      : Math.cos(((p - 0.40) / 0.60) * (Math.PI / 2));

    const intensity = isFastDrop ? 1.45 : 1.0;
    const impact = compressionCurve * intensity;

    this.targetRootPos.set(0, -0.12 * impact, 0);
    this.targetHipsPos.set(0, this.baseHipsY - 0.08 * impact, 0);
    this.targetSpineRot.set(0.24 * impact, 0, 0);
    this.targetHeadRot.set(-0.12 * impact, 0, 0);

    this.targetLeftLegRot.set(-0.42 * impact, 0, -0.05 * impact);
    this.targetLeftCalfRot.set(0.92 * impact, 0, 0);
    this.targetRightLegRot.set(-0.35 * impact, 0, 0.05 * impact);
    this.targetRightCalfRot.set(0.85 * impact, 0, 0);

    this.targetLeftArmRot.set(0.15 * impact, 0, -0.58 * impact);
    this.targetRightArmRot.set(0.15 * impact, 0, 0.58 * impact);
    this.targetLeftForearmRot.set(-0.65 * impact, 0, 0);
    this.targetRightForearmRot.set(-0.65 * impact, 0, 0);
  }

  private computeFastDropTarget(): void {
    // Streamlined aerodynamic dive arrow posture
    this.targetRootPos.set(0, 0, 0);
    this.targetSpineRot.set(0.42, 0, 0);
    this.targetHeadRot.set(0.20, 0, 0);

    this.targetLeftLegRot.set(0.45, 0, 0);
    this.targetLeftCalfRot.set(0.75, 0, 0);
    this.targetRightLegRot.set(0.45, 0, 0);
    this.targetRightCalfRot.set(0.75, 0, 0);

    this.targetLeftArmRot.set(0.85, 0, -0.25);
    this.targetRightArmRot.set(0.85, 0, 0.25);
    this.targetLeftForearmRot.set(-0.20, 0, 0);
    this.targetRightForearmRot.set(-0.20, 0, 0);
  }

  private computeSlideTarget(progress: number, isBoard: boolean = false): void {
    if (isBoard) {
      // Low surfing crouch on hoverboard to guarantee clearing 0.75m barrier
      let depth = 1.0;
      if (progress < 0.20) {
        depth = progress / 0.20;
      } else if (progress > 0.75) {
        depth = 1.0 - (progress - 0.75) / 0.25;
      }
      this.targetRootPos.set(0, -0.48 * depth, 0);
      this.targetHipsPos.set(0, this.baseHipsY - 0.12 * depth, 0);
      this.targetHipsRot.set(0, 0.55 * depth, 0);
      this.targetSpineRot.set(0.28 * depth, 0, 0);
      this.targetHeadRot.set(-0.15 * depth, 0, 0);

      this.targetLeftLegRot.set(-0.65 * depth, 0, 0);
      this.targetLeftCalfRot.set(1.35 * depth, 0, 0);
      this.targetRightLegRot.set(-0.55 * depth, 0, 0);
      this.targetRightCalfRot.set(1.35 * depth, 0, 0);

      this.targetLeftArmRot.set(-0.30 * depth, 0, -0.60 * depth);
      this.targetRightArmRot.set(0.20 * depth, 0, 0.60 * depth);
      return;
    }

    // Low baseball slide / ground roll pose, matching 0.75m collider, head and torso aligned
    // Smooth transition from entry (0 to 0.2), hold (0.2 to 0.75), and recovery (0.75 to 1.0)
    let depth = 1.0;
    if (progress < 0.20) {
      depth = progress / 0.20;
    } else if (progress > 0.75) {
      depth = 1.0 - (progress - 0.75) / 0.25;
    }

    this.targetRootPos.set(0, -0.50 * depth, 0);
    this.targetRootRot.set(-0.35 * depth, 0, 0);
    this.targetHipsRot.set(0, 0.48 * depth, 0);
    this.targetSpineRot.set(-0.18 * depth, -0.22 * depth, 0);
    this.targetHeadRot.set(0.38 * depth, -0.22 * depth, 0);

    this.targetLeftLegRot.set(-1.25 * depth, 0, 0);
    this.targetLeftCalfRot.set(0.10 * depth, 0, 0);
    this.targetLeftSneakerRot.set(-0.15 * depth, 0, 0);

    this.targetRightLegRot.set(0.45 * depth, 0, 0);
    this.targetRightCalfRot.set(1.42 * depth, 0, 0);

    this.targetLeftArmRot.set(-0.25 * depth, 0, -0.55 * depth);
    this.targetRightArmRot.set(0.52 * depth, 0, 0.35 * depth);
    this.targetRightForearmRot.set(-1.10 * depth, 0, 0);
  }

  private computeJetpackTarget(t: number): void {
    // Aerodynamic Rocket Jetpack Flight Posture
    const slowT = t * 0.45;
    this.targetRootPos.set(0, 0.12 + Math.sin(slowT) * 0.08, 0);
    this.targetSpineRot.set(-0.30, 0, 0);
    this.targetHeadRot.set(0.25, 0, 0);

    this.targetLeftLegRot.set(-0.42 + Math.sin(slowT) * 0.04, 0, 0);
    this.targetLeftCalfRot.set(0.20, 0, 0);
    this.targetRightLegRot.set(-0.42 - Math.sin(slowT) * 0.04, 0, 0);
    this.targetRightCalfRot.set(0.20, 0, 0);

    this.targetLeftArmRot.set(-0.35, 0, -0.25);
    this.targetRightArmRot.set(-0.35, 0, 0.25);
    this.targetLeftForearmRot.set(-0.25, 0, 0);
    this.targetRightForearmRot.set(-0.25, 0, 0);
  }

  private computeHoverboardTarget(t: number, dt: number): void {
    // Surfer Stance on Hoverboard
    const slowT = t * 0.4;
    if (this.hoverboardGroup) {
      this.hoverboardGroup.position.y = 0.08 + Math.sin(slowT) * 0.04;
      this.hoverboardGroup.rotation.z = Math.sin(slowT * 0.8) * 0.06;
    }

    this.targetHipsPos.set(0, this.baseHipsY, 0);
    this.targetHipsRot.set(0, 0.65, 0);
    this.targetSpineRot.set(0.05, 0, 0);

    this.targetLeftLegRot.set(-0.25, 0, 0);
    this.targetLeftCalfRot.set(0.40, 0, 0);
    this.targetRightLegRot.set(0.20, 0, 0);
    this.targetRightCalfRot.set(0.35, 0, 0);

    this.targetLeftArmRot.set(-0.20, 0, -0.50);
    this.targetRightArmRot.set(0.30, 0, 0.60);

    if (this.activeBoardBuilt) {
      this.activeBoardBuilt.updateAnimation(this.animTime, dt);
    }
  }

  private computeStumbleTarget(): void {
    const t = this.animTime * 1.5;
    const wobble = Math.sin(t * 8.0) * 0.18;
    this.targetSpineRot.set(-0.25 + Math.sin(t * 6.0) * 0.12, wobble, wobble * 0.5);
    this.targetHeadRot.set(0.15, -wobble * 0.8, 0);
    this.targetLeftArmRot.set(-0.80 + Math.cos(t * 7.0) * 0.45, 0, -0.45);
    this.targetRightArmRot.set(-0.80 - Math.cos(t * 7.0) * 0.45, 0, 0.45);
    this.targetLeftLegRot.set(0.35 + Math.sin(t * 8.0) * 0.3, 0, 0);
    this.targetRightLegRot.set(-0.35 - Math.sin(t * 8.0) * 0.3, 0, 0);
  }

  private computeCrashTarget(): void {
    this.targetRootRot.set(-Math.PI / 2, 0, 0);
    this.targetRootPos.set(0, -0.60, 0);
    this.targetLeftArmRot.set(0.5, 0, -0.8);
    this.targetRightArmRot.set(0.5, 0, 0.8);
  }

  private computeVictoryTarget(dt: number): void {
    const t = this.animTime * 0.4;
    const breath = Math.sin(t) * 0.02;

    // Confident champion stance: upright chest, slight proud tilt
    this.targetRootPos.set(0, 0.04, 0);
    this.targetHipsPos.set(0, this.baseHipsY + breath * 0.5, 0);
    this.targetHipsRot.set(0, 0.12, 0);
    this.targetSpineRot.set(-0.06, 0.06, 0);
    this.targetHeadRot.set(-0.10, -0.12, 0.04);

    // Athletic wide grounded stance
    this.targetLeftLegRot.set(-0.08, 0, -0.18);
    this.targetLeftCalfRot.set(0.16, 0, 0);
    this.targetRightLegRot.set(0.12, 0, 0.18);
    this.targetRightCalfRot.set(0.14, 0, 0);

    // Right arm triumphantly raised high in victory pump
    this.targetRightArmRot.set(-2.40, 0, 0.35);
    this.targetRightForearmRot.set(-0.70, 0, 0);

    // Left arm confident on the hip
    this.targetLeftArmRot.set(0.32, 0, -0.52);
    this.targetLeftForearmRot.set(-1.18, 0, 0);
  }

  private computeIdleTarget(dt: number): void {
    const t = this.animTime * 0.35;
    const breath = Math.sin(t) * 0.025;
    const sway = Math.sin(t * 0.5) * 0.04;

    this.targetHipsPos.set(0, this.baseHipsY + breath, 0);
    this.targetHipsRot.set(0, 0, sway * 0.5);
    this.targetSpineRot.set(-0.02 + Math.cos(t) * 0.015, Math.sin(t * 0.4) * 0.06, 0);
    this.targetHeadRot.set(-Math.cos(t) * 0.02, -Math.sin(t * 0.4) * 0.08, 0);

    this.targetLeftLegRot.set(0.05, 0, -0.05);
    this.targetLeftCalfRot.set(0.02, 0, 0);
    this.targetRightLegRot.set(-0.05, 0, 0.05);
    this.targetRightCalfRot.set(0.02, 0, 0);

    if (this.currentCharacterId === 'char_cruz') {
      this.targetLeftArmRot.set(-0.2, 0.2, -0.4 + sway * 0.2);
      this.targetRightArmRot.set(-0.2, -0.2, 0.4 - sway * 0.2);
      this.targetLeftForearmRot.set(-0.6, 0, 0);
      this.targetRightForearmRot.set(-0.6, 0, 0);
    } else if (this.currentCharacterId === 'char_luna') {
      this.targetLeftArmRot.set(-0.1, 0, -0.25);
      this.targetLeftForearmRot.set(-0.3, 0, 0);
      this.targetRightArmRot.set(-0.7, -0.3, 0.2);
      this.targetRightForearmRot.set(-1.2, 0, 0);
    } else if (this.currentCharacterId === 'char_nova') {
      this.targetLeftArmRot.set(0.1, 0, -0.2);
      this.targetRightArmRot.set(0.1, 0, 0.2);
      this.targetLeftForearmRot.set(-0.2, 0, 0);
      this.targetRightForearmRot.set(-0.2, 0, 0);
    } else {
      this.targetLeftArmRot.set(0.05, 0, -0.25);
      this.targetRightArmRot.set(-0.1, 0, 0.3);
      this.targetLeftForearmRot.set(-0.35, 0, 0);
      this.targetRightForearmRot.set(-0.45, 0, 0);
    }
  }

  private blendPose(blendWeight: number): void {
    this.blendVector(this.rootPos, this.targetRootPos, blendWeight);
    this.blendEuler(this.rootRot, this.targetRootRot, blendWeight);
    this.blendVector(this.hipsPos, this.targetHipsPos, blendWeight);
    this.blendEuler(this.hipsRot, this.targetHipsRot, blendWeight);
    this.blendEuler(this.spineRot, this.targetSpineRot, blendWeight);
    this.blendEuler(this.headRot, this.targetHeadRot, blendWeight);
    this.blendEuler(this.leftArmRot, this.targetLeftArmRot, blendWeight);
    this.blendEuler(this.leftForearmRot, this.targetLeftForearmRot, blendWeight);
    this.blendEuler(this.rightArmRot, this.targetRightArmRot, blendWeight);
    this.blendEuler(this.rightForearmRot, this.targetRightForearmRot, blendWeight);
    this.blendEuler(this.leftLegRot, this.targetLeftLegRot, blendWeight);
    this.blendEuler(this.leftCalfRot, this.targetLeftCalfRot, blendWeight);
    this.blendEuler(this.rightLegRot, this.targetRightLegRot, blendWeight);
    this.blendEuler(this.rightCalfRot, this.targetRightCalfRot, blendWeight);
    this.blendEuler(this.leftSneakerRot, this.targetLeftSneakerRot, blendWeight);
    this.blendEuler(this.rightSneakerRot, this.targetRightSneakerRot, blendWeight);
  }

  private blendEuler(current: THREE.Euler, target: THREE.Euler, weight: number): void {
    current.x += (target.x - current.x) * weight;
    current.y += (target.y - current.y) * weight;
    current.z += (target.z - current.z) * weight;
  }

  private blendVector(current: THREE.Vector3, target: THREE.Vector3, weight: number): void {
    current.x += (target.x - current.x) * weight;
    current.y += (target.y - current.y) * weight;
    current.z += (target.z - current.z) * weight;
  }

  private applyBlendedPoseToHierarchy(): void {
    this.rootGroup.position.copy(this.rootPos);
    this.rootGroup.rotation.copy(this.rootRot);

    this.hipsGroup.position.copy(this.hipsPos);
    this.hipsGroup.rotation.copy(this.hipsRot);

    this.spineGroup.rotation.copy(this.spineRot);
    this.headGroup.rotation.copy(this.headRot);

    this.leftArmGroup.rotation.copy(this.leftArmRot);
    this.leftForearmGroup.rotation.copy(this.leftForearmRot);
    this.rightArmGroup.rotation.copy(this.rightArmRot);
    this.rightForearmGroup.rotation.copy(this.rightForearmRot);

    this.leftLegGroup.rotation.copy(this.leftLegRot);
    this.leftCalfGroup.rotation.copy(this.leftCalfRot);
    this.rightLegGroup.rotation.copy(this.rightLegRot);
    this.rightCalfGroup.rotation.copy(this.rightCalfRot);

    if (this.leftSneaker) {
      this.leftSneaker.rotation.copy(this.leftSneakerRot);
    }
    if (this.rightSneaker) {
      this.rightSneaker.rotation.copy(this.rightSneakerRot);
    }
  }

  private updateShadow(state: LocomotionState, jumpProgress: number): void {
    if (!this.shadowMesh) return;

    if (state === 'JETPACK') {
      this.shadowMesh.scale.set(0.25, 0.25, 1.0);
    } else if (
      state === 'JUMP_TAKEOFF' ||
      state === 'JUMP_ASCEND' ||
      state === 'JUMP_APEX' ||
      state === 'JUMP_DESCEND' ||
      state === 'FAST_DROP'
    ) {
      const scale = Math.max(0.35, 1.0 - jumpProgress * 0.45);
      this.shadowMesh.scale.set(scale, scale, 1.0);
    } else {
      this.shadowMesh.scale.set(1.0, 1.0, 1.0);
    }
  }

  private updatePowerupVisuals(dt: number, hasSneakers: boolean): void {
    // Jetpack flames flickering
    if (this.isJetpack && this.jetpackFire1 && this.jetpackFire2) {
      const flicker = 0.8 + Math.random() * 0.45;
      this.jetpackFire1.scale.set(1.0, flicker, 1.0);
      this.jetpackFire2.scale.set(1.0, flicker * 0.95 + 0.05, 1.0);
    }

    // Shield bubble pulse & spin
    if (this.isShield && this.shieldMesh) {
      this.shieldGroup.rotation.y += dt * 1.8;
      const s = 1.0 + Math.sin(this.animTime * 0.35) * 0.04;
      this.shieldMesh.scale.set(s, s, s);
    }

    // Magnet aura rotation
    if (this.isMagnet) {
      this.magnetAuraGroup.rotation.y += dt * 3.5;
      this.magnetAuraGroup.rotation.z += dt * 1.5;
    }

    // Invulnerability flashing feedback (rapid arcade strobe)
    if (this.isInvulnerable) {
      this.mesh.visible = (Math.floor(this.animTime * 3.5) % 4) !== 0;
    } else {
      this.mesh.visible = true;
    }

    // Super sneakers glow & wings
    if (this.isSuperSneakers !== hasSneakers) {
      this.isSuperSneakers = hasSneakers;
      this.hierarchy.materials.sneakerMainMat.emissive.setHex(hasSneakers ? 0xffaa00 : 0x000000);
      this.hierarchy.materials.sneakerMainMat.emissiveIntensity = hasSneakers ? 0.6 : 0.0;
    }
  }

  /**
   * Play or transition to a GLB skeletal animation clip
   */
  public playGlbClip(name: string, loop: boolean = true): void {
    if (!this.glbInstance) return;
    if (this.currentGlbClip === name) return;

    const action = this.glbInstance.actions.get(name);
    if (!action) return;

    const prevAction = this.currentGlbClip ? this.glbInstance.actions.get(this.currentGlbClip) : null;
    if (prevAction && prevAction !== action) {
      prevAction.fadeOut(0.12);
    }

    action.reset();
    action.enabled = true;
    action.setEffectiveWeight(1);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = !loop;
    action.fadeIn(0.12).play();

    this.currentGlbClip = name;
  }

  /**
   * Showcase Idle Animation for 3D Turntable Preview (direct application for preview modal)
   */
  public animateTurntableIdle(dt: number): void {
    if (this.glbInstance) {
      this.playGlbClip('selection_idle', true);
      this.glbInstance.mixer.update(dt);
      return;
    }

    this.animTime += dt * 3.5;
    const t = this.animTime;

    // Subtle rhythmic weight shift & breathing
    const breath = Math.sin(t) * 0.025;
    const sway = Math.sin(t * 0.5) * 0.04;

    this.hipsGroup.position.y = (this.baseHipsY || 0.95) + breath;
    this.hipsGroup.rotation.z = sway * 0.5;
    this.spineGroup.rotation.x = -0.02 + Math.cos(t) * 0.015;
    this.spineGroup.rotation.y = Math.sin(t * 0.4) * 0.06;

    this.headGroup.rotation.x = -Math.cos(t) * 0.02;
    this.headGroup.rotation.y = -Math.sin(t * 0.4) * 0.08;

    // Relaxed arms at sides with personality
    if (this.currentCharacterId === 'char_cruz') {
      this.leftArmGroup.rotation.set(-0.2, 0.2, -0.4 + sway * 0.2);
      this.rightArmGroup.rotation.set(-0.2, -0.2, 0.4 - sway * 0.2);
      this.leftForearmGroup.rotation.x = -0.6;
      this.rightForearmGroup.rotation.x = -0.6;
    } else if (this.currentCharacterId === 'char_luna') {
      this.leftArmGroup.rotation.set(-0.1, 0, -0.25);
      this.leftForearmGroup.rotation.x = -0.3;
      this.rightArmGroup.rotation.set(-0.7, -0.3, 0.2);
      this.rightForearmGroup.rotation.x = -1.2;
    } else if (this.currentCharacterId === 'char_nova') {
      this.leftArmGroup.rotation.set(0.1, 0, -0.2);
      this.rightArmGroup.rotation.set(0.1, 0, 0.2);
      this.leftForearmGroup.rotation.x = -0.2;
      this.rightForearmGroup.rotation.x = -0.2;
    } else {
      this.leftArmGroup.rotation.set(0.05, 0, -0.25);
      this.rightArmGroup.rotation.set(-0.1, 0, 0.3);
      this.leftForearmGroup.rotation.x = -0.35;
      this.rightForearmGroup.rotation.x = -0.45;
    }

    // Legs planted naturally on turntable podium
    this.leftLegGroup.rotation.set(0.05, 0, -0.05);
    this.leftCalfGroup.rotation.set(0.02, 0, 0);
    this.rightLegGroup.rotation.set(-0.05, 0, 0.05);
    this.rightCalfGroup.rotation.set(0.02, 0, 0);

    this.rootGroup.position.set(0, 0, 0);
    this.rootGroup.rotation.set(0, 0, 0);
  }

  public setHoverboardModel(boardId: HoverboardId): void {
    if (this.currentBoardId === boardId && this.activeBoardBuilt && this.hoverboardGroup.children.length > 0) {
      return;
    }
    this.currentBoardId = boardId;

    if (!this.hoverboardGroup) return;

    // Dispose old board
    while (this.hoverboardGroup.children.length > 0) {
      const child = this.hoverboardGroup.children[0];
      this.hoverboardGroup.remove(child);
    }
    if (this.activeBoardBuilt) {
      for (const mat of this.activeBoardBuilt.materials) {
        mat.dispose();
      }
    }

    this.activeBoardBuilt = HoverboardMeshBuilder.build(boardId);
    this.hoverboardGroup.add(this.activeBoardBuilt.group);
  }

  public setHoverboardVisible(visible: boolean, boardId?: HoverboardId): void {
    if (visible) {
      const targetId = boardId || this.currentBoardId;
      if (this.currentBoardId !== targetId || !this.activeBoardBuilt || this.hoverboardGroup.children.length === 0) {
        this.setHoverboardModel(targetId);
      }
    }
    this.isHoverboard = visible;
    if (this.hoverboardGroup) {
      this.hoverboardGroup.visible = visible;
    }
  }

  public setSuperSneakersActive(active: boolean): void {
    this.isSuperSneakers = active;
  }

  public setJetpackVisible(visible: boolean): void {
    this.isJetpack = visible;
    this.jetpackGroup.visible = visible;
    if (this.backpackGroup) {
      this.backpackGroup.visible = !visible;
    }
  }

  public setShieldVisible(visible: boolean): void {
    this.isShield = visible;
    this.shieldGroup.visible = visible;
  }

  public setMagnetVisible(visible: boolean): void {
    this.isMagnet = visible;
    this.magnetAuraGroup.visible = visible;
  }

  public setInvulnerable(invulnerable: boolean): void {
    this.isInvulnerable = invulnerable;
    if (!invulnerable) {
      this.mesh.visible = true;
    }
  }
}
