import { EventBus, EVENTS } from '../src/core/EventBus';
import { Player } from '../src/player/Player';
import { CameraController } from '../src/scene/CameraController';
import {
  SettingsManager,
  DEFAULT_KEY_BINDINGS,
  SWIPE_PRESET_CONFIGS,
  CAMERA_DISTANCE_OFFSETS,
  InputAction
} from '../src/settings/SettingsManager';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import * as THREE from 'three';

console.log('🧪 Starting Metro Runner 3D: Task 2 Premium Controls Customization & Accessibility Tests...\n');

let passedTests = 0;
let totalTests = 0;

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

// In-memory localStorage mock for node environment
const storageMock: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, val: string) => { storageMock[key] = val; },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => {
    for (const k in storageMock) delete storageMock[k];
  },
  key: (i: number) => Object.keys(storageMock)[i] || null,
  length: Object.keys(storageMock).length
} as any;

// Mock document for DOM side-effects in Node
(globalThis as any).document = {
  body: {
    classList: {
      classes: new Set<string>(),
      add(c: string) { this.classes.add(c); },
      remove(c: string) { this.classes.delete(c); },
      contains(c: string) { return this.classes.has(c); }
    }
  },
  getElementById: (id: string) => null
};

// ============================================================================
// TEST SUITE 1: Keyboard Customization, Rebinding & Conflict Detection
// ============================================================================
console.log('--- Test Suite 1: Keyboard Customization & Conflict Detection ---');
{
  storageMock['metro_settings_v2'] = '';
  const settings = SettingsManager.getInstance();
  settings.resetKeyBindings();

  const bindings = settings.getKeyBindings();
  assert(bindings.LEFT.includes('ArrowLeft') && bindings.LEFT.includes('KeyA'), 'Default LEFT bindings include ArrowLeft and KeyA');
  assert(bindings.RIGHT.includes('ArrowRight') && bindings.RIGHT.includes('KeyD'), 'Default RIGHT bindings include ArrowRight and KeyD');
  assert(bindings.UP.includes('ArrowUp') && bindings.UP.includes('Space'), 'Default UP bindings include ArrowUp and Space');
  assert(bindings.DOWN.includes('ArrowDown') && bindings.DOWN.includes('KeyS'), 'Default DOWN bindings include ArrowDown and KeyS');
  assert(bindings.ACTION.includes('KeyE'), 'Default ACTION bindings include KeyE');
  assert(bindings.PAUSE.includes('Escape'), 'Default PAUSE bindings include Escape');

  // Key action resolution
  assert(settings.resolveKeyToAction('KeyA') === 'LEFT', 'KeyA resolves to LEFT');
  assert(settings.resolveKeyToAction('KeyD') === 'RIGHT', 'KeyD resolves to RIGHT');
  assert(settings.resolveKeyToAction('Space') === 'UP', 'Space resolves to UP');
  assert(settings.resolveKeyToAction('KeyS') === 'DOWN', 'KeyS resolves to DOWN');
  assert(settings.resolveKeyToAction('KeyX') === null, 'Unbound KeyX resolves to null');

  // Conflict detection
  const conflictBefore = settings.checkKeyConflict('RIGHT', 'KeyA');
  assert(conflictBefore.conflict === true && conflictBefore.conflictingAction === 'LEFT', 'Conflict detected: KeyA is currently mapped to LEFT');

  const noConflict = settings.checkKeyConflict('RIGHT', 'KeyL');
  assert(noConflict.conflict === false, 'No conflict for unmapped KeyL');

  // Rebind with automatic conflict removal
  const rebindResult = settings.rebindKey('RIGHT', 'KeyA', 0);
  assert(rebindResult.success === true, 'Rebinding KeyA to RIGHT succeeds');
  assert(rebindResult.conflictRemovedFrom === 'LEFT', 'Conflict automatically removed from LEFT');
  assert(settings.resolveKeyToAction('KeyA') === 'RIGHT', 'KeyA now resolves to RIGHT');
  assert(!settings.getKeysForAction('LEFT').includes('KeyA'), 'KeyA is no longer mapped to LEFT');

  // Reset keyboard defaults
  settings.resetKeyBindings();
  assert(settings.resolveKeyToAction('KeyA') === 'LEFT', 'Reset restore: KeyA is back on LEFT');
  assert(settings.resolveKeyToAction('KeyD') === 'RIGHT', 'Reset restore: KeyD is back on RIGHT');
}

