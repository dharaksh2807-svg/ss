import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';

export type ChaserActionState = 
  | 'IDLE'
  | 'WHISTLE_ALERT'
  | 'PURSUIT_RUN'
  | 'LUNGE_REACH'
  | 'CAUGHT_STAND';

export type ChaseState =
  | 'INTRO_CHASE'
  | 'DISTANT'
  | 'CLOSING_IN'
  | 'CLOSE_PURSUIT'
  | 'CAPTURE'
  | 'RESET';

export type ChaserMode = 
  | 'INTRO'
  | 'STANDBY'
  | 'STUMBLE'
  | 'NEAR_MISS'
  | 'CAUGHT';

export type ChaserArchetype =
  | 'OFFICER'
  | 'RAHUL_RIVAL'
  | 'MODI_RIVAL'
  | 'VIP_SECURITY';

export type ChaserCosmeticReaction = 
  | 'NONE'
  | 'NAMASTE_SHRUG'
  | 'SELFIE_FLASH'
  | 'CAMERA_WAVE'
  | 'MICROPHONE_DUCK'
  | 'PRESS_CONFERENCE_ENTER';

export class ChaserModel {
  public mesh: THREE.Group;

  // Rig hierarchy
  private rootGroup: THREE.Group;
  private hipsGroup: THREE.Group;
  private spineGroup: THREE.Group;
  private headGroup: THREE.Group;
  private leftArmGroup: THREE.Group;
  private leftForearmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private rightForearmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private leftCalfGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private rightCalfGroup: THREE.Group;
  private shadowMesh: THREE.Mesh;

  // Visual archetype meshes & state
  private archetype: ChaserArchetype = 'OFFICER';
  private torsoMesh?: THREE.Mesh;
  private pelvisMesh?: THREE.Mesh;
  private tieMesh?: THREE.Mesh;
  private badgeMesh?: THREE.Mesh;

  // Archetype Accessory Groups
  private officerCapGroup?: THREE.Group;
  private officerRadioGroup?: THREE.Group;
  private officerEpaulettesGroup?: THREE.Group;
  private officerWhistleMesh?: THREE.Mesh;
  private modiHeadGroup?: THREE.Group;
  private modiChestGroup?: THREE.Group;
  private rahulHeadGroup?: THREE.Group;
  private vipHeadGroup?: THREE.Group;
  private selfiePhoneGroup?: THREE.Group;
  private selfieFlashMesh?: THREE.Mesh;

  // Cosmetic Rivalry Reactions
  private cosmeticReaction: ChaserCosmeticReaction = 'NONE';
  private cosmeticTimer: number = 0;
  private cosmeticDuration: number = 1.6;

  // State management
  private actionState: ChaserActionState = 'IDLE';
  private mode: ChaserMode = 'STANDBY';
  private chaseState: ChaseState = 'DISTANT';
  private animTime: number = 0;

  // Relative follow tracking
  public currentDistanceZ: number = 14.0; // Distance behind runner (positive = behind)
  private targetDistanceZ: number = 14.0;
  private reactionTimer: number = 0;
  private reactionDuration: number = 0;
  private cleanRunTimer: number = 0;
  private cleanRunDuration: number = 1.8; // Duration of clean running required to shake off pursuit
  private catchUpTimer: number = 0;
  private catchUpDuration: number = 0.8;
  private lastStumbleTimestamp: number = 0;
  private isWhistleBlownThisEvent: boolean = false;

  // Smoothing
  private currentX: number = 0;
  private currentY: number = 0;

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.name = 'Chaser_OfficerThorne';

    // 1. Build Materials
    const uniformMat = new THREE.MeshStandardMaterial({
      color: 0x1a2b49, // Deep transit navy
      roughness: 0.46,
      metalness: 0.08
    });

