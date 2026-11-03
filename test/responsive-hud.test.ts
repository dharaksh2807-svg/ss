import assert from 'node:assert/strict';
import { HUD } from '../src/ui/HUD';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { PowerupManager } from '../src/player/PowerupManager';
const store = new Map<string,string>();
(globalThis as any).localStorage = { getItem: (key:string)=>store.get(key)??null, setItem:(key:string,value:string)=>store.set(key,value), removeItem:(key:string)=>store.delete(key) };
function element(id='') {
 const classes=new Set<string>();
 return {id,textContent:'',innerHTML:'',style:{},className:'',children:[] as any[],dataset:{},
  classList:{add:(...names:string[])=>names.forEach(n=>classes.add(n)),remove:(...names:string[])=>names.forEach(n=>classes.delete(n)),contains:(n:string)=>classes.has(n),toggle:(n:string,force?:boolean)=>{if(force??!classes.has(n))classes.add(n);else classes.delete(n);}},
  addEventListener(){},appendChild(child:any){this.children.push(child);return child;},querySelector(){return null;},querySelectorAll(){return[];},getBoundingClientRect(){return {width:100,height:100,top:0,left:0};}};
}
const elements = new Map<string,ReturnType<typeof element>>();
(globalThis as any).document={getElementById:(id:string)=>{if(id === 'hud-portrait-canvas' || id === 'hud-character-portrait') return null; if(!elements.has(id))elements.set(id,element(id));return elements.get(id);},createElement:()=>element()};
(globalThis as any).window={innerWidth:390,innerHeight:844,addEventListener(){}};
const progression=ProgressionManager.getInstance();
const hud=new HUD(new PowerupManager());
const bus=EventBus.getInstance();
bus.emit(EVENTS.DISTANCE_TRAVELED,12.75);bus.emit(EVENTS.DISTANCE_TRAVELED,.5);
assert.equal(elements.get('hud-distance')!.textContent,'13 m');
bus.emit(EVENTS.DISTANCE_TRAVELED,1234);
assert.equal(elements.get('hud-distance')!.textContent,'1,247 m');
progression.addKeys(4);
assert.equal(elements.get('hud-keys')!.textContent,String(progression.getKeys()));
progression.consumeKeys(1);
assert.equal(elements.get('hud-keys')!.textContent,String(progression.getKeys()));
hud.reset();
assert.equal(elements.get('hud-distance')!.textContent,'0 m');
assert.equal(elements.get('hud-keys')!.textContent,String(progression.getKeys()));
bus.emit(EVENTS.DISTANCE_TRAVELED,7.5);
assert.equal(elements.get('hud-distance')!.textContent,'7 m','new run starts at zero');
console.log('VERDICT: PASS — distance steps, key wallet synchronization and run reset presentation');
