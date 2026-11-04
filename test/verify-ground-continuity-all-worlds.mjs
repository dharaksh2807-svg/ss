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

async function verifyAllWorlds() {
  console.log('================================================================');
  console.log('🛡️ VERIFICATION: COMPREHENSIVE GROUND CONTINUITY & ZERO SKY GAPS');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  console.log('🌐 Loading http://localhost:3003...');
  await page.goto('http://localhost:3003', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 15000 });
  console.log('🎮 Metro Runner engine active on window.__METRO_GAME__\n');

  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
  });

  const testWorlds = [
    { id: 'VIP_EXPRESS', label: 'Mitron Express' },
    { id: 'RAHULVERSE', label: 'Rahulverse' },
    { id: 'MIDNIGHT_VELVET', label: 'Midnight Velvet' },
    { id: 'CHRONO_KINGDOM', label: 'Chrono Kingdom' },
    { id: 'INFERNO_EXPRESS', label: 'Inferno Express' },
    { id: 'JURASSIC_RUSH', label: 'Jurassic Rush' },
    { id: 'VIVA_HEAT', label: 'Viva Heat' },
    { id: 'MODERN_METRO', label: 'Modern Metro' }
  ];

  const distances = [0, 100, 250, 472, 500, 1000, 2000];
  let totalChecks = 0;
  let totalPasses = 0;

  for (const world of testWorlds) {
    console.log(`\n-------------------------------------------------------`);
    console.log(`🌍 Testing World: ${world.label} [${world.id}]`);
    console.log(`-------------------------------------------------------`);

    await page.evaluate(async ({ worldId }) => {
      const game = window.__METRO_GAME__;
      game.progression.addCoins(100000);
      game.progression.purchaseTheme(worldId);
      game.progression.equipTheme(worldId);

      const registry = (await import('/src/environment/EnvironmentRegistry.ts')).EnvironmentRegistry.getInstance();
      const theme = registry.get(worldId);
      game.worldScene.applyEnvironment(theme);

      game.startRun('NORMAL', false);
      game.cameraController.setLobbyMode(false);
      game.player.activateReviveGrace(999999);
      game.player.isIntroInvincible = true;
      if (game.openingSequence) {
        game.openingSequence.skip();
      }
    }, { worldId: world.id });

    await page.waitForTimeout(300);

    for (const dist of distances) {
      const metrics = await page.evaluate(async (d) => {
        const game = window.__METRO_GAME__;
        game.player.distanceTraveled = d;
        game.player.position.set(0, 0, -d);
        game.player.speed = 22.0;

        for (let step = 0; step < 25; step++) {
          game.trackManager.update(game.player, 0.1, step * 0.1);
        }

        game.cameraController.setLobbyMode(false);
        game.cameraController.reset(game.player.position);
        game.cameraController.update(0.016, game.player.position, game.player.speed, false);
        game.worldScene.updateSunPosition(game.player.position.z, game.player.speed, 0.016);
        game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);

        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        let lateralTerrainCount = 0;
        let infiniteBedFound = false;

        if (game.worldScene.infiniteSubterraneanBed && game.worldScene.infiniteSubterraneanBed.visible) {
          infiniteBedFound = true;
        }

        for (const chunk of game.trackManager.chunks) {
          if (chunk.leftTerrainMesh && chunk.leftTerrainMesh.visible) lateralTerrainCount++;
          if (chunk.rightTerrainMesh && chunk.rightTerrainMesh.visible) lateralTerrainCount++;
        }

        return {
          dist: d,
          activeChunks: game.trackManager.chunks.length,
          lateralTerrainCount,
          infiniteBedFound,
          subBedZ: game.worldScene.infiniteSubterraneanBed ? game.worldScene.infiniteSubterraneanBed.position.z : 0
        };
      }, dist);

      totalChecks += 2;
      const terrainOk = metrics.lateralTerrainCount === 16; // 8 active chunks * 2
      const bedOk = metrics.infiniteBedFound;

      if (terrainOk) totalPasses++;
      if (bedOk) totalPasses++;

      console.log(`  Distance ${dist}m: Chunks: ${metrics.activeChunks}, Lateral Terrain: ${metrics.lateralTerrainCount}/16, Infinite Sub-bed: ${metrics.infiniteBedFound ? 'ACTIVE' : 'MISSING'}`);

      // Capture screenshots for visual proof
      if (dist === 472 || dist === 1000 || (world.id === 'VIP_EXPRESS' && dist === 250)) {
        const imgBuffer = await page.screenshot();
        const fname = `ground_verified_${world.id.toLowerCase()}_${dist}m.png`;
        saveScreenshotSync(imgBuffer, fname);
      }
    }
  }

  await browser.close();

  console.log('\n================================================================');
  console.log(`🏆 GROUND CONTINUITY VERIFICATION COMPLETE: ${totalPasses}/${totalChecks} CHECKS PASSED`);
  console.log('================================================================\n');

  if (totalPasses !== totalChecks) {
    console.error('FAIL: Some checks did not pass');
    process.exit(1);
  }
}

verifyAllWorlds().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
