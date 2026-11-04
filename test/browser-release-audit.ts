import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import fs from 'node:fs';

const out = process.env.RELEASE_AUDIT_DIR || '/tmp/metro-task9/release';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true,
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-gl=angle', '--use-angle=metal', '--no-sandbox'] });
try {
  // Never load a user's browser profile. All currency/progression changes are disposable fixtures.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'Asia/Kolkata' });
  const page = await context.newPage();
  const errors: string[] = [], documents: string[] = [], hmr: string[] = [], layouts: any[] = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents.push(request.url()); });
  page.on('websocket', ws => ws.on('framereceived', frame => {
    try { const data = JSON.parse(String(frame.payload)); if (['update', 'full-reload', 'error'].includes(data.type)) hmr.push(data.type); } catch {}
  }));
  await page.addInitScript(() => { (window as any).__name = (fn: any) => fn; });
  await page.goto(process.env.UI_TEST_URL || 'http://127.0.0.1:3001');
  await page.waitForFunction(() => !!(window as any).__METRO_GAME__);
  await page.evaluate(() => {
    const w = window as any, g = w.__METRO_GAME__;
    w.__releaseAudit = { trackResets: 0, runStarts: 0, lobbyRenders: 0, shopRenders: 0, contextLoss: 0, contextRestored: 0 };
    for (const [obj, key, counter] of [[g.trackManager, 'reset', 'trackResets'], [g, 'startRun', 'runStarts'], [g.startScreen, 'updateState', 'lobbyRenders'], [g.shopModal, 'renderCategoryContent', 'shopRenders']] as any[]) {
      const original = obj[key].bind(obj);
      obj[key] = (...args: any[]) => { w.__releaseAudit[counter]++; return original(...args); };
    }
    w.__releaseRenderer = g.worldScene.renderer;
    g.canvas.addEventListener('webglcontextlost', () => w.__releaseAudit.contextLoss++);
    g.canvas.addEventListener('webglcontextrestored', () => w.__releaseAudit.contextRestored++);
  });
  const routes = [
    ['start-events-btn', 'events-modal', 'events-close-btn'],
    ['start-practice-btn', 'practice-modal', 'practice-close-btn'],
    ['start-profile-btn', 'profile-modal', 'profile-close-btn'],
    ['lobby-daily-widget', 'daily-reward-modal', 'daily-close-btn'],
    ['lobby-daily-challenge-btn', 'daily-challenge-modal', 'dc-close-btn']
  ];
  const saved = await page.evaluate(() => localStorage.getItem('metro_progression_v1'));
  for (const [width, height] of [[1440, 900], [1366, 768], [390, 844], [844, 390], [768, 1024]]) {
    await page.setViewportSize({ width, height });
    for (const [button, modal, close] of routes) {
      const nested = !(await page.locator('#' + button).isVisible());
      const parentButton = modal === 'daily-reward-modal' ? 'start-profile-btn' : 'start-events-btn';
      const nestedButton = modal === 'daily-reward-modal' ? 'profile-daily-rewards-btn' : 'events-dc-banner-btn';
      const parentModal = modal === 'daily-reward-modal' ? 'profile-modal' : 'events-modal';
      const open = async () => {
        if (nested) { await page.locator('#' + parentButton).click(); await page.locator('#' + nestedButton).click(); }
        else await page.locator('#' + button).click();
      };
      const back = async () => {
        assert.ok(await page.locator('#' + (nested ? parentModal : 'start-screen')).isVisible(), `${modal} returns to origin`);
        assert.equal(await page.evaluate(() => document.activeElement?.id), nested ? nestedButton : button, `${modal} restores trigger focus`);
        if (nested) await page.keyboard.press('Escape');
      };
      await open();
      assert.ok(await page.evaluate(id => document.getElementById(id)!.contains(document.activeElement), modal), `${modal} entry focus`);
      await page.waitForTimeout(180);
      const layout = await page.locator('#' + modal).evaluate(root => {
        const panel = root.firstElementChild as HTMLElement, rect = panel.getBoundingClientRect();
        return { modal: root.id, width: innerWidth, height: innerHeight, overflow: panel.scrollWidth > panel.clientWidth + 1,
          clipped: rect.x < -1 || rect.right > innerWidth + 1 || rect.y < -1 || rect.bottom > innerHeight + 1 };
      });
      layouts.push(layout);
      if (layout.overflow || layout.clipped) console.log('LAYOUT DEFECT', layout);
      await page.screenshot({ path: `${out}/${width}x${height}-${modal}.png` });
      await page.keyboard.press('Escape');
      await back();
      await open();
      await page.locator('#' + close).click();
      await back();
    }
  }
  assert.deepEqual(layouts.filter(row => row.overflow || row.clipped), [], 'secondary panels remain in viewport');
  assert.equal(await page.evaluate(() => localStorage.getItem('metro_progression_v1')), saved, 'navigation never changes progression save');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('#start-events-btn').click();
  await page.locator('#events-dc-banner-btn').click();
  await page.keyboard.press('Escape');
  assert.ok(await page.locator('#events-modal').isVisible(), 'nested Daily Challenge returns to Events');
  await page.keyboard.press('Escape');
  await page.locator('#start-achievements-btn').click();
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.missionsModal.currentTab), 'ACHIEVEMENTS', 'Achievements opens its own tab');
  await page.keyboard.press('Escape');
  await page.locator('#start-missions-btn').click();
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.missionsModal.currentTab), 'MISSIONS', 'Missions opens its own tab');
  await page.keyboard.press('Escape');
  await page.locator('#start-shop-btn').click();
  await page.locator('[data-cat="CHARACTERS"]').click();
  await page.locator('[data-view-char="char_luna"]').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.viewChar), 'char_luna', 'rebuilt Shop restores runner preview focus');
  await page.locator('[data-cat="HOVERBOARDS"]').click();
  await page.locator('[data-view-board="board_pulse_rider"]').click();
  assert.equal(await page.locator('#board-name').innerText(), 'Pulse Rider', 'preview opens requested board instead of equipped board');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.viewBoard), 'board_pulse_rider', 'rebuilt Shop restores board preview focus');
  await page.keyboard.press('Escape');
  const counters = await page.evaluate(() => ({ ...(window as any).__releaseAudit, sameRenderer: (window as any).__releaseRenderer === (window as any).__METRO_GAME__.worldScene.renderer }));
  assert.equal(counters.trackResets, 0, 'Back/Close never resets track'); assert.equal(counters.runStarts, 0);
  assert.equal(counters.contextLoss, 0); assert.equal(counters.contextRestored, 0); assert.equal(counters.sameRenderer, true);
  assert.equal(documents.length, 1, 'no unexpected document navigation'); assert.deepEqual(hmr, []);
  console.log('PASS: secondary navigation, direct Achievements, focus, nested Back; no reload/HMR/run/renderer reset');

  // Exact-price UI purchases, duplicate clicks, insufficient funds, then actual browser reload.
  await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.upgradeManager.setCoins(10000));
  await page.locator('#cust-runner-btn').click();
  await page.locator('#char-tabs [data-char-id="char_luna"]').click();
  await page.locator('#char-action-btn').evaluate(button => { (button as HTMLElement).click(); (button as HTMLElement).click(); });
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.upgradeManager.getCoins()), 8500, 'runner double click deducts 1500 once');
  await page.keyboard.press('Escape');
  await page.locator('#cust-board-btn').click();
  await page.locator('#board-tabs [data-board-id="board_pulse_rider"]').click();
  await page.locator('#board-action-btn').evaluate(button => { (button as HTMLElement).click(); (button as HTMLElement).click(); });
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.upgradeManager.getCoins()), 6000, 'board double click deducts 2500 once');
  await page.locator('#board-buy-charges-btn').click();
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.upgradeManager.getCoins()), 5700, 'charge pack deducts 300');
  await page.keyboard.press('Escape');
  await page.locator('#start-shop-btn').click(); await page.locator('[data-cat="WORLDS"]').click();
  await page.locator('[data-buy-world="NEON_RAINLINE"]').click();
  await page.locator('#confirm-execute-btn').evaluate(button => { (button as HTMLElement).click(); (button as HTMLElement).click(); });
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.upgradeManager.getCoins()), 2700, 'world confirmation double click deducts 3000 once');
  await page.locator('[data-equip-world="NEON_RAINLINE"]').click();
  await page.keyboard.press('Escape');
  const rejected = await page.evaluate(() => {
    const g = (window as any).__METRO_GAME__, p = g.progression, wallet = g.shopModal.upgradeManager;
    const coins = wallet.getCoins();
    return { coins, after: (p.purchaseTheme('ORBITAL_HALO'), wallet.getCoins()), selected: p.getSelectedTheme(), duplicateRunner: p.purchaseCharacter('char_luna').success, duplicateBoard: p.purchaseBoard('board_pulse_rider').success, lockedEquip: p.equipTheme('ORBITAL_HALO').success };
  });
  assert.deepEqual(rejected, { coins: 2700, after: 2700, selected: 'NEON_RAINLINE', duplicateRunner: false, duplicateBoard: false, lockedEquip: false });
  await page.locator('#cust-runner-btn').click();
  await page.locator('[data-outfit-id="luna_violet"]').click();
  await page.locator('#char-action-btn').evaluate(button => { (button as HTMLElement).click(); (button as HTMLElement).click(); });
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.upgradeManager.getCoins()), 1700, 'outfit deducts 1000 once');
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.progression.getSelectedOutfit('char_luna')), 'luna_violet');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const g = (window as any).__METRO_GAME__, p = g.progression;
    p.addKeys(4); // Persist a non-default key balance as well as coins.
    const mission = p.getActiveMissions()[0]; mission.progress = Math.min(mission.target - 1, 7); p.saveState();
    const settings = g.inputManager.getSettingsManager(); settings.setSwipeSensitivity('HIGH'); settings.setReducedMotion(true);
  });
  const snapshot = () => page.evaluate(() => {
    const g = (window as any).__METRO_GAME__, p = g.progression;
    return { character: p.getSelectedCharacter(), outfit: p.getSelectedOutfit(p.getSelectedCharacter()), ownedCharacters: p.getUnlockedCharacters(),
      board: p.getSelectedBoard(), ownedBoards: p.getUnlockedBoards(), charges: p.getHoverboardCharges(), theme: p.getSelectedTheme(), coins: g.shopModal.upgradeManager.getCoins(), keys: p.getKeys(),
      missions: p.getActiveMissions(), settings: g.inputManager.getSettingsManager().getState() };
  });
  const beforeReload = await snapshot();
  await page.reload(); await page.waitForFunction(() => !!(window as any).__METRO_GAME__);
  assert.deepEqual(await snapshot(), beforeReload, 'purchases/equipment/charges/world/currencies/missions/settings persist after actual reload');
  assert.equal(documents.length, 2, 'only the explicit persistence reload navigated');
  assert.equal(await page.locator('#cust-runner-name').innerText(), 'LUNA');
  assert.equal(await page.locator('#cust-board-name').innerText(), 'PULSE RIDER');
  console.log('PASS: isolated save purchases, exact deductions, duplicate rejection, insufficient funds and reload persistence');

  // Difficulty controls and launch cleanup must leave no hidden navigation history.
  for (const [id, mode] of [['mode-toggle-beginner', 'BEGINNER'], ['mode-toggle-easy', 'EASY'], ['mode-toggle-hard', 'HARD']]) {
    await page.locator('#' + id).click();
    assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.progression.getActiveGameMode()), mode);
  }
  await page.locator('#start-practice-btn').click(); await page.locator('#practice-launch-btn').click();
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PLAYING');
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.navigation.hasOverlay), false, 'launch clears menu history');
  await page.keyboard.press('Escape'); assert.ok(await page.locator('#pause-modal').isVisible());
  await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PLAYING');
  await page.evaluate(() => (window as any).__METRO_GAME__.goToMenu());
  assert.deepEqual(errors, [], 'no runtime exceptions');
  fs.writeFileSync(`${out}/results.json`, JSON.stringify({ browser: browser.version(), physicalHardware: false, layouts, counters, documents, hmr, errors, persisted: beforeReload }, null, 2));
  console.log('VERDICT: PASS');
} finally { await browser.close(); }
