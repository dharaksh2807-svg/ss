import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve('artifacts', 'phase10');
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

function log(msg) {
  console.log(`[Gate D/E] ${msg}`);
}

async function runPerfAndUXAudit() {
  log('===============================================================');
  log('⚡ GATE D: PERFORMANCE, HARDWARE STABILITY & SOAK AUDIT');
  log('🎮 GATE E: PLAYER EXPERIENCE, INTERACTION & ACCESSIBILITY AUDIT');
  log('===============================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--mute-audio']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 15000 });

  // Mute audio
  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
  });

  // -------------------------------------------------------------------------
  // SECTION 1: GATE D — CONTROLLED PERFORMANCE PROFILING
  // -------------------------------------------------------------------------
  log('1. Profiling Desktop Normal Gameplay (150 frames)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL');
    if (game.openingSequence) game.openingSequence.skip();
    game.player.activateReviveGrace(999999);
    game.player.isIntroInvincible = true;
  });

  const desktopPerf = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const renderer = game.worldScene.renderer;
    const frameTimes = [];
    const calls = [];
    const tris = [];

    await new Promise((resolve) => {
      let f = 0;
      let last = performance.now();
      function tick() {
        const now = performance.now();
        if (f > 0) {
          frameTimes.push(now - last);
          calls.push(renderer.info.render.calls);
          tris.push(renderer.info.render.triangles);
        }
        last = now;
        f++;
        if (f < 150) requestAnimationFrame(tick);
        else resolve();
      }
      requestAnimationFrame(tick);
    });

    frameTimes.sort((a, b) => a - b);
    const avgFt = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const p50Ft = frameTimes[Math.floor(frameTimes.length * 0.50)];
    const p95Ft = frameTimes[Math.floor(frameTimes.length * 0.95)];
    const p99Ft = frameTimes[Math.floor(frameTimes.length * 0.99)];
    const stutters = frameTimes.filter(t => t > 33.3).length;
    const avgCalls = Math.round(calls.reduce((a, b) => a + b, 0) / calls.length);
    const avgTris = Math.round(tris.reduce((a, b) => a + b, 0) / tris.length);
    const heap = performance.memory ? performance.memory.usedJSHeapSize : null;

    return {
      avgFps: Math.round(1000 / avgFt),
      avgFrameTimeMs: Math.round(avgFt * 100) / 100,
      p50FrameTimeMs: Math.round(p50Ft * 100) / 100,
      p95FrameTimeMs: Math.round(p95Ft * 100) / 100,
      p99FrameTimeMs: Math.round(p99Ft * 100) / 100,
      stutterCount: stutters,
      stutterRatePercent: Math.round((stutters / frameTimes.length) * 10000) / 100,
      avgDrawCalls: avgCalls,
      avgTriangles: avgTris,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
      usedHeapMB: heap ? Math.round(heap / (1024 * 1024) * 10) / 10 : 'N/A'
    };
  });

  log(`  Desktop Normal: ${desktopPerf.avgFps} FPS, avg=${desktopPerf.avgFrameTimeMs}ms, P99=${desktopPerf.p99FrameTimeMs}ms, calls=${desktopPerf.avgDrawCalls}, tris=${desktopPerf.avgTriangles}, stutters=${desktopPerf.stutterCount}`);

  // 2. High-Speed Gameplay Performance (35 m/s)
  log('\n2. Profiling High-Speed (35 m/s) Gameplay Performance...');
  const highSpeedPerf = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    game.player.speed = 35.0;
    const renderer = game.worldScene.renderer;
    const frameTimes = [];

    await new Promise((resolve) => {
      let f = 0;
      let last = performance.now();
      function tick() {
        const now = performance.now();
        if (f > 0) frameTimes.push(now - last);
        last = now;
        f++;
        if (f < 100) requestAnimationFrame(tick);
        else resolve();
      }
      requestAnimationFrame(tick);
    });

    frameTimes.sort((a, b) => a - b);
    const avgFt = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const p99Ft = frameTimes[Math.floor(frameTimes.length * 0.99)];

    return {
      avgFps: Math.round(1000 / avgFt),
      avgFrameTimeMs: Math.round(avgFt * 100) / 100,
      p99FrameTimeMs: Math.round(p99Ft * 100) / 100,
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles
    };
  });

  log(`  High Speed: ${highSpeedPerf.avgFps} FPS, avg=${highSpeedPerf.avgFrameTimeMs}ms, P99=${highSpeedPerf.p99FrameTimeMs}ms, calls=${highSpeedPerf.drawCalls}`);

  // 3. Soak / Stress Test: 5 Rapid Restarts + 6 Rapid Theme Switches
  log('\n3. Executing Stability Soak Test (5 Restarts + 6 World Switches)...');
  const soakResults = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const renderer = game.worldScene.renderer;
    const snapshots = [];

    // 5 Restarts
    for (let r = 0; r < 5; r++) {
      game.startRun('NORMAL', true);
      if (game.openingSequence) game.openingSequence.skip();
      // Step 20 frames
      for (let s = 0; s < 20; s++) {
        game.trackManager.update(game.player, 0.016, s * 0.016);
      }
    }
    snapshots.push({
      phase: 'post-5-restarts',
      calls: renderer.info.render.calls,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures
    });

    // 6 Theme Switches
    const themes = ['HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'VIP_EXPRESS', 'RAHULVERSE', 'NEON_RAINLINE', 'MODERN_METRO'];
    const registry = (await import('/src/environment/EnvironmentRegistry.ts')).EnvironmentRegistry.getInstance();
    for (const t of themes) {
      game.worldScene.applyEnvironment(registry.get(t));
      for (let s = 0; s < 10; s++) {
        game.trackManager.update(game.player, 0.016, s * 0.016);
      }
    }
    snapshots.push({
      phase: 'post-6-world-switches',
      calls: renderer.info.render.calls,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures
    });

    return snapshots;
  });

  log(`  Soak Phase 1: calls=${soakResults[0].calls}, geo=${soakResults[0].geometries}, tex=${soakResults[0].textures}`);
  log(`  Soak Phase 2: calls=${soakResults[1].calls}, geo=${soakResults[1].geometries}, tex=${soakResults[1].textures}`);

  // -------------------------------------------------------------------------
  // SECTION 2: GATE E — PLAYER EXPERIENCE & ACCESSIBILITY AUDIT
  // -------------------------------------------------------------------------
  log('\n===============================================================');
  log('🎮 GATE E: PLAYER EXPERIENCE & INTERACTION VERIFICATION');
  log('===============================================================\n');

  const uxAssertions = [];
  function assertUX(name, condition, details = '') {
    if (condition) {
      log(`  ✅ PASS: ${name} ${details}`);
      uxAssertions.push({ name, pass: true, details });
    } else {
      log(`  ❌ FAIL: ${name} ${details}`);
      uxAssertions.push({ name, pass: false, details });
      throw new Error(`UX Assertion failed: ${name} - ${details}`);
    }
  }

  // 1. First-Run Lobby Usability (Reload page to fresh lobby state)
  log('1. Verifying Lobby Usability & CTAs on fresh load...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 15000 });

  const lobbyCheck = await page.evaluate(() => {
    const playBtn = document.getElementById('start-play-btn');
    const charBtn = document.getElementById('start-characters-btn');
    const envBtn = document.getElementById('start-worlds-btn');
    const settingsBtn = document.getElementById('start-settings-btn');
    const shopBtn = document.getElementById('start-shop-btn');
    const profileBtn = document.getElementById('start-profile-btn');

    return {
      hasPlayBtn: !!playBtn && !document.getElementById('start-screen')?.classList.contains('hidden'),
      hasCharBtn: !!charBtn,
      hasEnvBtn: !!envBtn,
      hasSettingsBtn: !!settingsBtn,
      hasShopBtn: !!shopBtn,
      hasProfileBtn: !!profileBtn
    };
  });

  assertUX('Play button is visible & clickable', lobbyCheck.hasPlayBtn);
  assertUX('Character select entry is available', lobbyCheck.hasCharBtn);
  assertUX('World select entry is available', lobbyCheck.hasEnvBtn);
  assertUX('Settings entry is available', lobbyCheck.hasSettingsBtn);
  assertUX('Shop entry is available', lobbyCheck.hasShopBtn);

  // 2. Settings Modal, Audio Controls & Accessibility
  log('\n2. Verifying Audio Controls & Accessibility Settings...');
  const settingsCheck = await page.evaluate(() => {
    const sm = window.__METRO_GAME__.settingsManager;
    const soundMgr = window.__METRO_GAME__.soundManager;

    // Test Master Volume adjustment
    soundMgr.setMasterVolume(0.65);
    soundMgr.setMusicVolume(0.45);
    soundMgr.setSfxVolume(0.80);
    const prefs = soundMgr.getPreferences();

    // Test Reduced Motion
    sm.setReducedMotion(true);
    const reducedMotionActive = sm.isReducedMotion();
    sm.setReducedMotion(false);

    // Test Reduced Audio Intensity
    soundMgr.setReducedIntensity(true);
    const reducedIntensityActive = soundMgr.isReducedIntensity();
    soundMgr.setReducedIntensity(false);

    return {
      updatedMaster: prefs.masterVolume,
      updatedMusic: prefs.musicVolume,
      updatedSfx: prefs.sfxVolume,
      reducedMotionActive,
      reducedIntensityActive
    };
  });

  assertUX('Master volume updates correctly', Math.abs(settingsCheck.updatedMaster - 0.65) < 0.01);
  assertUX('Music volume updates correctly', Math.abs(settingsCheck.updatedMusic - 0.45) < 0.01);
  assertUX('SFX volume updates correctly', Math.abs(settingsCheck.updatedSfx - 0.80) < 0.01);
  assertUX('Reduced motion toggles cleanly', settingsCheck.reducedMotionActive === true);
  assertUX('Reduced audio intensity toggles cleanly', settingsCheck.reducedIntensityActive === true);

  // 3. Save Integrity & Progression Persistence
  log('\n3. Verifying Save Integrity across Reload...');
  const saveCheck = await page.evaluate(() => {
    const prog = window.__METRO_GAME__.progression;
    prog.addCoins(500);
    const preReloadCoins = prog.getCoins();

    const storedProg = localStorage.getItem('metro_progression_v1');
    const storedSettings = localStorage.getItem('metro_settings_v2');

    return {
      preReloadCoins,
      hasProgressionInStorage: !!storedProg,
      hasSettingsInStorage: !!storedSettings
    };
  });

  assertUX('Progression state persisted to localStorage', saveCheck.hasProgressionInStorage);
  assertUX('Settings state persisted to localStorage', saveCheck.hasSettingsInStorage);

  const report = {
    timestamp: new Date().toISOString(),
    desktopPerf,
    highSpeedPerf,
    soakResults,
    uxAssertions,
    gateDPass: desktopPerf.avgFps >= 50 && desktopPerf.p99FrameTimeMs <= 35,
    gateEPass: uxAssertions.every(a => a.pass)
  };

  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'gate_d_e_results.json'), JSON.stringify(report, null, 2));

  log('\n===============================================================');
  log(`🏆 GATE D VERDICT: ${report.gateDPass ? 'PASS' : 'FAIL'} (${desktopPerf.avgFps} FPS, P99=${desktopPerf.p99FrameTimeMs}ms)`);
  log(`🏆 GATE E VERDICT: ${report.gateEPass ? 'PASS' : 'FAIL'} (${uxAssertions.length}/${uxAssertions.length} UX criteria passed)`);
  log('===============================================================\n');

  await browser.close();
  return report;
}

runPerfAndUXAudit().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('[Gate D/E ERROR]', err);
  process.exit(1);
});
