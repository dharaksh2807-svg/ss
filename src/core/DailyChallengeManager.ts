import { EventBus, EVENTS } from './EventBus';
import { UpgradeManager } from '../player/UpgradeManager';

export type CourseChallengeType = 'DISTANCE' | 'COIN' | 'PRECISION' | 'SURVIVAL';
export type CourseDifficulty = 'BEGINNER' | 'EASY' | 'HARD';

export interface DailyCourseChallenge {
  id: string; // e.g. "DC-2026-10-26-V1"
  version: number;
  date: string; // YYYY-MM-DD in UTC
  name: string;
  title: string;
  type: CourseChallengeType;
  difficulty: CourseDifficulty;
  seed: number;
  description: string;
  objectiveText: string;
  rewardCoins: number;
  shareCode: string;
  isImported?: boolean;
}

export interface ChallengeRecord {
  id: string;
  date: string;
  version: number;
  bestScore: number;
  bestDistance: number;
  bestCoins: number;
  bestCombo: number;
  attempts: number;
  rewardClaimed: boolean;
  lastPlayedTimestamp: number;
}

export interface ParseCodeResult {
  success: boolean;
  challenge?: DailyCourseChallenge;
  error?: string;
}

const STORAGE_KEY = 'metro_daily_challenge_records_v1';
const CODE_PREFIX = 'MTR1';

const TYPE_MAP: Record<CourseChallengeType, string> = {
  DISTANCE: 'DST',
  COIN: 'COI',
  PRECISION: 'PRC',
  SURVIVAL: 'SRV'
};

const REV_TYPE_MAP: Record<string, CourseChallengeType> = {
  DST: 'DISTANCE',
  COI: 'COIN',
  PRC: 'PRECISION',
  SRV: 'SURVIVAL'
};

const DIFF_MAP: Record<CourseDifficulty, string> = {
  BEGINNER: 'BGN',
  EASY: 'ESY',
  HARD: 'HRD'
};

const REV_DIFF_MAP: Record<string, CourseDifficulty> = {
  BGN: 'BEGINNER',
  ESY: 'EASY',
  HRD: 'HARD'
};

const CHALLENGE_NAMES: Record<CourseChallengeType, string[]> = {
  DISTANCE: [
    'Neon Horizon Sprint',
    'Metro Transit Dash',
    'Infinity Rails Gauntlet',
    'Cross-District Express',
    'Skyline Velocity Run'
  ],
  COIN: [
    'Vault Breaker Sweep',
    'Golden Corridor Rush',
    'Treasury Catwalk Run',
    'Midas Express Vault',
    'Bullion Highline Sweep'
  ],
  PRECISION: [
    'Razor Edge Precision',
    'Hazard Weaver Gauntlet',
    'Rooftop Acrobatics',
    'Perfect Stride Crucible',
    'Acrobatic Close-Shave'
  ],
  SURVIVAL: [
    'Iron Titan Gauntlet',
    'Relentless Rail Trial',
    'Dense Traffic Gauntlet',
    'Subway Inferno Survival',
    'Midnight Express Gauntlet'
  ]
};

const CHALLENGE_DESCRIPTIONS: Record<CourseChallengeType, string> = {
  DISTANCE: 'Travel as far as humanly possible along today’s synchronized railway course.',
  COIN: 'Vault and bank the highest possible coin yield along the seeded gold line.',
  PRECISION: 'Demonstrate supreme mastery by executing perfect jumps, slides, and style combos.',
  SURVIVAL: 'Stay alive against relentless train encounters with high initial speed and tight timing.'
};

export class DailyChallengeManager {
  private static instance: DailyChallengeManager;
  private eventBus = EventBus.getInstance();
  private records: Record<string, ChallengeRecord> = {};
  private activeChallenge: DailyCourseChallenge | null = null;

  public static getInstance(): DailyChallengeManager {
    if (!DailyChallengeManager.instance) {
      DailyChallengeManager.instance = new DailyChallengeManager();
    }
    return DailyChallengeManager.instance;
  }

  constructor() {
    this.loadRecords();
  }

  // =========================================================================
  // UTC Date & Seed Determinism (Requirements B & C)
  // =========================================================================

  /**
   * Returns current calendar date in UTC (YYYY-MM-DD), ensuring zero local clock offset bias.
   */
  public getTodayUTC(dateObj: Date = new Date()): string {
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Fast, stable FNV-1a 32-bit hash for deterministic seed generation.
   */
  private hashString(str: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0) || 1337;
  }

