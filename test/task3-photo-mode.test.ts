/**
 * TASK 3 COMPREHENSIVE AUTOMATED VERIFICATION SUITE
 * Premium Cinematic Photo Mode and Gameplay Screenshot Capture
 */

import * as THREE from 'three';
import { CameraController } from '../src/scene/CameraController';
import { PhotoModeController, PhotoPresetId, LookAtTargetMode, ColorGradeFilter } from '../src/scene/PhotoModeController';
import { CharacterModel, PresentationPose } from '../src/player/CharacterModel';
import { Player } from '../src/player/Player';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { CONSTANTS } from '../src/core/Constants';

// Mock DOM environment if running in Node
if (typeof document === 'undefined') {
  (global as any).document = {
    createElement: (tag: string) => {
      const el: any = {
        tagName: tag.toUpperCase(),
        classList: {
          classes: new Set<string>(),
          add: (c: string) => el.classList.classes.add(c),
          remove: (c: string) => el.classList.classes.delete(c),
          contains: (c: string) => el.classList.classes.has(c),
          toggle: (c: string, force?: boolean) => {
            if (force === undefined) {
              if (el.classList.classes.has(c)) el.classList.classes.delete(c);
              else el.classList.classes.add(c);
            } else if (force) {
              el.classList.classes.add(c);
            } else {
              el.classList.classes.delete(c);
            }
          }
        },
        style: {},
        innerHTML: '',
        textContent: '',
        appendChild: (child: any) => child,
        removeChild: (child: any) => child,
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        click: () => {},
        getContext: () => ({
          drawImage: () => {},
          fillRect: () => {},
          createRadialGradient: () => ({ addColorStop: () => {} }),
          save: () => {},
          restore: () => {},
          beginPath: () => {},
          roundRect: () => {},
          fill: () => {},
          stroke: () => {},
          fillText: () => {}
        }),
        toBlob: (cb: any) => cb(new Blob(['fake-png-bytes'], { type: 'image/png' })),
        toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      };
      return el;
    },
    getElementById: () => null
  };
  (global as any).document.body = (global as any).document.createElement('body');
}

