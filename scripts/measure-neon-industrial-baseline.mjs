import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/neon_industrial_baseline';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function captureBaseline() {
  console.log('🏭 Measuring Baseline Neon Industrial Performance & Capturing Baseline Gameplay...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL'],
        selectedTheme: 'NEON_INDUSTRIAL',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'NEON_INDUSTRIAL');
    });

    console.log('Navigating to http://localhost:3000/?preview=neon_industrial...');
    await page.goto('http://localhost:3000/?preview=neon_industrial', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Start game
    await page.evaluate(() => {
      if (window.__DEV_SET_WORLD__) {
        window.__DEV_SET_WORLD__('NEON_INDUSTRIAL');
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
        if (game.openingSequence) {
          game.openingSequence.skip();
        }
        game.cameraController.setLobbyMode(false);
      }

      const modal = document.querySelector('.modal-overlay, #revive-modal, #save-me-modal, #shop-modal, #environment-modal');
      if (modal && modal instanceof HTMLElement) modal.style.display = 'none';
    });

    await page.waitForTimeout(1500);

    // Measure live rendering metrics over 60 frames
    const baselineMetrics = await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      const renderer = game?.worldScene?.renderer;
      const frameTimes = [];
      let lastTime = performance.now();

      for (let i = 0; i < 60; i++) {
        await new Promise(requestAnimationFrame);
        const now = performance.now();
        frameTimes.push(now - lastTime);
        lastTime = now;
      }

      const info = renderer?.info || {};
      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      return {
        worldId: 'NEON_INDUSTRIAL',
        timestamp: new Date().toISOString(),
        avgFrameTimeMs: avgFrameTime,
        fps: 1000 / avgFrameTime,
        drawCalls: info.render?.calls || 0,
        triangles: info.render?.triangles || 0,
        geometries: info.memory?.geometries || 0,
        textures: info.memory?.textures || 0,
        activeTheme: game?.environmentDirector?.getActiveTheme()?.id
      };
    });

    console.log('📊 Baseline Metrics for Neon Industrial:', baselineMetrics);
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'baseline_metrics.json'), JSON.stringify(baselineMetrics, null, 2));

    // Capture baseline gameplay screenshot
    const screenshotPath = path.join(ARTIFACT_DIR, 'neon_industrial_baseline_gameplay.png');
    await page.screenshot({ path: screenshotPath });
    console.log('📸 Saved baseline screenshot to:', screenshotPath);

    await context.close();
    await browser.close();
    console.log('✅ Baseline capture complete.');
  } catch (err) {
    console.error('❌ Error during baseline capture:', err);
    await browser.close();
    process.exit(1);
  }
}

captureBaseline();
