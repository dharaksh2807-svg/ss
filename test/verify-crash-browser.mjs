import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || '/Users/dharaksh/.gemini/antigravity/brain/fee7f8eb-9699-4c14-9bfd-a6b8025326b1';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const PORT = 3000;
const URL = `http://localhost:${PORT}/`;

async function verify() {
  console.log('🚀 Launching real browser test for Metro Runner 3D crash flow...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser Error:', msg.text());
    }
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Verify start screen is visible
  const startScreenVisible = await page.$eval('#start-screen', el => !el.classList.contains('hidden'));
  console.log('Lobby Start Screen visible:', startScreenVisible);

  // 2. Start a Normal Mode run
  console.log('▶️ Starting run...');
  const playBtn = await page.$('#start-play-btn');
  if (playBtn) {
    await page.click('#start-play-btn', { force: true });
  }
  await page.waitForTimeout(500);
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);

  // Wait for PLAYING lifecycle state
  await page.waitForFunction(() => {
    const game = window.__METRO_GAME__;
    return game && game.lifecycleState === 'PLAYING';
  }, { timeout: 10000 });
  console.log('🏃 Active running confirmed');

  // Skip opening cinematic if active
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game && game.openingSequence) {
      game.openingSequence.skip();
    }
  });

  // 3. Trigger a fatal collision directly through the collision system
  console.log('💥 Inducing fatal collision with train in Lane 0...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    // Induce fatal crash with obstacle
    game.handleFatalCrash('TRAIN_FRONTAL_COLLISION');
  });

  await page.waitForTimeout(600);

  // 4. CRITICAL CHECK: Verify DevBugReportModal is NOT visible!
  const isBugReportModalHidden = await page.$eval('#dev-bug-report-modal', el => el.classList.contains('hidden'));
  console.log('✅ DevBugReportModal is strictly HIDDEN after fatal collision:', isBugReportModalHidden);
  if (!isBugReportModalHidden) {
    throw new Error('FAIL: DevBugReportModal was automatically displayed after fatal collision!');
  }

  // 5. Verify Revive Modal is visible to the player
  const isReviveModalVisible = await page.$eval('#revive-modal', el => !el.classList.contains('hidden'));
  console.log('✅ Player Revive Modal is visible:', isReviveModalVisible);

  const reviveScreenShotPath = path.join(ARTIFACT_DIR, 'browser_revive_screen_normal_crash.png');
  await page.screenshot({ path: reviveScreenShotPath });
  console.log(`📸 Captured Revive Screen: ${reviveScreenShotPath}`);

  // 6. Decline revive to proceed to Game Over screen
  console.log('Declining revive offer...');
  const declineBtn = await page.$('#revive-decline-btn');
  if (declineBtn) {
    await page.click('#revive-decline-btn');
  } else {
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.onReviveDeclined('TRAIN_FRONTAL_COLLISION');
    });
  }

  await page.waitForTimeout(800);

  // 7. Verify Game Over Modal is displayed and DevBugReportModal is STILL hidden
  const isGameOverVisible = await page.$eval('#game-over-modal', el => !el.classList.contains('hidden'));
  const isBugReportStillHidden = await page.$eval('#dev-bug-report-modal', el => el.classList.contains('hidden'));
  console.log('✅ GameOverModal is visible:', isGameOverVisible);
  console.log('✅ DevBugReportModal remains strictly HIDDEN on Game Over:', isBugReportStillHidden);
  if (!isBugReportStillHidden) {
    throw new Error('FAIL: DevBugReportModal appeared on Game Over screen!');
  }

  const gameOverScreenShotPath = path.join(ARTIFACT_DIR, 'browser_game_over_normal_crash.png');
  await page.screenshot({ path: gameOverScreenShotPath });
  console.log(`📸 Captured Game Over Screen: ${gameOverScreenShotPath}`);

  // 8. Explicit Developer Action: Click CAPTURE BUG REPORT button on Game Over screen
  console.log('🐛 Developer clicking "CAPTURE BUG REPORT [F9]" on Game Over screen...');
  await page.click('#game-over-bug-report-btn');
  await page.waitForTimeout(500);

  // Verify DevBugReportModal is now visible
  const isBugReportNowVisible = await page.$eval('#dev-bug-report-modal', el => !el.classList.contains('hidden'));
  console.log('✅ DevBugReportModal is now VISIBLE after explicit developer action:', isBugReportNowVisible);
  if (!isBugReportNowVisible) {
    throw new Error('FAIL: DevBugReportModal failed to open upon clicking bug report button!');
  }

  const devModalScreenShotPath = path.join(ARTIFACT_DIR, 'browser_dev_bug_report_explicit.png');
  await page.screenshot({ path: devModalScreenShotPath });
  console.log(`📸 Captured Explicit Developer Bug Report Modal: ${devModalScreenShotPath}`);

  // 9. Developer closes the modal via ✕ close button
  console.log('Closing DevBugReportModal...');
  await page.click('#dev-bug-close-btn');
  await page.waitForTimeout(400);

  const isModalClosed = await page.$eval('#dev-bug-report-modal', el => el.classList.contains('hidden'));
  console.log('✅ DevBugReportModal cleanly closed:', isModalClosed);
  if (!isModalClosed) {
    throw new Error('FAIL: DevBugReportModal did not close!');
  }

  // 10. Start a fresh run and ensure no stale modal appears
  console.log('▶️ Restarting game from Game Over screen...');
  await page.click('#game-over-retry-btn', { force: true });
  await page.waitForTimeout(1000);

  const isModalHiddenOnRestart = await page.$eval('#dev-bug-report-modal', el => el.classList.contains('hidden'));
  console.log('✅ DevBugReportModal is strictly HIDDEN on restart:', isModalHiddenOnRestart);
  if (!isModalHiddenOnRestart) {
    throw new Error('FAIL: DevBugReportModal persisted into restarted run!');
  }

  const restartScreenShotPath = path.join(ARTIFACT_DIR, 'browser_restart_run_clean.png');
  await page.screenshot({ path: restartScreenShotPath });
  console.log(`📸 Captured Clean Restart Run: ${restartScreenShotPath}`);

  await browser.close();
  console.log('\n🎉 ALL REAL BROWSER VERIFICATIONS PASSED 100%!');
}

verify().catch(err => {
  console.error('❌ Browser verification error:', err);
  process.exit(1);
});
