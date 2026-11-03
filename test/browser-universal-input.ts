import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const executablePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true, executablePath, args: ['--use-gl=angle', '--use-angle=metal', '--no-sandbox'] });
const results: string[] = [];
const output = '/tmp/metro-task8'; fs.mkdirSync(output, { recursive: true });
try {
  for (const device of [
    { name: 'desktop', width: 1440, height: 900, touch: false },
    { name: 'android-portrait', width: 360, height: 800, touch: true },
    { name: 'iphone-portrait', width: 390, height: 844, touch: true },
    { name: 'phone-landscape', width: 844, height: 390, touch: true },
    { name: 'tablet-portrait', width: 768, height: 1024, touch: true },
    { name: 'tablet-landscape', width: 1024, height: 768, touch: true }
  ]) {
    const context = await browser.newContext({ viewport: { width: device.width, height: device.height }, hasTouch: device.touch, isMobile: device.touch, deviceScaleFactor: device.touch ? 3 : 1 });
    const page = await context.newPage(); const errors: string[] = [];
    page.on('pageerror', e => { errors.push(e.message); console.error(e.stack); });
    await page.addInitScript(() => { (window as any).__name = (fn: any) => fn; });
    await page.goto(process.env.METRO_TEST_URL || 'http://127.0.0.1:3001');
    await page.waitForFunction(() => Boolean((window as any).__METRO_GAME__));
    await page.locator('#start-play-btn').click();
    await page.evaluate(() => {
      const w = window as any, g = w.__METRO_GAME__;
      g.openingSequence.skip(); g.devTestArena.setSimulationPaused(true);
      w.__actions = []; w.__METRO_BUS__.on('INPUT_ACTION', (a: string) => w.__actions.push(a));
      g.player.reset(); g.player.handleInput('LEFT');
      for (let i = 0; i < 30; i++) g.player.update(1 / 60);
    });
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.player.targetLane), 0, device.name + ' keyboard targets middle');
    await page.evaluate(() => {
      const g = (window as any).__METRO_GAME__; for (let i = 0; i < 30; i++) g.player.update(1 / 60);
      (window as any).__actions.length = 0;
    });
    await page.keyboard.press('KeyP');
    assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED', device.name + ' P pauses');
    await page.keyboard.press('KeyP');
    assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PLAYING', device.name + ' P resumes');
    await page.evaluate(() => { (window as any).__actions.length = 0; });
    if (device.touch) {
      const cdp = await context.newCDPSession(page);
      const x = Math.round(device.width * 0.45), y = Math.round(device.height * 0.55);
      const swipe = async (dx: number, dy: number) => {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx, y: y + dy }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx + Math.sign(dx) * 10, y: y + dy }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      };
      await swipe(60, 8);
      assert.deepEqual(await page.evaluate(() => (window as any).__actions), ['RIGHT'], device.name + ' actual touch stream one action');
      await swipe(-60, 6);
      assert.deepEqual(await page.evaluate(() => (window as any).__actions), ['RIGHT', 'LEFT'], device.name + ' repeat swipe no board or compatibility duplicates');
      assert.equal(await page.locator('#touch-board-btn').isVisible(), true, device.name + ' touch board visible including large tablet');
      for (const id of ['hud-pause-btn', 'hud-board-btn', 'touch-board-btn']) {
        const box = await page.locator('#' + id).boundingBox();
        assert.ok(box && box.width >= 44 && box.height >= 44 && box.x >= 0 && box.y >= 0 && box.x + box.width <= device.width + 1 && box.y + box.height <= device.height + 1, device.name + ' accessible control ' + id);
      }
      await page.locator('#hud-pause-btn').tap();
      await page.evaluate(() => { (window as any).__actions.length = 0; });
      await swipe(60, 0);
      assert.deepEqual(await page.evaluate(() => (window as any).__actions), [], device.name + ' modal swipes suppressed');
      await page.locator('#pause-resume-btn').click();
      await page.locator('#hud-board-btn').tap();
      assert.deepEqual(await page.evaluate(() => (window as any).__actions), ['ACTION'], device.name + ' board tap dispatches once');
    }
    await page.evaluate(() => {
      const g = (window as any).__METRO_GAME__;
      g.cameraController.finishIntro(g.player.position);
      for (let i = 0; i < 90; i++) g.cameraController.update(g.player.position, 1 / 60);
      g.worldScene.renderer.render(g.worldScene.scene, g.cameraController.camera);
    });
    await page.screenshot({ path: `${output}/${device.name}.png` });
    const before = await page.evaluate(() => (window as any).__METRO_GAME__.player.distanceTraveled);
    await page.setViewportSize({ width: device.height, height: device.width });
    await page.evaluate(() => window.dispatchEvent(new Event('orientationchange')));
    await page.waitForTimeout(250); // Let visualViewport finish its asynchronous resize before priming pads.
    const resized = await page.evaluate(() => {
      const g = (window as any).__METRO_GAME__;
      return { aspect: g.cameraController.camera.aspect, width: g.canvas.width, height: g.canvas.height, state: g.lifecycleState, distance: g.player.distanceTraveled };
    });
    assert.equal(resized.aspect, device.height / device.width, device.name + ' orientation projection');
    assert.equal(resized.state, 'PLAYING', device.name + ' orientation keeps run');
    assert.equal(resized.distance, before, device.name + ' resize does not reset run');
    assert.ok(Math.abs(resized.width / resized.height - resized.aspect) < 0.01, device.name + ' drawing buffer aspect matches');

    if (device.name === 'desktop') {
      await page.evaluate(() => {
        const w = window as any, g = w.__METRO_GAME__;
        w.__pad = { index: 0, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
        w.__pads = [w.__pad]; Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => w.__pads });
        w.__poll = g.inputManager.pollGamepads.bind(g.inputManager); g.inputManager.pollGamepads = () => {};
        w.__poll(); w.__actions.length = 0;
        w.__pad.axes[0] = 0.2; w.__poll(); w.__pad.axes[0] = 0.8;
        for (let i = 0; i < 120; i++) w.__poll();
      });
      assert.deepEqual(await page.evaluate(() => (window as any).__actions), ['RIGHT'], 'emulated standard stick deadzone/hold');
      await page.keyboard.press('ArrowLeft');
      assert.deepEqual(await page.evaluate(() => (window as any).__actions), ['RIGHT', 'LEFT'], 'gamepad leaves keyboard functional');
      await page.evaluate(() => { const w = window as any; w.__pad.buttons[9].pressed = true; w.__poll(); });
      assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED', 'gamepad Start pauses');
      await page.evaluate(() => {
        const w = window as any; w.__pad.axes[0] = 0; w.__pad.buttons[9].pressed = false; w.__poll();
        w.__pad.buttons[13].pressed = true; w.__poll();
      });
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'pause-photo-btn', 'D-pad navigates menu focus');
      await page.locator('#pause-settings-btn').focus();
      await page.evaluate(() => { const w = window as any; w.__pad.buttons[0].pressed = true; w.__poll(); });
      assert.equal(await page.locator('#settings-modal').isVisible(), true, 'gamepad confirm opens focused settings');
      await page.evaluate(() => { const w = window as any; w.__pad.buttons[0].pressed = false; w.__pad.buttons[1].pressed = true; w.__poll(); });
      assert.equal(await page.locator('#pause-modal').isVisible(), true, 'gamepad back restores pause');
      assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED', 'back does not resume underneath settings');
      await page.evaluate(() => { const w = window as any; w.__pad.buttons[1].pressed = false; w.__pad.buttons[9].pressed = true; w.__poll(); });
      assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PLAYING', 'gamepad Start resumes pause');
      await page.evaluate(() => { const w = window as any; w.__pad.buttons[9].pressed = false; w.__poll(); w.__pads = []; w.__poll(); });
      assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED', 'controller disconnect pauses');
      await page.locator('#pause-resume-btn').click();
      await page.keyboard.press('ArrowLeft');
      assert.equal(await page.evaluate(() => (window as any).__actions.at(-1)), 'LEFT', 'keyboard survives disconnect');

      // Real lifecycle handlers with emulated OS/browser events; no physical screen lock claim.
      await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED', 'blur pauses');
      await page.evaluate(() => { (window as any).__METRO_GAME__.lastTime = performance.now() - 60000; window.dispatchEvent(new Event('focus')); });
      assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED', 'focus requires explicit resume');
      await page.locator('#pause-resume-btn').click();
      const maxDt = await page.evaluate(async () => {
        const g = (window as any).__METRO_GAME__; const dts: number[] = [];
        const update = g.player.update; g.player.update = function(dt: number) { dts.push(dt); return update.call(this, dt); };
        g.devTestArena.setSimulationPaused(false);
        for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
        g.devTestArena.setSimulationPaused(true); g.player.update = update;
        return Math.max(...dts);
      });
      assert.ok(maxDt <= 0.08 && maxDt >= 0, 'resume cannot replay 60-second elapsed time');
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
      assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED', 'background visibility pauses');
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
      assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED', 'foreground stays paused');
      await page.locator('#pause-resume-btn').click();
      await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
      assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED', 'pagehide pauses');
      await page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
      assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED', 'pageshow does not restart or resume');
      await page.locator('#pause-resume-btn').click();
      const glSupported = await page.evaluate(() => {
        const w = window as any, g = w.__METRO_GAME__;
        w.__contextExtension = g.worldScene.renderer.getContext().getExtension('WEBGL_lose_context');
        if (!w.__contextExtension) return false;
        w.__distanceBeforeLoss = g.player.distanceTraveled; w.__contextExtension.loseContext(); return true;
      });
      assert.ok(glSupported, 'WebGL loss extension available in test Chrome');
      await page.waitForFunction(() => (window as any).__METRO_GAME__.contextLost);
      assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED', 'real WebGL context loss pauses');
      await page.locator('#pause-resume-btn').click();
      assert.equal(await page.locator('#pause-modal').isVisible(), true, 'blocked resume keeps pause controls visible');
      await page.locator('#pause-restart-btn').click();
      assert.equal(await page.locator('#pause-modal').isVisible(), true, 'blocked restart keeps pause controls visible');
      await page.evaluate(() => { const g = (window as any).__METRO_GAME__; g.resume(); g.startRun(); });
      assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED', 'resume/start blocked while context lost');
      await page.waitForTimeout(100);
      await page.evaluate(() => (window as any).__contextExtension.restoreContext());
      await page.waitForFunction(() => !(window as any).__METRO_GAME__.contextLost);
      assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.player.distanceTraveled === (window as any).__distanceBeforeLoss), true, 'context restoration preserves run');
      assert.equal(await page.evaluate(() => (window as any).__METRO_GAME__.lifecycleState), 'PAUSED', 'context restoration waits for resume');
      await page.locator('#pause-resume-btn').click();
      await page.evaluate(() => { const g = (window as any).__METRO_GAME__; g.worldScene.renderer.render(g.worldScene.scene, g.cameraController.camera); });
      results.push('Emulated standard gamepad: stick, menu navigation, confirm/back, pause/resume, disconnect; lifecycle events; real WebGL context loss/restoration');
    }
    assert.deepEqual(errors, [], device.name + ' no runtime exceptions');
    results.push(`${device.name}: keyboard${device.touch ? ', CDP touch, accessible HUD' : ''}, resize/orientation, no runtime exceptions`);
    console.log('PASS: ' + results.at(-1));
    await context.close();
  }
  fs.writeFileSync(`${output}/browser-results.json`, JSON.stringify({ browser: browser.version(), physicalHardware: false, results }, null, 2));
  console.log('VERDICT: PASS');
} finally { await browser.close(); }
