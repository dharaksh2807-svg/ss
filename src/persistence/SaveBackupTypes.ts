import { ProgressionState } from '../progression/ProgressionTypes';
import { SettingsState } from '../settings/SettingsManager';
import { UpgradablePowerup } from '../player/UpgradeManager';

export const CURRENT_BACKUP_SCHEMA_VERSION = 1;
export const CURRENT_GAME_VERSION = '1.0.0';
export const APP_ID = 'metro_runner_3d';

/** Maximum allowed backup file size in bytes (512 KB) */
export const MAX_BACKUP_FILE_SIZE = 512 * 1024;

/** Currency bounds for validation */
export const CURRENCY_BOUNDS = {
  MIN_COINS: 0,
  MAX_COINS: 99_999_999,
  MIN_KEYS: 0,
  MAX_KEYS: 9_999,
  MIN_HOVERBOARD_CHARGES: 0,
  MAX_HOVERBOARD_CHARGES: 9_999,
  MIN_UPGRADE_LEVEL: 1,
  MAX_UPGRADE_LEVEL: 5
};

export const STORAGE_BACKUP_KEYS = {
  LAST_BACKUP: 'metro_last_backup_timestamp',
  ROLLBACK_SNAPSHOT: 'metro_save_rollback_snapshot'
};

export interface BackupMetadata {
  backupVersion: number;
  gameVersion: string;
  timestamp: string; // ISO 8601
  appId: string;
  checksum?: string;
  summary?: {
    coins: number;
    keys: number;
    charactersCount: number;
    bestScore: number;
  };
}

export interface BackupData {
  progression: ProgressionState;
  wallet: {
    coins: number;
  };
  upgrades: Record<UpgradablePowerup | string, number>;
  settings?: SettingsState;
  environmentPreference?: string;
  dailyChallengeRecords?: Record<string, any>;
  dailyRewardState?: {
    currentDayIndex: number;
    lastClaimDate: string | null;
    totalClaimsCount: number;
  };
  practiceMedals?: Record<string, string>;
  junctionStats?: any;
  secretRouteStats?: any;
}

export interface SaveBackupPackage {
  meta: BackupMetadata;
  data: BackupData;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  package?: SaveBackupPackage;
  isLegacyMigration?: boolean;
}

export interface ImportPreviewSummary {
  timestamp: string;
  gameVersion: string;
  backupVersion: number;
  backupCoins: number;
  currentCoins: number;
  backupKeys: number;
  currentKeys: number;
  backupCharsCount: number;
  currentCharsCount: number;
  backupScore: number;
  currentScore: number;
  upgradesCount: number;
  hasSettings: boolean;
}

export interface RollbackSnapshot {
  timestamp: string;
  rawStorage: Record<string, string | null>;
}
