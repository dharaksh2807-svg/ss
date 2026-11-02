import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/44973ef8-ec7d-4412-a558-7c3bb56dfcc5';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function captureDoomsday() {
  console.log('☄️ Starting Real-Browser Walkthrough of DOOMSDAY: LAST TRANSIT...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // Pre-seed localStorage before page load so ProgressionManager and Game start in DOOMSDAY_LAST_TRANSIT
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
          'DOOMSDAY_LAST_TRANSIT'
        ],
        selectedTheme: 'DOOMSDAY_LAST_TRANSIT',
        includePremiumThemesInDynamic: true
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'DOOMSDAY_LAST_TRANSIT');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch run in DOOMSDAY_LAST_TRANSIT
    console.log('Launching run in DOOMSDAY: LAST TRANSIT...');
    await page.evaluate(() => {
      if (window.__DEV_SET_DISTRICT__) {
        window.__DEV_SET_DISTRICT__('DOOMSDAY_LAST_TRANSIT');
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

    // 1. Capture Standard Gameplay Screenshot (running camera view)
    console.log('📸 1. Capturing Doomsday Running Camera Screenshot...');
    const shot1Path = path.join(ARTIFACT_DIR, 'doomsday_gameplay.png');
    await page.screenshot({ path: shot1Path });
    console.log('Saved:', shot1Path);

    // 2. Capture Second Distinct Landmark Segment (e.g. train rooftop view near shattered skyscraper / bunker gateway)
    console.log('Positioning player for Landmark / Train Rooftop perspective in Doomsday...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      if (game) {
        const p = game.getPlayer();
        p.isInvulnerable = true;
        p.position.set(-1.8, 4.35, -180.0);
        p.currentLane = -1;
        p.targetLane = -1;
        p.speed = 0;
        p.isGrounded = true;
        p.updateCollider();
      }
    });

    await page.waitForTimeout(1000);

    console.log('📸 2. Capturing Landmark Segment / Train Rooftop Screenshot...');
    const shot2Path = path.join(ARTIFACT_DIR, 'doomsday_landmark_segment.png');
    await page.screenshot({ path: shot2Path });
    console.log('Saved:', shot2Path);

    // 3. Low Graphics Preset Screenshot
    console.log('Switching to Low Graphics Preset...');
    await page.evaluate(() => {
      const scene = window.__WORLD_SCENE__;
      if (scene) {
        scene.setGraphicsQuality('LOW');
      }
      const game = window.__METRO_GAME__;
      if (game) {
        const p = game.getPlayer();
        p.isInvulnerable = true;
        p.position.set(0, 0, -60.0);
        p.currentLane = 0;
        p.targetLane = 0;
        p.speed = 0;
        p.isGrounded = true;
        p.updateCollider();
      }
    });
    await page.waitForTimeout(1000);

    console.log('📸 3. Capturing Low Graphics Preset Screenshot...');
    const shot3Path = path.join(ARTIFACT_DIR, 'doomsday_low_graphics.png');
    await page.screenshot({ path: shot3Path });
    console.log('Saved:', shot3Path);

    console.log('✨ All 3 Doomsday screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

captureDoomsday().catch((err) => {
  console.error('Failed to capture Doomsday screenshots:', err);
  process.exit(1);
});