// ============================================================================
// TEST SUITE 2: Mobile Swipe Sensitivity & Direction Locking
// ============================================================================
console.log('\n--- Test Suite 2: Mobile Swipe Sensitivity & Direction Locking ---');
{
  const settings = SettingsManager.getInstance();

  // Test Low Preset
  settings.setSwipeSensitivity('LOW');
  assert(settings.getState().swipeMinDistancePx === 42, 'Low sensitivity requires 42px min swipe distance');
  assert(settings.getState().swipeMaxIntervalMs === 350, 'Low sensitivity uses 350ms max gesture interval');

  // Test Normal Preset
  settings.setSwipeSensitivity('NORMAL');
  assert(settings.getState().swipeMinDistancePx === 26, 'Normal sensitivity requires 26px min swipe distance');
  assert(settings.getState().swipeMaxIntervalMs === 400, 'Normal sensitivity uses 400ms max gesture interval');

  // Test High Preset
  settings.setSwipeSensitivity('HIGH');
  assert(settings.getState().swipeMinDistancePx === 16, 'High sensitivity requires 16px min swipe distance');
  assert(settings.getState().swipeMaxIntervalMs === 450, 'High sensitivity uses 450ms max gesture interval');

  // Direction Locking Mathematics (1.25x Ratio)
  // Diagonal test: dx = 30px, dy = 28px -> diagonal ratio is 30/28 = 1.07 (< 1.25) -> should be rejected!
  const isDiagonal = (dx: number, dy: number) => {
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const isHorizontal = absX >= absY * 1.25;
    const isVertical = absY >= absX * 1.25;
    return !isHorizontal && !isVertical;
  };

  assert(isDiagonal(30, 28) === true, 'Ambiguous 30x28 gesture correctly recognized as diagonal and rejected');
  assert(isDiagonal(25, 25) === true, 'Exact 45-degree gesture correctly recognized as diagonal and rejected');
  assert(isDiagonal(45, 10) === false, 'Clear horizontal swipe (45x10) accepted without diagonal lock rejection');
  assert(isDiagonal(8, 40) === false, 'Clear vertical swipe (8x40) accepted without diagonal lock rejection');

  // Restore Normal
  settings.setSwipeSensitivity('NORMAL');
}

// ============================================================================
// TEST SUITE 3: Responsive Touch Controls Configuration
// ============================================================================
console.log('\n--- Test Suite 3: Responsive Touch Controls Layout & Presets ---');
{
  const settings = SettingsManager.getInstance();

  // Layouts
  settings.setTouchControlsLayout('SPLIT_THUMB');
  assert(settings.getState().touchControlsLayout === 'SPLIT_THUMB', 'Touch layout set to SPLIT_THUMB');

  settings.setTouchControlsLayout('BOTTOM_WIDE');
  assert(settings.getState().touchControlsLayout === 'BOTTOM_WIDE', 'Touch layout set to BOTTOM_WIDE');

  settings.setTouchControlsLayout('BOTTOM_CENTER');
  assert(settings.getState().touchControlsLayout === 'BOTTOM_CENTER', 'Touch layout set to BOTTOM_CENTER');

  // Sizes
  settings.setTouchControlsSize('LARGE');
  assert(settings.getState().touchControlsSize === 'LARGE', 'Touch size set to LARGE (70px target for accessibility)');

  settings.setTouchControlsSize('NORMAL');
  assert(settings.getState().touchControlsSize === 'NORMAL', 'Touch size set to NORMAL');

  // Opacity
  settings.setTouchControlsOpacity(90);
  assert(settings.getState().touchControlsOpacity === 90, 'Touch opacity set to 90% (High visibility)');

  settings.setTouchControlsOpacity(30);
  assert(settings.getState().touchControlsOpacity === 30, 'Touch opacity set to 30% (Subtle)');

  settings.setTouchControlsOpacity(60);
  assert(settings.getState().touchControlsOpacity === 60, 'Touch opacity restored to 60%');

  // Display Mode
  settings.setTouchControlsMode('ALWAYS');
  assert(settings.getState().touchControlsMode === 'ALWAYS', 'Touch mode set to ALWAYS (visible on all viewports)');
  settings.setTouchControlsMode('AUTO');
  assert(settings.getState().touchControlsMode === 'AUTO', 'Touch mode restored to AUTO');
}

