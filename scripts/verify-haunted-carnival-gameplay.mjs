import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/haunted_carnival_evidence';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function verifyHauntedCarnivalGameplay() {
  console.log('🎃 Launching Headless Chrome for HAUNTED CARNIVAL Visual & Gameplay Verification...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // Pre-seed localStorage before page load so ProgressionManager and Game start in HAUNTED_CARNIVAL
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: [
          'MODERN_METRO',
          'HISTORIC_QUARTER',
          'UNDERGROUND_METRO',
          'NEON_INDUSTRIAL',
          'NEON_RAINLINE',
          'ORBITAL_HALO',
          'ABYSSAL_GLASSLINE',
          'DOOMSDAY_LAST_TRANSIT',
          'PHANTOM_LINE',
          'HAUNTED_CARNIVAL'
        ],
        selectedTheme: 'HAUNTED_CARNIVAL',
        includePremiumThemesInDynamic: true
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'HAUNTED_CARNIVAL');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch run in HAUNTED_CARNIVAL
    console.log('Starting run in HAUNTED CARNIVAL: The Nightmare Wonderland...');
    await page.evaluate(() => {
      if (window.__DEV_SET_WORLD__) {
        window.__DEV_SET_WORLD__('HAUNTED_CARNIVAL');
      }
      const playBtn = document.getElementById('start-play-btn');
      if (playBtn) {
        playBtn.click();
      } else if (window.__METRO_GAME__) {
        window.__METRO_GAME__.startRun('NORMAL');
      }
    });

    await page.waitForTimeout(2000);

    // Telemetry storage
    const telemetry = {
      worldId: 'HAUNTED_CARNIVAL',
      snapshots: []
    };

    const targetWaypoints = [
      { name: '01_haunted_entrance_0m', z: -15, label: 'The Cursed Entrance & Gothic Gateway' },
      { name: '02_haunted_funfair_100m', z: -100, label: 'The Abandoned Funfair & Game Stalls' },
      { name: '03_haunted_circus_250m', z: -250, label: 'The Ghostly Circus Big Top & Acrobats' },
      { name: '04_haunted_graveyard_scene_b_500m', z: -500, label: 'Scene B: Surprise Ghost Encounter & Crypts' },
      { name: '05_haunted_manor_735m', z: -735, label: 'The Nightmare Manor & Giant Shadow Beast' },
      { name: '06_haunted_carousel_scene_a_1000m', z: -1000, label: 'Scene A: The Haunted Carousel Awakening' },
      { name: '07_haunted_cycle2_1600m', z: -1600, label: 'Cycle 2 Multi-Zone Permutation' },
      { name: '08_haunted_cycle2_2400m', z: -2400, label: 'Deep Midnight Gothic Carnival Sprint' },
      { name: '09_haunted_cycle3_3200m', z: -3200, label: 'Cycle 3 Long-Run Atmospheric Replayability' },
      { name: '10_haunted_extreme_4800m', z: -4800, label: '4.8km Extreme Marathon Nightmare Wonderland' },
    ];

    for (let i = 0; i < targetWaypoints.length; i++) {
      const wp = targetWaypoints[i];
      console.log(`Positioning player at ${wp.label} (Z = ${wp.z}m)...`);

      const snapDiag = await page.evaluate((targetZ) => {
        const game = window.__METRO_GAME__;
        if (game) {
          const p = game.getPlayer();
          p.isInvulnerable = true;
          p.position.set(0, 0.9, targetZ);
          p.currentLane = 0;
          p.targetLane = 0;
          p.speed = 0;
          p.isGrounded = true;
          p.updateCollider();

          const chaser = game.chaser;
          if (chaser) {
            chaser.state = 'DISTANT';
            chaser.distance = 55;
          }

          // Advance director frames
          const director = window.__HAUNTED_DIRECTOR__;
          if (director) {
            director.update(0.1, true, targetZ);
            return director.getDiagnostics();
          }
        }
        return null;
      }, wp.z);

      // Hide modal overlays if any
      await page.evaluate(() => {
        const modals = document.querySelectorAll('.modal-overlay, #revive-modal, #save-me-modal');
        modals.forEach((m) => {
          if (m instanceof HTMLElement) m.style.display = 'none';
        });
      });

      await page.waitForTimeout(600);

      const shotPath = path.join(ARTIFACT_DIR, `${wp.name}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`📸 Captured: ${shotPath}`);

      telemetry.snapshots.push({
        waypoint: wp.name,
        targetZ: wp.z,
        label: wp.label,
        diagnostics: snapDiag
      });
    }

    // Save telemetry.json
    const telemetryPath = path.join(ARTIFACT_DIR, 'telemetry.json');
    fs.writeFileSync(telemetryPath, JSON.stringify(telemetry, null, 2));
    console.log(`Saved Telemetry: ${telemetryPath}`);

    console.log('🎉 Haunted Carnival Visual & Gameplay Verification Completed Successfully!');
  } catch (err) {
    console.error('Error during gameplay verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyHauntedCarnivalGameplay();
