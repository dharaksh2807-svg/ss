import { CONSTANTS, LaneIndex } from '../core/Constants';
import { CollectibleType } from './CollectibleFactory';
import { PatternObstacle } from './ObstaclePatterns';

export type CoinPatternArchetype =
  | 'STRAIGHT_TRAIL'
  | 'JUMP_ARC'
  | 'SLIDE_GUIDANCE'
  | 'LANE_SWITCH'
  | 'TRAIN_ROOFTOP'
  | 'RISK_REWARD'
  | 'POST_OBSTACLE'
  | 'JETPACK_AERIAL';

export interface PatternCollectible {
  type: CollectibleType;
  lane: LaneIndex;
  zOffset: number;
  yOffset?: number; // Ground level (0.85), hurdle arch (2.2-2.45), slide (0.60), or train roof (5.20)
  startYOffset?: number; // For physical jump arcs with custom start support
  endYOffset?: number; // For physical jump arcs with custom landing support (e.g. roof to ground)
  count?: number; // Number of coins in sequence
  spacing?: number; // Spacing in meters between consecutive coins
  isArc?: boolean; // Ballistic parabolic jump arc
  isRampAscent?: boolean; // Ramp incline from ground to rooftop
  endLane?: LaneIndex; // For lane switch trails: smooth interpolation from lane to endLane
  isSlideGuidance?: boolean; // Slide guidance trail positioned at 0.60m
  isRiskRoute?: boolean; // High-risk optional branch offering enhanced reward
  isPostObstacle?: boolean; // Immediate reward burst upon obstacle clearance
  archetype?: CoinPatternArchetype;
  supportSurface?: 'GROUND' | 'TRAIN_ROOF';
  landingSurface?: 'GROUND' | 'TRAIN_ROOF';
  jumpType?: 'NORMAL' | 'SUPER_SNEAKERS';
  isSuperJump?: boolean;
}

export interface RiskRewardBranchOptions {
  safeLane: LaneIndex;
  safeZ: number;
  safeCount?: number;
  safeSpacing?: number;
  riskLane: LaneIndex;
  riskZ: number;
  riskCount?: number;
  riskSpacing?: number;
  riskPowerup?: CollectibleType;
  riskPowerupZ?: number;
}

/**
 * Physical Jump Kinematics Profile
 * Encapsulates the active jump physics of the runner:
 * initial vertical velocity, gravity, air time, peak height, forward speed,
 * horizontal travel distance, collider height, and coin pickup radius.
 */
export interface JumpPhysicsProfile {
  initialVerticalVelocity: number;
  gravity: number;
  airTime: number;
  peakHeightAboveTakeoff: number;
  forwardSpeed: number;
  horizontalDistance: number;
  colliderHeight: number;
  coinPickupRadius: number;
  takeoffSupportY: number;
  landingSupportY: number;
  takeoffCoinY: number;
  landingCoinY: number;
  apexCoinY: number;
  takeoffZ: number;
  apexZ: number;
  landingZ: number;
  timeToApex: number;
}

export interface PhysicalJumpArcOptions {
  lane: LaneIndex;
  hurdleZ: number;
  obstacleHeight?: number;
  obstacleLength?: number;
  speed?: number;
  jumpType?: 'NORMAL' | 'SUPER_SNEAKERS';
  supportSurface?: 'GROUND' | 'TRAIN_ROOF';
  landingSurface?: 'GROUND' | 'TRAIN_ROOF';
  count?: number;
  spacing?: number;
}

/**
 * CoinPatternLibrary
 * Data-driven generator and validator for physically reachable, balanced,
 * and visually intentional collectible routes across all archetypes.
 */
export class CoinPatternLibrary {
  /**
   * 1. Straight Trail: Aligned along one safe lane at standard running height (0.85m).
   */
  public static createStraightTrail(
    lane: LaneIndex,
    zOffset: number,
    count: number = 6,
    spacing: number = CONSTANTS.COIN_DEFAULT_SPACING,
    yOffset: number = CONSTANTS.COIN_GROUND_Y
  ): PatternCollectible {
    return {
      type: 'COIN',
      lane,
      zOffset,
      yOffset,
      count,
      spacing,
      archetype: 'STRAIGHT_TRAIL'
    };
  }

