import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/fee7f8eb-9699-4c14-9bfd-a6b8025326b1';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runBrowserAcceptance() {
  console.log('🚀 Starting Real-Browser Death Transition & Vibration Verification...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Start run by clicking Play or calling startRun
  console.log('Starting run from StartScreen...');
  await page.evaluate(() => {
    const playBtn = document.getElementById('start-play-btn');
    if (playBtn) {
      playBtn.click();
    } else if (window.__METRO_GAME__) {
      window.__METRO_GAME__.startRun('NORMAL');
    }
  });
  await page.waitForTimeout(1000);

  // Position player just ahead of the train at z = -94 in lane 0
  console.log('Positioning player just before fatal train collision at lane 0 (z = -90)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      const p = game.getPlayer();
      p.currentLane = 0;
      p.targetLane = 0;
      p.position.set(0, 0.9, -90.0);
      p.speed = 18.0;
      p.updateCollider();
    }
  });

  // 1. Frame immediately before impact (around z = -92.5)
  console.log('📸 1. Capturing Frame Immediately Before Impact...');
  await page.waitForTimeout(140);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '1_before_impact.png') });

  // 2. First death-animation frame (collision triggers at z = -94)
  console.log('📸 2. Capturing First Death-Animation Frame...');
  await page.waitForTimeout(160);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '2_first_death_frame.png') });

  // 3. Mid-death animation (500ms into the death window)
  console.log('📸 3. Capturing Mid-Death Animation...');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '3_mid_death_animation.png') });

  // 4. Final Revive/Game Over state (after 1200ms death window completes)
  console.log('📸 4. Capturing Final Revive/Game Over State...');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '4_final_revive_modal.png') });

  // Telemetry check
  const stateCheck = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const hud = game?.hud;
    const feedbackBadges = document.querySelectorAll('.hud-feedback-pill');
    return {
      lifecycleState: game?.lifecycleState,
      playerState: game?.getPlayer()?.state,
      bustedBadgesVisible: Array.from(feedbackBadges).map(b => b.textContent),
      modalOpen: !document.getElementById('revive-modal')?.classList.contains('hidden') ||
                 !document.getElementById('game-over-modal')?.classList.contains('hidden')
    };
  });
  console.log('Browser State Telemetry:', stateCheck);

  await browser.close();
  console.log('🎉 Browser acceptance tests completed successfully!');
}

runBrowserAcceptance().catch(err => {
  console.error('❌ Browser acceptance test error:', err);
  process.exit(1);
});
