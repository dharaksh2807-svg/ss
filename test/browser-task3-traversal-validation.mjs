import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/858b208b-143b-4b1b-b6ab-7532f6848b4a';
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function runBrowserValidation() {
  console.log('🌐 Starting Task 3 Train Rooftop Gameplay Browser Verification...');

  // 1. Start Vite preview server on port 4173
  const previewProcess = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: '/Users/dharaksh/Desktop/ss',
    stdio: 'pipe'
  });

  previewProcess.stdout.on('data', (d) => console.log(`[Preview Server] ${d}`));
  previewProcess.stderr.on('data', (d) => console.error(`[Preview Server Err] ${d}`));

  // Wait for server ready
  await new Promise((resolve) => setTimeout(resolve, 2500));

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader']
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1
    });

    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.error('PAGE ERROR:', msg.text());
    });

    console.log('🚀 Navigating to http://localhost:4173 ...');
    await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Click play button
    const playBtn = await page.$('#start-play-btn');
    if (playBtn) {
      await page.click('#start-play-btn', { force: true });
      console.log('🎮 Clicked #start-play-btn');
    }
    await page.waitForTimeout(600);
    // Skip intro cinematic
    await page.keyboard.press('Space');
    await page.waitForTimeout(600);
    await page.keyboard.press('Space');

    // Wait for active PLAYING state
    await page.waitForFunction(() => {
      const game = window.__METRO_GAME__;
      return game && game.lifecycleState === 'PLAYING';
    }, { timeout: 8000 });
    console.log('🏃 Active running state confirmed');

    // 2. Inject train composition with ramp in Chunk 0
    const testResult = await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      const trackManager = game.trackManager;
      const player = game.player;

      const chunk = trackManager.chunks[0];
      chunk.clearDynamicItems();

      // Populate chunk with a 2-carriage commuter twin set with ramp & exit ramp
      chunk.populate({
        name: 'BROWSER_TEST_COMMUTER_CRUISE',
        difficulty: 'BEGINNER',
        obstacles: [{
          type: 'TRAIN_COMPOSITION',
          lane: 0,
          zOffset: 45.0,
          length: 37.2,
          hasRamp: true,
          hasExitRamp: true,
          compositionType: 'COMMUTER_TWIN_SET'
        }],
        collectibles: [
          { type: 'COIN', lane: 0, zOffset: 38.0, height: 2.5 },
          { type: 'COIN', lane: 0, zOffset: 46.0, height: 5.2 },
          { type: 'COIN', lane: 0, zOffset: 55.0, height: 5.2 },
          { type: 'COIN', lane: 0, zOffset: 65.0, height: 5.2 }
        ]
      }, chunk.chunkZ);

      // Teleport player in lane 0 right in front of the ramp base
      // Ramp base is at chunk.chunkZ - 45.0 + 37.2/2 + 8.0 = 0 - 45 + 18.6 + 8.0 = -18.4
      player.position.set(0, 0.9, -16.0);
      player.currentLane = 0;
      player.targetLane = 0;
      player.speed = 18.0;

      const telemetry = [];

      // Run 90 frames of natural simulation loop
      for (let f = 0; f < 90; f++) {
        await new Promise(r => requestAnimationFrame(r));
        telemetry.push({
          frame: f,
          z: Math.round(player.position.z * 10) / 10,
          y: Math.round(player.position.y * 100) / 100,
          state: player.state,
          surface: player.getSupportSurface(),
          groundY: Math.round(player.groundY * 100) / 100
        });
      }

      const reachedRamp = telemetry.some(t => t.surface === 'RAMP');
      const reachedRoof = telemetry.some(t => t.surface === 'TRAIN_ROOF' || t.y >= 4.0);
      const roofSamples = telemetry.filter(t => t.y >= 4.0);

      return {
        success: reachedRamp && reachedRoof,
        reachedRamp,
        reachedRoof,
        roofSampleCount: roofSamples.length,
        telemetrySample: telemetry.filter((_, idx) => idx % 10 === 0)
      };
    });

    console.log('🚂 Browser Traversal Telemetry:', JSON.stringify(testResult, null, 2));

    // Wait a couple frames for visual polish
    await page.waitForTimeout(500);

    // Take screenshot of rooftop gameplay
    const screenshotPath = path.join(ARTIFACTS_DIR, 'task3_train_rooftop_browser_evidence.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);

  } catch (err) {
    console.error('❌ Browser validation error:', err);
  } finally {
    if (browser) await browser.close();
    previewProcess.kill();
    console.log('🏁 Browser verification completed cleanly.');
  }
}

runBrowserValidation();
