import { CONSTANTS, LaneIndex } from '../core/Constants';
import { TrainCompositionTier, TrainCompositionDef, TRAIN_COMPOSITIONS } from './TrainComposition';
import { TrackPattern, PatternObstacle, PatternCollectible } from './ObstaclePatterns';
import { CoinPatternLibrary } from './CoinPatternLibrary';

export type RooftopRouteArchetype =
  | 'RAMP_RUN_EXIT'
  | 'SIDE_SWITCH'
  | 'DOUBLE_SWITCH'
  | 'GAP_HOP';

export interface RooftopRouteLeg {
  id: string;
  lane: LaneIndex;
  compositionId: string;
  composition: TrainCompositionDef;
  chunkRelativeZ: number; // Start Z relative to route start
  length: number;
  entryType: 'RAMP' | 'ROOF_TRANSFER';
  exitType: 'END_RAMP' | 'ROOF_TRANSFER' | 'SAFE_DROP';
}

export interface RooftopTransfer {
  id: string;
  sourceLegId: string;
  targetLegId: string;
  sourceLane: LaneIndex;
  targetLane: LaneIndex;
  kind: 'LATERAL_JUMP' | 'LONGITUDINAL_GAP_JUMP' | 'PHYSICAL_GANGWAY';
  windowStartZ: number; // Local Z where transfer window begins
  windowEndZ: number;   // Local Z where transfer window ends
  landingZ: number;     // Nominal target landing center Z
  requiredAirtime: number;
}

export interface RooftopRoutePlan {
  id: string;
  seed: number;
  archetype: RooftopRouteArchetype;
  tier: TrainCompositionTier;
  targetDuration: number;
  totalLength: number;
  legs: RooftopRouteLeg[];
  transfers: RooftopTransfer[];
  entryLane: LaneIndex;
  exitLane: LaneIndex;
  rampLength: number;
}

export interface RooftopPlannerOptions {
  seed: number;
  tier: TrainCompositionTier;
  playerSpeed: number;
  gameMode?: string;
  availableEntryLanes?: LaneIndex[];
  forcedArchetype?: RooftopRouteArchetype;
}

/**
 * Seeded PRNG for 100% deterministic route planning.
 * Uses a linear congruential generator (LCG) with high-quality constants.
 */
class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = (Math.abs(Math.floor(seed)) % 2147483647) || 1;
  }

  public next(): number {
    this.state = (this.state * 16807) % 2147483647;
    return (this.state - 1) / 2147483646;
  }

  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public choice<T>(array: readonly T[]): T {
    const idx = Math.floor(this.next() * array.length);
    return array[Math.min(idx, array.length - 1)];
  }

  public weightedChoice<T extends string>(weights: Record<T, number>): T {
    const entries = Object.entries(weights) as [T, number][];
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let r = this.next() * total;
    for (const [key, weight] of entries) {
      r -= weight;
      if (r <= 0) return key;
    }
    return entries[entries.length - 1][0];
  }
}

/**
 * Pure deterministic planner for multi-train rooftop routes.
 * Produces identical route structures, leg transitions, and transfers for the same inputs.
 */
export class RooftopRoutePlanner {
  /**
   * Archetype selection weights by tier
   */
  public static readonly ARCHETYPE_WEIGHTS: Record<TrainCompositionTier, Record<RooftopRouteArchetype, number>> = {
    BEGINNER: {
      RAMP_RUN_EXIT: 0.80,
      SIDE_SWITCH: 0.20,
      DOUBLE_SWITCH: 0.00,
      GAP_HOP: 0.00
    },
    INTERMEDIATE: {
      RAMP_RUN_EXIT: 0.35,
      SIDE_SWITCH: 0.50,
      DOUBLE_SWITCH: 0.00,
      GAP_HOP: 0.15
    },
    ADVANCED: {
      RAMP_RUN_EXIT: 0.00,
      SIDE_SWITCH: 0.40,
      DOUBLE_SWITCH: 0.30,
      GAP_HOP: 0.30
    },
    EXPERT: {
      RAMP_RUN_EXIT: 0.00,
      SIDE_SWITCH: 0.30,
      DOUBLE_SWITCH: 0.40,
      GAP_HOP: 0.30
    }
  };

