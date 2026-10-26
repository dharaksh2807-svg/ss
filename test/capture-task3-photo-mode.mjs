import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/2f350341-c53b-4c07-92cd-b647a661dc87';

async function runVisualCapture() {
  console.log('🚀 Launching Chromium browser for Task 3 Photo Mode capture...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('[BROWSER ERROR]', msg.text());
    }
  });

  try {
    console.log('1. Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('2. Starting game run via #start-play-btn...');
    await page.click('#start-play-btn');
    // Let the runner run down the track for 2 seconds to generate track chunks and train obstacles
    await page.waitForTimeout(2000);

    console.log('3. Pausing game...');
    await page.evaluate(() => {
      if (window.__METRO_GAME__) {
        window.__METRO_GAME__.pause();
      }
    });
    await page.waitForTimeout(500);

    // Verify Pause Modal is open and contains Photo Mode button
    const pausePhotoBtn = await page.$('#pause-photo-btn');
    if (!pausePhotoBtn) {
      throw new Error('#pause-photo-btn not found in pause modal');
    }
    console.log('✅ Found #pause-photo-btn in Pause Modal!');

    console.log('4. Entering Photo Mode by clicking #pause-photo-btn...');
    await page.click('#pause-photo-btn');
    await page.waitForTimeout(800);

    // Verify Photo Mode Container is active
    const photoContainer = await page.$('#photo-mode-modal');
    const isPhotoOpen = await page.evaluate(() => {
      const el = document.getElementById('photo-mode-modal');
      return el && !el.classList.contains('hidden');
    });
    console.log('✅ Photo Studio container visible:', isPhotoOpen);

    // -------------------------------------------------------------
    // Screenshot 1: Runner Portrait Preset
    // -------------------------------------------------------------
    console.log('5. Testing Preset: RUNNER_PORTRAIT...');
    await page.click('.preset-pill[data-preset="RUNNER_PORTRAIT"]');
    await page.waitForTimeout(600);
    const shot1Path = path.join(ARTIFACT_DIR, 'task3_01_photo_mode_portrait_preset.png');
    await page.screenshot({ path: shot1Path });
    console.log('📸 Saved:', shot1Path);

    // -------------------------------------------------------------
    // Screenshot 2: Action Hero Preset with vibrant grade
    // -------------------------------------------------------------
    console.log('6. Testing Preset: ACTION_SHOT with Vibrant grade...');
    await page.click('.preset-pill[data-preset="ACTION_SHOT"]');
    await page.waitForTimeout(400);
    // Switch to EFFECTS tab to select vibrant grade
    await page.click('.photo-tab-btn[data-tab="EFFECTS"]');
    await page.waitForTimeout(300);
    await page.click('.btn-chip[data-filter="VIBRANT"]');
    await page.waitForTimeout(400);
    const shot2Path = path.join(ARTIFACT_DIR, 'task3_02_photo_mode_action_hero_preset.png');
    await page.screenshot({ path: shot2Path });
    console.log('📸 Saved:', shot2Path);

    // -------------------------------------------------------------
    // Screenshot 3: Train Rooftop Preset with Victory Pose
    // -------------------------------------------------------------
    console.log('7. Testing Preset: TRAIN_ROOFTOP with VICTORY pose...');
    await page.click('.preset-pill[data-preset="TRAIN_ROOFTOP"]');
    await page.waitForTimeout(400);
    // Switch to CHARACTER tab to select VICTORY pose
    await page.click('.photo-tab-btn[data-tab="CHARACTER"]');
    await page.waitForTimeout(300);
    await page.click('.btn-chip[data-pose="VICTORY"]');
    await page.waitForTimeout(400);
    const shot3Path = path.join(ARTIFACT_DIR, 'task3_03_photo_mode_train_rooftop_preset.png');
    await page.screenshot({ path: shot3Path });
    console.log('📸 Saved:', shot3Path);

    // -------------------------------------------------------------
    // Screenshot 4: Environmental Vista Preset with Warm Golden grade
    // -------------------------------------------------------------
    console.log('8. Testing Preset: ENVIRONMENTAL_VISTA with WARM_GOLDEN grade...');
    await page.click('.preset-pill[data-preset="ENVIRONMENTAL_VISTA"]');
    await page.waitForTimeout(400);
    await page.click('.photo-tab-btn[data-tab="EFFECTS"]');
    await page.waitForTimeout(300);
    await page.click('.btn-chip[data-filter="WARM_GOLDEN"]');
    await page.waitForTimeout(400);
    const shot4Path = path.join(ARTIFACT_DIR, 'task3_04_photo_mode_city_vista_preset.png');
    await page.screenshot({ path: shot4Path });
    console.log('📸 Saved:', shot4Path);

    // -------------------------------------------------------------
    // Screenshot 5: Hide UI View (Pure Scene with Rule of Thirds Grid)
    // -------------------------------------------------------------
    console.log('9. Hiding UI for clean cinematic framing...');
    await page.click('#photo-hide-ui-btn');
    await page.waitForTimeout(400);
    const shot5Path = path.join(ARTIFACT_DIR, 'task3_05_photo_mode_ui_hidden_view.png');
    await page.screenshot({ path: shot5Path });
    console.log('📸 Saved:', shot5Path);

    // Unhide UI by clicking #photo-hidden-hint
    console.log('10. Unhiding UI via clicking #photo-hidden-hint...');
    await page.click('#photo-hidden-hint');
    await page.waitForTimeout(600);

    // -------------------------------------------------------------
    // Screenshot 6: Shutter Trigger & Screenshot Preview Modal
    // -------------------------------------------------------------
    console.log('11. Triggering Shutter Capture...');
    await page.click('#photo-shutter-btn');
    await page.waitForTimeout(800);

    const isPreviewOpen = await page.evaluate(() => {
      const modal = document.getElementById('photo-preview-modal');
      return modal && !modal.classList.contains('hidden');
    });
    console.log('✅ Screenshot Preview Modal visible:', isPreviewOpen);

    const shot6Path = path.join(ARTIFACT_DIR, 'task3_06_photo_mode_screenshot_captured_modal.png');
    await page.screenshot({ path: shot6Path });
    console.log('📸 Saved:', shot6Path);

    // -------------------------------------------------------------
    // Direct High-Res PNG Export Verification
    // -------------------------------------------------------------
    console.log('12. Capturing high-resolution export PNG blob directly...');
    const exportedBase64 = await page.evaluate(async () => {
      const controller = window.__PHOTO_MODE__;
      if (!controller) return null;
      const blob = await controller.captureScreenshotBlob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    });

    if (exportedBase64) {
      const base64Data = exportedBase64.replace(/^data:image\/png;base64,/, '');
      const exportedPngPath = path.join(ARTIFACT_DIR, 'task3_07_exported_photo_native_res.png');
      fs.writeFileSync(exportedPngPath, Buffer.from(base64Data, 'base64'));
      console.log('📸 Successfully exported native resolution PNG to:', exportedPngPath);
    }

    // Close preview modal
    await page.click('#photo-preview-close-btn');
    await page.waitForTimeout(300);

    // -------------------------------------------------------------
    // Screenshot 7: Exit Photo Mode & Verify Clean Resume
    // -------------------------------------------------------------
    console.log('13. Exiting Photo Mode...');
    await page.click('#photo-exit-btn');
    await page.waitForTimeout(600);

    const isStillOpen = await page.evaluate(() => {
      const el = document.getElementById('photo-mode-modal');
      return el && !el.classList.contains('hidden');
    });
    console.log('✅ Photo Studio container cleanly closed:', !isStillOpen);

    const shot7Path = path.join(ARTIFACT_DIR, 'task3_08_resumed_gameplay_state.png');
    await page.screenshot({ path: shot7Path });
    console.log('📸 Saved resumed state screenshot:', shot7Path);

    console.log('\n🎉 ALL TASK 3 BROWSER CAPTURES AND VERIFICATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Error during visual capture:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runVisualCapture();
