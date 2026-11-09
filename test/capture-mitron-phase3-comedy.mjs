import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BRAIN_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/e73cdf04-6547-4661-b725-4f23c723880f/evidence';
const LOCAL_ARTIFACT_DIR = path.resolve('artifacts', 'phase3-mitron-captures');

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
  console.log('🚀 Launching Google Chrome for Metro Runner 3D Phase 3 Mitron Express Cinematic Comedy Captures...');
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
    phase: 'Phase 3: Mitron Express Cinematic Character Comedy',
    fpsProfiles: [],
    captures: []
  };

  // Helper to setup camera and pause
  const setupGame = async () => {
    return await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      game.progression.unlockCharacter('char_modi');
      game.progression.equipCharacter('char_modi', 'modi_classic');
      game.player.applyCharacter('char_modi', 'modi_classic');

      const { EnvironmentRegistry } = await import('./src/environment/EnvironmentRegistry.js');
      const theme = EnvironmentRegistry.getInstance().get('VIP_EXPRESS');
      game.trackManager.setEnvironment('VIP_EXPRESS');
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
  // 1. MODI CARICATURE QUALITY & ARTICULATED RIGGING CLOSE-UP
  // =========================================================================
  console.log('\n--- 1. Capturing Modi Caricature Quality & Rigging ---');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const targetChunk = game.trackManager.getChunks()[0];
    if (targetChunk) {
      targetChunk.collectibles.forEach(c => (c.group.visible = false));
      targetChunk.obstacles.forEach(o => (o.group.visible = false));
    }

    game.player.position.set(0, 0, -10);
    game.player.mesh.position.set(0, 0, -10);
    game.player.mesh.rotation.y = Math.PI; // Face the camera
    game.player.model.setPresentationPose('VICTORY');
    game.player.model.update(0.016, 0, false, false, false, false, false);

    // Position camera close up in front of Modi
    const camera = game.cameraController.camera;
    camera.position.set(0, 1.45, -7.2);
    camera.lookAt(0, 1.25, -10);
    game.worldScene.renderer.render(game.worldScene.scene, camera);
  });

  await page.waitForTimeout(300);
  let buf = await page.screenshot();
  saveScreenshot(buf, 'mitron_p3_character_modi_close_up.png');
  telemetry.captures.push('mitron_p3_character_modi_close_up.png');

  // =========================================================================
  // 2. PRIORITY A FLAGSHIP GAG: THE MANGO INTERVIEW (4 BEATS)
  // =========================================================================
  console.log('\n--- 2. Capturing Flagship A: The Mango Interview (4 Beats) ---');

  // Build Mango Interview stage in chunk 0
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.getChunks()[0];
    while (chunk.decorativeGroup.children.length > 0) {
      chunk.decorativeGroup.remove(chunk.decorativeGroup.children[0]);
    }

    const { VipSatireWorldBuilder } = await import('./src/environment/VipSatireWorldBuilder.js');
    const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
    const builder = VipSatireWorldBuilder.getInstance();
    const director = VipComedyEventDirector.getInstance();
    director.reset();

    // Build Mango Interview Stage at (11.2, 0.6, -40)
    builder.buildMangoInterviewStage(chunk.decorativeGroup, 11.2, 0.6, -40, director, -40);

    // Frame Three-Quarter View of the Interview Terrace
    const camera = game.cameraController.camera;
    camera.position.set(5.5, 3.2, -32);
    camera.lookAt(11.2, 2.5, -40);
  });

  // Beat 1: Setup (cycle = 1.0s)
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
    const director = VipComedyEventDirector.getInstance();
    // Advance director to cycle = 1.0s (Serious interview)
    director.mangoInterviewList.forEach((g) => { g.timer = 1.0; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'mitron_p3_flagship_a_mango_beat1_setup.png');
  telemetry.captures.push('mitron_p3_flagship_a_mango_beat1_setup.png');

  // Beat 2: Reveal (cycle = 3.0s)
  await page.evaluate(async () => {
    const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
    const director = VipComedyEventDirector.getInstance();
    director.mangoInterviewList.forEach((g) => { g.timer = 3.0; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'mitron_p3_flagship_a_mango_beat2_reveal.png');
  telemetry.captures.push('mitron_p3_flagship_a_mango_beat2_reveal.png');

  // Beat 3: Superstar & Shock (cycle = 5.0s)
  await page.evaluate(async () => {
    const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
    const director = VipComedyEventDirector.getInstance();
    director.mangoInterviewList.forEach((g) => { g.timer = 5.0; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'mitron_p3_flagship_a_mango_beat3_superstar.png');
  telemetry.captures.push('mitron_p3_flagship_a_mango_beat3_superstar.png');

  // Beat 4: Photo Scrum Dogpile (cycle = 7.0s)
  await page.evaluate(async () => {
    const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
    const director = VipComedyEventDirector.getInstance();
    director.mangoInterviewList.forEach((g) => { g.timer = 7.0; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'mitron_p3_flagship_a_mango_beat4_scrum.png');
  telemetry.captures.push('mitron_p3_flagship_a_mango_beat4_scrum.png');

  // =========================================================================
  // 3. PRIORITY B FLAGSHIP GAG: INAUGURATION INFINITY (4 BEATS)
  // =========================================================================
  console.log('\n--- 3. Capturing Flagship B: Inauguration Infinity (4 Beats) ---');

  // Build Inauguration Infinity in chunk 0
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.getChunks()[0];
    while (chunk.decorativeGroup.children.length > 0) {
      chunk.decorativeGroup.remove(chunk.decorativeGroup.children[0]);
    }

    const { VipSatireWorldBuilder } = await import('./src/environment/VipSatireWorldBuilder.js');
    const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
    const builder = VipSatireWorldBuilder.getInstance();
    builder.buildDistrictScenery(chunk.decorativeGroup, 12, 100, 2, 'FULL', -80);

    // Frame camera on ribbon ceremony dais at X = -16.5m, Z = -40m
    const camera = game.cameraController.camera;
    camera.position.set(-10.0, 4.0, -32);
    camera.lookAt(-16.5, 3.2, -40);
  });

  // Beat 1: Setup (cycle = 0.8s)
  await page.evaluate(async () => {
    const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
    const director = VipComedyEventDirector.getInstance();
    director.recursiveScissorsList.forEach((g) => { g.timer = 0.8; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'mitron_p3_flagship_b_inauguration_beat1_setup.png');
  telemetry.captures.push('mitron_p3_flagship_b_inauguration_beat1_setup.png');

  // Beat 2: Escalation / Crane Descends (cycle = 2.6s)
  await page.evaluate(async () => {
    const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
    const director = VipComedyEventDirector.getInstance();
    director.recursiveScissorsList.forEach((g) => { g.timer = 2.6; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'mitron_p3_flagship_b_inauguration_beat2_reveal.png');
  telemetry.captures.push('mitron_p3_flagship_b_inauguration_beat2_reveal.png');

  // Beat 3: Confetti Explosion & Tiny Chai Cup (cycle = 4.5s)
  await page.evaluate(async () => {
    const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
    const director = VipComedyEventDirector.getInstance();
    director.recursiveScissorsList.forEach((g) => { g.timer = 4.5; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'mitron_p3_flagship_b_inauguration_beat3_confetti_chai.png');
  telemetry.captures.push('mitron_p3_flagship_b_inauguration_beat3_confetti_chai.png');

  // Beat 4: Reset & Reaction (cycle = 6.2s)
  await page.evaluate(async () => {
    const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
    const director = VipComedyEventDirector.getInstance();
    director.recursiveScissorsList.forEach((g) => { g.timer = 6.2; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'mitron_p3_flagship_b_inauguration_beat4_reset.png');
  telemetry.captures.push('mitron_p3_flagship_b_inauguration_beat4_reset.png');

  // =========================================================================
  // 4. PRIORITY C FLAGSHIP GAG: ROADSHOW CAMERA CHAOS (4 BEATS)
  // =========================================================================
  console.log('\n--- 4. Capturing Flagship C: Roadshow Camera Chaos (4 Beats) ---');

  // Build Photography Chaos stage in chunk 0
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.getChunks()[0];
    while (chunk.decorativeGroup.children.length > 0) {
      chunk.decorativeGroup.remove(chunk.decorativeGroup.children[0]);
    }

    const { VipSatireWorldBuilder } = await import('./src/environment/VipSatireWorldBuilder.js');
    const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
    const builder = VipSatireWorldBuilder.getInstance();
    const director = VipComedyEventDirector.getInstance();
    director.reset();

    // Build stage at (14.8, 0.3, -22)
    builder.buildPhotographyChaosStage(chunk.decorativeGroup, 14.8, 0.3, -22, director, -22);

    // Frame camera on the photo podium
    const camera = game.cameraController.camera;
    camera.position.set(9.2, 3.5, -15);
    camera.lookAt(14.8, 2.4, -22);
  });

  // Beat 1: Safe Hover & VIP pose (cycle = 1.0s)
  await page.evaluate(async () => {
    const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
    const director = VipComedyEventDirector.getInstance();
    director.photographyChaosList.forEach((g) => { g.timer = 1.0; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'mitron_p3_flagship_c_roadshow_beat1_float.png');
  telemetry.captures.push('mitron_p3_flagship_c_roadshow_beat1_float.png');

  // Beat 2: Drone Festoon Tangle (cycle = 3.0s)
  await page.evaluate(async () => {
    const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
    const director = VipComedyEventDirector.getInstance();
    director.photographyChaosList.forEach((g) => { g.timer = 3.0; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'mitron_p3_flagship_c_roadshow_beat2_drone_tangle.png');
  telemetry.captures.push('mitron_p3_flagship_c_roadshow_beat2_drone_tangle.png');

  // Beat 3: Paparazzi Collision & Flashes (cycle = 5.0s)
  await page.evaluate(async () => {
    const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
    const director = VipComedyEventDirector.getInstance();
    director.photographyChaosList.forEach((g) => { g.timer = 5.0; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'mitron_p3_flagship_c_roadshow_beat3_paparazzi_clash.png');
  telemetry.captures.push('mitron_p3_flagship_c_roadshow_beat3_paparazzi_clash.png');

  // Beat 4: Dizzy Wobble & Recovery (cycle = 7.0s)
  await page.evaluate(async () => {
    const { VipComedyEventDirector } = await import('./src/environment/VipComedyEventDirector.js');
    const director = VipComedyEventDirector.getInstance();
    director.photographyChaosList.forEach((g) => { g.timer = 7.0; });
    director.update(0.001, true);
    window.__METRO_GAME__.worldScene.renderer.render(window.__METRO_GAME__.worldScene.scene, window.__METRO_GAME__.cameraController.camera);
  });
  await page.waitForTimeout(200);
  buf = await page.screenshot();
  saveScreenshot(buf, 'mitron_p3_flagship_c_roadshow_beat4_dizzy_wobble.png');
  telemetry.captures.push('mitron_p3_flagship_c_roadshow_beat4_dizzy_wobble.png');

  // =========================================================================
  // 5. THIRD-PERSON RUNNER PERSPECTIVE DURING ACTIVE GAMEPLAY
  // =========================================================================
  console.log('\n--- 5. Capturing Third-Person Runner Perspective ---');
  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    const { EnvironmentRegistry } = await import('./src/environment/EnvironmentRegistry.js');
    const theme = EnvironmentRegistry.getInstance().get('VIP_EXPRESS');
    game.trackManager.setEnvironment('VIP_EXPRESS');
    game.worldScene.applyEnvironment(theme);

    game.startRun('NORMAL');
    if (game.openingSequence) {
      game.openingSequence.skip();
    }
    game.player.speed = 18.0; // Active run speed
    game.player.activateReviveGrace(999999);
    game.player.isIntroInvincible = true;

    // Normal third-person runner camera position
    const camera = game.cameraController.camera;
    camera.position.set(0, 3.2, 6.2);
    camera.lookAt(0, 1.8, -25);
  });

  await page.waitForTimeout(500);
  buf = await page.screenshot();
  saveScreenshot(buf, 'mitron_p3_active_runner_gameplay.png');
  telemetry.captures.push('mitron_p3_active_runner_gameplay.png');

  // =========================================================================
  // 6. MOBILE PORTRAIT VIEW (390 x 844)
  // =========================================================================
  console.log('\n--- 6. Capturing Mobile Portrait View (390x844) ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const camera = game.cameraController.camera;
    camera.position.set(0, 3.4, 7.0);
    camera.lookAt(0, 1.8, -25);
  });
  await page.waitForTimeout(300);
  buf = await page.screenshot();
  saveScreenshot(buf, 'mitron_p3_mobile_portrait_390x844.png');
  telemetry.captures.push('mitron_p3_mobile_portrait_390x844.png');

  // =========================================================================
  // 7. PERFORMANCE & DRAW CALL TELEMETRY
  // =========================================================================
  console.log('\n--- 7. Collecting Performance Telemetry ---');
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
      fps: Math.round(fps),
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures
    };
  });

  telemetry.performance = perfData;
  console.log(`  Performance: ${perfData.fps} FPS, ${perfData.drawCalls} draw calls, ${perfData.triangles} triangles, ${perfData.geometries} geometries, ${perfData.textures} textures`);

  const telemetryPath = path.join(BRAIN_ARTIFACT_DIR, 'mitron_p3_telemetry_report.json');
  fs.writeFileSync(telemetryPath, JSON.stringify(telemetry, null, 2));
  console.log(`  📊 Telemetry written to ${telemetryPath}`);

  await browser.close();
  console.log('\n✨ All Phase 3 Mitron Express cinematic character comedy captures successfully created!\n');
}

main().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
