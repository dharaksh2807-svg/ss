import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/7a7f92d8-419e-49e3-a3b4-341385ccaa10/screenshots';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function main() {
  console.log('🚀 Launching Google Chrome to capture Chrono Kingdom: The Clockwork Empire districts...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  console.log('🌐 Loading http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 15000 });
  console.log('🎮 Game engine detected on window.__METRO_GAME__');

  // Setup game state with Chrono Kingdom theme
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const { CHRONO_KINGDOM_THEME } = await import('./src/environment/worlds/chronoKingdom/ChronoKingdomTheme.js');

    game.worldScene.applyEnvironment(CHRONO_KINGDOM_THEME);

    // Start game
    game.startRun('NORMAL');
    if (game.openingSequence) {
      game.openingSequence.skip();
    }

    // Freeze motion and disable camera tracking
    game.player.speed = 0;
    game.player.activateReviveGrace(999999);
    game.player.isIntroInvincible = true;
    game.soundManager.setMuted(true);

    // Override camera update during screenshot capture session
    game.cameraController.update = () => {};

    // Hide HUD overlay
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = 'none';
    const hudElements = document.querySelectorAll('.hud-top, .hud-bottom, #pause-btn, #revive-modal, #game-over-modal');
    hudElements.forEach(el => (el.style.display = 'none'));
  });

  await page.waitForTimeout(500);

  const districts = [
    {
      id: '01_district_a_grand_clockwork_capital',
      seed: 0,
      name: 'District A — The Grand Clockwork Capital',
      cameraPos: { x: -4.0, y: 3.5, z: -20 },
      lookAt: { x: -14.0, y: 12.0, z: -45 }
    },
    {
      id: '02_district_b_time_foundry',
      seed: 1,
      name: 'District B — The Time Foundry',
      cameraPos: { x: -3.5, y: 3.2, z: -18 },
      lookAt: { x: -13.0, y: 6.5, z: -38 }
    },
    {
      id: '03_district_c_chrono_observatory',
      seed: 2,
      name: 'District C — The Chrono Observatory',
      cameraPos: { x: 0, y: 4.8, z: -22 },
      lookAt: { x: -14.0, y: 16.0, z: -50 }
    },
    {
      id: '04_district_d_fractured_time',
      seed: 3,
      name: 'District D — The Fractured Time District',
      cameraPos: { x: 0, y: 4.0, z: -22 },
      lookAt: { x: -13.0, y: 8.5, z: -48 }
    }
  ];

  for (const dist of districts) {
    console.log(`📸 Capturing ${dist.name}...`);
    await page.evaluate(async (d) => {
      const game = window.__METRO_GAME__;
      const { ChronoKingdomWorldBuilder } = await import('./src/environment/worlds/chronoKingdom/ChronoKingdomWorldBuilder.js');
      const { ChronoKingdomEventDirector } = await import('./src/environment/worlds/chronoKingdom/ChronoKingdomEventDirector.js');
      const builder = ChronoKingdomWorldBuilder.getInstance();
      const director = ChronoKingdomEventDirector.getInstance();

      const chunks = game.trackManager.getChunks();
      if (chunks && chunks.length > 0) {
        const targetChunk = chunks[0];
        targetChunk.group.position.set(0, 0, 0);

        // Hide obstacles & collectibles for unobstructed view of scenery spectacle
        targetChunk.collectibles.forEach(c => (c.group.visible = false));
        targetChunk.obstacles.forEach(o => (o.group.visible = false));

        // Clear decorative scenery
        while (targetChunk.decorativeGroup.children.length > 0) {
          targetChunk.decorativeGroup.remove(targetChunk.decorativeGroup.children[0]);
        }

        // Build the district scenery
        builder.buildDistrictScenery(targetChunk.decorativeGroup, 12, 100, d.seed, 'FULL');
      }

      // Step director forward to trigger clockwork animations
      director.update(1.8, true);

      // Position camera directly facing the district spectacle
      game.cameraController.camera.position.set(d.cameraPos.x, d.cameraPos.y, d.cameraPos.z);
      game.cameraController.camera.lookAt(d.lookAt.x, d.lookAt.y, d.lookAt.z);
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
    }, dist);

    await page.waitForTimeout(500);
    const shotPath = path.join(ARTIFACT_DIR, `${dist.id}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved screenshot to: ${shotPath}`);
  }

  // Capture Showcase Clockwork Train
  console.log('📸 Capturing Chrono Kingdom Showcase Steam Locomotive...');
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const { ChronoKingdomWorldBuilder } = await import('./src/environment/worlds/chronoKingdom/ChronoKingdomWorldBuilder.js');
    const builder = ChronoKingdomWorldBuilder.getInstance();

    const chunks = game.trackManager.getChunks();
    if (chunks && chunks.length > 0) {
      const targetChunk = chunks[0];
      while (targetChunk.decorativeGroup.children.length > 0) {
        targetChunk.decorativeGroup.remove(targetChunk.decorativeGroup.children[0]);
      }
      const train = builder.buildChronoKingdomShowcaseTrain(0, 0, -18);
      targetChunk.decorativeGroup.add(train);
    }

    game.cameraController.camera.position.set(4.5, 3.2, -8.0);
    game.cameraController.camera.lookAt(0, 1.8, -18.0);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });

  await page.waitForTimeout(500);
  const trainShotPath = path.join(ARTIFACT_DIR, '05_chrono_kingdom_clockwork_train.png');
  await page.screenshot({ path: trainShotPath });
  console.log(`Saved train screenshot to: ${trainShotPath}`);

  console.log('✅ All screenshots saved successfully to:', ARTIFACT_DIR);
  await browser.close();
}

main().catch(err => {
  console.error('❌ Error during capture:', err);
  process.exit(1);
});
