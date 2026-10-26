import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || '/Users/dharaksh/.gemini/antigravity-ide/brain/450a1b76-842f-4bc0-b6c1-93ba47a7d2de';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}
const PORT = 3000;
const URL = `http://localhost:${PORT}/`;

async function run() {
  console.log('🚀 Launching browser to verify Task 1 Bug Snapshot & Developer Diagnostics UI...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser Error:', msg.text());
    }
  });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. Press F9 to open Developer Bug Report Modal
  console.log('🐛 Pressing F9 to open Developer Bug Report Modal...');
  await page.keyboard.press('F9');
  await page.waitForTimeout(500);

  // Verify modal is visible
  await page.waitForSelector('#dev-bug-report-modal:not(.hidden)', { state: 'visible', timeout: 5000 });
  const modalShot = path.join(ARTIFACT_DIR, 'task1_bug_report_modal.png');
  await page.screenshot({ path: modalShot });
  console.log(`📸 Captured Bug Report Modal: ${modalShot}`);

  // 2. Test Copy AI Summary button
  console.log('📋 Testing Copy AI Summary button...');
  await page.click('#dev-bug-copy-ai-btn');
  await page.waitForTimeout(500);

  const toastText = await page.$eval('#dev-bug-feedback', el => el.textContent);
  console.log('Toast Feedback:', toastText);

  // 3. Test Wireframes Toggle
  console.log('📦 Testing 3D Wireframes Toggle button...');
  await page.click('#dev-bug-wireframes-btn');
  await page.waitForTimeout(500);

  // Close modal
  await page.click('#dev-bug-close-btn');
  await page.waitForTimeout(500);

  // Verify Telemetry HUD is visible
  const telemetryVisible = await page.$eval('#debug-visualizer-telemetry', el => el.style.display !== 'none');
  console.log('Telemetry HUD Overlay Visible:', telemetryVisible);

  const wireframeShot = path.join(ARTIFACT_DIR, 'task1_debug_wireframes.png');
  await page.screenshot({ path: wireframeShot });
  console.log(`📸 Captured 3D Debug Visualizer Telemetry: ${wireframeShot}`);

  // 4. Test Starting a Run and Triggering Bug Snapshot
  console.log('▶️ Starting a run...');
  const playBtn = await page.$('#start-play-btn');
  if (playBtn) {
    await page.click('#start-play-btn', { force: true });
    console.log('🎮 Clicked #start-play-btn');
  }
  await page.waitForTimeout(500);
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);
  await page.keyboard.press('Space');

  // Wait for active PLAYING state
  await page.waitForFunction(() => {
    const game = window.__METRO_GAME__;
    return game && game.lifecycleState === 'PLAYING';
  }, { timeout: 10000 });
  console.log('🏃 Active running state confirmed');

  // Let player run for ~1.5 seconds to populate circular buffer frames
  await page.waitForTimeout(1500);

  // Capture bug snapshot during active gameplay
  console.log('🐛 Triggering F9 during active gameplay...');
  await page.keyboard.press('F9');
  await page.waitForSelector('#dev-bug-report-modal:not(.hidden)', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(500);

  const activeModalShot = path.join(ARTIFACT_DIR, 'task1_active_bug_snapshot.png');
  await page.screenshot({ path: activeModalShot });
  console.log(`📸 Captured Active Gameplay Bug Snapshot: ${activeModalShot}`);

  // 5. Test Reproduce Scenario button
  console.log('🔁 Clicking Reproduce Scenario button...');
  const isReproduceDisabled = await page.$eval('#dev-bug-reproduce-btn', el => el.hasAttribute('disabled'));
  console.log('Reproduce button disabled?', isReproduceDisabled);

  await page.click('#dev-bug-reproduce-btn');
  await page.waitForTimeout(1000);

  const reproShot = path.join(ARTIFACT_DIR, 'task1_reproduction_mode.png');
  await page.screenshot({ path: reproShot });
  console.log(`📸 Captured Reproduction Mode: ${reproShot}`);

  await browser.close();
  console.log('🎉 Browser verification completed successfully!');
}

run().catch(err => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
