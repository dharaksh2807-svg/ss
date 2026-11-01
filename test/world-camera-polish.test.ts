import assert from 'node:assert/strict';
import * as THREE from 'three';
import { WorldScene } from '../src/scene/WorldScene';
import { MODERN_METRO_THEME, HISTORIC_QUARTER_THEME, UNDERGROUND_METRO_THEME, NEON_INDUSTRIAL_THEME } from '../src/environment/EnvironmentConfig';

// Exercise the real scene construction and transition methods without a WebGL renderer.
const world = Object.create(WorldScene.prototype) as any;
world.currentTheme = MODERN_METRO_THEME;
world.currentConfig = { cloudsVisible: true };
world.scene = new THREE.Scene();
world.scene.fog = new THREE.FogExp2();
world.sunLight = new THREE.DirectionalLight();
world.fillLight = new THREE.DirectionalLight();
world.hemiLight = new THREE.HemisphereLight();
world.skyMesh = world.createSkyDome();
world.skylineGroup = world.createDistantSkyline();
world.cloudsGroup = world.createClouds();

const material = (group: THREE.Group): THREE.Material & { opacity: number } => {
  let result: any;
  group.traverse((obj: any) => { if (obj.isMesh) result = obj.material; });
  return result;
};
const modern = material(world.modernSkyline);
const historic = material(world.historicSkyline);
const cloud = material(world.cloudsGroup);
assert.notEqual(modern, historic, 'Skyline variants need independent opacity materials');

for (const t of [0, 0.25, 0.5, 0.75, 1]) {
  world.applyEnvironment(HISTORIC_QUARTER_THEME, t, MODERN_METRO_THEME);
  assert.ok(Math.abs(modern.opacity - MODERN_METRO_THEME.skyline.opacity * (1 - t)) < 1e-8);
  assert.ok(Math.abs(historic.opacity - HISTORIC_QUARTER_THEME.skyline.opacity * t) < 1e-8);
  assert.equal(world.modernSkyline.visible, modern.opacity > 0.01);
  assert.equal(world.historicSkyline.visible, historic.opacity > 0.01);

  world.applyEnvironment(UNDERGROUND_METRO_THEME, t, MODERN_METRO_THEME);
  assert.ok(Math.abs(cloud.opacity - (1 - t)) < 1e-8, 'Clouds fade continuously into tunnels');
  world.applyEnvironment(NEON_INDUSTRIAL_THEME, t, UNDERGROUND_METRO_THEME);
  assert.ok(Math.abs(cloud.opacity - t) < 1e-8, 'Clouds fade continuously out of tunnels');
}
world.currentConfig.cloudsVisible = false;
world.applyEnvironment(MODERN_METRO_THEME, 1, UNDERGROUND_METRO_THEME);
assert.equal(world.cloudsGroup.visible, false, 'Transitions preserve disabled clouds on low quality');
console.log('PASS: independent skyline fades, tunnel cloud fades, and graphics settings');
