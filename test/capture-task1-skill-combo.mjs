import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/2f350341-c53b-4c07-92cd-b647a661dc87';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function captureSkillCombo() {
  console.log('🚀 Launching Playwright for Task 1 Skill Combo, Perfect Dodge & Style System captures...');

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

  // Start the game
  console.log('2. Starting game...');
  await page.click('#start-play-btn', { force: true });
  await page.waitForTimeout(1000);

  // Trigger combo events in active gameplay
  console.log('3. Triggering Skill Events during gameplay...');
  await page.evaluate(() => {
    const comboMgr = (window).__SKILL_COMBO__;
    if (comboMgr) {
      // Build momentum: 3 clean skill events
      comboMgr.recordSkillEvent('CLEAN_LANE_DODGE', 'train_01');
      comboMgr.recordSkillEvent('NEAR_MISS', 'train_02');
      comboMgr.recordSkillEvent('PERFECT_JUMP', 'hurdle_01');
    }
  });

  await page.waitForTimeout(300);
  const shot1Path = path.join(ARTIFACT_DIR, 'task1_01_skill_combo_hud_active.png');
  await page.screenshot({ path: shot1Path });
  console.log(`📸 1. Skill Combo HUD Active -> ${shot1Path}`);

  // Build up to EXCELLENT milestone (Combo 8)
  console.log('4. Progressing to EXCELLENT tier...');
  await page.evaluate(() => {
    const comboMgr = (window).__SKILL_COMBO__;
    if (comboMgr) {
      comboMgr.recordSkillEvent('PERFECT_SLIDE', 'hurdle_02');
      comboMgr.recordSkillEvent('ROOFTOP_LANDING', 'roof_01');
      comboMgr.recordSkillEvent('CLEAN_OBSTACLE_CHAIN', 'chain_01');
      comboMgr.recordSkillEvent('NEAR_MISS', 'train_03');
      comboMgr.recordSkillEvent('ROOFTOP_GAP_JUMP', 'roof_02');
    }
  });

  await page.waitForTimeout(350);
  const shot2Path = path.join(ARTIFACT_DIR, 'task1_02_combo_milestone_excellent.png');
  await page.screenshot({ path: shot2Path });
  console.log(`📸 2. Combo Milestone Excellent -> ${shot2Path}`);

  // Build up to MASTERFUL tier (Combo 12+)
  console.log('5. Escalating to MASTERFUL tier...');
  await page.evaluate(() => {
    const comboMgr = (window).__SKILL_COMBO__;
    if (comboMgr) {
      comboMgr.recordSkillEvent('PERFECT_JUMP', 'hurdle_03');
      comboMgr.recordSkillEvent('PERFECT_SLIDE', 'hurdle_04');
      comboMgr.recordSkillEvent('CLEAN_LANE_DODGE', 'train_04');
      comboMgr.recordSkillEvent('ROOFTOP_GAP_JUMP', 'roof_03');
    }
  });

  await page.waitForTimeout(350);
  const shot3Path = path.join(ARTIFACT_DIR, 'task1_03_masterful_combo_streak.png');
  await page.screenshot({ path: shot3Path });
  console.log(`📸 3. Masterful Combo Streak -> ${shot3Path}`);

  // Trigger Game Over to verify Results Screen Style Score Card
  console.log('6. Triggering Game Over for Results Screen verification...');
  await page.evaluate(() => {
    const bus = (window).__METRO_BUS__;
    const events = (window).__METRO_EVENTS__;
    if (bus && events) {
      bus.emit(events.GAME_OVER, {
        score: 18450,
        distance: 1240,
        coins: 145,
        reason: 'CRASH'
      });
    }
  });

  await page.waitForTimeout(600);
  const reviveEndBtn = await page.$('#revive-end-run-btn');
  if (reviveEndBtn) {
    console.log('Clicking revive-end-run-btn to display GameOverModal...');
    await reviveEndBtn.click();
  }
  await page.waitForSelector('#game-over-modal', { state: 'visible', timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(600);

  const shot4Path = path.join(ARTIFACT_DIR, 'task1_04_game_over_style_card.png');
  await page.screenshot({ path: shot4Path });
  console.log(`📸 4. Game Over Results Screen with Style Card -> ${shot4Path}`);

  await browser.close();
  console.log('🎉 Playwright capture completed successfully!');
}

captureSkillCombo().catch((err) => {
  console.error('❌ Playwright capture failed:', err);
  process.exit(1);
});