  /**
   * Target durations by game mode and tier
   */
  public static readonly TARGET_DURATIONS: Record<'NORMAL' | 'HARD', Record<TrainCompositionTier, { min: number; max: number }>> = {
    NORMAL: {
      BEGINNER: { min: 2.5, max: 3.0 },
      INTERMEDIATE: { min: 3.0, max: 4.0 },
      ADVANCED: { min: 3.5, max: 4.5 },
      EXPERT: { min: 4.0, max: 5.0 }
    },
    HARD: {
      BEGINNER: { min: 2.2, max: 2.8 },
      INTERMEDIATE: { min: 2.8, max: 3.6 },
      ADVANCED: { min: 3.2, max: 4.2 },
      EXPERT: { min: 3.5, max: 4.5 }
    }
  };

  /**
   * Generate deterministic rooftop route plan
   */
  public static planRoute(options: RooftopPlannerOptions): RooftopRoutePlan {
    const rng = new SeededRandom(options.seed);
    const modeKey = (options.gameMode === 'HARD' ? 'HARD' : 'NORMAL');
    const tier = options.tier;
    const speed = Math.max(12.0, options.playerSpeed);

    // 1. Archetype selection
    const archetype: RooftopRouteArchetype = options.forcedArchetype ||
      rng.weightedChoice(this.ARCHETYPE_WEIGHTS[tier]);

    // 2. Target duration and distance calculation
    const durationRange = this.TARGET_DURATIONS[modeKey][tier];
    const targetDuration = Math.round(rng.range(durationRange.min, durationRange.max) * 100) / 100;
    const requiredTraversableDistance = targetDuration * speed;

    // 3. Entry lane selection
    const allowedLanes = options.availableEntryLanes && options.availableEntryLanes.length > 0
      ? options.availableEntryLanes
      : ([-1, 0, 1] as LaneIndex[]);
    const entryLane = rng.choice(allowedLanes);

    // Optimized entry ramp length for smooth 23.5° incline
    const rampLength = 9.8;

    const legs: RooftopRouteLeg[] = [];
    const transfers: RooftopTransfer[] = [];

    const routeId = `route_${archetype}_s${options.seed}_${tier}`;

    switch (archetype) {
      case 'RAMP_RUN_EXIT': {
        // Single continuous train composition (Twin or Triple or Quad depending on speed/duration)
        const comp = this.selectCompositionForDistance(requiredTraversableDistance, tier, true, true);
        legs.push({
          id: `${routeId}_leg_0`,
          lane: entryLane,
          compositionId: comp.id,
          composition: comp,
          chunkRelativeZ: 0,
          length: comp.totalLength,
          entryType: 'RAMP',
          exitType: comp.hasExitRamp ? 'END_RAMP' : 'SAFE_DROP'
        });
        break;
      }

      case 'SIDE_SWITCH': {
        // Train A (with ramp) -> Lateral Jump -> Train B in adjacent lane
        // Lane B must be exactly one adjacent lane away:
        const adjacentLanes: LaneIndex[] = [];
        if (entryLane > -1) adjacentLanes.push((entryLane - 1) as LaneIndex);
        if (entryLane < 1) adjacentLanes.push((entryLane + 1) as LaneIndex);
        const targetLane = rng.choice(adjacentLanes);

        // Train A length: ~45-50% of required distance
        const distA = Math.max(28.0, requiredTraversableDistance * 0.45);
        const compA = this.selectCompositionForDistance(distA, tier, true, false);

        // Train B length: remaining ~55-60% of required distance + stabilization buffer
        const distB = Math.max(32.0, requiredTraversableDistance * 0.55);
        const compB = this.selectCompositionForDistance(distB, tier, false, true);

        // Transfer window: Train B overlaps Train A longitudinally.
        // Transfer occurs roughly 10-14m before Train A ends.
        const transferWindowStartZ = Math.max(16.0, compA.totalLength - 16.0);
        const transferWindowEndZ = compA.totalLength - 4.0;
        const landingOffsetZ = transferWindowStartZ + speed * 0.40; // Landing after ~0.40s flight

        const legAId = `${routeId}_leg_0`;
        const legBId = `${routeId}_leg_1`;

        // Train B starts along the track where the transfer can be made cleanly
        const trainBStartRelativeZ = transferWindowStartZ - 8.0;

        legs.push({
          id: legAId,
          lane: entryLane,
          compositionId: compA.id,
          composition: compA,
          chunkRelativeZ: 0,
          length: compA.totalLength,
          entryType: 'RAMP',
          exitType: 'ROOF_TRANSFER'
        });

        legs.push({
          id: legBId,
          lane: targetLane,
          compositionId: compB.id,
          composition: compB,
          chunkRelativeZ: trainBStartRelativeZ,
          length: compB.totalLength,
          entryType: 'ROOF_TRANSFER',
          exitType: compB.hasExitRamp ? 'END_RAMP' : 'SAFE_DROP'
        });

        transfers.push({
          id: `${routeId}_xfer_0`,
          sourceLegId: legAId,
          targetLegId: legBId,
          sourceLane: entryLane,
          targetLane: targetLane,
          kind: 'LATERAL_JUMP',
          windowStartZ: transferWindowStartZ,
          windowEndZ: transferWindowEndZ,
          landingZ: landingOffsetZ,
          requiredAirtime: 0.60
        });
        break;
      }

      case 'DOUBLE_SWITCH': {
        // Train A -> Jump to B -> Run -> Jump to C -> Safe Exit
        // Adjacent moves only: e.g. -1 -> 0 -> 1, or 1 -> 0 -> -1, or 0 -> 1 -> 0, or 0 -> -1 -> 0
        const midLane: LaneIndex = entryLane === 0 ? (rng.next() < 0.5 ? -1 : 1) : 0;
        const finalLane: LaneIndex = midLane === 0 ? (entryLane === -1 ? 1 : -1) : 0;

        const legDist = Math.max(38.0, (requiredTraversableDistance * 0.40) + 4.0);
        const compA = this.selectCompositionForDistance(legDist, tier, true, false);
        const compB = this.selectCompositionForDistance(legDist + 14.0, tier, false, false);
        const compC = this.selectCompositionForDistance(legDist + 14.0, tier, false, true);

        const legAId = `${routeId}_leg_0`;
        const legBId = `${routeId}_leg_1`;
        const legCId = `${routeId}_leg_2`;

        const xfer1Start = Math.max(16.0, compA.totalLength - 14.0);
        const xfer1End = compA.totalLength - 3.5;
        const xfer1LandingZ = xfer1Start + speed * 0.35;
        const trainBStart = xfer1Start - 8.0;

        const stabilizationBuffer = Math.max(12.0, speed * 0.42);
        const xfer2Start = xfer1LandingZ + stabilizationBuffer;
        const xfer2End = xfer2Start + 8.0;
        const xfer2LandingZ = xfer2Start + speed * 0.35;
        const trainCStart = xfer2Start - 8.0;

        legs.push({
          id: legAId,
          lane: entryLane,
          compositionId: compA.id,
          composition: compA,
          chunkRelativeZ: 0,
          length: compA.totalLength,
          entryType: 'RAMP',
          exitType: 'ROOF_TRANSFER'
        });

        legs.push({
          id: legBId,
          lane: midLane,
          compositionId: compB.id,
          composition: compB,
          chunkRelativeZ: trainBStart,
          length: compB.totalLength,
          entryType: 'ROOF_TRANSFER',
          exitType: 'ROOF_TRANSFER'
        });

        legs.push({
          id: legCId,
          lane: finalLane,
          compositionId: compC.id,
          composition: compC,
          chunkRelativeZ: trainCStart,
          length: compC.totalLength,
          entryType: 'ROOF_TRANSFER',
          exitType: compC.hasExitRamp ? 'END_RAMP' : 'SAFE_DROP'
        });

        transfers.push({
          id: `${routeId}_xfer_0`,
          sourceLegId: legAId,
          targetLegId: legBId,
          sourceLane: entryLane,
          targetLane: midLane,
          kind: 'LATERAL_JUMP',
          windowStartZ: xfer1Start,
          windowEndZ: xfer1End,
          landingZ: xfer1LandingZ,
          requiredAirtime: 0.60
        });

        transfers.push({
          id: `${routeId}_xfer_1`,
          sourceLegId: legBId,
          targetLegId: legCId,
          sourceLane: midLane,
          targetLane: finalLane,
          kind: 'LATERAL_JUMP',
          windowStartZ: xfer2Start,
          windowEndZ: xfer2End,
          landingZ: xfer2LandingZ,
          requiredAirtime: 0.60
        });
        break;
      }

      case 'GAP_HOP': {
        // Train A (with ramp) -> Longitudinal Gap (3.25m - 3.5m) -> Train B (same lane) -> Exit
        const gapSize = 3.5;
        const distA = Math.max(28.0, requiredTraversableDistance * 0.48);
        const distB = Math.max(28.0, requiredTraversableDistance * 0.52);

        const compA = this.selectCompositionForDistance(distA, tier, true, false);
        const compB = this.selectCompositionForDistance(distB, tier, false, true);

        const legAId = `${routeId}_leg_0`;
        const legBId = `${routeId}_leg_1`;
        const trainBStart = compA.totalLength + gapSize;

        legs.push({
          id: legAId,
          lane: entryLane,
          compositionId: compA.id,
          composition: compA,
          chunkRelativeZ: 0,
          length: compA.totalLength,
          entryType: 'RAMP',
          exitType: 'ROOF_TRANSFER'
        });

        legs.push({
          id: legBId,
          lane: entryLane,
          compositionId: compB.id,
          composition: compB,
          chunkRelativeZ: trainBStart,
          length: compB.totalLength,
          entryType: 'ROOF_TRANSFER',
          exitType: compB.hasExitRamp ? 'END_RAMP' : 'SAFE_DROP'
        });

        transfers.push({
          id: `${routeId}_xfer_0`,
          sourceLegId: legAId,
          targetLegId: legBId,
          sourceLane: entryLane,
          targetLane: entryLane,
          kind: 'LONGITUDINAL_GAP_JUMP',
          windowStartZ: compA.totalLength - 2.5,
          windowEndZ: compA.totalLength,
          landingZ: trainBStart + 2.0,
          requiredAirtime: 0.60
        });
        break;
      }
    }

    const lastLeg = legs[legs.length - 1];
    const totalLength = lastLeg ? lastLeg.chunkRelativeZ + lastLeg.length : requiredTraversableDistance;
    const exitLane = lastLeg ? lastLeg.lane : entryLane;

    return {
      id: routeId,
      seed: options.seed,
      archetype,
      tier,
      targetDuration,
      totalLength,
      legs,
      transfers,
      entryLane,
      exitLane,
      rampLength
    };
  }

