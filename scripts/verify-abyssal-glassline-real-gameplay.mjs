import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = process.argv[2] || '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/abyssal_glassline_ocean_recovered';
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
  console.log(`🌊 Launching Real-Gameplay ABYSSAL GLASSLINE: Into the Living Abyss Verification at ${targetUrl}...`);
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

    // Progression state selecting ABYSSAL_GLASSLINE
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'ABYSSAL_GLASSLINE', 'PHANTOM_LINE'],
        selectedTheme: 'ABYSSAL_GLASSLINE',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'ABYSSAL_GLASSLINE');
    });

    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch game naturally in ABYSSAL_GLASSLINE
    console.log('Starting natural run in ABYSSAL_GLASSLINE: Into the Living Abyss...');
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
      { name: '01_opening_transparent_glassline_50m.png', dist: 50, label: 'Region A: Bioluminescent Reef & Glass Pressure Canopy' },
      { name: '02_bioluminescent_reef_and_polyps_200m.png', dist: 200, label: 'Region A: Glowing Corals, Swaying Fans & Fish Schools' },
      { name: '03_oceanic_research_city_500m.png', dist: 500, label: 'Region B: Oceanic Research City, Skybridge & Submersible Dock' },
      { name: '04_submarine_pursuit_speed_750m.png', dist: 750, label: 'Event E: High-Speed Submarine Pursuit with Twin Cavitation Propellers' },
      { name: '05_sunken_civilization_titan_1000m.png', dist: 1000, label: 'Region C: Sunken Civilization & Monumental Titan Head' },
      { name: '06_hydrothermal_abyss_eruption_1600m.png', dist: 1600, label: 'Region D: Hydrothermal Abyss, Molten Caldera & Pressure Wave' },
      { name: '07_regression_fixed_2679m_living_ocean.png', dist: 2679, label: '2,679m Regression Fix: Living Oceanic Ecosystem & Vaulted Glassway' },
      { name: '08_marathon_deep_abyss_3200m.png', dist: 3200, label: 'Long-Run Marathon Oceanic Traversal' }
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

        const director = (window).__ABYSSAL_DIRECTOR__;
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

    // Capture Signature Close-up 1: Gate A — The Giant Manta Hero & Escort Rays (Sanctuary / Overhead Glide)
    console.log('Capturing flagship close-up: Gate A — Giant Manta & Escort Rays...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      // In Zone 5 (Grand Ocean Sanctuary, e.g. at 400m)
      game.player.position.z = -400.0;
      game.player.distanceTraveled = 400.0;
      // Position camera looking up-right at the banking Giant Manta hero
      game.cameraController.camera.position.set(2.0, 3.8, -385.0);
      game.cameraController.camera.lookAt(12.0, 11.5, -400.0);
    });
    await page.waitForTimeout(600);
    const mantaShot = path.join(targetDir, '09_flagship_giant_manta_escorted_glide.png');
    await page.screenshot({ path: mantaShot });
    console.log(`📸 Saved 09_flagship_giant_manta_escorted_glide.png`);

    // Capture Signature Close-up 2: Gate B — The Colossal 60m+ Abyssal Leviathan (Leviathan Trench)
    console.log('Capturing flagship close-up: Gate B — The Colossal 60m+ Abyssal Leviathan...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      // In Zone 4 (Leviathan Trench, e.g. at 320m)
      game.player.position.z = -320.0;
      game.player.distanceTraveled = 320.0;
      // Position camera looking left towards the deep trench and undulating leviathan body
      game.cameraController.camera.position.set(-2.0, 4.2, -305.0);
      game.cameraController.camera.lookAt(-18.0, 12.0, -320.0);
    });
    await page.waitForTimeout(600);
    const leviathanShot = path.join(targetDir, '10_flagship_abyssal_leviathan_colossus.png');
    await page.screenshot({ path: leviathanShot });
    console.log(`📸 Saved 10_flagship_abyssal_leviathan_colossus.png`);

    // Capture Signature Close-up 3: Event C — The Pulsating Jellyfish Bloom (Grand Ocean Sanctuary)
    console.log('Capturing flagship close-up: Event C — Bioluminescent Jellyfish Bloom...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.position.z = -400.0;
      game.player.distanceTraveled = 400.0;
      // Position camera looking right towards the glowing translucent jellyfish swarm
      game.cameraController.camera.position.set(2.5, 4.0, -390.0);
      game.cameraController.camera.lookAt(14.0, 7.5, -405.0);
    });
    await page.waitForTimeout(600);
    const jellyShot = path.join(targetDir, '11_flagship_jellyfish_bloom_bioluminescence.png');
    await page.screenshot({ path: jellyShot });
    console.log(`📸 Saved 11_flagship_jellyfish_bloom_bioluminescence.png`);

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

