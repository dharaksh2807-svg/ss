import assert from 'node:assert/strict';
import * as THREE from 'three';
import { InputManager } from '../src/core/InputManager';
import { EventBus } from '../src/core/EventBus';
import { Player } from '../src/player/Player';
import { CameraController } from '../src/scene/CameraController';
import { GraphicsManager } from '../src/scene/GraphicsManager';
import { CONSTANTS } from '../src/core/Constants';

class Surface {
  listeners = new Map<string, Function[]>();
  addEventListener(type: string, fn: Function) { this.listeners.set(type, [...(this.listeners.get(type) || []), fn]); }
  fire(type: string, values: any = {}) { for (const fn of this.listeners.get(type) || []) fn({ preventDefault() {}, stopPropagation() {}, ...values }); }
  setPointerCapture() {}
  closest() { return null; }
}
const win = Object.assign(new Surface(), { innerWidth: 1440, innerHeight: 900, devicePixelRatio: 3, PointerEvent: class {} });
const canvas = new Surface();
const button = new Surface();
let modal: any = null;
(globalThis as any).window = win;
(globalThis as any).Element = Surface;
(globalThis as any).document = {
  getElementById: (id: string) => id === 'game-canvas' ? canvas : id === 'touch-right-btn' ? button : null,
  querySelectorAll: () => modal ? [modal] : []
};
let pads: any[] = [];
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { getGamepads: () => pads, userAgent: 'test', hardwareConcurrency: 8 } });
const input = new InputManager();
const actions: string[] = [];
const player = new Player();
EventBus.getInstance().on('INPUT_ACTION', action => { actions.push(action); player.handleInput(action); });
const step = () => { for (let i = 0; i < 30; i++) player.update(1 / 60); };
let checks = 0;
function equal(actual: unknown, expected: unknown, label: string) { assert.deepEqual(actual, expected, label); checks++; }
const pointer = (type: string, x: number, y: number, id = 1) => canvas.fire(type, { pointerType: 'touch', isPrimary: true, pointerId: id, clientX: x, clientY: y });
const swipe = (dx: number, dy: number) => {
  pointer('pointerdown', 150, 300);
  pointer('pointermove', 150 + dx, 300 + dy);
  pointer('pointermove', 150 + dx * 2, 300 + dy * 2);
  pointer('pointerup', 150 + dx * 2, 300 + dy * 2);
  canvas.fire('lostpointercapture');
};
player.handleInput('LEFT'); step(); actions.length = 0;
swipe(40, 8); step();
equal(actions, ['RIGHT'], 'one slightly diagonal swipe dispatches once despite multiple moves/end');
equal(player.currentLane, 0, 'one swipe from left reaches middle, never skips it');
for (let i = 0; i < 10; i++) { swipe(i % 2 ? -40 : 40, 4); step(); }
equal(player.currentLane, 0, 'repeated gestures remain stable');
equal(actions.filter(a => a === 'ACTION').length, 0, 'consecutive swipes never deploy a board');
actions.length = 0;
swipe(40, 40); equal(actions, [], 'ambiguous diagonal is ignored');
swipe(0, -40); swipe(0, 40); equal(actions, ['UP', 'DOWN'], 'vertical gestures dispatch jump/slide');
actions.length = 0;
pointer('pointerdown', 150, 300); pointer('pointerup', 150, 300); canvas.fire('lostpointercapture');
pointer('pointerdown', 150, 300); pointer('pointerup', 150, 300); canvas.fire('lostpointercapture');
equal(actions, ['ACTION'], 'two completed taps preserve board shortcut');
actions.length = 0;
pointer('pointerdown', 150, 300); canvas.fire('pointercancel'); pointer('pointerup', 250, 300);
equal(actions, [], 'cancel discards incomplete gesture');
pointer('pointerdown', 150, 300); canvas.fire('pointerdown', { pointerType: 'touch', isPrimary: false }); pointer('pointerup', 250, 300);
equal(actions, [], 'second contact cancels gesture');
equal(canvas.listeners.has('touchstart'), false, 'pointer path registers no compatibility touch events');
input.initTouchButtons(); button.fire('click'); equal(actions, ['RIGHT'], 'idempotent button binding accepts native click once');
input.setEnabled(false); actions.length = 0; swipe(40, 0); button.fire('click');
equal(actions, [], 'disabled gameplay suppresses gestures and buttons');
input.setEnabled(true);
pointer('pointerdown', 150, 300); modal = { getClientRects: () => [1] }; pointer('pointerup', 250, 300); button.fire('click');
equal(actions, [], 'opening modal mid-gesture suppresses it and HUD controls');
modal = { id: 'pause-modal', getClientRects: () => [1] };
win.fire('keydown', { code: 'KeyP', target: new Surface(), repeat: false });
equal(actions, ['PAUSE'], 'P dispatches pause toggle directly from pause menu');
win.fire('keydown', { code: 'Escape', target: new Surface(), repeat: false });
equal(actions, ['PAUSE'], 'menu Escape belongs to coordinator and cannot recurse through input adapter');
modal = null; actions.length = 0;

