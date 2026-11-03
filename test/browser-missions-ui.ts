import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const out = process.env.MISSIONS_SCREENSHOT_DIR || '/tmp/metro-missions-evidence';
fs.mkdirSync(out, { recursive: true });
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROME_PATH || fs.existsSync(chrome) ? { executablePath: process.env.CHROME_PATH || chrome } : {}),
  args: ['--use-gl=angle', '--use-angle=metal', '--no-sandbox'] });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'Asia/Kolkata' });
  const page = await context.newPage();
  const errors: string[] = [], layouts: any[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => { (window as any).__name = (fn: any) => fn; });
  await page.goto(process.env.UI_TEST_URL || 'http://127.0.0.1:3012');
  await page.waitForFunction(() => !!(window as any).__METRO_GAME__);
  const expected = await page.evaluate(async () => {
    const g = (window as any).__METRO_GAME__, s = g.progression.getState();
    const { ACHIEVEMENTS } = await import('/src/progression/MissionCatalog.ts');
    // Fixtures live only in this ephemeral browser context. No player profile is loaded.
    g.shopModal.upgradeManager.setCoins(1000);
    s.activeMissions.forEach((m: any, i: number) => { m.progress = i === 1 ? Math.floor(m.target * .4) : m.target; m.completed = i !== 1; m.claimed = i === 2; });
    s.dailyChallenges.forEach((m: any, i: number) => { m.progress = i === 0 ? m.target : Math.floor(m.target * .3); m.completed = i === 0; m.claimed = false; });
    const distance = ACHIEVEMENTS.find((d: any) => d.id === 'ach_distance')!;
    s.achievements.ach_distance = { id: distance.id, currentProgress: distance.tiers[2].target, completedTiers: ['BRONZE', 'SILVER', 'GOLD'], claimedTiers: ['BRONZE', 'SILVER'] };
    const runs = ACHIEVEMENTS.find((d: any) => d.id === 'ach_runs')!;
    s.achievements.ach_runs = { id: runs.id, currentProgress: runs.tiers[2].target, completedTiers: ['BRONZE', 'SILVER', 'GOLD'], claimedTiers: ['BRONZE', 'SILVER', 'GOLD'] };
    s.seasonPass.tokensCollected = s.seasonPass.milestones[1].tokensRequired;
    s.seasonPass.claimedMilestones = [0];
    const calls: Record<string, number> = {};
    for (const name of ['claimMissionReward', 'claimDailyReward', 'claimAchievementReward', 'claimSeasonMilestone']) {
      const original = g.progression[name].bind(g.progression);
      g.progression[name] = (...args: any[]) => { calls[name] = (calls[name] || 0) + 1; return original(...args); };
    }
    (window as any).__claimCalls = calls;
    return { missions: s.activeMissions.length, daily: s.dailyChallenges.length, achievements: ACHIEVEMENTS.length, season: s.seasonPass.milestones.length,
      missionReward: s.activeMissions[0].rewardCoins, dailyReward: s.dailyChallenges[0].rewardCoins,
      achievementCoins: distance.tiers[2].rewardCoins, achievementKeys: distance.tiers[2].rewardKeys,
      keys: g.progression.getKeys(), charges: g.progression.getHoverboardCharges(), seasonReward: s.seasonPass.milestones[1] };
  });
  await page.locator('#start-missions-btn').click(); await page.waitForTimeout(250);
  const interval = await page.evaluate(() => (window as any).__METRO_GAME__.missionsModal.timerInterval);
  const listenerCounts = () => page.evaluate(() => [...(window as any).__METRO_BUS__.listeners].map(([event, callbacks]: any) => [event, callbacks.size]));
  const initialListeners = await listenerCounts();
  for (const [width, height] of [[1440, 900], [1280, 720], [1024, 768], [390, 844], [360, 800]]) {
    await page.setViewportSize({ width, height });
    for (const tab of ['MISSIONS', 'DAILY', 'ACHIEVEMENTS', 'SEASON']) {
      await page.locator(`#missions-tabs [data-tab="${tab}"]`).click();
      await page.waitForTimeout(220);
      const record = await page.evaluate(({ tab, expected }) => {
        const panel = document.querySelector('.missions-modal-card')!.getBoundingClientRect();
        const content = document.querySelector<HTMLElement>('#missions-content')!;
        const problems: string[] = [];
        if (panel.left < 0 || panel.right > innerWidth + 1 || panel.bottom > innerHeight + 1) problems.push('panel overflow');
        if (document.body.scrollWidth > innerWidth || content.scrollWidth > content.clientWidth + 1) problems.push('horizontal overflow');
        for (const button of document.querySelectorAll<HTMLElement>('#missions-modal button')) {
          button.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          const b = button.getBoundingClientRect();
          if (button.scrollWidth > button.clientWidth + 1 || button.scrollHeight > button.clientHeight + 1) problems.push('clipped button ' + button.textContent?.trim());
          const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
          if (!hit || !(hit === button || button.contains(hit))) problems.push('unreachable button ' + button.textContent?.trim());
        }
        const nested = [...content.querySelectorAll<HTMLElement>('*')].filter(el => /auto|scroll/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1);
        if (nested.length) problems.push('nested vertical scroll');
        const cards = content.querySelectorAll('.progression-card, .season-milestone-card');
        const count = ({ MISSIONS: expected.missions, DAILY: expected.daily, ACHIEVEMENTS: expected.achievements, SEASON: expected.season } as any)[tab];
        if (cards.length !== count) problems.push('missing objectives/rewards');
        for (const bar of content.querySelectorAll<HTMLElement>('[role="progressbar"]')) {
          const value = Number(bar.getAttribute('aria-valuenow')), max = Number(bar.getAttribute('aria-valuemax'));
          const width = Number((bar.firstElementChild as HTMLElement).style.width.replace('%', ''));
          if (width !== Math.min(100, Math.floor(value / max * 100))) problems.push('progress bar disagrees with value');
        }
        content.scrollTop = 0;
        return { tab, width: innerWidth, height: innerHeight, count: cards.length, problems };
      }, { tab, expected });
      assert.deepEqual(record.problems, [], `${width}x${height} ${tab}`); layouts.push(record);
      await page.screenshot({ path: path.join(out, `${width}x${height}-${tab.toLowerCase()}.png`) });
    }
    console.log(`PASS ${width}×${height}: four sections, all objectives/rewards and controls reachable`);
  }
  await page.locator('#missions-tabs [data-tab="ACHIEVEMENTS"]').click();
  await page.locator('#achievement-category').selectOption('DISTANCE');
  assert.equal(await page.locator('[data-achievement-id]').count(), 2);
  assert.match(await page.locator('#missions-content').innerText(), /Showing 2 of 10/);
  await page.locator('#achievement-category').selectOption('ALL');
  assert.match(await page.locator('[data-achievement-id="ach_distance"]').innerText(), /1 KEY/);
  assert.match(await page.locator('[data-achievement-id="ach_runs"]').innerText(), /ALL TIERS CLAIMED/);
  await page.locator('#missions-content').evaluate(el => { el.scrollTop = el.scrollHeight; });
  await page.screenshot({ path: path.join(out, '360x800-achievements-bottom.png') });
  const claim = async (selector: string, method: string) => {
    await page.locator(selector).evaluate((button: HTMLButtonElement) => {
      button.click(); button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    assert.equal(await page.evaluate(method => (window as any).__claimCalls[method], method), 1);
  };
  await claim('[data-action="claim-achievement"][data-id="ach_distance"]', 'claimAchievementReward');
  assert.match(await page.locator('[data-achievement-id="ach_distance"]').innerText(), /MAX TIER/);
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.progression.getKeys()), expected.keys + expected.achievementKeys);
  await page.locator('#missions-tabs [data-tab="MISSIONS"]').click();
  await claim('[data-action="claim-mission"]', 'claimMissionReward');
  assert.equal(await page.locator('[data-action="claim-mission"]').count(), 0);
  await page.locator('#missions-tabs [data-tab="DAILY"]').click();
  const countdown = await page.locator('#daily-countdown-val').innerText();
  await page.waitForFunction(previous => document.getElementById('daily-countdown-val')!.textContent !== previous, countdown, { timeout: 5000 });
  await claim('[data-action="claim-daily"]', 'claimDailyReward');
  assert.equal(await page.locator('[data-action="claim-daily"]').count(), 0);
  await page.locator('#missions-tabs [data-tab="SEASON"]').click();
  await claim('[data-action="claim-season"][data-index="1"]', 'claimSeasonMilestone');
  assert.match(await page.locator('[data-milestone="1"]').innerText(), /CLAIMED/);
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.progression.getHoverboardCharges()), expected.charges + Number(expected.seasonReward.rewardValue));
  assert.equal(await page.locator('#missions-wallet-coins').innerText(), (1000 + expected.missionReward + expected.dailyReward + expected.achievementCoins).toLocaleString());
  for (let i = 0; i < 16; i++) await page.locator(`#missions-tabs [data-tab="${['MISSIONS', 'DAILY', 'ACHIEVEMENTS', 'SEASON'][i % 4]}"]`).click();
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.missionsModal.timerInterval), interval);
  assert.deepEqual(await listenerCounts(), initialListeners);
  await page.locator('#missions-home-btn').click();
  assert.equal(await page.locator('#start-screen').isVisible(), true);
  assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.missionsModal.timerInterval), null);
  await page.locator('#start-missions-btn').click(); await page.locator('#missions-close-btn').click();
  assert.equal(await page.locator('#start-screen').isVisible(), true);
  assert.deepEqual(errors, [], 'No browser runtime or console errors');
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ layouts, errors, claims: 'all four existing claim methods invoked once; exact rewards verified', save: 'ephemeral browser context' }, null, 2));
  console.log(`VERDICT: PASS — 20 layouts, categories, scrolling, exact claims/rewards, timer/listener safety and Home/Close; screenshots: ${out}`);
} finally { await browser.close(); }
