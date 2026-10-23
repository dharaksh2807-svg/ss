import * as THREE from 'three';
import { Player } from '../src/player/Player';
import { CameraController } from '../src/scene/CameraController';
import { ChaserModel } from '../src/characters/ChaserModel';
import { OpeningSequenceController, IntroPreference } from '../src/chase/OpeningSequenceController';
import { CONSTANTS } from '../src/core/Constants';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { CharacterId, getAllCharacters } from '../src/characters/CharacterCatalog';

// Mock DOM & localStorage for headless Node test runner
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

(global as any).localStorage = new MockLocalStorage();

function createMockEl(id: string, tag: string = 'div'): any {
  const el = {
    id,
    className: '',
    classList: {
      add: (c: string) => { if (!el.className.includes(c)) el.className += ` ${c}`; },
      remove: (c: string) => { el.className = el.className.replace(c, '').trim(); },
      contains: (c: string) => el.className.includes(c)
    },
    style: {} as any,
    textContent: '',
    innerHTML: '',
    children: [] as any[],
    appendChild: (child: any) => { el.children.push(child); return child; },
    addEventListener: () => {},
    setAttribute: () => {},
    value: ''
  };
  return el;
}

const mockDocElements: Record<string, any> = {
  'ui-overlay': createMockEl('ui-overlay'),
  'ui-container': createMockEl('ui-container'),
  'setting-opening-cinematic': createMockEl('setting-opening-cinematic', 'select')
};

(global as any).document = {
  getElementById: (id: string) => mockDocElements[id] || createMockEl(id),
  createElement: (tag: string) => createMockEl(`mock-${tag}`, tag),
  body: createMockEl('body')
};

(global as any).window = {
  addEventListener: () => {},
  innerWidth: 1920,
  innerHeight: 1080
};

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, msg: string): void {
  if (condition) {
    testsPassed++;
    console.log(`✅ PASSED: ${msg}`);
  } else {
    testsFailed++;
    console.error(`❌ FAILED: ${msg}`);
  }
}

function assertClose(a: number, b: number, eps: number = 0.05, msg: string): void {
  const diff = Math.abs(a - b);
  assert(diff <= eps, `${msg} (expected ~${b}, got ${a}, diff=${diff})`);
}

console.log('\n=======================================================');
console.log('🧪 RUNNING TASK 4: OPENING SEQUENCE & CHASER TESTS');
console.log('=======================================================\n');

// Suite 1: ChaserModel Visual Geometry & Material Architecture
console.log('--- Suite 1: Chaser Model Visuals & Rig Hierarchy ---');
{
  const chaser = new ChaserModel();
  assert(chaser.mesh !== null, 'Chaser mesh group is constructed');
  assert(chaser.mesh.name === 'Chaser_OfficerThorne', 'Chaser model is named Officer Thorne');

  let meshCount = 0;
  let materialCount = 0;
  chaser.mesh.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      meshCount++;
      const mat = (child as THREE.Mesh).material;
      if (mat) materialCount++;
    }
  });

  assert(meshCount >= 18, `Chaser model has detailed humanoid geometry (${meshCount} meshes)`);
  assert(materialCount >= 18, `Chaser meshes have specialized materials (${materialCount} materials)`);
  assert(chaser.getMode() === 'STANDBY', 'Chaser initializes in STANDBY mode');
  assert(chaser.mesh.visible === false, 'Chaser mesh is culled/hidden on standby at start');
}

