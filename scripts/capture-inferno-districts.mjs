import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = process.argv[2] || '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/inferno_baseline';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function captureAllInfernoDistricts() {
  console.log(`🚩 Starting In-Game Visual Capture across all 4 INFERNO_EXPRESS districts to ${targetDir}...`);

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'INFERNO_EXPRESS'],
        selectedTheme: 'INFERNO_EXPRESS',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'INFERNO_EXPRESS');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch run in INFERNO_EXPRESS
    console.log('Starting run in INFERNO_EXPRESS...');
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
        game.player.speedController.update = () => {};
        game.player.speed = 0.0;
      }

      const modal = document.querySelector('.modal-overlay, #revive-modal, #save-me-modal, #shop-modal, #environment-modal');
      if (modal && modal instanceof HTMLElement) modal.style.display = 'none';
    });

    await page.waitForTimeout(1000);

    const shots = [
      { name: '01_district_a_lava_sea_15m.png', targetDist: 15 },
      { name: '02_district_b_obsidian_citadel_415m.png', targetDist: 415 },
      { name: '03_district_c_magma_foundry_825m.png', targetDist: 825 },
      { name: '04_district_d_ashfall_summit_1230m.png', targetDist: 1230 }
    ];

    for (const shot of shots) {
      console.log(`Advancing runner to ${shot.targetDist}m for ${shot.name}...`);
      await page.waitForFunction((dist) => {
        const game = window.__METRO_GAME__;
        if (!game || !game.player) return false;
        game.player.speed = 120.0;
        return game.player.distanceTraveled >= dist;
      }, shot.targetDist, { timeout: 60000 });

      await page.evaluate((targetDist) => {
        const game = window.__METRO_GAME__;
        game.player.speed = 0.0;
        game.player.position.z = -targetDist;
        game.player.distanceTraveled = targetDist;
        const pZ = game.player.position.z;
        game.trackManager.chunks.forEach(c => {
          if (c.obstacles) {
            c.obstacles.forEach(obs => {
              if (obs && obs.group) {
                const obsWorldZ = c.chunkZ + obs.group.position.z;
                if (Math.abs(obsWorldZ - pZ) < 18.0) {
                  obs.group.position.x += 25.0;
                }
              }
            });
          }
        });
      }, shot.targetDist);

      await page.waitForTimeout(1000);
      const shotPath = path.join(targetDir, shot.name);
      await page.screenshot({ path: shotPath });
      console.log(`Saved screenshot: ${shotPath}`);
    }

    // Capture telemetry
    const telemetry = await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      return {
        theme: game?.environmentDirector?.getCurrentDistrict?.(),
        distanceTraveled: game?.player?.distanceTraveled,
        playerZ: game?.player?.position?.z
      };
    });

    const telemPath = path.join(targetDir, 'baseline_telemetry.json');
    fs.writeFileSync(telemPath, JSON.stringify(telemetry, null, 2));
    console.log('Saved telemetry to:', telemPath);

    console.log('🏁 Capture complete!');
  } finally {
    await browser.close();
  }
}

captureAllInfernoDistricts().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
