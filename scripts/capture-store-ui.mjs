import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/44973ef8-ec7d-4412-a558-7c3bb56dfcc5';

async function captureStoreUI() {
  console.log('Launching browser to capture Phase 4 Premium World Store UI screenshots...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
    page.on('console', (msg) => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', (err) => console.log('BROWSER ERROR:', err.message));

    // Set initial progression state: 4 free worlds unlocked, Neon Rainline unlocked, 12,000 coins in wallet
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: [
          'MODERN_METRO',
          'HISTORIC_QUARTER',
          'UNDERGROUND_METRO',
          'NEON_INDUSTRIAL',
          'NEON_RAINLINE'
        ],
        selectedTheme: 'NEON_RAINLINE',
        includePremiumThemesInDynamic: true,
        keys: 15
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_wallet', '12500');
      localStorage.setItem('metro_runner_environment_preference', 'NEON_RAINLINE');
    });

    console.log('Navigating to http://localhost:4173/ ...');
    await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    // 1. Open Shop Modal from Start Screen
    console.log('Clicking #start-shop-btn...');
    const startShopBtn = await page.waitForSelector('#start-shop-btn', { timeout: 5000 });
    await startShopBtn.click();
    await page.waitForTimeout(500);

    // Click WORLDS tab in Shop Modal
    console.log('Clicking WORLDS tab in Shop Modal...');
    const worldsTab = await page.waitForSelector('[data-cat="WORLDS"]', { timeout: 5000 });
    await worldsTab.click();

    await page.waitForSelector('.worlds-shop-grid', { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Capture Worlds Store Grid
    const storeCard = await page.$('.shop-card');
    if (storeCard) {
      const storePath = path.join(ARTIFACT_DIR, 'worlds_store_grid.png');
      await storeCard.screenshot({ path: storePath });
      console.log(`Saved: ${storePath}`);
    }

    // 2. Open Purchase Confirmation Modal
    console.log('Opening Purchase Confirmation Modal for Orbital Halo...');
    const buyBtn = await page.$('[data-buy-world="ORBITAL_HALO"]');
    if (buyBtn) {
      await buyBtn.click();
      await page.waitForSelector('#world-confirm-overlay', { timeout: 3000 });
      await page.waitForTimeout(500);

      const confirmCard = await page.$('.world-confirm-card');
      if (confirmCard) {
        const confirmPath = path.join(ARTIFACT_DIR, 'world_purchase_confirmation.png');
        await confirmCard.screenshot({ path: confirmPath });
        console.log(`Saved: ${confirmPath}`);
      }

      // Close confirmation dialog
      const cancelBtn = await page.$('#confirm-cancel-btn');
      if (cancelBtn) await cancelBtn.click();
      await page.waitForTimeout(400);
    }

    // 3. Open 3D Showcase Preview Modal for Abyssal Glassline
    console.log('Opening 3D Showcase Preview for Abyssal Glassline...');
    const previewBtn = await page.$('[data-preview-world="ABYSSAL_GLASSLINE"]');
    if (previewBtn) {
      await previewBtn.click();
      await page.waitForSelector('#world-showcase-overlay', { timeout: 3000 });
      await page.waitForTimeout(600);

      const showcaseCard = await page.$('.world-showcase-card');
      if (showcaseCard) {
        const showcasePath = path.join(ARTIFACT_DIR, 'world_showcase_preview.png');
        await showcaseCard.screenshot({ path: showcasePath });
        console.log(`Saved: ${showcasePath}`);
      }

      // Close showcase modal
      const showcaseClose = await page.$('#showcase-close-btn');
      if (showcaseClose) await showcaseClose.click();
      await page.waitForTimeout(400);
    }

    // Close Shop Modal
    const shopClose = await page.$('#shop-close-btn');
    if (shopClose) await shopClose.click();
    await page.waitForTimeout(500);

    // 4. Open Environment Select Modal
    console.log('Clicking #lobby-env-snippet...');
    const envSnippet = await page.waitForSelector('#lobby-env-snippet', { timeout: 5000 });
    await envSnippet.click();

    await page.waitForSelector('.env-modal-card', { timeout: 5000 });
    await page.waitForTimeout(800);

    const envModalCard = await page.$('.env-modal-card');
    if (envModalCard) {
      const envPath = path.join(ARTIFACT_DIR, 'environment_select_modal.png');
      await envModalCard.screenshot({ path: envPath });
      console.log(`Saved: ${envPath}`);
    }

    console.log('All store screenshots successfully captured and saved to artifacts!');
  } finally {
    await browser.close();
  }
}

captureStoreUI().catch((err) => {
  console.error('Error capturing UI:', err);
  process.exit(1);
});
