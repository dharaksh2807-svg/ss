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
  console.log('🚀 Metro Runner 3D: Real-Browser Hard Mode Multiplier Stacking Walkthrough...\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--mute-audio']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('AudioContext')) return; // Ignore headless virtual audio device notice
      console.error('Browser Error:', text);
      consoleErrors.push(text);
    }
  });

  // 1. Load Page & Verify Game
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => window.__METRO_GAME__ !== undefined);
  console.log('✅ WebGL game loaded successfully');

  // 2. Select HARD Mode via Mode Toggle Button on Start Screen
  console.log('🎯 Selecting Hard Mode via Start Screen Mode Toggle...');
  const hardToggle = page.locator('#mode-toggle-hard');
  await hardToggle.click();
  await page.waitForTimeout(100);

  // 3. Click Play Now Button
  console.log('🎮 Starting Hard Mode Run...');
  const playBtn = page.locator('#start-play-btn');
  await playBtn.click();
  await page.waitForTimeout(200);

  // Skip cinematic intro to enter active gameplay immediately
  await page.evaluate(() => {
    window.__METRO_GAME__.getOpeningSequence().skip();
  });
  await page.waitForTimeout(300);

  // 4. Verify Active Game Mode is HARD
  const activeMode = await page.evaluate(() => window.__METRO_GAME__.getActiveGameMode());
  console.log(`Active Game Mode: ${activeMode}`);
  if (activeMode !== 'HARD') {
    throw new Error(`Expected active mode to be HARD, but got ${activeMode}`);
  }
  console.log('✅ Active Game Mode confirmed as HARD');

  // 5. Let game run for ~1 second of active gameplay (60 frames)
  await page.waitForTimeout(1000);

  // 6. Check HUD Multiplier Element
  const hudMultiplierText = await page.locator('#hud-multiplier').textContent();
  const hudMultiplierClasses = await page.locator('#hud-multiplier').getAttribute('class');
  const internalScoreMult = await page.evaluate(() => window.__METRO_GAME__.getScoreMultiplier());
  const hudInternalMult = await page.evaluate(() => window.__METRO_GAME__.getHUD().getMultiplier());

  console.log(`HUD Multiplier text content: "${hudMultiplierText}"`);
  console.log(`HUD Multiplier CSS class: "${hudMultiplierClasses}"`);
  console.log(`Game internal scoreMultiplier: ${internalScoreMult}`);
  console.log(`HUD internal multiplier: ${hudInternalMult}`);

  if (hudMultiplierText !== '1.25X') {
    throw new Error(`Expected HUD multiplier to display "1.25X", but found "${hudMultiplierText}"!`);
  }
  console.log('✅ HUD text content correctly displays "1.25X"');

  if (!hudMultiplierClasses.includes('active')) {
    throw new Error(`Expected #hud-multiplier to have "active" class! Classes: "${hudMultiplierClasses}"`);
  }
  console.log('✅ #hud-multiplier badge has active styling class');

  if (internalScoreMult !== 1.25) {
    throw new Error(`Expected game.scoreMultiplier to be 1.25, but got ${internalScoreMult}!`);
  }
  console.log('✅ Game internal scoreMultiplier is preserved at 1.25');

  // 7. Test Power-up Stacking in Browser
  console.log('⚡ Activating 2X Multiplier power-up in Hard Mode...');
  const powerupDiag = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.powerups.activate('MULTIPLIER');
    return {
      is2xActive: player.powerups.is2xMultiplierActive(),
      hasKey: player.powerups.is2xMultiplierActive(),
      calculated: game.calculateEffectiveMultiplier(),
      scoreMultiplier: game.getScoreMultiplier(),
      lifecycleState: game.lifecycleState,
      isIntroActive: game.getOpeningSequence().isActive()
    };
  });
  console.log('Powerup Diag:', JSON.stringify(powerupDiag));
  await page.waitForTimeout(500);

  const stackedMultiplierText = await page.locator('#hud-multiplier').textContent();
  const stackedInternalScoreMult = await page.evaluate(() => window.__METRO_GAME__.getScoreMultiplier());
  console.log(`Stacked HUD Multiplier text: "${stackedMultiplierText}"`);
  console.log(`Stacked internal scoreMultiplier: ${stackedInternalScoreMult}`);

  if (stackedMultiplierText !== '2.5X' || stackedInternalScoreMult !== 2.5) {
    throw new Error(`Expected 2.5X stacked multiplier (1.25 * 2), got HUD "${stackedMultiplierText}", internal ${stackedInternalScoreMult}`);
  }
  console.log('✅ Hard Mode + 2X Multiplier stacks cleanly to 2.5X');

  // 8. Capture Screenshot with HUD Active Multiplier
  await saveScreenshot(page, 'hard_mode_active_multiplier_hud.png');

  // 9. Reset power-up and verify return to 1.25X
  console.log('🔄 Power-up expiring: resetting power-up...');
  await page.evaluate(() => {
    window.__METRO_GAME__.getPlayer().powerups.reset();
  });
  await page.waitForTimeout(500);

  const restoredMultiplierText = await page.locator('#hud-multiplier').textContent();
  const restoredInternalScoreMult = await page.evaluate(() => window.__METRO_GAME__.getScoreMultiplier());
  console.log(`Restored HUD Multiplier text: "${restoredMultiplierText}"`);
  console.log(`Restored internal scoreMultiplier: ${restoredInternalScoreMult}`);

  if (restoredMultiplierText !== '1.25X' || restoredInternalScoreMult !== 1.25) {
    throw new Error(`Expected multiplier to return to 1.25X, got HUD "${restoredMultiplierText}", internal ${restoredInternalScoreMult}`);
  }
  console.log('✅ Multiplier cleanly restored to 1.25X after power-up expiration');

  // Check console errors
  if (consoleErrors.length > 0) {
    console.warn(`Encountered ${consoleErrors.length} console error(s):`, consoleErrors);
  }

  await browser.close();
  console.log('\n🎉 Real-Browser Hard Mode Multiplier Stacking Test PASSED successfully!');
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
