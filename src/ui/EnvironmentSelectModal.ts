import { EventBus } from '../core/EventBus';
import {
  EnvironmentManager,
  EnvironmentSelection,
  MODERN_METRO_THEME,
  HISTORIC_QUARTER_THEME
} from '../environment/EnvironmentConfig';

export class EnvironmentSelectModal {
  private element: HTMLElement;
  private envManager = EnvironmentManager.getInstance();
  private selectedPreference: EnvironmentSelection = 'DYNAMIC';
  private previousScreen: string | null = null;
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
        <div class="modal-card glassmorphic env-modal-card" style="max-width: 680px;">
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
    bus.on('OPEN_ENVIRONMENT_SELECT', (fromScreen?: string) => {
      this.previousScreen = fromScreen || 'START';
      this.show();
    });
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

  public hide(): void {
    this.element.classList.add('hidden');
    if (this.previousScreen === 'START') {
      document.getElementById('start-screen')?.classList.remove('hidden');
    }
  }

  private render(): void {
    const list = document.getElementById('env-options-list');
    if (!list) return;

    const options: {
      id: EnvironmentSelection;
      title: string;
      badge: string;
      icon: string;
      tagline: string;
      description: string;
      accent: string;
      bgGradient: string;
    }[] = [
      {
        id: 'DYNAMIC',
        title: 'Dynamic Districts (Recommended)',
        badge: 'ENDLESS JOURNEY',
        icon: '🔄',
        tagline: 'Monumental Portals & Seamless Era Transitions',
        description: 'Run continuously across Modern Metro and Historic Quarter. Monumental viaduct portals bridge the districts with atmospheric lighting and sky blends.',
        accent: '#38bdf8',
        bgGradient: 'linear-gradient(135deg, rgba(14, 165, 233, 0.18) 0%, rgba(245, 158, 11, 0.18) 100%)'
      },
      {
        id: 'MODERN_METRO',
        title: 'Modern Metro District',
        badge: 'AZURE DAYLIGHT',
        icon: '🏙️',
        tagline: 'Glass High-Rises • Electric Rail • Daylight Skies',
        description: 'Sleek corporate skyscrapers, cantilevered balconies, illuminated glass skybridges, digital LED signs, and vibrant azure daytime lighting.',
        accent: '#00e5ff',
        bgGradient: 'linear-gradient(135deg, rgba(2, 136, 209, 0.22) 0%, rgba(14, 165, 233, 0.08) 100%)'
      },
      {
        id: 'HISTORIC_QUARTER',
        title: 'Historic Railway Quarter',
        badge: 'GOLDEN HOUR',
        icon: '🏛️',
        tagline: 'Victorian Brick • Stone Viaducts • Clock Towers',
        description: 'Aged red brick brownstones, soot-stained arched viaducts, cast-iron gas lamp posts, steam locomotive workshops, and warm golden hour atmosphere.',
        accent: '#f59e0b',
        bgGradient: 'linear-gradient(135deg, rgba(217, 119, 6, 0.22) 0%, rgba(180, 83, 9, 0.08) 100%)'
      }
    ];

    list.innerHTML = options.map((opt) => {
      const isSelected = this.selectedPreference === opt.id;
      return `
        <div class="env-card-option ${isSelected ? 'selected' : ''}" 
             data-env-id="${opt.id}" 
             role="button" 
             tabindex="0"
             style="background: ${opt.bgGradient}; border: 2px solid ${isSelected ? opt.accent : 'rgba(255, 255, 255, 0.12)'}; border-radius: 14px; padding: 14px 18px; cursor: pointer; transition: all 0.2s ease; position: relative;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 26px;">${opt.icon}</span>
              <div>
                <span style="font-size: 11px; font-weight: 800; letter-spacing: 1px; color: ${opt.accent}; text-transform: uppercase;">${opt.badge}</span>
                <h3 style="margin: 0; font-size: 17px; font-weight: 700; color: #fff;">${opt.title}</h3>
              </div>
            </div>
            <div class="env-radio-indicator" style="width: 22px; height: 22px; border-radius: 50%; border: 2px solid ${isSelected ? opt.accent : 'rgba(255, 255, 255, 0.3)'}; display: flex; align-items: center; justify-content: center; background: ${isSelected ? opt.accent : 'transparent'};">
              ${isSelected ? '<span style="color: #000; font-size: 13px; font-weight: 900;">✓</span>' : ''}
            </div>
          </div>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8; line-height: 1.4;">${opt.description}</p>
        </div>
      `;
    }).join('');

    // Attach click listeners to cards
    const cards = list.querySelectorAll('.env-card-option');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-env-id') as EnvironmentSelection;
        if (id) {
          this.selectedPreference = id;
          this.render();
        }
      });
    });
  }

  private applySelection(): void {
    this.envManager.savePreference(this.selectedPreference);
    EventBus.getInstance().emit('ENVIRONMENT_PREFERENCE_CHANGED', this.selectedPreference);

    if (this.onSelectCallback) {
      this.onSelectCallback(this.selectedPreference);
    }

    this.hide();
  }
}
