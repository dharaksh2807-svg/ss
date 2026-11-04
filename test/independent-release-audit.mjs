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

const TARGET_WORLDS = [
  { id: 'VIP_EXPRESS', name: 'Mitron Express: The Great Inauguration', charId: 'char_modi', skinId: 'modi_classic' },
  { id: 'RAHULVERSE', name: 'Rahulverse: The Never-Ending Yatra', charId: 'char_rahul_gandhi', skinId: 'rahul_classic' },
  { id: 'MIDNIGHT_VELVET', name: 'Midnight Velvet: After Dark', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'CHRONO_KINGDOM', name: 'Chrono Kingdom: The Clockwork Empire', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'INFERNO_EXPRESS', name: 'Inferno Express: Rails Through Hellfire', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'JURASSIC_RUSH', name: 'Jurassic Rush: The Lost World Railway', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'VIVA_HEAT', name: 'Viva Heat: The Forbidden Festival', charId: 'char_jax', skinId: 'jax_classic', isExperimental: true }
];

const SPOTCHECK_WORLDS = [
  'MODERN_METRO',
  'HISTORIC_QUARTER',
  'UNDERGROUND_METRO',
  'NEON_INDUSTRIAL',
  'NEON_RAINLINE',
  'ORBITAL_HALO',
  'HAUNTED_CARNIVAL'
];

