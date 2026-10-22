import { chromium } from 'playwright';
import path from 'path';

const ARTIFACTS_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/7b654b27-5359-4f8b-9796-d5016a125022';

async function captureEvidence() {
  console.log('🚀 Launching Playwright with installed Google Chrome to capture Task 5 Evidence...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  // Populate coins in localStorage so characters and outfits can be unlocked in the demo
  await page.addInitScript(() => {
    localStorage.setItem('metro_runner_wallet', '25000');
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Capture Start Screen with CHARACTERS & SKINS button
  console.log('📸 Capturing Start Screen with Character Button...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_start_screen.png') });

  // 2. Click CHARACTERS & SKINS button to open 3D showroom
  console.log('📸 Opening 3D Character Showroom...');
  await page.click('#start-characters-btn');
  await page.waitForTimeout(800); // Wait for WebGL 3D preview to render

  // 3. Capture Jax Default in 3D Showroom
  console.log('📸 Capturing Jax 3D Showroom...');
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_showroom_jax.png') });

  // 4. Drag turntable to rotate Jax
  console.log('📸 Rotating Jax on 3D turntable...');
  const canvasBox = await page.locator('#char-preview-canvas').boundingBox();
  if (canvasBox) {
    const startX = canvasBox.x + canvasBox.width * 0.5;
    const startY = canvasBox.y + canvasBox.height * 0.5;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 140, startY, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_showroom_jax_rotated.png') });

  // 5. Select Jax Golden Graffiti outfit
  console.log('📸 Selecting Golden Graffiti outfit...');
  await page.locator('.outfit-card').nth(2).click(); // Golden Graffiti
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_showroom_jax_golden.png') });

  // 6. Navigate to Luna
  console.log('📸 Navigating to Luna (Cyberpunk Hacker)...');
  await page.click('#char-next-btn');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_showroom_luna.png') });

  // Unlock and Equip Luna
  console.log('📸 Unlocking and equipping Luna...');
  await page.click('#char-action-btn'); // Purchase Luna for 1,500 coins
  await page.waitForTimeout(500);

  // 7. Navigate to Cruz
  console.log('📸 Navigating to Cruz (Metro B-Boy)...');
  await page.click('#char-next-btn');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_showroom_cruz.png') });

  // Unlock Cruz
  await page.click('#char-action-btn'); // Purchase Cruz
  await page.waitForTimeout(500);

  // 8. Navigate to Nova
  console.log('📸 Navigating to Nova (Solar Velocity Rider)...');
  await page.click('#char-next-btn');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_showroom_nova.png') });

  // Unlock and Equip Nova
  await page.click('#char-action-btn'); // Purchase Nova
  await page.waitForTimeout(500);

  // 9. Close Showroom and start game with equipped Nova!
  console.log('📸 Starting gameplay with newly equipped character Nova...');
  await page.click('#char-close-btn');
  await page.waitForTimeout(400);

  // Click Play Now with force: true since button has infinite pulse animation
  await page.click('#start-play-btn', { force: true });
  await page.waitForTimeout(500); // Runner dashes down track

  // Activate hoverboard to verify accessory
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'task5_gameplay_custom_character.png') });

  await browser.close();
  console.log('🎉 All Task 5 visual evidence screenshots captured successfully!');
}

captureEvidence().catch((err) => {
  console.error('Evidence capture failed:', err);
  process.exit(1);
});
