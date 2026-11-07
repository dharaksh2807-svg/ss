import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/6fa6a932-af7c-49ae-88ed-73dba7755de5/quality_gate';

if (!fs.existsSync(BASE_ARTIFACT_DIR)) {
  fs.mkdirSync(BASE_ARTIFACT_DIR, { recursive: true });
}

const WORLDS = [
  {
    id: 'VIP_EXPRESS',
    name: 'Mitron Express (The Great Inauguration)',
    character: 'char_modi',
    checkpoints: [0, 200, 320, 500, 700, 850, 1200],
    labels: {
      0: '0m_spawn',
      200: '200m_district1_airport_road',
      320: '320m_mango_interview_scissors',
      500: '500m_district2_rally_grounds',
      700: '700m_chai_kettle_scaffold',
      850: '850m_district3_central_vista',
      1200: '1200m_district4_tech_corridor'
    }
  },
  {
    id: 'RAHULVERSE',
    name: 'Rahulverse (Bharat Jodo / Political Satire)',
    character: 'char_rahul_gandhi',
    checkpoints: [0, 180, 350, 500, 750, 850, 1200],
    labels: {
      0: '0m_spawn',
      180: '180m_campaign_van_podiums',
      350: '350m_giant_treadmill_sneakers',
      500: '500m_district2_press_conference',
      750: '750m_potato_to_gold_factory',
      850: '850m_district3_strategy_war_room',
      1200: '1200m_district4_youth_congress_hub'
    }
  },
  {
    id: 'MIDNIGHT_VELVET',
    name: 'Midnight Velvet (Luxury Nightlife & Skyline)',
    character: 'char_jax',
    checkpoints: [0, 200, 500, 850, 1200],
    labels: {
      0: '0m_spawn',
      200: '200m_district1_velvet_boulevard',
      500: '500m_district2_rooftop_lounge',
      850: '850m_district3_casino_royale',
      1200: '1200m_district4_neon_canal'
    }
  },
  {
    id: 'CHRONO_KINGDOM',
    name: 'Chrono Kingdom (Celestial Steampunk Clockwork)',
    character: 'char_jax',
    checkpoints: [0, 200, 500, 850, 1200],
    labels: {
      0: '0m_spawn',
      200: '200m_district1_brass_bazaar',
      500: '500m_district2_clockwork_citadel',
      850: '850m_district3_aether_gardens',
      1200: '1200m_district4_temporal_rift'
    }
  },
  {
    id: 'JURASSIC_RUSH',
    name: 'Jurassic Rush (Primordial Volcanoes & Dinosaurs)',
    character: 'char_jax',
    checkpoints: [0, 200, 500, 850, 1200],
    labels: {
      0: '0m_spawn',
      200: '200m_district1_primordial_swamp',
      500: '500m_district2_raptor_canyon',
      850: '850m_district3_volcanic_ridge',
      1200: '1200m_district4_ancient_forest'
    }
  },
  {
    id: 'INFERNO_EXPRESS',
    name: 'Inferno Express (Volcanic Viaduct & Magma)',
    character: 'char_jax',
    checkpoints: [0, 200, 500, 850, 1200],
    labels: {
      0: '0m_spawn',
      200: '200m_district1_lava_viaduct',
      500: '500m_district2_obsidian_citadel',
      850: '850m_district3_magma_chambers',
      1200: '1200m_district4_crimson_peaks'
    }
  }
];

