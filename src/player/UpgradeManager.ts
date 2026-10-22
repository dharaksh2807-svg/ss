import { EventBus, EVENTS } from '../core/EventBus';

export type UpgradablePowerup = 'MAGNET' | 'JETPACK' | 'SNEAKERS' | 'MULTIPLIER' | 'SHIELD';

export interface PowerupUpgradeConfig {
  name: string;
  icon: string;
  description: string;
  baseDuration: number;
  durationPerLevel: number;
  baseStat: number; // e.g. radius or jump boost
  statPerLevel: number;
  statLabel: string;
  costs: number[]; // Index 0: Lvl 1->2, Index 1: Lvl 2->3, Index 2: Lvl 3->4, Index 3: Lvl 4->5
}

export const UPGRADE_CONFIGS: Record<UpgradablePowerup, PowerupUpgradeConfig> = {
  MAGNET: {
    name: 'Coin Magnet',
    icon: '🧲',
    description: 'Pulls nearby coins toward you across all lanes.',
    baseDuration: 10,
    durationPerLevel: 3, // 10s -> 13s -> 16s -> 19s -> 22s
    baseStat: 12, // Pull radius in meters
    statPerLevel: 3, // 12m -> 15m -> 18m -> 21m -> 24m
    statLabel: 'Attraction Radius',
    costs: [200, 500, 1000, 2000]
  },
  JETPACK: {
    name: 'Rocket Jetpack',
    icon: '🚀',
    description: 'Fly above trains and glide through golden sky coin trails.',
    baseDuration: 8,
    durationPerLevel: 2, // 8s -> 10s -> 12s -> 14s -> 16s
    baseStat: 9.0, // Flight altitude (m)
    statPerLevel: 0,
    statLabel: 'Flight Altitude',
    costs: [300, 750, 1500, 3000]
  },
  SNEAKERS: {
    name: 'Super Sneakers',
    icon: '👟',
    description: 'Bouncy winged high-tops for massive airborne leaps.',
    baseDuration: 12,
    durationPerLevel: 3, // 12s -> 15s -> 18s -> 21s -> 24s
    baseStat: 45, // Jump height boost percentage
    statPerLevel: 5, // +45% -> +50% -> +55% -> +60% -> +65%
    statLabel: 'Jump Boost',
    costs: [200, 500, 1000, 2000]
  },
  MULTIPLIER: {
    name: '2X Multiplier',
    icon: '⚡',
    description: 'Doubles all score generation during its duration.',
    baseDuration: 10,
    durationPerLevel: 3, // 10s -> 13s -> 16s -> 19s -> 22s
    baseStat: 2, // Multiplier
    statPerLevel: 0,
    statLabel: 'Score Multiplier',
    costs: [250, 600, 1200, 2500]
  },
  SHIELD: {
    name: 'Protective Shield',
    icon: '🛡️',
    description: 'Absorbs one fatal impact and grants post-hit invulnerability.',
    baseDuration: 16,
    durationPerLevel: 4, // 16s -> 20s -> 24s -> 28s -> 32s
    baseStat: 1.5, // Post-impact grace window in seconds
    statPerLevel: 0.3, // 1.5s -> 1.8s -> 2.1s -> 2.4s -> 2.7s
    statLabel: 'Grace Window',
    costs: [250, 600, 1200, 2500]
  }
};

const STORAGE_KEYS = {
  WALLET: 'metro_runner_wallet',
  UPGRADES: 'metro_runner_upgrades'
};

export class UpgradeManager {
  private static instance: UpgradeManager;
  private totalCoins: number = 0;
  private levels: Record<UpgradablePowerup, number> = {
    MAGNET: 1,
    JETPACK: 1,
    SNEAKERS: 1,
    MULTIPLIER: 1,
    SHIELD: 1
  };
  private eventBus = EventBus.getInstance();

  constructor() {
    this.load();
  }

  public static getInstance(): UpgradeManager {
    if (!UpgradeManager.instance) {
      UpgradeManager.instance = new UpgradeManager();
    }
    return UpgradeManager.instance;
  }

