import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve('artifacts', 'phase12');
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

function log(msg) {
  console.log(`[Phase 12 Hero Prototype] ${msg}`);
}

async function saveScreenshot(page, filename) {
  const filePath = path.join(ARTIFACTS_DIR, filename);
  await page.screenshot({ path: filePath });
  log(`  📸 Saved screenshot: ${filename}`);
}

async function runHeroWorldAudit() {
  log('======================================================================');
  log('🦖 PHASE 12: BLOCKBUSTER HERO WORLD PROTOTYPE VERIFICATION');
  log('   World: Jurassic Rush (The Lost World Railway)');
  log('======================================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--mute-audio']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 15000 });

  // Mute audio
  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
  });

  const telemetryReport = {
    timestamp: new Date().toISOString(),
    world: 'JURASSIC_RUSH',
    displayName: 'Jurassic Rush: The Lost World Railway',
    checkpoints: {},
    spectacles: {},
    performance: {},
    qualityPresets: {},
    mobileViewport: {},
    memoryIntegrity: {}
  };

  // Helper to setup world and teleport player
  const setupWorldAtZ = async (targetZ, preset = 'HIGH', seed = 1337) => {
    return await page.evaluate(async ({ targetZ, preset, seed }) => {
      const game = window.__METRO_GAME__;
      const gm = window.__GRAPHICS_MANAGER__ || (await import('/src/scene/GraphicsManager.ts')).GraphicsManager.getInstance();

      gm.setPreset(preset, true);

      // Equip Jax and Jurassic Rush
      game.progression.unlockCharacter('char_jax');
      game.progression.equipCharacter('char_jax', 'jax_classic');
      game.player.applyCharacter('char_jax', 'jax_classic');

      game.progression.addCoins(100000);
      game.progression.purchaseTheme('JURASSIC_RUSH');
      game.progression.equipTheme('JURASSIC_RUSH');

      const registry = (await import('/src/environment/EnvironmentRegistry.ts')).EnvironmentRegistry.getInstance();
      const theme = registry.get('JURASSIC_RUSH');
      game.worldScene.applyEnvironment(theme);

      game.trackManager.setDebugSeed(seed);
      game.trackManager.reset(false);

      game.startRun('NORMAL', false);
      game.cameraController.setLobbyMode(false);
      game.player.activateReviveGrace(999999);
      game.player.isIntroInvincible = true;
      if (game.openingSequence) game.openingSequence.skip();

      game.player.distanceTraveled = targetZ;
      game.player.position.set(0, game.player.groundY, -targetZ);
      game.player.speed = 22.0;

      for (let s = 0; s < 35; s++) {
        game.trackManager.update(game.player, 0.05, s * 0.05);
        game.worldScene.updateSunPosition(game.player.position.z, game.player.speed);
        game.worldScene.updateAtmosphere(0.05);
      }

      game.cameraController.reset(game.player.position);
      game.cameraController.update(0.016, game.player.position, game.player.speed, false);
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);

      const director = window.__JURASSIC_DIRECTOR__;
      const rendererInfo = game.worldScene.renderer.info;
      return {
        playerZ: game.player.position.z,
        drawCalls: rendererInfo.render.calls,
        triangles: rendererInfo.render.triangles,
        geometries: rendererInfo.memory.geometries,
        textures: rendererInfo.memory.textures,
        sauropodCount: director ? director.getSauropodCount() : 0,
        raptorCount: director ? director.getRaptorPackCount() : 0,
        carnivoreCount: director ? director.getCarnivoreCount() : 0,
        valleyRevealStage: director ? director.getValleyRevealStage() : 'UNKNOWN'
      };
    }, { targetZ, preset, seed });
  };

  // 1. Sector 04 Outpost Gateway
  log('\n▶ 1. Capturing Sector 04 Outpost Gateway (Opening Landmark)...');
  const gateData = await setupWorldAtZ(5, 'HIGH', 1337);
  await saveScreenshot(page, '01_jurassic_rush_opening_gate.png');
  telemetryReport.checkpoints.openingGate = gateData;

  // 2. Prehistoric Valley Reveal: Canopy Tunnel
  log('▶ 2. Capturing Valley Reveal: Tightening Jungle Canopy Tunnel (Z = 360m)...');
  const tunnelData = await setupWorldAtZ(360, 'HIGH', 1337);
  await saveScreenshot(page, '02_jurassic_rush_canopy_tunnel.png');
  telemetryReport.checkpoints.canopyTunnel = tunnelData;

  // 3. Prehistoric Valley Reveal: Panoramic Valley Emergence
  log('▶ 3. Capturing Valley Reveal: Panoramic Valley Emergence (Z = 415m)...');
  const revealData = await setupWorldAtZ(415, 'HIGH', 1337);
  await saveScreenshot(page, '03_jurassic_rush_valley_reveal.png');
  telemetryReport.checkpoints.valleyReveal = revealData;

  // 4. Giant Dinosaur Encounter (Spectacle A)
  log('▶ 4. Capturing Giant Dinosaur Encounter: Colossal Sauropod River Crossing (Z = 580m)...');
  const sauropodData = await setupWorldAtZ(580, 'HIGH', 1337);
  await saveScreenshot(page, '04_jurassic_rush_giant_dinosaur_encounter.png');
  telemetryReport.checkpoints.giantDinosaurEncounter = sauropodData;

  // 5. Raptor Canyon Chase: Perched Shelf (Spectacle C - Stage 1)
  log('▶ 5. Capturing Raptor Canyon Chase: Perched Shelf Anticipation (Z = 830m)...');
  const raptorPerchData = await setupWorldAtZ(830, 'HIGH', 1337);
  await saveScreenshot(page, '05_jurassic_rush_raptor_perched.png');
  telemetryReport.checkpoints.raptorPerched = raptorPerchData;

  // 6. Raptor Canyon Chase: High-Speed Sprint & Formation Shift (Spectacle C - Stages 3 & 4)
  log('▶ 6. Capturing Raptor Canyon Chase: Sprint & Tactical Formation Shift (Z = 920m)...');
  const raptorFormationData = await setupWorldAtZ(920, 'HIGH', 1337);
  await saveScreenshot(page, '06_jurassic_rush_raptor_chase_formation.png');
  telemetryReport.checkpoints.raptorFormation = raptorFormationData;

  // 7. Raptor Canyon Chase: Sandstone Buttress Disappearance (Spectacle C - Stage 5)
  log('▶ 7. Capturing Raptor Canyon Chase: Sandstone Buttress Disappearance (Z = 980m)...');
  const raptorDisappearData = await setupWorldAtZ(980, 'HIGH', 1337);
  await saveScreenshot(page, '07_jurassic_rush_raptor_buttress_disappearance.png');
  telemetryReport.checkpoints.raptorDisappearance = raptorDisappearData;

  // 8. Grand Sun Temple Viaduct & Titanosaur Bone Arches (Signature Landmark)
  log('▶ 8. Capturing Signature Landmark: Grand Sun Temple Viaduct & Titanosaur Bone Arches (Z = 1350m)...');
  const templeData = await setupWorldAtZ(1350, 'HIGH', 1337);
  await saveScreenshot(page, '08_jurassic_rush_sun_temple_titanosaur_arches.png');
  telemetryReport.checkpoints.grandSunTemple = templeData;

  // 9. Expedition Train Exterior Design
  log('▶ 9. Capturing Rugged Safari Expedition Train Design...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    // Look ahead at upcoming train
    game.cameraController.camera.position.set(0, 3.2, game.player.position.z + 12.0);
    game.cameraController.camera.lookAt(0, 2.0, game.player.position.z - 20.0);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await saveScreenshot(page, '09_jurassic_rush_expedition_train.png');

  // 10. Late-Game Traversal (> 2000m)
  log('▶ 10. Capturing Late-Game Traversal: Pterosaur Cliffs & Waterfall Predator (Z = 2250m)...');
  const lateGameData = await setupWorldAtZ(2250, 'HIGH', 1337);
  await saveScreenshot(page, '10_jurassic_rush_late_game_2200m.png');
  telemetryReport.checkpoints.lateGame = lateGameData;

  // 11. Scenery Retention under Preset LOW
  log('▶ 11. Verifying Scenery Retention under LOW preset...');
  const lowPresetData = await setupWorldAtZ(1350, 'LOW', 1337);
  await saveScreenshot(page, '11_jurassic_rush_preset_low_retention.png');
  telemetryReport.qualityPresets.low = lowPresetData;

  // 12. Mobile Readability Viewport (390 x 844 iPhone portrait)
  log('▶ 12. Verifying Mobile Portrait Readability (390 x 844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileData = await setupWorldAtZ(25, 'HIGH', 1337);
  await saveScreenshot(page, '12_jurassic_rush_mobile_viewport.png');
  telemetryReport.mobileViewport = mobileData;

  // Restore desktop viewport for telemetry measurement
  await page.setViewportSize({ width: 1440, height: 900 });

  // 13. Frame-Time and Real Browser Performance Measurement (120 real frames)
  log('\n▶ 13. Measuring real browser frame times (120 frames at 22 m/s)...');
  const frameStats = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const samples = [];
    let lastTime = performance.now();

    for (let f = 0; f < 120; f++) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now();
      const dt = now - lastTime;
      lastTime = now;
      samples.push(dt);

      game.player.distanceTraveled += 0.35;
      game.player.position.z -= 0.35;
      game.trackManager.update(game.player, 0.016, f * 0.016);
      game.cameraController.update(0.016, game.player.position, game.player.speed, false);
      game.worldScene.updateSunPosition(game.player.position.z, game.player.speed);
      game.worldScene.updateAtmosphere(0.016);
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
    }

    samples.sort((a, b) => a - b);
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    const p50 = samples[Math.floor(samples.length * 0.50)];
    const p95 = samples[Math.floor(samples.length * 0.95)];
    const p99 = samples[Math.floor(samples.length * 0.99)];
    const stutters = samples.filter(s => s > 33.3).length;

    return {
      samplesCount: samples.length,
      averageFrameTimeMs: avg,
      p50Ms: p50,
      p95Ms: p95,
      p99Ms: p99,
      fps: 1000 / avg,
      stutterCount: stutters
    };
  });

  telemetryReport.performance = frameStats;
  log(`  ⚡ Frame Time Avg: ${frameStats.averageFrameTimeMs.toFixed(2)}ms (${frameStats.fps.toFixed(1)} FPS)`);
  log(`  ⚡ P50: ${frameStats.p50Ms.toFixed(2)}ms | P95: ${frameStats.p95Ms.toFixed(2)}ms | P99: ${frameStats.p99Ms.toFixed(2)}ms`);
  log(`  ⚡ Stutter frames (>33.3ms): ${frameStats.stutterCount} / ${frameStats.samplesCount}`);

  // 14. World Switching Memory Stability Check
  log('\n▶ 14. Verifying memory stability across repeated world transitions...');
  const memoryStats = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const registry = (await import('/src/environment/EnvironmentRegistry.ts')).EnvironmentRegistry.getInstance();

    const initialGeos = game.worldScene.renderer.info.memory.geometries;
    const initialTexs = game.worldScene.renderer.info.memory.textures;

    // Cycle between Jurassic Rush and Modern Metro 3 times
    for (let c = 0; c < 3; c++) {
      game.worldScene.applyEnvironment(registry.get('MODERN_METRO'));
      game.trackManager.reset(false);
      game.worldScene.applyEnvironment(registry.get('JURASSIC_RUSH'));
      game.trackManager.reset(false);
    }

    const postCycleGeos = game.worldScene.renderer.info.memory.geometries;
    const postCycleTexs = game.worldScene.renderer.info.memory.textures;

    return {
      initialGeometries: initialGeos,
      initialTextures: initialTexs,
      postCycleGeometries: postCycleGeos,
      postCycleTextures: postCycleTexs,
      geometryGrowth: postCycleGeos - initialGeos,
      textureGrowth: postCycleTexs - initialTexs
    };
  });

  telemetryReport.memoryIntegrity = memoryStats;
  log(`  💾 Geometry growth after 3 world cycles: ${memoryStats.geometryGrowth}`);
  log(`  💾 Texture growth after 3 world cycles: ${memoryStats.textureGrowth}`);

  // Save JSON report
  const reportPath = path.join(ARTIFACTS_DIR, 'hero_prototype_telemetry.json');
  fs.writeFileSync(reportPath, JSON.stringify(telemetryReport, null, 2));
  log(`\n📋 Saved full telemetry report to: ${reportPath}`);

  await browser.close();

  log('\n======================================================================');
  log('🏆 JURASSIC RUSH HERO WORLD AUDIT COMPLETED SUCCESSFULLY!');
  log('======================================================================\n');
}

runHeroWorldAudit().catch((err) => {
  console.error('❌ Hero world audit failed:', err);
  process.exit(1);
});
