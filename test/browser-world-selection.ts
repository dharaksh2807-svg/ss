import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const out = process.env.WORLD_SCREENSHOT_DIR || '/tmp/metro-world-selection-evidence';
fs.mkdirSync(out, { recursive: true });
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROME_PATH || fs.existsSync(chrome) ? { executablePath: process.env.CHROME_PATH || chrome } : {}),
  args: ['--use-gl=angle', '--use-angle=metal', '--no-sandbox'] });
try {
  // An ephemeral browser context never loads the player's profile or existing save.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors: string[] = [], layouts: any[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => { (window as any).__name = (fn: any) => fn; });
  await page.goto(process.env.UI_TEST_URL || 'http://127.0.0.1:3012');
  await page.waitForFunction(() => !!(window as any).__METRO_GAME__);
  await page.evaluate(() => {
    const g = (window as any).__METRO_GAME__;
    g.shopModal.upgradeManager.setCoins(15000);
    g.progression.purchaseTheme('NEON_RAINLINE');
    g.progression.equipTheme('HISTORIC_QUARTER');
  });
  const selected = () => page.evaluate(() => (window as any).__METRO_GAME__.progression.getSelectedTheme());
  async function open() { await page.locator('#cust-world-btn').click(); await page.locator('#environment-modal').waitFor({ state: 'visible' }); await page.waitForTimeout(250); }
  await open();
  assert.match(await page.locator('#env-current-world').innerText(), /Historic/);
  await page.locator('[data-env-id="MODERN_METRO"]').click();
  assert.equal(await selected(), 'HISTORIC_QUARTER', 'browsing does not overwrite saved preference');
  await page.locator('#env-close-btn').click();
  assert.equal(await selected(), 'HISTORIC_QUARTER');
  await open(); await page.locator('[data-env-id="MODERN_METRO"]').click();
  await page.locator('#env-confirm-btn').click();
  assert.equal(await selected(), 'MODERN_METRO');
  assert.equal(await page.locator('#start-screen').isVisible(), true);
  assert.match(await page.locator('#cust-world-name').innerText(), /MODERN/);
  await open(); await page.locator('[data-equip-env="NEON_RAINLINE"]').click();
  assert.equal(await selected(), 'NEON_RAINLINE');
  assert.equal(await page.locator('#start-screen').isVisible(), true);
  console.log('PASS saved-theme preservation, free selection, owned equip and immediate lobby state');
  await open();
  for (const [width, height] of [[1440, 900], [1280, 720], [1024, 768], [390, 844], [360, 800]]) {
    await page.setViewportSize({ width, height });
    const problems = await page.evaluate(() => {
      const list = document.querySelector<HTMLElement>('#env-options-list')!;
      const panel = document.querySelector('.env-modal-card')!.getBoundingClientRect();
      const failures: string[] = [];
      if (panel.left < 0 || panel.right > innerWidth || panel.bottom > innerHeight + 1) failures.push('panel outside viewport');
      if (document.body.scrollWidth > innerWidth || list.scrollWidth > list.clientWidth + 1) failures.push('horizontal overflow');
      if (list.querySelectorAll('.env-world-card').length !== 11) failures.push('missing catalog worlds');
      for (const button of document.querySelectorAll<HTMLElement>('#environment-modal button')) {
        button.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        const box = button.getBoundingClientRect();
        if (button.scrollWidth > button.clientWidth + 1 || button.scrollHeight > button.clientHeight + 1) failures.push('clipped control ' + button.textContent?.trim());
        const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        if (!hit || !(hit === button || button.contains(hit))) failures.push('unreachable control ' + button.textContent?.trim());
      }
      list.scrollTop = 0;
      return failures;
    });
    assert.deepEqual(problems, [], `${width}x${height}`);
    layouts.push({ width, height, worlds: 11, problems });
    await page.screenshot({ path: path.join(out, `${width}x${height}-worlds.png`) });
    await page.locator('[data-world-id="NEON_RAINLINE"]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(out, `${width}x${height}-world-cards.png`) });
  }
  assert.equal(await page.locator('[data-env-id="ORBITAL_HALO"]').count(), 0, 'locked world cannot be selected');
  const previous = await selected();
  await page.evaluate(() => {
    const m = (window as any).__METRO_GAME__.environmentSelectModal;
    m.selectedPreference = 'ORBITAL_HALO'; m.applySelection();
  });
  assert.equal(await selected(), previous);
  assert.match(await page.locator('#env-feedback').innerText(), /locked/);
  await page.locator('[data-shop-world="ORBITAL_HALO"][data-world-action="PREVIEW"]').last().click();
  assert.match(await page.locator('#showcase-dialog-title').innerText(), /Orbital Halo/);
  assert.equal(await page.locator('#environment-modal').isVisible(), false);
  await page.keyboard.press('Escape'); await page.locator('#shop-close-btn').click();
  assert.equal(await page.locator('#environment-modal').isVisible(), true);
  assert.equal(await selected(), previous);
  await page.locator('[data-shop-world="ORBITAL_HALO"][data-world-action="BUY"]').click();
  assert.match(await page.locator('#confirm-dialog-title').innerText(), /Orbital Halo/);
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.upgradeManager.getCoins()), 12000);
  await page.keyboard.press('Escape');
  await page.locator('#shop-close-btn').click();
  await page.locator('[data-shop-world="ORBITAL_HALO"][data-world-action="PREVIEW"]').last().click();
  await page.locator('#showcase-buy-btn').click();
  await page.locator('#confirm-execute-btn').click();
  assert.equal(await page.locator('[data-equip-world="ORBITAL_HALO"]').count(), 1);
  await page.locator('#shop-close-btn').click();
  assert.equal(await page.locator('[data-env-id="ORBITAL_HALO"]').count(), 1, 'selector sees purchase immediately');
  assert.equal(await page.locator('[data-shop-world="ORBITAL_HALO"]').count(), 0);
  await page.locator('[data-equip-env="ORBITAL_HALO"]').click();
  assert.equal(await selected(), 'ORBITAL_HALO');
  await page.locator('#start-shop-btn').click(); await page.locator('[data-cat="WORLDS"]').click();
  assert.match(await page.locator('[data-preview-world="ORBITAL_HALO"]').first().locator('..').innerText(), /EQUIPPED/);
  await page.locator('[data-action="world-home"]').click();
  assert.equal(await page.locator('#start-screen').isVisible(), true);
  await page.reload(); await page.waitForFunction(() => !!(window as any).__METRO_GAME__);
  assert.equal(await selected(), 'ORBITAL_HALO');
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.shopModal.upgradeManager.getCoins()), 7500);
  console.log('PASS locked rejection, targeted preview/confirmation, purchase, Shop/selector consistency, Home/Back and reload');
  await open(); await page.locator('[data-env-id="DYNAMIC"]').click(); await page.locator('#env-confirm-btn').click();
  assert.equal(await selected(), 'DYNAMIC');
  assert.equal(await page.locator('#cust-world-name').innerText(), 'DYNAMIC');
  await page.locator('#start-shop-btn').click(); await page.locator('[data-cat="WORLDS"]').click();
  const pool = async () => page.evaluate(async () => {
    const { getDynamicEnvironmentIds } = await import('/src/environment/WorldCatalog.ts');
    return getDynamicEnvironmentIds((window as any).__METRO_GAME__.progression.getState());
  });
  assert.equal((await pool()).length, 4);
  await page.locator('label[for="premium-dynamic-toggle"]').click();
  assert.equal(await page.locator('[data-premium-dynamic]').isChecked(), true);
  assert.equal((await pool()).length, 6);
  assert.equal((await pool()).includes('VIP_EXPRESS'), false);
  assert.equal(await selected(), 'DYNAMIC');
  await page.locator('#shop-close-btn').click();
  await page.reload(); await page.waitForFunction(() => !!(window as any).__METRO_GAME__);
  assert.equal(await selected(), 'DYNAMIC');
  assert.equal((await pool()).length, 6);
  console.log('PASS Dynamic selection/reload and unchanged premium/signature eligibility');
  await page.locator('#start-play-btn').click();
  await page.evaluate(() => (window as any).__METRO_GAME__.openingSequence.skip());
  await page.keyboard.press('Escape');
  const active = await page.evaluate(() => (window as any).__METRO_GAME__.trackManager.getActiveEnvironment());
  await page.evaluate(() => (window as any).__METRO_BUS__.emit('OPEN_ENVIRONMENT_SELECT'));
  await page.locator('[data-equip-env="NEON_RAINLINE"]').click();
  assert.equal(await selected(), 'NEON_RAINLINE');
  assert.equal(await page.locator('#pause-modal').isVisible(), true);
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED');
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.trackManager.getActiveEnvironment()), active);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PLAYING');
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.trackManager.getActiveEnvironment()), active);
  await page.keyboard.press('Escape'); await page.locator('#pause-menu-btn').click();
  await page.locator('#start-play-btn').click();
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.trackManager.getActiveEnvironment()), 'NEON_RAINLINE');
  assert.deepEqual(errors, [], 'No browser runtime or console errors');
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ layouts, errors, flows: 'PASS', save: 'isolated ephemeral browser context' }, null, 2));
  console.log(`VERDICT: PASS — all world flows, five responsive sizes, reload, Dynamic eligibility and deferred gameplay; screenshots: ${out}`);
} finally { await browser.close(); }
