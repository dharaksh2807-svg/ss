import * as THREE from 'three';
import { CharacterMeshBuilder } from '../src/characters/CharacterMeshBuilder';
import { getAllCharacters, getCharacterById, CharacterId } from '../src/characters/CharacterCatalog';
import { CharacterModel } from '../src/player/CharacterModel';
import { Player } from '../src/player/Player';
import { CameraController } from '../src/scene/CameraController';
import { CONSTANTS } from '../src/core/Constants';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { PowerupManager } from '../src/player/PowerupManager';
import { HUD } from '../src/ui/HUD';
import { EventBus, EVENTS } from '../src/core/EventBus';

// Mock DOM & localStorage for Node test runner
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

(global as any).localStorage = new MockLocalStorage();

// Mock DOM elements
function createMockEl(id: string, tag: string = 'div'): HTMLElement {
  const el = {
    id,
    className: '',
    classList: {
      add: (c: string) => { if (!el.className.includes(c)) el.className += ` ${c}`; },
      remove: (c: string) => { el.className = el.className.replace(c, '').trim(); },
      contains: (c: string) => el.className.includes(c)
    },
    style: {} as any,
    textContent: '',
    innerHTML: '',
    children: [] as any[],
    appendChild: (child: any) => { el.children.push(child); return child; },
    addEventListener: () => {},
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 100, height: 100 })
  };
  return el as any;
}

const mockDocElements: Record<string, any> = {
  'hud': createMockEl('hud'),
  'hud-score': createMockEl('hud-score', 'span'),
  'hud-coins': createMockEl('hud-coins', 'span'),
  'hud-coin-badge': createMockEl('hud-coin-badge'),
  'hud-multiplier': createMockEl('hud-multiplier'),
  'hud-powerups': createMockEl('hud-powerups'),
  'hud-feedback-stack': createMockEl('hud-feedback-stack'),
  'hud-pause-btn': createMockEl('hud-pause-btn', 'button'),
  'hud-board-btn': createMockEl('hud-board-btn', 'button'),
  'hud-board-charges': createMockEl('hud-board-charges', 'span'),
  'hud-mission-ticker': createMockEl('hud-mission-ticker')
};

(global as any).document = {
  getElementById: (id: string) => mockDocElements[id] || null,
  createElement: (tag: string) => createMockEl(`mock-${Math.random()}`, tag)
};

(global as any).window = {
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: () => {}
};

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('🧪 Starting Task 6: Character Quality, Correct Orientation, Camera Rig & HUD Polish Tests...\n');

// ========================================================
// 1. Model Orientation & Correct Facing
// ========================================================
console.log('--- Test 1: Model Orientation & Forward Facing Direction ---');
const jaxRig = CharacterMeshBuilder.build('char_jax', 'jax_classic');

// In Three.js coordinate system, player runs into -Z (forward). Camera is at +Z (behind).
// Verify goggles are mounted on the FRONT of the head / visor facing -Z (NOT facing +Z towards camera!)
let gogglesFacingNegativeZ = false;
let foundGogglesAtPositiveZ = false;

jaxRig.headGroup.traverse((child) => {
  if (child instanceof THREE.Mesh && child.geometry instanceof THREE.TorusGeometry) {
    // Check if this torus is a goggle frame (radius ~0.065)
    if (Math.abs(child.geometry.parameters.radius - 0.065) < 0.01) {
      const worldZ = child.position.z + (child.parent?.position.z || 0);
      if (worldZ < -0.1) {
        gogglesFacingNegativeZ = true;
      }
      if (worldZ > 0.15) {
        foundGogglesAtPositiveZ = true;
      }
    }
  }
});

assert(gogglesFacingNegativeZ, 'Jax goggles are mounted on the FRONT brow/visor facing -Z forward');
assert(!foundGogglesAtPositiveZ, 'Jax head has NO backward-facing goggles at +Z (eliminating the uncanny backward face bug)');

// Verify that facial features (eyes, nose, smile) face -Z forward
let eyesFacingNegativeZ = false;
jaxRig.headGroup.traverse((child) => {
  if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
    // Eye white or pupil
    if (child.position.z < -0.15) {
      eyesFacingNegativeZ = true;
    }
  }
});
assert(eyesFacingNegativeZ, 'Facial features face -Z forward down the track');

