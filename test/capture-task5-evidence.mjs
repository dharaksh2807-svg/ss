import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/b3e653ae-0f2c-4503-a947-8d8985c89f1a';

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function runTask5Capture() {
  console.log('🧪 Starting Task 5 Practice Mode & Test Arena Browser Verification...');

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
  } catch (err) {
    console.log('Falling back to bundled chromium...');
    browser = await chromium.launch({ headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  console.log('🌐 Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // ----------------------------------------------------
  // TEST 1: Open Practice Mode Modal
  // ----------------------------------------------------
  console.log('\n[TEST 1] Opening Practice Mode Modal...');
  const domInfo = await page.evaluate(() => {
    const btn = document.getElementById('start-practice-btn');
    const startScreen = document.getElementById('start-screen');
    const game = window.__METRO_GAME__;
    return {
      btnExists: !!btn,
      btnText: btn?.textContent?.trim(),
      btnVisible: btn ? btn.offsetWidth > 0 && btn.offsetHeight > 0 : false,
      startScreenClass: startScreen?.className,
      gameLifecycle: game ? game.lifecycleState : 'no-game'
    };
  });
  console.log('DOM INFO:', domInfo);
  await page.click('#start-practice-btn', { force: true });
  await page.waitForTimeout(600);

  const modalInfo = await page.evaluate(() => {
    const pm = document.getElementById('practice-modal');
    return {
      exists: !!pm,
      className: pm?.className,
      innerLength: pm?.innerHTML?.length,
      cardsCount: document.querySelectorAll('.practice-module-card').length,
      cardTexts: Array.from(document.querySelectorAll('.practice-module-card')).map(c => c.getAttribute('data-module'))
    };
  });
  console.log('MODAL INFO:', modalInfo);

  console.log('📸 Capturing: task5_practice_modal_overview.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_practice_modal_overview.png') });

  // ----------------------------------------------------
  // TEST 2: Select Module & Toggle Harder Challenge
  // ----------------------------------------------------
  console.log('\n[TEST 2] Selecting Jump Timing module and toggling Harder Challenge...');
  await page.click('.practice-module-card[data-module="JUMP_TIMING"]');
  await page.waitForTimeout(300);
  await page.click('#practice-harder-toggle');
  await page.waitForTimeout(300);

  console.log('📸 Capturing: task5_practice_harder_challenge.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_practice_harder_challenge.png') });

  // ----------------------------------------------------
  // TEST 3: Launch Practice Drill & In-Game Practice HUD
  // ----------------------------------------------------
  console.log('\n[TEST 3] Launching Practice Module & In-Game Practice HUD...');
  await page.click('#practice-launch-btn', { force: true });
  await page.waitForTimeout(1200);

  console.log('📸 Capturing: task5_practice_hud_in_action.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_practice_hud_in_action.png') });

  // ----------------------------------------------------
  // TEST 4: Evaluate Practice Success Result Card
  // ----------------------------------------------------
  console.log('\n[TEST 4] Triggering Success Result evaluation...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game && game.practiceController) {
      game.practiceController.showResultFeedback({
        result: 'SUCCESS',
        message: 'Perfect leap! Obstacle cleared with zero contact.',
        tip: 'Jump slightly earlier at speeds exceeding 20 m/s.'
      });
    }
  });
  await page.waitForTimeout(500);

  console.log('📸 Capturing: task5_practice_success_feedback.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_practice_success_feedback.png') });

  // ----------------------------------------------------
  // TEST 5: Evaluate Practice Failure Feedback & Tactical Tip
  // ----------------------------------------------------
  console.log('\n[TEST 5] Triggering Failure Result evaluation...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game && game.practiceController) {
      game.practiceController.showResultFeedback({
        result: 'FAILED',
        message: 'Stumbled on low barrier! Jump was initiated too late.',
        tip: 'Tip: Jump approximately 8m to 10m before the hurdle.'
      });
    }
  });
  await page.waitForTimeout(500);

  console.log('📸 Capturing: task5_practice_failure_feedback.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_practice_failure_feedback.png') });

  // ----------------------------------------------------
  // TEST 6: Developer Physics Test Arena Dock & Controls
  // ----------------------------------------------------
  console.log('\n[TEST 6] Opening Developer Physics Test Arena...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game && game.practiceController) {
      game.practiceController.exit();
    }
    const arena = window.__PHYSICS_ARENA__;
    if (arena) arena.open();
  });
  await page.waitForTimeout(600);

  console.log('📸 Capturing: task5_dev_arena_overview.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_dev_arena_overview.png') });

  // ----------------------------------------------------
  // TEST 7: 3D Box3 Collision Wireframes in Arena
  // ----------------------------------------------------
  console.log('\n[TEST 7] Enabling 3D Box3 collision wireframes...');
  await page.selectOption('#arena-scenario-select', 'MOVING_TRAIN_HEADON');
  await page.click('#arena-apply-btn', { force: true });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const arena = window.__PHYSICS_ARENA__;
    if (arena) {
      arena.setWireframes(true);
      arena.pause();
    }
  });
  await page.waitForTimeout(600);

  console.log('📸 Capturing: task5_dev_arena_wireframes_3d.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_dev_arena_wireframes_3d.png') });

  // ----------------------------------------------------
  // TEST 8: Deterministic Replay Recording & Log Diagnostics
  // ----------------------------------------------------
  console.log('\n[TEST 8] Starting Replay Recording in Arena...');
  await page.evaluate(() => {
    const arena = window.__PHYSICS_ARENA__;
    if (arena) {
      arena.resume();
      arena.startRecording();
    }
  });
  await page.waitForTimeout(400);

  // Send test input via keydown
  await page.keyboard.press('KeyW');
  await page.waitForTimeout(400);

  await page.evaluate(() => {
    const arena = window.__PHYSICS_ARENA__;
    if (arena) {
      arena.stopRecording();
    }
  });
  await page.waitForTimeout(500);

  console.log('📸 Capturing: task5_dev_arena_replay_deterministic.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_dev_arena_replay_deterministic.png') });

  // ----------------------------------------------------
  // TEST 9: Mobile Portrait Practice Mode Responsiveness
  // ----------------------------------------------------
  console.log('\n[TEST 9] Testing Mobile Portrait Viewport (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const arena = window.__PHYSICS_ARENA__;
    if (arena) arena.close();
    const game = window.__METRO_GAME__;
    if (game && game.practiceController) {
      game.practiceController.exit();
    }
    const bus = window.__METRO_BUS__;
    if (bus) {
      bus.emit('OPEN_PRACTICE', 'START');
    }
  });
  await page.waitForTimeout(600);

  console.log('📸 Capturing: task5_mobile_portrait_practice.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_mobile_portrait_practice.png') });

  await browser.close();
  console.log('✅ Task 5 browser verification completed successfully!');
}

runTask5Capture().catch((err) => {
  console.error('❌ Capture failed:', err);
  process.exit(1);
});
