import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/53f6edef-a435-46e1-baae-a5444c0ad3a2';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function captureLocomotion() {
  console.log('🚀 Launching Playwright to record Task 2 gameplay video & slow-motion diagnostic frames...');

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

  // Capture lobby idle stance
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_01_lobby_idle.png') });
  console.log('📸 Captured: task2_01_lobby_idle.png');

  // Start the run
  console.log('2. Starting game run...');
  await page.click('#start-play-btn', { force: true });
  await page.waitForTimeout(800);

  // Capture running sprint cycle
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_02_running_sprint.png') });
  console.log('📸 Captured: task2_02_running_sprint.png');

  // Execute Jump sequence
  console.log('3. Triggering Jump sequence...');
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(150); // Ascending
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_03_jump_ascending.png') });
  console.log('📸 Captured: task2_03_jump_ascending.png');

  await page.waitForTimeout(150); // Apex
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_04_jump_apex.png') });
  console.log('📸 Captured: task2_04_jump_apex.png');

  await page.waitForTimeout(180); // Descending
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_05_jump_descending.png') });
  console.log('📸 Captured: task2_05_jump_descending.png');

  await page.waitForTimeout(140); // Landing absorption
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_06_jump_landing.png') });
  console.log('📸 Captured: task2_06_jump_landing.png');

  // Execute Slide sequence
  console.log('4. Triggering Slide sequence...');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(180); // Full slide hold
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_07_slide_hold.png') });
  console.log('📸 Captured: task2_07_slide_hold.png');

  await page.waitForTimeout(400); // Slide recovery to run
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_08_slide_recovery.png') });
  console.log('📸 Captured: task2_08_slide_recovery.png');

  // Execute Airborne Lane Change
  console.log('5. Triggering Airborne Lane Change...');
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(120);
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(180);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_09_airborne_lane_change.png') });
  console.log('📸 Captured: task2_09_airborne_lane_change.png');

  await page.waitForTimeout(400);

  // Execute Fast-Drop
  console.log('6. Triggering Fast-Drop Dive...');
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowDown'); // Fast drop
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_10_fast_drop_dive.png') });
  console.log('📸 Captured: task2_10_fast_drop_dive.png');

  await page.waitForTimeout(500);

  // Activate Hoverboard
  console.log('7. Activating Hoverboard...');
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_11_hoverboard_surfing.png') });
  console.log('📸 Captured: task2_11_hoverboard_surfing.png');

  // Let run record for 3 seconds of continuous gameplay footage
  await page.waitForTimeout(3000);

  console.log('8. Closing context to flush video recording...');
  const video = page.video();
  await context.close();
  await browser.close();

  if (video) {
    const videoPath = await video.path();
    const finalVideoPath = path.join(ARTIFACT_DIR, 'task2_gameplay_recording.webm');
    if (fs.existsSync(videoPath)) {
      fs.copyFileSync(videoPath, finalVideoPath);
      console.log(`🎬 Video saved: ${finalVideoPath}`);
    }
  }

  console.log('✨ All diagnostic frames and video capture complete!');
}

captureLocomotion().catch((err) => {
  console.error('Error during locomotion capture:', err);
  process.exit(1);
});
