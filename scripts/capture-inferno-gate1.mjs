import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/inferno_gate1';
const videoDir = path.join(targetDir, 'videos');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

async function captureInfernoGate1() {
  console.log(`🌋 Starting INFERNO_EXPRESS Quality Gate 1 Visual Capture & Video Recording to ${targetDir}...`);

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
        name: '01_gate1_lava_sea_spawn_15m.png',
        dist: 15,
        label: '15m Spawn — Lava Sea & Supported Viaduct Trestles Overview'
      },
      {
        name: '02_gate1_volcano_approach_anticipation_35m.png',
        dist: 35,
        label: '35m Grand Stratovolcano Approach — Player View'
      },
      {
        name: '03_gate1_volcano_climax_eruption_50m.png',
        dist: 50,
        label: '50m Epicenter Eruption Climax — Player View'
      },
      {
        name: '04_gate1_supported_viaduct_trestles_80m.png',
        dist: 80,
        label: '80m Supported Viaduct — Flanking Lattice Trestles & Catenary Girders'
      },
      {
        name: '05_gate1_lava_ocean_surface_close.png',
        dist: 25,
        label: '25m Convective Molten Lava Ocean Surface & Basalt Crust Close-up',
        cam: { pos: { x: -8.5, y: 3.5, z: -25.0 }, look: { x: -35.0, y: -3.25, z: -40.0 } }
      },
      {
        name: '06_gate1_volcano_crater_cinematic.png',
        dist: 50,
        label: '50m Grand Stratovolcano Summit Caldera, Ash Plume & Shockwave Rings',
        cam: { pos: { x: 22.0, y: 28.0, z: -25.0 }, look: { x: 66.0, y: 52.0, z: -50.0 } }
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
      }, cp.dist);

      await page.evaluate((cam) => {
        const game = window.__METRO_GAME__;
        if (!game || !game.cameraController) return;

        if (cam) {
          game.cameraController.isPhotoMode = true;
          game.cameraController._origUpdate = game.cameraController._origUpdate || game.cameraController.update;
          game.cameraController.update = () => {};
          game.cameraController.camera.position.set(cam.pos.x, cam.pos.y, cam.pos.z);
          game.cameraController.camera.lookAt(cam.look.x, cam.look.y, cam.look.z);
        } else {
          game.cameraController.isPhotoMode = false;
          if (game.cameraController._origUpdate) {
            game.cameraController.update = game.cameraController._origUpdate;
          }
          const pZ = game.player.position.z;
          game.cameraController.camera.position.set(0, 4.2, pZ + 7.5);
          game.cameraController.camera.lookAt(0, 2.2, pZ - 25.0);
        }

        // Shift blocking hazard away for clean view
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
      }, cp.cam);

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

    fs.writeFileSync(path.join(targetDir, 'telemetry_gate1.json'), JSON.stringify(telemetryData, null, 2));
    console.log('✅ Quality Gate 1 telemetry saved.');

  } finally {
    await context.close();
    await browser.close();
  }
}

captureInfernoGate1().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});

