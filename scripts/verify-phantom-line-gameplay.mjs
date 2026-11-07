import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/phantom_line_evidence';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function verifyPhantomLineGameplay() {
  console.log('👻 Launching Headless Chrome for PHANTOM LINE Visual & Gameplay Verification...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // Pre-seed localStorage before page load so ProgressionManager and Game start in PHANTOM_LINE
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
          'HAUNTED_CARNIVAL',
          'VIP_EXPRESS',
          'MIDNIGHT_VELVET',
          'CHRONO_KINGDOM',
          'INFERNO_EXPRESS',
          'JURASSIC_RUSH'
        ],
        selectedTheme: 'PHANTOM_LINE',
        includePremiumThemesInDynamic: true
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'PHANTOM_LINE');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch run in PHANTOM_LINE
    console.log('Starting run in PHANTOM LINE: The Forgotten Railway...');
    await page.evaluate(() => {
      if (window.__DEV_SET_WORLD__) {
        window.__DEV_SET_WORLD__('PHANTOM_LINE');
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
      worldId: 'PHANTOM_LINE',
      snapshots: []
    };

    const targetWaypoints = [
      { name: '01_phantom_entrance_0m', z: -15, label: 'Region A: Abandoned Central Concourse & Gothic Arch' },
      { name: '02_phantom_infinite_tunnel_100m', z: -100, label: 'Region B: The Infinite Tunnel & Fluorescent Vaults' },
      { name: '03_phantom_watcher_platform_250m', z: -250, label: 'Vertical Slice B: The Watcher on Platform 9' },
      { name: '04_phantom_flooded_crypt_500m', z: -500, label: 'Region D: The Flooded Ghost Tunnels & Spectral Wisps' },
      { name: '05_phantom_forgotten_city_750m', z: -750, label: 'Region E: The Forgotten City Underground & Tenements' },
      { name: '06_phantom_last_train_terminus_1000m', z: -1000, label: 'Vertical Slice A: The Last Train & Siding Consist' },
      { name: '07_phantom_conductor_encounter_1600m', z: -1600, label: 'The Lost Conductor & Waiting Passenger Silhouette' },
      { name: '08_phantom_shadow_entity_2400m', z: -2400, label: 'High Catacomb Arch & Towering Shadow Specter' },
      { name: '09_phantom_impossible_clocks_3200m', z: -3200, label: 'Retrograde Station Clock & Distorted Time Vault' },
      { name: '10_phantom_extreme_marathon_4800m', z: -4800, label: '4.8km Subterranean Ghost Corridor & Spectral Fog' }
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
          const director = window.__PHANTOM_DIRECTOR__;
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

    console.log('🎉 Phantom Line Visual & Gameplay Verification Completed Successfully!');
  } catch (err) {
    console.error('Error during gameplay verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyPhantomLineGameplay();
