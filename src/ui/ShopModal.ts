import { EventBus, EVENTS } from '../core/EventBus';
import { UpgradeManager, UPGRADE_CONFIGS, UpgradablePowerup } from '../player/UpgradeManager';
import { ProgressionManager } from '../progression/ProgressionManager';
import { CharacterDefinition, getAllCharacters } from '../characters/CharacterCatalog';
import { getAllHoverboards } from '../hoverboard/HoverboardCatalog';
import { getPowerupIconSvg } from './IconCatalog';
import { getWorld, getWorlds, WorldDefinition } from '../environment/WorldCatalog';

export type ShopCategory = 'FEATURED' | 'UPGRADES' | 'BOOSTERS' | 'CHARACTERS' | 'HOVERBOARDS' | 'WORLDS';

export class ShopModal {
  private element: HTMLElement;
  private currentCategory: ShopCategory = 'FEATURED';
  private upgradeManager = UpgradeManager.getInstance();
  private progression = ProgressionManager.getInstance();
  private eventBus = EventBus.getInstance();
  private toastTimer?: ReturnType<typeof setTimeout>;
  private dialogFocus: HTMLElement | null = null;

  constructor() {
    let el = document.getElementById('shop-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'shop-modal';
      el.className = 'screen-overlay hidden';
      document.getElementById('ui-overlay')?.appendChild(el);
    }
    this.element = el;
    this.renderContainer();
    this.setupEvents();
  }

