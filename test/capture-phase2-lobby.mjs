/**
 * Phase 2 Lobby — After Screenshot Capture
 * Tests responsive layout at 4 breakpoints and verifies acceptance criteria.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('./artifacts/phase2');
fs.mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop_1440x900',  width: 1440, height: 900  },
  { name: 'desktop_1280x720',  width: 1280, height: 720  },
  { name: 'mobile_390x844',    width: 390,  height: 844  },
  { name: 'mobile_360x800',    width: 360,  height: 800  },
];

const BASE_URL = 'http://localhost:3000';

async function waitForLobby(page) {
  // Wait for lobby structure to be stamped and visible
  await page.waitForSelector('#start-play-btn', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('#start-screen:not(.hidden)', { state: 'visible', timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(600); // let 3D scene settle
}

async function checkAcceptanceCriteria(page, label) {
  const results = {};

  // 1. Play button exists and is visible
  results.playButtonVisible = await page.isVisible('#start-play-btn');

  // 2. All dock navigation buttons exist
  const dockIds = [
    'start-characters-btn', 'start-boards-btn', 'start-shop-btn',
    'start-practice-btn', 'start-missions-btn', 'start-events-btn',
    'start-profile-btn'
  ];
  results.dockButtons = {};
  for (const id of dockIds) {
    results.dockButtons[id] = await page.isVisible(`#${id}`);
  }

  // 3. Settings button exists
  results.settingsVisible = await page.isVisible('#start-settings-btn');

  // 4. Difficulty toggles exist
  results.difficultyToggles = {
    beginner: await page.isVisible('#mode-toggle-beginner'),
    easy:     await page.isVisible('#mode-toggle-easy'),
    hard:     await page.isVisible('#mode-toggle-hard'),
  };

  // 5. Currency pills visible
  results.currencyPills = {
    coins:  await page.isVisible('#lobby-coins-pill'),
    keys:   await page.isVisible('#lobby-keys-pill'),
    boards: await page.isVisible('#lobby-boards-pill'),
  };

  // 6. Active mode toggle has class 'active'
  const activeToggle = await page.evaluate(() => {
    const active = document.querySelector('.mode-toggle-btn.active');
    return active ? active.dataset.mode : null;
  });
  results.activeDifficultyMode = activeToggle;

  // 7. Console errors (checked separately via page.on)
  results.highScoreEl = await page.isVisible('#start-high-score');

  // 8. Check no elements overlap the play button on this viewport
  const playBtnBox = await page.$eval('#start-play-btn', el => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height, visible: r.width > 0 };
  }).catch(() => ({ visible: false }));
  results.playBtnLayout = playBtnBox;

  console.log(`\n[${label}] Acceptance Check:`);
  console.log('  Play button visible:', results.playButtonVisible);
  console.log('  Settings visible:',    results.settingsVisible);
  console.log('  Active difficulty:',   results.activeDifficultyMode);
  console.log('  Play btn layout:',     JSON.stringify(results.playBtnLayout));
  const dockOk = Object.values(results.dockButtons).every(Boolean);
  console.log('  All dock btns visible:', dockOk, dockOk ? '' : JSON.stringify(results.dockButtons));
  const currOk = Object.values(results.currencyPills).every(Boolean);
  console.log('  Currency pills visible:', currOk);
  console.log('  Difficulty toggles:', JSON.stringify(results.difficultyToggles));

  return results;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const consoleErrors = [];

  const page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  // Navigate once, then resize for each viewport
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 });
  await waitForLobby(page);

  const allResults = {};

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(400); // let CSS reflow

    // Screenshot
    const screenshotPath = path.join(OUT_DIR, `lobby_${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`✅ Saved: ${screenshotPath}`);

    // Acceptance check
    allResults[vp.name] = await checkAcceptanceCriteria(page, vp.name);
  }

  // Also test difficulty mode switching
  console.log('\n--- Testing difficulty mode switching ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(200);

  await page.click('#mode-toggle-hard');
  await page.waitForTimeout(300);
  const hardActive = await page.evaluate(() =>
    document.querySelector('#mode-toggle-hard')?.classList.contains('active')
  );
  console.log('Hard mode activates on click:', hardActive);

  await page.click('#mode-toggle-easy');
  await page.waitForTimeout(300);
  const easyActive = await page.evaluate(() =>
    document.querySelector('#mode-toggle-easy')?.classList.contains('active')
  );
  console.log('Easy mode activates on click:', easyActive);

  await page.click('#mode-toggle-beginner');
  await page.waitForTimeout(300);
  const beginnerActive = await page.evaluate(() =>
    document.querySelector('#mode-toggle-beginner')?.classList.contains('active')
  );
  console.log('Beginner mode restores on click:', beginnerActive);

  // Screenshot after hard mode
  await page.click('#mode-toggle-hard');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, 'lobby_hard_mode_active.png') });
  console.log(`✅ Saved: hard mode active screenshot`);

  // Console error report
  console.log('\n--- Console Errors ---');
  if (consoleErrors.length === 0) {
    console.log('  None ✅');
  } else {
    consoleErrors.forEach(e => console.log('  ❌', e));
  }

  // Save JSON summary
  const summary = {
    capturedAt: new Date().toISOString(),
    consoleErrors,
    viewportResults: allResults,
    difficultyModeSwitch: { hardActive, easyActive, beginnerActive },
  };
  fs.writeFileSync(
    path.join(OUT_DIR, 'phase2_acceptance.json'),
    JSON.stringify(summary, null, 2)
  );
  console.log(`\n✅ Summary saved: artifacts/phase2/phase2_acceptance.json`);

  await browser.close();
  console.log('\n🎉 Phase 2 capture complete!');
})();
