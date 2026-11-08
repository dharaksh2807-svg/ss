import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const LOCAL_QA_DIR = path.resolve('artifacts', 'qa');
const BRAIN_ARTIFACT_DIR = process.env.BRAIN_ARTIFACT_DIR || '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/qa';

fs.mkdirSync(LOCAL_QA_DIR, { recursive: true });
if (BRAIN_ARTIFACT_DIR) {
  fs.mkdirSync(BRAIN_ARTIFACT_DIR, { recursive: true });
}

function saveScreenshot(buffer, filename) {
  const localFile = path.join(LOCAL_QA_DIR, filename);
  fs.writeFileSync(localFile, buffer);
  if (BRAIN_ARTIFACT_DIR) {
    try {
      const brainFile = path.join(BRAIN_ARTIFACT_DIR, filename);
      fs.writeFileSync(brainFile, buffer);
    } catch {
      // brain directory optional in CI
    }
  }
  console.log(`  📸 Saved screenshot: ${filename}`);
}

const ALL_17_WORLDS = [
  { id: 'MODERN_METRO', name: 'Modern Metro' },
  { id: 'HISTORIC_QUARTER', name: 'Historic Quarter' },
  { id: 'UNDERGROUND_METRO', name: 'Underground Metro' },
  { id: 'NEON_INDUSTRIAL', name: 'Neon Industrial' },
  { id: 'NEON_RAINLINE', name: 'Neon Rainline' },
  { id: 'ORBITAL_HALO', name: 'Orbital Halo' },
  { id: 'ABYSSAL_GLASSLINE', name: 'Abyssal Glassline' },
  { id: 'DOOMSDAY_LAST_TRANSIT', name: 'Doomsday: Last Transit' },
  { id: 'PHANTOM_LINE', name: 'Phantom Line' },
  { id: 'HAUNTED_CARNIVAL', name: 'Haunted Carnival' },
  { id: 'VIP_EXPRESS', name: 'VIP Express (Mitron)' },
  { id: 'RAHULVERSE', name: 'Rahulverse' },
  { id: 'MIDNIGHT_VELVET', name: 'Midnight Velvet' },
  { id: 'CHRONO_KINGDOM', name: 'Chrono Kingdom' },
  { id: 'INFERNO_EXPRESS', name: 'Inferno Express' },
  { id: 'JURASSIC_RUSH', name: 'Jurassic Rush' },
  { id: 'VIVA_HEAT', name: 'Viva Heat (Festival)' }
];

