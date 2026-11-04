import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const LOCAL_ARTIFACT_DIR = path.resolve('artifacts', 'audit');
const BRAIN_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/7a7f92d8-419e-49e3-a3b4-341385ccaa10/screenshots/audit';

fs.mkdirSync(LOCAL_ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(BRAIN_ARTIFACT_DIR, { recursive: true });

function saveScreenshotSync(buffer, filename) {
  const localPath = path.join(LOCAL_ARTIFACT_DIR, filename);
  const brainPath = path.join(BRAIN_ARTIFACT_DIR, filename);
  fs.writeFileSync(localPath, buffer);
  fs.writeFileSync(brainPath, buffer);
  console.log(`  📸 Saved: ${filename}`);
}

async function reproduceFailure() {
  console.log('=======================================================');
  console.log('🕵️ PHASE 0: REPRODUCE ACTUAL FAILURE AT LOCALHOST:3003');
  console.log('=======================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  console.log('🌐 Loading http://localhost:3003...');
  await page.goto('http://localhost:3003', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 15000 });
  console.log('🎮 Metro Runner engine active on window.__METRO_GAME__\n');

  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
  });

  async function captureAndInspectWorld(worldId, charId, skinId, label) {
    console.log(`\n-------------------------------------------------------`);
    console.log(`Auditing ${label} [${worldId}] with ${charId}`);
    console.log(`-------------------------------------------------------`);

    // Setup and start fresh run
    await page.evaluate(async ({ worldId, charId, skinId }) => {
      const game = window.__METRO_GAME__;
      game.progression.unlockCharacter(charId);
      game.progression.equipCharacter(charId, skinId);
      game.player.applyCharacter(charId, skinId);

      game.progression.addCoins(100000);
      game.progression.purchaseTheme(worldId);
      game.progression.equipTheme(worldId);

      const registry = (await import('/src/environment/EnvironmentRegistry.ts')).EnvironmentRegistry.getInstance();
      const theme = registry.get(worldId);
      game.worldScene.applyEnvironment(theme);

      game.startRun('NORMAL', false);
      game.cameraController.setLobbyMode(false);
      game.player.activateReviveGrace(999999);
      game.player.isIntroInvincible = true;
      if (game.openingSequence) {
        game.openingSequence.skip();
      }
    }, { worldId, charId, skinId });

    await page.waitForTimeout(600);

    const distances = [0, 80, 160, 240, 260, 320];
    const worldReports = [];

    for (const dist of distances) {
      console.log(`\n  Checking distance: ${dist}m...`);
      const analysis = await page.evaluate(async (d) => {
        const game = window.__METRO_GAME__;
        
        // Position player and camera accurately
        game.player.distanceTraveled = d;
        game.player.position.set(0, 0, -d);
        game.player.speed = 22.0;

        // Simulate game loop steps to generate chunks around player
        for (let step = 0; step < 25; step++) {
          game.trackManager.update(game.player, 0.1, step * 0.1);
        }

        game.cameraController.setLobbyMode(false);
        game.cameraController.reset(game.player.position);
        game.cameraController.update(0.016, game.player.position, game.player.speed, false);
        game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);

        // Wait for next RAF frame
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        // Find prominent meshes in view frustum
        const slabs = [];
        game.worldScene.scene.traverse((obj) => {
          if (obj.isMesh && obj.geometry) {
            obj.geometry.computeBoundingBox();
            const bbox = obj.geometry.boundingBox;
            if (bbox) {
              const sx = Math.round((bbox.max.x - bbox.min.x) * 10) / 10;
              const sy = Math.round((bbox.max.y - bbox.min.y) * 10) / 10;
              const sz = Math.round((bbox.max.z - bbox.min.z) * 10) / 10;
              
              // Detect continuous walls / tall monolithic buildings
              if (sy >= 12.0 && sz >= 20.0) {
                const wx = Math.round(obj.matrixWorld.elements[12]);
                const wy = Math.round(obj.matrixWorld.elements[13]);
                const wz = Math.round(obj.matrixWorld.elements[14]);
                
                // Only consider objects within 100m of player Z
                if (Math.abs(wz - (-d)) < 90) {
                  const mat = obj.material;
                  slabs.push({
                    name: obj.name || obj.parent?.name || 'unnamed',
                    parentName: obj.parent?.name || 'none',
                    size: { x: sx, y: sy, z: sz },
                    pos: { x: wx, y: wy, z: wz },
                    color: mat?.color ? '#' + mat.color.getHexString() : 'none',
                    matType: mat?.type,
                    roughness: mat?.roughness,
                    metalness: mat?.metalness
                  });
                }
              }
            }
          }
        });

        const activeChunks = game.trackManager.chunks.map(c => ({
          chunkZ: c.chunkZ,
          chunkIndex: c.chunkIndex,
          env: c.environmentId
        }));

        return { dist: d, playerZ: -d, activeChunks, slabs };
      }, dist);

      worldReports.push(analysis);
      console.log(`    Detected ${analysis.slabs.length} tall monolithic slabs near player.`);
      analysis.slabs.forEach(s => {
        console.log(`      -> Slab: ${s.name} (parent: ${s.parentName}), Size: [${s.size.x} x ${s.size.y} x ${s.size.z}], Pos: [${s.pos.x}, ${s.pos.y}, ${s.pos.z}], Color: ${s.color}`);
      });

      // Save screenshot
      await page.waitForTimeout(200);
      const buf = await page.screenshot();
      saveScreenshotSync(buf, `phase0_${worldId.toLowerCase()}_${dist}m.png`);
    }

    return worldReports;
  }

  const mitronData = await captureAndInspectWorld('VIP_EXPRESS', 'char_modi', 'modi_classic', 'Mitron Express');
  const rahulData = await captureAndInspectWorld('RAHULVERSE', 'char_rahul_gandhi', 'rahul_classic', 'Rahulverse');

  const summary = {
    mitronExpress: mitronData,
    rahulverse: rahulData
  };

  const findingsPath = path.join(BRAIN_ARTIFACT_DIR, 'phase0_failure_analysis.json');
  fs.writeFileSync(findingsPath, JSON.stringify(summary, null, 2));
  console.log(`\n💾 Saved detailed findings to phase0_failure_analysis.json`);

  await browser.close();
  console.log('\n🎉 Phase 0 reproduction complete!');
}

reproduceFailure().catch(err => {
  console.error(err);
  process.exit(1);
});
