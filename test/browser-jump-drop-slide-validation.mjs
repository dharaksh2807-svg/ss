import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/ab55f60b-6f7c-4cbf-b0e5-9eac3795d440';
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function runBrowserValidation() {
  console.log('🌐 Starting Browser Jump -> Fast Drop -> Instant Slide Verification...');

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=swiftshader']
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1
    });

    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.error('PAGE ERROR:', msg.text());
    });

    console.log('🚀 Connecting to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Click play button if present
    const playBtn = await page.$('#start-play-btn');
    if (playBtn) {
      await page.click('#start-play-btn', { force: true });
      console.log('🎮 Clicked #start-play-btn');
    }
    await page.waitForTimeout(600);

    // Skip intro cinematic and protect player during locomotion tests
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      if (game && game.openingSequence && game.openingSequence.isActive()) {
        game.openingSequence.skip();
      }
      if (game && game.player) {
        game.player.isIntroInvincible = true;
      }
    });
    await page.waitForTimeout(500);

    // Wait for active PLAYING state
    await page.waitForFunction(() => {
      const game = window.__METRO_GAME__;
      return game && game.lifecycleState === 'PLAYING' && !game.openingSequence.isActive();
    }, { timeout: 8000 });
    console.log('🏃 Active running state confirmed in browser (cinematic skipped)');

    // Attach event listeners to monitor FAST_DROP, LAND, SLIDE events
    await page.evaluate(() => {
      const p = window.__METRO_GAME__.player;
      window.__GAME_EVENTS__ = [];
      p.eventBus.on('FAST_DROP', () => window.__GAME_EVENTS__.push('FAST_DROP'));
      p.eventBus.on('LAND', () => window.__GAME_EVENTS__.push('LAND'));
      p.eventBus.on('SLIDE', () => window.__GAME_EVENTS__.push('SLIDE'));
    });

    // -------------------------------------------------------------
    // TEST 1: Real Keyboard Input Jump (ArrowUp) -> Fast Drop (ArrowDown) -> Instant Ground Slide
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Real Keyboard Input: ArrowUp -> ArrowDown -> Instant Slide ---');
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(150); // Ascend mid-air

    const midAirState = await page.evaluate(() => {
      const p = window.__METRO_GAME__.player;
      return { y: p.position.y, isJumping: p.isJumping, state: p.state, verticalVelocity: p.verticalVelocity };
    });
    console.log('Airborne state before Down:', midAirState);

    // Press ArrowDown mid-air to trigger fast drop and queue landing slide
    await page.keyboard.press('ArrowDown');
    // Rapid duplicate press to verify stability
    await page.keyboard.press('ArrowDown');

    // Wait 80ms for fast drop touchdown and slide activation
    await page.waitForTimeout(80);

    const groundLandedState = await page.evaluate(() => {
      const p = window.__METRO_GAME__.player;
      return {
        isSliding: p.isSliding,
        state: p.state,
        pendingSlideOnLanding: p.pendingSlideOnLanding,
        slideTimer: Math.round(p.slideTimer * 100) / 100,
        colliderHeight: p.collider.max.y - p.collider.min.y,
        y: Math.round(p.position.y * 100) / 100,
        events: [...window.__GAME_EVENTS__]
      };
    });
    console.log('Ground landed state (instant slide):', groundLandedState);

    const groundPassed = (
      midAirState.isJumping &&
      groundLandedState.events.includes('FAST_DROP') &&
      groundLandedState.events.includes('SLIDE') &&
      groundLandedState.isSliding &&
      groundLandedState.state === 'SLIDE' &&
      !groundLandedState.pendingSlideOnLanding &&
      Math.abs(groundLandedState.colliderHeight - 0.75) < 0.01
    );

    if (groundPassed) {
      console.log('✅ TEST 1 PASSED: Airborne ArrowDown initiated fast drop, queued landing slide, and instantly slid upon ground contact!');
    } else {
      throw new Error(`TEST 1 FAILED: unexpected telemetry: ${JSON.stringify({ midAirState, groundLandedState })}`);
    }

    const groundShotPath = path.join(ARTIFACTS_DIR, 'jump_drop_slide_ground_verified.png');
    await page.screenshot({ path: groundShotPath });
    console.log(`📸 Ground screenshot saved to ${groundShotPath}`);

    // Wait for slide duration to expire (SLIDE_DURATION = 0.65s)
    await page.waitForTimeout(650);
    const postSlideState = await page.evaluate(() => {
      const p = window.__METRO_GAME__.player;
      return { state: p.state, isSliding: p.isSliding, colliderHeight: p.collider.max.y - p.collider.min.y };
    });
    console.log('Post-slide recovery state:', postSlideState);
    if (postSlideState.state !== 'RUN' || postSlideState.isSliding) {
      throw new Error(`Recovery failed: ${JSON.stringify(postSlideState)}`);
    }

    // -------------------------------------------------------------
    // TEST 2: Rooftop Jump -> Fast Drop -> Instant Slide on Train Roof -> Recover to ON_TRAIN
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Rooftop Jump -> Fast Drop -> Instant Slide on Train Roof ---');
    await page.evaluate(() => {
      window.__GAME_EVENTS__ = [];
      const game = window.__METRO_GAME__;
      const trackManager = game.trackManager;
      const p = game.player;

      // Populate chunk 0 with a 120m traversable train
      const chunk = trackManager.chunks[0];
      chunk.clearDynamicItems();
      chunk.populate({
        name: 'TEST_ROOF_CHUNK',
        difficulty: 'BEGINNER',
        obstacles: [{
          type: 'TRAIN',
          lane: 0,
          zOffset: 0,
          length: 120.0,
          hasRamp: false
        }],
        collectibles: []
      }, chunk.chunkZ);

      // Lock player support surface to Train roof at y = 4.35
      p.currentLane = 0;
      p.targetLane = 0;
      p.position.set(0, 4.35, chunk.chunkZ);
      p.resolveRoofLanding(4.35, chunk.obstacles[0]?.id);
      p.updateCollider();

      // Initiate jump above train roof
      p.jump();
    });
    await page.waitForTimeout(150); // Ascend above roof

    const roofAirState = await page.evaluate(() => {
      const p = window.__METRO_GAME__.player;
      return { y: p.position.y, isJumping: p.isJumping, state: p.state };
    });
    console.log('Airborne state above roof:', roofAirState);

    // Press ArrowDown while airborne above roof
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(80);

    const roofLandedState = await page.evaluate(() => {
      const p = window.__METRO_GAME__.player;
      return {
        isSliding: p.isSliding,
        state: p.state,
        pendingSlideOnLanding: p.pendingSlideOnLanding,
        slideTimer: Math.round(p.slideTimer * 100) / 100,
        y: Math.round(p.position.y * 100) / 100,
        groundY: Math.round(p.groundY * 100) / 100,
        events: [...window.__GAME_EVENTS__]
      };
    });
    console.log('Roof landed state (instant slide):', roofLandedState);

    const roofPassed = (
      roofAirState.isJumping &&
      roofLandedState.events.includes('FAST_DROP') &&
      roofLandedState.events.includes('SLIDE') &&
      roofLandedState.isSliding &&
      roofLandedState.state === 'SLIDE' &&
      !roofLandedState.pendingSlideOnLanding &&
      roofLandedState.y >= 4.1
    );

    if (roofPassed) {
      console.log('✅ TEST 2 PASSED: Rooftop landing triggered instant slide on train roof!');
    } else {
      throw new Error(`TEST 2 FAILED: unexpected rooftop telemetry: ${JSON.stringify({ roofAirState, roofLandedState })}`);
    }

    const roofShotPath = path.join(ARTIFACTS_DIR, 'jump_drop_slide_roof_verified.png');
    await page.screenshot({ path: roofShotPath });
    console.log(`📸 Rooftop screenshot saved to ${roofShotPath}`);

    // Wait for rooftop slide to expire
    await page.waitForTimeout(650);

    const roofRecoveredState = await page.evaluate(() => {
      const p = window.__METRO_GAME__.player;
      return {
        isSliding: p.isSliding,
        state: p.state,
        y: Math.round(p.position.y * 100) / 100
      };
    });
    console.log('Rooftop post-slide recovery state:', roofRecoveredState);

    if (roofRecoveredState.state === 'ON_TRAIN' && !roofRecoveredState.isSliding) {
      console.log('✅ TEST 2 PASSED: Rooftop slide cleanly completed and recovered to ON_TRAIN!');
    } else {
      throw new Error(`TEST 2 FAILED: Rooftop slide failed to recover to ON_TRAIN: ${JSON.stringify(roofRecoveredState)}`);
    }

    console.log('\n🎉 ALL REAL-BROWSER VALIDATIONS PASSED PERFECTLY!');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runBrowserValidation().catch((err) => {
  console.error('Browser validation failed:', err);
  process.exit(1);
});
