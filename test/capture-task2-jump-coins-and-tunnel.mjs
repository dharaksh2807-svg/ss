import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/6aa8f275-4ff8-4bbc-af07-b2936cce22ac';

async function captureTask2Showcase() {
  console.log('📸 Launching Chrome to capture Task 2 Jump Coin Arcs & Tunnel Flight showcase shots...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  // Start the run and bypass cinematic intro to enter normal chase camera mode
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
  // SHOT 1: Physically Aligned Jump Coin Arc Over Hurdle
  // -------------------------------------------------------------
  console.log('Capturing Shot 1: Physically Aligned Jump Coin Arc Over Hurdle...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.chunks[0];
    
    // Create physical jump arc over a low hurdle at zOffset = 24.0m
    const pattern = {
      name: 'TASK2_PHYSICAL_JUMP_ARC',
      difficulty: 'INTERMEDIATE',
      obstacles: [
        { type: 'LOW_BARRIER', lane: 0, zOffset: 24.0 }
      ],
      collectibles: [
        { 
          type: 'COIN', 
          lane: 0, 
          zOffset: 18.6, 
          yOffset: 3.10, 
          startYOffset: 0.85, 
          endYOffset: 0.85, 
          count: 5, 
          spacing: 2.7, 
          isArc: true, 
          archetype: 'JUMP_ARC' 
        },
        { type: 'COIN', lane: 0, zOffset: 32.0, count: 4, spacing: 2.2 }
      ]
    };

    chunk.populate(pattern, 0, game.trackManager.envManager.getTheme('MODERN_METRO'), false);
    
    // Position runner in mid-jump ascent approaching the hurdle
    game.player.position.set(0, 2.35, -20.5);
    game.player.state = 'JUMP';
    game.player.isJumping = true;
    game.player.verticalVelocity = 7.5;
    game.player.mesh.position.copy(game.player.position);

    game.cameraController.finishIntro(game.player.position);
    game.cameraController.update(game.player.position, 0.016, 0, 18, 0.85, false);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_jump_coin_arc_hurdle.png') });

  // -------------------------------------------------------------
  // SHOT 2: High-Clearance Aerial Corridor Inside Tunnel (12.5m Vaulted Ceiling)
  // -------------------------------------------------------------
  console.log('Capturing Shot 2: High-Clearance Aerial Corridor Inside Tunnel...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.chunks[0];
    chunk.isAerialCorridor = true;

    const pattern = {
      name: 'TASK2_AERIAL_TUNNEL_CORRIDOR',
      difficulty: 'MEDIUM',
      isTunnel: true,
      obstacles: [
        { type: 'TRAIN', lane: 1, zOffset: 20.0, length: 28.0 }
      ],
      collectibles: []
    };

    const undergroundTheme = game.trackManager.envManager.getTheme('UNDERGROUND_METRO');
    chunk.populate(pattern, 0, undergroundTheme, false);

    // Activate Jetpack flight at 9.0m altitude
    game.player.powerups.activate('JETPACK');
    game.player.state = 'JETPACK';
    game.player.position.set(0, 9.0, -22.0);
    game.player.mesh.position.copy(game.player.position);

    // Update aerial coin manager to populate aerial coins along the flight path
    game.trackManager.aerialCoinManager.onJetpackActivated(game.player);
    game.trackManager.aerialCoinManager.update(game.player, 0.016, 1.0, false, 0);

    game.cameraController.finishIntro(game.player.position);
    game.cameraController.update(game.player.position, 0.016, 0, 22, 0.85, false);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_jetpack_aerial_corridor_tunnel.png') });

  // -------------------------------------------------------------
  // SHOT 3: Jetpack Activation Inside Enclosed Low Tunnel (Deferred Takeoff)
  // -------------------------------------------------------------
  console.log('Capturing Shot 3: Deferred Jetpack Takeoff Inside Enclosed Low Tunnel...');
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    const chunk = game.trackManager.chunks[0];
    chunk.isAerialCorridor = false; // Normal enclosed low tunnel

    const pattern = {
      name: 'TASK2_ENCLOSED_TUNNEL',
      difficulty: 'MEDIUM',
      isTunnel: true,
      obstacles: [],
      collectibles: [
        { type: 'JETPACK', lane: 0, zOffset: 12.0 },
        { type: 'COIN', lane: 0, zOffset: 16.0, count: 6, spacing: 2.0 }
      ]
    };

    const undergroundTheme = game.trackManager.envManager.getTheme('UNDERGROUND_METRO');
    chunk.populate(pattern, 0, undergroundTheme, false);

    // Player running smoothly on ground inside tunnel with deferred takeoff active
    game.player.position.set(0, 0.9, -15.0);
    game.player.state = 'RUNNING';
    game.player.setTunnelEnclosed(true);
    game.player.powerups.activate('JETPACK');
    game.player.update(0.016); // Engages deferred takeoff, keeps runner safely on ground

    game.player.mesh.position.copy(game.player.position);
    game.cameraController.finishIntro(game.player.position);
    game.cameraController.update(game.player.position, 0.016, 0, 18, 0.85, false);
    game.worldScene.renderer.render(game.worldScene.scene, game.cameraController.camera);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'task2_deferred_takeoff_tunnel.png') });

  await browser.close();
  console.log('✅ All Task 2 showcase screenshots captured successfully!');
}

captureTask2Showcase().catch(err => {
  console.error('❌ Error capturing screenshots:', err);
  process.exit(1);
});
