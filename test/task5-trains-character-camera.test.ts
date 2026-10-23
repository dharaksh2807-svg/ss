import * as THREE from 'three';
import { ObstacleFactory, TrainVariant } from '../src/track/ObstacleFactory';
import { CharacterMeshBuilder } from '../src/characters/CharacterMeshBuilder';
import { getAllCharacters } from '../src/characters/CharacterCatalog';
import { CameraController } from '../src/scene/CameraController';
import { CONSTANTS } from '../src/core/Constants';
import { MODERN_METRO_THEME } from '../src/environment/EnvironmentConfig';

console.log('🧪 Starting Task 5 Premium Trains, Character & Camera Test Suite...\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
    passedTests++;
  }
}

const factory = new ObstacleFactory();

// =========================================================================
// Suite 1: Three Distinct Modern Train Families & Silhouettes
// =========================================================================
console.log('--- Suite 1: Three Distinct Modern Train Families & Silhouettes ---');
{
  const variants: TrainVariant[] = ['MODERN_METRO', 'CLASSIC_TRANSIT', 'STREAMLINED_EXPRESS'];

  variants.forEach((v) => {
    const train = factory.createTrain(20.0, false, CONSTANTS.COLORS.TRAIN_BODY_1, v);
    assert(train instanceof THREE.Group, `${v}: Creates valid THREE.Group`);
    assert(train.userData.isTrain === true, `${v}: Tagged as isTrain`);
    assert(train.userData.variant === v, `${v}: Variant stored on userData`);
  });

  // Verify Modern Metro specifics: rounded nose, wrap-around windshield, visor, projector headlights
  const metro = factory.createTrain(20.0, false, CONSTANTS.COLORS.TRAIN_BODY_1, 'MODERN_METRO');
  let metroFillets = 0;
  let metroHeadlights = 0;
  let metroVisor = false;
  metro.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry instanceof THREE.CylinderGeometry && child.position.y > 0.5 && child.position.y < 2.0) {
        metroFillets++;
      }
      if (child.material && (child.material as any).color && (child.material as any).color.getHex() === 0xfffae6) {
        metroHeadlights++;
      }
      if (child.position.y > 3.7 && child.position.z > 8.0) {
        metroVisor = true;
      }
    }
  });
  assert(metroFillets >= 2, 'Modern Metro equips rounded front corner fillet columns');
  assert(metroHeadlights >= 2, 'Modern Metro equips dual projector headlights with DRL halo rings');
  assert(metroVisor, 'Modern Metro equips aerodynamic brow visor and route LED display');

  // Verify Classic Transit specifics: split windshield, center mullion, fluting panels, sealed-beam headlights
  const classic = factory.createTrain(20.0, false, CONSTANTS.COLORS.TRAIN_BODY_3, 'CLASSIC_TRANSIT');
  let classicMullion = false;
  let classicFluting = false;
  let classicRoundBezels = 0;
  classic.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (Math.abs(child.position.x) < 0.05 && Math.abs(child.position.y - 2.65) < 0.1 && child.position.z > 8.0) {
        classicMullion = true;
      }
      if (Math.abs(child.position.y - 1.3) < 0.1 && Math.abs(child.position.x) > 1.3) {
        classicFluting = true;
      }
      if (child.geometry instanceof THREE.TorusGeometry && Math.abs(child.position.y - 1.35) < 0.1) {
        classicRoundBezels++;
      }
    }
  });
  assert(classicMullion, 'Classic Transit equips structural center mullion separating split windshield panes');
  assert(classicFluting, 'Classic Transit equips corrugated stainless steel fluting panels');
  assert(classicRoundBezels >= 2, 'Classic Transit equips sealed-beam round headlights in cast bezels');

  // Verify Streamlined Express specifics: bullet nose cone, raked canopy (28 deg), cockpit avionics, slit headlights
  const express = factory.createTrain(20.0, false, CONSTANTS.COLORS.TRAIN_BODY_2, 'STREAMLINED_EXPRESS');
  let expressCone = false;
  let expressCanopy = false;
  let expressAvionics = 0;
  let expressSlitLamps = 0;
  express.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry instanceof THREE.CylinderGeometry && child.rotation.x > 1.0 && child.position.z > 9.0) {
        expressCone = true;
      }
      if (child.rotation.x < -0.40 && Math.abs(child.position.y - 2.7) < 0.2 && child.position.z > 8.0) {
        expressCanopy = true;
      }
      if (child.geometry instanceof THREE.PlaneGeometry && Math.abs(child.position.y - 2.3) < 0.15) {
        expressAvionics++;
      }
      if (child.position.y < 1.3 && child.position.y > 1.0 && child.position.z > 9.5) {
        expressSlitLamps++;
      }
    }
  });
  assert(expressCone, 'Streamlined Express equips aerodynamic bullet nose cone');
  assert(expressCanopy, 'Streamlined Express equips 28-degree swept panoramic cockpit canopy');
  assert(expressAvionics >= 2, 'Streamlined Express equips pilot cockpit avionics screens');
  assert(expressSlitLamps >= 2, 'Streamlined Express equips horizontal slit LED headlight arrays');
}

