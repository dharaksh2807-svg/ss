import * as THREE from 'three';
import { AdultDancer } from './FeverDirector';

/**
 * VIVA HEAT CHARACTER WORKSHOP
 * High-Fashion Stylized Adult Festival Characters:
 * 1. Haute Couture Reveler (Mermaid evening gown, fascinator, champagne flute)
 * 2. Masquerade Maestro (Burgundy velvet jacket, domino mask, golden cane)
 * 3. Festival Carnival Dancer (Feathered plumage wings, gilded corslet, Latin dance choreo)
 * 
 * Tasteful, glamorous, fully adult high-fashion styling with zero nudity or explicit acts.
 */
export class VivaHeatCharacters {
  private static sharedMaterials: {
    skinWarm: THREE.MeshStandardMaterial;
    skinDeep: THREE.MeshStandardMaterial;
    coralGownMat: THREE.MeshStandardMaterial;
    velvetBurgundyMat: THREE.MeshStandardMaterial;
    goldJewelryMat: THREE.MeshStandardMaterial;
    featherPlumageMat: THREE.MeshStandardMaterial;
    fuchsiaPlumageMat: THREE.MeshStandardMaterial;
    maskBlackMat: THREE.MeshStandardMaterial;
    champagneGlassMat: THREE.MeshStandardMaterial;
    darkTrousersMat: THREE.MeshStandardMaterial;
  } | null = null;

