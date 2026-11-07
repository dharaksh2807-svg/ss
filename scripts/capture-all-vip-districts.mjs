import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/vip_districts';
if (!fs.existsSync(BASE_ARTIFACT_DIR)) {
  fs.mkdirSync(BASE_ARTIFACT_DIR, { recursive: true });
}

async function captureAllDistricts() {
  console.log('🏛️ Starting In-Game Visual Capture Across All 5 VIP_EXPRESS Districts...');

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
      { name: '01_district_a_roadshow_spawn_0m', distance: 0, label: 'District A: Roadshow Royale (0m Spawn)' },
      { name: '02_district_a_roadshow_convoy_80m', distance: 80, label: 'District A: Roadshow Convoy & Escort (80m)' },
      { name: '03_district_a_mango_interview_320m', distance: 320, label: 'District A: Mango Interview Summit (320m)' },
      { name: '04_district_b_chai_pe_charcha_500m', distance: 500, label: 'District B: Chai Pe Charcha Stalls & Colossal Kettle (500m)' },
      { name: '05_district_b_teacup_unveiling_700m', distance: 700, label: 'District B: Monumental Teacup Unveiling & Selfie Battle (700m)' },
      { name: '06_district_c_inauguration_infinity_900m', distance: 900, label: 'District C: Inauguration Infinity & Recursive Scissors (900m)' },
      { name: '07_district_c_reopening_arches_1080m', distance: 1080, label: 'District C: Twin Re-Opening Arches & Hug Loop (1080m)' },
      { name: '08_district_d_prime_time_pandemonium_1350m', distance: 1350, label: 'District D: Prime-Time Media Studios & Remote Revelation (1350m)' },
      { name: '09_district_e_political_grand_arena_1750m', distance: 1750, label: 'District E: Parliamentary Arena, Gavel & Coalition Carousel (1750m)' }
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

        // Halt and clear direct camera obstruction
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
                    obs.group.position.x += 16.0;
                  }
                }
              });
            }
          });
        });
        await page.waitForTimeout(500);
      }

      console.log(`📸 Capturing ${cp.label}...`);
      const shotPath = path.join(BASE_ARTIFACT_DIR, `${cp.name}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`Saved: ${shotPath}`);

      const tel = await page.evaluate((label) => {
        const game = window.__METRO_GAME__;
        const perf = game.getPerformanceMetrics();
        const eventDirector = window.__VIP_DIRECTOR__;
        return {
          checkpoint: label,
          distanceTraveled: game.player.distanceTraveled.toFixed(1) + 'm',
          playerZ: game.player.position.z.toFixed(1),
          drawCalls: perf.drawCalls,
          triangles: perf.triangles,
          fps: perf.fps,
          activeComedyElements: eventDirector ? eventDirector.getTotalActiveElements() : 0,
          signatureGags: eventDirector ? eventDirector.getSignatureGagsCount() : 0
        };
      }, cp.label);

      telemetryReport.push(tel);
      console.log(`Telemetry at ${cp.distance}m:`, tel);
    }

    fs.writeFileSync(
      path.join(BASE_ARTIFACT_DIR, 'districts_telemetry.json'),
      JSON.stringify(telemetryReport, null, 2)
    );

    console.log('🏆 All 5 VIP_EXPRESS Districts Successfully Captured and Audited!');
  } catch (err) {
    console.error('Error during capture:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureAllDistricts();
