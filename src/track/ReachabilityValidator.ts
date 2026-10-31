import { CONSTANTS, LaneIndex } from '../core/Constants';
import { ObstacleType } from './ObstacleFactory';
import { RooftopRoutePlan } from './RooftopRoutePlanner';

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

export interface TrajectoryNodeState {
  lane: LaneIndex;
  onRoof: boolean;
  supportRouteLegId?: string;
  supportLane?: LaneIndex;
  airborneFromRoof?: boolean;
  airborneTimer: number; // Seconds remaining in jump airtime
  slidingTimer: number;  // Seconds remaining in slide
  lateralCooldown: number; // Seconds until next lane change can occur
}

export interface ReachabilityResult {
  solvable: boolean;
  reason?: string;
  minReactionTimeSeconds?: number;
  survivingExitLanes?: LaneIndex[];
  survivingExitNodes?: TrajectoryNodeState[];
}

/**
 * ReachabilityValidator
 * Rigorous physical trajectory validator guaranteeing that generated obstacle patterns
 * have at least one reachable, collision-free human solution across all supported speeds.
 */
export class ReachabilityValidator {
  /**
   * Helper to retrieve all obstacles covering a specific lane and Z coordinate at elapsed time.
   */
  private static getObstaclesAt(
    obstacles: ValidatedObstacle[],
    lane: LaneIndex,
    z: number,
    timeElapsed: number
  ): ValidatedObstacle[] {
    return obstacles.filter((obs) => {
      if (obs.lane !== lane) return false;

      const isTrain = obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN' || obs.type === 'TRAIN_RAMP' || (obs as any).type === 'TRAIN_COMPOSITION';
      const halfLength = isTrain ? ((obs.length || CONSTANTS.TRAIN_LENGTH_SHORT) * 0.5) : 0;
      let obsStart = isTrain ? Math.max(0, obs.zOffset - halfLength) : obs.zOffset;
      let obsEnd = isTrain ? (obs.zOffset + halfLength) : (obs.zOffset + (obs.length || 2.0));

      if (obs.type === 'MOVING_TRAIN' || obs.isMoving) {
        const advanceDist = (obs.velocityZ || CONSTANTS.MOVING_TRAIN_SPEED) * timeElapsed;
        obsStart = Math.max(0, (obs.zOffset - halfLength) - advanceDist);
        obsEnd = Math.max(0, (obs.zOffset + halfLength) - advanceDist);
      }

      return z >= obsStart && z <= obsEnd;
    });
  }

  /**
   * Helper to evaluate physical collisions with obstacles given current action and elevation.
   */
  private static checkCollision(
    obstacles: ValidatedObstacle[],
    z: number,
    action: { isAirborne: boolean; isSliding: boolean },
    onRoof: boolean
  ): { collision: boolean; climbedRoof: boolean } {
    let collision = false;
    let climbedRoof = false;

    for (const obs of obstacles) {
      if (obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN' || obs.type === 'TRAIN_RAMP' || (obs as any).type === 'TRAIN_COMPOSITION') {
        const hasRamp = !!(obs.hasRamp || obs.type === 'TRAIN_RAMP');
        const halfLength = (obs.length || CONSTANTS.TRAIN_LENGTH_SHORT) * 0.5;
        const rampStart = Math.max(0, obs.zOffset - halfLength);
        if (hasRamp && z >= rampStart && z <= rampStart + CONSTANTS.TRAIN_RAMP_LENGTH) {
          climbedRoof = true;
          continue;
        }
        if (onRoof) {
          climbedRoof = true;
          continue;
        }
        collision = true;
        break;
      } else if (obs.type === 'ROOFTOP_AC_HURDLE' || obs.type === 'ROOFTOP_VENT') {
        if (onRoof) {
          if (action.isAirborne) {
            continue;
          }
          collision = true;
          break;
        } else {
          continue;
        }
      } else if (obs.type === 'LOW_BARRIER') {
        if (action.isAirborne || onRoof) {
          continue;
        }
        collision = true;
        break;
      } else if (obs.type === 'MEDIUM_BARRIER') {
        if (action.isAirborne || onRoof) {
          continue;
        }
        collision = true;
        break;
      } else if (obs.type === 'HIGH_BARRIER') {
        if (onRoof) {
          collision = true;
          break;
        }
        if (action.isSliding) {
          continue;
        }
        collision = true;
        break;
      } else if (obs.type === 'PILLAR') {
        collision = true;
        break;
      } else if (obs.type === 'SIDE_BARRIER') {
        collision = true;
        break;
      } else if (obs.type === 'TUNNEL_ARCH') {
        if (action.isAirborne || onRoof) {
          collision = true;
          break;
        }
        if (action.isSliding) {
          continue;
        }
        collision = true;
        break;
      }
    }

    return { collision, climbedRoof };
  }

