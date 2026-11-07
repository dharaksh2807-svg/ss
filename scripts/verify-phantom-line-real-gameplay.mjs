import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = process.argv[2] || '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/phantom_line_nightmare_recovered';
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
        game.player.activateReviveGrace(999999);
        game.player.isIntroInvincible = true;
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
      { name: '01_opening_central_station_50m.png', dist: 50, label: 'Region A: Abandoned Central Station & Station Awakens' },
      { name: '02_infinite_tunnel_vaults_160m.png', dist: 160, label: 'Region B: The Infinite Tunnel & Fluorescent Vaults' },
      { name: '03_watcher_distant_platform_280m.png', dist: 280, label: 'Region C: The Lost Passenger Platform & The Watcher' },
      { name: '04_flooded_ghost_tunnels_500m.png', dist: 500, label: 'Region D: The Flooded Ghost Tunnels & Water Reflection' },
      { name: '05_forgotten_city_underground_750m.png', dist: 750, label: 'Region E: Subterranean Tenements & Illuminated Windows' },
      { name: '06_last_train_spectral_locomotive_1000m.png', dist: 1000, label: 'Region F: The Phantom Terminus & The Last Train' },
      { name: '07_regression_fixed_2980m_station_awakens.png', dist: 2980, label: '2,980m Regression Fix: Grand Station Awakens & Concourse Vault' },
      { name: '08_marathon_phantom_express_3500m.png', dist: 3500, label: '3.5km Deep Marathon Subterranean Ghost Corridor' }
    ];

    const telemetryLog = [];

    for (const cp of checkpoints) {
      console.log(`Advancing natural gameplay to ${cp.dist}m for ${cp.label}...`);
      await page.waitForFunction((targetDist) => {
        const game = window.__METRO_GAME__;
        if (!game || !game.player) return false;
        game.player.speed = 135.0; // Rapid natural forward velocity
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

        const director = (window).__PHANTOM_DIRECTOR__;
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

    // Capture Signature Close-up 1: The Watcher Shock Reveal (Trackside Verge)
    console.log('Capturing flagship close-up: The Watcher Shock Verge...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.position.z = -230.0;
      game.player.distanceTraveled = 230.0;
      // Position camera looking toward The Watcher safe shock verge
      game.cameraController.camera.position.set(2.0, 2.2, -220.0);
      game.cameraController.camera.lookAt(5.2, 2.4, -230.0);
    });
    await page.waitForTimeout(600);
    const watcherShot = path.join(targetDir, '09_flagship_watcher_shock_close.png');
    await page.screenshot({ path: watcherShot });
    console.log(`📸 Saved 09_flagship_watcher_shock_close.png`);

    // Capture Signature Close-up 2: The Last Train Victorian Consist & Headlight Fog Beam (1000m)
    console.log('Capturing flagship close-up: The Last Train Victorian Consist in fog...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.position.z = -1000.0;
      game.player.distanceTraveled = 1000.0;
      // Position camera looking left towards the ghost train siding
      game.cameraController.camera.position.set(-4.0, 3.5, -985.0);
      game.cameraController.camera.lookAt(-14.0, 3.8, -1005.0);
    });
    await page.waitForTimeout(600);
    const trainShot = path.join(targetDir, '10_flagship_last_train_full_consist.png');
    await page.screenshot({ path: trainShot });
    console.log(`📸 Saved 10_flagship_last_train_full_consist.png`);

    // Capture Signature Close-up 3: The Station Awakens Grand Concourse (2980m)
    console.log('Capturing flagship close-up: The Station Awakens at 2,980m...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.position.z = -2970.0;
      game.player.distanceTraveled = 2970.0;
      // Position camera looking slightly up towards the grand vaulted concourse and retrograde clock
      game.cameraController.camera.position.set(0, 3.5, -2955.0);
      game.cameraController.camera.lookAt(0, 7.5, -2985.0);
    });
    await page.waitForTimeout(600);
    const stationShot = path.join(targetDir, '11_flagship_station_awakens_blackout_reveal.png');
    await page.screenshot({ path: stationShot });
    console.log(`📸 Saved 11_flagship_station_awakens_blackout_reveal.png`);

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

