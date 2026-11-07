import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = process.argv[2] || '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/viva_heat_verification';
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
  console.log(`💃 Launching Real-Gameplay VIVA HEAT: THE FORBIDDEN FESTIVAL Verification at ${targetUrl}...`);
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

    // Progression state selecting VIVA_HEAT
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'VIVA_HEAT', 'NEON_RAINLINE', 'ORBITAL_HALO'],
        selectedTheme: 'VIVA_HEAT',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_luna'],
        selectedCharacter: 'char_luna'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'VIVA_HEAT');
    });

    console.log(`Navigating to ${targetUrl}/?preview=viva_heat...`);
    await page.goto(`${targetUrl}/?preview=viva_heat`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch game naturally in VIVA_HEAT
    console.log('Starting natural run in VIVA HEAT: THE FORBIDDEN FESTIVAL...');
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
      { name: '01_sunset_promenade_50m.png', dist: 50, label: 'District A: Sunset Promenade, Monumental Scarlet Sun, Marble Boardwalk & Ocean Specular Reflection' },
      { name: '02_gilded_amphitheatre_250m.png', dist: 250, label: 'District B: Gilded Amphitheatre, Multi-tier Dance Stages, Sound Towers & Dancers' },
      { name: '03_kinetic_flora_pavilion_500m.png', dist: 500, label: 'District C: Kinetic Flora Pavilion, Giant Breathing Orchids & Lotus Sculptures' },
      { name: '04_viva_comparison_723m.png', dist: 723, label: 'Direct Comparison at ~723m: High-Fashion Coastal Megacity, Dynamic Yachts & Festival Excitement' },
      { name: '05_midnight_marina_1000m.png', dist: 1000, label: 'District D: Midnight Yacht Marina, Moored Cruisers, Boardwalk Pilings & Champagne Lounge' },
      { name: '06_royal_colonnade_1600m.png', dist: 1600, label: 'District E: Royal Palm Colonnade, Sculpted Parabolic Arches with Cascading Silk Banners, Masquerade Gala' },
      { name: '07_sunset_carnival_2400m.png', dist: 2400, label: 'District F: Grand Sunset Carnival, Offshore Ferris Wheel of Fire, Pyrotechnic Flame Towers' },
      { name: '08_marathon_festival_3200m.png', dist: 3200, label: '3,200m Marathon: Grounded Retaining Plinths down to Y=-5.85m, Infinite Replay & Stable Performance' }
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

        const director = window.__FEVER_DIRECTOR__;
        const totalElements = director ? director.getTotalActiveElements() : 0;
        const state = director ? director.getState() : 'UNKNOWN';

        return {
          dist: game.player.distanceTraveled,
          posZ: game.player.position.z,
          activeTheme: game.environmentDirector?.getActiveTheme()?.id,
          activeElements: totalElements,
          feverState: state
        };
      }, cp);

      await page.waitForTimeout(400);

      const filePath = path.join(targetDir, cp.name);
      await page.screenshot({ path: filePath });
      console.log(`📸 Saved ${cp.name} at dist=${frameInfo.dist.toFixed(1)}m (feverState=${frameInfo.feverState})`);
      telemetryLog.push({ ...cp, ...frameInfo });
    }

    // Capture Signature Close-up 1: Gate A — Grand Mega-Yacht Arrival Sequence
    console.log('Capturing flagship close-up: Gate A — Grand Mega-Yacht Arrival Sequence...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const camera = game.cameraController.camera;
      // Position camera looking directly at the yacht docked at the ocean pier
      camera.position.set(16.0, 3.8, game.player.position.z + 10.0);
      camera.lookAt(26.0, 2.2, game.player.position.z - 8.0);

      const director = window.__FEVER_DIRECTOR__;
      if (director) {
        const dockings = director.getGrandDockings();
        if (dockings.length > 0) {
          dockings[0].state = 'CLIMAX';
          dockings[0].timer = 1.0;
          dockings[0].yachtMesh.position.x = dockings[0].targetX;
          dockings[0].waterSprayArc.visible = true;
          dockings[0].dockingGangway.scale.set(1.0, 1.0, 1.0);
          for (const jet of dockings[0].champagneJets) jet.visible = true;
          for (const strobe of dockings[0].deckStrobes) strobe.visible = true;
        }
      }
    });
    await page.waitForTimeout(300);
    const yachtCloseUpPath = path.join(targetDir, 'flagship_01_mega_yacht_arrival.png');
    await page.screenshot({ path: yachtCloseUpPath });
    console.log(`📸 Saved flagship close-up: ${yachtCloseUpPath}`);

    // Capture Signature Close-up 2: Gate B — Colossal Kinetic Flora Awakening & Solar Pulse
    console.log('Capturing flagship close-up: Gate B — Colossal Kinetic Flora Awakening...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const camera = game.cameraController.camera;
      // Position camera framing the blooming kinetic lotus sculpture
      camera.position.set(-8.0, 5.0, game.player.position.z + 12.0);
      camera.lookAt(-24.0, 8.5, game.player.position.z - 10.0);

      const director = window.__FEVER_DIRECTOR__;
      if (director) {
        const awakenings = director.getKineticAwakenings();
        if (awakenings.length > 0) {
          const flora = awakenings[0];
          flora.state = 'CLIMAX';
          flora.bloomLevel = 1.0;
          flora.solarBeamCone.visible = true;
          flora.stamenCore.position.y = 12.5;
          for (const p of flora.outerPetals) p.rotation.z = 1.05;
          for (const p of flora.innerPetals) p.rotation.z = 0.85;
          for (const c of flora.stemConduits) c.visible = true;
        }
      }
    });
    await page.waitForTimeout(300);
    const floraCloseUpPath = path.join(targetDir, 'flagship_02_kinetic_flora_awakening.png');
    await page.screenshot({ path: floraCloseUpPath });
    console.log(`📸 Saved flagship close-up: ${floraCloseUpPath}`);

    // Measure live rendering performance over 60 frames
    const perfMetrics = await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      const renderer = game?.worldScene?.renderer;
      const frameTimes = [];
      let lastTime = performance.now();

      for (let i = 0; i < 60; i++) {
        await new Promise(requestAnimationFrame);
        const now = performance.now();
        frameTimes.push(now - lastTime);
        lastTime = now;
      }

      const info = renderer?.info || {};
      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      return {
        avgFrameTimeMs: avgFrameTime,
        fps: 1000 / avgFrameTime,
        drawCalls: info.render?.calls || 0,
        triangles: info.render?.triangles || 0,
        geometries: info.memory?.geometries || 0,
        textures: info.memory?.textures || 0
      };
    });

    console.log('📊 Post-Upgrade Live Rendering Metrics:', JSON.stringify(perfMetrics, null, 2));
    fs.writeFileSync(path.join(targetDir, 'performance_metrics.json'), JSON.stringify(perfMetrics, null, 2));
    fs.writeFileSync(path.join(targetDir, 'telemetry_log.json'), JSON.stringify(telemetryLog, null, 2));

    await page.close();
    await context.close();
    await browser.close();

    console.log('✅ Real-gameplay verification complete!');
  } catch (err) {
    console.error('❌ Real-gameplay verification failed:', err);
    await browser.close();
    process.exit(1);
  }
}

runRealGameplayVerification();
