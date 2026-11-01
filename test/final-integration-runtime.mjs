import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Supplement the existing walkthrough with assertions for transitions, cameras,
// mobile input, and early cinematic skip through the running game.
const browser = await chromium.launch({ headless: true });
const errors = [];
let checks = 0;
function check(condition, message) {
  assert.ok(condition, message);
  checks++;
  console.log(`PASS: ${message}`);
}
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true
  });
  await context.addInitScript(() => localStorage.setItem('metro_graphics_preset', 'LOW'));
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => !!window.__METRO_GAME__);

  const launch = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    return ['NORMAL', 'HARD'].map(mode => {
      game.startRun(mode);
      const opening = game.getOpeningSequence();
      opening.skip();
      return { mode, speed: game.getPlayer().speed };
    });
  });
  for (const item of launch) check(item.speed > 0, `${item.mode} early skip starts the runner (${item.speed} m/s)`);

  const environment = await page.evaluate(async () => {
    const themes = await import('/src/environment/EnvironmentConfig.ts');
    const game = window.__METRO_GAME__;
    const world = game.worldScene;
    const opacity = group => {
      let value;
      group.traverse(obj => { if (obj.isMesh) value = obj.material.opacity; });
      return value;
    };
    const modern = themes.MODERN_METRO_THEME;
    const historic = themes.HISTORIC_QUARTER_THEME;
    world.applyEnvironment(modern);
    world.startAtmosphericTransition(historic);
    world.updateAtmosphere(0.625);
    const first = { modern: opacity(world.modernSkyline), historic: opacity(world.historicSkyline) };
    world.updateAtmosphere(1.25);
    const later = { modern: opacity(world.modernSkyline), historic: opacity(world.historicSkyline) };
    world.updateAtmosphere(0.625);
    const completed = world.currentTheme.id;
    const ids = [];
    for (const theme of [modern, historic, themes.UNDERGROUND_METRO_THEME, themes.NEON_INDUSTRIAL_THEME]) {
      world.applyEnvironment(theme);
      ids.push(world.currentTheme.id);
    }
    world.applyEnvironment(themes.UNDERGROUND_METRO_THEME, 0.5, modern);
    const cloudOpacity = opacity(world.cloudsGroup);
    return { first, later, completed, ids, cloudOpacity, exposure: world.renderer.toneMappingExposure };
  });
  check(environment.first.modern > environment.later.modern, 'Modern skyline fades out during the timed transition');
  check(environment.first.historic < environment.later.historic, 'Historic skyline independently fades in');
  check(environment.completed === 'HISTORIC_QUARTER', 'Timed transition reaches the target district');
  check(new Set(environment.ids).size === 4, 'All four districts apply successfully');
  check(environment.cloudOpacity === 0.5, 'Tunnel cloud opacity fades continuously');
  check(environment.exposure === 1.22, 'Phase 5 exposure calibration is preserved');

  const camera = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    const camera = game.getCameraController();
    camera.setLobbyMode(false);
    camera.setGameOverMode(false);
    camera.setCameraMode('CLASSIC');
    camera.finishIntro(player.position);
    player.position.set(0, 0.9, -30);
    for (let i = 0; i < 120; i++) camera.update(player.position, 1 / 60, 0, 18, 0.9);
    const groundY = camera.camera.position.y;
    player.position.y = 4.35;
    for (let i = 0; i < 120; i++) camera.update(player.position, 1 / 60, 0, 18, 4.35);
    const rooftopY = camera.camera.position.y;
    const roofLookAhead = camera.lookTarget.z - player.position.z;
    camera.setGameOverMode(true, player.position);
    for (let i = 0; i < 120; i++) camera.update(player.position, 1 / 60);
    return { groundY, rooftopY, roofLookAhead, fov: camera.camera.fov, finite: camera.camera.position.toArray().every(Number.isFinite) };
  });
  check(camera.rooftopY > camera.groundY + 3.5, 'Rooftop camera elevates above the ground framing');
  check(camera.roofLookAhead < -18, 'Rooftop camera extends the forward sightline');
  check(camera.finite && Math.abs(camera.fov - 66) < 0.01, 'Portrait game-over camera reaches its intended framing');

  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL');
    game.getOpeningSequence().skip();
    for (const chunk of game.getTrackManager().chunks) chunk.clearDynamicItems();
    window.__FINAL_INPUTS__ = [];
    window.__METRO_BUS__.on('INPUT_ACTION', action => window.__FINAL_INPUTS__.push(action));
  });
  check(await page.locator('#touch-right-btn').isVisible(), 'Mobile direction control is visible');
  await page.locator('#touch-right-btn').tap();
  await page.waitForFunction(() => window.__METRO_GAME__.getPlayer().currentLane === 1);
  check(await page.evaluate(() => window.__FINAL_INPUTS__.filter(a => a === 'RIGHT').length === 1), 'Mobile tap dispatches one lane change');
  await page.evaluate(() => {
    const canvas = document.getElementById('game-canvas');
    const touch = (x, y) => new Touch({ identifier: 1, target: canvas, clientX: x, clientY: y });
    canvas.dispatchEvent(new TouchEvent('touchstart', { touches: [touch(180, 500)], bubbles: true }));
    canvas.dispatchEvent(new TouchEvent('touchmove', { touches: [touch(180, 400)], bubbles: true, cancelable: true }));
    canvas.dispatchEvent(new TouchEvent('touchend', { changedTouches: [touch(180, 400)], bubbles: true }));
  });
  check(await page.evaluate(() => window.__FINAL_INPUTS__.filter(a => a === 'UP').length === 1), 'Mobile swipe dispatches one jump');
  check(errors.length === 0, `No browser runtime errors: ${errors.join('; ')}`);
  console.log(`FINAL RUNTIME: ${checks}/${checks} checks passed`);
} finally {
  await browser.close();
}
