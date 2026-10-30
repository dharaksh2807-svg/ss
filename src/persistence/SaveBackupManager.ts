import { ProgressionManager } from '../progression/ProgressionManager';
import { UpgradeManager, UpgradablePowerup } from '../player/UpgradeManager';
import { SettingsManager, SettingsState } from '../settings/SettingsManager';
import { EnvironmentManager, EnvironmentSelection } from '../environment/EnvironmentConfig';
import { DailyChallengeManager } from '../core/DailyChallengeManager';
import { DailyRewardManager } from '../progression/DailyRewardManager';
import { PracticeController } from '../practice/PracticeController';
import { EventBus } from '../core/EventBus';
import {
  CURRENT_BACKUP_SCHEMA_VERSION,
  CURRENT_GAME_VERSION,
  APP_ID,
  MAX_BACKUP_FILE_SIZE,
  CURRENCY_BOUNDS,
  STORAGE_BACKUP_KEYS,
  SaveBackupPackage,
  BackupMetadata,
  BackupData,
  ValidationResult,
  ImportPreviewSummary,
  RollbackSnapshot
} from './SaveBackupTypes';
import { ProgressionState, GameMode } from '../progression/ProgressionTypes';

const KNOWN_CHARACTERS = new Set([
  'char_jax',
  'char_luna',
  'char_cruz',
  'char_nova',
  'char_modi',
  'char_rahul_gandhi',
  'rahul_gandhi'
]);

const KNOWN_BOARDS = new Set([
  'board_urban_glide',
  'board_pulse_rider',
  'board_aero_drift',
  'board_street_phantom'
]);

const KNOWN_GAME_MODES = new Set<GameMode>([
  'BEGINNER',
  'EASY',
  'HARD',
  'NORMAL',
  'TIME_TRIAL',
  'COIN_RUSH',
  'SURVIVAL',
  'PRACTICE',
  'ARENA',
  'DAILY_CHALLENGE'
]);

const KNOWN_UPGRADES: UpgradablePowerup[] = [
  'MAGNET',
  'JETPACK',
  'SNEAKERS',
  'MULTIPLIER',
  'SHIELD'
];

/**
 * Fast, deterministic FNV-1a 32-bit checksum for accidental corruption and truncation detection.
 * Note: Integrity checksum detects accidental file truncation or transmission corruption.
 * It does not provide cryptographic anti-cheat security (client-side saves are local).
 */