  /**
   * 2. Jump Arc: Parabolic curve positioned along feasible jump trajectory over a hurdle or gap.
   * Automatically centers the arc apex directly above hurdleZ.
   */
  public static createJumpArc(
    lane: LaneIndex,
    hurdleZ: number,
    count: number = 4,
    spacing: number = CONSTANTS.COIN_ARC_SPACING,
    peakY: number = CONSTANTS.COIN_JUMP_PEAK_Y
  ): PatternCollectible {
    const arcSpan = (count - 1) * spacing;
    const startZ = Math.max(0, hurdleZ - arcSpan / 2);
    return {
      type: 'COIN',
      lane,
      zOffset: Math.round(startZ * 10) / 10,
      yOffset: peakY,
      count,
      spacing,
      isArc: true,
      archetype: 'JUMP_ARC'
    };
  }

  /**
   * Calculate Active Jump Physics Profile
   * Derives authoritative ballistic trajectory values from active Player & World Constants.
   */
  public static calculateJumpPhysics(options: {
    speed?: number;
    jumpType?: 'NORMAL' | 'SUPER_SNEAKERS';
    supportSurface?: 'GROUND' | 'TRAIN_ROOF';
    landingSurface?: 'GROUND' | 'TRAIN_ROOF';
    hurdleZ?: number;
  }): JumpPhysicsProfile {
    const isSuper = options.jumpType === 'SUPER_SNEAKERS';
    const v0 = CONSTANTS.JUMP_INITIAL_VELOCITY * (isSuper ? CONSTANTS.SUPER_JUMP_MULTIPLIER : 1.0);
    const g = CONSTANTS.GRAVITY;
    const speed = options.speed || CONSTANTS.INITIAL_SPEED;

    const takeoffSupportY = options.supportSurface === 'TRAIN_ROOF' ? 4.35 : CONSTANTS.PLAYER_BASE_Y;
    const landingSupportY = options.landingSurface === 'TRAIN_ROOF' ? 4.35 : (options.landingSurface === 'GROUND' ? CONSTANTS.PLAYER_BASE_Y : takeoffSupportY);

    const deltaY = landingSupportY - takeoffSupportY;
    // Ballistic airtime: 0.5 * g * T^2 - v0 * T + deltaY = 0
    const discriminant = v0 * v0 - 2 * g * deltaY;
    const airTime = discriminant >= 0 ? (v0 + Math.sqrt(discriminant)) / g : (2 * v0) / g;
    const timeToApex = v0 / g;
    const peakHeightAboveTakeoff = (v0 * v0) / (2 * g);
    const horizontalDistance = speed * airTime;

    const takeoffCoinY = options.supportSurface === 'TRAIN_ROOF' ? CONSTANTS.COIN_ROOFTOP_Y : CONSTANTS.COIN_GROUND_Y;
    const landingCoinY = options.landingSurface === 'TRAIN_ROOF' ? CONSTANTS.COIN_ROOFTOP_Y : (options.landingSurface === 'GROUND' ? CONSTANTS.COIN_GROUND_Y : takeoffCoinY);
    const apexCoinY = takeoffCoinY + Math.min(peakHeightAboveTakeoff, isSuper ? 3.5 : 1.50);

    const hurdleZ = options.hurdleZ || 0;
    const apexZ = hurdleZ;
    const takeoffZ = apexZ - speed * timeToApex;
    const landingZ = takeoffZ + horizontalDistance;

    return {
      initialVerticalVelocity: v0,
      gravity: g,
      airTime,
      peakHeightAboveTakeoff,
      forwardSpeed: speed,
      horizontalDistance,
      colliderHeight: CONSTANTS.PLAYER_HEIGHT_RUN,
      coinPickupRadius: CONSTANTS.COIN_RADIUS,
      takeoffSupportY,
      landingSupportY,
      takeoffCoinY,
      landingCoinY,
      apexCoinY,
      takeoffZ,
      apexZ,
      landingZ,
      timeToApex
    };
  }

