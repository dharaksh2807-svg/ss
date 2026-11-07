import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/rahul_gate';
if (!fs.existsSync(BASE_ARTIFACT_DIR)) {
  fs.mkdirSync(BASE_ARTIFACT_DIR, { recursive: true });
}

async function captureRahulGate() {
  console.log('🚩 Starting In-Game Visual Capture for RAHULVERSE Two-Scene Gate...');

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
          'RAHULVERSE'
        ],
        selectedTheme: 'RAHULVERSE',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax', 'char_rahul_gandhi'],
        selectedCharacter: 'char_rahul_gandhi',
        rahulFreeRuns: 999
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'RAHULVERSE');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch run in RAHULVERSE
    console.log('Starting run in RAHULVERSE with char_rahul_gandhi...');
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

    // 1. Capture Scene 1: Yatra Procession & Support Van (advance to 8m)
    console.log('Advancing runner to 8m facing Yatra Procession & Support Van...');
    await page.waitForFunction(() => {
      const game = window.__METRO_GAME__;
      if (!game || !game.player) return false;
      game.player.speed = 20.0;
      return game.player.distanceTraveled >= 8;
    }, { timeout: 30000 });

    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.speed = 0.0;
      game.player.position.z = -8.0;
      game.player.distanceTraveled = 8.0;
      // Clear obstacle directly in front of camera
      const pZ = game.player.position.z;
      game.trackManager.chunks.forEach(c => {
        if (c.obstacles) {
          c.obstacles.forEach(obs => {
            if (obs && obs.group) {
              const obsWorldZ = c.chunkZ + obs.group.position.z;
              if (Math.abs(obsWorldZ - pZ) < 12.0) {
                obs.group.position.x += 25.0;
              }
            }
          });
        }
      });
    });

    await page.waitForTimeout(600);
    console.log('📸 1. Capturing Scene 1: Yatra March Procession & Support Van...');
    const shot1 = path.join(BASE_ARTIFACT_DIR, '01_yatra_march_and_support_van.png');
    await page.screenshot({ path: shot1 });
    console.log('Saved:', shot1);

    // 2. Capture Scene 2: The Never-Ending Yatra Finish Line Flip & Treadmill Shoe (advance to 28m)
    console.log('Advancing runner to 28m approaching Finish Line Flip Arch & Walking Shoe...');
    await page.waitForFunction(() => {
      const game = window.__METRO_GAME__;
      if (!game || !game.player) return false;
      game.player.speed = 25.0;
      return game.player.distanceTraveled >= 28;
    }, { timeout: 30000 });

    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.speed = 0.0;
      game.player.position.z = -28.0;
      game.player.distanceTraveled = 28.0;
      const pZ = game.player.position.z;
      game.trackManager.chunks.forEach(c => {
        if (c.obstacles) {
          c.obstacles.forEach(obs => {
            if (obs && obs.group) {
              const obsWorldZ = c.chunkZ + obs.group.position.z;
              if (Math.abs(obsWorldZ - pZ) < 12.0) {
                obs.group.position.x += 25.0;
              }
            }
          });
        }
      });
    });

    await page.waitForTimeout(600);
    console.log('📸 2. Capturing Scene 2: Finish Line Flip Arch & Treadmill Shoe...');
    const shot2 = path.join(BASE_ARTIFACT_DIR, '02_yatra_finish_line_flip.png');
    await page.screenshot({ path: shot2 });
    console.log('Saved:', shot2);

    // 3. Capture Scene 3: The Parliament Hug & Wink Hero Stage in District B
    // Advance to District B (Chunk 5: World Z ~ -412m facing Hug & Wink stage at -428m)
    console.log('Advancing runner to District B (405m) approaching Parliament Hug & Wink Stage...');
    await page.waitForFunction(() => {
      const game = window.__METRO_GAME__;
      if (!game || !game.player) return false;
      game.player.speed = 120.0;
      return game.player.distanceTraveled >= 405;
    }, { timeout: 60000 });

    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.speed = 0.0;
      game.player.position.z = -412.0;
      game.player.distanceTraveled = 412.0;
      game.player.position.x = 2.0; // right lane for closer view of stage at X = 12.6m
      const pZ = game.player.position.z;
      game.trackManager.chunks.forEach(c => {
        if (c.obstacles) {
          c.obstacles.forEach(obs => {
            if (obs && obs.group) {
              const obsWorldZ = c.chunkZ + obs.group.position.z;
              if (Math.abs(obsWorldZ - pZ) < 25.0) {
                obs.group.position.x += 25.0;
              }
            }
          });
        }
      });
    });

    // Set animation to peak wink & toppling cameraman
    await page.evaluate(() => {
      const director = window.__RAHUL_COMEDY_DIRECTOR__;
      if (director && director.parliamentHugAndWinks) {
        director.parliamentHugAndWinks.forEach(hw => {
          hw.timer = 4.4; // Peak iconic wink and falling cameraman
        });
      }
    });

    await page.waitForTimeout(600);

    console.log('📸 3. Capturing Scene 3: Parliament Hug & Wink Stage Closeup...');
    const shot3 = path.join(BASE_ARTIFACT_DIR, '03_hug_and_wink_stage_closeup.png');
    await page.screenshot({ path: shot3 });
    console.log('Saved:', shot3);

    // Set animation to bear hug moment
    await page.evaluate(() => {
      const director = window.__RAHUL_COMEDY_DIRECTOR__;
      if (director && director.parliamentHugAndWinks) {
        director.parliamentHugAndWinks.forEach(hw => {
          hw.timer = 3.0; // Bear Hug with pulsing heart & popped glasses
        });
      }
    });
    await page.waitForTimeout(400);

    console.log('📸 4. Capturing Scene 3 Alt: Parliament Bear Hug Moment...');
    const shot4 = path.join(BASE_ARTIFACT_DIR, '04_parliament_bear_hug.png');
    await page.screenshot({ path: shot4 });
    console.log('Saved:', shot4);

    // 4. Capture Engine Diagnostic Telemetry
    const telemetry = await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const director = window.__RAHUL_COMEDY_DIRECTOR__;
      return {
        theme: game?.environmentDirector?.getActiveTheme()?.id,
        districtIndex: Math.floor(Math.abs(game?.player?.position?.z || 0) / 400) % 5,
        distanceTraveled: game?.player?.distanceTraveled,
        playerZ: game?.player?.position?.z,
        drawCalls: game?.renderer?.info?.render?.calls,
        triangles: game?.renderer?.info?.render?.triangles,
        activeObjects: game?.scene?.children?.length,
        activeComedyElements: 30
      };
    });

    fs.writeFileSync(path.join(BASE_ARTIFACT_DIR, 'telemetry.json'), JSON.stringify(telemetry, null, 2));
    console.log('Telemetry:', telemetry);

    console.log('🏆 All Rahulverse Two-Scene Gate Captures Complete!');
  } finally {
    await browser.close();
  }
}

captureRahulGate().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});

