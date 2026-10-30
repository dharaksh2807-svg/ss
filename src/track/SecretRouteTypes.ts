import { LaneIndex } from '../core/Constants';
import { EnvironmentId } from '../environment/EnvironmentConfig';
import { PowerupType } from '../player/PowerupManager';
import { TrackPattern } from './ObstaclePatterns';

export type SecretRouteId =
  | 'ABANDONED_METRO_PLATFORM'
  | 'ELEVATED_RAILWAY_PASSAGE'
  | 'HIDDEN_MAINTENANCE_TUNNEL';

export interface SecretRouteRewardConfig {
  baseBonusScore: number;
  firstDiscoveryCoins: number;
  firstDiscoveryScore: number;
  coinCount: number;
  bonusPowerup?: PowerupType;
  achievementId: string;
}

export interface SecretRouteEntryRequirement {
  lane: LaneIndex;
  actionRequired: 'LANE_SWITCH' | 'RAMP_CLIMB' | 'JUMP_BARRIER' | 'SLIDE_GATE';
  hintText: string;
  signText: string;
}

export interface SecretRouteLightingConfig {
  ambientColor: number;
  ambientIntensity: number;
  fogColor: number;
  fogDensity: number;
  accentBeaconColor: number;
}

export interface SecretRouteDef {
  id: SecretRouteId;
  name: string;
  tagline: string;
  description: string;
  eligibleDistricts: EnvironmentId[];
  minProgressionMeters: number; // Distance required before eligible (e.g. 250m)
  cooldownMeters: number;        // Spacing between secret routes (e.g. 450m)
  appearanceProbability: number; // Procedural chance when eligible (e.g. 0.25)
  lengthMeters: number;          // Traversal length (80m or 160m)
  entry: SecretRouteEntryRequirement;
  exitLane: LaneIndex;
  rewardConfig: SecretRouteRewardConfig;
  lighting: SecretRouteLightingConfig;
  isJetpackCompatible: boolean;
  createPattern: (seed: number) => TrackPattern;
}

export interface SecretRouteDiscoveryRecord {
  id: SecretRouteId;
  firstDiscoveredAt: number; // Timestamp
  timesCompleted: number;
  totalCoinsCollected: number;
  bestRunScore: number;
}

export interface SecretRoutePersistenceData {
  version: number;
  records: Record<SecretRouteId, SecretRouteDiscoveryRecord>;
  totalSecretsFound: number;
}

export interface ActiveSecretRouteState {
  def: SecretRouteDef;
  chunkZ: number;
  startWorldZ: number;
  endWorldZ: number;
  entryLane: LaneIndex;
  exitLane: LaneIndex;
  playerEntered: boolean;
  isFirstDiscovery: boolean;
  coinsCollectedInRoute: number;
  completed: boolean;
}