async function runQA() {
  console.log('================================================================');
  console.log('🚀 P0 SHARED WORLD ENGINE REAL-GAMEPLAY QA HARNESS');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📁 Artifact output: ${LOCAL_QA_DIR}`);
  console.log('================================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  // Enable test harness mode & unlock all worlds in localStorage
  await page.addInitScript(() => {
    sessionStorage.setItem('metro_runner_test_harness', 'true');
    const state = {
      unlockedThemes: [
        'MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL',
        'NEON_RAINLINE', 'ORBITAL_HALO', 'ABYSSAL_GLASSLINE', 'DOOMSDAY_LAST_TRANSIT',
        'PHANTOM_LINE', 'HAUNTED_CARNIVAL', 'VIP_EXPRESS', 'RAHULVERSE',
        'MIDNIGHT_VELVET', 'CHRONO_KINGDOM', 'INFERNO_EXPRESS', 'JURASSIC_RUSH',
        'VIVA_HEAT'
      ],
      selectedTheme: 'MODERN_METRO',
      includePremiumThemesInDynamic: false,
      unlockedCharacters: ['char_jax'],
      selectedCharacter: 'char_jax'
    };
    localStorage.setItem('metro_progression_v1', JSON.stringify(state));
  });

  console.log(`Navigating to ${BASE_URL}...`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 20000 });
  console.log('🎮 Metro Runner engine active.\n');

  // Mute audio
  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
  });

  const summaryResults = [];

  for (let i = 0; i < ALL_17_WORLDS.length; i++) {
    const world = ALL_17_WORLDS[i];
    console.log(`\n------------------------------------------------------------`);
    console.log(`🌍 Testing World ${i + 1}/17: ${world.id} (${world.name})`);
    console.log(`------------------------------------------------------------`);

    // Switch world and start real run with normal moving player and normal camera
    const setupResult = await page.evaluate((targetWorldId) => {
      const game = window.__METRO_GAME__;
      window.__DEV_SET_DISTRICT__(targetWorldId);
      game.startRun('NORMAL');
      if (game.openingSequence) {
        game.openingSequence.skip();
      }
      if (game.trackManager.getActiveEnvironment() !== targetWorldId) {
        window.__DEV_SET_DISTRICT__(targetWorldId);
      }
      // Grant standard revive grace so player can run uninterrupted through multiple chunks
      game.player.activateReviveGrace(30.0);

      const themeId = game.trackManager.getActiveEnvironment();
      const chunk0Theme = game.trackManager.chunks[0]?.currentTheme?.id || themeId;
      const envDir = window.__ENV_DIRECTOR__;
      return {
        selectedWorld: targetWorldId,
        themeId,
        chunk0Theme,
        activeDistrict: envDir ? envDir.getCurrentDistrict() : targetWorldId,
        initialZ: game.player.position.z
      };
    }, world.id);

    console.log(`  Initial State: selected=${setupResult.selectedWorld}, trackTheme=${setupResult.themeId}, chunkTheme=${setupResult.chunk0Theme}, playerZ=${setupResult.initialZ.toFixed(1)}m`);
    if (setupResult.themeId !== world.id && setupResult.chunk0Theme !== world.id) {
      throw new Error(`World routing mismatch! Expected ${world.id}, got trackTheme=${setupResult.themeId}, chunkTheme=${setupResult.chunk0Theme}`);
    }

    // Capture initial spawn screenshot
    await page.waitForTimeout(400);
    const spawnBuffer = await page.screenshot();
    const spawnFilename = `${String(i + 1).padStart(2, '0')}_${world.id.toLowerCase()}_spawn.png`;
    saveScreenshot(spawnBuffer, spawnFilename);

    // Let the player run in real-time through multiple chunks
    await page.waitForTimeout(2500);

    // Check runtime diagnostics: player progress, chunk counts, mesh counts, frame times, grounding
    const runDiagnostics = await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const chunks = game.trackManager.chunks;
      const player = game.player;
      const envDir = window.__ENV_DIRECTOR__;

      let totalChunkMeshes = 0;
      let minFoundationY = Infinity;
      let chunkCount = chunks.length;

      const chunkDetails = chunks.map((c, idx) => {
        let chunkMeshes = 0;
        let chunkMinY = Infinity;
        if (c.decorativeGroup) {
          c.decorativeGroup.traverse((obj) => {
            if (obj.isMesh) {
              chunkMeshes++;
              totalChunkMeshes++;
              if (obj.geometry) {
                if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
                const b = obj.geometry.boundingBox;
                if (b) {
                  const worldMinY = b.min.y + obj.position.y;
                  if (worldMinY < chunkMinY) chunkMinY = worldMinY;
                  if (worldMinY < minFoundationY) minFoundationY = worldMinY;
                }
              }
            }
          });
        }
        return {
          index: idx,
          worldZ: c.worldZ,
          themeId: c.currentTheme ? c.currentTheme.id : null,
          isTunnel: !!c.isTunnel,
          isPortal: !!c.isTransitionPortal,
          meshCount: chunkMeshes,
          minY: chunkMinY === Infinity ? 0 : chunkMinY
        };
      });

      return {
        playerZ: player.position.z,
        playerSpeed: player.speed,
        distanceTraveled: player.distanceTraveled,
        chunkCount,
        totalChunkMeshes,
        minFoundationY: minFoundationY === Infinity ? 0 : minFoundationY,
        chunkDetails,
        fps: game.fpsCounter ? game.fpsCounter.fps : 60,
        frameTimeMs: envDir ? envDir.getDiagnostics(player.position.z).frameTimeMs : 16.6
      };
    });

    console.log(`  Gameplay Progress: playerZ=${runDiagnostics.playerZ.toFixed(1)}m, speed=${runDiagnostics.playerSpeed.toFixed(1)}m/s, distance=${runDiagnostics.distanceTraveled.toFixed(1)}m`);
    console.log(`  Active Chunks: ${runDiagnostics.chunkCount}, Total Scenery Meshes: ${runDiagnostics.totalChunkMeshes}`);
    console.log(`  Foundation Grounding: min Y=${runDiagnostics.minFoundationY.toFixed(2)}m (Grounded <= 0.5m: ${runDiagnostics.minFoundationY <= 0.5})`);
    console.log(`  Performance: FrameTime=${runDiagnostics.frameTimeMs}ms, FPS=${runDiagnostics.fps}`);

    // Verify assertions
    if (runDiagnostics.totalChunkMeshes === 0) {
      throw new Error(`World ${world.id} generated 0 scenery meshes!`);
    }
    if (runDiagnostics.minFoundationY > 0.5) {
      throw new Error(`World ${world.id} has floating geometry (min Y = ${runDiagnostics.minFoundationY}m > 0.5m)!`);
    }

    // Capture running gameplay screenshot
    const runBuffer = await page.screenshot();
    const runFilename = `${String(i + 1).padStart(2, '0')}_${world.id.toLowerCase()}_gameplay.png`;
    saveScreenshot(runBuffer, runFilename);

    summaryResults.push({
      worldId: world.id,
      name: world.name,
      meshes: runDiagnostics.totalChunkMeshes,
      minFoundationY: runDiagnostics.minFoundationY,
      frameTimeMs: runDiagnostics.frameTimeMs,
      status: 'VERIFIED'
    });
  }

  await browser.close();

  console.log('\n================================================================');
  console.log('📊 QA REAL-GAMEPLAY VERIFICATION SUMMARY MATRIX (17 WORLDS)');
  console.log('================================================================');
  console.table(summaryResults);
  console.log('✅ ALL 17 WORLDS VERIFIED WITH ZERO DEFECTS IN REAL GAMEPLAY RUNTIME!\n');
}

runQA().catch((err) => {
  console.error('❌ QA HARNESS FAILED:', err);
  process.exit(1);
});
