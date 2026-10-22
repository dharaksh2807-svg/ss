import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';

export class CharacterModel {
  public mesh: THREE.Group;
  
  // Body parts for procedural animation
  private headGroup: THREE.Group;
  private torsoGroup: THREE.Group;
  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private leftSneaker: THREE.Mesh;
  private rightSneaker: THREE.Mesh;
  private hoverboardGroup: THREE.Group;
  private shadowMesh: THREE.Mesh;

  private sneakerMaterial: THREE.MeshStandardMaterial;
  private hoverboardMaterial: THREE.MeshStandardMaterial;

  // Running cycle accumulator
  private animTime: number = 0;

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.castShadow = true;

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffcb9a, roughness: 0.6 });
    const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x00d2ff, roughness: 0.4, metalness: 0.1 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1f2430, roughness: 0.7 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xff0055, roughness: 0.5 });
    const glassesMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 });
    
    this.sneakerMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      emissive: 0x000000
    });

    this.hoverboardMaterial = new THREE.MeshStandardMaterial({
      color: CONSTANTS.COLORS.HOVERBOARD,
      emissive: 0x00aa88,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8
    });

    // 1. Torso
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.95, 0);

    const torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.35);
    const torsoMesh = new THREE.Mesh(torsoGeo, hoodieMat);
    torsoMesh.castShadow = true;
    this.torsoGroup.add(torsoMesh);

    // Hoodie collar / trim
    const collarGeo = new THREE.BoxGeometry(0.4, 0.12, 0.38);
    const collarMesh = new THREE.Mesh(collarGeo, capMat);
    collarMesh.position.set(0, 0.33, 0);
    this.torsoGroup.add(collarMesh);

    // 2. Head & Accessories
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.52, 0);

    const headGeo = new THREE.BoxGeometry(0.36, 0.38, 0.36);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Backward baseball cap
    const capBaseGeo = new THREE.BoxGeometry(0.38, 0.18, 0.38);
    const capBaseMesh = new THREE.Mesh(capBaseGeo, capMat);
    capBaseMesh.position.set(0, 0.12, 0);
    this.headGroup.add(capBaseMesh);

    const capVisorGeo = new THREE.BoxGeometry(0.32, 0.04, 0.24);
    const capVisorMesh = new THREE.Mesh(capVisorGeo, capMat);
    capVisorMesh.position.set(0, 0.12, 0.24); // Visor backwards
    this.headGroup.add(capVisorMesh);

    // Sunglasses
    const glassesGeo = new THREE.BoxGeometry(0.38, 0.1, 0.08);
    const glassesMesh = new THREE.Mesh(glassesGeo, glassesMat);
    glassesMesh.position.set(0, 0.04, -0.19);
    this.headGroup.add(glassesMesh);

    this.torsoGroup.add(this.headGroup);

    // 3. Left & Right Arms
    const armGeo = new THREE.BoxGeometry(0.16, 0.58, 0.16);

    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.35, 0.25, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, hoodieMat);
    leftArmMesh.position.set(0, -0.25, 0);
    leftArmMesh.castShadow = true;
    this.leftArmGroup.add(leftArmMesh);
    this.torsoGroup.add(this.leftArmGroup);

    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.35, 0.25, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, hoodieMat);
    rightArmMesh.position.set(0, -0.25, 0);
    rightArmMesh.castShadow = true;
    this.rightArmGroup.add(rightArmMesh);
    this.torsoGroup.add(this.rightArmGroup);

    this.mesh.add(this.torsoGroup);

    // 4. Left & Right Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.55, 0.22);
    const sneakerGeo = new THREE.BoxGeometry(0.22, 0.16, 0.36);

    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.16, 0.65, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
    leftLegMesh.position.set(0, -0.25, 0);
    leftLegMesh.castShadow = true;
    this.leftLegGroup.add(leftLegMesh);

    this.leftSneaker = new THREE.Mesh(sneakerGeo, this.sneakerMaterial);
    this.leftSneaker.position.set(0, -0.55, -0.06);
    this.leftSneaker.castShadow = true;
    this.leftLegGroup.add(this.leftSneaker);
    this.mesh.add(this.leftLegGroup);

    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.16, 0.65, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rightLegMesh.position.set(0, -0.25, 0);
    rightLegMesh.castShadow = true;
    this.rightLegGroup.add(rightLegMesh);

    this.rightSneaker = new THREE.Mesh(sneakerGeo, this.sneakerMaterial);
    this.rightSneaker.position.set(0, -0.55, -0.06);
    this.rightSneaker.castShadow = true;
    this.rightLegGroup.add(this.rightSneaker);
    this.mesh.add(this.rightLegGroup);

    // 5. Hoverboard (Hidden until activated)
    this.hoverboardGroup = this.createHoverboard();
    this.hoverboardGroup.position.set(0, 0.08, 0);
    this.hoverboardGroup.visible = false;
    this.mesh.add(this.hoverboardGroup);

    // 6. Ground Blob Shadow
    const shadowGeo = new THREE.PlaneGeometry(1.2, 1.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.03;
    this.mesh.add(this.shadowMesh);
  }

  private createHoverboard(): THREE.Group {
    const group = new THREE.Group();
    
    // Board deck
    const deckGeo = new THREE.BoxGeometry(0.7, 0.08, 1.8);
    const deckMesh = new THREE.Mesh(deckGeo, this.hoverboardMaterial);
    deckMesh.castShadow = true;
    group.add(deckMesh);

    // Glowing side rails
    const railGeo = new THREE.BoxGeometry(0.06, 0.12, 1.7);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    
    const leftRail = new THREE.Mesh(railGeo, glowMat);
    leftRail.position.set(-0.35, 0.02, 0);
    group.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, glowMat);
    rightRail.position.set(0.35, 0.02, 0);
    group.add(rightRail);

    // Dual thrusters at back
    const thrusterGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.25, 8);
    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });

    const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    leftThruster.rotation.x = Math.PI / 2;
    leftThruster.position.set(-0.2, 0, 0.9);
    group.add(leftThruster);

    const rightThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    rightThruster.rotation.x = Math.PI / 2;
    rightThruster.position.set(0.2, 0, 0.9);
    group.add(rightThruster);

    return group;
  }

  public setHoverboardVisible(visible: boolean): void {
    this.hoverboardGroup.visible = visible;
  }

  public setSuperSneakersActive(active: boolean): void {
    if (active) {
      this.sneakerMaterial.color.setHex(CONSTANTS.COLORS.SNEAKERS);
      this.sneakerMaterial.emissive.setHex(0xff0044);
      this.sneakerMaterial.emissiveIntensity = 0.7;
    } else {
      this.sneakerMaterial.color.setHex(0xffffff);
      this.sneakerMaterial.emissive.setHex(0x000000);
      this.sneakerMaterial.emissiveIntensity = 0;
    }
  }

  /**
   * Procedural Locomotion State Animation
   */
  public updateAnimation(
    state: 'RUN' | 'JUMP' | 'SLIDE' | 'CRASH',
    speed: number,
    bankingAngle: number,
    groundY: number,
    dt: number
  ): void {
    // Keep blob shadow on ground and scale with jump height
    const heightAboveGround = Math.max(0, this.mesh.position.y - groundY);
    this.shadowMesh.position.y = -heightAboveGround + 0.03;
    const shadowScale = Math.max(0.4, 1.0 - heightAboveGround * 0.2);
    this.shadowMesh.scale.set(shadowScale, shadowScale, 1);
    (this.shadowMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0.15, 0.45 - heightAboveGround * 0.08);

    // Lateral banking into lane change
    this.mesh.rotation.z = -bankingAngle;
    this.mesh.rotation.y = bankingAngle * 0.6; // Slight yaw into turn

    if (state === 'CRASH') {
      // Tumble / crash spin
      this.mesh.rotation.x += dt * 8.0;
      this.mesh.rotation.z += dt * 4.0;
      return;
    }

    if (this.hoverboardGroup.visible) {
      // Hoverboard riding stance: side-facing skate stance
      this.animTime += dt * 3.0;
      this.hoverboardGroup.position.y = 0.08 + Math.sin(this.animTime * 4.0) * 0.04;
      this.torsoGroup.rotation.y = 0.45; // Angled surf stance
      this.leftLegGroup.rotation.x = -0.2;
      this.rightLegGroup.rotation.x = 0.2;
      this.leftArmGroup.rotation.x = -0.4;
      this.rightArmGroup.rotation.x = 0.4;
      return;
    }

    if (state === 'SLIDE') {
      // Tuck and roll / slide pose
      this.torsoGroup.position.y = 0.45;
      this.torsoGroup.rotation.x = 0.75; // Leaning forward low
      this.headGroup.rotation.x = -0.45;
      this.leftLegGroup.position.y = 0.35;
      this.rightLegGroup.position.y = 0.35;
      this.leftLegGroup.rotation.x = 1.35; // Legs bent forward
      this.rightLegGroup.rotation.x = 1.35;
      this.leftArmGroup.rotation.x = -0.9;
      this.rightArmGroup.rotation.x = -0.9;
      return;
    }

    if (state === 'JUMP') {
      // Aerodynamic jump pose
      this.torsoGroup.position.y = 0.95;
      this.torsoGroup.rotation.x = -0.15;
      this.headGroup.rotation.x = 0.15;
      this.leftLegGroup.rotation.x = 0.55; // Legs tucked back
      this.rightLegGroup.rotation.x = -0.35;
      this.leftArmGroup.rotation.x = -0.95; // Arms raised for balance
      this.rightArmGroup.rotation.x = -0.75;
      return;
    }

    // Default: Running locomotion cycle
    const runFreq = speed * 0.55; // Frequency scales with forward speed
    this.animTime += dt * runFreq;

    const legSwing = Math.sin(this.animTime) * 0.85;
    const armSwing = Math.sin(this.animTime) * 0.75;
    const bodyBob = Math.abs(Math.sin(this.animTime * 2.0)) * 0.08;

    this.torsoGroup.position.y = 0.95 + bodyBob;
    this.torsoGroup.rotation.x = 0.12; // Slight forward sprint lean
    this.torsoGroup.rotation.y = -legSwing * 0.08;

    this.leftLegGroup.rotation.x = legSwing;
    this.rightLegGroup.rotation.x = -legSwing;

    this.leftArmGroup.rotation.x = -armSwing;
    this.rightArmGroup.rotation.x = armSwing;
  }
}
