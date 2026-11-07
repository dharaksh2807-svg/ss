import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = process.argv[2] || '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/midnight_velvet_recovered';
const targetPort = process.env.PORT || '3000';
const targetUrl = process.env.GAME_URL || `http://localhost:${targetPort}`;

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function runGameplayVerification() {
  console.log(`🎮 Launching Real-Gameplay Midnight Velvet Verification at ${targetUrl}...`);
  console.log(`📁 Target artifact directory: ${targetDir}`);

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // Progression state pointing to MIDNIGHT_VELVET
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'MIDNIGHT_VELVET'],
        selectedTheme: 'MIDNIGHT_VELVET',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'MIDNIGHT_VELVET');
    });

    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch game in MIDNIGHT_VELVET
    console.log('Starting run in MIDNIGHT_VELVET...');
    await page.evaluate(() => {
      const playBtn = document.getElementById('start-play-btn');
      if (playBtn) playBtn.click();
      else if (window.__METRO_GAME__) window.__METRO_GAME__.startRun('NORMAL');

      const game = window.__METRO_GAME__;
      if (game) {
        game.soundManager.setMuted(true);
        // Player invulnerability for continuous uninterrupted multi-kilometer testing
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

    const testPoints = [
      { name: '01_ground_hotel_80m.png', dist: 80, desc: 'Hotel Le Velours Approach (80m)' },
      { name: '02_ground_boulevard_250m.png', dist: 250, desc: 'Velvet Boulevard Luxury Storefronts (250m)' },
      { name: '03_ground_marina_500m.png', dist: 500, desc: 'Velvet Marina Harbor & Superyachts (500m)' },
      { name: '04_ground_club_1000m.png', dist: 1000, desc: 'Golden Hour Club Rooftop Lounges (1000m)' },
      { name: '05_ground_regression_1939m.png', dist: 1939, desc: 'Anti-Repetition Checkpoint District Variation (1939m)' },
      { name: '06_ground_marathon_2500m.png', dist: 2500, desc: 'Deep Marathon Art Deco Skyline (2500m)' }
    ];

    const telemetryLog = [];

    for (const point of testPoints) {
      console.log(`Advancing gameplay to ${point.dist}m for ${point.name}...`);
      await page.waitForFunction((targetDist) => {
        const game = window.__METRO_GAME__;
        if (!game || !game.player) return false;
        game.player.speed = 140.0;
        return game.player.distanceTraveled >= targetDist;
      }, point.dist, { timeout: 90000 });

      // Stabilize position and camera for exact inspection
      const frameInfo = await page.evaluate((pt) => {
        const game = window.__METRO_GAME__;
        game.player.speed = 0.0;
        game.player.position.z = -pt.dist;
        game.player.distanceTraveled = pt.dist;
        game.player.isJetpackActive = false;
        game.player.position.y = 0.9;
        game.cameraController.camera.position.set(0, 4.2, -pt.dist + 7.5);
        game.cameraController.camera.lookAt(0, 2.2, -pt.dist - 25.0);

        const pZ = game.player.position.z;
        // Shift any blocking hazard out of direct frontal view
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

        const director = window.__MIDNIGHT_DIRECTOR__;

        return {
          dist: game.player.distanceTraveled,
          posZ: game.player.position.z,
          activeTheme: game.environmentDirector?.getActiveTheme()?.id,
          vipArrivals: director ? director.getVipArrivalCount() : 0,
          nightclubReveals: director ? director.getNightclubRevealCount() : 0,
          totalActiveElements: director ? director.getTotalActiveElements() : 0
        };
      }, point);

      // Brief settle time
      await page.waitForTimeout(400);

      const filePath = path.join(targetDir, point.name);
      await page.screenshot({ path: filePath });
      console.log(`📸 Saved ${point.name} at dist=${frameInfo.dist.toFixed(1)}m (activeTheme=${frameInfo.activeTheme}, VIP=${frameInfo.vipArrivals}, Club=${frameInfo.nightclubReveals}, elements=${frameInfo.totalActiveElements})`);
      telemetryLog.push({ ...point, ...frameInfo });
    }

    // Capture signature scene 1: VIP Red Carpet Arrival at Hotel Le Velours (Side +1, around Z = -44m)
    console.log('Capturing signature luxury animation 1: VIP Red-Carpet Arrival...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      // Position camera looking at Hotel Le Velours entrance on right side
      game.player.position.z = -44.0;
      game.player.distanceTraveled = 44.0;
      game.cameraController.camera.position.set(2.2, 2.4, -36.0);
      game.cameraController.camera.lookAt(8.5, 2.6, -44.0);

      // Clear any obstacle in front
      game.trackManager.chunks.forEach(c => {
        if (c.obstacles) {
          c.obstacles.forEach(obs => {
            if (obs && obs.group) {
              const obsWorldZ = c.chunkZ + obs.group.position.z;
              if (Math.abs(obsWorldZ - (-44.0)) < 25.0) {
                obs.group.position.x += 25.0;
              }
            }
          });
        }
      });
    });
    // Wait for animation frame to trigger paparazzi strobe / door opening
    await page.waitForTimeout(600);
    const vipArrivalPath = path.join(targetDir, '08_vip_red_carpet_arrival.png');
    await page.screenshot({ path: vipArrivalPath });
    console.log(`📸 Saved 08_vip_red_carpet_arrival.png`);

    // Capture signature scene 2: Grand Nightclub Reveal (Side -1, around Z = -44m)
    console.log('Capturing signature luxury animation 2: Grand Nightclub Reveal...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      // Position camera looking at Grand Nightclub entrance on left side
      game.player.position.z = -44.0;
      game.player.distanceTraveled = 44.0;
      game.cameraController.camera.position.set(-2.2, 2.4, -36.0);
      game.cameraController.camera.lookAt(-8.5, 2.6, -44.0);
    });
    await page.waitForTimeout(600);
    const clubRevealPath = path.join(targetDir, '09_grand_nightclub_reveal.png');
    await page.screenshot({ path: clubRevealPath });
    console.log(`📸 Saved 09_grand_nightclub_reveal.png`);

    // Capture defeated state camera
    console.log('Testing defeated state camera...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      if (game) {
        if (typeof game.handleGameOver === 'function') {
          game.handleGameOver('COLLISION');
        } else if (game.player && typeof game.player.die === 'function') {
          game.player.die('COLLISION');
        }
        if (game.cameraController && typeof game.cameraController.addTrauma === 'function') {
          game.cameraController.addTrauma(0.5);
        }
      }
    });
    await page.waitForTimeout(600);
    const defeatPath = path.join(targetDir, '07_defeated_state_camera.png');
    await page.screenshot({ path: defeatPath });
    console.log(`📸 Saved 07_defeated_state_camera.png`);

    fs.writeFileSync(path.join(targetDir, 'telemetry.json'), JSON.stringify(telemetryLog, null, 2));
    console.log('✅ Recovered gameplay capture completed successfully.');

  } catch (err) {
    console.error('❌ Error during gameplay verification:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runGameplayVerification();
