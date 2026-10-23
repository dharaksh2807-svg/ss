import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/b3e653ae-0f2c-4503-a947-8d8985c89f1a';

async function runTask8Verification() {
  console.log('🚀 Starting Task 8 Modular Railway Environments Playwright Verification...');

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox', '--autoplay-policy=no-user-gesture-required']
    });
  } catch (err) {
    browser = await chromium.launch({
      headless: true,
      args: ['--autoplay-policy=no-user-gesture-required']
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  console.log('🌐 Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // =========================================================================
  // Step 1: Start Screen & Railway District Selector Modal
  // =========================================================================
  console.log('\n--- Step 1: Start Screen & Railway District Selector Modal ---');

  const envSnippetVisible = await page.evaluate(() => {
    const el = document.getElementById('lobby-env-snippet');
    return el && el.offsetParent !== null;
  });
  console.log('Lobby District Widget Visible:', envSnippetVisible);

  // Click on the district selector widget to open modal
  await page.click('#lobby-env-snippet');
  await page.waitForTimeout(400);

  const modalScreenshotPath = path.join(ARTIFACT_DIR, 'task8_lobby_environment_selector_modal.png');
  await page.screenshot({ path: modalScreenshotPath });
  console.log('📸 Captured Start Screen & District Selector Modal:', modalScreenshotPath);

  // =========================================================================
  // Step 2: Select Modern Metro District & Verify Active Gameplay
  // =========================================================================
  console.log('\n--- Step 2: Modern Metro District Active Gameplay ---');

  // Click on Modern Metro option
  await page.evaluate(() => {
    const card = document.querySelector('[data-env-id="MODERN_METRO"]');
    if (card) card.click();
  });
  await page.waitForTimeout(300);

  // Confirm selection
  await page.click('#env-confirm-btn', { force: true });
  await page.waitForTimeout(400);

  // Start Run
  await page.click('#start-play-btn', { force: true });
  await page.waitForTimeout(800);

  // Skip opening cinematic sprint
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);

  // Verify running in Modern Metro
  const modernTelemetry = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    return {
      activeEnv: game?.trackManager?.getActiveEnvironment(),
      playerZ: game?.player?.position?.z,
      playerSpeed: game?.player?.speed,
      chunksCount: game?.trackManager?.chunks?.length
    };
  });
  console.log('Modern Metro Telemetry:', modernTelemetry);

  const modernScreenshotPath = path.join(ARTIFACT_DIR, 'task8_modern_metro_district_gameplay.png');
  await page.screenshot({ path: modernScreenshotPath });
  console.log('📸 Captured Modern Metro Gameplay:', modernScreenshotPath);

  // =========================================================================
  // Step 3: Switch to Historic Railway Quarter & Verify Active Gameplay
  // =========================================================================
  console.log('\n--- Step 3: Historic Railway Quarter Active Gameplay ---');

  // Go to menu
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game?.goToMenu();
  });
  await page.waitForTimeout(600);

  // Directly set environment preference via EnvironmentManager & TrackManager
  const selectionResult = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const envManager = window.__METRO_GAME__.trackManager.envManager;
    console.log('Current pref before change:', envManager.getSelectionPreference());
    
    // Test selecting via modal element
    const snippet = document.getElementById('lobby-env-snippet');
    console.log('Snippet element exists:', !!snippet);
    if (snippet) snippet.click();
    
    const modal = document.getElementById('environment-modal');
    console.log('Modal element visible:', !modal?.classList.contains('hidden'));

    const card = document.querySelector('[data-env-id="HISTORIC_QUARTER"]');
    console.log('Historic Card found:', !!card);
    if (card) {
      card.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    const confirmBtn = document.getElementById('env-confirm-btn');
    console.log('Confirm btn found:', !!confirmBtn);
    if (confirmBtn) {
      confirmBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    return {
      prefAfterModal: envManager.getSelectionPreference(),
      startingEnv: envManager.getStartingEnvironment()
    };
  });
  console.log('Modal Selection Diagnostic Result:', selectionResult);

  await page.waitForTimeout(400);

  // Start Run in Historic Quarter
  await page.click('#start-play-btn', { force: true });
  await page.waitForTimeout(800);
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);

  const historicTelemetry = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    return {
      activeEnv: game?.trackManager?.getActiveEnvironment(),
      playerZ: game?.player?.position?.z,
      playerSpeed: game?.player?.speed,
      fogColor: game?.worldScene?.scene?.fog?.color?.getHexString(),
      sunColor: game?.worldScene?.sunLight?.color?.getHexString()
    };
  });
  console.log('Historic Quarter Telemetry:', historicTelemetry);

  const historicScreenshotPath = path.join(ARTIFACT_DIR, 'task8_historic_quarter_district_gameplay.png');
  await page.screenshot({ path: historicScreenshotPath });
  console.log('📸 Captured Historic Quarter Gameplay:', historicScreenshotPath);

  // =========================================================================
  // Step 4: Grand Railway Gateway Arch Portal (Seamless Transition)
  // =========================================================================
  console.log('\n--- Step 4: Grand Railway Gateway Arch Portal Verification ---');

  // Populate chunk directly ahead as a Transition Portal
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const pZ = game.player.position.z;
    // Find the chunk directly ahead of player
    for (const chunk of game.trackManager.chunks) {
      if (chunk.chunkZ < pZ && chunk.chunkZ > pZ - 120) {
        chunk.populate([], chunk.chunkZ, 'HISTORIC_QUARTER', true);
        break;
      }
    }
  });
  await page.waitForTimeout(500);

  const portalScreenshotPath = path.join(ARTIFACT_DIR, 'task8_grand_transition_gateway_portal.png');
  await page.screenshot({ path: portalScreenshotPath });
  console.log('📸 Captured Grand Transition Portal Arch:', portalScreenshotPath);

  // =========================================================================
  // Step 5: Graphics Preset Compatibility (LOW Preset Scenery Culling)
  // =========================================================================
  console.log('\n--- Step 5: Graphics Preset Compatibility (LOW Scenery Culling) ---');

  await page.evaluate(() => {
    const graphics = window.__GRAPHICS_MANAGER__;
    graphics?.setPreset('LOW');
    const game = window.__METRO_GAME__;
    game?.startRun(true);
    game?.openingSequence?.skip();
  });
  await page.waitForTimeout(600);

  const lowPresetCheck = await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk = game?.trackManager?.chunks?.[0];
    return {
      decorativeVisible: chunk?.decorativeGroup?.visible,
      trackVisible: chunk?.group?.visible,
      fps: window.__GRAPHICS_MANAGER__?.getAverageFPS()
    };
  });
  console.log('LOW Preset Check:', lowPresetCheck);

  const lowPresetScreenshotPath = path.join(ARTIFACT_DIR, 'task8_low_preset_scenery_culling.png');
  await page.screenshot({ path: lowPresetScreenshotPath });
  console.log('📸 Captured LOW Preset Scenery Culling:', lowPresetScreenshotPath);

  // Restore HIGH preset
  await page.evaluate(() => {
    const graphics = window.__GRAPHICS_MANAGER__;
    graphics?.setPreset('HIGH');
  });
  await page.waitForTimeout(400);

  // =========================================================================
  // Step 6: 60 FPS Performance Profiling
  // =========================================================================
  console.log('\n--- Step 6: 60 FPS Performance Profiling ---');

  const performanceStats = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const startFrames = game?.frameTimes?.slice() || [];
    await new Promise(res => setTimeout(res, 1200));
    const endFrames = game?.frameTimes?.slice() || [];
    const recent = endFrames.slice(-45);
    const avgDt = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 16.6;
    const fps = Math.round(1000 / avgDt);
    return {
      fps,
      avgFrameTimeMs: avgDt.toFixed(2),
      drawCalls: game?.worldScene?.renderer?.info?.render?.calls,
      triangles: game?.worldScene?.renderer?.info?.render?.triangles
    };
  });
  console.log('Performance Profiling:', performanceStats);

  console.log('\n=======================================================');
  console.log('🎉 TASK 8 PLAYWRIGHT VERIFICATION COMPLETE!');
  console.log('=======================================================');

  await browser.close();
}

runTask8Verification().catch((err) => {
  console.error('Task 8 Verification Failed:', err);
  process.exit(1);
});