// =========================================================================
// Suite 2: Physical Accessibility & Roof Surface Elevation
// =========================================================================
console.log('\n--- Suite 2: Physical Accessibility & Roof Surface Elevation ---');
{
  const train = factory.createTrain(24.0, false, CONSTANTS.COLORS.TRAIN_BODY_1, 'MODERN_METRO');
  let catwalkMesh: THREE.Mesh | undefined;
  let thresholdMesh: THREE.Mesh | undefined;

  train.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry) {
      if (Math.abs(child.position.y - 4.28) < 0.05 && Math.abs(child.position.x) < 0.05 && Math.abs(child.position.z) < 1.0) {
        catwalkMesh = child;
      }
      if (Math.abs(child.position.y - 4.28) < 0.05 && child.position.z < -10.0) {
        thresholdMesh = child;
      }
    }
  });

  assert(catwalkMesh !== undefined, 'Dedicated central catwalk platform found');
  const catwalkGeo = catwalkMesh!.geometry as THREE.BoxGeometry;
  const catwalkTopY = catwalkMesh!.position.y + catwalkGeo.parameters.height * 0.5;
  assert(Math.abs(catwalkTopY - 4.35) < 0.005, `Catwalk top surface is strictly Y = 4.35m (got ${catwalkTopY.toFixed(3)}m)`);
  assert(catwalkMesh!.receiveShadow === true, 'Catwalk platform receives dynamic shadows');
  assert(thresholdMesh !== undefined, 'Rear hazard boundary threshold marks walkable roof boundary');

  // Verify ramp train
  const rampTrain = factory.createTrain(20.0, true, CONSTANTS.COLORS.TRAIN_BODY_1, 'MODERN_METRO');
  let hasRampMesh = false;
  let hasBulkhead = false;
  rampTrain.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.rotation.x > 0.3 && child.position.z > 10.0) {
        hasRampMesh = true;
      }
      if (child.position.z > 9.8 && child.position.z < 10.5 && child.position.y > 1.5) {
        hasBulkhead = true;
      }
    }
  });
  assert(hasRampMesh, 'Ramp train equips climbable sloped diamond-plate ramp');
  assert(hasBulkhead, 'Ramp train mounts reinforced end-wall bulkhead interface');
}

// =========================================================================
// Suite 3: Character Presentation, Facial Features & Full Roster
// =========================================================================
console.log('\n--- Suite 3: Character Presentation, Facial Features & Full Roster ---');
{
  const characters = getAllCharacters();
  assert(characters.length >= 4, `All 4 characters present in catalog (found ${characters.length})`);

  characters.forEach((char) => {
    const built = CharacterMeshBuilder.build(char.id);
    assert(built.rootGroup instanceof THREE.Group, `${char.name}: Builds valid humanoid rig`);
    assert(built.hipsGroup instanceof THREE.Group, `${char.name}: Hips group articulated`);
    assert(built.headGroup instanceof THREE.Group, `${char.name}: Head group articulated`);
    assert(built.leftArmGroup instanceof THREE.Group && built.rightArmGroup instanceof THREE.Group, `${char.name}: Arms articulated`);
    assert(built.leftLegGroup instanceof THREE.Group && built.rightLegGroup instanceof THREE.Group, `${char.name}: Legs articulated`);
    assert(built.backpackGroup instanceof THREE.Group, `${char.name}: Backpack gear equipped`);
    assert(built.leftSneaker instanceof THREE.Group && built.rightSneaker instanceof THREE.Group, `${char.name}: High-top sneakers equipped`);
  });

  // Verify Jax's stylized facial features and backward snapback cap
  const jax = CharacterMeshBuilder.build('char_jax');
  let jaxEyes = 0;
  let jaxPupils = 0;
  let jaxSpecular = 0;
  let jaxBrows = 0;
  let jaxNose = false;
  let jaxSmile = false;
  let jaxBackwardCapVisor = false;
  let jaxSnapbackStrap = false;
  let jaxSprayCans = 0;

  jax.headGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Eyes at -Z
      if (child.position.z < -0.15 && Math.abs(child.position.y - 0.02) < 0.05) {
        jaxEyes++;
      }
      // Eyebrows
      if (child.position.z < -0.15 && Math.abs(child.position.y - 0.09) < 0.04) {
        jaxBrows++;
      }
      // Nose
      if (child.position.z < -0.22 && Math.abs(child.position.y + 0.04) < 0.04) {
        jaxNose = true;
      }
      // Smile
      if (child.position.z < -0.20 && Math.abs(child.position.y + 0.11) < 0.04) {
        jaxSmile = true;
      }
      // Backward cap visor pointing +Z
      if (child.position.z > 0.15 && Math.abs(child.position.y - 0.12) < 0.05) {
        jaxBackwardCapVisor = true;
      }
      // Snapback strap at back +Z
      if (child.position.z > 0.22 && Math.abs(child.position.y - 0.04) < 0.05) {
        jaxSnapbackStrap = true;
      }
    }
  });

  jax.backpackGroup.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CylinderGeometry) {
      const geo = child.geometry as THREE.CylinderGeometry;
      if (Math.abs(geo.parameters.radiusTop - 0.042) < 0.01) {
        jaxSprayCans++;
      }
    }
  });

  assert(jaxEyes >= 2, 'Jax equips stylized 3D eyes');
  assert(jaxBrows >= 2, 'Jax equips expressive stylized eyebrows');
  assert(jaxNose, 'Jax equips sculpted nose bridge and tip');
  assert(jaxSmile, 'Jax equips confident runner smirk');
  assert(jaxBackwardCapVisor, 'Jax backward cap visor points back toward camera (+Z)');
  assert(jaxSnapbackStrap, 'Jax snapback adjustment strap positioned at back (+Z)');
  assert(jaxSprayCans === 2, 'Jax backpack holds dual metallic spray paint cans in holsters');
}

