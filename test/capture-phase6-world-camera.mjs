/**
 * Phase 6 — Environment, Lighting and Cinematic Camera Polish
 * Screenshot capture script using Playwright chromium.
 *
 * Usage: node test/capture-phase6-world-camera.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:3000';
const OUT_DIR = join(__dirname, '..', 'artifacts', 'phase6');
mkdirSync(OUT_DIR, { recursive: true });

const DESKTOP = { width: 1440, height: 900 };
const MOBILE  = { width: 390,  height: 844 };

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function capture(page, name) {
  const path = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`  ✓ ${name}.png`);
  return path;
}

/** Inject JS into the page (convenience) */
async function run(page, fn, ...args) {
  return page.evaluate(fn, ...args);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ── 1. Desktop Lobby ────────────────────────────────────────────────────
  {
    console.log('\n[1] Desktop lobby (1440×900)');
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(2500);
    await capture(page, 'phase6_desktop_lobby_1440x900');
    await ctx.close();
  }

  // ── 2. Mobile Lobby ──────────────────────────────────────────────────────
  {
    console.log('\n[2] Mobile lobby (390×844)');
    const ctx = await browser.newContext({ viewport: MOBILE });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(2500);
    await capture(page, 'phase6_mobile_lobby_390x844');
    await ctx.close();
  }

  // ── 3–6. Environment gameplay shots (desktop) ────────────────────────────
  const districts = [
    { id: 'MODERN_METRO',     label: 'modern_metro' },
    { id: 'HISTORIC_QUARTER', label: 'historic_quarter' },
    { id: 'UNDERGROUND_METRO',label: 'underground_metro' },
    { id: 'NEON_INDUSTRIAL',  label: 'neon_industrial' },
  ];

  for (const district of districts) {
    console.log(`\n[district] ${district.id}`);
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(1500);

    // Start game by clicking Play button
    try {
      await page.click('#play-btn', { timeout: 3000 });
    } catch {
      // try data-testid or aria fallback
      try { await page.click('[data-testid="play-btn"]', { timeout: 1000 }); } catch {}
    }
    await delay(1000);

    // Jump to district via window.__ENV_DIRECTOR__
    await run(page, (distId) => {
      const dir = window.__ENV_DIRECTOR__;
      if (dir && dir.jumpToDistrict) dir.jumpToDistrict(distId);
    }, district.id);
    await delay(2500);
    await capture(page, `phase6_gameplay_${district.label}`);

    // If underground, also capture tunnel entry FOV
    if (district.id === 'UNDERGROUND_METRO') {
      await delay(500);
      await capture(page, 'phase6_tunnel_interior');
    }

    await ctx.close();
  }

  // ── 7. District transition (MODERN → HISTORIC) ───────────────────────────
  {
    console.log('\n[7] District transition moment');
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(1500);
    try { await page.click('#play-btn', { timeout: 3000 }); } catch {}
    await delay(500);
    await run(page, () => {
      const dir = window.__ENV_DIRECTOR__;
      if (dir) dir.jumpToDistrict('MODERN_METRO');
    });
    await delay(800);
    // Trigger atmospheric transition to HISTORIC
    await run(page, () => {
      const ws = window.__WORLD_SCENE__;
      const reg = window.__ENV_REGISTRY__;
      if (ws && ws.startAtmosphericTransition && reg) {
        ws.startAtmosphericTransition(reg.get('HISTORIC_QUARTER'), 2.5);
      }
    });
    await delay(1200); // Mid-transition at ~50%
    await capture(page, 'phase6_district_transition');
    await ctx.close();
  }

  // ── 8. Rooftop traversal (groundY >= 4) ─────────────────────────────────
  {
    console.log('\n[8] Rooftop traversal camera');
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(1500);
    try { await page.click('#play-btn', { timeout: 3000 }); } catch {}
    await delay(800);
    // Simulate rooftop: lift player Y to 4.5 via debug
    await run(page, () => {
      const player = window.__PLAYER__;
      if (player && player.mesh) {
        player.mesh.position.y = 4.5;
      }
    });
    await delay(1500);
    await capture(page, 'phase6_rooftop_camera');
    await ctx.close();
  }

  // ── 9. Game Over framing ─────────────────────────────────────────────────
  {
    console.log('\n[9] Game Over camera framing (desktop)');
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(1500);
    try { await page.click('#play-btn', { timeout: 3000 }); } catch {}
    await delay(600);
    await run(page, () => {
      // Trigger game over state via GameStateManager
      const gsm = window.__GAME_STATE__;
      if (gsm && gsm.triggerGameOver) gsm.triggerGameOver();
      else if (gsm && gsm.setState) gsm.setState('GAME_OVER');
    });
    await delay(2000);
    await capture(page, 'phase6_game_over_framing');
    await ctx.close();
  }

  // ── 10. Mobile gameplay ───────────────────────────────────────────────────
  {
    console.log('\n[10] Mobile gameplay (390×844)');
    const ctx = await browser.newContext({ viewport: MOBILE });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await delay(1500);
    try { await page.click('#play-btn', { timeout: 3000 }); } catch {}
    await delay(2000);
    await capture(page, 'phase6_mobile_gameplay');
    await ctx.close();
  }

  await browser.close();
  console.log(`\n✅  All Phase 6 screenshots saved to artifacts/phase6/`);
})().catch(err => {
  console.error('Capture error:', err.message);
  process.exit(1);
});