  /**
   * Create Physically-Calibrated Jump Arc
   * Generates coin placements along an achievable jump trajectory based on active physics.
   */
  public static createPhysicalJumpArc(options: PhysicalJumpArcOptions): PatternCollectible {
    const physics = this.calculateJumpPhysics({
      speed: options.speed,
      jumpType: options.jumpType,
      supportSurface: options.supportSurface,
      landingSurface: options.landingSurface,
      hurdleZ: options.hurdleZ
    });

    const isSuper = options.jumpType === 'SUPER_SNEAKERS';
    const count = options.count || (isSuper ? 6 : 4);
    const spacing = options.spacing || CONSTANTS.COIN_ARC_SPACING;
    const arcSpan = (count - 1) * spacing;
    const startZ = Math.max(0, options.hurdleZ - arcSpan / 2);

    return {
      type: 'COIN',
      lane: options.lane,
      zOffset: Math.round(startZ * 10) / 10,
      yOffset: Math.round(physics.apexCoinY * 100) / 100,
      startYOffset: physics.takeoffCoinY,
      endYOffset: physics.landingCoinY,
      count,
      spacing,
      isArc: true,
      archetype: 'JUMP_ARC',
      supportSurface: options.supportSurface || 'GROUND',
      landingSurface: options.landingSurface || options.supportSurface || 'GROUND',
      jumpType: options.jumpType || 'NORMAL',
      isSuperJump: isSuper
    };
  }

  /**
   * Create Train Rooftop Jump Arc (jump over rooftop AC unit, hurdle, or gap between train cars)
   */
  public static createRooftopJumpArc(
    lane: LaneIndex,
    hurdleZ: number,
    count: number = 4,
    spacing: number = CONSTANTS.COIN_ARC_SPACING,
    isSuperJump: boolean = false
  ): PatternCollectible {
    const arcSpan = (count - 1) * spacing;
    const startZ = Math.max(0, hurdleZ - arcSpan / 2);
    const apexBoost = isSuperJump ? 2.2 : 1.5;
    return {
      type: 'COIN',
      lane,
      zOffset: Math.round(startZ * 10) / 10,
      yOffset: CONSTANTS.COIN_ROOFTOP_Y + apexBoost,
      startYOffset: CONSTANTS.COIN_ROOFTOP_Y,
      endYOffset: CONSTANTS.COIN_ROOFTOP_Y,
      count,
      spacing,
      isArc: true,
      archetype: 'JUMP_ARC',
      supportSurface: 'TRAIN_ROOF',
      landingSurface: 'TRAIN_ROOF',
      jumpType: isSuperJump ? 'SUPER_SNEAKERS' : 'NORMAL',
      isSuperJump
    };
  }

  /**
   * Create Rooftop-to-Ground Descents: Ballistic jump arc leaping from train roof down to track level
   */
  public static createRooftopToGroundArc(
    lane: LaneIndex,
    roofEndZ: number,
    count: number = 5,
    spacing: number = 2.0
  ): PatternCollectible {
    return {
      type: 'COIN',
      lane,
      zOffset: Math.round(roofEndZ * 10) / 10,
      yOffset: CONSTANTS.COIN_ROOFTOP_Y + 0.8,
      startYOffset: CONSTANTS.COIN_ROOFTOP_Y,
      endYOffset: CONSTANTS.COIN_GROUND_Y,
      count,
      spacing,
      isArc: true,
      archetype: 'JUMP_ARC',
      supportSurface: 'TRAIN_ROOF',
      landingSurface: 'GROUND'
    };
  }

