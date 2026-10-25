import { chromium } from 'playwright';
import * as path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/2f350341-c53b-4c07-92cd-b647a661dc87';

async function main() {
  console.log('🚀 Launching Playwright browser scenario runner for train rooftop gameplay...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Navigate to local dev server
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Before capture: Ground running experience
  console.log('📸 1. Capturing ground running baseline...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL', false);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_ground_running_baseline.png') });

  // Test Scenario: Normal Mode SIDE_SWITCH
  console.log('📸 2. Setting deterministic SIDE_SWITCH route and capturing progression...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const tm = game.getTrackManager();
    const player = game.getPlayer();
    player.isIntroInvincible = true;
    player.activateReviveGrace(999);
    player.setGodMode?.(true);
    tm.setDebugRooftopRoute('SIDE_SWITCH', 1337);
  });

  // Advance runner to approach entry ramp
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.position.set(0, 0.9, -75.0);
    player.updateCollider();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_approach_entry_ramp.png') });

  // Advance runner to ramp ascent
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.position.set(0, 2.5, -92.0);
    player.updateCollider();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_ramp_climb_ascent.png') });

  // Advance runner to established rooftop running
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.position.set(0, 4.35, -108.0);
    player.state = 'ON_TRAIN';
    player.supportSurface = 'TRAIN_ROOF';
    player.updateCollider();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_established_rooftop_running.png') });

  // Lateral jump + lane switch across to adjacent train
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.position.set(1.8, 5.8, -125.0); // mid-air lateral jump between lane 0 and lane 1
    player.isJumping = true;
    player.jumpPhase = 'APEX';
    player.updateCollider();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_lateral_jump_between_trains.png') });

  // Landing on target train roof
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.position.set(3.6, 4.35, -140.0);
    player.isJumping = false;
    player.state = 'ON_TRAIN';
    player.supportSurface = 'TRAIN_ROOF';
    player.currentLane = 1;
    player.targetLane = 1;
    player.updateCollider();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_destination_roof_landing.png') });

  // Rooftop obstacle / vent jump
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.position.set(3.6, 5.4, -155.0);
    player.isJumping = true;
    player.updateCollider();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_rooftop_obstacle_clearance.png') });

  // Exit ramp descent
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const player = game.getPlayer();
    player.position.set(3.6, 2.5, -172.0);
    player.isJumping = false;
    player.updateCollider();
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_exit_ramp_descent_to_ground.png') });

  // Hard Mode DOUBLE_SWITCH capture
  console.log('📸 3. Capturing Hard Mode DOUBLE_SWITCH route...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const tm = game.getTrackManager();
    const player = game.getPlayer();
    tm.setDebugRooftopRoute('DOUBLE_SWITCH', 4242);
    player.position.set(0, 4.35, -45.0);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_hard_mode_double_switch.png') });

  console.log('✅ All rooftop traversal scenarios captured successfully!');
  await browser.close();
}

main().catch(err => {
  console.error('Error running browser scenarios:', err);
  process.exit(1);
});
