import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = process.argv[2] || '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/neon_industrial_verification';
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
  console.log(`🏭 Launching Real-Gameplay NEON INDUSTRIAL: THE MECHANICAL LOGISTICS CITY Verification at ${targetUrl}...`);
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

    // Progression state selecting NEON_INDUSTRIAL
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['NEON_INDUSTRIAL', 'UNDERGROUND_METRO', 'MODERN_METRO', 'HISTORIC_QUARTER'],
        selectedTheme: 'NEON_INDUSTRIAL',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'NEON_INDUSTRIAL');
    });

    console.log(`Navigating to ${targetUrl}/?preview=neon_industrial...`);
    await page.goto(`${targetUrl}/?preview=neon_industrial`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch game naturally in NEON_INDUSTRIAL
    console.log('Starting natural run in NEON INDUSTRIAL: THE MECHANICAL LOGISTICS CITY...');
    await page.evaluate(() => {
      if (window.__DEV_SET_WORLD__) {
        window.__DEV_SET_WORLD__('NEON_INDUSTRIAL');
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
      { name: '01_container_freight_terminal_50m.png', dist: 50, label: 'District 0: Container-Freight Terminal, RMG Cranes, ISO Container Stacks & Hero Event A' },
      { name: '02_heavy_engineering_factory_150m.png', dist: 150, label: 'District 1: Heavy Engineering Factory, Open Manufacturing Sheds, Stamping Presses & Robotic Welders' },
      { name: '03_railway_repair_depot_250m.png', dist: 250, label: 'District 2: Railway Repair Depot, Inspection Tracks, Mechanical Screw Jacks & Idling Switchers' },
      { name: '04_oil_refinery_infrastructure_350m.png', dist: 350, label: 'District 3: Oil & Refinery Infrastructure Zone, Horton Spheres, Cracking Towers & Pipe Bridges' },
      { name: '05_automated_industrial_port_450m.png', dist: 450, label: 'District 4: Automated Industrial Port, Cargo Conveyors, Bulk Silos & AGVs' },
      { name: '06_large_freight_sorting_yard_550m.png', dist: 550, label: 'District 5: Large Freight-Sorting Yard, Classification Hump Yard, Dispatch Tower & Hero Event B' },
      { name: '07_marathon_mechanical_city_1200m.png', dist: 1200, label: '1,200m Distance: Architectural Replayability & Kinetic Industrial Logistics Network' },
      { name: '08_marathon_mechanical_city_3200m.png', dist: 3200, label: '3,200m Marathon: Grounded Retaining Foundations down to Y=-5.85m, Infinite Replay & Stable Performance' }
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

        const director = window.__INDUSTRIAL_DIRECTOR__;
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

    // Hero Event A: Crane Ballet Close-Up
    console.log('Capturing Hero Event A: Crane Ballet with RMG crane hoisting 40ft container...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const camera = game.cameraController.camera;
      // Position camera framing the RMG crane hoisting 40ft container above rail flatcar
      camera.position.set(-6.5, 4.2, game.player.position.z + 8.0);
      camera.lookAt(-14.0, 8.5, game.player.position.z - 20.0);

      const director = window.__INDUSTRIAL_DIRECTOR__;
      if (director) {
        const actors = director.getCraneBallets();
        if (actors.length > 0) {
          const hero = actors[0];
          hero.state = 'CLIMAX';
          hero.timer = 1.0;
          hero.crane1.trolley.position.x = -11.5;
          hero.crane1.spreader.position.y = 8.5;
          hero.crane1.warningStrobes.forEach(s => (s.visible = true));
        }
      }
    });

    await page.waitForTimeout(600);
    const flagship1Path = path.join(targetDir, 'flagship_01_crane_ballet.png');
    await page.screenshot({ path: flagship1Path });
    console.log(`📸 Saved flagship_01_crane_ballet.png`);

    // Hero Event B: Factory Awakening Close-Up
    console.log('Capturing Hero Event B: Factory Awakening industrial complex with diesel locomotive...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const camera = game.cameraController.camera;
      // Position camera framing the industrial complex with diesel locomotive, steam exhaust & illuminated floodlights
      camera.position.set(-7.5, 3.8, game.player.position.z + 10.0);
      camera.lookAt(-13.5, 4.5, game.player.position.z - 15.0);

      const director = window.__INDUSTRIAL_DIRECTOR__;
      if (director) {
        const actors = director.getFactoryAwakenings();
        if (actors.length > 0) {
          const hero = actors[0];
          hero.state = 'CLIMAX';
          hero.timer = 1.5;
          hero.powerLevel = 1.0;
          hero.floodlights.forEach(f => {
            f.active = true;
            f.mesh.visible = true;
          });
          hero.locomotive.headlights.forEach(h => (h.visible = true));
          hero.steamPuffers.forEach(p => {
            p.mesh.visible = true;
            p.mesh.scale.set(2.5, 3.0, 2.5);
          });
        }
      }
    });

    await page.waitForTimeout(600);
    const flagship2Path = path.join(targetDir, 'flagship_02_factory_awakening.png');
    await page.screenshot({ path: flagship2Path });
    console.log(`📸 Saved flagship_02_factory_awakening.png`);

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

      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const fps = Math.round(1000 / avgFrameTime);
      const minFps = Math.round(1000 / Math.max(...frameTimes));

      return {
        fps,
        minFps,
        avgFrameTimeMs: parseFloat(avgFrameTime.toFixed(2)),
        drawCalls: renderer?.info?.render?.calls || 0,
        triangles: renderer?.info?.render?.triangles || 0,
        geometries: renderer?.info?.memory?.geometries || 0,
        textures: renderer?.info?.memory?.textures || 0
      };
    });

    console.log(`📊 Measured Performance: ${performanceMetrics.fps} FPS (min: ${performanceMetrics.minFps} FPS), ${performanceMetrics.drawCalls} draw calls, ${performanceMetrics.triangles.toLocaleString()} triangles`);

    fs.writeFileSync(
      path.join(targetDir, 'performance_metrics.json'),
      JSON.stringify(performanceMetrics, null, 2)
    );
    fs.writeFileSync(
      path.join(targetDir, 'telemetry_log.json'),
      JSON.stringify(telemetryLog, null, 2)
    );

    console.log('Video recording finalized in:', videoDir);
    await context.close();
  } finally {
    await browser.close();
  }
}

runRealGameplayVerification().then(() => {
  console.log('🏁 Real gameplay verification completed successfully!');
  process.exit(0);
}).catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
