import { EventBus } from '../src/core/EventBus';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { UpgradeManager } from '../src/player/UpgradeManager';
import { SettingsManager } from '../src/settings/SettingsManager';
import { EnvironmentManager } from '../src/environment/EnvironmentConfig';
import { DailyChallengeManager } from '../src/core/DailyChallengeManager';
import { DailyRewardManager } from '../src/progression/DailyRewardManager';
import { PracticeController } from '../src/practice/PracticeController';
import {
  SaveBackupManager,
  calculateChecksum
} from '../src/persistence/SaveBackupManager';
import {
  CURRENT_BACKUP_SCHEMA_VERSION,
  CURRENT_GAME_VERSION,
  APP_ID,
  MAX_BACKUP_FILE_SIZE,
  CURRENCY_BOUNDS,
  SaveBackupPackage
} from '../src/persistence/SaveBackupTypes';

console.log('🧪 Starting Metro Runner 3D: Task 3 Save Backup, Import, Restore & Safety Test Suite...\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
    passedTests++;
  }
}

// In-Memory localStorage mock for isolated test harness
const storageMock: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => storageMock[k] ?? null,
  setItem: (k: string, v: string) => { storageMock[k] = String(v); },
  removeItem: (k: string) => { delete storageMock[k]; },
  clear: () => {
    for (const key of Object.keys(storageMock)) {
      delete storageMock[key];
    }
  },
  key: (i: number) => Object.keys(storageMock)[i] || null,
  get length() {
    return Object.keys(storageMock).length;
  }
};

const backupMgr = SaveBackupManager.getInstance();
const progressionMgr = ProgressionManager.getInstance();
const upgradeMgr = UpgradeManager.getInstance();
const settingsMgr = SettingsManager.getInstance();
const envMgr = EnvironmentManager.getInstance();

// =========================================================================
// Suite 1: Save Backup Export Contract & Versioned Schema Integrity
// =========================================================================
console.log('--- Suite 1: Export Contract & Schema Integrity ---');
{
  progressionMgr.resetAll();
  upgradeMgr.setCoins(1500);

  const exported = backupMgr.exportSave();
  assert(typeof exported.jsonString === 'string', 'Export returns a serialized JSON string');
  assert(exported.jsonString.length > 50, 'Exported string has valid length');

  const pkg = exported.package;
  assert(pkg.meta !== undefined, 'Package contains meta object');
  assert(pkg.data !== undefined, 'Package contains data object');

  // Verify Metadata
  assert(pkg.meta.backupVersion === CURRENT_BACKUP_SCHEMA_VERSION, `Metadata has backupVersion === ${CURRENT_BACKUP_SCHEMA_VERSION}`);
  assert(pkg.meta.gameVersion === CURRENT_GAME_VERSION, `Metadata has gameVersion === ${CURRENT_GAME_VERSION}`);
  assert(pkg.meta.appId === APP_ID, `Metadata has appId === ${APP_ID}`);
  assert(!isNaN(Date.parse(pkg.meta.timestamp)), 'Metadata timestamp is a valid ISO 8601 string');

  // Verify Checksum
  assert(typeof pkg.meta.checksum === 'string', 'Metadata includes integrity checksum');
  const expectedChecksum = calculateChecksum(JSON.stringify(pkg.data));
  assert(pkg.meta.checksum === expectedChecksum, 'Checksum matches computed FNV-1a hash of data payload');

  // Verify Filename format
  assert(exported.filename.startsWith('metro-runner-backup-'), 'Filename starts with metro-runner-backup-');
  assert(exported.filename.endsWith('.json'), 'Filename ends with .json');

  // Verify Summary
  assert(pkg.meta.summary?.coins === 1500, 'Summary accurately mirrors exported coins (1500)');

  // Verify Last Backup Timestamp persistence
  const lastInfo = backupMgr.getLastBackupInfo();
  assert(lastInfo.timestamp !== null, 'Last backup timestamp was persisted in local storage');
}

