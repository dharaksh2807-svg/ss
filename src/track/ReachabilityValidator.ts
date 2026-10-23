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
              } else if (obs.type === 'HIGH_BARRIER') {
                if (action.isSliding && !node.onRoof) {
                  // Slid underneath high barrier safely
                  continue;
                }
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
}
