import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/2f350341-c53b-4c07-92cd-b647a661dc87';

async function runSecretRoutesCapture() {
  console.log('🚀 Launching Chrome for Task 2 Secret Routes Visual Capture...');
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
    // Capture 1: Abandoned Metro Platform (Secret 1)
    // -------------------------------------------------------------
    console.log('\n📸 1/4 Capturing Secret 1: Abandoned Metro Platform...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const director = window.__SECRET_ROUTES__;
      
      // Start run in normal mode
      game.startRun('NORMAL');
      if (game.openingSequence) {
        game.openingSequence.skip();
      }
      game.player.activateReviveGrace(999999);
      game.player.isIntroInvincible = true;

      // Force secret encounter
      director.resetRunState();
      director.forceEncounter('ABANDONED_METRO_PLATFORM', 1001);

      // Reset chunks so next chunk immediately schedules ABANDONED_METRO_PLATFORM
      game.trackManager.reset(false);

      // Move player into Left Siding (Lane -1)
      game.player.currentLane = -1;
      game.player.position.x = -3.5;
      game.player.targetX = -3.5;

      // Trigger discovery event
      window.__METRO_BUS__.emit(window.__METRO_EVENTS__.SECRET_ROUTE_ENTERED, {
        id: 'ABANDONED_METRO_PLATFORM',
        name: 'Abandoned Metro Platform',
        isFirstDiscovery: true,
        firstDiscoveryCoins: 50
      });
    });

    await page.waitForTimeout(1400);
    const shot1Path = path.join(ARTIFACT_DIR, 'task2_secret_01_abandoned_platform.png');
    await page.screenshot({ path: shot1Path });
    console.log('✅ Saved:', shot1Path);

    // -------------------------------------------------------------
    // Capture 2: Elevated Railway Passage (Secret 2)
    // -------------------------------------------------------------
    console.log('\n📸 2/4 Capturing Secret 2: Elevated Railway Passage...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const director = window.__SECRET_ROUTES__;

      director.resetRunState();
      director.forceEncounter('ELEVATED_RAILWAY_PASSAGE', 2002);
      game.trackManager.reset(false);

      // Center ramp entry (Lane 0) onto train rooftop
      game.player.currentLane = 0;
      game.player.position.x = 0;
      game.player.targetX = 0;
      game.player.position.y = 4.35;
      game.player.groundY = 4.35;

      window.__METRO_BUS__.emit(window.__METRO_EVENTS__.SECRET_ROUTE_ENTERED, {
        id: 'ELEVATED_RAILWAY_PASSAGE',
        name: 'Elevated Railway Passage',
        isFirstDiscovery: true,
        firstDiscoveryCoins: 50
      });
    });

    await page.waitForTimeout(1400);
    const shot2Path = path.join(ARTIFACT_DIR, 'task2_secret_02_elevated_skyway.png');
    await page.screenshot({ path: shot2Path });
    console.log('✅ Saved:', shot2Path);

    // -------------------------------------------------------------
    // Capture 3: Hidden Maintenance Tunnel (Secret 3)
    // -------------------------------------------------------------
    console.log('\n📸 3/4 Capturing Secret 3: Hidden Maintenance Tunnel...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const director = window.__SECRET_ROUTES__;

      director.resetRunState();
      director.forceEncounter('HIDDEN_MAINTENANCE_TUNNEL', 3003);
      game.trackManager.reset(false);

      // Right conduit entry (Lane 1)
      game.player.currentLane = 1;
      game.player.position.x = 3.5;
      game.player.targetX = 3.5;
      game.player.position.y = 0;
      game.player.groundY = 0;

      window.__METRO_BUS__.emit(window.__METRO_EVENTS__.SECRET_ROUTE_ENTERED, {
        id: 'HIDDEN_MAINTENANCE_TUNNEL',
        name: 'Hidden Maintenance Tunnel',
        isFirstDiscovery: true,
        firstDiscoveryCoins: 50
      });
    });

    await page.waitForTimeout(1400);
    const shot3Path = path.join(ARTIFACT_DIR, 'task2_secret_03_maintenance_tunnel.png');
    await page.screenshot({ path: shot3Path });
    console.log('✅ Saved:', shot3Path);

    // -------------------------------------------------------------
    // Capture 4: In-Game Discovery HUD Badge Banner
    // -------------------------------------------------------------
    console.log('\n📸 4/4 Capturing HUD Discovery Celebration Banner...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.hud.showFeedbackBadge('🌟 SECRET ROUTE DISCOVERED: ABANDONED METRO PLATFORM (+50 COINS)', 'precision');
    });

    await page.waitForTimeout(500);
    const shot4Path = path.join(ARTIFACT_DIR, 'task2_secret_04_discovery_hud_badge.png');
    await page.screenshot({ path: shot4Path });
    console.log('✅ Saved:', shot4Path);

    console.log('\n🎉 ALL 4 SECRET ROUTE SCREENSHOTS SUCCESSFULLY CAPTURED!');
  } catch (err) {
    console.error('❌ Capture Error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runSecretRoutesCapture().catch(e => {
  console.error(e);
  process.exit(1);
});