// Suite 2: Procedural Poses & Articulation Animation
console.log('\n--- Suite 2: Chaser Procedural Articulation & Animation States ---');
{
  const chaser = new ChaserModel();
  const playerPos = new THREE.Vector3(0, CONSTANTS.PLAYER_BASE_Y, -50);

  // 1. INTRO stance
  chaser.setMode('INTRO');
  assert(chaser.getMode() === 'INTRO', 'Chaser sets mode to INTRO');
  assert(chaser.mesh.visible === true, 'Chaser is visible in INTRO mode');
  chaser.update(0.1, playerPos, 0, CONSTANTS.PLAYER_BASE_Y);
  assertClose(chaser.currentDistanceZ, 3.5, 0.5, 'Chaser positions behind runner during intro');

  // 2. PURSUIT_RUN stance
  chaser.setMode('STANDBY');
  chaser.update(0.5, playerPos, 15.0, CONSTANTS.PLAYER_BASE_Y);
  assert(chaser.currentDistanceZ > 4.2, 'Chaser smoothly glides back towards trailing standby distance');

  // 3. STUMBLE lunge reaction
  let whistleEmitted = false;
  EventBus.getInstance().on(EVENTS.CHASER_WHISTLE, () => {
    whistleEmitted = true;
  });

  chaser.triggerStumbleReaction();
  assert(chaser.getMode() === 'STUMBLE', 'Chaser enters STUMBLE mode on player stumble');
  assert(whistleEmitted === true, 'Chaser emits whistle trill on stumble');

  // Chaser updates during stumble reaction
  for (let f = 0; f < 10; f++) {
    chaser.update(0.05, playerPos, 12.0, CONSTANTS.PLAYER_BASE_Y);
  }
  assert(chaser.currentDistanceZ < 5.0, `Chaser surges close behind runner during stumble (${chaser.currentDistanceZ.toFixed(2)}m)`);

  // After reaction duration (1.6s), chaser recovers back to standby
  for (let f = 0; f < 35; f++) {
    chaser.update(0.05, playerPos, 15.0, CONSTANTS.PLAYER_BASE_Y);
  }
  assert(chaser.getMode() === 'STANDBY', 'Chaser smoothly returns to STANDBY after stumble duration expires');

  // 4. CAUGHT stance on game over
  chaser.triggerCaughtReaction();
  assert(chaser.getMode() === 'CAUGHT', 'Chaser enters CAUGHT mode on fatal crash');
  for (let f = 0; f < 10; f++) {
    chaser.update(0.1, playerPos, 0, CONSTANTS.PLAYER_BASE_Y);
  }
  assertClose(chaser.currentDistanceZ, 1.8, 0.2, 'Chaser closes in to authoritative catch distance on game over');
}

// Suite 3: Opening Sequence Timing, Phases & Progression
console.log('\n--- Suite 3: Opening Cinematic Sequence Phases & Timing ---');
{
  const player = new Player();
  const cameraController = new CameraController();
  const chaser = new ChaserModel();
  const opening = new OpeningSequenceController(player, cameraController, chaser);

  // Set preference to ALWAYS for testing
  opening.setPreference('ALWAYS');
  assert(opening.getPreference() === 'ALWAYS', 'Intro preference set to ALWAYS');

  let introStarted = false;
  let introFinished = false;
  EventBus.getInstance().on(EVENTS.INTRO_STARTED, () => { introStarted = true; });
  EventBus.getInstance().on(EVENTS.INTRO_FINISHED, () => { introFinished = true; });

  const started = opening.start(false);
  assert(started === true, 'OpeningSequenceController started successfully');
  assert(opening.isActive() === true, 'Opening sequence is active');
  assert(introStarted === true, 'INTRO_STARTED event fired');
  assert(player.speed === 0, 'Player starts stationary at 0 m/s');
  assert(player.isIntroInvincible === true, 'Player has intro invulnerability protection');
  assert(cameraController.getIntroMode() === true, 'CameraController is in intro mode');

  // Phase 1 (0.0s – 0.85s): Encounter, alert & whistle
  opening.update(0.4);
  assert(opening.isActive() === true, 'Intro remains active during Phase 1');
  assert(player.speed === 0, 'Player remains stationary during encounter phase');
  assert(player.position.z === 0, 'Player has not moved forward yet');

  // Phase 2 (0.85s – 1.6s): Sprint takeoff & acceleration
  opening.update(0.6); // Total 1.0s elapsed
  assert(player.speed > 0, `Player accelerates into sprint takeoff (${player.speed.toFixed(2)} m/s)`);
  assert(player.position.z < 0, `Player advances forward on track (${player.position.z.toFixed(2)}m)`);

  // Phase 3 (1.6s – 2.4s): Camera blends into gameplay chase view
  opening.update(0.9); // Total 1.9s elapsed
  assertClose(player.speed, CONSTANTS.INITIAL_SPEED, 0.5, 'Player hits full initial cruising speed');

  // Completion at 2.4s
  opening.update(0.6); // Total 2.5s elapsed
  assert(opening.isActive() === false, 'Intro sequence completes at 2.4s');
  assert(introFinished === true, 'INTRO_FINISHED event fired');
  assert(player.isIntroInvincible === false, 'Player invulnerability removed after intro');
  assert(cameraController.getIntroMode() === false, 'Camera smoothly restored to standard gameplay view');
  assert(chaser.getMode() === 'STANDBY', 'Chaser placed into standby trailing mode');
}

