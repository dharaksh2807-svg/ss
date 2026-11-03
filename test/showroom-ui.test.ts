import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CharacterSelectModal } from '../src/ui/CharacterSelectModal';
import { HoverboardSelectModal } from '../src/ui/HoverboardSelectModal';
import { getAllCharacters } from '../src/characters/CharacterCatalog';
import { getAllHoverboards } from '../src/hoverboard/HoverboardCatalog';

let owned = false, selected = 'char_jax', coins = 5000, outfitOwned = true, trials = 0;
const action: any = {}, trial: any = {}, note: any = {};
const luna = getAllCharacters().find(char => char.id === 'char_luna')!;
const runner = Object.assign(Object.create(CharacterSelectModal.prototype), {
  actionBtn: action, selectedOutfitId: luna.outfits[0].id,
  element: { querySelector: (selector: string) => selector === '#char-trial-btn' ? trial : note },
  progression: {
    isCharacterUnlocked: () => owned, isOutfitUnlocked: () => outfitOwned,
    getSelectedCharacter: () => selected, getSelectedOutfit: () => luna.outfits[0].id,
    getCharacterFreeRuns: () => trials,
  }, upgradeManager: { getCoins: () => coins }
}) as any;
runner.updateActionButton(luna);
assert.match(action.textContent, /BUY RUNNER — 1,500/);
assert.equal(action.disabled, false);
assert.equal(trial.hidden, true);
coins = 0; runner.updateActionButton(luna); assert.equal(action.disabled, true);
trials = 3; runner.updateActionButton(luna); assert.equal(trial.hidden, false);
selected = luna.id; runner.updateActionButton(luna);
assert.match(action.textContent, /TRIAL ACTIVE/); assert.equal(action.disabled, true);
owned = true; runner.updateActionButton(luna);
assert.match(action.textContent, /EQUIPPED/); assert.equal(trial.hidden, true);
selected = 'char_jax'; runner.updateActionButton(luna);
assert.match(action.textContent, /EQUIP RUNNER/);
outfitOwned = false; coins = 10000;
runner.selectedOutfitId = luna.outfits[1].id;
runner.updateActionButton(luna); assert.match(action.textContent, /BUY OUTFIT/);

const board = Object.assign(Object.create(HoverboardSelectModal.prototype), {
  previewBoardGroup: new THREE.Group(), currentPreviewBuilt: null
}) as any;
board.updatePreviewBoard('board_urban_glide');
const original = board.currentPreviewBuilt;
let disposed = 0;
const geometries = new Set<THREE.BufferGeometry>();
original.group.traverse((object: any) => { if (object.isMesh) geometries.add(object.geometry); });
for (const geometry of geometries) geometry.addEventListener('dispose', () => disposed++);
board.updatePreviewBoard('board_urban_glide');
assert.equal(board.currentPreviewBuilt, original, 'same preview is reused');
assert.equal(disposed, 0);
board.updatePreviewBoard('board_pulse_rider');
assert.equal(disposed, geometries.size, 'replaced geometry is disposed once');
assert.equal(board.previewBoardGroup.children.length, 1);
assert.equal(board.currentPreviewBuilt.definition.id, 'board_pulse_rider');
assert.equal(getAllHoverboards().length, 4);
console.log('VERDICT: PASS — runner purchase/equip/trial/outfit states and preview reuse/resource disposal');
