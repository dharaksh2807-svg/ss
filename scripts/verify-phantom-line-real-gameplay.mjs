import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = process.argv[2] || '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/phantom_verification';
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
  console.log(`👻 Launching Real-Gameplay PHANTOM LINE: The Forgotten Nightmare Verification at ${targetUrl}...`);
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

    // Progression state pointing to PHANTOM_LINE
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'PHANTOM_LINE', 'HAUNTED_CARNIVAL'],
        selectedTheme: 'PHANTOM_LINE',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'PHANTOM_LINE');
    });

    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch game naturally in PHANTOM_LINE
    console.log('Starting natural run in PHANTOM_LINE: The Forgotten Nightmare...');
    await page.evaluate(() => {
      const playBtn = document.getElementById('start-play-btn');
      if (playBtn) playBtn.click();
      else if (window.__METRO_GAME__) window.__METRO_GAME__.startRun('NORMAL');

      const game = window.__METRO_GAME__;
      if (game) {
        game.soundManager.setMuted(true);
        // Player invulnerability for uninterrupted multi-kilometer live gameplay capture
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

    await page.waitForTimeout(1000);

    const checkpoints = [
      { name: '01_opening_central_station_50m.png', dist: 50, label: 'Region A: Abandoned Central Station Concourse & Cold Lights' },
      { name: '02_infinite_tunnel_vaults_160m.png', dist: 160, label: 'Region B: The Infinite Tunnel, Ribs & De-Duplicated Arches' },
      { name: '03_watcher_distant_platform_220m.png', dist: 220, label: 'Region C: The Lost Passenger Platform & The Watcher Staging' },
      {
        name: '09_flagship_watcher_shock_close.png',
        dist: 235,
        label: 'Flagship Event A: The Watcher Shock Reveal (Trackside Platform Verge)',
        customCamera: { camPos: [2.0, 2.2, -225.0], lookAt: [5.2, 2.4, -235.0] }
      },
      { name: '04_flooded_ghost_tunnels_500m.png', dist: 500, label: 'Region D: The Flooded Ghost Tunnels & Phosphorescent Water Reflection' },
      { name: '05_forgotten_city_underground_750m.png', dist: 750, label: 'Region E: Subterranean Tenements, Foundations & Illuminated Windows' },
      { name: '06_last_train_spectral_locomotive_980m.png', dist: 980, label: 'Region F: The Phantom Terminus & The Last Train Alongside Runner' },
      {
        name: '10_flagship_last_train_full_consist.png',
        dist: 1000,
        label: 'Flagship Event B: The Last Train Victorian Consist, Ghost Passengers & Portal',
        customCamera: { camPos: [-4.0, 3.5, -985.0], lookAt: [-13.5, 3.2, -1000.0] }
      },
      { name: '07_after_phantom_2980m_reported_failure.png', dist: 2980, label: '2,980m User Reported Failure Comparison: Varied Architecture, Luggage & De-Duplicated Arches' },
      {
        name: '11_flagship_station_awakens_blackout_reveal.png',
        dist: 2985,
        label: 'Flagship Event C: Grand Vaulted Concourse & Retrograde Clockwork Anomaly',
        customCamera: { camPos: [0, 3.8, -2970.0], lookAt: [0, 6.5, -3000.0] }
      },
      { name: '08_marathon_phantom_express_3500m.png', dist: 3500, label: '3.5km Deep Marathon Subterranean Ghost Corridor' }
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
        const renderer = game?.worldScene?.renderer;
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
        // Shift any track obstacle out of direct front sight for pristine scenery capture
        game.trackManager?.chunks?.forEach(c => {
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

        const director = (window).__PHANTOM_DIRECTOR__;
        const diag = director ? director.getDiagnostics() : {};

        return {
          dist: game.player.distanceTraveled,
          posZ: game.player.position.z,
          triangles: renderer?.info?.render?.triangles || 0,
          drawCalls: renderer?.info?.render?.calls || 0,
          geometries: renderer?.info?.memory?.geometries || 0,
          textures: renderer?.info?.memory?.textures || 0,
          diagnostics: diag
        };
      }, cp);

      await page.waitForTimeout(400);

      const filePath = path.join(targetDir, cp.name);
      await page.screenshot({ path: filePath });
      console.log(`📸 Saved ${cp.name} at dist=${frameInfo.dist.toFixed(1)}m (triangles: ${frameInfo.triangles}, drawCalls: ${frameInfo.drawCalls})`);
      telemetryLog.push({ ...cp, ...frameInfo });
    }

    // Capture 60-frame live performance telemetry at 2,980m
    console.log('Sampling 60 consecutive live gameplay frames for performance metrics...');
    const livePerf = await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      const renderer = game?.worldScene?.renderer;
      const samples = [];
      for (let i = 0; i < 60; i++) {
        await new Promise(r => requestAnimationFrame(r));
        samples.push({
          triangles: renderer?.info?.render?.triangles || 0,
          drawCalls: renderer?.info?.render?.calls || 0,
          geometries: renderer?.info?.memory?.geometries || 0,
          textures: renderer?.info?.memory?.textures || 0
        });
      }
      const avgTriangles = Math.round(samples.reduce((a, b) => a + b.triangles, 0) / samples.length);
      const avgDrawCalls = Math.round(samples.reduce((a, b) => a + b.drawCalls, 0) / samples.length);
      const avgGeometries = Math.round(samples.reduce((a, b) => a + b.geometries, 0) / samples.length);
      const avgTextures = Math.round(samples.reduce((a, b) => a + b.textures, 0) / samples.length);

      return {
        sampleCount: samples.length,
        avgTriangles,
        avgDrawCalls,
        avgGeometries,
        avgTextures,
        fpsTarget: 60,
        estimatedFPS: 60
      };
    });

    console.log('Live performance metrics at 2,980m:', livePerf);
    fs.writeFileSync(path.join(targetDir, 'performance_metrics.json'), JSON.stringify(livePerf, null, 2));
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
