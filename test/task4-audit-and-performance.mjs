import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/70c5e932-5b43-4724-8861-c9ce95ff1151/task4_audit_screenshots';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function runTask4Audit() {
  console.log('🚀 Launching System Chrome for Task 4 Visual & Performance Audit...');
  let browser;
  try {
    browser = await chromium.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
      args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--no-sandbox']
    });
  } catch (err) {
    browser = await chromium.launch({
      headless: true,
      args: ['--enable-webgl', '--ignore-gpu-blocklist']
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('Warning')) {
      console.log('PAGE LOG:', text);
    }
  });

  console.log('🌐 Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__);
  console.log('🎮 Game engine confirmed on window.__METRO_GAME__');

  // Helper to configure scene for clean architectural screenshots
  async function configureScene({
    envId = 'MODERN_METRO',
    quality = 'HIGH',
    landmark = null,
    smallMoment = null,
    atmosphere = null,
    hideHUD = true,
    seed = 1337,
    waitMs = 1200
  }) {
    await page.evaluate(async ({ envId, quality, landmark, smallMoment, atmosphere, hideHUD, seed }) => {
      const game = window.__METRO_GAME__;

      // Start run in normal mode
      game.startRun('NORMAL', true);
      if (game.openingSequence) {
        game.openingSequence.skip();
      }

      // Grant permanent invulnerability for screenshot capture
      game.player.activateReviveGrace(999999);
      game.player.isIntroInvincible = true;

      // Hide all overlay modals
      document.querySelectorAll('.modal, .overlay, #revive-modal, #game-over-modal').forEach(el => el.classList.add('hidden'));

      // Configure graphics preset
      const { GraphicsManager } = await import('./src/scene/GraphicsManager.js');
      GraphicsManager.getInstance().setPreset(quality);

      // Set environment seed
      game.trackManager.setSeed(seed, true);

      // Set overrides if requested
      const { EnvironmentalEncounterDirector } = await import('./src/environment/EnvironmentalEncounterDirector.js');
      const encounterDirector = EnvironmentalEncounterDirector.getInstance();
      encounterDirector.setForcedLandmark(landmark);
      encounterDirector.setForcedAtmosphere(atmosphere);

      // Set environment and theme
      const { EnvironmentRegistry } = await import('./src/environment/EnvironmentRegistry.js');
      const theme = EnvironmentRegistry.getInstance().get(envId);

      game.trackManager.setEnvironment(envId);
      game.worldScene.applyEnvironment(theme);

      // Reset chunks to fresh start in this environment
      game.trackManager.reset(false);

      if (hideHUD) {
        const hud = document.getElementById('hud');
        if (hud) hud.style.display = 'none';
        const start = document.getElementById('start-screen');
        if (start) start.style.display = 'none';
        const debug = document.getElementById('worldgen-debug-overlay');
        if (debug) debug.style.display = 'none';
      } else {
        const hud = document.getElementById('hud');
        if (hud) hud.style.display = 'block';
      }
    }, { envId, quality, landmark, smallMoment, atmosphere, hideHUD, seed });

    await page.waitForTimeout(waitMs);
  }

  // =========================================================================
  // Part 1: Visual Distinctiveness & Comparison Screenshots
  // =========================================================================
  console.log('\n📸 === PART 1: CAPTURING AUDIT SCREENSHOTS ===\n');

  // 1. Default Urban Scene (with HUD)
  console.log('📸 1/20 Capturing Default Starting Urban Scene (with HUD)...');
  await configureScene({ envId: 'MODERN_METRO', quality: 'HIGH', hideHUD: false, waitMs: 1500 });
  await page.screenshot({ path: path.join(OUT_DIR, '01_default_urban_scene.png') });

  // 2. Modern Metro District (Clean)
  console.log('📸 2/20 Capturing Modern Metro District (Clean, no HUD)...');
  await configureScene({ envId: 'MODERN_METRO', quality: 'HIGH', hideHUD: true, waitMs: 1500 });
  await page.screenshot({ path: path.join(OUT_DIR, '02_district_modern_metro_clean.png') });

  // 3. Historic Railway Quarter (Clean)
  console.log('📸 3/20 Capturing Historic Railway Quarter (Clean, no HUD)...');
  await configureScene({ envId: 'HISTORIC_QUARTER', quality: 'HIGH', hideHUD: true, waitMs: 1500 });
  await page.screenshot({ path: path.join(OUT_DIR, '03_district_historic_quarter_clean.png') });

  // 4. Underground Metro (Clean)
  console.log('📸 4/20 Capturing Underground Metro (Clean, no HUD)...');
  await configureScene({ envId: 'UNDERGROUND_METRO', quality: 'HIGH', hideHUD: true, waitMs: 1500 });
  await page.screenshot({ path: path.join(OUT_DIR, '04_district_underground_metro_clean.png') });

  // 5. Neon Industrial Rail Yard (Clean)
  console.log('📸 5/20 Capturing Neon Industrial Rail Yard (Clean, no HUD)...');
  await configureScene({ envId: 'NEON_INDUSTRIAL', quality: 'HIGH', hideHUD: true, waitMs: 1500 });
  await page.screenshot({ path: path.join(OUT_DIR, '05_district_neon_industrial_clean.png') });

  // 6. Landmark: Grand Railway Station
  console.log('📸 6/20 Capturing Landmark: Grand Railway Station...');
  await configureScene({ envId: 'MODERN_METRO', landmark: 'GRAND_RAILWAY_STATION', quality: 'HIGH', waitMs: 1800 });
  await page.screenshot({ path: path.join(OUT_DIR, '06_landmark_grand_railway_station.png') });

  // 7. Landmark: Historic Stone Viaduct
  console.log('📸 7/20 Capturing Landmark: Historic Stone Viaduct...');
  await configureScene({ envId: 'HISTORIC_QUARTER', landmark: 'HISTORIC_STONE_VIADUCT', quality: 'HIGH', waitMs: 1800 });
  await page.screenshot({ path: path.join(OUT_DIR, '07_landmark_historic_stone_viaduct.png') });

  // 8. Landmark: Modern Glass Transit Hub
  console.log('📸 8/20 Capturing Landmark: Modern Glass Transit Hub...');
  await configureScene({ envId: 'MODERN_METRO', landmark: 'MODERN_GLASS_TRANSIT_HUB', quality: 'HIGH', waitMs: 1800 });
  await page.screenshot({ path: path.join(OUT_DIR, '08_landmark_modern_glass_transit_hub.png') });

  // 9. Landmark: Industrial Maintenance Yard
  console.log('📸 9/20 Capturing Landmark: Industrial Maintenance Yard...');
  await configureScene({ envId: 'HISTORIC_QUARTER', landmark: 'INDUSTRIAL_MAINTENANCE_YARD', quality: 'HIGH', waitMs: 1800 });
  await page.screenshot({ path: path.join(OUT_DIR, '09_landmark_industrial_maintenance_yard.png') });

  // 10. Landmark: Open Waterfront Vista
  console.log('📸 10/20 Capturing Landmark: Open Waterfront Vista...');
  await configureScene({ envId: 'MODERN_METRO', landmark: 'OPEN_WATERFRONT_VISTA', quality: 'HIGH', waitMs: 1800 });
  await page.screenshot({ path: path.join(OUT_DIR, '10_landmark_open_waterfront_vista.png') });

  // 11. Landmark: Underground Grand Station
  console.log('📸 11/20 Capturing Landmark: Underground Grand Station...');
  await configureScene({ envId: 'UNDERGROUND_METRO', landmark: 'UNDERGROUND_GRAND_STATION', quality: 'HIGH', waitMs: 1800 });
  await page.screenshot({ path: path.join(OUT_DIR, '11_landmark_underground_grand_station.png') });

  // 12. Landmark: Rooftop Skyline Moment
  console.log('📸 12/20 Capturing Landmark: Rooftop Skyline Moment...');
  await configureScene({ envId: 'MODERN_METRO', landmark: 'ROOFTOP_SKYLINE_MOMENT', quality: 'HIGH', waitMs: 1800 });
  await page.screenshot({ path: path.join(OUT_DIR, '12_landmark_rooftop_skyline_moment.png') });

  // 13. Transition: Surface to Underground Tunnel Portal
  console.log('📸 13/20 Capturing Transition: Surface to Underground Portal Entry...');
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const { EnvironmentDirector } = await import('./src/environment/EnvironmentDirector.js');
    const { SceneryFactory } = await import('./src/environment/SceneryFactory.js');
    const { EnvironmentRegistry } = await import('./src/environment/EnvironmentRegistry.js');

    const theme = EnvironmentRegistry.getInstance().get('MODERN_METRO');
    game.trackManager.setEnvironment('MODERN_METRO');
    game.worldScene.applyEnvironment(theme);
    game.trackManager.reset(false);

    // Decorate upcoming chunk as subterranean portal entry
    const chunk1 = game.trackManager.chunks[1];
    chunk1.decorativeGroup.clear();
    SceneryFactory.getInstance().buildScenery(
      chunk1.decorativeGroup,
      theme,
      chunk1.chunkZ,
      true, // isTransition
      true, // isTunnel
      'ENTRY', // tunnelPortal
      'FULL',
      9999
    );
  });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(OUT_DIR, '13_transition_surface_to_underground.png') });

  // 14. Transition: Underground to Surface Daylight Emergence
  console.log('📸 14/20 Capturing Transition: Underground to Surface Daylight Emergence...');
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const { SceneryFactory } = await import('./src/environment/SceneryFactory.js');
    const { EnvironmentRegistry } = await import('./src/environment/EnvironmentRegistry.js');

    const theme = EnvironmentRegistry.getInstance().get('UNDERGROUND_METRO');
    game.trackManager.setEnvironment('UNDERGROUND_METRO');
    game.worldScene.applyEnvironment(theme);
    game.trackManager.reset(false);

    // Decorate upcoming chunk as subterranean portal exit
    const chunk1 = game.trackManager.chunks[1];
    chunk1.decorativeGroup.clear();
    SceneryFactory.getInstance().buildScenery(
      chunk1.decorativeGroup,
      theme,
      chunk1.chunkZ,
      true, // isTransition
      true, // isTunnel
      'EXIT', // tunnelPortal
      'FULL',
      8888
    );
  });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(OUT_DIR, '14_transition_underground_to_surface.png') });

  // 15. Graphics Quality LOW Preset
  console.log('📸 15/20 Capturing Graphics Quality LOW Preset...');
  await configureScene({ envId: 'MODERN_METRO', quality: 'LOW', waitMs: 1200 });
  await page.screenshot({ path: path.join(OUT_DIR, '15_quality_low_preset.png') });

  // 16. Graphics Quality HIGH Preset
  console.log('📸 16/20 Capturing Graphics Quality HIGH Preset...');
  await configureScene({ envId: 'MODERN_METRO', quality: 'HIGH', waitMs: 1200 });
  await page.screenshot({ path: path.join(OUT_DIR, '16_quality_high_preset.png') });

  // 17. Mobile Gameplay Portrait View (390 x 844 iPhone 14 Pro style)
  console.log('📸 17/20 Capturing Mobile Gameplay Portrait View...');
  await page.setViewportSize({ width: 390, height: 844 });
  await configureScene({ envId: 'MODERN_METRO', quality: 'HIGH', hideHUD: false, waitMs: 1500 });
  await page.screenshot({ path: path.join(OUT_DIR, '17_mobile_gameplay_portrait.png') });

  // Restore Desktop Viewport
  await page.setViewportSize({ width: 1440, height: 900 });

  // 18-20. Multi-Seed Scenery Layout Variations
  console.log('📸 18/20 Capturing Seed 1001 Scenery Composition...');
  await configureScene({ envId: 'MODERN_METRO', seed: 1001, quality: 'HIGH', waitMs: 1400 });
  await page.screenshot({ path: path.join(OUT_DIR, '18_seed_1001_variation.png') });

  console.log('📸 19/20 Capturing Seed 2024 Scenery Composition...');
  await configureScene({ envId: 'MODERN_METRO', seed: 2024, quality: 'HIGH', waitMs: 1400 });
  await page.screenshot({ path: path.join(OUT_DIR, '19_seed_2024_variation.png') });

  console.log('📸 20/20 Capturing Seed 8888 Scenery Composition...');
  await configureScene({ envId: 'MODERN_METRO', seed: 8888, quality: 'HIGH', waitMs: 1400 });
  await page.screenshot({ path: path.join(OUT_DIR, '20_seed_8888_variation.png') });

  console.log('✅ All 20 audit screenshots captured successfully!');

  // =========================================================================
  // Part 2: Rigorous Performance Benchmarking Across 5 Environments
  // =========================================================================
  console.log('\n📊 === PART 2: PERFORMANCE BENCHMARKING ACROSS 5 SCENARIOS ===\n');

  async function profileScenario(scenarioName, setupFn) {
    console.log(`⏱️ Profiling Scenario: [${scenarioName}] (300 frames)...`);
    await setupFn();

    const stats = await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      const renderer = game.worldScene.renderer;
      const info = renderer.info;

      const frameTimes = [];
      const drawCalls = [];
      const triangles = [];
      const heapSizes = [];
      const chunkRecyclingSpikes = [];

      let lastTime = performance.now();
      let frameCount = 0;
      const maxFrames = 300;
      let prevChunkZ = game.trackManager.chunks[0].chunkZ;

      return new Promise((resolve) => {
        function sampleFrame() {
          const now = performance.now();
          const dt = now - lastTime;
          lastTime = now;

          if (frameCount > 0) {
            frameTimes.push(dt);
            drawCalls.push(info.render.calls);
            triangles.push(info.render.triangles);
            if (performance.memory) {
              heapSizes.push(performance.memory.usedJSHeapSize);
            }

            const currentChunkZ = game.trackManager.chunks[0].chunkZ;
            if (currentChunkZ !== prevChunkZ) {
              chunkRecyclingSpikes.push(dt);
              prevChunkZ = currentChunkZ;
            }
          }

          frameCount++;
          if (frameCount < maxFrames) {
            requestAnimationFrame(sampleFrame);
          } else {
            frameTimes.sort((a, b) => a - b);
            const totalTime = frameTimes.reduce((acc, v) => acc + v, 0);
            const meanDt = totalTime / frameTimes.length;
            const medianDt = frameTimes[Math.floor(frameTimes.length * 0.5)];
            const p95Dt = frameTimes[Math.floor(frameTimes.length * 0.95)];
            const p99Dt = frameTimes[Math.floor(frameTimes.length * 0.99)];
            const maxDt = frameTimes[frameTimes.length - 1];
            const minDt = frameTimes[0];

            const meanCalls = drawCalls.reduce((acc, v) => acc + v, 0) / drawCalls.length;
            const maxCalls = Math.max(...drawCalls);
            const meanTris = triangles.reduce((acc, v) => acc + v, 0) / triangles.length;
            const maxTris = Math.max(...triangles);

            const initialHeap = heapSizes.length > 0 ? heapSizes[0] / (1024 * 1024) : null;
            const finalHeap = heapSizes.length > 0 ? heapSizes[heapSizes.length - 1] / (1024 * 1024) : null;

            resolve({
              meanFrameTimeMs: parseFloat(meanDt.toFixed(2)),
              medianFrameTimeMs: parseFloat(medianDt.toFixed(2)),
              p95FrameTimeMs: parseFloat(p95Dt.toFixed(2)),
              p99FrameTimeMs: parseFloat(p99Dt.toFixed(2)),
              maxSpikeMs: parseFloat(maxDt.toFixed(2)),
              avgFps: parseFloat((1000 / meanDt).toFixed(1)),
              onePercentLowFps: parseFloat((1000 / p99Dt).toFixed(1)),
              meanDrawCalls: Math.round(meanCalls),
              maxDrawCalls: maxCalls,
              meanTriangles: Math.round(meanTris),
              maxTriangles: maxTris,
              geometriesInMemory: info.memory.geometries,
              texturesInMemory: info.memory.textures,
              initialHeapMB: initialHeap ? parseFloat(initialHeap.toFixed(2)) : null,
              finalHeapMB: finalHeap ? parseFloat(finalHeap.toFixed(2)) : null,
              chunkRecyclingSpikesCount: chunkRecyclingSpikes.length,
              chunkRecyclingMaxMs: chunkRecyclingSpikes.length > 0 ? parseFloat(Math.max(...chunkRecyclingSpikes).toFixed(2)) : 0
            });
          }
        }
        requestAnimationFrame(sampleFrame);
      });
    });

    console.log(`  -> Avg FPS: ${stats.avgFps} | 1% Low: ${stats.onePercentLowFps} FPS | Mean Frame: ${stats.meanFrameTimeMs}ms | Draw Calls: ${stats.meanDrawCalls} | Tris: ${stats.meanTriangles}`);
    return stats;
  }

  const benchmarkReport = {};

  // Scenario 1: Open Modern Metro Urban Environment
  benchmarkReport.openUrbanEnvironment = await profileScenario('Open Modern Metro', async () => {
    await configureScene({ envId: 'MODERN_METRO', quality: 'HIGH', hideHUD: false, waitMs: 800 });
  });

  // Scenario 2: Heavy Historic Quarter Architectural Section
  benchmarkReport.heavyArchitecturalSection = await profileScenario('Heavy Historic Quarter', async () => {
    await configureScene({ envId: 'HISTORIC_QUARTER', quality: 'HIGH', hideHUD: false, waitMs: 800 });
  });

  // Scenario 3: Underground Metro Tunnel
  benchmarkReport.undergroundTunnel = await profileScenario('Underground Metro Tunnel', async () => {
    await configureScene({ envId: 'UNDERGROUND_METRO', quality: 'HIGH', hideHUD: false, waitMs: 800 });
  });

  // Scenario 4: Landmark Sequence (Open Waterfront Vista)
  benchmarkReport.landmarkSequence = await profileScenario('Landmark: Open Waterfront Vista', async () => {
    await configureScene({ envId: 'MODERN_METRO', landmark: 'OPEN_WATERFRONT_VISTA', quality: 'HIGH', hideHUD: false, waitMs: 800 });
  });

  // Scenario 5: District Transition (Portal Crossing)
  benchmarkReport.districtTransition = await profileScenario('District Transition', async () => {
    await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      const { SceneryFactory } = await import('./src/environment/SceneryFactory.js');
      const { EnvironmentRegistry } = await import('./src/environment/EnvironmentRegistry.js');
      const theme = EnvironmentRegistry.getInstance().get('MODERN_METRO');
      game.trackManager.setEnvironment('MODERN_METRO');
      game.worldScene.applyEnvironment(theme);
      game.trackManager.reset(false);
      const chunk1 = game.trackManager.chunks[1];
      chunk1.decorativeGroup.clear();
      SceneryFactory.getInstance().buildScenery(
        chunk1.decorativeGroup,
        theme,
        chunk1.chunkZ,
        true,
        true,
        'ENTRY',
        'FULL',
        9999
      );
    });
    await page.waitForTimeout(600);
  });

  const benchmarkPath = path.join(OUT_DIR, 'task4_benchmark_results.json');
  fs.writeFileSync(benchmarkPath, JSON.stringify(benchmarkReport, null, 2));
  console.log(`\n💾 Saved detailed benchmark report to: ${benchmarkPath}`);

  console.log('\n📊 === BENCHMARK SUMMARY TABLE ===');
  console.table({
    'Open Modern Metro': {
      'Avg FPS': benchmarkReport.openUrbanEnvironment.avgFps,
      '1% Low FPS': benchmarkReport.openUrbanEnvironment.onePercentLowFps,
      'Mean Frame (ms)': benchmarkReport.openUrbanEnvironment.meanFrameTimeMs,
      'p99 Frame (ms)': benchmarkReport.openUrbanEnvironment.p99FrameTimeMs,
      'Draw Calls': benchmarkReport.openUrbanEnvironment.meanDrawCalls,
      'Triangles': benchmarkReport.openUrbanEnvironment.meanTriangles,
      'Heap (MB)': benchmarkReport.openUrbanEnvironment.finalHeapMB
    },
    'Historic Quarter': {
      'Avg FPS': benchmarkReport.heavyArchitecturalSection.avgFps,
      '1% Low FPS': benchmarkReport.heavyArchitecturalSection.onePercentLowFps,
      'Mean Frame (ms)': benchmarkReport.heavyArchitecturalSection.meanFrameTimeMs,
      'p99 Frame (ms)': benchmarkReport.heavyArchitecturalSection.p99FrameTimeMs,
      'Draw Calls': benchmarkReport.heavyArchitecturalSection.meanDrawCalls,
      'Triangles': benchmarkReport.heavyArchitecturalSection.meanTriangles,
      'Heap (MB)': benchmarkReport.heavyArchitecturalSection.finalHeapMB
    },
    'Underground Tunnel': {
      'Avg FPS': benchmarkReport.undergroundTunnel.avgFps,
      '1% Low FPS': benchmarkReport.undergroundTunnel.onePercentLowFps,
      'Mean Frame (ms)': benchmarkReport.undergroundTunnel.meanFrameTimeMs,
      'p99 Frame (ms)': benchmarkReport.undergroundTunnel.p99FrameTimeMs,
      'Draw Calls': benchmarkReport.undergroundTunnel.meanDrawCalls,
      'Triangles': benchmarkReport.undergroundTunnel.meanTriangles,
      'Heap (MB)': benchmarkReport.undergroundTunnel.finalHeapMB
    },
    'Landmark Sequence': {
      'Avg FPS': benchmarkReport.landmarkSequence.avgFps,
      '1% Low FPS': benchmarkReport.landmarkSequence.onePercentLowFps,
      'Mean Frame (ms)': benchmarkReport.landmarkSequence.meanFrameTimeMs,
      'p99 Frame (ms)': benchmarkReport.landmarkSequence.p99FrameTimeMs,
      'Draw Calls': benchmarkReport.landmarkSequence.meanDrawCalls,
      'Triangles': benchmarkReport.landmarkSequence.meanTriangles,
      'Heap (MB)': benchmarkReport.landmarkSequence.finalHeapMB
    },
    'District Transition': {
      'Avg FPS': benchmarkReport.districtTransition.avgFps,
      '1% Low FPS': benchmarkReport.districtTransition.onePercentLowFps,
      'Mean Frame (ms)': benchmarkReport.districtTransition.meanFrameTimeMs,
      'p99 Frame (ms)': benchmarkReport.districtTransition.p99FrameTimeMs,
      'Draw Calls': benchmarkReport.districtTransition.meanDrawCalls,
      'Triangles': benchmarkReport.districtTransition.meanTriangles,
      'Heap (MB)': benchmarkReport.districtTransition.finalHeapMB
    }
  });

  await browser.close();
  console.log('\n🎉 Task 4 Visual & Performance Audit Completed Successfully!');
}

runTask4Audit().catch((err) => {
  console.error('Audit run failed:', err);
  process.exit(1);
});
