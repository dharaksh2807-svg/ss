import { EventBus, EVENTS } from '../core/EventBus';
import { UpgradeManager, UPGRADE_CONFIGS, UpgradablePowerup } from '../player/UpgradeManager';
import { ProgressionManager } from '../progression/ProgressionManager';
import { getAllCharacters } from '../characters/CharacterCatalog';
import { getAllHoverboards } from '../hoverboard/HoverboardCatalog';

export type ShopCategory = 'FEATURED' | 'UPGRADES' | 'BOOSTERS' | 'CHARACTERS' | 'HOVERBOARDS';

export class ShopModal {
  private element: HTMLElement;
  private currentCategory: ShopCategory = 'FEATURED';
  private upgradeManager = UpgradeManager.getInstance();
  private progression = ProgressionManager.getInstance();
  private eventBus = EventBus.getInstance();
  private previousScreen: string | null = null;

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
    this.eventBus.on('WALLET_UPDATED', () => this.updateWallet());
    this.eventBus.on('UPGRADES_UPDATED', () => {
      if (this.isVisible()) this.renderCategoryContent();
    });
    this.eventBus.on('BOOSTERS_UPDATED', () => {
      if (this.isVisible()) this.renderCategoryContent();
    });
    this.eventBus.on('BOARD_CHARGES_UPDATED', () => {
      if (this.isVisible()) this.renderCategoryContent();
    });
    this.eventBus.on('OPEN_SHOP', (fromScreen?: string) => {
      this.previousScreen = fromScreen || null;
      this.show();
    });
  }

  public show(category: ShopCategory = 'FEATURED'): void {
    this.currentCategory = category;
    this.updateWallet();
    this.switchCategory(category);
    this.element.classList.remove('hidden');
    this.element.focus();
  }

  public hide(): void {
    if (this.element.classList.contains('hidden')) return;
    this.element.classList.add('hidden');
    const prev = this.previousScreen;
    this.previousScreen = null;
    if (prev === 'START') {
      this.eventBus.emit('GO_TO_MENU');
    }
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
    }
  }

  // --- Featured Deals ---
  private renderFeatured(container: HTMLElement): void {
    container.innerHTML = `
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
          <div class="item-icon-box gold-glow">🚀</div>
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
          <div class="item-icon-box orange-glow">⚡</div>
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
          <div class="item-icon-box purple-glow">🛹</div>
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

      const row = document.createElement('div');
      row.className = 'shop-card-item upgrade-item';
      row.innerHTML = `
        <div class="item-icon-box cyan-glow">${config.icon}</div>
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
        <div class="item-icon-box purple-glow">🛹</div>
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
        <div class="item-icon-box gold-glow">🛹🔥</div>
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
        <div class="item-icon-box cyan-glow">🚀</div>
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
        <div class="item-icon-box orange-glow">⚡</div>
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
    list.className = 'shop-grid';
    const chars = getAllCharacters();
    const coins = this.upgradeManager.getCoins();

    chars.forEach((char) => {
      const isUnlocked = this.progression.isCharacterUnlocked(char.id);
      const isEquipped = this.progression.getSelectedCharacter() === char.id;
      const cost = char.unlock.cost || 0;
      const canAfford = coins >= cost;

      const card = document.createElement('div');
      card.className = `shop-card-item char-shop-card ${isUnlocked ? 'owned' : ''}`;
      card.innerHTML = `
        <div class="item-icon-box cyan-glow">${char.portraitIcon}</div>
        <div class="item-meta">
          <div class="item-name">${char.name}</div>
          <div class="item-sub">${char.title}</div>
          <div class="item-bio-snippet">${char.personality}</div>
        </div>
        <div class="item-action-area">
          ${isEquipped 
            ? `<button class="arcade-btn btn-equipped" disabled>EQUIPPED</button>`
            : isUnlocked
            ? `<button class="arcade-btn btn-secondary" data-equip-char="${char.id}">EQUIP</button>`
            : char.unlock.type === 'COINS'
            ? `<button class="arcade-btn ${canAfford ? 'btn-gold' : 'btn-disabled'}" data-buy-char="${char.id}">
                ${cost.toLocaleString()} 🪙
              </button>`
            : `<button class="arcade-btn btn-disabled" disabled>🔒 ${char.unlock.description}</button>`
          }
          <button class="arcade-btn btn-ghost" data-view-char="${char.id}">3D VIEW</button>
        </div>
      `;

      // Event listeners
      const buyBtn = card.querySelector(`[data-buy-char="${char.id}"]`);
      if (buyBtn) {
        buyBtn.addEventListener('click', () => {
          const res = this.progression.purchaseCharacter(char.id);
          if (res.success) {
            this.showToast(res.message);
            this.renderCategoryContent();
          } else {
            this.showToast(res.message, true);
          }
        });
      }

      const equipBtn = card.querySelector(`[data-equip-char="${char.id}"]`);
      if (equipBtn) {
        equipBtn.addEventListener('click', () => {
          const res = this.progression.equipCharacter(char.id);
          if (res.success) {
            this.showToast(res.message);
            this.renderCategoryContent();
          }
        });
      }

      const viewBtn = card.querySelector(`[data-view-char="${char.id}"]`);
      if (viewBtn) {
        viewBtn.addEventListener('click', () => {
          this.hide();
          this.eventBus.emit('OPEN_CHARACTERS', 'SHOP');
        });
      }

      list.appendChild(card);
    });

    container.appendChild(list);
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
          this.hide();
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