  /**
   * Validates reachability across a single pattern or chunk at a given player forward speed.
   */
  public static validatePattern(
    pattern: ValidatedPattern,
    speed: number = CONSTANTS.INITIAL_SPEED,
    initialLanes: LaneIndex[] = [-1, 0, 1],
    initialNodes?: TrajectoryNodeState[]
  ): ReachabilityResult {
    const chunkLen = CONSTANTS.CHUNK_LENGTH;
    const zStep = 1.0; // 1-meter spatial resolution
    const dtPerMeter = 1.0 / speed;

    type TrajectoryNode = TrajectoryNodeState;

    // Initialize state set with allowed entry nodes
    let currentNodes: TrajectoryNode[];
    if (initialNodes && initialNodes.length > 0) {
      currentNodes = initialNodes.map((n) => ({ ...n }));
    } else {
      currentNodes = initialLanes.map((lane) => ({
        lane,
        onRoof: false,
        airborneTimer: 0,
        slidingTimer: 0,
        lateralCooldown: 0
      }));
    }

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
        const allowedTransitions: Array<{ targetLane: LaneIndex; newCooldown: number; isChanging: boolean }> = [
          { targetLane: node.lane, newCooldown: updatedLateralCooldown, isChanging: false }
        ];

        // 2. If lane transition cooldown has elapsed, can shift to adjacent lanes
        if (updatedLateralCooldown <= 0) {
          if (node.lane > -1) {
            allowedTransitions.push({
              targetLane: (node.lane - 1) as LaneIndex,
              newCooldown: CONSTANTS.LANE_CHANGE_DURATION,
              isChanging: true
            });
          }
          if (node.lane < 1) {
            allowedTransitions.push({
              targetLane: (node.lane + 1) as LaneIndex,
              newCooldown: CONSTANTS.LANE_CHANGE_DURATION,
              isChanging: true
            });
          }
        }

        // Action enumeration adhering strictly to real Player physics constraints
        interface ActionPlan {
          isAirborne: boolean;
          isSliding: boolean;
          newAirTimer: number;
          newSlideTimer: number;
        }

        const actionsToTest: ActionPlan[] = [];

        if (node.airborneTimer > 0) {
          // Player is currently AIRBORNE:
          if (updatedAirTimer > 0) {
            // Must continue airborne trajectory until touching down
            actionsToTest.push({
              isAirborne: true,
              isSliding: false,
              newAirTimer: updatedAirTimer,
              newSlideTimer: 0
            });
          } else {
            // Airtime expired at this meter: player touches down!
            // Can land into run:
            actionsToTest.push({
              isAirborne: false,
              isSliding: false,
              newAirTimer: 0,
              newSlideTimer: 0
            });
            // Or land into slide (fast drop slide on landing):
            actionsToTest.push({
              isAirborne: false,
              isSliding: true,
              newAirTimer: 0,
              newSlideTimer: CONSTANTS.SLIDE_DURATION
            });
          }
        } else if (node.slidingTimer > 0) {
          // Player is currently SLIDING:
          if (updatedSlideTimer > 0) {
            // Can continue slide:
            actionsToTest.push({
              isAirborne: false,
              isSliding: true,
              newAirTimer: 0,
              newSlideTimer: updatedSlideTimer
            });
          }
          // Can stand up into run:
          actionsToTest.push({
            isAirborne: false,
            isSliding: false,
            newAirTimer: 0,
            newSlideTimer: 0
          });
          // Can jump cancel out of slide:
          actionsToTest.push({
            isAirborne: true,
            isSliding: false,
            newAirTimer: CONSTANTS.JUMP_DURATION,
            newSlideTimer: 0
          });
        } else {
          // Player is RUNNING on ground or rooftop:
          // 1. Continue running
          actionsToTest.push({
            isAirborne: false,
            isSliding: false,
            newAirTimer: 0,
            newSlideTimer: 0
          });
          // 2. Initiate JUMP
          actionsToTest.push({
            isAirborne: true,
            isSliding: false,
            newAirTimer: CONSTANTS.JUMP_DURATION,
            newSlideTimer: 0
          });
          // 3. Initiate SLIDE
          actionsToTest.push({
            isAirborne: false,
            isSliding: true,
            newAirTimer: 0,
            newSlideTimer: CONSTANTS.SLIDE_DURATION
          });
        }

        // Test each possible target lane & action combination
        for (const transition of allowedTransitions) {
          const targetLane = transition.targetLane;

          const obstaclesAtTarget = ReachabilityValidator.getObstaclesAt(pattern.obstacles, targetLane, z, timeElapsed);

          // If initiating a lateral lane switch, verify source lane is passable at takeoff coordinate z
          if (transition.isChanging) {
            const obstaclesAtSource = ReachabilityValidator.getObstaclesAt(pattern.obstacles, node.lane, z, timeElapsed);
            const sourceCheck = ReachabilityValidator.checkCollision(
              obstaclesAtSource,
              z,
              { isAirborne: node.airborneTimer > 0, isSliding: node.slidingTimer > 0 },
              node.onRoof
            );
            if (sourceCheck.collision) {
              continue; // Cannot initiate lane switch from inside a collision
            }
          }

          for (const action of actionsToTest) {
            const check = ReachabilityValidator.checkCollision(obstaclesAtTarget, z, action, node.onRoof);
            if (check.collision) {
              continue;
            }

            let newOnRoof = check.climbedRoof;
            let newAirTimer = action.newAirTimer;
            let newAirborneFromRoof = node.airborneFromRoof;

            if (!check.climbedRoof && node.onRoof) {
              const onTrain = obstaclesAtTarget.some(
                (o) => o.type === 'TRAIN' || o.type === 'MOVING_TRAIN' || o.type === 'TRAIN_RAMP' || (o as any).type === 'TRAIN_COMPOSITION'
              );
              if (onTrain) {
                newOnRoof = true;
              } else if (action.isAirborne) {
                // Jumping across a carriage gap
                newOnRoof = true;
              } else {
                // Exited train roof onto ground: falls under gravity (h=2.6m, t ~ 0.38s)
                newOnRoof = false;
                newAirTimer = Math.max(newAirTimer, 0.38);
                newAirborneFromRoof = true;
              }
            }

            nextNodes.push({
              lane: targetLane,
              onRoof: newOnRoof,
              airborneFromRoof: newAirborneFromRoof,
              airborneTimer: newAirTimer,
              slidingTimer: action.newSlideTimer,
              lateralCooldown: transition.newCooldown
            });
          }
        }
      }

