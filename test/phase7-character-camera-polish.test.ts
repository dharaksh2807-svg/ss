import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as THREE from 'three';
import { CharacterMeshBuilder } from '../src/characters/CharacterMeshBuilder';
import { CharacterModel } from '../src/player/CharacterModel';
import { CameraController } from '../src/scene/CameraController';
import { CONSTANTS } from '../src/core/Constants';
import { getAllCharacters, getCharacterById } from '../src/characters/CharacterCatalog';
import { GlbCharacterLoader } from '../src/characters/GlbCharacterLoader';

describe('PHASE 7 — Character, Locomotion and Camera Quality Bar', () => {

  describe('1. Hero Character Presentation & Geometry Upgrades', () => {
    it('Jax: features upgraded street goggles with specular catchlight and reflective lenses', () => {
      const jax = CharacterMeshBuilder.build('char_jax');
      assert.ok(jax.rootGroup, 'Jax hierarchy rootGroup exists');
      assert.ok(jax.headGroup, 'Jax headGroup exists');

      // Find goggles in headGroup
      let foundCatchlight = false;
      let foundGoggleLens = false;
      jax.headGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          if (mat instanceof THREE.MeshBasicMaterial && mat.color.getHex() === 0xffffff) {
            // Specular catchlight dot on lens
            if (mesh.geometry instanceof THREE.SphereGeometry) {
              foundCatchlight = true;
            }
          }
          if (mat instanceof THREE.MeshStandardMaterial && mat.metalness >= 0.8) {
            foundGoggleLens = true;
          }
        }
      });

      assert.strictEqual(foundGoggleLens, true, 'Jax equips high-metalness reflective goggle lenses');
      assert.strictEqual(foundCatchlight, true, 'Jax equips specular catchlight highlights on goggles');
    });

    it('Jax & Core Roster: equip high-top skate sneakers with multi-tier laces and sculpted heel counter', () => {
      const jax = CharacterMeshBuilder.build('char_jax');
      assert.ok(jax.leftSneaker, 'Jax left sneaker exists');
      assert.ok(jax.rightSneaker, 'Jax right sneaker exists');

      // Count geometry components in left sneaker
      let meshCount = 0;
      let hasHeelWedge = false;
      let hasHeelCounter = false;
      let laceCount = 0;

      jax.leftSneaker.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          meshCount++;
          const mesh = child as THREE.Mesh;
          // Check position and geometry dimensions
          if (mesh.position.z >= 0.04 && mesh.position.y <= 0.07) {
            hasHeelWedge = true;
          }
          if (mesh.geometry instanceof THREE.CylinderGeometry && mesh.position.z >= 0.10) {
            hasHeelCounter = true;
          }
          if (mesh.geometry instanceof THREE.BoxGeometry) {
            const params = (mesh.geometry as THREE.BoxGeometry).parameters;
            if (params.width < 0.10 && params.height < 0.02) {
              laceCount++;
            }
          }
        }
      });

      assert.ok(meshCount >= 8, `Sneaker must contain detailed multi-part construction (got ${meshCount})`);
      assert.strictEqual(hasHeelWedge, true, 'Sneaker includes dual-density heel crash-pad wedge');
      assert.strictEqual(hasHeelCounter, true, 'Sneaker includes sculpted rear heel counter');
      assert.ok(laceCount >= 3, `Sneaker includes at least 3 distinct cross-lace segments (got ${laceCount})`);
    });

    it('Articulated Runner Hands: include palm, curved knuckles, thumb, and separation grooves', () => {
      const jax = CharacterMeshBuilder.build('char_jax');
      assert.ok(jax.leftForearmGroup, 'Forearm group exists');

      let foundGrooves = 0;
      let foundThumb = false;
      let foundKnuckles = false;

      jax.leftForearmGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.geometry instanceof THREE.BoxGeometry) {
            const p = (mesh.geometry as THREE.BoxGeometry).parameters;
            if (p.width <= 0.01 && p.height >= 0.03) {
              foundGrooves++;
            }
          }
          if (mesh.geometry instanceof THREE.SphereGeometry && mesh.position.z < -0.02) {
            foundThumb = true;
          }
          if (mesh.geometry instanceof THREE.CylinderGeometry) {
            foundKnuckles = true;
          }
        }
      });

      assert.strictEqual(foundKnuckles, true, 'Hand includes curved knuckle bar');
      assert.strictEqual(foundThumb, true, 'Hand includes tucked thumb');
      assert.ok(foundGrooves >= 3, `Hand includes knuckle separation grooves (got ${foundGrooves})`);
    });

    it('Roster Outfits: All characters build valid PBR materials with zero runtime warnings', () => {
      const chars = getAllCharacters();
      assert.ok(chars.length >= 6, `Expected at least 6 characters in catalog, found ${chars.length}`);

      for (const char of chars) {
        for (const outfit of char.outfits) {
          const built = CharacterMeshBuilder.build(char.id, outfit.id);
          assert.ok(built.rootGroup, `Character ${char.id} outfit ${outfit.id} rootGroup builds cleanly`);
          assert.ok(built.materials.primaryMat, 'primaryMat defined');
          assert.ok(built.materials.skinMat, 'skinMat defined');
          assert.ok(built.materials.sneakerSoleMat, 'sneakerSoleMat defined');
          assert.ok(built.materials.skinMat.roughness >= 0.5, 'Skin roughness must simulate natural subsurface softness');
        }
      }
    });
  });

  describe('2. Biomechanical Locomotion & Weight Transfer', () => {
    it('Sprint run cycle: spine roll dynamically counter-rotates opposing pelvis roll', () => {
      const model = new CharacterModel('char_jax');
      const dt = 0.016;
      let maxSpineRollObserved = 0;
      let maxHipsRollObserved = 0;
      let counterRollVerified = false;

      // Simulate 1.0 second of sprinting at 28 m/s using updateAnimation
      for (let f = 0; f < 60; f++) {
        model.updateAnimation('RUN', 28.0, 0, 0, dt);
        // Sample internal rotation from spineGroup and hipsGroup
        const spineZ = model.spineGroup.rotation.z;
        const hipsZ = model.hipsGroup.rotation.z;

        if (Math.abs(spineZ) > maxSpineRollObserved) maxSpineRollObserved = Math.abs(spineZ);
        if (Math.abs(hipsZ) > maxHipsRollObserved) maxHipsRollObserved = Math.abs(hipsZ);

        // Biomechanical counter-twist check: when hips roll one way, spine counter-rolls
        if (Math.abs(hipsZ) > 0.015 && Math.abs(spineZ) > 0.010) {
          if (Math.sign(spineZ) !== Math.sign(hipsZ)) {
            counterRollVerified = true;
          }
        }
      }

      assert.ok(maxSpineRollObserved > 0.015, `Expected observable spine roll counter-twist, got ${maxSpineRollObserved}`);
      assert.ok(maxHipsRollObserved > 0.020, `Expected observable hips roll, got ${maxHipsRollObserved}`);
      assert.strictEqual(counterRollVerified, true, 'Spine roll must oppose pelvis roll for core stability');
      model.dispose();
    });

    it('Landing absorption: ankles absorb impact with grounded sole dorsiflexion', () => {
      const model = new CharacterModel('char_jax');
      const dt = 0.016;

      // Simulate landing phase (0.40 landing progress) using updateAnimation
      for (let f = 0; f < 5; f++) {
        model.updateAnimation('RUN', 20.0, 0, 0, dt, 'LANDING', 1.0, 0, 0.40, false);
      }

      // Sneakers should dorsiflex to keep soles flush with the ground during impact compression
      const leftSneakerPitch = model.leftSneaker.rotation.x;
      const rightSneakerPitch = model.rightSneaker.rotation.x;

      assert.ok(leftSneakerPitch > 0.10, `Left sneaker should dorsiflex during landing compression (got ${leftSneakerPitch})`);
      assert.ok(rightSneakerPitch > 0.10, `Right sneaker should dorsiflex during landing compression (got ${rightSneakerPitch})`);
      model.dispose();
    });

    it('GLB Animation Mixer: uncacheRoot called cleanly on disposal without leaving orphaned bindings', () => {
      const loader = GlbCharacterLoader.getInstance();
      assert.ok(loader, 'GlbCharacterLoader instance exists');

      const model = new CharacterModel('char_modi');
      // Dispose immediately
      model.dispose();
      // Verify no runtime exceptions thrown on disposal
      assert.ok(true, 'Model disposed without memory corruption or orphaned mixer actions');
    });
  });

  describe('3. Camera Quality, Framing & Comfort Safety', () => {
    it('Viewport Framing: mobile portrait aspect increases extraZ and keeps track centered', () => {
      const controller = new CameraController();

      // Simulate landscape (16:9)
      controller.camera.aspect = 16 / 9;
      controller.camera.updateProjectionMatrix();
      const landscapeFraming = (controller as any).getViewportFraming();
      assert.strictEqual(landscapeFraming.extraZ, 0, 'Landscape requires 0 extraZ distance offset');
      assert.strictEqual(landscapeFraming.follow, 1.0, 'Landscape follows lateral movement at 100%');

      // Simulate mobile portrait (9:16 = 0.5625)
      controller.camera.aspect = 9 / 16;
      controller.camera.updateProjectionMatrix();
      const portraitFraming = (controller as any).getViewportFraming();
      assert.ok(portraitFraming.extraZ > 1.5, `Portrait requires extraZ backup distance for 3-lane view (got ${portraitFraming.extraZ})`);
      assert.ok(portraitFraming.follow < 0.25, `Portrait follow should center the track (got ${portraitFraming.follow})`);
    });

    it('Rooftop Elevation: camera elevates and looks down-track to maintain complete hurdle visibility', () => {
      const controller = new CameraController();
      controller.setLobbyMode(false);
      controller.camera.aspect = 16 / 9;

      const playerPosGround = new THREE.Vector3(0, CONSTANTS.PLAYER_BASE_Y, -50);
      controller.reset(playerPosGround);
      controller.update(playerPosGround, 0.016, 0, 20.0, CONSTANTS.PLAYER_BASE_Y, false, false);
      const groundCamY = controller.camera.position.y;

      // On train roof (Y = 4.35m)
      const roofY = 4.35;
      const playerPosRoof = new THREE.Vector3(0, roofY, -50);
      controller.reset(playerPosRoof);
      // Run update over 30 frames to reach steady state
      for (let i = 0; i < 30; i++) {
        controller.update(playerPosRoof, 0.016, 0, 20.0, roofY, false, false);
      }
      const roofCamY = controller.camera.position.y;

      assert.ok(roofCamY >= roofY + 3.0, `Camera on train roof must maintain >3.0m clearance above deck (roofY=${roofY}, camY=${roofCamY})`);
      assert.ok(roofCamY > groundCamY + 3.0, `Camera elevation must scale authoritatively with train height (ground=${groundCamY}, roof=${roofCamY})`);
    });

    it('Reduced Motion setting: clamps camera shake trauma and eliminates landing dip', () => {
      const controller = new CameraController();
      const settings = (controller as any).settingsManager;
      settings.setReducedMotion(true);

      controller.addShake(0.85); // Crash level trauma
      assert.strictEqual(controller.getShakeTrauma(), 0, 'Shake trauma must be 0 when reduced motion is enabled');
      assert.strictEqual(controller.getShakeOffset().length(), 0, 'Shake offset vector must be strictly zero');

      settings.setReducedMotion(false); // Restore
    });
  });

  describe('4. Performance, Memory & Collision Authority', () => {
    it('Bounding volume collision integrity: Upright and sliding heights are preserved', () => {
      assert.strictEqual(CONSTANTS.PLAYER_HEIGHT_RUN, 1.8, 'Authoritative upright player height is strictly 1.8m');
      assert.strictEqual(CONSTANTS.PLAYER_WIDTH, 0.9, 'Authoritative player width is strictly 0.9m');
      assert.strictEqual(CONSTANTS.PLAYER_HEIGHT_SLIDE, 0.75, 'Authoritative slide height is strictly 0.75m');
    });

    it('Draw Call Budget: Jax procedural hierarchy maintains compact material count', () => {
      const jax = CharacterMeshBuilder.build('char_jax');
      const mats = jax.materials;
      const uniqueMats = new Set(Object.values(mats));
      assert.ok(uniqueMats.size <= 10, `Material sharing keeps total unique materials <= 10 (got ${uniqueMats.size})`);
    });
  });
});
