import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/8b70b6a8-e6e7-431c-b23c-023a1c122eff';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const URL = 'http://localhost:3000/';

async function runAudit() {
  console.log('🚀 Launching Comprehensive P0 Death-State & Stability Audit in Real Browser...');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser Error:', msg.text());
    }
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Verify Start Screen
  const isStartScreenVisible = await page.$eval('#start-screen', el => !el.classList.contains('hidden'));
  console.log('✅ Start screen visible:', isStartScreenVisible);
  if (!isStartScreenVisible) throw new Error('Start screen was not visible');

  // 2. Start normal run
  console.log('▶️ Starting run...');
  await page.evaluate(() => {
    const playBtn = document.getElementById('start-play-btn');
    if (playBtn) playBtn.click();
    else if (window.__METRO_GAME__) window.__METRO_GAME__.startRun('NORMAL');
  });

  await page.waitForFunction(() => {
    const game = window.__METRO_GAME__;
    return game && game.lifecycleState === 'PLAYING';
  }, { timeout: 10000 });
  console.log('🏃 Active running confirmed');

  // Skip intro sequence
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game?.openingSequence) game.openingSequence.skip();
  });
  await page.waitForTimeout(400);

  // Set up browser-level event telemetry
  await page.evaluate(() => {
    window.__TEST_TELEMETRY__ = {
      crashEvents: 0,
      chaserEvents: 0,
      gameOverEvents: 0
    };
    const bus = window.__METRO_BUS__;
    bus.on('CRASH', () => { window.__TEST_TELEMETRY__.crashEvents++; });
    bus.on('CHASER_CAPTURED', () => { window.__TEST_TELEMETRY__.chaserEvents++; });
    bus.on('GAME_OVER', () => { window.__TEST_TELEMETRY__.gameOverEvents++; });
  });

  // 3. Test Shield Protection First (Assert collision absorbed, 0 death)
  console.log('🛡️ Testing shield protection against obstacle collision...');
  const shieldResult = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.powerups.activate('SHIELD');
    const crashed = player.crash('OBSTACLE_COLLISION');
    return {
      crashed,
      playerState: player.state,
      lifecycleState: game.lifecycleState,
      crashEvents: window.__TEST_TELEMETRY__.crashEvents
    };
  });
  console.log('  Shield impact outcome:', shieldResult);
  if (shieldResult.crashed !== false || shieldResult.playerState !== 'RUN' || shieldResult.crashEvents !== 0) {
    throw new Error('FAIL: Shield did not absorb collision safely!');
  }
  console.log('✅ Shield-protected impact absorbed cleanly (0 death events, state remains RUN)');

  // 4. Test Hoverboard Protection (Assert collision absorbed, 0 death)
  console.log('🛹 Testing hoverboard protection against obstacle collision...');
  const boardResult = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.hoverboardManager.activate();
    const crashed = player.crash('OBSTACLE_COLLISION');
    return {
      crashed,
      playerState: player.state,
      lifecycleState: game.lifecycleState,
      crashEvents: window.__TEST_TELEMETRY__.crashEvents
    };
  });
  console.log('  Hoverboard impact outcome:', boardResult);
  if (boardResult.crashed !== false || boardResult.playerState !== 'RUN' || boardResult.crashEvents !== 0) {
    throw new Error('FAIL: Hoverboard did not absorb collision safely!');
  }
  console.log('✅ Hoverboard-protected impact absorbed cleanly (0 death events, state remains RUN)');

  // 5. Fatal Collision with Train & Repeated Collision Idempotency Check
  console.log('💥 Inducing fatal impact with train (and attempting 5 repeated crash triggers)...');
  const fatalResult = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.hoverboardManager.reset();
    player.powerups.reset();
    player.clearReviveGrace();
    
    // First fatal impact
    const r1 = player.crash('TRAIN_FRONTAL_COLLISION');
    // Immediate repeated calls on same and subsequent frames
    const r2 = player.crash('TRAIN_FRONTAL_COLLISION');
    const r3 = player.crash('TRAIN_RAMP_COLLISION');
    const r4 = player.crash('BARRIER_COLLISION');

    return {
      firstCallFatal: r1,
      repeatedCallsFatal: [r2, r3, r4],
      playerState: player.state,
      playerSpeed: player.speed,
      lifecycleState: game.lifecycleState,
      crashEvents: window.__TEST_TELEMETRY__.crashEvents
    };
  });
  console.log('  Fatal impact result:', fatalResult);
  if (!fatalResult.firstCallFatal || fatalResult.repeatedCallsFatal.some(r => r === true)) {
    throw new Error('FAIL: Fatal collision idempotency violated! Repeated crashes were not rejected.');
  }
  if (fatalResult.crashEvents !== 1) {
    throw new Error(`FAIL: Expected exactly 1 crash event, got ${fatalResult.crashEvents}`);
  }
  console.log('✅ Exactly 1 fatal transition emitted; repeated collisions rejected idempotently');

  console.log('📸 Capturing frame immediately after fatal impact...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p0_fatal_impact.png') });

  // 6. Hold in Death State for 120 Simulation Frames (~2000ms)
  console.log('⏱️ Holding game in death state for 120 simulation frames...');
  const holdTelemetry = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    const positions = [];
    const toasts = [];

    const startTime = performance.now();
    for (let f = 0; f < 120; f++) {
      positions.push({ x: player.position.x, y: player.position.y, z: player.position.z });
      const badgeEls = document.querySelectorAll('.hud-feedback-pill');
      toasts.push(Array.from(badgeEls).map(el => el.textContent));
      await new Promise(r => setTimeout(r, 16));
    }

    return {
      positions,
      toasts,
      durationMs: performance.now() - startTime,
      lifecycleState: game.lifecycleState,
      playerState: player.state,
      isReviveModalOpen: !document.getElementById('revive-modal')?.classList.contains('hidden'),
      isGameOverModalOpen: !document.getElementById('game-over-modal')?.classList.contains('hidden'),
      isDevBugModalOpen: !document.getElementById('dev-bug-report-modal')?.classList.contains('hidden'),
      telemetry: window.__TEST_TELEMETRY__
    };
  });

  console.log('Death hold complete:');
  console.log('  Elapsed time:', Math.round(holdTelemetry.durationMs), 'ms');
  console.log('  Lifecycle state:', holdTelemetry.lifecycleState);
  console.log('  Player state:', holdTelemetry.playerState);
  console.log('  Crash event count:', holdTelemetry.telemetry.crashEvents);
  console.log('  Revive modal open:', holdTelemetry.isReviveModalOpen);
  console.log('  Game over modal open:', holdTelemetry.isGameOverModalOpen);
  console.log('  Dev bug report modal open (MUST BE FALSE):', holdTelemetry.isDevBugModalOpen);

  if (holdTelemetry.telemetry.crashEvents !== 1) {
    throw new Error(`FAIL: Expected exactly 1 crash event, got ${holdTelemetry.telemetry.crashEvents}`);
  }
  if (holdTelemetry.playerState !== 'CRASH') {
    throw new Error(`FAIL: Expected player state CRASH, got ${holdTelemetry.playerState}`);
  }
  if (holdTelemetry.isDevBugModalOpen) {
    throw new Error('FAIL: DevBugReportModal auto-opened during ordinary gameplay!');
  }

  // Check positional stability over 120 frames (no vibration or drift)
  const p0 = holdTelemetry.positions[0];
  let maxDeltaZ = 0;
  let maxDeltaY = 0;
  let maxDeltaX = 0;
  for (const pos of holdTelemetry.positions) {
    maxDeltaX = Math.max(maxDeltaX, Math.abs(pos.x - p0.x));
    maxDeltaY = Math.max(maxDeltaY, Math.abs(pos.y - p0.y));
    maxDeltaZ = Math.max(maxDeltaZ, Math.abs(pos.z - p0.z));
  }
  console.log(`  Position drift over 120 frames: ΔX=${maxDeltaX.toFixed(4)}, ΔY=${maxDeltaY.toFixed(4)}, ΔZ=${maxDeltaZ.toFixed(4)}`);
  if (maxDeltaX > 0.001 || maxDeltaY > 0.001 || maxDeltaZ > 0.001) {
    throw new Error(`FAIL: Positional vibration/drift detected during death hold! ΔZ=${maxDeltaZ}, ΔY=${maxDeltaY}`);
  }
  console.log('✅ Player position completely frozen during death state (0 vibration / 0 jitter)');

  // Check toast deduplication (no multiple simultaneous BUSTED badges)
  const simultaneousBustedCounts = holdTelemetry.toasts.map(arr => arr.filter(t => t && t.includes('BUSTED')).length);
  const maxSimultaneousBusted = Math.max(0, ...simultaneousBustedCounts);
  console.log(`  Max simultaneous BUSTED toasts visible in any frame: ${maxSimultaneousBusted}`);
  if (maxSimultaneousBusted > 1) {
    throw new Error(`FAIL: Multiple simultaneous BUSTED badges displayed: ${maxSimultaneousBusted}`);
  }
  console.log('✅ No duplicate BUSTED notifications');

  console.log('📸 Capturing Revive Modal Screen...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p0_revive_screen.png') });

  // 7. Revive Flow: Accept Revive and Verify 2s Grace
  console.log('❤️ Testing Revive Flow: accepting revive offer...');
  await page.evaluate(() => {
    const btn = document.getElementById('revive-confirm-btn');
    if (btn) btn.click();
    else window.__METRO_GAME__.onReviveAccepted();
  });
  await page.waitForTimeout(400);

  const reviveState = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    return {
      lifecycleState: game.lifecycleState,
      playerState: player.state,
      isInvulnerable: player.isInvulnerable(),
      graceRemaining: player.getReviveGraceTimeRemaining(),
      isReviveOpen: !document.getElementById('revive-modal')?.classList.contains('hidden')
    };
  });
  console.log('  Revive state:', reviveState);
  if (reviveState.playerState !== 'RUN' || !reviveState.isInvulnerable || reviveState.graceRemaining <= 0) {
    throw new Error('FAIL: Revive did not restore RUN state with 2s grace immunity!');
  }
  if (reviveState.isReviveOpen) {
    throw new Error('FAIL: Revive modal remained open after accepting revive!');
  }
  console.log('✅ Revive cleanly restored player state to RUN with 2.0s grace immunity');

  // Verify immunity protects against collision during grace window
  const graceCollision = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    const crashed = player.crash('POST_REVIVE_HAZARD');
    return {
      crashed,
      playerState: player.state,
      crashEvents: window.__TEST_TELEMETRY__.crashEvents
    };
  });
  console.log('  Collision during grace window outcome:', graceCollision);
  if (graceCollision.crashed !== false || graceCollision.playerState !== 'RUN' || graceCollision.crashEvents !== 1) {
    throw new Error('FAIL: Grace immunity did not protect player from post-revive collision!');
  }
  console.log('✅ Post-revive grace window successfully prevents immediate re-crash');

  // 8. Expire grace, re-crash player, and decline revive to reach Game Over
  console.log('💥 Expiring grace and re-crashing player to reach Game Over...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.clearReviveGrace();
    player.crash('SECOND_FATAL_HIT');
  });
  // Wait for 1200ms death presentation window
  await page.waitForTimeout(1400);

  // Decline second revive offer
  console.log('Declining revive offer...');
  await page.evaluate(() => {
    const endRunBtn = document.getElementById('revive-end-run-btn');
    if (endRunBtn) endRunBtn.click();
    else window.__METRO_GAME__.onReviveDeclined('SECOND_FATAL_HIT');
  });
  await page.waitForTimeout(600);

  const gameOverState = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    return {
      lifecycleState: game?.lifecycleState,
      isReviveOpen: !document.getElementById('revive-modal')?.classList.contains('hidden'),
      isGameOverOpen: !document.getElementById('game-over-modal')?.classList.contains('hidden'),
      isDevBugOpen: !document.getElementById('dev-bug-report-modal')?.classList.contains('hidden')
    };
  });
  console.log('Game Over State:', gameOverState);
  if (!gameOverState.isGameOverOpen || gameOverState.isReviveOpen) {
    throw new Error('FAIL: Revive and GameOver modals conflicted or did not display correctly!');
  }
  if (gameOverState.isDevBugOpen) {
    throw new Error('FAIL: DevBugReportModal opened on Game Over!');
  }
  console.log('✅ Revive and Game Over cleanly separated (never simultaneous)');
  console.log('✅ Technical crash reports remain strictly hidden');

  console.log('📸 Capturing Game Over Modal Screen...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p0_game_over_screen.png') });

  // 9. Test Quick Restart from Game Over
  console.log('▶️ Testing Quick Restart from Game Over screen...');
  await page.evaluate(() => {
    const retryBtn = document.getElementById('game-over-retry-btn');
    if (retryBtn) retryBtn.click();
    else window.__METRO_GAME__.quickRestart();
  });
  await page.waitForTimeout(600);

  const restartState = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game?.getPlayer();
    const chaser = game?.chaser;
    return {
      lifecycleState: game?.lifecycleState,
      playerState: player?.state,
      playerSpeed: player?.speed,
      chaserState: chaser?.getChaseState(),
      isGameOverOpen: !document.getElementById('game-over-modal')?.classList.contains('hidden'),
      isReviveOpen: !document.getElementById('revive-modal')?.classList.contains('hidden'),
      isDevBugOpen: !document.getElementById('dev-bug-report-modal')?.classList.contains('hidden'),
      badgeCount: document.querySelectorAll('.hud-feedback-pill').length
    };
  });
  console.log('Restart State:', restartState);
  if (restartState.lifecycleState !== 'PLAYING' || restartState.playerState !== 'RUN') {
    throw new Error(`FAIL: Restart failed to return player to PLAYING/RUN state (got lifecycle=${restartState.lifecycleState}, player=${restartState.playerState})`);
  }
  if (Math.abs(restartState.playerSpeed - 18) > 1.0) {
    throw new Error(`FAIL: Player speed not reset to 18 (got ${restartState.playerSpeed})`);
  }
  if (restartState.chaserState !== 'DISTANT') {
    throw new Error(`FAIL: Chaser state not reset to DISTANT (got ${restartState.chaserState})`);
  }
  if (restartState.isGameOverOpen || restartState.isReviveOpen || restartState.isDevBugOpen) {
    throw new Error('FAIL: Lingering modal on restart!');
  }
  console.log('✅ Quick restart cleanly resets all state without stale contacts or lingering overlays');

  console.log('📸 Capturing Clean Restart Run Screen...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p0_clean_restart.png') });

  // 10. Test Explicit Developer Diagnostic Access (F9 trigger)
  console.log('🔧 Testing explicit developer diagnostic access via F9 hotkey...');
  await page.keyboard.press('F9');
  await page.waitForTimeout(300);

  const devModalState = await page.evaluate(() => {
    return {
      isDevBugOpen: !document.getElementById('dev-bug-report-modal')?.classList.contains('hidden')
    };
  });
  console.log('Developer Modal on explicit F9:', devModalState);
  if (!devModalState.isDevBugOpen) {
    throw new Error('FAIL: Explicit developer F9 trigger failed to open DevBugReportModal!');
  }
  console.log('✅ Developer diagnostics remain accessible on deliberate developer request');

  console.log('📸 Capturing Explicit Developer Diagnostic Modal Screen...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'p0_explicit_dev_modal.png') });

  // Close developer modal cleanly
  await page.evaluate(() => {
    const closeBtn = document.getElementById('dev-bug-close-btn');
    closeBtn?.click();
  });
  await page.waitForTimeout(300);

  const devModalClosed = await page.evaluate(() => {
    return document.getElementById('dev-bug-report-modal')?.classList.contains('hidden');
  });
  console.log('Developer Modal cleanly closed:', devModalClosed);
  if (!devModalClosed) throw new Error('FAIL: DevBugReportModal failed to close cleanly');
  console.log('✅ Developer modal cleanly dismissible');

  await browser.close();
  console.log('\n🎉 ALL P0 DEATH-STATE & STABILITY CHECKS PASSED IN REAL BROWSER (100%)!');
}

runAudit().catch(err => {
  console.error('❌ Audit failure:', err);
  process.exit(1);
});