export function calculateChecksum(dataString: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < dataString.length; i++) {
    hash ^= dataString.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Strips script tags, HTML tags, and dangerous executable tokens from strings
 */
function sanitizeString(str: any): string {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
}

export class SaveBackupManager {
  private static instance: SaveBackupManager | null = null;
  private eventBus = EventBus.getInstance();
  private lastRollbackSnapshot: RollbackSnapshot | null = null;

  private constructor() {}

  public static getInstance(): SaveBackupManager {
    if (!SaveBackupManager.instance) {
      SaveBackupManager.instance = new SaveBackupManager();
    }
    return SaveBackupManager.instance;
  }

  // =========================================================================
  // EXPORT SAVE (Requirement C)
  // =========================================================================

  /**
   * Generates a consistent, versioned, validated snapshot of current saved player data.
   */
  public exportSave(): {
    jsonString: string;
    filename: string;
    blob: Blob;
    package: SaveBackupPackage;
  } {
    const progressionMgr = ProgressionManager.getInstance();
    const upgradeMgr = UpgradeManager.getInstance();
    const settingsMgr = SettingsManager.getInstance();
    const envMgr = EnvironmentManager.getInstance();
    const challengeMgr = DailyChallengeManager.getInstance();
    const rewardMgr = DailyRewardManager.getInstance();

    const progressionState = JSON.parse(JSON.stringify(progressionMgr.getState()));
    const coins = upgradeMgr.getCoins();
    const upgrades = upgradeMgr.getAllLevels();
    const settings = JSON.parse(JSON.stringify(settingsMgr.getState()));
    const envPref = envMgr.getSelectionPreference();
    const challengeRecords = challengeMgr.getAllRecords();
    const rewardState = rewardMgr.getState();
    const practiceMedals = PracticeController.getStoredMedals();

    let junctionStats: any = null;
    let secretRouteStats: any = null;
    try {
      if (typeof localStorage !== 'undefined') {
        const jRaw = localStorage.getItem('metro_railway_junctions_v1');
        if (jRaw) junctionStats = JSON.parse(jRaw);
        const sRaw = localStorage.getItem('metro_secret_routes_v1');
        if (sRaw) secretRouteStats = JSON.parse(sRaw);
      }
    } catch {
      // Safe fallback
    }

    const backupData: BackupData = {
      progression: progressionState,
      wallet: { coins },
      upgrades,
      settings,
      environmentPreference: envPref,
      dailyChallengeRecords: challengeRecords,
      dailyRewardState: rewardState,
      practiceMedals,
      junctionStats,
      secretRouteStats
    };

    const dataPayloadString = JSON.stringify(backupData);
    const checksum = calculateChecksum(dataPayloadString);
    const timestamp = new Date().toISOString();

    const meta: BackupMetadata = {
      backupVersion: CURRENT_BACKUP_SCHEMA_VERSION,
      gameVersion: CURRENT_GAME_VERSION,
      timestamp,
      appId: APP_ID,
      checksum,
      summary: {
        coins,
        keys: progressionState.keys ?? 3,
        charactersCount: progressionState.unlockedCharacters?.length || 1,
        bestScore: progressionState.lifetimeStats?.bestScore || 0
      }
    };

    const backupPackage: SaveBackupPackage = {
      meta,
      data: backupData
    };

    const jsonString = JSON.stringify(backupPackage, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Format clear filename: metro-runner-backup-YYYY-MM-DD-HHmm.json
    const dateStr = timestamp.slice(0, 10);
    const timeStr = timestamp.slice(11, 16).replace(':', '');
    const filename = `metro-runner-backup-${dateStr}-${timeStr}.json`;

    // Record last backup timestamp
    this.recordLastBackup(timestamp);

    return {
      jsonString,
      filename,
      blob,
      package: backupPackage
    };
  }

  /**
   * Triggers a local browser download without login, external services, or backend upload.
   */
  public downloadBackupFile(): { filename: string; timestamp: string } {
    const { blob, filename, package: pkg } = this.exportSave();

    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    return {
      filename,
      timestamp: pkg.meta.timestamp
    };
  }

  public recordLastBackup(isoTimestamp: string): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_BACKUP_KEYS.LAST_BACKUP, isoTimestamp);
      } catch {
        // Safe ignore
      }
    }
  }

  public getLastBackupInfo(): { timestamp: string | null; formatted: string } {
    if (typeof localStorage === 'undefined') {
      return { timestamp: null, formatted: 'Never exported' };
    }
    try {
      const raw = localStorage.getItem(STORAGE_BACKUP_KEYS.LAST_BACKUP);
      if (!raw) return { timestamp: null, formatted: 'Never exported' };
      const d = new Date(raw);
      if (isNaN(d.getTime())) return { timestamp: null, formatted: 'Never exported' };
      return {
        timestamp: raw,
        formatted: d.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    } catch {
      return { timestamp: null, formatted: 'Never exported' };
    }
  }

  // =========================================================================
  // PARSING & VALIDATION (Requirement D & F)
  // =========================================================================

  /**
   * Validates raw JSON string, checks file size, schema version, bounds, and inventory integrity.
   */
  public parseAndValidateSave(
    content: string,
    filename?: string,
    fileSizeBytes?: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. File Size Check
    if (fileSizeBytes !== undefined && fileSizeBytes > MAX_BACKUP_FILE_SIZE) {
      errors.push(`File exceeds maximum allowed size of 512 KB (${(fileSizeBytes / 1024).toFixed(1)} KB).`);
      return { valid: false, errors, warnings };
    }
    if (content.length > MAX_BACKUP_FILE_SIZE * 2) {
      errors.push(`Content exceeds maximum allowed size of 512 KB.`);
      return { valid: false, errors, warnings };
    }

    // 2. Extension check
    if (filename && !filename.toLowerCase().endsWith('.json')) {
      warnings.push(`File does not have a .json extension; verifying JSON contents.`);
    }

    // 3. JSON Syntax Check
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (e: any) {
      errors.push(`Invalid JSON format: ${e.message || 'Syntax error'}.`);
      return { valid: false, errors, warnings };
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      errors.push(`Save backup must be a valid JSON object.`);
      return { valid: false, errors, warnings };
    }

    let isLegacyMigration = false;
    let pkg: SaveBackupPackage;

    // 4. Schema Structure & Version Check
    if (parsed.meta && parsed.data) {
      const backupVer = parsed.meta.backupVersion;
      if (typeof backupVer !== 'number') {
        errors.push(`Missing or invalid backupVersion in save metadata.`);
        return { valid: false, errors, warnings };
      }

      // Check future incompatible version
      if (backupVer > CURRENT_BACKUP_SCHEMA_VERSION) {
        errors.push(
          `Unsupported future save version (v${backupVer}). This version of Metro Runner only supports version ${CURRENT_BACKUP_SCHEMA_VERSION}. Please update the game.`
        );
        return { valid: false, errors, warnings };
      }

      // Checksum validation for accidental corruption
      if (parsed.meta.checksum) {
        const computedChecksum = calculateChecksum(JSON.stringify(parsed.data));
        if (computedChecksum !== parsed.meta.checksum) {
          warnings.push(
            `Data integrity checksum mismatch. The file may have been modified or truncated.`
          );
        }
      }

      pkg = parsed as SaveBackupPackage;
    } else if (parsed.lifetimeStats || parsed.unlockedCharacters) {
      // Legacy unboxed progression JSON migration (Requirement F)
      isLegacyMigration = true;
      warnings.push(`Detected legacy v0/v1 unboxed progression format. Migrating into standard backup package.`);
      pkg = {
        meta: {
          backupVersion: CURRENT_BACKUP_SCHEMA_VERSION,
          gameVersion: '0.9.0-legacy',
          timestamp: new Date().toISOString(),
          appId: APP_ID
        },
        data: {
          progression: parsed,
          wallet: { coins: parsed.lifetimeStats?.totalCoins || 0 },
          upgrades: {
            MAGNET: 1,
            JETPACK: 1,
            SNEAKERS: 1,
            MULTIPLIER: 1,
            SHIELD: 1
          }
        }
      };
    } else {
      errors.push(`Unrecognized save format: missing required metadata and progression data.`);
      return { valid: false, errors, warnings };
    }

    // 5. Data Validation & Boundary Verification
    const data = pkg.data;
    if (!data.progression || typeof data.progression !== 'object') {
      errors.push(`Missing progression data in backup package.`);
      return { valid: false, errors, warnings };
    }

    // Currencies validation: Coins
    let coins = typeof data.wallet?.coins === 'number' ? data.wallet.coins : data.progression.lifetimeStats?.totalCoins;
    if (typeof coins !== 'number' || isNaN(coins) || coins < CURRENCY_BOUNDS.MIN_COINS) {
      errors.push(`Coins currency value is invalid or negative.`);
    } else if (coins > CURRENCY_BOUNDS.MAX_COINS) {
      warnings.push(`Coins count (${coins}) exceeds standard limit; clamping to ${CURRENCY_BOUNDS.MAX_COINS}.`);
      coins = CURRENCY_BOUNDS.MAX_COINS;
      if (data.wallet) data.wallet.coins = coins;
    }

    // Currencies validation: Keys
    let keys = data.progression.keys ?? 3;
    if (typeof keys !== 'number' || isNaN(keys) || keys < CURRENCY_BOUNDS.MIN_KEYS) {
      warnings.push(`Keys value is invalid or negative; resetting to 3.`);
      data.progression.keys = 3;
    } else if (keys > CURRENCY_BOUNDS.MAX_KEYS) {
      warnings.push(`Keys count (${keys}) exceeds limit; clamping to ${CURRENCY_BOUNDS.MAX_KEYS}.`);
      data.progression.keys = CURRENCY_BOUNDS.MAX_KEYS;
    }

    // Currencies validation: Hoverboard charges
    let charges = data.progression.hoverboardCharges ?? 5;
    if (typeof charges !== 'number' || isNaN(charges) || charges < CURRENCY_BOUNDS.MIN_HOVERBOARD_CHARGES) {
      data.progression.hoverboardCharges = 5;
    } else if (charges > CURRENCY_BOUNDS.MAX_HOVERBOARD_CHARGES) {
      data.progression.hoverboardCharges = CURRENCY_BOUNDS.MAX_HOVERBOARD_CHARGES;
    }

    // Upgrades validation
    if (data.upgrades && typeof data.upgrades === 'object') {
      for (const p of KNOWN_UPGRADES) {
        if (data.upgrades[p] !== undefined) {
          const lvl = Number(data.upgrades[p]);
          if (isNaN(lvl) || lvl < CURRENCY_BOUNDS.MIN_UPGRADE_LEVEL || lvl > CURRENCY_BOUNDS.MAX_UPGRADE_LEVEL) {
            warnings.push(`Upgrade level for ${p} (${data.upgrades[p]}) was outside 1-5; clamped.`);
            data.upgrades[p] = Math.max(1, Math.min(5, Math.floor(lvl) || 1));
          }
        }
      }
    }

    // Characters validation
    if (!Array.isArray(data.progression.unlockedCharacters)) {
      data.progression.unlockedCharacters = ['char_jax'];
    } else {
      // Filter out any invalid characters, but preserve recognized ones
      const validChars = data.progression.unlockedCharacters
        .map(sanitizeString)
        .filter(c => KNOWN_CHARACTERS.has(c));
      
      // Jax must always be unlocked
      if (!validChars.includes('char_jax')) {
        validChars.unshift('char_jax');
      }
      data.progression.unlockedCharacters = Array.from(new Set(validChars));
    }

    if (!data.progression.selectedCharacter || !KNOWN_CHARACTERS.has(data.progression.selectedCharacter)) {
      data.progression.selectedCharacter = 'char_jax';
    }

    // Boards validation
    if (!Array.isArray(data.progression.unlockedBoards)) {
      data.progression.unlockedBoards = ['board_urban_glide'];
    } else {
      const validBoards = data.progression.unlockedBoards
        .map(sanitizeString)
        .filter(b => KNOWN_BOARDS.has(b));
      if (!validBoards.includes('board_urban_glide')) {
        validBoards.unshift('board_urban_glide');
      }
      data.progression.unlockedBoards = Array.from(new Set(validBoards));
    }

    if (!data.progression.selectedBoard || !KNOWN_BOARDS.has(data.progression.selectedBoard)) {
      data.progression.selectedBoard = 'board_urban_glide';
    }

    // Game Mode validation
    if (data.progression.lastSelectedMode && !KNOWN_GAME_MODES.has(data.progression.lastSelectedMode)) {
      data.progression.lastSelectedMode = 'BEGINNER';
    }

    // Sanitization: clean up dailyDate and text fields
    if (data.progression.dailyDate) {
      data.progression.dailyDate = sanitizeString(data.progression.dailyDate);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      package: pkg,
      isLegacyMigration
    };
  }

  // =========================================================================
  // IMPORT PREVIEW (Requirement E & G)
  // =========================================================================

  public generatePreview(pkg: SaveBackupPackage): ImportPreviewSummary {
    const progressionMgr = ProgressionManager.getInstance();
    const upgradeMgr = UpgradeManager.getInstance();

    const currentState = progressionMgr.getState();
    const currentCoins = upgradeMgr.getCoins();
    const currentKeys = progressionMgr.getKeys();
    const currentCharsCount = currentState.unlockedCharacters?.length || 1;
    const currentScore = currentState.lifetimeStats?.bestScore || 0;

    const backupCoins = typeof pkg.data.wallet?.coins === 'number'
      ? pkg.data.wallet.coins
      : pkg.data.progression.lifetimeStats?.totalCoins || 0;
    const backupKeys = pkg.data.progression.keys ?? 3;
    const backupCharsCount = pkg.data.progression.unlockedCharacters?.length || 1;
    const backupScore = pkg.data.progression.lifetimeStats?.bestScore || 0;

    let upgradesCount = 0;
    if (pkg.data.upgrades) {
      upgradesCount = Object.keys(pkg.data.upgrades).length;
    }

    return {
      timestamp: pkg.meta.timestamp,
      gameVersion: pkg.meta.gameVersion || '1.0.0',
      backupVersion: pkg.meta.backupVersion || 1,
      backupCoins,
      currentCoins,
      backupKeys,
      currentKeys,
      backupCharsCount,
      currentCharsCount,
      backupScore,
      currentScore,
      upgradesCount,
      hasSettings: !!pkg.data.settings
    };
  }

  // =========================================================================
  // SAFE RESTORATION & ROLLBACK (Requirement E)
  // =========================================================================

  /**
   * Creates a complete rollback snapshot of all current local storage keys.
   */
  public createRollbackSnapshot(): RollbackSnapshot {
    const snapshot: Record<string, string | null> = {};
    const keysToSave = [
      'metro_progression_v1',
      'metro_runner_wallet',
      'metro_runner_upgrades',
      'metro_settings_v2',
      'metro_runner_environment_preference',
      'metro_daily_challenge_records_v1',
      'metro_daily_reward_state',
      'metro_practice_medals',
      'metro_railway_junctions_v1',
      'metro_secret_routes_v1'
    ];

    if (typeof localStorage !== 'undefined') {
      for (const k of keysToSave) {
        try {
          snapshot[k] = localStorage.getItem(k);
        } catch {
          snapshot[k] = null;
        }
      }
      try {
        localStorage.setItem(
          STORAGE_BACKUP_KEYS.ROLLBACK_SNAPSHOT,
          JSON.stringify({ timestamp: new Date().toISOString(), rawStorage: snapshot })
        );
      } catch {
        // Safe fallback
      }
    }

    const rollback: RollbackSnapshot = {
      timestamp: new Date().toISOString(),
      rawStorage: snapshot
    };
    this.lastRollbackSnapshot = rollback;
    return rollback;
  }

  /**
   * Restores state from snapshot if an import step fails or is rejected.
   */
  public rollback(snapshot?: RollbackSnapshot | null): boolean {
    const target = snapshot || this.lastRollbackSnapshot;
    if (!target && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_BACKUP_KEYS.ROLLBACK_SNAPSHOT);
        if (stored) {
          const parsed = JSON.parse(stored);
          return this.rollback(parsed);
        }
      } catch {
        return false;
      }
    }
    if (!target || !target.rawStorage) return false;

    if (typeof localStorage !== 'undefined') {
      for (const [k, val] of Object.entries(target.rawStorage)) {
        try {
          if (val === null) {
            localStorage.removeItem(k);
          } else {
            localStorage.setItem(k, val);
          }
        } catch {
          // Continue
        }
      }
    }

    // Reload all authoritative managers
    try {
      ProgressionManager.getInstance().load();
      UpgradeManager.getInstance().load();
      SettingsManager.getInstance();
      DailyRewardManager.getInstance();
      EnvironmentManager.getInstance().loadPreference();
    } catch {
      // Safe fallback
    }

    return true;
  }

  /**
   * Applies the validated save backup package atomically to all managers.
   */
  public restoreSave(pkg: SaveBackupPackage): {
    success: boolean;
    error?: string;
    rollbackCreated: boolean;
  } {
    // Step 1: Create rollback snapshot
    const rollback = this.createRollbackSnapshot();

    try {
      const data = pkg.data;

      // 1. Progression State
      if (data.progression) {
        ProgressionManager.getInstance().importState(data.progression);
      }

      // 2. Wallet & Upgrades
      const coins = typeof data.wallet?.coins === 'number'
        ? data.wallet.coins
        : data.progression?.lifetimeStats?.totalCoins || 0;
      UpgradeManager.getInstance().importData(coins, data.upgrades as any);

      // 3. Settings
      if (data.settings) {
        SettingsManager.getInstance().importState(data.settings);
      }

      // 4. Environment
      if (data.environmentPreference) {
        EnvironmentManager.getInstance().savePreference(data.environmentPreference as EnvironmentSelection);
      }

      // 5. Daily Challenges
      if (data.dailyChallengeRecords) {
        DailyChallengeManager.getInstance().importRecords(data.dailyChallengeRecords);
      }

      // 6. Daily Rewards
      if (data.dailyRewardState) {
        DailyRewardManager.getInstance().importState(data.dailyRewardState as any);
      }

      // 7. Practice Medals
      if (data.practiceMedals) {
        PracticeController.setStoredMedals(data.practiceMedals as any);
      }

      // 8. Junctions & Secret routes
      if (typeof localStorage !== 'undefined') {
        if (data.junctionStats) {
          localStorage.setItem('metro_railway_junctions_v1', JSON.stringify(data.junctionStats));
        }
        if (data.secretRouteStats) {
          localStorage.setItem('metro_secret_routes_v1', JSON.stringify(data.secretRouteStats));
        }
      }

      // Step 9: Verification check
      const verifiedCoins = UpgradeManager.getInstance().getCoins();
      const verifiedState = ProgressionManager.getInstance().getState();

      if (verifiedCoins !== coins) {
        throw new Error(`Coins verification mismatch after restoration: expected ${coins}, got ${verifiedCoins}.`);
      }
      if (!verifiedState.unlockedCharacters || !verifiedState.unlockedCharacters.includes('char_jax')) {
        throw new Error(`Crucial character verification failed: char_jax must always be unlocked.`);
      }
      if (data.progression.unlockedCharacters && verifiedState.unlockedCharacters.length !== data.progression.unlockedCharacters.length) {
        throw new Error(`Character unlocks mismatch after restoration.`);
      }

      // Notify UI
      this.eventBus.emit('PROGRESSION_RESTORED', verifiedState);
      this.eventBus.emit('WALLET_UPDATED', verifiedCoins);
      this.eventBus.emit('KEYS_UPDATED', verifiedState.keys ?? 3);

      return {
        success: true,
        rollbackCreated: true
      };
    } catch (e: any) {
      console.error('Failed to restore save backup, rolling back:', e);
      this.rollback(rollback);
      return {
        success: false,
        error: e.message || 'Unknown restoration error',
        rollbackCreated: true
      };
    }
  }
}
