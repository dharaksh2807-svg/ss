import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/15f68223-2aed-4e81-b59f-95d56faee1ac';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function captureNeonRainline() {
  console.log('🚀 Starting Real-Browser Walkthrough of NEON RAINLINE...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // Pre-seed localStorage before page load so ProgressionManager and Game start in NEON_RAINLINE
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL', 'NEON_RAINLINE'],
        selectedTheme: 'NEON_RAINLINE',
        includePremiumThemesInDynamic: true
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'NEON_RAINLINE');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch run
    console.log('Launching run in NEON RAINLINE...');
    await page.evaluate(() => {
      if (window.__DEV_SET_DISTRICT__) {
        window.__DEV_SET_DISTRICT__('NEON_RAINLINE');
      }
      const playBtn = document.getElementById('start-play-btn');
      if (playBtn) {
        playBtn.click();
      } else if (window.__METRO_GAME__) {
        window.__METRO_GAME__.startRun('NORMAL');
      }
    });

    await page.waitForTimeout(2500);

    // Confirm diagnostics
    const diag = await page.evaluate(() => {
      const director = window.__ENV_DIRECTOR__;
      const game = window.__METRO_GAME__;
      return director ? director.getDiagnostics(game ? game.getPlayer().position.z : 0) : null;
    });
    console.log('Environment Diagnostics:', JSON.stringify(diag, null, 2));

    // 1. Capture Standard Gameplay Screenshot
    console.log('📸 1. Capturing Standard Gameplay Screenshot...');
    const shot1Path = path.join(ARTIFACT_DIR, 'neon_rainline_gameplay.png');
    await page.screenshot({ path: shot1Path });
    console.log('Saved:', shot1Path);

    // 2. Position player onto a train rooftop to capture train & rooftop perspective
    console.log('Positioning player onto train rooftop for Train Rooftop perspective...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      if (game) {
        const p = game.getPlayer();
        p.position.set(0, 4.35, -120.0);
        p.currentLane = 0;
        p.targetLane = 0;
        p.speed = 16.0;
        p.isGrounded = true;
        p.updateCollider();
      }
    });

    await page.waitForTimeout(1500);

    console.log('📸 2. Capturing Train Rooftop Screenshot...');
    const shot2Path = path.join(ARTIFACT_DIR, 'neon_rainline_train_rooftop.png');
    await page.screenshot({ path: shot2Path });
    console.log('Saved:', shot2Path);

    // 3. Mobile Viewport Screenshot
    console.log('📸 3. Capturing Mobile Viewport Screenshot...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    const shot3Path = path.join(ARTIFACT_DIR, 'neon_rainline_mobile.png');
    await page.screenshot({ path: shot3Path });
    console.log('Saved:', shot3Path);

    console.log('🎉 Browser Walkthrough Completed Successfully!');
  } finally {
    await browser.close();
  }
}

captureNeonRainline().catch((err) => {
  console.error('Walkthrough error:', err);
  process.exit(1);
});
