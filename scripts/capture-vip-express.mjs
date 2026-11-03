import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/44973ef8-ec7d-4412-a558-7c3bb56dfcc5';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const PUBLIC_WORLDS_DIR = path.resolve('public/worlds');
if (!fs.existsSync(PUBLIC_WORLDS_DIR)) {
  fs.mkdirSync(PUBLIC_WORLDS_DIR, { recursive: true });
}

async function isServerRunning() {
  try {
    const res = await fetch('http://localhost:3000/');
    return res.ok;
  } catch {
    return false;
  }
}

async function captureVipExpress() {
  console.log('🏛️ Starting In-Game Visual Capture of VIP EXPRESS: THE GREAT INAUGURATION...');

  let viteProcess = null;
  if (!(await isServerRunning())) {
    console.log('Starting local Vite dev server on port 3000...');
    viteProcess = spawn('npx', ['vite', '--port', '3000'], { stdio: 'pipe' });
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (await isServerRunning()) break;
    }
  }

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // Pre-seed localStorage before page load so ProgressionManager and Game start with Modi equipped in VIP_EXPRESS
    await page.addInitScript(() => {
      const state = {
        unlockedThemes: [
          'MODERN_METRO',
          'HISTORIC_QUARTER',
          'UNDERGROUND_METRO',
          'NEON_INDUSTRIAL',
          'NEON_RAINLINE',
          'ORBITAL_HALO',
          'ABYSSAL_GLASSLINE',
          'DOOMSDAY_LAST_TRANSIT',
          'PHANTOM_LINE',
          'HAUNTED_CARNIVAL',
          'VIP_EXPRESS'
        ],
        selectedTheme: 'VIP_EXPRESS',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax', 'char_modi'],
        selectedCharacter: 'char_modi',
        modiFreeRuns: 3
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'VIP_EXPRESS');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch run in VIP_EXPRESS
    console.log('Launching run in VIP EXPRESS with Narendra Modi character...');
    await page.evaluate(() => {
      if (window.__DEV_SET_DISTRICT__) {
        window.__DEV_SET_DISTRICT__('VIP_EXPRESS');
      }
      const playBtn = document.getElementById('start-play-btn');
      if (playBtn) {
        playBtn.click();
      } else if (window.__METRO_GAME__) {
        window.__METRO_GAME__.startRun('NORMAL');
      }
    });

    await page.waitForTimeout(2500);

    // Confirm diagnostics
    const diag = await page.evaluate(() => {
      const director = window.__ENV_DIRECTOR__;
      const game = window.__METRO_GAME__;
      return director ? director.getDiagnostics(game ? game.getPlayer().position.z : 0) : null;
    });
    console.log('Environment Diagnostics:', JSON.stringify(diag, null, 2));

    // 1. Capture Standard Gameplay Screenshot (running camera view with ceremonial concourse & red carpet)
    console.log('📸 1. Capturing VIP Express Running Gameplay Screenshot...');
    const shot1Path = path.join(ARTIFACT_DIR, 'vip_express_gameplay.png');
    await page.screenshot({ path: shot1Path });
    console.log('Saved:', shot1Path);

    // Also save as public/worlds/vip_express.png for the in-game world store & catalog
    const publicPreviewPath = path.join(PUBLIC_WORLDS_DIR, 'vip_express.png');
    fs.copyFileSync(shot1Path, publicPreviewPath);
    console.log('Saved Public Store Preview:', publicPreviewPath);

    // 2. Capture Landmark Encounter / Ceremonial Plaza & Grand Opening Arches
    console.log('Positioning player for Ceremonial Plaza & Triumphal Archway...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      if (game) {
        const p = game.getPlayer();
        p.isInvulnerable = true;
        p.position.set(0, 0, -180.0);
        p.currentLane = 0;
        p.targetLane = 0;
        p.speed = 0;
        p.isGrounded = true;
        p.updateCollider();
        const chaser = game.chaser;
        if (chaser) {
          chaser.state = 'DISTANT';
          chaser.distance = 60;
        }
      }
      const modal = document.querySelector('.modal-overlay, #revive-modal, #save-me-modal');
      if (modal && modal instanceof HTMLElement) modal.style.display = 'none';
    });

    await page.waitForTimeout(1000);

    console.log('📸 2. Capturing Ceremonial Plaza Landmark Perspective...');
    const shot2Path = path.join(ARTIFACT_DIR, 'vip_express_landmark_segment.png');
    await page.screenshot({ path: shot2Path });
    console.log('Saved:', shot2Path);

    // 3. Capture Comedy Events Perspective (Ribbon ceremony & Camera crew)
    console.log('Positioning player for Comedy Events Perspective...');
    await page.evaluate(() => {
      const game = window.__METRO_GAME__;
      if (game) {
        const p = game.getPlayer();
        p.position.set(-1.8, 4.35, -280.0); // elevated on train rooftop looking across ceremonial avenue
        p.speed = 0;
        p.updateCollider();
      }
    });

    await page.waitForTimeout(1000);

    console.log('📸 3. Capturing Comedy Events (Ribbon Ceremony & Camera Scaffolding)...');
    const shot3Path = path.join(ARTIFACT_DIR, 'vip_express_comedy_events.png');
    await page.screenshot({ path: shot3Path });
    console.log('Saved:', shot3Path);

    // 4. Low Graphics Preset Screenshot
    console.log('Switching to Low Graphics Preset...');
    await page.evaluate(() => {
      const settings = window.__SETTINGS_MANAGER__;
      if (settings) {
        settings.setQualityPreset('LOW');
      }
      const modal = document.querySelector('.modal-overlay, #revive-modal, #save-me-modal');
      if (modal && modal instanceof HTMLElement) modal.style.display = 'none';
    });

    await page.waitForTimeout(1000);

    console.log('📸 4. Capturing Low Graphics Screenshot...');
    const shot4Path = path.join(ARTIFACT_DIR, 'vip_express_low_graphics.png');
    await page.screenshot({ path: shot4Path });
    console.log('Saved:', shot4Path);

    console.log('🎉 VIP Express Visual Captures Complete!');
  } catch (err) {
    console.error('Error during capture:', err);
    process.exit(1);
  } finally {
    await browser.close();
    if (viteProcess) {
      viteProcess.kill();
    }
  }
}

captureVipExpress();
