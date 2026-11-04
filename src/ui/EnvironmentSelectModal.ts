import { EventBus, EVENTS } from '../core/EventBus';
import { EnvironmentManager, EnvironmentSelection } from '../environment/EnvironmentConfig';
import { ProgressionManager } from '../progression/ProgressionManager';
import { getWorld, getWorlds } from '../environment/WorldCatalog';
import { UpgradeManager } from '../player/UpgradeManager';

export class EnvironmentSelectModal {
  private element: HTMLElement;
  private envManager = EnvironmentManager.getInstance();
  // Only an unsaved UI selection. Ownership and the equipped theme always come from the manager.
  private selectedPreference: EnvironmentSelection = 'DYNAMIC';
  private onSelectCallback?: (pref: EnvironmentSelection) => void;

  constructor(onSelect?: (pref: EnvironmentSelection) => void) {
    this.onSelectCallback = onSelect;
    let el = document.getElementById('environment-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'environment-modal';
      el.className = 'screen-overlay hidden';
      document.getElementById('ui-overlay')?.appendChild(el);
    }
    el.innerHTML = `<div class="modal-card env-modal-card">
      <header class="env-header"><div><span class="env-eyebrow">METRO RUNNER · CUSTOMIZATION</span><h2>WORLDS</h2>
        <p id="env-current-world"></p></div><div class="env-wallet" aria-label="Coin balance">🪙 <span id="env-wallet-coins"></span></div></header>
      <div class="env-options-grid custom-scroll" id="env-options-list"></div>
      <p class="env-feedback hidden" id="env-feedback" role="status" aria-live="polite"></p>
      <footer class="env-footer"><button id="env-close-btn" class="env-button secondary">BACK</button>
        <button id="env-home-btn" class="env-button secondary">HOME</button>
        <button id="env-confirm-btn" class="env-button primary">EQUIP WORLD</button></footer>
    </div>`;
    this.element = el;
    document.getElementById('env-close-btn')?.addEventListener('click', () => this.hide());
    document.getElementById('env-home-btn')?.addEventListener('click', () => EventBus.getInstance().emit('GO_TO_MENU'));
    document.getElementById('env-confirm-btn')?.addEventListener('click', () => this.applySelection());
    const bus = EventBus.getInstance();
    for (const event of ['CHARACTER_UNLOCKED', 'CHARACTER_EQUIPPED', 'ENVIRONMENT_PREFERENCE_CHANGED', 'WALLET_UPDATED']) {
      bus.on(event, () => {
        if (event === 'ENVIRONMENT_PREFERENCE_CHANGED') this.selectedPreference = this.envManager.getSelectionPreference();
        if (!this.element.classList.contains('hidden')) this.render();
      });
    }
  }

  public show(): void {
    this.selectedPreference = this.envManager.getSelectionPreference();
    document.getElementById('env-feedback')?.classList.add('hidden');
    this.render();
    this.element.classList.remove('hidden');
  }

  public hide(restorePrevious: boolean = true): void {
    if (restorePrevious) {
      EventBus.getInstance().emit(EVENTS.UI_BACK, 'WORLDS');
      return;
    }
    this.element.classList.add('hidden');
  }

