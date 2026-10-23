import { CONSTANTS } from '../core/Constants';
import { EnvironmentId, EnvironmentSelection, EnvironmentManager } from './EnvironmentConfig';
import { EnvironmentRegistry } from './EnvironmentRegistry';

export interface DistrictRegion {
  index: number;
  districtId: EnvironmentId;
  startZ: number;       // e.g. 0
  endZ: number;         // e.g. -640
  length: number;       // e.g. 640
  portalZ: number;      // e.g. -640 (exact Z of the transition portal chunk)
  nextDistrictId: EnvironmentId;
}

export interface TransitionProgress {
  inTransition: boolean;
  fromEnv: EnvironmentId;
  toEnv: EnvironmentId;
  progress: number; // 0.0 (fully in fromEnv) to 1.0 (fully in toEnv)
  portalZ: number;
  distanceToPortal: number;
}

export class DistrictPlanner {
  private regions: DistrictRegion[] = [];
  private seed: number = 1337;
  private currentPrngState: number = 1337;
  private debugOverrideDistrict: EnvironmentId | null = null;
  private envRegistry = EnvironmentRegistry.getInstance();
  private envManager = EnvironmentManager.getInstance();

  constructor(seed: number = 1337) {
    this.reset(seed);
  }

  public reset(seed: number = 1337): void {
    this.seed = seed >>> 0;
    this.currentPrngState = this.seed;
    this.regions = [];
    this.ensureRegionsAhead(-2000);
  }

