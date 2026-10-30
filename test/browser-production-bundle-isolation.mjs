import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Simple static server for dist/
function startStaticServer(dir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(dir, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function run() {
  console.log('🚀 Running Production Bundle Browser Verification...');
  const distDir = path.resolve(process.cwd(), 'dist');
  const port = 4173;
  const server = await startStaticServer(distDir, port);
  console.log(`📦 Serving production build from dist on http://localhost:${port}/`);

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--mute-audio']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('AudioContext')) errors.push(text);
    }
  });

  // 1. Navigate with URL parameters that would previously activate dev mode
  await page.goto(`http://localhost:${port}/?dev=1&debug=1&test=1&arena=1`);
  await page.waitForTimeout(1000);

  // 2. Check window properties in production
  const windowAudit = await page.evaluate(() => {
    return {
      hasMetroGame: window.__METRO_GAME__ !== undefined,
      hasGame: window.game !== undefined,
      hasMetroBus: window.__METRO_BUS__ !== undefined,
      hasEventBus: window.EventBus !== undefined,
      hasPacingMetrics: window.__PACING_METRICS__ !== undefined,
      hasSkillCombo: window.__SKILL_COMBO__ !== undefined,
      hasDailyChallenge: window.__DAILY_CHALLENGE__ !== undefined,
      hasPhotoMode: window.__PHOTO_MODE__ !== undefined,
      hasSecretRoutes: window.__SECRET_ROUTES__ !== undefined,
      hasJunctions: window.__JUNCTIONS__ !== undefined,
      hasScenarioRunner: window.__TRAIN_SCENARIO_RUNNER__ !== undefined,
      hasWorldGenDebug: window.__DEBUG_WORLD_GEN__ !== undefined
    };
  });

  console.log('🔍 Production Window Audit:', windowAudit);

  let passed = 0;
  let failed = 0;
  function verify(cond, msg) {
    if (cond) {
      console.log(`✅ PASSED: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAILED: ${msg}`);
      failed++;
    }
  }

  verify(!windowAudit.hasMetroGame, 'window.__METRO_GAME__ is NOT exposed in production');
  verify(!windowAudit.hasGame, 'window.game is NOT exposed in production');
  verify(!windowAudit.hasMetroBus, 'window.__METRO_BUS__ is NOT exposed in production');
  verify(!windowAudit.hasEventBus, 'window.EventBus is NOT exposed in production');
  verify(!windowAudit.hasPacingMetrics, 'window.__PACING_METRICS__ is NOT exposed in production');
  verify(!windowAudit.hasScenarioRunner, 'window.__TRAIN_SCENARIO_RUNNER__ is NOT exposed in production');

  // 3. Verify DevTestArena cannot be toggled via keyboard in production
  await page.keyboard.press('F8');
  await page.keyboard.press('Control+Shift+D');
  await page.keyboard.press('Control+Backquote');
  await page.waitForTimeout(300);

  const arenaVisible = await page.evaluate(() => {
    const el = document.getElementById('dev-test-arena-overlay');
    return el && !el.classList.contains('hidden') && el.style.display !== 'none';
  });
  verify(!arenaVisible, 'DevTestArena overlay remains hidden after hotkey presses');

  // 4. Verify Bug Report Modal cannot be toggled via F9 in production
  await page.keyboard.press('F9');
  await page.waitForTimeout(300);
  const bugReportVisible = await page.evaluate(() => {
    const el = document.getElementById('dev-bug-report-modal');
    return el && !el.classList.contains('hidden');
  });
  verify(!bugReportVisible, 'DevBugReportModal remains hidden after F9 hotkey press');

  // 5. Verify World Gen Overlay cannot be toggled via Shift+E in production
  await page.keyboard.press('Shift+E');
  await page.waitForTimeout(300);
  const worldGenVisible = await page.evaluate(() => {
    const el = document.getElementById('worldgen-debug-overlay');
    return el && el.style.display !== 'none';
  });
  verify(!worldGenVisible, 'WorldGen debug overlay remains hidden after Shift+E');

  // 6. Verify Normal Game Starts and Plays
  const startBtn = page.locator('#start-play-btn');
  const isStartBtnVisible = await startBtn.isVisible();
  verify(isStartBtnVisible, 'Start screen Play Now button is visible to real player');

  await startBtn.click();
  await page.waitForTimeout(1000);

  const canvasVisible = await page.evaluate(() => {
    const canvas = document.getElementById('game-canvas');
    return canvas !== null && canvas.width > 0 && canvas.height > 0;
  });
  verify(canvasVisible, 'WebGL 3D game canvas active and rendering');

  console.log(`\n🏁 Production Bundle Browser Audit: ${passed} passed, ${failed} failed`);

  await browser.close();
  server.close();

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
