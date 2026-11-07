import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/midnight_velvet_districts';
if (!fs.existsSync(BASE_ARTIFACT_DIR)) {
  fs.mkdirSync(BASE_ARTIFACT_DIR, { recursive: true });
}

async function captureAllMidnightDistricts() {
  console.log('🍸 Starting In-Game Visual Capture Across All 4 MIDNIGHT_VELVET Districts...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'MIDNIGHT_VELVET'],
        selectedTheme: 'MIDNIGHT_VELVET',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax', 'char_modi', 'char_rahul_gandhi'],
        selectedCharacter: 'char_modi'
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'MIDNIGHT_VELVET');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch run in MIDNIGHT_VELVET
    console.log('Starting run in MIDNIGHT_VELVET...');
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
      { name: '01_district_a_velvet_boulevard_spawn_0m', distance: 0, label: 'District A: Grand Hotel Le Velvet & VIP Arrival Spawn (0m)' },
      { name: '02_district_a_velvet_boulevard_bistro_22m', distance: 22, label: 'District A: High-Society Sidewalk Bistro Terrace & Art Deco Streetlamps (22m)' },
      { name: '03_district_a_velvet_boulevard_hotel_le_velvet_44m', distance: 44, label: 'District A: Le Velours Marquee, Red Carpet, Paparazzi & Limousine (44m)' },
      { name: '04_district_b_moonlight_marina_boardwalk_410m', distance: 410, label: 'District B: Teak Boardwalk Promenade, Mooring Bollards & Marina Palms (410m)' },
      { name: '05_district_b_moonlight_marina_superyacht_and_moon_480m', distance: 480, label: 'District B: Luxury Superyacht, Underwater Aqua Glow & Full Moon (480m)' },
      { name: '06_district_c_golden_hour_club_entrance_815m', distance: 815, label: 'District C: Golden Hour Club Art Deco Facade & Gilded Friezes (815m)' },
      { name: '07_district_c_golden_hour_club_open_sky_plaza_880m', distance: 880, label: 'District C: 18m Open Sky Courtyard, Cocktail Bar & Skyline Searchlights (880m)' },
      { name: '08_district_c_golden_hour_club_rooftop_party_940m', distance: 940, label: 'District C: Rooftop VIP Party Terrace, Neon Dance Floor & Dancers (940m)' },
      { name: '09_district_d_midnight_grand_colonnade_1215m', distance: 1215, label: 'District D: Beaux-Arts Colonnade, Vaulted Arches & Crystal Chandeliers (1215m)' },
      { name: '10_district_d_midnight_grand_clock_tower_and_streamliner_1280m', distance: 1280, label: 'District D: Stepped Clock Tower, Pendulum & Luxury Pullman Carriage (1280m)' }
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

        // Halt, clear jetpack/hoverboard, and position player cleanly
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
            game.player.stateMachine.state = 'RUN';
          }
          game.player.currentLane = 0;
          game.player.targetLane = 0;
          game.player.position.x = 0;
        }, cp.distance);

        await page.waitForTimeout(800);
      }

      // Collect telemetry at this checkpoint
      const telemetry = await page.evaluate((cpInfo) => {
        const game = window.__METRO_GAME__;
        const scene = game?.scene;
        const p = game?.player;
        const cam = game?.camera;

        const currentEnv = game?.environmentDirector?.currentTheme?.id || 'UNKNOWN';

        return {
          checkpoint: cpInfo.name,
          label: cpInfo.label,
          targetDistance: cpInfo.distance,
          playerZ: p ? p.position.z : 0,
          actualDistance: p ? p.distanceTraveled : 0,
          playerY: p ? p.position.y : 0,
          environment: currentEnv,
          camPos: cam ? { x: cam.position.x, y: cam.position.y, z: cam.position.z } : null
        };
      }, cp);

      telemetryReport.push(telemetry);

      // Capture screenshot
      const outPath = path.join(BASE_ARTIFACT_DIR, `${cp.name}.png`);
      await page.screenshot({ path: outPath });
      console.log(`📸 Saved [${cp.name}.png] at ${telemetry.actualDistance.toFixed(1)}m (Env: ${telemetry.environment})`);
    }

    // Save telemetry report
    const telemPath = path.join(BASE_ARTIFACT_DIR, 'districts_telemetry.json');
    fs.writeFileSync(telemPath, JSON.stringify(telemetryReport, null, 2));
    console.log(`\n✅ Successfully captured all ${checkpoints.length} Midnight Velvet district viewpoints!`);

  } catch (err) {
    console.error('❌ Error during district capture:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

captureAllMidnightDistricts();