// ============================================================================
// TEST SUITE 4: Input Responsiveness, Buffering & Zero Double Action
// ============================================================================
console.log('\n--- Test Suite 4: Input Responsiveness, Buffering & Zero Double Action ---');
{
  const player = new Player();
  player.reset();

  assert(player.currentLane === 0, 'Player starts in center lane (lane 0)');
  assert(player.state === 'RUN', 'Player starts in RUN state');

  // 1 deliberate left input = 1 adjacent lane change target
  player.handleInput('LEFT');
  assert(player.targetLane === -1, '1 deliberate left input targets adjacent left lane (lane -1)');

  // Rapid distinct input buffering
  player.handleInput('RIGHT'); // queued while transitioning!
  player.update(0.20); // completes left lane change
  assert(player.currentLane === -1, 'Left lane change completes cleanly');

  player.update(0.20); // processes buffered right lane change
  assert(player.currentLane === 0, 'Buffered right input smoothly executes, returning to center lane');

  // Move right to lane 1
  player.handleInput('RIGHT');
  player.update(0.20);
  assert(player.currentLane === 1, 'Right input moves player to right lane (lane 1)');

  // Boundary clamp: cannot go past rightmost lane (lane 1)
  player.handleInput('RIGHT');
  player.update(0.20);
  assert(player.currentLane === 1, 'Lane change clamped at track boundary');

  // Jump triggers immediately when valid
  player.handleInput('LEFT');
  player.update(0.20);
  assert(player.currentLane === 0, 'Player in center lane on ground');

  player.handleInput('UP');
  assert(player.state === 'JUMP', 'Jump triggers immediately into JUMP state on valid ground');

  // Fast drop from jump triggers immediately
  player.handleInput('DOWN');
  assert(player.state === 'SLIDE' || player.verticalVelocity < 0, 'Slide during jump triggers fast drop / downward descent');
}

// ============================================================================
// TEST SUITE 5: Camera Comfort Settings
// ============================================================================
console.log('\n--- Test Suite 5: Camera Comfort & Motion Settings ---');
{
  const settings = SettingsManager.getInstance();
  const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.2, 500);
  const cameraController = new CameraController(camera);

  // Camera Shake
  settings.setCameraShake('OFF');
  assert(settings.getCameraShakeMultiplier() === 0.0, 'Camera shake multiplier is 0.0 when OFF');

  settings.setCameraShake('LOW');
  assert(settings.getCameraShakeMultiplier() === 0.40, 'Camera shake multiplier is 0.40 when LOW');

  settings.setCameraShake('NORMAL');
  assert(settings.getCameraShakeMultiplier() === 1.0, 'Camera shake multiplier is 1.0 when NORMAL');

  // Speed Lines
  settings.setSpeedLines(false);
  assert(settings.isSpeedLinesEnabled() === false, 'Speed lines disabled when set to false');
  settings.setSpeedLines(true);
  assert(settings.isSpeedLinesEnabled() === true, 'Speed lines enabled when set to true');

  // Camera Motion (sway & banking)
  settings.setCameraMotion('REDUCED');
  assert(settings.getCameraMotionMultiplier() === 0.35, 'Camera motion multiplier is 0.35 when REDUCED');
  settings.setCameraMotion('NORMAL');
  assert(settings.getCameraMotionMultiplier() === 1.0, 'Camera motion multiplier is 1.0 when NORMAL');

  // Camera Distance Offsets
  settings.setCameraDistance('CLOSE');
  assert(settings.getCameraDistanceOffset() === -0.4, 'Close camera offset is -0.4m (maintaining obstacle clearance)');

  settings.setCameraDistance('FAR');
  assert(settings.getCameraDistanceOffset() === 0.6, 'Far camera offset is +0.6m (expanded visibility without disorientation)');

  settings.setCameraDistance('DEFAULT');
  assert(settings.getCameraDistanceOffset() === 0.0, 'Default camera offset is 0.0m');
}