// =========================================================================
// Suite 4: Gameplay Camera Contracts & Dedicated Angle Modes
// =========================================================================
console.log('\n--- Suite 4: Gameplay Camera Contracts & Dedicated Angle Modes ---');
{
  const camController = new CameraController();
  const playerPos = new THREE.Vector3(0, 0, -100);

  // 1. In gameplay running mode: camera MUST be behind player (Z > playerPos.z)
  camController.setLobbyMode(false);
  camController.setIntroMode(false);
  camController.setGameOverMode(false);
  camController.update(playerPos, 0.016, 1.0, 15.0, 0, false);

  assert(camController.camera.position.z > playerPos.z, `Gameplay camera sits strictly behind player in +Z (cam Z=${camController.camera.position.z.toFixed(2)}, player Z=${playerPos.z.toFixed(2)})`);
  assert(camController.lookTarget.z < playerPos.z, `Gameplay camera lookTarget looks forward down -Z (look Z=${camController.lookTarget.z.toFixed(2)}, player Z=${playerPos.z.toFixed(2)})`);
  assert(camController.camera.position.y > playerPos.y, `Gameplay camera elevated above runner (cam Y=${camController.camera.position.y.toFixed(2)}, player Y=${playerPos.y.toFixed(2)})`);

  // 2. Lobby Mode: Front-quarter presentation
  camController.setLobbyMode(true);
  camController.reset(new THREE.Vector3(0, 0, 0));
  camController.update(new THREE.Vector3(0, 0, 0), 0.016, 1.0, 0, 0, false);
  assert(camController.camera.position.z > 0, 'Lobby camera frames runner from front-quarter');
  assert(Math.abs(camController.camera.position.x) > 0.1, 'Lobby camera offset provides three-quarter hero perspective');

  // 3. Opening Cinematic: Smooth transition from 3/4 front to chase
  camController.setIntroMode(true, playerPos);
  assert(camController.getIntroMode() === true, 'Intro mode activated');
  camController.updateIntro(0.1, playerPos, 0.016);
  assert(camController.camera.position.z < playerPos.z, 'Intro Phase 1 frames runner from front (cam Z < player Z)');
  camController.updateIntro(1.0, playerPos, 0.016);
  assert(camController.camera.position.z > playerPos.z, 'Intro completion sweeps camera behind runner into follow position');
  camController.finishIntro(playerPos);
  assert(camController.getIntroMode() === false, 'Intro cleanly finished');

  // 4. Game-Over Reaction Framing
  camController.setGameOverMode(true, playerPos);
  assert(camController.getGameOverMode() === true, 'Game-over camera mode enabled');
  camController.update(playerPos, 0.5, 2.0, 0, 0, false);
  assert(camController.camera.position.z < playerPos.z, 'Game-over camera frames expressive defeat reaction from front/side 3/4 angle');
  camController.setGameOverMode(false);
  assert(camController.getGameOverMode() === false, 'Game-over camera cleanly disengaged for next run');
}

// =========================================================================
// Suite 5: Lighting, Tone Mapping & Readability Invariants
// =========================================================================
console.log('\n--- Suite 5: Lighting, Tone Mapping & Readability Invariants ---');
{
  assert(MODERN_METRO_THEME.hemi.intensity >= 1.2, `Hemisphere ambient fill light boosted for subway readability (got ${MODERN_METRO_THEME.hemi.intensity})`);
  assert(MODERN_METRO_THEME.fill.intensity >= 0.6, `Fill light active to eliminate crushed pitch-black shadows (got ${MODERN_METRO_THEME.fill.intensity})`);
  assert(MODERN_METRO_THEME.hemi.ground === 0x546e7a, 'Ground ambient fill color lifted to cool steel slate (0x546e7a)');
  assert(MODERN_METRO_THEME.materials.bridgeMainColor === 0x37474f, 'Bridge main color tone lifted above pitch black (0x37474f)');
  assert(MODERN_METRO_THEME.materials.wallBaseColor === 0x8a9ba8, 'Wall base tone readable in transit environment (0x8a9ba8)');
}

console.log('\n========================================================================');
console.log(`🎉 ALL ${passedTests} / ${totalTests} TASK 5 TESTS PASSED SUCCESSFULLY!`);
console.log('========================================================================\n');
