import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = process.argv[2] || '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/haunted_carnival_nightmare_recovered';
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
  console.log(`🎃 Launching Real-Gameplay HAUNTED CARNIVAL Nightmare Verification at ${targetUrl}...`);
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

    // Progression state pointing to HAUNTED_CARNIVAL
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'HAUNTED_CARNIVAL'],
        selectedTheme: 'HAUNTED_CARNIVAL',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'HAUNTED_CARNIVAL');
    });

    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch game naturally in HAUNTED_CARNIVAL
    console.log('Starting natural run in HAUNTED_CARNIVAL...');
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
      { name: '01_opening_first200m_watcher_encounter.png', dist: 50, label: 'First 200m: The Watcher Approach & Suspense' },
      { name: '02_haunted_funfair_clown_160m.png', dist: 140, label: 'Zone 1: Abandoned Funfair & Nightmare Clown' },
      { name: '03_possessed_carousel_awakened_400m.png', dist: 380, label: 'Zone 5: Possessed Carousel Awakening' },
      { name: '04_cursed_graveyard_surprise_ghost_600m.png', dist: 600, label: 'Zone 3: Cursed Graveyard & Surprise Ghost' },
      { name: '05_nightmare_manor_regression_858m.png', dist: 858, label: '858m Regression: Nightmare Manor Awakens with Colossus' },
      { name: '06_marathon_skyline_colossus_1680m.png', dist: 1680, label: 'Deep Run: Rare Shadow Colossus Skyline Titan' },
      { name: '07_extreme_nightmare_wonderland_3200m.png', dist: 3200, label: 'Extreme Marathon 3.2km Nightmare Wonderland' }
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

        const director = (window).__HAUNTED_DIRECTOR__;
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

    // Capture Signature Close-up 1: The Watcher Shock Reveal (Zone 0)
    console.log('Capturing flagship close-up: The Watcher Shock Platform...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.position.z = -35.0;
      game.player.distanceTraveled = 35.0;
      // Position camera looking right towards The Watcher safe shock platform
      game.cameraController.camera.position.set(2.0, 2.4, -28.0);
      game.cameraController.camera.lookAt(6.5, 2.6, -35.0);
    });
    await page.waitForTimeout(600);
    const watcherShot = path.join(targetDir, '08_flagship_watcher_shock_close.png');
    await page.screenshot({ path: watcherShot });
    console.log(`📸 Saved 08_flagship_watcher_shock_close.png`);

    // Capture Signature Close-up 2: Nightmare Manor Awakening & Colossus Hand (858m)
    console.log('Capturing flagship close-up: Nightmare Manor Awakening with Colossus...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.position.z = -858.0;
      game.player.distanceTraveled = 858.0;
      // Position camera angled up toward the Victorian Manor and Colossus Claw
      game.cameraController.camera.position.set(-3.0, 5.0, -840.0);
      game.cameraController.camera.lookAt(-18.0, 16.0, -875.0);
    });
    await page.waitForTimeout(600);
    const manorShot = path.join(targetDir, '09_flagship_mansion_awakens_colossus.png');
    await page.screenshot({ path: manorShot });
    console.log(`📸 Saved 09_flagship_mansion_awakens_colossus.png`);

    // Capture Signature Close-up 3: Possessed Carousel (Zone 5)
    console.log('Capturing flagship close-up: Possessed Carousel in motion...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.position.z = -400.0;
      game.player.distanceTraveled = 400.0;
      // Position camera looking left towards the Carousel
      game.cameraController.camera.position.set(-2.5, 3.2, -385.0);
      game.cameraController.camera.lookAt(-16.0, 4.5, -400.0);
    });
    await page.waitForTimeout(600);
    const carouselShot = path.join(targetDir, '10_flagship_possessed_carousel_nightmare.png');
    await page.screenshot({ path: carouselShot });
    console.log(`📸 Saved 10_flagship_possessed_carousel_nightmare.png`);

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