      // Deduplicate trajectory states at this Z slice using timing buckets
      const stateMap = new Map<string, TrajectoryNode>();
      for (const n of nextNodes) {
        const airBucket = Math.round(n.airborneTimer * 5);
        const slideBucket = Math.round(n.slidingTimer * 5);
        const latBucket = Math.round(n.lateralCooldown * 5);
        const key = `${n.lane}_${n.onRoof}_${airBucket}_${slideBucket}_${latBucket}`;
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
    const survivingExitNodes = currentNodes.map((n) => ({ ...n }));

    let minEntryObstacleDist = Infinity;
    for (const obs of pattern.obstacles) {
      if (initialLanes.includes(obs.lane)) {
        const isTrain = obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN' || obs.type === 'TRAIN_RAMP' || (obs as any).type === 'TRAIN_COMPOSITION';
        const halfLen = isTrain ? ((obs.length || CONSTANTS.TRAIN_LENGTH_SHORT) * 0.5) : 0;
        const frontZ = Math.max(0, obs.zOffset - halfLen);
        if (frontZ < minEntryObstacleDist) {
          minEntryObstacleDist = frontZ;
        }
      }
    }
    const actualReactionDist = Number.isFinite(minEntryObstacleDist)
      ? Math.min(pattern.minReactionDist ?? minEntryObstacleDist, minEntryObstacleDist)
      : (pattern.minReactionDist || 25.0);

    return {
      solvable: true,
      minReactionTimeSeconds: actualReactionDist / speed,
      survivingExitLanes,
      survivingExitNodes
    };
  }

