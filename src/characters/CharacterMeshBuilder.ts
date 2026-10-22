import * as THREE from 'three';
import { CharacterId, OutfitDefinition, getCharacterById, getOutfitById } from './CharacterCatalog';

export interface BuiltCharacterHierarchy {
  rootGroup: THREE.Group;
  hipsGroup: THREE.Group;
  spineGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  leftForearmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  rightForearmGroup: THREE.Group;
  leftLegGroup: THREE.Group;
  leftCalfGroup: THREE.Group;
  rightLegGroup: THREE.Group;
  rightCalfGroup: THREE.Group;
  leftSneaker: THREE.Group;
  rightSneaker: THREE.Group;
  backpackGroup: THREE.Group;
  hoverboardGroup: THREE.Group;
  jetpackGroup: THREE.Group;
  shieldGroup: THREE.Group;
  shieldMesh: THREE.Mesh | null;
  magnetAuraGroup: THREE.Group;
  shadowMesh: THREE.Mesh;
  jetpackFire1: THREE.Mesh | null;
  jetpackFire2: THREE.Mesh | null;
  sneakerWingsGroup: THREE.Group;
  materials: {
    primaryMat: THREE.MeshStandardMaterial;
    secondaryMat: THREE.MeshStandardMaterial;
    pantsMat: THREE.MeshStandardMaterial;
    accentMat: THREE.MeshStandardMaterial;
    skinMat: THREE.MeshStandardMaterial;
    hairOrHelmetMat: THREE.MeshStandardMaterial;
    sneakerMainMat: THREE.MeshStandardMaterial;
    sneakerSoleMat: THREE.MeshStandardMaterial;
    hoverboardMat: THREE.MeshStandardMaterial;
  };
}

export class CharacterMeshBuilder {
  /**
   * Build complete humanoid rig for specified character and outfit
   */
  public static build(
    characterId: CharacterId = 'char_jax',
    outfitId?: string
  ): BuiltCharacterHierarchy {
    const charDef = getCharacterById(characterId) || getCharacterById('char_jax')!;
    const activeOutfitId = outfitId || charDef.defaultOutfitId;
    const outfit = getOutfitById(charDef.id, activeOutfitId) || charDef.outfits[0];

    const p = charDef.proportions;
    const c = outfit.colors;

    // 1. Create PBR Materials from outfit color scheme
    const skinMat = new THREE.MeshStandardMaterial({
      color: c.skin,
      roughness: 0.55,
      metalness: 0.05
    });

    const primaryMat = new THREE.MeshStandardMaterial({
      color: c.primary,
      roughness: 0.42,
      metalness: outfit.features?.hasLuminousTrims ? 0.25 : 0.1
    });

    const secondaryMat = new THREE.MeshStandardMaterial({
      color: c.secondary,
      roughness: 0.35,
      metalness: 0.2
    });

    const pantsMat = new THREE.MeshStandardMaterial({
      color: c.pants,
      roughness: 0.65,
      metalness: 0.1
    });

    const hairOrHelmetMat = new THREE.MeshStandardMaterial({
      color: c.hairOrHelmet,
      roughness: outfit.features?.hasAeroHelmet ? 0.2 : 0.8,
      metalness: outfit.features?.hasAeroHelmet ? 0.4 : 0.05
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: c.accent,
      roughness: 0.3,
      metalness: outfit.features?.hasVisor || outfit.features?.hasAeroHelmet ? 0.7 : 0.15
    });

    const sneakerMainMat = new THREE.MeshStandardMaterial({
      color: c.accent,
      roughness: 0.35,
      metalness: 0.15
    });

    const sneakerSoleMat = new THREE.MeshStandardMaterial({
      color: 0xf5f6fa,
      roughness: 0.25,
      metalness: 0.05
    });

    const hoverboardMat = new THREE.MeshStandardMaterial({
      color: 0x00e676,
      emissive: 0x00b0ff,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8
    });

    // 2. Build Articulated Skeleton Hierarchy
    const rootGroup = new THREE.Group();

    // Hips / Pelvis
    const hipsGroup = new THREE.Group();
    hipsGroup.position.set(0, 0.95 * p.height, 0);
    rootGroup.add(hipsGroup);

    // Character-specific Pelvis Mesh
    const pelvisGeo = new THREE.CylinderGeometry(
      0.24 * p.torsoWidth / 0.28,
      0.22 * p.torsoWidth / 0.28,
      0.25,
      14
    );
    const pelvisMesh = new THREE.Mesh(pelvisGeo, pantsMat);
    pelvisMesh.castShadow = true;
    hipsGroup.add(pelvisMesh);

    // Spine / Upper Torso
    const spineGroup = new THREE.Group();
    spineGroup.position.set(0, 0.15, 0);
    hipsGroup.add(spineGroup);

    // Torso Mesh (character-specific jacket / vest / flightsuit)
    const torsoHeight = 0.55 * p.height;
    const torsoTopR = 0.28 * p.torsoWidth / 0.28;
    const torsoBotR = 0.24 * p.torsoWidth / 0.28;

    const torsoGeo = new THREE.CylinderGeometry(torsoTopR, torsoBotR, torsoHeight, 16);
    const torsoMesh = new THREE.Mesh(torsoGeo, primaryMat);
    torsoMesh.position.set(0, torsoHeight * 0.5, 0);
    torsoMesh.castShadow = true;
    spineGroup.add(torsoMesh);

    // Character-specific Torso Features
    CharacterMeshBuilder.buildTorsoFeatures(characterId, outfit, spineGroup, torsoTopR, torsoHeight, {
      primaryMat,
      secondaryMat,
      accentMat,
      skinMat,
      hairOrHelmetMat
    });

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, torsoHeight + 0.08, 0);
    spineGroup.add(headGroup);

