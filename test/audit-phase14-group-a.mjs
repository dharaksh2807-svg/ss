import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve('artifacts', 'phase14', 'group_a');
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

function log(msg) {
  console.log(`[Phase 14 Group A] ${msg}`);
}

async function saveScreenshot(page, filename) {
  const filePath = path.join(ARTIFACTS_DIR, filename);
  await page.screenshot({ path: filePath });
  log(`  📸 Saved: ${filename}`);
}

const GROUP_A_WORLDS = [
  { id: 'MODERN_METRO', name: 'Modern Metro', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'HISTORIC_QUARTER', name: 'Historic Railway Quarter', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'UNDERGROUND_METRO', name: 'Underground Vaults', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'NEON_INDUSTRIAL', name: 'Neon Industrial Yard', charId: 'char_jax', skinId: 'jax_classic' }
];

async function runGroupAAudit() {
  log('======================================================================');
  log('🏰 AUDITING GROUP A: LEGACY FREE WORLDS ART & TRAIN UPGRADE');
  log('======================================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--mute-audio']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 15000 });

  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
  });

  for (const w of GROUP_A_WORLDS) {
    log(`----------------------------------------------------------------------`);
    log(`▶ Auditing Group A [${w.id}] - ${w.name}`);
    log(`----------------------------------------------------------------------`);

    const result = await page.evaluate(async ({ target }) => {
      const game = window.__METRO_GAME__;
      const gm = window.__GRAPHICS_MANAGER__ || (await import('/src/scene/GraphicsManager.ts')).GraphicsManager.getInstance();

      gm.setPreset('HIGH', true);
      const registry = (await import('/src/environment/EnvironmentRegistry.ts')).EnvironmentRegistry.getInstance();
      const theme = registry.get(target.id);
      game.worldScene.applyEnvironment(theme);
      game.trackManager.setDebugSeed(1337);
      game.trackManager.reset(false);
      game.startRun('NORMAL', false);
      game.cameraController.setLobbyMode(false);
      game.player.activateReviveGrace(999999);
      game.player.isIntroInvincible = true;
      if (game.openingSequence) game.openingSequence.skip();

      game.player.distanceTraveled = 200;
      game.player.position.set(0, game.player.groundY, -200);
      game.player.speed = 22.0;

      for (let s = 0; s < 25; s++) {
        game.trackManager.update(game.player, 0.05, s * 0.05);
        game.worldScene.updateSunPosition(game.player.position.z, game.player.speed);
        game.worldScene.updateAtmosphere(0.05);
      }

      game.cameraController.reset(game.player.position);
      game.cameraController.update(0.016, game.player.position, game.player.speed, false);
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);

      const info = game.worldScene.renderer.info;
      return {
        calls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries
      };
    }, { target: w });

    const filename = `${w.id.toLowerCase()}_phase14_verified.png`;
    await saveScreenshot(page, filename);
    log(`  Result: Calls: ${result.calls} | Tris: ${result.triangles.toLocaleString()} | Geoms: ${result.geometries}`);
  }

  await browser.close();
  log('\n✅ Group A audit complete!');
}

runGroupAAudit().catch((err) => {
  console.error('Group A audit failed:', err);
  process.exit(1);
});