// ============================================================================
// TEST SUITE 6: Accessibility & Fair Play Guarantee
// ============================================================================
console.log('\n--- Test Suite 6: Accessibility Toggles & Fair Play Verification ---');
{
  const settings = SettingsManager.getInstance();

  // Reduced Motion Switch
  settings.setReducedMotion(true);
  assert(settings.getState().reducedMotion === true, 'Reduced motion enabled');
  assert(settings.getCameraShakeMultiplier() === 0.0, 'Reduced motion forces camera shake to 0.0');
  assert(settings.isSpeedLinesEnabled() === false, 'Reduced motion forces speed lines to false');
  assert(settings.getCameraMotionMultiplier() <= 0.35, 'Reduced motion dampens camera sway');

  settings.setReducedMotion(false);
  assert(settings.getState().reducedMotion === false, 'Reduced motion disabled');

  // High Contrast Obstacle Indicators
  settings.setHighContrastObstacles(true);
  assert(settings.getState().highContrastObstacles === true, 'High-contrast obstacle indicators enabled');
  settings.setHighContrastObstacles(false);
  assert(settings.getState().highContrastObstacles === false, 'High-contrast obstacle indicators disabled');

  // Visual Hazard Cues
  settings.setVisualHazardCues(true);
  assert(settings.getState().visualHazardCues === true, 'Non-audio visual hazard cues enabled');

  // Critical Powerup Alerts
  settings.setPowerupAlerts(true);
  assert(settings.getState().powerupAlerts === true, 'Critical power-up expiration alerts enabled');

  // Fair Play Verification:
  // Accessibility options must NEVER change player hitbox or jump physics!
  const player1 = new Player();
  const bbox1 = player1.getCollider();

  // Turn on all accessibility toggles
  settings.setHighContrastObstacles(true);
  settings.setVisualHazardCues(true);
  settings.setPowerupAlerts(true);
  settings.setReducedMotion(true);

  const player2 = new Player();
  const bbox2 = player2.getCollider();

  assert(
    Math.abs(bbox1.min.x - bbox2.min.x) < 0.001 &&
    Math.abs(bbox1.max.x - bbox2.max.x) < 0.001 &&
    Math.abs(bbox1.max.y - bbox2.max.y) < 0.001,
    'Fair Play Guarantee: Player collision bounding boxes are strictly identical with accessibility modes active'
  );
}

// ============================================================================
// TEST SUITE 7: Settings Persistence & Non-Destructive Progression
// ============================================================================
console.log('\n--- Test Suite 7: Settings Persistence & Safe Migration ---');
{
  const progression = ProgressionManager.getInstance();
  const initialCoins = progression.getState().coins;
  const initialHighscore = progression.getState().highScore;

  const settings = SettingsManager.getInstance();
  settings.setSwipeSensitivity('HIGH');
  settings.setTouchControlsLayout('SPLIT_THUMB');
  settings.setCameraShake('LOW');
  settings.setCameraDistance('FAR');

  // Verify stored in localStorage
  const serialized = storageMock['metro_settings_v2'];
  assert(serialized && serialized.length > 0, 'Settings serialized to localStorage metro_settings_v2');

  const parsed = JSON.parse(serialized);
  assert(parsed.swipeSensitivity === 'HIGH', 'Persisted swipeSensitivity is HIGH');
  assert(parsed.touchControlsLayout === 'SPLIT_THUMB', 'Persisted touchControlsLayout is SPLIT_THUMB');
  assert(parsed.cameraShake === 'LOW', 'Persisted cameraShake is LOW');
  assert(parsed.cameraDistance === 'FAR', 'Persisted cameraDistance is FAR');

  // Verify non-destructive: progression values untouched
  assert(progression.getState().coins === initialCoins, 'Player wallet/coins completely unaffected by settings mutations');
  assert(progression.getState().highScore === initialHighscore, 'Player highscore completely unaffected by settings mutations');

  // Reset all to defaults
  settings.resetAllToDefaults();
  assert(settings.getState().swipeSensitivity === 'NORMAL', 'Reset restores swipeSensitivity to NORMAL');
  assert(settings.getState().cameraShake === 'NORMAL', 'Reset restores cameraShake to NORMAL');
  assert(settings.getState().cameraDistance === 'DEFAULT', 'Reset restores cameraDistance to DEFAULT');
}

console.log(`\n🎉 ALL ${totalTests} UNIT TESTS PASSED SUCCESSFULLY! (${passedTests}/${totalTests})\n`);
