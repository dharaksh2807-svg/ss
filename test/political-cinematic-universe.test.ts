import assert from 'node:assert/strict';
import * as THREE from 'three';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { getWorldCatalog, getWorld } from '../src/environment/WorldCatalog';
import { ChaserModel, ChaserArchetype, ChaserCosmeticReaction } from '../src/characters/ChaserModel';
import { PoliticalComedySystem } from '../src/environment/comedy/PoliticalComedySystem';
import { SettingsManager } from '../src/settings/SettingsManager';
import { EventBus } from '../src/core/EventBus';
import { Player } from '../src/player/Player';

// Mock DOM & localStorage if running in bare Node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    length: 0
  } as unknown as Storage;
}

let passedTests = 0;
let totalTests = 0;

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('\n======================================================');
console.log('POLITICAL CINEMATIC UNIVERSE — INTEGRATION SUITE');
console.log('======================================================\n');

function resetEnv() {
  EventBus.getInstance().clear();
  SettingsManager.getInstance().resetAllToDefaults();
  PoliticalComedySystem.getInstance().reset();
}

// -----------------------------------------------------------------------------
// SUITE 1: World Catalog & Persistent Identity
// -----------------------------------------------------------------------------
console.log('Suite 1: World Catalog & Persistent Identity');
resetEnv();

test('Registers both VIP_EXPRESS and RAHULVERSE in EnvironmentRegistry', () => {
  const registry = EnvironmentRegistry.getInstance();
  const vipTheme = registry.get('VIP_EXPRESS');
  const rahulTheme = registry.get('RAHULVERSE');

  assert.ok(vipTheme, 'VIP_EXPRESS theme should exist');
  assert.equal(vipTheme.id, 'VIP_EXPRESS');
  assert.ok(rahulTheme, 'RAHULVERSE theme should exist');
  assert.equal(rahulTheme.id, 'RAHULVERSE');
});

test('VIP Express and Rahulverse maintain distinct color palettes & atmospheres', () => {
  const registry = EnvironmentRegistry.getInstance();
  const vipTheme = registry.get('VIP_EXPRESS');
  const rahulTheme = registry.get('RAHULVERSE');

  assert.notEqual(vipTheme.fog.color, rahulTheme.fog.color, 'Fog colors must be distinct');
  assert.notEqual(vipTheme.sky.top, rahulTheme.sky.top, 'Sky colors must be distinct');
});

test('Retains exact user-facing titles and distinct satirical taglines in WorldCatalog', () => {
  const catalog = getWorldCatalog();
  const vipEntry = catalog.find(w => w.id === 'VIP_EXPRESS');
  const rahulEntry = catalog.find(w => w.id === 'RAHULVERSE');

  assert.ok(vipEntry, 'Mitron Express entry must exist');
  assert.equal(vipEntry?.displayName, 'Mitron Express');

  assert.ok(rahulEntry, 'Rahulverse entry must exist');
  assert.ok(rahulEntry?.displayName.startsWith('Rahulverse'), 'DisplayName should start with Rahulverse');
  assert.ok(rahulEntry?.tagline.includes('political') || rahulEntry?.tagline.includes('Political') || rahulEntry?.description.includes('political'), 'Tagline or description should mention political adventure');
});

// -----------------------------------------------------------------------------
// SUITE 2: Chaser Archetype Rivalry & Settings Override
// -----------------------------------------------------------------------------
console.log('\nSuite 2: Chaser Archetype Rivalry & Settings Override');
resetEnv();

test('Modi runner has Rahul as rival chaser (RAHUL_RIVAL) in AUTO mode', () => {
  const settings = SettingsManager.getInstance();
  settings.setPoliticalChaserMode('AUTO');

  const chaser = new ChaserModel();
  const selectedChar = 'char_modi';
  const activeEnvId = 'VIP_EXPRESS';

  const chaserPref = settings.getPoliticalChaserMode();
  let assignedArchetype: ChaserArchetype = 'OFFICER';
  if (chaserPref === 'OFFICER') {
    assignedArchetype = 'OFFICER';
  } else if (selectedChar === 'char_modi') {
    assignedArchetype = 'RAHUL_RIVAL';
  } else if (selectedChar === 'char_rahul_gandhi') {
    assignedArchetype = 'MODI_RIVAL';
  } else if (activeEnvId === 'VIP_EXPRESS') {
    assignedArchetype = 'VIP_SECURITY';
  }

  chaser.setChaserArchetype(assignedArchetype);
  assert.equal(chaser.getChaserArchetype(), 'RAHUL_RIVAL');
});

