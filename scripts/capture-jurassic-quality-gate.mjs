import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/jurassic_quality';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function captureQualityGate() {
  console.log(`🦖 Starting JURASSIC_RUSH Quality Gate Capture to ${targetDir}...`);

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  try {
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'JURASSIC_RUSH'],
        selectedTheme: 'JURASSIC_RUSH',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'JURASSIC_RUSH');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('Starting run in JURASSIC_RUSH...');
    await page.evaluate(() => {
      const playBtn = document.getElementById('start-play-btn');
      if (playBtn) playBtn.click();
      else if (window.__METRO_GAME__) window.__METRO_GAME__.startRun('NORMAL');

      const game = window.__METRO_GAME__;
      if (game) {
        game.soundManager.setMuted(true);
        game.player.crash = () => false;
        game.player.activateReviveGrace(999999);
        game.player.isIntroInvincible = true;
        if (game.openingSequence) {
          game.openingSequence.skip();
        }
        game.cameraController.setLobbyMode(false);
      }

      const modal = document.querySelector('.modal-overlay, #revive-modal, #save-me-modal, #shop-modal, #environment-modal');
      if (modal && modal instanceof HTMLElement) modal.style.display = 'none';
    });

    await page.waitForTimeout(1000);

    const checkpoints = [
      { name: '01_quality_lost_jungle_spawn_25m.png', dist: 25 },
      { name: '02_quality_lost_jungle_waterfall_60m.png', dist: 60 },
      { name: '03_quality_valley_of_giants_crossing_435m.png', dist: 435 },
      { name: '04_quality_raptor_canyon_ridge_835m.png', dist: 835 },
      { name: '05_quality_ancient_sanctuary_fossils_1250m.png', dist: 1250 },
      { name: '06_quality_fern_marsh_nests_1640m.png', dist: 1640 },
      { name: '07_quality_pterosaur_cliffs_predator_2015m.png', dist: 2015 }
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
        game.player.position.z = -targetDist;
        game.player.mesh.position.z = -targetDist;
        game.player.position.y = 0.9;
        game.player.groundY = 0;
        game.player.state = 'RUN';

        // Clear dynamic obstacle trains so scenic biomes and dinosaur events are completely unobstructed
        if (game.trackManager && game.trackManager.chunks) {
          game.trackManager.chunks.forEach(chunk => {
            if (chunk.clearDynamicItems) chunk.clearDynamicItems();
          });
        }

        if (game.worldScene) {
          game.worldScene.updateSunPosition(-targetDist, 0, 0.016);
          game.worldScene.updateAtmosphere(0.016);
          if (game.worldScene.jurassicSkyline) {
            game.worldScene.jurassicSkyline.position.z = -targetDist;
          }
        }
      }, cp.dist);

      await page.waitForTimeout(600);

      const filePath = path.join(targetDir, cp.name);
      await page.screenshot({ path: filePath });
      console.log(`Saved screenshot: ${filePath}`);
    }

    console.log('✅ Quality gate capture complete.');
  } catch (err) {
    console.error('Error during capture:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

captureQualityGate();

