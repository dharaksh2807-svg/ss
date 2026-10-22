import * as THREE from 'three';
import { HoverboardDefinition, HoverboardId, getHoverboardById } from './HoverboardCatalog';

export interface BuiltHoverboard {
  group: THREE.Group;
  thrusterFires: THREE.Mesh[];
  energyRings: THREE.Mesh[];
  materials: THREE.Material[];
  definition: HoverboardDefinition;
  updateAnimation: (time: number, dt: number) => void;
}

export class HoverboardMeshBuilder {
  /**
   * Build complete high-detail 3D hoverboard model
   */
  public static build(boardId: HoverboardId = 'board_urban_glide'): BuiltHoverboard {
    const def = getHoverboardById(boardId) || getHoverboardById('board_urban_glide')!;
    const c = def.colors;
    const d = def.dimensions;

    const group = new THREE.Group();
    group.name = `hoverboard_${def.id}`;

    const materials: THREE.Material[] = [];
    const thrusterFires: THREE.Mesh[] = [];
    const energyRings: THREE.Mesh[] = [];

    // PBR Materials
    const deckMat = new THREE.MeshStandardMaterial({
      color: c.deckPrimary,
      roughness: 0.35,
      metalness: 0.25
    });
    materials.push(deckMat);

    const hullMat = new THREE.MeshStandardMaterial({
      color: c.deckSecondary,
      roughness: 0.5,
      metalness: 0.4
    });
    materials.push(hullMat);

    const gripMat = new THREE.MeshStandardMaterial({
      color: c.gripTape,
      roughness: 0.85,
      metalness: 0.05
    });
    materials.push(gripMat);

    const trimMat = new THREE.MeshStandardMaterial({
      color: c.trim,
      roughness: 0.2,
      metalness: 0.85,
      emissive: c.trim,
      emissiveIntensity: 0.25
    });
    materials.push(trimMat);

    const glowMat = new THREE.MeshBasicMaterial({
      color: c.neonGlow,
      transparent: true,
      opacity: 0.85
    });
    materials.push(glowMat);

    const plasmaMat = new THREE.MeshBasicMaterial({
      color: c.thrusterCore,
      transparent: true,
      opacity: 0.95
    });
    materials.push(plasmaMat);

    // 1. Base Main Hull / Deck
    const deckGeo = new THREE.BoxGeometry(d.width, d.thickness, d.length);
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    group.add(deckMesh);

    // Rounded Nose (Front: -Z)
    const noseGeo = new THREE.CylinderGeometry(d.width * 0.5, d.width * 0.5, d.thickness, 16, 1, false, 0, Math.PI);
    const noseMesh = new THREE.Mesh(noseGeo, deckMat);
    noseMesh.rotation.y = Math.PI;
    noseMesh.position.set(0, 0, -d.length * 0.5);
    noseMesh.castShadow = true;
    group.add(noseMesh);

    // Rounded Tail (Rear: +Z)
    const tailGeo = new THREE.CylinderGeometry(d.width * 0.45, d.width * 0.45, d.thickness, 16, 1, false, 0, Math.PI);
    const tailMesh = new THREE.Mesh(tailGeo, deckMat);
    tailMesh.position.set(0, 0, d.length * 0.5);
    tailMesh.castShadow = true;
    group.add(tailMesh);

    // 2. Traction Grip Pad
    const gripGeo = new THREE.BoxGeometry(d.width * 0.72, 0.015, d.length * 0.65);
    const gripMesh = new THREE.Mesh(gripGeo, gripMat);
    gripMesh.position.set(0, d.thickness * 0.5 + 0.008, 0);
    group.add(gripMesh);

    // Dual Traction Grip Lines
    const lineGeo = new THREE.BoxGeometry(d.width * 0.6, 0.018, 0.035);
    const frontLine = new THREE.Mesh(lineGeo, trimMat);
    frontLine.position.set(0, d.thickness * 0.5 + 0.01, -d.length * 0.22);
    group.add(frontLine);

    const backLine = new THREE.Mesh(lineGeo, trimMat);
    backLine.position.set(0, d.thickness * 0.5 + 0.01, d.length * 0.22);
    group.add(backLine);

    // 3. Side Rails & Metallic Trim
    const railGeo = new THREE.CylinderGeometry(0.025, 0.025, d.length * 0.85, 8);
    const leftRail = new THREE.Mesh(railGeo, trimMat);
    leftRail.rotation.x = Math.PI / 2;
    leftRail.position.set(-d.width * 0.51, 0, 0);
    group.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, trimMat);
    rightRail.rotation.x = Math.PI / 2;
    rightRail.position.set(d.width * 0.51, 0, 0);
    group.add(rightRail);

