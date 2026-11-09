import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BRAIN_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/e73cdf04-6547-4661-b725-4f23c723880f/evidence';
const LOCAL_ARTIFACT_DIR = path.resolve('artifacts', 'phase4-rahulverse-captures');

fs.mkdirSync(BRAIN_ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(LOCAL_ARTIFACT_DIR, { recursive: true });

function saveScreenshot(buffer, filename) {
  const pBrain = path.join(BRAIN_ARTIFACT_DIR, filename);
  const pLocal = path.join(LOCAL_ARTIFACT_DIR, filename);
  fs.writeFileSync(pBrain, buffer);
  fs.writeFileSync(pLocal, buffer);
  console.log(`  📸 Saved: ${filename}`);
}

async function main() {
  console.log('🚀 Launching Google Chrome for Metro Runner 3D Phase 4 Rahulverse Premium Comedy Captures...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  console.log('🌐 Loading http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 15000 });
  console.log('🎮 Metro Runner engine confirmed.');

  // Mute audio
  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
  });

  const telemetry = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 4: Rahulverse Premium Political Comedy and Motion',
    fpsProfiles: [],
    captures: []
  };

  // Helper to setup camera and pause
  const setupGame = async () => {
    return await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      game.progression.unlockCharacter('char_rahul_gandhi');
      game.progression.equipCharacter('char_rahul_gandhi', 'rahul_classic');
      game.player.applyCharacter('char_rahul_gandhi', 'rahul_classic');

      const { EnvironmentRegistry } = await import('./src/environment/EnvironmentRegistry.js');
      const theme = EnvironmentRegistry.getInstance().get('RAHULVERSE');
      game.trackManager.setEnvironment('RAHULVERSE');
      game.worldScene.applyEnvironment(theme);

      game.startRun('NORMAL');
      if (game.openingSequence) {
        game.openingSequence.skip();
      }

      game.player.speed = 0;
      game.player.activateReviveGrace(999999);
      game.player.isIntroInvincible = true;
      game.soundManager.setMuted(true);

      // Hide HUD elements
      const hud = document.getElementById('hud');
      if (hud) hud.style.display = 'none';
      const hudElements = document.querySelectorAll('.hud-top, .hud-bottom, #pause-btn, #revive-modal, #game-over-modal');
      hudElements.forEach(el => (el.style.display = 'none'));

      // Freeze camera controller update
      game.cameraController.update = () => {};
    });
  };

  await setupGame();
  await page.waitForTimeout(400);

  // =========================================================================
  // 1. RAHUL CARICATURE QUALITY & ARTICULATED RIGGING CLOSE-UP
  // =========================================================================
  console.log('\n--- 1. Capturing Rahul Caricature Quality & Rigging ---');
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const targetChunk = game.trackManager.getChunks()[0];
    if (targetChunk) {
      targetChunk.collectibles.forEach(c => (c.group.visible = false));
      targetChunk.obstacles.forEach(o => (o.group.visible = false));
    }

    while (targetChunk.decorativeGroup.children.length > 0) {
      targetChunk.decorativeGroup.remove(targetChunk.decorativeGroup.children[0]);
    }

    const { RahulSatireWorldBuilder } = await import('./src/environment/worlds/rahulverse/RahulSatireWorldBuilder.js');
    const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
    const builder = RahulSatireWorldBuilder.getInstance();
    const director = RahulComedyEventDirector.getInstance();
    director.reset();

    // Build standalone Rahul Caricature on display plinth at (0, 0, -10)
    const displayRahul = builder.buildRahulCaricature(targetChunk.decorativeGroup, 0, 0, -10, 'DEBATE', director);
    displayRahul.rotation.y = Math.PI; // Face the camera
    
    // Enable wink eyelid and sparkle star for signature look
    if (displayRahul.userData.joints) {
      if (displayRahul.userData.joints.winkLid) {
        displayRahul.userData.joints.winkLid.scale.y = 0.1;
      }
      if (displayRahul.userData.joints.sparkleStar) {
        displayRahul.userData.joints.sparkleStar.visible = true;
        displayRahul.userData.joints.sparkleStar.scale.set(1.2, 1.2, 1.2);
      }
      if (displayRahul.userData.joints.armR) {
        displayRahul.userData.joints.armR.rotation.x = -1.2;
        displayRahul.userData.joints.armR.rotation.z = 0.5;
      }
    }

    // Hide player model so it does not overlap
    game.player.mesh.position.set(0, -100, 0);

    // Position camera close up in front of Rahul
    const camera = game.cameraController.camera;
    camera.position.set(0, 1.45, -7.2);
    camera.lookAt(0, 1.25, -10);
    game.worldScene.renderer.render(game.worldScene.scene, camera);
  });

  await page.waitForTimeout(300);
  let buf = await page.screenshot();
  saveScreenshot(buf, 'rahul_p4_character_rahul_close_up.png');
  telemetry.captures.push('rahul_p4_character_rahul_close_up.png');

  // =========================================================================
  // 2. FLAGSHIP A: THE NEVER-ENDING YATRA (4 BEATS)
  // =========================================================================
  console.log('\n--- 2. Capturing Flagship A: The Never-Ending Yatra (4 Beats) ---');

  // Build The Never-Ending Yatra stage in chunk 0
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.getChunks()[0];
    while (chunk.decorativeGroup.children.length > 0) {
      chunk.decorativeGroup.remove(chunk.decorativeGroup.children[0]);
    }

    const { RahulSatireWorldBuilder } = await import('./src/environment/worlds/rahulverse/RahulSatireWorldBuilder.js');
    const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
    const builder = RahulSatireWorldBuilder.getInstance();
    const director = RahulComedyEventDirector.getInstance();
    director.reset();

    // Build District 0 (The Never-Ending Yatra) at -40m
    builder.buildDistrictScenery(chunk.decorativeGroup, 12, 100, 0, 'FULL', -40);

    // Frame Three-Quarter View of the Yatra Procession & Finish Line Arch
    const camera = game.cameraController.camera;
    camera.position.set(-6.5, 3.8, -32);
    camera.lookAt(-14.0, 2.5, -42);
  });

  // Beat 1: March & Procession (cycle = 1.0s)
  await page.evaluate(async () => {
    const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
    const director = RahulComedyEventDirector.getInstance();
    director.neverEndingYatras.forEach((g) => { g.timer = 1.0; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'rahul_p4_flagship_a_yatra_beat1_procession.png');
  telemetry.captures.push('rahul_p4_flagship_a_yatra_beat1_procession.png');

  // Beat 2: Ratchet Flip & Rolling Arch (cycle = 2.8s)
  await page.evaluate(async () => {
    const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
    const director = RahulComedyEventDirector.getInstance();
    director.neverEndingYatras.forEach((g) => { g.timer = 2.8; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'rahul_p4_flagship_a_yatra_beat2_ratchet_flip.png');
  telemetry.captures.push('rahul_p4_flagship_a_yatra_beat2_ratchet_flip.png');

  // Beat 3: Accordion Route Map Unfurl & Double-Take (cycle = 4.2s)
  await page.evaluate(async () => {
    const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
    const director = RahulComedyEventDirector.getInstance();
    director.neverEndingYatras.forEach((g) => { g.timer = 4.2; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'rahul_p4_flagship_a_yatra_beat3_map_doubletake.png');
  telemetry.captures.push('rahul_p4_flagship_a_yatra_beat3_map_doubletake.png');

  // Beat 4: Towel Wipe & Jog Loop Resume (cycle = 5.8s)
  await page.evaluate(async () => {
    const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
    const director = RahulComedyEventDirector.getInstance();
    director.neverEndingYatras.forEach((g) => { g.timer = 5.8; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'rahul_p4_flagship_a_yatra_beat4_towel_jog.png');
  telemetry.captures.push('rahul_p4_flagship_a_yatra_beat4_towel_jog.png');

  // =========================================================================
  // 3. FLAGSHIP B: THE PARLIAMENT HUG AND WINK (4 BEATS)
  // =========================================================================
  console.log('\n--- 3. Capturing Flagship B: The Parliament Hug and Wink (4 Beats) ---');

  // Build Parliament Hug & Wink stage in chunk 0
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.getChunks()[0];
    while (chunk.decorativeGroup.children.length > 0) {
      chunk.decorativeGroup.remove(chunk.decorativeGroup.children[0]);
    }

    const { RahulSatireWorldBuilder } = await import('./src/environment/worlds/rahulverse/RahulSatireWorldBuilder.js');
    const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
    const builder = RahulSatireWorldBuilder.getInstance();
    const director = RahulComedyEventDirector.getInstance();
    director.reset();

    // Build Parliament Hug & Wink Stage at (-8.0, 0.6, -40)
    builder.buildParliamentHugAndWinkStage(chunk.decorativeGroup, -8.0, 0.6, -40, director, -40);

    // Frame camera on the central parliamentary benches
    const camera = game.cameraController.camera;
    camera.position.set(-2.5, 3.2, -32);
    camera.lookAt(-8.0, 2.3, -40);
  });

  // Beat 1: Stride Across Floor (cycle = 0.8s)
  await page.evaluate(async () => {
    const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
    const director = RahulComedyEventDirector.getInstance();
    director.parliamentHugAndWinks.forEach((g) => { g.timer = 0.8; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'rahul_p4_flagship_b_parliament_beat1_stride.png');
  telemetry.captures.push('rahul_p4_flagship_b_parliament_beat1_stride.png');

  // Beat 2: Bear Hug, Spectacles Pop & Pulsing Heart (cycle = 2.2s)
  await page.evaluate(async () => {
    const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
    const director = RahulComedyEventDirector.getInstance();
    director.parliamentHugAndWinks.forEach((g) => { g.timer = 2.2; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'rahul_p4_flagship_b_parliament_beat2_embrace.png');
  telemetry.captures.push('rahul_p4_flagship_b_parliament_beat2_embrace.png');

  // Beat 3: Iconic Wink, Sparkle Star & Cameraman Topple (cycle = 3.8s)
  await page.evaluate(async () => {
    const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
    const director = RahulComedyEventDirector.getInstance();
    director.parliamentHugAndWinks.forEach((g) => { g.timer = 3.8; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'rahul_p4_flagship_b_parliament_beat3_wink_cameraman_fall.png');
  telemetry.captures.push('rahul_p4_flagship_b_parliament_beat3_wink_cameraman_fall.png');

  // Beat 4: Recovery & Laugh Hold (cycle = 5.4s)
  await page.evaluate(async () => {
    const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
    const director = RahulComedyEventDirector.getInstance();
    director.parliamentHugAndWinks.forEach((g) => { g.timer = 5.4; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'rahul_p4_flagship_b_parliament_beat4_recovery.png');
  telemetry.captures.push('rahul_p4_flagship_b_parliament_beat4_recovery.png');

  // =========================================================================
  // 4. FLAGSHIP C: PRESS CONFERENCE PANIC
  // =========================================================================
  console.log('\n--- 4. Capturing Flagship C: Press Conference Panic ---');
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.getChunks()[0];
    while (chunk.decorativeGroup.children.length > 0) {
      chunk.decorativeGroup.remove(chunk.decorativeGroup.children[0]);
    }

    const { RahulSatireWorldBuilder } = await import('./src/environment/worlds/rahulverse/RahulSatireWorldBuilder.js');
    const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
    const builder = RahulSatireWorldBuilder.getInstance();
    const director = RahulComedyEventDirector.getInstance();
    director.reset();

    // Build District 2 (Press Conference Panic) at -40m
    builder.buildDistrictScenery(chunk.decorativeGroup, 12, 100, 2, 'FULL', -40);

    // Frame camera on the press scrum and media flurry
    const camera = game.cameraController.camera;
    camera.position.set(-6.0, 3.5, -30);
    camera.lookAt(-14.0, 2.2, -40);

    director.update(0.016, true);
    game.worldScene.renderer.render(game.worldScene.scene, camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'rahul_p4_flagship_c_press_conference_panic.png');
  telemetry.captures.push('rahul_p4_flagship_c_press_conference_panic.png');

  // =========================================================================
  // 5. FLAGSHIP D: ALLIANCE MUSICAL CHAIRS
  // =========================================================================
  console.log('\n--- 5. Capturing Flagship D: Alliance Musical Chairs ---');
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.getChunks()[0];
    while (chunk.decorativeGroup.children.length > 0) {
      chunk.decorativeGroup.remove(chunk.decorativeGroup.children[0]);
    }

    const { RahulSatireWorldBuilder } = await import('./src/environment/worlds/rahulverse/RahulSatireWorldBuilder.js');
    const { RahulComedyEventDirector } = await import('./src/environment/worlds/rahulverse/RahulComedyEventDirector.js');
    const builder = RahulSatireWorldBuilder.getInstance();
    const director = RahulComedyEventDirector.getInstance();
    director.reset();

    // Build Alliance Chairs Runaway Stage at (-7.4, 0.6, -40)
    builder.buildAllianceChairsRunawayStage(chunk.decorativeGroup, -7.4, 0.6, -40, director, -40);

    // Frame camera on Nitish chair and scampering chairs with legs
    const camera = game.cameraController.camera;
    camera.position.set(-3.0, 3.2, -32);
    camera.lookAt(-7.4, 2.2, -40);

    director.update(0.016, true);
    game.worldScene.renderer.render(game.worldScene.scene, camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'rahul_p4_flagship_d_alliance_musical_chairs.png');
  telemetry.captures.push('rahul_p4_flagship_d_alliance_musical_chairs.png');

  // =========================================================================
  // 6. ACTIVE RUNNER GAMEPLAY IN MOTION
  // =========================================================================
  console.log('\n--- 6. Capturing Active Runner Gameplay in Motion ---');
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    // Re-populate all chunks with realistic gameplay scenery
    const chunks = game.trackManager.getChunks();
    for (let c = 0; c < chunks.length; c++) {
      const chunk = chunks[c];
      while (chunk.decorativeGroup.children.length > 0) {
        chunk.decorativeGroup.remove(chunk.decorativeGroup.children[0]);
      }
      const { RahulSatireWorldBuilder } = await import('./src/environment/worlds/rahulverse/RahulSatireWorldBuilder.js');
      const builder = RahulSatireWorldBuilder.getInstance();
      builder.buildDistrictScenery(chunk.decorativeGroup, 12, 100, c % 6, 'FULL', chunk.group.position.z);
    }

    // Restore player to track center running forward
    game.player.position.set(0, 0, 0);
    game.player.mesh.position.set(0, 0, 0);
    game.player.mesh.rotation.y = 0;
    game.player.speed = 18;
    game.player.model.setPresentationPose(null);
    game.player.model.update(0.016, 18, true, false, false, false, false);

    // Standard third-person action camera
    const camera = game.cameraController.camera;
    camera.position.set(0, 4.2, 7.8);
    camera.lookAt(0, 1.8, -18);
    game.worldScene.renderer.render(game.worldScene.scene, camera);
  });
  await page.waitForTimeout(300);
  buf = await page.screenshot();
  saveScreenshot(buf, 'rahul_p4_active_runner_gameplay.png');
  telemetry.captures.push('rahul_p4_active_runner_gameplay.png');

  // =========================================================================
  // 7. MOBILE PORTRAIT (390x844) VIEWPORT
  // =========================================================================
  console.log('\n--- 7. Capturing Mobile Portrait Viewport (390x844) ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.worldScene.renderer.setSize(390, 844);
    const camera = game.cameraController.camera;
    camera.aspect = 390 / 844;
    camera.updateProjectionMatrix();
    camera.position.set(0, 4.5, 8.5);
    camera.lookAt(0, 1.8, -18);
    game.worldScene.renderer.render(game.worldScene.scene, camera);
  });
  await page.waitForTimeout(300);
  buf = await page.screenshot();
  saveScreenshot(buf, 'rahul_p4_mobile_portrait_390x844.png');
  telemetry.captures.push('rahul_p4_mobile_portrait_390x844.png');

  // =========================================================================
  // 8. TELEMETRY PROFILING (FPS, DRAW CALLS, TRIANGLES, 0 LEAKS)
  // =========================================================================
  console.log('\n--- 8. Profiling Runtime Telemetry ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  const perfData = await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const renderer = game.worldScene.renderer;
    const info = renderer.info;

    // Collect 60-frame FPS sample
    let frameTimes = [];
    let lastTime = performance.now();

    await new Promise((resolve) => {
      let count = 0;
      function sampleFrame() {
        const now = performance.now();
        frameTimes.push(now - lastTime);
        lastTime = now;
        count++;
        if (count >= 60) {
          resolve();
        } else {
          requestAnimationFrame(sampleFrame);
        }
      }
      requestAnimationFrame(sampleFrame);
    });

    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const fps = 1000 / avgFrameTime;

    return {
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      avgFrameTimeMs: parseFloat(avgFrameTime.toFixed(2)),
      estimatedFps: Math.round(fps)
    };
  });

  telemetry.performance = perfData;
  console.log('📊 Telemetry Results:');
  console.log(`  FPS: ~${perfData.estimatedFps}`);
  console.log(`  Avg Frame Time: ${perfData.avgFrameTimeMs}ms`);
  console.log(`  Draw Calls: ${perfData.drawCalls}`);
  console.log(`  Triangles: ${perfData.triangles}`);
  console.log(`  Geometries in Memory: ${perfData.geometries}`);
  console.log(`  Textures in Memory: ${perfData.textures}`);

  // Save telemetry report
  const pBrainReport = path.join(BRAIN_ARTIFACT_DIR, 'rahul_p4_telemetry_report.json');
  const pLocalReport = path.join(LOCAL_ARTIFACT_DIR, 'rahul_p4_telemetry_report.json');
  fs.writeFileSync(pBrainReport, JSON.stringify(telemetry, null, 2));
  fs.writeFileSync(pLocalReport, JSON.stringify(telemetry, null, 2));
  console.log('✅ Saved rahul_p4_telemetry_report.json');

  await browser.close();
  console.log('\n🎉 Phase 4 Rahulverse Visual Forensics Capture Completed Successfully!');
}

main().catch((err) => {
  console.error('❌ Capture script failed:', err);
  process.exit(1);
});
