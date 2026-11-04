import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/7a7f92d8-419e-49e3-a3b4-341385ccaa10/screenshots';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function main() {
  console.log('🚀 Launching Google Chrome to capture Viva Heat: The Forbidden Festival...');
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

  // Setup game state with Viva Heat theme
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const { VIVA_HEAT_THEME } = await import('./src/environment/worlds/vivaHeat/VivaHeatTheme.js');

    game.worldScene.applyEnvironment(VIVA_HEAT_THEME);

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

  await page.waitForTimeout(600);

  const views = [
    {
      id: '01_act_i_scarlet_sunset_coastal_boulevard',
      name: 'Act I — Scarlet Sunset Coastal Boulevard (Gameplay Perspective)',
      cameraPos: { x: 0, y: 3.8, z: -16.0 },
      lookAt: { x: 6.0, y: 8.0, z: -80.0 },
      feverState: 'ARRIVAL',
      directorTime: 1.0
    },
    {
      id: '02_viva_heat_kinetic_flora_and_stage',
      name: 'Act I — Kinetic Floral Sculptures & Raised Festival Stage',
      cameraPos: { x: -3.5, y: 3.5, z: -25.0 },
      lookAt: { x: -14.0, y: 6.5, z: -48.0 },
      feverState: 'HEAT_RISING',
      directorTime: 2.2
    },
    {
      id: '03_viva_heat_performers_and_couture',
      name: 'Act I — Adult High-Fashion Festival Performers & Revelers',
      cameraPos: { x: -8.0, y: 3.2, z: -38.0 },
      lookAt: { x: -14.5, y: 3.4, z: -48.0 },
      feverState: 'FEVER_MODE',
      directorTime: 3.5
    },
    {
      id: '04_viva_heat_luxury_yachts_ocean',
      name: 'Act I — Coastal Sunset Ocean & Cruising Luxury Yachts',
      cameraPos: { x: 8.5, y: 4.8, z: -22.0 },
      lookAt: { x: 28.0, y: 2.5, z: -45.0 },
      feverState: 'ARRIVAL',
      directorTime: 1.5
    },
    {
      id: '05_viva_heat_fever_finale_spectacle',
      name: 'Act I — Fever Director Grand Finale Spectacle & Distant Sun',
      cameraPos: { x: 0, y: 4.2, z: -20.0 },
      lookAt: { x: 18.0, y: 16.0, z: -100.0 },
      feverState: 'GRAND_FINALE',
      directorTime: 5.0
    }
  ];

  for (const view of views) {
    console.log(`📸 Capturing ${view.name}...`);
    await page.evaluate(async (v) => {
      const game = window.__METRO_GAME__;
      const { VivaHeatWorldBuilder } = await import('./src/environment/worlds/vivaHeat/VivaHeatWorldBuilder.js');
      const { FeverDirector } = await import('./src/environment/worlds/vivaHeat/FeverDirector.js');
      const builder = VivaHeatWorldBuilder.getInstance();
      const director = FeverDirector.getInstance();

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
        builder.buildDistrictScenery(targetChunk.decorativeGroup, 12, 100, 42, 'FULL');
      }

      // Force specified fever state and step director forward
      director.setForceState(v.feverState);
      director.update(v.directorTime, true);

      // Position camera
      game.cameraController.camera.position.set(v.cameraPos.x, v.cameraPos.y, v.cameraPos.z);
      game.cameraController.camera.lookAt(v.lookAt.x, v.lookAt.y, v.lookAt.z);
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
    }, view);

    await page.waitForTimeout(500);
    const shotPath = path.join(ARTIFACT_DIR, `${view.id}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved screenshot to: ${shotPath}`);
  }

  // Capture Showcase Luxury Train in Viva Heat livery
  console.log('📸 Capturing Viva Heat Streamlined Festival Express Train...');
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const { ObstacleFactory } = await import('./src/track/ObstacleFactory.js');
    const obsFactory = new ObstacleFactory();

    const chunks = game.trackManager.getChunks();
    if (chunks && chunks.length > 0) {
      const targetChunk = chunks[0];
      while (targetChunk.decorativeGroup.children.length > 0) {
        targetChunk.decorativeGroup.remove(targetChunk.decorativeGroup.children[0]);
      }
      const train = obsFactory.createTrain(22.0, false, 0x881337, 'STREAMLINED_EXPRESS', 'VIVA_HEAT');
      train.position.set(0, 0, -18);
      targetChunk.decorativeGroup.add(train);
    }

    game.cameraController.camera.position.set(4.8, 3.2, -8.0);
    game.cameraController.camera.lookAt(0, 1.8, -18.0);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });

  await page.waitForTimeout(500);
  const trainShotPath = path.join(ARTIFACT_DIR, '06_viva_heat_streamlined_train.png');
  await page.screenshot({ path: trainShotPath });
  console.log(`Saved train screenshot to: ${trainShotPath}`);

  // Also save preview image
  const previewPath = path.resolve(process.cwd(), 'public/worlds/viva_heat.png');
  fs.copyFileSync(path.join(ARTIFACT_DIR, '01_act_i_scarlet_sunset_coastal_boulevard.png'), previewPath);
  console.log(`Saved world preview image to: ${previewPath}`);

  console.log('✅ All screenshots saved successfully to:', ARTIFACT_DIR);
  await browser.close();
}

main().catch(err => {
  console.error('❌ Error during capture:', err);
  process.exit(1);
});
