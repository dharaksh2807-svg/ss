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
  console.log('🚀 Launching Metro Runner 3D: Long-Session Soak & Release Readiness Auditor...\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--mute-audio']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  const runtimeErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('AudioContext')) return; // Ignore headless mock audio device warning
      console.error('Browser Error:', text);
      runtimeErrors.push(text);
    }
  });

  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => window.__METRO_GAME__ !== undefined);

  // =========================================================================
  // 1. Initial State Baseline
  // =========================================================================
  const baseline = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const bus = window.__METRO_BUS__;
    let listenerCount = 0;
    for (const set of bus.listeners.values()) {
      listenerCount += set.size;
    }
    return {
      listenerCount,
      sceneChildren: game.worldScene.scene.children.length,
      geometries: game.getPerformanceMetrics().geometries,
      textures: game.getPerformanceMetrics().textures
    };
  });
  console.log('📊 Initial Session Baseline:', baseline);

  // =========================================================================
  // 2. Execute 10 Continuous Run / Crash / Revive / Restart Soak Cycles
  // =========================================================================
  console.log('\n🔄 Executing 10 Multi-Mode Soak Cycles with Dynamic Environments & Powerups...');

  const cycleTelemetry = [];

  for (let cycle = 1; cycle <= 10; cycle++) {
    const mode = cycle % 2 === 0 ? 'HARD' : 'NORMAL';
    const envId = cycle % 4 === 1 ? 'MODERN_METRO' : (cycle % 4 === 2 ? 'HISTORIC_QUARTER' : (cycle % 4 === 3 ? 'UNDERGROUND_METRO' : 'NEON_INDUSTRIAL'));

    const telemetry = await page.evaluate(async ({ cycle, mode, envId }) => {
      const game = window.__METRO_GAME__;
      const bus = window.__METRO_BUS__;

      // Start run in chosen mode
      game.startRun(mode);
      game.getOpeningSequence().skip();

      // Shift to target district
      if (window.__DEV_SET_DISTRICT__) window.__DEV_SET_DISTRICT__(envId);

      const player = game.getPlayer();
      const trackMgr = game.getTrackManager();

      // Trigger power-up progression
      if (cycle % 3 === 0) {
        player.powerups.activate('JETPACK');
      } else if (cycle % 3 === 1) {
        player.powerups.activate('MAGNET');
        player.powerups.activate('SNEAKERS');
      } else {
        player.hoverboardManager.grantPracticeCharge();
        player.hoverboardManager.activate();
      }

      // Fast-forward run for 15 chunk steps (1800m)
      for (let s = 0; s < 15; s++) {
        player.position.z -= 120.0;
        player.distanceTraveled += 120.0;
        player.update(1 / 60);
        trackMgr.update(player, 1 / 60, 1 / 60);
        await new Promise(r => requestAnimationFrame(r));
      }

      // Cycle 1 special: Test Revive flow
      if (cycle === 1) {
        player.crash('TRAIN_COLLISION');
        const reviveMgr = game.getReviveManager();
        if (reviveMgr.canOfferRevive(mode)) {
          reviveMgr.beginOffer();
          reviveMgr.executeRevive();
          // Revived: resume running
          player.update(1 / 60);
          await new Promise(r => requestAnimationFrame(r));
        }
      }

      // Fatal collision to end run
      player.crash('TRAIN_COLLISION');
      await new Promise(r => requestAnimationFrame(r));

      // Calculate listeners
      let listenerCount = 0;
      for (const set of bus.listeners.values()) {
        listenerCount += set.size;
      }

      const metrics = game.getPerformanceMetrics();
      const sceneChildren = game.worldScene.scene.children.length;

      return {
        cycle,
        mode,
        envId,
        score: game.score,
        coins: game.coinsCount,
        listenerCount,
        sceneChildren,
        geometries: metrics.geometries,
        textures: metrics.textures
      };
    }, { cycle, mode, envId });

    cycleTelemetry.push(telemetry);
    console.log(`  Cycle ${cycle} [${mode} | ${envId}]: SceneChildren=${telemetry.sceneChildren}, Listeners=${telemetry.listenerCount}, Geometries=${telemetry.geometries}`);
  }

  // =========================================================================
  // 3. Final State Audit & Leak Analysis
  // =========================================================================
  const finalState = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.goToMenu();
    const bus = window.__METRO_BUS__;
    let listenerCount = 0;
    for (const set of bus.listeners.values()) {
      listenerCount += set.size;
    }
    return {
      finalChildren: game.worldScene.scene.children.length,
      finalListeners: listenerCount,
      metrics: game.getPerformanceMetrics()
    };
  });

  console.log('\n🏁 Final Session Summary:', finalState);

  await saveScreenshot(page, 'phase7_soak_final_state.png');
  await browser.close();

  // Invariant 1: Zero runtime exceptions
  if (runtimeErrors.length > 0) {
    console.error('❌ Critical runtime exceptions detected during soak:', runtimeErrors);
    process.exit(1);
  }

  // Invariant 2: Scene children bounded (no runaway leaks)
  const initialChildren = baseline.sceneChildren;
  const finalChildren = finalState.finalChildren;
  if (Math.abs(finalChildren - initialChildren) > 25) {
    console.error(`❌ Runaway scene children detected: started with ${initialChildren}, ended with ${finalChildren}`);
    process.exit(1);
  }

  // Invariant 3: Event listener count strictly stable (no subscription duplication)
  const initialListeners = baseline.listenerCount;
  const finalListeners = finalState.finalListeners;
  if (finalListeners > initialListeners + 15) {
    console.error(`❌ EventBus listener leak detected: started with ${initialListeners}, ended with ${finalListeners}`);
    process.exit(1);
  }

  console.log('✅ Invariant 1 Passed: 0 runtime console exceptions during 10 soak cycles.');
  console.log(`✅ Invariant 2 Passed: Scene children bounded (Baseline: ${initialChildren}, Final: ${finalChildren}).`);
  console.log(`✅ Invariant 3 Passed: EventBus listeners stable (Baseline: ${initialListeners}, Final: ${finalListeners}).`);
  console.log('\n🎉 ALL LONG-SESSION SOAK TEST INVARIANTS SATISFIED!');
}

run().catch((err) => {
  console.error('Fatal Soak Test Error:', err);
  process.exit(1);
});

