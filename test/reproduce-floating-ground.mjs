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

async function runAudit() {
  console.log('=======================================================');
  console.log('🕵️ AUDIT: FLOATING GROUND & UNSUPPORTED SCENERY AT 472M');
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

  console.log('🌐 Loading http://localhost:3003...');
  await page.goto('http://localhost:3003', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 15000 });
  console.log('🎮 Metro Runner engine active on window.__METRO_GAME__\n');

  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
  });

  const testWorlds = [
    { id: 'VIP_EXPRESS', label: 'Mitron Express' },
    { id: 'VIVA_HEAT', label: 'Viva Heat' },
    { id: 'JURASSIC_RUSH', label: 'Jurassic Rush' },
    { id: 'MIDNIGHT_VELVET', label: 'Midnight Velvet' }
  ];

  const distances = [0, 100, 250, 472, 500, 1000];
  const auditReport = [];

  for (const world of testWorlds) {
    console.log(`\n-------------------------------------------------------`);
    console.log(`Auditing Ground Continuity for: ${world.label} [${world.id}]`);
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

    await page.waitForTimeout(400);

    for (const dist of distances) {
      const metrics = await page.evaluate(async (d) => {
        const game = window.__METRO_GAME__;
        game.player.distanceTraveled = d;
        game.player.position.set(0, 0, -d);
        game.player.speed = 22.0;

        for (let step = 0; step < 30; step++) {
          game.trackManager.update(game.player, 0.1, step * 0.1);
        }

        game.cameraController.setLobbyMode(false);
        game.cameraController.reset(game.player.position);
        game.cameraController.update(0.016, game.player.position, game.player.speed, false);
        game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);

        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        // Inspect terrain coverage around player:
        // Sample X at -35, -20, -10, 0, 10, 20, 35 at player's Z (and Z - 30m)
        // Check if there is ANY mesh underneath with Y <= 0.1 covering those X positions
        const checkPoints = [
          { x: -30, z: -d },
          { x: -15, z: -d },
          { x: 0, z: -d },
          { x: 15, z: -d },
          { x: 30, z: -d },
          { x: -25, z: -d - 40 },
          { x: 25, z: -d - 40 }
        ];

        // Gather all mesh bounds in scene
        const groundHits = [];
        const sceneryCount = game.worldScene.scene.children.length;
        let lateralGroundMeshesFound = 0;

        // Check track chunks
        for (const chunk of game.trackManager.chunks) {
          chunk.group.traverse((obj) => {
            if (obj.isMesh && obj.visible) {
              // Check name or geometry
              const name = (obj.name || '').toLowerCase();
              if (name.includes('ground') || name.includes('terrain') || name.includes('pavement')) {
                lateralGroundMeshesFound++;
              }
            }
          });
        }

        return {
          dist: d,
          chunkCount: game.trackManager.chunks.length,
          lateralGroundMeshesFound
        };
      }, dist);

      console.log(`  Distance ${dist}m: lateralGroundMeshesFound = ${metrics.lateralGroundMeshesFound}`);

      if (dist === 472 || dist === 1000) {
        const imgBuffer = await page.screenshot();
        const fname = `baseline_${world.id.toLowerCase()}_${dist}m.png`;
        saveScreenshotSync(imgBuffer, fname);
      }
    }
  }

  await browser.close();
  console.log('\nAudit complete.');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});

