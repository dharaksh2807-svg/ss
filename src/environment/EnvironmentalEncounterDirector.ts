import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { EventBus } from '../core/EventBus';
import { EnvironmentId } from './EnvironmentConfig';

export type LandmarkType =
  | 'GRAND_RAILWAY_STATION'
  | 'HISTORIC_STONE_VIADUCT'
  | 'MODERN_GLASS_TRANSIT_HUB'
  | 'INDUSTRIAL_MAINTENANCE_YARD'
  | 'OPEN_WATERFRONT_VISTA'
  | 'UNDERGROUND_GRAND_STATION'
  | 'ROOFTOP_SKYLINE_MOMENT';

export type SmallMomentType =
  | 'DISTANT_BIRDS_FLOCK'
  | 'PASSING_BACKGROUND_TRAIN'
  | 'ATMOSPHERIC_RAIN_MOMENT'
  | 'SUNSET_WATERFRONT_GLOW'
  | 'ILLUMINATED_SUBWAY_HALO';

export type AtmospherePreset =
  | 'CLEAR_DAYLIGHT'
  | 'WARM_GOLDEN_HOUR'
  | 'SOFT_OVERCAST'
  | 'LIGHT_RAIN'
  | 'ILLUMINATED_UNDERGROUND';

export interface LandmarkEncounterDef {
  id: LandmarkType;
  name: string;
  eligibleDistricts: EnvironmentId[];
  weight: number;
  minProgressionMeters: number;
  cooldownMeters: number;
  minSpacingMeters: number;
  vfx?: 'BIRDS' | 'RAIN' | 'PASSING_TRAIN' | 'WATERFRONT_GLOW' | 'SUBWAY_HALO';
  audioCue?: 'station' | 'industrial' | 'waterfront' | 'viaduct' | 'rooftop';
  minQuality: 'MINIMAL' | 'BALANCED' | 'FULL';
  preferredAtmosphere?: AtmospherePreset;
  customCollectiblePattern?: 'STATION_PLATFORM_LINE' | 'ROOFTOP_VISTA_ARC' | 'INDUSTRIAL_ZIGZAG';
}

export interface ScheduledLandmark {
  worldZ: number;
  chunkIndex: number;
  landmarkId: LandmarkType;
  districtId: EnvironmentId;
  def: LandmarkEncounterDef;
}

export interface ActiveSmallMoment {
  worldZ: number;
  chunkIndex: number;
  type: SmallMomentType;
  districtId: EnvironmentId;
}

export class EnvironmentalEncounterDirector {
  private static instance: EnvironmentalEncounterDirector;

  // Registered encounters registry
  private registry: Map<LandmarkType, LandmarkEncounterDef> = new Map();

  // Run seed & determinism
  private runSeed: number = 1337;

  // Tracking state along world axis
  private lastLandmarkZ: number = 999999;
  private lastLandmarkId: LandmarkType | null = null;
  private landmarkHistory: Map<LandmarkType, number> = new Map(); // id -> lastSpawnZ
  private scheduledLandmarks: Map<number, ScheduledLandmark> = new Map(); // chunkIndex -> landmark
  private scheduledSmallMoments: Map<number, ActiveSmallMoment> = new Map();

  // Atmospheric state
  private activeAtmosphere: AtmospherePreset = 'CLEAR_DAYLIGHT';
  private targetAtmosphere: AtmospherePreset = 'CLEAR_DAYLIGHT';
  private atmosphereTransitionProgress: number = 1.0;

  // Debug overrides
  private forcedLandmark: LandmarkType | null = null;
  private forcedAtmosphere: AtmospherePreset | null = null;

  private constructor() {
    this.registerDefaultEncounters();
  }

  public static getInstance(): EnvironmentalEncounterDirector {
    if (!EnvironmentalEncounterDirector.instance) {
      EnvironmentalEncounterDirector.instance = new EnvironmentalEncounterDirector();
    }
    return EnvironmentalEncounterDirector.instance;
  }

