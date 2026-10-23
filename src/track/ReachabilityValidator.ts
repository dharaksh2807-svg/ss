import { CONSTANTS, LaneIndex } from '../core/Constants';
import { ObstacleType } from './ObstacleFactory';

export interface ValidatedObstacle {
  type: ObstacleType;
  lane: LaneIndex;
  zOffset: number;
  length?: number;
  hasRamp?: boolean;
  isMoving?: boolean;
  velocityZ?: number;
}

export interface ValidatedPattern {
  name: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | 'EASY' | 'MEDIUM' | 'HARD';
  obstacles: ValidatedObstacle[];
  entryLanes?: LaneIndex[];
  exitLanes?: LaneIndex[];
  minReactionDist?: number;
  speedMin?: number;
  speedMax?: number;
}

export interface ReachabilityResult {
  solvable: boolean;
  reason?: string;
  minReactionTimeSeconds?: number;
  survivingExitLanes?: LaneIndex[];
}

/**
 * ReachabilityValidator
 * Rigorous physical trajectory validator guaranteeing that generated obstacle patterns
 * have at least one reachable, collision-free human solution across all supported speeds.
 */
export class ReachabilityValidator {
  /**
   * Validates reachability across a single pattern or chunk at a given player forward speed.
   */
  public static validatePattern(
    pattern: ValidatedPattern,
    speed: number = CONSTANTS.INITIAL_SPEED,
    initialLanes: LaneIndex[] = [-1, 0, 1]
  ): ReachabilityResult {
    const chunkLen = CONSTANTS.CHUNK_LENGTH;
    const zStep = 1.0; // 1-meter spatial resolution
    const dtPerMeter = 1.0 / speed;

    interface TrajectoryNode {
      lane: LaneIndex;
      onRoof: boolean;
      airborneTimer: number; // Seconds remaining in jump airtime
      slidingTimer: number;  // Seconds remaining in slide
      lateralCooldown: number; // Seconds until next lane change can occur
    }

    // Initialize state set with allowed entry lanes
    let currentNodes: TrajectoryNode[] = initialLanes.map((lane) => ({
      lane,
      onRoof: false,
      airborneTimer: 0,
      slidingTimer: 0,
      lateralCooldown: 0
    }));

    // Precalculate moving train Z trajectories at each meter slice
    for (let z = 0; z < chunkLen; z += zStep) {
      const timeElapsed = z * dtPerMeter;
      const nextNodes: TrajectoryNode[] = [];

      for (const node of currentNodes) {
        // Decrease jump, slide, and lateral transition timers
        const updatedAirTimer = Math.max(0, node.airborneTimer - dtPerMeter);
        const updatedSlideTimer = Math.max(0, node.slidingTimer - dtPerMeter);
        const updatedLateralCooldown = Math.max(0, node.lateralCooldown - dtPerMeter);

        // Allowed lateral actions from current state:
        // 1. Remain in current lane
        const allowedTransitions: Array<{ targetLane: LaneIndex; newCooldown: number }> = [
          { targetLane: node.lane, newCooldown: updatedLateralCooldown }
        ];

        // 2. If lane transition cooldown has elapsed, can shift to adjacent lanes
        if (updatedLateralCooldown <= 0) {
          if (node.lane > -1) {
            allowedTransitions.push({ targetLane: (node.lane - 1) as LaneIndex, newCooldown: CONSTANTS.LANE_CHANGE_DURATION });
          }
          if (node.lane < 1) {
            allowedTransitions.push({ targetLane: (node.lane + 1) as LaneIndex, newCooldown: CONSTANTS.LANE_CHANGE_DURATION });
          }
        }

        // Test each possible target lane & action combination (Run, Jump, Slide)
        for (const transition of allowedTransitions) {
          const targetLane = transition.targetLane;

          // Check collision with obstacles at coordinate (targetLane, z)
          const obstaclesAtLocation = pattern.obstacles.filter((obs) => {
            if (obs.lane !== targetLane) return false;

            let obsStart = obs.zOffset;
            let obsEnd = obsStart + (obs.length || 2.0);

            // If moving train, calculate adjusted position at timeElapsed
            if (obs.type === 'MOVING_TRAIN' || obs.isMoving) {
              const advanceDist = (obs.velocityZ || CONSTANTS.MOVING_TRAIN_SPEED) * timeElapsed;
              obsStart = Math.max(0, obs.zOffset - advanceDist);
              obsEnd = obsStart + (obs.length || CONSTANTS.TRAIN_LENGTH_SHORT);
            }

            return z >= obsStart && z <= obsEnd;
          });

          // Possible action modes: RUN, JUMP, SLIDE
          const actionsToTest: Array<{ isAirborne: boolean; isSliding: boolean }> = [
            { isAirborne: updatedAirTimer > 0, isSliding: updatedSlideTimer > 0 }, // Continue current
            { isAirborne: true, isSliding: false }, // Jump action
            { isAirborne: false, isSliding: true }  // Slide action
          ];

          for (const action of actionsToTest) {
            let collision = false;
            let climbedRoof = false;

            for (const obs of obstaclesAtLocation) {
              if (obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN' || obs.type === 'TRAIN_RAMP') {
                const hasRamp = !!(obs.hasRamp || obs.type === 'TRAIN_RAMP');
                if (hasRamp && z <= obs.zOffset + CONSTANTS.TRAIN_RAMP_LENGTH) {
                  // Running up ramp onto roof is safe!
                  climbedRoof = true;
                  continue;
                }
                if (node.onRoof) {
                  // Already running on roof
                  climbedRoof = true;
                  continue;
                }
                // Ground collision with train hull
                collision = true;
                break;
              } else if (obs.type === 'LOW_BARRIER') {
                if (action.isAirborne || node.onRoof) {
                  // Jumped over low hurdle safely
                  continue;
                }
                collision = true;
                break;
              } else if (obs.type === 'MEDIUM_BARRIER') {
                if (action.isAirborne || node.onRoof) {
                  // Jumped over medium barrier safely
                  continue;
                }
                collision = true;
                break;
              } else if (obs.type === 'HIGH_BARRIER') {
                if (action.isSliding && !node.onRoof) {
                  // Slid underneath high barrier safely
                  continue;
                }
                // Normal jumping into high barrier hits overhead crossbar
                collision = true;
                break;
              } else if (obs.type === 'PILLAR') {
                // Solid vertical pillar blocks lane completely from ground to ceiling
                collision = true;
                break;
              } else if (obs.type === 'SIDE_BARRIER') {
                // Side barrier occupies lane completely
                collision = true;
                break;
              } else if (obs.type === 'TUNNEL_ARCH') {
                if (action.isAirborne || node.onRoof) {
                  // Hit overhead tunnel truss
                  collision = true;
                  break;
                }
                if (action.isSliding) {
                  // Cleared underneath tunnel arch
                  continue;
                }
                collision = true;
                break;
              }
            }

            if (!collision) {
              nextNodes.push({
                lane: targetLane,
                onRoof: climbedRoof || node.onRoof,
                airborneTimer: action.isAirborne ? (updatedAirTimer > 0 ? updatedAirTimer : CONSTANTS.JUMP_DURATION) : 0,
                slidingTimer: action.isSliding ? (updatedSlideTimer > 0 ? updatedSlideTimer : CONSTANTS.SLIDE_DURATION) : 0,
                lateralCooldown: transition.newCooldown
              });
            }
          }
        }
      }

      // Deduplicate trajectory states at this Z slice
      const stateMap = new Map<string, TrajectoryNode>();
      for (const n of nextNodes) {
        const key = `${n.lane}_${n.onRoof}_${n.airborneTimer > 0}_${n.slidingTimer > 0}_${n.lateralCooldown > 0}`;
        if (!stateMap.has(key)) {
          stateMap.set(key, n);
        }
      }
      currentNodes = Array.from(stateMap.values());

      // If at any Z slice no valid trajectories survive, pattern is physically blocked
      if (currentNodes.length === 0) {
        return {
          solvable: false,
          reason: `Pattern "${pattern.name}" becomes impassable at distance z = ${z.toFixed(1)}m at speed ${speed.toFixed(1)}m/s!`
        };
      }
    }

    const survivingExitLanes = Array.from(new Set(currentNodes.map((n) => n.lane)));

    return {
      solvable: true,
      minReactionTimeSeconds: (pattern.minReactionDist || 25.0) / speed,
      survivingExitLanes
    };
  }

