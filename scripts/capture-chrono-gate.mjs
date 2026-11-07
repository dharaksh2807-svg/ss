import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/chrono_gate';
if (!fs.existsSync(BASE_ARTIFACT_DIR)) {
  fs.mkdirSync(BASE_ARTIFACT_DIR, { recursive: true });
}

async function captureChronoGate() {
  console.log('🚩 Starting In-Game Visual Capture for CHRONO_KINGDOM baseline...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'CHRONO_KINGDOM'],
        selectedTheme: 'CHRONO_KINGDOM',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'CHRONO_KINGDOM');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch run in CHRONO_KINGDOM
    console.log('Starting run in CHRONO_KINGDOM...');
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

    // 1. Capture baseline at 15m (District A - Grand Clockwork Capital)
    console.log('Advancing runner to 15m facing District A...');
    await page.waitForFunction(() => {
      const game = window.__METRO_GAME__;
      if (!game || !game.player) return false;
      game.player.speed = 20.0;
      return game.player.distanceTraveled >= 15;
    }, { timeout: 30000 });

    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.speed = 0.0;
      const pZ = game.player.position.z;
      game.trackManager.chunks.forEach(c => {
        if (c.obstacles) {
          c.obstacles.forEach(obs => {
            if (obs && obs.group) {
              const obsWorldZ = c.chunkZ + obs.group.position.z;
              if (Math.abs(obsWorldZ - pZ) < 15.0) {
                obs.group.position.x += 25.0;
              }
            }
          });
        }
      });
    });

    await page.waitForTimeout(600);
    const afterShot = path.join(BASE_ARTIFACT_DIR, '01_vertical_slice_district_a_after.png');
    await page.screenshot({ path: afterShot });
    console.log('Saved vertical slice shot:', afterShot);

    // Diagnostic Telemetry
    const telemetry = await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      return {
        theme: game?.environmentDirector?.getActiveTheme()?.id,
        distanceTraveled: game?.player?.distanceTraveled,
        playerZ: game?.player?.position?.z,
        drawCalls: game?.renderer?.info?.render?.calls,
        triangles: game?.renderer?.info?.render?.triangles
      };
    });

    fs.writeFileSync(path.join(BASE_ARTIFACT_DIR, 'telemetry_baseline.json'), JSON.stringify(telemetry, null, 2));
    console.log('Telemetry:', telemetry);
    console.log('🏁 Baseline capture complete!');
  } finally {
    await browser.close();
  }
}

captureChronoGate().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});