  /**
   * Generates deterministic DailyCourseChallenge for any UTC date string.
   */
  public generateDailyChallenge(dateStr?: string): DailyCourseChallenge {
    const date = dateStr || this.getTodayUTC();
    const version = 1;
    const seed = this.hashString(`METRO_DAILY_COURSE_V1_${date}`);

    // Deterministic selection based on seed
    const types: CourseChallengeType[] = ['DISTANCE', 'COIN', 'PRECISION', 'SURVIVAL'];
    const type = types[seed % types.length];

    const diffs: CourseDifficulty[] = ['BEGINNER', 'EASY', 'HARD'];
    const difficulty = diffs[(seed >>> 4) % diffs.length];

    const names = CHALLENGE_NAMES[type];
    const name = names[(seed >>> 8) % names.length];

    const id = `DC-${date}-V${version}`;
    const description = CHALLENGE_DESCRIPTIONS[type];

    let objectiveText = '';
    if (type === 'DISTANCE') {
      objectiveText = 'Max Distance • Infinite Track';
    } else if (type === 'COIN') {
      objectiveText = 'Max Coin Yield • Seeded Gold Lines';
    } else if (type === 'PRECISION') {
      objectiveText = 'Max Skill Score • Perfect Dodges & Combos';
    } else {
      objectiveText = 'High Traffic Pacing • Reflex Gauntlet';
    }

    const rewardCoins = 350; // First completion daily reward
    const shareCode = this.encodeChallenge({ type, difficulty, seed, version });

    return {
      id,
      version,
      date,
      name,
      title: name,
      type,
      difficulty,
      seed,
      description,
      objectiveText,
      rewardCoins,
      shareCode,
      isImported: false
    };
  }

  /**
   * Helper to retrieve today's challenge.
   */
  public getTodayChallenge(): DailyCourseChallenge {
    return this.generateDailyChallenge(this.getTodayUTC());
  }

  /**
   * Helper to retrieve today's challenge record.
   */
  public getTodayRecord(): ChallengeRecord {
    return this.getRecord(this.getTodayUTC());
  }

  // =========================================================================
  // Shareable Challenge Codes (Requirement F)
  // =========================================================================

  private computeChecksum(seed: number, typeCode: string, diffCode: string): string {
    const tVal = (typeCode.charCodeAt(0) * 13 + typeCode.charCodeAt(1) * 7 + typeCode.charCodeAt(2)) & 0xff;
    const dVal = (diffCode.charCodeAt(0) * 17 + diffCode.charCodeAt(1) * 11 + diffCode.charCodeAt(2)) & 0xff;
    const sVal = ((seed >>> 24) ^ (seed >>> 16) ^ (seed >>> 8) ^ seed) & 0xff;
    const sum = (tVal ^ dVal ^ sVal ^ 0x5a) & 0xff;
    return sum.toString(16).padStart(2, '0').toUpperCase();
  }

  /**
   * Generates a compact, human-readable shareable code.
   * Format: MTR1-[TYPE]-[DIFF]-[SEEDHEX]-[CHECKSUM]
   * Example: MTR1-DST-HRD-A3B8C1D0-4E
   */
  public encodeChallenge(c: {
    type: CourseChallengeType;
    difficulty: CourseDifficulty;
    seed: number;
    version?: number;
  }): string {
    const typeCode = TYPE_MAP[c.type] || 'DST';
    const diffCode = DIFF_MAP[c.difficulty] || 'BGN';
    const seedHex = (c.seed >>> 0).toString(16).padStart(8, '0').toUpperCase();
    const checksum = this.computeChecksum(c.seed >>> 0, typeCode, diffCode);
    return `${CODE_PREFIX}-${typeCode}-${diffCode}-${seedHex}-${checksum}`;
  }

