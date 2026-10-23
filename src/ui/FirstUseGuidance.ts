import { EventBus, EVENTS } from '../core/EventBus';
import { getPowerupIconSvg } from './IconCatalog';

export interface PowerupGuidanceInfo {
  title: string;
  shortDesc: string;
}

export const FIRST_USE_INFO: Record<string, PowerupGuidanceInfo> = {
  MAGNET: {
    title: 'COIN MAGNET',
    shortDesc: 'Pulls nearby coins toward you across all lanes'
  },
  JETPACK: {
    title: 'ROCKET JETPACK',
    shortDesc: 'Fly safely above trains and collect golden sky trails'
  },
  SNEAKERS: {
    title: 'SUPER SNEAKERS',
    shortDesc: 'Jump significantly higher to leap over barriers and trains'
  },
  MULTIPLIER: {
    title: '2X MULTIPLIER',
    shortDesc: 'Doubles all score accumulation while active'
  },
  SHIELD: {
    title: 'PROTECTIVE SHIELD',
    shortDesc: 'Absorbs one obstacle impact without crashing'
  },
  HOVERBOARD: {
    title: 'HOVERBOARD',
    shortDesc: 'Surfing speed boost and fatal crash protection'
  },
  KEY: {
    title: 'SAVE ME KEY',
    shortDesc: 'Used after crashing to instantly revive and continue running'
  },
  SEASON_TOKEN: {
    title: 'EVENT TOKEN',
    shortDesc: 'Collect tokens to unlock seasonal pass rewards'
  }
};

const STORAGE_KEY = 'metro_runner_seen_powerups';

export class FirstUseGuidance {
  private static instance: FirstUseGuidance;
  private seenTypes: Set<string> = new Set();
  private eventBus = EventBus.getInstance();

  private constructor() {
    this.loadSeen();
  }

  public static getInstance(): FirstUseGuidance {
    if (!FirstUseGuidance.instance) {
      FirstUseGuidance.instance = new FirstUseGuidance();
    }
    return FirstUseGuidance.instance;
  }

  private loadSeen(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          this.seenTypes = new Set(arr);
        }
      }
    } catch {
      this.seenTypes = new Set();
    }
  }

  private saveSeen(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.seenTypes)));
    } catch {
      // Storage unavailable or full
    }
  }

  public isFirstUse(type: string): boolean {
    const key = (type || '').toUpperCase();
    return !this.seenTypes.has(key);
  }

  public markSeen(type: string): void {
    const key = (type || '').toUpperCase();
    this.seenTypes.add(key);
    this.saveSeen();
  }

  /**
   * Checks if guidance should be shown for this collectible type.
   * If first time, marks as seen and returns the guidance card details.
   */
  public checkAndTriggerGuidance(type: string): { isFirst: boolean; info?: PowerupGuidanceInfo; iconSvg?: string } {
    const key = (type || '').toUpperCase();
    const info = FIRST_USE_INFO[key];
    if (!info) {
      return { isFirst: false };
    }

    if (this.isFirstUse(key)) {
      this.markSeen(key);
      const iconSvg = getPowerupIconSvg(key, 28);
      return {
        isFirst: true,
        info,
        iconSvg
      };
    }

    return { isFirst: false };
  }

  public resetForTesting(): void {
    this.seenTypes.clear();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
