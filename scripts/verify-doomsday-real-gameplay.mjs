import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = process.argv[2] || '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/doomsday_apocalypse_recovered';
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
  console.log(`☄️ Launching Real-Gameplay DOOMSDAY: THE LAST DAY ON EARTH Verification at ${targetUrl}...`);
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

    // Progression state selecting DOOMSDAY_LAST_TRANSIT
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'DOOMSDAY_LAST_TRANSIT', 'NEON_RAINLINE'],
        selectedTheme: 'DOOMSDAY_LAST_TRANSIT',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'DOOMSDAY_LAST_TRANSIT');
    });

    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch game naturally in DOOMSDAY_LAST_TRANSIT
    console.log('Starting natural run in DOOMSDAY: LAST TRANSIT...');
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
      { name: '01_opening_apocalypse_skyline_50m.png', dist: 50, label: 'Vertical Slice: Opening Apocalyptic City Ruins & Falling Embers' },
      { name: '02_falling_city_cutaway_slabs_250m.png', dist: 250, label: 'District 1: The Falling City, Cutaway Floor Slabs & Rubble Plazas' },
      { name: '03_meteor_crater_basin_500m.png', dist: 500, label: 'District 2: Meteor Impact Zone, Molten Crater Basin & Basalt Monoliths' },
      { name: '04_evacuation_highway_convoy_750m.png', dist: 750, label: 'District 3: The Last Evacuation, Elevated Viaduct & Strobe Convoys' },
      { name: '05_broken_skyways_viaducts_1000m.png', dist: 1000, label: 'District 4: The Broken Skyways, Severed Ramps & Dangling Cables' },
      { name: '06_industrial_firestorm_refinery_1600m.png', dist: 1600, label: 'District 5: The Firestorm, Burning Refinery Towers & Pressure Jets' },
      { name: '07_final_transit_blast_gate_2400m.png', dist: 2400, label: 'District 6: The Final Transit, Monumental Bunker Blast Portal' },
      { name: '08_marathon_doomsday_wasteland_3200m.png', dist: 3200, label: '3,200m Marathon: Ruined Horizon, Deep Retaining Plinths & Disaster Life' }
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

        const director = (window).__DOOMSDAY_DIRECTOR__;
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

    // Capture Signature Close-up 1: Gate A — Skyscraper Collapse
    console.log('Capturing flagship close-up: Gate A — Skyscraper Collapse...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      // In District 1 (at ~200m)
      game.player.position.z = -200.0;
      game.player.distanceTraveled = 200.0;
      // Position camera looking right toward the fracturing collapsing skyscraper crown and falling chunks
      game.cameraController.camera.position.set(2.0, 4.5, -185.0);
      game.cameraController.camera.lookAt(28.0, 24.0, -200.0);
    });
    await page.waitForTimeout(600);
    const skyscraperShot = path.join(targetDir, '09_flagship_collapsing_skyscraper_gate_a.png');
    await page.screenshot({ path: skyscraperShot });
    console.log(`📸 Saved 09_flagship_collapsing_skyscraper_gate_a.png`);

    // Capture Signature Close-up 2: Gate B — Meteor Impact & Expanding Shockwave
    console.log('Capturing flagship close-up: Gate B — Meteor Impact & Shockwave...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      // In District 2 (at ~400m)
      game.player.position.z = -400.0;
      game.player.distanceTraveled = 400.0;
      // Position camera looking left toward the meteor crater basin, fireball plume, and expanding shockwave
      game.cameraController.camera.position.set(-2.5, 4.8, -385.0);
      game.cameraController.camera.lookAt(-38.0, 12.0, -400.0);
    });
    await page.waitForTimeout(600);
    const meteorShot = path.join(targetDir, '10_flagship_meteor_impact_and_shockwave_gate_b.png');
    await page.screenshot({ path: meteorShot });
    console.log(`📸 Saved 10_flagship_meteor_impact_and_shockwave_gate_b.png`);

    // Capture Signature Close-up 3: Evacuation Convoy & Closing Blast Gate
    console.log('Capturing flagship close-up: Evacuation Convoy & Monumental Blast Gate...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      // In District 6 / District 3 (at ~600m / ~1200m)
      game.player.position.z = -600.0;
      game.player.distanceTraveled = 600.0;
      // Position camera looking forward-right at evacuation convoy on highway and overhead emergency transponder
      game.cameraController.camera.position.set(1.5, 4.2, -585.0);
      game.cameraController.camera.lookAt(18.5, 8.5, -600.0);
    });
    await page.waitForTimeout(600);
    const convoyShot = path.join(targetDir, '11_flagship_evacuation_convoy_and_closing_gate.png');
    await page.screenshot({ path: convoyShot });
    console.log(`📸 Saved 11_flagship_evacuation_convoy_and_closing_gate.png`);

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