  /**
   * Helper: Selects or constructs standard modular composition meeting length requirements
   */
  private static selectCompositionForDistance(
    targetDist: number,
    tier: TrainCompositionTier,
    hasRamp: boolean,
    hasExitRamp: boolean
  ): TrainCompositionDef {
    if (targetDist <= 40.0) {
      // 2-Carriage setup (~37.2m)
      const base = TRAIN_COMPOSITIONS.COMMUTER_TWIN_SET;
      return {
        ...base,
        id: `${base.id}_${hasRamp ? 'R' : 'S'}_${hasExitRamp ? 'XR' : 'SD'}`,
        hasRamp,
        hasExitRamp,
        rampLength: 9.8,
        carriages: base.carriages.map((c, i) => ({
          ...c,
          hasRamp: i === 0 && hasRamp,
          hasExitRamp: i === base.carriages.length - 1 && hasExitRamp
        }))
      };
    } else if (targetDist <= 58.0) {
      // 3-Carriage setup (~52.4m)
      const base = TRAIN_COMPOSITIONS.METRO_TRIPLE_CONSIST;
      return {
        ...base,
        id: `${base.id}_${hasRamp ? 'R' : 'S'}_${hasExitRamp ? 'XR' : 'SD'}`,
        hasRamp,
        hasExitRamp,
        rampLength: 9.8,
        carriages: base.carriages.map((c, i) => ({
          ...c,
          hasRamp: i === 0 && hasRamp,
          hasExitRamp: i === base.carriages.length - 1 && hasExitRamp
        }))
      };
    } else {
      // 4-Carriage Quad setup (~69.6m)
      const base = TRAIN_COMPOSITIONS.EXPRESS_QUAD_CONSIST;
      return {
        ...base,
        id: `${base.id}_${hasRamp ? 'R' : 'S'}_${hasExitRamp ? 'XR' : 'SD'}`,
        hasRamp,
        hasExitRamp,
        rampLength: 9.8,
        carriages: base.carriages.map((c, i) => ({
          ...c,
          hasRamp: i === 0 && hasRamp,
          hasExitRamp: i === base.carriages.length - 1 && hasExitRamp
        }))
      };
    }
  }

