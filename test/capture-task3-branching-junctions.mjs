import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/2f350341-c53b-4c07-92cd-b647a661dc87';

async function runJunctionVisualCapture() {
  console.log('🚀 Launching Chrome for Task 3 Branching Junctions Visual Capture...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('[BROWSER ERROR]', msg.text());
    }
  });

  try {
    console.log('🌐 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    await page.waitForFunction(() => !!window.__METRO_GAME__);
    console.log('🎮 Metro Runner 3D ready!');

    // -------------------------------------------------------------
    // Capture 1: Approaching Grand Central Switchyard Fork
    // -------------------------------------------------------------
    console.log('\n📸 1/4 Capturing Approaching Railway Junction Fork...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const juncDir = window.__JUNCTIONS__;

      game.startRun('NORMAL');
      if (game.openingSequence) {
        game.openingSequence.skip();
      }
      game.player.activateReviveGrace(999999);
      game.player.isIntroInvincible = true;

      // Force junction on upcoming chunk
      juncDir.resetRunState();
      juncDir.forceJunction('JUNCTION_SWITCHYARD_01');
      game.trackManager.reset(false);

      // Position runner in Lane 0 approaching the overhead dual-signal gantry
      game.player.currentLane = 0;
      game.player.position.x = 0;
      game.player.targetX = 0;
      game.player.position.y = 0.9;
      game.player.groundY = 0.9;

      // Emit approaching guidance banner
      window.__METRO_BUS__.emit(window.__METRO_EVENTS__.JUNCTION_APPROACHING, {
        id: 'JUNCTION_SWITCHYARD_01',
        name: 'Grand Central Switchyard',
        location: 'Sector 4 Railway Turnout'
      });
    });

    await page.waitForTimeout(1400);
    const shot1Path = path.join(ARTIFACT_DIR, 'task3_junction_01_approaching_fork.png');
    await page.screenshot({ path: shot1Path });
    console.log('✅ Saved:', shot1Path);

    // -------------------------------------------------------------
    // Capture 2: Route A (Mainline Metro) Gameplay
    // -------------------------------------------------------------
    console.log('\n📸 2/4 Capturing Route A: Central Metro Mainline...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const juncDir = window.__JUNCTIONS__;

      juncDir.resetRunState();
      juncDir.forceJunction('JUNCTION_SWITCHYARD_01', 'ROUTE_A_MAIN_METRO');
      game.trackManager.reset(false);

      // Player in center lane running down modern metro mainline
      game.player.currentLane = 0;
      game.player.position.x = 0;
      game.player.targetX = 0;
      game.player.position.y = 0.9;
      game.player.groundY = 0.9;

      window.__METRO_BUS__.emit(window.__METRO_EVENTS__.JUNCTION_COMMITTED, {
        junctionId: 'JUNCTION_SWITCHYARD_01',
        junctionName: 'Grand Central Switchyard',
        chosenRouteId: 'ROUTE_A_MAIN_METRO',
        chosenRouteName: 'Central Metro Mainline',
        themeId: 'MODERN_METRO'
      });
    });

    await page.waitForTimeout(1400);
    const shot2Path = path.join(ARTIFACT_DIR, 'task3_junction_02_route_a_metro.png');
    await page.screenshot({ path: shot2Path });
    console.log('✅ Saved:', shot2Path);

    // -------------------------------------------------------------
    // Capture 3: Route B (Industrial Freight Overpass) Gameplay
    // -------------------------------------------------------------
    console.log('\n📸 3/4 Capturing Route B: Industrial Freight Overpass...');
    await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      const juncDir = window.__JUNCTIONS__;

      juncDir.resetRunState();
      juncDir.forceJunction('JUNCTION_SWITCHYARD_01', 'ROUTE_B_INDUSTRIAL_OVERPASS');
      game.trackManager.reset(false);

      // Apply nocturnal industrial theme
      const { NEON_INDUSTRIAL_THEME } = await import('./src/environment/EnvironmentConfig.js');
      game.trackManager.setEnvironment('NEON_INDUSTRIAL');
      game.worldScene.applyEnvironment(NEON_INDUSTRIAL_THEME);

      // Elevate onto freight train rooftop viaduct
      game.player.currentLane = 0;
      game.player.position.x = 0;
      game.player.targetX = 0;
      game.player.position.y = 4.35;
      game.player.groundY = 4.35;

      window.__METRO_BUS__.emit(window.__METRO_EVENTS__.JUNCTION_COMMITTED, {
        junctionId: 'JUNCTION_SWITCHYARD_01',
        junctionName: 'Grand Central Switchyard',
        chosenRouteId: 'ROUTE_B_INDUSTRIAL_OVERPASS',
        chosenRouteName: 'Industrial Freight Overpass',
        themeId: 'NEON_INDUSTRIAL'
      });
    });

    await page.waitForTimeout(1400);
    const shot3Path = path.join(ARTIFACT_DIR, 'task3_junction_03_route_b_industrial.png');
    await page.screenshot({ path: shot3Path });
    console.log('✅ Saved:', shot3Path);

    // -------------------------------------------------------------
    // Capture 4: In-Game HUD Route Announcement Banner
    // -------------------------------------------------------------
    console.log('\n📸 4/4 Capturing In-Game HUD Route Announcement Banner...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.hud.showFeedbackBadge('🛤 ROUTE COMMITTED: INDUSTRIAL FREIGHT OVERPASS (+1200 BONUS PTS)!', 'precision');
    });

    await page.waitForTimeout(500);
    const shot4Path = path.join(ARTIFACT_DIR, 'task3_junction_04_hud_route_banner.png');
    await page.screenshot({ path: shot4Path });
    console.log('✅ Saved:', shot4Path);

    console.log('\n🎉 ALL 4 JUNCTION SCREENSHOTS SUCCESSFULLY CAPTURED!');
  } catch (err) {
    console.error('❌ Capture Error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runJunctionVisualCapture().catch(e => {
  console.error(e);
  process.exit(1);
});