// =========================================================================
// Suite 2: Currency & Powerup Upgrade Restorations & Boundary Validation
// =========================================================================
console.log('\n--- Suite 2: Currency & Powerup Upgrade Restoration ---');
{
  // Establish baseline
  upgradeMgr.setCoins(250);
  progressionMgr.getState().keys = 3;

  // Prepare a test backup with custom progress
  const testPkg: SaveBackupPackage = {
    meta: {
      backupVersion: 1,
      gameVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      appId: APP_ID
    },
    data: {
      progression: {
        ...progressionMgr.getState(),
        keys: 12,
        hoverboardCharges: 9
      },
      wallet: {
        coins: 48500
      },
      upgrades: {
        MAGNET: 4,
        JETPACK: 5,
        SNEAKERS: 3,
        MULTIPLIER: 4,
        SHIELD: 2
      }
    }
  };

  const res = backupMgr.restoreSave(testPkg);
  assert(res.success === true, 'Restore completed successfully');
  assert(upgradeMgr.getCoins() === 48500, 'Coins restored to exactly 48,500');
  assert(progressionMgr.getKeys() === 12, 'Keys restored to exactly 12');
  assert(progressionMgr.getState().hoverboardCharges === 9, 'Hoverboard charges restored to 9');
  assert(upgradeMgr.getLevel('MAGNET') === 4, 'Magnet upgrade level restored to 4');
  assert(upgradeMgr.getLevel('JETPACK') === 5, 'Jetpack upgrade level restored to 5');
  assert(upgradeMgr.getLevel('SNEAKERS') === 3, 'Sneakers upgrade level restored to 3');

  // Boundary Clamping Test
  const outOfBoundsPkg: SaveBackupPackage = {
    meta: {
      backupVersion: 1,
      gameVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      appId: APP_ID
    },
    data: {
      progression: {
        ...progressionMgr.getState(),
        keys: 9999999, // exceeds 9,999 limit
        hoverboardCharges: -10
      },
      wallet: {
        coins: 150000000 // exceeds 99,999,999 limit
      },
      upgrades: {
        MAGNET: 10, // exceeds max 5
        JETPACK: 0  // below min 1
      }
    }
  };

  const val = backupMgr.parseAndValidateSave(JSON.stringify(outOfBoundsPkg));
  assert(val.valid === true, 'Validation passes with clamping warnings');
  assert(val.package!.data.wallet.coins === CURRENCY_BOUNDS.MAX_COINS, 'Excessive coins clamped to 99,999,999');
  assert(val.package!.data.progression.keys === CURRENCY_BOUNDS.MAX_KEYS, 'Excessive keys clamped to 9,999');
  assert(val.package!.data.progression.hoverboardCharges === 5, 'Negative hoverboard charges reset to safe default');
  assert(val.package!.data.upgrades.MAGNET === 5, 'Magnet upgrade level clamped down to 5');
  assert(val.package!.data.upgrades.JETPACK === 1, 'Jetpack upgrade level clamped up to 1');
}

// =========================================================================
// Suite 3: Inventory Integrity: Characters, Outfits, Hoverboards & Themes
// =========================================================================
console.log('\n--- Suite 3: Inventory Integrity & Sanitization ---');
{
  const inventoryPkg: SaveBackupPackage = {
    meta: {
      backupVersion: 1,
      gameVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      appId: APP_ID
    },
    data: {
      progression: {
        ...progressionMgr.getState(),
        unlockedCharacters: ['char_luna', 'char_nova', 'corrupted_hacker_char', '<script>alert(1)</script>'],
        selectedCharacter: 'char_nova',
        unlockedBoards: ['board_pulse_rider', 'fake_board_xyz'],
        selectedBoard: 'board_pulse_rider'
      },
      wallet: { coins: 1000 },
      upgrades: {},
      environmentPreference: 'NEON_INDUSTRIAL'
    }
  };

  const val = backupMgr.parseAndValidateSave(JSON.stringify(inventoryPkg));
  assert(val.valid === true, 'Package with unknown/script items validated and sanitized');
  const sanitizedChars = val.package!.data.progression.unlockedCharacters;
  assert(sanitizedChars.includes('char_jax'), 'char_jax was automatically ensured in unlocked characters');
  assert(sanitizedChars.includes('char_luna'), 'char_luna preserved');
  assert(sanitizedChars.includes('char_nova'), 'char_nova preserved');
  assert(!sanitizedChars.includes('corrupted_hacker_char'), 'Invalid character ID filtered out');
  assert(!sanitizedChars.includes('<script>alert(1)</script>'), 'Script injection string filtered out');

  const sanitizedBoards = val.package!.data.progression.unlockedBoards;
  assert(sanitizedBoards.includes('board_urban_glide'), 'board_urban_glide automatically ensured');
  assert(sanitizedBoards.includes('board_pulse_rider'), 'board_pulse_rider preserved');
  assert(!sanitizedBoards.includes('fake_board_xyz'), 'Unknown board ID rejected');

  // Restore and verify environment preference
  backupMgr.restoreSave(val.package!);
  assert(envMgr.getSelectionPreference() === 'NEON_INDUSTRIAL', 'Environment preference restored to NEON_INDUSTRIAL');
}

