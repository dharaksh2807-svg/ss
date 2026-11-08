import { chromium } from 'playwright';
import path from 'path';

async function inspectFeatures() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

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

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

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
      if (game.openingSequence) game.openingSequence.skip();
      game.cameraController.setLobbyMode(false);
    }
  });

  await page.waitForTimeout(1000);

  // Advance player slightly to ensure chunks are spawned
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.speed = 10.0;
    game.player.update(0.1);
    game.trackManager.update(game.player, 0.1, performance.now() / 1000);
  });

  // Find Titan and Time Rift
  const info = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const scene = game.worldScene.scene;

    let titanPos = null;
    let titanFound = false;
    let riftPos = null;
    let riftFound = false;

    scene.traverse((obj) => {
      if (obj.name === 'blockbuster_clockwork_titan') {
        titanFound = true;
        const wp = new window.THREE.Vector3();
        obj.getWorldPosition(wp);
        titanPos = { x: wp.x, y: wp.y, z: wp.z };
      }
      if (obj.name === 'blockbuster_time_rift') {
        riftFound = true;
        const wp = new window.THREE.Vector3();
        obj.getWorldPosition(wp);
        riftPos = { x: wp.x, y: wp.y, z: wp.z };
      }
    });

    return { titanFound, titanPos, riftFound, riftPos };
  });

  console.log('Inspection result:', info);

  if (info.titanFound && info.titanPos) {
    await page.evaluate((pos) => {
      const game = window.__METRO_GAME__;
      game.cameraController.isPhotoMode = true;
      // Position camera directly in front of the titan at eye-level
      // The titan is at pos.x, pos.y, pos.z, with front facing towards track/player
      game.cameraController.camera.position.set(pos.x - 7.5, pos.y + 7.5, pos.z + 10.0);
      game.cameraController.camera.lookAt(pos.x, pos.y + 7.5, pos.z);
    }, info.titanPos);

    await page.waitForTimeout(500);
    const titanPath = '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/chrono_verification/titan_direct_view.png';
    await page.screenshot({ path: titanPath });
    console.log('Saved titan screenshot to:', titanPath);
  }

  // Now advance to District C to inspect the Time Rift
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.speed = 100.0;
    while (game.player.distanceTraveled < 930) {
      game.player.update(0.05);
      game.trackManager.update(game.player, 0.05, performance.now() / 1000);
    }
    game.player.speed = 0.0;
  });

  const riftInfo = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const scene = game.worldScene.scene;
    let riftPos = null;
    let riftFound = false;

    scene.traverse((obj) => {
      if (obj.name === 'blockbuster_time_rift') {
        riftFound = true;
        const wp = new window.THREE.Vector3();
        obj.getWorldPosition(wp);
        riftPos = { x: wp.x, y: wp.y, z: wp.z };
      }
    });

    return { riftFound, riftPos };
  });

  console.log('Rift result at 930m:', riftInfo);

  if (riftInfo.riftFound && riftInfo.riftPos) {
    await page.evaluate((pos) => {
      const game = window.__METRO_GAME__;
      game.cameraController.isPhotoMode = true;
      // Position camera facing the portal aperture
      game.cameraController.camera.position.set(pos.x + 5.0, pos.y + 16.0, pos.z + 16.0);
      game.cameraController.camera.lookAt(pos.x, pos.y + 16.0, pos.z);
    }, riftInfo.riftPos);

    await page.waitForTimeout(500);
    const riftPath = '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/chrono_verification/time_rift_direct_view.png';
    await page.screenshot({ path: riftPath });
    console.log('Saved rift screenshot to:', riftPath);
  }

  await browser.close();
}

inspectFeatures().catch(console.error);

