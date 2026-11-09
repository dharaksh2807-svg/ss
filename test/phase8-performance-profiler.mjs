/**
 * Phase 8 Controlled Three.js Performance Profiler
 * Measures FPS, frame times (P50/P95/P99), stutters, draw calls, triangles,
 * geometries, textures, shader programs, JS heap, and chunk spikes across
 * all required scenarios.
 *
 * Usage:
 *   node test/phase8-performance-profiler.mjs [--save-baseline|--save-after]
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../artifacts/phase8');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const VIEWPORT = { width: 1440, height: 900 };

async function sampleScenario(page, scenarioName, setupFn, sampleFrames = 300) {
  console.log(`\n⏳ Profiling scenario: [${scenarioName}] (${sampleFrames} frames)...`);

  const results = await page.evaluate(async ({ setupCode, sampleFrames }) => {
    const game = window.__METRO_GAME__;
    if (!game) throw new Error('window.__METRO_GAME__ not found');

    // Run setup function in page context
    const fn = new Function('game', setupCode);
    await fn(game);

    const renderer = game.worldScene.renderer;
    const info = renderer.info;

    const frameTimes = [];
    const drawCalls = [];
    const triangles = [];
    const heapSizes = [];
    const chunkSpikes = [];

    let lastTime = performance.now();
    let frameCount = 0;
    let prevChunkIndex = game.trackManager?.chunkIndex ?? 0;

    return new Promise((resolve) => {
      function onFrame() {
        const now = performance.now();
        const dt = now - lastTime;
        lastTime = now;

        // Skip warmup first 2 frames
        if (frameCount > 2) {
          frameTimes.push(dt);
          drawCalls.push(info.render.calls);
          triangles.push(info.render.triangles);
          if (performance.memory) {
            heapSizes.push(performance.memory.usedJSHeapSize);
          }

          const curChunk = game.trackManager?.chunkIndex ?? 0;
          if (curChunk !== prevChunkIndex) {
            chunkSpikes.push({
              frame: frameCount,
              dt: parseFloat(dt.toFixed(2)),
              chunk: curChunk
            });
            prevChunkIndex = curChunk;
          }
        }

        frameCount++;
        if (frameCount < sampleFrames + 3) {
          requestAnimationFrame(onFrame);
        } else {
          frameTimes.sort((a, b) => a - b);
          const totalTime = frameTimes.reduce((acc, v) => acc + v, 0);
          const meanDt = totalTime / frameTimes.length;
          const medianDt = frameTimes[Math.floor(frameTimes.length * 0.50)];
          const p95Dt = frameTimes[Math.floor(frameTimes.length * 0.95)];
          const p99Dt = frameTimes[Math.floor(frameTimes.length * 0.99)];
          const maxDt = frameTimes[frameTimes.length - 1];
          const minDt = frameTimes[0];

          const stutters = frameTimes.filter(t => t > 33.33).length;
          const severeStutters = frameTimes.filter(t => t > 50.0).length;

          const meanDrawCalls = Math.round(drawCalls.reduce((acc, v) => acc + v, 0) / drawCalls.length);
          const maxDrawCalls = Math.max(...drawCalls);
          const meanTriangles = Math.round(triangles.reduce((acc, v) => acc + v, 0) / triangles.length);
          const maxTriangles = Math.max(...triangles);

          const initHeap = heapSizes.length > 0 ? parseFloat((heapSizes[0] / (1024 * 1024)).toFixed(2)) : null;
          const finalHeap = heapSizes.length > 0 ? parseFloat((heapSizes[heapSizes.length - 1] / (1024 * 1024)).toFixed(2)) : null;
          const deltaHeap = initHeap !== null && finalHeap !== null ? parseFloat((finalHeap - initHeap).toFixed(2)) : null;

          resolve({
            sampleFrames: frameTimes.length,
            meanFrameTimeMs: parseFloat(meanDt.toFixed(2)),
            p50FrameTimeMs: parseFloat(medianDt.toFixed(2)),
            p95FrameTimeMs: parseFloat(p95Dt.toFixed(2)),
            p99FrameTimeMs: parseFloat(p99Dt.toFixed(2)),
            minFrameTimeMs: parseFloat(minDt.toFixed(2)),
            maxFrameTimeMs: parseFloat(maxDt.toFixed(2)),
            avgFps: parseFloat((1000 / meanDt).toFixed(1)),
            stutterCount: stutters,
            severeStutterCount: severeStutters,
            stutterPct: parseFloat(((stutters / frameTimes.length) * 100).toFixed(1)),
            meanDrawCalls,
            maxDrawCalls,
            meanTriangles,
            maxTriangles,
            geometriesInMemory: info.memory.geometries,
            texturesInMemory: info.memory.textures,
            programsCompiled: info.programs ? info.programs.length : 0,
            initialHeapMB: initHeap,
            finalHeapMB: finalHeap,
            deltaHeapMB: deltaHeap,
            chunkSpikeCount: chunkSpikes.length,
            chunkSpikeMaxMs: chunkSpikes.length > 0 ? Math.max(...chunkSpikes.map(s => s.dt)) : 0
          });
        }
      }

      requestAnimationFrame(onFrame);
    });
  }, {
    setupCode: setupFn.toString().replace(/^[^{]*{\s*/, '').replace(/\s*}[^}]*$/, ''),
    sampleFrames
  });

  console.log(`  📊 FPS: ${results.avgFps} | P50: ${results.p50FrameTimeMs}ms | P95: ${results.p95FrameTimeMs}ms | P99: ${results.p99FrameTimeMs}ms`);
  console.log(`  🎨 Draw Calls: ${results.meanDrawCalls} (max ${results.maxDrawCalls}) | Tris: ${results.meanTriangles.toLocaleString()} | Geoms: ${results.geometriesInMemory} | Textures: ${results.texturesInMemory} | Shaders: ${results.programsCompiled}`);
  console.log(`  💾 Heap: ${results.initialHeapMB}MB → ${results.finalHeapMB}MB (Δ ${results.deltaHeapMB}MB) | Stutters (>33ms): ${results.stutterCount}`);

  return { scenario: scenarioName, ...results };
}

