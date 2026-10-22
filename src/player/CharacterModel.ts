import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { CurvedShaderManager } from '../scene/CurvedShader';

export class CharacterModel {
  public mesh: THREE.Group;

  // Root articulation groups
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

  // High-top sneakers
  private leftSneaker: THREE.Group;
  private rightSneaker: THREE.Group;

  // Gear & Accessories
  private hoverboardGroup: THREE.Group;
  private backpackGroup: THREE.Group;
  private capVisor: THREE.Mesh;
  private shadowMesh: THREE.Mesh;

  // Materials
  private skinMat: THREE.MeshStandardMaterial;
  private jacketMat: THREE.MeshStandardMaterial;
  private pantsMat: THREE.MeshStandardMaterial;
  private capMat: THREE.MeshStandardMaterial;
  private sneakerMainMat: THREE.MeshStandardMaterial;
  private sneakerSoleMat: THREE.MeshStandardMaterial;
  private hoverboardMat: THREE.MeshStandardMaterial;

  // Animation clocks & state
  private animTime: number = 0;
  private runSpeedRatio: number = 1.0;
  private isSuperSneakers: boolean = false;
  private sneakerWingsGroup: THREE.Group;

  constructor() {
    this.mesh = new THREE.Group();
    const curved = CurvedShaderManager.getInstance();

    // 1. Initialize Stylized PBR Materials
    this.skinMat = new THREE.MeshStandardMaterial({
      color: 0xffd1a9,
      roughness: 0.55,
      metalness: 0.05
    });

    this.jacketMat = new THREE.MeshStandardMaterial({
      color: 0x00bcd4, // Vibrant Cyan/Aqua
      roughness: 0.45,
      metalness: 0.1
    });

    this.pantsMat = new THREE.MeshStandardMaterial({
      color: 0x242b38, // Dark urban denim/cargo
      roughness: 0.65,
      metalness: 0.1
    });

    this.capMat = new THREE.MeshStandardMaterial({
      color: 0xff1744, // Vibrant Crimson Red
      roughness: 0.4,
      metalness: 0.15
    });

    this.sneakerMainMat = new THREE.MeshStandardMaterial({
      color: 0xff1744, // Red high-top canvas
      roughness: 0.35,
      metalness: 0.1
    });

    this.sneakerSoleMat = new THREE.MeshStandardMaterial({
      color: 0xf5f6fa, // Thick white rubber sole
      roughness: 0.25,
      metalness: 0.05
    });

    this.hoverboardMat = new THREE.MeshStandardMaterial({
      color: 0x00e676,
      emissive: 0x00b0ff,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8
    });

    // 2. Build Humanoid Hierarchical Skeleton
    this.rootGroup = new THREE.Group();
    this.mesh.add(this.rootGroup);

    // Hips / Pelvis
    this.hipsGroup = new THREE.Group();
    this.hipsGroup.position.set(0, 0.95, 0);
    this.rootGroup.add(this.hipsGroup);

    const pelvisGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.25, 12);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, this.pantsMat);
    pelvisMesh.castShadow = true;
    this.hipsGroup.add(pelvisMesh);

    // Spine / Upper Torso
    this.spineGroup = new THREE.Group();
    this.spineGroup.position.set(0, 0.15, 0);
    this.hipsGroup.add(this.spineGroup);

    // Torso body (jacket)
    const torsoGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.55, 14);
    const torsoMesh = new THREE.Mesh(torsoGeo, this.jacketMat);
    torsoMesh.position.set(0, 0.28, 0);
    torsoMesh.castShadow = true;
    this.spineGroup.add(torsoMesh);

    // Jacket white zipper line & trim (on chest, facing -Z forward)
    const zipperGeo = new THREE.BoxGeometry(0.04, 0.52, 0.04);
    const zipperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.8 });
    const zipper = new THREE.Mesh(zipperGeo, zipperMat);
    zipper.position.set(0, 0.28, -0.26);
    this.spineGroup.add(zipper);

    // Folded hoodie hood draped on upper back (facing +Z camera)
    const collarGeo = new THREE.TorusGeometry(0.22, 0.08, 8, 16);
    const collar = new THREE.Mesh(collarGeo, this.capMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0.54, 0.08);
    collar.castShadow = true;
    this.spineGroup.add(collar);

    // 3. Head, Hair, Backward Baseball Cap & Goggles
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.62, 0);
    this.spineGroup.add(this.headGroup);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.12, 10);
    const neck = new THREE.Mesh(neckGeo, this.skinMat);
    neck.position.set(0, -0.06, 0);
    this.headGroup.add(neck);

    // Head base (smoothed sphere/cylinder)
    const headGeo = new THREE.SphereGeometry(0.24, 16, 14);
    headGeo.scale(1.0, 1.15, 1.05);
    const headMesh = new THREE.Mesh(headGeo, this.skinMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Stylized Face: Eyes & Smile (facing -Z forward)
    const eyeWhiteGeo = new THREE.SphereGeometry(0.06, 10, 10);
    eyeWhiteGeo.scale(1.0, 1.25, 0.5);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const eyeIrisGeo = new THREE.SphereGeometry(0.035, 8, 8);
    eyeIrisGeo.scale(1.0, 1.0, 0.4);
    const eyeIrisMat = new THREE.MeshBasicMaterial({ color: 0x1a237e }); // Deep Navy Iris

    const pupilDotGeo = new THREE.SphereGeometry(0.015, 6, 6);
    const pupilDotMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Catchlight

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
    this.headGroup.add(leftEye);

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
    this.headGroup.add(rightEye);

    // Stylized smiling mouth (facing -Z forward)
    const smileGeo = new THREE.TorusGeometry(0.05, 0.012, 6, 12, Math.PI * 0.7);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x880e4f });
    const mouth = new THREE.Mesh(smileGeo, mouthMat);
    mouth.rotation.x = Math.PI / 2;
    mouth.rotation.z = Math.PI * 0.15;
    mouth.position.set(0, -0.12, -0.23);
    this.headGroup.add(mouth);

    // Dark hair tufts on forehead (facing -Z forward)
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.8 });
    const hairBangsGeo = new THREE.ConeGeometry(0.06, 0.16, 6);
    for (let h = -2; h <= 2; h++) {
      const bang = new THREE.Mesh(hairBangsGeo, hairMat);
      bang.rotation.x = -Math.PI * 0.65;
      bang.rotation.z = h * 0.22;
      bang.position.set(h * 0.055, 0.14, -0.21);
      this.headGroup.add(bang);
    }

    // Backward Baseball Cap (Crown covers top/front, visor points +Z towards camera)
    const capCrownGeo = new THREE.SphereGeometry(0.26, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const capCrown = new THREE.Mesh(capCrownGeo, this.capMat);
    capCrown.position.set(0, 0.08, 0.01);
    capCrown.castShadow = true;
    this.headGroup.add(capCrown);

    // Cap button on top
    const capBtnGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const capBtn = new THREE.Mesh(capBtnGeo, this.jacketMat);
    capBtn.position.set(0, 0.34, 0.01);
    this.headGroup.add(capBtn);

    // Curved Visor pointing BACKWARDS (facing camera at +Z)
    const visorGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.03, 16, 1, false, Math.PI * 0.7, Math.PI * 0.6);
    this.capVisor = new THREE.Mesh(visorGeo, this.capMat);
    this.capVisor.rotation.x = -0.2;
    this.capVisor.position.set(0, 0.12, 0.22);
    this.capVisor.castShadow = true;
    this.headGroup.add(this.capVisor);

    // Stylish Street Goggles resting on cap brim (visible from behind!)
    const goggleFrameGeo = new THREE.TorusGeometry(0.08, 0.02, 6, 16);
    const goggleLensGeo = new THREE.CircleGeometry(0.07, 12);
    const goggleLensMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      metalness: 0.9,
      roughness: 0.1
    });
    const goggleFrameMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });

    const leftGoggle = new THREE.Group();
    leftGoggle.add(new THREE.Mesh(goggleFrameGeo, goggleFrameMat));
    leftGoggle.add(new THREE.Mesh(goggleLensGeo, goggleLensMat));
    leftGoggle.position.set(-0.11, 0.16, 0.22);
    leftGoggle.rotation.x = 0.2;
    this.headGroup.add(leftGoggle);

    const rightGoggle = new THREE.Group();
    rightGoggle.add(new THREE.Mesh(goggleFrameGeo, goggleFrameMat));
    rightGoggle.add(new THREE.Mesh(goggleLensGeo, goggleLensMat));
    rightGoggle.position.set(0.11, 0.16, 0.22);
    rightGoggle.rotation.x = 0.2;
    this.headGroup.add(rightGoggle);

    // 4. Street Runner Backpack with Spray Cans (Mounted on back, facing +Z camera!)
    this.backpackGroup = this.createBackpack();
    this.backpackGroup.position.set(0, 0.26, 0.24);
    this.spineGroup.add(this.backpackGroup);

    // 5. Left & Right Articulated Arms
    // Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.35, 0.48, 0);
    this.spineGroup.add(this.leftArmGroup);

    const shoulderGeo = new THREE.SphereGeometry(0.12, 10, 10);
    const leftShoulder = new THREE.Mesh(shoulderGeo, this.jacketMat);
    this.leftArmGroup.add(leftShoulder);

    const bicepGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.32, 10);
    const leftBicep = new THREE.Mesh(bicepGeo, this.jacketMat);
    leftBicep.position.set(0, -0.16, 0);
    leftBicep.castShadow = true;
    this.leftArmGroup.add(leftBicep);

    this.leftForearmGroup = new THREE.Group();
    this.leftForearmGroup.position.set(0, -0.32, 0);
    this.leftArmGroup.add(this.leftForearmGroup);

    const forearmGeo = new THREE.CylinderGeometry(0.09, 0.075, 0.28, 10);
    const leftForearm = new THREE.Mesh(forearmGeo, this.skinMat);
    leftForearm.position.set(0, -0.14, 0);
    leftForearm.castShadow = true;
    this.leftForearmGroup.add(leftForearm);

    // Hand / Fist
    const fistGeo = new THREE.SphereGeometry(0.08, 8, 8);
    fistGeo.scale(0.8, 1.0, 1.1);
    const leftFist = new THREE.Mesh(fistGeo, this.skinMat);
    leftFist.position.set(0, -0.31, 0.02);
    this.leftForearmGroup.add(leftFist);

    // Right Arm
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.35, 0.48, 0);
    this.spineGroup.add(this.rightArmGroup);

    const rightShoulder = new THREE.Mesh(shoulderGeo, this.jacketMat);
    this.rightArmGroup.add(rightShoulder);

    const rightBicep = new THREE.Mesh(bicepGeo, this.jacketMat);
    rightBicep.position.set(0, -0.16, 0);
    rightBicep.castShadow = true;
    this.rightArmGroup.add(rightBicep);

    this.rightForearmGroup = new THREE.Group();
    this.rightForearmGroup.position.set(0, -0.32, 0);
    this.rightArmGroup.add(this.rightForearmGroup);

    const rightForearm = new THREE.Mesh(forearmGeo, this.skinMat);
    rightForearm.position.set(0, -0.14, 0);
    rightForearm.castShadow = true;
    this.rightForearmGroup.add(rightForearm);

    const rightFist = new THREE.Mesh(fistGeo, this.skinMat);
    rightFist.position.set(0, -0.31, 0.02);
    this.rightForearmGroup.add(rightFist);

    // 6. Left & Right Legs with High-Top Sneakers
    const thighGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.4, 10);
    const calfGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.38, 10);

    // Left Leg
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.16, -0.12, 0);
    this.hipsGroup.add(this.leftLegGroup);

    const leftThigh = new THREE.Mesh(thighGeo, this.pantsMat);
    leftThigh.position.set(0, -0.2, 0);
    leftThigh.castShadow = true;
    this.leftLegGroup.add(leftThigh);

    this.leftCalfGroup = new THREE.Group();
    this.leftCalfGroup.position.set(0, -0.4, 0);
    this.leftLegGroup.add(this.leftCalfGroup);

    const leftCalf = new THREE.Mesh(calfGeo, this.pantsMat);
    leftCalf.position.set(0, -0.19, 0);
    leftCalf.castShadow = true;
    this.leftCalfGroup.add(leftCalf);

    this.leftSneaker = this.createSneaker();
    this.leftSneaker.position.set(0, -0.4, 0.05);
    this.leftCalfGroup.add(this.leftSneaker);

    // Right Leg
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.16, -0.12, 0);
    this.hipsGroup.add(this.rightLegGroup);

    const rightThigh = new THREE.Mesh(thighGeo, this.pantsMat);
    rightThigh.position.set(0, -0.2, 0);
    rightThigh.castShadow = true;
    this.rightLegGroup.add(rightThigh);

    this.rightCalfGroup = new THREE.Group();
    this.rightCalfGroup.position.set(0, -0.4, 0);
    this.rightLegGroup.add(this.rightCalfGroup);

    const rightCalf = new THREE.Mesh(calfGeo, this.pantsMat);
    rightCalf.position.set(0, -0.19, 0);
    rightCalf.castShadow = true;
    this.rightCalfGroup.add(rightCalf);

    this.rightSneaker = this.createSneaker();
    this.rightSneaker.position.set(0, -0.4, 0.05);
    this.rightCalfGroup.add(this.rightSneaker);

    // 7. Super Sneakers Golden Wings (Visible when powerup active)
    this.sneakerWingsGroup = new THREE.Group();
    this.sneakerWingsGroup.visible = false;
    this.rootGroup.add(this.sneakerWingsGroup);

    // 8. Hoverboard (Aerodynamic with Neon Glow)
    this.hoverboardGroup = this.createHoverboard();
    this.hoverboardGroup.position.set(0, 0.08, 0);
    this.hoverboardGroup.visible = false;
    this.mesh.add(this.hoverboardGroup);

    // 9. Ground Blob Shadow
    const shadowGeo = new THREE.PlaneGeometry(1.4, 2.0);
    let shadowMat: THREE.Material;
    if (typeof document !== 'undefined') {
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 64;
      shadowCanvas.height = 64;
      const sCtx = shadowCanvas.getContext('2d')!;
      const grad = sCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
      grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 64, 64);

      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false
      });
    } else {
      shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.4
      });
    }
    curved.applyCurvature(shadowMat);

    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.04;
    this.mesh.add(this.shadowMesh);
  }

  /**
   * Constructs detailed high-top stylized sneaker
   */
  private createSneaker(): THREE.Group {
    const sneaker = new THREE.Group();

    // 1. Chunky sculpted rubber outsole (pointing forward in -Z)
    const soleGeo = new THREE.BoxGeometry(0.2, 0.1, 0.42);
    const sole = new THREE.Mesh(soleGeo, this.sneakerSoleMat);
    sole.position.set(0, 0.05, -0.02);
    sole.castShadow = true;
    sneaker.add(sole);

    // Rounded toe bumper pointing forward (-Z)
    const toeGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.1, 10);
    const toe = new THREE.Mesh(toeGeo, this.sneakerSoleMat);
    toe.position.set(0, 0.05, -0.2);
    sneaker.add(toe);

    // 2. High-top canvas shoe body
    const upperGeo = new THREE.BoxGeometry(0.18, 0.22, 0.34);
    const upper = new THREE.Mesh(upperGeo, this.sneakerMainMat);
    upper.position.set(0, 0.18, 0.01);
    upper.castShadow = true;
    sneaker.add(upper);

    // 3. Shoe tongue & white laces (forward -Z)
    const tongueGeo = new THREE.BoxGeometry(0.12, 0.22, 0.08);
    const tongueMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const tongue = new THREE.Mesh(tongueGeo, tongueMat);
    tongue.rotation.x = -0.2;
    tongue.position.set(0, 0.2, -0.12);
    sneaker.add(tongue);

    // Accent speed flash on shoe side
    const flashGeo = new THREE.BoxGeometry(0.19, 0.04, 0.2);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffea00 }); // Yellow lightning flash
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.set(0, 0.17, 0.02);
    sneaker.add(flash);

    return sneaker;
  }

  /**
   * Constructs street-runner graffiti backpack with spray cans
   */
  private createBackpack(): THREE.Group {
    const pack = new THREE.Group();

    // Main backpack body
    const bodyGeo = new THREE.BoxGeometry(0.36, 0.44, 0.22);
    const packMat = new THREE.MeshStandardMaterial({
      color: 0x37474f,
      roughness: 0.6,
      metalness: 0.1
    });
    const body = new THREE.Mesh(bodyGeo, packMat);
    body.castShadow = true;
    pack.add(body);

    // Outer pocket (facing camera in +Z)
    const pocketGeo = new THREE.BoxGeometry(0.28, 0.24, 0.08);
    const pocketMat = new THREE.MeshStandardMaterial({ color: 0x263238 });
    const pocket = new THREE.Mesh(pocketGeo, pocketMat);
    pocket.position.set(0, -0.08, 0.13);
    pack.add(pocket);

    // Spray paint cans nestled in side holsters
    const canGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.26, 10);
    const capGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8);

    // Left Can (Hot Pink)
    const canMat1 = new THREE.MeshStandardMaterial({ color: 0xff007f, metalness: 0.7, roughness: 0.3 });
    const can1 = new THREE.Mesh(canGeo, canMat1);
    can1.position.set(-0.21, 0, 0.04);
    const nozzle1 = new THREE.Mesh(capGeo, this.skinMat);
    nozzle1.position.set(0, 0.15, 0);
    can1.add(nozzle1);
    pack.add(can1);

    // Right Can (Electric Lime)
    const canMat2 = new THREE.MeshStandardMaterial({ color: 0x76ff03, metalness: 0.7, roughness: 0.3 });
    const can2 = new THREE.Mesh(canGeo, canMat2);
    can2.position.set(0.21, 0, 0.04);
    const nozzle2 = new THREE.Mesh(capGeo, this.skinMat);
    nozzle2.position.set(0, 0.15, 0);
    can2.add(nozzle2);
    pack.add(can2);

    return pack;
  }

  /**
   * Aerodynamic hoverboard with glowing repulsor discs and neon strip
   */
  private createHoverboard(): THREE.Group {
    const board = new THREE.Group();

    // Curved deck
    const deckGeo = new THREE.BoxGeometry(0.85, 0.08, 2.2);
    const deckMesh = new THREE.Mesh(deckGeo, this.hoverboardMat);
    deckMesh.castShadow = true;
    board.add(deckMesh);

    // Beveled upturned nose
    const noseGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.08, 16, 1, false, 0, Math.PI);
    const nose = new THREE.Mesh(noseGeo, this.hoverboardMat);
    nose.rotation.x = Math.PI / 2;
    nose.rotation.z = Math.PI;
    nose.position.set(0, 0.02, -1.1);
    board.add(nose);

    // Glowing Neon Perimeter Strip
    const stripGeo = new THREE.BoxGeometry(0.88, 0.03, 2.16);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.y = 0.01;
    board.add(strip);

    // Dual underslung repulsor discs
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

  /**
   * Update Procedural Animation & Articulation
   */
  public update(
    dt: number,
    state: 'RUNNING' | 'JUMPING' | 'SLIDING' | 'STUMBLING' | 'DEAD',
    hasHoverboard: boolean,
    hasSneakers: boolean,
    bankAngle: number = 0,
    jumpProgress: number = 0, // 0 to 1
    slideProgress: number = 0 // 0 to 1
  ): void {
    this.animTime += dt * 14.0;
    this.hoverboardGroup.visible = hasHoverboard;

    // Super sneakers glow
    if (this.isSuperSneakers !== hasSneakers) {
      this.isSuperSneakers = hasSneakers;
      this.sneakerMainMat.emissive.setHex(hasSneakers ? 0xffaa00 : 0x000000);
      this.sneakerMainMat.emissiveIntensity = hasSneakers ? 0.6 : 0.0;
    }

    // Dynamic Lateral Banking & Lean
    this.rootGroup.rotation.z = -bankAngle * 0.9;
    this.rootGroup.rotation.y = bankAngle * 0.45;

    // Shadow tracking & scaling
    if (state === 'JUMPING') {
      const scale = Math.max(0.4, 1.0 - jumpProgress * 0.5);
      this.shadowMesh.scale.set(scale, scale, 1.0);
    } else {
      this.shadowMesh.scale.set(1.0, 1.0, 1.0);
    }

    if (hasHoverboard) {
      this.animateHoverboard(dt);
      return;
    }

    switch (state) {
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
    state: 'IDLE' | 'RUN' | 'JUMP' | 'SLIDE' | 'CRASH',
    speed: number,
    bankingAngle: number,
    groundY: number,
    dt: number
  ): void {
    let animState: 'RUNNING' | 'JUMPING' | 'SLIDING' | 'STUMBLING' | 'DEAD' = 'RUNNING';
    if (state === 'JUMP') animState = 'JUMPING';
    else if (state === 'SLIDE') animState = 'SLIDING';
    else if (state === 'CRASH') animState = 'DEAD';
    else if (state === 'IDLE') animState = 'RUNNING';

    this.update(
      dt,
      animState,
      this.hoverboardGroup.visible,
      this.isSuperSneakers,
      bankingAngle
    );
  }

  public setHoverboardVisible(visible: boolean): void {
    this.hoverboardGroup.visible = visible;
  }

  public setSuperSneakersActive(active: boolean): void {
    this.isSuperSneakers = active;
  }

  /**
   * Athletic High-Cadence Sprint Cycle
   */
  private animateRunCycle(dt: number): void {
    const t = this.animTime;
    const sinT = Math.sin(t);
    const cosT = Math.cos(t);

    // Spine & Pelvis bounce bobbing
    this.hipsGroup.position.y = 0.95 + Math.abs(sinT) * 0.08;
    this.hipsGroup.rotation.y = -sinT * 0.08;
    this.spineGroup.rotation.y = sinT * 0.12; // Counter-rotation of shoulders
    this.spineGroup.rotation.x = 0.15; // Athletic forward torso pitch

    // Head subtle bob
    this.headGroup.position.y = 0.62 + Math.abs(cosT) * 0.03;
    this.headGroup.rotation.x = -0.08;

    // Arms swing in counter-phase with legs
    const armSwing = sinT * 0.75;
    this.leftArmGroup.rotation.x = -armSwing + 0.1;
    this.leftForearmGroup.rotation.x = -0.5 - Math.max(0, -sinT) * 0.5;

    this.rightArmGroup.rotation.x = armSwing + 0.1;
    this.rightForearmGroup.rotation.x = -0.5 - Math.max(0, sinT) * 0.5;

    // Legs swing & knee flexion
    const legSwing = sinT * 0.85;
    this.leftLegGroup.rotation.x = legSwing;
    this.leftCalfGroup.rotation.x = Math.max(0, -sinT) * 1.1; // Bend knee on back-kick

    this.rightLegGroup.rotation.x = -legSwing;
    this.rightCalfGroup.rotation.x = Math.max(0, sinT) * 1.1;

    // Reset offsets
    this.rootGroup.position.y = 0;
    this.rootGroup.rotation.x = 0;
  }

  /**
   * Dynamic Jump Takeoff and Airborne Pose
   */
  private animateJump(progress: number): void {
    // Tucked athletic airborne pose
    this.spineGroup.rotation.x = 0.1;
    this.headGroup.rotation.x = -0.15;

    // Arms outstretched for balance
    this.leftArmGroup.rotation.x = -0.4;
    this.leftArmGroup.rotation.z = -0.5;
    this.leftForearmGroup.rotation.x = -0.8;

    this.rightArmGroup.rotation.x = -0.4;
    this.rightArmGroup.rotation.z = 0.5;
    this.rightForearmGroup.rotation.x = -0.8;

    // Knees tucked slightly
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
    // Lower body center of mass smoothly to ground
    this.rootGroup.position.y = -0.45;
    this.rootGroup.rotation.x = -0.35; // Torso tilted back
    this.hipsGroup.rotation.y = 0.45; // Angled sideways

    // Left leg extended straight forward
    this.leftLegGroup.rotation.x = -1.2;
    this.leftCalfGroup.rotation.x = 0.1;

    // Right leg bent underneath
    this.rightLegGroup.rotation.x = 0.4;
    this.rightCalfGroup.rotation.x = 1.4;

    // Arms steadying balance
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

    // Surfer pose: Body turned 40 degrees
    this.hipsGroup.position.y = 0.95;
    this.hipsGroup.rotation.y = 0.65;
    this.spineGroup.rotation.x = 0.05;

    // Knees bent absorbing motion
    this.leftLegGroup.rotation.x = -0.25;
    this.leftCalfGroup.rotation.x = 0.4;
    this.rightLegGroup.rotation.x = 0.2;
    this.rightCalfGroup.rotation.x = 0.35;

    // Arms held out for dynamic balance
    this.leftArmGroup.rotation.set(-0.2, 0, -0.5);
    this.rightArmGroup.rotation.set(0.3, 0, 0.6);
  }

  private animateStumble(dt: number): void {
    this.spineGroup.rotation.x = -0.3; // Flinch backwards
    this.leftArmGroup.rotation.x = -1.2;
    this.rightArmGroup.rotation.x = -1.2;
  }

  private animateDead(): void {
    this.rootGroup.rotation.x = -Math.PI / 2;
    this.rootGroup.position.y = -0.6;
  }
}
