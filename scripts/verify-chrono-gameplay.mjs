import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = process.argv[2] || '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/chrono_baseline';
const targetPort = process.env.PORT || '3000';
const targetUrl = process.env.GAME_URL || `http://localhost:${targetPort}`;

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function runGameplayVerification() {
  console.log(`🎮 Launching Real-Gameplay Chrono Kingdom Verification at ${targetUrl}...`);
  console.log(`📁 Target artifact directory: ${targetDir}`);

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // Ensure pristine progression state pointing to CHRONO_KINGDOM without corrupting saved data
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'CHRONO_KINGDOM'],
        selectedTheme: 'CHRONO_KINGDOM',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'CHRONO_KINGDOM');
    });

    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch game in CHRONO_KINGDOM
    console.log('Starting run in CHRONO_KINGDOM...');
    await page.evaluate(() => {
      const playBtn = document.getElementById('start-play-btn');
      if (playBtn) playBtn.click();
      else if (window.__METRO_GAME__) window.__METRO_GAME__.startRun('NORMAL');

      const game = window.__METRO_GAME__;
      if (game) {
        game.soundManager.setMuted(true);
        // Player invulnerability for continuous uninterrupted multi-kilometer testing
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

    await page.waitForTimeout(1200);

    const testPoints = [
      { name: '01_ground_capital_15m.png', dist: 15, jetpack: false },
      { name: '02_ground_foundry_approach_250m.png', dist: 250, jetpack: false },
      { name: '03_ground_time_foundry_500m.png', dist: 500, jetpack: false },
      { name: '04_ground_observatory_973m.png', dist: 973, jetpack: false },
      { name: '05_jetpack_altitude_973m.png', dist: 973, jetpack: true },
      { name: '06_ground_cycle2_1600m.png', dist: 1600, jetpack: false },
      { name: '07_ground_cycle2_2400m.png', dist: 2400, jetpack: false },
      { name: '08_ground_cycle3_3200m.png', dist: 3200, jetpack: false },
      { name: '09_ground_extreme_4800m.png', dist: 4800, jetpack: false }
    ];

    const telemetryLog = [];

    for (const point of testPoints) {
      console.log(`Advancing gameplay to ${point.dist}m (jetpack=${point.jetpack}) for ${point.name}...`);
      await page.waitForFunction((targetDist) => {
        const game = window.__METRO_GAME__;
        if (!game || !game.player) return false;
        game.player.speed = 140.0;
        return game.player.distanceTraveled >= targetDist;
      }, point.dist, { timeout: 90000 });

      // Stabilize position and camera for exact inspection
      const frameInfo = await page.evaluate((pt) => {
        const game = window.__METRO_GAME__;
        game.player.speed = 0.0;
        game.player.position.z = -pt.dist;
        game.player.distanceTraveled = pt.dist;

        if (pt.jetpack) {
          game.player.isJetpackActive = true;
          game.player.position.y = 8.0;
          game.cameraController.camera.position.set(0, 9.8, -pt.dist + 9.5);
          game.cameraController.camera.lookAt(0, 7.8, -pt.dist - 25.0);
        } else {
          game.player.isJetpackActive = false;
          game.player.position.y = 0.9;
          game.cameraController.camera.position.set(0, 4.2, -pt.dist + 7.5);
          game.cameraController.camera.lookAt(0, 2.2, -pt.dist - 25.0);
        }

        const pZ = game.player.position.z;
        // Shift any blocking hazard out of direct frontal view
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

        // Collect runtime telemetry
        const envDirector = window.__METRO_GAME__.environmentDirector;
        const currentTheme = game.worldScene.currentTheme?.id || 'UNKNOWN';
        const atmosphere = game.worldScene.currentAtmosphere || 'DEFAULT';

        return {
          dist: pt.dist,
          jetpack: pt.jetpack,
          theme: currentTheme,
          atmosphere: atmosphere,
          cameraY: game.cameraController.camera.position.y,
          playerY: game.player.position.y
        };
      }, point);

      await page.waitForTimeout(600);
      const shotPath = path.join(targetDir, point.name);
      await page.screenshot({ path: shotPath });
      console.log(`Saved screenshot: ${shotPath} (Theme: ${frameInfo.theme}, Atmosphere: ${frameInfo.atmosphere})`);
      telemetryLog.push(frameInfo);
    }

    const telemetryPath = path.join(targetDir, 'telemetry.json');
    fs.writeFileSync(telemetryPath, JSON.stringify(telemetryLog, null, 2));
    console.log(`Saved telemetry to: ${telemetryPath}`);
    console.log('🏁 Real-Gameplay Verification completed successfully!');
  } finally {
    await browser.close();
  }
}

runGameplayVerification().catch(err => {
  console.error('❌ Error during gameplay verification:', err);
  process.exit(1);
});