const pad = { index: 0, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
pads = [pad]; input.pollGamepads();
pad.axes[0] = 0.24; input.pollGamepads(); equal(actions, [], 'stick dead zone');
pad.axes[0] = 0.8; input.pollGamepads();
for (let i = 0; i < 60; i++) input.pollGamepads();
equal(actions, ['RIGHT'], 'held stick produces one edge over 60 frames');
pad.axes[0] = 0.4; input.pollGamepads(); pad.axes[0] = 0.6; input.pollGamepads();
equal(actions, ['RIGHT'], 'hysteresis suppresses threshold jitter');
pad.axes[0] = 0; input.pollGamepads(); pad.axes[0] = 0.8; pad.buttons[15].pressed = true; input.pollGamepads();
equal(actions, ['RIGHT', 'RIGHT'], 'neutral rearms, simultaneous D-pad/stick dispatch once');
win.fire('keydown', { code: 'ArrowLeft', target: new Surface(), repeat: false });
equal(actions.at(-1), 'LEFT', 'keyboard works while controller held');
input.setEnabled(false); input.setEnabled(true); input.pollGamepads();
equal(actions.length, 3, 'resume primes held controller without replay');
pad.axes[0] = 0; pad.buttons[15].pressed = false; input.pollGamepads();
actions.length = 0; pad.axes[1] = -0.8; pad.buttons[0].pressed = true; input.pollGamepads();
equal(actions, ['UP'], 'jump button and stick up merge into one action');
let disconnects = 0; EventBus.getInstance().on('INPUT_DEVICE_DISCONNECTED', () => disconnects++);
pads = []; input.pollGamepads(); input.pollGamepads(); equal(disconnects, 1, 'disconnect reported once and forgotten');
pads = [pad]; input.pollGamepads(); equal(actions, ['UP'], 'reconnection primes held input');
pad.mapping = ''; pads = [pad]; input.resetTransientState(); input.pollGamepads(); equal(actions, ['UP'], 'unknown mapping ignored');

pad.mapping = 'standard'; pad.axes = [0, 0]; pad.buttons.forEach(b => b.pressed = false);
input.pollGamepads(); actions.length = 0;
for (const [buttonIndex, expected] of [[1, 'DOWN'], [2, 'ACTION'], [9, 'PAUSE']] as const) {
  pad.buttons[buttonIndex].pressed = true; input.pollGamepads(); input.pollGamepads();
  equal(actions.at(-1), expected, `standard button ${buttonIndex} dispatches ${expected}`);
  pad.buttons[buttonIndex].pressed = false; input.pollGamepads();
}
equal(actions, ['DOWN', 'ACTION', 'PAUSE'], 'button holds do not repeat slide, board or pause');
const getGamepads = navigator.getGamepads;
(globalThis as any).navigator.getGamepads = () => { throw new Error('policy denied'); };
input.pollGamepads();
win.fire('keydown', { code: 'KeyA', target: new Surface(), repeat: false });
equal(actions.at(-1), 'LEFT', 'Gamepad API failure leaves keyboard available');
(globalThis as any).navigator.getGamepads = getGamepads;

// Touch-only fallback is mutually exclusive with pointer gestures.
delete (win as any).PointerEvent;
const fallbackCanvas = new Surface();
(globalThis as any).document.getElementById = (id: string) => id === 'game-canvas' ? fallbackCanvas : null;
const fallback = new InputManager(); actions.length = 0;
const touch = (x: number) => ({ identifier: 5, clientX: x, clientY: 300 });
fallbackCanvas.fire('touchstart', { touches: [touch(150)] });
fallbackCanvas.fire('touchmove', { touches: [touch(200)] });
fallbackCanvas.fire('touchend', { changedTouches: [touch(220)] });
equal(actions, ['RIGHT'], 'touch-only fallback dispatches one action');
equal(fallbackCanvas.listeners.has('pointerdown'), false, 'fallback registers no pointer listeners');
fallback.setEnabled(false);

// Project all three lanes and the runner through the actual perspective camera.
const camera = new CameraController(); camera.setLobbyMode(false);
for (const [width, height] of [[360, 800], [390, 844], [768, 1024], [1024, 768], [844, 390], [1440, 900]]) {
  win.innerWidth = width; win.innerHeight = height; camera.onResize();
  equal(camera.camera.aspect, width / height, `resize aspect ${width}x${height}`);
  for (const mode of ['CLASSIC', 'CHARACTER_FOCUS'] as const) {
    camera.setCameraMode(mode);
    for (const x of [-3.6, 0, 3.6]) {
      const pos = new THREE.Vector3(x, CONSTANTS.PLAYER_BASE_Y, 0);
      camera.reset(pos);
      for (let i = 0; i < 120; i++) camera.update(pos, 1 / 60, 0, 52);
      camera.camera.updateMatrixWorld(true);
      const runner = pos.clone().add(new THREE.Vector3(0, 1, 0)).project(camera.camera);
      assert.ok(Math.abs(runner.x) < 0.95 && Math.abs(runner.y) < 0.95, `runner visible ${width} ${mode} ${x}`); checks++;
      for (const ahead of [20, 52, 78]) for (const lane of [-3.6, 0, 3.6]) {
        const hazard = new THREE.Vector3(lane, 1.5, -ahead).project(camera.camera);
        assert.ok(Math.abs(hazard.x) < 0.95 && Math.abs(hazard.y) < 0.95 && hazard.z < 1, `hazard readable ${width} ${mode} ${lane} at ${ahead}m`); checks++;
      }
    }
  }
}
const oldAspect = camera.camera.aspect; win.innerHeight = 0; camera.onResize();
equal(camera.camera.aspect, oldAspect, 'zero-height resize retains valid projection');
camera.enterPhotoMode(new THREE.Vector3());
camera.setPhotoCameraTransform(new THREE.Vector3(0, 4, 6), new THREE.Vector3(), 45);
win.innerHeight = 800; camera.onResize();
equal(camera.camera.fov, 45, 'resize preserves photo mode user FOV');
camera.exitPhotoMode();
const gm = GraphicsManager.getInstance();
equal(gm.getConfigForQuality('HIGH').pixelRatio, 2, 'HIGH caps retina DPR at 2');
equal(gm.getConfigForQuality('MEDIUM').pixelRatio, 1.33, 'BALANCED caps DPR at 1.33');
equal(gm.getConfigForQuality('LOW').pixelRatio, 1, 'LOW retains 1x resolution');
console.log(`PASS: ${checks} universal input, resize, camera projection and graphics assertions`);
console.log('VERDICT: PASS');
