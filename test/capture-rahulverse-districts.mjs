import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/7a7f92d8-419e-49e3-a3b4-341385ccaa10/screenshots';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function main() {
  console.log('🚀 Launching Google Chrome to capture Rahulverse districts...');
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

  // Setup game state with Rahul Gandhi character and RAHULVERSE theme
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    
    // Unlock and equip Rahul Gandhi
    game.progression.unlockCharacter('char_rahul_gandhi');
    game.progression.equipCharacter('char_rahul_gandhi', 'rahul_classic');
    game.player.applyCharacter('char_rahul_gandhi', 'rahul_classic');

    // Equip RAHULVERSE theme
    const { EnvironmentRegistry } = await import('./src/environment/EnvironmentRegistry.js');
    const theme = EnvironmentRegistry.getInstance().get('RAHULVERSE');
    game.trackManager.setEnvironment('RAHULVERSE');
    game.worldScene.applyEnvironment(theme);

    // Start game in Rahulverse
    game.startRun('NORMAL');
    if (game.openingSequence) {
      game.openingSequence.skip();
    }

    // Freeze motion and disable camera tracking so we can frame cinematic shots
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

  // 1. Capture Rahul Expressive Poses (Front view with friendly wave and athletic stance)
  console.log('📸 Capturing Rahul Expressive Poses...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const targetChunk = game.trackManager.getChunks()[0];
    if (targetChunk) {
      targetChunk.collectibles.forEach(c => (c.group.visible = false));
      targetChunk.obstacles.forEach(o => (o.group.visible = false));
    }

    game.player.position.set(0, 0, -10);
    game.player.mesh.position.set(0, 0, -10);
    game.player.mesh.rotation.y = Math.PI; // Face the camera
    game.player.model.setPresentationPose('VICTORY');
    game.player.model.update(0.016, 0, false, false, false, false, false);

    // Position camera close up in front of Rahul
    game.cameraController.camera.position.set(0, 1.35, -7.8);
    game.cameraController.camera.lookAt(0, 1.25, -10);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_rahul_expressive_poses.png') });

  // 2. Capture Political Rival Chase (Rahul sprinting ahead, pursued by Narendra Modi in saffron waistcoat)
  console.log('📸 Capturing Political Rival Chase (Modi chasing Rahul)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const targetChunk = game.trackManager.getChunks()[0];
    if (targetChunk) {
      targetChunk.collectibles.forEach(c => (c.group.visible = false));
      targetChunk.obstacles.forEach(o => (o.group.visible = false));
    }

    game.player.position.set(0, 0, -16);
    game.player.mesh.position.set(0, 0, -16);
    game.player.mesh.rotation.y = 0; // Running forward down track
    game.player.model.setPresentationPose('RUN');
    game.player.model.update(0.016, 18, true, false, false, false, false);

    game.syncChaserArchetype('RAHULVERSE');
    game.chaser.setChaseState('STUMBLE');
    game.chaser.mesh.visible = true;
    game.chaser.mesh.position.set(0, 0, -12.5);
    game.chaser.mesh.rotation.y = 0;
    game.chaser.update(0.016, game.player.position, 18, 0);

    // Cinematic dynamic chase angle showing both runners from side-quarter
    game.cameraController.camera.position.set(3.2, 2.0, -9.8);
    game.cameraController.camera.lookAt(0, 1.25, -14.5);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_modi_chasing_rahul.png') });

  // 3. Capture each of the 5 Comedy Districts
  const districts = [
    {
      id: '03_district_a_yatra_never_ends',
      seed: 0,
      name: 'District A — Yatra Never Ends',
      cameraPos: { x: -8.0, y: 3.2, z: -36 },
      lookAt: { x: -16.0, y: 2.6, z: -50 }
    },
    {
      id: '04_district_b_parliament_pandemonium',
      seed: 1,
      name: 'District B — Parliament Pandemonium',
      cameraPos: { x: -7.5, y: 3.2, z: -38 },
      lookAt: { x: -16.0, y: 2.6, z: -50 }
    },
    {
      id: '05_district_c_press_conference_panic',
      seed: 2,
      name: 'District C — Press Conference Panic',
      cameraPos: { x: -5.0, y: 4.8, z: -35 },
      lookAt: { x: -15.5, y: 2.4, z: -46 }
    },
    {
      id: '06_district_d_alliance_rollercoaster',
      seed: 3,
      name: 'District D — Alliance Rollercoaster',
      cameraPos: { x: -7.0, y: 3.8, z: -28 },
      lookAt: { x: -16.0, y: 2.8, z: -42 }
    },
    {
      id: '07_district_e_political_multiverse',
      seed: 4,
      name: 'District E — The Great Political Multiverse',
      cameraPos: { x: -6.5, y: 4.5, z: -36 },
      lookAt: { x: -16.0, y: 4.5, z: -50 }
    }
  ];

  for (const dist of districts) {
    console.log(`📸 Capturing ${dist.name}...`);
    await page.evaluate(async (d) => {
      const game = window.__METRO_GAME__;
      const { RahulSatireWorldBuilder } = await import('./src/environment/worlds/rahulverse/RahulSatireWorldBuilder.js');
      const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
      const builder = RahulSatireWorldBuilder.getInstance();
      const director = RahulComedyEventDirector.getInstance();

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

      // Step director forward to trigger comedy animations
      director.update(1.2, true);

      // Position camera directly facing the district spectacle
      game.cameraController.camera.position.set(d.cameraPos.x, d.cameraPos.y, d.cameraPos.z);
      game.cameraController.camera.lookAt(d.lookAt.x, d.lookAt.y, d.lookAt.z);
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
    }, dist);

    await page.waitForTimeout(500);
    const shotPath = path.join(ARTIFACT_DIR, `${dist.id}.png`);
    await page.screenshot({ path: shotPath });

    // Also save District A as the official world preview image
    if (dist.seed === 0) {
      const worldPreviewPath = path.join(process.cwd(), 'public/worlds/rahulverse.png');
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
