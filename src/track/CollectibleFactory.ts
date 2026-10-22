import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { CurvedShaderManager } from '../scene/CurvedShader';
import { PowerupType } from '../player/PowerupManager';

export type CollectibleType = 'COIN' | 'SEASON_TOKEN' | 'CHRONO_ORB' | PowerupType;

export interface CollectibleInstance {
  group: THREE.Group;
  type: CollectibleType;
  lane: LaneIndex;
  collider: THREE.Box3;
  active: boolean;
  baseY: number;
}

export class CollectibleFactory {
  private curvedManager = CurvedShaderManager.getInstance();

  private coinGeo: THREE.CylinderGeometry;
  private coinRimGeo: THREE.TorusGeometry;
  private coinStarGeo: THREE.ConeGeometry;

  private coinGoldMat: THREE.MeshStandardMaterial;
  private coinRimMat: THREE.MeshStandardMaterial;
  private glassMat: THREE.MeshStandardMaterial;
  private metalPodMat: THREE.MeshStandardMaterial;

  constructor() {
    // 1. High-Shine Premium Gold Materials
    this.coinGoldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xff9900,
      emissiveIntensity: 0.35,
      roughness: 0.18,
      metalness: 0.95
    });
    this.curvedManager.applyCurvature(this.coinGoldMat);

    this.coinRimMat = new THREE.MeshStandardMaterial({
      color: 0xffb300,
      emissive: 0xff6f00,
      emissiveIntensity: 0.2,
      roughness: 0.3,
      metalness: 0.9
    });
    this.curvedManager.applyCurvature(this.coinRimMat);

    this.glassMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.9
    });
    this.curvedManager.applyCurvature(this.glassMat);

    this.metalPodMat = new THREE.MeshStandardMaterial({
      color: 0x263238,
      roughness: 0.4,
      metalness: 0.8
    });
    this.curvedManager.applyCurvature(this.metalPodMat);

    // Geometries
    const r = CONSTANTS.COIN_RADIUS;
    this.coinGeo = new THREE.CylinderGeometry(r, r, 0.14, 18);
    this.coinRimGeo = new THREE.TorusGeometry(r * 0.92, 0.05, 8, 18);
    this.coinStarGeo = new THREE.ConeGeometry(r * 0.45, 0.04, 5);
  }

  /**
   * Create High-Polish Stylized Arcade Gold Coin
   */
  public createCoin(): THREE.Group {
    const group = new THREE.Group();

    // Main Coin Disk
    const coinMesh = new THREE.Mesh(this.coinGeo, this.coinGoldMat);
    coinMesh.rotation.z = Math.PI / 2; // Upright
    coinMesh.castShadow = true;
    group.add(coinMesh);

    // Beveled Outer Rim
    const rimMesh = new THREE.Mesh(this.coinRimGeo, this.coinRimMat);
    rimMesh.rotation.y = Math.PI / 2;
    group.add(rimMesh);

    // Front & Back Embossed Star Insignia
    [-0.075, 0.075].forEach((xOffset) => {
      const star = new THREE.Mesh(this.coinStarGeo, this.coinRimMat);
      star.rotation.z = xOffset > 0 ? -Math.PI / 2 : Math.PI / 2;
      star.position.x = xOffset;
      group.add(star);
    });

    return group;
  }

  /**
   * Create High-Tech Holographic Powerup Capsule
   */
  public createPowerup(type: PowerupType): THREE.Group {
    const group = new THREE.Group();

    let colorHex = 0x00e676;
    if (type === 'MAGNET') colorHex = 0x2979ff;
    if (type === 'JETPACK') colorHex = 0xff6d00;
    if (type === 'SNEAKERS') colorHex = 0xff1744;
    if (type === 'MULTIPLIER') colorHex = 0xffd700;
    if (type === 'SHIELD') colorHex = 0x00e5ff;
    if (type === 'HOVERBOARD') colorHex = 0x00e676;

    const auraMat = new THREE.MeshBasicMaterial({ color: colorHex });

    // 1. Sleek metallic anti-gravity base plate & cap
    const capGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.12, 16);
    const baseCap = new THREE.Mesh(capGeo, this.metalPodMat);
    baseCap.position.y = -0.65;
    baseCap.castShadow = true;
    group.add(baseCap);

    const topCap = new THREE.Mesh(capGeo, this.metalPodMat);
    topCap.position.y = 0.65;
    topCap.castShadow = true;
    group.add(topCap);

    // 2. Transparent glowing plasma glass dome
    const glassGeo = new THREE.CylinderGeometry(0.52, 0.52, 1.2, 16);
    const glass = new THREE.Mesh(glassGeo, this.glassMat);
    group.add(glass);

    // 3. Floating 3D Sculpted Icon inside capsule
    const iconGroup = new THREE.Group();

    if (type === 'MAGNET') {
      // 3D Red Horseshoe Magnet with Silver Poles
      const magnetGeo = new THREE.TorusGeometry(0.26, 0.08, 8, 16, Math.PI);
      const magMat = new THREE.MeshStandardMaterial({ color: 0xd50000, roughness: 0.3, metalness: 0.6 });
      const mag = new THREE.Mesh(magnetGeo, magMat);
      mag.rotation.z = Math.PI;
      iconGroup.add(mag);

      // Silver magnetic pole tips
      const tipGeo = new THREE.BoxGeometry(0.18, 0.16, 0.18);
      const silverMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, metalness: 0.9, roughness: 0.2 });
      [-0.26, 0.26].forEach((tx) => {
        const tip = new THREE.Mesh(tipGeo, silverMat);
        tip.position.set(tx, 0.1, 0);
        iconGroup.add(tip);
      });
    } else if (type === 'JETPACK') {
      // 3D Rocket Jetpack
      const frameGeo = new THREE.BoxGeometry(0.18, 0.35, 0.08);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.8 });
      iconGroup.add(new THREE.Mesh(frameGeo, frameMat));

      const cylGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.42, 10);
      const cylMat = new THREE.MeshStandardMaterial({ color: 0xff6d00, metalness: 0.5, roughness: 0.3 });
      [-0.12, 0.12].forEach((cx) => {
        const cyl = new THREE.Mesh(cylGeo, cylMat);
        cyl.position.set(cx, 0.02, 0);
        iconGroup.add(cyl);

        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.1, 8), frameMat);
        nozzle.position.set(cx, -0.22, 0);
        iconGroup.add(nozzle);
      });
    } else if (type === 'SNEAKERS') {
      // 3D Sneaker with Golden Wings
      const shoeGeo = new THREE.BoxGeometry(0.22, 0.18, 0.45);
      const shoeMat = new THREE.MeshStandardMaterial({ color: 0xff1744, roughness: 0.3 });
      const shoe = new THREE.Mesh(shoeGeo, shoeMat);
      iconGroup.add(shoe);

      const wingGeo = new THREE.ConeGeometry(0.14, 0.35, 4);
      const goldMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
      const leftWing = new THREE.Mesh(wingGeo, goldMat);
      leftWing.rotation.set(0.4, 0, -1.2);
      leftWing.position.set(-0.16, 0.12, -0.05);
      iconGroup.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo, goldMat);
      rightWing.rotation.set(0.4, 0, 1.2);
      rightWing.position.set(0.16, 0.12, -0.05);
      iconGroup.add(rightWing);
    } else if (type === 'MULTIPLIER') {
      // Bold Golden 2X Insignia
      const barGeo = new THREE.BoxGeometry(0.14, 0.45, 0.14);
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffaa00, emissiveIntensity: 0.4, roughness: 0.2, metalness: 0.8 });
      // "2" shape
      const topB = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.12), goldMat);
      topB.position.set(-0.18, 0.18, 0);
      iconGroup.add(topB);
      const midB = new THREE.Mesh(barGeo, goldMat);
      midB.rotation.z = -0.5;
      midB.position.set(-0.18, 0, 0);
      iconGroup.add(midB);
      const botB = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.12), goldMat);
      botB.position.set(-0.18, -0.18, 0);
      iconGroup.add(botB);

      // "X" shape
      const x1 = new THREE.Mesh(barGeo, goldMat);
      x1.rotation.z = 0.78;
      x1.position.set(0.18, 0, 0);
      iconGroup.add(x1);
      const x2 = new THREE.Mesh(barGeo, goldMat);
      x2.rotation.z = -0.78;
      x2.position.set(0.18, 0, 0);
      iconGroup.add(x2);
    } else if (type === 'SHIELD') {
      // 3D Hexagonal Protective Aegis Shield
      const shieldGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 6);
      const shieldMat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x0091ea,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.85
      });
      const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
      shieldMesh.rotation.x = Math.PI / 2;
      iconGroup.add(shieldMesh);

      // Inner emblem
      const emblem = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      emblem.position.z = 0.05;
      iconGroup.add(emblem);
    } else {
      // Miniature Glowing Hoverboard
      const deckGeo = new THREE.BoxGeometry(0.28, 0.05, 0.75);
      const deckMat = new THREE.MeshStandardMaterial({ color: 0x00e676, emissive: 0x00e676, emissiveIntensity: 0.5 });
      const deck = new THREE.Mesh(deckGeo, deckMat);
      deck.rotation.set(0.3, 0.5, 0.2);
      iconGroup.add(deck);
    }

    group.add(iconGroup);

    // 4. Dual Orbiting Neon Energy Rings
    const ringGeo = new THREE.TorusGeometry(0.68, 0.035, 8, 24);
    const ring1 = new THREE.Mesh(ringGeo, auraMat);
    ring1.rotation.x = Math.PI / 2;
    group.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, auraMat);
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 4;
    group.add(ring2);

    return group;
  }

  /**
   * Create Glowing Cyber Season Event Token (Diamond Prism)
   */
  public createSeasonToken(): THREE.Group {
    const group = new THREE.Group();

    // Octahedron crystal core
    const crystalGeo = new THREE.OctahedronGeometry(0.45, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9
    });
    this.curvedManager.applyCurvature(crystalMat);
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.scale.set(1.0, 1.4, 1.0);
    group.add(crystal);

    // Orbiting Neon Ring
    const ringGeo = new THREE.TorusGeometry(0.65, 0.04, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 4;
    group.add(ring);

    return group;
  }

  /**
   * Create Glowing Chrono Orb for Time Trial Mode (+5s)
   */
  public createChronoOrb(): THREE.Group {
    const group = new THREE.Group();

    // Luminous Golden Sphere
    const orbGeo = new THREE.SphereGeometry(0.42, 16, 16);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xffea00,
      emissive: 0xff9100,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.95
    });
    this.curvedManager.applyCurvature(orbMat);
    const orb = new THREE.Mesh(orbGeo, orbMat);
    group.add(orb);

    // Clockwise Chrono Ring
    const ringGeo = new THREE.TorusGeometry(0.62, 0.035, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    return group;
  }
}

