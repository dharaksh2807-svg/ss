import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = process.env.SHOP_SCREENSHOT_DIR || '/tmp/metro-task3-shop-evidence';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROME_PATH || fs.existsSync(chrome) ? { executablePath: process.env.CHROME_PATH || chrome } : {}),
  args: ['--use-gl=angle', '--use-angle=metal', '--no-sandbox'] });
try {
  const page = await browser.newPage();
  const errors: string[] = [], layouts: any[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => { (window as any).__name = (fn: any) => fn; });
  await page.goto(process.env.UI_TEST_URL || 'http://127.0.0.1:3012');
  await page.waitForFunction(() => !!(window as any).__METRO_GAME__);
  await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.upgradeManager.setCoins(10000));
  await page.locator('#start-shop-btn').click();
  const categories = ['FEATURED', 'UPGRADES', 'BOOSTERS', 'CHARACTERS', 'HOVERBOARDS', 'WORLDS'];
  for (const [width, height] of [[1440, 900], [1280, 720], [1024, 768], [390, 844], [360, 800]]) {
    await page.setViewportSize({ width, height });
    for (const category of categories) {
      await page.locator(`[data-cat="${category}"]`).click();
      await page.waitForTimeout(180); // Let tab/color transitions finish before recording evidence.
      const result = await page.evaluate(category => {
        const content = document.querySelector<HTMLElement>('#shop-content')!, panel = document.querySelector('.shop-card')!;
        const problems: string[] = [];
        const cb = content.getBoundingClientRect();
        const rect = panel.getBoundingClientRect();
        if (rect.left < 0 || rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1) problems.push('panel outside viewport');
        if (document.body.scrollWidth > innerWidth || content.scrollWidth > content.clientWidth + 1) problems.push('horizontal overflow');
        for (const tab of document.querySelectorAll<HTMLElement>('#shop-tabs button')) {
          if (tab.scrollWidth > tab.clientWidth + 1 || tab.scrollHeight > tab.clientHeight + 1) problems.push('clipped tab: ' + tab.textContent);
          const b = tab.getBoundingClientRect();
          if (b.left < rect.left || b.right > rect.right) problems.push('tab out of panel');
        }
        const cards = [...content.querySelectorAll<HTMLElement>('.shop-product-card, .world-shop-card')];
        for (const card of cards) {
          const b = card.getBoundingClientRect();
          if (b.left < cb.left - 1 || b.right > cb.right + 1) problems.push('card width overflow');
          for (const button of card.querySelectorAll<HTMLElement>('button')) {
            button.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            const box = button.getBoundingClientRect(), parent = card.getBoundingClientRect();
            if (box.left < parent.left || box.right > parent.right + 1 || button.scrollWidth > button.clientWidth + 1 || button.scrollHeight > button.clientHeight + 1) problems.push('clipped action: ' + button.textContent?.trim());
            const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
            if (!hit || !(hit === button || button.contains(hit))) problems.push('unreachable action: ' + button.textContent?.trim());
          }
        }
        const nested = [...content.querySelectorAll<HTMLElement>('*')].filter(el => /auto|scroll/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1);
        if (nested.length) problems.push('nested vertical scrolling');
        const expected = { FEATURED: 6, UPGRADES: 5, BOOSTERS: 4, CHARACTERS: 6, HOVERBOARDS: 4, WORLDS: 11 } as any;
        if (cards.length !== expected[category]) problems.push('missing products: ' + cards.length);
        content.scrollTop = 0;
        return { category, width: innerWidth, height: innerHeight, products: cards.length, problems };
      }, category);
      assert.deepEqual(result.problems, [], `${width}×${height} ${category}`);
      layouts.push(result);
      await page.screenshot({ path: path.join(out, `${width}x${height}-${category.toLowerCase()}.png`) });
    }
    // Both the world showcase and purchase dialog remain usable on every viewport.
    await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.openWorldPreview('ORBITAL_HALO'));
    await page.locator('#showcase-buy-btn').click();
    await page.locator('#confirm-cancel-btn').click();
    assert.equal(await page.locator('#world-confirm-overlay').count(), 0);
    console.log(`PASS ${width}×${height}: six categories, all products/actions reachable, dialogs usable`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-cat="BOOSTERS"]').click();
  const before = await page.evaluate(() => {
    const g = (window as any).__METRO_GAME__;
    const manager = g.shopModal.upgradeManager;
    let calls = 0;
    const purchase = g.progression.purchaseHoverboardCharges.bind(g.progression);
    g.progression.purchaseHoverboardCharges = () => { calls++; return purchase(); };
    (window as any).__packCalls = () => calls;
    return { coins: manager.getCoins(), charges: g.progression.getHoverboardCharges() };
  });
  await page.locator('[data-action="buy-board-pack"]').click();
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.upgradeManager.getCoins()), before.coins);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => (window as any).__packCalls()), 0);
  assert.equal(await page.locator('#world-confirm-overlay').count(), 0);
  await page.locator('[data-action="buy-board-pack"]').click();
  await page.evaluate(() => {
    const button = document.getElementById('confirm-execute-btn')!;
    button.click(); button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  assert.equal(await page.evaluate(() => (window as any).__packCalls()), 1);
  assert.deepEqual(await page.evaluate(() => {
    const g = (window as any).__METRO_GAME__;
    return { coins: g.shopModal.upgradeManager.getCoins(), charges: g.progression.getHoverboardCharges() };
  }), { coins: before.coins - 300, charges: before.charges + 3 });
  assert.equal(await page.locator('#shop-wallet-coins').innerText(), (before.coins - 300).toLocaleString());
  assert.match(await page.locator('[data-product="buy-board-pack"]').innerText(), new RegExp(`Inventory: ${before.charges + 3} board charges`));
  // Live balance changes while a confirmation is open must update/restrict spending.
  await page.locator('[data-action="buy-megapack"]').click();
  await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.upgradeManager.setCoins(0));
  assert.equal(await page.locator('#confirm-execute-btn').isDisabled(), true);
  assert.match(await page.locator('[data-confirm-remaining]').innerText(), /Need 850 more coins/);
  await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.upgradeManager.setCoins(10000));
  assert.equal(await page.locator('#confirm-execute-btn').isEnabled(), true);
  await page.keyboard.press('Escape');
  await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.openWorldPreview('NEON_RAINLINE'));
  await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.upgradeManager.setCoins(0));
  assert.equal(await page.locator('#showcase-buy-btn').isDisabled(), true);
  assert.match(await page.locator('#showcase-funds-note').innerText(), /Need 3,000 more coins/);
  await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.upgradeManager.setCoins(10000));
  assert.equal(await page.locator('#showcase-buy-btn').isEnabled(), true);
  await page.keyboard.press('Escape');
  await page.locator('[data-cat="CHARACTERS"]').click();
  await page.locator('[data-buy-char="char_luna"]').click();
  await page.locator('#confirm-execute-btn').click();
  assert.match(await page.locator('[data-char-id="char_luna"]').innerText(), /EQUIPPED/);
  assert.equal(await page.locator('[data-char-id="char_luna"] [data-buy-char]').count(), 0);
  await page.locator('[data-cat="HOVERBOARDS"]').click();
  await page.locator('[data-buy-board="board_pulse_rider"]').click();
  await page.locator('#confirm-execute-btn').click();
  assert.match(await page.locator('[data-board-id="board_pulse_rider"]').innerText(), /EQUIPPED/);
  await page.locator('[data-cat="UPGRADES"]').click();
  await page.locator('[data-upgrade="MAGNET"]').click();
  await page.locator('#confirm-execute-btn').click();
  assert.match(await page.locator('[data-product="MAGNET"]').innerText(), /Level 2 of 5/);
  await page.locator('[data-cat="WORLDS"]').click();
  await page.locator('[data-buy-world="ORBITAL_HALO"]').click();
  await page.locator('#confirm-execute-btn').click();
  assert.equal(await page.locator('[data-equip-world="ORBITAL_HALO"]').count(), 1);
  await page.locator('[data-equip-world="ORBITAL_HALO"]').click();
  assert.match(await page.locator('[data-preview-world="ORBITAL_HALO"]').first().locator('..').innerText(), /EQUIPPED/);
  await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.openWorldPreview('VIP_EXPRESS'));
  assert.equal(await page.locator('#showcase-equip-btn').count(), 0, 'signature world does not invent permanent ownership');
  assert.equal(await page.locator('#showcase-buy-btn').count(), 0, 'signature world does not offer a zero-price purchase');
  assert.equal(await page.locator('#showcase-runner-btn').count(), 1);
  await page.keyboard.press('Escape');
  await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.upgradeManager.setCoins(0));
  assert.equal(await page.locator('[data-buy-world="NEON_RAINLINE"]').isDisabled(), true);
  assert.match(await page.locator('[data-preview-world="NEON_RAINLINE"]').first().locator('..').innerText(), /Need 3,000 more coins/);
  await page.locator('[data-cat="CHARACTERS"]').click();
  assert.equal(await page.locator('[data-buy-char="char_cruz"]').isDisabled(), true);
  assert.equal(await page.locator('[data-trial-char="char_modi"]').count(), 1);
  await page.evaluate(() => (window as any).__METRO_GAME__.progression.setModiFreeRuns(0));
  await page.locator('[data-cat="FEATURED"]').click();
  assert.equal(await page.locator('[data-trial-char="char_modi"]').count(), 0);
  await page.locator('#shop-close-btn').click();
  assert.equal(await page.locator('#start-screen').isVisible(), true);
  assert.deepEqual(errors, [], 'no browser runtime/console errors');
  fs.writeFileSync(path.join(out, 'layout-results.json'), JSON.stringify({ layouts, errors, purchaseChecks: 'PASS' }, null, 2));
  console.log(`VERDICT: PASS — 30 category/viewport layouts, truthful action states, confirmations, live updates; screenshots: ${out}`);
} finally { await browser.close(); }
