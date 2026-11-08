import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/inferno_baseline';
const videoDir = path.join(targetDir, 'videos');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

async function captureInfernoBaseline() {
  console.log(`🌋 Starting INFERNO_EXPRESS Baseline Visual Capture & Video Recording to ${targetDir}...`);

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1440, height: 900 }
    }
  });

  try {
    const page = await context.newPage();

    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'INFERNO_EXPRESS'],
        selectedTheme: 'INFERNO_EXPRESS',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'INFERNO_EXPRESS');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('Starting run in INFERNO_EXPRESS...');
    await page.evaluate(() => {
      const playBtn = document.getElementById('start-play-btn');
      if (playBtn) playBtn.click();
      else if (window.__METRO_GAME__) window.__METRO_GAME__.startRun('NORMAL');

      const game = window.__METRO_GAME__;
      if (game) {
        game.soundManager.setMuted(true);
        game.player.crash = () => false;
        game.player.activateReviveGrace(999999);
        game.player.isIntroInvincible = true;
        if (game.openingSequence) {
          game.openingSequence.skip();
        }
        game.cameraController.setLobbyMode(false);
      }

      const modal = document.querySelector('.modal-overlay, #revive-modal, #save-me-modal, #shop-modal, #environment-modal');
      if (modal && modal instanceof HTMLElement) modal.style.display = 'none';
    });

    await page.waitForTimeout(1000);

    const telemetryData = [];
    const checkpoints = [
      {
        name: '01_baseline_lava_sea_spawn_15m.png',
        dist: 15,
        label: '15m Spawn — Lava Sea & Supported Viaduct Overview'
      },
      {
        name: '02_baseline_lava_sea_volcano_75m.png',
        dist: 75,
        label: '75m Lava Sea — Volcano, Magma Waterfall & Chains'
      },
      {
        name: '03_baseline_obsidian_citadel_415m.png',
        dist: 415,
        label: '415m Obsidian Citadel — Fortress Architecture'
      },
      {
        name: '04_baseline_magma_foundry_825m.png',
        dist: 825,
        label: '825m Magma Foundry — Heavy Industrial Pipes & Blast Doors'
      },
      {
        name: '05_baseline_ashfall_summit_1230m.png',
        dist: 1230,
        label: '1230m Ashfall Summit — Monoliths & Geysers'
      }
    ];

    for (const cp of checkpoints) {
      console.log(`Advancing gameplay to ${cp.dist}m for ${cp.label}...`);

      await page.evaluate((targetDist) => {
        const game = window.__METRO_GAME__;
        if (!game || !game.player || !game.trackManager) return;

        game.player.speed = 80.0;
        game.player.state = 'RUN';

        let safety = 0;
        while (game.player.distanceTraveled < targetDist && safety < 10000) {
          game.player.update(0.04);
          game.trackManager.update(game.player, 0.04, performance.now() / 1000);
          safety++;
        }

        game.player.speed = 0.0;
        game.player.distanceTraveled = targetDist;
        game.player.position.z = -targetDist;

        // Shift close obstacle out of the way for clean architectural framing
        const pZ = game.player.position.z;
        game.trackManager.chunks.forEach(c => {
          if (c.obstacles) {
            c.obstacles.forEach(obs => {
              if (obs && obs.group) {
                const obsWorldZ = c.chunkZ + obs.group.position.z;
                if (Math.abs(obsWorldZ - pZ) < 18.0) {
                  obs.group.position.x += 25.0;
                }
              }
            });
          }
        });
      }, cp.dist);

      await page.waitForTimeout(600);

      // Collect telemetry
      const telem = await page.evaluate((pt) => {
        const game = window.__METRO_GAME__;
        return {
          dist: pt.dist,
          label: pt.label,
          playerZ: game?.player?.position?.z,
          cameraPos: {
            x: Number(game?.cameraController?.camera?.position?.x?.toFixed(2) || 0),
            y: Number(game?.cameraController?.camera?.position?.y?.toFixed(2) || 0),
            z: Number(game?.cameraController?.camera?.position?.z?.toFixed(2) || 0)
          },
          drawCalls: game?.worldScene?.renderer?.info?.render?.calls || 0,
          triangles: game?.worldScene?.renderer?.info?.render?.triangles || 0,
          geometries: game?.worldScene?.renderer?.info?.memory?.geometries || 0,
          textures: game?.worldScene?.renderer?.info?.memory?.textures || 0
        };
      }, cp);

      telemetryData.push(telem);

      const shotPath = path.join(targetDir, cp.name);
      await page.screenshot({ path: shotPath });
      console.log(`Saved screenshot: ${shotPath}`);
    }

    fs.writeFileSync(path.join(targetDir, 'telemetry_baseline.json'), JSON.stringify(telemetryData, null, 2));
    console.log('✅ Baseline telemetry saved.');

  } finally {
    await context.close();
    await browser.close();
  }
}

captureInfernoBaseline().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});

