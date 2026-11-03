import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const out = process.env.SHOWROOM_SCREENSHOT_DIR || '/tmp/metro-task4-showrooms';
fs.mkdirSync(out, { recursive: true });
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROME_PATH || fs.existsSync(chrome) ? { executablePath: process.env.CHROME_PATH || chrome } : {}),
  args: ['--use-gl=angle', '--use-angle=metal', '--no-sandbox'] });
try {
  const page = await browser.newPage();
  const errors: string[] = [], layouts: any[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => {
    (window as any).__name = (fn: any) => fn;
    const add = window.addEventListener.bind(window), listeners = new Set();
    (window as any).__showroomKeyListeners = listeners;
    window.addEventListener = ((event: string, callback: any, options: any) => {
      if (event === 'keydown') listeners.add(callback);
      return add(event, callback, options);
    }) as any;
  });
  await page.goto(process.env.UI_TEST_URL || 'http://127.0.0.1:3024');
  await page.waitForFunction(() => !!(window as any).__METRO_GAME__);
  await page.evaluate(() => (window as any).__METRO_GAME__.characterSelectModal.upgradeManager.setCoins(250000));
  for (const [width, height] of [[1440, 900], [1280, 720], [1024, 768], [390, 844], [360, 800]]) {
    await page.setViewportSize({ width, height });
    for (const prefix of ['char', 'board']) {
      await page.locator(prefix === 'char' ? '#cust-runner-btn' : '#cust-board-btn').click();
      await page.waitForTimeout(220);
      const modalId = prefix === 'char' ? 'character-select-modal' : 'hoverboard-select-modal';
      const result = await page.evaluate(({ prefix, modalId }) => {
        const modal = document.getElementById(modalId)!, panel = modal.querySelector<HTMLElement>('.showroom-panel')!;
        const stage = modal.querySelector<HTMLElement>('.showroom-stage-layout')!;
        const problems: string[] = [];
        const bounds = panel.getBoundingClientRect();
        if (bounds.x < 0 || bounds.right > innerWidth || bounds.bottom > innerHeight) problems.push('panel outside viewport');
        if (panel.scrollWidth > panel.clientWidth + 1 || stage.scrollWidth > stage.clientWidth + 1 || document.body.scrollWidth > innerWidth) problems.push('horizontal overflow');
        for (const selector of [`#${prefix}-action-btn`, `#${prefix}-home-btn`, `#${prefix}-close-btn`]) {
          const button = modal.querySelector<HTMLElement>(selector)!, b = button.getBoundingClientRect();
          if (b.y < bounds.y || b.bottom > bounds.bottom || b.right > bounds.right || button.scrollWidth > button.clientWidth + 1 || button.scrollHeight > button.clientHeight + 1) problems.push('clipped fixed action ' + selector);
          const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
          if (!hit || !(button === hit || button.contains(hit))) problems.push('blocked fixed action ' + selector);
        }
        for (const tab of modal.querySelectorAll<HTMLElement>('.char-tab')) {
          if (tab.scrollWidth > tab.clientWidth + 1 || tab.scrollHeight > tab.clientHeight + 1) problems.push('clipped browse tab');
        }
        const scrolls = [...modal.querySelectorAll<HTMLElement>('*')].filter(el => /auto|scroll/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1);
        if (scrolls.length > 1) problems.push('multiple vertical scrolling surfaces');
        for (const outfit of modal.querySelectorAll<HTMLElement>('.outfit-card')) {
          outfit.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          const b = outfit.getBoundingClientRect();
          if (outfit.scrollWidth > outfit.clientWidth + 1 || b.x < bounds.x || b.right > bounds.right) problems.push('clipped outfit control');
        }
        // The primary action remains fixed even while inspecting controls deep in the scroller.
        const action = document.getElementById(prefix + '-action-btn')!.getBoundingClientRect();
        if (action.bottom > bounds.bottom) problems.push('action lost after scroll');
        stage.scrollTop = 0;
        const details = modal.querySelector<HTMLElement>('.showroom-details-panel')!;
        details.scrollTop = 0;
        const canvas = document.getElementById(prefix + '-preview-canvas')!.getBoundingClientRect();
        const angles = modal.querySelector('#char-view-angles')?.getBoundingClientRect();
        if (angles && angles.bottom > canvas.top) problems.push('camera controls overlap preview');
        return { width: innerWidth, height: innerHeight, prefix, problems, canvas: { width: canvas.width, height: canvas.height }, scrolls: scrolls.length };
      }, { prefix, modalId });
      assert.deepEqual(result.problems, [], `${width}×${height} ${prefix}`);
      assert.ok(result.canvas.height >= 200 && result.canvas.width >= 200);
      layouts.push(result);
      await page.screenshot({ path: path.join(out, `${width}x${height}-${prefix}.png`) });
      await page.locator(`#${prefix}-close-btn`).click();
    }
    console.log(`PASS ${width}×${height}: both showrooms, fixed actions, full browse labels and one scroll surface`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  // Browse, purchase/equip, choose an outfit, and return through Home.
  await page.locator('#cust-runner-btn').click();
  await page.locator('#char-tabs [data-char-id="char_luna"]').click();
  assert.match(await page.locator('#char-action-btn').innerText(), /BUY RUNNER — 1,500/);
  await page.locator('#char-action-btn').click();
  assert.match(await page.locator('#char-action-btn').innerText(), /EQUIPPED/);
  const outfitId = await page.locator('#char-outfit-list button').nth(1).getAttribute('data-outfit-id');
  await page.locator('#char-outfit-list button').nth(1).click();
  assert.match(await page.locator('#char-action-btn').innerText(), /BUY OUTFIT/);
  await page.locator('#char-action-btn').click();
  assert.match(await page.locator('#char-action-btn').innerText(), /EQUIPPED/);
  await page.locator('#char-home-btn').click();
  assert.equal(await page.locator('#cust-runner-name').innerText(), 'LUNA');
  await page.locator('#cust-runner-btn').click();
  assert.equal(await page.locator('#char-outfit-list .selected').getAttribute('data-outfit-id'), outfitId);
  assert.equal(await page.locator('#char-outfit-list .selected').getAttribute('aria-pressed'), 'true');
  // Native keyboard activation should select one outfit without changing the runner.
  await page.locator('#char-outfit-list button').first().focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#char-name').innerText(), 'LUNA');
  assert.match(await page.locator('#char-action-btn').innerText(), /EQUIP RUNNER/);
  await page.locator('#char-action-btn').click();
  await page.locator('#char-home-btn').click();
  await page.locator('#cust-board-btn').click();
  await page.locator('#board-tabs [data-board-id="board_pulse_rider"]').click();
  assert.match(await page.locator('#board-action-btn').innerText(), /BUY BOARD — 2,500/);
  await page.locator('#board-action-btn').click();
  assert.match(await page.locator('#board-action-btn').innerText(), /EQUIPPED/);
  assert.match(await page.locator('#board-ability-details').innerText(), /Duration:[\s\S]*22s[\s\S]*Cooldown:[\s\S]*25s/);
  const beforeCharges = await page.evaluate(() => {
    const g = (window as any).__METRO_GAME__;
    return { coins: g.hoverboardSelectModal.upgradeManager.getCoins(), charges: g.progression.getHoverboardCharges(), board: g.progression.getSelectedBoard(), owned: g.progression.getUnlockedBoards() };
  });
  await page.locator('#board-buy-charges-btn').click();
  assert.match(await page.locator('#board-feedback').innerText(), /Spent 300 coins · Received 3 charges/);
  assert.match(await page.locator('#board-charges-count').innerText(), new RegExp(String(beforeCharges.charges + 3)));
  assert.deepEqual(await page.evaluate(() => {
    const g = (window as any).__METRO_GAME__;
    return { coins: g.hoverboardSelectModal.upgradeManager.getCoins(), charges: g.progression.getHoverboardCharges(), board: g.progression.getSelectedBoard(), owned: g.progression.getUnlockedBoards() };
  }), { ...beforeCharges, coins: beforeCharges.coins - 300, charges: beforeCharges.charges + 3 });
  await page.locator('#board-home-btn').click();
  assert.equal(await page.locator('#cust-board-name').innerText(), 'PULSE RIDER');
  assert.equal(await page.locator('#lobby-boards-val').innerText(), String(beforeCharges.charges + 3));
  // Both Back journeys retain the originating Shop tab.
  await page.locator('#start-shop-btn').click();
  await page.locator('[data-cat="CHARACTERS"]').click();
  await page.locator('[data-view-char="char_luna"]').click();
  await page.locator('#char-close-btn').click();
  assert.equal(await page.locator('[data-cat="CHARACTERS"]').getAttribute('aria-current'), 'page');
  await page.locator('[data-cat="HOVERBOARDS"]').click();
  await page.locator('[data-view-board]').first().click();
  await page.locator('#board-close-btn').click();
  assert.equal(await page.locator('[data-cat="HOVERBOARDS"]').getAttribute('aria-current'), 'page');
  await page.locator('#shop-close-btn').click();
  const baseline = await page.evaluate(() => {
    const g = (window as any).__METRO_GAME__;
    (window as any).__showroomRenderers = [g.characterSelectModal.renderer, g.hoverboardSelectModal.renderer];
    return { keys: (window as any).__showroomKeyListeners.size, bus: [...(window as any).__METRO_BUS__.listeners].map(([event, set]: any) => [event, set.size]) };
  });
  for (let i = 0; i < 16; i++) {
    const prefix = i % 2 ? 'board' : 'char';
    await page.locator(prefix === 'char' ? '#cust-runner-btn' : '#cust-board-btn').click();
    const consistent = await page.evaluate(prefix => {
      const g = (window as any).__METRO_GAME__, m = prefix === 'char' ? g.characterSelectModal : g.hoverboardSelectModal;
      const frame = m.animFrameId;
      (window as any).__METRO_BUS__.emit(prefix === 'char' ? 'OPEN_CHARACTERS' : 'OPEN_BOARDS');
      return m.animFrameId === frame && m.renderer === (window as any).__showroomRenderers[prefix === 'char' ? 0 : 1];
    }, prefix);
    assert.equal(consistent, true, 'same renderer and one loop on duplicate OPEN');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(prefix => {
      const g = (window as any).__METRO_GAME__, m = prefix === 'char' ? g.characterSelectModal : g.hoverboardSelectModal;
      return !m.isRendering && m.animFrameId === null && m.element.classList.contains('hidden');
    }, prefix), true);
  }
  assert.deepEqual(await page.evaluate(() => ({ keys: (window as any).__showroomKeyListeners.size, bus: [...(window as any).__METRO_BUS__.listeners].map(([event, set]: any) => [event, set.size]) })), baseline);
  // A real drag still rotates the retained preview.
  await page.locator('#cust-board-btn').click();
  const canvas = await page.locator('#board-preview-canvas').boundingBox();
  const angle = await page.evaluate(() => (window as any).__METRO_GAME__.hoverboardSelectModal.turntableTargetRotationY);
  await page.mouse.move(canvas!.x + canvas!.width / 2, canvas!.y + canvas!.height / 2);
  await page.mouse.down(); await page.mouse.move(canvas!.x + canvas!.width / 2 + 70, canvas!.y + canvas!.height / 2, { steps: 5 }); await page.mouse.up();
  assert.ok(Math.abs(await page.evaluate(() => (window as any).__METRO_GAME__.hoverboardSelectModal.turntableTargetRotationY) - angle) > .5);
  await page.locator('#board-close-btn').click();
  // Saved selections survive an actual browser reload; progression and currency are not reset.
  const save = await page.evaluate(() => localStorage.getItem('metro_progression_v1'));
  await page.reload(); await page.waitForFunction(() => !!(window as any).__METRO_GAME__);
  assert.equal(await page.locator('#cust-runner-name').innerText(), 'LUNA');
  assert.equal(await page.locator('#cust-board-name').innerText(), 'PULSE RIDER');
  assert.equal(await page.evaluate(() => localStorage.getItem('metro_progression_v1')), save);
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ layouts, errors, journeys: 'PASS', repeatedCycles: 16 }, null, 2));
  console.log(`VERDICT: PASS — runner/outfit and board journeys, charges, Shop Back, persistence, 16 cycles and drag; screenshots: ${out}`);
} finally { await browser.close(); }
