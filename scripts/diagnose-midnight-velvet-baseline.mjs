import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/midnight_velvet_baseline';
if (!fs.existsSync(BASE_ARTIFACT_DIR)) {
  fs.mkdirSync(BASE_ARTIFACT_DIR, { recursive: true });
}

async function diagnoseBaseline() {
  console.log('🔍 Diagnosing current MIDNIGHT_VELVET baseline...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'MIDNIGHT_VELVET'],
        selectedTheme: 'MIDNIGHT_VELVET',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax', 'char_rahul_gandhi'],
        selectedCharacter: 'char_rahul_gandhi',
        activeGameMode: 'HARD',
        rahulFreeRuns: 999
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'MIDNIGHT_VELVET');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Diagnostics before starting
    const preRunDiag = await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      return {
        themeId: game?.environmentDirector?.getActiveTheme()?.id,
        trackThemeId: game?.trackManager?.currentEnvironment,
        selectedCharacter: game?.progression?.getSelectedCharacter(),
        activeGameMode: game?.progression?.getActiveGameMode()
      };
    });
    console.log('Pre-run Diagnostics:', preRunDiag);

    // Start HARD run
    console.log('Starting HARD run in MIDNIGHT_VELVET with normal camera & HUD...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.soundManager.setMuted(true);
      game.startRun('HARD');
      if (game.openingSequence) {
        game.openingSequence.skip();
      }
    });

    await page.waitForTimeout(400);

    // Capture 0m
    await page.screenshot({ path: path.join(BASE_ARTIFACT_DIR, '01_baseline_0m_spawn.png') });
    console.log('📸 Captured 01_baseline_0m_spawn.png');

    // Run without invincibility to check real gameplay obstacle encounters up to 80m
    // We let player advance with speed = 15m/s (or normal Hard speed)
    let diedAt = null;
    let crashDetails = null;

    // Check collisions as player runs forward
    for (let t = 0; t < 60; t++) {
      const status = await page.evaluate(() => {
        const game = window.__METRO_GAME__;
        return {
          dist: game.player.distanceTraveled,
          posZ: game.player.position.z,
          posY: game.player.position.y,
          posX: game.player.position.x,
          lane: game.player.lane,
          state: game.player.stateMachine?.getCurrentState(),
          isDead: game.player.isDead
        };
      });

      if (status.isDead && !diedAt) {
        diedAt = status;
        console.log(`💥 Player DIED at distance ${status.dist.toFixed(1)}m, Z: ${status.posZ.toFixed(1)}m!`);
        await page.screenshot({ path: path.join(BASE_ARTIFACT_DIR, '02_baseline_defeat_at_death.png') });
        break;
      }

      if (status.dist >= 75) {
        await page.screenshot({ path: path.join(BASE_ARTIFACT_DIR, '02_baseline_near_80m.png') });
        console.log(`📸 Captured near 80m at distance ${status.dist.toFixed(1)}m`);
        break;
      }

      await page.waitForTimeout(100);
    }

    // Now let's inspect the scene hierarchy and meshes around Chunk 0 and 1
    const sceneAnalysis = await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const chunks = game.trackManager.getChunks();
      const report = [];

      chunks.forEach((chunk, cIdx) => {
        const chunkInfo = {
          chunkIndex: cIdx,
          chunkZ: chunk.chunkZ,
          environment: chunk.environmentId,
          obstacleCount: chunk.obstacles ? chunk.obstacles.length : 0,
          obstacles: (chunk.obstacles || []).map(o => ({
            name: o.group?.name || 'unnamed',
            type: o.type,
            lane: o.lane,
            posZ: o.group?.position?.z,
            worldZ: chunk.chunkZ + (o.group?.position?.z || 0)
          })),
          sceneryMeshCount: 0,
          largestMeshes: []
        };

        if (chunk.decorativeGroup) {
          const meshes = [];
          chunk.decorativeGroup.traverse((obj) => {
            if (obj.isMesh && obj.geometry) {
              obj.geometry.computeBoundingBox();
              const bb = obj.geometry.boundingBox;
              if (bb) {
                const sz = {
                  x: Math.abs(bb.max.x - bb.min.x),
                  y: Math.abs(bb.max.y - bb.min.y),
                  z: Math.abs(bb.max.z - bb.min.z)
                };
                const vol = sz.x * sz.y * sz.z;
                meshes.push({
                  name: obj.name || obj.parent?.name || 'unnamed',
                  color: obj.material?.color ? obj.material.color.getHexString() : 'no-color',
                  roughness: obj.material?.roughness,
                  metalness: obj.material?.metalness,
                  emissive: obj.material?.emissive ? obj.material.emissive.getHexString() : '0',
                  size: sz,
                  volume: vol,
                  worldPos: obj.getWorldPosition(new window.THREE.Vector3())
                });
              }
            }
          });
          chunkInfo.sceneryMeshCount = meshes.length;
          meshes.sort((a, b) => b.volume - a.volume);
          chunkInfo.largestMeshes = meshes.slice(0, 10);
        }

        report.push(chunkInfo);
      });

      return {
        activeTheme: game.environmentDirector?.getActiveTheme(),
        sunLight: {
          color: game.worldScene?.sunLight?.color?.getHexString(),
          intensity: game.worldScene?.sunLight?.intensity
        },
        hemiLight: {
          skyColor: game.worldScene?.hemiLight?.color?.getHexString(),
          groundColor: game.worldScene?.hemiLight?.groundColor?.getHexString(),
          intensity: game.worldScene?.hemiLight?.intensity
        },
        fog: {
          color: game.worldScene?.scene?.fog?.color?.getHexString(),
          density: game.worldScene?.scene?.fog?.density
        },
        chunks: report
      };
    });

    fs.writeFileSync(
      path.join(BASE_ARTIFACT_DIR, 'baseline_scene_analysis.json'),
      JSON.stringify(sceneAnalysis, null, 2)
    );
    console.log('Scene Analysis saved. Total chunks:', sceneAnalysis.chunks.length);
    console.log('Active Theme:', sceneAnalysis.activeTheme?.id);
    console.log('Sun Intensity:', sceneAnalysis.sunLight?.intensity);
    console.log('Fog Density:', sceneAnalysis.fog?.density);
    if (sceneAnalysis.chunks[0]) {
      console.log('Chunk 0 Scenery Mesh Count:', sceneAnalysis.chunks[0].sceneryMeshCount);
      console.log('Chunk 0 Top Meshes:', sceneAnalysis.chunks[0].largestMeshes.slice(0, 4));
    }
    if (sceneAnalysis.chunks[1]) {
      console.log('Chunk 1 Obstacles:', sceneAnalysis.chunks[1].obstacles);
    }
  } finally {
    await browser.close();
  }
}

diagnoseBaseline().catch(err => {
  console.error('Fatal diagnosis error:', err);
  process.exit(1);
});
