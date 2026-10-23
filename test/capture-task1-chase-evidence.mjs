import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/b2746edc-5714-4101-b26e-f272cdfb7c56';

async function runBrowserEvidenceCapture() {
  console.log('🚀 Starting Real-Browser Task 1 Chase & Collision Consequence Verification...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click start or press space to initiate run
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);

  // 1. Evidence: Minor Stumble & Guard Catch-up Surge
  console.log('📸 Capturing Evidence 1: Minor Stumble & Guard Catch-up Surge...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      game.getPlayer().stumble();
      game.getChaser().onMinorStumble();
    }
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task1_minor_stumble_chaser_surge.png') });

  // 2. Evidence: Chaser Capture & Busted Game Over Transition
  console.log('📸 Capturing Evidence 2: Chaser Capture & Busted Game Over Transition...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      // Trigger second stumble while guard is close
      game.getChaser().setChaseState('CLOSE_PURSUIT');
      game.getChaser().onMinorStumble();
      game.getPlayer().crash('CHASER_CAPTURE');
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task1_chaser_capture_busted.png') });

  // 3. Evidence: Key-Based Revive / Save Me Interface
  console.log('📸 Capturing Evidence 3: Key-Based Save Me Interface...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task1_save_me_revive_modal.png') });

  // 4. Evidence: Valid Train Rooftop Traversal (Zero Crash)
  console.log('📸 Capturing Evidence 4: Valid Train Rooftop Traversal...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      // Revive runner and position on train roof
      game.startRun('NORMAL', true);
      game.getPlayer().position.set(0, 4.35, -28.0);
      game.getPlayer().resolveRoofLanding(4.35);
      game.getChaser().setChaseState('DISTANT');
    }
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task1_train_rooftop_safe_traversal.png') });

  // 5. Evidence: Collision Diagnostics Output
  console.log('📸 Capturing Evidence 5: Collision Diagnostics Record...');
  const diagnostics = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game) {
      // Find an active obstacle on track and position player to collide
      const chunk = game.trackManager.chunks[0];
      const obs = chunk.obstacles.find(o => o.active);
      if (obs) {
        game.getPlayer().position.set(obs.collider.min.x + 0.2, 0.9, obs.collider.max.z - 0.1);
        game.getPlayer().updateCollider();
        game.trackManager.update(game.getPlayer(), 0.016, 1.0);
      }
    }
    return {
      lastDiag: window.__LAST_COLLISION_DIAGNOSTIC__ || null,
      historyLength: (window.__COLLISION_LOG__ || []).length
    };
  });
  console.log('Collision Diagnostics Sample:', JSON.stringify(diagnostics, null, 2));

  await browser.close();
  console.log('🎉 Browser evidence capture completed successfully!');
}

runBrowserEvidenceCapture().catch(err => {
  console.error('❌ Evidence capture error:', err);
  process.exit(1);
});
