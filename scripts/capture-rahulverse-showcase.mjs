import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = '/Users/dharaksh/.gemini/antigravity/brain/90c52f38-abc1-4727-b030-841fd675bfad/rahulverse_showcase';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function captureShowcase() {
  console.log('🎬 Starting RAHULVERSE Cinematic Showcase Visual Capture...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.addInitScript(() => {
      const state = {
        unlockedThemes: ['MODERN_METRO', 'RAHULVERSE'],
        selectedTheme: 'RAHULVERSE',
        includePremiumThemesInDynamic: false,
        unlockedCharacters: ['char_jax', 'char_rahul_gandhi'],
        selectedCharacter: 'char_rahul_gandhi',
        rahulFreeRuns: 999
      };
      localStorage.setItem('metro_progression_v1', JSON.stringify(state));
      localStorage.setItem('metro_runner_environment_preference', 'RAHULVERSE');
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Launch game
    console.log('Starting run in RAHULVERSE...');
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
        game.player.speedController.update = () => {};
        game.player.speed = 0.0;
      }

      const modal = document.querySelector('.modal-overlay, #revive-modal, #save-me-modal, #shop-modal, #environment-modal');
      if (modal && modal instanceof HTMLElement) modal.style.display = 'none';
    });

    await page.waitForTimeout(1000);

    const shots = [
      {
        name: '01_yatra_flip_arch_finish_line',
        distance: 8,
        label: 'Never-Ending Yatra: Flip Arch approaching (8m)'
      },
      {
        name: '02_yatra_flip_arch_next_yatra',
        distance: 18,
        label: 'Never-Ending Yatra: Flip Arch flipping to NEXT YATRA & crowd freeze (18m)'
      },
      {
        name: '03_regional_roadshow_tempo_and_bazaar',
        distance: 420,
        label: 'Regional Roadshow: Campaign Support Tempo Van, Loudspeakers & Bazaar (420m)'
      },
      {
        name: '04_regional_roadshow_peepal_chabutra_and_matkas',
        distance: 460,
        label: 'Regional Roadshow: Peepal Tree Chabutra with Elders & Clay Matka Hydration (460m)'
      },
      {
        name: '05_parliament_bear_hug_and_specs_pop',
        distance: 820,
        label: 'Parliament Pandemonium: Bear Hug, Heart & Modi Spectacles Pop (820m)'
      },
      {
        name: '06_parliament_iconic_wink_and_cameraman_fall',
        distance: 832,
        label: 'Parliament Pandemonium: Turn to Camera, Iconic Wink, Tooth Sparkle & Cameraman Topples (832m)'
      },
      {
        name: '07_alliance_circus_musical_chairs',
        distance: 1625,
        label: 'Alliance Circus: Coalition Round Table, Scrambling Chairs & Nitish 360 Spin (1625m)'
      }
    ];

    for (const shot of shots) {
      const filePath = path.join(ARTIFACT_DIR, `${shot.name}.png`);
      if (fs.existsSync(filePath)) {
        console.log(`⏩ Skipping already captured shot: ${shot.name}`);
        continue;
      }

      console.log(`Advancing to ${shot.distance}m for shot: ${shot.label}...`);
      await page.waitForFunction((targetDist) => {
        const game = window.__METRO_GAME__;
        if (!game || !game.player) return false;
        game.player.speed = 300.0;
        return game.player.distanceTraveled >= targetDist;
      }, shot.distance, { timeout: 70000 });

      // Settle runner position and clear immediate blocking track obstacles
      await page.evaluate((targetDist) => {
        const game = window.__METRO_GAME__;
        game.player.speed = 0.0;
        game.player.position.z = -targetDist;
        game.player.position.y = 0.9;
        game.player.distanceTraveled = targetDist;
        if (game.powerUpManager) {
          game.powerUpManager.clearAllPowerUps();
        }

        // Clear obstacles directly in front of camera
        const pZ = game.player.position.z;
        game.trackManager.chunks.forEach((c) => {
          if (c.obstacles) {
            c.obstacles.forEach((obs) => {
              if (obs && obs.group) {
                const obsWorldZ = c.chunkZ + obs.group.position.z;
                if (Math.abs(obsWorldZ - pZ) < 14.0) {
                  obs.group.position.x += 35.0; // move off-track
                }
              }
            });
          }
        });

        // Tick event director with exact playerZ so distance-based choreography animates
        const director = window.__ENV_DIRECTOR__;
      }, shot.distance);

      await page.waitForTimeout(600);

      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`📸 Saved: ${filePath}`);
    }

    console.log('✅ All 7 cinematic showcase shots captured successfully!');
  } finally {
    await browser.close();
  }
}

captureShowcase().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});