  private registerDefaultEncounters(): void {
    // 1. Grand Railway Station
    this.registerEncounter({
      id: 'GRAND_RAILWAY_STATION',
      name: 'Grand Railway Station Terminal',
      eligibleDistricts: ['MODERN_METRO', 'HISTORIC_QUARTER'],
      weight: 1.0,
      minProgressionMeters: 240,
      cooldownMeters: 640,
      minSpacingMeters: 320,
      audioCue: 'station',
      minQuality: 'MINIMAL',
      customCollectiblePattern: 'STATION_PLATFORM_LINE'
    });

    // 2. Historic Stone Viaduct
    this.registerEncounter({
      id: 'HISTORIC_STONE_VIADUCT',
      name: 'Monumental Stone Viaduct & Aqueduct',
      eligibleDistricts: ['HISTORIC_QUARTER'],
      weight: 1.2,
      minProgressionMeters: 200,
      cooldownMeters: 560,
      minSpacingMeters: 280,
      audioCue: 'viaduct',
      minQuality: 'MINIMAL'
    });

    // 3. Modern Glass Transit Hub
    this.registerEncounter({
      id: 'MODERN_GLASS_TRANSIT_HUB',
      name: 'Modern Glass Space-Frame Transit Hub',
      eligibleDistricts: ['MODERN_METRO'],
      weight: 1.1,
      minProgressionMeters: 280,
      cooldownMeters: 640,
      minSpacingMeters: 320,
      audioCue: 'station',
      minQuality: 'MINIMAL'
    });

    // 4. Industrial Maintenance Yard
    this.registerEncounter({
      id: 'INDUSTRIAL_MAINTENANCE_YARD',
      name: 'Heavy Industrial Rail Maintenance Depot',
      eligibleDistricts: ['HISTORIC_QUARTER', 'MODERN_METRO'],
      weight: 1.0,
      minProgressionMeters: 320,
      cooldownMeters: 560,
      minSpacingMeters: 280,
      audioCue: 'industrial',
      minQuality: 'MINIMAL',
      customCollectiblePattern: 'INDUSTRIAL_ZIGZAG'
    });

    // 5. Open Waterfront Vista
    this.registerEncounter({
      id: 'OPEN_WATERFRONT_VISTA',
      name: 'Open Waterfront Harbor & Suspension Bridge Vista',
      eligibleDistricts: ['MODERN_METRO', 'HISTORIC_QUARTER'],
      weight: 0.9,
      minProgressionMeters: 400,
      cooldownMeters: 720,
      minSpacingMeters: 360,
      vfx: 'WATERFRONT_GLOW',
      audioCue: 'waterfront',
      preferredAtmosphere: 'WARM_GOLDEN_HOUR',
      minQuality: 'MINIMAL'
    });

    // 6. Underground Grand Station
    this.registerEncounter({
      id: 'UNDERGROUND_GRAND_STATION',
      name: 'Subterranean Grand Concourse Vault',
      eligibleDistricts: ['UNDERGROUND_METRO'],
      weight: 1.3,
      minProgressionMeters: 160,
      cooldownMeters: 480,
      minSpacingMeters: 240,
      vfx: 'SUBWAY_HALO',
      audioCue: 'station',
      preferredAtmosphere: 'ILLUMINATED_UNDERGROUND',
      minQuality: 'MINIMAL',
      customCollectiblePattern: 'STATION_PLATFORM_LINE'
    });

    // 7. Rooftop Skyline Moment
    this.registerEncounter({
      id: 'ROOFTOP_SKYLINE_MOMENT',
      name: 'Panoramic Skyline Viaduct Vista',
      eligibleDistricts: ['MODERN_METRO', 'HISTORIC_QUARTER'],
      weight: 1.0,
      minProgressionMeters: 360,
      cooldownMeters: 640,
      minSpacingMeters: 320,
      audioCue: 'rooftop',
      minQuality: 'MINIMAL',
      customCollectiblePattern: 'ROOFTOP_VISTA_ARC'
    });
  }