(async () => {
  const isSaveBaseline = process.argv.includes('--save-baseline');
  const isSaveAfter = process.argv.includes('--save-after');

  console.log('🚀 Launching Chromium profiler...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1
  });

  const page = await ctx.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Ensure dev unlocks so all themes can be tested
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    if (game?.progression?.state) {
      game.progression.state.unlockedThemes = [
        'MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO',
        'NEON_INDUSTRIAL', 'NEON_RAINLINE', 'ORBITAL_HALO',
        'ABYSSAL_GLASSLINE', 'DOOMSDAY_LAST_TRANSIT', 'PHANTOM_LINE',
        'HAUNTED_CARNIVAL', 'VIP_EXPRESS', 'RAHULVERSE',
        'MIDNIGHT_VELVET', 'CHRONO_KINGDOM', 'INFERNO_EXPRESS',
        'JURASSIC_RUSH', 'VIVA_HEAT'
      ];
    }
  });

  const suiteResults = [];

  // 1. Subway Lobby
  suiteResults.push(await sampleScenario(page, 'Lobby', () => {
    game.goToMenu();
    game.cameraController.setLobbyMode(true);
  }, 250));

  // 2. Normal Gameplay (Modern Metro, Initial Speed 19 m/s)
  suiteResults.push(await sampleScenario(page, 'Normal Gameplay', () => {
    game.progression.equipTheme('MODERN_METRO');
    game.startRun('NORMAL', true);
  }, 350));

  // 3. High-Speed Gameplay (Hard Mode, 45 m/s)
  suiteResults.push(await sampleScenario(page, 'High-Speed Gameplay (45 m/s)', () => {
    game.startRun('HARD', true);
    game.speed = 45.0;
  }, 350));

  // 4. Moving Trains & Dense Obstacles
  suiteResults.push(await sampleScenario(page, 'Moving Trains Traffic', () => {
    game.startRun('HARD', true);
    game.speed = 35.0;
  }, 350));

  // 5. Rooftop Traversal (Player running elevated on train roof deck)
  suiteResults.push(await sampleScenario(page, 'Rooftop Traversal', () => {
    game.startRun('NORMAL', true);
    // Snap runner onto roof elevation
    game.player.position.y = 4.35;
    game.player.groundY = 4.35;
    game.player.supportSurface = 'TRAIN_ROOF';
    game.player.state = 'ON_TRAIN';
  }, 350));

  // 6. Mitron Express (VIP_EXPRESS Political Comedy World)
  suiteResults.push(await sampleScenario(page, 'Mitron Express (VIP)', () => {
    game.progression.equipTheme('VIP_EXPRESS');
    game.startRun('NORMAL', true);
  }, 350));

  // 7. Rahulverse (RAHULVERSE Yatra Marathon World)
  suiteResults.push(await sampleScenario(page, 'Rahulverse', () => {
    game.progression.equipTheme('RAHULVERSE');
    game.startRun('NORMAL', true);
  }, 350));

  // 8. Abyssal Glassline (High-Drawcall Oceanic World)
  suiteResults.push(await sampleScenario(page, 'Abyssal Glassline', () => {
    game.progression.equipTheme('ABYSSAL_GLASSLINE');
    game.startRun('NORMAL', true);
  }, 350));

  // 9. Viva Heat (High-Drawcall Carnival / Desert World)
  suiteResults.push(await sampleScenario(page, 'Viva Heat', () => {
    game.progression.equipTheme('VIVA_HEAT');
    game.startRun('NORMAL', true);
  }, 350));

  // 10. Repeated Restarts (20 consecutive instant restarts)
  console.log('\n⏳ Profiling scenario: [20x Repeated Restarts Lifecycle]...');
  const restartResults = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const renderer = game.worldScene.renderer;
    const initialHeap = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const initialGeoms = renderer.info.memory.geometries;
    const initialTextures = renderer.info.memory.textures;

    const restartTimes = [];

    for (let i = 0; i < 20; i++) {
      const t0 = performance.now();
      game.quickRestart();
      // Step simulation by 10 frames
      for (let f = 0; f < 10; f++) {
        await new Promise(r => requestAnimationFrame(r));
      }
      restartTimes.push(performance.now() - t0);
    }

    const finalHeap = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const finalGeoms = renderer.info.memory.geometries;
    const finalTextures = renderer.info.memory.textures;

    return {
      scenario: '20x Repeated Restarts',
      iterations: 20,
      meanRestartMs: parseFloat((restartTimes.reduce((a, b) => a + b, 0) / 20).toFixed(2)),
      initialHeapMB: parseFloat((initialHeap / (1024 * 1024)).toFixed(2)),
      finalHeapMB: parseFloat((finalHeap / (1024 * 1024)).toFixed(2)),
      deltaHeapMB: parseFloat(((finalHeap - initialHeap) / (1024 * 1024)).toFixed(2)),
      initialGeoms,
      finalGeoms,
      deltaGeoms: finalGeoms - initialGeoms,
      initialTextures,
      finalTextures,
      deltaTextures: finalTextures - initialTextures,
      meanDrawCalls: renderer.info.render.calls,
      programsCompiled: renderer.info.programs.length
    };
  });
  console.log(`  📊 20x Restarts: avg ${restartResults.meanRestartMs}ms | Heap Δ: ${restartResults.deltaHeapMB}MB | Geoms Δ: ${restartResults.deltaGeoms} | Textures Δ: ${restartResults.deltaTextures}`);
  suiteResults.push(restartResults);

  // 11. Repeated World Switches (10 consecutive theme switches)
  console.log('\n⏳ Profiling scenario: [10x Repeated World Switches]...');
  const worldSwitchResults = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const renderer = game.worldScene.renderer;
    const initialHeap = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const initialGeoms = renderer.info.memory.geometries;
    const initialTextures = renderer.info.memory.textures;

    const worlds = [
      'VIP_EXPRESS', 'RAHULVERSE', 'ABYSSAL_GLASSLINE', 'VIVA_HEAT',
      'MODERN_METRO', 'CHRONO_KINGDOM', 'MIDNIGHT_VELVET', 'INFERNO_EXPRESS',
      'JURASSIC_RUSH', 'UNDERGROUND_METRO'
    ];

    const switchTimes = [];

    for (const w of worlds) {
      const t0 = performance.now();
      game.progression.equipTheme(w);
      game.startRun('NORMAL', true);
      for (let f = 0; f < 15; f++) {
        await new Promise(r => requestAnimationFrame(r));
      }
      switchTimes.push(performance.now() - t0);
    }

    const finalHeap = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const finalGeoms = renderer.info.memory.geometries;
    const finalTextures = renderer.info.memory.textures;

    return {
      scenario: '10x World Switches',
      iterations: worlds.length,
      meanSwitchMs: parseFloat((switchTimes.reduce((a, b) => a + b, 0) / worlds.length).toFixed(2)),
      initialHeapMB: parseFloat((initialHeap / (1024 * 1024)).toFixed(2)),
      finalHeapMB: parseFloat((finalHeap / (1024 * 1024)).toFixed(2)),
      deltaHeapMB: parseFloat(((finalHeap - initialHeap) / (1024 * 1024)).toFixed(2)),
      initialGeoms,
      finalGeoms,
      deltaGeoms: finalGeoms - initialGeoms,
      initialTextures,
      finalTextures,
      deltaTextures: finalTextures - initialTextures,
      meanDrawCalls: renderer.info.render.calls,
      programsCompiled: renderer.info.programs.length
    };
  });
  console.log(`  📊 10x Switches: avg ${worldSwitchResults.meanSwitchMs}ms | Heap Δ: ${worldSwitchResults.deltaHeapMB}MB | Geoms Δ: ${worldSwitchResults.deltaGeoms} | Textures Δ: ${worldSwitchResults.deltaTextures}`);
  suiteResults.push(worldSwitchResults);

  // 12. Long-Distance Continuous Play (1200 frames soak)
  suiteResults.push(await sampleScenario(page, 'Long-Distance Continuous Play (1200 frames)', () => {
    game.progression.equipTheme('MODERN_METRO');
    game.startRun('NORMAL', true);
  }, 1200));

  await browser.close();

  // Save report
  const filename = isSaveAfter
    ? path.join(OUT_DIR, 'phase8_optimized_profile.json')
    : path.join(OUT_DIR, 'phase8_baseline_profile.json');

  fs.writeFileSync(filename, JSON.stringify(suiteResults, null, 2), 'utf-8');
  console.log(`\n💾 Saved performance profile to: ${filename}`);

  console.log('\n======================================================');
  console.log('🏆 PHASE 8 PROFILING COMPLETED SUCCESSFULLY');
  console.log('======================================================');
})();

