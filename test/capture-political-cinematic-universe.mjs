import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const LOCAL_ARTIFACT_DIR = path.resolve('artifacts', 'audit');
const BRAIN_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/7a7f92d8-419e-49e3-a3b4-341385ccaa10/screenshots/audit';

fs.mkdirSync(LOCAL_ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(BRAIN_ARTIFACT_DIR, { recursive: true });

function saveScreenshotSync(buffer, filename) {
  const localPath = path.join(LOCAL_ARTIFACT_DIR, filename);
  const brainPath = path.join(BRAIN_ARTIFACT_DIR, filename);
  fs.writeFileSync(localPath, buffer);
  fs.writeFileSync(brainPath, buffer);
  console.log(`  📸 Saved: ${filename}`);
}

async function runPoliticalCinematicCapture() {
  console.log('=======================================================');
  console.log('🎬 POLITICAL CINEMATIC UNIVERSE: VISUAL CAPTURE');
  console.log('=======================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  page.on('console', msg => console.log('Browser:', msg.text()));

  // 1. Load game and wait for hydration
  console.log('🌐 Loading http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 15000 });
  console.log('🎮 Metro Runner engine active on window.__METRO_GAME__\n');

  // Mute audio during capture
  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
  });

  // Helper to setup character & world via authentic engine API
  async function setupRun(charId, skinId, worldId, politicalMode = 'AUTO') {
    await page.evaluate(async ({ charId, skinId, worldId, politicalMode }) => {
      const game = window.__METRO_GAME__;
      window.__SETTINGS_MANAGER__?.setPoliticalChaserMode(politicalMode);

      game.progression.unlockCharacter(charId);
      game.progression.equipCharacter(charId, skinId);
      game.player.applyCharacter(charId, skinId);

      const registry = (await import('/src/environment/EnvironmentRegistry.ts')).EnvironmentRegistry.getInstance();
      const theme = registry.get(worldId);
      game.worldScene.applyEnvironment(theme);

      game.startRun('ENDLESS', false);
      game.player.activateReviveGrace(999999);
      game.player.isIntroInvincible = true;
      game.openingSequence.skip();
    }, { charId, skinId, worldId, politicalMode });

    await page.waitForTimeout(600);
  }

  // -------------------------------------------------------------------------
  // SCENE 1: Modi Runner chased by Rahul Rival in Mitron Express
  // -------------------------------------------------------------------------
  console.log('Scene 1: Mitron Express — Modi running, Rahul chasing (RAHUL_RIVAL)');
  await setupRun('char_modi', 'modi_classic', 'VIP_EXPRESS', 'AUTO');

  const chaser1 = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    return {
      archetype: game.chaser.getChaserArchetype(),
      meshVisible: game.chaser.mesh.visible,
      rahulHairVisible: game.chaser.rahulHeadGroup.visible,
      modiHairVisible: game.chaser.modiHeadGroup.visible
    };
  });
  console.log('  Chaser 1 Status:', chaser1);

  // Position chaser close behind Modi and render
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.chaser.setChaseState('CLOSING_IN');
    game.chaser.mesh.visible = true;
    game.chaser.currentDistanceZ = 3.8;
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(300);

  let buf = await page.screenshot();
  saveScreenshotSync(buf, 'political_01_modi_run_rahul_chase.png');

  // Trigger Selfie Flash reaction on Rahul chaser
  console.log('  Triggering SELFIE_FLASH reaction...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.chaser.triggerCosmeticReaction('SELFIE_FLASH', 3.0);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(300);

  buf = await page.screenshot();
  saveScreenshotSync(buf, 'political_02_rahul_selfie_flash.png');

  // -------------------------------------------------------------------------
  // SCENE 2: Rahul Runner chased by Modi Rival in Rahulverse
  // -------------------------------------------------------------------------
  console.log('\nScene 2: Rahulverse — Rahul running, Modi chasing (MODI_RIVAL)');
  await setupRun('char_rahul_gandhi', 'rahul_classic', 'RAHULVERSE', 'AUTO');

  const chaser2 = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    return {
      archetype: game.chaser.getChaserArchetype(),
      meshVisible: game.chaser.mesh.visible,
      modiHairVisible: game.chaser.modiHeadGroup.visible,
      rahulHairVisible: game.chaser.rahulHeadGroup.visible
    };
  });
  console.log('  Chaser 2 Status:', chaser2);

  // Snap Modi chaser into close pursuit and trigger NAMASTE_SHRUG victory wave
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.chaser.setChaseState('CLOSING_IN');
    game.chaser.mesh.visible = true;
    game.chaser.currentDistanceZ = 3.8;
    game.chaser.triggerCosmeticReaction('NAMASTE_SHRUG', 3.0);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(300);

  buf = await page.screenshot();
  saveScreenshotSync(buf, 'political_03_rahul_run_modi_namaste.png');

  // Trigger Satirical Breaking News Ticker on HUD
  console.log('  Triggering Satirical News Alert Ticker on HUD...');
  await page.evaluate(() => {
    window.__METRO_GAME__.hud.showPoliticalNewsAlert({
      headline: 'CHASER CLAIMS TO BE LEADING THE RACE',
      subtitle: 'Spokesperson clarifies: "We are simply advancing in reverse direction"',
      tickerCategory: 'SATIRE BREAKING'
    });
  });
  await page.waitForTimeout(400);

  buf = await page.screenshot();
  saveScreenshotSync(buf, 'political_04_satirical_news_ticker.png');

  // -------------------------------------------------------------------------
  // SCENE 3: Settings Override — Standard Police Officer
  // -------------------------------------------------------------------------
  console.log('\nScene 3: Settings Override — Standard Police Officer for Modi runner');
  await setupRun('char_modi', 'modi_classic', 'VIP_EXPRESS', 'OFFICER');

  const chaser3 = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    return {
      archetype: game.chaser.getChaserArchetype(),
      isCapVisible: game.chaser.officerCapGroup.visible
    };
  });
  console.log('  Chaser 3 Status:', chaser3);

  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.chaser.setChaseState('CLOSING_IN');
    game.chaser.mesh.visible = true;
    game.chaser.currentDistanceZ = 3.8;
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(300);

  buf = await page.screenshot();
  saveScreenshotSync(buf, 'political_05_officer_override.png');

  // -------------------------------------------------------------------------
  // SCENE 4: 90-Frame Performance & Draw Call Benchmark
  // -------------------------------------------------------------------------
  console.log('\nScene 4: 90-Frame Telemetry & Framerate Benchmark');
  const telemetry = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const renderer = game.worldScene.renderer;
    const frames = [];

    for (let i = 0; i < 90; i++) {
      const t0 = performance.now();
      await new Promise(r => requestAnimationFrame(r));
      const dt = performance.now() - t0;
      frames.push({
        dt,
        fps: Math.round(1000 / Math.max(1, dt)),
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles
      });
    }

    const avgFps = Math.round(frames.reduce((s, f) => s + f.fps, 0) / frames.length);
    const minFps = Math.min(...frames.map(f => f.fps));
    const avgDrawCalls = Math.round(frames.reduce((s, f) => s + f.drawCalls, 0) / frames.length);
    const avgTriangles = Math.round(frames.reduce((s, f) => s + f.triangles, 0) / frames.length);

    return { avgFps, minFps, avgDrawCalls, avgTriangles };
  });

  console.log('  Performance Telemetry:', telemetry);

  // Write telemetry json
  const telemetryPath = path.join(BRAIN_ARTIFACT_DIR, 'political_universe_telemetry.json');
  fs.writeFileSync(telemetryPath, JSON.stringify(telemetry, null, 2));

  await browser.close();
  console.log('\n🎉 Political Cinematic Universe visual capture complete!');
}

runPoliticalCinematicCapture().catch(err => {
  console.error(err);
  process.exit(1);
});