    // 4. Model-Specific Architecture
    if (def.id === 'board_urban_glide') {
      // Classic Magnetic Levitator Discs underneath
      const discGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.04, 16);
      const frontDisc = new THREE.Mesh(discGeo, hullMat);
      frontDisc.position.set(0, -d.thickness * 0.5 - 0.02, -d.length * 0.28);
      group.add(frontDisc);

      const rearDisc = new THREE.Mesh(discGeo, hullMat);
      rearDisc.position.set(0, -d.thickness * 0.5 - 0.02, d.length * 0.28);
      group.add(rearDisc);

      // Glowing Cyan Levitation Emitters
      const emitGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.015, 16);
      const frontEmit = new THREE.Mesh(emitGeo, glowMat);
      frontEmit.position.set(0, -d.thickness * 0.5 - 0.042, -d.length * 0.28);
      group.add(frontEmit);

      const rearEmit = new THREE.Mesh(emitGeo, glowMat);
      rearEmit.position.set(0, -d.thickness * 0.5 - 0.042, d.length * 0.28);
      group.add(rearEmit);

      // Undercarriage Energy Ring
      const ringGeo = new THREE.TorusGeometry(0.24, 0.02, 8, 24);
      const ring = new THREE.Mesh(ringGeo, glowMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, -d.thickness * 0.5 - 0.02, 0);
      group.add(ring);
      energyRings.push(ring);
    } 
    else if (def.id === 'board_pulse_rider') {
      // Supersonic Twin Engines
      const engineGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.55, 12);
      const leftEngine = new THREE.Mesh(engineGeo, hullMat);
      leftEngine.rotation.x = Math.PI / 2;
      leftEngine.position.set(-d.width * 0.44, 0.02, d.length * 0.28);
      group.add(leftEngine);

      const rightEngine = new THREE.Mesh(engineGeo, hullMat);
      rightEngine.rotation.x = Math.PI / 2;
      rightEngine.position.set(d.width * 0.44, 0.02, d.length * 0.28);
      group.add(rightEngine);

      // Dual Exhaust Nozzles
      const nozzleGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.1, 12);
      const leftNozzle = new THREE.Mesh(nozzleGeo, trimMat);
      leftNozzle.rotation.x = Math.PI / 2;
      leftNozzle.position.set(-d.width * 0.44, 0.02, d.length * 0.58);
      group.add(leftNozzle);

      const rightNozzle = new THREE.Mesh(nozzleGeo, trimMat);
      rightNozzle.rotation.x = Math.PI / 2;
      rightNozzle.position.set(d.width * 0.44, 0.02, d.length * 0.58);
      group.add(rightNozzle);

      // Rear Diffuser
      const diffGeo = new THREE.BoxGeometry(d.width * 0.5, 0.04, 0.2);
      const diffuser = new THREE.Mesh(diffGeo, trimMat);
      diffuser.position.set(0, -d.thickness * 0.5, d.length * 0.48);
      group.add(diffuser);

      // Blue Plasma Thruster Flames
      const flameGeo = new THREE.ConeGeometry(0.065, 0.45, 10);
      const leftFlame = new THREE.Mesh(flameGeo, plasmaMat);
      leftFlame.rotation.x = -Math.PI / 2;
      leftFlame.position.set(-d.width * 0.44, 0.02, d.length * 0.78);
      group.add(leftFlame);
      thrusterFires.push(leftFlame);

      const rightFlame = new THREE.Mesh(flameGeo, plasmaMat);
      rightFlame.rotation.x = -Math.PI / 2;
      rightFlame.position.set(d.width * 0.44, 0.02, d.length * 0.78);
      group.add(rightFlame);
      thrusterFires.push(rightFlame);
    }
    else if (def.id === 'board_aero_drift') {
      // Swept-Back Aerofoil Wings
      const wingGeo = new THREE.ConeGeometry(d.width * 0.65, d.length * 0.5, 3);
      const leftWing = new THREE.Mesh(wingGeo, deckMat);
      leftWing.rotation.x = -Math.PI / 2;
      leftWing.rotation.z = Math.PI / 6;
      leftWing.position.set(-d.width * 0.58, 0, -d.length * 0.05);
      group.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo, deckMat);
      rightWing.rotation.x = -Math.PI / 2;
      rightWing.rotation.z = -Math.PI / 6;
      rightWing.position.set(d.width * 0.58, 0, -d.length * 0.05);
      group.add(rightWing);

      // Wingtip Dihedral Fins
      const finGeo = new THREE.BoxGeometry(0.02, 0.16, 0.28);
      const leftFin = new THREE.Mesh(finGeo, trimMat);
      leftFin.position.set(-d.width * 0.76, 0.08, d.length * 0.05);
      group.add(leftFin);

      const rightFin = new THREE.Mesh(finGeo, trimMat);
      rightFin.position.set(d.width * 0.76, 0.08, d.length * 0.05);
      group.add(rightFin);

      // Ventral Stabilizer Keel Underneath
      const keelGeo = new THREE.BoxGeometry(0.035, 0.12, d.length * 0.65);
      const keel = new THREE.Mesh(keelGeo, hullMat);
      keel.position.set(0, -d.thickness * 0.5 - 0.06, 0);
      group.add(keel);

      // Emerald Plasma Thruster
      const flameGeo = new THREE.ConeGeometry(0.09, 0.5, 12);
      const flame = new THREE.Mesh(flameGeo, plasmaMat);
      flame.rotation.x = -Math.PI / 2;
      flame.position.set(0, 0, d.length * 0.68);
      group.add(flame);
      thrusterFires.push(flame);
    }
    else if (def.id === 'board_street_phantom') {
      // Aggressive Angular Stealth Cowlings
      const cowlGeo = new THREE.BoxGeometry(d.width * 0.35, d.thickness * 1.5, d.length * 0.5);
      const leftCowl = new THREE.Mesh(cowlGeo, hullMat);
      leftCowl.rotation.y = 0.08;
      leftCowl.position.set(-d.width * 0.38, 0.02, 0);
      group.add(leftCowl);

      const rightCowl = new THREE.Mesh(cowlGeo, hullMat);
      rightCowl.rotation.y = -0.08;
      rightCowl.position.set(d.width * 0.38, 0.02, 0);
      group.add(rightCowl);

      // Triple Rear Diffuser Blades
      for (let i = -1; i <= 1; i++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.09, 0.22), trimMat);
        fin.position.set(i * (d.width * 0.25), -d.thickness * 0.5 - 0.02, d.length * 0.5);
        group.add(fin);
      }

      // Dual Ion Thruster Flairs
      const ionGeo = new THREE.ConeGeometry(0.07, 0.42, 10);
      const leftIon = new THREE.Mesh(ionGeo, plasmaMat);
      leftIon.rotation.x = -Math.PI / 2;
      leftIon.position.set(-d.width * 0.36, 0.02, d.length * 0.68);
      group.add(leftIon);
      thrusterFires.push(leftIon);

      const rightIon = new THREE.Mesh(ionGeo, plasmaMat);
      rightIon.rotation.x = -Math.PI / 2;
      rightIon.position.set(d.width * 0.36, 0.02, d.length * 0.68);
      group.add(rightIon);
      thrusterFires.push(rightIon);

      // Violet Energy Arc Rings
      const arcGeo = new THREE.TorusGeometry(0.22, 0.018, 6, 20);
      const arc = new THREE.Mesh(arcGeo, glowMat);
      arc.rotation.x = Math.PI / 2;
      arc.position.set(0, -d.thickness * 0.5 - 0.015, -d.length * 0.15);
      group.add(arc);
      energyRings.push(arc);
    }

    // 5. Undercarriage Ground Neon Glow Emitter Disc
    const groundGlowGeo = new THREE.CircleGeometry(d.width * 0.7, 16);
    groundGlowGeo.rotateX(-Math.PI / 2);
    const groundGlowMat = new THREE.MeshBasicMaterial({
      color: c.neonGlow,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    materials.push(groundGlowMat);
    const groundGlow = new THREE.Mesh(groundGlowGeo, groundGlowMat);
    groundGlow.position.set(0, -0.06, 0);
    group.add(groundGlow);

    // Animation update function for thruster flickers and hover float
    const updateAnimation = (time: number, dt: number) => {
      // Flame pulse & flicker
      for (const flame of thrusterFires) {
        const flicker = 0.82 + Math.sin(time * 30.0 + flame.position.x * 10) * 0.18 + Math.random() * 0.1;
        flame.scale.set(1.0, flicker, 1.0);
      }
      // Energy ring gentle pulse
      for (const ring of energyRings) {
        const pulse = 1.0 + Math.sin(time * 6.0) * 0.06;
        ring.scale.set(pulse, pulse, 1.0);
      }
    };

    return {
      group,
      thrusterFires,
      energyRings,
      materials,
      definition: def,
      updateAnimation
    };
  }
}