  public registerEncounter(def: LandmarkEncounterDef): void {
    this.registry.set(def.id, def);
  }

  public getEncounterDef(id: LandmarkType): LandmarkEncounterDef | undefined {
    return this.registry.get(id);
  }

  public getAllEncounterDefs(): LandmarkEncounterDef[] {
    return Array.from(this.registry.values());
  }

  public setRunSeed(seed: number): void {
    this.runSeed = seed >>> 0;
    this.reset();
  }

  public reset(): void {
    this.lastLandmarkZ = 999999;
    this.lastLandmarkId = null;
    this.landmarkHistory.clear();
    this.scheduledLandmarks.clear();
    this.scheduledSmallMoments.clear();
    this.forcedLandmark = null;
    this.forcedSmallMoment = null;
    this.forcedAtmosphere = null;
    this.activeAtmosphere = 'CLEAR_DAYLIGHT';
    this.targetAtmosphere = 'CLEAR_DAYLIGHT';
  }

  private forcedSmallMoment: SmallMomentType | null = null;

  public setForcedSmallMoment(moment: SmallMomentType | null): void {
    this.forcedSmallMoment = moment;
  }

  /**
   * Evaluates and returns whether a chunk should spawn a landmark encounter
   */
  public evaluateChunkLandmark(
    worldZ: number,
    chunkIndex: number,
    districtId: EnvironmentId,
    isPortal: boolean,
    isTunnel: boolean,
    seed: number
  ): ScheduledLandmark | null {
    // If a debug override is set, force it immediately
    if (this.forcedLandmark) {
      const def = this.registry.get(this.forcedLandmark);
      if (def) {
        return {
          worldZ,
          chunkIndex,
          landmarkId: this.forcedLandmark,
          districtId,
          def
        };
      }
    }

    // Never spawn landmarks inside a transition portal chunk to avoid visual crowding
    if (isPortal) {
      return null;
    }

    const distanceTraveled = Math.abs(worldZ);

    // Filter candidates eligible for this district and progression
    const candidates = Array.from(this.registry.values()).filter(def => {
      // 1. District match
      if (!def.eligibleDistricts.includes(districtId)) return false;

      // 2. Progression threshold
      if (distanceTraveled < def.minProgressionMeters) return false;

      // 3. Spacing from previous landmark
      const distFromLastLandmark = Math.abs(this.lastLandmarkZ - worldZ);
      if (this.lastLandmarkZ < 900000 && distFromLastLandmark < def.minSpacingMeters) return false;

      // 4. Cooldown for this specific landmark
      const lastSpawnZ = this.landmarkHistory.get(def.id);
      if (lastSpawnZ !== undefined && Math.abs(lastSpawnZ - worldZ) < def.cooldownMeters) return false;

      return true;
    });

    if (candidates.length === 0) {
      return null;
    }

    // Deterministic random selection based on chunk seed
    let hash = (seed ^ (this.runSeed + 0x9e3779b9)) >>> 0;
    hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
    hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
    const rng = ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;

    // Spawning frequency: roughly 1 in every 3 to 4 eligible chunks
    const spawnChance = 0.35;
    if (rng > spawnChance) {
      return null;
    }

    // Weighted candidate selection
    const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
    let pickVal = (rng / spawnChance) * totalWeight;
    let chosen: LandmarkEncounterDef = candidates[0];

    for (const cand of candidates) {
      if (pickVal < cand.weight) {
        chosen = cand;
        break;
      }
      pickVal -= cand.weight;
    }

    // Record landmark schedule
    this.lastLandmarkZ = worldZ;
    this.lastLandmarkId = chosen.id;
    this.landmarkHistory.set(chosen.id, worldZ);

    const scheduled: ScheduledLandmark = {
      worldZ,
      chunkIndex,
      landmarkId: chosen.id,
      districtId,
      def: chosen
    };

    this.scheduledLandmarks.set(chunkIndex, scheduled);

    // Emit encounter discovery event
    EventBus.getInstance().emit('LANDMARK_ENCOUNTERED', {
      landmarkId: chosen.id,
      name: chosen.name,
      worldZ,
      districtId
    });

    return scheduled;
  }

