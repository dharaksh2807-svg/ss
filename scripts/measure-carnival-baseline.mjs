import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/carnival_baseline';
const targetUrl = 'http://localhost:3000';

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function measureBaseline() {
  console.log('📏 Measuring HAUNTED_CARNIVAL baseline at http://localhost:3000...');
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
        unlockedThemes: ['MODERN_METRO', 'HAUNTED_CARNIVAL'],
        selectedTheme: 'HAUNTED_CARNIVAL',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'HAUNTED_CARNIVAL');
    });

    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

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

    await page.waitForTimeout(1000);

    // Capture baseline at 50m
    await page.waitForFunction((targetDist) => {
      const game = window.__METRO_GAME__;
      return game && game.player && game.player.distanceTraveled >= targetDist;
    }, 50, { timeout: 30000 });

    const stats50 = await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const renderer = game?.worldScene?.renderer;
      return {
        dist: game.player.distanceTraveled,
        posZ: game.player.position.z,
        triangles: renderer?.info?.render?.triangles || 0,
        drawCalls: renderer?.info?.render?.calls || 0,
        geometries: renderer?.info?.memory?.geometries || 0,
        textures: renderer?.info?.memory?.textures || 0
      };
    });

    await page.screenshot({ path: path.join(targetDir, '01_baseline_carnival_50m.png') });
    console.log('Saved 01_baseline_carnival_50m.png:', stats50);

    // Advance to 858m (the reported failure distance!)
    console.log('Advancing to 858m for user verdict reproduction...');
    const advanceSteps = [300, 600, 858];
    for (const stepDist of advanceSteps) {
      console.log(`Advancing to ${stepDist}m...`);
      await page.waitForFunction((targetDist) => {
        const game = window.__METRO_GAME__;
        if (!game || !game.player) return false;
        game.player.speedController.update = () => 140;
        game.player.speedController.getSpeed = () => 140;
        return game.player.distanceTraveled >= targetDist;
      }, stepDist, { timeout: 60000 });
    }

    const stats858 = await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const renderer = game?.worldScene?.renderer;
      game.player.speed = 0.0;
      game.player.position.z = -858;
      game.player.distanceTraveled = 858;
      game.cameraController.camera.position.set(0, 4.2, -858 + 7.5);
      game.cameraController.camera.lookAt(0, 2.2, -858 - 25.0);

      return {
        dist: game.player.distanceTraveled,
        posZ: game.player.position.z,
        triangles: renderer?.info?.render?.triangles || 0,
        drawCalls: renderer?.info?.render?.calls || 0,
        geometries: renderer?.info?.memory?.geometries || 0,
        textures: renderer?.info?.memory?.textures || 0
      };
    });

    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(targetDir, '02_baseline_carnival_858m_reported_failure.png') });
    console.log('Saved 02_baseline_carnival_858m_reported_failure.png:', stats858);

    fs.writeFileSync(path.join(targetDir, 'baseline_stats.json'), JSON.stringify({ stats50, stats858 }, null, 2));

    await page.close();
    await context.close();
    console.log('Baseline measurements complete.');
  } catch (err) {
    console.error('Error in baseline measurement:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

measureBaseline();

