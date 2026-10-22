import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/7b654b27-5359-4f8b-9796-d5016a125022';

async function captureTask6Evidence() {
  console.log('🚀 Launching Playwright with Google Chrome to capture Task 6 Hoverboards Evidence...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  // Populate coins in localStorage so boards can be unlocked in the showroom demo
  await page.addInitScript(() => {
    localStorage.setItem('metro_runner_wallet', '25000');
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Capture Start Screen with 🛹 HOVERBOARDS button
  console.log('📸 1. Capturing Start Screen with Hoverboard Button...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task6_start_screen.png') });

  // 2. Click HOVERBOARDS button to open 3D showroom
  console.log('📸 2. Opening 3D Hoverboard Showroom...');
  await page.click('#start-boards-btn', { force: true });
  await page.waitForTimeout(1000); // Wait for WebGL 3D preview to render

  // 3. Capture Urban Glide in 3D Showroom
  console.log('📸 3. Capturing Urban Glide 3D Showroom...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task6_showroom_urban_glide.png') });

  // 4. Drag turntable to rotate Urban Glide
  console.log('📸 4. Rotating Urban Glide on 3D turntable...');
  const canvasBox = await page.locator('#board-preview-canvas').boundingBox();
  if (canvasBox) {
    const startX = canvasBox.x + canvasBox.width * 0.5;
    const startY = canvasBox.y + canvasBox.height * 0.5;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 150, startY, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task6_showroom_urban_glide_rotated.png') });

  // 5. Navigate to Pulse Rider
  console.log('📸 5. Navigating to Pulse Rider...');
  await page.click('#board-next-btn', { force: true });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task6_showroom_pulse_rider.png') });

  // 6. Unlock Pulse Rider
  console.log('📸 6. Unlocking Pulse Rider...');
  await page.locator('#board-action-btn').scrollIntoViewIfNeeded();
  await page.click('#board-action-btn', { force: true });
  await page.waitForTimeout(600);

  // 7. Navigate to Aero Drift
  console.log('📸 7. Navigating to Aero Drift...');
  await page.click('#board-next-btn', { force: true });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task6_showroom_aero_drift.png') });

  // 8. Navigate to Street Phantom
  console.log('📸 8. Navigating to Street Phantom...');
  await page.click('#board-next-btn', { force: true });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task6_showroom_street_phantom.png') });

  // 9. Buy +3 charges pack in showroom
  console.log('📸 9. Purchasing +3 Hoverboard charges pack...');
  await page.locator('#board-buy-charges-btn').scrollIntoViewIfNeeded();
  await page.click('#board-buy-charges-btn', { force: true });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task6_charges_purchased.png') });

  // 10. Close Showroom and start game
  console.log('📸 10. Closing Showroom and starting gameplay...');
  await page.click('#board-close-btn', { force: true });
  await page.waitForTimeout(400);

  // Start run by clicking Play Now
  await page.click('#start-play-btn', { force: true });
  await page.waitForTimeout(200);

  // 11. Deploy hoverboard via HUD button
  console.log('📸 11. Deploying Hoverboard via HUD button during gameplay...');
  await page.click('#hud-board-btn', { force: true });
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task6_gameplay_surfing_active.png') });

  // 12. Jump with active hoverboard
  console.log('📸 12. Surfing jump action...');
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task6_gameplay_surfing_jump.png') });

  console.log('🎉 All Task 6 Playwright visual evidence captured successfully!');
  await browser.close();
}

captureTask6Evidence().catch(err => {
  console.error('❌ Error during Task 6 evidence capture:', err);
  process.exit(1);
});