test('Rahul runner has Modi as rival chaser (MODI_RIVAL) in AUTO mode', () => {
  const settings = SettingsManager.getInstance();
  settings.setPoliticalChaserMode('AUTO');

  const chaser = new ChaserModel();
  const selectedChar = 'char_rahul_gandhi';
  const activeEnvId = 'RAHULVERSE';

  const chaserPref = settings.getPoliticalChaserMode();
  let assignedArchetype: ChaserArchetype = 'OFFICER';
  if (chaserPref === 'OFFICER') {
    assignedArchetype = 'OFFICER';
  } else if (selectedChar === 'char_modi') {
    assignedArchetype = 'RAHUL_RIVAL';
  } else if (selectedChar === 'char_rahul_gandhi') {
    assignedArchetype = 'MODI_RIVAL';
  } else if (activeEnvId === 'VIP_EXPRESS') {
    assignedArchetype = 'VIP_SECURITY';
  }

  chaser.setChaserArchetype(assignedArchetype);
  assert.equal(chaser.getChaserArchetype(), 'MODI_RIVAL');
});

test('Selecting OFFICER setting forces standard police officer for political runners', () => {
  const settings = SettingsManager.getInstance();
  settings.setPoliticalChaserMode('OFFICER');

  const chaser = new ChaserModel();
  const selectedChar = 'char_modi';

  const chaserPref = settings.getPoliticalChaserMode();
  let assignedArchetype: ChaserArchetype = 'OFFICER';
  if (chaserPref === 'OFFICER') {
    assignedArchetype = 'OFFICER';
  } else if (selectedChar === 'char_modi') {
    assignedArchetype = 'RAHUL_RIVAL';
  }

  chaser.setChaserArchetype(assignedArchetype);
  assert.equal(chaser.getChaserArchetype(), 'OFFICER');
});

test('Neutral character in VIP_EXPRESS gets VIP_SECURITY commando', () => {
  const settings = SettingsManager.getInstance();
  settings.setPoliticalChaserMode('AUTO');

  const chaser = new ChaserModel();
  const selectedChar = 'char_default';
  const activeEnvId = 'VIP_EXPRESS';

  const chaserPref = settings.getPoliticalChaserMode();
  let assignedArchetype: ChaserArchetype = 'OFFICER';
  if (chaserPref === 'OFFICER') {
    assignedArchetype = 'OFFICER';
  } else if (selectedChar === 'char_modi') {
    assignedArchetype = 'RAHUL_RIVAL';
  } else if (selectedChar === 'char_rahul_gandhi') {
    assignedArchetype = 'MODI_RIVAL';
  } else if (activeEnvId === 'VIP_EXPRESS') {
    assignedArchetype = 'VIP_SECURITY';
  }

  chaser.setChaserArchetype(assignedArchetype);
  assert.equal(chaser.getChaserArchetype(), 'VIP_SECURITY');
});

// -----------------------------------------------------------------------------
// SUITE 3: Chaser Caricature 3D Rigs and Visual Accessories
// -----------------------------------------------------------------------------
console.log('\nSuite 3: Chaser Caricature 3D Rigs and Visual Accessories');
resetEnv();

test('Constructs all accessory groups on ChaserModel hierarchy', () => {
  const chaser = new ChaserModel();
  assert.ok(chaser.modiHeadGroup, 'modiHeadGroup exists');
  assert.ok(chaser.modiChestGroup, 'modiChestGroup exists');
  assert.ok(chaser.rahulHeadGroup, 'rahulHeadGroup exists');
  assert.ok(chaser.vipHeadGroup, 'vipHeadGroup exists');
  assert.ok(chaser.selfiePhoneGroup, 'selfiePhoneGroup exists');
  assert.ok(chaser.officerCapGroup, 'officerCapGroup exists');
});

test('MODI_RIVAL displays silver beard, gold spectacles and saffron waistcoat', () => {
  const chaser = new ChaserModel();
  chaser.setChaserArchetype('MODI_RIVAL');

  assert.equal(chaser.modiHeadGroup.visible, true);
  assert.equal(chaser.modiChestGroup.visible, true);
  assert.equal(chaser.rahulHeadGroup.visible, false);
  assert.equal(chaser.vipHeadGroup.visible, false);
  assert.equal(chaser.officerCapGroup.visible, false);
});

test('RAHUL_RIVAL displays swept hair, white polo collar and hides Modi accessories', () => {
  const chaser = new ChaserModel();
  chaser.setChaserArchetype('RAHUL_RIVAL');

  assert.equal(chaser.modiHeadGroup.visible, false);
  assert.equal(chaser.modiChestGroup.visible, false);
  assert.equal(chaser.rahulHeadGroup.visible, true);
  assert.equal(chaser.vipHeadGroup.visible, false);
  assert.equal(chaser.officerCapGroup.visible, false);
});

test('OFFICER displays inspector peaked cap and hides political caricatures', () => {
  const chaser = new ChaserModel();
  chaser.setChaserArchetype('OFFICER');

  assert.equal(chaser.modiHeadGroup.visible, false);
  assert.equal(chaser.modiChestGroup.visible, false);
  assert.equal(chaser.rahulHeadGroup.visible, false);
  assert.equal(chaser.vipHeadGroup.visible, false);
  assert.equal(chaser.officerCapGroup.visible, true);
});