  /**
   * Conservative ground-control witness over simultaneous world trajectories.
   * Entire lane-change corridors and a bounded forward-speed range must clear;
   * this proves an avoidance route without assuming instant jumps or lane snaps.
   */
  public static validateTrainWindow(
    hazards: Array<{ min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number }; velocityZ: number }>,
    playerZ: number, minimumSpeed: number, maximumSpeed: number, horizon: number,
    initialLanes: readonly LaneIndex[] = CONSTANTS.LANE_INDICES
  ): { solvable: boolean; witness: Array<{ time: number; lane: LaneIndex }> } {
    const step = 0.06;
    const switchTicks = Math.ceil(CONSTANTS.LANE_CHANGE_DURATION / step);
    const reactionTicks = Math.ceil(CONSTANTS.DIFFICULTY_CONFIG.MIN_SAFE_REACTION_TIME / step);
    const validHorizon = Math.max(0.1, Number.isFinite(horizon) ? horizon : 0.1);
    const ticks = Math.max(1, Math.ceil(validHorizon / step));
    const states = Array.from({ length: ticks + switchTicks + 1 }, () => new Map<LaneIndex, string>());
    const parents = new Map<string, string>();
    for (const lane of initialLanes) states[0].set(lane, '');
    const clear = (from: LaneIndex, to: LaneIndex, start: number, end: number) => {
      const minX = Math.min(CONSTANTS.LANES[from], CONSTANTS.LANES[to]) - CONSTANTS.PLAYER_WIDTH / 2 - 0.1;
      const maxX = Math.max(CONSTANTS.LANES[from], CONSTANTS.LANES[to]) + CONSTANTS.PLAYER_WIDTH / 2 + 0.1;
      for (const hazard of hazards) {
        if (hazard.max.y <= CONSTANTS.PLAYER_BASE_Y || hazard.min.y >= CONSTANTS.PLAYER_BASE_Y + CONSTANTS.PLAYER_HEIGHT_RUN) continue;
        if (hazard.max.x <= minX || hazard.min.x >= maxX) continue;
        const positions = [playerZ - (minimumSpeed + hazard.velocityZ) * start,
          playerZ - (minimumSpeed + hazard.velocityZ) * end,
          playerZ - (maximumSpeed + hazard.velocityZ) * start,
          playerZ - (maximumSpeed + hazard.velocityZ) * end];
        const minZ = Math.min(...positions) - CONSTANTS.PLAYER_DEPTH / 2;
        const maxZ = Math.max(...positions) + CONSTANTS.PLAYER_DEPTH / 2;
        if (minZ < hazard.max.z && maxZ > hazard.min.z) return false;
      }
      return true;
    };
    for (let tick = 0; tick < ticks; tick++) {
      for (const lane of states[tick].keys()) {
        for (const next of CONSTANTS.LANE_INDICES) {
          if (Math.abs(next - lane) > 1 || (tick < reactionTicks && next !== lane)) continue;
          const end = Math.min(ticks, tick + (next === lane ? 1 : switchTicks));
          if (!clear(lane, next, tick * step, end * step)) continue;
          const key = `${end}:${next}`;
          if (!states[end].has(next)) {
            states[end].set(next, key);
            parents.set(key, `${tick}:${lane}`);
          }
        }
      }
    }
    const last = states[ticks].keys().next();
    if (last.done) return { solvable: false, witness: [] };
    const witness: Array<{ time: number; lane: LaneIndex }> = [];
    let key = `${ticks}:${last.value}`;
    while (key) {
      const [tick, lane] = key.split(':').map(Number);
      witness.push({ time: tick * step, lane: lane as LaneIndex });
      key = parents.get(key) || '';
    }
    return { solvable: true, witness: witness.reverse() };
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
    if (!resA.solvable || !resA.survivingExitNodes || resA.survivingExitNodes.length === 0) {
      return false;
    }

    // Validate chunk B starting strictly from the surviving exit nodes of chunk A
    const resB = this.validatePattern(chunkB, speed, resA.survivingExitLanes, resA.survivingExitNodes);
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

  /**
   * Validates deterministic multi-train rooftop route reachability,
   * gap hops, lateral transfers, and closing speed time-to-impact against oncoming traffic.
   */
  public static validateRooftopRoute(
    plan: RooftopRoutePlan,
    playerSpeed: number = CONSTANTS.INITIAL_SPEED,
    hazards?: Array<{ min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number }; velocityZ?: number }>,
    gameMode: string = 'NORMAL'
  ): ReachabilityResult {
    const isHard = gameMode === 'HARD';
    // Minimum destination landing window
    const minLandingWindow = isHard
      ? Math.max(10.0, playerSpeed * 0.45)
      : Math.max(12.0, playerSpeed * 0.55);

    // Minimum stabilization zone post-touchdown before subsequent maneuver
    const minStabilizationDist = playerSpeed * 0.35;

    for (let i = 0; i < plan.transfers.length; i++) {
      const transfer = plan.transfers[i];

      // 1. Lateral transfers must be strictly adjacent lanes
      if (transfer.kind === 'LATERAL_JUMP') {
        const laneDiff = Math.abs(transfer.targetLane - transfer.sourceLane);
        if (laneDiff !== 1) {
          return {
            solvable: false,
            reason: `Transfer ${transfer.id} requires jumping across ${laneDiff} lanes (only adjacent 1-lane transfers permitted)`
          };
        }

        // Airtime must be within legal jump duration (0.60s)
        if (transfer.requiredAirtime > CONSTANTS.JUMP_DURATION + 0.01) {
          return {
            solvable: false,
            reason: `Transfer ${transfer.id} required airtime ${transfer.requiredAirtime.toFixed(2)}s exceeds jump duration ${CONSTANTS.JUMP_DURATION}s`
          };
        }

        // Lane change duration (0.18s) must fit inside jump duration
        if (CONSTANTS.LANE_CHANGE_DURATION > CONSTANTS.JUMP_DURATION) {
          return {
            solvable: false,
            reason: `Lane change duration ${CONSTANTS.LANE_CHANGE_DURATION}s exceeds jump airtime`
          };
        }

        // Target leg must exist
        const targetLeg = plan.legs.find((leg) => leg.id === transfer.targetLegId);
        if (!targetLeg) {
          return {
            solvable: false,
            reason: `Target leg ${transfer.targetLegId} not found in plan`
          };
        }

        // Destination landing target window check
        const targetLength = targetLeg.length;
        if (targetLength < minLandingWindow) {
          return {
            solvable: false,
            reason: `Destination train length ${targetLength.toFixed(1)}m below required landing window ${minLandingWindow.toFixed(1)}m`
          };
        }

        // Post-touchdown obstacle-free stabilization check
        if (i < plan.transfers.length - 1) {
          const nextTransfer = plan.transfers[i + 1];
          const distBetweenTransfers = nextTransfer.windowStartZ - transfer.landingZ;
          if (distBetweenTransfers < minStabilizationDist) {
            return {
              solvable: false,
              reason: `Insufficient stabilization distance between transfers (${distBetweenTransfers.toFixed(1)}m < ${minStabilizationDist.toFixed(1)}m)`
            };
          }
        }
      } else if (transfer.kind === 'LONGITUDINAL_GAP_JUMP') {
        // Gap hop must clear deliberate gap
        const jumpAirDist = playerSpeed * CONSTANTS.JUMP_DURATION;
        const gapDist = 3.5;
        if (jumpAirDist < gapDist) {
          return {
            solvable: false,
            reason: `Player speed ${playerSpeed}m/s yields jump distance ${jumpAirDist.toFixed(1)}m which cannot clear ${gapDist}m gap`
          };
        }
      }

      // Check oncoming traffic hazards during transfer window
      if (hazards && hazards.length > 0) {
        for (const hazard of hazards) {
          if ((hazard.velocityZ ?? 0) > 0) {
            // Oncoming moving train
            const closingSpeed = playerSpeed + (hazard.velocityZ || CONSTANTS.MOVING_TRAIN_SPEED);
            const separation = hazard.max.z - transfer.landingZ;
            if (separation > 0 && separation < closingSpeed * CONSTANTS.DIFFICULTY_CONFIG.MIN_SAFE_REACTION_TIME) {
              const timeToImpact = separation / closingSpeed;
              return {
                solvable: false,
                reason: `Oncoming train hazard closing in ${timeToImpact.toFixed(2)}s on transfer target`
              };
            }
          }
        }
      }
    }

    return {
      solvable: true,
      minReactionTimeSeconds: minLandingWindow / playerSpeed
    };
  }
}
