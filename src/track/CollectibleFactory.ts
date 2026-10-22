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
  initialLocalZ?: number;
  isMagnetized?: boolean;
  animOffsetY?: number;
}

export interface CoinPickupVFXInstance {
  group: THREE.Group;
  ring: THREE.Mesh;
  sparkles: THREE.Mesh[];
  active: boolean;
  age: number;
  maxAge: number;
  sparkleVelocities: THREE.Vector3[];
}

export class CollectibleFactory {
  private curvedManager = CurvedShaderManager.getInstance();

  private coinGeo: THREE.CylinderGeometry;
  private coinRimGeo: THREE.TorusGeometry;
  private coinInnerRimGeo: THREE.TorusGeometry;
  private coinStarGeo: THREE.BufferGeometry;

  private coinGoldMat: THREE.MeshStandardMaterial;
  private coinRimMat: THREE.MeshStandardMaterial;
  private glassMat: THREE.MeshStandardMaterial;
  private metalPodMat: THREE.MeshStandardMaterial;

  private vfxRingGeo: THREE.RingGeometry;
  private vfxSparkleGeo: THREE.OctahedronGeometry;
  private vfxRingMat: THREE.MeshBasicMaterial;
  private vfxSparkleMat: THREE.MeshBasicMaterial;

  constructor() {
    // 1. High-Shine Premium Gold Materials with balanced emissive accents
    this.coinGoldMat = new THREE.MeshStandardMaterial({
      color: 0xffd000,
      emissive: 0xff8f00,
      emissiveIntensity: 0.20,
      roughness: 0.22,
      metalness: 0.88
    });
    this.curvedManager.applyCurvature(this.coinGoldMat);

    this.coinRimMat = new THREE.MeshStandardMaterial({
      color: 0xffea00,
      emissive: 0xffb300,
      emissiveIntensity: 0.16,
      roughness: 0.16,
      metalness: 0.94
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

    // 2. High-precision Coin Geometries
    const r = CONSTANTS.COIN_RADIUS;
    // Main disc with 28 radial segments for a smooth circular silhouette
    this.coinGeo = new THREE.CylinderGeometry(r, r, 0.14, 28);
    // Rounded outer protective rim
    this.coinRimGeo = new THREE.TorusGeometry(r * 0.94, 0.048, 12, 28);
    // Minted inner accent groove
    this.coinInnerRimGeo = new THREE.TorusGeometry(r * 0.72, 0.02, 8, 28);

    // Embossed 5-pointed arcade star
    const starShape = new THREE.Shape();
    const points = 5;
    const outerR = r * 0.44;
    const innerR = r * 0.20;
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerR : innerR;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();

    this.coinStarGeo = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.018,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 2
    });

    // 3. Reusable Collection VFX Assets
    this.vfxRingGeo = new THREE.RingGeometry(0.18, 0.32, 16);
    this.vfxSparkleGeo = new THREE.OctahedronGeometry(0.065, 0);
    this.vfxRingMat = new THREE.MeshBasicMaterial({
      color: 0xffea00,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    this.vfxSparkleMat = new THREE.MeshBasicMaterial({
      color: 0xfff9c4,
      transparent: true,
      opacity: 0.95
    });
  }

  /**
   * Create High-Polish Stylized 3D Arcade Gold Coin with Corrected Alignment
   */
  public createCoin(): THREE.Group {
    const rootGroup = new THREE.Group();
    const coinGroup = new THREE.Group();

    // Main Coin Disk: rotate around X by PI/2 so circular flat faces face +Z and -Z
    const coinMesh = new THREE.Mesh(this.coinGeo, this.coinGoldMat);
    coinMesh.rotation.x = Math.PI / 2;
    coinMesh.castShadow = true;
    coinGroup.add(coinMesh);

    // Beveled Outer Rim: constructed in X-Y plane, normal along Z
    const rimMesh = new THREE.Mesh(this.coinRimGeo, this.coinRimMat);
    coinGroup.add(rimMesh);

    // Inner Minted Bezel Ring: constructed in X-Y plane, normal along Z
    const innerRimMesh = new THREE.Mesh(this.coinInnerRimGeo, this.coinRimMat);
    coinGroup.add(innerRimMesh);

    // Front Embossed Star: at Z = +0.065, facing +Z directly at approaching runner
    const frontStar = new THREE.Mesh(this.coinStarGeo, this.coinRimMat);
    frontStar.position.set(0, 0, 0.065);
    coinGroup.add(frontStar);

    // Back Embossed Star: at Z = -0.065, facing -Z
    const backStar = new THREE.Mesh(this.coinStarGeo, this.coinRimMat);
    backStar.rotation.y = Math.PI;
    backStar.position.set(0, 0, -0.065);
    coinGroup.add(backStar);

    // Subtle 12.5 deg pitch presentation tilt toward elevated camera
    coinGroup.rotation.x = 0.22;

    rootGroup.add(coinGroup);
    return rootGroup;
  }

  /**
   * Create pooled collection particle VFX instances
   */
  public createPickupVFXPool(count: number = 20): CoinPickupVFXInstance[] {
    const pool: CoinPickupVFXInstance[] = [];
    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      group.visible = false;

      // Expanding golden ring
      const ringMat = this.vfxRingMat.clone();
      const ring = new THREE.Mesh(this.vfxRingGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      group.add(ring);

      // 6 radiating sparkle diamonds
      const sparkles: THREE.Mesh[] = [];
      const sparkleVelocities: THREE.Vector3[] = [];
      const sparkCount = 6;
      for (let s = 0; s < sparkCount; s++) {
        const sparkMat = this.vfxSparkleMat.clone();
        const spark = new THREE.Mesh(this.vfxSparkleGeo, sparkMat);
        const angle = (s / sparkCount) * Math.PI * 2;
        sparkles.push(spark);
        group.add(spark);
        sparkleVelocities.push(
          new THREE.Vector3(
            Math.cos(angle) * (2.2 + (s % 2) * 1.2),
            2.8 + (s % 3) * 1.0,
            Math.sin(angle) * (2.2 + (s % 2) * 1.2)
          )
        );
      }

      pool.push({
        group,
        ring,
        sparkles,
        active: false,
        age: 0,
        maxAge: CONSTANTS.COIN_VFX_DURATION,
        sparkleVelocities
      });
    }
    return pool;
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