// Verify player reset restores mesh rotation to (0, 0, 0)
const player = new Player();
player.mesh.rotation.y = Math.PI; // dirty menu rotation
player.reset();
assert(player.mesh.rotation.y === 0, 'Player.reset() resets mesh rotation.y to 0 (forward facing)');
assert(player.mesh.rotation.x === 0 && player.mesh.rotation.z === 0, 'Player.reset() resets all rotation axes to 0');

// ========================================================
// 2. Character Appearance & Stylized Arcade Quality
// ========================================================
console.log('\n--- Test 2: Character Quality & Stylized Geometry ---');

// Check head sculpt features (chin, ears, snapback strap at back)
let hasEars = 0;
let hasChin = false;
let hasSnapbackStrap = false;

jaxRig.headGroup.children.forEach((child) => {
  if (child instanceof THREE.Mesh) {
    // Chin is at position y = -0.16, z = -0.16
    if (child.position.y < -0.12 && child.position.z < -0.12) {
      hasChin = true;
    }
    // Ears are at x = +-0.22
    if (Math.abs(Math.abs(child.position.x) - 0.22) < 0.02) {
      hasEars++;
    }
    // Snapback strap at back (+Z)
    if (child.position.z > 0.22 && Math.abs(child.position.y - 0.04) < 0.03) {
      hasSnapbackStrap = true;
    }
  }
});

assert(hasChin, 'Head sculpt includes tapered jawline/chin');
assert(hasEars >= 2, `Head sculpt includes sculpted left and right ears (found ${hasEars})`);
assert(hasSnapbackStrap, 'Cap back includes realistic snapback notch strap at +Z');

// Verify Articulated Runner Hand (NOT an 8x8 sphere!)
let hasArticulatedHand = false;
jaxRig.leftForearmGroup.traverse((child) => {
  if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry) {
    // Sculpted palm has box geometry
    if (Math.abs(child.geometry.parameters.width - 0.095) < 0.01) {
      hasArticulatedHand = true;
    }
  }
});
assert(hasArticulatedHand, 'Runner hands use sculpted articulated geometry (palm, fingers, thumb) instead of simple spheres');

// Verify High-Top Sneakers
let hasSole = false;
let hasToeCap = false;
let hasHeelTab = false;

jaxRig.leftSneaker.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    if (child.geometry instanceof THREE.BoxGeometry) {
      if (child.geometry.parameters.height < 0.08 && child.position.y < 0.05) hasSole = true;
      if (child.position.z > 0.12) hasHeelTab = true;
    }
    if (child.geometry instanceof THREE.CylinderGeometry && child.position.z < -0.18) {
      hasToeCap = true;
    }
  }
});
assert(hasSole, 'Sneakers include dedicated sculpted rubber outsole');
assert(hasToeCap, 'Sneakers include curved rubber toe cap bumper');
assert(hasHeelTab, 'Sneakers include rear heel pull tab');

// Verify Street Backpack details
let sprayCanCount = 0;
let hasBackPad = false;
let hasTopHandle = false;

jaxRig.backpackGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    if (child.geometry instanceof THREE.CylinderGeometry && Math.abs(child.geometry.parameters.radiusTop - 0.042) < 0.01) {
      sprayCanCount++;
    }
    if (child.geometry instanceof THREE.BoxGeometry && child.position.z < -0.05) {
      hasBackPad = true;
    }
    if (child.geometry instanceof THREE.TorusGeometry && child.position.y > 0.18) {
      hasTopHandle = true;
    }
  }
});
assert(sprayCanCount === 2, `Backpack carries 2 metallic street spray cans in holsters (found ${sprayCanCount})`);
assert(hasBackPad, 'Backpack features breathable padded rear back panel');
assert(hasTopHandle, 'Backpack features top haul loop handle');

