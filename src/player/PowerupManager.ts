import { CONSTANTS } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';
import { UpgradeManager, UpgradablePowerup } from './UpgradeManager';

export type PowerupType = 'MAGNET' | 'JETPACK' | 'SNEAKERS' | 'MULTIPLIER' | 'SHIELD' | 'HOVERBOARD';

export interface ActivePowerup {
  type: PowerupType;
  duration: number;
  remaining: number;
  warnedExpiring?: boolean;
}

export class PowerupManager {
  private activePowerups: Map<PowerupType, ActivePowerup> = new Map();
  private invulnerabilityTimer: number = 0;
  private isJetpackPaused: boolean = false;
  private eventBus = EventBus.getInstance();
  private upgradeManager: UpgradeManager;

  constructor() {
    this.upgradeManager = UpgradeManager.getInstance();

    this.eventBus.on(EVENTS.POWERUP_COLLECTED, (type: PowerupType) => {
      this.activate(type);
    });
  }

  public activate(type: PowerupType): void {
    let duration: number;

    if (type === 'HOVERBOARD') {
      duration = CONSTANTS.HOVERBOARD_DURATION;
    } else {
      duration = this.upgradeManager.getDuration(type as UpgradablePowerup);
    }

    // Refresh duration if already active or activate new
    this.activePowerups.set(type, {
      type,
      duration,
      remaining: duration,
      warnedExpiring: false
    });

    this.eventBus.emit(EVENTS.POWERUP_ACTIVATED, type);

    if (type === 'HOVERBOARD') {
      this.eventBus.emit(EVENTS.HOVERBOARD_ACTIVATED);
      this.eventBus.emit(EVENTS.BOARD_ACTIVATED);
    } else if (type === 'SHIELD') {
      this.eventBus.emit('SHIELD_ACTIVATED');
    } else if (type === 'JETPACK') {
      this.eventBus.emit('JETPACK_ACTIVATED');
    }
  }

  public update(dt: number): void {
    // 1. Invulnerability grace timer
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer -= dt;
      if (this.invulnerabilityTimer <= 0) {
        this.invulnerabilityTimer = 0;
      }
    }

    // 2. Active powerups countdown
    for (const [type, powerup] of this.activePowerups.entries()) {
      if (type === 'JETPACK' && this.isJetpackPaused) {
        // Paused during deferred takeoff inside enclosed low tunnels to preserve duration
        continue;
      }
      powerup.remaining -= dt;

      // Expiration warning when 3 seconds remaining
      if (powerup.remaining <= 3.0 && !powerup.warnedExpiring && powerup.remaining > 0) {
        powerup.warnedExpiring = true;
        this.eventBus.emit('POWERUP_EXPIRING', type);
      }

      if (powerup.remaining <= 0) {
        this.activePowerups.delete(type);
        this.eventBus.emit(EVENTS.POWERUP_EXPIRED, type);

        if (type === 'JETPACK') {
          this.eventBus.emit('JETPACK_LANDED');
          // Grant post-jetpack safe landing grace window
          this.grantInvulnerability(1.5);
        }
      }
    }
  }

  // --- Coin Magnet ---
  public isMagnetActive(): boolean {
    return this.activePowerups.has('MAGNET');
  }

  public getMagnetRadius(): number {
    return this.upgradeManager.getMagnetRadius();
  }

  // --- Rocket Jetpack ---
  public isJetpackActive(): boolean {
    return this.activePowerups.has('JETPACK');
  }

  public getJetpackRemaining(): number {
    const jp = this.activePowerups.get('JETPACK');
    return jp ? jp.remaining : 0;
  }

  public getJetpackDuration(): number {
    const jp = this.activePowerups.get('JETPACK');
    return jp ? jp.duration : 1;
  }

  public setJetpackPaused(paused: boolean): void {
    this.isJetpackPaused = paused;
  }

  public isJetpackTimerPaused(): boolean {
    return this.isJetpackPaused;
  }

  public isActive(type: PowerupType): boolean {
    return this.activePowerups.has(type);
  }

  // --- Super Sneakers ---
  public isSuperSneakersActive(): boolean {
    return this.activePowerups.has('SNEAKERS');
  }

  public getJumpVelocityMultiplier(): number {
    return this.upgradeManager.getJumpVelocityMultiplier();
  }

  // --- Score Multiplier ---
  public is2xMultiplierActive(): boolean {
    return this.activePowerups.has('MULTIPLIER');
  }

  public getScoreMultiplier(): number {
    return this.is2xMultiplierActive() ? 2 : 1;
  }

  // --- Protective Shield ---
  public hasShieldActive(): boolean {
    return this.activePowerups.has('SHIELD');
  }

  /**
   * Consumes shield on collision impact.
   * Returns true if absorbed, false if no shield was active.
   */
  public consumeShield(): boolean {
    if (this.hasShieldActive()) {
      this.activePowerups.delete('SHIELD');
      // Grant post-impact invulnerability grace window
      const grace = this.upgradeManager.getShieldGraceDuration();
      this.grantInvulnerability(grace);
      this.eventBus.emit('SHIELD_BROKEN');
      return true;
    }
    return false;
  }

  // --- Hoverboard ---
  public isHoverboardActive(): boolean {
    return this.activePowerups.has('HOVERBOARD');
  }

  /**
   * Consumes hoverboard protection on collision.
   */
  public breakHoverboard(): boolean {
    if (this.isHoverboardActive()) {
      this.activePowerups.delete('HOVERBOARD');
      this.grantInvulnerability(1.2);
      this.eventBus.emit(EVENTS.HOVERBOARD_BROKEN);
      return true;
    }
    return false;
  }

  // --- Invulnerability Grace Period ---
  public isInvulnerable(): boolean {
    return this.invulnerabilityTimer > 0;
  }

  public grantInvulnerability(seconds: number): void {
    this.invulnerabilityTimer = Math.max(this.invulnerabilityTimer, seconds);
  }

  public getActivePowerups(): ActivePowerup[] {
    return Array.from(this.activePowerups.values());
  }

  public getRemaining(type: PowerupType): number {
    const p = this.activePowerups.get(type);
    return p ? p.remaining : 0;
  }

  public reset(): void {
    this.activePowerups.clear();
    this.invulnerabilityTimer = 0;
  }
}
