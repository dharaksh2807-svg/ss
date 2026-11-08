import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/chrono_baseline';
const videoDir = path.join(targetDir, 'videos');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}
if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

async function captureChronoBaseline() {
  console.log('🚀 Launching CHRONO_KINGDOM Baseline Gameplay Capture (First Quality Gate)...');

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
        unlockedThemes: ['MODERN_METRO', 'CHRONO_KINGDOM'],
        selectedTheme: 'CHRONO_KINGDOM',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'CHRONO_KINGDOM');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('Starting run in CHRONO_KINGDOM...');
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
        name: '01_baseline_capital_spawn_15m.png',
        dist: 15,
        label: '15m Spawn — Grand Clockwork Capital Overview'
      },
      {
        name: '02_baseline_titan_approach_35m.png',
        dist: 35,
        label: '35m Titan Awakening Approach (Activation State)',
        cam: { pos: { x: 3.5, y: 3.2, z: -32.0 }, look: { x: 13.5, y: 7.5, z: -50.0 } }
      },
      {
        name: '03_baseline_titan_climax_salute_50m.png',
        dist: 50,
        label: '50m Titan Epicenter Climax (Salute & Glowing Eyes)',
        cam: { pos: { x: 4.5, y: 5.5, z: -48.0 }, look: { x: 13.5, y: 8.5, z: -50.0 } }
      },
      {
        name: '04_baseline_foundry_transforming_city_500m.png',
        dist: 500,
        label: '500m Time Foundry — Transforming City & Giant Flywheels'
      },
      {
        name: '05_baseline_observatory_user_failure_973m.png',
        dist: 973,
        label: '973m Chrono Observatory (User Reference Comparison Point)'
      },
      {
        name: '06_baseline_time_rift_close_973m.png',
        dist: 973,
        label: '973m Great Time Rift Close-up Portal Architecture',
        cam: { pos: { x: -4.5, y: 7.5, z: -968.0 }, look: { x: -14.5, y: 16.0, z: -980.0 } }
      },
      {
        name: '07_baseline_fractured_time_dragon_1300m.png',
        dist: 1300,
        label: '1300m Fractured Time — Mechanical Dragon & Hourglass'
      },
      {
        name: '08_baseline_cycle2_longrun_1600m.png',
        dist: 1600,
        label: '1600m Cycle 1 Permutation (Long-run Non-Repeating Test)'
      },
      {
        name: '09_baseline_cycle3_longrun_3200m.png',
        dist: 3200,
        label: '3200m Cycle 2 Permutation (Memory Stability & Recycling)'
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
          game.cameraController._origUpdate = game.cameraController._origUpdate || game.cameraController.update;
          game.cameraController.update = () => {};
          game.cameraController.camera.position.set(cam.pos.x, cam.pos.y, cam.pos.z);
          game.cameraController.camera.lookAt(cam.look.x, cam.look.y, cam.look.z);
        } else {
          if (game.cameraController._origUpdate) {
            game.cameraController.update = game.cameraController._origUpdate;
          }
          const pZ = game.player.position.z;
          game.cameraController.camera.position.set(0, 4.2, pZ + 7.5);
          game.cameraController.camera.lookAt(0, 2.2, pZ - 25.0);
        }

        // Shift blocking hazard away
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
        const dir = window.__CHRONO_DIRECTOR__ || game.worldScene?.chronoDirector;
        return {
          dist: pt.dist,
          label: pt.label,
          playerZ: game.player.position.z,
          cameraPos: {
            x: Number(game.cameraController.camera.position.x.toFixed(2)),
            y: Number(game.cameraController.camera.position.y.toFixed(2)),
            z: Number(game.cameraController.camera.position.z.toFixed(2))
          },
          drawCalls: game.worldScene?.renderer?.info?.render?.calls || 0,
          triangles: game.worldScene?.renderer?.info?.render?.triangles || 0,
          geometries: game.worldScene?.renderer?.info?.memory?.geometries || 0,
          textures: game.worldScene?.renderer?.info?.memory?.textures || 0
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

captureChronoBaseline().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