  private render(): void {
    const list = document.getElementById('env-options-list');
    if (!list) return;
    const progression = ProgressionManager.getInstance();
    const current = progression.getSelectedTheme();
    const worlds = getWorlds(progression.getState());
    const coins = UpgradeManager.getInstance().getCoins();
    const focused = typeof document.activeElement !== 'undefined' ? document.activeElement as HTMLElement : null;
    const focusKey = focused && list.contains?.(focused) ? { ...focused.dataset } : null;
    const scrollTop = list.scrollTop || 0;
    const stateLabel = (id: string) => current === id ? 'EQUIPPED' : this.selectedPreference === id ? 'SELECTED · NOT EQUIPPED' : '';
    const title = document.getElementById('env-current-world');
    if (title) title.textContent = `Equipped for next run: ${current === 'DYNAMIC' ? 'Dynamic Districts' : getWorld(current)?.displayName || current}`;
    const balance = document.getElementById('env-wallet-coins');
    if (balance) balance.textContent = coins.toLocaleString();
    const confirm = document.getElementById('env-confirm-btn') as HTMLButtonElement | null;
    if (confirm) {
      confirm.disabled = this.selectedPreference === current;
      confirm.textContent = confirm.disabled ? 'EQUIPPED' : this.selectedPreference === 'DYNAMIC' ? 'EQUIP DYNAMIC' : 'EQUIP WORLD';
    }
    list.innerHTML = `<section class="env-dynamic-card ${this.selectedPreference === 'DYNAMIC' ? 'selected' : ''}">
      <button class="env-card-option ${this.selectedPreference === 'DYNAMIC' ? 'selected' : ''} env-dynamic-select" data-env-id="DYNAMIC" aria-pressed="${this.selectedPreference === 'DYNAMIC'}">
        <span class="env-dynamic-icon" aria-hidden="true">🔄</span><span><span class="env-eyebrow">AUTOMATIC ROUTE · MULTIPLE DISTRICTS</span>
        <strong>Dynamic Districts</strong><span class="env-description">Rotate through the four free districts. Add owned premium worlds from Shop settings. Signature worlds stay separate.</span>
        <span class="env-selection-label">${stateLabel('DYNAMIC') || 'FREE · AUTOMATIC DISTRICT CHANGES'}</span></span></button>
      <button class="env-button ${current === 'DYNAMIC' ? 'equipped' : 'primary'}" data-equip-env="DYNAMIC" ${current === 'DYNAMIC' ? 'disabled' : ''}>${current === 'DYNAMIC' ? 'EQUIPPED' : 'EQUIP DYNAMIC'}</button>
    </section>
    <div class="env-library-heading"><div><h3>Choose one world</h3><p>A fixed district for your next run.</p></div>
      <button class="env-button secondary" data-action="open-shop-worlds">VISIT SHOP</button></div>
    <div class="env-world-grid">${worlds.map(world => {
      const canSelect = world.available && (world.owned || world.trialing || current === world.id);
      const selected = this.selectedPreference === world.id;
      const runner = world.signatureCharacterId
        ? (world.signatureCharacterId === 'char_rahul_gandhi'
          ? 'Requires Rahul Gandhi ownership, or an available equipped runner trial.'
          : 'Requires Narendra Modi ownership, or an available equipped runner trial.')
        : '';
      const requirement = world.owned ? world.signatureCharacterId ? 'OWNED · SIGNATURE WORLD' : world.unlock === 'FREE' ? 'FREE · OWNED' : 'OWNED'
        : world.trialing ? 'RUNNER TRIAL · NOT PERMANENTLY OWNED' : runner || `LOCKED · ${world.coinCost.toLocaleString()} coins`;
      const selectable = canSelect ? `data-env-id="${world.id}" aria-pressed="${selected}"` : `data-shop-world="${world.id}" data-world-action="PREVIEW"`;
      return `<article class="env-world-card ${selected ? 'selected' : ''} ${current === world.id ? 'equipped' : ''}" data-world-id="${world.id}" style="--world-accent: ${world.accentColor}">
        <button class="env-card-option ${selected ? 'selected' : ''} env-world-select" ${selectable} ${world.available ? '' : 'disabled'}>
          <span class="env-preview"><img src="${world.previewImage}" alt="${world.displayName}" loading="lazy"><span class="env-world-badge">${world.signatureLabel || world.rarity}</span></span>
          <span class="env-world-copy"><strong>${world.displayName}</strong><span class="env-world-subtitle">${world.subtitle || world.tagline || ''}</span>
            <span class="env-description">${world.description}</span><span class="env-selection-label">${stateLabel(world.id) || (canSelect ? 'SELECT WORLD' : 'PREVIEW WORLD')}</span></span>
        </button>
        <div class="env-world-details"><p>${requirement}</p><span class="env-world-feature">${world.features[0] || ''}</span></div>
        <div class="env-world-actions">${!world.available ? '<button class="env-button secondary" disabled>UNAVAILABLE</button>'
          : current === world.id ? '<button class="env-button equipped" disabled>EQUIPPED</button>'
          : canSelect ? `<button class="env-button primary" data-equip-env="${world.id}">EQUIP</button>`
          : world.signatureCharacterId ? `<button class="env-button secondary" data-shop-world="${world.id}" data-world-action="PREVIEW">VIEW UNLOCK REQUIREMENT</button>`
          : `<button class="env-button buy" data-shop-world="${world.id}" data-world-action="BUY" ${coins >= world.coinCost ? '' : 'disabled'}>BUY — ${world.coinCost.toLocaleString()} 🪙</button>${coins < world.coinCost ? `<span class="env-funds-note">Need ${(world.coinCost - coins).toLocaleString()} more coins</span>` : ''}`}
          ${!canSelect ? `<button class="env-button secondary" data-shop-world="${world.id}" data-world-action="PREVIEW">PREVIEW</button>` : ''}
        </div></article>`;
    }).join('')}</div>
    <p class="env-library-note">EXPLORE PREMIUM WORLDS IN SHOP · Purchases use the same wallet and ownership everywhere. Changes made while paused apply to the next run.</p>`;
    list.querySelectorAll<HTMLElement>('[data-env-id]').forEach(card => card.addEventListener('click', () => {
      const id = card.getAttribute('data-env-id') as EnvironmentSelection;
      if (id !== 'DYNAMIC' && !progression.isThemeUnlocked(id)) return;
      this.selectedPreference = id;
      this.render();
    }));
    if (typeof list.querySelector === 'function') {
      list.querySelectorAll<HTMLElement>('[data-equip-env]').forEach(button => button.addEventListener('click', () => {
        this.selectedPreference = button.dataset.equipEnv as EnvironmentSelection;
        this.applySelection();
      }));
      list.querySelectorAll<HTMLElement>('[data-shop-world]').forEach(button => button.addEventListener('click', () => {
        EventBus.getInstance().emit('OPEN_WORLD_SHOP', button.dataset.shopWorld, button.dataset.worldAction);
      }));
      list.querySelector('[data-action="open-shop-worlds"]')?.addEventListener('click', () => EventBus.getInstance().emit('OPEN_SHOP', 'WORLDS'));
      if (focusKey) {
        const replacement = [...list.querySelectorAll<HTMLElement>('button')].find(button => Object.entries(focusKey).every(([key, value]) => button.dataset[key] === value));
        replacement?.focus({ preventScroll: true });
      }
    }
    list.scrollTop = scrollTop;
  }

  private applySelection(): void {
    const result = ProgressionManager.getInstance().equipTheme(this.selectedPreference);
    if (!result.success) {
      const feedback = document.getElementById('env-feedback');
      if (feedback) { feedback.textContent = result.message; feedback.classList.remove('hidden'); }
      return;
    }
    this.onSelectCallback?.(this.selectedPreference);
    this.hide();
  }
}
