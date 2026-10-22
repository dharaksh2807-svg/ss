import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/7b654b27-5359-4f8b-9796-d5016a125022';

async function captureTask4Evidence() {
  console.log('📸 Starting Task 4 Visual Evidence Capture with Playwright...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // -------------------------------------------------------------
  // SHOT 1: Start Screen with Progression & Event Navigation
  // -------------------------------------------------------------
  console.log('Capturing Shot 1: Start Screen with Event & Mission buttons...');
  const shot1 = path.join(ARTIFACT_DIR, 'task4_start_screen.png');
  await page.screenshot({ path: shot1 });

  // -------------------------------------------------------------
  // SHOT 2: Missions Modal - Missions Tab
  // -------------------------------------------------------------
  console.log('Capturing Shot 2: Missions Tab...');
  await page.evaluate(() => {
    window.__METRO_BUS__.emit('OPEN_MISSIONS', 'START');
  });
  await page.waitForTimeout(500);
  const shot2 = path.join(ARTIFACT_DIR, 'task4_missions_tab.png');
  await page.screenshot({ path: shot2 });

  // -------------------------------------------------------------
  // SHOT 3: Missions Modal - Daily Objectives Tab
  // -------------------------------------------------------------
  console.log('Capturing Shot 3: Daily Objectives Tab with real countdown...');
  await page.evaluate(() => {
    const dailyBtn = document.querySelector('.missions-tab-btn[data-tab="DAILY"]');
    if (dailyBtn) dailyBtn.click();
  });
  await page.waitForTimeout(500);
  const shot3 = path.join(ARTIFACT_DIR, 'task4_daily_tab.png');
  await page.screenshot({ path: shot3 });

  // -------------------------------------------------------------
  // SHOT 4: Missions Modal - Achievements Tab
  // -------------------------------------------------------------
  console.log('Capturing Shot 4: Multi-Tiered Lifetime Achievements Tab...');
  await page.evaluate(() => {
    const achBtn = document.querySelector('.missions-tab-btn[data-tab="ACHIEVEMENTS"]');
    if (achBtn) achBtn.click();
  });
  await page.waitForTimeout(500);
  const shot4 = path.join(ARTIFACT_DIR, 'task4_achievements_tab.png');
  await page.screenshot({ path: shot4 });

  // -------------------------------------------------------------
  // SHOT 5: Missions Modal - Season Pass Tab
  // -------------------------------------------------------------
  console.log('Capturing Shot 5: Season Pass Roadmap...');
  await page.evaluate(() => {
    const seasonBtn = document.querySelector('.missions-tab-btn[data-tab="SEASON"]');
    if (seasonBtn) seasonBtn.click();
  });
  await page.waitForTimeout(500);
  const shot5 = path.join(ARTIFACT_DIR, 'task4_season_pass_tab.png');
  await page.screenshot({ path: shot5 });

  // -------------------------------------------------------------
  // SHOT 6: Event Modes Selection Modal
  // -------------------------------------------------------------
  console.log('Capturing Shot 6: Event Challenge Modes Selector...');
  await page.evaluate(() => {
    document.getElementById('missions-close-btn')?.click();
    window.__METRO_BUS__.emit('OPEN_EVENTS', 'START');
  });
  await page.waitForTimeout(500);
  const shot6 = path.join(ARTIFACT_DIR, 'task4_event_select_modal.png');
  await page.screenshot({ path: shot6 });

  // -------------------------------------------------------------
  // SHOT 7: In-Game Time Trial Challenge Mode
  // -------------------------------------------------------------
  console.log('Capturing Shot 7: Time Trial Gameplay with Countdown & Chrono Orbs...');
  await page.evaluate(() => {
    document.getElementById('events-close-btn')?.click();
    const game = window.__METRO_GAME__;
    game.startRun('TIME_TRIAL');
    game.pause();
    document.getElementById('pause-modal')?.classList.add('hidden');
  });
  await page.waitForTimeout(500);
  const shot7 = path.join(ARTIFACT_DIR, 'task4_timetrial_gameplay.png');
  await page.screenshot({ path: shot7 });

  // -------------------------------------------------------------
  // SHOT 8: In-Game Progression Completion Toast Banner
  // -------------------------------------------------------------
  console.log('Capturing Shot 8: In-Game HUD Progression Completion Toast...');
  await page.evaluate(() => {
    window.__METRO_BUS__.emit(window.__METRO_EVENTS__.MISSION_COMPLETED, {
      title: 'Pocket Change (50 Coins)',
      rewardCoins: 250
    });
  });
  await page.waitForTimeout(400);
  const shot8 = path.join(ARTIFACT_DIR, 'task4_progression_toast.png');
  await page.screenshot({ path: shot8 });

  await browser.close();
  console.log('✅ ALL Task 4 visual evidence screenshots captured successfully!');
}

captureTask4Evidence().catch((err) => {
  console.error('Error capturing Task 4 visual evidence:', err);
  process.exit(1);
});