  /**
   * 3. Slide Guidance: Low-profile trail (0.60m) leading into, under, and out of a slide obstacle.
   */
  public static createSlideGuidance(
    lane: LaneIndex,
    barrierZ: number,
    count: number = 5,
    spacing: number = 1.8,
    yOffset: number = CONSTANTS.COIN_SLIDE_Y
  ): PatternCollectible {
    const span = (count - 1) * spacing;
    const startZ = Math.max(0, barrierZ - span / 2);
    return {
      type: 'COIN',
      lane,
      zOffset: Math.round(startZ * 10) / 10,
      yOffset,
      count,
      spacing,
      isSlideGuidance: true,
      archetype: 'SLIDE_GUIDANCE'
    };
  }

  /**
   * 4. Lane-Switch Trail: Smooth S-curve transition between adjacent lanes.
   */
  public static createLaneSwitchTrail(
    startLane: LaneIndex,
    endLane: LaneIndex,
    zOffset: number,
    count: number = 5,
    spacing: number = CONSTANTS.COIN_DEFAULT_SPACING,
    yOffset: number = CONSTANTS.COIN_GROUND_Y
  ): PatternCollectible {
    return {
      type: 'COIN',
      lane: startLane,
      endLane,
      zOffset,
      yOffset,
      count,
      spacing,
      archetype: 'LANE_SWITCH'
    };
  }

  /**
   * 5. Train Rooftop Rewards: Coins arranged on valid rooftop paths safely above train roof geometry (5.20m).
   */
  public static createTrainRooftopTrail(
    lane: LaneIndex,
    trainZ: number,
    trainLength: number,
    hasRamp: boolean = false
  ): PatternCollectible[] {
    const collectibles: PatternCollectible[] = [];

    if (hasRamp) {
      collectibles.push({
        type: 'COIN',
        lane,
        zOffset: Math.max(0, trainZ - 1.0),
        yOffset: CONSTANTS.COIN_ROOFTOP_Y,
        count: 4,
        spacing: 2.0,
        isRampAscent: true,
        archetype: 'TRAIN_ROOFTOP'
      });

      const spineStart = trainZ + CONSTANTS.TRAIN_RAMP_LENGTH + 0.5;
      const spineLength = trainLength - (CONSTANTS.TRAIN_RAMP_LENGTH + 1.5);
      const count = Math.max(3, Math.floor(spineLength / 2.2));
      collectibles.push({
        type: 'COIN',
        lane,
        zOffset: Math.round(spineStart * 10) / 10,
        yOffset: CONSTANTS.COIN_ROOFTOP_Y,
        count,
        spacing: 2.2,
        archetype: 'TRAIN_ROOFTOP'
      });
    } else {
      const spineStart = trainZ + 2.0;
      const spineLength = trainLength - 4.0;
      const count = Math.max(4, Math.floor(spineLength / 2.2));
      collectibles.push({
        type: 'COIN',
        lane,
        zOffset: Math.round(spineStart * 10) / 10,
        yOffset: CONSTANTS.COIN_ROOFTOP_Y,
        count,
        spacing: 2.2,
        archetype: 'TRAIN_ROOFTOP'
      });
    }

    return collectibles;
  }

  /**
   * 6. Risk/Reward Alternatives
   */
  public static createRiskRewardBranch(options: RiskRewardBranchOptions): PatternCollectible[] {
    const collectibles: PatternCollectible[] = [];

    const safeCount = options.safeCount || 4;
    collectibles.push({
      type: 'COIN',
      lane: options.safeLane,
      zOffset: options.safeZ,
      yOffset: CONSTANTS.COIN_GROUND_Y,
      count: safeCount,
      spacing: options.safeSpacing || CONSTANTS.COIN_DEFAULT_SPACING,
      isRiskRoute: false,
      archetype: 'RISK_REWARD'
    });

    const riskCount = options.riskCount || Math.round(safeCount * CONSTANTS.COIN_RISK_REWARD_RATIO);
    collectibles.push({
      type: 'COIN',
      lane: options.riskLane,
      zOffset: options.riskZ,
      yOffset: CONSTANTS.COIN_GROUND_Y,
      count: riskCount,
      spacing: options.riskSpacing || CONSTANTS.COIN_DEFAULT_SPACING,
      isRiskRoute: true,
      archetype: 'RISK_REWARD'
    });

    if (options.riskPowerup && options.riskPowerupZ !== undefined) {
      collectibles.push({
        type: options.riskPowerup,
        lane: options.riskLane,
        zOffset: options.riskPowerupZ,
        yOffset: CONSTANTS.COIN_GROUND_Y + 0.15,
        isRiskRoute: true,
        archetype: 'RISK_REWARD'
      });
    }

    return collectibles;
  }

