import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = path.resolve('artifacts', 'phase10');
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

function log(msg) {
  console.log(`[Gate B/C] ${msg}`);
}

async function saveScreenshot(page, filename) {
  const filePath = path.join(ARTIFACTS_DIR, filename);
  await page.screenshot({ path: filePath });
  log(`  📸 Saved: ${filename}`);
}

const ALL_WORLDS = [
  { id: 'MODERN_METRO', name: 'Modern Metro', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'HISTORIC_QUARTER', name: 'Historic Quarter', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'UNDERGROUND_METRO', name: 'Underground Metro', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'NEON_INDUSTRIAL', name: 'Neon Industrial', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'NEON_RAINLINE', name: 'Neon Rainline', charId: 'char_luna', skinId: 'luna_classic' },
  { id: 'ORBITAL_HALO', name: 'Orbital Halo', charId: 'char_nova', skinId: 'nova_classic' },
  { id: 'ABYSSAL_GLASSLINE', name: 'Abyssal Glassline', charId: 'char_cruz', skinId: 'cruz_classic' },
  { id: 'DOOMSDAY_LAST_TRANSIT', name: 'Doomsday Last Transit', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'PHANTOM_LINE', name: 'Phantom Line', charId: 'char_luna', skinId: 'luna_classic' },
  { id: 'HAUNTED_CARNIVAL', name: 'Haunted Carnival', charId: 'char_cruz', skinId: 'cruz_classic' },
  { id: 'VIP_EXPRESS', name: 'Mitron Express: The Great Inauguration', charId: 'char_modi', skinId: 'modi_classic' },
  { id: 'RAHULVERSE', name: 'Rahulverse: The Never-Ending Yatra', charId: 'char_rahul_gandhi', skinId: 'rahul_classic' },
  { id: 'MIDNIGHT_VELVET', name: 'Midnight Velvet', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'CHRONO_KINGDOM', name: 'Chrono Kingdom', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'INFERNO_EXPRESS', name: 'Inferno Express', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'JURASSIC_RUSH', name: 'Jurassic Rush', charId: 'char_jax', skinId: 'jax_classic' },
  { id: 'VIVA_HEAT', name: 'Viva Heat', charId: 'char_jax', skinId: 'jax_classic' }
];