    const badgeGoldMat = new THREE.MeshStandardMaterial({
      color: 0xf5b700, // Rich security gold
      roughness: 0.28,
      metalness: 0.75
    });

    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Dark charcoal leather
      roughness: 0.70,
      metalness: 0.12
    });

    const radioMat = new THREE.MeshStandardMaterial({
      color: 0x27272a, // Matte polymer
      roughness: 0.55,
      metalness: 0.20
    });

    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x09090b, // High-gloss polished black
      roughness: 0.12,
      metalness: 0.70
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf2c49b, // Warm skin tone
      roughness: 0.62,
      metalness: 0.02
    });

    const shirtWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Crisp collar
      roughness: 0.55
    });

    const tieMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Dark slate tie
      roughness: 0.65
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Charcoal patrol trousers
      roughness: 0.60
    });

    // 2. Build Hierarchy
    this.rootGroup = new THREE.Group();
    this.mesh.add(this.rootGroup);

    // Ground shadow
    const shadowGeo = new THREE.PlaneGeometry(0.75, 1.35);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.42,
      depthWrite: false
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.02;
    this.rootGroup.add(this.shadowMesh);

    // Hips Group
    this.hipsGroup = new THREE.Group();
    this.hipsGroup.position.y = 0.98; // Slightly taller than runner
    this.rootGroup.add(this.hipsGroup);

    // Pelvis
    const pelvisGeo = new THREE.CylinderGeometry(0.26, 0.23, 0.26, 14);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, pantsMat);
    pelvisMesh.castShadow = true;
    pelvisMesh.receiveShadow = true;
    this.pelvisMesh = pelvisMesh;
    this.hipsGroup.add(pelvisMesh);

    // Duty Belt
    const beltGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.07, 14);
    const beltMesh = new THREE.Mesh(beltGeo, beltMat);
    beltMesh.position.y = 0.10;
    this.hipsGroup.add(beltMesh);

    // Belt Gold Buckle
    const buckleGeo = new THREE.BoxGeometry(0.09, 0.06, 0.04);
    const buckleMesh = new THREE.Mesh(buckleGeo, badgeGoldMat);
    buckleMesh.position.set(0, 0.10, 0.27);
    this.hipsGroup.add(buckleMesh);

    // Walkie-Talkie on left hip
    this.officerRadioGroup = new THREE.Group();
    const radioGeo = new THREE.BoxGeometry(0.08, 0.14, 0.06);
    const radioMesh = new THREE.Mesh(radioGeo, radioMat);
    radioMesh.position.set(-0.28, 0.10, 0.05);
    radioMesh.rotation.z = 0.15;
    this.officerRadioGroup.add(radioMesh);

    // Radio Antenna
    const antGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.12, 6);
    const antMesh = new THREE.Mesh(antGeo, radioMat);
    antMesh.position.set(-0.28, 0.22, 0.05);
    this.officerRadioGroup.add(antMesh);
    this.hipsGroup.add(this.officerRadioGroup);

    // Spine & Torso Group
    this.spineGroup = new THREE.Group();
    this.spineGroup.position.set(0, 0.16, 0);
    this.hipsGroup.add(this.spineGroup);

    // Officer Jacket (Broad shoulders tapering to waist)
    const torsoHeight = 0.60;
    const torsoGeo = new THREE.CylinderGeometry(0.31, 0.25, torsoHeight, 16);
    const torsoMesh = new THREE.Mesh(torsoGeo, uniformMat);
    torsoMesh.position.y = torsoHeight * 0.5;
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    this.torsoMesh = torsoMesh;
    this.spineGroup.add(torsoMesh);

    // White Shirt V-Neck & Dark Tie
    const shirtVGeo = new THREE.BoxGeometry(0.12, 0.14, 0.05);
    const shirtVMesh = new THREE.Mesh(shirtVGeo, shirtWhiteMat);
    shirtVMesh.position.set(0, torsoHeight * 0.78, 0.27);
    this.spineGroup.add(shirtVMesh);

    const tieGeo = new THREE.BoxGeometry(0.05, 0.22, 0.03);
    const tieMesh = new THREE.Mesh(tieGeo, tieMat);
    tieMesh.position.set(0, torsoHeight * 0.68, 0.29);
    this.tieMesh = tieMesh;
    this.spineGroup.add(tieMesh);

    // Gold Buttons down jacket
    for (let b = 0; b < 3; b++) {
      const btnGeo = new THREE.SphereGeometry(0.022, 8, 8);
      const btnMesh = new THREE.Mesh(btnGeo, badgeGoldMat);
      btnMesh.position.set(0, torsoHeight * (0.35 + b * 0.14), 0.28);
      this.spineGroup.add(btnMesh);
    }

    // Security Gold Shield Badge on chest
    const badgeGeo = new THREE.BoxGeometry(0.08, 0.10, 0.02);
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeGoldMat);
    badgeMesh.position.set(0.14, torsoHeight * 0.72, 0.28);
    badgeMesh.rotation.y = -0.15;
    this.badgeMesh = badgeMesh;
    this.spineGroup.add(badgeMesh);

    // Gold Epaulettes (Shoulder rank straps)
    this.officerEpaulettesGroup = new THREE.Group();
    const epauletteGeo = new THREE.BoxGeometry(0.12, 0.03, 0.18);
    const leftEpaulette = new THREE.Mesh(epauletteGeo, badgeGoldMat);
    leftEpaulette.position.set(-0.29, torsoHeight * 0.94, 0);
    leftEpaulette.rotation.z = -0.12;
    this.officerEpaulettesGroup.add(leftEpaulette);

    const rightEpaulette = new THREE.Mesh(epauletteGeo, badgeGoldMat);
    rightEpaulette.position.set(0.29, torsoHeight * 0.94, 0);
    rightEpaulette.rotation.z = 0.12;
    this.officerEpaulettesGroup.add(rightEpaulette);
    this.spineGroup.add(this.officerEpaulettesGroup);

    // Modi Chest Pocket Square (for MODI_RIVAL)
    this.modiChestGroup = new THREE.Group();
    this.modiChestGroup.name = 'chaser_modi_chest';
    this.modiChestGroup.visible = false;
    const saffronMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.6 });
    const pocketSquare = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), saffronMat);
    pocketSquare.position.set(-0.14, torsoHeight * 0.72, 0.28);
    this.modiChestGroup.add(pocketSquare);
    this.spineGroup.add(this.modiChestGroup);

    // Head Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, torsoHeight + 0.08, 0);
    this.spineGroup.add(this.headGroup);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.10, 0.11, 0.12, 10);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.y = 0.04;
    this.headGroup.add(neckMesh);

    // Head / Face
    const headGeo = new THREE.BoxGeometry(0.28, 0.30, 0.26);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 0.22;
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Officer Peaked Cap Group (Crown, Band, Crest, Visor)
    this.officerCapGroup = new THREE.Group();
    const capCrownGeo = new THREE.CylinderGeometry(0.24, 0.20, 0.16, 16);
    const capCrown = new THREE.Mesh(capCrownGeo, uniformMat);
    capCrown.position.set(0, 0.38, 0);
    capCrown.rotation.x = -0.05;
    this.officerCapGroup.add(capCrown);

    const capBandGeo = new THREE.CylinderGeometry(0.205, 0.205, 0.04, 16);
    const capBand = new THREE.Mesh(capBandGeo, badgeGoldMat);
    capBand.position.set(0, 0.32, 0.01);
    this.officerCapGroup.add(capBand);

    const crestGeo = new THREE.BoxGeometry(0.06, 0.06, 0.02);
    const crestMesh = new THREE.Mesh(crestGeo, badgeGoldMat);
    crestMesh.position.set(0, 0.35, 0.21);
    this.officerCapGroup.add(crestMesh);

    const visorGeo = new THREE.CylinderGeometry(0.23, 0.24, 0.025, 14, 1, false, 0, Math.PI);
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.31, 0.14);
    visorMesh.rotation.x = 0.25;
    this.officerCapGroup.add(visorMesh);
    this.headGroup.add(this.officerCapGroup);

    // Narendra Modi Rival Head Accessories (Hair, Beard, Glasses, Mandarin Collar)
    this.modiHeadGroup = new THREE.Group();
    this.modiHeadGroup.name = 'chaser_modi_head';
    this.modiHeadGroup.visible = false;
    const silverHairMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
    const modiHair = new THREE.Mesh(new THREE.SphereGeometry(0.23, 8, 8), silverHairMat);
    modiHair.position.set(0, 0.36, -0.04);
    this.modiHeadGroup.add(modiHair);

    const modiBeard = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.18), silverHairMat);
    modiBeard.position.set(0, 0.14, 0.14);
    this.modiHeadGroup.add(modiBeard);

    const goldSpecsMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.8 });
    const modiSpecs = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.04), goldSpecsMat);
    modiSpecs.position.set(0, 0.26, 0.16);
    this.modiHeadGroup.add(modiSpecs);

    const modiCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.10, 8), saffronMat);
    modiCollar.position.set(0, 0.02, 0);
    this.modiHeadGroup.add(modiCollar);
    this.headGroup.add(this.modiHeadGroup);

    // Rahul Gandhi Rival Head Accessories (Dark Hair, Open Collar)
    this.rahulHeadGroup = new THREE.Group();
    this.rahulHeadGroup.name = 'chaser_rahul_head';
    this.rahulHeadGroup.visible = false;
    const darkHairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const rahulHair = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), darkHairMat);
    rahulHair.position.set(0, 0.36, -0.02);
    this.rahulHeadGroup.add(rahulHair);

    const rahulCollar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.10, 0.06), shirtWhiteMat);
    rahulCollar.position.set(0, 0.02, 0.12);
    this.rahulHeadGroup.add(rahulCollar);
    this.headGroup.add(this.rahulHeadGroup);

    // VIP Security Head Accessories (Dark Sunglasses, Earpiece)
    this.vipHeadGroup = new THREE.Group();
    this.vipHeadGroup.name = 'chaser_vip_head';
    this.vipHeadGroup.visible = false;
    const darkGlassesMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2, metalness: 0.8 });
    const sunglasses = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.04), darkGlassesMat);
    sunglasses.position.set(0, 0.26, 0.15);
    this.vipHeadGroup.add(sunglasses);
    this.headGroup.add(this.vipHeadGroup);
    visorMesh.position.set(0, 0.31, 0.14);
    visorMesh.rotation.x = 0.25;
    this.headGroup.add(visorMesh);

    // Articulated Arms
    const shoulderOffset = 0.34;
    const armY = torsoHeight * 0.90;

    // Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-shoulderOffset, armY, 0);
    this.spineGroup.add(this.leftArmGroup);

    const upperArmGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.32, 10);
    const leftUpperArmMesh = new THREE.Mesh(upperArmGeo, uniformMat);
    leftUpperArmMesh.position.y = -0.16;
    leftUpperArmMesh.castShadow = true;
    this.leftArmGroup.add(leftUpperArmMesh);

    this.leftForearmGroup = new THREE.Group();
    this.leftForearmGroup.position.set(0, -0.32, 0);
    this.leftArmGroup.add(this.leftForearmGroup);

    const forearmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.30, 10);
    const leftForearmMesh = new THREE.Mesh(forearmGeo, uniformMat);
    leftForearmMesh.position.y = -0.15;
    leftForearmMesh.castShadow = true;
    this.leftForearmGroup.add(leftForearmMesh);

    const handGeo = new THREE.BoxGeometry(0.09, 0.11, 0.06);
    const leftHandMesh = new THREE.Mesh(handGeo, skinMat);
    leftHandMesh.position.y = -0.32;
    this.leftForearmGroup.add(leftHandMesh);

    // Right Arm (holds Whistle)
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(shoulderOffset, armY, 0);
    this.spineGroup.add(this.rightArmGroup);

    const rightUpperArmMesh = new THREE.Mesh(upperArmGeo, uniformMat);
    rightUpperArmMesh.position.y = -0.16;
    rightUpperArmMesh.castShadow = true;
    this.rightArmGroup.add(rightUpperArmMesh);

    this.rightForearmGroup = new THREE.Group();
    this.rightForearmGroup.position.set(0, -0.32, 0);
    this.rightArmGroup.add(this.rightForearmGroup);

    const rightForearmMesh = new THREE.Mesh(forearmGeo, uniformMat);
    rightForearmMesh.position.y = -0.15;
    rightForearmMesh.castShadow = true;
    this.rightForearmGroup.add(rightForearmMesh);

    const rightHandMesh = new THREE.Mesh(handGeo, skinMat);
    rightHandMesh.position.y = -0.32;
    this.rightForearmGroup.add(rightHandMesh);

    // Whistle Mesh in right hand
    const whistleGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.08, 8);
    const whistleMesh = new THREE.Mesh(whistleGeo, badgeGoldMat);
    whistleMesh.position.set(0, -0.34, 0.04);
    whistleMesh.rotation.x = Math.PI / 2;
    this.officerWhistleMesh = whistleMesh;
    this.rightForearmGroup.add(whistleMesh);

    // Selfie Smartphone for Rivalry Gags
    this.selfiePhoneGroup = new THREE.Group();
    this.selfiePhoneGroup.name = 'chaser_selfie_phone';
    this.selfiePhoneGroup.visible = false;
    const phoneMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.02), badgeGoldMat);
    phoneMesh.position.set(0, -0.34, 0.08);
    phoneMesh.rotation.x = Math.PI * 0.45;
    this.selfiePhoneGroup.add(phoneMesh);

    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.selfieFlashMesh = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), flashMat);
    this.selfieFlashMesh.position.set(0, -0.34, 0.11);
    this.selfieFlashMesh.visible = false;
    this.selfiePhoneGroup.add(this.selfieFlashMesh);
    this.rightForearmGroup.add(this.selfiePhoneGroup);

    // Articulated Legs
    const hipOffset = 0.15;

    // Left Leg
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-hipOffset, 0, 0);
    this.hipsGroup.add(this.leftLegGroup);

    const thighGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.44, 10);
    const leftThighMesh = new THREE.Mesh(thighGeo, pantsMat);
    leftThighMesh.position.y = -0.22;
    leftThighMesh.castShadow = true;
    this.leftLegGroup.add(leftThighMesh);

    this.leftCalfGroup = new THREE.Group();
    this.leftCalfGroup.position.set(0, -0.44, 0);
    this.leftLegGroup.add(this.leftCalfGroup);

    const calfGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.40, 10);
    const leftCalfMesh = new THREE.Mesh(calfGeo, pantsMat);
    leftCalfMesh.position.y = -0.20;
    leftCalfMesh.castShadow = true;
    this.leftCalfGroup.add(leftCalfMesh);

    // Left Patrol Boot
    const bootGeo = new THREE.BoxGeometry(0.13, 0.14, 0.28);
    const leftBootMesh = new THREE.Mesh(bootGeo, visorMat);
    leftBootMesh.position.set(0, -0.42, 0.06);
    this.leftCalfGroup.add(leftBootMesh);

    // Right Leg
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(hipOffset, 0, 0);
    this.hipsGroup.add(this.rightLegGroup);

    const rightThighMesh = new THREE.Mesh(thighGeo, pantsMat);
    rightThighMesh.position.y = -0.22;
    rightThighMesh.castShadow = true;
    this.rightLegGroup.add(rightThighMesh);

    this.rightCalfGroup = new THREE.Group();
    this.rightCalfGroup.position.set(0, -0.44, 0);
    this.rightLegGroup.add(this.rightCalfGroup);

    const rightCalfMesh = new THREE.Mesh(calfGeo, pantsMat);
    rightCalfMesh.position.y = -0.20;
    rightCalfMesh.castShadow = true;
    this.rightCalfGroup.add(rightCalfMesh);

    // Right Patrol Boot
    const rightBootMesh = new THREE.Mesh(bootGeo, visorMat);
    rightBootMesh.position.set(0, -0.42, 0.06);
    this.rightCalfGroup.add(rightBootMesh);

    // Initial standby configuration
    this.reset();
  }

  public getArchetype(): ChaserArchetype {
    return this.archetype;
  }

  public getChaserArchetype(): ChaserArchetype {
    return this.archetype;
  }

  public setChaserArchetype(archetype: ChaserArchetype): void {
    this.archetype = archetype;
    this.mesh.userData.archetype = archetype;

    const isModi = archetype === 'MODI_RIVAL';
    const isRahul = archetype === 'RAHUL_RIVAL';
    const isVip = archetype === 'VIP_SECURITY';
    const isOfficer = archetype === 'OFFICER';

    // Toggle accessory group visibility cleanly
    if (this.officerCapGroup) this.officerCapGroup.visible = isOfficer;
    if (this.officerRadioGroup) this.officerRadioGroup.visible = isOfficer;
    if (this.officerEpaulettesGroup) this.officerEpaulettesGroup.visible = isOfficer;
    if (this.officerWhistleMesh) this.officerWhistleMesh.visible = isOfficer;
    if (this.tieMesh) this.tieMesh.visible = isOfficer;
    if (this.badgeMesh) this.badgeMesh.visible = isOfficer;

    if (this.modiHeadGroup) this.modiHeadGroup.visible = isModi;
    if (this.modiChestGroup) this.modiChestGroup.visible = isModi;
    if (this.rahulHeadGroup) this.rahulHeadGroup.visible = isRahul;
    if (this.vipHeadGroup) this.vipHeadGroup.visible = isVip;

    if (isModi) {
      // Saffron/orange waistcoat over white kurta
      if (this.torsoMesh) (this.torsoMesh.material as THREE.MeshStandardMaterial).color.setHex(0xea580c);
      if (this.pelvisMesh) (this.pelvisMesh.material as THREE.MeshStandardMaterial).color.setHex(0xffffff);
    } else if (isRahul) {
      // Signature white polo shirt and athletic navy track trousers
      if (this.torsoMesh) (this.torsoMesh.material as THREE.MeshStandardMaterial).color.setHex(0xf8fafc);
      if (this.pelvisMesh) (this.pelvisMesh.material as THREE.MeshStandardMaterial).color.setHex(0x1e3a8a);
    } else if (isVip) {
      // Dark slate VIP security safari suit
      if (this.torsoMesh) (this.torsoMesh.material as THREE.MeshStandardMaterial).color.setHex(0x1e293b);
      if (this.pelvisMesh) (this.pelvisMesh.material as THREE.MeshStandardMaterial).color.setHex(0x1e293b);
    } else {
      // Standard Transit Officer Thorne
      if (this.torsoMesh) (this.torsoMesh.material as THREE.MeshStandardMaterial).color.setHex(0x1a2b49);
      if (this.pelvisMesh) (this.pelvisMesh.material as THREE.MeshStandardMaterial).color.setHex(0x334155);
    }
  }

  public triggerCosmeticReaction(reaction: ChaserCosmeticReaction, duration: number = 1.6): void {
    this.cosmeticReaction = reaction;
    this.cosmeticDuration = duration;
    this.cosmeticTimer = reaction === 'NONE' ? 0 : duration;
    if (this.selfiePhoneGroup) {
      this.selfiePhoneGroup.visible = (reaction === 'SELFIE_FLASH');
    }
  }

  public getCosmeticReaction(): ChaserCosmeticReaction {
    return this.cosmeticTimer > 0 ? this.cosmeticReaction : 'NONE';
  }

  public reset(): void {
    this.setChaseState('RESET');
  }

  public setChaseState(state: ChaseState): void {
    if (state !== 'RESET' && this.chaseState === state) {
      return;
    }

    this.chaseState = state;
    this.isWhistleBlownThisEvent = false;

    switch (state) {
      case 'INTRO_CHASE':
        this.mode = 'INTRO';
        this.mesh.visible = true;
        this.actionState = 'WHISTLE_ALERT';
        this.currentDistanceZ = 3.6;
        this.targetDistanceZ = 3.0;
        this.currentX = 0.65; // Positioned authoritatively in right track lane during intro
        this.reactionTimer = 0;
        this.cleanRunTimer = 0;
        break;

      case 'DISTANT':
        this.mode = 'STANDBY';
        this.targetDistanceZ = 14.0;
        this.actionState = 'PURSUIT_RUN';
        this.cleanRunTimer = 0;
        this.catchUpTimer = 0;
        break;

      case 'CLOSING_IN':
        this.mode = 'STUMBLE';
        this.mesh.visible = true;
        this.actionState = 'LUNGE_REACH';
        // Snap closer if lingering back in standby (14m) so lunge immediately punches into camera frame
        if (this.currentDistanceZ > 6.0) {
          this.currentDistanceZ = 4.6;
        }
        this.targetDistanceZ = 3.0;
        this.catchUpTimer = 0;
        this.catchUpDuration = 0.8;
        this.reactionTimer = 0;
        this.reactionDuration = this.cleanRunDuration;
        EventBus.getInstance().emit(EVENTS.CHASER_WHISTLE);
        EventBus.getInstance().emit(EVENTS.CHASER_PROXIMITY_WARNING || 'CHASER_PROXIMITY_WARNING');
        break;

      case 'CLOSE_PURSUIT':
        this.mode = 'STUMBLE';
        this.mesh.visible = true;
        this.actionState = 'LUNGE_REACH';
        this.targetDistanceZ = 2.4; // Hot on runner's heels
        this.cleanRunTimer = 0;
        break;

      case 'CAPTURE':
        this.mode = 'CAUGHT';
        this.mesh.visible = true;
        this.targetDistanceZ = 1.8;
        this.actionState = 'CAUGHT_STAND';
        EventBus.getInstance().emit(EVENTS.CHASER_CAPTURED || 'CHASER_CAPTURED');
        break;

      case 'RESET':
        this.chaseState = 'DISTANT';
        this.mode = 'STANDBY';
        this.currentDistanceZ = 14.0;
        this.targetDistanceZ = 14.0;
        this.reactionTimer = 0;
        this.reactionDuration = 0;
        this.cleanRunTimer = 0;
        this.catchUpTimer = 0;
        this.animTime = 0;
        this.isWhistleBlownThisEvent = false;
        this.actionState = 'PURSUIT_RUN';
        this.mesh.visible = false;
        break;
    }
  }

  public getChaseState(): ChaseState {
    return this.chaseState;
  }

  public isCatchUpMode(): boolean {
    return this.chaseState === 'CLOSING_IN' || this.chaseState === 'CLOSE_PURSUIT';
  }

  public setCleanRunDuration(sec: number): void {
    this.cleanRunDuration = Math.max(0.5, sec);
  }

  public getCleanRunDuration(): number {
    return this.cleanRunDuration;
  }

  public onMinorStumble(): { wasClose: boolean; captured: boolean } {
    if (this.chaseState === 'CAPTURE') {
      return { wasClose: true, captured: true };
    }

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (this.lastStumbleTimestamp > 0 && now - this.lastStumbleTimestamp < 120) {
      return {
        wasClose: this.isCatchUpMode(),
        captured: false
      };
    }
    this.lastStumbleTimestamp = now;

    if (this.isCatchUpMode()) {
      this.setChaseState('CAPTURE');
      return { wasClose: true, captured: true };
    } else {
      this.setChaseState('CLOSING_IN');
      return { wasClose: false, captured: false };
    }
  }

  public setMode(mode: ChaserMode): void {
    this.isWhistleBlownThisEvent = false;

    if (mode === 'INTRO') {
      this.setChaseState('INTRO_CHASE');
    } else if (mode === 'STANDBY') {
      this.setChaseState('DISTANT');
    } else if (mode === 'STUMBLE') {
      this.setChaseState('CLOSING_IN');
    } else if (mode === 'NEAR_MISS') {
      this.mode = 'NEAR_MISS';
      this.mesh.visible = true;
      this.actionState = 'PURSUIT_RUN';
      if (this.currentDistanceZ > 7.5) {
        this.currentDistanceZ = 7.5;
      }
      this.targetDistanceZ = 5.6;
      this.reactionTimer = 0;
      this.reactionDuration = 1.0;
      EventBus.getInstance().emit(EVENTS.CHASER_WHISTLE);
    } else if (mode === 'CAUGHT') {
      this.setChaseState('CAPTURE');
    }
  }

  public getMode(): ChaserMode {
    return this.mode;
  }

  public triggerStumbleReaction(): void {
    this.onMinorStumble();
  }

  public triggerNearMissReaction(): void {
    if (this.chaseState === 'DISTANT') {
      this.setMode('NEAR_MISS');
    }
  }

  public triggerCaughtReaction(): void {
    if (this.chaseState === 'CAPTURE') return;
    this.setChaseState('CAPTURE');
  }

  /**
   * Updates position, tracking, and procedural articulation
   */
  public update(
    dt: number,
    playerPos: THREE.Vector3,
    playerSpeed: number,
    playerGroundY: number = CONSTANTS.PLAYER_BASE_Y
  ): void {
    this.animTime += dt * Math.max(1.0, (playerSpeed / CONSTANTS.INITIAL_SPEED) * 12.0);

    // 1. Manage Reaction Timers & Dynamic Chase State Transitions
    if (this.chaseState === 'CLOSING_IN') {
      this.catchUpTimer += dt;
      this.reactionTimer += dt;
      if (this.currentDistanceZ <= 3.4 || this.catchUpTimer >= this.catchUpDuration) {
        this.setChaseState('CLOSE_PURSUIT');
      }
      if (this.reactionTimer >= this.reactionDuration) {
        this.setChaseState('DISTANT');
      }
    } else if (this.chaseState === 'CLOSE_PURSUIT') {
      this.cleanRunTimer += dt;
      this.reactionTimer += dt;
      if (this.cleanRunTimer >= this.cleanRunDuration || this.reactionTimer >= this.reactionDuration) {
        // Player ran cleanly! Guard gradually retreats back to DISTANT
        this.setChaseState('DISTANT');
      }
    } else if (this.mode === 'NEAR_MISS') {
      this.reactionTimer += dt;
      if (this.reactionTimer >= this.reactionDuration) {
        this.setChaseState('DISTANT');
      }
    }

    // 2. Smoothly approach target follow distance
    const distLerp = 1.0 - Math.exp(-6.0 * dt);
    this.currentDistanceZ += (this.targetDistanceZ - this.currentDistanceZ) * distLerp;

    // 3. Coordinate World Position
    // Track player's current lane with smooth pursuit delay
    const xLerp = 1.0 - Math.exp(-8.0 * dt);
    this.currentX += (playerPos.x - this.currentX) * xLerp;

    // Track ground elevation smoothly (rails vs train roofs)
    const yLerp = 1.0 - Math.exp(-12.0 * dt);
    this.currentY += (playerGroundY - this.currentY) * yLerp;

    const chaserZ = playerPos.z + this.currentDistanceZ;
    this.mesh.position.set(this.currentX, this.currentY, chaserZ);

    // Frustum / Distance Visibility optimization
    // If chaser is far back in standby (> 13.5m) and in DISTANT state, hide mesh to save draw calls.
    // Also hide if passing directly through the camera plane to prevent camera lens clipping.
    const distToCamZ = Math.abs(this.currentDistanceZ - CONSTANTS.CAMERA_OFFSET_Z);
    if ((this.chaseState === 'DISTANT' && this.currentDistanceZ >= 13.5) || distToCamZ < 1.6) {
      this.mesh.visible = false;
    } else {
      this.mesh.visible = true;
    }

    // Face forward along running direction (-Z in Metro Runner 3D)
    this.mesh.rotation.y = Math.PI;

    // 4. Procedural Articulation Animation
    this.animatePose(dt, playerSpeed);
  }

  private animatePose(dt: number, playerSpeed: number): void {
    const t = this.animTime;
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);

    switch (this.actionState) {
      case 'IDLE': {
        // Alert standing stance
        this.hipsGroup.position.x = 0;
        this.hipsGroup.position.y = 0.98 + Math.sin(t * 0.25) * 0.015;
        this.spineGroup.rotation.set(0.04, 0, 0);
        this.headGroup.rotation.set(-0.04, Math.sin(t * 0.2) * 0.08, 0);
        this.leftArmGroup.rotation.set(0.12, 0, -0.15);
        this.leftForearmGroup.rotation.set(-0.35, 0, 0);
        this.rightArmGroup.rotation.set(0.12, 0, 0.15);
        this.rightForearmGroup.rotation.set(-0.35, 0, 0);
        this.leftLegGroup.rotation.set(0, 0, -0.06);
        this.rightLegGroup.rotation.set(0, 0, 0.06);
        this.leftCalfGroup.rotation.set(0, 0, 0);
        this.rightCalfGroup.rotation.set(0, 0, 0);
        break;
      }

      case 'WHISTLE_ALERT': {
        // Dramatic intro stance: blowing whistle with right hand, pointing with left hand
        this.hipsGroup.position.x = 0;
        this.hipsGroup.position.y = 0.98;
        this.spineGroup.rotation.set(0.08, 0.15, 0);
        this.headGroup.rotation.set(-0.06, -0.12, 0);

        // Right hand raises whistle directly to mouth
        this.rightArmGroup.rotation.set(0.85, 0.35, 0.40);
        this.rightForearmGroup.rotation.set(-1.75, 0.45, 0);

        // Left arm extended pointing authoritatively forward
        this.leftArmGroup.rotation.set(-1.25, -0.20, -0.25);
        this.leftForearmGroup.rotation.set(-0.25, 0, 0);

        // Solid grounded stance
        this.leftLegGroup.rotation.set(0.18, 0, 0);
        this.leftCalfGroup.rotation.set(0.10, 0, 0);
        this.rightLegGroup.rotation.set(-0.25, 0, 0);
        this.rightCalfGroup.rotation.set(0.20, 0, 0);
        break;
      }

      case 'PURSUIT_RUN': {
        // Dynamic pursuit running cycle
        const bob = -Math.cos(2.0 * t) * 0.045;
        this.hipsGroup.position.x = 0;
        this.hipsGroup.position.y = 0.98 + bob;
        this.hipsGroup.rotation.set(0, -sinT * 0.08, sinT * 0.035);

        const forwardLean = 0.22;
        this.spineGroup.rotation.set(forwardLean, sinT * 0.10, 0);
        this.headGroup.rotation.set(-forwardLean * 0.7, -sinT * 0.08, 0);

        // Alternating leg drive
        const legSwing = sinT * 0.70;
        this.leftLegGroup.rotation.set(legSwing, 0, 0);
        this.rightLegGroup.rotation.set(-legSwing, 0, 0);

        const leftKnee = Math.max(0, Math.sin(t - 0.35)) * 1.10;
        const rightKnee = Math.max(0, Math.sin(t + Math.PI - 0.35)) * 1.10;
        this.leftCalfGroup.rotation.set(0.08 + leftKnee, 0, 0);
        this.rightCalfGroup.rotation.set(0.08 + rightKnee, 0, 0);

        // Pumping arms
        const armSwing = sinT * 0.65;
        this.leftArmGroup.rotation.set(-armSwing + 0.12, 0, -0.18);
        this.rightArmGroup.rotation.set(armSwing + 0.12, 0, 0.18);

        this.leftForearmGroup.rotation.set(-0.60 - Math.max(0, -armSwing) * 0.40, 0, 0);
        this.rightForearmGroup.rotation.set(-0.60 - Math.max(0, armSwing) * 0.40, 0, 0);
        break;
      }

      case 'LUNGE_REACH': {
        // Aggressive forward lunge reaching to tag runner during a stumble
        const bob = -Math.cos(2.0 * t) * 0.05;
        this.hipsGroup.position.x = 0.36;
        this.hipsGroup.position.y = 0.95 + bob;

        const heavyLean = 0.44; // Deep forward reach
        this.spineGroup.rotation.set(heavyLean, 0.05, 0);
        this.headGroup.rotation.set(-heavyLean * 0.85, 0, 0);

        // Left arm raised with whistle
        this.leftArmGroup.rotation.set(0.55, 0.25, -0.30);
        this.leftForearmGroup.rotation.set(-1.35, 0, 0);

        // Right arm extended far forward trying to grab runner
        this.rightArmGroup.rotation.set(-1.45, 0.15, 0.10);
        this.rightForearmGroup.rotation.set(-0.20, 0, 0);

        // Sprinting stride
        const legSwing = sinT * 0.85;
        this.leftLegGroup.rotation.set(legSwing, 0, 0);
        this.rightLegGroup.rotation.set(-legSwing, 0, 0);
        this.leftCalfGroup.rotation.set(0.12 + Math.max(0, Math.sin(t - 0.35)) * 1.25, 0, 0);
        this.rightCalfGroup.rotation.set(0.12 + Math.max(0, Math.sin(t + Math.PI - 0.35)) * 1.25, 0, 0);
        break;
      }

      case 'CAUGHT_STAND': {
        // Hands on hips triumph / authoritative caught stance
        this.hipsGroup.position.x = 0;
        this.hipsGroup.position.y = 0.98;
        this.spineGroup.rotation.set(-0.06, 0, 0);
        this.headGroup.rotation.set(0.04, Math.sin(t * 0.35) * 0.12, 0); // Head shake

        // Hands planted on hips
        this.leftArmGroup.rotation.set(0.35, 0, -0.45);
        this.leftForearmGroup.rotation.set(-1.15, 0, 0);
        this.rightArmGroup.rotation.set(0.35, 0, 0.45);
        this.rightForearmGroup.rotation.set(-1.15, 0, 0);

        this.leftLegGroup.rotation.set(0.10, 0, -0.08);
        this.rightLegGroup.rotation.set(0.10, 0, 0.08);
        this.leftCalfGroup.rotation.set(0, 0, 0);
        this.rightCalfGroup.rotation.set(0, 0, 0);
        break;
      }
    }

    // 5. Overlay Cosmetic Rivalry Reactions
    if (this.cosmeticTimer > 0) {
      this.cosmeticTimer -= dt;
      const progress = Math.max(0, this.cosmeticTimer / this.cosmeticDuration);
      const u = Math.sin(Math.PI * (1.0 - progress)); // Smooth bell curve easing

      switch (this.cosmeticReaction) {
        case 'NAMASTE_SHRUG': {
          if (this.archetype === 'MODI_RIVAL') {
            // Dramatic victory Namaste wave while running
            this.rightArmGroup.rotation.set(1.15 * u, 0.35 * u, 0.15 * u);
            this.rightForearmGroup.rotation.set(-1.45 * u, 0, 0);
            this.headGroup.rotation.y = Math.sin(t * 3.5) * 0.18 * u;
          } else if (this.archetype === 'RAHUL_RIVAL') {
            // Comedic shrug: arms thrown wide, palms open, head tilted
            this.leftArmGroup.rotation.set(0.35 * u, 0, -0.65 * u);
            this.rightArmGroup.rotation.set(0.35 * u, 0, 0.65 * u);
            this.leftForearmGroup.rotation.set(-0.85 * u, 0, 0);
            this.rightForearmGroup.rotation.set(-0.85 * u, 0, 0);
            this.headGroup.rotation.z = -0.22 * u;
          }
          break;
        }

        case 'SELFIE_FLASH': {
          // Raises phone with camera flash snapshot
          this.rightArmGroup.rotation.set(-1.25 * u, 0.25 * u, 0.15 * u);
          this.rightForearmGroup.rotation.set(-0.25 * u, 0, 0);
          if (this.selfiePhoneGroup) {
            this.selfiePhoneGroup.visible = true;
          }
          if (this.selfieFlashMesh) {
            this.selfieFlashMesh.visible = u > 0.5 && Math.sin(t * 24.0) > 0;
          }
          this.headGroup.rotation.y = -0.25 * u;
          break;
        }

        case 'CAMERA_WAVE': {
          // Waves to side media camera
          this.headGroup.rotation.y = 0.55 * u;
          this.rightArmGroup.rotation.set(-1.45 * u, 0, 0.35 * u);
          this.rightForearmGroup.rotation.set(-0.35 * u, Math.sin(t * 12.0) * 0.3 * u, 0);
          break;
        }

        case 'MICROPHONE_DUCK': {
          // Ducks under imaginary overhead boom mic
          this.spineGroup.rotation.x += 0.35 * u;
          this.headGroup.rotation.x -= 0.30 * u;
          break;
        }

        case 'PRESS_CONFERENCE_ENTER': {
          // Formal nod and confident forward stride gesture
          this.headGroup.rotation.x = Math.sin(t * 4.0) * 0.12 * u;
          this.leftArmGroup.rotation.set(-0.6 * u, 0, -0.2 * u);
          break;
        }
      }

      if (this.cosmeticTimer <= 0) {
        this.cosmeticReaction = 'NONE';
        if (this.selfiePhoneGroup) this.selfiePhoneGroup.visible = false;
        if (this.selfieFlashMesh) this.selfieFlashMesh.visible = false;
      }
    }
  }
}
