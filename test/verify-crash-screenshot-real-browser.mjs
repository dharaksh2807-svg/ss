import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/1cf6ae4f-526f-40c9-8ade-a398a16f956f';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const PORT = 3145;
const URL = `http://localhost:${PORT}/`;

async function main() {
  console.log('🚀 Starting Vite dev server on port', PORT);
  const viteProcess = spawn('npx', ['vite', '--port', String(PORT), '--no-open'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  viteProcess.stderr.on('data', data => {
    // console.log('Vite:', data.toString());
  });

  // Wait for server to become responsive
  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(URL);
      if (res.ok) {
        serverReady = true;
        break;
      }
    } catch (_) {}
    await new Promise(r => setTimeout(r, 400));
  }

  if (!serverReady) {
    console.error('❌ Failed to connect to Vite dev server within 12 seconds');
    viteProcess.kill();
    process.exit(1);
  }
  console.log('✅ Vite server responsive at', URL);

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader']
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser Error:', msg.text());
    }
  });

  try {
    console.log('🌐 Navigating to game...');
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 10000 });
    console.log('🎮 Game instance detected!');

    // Initialize reproduction scenario: Hard Mode, Seed 1599997308
    const testResult = await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      const tm = game.trackManager;
      const snapManager = game.bugSnapshotManager;

      // Start run in HARD mode with seed 1599997308
      tm.setGameMode('HARD');
      tm.setSeed(1599997308, true);
      game.startRun('HARD', false);

      // Render 5 animation frames to ensure full scene geometry is drawn
      for (let f = 0; f < 5; f++) {
        game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
        await new Promise(r => requestAnimationFrame(r));
      }

      // Trigger fatal crash
      game.handleFatalCrash('TRAIN_COLLISION');

      const snap = snapManager.getLatestSnapshot();
      if (!snap) {
        return { error: 'No snapshot created after handleFatalCrash' };
      }

      const screenshotBase64 = snap.screenshotBase64;
      if (!screenshotBase64) {
        return { error: 'snapshotBase64 is empty or undefined' };
      }

      // Analyze screenshot pixels in browser canvas to verify it is NOT black
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = screenshotBase64;
      });

      const offscreen = document.createElement('canvas');
      offscreen.width = img.width;
      offscreen.height = img.height;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return { error: 'Cannot get 2d context for analysis' };

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imgData.data;

      let nonBlackPixels = 0;
      let totalLuminance = 0;
      const totalPixels = img.width * img.height;

      // Sample pixels
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += lum;
        if (r > 15 || g > 15 || b > 15) {
          nonBlackPixels++;
        }
      }

      const avgLuminance = totalLuminance / totalPixels;
      const nonBlackPct = (nonBlackPixels / totalPixels) * 100;

      return {
        success: true,
        width: img.width,
        height: img.height,
        dataUrlLength: screenshotBase64.length,
        screenshotStatus: snap.screenshotStatus,
        avgLuminance,
        nonBlackPct,
        screenshotBase64: screenshotBase64.substring(0, 100) + '...',
        fullBase64: screenshotBase64,
        details: snap.trigger.details
      };
    });

    if (!testResult.success) {
      console.error('❌ Browser Verification Failed:', testResult.error);
      process.exit(1);
    }

    console.log('✅ Real-Browser Screenshot Verification Results:');
    console.log(`   - Resolution: ${testResult.width}x${testResult.height}`);
    console.log(`   - Data URL Length: ${testResult.dataUrlLength} characters`);
    console.log(`   - Status: ${testResult.screenshotStatus}`);
    console.log(`   - Average Luminance: ${testResult.avgLuminance.toFixed(2)} (0 = black, 255 = white)`);
    console.log(`   - Non-Black Pixels: ${testResult.nonBlackPct.toFixed(2)}% of total image`);

    if (testResult.nonBlackPct < 10.0 || testResult.avgLuminance < 5.0) {
      console.error('❌ FAILED: Captured screenshot is predominantly black!');
      process.exit(1);
    }

    console.log('✅ PASSED: Captured screenshot is clearly populated with vibrant 3D gameplay content (NOT black)!');

    // Save image to artifacts
    const base64Data = testResult.fullBase64.replace(/^data:image\/jpeg;base64,/, '');
    const screenshotPath = path.join(ARTIFACT_DIR, 'crash_screenshot_verified.jpg');
    fs.writeFileSync(screenshotPath, base64Data, 'base64');
    console.log(`📸 Saved verified crash screenshot to: ${screenshotPath}`);

  } finally {
    await browser.close();
    viteProcess.kill('SIGTERM');
  }
}

main().catch(err => {
  console.error('Fatal error during browser test:', err);
  process.exit(1);
});
