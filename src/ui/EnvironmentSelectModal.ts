import { EventBus, EVENTS } from '../core/EventBus';
import {
  EnvironmentManager,
  EnvironmentSelection
} from '../environment/EnvironmentConfig';
import { ProgressionManager } from '../progression/ProgressionManager';
import { getWorlds } from '../environment/WorldCatalog';

export class EnvironmentSelectModal {
  private element: HTMLElement;
  private envManager = EnvironmentManager.getInstance();
  private selectedPreference: EnvironmentSelection = 'DYNAMIC';
  private onSelectCallback?: (pref: EnvironmentSelection) => void;

  constructor(onSelect?: (pref: EnvironmentSelection) => void) {
    this.onSelectCallback = onSelect;
    this.selectedPreference = this.envManager.getSelectionPreference();

    let el = document.getElementById('environment-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'environment-modal';
      el.className = 'screen-overlay hidden';
      el.innerHTML = `
        <div class="modal-card glassmorphic env-modal-card" style="max-width: 680px; max-height: 90vh; overflow-y: auto;">
          <div class="modal-header">
            <h2 class="modal-title">RAILWAY DISTRICTS</h2>
            <p class="tab-subtitle">Choose your runner's world environment or experience continuous dynamic transitions!</p>
          </div>

          <div class="env-options-grid" id="env-options-list" style="display: flex; flex-direction: column; gap: 14px; margin: 18px 0;"></div>

          <div class="modal-buttons" style="margin-top: 24px; display: flex; gap: 12px; justify-content: flex-end;">
            <button id="env-close-btn" class="btn btn-secondary">BACK</button>
            <button id="env-confirm-btn" class="btn btn-primary pulse-anim">
              <span class="btn-icon">✓</span> APPLY DISTRICT
            </button>
          </div>
        </div>
      `;
      document.getElementById('ui-overlay')?.appendChild(el);
    }

    this.element = el;
    this.setupListeners();

    const bus = EventBus.getInstance();
    for (const event of ['CHARACTER_UNLOCKED', 'ENVIRONMENT_PREFERENCE_CHANGED', 'WALLET_UPDATED']) {
      bus.on(event, () => {
        if (event === 'ENVIRONMENT_PREFERENCE_CHANGED') {
          this.selectedPreference = this.envManager.getSelectionPreference();
        }
        if (!this.element.classList.contains('hidden')) this.render();
      });
    }
  }

  private setupListeners(): void {
    const closeBtn = document.getElementById('env-close-btn');
    closeBtn?.addEventListener('click', () => this.hide());

    const confirmBtn = document.getElementById('env-confirm-btn');
    confirmBtn?.addEventListener('click', () => {
      this.applySelection();
    });
  }

