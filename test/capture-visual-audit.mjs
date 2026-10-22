import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity-ide/brain/7b654b27-5359-4f8b-9796-d5016a125022';

async function captureAudit() {
  console.log('📸 Starting multi-resolution visual audit...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  const viewports = [
    { name: 'desktop_1080p', width: 1920, height: 1080 },
    { name: 'laptop_720p', width: 1280, height: 720 },
    { name: 'mobile_portrait', width: 390, height: 844 }
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    
    // Click play
    await page.click('#start-play-btn', { force: true });
    await page.waitForSelector('#hud:not(.hidden)');
    
    // Wait 2.5s for trains, obstacles and coins to be in view
    await page.waitForTimeout(2500);

    const shotPath = path.join(ARTIFACT_DIR, `audit_before_${vp.name}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved screenshot: ${shotPath}`);

    await page.close();
  }

  await browser.close();
  console.log('✅ Visual audit capture completed!');
}

captureAudit().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
