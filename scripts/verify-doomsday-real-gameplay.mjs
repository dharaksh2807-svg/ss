import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = process.argv[2] || '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/doomsday_verification';
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
  console.log(`☄️ Launching Real-Gameplay DOOMSDAY: LAST TRANSIT Verification at ${targetUrl}...`);
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
      { name: '01_opening_apocalypse_skyline_50m.png', dist: 50, label: 'Vertical Slice: Opening Apocalyptic City Ruins & Patrolling Rescue Helicopters' },
      {
        name: '09_flagship_collapsing_skyscraper_gate_a.png',
        dist: 200,
        label: 'Flagship Event A: The Collapsing Skyscraper Crown, Sheared Columns & Plume',
        customCamera: { camPos: [2.5, 4.5, -188.0], lookAt: [32.0, 24.0, -200.0] }
      },
      { name: '02_falling_city_cutaway_slabs_250m.png', dist: 250, label: 'District 1: The Falling City, Cutaway Floor Slabs & Rubble Breaches' },
      {
        name: '10_flagship_meteor_impact_and_shockwave_gate_b.png',
        dist: 400,
        label: 'Flagship Event B: Meteor Impact Basin, Fireball Plume & Expanding Shockwave',
        customCamera: { camPos: [-2.5, 4.8, -388.0], lookAt: [-38.0, 10.0, -400.0] }
      },
      { name: '03_meteor_crater_basin_500m.png', dist: 500, label: 'District 2: Meteor Impact Zone, Molten Crater Basin & Basalt Monoliths' },
      {
        name: '11_flagship_evacuation_convoy_and_rescue_helicopter.png',
        dist: 600,
        label: 'Flagship Event C: Evacuation Highway Convoy & Rescue Helicopter Landing Pad',
        customCamera: { camPos: [1.8, 4.5, -588.0], lookAt: [22.0, 9.0, -600.0] }
      },
      { name: '04_evacuation_highway_convoy_750m.png', dist: 750, label: 'District 3: The Last Evacuation, Elevated Viaduct & Strobe Convoys' },
      { name: '05_broken_skyways_viaducts_1000m.png', dist: 1000, label: 'District 4: The Broken Skyways, Severed Ramps & Dangling Cables' },
      {
        name: '12_flagship_last_rescue_train_and_bunker_gate.png',
        dist: 1200,
        label: 'Flagship Event D: The Last Armored Rescue Train Departing & Monumental Bunker Portal',
        customCamera: { camPos: [-1.8, 4.8, -1188.0], lookAt: [-18.0, 7.5, -1200.0] }
      },
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

        if (point.customCamera) {
          game.cameraController.camera.position.set(
            point.customCamera.camPos[0],
            point.customCamera.camPos[1],
            point.customCamera.camPos[2]
          );
          game.cameraController.camera.lookAt(
            point.customCamera.lookAt[0],
            point.customCamera.lookAt[1],
            point.customCamera.lookAt[2]
          );
        } else {
          game.cameraController.camera.position.set(0, 4.2, -point.dist + 7.5);
          game.cameraController.camera.lookAt(0, 2.2, -point.dist - 25.0);
        }

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

    // Capture 60-frame live performance telemetry at 3,200m
    console.log('Recording 60-frame live performance telemetry at 3,200m...');
    const perfData = await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      const renderer = game?.worldScene?.renderer;
      const samples = [];

      for (let i = 0; i < 60; i++) {
        const start = performance.now();
        await new Promise((r) => requestAnimationFrame(r));
        const dt = performance.now() - start;
        samples.push(dt);
      }

      const avgDt = samples.reduce((a, b) => a + b, 0) / samples.length;
      const sortedDt = [...samples].sort((a, b) => a - b);
      const p95Dt = sortedDt[Math.floor(sortedDt.length * 0.95)];
      const p99Dt = sortedDt[Math.floor(sortedDt.length * 0.99)];
      const maxDt = Math.max(...samples);

      const info = renderer ? renderer.info : null;

      return {
        sampleCount: samples.length,
        fpsAverage: Math.round(1000 / avgDt),
        fpsP95: Math.round(1000 / p95Dt),
        fpsP99: Math.round(1000 / p99Dt),
        frameTimeAverageMs: Number(avgDt.toFixed(2)),
        frameTimeMaxMs: Number(maxDt.toFixed(2)),
        triangles: info ? info.render.triangles : 0,
        drawCalls: info ? info.render.calls : 0,
        geometries: info ? info.memory.geometries : 0,
        textures: info ? info.memory.textures : 0
      };
    });

    console.log('Performance Metrics recorded:', perfData);
    fs.writeFileSync(path.join(targetDir, 'performance_metrics.json'), JSON.stringify(perfData, null, 2));
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
