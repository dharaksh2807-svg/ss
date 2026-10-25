import { chromium } from 'playwright';
import * as path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/2f350341-c53b-4c07-92cd-b647a661dc87';

async function runCapture() {
  console.log('🚀 Launching Reverse Run Playwright visual capture...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Load game and reset to default
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 2. Open Settings Modal
  console.log('1. Opening Settings Modal to verify UI toggle...');
  await page.click('#start-settings-btn');
  await page.waitForTimeout(600);

  // Verify settings row exists
  const settingsRow = await page.$('.running-style-setting-row');
  console.log('Running Style setting row present:', !!settingsRow);

  // Select Reverse / Moonwalk style
  console.log('2. Selecting Reverse / Moonwalk style in Settings...');
  await page.selectOption('#setting-running-style', 'REVERSE');
  await page.waitForTimeout(400);

  const settingsShot = path.join(ARTIFACT_DIR, 'reverse_run_settings_modal.png');
  await page.screenshot({ path: settingsShot });
  console.log('Saved settings screenshot:', settingsShot);

  // Close Settings modal via Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // 3. Start Run with default runner (Jax) in Reverse Run mode
  console.log('3. Starting game run with default runner (Jax) in Reverse Run mode...');
  await page.evaluate(() => {
    window.__METRO_GAME__.startRun();
  });

  // Let runner sprint backward along the tracks for 2.2 seconds to reach full running cadence
  await page.waitForTimeout(2200);

  const jaxGameplayShot = path.join(ARTIFACT_DIR, 'reverse_run_jax_gameplay.png');
  await page.screenshot({ path: jaxGameplayShot });
  console.log('Saved Jax gameplay screenshot:', jaxGameplayShot);

  // 4. Test Jump while facing player
  console.log('4. Performing Jump while in Reverse Run...');
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(300);

  const jaxJumpShot = path.join(ARTIFACT_DIR, 'reverse_run_jax_jump.png');
  await page.screenshot({ path: jaxJumpShot });
  console.log('Saved Jax jump screenshot:', jaxJumpShot);

  // 5. Test Lane Switch Left & Slide
  console.log('5. Performing Lane Switch & Slide...');
  await page.waitForTimeout(400);
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(250);

  const jaxSlideShot = path.join(ARTIFACT_DIR, 'reverse_run_jax_slide.png');
  await page.screenshot({ path: jaxSlideShot });
  console.log('Saved Jax slide screenshot:', jaxSlideShot);

  await browser.close();
  console.log('✅ Reverse Run visual captures complete!');
}

runCapture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
