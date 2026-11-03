import assert from 'node:assert/strict';
import { ShopModal } from '../src/ui/ShopModal';
import { getAllCharacters } from '../src/characters/CharacterCatalog';
import { getAllHoverboards } from '../src/hoverboard/HoverboardCatalog';

let coins = 5000;
let owned = false, equipped = false, trials = 0;
const shop = Object.assign(Object.create(ShopModal.prototype), {
  upgradeManager: { getCoins: () => coins },
  progression: {
    isCharacterUnlocked: () => owned,
    getSelectedCharacter: () => equipped ? 'char_luna' : 'char_jax',
    getCharacterFreeRuns: () => trials,
    getHoverboardCharges: () => 5, getHeadstartCount: () => 2, getScoreBoosterCount: () => 2
  }
}) as any;
const luna = getAllCharacters().find(char => char.id === 'char_luna')!;
let card = shop.characterCard(luna);
assert.match(card, /BUY — 1,500/);
assert.doesNotMatch(card, /TRY FREE/);
coins = 0;
card = shop.characterCard(luna);
assert.match(card, /data-buy-char="char_luna" disabled/);
assert.match(card, /Need 1,500 more coins/);
owned = true;
card = shop.characterCard(luna);
assert.match(card, />EQUIP</);
assert.doesNotMatch(card, /data-buy-char/);
equipped = true;
card = shop.characterCard(luna);
assert.match(card, /disabled>EQUIPPED/);
assert.doesNotMatch(card, /data-buy-char/);
owned = false;
const requirement = { ...luna, unlock: { type: 'ACHIEVEMENT', description: 'Complete the runner challenge' } };
equipped = false;
card = shop.characterCard(requirement);
assert.match(card, /disabled>LOCKED — Complete the runner challenge/);
assert.doesNotMatch(card, /data-buy-char|TRY FREE/);
trials = 3;
card = shop.characterCard(luna);
assert.match(card, /TRY FREE · 3 LEFT/);
assert.match(card, /3 free trials remaining/);
equipped = true;
card = shop.characterCard(luna);
assert.match(card, /disabled>TRIAL ACTIVE/);
assert.doesNotMatch(card, /data-buy-char/);
for (const featured of [false, true]) {
  const boosters = shop.boosterCards(featured);
  for (const [id, price] of [['buy-board-pack', 300], ['buy-megapack', 850], ['buy-headstart', 400], ['buy-score-booster', 500]]) {
    assert.equal((boosters.match(new RegExp(`data-product="${id}"`, 'g')) || []).length, 1);
    assert.match(boosters, new RegExp(`BUY — ${price}`));
  }
}
shop.upgradeManager = { getCoins: () => 5000, getLevel: () => 5, getUpgradeCost: () => null, getDuration: () => 22 };
const maxed = { innerHTML: '', querySelectorAll: () => [] };
shop.renderUpgrades(maxed);
assert.equal((maxed.innerHTML.match(/disabled>MAX LEVEL/g) || []).length, 5);
assert.doesNotMatch(maxed.innerHTML, /data-upgrade=/);
assert.equal(getAllCharacters().length, 6);
assert.equal(getAllHoverboards().length, 4);
console.log('VERDICT: PASS — truthful Shop action states, genuine manager trials and unchanged booster products/prices');
