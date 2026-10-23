import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

async function runBrowserValidation() {
  console.log('🚀 Launching isolated Playwright browser for Moving Train Gameplay Validation...');

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

  // Listen for console logs
  page.on('console', msg => {
    if (msg.text().includes('COLLISION') || msg.text().includes('TRAIN')) {
      console.log(`[Browser Console] ${msg.text()}`);
    }
  });

  console.log('🌐 Navigating to Metro Runner 3D at http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Wait for game initialization
  await page.waitForFunction(() => (window as any).__METRO_GAME__ !== undefined, { timeout: 10000 });
  console.log('✅ Game instance __METRO_GAME__ detected on window');

  // Click Start Play button
  const playBtn = page.locator('#start-play-btn');
  await playBtn.waitFor({ state: 'visible', timeout: 5000 });
  await playBtn.click();
  console.log('▶️ Clicked Play button');

  // Skip opening sequence
  await page.waitForTimeout(500);
  await page.keyboard.press('Space');
  console.log('⏩ Skipped intro cinematic into active gameplay');

  // Wait for active PLAYING state
  await page.waitForFunction(() => {
    const game = (window as any).__METRO_GAME__;
    return game && game.lifecycleState === 'PLAYING';
  }, { timeout: 5000 });
  console.log('🏃 Active running state confirmed');

  // Inject or verify moving train encounter on the track
  const encounterResult = await page.evaluate(async () => {
    const game = (window as any).__METRO_GAME__;
    const trackManager = game.trackManager;
    const player = game.player;

    // Pick Chunk 0 (covering Z from 0 to -80m, directly ahead of runner)
    const chunk = trackManager.chunks[0];
    chunk.clearDynamicItems();

    // Spawn an oncoming moving train in lane 0 ahead of the player
    // Player is currently around z = -10 to -30
    const spawnZOffset = 45.0; // 45m ahead in chunk
    chunk.populate({
      name: 'TEST_BROWSER_MOVING_ENCOUNTER',
      difficulty: 'MEDIUM',
      obstacles: [{
        type: 'MOVING_TRAIN',
        lane: 0,
        zOffset: spawnZOffset,
        length: 20.0,
        velocityZ: 11.0
      }],
      collectibles: []
    }, chunk.chunkZ);

    const train = chunk.obstacles.find((o: any) => o.type === 'MOVING_TRAIN');
    if (!train) return { success: false, reason: 'Train not spawned' };

    const initialLocalZ = train.group.position.z;
    const initialWorldZ = chunk.chunkZ + initialLocalZ;
    const initialColliderMinZ = train.collider.min.z;

    // Record positions over 20 frames of active game loop
    const framePositions: { frame: number; trainZ: number; playerZ: number; dist: number; isMovingActive: boolean }[] = [];

    for (let f = 0; f < 25; f++) {
      await new Promise(r => requestAnimationFrame(r));
      const currentTrainZ = chunk.chunkZ + train.group.position.z;
      const currentPlayerZ = player.position.z;
      const currentDist = trackManager.getApproachingTrainDistance(currentPlayerZ);

      framePositions.push({
        frame: f,
        trainZ: currentTrainZ,
        playerZ: currentPlayerZ,
        dist: currentDist,
        isMovingActive: train.isMovingActive
      });
    }

    const finalLocalZ = train.group.position.z;
    const finalWorldZ = chunk.chunkZ + finalLocalZ;
    const finalColliderMinZ = train.collider.min.z;

    // Verify relative motion:
    // Train moved forward in world space (+Z direction toward player)
    const trainMovedForward = finalWorldZ > initialWorldZ;
    const colliderMovedWithMesh = Math.abs((finalWorldZ - initialWorldZ) - (finalColliderMinZ - initialColliderMinZ)) < 0.05;

    return {
      success: true,
      trainMovedForward,
      colliderMovedWithMesh,
      deltaTrainZ: finalWorldZ - initialWorldZ,
      deltaColliderZ: finalColliderMinZ - initialColliderMinZ,
      hasHeadlightBeam: train.headlightBeam !== undefined,
      wheelCount: train.wheelMeshes ? train.wheelMeshes.length : 0,
      initialWorldZ,
      finalWorldZ,
      framePositions: framePositions.slice(0, 5)
    };
  });

  console.log('📊 Browser Moving Train Encounter Results:', JSON.stringify(encounterResult, null, 2));

  if (!encounterResult.success || !encounterResult.trainMovedForward || !encounterResult.colliderMovedWithMesh) {
    console.error('❌ Browser encounter verification failed!');
    await browser.close();
    process.exit(1);
  }

  // Capture screenshot of running game with moving train
  const screenshotDir = path.resolve(process.cwd(), 'artifacts');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
  const screenshotPath = path.join(screenshotDir, 'moving_train_gameplay.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`📸 Gameplay screenshot captured at ${screenshotPath}`);

  // Test lane dodging past the moving train
  const dodgeResult = await page.evaluate(async () => {
    const game = (window as any).__METRO_GAME__;
    const player = game.player;

    // Shift player to safe Lane 1 (right) to avoid oncoming train
    player.changeLane(1);

    // Wait 15 frames for lane switch and train pass
    for (let f = 0; f < 30; f++) {
      await new Promise(r => requestAnimationFrame(r));
    }

    return {
      playerLane: player.currentLane,
      playerState: player.state,
      survived: player.state !== 'CRASH'
    };
  });

  console.log('🛡️ Player Lane Dodge Result:', JSON.stringify(dodgeResult, null, 2));

  if (!dodgeResult.survived) {
    console.error('❌ Player failed to dodge safely!');
    await browser.close();
    process.exit(1);
  }

  const dodgeScreenshotPath = path.join(screenshotDir, 'moving_train_dodged.png');
  await page.screenshot({ path: dodgeScreenshotPath });
  console.log(`📸 Dodge screenshot captured at ${dodgeScreenshotPath}`);

  console.log('🎉 Browser Moving Train Gameplay Scenario Verified Successfully!');
  await browser.close();
}

runBrowserValidation().catch(err => {
  console.error('❌ Browser validation error:', err);
  process.exit(1);
});
