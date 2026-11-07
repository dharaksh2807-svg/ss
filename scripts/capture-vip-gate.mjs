import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/vip_gate';
if (!fs.existsSync(BASE_ARTIFACT_DIR)) {
  fs.mkdirSync(BASE_ARTIFACT_DIR, { recursive: true });
}

async function captureVipGate() {
  console.log('🏛️ Starting In-Game Visual Capture for VIP_EXPRESS Two-Scene Gate...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.addInitScript(() => {
      const state = {
        unlockedThemes: [
          'MODERN_METRO',
          'VIP_EXPRESS'
        ],
        selectedTheme: 'VIP_EXPRESS',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax', 'char_modi'],
        selectedCharacter: 'char_modi',
        modiFreeRuns: 999
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'VIP_EXPRESS');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch run in VIP_EXPRESS
    console.log('Starting run in VIP_EXPRESS with char_modi...');
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

    // 1. Capture Scene 1: Roadshow Royale at 0m (Spawn & starting promenade)
    console.log('📸 1. Capturing Scene 1: Roadshow Royale Spawn (0m)...');
    const shot1 = path.join(BASE_ARTIFACT_DIR, '01_roadshow_royale_spawn.png');
    await page.screenshot({ path: shot1 });
    console.log('Saved:', shot1);

    // Let player advance to ~60m to see roadshow float & escort convoy in action
    console.log('Advancing runner to 60m into Roadshow Royale convoy...');
    await page.waitForFunction(() => {
      const game = window.__METRO_GAME__;
      if (!game || !game.player) return false;
      game.player.speed = 40.0;
      return game.player.distanceTraveled >= 60;
    }, { timeout: 30000 });

    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.speed = 0.0;
      // Clear obstacle directly in front of camera
      const pZ = game.player.position.z;
      game.trackManager.chunks.forEach(c => {
        if (c.obstacles) {
          c.obstacles.forEach(obs => {
            if (obs && obs.group) {
              const obsWorldZ = c.chunkZ + obs.group.position.z;
              if (Math.abs(obsWorldZ - pZ) < 7.0) {
                obs.group.position.x += 15.0;
              }
            }
          });
        }
      });
    });

    await page.waitForTimeout(600);
    console.log('📸 2. Capturing Scene 1: Roadshow Royale Convoy (60m)...');
    const shot2 = path.join(BASE_ARTIFACT_DIR, '02_roadshow_royale_convoy_60m.png');
    await page.screenshot({ path: shot2 });
    console.log('Saved:', shot2);

    // 2. Advance to Scene 2: Mango Interview at ~320m
    console.log('Advancing runner to 320m for Mango Interview...');
    await page.waitForFunction(() => {
      const game = window.__METRO_GAME__;
      if (!game || !game.player) return false;
      game.player.speed = 80.0;
      return game.player.distanceTraveled >= 320;
    }, { timeout: 30000 });

    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.speed = 0.0;
      // Clear obstacle directly in front of camera
      const pZ = game.player.position.z;
      game.trackManager.chunks.forEach(c => {
        if (c.obstacles) {
          c.obstacles.forEach(obs => {
            if (obs && obs.group) {
              const obsWorldZ = c.chunkZ + obs.group.position.z;
              if (Math.abs(obsWorldZ - pZ) < 7.0) {
                obs.group.position.x += 15.0;
              }
            }
          });
        }
      });
    });

    await page.waitForTimeout(600);
    console.log('📸 3. Capturing Scene 2: Mango Interview at 320m...');
    const shot3 = path.join(BASE_ARTIFACT_DIR, '03_mango_interview_320m.png');
    await page.screenshot({ path: shot3 });
    console.log('Saved:', shot3);

    // Position player camera directly angled towards the mango interview stage on the right
    console.log('Capturing close-up angle of Mango Interview stage...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const cam = game.cameraController.camera;
      game.cameraController.update = () => {}; // prevent per-frame camera controller override
      cam.position.set(5.5, 3.2, game.player.position.z + 6.0);
      cam.lookAt(11.2, 2.8, game.player.position.z);
    });
    await page.waitForTimeout(400);
    const shot4 = path.join(BASE_ARTIFACT_DIR, '04_mango_interview_stage_closeup.png');
    await page.screenshot({ path: shot4 });
    console.log('Saved:', shot4);

    // Also get comedy director and performance metrics
    const metrics = await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const perf = game.getPerformanceMetrics();
      const eventDirector = window.__VIP_DIRECTOR__;
      return {
        fps: perf.fps,
        drawCalls: perf.drawCalls,
        triangles: perf.triangles,
        activeGags: eventDirector ? eventDirector.getSignatureGagsCount() : 0,
        floats: eventDirector ? eventDirector.getRoadshowFloatCount() : 0,
        escorts: eventDirector ? eventDirector.getPilotEscortCount() : 0,
        crowd: eventDirector ? eventDirector.getCrowdMemberCount() : 0,
        totalElements: eventDirector ? eventDirector.getTotalActiveElements() : 0
      };
    });
    console.log('Metrics & Telemetry:', JSON.stringify(metrics, null, 2));

    console.log('🎉 Two-Scene Gate Captures Complete!');
  } catch (err) {
    console.error('Error during capture:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureVipGate();