  public static getMaterials() {
    if (!this.sharedMaterials) {
      this.sharedMaterials = {
        skinWarm: new THREE.MeshStandardMaterial({
          color: 0xe0a98b,
          roughness: 0.55,
          metalness: 0.05
        }),
        skinDeep: new THREE.MeshStandardMaterial({
          color: 0x8d5524,
          roughness: 0.55,
          metalness: 0.05
        }),
        coralGownMat: new THREE.MeshStandardMaterial({
          color: 0xff2d55, // Coral Scarlet Satin
          roughness: 0.32,
          metalness: 0.35,
          emissive: new THREE.Color(0x881337),
          emissiveIntensity: 0.15
        }),
        velvetBurgundyMat: new THREE.MeshStandardMaterial({
          color: 0x6b0d2b, // Deep Velvet Burgundy
          roughness: 0.75,
          metalness: 0.20
        }),
        goldJewelryMat: new THREE.MeshStandardMaterial({
          color: 0xf59e0b, // Polished Sunset Gold
          roughness: 0.18,
          metalness: 0.90
        }),
        featherPlumageMat: new THREE.MeshStandardMaterial({
          color: 0xf43f5e, // Radiant Festival Feather Coral
          roughness: 0.40,
          metalness: 0.25,
          emissive: new THREE.Color(0x9f1239),
          emissiveIntensity: 0.2
        }),
        fuchsiaPlumageMat: new THREE.MeshStandardMaterial({
          color: 0xd946ef, // Exotic Orchid Fuchsia
          roughness: 0.45,
          metalness: 0.30
        }),
        maskBlackMat: new THREE.MeshStandardMaterial({
          color: 0x18181b,
          roughness: 0.30,
          metalness: 0.60
        }),
        champagneGlassMat: new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          roughness: 0.10,
          metalness: 0.85,
          transparent: true,
          opacity: 0.75
        }),
        darkTrousersMat: new THREE.MeshStandardMaterial({
          color: 0x09090b,
          roughness: 0.65,
          metalness: 0.15
        })
      };
    }
    return this.sharedMaterials;
  }

  /**
   * 1. HAUTE COUTURE REVELER
   * Glamorous eveningwear silhouette with sculpted mermaid flare gown and champagne flute
   */
  public static createHauteCoutureReveler(
    x: number,
    y: number,
    z: number,
    skinVariant: 'warm' | 'deep' = 'warm'
  ): { group: THREE.Group; dancer: AdultDancer } {
    const mats = this.getMaterials();
    const group = new THREE.Group();
    group.name = 'haute_couture_reveler';
    group.position.set(x, y, z);

    const skinMat = skinVariant === 'warm' ? mats.skinWarm : mats.skinDeep;

    // Pedestal base / Feet hidden under floor-length skirt
    const skirtGeo = new THREE.CylinderGeometry(0.24, 0.52, 1.15, 12);
    const skirt = new THREE.Mesh(skirtGeo, mats.coralGownMat);
    skirt.position.y = 0.58;
    group.add(skirt);

    // Flared Mermaid Tail ruffles
    const flareGeo = new THREE.ConeGeometry(0.68, 0.35, 12);
    const flare = new THREE.Mesh(flareGeo, mats.coralGownMat);
    flare.position.y = 0.18;
    group.add(flare);

    // Articulated Torso Node (for hip and spine sways)
    const torsoNode = new THREE.Group();
    torsoNode.position.y = 1.15;
    group.add(torsoNode);

    // Corset / Bodice with gold waist cincher
    const bodiceGeo = new THREE.CylinderGeometry(0.22, 0.20, 0.55, 10);
    const bodice = new THREE.Mesh(bodiceGeo, mats.coralGownMat);
    bodice.position.y = 0.28;
    torsoNode.add(bodice);

    const beltGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.08, 12);
    const belt = new THREE.Mesh(beltGeo, mats.goldJewelryMat);
    belt.position.y = 0.10;
    torsoNode.add(belt);

    // Sculpted High-Fashion Structured Shoulder Capelet
    const shoulderGeo = new THREE.BoxGeometry(0.68, 0.12, 0.28);
    const shoulder = new THREE.Mesh(shoulderGeo, mats.coralGownMat);
    shoulder.position.y = 0.52;
    torsoNode.add(shoulder);

    // Neck & Head Node
    const headNode = new THREE.Group();
    headNode.position.y = 0.55;
    torsoNode.add(headNode);

    const neckGeo = new THREE.CylinderGeometry(0.09, 0.10, 0.18, 8);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 0.08;
    headNode.add(neck);

    const headGeo = new THREE.SphereGeometry(0.18, 10, 10);
    headGeo.scale(1.0, 1.25, 1.05);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 0.28;
    headNode.add(head);

    // High-Fashion Fascinator / Tiara with feather plume
    const tiaraGeo = new THREE.TorusGeometry(0.15, 0.03, 6, 12);
    tiaraGeo.rotateX(Math.PI * 0.5);
    const tiara = new THREE.Mesh(tiaraGeo, mats.goldJewelryMat);
    tiara.position.y = 0.38;
    headNode.add(tiara);

    const plumeGeo = new THREE.ConeGeometry(0.06, 0.45, 6);
    plumeGeo.rotateZ(0.3);
    const plume = new THREE.Mesh(plumeGeo, mats.featherPlumageMat);
    plume.position.set(0.12, 0.55, -0.05);
    headNode.add(plume);

    // Left Arm (holding champagne flute in elegant toast pose)
    const armL = new THREE.Group();
    armL.position.set(-0.35, 0.48, 0.02);
    torsoNode.add(armL);

    const armLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.55, 6), skinMat);
    armLMesh.position.y = -0.22;
    armL.add(armLMesh);

    // Champagne Flute
    const fluteStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 6), mats.champagneGlassMat);
    fluteStem.position.set(0, -0.45, 0.15);
    const fluteBowl = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 8), mats.champagneGlassMat);
    fluteBowl.position.set(0, -0.38, 0.15);
    fluteBowl.rotateX(Math.PI);
    armL.add(fluteStem);
    armL.add(fluteBowl);

    // Right Arm (resting gracefully on hip / gold bangle)
    const armR = new THREE.Group();
    armR.position.set(0.35, 0.48, 0.02);
    torsoNode.add(armR);

    const armRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.55, 6), skinMat);
    armRMesh.position.y = -0.22;
    armR.add(armRMesh);

    const bangle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 12), mats.goldJewelryMat);
    bangle.position.y = -0.42;
    armR.add(bangle);

    const dancer: AdultDancer = {
      group,
      torso: torsoNode,
      head: headNode,
      armL,
      armR,
      phaseOffset: Math.random() * Math.PI * 2,
      tempo: 2.2,
      baseY: y
    };

    return { group, dancer };
  }

  /**
   * 2. THE MASQUERADE MAESTRO
   * Adult male in tailored burgundy velvet jacket with gold frogging, masquerade domino mask, and golden cane
   */
  public static createMasqueradeMaestro(
    x: number,
    y: number,
    z: number
  ): { group: THREE.Group; dancer: AdultDancer } {
    const mats = this.getMaterials();
    const group = new THREE.Group();
    group.name = 'masquerade_maestro';
    group.position.set(x, y, z);

    // Trousers & Dress Shoes
    [-0.14, 0.14].forEach((lx) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.95, 8), mats.darkTrousersMat);
      leg.position.set(lx, 0.48, 0);
      group.add(leg);

      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.24), mats.maskBlackMat);
      shoe.position.set(lx, 0.04, 0.04);
      group.add(shoe);
    });

    // Articulated Torso Node
    const torsoNode = new THREE.Group();
    torsoNode.position.y = 0.95;
    group.add(torsoNode);

    // Velvet Smoking Jacket with Gold Frogging
    const jacketGeo = new THREE.BoxGeometry(0.56, 0.72, 0.32);
    const jacket = new THREE.Mesh(jacketGeo, mats.velvetBurgundyMat);
    jacket.position.y = 0.36;
    torsoNode.add(jacket);

    // Gold Satin Lapel V-Shape
    const lapelGeo = new THREE.ConeGeometry(0.18, 0.45, 4);
    lapelGeo.rotateZ(Math.PI);
    const lapel = new THREE.Mesh(lapelGeo, mats.goldJewelryMat);
    lapel.position.set(0, 0.48, 0.17);
    torsoNode.add(lapel);

    // Head Node
    const headNode = new THREE.Group();
    headNode.position.y = 0.72;
    torsoNode.add(headNode);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.11, 0.15, 8), mats.skinWarm);
    neck.position.y = 0.08;
    headNode.add(neck);

    const headGeo = new THREE.SphereGeometry(0.19, 10, 10);
    headGeo.scale(1.0, 1.25, 1.1);
    const head = new THREE.Mesh(headGeo, mats.skinWarm);
    head.position.y = 0.28;
    headNode.add(head);

    // Gilded Masquerade Domino Mask across eyes
    const maskGeo = new THREE.BoxGeometry(0.36, 0.12, 0.22);
    const mask = new THREE.Mesh(maskGeo, mats.goldJewelryMat);
    mask.position.set(0, 0.32, 0.05);
    headNode.add(mask);

    // Left Arm (holding golden walking cane)
    const armL = new THREE.Group();
    armL.position.set(-0.36, 0.62, 0);
    torsoNode.add(armL);

    const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.65, 6), mats.velvetBurgundyMat);
    sleeveL.position.y = -0.28;
    armL.add(sleeveL);

    // Slender Golden Cane
    const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 1.35, 6), mats.goldJewelryMat);
    cane.position.set(-0.04, -0.65, 0.18);
    cane.rotateX(0.15);
    armL.add(cane);

    // Right Arm (flourishing gesture or resting on lapel)
    const armR = new THREE.Group();
    armR.position.set(0.36, 0.62, 0);
    torsoNode.add(armR);

    const sleeveR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.65, 6), mats.velvetBurgundyMat);
    sleeveR.position.y = -0.28;
    armR.add(sleeveR);

    const dancer: AdultDancer = {
      group,
      torso: torsoNode,
      head: headNode,
      armL,
      armR,
      phaseOffset: Math.random() * Math.PI * 2,
      tempo: 1.8,
      baseY: y
    };

    return { group, dancer };
  }

  /**
   * 3. THE FESTIVAL CARNIVAL DANCER
   * Dramatic Latin/Samba festive plumage, golden corslet, articulated arms & hips for dance choreography
   */
  public static createFestivalDancer(
    x: number,
    y: number,
    z: number
  ): { group: THREE.Group; dancer: AdultDancer } {
    const mats = this.getMaterials();
    const group = new THREE.Group();
    group.name = 'festival_carnival_dancer';
    group.position.set(x, y, z);

    // Slender legs in golden high-heeled festival sandals
    [-0.13, 0.13].forEach((lx) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.95, 8), mats.skinDeep);
      leg.position.set(lx, 0.48, 0);
      group.add(leg);

      const sandal = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.20), mats.goldJewelryMat);
      sandal.position.set(lx, 0.04, 0.02);
      group.add(sandal);
    });

    // Articulated Torso Node (receives rhythmic 4-phase hip and spine rotations)
    const torsoNode = new THREE.Group();
    torsoNode.position.y = 0.95;
    group.add(torsoNode);

    // Festive Gilded Corslet / Bodice
    const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.18, 0.52, 10), mats.goldJewelryMat);
    bodice.position.y = 0.28;
    torsoNode.add(bodice);

    // Side Slit Sarong / Silk Swish
    const swishNode = new THREE.Group();
    const swishGeo = new THREE.ConeGeometry(0.42, 0.75, 8);
    const swish = new THREE.Mesh(swishGeo, mats.coralGownMat);
    swish.position.set(0.05, 0.1, 0);
    swish.rotateZ(-0.2);
    swishNode.add(swish);
    torsoNode.add(swishNode);

    // Monumental Feather Back-Collar Plumage Wings (Curved fans of scarlet & fuchsia feathers)
    const wingsGroup = new THREE.Group();
    wingsGroup.position.set(0, 0.52, -0.15);

    [-1, 1].forEach((wSide) => {
      for (let f = 0; f < 5; f++) {
        const fLen = 0.85 + f * 0.12;
        const fGeo = new THREE.ConeGeometry(0.08, fLen, 6);
        const feather = new THREE.Mesh(fGeo, f % 2 === 0 ? mats.featherPlumageMat : mats.fuchsiaPlumageMat);
        feather.position.set(wSide * (0.2 + f * 0.14), fLen * 0.45, 0);
        feather.rotation.z = wSide * (0.4 + f * 0.22);
        feather.rotation.y = wSide * 0.15;
        wingsGroup.add(feather);
      }
    });
    torsoNode.add(wingsGroup);

    // Neck & Head Node
    const headNode = new THREE.Group();
    headNode.position.y = 0.55;
    torsoNode.add(headNode);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.16, 8), mats.skinDeep);
    neck.position.y = 0.08;
    headNode.add(neck);

    const headGeo = new THREE.SphereGeometry(0.18, 10, 10);
    headGeo.scale(1.0, 1.25, 1.05);
    const head = new THREE.Mesh(headGeo, mats.skinDeep);
    head.position.y = 0.26;
    headNode.add(head);

    // Magnificent Gilded Sunburst Headpiece
    const crownGeo = new THREE.TorusGeometry(0.18, 0.03, 6, 12);
    crownGeo.rotateX(Math.PI * 0.5);
    const crown = new THREE.Mesh(crownGeo, mats.goldJewelryMat);
    crown.position.y = 0.38;
    headNode.add(crown);

    for (let sp = -3; sp <= 3; sp++) {
      const spoke = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.35 - Math.abs(sp) * 0.04, 5), mats.goldJewelryMat);
      spoke.position.set(sp * 0.06, 0.52, 0);
      spoke.rotation.z = -sp * 0.18;
      headNode.add(spoke);
    }

    // Articulated Arms for Dynamic Latin Dancing
    const armL = new THREE.Group();
    armL.position.set(-0.32, 0.48, 0);
    torsoNode.add(armL);

    const armLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.58, 6), mats.skinDeep);
    armLMesh.position.y = -0.24;
    armL.add(armLMesh);

    const cuffL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.12, 8), mats.goldJewelryMat);
    cuffL.position.y = -0.38;
    armL.add(cuffL);

    const armR = new THREE.Group();
    armR.position.set(0.32, 0.48, 0);
    torsoNode.add(armR);

    const armRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.58, 6), mats.skinDeep);
    armRMesh.position.y = -0.24;
    armR.add(armRMesh);

    const cuffR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.12, 8), mats.goldJewelryMat);
    cuffR.position.y = -0.38;
    armR.add(cuffR);

    const dancer: AdultDancer = {
      group,
      torso: torsoNode,
      head: headNode,
      armL,
      armR,
      dressSwish: swishNode,
      phaseOffset: Math.random() * Math.PI * 2,
      tempo: 3.2,
      baseY: y
    };

    return { group, dancer };
  }
}
