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

async function verifyRebuiltWorlds() {
  console.log('=======================================================');
  console.log('🧪 VERIFYING REBUILT POLITICAL WORLDS & OVERHAULED RIGS');
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

  const auditResults = {};

  async function testWorld(worldId, charId, skinId, label) {
    console.log(`\n-------------------------------------------------------`);
    console.log(`Inspecting ${label} [${worldId}] with ${charId}`);
    console.log(`-------------------------------------------------------`);

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

    const distances = [0, 80, 160, 240, 250, 320];
    const distanceReports = [];

    for (const dist of distances) {
      const analysis = await page.evaluate(async (d) => {
        const game = window.__METRO_GAME__;
        game.player.distanceTraveled = d;
        game.player.position.set(0, 0, -d);
        game.player.speed = 22.0;

        for (let step = 0; step < 25; step++) {
          game.trackManager.update(game.player, 0.1, step * 0.1);
        }

        game.cameraController.setLobbyMode(false);
        game.cameraController.reset(game.player.position);
        game.cameraController.update(0.016, game.player.position, game.player.speed, false);
        game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);

        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        // Scan scene graph for monolithic black slabs
        const monolithSlabs = [];
        let buildingFacadeMeshes = 0;
        let litWindowMeshes = 0;
        let jharokhaBalconies = 0;
        let chhatriDomes = 0;

        game.worldScene.scene.traverse((obj) => {
          if (obj.isMesh && obj.geometry) {
            const geo = obj.geometry;
            if (!geo.boundingBox) geo.computeBoundingBox();
            const bbox = geo.boundingBox;
            const sx = Math.abs(bbox.max.x - bbox.min.x);
            const sy = Math.abs(bbox.max.y - bbox.min.y);
            const sz = Math.abs(bbox.max.z - bbox.min.z);

            // Monolith check: any box >= 60m long and >= 20m high flanking the railway (|X| < 30m)
            const mat = obj.material;
            const hexColor = mat && mat.color ? '#' + mat.color.getHexString() : 'unknown';
            if (geo.type === 'BoxGeometry' && sz >= 60.0 && sy >= 20.0 && sx >= 8.0 && Math.abs(obj.position.x) < 30.0) {
              monolithSlabs.push({
                name: obj.name,
                size: [sx, sy, sz],
                color: hexColor,
                pos: [obj.position.x, obj.position.y, obj.position.z]
              });
            }

            // Indian urban facade checks
            if (mat && mat.emissive && mat.emissive.getHex() === 0xfef08a) {
              litWindowMeshes++;
            }
            if (mat && mat.color && (mat.color.getHex() === 0xfde047 || mat.color.getHex() === 0xf59e0b || mat.color.getHex() === 0xc2410c)) {
              buildingFacadeMeshes++;
            }
            if (mat && mat.color && mat.color.getHex() === 0xd97706) {
              chhatriDomes++;
            }
          }
        });

        // Scan runner character rig for 360-degree rear features
        const playerRigReport = {};
        const charModel = game.player.model;
        const charMesh = charModel?.mesh || charModel;
        if (charMesh && typeof charMesh.traverse === 'function') {
          let hasBackSeam = false;
          let hasKurtaHem = false;
          let hasNapeHair = false;
          let hasAshokaChakra = false;
          let hasBackPoloRib = false;
          let hasTriColorStripe = false;

          charMesh.traverse((obj) => {
            if (obj.isMesh && obj.geometry) {
              const geo = obj.geometry;
              if (geo.type === 'TorusGeometry') {
                hasAshokaChakra = true;
              }
              if (geo.type === 'CylinderGeometry' && obj.position.y < 0 && obj.parent?.name === 'spineGroup') {
                hasKurtaHem = true;
              }
              if (obj.position.z > 0.05 && obj.parent?.name === 'headGroup') {
                hasNapeHair = true;
              }
              if (obj.position.z > 0.15 && obj.parent?.name === 'spineGroup') {
                hasBackSeam = true;
              }
              if (obj.material?.color?.getHex() === 0x16a34a) {
                hasTriColorStripe = true;
              }
            }
          });

          playerRigReport.hasNapeHair = hasNapeHair;
          playerRigReport.hasAshokaChakra = hasAshokaChakra;
          playerRigReport.hasKurtaHem = hasKurtaHem;
        }

        return {
          distance: d,
          monolithSlabs,
          buildingFacadeMeshes,
          litWindowMeshes,
          chhatriDomes,
          playerRigReport
        };
      }, dist);

      distanceReports.push(analysis);
      console.log(`  Distance ${dist}m: Monoliths = ${analysis.monolithSlabs.length}, Facades = ${analysis.buildingFacadeMeshes}, Lit Windows = ${analysis.litWindowMeshes}`);

      // Capture gameplay screenshot at 250m
      if (dist === 250) {
        await page.waitForTimeout(300);
        const buf = await page.screenshot();
        const filename = `${worldId.toLowerCase()}_after_250m_rebuilt.png`;
        saveScreenshotSync(buf, filename);

        // Also capture close-up rear view of runner character model
        await page.evaluate(() => {
          const game = window.__METRO_GAME__;
          const p = game.player.position;
          game.cameraController.camera.position.set(p.x, p.y + 1.4, p.z + 2.2);
          game.cameraController.camera.lookAt(p.x, p.y + 1.2, p.z);
          game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
        });

        await page.waitForTimeout(200);
        const charBuf = await page.screenshot();
        const charFilename = `${charId}_after_rear_closeup.png`;
        saveScreenshotSync(charBuf, charFilename);

        // Reset camera back to standard gameplay position
        await page.evaluate(() => {
          const game = window.__METRO_GAME__;
          game.cameraController.reset(game.player.position);
          game.cameraController.update(0.016, game.player.position, game.player.speed, false);
          game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
        });
      }
    }

    auditResults[worldId] = distanceReports;
  }

  // 1. Audit Mitron Express with Modi
  await testWorld('VIP_EXPRESS', 'char_modi', 'modi_classic', 'Mitron Express');

  // 2. Audit Rahulverse with Rahul Gandhi
  await testWorld('RAHULVERSE', 'char_rahul_gandhi', 'rahul_classic', 'Rahulverse');

  // Save telemetry report
  const reportPath = path.join(BRAIN_ARTIFACT_DIR, 'phase1_verification_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  console.log(`\n📊 Verification report saved to: ${reportPath}`);

  await browser.close();
  console.log('\n✅ Verification run complete!');
}

verifyRebuiltWorlds().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
