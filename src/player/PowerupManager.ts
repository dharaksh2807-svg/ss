import { CONSTANTS } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';

export type PowerupType = 'MAGNET' | 'SNEAKERS' | 'MULTIPLIER' | 'HOVERBOARD';

export interface ActivePowerup {
  type: PowerupType;
  duration: number;
  remaining: number;
}

export class PowerupManager {
  private activePowerups: Map<PowerupType, ActivePowerup> = new Map();
  private eventBus = EventBus.getInstance();

  constructor() {
    this.eventBus.on(EVENTS.POWERUP_COLLECTED, (type: PowerupType) => {
      this.activate(type);
    });
  }

  public activate(type: PowerupType): void {
    const duration =
      type === 'HOVERBOARD' ? CONSTANTS.HOVERBOARD_DURATION : CONSTANTS.POWERUP_DURATION;

    this.activePowerups.set(type, {
      type,
      duration,
      remaining: duration
    });

    if (type === 'HOVERBOARD') {
      this.eventBus.emit(EVENTS.HOVERBOARD_ACTIVATED);
    }
  }

  public update(dt: number): void {
    for (const [type, powerup] of this.activePowerups.entries()) {
      powerup.remaining -= dt;
      if (powerup.remaining <= 0) {
        this.activePowerups.delete(type);
        this.eventBus.emit(EVENTS.POWERUP_EXPIRED, type);
      }
    }
  }

  public isMagnetActive(): boolean {
    return this.activePowerups.has('MAGNET');
  }

  public isSuperSneakersActive(): boolean {
    return this.activePowerups.has('SNEAKERS');
  }

  public is2xMultiplierActive(): boolean {
    return this.activePowerups.has('MULTIPLIER');
  }

  public isHoverboardActive(): boolean {
    return this.activePowerups.has('HOVERBOARD');
  }

  /**
   * Consumes hoverboard protection on collision.
   * Returns true if saved by hoverboard, false if fatal crash.
   */
  public breakHoverboard(): boolean {
    if (this.isHoverboardActive()) {
      this.activePowerups.delete('HOVERBOARD');
      this.eventBus.emit(EVENTS.HOVERBOARD_BROKEN);
      return true;
    }
    return false;
  }

  public getActivePowerups(): ActivePowerup[] {
    return Array.from(this.activePowerups.values());
  }

  public reset(): void {
    this.activePowerups.clear();
  }
}