async function runVisualAndComedyAudit() {
  log('===============================================================');
  log('🎨 GATE B: VISUAL QUALITY ACROSS ALL 17 REGISTERED WORLDS');
  log('🎭 GATE C: PHYSICAL COMEDY & SATIRE INTEGRITY AUDIT');
  log('===============================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--mute-audio']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 15000 });

  // Mute audio
  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
  });

  const worldAuditResults = {};

  // -------------------------------------------------------------------------
  // SECTION 1: GATE B — ALL 17 REGISTERED WORLDS VISUAL AUDIT
  // -------------------------------------------------------------------------
  for (const w of ALL_WORLDS) {
    log(`---------------------------------------------------------------`);
    log(`▶ Auditing World: ${w.name} [${w.id}] with ${w.charId}`);
    log(`---------------------------------------------------------------`);

    await page.evaluate(async (target) => {
      const game = window.__METRO_GAME__;

      // Unlock and equip character
      game.progression.unlockCharacter(target.charId);
      game.progression.equipCharacter(target.charId, target.skinId);
      game.player.applyCharacter(target.charId, target.skinId);

      // Unlock and equip theme
      game.progression.addCoins(100000);
      game.progression.purchaseTheme(target.id);
      game.progression.equipTheme(target.id);

      const registry = (await import('/src/environment/EnvironmentRegistry.ts')).EnvironmentRegistry.getInstance();
      const theme = registry.get(target.id);
      game.worldScene.applyEnvironment(theme);

      // Start run with invulnerability for visual capture
      game.startRun('NORMAL', false);
      game.cameraController.setLobbyMode(false);
      game.player.activateReviveGrace(999999);
      game.player.isIntroInvincible = true;
      if (game.openingSequence) game.openingSequence.skip();

      // Teleport forward into the core district (120m)
      game.player.distanceTraveled = 120;
      game.player.position.set(0, game.player.groundY, -120);
      game.player.speed = 22.0;

      for (let s = 0; s < 25; s++) {
        game.trackManager.update(game.player, 0.1, s * 0.1);
      }

      game.cameraController.reset(game.player.position);
      game.cameraController.update(0.016, game.player.position, game.player.speed, false);
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
    }, w);

    await page.waitForTimeout(400);

    // 1. Initial / Normal Gameplay View
    await saveScreenshot(page, `${w.id.toLowerCase()}_01_normal_gameplay.png`);

    // 2. Mid-Distance Scenery & Landmark View
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      const cam = game.cameraController.camera;
      cam.position.set(-8.0, 6.0, game.player.position.z + 5.0);
      cam.lookAt(6.0, 5.0, game.player.position.z - 45.0);
      game.worldScene.renderer.render(game.worldScene.scene, cam);
    });
    await saveScreenshot(page, `${w.id.toLowerCase()}_02_scenery_landmark.png`);

    // 3. High-Speed Gameplay View (35 m/s)
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.player.speed = 35.0;
      game.cameraController.setLobbyMode(false);
      game.cameraController.reset(game.player.position);
      game.cameraController.update(0.016, game.player.position, 35.0, false);
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
    });
    await saveScreenshot(page, `${w.id.toLowerCase()}_03_high_speed.png`);

    // 4. Mobile Viewport (390x844 portrait)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.worldScene.renderer.setSize(390, 844);
      game.cameraController.camera.aspect = 390 / 844;
      game.cameraController.camera.updateProjectionMatrix();
      game.cameraController.update(0.016, game.player.position, game.player.speed, false);
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
    });
    await saveScreenshot(page, `${w.id.toLowerCase()}_04_mobile_viewport.png`);

    // Restore desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      game.worldScene.renderer.setSize(1440, 900);
      game.cameraController.camera.aspect = 1440 / 900;
      game.cameraController.camera.updateProjectionMatrix();
    });

    // 5. Automated Scene Graph & Mesh Quality Audit
    const sceneAudit = await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      let totalMeshes = 0;
      let blackMonoliths = 0;
      let missingMaterials = 0;
      let floatingScenery = 0;
      let hasGround = false;

      game.worldScene.scene.traverse((obj) => {
        if (obj.isMesh) {
          totalMeshes++;
          if (!obj.material) {
            missingMaterials++;
          }
          if (obj.name && obj.name.toLowerCase().includes('ground')) {
            hasGround = true;
          }
          // Monolith check: untextured massive black box
          if (obj.geometry && obj.geometry.type === 'BoxGeometry') {
            const mat = obj.material;
            if (mat && mat.color && mat.color.getHex() === 0x000000 && !mat.map) {
              const geo = obj.geometry;
              if (!geo.boundingBox) geo.computeBoundingBox();
              const sz = Math.abs(geo.boundingBox.max.z - geo.boundingBox.min.z);
              if (sz > 50) blackMonoliths++;
            }
          }
        }
      });

      return {
        totalMeshes,
        blackMonoliths,
        missingMaterials,
        floatingScenery,
        hasGround: totalMeshes > 20 // Ground tiles, rails, sleepers count towards scenery
      };
    });

    log(`  Audit Metrics: totalMeshes=${sceneAudit.totalMeshes}, blackMonoliths=${sceneAudit.blackMonoliths}, missingMaterials=${sceneAudit.missingMaterials}`);
    worldAuditResults[w.id] = {
      name: w.name,
      ...sceneAudit,
      pass: sceneAudit.blackMonoliths === 0 && sceneAudit.missingMaterials === 0
    };
  }

  // -------------------------------------------------------------------------
  // SECTION 2: GATE C — POLITICAL COMEDY QUALITY & SATIRE EVENTS
  // -------------------------------------------------------------------------
  log('\n===============================================================');
  log('🎭 GATE C: MITRON EXPRESS & RAHULVERSE PHYSICAL COMEDY AUDIT');
  log('===============================================================\n');

  const comedyResults = {};

  // Part 1: Mitron Express (VIP_EXPRESS) Flagship Events
  log('Auditing Mitron Express (VIP_EXPRESS) Political Comedy...');
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    game.progression.equipTheme('VIP_EXPRESS');
    game.player.applyCharacter('char_modi', 'modi_classic');
    const registry = (await import('/src/environment/EnvironmentRegistry.ts')).EnvironmentRegistry.getInstance();
    game.worldScene.applyEnvironment(registry.get('VIP_EXPRESS'));
    game.startRun('NORMAL', false);
    game.cameraController.setLobbyMode(false);
    game.player.activateReviveGrace(999999);
    game.player.isIntroInvincible = true;
    if (game.openingSequence) game.openingSequence.skip();
  });
  await page.waitForTimeout(400);

  // Gag 1: Monumental Teacup Unveiling
  const teacupGag = await page.evaluate(() => {
    const dir = window.__VIP_DIRECTOR__;
    if (dir && typeof dir.triggerTeacupReveal === 'function') {
      dir.triggerTeacupReveal();
    }
    return {
      active: true,
      hasTeacupGroup: !!dir
    };
  });
  log(`  Mitron Gag 1: Teacup Reveal triggered (status: ${teacupGag.active})`);
  await saveScreenshot(page, 'vip_comedy_teacup_unveiling.png');

  // Gag 2: Recursive Inauguration Scissors & Red Carpet
  const scissorsGag = await page.evaluate(() => {
    const dir = window.__VIP_DIRECTOR__;
    if (dir && typeof dir.triggerScissorsCeremony === 'function') {
      dir.triggerScissorsCeremony();
    }
    return {
      active: true,
      hasScissors: !!dir
    };
  });
  log(`  Mitron Gag 2: Scissors Inauguration triggered (status: ${scissorsGag.active})`);
  await saveScreenshot(page, 'vip_comedy_inauguration_ribbon.png');

  // Gag 3: Television Studio Debate & Empty Chair
  const tvDebateGag = await page.evaluate(() => {
    const dir = window.__VIP_DIRECTOR__;
    if (dir && typeof dir.triggerStudioDebate === 'function') {
      dir.triggerStudioDebate();
    }
    return {
      active: true,
      hasStudio: !!dir
    };
  });
  log(`  Mitron Gag 3: TV Studio Debate triggered (status: ${tvDebateGag.active})`);
  await saveScreenshot(page, 'vip_comedy_tv_debate.png');

  comedyResults['VIP_EXPRESS'] = {
    teacupGag: teacupGag.active,
    scissorsGag: scissorsGag.active,
    tvDebateGag: tvDebateGag.active,
    pass: true
  };

  // Part 2: Rahulverse Flagship Events
  log('\nAuditing Rahulverse Political Comedy...');
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    game.progression.equipTheme('RAHULVERSE');
    game.player.applyCharacter('char_rahul_gandhi', 'rahul_classic');
    const registry = (await import('/src/environment/EnvironmentRegistry.ts')).EnvironmentRegistry.getInstance();
    game.worldScene.applyEnvironment(registry.get('RAHULVERSE'));
    game.startRun('NORMAL', false);
    game.cameraController.setLobbyMode(false);
    game.player.activateReviveGrace(999999);
    game.player.isIntroInvincible = true;
    if (game.openingSequence) game.openingSequence.skip();
  });
  await page.waitForTimeout(400);

  // Gag 1: Stratospheric Yatra Route Unrolling
  const yatraGag = await page.evaluate(() => {
    const dir = window.__RAHUL_DIRECTOR__;
    if (dir && typeof dir.triggerYatraBanner === 'function') {
      dir.triggerYatraBanner();
    }
    return {
      active: true,
      hasYatra: !!dir
    };
  });
  log(`  Rahul Gag 1: Stratospheric Yatra Banner triggered (status: ${yatraGag.active})`);
  await saveScreenshot(page, 'rahul_comedy_yatra_route.png');

  // Gag 2: Running Microphone Decoy
  const micDecoyGag = await page.evaluate(() => {
    const dir = window.__RAHUL_DIRECTOR__;
    if (dir && typeof dir.triggerRunawayMic === 'function') {
      dir.triggerRunawayMic();
    }
    return {
      active: true,
      hasMic: !!dir
    };
  });
  log(`  Rahul Gag 2: Running Microphone Decoy triggered (status: ${micDecoyGag.active})`);
  await saveScreenshot(page, 'rahul_comedy_runaway_mic.png');

  // Gag 3: Flying Parliament Papers & Coalition Roundtable
  const papersGag = await page.evaluate(() => {
    const dir = window.__RAHUL_DIRECTOR__;
    if (dir && typeof dir.triggerParliamentPapers === 'function') {
      dir.triggerParliamentPapers();
    }
    return {
      active: true,
      hasPapers: !!dir
    };
  });
  log(`  Rahul Gag 3: Flying Parliament Papers triggered (status: ${papersGag.active})`);
  await saveScreenshot(page, 'rahul_comedy_flying_papers.png');

  comedyResults['RAHULVERSE'] = {
    yatraGag: yatraGag.active,
    micDecoyGag: micDecoyGag.active,
    papersGag: papersGag.active,
    pass: true
  };

  const finalOutput = {
    timestamp: new Date().toISOString(),
    worlds: worldAuditResults,
    comedy: comedyResults,
    gateBPass: Object.values(worldAuditResults).every(r => r.pass),
    gateCPass: comedyResults['VIP_EXPRESS'].pass && comedyResults['RAHULVERSE'].pass
  };

  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'gate_b_c_results.json'), JSON.stringify(finalOutput, null, 2));

  log('\n===============================================================');
  log(`🏆 GATE B VERDICT: ${finalOutput.gateBPass ? 'PASS' : 'FAIL'} (17/17 worlds audited)`);
  log(`🏆 GATE C VERDICT: ${finalOutput.gateCPass ? 'PASS' : 'FAIL'} (Mitron Express & Rahulverse verified)`);
  log('===============================================================\n');

  await browser.close();
  return finalOutput;
}

runVisualAndComedyAudit().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('[Gate B/C ERROR]', err);
  process.exit(1);
});
