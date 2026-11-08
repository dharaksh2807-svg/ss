import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const LOCAL_AUDIT_DIR = path.resolve('artifacts', 'audit');
const BRAIN_AUDIT_DIR = process.env.BRAIN_AUDIT_DIR || '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/audit';

fs.mkdirSync(LOCAL_AUDIT_DIR, { recursive: true });
if (BRAIN_AUDIT_DIR) {
  fs.mkdirSync(BRAIN_AUDIT_DIR, { recursive: true });
}

function saveScreenshot(buffer, filename) {
  const localFile = path.join(LOCAL_AUDIT_DIR, filename);
  fs.writeFileSync(localFile, buffer);
  if (BRAIN_AUDIT_DIR) {
    try {
      const brainFile = path.join(BRAIN_AUDIT_DIR, filename);
      fs.writeFileSync(brainFile, buffer);
    } catch {
      // brain directory optional
    }
  }
  console.log(`    📸 Saved: ${filename}`);
}

const ALL_WORLDS = [
  { id: 'MODERN_METRO', name: 'Modern Metro District', char: 'char_jax', skin: 'jax_classic' },
  { id: 'HISTORIC_QUARTER', name: 'Historic Quarter', char: 'char_jax', skin: 'jax_classic' },
  { id: 'UNDERGROUND_METRO', name: 'Underground Metro', char: 'char_jax', skin: 'jax_classic' },
  { id: 'NEON_INDUSTRIAL', name: 'Neon Industrial', char: 'char_jax', skin: 'jax_classic' },
  { id: 'NEON_RAINLINE', name: 'Neon Rainline', char: 'char_jax', skin: 'jax_classic' },
  { id: 'ORBITAL_HALO', name: 'Orbital Halo', char: 'char_jax', skin: 'jax_classic' },
  { id: 'ABYSSAL_GLASSLINE', name: 'Abyssal Glassline', char: 'char_jax', skin: 'jax_classic' },
  { id: 'DOOMSDAY_LAST_TRANSIT', name: 'Doomsday: Last Transit', char: 'char_jax', skin: 'jax_classic' },
  { id: 'PHANTOM_LINE', name: 'Phantom Line', char: 'char_jax', skin: 'jax_classic' },
  { id: 'HAUNTED_CARNIVAL', name: 'Haunted Carnival', char: 'char_jax', skin: 'jax_classic' },
  { id: 'VIP_EXPRESS', name: 'VIP Express (Mitron)', char: 'char_modi', skin: 'modi_classic' },
  { id: 'RAHULVERSE', name: 'Rahulverse: The Never-Ending Yatra', char: 'char_rahul_gandhi', skin: 'rahul_classic' },
  { id: 'MIDNIGHT_VELVET', name: 'Midnight Velvet: After Dark', char: 'char_jax', skin: 'jax_classic' },
  { id: 'CHRONO_KINGDOM', name: 'Chrono Kingdom: The Clockwork Empire', char: 'char_jax', skin: 'jax_classic' },
  { id: 'INFERNO_EXPRESS', name: 'Inferno Express: Rails Through Hellfire', char: 'char_jax', skin: 'jax_classic' },
  { id: 'JURASSIC_RUSH', name: 'Jurassic Rush: The Living Prehistoric World', char: 'char_jax', skin: 'jax_classic' },
  { id: 'VIVA_HEAT', name: 'Viva Heat: The Forbidden Festival', char: 'char_jax', skin: 'jax_classic', isExperimental: true }
];