// Suite 4: Skip Behavior & Instant Controls
console.log('\n--- Suite 4: Opening Sequence Skippability ---');
{
  const player = new Player();
  const cameraController = new CameraController();
  const chaser = new ChaserModel();
  const opening = new OpeningSequenceController(player, cameraController, chaser);

  opening.setPreference('ALWAYS');
  opening.start(false);
  assert(opening.isActive() === true, 'Intro started');
  assert(player.isIntroInvincible === true, 'Player protected');

  // Advance partially into intro
  opening.update(0.3);
  assert(opening.isActive() === true, 'Intro at 0.3s');

  // User hits Skip (Spacebar, Escape, or UI Click)
  opening.skip();
  assert(opening.isActive() === false, 'Intro immediately finishes on skip');
  assertClose(player.speed, CONSTANTS.INITIAL_SPEED, 0.1, 'Player speed set to initial speed on skip');
  assert(player.isIntroInvincible === false, 'Player invulnerability removed');
  assert(cameraController.getIntroMode() === false, 'Camera restored to gameplay view');
  assert(chaser.getMode() === 'STANDBY', 'Chaser in standby mode');
}

// Suite 5: Repeat Intro Preferences & Retry Behavior
console.log('\n--- Suite 5: Repeat Preferences & Retry Optimization ---');
{
  const player = new Player();
  const cameraController = new CameraController();
  const chaser = new ChaserModel();
  const opening = new OpeningSequenceController(player, cameraController, chaser);

  // 1. FIRST_ONLY (Default): Plays on fresh run, skips on retry
  opening.setPreference('FIRST_ONLY');
  assert(opening.getPreference() === 'FIRST_ONLY', 'Preference is FIRST_ONLY');
  assert(opening.shouldPlayIntro(false) === true, 'FIRST_ONLY plays intro on new run');
  assert(opening.shouldPlayIntro(true) === false, 'FIRST_ONLY skips intro on retry to avoid multi-second wait');

  // Starting with isRetry=true returns false and immediately finishes
  const playedOnRetry = opening.start(true);
  assert(playedOnRetry === false, 'start(true) immediately skips intro for fast retry');
  assert(opening.isActive() === false, 'Intro is not active on retry');

  // 2. ALWAYS: Plays every time
  opening.setPreference('ALWAYS');
  assert(opening.shouldPlayIntro(false) === true, 'ALWAYS plays on new run');
  assert(opening.shouldPlayIntro(true) === true, 'ALWAYS plays on retry');

  // 3. DISABLED: Never plays intro
  opening.setPreference('DISABLED');
  assert(opening.shouldPlayIntro(false) === false, 'DISABLED never plays on new run');
  assert(opening.shouldPlayIntro(true) === false, 'DISABLED never plays on retry');

  // Verify persistence in localStorage
  assert(localStorage.getItem('metro_opening_cinematic') === 'DISABLED', 'Preference persisted in localStorage');
}

