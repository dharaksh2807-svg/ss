import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/doomsday_baseline';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function measureBaseline() {
  console.log('☄️ Measuring Baseline for DOOMSDAY_LAST_TRANSIT...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'DOOMSDAY_LAST_TRANSIT', 'NEON_RAINLINE'],
        selectedTheme: 'DOOMSDAY_LAST_TRANSIT',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'DOOMSDAY_LAST_TRANSIT');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('Starting run in DOOMSDAY_LAST_TRANSIT...');
    await page.evaluate(() => {
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
    });

    await page.waitForTimeout(1500);

    // 1. Capture 50m baseline screenshot
    console.log('Capturing 50m baseline screenshot...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_baseline_doomsday_50m.png') });

    // Measure rendering metrics
    const initialStats = await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const renderer = game?.worldScene?.renderer;
      const info = renderer ? renderer.info : null;
      return {
        triangles: info ? info.render.triangles : 0,
        calls: info ? info.render.calls : 0,
        lines: info ? info.render.lines : 0,
        points: info ? info.render.points : 0,
        geometries: info ? info.memory.geometries : 0,
        textures: info ? info.memory.textures : 0,
        playerZ: game?.player?.position?.z || 0
      };
    });

    console.log('Initial stats at start:', initialStats);

    // Run to 2,400m to capture marathon baseline
    console.log('Advancing naturally to 2,400m...');
    const startTime = Date.now();
    let currentDist = 0;

    while (currentDist < 2400 && (Date.now() - startTime) < 60000) {
      await page.evaluate(() => {
        const game = window.__METRO_GAME__;
        if (game && game.player) {
          game.player.position.z -= 45.0;
        }
      });
      await page.waitForTimeout(100);

      currentDist = await page.evaluate(() => {
        const game = window.__METRO_GAME__;
        return game?.player ? Math.abs(game.player.position.z) : 0;
      });
    }

    console.log(`Reached distance: ${currentDist.toFixed(1)}m. Capturing 2,400m baseline screenshot...`);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_baseline_doomsday_2400m.png') });

    const statsAt2400 = await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const renderer = game?.worldScene?.renderer;
      const info = renderer ? renderer.info : null;
      return {
        triangles: info ? info.render.triangles : 0,
        calls: info ? info.render.calls : 0,
        geometries: info ? info.memory.geometries : 0,
        textures: info ? info.memory.textures : 0,
        playerZ: game?.player?.position?.z || 0
      };
    });

    console.log('Stats at 2,400m:', statsAt2400);

    const baselineData = {
      capturedAt: new Date().toISOString(),
      theme: 'DOOMSDAY_LAST_TRANSIT',
      initialStats,
      statsAt2400
    };

    fs.writeFileSync(
      path.join(ARTIFACT_DIR, 'baseline_stats.json'),
      JSON.stringify(baselineData, null, 2)
    );

    console.log('✅ Baseline measurement complete! Results saved in:', ARTIFACT_DIR);
  } catch (err) {
    console.error('Error during baseline capture:', err);
  } finally {
    await browser.close();
  }
}

measureBaseline();