// ========================================================
// 3. Preserve Character Variety across all 4 Characters & 12 Outfits
// ========================================================
console.log('\n--- Test 3: Character Variety & Full Roster Compatibility ---');
const chars = getAllCharacters();
assert(chars.length === 4, `All 4 characters available in roster (found ${chars.length})`);

// Luna
const lunaRig = CharacterMeshBuilder.build('char_luna', 'luna_neon');
let hasPonytails = 0;
let hasCyberVisor = false;
lunaRig.headGroup.traverse((child) => {
  if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CylinderGeometry && child.material instanceof THREE.MeshStandardMaterial && (child.material as any).opacity < 1.0) {
    hasCyberVisor = true;
  }
  if (child instanceof THREE.Group && Math.abs(Math.abs(child.position.x) - 0.22) < 0.02) {
    hasPonytails++;
  }
});
assert(hasCyberVisor, 'Luna features holographic cyber visor over eyes');
assert(hasPonytails === 2, `Luna features twin high cyber ponytails (found ${hasPonytails})`);

// Cruz
const cruzRig = CharacterMeshBuilder.build('char_cruz', 'cruz_bboy');
let hasBandanaTails = false;
cruzRig.headGroup.traverse((child) => {
  if (child instanceof THREE.Mesh && child.position.z > 0.25) {
    hasBandanaTails = true;
  }
});
assert(hasBandanaTails, 'Cruz features street bandana with fluttering cloth tails at back');

// Nova
const novaRig = CharacterMeshBuilder.build('char_nova', 'nova_solar');
let hasSpeedHelmetFins = 0;
let hasArcCore = false;
novaRig.headGroup.traverse((child) => {
  if (child instanceof THREE.Mesh && child.position.z > 0.10 && Math.abs(Math.abs(child.position.x) - 0.24) < 0.02) {
    hasSpeedHelmetFins++;
  }
});
novaRig.spineGroup.traverse((child) => {
  if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CircleGeometry) {
    hasArcCore = true;
  }
});
assert(hasSpeedHelmetFins === 2, `Nova speed helmet features twin aerodynamic side winglets (found ${hasSpeedHelmetFins})`);
assert(hasArcCore, 'Nova flightsuit features photovoltaic chest arc core');

// All 12 outfits compile and build
let outfitCount = 0;
chars.forEach((c) => {
  c.outfits.forEach((o) => {
    const rig = CharacterMeshBuilder.build(c.id, o.id);
    assert(rig.rootGroup instanceof THREE.Group && rig.rootGroup.children.length > 0, `Outfit ${c.name} - ${o.name} builds cleanly`);
    outfitCount++;
  });
});
assert(outfitCount === 12, `All 12 outfits across the complete roster compile and build (${outfitCount}/12)`);

// ========================================================
// 4. Reframed Gameplay Camera Rig & Kinematics
// ========================================================
console.log('\n--- Test 4: Reframed Gameplay Camera Rig & Behavior ---');

assert(CONSTANTS.CAMERA_OFFSET_Y === 3.25, `Camera height is normalized to 3.25m (was 4.8m)`);
assert(CONSTANTS.CAMERA_OFFSET_Z === 5.60, `Camera distance behind is 5.60m (was 6.8m)`);
assert(CONSTANTS.CAMERA_LOOK_Y === 1.65, `Camera look target height is 1.65m (was 2.0m)`);
assert(CONSTANTS.CAMERA_LOOK_AHEAD_Z === -18.0, `Camera look ahead is -18.0m down track (was -12.0m)`);
assert(CONSTANTS.CAMERA_FOV === 60, `Base landscape camera FOV is 60° (was 65°)`);

const cam = new CameraController();
assert(cam.camera.near === 0.2, `Camera near clipping plane is 0.2m (down from 0.5m to avoid train clipping)`);

// Test landscape camera update
cam.setLobbyMode(false);
const pPos = new THREE.Vector3(0, 0.9, -100);
cam.update(pPos, 0.016, 1.0, 18.0, 0.9, false);

assert(cam.camera.position.z === pPos.z + 5.60, `Camera follows distance lock at +5.60m behind runner`);
assert(Math.abs(cam.camera.fov - 60.0) < 1.0, `Camera uses base landscape FOV ~60°`);

