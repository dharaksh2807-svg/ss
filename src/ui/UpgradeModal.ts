import { EventBus } from '../core/EventBus';
import { UpgradeManager, UpgradablePowerup, UPGRADE_CONFIGS } from '../player/UpgradeManager';
import { getPowerupIconSvg } from './IconCatalog';

export class UpgradeModal {
  private element: HTMLElement;
  private walletCoinsEl: HTMLElement;
  private itemsContainer: HTMLElement;
  private closeBtn: HTMLButtonElement;
  private upgradeManager: UpgradeManager;
  private previousScreen: string | null = null;

  constructor() {
    this.element = document.getElementById('shop-modal')!;
    this.walletCoinsEl = document.getElementById('shop-wallet-coins')!;
    this.itemsContainer = document.getElementById('shop-items-container')!;
    this.closeBtn = document.getElementById('shop-close-btn') as HTMLButtonElement;
    this.upgradeManager = UpgradeManager.getInstance();

    this.closeBtn.addEventListener('click', () => {
      this.hide();
    });

    const bus = EventBus.getInstance();
    bus.on('OPEN_SHOP', (fromScreen?: string) => {
      this.previousScreen = fromScreen || null;
      this.show();
    });

    bus.on('WALLET_UPDATED', () => {
      this.updateWallet();
      this.renderItems();
    });

    bus.on('UPGRADES_UPDATED', () => {
      this.updateWallet();
      this.renderItems();
    });
  }

  public show(): void {
    this.updateWallet();
    this.renderItems();
    this.element.classList.remove('hidden');
  }

  public hide(restorePrevious: boolean = true): void {
    this.element.classList.add('hidden');
    if (restorePrevious) {
      if (this.previousScreen === 'START') {
        const startScreen = document.getElementById('start-screen');
        if (startScreen) startScreen.classList.remove('hidden');
      } else if (this.previousScreen === 'GAMEOVER') {
        const gameOverModal = document.getElementById('game-over-modal');
        if (gameOverModal) gameOverModal.classList.remove('hidden');
      }
    }
    this.previousScreen = null;
  }

  private updateWallet(): void {
    this.walletCoinsEl.textContent = this.upgradeManager.getCoins().toLocaleString();
  }

  public renderItems(): void {
    const powerups: UpgradablePowerup[] = ['MAGNET', 'JETPACK', 'SNEAKERS', 'MULTIPLIER', 'SHIELD'];
    this.itemsContainer.innerHTML = '';

    powerups.forEach((type) => {
      const config = UPGRADE_CONFIGS[type];
      const level = this.upgradeManager.getLevel(type);
      const cost = this.upgradeManager.getUpgradeCost(type);
      const canAfford = this.upgradeManager.canUpgrade(type);

      const row = document.createElement('div');
      row.className = 'shop-item-row';

      // Left column: Icon + Details
      const leftCol = document.createElement('div');
      leftCol.className = 'shop-item-left';

      const iconEl = document.createElement('div');
      iconEl.className = 'shop-item-icon';
      iconEl.innerHTML = getPowerupIconSvg(type, 36);

      const detailsEl = document.createElement('div');
      detailsEl.className = 'shop-item-details';

      // Title + Level Pips
      const titleRow = document.createElement('div');
      titleRow.className = 'shop-item-title-row';

      const titleEl = document.createElement('span');
      titleEl.className = 'shop-item-title';
      titleEl.textContent = config.name;

      const pipsContainer = document.createElement('div');
      pipsContainer.className = 'shop-item-pips';
      for (let lvl = 1; lvl <= 5; lvl++) {
        const pip = document.createElement('span');
        pip.className = `shop-pip ${lvl <= level ? 'filled' : ''}`;
        pipsContainer.appendChild(pip);
      }

      titleRow.appendChild(titleEl);
      titleRow.appendChild(pipsContainer);

      const descEl = document.createElement('div');
      descEl.className = 'shop-item-desc';
      descEl.textContent = config.description;

      // Stat Preview
      const statEl = document.createElement('div');
      statEl.className = 'shop-item-stat-preview';
      const curDuration = config.baseDuration + (level - 1) * config.durationPerLevel;
      let statText = `⏱️ Duration: ${curDuration}s`;

      if (type === 'MAGNET') {
        const curRad = config.baseStat + (level - 1) * config.statPerLevel;
        statText += ` | 🧲 Radius: ${curRad}m`;
      } else if (type === 'SNEAKERS') {
        const boost = config.baseStat + (level - 1) * config.statPerLevel;
        statText += ` | 🦘 Boost: +${boost}%`;
      } else if (type === 'SHIELD') {
        const grace = (config.baseStat + (level - 1) * config.statPerLevel).toFixed(1);
        statText += ` | 🛡️ Grace: ${grace}s`;
      }

      if (cost !== null) {
        statText += ` (Next: +${config.durationPerLevel}s)`;
      } else {
        statText += ` (MAX LEVEL)`;
      }
      statEl.textContent = statText;

      detailsEl.appendChild(titleRow);
      detailsEl.appendChild(descEl);
      detailsEl.appendChild(statEl);

      leftCol.appendChild(iconEl);
      leftCol.appendChild(detailsEl);

      // Right column: Upgrade Button
      const btn = document.createElement('button');
      btn.className = 'shop-upgrade-btn';

      if (cost === null) {
        btn.classList.add('max-level');
        btn.disabled = true;
        btn.textContent = 'MAX LEVEL';
      } else {
        btn.textContent = `🪙 ${cost.toLocaleString()}`;
        btn.disabled = !canAfford;

        btn.addEventListener('click', () => {
          if (this.upgradeManager.purchaseUpgrade(type)) {
            // Visual bounce feedback
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
              btn.style.transform = '';
            }, 100);
          }
        });
      }

      row.appendChild(leftCol);
      row.appendChild(btn);

      this.itemsContainer.appendChild(row);
    });
  }
}
