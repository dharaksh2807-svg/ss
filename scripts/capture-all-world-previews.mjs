import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const TARGET_DIR = path.resolve('public/worlds');
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

const WORLDS = [
  { id: 'MODERN_METRO', file: 'modern_metro.png' },
  { id: 'HISTORIC_QUARTER', file: 'historic_quarter.png' },
  { id: 'UNDERGROUND_METRO', file: 'underground_metro.png' },
  { id: 'NEON_INDUSTRIAL', file: 'neon_industrial.png' },
  { id: 'NEON_RAINLINE', file: 'neon_rainline.png' }
];

async function capturePreviews() {
  console.log('Capturing in-game screenshots for remaining worlds...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.addInitScript(() => {
      const state = {
        unlockedThemes: [
          'MODERN_METRO',
          'HISTORIC_QUARTER',
          'UNDERGROUND_METRO',
          'NEON_INDUSTRIAL',
          'NEON_RAINLINE',
          'ORBITAL_HALO',
          'ABYSSAL_GLASSLINE',
          'DOOMSDAY_LAST_TRANSIT',
          'PHANTOM_LINE',
          'HAUNTED_CARNIVAL'
        ],
        selectedTheme: 'MODERN_METRO',
        includePremiumThemesInDynamic: true
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'MODERN_METRO');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    for (const w of WORLDS) {
      console.log(`Setting environment to ${w.id}...`);
      await page.evaluate((themeId) => {
        if (window.__DEV_SET_DISTRICT__) {
          window.__DEV_SET_DISTRICT__(themeId);
        } else if (window.__PREVIEW_ENVIRONMENT__) {
          window.__PREVIEW_ENVIRONMENT__(themeId);
        }
        const playBtn = document.getElementById('start-play-btn');
        if (playBtn && !playBtn.classList.contains('hidden')) {
          playBtn.click();
        } else if (window.__METRO_GAME__) {
          window.__METRO_GAME__.startRun('NORMAL');
        }
        const modal = document.querySelector('.modal-overlay, #revive-modal, #save-me-modal, #shop-modal, #environment-modal');
        if (modal && modal instanceof HTMLElement) modal.style.display = 'none';
      }, w.id);

      await page.waitForTimeout(2500);

      const filePath = path.join(TARGET_DIR, w.file);
      await page.screenshot({ path: filePath });
      console.log(`Saved ${w.id} screenshot to ${filePath}`);
    }

    console.log('All remaining world previews captured successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

capturePreviews();
