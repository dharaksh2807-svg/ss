import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/2f350341-c53b-4c07-92cd-b647a661dc87';

async function captureLowHurdleAcceptance() {
  console.log('📸 Launching Chrome to capture Low Hurdle (LOW_BARRIER) Acceptance Showcase...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  // Start run and enter normal gameplay chase camera mode
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    document.getElementById('start-screen')?.classList.add('hidden');
    document.getElementById('hud')?.classList.remove('hidden');
    game.startRun();
    game.openingSequence.skip();
    game.cameraController.setLobbyMode(false);
    game.cameraController.finishIntro(game.player.position);
    game.pause();
    document.getElementById('pause-modal')?.classList.add('hidden');
  });
  await page.waitForTimeout(600);

  // -------------------------------------------------------------
  // SHOT 1: Long Approach Distance (~35m ahead)
  // -------------------------------------------------------------
  console.log('Capturing Shot 1: Long Approach Distance (~35m ahead)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.chunks[0];

    const pattern = {
      name: 'ACCEPTANCE_LONG_APPROACH',
      difficulty: 'INTERMEDIATE',
      obstacles: [
        { type: 'LOW_BARRIER', lane: 0, zOffset: 35.0, variant: 0 }
      ],
      collectibles: []
    };

    chunk.populate(pattern, 0, game.trackManager.envManager.getTheme('MODERN_METRO'), false);

    game.player.position.set(0, 0, 0);
    game.player.state = 'RUN';
    game.player.isJumping = false;
    game.player.isSliding = false;
    game.player.mesh.position.copy(game.player.position);

    game.cameraController.finishIntro(game.player.position);
    game.cameraController.update(game.player.position, 0.016, 0, 18, 0.85, false);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'hurdle_acceptance_1_long_approach.png') });

  // -------------------------------------------------------------
  // SHOT 2: Medium Distance (~18m ahead)
  // -------------------------------------------------------------
  console.log('Capturing Shot 2: Medium Distance (~18m ahead)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.chunks[0];

    const pattern = {
      name: 'ACCEPTANCE_MEDIUM_DISTANCE',
      difficulty: 'INTERMEDIATE',
      obstacles: [
        { type: 'LOW_BARRIER', lane: 0, zOffset: 18.0, variant: 0 }
      ],
      collectibles: []
    };

    chunk.populate(pattern, 0, game.trackManager.envManager.getTheme('MODERN_METRO'), false);

    game.player.position.set(0, 0, 0);
    game.player.state = 'RUN';
    game.player.isJumping = false;
    game.player.isSliding = false;
    game.player.mesh.position.copy(game.player.position);

    game.cameraController.finishIntro(game.player.position);
    game.cameraController.update(game.player.position, 0.016, 0, 18, 0.85, false);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'hurdle_acceptance_2_medium_distance.png') });

  // -------------------------------------------------------------
  // SHOT 3: Just Before The Jump (~6m ahead)
  // -------------------------------------------------------------
  console.log('Capturing Shot 3: Just Before The Jump (~6m ahead)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.chunks[0];

    const pattern = {
      name: 'ACCEPTANCE_PRE_JUMP',
      difficulty: 'INTERMEDIATE',
      obstacles: [
        { type: 'LOW_BARRIER', lane: 0, zOffset: 6.0, variant: 0 }
      ],
      collectibles: []
    };

    chunk.populate(pattern, 0, game.trackManager.envManager.getTheme('MODERN_METRO'), false);

    game.player.position.set(0, 0, 0);
    game.player.state = 'RUN';
    game.player.isJumping = false;
    game.player.isSliding = false;
    game.player.mesh.position.copy(game.player.position);

    game.cameraController.finishIntro(game.player.position);
    game.cameraController.update(game.player.position, 0.016, 0, 18, 0.85, false);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'hurdle_acceptance_3_pre_jump.png') });

  // -------------------------------------------------------------
  // SHOT 4: During A Successful Jump (Airborne Over Hurdle)
  // -------------------------------------------------------------
  console.log('Capturing Shot 4: During A Successful Jump (Airborne Over Hurdle)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.chunks[0];

    const pattern = {
      name: 'ACCEPTANCE_AIRBORNE_JUMP',
      difficulty: 'INTERMEDIATE',
      obstacles: [
        { type: 'LOW_BARRIER', lane: 0, zOffset: 6.0, variant: 0 }
      ],
      collectibles: []
    };

    chunk.populate(pattern, 0, game.trackManager.envManager.getTheme('MODERN_METRO'), false);

    // Runner in mid-jump directly at/over the hurdle
    game.player.position.set(0, 2.20, -5.5);
    game.player.state = 'JUMP';
    game.player.isJumping = true;
    game.player.isSliding = false;
    game.player.verticalVelocity = 3.2;
    game.player.mesh.position.copy(game.player.position);

    game.cameraController.finishIntro(game.player.position);
    game.cameraController.update(game.player.position, 0.016, 0, 18, 0.85, false);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'hurdle_acceptance_4_airborne_jump.png') });

  // -------------------------------------------------------------
  // SHOT 5: In Darker Environment (Underground Tunnel Section)
  // -------------------------------------------------------------
  console.log('Capturing Shot 5: In Darker Environment (Underground Tunnel Section)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.chunks[0];

    const pattern = {
      name: 'ACCEPTANCE_DARK_TUNNEL',
      difficulty: 'INTERMEDIATE',
      isTunnel: true,
      obstacles: [
        { type: 'LOW_BARRIER', lane: 0, zOffset: 12.0, variant: 0 }
      ],
      collectibles: []
    };

    const undergroundTheme = game.trackManager.envManager.getTheme('UNDERGROUND_METRO');
    chunk.populate(pattern, 0, undergroundTheme, false);

    game.player.position.set(0, 0, 0);
    game.player.state = 'RUN';
    game.player.isJumping = false;
    game.player.isSliding = false;
    game.player.mesh.position.copy(game.player.position);

    game.cameraController.finishIntro(game.player.position);
    game.cameraController.update(game.player.position, 0.016, 0, 18, 0.85, false);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'hurdle_acceptance_5_dark_tunnel.png') });

  // -------------------------------------------------------------
  // SHOT 6: All Three Hurdle Variants Side-By-Side (0, 1, 2)
  // -------------------------------------------------------------
  console.log('Capturing Shot 6: All Three Hurdle Variants Side-By-Side (0, 1, 2)...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.chunks[0];

    const pattern = {
      name: 'ACCEPTANCE_ALL_THREE_VARIANTS',
      difficulty: 'INTERMEDIATE',
      obstacles: [
        { type: 'LOW_BARRIER', lane: -1, zOffset: 14.0, variant: 0 },
        { type: 'LOW_BARRIER', lane: 0, zOffset: 14.0, variant: 1 },
        { type: 'LOW_BARRIER', lane: 1, zOffset: 14.0, variant: 2 }
      ],
      collectibles: []
    };

    chunk.populate(pattern, 0, game.trackManager.envManager.getTheme('MODERN_METRO'), false);

    game.player.position.set(0, 0, 0);
    game.player.state = 'RUN';
    game.player.isJumping = false;
    game.player.isSliding = false;
    game.player.mesh.position.copy(game.player.position);

    game.cameraController.finishIntro(game.player.position);
    game.cameraController.update(game.player.position, 0.016, 0, 18, 0.85, false);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'hurdle_acceptance_6_all_three_variants.png') });

  await browser.close();
  console.log('🎉 All acceptance screenshots captured successfully!');
}

captureLowHurdleAcceptance().catch(err => {
  console.error('Error capturing acceptance screenshots:', err);
  process.exit(1);
});
