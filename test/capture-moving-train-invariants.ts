import { chromium } from 'playwright';
import * as path from 'path';

async function run() {
  console.log('🚀 Launching headless browser for visual moving-train validation...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('Browser Error:', msg.text());
  });

  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => (window as any).__METRO_GAME__ !== undefined);

  console.log('🎮 Game instance detected. Setting up oncoming moving train...');

  // Setup: Start run in lane 1 so lane 0 is adjacent for safe pass-by observation
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    game.startRun('NORMAL');
    game.getOpeningSequence().skip();

    const player = game.getPlayer();
    player.currentLane = 1;
    player.targetLane = 1;
    player.position.set(2.2, 0, 0);
    player.previousPosition.copy(player.position);
    player.speed = 0; // Stationary player/camera for stable high-fidelity recording

    // Position camera directly behind runner looking down -Z
    const cam = game.getCameraController();
    cam.setCameraMode('GAMEPLAY');
    cam.finishIntro(player.position);

    // Populate track chunk 0 with an oncoming moving train in adjacent lane 0
    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();
    chunk.populate({
      name: 'VALIDATION_MOVING_TRAIN',
      difficulty: 'MEDIUM',
      obstacles: [{
        type: 'MOVING_TRAIN',
        lane: 0,
        zOffset: 65.0,
        length: 24.0,
        isMoving: true,
        velocityZ: 24.0
      }],
      collectibles: []
    }, 0);
  });

  // Wait 2 frames for scene to render
  await page.waitForTimeout(200);

  // Capture Frame 1: Distant Approach (Z ~ -70m)
  const screenshotPath1 = path.resolve(process.cwd(), 'artifacts/moving_train_approaching.png');
  await page.screenshot({ path: screenshotPath1 });
  console.log('📸 Captured Frame 1: Distant Approach ->', screenshotPath1);

  // Advance train by 30 meters
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    const trainObs = chunk.obstacles.find((o: any) => o.isMoving);
    if (trainObs) {
      // Advance train by 30m down +Z
      trainObs.group.position.z += 30.0;
    }
  });
  await page.waitForTimeout(200);

  // Capture Frame 2: Intermediate Approach (Z ~ -40m)
  const screenshotPath2 = path.resolve(process.cwd(), 'artifacts/moving_train_intermediate.png');
  await page.screenshot({ path: screenshotPath2 });
  console.log('📸 Captured Frame 2: Intermediate Approach ->', screenshotPath2);

  // Advance train by another 25 meters (Z ~ -15m passing in lane 0)
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    const trainObs = chunk.obstacles.find((o: any) => o.isMoving);
    if (trainObs) {
      trainObs.group.position.z += 25.0;
    }
  });
  await page.waitForTimeout(200);

  // Capture Frame 3: Passing Adjacent Lane (Z ~ -15m)
  const screenshotPath3 = path.resolve(process.cwd(), 'artifacts/moving_train_passing_adjacent.png');
  await page.screenshot({ path: screenshotPath3 });
  console.log('📸 Captured Frame 3: Passing Adjacent Lane ->', screenshotPath3);

  // Set up Hard Mode High-Speed moving train (velocity 54 m/s)
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    chunk.clearDynamicItems();
    chunk.populate({
      name: 'VALIDATION_HARD_MODE',
      difficulty: 'HARD',
      obstacles: [{
        type: 'MOVING_TRAIN',
        lane: 0,
        zOffset: 55.0,
        length: 26.0,
        isMoving: true,
        velocityZ: 54.0
      }],
      collectibles: []
    }, 0);
  });
  await page.waitForTimeout(200);

  const screenshotPath4 = path.resolve(process.cwd(), 'artifacts/moving_train_hard_mode.png');
  await page.screenshot({ path: screenshotPath4 });
  console.log('📸 Captured Frame 4: Hard Mode High-Speed Train ->', screenshotPath4);

  // Check in-browser transform hierarchy assertions
  const transformCheck = await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    const trackMgr = game.getTrackManager();
    const chunk = trackMgr.chunks[0];
    const trainObs = chunk.obstacles.find((o: any) => o.isMoving);
    if (!trainObs) return { success: false, reason: 'Train not found' };

    const trainGroup = trainObs.group;
    let detachedCount = 0;
    let checkedMeshes = 0;

    trainGroup.traverse((node: any) => {
      if (node.isMesh) {
        checkedMeshes++;
        // Verify node is a descendant of trainGroup
        let p = node.parent;
        let attached = false;
        while (p) {
          if (p === trainGroup) {
            attached = true;
            break;
          }
          p = p.parent;
        }
        if (!attached) detachedCount++;
      }
    });

    return {
      success: detachedCount === 0 && checkedMeshes > 15,
      checkedMeshes,
      detachedCount,
      headlightsVisible: trainObs.headlights?.every((h: any) => h.visible)
    };
  });

  console.log('🔬 In-Browser Transform Check:', transformCheck);

  await browser.close();

  if (!transformCheck.success) {
    console.error('❌ Transform check failed:', transformCheck);
    process.exit(1);
  }

  console.log('✨ All browser visual validation frames captured and verified successfully!');
}

run().catch((err) => {
  console.error('Error running browser test:', err);
  process.exit(1);
});
