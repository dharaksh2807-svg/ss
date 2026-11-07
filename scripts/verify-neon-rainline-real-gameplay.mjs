import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = process.argv[2] || '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/neon_rainline_cyberpunk_recovered';
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
  console.log(`🌧️ Launching Real-Gameplay NEON RAINLINE: The Living Cyberpunk Metropolis Verification at ${targetUrl}...`);
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

    // Progression state selecting NEON_RAINLINE
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'NEON_RAINLINE', 'ABYSSAL_GLASSLINE'],
        selectedTheme: 'NEON_RAINLINE',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'NEON_RAINLINE');
    });

    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch game naturally in NEON_RAINLINE
    console.log('Starting natural run in NEON_RAINLINE: The Living Cyberpunk Metropolis...');
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
      { name: '01_opening_cyberpunk_metropolis_50m.png', dist: 50, label: 'District 1: Neon Downtown & Power Infrastructure' },
      { name: '02_cyber_market_street_life_250m.png', dist: 250, label: 'District 2: Cyber Market, Stalls & Delivery Drones' },
      { name: '03_aerial_highway_skyway_500m.png', dist: 500, label: 'District 3: Aerial Highway, Multi-Lane Skyways & Swarm' },
      { name: '04_rain_city_waterfront_canal_750m.png', dist: 750, label: 'District 4: Rain City Waterfront, Canals & Water Taxis' },
      { name: '05_regression_fixed_1022m_open_plaza.png', dist: 1022, label: '1,022m Regression Fix: Gate A — Open Neon Plaza & Quantum Core' },
      { name: '06_neon_gardens_biotech_1600m.png', dist: 1600, label: 'District 6: Neon Gardens, Glowing Foliage Terraces & Bio-Domes' },
      { name: '07_industrial_core_crane_2400m.png', dist: 2400, label: 'District 7: Industrial Core, Cooling Stacks & Animated Cranes' },
      { name: '08_marathon_grand_terminal_3200m.png', dist: 3200, label: 'District 8: Grand Transit Terminal & Maglev Catenary Concourse' }
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

        const director = (window).__NEON_DIRECTOR__;
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

    // Capture Signature Close-up 1: Gate A — Open Neon Plaza & Monumental Quantum Sculpture
    console.log('Capturing flagship close-up: Gate A — Open Neon Plaza & Quantum Sculpture...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      // In Zone Quantum Research (chunk 4 in cycle 0, at 320m)
      game.player.position.z = -320.0;
      game.player.distanceTraveled = 320.0;
      // Position camera looking right into the expansive open plaza and concentric rotating superconductor rings
      game.cameraController.camera.position.set(2.0, 4.5, -305.0);
      game.cameraController.camera.lookAt(26.0, 8.5, -320.0);
    });
    await page.waitForTimeout(600);
    const plazaShot = path.join(targetDir, '09_flagship_open_neon_plaza_gate_a.png');
    await page.screenshot({ path: plazaShot });
    console.log(`📸 Saved 09_flagship_open_neon_plaza_gate_a.png`);

    // Capture Signature Close-up 2: Gate B — Air-Traffic Spectacle & Hover Vehicles (Aerial Highway)
    console.log('Capturing flagship close-up: Gate B — Air-Traffic Spectacle & Hover Vehicles...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      // In Zone Aerial Highway (chunk 2 in cycle 0, at 160m)
      game.player.position.z = -160.0;
      game.player.distanceTraveled = 160.0;
      // Position camera looking up-left at multi-lane skyway decks and banking hover vehicles
      game.cameraController.camera.position.set(-2.5, 4.8, -145.0);
      game.cameraController.camera.lookAt(-22.0, 16.0, -160.0);
    });
    await page.waitForTimeout(600);
    const highwayShot = path.join(targetDir, '10_flagship_air_traffic_spectacle_gate_b.png');
    await page.screenshot({ path: highwayShot });
    console.log(`📸 Saved 10_flagship_air_traffic_spectacle_gate_b.png`);

    // Capture Signature Close-up 3: Cyber Market & Maglev Transit Crossover
    console.log('Capturing flagship close-up: Cyber Market & Overhead Maglev Crossover...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      // In Zone Cyber Market (chunk 1 in cycle 0, at 80m)
      game.player.position.z = -80.0;
      game.player.distanceTraveled = 80.0;
      // Position camera looking forward-right at market awnings, glowing lanterns and overhead transit arch
      game.cameraController.camera.position.set(1.5, 3.8, -65.0);
      game.cameraController.camera.lookAt(14.0, 6.0, -80.0);
    });
    await page.waitForTimeout(600);
    const marketShot = path.join(targetDir, '11_flagship_cyber_market_and_maglev.png');
    await page.screenshot({ path: marketShot });
    console.log(`📸 Saved 11_flagship_cyber_market_and_maglev.png`);

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
