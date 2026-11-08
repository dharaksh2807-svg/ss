import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/chrono_verification';

async function testTitanCam() {
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

    // Frame Titan from 20m away facing it at X=13.5, Z=-50
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.position.z = -30.0;
      game.player.distanceTraveled = 30.0;
      game.player.speed = 0.0;

      // Clear any obstacle on right track
      game.trackManager.chunks.forEach(c => {
        if (c.obstacles) {
          c.obstacles.forEach(obs => {
            if (obs && obs.group) {
              obs.group.position.x += 40.0;
            }
          });
        }
      });

      // Lock camera in photo mode looking at Titan
      game.cameraController.isPhotoMode = true;
      game.cameraController.camera.position.set(2.0, 4.5, -34.0);
      game.cameraController.camera.lookAt(13.5, 9.0, -50.0);
    });

    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(targetDir, 'test_titan_look.png') });
    console.log('Saved test_titan_look.png');
  } finally {
    await browser.close();
  }
}

testTitanCam().catch(console.error);
