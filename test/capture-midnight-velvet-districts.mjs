import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/7a7f92d8-419e-49e3-a3b4-341385ccaa10/screenshots';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function main() {
  console.log('🚀 Launching Google Chrome to capture Midnight Velvet After Dark districts...');
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

  // Setup game state with MIDNIGHT_VELVET theme
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;

    // Equip MIDNIGHT_VELVET theme
    const { EnvironmentRegistry } = await import('./src/environment/EnvironmentRegistry.js');
    const theme = EnvironmentRegistry.getInstance().get('MIDNIGHT_VELVET');
    game.trackManager.setEnvironment('MIDNIGHT_VELVET');
    game.worldScene.applyEnvironment(theme);

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
      id: '01_district_a_velvet_boulevard',
      seed: 0,
      name: 'District A — Velvet Boulevard',
      cameraPos: { x: -4.5, y: 2.8, z: -18 },
      lookAt: { x: -11.5, y: 2.4, z: -35 }
    },
    {
      id: '02_district_b_moonlight_marina',
      seed: 1,
      name: 'District B — Moonlight Marina',
      cameraPos: { x: -4.0, y: 4.5, z: -25 },
      lookAt: { x: 18.0, y: 12.0, z: -55 }
    },
    {
      id: '03_district_c_golden_hour_club',
      seed: 2,
      name: 'District C — The Golden Hour Club',
      cameraPos: { x: -2.0, y: 5.5, z: -26 },
      lookAt: { x: -13.5, y: 8.5, z: -46 }
    },
    {
      id: '04_district_d_midnight_grand',
      seed: 3,
      name: 'District D — Midnight Grand',
      cameraPos: { x: 0, y: 3.5, z: -25 },
      lookAt: { x: -9.5, y: 6.5, z: -48 }
    }
  ];

  for (const dist of districts) {
    console.log(`📸 Capturing ${dist.name}...`);
    await page.evaluate(async (d) => {
      const game = window.__METRO_GAME__;
      const { MidnightVelvetWorldBuilder } = await import('./src/environment/worlds/midnightVelvet/MidnightVelvetWorldBuilder.js');
      const { MidnightVelvetEventDirector } = await import('./src/environment/worlds/midnightVelvet/MidnightVelvetEventDirector.js');
      const builder = MidnightVelvetWorldBuilder.getInstance();
      const director = MidnightVelvetEventDirector.getInstance();

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

      // Step director forward to trigger nightlife animations (searchlights, dancers, pendulum)
      director.update(1.5, true);

      // Position camera directly facing the district spectacle
      game.cameraController.camera.position.set(d.cameraPos.x, d.cameraPos.y, d.cameraPos.z);
      game.cameraController.camera.lookAt(d.lookAt.x, d.lookAt.y, d.lookAt.z);
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
    }, dist);

    await page.waitForTimeout(500);
    const shotPath = path.join(ARTIFACT_DIR, `${dist.id}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved screenshot to: ${shotPath}`);

    // Save District A or C as official world preview image
    if (dist.seed === 0) {
      const worldPreviewPath = path.join(process.cwd(), 'public/worlds/midnight_velvet.png');
      fs.copyFileSync(shotPath, worldPreviewPath);
      console.log('🖼️ Saved official world preview image to:', worldPreviewPath);
    }
  }

  console.log('✅ All screenshots saved successfully to:', ARTIFACT_DIR);
  await browser.close();
}

main().catch(err => {
  console.error('❌ Error during capture:', err);
  process.exit(1);
});
