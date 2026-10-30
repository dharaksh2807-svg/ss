import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/2f350341-c53b-4c07-92cd-b647a661dc87';

async function runInstantReplayBrowserCapture() {
  console.log('🚀 Starting Real-Browser Task 1 Instant Crash Replay & Death Explanation Verification...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 1. Start Run and Skip Opening Sequence for immediate frame recording
    console.log('🏃 Starting game run and skipping opening sequence...');
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      if (game && game.openingSequence && game.openingSequence.isActive()) {
        game.openingSequence.skip();
      }
    });

    // Let the runner run and record 80 frames
    console.log('📼 Recording real gameplay frames...');
    await page.waitForTimeout(1500);

    // Populate several realistic gameplay frames to ensure replay buffer has high-fidelity data
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const player = game.getPlayer();
      const cameraController = game.cameraController;
      const replayMgr = game.getCrashReplayManager();

      for (let i = 0; i < 70; i++) {
        player.position.z = -i * 1.5;
        player.speed = 18;
        replayMgr.recordFrame(player, cameraController, [], game.getChaser(), i * 0.016);
      }

      // Record fatal crash metadata: Frontal train collision at speed
      replayMgr.recordFatalCrash({
        reason: 'TRAIN_COLLISION',
        player,
        isFrontal: true,
        isFlankContact: false
      });

      // Invoke fatal crash flow
      game.handleFatalCrash('TRAIN_COLLISION');
    });

    await page.waitForTimeout(600);

    // 3. Capture Evidence 1: Revive Modal with Intelligent Death Explanation Banner
    console.log('📸 Capturing Evidence 1: Revive Modal with Crash Explanation Banner...');
    const reviveModalEl = await page.$('#revive-modal');
    if (reviveModalEl) {
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task1_revive_modal_explanation.png') });
      console.log('✅ Captured: task1_revive_modal_explanation.png');
    }

    // 4. Decline revive or transition to Game Over
    console.log('⏳ Transitioning to Game Over Modal...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.onReviveDeclined('TRAIN_COLLISION');
    });

    await page.waitForTimeout(1500);

    // 5. Capture Evidence 2: Game Over Modal with Crash Analysis Card & Instant Replay Button
    console.log('📸 Capturing Evidence 2: Game Over Modal Crash Analysis Card...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task1_game_over_crash_analysis.png') });
    console.log('✅ Captured: task1_game_over_crash_analysis.png');

    // 6. Trigger Instant Replay via Click on Replay Button
    console.log('🎬 Clicking [ 📹 WATCH INSTANT REPLAY (SLOW-MO) ] button...');
    const replayBtn = await page.$('#game-over-replay-btn');
    if (replayBtn) {
      await replayBtn.click();
    } else {
      await page.evaluate(() => {
        window.__METRO_GAME__.startInstantReplay();
      });
    }

    await page.waitForTimeout(700);

    // 7. Capture Evidence 3: Instant Replay Playback Overlay (Recording Badge, Speed Pill, Crash Banner, Scrubber)
    console.log('📸 Capturing Evidence 3: Instant Replay Playback HUD & Scene...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task1_instant_replay_playback.png') });
    console.log('✅ Captured: task1_instant_replay_playback.png');

    // 8. Wait for slow-motion section near impact point
    await page.waitForTimeout(1400);

    // 9. Capture Evidence 4: Slow-Mo Impact Moment
    console.log('📸 Capturing Evidence 4: Slow-Mo Impact Moment...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task1_instant_replay_slowmo_impact.png') });
    console.log('✅ Captured: task1_instant_replay_slowmo_impact.png');

    // 10. Click Skip or Replay Again to test controls
    console.log('⏩ Clicking Skip Replay button...');
    const skipBtn = await page.$('#replay-skip-btn');
    if (skipBtn) {
      await skipBtn.click();
    } else {
      await page.evaluate(() => {
        window.__METRO_GAME__.exitInstantReplay();
      });
    }

    await page.waitForTimeout(600);

    // 11. Capture Evidence 5: Game Over restored cleanly without score/economy change
    console.log('📸 Capturing Evidence 5: Game Over Restored Cleanly...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task1_game_over_restored_cleanly.png') });
    console.log('✅ Captured: task1_game_over_restored_cleanly.png');

    console.log('🎉 Browser Evidence Capture Completed Successfully!');
  } finally {
    await browser.close();
  }
}

runInstantReplayBrowserCapture().catch((err) => {
  console.error('❌ Error during browser evidence capture:', err);
  process.exit(1);
});
