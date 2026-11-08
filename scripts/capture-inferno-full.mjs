import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/inferno_full';
const videoDir = path.join(targetDir, 'videos');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

async function captureInfernoFull() {
  console.log(`🌋 Starting INFERNO_EXPRESS Full 6-Environment & Blockbuster Events Verification to ${targetDir}...`);

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
        name: '01_lava_sea_spawn_25m.png',
        dist: 25,
        label: 'District A: 25m Spawn — Vast Lava Sea & Supported Viaduct Trestles'
      },
      {
        name: '02_stratovolcano_eruption_climax_60m.png',
        dist: 60,
        label: 'Event A: 60m Grand Stratovolcano Eruption Climax, Ash Plume & Lava Rivers'
      },
      {
        name: '03_citadel_approach_gates_locked_440m.png',
        dist: 440,
        label: 'District B: 440m Obsidian Citadel Approach — Massive Fortress Gates Locked'
      },
      {
        name: '04_citadel_gates_parting_interior_revealed_510m.png',
        dist: 510,
        label: 'Event B: 510m Fortress Gates Part on Hinges — Interior City Revealed'
      },
      {
        name: '05_magma_foundry_awakening_880m.png',
        dist: 880,
        label: 'Event C: 880m Magma Foundry Awakening — Pumps, Gantry Crane & Molten Casting'
      },
      {
        name: '06_ashfall_summit_skybridge_1210m.png',
        dist: 1210,
        label: 'District D: 1210m Supported Volcanic Skybridge & Columnar Basalt Formations'
      },
      {
        name: '07_giant_magma_cataract_canyon_1260m.png',
        dist: 1260,
        label: 'District D: 1260m Giant Magma Waterfall Canyon Cataract'
      }
    ];

    for (const cp of checkpoints) {
      console.log(`Advancing gameplay to ${cp.dist}m for ${cp.label}...`);

      await page.evaluate((targetDist) => {
        const game = window.__METRO_GAME__;
        if (!game || !game.player || !game.trackManager) return;

        game.player.speed = 85.0;
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
        game.player.mesh.position.z = -targetDist;
        if (game.worldScene) {
          game.worldScene.updateSunPosition(-targetDist, 0, 0.016);
          game.worldScene.updateAtmosphere(0.016);
        }
      }, cp.dist);

      await page.waitForTimeout(600);

      // Collect renderer telemetry
      const telemetry = await page.evaluate((cpInfo) => {
        const game = window.__METRO_GAME__;
        const renderer = game?.worldScene?.renderer;
        const info = renderer?.info;
        const cam = game?.worldScene?.camera;
        return {
          dist: cpInfo.dist,
          label: cpInfo.label,
          playerZ: game?.player?.position?.z ?? 0,
          cameraPos: cam ? { x: Number(cam.position.x.toFixed(2)), y: Number(cam.position.y.toFixed(2)), z: Number(cam.position.z.toFixed(2)) } : null,
          drawCalls: info?.render?.calls ?? 0,
          triangles: info?.render?.triangles ?? 0,
          geometries: info?.memory?.geometries ?? 0,
          textures: info?.memory?.textures ?? 0
        };
      }, cp);

      telemetryData.push(telemetry);

      const filePath = path.join(targetDir, cp.name);
      await page.screenshot({ path: filePath });
      console.log(`Saved screenshot: ${filePath}`);
    }

    fs.writeFileSync(path.join(targetDir, 'telemetry_full.json'), JSON.stringify(telemetryData, null, 2));
    console.log('✅ Full run telemetry saved.');

  } catch (err) {
    console.error('Error during capture:', err);
    throw err;
  } finally {
    await context.close();
    await browser.close();
  }
}

captureInfernoFull();

