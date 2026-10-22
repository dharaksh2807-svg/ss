import { EventBus, EVENTS } from '../core/EventBus';
import { HoverboardDefinition, HoverboardId, getHoverboardById } from './HoverboardCatalog';
import { ProgressionManager } from '../progression/ProgressionManager';

export class HoverboardManager {
  private static instance: HoverboardManager;

  // Active state
  private isActive: boolean = false;
  private activeBoardDef: HoverboardDefinition | null = null;
  private duration: number = 25.0;
  private remaining: number = 0;
  private warnedExpiring: boolean = false;
  private cooldownRemaining: number = 0;

  // Invulnerability recovery grace period
  private postCrashGraceTimer: number = 0;

  private progression: ProgressionManager;
  private eventBus = EventBus.getInstance();

  constructor() {
    this.progression = ProgressionManager.getInstance();

    // Listen to equip changes
    this.eventBus.on('BOARD_EQUIPPED', (boardId: string) => {
      if (!this.isActive) {
        this.activeBoardDef = getHoverboardById(boardId) || getHoverboardById('board_urban_glide')!;
      }
    });
  }

  public static getInstance(): HoverboardManager {
    if (!HoverboardManager.instance) {
      HoverboardManager.instance = new HoverboardManager();
    }
    return HoverboardManager.instance;
  }

  /**
   * Check if hoverboard can be deployed right now
   */
  public canActivate(): { allowed: boolean; reason?: string } {
    if (this.isActive) {
      return { allowed: false, reason: 'Hoverboard already active' };
    }

    if (this.cooldownRemaining > 0 && this.getCharges() <= 0) {
      return { allowed: false, reason: `Recharging... (${Math.ceil(this.cooldownRemaining)}s)` };
    }

    return { allowed: true };
  }

  /**
   * Deploy active hoverboard
   */
  public activate(): boolean {
    const check = this.canActivate();
    if (!check.allowed) return false;

    // Resolve equipped board definition
    const equippedId = this.progression.getSelectedBoard() as HoverboardId;
    this.activeBoardDef = getHoverboardById(equippedId) || getHoverboardById('board_urban_glide')!;

    // Consume 1 charge if inventory has charges available
    const charges = this.getCharges();
    if (charges > 0) {
      this.progression.consumeHoverboardCharge();
    }

    this.isActive = true;
    this.duration = this.activeBoardDef.duration;
    this.remaining = this.duration;
    this.warnedExpiring = false;
    this.cooldownRemaining = 0;

    // Track lifetime usage
    this.progression.recordHoverboardUsed();

    // Emit standardized events
    this.eventBus.emit(EVENTS.HOVERBOARD_ACTIVATED, this.activeBoardDef);
    this.eventBus.emit(EVENTS.BOARD_ACTIVATED, this.activeBoardDef);

    return true;
  }

  /**
   * Consume hoverboard protection upon obstacle collision
   * Returns true if successfully absorbed
   */
  public breakBoard(): boolean {
    if (!this.isActive) return false;

    const graceDuration = this.activeBoardDef?.ability.protectionRecoveryDuration || 1.5;

    // Deactivate board
    this.isActive = false;
    this.remaining = 0;
    this.warnedExpiring = false;

    // Set cooldown before next activation
    if (this.activeBoardDef) {
      this.cooldownRemaining = this.activeBoardDef.cooldown;
    }

    // Grant brief invulnerability window so runner does not take double damage
    this.postCrashGraceTimer = graceDuration;

    // Emit break events for sound & visual particle explosion
    this.eventBus.emit(EVENTS.HOVERBOARD_BROKEN, {
      boardDef: this.activeBoardDef,
      graceDuration
    });

    return true;
  }

  public update(dt: number): void {
    // 1. Post-crash invulnerability recovery timer
    if (this.postCrashGraceTimer > 0) {
      this.postCrashGraceTimer -= dt;
      if (this.postCrashGraceTimer <= 0) {
        this.postCrashGraceTimer = 0;
      }
    }

    // 2. Cooldown decay when inactive
    if (!this.isActive && this.cooldownRemaining > 0) {
      this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
    }

    // 3. Active board countdown
    if (this.isActive) {
      this.remaining -= dt;

      // Expiration warning 3s before ending
      if (this.remaining <= 3.0 && !this.warnedExpiring && this.remaining > 0) {
        this.warnedExpiring = true;
        this.eventBus.emit('HOVERBOARD_EXPIRING', { remaining: this.remaining });
      }

      if (this.remaining <= 0) {
        this.expire();
      }
    }
  }

  private expire(): void {
    this.isActive = false;
    this.remaining = 0;
    this.warnedExpiring = false;

    if (this.activeBoardDef) {
      this.cooldownRemaining = this.activeBoardDef.cooldown;
    }

    this.eventBus.emit(EVENTS.POWERUP_EXPIRED, 'HOVERBOARD');
    this.eventBus.emit('HOVERBOARD_EXPIRED', this.activeBoardDef);
  }

  public reset(): void {
    this.isActive = false;
    this.remaining = 0;
    this.warnedExpiring = false;
    this.postCrashGraceTimer = 0;
    this.cooldownRemaining = 0;
  }

  // State inquiries
  public isBoardActive(): boolean {
    return this.isActive;
  }

  public getActiveBoard(): HoverboardDefinition | null {
    if (this.isActive) return this.activeBoardDef;
    const equippedId = this.progression.getSelectedBoard() as HoverboardId;
    return getHoverboardById(equippedId) || getHoverboardById('board_urban_glide')!;
  }

  public getRemaining(): number {
    return Math.max(0, this.remaining);
  }

  public getDuration(): number {
    return this.duration;
  }

  public getProgress(): number {
    if (!this.isActive || this.duration <= 0) return 0;
    return Math.max(0, Math.min(1.0, this.remaining / this.duration));
  }

  public getCooldownRemaining(): number {
    return Math.max(0, this.cooldownRemaining);
  }

  public isInvulnerableAfterCrash(): boolean {
    return this.postCrashGraceTimer > 0;
  }

  public getCharges(): number {
    return this.progression.getHoverboardCharges();
  }

  // Ability Modifiers
  public getSpeedMultiplier(): number {
    if (!this.isActive || !this.activeBoardDef) return 1.0;
    return this.activeBoardDef.ability.speedMultiplier || 1.0;
  }

  public getScoreMultiplierBonus(): number {
    if (!this.isActive || !this.activeBoardDef) return 0;
    return this.activeBoardDef.ability.scoreMultiplierBonus || 0;
  }

  public getJumpVelocityMultiplier(): number {
    if (!this.isActive || !this.activeBoardDef) return 1.0;
    return this.activeBoardDef.ability.jumpVelocityMultiplier || 1.0;
  }

  public getGravityMultiplier(): number {
    if (!this.isActive || !this.activeBoardDef) return 1.0;
    return this.activeBoardDef.ability.gravityMultiplier || 1.0;
  }

  public getLaneChangeDurationMultiplier(): number {
    if (!this.isActive || !this.activeBoardDef) return 1.0;
    return this.activeBoardDef.ability.laneChangeSpeedMultiplier || 1.0;
  }

  public getMagnetRadiusBonus(): number {
    if (!this.isActive || !this.activeBoardDef) return 0;
    return this.activeBoardDef.ability.magnetRadiusBonus || 0;
  }
}
