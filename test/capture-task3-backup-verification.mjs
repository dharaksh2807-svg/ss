import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/2f350341-c53b-4c07-92cd-b647a661dc87';
const PORT = 3000;
const URL = `http://localhost:${PORT}/`;

async function run() {
  console.log('🚀 Launching browser to verify Task 3 Backup & Restore UI...');
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

  // 1. Open Settings modal
  console.log('⚙️ Opening Settings modal...');
  await page.click('#start-settings-btn');
  await page.waitForSelector('#settings-modal:not(.hidden)', { state: 'visible', timeout: 5000 });

  // 2. Click Data & Backup tab
  console.log('💾 Switching to Data & Backup tab...');
  await page.click('#tab-btn-backup');
  await page.waitForTimeout(500);

  // Capture Backup Tab
  const backupTabShot = path.join(ARTIFACT_DIR, 'task3_backup_tab.png');
  await page.screenshot({ path: backupTabShot });
  console.log(`📸 Captured Backup Tab: ${backupTabShot}`);

  // 3. Test Export Save
  console.log('📥 Testing Export Save button...');
  await page.click('#btn-export-save');
  await page.waitForTimeout(600);

  // Verify feedback banner
  const feedbackText = await page.$eval('#backup-feedback-text', el => el.textContent);
  console.log('Feedback after export:', feedbackText);

  // 4. Test Import Save with Preview
  console.log('📤 Preparing mock backup JSON payload for import preview...');
  const mockBackup = {
    meta: {
      backupVersion: 1,
      gameVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      appId: 'metro_runner_3d'
    },
    data: {
      progression: {
        version: 1,
        currentMissionSet: 5,
        keys: 25,
        hoverboardCharges: 15,
        unlockedCharacters: ['char_jax', 'char_luna', 'char_cruz', 'char_nova'],
        selectedCharacter: 'char_nova',
        unlockedBoards: ['board_urban_glide', 'board_pulse_rider'],
        selectedBoard: 'board_pulse_rider',
        lifetimeStats: {
          totalCoins: 85000,
          bestScore: 350000,
          totalDistance: 125000
        }
      },
      wallet: {
        coins: 85000
      },
      upgrades: {
        MAGNET: 5,
        JETPACK: 5,
        SNEAKERS: 5,
        MULTIPLIER: 5,
        SHIELD: 5
      }
    }
  };

  const tempSavePath = '/tmp/metro-runner-test-backup.json';
  fs.writeFileSync(tempSavePath, JSON.stringify(mockBackup, null, 2));

  // Upload file via hidden input
  console.log('Uploading backup file to file input...');
  const fileChooserInput = await page.$('#input-import-file');
  await fileChooserInput.setInputFiles(tempSavePath);
  await page.waitForTimeout(600);

  // Verify preview card is visible
  const isPreviewVisible = await page.$eval('#import-preview-card', el => !el.classList.contains('hidden'));
  console.log('Is import preview card visible:', isPreviewVisible);

  // Capture Import Preview
  const previewShot = path.join(ARTIFACT_DIR, 'task3_import_preview.png');
  await page.screenshot({ path: previewShot });
  console.log(`📸 Captured Import Preview: ${previewShot}`);

  // 5. Click Confirm & Restore
  console.log('✓ Clicking Confirm & Restore button...');
  await page.click('#btn-confirm-import');
  await page.waitForTimeout(600);

  // Capture Restore Success
  const restoreShot = path.join(ARTIFACT_DIR, 'task3_restore_success.png');
  await page.screenshot({ path: restoreShot });
  console.log(`📸 Captured Restore Success: ${restoreShot}`);

  // Verify updated chips
  const restoredCoins = await page.$eval('#chip-coins', el => el.textContent);
  const restoredKeys = await page.$eval('#chip-keys', el => el.textContent);
  const restoredChars = await page.$eval('#chip-chars', el => el.textContent);
  console.log(`Restored Profile Chips: Coins=${restoredCoins}, Keys=${restoredKeys}, Chars=${restoredChars}`);

  await browser.close();
  try { fs.unlinkSync(tempSavePath); } catch {}
  console.log('🎉 Browser verification completed successfully!');
}

run().catch(err => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
