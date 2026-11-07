import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/orbital_halo_baseline';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function captureBaseline() {
  console.log('🛰️ Measuring Baseline Orbital Halo Performance & Capturing Baseline Gameplay...');

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
        unlockedThemes: ['MODERN_METRO', 'ORBITAL_HALO'],
        selectedTheme: 'ORBITAL_HALO',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'ORBITAL_HALO');
    });

    console.log('Navigating to http://localhost:3000/...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Start game
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

    await page.waitForTimeout(2000);

    // Measure baseline rendering stats over 60 frames
    const baselineStats = await page.evaluate(async () => {
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
        avgFrameTimeMs: avgFrameTime,
        fps: 1000 / avgFrameTime,
        drawCalls: info.render?.calls || 0,
        triangles: info.render?.triangles || 0,
        geometries: info.memory?.geometries || 0,
        textures: info.memory?.textures || 0,
        playerZ: game?.player?.position?.z || 0,
        dist: game?.player?.distanceTraveled || 0
      };
    });

    console.log('Baseline Rendering Stats:', JSON.stringify(baselineStats, null, 2));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'baseline_stats.json'), JSON.stringify(baselineStats, null, 2));

    // Capture baseline screenshots at 50m and ~723m
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.position.z = -50;
      game.player.distanceTraveled = 50;
      game.cameraController.camera.position.set(0, 4.2, -42.5);
      game.cameraController.camera.lookAt(0, 2.2, -75);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_baseline_orbital_halo_50m.png') });
    console.log('📸 Saved 01_baseline_orbital_halo_50m.png');

    // Screenshot around 723m (user mentioned comparison at ~723m)
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.position.z = -723;
      game.player.distanceTraveled = 723;
      game.cameraController.camera.position.set(0, 4.2, -715.5);
      game.cameraController.camera.lookAt(0, 2.2, -748);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_baseline_orbital_halo_723m.png') });
    console.log('📸 Saved 02_baseline_orbital_halo_723m.png');

    await context.close();
    await browser.close();
    console.log('✅ Baseline capture complete.');
  } catch (e) {
    console.error('❌ Baseline error:', e);
    await browser.close();
  }
}

captureBaseline();
