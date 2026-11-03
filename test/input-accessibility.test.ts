import assert from 'node:assert/strict';
import { InputManager } from '../src/core/InputManager';
import { EventBus } from '../src/core/EventBus';

const listeners = new Map<string, Function>();
(globalThis as any).window = { addEventListener: (type: string, listener: Function) => listeners.set(type, listener) };
(globalThis as any).document = { getElementById: () => null };
class ControlTarget {
  constructor(private kind: 'button' | 'input' | 'select' | 'textarea' | 'editable' | 'body') {}
  closest(selector: string) {
    if (this.kind === 'body') return null;
    if (this.kind === 'editable') return selector.includes('contenteditable') ? this : null;
    return selector.split(',').map(s => s.trim()).includes(this.kind) ? this : null;
  }
}
(globalThis as any).Element = ControlTarget;
const input = new InputManager();
const actions: string[] = [];
EventBus.getInstance().on('INPUT_ACTION', action => actions.push(action));
function key(code: string, kind: ConstructorParameters<typeof ControlTarget>[0], repeat = false) {
  let prevented = false;
  actions.length = 0;
  listeners.get('keydown')!({ code, target: new ControlTarget(kind), repeat,
    preventDefault: () => { prevented = true; } });
  return { prevented, actions: [...actions] };
}
assert.deepEqual(key('Space', 'button'), { prevented: false, actions: [] }, 'Space retains native button activation');
for (const kind of ['input', 'select', 'textarea', 'editable'] as const) {
  assert.deepEqual(key('ArrowRight', kind), { prevented: false, actions: [] }, `${kind} retains native navigation`);
  assert.deepEqual(key('KeyP', kind), { prevented: false, actions: [] }, `${kind} does not trigger gameplay while editing`);
}
assert.deepEqual(key('ArrowLeft', 'body'), { prevented: true, actions: ['LEFT'] }, 'Gameplay arrow dispatches once and prevents page scrolling');
assert.deepEqual(key('Space', 'body'), { prevented: true, actions: ['UP'] }, 'Gameplay jump shortcut remains available');
assert.deepEqual(key('ArrowLeft', 'body', true), { prevented: true, actions: [] }, 'Repeat prevents scrolling without duplicate lane input');
input.setEnabled(false);
assert.deepEqual(key('ArrowLeft', 'body'), { prevented: false, actions: [] }, 'Paused gameplay ignores movement');
assert.deepEqual(key('Escape', 'button'), { prevented: true, actions: ['PAUSE'] }, 'Pause shortcut remains available with a focused button');
console.log('PASS: 14 input accessibility checks');
