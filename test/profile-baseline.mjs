import { chromium } from 'playwright';

async function runBaselineProfiler() {
  console.log('🔬 Starting Baseline Performance Profiler...');

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--enable-webgl', '--ignore-gpu-blocklist']
    });
  } catch (err) {
    browser = await chromium.launch({ headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2 // Typical Retina / MacBook High-DPI screen
  });

  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  console.log('🌐 Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  console.log('🏃 Starting active gameplay run and recording 600 frames...');
  const stats = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    if (!game) throw new Error('Game not found on window');

    // Make sure we start fresh run
    game.startRun('NORMAL', true);

    const renderer = game.worldScene.renderer;
    const info = renderer.info;
    const sunLight = game.worldScene.sunLight;

    const frameTimes = [];
    const drawCalls = [];
    const triangles = [];
    const heapSizes = [];
    let chunkSpikes = [];

    let lastTime = performance.now();
    let frameCount = 0;
    const maxFrames = 600;

    let prevChunkIndex = game.trackManager.chunkIndex;

    return new Promise((resolve) => {
      function sampleFrame() {
        const now = performance.now();
        const dt = now - lastTime;
        lastTime = now;

        // Skip the very first frame to avoid startup anomaly
        if (frameCount > 0) {
          frameTimes.push(dt);
          drawCalls.push(info.render.calls);
          triangles.push(info.render.triangles);
          if (performance.memory) {
            heapSizes.push(performance.memory.usedJSHeapSize);
          }

          if (game.trackManager.chunkIndex !== prevChunkIndex) {
            chunkSpikes.push({
              frame: frameCount,
              dt,
              chunk: game.trackManager.chunkIndex
            });
            prevChunkIndex = game.trackManager.chunkIndex;
          }
        }

        frameCount++;
        if (frameCount < maxFrames) {
          requestAnimationFrame(sampleFrame);
        } else {
          // Finish sampling
          frameTimes.sort((a, b) => a - b);
          const totalTime = frameTimes.reduce((acc, v) => acc + v, 0);
          const meanDt = totalTime / frameTimes.length;
          const medianDt = frameTimes[Math.floor(frameTimes.length * 0.5)];
          const p95Dt = frameTimes[Math.floor(frameTimes.length * 0.95)];
          const p99Dt = frameTimes[Math.floor(frameTimes.length * 0.99)];
          const maxDt = frameTimes[frameTimes.length - 1];
          const minDt = frameTimes[0];

          const meanDrawCalls = drawCalls.reduce((acc, v) => acc + v, 0) / drawCalls.length;
          const maxDrawCalls = Math.max(...drawCalls);
          const meanTriangles = triangles.reduce((acc, v) => acc + v, 0) / triangles.length;
          const maxTriangles = Math.max(...triangles);

          resolve({
            sampleCount: frameTimes.length,
            canvasWidth: renderer.domElement.width,
            canvasHeight: renderer.domElement.height,
            cssWidth: window.innerWidth,
            cssHeight: window.innerHeight,
            pixelRatio: renderer.getPixelRatio(),
            shadowMapEnabled: renderer.shadowMap.enabled,
            shadowMapType: renderer.shadowMap.type,
            shadowMapWidth: sunLight.shadow.mapSize.width,
            shadowMapHeight: sunLight.shadow.mapSize.height,
            geometriesInMemory: info.memory.geometries,
            texturesInMemory: info.memory.textures,
            meanFrameTimeMs: parseFloat(meanDt.toFixed(2)),
            medianFrameTimeMs: parseFloat(medianDt.toFixed(2)),
            p95FrameTimeMs: parseFloat(p95Dt.toFixed(2)),
            p99FrameTimeMs: parseFloat(p99Dt.toFixed(2)),
            minFrameTimeMs: parseFloat(minDt.toFixed(2)),
            maxFrameTimeMs: parseFloat(maxDt.toFixed(2)),
            avgFps: parseFloat((1000 / meanDt).toFixed(1)),
            onePercentLowFps: parseFloat((1000 / p99Dt).toFixed(1)),
            meanDrawCalls: Math.round(meanDrawCalls),
            maxDrawCalls,
            meanTriangles: Math.round(meanTriangles),
            maxTriangles,
            initialHeapMB: heapSizes.length > 0 ? parseFloat((heapSizes[0] / (1024 * 1024)).toFixed(2)) : null,
            finalHeapMB: heapSizes.length > 0 ? parseFloat((heapSizes[heapSizes.length - 1] / (1024 * 1024)).toFixed(2)) : null,
            chunkRecyclingEvents: chunkSpikes.length,
            chunkSpikeMaxMs: chunkSpikes.length > 0 ? parseFloat(Math.max(...chunkSpikes.map(s => s.dt)).toFixed(2)) : 0
          });
        }
      }

      requestAnimationFrame(sampleFrame);
    });
  });

  console.log('\n📊 === BASELINE PERFORMANCE RESULTS ===');
  console.log(JSON.stringify(stats, null, 2));

  await browser.close();
}

runBaselineProfiler().catch(err => {
  console.error('Profiler error:', err);
  process.exit(1);
});