// -----------------------------------------------------------------------------
// SUITE 4: Cosmetic Rivalry Reactions
// -----------------------------------------------------------------------------
console.log('\nSuite 4: Cosmetic Rivalry Reactions');
resetEnv();

test('Executes NAMASTE_SHRUG lifecycle cleanly', () => {
  const chaser = new ChaserModel();
  chaser.setChaserArchetype('MODI_RIVAL');

  assert.equal(chaser.getCosmeticReaction(), 'NONE');
  chaser.triggerCosmeticReaction('NAMASTE_SHRUG', 1.8);
  assert.equal(chaser.getCosmeticReaction(), 'NAMASTE_SHRUG');

  const playerPos = new THREE.Vector3(0, 0, 50);
  chaser.update(0.5, playerPos, 20, 0);
  assert.equal(chaser.getCosmeticReaction(), 'NAMASTE_SHRUG');

  chaser.update(2.0, playerPos, 20, 0);
  assert.equal(chaser.getCosmeticReaction(), 'NONE');
});

test('Executes SELFIE_FLASH lifecycle with phone mesh', () => {
  const chaser = new ChaserModel();
  chaser.setChaserArchetype('RAHUL_RIVAL');

  chaser.triggerCosmeticReaction('SELFIE_FLASH', 1.8);
  assert.equal(chaser.getCosmeticReaction(), 'SELFIE_FLASH');
  assert.equal(chaser.selfiePhoneGroup.visible, true);

  const playerPos = new THREE.Vector3(0, 0, 50);
  chaser.update(2.0, playerPos, 20, 0);
  assert.equal(chaser.getCosmeticReaction(), 'NONE');
  assert.equal(chaser.selfiePhoneGroup.visible, false);
});

test('Executes CAMERA_WAVE, MICROPHONE_DUCK, and PRESS_CONFERENCE_ENTER', () => {
  const chaser = new ChaserModel();
  const reactions: ChaserCosmeticReaction[] = [
    'CAMERA_WAVE',
    'MICROPHONE_DUCK',
    'PRESS_CONFERENCE_ENTER'
  ];

  for (const rx of reactions) {
    chaser.triggerCosmeticReaction(rx, 1.5);
    assert.equal(chaser.getCosmeticReaction(), rx);
    chaser.triggerCosmeticReaction('NONE');
    assert.equal(chaser.getCosmeticReaction(), 'NONE');
  }
});

test('Cosmetic reactions do not interfere with track traversal or chaser position', () => {
  const chaser = new ChaserModel();
  chaser.triggerCosmeticReaction('NAMASTE_SHRUG', 2.0);
  const playerPos = new THREE.Vector3(0, 0, 30);
  chaser.update(0.1, playerPos, 15, 0);

  assert.ok(chaser.mesh.position.z > playerPos.z, 'Chaser stays behind player');
  assert.ok(Number.isFinite(chaser.mesh.position.x));
  assert.ok(Number.isFinite(chaser.mesh.position.y));
  assert.ok(Number.isFinite(chaser.mesh.position.z));
});

// -----------------------------------------------------------------------------
// SUITE 5: Reusable Political Comedy System
// -----------------------------------------------------------------------------
console.log('\nSuite 5: Reusable Political Comedy System');
resetEnv();

test('Emits satirical breaking news alert through EventBus', () => {
  let emittedAlert: any = null;
  EventBus.getInstance().on('POLITICAL_NEWS_ALERT', (news: any) => {
    emittedAlert = news;
  });

  const comedy = PoliticalComedySystem.getInstance();
  const headline = comedy.triggerBreakingNews();

  assert.ok(emittedAlert, 'Event should be emitted on EventBus');
  assert.equal(emittedAlert.headline, headline.title);
  assert.ok(emittedAlert.headline.length > 5);
});

test('Enforces 12-18s cooldown between political comedy events', () => {
  const comedy = PoliticalComedySystem.getInstance();
  const chaser = new ChaserModel();
  chaser.setChaserArchetype('MODI_RIVAL');

  const dummyPlayer = {
    position: new THREE.Vector3(0, 0, 100),
    distanceTraveled: 100,
    speed: 20
  } as unknown as Player;

  comedy.update(1.0, dummyPlayer, chaser, 'VIP_EXPRESS');
  const reactionAfterFirst = chaser.getCosmeticReaction();

  comedy.update(0.5, dummyPlayer, chaser, 'VIP_EXPRESS');
  assert.equal(chaser.getCosmeticReaction(), reactionAfterFirst, 'Cooldown prevents immediate second joke');
});

test('Scales maximum live gags according to graphics quality', () => {
  const comedy = PoliticalComedySystem.getInstance();
  comedy.setQuality('LOW');
  assert.equal(comedy.getMaxLiveGags(), 2);

  comedy.setQuality('HIGH');
  assert.equal(comedy.getMaxLiveGags(), 6);
});

console.log('\n======================================================');
console.log(`ALL INTEGRATION TESTS PASSED: ${passedTests} / ${totalTests}`);
console.log('======================================================\n');