  /**
   * Converts a planned deterministic rooftop route into an authoritative TrackPattern
   * complete with per-carriage compositions, rooftop obstacles, and 5-type coin routes.
   */
  public static createTrackPattern(plan: RooftopRoutePlan): TrackPattern {
    const obstacles: PatternObstacle[] = [];
    const collectibles: PatternCollectible[] = [];

    const baseZ = 4.0;

    for (let i = 0; i < plan.legs.length; i++) {
      const leg = plan.legs[i];
      const legZ = baseZ + leg.chunkRelativeZ;

      obstacles.push({
        type: 'TRAIN_COMPOSITION',
        lane: leg.lane,
        zOffset: legZ,
        length: leg.length,
        hasRamp: leg.entryType === 'RAMP',
        hasExitRamp: leg.exitType === 'END_RAMP',
        composition: leg.composition,
        carriageGroupId: `${plan.id}_grp_${leg.lane}`,
        routeGroupId: plan.id,
        routeLegId: leg.id
      });
    }

    // Collectibles generation:
    const firstLeg = plan.legs[0];
    if (firstLeg && firstLeg.entryType === 'RAMP') {
      collectibles.push(CoinPatternLibrary.createRampAscent(firstLeg.lane, Math.max(0, baseZ - 4.0), 5, 1.8));
      collectibles.push(CoinPatternLibrary.createRooftopRun(firstLeg.lane, baseZ + 6.0, 5, 2.2));
    }

    for (const xfer of plan.transfers) {
      if (xfer.kind === 'LATERAL_JUMP') {
        // Diagonal airborne switch arc
        const takeoffZ = baseZ + xfer.windowStartZ - 1.0;
        collectibles.push(CoinPatternLibrary.createLateralRoofSwitch(xfer.sourceLane, xfer.targetLane, takeoffZ, 5, 2.4));
        // Follow-up roof run on destination train
        const landZ = baseZ + xfer.landingZ + 3.0;
        collectibles.push(CoinPatternLibrary.createRooftopRun(xfer.targetLane, landZ, 4, 2.2));
      } else if (xfer.kind === 'LONGITUDINAL_GAP_JUMP') {
        // Ballistic gap arc
        const gapTakeoffZ = baseZ + xfer.windowStartZ - 1.0;
        collectibles.push(CoinPatternLibrary.createCarriageGapJumpArc(xfer.sourceLane, gapTakeoffZ, 5, 1.8));
        const landZ = baseZ + xfer.landingZ + 3.0;
        collectibles.push(CoinPatternLibrary.createRooftopRun(xfer.sourceLane, landZ, 4, 2.2));
      }
    }

    const lastLeg = plan.legs[plan.legs.length - 1];
    if (lastLeg && lastLeg.exitType === 'END_RAMP') {
      const exitZ = baseZ + lastLeg.chunkRelativeZ + lastLeg.length - 8.0;
      collectibles.push(CoinPatternLibrary.createExitRampDescent(lastLeg.lane, exitZ, 4, 2.0));
      collectibles.push(CoinPatternLibrary.createPostRooftopReward(lastLeg.lane, exitZ + 10.0, 4, 2.0));
    }

    return {
      name: `ROOFTOP_ROUTE_${plan.archetype}`,
      difficulty: plan.tier === 'BEGINNER' ? 'EASY' : (plan.tier === 'INTERMEDIATE' ? 'MEDIUM' : 'HARD'),
      obstacles,
      collectibles,
      entryLanes: [plan.entryLane],
      exitLanes: [plan.exitLane],
      requiredActions: ['JUMP', ...(plan.transfers.some((t) => t.kind === 'LATERAL_JUMP') ? ['LANE_CHANGE' as const] : [])],
      safeRoutes: `Rooftop route ${plan.archetype} starting at lane ${plan.entryLane} to exit lane ${plan.exitLane}`
    };
  }
}