  private rng(): number {
    let t = (this.currentPrngState += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public setDebugOverrideDistrict(districtId: EnvironmentId | null): void {
    this.debugOverrideDistrict = districtId;
  }

  public getDebugOverrideDistrict(): EnvironmentId | null {
    return this.debugOverrideDistrict;
  }

  /**
   * Expands the planned district regions until reaching targetZ (which is negative)
   */
  private ensureRegionsAhead(targetZ: number): void {
    const chunkLength = CONSTANTS.CHUNK_LENGTH; // 80m

    while (this.regions.length === 0 || this.regions[this.regions.length - 1].endZ > targetZ) {
      const regionIndex = this.regions.length;
      let startZ = 0;
      let prevDistrictId: EnvironmentId | undefined;

      if (regionIndex > 0) {
        const prev = this.regions[regionIndex - 1];
        startZ = prev.endZ;
        prevDistrictId = prev.districtId;
      }

      const pref = this.envManager.getSelectionPreference();
      let districtId: EnvironmentId;

      if (this.debugOverrideDistrict) {
        districtId = this.debugOverrideDistrict;
      } else if (pref !== 'DYNAMIC') {
        districtId = pref as EnvironmentId;
      } else if (regionIndex === 0) {
        districtId = this.envManager.getStartingEnvironment();
      } else {
        const olderDistrictId = regionIndex > 1 ? this.regions[regionIndex - 2].districtId : undefined;
        districtId = this.envRegistry.getNextRandomTransition(prevDistrictId!, () => this.rng(), olderDistrictId);
      }

      const theme = this.envRegistry.get(districtId);
      const minLength = theme.districtRange?.minLengthMeters || 560;
      const maxLength = theme.districtRange?.maxLengthMeters || 800;

      // Choose length in chunks (e.g. 7 to 10 chunks)
      const minChunks = Math.max(6, Math.floor(minLength / chunkLength));
      const maxChunks = Math.max(minChunks + 1, Math.floor(maxLength / chunkLength));
      const numChunks = minChunks + Math.floor(this.rng() * (maxChunks - minChunks + 1));
      const regionLength = numChunks * chunkLength;
      const endZ = startZ - regionLength;
      const portalZ = endZ; // Transition portal is at the boundary chunk

      // Determine next district for transition planning
      let nextDistrictId: EnvironmentId;
      if (this.debugOverrideDistrict) {
        nextDistrictId = this.debugOverrideDistrict;
      } else if (pref !== 'DYNAMIC') {
        nextDistrictId = pref as EnvironmentId;
      } else {
        nextDistrictId = this.envRegistry.getNextRandomTransition(districtId, () => this.rng(), prevDistrictId);
      }

      const region: DistrictRegion = {
        index: regionIndex,
        districtId,
        startZ,
        endZ,
        length: regionLength,
        portalZ,
        nextDistrictId
      };

      this.regions.push(region);
    }
  }

  /**
   * Retrieves the planned region covering a given worldZ
   */
  public getRegionForZ(worldZ: number): DistrictRegion {
    this.ensureRegionsAhead(worldZ - CONSTANTS.CHUNK_LENGTH * 4);
    for (const r of this.regions) {
      if (worldZ <= r.startZ && worldZ > r.endZ) {
        return r;
      }
    }
    return this.regions[this.regions.length - 1];
  }

  /**
   * Determines whether a chunk starting at chunkZ is a transition portal chunk
   */
  public isPortalChunk(chunkZ: number): boolean {
    const chunkLength = CONSTANTS.CHUNK_LENGTH;
    this.ensureRegionsAhead(chunkZ - chunkLength * 2);
    for (const r of this.regions) {
      // If chunk start Z is at or within half a chunk of the portal Z
      if (Math.abs(chunkZ - r.portalZ) < chunkLength * 0.5) {
        return true;
      }
    }
    return false;
  }

  /**
   * Retrieves district information at chunkZ
   */
  public getDistrictAtZ(worldZ: number): { districtId: EnvironmentId; isPortal: boolean; regionIndex: number; distanceIntoRegion: number } {
    if (this.debugOverrideDistrict) {
      return {
        districtId: this.debugOverrideDistrict,
        isPortal: false,
        regionIndex: 0,
        distanceIntoRegion: Math.abs(worldZ)
      };
    }
    const region = this.getRegionForZ(worldZ);
    const isPortal = this.isPortalChunk(worldZ);
    return {
      districtId: isPortal ? region.nextDistrictId : region.districtId,
      isPortal,
      regionIndex: region.index,
      distanceIntoRegion: Math.abs(worldZ - region.startZ)
    };
  }

  /**
   * Calculates smooth atmospheric and lighting transition progress based on player's position
   */
  public getTransitionProgress(playerZ: number): TransitionProgress {
    if (this.debugOverrideDistrict) {
      return {
        inTransition: false,
        fromEnv: this.debugOverrideDistrict,
        toEnv: this.debugOverrideDistrict,
        progress: 1.0,
        portalZ: playerZ - 1000,
        distanceToPortal: 1000
      };
    }

    const currentRegion = this.getRegionForZ(playerZ);
    const portalZ = currentRegion.portalZ;
    const distanceToPortal = portalZ - playerZ; // negative when player is before portal (playerZ > portalZ)

    // Approaching window: 120m before portal up to 40m past portal
    const approachWindow = 120.0;
    const exitWindow = 40.0;
    const totalTransitionSpan = approachWindow + exitWindow; // 160m

    const distFromStartOfTransition = (portalZ + approachWindow) - playerZ;

    if (distFromStartOfTransition >= 0 && distFromStartOfTransition <= totalTransitionSpan) {
      const rawProgress = distFromStartOfTransition / totalTransitionSpan;
      // Smooth Hermite curve ease: 3x^2 - 2x^3
      const smoothProgress = rawProgress * rawProgress * (3.0 - 2.0 * rawProgress);
      return {
        inTransition: true,
        fromEnv: currentRegion.districtId,
        toEnv: currentRegion.nextDistrictId,
        progress: Math.max(0.0, Math.min(1.0, smoothProgress)),
        portalZ,
        distanceToPortal: Math.abs(distanceToPortal)
      };
    }

    // Not in transition zone
    const isPastPortal = playerZ <= portalZ;
    const activeEnv = isPastPortal ? currentRegion.nextDistrictId : currentRegion.districtId;

    return {
      inTransition: false,
      fromEnv: activeEnv,
      toEnv: activeEnv,
      progress: 1.0,
      portalZ,
      distanceToPortal: Math.abs(distanceToPortal)
    };
  }

  /**
   * Distance in meters from playerZ to the upcoming district portal
   */
  public getDistanceToNextTransition(playerZ: number): number {
    const region = this.getRegionForZ(playerZ);
    return Math.max(0, playerZ - region.portalZ);
  }

  public getRegions(): DistrictRegion[] {
    return this.regions;
  }
}