// =========================================================================
// Suite 4: Malformed, Corrupted & Oversized File Rejection
// =========================================================================
console.log('\n--- Suite 4: Malformed, Corrupted & Oversized File Rejection ---');
{
  // 1. Broken JSON Syntax
  const brokenJson = '{ "meta": { "backupVersion": 1 }, data: broken ';
  const valBroken = backupMgr.parseAndValidateSave(brokenJson);
  assert(valBroken.valid === false, 'Broken JSON syntax correctly rejected');
  assert(valBroken.errors[0].includes('Invalid JSON format'), 'Error details explain JSON parse failure');

  // 2. Non-object root
  assert(backupMgr.parseAndValidateSave('[1, 2, 3]').valid === false, 'JSON array root rejected');
  assert(backupMgr.parseAndValidateSave('"just a string"').valid === false, 'Primitive string root rejected');
  assert(backupMgr.parseAndValidateSave('true').valid === false, 'Primitive boolean root rejected');

  // 3. Oversized file
  const oversizedContent = ' '.repeat(MAX_BACKUP_FILE_SIZE * 2 + 10);
  const valOversized = backupMgr.parseAndValidateSave(oversizedContent, 'backup.json', MAX_BACKUP_FILE_SIZE + 100);
  assert(valOversized.valid === false, 'Oversized file (>512 KB) strictly rejected');
  assert(valOversized.errors[0].includes('exceeds maximum allowed size'), 'Error cites 512 KB size limit');

  // 4. Missing required progression
  const missingProg = JSON.stringify({ meta: { backupVersion: 1 }, data: {} });
  assert(backupMgr.parseAndValidateSave(missingProg).valid === false, 'Save missing progression object rejected');
}

// =========================================================================
// Suite 5: Version Compatibility & Forward / Backward Migration
// =========================================================================
console.log('\n--- Suite 5: Version Compatibility & Migration ---');
{
  // 1. Future Incompatible Version
  const futurePkg = {
    meta: {
      backupVersion: 99,
      gameVersion: '99.0.0',
      timestamp: new Date().toISOString(),
      appId: APP_ID
    },
    data: {
      progression: progressionMgr.getState()
    }
  };
  const valFuture = backupMgr.parseAndValidateSave(JSON.stringify(futurePkg));
  assert(valFuture.valid === false, 'Incompatible future backupVersion (v99) strictly rejected');
  assert(valFuture.errors[0].includes('Unsupported future save version'), 'Error guides user to update the game');

  // 2. Legacy Unboxed Progression (v0/v1 without meta wrapper)
  const legacyProgression = {
    version: 1,
    currentMissionSet: 2,
    lifetimeStats: {
      totalCoins: 3500,
      bestScore: 120000,
      hardModeHighScore: 50000 // old hard mode
    },
    unlockedCharacters: ['char_jax', 'char_cruz'],
    lastSelectedMode: 'HARD'
  };

  const valLegacy = backupMgr.parseAndValidateSave(JSON.stringify(legacyProgression));
  assert(valLegacy.valid === true, 'Legacy unboxed progression file parsed successfully');
  assert(valLegacy.isLegacyMigration === true, 'Identified as legacy migration');
  assert(valLegacy.package!.data.wallet.coins === 3500, 'Legacy coins migrated into wallet structure');
  assert(valLegacy.package!.data.progression.unlockedCharacters.includes('char_cruz'), 'Preserved unlocked Cruz');
}

