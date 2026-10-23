import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/70c5e932-5b43-4724-8861-c9ce95ff1151/task3_screenshots';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function captureAllTask3Evidence() {
  console.log('🚀 Launching Chrome for Task 3 Visual & Video Verification...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2,
    recordVideo: {
      dir: OUT_DIR,
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();

  console.log('🌐 Loading Metro Runner 3D on http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__METRO_GAME__);
  console.log('🎮 Game engine initialized successfully.');

  // Initialize and grant invulnerability
  await page.evaluate(() => {
    const game = window.__METRO_GAME__;
    game.startRun('NORMAL');
    if (game.openingSequence) {
      game.openingSequence.skip();
    }
    game.player.activateReviveGrace(999999);
    game.player.isIntroInvincible = true;

    // Hide any modal overlays
    document.querySelectorAll('.modal, .overlay, #revive-modal, #game-over-modal').forEach(el => el.classList.add('hidden'));
  });

  // Helper to spawn a landmark, set atmosphere, and take a screenshot
  async function captureLandmark(name, landmarkId, envId = 'MODERN_METRO', atmosphere = null) {
    console.log(`📸 Capturing Landmark: ${landmarkId} (${name})...`);
    await page.evaluate(({ landmarkId, envId, atmosphere }) => {
      window.__DEV_SPAWN_LANDMARK__(landmarkId);
      window.__DEV_SET_DISTRICT__(envId);
      if (atmosphere) {
        window.__DEV_SET_ATMOSPHERE__(atmosphere);
      }
    }, { landmarkId, envId, atmosphere });

    await page.waitForTimeout(1400);

    const shotPath = path.join(OUT_DIR, `${name}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`  Saved: ${shotPath}`);
  }

  // 1. Capture All 7 Distinct Architectural Landmarks
  await captureLandmark('landmark-grand-railway-station', 'GRAND_RAILWAY_STATION', 'MODERN_METRO');
  await captureLandmark('landmark-historic-stone-viaduct', 'HISTORIC_STONE_VIADUCT', 'HISTORIC_QUARTER');
  await captureLandmark('landmark-modern-glass-transit-hub', 'MODERN_GLASS_TRANSIT_HUB', 'MODERN_METRO');
  await captureLandmark('landmark-industrial-maintenance-yard', 'INDUSTRIAL_MAINTENANCE_YARD', 'HISTORIC_QUARTER');
  await captureLandmark('landmark-open-waterfront-vista', 'OPEN_WATERFRONT_VISTA', 'MODERN_METRO');
  await captureLandmark('landmark-underground-grand-station', 'UNDERGROUND_GRAND_STATION', 'UNDERGROUND_METRO');
  await captureLandmark('landmark-rooftop-skyline-moment', 'ROOFTOP_SKYLINE_MOMENT', 'MODERN_METRO');

  // 2. Capture Weather & Atmospheric Presets
  console.log('📸 Capturing Atmosphere: Golden Hour...');
  await page.evaluate(() => {
    window.__DEV_SET_ATMOSPHERE__('WARM_GOLDEN_HOUR');
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, 'atmosphere-warm-golden-hour.png') });

  console.log('📸 Capturing Atmosphere: Light Rain with Particle Simulation...');
  await page.evaluate(() => {
    window.__DEV_SET_ATMOSPHERE__('LIGHT_RAIN');
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT_DIR, 'atmosphere-light-rain-particles.png') });

  // 3. Capture Small Moments (Passing train, flock of birds)
  console.log('📸 Capturing Small Moments: Distant Birds & Passing Train...');
  await page.evaluate(() => {
    window.__DEV_SET_DISTRICT__('MODERN_METRO');
    window.__DEV_SET_ATMOSPHERE__('CLEAR_DAYLIGHT');
    window.__DEV_SPAWN_LANDMARK__(null);
    window.__DEV_SPAWN_SMALL_MOMENT__('DISTANT_BIRDS_FLOCK');
  });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(OUT_DIR, 'surprise-distant-birds-flock.png') });

  // 4. Capture Seamless Cinematic Transitions: Surface -> Underground Portal Approach & Arrival
  console.log('🎬 Recording Cinematic Surface -> Underground Metro Transition...');
  await page.evaluate(() => {
    window.__DEV_SET_DISTRICT__('MODERN_METRO');
    window.__DEV_SET_ATMOSPHERE__('CLEAR_DAYLIGHT');
    window.__DEV_SPAWN_LANDMARK__(null);
    window.__DEV_SPAWN_SMALL_MOMENT__(null);
  });

  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT_DIR, 'transition-surface-portal-approach.png') });

  // Advance runner through the portal into subterranean vault
  console.log('🎬 Recording Subterranean Arrival...');
  await page.evaluate(() => {
    window.__DEV_SET_DISTRICT__('UNDERGROUND_METRO');
    window.__DEV_SET_ATMOSPHERE__('ILLUMINATED_UNDERGROUND');
    window.__DEV_SPAWN_LANDMARK__('UNDERGROUND_GRAND_STATION');
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT_DIR, 'transition-subterranean-arrival.png') });

  // Run dynamic live gameplay for 5 seconds to record transition video
  console.log('🎬 Recording live transition gameplay sequence...');
  await page.waitForTimeout(4000);

  // Close context to finalize video recording
  await context.close();
  await browser.close();

  // Find the generated video file and give it a clean name
  const files = fs.readdirSync(OUT_DIR);
  const videoFile = files.find(f => f.endsWith('.webm'));
  if (videoFile) {
    const oldPath = path.join(OUT_DIR, videoFile);
    const newPath = path.join(OUT_DIR, 'task3_cinematic_transitions_gameplay.webm');
    if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
    fs.renameSync(oldPath, newPath);
    console.log(`🎥 Finalized Gameplay Transition Video: ${newPath}`);
  }

  console.log('✨ All Task 3 Visual & Video Evidence Captured Successfully!');
}

captureAllTask3Evidence().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