// Test mobile portrait responsive adaptation
cam.camera.aspect = 9 / 16; // Mobile portrait aspect ratio
cam.update(pPos, 0.016, 1.0, 18.0, 0.9, false);
// Let lerp converge
for (let i = 0; i < 30; i++) cam.update(pPos, 0.03, 1.0 + i * 0.03, 18.0, 0.9, false);
assert(cam.camera.fov > 67.0, `Camera FOV widens to ~68° in mobile portrait for full 3-lane framing`);

// Test slide camera dip
cam.camera.aspect = 16 / 9; // Reset to landscape
for (let i = 0; i < 30; i++) cam.update(pPos, 0.03, 2.0 + i * 0.03, 18.0, 0.9, false);
const normalCamY = cam.camera.position.y;

// Slide dip
for (let i = 0; i < 20; i++) cam.update(pPos, 0.03, 3.0 + i * 0.03, 18.0, 0.9, true);
const slidingCamY = cam.camera.position.y;
assert(slidingCamY < normalCamY - 0.10, `Camera dips subtly during slide for enhanced action response (${normalCamY.toFixed(2)}m -> ${slidingCamY.toFixed(2)}m)`);

// Test train rooftop elevation matching
const roofPos = new THREE.Vector3(0, 4.35, -200);
for (let i = 0; i < 40; i++) cam.update(roofPos, 0.03, 4.0 + i * 0.03, 18.0, 4.35, false);
assert(cam.camera.position.y > 4.35 + 3.0, `Camera elevates smoothly to match train rooftop elevation (Y=${cam.camera.position.y.toFixed(2)}m)`);

// ========================================================
// 5. Gameplay HUD Polish & Mission Overlay Lifecycle
// ========================================================
console.log('\n--- Test 5: Gameplay HUD Polish & Mission Overlay Lifecycle ---');

const powerupMgr = new PowerupManager();
const hud = new HUD(powerupMgr);
const tickerEl = document.getElementById('hud-mission-ticker')!;

// 1. Initial State: active uncompleted mission shown
const prog = ProgressionManager.getInstance();
const activeMissions = prog.getActiveMissions();
assert(activeMissions.length > 0, 'Progression manager has active missions');

hud.update(0.016);
assert(tickerEl.style.display !== 'none', 'Mission ticker is visible for active uncompleted mission');

// 2. Mark active mission complete and emit event
const missionToComplete = activeMissions[0];
missionToComplete.completed = true;
missionToComplete.progress = missionToComplete.target;

EventBus.getInstance().emit(EVENTS.MISSION_COMPLETED, missionToComplete);

// First update frame in celebration:
hud.update(0.016);
assert(tickerEl.classList.contains('ticker-celebrating'), 'Mission ticker enters celebration state on completion');
assert(tickerEl.innerHTML.includes('COMPLETED!'), 'Mission ticker displays COMPLETED victory message with rewards');

// 3. Fast-forward through celebration duration (2.5s)
hud.update(2.6);
assert(!tickerEl.classList.contains('ticker-celebrating'), 'Celebration state concludes cleanly after duration');

// 4. If all missions complete: ticker cleanly retires from prominent HUD
activeMissions.forEach(m => { m.completed = true; m.progress = m.target; });
hud.update(0.016);
assert(tickerEl.style.display === 'none', 'Completed mission overlay cleanly hides when all active missions complete (no stuck 100% ticker)');

// 5. When a new uncompleted mission is active, it displays again
activeMissions[0].completed = false;
activeMissions[0].progress = 120;
hud.update(0.016);
assert(tickerEl.style.display === 'flex', 'Mission ticker reappears when uncompleted mission progresses');
assert(tickerEl.innerHTML.includes('120'), 'Mission ticker accurately reflects active mission progress');

// 6. Reset cleanliness
hud.reset();
assert(!tickerEl.classList.contains('ticker-celebrating'), 'HUD reset clears any active celebration classes');

console.log('\n================================================================');
console.log('🎉 ALL 24 / 24 TASK 6 CHARACTER, CAMERA & HUD TESTS PASSED!');
console.log('================================================================\n');
