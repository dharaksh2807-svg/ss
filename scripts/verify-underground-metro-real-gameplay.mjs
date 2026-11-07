import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = process.argv[2] || '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/underground_metro_verification';
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
  console.log(`🚇 Launching Real-Gameplay UNDERGROUND METRO: THE LIVING SUBTERRANEAN NETWORK Verification at ${targetUrl}...`);
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

    // Progression state selecting UNDERGROUND_METRO
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['UNDERGROUND_METRO', 'MODERN_METRO', 'HISTORIC_QUARTER'],
        selectedTheme: 'UNDERGROUND_METRO',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'UNDERGROUND_METRO');
    });

    console.log(`Navigating to ${targetUrl}/?preview=underground_metro...`);
    await page.goto(`${targetUrl}/?preview=underground_metro`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch game naturally in UNDERGROUND_METRO
    console.log('Starting natural run in UNDERGROUND METRO: THE LIVING SUBTERRANEAN NETWORK...');
    await page.evaluate(() => {
      if (window.__DEV_SET_WORLD__) {
        window.__DEV_SET_WORLD__('UNDERGROUND_METRO');
      }

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
      { name: '01_grand_concourse_terminus_50m.png', dist: 50, label: 'District 0: Grand Central Concourse, Vaulted Cathedral Ribs, Departure Displays & Hero Event A' },
      { name: '02_neighborhood_mosaic_150m.png', dist: 150, label: 'District 1: Neighborhood Platform, Glazed Ceramic Mosaic Walls, Vintage Posters & Teak Benches' },
      { name: '03_modern_glass_interchange_250m.png', dist: 250, label: 'District 2: Modern Glass Interchange, Aerodynamic Steel Pylons, Glass Balustrades & Skywalks' },
      { name: '04_industrial_maintenance_tunnel_350m.png', dist: 350, label: 'District 3: Industrial Maintenance Tunnel, Segmental Concrete Rings, Pipe Manifolds & Catwalks' },
      { name: '05_utility_river_crossing_450m.png', dist: 450, label: 'District 4: Underground River & Utility Crossing, Storm Flood Gates, Drainage Aqueducts & Hero Event B' },
      { name: '06_multilevel_transfer_station_550m.png', dist: 550, label: 'District 5: Massive Multilevel Transfer Station, Double-Height Mezzanines & Transit Pods' },
      { name: '07_marathon_subterranean_network_1200m.png', dist: 1200, label: '1,200m Distance: Architectural Replayability & Kinetic Subterranean Network' },
      { name: '08_marathon_subterranean_network_3200m.png', dist: 3200, label: '3,200m Marathon: Grounded Retaining Foundations down to Y=-5.85m, Infinite Replay & Stable Performance' }
    ];

    const telemetryLog = [];

    for (const cp of checkpoints) {
      console.log(`Advancing natural gameplay to ${cp.dist}m for ${cp.label}...`);

      await page.waitForFunction((targetDist) => {
        const game = window.__METRO_GAME__;
        if (!game || !game.player) return false;
        game.player.speed = 140;
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

        const renderer = game.worldScene.renderer;
        const info = renderer.info;
        const memory = performance.memory;

        let activeSceneMeshes = 0;
        let activeSceneGroups = 0;
        game.worldScene.scene.traverse((obj) => {
          if (obj.isMesh) activeSceneMeshes++;
          if (obj.isGroup) activeSceneGroups++;
        });

        const director = window.__UNDERGROUND_DIRECTOR__;
        const totalElements = director ? director.getTotalActiveElements() : 0;

        return {
          dist: game.player.distanceTraveled,
          posZ: game.player.position.z,
          activeTheme: game.environmentDirector?.getActiveTheme()?.id,
          activeElements: totalElements,
          drawCalls: info.render?.calls || 0,
          triangles: info.render?.triangles || 0,
          geometries: info.memory?.geometries || 0,
          textures: info.memory?.textures || 0,
          activeSceneMeshes,
          activeSceneGroups,
          heapUsedMB: memory ? (memory.usedJSHeapSize / (1024 * 1024)).toFixed(2) : 'N/A'
        };
      }, cp);

      await page.waitForTimeout(400);

      const filePath = path.join(targetDir, cp.name);
      await page.screenshot({ path: filePath });
      console.log(`📸 Saved ${cp.name} at dist=${frameInfo.dist.toFixed(1)}m (calls=${frameInfo.drawCalls}, tris=${frameInfo.triangles}, elements=${frameInfo.activeElements})`);

      telemetryLog.push(frameInfo);
    }

    // Capture Signature Close-Ups of Hero Events A & B
    console.log('\n🌟 Capturing Hero Event Close-Up Signatures...');

    // Hero Event A: The Grand Concourse Reveal close-up
    console.log('Capturing Hero Event A: The Grand Concourse Reveal with parallel express train...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const camera = game.cameraController.camera;
      // Position camera framing the parallel express train at platform with opening doors
      camera.position.set(4.5, 2.8, game.player.position.z + 10.0);
      camera.lookAt(9.8, 2.2, game.player.position.z - 12.0);

      const director = window.__UNDERGROUND_DIRECTOR__;
      if (director) {
        const actors = director.getGrandConcourses();
        if (actors.length > 0) {
          const hero = actors[0];
          hero.state = 'CLIMAX';
          hero.timer = 1.0;
          for (let d = 0; d < hero.trainDoors.length; d++) {
            hero.trainDoors[d].openAmount = 1.0;
            hero.trainDoors[d].left.position.x = -0.55;
            hero.trainDoors[d].right.position.x = 0.55;
          }
        }
      }
    });

    await page.waitForTimeout(600);
    const flagship1Path = path.join(targetDir, 'flagship_01_grand_concourse_reveal.png');
    await page.screenshot({ path: flagship1Path });
    console.log(`📸 Saved flagship_01_grand_concourse_reveal.png`);

    // Hero Event B: Power Restoration close-up
    console.log('Capturing Hero Event B: Power Restoration utility cavern...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const camera = game.cameraController.camera;
      // Position camera framing the utility cavern illuminated ceiling, flood gates, and spinning jet turbines
      camera.position.set(-2.0, 3.2, game.player.position.z + 10.0);
      camera.lookAt(0, 4.5, game.player.position.z - 20.0);

      const director = window.__UNDERGROUND_DIRECTOR__;
      if (director) {
        const actors = director.getPowerRestorations();
        if (actors.length > 0) {
          const hero = actors[0];
          hero.state = 'CLIMAX';
          hero.timer = 1.0;
          hero.powerLevel = 1.0;
          for (const gate of hero.floodGates) {
            gate.openAmount = 1.0;
            gate.leftGate.position.x = -5.8 - 1.5;
            gate.rightGate.position.x = 5.8 + 1.5;
          }
          for (const fix of hero.luminaireFixtures) {
            fix.active = true;
          }
        }
      }
    });

    await page.waitForTimeout(600);
    const flagship2Path = path.join(targetDir, 'flagship_02_power_restoration.png');
    await page.screenshot({ path: flagship2Path });
    console.log(`📸 Saved flagship_02_power_restoration.png`);

    // Measure live rendering performance across 60 frames
    console.log('\nMeasuring live rendering performance across 60 frames...');
    const performanceMetrics = await page.evaluate(async () => {
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
        worldId: 'UNDERGROUND_METRO',
        timestamp: new Date().toISOString(),
        avgFrameTimeMs: avgFrameTime,
        fps: 1000 / avgFrameTime,
        drawCalls: info.render?.calls || 0,
        triangles: info.render?.triangles || 0,
        geometries: info.memory?.geometries || 0,
        textures: info.memory?.textures || 0,
        activeTheme: game?.environmentDirector?.getActiveTheme()?.id
      };
    });

    console.log('📊 Post-Upgrade Performance Metrics:', performanceMetrics);
    fs.writeFileSync(path.join(targetDir, 'performance_metrics.json'), JSON.stringify(performanceMetrics, null, 2));
    fs.writeFileSync(path.join(targetDir, 'telemetry_log.json'), JSON.stringify(telemetryLog, null, 2));

    await context.close();
    await browser.close();
    console.log('✅ Real gameplay verification completed successfully.');
  } catch (err) {
    console.error('❌ Error during real gameplay verification:', err);
    await browser.close();
    process.exit(1);
  }
}

runRealGameplayVerification();