  /**
   * Evaluates smaller visual surprises (birds, passing train, light rain)
   */
  public evaluateSmallMoment(
    worldZ: number,
    chunkIndex: number,
    districtId: EnvironmentId,
    seed: number
  ): SmallMomentType | null {
    if (this.forcedSmallMoment) {
      return this.forcedSmallMoment;
    }

    if (districtId === 'UNDERGROUND_METRO') {
      // In underground, small moments can be illuminated station halo
      return (seed % 5 === 0) ? 'ILLUMINATED_SUBWAY_HALO' : null;
    }

    const dist = Math.abs(worldZ);
    // Early small moment at 15-25s (~200m - 350m)
    if (dist >= 180 && dist <= 380 && (chunkIndex % 3 === 0)) {
      return 'DISTANT_BIRDS_FLOCK';
    }

    // Hash deterministic roll
    const roll = (seed >>> 8) % 100;
    if (roll < 12) {
      return 'PASSING_BACKGROUND_TRAIN';
    } else if (roll < 20) {
      return 'DISTANT_BIRDS_FLOCK';
    } else if (roll < 25 && dist > 500) {
      return 'ATMOSPHERIC_RAIN_MOMENT';
    }

    return null;
  }

  /**
   * Resolves atmospheric preset based on progression, weather, and district
   */
  public resolveAtmospherePreset(playerZ: number, districtId: EnvironmentId): AtmospherePreset {
    if (this.forcedAtmosphere) {
      return this.forcedAtmosphere;
    }

    if (districtId === 'UNDERGROUND_METRO') {
      return 'ILLUMINATED_UNDERGROUND';
    }

    // Check if an upcoming or recent landmark prefers an atmosphere
    for (const [_, landmark] of this.scheduledLandmarks) {
      if (Math.abs(landmark.worldZ - playerZ) < 160 && landmark.def.preferredAtmosphere) {
        return landmark.def.preferredAtmosphere;
      }
    }

    // Default progression-based atmospheric pacing:
    // 0 - 600m: CLEAR_DAYLIGHT (Modern) or WARM_GOLDEN_HOUR (Historic)
    // 600m - 1200m: WARM_GOLDEN_HOUR
    // 1200m - 1800m: SOFT_OVERCAST / LIGHT_RAIN
    const dist = Math.abs(playerZ);
    if (districtId === 'HISTORIC_QUARTER') {
      return (dist % 1600 > 900) ? 'SOFT_OVERCAST' : 'WARM_GOLDEN_HOUR';
    } else {
      if (dist > 1400 && dist % 1200 > 800) {
        return 'LIGHT_RAIN';
      }
      return 'CLEAR_DAYLIGHT';
    }
  }

  // Debug API
  public setForcedLandmark(landmark: LandmarkType | null): void {
    this.forcedLandmark = landmark;
  }

  public getForcedLandmark(): LandmarkType | null {
    return this.forcedLandmark;
  }

  public setForcedAtmosphere(preset: AtmospherePreset | null): void {
    this.forcedAtmosphere = preset;
  }

  public getForcedAtmosphere(): AtmospherePreset | null {
    return this.forcedAtmosphere;
  }

  public getScheduledLandmarks(): ScheduledLandmark[] {
    return Array.from(this.scheduledLandmarks.values());
  }

  public getLastLandmark(): ScheduledLandmark | null {
    if (this.scheduledLandmarks.size === 0) return null;
    const sorted = Array.from(this.scheduledLandmarks.values()).sort((a, b) => b.worldZ - a.worldZ);
    return sorted[0];
  }
}