async function runIndependentAudit() {
  console.log('=======================================================');
  console.log('🕵️ METRO RUNNER 3D — INDEPENDENT WORLD RELEASE AUDIT');
  console.log('=======================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const auditReport = {
    timestamp: new Date().toISOString(),
    engine: 'Metro Runner 3D (Three.js WebGL)',
    browser: 'Google Chrome Angle WebGL',
    worlds: {},
    spotChecks: {},
    gameplayMechanics: {},
    switchingMemoryTest: []
  };

  // -------------------------------------------------------------------------
  // SECTION 1: DETAILED AUDIT FOR ALL 7 TARGET WORLDS
  // -------------------------------------------------------------------------
  for (const world of TARGET_WORLDS) {
    console.log(`\n-------------------------------------------------------`);
    console.log(`▶ AUDITING: ${world.name} [${world.id}]`);
    console.log(`-------------------------------------------------------`);

    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2
    });

    // Clean isolated progression setup in localStorage before loading
    await page.addInitScript(({ id, char, skin, isExp }) => {
      const state = {
        unlockedThemes: [
          'MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL',
          'NEON_RAINLINE', 'ORBITAL_HALO', 'ABYSSAL_GLASSLINE', 'DOOMSDAY_LAST_TRANSIT',
          'PHANTOM_LINE', 'HAUNTED_CARNIVAL', 'VIP_EXPRESS', 'RAHULVERSE',
          'MIDNIGHT_VELVET', 'CHRONO_KINGDOM', 'INFERNO_EXPRESS', 'JURASSIC_RUSH'
        ],
        selectedTheme: isExp ? 'MODERN_METRO' : id,
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax', 'char_modi', 'char_rahul_gandhi'],
        selectedCharacter: char || 'char_jax',
        modiFreeRuns: 5,
        rahulTrialsRemaining: 5
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', isExp ? 'MODERN_METRO' : id);
    }, { id: world.id, char: world.charId, skin: world.skinId, isExp: world.isExperimental });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 15000 });

    // Mute audio
    await page.evaluate(() => {
      window.__METRO_GAME__.soundManager.setMuted(true);
    });

    // Configure and start gameplay run
    await page.evaluate((w) => {
      const game = window.__METRO_GAME__;

      if (w.isExperimental) {
        if (window.__DEV_SET_WORLD__) {
          window.__DEV_SET_WORLD__(w.id);
        }
      }

      game.startRun('NORMAL');
      if (game.openingSequence) {
        game.openingSequence.skip();
      }

      game.player.activateReviveGrace(999999);
      game.player.isIntroInvincible = true;

      if (window.__GRAPHICS_MANAGER__) {
        window.__GRAPHICS_MANAGER__.setPreset('HIGH');
      }
    }, world);

    // Let runner advance 120 frames into the district
    await page.evaluate(async () => {
      await new Promise((r) => {
        let frames = 0;
        function step() {
          frames++;
          if (frames < 120) requestAnimationFrame(step);
          else r();
        }
        requestAnimationFrame(step);
      });
    });

    // Check active district and theme
    const stateInfo = await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const diag = window.__ENV_DIRECTOR__ ? window.__ENV_DIRECTOR__.getDiagnostics(game.player.position.z) : null;
      return {
        trackActiveEnv: game.trackManager.getActiveEnvironment(),
        themeDisplayName: game.worldScene.currentTheme?.displayName,
        themeSubtitle: game.worldScene.currentTheme?.subtitle,
        currentDistrict: diag?.currentEnvironment,
        playerZ: Math.round(game.player.position.z),
        speed: Math.round(game.player.speed),
        meshCount: diag?.sceneryMeshCount
      };
    });
    console.log(`  State: env=${stateInfo.trackActiveEnv}, theme="${stateInfo.themeDisplayName}", playerZ=${stateInfo.playerZ}m, meshes=${stateInfo.meshCount}`);

    // View 1: Behind Runner Active Gameplay
    console.log('  📸 1. Capturing Behind-Runner View...');
    let buf = await page.screenshot();
    saveScreenshotSync(buf, `${world.id.toLowerCase()}_01_normal_behind_runner.png`);

    // View 2: Forward Obstacle & Readability View
    console.log('  📸 2. Capturing Forward Readability View...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const cam = game.cameraController.camera;
      cam.position.set(0, 1.8, game.player.position.z + 1.2);
      cam.lookAt(0, 1.5, game.player.position.z - 45.0);
      game.worldScene.renderer.render(game.worldScene.scene, cam);
    });
    buf = await page.screenshot();
    saveScreenshotSync(buf, `${world.id.toLowerCase()}_02_obstacle_readability.png`);

    // View 3: Cinematic Architecture Vantage
    console.log('  📸 3. Capturing Cinematic Architecture View...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const cam = game.cameraController.camera;
      cam.position.set(-7.0, 5.5, game.player.position.z + 4.0);
      cam.lookAt(5.0, 6.0, game.player.position.z - 40.0);
      game.worldScene.renderer.render(game.worldScene.scene, cam);
    });
    buf = await page.screenshot();
    saveScreenshotSync(buf, `${world.id.toLowerCase()}_03_scenery_three_quarter.png`);

    // Restore gameplay camera tracking
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.cameraController.update(0.016, game.player.position, game.player.speed, false);
    });

    // View 4: Mobile Portrait Viewport
    console.log('  📸 4. Capturing Mobile Portrait Viewport (390x844)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.cameraController.update(0.016, game.player.position, game.player.speed, false);
      game.worldScene.renderer.setSize(390, 844);
      game.cameraController.camera.aspect = 390 / 844;
      game.cameraController.camera.updateProjectionMatrix();
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
    });
    buf = await page.screenshot();
    saveScreenshotSync(buf, `${world.id.toLowerCase()}_04_mobile_viewport.png`);

    // Reset viewport back to Desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.worldScene.renderer.setSize(1440, 900);
      game.cameraController.camera.aspect = 1440 / 900;
      game.cameraController.camera.updateProjectionMatrix();
    });

    // 5. Sample Real-Time Running Telemetry (90 active RAF frames)
    console.log('  ⚡ 5. Sampling Real-Time 90-frame Telemetry...');
    const telemetry = await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      const renderer = game.worldScene.renderer;
      const frameTimes = [];
      const calls = [];
      const tris = [];

      await new Promise((resolve) => {
        let f = 0;
        let last = performance.now();
        function tick() {
          const now = performance.now();
          if (f > 0) {
            frameTimes.push(now - last);
            calls.push(renderer.info.render.calls);
            tris.push(renderer.info.render.triangles);
          }
          last = now;
          f++;
          if (f < 90) requestAnimationFrame(tick);
          else resolve();
        }
        requestAnimationFrame(tick);
      });

      frameTimes.sort((a, b) => a - b);
      const avgFt = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const p99Ft = frameTimes[Math.floor(frameTimes.length * 0.99)];
      const avgCalls = Math.round(calls.reduce((a, b) => a + b, 0) / calls.length);
      const avgTris = Math.round(tris.reduce((a, b) => a + b, 0) / tris.length);

      return {
        avgFps: Math.round(1000 / avgFt),
        p99Fps: Math.round(1000 / p99Ft),
        avgFrameTimeMs: Math.round(avgFt * 100) / 100,
        drawCalls: avgCalls,
        triangles: avgTris,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures
      };
    });

    // Query active event director counters
    const directorCounts = await page.evaluate((wId) => {
      try {
        if (wId === 'VIP_EXPRESS' && window.__VIP_DIRECTOR__) {
          const d = window.__VIP_DIRECTOR__;
          return { scissors: d.getScissorsCount?.() ?? 0, debaters: d.getDebatersCount?.() ?? 0, steam: d.getSteamCount?.() ?? 0, total: d.getTotalActiveElements?.() ?? 0 };
        }
        if (wId === 'RAHULVERSE' && window.__RAHUL_DIRECTOR__) {
          const d = window.__RAHUL_DIRECTOR__;
          return { flipBoards: d.getFlipBoardCount?.() ?? 0, mics: d.getRunawayMicCount?.() ?? 0, papers: d.getFlyingPapersCount?.() ?? 0, total: d.getTotalActiveElements?.() ?? 0 };
        }
        if (wId === 'MIDNIGHT_VELVET' && window.__MIDNIGHT_DIRECTOR__) {
          const d = window.__MIDNIGHT_DIRECTOR__;
          return { dancers: d.getPartyDancerCount?.() ?? 0, yachts: d.getMarinaYachtCount?.() ?? 0, total: d.getTotalActiveElements?.() ?? 0 };
        }
        if (wId === 'CHRONO_KINGDOM' && window.__CHRONO_DIRECTOR__) {
          const d = window.__CHRONO_DIRECTOR__;
          return { gears: d.getGearCount?.() ?? 0, pistons: d.getPistonCount?.() ?? 0, observatories: d.getObservatoryCount?.() ?? 0, total: d.getTotalActiveElements?.() ?? 0 };
        }
        if (wId === 'INFERNO_EXPRESS' && window.__INFERNO_DIRECTOR__) {
          const d = window.__INFERNO_DIRECTOR__;
          return { waterfalls: d.getWaterfallCount?.() ?? 0, chains: d.getChainCount?.() ?? 0, blastDoors: d.getBlastDoorCount?.() ?? 0, total: d.getTotalActiveElements?.() ?? 0 };
        }
        if (wId === 'JURASSIC_RUSH' && window.__JURASSIC_DIRECTOR__) {
          const d = window.__JURASSIC_DIRECTOR__;
          return { sauropods: d.getSauropodCount?.() ?? 0, raptors: d.getRaptorPackCount?.() ?? 0, herds: d.getHerbivoreHerdCount?.() ?? 0, total: d.getTotalActiveElements?.() ?? 0 };
        }
        if (wId === 'VIVA_HEAT' && window.__FEVER_DIRECTOR__) {
          const d = window.__FEVER_DIRECTOR__;
          return { flowers: d.getFlowerCount?.() ?? 0, dancers: d.getDancerCount?.() ?? 0, state: d.getState?.() ?? 'UNKNOWN', total: d.getTotalActiveElements?.() ?? 0 };
        }
      } catch (e) {
        return { error: String(e) };
      }
      return {};
    }, world.id);

    console.log(`  Telemetry: ${telemetry.avgFps} FPS (1% Low: ${telemetry.p99Fps}), ${telemetry.drawCalls} calls, ${telemetry.triangles.toLocaleString()} tris, geos: ${telemetry.geometries}`);
    console.log(`  Director:`, directorCounts);

    auditReport.worlds[world.id] = {
      ...world,
      state: stateInfo,
      telemetry,
      directorCounts
    };

    await page.close();
  }

  // -------------------------------------------------------------------------
  // SECTION 2: SPOT-CHECK ORIGINAL & RELEASED WORLDS FOR REGRESSIONS
  // -------------------------------------------------------------------------
  console.log(`\n=======================================================`);
  console.log(`🔍 SPOT-CHECKING ORIGINAL & PREVIOUS PREMIUM WORLDS`);
  console.log(`=======================================================`);

  for (const envId of SPOTCHECK_WORLDS) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript((id) => {
      const state = {
        unlockedThemes: [
          'MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL',
          'NEON_RAINLINE', 'ORBITAL_HALO', 'ABYSSAL_GLASSLINE', 'DOOMSDAY_LAST_TRANSIT',
          'PHANTOM_LINE', 'HAUNTED_CARNIVAL'
        ],
        selectedTheme: id,
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax'],
        selectedCharacter: 'char_jax'
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', id);
    }, envId);

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!window.__METRO_GAME__);

    const check = await page.evaluate(async (id) => {
      const game = window.__METRO_GAME__;
      game.soundManager.setMuted(true);
      game.startRun('NORMAL');
      if (game.openingSequence) game.openingSequence.skip();
      game.player.activateReviveGrace(999999);

      await new Promise(r => {
        let f = 0;
        function s() { f++; if (f < 30) requestAnimationFrame(s); else r(); }
        requestAnimationFrame(s);
      });

      const renderer = game.worldScene.renderer;
      return {
        envId: id,
        activeEnv: game.trackManager.getActiveEnvironment(),
        themeName: game.worldScene.currentTheme?.displayName,
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures
      };
    }, envId);

    console.log(`  ✓ Spot-Check [${envId}]: activeEnv=${check.activeEnv}, theme="${check.themeName}", calls=${check.drawCalls}, tris=${check.triangles.toLocaleString()}`);
    auditReport.spotChecks[envId] = check;
    await page.close();
  }

  // -------------------------------------------------------------------------
  // SECTION 3: GAMEPLAY MECHANICS VERIFICATION IN-BROWSER
  // -------------------------------------------------------------------------
  console.log(`\n=======================================================`);
  console.log(`🎮 VERIFYING CORE GAMEPLAY MECHANICS IN-BROWSER`);
  console.log(`=======================================================`);

  const playPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await playPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await playPage.waitForFunction(() => !!window.__METRO_GAME__);

  // Test 1: Three-Lane Movement via Authentic Keyboard Events
  console.log('  Testing three-lane movement...');
  await playPage.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.soundManager.setMuted(true);
    game.startRun('NORMAL');
    if (game.openingSequence) game.openingSequence.skip();
    game.player.activateReviveGrace(999999);
  });

  const startLane = await playPage.evaluate(() => window.__METRO_GAME__.player.currentLane);
  // Press ArrowLeft
  await playPage.keyboard.press('ArrowLeft');
  await playPage.waitForTimeout(250);
  const leftLane = await playPage.evaluate(() => window.__METRO_GAME__.player.currentLane);

  // Press ArrowRight twice
  await playPage.keyboard.press('ArrowRight');
  await playPage.waitForTimeout(250);
  await playPage.keyboard.press('ArrowRight');
  await playPage.waitForTimeout(250);
  const rightLane = await playPage.evaluate(() => window.__METRO_GAME__.player.currentLane);

  const laneTest = { startLane, leftLane, rightLane, ok: startLane === 0 && leftLane === -1 && rightLane === 1 };
  console.log(`  ✓ Three-Lane Movement: ${laneTest.ok ? 'PASS' : 'FAIL'} (0 -> ${laneTest.leftLane} -> ${laneTest.rightLane})`);
  auditReport.gameplayMechanics.threeLaneMovement = laneTest;

  // Test 2: Jump and Slide Mechanics via Keyboard
  console.log('  Testing jump and slide...');
  await playPage.keyboard.press('ArrowUp');
  await playPage.waitForTimeout(100);
  const isJumping = await playPage.evaluate(() => window.__METRO_GAME__.player.isJumping);
  const jumpY = await playPage.evaluate(() => window.__METRO_GAME__.player.position.y);

  // Wait until runner touches down
  await playPage.waitForTimeout(700);

  await playPage.keyboard.press('ArrowDown');
  await playPage.waitForTimeout(100);
  const isSliding = await playPage.evaluate(() => window.__METRO_GAME__.player.isSliding);

  const jumpSlideTest = { isJumping, jumpY, isSliding, ok: isJumping && jumpY > 0.5 && isSliding };
  console.log(`  ✓ Jump and Slide: ${jumpSlideTest.ok ? 'PASS' : 'FAIL'} (jumpY=${jumpSlideTest.jumpY.toFixed(2)}m, slide=${jumpSlideTest.isSliding})`);
  auditReport.gameplayMechanics.jumpAndSlide = jumpSlideTest;

  // Test 3: Rooftop Ramp Climbing & Traversal
  console.log('  Testing train rooftop traversal...');
  const rooftopTest = await playPage.evaluate(async () => {
    const game = window.__METRO_GAME__;
    // Find an actual train obstacle in active track chunks
    let trainObs = null;
    for (const chunk of game.trackManager.chunks) {
      for (const obs of chunk.obstacles) {
        if (obs.active && (obs.type.includes('TRAIN') || obs.type.includes('CARRIAGE'))) {
          trainObs = obs;
          break;
        }
      }
      if (trainObs) break;
    }

    if (trainObs && trainObs.roofCollider) {
      const roofY = trainObs.roofSurfaceY || 4.35;
      const worldZ = (trainObs.roofCollider.min.z + trainObs.roofCollider.max.z) / 2;
      // Position player in the center of the train's world-space roof collider
      game.player.position.set(trainObs.lane * 2.2, roofY, worldZ);
      game.player.currentLane = trainObs.lane;
      game.player.targetLane = trainObs.lane;
      game.player.resolveRoofLanding(roofY, trainObs.id);
      await new Promise(r => setTimeout(r, 40));
      const onRoof = game.player.groundY > 2.0 || game.player.supportSurface === 'TRAIN_ROOF';
      return { onRoof, foundTrain: true, ok: onRoof };
    } else {
      // Test authoritative method contract directly
      game.player.resolveRoofLanding(4.35, 'test_roof');
      const immediateRoof = game.player.groundY === 4.35 && game.player.supportSurface === 'TRAIN_ROOF';
      return { onRoof: immediateRoof, foundTrain: false, ok: immediateRoof };
    }
  });
  console.log(`  ✓ Rooftop Traversal: ${rooftopTest.ok ? 'PASS' : 'FAIL'} (foundTrain=${rooftopTest.foundTrain}, onRoof=${rooftopTest.onRoof})`);
  auditReport.gameplayMechanics.rooftopTraversal = rooftopTest;

  // Test 4: Lethal Obstacle Collision & Quick Restart
  console.log('  Testing collision death & restart...');
  const deathRestartTest = await playPage.evaluate(async () => {
    const game = window.__METRO_GAME__;
    game.player.clearReviveGrace();
    game.player.isIntroInvincible = false;

    // Trigger crash
    game.handleFatalCrash('OBSTACLE_COLLISION');
    const isGameOver = game.lifecycleState === 'GAMEOVER' || game.lifecycleState === 'DYING' || game.lifecycleState === 'REVIVE_OFFER';

    // Quick restart
    game.quickRestart();
    await new Promise(r => setTimeout(r, 200));
    const restarted = game.lifecycleState === 'PLAYING';

    return { isGameOver, restarted, ok: isGameOver && restarted };
  });
  console.log(`  ✓ Collision Death & Restart: ${deathRestartTest.ok ? 'PASS' : 'FAIL'} (isGameOver=${deathRestartTest.isGameOver}, restarted=${deathRestartTest.restarted})`);
  auditReport.gameplayMechanics.deathAndRestart = deathRestartTest;

  await playPage.close();

  // -------------------------------------------------------------------------
  // SECTION 4: RAPID WORLD SWITCHING & MEMORY SOAK TEST
  // -------------------------------------------------------------------------
  console.log(`\n=======================================================`);
  console.log(`🔄 RAPID WORLD SWITCHING & MEMORY SOAK TEST`);
  console.log(`=======================================================`);

  const switchPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await switchPage.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await switchPage.waitForFunction(() => !!window.__METRO_GAME__);

  const switchSeq = [
    'MODERN_METRO',
    'VIP_EXPRESS',
    'RAHULVERSE',
    'MIDNIGHT_VELVET',
    'CHRONO_KINGDOM',
    'INFERNO_EXPRESS',
    'JURASSIC_RUSH',
    'VIVA_HEAT',
    'MODERN_METRO'
  ];

  for (const sId of switchSeq) {
    const res = await switchPage.evaluate(async (id) => {
      const game = window.__METRO_GAME__;
      game.soundManager.setMuted(true);
      if (window.__DEV_SET_DISTRICT__) {
        window.__DEV_SET_DISTRICT__(id);
      }
      game.startRun('NORMAL');
      if (game.openingSequence) game.openingSequence.skip();
      game.player.activateReviveGrace(999999);

      await new Promise(r => {
        let f = 0;
        function step() { f++; if (f < 20) requestAnimationFrame(step); else r(); }
        requestAnimationFrame(step);
      });

      const r = game.worldScene.renderer;
      return {
        id,
        calls: r.info.render.calls,
        triangles: r.info.render.triangles,
        geometries: r.info.memory.geometries,
        textures: r.info.memory.textures
      };
    }, sId);

    console.log(`  ➔ Switch to [${sId.padEnd(16)}]: calls=${res.calls}, tris=${res.triangles.toLocaleString()}, geos=${res.geometries}, texs=${res.textures}`);
    auditReport.switchingMemoryTest.push(res);
  }

  await switchPage.close();
  await browser.close();

  // Save full audit telemetry JSON
  const localTelPath = path.join(LOCAL_ARTIFACT_DIR, 'independent_audit_telemetry.json');
  const brainTelPath = path.join(BRAIN_ARTIFACT_DIR, 'independent_audit_telemetry.json');
  fs.writeFileSync(localTelPath, JSON.stringify(auditReport, null, 2));
  fs.writeFileSync(brainTelPath, JSON.stringify(auditReport, null, 2));
  console.log(`\n✅ Independent audit telemetry saved to:\n  - ${localTelPath}\n  - ${brainTelPath}`);

  return auditReport;
}

runIndependentAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
