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
  
  // Standardized Gameplay Events
  RUN_STARTED: 'RUN_STARTED',
  RUN_FINISHED: 'RUN_FINISHED',
  DISTANCE_TRAVELED: 'DISTANCE_TRAVELED',
  COIN_COLLECTED: 'COIN_COLLECTED',
  POWERUP_COLLECTED: 'POWERUP_COLLECTED',
  POWERUP_ACTIVATED: 'POWERUP_ACTIVATED',
  POWERUP_EXPIRED: 'POWERUP_EXPIRED',
  OBSTACLE_DODGED: 'OBSTACLE_DODGED',
  JUMP_COMPLETED: 'JUMP_COMPLETED',
  SLIDE_COMPLETED: 'SLIDE_COMPLETED',
  NEAR_MISS: 'NEAR_MISS',
  BOARD_ACTIVATED: 'BOARD_ACTIVATED',
  SCORE_UPDATED: 'SCORE_UPDATED',
  DISTANCE_UPDATED: 'DISTANCE_UPDATED',
  SPEED_UPDATED: 'SPEED_UPDATED',

  // Movement & Physical Feedback
  LANE_CHANGE: 'LANE_CHANGE',
  JUMP: 'JUMP',
  LAND: 'LAND',
  SLIDE: 'SLIDE',
  FAST_DROP: 'FAST_DROP',
  STUMBLE: 'STUMBLE',
  CRASH: 'CRASH',
  TRAIN_HORN: 'TRAIN_HORN',
  CLEAN_STREAK: 'CLEAN_STREAK',
  PRECISION_ACTION: 'PRECISION_ACTION',
  RAMP_ONBOARDING_CUE: 'RAMP_ONBOARDING_CUE',

  // Powerups & Hoverboards
  HOVERBOARD_ACTIVATED: 'HOVERBOARD_ACTIVATED',
  HOVERBOARD_BROKEN: 'HOVERBOARD_BROKEN',
  JETPACK_TAKEOFF: 'JETPACK_TAKEOFF',
  JETPACK_CRUISE: 'JETPACK_CRUISE',
  JETPACK_DESCENT: 'JETPACK_DESCENT',
  JETPACK_LANDED: 'JETPACK_LANDED',

  // Opening Cinematic & Chaser Feedback
  INTRO_STARTED: 'INTRO_STARTED',
  INTRO_FINISHED: 'INTRO_FINISHED',
  CHASER_WHISTLE: 'CHASER_WHISTLE',
  CHASER_STUMBLE_REACTION: 'CHASER_STUMBLE_REACTION',

  // Practice Mode & Drills
  PRACTICE_STARTED: 'PRACTICE_STARTED',
  PRACTICE_COMPLETED: 'PRACTICE_COMPLETED',
  PRACTICE_FAILED: 'PRACTICE_FAILED',
  PRACTICE_RETRY: 'PRACTICE_RETRY',

  // Progression & Seasonal
  SEASON_TOKEN_COLLECTED: 'SEASON_TOKEN_COLLECTED',
  MISSION_COMPLETED: 'MISSION_COMPLETED',
  DAILY_COMPLETED: 'DAILY_COMPLETED',
  ACHIEVEMENT_UNLOCKED: 'ACHIEVEMENT_UNLOCKED',
  MODE_OBJECTIVE_REACHED: 'MODE_OBJECTIVE_REACHED'
} as const;

