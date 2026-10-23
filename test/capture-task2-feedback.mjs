import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/53f6edef-a435-46e1-baae-a5444c0ad3a2';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function captureFeedback() {
  console.log('🚀 Launching Playwright for Task 2 Jump, Slide, Fast-Drop & Landing Feedback captures...');

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
  await page.waitForTimeout(800);

  // 1. Lobby Idle
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_feedback_01_lobby.png') });
  console.log('📸 1. Lobby Idle');

  // Start run
  await page.click('#start-play-btn', { force: true });
  await page.waitForTimeout(600);

  // 2. Sprinting Stride Contact
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_feedback_02_running_stride.png') });
  console.log('📸 2. Running Stride');

  // 3. Jump Takeoff (explosive coil)
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(40); // Within takeoff window
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_feedback_03_jump_takeoff.png') });
  console.log('📸 3. Jump Takeoff Pose');

  // 4. Jump Apex (weightless hang)
  await page.waitForTimeout(240); // Apex crest
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_feedback_04_jump_apex.png') });
  console.log('📸 4. Jump Apex Pose');

  // 5. Landing Compression & Radial Dust VFX
  await page.waitForTimeout(280); // Exact landing impact
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_feedback_05_landing_dust.png') });
  console.log('📸 5. Landing Compression & Dust VFX');

  await page.waitForTimeout(300);

  // 6. Slide Low-Silhouette & Friction VFX
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(160); // In SLIDE_HOLD
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_feedback_06_slide_silhouette.png') });
  console.log('📸 6. Slide Low-Silhouette & Friction VFX');

  await page.waitForTimeout(400); // Recovery

  // 7. Fast Drop Dive
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(220); // Airborne
  await page.keyboard.press('ArrowDown'); // Trigger dive
  await page.waitForTimeout(60); // Streamlined dive posture
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_feedback_07_fast_drop_dive.png') });
  console.log('📸 7. Fast-Drop Dive Arrow');

  // 8. Fast Drop High-Impact Landing Squash
  await page.waitForTimeout(100); // Impact
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_feedback_08_fast_drop_landing.png') });
  console.log('📸 8. Fast-Drop Landing Squash');

  await page.waitForTimeout(500);

  // 9. Hoverboard Activation & Low Crouch Slide
  await page.keyboard.press('Space'); // Deploy hoverboard
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_feedback_09_hoverboard_riding.png') });
  console.log('📸 9. Hoverboard Riding');

  await page.keyboard.press('ArrowDown'); // Slide on hoverboard
  await page.waitForTimeout(180);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_feedback_10_hoverboard_slide_crouch.png') });
  console.log('📸 10. Hoverboard Slide Crouch');

  await page.waitForTimeout(600);

  await context.close();
  await browser.close();
  console.log('✅ Task 2 Feedback capture completed successfully!');
}

captureFeedback().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
