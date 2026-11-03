import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import fs from 'node:fs';

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH || fs.existsSync(chrome) ? { executablePath: process.env.CHROME_PATH || chrome } : {}),
  args: ['--use-gl=angle', '--use-angle=metal', '--no-sandbox'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => {
    (window as any).__name = (fn: any) => fn;
    const add = window.addEventListener.bind(window);
    const listeners = new Set();
    (window as any).__uiKeys = listeners;
    window.addEventListener = ((type: string, callback: any, options: any) => {
      if (type === 'keydown') listeners.add(callback);
      return add(type, callback, options);
    }) as any;
  });
  await page.goto(process.env.UI_TEST_URL || 'http://127.0.0.1:3012');
  await page.waitForFunction(() => Boolean((window as any).__METRO_GAME__));
  await page.evaluate(() => {
    const w = window as any, game = w.__METRO_GAME__;
    w.__uiCounts = { restart: 0, reset: 0 };
    const start = game.startRun.bind(game), reset = game.trackManager.reset.bind(game.trackManager);
    game.startRun = (...args: any[]) => { w.__uiCounts.restart++; return start(...args); };
    game.trackManager.reset = (...args: any[]) => { w.__uiCounts.reset++; return reset(...args); };
  });
  const ids = ['start-screen', 'shop-modal', 'character-select-modal', 'hoverboard-select-modal', 'environment-modal', 'missions-modal', 'settings-modal', 'pause-modal', 'game-over-modal'];
  async function visible(id: string) {
    assert.deepEqual(await page.evaluate(ids => ids.filter(id => !document.getElementById(id)!.classList.contains('hidden')), ids), [id]);
    assert.equal(await page.evaluate(id => document.getElementById(id)!.contains(document.activeElement), id), true, id + ' retains keyboard focus');
    assert.equal(await page.evaluate(() => {
      const m = (window as any).__METRO_GAME__.missionsModal;
      return m.element.classList.contains('hidden') ? m.timerInterval === null : m.timerInterval !== null;
    }), true, 'mission countdown is active only while visible');
    assert.deepEqual(await page.evaluate(() => {
      const g = (window as any).__METRO_GAME__;
      return [g.characterSelectModal, g.hoverboardSelectModal].filter(m => m.element.classList.contains('hidden')).map(m => [m.isRendering, m.animFrameId]);
    }), id === 'character-select-modal' || id === 'hoverboard-select-modal' ? [[false, null]] : [[false, null], [false, null]]);
  }
  async function emit(event: string, payload?: any) {
    await page.evaluate(({ event, payload }) => (window as any).__METRO_BUS__.emit(event, payload), { event, payload });
  }
  async function listenerCounts() {
    return page.evaluate(() => ({ keys: (window as any).__uiKeys.size, bus: [...(window as any).__METRO_BUS__.listeners].map(([name, callbacks]: any) => [name, callbacks.size]) }));
  }
  const routes = [
    ['#start-shop-btn', 'shop-modal', '#shop-close-btn'],
    ['#cust-runner-btn', 'character-select-modal', '#char-close-btn'],
    ['#cust-board-btn', 'hoverboard-select-modal', '#board-close-btn'],
    ['#cust-world-btn', 'environment-modal', '#env-close-btn'],
    ['#start-missions-btn', 'missions-modal', '#missions-close-btn'],
  ];
  for (const [button, modal, close] of routes) {
    await page.locator(button).click(); await visible(modal);
    await page.locator(close).click(); await visible('start-screen');
    console.log('PASS Home → ' + modal + ' → Home');
  }
  // The runner preview lazily creates one reusable CharacterModel subscription.
  const listeners = await listenerCounts();
  await page.locator('#start-shop-btn').click();
  await page.locator('[data-cat="CHARACTERS"]').click();
  await page.locator('[data-view-char]').first().click(); await visible('character-select-modal');
  await page.keyboard.press('Escape'); await visible('shop-modal');
  assert.equal(await page.locator('[data-cat="CHARACTERS"]').getAttribute('class').then(c => c!.includes('active')), true);
  await page.locator('[data-cat="HOVERBOARDS"]').click();
  await page.locator('[data-view-board]').first().click(); await visible('hoverboard-select-modal');
  await page.locator('#board-close-btn').click(); await visible('shop-modal');
  assert.equal(await page.locator('[data-cat="HOVERBOARDS"]').getAttribute('class').then(c => c!.includes('active')), true);
  await page.keyboard.press('Escape'); await visible('start-screen');
  console.log('PASS Shop → Runner/Board Preview → Back → same Shop tab');

  // Worlds is an additional real nested category entry route.
  await page.locator('#cust-world-btn').click();
  await page.locator('[data-action="open-shop-worlds"]').click(); await visible('shop-modal');
  await page.keyboard.press('Escape'); await visible('environment-modal');
  await page.keyboard.press('Escape'); await visible('start-screen');
  await emit('OPEN_SHOP', 'WORLDS');
  await page.evaluate(() => {
    const g = (window as any).__METRO_GAME__;
    g.shopModal.openWorldPreview('MODERN_METRO');
  });
  assert.equal(await page.locator('#world-showcase-overlay').count(), 1);
  await page.keyboard.press('Escape'); await visible('shop-modal');
  assert.equal(await page.locator('#world-showcase-overlay').count(), 0);
  await page.keyboard.press('Escape'); await visible('start-screen');

  // Manager events refresh the open view and lobby, without a reload.
  await emit('OPEN_CHARACTERS', { charId: 'char_jax' });
  await page.evaluate(() => {
    const g = (window as any).__METRO_GAME__;
    const other = g.characterSelectModal.characters.find((c: any) => c.id !== 'char_jax');
    g.progression.unlockCharacter(other.id); g.progression.equipCharacter(other.id);
  });
  assert.match(await page.locator('#char-action-btn').innerText(), /EQUIP RUNNER/);
  await page.evaluate(() => (window as any).__METRO_GAME__.progression.equipCharacter('char_jax'));
  assert.match(await page.locator('#char-action-btn').innerText(), /EQUIPPED/);
  await page.keyboard.press('Escape'); await visible('start-screen');
  await emit('OPEN_SHOP', 'CHARACTERS');
  await page.evaluate(() => {
    const g = (window as any).__METRO_GAME__;
    const other = g.characterSelectModal.characters.find((c: any) => c.id !== 'char_jax');
    g.progression.equipCharacter(other.id);
  });
  assert.match(await page.locator('#cust-runner-name').innerText(), /.+/);
  await page.evaluate(() => (window as any).__METRO_GAME__.progression.equipCharacter('char_jax'));
  assert.match(await page.locator('[data-view-char="char_jax"]').locator('..').innerText(), /EQUIPPED/);
  await page.keyboard.press('Escape');
  await emit('OPEN_BOARDS');
  await page.evaluate(() => {
    const g = (window as any).__METRO_GAME__;
    const other = g.hoverboardSelectModal.boards.find((b: any) => b.id !== g.progression.getSelectedBoard());
    g.progression.unlockBoard(other.id); g.progression.equipBoard(other.id);
    g.hoverboardSelectModal.upgradeManager.setCoins(0);
    g.hoverboardSelectModal.upgradeManager.addCoins(1234);
    g.progression.addHoverboardCharges(3);
  });
  assert.match(await page.locator('#board-action-btn').innerText(), /EQUIP HOVERBOARD/);
  assert.match(await page.locator('#board-wallet-coins').innerText(), /1,234/);
  const charges = await page.evaluate(() => (window as any).__METRO_GAME__.progression.getHoverboardCharges());
  assert.ok((await page.locator('#board-charges-count').innerText()).includes(String(charges)));
  await page.evaluate(() => {
    const g = (window as any).__METRO_GAME__, m = g.hoverboardSelectModal;
    g.progression.equipBoard(m.boards[m.currentBoardIndex].id);
  });
  assert.match(await page.locator('#board-action-btn').innerText(), /EQUIPPED/);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#lobby-coins-val').innerText(), '1,234');
  assert.equal(await page.locator('#lobby-boards-val').innerText(), String(charges));
  await emit('WALLET_UPDATED');
  assert.equal(await page.locator('#lobby-coins-val').innerText(), '1,234');
  await emit('OPEN_SHOP', 'WORLDS');
  await page.evaluate(() => {
    const g = (window as any).__METRO_GAME__;
    g.progression.equipTheme('HISTORIC_QUARTER');
    g.progression.equipTheme('MODERN_METRO');
  });
  assert.match(await page.locator('#cust-world-name').innerText(), /MODERN/i);
  assert.match(await page.locator('[data-preview-world="MODERN_METRO"]').first().locator('..').innerText(), /EQUIPPED/);
  await page.evaluate(() => (window as any).__METRO_GAME__.progression.equipTheme('DYNAMIC'));
  assert.equal(await page.locator('#cust-world-name').innerText(), 'DYNAMIC');
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.progression.getSelectedTheme()), 'DYNAMIC');
  await page.keyboard.press('Escape');
  console.log('PASS immediate equip, wallet, charges, ownership and world preference updates');

  // Repeated OPEN must preserve the same RAF, not create a parallel preview loop.
  for (let i = 0; i < 12; i++) {
    await emit(i % 2 ? 'OPEN_BOARDS' : 'OPEN_CHARACTERS');
    const stable = await page.evaluate(i => {
      const g = (window as any).__METRO_GAME__, bus = (window as any).__METRO_BUS__;
      const m = i % 2 ? g.hoverboardSelectModal : g.characterSelectModal, frame = m.animFrameId;
      bus.emit(i % 2 ? 'OPEN_BOARDS' : 'OPEN_CHARACTERS');
      return m.animFrameId === frame;
    }, i);
    assert.equal(stable, true);
    await page.keyboard.press('Escape'); await visible('start-screen');
  }
  assert.deepEqual(await listenerCounts(), listeners);
  assert.deepEqual(await page.evaluate(() => (window as any).__uiCounts), { restart: 0, reset: 0 });
  console.log('PASS repeated entry, single preview loop, stable listener counts, no run restart/reset');

  await page.locator('#start-settings-btn').click(); await visible('settings-modal');
  await page.locator('#settings-close-btn').click(); await visible('start-screen');
  await page.locator('#start-play-btn').click();
  await page.evaluate(() => (window as any).__METRO_GAME__.openingSequence.skip());
  await page.keyboard.press('Escape'); await visible('pause-modal');
  await page.locator('#pause-settings-btn').click(); await visible('settings-modal');
  await page.keyboard.press('p'); await visible('settings-modal');
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED');
  // Use the real Settings binding UI and preserve Escape's cancel-binding behavior.
  await page.locator('[data-tab="tab-controls"]').click();
  await page.locator('.key-badge-btn').first().click();
  await page.keyboard.press('Escape'); await visible('settings-modal');
  await page.keyboard.press('Escape'); await visible('pause-modal');
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED');
  await page.locator('#pause-settings-btn').click();
  await page.locator('#settings-close-btn').click(); await visible('pause-modal');
  await page.locator('#pause-photo-btn').click();
  await page.keyboard.press('Escape'); await visible('pause-modal');
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PLAYING');
  await page.evaluate(() => {
    const game = (window as any).__METRO_GAME__;
    game.player.crash();
    game.handleGameOver('CRASH', true);
  });
  await page.locator('#game-over-modal').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.getElementById('game-over-score')!.textContent
    === Math.floor((window as any).__METRO_GAME__.score).toLocaleString());
  const result = await page.locator('#game-over-modal').innerText();
  const save = await page.evaluate(() => localStorage.getItem('metro_progression_v1'));
  await page.locator('#game-over-shop-btn').click(); await visible('shop-modal');
  await page.locator('[data-cat="CHARACTERS"]').click();
  await page.locator('[data-view-char]').first().click();
  await page.keyboard.press('Escape'); await visible('shop-modal');
  await page.locator('#shop-close-btn').click(); await visible('game-over-modal');
  assert.equal(await page.locator('#game-over-modal').innerText(), result);
  assert.equal(await page.evaluate(() => localStorage.getItem('metro_progression_v1')), save);
  assert.equal(await page.evaluate(() => (window as any).__uiCounts.restart), 1);
  console.log('PASS gameplay Escape pause/resume, Pause → Settings → Pause, Game Over → Shop → Game Over');
  await emit('OPEN_SHOP'); await emit('OPEN_BOARDS'); await emit('GO_TO_MENU'); await visible('start-screen');
  await page.keyboard.press('Escape'); await visible('start-screen');
  assert.deepEqual(errors, [], 'No runtime exceptions or console errors');
  console.log('VERDICT: PASS — real Chrome routes, live manager updates and navigation resource safety');
} finally { await browser.close(); }
