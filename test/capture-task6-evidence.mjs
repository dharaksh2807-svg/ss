import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/b3e653ae-0f2c-4503-a947-8d8985c89f1a';

async function runTask6Verification() {
  console.log('🚀 Starting Task 6 Playwright Benchmarks & Visual Verification...');

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
    });
  } catch (err) {
    browser = await chromium.launch({ headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2 // High-DPI screen
  });

  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  console.log('🌐 Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Helper to sample frames during gameplay and capture active sprint screenshot
  async function samplePresetPerformance(presetName, frameCount = 180, screenshotName = null) {
    console.log(`\n📊 Profiling Preset: ${presetName}...`);

    // 1. Setup run and warm up
    await page.evaluate(({ targetPreset }) => {
      const gm = window.__GRAPHICS_MANAGER__;
      const game = window.__METRO_GAME__;
      if (!gm || !game) throw new Error('Game or GraphicsManager not found');

      gm.setPreset(targetPreset);
      game.startRun('NORMAL', true);
      if (game.openingSequence && game.openingSequence.isActive()) {
        game.openingSequence.skip();
      }
      gm.setFpsDisplayEnabled(true);
    }, { targetPreset: presetName });

    // 2. Run 45 frames of active sprint down the tracks
    await page.evaluate(async () => {
      return new Promise(r => {
        let count = 0;
        function step() {
          count++;
          if (count < 45) requestAnimationFrame(step);
          else r();
        }
        requestAnimationFrame(step);
      });
    });

    // 3. Capture active running gameplay screenshot
    if (screenshotName) {
      await page.screenshot({ path: path.join(ARTIFACT_DIR, screenshotName) });
      console.log(`📸 Captured active gameplay: ${screenshotName}`);
    }

    // 4. Sample frames for performance metrics while elevating player above obstacles
    return await page.evaluate(async ({ targetPreset, maxFrames }) => {
      const gm = window.__GRAPHICS_MANAGER__;
      const game = window.__METRO_GAME__;
      const renderer = game.worldScene.renderer;
      const info = renderer.info;

      // Keep runner gliding safely above obstacles for smooth benchmark sampling
      game.player.position.y = 3.5;
      game.player.groundY = 3.5;

      const frameTimes = [];
      const drawCalls = [];
      const triangles = [];
      const heapSizes = [];

      let lastTime = performance.now();
      let frames = 0;

      return new Promise((resolve, reject) => {
        function sample() {
          try {
            const now = performance.now();
            const dt = now - lastTime;
            lastTime = now;

            if (frames > 10) { // warm up 10 frames
              frameTimes.push(dt);
              drawCalls.push(info.render.calls);
              triangles.push(info.render.triangles);
              if (performance.memory) {
                heapSizes.push(performance.memory.usedJSHeapSize);
              }
            }

            frames++;
            if (frames % 60 === 0) {
              console.log(`[Profiler ${targetPreset}] Frame ${frames}/${maxFrames}, dt: ${dt.toFixed(2)}ms, calls: ${info.render.calls}`);
            }

            if (frames < maxFrames) {
              requestAnimationFrame(sample);
            } else {
              frameTimes.sort((a, b) => a - b);
              const total = frameTimes.reduce((a, b) => a + b, 0);
              const meanDt = total / frameTimes.length;
              const p95Dt = frameTimes[Math.floor(frameTimes.length * 0.95)];
              const p99Dt = frameTimes[Math.floor(frameTimes.length * 0.99)];
              const meanCalls = drawCalls.reduce((a, b) => a + b, 0) / drawCalls.length;
              const meanTris = triangles.reduce((a, b) => a + b, 0) / triangles.length;

              const snapshot = gm.getSnapshot(renderer);
              const config = gm.getActiveConfig();

              resolve({
                preset: targetPreset,
                resolvedTier: snapshot.resolvedQuality,
                pixelRatio: snapshot.pixelRatio,
                effectiveResolution: `${renderer.domElement.width}x${renderer.domElement.height}`,
                shadowMapEnabled: config.shadowMapEnabled,
                shadowMapSize: config.shadowMapSize,
                sceneryDetail: config.sceneryDetail,
                particleMultiplier: config.particleMultiplier,
                meanDrawCalls: Math.round(meanCalls),
                maxDrawCalls: Math.max(...drawCalls),
                meanTriangles: Math.round(meanTris),
                maxTriangles: Math.max(...triangles),
                avgFps: parseFloat((1000 / meanDt).toFixed(1)),
                onePercentLowFps: parseFloat((1000 / p99Dt).toFixed(1)),
                meanFrameTimeMs: parseFloat(meanDt.toFixed(2)),
                p95FrameTimeMs: parseFloat(p95Dt.toFixed(2)),
                p99FrameTimeMs: parseFloat(p99Dt.toFixed(2)),
                geometries: info.memory.geometries,
                textures: info.memory.textures,
                heapMB: heapSizes.length > 0 ? parseFloat((heapSizes[heapSizes.length - 1] / (1024 * 1024)).toFixed(2)) : null
              });
            }
          } catch (err) {
            reject(err);
          }
        }
        requestAnimationFrame(sample);
      });
    }, { targetPreset: presetName, maxFrames: frameCount });
  }

  // 1. Profile HIGH
  const highResults = await samplePresetPerformance('HIGH', 150, 'task6_gameplay_high_quality.png');
  console.log('HIGH Results:', highResults);

  // 2. Profile MEDIUM
  const medResults = await samplePresetPerformance('MEDIUM', 150, 'task6_gameplay_medium_quality.png');
  console.log('MEDIUM Results:', medResults);

  // 3. Profile LOW
  const lowResults = await samplePresetPerformance('LOW', 150, 'task6_gameplay_low_quality.png');
  console.log('LOW Results:', lowResults);

  // 4. Test Live Mid-Run Switching without Reset
  console.log('\n🔄 Testing Live In-Flight Quality Switch during gameplay...');
  const switchTest = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const gm = window.__GRAPHICS_MANAGER__;

    // Start running on HIGH
    gm.setPreset('HIGH');
    game.startRun('NORMAL', true);
    if (game.openingSequence && game.openingSequence.isActive()) {
      game.openingSequence.skip();
    }
    // Protect runner during test so collision doesn't prematurely end test
    game.player.hasShield = true;
    game.player.shieldTimer = 999;
    game.player.position.y = 3.5;
    game.player.groundY = 3.5;

    // Let player run for 30 frames to accumulate score and distance
    await new Promise(r => {
      let count = 0;
      function step() {
        count++;
        if (count < 30) requestAnimationFrame(step);
        else r();
      }
      requestAnimationFrame(step);
    });

    const preSwitchScore = game.score;
    const preSwitchDistance = game.player.distanceTraveled;
    const preSwitchObstacles = game.trackManager.chunks.reduce((acc, c) => acc + (c.obstacles ? c.obstacles.length : 0), 0);
    const preSwitchActive = game.lifecycleState === 'PLAYING';
    const preSwitchPlayerPos = { x: game.player.position.x, y: game.player.position.y, z: game.player.position.z };

    // Switch to LOW mid-run!
    gm.setPreset('LOW');

    // Run another 30 frames on LOW quality
    await new Promise(r => {
      let count = 0;
      function step() {
        count++;
        if (count < 30) requestAnimationFrame(step);
        else r();
      }
      requestAnimationFrame(step);
    });

    const postSwitchScore = game.score;
    const postSwitchDistance = game.player.distanceTraveled;
    const postSwitchObstacles = game.trackManager.chunks.reduce((acc, c) => acc + (c.obstacles ? c.obstacles.length : 0), 0);
    const postSwitchActive = game.lifecycleState === 'PLAYING';

    return {
      preSwitchScore,
      preSwitchDistance: parseFloat(preSwitchDistance.toFixed(1)),
      preSwitchObstacles,
      preSwitchPlayerPos,
      postSwitchScore,
      postSwitchDistance: parseFloat(postSwitchDistance.toFixed(1)),
      postSwitchObstacles,
      postSwitchActive,
      runContinued: postSwitchScore >= preSwitchScore && postSwitchDistance > preSwitchDistance && postSwitchActive,
      activeTier: gm.getSnapshot().resolvedQuality
    };
  });
  console.log('Live Switch Result:', switchTest);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task6_live_switching_midgame.png') });
  console.log('📸 Captured task6_live_switching_midgame.png');

  // 5. Test Settings Modal UI & Gravitas Layout
  console.log('\n🎨 Opening Settings Modal to verify Gravitas UI...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.pause();
    const settingsBtn = document.getElementById('pause-settings-btn') || document.getElementById('start-settings-btn');
    if (settingsBtn) {
      settingsBtn.click();
    } else {
      const modal = document.getElementById('settings-modal');
      if (modal) modal.classList.remove('hidden');
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task6_settings_graphics_modal.png') });
  console.log('📸 Captured task6_settings_graphics_modal.png');

  // 6. Test Mobile Responsive Viewport (390x844 iPhone 14 Pro style)
  console.log('\n📱 Testing Mobile Viewport...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task6_mobile_settings.png') });
  console.log('📸 Captured task6_mobile_settings.png');

  // 7. Test Reload Persistence
  console.log('\n💾 Testing LocalStorage Reload Persistence...');
  await page.evaluate(() => {
    window.__GRAPHICS_MANAGER__.setPreset('LOW');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const reloadedPreset = await page.evaluate(() => {
    return {
      persistedInStorage: localStorage.getItem('metro_graphics_preset'),
      activePreset: window.__GRAPHICS_MANAGER__.getSnapshot().preset,
      resolvedTier: window.__GRAPHICS_MANAGER__.getSnapshot().resolvedQuality
    };
  });
  console.log('Reload Persistence:', reloadedPreset);

  const report = {
    testDate: new Date().toISOString(),
    hardware: 'Apple Silicon Mac (Chrome 128 / macOS Metal WebGL)',
    viewport: '1440x900 (DPR 2)',
    presets: {
      HIGH: highResults,
      MEDIUM: medResults,
      LOW: lowResults
    },
    liveSwitch: switchTest,
    persistence: reloadedPreset
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'task6_benchmark_data.json'),
    JSON.stringify(report, null, 2)
  );
  console.log('\n✅ Task 6 Benchmarks and Artifacts successfully written!');

  await browser.close();
}

runTask6Verification().catch(err => {
  console.error('Task 6 Verification failed:', err);
  process.exit(1);
});