  private renderContainer(): void {
    this.element.innerHTML = `
      <div class="modal-card arcade-modal-card shop-card animate-pop">
        <!-- Header -->
        <div class="modal-top-bar shop-top-bar">
          <div class="modal-title-group">
            <span class="modal-badge-tag gold-tag">METRO RUNNER • GEAR STORE</span>
            <h2 class="arcade-title">METRO SHOP</h2>
          </div>
          <div class="currency-pill gold-pill" id="shop-wallet-pill" aria-label="Coin balance">
              <span class="shop-wallet-label">COINS</span>
              <span class="pill-icon">🪙</span>
              <span id="shop-wallet-coins" class="pill-value">0</span>
          </div>
          <button id="shop-close-btn" class="arcade-icon-btn close-btn" aria-label="Back to previous screen" title="Back">✕</button>
        </div>

        <!-- Shop Category Navigation Tabs -->
        <nav class="arcade-tabs-nav" id="shop-tabs" aria-label="Shop categories">
          <button class="arcade-tab-btn active" data-cat="FEATURED">⭐ FEATURED</button>
          <button class="arcade-tab-btn" data-cat="UPGRADES">⚡ UPGRADES</button>
          <button class="arcade-tab-btn" data-cat="BOOSTERS">🚀 BOOSTERS</button>
          <button class="arcade-tab-btn" data-cat="CHARACTERS">👤 RUNNERS</button>
          <button class="arcade-tab-btn" data-cat="HOVERBOARDS">🛹 BOARDS</button>
          <button class="arcade-tab-btn" data-cat="WORLDS">🌐 WORLDS</button>
        </nav>

        <!-- Shop Content Container -->
        <div class="shop-content-scroll custom-scroll" id="shop-content">
          <!-- Dynamically populated category content -->
        </div>

        <!-- Feedback Toast Message Container -->
        <div id="shop-toast" class="shop-toast hidden" role="status" aria-live="polite"></div>
      </div>
    `;

    // Bind category tabs
    const tabs = this.element.querySelectorAll('#shop-tabs .arcade-tab-btn');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const cat = (e.currentTarget as HTMLElement).dataset.cat as ShopCategory;
        if (cat) {
          this.switchCategory(cat);
        }
      });
    });

    const closeBtn = this.element.querySelector('#shop-close-btn') as HTMLButtonElement;
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
  }

  private setupEvents(): void {
    this.eventBus.on('WALLET_UPDATED', () => {
      this.updateWallet();
      if (this.isVisible()) this.renderCategoryContent();
    });
    this.eventBus.on('UPGRADES_UPDATED', () => {
      if (this.isVisible()) this.renderCategoryContent();
    });
    this.eventBus.on('BOOSTERS_UPDATED', () => {
      if (this.isVisible()) this.renderCategoryContent();
    });
    this.eventBus.on('BOARD_CHARGES_UPDATED', () => {
      if (this.isVisible()) this.renderCategoryContent();
    });
    for (const event of ['CHARACTER_EQUIPPED', 'BOARD_EQUIPPED', 'ENVIRONMENT_PREFERENCE_CHANGED',
      'CHARACTER_UNLOCKED', 'BOARD_UNLOCKED', 'OUTFIT_UNLOCKED', EVENTS.KEYS_UPDATED]) {
      this.eventBus.on(event, () => {
        if (this.isVisible()) this.renderCategoryContent();
      });
    }
  }

  public show(category: ShopCategory = this.currentCategory): void {
    this.currentCategory = category;
    this.updateWallet();
    this.switchCategory(category);
    this.element.classList.remove('hidden');
  }

  public hide(restorePrevious: boolean = true): void {
    if (restorePrevious) {
      this.eventBus.emit(EVENTS.UI_BACK, 'SHOP');
      return;
    }
    this.closeModals();
    this.element.classList.add('hidden');
  }

  public handleEscape(): boolean {
    if (!this.element.querySelector('#world-confirm-overlay, #world-showcase-overlay')) return false;
    this.closeModals();
    return true;
  }

  public isVisible(): boolean {
    return !this.element.classList.contains('hidden');
  }

  private updateWallet(): void {
    const el = this.element.querySelector('#shop-wallet-coins');
    if (el) {
      el.textContent = this.upgradeManager.getCoins().toLocaleString();
    }
    this.updateConfirmationWallet();
  }

  private switchCategory(cat: ShopCategory): void {
    this.currentCategory = cat;
    const tabs = this.element.querySelectorAll('#shop-tabs .arcade-tab-btn');
    tabs.forEach((t) => {
      if ((t as HTMLElement).dataset.cat === cat) {
        t.classList.add('active');
        t.setAttribute('aria-current', 'page');
      } else {
        t.classList.remove('active');
        t.removeAttribute('aria-current');
      }
    });
    this.renderCategoryContent();
    const content = this.element.querySelector('#shop-content');
    if (content) content.scrollTop = 0;
  }

  private showToast(message: string, isError: boolean = false): void {
    const toast = this.element.querySelector('#shop-toast') as HTMLElement;
    if (!toast) return;
    toast.textContent = message;
    toast.className = `shop-toast ${isError ? 'toast-error shake-anim' : 'toast-success bounce-anim'}`;
    toast.classList.remove('hidden');
    if (!isError) {
      this.eventBus.emit(EVENTS.ITEM_PURCHASED);
    }
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  private renderCategoryContent(): void {
    const content = this.element.querySelector('#shop-content') as HTMLElement;
    if (!content) return;
    const focused = document.activeElement as HTMLElement | null;
    const restoreFocus = !!focused && content.contains(focused);
    const scrollTop = content.scrollTop;
    const headings: Record<ShopCategory, [string, string]> = {
      FEATURED: ['Run-ready picks', 'Signature runners and supplies for your next run.'],
      UPGRADES: ['Make every power-up count', 'Permanent duration upgrades. Your progress stays with you.'],
      BOOSTERS: ['Stock up for the next run', 'Consumable supplies. Your current inventory is shown on each card.'],
      CHARACTERS: ['Find your runner', 'Explore every runner, outfit style and available free trial.'],
      HOVERBOARDS: ['Choose your ride', 'Permanent boards with distinct abilities. Deployments use board charges.'],
      WORLDS: ['Your next destination', 'Explore every district. Owned worlds are free to equip.']
    };
    const [title, subtitle] = headings[this.currentCategory];
    content.innerHTML = `<header class="shop-section-heading"><h3>${title}</h3><p>${subtitle}</p></header>`;

    switch (this.currentCategory) {
      case 'FEATURED':
        this.renderFeatured(content);
        break;
      case 'UPGRADES':
        this.renderUpgrades(content);
        break;
      case 'BOOSTERS':
        this.renderBoosters(content);
        break;
      case 'CHARACTERS':
        this.renderCharacters(content);
        break;
      case 'HOVERBOARDS':
        this.renderHoverboards(content);
        break;
      case 'WORLDS':
        this.renderWorlds(content);
        break;
    }
    content.scrollTop = scrollTop;
    if (restoreFocus) {
      const replacement = [...content.querySelectorAll<HTMLElement>('button, [tabindex]')].find(el =>
        !el.hasAttribute('disabled') && (focused!.id ? el.id === focused!.id
          : Object.keys(focused!.dataset).length > 0 && Object.entries(focused!.dataset).every(([key, value]) => el.dataset[key] === value)));
      (replacement || this.element.querySelector<HTMLElement>('#shop-tabs .active'))?.focus({ preventScroll: true });
    }
  }

  private renderWorlds(container: HTMLElement): void {
    const worlds = getWorlds(this.progression.getState());
    const currentCoins = this.upgradeManager.getCoins();
    const isDynamicOptedIn = this.progression.getState().includePremiumThemesInDynamic;

    container.innerHTML += `
      <div class="worlds-store-header-card">
        <span class="modal-badge-tag cyan-tag">DISTRICT ATLAS</span>
        <div class="dynamic-districts-feature-card">
          <div class="dynamic-toggle-left">
            <h4 class="dynamic-toggle-title">Premium worlds in Dynamic</h4>
            <p class="dynamic-toggle-desc">Include owned premium districts in automatic routes.</p>
          </div>
          <div class="dynamic-toggle-right">
            <label class="switch-control" for="premium-dynamic-toggle">
              <input type="checkbox" data-premium-dynamic id="premium-dynamic-toggle" aria-label="Include owned premium worlds in Dynamic routes" ${isDynamicOptedIn ? 'checked' : ''}>
              <span class="switch-slider"></span>
            </label>
            <span class="dynamic-status-label ${isDynamicOptedIn ? 'status-enabled' : 'status-disabled'}">${isDynamicOptedIn ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      </div>

      <div class="worlds-shop-grid">
        ${worlds.map((world) => {
          const isFree = world.unlock === 'FREE';
          const canAfford = currentCoins >= world.coinCost;
          const statusClass = world.equipped ? 'status-equipped' : (world.owned ? 'status-owned' : 'status-locked');
          const statusText = world.trialing ? (world.equipped ? 'TRIAL ACTIVE' : 'TRIAL AVAILABLE') : world.equipped ? 'EQUIPPED' : world.owned ? 'OWNED' : world.unlock === 'COINS' ? 'AVAILABLE' : 'LOCKED';
          const rarityClass = `rarity-${world.rarity.toLowerCase()}`;

          return `
            <div class="world-shop-card ${world.owned ? 'owned' : 'locked'} ${world.equipped ? 'equipped' : ''}" style="--world-accent: ${world.accentColor}">
              <div class="world-accent-line"></div>
              
              <div class="world-card-preview" data-preview-world="${world.id}" role="button" tabindex="0" title="Click to view full 3D showcase">
                <img src="${world.previewImage}" alt="${world.displayName}" class="world-card-img" loading="lazy" />
                <div class="world-preview-overlay">
                  <span class="world-preview-pill">👁️ 3D PREVIEW</span>
                </div>
                <div class="world-badges-row">
                  <span class="world-rarity-pill ${rarityClass}">${world.signatureLabel ? world.signatureLabel : `${world.rarity}${isFree ? ' · FREE' : ''}`}</span>
                  <span class="world-icon-badge">${world.icon}</span>
                </div>
              </div>

              <div class="world-card-body">
                <div class="world-card-title-row">
                  <h4 class="world-card-title">${world.displayName}</h4>
                  <span class="world-card-status ${statusClass}">${statusText}</span>
                </div>
                <div class="world-card-subtitle">${world.subtitle || 'Playable District'}</div>
                <p class="world-card-desc">${world.description}</p>
                <div class="world-features-row">
                  ${(world.features || []).map((f) => `<span class="world-feature-tag">✦ ${f}</span>`).join('')}
                </div>
              </div>

              <div class="world-card-footer">
                <button class="arcade-btn btn-ghost world-preview-btn" data-preview-world="${world.id}">👁️ PREVIEW</button>
                ${!world.available
                  ? `<button class="arcade-btn btn-disabled" disabled>COMING SOON</button>`
                  : world.equipped
                  ? `<button class="arcade-btn btn-equipped" disabled>${world.trialing ? 'TRIAL ACTIVE' : 'EQUIPPED'}</button>`
                  : world.owned
                  ? `<button class="arcade-btn btn-secondary" data-equip-world="${world.id}">EQUIP</button>`
                  : world.signatureCharacterId
                  ? `<button class="arcade-btn btn-secondary" data-action="unlock-signature" data-char-id="${world.signatureCharacterId}">VIEW RUNNER · REQUIRED</button>`
                  : `<button class="arcade-btn ${canAfford ? 'btn-gold' : 'btn-disabled'}" data-buy-world="${world.id}" ${canAfford ? '' : 'disabled'}>
                      BUY — ${world.coinCost.toLocaleString()} 🪙
                    </button>
                    ${!canAfford ? `<span class="shop-funds-note">Need ${(world.coinCost - currentCoins).toLocaleString()} more coins</span>` : ''}`
                }
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.querySelectorAll<HTMLElement>('[data-preview-world]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const worldId = btn.dataset.previewWorld;
        if (worldId) this.openWorldPreview(worldId);
      });
      btn.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const worldId = btn.dataset.previewWorld;
          if (worldId) this.openWorldPreview(worldId);
        }
      });
    });

    container.querySelectorAll<HTMLButtonElement>('[data-buy-world]').forEach((button) => {
      button.addEventListener('click', () => {
        const worldId = button.dataset.buyWorld;
        if (worldId) {
          this.openBuyConfirmation(worldId);
        }
      });
    });

    container.querySelectorAll<HTMLButtonElement>('[data-equip-world]').forEach((button) => {
      button.addEventListener('click', () => {
        button.disabled = true;
        const result = this.progression.equipTheme(button.dataset.equipWorld!);
        this.showToast(result.message, !result.success);
        this.renderCategoryContent();
      });
    });

    container.querySelectorAll<HTMLButtonElement>('[data-action="unlock-signature"]').forEach((button) => {
      button.addEventListener('click', () => {
        const charId = button.dataset.charId || 'char_modi';
        this.eventBus.emit('OPEN_CHARACTERS', { source: 'SHOP', charId });
      });
    });

    container.querySelector<HTMLInputElement>('[data-premium-dynamic]')?.addEventListener('change', (event) => {
      const result = this.progression.setIncludePremiumThemesInDynamic((event.target as HTMLInputElement).checked);
      if (!result.success) this.showToast(result.message, true);
      this.renderCategoryContent();
    });
  }

  public openBuyConfirmation(worldId: string): void {
    const world = getWorld(worldId);
    if (!world) return;
    this.closeModals();

    const currentCoins = this.upgradeManager.getCoins();
    const canAfford = currentCoins >= world.coinCost;
    const remainingCoins = currentCoins - world.coinCost;

    const overlay = document.createElement('div');
    overlay.id = 'world-confirm-overlay';
    overlay.dataset.price = String(world.coinCost);
    overlay.className = 'world-modal-backdrop animate-fade-in';
    overlay.innerHTML = `
      <div class="world-confirm-card animate-pop" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" style="--world-accent: ${world.accentColor}">
        <div class="world-modal-accent-bar"></div>
        <div class="world-confirm-header">
          <div class="world-confirm-title-group">
            <span class="world-rarity-pill rarity-${world.rarity.toLowerCase()}">${world.rarity} DISTRICT</span>
            <h3 id="confirm-dialog-title" class="world-confirm-title">Unlock ${world.displayName}</h3>
            <span class="world-confirm-subtitle">${world.subtitle || ''}</span>
          </div>
          <button class="arcade-icon-btn close-btn" id="confirm-close-btn" aria-label="Close">✕</button>
        </div>

        <div class="world-confirm-preview-thumb">
          <img src="${world.previewImage}" alt="${world.displayName}" class="confirm-thumb-img" />
          <div class="confirm-thumb-badge">${world.icon}</div>
        </div>

        <div class="world-confirm-body">
          <p class="world-confirm-tagline">${world.tagline || world.description}</p>
          
          <div class="balance-breakdown">
            <div class="breakdown-row">
              <span class="breakdown-label">Current Balance</span>
              <span class="breakdown-value gold-value" data-confirm-balance>${currentCoins.toLocaleString()} 🪙</span>
            </div>
            <div class="breakdown-row debit-row">
              <span class="breakdown-label">Purchase Price</span>
              <span class="breakdown-value debit-value">-${world.coinCost.toLocaleString()} 🪙</span>
            </div>
            <div class="breakdown-divider"></div>
            <div class="breakdown-row remaining-row">
              <span class="breakdown-label">Balance Remaining</span>
              <span data-confirm-remaining class="breakdown-value ${canAfford ? 'remaining-value' : 'deficit-value'}">
                ${canAfford ? `${remainingCoins.toLocaleString()} 🪙` : 'INSUFFICIENT COINS'}
              </span>
            </div>
          </div>

          <div class="world-ownership-guarantee">
            <span class="guarantee-icon">🛡️</span>
            <div class="guarantee-text">
              <strong>Permanent World Ownership</strong>
              <span>Yours forever across all runs. Never charges again to equip. Eligible for Dynamic Districts.</span>
            </div>
          </div>
        </div>

        <div class="world-confirm-actions">
          <button class="arcade-btn btn-secondary" id="confirm-cancel-btn" data-cancel-confirm>CANCEL</button>
          <button class="arcade-btn ${canAfford ? 'btn-gold pulse-btn' : 'btn-disabled'}" 
                  id="confirm-execute-btn" 
                  data-confirm-buy="${world.id}" 
                  ${canAfford ? '' : 'disabled'}>
            ${canAfford ? `CONFIRM PURCHASE (${world.coinCost.toLocaleString()} 🪙)` : 'NOT ENOUGH COINS'}
          </button>
        </div>
      </div>
    `;

    this.mountDialog(overlay);

    overlay.querySelector('#confirm-close-btn')?.addEventListener('click', () => this.closeModals());
    overlay.querySelector('#confirm-cancel-btn')?.addEventListener('click', () => this.closeModals());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModals();
    });

    const executeBtn = overlay.querySelector<HTMLButtonElement>('#confirm-execute-btn');
    if (executeBtn) {
      let submitted = false;
      executeBtn.addEventListener('click', () => {
        if (submitted || executeBtn.disabled) return;
        submitted = true;
        executeBtn.disabled = true;
        const result = this.progression.purchaseTheme(world.id);
        this.closeModals();
        this.showToast(result.message, !result.success);
        this.updateWallet();
        this.renderCategoryContent();
      });
    }
  }

  public openWorldPreview(worldId: string): void {
    const world = getWorld(worldId);
    if (!world) return;
    this.closeModals();

    const state = getWorlds(this.progression.getState()).find(item => item.id === worldId)!;
    const isOwned = state.owned;
    const isEquipped = this.progression.getSelectedTheme() === world.id;
    const currentCoins = this.upgradeManager.getCoins();
    const canAfford = currentCoins >= world.coinCost;

    const overlay = document.createElement('div');
    overlay.id = 'world-showcase-overlay';
    overlay.dataset.worldId = world.id;
    overlay.className = 'world-modal-backdrop animate-fade-in';
    overlay.innerHTML = `
      <div class="world-showcase-card animate-pop" role="dialog" aria-modal="true" aria-labelledby="showcase-dialog-title" style="--world-accent: ${world.accentColor}">
        <div class="world-modal-accent-bar"></div>
        <button class="arcade-icon-btn close-btn showcase-close-btn" id="showcase-close-btn" aria-label="Close Showcase">✕</button>

        <div class="showcase-hero-container">
          <img src="${world.previewImage}" alt="${world.displayName}" class="showcase-hero-img" />
          <div class="showcase-hero-gradient"></div>
          <div class="showcase-hero-badges">
            <span class="world-rarity-pill rarity-${world.rarity.toLowerCase()}">${world.signatureLabel || world.rarity}${world.unlock === 'FREE' && !world.signatureCharacterId ? ' · FREE WORLD' : ''}</span>
            <span class="showcase-icon-badge">${world.icon}</span>
          </div>
          <div class="showcase-hero-titles">
            <h2 id="showcase-dialog-title" class="showcase-hero-title">${world.displayName}</h2>
            <p class="showcase-hero-subtitle">${world.subtitle || 'Playable District'}</p>
          </div>
        </div>

        <div class="showcase-body custom-scroll">
          <div class="showcase-section">
            <h4 class="showcase-section-heading">DISTRICT OVERVIEW</h4>
            <p class="showcase-description">${world.description}</p>
            ${world.tagline ? `<p class="showcase-tagline">“${world.tagline}”</p>` : ''}
          </div>

          <div class="showcase-section">
            <h4 class="showcase-section-heading">DISTRICT FEATURES & LANDMARKS</h4>
            <div class="showcase-features-grid">
              ${(world.features || []).map((f) => `
                <div class="showcase-feature-chip">
                  <span class="feature-chip-icon">✦</span>
                  <span class="feature-chip-label">${f}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="showcase-section">
            <h4 class="showcase-section-heading">RUNNER SPECIFICATIONS</h4>
            <div class="showcase-specs-list">
              <div class="showcase-spec-item">
                <span class="spec-label">Fairness & Balance</span>
                <span class="spec-val">100% Three-Lane Obstacle Fairness</span>
              </div>
              <div class="showcase-spec-item">
                <span class="spec-label">Atmosphere</span>
                <span class="spec-val">Dynamic Weather & Shifting Daylight</span>
              </div>
              <div class="showcase-spec-item">
                <span class="spec-label">Ownership</span>
                <span class="spec-val">${isOwned ? 'Permanently owned · Free to equip' : world.signatureCharacterId ? 'Requires the signature runner' : 'Permanent unlock with coins'}</span>
              </div>
              <div class="showcase-spec-item">
                <span class="spec-label">Dynamic Districts</span>
                <span class="spec-val">${world.dynamicEligible ? 'Eligible for automatic district transitions' : 'Standalone district only'}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="showcase-footer">
          <button class="arcade-btn btn-secondary" id="showcase-back-btn">CLOSE</button>
          ${isEquipped
            ? `<button class="arcade-btn btn-equipped" disabled>${state.trialing ? 'TRIAL ACTIVE' : 'EQUIPPED'}</button>`
            : isOwned
            ? `<button class="arcade-btn btn-secondary" id="showcase-equip-btn" data-equip-world="${world.id}">⚡ EQUIP THIS DISTRICT</button>`
            : world.signatureCharacterId
            ? `<button class="arcade-btn btn-secondary" id="showcase-runner-btn">VIEW REQUIRED RUNNER</button>`
            : `<button class="arcade-btn ${canAfford ? 'btn-gold pulse-btn' : 'btn-disabled'}" id="showcase-buy-btn" data-buy-preview-world="${world.id}" ${canAfford ? '' : 'disabled'}>
                BUY — ${world.coinCost.toLocaleString()} 🪙
              </button><span id="showcase-funds-note" class="shop-funds-note">${canAfford ? '' : `Need ${(world.coinCost - currentCoins).toLocaleString()} more coins`}</span>`
          }
        </div>
      </div>
    `;

    this.mountDialog(overlay);

    overlay.querySelector('#showcase-close-btn')?.addEventListener('click', () => this.closeModals());
    overlay.querySelector('#showcase-back-btn')?.addEventListener('click', () => this.closeModals());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModals();
    });

    const equipBtn = overlay.querySelector<HTMLButtonElement>('#showcase-equip-btn');
    if (equipBtn) {
      equipBtn.addEventListener('click', () => {
        const result = this.progression.equipTheme(world.id);
        this.closeModals();
        this.showToast(result.message, !result.success);
        this.renderCategoryContent();
      });
    }

    overlay.querySelector('#showcase-runner-btn')?.addEventListener('click', () => {
      this.closeModals();
      this.eventBus.emit('OPEN_CHARACTERS', { source: 'SHOP', charId: world.signatureCharacterId });
    });

    const buyBtn = overlay.querySelector<HTMLButtonElement>('#showcase-buy-btn');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        this.closeModals();
        this.openBuyConfirmation(world.id);
      });
    }
  }

  public closeModals(): void {
    this.element.querySelector('#world-confirm-overlay')?.remove();
    this.element.querySelector('#world-showcase-overlay')?.remove();
    if (this.dialogFocus && this.isVisible()) {
      const target = this.dialogFocus.isConnected ? this.dialogFocus : this.element.querySelector<HTMLElement>('#shop-tabs .active');
      target?.focus({ preventScroll: true });
    }
    this.dialogFocus = null;
  }

  // Shared card anatomy; catalog/manager values determine every state and price.
  private productCard(product: {
    name: string; description: string; feature: string; visual: string; badge: string;
    status: string; primary: string; secondary?: string; attributes?: string;
  }): string {
    return `<article class="shop-product-card" ${product.attributes || ''}>
      <div class="shop-product-visual">${product.visual}<span class="shop-product-badge">${product.badge}</span></div>
      <div class="shop-product-body"><h4>${product.name}</h4><p>${product.description}</p>
        <div class="shop-product-feature">${product.feature}</div><div class="shop-product-status">${product.status}</div></div>
      <div class="shop-product-actions">${product.primary}${product.secondary || ''}</div>
    </article>`;
  }

  private buyAction(cost: number, attributes: string): string {
    const shortfall = Math.max(0, cost - this.upgradeManager.getCoins());
    return `<button class="arcade-btn ${shortfall ? 'btn-disabled' : 'btn-gold'}" ${attributes} ${shortfall ? 'disabled' : ''}>
      BUY — ${cost.toLocaleString()} 🪙</button>${shortfall ? `<span class="shop-funds-note">Need ${shortfall.toLocaleString()} more coins</span>` : ''}`;
  }

  private characterCard(char: CharacterDefinition): string {
    const owned = this.progression.isCharacterUnlocked(char.id);
    const equipped = this.progression.getSelectedCharacter() === char.id;
    const trials = this.progression.getCharacterFreeRuns(char.id);
    const cost = char.unlock.cost || 0;
    const primary = equipped ? `<button class="arcade-btn btn-equipped" disabled>${owned ? 'EQUIPPED' : 'TRIAL ACTIVE'}</button>`
      : owned ? `<button class="arcade-btn btn-primary" data-equip-char="${char.id}">EQUIP</button>`
      : char.unlock.type === 'COINS' ? this.buyAction(cost, `data-buy-char="${char.id}"`)
      : `<button class="arcade-btn btn-disabled" disabled>LOCKED — ${char.unlock.description}</button>`;
    return this.productCard({
      name: char.name, description: (char.personality || char.bio).length > 110
        ? (char.personality || char.bio).slice(0, 107).replace(/\s+\S*$/, '') + '…' : char.personality || char.bio,
      feature: `${char.title} · Includes ${char.outfits[0].name}`,
      visual: char.previewImage ? `<img src="${char.previewImage}" alt="${char.name}" loading="lazy">` : `<span class="shop-product-icon" aria-hidden="true">${char.portraitIcon}</span>`,
      badge: char.rarity || 'COMMON', attributes: `data-char-id="${char.id}"`,
      status: owned ? (equipped ? 'Equipped runner · Permanently owned' : 'Owned · Ready to equip')
        : trials > 0 ? `${trials} free trials remaining · Not owned` : char.unlock.description,
      primary,
      secondary: `${!owned && !equipped && trials > 0 ? `<button class="arcade-btn btn-secondary" data-trial-char="${char.id}">TRY FREE · ${trials} LEFT</button>` : ''}
        <button class="arcade-btn btn-ghost" data-view-char="${char.id}">3D PREVIEW</button>`
    });
  }

  private boosterCards(featured = false): string {
    const products = [
      { action: 'buy-board-pack', name: '3x Hoverboard Pack', cost: 300, icon: 'HOVERBOARD', description: 'Restock three deployable boards for upcoming runs.', feature: 'Each deployment absorbs one fatal crash.', count: this.progression.getHoverboardCharges(), unit: 'board charges' },
      { action: 'buy-megapack', name: '10x Hoverboard Megapack', cost: 850, icon: 'HOVERBOARD', description: 'Ten board charges in one pack. Save 15% against individual packs.', feature: 'More crash protection, ready when you need it.', count: this.progression.getHoverboardCharges(), unit: 'board charges' },
      { action: 'buy-headstart', name: 'Rocket Headstart', cost: 400, icon: 'JETPACK', description: 'Start your next run with a 500m flight.', feature: 'Launch above the opening obstacles.', count: this.progression.getHeadstartCount(), unit: 'headstarts' },
      { action: 'buy-score-booster', name: 'Score Booster +5X', cost: 500, icon: 'MULTIPLIER', description: 'Add +5 to your multiplier for the next run.', feature: 'A score boost that lasts for the run.', count: this.progression.getScoreBoosterCount(), unit: 'score boosters' }
    ];
    if (featured) products.sort((a, b) => Number(b.action === 'buy-megapack') - Number(a.action === 'buy-megapack'));
    return products.map(item => this.productCard({
      name: item.name, description: item.description, feature: item.feature,
      visual: `<span class="shop-product-icon">${getPowerupIconSvg(item.icon, 48)}</span>`, badge: item.action === 'buy-megapack' ? 'SAVE 15%' : 'CONSUMABLE',
      status: `Inventory: ${item.count} ${item.unit}`, primary: this.buyAction(item.cost, `data-action="${item.action}"`), attributes: `data-product="${item.action}"`
    })).join('');
  }

  private renderFeatured(container: HTMLElement): void {
    const spotlights = ['char_rahul_gandhi', 'char_modi'].map(id => this.characterCard(getAllCharacters().find(char => char.id === id)!)).join('');
    container.innerHTML += `<div class="shop-product-grid">${spotlights}${this.boosterCards(true)}</div>`;
    this.bindCharacterButtons(container);
    this.bindShopButtons(container);
  }

  private renderBoosters(container: HTMLElement): void {
    container.innerHTML += `<div class="shop-product-grid">${this.boosterCards()}</div>`;
    this.bindShopButtons(container);
  }

  private renderUpgrades(container: HTMLElement): void {
    const powerups: UpgradablePowerup[] = ['MAGNET', 'JETPACK', 'SNEAKERS', 'MULTIPLIER', 'SHIELD'];
    container.innerHTML += `<div class="shop-product-grid">${powerups.map(type => {
      const config = UPGRADE_CONFIGS[type], level = this.upgradeManager.getLevel(type);
      const cost = this.upgradeManager.getUpgradeCost(type);
      return this.productCard({ name: config.name, description: config.description,
        feature: `Duration: ${this.upgradeManager.getDuration(type)}s${cost !== null ? ` → ${this.upgradeManager.getDuration(type) + config.durationPerLevel}s next` : ''}`,
        visual: `<span class="shop-product-icon">${getPowerupIconSvg(type, 48)}</span>`, badge: 'PERMANENT UPGRADE',
        status: `Level ${level} of 5${cost === null ? ' · Fully upgraded' : ''}`, attributes: `data-product="${type}"`,
        primary: cost === null ? '<button class="arcade-btn btn-equipped" disabled>MAX LEVEL</button>' : this.buyAction(cost, `data-upgrade="${type}"`)
      });
    }).join('')}</div>`;
    container.querySelectorAll<HTMLElement>('[data-upgrade]').forEach(button => button.addEventListener('click', () => {
      const type = button.dataset.upgrade as UpgradablePowerup, cost = this.upgradeManager.getUpgradeCost(type);
      if (cost === null) return;
      const level = this.upgradeManager.getLevel(type);
      this.confirmPurchase(UPGRADE_CONFIGS[type].name, cost, () => {
        if (this.upgradeManager.getLevel(type) !== level) return { success: false, message: 'Upgrade level changed. Review the new price.' };
        const success = this.upgradeManager.purchaseUpgrade(type);
        return { success, message: success ? `Upgraded ${UPGRADE_CONFIGS[type].name} to level ${level + 1}!` : 'Insufficient coins. Upgrade not purchased.' };
      }, `Permanent upgrade from level ${level} to ${level + 1}.`);
    }));
  }

  private renderCharacters(container: HTMLElement): void {
    container.innerHTML += `<div class="shop-product-grid">${getAllCharacters().map(char => this.characterCard(char)).join('')}</div>`;
    this.bindCharacterButtons(container);
  }

  private bindCharacterButtons(container: HTMLElement): void {
    container.querySelectorAll<HTMLElement>('[data-buy-char]').forEach(button => button.addEventListener('click', () => {
      const char = getAllCharacters().find(item => item.id === button.dataset.buyChar);
      if (char) this.confirmPurchase(char.name, char.unlock.cost || 0, () => this.progression.purchaseCharacter(char.id), 'Permanent runner unlock. Equips the runner after purchase.');
    }));
    for (const attribute of ['trialChar', 'equipChar'] as const) {
      const selector = attribute === 'trialChar' ? '[data-trial-char]' : '[data-equip-char]';
      container.querySelectorAll<HTMLElement>(selector).forEach(button => button.addEventListener('click', () => {
        const result = this.progression.equipCharacter(button.dataset[attribute]!);
        this.showToast(result.message, !result.success);
        this.renderCategoryContent();
      }));
    }
    container.querySelectorAll<HTMLElement>('[data-view-char]').forEach(button => button.addEventListener('click', () => {
      this.eventBus.emit('OPEN_CHARACTERS', { source: 'SHOP', charId: button.dataset.viewChar });
    }));
  }

  private renderHoverboards(container: HTMLElement): void {
    container.innerHTML += `<div class="shop-product-grid">${getAllHoverboards().map(board => {
      const owned = this.progression.isBoardUnlocked(board.id), equipped = this.progression.getSelectedBoard() === board.id;
      return this.productCard({ name: board.name, description: board.tagline, feature: `${board.ability.name}: ${board.ability.tagline}`,
        visual: `<span class="shop-product-icon" aria-hidden="true">${board.icon}</span>`, badge: board.archetype,
        status: owned ? (equipped ? 'Equipped board · Permanently owned' : 'Owned · Ready to equip') : board.unlock.description,
        attributes: `data-board-id="${board.id}"`,
        primary: equipped ? '<button class="arcade-btn btn-equipped" disabled>EQUIPPED</button>'
          : owned ? `<button class="arcade-btn btn-primary" data-equip-board="${board.id}">EQUIP</button>`
          : board.unlock.type === 'COINS' ? this.buyAction(board.unlock.cost || 0, `data-buy-board="${board.id}"`)
          : `<button class="arcade-btn btn-disabled" disabled>LOCKED — ${board.unlock.description}</button>`,
        secondary: `<button class="arcade-btn btn-ghost" data-view-board="${board.id}">3D PREVIEW</button>`
      });
    }).join('')}</div>`;
    container.querySelectorAll<HTMLElement>('[data-buy-board]').forEach(button => button.addEventListener('click', () => {
      const board = getAllHoverboards().find(item => item.id === button.dataset.buyBoard);
      if (board) this.confirmPurchase(board.name, board.unlock.cost || 0, () => this.progression.purchaseBoard(board.id), 'Permanent board unlock. Equips the board after purchase.');
    }));
    container.querySelectorAll<HTMLElement>('[data-equip-board]').forEach(button => button.addEventListener('click', () => {
      const result = this.progression.equipBoard(button.dataset.equipBoard!);
      this.showToast(result.message, !result.success);
      this.renderCategoryContent();
    }));
    container.querySelectorAll<HTMLElement>('[data-view-board]').forEach(button => button.addEventListener('click', () => this.eventBus.emit('OPEN_BOARDS', 'SHOP')));
  }

  private bindShopButtons(container: HTMLElement): void {
    const actions: Record<string, { name: string; cost: number; purchase: () => { success: boolean; message: string } }> = {
      'buy-headstart': { name: 'Rocket Headstart', cost: 400, purchase: () => this.progression.purchaseHeadstart(1) },
      'buy-score-booster': { name: 'Score Booster +5X', cost: 500, purchase: () => this.progression.purchaseScoreBooster(1) },
      'buy-board-pack': { name: '3x Hoverboard Pack', cost: 300, purchase: () => this.progression.purchaseHoverboardCharges() },
      'buy-megapack': { name: '10x Hoverboard Megapack', cost: 850, purchase: () => this.progression.purchaseBoardMegapack() }
    };
    for (const [action, item] of Object.entries(actions)) {
      container.querySelector(`[data-action="${action}"]`)?.addEventListener('click', () => {
        this.confirmPurchase(item.name, item.cost, item.purchase, 'Consumable supply. Added to your existing inventory.');
      });
    }
  }

  private confirmPurchase(name: string, cost: number, purchase: () => { success: boolean; message: string }, detail: string): void {
    this.closeModals();
    const overlay = document.createElement('div');
    overlay.id = 'world-confirm-overlay';
    overlay.className = 'world-modal-backdrop';
    overlay.dataset.price = String(cost);
    overlay.innerHTML = `<div class="world-confirm-card shop-confirm-card" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div class="world-confirm-header"><div><span class="modal-badge-tag gold-tag">REVIEW PURCHASE</span>
        <h3 id="confirm-dialog-title">Buy ${name}?</h3></div><button class="arcade-icon-btn close-btn" id="confirm-close-btn" aria-label="Cancel purchase">✕</button></div>
      <p>${detail}</p><div class="balance-breakdown">
        <div class="breakdown-row"><span>Your balance</span><strong data-confirm-balance></strong></div>
        <div class="breakdown-row"><span>Purchase price</span><strong>${cost.toLocaleString()} 🪙</strong></div>
        <div class="breakdown-row remaining-row"><span>After purchase</span><strong data-confirm-remaining></strong></div></div>
      <div class="world-confirm-actions"><button class="arcade-btn btn-secondary" id="confirm-cancel-btn">CANCEL</button>
        <button class="arcade-btn btn-gold" id="confirm-execute-btn">CONFIRM — ${cost.toLocaleString()} 🪙</button></div></div>`;
    this.mountDialog(overlay);
    this.updateConfirmationWallet();
    for (const id of ['#confirm-close-btn', '#confirm-cancel-btn']) overlay.querySelector(id)?.addEventListener('click', () => this.closeModals());
    overlay.addEventListener('click', event => { if (event.target === overlay) this.closeModals(); });
    let submitted = false;
    overlay.querySelector<HTMLButtonElement>('#confirm-execute-btn')?.addEventListener('click', event => {
      const button = event.currentTarget as HTMLButtonElement;
      if (submitted || button.disabled) return;
      submitted = true;
      button.disabled = true;
      const result = purchase(); // Manager validates ownership/funds and performs the only deduction.
      this.closeModals();
      this.showToast(result.message, !result.success);
      this.renderCategoryContent();
    });
  }

  private updateConfirmationWallet(): void {
    const preview = this.element.querySelector<HTMLElement>('#world-showcase-overlay');
    const previewBuy = preview?.querySelector<HTMLButtonElement>('#showcase-buy-btn');
    if (preview && previewBuy) {
      const world = getWorld(preview.dataset.worldId || '')!;
      const shortfall = Math.max(0, world.coinCost - this.upgradeManager.getCoins());
      previewBuy.disabled = shortfall > 0;
      previewBuy.classList.toggle('btn-disabled', shortfall > 0);
      previewBuy.classList.toggle('btn-gold', shortfall === 0);
      const note = preview.querySelector<HTMLElement>('#showcase-funds-note');
      if (note) note.textContent = shortfall ? `Need ${shortfall.toLocaleString()} more coins` : '';
    }
    const overlay = this.element.querySelector<HTMLElement>('#world-confirm-overlay');
    if (!overlay) return;
    const price = Number(overlay.dataset.price), coins = this.upgradeManager.getCoins();
    const balance = overlay.querySelector<HTMLElement>('[data-confirm-balance]');
    const remaining = overlay.querySelector<HTMLElement>('[data-confirm-remaining]');
    const confirm = overlay.querySelector<HTMLButtonElement>('#confirm-execute-btn');
    if (balance) balance.textContent = `${coins.toLocaleString()} 🪙`;
    if (remaining) remaining.textContent = coins >= price ? `${(coins - price).toLocaleString()} 🪙` : `Need ${(price - coins).toLocaleString()} more coins`;
    if (confirm) {
      confirm.disabled = coins < price;
      confirm.classList.toggle('btn-disabled', coins < price);
      confirm.classList.toggle('btn-gold', coins >= price);
      confirm.textContent = coins < price ? 'INSUFFICIENT COINS' : `CONFIRM — ${price.toLocaleString()} 🪙`;
    }
  }

  private mountDialog(overlay: HTMLElement): void {
    this.dialogFocus = document.activeElement as HTMLElement | null;
    this.element.appendChild(overlay);
    overlay.querySelector<HTMLElement>('button')?.focus?.({ preventScroll: true });
    // Contain keyboard focus without adding another global listener or Escape handler.
    overlay.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...overlay.querySelectorAll<HTMLElement>('button:not(:disabled), input')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
  }
}
