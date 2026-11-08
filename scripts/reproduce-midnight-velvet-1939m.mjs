import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetDir = '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/midnight_baseline';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function captureFailureBaseline() {
  console.log('🔍 Reproducing Midnight Velvet at user failure checkpoint 1,939m...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'MIDNIGHT_VELVET'],
        selectedTheme: 'MIDNIGHT_VELVET',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax', 'char_modi'],
        selectedCharacter: 'char_jax'
      };
      sessionStorage.setItem('metro_runner_test_harness', 'true');
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'MIDNIGHT_VELVET');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch game in MIDNIGHT_VELVET
    console.log('Starting natural run in MIDNIGHT_VELVET...');
    await page.evaluate(() => {
      const playBtn = document.getElementById('start-play-btn');
      if (playBtn) playBtn.click();
      else if (window.__METRO_GAME__) window.__METRO_GAME__.startRun('NORMAL');

      const game = window.__METRO_GAME__;
      if (game) {
        game.soundManager.setMuted(true);
        game.player.crash = () => false;
        game.player.activateReviveGrace(999999);
        game.player.isIntroInvincible = true;
        if (game.openingSequence) {
          game.openingSequence.skip();
        }
        game.cameraController.setLobbyMode(false);
      }

      const modal = document.querySelector('.modal-overlay, #revive-modal, #save-me-modal, #shop-modal, #environment-modal');
      if (modal && modal instanceof HTMLElement) modal.style.display = 'none';
    });

    await page.waitForTimeout(1000);

    const checkpoints = [
      { name: '01_baseline_spawn_0m.png', dist: 0, label: '0m Spawn' },
      { name: '02_baseline_marina_450m.png', dist: 450, label: '450m Marina' },
      { name: '03_baseline_club_850m.png', dist: 850, label: '850m Club' },
      { name: '04_baseline_grand_terminal_1250m.png', dist: 1250, label: '1250m Grand Terminal' },
      { name: '05_baseline_user_failure_1939m.png', dist: 1939, label: '1939m User Reported Failure' }
    ];

    for (const cp of checkpoints) {
      if (cp.dist > 0) {
        console.log(`Advancing natural gameplay to ${cp.dist}m for ${cp.label}...`);
        await page.waitForFunction((targetDist) => {
          const game = window.__METRO_GAME__;
          if (!game || !game.player) return false;
          game.player.speed = 135.0;
          return game.player.distanceTraveled >= targetDist;
        }, cp.dist, { timeout: 60000 });

        await page.evaluate((d) => {
          const game = window.__METRO_GAME__;
          game.player.speed = 0.0;
          game.player.position.z = -d;
          game.player.distanceTraveled = d;
          game.player.position.y = 0.9;
        }, cp.dist);
      }

      await page.waitForTimeout(500);

      const filePath = path.join(targetDir, cp.name);
      await page.screenshot({ path: filePath });
      console.log(`📸 Saved: ${filePath}`);
    }

    console.log('✅ Baseline capture at 1939m complete!');
  } finally {
    await browser.close();
  }
}

captureFailureBaseline().catch(err => {
  console.error('Error during baseline capture:', err);
  process.exit(1);
});