async function runQualityGate() {
  console.log('=================================================================');
  console.log('🚀 METRO RUNNER 3D — INDEPENDENT PREMIUM WORLDS QUALITY GATE AUDIT');
  console.log('=================================================================');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const fullReport = {};

  try {
    for (const world of WORLDS) {
      console.log(`\n-----------------------------------------------------------------`);
      console.log(`🌍 Auditing World: ${world.name} [ID: ${world.id}]`);
      console.log(`-----------------------------------------------------------------`);

      const worldDir = path.join(BASE_ARTIFACT_DIR, world.id.toLowerCase());
      if (!fs.existsSync(worldDir)) {
        fs.mkdirSync(worldDir, { recursive: true });
      }

      const worldTelemetry = {
        worldId: world.id,
        name: world.name,
        character: world.character,
        milestones: {},
        hardMode: null,
        alternateSeed: null,
        defeatCamera: null,
        systemStatus: {}
      };

      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

      // Configure localStorage progression state
      await page.addInitScript(({ themeId, charId }) => {
        const state = {
          unlockedThemes: [
            'MODERN_METRO',
            'HISTORIC_QUARTER',
            'UNDERGROUND_METRO',
            'NEON_INDUSTRIAL',
            'NEON_RAINLINE',
            'ORBITAL_HALO',
            'ABYSSAL_GLASSLINE',
            'DOOMSDAY_LAST_TRANSIT',
            'PHANTOM_LINE',
            'HAUNTED_CARNIVAL',
            'VIP_EXPRESS',
            'RAHULVERSE',
            'MIDNIGHT_VELVET',
            'CHRONO_KINGDOM',
            'INFERNO_EXPRESS',
            'JURASSIC_RUSH',
            'VIVA_HEAT'
          ],
          selectedTheme: themeId,
          includePremiumThemesInDynamic: false,
          unlockedCharacters: ['char_jax', 'char_modi', 'char_rahul_gandhi', 'char_luna'],
          selectedCharacter: charId,
          modiFreeRuns: 999,
          rahulFreeRuns: 999
        };
        localStorage.setItem('metro_progression_v1', JSON.stringify(state));
        localStorage.setItem('metro_runner_environment_preference', themeId);
      }, { themeId: world.id, charId: world.character });

      await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      // Start Normal Run
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
          game.player.speedController.update = () => {};
          game.player.speed = 0.0;
        }

        const modal = document.querySelector('.modal-overlay, #revive-modal, #save-me-modal, #shop-modal, #environment-modal');
        if (modal && modal instanceof HTMLElement) modal.style.display = 'none';
      });

      await page.waitForTimeout(600);

      // Verify Shared Engine Integrity at 0m
      const engineCheck = await page.evaluate((themeId) => {
        const game = window.__METRO_GAME__;
        const scene = game.worldScene;
        const tm = game.trackManager;
        const prog = game.progression;
        const envDir = game.worldScene.environmentDirector;
        const diag = envDir ? envDir.getDiagnostics(0) : null;

        const chunksMatch = tm.chunks.map((c, i) => ({
          idx: i,
          chunkZ: Math.round(c.chunkZ),
          themeId: c.currentTheme ? c.currentTheme.id : 'unknown',
          districtId: c.districtId,
          isTransition: c.isTransitionPortal,
          isTunnel: c.isTunnel
        }));

        return {
          selectedInProg: prog.getSelectedTheme(),
          renderedInScene: scene.currentTheme ? scene.currentTheme.id : 'unknown',
          activeInTrackManager: tm.getActiveEnvironment(),
          activeDistrict: diag ? diag.currentEnvironment : 'unknown',
          atmospherePreset: diag ? diag.activeAtmospherePreset : 'unknown',
          chunks: chunksMatch,
          playerChar: game.player.characterId
        };
      }, world.id);

      worldTelemetry.systemStatus = engineCheck;
      console.log(`[${world.id}] Shared Engine: Selected=${engineCheck.selectedInProg}, Rendered=${engineCheck.renderedInScene}, Atmosphere=${engineCheck.atmospherePreset}`);

      // Capture Milestones
      for (const dist of world.checkpoints) {
        const label = world.labels[dist] || `${dist}m`;
        console.log(`  📸 Capturing Milestone: ${dist}m (${label})...`);

        if (dist > 0) {
          await page.waitForFunction((target) => {
            const game = window.__METRO_GAME__;
            if (!game || !game.player) return false;
            game.player.speed = 100.0;
            return game.player.distanceTraveled >= target;
          }, dist, { timeout: 90000 });

          await page.evaluate(() => {
            const game = window.__METRO_GAME__;
            game.player.speed = 0.0;
          });
        }

        await page.waitForTimeout(500);

        // Clear dynamic obstacles within 8m of player camera to guarantee unobstructed visual evaluation
        const milestoneData = await page.evaluate(() => {
          const game = window.__METRO_GAME__;
          const p = game.player;
          const tm = game.trackManager;
          const envDir = game.worldScene.environmentDirector;
          const perf = game.getPerformanceMetrics();
          const diag = envDir ? envDir.getDiagnostics(p.position.z) : null;

          const pZ = p.position.z;
          tm.chunks.forEach(c => {
            if (c.obstacles) {
              c.obstacles.forEach(obs => {
                if (obs && obs.group) {
                  const obsWorldZ = c.chunkZ + obs.group.position.z;
                  if (Math.abs(obsWorldZ - pZ) < 8.0) {
                    obs.group.position.x += 15.0; // move laterally away from view
                  }
                }
              });
            }
          });

          return {
            distance: Math.round(p.distanceTraveled),
            pos: { x: +p.position.x.toFixed(2), y: +p.position.y.toFixed(2), z: +p.position.z.toFixed(2) },
            district: diag ? diag.currentEnvironment : 'unknown',
            atmosphere: diag ? diag.activeAtmospherePreset : 'unknown',
            fps: perf.fps,
            frameTimeMs: perf.frameTimeMs,
            drawCalls: perf.drawCalls,
            triangles: perf.triangles,
            geometries: perf.geometries,
            textures: perf.textures
          };
        });

        const shotPath = path.join(worldDir, `${label}.png`);
        await page.screenshot({ path: shotPath });
        worldTelemetry.milestones[label] = { ...milestoneData, screenshot: shotPath };
        console.log(`     Saved ${shotPath} (FPS: ${milestoneData.fps}, Calls: ${milestoneData.drawCalls}, Triangles: ${milestoneData.triangles})`);
      }

      // Hard Mode Verification
      console.log(`  ⚡ Testing Hard Mode (500m)...`);
      await page.evaluate(() => {
        const game = window.__METRO_GAME__;
        game.startRun('HARD');
        game.soundManager.setMuted(true);
        game.player.crash = () => false;
        game.player.activateReviveGrace(999999);
        game.player.isIntroInvincible = true;
        if (game.openingSequence) game.openingSequence.skip();
        game.cameraController.setLobbyMode(false);
        game.player.speedController.update = () => {};
        game.player.speed = 0.0;
        const modal = document.querySelector('.modal-overlay, #revive-modal, #save-me-modal');
        if (modal && modal instanceof HTMLElement) modal.style.display = 'none';
      });

      await page.waitForTimeout(500);

      await page.waitForFunction(() => {
        const game = window.__METRO_GAME__;
        if (!game || !game.player) return false;
        game.player.speed = 100.0;
        return game.player.distanceTraveled >= 500;
      }, { timeout: 90000 });

      await page.evaluate(() => {
        const game = window.__METRO_GAME__;
        game.player.speed = 0.0;
      });

      await page.waitForTimeout(500);

      const hardData = await page.evaluate(() => {
        const game = window.__METRO_GAME__;
        const p = game.player;
        const tm = game.trackManager;
        const perf = game.getPerformanceMetrics();
        const pZ = p.position.z;
        tm.chunks.forEach(c => {
          if (c.obstacles) {
            c.obstacles.forEach(obs => {
              if (obs && obs.group) {
                const obsWorldZ = c.chunkZ + obs.group.position.z;
                if (Math.abs(obsWorldZ - pZ) < 8.0) obs.group.position.x += 15.0;
              }
            });
          }
        });
        return {
          mode: game.getActiveGameMode(),
          distance: Math.round(p.distanceTraveled),
          fps: perf.fps,
          drawCalls: perf.drawCalls,
          triangles: perf.triangles
        };
      });

      const hardShotPath = path.join(worldDir, 'hard_500m.png');
      await page.screenshot({ path: hardShotPath });
      worldTelemetry.hardMode = { ...hardData, screenshot: hardShotPath };
      console.log(`     Saved ${hardShotPath} (Mode: ${hardData.mode}, FPS: ${hardData.fps})`);

      // Defeat Camera Verification
      console.log(`  💀 Testing Defeat Camera Framing...`);
      await page.evaluate(() => {
        const game = window.__METRO_GAME__;
        const p = game.player;
        p.state = 'CRASH';
        game.cameraController.setGameOverMode(true, p.position);
      });

      await page.waitForTimeout(800);

      const defeatShotPath = path.join(worldDir, 'defeat_cam.png');
      await page.screenshot({ path: defeatShotPath });
      worldTelemetry.defeatCamera = { screenshot: defeatShotPath };
      console.log(`     Saved ${defeatShotPath}`);

      // Alternate Seed (Procedural Variety) Verification
      console.log(`  🎲 Testing Alternate Seed (Seed: 7777, 300m)...`);
      await page.evaluate(() => {
        const game = window.__METRO_GAME__;
        game.trackManager.setDebugSeed(7777);
        game.startRun('NORMAL');
        game.soundManager.setMuted(true);
        game.player.crash = () => false;
        game.player.activateReviveGrace(999999);
        game.player.isIntroInvincible = true;
        if (game.openingSequence) game.openingSequence.skip();
        game.cameraController.setLobbyMode(false);
        game.player.speedController.update = () => {};
        game.player.speed = 0.0;
        const modal = document.querySelector('.modal-overlay, #revive-modal, #save-me-modal');
        if (modal && modal instanceof HTMLElement) modal.style.display = 'none';
      });

      await page.waitForTimeout(500);

      await page.waitForFunction(() => {
        const game = window.__METRO_GAME__;
        if (!game || !game.player) return false;
        game.player.speed = 100.0;
        return game.player.distanceTraveled >= 300;
      }, { timeout: 90000 });

      await page.evaluate(() => {
        const game = window.__METRO_GAME__;
        game.player.speed = 0.0;
        const pZ = game.player.position.z;
        game.trackManager.chunks.forEach(c => {
          if (c.obstacles) {
            c.obstacles.forEach(obs => {
              if (obs && obs.group) {
                const obsWorldZ = c.chunkZ + obs.group.position.z;
                if (Math.abs(obsWorldZ - pZ) < 8.0) obs.group.position.x += 15.0;
              }
            });
          }
        });
      });

      await page.waitForTimeout(500);

      const altSeedShotPath = path.join(worldDir, 'alt_seed_300m.png');
      await page.screenshot({ path: altSeedShotPath });
      worldTelemetry.alternateSeed = { seed: 7777, distance: 300, screenshot: altSeedShotPath };
      console.log(`     Saved ${altSeedShotPath}`);

      // Save world telemetry JSON
      fs.writeFileSync(path.join(worldDir, 'telemetry.json'), JSON.stringify(worldTelemetry, null, 2));

      fullReport[world.id] = worldTelemetry;
      await page.close();
    }

    fs.writeFileSync(path.join(BASE_ARTIFACT_DIR, 'summary_telemetry.json'), JSON.stringify(fullReport, null, 2));
    console.log('\n=================================================================');
    console.log('🎉 ALL 6 PREMIUM WORLDS AUDITED SUCCESSFULLY!');
    console.log('=================================================================');
  } catch (err) {
    console.error('❌ Quality Gate Error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runQualityGate();
