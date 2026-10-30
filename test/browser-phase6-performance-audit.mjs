import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve(process.cwd(), 'artifacts');
const BRAIN_ARTIFACTS_DIR = '/Users/dharaksh/.gemini/antigravity/brain/8b70b6a8-e6e7-431c-b23c-023a1c122eff';

if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
if (!fs.existsSync(BRAIN_ARTIFACTS_DIR)) fs.mkdirSync(BRAIN_ARTIFACTS_DIR, { recursive: true });

async function saveScreenshot(page, filename) {
  const localPath = path.join(ARTIFACTS_DIR, filename);
  const brainPath = path.join(BRAIN_ARTIFACTS_DIR, filename);
  await page.screenshot({ path: localPath });
  fs.copyFileSync(localPath, brainPath);
  console.log(`📸 Saved screenshot: ${filename}`);
}

async function run() {
  console.log('🚀 Launching Phase 6 Final Performance, Rendering & Browser Compatibility Auditor...');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--mute-audio']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out headless Chrome audio device hardware warnings
      if (text.includes('AudioContext')) return;
      console.error('Browser Error:', text);
      consoleErrors.push(text);
    }
  });

  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => window.__METRO_GAME__ !== undefined);

  // =========================================================================
  // 1. Continuous Gameplay Performance Sampling (300 Frames / ~5-6 seconds)
  // =========================================================================
  console.log('\n📊 Sampling Real-Time Render Telemetry & Frame Pacing...');

  const perfTelemetry = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL');
    game.getOpeningSequence().skip();

    const player = game.getPlayer();
    player.speed = 24.0;

    const frameTimes = [];
    const drawCallsList = [];
    const trianglesList = [];
    let prev = performance.now();

    for (let i = 0; i < 300; i++) {
      await new Promise(r => requestAnimationFrame(r));
      const now = performance.now();
      const dt = now - prev;
      prev = now;
      if (i > 10) { // Ignore warm-up frames
        frameTimes.push(dt);
        const metrics = game.getPerformanceMetrics();
        drawCallsList.push(metrics.drawCalls);
        trianglesList.push(metrics.triangles);
      }
    }

    frameTimes.sort((a, b) => a - b);
    const meanDt = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const p50 = frameTimes[Math.floor(frameTimes.length * 0.50)];
    const p95 = frameTimes[Math.floor(frameTimes.length * 0.95)];
    const p99 = frameTimes[Math.floor(frameTimes.length * 0.99)];
    const maxDt = frameTimes[frameTimes.length - 1];

    const avgDrawCalls = Math.round(drawCallsList.reduce((a, b) => a + b, 0) / drawCallsList.length);
    const avgTriangles = Math.round(trianglesList.reduce((a, b) => a + b, 0) / trianglesList.length);

    const metrics = game.getPerformanceMetrics();
    const sceneChildrenCount = game.worldScene.scene.children.length;

    return {
      fps: Math.round(1000 / meanDt),
      meanFrameTimeMs: Number(meanDt.toFixed(2)),
      p50Ms: Number(p50.toFixed(2)),
      p95Ms: Number(p95.toFixed(2)),
      p99Ms: Number(p99.toFixed(2)),
      maxFrameTimeMs: Number(maxDt.toFixed(2)),
      avgDrawCalls,
      avgTriangles,
      geometries: metrics.geometries,
      textures: metrics.textures,
      shaderPrograms: metrics.shaderPrograms,
      sceneChildrenCount
    };
  });

  console.log('📈 Performance Telemetry Result:', JSON.stringify(perfTelemetry, null, 2));

  // =========================================================================
  // 2. Resource Growth & Object Pooling Invariance (Long-Run Simulation)
  // =========================================================================
  console.log('\n🔄 Auditing Object Pooling & Resource Growth during Chunk Recycling...');

  const poolTelemetry = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const initialGeometries = game.getPerformanceMetrics().geometries;
    const initialTextures = game.getPerformanceMetrics().textures;
    const initialChildren = game.worldScene.scene.children.length;

    const player = game.getPlayer();
    const trackMgr = game.getTrackManager();

    // Fast-simulate forward running through 25 full chunk cycles (3000m)
    for (let c = 0; c < 25; c++) {
      player.position.z -= 120.0;
      player.distanceTraveled += 120.0;
      trackMgr.update(player, 1 / 60, 1 / 60);
      await new Promise(r => requestAnimationFrame(r));
    }

    const postRunGeometries = game.getPerformanceMetrics().geometries;
    const postRunTextures = game.getPerformanceMetrics().textures;
    const postRunChildren = game.worldScene.scene.children.length;

    // Reset game and re-check memory
    game.startRun('NORMAL');
    game.getOpeningSequence().skip();
    await new Promise(r => requestAnimationFrame(r));

    const resetChildren = game.worldScene.scene.children.length;
    const resetGeometries = game.getPerformanceMetrics().geometries;

    return {
      initialGeometries,
      postRunGeometries,
      geomDelta: postRunGeometries - initialGeometries,
      initialTextures,
      postRunTextures,
      initialChildren,
      postRunChildren,
      resetChildren,
      resetGeometries,
      hasRunawayGrowth: (postRunChildren - initialChildren) > 25
    };
  });

  console.log('🔬 Object Pooling Telemetry:', JSON.stringify(poolTelemetry, null, 2));

  // =========================================================================
  // 3. Multi-Environment & Moving Train Stress Test
  // =========================================================================
  console.log('\n🌆 Auditing Environment Shifts, Tunnel & Multi-Powerup Load...');

  const envLoadTelemetry = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const envDirector = window.__ENV_DIRECTOR__;
    const results = {};

    // 1. Urban Modern Metro
    if (window.__DEV_SET_DISTRICT__) window.__DEV_SET_DISTRICT__('MODERN_METRO');
    await new Promise(r => requestAnimationFrame(r));
    results.modernMetro = game.getPerformanceMetrics();

    // 2. Underground Tunnel
    if (window.__DEV_SET_DISTRICT__) window.__DEV_SET_DISTRICT__('UNDERGROUND_METRO');
    await new Promise(r => requestAnimationFrame(r));
    results.undergroundTunnel = game.getPerformanceMetrics();

    // 3. Neon Industrial
    if (window.__DEV_SET_DISTRICT__) window.__DEV_SET_DISTRICT__('NEON_INDUSTRIAL');
    await new Promise(r => requestAnimationFrame(r));
    results.neonIndustrial = game.getPerformanceMetrics();

    // 4. Activate All Powerups Simultaneously (Magnet + Jetpack + Shield + Sneakers + Hoverboard)
    const player = game.getPlayer();
    player.powerups.activate('MAGNET');
    player.powerups.activate('JETPACK');
    player.powerups.activate('SHIELD');
    player.powerups.activate('SNEAKERS');
    player.hoverboardManager.grantPracticeCharge();
    player.hoverboardManager.activate();
    await new Promise(r => requestAnimationFrame(r));
    results.multiPowerupStack = game.getPerformanceMetrics();

    return results;
  });

  console.log('⚡ Multi-Environment & Powerup Stress Metrics:', JSON.stringify(envLoadTelemetry, null, 2));

  // =========================================================================
  // 4. Multi-Viewport & Touch Interface Compatibility
  // =========================================================================
  console.log('\n📱 Testing Viewports: Desktop (1440x900), Laptop (1280x720), Mobile (390x844)...');

  // Desktop Capture
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(150);
  await saveScreenshot(page, 'phase6_desktop_1440x900.png');

  // Laptop Capture
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(150);
  await saveScreenshot(page, 'phase6_laptop_1280x720.png');

  // Mobile Viewport Capture
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);

  const mobileHUDChecks = await page.evaluate(() => {
    const powerups = document.getElementById('hud-powerups');
    const pauseBtn = document.getElementById('hud-pause-btn');
    const touchControls = document.getElementById('touch-controls');
    const scoreVal = document.getElementById('hud-score');

    return {
      hasPowerups: !!powerups,
      powerupsInSafeZone: powerups ? powerups.getBoundingClientRect().top < 120 : false,
      hasPauseBtn: !!pauseBtn,
      touchControlsPresent: !!touchControls,
      hasScore: !!scoreVal
    };
  });

  console.log('📱 Mobile Viewport Layout Verification:', mobileHUDChecks);
  await saveScreenshot(page, 'phase6_mobile_390x844.png');

  // =========================================================================
  // 5. Pause & Resume Verification
  // =========================================================================
  console.log('\n⏸️ Verifying Pause, Freeze & Clean Resume...');
  const pauseTest = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL');
    game.getOpeningSequence().skip();

    const player = game.getPlayer();
    player.speed = 20.0;
    const initialZ = player.position.z;

    // Pause game
    game.pause();
    const isPaused = game.lifecycleState === 'PAUSED';

    // Simulate 30 frames while paused
    for (let i = 0; i < 30; i++) {
      await new Promise(r => requestAnimationFrame(r));
    }
    const frozenZ = player.position.z;

    // Resume game
    game.resume();
    const isResumed = game.lifecycleState === 'PLAYING';

    for (let i = 0; i < 15; i++) {
      await new Promise(r => requestAnimationFrame(r));
    }
    const resumedZ = player.position.z;

    return {
      pausedState: isPaused,
      positionFrozen: Math.abs(frozenZ - initialZ) < 0.01,
      resumedState: isResumed,
      continuedMovement: resumedZ < frozenZ
    };
  });

  console.log('⏯️ Pause & Resume Telemetry:', pauseTest);

  await browser.close();

  // Assertions
  if (consoleErrors.length > 0) {
    console.error('❌ Critical runtime exceptions detected in browser:', consoleErrors);
    process.exit(1);
  }

  if (poolTelemetry.hasRunawayGrowth) {
    console.error('❌ Runaway object growth detected in long-run simulation!');
    process.exit(1);
  }

  if (!pauseTest.pausedState || !pauseTest.positionFrozen || !pauseTest.resumedState || !pauseTest.continuedMovement) {
    console.error('❌ Pause/Resume state failure!');
    process.exit(1);
  }

  console.log('\n🏆 ALL PHASE 6 REAL-BROWSER AUDIT CHECKS PASSED CLEANLY!');
}

run().catch((err) => {
  console.error('Fatal Browser Audit Error:', err);
  process.exit(1);
});

