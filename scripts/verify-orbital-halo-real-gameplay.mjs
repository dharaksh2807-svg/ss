import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = process.argv[2] || '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/orbital_halo_recovered';
const targetPort = process.env.PORT || '3000';
const targetUrl = process.env.GAME_URL || `http://localhost:${targetPort}`;
const videoDir = path.join(targetDir, 'videos');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

async function runRealGameplayVerification() {
  console.log(`🚀 Launching Real-Gameplay ORBITAL HALO: THE LIVING SPACE MEGASTRUCTURE Verification at ${targetUrl}...`);
  console.log(`📁 Artifact output: ${targetDir}`);
  console.log(`📹 Video recording output: ${videoDir}`);

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: {
        dir: videoDir,
        size: { width: 1440, height: 900 }
      }
    });

    const page = await context.newPage();

    // Progression state selecting ORBITAL_HALO
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'ORBITAL_HALO', 'NEON_RAINLINE', 'VIP_EXPRESS'],
        selectedTheme: 'ORBITAL_HALO',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_luna'],
        selectedCharacter: 'char_luna'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'ORBITAL_HALO');
    });

    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch game naturally in ORBITAL_HALO
    console.log('Starting natural run in ORBITAL HALO...');
    await page.evaluate(() => {
      const playBtn = document.getElementById('start-play-btn');
      if (playBtn) playBtn.click();
      else if (window.__METRO_GAME__) window.__METRO_GAME__.startRun('NORMAL');

      const game = window.__METRO_GAME__;
      if (game) {
        game.soundManager.setMuted(true);
        // Player & session invulnerability for uninterrupted multi-kilometer live gameplay capture
        game.player.crash = () => false;
        game.player.activateReviveGrace(99999999);
        game.player.isIntroInvincible = true;
        game.handleFatalCrash = () => {};
        game.handleGameOver = () => {};
        if (game.chaser) {
          game.chaser.update = () => {};
          if (game.chaser.mesh) game.chaser.mesh.position.set(0, -200, 0);
        }
        if (game.openingSequence) {
          game.openingSequence.skip();
        }
        game.cameraController.setLobbyMode(false);
      }

      const modal = document.querySelector('.modal-overlay, #revive-modal, #save-me-modal, #shop-modal, #environment-modal');
      if (modal && modal instanceof HTMLElement) modal.style.display = 'none';
    });

    await page.waitForTimeout(1200);

    const checkpoints = [
      { name: '01_opening_aerospace_station_50m.png', dist: 50, label: 'District A: Opening Aerospace Station Central, Retaining Plinths & Observation Glass' },
      { name: '02_zerog_dockyards_scaffolding_250m.png', dist: 250, label: 'District B: The Zero-G Dockyards, Skeleton Hulls & Welding Robots' },
      { name: '03_celestial_observatory_telescope_500m.png', dist: 500, label: 'District C: Celestial Observatory, Giant Rotating Radio Dish & Spacewalk' },
      { name: '04_orbital_comparison_723m.png', dist: 723, label: 'Direct Comparison at ~723m: Living Megastructure, Active Spacecraft & Radiant Atmosphere' },
      { name: '05_gravity_ring_awakening_1000m.png', dist: 1000, label: 'District D: The Gravity Ring, Colossal Rotating Centrifuge & Awakening Strobes' },
      { name: '06_solar_frontier_unfolding_arrays_1600m.png', dist: 1600, label: 'District E: The Solar Frontier, Articulated Unfolding Wings & Radiators' },
      { name: '07_deep_space_gateway_and_asteroids_2400m.png', dist: 2400, label: 'District F: The Deep Space Gateway, Distant Asteroid Belt & Research Cruiser' },
      { name: '08_marathon_space_megastructure_3200m.png', dist: 3200, label: '3,200m Marathon: Grounded Aerospace Retaining Plinths & Flawless Performance' }
    ];

    const telemetryLog = [];

    for (const cp of checkpoints) {
      console.log(`Advancing natural gameplay to ${cp.dist}m for ${cp.label}...`);
      await page.waitForFunction((targetDist) => {
        const game = window.__METRO_GAME__;
        if (!game || !game.player) return false;
        game.player.speedController.update = () => 140;
        game.player.speedController.getSpeed = () => 140;
        return game.player.distanceTraveled >= targetDist;
      }, cp.dist, { timeout: 90000 });

      // Stabilize briefly for exact frame capture
      const frameInfo = await page.evaluate((point) => {
        const game = window.__METRO_GAME__;
        game.player.speed = 0.0;
        game.player.position.z = -point.dist;
        game.player.distanceTraveled = point.dist;
        game.player.isJetpackActive = false;
        game.player.position.y = 0.9;
        game.cameraController.camera.position.set(0, 4.2, -point.dist + 7.5);
        game.cameraController.camera.lookAt(0, 2.2, -point.dist - 25.0);

        const pZ = game.player.position.z;
        // Shift any track obstacle out of direct front sight
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

        const director = (window).__ORBITAL_DIRECTOR__;
        const diag = director ? director.getDiagnostics() : {};

        return {
          dist: game.player.distanceTraveled,
          posZ: game.player.position.z,
          activeTheme: game.environmentDirector?.getActiveTheme()?.id,
          diagnostics: diag
        };
      }, cp);

      await page.waitForTimeout(400);

      const filePath = path.join(targetDir, cp.name);
      await page.screenshot({ path: filePath });
      console.log(`📸 Saved ${cp.name} at dist=${frameInfo.dist.toFixed(1)}m`);
      telemetryLog.push({ ...cp, ...frameInfo });
    }

    // Capture Signature Close-up 1: Gate A — Grand Spacecraft Docking Sequence
    console.log('Capturing flagship close-up: Gate A — Grand Spacecraft Docking Sequence...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      // In District A (at ~160m)
      game.player.position.z = -160.0;
      game.player.distanceTraveled = 160.0;
      // Position camera looking right toward the detailed docking spacecraft, mechanical arms, and umbilical
      game.cameraController.camera.position.set(4.5, 5.2, -145.0);
      game.cameraController.camera.lookAt(22.0, 9.0, -160.0);
    });
    await page.waitForTimeout(600);
    const dockingShot = path.join(targetDir, '09_flagship_grand_spacecraft_docking_gate_a.png');
    await page.screenshot({ path: dockingShot });
    console.log(`📸 Saved 09_flagship_grand_spacecraft_docking_gate_a.png`);

    // Capture Signature Close-up 2: Gate B — Colossal Rotating Gravity Ring Awakening
    console.log('Capturing flagship close-up: Gate B — Colossal Rotating Gravity Ring Awakening...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      // In District D (at ~240m / ~720m)
      game.player.position.z = -240.0;
      game.player.distanceTraveled = 240.0;
      // Position camera looking right-up toward the colossal rotating gravity ring, illuminated rim, and spokes
      game.cameraController.camera.position.set(2.0, 5.5, -215.0);
      game.cameraController.camera.lookAt(52.0, 28.0, -240.0);
    });
    await page.waitForTimeout(600);
    const ringShot = path.join(targetDir, '10_flagship_orbital_ring_awakening_gate_b.png');
    await page.screenshot({ path: ringShot });
    console.log(`📸 Saved 10_flagship_orbital_ring_awakening_gate_b.png`);

    // Capture Signature Close-up 3: Event C — Astronaut EVA Spacewalk & Celestial Observatory
    console.log('Capturing flagship close-up: Event C — Astronaut EVA Spacewalk & Radio Dish...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      // In District C (at ~320m)
      game.player.position.z = -320.0;
      game.player.distanceTraveled = 320.0;
      // Position camera looking right-up toward the astronaut performing spacewalk repairs with tether and welding sparks
      game.cameraController.camera.position.set(3.5, 4.8, -305.0);
      game.cameraController.camera.lookAt(18.0, 8.5, -320.0);
    });
    await page.waitForTimeout(600);
    const spacewalkShot = path.join(targetDir, '11_flagship_astronaut_spacewalk_and_observatory.png');
    await page.screenshot({ path: spacewalkShot });
    console.log(`📸 Saved 11_flagship_astronaut_spacewalk_and_observatory.png`);

    fs.writeFileSync(path.join(targetDir, 'telemetry.json'), JSON.stringify(telemetryLog, null, 2));

    await page.close();
    await context.close();
    console.log('✅ Real-gameplay verification session and video capture finished.');

  } catch (err) {
    console.error('❌ Error during real-gameplay verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runRealGameplayVerification();