  /**
   * 7. Post-Obstacle Reward
   */
  public static createPostObstacleReward(
    lane: LaneIndex,
    obstacleEndZ: number,
    count: number = CONSTANTS.COIN_POST_OBSTACLE_COUNT,
    spacing: number = 1.8
  ): PatternCollectible {
    return {
      type: 'COIN',
      lane,
      zOffset: Math.round((obstacleEndZ + 1.6) * 10) / 10,
      yOffset: CONSTANTS.COIN_GROUND_Y,
      count,
      spacing,
      isPostObstacle: true,
      archetype: 'POST_OBSTACLE'
    };
  }

  /**
   * 8. Jetpack Aerial Trail Metadata
   */
  public static getJetpackAerialTrailInfo(): {
    flightAltitude: number;
    spacing: number;
    safeLandingRunway: number;
    poolSize: number;
  } {
    return {
      flightAltitude: CONSTANTS.JETPACK_ALTITUDE,
      spacing: CONSTANTS.JETPACK_COIN_SPACING,
      safeLandingRunway: CONSTANTS.JETPACK_SAFE_LANDING_RUNWAY,
      poolSize: CONSTANTS.JETPACK_AERIAL_POOL_SIZE
    };
  }

  /**
   * Verify that every coin along a jump arc is physically reachable
   * along at least one legal jump trajectory, and never clips barriers.
   */
  public static verifyJumpArcReachability(
    arc: PatternCollectible,
    speed: number = CONSTANTS.INITIAL_SPEED,
    jumpType: 'NORMAL' | 'SUPER_SNEAKERS' = 'NORMAL'
  ): { reachable: boolean; reason?: string } {
    const count = arc.count || 4;
    const spacing = arc.spacing || CONSTANTS.COIN_ARC_SPACING;
    const startY = arc.startYOffset !== undefined 
      ? arc.startYOffset 
      : (arc.supportSurface === 'TRAIN_ROOF' || (arc.yOffset && arc.yOffset > 4.0) ? CONSTANTS.COIN_ROOFTOP_Y : CONSTANTS.COIN_GROUND_Y);
    const endY = arc.endYOffset !== undefined ? arc.endYOffset : startY;
    const peak = arc.yOffset !== undefined ? arc.yOffset : (startY + 1.50);
    const peakBoost = Math.max(0, peak - Math.max(startY, endY));

    const isSuper = jumpType === 'SUPER_SNEAKERS' || arc.isSuperJump;
    const v0 = CONSTANTS.JUMP_INITIAL_VELOCITY * (isSuper ? CONSTANTS.SUPER_JUMP_MULTIPLIER : 1.0);
    const g = CONSTANTS.GRAVITY;
    const maxJumpRise = (v0 * v0) / (2 * g);

    for (let c = 0; c < count; c++) {
      const t = count > 1 ? c / (count - 1) : 0;
      const baseline = startY + t * (endY - startY);
      const coinY = baseline + peakBoost * 4.0 * t * (1.0 - t);

      // Verify coin is within maximum jump envelope
      const maxPossibleY = startY + maxJumpRise + 0.5; // with player torso margin
      if (coinY > maxPossibleY) {
        return {
          reachable: false,
          reason: `Coin ${c} height (${coinY.toFixed(2)}m) exceeds maximum possible jump rise (${maxPossibleY.toFixed(2)}m)`
        };
      }

      // Verify coin does not clip into ceiling
      if (coinY > CONSTANTS.TUNNEL_CEILING_HEIGHT - 0.3) {
        return {
          reachable: false,
          reason: `Coin ${c} height (${coinY.toFixed(2)}m) clips tunnel ceiling (${CONSTANTS.TUNNEL_CEILING_HEIGHT}m)`
        };
      }
    }

    return { reachable: true };
  }