  public load(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const savedCoins = localStorage.getItem(STORAGE_KEYS.WALLET);
      if (savedCoins !== null) {
        this.totalCoins = Math.max(0, parseInt(savedCoins, 10) || 0);
      }

      const savedUpgrades = localStorage.getItem(STORAGE_KEYS.UPGRADES);
      if (savedUpgrades !== null) {
        const parsed = JSON.parse(savedUpgrades);
        for (const key of Object.keys(this.levels) as UpgradablePowerup[]) {
          if (typeof parsed[key] === 'number') {
            this.levels[key] = Math.max(1, Math.min(5, parsed[key]));
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load upgrades from localStorage:', e);
    }
  }

  public save(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEYS.WALLET, this.totalCoins.toString());
      localStorage.setItem(STORAGE_KEYS.UPGRADES, JSON.stringify(this.levels));
    } catch (e) {
      console.warn('Failed to save upgrades to localStorage:', e);
    }
  }

  public getCoins(): number {
    return this.totalCoins;
  }

  public setCoins(amount: number): void {
    this.totalCoins = Math.max(0, amount);
    this.save();
    this.eventBus.emit('WALLET_UPDATED', this.totalCoins);
  }

  public addCoins(amount: number): void {
    if (amount <= 0) return;
    this.totalCoins += amount;
    this.save();
    this.eventBus.emit('WALLET_UPDATED', this.totalCoins);
  }

  public deductCoins(amount: number): boolean {
    if (amount <= 0) return true;
    if (this.totalCoins < amount) return false;
    this.totalCoins -= amount;
    this.save();
    this.eventBus.emit('WALLET_UPDATED', this.totalCoins);
    return true;
  }

  public getLevel(type: UpgradablePowerup): number {
    return this.levels[type] || 1;
  }

  public getUpgradeCost(type: UpgradablePowerup): number | null {
    const currentLvl = this.getLevel(type);
    if (currentLvl >= 5) return null; // Max level reached
    const config = UPGRADE_CONFIGS[type];
    return config.costs[currentLvl - 1] ?? null;
  }

  public canUpgrade(type: UpgradablePowerup): boolean {
    const cost = this.getUpgradeCost(type);
    if (cost === null) return false;
    return this.totalCoins >= cost;
  }

  public purchaseUpgrade(type: UpgradablePowerup): boolean {
    const cost = this.getUpgradeCost(type);
    if (cost === null || this.totalCoins < cost) {
      return false;
    }

    this.totalCoins -= cost;
    this.levels[type] = Math.min(5, this.levels[type] + 1);
    this.save();

    this.eventBus.emit('WALLET_UPDATED', this.totalCoins);
    this.eventBus.emit('UPGRADES_UPDATED', { type, level: this.levels[type] });
    return true;
  }

  public getDuration(type: UpgradablePowerup): number {
    const config = UPGRADE_CONFIGS[type];
    const lvl = this.getLevel(type);
    return config.baseDuration + (lvl - 1) * config.durationPerLevel;
  }

  public getMagnetRadius(): number {
    const config = UPGRADE_CONFIGS.MAGNET;
    const lvl = this.getLevel('MAGNET');
    return config.baseStat + (lvl - 1) * config.statPerLevel;
  }

  public getJumpVelocityMultiplier(): number {
    const config = UPGRADE_CONFIGS.SNEAKERS;
    const lvl = this.getLevel('SNEAKERS');
    const boostPct = config.baseStat + (lvl - 1) * config.statPerLevel;
    return 1.0 + boostPct / 100.0;
  }

  public getShieldGraceDuration(): number {
    const config = UPGRADE_CONFIGS.SHIELD;
    const lvl = this.getLevel('SHIELD');
    return config.baseStat + (lvl - 1) * config.statPerLevel;
  }

  /**
   * Reset wallet and upgrades for debugging / tests
   */
  public resetAll(): void {
    this.totalCoins = 0;
    this.levels = {
      MAGNET: 1,
      JETPACK: 1,
      SNEAKERS: 1,
      MULTIPLIER: 1,
      SHIELD: 1
    };
    this.save();
    this.eventBus.emit('WALLET_UPDATED', this.totalCoins);
    this.eventBus.emit('UPGRADES_UPDATED', this.levels);
  }
}
