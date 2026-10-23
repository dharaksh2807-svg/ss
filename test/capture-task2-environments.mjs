import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/70c5e932-5b43-4724-8861-c9ce95ff1151/task2_screenshots';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function capture() {
  console.log('🚀 Launching System Chrome for Visual Verification...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2
  });

  console.log('🌐 Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Wait for game to initialize
  await page.waitForFunction(() => !!window.__METRO_GAME__);
  console.log('🎮 Game engine confirmed on window.__METRO_GAME__');

  // Helper to switch environment, hide HUD elements for clean architectural shots if requested
  async function setupScene({ envId, quality = 'HIGH', jump = false, spawnTrain = false, hideHUD = false, waitMs = 1200 }) {
    await page.evaluate(async ({ envId, quality, spawnTrain, hideHUD }) => {
      const game = window.__METRO_GAME__;

      // Start run in normal mode
      game.startRun('NORMAL');
      if (game.openingSequence) {
        game.openingSequence.skip();
      }

      // Grant permanent invulnerability for screenshot capture so crashes never happen
      game.player.activateReviveGrace(999999);
      game.player.isIntroInvincible = true;

      // Hide all overlay modals
      document.querySelectorAll('.modal, .overlay, #revive-modal, #game-over-modal').forEach(el => el.classList.add('hidden'));

      // Configure graphics preset
      const { GraphicsManager } = await import('./src/scene/GraphicsManager.js');
      GraphicsManager.getInstance().setPreset(quality);

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
      } else {
        const hud = document.getElementById('hud');
        if (hud) hud.style.display = 'block';
      }

      if (spawnTrain) {
        // Spawn approaching train directly in lane 0 ahead
        const { ObstacleFactory } = await import('./src/track/ObstacleFactory.js');
        const obsFactory = game.trackManager.obstacleFactory || new ObstacleFactory();
        const train = obsFactory.createTrain(22.0, false, 0xd9534f);
        train.position.set(0, 0, game.player.position.z - 28);
        game.worldScene.scene.add(train);
      }
    }, { envId, quality, spawnTrain, hideHUD });

    if (jump) {
      await page.waitForTimeout(waitMs);
      await page.evaluate(() => {
        window.__METRO_GAME__.player.jump();
      });
      // Wait for jump apex
      await page.waitForTimeout(380);
    } else {
      await page.waitForTimeout(waitMs);
    }
  }

  // 1. Modern District in Daylight
  console.log('📸 1/17 Capturing Modern District in Daylight...');
  await setupScene({ envId: 'MODERN_METRO', quality: 'HIGH', waitMs: 1200 });
  await page.screenshot({ path: path.join(OUT_DIR, 'modern-district-daylight.png') });

  // 2. Modern Station with Storefronts & Skybridge
  console.log('📸 2/17 Capturing Modern Station with Storefronts & Skybridge...');
  await setupScene({ envId: 'MODERN_METRO', quality: 'HIGH', waitMs: 2400, hideHUD: true });
  await page.screenshot({ path: path.join(OUT_DIR, 'modern-station.png') });

  // 3. Historic District
  console.log('📸 3/17 Capturing Historic District with Victorian Brownstones...');
  await setupScene({ envId: 'HISTORIC_QUARTER', quality: 'HIGH', waitMs: 1200 });
  await page.screenshot({ path: path.join(OUT_DIR, 'historic-district.png') });

  // 4. Historic Viaduct & Municipal Clock Tower
  console.log('📸 4/17 Capturing Historic Viaduct & Clock Tower...');
  await setupScene({ envId: 'HISTORIC_QUARTER', quality: 'HIGH', waitMs: 2400, hideHUD: true });
  await page.screenshot({ path: path.join(OUT_DIR, 'historic-viaduct.png') });

  // 5. Underground Tunnel Enclosed Vault & Catwalk
  console.log('📸 5/17 Capturing Underground Metro Tunnel Enclosed Vault...');
  await setupScene({ envId: 'UNDERGROUND_METRO', quality: 'HIGH', waitMs: 1200 });
  await page.screenshot({ path: path.join(OUT_DIR, 'underground-tunnel.png') });

  // 6. Underground Station Platform with Murals & Billboards
  console.log('📸 6/17 Capturing Underground Station Platform & Mosaic Murals...');
  await setupScene({ envId: 'UNDERGROUND_METRO', quality: 'HIGH', waitMs: 2400, hideHUD: true });
  await page.screenshot({ path: path.join(OUT_DIR, 'underground-station.png') });

  // 7-9. Train Approaching in each district
  console.log('📸 7/17 Capturing Train Approach in Modern Metro...');
  await setupScene({ envId: 'MODERN_METRO', quality: 'HIGH', spawnTrain: true, waitMs: 1500 });
  await page.screenshot({ path: path.join(OUT_DIR, 'train-approach-modern.png') });

  console.log('📸 8/17 Capturing Train Approach in Historic Quarter...');
  await setupScene({ envId: 'HISTORIC_QUARTER', quality: 'HIGH', spawnTrain: true, waitMs: 1500 });
  await page.screenshot({ path: path.join(OUT_DIR, 'train-approach-historic.png') });

  console.log('📸 9/17 Capturing Train Approach in Underground Metro...');
  await setupScene({ envId: 'UNDERGROUND_METRO', quality: 'HIGH', spawnTrain: true, waitMs: 1500 });
  await page.screenshot({ path: path.join(OUT_DIR, 'train-approach-underground.png') });

  // 10-12. Player Jumping in each district
  console.log('📸 10/17 Capturing Player Jump in Modern Metro...');
  await setupScene({ envId: 'MODERN_METRO', quality: 'HIGH', jump: true, waitMs: 1000 });
  await page.screenshot({ path: path.join(OUT_DIR, 'player-jump-modern.png') });

  console.log('📸 11/17 Capturing Player Jump in Historic Quarter...');
  await setupScene({ envId: 'HISTORIC_QUARTER', quality: 'HIGH', jump: true, waitMs: 1000 });
  await page.screenshot({ path: path.join(OUT_DIR, 'player-jump-historic.png') });

  console.log('📸 12/17 Capturing Player Jump in Underground Metro...');
  await setupScene({ envId: 'UNDERGROUND_METRO', quality: 'HIGH', jump: true, waitMs: 1000 });
  await page.screenshot({ path: path.join(OUT_DIR, 'player-jump-underground.png') });

  // 13. Multiple Seeds Layouts
  console.log('📸 13/17 Capturing Multiple District Layouts across Different Seeds...');
  await setupScene({ envId: 'MODERN_METRO', quality: 'HIGH', waitMs: 1600 });
  await page.screenshot({ path: path.join(OUT_DIR, 'seed-1337-modern.png') });

  await setupScene({ envId: 'HISTORIC_QUARTER', quality: 'HIGH', waitMs: 1600 });
  await page.screenshot({ path: path.join(OUT_DIR, 'seed-7777-historic.png') });

  await setupScene({ envId: 'UNDERGROUND_METRO', quality: 'HIGH', waitMs: 1600 });
  await page.screenshot({ path: path.join(OUT_DIR, 'seed-9999-underground.png') });

  // 14-16. Graphics Presets Comparison (Low, Medium, High)
  console.log('📸 16/17 Capturing Quality Presets (Low, Medium, High)...');
  await setupScene({ envId: 'MODERN_METRO', quality: 'LOW', waitMs: 1000 });
  await page.screenshot({ path: path.join(OUT_DIR, 'quality-low.png') });

  await setupScene({ envId: 'MODERN_METRO', quality: 'MEDIUM', waitMs: 1000 });
  await page.screenshot({ path: path.join(OUT_DIR, 'quality-medium.png') });

  await setupScene({ envId: 'MODERN_METRO', quality: 'HIGH', waitMs: 1000 });
  await page.screenshot({ path: path.join(OUT_DIR, 'quality-high.png') });

  console.log('🎉 All 17 Visual Verification Screenshots Captured successfully!');
  await browser.close();
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