  /**
   * Validates multi-chunk transition reachability between consecutive chunks:
   * Guarantees that at least one surviving exit lane of chunk A can reach
   * an entry lane of chunk B without unavoidable collision.
   */
  public static validateChunkTransition(
    chunkA: ValidatedPattern,
    chunkB: ValidatedPattern,
    speed: number = CONSTANTS.INITIAL_SPEED
  ): boolean {
    const resA = this.validatePattern(chunkA, speed);
    if (!resA.solvable || !resA.survivingExitLanes || resA.survivingExitLanes.length === 0) {
      return false;
    }

    // Validate chunk B starting strictly from the surviving exit lanes of chunk A
    const resB = this.validatePattern(chunkB, speed, resA.survivingExitLanes);
    return resB.solvable;
  }

  /**
   * Validates that all collectibles in a pattern are physically safe,
   * reachable, and never lure the player into unavoidable collisions.
   */
  public static validateCollectibleReachability(
    pattern: {
      name: string;
      obstacles: ValidatedObstacle[];
      collectibles?: Array<{
        type: string;
        lane: LaneIndex;
        zOffset: number;
        yOffset?: number;
        startYOffset?: number;
        endYOffset?: number;
        count?: number;
        spacing?: number;
        isArc?: boolean;
        isRampAscent?: boolean;
        endLane?: LaneIndex;
        isSlideGuidance?: boolean;
        isRiskRoute?: boolean;
        isPostObstacle?: boolean;
      }>;
    },
    speed: number = CONSTANTS.INITIAL_SPEED
  ): { valid: boolean; reason?: string } {
    if (!pattern.collectibles || pattern.collectibles.length === 0) {
      return { valid: true };
    }

    for (const col of pattern.collectibles) {
      const count = col.count || 1;
      const spacing = col.spacing || CONSTANTS.COIN_DEFAULT_SPACING;

      // Verify lane-switch length provides sufficient reaction distance
      if (col.endLane !== undefined && col.endLane !== col.lane) {
        const lateralDistance = Math.abs(col.endLane - col.lane);
        const forwardDistance = count * spacing;
        const timeToTraverse = forwardDistance / speed;
        const requiredTime = lateralDistance * CONSTANTS.LANE_CHANGE_DURATION * 0.75; // 75% margin
        if (timeToTraverse < requiredTime && speed <= 30.0) {
          return {
            valid: false,
            reason: `Lane-switch trail in "${pattern.name}" from lane ${col.lane} to ${col.endLane} has insufficient forward distance (${forwardDistance.toFixed(1)}m) for speed ${speed}m/s`
          };
        }
      }

      for (let c = 0; c < count; c++) {
        const z = col.zOffset + c * spacing;
        const t = count > 1 ? c / (count - 1) : 0;

        let y = col.yOffset !== undefined ? col.yOffset : (col.isSlideGuidance ? CONSTANTS.COIN_SLIDE_Y : CONSTANTS.COIN_GROUND_Y);
        if (col.isArc && count > 1) {
          const startY = col.startYOffset !== undefined 
            ? col.startYOffset 
            : (col.yOffset && col.yOffset > 4.0 ? CONSTANTS.COIN_ROOFTOP_Y : CONSTANTS.COIN_GROUND_Y);
          const endY = col.endYOffset !== undefined ? col.endYOffset : startY;
          const peak = col.yOffset !== undefined ? col.yOffset : (startY + CONSTANTS.JUMP_HEIGHT);
          const peakBoost = Math.max(0, peak - Math.max(startY, endY));
          const baseline = startY + t * (endY - startY);
          y = baseline + peakBoost * 4.0 * t * (1.0 - t);
        } else if (col.isRampAscent && count > 1) {
          const groundY = CONSTANTS.COIN_GROUND_Y;
          const roofY = col.endYOffset !== undefined ? col.endYOffset : (col.yOffset !== undefined ? col.yOffset : CONSTANTS.COIN_ROOFTOP_Y);
          y = groundY + t * (roofY - groundY);
        }

        const lane = col.endLane !== undefined ? (t >= 0.5 ? col.endLane : col.lane) : col.lane;

        // Check against each obstacle in this pattern
        for (const obs of pattern.obstacles) {
          if (obs.lane !== lane) continue;

          const obsStart = obs.zOffset;
          const obsLength = obs.length || (obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN' ? CONSTANTS.TRAIN_LENGTH_SHORT : 2.0);
          const obsEnd = obsStart + obsLength;

          // If moving train, calculate position at time elapsed
          let effStart = obsStart;
          let effEnd = obsEnd;
          if (obs.type === 'MOVING_TRAIN' || obs.isMoving) {
            const timeToZ = z / speed;
            const advanceDist = (obs.velocityZ || CONSTANTS.MOVING_TRAIN_SPEED) * timeToZ;
            effStart = Math.max(0, obsStart - advanceDist);
            effEnd = effStart + obsLength;
          }

          if (z >= effStart - 0.2 && z <= effEnd + 0.2) {
            const isTrain = obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN' || obs.type === 'TRAIN_RAMP';
            const hasRamp = !!(obs.hasRamp || obs.type === 'TRAIN_RAMP');

            if (isTrain) {
              if (hasRamp && z <= obsStart + CONSTANTS.TRAIN_RAMP_LENGTH + 0.5) {
                if (y < 0.70) {
                  return {
                    valid: false,
                    reason: `Coin in "${pattern.name}" at z=${z.toFixed(1)}m in lane ${lane} too low on train ramp (y=${y.toFixed(2)}m)`
                  };
                }
                continue;
              }

              if (y < 4.8) {
                return {
                  valid: false,
                  reason: `Lethal coin placement in "${pattern.name}": Coin at z=${z.toFixed(1)}m in lane ${lane} inside solid train body (y=${y.toFixed(2)}m)`
                };
              }
            } else if (obs.type === 'PILLAR') {
              return {
                valid: false,
                reason: `Lethal coin placement in "${pattern.name}": Coin at z=${z.toFixed(1)}m inside solid railway pillar in lane ${lane}`
              };
            } else if (obs.type === 'MEDIUM_BARRIER') {
              if (y < 1.85) {
                return {
                  valid: false,
                  reason: `Coin in "${pattern.name}" at z=${z.toFixed(1)}m too low for medium barrier in lane ${lane} (y=${y.toFixed(2)}m)`
                };
              }
            } else if (obs.type === 'SIDE_BARRIER') {
              return {
                valid: false,
                reason: `Lethal coin placement in "${pattern.name}": Coin at z=${z.toFixed(1)}m inside side barrier in lane ${lane}`
              };
            } else if (obs.type === 'HIGH_BARRIER' || obs.type === 'TUNNEL_ARCH') {
              if (y > 0.75 && y < 4.0) {
                return {
                  valid: false,
                  reason: `Coin in "${pattern.name}" at z=${z.toFixed(1)}m hits overhead obstacle in lane ${lane} (y=${y.toFixed(2)}m)`
                };
              }
            }
          }
        }
      }
    }

    return { valid: true };
  }
}
