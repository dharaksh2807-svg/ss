import { EventBus, EVENTS } from '../core/EventBus';
import { ProgressionManager } from '../progression/ProgressionManager';
import { GameMode } from '../progression/ProgressionTypes';

export interface ReviveConfig {
  costSchedule: number[];
  maxRevivesPerRun: number;
  countdownDuration: number;
  graceDuration: number;
}

export const DEFAULT_REVIVE_CONFIG: ReviveConfig = {
  costSchedule: [1, 2, 4],
  maxRevivesPerRun: 3,
  countdownDuration: 5.0,
  graceDuration: 2.0
};

export interface ReviveOfferState {
  offerActive: boolean;
  revivesUsedThisRun: number;
  maxRevivesPerRun: number;
  currentCost: number;
  playerKeys: number;
  canAfford: boolean;
  isEligible: boolean;
}

export class ReviveManager {
  private static instance: ReviveManager;
  private config: ReviveConfig;
  private revivesUsedThisRun: number = 0;
  private isProcessingRevive: boolean = false;
  private isOfferActive: boolean = false;
  private eventBus = EventBus.getInstance();
  private progression = ProgressionManager.getInstance();

  constructor(config: Partial<ReviveConfig> = {}) {
    this.config = { ...DEFAULT_REVIVE_CONFIG, ...config };
  }

  public static getInstance(config?: Partial<ReviveConfig>): ReviveManager {
    if (!ReviveManager.instance) {
      ReviveManager.instance = new ReviveManager(config);
    }
    return ReviveManager.instance;
  }

  public resetRun(): void {
    this.revivesUsedThisRun = 0;
    this.isProcessingRevive = false;
    this.isOfferActive = false;
  }

  public getConfig(): Readonly<ReviveConfig> {
    return this.config;
  }

  public setConfig(custom: Partial<ReviveConfig>): void {
    this.config = { ...this.config, ...custom };
  }

  public getRevivesUsed(): number {
    return this.revivesUsedThisRun;
  }

  public getMaxRevives(): number {
    return this.config.maxRevivesPerRun;
  }

  public getReviveCost(): number {
    const idx = Math.min(this.revivesUsedThisRun, this.config.costSchedule.length - 1);
    return this.config.costSchedule[idx] ?? 4;
  }

  public hasEnoughKeys(): boolean {
    return this.progression.getKeys() >= this.getReviveCost();
  }

  public canOfferRevive(mode: GameMode = 'NORMAL'): boolean {
    // Isolated modes (Practice/Arena) do not use key revive mechanics
    if (mode === 'PRACTICE' || mode === 'ARENA') {
      return false;
    }
    return this.revivesUsedThisRun < this.config.maxRevivesPerRun;
  }

  public getOfferState(mode: GameMode = 'NORMAL'): ReviveOfferState {
    const cost = this.getReviveCost();
    const keys = this.progression.getKeys();
    const isEligible = this.canOfferRevive(mode);
    return {
      offerActive: this.isOfferActive,
      revivesUsedThisRun: this.revivesUsedThisRun,
      maxRevivesPerRun: this.config.maxRevivesPerRun,
      currentCost: cost,
      playerKeys: keys,
      canAfford: keys >= cost,
      isEligible
    };
  }

  public beginOffer(): boolean {
    if (this.isProcessingRevive || this.revivesUsedThisRun >= this.config.maxRevivesPerRun) {
      return false;
    }
    this.isOfferActive = true;
    this.eventBus.emit(EVENTS.REVIVE_OFFERED, this.getOfferState());
    return true;
  }

  public cancelOffer(): void {
    if (!this.isOfferActive) return;
    this.isOfferActive = false;
    this.isProcessingRevive = false;
    this.eventBus.emit(EVENTS.REVIVE_DECLINED);
  }

  /**
   * Atomic Key Deduction & Revive Execution
   * Protects against rapid clicking, duplicate spending, and race conditions.
   */
  public executeRevive(): { success: boolean; error?: string; keysSpent?: number; revivesUsed?: number } {
    if (this.isProcessingRevive) {
      return { success: false, error: 'ALREADY_PROCESSING' };
    }

    if (!this.isOfferActive) {
      return { success: false, error: 'NO_ACTIVE_OFFER' };
    }

    if (this.revivesUsedThisRun >= this.config.maxRevivesPerRun) {
      this.cancelOffer();
      return { success: false, error: 'REVIVE_LIMIT_REACHED' };
    }

    const cost = this.getReviveCost();
    const balance = this.progression.getKeys();

    if (balance < cost) {
      return { success: false, error: 'INSUFFICIENT_KEYS' };
    }

    this.isProcessingRevive = true;

    // Deduct keys atomically via ProgressionManager
    const consumed = this.progression.consumeKeys(cost);
    if (!consumed) {
      this.isProcessingRevive = false;
      return { success: false, error: 'TRANSACTION_FAILED' };
    }

    this.revivesUsedThisRun++;
    this.isOfferActive = false;
    this.isProcessingRevive = false;

    return {
      success: true,
      keysSpent: cost,
      revivesUsed: this.revivesUsedThisRun
    };
  }
}
