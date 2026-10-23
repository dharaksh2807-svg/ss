import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/b3e653ae-0f2c-4503-a947-8d8985c89f1a';

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function runTask4Capture() {
  console.log('🎬 Starting Task 4 Browser Verification & Screenshot Suite...');

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

  // Clear opening sequence override to test default FIRST_ONLY
  await page.addInitScript(() => {
    localStorage.removeItem('metro_opening_cinematic');
    localStorage.setItem('metro_runner_wallet', '15000');
  });

  console.log('🌐 Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // ----------------------------------------------------
  // TEST 1: Launch Run -> Phase 1 Encounter & Whistle
  // ----------------------------------------------------
  console.log('\n[TEST 1] Starting run -> Opening Intro Encounter...');
  await page.click('#start-play-btn', { force: true });
  await page.waitForTimeout(400); // 0.4s into intro (Phase 1)

  const isIntroActive = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    return game ? game.getOpeningSequence().isActive() : false;
  });
  console.log('Opening sequence active:', isIntroActive);

  console.log('📸 Capturing: task4_opening_intro_encounter.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task4_opening_intro_encounter.png') });

  // ----------------------------------------------------
  // TEST 2: Phase 2 Sprint Takeoff & Chase Surge
  // ----------------------------------------------------
  console.log('\n[TEST 2] Waiting for Phase 2 Sprint Takeoff...');
  await page.waitForTimeout(700); // ~1.1s elapsed into intro

  console.log('📸 Capturing: task4_opening_sprint_takeoff.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task4_opening_sprint_takeoff.png') });

  // ----------------------------------------------------
  // TEST 3: Phase 3 Seamless Camera Blend into Gameplay
  // ----------------------------------------------------
  console.log('\n[TEST 3] Waiting for Intro Completion -> Gameplay Camera...');
  await page.waitForTimeout(1600); // ~2.7s total, intro completed, gameplay active

  const gameplayActive = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    return game ? (!game.getOpeningSequence().isActive() && game.getPlayer().speed > 10) : false;
  });
  console.log('Full gameplay running smoothly:', gameplayActive);

  console.log('📸 Capturing: task4_gameplay_transition.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task4_gameplay_transition.png') });

  // ----------------------------------------------------
  // TEST 4: Nonfatal Stumble Feedback & Chaser Surge
  // ----------------------------------------------------
  console.log('\n[TEST 4] Triggering nonfatal stumble...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      game.getPlayer().stumble();
    }
  });
  await page.waitForTimeout(250); // Peak stumble reaction

  const chaserMode = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    return game ? game.getChaser().getMode() : '';
  });
  console.log('Chaser reaction mode on stumble:', chaserMode);

  console.log('📸 Capturing: task4_stumble_chaser_reaction.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task4_stumble_chaser_reaction.png') });

  // ----------------------------------------------------
  // TEST 5: Collision Recovery Feedback (Shield Break)
  // ----------------------------------------------------
  console.log('\n[TEST 5] Testing shield break recovery reaction...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      game.getPlayer().powerups.activate('SHIELD');
      game.getPlayer().crash('BARRIER_COLLISION');
    }
  });
  await page.waitForTimeout(200);

  console.log('📸 Capturing: task4_protected_recovery_reaction.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task4_protected_recovery_reaction.png') });

  // ----------------------------------------------------
  // TEST 6: Fatal Crash & Caught Reaction
  // ----------------------------------------------------
  console.log('\n[TEST 6] Triggering fatal crash...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      game.getPlayer().powerups.reset();
      game.getPlayer().crash('DIRECT_HEADON_TRAIN');
    }
  });
  await page.waitForTimeout(400);

  console.log('📸 Capturing: task4_fatal_crash_caught.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task4_fatal_crash_caught.png') });

  // Wait for Game Over modal to display
  await page.waitForTimeout(900);

  // ----------------------------------------------------
  // TEST 7: Retry Transition (Instant Skip under FIRST_ONLY)
  // ----------------------------------------------------
  console.log('\n[TEST 7] Testing Play Again / Retry transition...');
  await page.click('#game-over-retry-btn', { force: true });
  await page.waitForTimeout(300);

  const introActiveOnRetry = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    return game ? game.getOpeningSequence().isActive() : false;
  });
  console.log('Opening sequence active on retry (should be false for fast restart):', introActiveOnRetry);

  console.log('📸 Capturing: task4_retry_instant_transition.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task4_retry_instant_transition.png') });

  // ----------------------------------------------------
  // TEST 8: Skip Button Functionality
  // ----------------------------------------------------
  console.log('\n[TEST 8] Testing Skip Button on fresh run with ALWAYS setting...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      game.goToMenu();
      game.getOpeningSequence().setPreference('ALWAYS');
    }
  });
  await page.waitForTimeout(500);

  await page.click('#start-play-btn', { force: true });
  await page.waitForTimeout(250); // Intro playing, skip button visible

  console.log('Clicking Skip button...');
  await page.click('#intro-skip-btn', { force: true });
  await page.waitForTimeout(200);

  const introActiveAfterSkip = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    return game ? game.getOpeningSequence().isActive() : true;
  });
  console.log('Intro active after clicking skip button:', introActiveAfterSkip);

  console.log('📸 Capturing: task4_skip_interaction.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task4_skip_interaction.png') });

  // ----------------------------------------------------
  // TEST 9: Character & Outfit Selection Intro Compatibility
  // ----------------------------------------------------
  console.log('\n[TEST 9] Selecting alternate character (Luna / Street Rebel) and starting run...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      game.goToMenu();
    }
  });
  await page.waitForTimeout(500);

  // Open character modal & equip Luna
  await page.click('#start-characters-btn', { force: true });
  await page.waitForTimeout(600);
  const lunaCard = await page.$('.showroom-char-card[data-char-id="char_luna"]');
  if (lunaCard) {
    await lunaCard.click({ force: true });
    await page.waitForTimeout(300);
    const equipBtn = await page.$('#char-action-btn');
    if (equipBtn) await equipBtn.click({ force: true });
    await page.waitForTimeout(200);
  }
  await page.click('#char-close-btn', { force: true });
  await page.waitForTimeout(400);

  // Start run with Luna
  await page.click('#start-play-btn', { force: true });
  await page.waitForTimeout(450); // In intro

  console.log('📸 Capturing: task4_character_outfit_intro.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task4_character_outfit_intro.png') });

  // ----------------------------------------------------
  // TEST 10: Settings Modal & Intro Persistence
  // ----------------------------------------------------
  console.log('\n[TEST 10] Testing Settings Modal & Opening Sequence Persistence...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      game.goToMenu();
    }
  });
  await page.waitForTimeout(500);

  // Open settings
  await page.click('#start-settings-btn', { force: true });
  await page.waitForTimeout(400);

  // Select "DISABLED"
  await page.selectOption('#setting-opening-cinematic', 'DISABLED');
  await page.waitForTimeout(200);

  const persistedSetting = await page.evaluate(() => localStorage.getItem('metro_opening_cinematic'));
  console.log('Persisted opening cinematic setting in localStorage:', persistedSetting);

  console.log('📸 Capturing: task4_settings_intro_persisted.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task4_settings_intro_persisted.png') });

  await page.click('#settings-close-btn', { force: true });
  await page.waitForTimeout(300);

  // Reset setting back to default FIRST_ONLY
  await page.evaluate(() => localStorage.setItem('metro_opening_cinematic', 'FIRST_ONLY'));

  // ----------------------------------------------------
  // TEST 11: Mobile Portrait Responsive Viewport
  // ----------------------------------------------------
  console.log('\n[TEST 11] Testing Mobile Portrait Viewport (412 x 915)...');
  await page.setViewportSize({ width: 412, height: 915 });
  await page.waitForTimeout(300);

  await page.click('#start-play-btn', { force: true });
  await page.waitForTimeout(450); // Mobile intro framing

  console.log('📸 Capturing: task4_mobile_portrait_intro.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task4_mobile_portrait_intro.png') });

  console.log('\n✅ All 11 browser visual evidence captures completed successfully!');
  await browser.close();
}

runTask4Capture().catch((err) => {
  console.error('❌ Task 4 capture failed:', err);
  process.exit(1);
});
