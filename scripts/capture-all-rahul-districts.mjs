import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/rahul_districts';
if (!fs.existsSync(BASE_ARTIFACT_DIR)) {
  fs.mkdirSync(BASE_ARTIFACT_DIR, { recursive: true });
}

async function captureAllRahulDistricts() {
  console.log('🚩 Starting In-Game Visual Capture Across All 5 RAHULVERSE Districts...');

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

    const checkpoints = [
      { name: '01_district_a_yatra_march_spawn_0m', distance: 0, label: 'District A: Never-Ending Yatra Spawn & Haveli Colonnades (0m)' },
      { name: '02_district_a_never_ending_finish_arch_18m', distance: 18, label: 'District A: Finish Line Flip Arch & Synchronized Disbelief Crowd (18m)' },
      { name: '03_district_a_campaign_tempo_and_dhaba_100m', distance: 100, label: 'District A: Campaign Support Tempo Van, Dhaba & Chabutras (100m)' },
      { name: '04_district_b_parliament_hug_and_wink_405m', distance: 405, label: 'District B: Parliament Bear Hug, Glasses Pop, Wink & Toppling Cameraman (405m)' },
      { name: '05_district_b_runaway_mic_and_benches_490m', distance: 490, label: 'District B: Runaway Microphone Arm & Green Leather Colonnade (490m)' },
      { name: '06_district_c_press_conference_panic_805m', distance: 805, label: 'District C: Broadcast Satellite Van & Media Conga Line (805m)' },
      { name: '07_district_c_teleprompter_avalanche_920m', distance: 920, label: 'District C: Teleprompter Avalanche & Spin Room Turntable (920m)' },
      { name: '08_district_d_alliance_rollercoaster_1215m', distance: 1215, label: 'District D: Alliance Carousel & Middle Seat Dispute (1215m)' },
      { name: '09_district_e_political_multiverse_1615m', distance: 1615, label: 'District E: Quantum Multiverse Portal & Ideological Warp Spires (1615m)' }
    ];

    const telemetryReport = [];

    for (const cp of checkpoints) {
      if (cp.distance > 0) {
        console.log(`Advancing to ${cp.distance}m (${cp.label})...`);
        await page.waitForFunction((targetDist) => {
          const game = window.__METRO_GAME__;
          if (!game || !game.player) return false;
          game.player.speed = 100.0;
          return game.player.distanceTraveled >= targetDist;
        }, cp.distance, { timeout: 35000 });

        // Halt, clear jetpack/hoverboard, and clear direct camera obstruction
        await page.evaluate((targetDist) => {
          const game = window.__METRO_GAME__;
          game.player.speed = 0.0;
          game.player.position.z = -targetDist;
          game.player.position.y = 0.9;
          game.player.distanceTraveled = targetDist;
          if (game.powerUpManager) {
            game.powerUpManager.clearAllPowerUps();
          }
          if (game.player.stateMachine) {
            game.player.stateMachine.setState('RUN');
          }
          const pZ = game.player.position.z;
          game.trackManager.chunks.forEach(c => {
            if (c.obstacles) {
              c.obstacles.forEach(obs => {
                if (obs && obs.group) {
                  const obsWorldZ = c.chunkZ + obs.group.position.z;
                  if (Math.abs(obsWorldZ - pZ) < 8.0) {
                    obs.group.position.x += 16.0;
                  }
                }
              });
            }
          });
        }, cp.distance);
        await page.waitForTimeout(600);
      }

      console.log(`📸 Capturing ${cp.label}...`);
      const shotPath = path.join(BASE_ARTIFACT_DIR, `${cp.name}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`Saved: ${shotPath}`);

      const tel = await page.evaluate((label) => {
        const game = window.__METRO_GAME__;
        const perf = game.getPerformanceMetrics ? game.getPerformanceMetrics() : {};
        return {
          checkpoint: label,
          activeTheme: game.environmentDirector?.getActiveTheme()?.id,
          distanceMeters: Math.round(game.player.distanceTraveled),
          playerZ: Math.round(game.player.position.z),
          fps: perf.fps || 60,
          drawCalls: game.renderer?.info?.render?.calls || 0,
          triangles: game.renderer?.info?.render?.triangles || 0
        };
      }, cp.label);

      telemetryReport.push(tel);
    }

    fs.writeFileSync(
      path.join(BASE_ARTIFACT_DIR, 'districts_telemetry.json'),
      JSON.stringify(telemetryReport, null, 2)
    );

    console.log('Telemetry summary across 9 checkpoints:', telemetryReport);
    console.log('🏆 All 9 Rahulverse checkpoints captured successfully!');
  } finally {
    await browser.close();
  }
}

captureAllRahulDistricts().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
