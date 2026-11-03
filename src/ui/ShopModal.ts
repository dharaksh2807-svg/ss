import { EventBus, EVENTS } from '../core/EventBus';
import { UpgradeManager, UPGRADE_CONFIGS, UpgradablePowerup } from '../player/UpgradeManager';
import { ProgressionManager } from '../progression/ProgressionManager';
import { getAllCharacters } from '../characters/CharacterCatalog';
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
        <div class="modal-top-bar">
          <div class="modal-title-group">
            <span class="modal-badge-tag gold-tag">ARCADE BAZAAR</span>
            <h2 class="arcade-title">SUBWAY SHOP</h2>
          </div>
          <div class="modal-header-actions">
            <div class="currency-pill gold-pill" id="shop-wallet-pill">
              <span class="pill-icon">🪙</span>
              <span id="shop-wallet-coins" class="pill-value">0</span>
            </div>
            <button id="shop-close-btn" class="arcade-icon-btn close-btn" aria-label="Close Shop">✕</button>
          </div>
        </div>

        <!-- Shop Category Navigation Tabs -->
        <div class="arcade-tabs-nav" id="shop-tabs">
          <button class="arcade-tab-btn active" data-cat="FEATURED">⭐ FEATURED</button>
          <button class="arcade-tab-btn" data-cat="UPGRADES">⚡ UPGRADES</button>
          <button class="arcade-tab-btn" data-cat="BOOSTERS">🚀 BOOSTERS</button>
          <button class="arcade-tab-btn" data-cat="CHARACTERS">👤 RUNNERS</button>
          <button class="arcade-tab-btn" data-cat="HOVERBOARDS">🛹 BOARDS</button>
          <button class="arcade-tab-btn" data-cat="WORLDS">🌐 WORLDS</button>
        </div>

        <!-- Shop Content Container -->
        <div class="shop-content-scroll custom-scroll" id="shop-content">
          <!-- Dynamically populated category content -->
        </div>

        <!-- Feedback Toast Message Container -->
        <div id="shop-toast" class="shop-toast hidden"></div>
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
    this.element.querySelector<HTMLElement>('#shop-close-btn')?.focus();
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
  }

  private switchCategory(cat: ShopCategory): void {
    this.currentCategory = cat;
    const tabs = this.element.querySelectorAll('#shop-tabs .arcade-tab-btn');
    tabs.forEach((t) => {
      if ((t as HTMLElement).dataset.cat === cat) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });
    this.renderCategoryContent();
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
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2800);
  }

  private renderCategoryContent(): void {
    const content = this.element.querySelector('#shop-content') as HTMLElement;
    if (!content) return;
    content.innerHTML = '';

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
  }

  private renderWorlds(container: HTMLElement): void {
    const worlds = getWorlds(this.progression.getState());
    const currentCoins = this.upgradeManager.getCoins();
    const isDynamicOptedIn = this.progression.getState().includePremiumThemesInDynamic;

    container.innerHTML = `
      <div class="worlds-store-header-card">
        <div class="worlds-header-intro">
          <div class="modal-badge-tag cyan-tag">DISTRICT ATLAS</div>
          <h3 class="worlds-store-title">RAILWAY REALMS & WORLDS</h3>
          <p class="worlds-store-desc">
            Discover and permanently unlock world realms. Each world brings original 3D architecture, atmosphere, and distinct maglev trains.
          </p>
        </div>
        <div class="dynamic-districts-feature-card">
          <div class="dynamic-toggle-left">
            <div class="dynamic-toggle-badge">ENDLESS MODE FEATURE</div>
            <h4 class="dynamic-toggle-title">Dynamic Districts</h4>
            <p class="dynamic-toggle-desc">Procedurally transition through all owned worlds every 800m during endless runs.</p>
          </div>
          <div class="dynamic-toggle-right">
            <label class="switch-control" for="premium-dynamic-toggle">
              <input type="checkbox" data-premium-dynamic id="premium-dynamic-toggle" ${isDynamicOptedIn ? 'checked' : ''}>
              <span class="switch-slider"></span>
            </label>
            <span class="dynamic-status-label ${isDynamicOptedIn ? 'status-enabled' : 'status-disabled'}">${isDynamicOptedIn ? 'ENABLED' : 'DISABLED'}</span>
          </div>
        </div>
      </div>

      <div class="worlds-shop-grid">
        ${worlds.map((world) => {
          const isFree = world.unlock === 'FREE';
          const canAfford = currentCoins >= world.coinCost;
          const statusClass = world.equipped ? 'status-equipped' : (world.owned ? 'status-owned' : 'status-locked');
          const statusText = world.equipped ? 'EQUIPPED' : (world.owned ? 'OWNED' : 'LOCKED');
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
                  ? `<button class="arcade-btn btn-equipped" disabled>EQUIPPED</button>`
                  : world.owned
                  ? `<button class="arcade-btn btn-secondary" data-equip-world="${world.id}">EQUIP</button>`
                  : world.signatureCharacterId
                  ? `<button class="arcade-btn btn-gold" data-action="unlock-signature" data-char-id="${world.signatureCharacterId}">GET WITH MODI 🏛️</button>`
                  : `<button class="arcade-btn ${canAfford ? 'btn-gold' : 'btn-disabled'}" data-buy-world="${world.id}" ${canAfford ? '' : 'disabled'}>
                      ${world.coinCost.toLocaleString()} 🪙
                    </button>`
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
              <span class="breakdown-value gold-value">${currentCoins.toLocaleString()} 🪙</span>
            </div>
            <div class="breakdown-row debit-row">
              <span class="breakdown-label">Purchase Price</span>
              <span class="breakdown-value debit-value">-${world.coinCost.toLocaleString()} 🪙</span>
            </div>
            <div class="breakdown-divider"></div>
            <div class="breakdown-row remaining-row">
              <span class="breakdown-label">Balance Remaining</span>
              <span class="breakdown-value ${canAfford ? 'remaining-value' : 'deficit-value'}">
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

    this.element.appendChild(overlay);

    overlay.querySelector('#confirm-close-btn')?.addEventListener('click', () => this.closeModals());
    overlay.querySelector('#confirm-cancel-btn')?.addEventListener('click', () => this.closeModals());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModals();
    });

    const executeBtn = overlay.querySelector<HTMLButtonElement>('#confirm-execute-btn');
    if (executeBtn && canAfford) {
      executeBtn.addEventListener('click', () => {
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

    const isOwned = world.unlock === 'FREE' || this.progression.isThemeUnlocked(world.id);
    const isEquipped = this.progression.getSelectedTheme() === world.id;
    const currentCoins = this.upgradeManager.getCoins();
    const canAfford = currentCoins >= world.coinCost;

    const overlay = document.createElement('div');
    overlay.id = 'world-showcase-overlay';
    overlay.className = 'world-modal-backdrop animate-fade-in';
    overlay.innerHTML = `
      <div class="world-showcase-card animate-pop" role="dialog" aria-modal="true" aria-labelledby="showcase-dialog-title" style="--world-accent: ${world.accentColor}">
        <div class="world-modal-accent-bar"></div>
        <button class="arcade-icon-btn close-btn showcase-close-btn" id="showcase-close-btn" aria-label="Close Showcase">✕</button>

        <div class="showcase-hero-container">
          <img src="${world.previewImage}" alt="${world.displayName}" class="showcase-hero-img" />
          <div class="showcase-hero-gradient"></div>
          <div class="showcase-hero-badges">
            <span class="world-rarity-pill rarity-${world.rarity.toLowerCase()}">${world.rarity}${world.unlock === 'FREE' ? ' · FREE WORLD' : ''}</span>
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
                <span class="spec-label">Performance</span>
                <span class="spec-val">Hardware Accelerated Mesh Pooling</span>
              </div>
              <div class="showcase-spec-item">
                <span class="spec-label">Dynamic Districts</span>
                <span class="spec-val">${world.dynamicEligible ? 'Eligible for seamless district transitions' : 'Standalone district only'}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="showcase-footer">
          <button class="arcade-btn btn-secondary" id="showcase-back-btn">CLOSE</button>
          ${isEquipped
            ? `<button class="arcade-btn btn-equipped" disabled>✓ CURRENTLY EQUIPPED</button>`
            : isOwned
            ? `<button class="arcade-btn btn-secondary" id="showcase-equip-btn" data-equip-world="${world.id}">⚡ EQUIP THIS DISTRICT</button>`
            : `<button class="arcade-btn ${canAfford ? 'btn-gold pulse-btn' : 'btn-disabled'}" id="showcase-buy-btn" data-buy-preview-world="${world.id}">
                UNLOCK DISTRICT — ${world.coinCost.toLocaleString()} 🪙
              </button>`
          }
        </div>
      </div>
    `;

    this.element.appendChild(overlay);

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
  }

  // --- Featured Deals ---
  private renderFeatured(container: HTMLElement): void {
    const coins = this.upgradeManager.getCoins();
    const isModiUnlocked = this.progression.isCharacterUnlocked('char_modi');
    const isModiEquipped = this.progression.getSelectedCharacter() === 'char_modi';
    const isRahulUnlocked = this.progression.isCharacterUnlocked('char_rahul_gandhi');
    const isRahulEquipped = this.progression.getSelectedCharacter() === 'char_rahul_gandhi';

    container.innerHTML = `
      <!-- Legendary Character Spotlight Banner: Rahul Gandhi -->
      <div class="featured-hero-banner legendary-featured-banner rahul-featured-banner">
        <div class="featured-glow-fx emerald-shimmer"></div>
        <div class="featured-char-portrait">
          <img src="/characters/rahul_gandhi/three_quarter.png" alt="Rahul Gandhi" class="featured-hero-img" />
        </div>
        <div class="featured-info">
          <span class="badge-pill legendary-pill">👑 NEW PLAYABLE RUNNER</span>
          <h3 class="featured-title">RAHUL GANDHI</h3>
          <p class="featured-desc">The Determined Sprinter: Signature crisp white shirt, navy trousers, and sports shoes with authentic 3D animations.</p>
          <div class="featured-pricing">
            <span class="new-price gold-price">100,000 🪙</span>
            <span class="discount-badge gold-badge">5 FREE TRIALS</span>
          </div>
          <div class="trial-counter-pill">Free Trials Remaining: ${this.progression.getRahulTrialsRemaining()}/5</div>
        </div>
        <div class="featured-banner-actions">
          ${isRahulEquipped 
            ? `<button class="arcade-btn btn-equipped" disabled>${isRahulUnlocked ? '✓ EQUIPPED' : `✓ FREE TRIAL (${this.progression.getRahulTrialsRemaining()} LEFT)`}</button>`
            : isRahulUnlocked
            ? `<button class="arcade-btn btn-primary" data-equip-char="char_rahul_gandhi">⚡ EQUIP</button>`
            : (this.progression.getRahulTrialsRemaining() > 0)
            ? `<button class="arcade-btn btn-primary" data-trial-char="char_rahul_gandhi">⚡ TRY FREE</button>
               <button class="arcade-btn ${coins >= 100000 ? 'btn-gold pulse-btn' : 'btn-disabled'}" data-buy-char="char_rahul_gandhi">
                 UNLOCK — 100,000 🪙
               </button>`
            : `<button class="arcade-btn ${coins >= 100000 ? 'btn-gold pulse-btn' : 'btn-disabled'}" data-buy-char="char_rahul_gandhi">
                UNLOCK — 100,000 🪙
              </button>`
          }
          <button class="arcade-btn btn-ghost" data-view-char="char_rahul_gandhi">🔍 3D PREVIEW</button>
        </div>
      </div>

      <!-- Legendary Character Spotlight Banner: Narendra Modi -->
      <div class="featured-hero-banner legendary-featured-banner">
        <div class="featured-glow-fx gold-shimmer"></div>
        <div class="featured-char-portrait">
          <img src="/characters/modi/three_quarter.png" alt="Narendra Modi" class="featured-hero-img" />
        </div>
        <div class="featured-info">
          <span class="badge-pill legendary-pill">👑 LEGENDARY RUNNER</span>
          <h3 class="featured-title">NARENDRA MODI</h3>
          <p class="featured-desc">The Statesman Runner: Traditional tailored kurta, midnight-navy waistcoat, and agile runners with full 3D skeletal animations.</p>
          <div class="featured-pricing">
            <span class="new-price gold-price">100,000 🪙</span>
            <span class="discount-badge gold-badge">LEGENDARY TIER</span>
          </div>
        </div>
        <div class="featured-banner-actions">
          ${isModiEquipped 
            ? `<button class="arcade-btn btn-equipped" disabled>${isModiUnlocked ? '✓ EQUIPPED' : `✓ FREE TRIAL (${this.progression.getModiFreeRuns()} LEFT)`}</button>`
            : isModiUnlocked
            ? `<button class="arcade-btn btn-primary" data-equip-char="char_modi">⚡ EQUIP</button>`
            : (this.progression.getModiFreeRuns() > 0)
            ? `<button class="arcade-btn btn-primary" data-trial-char="char_modi">⚡ FREE RUN (${this.progression.getModiFreeRuns()} LEFT)</button>
               <button class="arcade-btn ${coins >= 100000 ? 'btn-gold pulse-btn' : 'btn-disabled'}" data-buy-char="char_modi">
                 ${coins >= 100000 ? '100,000 🪙 UNLOCK' : '100,000 🪙 BUY'}
               </button>`
            : `<button class="arcade-btn ${coins >= 100000 ? 'btn-gold pulse-btn' : 'btn-disabled'}" data-buy-char="char_modi">
                ${coins >= 100000 ? '100,000 🪙 UNLOCK' : 'NEED 100,000 🪙'}
              </button>`
          }
          <button class="arcade-btn btn-ghost" data-view-char="char_modi">🔍 3D PREVIEW</button>
        </div>
      </div>

      <div class="featured-hero-banner">
        <div class="featured-glow-fx"></div>
        <div class="featured-info">
          <span class="badge-pill hot-deal">🔥 HOT DEAL OF THE DAY</span>
          <h3 class="featured-title">HOVERBOARD MEGAPACK</h3>
          <p class="featured-desc">10 High-Velocity Hoverboard Deployments with Crash-Absorption Shielding.</p>
          <div class="featured-pricing">
            <span class="old-price">1,000 🪙</span>
            <span class="new-price">850 🪙</span>
            <span class="discount-badge">SAVE 15%</span>
          </div>
        </div>
        <button id="feat-buy-megapack-btn" class="arcade-btn btn-primary pulse-btn">
          ⚡ GRAB PACK
        </button>
      </div>

      <div class="shop-grid">
        <div class="shop-card-item">
          <div class="item-icon-box gold-glow">${getPowerupIconSvg('JETPACK', 30)}</div>
          <div class="item-meta">
            <div class="item-name">Rocket Headstart</div>
            <div class="item-sub">Blast forward 500m at supersonic flight!</div>
            <div class="item-balance-tag">Owned: ${this.progression.getHeadstartCount()}</div>
          </div>
          <button class="arcade-btn btn-gold shop-buy-btn" data-action="buy-headstart">
            400 🪙
          </button>
        </div>

        <div class="shop-card-item">
          <div class="item-icon-box orange-glow">${getPowerupIconSvg('MULTIPLIER', 30)}</div>
          <div class="item-meta">
            <div class="item-name">Score Booster +5X</div>
            <div class="item-sub">+5X Multiplier boost for your next subway run.</div>
            <div class="item-balance-tag">Owned: ${this.progression.getScoreBoosterCount()}</div>
          </div>
          <button class="arcade-btn btn-gold shop-buy-btn" data-action="buy-score-booster">
            500 🪙
          </button>
        </div>

        <div class="shop-card-item">
          <div class="item-icon-box purple-glow">${getPowerupIconSvg('HOVERBOARD', 30)}</div>
          <div class="item-meta">
            <div class="item-name">3x Board Pack</div>
            <div class="item-sub">Instant 3 emergency crash-shields.</div>
            <div class="item-balance-tag">Charges: ${this.progression.getHoverboardCharges()}</div>
          </div>
          <button class="arcade-btn btn-gold shop-buy-btn" data-action="buy-board-pack">
            300 🪙
          </button>
        </div>
      </div>
    `;

    const megaBtn = container.querySelector('#feat-buy-megapack-btn');
    if (megaBtn) {
      megaBtn.addEventListener('click', () => {
        const res = this.progression.purchaseBoardMegapack();
        if (res.success) {
          this.showToast('🎉 Purchased 10 Hoverboard Charges!');
          this.renderCategoryContent();
        } else {
          this.showToast(res.message, true);
        }
      });
    }

    this.bindCharacterButtons(container);
    this.bindShopButtons(container);
  }

  // --- Upgrades (Permanent Power-Up Tiers 1-5) ---
  private renderUpgrades(container: HTMLElement): void {
    const powerups: UpgradablePowerup[] = ['MAGNET', 'JETPACK', 'SNEAKERS', 'MULTIPLIER', 'SHIELD'];
    const list = document.createElement('div');
    list.className = 'shop-items-vertical';

    powerups.forEach((type) => {
      const config = UPGRADE_CONFIGS[type];
      const level = this.upgradeManager.getLevel(type);
      const isMax = level >= 5;
      const cost = this.upgradeManager.getUpgradeCost(type);
      const canAfford = this.upgradeManager.canUpgrade(type);

      // 5 level dots
      let levelDots = '';
      for (let i = 1; i <= 5; i++) {
        levelDots += `<span class="lvl-dot ${i <= level ? 'filled' : ''}"></span>`;
      }

      const iconSvg = getPowerupIconSvg(type, 30);
      const row = document.createElement('div');
      row.className = 'shop-card-item upgrade-item';
      row.innerHTML = `
        <div class="item-icon-box cyan-glow">${iconSvg}</div>
        <div class="item-meta">
          <div class="item-header-row">
            <span class="item-name">${config.name}</span>
            <div class="lvl-dots-group">${levelDots}</div>
          </div>
          <div class="item-sub">${config.description}</div>
          <div class="item-stat-row">
            <span class="stat-badge">Current: ${this.upgradeManager.getDuration(type)}s</span>
            ${!isMax ? `<span class="stat-badge next">Next: +${config.durationPerLevel}s</span>` : '<span class="stat-badge max">MAX LEVEL</span>'}
          </div>
        </div>
        <div class="item-action-area">
          ${isMax 
            ? `<button class="arcade-btn btn-max" disabled>MAX</button>` 
            : `<button class="arcade-btn ${canAfford ? 'btn-gold' : 'btn-disabled'}" data-upgrade="${type}">
                ${cost?.toLocaleString()} 🪙
              </button>`
          }
        </div>
      `;

      const btn = row.querySelector(`[data-upgrade="${type}"]`);
      if (btn) {
        btn.addEventListener('click', () => {
          if (this.upgradeManager.canUpgrade(type)) {
            const success = this.upgradeManager.purchaseUpgrade(type);
            if (success) {
              this.showToast(`⚡ ${config.name} upgraded to Level ${this.upgradeManager.getLevel(type)}!`);
              this.renderCategoryContent();
            }
          } else {
            this.showToast(`Need more coins to upgrade ${config.name}!`, true);
          }
        });
      }

      list.appendChild(row);
    });

    container.appendChild(list);
  }

  // --- Consumable Boosters ---
  private renderBoosters(container: HTMLElement): void {
    const list = document.createElement('div');
    list.className = 'shop-grid';

    list.innerHTML = `
      <div class="shop-card-item booster-card">
        <div class="item-icon-box purple-glow">${getPowerupIconSvg('HOVERBOARD', 30)}</div>
        <div class="item-meta">
          <div class="item-name">3x Hoverboard Pack</div>
          <div class="item-sub">Instantly restocks 3 deployable hoverboards with crash-shielding.</div>
          <div class="item-balance-tag">Current Inventory: ${this.progression.getHoverboardCharges()}</div>
        </div>
        <button class="arcade-btn btn-gold shop-buy-btn" data-action="buy-board-pack">
          300 🪙
        </button>
      </div>

      <div class="shop-card-item booster-card">
        <div class="item-icon-box gold-glow">${getPowerupIconSvg('HOVERBOARD', 30)}</div>
        <div class="item-meta">
          <div class="item-name">10x Megapack (Best Value)</div>
          <div class="item-sub">Bulk supply of 10 boards with 15% discount. Never run without a shield!</div>
          <div class="item-balance-tag">Current Inventory: ${this.progression.getHoverboardCharges()}</div>
        </div>
        <button class="arcade-btn btn-primary shop-buy-btn" data-action="buy-megapack">
          850 🪙
        </button>
      </div>

      <div class="shop-card-item booster-card">
        <div class="item-icon-box cyan-glow">${getPowerupIconSvg('JETPACK', 30)}</div>
        <div class="item-meta">
          <div class="item-name">Rocket Headstart</div>
          <div class="item-sub">Launches player 500m forward right as the subway run begins.</div>
          <div class="item-balance-tag">Current Inventory: ${this.progression.getHeadstartCount()}</div>
        </div>
        <button class="arcade-btn btn-gold shop-buy-btn" data-action="buy-headstart">
          400 🪙
        </button>
      </div>

      <div class="shop-card-item booster-card">
        <div class="item-icon-box orange-glow">${getPowerupIconSvg('MULTIPLIER', 30)}</div>
        <div class="item-meta">
          <div class="item-name">Score Booster (+5X)</div>
          <div class="item-sub">Supercharges score multiplier by +5 for the duration of the run.</div>
          <div class="item-balance-tag">Current Inventory: ${this.progression.getScoreBoosterCount()}</div>
        </div>
        <button class="arcade-btn btn-gold shop-buy-btn" data-action="buy-score-booster">
          500 🪙
        </button>
      </div>
    `;

    container.appendChild(list);
    this.bindShopButtons(container);
  }

  // --- Characters Direct Roster ---
  private renderCharacters(container: HTMLElement): void {
    const list = document.createElement('div');
    list.className = 'shop-grid characters-shop-grid';
    const chars = getAllCharacters();
    const coins = this.upgradeManager.getCoins();

    chars.forEach((char) => {
      const isUnlocked = this.progression.isCharacterUnlocked(char.id);
      const isEquipped = this.progression.getSelectedCharacter() === char.id;
      const cost = char.unlock.cost || 0;
      const canAfford = coins >= cost;
      const isLegendary = char.rarity === 'LEGENDARY';
      const freeRuns = this.progression.getCharacterFreeRuns(char.id);

      const card = document.createElement('div');
      card.dataset.charId = char.id;

      if (isLegendary) {
        const legendaryImg = char.previewImage || (char.id === 'char_modi' ? '/characters/modi/three_quarter.png' : '/characters/rahul_gandhi/three_quarter.png');
        card.className = `shop-card-item char-shop-card legendary-character-card ${isUnlocked ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="legendary-portrait-col">
            <div class="legendary-portrait-frame">
              <div class="legendary-radial-glow"></div>
              <img src="${legendaryImg}" alt="${char.name}" class="legendary-char-img" loading="lazy" />
              <div class="legendary-portrait-badge">
                <span class="legendary-crown-icon">👑</span>
                <span class="legendary-badge-text">LEGENDARY</span>
              </div>
            </div>
          </div>

          <div class="legendary-content-col">
            <div class="legendary-banner-strip">
              <span class="legendary-tag">👑 LEGENDARY RUNNER</span>
              <div class="legendary-status-wrap">
                ${isEquipped 
                  ? '<span class="status-pill equipped-pill">✓ EQUIPPED</span>' 
                  : isUnlocked 
                  ? '<span class="status-pill owned-pill">✓ OWNED</span>' 
                  : `<span class="status-pill price-pill">${cost.toLocaleString()} 🪙</span>`}
              </div>
            </div>

            <div class="legendary-header-block">
              <div class="legendary-name-row">
                <h3 class="legendary-name">${char.name}</h3>
                <span class="rarity-badge legendary-badge">LEGENDARY</span>
              </div>
              <div class="legendary-sub">${char.title}</div>
            </div>

            <p class="legendary-bio">${char.bio}</p>

            ${!isUnlocked && freeRuns > 0 ? `
              <div class="legendary-trial-notice">
                <span class="trial-fire-icon">🔥</span>
                <span class="trial-counter-pill">Free Trials Remaining: ${freeRuns}/5</span>
                <span class="trial-desc">Experience this signature runner before purchasing!</span>
              </div>
            ` : ''}

            <div class="item-action-area legendary-action-area">
              ${isEquipped 
                ? `<button class="arcade-btn btn-equipped" disabled>${isUnlocked ? '✓ EQUIPPED' : `✓ FREE TRIAL (${freeRuns} LEFT)`}</button>`
                : isUnlocked
                ? `<button class="arcade-btn btn-primary" data-equip-char="${char.id}">⚡ EQUIP</button>`
                : (freeRuns > 0)
                ? `<button class="arcade-btn btn-primary" data-trial-char="${char.id}">⚡ TRY FREE (${freeRuns} LEFT)</button>
                   <button class="arcade-btn ${canAfford ? 'btn-gold pulse-btn' : 'btn-disabled'}" data-buy-char="${char.id}" ${canAfford ? '' : 'disabled'}>
                     UNLOCK — ${cost.toLocaleString()} 🪙
                   </button>`
                : `<button class="arcade-btn ${canAfford ? 'btn-gold pulse-btn' : 'btn-disabled'}" data-buy-char="${char.id}" ${canAfford ? '' : 'disabled'}>
                    UNLOCK — ${cost.toLocaleString()} 🪙
                  </button>`
              }
              <button class="arcade-btn btn-secondary" data-view-char="${char.id}">🔍 3D SHOWROOM</button>
            </div>
          </div>
        `;
      } else {
        card.className = `shop-card-item char-shop-card standard-runner-card ${isUnlocked ? 'owned' : ''} ${isEquipped ? 'equipped' : ''}`;
        card.innerHTML = `
          <div class="standard-runner-visual-box char-theme-${char.id}">
            <div class="runner-backdrop-glow"></div>
            <div class="runner-avatar-icon">${char.portraitIcon}</div>
            <div class="runner-badges-row">
              <span class="runner-rarity-pill rarity-${(char.rarity || 'COMMON').toLowerCase()}">${char.rarity || 'STANDARD'}</span>
              ${isEquipped ? '<span class="runner-status-tag tag-equipped">EQUIPPED</span>' : (isUnlocked ? '<span class="runner-status-tag tag-unlocked">UNLOCKED</span>' : '')}
            </div>
          </div>

          <div class="standard-runner-body">
            <div class="standard-runner-name-block">
              <h4 class="standard-runner-name">${char.name}</h4>
              <div class="standard-runner-subtitle">${char.title}</div>
            </div>

            <p class="standard-runner-bio">${char.personality || char.bio}</p>

            <div class="standard-runner-price-row">
              <span class="price-row-label">STATUS</span>
              <span class="price-row-value ${isUnlocked ? 'price-owned' : 'price-gold'}">
                ${isUnlocked ? '✓ IN ROSTER' : (char.unlock.type === 'FREE' ? 'FREE SURFER' : `${cost.toLocaleString()} 🪙`)}
              </span>
            </div>
          </div>

          <div class="standard-runner-footer">
            ${isEquipped 
              ? `<button class="arcade-btn btn-equipped full-width" disabled>✓ EQUIPPED</button>`
              : isUnlocked
              ? `<button class="arcade-btn btn-secondary full-width" data-equip-char="${char.id}">⚡ EQUIP</button>`
              : char.unlock.type === 'COINS'
              ? `<button class="arcade-btn ${canAfford ? 'btn-gold pulse-btn' : 'btn-disabled'} full-width" data-buy-char="${char.id}" ${canAfford ? '' : 'disabled'}>
                  ${cost.toLocaleString()} 🪙
                </button>`
              : `<button class="arcade-btn btn-disabled full-width" disabled>🔒 ${char.unlock.description}</button>`
            }
            <button class="arcade-btn btn-ghost full-width preview-btn" data-view-char="${char.id}">🔍 3D PREVIEW</button>
          </div>
        `;
      }

      list.appendChild(card);
    });

    container.appendChild(list);
    this.bindCharacterButtons(container);
    this.bindShopButtons(container);
  }

  private bindCharacterButtons(container: HTMLElement): void {
    const buyBtns = container.querySelectorAll('[data-buy-char]');
    buyBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const charId = (e.currentTarget as HTMLElement).dataset.buyChar;
        if (!charId) return;
        const res = this.progression.purchaseCharacter(charId);
        if (res.success) {
          this.showToast(res.message);
          this.renderCategoryContent();
        } else {
          this.showToast(res.message, true);
        }
      });
    });

    const trialBtns = container.querySelectorAll('[data-trial-char]');
    trialBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const charId = (e.currentTarget as HTMLElement).dataset.trialChar;
        if (!charId) return;
        const res = this.progression.equipCharacter(charId);
        if (res.success) {
          this.showToast(res.message);
          this.renderCategoryContent();
        } else {
          this.showToast(res.message, true);
        }
      });
    });

    const equipBtns = container.querySelectorAll('[data-equip-char]');
    equipBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const charId = (e.currentTarget as HTMLElement).dataset.equipChar;
        if (!charId) return;
        const res = this.progression.equipCharacter(charId);
        if (res.success) {
          this.showToast(res.message);
          this.renderCategoryContent();
        }
      });
    });

    const viewBtns = container.querySelectorAll('[data-view-char]');
    viewBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const charId = (e.currentTarget as HTMLElement).dataset.viewChar;
        this.eventBus.emit('OPEN_CHARACTERS', { source: 'SHOP', charId });
      });
    });
  }

  // --- Hoverboards Direct Hangar ---
  private renderHoverboards(container: HTMLElement): void {
    const list = document.createElement('div');
    list.className = 'shop-grid';
    const boards = getAllHoverboards();
    const coins = this.upgradeManager.getCoins();

    boards.forEach((board) => {
      const isUnlocked = this.progression.isBoardUnlocked(board.id);
      const isEquipped = this.progression.getSelectedBoard() === board.id;
      const cost = board.unlock.cost || 0;
      const canAfford = coins >= cost;

      const card = document.createElement('div');
      card.dataset.boardId = board.id;
      card.className = `shop-card-item board-shop-card ${isUnlocked ? 'owned' : ''}`;
      card.innerHTML = `
        <div class="item-icon-box purple-glow">${board.icon}</div>
        <div class="item-meta">
          <div class="item-name">${board.name}</div>
          <div class="item-sub">${board.archetype}</div>
          <div class="item-ability-snippet">⚡ ${board.ability.name}: ${board.ability.tagline}</div>
        </div>
        <div class="item-action-area">
          ${isEquipped 
            ? `<button class="arcade-btn btn-equipped" disabled>EQUIPPED</button>`
            : isUnlocked
            ? `<button class="arcade-btn btn-secondary" data-equip-board="${board.id}">EQUIP</button>`
            : board.unlock.type === 'COINS'
            ? `<button class="arcade-btn ${canAfford ? 'btn-gold' : 'btn-disabled'}" data-buy-board="${board.id}">
                ${cost.toLocaleString()} 🪙
              </button>`
            : `<button class="arcade-btn btn-disabled" disabled>🔒 ${board.unlock.description}</button>`
          }
          <button class="arcade-btn btn-ghost" data-view-board="${board.id}">3D VIEW</button>
        </div>
      `;

      const buyBtn = card.querySelector(`[data-buy-board="${board.id}"]`);
      if (buyBtn) {
        buyBtn.addEventListener('click', () => {
          const res = this.progression.purchaseBoard(board.id);
          if (res.success) {
            this.showToast(res.message);
            this.renderCategoryContent();
          } else {
            this.showToast(res.message, true);
          }
        });
      }

      const equipBtn = card.querySelector(`[data-equip-board="${board.id}"]`);
      if (equipBtn) {
        equipBtn.addEventListener('click', () => {
          const res = this.progression.equipBoard(board.id);
          if (res.success) {
            this.showToast(res.message);
            this.renderCategoryContent();
          }
        });
      }

      const viewBtn = card.querySelector(`[data-view-board="${board.id}"]`);
      if (viewBtn) {
        viewBtn.addEventListener('click', () => {
          this.eventBus.emit('OPEN_BOARDS', 'SHOP');
        });
      }

      list.appendChild(card);
    });

    container.appendChild(list);
  }

  private bindShopButtons(container: HTMLElement): void {
    const buyHeadstart = container.querySelector('[data-action="buy-headstart"]');
    if (buyHeadstart) {
      buyHeadstart.addEventListener('click', () => {
        const res = this.progression.purchaseHeadstart(1);
        if (res.success) {
          this.showToast('🚀 Purchased 1 Rocket Headstart!');
          this.renderCategoryContent();
        } else {
          this.showToast(res.message, true);
        }
      });
    }

    const buyScoreBooster = container.querySelector('[data-action="buy-score-booster"]');
    if (buyScoreBooster) {
      buyScoreBooster.addEventListener('click', () => {
        const res = this.progression.purchaseScoreBooster(1);
        if (res.success) {
          this.showToast('⚡ Purchased 1 Score Booster (+5X)!');
          this.renderCategoryContent();
        } else {
          this.showToast(res.message, true);
        }
      });
    }

    const buyBoardPack = container.querySelector('[data-action="buy-board-pack"]');
    if (buyBoardPack) {
      buyBoardPack.addEventListener('click', () => {
        const res = this.progression.purchaseHoverboardCharges();
        if (res.success) {
          this.showToast('🛹 Purchased +3 Hoverboards!');
          this.renderCategoryContent();
        } else {
          this.showToast(res.message, true);
        }
      });
    }

    const buyMegapack = container.querySelector('[data-action="buy-megapack"]');
    if (buyMegapack) {
      buyMegapack.addEventListener('click', () => {
        const res = this.progression.purchaseBoardMegapack();
        if (res.success) {
          this.showToast('🎉 Purchased 10 Hoverboard Charges!');
          this.renderCategoryContent();
        } else {
          this.showToast(res.message, true);
        }
      });
    }
  }
}
