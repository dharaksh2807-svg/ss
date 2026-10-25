import { chromium } from 'playwright';
import * as path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/2f350341-c53b-4c07-92cd-b647a661dc87';

async function main() {
  console.log('🚀 Starting Runner View UI Verification & Capture...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Setup unlocked characters and initial default state
  await page.evaluate(() => {
    const raw = localStorage.getItem('metro_progression_v1');
    const state = raw ? JSON.parse(raw) : {};
    state.unlockedCharacters = ['char_jax', 'char_luna', 'char_cruz', 'char_nova', 'char_modi', 'char_rahul_gandhi'];
    state.selectedCharacter = 'char_jax';
    localStorage.setItem('metro_progression_v1', JSON.stringify(state));
    localStorage.removeItem('metro_running_style_char_jax');
    localStorage.removeItem('metro_running_style_char_luna');
    localStorage.setItem('metro_running_style', 'CLASSIC');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 1. Open Character Showroom (Runner Section)
  console.log('Opening Runner Showroom...');
  await page.click('#start-characters-btn');
  await page.waitForSelector('#character-select-modal:not(.hidden)');
  await page.waitForTimeout(1200);

  // Capture Runner Showroom initial view (Rear View Default)
  const showroomDefaultShot = path.join(ARTIFACT_DIR, 'runner_showroom_default_view.png');
  await page.screenshot({ path: showroomDefaultShot });
  console.log('Saved Runner Showroom Default view screenshot:', showroomDefaultShot);

  // 2. Select Front View for Jax
  console.log('Selecting Front View (Reverse / Moonwalk) for Jax...');
  await page.click('#char-view-front-btn');
  await page.waitForTimeout(1000);

  const showroomFrontShot = path.join(ARTIFACT_DIR, 'runner_showroom_front_view.png');
  await page.screenshot({ path: showroomFrontShot });
  console.log('Saved Runner Showroom Front View screenshot:', showroomFrontShot);

  // 3. Navigate to Luna
  console.log('Navigating to Luna...');
  await page.click('#char-next-btn');
  await page.waitForTimeout(1200);

  // Select Rear View explicitly for Luna
  console.log('Setting Rear View for Luna...');
  await page.click('#char-view-rear-btn');
  await page.waitForTimeout(800);

  const showroomLunaShot = path.join(ARTIFACT_DIR, 'runner_showroom_luna_view.png');
  await page.screenshot({ path: showroomLunaShot });
  console.log('Saved Luna Showroom screenshot:', showroomLunaShot);

  // 4. Navigate back to Jax and close modal
  console.log('Navigating back to Jax...');
  await page.click('#char-prev-btn');
  await page.waitForTimeout(800);

  console.log('Closing showroom modal...');
  await page.click('#char-close-btn');
  await page.waitForSelector('#character-select-modal', { state: 'hidden' });
  await page.waitForTimeout(600);

  // 5. Open Settings to verify synchronization
  console.log('Opening Settings to verify synchronization...');
  await page.click('#start-settings-btn');
  await page.waitForSelector('#settings-modal:not(.hidden)');
  await page.waitForTimeout(800);

  const settingsShot = path.join(ARTIFACT_DIR, 'runner_settings_synced_view.png');
  await page.screenshot({ path: settingsShot });
  console.log('Saved Settings Synced screenshot:', settingsShot);

  await page.keyboard.press('Escape');
  await page.waitForSelector('#settings-modal', { state: 'hidden' });
  await page.waitForTimeout(600);

  // 6. Start Run with Jax (Front View selected from Runner section)
  console.log('Starting run to verify Jax is in Front View facing camera...');
  await page.evaluate(() => {
    window.__METRO_GAME__.startRun();
  });
  await page.waitForTimeout(2500);

  const gameplayFrontShot = path.join(ARTIFACT_DIR, 'runner_gameplay_front_view.png');
  await page.screenshot({ path: gameplayFrontShot });
  console.log('Saved Jax Front View gameplay screenshot:', gameplayFrontShot);

  await browser.close();
  console.log('🎉 All Runner View UI verifications and screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
