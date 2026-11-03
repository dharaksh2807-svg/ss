import assert from 'node:assert/strict';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { NavigationCoordinator } from '../src/ui/NavigationCoordinator';

// Small DOM boundary fake; exercise the production navigation and event handlers.
class ElementFake {
  hidden = true;
  isConnected = true;
  tabIndex = 0;
  classList = {
    contains: (_name: string) => this.hidden,
  };
  contains(other: unknown) { return other === this; }
  querySelector() { return null; }
  focus() { (globalThis as any).document.activeElement = this; }
}
const keys = new Set<Function>();
(globalThis as any).HTMLElement = ElementFake;
(globalThis as any).Node = ElementFake;
const touchListeners = new Map<string, Function>();
(globalThis as any).document = { activeElement: null, querySelector: () => null,
  addEventListener: (type: string, fn: Function) => touchListeners.set(type, fn),
  removeEventListener: (type: string) => touchListeners.delete(type),
};
(globalThis as any).window = {
  addEventListener: (_type: string, callback: Function) => keys.add(callback),
  removeEventListener: (_type: string, callback: Function) => keys.delete(callback),
};
const bus = new EventBus();
let root: any = 'START';
const nav = new NavigationCoordinator(bus, () => root);
const ids = ['START', 'PAUSE', 'GAMEOVER', 'SHOP', 'CHARACTERS', 'BOARDS', 'WORLDS', 'MISSIONS', 'SETTINGS'] as const;
const views = new Map(ids.map(id => [id, new ElementFake()]));
const shows: Record<string, number> = {};
let category = 'FEATURED';
let innerOverlay = false;
let binding = false;
let restarts = 0;
for (const id of ids) nav.register(id, {
  element: views.get(id)! as any,
  show: (payload?: string) => {
    views.get(id)!.hidden = false;
    shows[id] = (shows[id] || 0) + 1;
    if (id === 'SHOP' && payload) category = payload;
  },
  hide: () => { views.get(id)!.hidden = true; },
  escape: () => {
    if (id === 'SHOP' && innerOverlay) { innerOverlay = false; return true; }
    if (id === 'SETTINGS' && binding) { binding = false; return true; }
    return false;
  },
}, 'OPEN_' + id, value => value);
bus.on(EVENTS.GAME_RESTART, () => restarts++);
let resumes = 0;
bus.on(EVENTS.GAME_RESUME, () => resumes++);
function visible(...expected: string[]) {
  assert.deepEqual(ids.filter(id => !views.get(id)!.hidden).sort(), expected.sort());
}
function escape(repeat = false) {
  let consumed = false;
  for (const key of keys) key({ key: 'Escape', repeat, preventDefault() {}, stopImmediatePropagation() { consumed = true; } });
  return consumed;
}
for (const id of ['SHOP', 'CHARACTERS', 'BOARDS', 'WORLDS', 'MISSIONS'] as const) {
  views.get('START')!.hidden = false;
  views.get('START')!.focus();
  bus.emit('OPEN_' + id);
  visible(id);
  const count = shows[id];
  bus.emit('OPEN_' + id);
  assert.equal(shows[id], count, 'duplicate OPEN is idempotent');
  bus.emit(EVENTS.UI_BACK, 'SETTINGS');
  visible(id); // stale close cannot dismiss another view
  bus.emit(EVENTS.UI_BACK, id);
  visible('START');
  assert.equal((globalThis as any).document.activeElement, views.get('START'));
}
bus.emit('OPEN_SHOP', 'HOVERBOARDS');
bus.emit('OPEN_BOARDS');
visible('BOARDS');
escape();
visible('SHOP');
assert.equal(category, 'HOVERBOARDS');
innerOverlay = true;
escape(); visible('SHOP');
escape(true); visible('SHOP');
escape(); visible('START');
// Category entry originating inside Worlds must retain that origin as well.
bus.emit('OPEN_WORLDS');
bus.emit('OPEN_SHOP', 'WORLDS');
bus.emit('OPEN_CHARACTERS');
escape(); visible('SHOP');
escape(); visible('WORLDS');
escape(); visible('START');
nav.clear(); root = 'PAUSE'; views.get('PAUSE')!.hidden = false;
bus.emit('OPEN_SETTINGS');
binding = true;
escape(); visible('SETTINGS'); assert.equal(binding, false);
escape(); visible('PAUSE'); assert.equal(resumes, 0);
escape(); assert.equal(resumes, 1);
nav.clear(); root = 'GAMEOVER'; views.get('GAMEOVER')!.hidden = false;
bus.emit('OPEN_SHOP', 'CHARACTERS');
bus.emit('OPEN_CHARACTERS');
escape(); visible('SHOP');
escape(); visible('GAMEOVER');
assert.equal(restarts, 0);
nav.clear(); root = undefined;
bus.emit('OPEN_SETTINGS'); visible();
assert.equal(escape(), false, 'normal gameplay Escape passes to InputManager');
root = 'START';
for (let i = 0; i < 30; i++) { bus.emit('OPEN_CHARACTERS'); bus.emit(EVENTS.UI_BACK, 'CHARACTERS'); }
assert.equal(keys.size, 1);
nav.clear(); visible();
views.get('SHOP')!.hidden = false;
let stopped = 0;
for (const fn of touchListeners.values()) fn({ target: views.get('SHOP'), stopPropagation() { stopped++; } });
assert.equal(stopped, 2, 'visible menu gestures stop before gameplay listeners');
views.get('SHOP')!.hidden = true;
for (const fn of touchListeners.values()) fn({ target: views.get('SHOP'), stopPropagation() { stopped++; } });
assert.equal(stopped, 2, 'hidden menus do not consume gameplay gestures');
assert.equal(touchListeners.size, 2, 'repeated entry does not add gesture listeners');
nav.dispose(); assert.equal(keys.size, 0); assert.equal(touchListeners.size, 0);
bus.emit('OPEN_SHOP'); visible();
console.log('VERDICT: PASS — navigation origins, nested category entry, focus, Escape priority, idempotence and cleanup');
