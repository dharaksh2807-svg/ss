import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/viva_quality';
fs.mkdirSync(targetDir, { recursive: true });

async function captureQuality() {
  console.log(`💃 Starting VIVA_HEAT Quality Gate Capture to ${targetDir}...`);

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  try {
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'VIVA_HEAT'],
        selectedTheme: 'VIVA_HEAT',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'VIVA_HEAT');
    });

    console.log('Navigating to http://localhost:3000/?preview=VIVA_HEAT ...');
    await page.goto('http://localhost:3000/?preview=VIVA_HEAT', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('Starting run in VIVA_HEAT...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      if (game) {
        game.soundManager.setMuted(true);
        game.player.crash = () => false;
        game.player.activateReviveGrace(999999);
        game.player.isIntroInvincible = true;
        game.startRun('NORMAL');
        if (game.openingSequence) {
          game.openingSequence.skip();
        }
        game.player.speed = 0;
        game.cameraController.setLobbyMode(false);
        game.cameraController.setIntroMode(false);
        game.cameraController.setGameOverMode(false);
        game.cameraController.setCameraMode('CLASSIC');
        game.cameraController.update = () => {};

        if (game.chaser) {
          game.chaser.update = () => {};
          game.chaser.mesh.visible = false;
          game.chaser.mesh.position.set(0, -999, 0);
        }
      }

      const hud = document.getElementById('hud');
      if (hud) hud.style.display = 'none';
      const hudElements = document.querySelectorAll(
        '.hud-top, .hud-bottom, #pause-btn, #revive-modal, #game-over-modal, #opening-skip-btn, .modal-overlay, #revive-modal, #save-me-modal, #shop-modal, #environment-modal, #warmup-banner, .mission-callout, .score-banner'
      );
      hudElements.forEach(el => (el.style.display = 'none'));
    });

    await page.waitForTimeout(600);

    const checkpoints = [
      { name: '01_quality_sunset_promenade_35m.png', dist: 35 },
      { name: '02_quality_gilded_amphitheatre_135m.png', dist: 135 },
      { name: '03_quality_kinetic_flora_awakening_235m.png', dist: 235 },
      { name: '04_quality_midnight_marina_335m.png', dist: 335 },
      { name: '05_quality_royal_colonnade_435m.png', dist: 435 },
      { name: '06_quality_sunset_carnival_535m.png', dist: 535 },
      { name: '07_quality_fever_mode_750m.png', dist: 750 },
      { name: '08_quality_grand_finale_1050m.png', dist: 1050 }
    ];

    for (const cp of checkpoints) {
      console.log(`Advancing gameplay to ${cp.dist}m...`);

      await page.evaluate((targetDist) => {
        const game = window.__METRO_GAME__;
        if (!game || !game.player || !game.trackManager) return;

        game.player.speed = 85.0;
        game.player.state = 'RUN';

        let safety = 0;
        while (game.player.distanceTraveled < targetDist && safety < 15000) {
          game.player.update(0.04);
          game.trackManager.update(game.player, 0.04, performance.now() / 1000);
          safety++;
        }

        game.player.speed = 0.0;
        game.player.distanceTraveled = targetDist;
        game.player.position.set(0, 0.9, -targetDist);
        game.player.mesh.position.set(0, 0.9, -targetDist);
        game.player.groundY = 0;
        game.player.state = 'RUN';
        game.player.mesh.visible = true;

        // Hide chaser completely during capture so view is unobstructed
        if (game.chaser) {
          game.chaser.mesh.position.set(0, -999, 0);
          game.chaser.mesh.visible = false;
        }

        // Clear dynamic obstacle trains so scenic biomes and festival events are unobstructed
        if (game.trackManager && game.trackManager.chunks) {
          game.trackManager.chunks.forEach(chunk => {
            if (chunk.clearDynamicItems) chunk.clearDynamicItems();
          });
        }

        // Set genuine runner gameplay chase camera behind player
        if (game.cameraController) {
          game.cameraController.camera.position.set(0, 3.4, -targetDist + 7.5);
          game.cameraController.camera.lookAt(0, 2.0, -targetDist - 40.0);
        }

        if (game.worldScene) {
          game.worldScene.updateSunPosition(-targetDist, 0, 0.016);
          game.worldScene.updateAtmosphere(0.016);
          game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
        }
      }, cp.dist);

      await page.waitForTimeout(600);

      const filePath = path.join(targetDir, cp.name);
      await page.screenshot({ path: filePath });
      console.log(`Saved screenshot: ${filePath}`);
    }

    // Save hero world preview image
    const previewPath = path.resolve(process.cwd(), 'public/worlds/viva_heat.png');
    fs.copyFileSync(path.join(targetDir, '01_quality_sunset_promenade_35m.png'), previewPath);
    console.log(`Saved world preview image to: ${previewPath}`);

    console.log('✅ Quality capture complete.');
  } catch (err) {
    console.error('Error during capture:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

captureQuality();
