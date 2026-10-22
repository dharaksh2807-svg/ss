import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/7b654b27-5359-4f8b-9796-d5016a125022';

async function captureActionShots() {
  console.log('📸 Capturing clean action shots (run, jump, slide, train closeup)...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  // 1. Desktop 1080p
  const deskPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await deskPage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await deskPage.click('#start-play-btn', { force: true });
  await deskPage.waitForSelector('#hud:not(.hidden)');
  // Move to right lane immediately
  await deskPage.keyboard.press('ArrowRight');
  await deskPage.waitForTimeout(600);
  const deskPath = path.join(ARTIFACT_DIR, 'audit_after_desktop_1080p.png');
  await deskPage.screenshot({ path: deskPath });
  console.log(`Saved desktop 1080p: ${deskPath}`);
  await deskPage.close();

  // 2. Laptop 720p
  const laptopPage = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await laptopPage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await laptopPage.click('#start-play-btn', { force: true });
  await laptopPage.waitForSelector('#hud:not(.hidden)');
  await laptopPage.keyboard.press('ArrowRight');
  await laptopPage.waitForTimeout(600);

  const laptopPath = path.join(ARTIFACT_DIR, 'audit_after_laptop_720p.png');
  await laptopPage.screenshot({ path: laptopPath });
  console.log(`Saved laptop 720p: ${laptopPath}`);

  // Jump in air
  await laptopPage.keyboard.press('ArrowUp');
  await laptopPage.waitForTimeout(200);
  const jumpPath = path.join(ARTIFACT_DIR, 'audit_after_jump.png');
  await laptopPage.screenshot({ path: jumpPath });
  console.log(`Saved jump: ${jumpPath}`);

  // Slide
  await laptopPage.keyboard.press('ArrowDown');
  await laptopPage.waitForTimeout(180);
  const slidePath = path.join(ARTIFACT_DIR, 'audit_after_slide.png');
  await laptopPage.screenshot({ path: slidePath });
  console.log(`Saved slide: ${slidePath}`);

  await laptopPage.close();

  // 3. Mobile portrait
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await mobilePage.click('#start-play-btn', { force: true });
  await mobilePage.waitForSelector('#hud:not(.hidden)');
  await mobilePage.keyboard.press('ArrowLeft');
  await mobilePage.waitForTimeout(600);

  const mobilePath = path.join(ARTIFACT_DIR, 'audit_after_mobile_portrait.png');
  await mobilePage.screenshot({ path: mobilePath });
  console.log(`Saved mobile portrait: ${mobilePath}`);
  await mobilePage.close();

  await browser.close();
  console.log('🎉 All high quality visual action shots captured successfully!');
}

captureActionShots().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
