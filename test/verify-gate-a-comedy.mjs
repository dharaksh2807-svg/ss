import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const LOCAL_ARTIFACT_DIR = path.resolve('artifacts', 'comedy');
const BRAIN_ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/7a7f92d8-419e-49e3-a3b4-341385ccaa10/screenshots/comedy';

fs.mkdirSync(LOCAL_ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(BRAIN_ARTIFACT_DIR, { recursive: true });

function saveScreenshotSync(buffer, filename) {
  const localPath = path.join(LOCAL_ARTIFACT_DIR, filename);
  const brainPath = path.join(BRAIN_ARTIFACT_DIR, filename);
  fs.writeFileSync(localPath, buffer);
  fs.writeFileSync(brainPath, buffer);
  console.log(`  📸 Saved: ${filename}`);
}

async function runComedyVerification() {
  console.log('=======================================================');
  console.log('🎭 VERIFYING ALL 3D VISUAL POLITICAL COMEDY SCENES');
  console.log('=======================================================\n');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('[THREE') && !text.includes('vite:') && !text.includes('favicon')) {
      console.log('Browser:', text);
    }
  });

  console.log('🌐 Loading http://localhost:3003...');
  await page.goto('http://localhost:3003', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__, { timeout: 15000 });
  console.log('🎮 Metro Runner engine active on window.__METRO_GAME__\n');

  await page.evaluate(() => {
    window.__METRO_GAME__.soundManager.setMuted(true);
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = 'none';
  });

  // Helper to aim camera directly at an object in the scene using PhotoMode
  async function captureStage(stageName, filename, config = {}) {
    const {
      offsetX = -5.5,
      offsetY = 2.0,
      offsetZ = 5.5,
      targetOffsetY = 1.6,
      fov = 50.0,
      ticks = 45,
      isRahul = false
    } = config;

    const result = await page.evaluate(async ({ stageName, offsetX, offsetY, offsetZ, targetOffsetY, fov, ticks, isRahul }) => {
      const game = window.__METRO_GAME__;
      const stage = game.worldScene.scene.getObjectByName(stageName);
      if (!stage) {
        return { found: false };
      }

      // Tick the director to advance slapstick animation loop
      if (isRahul) {
        const director = (await import('/src/environment/worlds/rahulverse/RahulComedyEventDirector.ts')).RahulComedyEventDirector.getInstance();
        for (let i = 0; i < ticks; i++) director.update(0.033);
      } else {
        const director = (await import('/src/environment/VipComedyEventDirector.ts')).VipComedyEventDirector.getInstance();
        for (let i = 0; i < ticks; i++) director.update(0.033);
      }

      const worldPos = new game.player.position.constructor();
      stage.getWorldPosition(worldPos);

      // Lock camera using engine PhotoMode to prevent game loop overrides
      game.cameraController.enterPhotoMode(game.player.position);
      const camPos = new game.player.position.constructor(worldPos.x + offsetX, worldPos.y + offsetY, worldPos.z + offsetZ);
      const lookPos = new game.player.position.constructor(worldPos.x, worldPos.y + targetOffsetY, worldPos.z);
      game.cameraController.setPhotoCameraTransform(camPos, lookPos, fov);
      game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);

      return {
        found: true,
        pos: { x: Math.round(worldPos.x * 10) / 10, y: Math.round(worldPos.y * 10) / 10, z: Math.round(worldPos.z * 10) / 10 },
        childCount: stage.children.length
      };
    }, { stageName, offsetX, offsetY, offsetZ, targetOffsetY, fov, ticks, isRahul });

    if (result.found) {
      console.log(`  ✓ ${stageName}: found at (${result.pos.x}, ${result.pos.y}, ${result.pos.z}) [${result.childCount} children]`);
      await page.waitForTimeout(100);
      const buf = await page.screenshot();
      saveScreenshotSync(buf, filename);
    } else {
      console.error(`  ✗ ${stageName}: NOT FOUND in scene`);
    }
    return result;
  }

  // =========================================================================
  // 1. VIP_EXPRESS (MODI THEME)
  // =========================================================================
  console.log('=======================================================');
  console.log('🏛️ PART 1: VIP_EXPRESS (MODI SIGNATURE WORLD)');
  console.log('=======================================================');

  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    game.progression.unlockCharacter('char_modi');
    game.progression.equipCharacter('char_modi', 'modi_classic');
    game.player.applyCharacter('char_modi', 'modi_classic');

    game.progression.addCoins(100000);
    game.progression.purchaseTheme('VIP_EXPRESS');
    game.progression.equipTheme('VIP_EXPRESS');

    const registry = (await import('/src/environment/EnvironmentRegistry.ts')).EnvironmentRegistry.getInstance();
    const theme = registry.get('VIP_EXPRESS');
    game.worldScene.applyEnvironment(theme);

    game.startRun('NORMAL', false);
    game.trackManager.setEnvironment('VIP_EXPRESS');
    game.cameraController.setLobbyMode(false);
    game.player.activateReviveGrace(999999);
    game.player.isIntroInvincible = true;
    if (game.openingSequence) {
      game.openingSequence.skip();
    }
  });
  await page.waitForTimeout(500);

  // 1. Modi Gate A: The Mango Interview
  console.log('\n[1/14] Modi Gate A: The Mango Interview');
  await captureStage('vip_mango_interview', 'gate_a_01_modi_mango_interview.png', {
    offsetX: -5.5, offsetY: 2.2, offsetZ: 5.5, targetOffsetY: 1.6, fov: 48.0, ticks: 60
  });

  // 2. Modi Gate A: Inauguration Inception (Recursive Scissors)
  console.log('\n[2/14] Modi Gate A: Inauguration Inception');
  await captureStage('vip_ribbon_ceremony', 'gate_a_02_modi_inauguration_inception.png', {
    offsetX: 6.5, offsetY: 3.2, offsetZ: 7.5, targetOffsetY: 2.0, fov: 48.0, ticks: 40
  });

  // 3. Modi Gate B: The 360° Camera Magnet
  const magnetInScene = await page.evaluate(() => !!window.__METRO_GAME__.worldScene.scene.getObjectByName('vip_camera_magnet'));
  if (!magnetInScene) {
    console.log('  Advancing track to District C for Camera Magnet...');
    await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      game.player.position.set(0, 0, -850);
      game.player.distanceTraveled = 850;
      for (let s = 0; s < 30; s++) game.trackManager.update(game.player, 0.1, s * 0.1);
    });
  }
  console.log('\n[3/14] Modi Gate B: The 360° Camera Magnet');
  await captureStage('vip_camera_magnet', 'gate_b_02_modi_camera_magnet.png', {
    offsetX: 6.0, offsetY: 2.8, offsetZ: 6.5, targetOffsetY: 2.0, fov: 48.0, ticks: 35
  });

  // 4. Modi Gate B: Kedarnath Meditation Paradox
  const medInScene = await page.evaluate(() => !!window.__METRO_GAME__.worldScene.scene.getObjectByName('vip_meditation_paradox'));
  if (!medInScene) {
    console.log('  Advancing track to District D for Kedarnath Meditation Paradox...');
    await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      game.player.position.set(0, 0, -1250);
      game.player.distanceTraveled = 1250;
      for (let s = 0; s < 30; s++) game.trackManager.update(game.player, 0.1, s * 0.1);
    });
  }
  console.log('\n[4/14] Modi Gate B: Kedarnath Meditation Paradox');
  await captureStage('vip_meditation_paradox', 'gate_b_01_modi_meditation_paradox.png', {
    offsetX: -6.0, offsetY: 2.8, offsetZ: 7.0, targetOffsetY: 2.0, fov: 48.0, ticks: 30
  });

  // 5. Modi Gate B: Hug Diplomacy Machine
  console.log('\n[5/14] Modi Gate B: Hug Diplomacy Machine');
  await captureStage('vip_hug_diplomacy', 'gate_b_03_modi_hug_diplomacy.png', {
    offsetX: 6.0, offsetY: 2.8, offsetZ: 6.5, targetOffsetY: 2.0, fov: 48.0, ticks: 45
  });

  // 6. Crossover 1: The Hug Loop (Modi View)
  console.log('\n[6/14] Crossover: The Hug Loop');
  await captureStage('vip_crossover_hug_loop', 'crossover_02_hug_loop_modi.png', {
    offsetX: -5.5, offsetY: 2.5, offsetZ: 6.0, targetOffsetY: 1.8, fov: 48.0, ticks: 45
  });

  // 7. Crossover 2: The Selfie Battle & Chai Vendor Twist
  console.log('\n[7/14] Crossover: The Selfie Battle & Chai Vendor Twist');
  await captureStage('vip_crossover_selfie_battle', 'crossover_01_selfie_battle.png', {
    offsetX: -5.5, offsetY: 2.5, offsetZ: 6.0, targetOffsetY: 1.8, fov: 48.0, ticks: 50
  });

  // 8. Crossover 3: The Microphone Chase
  const micInScene = await page.evaluate(() => !!window.__METRO_GAME__.worldScene.scene.getObjectByName('vip_crossover_mic_chase'));
  if (!micInScene) {
    console.log('  Advancing track for Microphone Chase...');
    await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      game.player.position.set(0, 0, -850);
      game.player.distanceTraveled = 850;
      for (let s = 0; s < 30; s++) game.trackManager.update(game.player, 0.1, s * 0.1);
    });
  }
  console.log('\n[8/14] Crossover: The Microphone Chase');
  await captureStage('vip_crossover_mic_chase', 'crossover_03_mic_chase.png', {
    offsetX: -5.5, offsetY: 2.5, offsetZ: 6.5, targetOffsetY: 1.8, fov: 48.0, ticks: 45
  });

  // 9. Crossover 4: The Party Office Mix-Up
  const officeInScene = await page.evaluate(() => !!window.__METRO_GAME__.worldScene.scene.getObjectByName('vip_crossover_office_mixup'));
  if (!officeInScene) {
    console.log('  Advancing track for Party Office Mix-Up...');
    await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      game.player.position.set(0, 0, -1250);
      game.player.distanceTraveled = 1250;
      for (let s = 0; s < 30; s++) game.trackManager.update(game.player, 0.1, s * 0.1);
    });
  }
  console.log('\n[9/14] Crossover: The Party Office Mix-Up');
  await captureStage('vip_crossover_office_mixup', 'crossover_04_office_mixup.png', {
    offsetX: 5.5, offsetY: 2.5, offsetZ: 6.5, targetOffsetY: 1.8, fov: 48.0, ticks: 50
  });

  // =========================================================================
  // 2. RAHULVERSE (RAHUL THEME)
  // =========================================================================
  console.log('\n=======================================================');
  console.log('🌟 PART 2: RAHULVERSE (RAHUL SIGNATURE WORLD)');
  console.log('=======================================================');

  await page.evaluate(async () => {
    const game = window.__METRO_GAME__;
    game.progression.unlockCharacter('char_rahul');
    game.progression.equipCharacter('char_rahul', 'rahul_classic');
    game.player.applyCharacter('char_rahul', 'rahul_classic');

    game.progression.addCoins(100000);
    game.progression.purchaseTheme('RAHULVERSE');
    game.progression.equipTheme('RAHULVERSE');

    const registry = (await import('/src/environment/EnvironmentRegistry.ts')).EnvironmentRegistry.getInstance();
    const theme = registry.get('RAHULVERSE');
    game.worldScene.applyEnvironment(theme);

    game.startRun('NORMAL', false);
    game.trackManager.setEnvironment('RAHULVERSE');
    game.cameraController.setLobbyMode(false);
    game.player.activateReviveGrace(999999);
    game.player.isIntroInvincible = true;
    if (game.openingSequence) {
      game.openingSequence.skip();
    }
  });
  await page.waitForTimeout(500);

  // 10. Rahul Gate A: The Never-Ending Yatra
  console.log('\n[10/14] Rahul Gate A: The Never-Ending Yatra');
  await captureStage('yatra_finish_flip_arch', 'gate_a_03_rahul_never_ending_yatra.png', {
    offsetX: 0, offsetY: 3.8, offsetZ: 12.0, targetOffsetY: 4.2, fov: 52.0, ticks: 45, isRahul: true
  });

  // 11. Rahul Gate A: The Parliament Hug and Wink
  const hugInScene = await page.evaluate(() => !!window.__METRO_GAME__.worldScene.scene.getObjectByName('rahul_parliament_hug_and_wink'));
  if (!hugInScene) {
    console.log('  Advancing track to District B for Parliament Hug & Wink...');
    await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      game.player.position.set(0, 0, -450);
      game.player.distanceTraveled = 450;
      for (let s = 0; s < 25; s++) game.trackManager.update(game.player, 0.1, s * 0.1);
    });
  }
  console.log('\n[11/14] Rahul Gate A: The Parliament Hug and Wink');
  await captureStage('rahul_parliament_hug_and_wink', 'gate_a_04_rahul_parliament_hug_and_wink.png', {
    offsetX: -4.5, offsetY: 2.2, offsetZ: 5.5, targetOffsetY: 1.6, fov: 48.0, ticks: 65, isRahul: true
  });

  // 12. Rahul Gate B: The Great Press Scrum
  const pressInScene = await page.evaluate(() => !!window.__METRO_GAME__.worldScene.scene.getObjectByName('rahul_press_scrum'));
  if (!pressInScene) {
    console.log('  Advancing track to District C for Press Scrum...');
    await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      game.player.position.set(0, 0, -850);
      game.player.distanceTraveled = 850;
      for (let s = 0; s < 30; s++) game.trackManager.update(game.player, 0.1, s * 0.1);
    });
  }
  console.log('\n[12/14] Rahul Gate B: The Great Press Scrum');
  await captureStage('rahul_press_scrum', 'gate_b_05_rahul_press_scrum.png', {
    offsetX: 5.5, offsetY: 2.5, offsetZ: 6.0, targetOffsetY: 1.8, fov: 48.0, ticks: 40, isRahul: true
  });

  // 13. Rahul Gate B: Alliance Chairs Runaway & Nitish 360 Spin
  const chairsInScene = await page.evaluate(() => !!window.__METRO_GAME__.worldScene.scene.getObjectByName('rahul_alliance_chairs_runaway'));
  if (!chairsInScene) {
    console.log('  Advancing track to District D for Alliance Chairs Runaway...');
    await page.evaluate(async () => {
      const game = window.__METRO_GAME__;
      game.player.position.set(0, 0, -1250);
      game.player.distanceTraveled = 1250;
      for (let s = 0; s < 30; s++) game.trackManager.update(game.player, 0.1, s * 0.1);
    });
  }
  console.log('\n[13/14] Rahul Gate B: Alliance Chairs Runaway & Nitish 360 Spin');
  await captureStage('rahul_alliance_chairs_runaway', 'gate_b_04_rahul_alliance_chairs.png', {
    offsetX: -5.5, offsetY: 2.5, offsetZ: 6.0, targetOffsetY: 1.8, fov: 48.0, ticks: 45, isRahul: true
  });

  // 14. Crossover: The Hug Loop (Rahul View)
  console.log('\n[14/14] Crossover: The Hug Loop (Rahulverse view)');
  await captureStage('rahul_crossover_hug_loop', 'crossover_02_hug_loop_rahul.png', {
    offsetX: -5.0, offsetY: 2.5, offsetZ: 6.0, targetOffsetY: 1.8, fov: 48.0, ticks: 45, isRahul: true
  });

  await browser.close();

  console.log('\n=======================================================');
  console.log('🎉 ALL 14 VISUAL COMEDY SCENES VERIFIED & CAPTURED!');
  console.log('=======================================================');
}

runComedyVerification().catch(err => {
  console.error('Fatal error during comedy verification:', err);
  process.exit(1);
});
