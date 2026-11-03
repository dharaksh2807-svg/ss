import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/44973ef8-ec7d-4412-a558-7c3bb56dfcc5';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function captureHauntedCarnival() {
  console.log('🎃 Starting Real-Browser Walkthrough of HAUNTED CARNIVAL...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // Pre-seed localStorage before page load so ProgressionManager and Game start in HAUNTED_CARNIVAL
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
        selectedTheme: 'HAUNTED_CARNIVAL',
        includePremiumThemesInDynamic: true
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'HAUNTED_CARNIVAL');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch run in HAUNTED_CARNIVAL
    console.log('Launching run in HAUNTED CARNIVAL...');
    await page.evaluate(() => {
      if (window.__DEV_SET_DISTRICT__) {
        window.__DEV_SET_DISTRICT__('HAUNTED_CARNIVAL');
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
    console.log('📸 1. Capturing Haunted Carnival Running Camera Screenshot...');
    const shot1Path = path.join(ARTIFACT_DIR, 'haunted_carnival_gameplay.png');
    await page.screenshot({ path: shot1Path });
    console.log('Saved:', shot1Path);

    // 2. Capture Second Distinct Landmark Segment (e.g. Victorian Manor / Spooky Tent perspective)
    console.log('Positioning player for Gothic Landmark perspective in Haunted Carnival...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      if (game) {
        const p = game.getPlayer();
        p.isInvulnerable = true;
        p.position.set(-1.8, 4.35, -200.0);
        p.currentLane = -1;
        p.targetLane = -1;
        p.speed = 0;
        p.isGrounded = true;
        p.updateCollider();
        const chaser = game.chaser;
        if (chaser) {
          chaser.state = 'DISTANT';
          chaser.distance = 60;
        }
      }
      const modal = document.querySelector('.modal-overlay, #revive-modal, #save-me-modal');
      if (modal && modal instanceof HTMLElement) modal.style.display = 'none';
    });

    await page.waitForTimeout(1000);

    console.log('📸 2. Capturing Landmark Segment / Gothic Manor Screenshot...');
    const shot2Path = path.join(ARTIFACT_DIR, 'haunted_carnival_landmark_segment.png');
    await page.screenshot({ path: shot2Path });
    console.log('Saved:', shot2Path);

    // 3. Low Graphics Preset Screenshot
    console.log('Switching to Low Graphics Preset...');
    await page.evaluate(() => {
      const settings = window.__SETTINGS_MANAGER__;
      if (settings) {
        settings.setQualityPreset('LOW');
      }
      const modal = document.querySelector('.modal-overlay, #revive-modal, #save-me-modal');
      if (modal && modal instanceof HTMLElement) modal.style.display = 'none';
    });

    await page.waitForTimeout(1000);

    console.log('📸 3. Capturing Low Graphics Screenshot...');
    const shot3Path = path.join(ARTIFACT_DIR, 'haunted_carnival_low_graphics.png');
    await page.screenshot({ path: shot3Path });
    console.log('Saved:', shot3Path);

    console.log('🎉 Haunted Carnival Visual Captures Complete!');
  } catch (err) {
    console.error('Error during capture:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureHauntedCarnival();
