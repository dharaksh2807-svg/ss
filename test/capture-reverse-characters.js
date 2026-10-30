import { chromium } from 'playwright';
import * as path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/2f350341-c53b-4c07-92cd-b647a661dc87';

async function testRahul() {
  console.log('🚀 Testing Rahul Gandhi in Reverse Run mode...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Set running style to REVERSE and unlock/equip Rahul Gandhi
  await page.evaluate(() => {
    localStorage.setItem('metro_running_style', 'REVERSE');
    const raw = localStorage.getItem('metro_progression_v1');
    const state = raw ? JSON.parse(raw) : {};
    state.unlockedCharacters = ['char_jax', 'char_luna', 'char_cruz', 'char_nova', 'char_modi', 'char_rahul_gandhi'];
    state.selectedCharacter = 'char_rahul_gandhi';
    state.selectedOutfits = state.selectedOutfits || {};
    state.selectedOutfits['char_rahul_gandhi'] = 'rahul_classic';
    state.rahulTrialsRemaining = 5;
    localStorage.setItem('metro_progression_v1', JSON.stringify(state));
  });

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('Starting run with Rahul Gandhi...');
  await page.evaluate(() => {
    window.__METRO_GAME__.startRun();
  });
  await page.waitForTimeout(2500);

  const rahulShot = path.join(ARTIFACT_DIR, 'reverse_run_rahul_gameplay.png');
  await page.screenshot({ path: rahulShot });
  console.log('Saved Rahul Gandhi screenshot:', rahulShot);

  await browser.close();
  console.log('✅ Rahul Gandhi testing complete!');
}

testRahul().catch((err) => {
  console.error('Rahul test error:', err);
  process.exit(1);
});