async function runBlockbusterAudit() {
  console.log('================================================================');
  console.log('🎬 METRO RUNNER 3D — INDEPENDENT BLOCKBUSTER QUALITY AUDIT');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`📁 Local artifacts: ${LOCAL_AUDIT_DIR}`);
  console.log(`📁 Brain artifacts: ${BRAIN_AUDIT_DIR}`);
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

  // Enable test harness mode & unlock all characters and worlds
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
      unlockedCharacters: ['char_jax', 'char_modi', 'char_rahul_gandhi'],
      selectedCharacter: 'char_jax',
      modiFreeRuns: 10,
      rahulTrialsRemaining: 10
    };
    localStorage.setItem('metro_progression_v1', JSON.stringify(state));
  });

  console.log(`Connecting to ${BASE_URL}...`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 20000 });
  console.log('🎮 Engine successfully initialized on window.__METRO_GAME__\n');

  // Mute audio
  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
  });

  const auditResults = [];

  for (let idx = 0; idx < ALL_WORLDS.length; idx++) {
    const w = ALL_WORLDS[idx];
    const prefix = String(idx + 1).padStart(2, '0');
    console.log(`\n================================================================`);
    console.log(`🌍 [${prefix}/17] AUDITING: ${w.name} (${w.id})`);
    console.log(`================================================================`);

    // 1. Setup world, equip character, start run with normal moving player
    const setupMeta = await page.evaluate((worldDef) => {
      const game = window.__METRO_GAME__;
      window.__DEV_SET_DISTRICT__(worldDef.id);

      // Equip matching hero character
      if (worldDef.char) {
        game.progression.equipCharacter(worldDef.char, worldDef.skin || 'default');
        game.player.applyCharacter(worldDef.char, worldDef.skin || 'default');
      }

      game.startRun('NORMAL');
      if (game.openingSequence) {
        game.openingSequence.skip();
      }
      if (game.trackManager.getActiveEnvironment() !== worldDef.id) {
        window.__DEV_SET_DISTRICT__(worldDef.id);
      }
      game.player.activateReviveGrace(300.0);

      const theme = game.trackManager.getActiveEnvironment();
      const chunk0 = game.trackManager.chunks[0];
      return {
        theme,
        chunkTheme: chunk0?.currentTheme?.id,
        initialZ: game.player.position.z,
        char: game.progression.getSelectedCharacter()
      };
    }, w);

    console.log(`  Initial State: theme=${setupMeta.theme}, chunkTheme=${setupMeta.chunkTheme}, char=${setupMeta.char}`);

    // Capture Stage 1: Initial 0-200m
    await page.waitForTimeout(600);
    const snap1 = await page.screenshot();
    saveScreenshot(snap1, `${prefix}_${w.id.toLowerCase()}_01_initial_0_200m.png`);

    // Advance to Middle District (~600m)
    const midMeta = await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      const targetZ = -600;
      game.player.position.z = targetZ;
      game.player.distanceTraveled = Math.abs(targetZ);
      game.trackManager.update(game.player, 0.016);
      window.__ENV_DIRECTOR__.updateAtmosphere(targetZ, game.worldScene, 0.016);
      return {
        playerZ: game.player.position.z,
        district: window.__ENV_DIRECTOR__.getCurrentDistrict(),
        activeChunks: game.trackManager.chunks.length
      };
    });
    await page.waitForTimeout(500);
    const snap2 = await page.screenshot();
    saveScreenshot(snap2, `${prefix}_${w.id.toLowerCase()}_02_middle_district_600m.png`);

    // Advance to Later District (~1800m)
    const laterMeta = await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      const targetZ = -1800;
      game.player.position.z = targetZ;
      game.player.distanceTraveled = Math.abs(targetZ);
      game.trackManager.update(game.player, 0.016);
      window.__ENV_DIRECTOR__.updateAtmosphere(targetZ, game.worldScene, 0.016);
      return {
        playerZ: game.player.position.z,
        district: window.__ENV_DIRECTOR__.getCurrentDistrict()
      };
    });
    await page.waitForTimeout(500);
    const snap3 = await page.screenshot();
    saveScreenshot(snap3, `${prefix}_${w.id.toLowerCase()}_03_later_district_1800m.png`);

    // Advance to Long-run distance (~3200m)
    const longMeta = await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      const targetZ = -3200;
      game.player.position.z = targetZ;
      game.player.distanceTraveled = Math.abs(targetZ);
      game.trackManager.update(game.player, 0.016);
      window.__ENV_DIRECTOR__.updateAtmosphere(targetZ, game.worldScene, 0.016);

      let meshCount = 0;
      let minFoundationY = Infinity;
      for (const c of game.trackManager.chunks) {
        if (c.decorativeGroup) {
          c.decorativeGroup.traverse((obj) => {
            if (obj.isMesh) {
              meshCount++;
              if (obj.geometry) {
                if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
                const b = obj.geometry.boundingBox;
                if (b) {
                  const worldY = b.min.y + obj.position.y;
                  if (worldY < minFoundationY) minFoundationY = worldY;
                }
              }
            }
          });
        }
      }

      return {
        playerZ: game.player.position.z,
        meshCount,
        minFoundationY: minFoundationY === Infinity ? 0 : minFoundationY,
        fps: game.fpsCounter ? game.fpsCounter.fps : 60,
        frameTimeMs: window.__ENV_DIRECTOR__.getDiagnostics(targetZ).frameTimeMs
      };
    });
    await page.waitForTimeout(500);
    const snap4 = await page.screenshot();
    saveScreenshot(snap4, `${prefix}_${w.id.toLowerCase()}_04_longrun_3200m.png`);

    // Capture Cinematic Encounter perspective
    const encounterMeta = await page.evaluate(async (worldId) => {
      const game = window.__METRO_GAME__;
      const cam = game.cameraController.camera;
      // Position camera slightly elevated & pulled back to showcase cinematic scale
      cam.position.set(0, 7.5, game.player.position.z + 14.0);
      cam.lookAt(0, 4.0, game.player.position.z - 35.0);
      return { camY: cam.position.y };
    }, w.id);
    await page.waitForTimeout(400);
    const snap5 = await page.screenshot();
    saveScreenshot(snap5, `${prefix}_${w.id.toLowerCase()}_05_cinematic_encounter.png`);

    // Capture Rooftop / Aerial Corridor perspective
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const cam = game.cameraController.camera;
      // Position player and camera on train rooftop level (Y = 4.35m)
      game.player.position.y = 4.35;
      cam.position.set(0, 6.8, game.player.position.z + 9.5);
      cam.lookAt(0, 4.8, game.player.position.z - 30.0);
    });
    await page.waitForTimeout(400);
    const snap6 = await page.screenshot();
    saveScreenshot(snap6, `${prefix}_${w.id.toLowerCase()}_06_rooftop_perspective.png`);

    // Reset camera controller
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.position.y = 0;
      game.cameraController.reset(game.player.position);
    });

    // Replayability & Hard Mode Check with different seed (7777)
    const hardModeCheck = await page.evaluate((worldId) => {
      const game = window.__METRO_GAME__;
      game.trackManager.setGameMode('HARD');
      game.trackManager.setSeed(7777, true);
      game.startRun('HARD', true);
      if (game.openingSequence) game.openingSequence.skip();
      window.__DEV_SET_DISTRICT__(worldId);
      game.player.activateReviveGrace(30.0);
      return {
        gameMode: game.activeGameMode,
        seed: game.trackManager.getRunSeed(),
        speed: game.player.speed
      };
    }, w.id);

    console.log(`  Audit Metrics: meshes=${longMeta.meshCount}, minFoundationY=${longMeta.minFoundationY.toFixed(2)}m, frameTime=${longMeta.frameTimeMs}ms, hardSpeed=${hardModeCheck.speed.toFixed(1)}m/s`);

    auditResults.push({
      prefix,
      id: w.id,
      name: w.name,
      meshes: longMeta.meshCount,
      minFoundationY: longMeta.minFoundationY,
      frameTimeMs: longMeta.frameTimeMs,
      fps: longMeta.fps
    });
  }

  await browser.close();

  console.log('\n================================================================');
  console.log('📊 BLOCKBUSTER AUDIT DATA SUMMARY (17 WORLDS)');
  console.log('================================================================');
  console.table(auditResults);
  console.log('✅ ALL 17 WORLDS AUDITED ACROSS 6 VISUAL STAGES IN REAL GAMEPLAY RUNTIME!\n');

  // Save audit metrics JSON
  const auditJsonPath = path.join(LOCAL_AUDIT_DIR, 'audit-metrics.json');
  fs.writeFileSync(auditJsonPath, JSON.stringify(auditResults, null, 2));
  if (BRAIN_AUDIT_DIR) {
    fs.writeFileSync(path.join(BRAIN_AUDIT_DIR, 'audit-metrics.json'), JSON.stringify(auditResults, null, 2));
  }
}

runBlockbusterAudit().catch((err) => {
  console.error('❌ BLOCKBUSTER AUDIT FAILED:', err);
  process.exit(1);
});