  /**
   * Rigorous Safety & Clearance Validator:
   * Verifies that collectible coins never intersect lethal obstacle geometry
   */
  public static validateCollectibleSafety(
    col: PatternCollectible,
    obstacles: PatternObstacle[]
  ): { valid: boolean; reason?: string } {
    const count = col.count || 1;
    const spacing = col.spacing || CONSTANTS.COIN_DEFAULT_SPACING;

    for (let c = 0; c < count; c++) {
      const z = col.zOffset + c * spacing;
      const t = count > 1 ? c / (count - 1) : 0;

      let y = col.yOffset !== undefined ? col.yOffset : (col.isSlideGuidance ? CONSTANTS.COIN_SLIDE_Y : CONSTANTS.COIN_GROUND_Y);
      if (col.isArc && count > 1) {
        const startY = col.startYOffset !== undefined ? col.startYOffset : (col.yOffset && col.yOffset > 4.0 ? CONSTANTS.COIN_ROOFTOP_Y : CONSTANTS.COIN_GROUND_Y);
        const endY = col.endYOffset !== undefined ? col.endYOffset : startY;
        const peak = col.yOffset !== undefined ? col.yOffset : (startY + 1.50);
        const peakBoost = Math.max(0, peak - Math.max(startY, endY));
        const baseline = startY + t * (endY - startY);
        y = baseline + peakBoost * 4.0 * t * (1.0 - t);
      } else if (col.isRampAscent && count > 1) {
        const groundY = CONSTANTS.COIN_GROUND_Y;
        const roofY = col.endYOffset !== undefined ? col.endYOffset : (col.yOffset !== undefined ? col.yOffset : CONSTANTS.COIN_ROOFTOP_Y);
        y = groundY + t * (roofY - groundY);
      }

      const lane = col.endLane !== undefined ? (t >= 0.5 ? col.endLane : col.lane) : col.lane;

      for (const obs of obstacles) {
        if (obs.lane !== lane) continue;

        const obsStart = obs.zOffset;
        const obsLength = obs.length || (obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN' ? CONSTANTS.TRAIN_LENGTH_SHORT : 2.0);
        const obsEnd = obsStart + obsLength;

        if (z >= obsStart - 0.2 && z <= obsEnd + 0.2) {
          const isTrain = obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN' || obs.type === 'TRAIN_RAMP';
          const hasRamp = !!(obs.hasRamp || obs.type === 'TRAIN_RAMP');

          if (isTrain) {
            if (hasRamp && z <= obsStart + CONSTANTS.TRAIN_RAMP_LENGTH + 0.5) {
              if (y < 0.70) {
                return {
                  valid: false,
                  reason: `Coin at z=${z.toFixed(1)}m in lane ${lane} too low on train ramp (y=${y.toFixed(2)}m)`
                };
              }
              continue;
            }

            if (y < 4.8) {
              return {
                valid: false,
                reason: `Lethal coin placement: Coin at z=${z.toFixed(1)}m in lane ${lane} inside solid train body (y=${y.toFixed(2)}m)`
              };
            }
          } else if (obs.type === 'PILLAR') {
            return {
              valid: false,
              reason: `Lethal coin placement: Coin at z=${z.toFixed(1)}m inside solid railway pillar in lane ${lane}`
            };
          } else if (obs.type === 'SIDE_BARRIER') {
            return {
              valid: false,
              reason: `Lethal coin placement: Coin at z=${z.toFixed(1)}m inside side barrier in lane ${lane}`
            };
          } else if (obs.type === 'HIGH_BARRIER' || obs.type === 'TUNNEL_ARCH') {
            if (y > 0.75 && y < 4.0) {
              return {
                valid: false,
                reason: `Coin at z=${z.toFixed(1)}m hits overhead obstacle in lane ${lane} (y=${y.toFixed(2)}m)`
              };
            }
          }
        }
      }
    }

    return { valid: true };
  }
}