    // Character-specific Head, Hair, Face, and Headwear
    CharacterMeshBuilder.buildHeadFeatures(characterId, outfit, headGroup, {
      skinMat,
      primaryMat,
      secondaryMat,
      hairOrHelmetMat,
      accentMat
    });

    // Backpack / Back Gear
    const backpackGroup = CharacterMeshBuilder.buildBackpack(characterId, outfit, {
      primaryMat,
      secondaryMat,
      accentMat
    });
    backpackGroup.position.set(0, torsoHeight * 0.5, 0.24);
    spineGroup.add(backpackGroup);

    // Articulated Arms
    const shoulderOffset = p.shoulderWidth;
    const armY = torsoHeight * 0.88;

    // Left Arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-shoulderOffset, armY, 0);
    spineGroup.add(leftArmGroup);

    const leftForearmGroup = new THREE.Group();
    leftForearmGroup.position.set(0, -0.32 * p.armScale, 0);
    leftArmGroup.add(leftForearmGroup);

    CharacterMeshBuilder.buildArmMeshes(
      characterId,
      outfit,
      leftArmGroup,
      leftForearmGroup,
      true,
      p.armScale,
      { primaryMat, skinMat, secondaryMat, accentMat }
    );

    // Right Arm
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(shoulderOffset, armY, 0);
    spineGroup.add(rightArmGroup);

    const rightForearmGroup = new THREE.Group();
    rightForearmGroup.position.set(0, -0.32 * p.armScale, 0);
    rightArmGroup.add(rightForearmGroup);

    CharacterMeshBuilder.buildArmMeshes(
      characterId,
      outfit,
      rightArmGroup,
      rightForearmGroup,
      false,
      p.armScale,
      { primaryMat, skinMat, secondaryMat, accentMat }
    );

    // Articulated Legs
    const hipOffset = 0.14 * (p.torsoWidth / 0.28);

