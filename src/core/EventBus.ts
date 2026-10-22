type EventCallback = (...args: any[]) => void;

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventCallback>> = new Map();

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: EventCallback): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  public emit(event: string, ...args: any[]): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const callback of set) {
        try {
          callback(...args);
        } catch (err) {
          console.error(`Error in event handler for "${event}":`, err);
        }
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const EVENTS = {
  GAME_START: 'GAME_START',
  GAME_PAUSE: 'GAME_PAUSE',
  GAME_RESUME: 'GAME_RESUME',
  GAME_OVER: 'GAME_OVER',
  GAME_RESTART: 'GAME_RESTART',
  
  LANE_CHANGE: 'LANE_CHANGE',
  JUMP: 'JUMP',
  LAND: 'LAND',
  SLIDE: 'SLIDE',
  FAST_DROP: 'FAST_DROP',
  STUMBLE: 'STUMBLE',
  CRASH: 'CRASH',
  NEAR_MISS: 'NEAR_MISS',
  TRAIN_HORN: 'TRAIN_HORN',
  CLEAN_STREAK: 'CLEAN_STREAK',
  PRECISION_ACTION: 'PRECISION_ACTION',

  COIN_COLLECTED: 'COIN_COLLECTED',
  POWERUP_COLLECTED: 'POWERUP_COLLECTED',
  POWERUP_EXPIRED: 'POWERUP_EXPIRED',
  HOVERBOARD_ACTIVATED: 'HOVERBOARD_ACTIVATED',
  HOVERBOARD_BROKEN: 'HOVERBOARD_BROKEN',

  SCORE_UPDATED: 'SCORE_UPDATED',
  DISTANCE_UPDATED: 'DISTANCE_UPDATED',
  SPEED_UPDATED: 'SPEED_UPDATED'
} as const;
