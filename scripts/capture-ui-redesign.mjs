import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/44973ef8-ec7d-4412-a558-7c3bb56dfcc5';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function isServerRunning(port) {
  try {
    const res = await fetch(`http://localhost:${port}/`);
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  const port = 4173;
  let serverProcess = null;

  if (!(await isServerRunning(port))) {
    console.log(`Starting Vite preview server on port ${port}...`);
    serverProcess = spawn('npx', ['vite', 'preview', '--port', String(port)], { stdio: 'pipe' });
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (await isServerRunning(port)) break;
    }
  }

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    console.log(`Navigating to http://localhost:${port}/ ...`);
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 1. Desktop Lobby (1440x900)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_desktop_lobby.png') });
    console.log('Saved 01_desktop_lobby.png');

    // 2. Open Shop Modal -> Category Navigation
    await page.click('#start-shop-btn');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_shop_navigation.png') });
    console.log('Saved 02_shop_navigation.png');

    // 3. Shop Modal -> Standard Runners
    await page.click('button[data-cat="CHARACTERS"]');
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      const scroll = document.querySelector('.shop-content-scroll');
      if (scroll) scroll.scrollTop = 0;
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_standard_runners.png') });
    console.log('Saved 03_standard_runners.png');

    // 4. Modi Legendary Card
    const modiCard = await page.$('.legendary-character-card[data-char-id="char_modi"]');
    if (modiCard) {
      await page.evaluate((el) => {
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
      }, modiCard);
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_modi_legendary.png') });
      console.log('Saved 04_modi_legendary.png');
    } else {
      console.log('Modi card not found with selector!');
    }

    // 5. Rahul Gandhi Legendary Card
    const rahulCard = await page.$('.legendary-character-card[data-char-id="char_rahul_gandhi"], .legendary-character-card[data-char-id="rahul_gandhi"]');
    if (rahulCard) {
      await page.evaluate((el) => {
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
      }, rahulCard);
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_rahul_legendary.png') });
      console.log('Saved 05_rahul_legendary.png');
    } else {
      console.log('Rahul card not found with selector!');
    }

    // 6. Shop Modal -> Worlds Grid
    await page.click('button[data-cat="WORLDS"]');
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      const scroll = document.querySelector('.shop-content-scroll');
      if (scroll) scroll.scrollTop = 0;
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_worlds_grid.png') });
    console.log('Saved 06_worlds_grid.png');

    // 7. Mobile Shop (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_mobile_shop.png') });
    console.log('Saved 07_mobile_shop.png');

    // 8. Mobile Lobby (390x844)
    await page.click('#shop-close-btn');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_mobile_lobby.png') });
    console.log('Saved 08_mobile_lobby.png');

  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

main().catch(console.error);