    // Left Leg
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-hipOffset, 0, 0);
    hipsGroup.add(leftLegGroup);

    const leftCalfGroup = new THREE.Group();
    leftCalfGroup.position.set(0, -0.40 * p.legLength, 0);
    leftLegGroup.add(leftCalfGroup);

    const leftSneaker = CharacterMeshBuilder.buildFootwear(characterId, outfit, {
      sneakerMainMat,
      sneakerSoleMat,
      accentMat,
      secondaryMat
    });
    leftSneaker.position.set(0, -0.42 * p.legLength, 0);
    leftCalfGroup.add(leftSneaker);

    CharacterMeshBuilder.buildLegMeshes(
      characterId,
      outfit,
      leftLegGroup,
      leftCalfGroup,
      p.legLength,
      { pantsMat, secondaryMat, skinMat }
    );

    // Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(hipOffset, 0, 0);
    hipsGroup.add(rightLegGroup);

    const rightCalfGroup = new THREE.Group();
    rightCalfGroup.position.set(0, -0.40 * p.legLength, 0);
    rightLegGroup.add(rightCalfGroup);

    const rightSneaker = CharacterMeshBuilder.buildFootwear(characterId, outfit, {
      sneakerMainMat,
      sneakerSoleMat,
      accentMat,
      secondaryMat
    });
    rightSneaker.position.set(0, -0.42 * p.legLength, 0);
    rightCalfGroup.add(rightSneaker);

    CharacterMeshBuilder.buildLegMeshes(
      characterId,
      outfit,
      rightLegGroup,
      rightCalfGroup,
      p.legLength,
      { pantsMat, secondaryMat, skinMat }
    );

    // Super Sneakers Wings Group (attached to sneakers)
    const sneakerWingsGroup = CharacterMeshBuilder.buildSneakerWings();
    leftSneaker.add(sneakerWingsGroup.clone());
    rightSneaker.add(sneakerWingsGroup);

    // Power-up Attachments
    const hoverboardGroup = CharacterMeshBuilder.buildHoverboard(hoverboardMat);
    hoverboardGroup.position.set(0, 0, 0);
    hoverboardGroup.visible = false;
    rootGroup.add(hoverboardGroup);

    const { jetpackGroup, jetpackFire1, jetpackFire2 } = CharacterMeshBuilder.buildJetpack();
    jetpackGroup.position.set(0, torsoHeight * 0.5, 0.28);
    jetpackGroup.visible = false;
    spineGroup.add(jetpackGroup);

    const { shieldGroup, shieldMesh } = CharacterMeshBuilder.buildShield();
    shieldGroup.position.set(0, 0.95, 0);
    shieldGroup.visible = false;
    rootGroup.add(shieldGroup);

    const magnetAuraGroup = CharacterMeshBuilder.buildMagnetAura();
    magnetAuraGroup.position.set(0, 0.95, 0);
    magnetAuraGroup.visible = false;
    rootGroup.add(magnetAuraGroup);

    // Contact Shadow on Track Ground
    const shadowGeo = new THREE.CircleGeometry(0.55, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x05070a,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0, 0.02, 0);
    rootGroup.add(shadowMesh);

    return {
      rootGroup,
      hipsGroup,
      spineGroup,
      headGroup,
      leftArmGroup,
      leftForearmGroup,
      rightArmGroup,
      rightForearmGroup,
      leftLegGroup,
      leftCalfGroup,
      rightLegGroup,
      rightCalfGroup,
      leftSneaker,
      rightSneaker,
      backpackGroup,
      hoverboardGroup,
      jetpackGroup,
      shieldGroup,
      shieldMesh,
      magnetAuraGroup,
      shadowMesh,
      jetpackFire1,
      jetpackFire2,
      sneakerWingsGroup,
      materials: {
        primaryMat,
        secondaryMat,
        pantsMat,
        accentMat,
        skinMat,
        hairOrHelmetMat,
        sneakerMainMat,
        sneakerSoleMat,
        hoverboardMat
      }
    };
  }

  // --- Character-Specific Torso Builder ---
  private static buildTorsoFeatures(
    characterId: CharacterId,
    outfit: OutfitDefinition,
    spineGroup: THREE.Group,
    topRadius: number,
    height: number,
    mats: any
  ): void {
    if (characterId === 'char_jax') {
      // Classic Street Hoodie: Center zipper line + draped collar hood on back
      const zipperGeo = new THREE.BoxGeometry(0.04, height * 0.95, 0.04);
      const zipper = new THREE.Mesh(zipperGeo, mats.secondaryMat);
      zipper.position.set(0, height * 0.5, -topRadius * 0.94);
      spineGroup.add(zipper);

      const hoodGeo = new THREE.TorusGeometry(topRadius * 0.85, 0.08, 8, 16);
      const hood = new THREE.Mesh(hoodGeo, mats.accentMat);
      hood.rotation.x = Math.PI / 2;
      hood.position.set(0, height - 0.02, 0.08);
      hood.castShadow = true;
      spineGroup.add(hood);
    } else if (characterId === 'char_luna') {
      // Cyberpunk Cropped Jacket: Upturned cyber collar + dual luminous neon chest piping
      const cyberCollarGeo = new THREE.CylinderGeometry(topRadius * 0.75, topRadius * 0.65, 0.12, 12, 1, true);
      const cyberCollar = new THREE.Mesh(cyberCollarGeo, mats.primaryMat);
      cyberCollar.position.set(0, height + 0.02, 0);
      spineGroup.add(cyberCollar);

      // Luminous neon chest piping lines
      const pipeGeo = new THREE.BoxGeometry(0.03, height * 0.8, 0.03);
      const pipeLeft = new THREE.Mesh(pipeGeo, mats.secondaryMat);
      pipeLeft.position.set(-0.1, height * 0.5, -topRadius * 0.95);
      pipeLeft.rotation.z = -0.15;
      spineGroup.add(pipeLeft);

      const pipeRight = new THREE.Mesh(pipeGeo, mats.secondaryMat);
      pipeRight.position.set(0.1, height * 0.5, -topRadius * 0.95);
      pipeRight.rotation.z = 0.15;
      spineGroup.add(pipeRight);
    } else if (characterId === 'char_cruz') {
      // B-Boy Open Sleeveless Vest: Inner black compression shirt + open vest lapels
      const innerShirtGeo = new THREE.CylinderGeometry(topRadius * 0.92, topRadius * 0.88, height * 0.95, 14);
      const innerShirt = new THREE.Mesh(innerShirtGeo, mats.secondaryMat);
      innerShirt.position.set(0, height * 0.5, 0);
      spineGroup.add(innerShirt);

      // Left & right open vest flaps
      const flapGeo = new THREE.BoxGeometry(0.12, height * 0.9, 0.06);
      const leftFlap = new THREE.Mesh(flapGeo, mats.primaryMat);
      leftFlap.position.set(-topRadius * 0.6, height * 0.5, -topRadius * 0.85);
      spineGroup.add(leftFlap);

      const rightFlap = new THREE.Mesh(flapGeo, mats.primaryMat);
      rightFlap.position.set(topRadius * 0.6, height * 0.5, -topRadius * 0.85);
      spineGroup.add(rightFlap);
    } else if (characterId === 'char_nova') {
      // Solarpunk Aerodynamic Flightsuit: Photovoltaic chest arc reactor + aerodynamic shoulder pauldrons
      const arcGeo = new THREE.TorusGeometry(0.09, 0.022, 8, 16);
      const arcMesh = new THREE.Mesh(arcGeo, mats.accentMat);
      arcMesh.position.set(0, height * 0.65, -topRadius * 0.95);
      spineGroup.add(arcMesh);

      const pauldronGeo = new THREE.CylinderGeometry(0.14, 0.18, 0.16, 10);
      pauldronGeo.rotateZ(Math.PI / 2);

      const leftPauldron = new THREE.Mesh(pauldronGeo, mats.secondaryMat);
      leftPauldron.position.set(-topRadius * 1.35, height * 0.88, 0);
      spineGroup.add(leftPauldron);

      const rightPauldron = new THREE.Mesh(pauldronGeo, mats.secondaryMat);
      rightPauldron.position.set(topRadius * 1.35, height * 0.88, 0);
      spineGroup.add(rightPauldron);
    }
  }

  // --- Character-Specific Head, Hair & Headwear Builder ---
  private static buildHeadFeatures(
    characterId: CharacterId,
    outfit: OutfitDefinition,
    headGroup: THREE.Group,
    mats: any
  ): void {
    // 1. Neck
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.12, 10);
    const neck = new THREE.Mesh(neckGeo, mats.skinMat);
    neck.position.set(0, -0.06, 0);
    headGroup.add(neck);

    // 2. Head Base Sphere
    const headGeo = new THREE.SphereGeometry(0.24, 16, 14);
    headGeo.scale(1.0, 1.15, 1.05);
    const headMesh = new THREE.Mesh(headGeo, mats.skinMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // 3. Eyes & Facial Expression (facing -Z)
    if (characterId !== 'char_nova') {
      CharacterMeshBuilder.buildEyes(headGroup);
    }

    // 4. Character Silhouette Specifics
    if (characterId === 'char_jax') {
      // Jax: Forehead bangs + Backward cap + Street goggles on brim
      const hairBangsGeo = new THREE.ConeGeometry(0.06, 0.16, 6);
      for (let h = -2; h <= 2; h++) {
        const bang = new THREE.Mesh(hairBangsGeo, mats.hairOrHelmetMat);
        bang.rotation.x = -Math.PI * 0.65;
        bang.rotation.z = h * 0.22;
        bang.position.set(h * 0.055, 0.14, -0.21);
        headGroup.add(bang);
      }

      // Backward cap crown
      const capCrownGeo = new THREE.SphereGeometry(0.26, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const capCrown = new THREE.Mesh(capCrownGeo, mats.accentMat);
      capCrown.position.set(0, 0.08, 0.01);
      capCrown.castShadow = true;
      headGroup.add(capCrown);

      // Backward visor pointing +Z
      const visorGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.03, 16, 1, false, Math.PI * 0.7, Math.PI * 0.6);
      const capVisor = new THREE.Mesh(visorGeo, mats.accentMat);
      capVisor.rotation.x = -0.2;
      capVisor.position.set(0, 0.12, 0.22);
      capVisor.castShadow = true;
      headGroup.add(capVisor);

      // Goggles mounted on cap brim
      const goggleGeo = new THREE.TorusGeometry(0.07, 0.02, 6, 14);
      const lensGeo = new THREE.CircleGeometry(0.065, 12);
      const lensMat = new THREE.MeshStandardMaterial({
        color: outfit.colors.details,
        roughness: 0.1,
        metalness: 0.9
      });
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });

      const leftGoggle = new THREE.Group();
      leftGoggle.add(new THREE.Mesh(goggleGeo, frameMat));
      leftGoggle.add(new THREE.Mesh(lensGeo, lensMat));
      leftGoggle.position.set(-0.11, 0.16, 0.22);
      leftGoggle.rotation.x = 0.2;
      headGroup.add(leftGoggle);

      const rightGoggle = new THREE.Group();
      rightGoggle.add(new THREE.Mesh(goggleGeo, frameMat));
      rightGoggle.add(new THREE.Mesh(lensGeo, lensMat));
      rightGoggle.position.set(0.11, 0.16, 0.22);
      rightGoggle.rotation.x = 0.2;
      headGroup.add(rightGoggle);
    } else if (characterId === 'char_luna') {
      // Luna: Cyberpunk twin high ponytails + Holographic cyber visor
      // Main hair cap
      const hairCapGeo = new THREE.SphereGeometry(0.255, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6);
      const hairCap = new THREE.Mesh(hairCapGeo, mats.hairOrHelmetMat);
      hairCap.position.set(0, 0.06, 0);
      headGroup.add(hairCap);

      // Cyber Visor over eyes (facing -Z)
      const visorGeo = new THREE.CylinderGeometry(0.24, 0.25, 0.11, 16, 1, false, -Math.PI * 0.45, Math.PI * 0.9);
      const visorMat = new THREE.MeshStandardMaterial({
        color: outfit.colors.accent,
        emissive: outfit.colors.accent,
        emissiveIntensity: 0.7,
        roughness: 0.1,
        metalness: 0.85,
        transparent: true,
        opacity: 0.88
      });
      const cyberVisor = new THREE.Mesh(visorGeo, visorMat);
      cyberVisor.position.set(0, 0.02, 0);
      headGroup.add(cyberVisor);

      // Twin high cyber ponytails angled up & back
      const ponyTailGeo = new THREE.ConeGeometry(0.08, 0.46, 10);
      ponyTailGeo.rotateX(Math.PI * 0.8);

      // Neon ponytail rings
      const ringGeo = new THREE.TorusGeometry(0.065, 0.02, 8, 14);
      const ringMat = new THREE.MeshBasicMaterial({ color: outfit.colors.details });

      // Left Ponytail
      const leftPony = new THREE.Group();
      leftPony.position.set(-0.22, 0.22, 0.08);
      leftPony.rotation.z = -0.35;
      leftPony.rotation.y = -0.2;
      leftPony.add(new THREE.Mesh(ringGeo, ringMat));
      const leftHair = new THREE.Mesh(ponyTailGeo, mats.hairOrHelmetMat);
      leftHair.position.set(0, -0.15, 0.15);
      leftPony.add(leftHair);
      headGroup.add(leftPony);

      // Right Ponytail
      const rightPony = new THREE.Group();
      rightPony.position.set(0.22, 0.22, 0.08);
      rightPony.rotation.z = 0.35;
      rightPony.rotation.y = 0.2;
      rightPony.add(new THREE.Mesh(ringGeo, ringMat));
      const rightHair = new THREE.Mesh(ponyTailGeo, mats.hairOrHelmetMat);
      rightHair.position.set(0, -0.15, 0.15);
      rightPony.add(rightHair);
      headGroup.add(rightPony);
    } else if (characterId === 'char_cruz') {
      // Cruz: Curly afro fade + Street Bandana tied at back with dangling cloth tails
      // Curly afro dome
      const afroGeo = new THREE.SphereGeometry(0.265, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.65);
      const afro = new THREE.Mesh(afroGeo, mats.hairOrHelmetMat);
      afro.position.set(0, 0.08, -0.01);
      headGroup.add(afro);

      // Street Bandana headband
      const bandanaGeo = new THREE.TorusGeometry(0.25, 0.038, 8, 20);
      const bandana = new THREE.Mesh(bandanaGeo, mats.accentMat);
      bandana.rotation.x = Math.PI / 2;
      bandana.position.set(0, 0.08, 0);
      headGroup.add(bandana);

      // Knot & dangling bandana tails at back (+Z)
      const knotGeo = new THREE.SphereGeometry(0.045, 8, 8);
      const knot = new THREE.Mesh(knotGeo, mats.accentMat);
      knot.position.set(0, 0.08, 0.26);
      headGroup.add(knot);

      const tailGeo = new THREE.BoxGeometry(0.06, 0.24, 0.02);
      const tail1 = new THREE.Mesh(tailGeo, mats.accentMat);
      tail1.position.set(-0.03, -0.04, 0.27);
      tail1.rotation.z = 0.2;
      headGroup.add(tail1);

      const tail2 = new THREE.Mesh(tailGeo, mats.accentMat);
      tail2.position.set(0.03, -0.04, 0.27);
      tail2.rotation.z = -0.25;
      headGroup.add(tail2);
    } else if (characterId === 'char_nova') {
      // Nova: Aerodynamic Solarpunk Speed Helmet with Panoramic Gold Visor & Twin Aero Winglets
      const helmetGeo = new THREE.SphereGeometry(0.27, 20, 16);
      helmetGeo.scale(1.0, 1.12, 1.25);
      const helmet = new THREE.Mesh(helmetGeo, mats.hairOrHelmetMat);
      helmet.position.set(0, 0.04, 0);
      helmet.castShadow = true;
      headGroup.add(helmet);

      // Panoramic Gold Sun Visor (facing -Z)
      const visorGeo = new THREE.SphereGeometry(0.26, 16, 12, -Math.PI * 0.45, Math.PI * 0.9, Math.PI * 0.2, Math.PI * 0.6);
      const visorMat = new THREE.MeshStandardMaterial({
        color: outfit.colors.accent,
        roughness: 0.1,
        metalness: 0.95
      });
      const sunVisor = new THREE.Mesh(visorGeo, visorMat);
      sunVisor.position.set(0, 0.03, -0.04);
      headGroup.add(sunVisor);

      // Twin miniature aerodynamic fins pointing backward
      const finGeo = new THREE.BoxGeometry(0.025, 0.14, 0.28);
      finGeo.rotateX(0.2);

      const leftFin = new THREE.Mesh(finGeo, mats.primaryMat);
      leftFin.position.set(-0.24, 0.12, 0.14);
      headGroup.add(leftFin);

      const rightFin = new THREE.Mesh(finGeo, mats.primaryMat);
      rightFin.position.set(0.24, 0.12, 0.14);
      headGroup.add(rightFin);
    }
  }

  // --- Eyes & Smile Helper ---
  private static buildEyes(headGroup: THREE.Group): void {
    const eyeWhiteGeo = new THREE.SphereGeometry(0.06, 10, 10);
    eyeWhiteGeo.scale(1.0, 1.25, 0.5);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const eyeIrisGeo = new THREE.SphereGeometry(0.035, 8, 8);
    eyeIrisGeo.scale(1.0, 1.0, 0.4);
    const eyeIrisMat = new THREE.MeshBasicMaterial({ color: 0x1a237e });

    const pupilDotGeo = new THREE.SphereGeometry(0.015, 6, 6);
    const pupilDotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Left Eye
    const leftEye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEye.position.set(-0.09, 0.02, -0.22);
    leftEye.rotation.y = 0.15;
    const leftIris = new THREE.Mesh(eyeIrisGeo, eyeIrisMat);
    leftIris.position.set(0, 0, -0.04);
    const leftDot = new THREE.Mesh(pupilDotGeo, pupilDotMat);
    leftDot.position.set(0.01, 0.01, -0.03);
    leftIris.add(leftDot);
    leftEye.add(leftIris);
    headGroup.add(leftEye);

    // Right Eye
    const rightEye = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEye.position.set(0.09, 0.02, -0.22);
    rightEye.rotation.y = -0.15;
    const rightIris = new THREE.Mesh(eyeIrisGeo, eyeIrisMat);
    rightIris.position.set(0, 0, -0.04);
    const rightDot = new THREE.Mesh(pupilDotGeo, pupilDotMat);
    rightDot.position.set(0.01, 0.01, -0.03);
    rightIris.add(rightDot);
    rightEye.add(rightIris);
    headGroup.add(rightEye);

    // Smile
    const smileGeo = new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI * 0.7);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x880e4f });
    const mouth = new THREE.Mesh(smileGeo, mouthMat);
    mouth.rotation.x = Math.PI / 2;
    mouth.rotation.z = Math.PI * 0.15;
    mouth.position.set(0, -0.12, -0.23);
    headGroup.add(mouth);
  }

  // --- Character-Specific Backpack Builder ---
  private static buildBackpack(
    characterId: CharacterId,
    outfit: OutfitDefinition,
    mats: any
  ): THREE.Group {
    const pack = new THREE.Group();

    if (characterId === 'char_jax') {
      // Classic Street Runner Pack with 2 Spray Paint Cans
      const bodyGeo = new THREE.BoxGeometry(0.38, 0.44, 0.16);
      const body = new THREE.Mesh(bodyGeo, mats.primaryMat);
      body.castShadow = true;
      pack.add(body);

      // Pocket
      const pocketGeo = new THREE.BoxGeometry(0.28, 0.18, 0.08);
      const pocket = new THREE.Mesh(pocketGeo, mats.secondaryMat);
      pocket.position.set(0, -0.08, 0.1);
      pack.add(pocket);

      // Spray cans in side holsters
      const canGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.22, 10);
      const canMat1 = new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.8, roughness: 0.3 });
      const canMat2 = new THREE.MeshStandardMaterial({ color: 0xff1744, metalness: 0.8, roughness: 0.3 });

      const can1 = new THREE.Mesh(canGeo, canMat1);
      can1.position.set(-0.21, 0, 0.02);
      pack.add(can1);

      const can2 = new THREE.Mesh(canGeo, canMat2);
      can2.position.set(0.21, 0, 0.02);
      pack.add(can2);
    } else if (characterId === 'char_luna') {
      // Cyber Data-Deck Pack with Glowing Battery Core & Antenna
      const deckGeo = new THREE.BoxGeometry(0.32, 0.46, 0.12);
      const deck = new THREE.Mesh(deckGeo, mats.primaryMat);
      pack.add(deck);

      // Glowing cyber power cell
      const coreGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.32, 12);
      const coreMat = new THREE.MeshBasicMaterial({ color: outfit.colors.accent });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.set(0, 0, 0.07);
      pack.add(core);

      // High-gain cyber antenna
      const antGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.36, 6);
      const antMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.9 });
      const ant = new THREE.Mesh(antGeo, antMat);
      ant.position.set(-0.12, 0.28, 0.02);
      pack.add(ant);
    } else if (characterId === 'char_cruz') {
      // Retro Street Boombox Pack with Dual Chrome Speaker Grilles
      const boxGeo = new THREE.BoxGeometry(0.44, 0.28, 0.15);
      const box = new THREE.Mesh(boxGeo, mats.secondaryMat);
      pack.add(box);

      // Chrome speaker rings
      const spkGeo = new THREE.TorusGeometry(0.07, 0.018, 6, 16);
      const spkMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });

      const spkL = new THREE.Mesh(spkGeo, spkMat);
      spkL.position.set(-0.12, 0, 0.08);
      pack.add(spkL);

      const spkR = new THREE.Mesh(spkGeo, spkMat);
      spkR.position.set(0.12, 0, 0.08);
      pack.add(spkR);
    } else if (characterId === 'char_nova') {
      // Solarpunk Micro-Turbine Engine Pack
      const bodyGeo = new THREE.BoxGeometry(0.34, 0.38, 0.14);
      const body = new THREE.Mesh(bodyGeo, mats.primaryMat);
      pack.add(body);

      // Twin miniature intake turbines
      const turbineGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.16, 14);
      turbineGeo.rotateX(Math.PI / 2);
      const turbineMat = new THREE.MeshStandardMaterial({
        color: outfit.colors.accent,
        metalness: 0.95,
        roughness: 0.1
      });

      const turbL = new THREE.Mesh(turbineGeo, turbineMat);
      turbL.position.set(-0.11, 0, 0.08);
      pack.add(turbL);

      const turbR = new THREE.Mesh(turbineGeo, turbineMat);
      turbR.position.set(0.11, 0, 0.08);
      pack.add(turbR);
    }

    return pack;
  }

  // --- Character-Specific Arm Meshes ---
  private static buildArmMeshes(
    characterId: CharacterId,
    outfit: OutfitDefinition,
    armGroup: THREE.Group,
    forearmGroup: THREE.Group,
    isLeft: boolean,
    armScale: number,
    mats: any
  ): void {
    const shoulderGeo = new THREE.SphereGeometry(0.12, 10, 10);
    const shoulder = new THREE.Mesh(
      shoulderGeo,
      characterId === 'char_cruz' ? mats.skinMat : mats.primaryMat
    );
    armGroup.add(shoulder);

    // Bicep
    const bicepGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.32 * armScale, 10);
    const bicepMat = characterId === 'char_cruz' ? mats.skinMat : mats.primaryMat;
    const bicep = new THREE.Mesh(bicepGeo, bicepMat);
    bicep.position.set(0, -0.16 * armScale, 0);
    bicep.castShadow = true;
    armGroup.add(bicep);

    // Forearm
    const forearmGeo = new THREE.CylinderGeometry(0.09, 0.075, 0.28 * armScale, 10);
    const forearmMat = characterId === 'char_nova' ? mats.primaryMat : mats.skinMat;
    const forearm = new THREE.Mesh(forearmGeo, forearmMat);
    forearm.position.set(0, -0.14 * armScale, 0);
    forearm.castShadow = true;
    forearmGroup.add(forearm);

    // Cruz has wrist sweatbands!
    if (characterId === 'char_cruz') {
      const bandGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.08, 10);
      const band = new THREE.Mesh(bandGeo, mats.accentMat);
      band.position.set(0, -0.22 * armScale, 0);
      forearmGroup.add(band);
    }

    // Fist / Hand
    const fistGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const fistMat = characterId === 'char_nova' ? mats.primaryMat : mats.skinMat;
    const fist = new THREE.Mesh(fistGeo, fistMat);
    fist.position.set(0, -0.28 * armScale, 0);
    fist.castShadow = true;
    forearmGroup.add(fist);
  }

  // --- Character-Specific Leg Meshes ---
  private static buildLegMeshes(
    characterId: CharacterId,
    outfit: OutfitDefinition,
    legGroup: THREE.Group,
    calfGroup: THREE.Group,
    legLength: number,
    mats: any
  ): void {
    // Thigh
    const thighGeo = new THREE.CylinderGeometry(0.125, 0.105, 0.40 * legLength, 12);
    const thighMat = mats.pantsMat;
    const thigh = new THREE.Mesh(thighGeo, thighMat);
    thigh.position.set(0, -0.20 * legLength, 0);
    thigh.castShadow = true;
    legGroup.add(thigh);

    // Calf
    const isShorts = characterId === 'char_luna';
    const calfGeo = new THREE.CylinderGeometry(0.105, 0.085, 0.42 * legLength, 12);
    const calfMat = isShorts ? mats.skinMat : mats.pantsMat;
    const calf = new THREE.Mesh(calfGeo, calfMat);
    calf.position.set(0, -0.21 * legLength, 0);
    calf.castShadow = true;
    calfGroup.add(calf);

    // Cruz has track pants stripes!
    if (characterId === 'char_cruz') {
      const stripeGeo = new THREE.BoxGeometry(0.02, 0.42 * legLength, 0.12);
      const stripe = new THREE.Mesh(stripeGeo, mats.secondaryMat);
      stripe.position.set(0, -0.21 * legLength, 0);
      calfGroup.add(stripe);
    }
  }

  // --- Character-Specific Footwear Builder ---
  private static buildFootwear(
    characterId: CharacterId,
    outfit: OutfitDefinition,
    mats: any
  ): THREE.Group {
    const foot = new THREE.Group();

    if (characterId === 'char_nova') {
      // Sleek Photon Propulsion Boots with Glowing Ankle Ring
      const bootBodyGeo = new THREE.BoxGeometry(0.18, 0.18, 0.38);
      const bootBody = new THREE.Mesh(bootBodyGeo, mats.sneakerMainMat);
      bootBody.position.set(0, 0.04, -0.06);
      foot.add(bootBody);

      // Glowing photon energy ring
      const ringGeo = new THREE.TorusGeometry(0.12, 0.025, 8, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: outfit.colors.accent });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.14, 0);
      foot.add(ring);
    } else {
      // Classic Urban Skate / B-Boy / Cyber Combat Sneakers
      const soleGeo = new THREE.BoxGeometry(0.19, 0.08, 0.42);
      const sole = new THREE.Mesh(soleGeo, mats.sneakerSoleMat);
      sole.position.set(0, 0.04, -0.05);
      foot.add(sole);

      const upperGeo = new THREE.BoxGeometry(0.17, 0.18, 0.36);
      const upper = new THREE.Mesh(upperGeo, mats.sneakerMainMat);
      upper.position.set(0, 0.14, -0.04);
      foot.add(upper);

      // Rubber toe cap
      const toeGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.16, 12, 1, false, 0, Math.PI);
      toeGeo.rotateX(Math.PI / 2);
      const toe = new THREE.Mesh(toeGeo, mats.sneakerSoleMat);
      toe.position.set(0, 0.08, -0.22);
      foot.add(toe);
    }

    return foot;
  }

  // --- Power-up Component Builders ---
  public static buildHoverboard(hoverboardMat: THREE.MeshStandardMaterial): THREE.Group {
    const board = new THREE.Group();

    const deckGeo = new THREE.BoxGeometry(0.85, 0.07, 2.1);
    const deckMesh = new THREE.Mesh(deckGeo, hoverboardMat);
    deckMesh.position.y = 0.035;
    board.add(deckMesh);

    const noseGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.08, 16, 1, false, 0, Math.PI);
    const nose = new THREE.Mesh(noseGeo, hoverboardMat);
    nose.rotation.x = Math.PI / 2;
    nose.rotation.z = Math.PI;
    nose.position.set(0, 0.02, -1.1);
    board.add(nose);

    const stripGeo = new THREE.BoxGeometry(0.88, 0.03, 2.16);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.y = 0.01;
    board.add(strip);

    const repulsorGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.06, 16);
    const repulsorMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const rep1 = new THREE.Mesh(repulsorGeo, repulsorMat);
    rep1.position.set(0, -0.06, -0.55);
    board.add(rep1);

    const rep2 = new THREE.Mesh(repulsorGeo, repulsorMat);
    rep2.position.set(0, -0.06, 0.55);
    board.add(rep2);

    return board;
  }

  public static buildJetpack(): {
    jetpackGroup: THREE.Group;
    jetpackFire1: THREE.Mesh;
    jetpackFire2: THREE.Mesh;
  } {
    const jp = new THREE.Group();

    const mountGeo = new THREE.BoxGeometry(0.32, 0.44, 0.12);
    const mountMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.4, metalness: 0.8 });
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.castShadow = true;
    jp.add(mount);

    const cylGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.52, 12);
    const cylMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, roughness: 0.25, metalness: 0.85 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xff3d00, roughness: 0.3 });

    const cylLeft = new THREE.Mesh(cylGeo, cylMat);
    cylLeft.position.set(-0.19, 0, 0.02);
    jp.add(cylLeft);

    const stripeLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.08, 12), stripeMat);
    stripeLeft.position.set(-0.19, 0.08, 0.02);
    jp.add(stripeLeft);

    const cylRight = new THREE.Mesh(cylGeo, cylMat);
    cylRight.position.set(0.19, 0, 0.02);
    jp.add(cylRight);

    const stripeRight = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.08, 12), stripeMat);
    stripeRight.position.set(0.19, 0.08, 0.02);
    jp.add(stripeRight);

    const bellGeo = new THREE.CylinderGeometry(0.11, 0.07, 0.12, 12);
    const bellMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.5, metalness: 0.9 });
    const bell1 = new THREE.Mesh(bellGeo, bellMat);
    bell1.position.set(-0.19, -0.3, 0.02);
    jp.add(bell1);

    const bell2 = new THREE.Mesh(bellGeo, bellMat);
    bell2.position.set(0.19, -0.3, 0.02);
    jp.add(bell2);

    const flameGeo = new THREE.ConeGeometry(0.09, 0.42, 10);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.85 });

    const jetpackFire1 = new THREE.Mesh(flameGeo, flameMat);
    jetpackFire1.rotation.x = Math.PI;
    jetpackFire1.position.set(-0.19, -0.54, 0.02);
    jp.add(jetpackFire1);

    const jetpackFire2 = new THREE.Mesh(flameGeo, flameMat);
    jetpackFire2.rotation.x = Math.PI;
    jetpackFire2.position.set(0.19, -0.54, 0.02);
    jp.add(jetpackFire2);

    return { jetpackGroup: jp, jetpackFire1, jetpackFire2 };
  }

  public static buildShield(): { shieldGroup: THREE.Group; shieldMesh: THREE.Mesh } {
    const shield = new THREE.Group();

    const sphereGeo = new THREE.SphereGeometry(1.22, 24, 20);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x0091ea,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.36,
      roughness: 0.15,
      metalness: 0.85
    });
    const shieldMesh = new THREE.Mesh(sphereGeo, shieldMat);
    shield.add(shieldMesh);

    const gridGeo = new THREE.SphereGeometry(1.24, 14, 10);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x80d8ff,
      wireframe: true,
      transparent: true,
      opacity: 0.28
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    shield.add(gridMesh);

    return { shieldGroup: shield, shieldMesh };
  }

  public static buildMagnetAura(): THREE.Group {
    const aura = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(0.72, 0.028, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x2979ff,
      transparent: true,
      opacity: 0.75
    });

    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2.2;
    aura.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.x = -Math.PI / 2.5;
    ring2.rotation.y = Math.PI / 3;
    aura.add(ring2);

    return aura;
  }

  public static buildSneakerWings(): THREE.Group {
    const wings = new THREE.Group();
    const wingMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    for (let f = 0; f < 3; f++) {
      const featherGeo = new THREE.ConeGeometry(0.04, 0.16, 4);
      featherGeo.rotateZ(Math.PI / 2 + f * 0.2);
      const feather = new THREE.Mesh(featherGeo, wingMat);
      feather.position.set(0.12, 0.14 + f * 0.05, 0.05 + f * 0.04);
      wings.add(feather);
    }

    wings.visible = false;
    return wings;
  }
}
