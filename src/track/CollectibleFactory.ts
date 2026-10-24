import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { CurvedShaderManager } from '../scene/CurvedShader';
import { PowerupType } from '../player/PowerupManager';
import { CoinPatternArchetype } from './CoinPatternLibrary';

export type CollectibleType = 'COIN' | 'SEASON_TOKEN' | 'CHRONO_ORB' | 'KEY' | PowerupType;

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
  archetype?: CoinPatternArchetype;
  isRiskRoute?: boolean;
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

    // 2. High-precision Coin Geometries (Verified by coin-collection-system.test.ts)
    const r = CONSTANTS.COIN_RADIUS;
    this.coinGeo = new THREE.CylinderGeometry(r, r, 0.14, 28);
    this.coinRimGeo = new THREE.TorusGeometry(r * 0.94, 0.048, 12, 28);
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
   * Guarantees exact structure expected by verification suites:
   * rootGroup -> innerCoin (disk, outerRim, innerRim, frontStar, backStar)
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
   * Primary Powerup Creator: Dispatches to unique, distinct 3D sculpts.
   * Eliminates the generic glass cylinder capsule dome so every pickup communicates
   * its identity clearly before collection.
   */
  public createPowerup(type: PowerupType): THREE.Group {
    switch (type) {
      case 'MAGNET':
        return this.createMagnetPickup();
      case 'JETPACK':
        return this.createJetpackPickup();
      case 'SNEAKERS':
        return this.createSneakersPickup();
      case 'MULTIPLIER':
        return this.createMultiplierPickup();
      case 'SHIELD':
        return this.createShieldPickup();
      case 'HOVERBOARD':
        return this.createHoverboardPickup();
      default:
        return this.createMultiplierPickup();
    }
  }

  /**
   * 1. 3D Coin Magnet Collectible:
   * Bold, high-contrast red horseshoe magnet with distinct North (Red) and South (Blue)
   * magnetic pole bands, polished silver tips, floating gold coin, and pulsing flux arc.
   */
  public createMagnetPickup(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'PICKUP_MAGNET';

    // Main red horseshoe arch
    const archGeo = new THREE.TorusGeometry(0.40, 0.12, 14, 32, Math.PI);
    const magRedMat = new THREE.MeshStandardMaterial({
      color: 0xd50000,
      emissive: 0xff1744,
      emissiveIntensity: 0.40,
      roughness: 0.20,
      metalness: 0.75
    });
    this.curvedManager.applyCurvature(magRedMat);
    const arch = new THREE.Mesh(archGeo, magRedMat);
    arch.name = 'MAGNET_HORSESHOE';
    arch.rotation.z = Math.PI; // Opening points upwards
    arch.position.y = -0.06;
    group.add(arch);

    // Two vertical red legs
    const legGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16);
    [-0.40, 0.40].forEach((lx) => {
      const leg = new THREE.Mesh(legGeo, magRedMat);
      leg.name = 'MAGNET_LEG';
      leg.position.set(lx, 0.08, 0);
      group.add(leg);
    });

    // Magnetic Polarity Accent Bands: North (Red/Gold, Left), South (Cyan/Blue, Right)
    const poleBandGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.07, 16);
    const northMat = new THREE.MeshStandardMaterial({ color: 0xff1744, emissive: 0xff5252, emissiveIntensity: 0.5 });
    const southMat = new THREE.MeshStandardMaterial({ color: 0x2979ff, emissive: 0x448aff, emissiveIntensity: 0.5 });
    this.curvedManager.applyCurvature(northMat);
    this.curvedManager.applyCurvature(southMat);

    const northBand = new THREE.Mesh(poleBandGeo, northMat);
    northBand.position.set(-0.40, 0.22, 0);
    group.add(northBand);

    const southBand = new THREE.Mesh(poleBandGeo, southMat);
    southBand.position.set(0.40, 0.22, 0);
    group.add(southBand);

    // Silver magnetic pole tips
    const tipGeo = new THREE.BoxGeometry(0.28, 0.20, 0.28);
    const tipMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.10,
      metalness: 0.98,
      emissive: 0xbbdefb,
      emissiveIntensity: 0.30
    });
    this.curvedManager.applyCurvature(tipMat);
    [-0.40, 0.40].forEach((tx) => {
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.name = 'MAGNET_POLE';
      tip.position.set(tx, 0.32, 0);
      group.add(tip);
    });

    // Magnetic flux arc across tips
    const fluxGeo = new THREE.TorusGeometry(0.28, 0.035, 8, 24, Math.PI);
    const fluxMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const flux = new THREE.Mesh(fluxGeo, fluxMat);
    flux.name = 'MAGNET_FLUX';
    flux.rotation.z = 0;
    flux.position.set(0, 0.32, 0);
    group.add(flux);

    // Mini floating gold coin captured in magnetic field
    const miniCoinGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.06, 18);
    const miniCoinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xff9100,
      emissiveIntensity: 0.6,
      roughness: 0.18,
      metalness: 0.92
    });
    this.curvedManager.applyCurvature(miniCoinMat);
    const miniCoin = new THREE.Mesh(miniCoinGeo, miniCoinMat);
    miniCoin.name = 'MAGNET_MINI_COIN';
    miniCoin.rotation.x = Math.PI / 2;
    miniCoin.position.set(0, 0.16, 0.05);
    group.add(miniCoin);

    // Orbiting cyan magnetic attraction wave
    const ringGeo = new THREE.TorusGeometry(0.62, 0.035, 8, 28);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'MAGNET_RING';
    ring.rotation.x = Math.PI / 2.4;
    group.add(ring);

    // 1.25x scale for instant long-range legibility
    group.scale.set(1.25, 1.25, 1.25);
    return group;
  }

  /**
   * 2. 3D Rocket Jetpack Collectible:
   * Twin industrial rocket cylinders with intake manifold, dual exhaust nozzles,
   * hazard bands, and glowing twin propellant exhaust plumes.
   */
  public createJetpackPickup(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'PICKUP_JETPACK';

    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x37474f,
      roughness: 0.32,
      metalness: 0.88
    });
    this.curvedManager.applyCurvature(titaniumMat);

    const rocketMat = new THREE.MeshStandardMaterial({
      color: 0xff6d00,
      emissive: 0xff9100,
      emissiveIntensity: 0.45,
      roughness: 0.22,
      metalness: 0.65
    });
    this.curvedManager.applyCurvature(rocketMat);

    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0x212121,
      roughness: 0.3,
      metalness: 0.5
    });
    this.curvedManager.applyCurvature(stripeMat);

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffd600
    });

    // Central mounting chassis
    const chassisGeo = new THREE.BoxGeometry(0.28, 0.50, 0.16);
    const chassis = new THREE.Mesh(chassisGeo, titaniumMat);
    chassis.name = 'JETPACK_CHASSIS';
    group.add(chassis);

    // Center pressure core gauge
    const coreMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.18, 14), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
    coreMesh.name = 'JETPACK_CORE';
    coreMesh.rotation.x = Math.PI / 2;
    group.add(coreMesh);

    // Twin rocket cylinders, hazard stripes & nose cones
    const tankGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.62, 16);
    const stripeGeo = new THREE.CylinderGeometry(0.135, 0.135, 0.08, 16);
    const noseGeo = new THREE.ConeGeometry(0.13, 0.24, 16);
    const nozzleGeo = new THREE.CylinderGeometry(0.15, 0.10, 0.16, 14);
    const flameGeo = new THREE.ConeGeometry(0.10, 0.32, 12);

    [-0.22, 0.22].forEach((rx) => {
      const tank = new THREE.Mesh(tankGeo, rocketMat);
      tank.name = 'JETPACK_TANK';
      tank.position.set(rx, 0, 0);
      group.add(tank);

      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(rx, 0.05, 0);
      group.add(stripe);

      const nose = new THREE.Mesh(noseGeo, titaniumMat);
      nose.name = 'JETPACK_NOSE';
      nose.position.set(rx, 0.40, 0);
      group.add(nose);

      const nozzle = new THREE.Mesh(nozzleGeo, titaniumMat);
      nozzle.name = 'JETPACK_NOZZLE';
      nozzle.position.set(rx, -0.38, 0);
      group.add(nozzle);

      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.name = 'JETPACK_EXHAUST';
      flame.rotation.x = Math.PI; // Points downwards
      flame.position.set(rx, -0.60, 0);
      group.add(flame);
    });

    // Orbiting flame-amber propulsion ring
    const ringGeo = new THREE.TorusGeometry(0.60, 0.035, 8, 28);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff9100 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'JETPACK_RING';
    ring.rotation.x = Math.PI / 3;
    group.add(ring);

    // 1.25x scale for instant long-range legibility
    group.scale.set(1.25, 1.25, 1.25);
    return group;
  }

  /**
   * 3. 3D Super Sneakers Collectible:
   * Large high-top athletic sneaker with winged golden flight fins and upward kinetic energy rings.
   */
  public createSneakersPickup(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'PICKUP_SNEAKERS';

    const redShoeMat = new THREE.MeshStandardMaterial({
      color: 0xff1744,
      emissive: 0xd50000,
      emissiveIntensity: 0.38,
      roughness: 0.28,
      metalness: 0.45
    });
    this.curvedManager.applyCurvature(redShoeMat);

    const whiteRubberMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.22,
      metalness: 0.12
    });
    this.curvedManager.applyCurvature(whiteRubberMat);

    const goldWingMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 0.55,
      roughness: 0.16,
      metalness: 0.92
    });
    this.curvedManager.applyCurvature(goldWingMat);

    // Sole base with tread
    const soleGeo = new THREE.BoxGeometry(0.36, 0.12, 0.80);
    const sole = new THREE.Mesh(soleGeo, whiteRubberMat);
    sole.name = 'SNEAKER_SOLE';
    sole.position.set(0, -0.16, 0);
    group.add(sole);

    // Sneaker high-top body
    const upperGeo = new THREE.BoxGeometry(0.30, 0.34, 0.44);
    const upper = new THREE.Mesh(upperGeo, redShoeMat);
    upper.name = 'SNEAKER_UPPER';
    upper.position.set(0, 0.07, -0.10);
    group.add(upper);

    // Toe box with rubber cap
    const toeGeo = new THREE.BoxGeometry(0.30, 0.20, 0.34);
    const toe = new THREE.Mesh(toeGeo, whiteRubberMat);
    toe.name = 'SNEAKER_TOE';
    toe.position.set(0, 0.0, 0.23);
    group.add(toe);

    // Left and right golden wings
    const wingGeo = new THREE.ConeGeometry(0.20, 0.48, 4);
    const leftWing = new THREE.Mesh(wingGeo, goldWingMat);
    leftWing.name = 'SNEAKER_WING';
    leftWing.rotation.set(0.3, 0, -1.25);
    leftWing.position.set(-0.26, 0.20, -0.15);
    group.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, goldWingMat);
    rightWing.name = 'SNEAKER_WING';
    rightWing.rotation.set(0.3, 0, 1.25);
    rightWing.position.set(0.26, 0.20, -0.15);
    group.add(rightWing);

    // Kinetic green jump ring underneath
    const ringGeo = new THREE.TorusGeometry(0.55, 0.038, 8, 28);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e676 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'SNEAKER_RING';
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.24;
    group.add(ring);

    // 1.25x scale for instant long-range legibility
    group.scale.set(1.25, 1.25, 1.25);
    return group;
  }

  /**
   * 4. 3D Score Multiplier Collectible:
   * Bold golden "2X" dimensional insignia on a high-contrast dark obsidian hexagonal plate.
   */
  public createMultiplierPickup(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'PICKUP_MULTIPLIER';

    // Dark obsidian hexagonal badge plate for maximum contrast
    const plateGeo = new THREE.CylinderGeometry(0.58, 0.58, 0.10, 6);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x141002,
      emissive: 0x3e2723,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.85
    });
    this.curvedManager.applyCurvature(plateMat);
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.name = 'MULTIPLIER_PLATE';
    plate.rotation.x = Math.PI / 2;
    group.add(plate);

    // Glowing golden border rim
    const borderGeo = new THREE.TorusGeometry(0.57, 0.04, 8, 6);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 0.75,
      roughness: 0.15,
      metalness: 0.95
    });
    this.curvedManager.applyCurvature(borderMat);
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.name = 'MULTIPLIER_BORDER';
    border.position.z = 0.055;
    group.add(border);

    // Bold 3D Golden "2"
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xff8f00,
      emissiveIntensity: 0.55,
      roughness: 0.15,
      metalness: 0.92
    });
    this.curvedManager.applyCurvature(goldMat);

    const barGeo = new THREE.BoxGeometry(0.13, 0.40, 0.13);
    const hBarGeo = new THREE.BoxGeometry(0.34, 0.11, 0.13);

    // "2" shape
    const top2 = new THREE.Mesh(hBarGeo, goldMat);
    top2.name = 'MULTIPLIER_2X';
    top2.position.set(-0.21, 0.17, 0.09);
    group.add(top2);

    const diag2 = new THREE.Mesh(barGeo, goldMat);
    diag2.name = 'MULTIPLIER_2X';
    diag2.rotation.z = -0.62;
    diag2.position.set(-0.21, 0.01, 0.09);
    group.add(diag2);

    const bot2 = new THREE.Mesh(hBarGeo, goldMat);
    bot2.name = 'MULTIPLIER_2X';
    bot2.position.set(-0.21, -0.17, 0.09);
    group.add(bot2);

    // "X" shape
    const diagX1 = new THREE.Mesh(barGeo, goldMat);
    diagX1.name = 'MULTIPLIER_2X';
    diagX1.rotation.z = 0.785;
    diagX1.position.set(0.21, 0, 0.09);
    group.add(diagX1);

    const diagX2 = new THREE.Mesh(barGeo, goldMat);
    diagX2.name = 'MULTIPLIER_2X';
    diagX2.rotation.z = -0.785;
    diagX2.position.set(0.21, 0, 0.09);
    group.add(diagX2);

    // Subtle pitch toward camera
    group.rotation.x = 0.18;

    // 1.25x scale for instant long-range legibility
    group.scale.set(1.25, 1.25, 1.25);
    return group;
  }

  /**
   * 5. 3D Protective Shield Collectible:
   * Hexagonal cyber-aegis shield with glowing cyan energy border,
   * metallic boss, and heraldic defensive emblem.
   */
  public createShieldPickup(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'PICKUP_SHIELD';

    // Hexagonal Shield Body
    const shieldGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.09, 6);
    const shieldPlateMat = new THREE.MeshStandardMaterial({
      color: 0x01579b,
      emissive: 0x0288d1,
      emissiveIntensity: 0.45,
      roughness: 0.20,
      metalness: 0.82
    });
    this.curvedManager.applyCurvature(shieldPlateMat);
    const shieldPlate = new THREE.Mesh(shieldGeo, shieldPlateMat);
    shieldPlate.name = 'SHIELD_DOME';
    shieldPlate.rotation.x = Math.PI / 2;
    group.add(shieldPlate);

    // Outer cyan protective barrier rim
    const rimGeo = new THREE.TorusGeometry(0.52, 0.045, 8, 6);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.85,
      roughness: 0.10,
      metalness: 0.95
    });
    this.curvedManager.applyCurvature(rimMat);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.name = 'SHIELD_RING';
    rim.position.z = 0.045;
    group.add(rim);

    // Chrome central shield boss
    const bossGeo = new THREE.SphereGeometry(0.20, 16, 12);
    const bossMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.96,
      roughness: 0.10
    });
    this.curvedManager.applyCurvature(bossMat);
    const boss = new THREE.Mesh(bossGeo, bossMat);
    boss.name = 'SHIELD_BOSS';
    boss.scale.set(1.0, 1.0, 0.5);
    boss.position.z = 0.09;
    group.add(boss);

    // Inner bright defense star
    const starMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
    starMesh.name = 'SHIELD_STAR';
    starMesh.position.z = 0.15;
    group.add(starMesh);

    // Standing vertical heraldic orientation
    group.rotation.x = 0.15;

    // 1.25x scale for instant long-range legibility
    group.scale.set(1.25, 1.25, 1.25);
    return group;
  }

  /**
   * 6. 3D Hoverboard Token Collectible:
   * Floating angled hoverboard token with aerodynamic deck, grip tape,
   * and glowing repulsor thruster cores.
   */
  public createHoverboardPickup(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'PICKUP_HOVERBOARD';

    const deckGeo = new THREE.BoxGeometry(0.35, 0.07, 0.90);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x00e676,
      emissive: 0x00c853,
      emissiveIntensity: 0.55,
      roughness: 0.22,
      metalness: 0.72
    });
    this.curvedManager.applyCurvature(deckMat);
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.name = 'HOVERBOARD_DECK';
    group.add(deck);

    // Center grip tape pad
    const gripGeo = new THREE.BoxGeometry(0.26, 0.02, 0.70);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x12241b, roughness: 0.9 });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.name = 'HOVERBOARD_GRIP';
    grip.position.y = 0.04;
    group.add(grip);

    // Twin undercarriage repulsor discs
    const repGeo = new THREE.CylinderGeometry(0.10, 0.10, 0.045, 14);
    const repMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    [-0.26, 0.26].forEach((rz) => {
      const rep = new THREE.Mesh(repGeo, repMat);
      rep.name = 'HOVERBOARD_THRUSTER';
      rep.position.set(0, -0.045, rz);
      group.add(rep);
    });

    // Dynamic 3/4 surfing orientation
    group.rotation.set(0.35, 0.65, 0.20);

    // 1.25x scale for instant long-range legibility
    group.scale.set(1.25, 1.25, 1.25);
    return group;
  }

  /**
   * 7. 3D Golden Skeleton Key Collectible:
   * Classic ornate brass/gold key with clover loop bow, cylindrical shaft, and notched bit.
   */
  public createKey(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'COLLECTIBLE_KEY';

    const keyMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xff8f00,
      emissiveIntensity: 0.45,
      roughness: 0.16,
      metalness: 0.92
    });
    this.curvedManager.applyCurvature(keyMat);

    // Bow (Head Loop)
    const bowGeo = new THREE.TorusGeometry(0.22, 0.055, 12, 24);
    const bow = new THREE.Mesh(bowGeo, keyMat);
    bow.name = 'KEY_HEAD';
    bow.position.y = 0.35;
    group.add(bow);

    // Shaft / Barrel
    const shaftGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.60, 16);
    const shaft = new THREE.Mesh(shaftGeo, keyMat);
    shaft.name = 'KEY_SHAFT';
    shaft.position.y = -0.05;
    group.add(shaft);

    // Notched Bit Teeth
    const bit1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.05), keyMat);
    bit1.name = 'KEY_TOOTH';
    bit1.position.set(0.10, -0.25, 0);
    group.add(bit1);

    const bit2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.05), keyMat);
    bit2.name = 'KEY_TOOTH';
    bit2.position.set(0.08, -0.34, 0);
    group.add(bit2);

    // Orbiting golden sparkle ring
    const ringGeo = new THREE.TorusGeometry(0.48, 0.025, 8, 20);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'KEY_RING';
    ring.rotation.x = Math.PI / 3;
    group.add(ring);

    // Subtle pitch towards camera
    group.rotation.x = 0.20;

    return group;
  }

  /**
   * 8. Glowing Cyber Season Event Token (Faceted Diamond Prism)
   */
  public createSeasonToken(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'COLLECTIBLE_SEASON_TOKEN';

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
   * 9. Glowing Chrono Orb for Time Trial Mode (+5s)
   */
  public createChronoOrb(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'COLLECTIBLE_CHRONO_ORB';

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
