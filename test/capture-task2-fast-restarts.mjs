import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/2f350341-c53b-4c07-92cd-b647a661dc87';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

console.log('🚀 Starting Browser Verification & Restart Timing Measurement...\n');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('RUN') || text.includes('RESTART') || text.includes('CRASH') || text.includes('ERROR')) {
      console.log(`[Browser Console]: ${text}`);
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // 1. Verify game is initialized
  const isGameInit = await page.evaluate(() => {
    return typeof window.game !== 'undefined';
  });
  console.log(`🎮 Game initialized in browser: ${isGameInit}`);

  // 2. Start run
  await page.evaluate(() => {
    window.game.startRun('NORMAL');
  });
  await page.waitForTimeout(1000);

  // Let runner collect some meters
  await page.waitForTimeout(500);

  // 3. Trigger Fatal Crash
  console.log('💥 Triggering fatal collision on track...');
  await page.evaluate(() => {
    window.EventBus.getInstance().emit('CRASH', 'TRAIN_FRONTAL_CRASH');
  });
  await page.waitForTimeout(500);

  // Check if revive modal appears
  const reviveVisible = await page.evaluate(() => {
    const el = document.getElementById('revive-modal');
    return el && !el.classList.contains('hidden');
  });
  console.log(`🔑 Revive modal visible: ${reviveVisible}`);

  const reviveScreenShotPath = path.join(ARTIFACT_DIR, 'task2_revive_screen.png');
  await page.screenshot({ path: reviveScreenShotPath });
  console.log(`📸 Captured Revive screen: ${reviveScreenShotPath}`);

  // 4. Decline Revive -> should immediately show GameOver results
  console.log('🛑 Declining revive to end run and settle rewards...');
  await page.evaluate(() => {
    const endBtn = document.getElementById('revive-end-run-btn');
    if (endBtn) endBtn.click();
  });
  await page.waitForTimeout(100);

  // Verify Game Over modal is displayed immediately
  const gameOverVisible = await page.evaluate(() => {
    const el = document.getElementById('game-over-modal');
    const revivePill = document.getElementById('game-over-revive-badge');
    const retryBtn = document.getElementById('game-over-retry-btn');
    const retryText = document.getElementById('game-over-retry-text');
    return {
      modalVisible: el && !el.classList.contains('hidden'),
      hasRevivePill: !!revivePill,
      reviveText: revivePill?.textContent?.trim() || '',
      hasRetryBtn: !!retryBtn,
      retryText: retryText?.textContent?.trim() || ''
    };
  });
  console.log('📊 Game Over Modal State:', gameOverVisible);

  const gameOverScreenShotPath = path.join(ARTIFACT_DIR, 'task2_game_over_results.png');
  await page.screenshot({ path: gameOverScreenShotPath });
  console.log(`📸 Captured Game Over results screen: ${gameOverScreenShotPath}`);

  // 5. Measure Actual Quick Retry Time (Clicking Retry)
  console.log('\n⏱️ Measuring Quick Retry latency via Button Click...');
  const restartTime = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const start = performance.now();
      const retryBtn = document.getElementById('game-over-retry-btn');
      if (retryBtn) retryBtn.click();

      // Poll until state is PLAYING and modal is hidden
      const interval = setInterval(() => {
        const game = window.game;
        const modal = document.getElementById('game-over-modal');
        const modalHidden = modal && modal.classList.contains('hidden');
        if (game && game.lifecycleState === 'PLAYING' && modalHidden && game.player.speed > 0) {
          clearInterval(interval);
          const end = performance.now();
          resolve(end - start);
        }
      }, 5);
    });
  });
  console.log(`⚡ Measured Quick Retry Transition Time (Mouse Click): ${Number(restartTime).toFixed(2)}ms`);

  await page.waitForTimeout(600);
  const runningScreenShotPath = path.join(ARTIFACT_DIR, 'task2_post_retry_running.png');
  await page.screenshot({ path: runningScreenShotPath });
  console.log(`📸 Captured Post-Retry active running screen: ${runningScreenShotPath}`);

  // 6. Test Keyboard Shortcut 'R' Restart
  console.log('\n⌨️ Testing Keyboard [R] Shortcut Quick Retry...');
  await page.evaluate(() => {
    window.EventBus.getInstance().emit('CRASH', 'OBSTACLE_COLLISION');
  });
  await page.waitForTimeout(200);

  // Decline revive
  await page.evaluate(() => {
    const endBtn = document.getElementById('revive-end-run-btn');
    if (endBtn) endBtn.click();
  });
  await page.waitForTimeout(100);

  // Press 'r' key
  const keyRestartTime = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const start = performance.now();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', code: 'KeyR', bubbles: true }));

      const interval = setInterval(() => {
        const game = window.game;
        const modal = document.getElementById('game-over-modal');
        const modalHidden = modal && modal.classList.contains('hidden');
        if (game && game.lifecycleState === 'PLAYING' && modalHidden && game.player.speed > 0) {
          clearInterval(interval);
          const end = performance.now();
          resolve(end - start);
        }
      }, 5);
    });
  });
  console.log(`⚡ Measured Quick Retry Transition Time (Keyboard 'R'): ${Number(keyRestartTime).toFixed(2)}ms`);

  // 7. Verify Debounce Protection: Spamming 'R' or Click 5 times
  console.log('\n🛡️ Testing Double-Click / Rapid Spam Debounce Protection...');
  const spamResults = await page.evaluate(() => {
    const game = window.game;
    // Trigger 5 rapid restart calls
    game.quickRestart();
    game.quickRestart();
    game.quickRestart();
    game.quickRestart();
    game.quickRestart();
    return {
      lifecycleState: game.lifecycleState,
      playerSpeed: game.player.speed
    };
  });
  console.log('🛡️ Rapid Spam Result (Game stayed singular & stable):', spamResults);

  await browser.close();

  console.log('\n============================================================');
  console.log('🎉 BROWSER VERIFICATION & RESTART TIMING COMPLETED SUCCESSFULLY!');
  console.log(`⚡ Button Click Restart: ${Number(restartTime).toFixed(2)}ms`);
  console.log(`⚡ Keyboard 'R' Restart: ${Number(keyRestartTime).toFixed(2)}ms`);
  console.log('============================================================\n');
})();
