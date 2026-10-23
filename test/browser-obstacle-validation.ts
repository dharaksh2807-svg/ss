import { chromium } from 'playwright';
import * as path from 'path';

async function runBrowserObstacleValidation() {
  console.log('🚀 Launching isolated Playwright browser for Task 3 Obstacle Visibility Validation...');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--use-gl=angle', '--use-angle=metal', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();

  console.log('🌐 Navigating to Metro Runner 3D at http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Wait for game initialization
  await page.waitForFunction(() => (window as any).__METRO_GAME__ !== undefined, { timeout: 10000 });
  console.log('✅ Game instance __METRO_GAME__ detected on window');

  // Click Start Play button
  const playBtn = page.locator('#start-play-btn');
  await playBtn.waitFor({ state: 'visible', timeout: 5000 });
  await playBtn.click();

  // Skip intro sequence
  await page.waitForTimeout(500);
  await page.keyboard.press('Space');

  // Wait for active PLAYING state
  await page.waitForFunction(() => {
    const game = (window as any).__METRO_GAME__;
    return game && game.lifecycleState === 'PLAYING';
  }, { timeout: 5000 });
  console.log('🏃 Active running state confirmed');

  const artifactDir = '/Users/dharaksh/.gemini/antigravity-ide/brain/672ddbd5-0177-4c3b-909d-89bceebe552b';

  // Helper to ensure clean scenery for focused obstacle shots
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    game.player.isIntroInvincible = true;
    game.trackManager.chunks.forEach((c: any) => c.clearDynamicItems());
  });

  // 1. Screenshot 1: Low hurdle at long approach distance (~24m ahead down open railway)
  console.log('📸 Staging Shot 1: Low hurdle at long approach distance...');
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const scene = game.worldScene?.scene || game.trackManager?.scene;
    game.trackManager.chunks.forEach((c: any) => c.clearDynamicItems());
    const pZ = game.player.position.z;

    ['TEST_OBSTACLE', 'TEST_OBSTACLES_LOW', 'TEST_OBSTACLES_HIGH'].forEach(name => {
      const existing = scene.getObjectByName(name);
      if (existing) scene.remove(existing);
    });

    // Variant 0: Railway A-Frame Hurdle with dual hazard rails & amber beacon flashers
    const lowHurdle = game.trackManager.obstacleFactory.createLowBarrier(0);
    lowHurdle.name = 'TEST_OBSTACLE';
    lowHurdle.position.set(0, 0, pZ - 24);
    scene.add(lowHurdle);
  });
  await page.waitForTimeout(100);
  const shot1Path = path.join(artifactDir, 'obstacle_low_hurdle_far.png');
  await page.screenshot({ path: shot1Path });
  console.log(`✅ Saved Shot 1 to ${shot1Path}`);

  // 2. Screenshot 2: Low hurdle near player (~5.5m ahead, crisp A-frame and hazard chevrons)
  console.log('📸 Staging Shot 2: Low hurdle near player...');
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const scene = game.worldScene?.scene || game.trackManager?.scene;
    game.trackManager.chunks.forEach((c: any) => c.clearDynamicItems());
    const pZ = game.player.position.z;

    ['TEST_OBSTACLE', 'TEST_OBSTACLES_LOW', 'TEST_OBSTACLES_HIGH'].forEach(name => {
      const existing = scene.getObjectByName(name);
      if (existing) scene.remove(existing);
    });

    // Variant 1: Heavy Track Maintenance Gate with dual cross-tubes and flashing beacons
    const lowHurdle = game.trackManager.obstacleFactory.createLowBarrier(1);
    lowHurdle.name = 'TEST_OBSTACLE';
    lowHurdle.position.set(0, 0, pZ - 5.5);
    scene.add(lowHurdle);
  });
  await page.waitForTimeout(100);
  const shot2Path = path.join(artifactDir, 'obstacle_low_hurdle_near.png');
  await page.screenshot({ path: shot2Path });
  console.log(`✅ Saved Shot 2 to ${shot2Path}`);

  // 3. Screenshot 3: Slide-only gantry at long distance (~30m ahead, massive train-height portal)
  console.log('📸 Staging Shot 3: Slide-only gantry at long distance...');
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const scene = game.worldScene?.scene || game.trackManager?.scene;
    game.trackManager.chunks.forEach((c: any) => c.clearDynamicItems());
    const pZ = game.player.position.z;

    ['TEST_OBSTACLE', 'TEST_OBSTACLES_LOW', 'TEST_OBSTACLES_HIGH'].forEach(name => {
      const existing = scene.getObjectByName(name);
      if (existing) scene.remove(existing);
    });

    // Variant 0: Station Transit LED Gantry with aspect signal heads & illuminated signage
    const gantry = game.trackManager.obstacleFactory.createHighBarrier(0);
    gantry.name = 'TEST_OBSTACLE';
    gantry.position.set(0, 0, pZ - 30);
    scene.add(gantry);
  });
  await page.waitForTimeout(100);
  const shot3Path = path.join(artifactDir, 'obstacle_slide_gantry_far.png');
  await page.screenshot({ path: shot3Path });
  console.log(`✅ Saved Shot 3 to ${shot3Path}`);

  // 4. Screenshot 4: Slide clearance (runner sliding safely beneath the 1.25m opening)
  console.log('📸 Staging Shot 4: Slide clearance beneath overhead gantry...');
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const scene = game.worldScene?.scene || game.trackManager?.scene;
    game.trackManager.chunks.forEach((c: any) => c.clearDynamicItems());
    const pZ = game.player.position.z;

    ['TEST_OBSTACLE', 'TEST_OBSTACLES_LOW', 'TEST_OBSTACLES_HIGH'].forEach(name => {
      const existing = scene.getObjectByName(name);
      if (existing) scene.remove(existing);
    });

    // Variant 0: Station Transit Gantry right in front of sliding runner
    const gantry = game.trackManager.obstacleFactory.createHighBarrier(0);
    gantry.name = 'TEST_OBSTACLE';
    gantry.position.set(0, 0, pZ - 3.2);
    scene.add(gantry);

    // Trigger player slide animation
    game.player.slide();
    game.player.position.y = 0;
  });
  await page.waitForTimeout(120);
  const shot4Path = path.join(artifactDir, 'obstacle_slide_clearance.png');
  await page.screenshot({ path: shot4Path });
  console.log(`✅ Saved Shot 4 to ${shot4Path}`);

  // 5. Screenshot 5: Standing collision with overhead hurdle (runner standing upright)
  console.log('📸 Staging Shot 5: Standing collision with overhead hurdle...');
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const scene = game.worldScene?.scene || game.trackManager?.scene;
    game.trackManager.chunks.forEach((c: any) => c.clearDynamicItems());
    const pZ = game.player.position.z;

    ['TEST_OBSTACLE', 'TEST_OBSTACLES_LOW', 'TEST_OBSTACLES_HIGH'].forEach(name => {
      const existing = scene.getObjectByName(name);
      if (existing) scene.remove(existing);
    });

    // Variant 1: Heavy Industrial Truss Portal right at chest level
    const gantry = game.trackManager.obstacleFactory.createHighBarrier(1);
    gantry.name = 'TEST_OBSTACLE';
    gantry.position.set(0, 0, pZ - 2.8);
    scene.add(gantry);

    // Ensure standing posture
    game.player.isSliding = false;
    game.player.isJumping = false;
    game.player.position.y = 0;
  });
  await page.waitForTimeout(100);
  const shot5Path = path.join(artifactDir, 'obstacle_standing_collision.png');
  await page.screenshot({ path: shot5Path });
  console.log(`✅ Saved Shot 5 to ${shot5Path}`);

  // 6. Screenshot 6: Jump collision with overhead hurdle (runner mid-jump hitting girder)
  console.log('📸 Staging Shot 6: Jump collision with overhead hurdle...');
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const scene = game.worldScene?.scene || game.trackManager?.scene;
    game.trackManager.chunks.forEach((c: any) => c.clearDynamicItems());
    const pZ = game.player.position.z;

    ['TEST_OBSTACLE', 'TEST_OBSTACLES_LOW', 'TEST_OBSTACLES_HIGH'].forEach(name => {
      const existing = scene.getObjectByName(name);
      if (existing) scene.remove(existing);
    });

    // Variant 2: Tunnel Clearance Portal
    const gantry = game.trackManager.obstacleFactory.createHighBarrier(2);
    gantry.name = 'TEST_OBSTACLE';
    gantry.position.set(0, 0, pZ - 2.8);
    scene.add(gantry);

    // Lift player into jumping collision zone (y = 1.85m)
    game.player.isJumping = true;
    game.player.isSliding = false;
    game.player.position.y = 1.85;
  });
  await page.waitForTimeout(100);
  const shot6Path = path.join(artifactDir, 'obstacle_jump_collision.png');
  await page.screenshot({ path: shot6Path });
  console.log(`✅ Saved Shot 6 to ${shot6Path}`);

  // 7. Screenshot 7: Mobile Viewport (width 390, height 844)
  console.log('📸 Staging Shot 7: Mobile Viewport layout...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const scene = game.worldScene?.scene || game.trackManager?.scene;
    game.trackManager.chunks.forEach((c: any) => c.clearDynamicItems());
    const pZ = game.player.position.z;

    // Reset player to normal ground running
    game.player.isJumping = false;
    game.player.isSliding = false;
    game.player.position.y = 0;

    ['TEST_OBSTACLE', 'TEST_OBSTACLES_LOW', 'TEST_OBSTACLES_HIGH'].forEach(name => {
      const existing = scene.getObjectByName(name);
      if (existing) scene.remove(existing);
    });

    // Low hurdle at 7m, slide gantry at 20m ahead
    const lowHurdle = game.trackManager.obstacleFactory.createLowBarrier(0);
    lowHurdle.name = 'TEST_OBSTACLES_LOW';
    lowHurdle.position.set(0, 0, pZ - 7.0);
    scene.add(lowHurdle);

    const gantry = game.trackManager.obstacleFactory.createHighBarrier(0);
    gantry.name = 'TEST_OBSTACLES_HIGH';
    gantry.position.set(0, 0, pZ - 20.0);
    scene.add(gantry);

    // Trigger window resize event for Three.js camera aspect update
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(250);
  const shot7Path = path.join(artifactDir, 'obstacle_mobile_viewport.png');
  await page.screenshot({ path: shot7Path });
  console.log(`✅ Saved Shot 7 to ${shot7Path}`);

  // Clean up
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const scene = game.worldScene?.scene || game.trackManager?.scene;
    ['TEST_OBSTACLE', 'TEST_OBSTACLES_LOW', 'TEST_OBSTACLES_HIGH'].forEach(name => {
      const existing = scene?.getObjectByName(name);
      if (existing && scene) scene.remove(existing);
    });
  });

  await browser.close();
  console.log('🎉 Browser obstacle validation completed with all screenshots captured successfully!');
}

runBrowserObstacleValidation().catch(err => {
  console.error('❌ Validation script failed:', err);
  process.exit(1);
});