  /**
   * Safely parses and validates a shareable challenge code.
   * Rejects malformed codes, invalid types, unsupported versions, and checksum errors.
   */
  public parseChallengeCode(rawCode: string): ParseCodeResult {
    if (!rawCode || typeof rawCode !== 'string') {
      return { success: false, error: 'Empty challenge code' };
    }

    const trimmed = rawCode.trim().toUpperCase();
    const parts = trimmed.split('-');

    if (parts.length !== 5) {
      return {
        success: false,
        error: `Malformed code structure: expected 5 hyphen-separated segments, got ${parts.length}`
      };
    }

    const [prefix, typeCode, diffCode, seedHex, checksum] = parts;

    if (prefix !== CODE_PREFIX) {
      return {
        success: false,
        error: `Unsupported version prefix "${prefix}". Only ${CODE_PREFIX} codes are supported.`
      };
    }

    const type = REV_TYPE_MAP[typeCode];
    if (!type) {
      return {
        success: false,
        error: `Invalid challenge type "${typeCode}". Expected DST, COI, PRC, or SRV.`
      };
    }

    const difficulty = REV_DIFF_MAP[diffCode];
    if (!difficulty) {
      return {
        success: false,
        error: `Invalid difficulty mode "${diffCode}". Expected BGN, ESY, or HRD.`
      };
    }

    if (!/^[0-9A-F]{8}$/.test(seedHex)) {
      return {
        success: false,
        error: `Invalid seed hex "${seedHex}". Must be exactly 8 hexadecimal characters.`
      };
    }

    const seed = parseInt(seedHex, 16) >>> 0;
    if (isNaN(seed)) {
      return { success: false, error: 'Could not parse seed integer' };
    }

    const expectedChecksum = this.computeChecksum(seed, typeCode, diffCode);
    if (checksum !== expectedChecksum) {
      return {
        success: false,
        error: `Checksum mismatch: expected ${expectedChecksum}, got ${checksum}. Code may contain a typo.`
      };
    }

    const names = CHALLENGE_NAMES[type];
    const name = `Custom: ${names[(seed >>> 8) % names.length]}`;
    const description = CHALLENGE_DESCRIPTIONS[type];

    const challenge: DailyCourseChallenge = {
      id: `CUSTOM-${seedHex}`,
      version: 1,
      date: 'CUSTOM',
      name,
      title: name,
      type,
      difficulty,
      seed,
      description,
      objectiveText: `Shared Course • ${difficulty} • Seed #${seedHex}`,
      rewardCoins: 0, // Imported challenges do not grant daily coin bonus
      shareCode: trimmed,
      isImported: true
    };

    return { success: true, challenge };
  }

  // =========================================================================
  // Persistence & Records (Requirements E & I)
  // =========================================================================

  private loadRecords(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.records = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load daily challenge records:', e);
      this.records = {};
    }
  }

  private saveRecords(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch (e) {
      console.warn('Failed to save daily challenge records:', e);
    }
  }

  /**
   * Retrieves record for a specific challenge date or ID.
   */
  public getRecord(dateOrId: string): ChallengeRecord {
    if (this.records[dateOrId]) {
      return { ...this.records[dateOrId] };
    }
    return {
      id: dateOrId,
      date: dateOrId,
      version: 1,
      bestScore: 0,
      bestDistance: 0,
      bestCoins: 0,
      bestCombo: 0,
      attempts: 0,
      rewardClaimed: false,
      lastPlayedTimestamp: 0
    };
  }

  /**
   * Sets or clears the active challenge run.
   */
  public setActiveChallenge(challenge: DailyCourseChallenge | null): void {
    this.activeChallenge = challenge;
  }

  public getActiveChallenge(): DailyCourseChallenge | null {
    return this.activeChallenge;
  }

  /**
   * Records run results for the active challenge, manages personal bests,
   * and awards the first-completion coin bonus safely.
   */
  public recordRunResult(
    score: number,
    distance: number,
    coins: number,
    combo: number
  ): {
    isNewRecord: boolean;
    rewardGranted: number;
    record: ChallengeRecord;
  } {
    const challenge = this.activeChallenge || this.getTodayChallenge();
    const key = challenge.isImported ? challenge.id : challenge.date;

    const existing = this.getRecord(key);
    const prevBestScore = existing.bestScore;

    const isNewRecord = score > prevBestScore;
    const newBestScore = Math.max(existing.bestScore, score);
    const newBestDistance = Math.max(existing.bestDistance, distance);
    const newBestCoins = Math.max(existing.bestCoins, coins);
    const newBestCombo = Math.max(existing.bestCombo, combo);
    const attempts = existing.attempts + 1;

    let rewardGranted = 0;
    let rewardClaimed = existing.rewardClaimed;

    // First completion of today's official daily challenge awards coins
    const today = this.getTodayUTC();
    if (!challenge.isImported && challenge.date === today && !rewardClaimed) {
      rewardGranted = challenge.rewardCoins;
      rewardClaimed = true;
      try {
        UpgradeManager.getInstance().addCoins(rewardGranted);
      } catch (err) {
        console.warn('Failed to credit daily challenge coins:', err);
      }
    }

    const updatedRecord: ChallengeRecord = {
      id: challenge.id,
      date: challenge.date,
      version: challenge.version,
      bestScore: newBestScore,
      bestDistance: newBestDistance,
      bestCoins: newBestCoins,
      bestCombo: newBestCombo,
      attempts,
      rewardClaimed,
      lastPlayedTimestamp: Date.now()
    };

    this.records[key] = updatedRecord;
    this.saveRecords();

    this.eventBus.emit(EVENTS.DAILY_CHALLENGE_COMPLETED, {
      challenge,
      record: updatedRecord,
      isNewRecord,
      rewardGranted
    });

    return {
      isNewRecord,
      rewardGranted,
      record: updatedRecord
    };
  }

  /**
   * Resets internal records for unit tests.
   */
  public resetForTesting(): void {
    this.records = {};
    this.activeChallenge = null;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
    }
  }
}