// Suite 6: Character and Outfit Roster Compatibility
console.log('\n--- Suite 6: Character Roster Compatibility ---');
{
  const characters = getAllCharacters();
  assert(characters.length >= 4, `Found ${characters.length} characters in roster`);

  for (const char of characters) {
    const player = new Player();
    const cameraController = new CameraController();
    const chaser = new ChaserModel();
    const opening = new OpeningSequenceController(player, cameraController, chaser);

    // Apply character
    player.applyCharacter(char.id, char.outfits[0].id);
    assert(player.model.getCharacterId() === char.id, `Player applies ${char.id}`);

    opening.setPreference('ALWAYS');
    const started = opening.start(false);
    assert(started === true, `Intro sequence starts cleanly for character ${char.name}`);

    // Update through all phases
    opening.update(0.85);
    opening.update(0.85);
    opening.update(0.85);

    assert(opening.isActive() === false, `Intro completes cleanly for character ${char.name}`);
    assert(player.isIntroInvincible === false, `Collision state consistent for ${char.name}`);
  }
}

// Suite 7: Nonfatal Stumble & Collision Recovery Feedback
console.log('\n--- Suite 7: Stumble and Collision Recovery Reactions ---');
{
  const player = new Player();
  player.reset(); // Sets state = 'RUN' and speed = 18 m/s
  const chaser = new ChaserModel();

  // 1. Nonfatal stumble
  assert(player.isStumbling === false, 'Player starts not stumbling');
  player.stumble();
  assert(player.isStumbling === true, 'Player is marked stumbling');
  assert(player.getEffectiveSpeed() < player.speed, 'Player suffers speed dip during stumble (-22%)');

  chaser.triggerStumbleReaction();
  assert(chaser.getMode() === 'STUMBLE', 'Chaser triggers STUMBLE lunge reaction');

  // 2. Shield break recovery
  player.powerups.activate('SHIELD');
  assert(player.powerups.hasShieldActive() === true, 'Shield activated');

  let chaserReactionTriggered = false;
  EventBus.getInstance().on(EVENTS.CHASER_STUMBLE_REACTION, () => {
    chaserReactionTriggered = true;
  });

  const fatalFromShieldBreak = player.crash('BARRIER_COLLISION');
  assert(fatalFromShieldBreak === false, 'Crash absorbed by shield');
  assert(chaserReactionTriggered === true, 'Chaser stumble reaction fired on shield break recovery');

  // 3. Fatal crash preservation
  player.powerups.reset();
  const fatalCrash = player.crash('DIRECT_TRAIN_HEADON');
  assert(fatalCrash === true, 'Fatal crash preserves intended death behavior');
  assert(player.state === 'CRASH', 'Player enters CRASH state');

  chaser.triggerCaughtReaction();
  assert(chaser.getMode() === 'CAUGHT', 'Chaser enters CAUGHT mode on fatal crash');
}

// Suite 8: Terrain & Support Elevation Follow Tracking
console.log('\n--- Suite 8: Dynamic Elevation & Lane Tracking ---');
{
  const chaser = new ChaserModel();
  const playerPos = new THREE.Vector3(CONSTANTS.LANES[1], 4.35, -120); // Right lane on train roof (y=4.35m)

  chaser.setMode('STUMBLE');
  for (let f = 0; f < 30; f++) {
    chaser.update(0.033, playerPos, 15.0, 4.35);
  }

  assertClose(chaser.mesh.position.x, CONSTANTS.LANES[1], 0.2, 'Chaser smoothly tracks player lane transition');
  assertClose(chaser.mesh.position.y, 4.35, 0.3, 'Chaser smoothly tracks train roof vertical elevation');
}

console.log('\n=======================================================');
console.log(`📊 TASK 4 TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('=======================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
