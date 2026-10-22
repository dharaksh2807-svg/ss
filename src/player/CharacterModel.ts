import * as THREE from 'three';
import { CharacterId } from '../characters/CharacterCatalog';
import { CharacterMeshBuilder, BuiltCharacterHierarchy } from '../characters/CharacterMeshBuilder';
import { HoverboardId } from '../hoverboard/HoverboardCatalog';
import { HoverboardMeshBuilder, BuiltHoverboard } from '../hoverboard/HoverboardMeshBuilder';

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

  constructor(characterId: CharacterId = 'char_jax', outfitId?: string) {
    this.mesh = new THREE.Group();
    this.currentCharacterId = characterId;
    this.currentOutfitId = outfitId || 'jax_classic';

    this.rebuildModel(this.currentCharacterId, this.currentOutfitId);
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

    this.mesh.add(this.rootGroup);

    // Mount initial hoverboard model
    this.setHoverboardModel(this.currentBoardId);
  }

  private disposeHierarchy(): void {
    if (!this.rootGroup) return;

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

  /**
   * Update Procedural Animation & Articulation
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
    this.animTime += dt * 14.0;
    this.isHoverboard = hasHoverboard;
    this.hoverboardGroup.visible = hasHoverboard;

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

    // Dynamic Lateral Banking & Lean
    this.rootGroup.rotation.z = -bankAngle * 0.9;
    this.rootGroup.rotation.y = bankAngle * 0.45;

    // Shadow tracking & scaling
    if (state === 'JUMPING' || state === 'JETPACK') {
      const scale = state === 'JETPACK' ? 0.25 : Math.max(0.4, 1.0 - jumpProgress * 0.5);
      this.shadowMesh.scale.set(scale, scale, 1.0);
    } else {
      this.shadowMesh.scale.set(1.0, 1.0, 1.0);
    }

    if (state === 'JETPACK') {
      this.animateJetpack(dt);
      return;
    }

    if (hasHoverboard) {
      this.animateHoverboard(dt);
      return;
    }

    switch (state) {
      case 'IDLE':
        this.animateIdle(dt);
        break;
      case 'RUNNING':
        this.animateRunCycle(dt);
        break;
      case 'JUMPING':
        this.animateJump(jumpProgress);
        break;
      case 'SLIDING':
        this.animateSlide(slideProgress);
        break;
      case 'STUMBLING':
        this.animateStumble(dt);
        break;
      case 'DEAD':
        this.animateDead();
        break;
    }
  }

  /**
   * Compatibility bridge for Player.ts update call
   */
  public updateAnimation(
    state: 'IDLE' | 'RUN' | 'JUMP' | 'SLIDE' | 'JETPACK' | 'CRASH',
    speed: number,
    bankingAngle: number,
    groundY: number,
    dt: number
  ): void {
    let animState: 'RUNNING' | 'JUMPING' | 'SLIDING' | 'JETPACK' | 'STUMBLING' | 'DEAD' | 'IDLE' = 'RUNNING';
    if (state === 'JETPACK') animState = 'JETPACK';
    else if (state === 'JUMP') animState = 'JUMPING';
    else if (state === 'SLIDE') animState = 'SLIDING';
    else if (state === 'CRASH') animState = 'DEAD';
    else if (state === 'IDLE') animState = 'IDLE';

    this.update(
      dt,
      animState,
      this.isHoverboard,
      this.isSuperSneakers,
      bankingAngle
    );
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

  /**
   * Showcase Idle Animation for 3D Turntable Preview
   */
  public animateTurntableIdle(dt: number): void {
    this.animTime += dt * 3.5;
    const t = this.animTime;

    // Subtle rhythmic weight shift & breathing
    const breath = Math.sin(t) * 0.025;
    const sway = Math.sin(t * 0.5) * 0.04;

    this.hipsGroup.position.y = 0.95 + breath;
    this.hipsGroup.rotation.z = sway * 0.5;
    this.spineGroup.rotation.x = -0.02 + Math.cos(t) * 0.015;
    this.spineGroup.rotation.y = Math.sin(t * 0.4) * 0.06;

    this.headGroup.rotation.x = -Math.cos(t) * 0.02;
    this.headGroup.rotation.y = -Math.sin(t * 0.4) * 0.08;

    // Relaxed arms at sides with personality
    if (this.currentCharacterId === 'char_cruz') {
      // Cruz has confident b-boy posture (arms slightly crossed / fists on hips)
      this.leftArmGroup.rotation.set(-0.2, 0.2, -0.4 + sway * 0.2);
      this.rightArmGroup.rotation.set(-0.2, -0.2, 0.4 - sway * 0.2);
      this.leftForearmGroup.rotation.x = -0.6;
      this.rightForearmGroup.rotation.x = -0.6;
    } else if (this.currentCharacterId === 'char_luna') {
      // Luna has sleek tech posture (one hand tapping cyber visor, one relaxed)
      this.leftArmGroup.rotation.set(-0.1, 0, -0.25);
      this.leftForearmGroup.rotation.x = -0.3;
      this.rightArmGroup.rotation.set(-0.7, -0.3, 0.2);
      this.rightForearmGroup.rotation.x = -1.2; // Hand up near visor
    } else if (this.currentCharacterId === 'char_nova') {
      // Nova has streamlined aero posture (shoulders broad, arms back)
      this.leftArmGroup.rotation.set(0.1, 0, -0.2);
      this.rightArmGroup.rotation.set(0.1, 0, 0.2);
      this.leftForearmGroup.rotation.x = -0.2;
      this.rightForearmGroup.rotation.x = -0.2;
    } else {
      // Jax has classic street runner idle (weight shifted, ready to spring)
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

  private animateIdle(dt: number): void {
    this.animateTurntableIdle(dt);
  }

  /**
   * Aerodynamic Rocket Jetpack Flight Posture
   */
  private animateJetpack(dt: number): void {
    const t = this.animTime * 0.45;
    this.rootGroup.position.y = 0.12 + Math.sin(t) * 0.08;
    this.spineGroup.rotation.x = -0.3;
    this.headGroup.rotation.x = 0.25;

    this.leftLegGroup.rotation.x = -0.42 + Math.sin(t) * 0.04;
    this.leftCalfGroup.rotation.x = 0.2;
    this.rightLegGroup.rotation.x = -0.42 - Math.sin(t) * 0.04;
    this.rightCalfGroup.rotation.x = 0.2;

    this.leftArmGroup.rotation.set(-0.35, 0, -0.25);
    this.rightArmGroup.rotation.set(-0.35, 0, 0.25);
    this.leftForearmGroup.rotation.x = -0.25;
    this.rightForearmGroup.rotation.x = -0.25;
  }

  /**
   * Athletic High-Cadence Sprint Cycle
   */
  private animateRunCycle(dt: number): void {
    const t = this.animTime;
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);

    this.hipsGroup.position.y = 0.95 + Math.abs(sinT) * 0.08;
    this.hipsGroup.rotation.y = -sinT * 0.08;
    this.spineGroup.rotation.y = sinT * 0.12;
    this.spineGroup.rotation.x = 0.15;

    this.headGroup.position.y = 0.62 + Math.abs(cosT) * 0.03;
    this.headGroup.rotation.x = -0.08;

    const armSwing = sinT * 0.75;
    this.leftArmGroup.rotation.x = -armSwing + 0.1;
    this.leftForearmGroup.rotation.x = -0.5 - Math.max(0, -sinT) * 0.5;

    this.rightArmGroup.rotation.x = armSwing + 0.1;
    this.rightForearmGroup.rotation.x = -0.5 - Math.max(0, sinT) * 0.5;

    const legSwing = sinT * 0.85;
    this.leftLegGroup.rotation.x = legSwing;
    this.leftCalfGroup.rotation.x = Math.max(0, -sinT) * 1.1;

    this.rightLegGroup.rotation.x = -legSwing;
    this.rightCalfGroup.rotation.x = Math.max(0, sinT) * 1.1;

    this.rootGroup.position.y = 0;
    this.rootGroup.rotation.x = 0;
  }

  /**
   * Dynamic Jump Takeoff and Airborne Pose
   */
  private animateJump(progress: number): void {
    this.spineGroup.rotation.x = 0.1;
    this.headGroup.rotation.x = -0.15;

    this.leftArmGroup.rotation.x = -0.4;
    this.leftArmGroup.rotation.z = -0.5;
    this.leftForearmGroup.rotation.x = -0.8;

    this.rightArmGroup.rotation.x = -0.4;
    this.rightArmGroup.rotation.z = 0.5;
    this.rightForearmGroup.rotation.x = -0.8;

    this.leftLegGroup.rotation.x = -0.6;
    this.leftCalfGroup.rotation.x = 1.0;
    this.rightLegGroup.rotation.x = 0.2;
    this.rightCalfGroup.rotation.x = 0.8;

    this.rootGroup.position.y = 0;
  }

  /**
   * Smooth Baseball Slide Pose
   */
  private animateSlide(progress: number): void {
    this.rootGroup.position.y = -0.45;
    this.rootGroup.rotation.x = -0.35;
    this.hipsGroup.rotation.y = 0.45;

    this.leftLegGroup.rotation.x = -1.2;
    this.leftCalfGroup.rotation.x = 0.1;

    this.rightLegGroup.rotation.x = 0.4;
    this.rightCalfGroup.rotation.x = 1.4;

    this.leftArmGroup.rotation.x = -0.2;
    this.leftArmGroup.rotation.z = -0.6;
    this.rightArmGroup.rotation.x = 0.5;
    this.rightForearmGroup.rotation.x = -1.1;
  }

  /**
   * Surfer Stance on Hoverboard
   */
  private animateHoverboard(dt: number): void {
    const t = this.animTime * 0.4;
    this.hoverboardGroup.position.y = 0.08 + Math.sin(t) * 0.04;
    this.hoverboardGroup.rotation.z = Math.sin(t * 0.8) * 0.06;

    this.hipsGroup.position.y = 0.95;
    this.hipsGroup.rotation.y = 0.65;
    this.spineGroup.rotation.x = 0.05;

    this.leftLegGroup.rotation.x = -0.25;
    this.leftCalfGroup.rotation.x = 0.4;
    this.rightLegGroup.rotation.x = 0.2;
    this.rightCalfGroup.rotation.x = 0.35;

    this.leftArmGroup.rotation.set(-0.2, 0, -0.5);
    this.rightArmGroup.rotation.set(0.3, 0, 0.6);

    // Animate board thrusters & glow rings
    if (this.activeBoardBuilt) {
      this.activeBoardBuilt.updateAnimation(this.animTime, dt);
    }
  }

  private animateStumble(dt: number): void {
    this.spineGroup.rotation.x = -0.3;
    this.leftArmGroup.rotation.x = -1.2;
    this.rightArmGroup.rotation.x = -1.2;
  }

  private animateDead(): void {
    this.rootGroup.rotation.x = -Math.PI / 2;
    this.rootGroup.position.y = -0.6;
  }
}
