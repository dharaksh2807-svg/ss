import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/2f350341-c53b-4c07-92cd-b647a661dc87';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function captureDailyChallengeWalkthrough() {
  console.log('🚀 Launching Playwright for Task 2 Daily Seeded Challenges & Shareable Codes walkthrough...');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--use-gl=angle']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: ARTIFACT_DIR,
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();

  console.log('1. Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  await page.waitForSelector('#game-canvas');
  await page.waitForTimeout(1000);

  // 1. Lobby with Daily Challenge Widget
  console.log('2. Capturing Lobby with Daily Challenge Widget...');
  const shot1Path = path.join(ARTIFACT_DIR, 'task2_01_lobby_daily_challenge_widget.png');
  await page.screenshot({ path: shot1Path });
  console.log(`📸 1. Lobby Daily Widget -> ${shot1Path}`);

  // 2. Open Daily Challenge Modal
  console.log('3. Opening Daily Challenge Modal...');
  await page.click('#lobby-daily-challenge-btn', { force: true });
  await page.waitForTimeout(600);

  const shot2Path = path.join(ARTIFACT_DIR, 'task2_02_daily_challenge_modal_opened.png');
  await page.screenshot({ path: shot2Path });
  console.log(`📸 2. Daily Challenge Modal Opened -> ${shot2Path}`);

  // Test Copy Code button inside modal
  console.log('4. Testing Copy Code Button in modal...');
  await page.click('#dc-copy-code-btn', { force: true });
  await page.waitForTimeout(200);

  // 3. Test Import Friend Challenge Code with Live Preview
  console.log('5. Testing Import Friend Code and Preview Card...');
  await page.evaluate(() => {
    const input = document.getElementById('dc-import-input');
    if (input) {
      input.value = 'MTR1-DST-HRD-5A8F9B20-4E';
    }
  });
  await page.click('#dc-validate-import-btn', { force: true });
  await page.waitForTimeout(400);

  const shot3Path = path.join(ARTIFACT_DIR, 'task2_03_daily_challenge_import_preview.png');
  await page.screenshot({ path: shot3Path });
  console.log(`📸 3. Import Preview Box -> ${shot3Path}`);

  // 4. Start Daily Challenge Run
  console.log('6. Launching Daily Challenge Run...');
  await page.click('#dc-play-btn', { force: true });
  await page.waitForTimeout(1400);

  const shot4Path = path.join(ARTIFACT_DIR, 'task2_04_daily_challenge_gameplay_active.png');
  await page.screenshot({ path: shot4Path });
  console.log(`📸 4. Daily Challenge Gameplay Active -> ${shot4Path}`);

  // 5. Trigger Game Over to verify Results Screen and Share Card
  console.log('7. Triggering Run Finish to view Results Screen...');
  await page.evaluate(() => {
    const game = (window).__METRO_GAME__;
    if (game) {
      game.score = 15420;
      game.coinsCount = 48;
      game.player.distanceTraveled = 920;
      (game).handleGameOver('FATAL_COLLISION');
    }
  });
  await page.waitForTimeout(1400);

  const shot5Path = path.join(ARTIFACT_DIR, 'task2_05_daily_challenge_results_share_card.png');
  await page.screenshot({ path: shot5Path });
  console.log(`📸 5. Daily Challenge Results & Share Card -> ${shot5Path}`);

  // Test Copy Challenge Code on Game Over Screen
  console.log('8. Testing Copy Code on Game Over screen...');
  await page.click('#go-copy-code-btn', { force: true });
  await page.waitForTimeout(300);

  // 6. Test Retry Flow
  console.log('9. Testing Retry Course action...');
  await page.click('#game-over-retry-btn', { force: true });
  await page.waitForTimeout(1000);

  const shot6Path = path.join(ARTIFACT_DIR, 'task2_06_daily_challenge_retry_flow.png');
  await page.screenshot({ path: shot6Path });
  console.log(`📸 6. Daily Challenge Retry Flow -> ${shot6Path}`);

  await browser.close();
  console.log('\n🎉 Task 2 Playwright Walkthrough Completed Successfully!');
}

captureDailyChallengeWalkthrough().catch(err => {
  console.error('Fatal Playwright capture failure:', err);
  process.exit(1);
});
