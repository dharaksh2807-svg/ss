import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/neon_rainline_baseline';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function captureBaseline() {
  console.log('Capturing baseline of NEON_RAINLINE at 1,022m...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['NEON_RAINLINE', 'MODERN_METRO'],
        selectedTheme: 'NEON_RAINLINE',
        includePremiumThemesInDynamic: false
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'NEON_RAINLINE');
    });

    console.log('Navigating to http://localhost:3000/?preview=neon_rainline...');
    await page.goto('http://localhost:3000/?preview=neon_rainline', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch game naturally
    await page.evaluate(() => {
      if (window.__DEV_SET_WORLD__) {
        window.__DEV_SET_WORLD__('NEON_RAINLINE');
      }
      const playBtn = document.getElementById('start-play-btn');
      if (playBtn) playBtn.click();
      else if (window.__METRO_GAME__) window.__METRO_GAME__.startRun('NORMAL');

      const game = window.__METRO_GAME__;
      if (game) {
        game.soundManager.setMuted(true);
        game.player.crash = () => false;
        game.player.activateReviveGrace(99999999);
        game.player.isIntroInvincible = true;
        game.handleFatalCrash = () => {};
        game.handleGameOver = () => {};
        if (game.chaser) {
          game.chaser.update = () => {};
          if (game.chaser.mesh) game.chaser.mesh.position.set(0, -200, 0);
        }
        if (game.openingSequence) game.openingSequence.skip();
        game.cameraController.setLobbyMode(false);
      }
    });

    await page.waitForTimeout(1000);

    // Advance to 1022m
    console.log('Advancing player to 1022m...');
    await page.waitForFunction(() => {
      const game = window.__METRO_GAME__;
      if (!game || !game.player) return false;
      game.player.speed = 140;
      game.player.speedController.update = () => 140;
      game.player.speedController.getSpeed = () => 140;
      return game.player.distanceTraveled >= 1022;
    }, { timeout: 60000 });

    const baselineData = await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.speed = 0.0;
      game.player.position.z = -1022;
      game.player.distanceTraveled = 1022;
      game.cameraController.camera.position.set(0, 4.2, -1022 + 7.5);
      game.cameraController.camera.lookAt(0, 2.2, -1022 - 25.0);

      const info = game.worldScene?.renderer?.info;
      return {
        dist: game.player.distanceTraveled,
        drawCalls: info?.render?.calls || 0,
        triangles: info?.render?.triangles || 0,
        geometries: info?.memory?.geometries || 0,
        textures: info?.memory?.textures || 0
      };
    });

    await page.waitForTimeout(500);

    const shotPath = path.join(targetDir, 'neon_rainline_reported_failure_1022m.png');
    await page.screenshot({ path: shotPath });
    console.log(`📸 Saved baseline screenshot at 1022m to ${shotPath}`);

    fs.writeFileSync(path.join(targetDir, 'baseline_metrics.json'), JSON.stringify(baselineData, null, 2));
    console.log('Baseline metrics:', JSON.stringify(baselineData, null, 2));
  } finally {
    await browser.close();
  }
}

captureBaseline().then(() => {
  console.log('Baseline capture complete!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
