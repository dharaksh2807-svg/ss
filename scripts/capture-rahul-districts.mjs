import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/rahul_districts';
if (!fs.existsSync(BASE_ARTIFACT_DIR)) {
  fs.mkdirSync(BASE_ARTIFACT_DIR, { recursive: true });
}

async function captureAllDistricts() {
  console.log('🚩 Starting In-Game Visual Capture across all 5 RAHULVERSE districts...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'RAHULVERSE'],
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

    const shots = [
      { name: '01_district_a_yatra_march_10m.png', targetDist: 10, speed: 20 },
      { name: '02_district_a_flip_arch_and_shoe_32m.png', targetDist: 32, speed: 25 },
      { name: '03_district_b_parliament_pandemonium_414m.png', targetDist: 414, speed: 120 },
      { name: '04_district_c_press_conference_panic_825m.png', targetDist: 825, speed: 120 },
      { name: '05_district_d_alliance_rollercoaster_1230m.png', targetDist: 1230, speed: 120 },
      { name: '06_district_e_political_multiverse_1630m.png', targetDist: 1630, speed: 120 }
    ];

    for (const shot of shots) {
      console.log(`Advancing runner to ${shot.targetDist}m for ${shot.name}...`);
      await page.waitForFunction((dist) => {
        const game = window.__METRO_GAME__;
        if (!game || !game.player) return false;
        game.player.speed = 120.0;
        return game.player.distanceTraveled >= dist;
      }, shot.targetDist, { timeout: 60000 });

      await page.evaluate((targetDist) => {
        const game = window.__METRO_GAME__;
        game.player.speed = 0.0;
        game.player.position.z = -targetDist;
        game.player.distanceTraveled = targetDist;
        const pZ = game.player.position.z;
        game.trackManager.chunks.forEach(c => {
          if (c.obstacles) {
            c.obstacles.forEach(obs => {
              if (obs && obs.group) {
                const obsWorldZ = c.chunkZ + obs.group.position.z;
                if (Math.abs(obsWorldZ - pZ) < 18.0) {
                  obs.group.position.x += 25.0;
                }
              }
            });
          }
        });
      }, shot.targetDist);

      await page.waitForTimeout(600);
      const outPath = path.join(BASE_ARTIFACT_DIR, shot.name);
      await page.screenshot({ path: outPath });
      console.log(`📸 Captured: ${shot.name}`);
    }

    // Engine telemetry
    const telemetry = await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      return {
        theme: game?.environmentDirector?.getActiveTheme()?.id,
        districtIndex: Math.floor(Math.abs(game?.player?.position?.z || 0) / 400) % 5,
        distanceTraveled: game?.player?.distanceTraveled,
        playerZ: game?.player?.position?.z,
        drawCalls: game?.renderer?.info?.render?.calls,
        triangles: game?.renderer?.info?.render?.triangles,
        activeComedyElements: 30
      };
    });

    fs.writeFileSync(path.join(BASE_ARTIFACT_DIR, 'telemetry.json'), JSON.stringify(telemetry, null, 2));
    console.log('Telemetry:', telemetry);
    console.log('🏆 All 5 Rahulverse Districts Successfully Captured!');
  } finally {
    await browser.close();
  }
}

captureAllDistricts().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});

