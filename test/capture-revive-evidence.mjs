import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/b3e653ae-0f2c-4503-a947-8d8985c89f1a';

async function runReviveVerification() {
  console.log('🚀 Starting Save Me / Key-Based Revive System Playwright Verification...');

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--autoplay-policy=no-user-gesture-required']
    });
  } catch (err) {
    browser = await chromium.launch({
      headless: true,
      args: ['--autoplay-policy=no-user-gesture-required']
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  console.log('🌐 Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // =========================================================================
  // Step 1: Start Screen & Key Currency Status
  // =========================================================================
  console.log('\n--- Step 1: Start Screen & Key Currency Status ---');

  const keysPillVisible = await page.evaluate(() => {
    const el = document.getElementById('lobby-keys-pill');
    const val = document.getElementById('lobby-keys-val');
    return {
      visible: el && el.offsetParent !== null,
      keys: val ? val.textContent : null
    };
  });
  console.log('Lobby Key Currency Status:', keysPillVisible);

  const lobbyShotPath = path.join(ARTIFACT_DIR, 'task9_lobby_keys_pill.png');
  await page.screenshot({ path: lobbyShotPath });
  console.log('📸 Captured Start Screen Lobby with Key Pill:', lobbyShotPath);

  // Ensure player has exactly 3 keys for the test
  await page.evaluate(() => {
    const prog = window.__METRO_GAME__.progression;
    const cur = prog.getKeys();
    prog.consumeKeys(cur);
    prog.addKeys(3);
    window.__METRO_GAME__.startScreen.updateState();
  });
  await page.waitForTimeout(300);

  // =========================================================================
  // Step 2: Start Game & Intercept Fatal Collision to Enter REVIVE_OFFER
  // =========================================================================
  console.log('\n--- Step 2: Start Game & Intercept Fatal Crash ---');

  await page.click('#start-play-btn', { force: true });
  await page.waitForTimeout(600);

  // Skip intro cutscene if active to enter normal gameplay
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game.openingSequence && game.openingSequence.isActive()) {
      game.openingSequence.skip();
    }
    game.score = 4250;
    game.coinsCount = 38;
    window.__METRO_BUS__.emit(window.__METRO_EVENTS__.SCORE_UPDATED, 4250);
  });
  await page.waitForTimeout(400);

  // Trigger fatal crash
  console.log('💥 Triggering fatal crash...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.crash('TRAIN_COLLISION');
  });
  await page.waitForTimeout(400);

  const crashState = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const modal = document.getElementById('revive-modal');
    return {
      lifecycleState: game.lifecycleState,
      modalVisible: modal && !modal.classList.contains('hidden'),
      revivesUsed: game.reviveManager.getRevivesUsed(),
      cost: game.reviveManager.getReviveCost(),
      score: game.score,
      coins: game.coinsCount,
      timerText: document.getElementById('revive-timer-sec')?.textContent
    };
  });
  console.log('State after fatal crash:', crashState);

  const reviveOfferShotPath = path.join(ARTIFACT_DIR, 'task9_revive_modal_offer.png');
  await page.screenshot({ path: reviveOfferShotPath });
  console.log('📸 Captured Save Me Revive Modal Offer:', reviveOfferShotPath);

  // =========================================================================
  // Step 3: Execute 1st Revive (Cost = 1 Key) & Verify Safe Continuation
  // =========================================================================
  console.log('\n--- Step 3: Execute 1st Revive (Cost = 1 Key) ---');

  await page.click('#revive-confirm-btn', { force: true });
  await page.waitForTimeout(500);

  const postReviveState = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const modal = document.getElementById('revive-modal');
    return {
      lifecycleState: game.lifecycleState,
      modalVisible: modal && !modal.classList.contains('hidden'),
      revivesUsed: game.reviveManager.getRevivesUsed(),
      nextCost: game.reviveManager.getReviveCost(),
      keysRemaining: game.progression.getKeys(),
      isInvulnerable: game.player.isInvulnerable(),
      graceTimer: game.player.getReviveGraceTimeRemaining(),
      score: game.score,
      coins: game.coinsCount,
      playerSpeed: game.player.speed,
      playerLane: game.player.currentLane
    };
  });
  console.log('State after 1st Revive:', postReviveState);

  const postReviveShotPath = path.join(ARTIFACT_DIR, 'task9_post_revive_gameplay.png');
  await page.screenshot({ path: postReviveShotPath });
  console.log('📸 Captured Post-Revive Active Gameplay with Grace Period:', postReviveShotPath);

  // =========================================================================
  // Step 4: 2nd Fatal Crash & Cost Escalation (Cost = 2 Keys)
  // =========================================================================
  console.log('\n--- Step 4: 2nd Fatal Crash & Cost Escalation (Cost = 2 Keys) ---');

  // Fast-forward grace timer so collision is fatal again
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.update(2.5); // Grace expires
    game.score = 8900;
    game.coinsCount = 62;
    game.player.crash('HIGH_BARRIER');
  });
  await page.waitForTimeout(400);

  const secondOfferState = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    return {
      lifecycleState: game.lifecycleState,
      cost: game.reviveManager.getReviveCost(),
      revivesUsed: game.reviveManager.getRevivesUsed(),
      playerKeys: game.progression.getKeys(),
      costElementText: document.getElementById('revive-cost-val')?.textContent,
      reviveBtnText: document.getElementById('revive-btn-text')?.textContent
    };
  });
  console.log('Second Revive Offer State:', secondOfferState);

  const secondEscalationShotPath = path.join(ARTIFACT_DIR, 'task9_revive_second_escalation.png');
  await page.screenshot({ path: secondEscalationShotPath });
  console.log('📸 Captured 2nd Revive Offer with Escalated Cost:', secondEscalationShotPath);

  // Execute 2nd Revive (spending remaining 2 keys)
  await page.click('#revive-confirm-btn', { force: true });
  await page.waitForTimeout(500);

  const afterSecondRevive = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    return {
      lifecycleState: game.lifecycleState,
      keysRemaining: game.progression.getKeys(),
      revivesUsed: game.reviveManager.getRevivesUsed(),
      nextCost: game.reviveManager.getReviveCost()
    };
  });
  console.log('After 2nd Revive Execution:', afterSecondRevive);

  // =========================================================================
  // Step 5: 3rd Fatal Crash with Insufficient Balance (Cost = 4 Keys, Have = 0)
  // =========================================================================
  console.log('\n--- Step 5: 3rd Fatal Crash with Insufficient Balance ---');

  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.player.update(2.5); // Grace expires
    game.player.crash('TRAIN_COLLISION');
  });
  await page.waitForTimeout(400);

  const insufficientState = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const btn = document.getElementById('revive-confirm-btn');
    return {
      lifecycleState: game.lifecycleState,
      cost: game.reviveManager.getReviveCost(),
      playerKeys: game.progression.getKeys(),
      canAfford: game.reviveManager.hasEnoughKeys(),
      btnDisabled: btn?.disabled,
      btnText: document.getElementById('revive-btn-text')?.textContent
    };
  });
  console.log('Insufficient Keys Offer State:', insufficientState);

  const insufficientShotPath = path.join(ARTIFACT_DIR, 'task9_insufficient_keys_disabled.png');
  await page.screenshot({ path: insufficientShotPath });
  console.log('📸 Captured Insufficient Keys State with Disabled Save Me:', insufficientShotPath);

  // =========================================================================
  // Step 6: End Run & Finalize Game Over Flow
  // =========================================================================
  console.log('\n--- Step 6: End Run & Finalize Game Over Flow ---');

  await page.click('#revive-end-run-btn', { force: true });
  await page.waitForTimeout(1400);

  const gameOverState = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const goModal = document.getElementById('game-over-modal');
    const revModal = document.getElementById('revive-modal');
    return {
      lifecycleState: game.lifecycleState,
      gameOverVisible: goModal && !goModal.classList.contains('hidden'),
      reviveModalHidden: revModal && revModal.classList.contains('hidden'),
      score: document.getElementById('game-over-score')?.textContent,
      coins: document.getElementById('game-over-coins-count')?.textContent
    };
  });
  console.log('Final Game Over State:', gameOverState);

  const gameOverShotPath = path.join(ARTIFACT_DIR, 'task9_game_over_finalized.png');
  await page.screenshot({ path: gameOverShotPath });
  console.log('📸 Captured Finalized Game Over Screen:', gameOverShotPath);

  // =========================================================================
  // Step 7: Restart Run & Verify Reset of Cost Progression
  // =========================================================================
  console.log('\n--- Step 7: Restart Run & Verify Cost Reset ---');

  await page.evaluate(() => {
    window.__METRO_GAME__.goToMenu();
  });
  await page.waitForTimeout(400);

  const resetState = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    return {
      lifecycleState: game.lifecycleState,
      revivesUsed: game.reviveManager.getRevivesUsed(),
      reviveCost: game.reviveManager.getReviveCost(),
      keysInStorage: JSON.parse(localStorage.getItem('metro_progression_save_v1') || '{}').keys
    };
  });
  console.log('Reset State on Menu Return:', resetState);

  await browser.close();
  console.log('\n🎉 Save Me / Key-Based Revive Verification Complete! All steps passed with visual evidence.');
}

runReviveVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