  public show(): void {
    this.selectedPreference = this.envManager.getSelectionPreference();
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

    const options = [
      {
        id: 'DYNAMIC' as EnvironmentSelection,
        title: 'Dynamic Districts (Recommended)',
        badge: 'ENDLESS JOURNEY',
        icon: '🔄',
        description: 'Journey across all four free railway worlds. Owned premium worlds join only when you enable them in the shop.',
        accent: '#38bdf8',
        previewImage: '/worlds/modern_metro.png',
        features: ['Continuous Transitions', 'Procedural Diversity', 'Endless Runs'],
        bgGradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(245, 158, 11, 0.18))'
      },
      ...getWorlds(ProgressionManager.getInstance().getState())
        .filter((world) => world.available && world.owned)
        .map((world) => ({
          id: world.id as EnvironmentSelection,
          title: world.displayName,
          badge: world.signatureLabel ? world.signatureLabel : (world.unlock === 'FREE' ? 'FREE WORLD' : world.rarity),
          icon: world.icon,
          description: world.description,
          accent: world.accentColor,
          previewImage: world.previewImage,
          features: world.features,
          bgGradient: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(14, 165, 233, 0.20))'
        }))
    ];

    const lockedWorlds = getWorlds(ProgressionManager.getInstance().getState())
      .filter((world) => world.available && !world.owned);

    list.innerHTML = `
      <div class="env-options-container" style="display: flex; flex-direction: column; gap: 12px;">
        ${options.map((opt) => {
          const isSelected = this.selectedPreference === opt.id;
          return `
            <div class="env-card-option ${isSelected ? 'selected' : ''}" 
                 data-env-id="${opt.id}" 
                 role="button" 
                 tabindex="0"
                 aria-pressed="${isSelected}"
                 style="background: ${opt.bgGradient}; border: 2px solid ${isSelected ? opt.accent : 'rgba(255, 255, 255, 0.12)'}; border-radius: 14px; padding: 12px 16px; cursor: pointer; transition: all 0.2s ease; position: relative;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0;">
                  <div style="width: 72px; height: 50px; border-radius: 8px; overflow: hidden; position: relative; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.15); background: #000;">
                    <img src="${opt.previewImage}" alt="${opt.title}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" />
                    <span style="position: absolute; bottom: 2px; right: 2px; font-size: 14px; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${opt.icon}</span>
                  </div>
                  <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 10px; font-weight: 800; letter-spacing: 1px; color: ${opt.accent}; text-transform: uppercase;">${opt.badge}</span>
                    </div>
                    <h3 style="margin: 2px 0 0 0; font-size: 16px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${opt.title}</h3>
                    <p style="margin: 2px 0 0 0; font-size: 12px; color: #94a3b8; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${opt.description}</p>
                  </div>
                </div>
                <div class="env-radio-indicator" style="width: 22px; height: 22px; border-radius: 50%; border: 2px solid ${isSelected ? opt.accent : 'rgba(255, 255, 255, 0.3)'}; display: flex; align-items: center; justify-content: center; background: ${isSelected ? opt.accent : 'transparent'}; flex-shrink: 0;">
                  ${isSelected ? '<span style="color: #000; font-size: 13px; font-weight: 900;">✓</span>' : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      ${lockedWorlds.length > 0 ? `
        <div class="env-discovery-section" style="margin-top: 18px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.1);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #f59e0b; text-transform: uppercase;">🔒 EXPLORE PREMIUM WORLDS IN SHOP</span>
            <button class="arcade-btn btn-ghost" data-action="open-shop-worlds" style="font-size: 11px; padding: 4px 10px;">VISIT SHOP 🛒</button>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px;">
            ${lockedWorlds.map((w) => `
              <div class="env-locked-card" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 8px; display: flex; flex-direction: column; gap: 6px;">
                <div style="width: 100%; height: 60px; border-radius: 6px; overflow: hidden; position: relative;">
                  <img src="${w.previewImage}" alt="${w.displayName}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" />
                  <span style="position: absolute; top: 4px; left: 4px; font-size: 10px; background: rgba(0,0,0,0.6); padding: 1px 5px; border-radius: 4px; color: #f59e0b; font-weight: 800;">🔒 LOCKED</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 12px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${w.icon} ${w.displayName}</span>
                  <span style="font-size: 11px; font-weight: 800; color: #f59e0b;">${w.signatureCharacterId ? 'WITH MODI 🏛️' : `${w.coinCost.toLocaleString()} 🪙`}</span>
                </div>
                <button class="arcade-btn btn-gold" data-shop-world="${w.id}" style="font-size: 10px; padding: 4px 8px; width: 100%; margin-top: 2px;">VIEW IN SHOP</button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    // Attach click listeners to cards
    const cards = list.querySelectorAll('.env-card-option');
    cards.forEach((card) => {
      const selectCard = () => {
        const id = card.getAttribute('data-env-id') as EnvironmentSelection;
        if (id) {
          this.selectedPreference = id;
          this.render();
        }
      };
      card.addEventListener('click', selectCard);
      if (typeof (card as any).dispatchEvent === 'function') {
        card.addEventListener('keydown', (e: Event) => {
          const keyEvent = e as KeyboardEvent;
          if (keyEvent?.key === 'Enter' || keyEvent?.key === ' ') {
            keyEvent.preventDefault?.();
            selectCard();
          }
        });
      }
    });

    if (typeof list.querySelector === 'function') {
      list.querySelectorAll('[data-shop-world]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          EventBus.getInstance().emit('OPEN_SHOP', 'WORLDS');
        });
      });

      list.querySelector('[data-action="open-shop-worlds"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        EventBus.getInstance().emit('OPEN_SHOP', 'WORLDS');
      });
    }
  }

  private applySelection(): void {
    if (!this.envManager.savePreference(this.selectedPreference)) {
      const list = document.getElementById('env-options-list');
      if (list) {
        const error = document.createElement('p');
        error.setAttribute('role', 'alert');
        error.textContent = 'Could not save world selection. Please try again.';
        list.appendChild(error);
      }
      return;
    }

    if (this.onSelectCallback) {
      this.onSelectCallback(this.selectedPreference);
    }

    this.hide();
  }
}