// =========================================================================
// Suite 6: Atomic Restoration, Rollback Protection & Zero Corruption
// =========================================================================
console.log('\n--- Suite 6: Atomic Restoration & Rollback Protection ---');
{
  // Establish known clean state
  upgradeMgr.setCoins(777);
  progressionMgr.getState().keys = 7;
  progressionMgr.getState().unlockedCharacters = ['char_jax'];
  progressionMgr.saveState();

  // Create an intentionally corrupt package that fails verification during restore
  const failingPkg: SaveBackupPackage = {
    meta: {
      backupVersion: 1,
      gameVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      appId: APP_ID
    },
    data: {
      progression: {
        ...progressionMgr.getState(),
        keys: 99,
        // Empty unlocked characters will cause verification mismatch because Jax is mandatory
        unlockedCharacters: []
      },
      wallet: {
        coins: 99999
      },
      upgrades: {}
    }
  };

  const res = backupMgr.restoreSave(failingPkg);
  assert(res.rollbackCreated === true, 'Rollback snapshot was created prior to applying');
  assert(res.success === false, 'Restoration failed due to verification invariant');

  // Confirm that state was cleanly rolled back to 777 coins and 7 keys!
  assert(upgradeMgr.getCoins() === 777, 'Coins rolled back to pre-attempt balance (777)');
  assert(progressionMgr.getKeys() === 7, 'Keys rolled back to pre-attempt count (7)');
  assert(progressionMgr.getState().unlockedCharacters.length === 1, 'Characters rolled back cleanly');
}

// =========================================================================
// Suite 7: Idempotency & Anti-Duplicate Reward Exploitation
// =========================================================================
console.log('\n--- Suite 7: Idempotency & Reward Preservation ---');
{
  const testPkg: SaveBackupPackage = {
    meta: {
      backupVersion: 1,
      gameVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      appId: APP_ID
    },
    data: {
      progression: {
        ...progressionMgr.getState(),
        currentMissionSet: 3,
        achievements: {
          ach_coins_1: {
            id: 'ach_coins_1',
            currentProgress: 1000,
            completedTiers: ['BRONZE'],
            claimedTiers: ['BRONZE']
          }
        }
      },
      wallet: { coins: 5000 },
      upgrades: {}
    }
  };

  // Restore once
  backupMgr.restoreSave(testPkg);
  const firstCoins = upgradeMgr.getCoins();
  assert(firstCoins === 5000, 'Coins set to 5000 on first restore');

  // Restore identical save again
  backupMgr.restoreSave(testPkg);
  const secondCoins = upgradeMgr.getCoins();
  assert(secondCoins === 5000, 'Coins remain exactly 5000; no duplicate achievement claims');
}

// =========================================================================
// Suite 8: Storage Persistence Across Reload Simulation
// =========================================================================
console.log('\n--- Suite 8: Session Persistence Across Storage Reload ---');
{
  // Perform valid restore
  const testPkg: SaveBackupPackage = {
    meta: {
      backupVersion: 1,
      gameVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      appId: APP_ID
    },
    data: {
      progression: {
        ...progressionMgr.getState(),
        selectedCharacter: 'char_luna',
        unlockedCharacters: ['char_jax', 'char_luna']
      },
      wallet: { coins: 14200 },
      upgrades: {
        SHIELD: 4
      }
    }
  };
  backupMgr.restoreSave(testPkg);

  // Simulate complete browser restart by reloading managers from raw storage
  progressionMgr.load();
  upgradeMgr.load();

  assert(upgradeMgr.getCoins() === 14200, 'Coins retained across reload');
  assert(progressionMgr.getState().selectedCharacter === 'char_luna', 'Selected character retained across reload');
  assert(upgradeMgr.getLevel('SHIELD') === 4, 'Shield upgrade level retained across reload');
}

console.log('\n============================================================');
console.log(`🎉 ALL ${passedTests} / ${totalTests} TASK 3 SAVE BACKUP TESTS PASSED!`);
console.log('============================================================\n');
