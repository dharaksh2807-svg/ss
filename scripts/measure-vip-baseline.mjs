import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/vip_baseline';
if (!fs.existsSync(BASE_ARTIFACT_DIR)) {
  fs.mkdirSync(BASE_ARTIFACT_DIR, { recursive: true });
}

async function captureBaseline() {
  console.log('🏛️ Starting In-Game Visual Capture for VIP_EXPRESS Baseline...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'VIP_EXPRESS'],
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

    const checkpoints = [
      { name: '01_baseline_roadshow_spawn_0m', distance: 0, label: 'Roadshow Royale Spawn (0m)' },
      { name: '02_baseline_roadshow_convoy_80m', distance: 80, label: 'Roadshow Convoy (80m)' },
      { name: '03_baseline_mango_interview_320m', distance: 320, label: 'Mango Interview Summit (320m)' },
      { name: '04_baseline_chai_pe_charcha_500m', distance: 500, label: 'Chai Pe Charcha (500m)' },
      { name: '05_baseline_inauguration_infinity_900m', distance: 900, label: 'Inauguration Infinity (900m)' },
      { name: '06_baseline_prime_time_media_1350m', distance: 1350, label: 'Prime-Time Media (1350m)' },
      { name: '07_baseline_parliament_comedy_1750m', distance: 1750, label: 'Parliamentary Plaza (1750m)' }
    ];

    const stats = [];

    for (const cp of checkpoints) {
      if (cp.distance > 0) {
        console.log(`Advancing to ${cp.distance}m (${cp.label})...`);
        await page.waitForFunction((targetDist) => {
          const game = window.__METRO_GAME__;
          if (!game || !game.player) return false;
          game.player.speed = 100.0;
          return game.player.distanceTraveled >= targetDist;
        }, cp.distance, { timeout: 35000 });

        await page.evaluate(() => {
          const game = window.__METRO_GAME__;
          game.player.speed = 0.0;
          const pZ = game.player.position.z;
          game.trackManager.chunks.forEach(c => {
            if (c.obstacles) {
              c.obstacles.forEach(obs => {
                if (obs && obs.group) {
                  const obsWorldZ = c.chunkZ + obs.group.position.z;
                  if (Math.abs(obsWorldZ - pZ) < 8.0) {
                    obs.group.visible = false;
                  }
                }
              });
            }
          });
        });
      }

      await page.waitForTimeout(500);

      const filePath = path.join(BASE_ARTIFACT_DIR, `${cp.name}.png`);
      await page.screenshot({ path: filePath });
      console.log(`📸 Captured: ${filePath}`);

      const info = await page.evaluate((label) => {
        const game = window.__METRO_GAME__;
        const perf = game ? game.getPerformanceMetrics() : { drawCalls: 0, triangles: 0, fps: 60 };
        const eventDirector = window.__VIP_DIRECTOR__;
        return {
          label,
          distanceTraveled: game ? game.player.distanceTraveled.toFixed(1) + 'm' : '0m',
          playerZ: game ? game.player.position.z.toFixed(1) : '0',
          drawCalls: perf ? perf.drawCalls : 0,
          triangles: perf ? perf.triangles : 0,
          fps: perf ? perf.fps : 60,
          activeComedyElements: eventDirector ? eventDirector.getTotalActiveElements() : 0
        };
      }, cp.label);
      stats.push(info);
      console.log(`Telemetry at ${cp.distance}m:`, info);
    }

    fs.writeFileSync(path.join(BASE_ARTIFACT_DIR, 'baseline_stats.json'), JSON.stringify(stats, null, 2));
    console.log('✅ Baseline capture complete!');
  } finally {
    await browser.close();
  }
}

captureBaseline().catch(err => {
  console.error('Error in baseline capture:', err);
  process.exit(1);
});
