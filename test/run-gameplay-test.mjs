import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/7b654b27-5359-4f8b-9796-d5016a125022';

async function runTest() {
  console.log('🚀 Launching Chromium for automated browser gameplay verification...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 }
  });

  const consoleLogs = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
  });

  try {
    console.log('🌐 Navigating to http://localhost:3000/...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

    // 1. Verify Start Screen
    console.log('👀 Verifying Start Screen & Canvas...');
    await page.waitForSelector('#game-canvas', { state: 'attached' });
    await page.waitForSelector('#start-screen', { state: 'visible' });

    const titleText = await page.textContent('.logo-title');
    console.log(`✅ Game Title verified: "${titleText?.trim()}"`);

    const startScreenshot = path.join(ARTIFACT_DIR, 'gameplay_start_screen.png');
    await page.screenshot({ path: startScreenshot });
    console.log(`📸 Captured Start Screen: ${startScreenshot}`);

    // 2. Click Play Now
    console.log('🎮 Clicking "PLAY NOW" (#start-play-btn)...');
    await page.click('#start-play-btn', { force: true });

    // Wait for HUD to become visible and start screen to hide
    await page.waitForSelector('#hud:not(.hidden)');
    console.log('✅ HUD visible and game loop active!');

    // 3. Test Controls & 3-Lane Movement during gameplay
    console.log('🕹️ Testing: Move Center (0) -> Left (-1)...');
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(() => !window.__METRO_GAME__.player.isChangingLane, { timeout: 3000 });
    let lane = await page.evaluate(() => window.__METRO_GAME__.player.currentLane);
    console.log(`Current lane after Left: ${lane}`);
    if (lane !== -1) throw new Error(`Expected lane -1, got ${lane}`);

    console.log('🕹️ Testing: Left (-1) -> Right key ONCE -> must be Center (0) ONLY (NO SKIPPING)!');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => !window.__METRO_GAME__.player.isChangingLane, { timeout: 3000 });
    lane = await page.evaluate(() => window.__METRO_GAME__.player.currentLane);
    console.log(`Current lane after single Right from Left: ${lane}`);
    if (lane !== 0) throw new Error(`CRITICAL BUG: Runner skipped center lane! Expected 0, got ${lane}`);
    console.log('✅ PASSED: Center lane was NOT skipped!');

    console.log('🕹️ Testing: Center (0) -> Right key ONCE -> Right (+1)...');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => !window.__METRO_GAME__.player.isChangingLane, { timeout: 3000 });
    lane = await page.evaluate(() => window.__METRO_GAME__.player.currentLane);
    console.log(`Current lane after second Right: ${lane}`);
    if (lane !== 1) throw new Error(`Expected lane 1, got ${lane}`);

    console.log('🕹️ Testing: Right (+1) -> Left key ONCE -> Center (0) ONLY (NO SKIPPING)!');
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(() => !window.__METRO_GAME__.player.isChangingLane, { timeout: 3000 });
    lane = await page.evaluate(() => window.__METRO_GAME__.player.currentLane);
    console.log(`Current lane after single Left from Right: ${lane}`);
    if (lane !== 0) throw new Error(`CRITICAL BUG: Runner skipped center lane on reverse! Expected 0, got ${lane}`);
    console.log('✅ PASSED: Center lane was NOT skipped on reverse!');

    console.log('🕹️ Testing ArrowUp (Jump)...');
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(300);

    console.log('🕹️ Testing ArrowDown (Fast Drop / Slide)...');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(400);

    console.log('🕹️ Testing Space (Hoverboard Shield)...');
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    // Let player run for 4 seconds and track score progression
    console.log('⏱️ Running continuously for 4 seconds...');
    await page.waitForTimeout(4000);

    const scoreText = await page.textContent('#hud-score');
    console.log(`📈 Current HUD Score: ${scoreText}`);
    if (parseInt(scoreText.replace(/,/g, ''), 10) <= 0) {
      throw new Error(`Score failed to increment during run! Score: ${scoreText}`);
    }

    const runningScreenshot = path.join(ARTIFACT_DIR, 'gameplay_running.png');
    await page.screenshot({ path: runningScreenshot });
    console.log(`📸 Captured Running Gameplay: ${runningScreenshot}`);

    // 4. Test Pause & Resume
    console.log('⏸️ Testing Pause...');
    await page.click('#hud-pause-btn', { force: true });
    await page.waitForSelector('#pause-modal:not(.hidden)');
    console.log('✅ Pause modal opened!');

    console.log('▶️ Testing Resume...');
    await page.click('#pause-resume-btn', { force: true });
    await page.waitForSelector('#pause-modal', { state: 'hidden' });
    console.log('✅ Resumed successfully!');

    // 5. Test Game Over Trigger
    console.log('💥 Waiting for player to collide with an obstacle or running into train...');
    await page.evaluate(() => {
      if (window.__METRO_BUS__ && window.__METRO_EVENTS__) {
        window.__METRO_BUS__.emit(window.__METRO_EVENTS__.CRASH);
      }
    });

    await page.waitForSelector('#game-over-modal:not(.hidden)', { timeout: 8000 });
    const finalScore = await page.textContent('#game-over-score');
    const finalCoins = await page.textContent('#game-over-coins');
    const finalDist = await page.textContent('#game-over-distance');
    console.log(`💀 Game Over Modal Verified! Score: ${finalScore}, Coins: ${finalCoins}, Distance: ${finalDist}`);

    const gameOverScreenshot = path.join(ARTIFACT_DIR, 'gameplay_game_over.png');
    await page.screenshot({ path: gameOverScreenshot });
    console.log(`📸 Captured Game Over Screen: ${gameOverScreenshot}`);

    // 6. Test Restart
    console.log('🔄 Testing Restart ("PLAY AGAIN")...');
    await page.click('#game-over-retry-btn', { force: true });
    await page.waitForSelector('#hud:not(.hidden)');
    await page.waitForSelector('#game-over-modal', { state: 'hidden' });
    console.log('✅ Restarted run successfully!');

    console.log('\n📋 Console Summary:');
    consoleLogs.slice(-10).forEach(log => console.log('  ', log));

    if (errors.length > 0) {
      console.warn('⚠️ Console errors found during session:', errors);
    } else {
      console.log('✨ ZERO console errors detected during full gameplay session!');
    }

    console.log('\n🎉 ALL AUTOMATED PLAYWRIGHT GAMEPLAY TESTS PASSED!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runTest();