if (typeof window === 'undefined') {
  (global as any).window = {
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

if (typeof URL === 'undefined' || !URL.createObjectURL) {
  (global as any).URL = {
    createObjectURL: (blob: any) => `blob:http://localhost/${Math.random().toString(36).substring(7)}`,
    revokeObjectURL: () => {}
  };
}

let testCount = 0;
let passCount = 0;

function assert(condition: boolean, message: string) {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`✅ PASSED: ${message}`);
  } else {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestSuite() {
  console.log('============================================================');
  console.log('TASK 3: PHOTO MODE & SCREENSHOT CAPTURE VERIFICATION SUITE');
  console.log('============================================================\n');

  // Setup Mock Three.js scene & renderer
  const mockCanvas: any = document.createElement('canvas');
  mockCanvas.width = 1920;
  mockCanvas.height = 1080;

  const mockRenderer: any = {
    domElement: mockCanvas,
    toneMappingExposure: 1.15,
    render: () => {},
    setSize: () => {},
    setPixelRatio: () => {},
    info: { render: { calls: 0, triangles: 0 }, memory: { geometries: 0, textures: 0 } }
  };

  const mockWorldScene: any = {
    scene: new THREE.Scene(),
    renderer: mockRenderer,
    currentTheme: {
      id: 'MODERN_METRO',
      displayName: 'Modern District'
    }
  };

  const cameraController = new CameraController();
  const photoController = PhotoModeController.getInstance();
  photoController.init(cameraController, mockWorldScene);

  // Setup Mock Player
  const mockPlayer: any = {
    position: new THREE.Vector3(0, 0, -150),
    groundY: 0,
    speed: 25.0,
    score: 12500,
    coinsCollected: 84,
    distanceTraveled: 650,
    supportSurface: 'GROUND',
    model: new CharacterModel('char_jax', 'jax_classic')
  };

  // --- Test 1: Photo Mode Entry & Simulation Pause ---
  console.log('--- Test 1: Photo Mode Entry & Lifecycle Isolation ---');
  const initialScore = mockPlayer.score;
  const initialCoins = mockPlayer.coinsCollected;
  const initialDist = mockPlayer.distanceTraveled;
  const initialPos = mockPlayer.position.clone();

  photoController.enter(mockPlayer);
  assert(photoController.getIsActive() === true, 'PhotoModeController.getIsActive() returns true');
  assert(cameraController.isPhotoModeActive() === true, 'CameraController.isPhotoModeActive() returns true');
  
  // Verify that updating CameraController during photo mode does NOT overwrite photo camera
  const photoCamPosBefore = cameraController.camera.position.clone();
  cameraController.update(new THREE.Vector3(99, 99, 99), 0.016, 0, 50, 0, false, false);
  assert(
    cameraController.camera.position.x === photoCamPosBefore.x &&
    cameraController.camera.position.y === photoCamPosBefore.y &&
    cameraController.camera.position.z === photoCamPosBefore.z,
    'Gameplay camera tracking is bypassed while in Photo Mode'
  );

  // Verify zero score or distance awarded while in photo mode
  assert(mockPlayer.score === initialScore, 'Score remains strictly unchanged upon entering Photo Mode');
  assert(mockPlayer.coinsCollected === initialCoins, 'Coins remain strictly unchanged in Photo Mode');
  assert(mockPlayer.distanceTraveled === initialDist, 'Distance remains strictly unchanged in Photo Mode');
  assert(mockPlayer.position.equals(initialPos), 'Player position remains frozen in Photo Mode');

  // --- Test 2: Camera Orbit & Spherical Coordinates ---
  console.log('\n--- Test 2: Controlled Camera Orbit & Angles ---');
  photoController.setSetting('azimuth', 0.0, mockPlayer);
  photoController.setSetting('pitch', 0.1, mockPlayer);
  photoController.orbit(0.5, 0.2, mockPlayer);
  const afterOrbit = photoController.getSettings();
  assert(Math.abs(afterOrbit.azimuth - 0.5) < 0.001, 'Horizontal orbit increases azimuth angle');
  assert(Math.abs(afterOrbit.pitch - 0.3) < 0.001, 'Vertical orbit tilts camera pitch angle');

  // Verify 360 wrap around keeps azimuth in [-PI, PI]
  photoController.orbit(Math.PI * 4, 0, mockPlayer);
  const wrapped = photoController.getSettings().azimuth;
  assert(wrapped >= -Math.PI && wrapped <= Math.PI, 'Azimuth is safely constrained to [-PI, PI]');

  // Verify pitch clamping prevents gimbal lock / flipping upside down
  photoController.setSetting('pitch', 2.5, mockPlayer);
  assert(photoController.getSettings().pitch <= 1.35, 'Pitch cannot exceed upper limit (1.35 rad ~ 77 deg)');
  photoController.setSetting('pitch', -1.5, mockPlayer);
  assert(photoController.getSettings().pitch >= -0.45, 'Pitch cannot exceed lower limit (-0.45 rad ~ -25 deg)');

  // --- Test 3: Camera Zoom & Limits ---
  console.log('\n--- Test 3: Controlled Zoom Bounds ---');
  photoController.setSetting('distance', 5.0, mockPlayer);
  photoController.zoom(3.0, mockPlayer);
  assert(Math.abs(photoController.getSettings().distance - 8.0) < 0.001, 'Zoom in/out adjusts camera radial distance');

  // Minimum distance guard
  photoController.setSetting('distance', 0.2, mockPlayer);
  assert(photoController.getSettings().distance >= 1.2, 'Distance cannot drop below 1.2m close-up limit');

  // Maximum distance guard
  photoController.setSetting('distance', 50.0, mockPlayer);
  assert(photoController.getSettings().distance <= 20.0, 'Distance cannot exceed 20.0m vista limit');

  // --- Test 4: Ground Clipping Avoidance ---
  console.log('\n--- Test 4: Ground Clipping Avoidance ---');
  mockPlayer.position.set(0, 0, -100);
  mockPlayer.groundY = 0;
  // Tilt downwards with low elevation
  photoController.setSetting('pitch', -0.40, mockPlayer);
  photoController.setSetting('distance', 10.0, mockPlayer);
  photoController.setSetting('elevationOffset', -0.5, mockPlayer);
  photoController.update(mockPlayer);
  assert(cameraController.camera.position.y >= 0.18, 'Camera Y position never clips below ground level (>= 0.18m)');

  // Train rooftop ground clipping check
  mockPlayer.groundY = 4.2;
  mockPlayer.position.y = 4.2;
  photoController.update(mockPlayer);
  assert(cameraController.camera.position.y >= 4.38, 'Camera Y position never clips below train roof level (>= 4.38m)');

  // --- Test 5: Curated Cinematic Presets ---
  console.log('\n--- Test 5: Curated Cinematic Presets ---');
  const presets: PhotoPresetId[] = [
    'RUNNER_PORTRAIT',
    'ACTION_SHOT',
    'TRAIN_ROOFTOP',
    'ENVIRONMENTAL_VISTA',
    'CLASSIC_GAMEPLAY'
  ];

  for (const pid of presets) {
    photoController.applyPreset(pid, mockPlayer);
    const s = photoController.getSettings();
    assert(s.preset === pid, `Preset ${pid} applied successfully`);
    assert(s.fov >= 25 && s.fov <= 85, `Preset ${pid} FOV (${s.fov}°) is within valid range`);
    assert(s.distance >= 1.2 && s.distance <= 20.0, `Preset ${pid} distance (${s.distance}m) is valid`);
    assert(Number.isFinite(cameraController.camera.position.x), `Preset ${pid} camera X is finite`);
    assert(Number.isFinite(cameraController.camera.position.y), `Preset ${pid} camera Y is finite`);
    assert(Number.isFinite(cameraController.camera.position.z), `Preset ${pid} camera Z is finite`);
  }

  // Verify Runner Portrait preset framing specifics
  photoController.applyPreset('RUNNER_PORTRAIT', mockPlayer);
  assert(photoController.getSettings().lookAtMode === 'HEAD', 'Runner Portrait targets HEAD');
  assert(photoController.getSettings().fov === 42, 'Runner Portrait uses compressed 42° portrait lens');

  // Verify Environmental Vista preset framing specifics
  photoController.applyPreset('ENVIRONMENTAL_VISTA', mockPlayer);
  assert(photoController.getSettings().fov === 76, 'City Vista uses wide 76° lens');
  assert(photoController.getSettings().colorGrade === 'WARM_GOLDEN', 'City Vista defaults to Golden Hour color grade');

  // Verify Reset to Classic Gameplay
  photoController.resetToGameplay(mockPlayer);
  assert(photoController.getSettings().preset === 'CLASSIC_GAMEPLAY', 'Reset restores CLASSIC_GAMEPLAY preset');
  assert(photoController.getSettings().azimuth === 0, 'Classic gameplay azimuth is 0 (directly behind)');

  // --- Test 6: Field of View (FOV) & Exposure Adjustments ---
  console.log('\n--- Test 6: Field of View (FOV) & Exposure Adjustments ---');
  photoController.setSetting('fov', 50, mockPlayer);
  assert(cameraController.camera.fov === 50, 'Camera FOV matches photo mode setting');
  photoController.setSetting('fov', 15, mockPlayer);
  assert(cameraController.camera.fov === 25, 'Camera FOV clamped to minimum 25°');
  photoController.setSetting('fov', 110, mockPlayer);
  assert(cameraController.camera.fov === 85, 'Camera FOV clamped to maximum 85°');

  // Exposure adjustments
  photoController.setSetting('exposure', 0.5, mockPlayer);
  const targetExp = 1.15 * Math.pow(2, 0.5);
  assert(Math.abs(mockRenderer.toneMappingExposure - targetExp) < 0.01, 'Exposure EV bias scales toneMappingExposure');

  photoController.setSetting('exposure', -0.5, mockPlayer);
  const targetExpLow = 1.15 * Math.pow(2, -0.5);
  assert(Math.abs(mockRenderer.toneMappingExposure - targetExpLow) < 0.01, 'Negative EV bias dims toneMappingExposure');

  // --- Test 7: Color Grade Filters ---
  console.log('\n--- Test 7: Color Grade Filter CSS Generation ---');
  const filters: ColorGradeFilter[] = ['NATURAL', 'VIBRANT', 'CYBERPUNK', 'WARM_GOLDEN', 'NOIR', 'VINTAGE'];
  for (const f of filters) {
    const css = photoController.getColorGradeCss(f);
    assert(typeof css === 'string' && css.length > 0, `Filter ${f} generates valid CSS string: "${css}"`);
    if (f === 'NATURAL') assert(css === 'none', 'NATURAL filter produces "none"');
    if (f === 'NOIR') assert(css.includes('grayscale'), 'NOIR filter contains grayscale');
    if (f === 'CYBERPUNK') assert(css.includes('hue-rotate'), 'CYBERPUNK filter contains hue-rotate');
  }

  // --- Test 8: Character Presentation Poses (Non-authoritative) ---
  console.log('\n--- Test 8: Presentation Poses (Visual Only) ---');
  const poses: PresentationPose[] = ['DEFAULT', 'IDLE', 'RUN', 'JUMP', 'VICTORY', 'HOVERBOARD'];
  for (const pose of poses) {
    photoController.setSetting('characterPose', pose, mockPlayer);
    assert(mockPlayer.model.getPresentationPose() === pose, `CharacterModel presentation pose set to ${pose}`);
    
    // Animate one frame of presentation pose
    mockPlayer.model.updateAnimation('RUN', 25, 0, 0, 0.016);
    
    // Physics and gameplay state must remain completely unaltered!
    assert(mockPlayer.speed === 25.0, 'Player speed is unaffected by presentation pose');
    assert(mockPlayer.groundY === 4.2, 'Player groundY is unaffected by presentation pose');
    assert(mockPlayer.score === initialScore, 'Player score is unaffected by presentation pose');
  }

  // Verify Victory Pose computation
  mockPlayer.model.setPresentationPose('VICTORY');
  mockPlayer.model.updateAnimation('RUN', 25, 0, 0, 0.016);
  assert(mockPlayer.model.getPresentationPose() === 'VICTORY', 'Victory pose is active and rendered');

  // Clear pose restores default
  mockPlayer.model.clearPresentationPose();
  assert(mockPlayer.model.getPresentationPose() === 'DEFAULT', 'Clear presentation pose restores DEFAULT');

  // --- Test 9: Native Resolution PNG Screenshot Export ---
  console.log('\n--- Test 9: PNG Screenshot Export Pipeline ---');
  photoController.setSetting('showWatermark', true);
  photoController.setSetting('vignette', 0.40);
  photoController.setSetting('colorGrade', 'VIBRANT');

  const exportResult = await photoController.captureScreenshot(mockPlayer, 'Modern District', 'Jax');
  assert(exportResult.blob !== null && exportResult.blob !== undefined, 'Export produced valid Blob');
  assert(exportResult.blob.type === 'image/png', 'Export produced image/png MIME type');
  assert(exportResult.width === 1920 && exportResult.height === 1080, 'Export matches native render resolution (1920x1080)');
  assert(exportResult.filename.startsWith('MetroRunner3D_Photo_'), 'Export filename follows MetroRunner3D_Photo_* format');
  assert(exportResult.filename.endsWith('.png'), 'Export filename ends with .png extension');
  assert(exportResult.characterName === 'Jax', 'Export metadata includes correct character name');
  assert(exportResult.themeName === 'Modern District', 'Export metadata includes correct theme name');

  // --- Test 10: Exit & Full State Restoration ---
  console.log('\n--- Test 10: Exit & Full State Restoration ---');
  photoController.exit(mockPlayer);
  assert(photoController.getIsActive() === false, 'PhotoModeController.getIsActive() returns false after exit');
  assert(cameraController.isPhotoModeActive() === false, 'CameraController.isPhotoModeActive() returns false after exit');
  assert(mockRenderer.toneMappingExposure === 1.15, 'Renderer toneMappingExposure restored to baseline (1.15)');
  assert(cameraController.camera.fov === CONSTANTS.CAMERA_FOV, 'Camera FOV restored to baseline CONSTANTS.CAMERA_FOV');
  assert(mockPlayer.model.getPresentationPose() === 'DEFAULT', 'CharacterModel presentation pose reset to DEFAULT');

  // Normal gameplay tracking resumes seamlessly without errors
  cameraController.update(mockPlayer.position, 0.016, 0, 25, 0, false, false);
  assert(Number.isFinite(cameraController.camera.position.z), 'Gameplay camera tracking resumes with valid finite coordinates');

  // --- Test 11: GPU Resource Stability (Repeated Cycles) ---
  console.log('\n--- Test 11: GPU Resource Stability Across 50 Repeated Cycles ---');
  const baseCam = cameraController.camera;
  for (let i = 0; i < 50; i++) {
    photoController.enter(mockPlayer);
    photoController.applyPreset(presets[i % presets.length], mockPlayer);
    photoController.update(mockPlayer);
    photoController.exit(mockPlayer);
  }
  assert(cameraController.camera === baseCam, 'Reuses original PerspectiveCamera instance with zero camera reallocations');
  assert(mockRenderer.toneMappingExposure === 1.15, 'Tone mapping exposure consistently preserved across 50 cycles');

  console.log('\n============================================================');
  console.log(`🎉 ALL ${passCount}/${testCount} TASK 3 PHOTO MODE & SCREENSHOT TESTS PASSED!`);
  console.log('============================================================\n');
}

runTestSuite().catch((err) => {
  console.error('Unhandled failure in test suite:', err);
  process.exit(1);
});
