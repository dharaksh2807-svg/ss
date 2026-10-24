import { CONSTANTS } from './Constants';
import { GameMode } from '../progression/ProgressionTypes';

export interface SpeedProfileConfig {
  initialSpeed: number;
  maxSpeed: number;
  earlyRampDistance: number;
  earlySpeedTarget: number;
  midRampDistance: number;
  midSpeedTarget: number;
  asymptoticDistance: number;
}

/**
 * SpeedController:
 * High-precision, nonlinear, frame-rate independent speed progression system.
 * Delivers noticeable early acceleration, smooth mid-game ramp, and gradual
 * asymptotic approach to top speed without discontinuities or unlimited acceleration.
 */
export class SpeedController {
  private mode: GameMode = 'NORMAL';
  private profile: SpeedProfileConfig;
  private currentSpeed: number;
  private targetSpeed: number;
  private customInitialSpeed: number | null = null;
  private customMaxSpeed: number | null = null;

  constructor(initialMode: GameMode = 'NORMAL') {
    this.mode = initialMode;
    this.profile = this.getProfileForMode(initialMode);
    this.currentSpeed = this.profile.initialSpeed;
    this.targetSpeed = this.profile.initialSpeed;
  }

  private getProfileForMode(mode: string): SpeedProfileConfig {
    const profiles = (CONSTANTS as any).SPEED_PROFILES;
    const normalized = (mode === 'NORMAL' ? 'BEGINNER' : mode).toUpperCase();
    if (profiles && profiles[normalized]) {
      return { ...profiles[normalized] };
    }
    if (profiles && profiles[mode]) {
      return { ...profiles[mode] };
    }
    return { ...profiles.BEGINNER };
  }

  public setMode(mode: GameMode): void {
    this.mode = mode;
    this.profile = this.getProfileForMode(mode);
    if (this.customInitialSpeed !== null) {
      this.profile.initialSpeed = Math.max(this.profile.initialSpeed, this.customInitialSpeed);
    }
    if (this.customMaxSpeed !== null) {
      this.profile.maxSpeed = this.customMaxSpeed;
    }
    this.currentSpeed = this.profile.initialSpeed;
    this.targetSpeed = this.profile.initialSpeed;
  }

  public getMode(): GameMode {
    return this.mode;
  }

  public reset(customInitialSpeed?: number, customMaxSpeed?: number): void {
    this.profile = this.getProfileForMode(this.mode);
    if (customInitialSpeed !== undefined) {
      this.customInitialSpeed = customInitialSpeed;
      this.profile.initialSpeed = customInitialSpeed;
    } else {
      this.customInitialSpeed = null;
    }

    if (customMaxSpeed !== undefined) {
      this.customMaxSpeed = customMaxSpeed;
      this.profile.maxSpeed = customMaxSpeed;
    } else {
      this.customMaxSpeed = null;
    }

    this.currentSpeed = this.profile.initialSpeed;
    this.targetSpeed = this.profile.initialSpeed;
  }

  /**
   * Sets current speed explicitly (e.g. for test environments or mode overrides)
   * Ensures that mode-specific initial speeds or test speeds are honored.
   */
  public setSpeed(speed: number): void {
    this.currentSpeed = speed;
    this.targetSpeed = speed;
    if (this.customInitialSpeed === null || speed > this.profile.initialSpeed) {
      this.customInitialSpeed = speed;
      this.profile.initialSpeed = Math.min(speed, this.profile.maxSpeed);
    }
  }

  public getSpeed(): number {
    return this.currentSpeed;
  }

  public getTargetSpeed(): number {
    return this.targetSpeed;
  }

  public getMaxSpeed(): number {
    return this.profile.maxSpeed;
  }

  public getInitialSpeed(): number {
    return this.profile.initialSpeed;
  }

  /**
   * Evaluates the continuous, piecewise-smooth target speed curve at a given distance.
   */
  public evaluateCurve(distanceTraveled: number): number {
    const p = this.profile;
    const d = Math.max(0, distanceTraveled);

    if (d <= 0) {
      return p.initialSpeed;
    }

    // 1. Stage 1: Noticeable Early Acceleration (0m to earlyRampDistance, ~0 - 14s)
    if (d <= p.earlyRampDistance) {
      const t = d / p.earlyRampDistance;
      // Concave easing: t * (2 - t) delivers punchy early speed gain that smoothly decelerates
      const eased = t * (2.0 - t);
      const earlyTarget = Math.max(p.initialSpeed, p.earlySpeedTarget);
      return p.initialSpeed + (earlyTarget - p.initialSpeed) * eased;
    }

    // 2. Stage 2: Steady Mid-Game Ramp (earlyRampDistance to midRampDistance, ~14s - 45s)
    if (d <= p.midRampDistance) {
      const t = (d - p.earlyRampDistance) / (p.midRampDistance - p.earlyRampDistance);
      const eased = t * (2.0 - t);
      const earlyTarget = Math.max(p.initialSpeed, p.earlySpeedTarget);
      const midTarget = Math.max(earlyTarget, p.midSpeedTarget);
      return earlyTarget + (midTarget - earlyTarget) * eased;
    }

    // 3. Stage 3: Smooth Asymptotic Top-Speed Taper (midRampDistance to asymptoticDistance+)
    const midTarget = Math.max(p.initialSpeed, p.earlySpeedTarget, p.midSpeedTarget);
    if (midTarget >= p.maxSpeed) {
      return p.maxSpeed;
    }

    const delta = p.maxSpeed - midTarget;
    const span = Math.max(200.0, p.asymptoticDistance - p.midRampDistance);
    const k = 2.5 / span;
    const progress = d - p.midRampDistance;
    const asymptotic = p.maxSpeed - delta * Math.exp(-k * progress);
    if (p.maxSpeed - asymptotic < 0.02) {
      return p.maxSpeed;
    }

    return Math.min(p.maxSpeed, Math.max(p.initialSpeed, asymptotic));
  }

  /**
   * Frame-rate independent update step.
   * Smoothly interpolates currentSpeed toward targetSpeed.
   */
  public update(dt: number, distanceTraveled: number): number {
    this.targetSpeed = this.evaluateCurve(distanceTraveled);

    // Frame-rate independent exponential smoothing factor (e.g. lerp factor 4.0/s)
    const factor = 1.0 - Math.exp(-((CONSTANTS as any).SPEED_LERP || 4.0) * dt);
    this.currentSpeed += (this.targetSpeed - this.currentSpeed) * factor;

    // Strict safety clamp: never exceed configured maximum speed or dip below 0
    this.currentSpeed = Math.min(this.profile.maxSpeed, Math.max(0, this.currentSpeed));
    return this.currentSpeed;
  }
}
