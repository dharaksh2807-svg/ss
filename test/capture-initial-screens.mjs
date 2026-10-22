import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/78459556-8063-4db0-a0d4-aa883ff6e90b';

async function captureInitialScreens() {
  console.log('📸 Starting initial screen capture with Playwright...');
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

  await page.addInitScript(() => {
    localStorage.setItem('metro_runner_wallet', '15000');
    localStorage.setItem('metro_surf_high_score', '48250');
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Home / Start Screen
  console.log('Capturing: initial_home_screen.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'initial_home_screen.png') });

  // 2. Character showroom
  console.log('Capturing: initial_characters.png');
  if (await page.$('#start-characters-btn')) {
    await page.click('#start-characters-btn', { force: true });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'initial_characters.png') });
    await page.click('#char-close-btn', { force: true });
    await page.waitForTimeout(400);
  }

  // 3. Hoverboard showroom
  console.log('Capturing: initial_hoverboards.png');
  if (await page.$('#start-boards-btn')) {
    await page.click('#start-boards-btn', { force: true });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'initial_hoverboards.png') });
    await page.click('#board-close-btn', { force: true });
    await page.waitForTimeout(400);
  }

  // 4. Events modal
  console.log('Capturing: initial_events.png');
  if (await page.$('#start-events-btn')) {
    await page.click('#start-events-btn', { force: true });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'initial_events.png') });
    await page.click('#events-close-btn', { force: true });
    await page.waitForTimeout(400);
  }

  // 5. Missions modal
  console.log('Capturing: initial_missions.png');
  if (await page.$('#start-missions-btn')) {
    await page.click('#start-missions-btn', { force: true });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'initial_missions.png') });
    await page.click('#missions-close-btn', { force: true });
    await page.waitForTimeout(400);
  }

  // 6. Upgrades modal
  console.log('Capturing: initial_upgrades.png');
  if (await page.$('#start-shop-btn')) {
    await page.click('#start-shop-btn', { force: true });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'initial_upgrades.png') });
    await page.click('#shop-close-btn', { force: true });
    await page.waitForTimeout(400);
  }

  // 7. Settings modal
  console.log('Capturing: initial_settings.png');
  if (await page.$('#start-settings-btn')) {
    await page.click('#start-settings-btn', { force: true });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'initial_settings.png') });
    await page.click('#settings-close-btn', { force: true });
    await page.waitForTimeout(400);
  }

  // 8. Gameplay HUD
  console.log('Capturing: initial_gameplay_hud.png');
  await page.click('#start-play-btn', { force: true });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'initial_gameplay_hud.png') });

  // 9. Pause Modal
  console.log('Capturing: initial_pause.png');
  await page.click('#hud-pause-btn', { force: true });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'initial_pause.png') });
  await page.click('#pause-resume-btn', { force: true });
  await page.waitForTimeout(400);

  // 10. Crash for Game Over
  console.log('Waiting for crash / game over...');
  // Trigger game over directly via window.__METRO_GAME__ or wait
  await page.evaluate(() => {
    if (window.__METRO_BUS__) {
      window.__METRO_BUS__.emit('CRASH');
    }
  });
  await page.waitForTimeout(1600);
  console.log('Capturing: initial_game_over.png');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'initial_game_over.png') });

  // 11. Mobile Viewport (iPhone 14)
  console.log('Capturing: initial_mobile_portrait.png');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({ path: path.join(ARTIFACTS_DIR, 'initial_mobile_portrait.png') });

  await browser.close();
  console.log('✅ Initial screen capture completed successfully!');
}

captureInitialScreens().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
