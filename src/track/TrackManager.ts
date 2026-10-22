import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';
import { Player } from '../player/Player';
import { ObstacleFactory } from './ObstacleFactory';
import { CollectibleFactory } from './CollectibleFactory';
import { TrackChunk } from './TrackChunk';
import { OBSTACLE_PATTERNS, TrackPattern } from './ObstaclePatterns';
import { ReachabilityValidator } from './ReachabilityValidator';
import { DifficultyController } from './DifficultyController';
import { PacingMetrics } from './PacingMetrics';

export class TrackManager {
  public chunks: TrackChunk[] = [];
  public difficultyController: DifficultyController = new DifficultyController();
  private obstacleFactory: ObstacleFactory;
  private collectibleFactory: CollectibleFactory;
  private eventBus = EventBus.getInstance();

  private furthestZ: number = 0; // Leading edge of the track
  private chunkIndex: number = 0;
  private lastSpawnedPattern: TrackPattern | null = null;
  public cleanStreakCount: number = 0;

  // Seedable PRNG (Mulberry32) for reproducible procedural runs and deterministic testing
  private seed: number = 1337;

  constructor(private scene: THREE.Scene) {
    this.obstacleFactory = new ObstacleFactory();
    this.collectibleFactory = new CollectibleFactory();

    // Create pooled chunks
    for (let i = 0; i < CONSTANTS.ACTIVE_CHUNKS; i++) {
      const chunk = new TrackChunk(this.obstacleFactory, this.collectibleFactory);
      this.chunks.push(chunk);
      this.scene.add(chunk.group);
    }

    this.reset();
  }

  public setSeed(seed: number): void {
    this.seed = seed;
  }

  private rng(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Proper Fisher-Yates shuffle using seeded PRNG for uniform, deterministic permutations
   */
  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      const temp = result[i];
      result[i] = result[j];
      result[j] = temp;
    }
    return result;
  }

  public reset(): void {
    this.furthestZ = 0;
    this.chunkIndex = 0;
    this.cleanStreakCount = 0;
    this.lastSpawnedPattern = null;
    this.difficultyController.reset();

    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const encounterDist = i * CONSTANTS.CHUNK_LENGTH;
      const expectedSpeed = Math.min(
        CONSTANTS.MAX_SPEED,
        CONSTANTS.INITIAL_SPEED + (encounterDist / 300.0) * (24.5 - CONSTANTS.INITIAL_SPEED)
      );
      const pattern = this.selectPattern(i, expectedSpeed, encounterDist);
      chunk.populate(pattern, this.furthestZ);
      this.lastSpawnedPattern = pattern;
      this.furthestZ -= CONSTANTS.CHUNK_LENGTH;
      this.chunkIndex++;
    }
  }

  /**
   * Procedural Pattern Selector:
   * Selects reusable patterns based on current distance-based difficulty tier,
   * with physical reachability validation ensuring no impassable chunk transitions.
   */
  public selectPattern(index: number, playerSpeed: number = CONSTANTS.INITIAL_SPEED, distanceTraveled: number = 0): TrackPattern {
    if (index === 0) {
      // Chunk 0 is the curated readable opening runway (action begins quickly & fairly)
      const opening = OBSTACLE_PATTERNS.find((p) => p.name === 'OPENING_RUNWAY') || OBSTACLE_PATTERNS[0];
      this.difficultyController.recordPatternSpawned(opening, 0);
      this.lastSpawnedPattern = opening;
      PacingMetrics.getInstance().recordPattern(opening.name, opening.difficulty);
      return opening;
    }

    // 1. Data-Driven Candidate Tier Filtering & Recovery Breathing
    const weights = this.difficultyController.getTierWeights(distanceTraveled, playerSpeed);
    const canSpawnMovingTrain = this.difficultyController.canSpawnMovingTrain(distanceTraveled);

    let candidatePool = OBSTACLE_PATTERNS.filter((p) => {
      if (p.name === 'OPENING_RUNWAY') return false;
      if (!canSpawnMovingTrain && p.obstacles.some((o) => o.type === 'MOVING_TRAIN' || o.isMoving)) {
        return false;
      }
      const tierWeight = weights[p.difficulty] !== undefined ? weights[p.difficulty] : (p.isBreather ? weights.BREATHER : 0);
      return tierWeight > 0;
    });

    if (candidatePool.length === 0) {
      candidatePool = OBSTACLE_PATTERNS.filter((p) => p.name !== 'OPENING_RUNWAY');
    }

    // 2. Uniform Seeded Fisher-Yates Shuffle
    const shuffled = this.shuffle(candidatePool);

    // 3. Physical Reachability Transition Validation
    let chosen: TrackPattern = shuffled[0];
    let foundSolvable = false;

    if (this.lastSpawnedPattern) {
      for (const candidate of shuffled) {
        if (ReachabilityValidator.validateChunkTransition(this.lastSpawnedPattern, candidate, playerSpeed)) {
          chosen = candidate;
          foundSolvable = true;
          break;
        }
      }

      // If no candidate in weighted pool provided a solvable transition, search full catalog
      if (!foundSolvable) {
        const allCandidates = this.shuffle(OBSTACLE_PATTERNS.filter((p) => p.name !== 'OPENING_RUNWAY'));
        for (const candidate of allCandidates) {
          if (ReachabilityValidator.validateChunkTransition(this.lastSpawnedPattern, candidate, playerSpeed)) {
            chosen = candidate;
            foundSolvable = true;
            break;
          }
        }
      }
    }

    if (!foundSolvable && this.lastSpawnedPattern) {
      PacingMetrics.getInstance().recordUnreachable(chosen.name, `Transition from ${this.lastSpawnedPattern.name} could not be validated.`);
    }

    this.difficultyController.recordPatternSpawned(chosen, distanceTraveled);
    this.lastSpawnedPattern = chosen;
    PacingMetrics.getInstance().recordPattern(chosen.name, chosen.difficulty);

    return chosen;
  }

  public update(player: Player, dt: number, time: number): void {
    // 0. Update difficulty controller pacing
    this.difficultyController.update(dt, player.distanceTraveled, player.speed);

    // 1. Recycle trailing chunks ahead of player
    for (const chunk of this.chunks) {
      const chunkEndZ = chunk.chunkZ - CONSTANTS.CHUNK_LENGTH;
      if (chunkEndZ > player.position.z + CONSTANTS.DESPAWN_DISTANCE_BEHIND) {
        // Clean-section streak check when recycling chunk
        if (!chunk.chunkHadCollision && chunk.obstacles.length > 0) {
          this.cleanStreakCount++;
          this.eventBus.emit(EVENTS.CLEAN_STREAK, this.cleanStreakCount);
        } else if (chunk.chunkHadCollision) {
          this.cleanStreakCount = 0;
        }

        const encounterDist = Math.abs(this.furthestZ);
        const pattern = this.selectPattern(this.chunkIndex++, player.speed, encounterDist);
        chunk.populate(pattern, this.furthestZ);
        this.lastSpawnedPattern = pattern;
        this.furthestZ -= CONSTANTS.CHUNK_LENGTH;
      }

      chunk.update(dt, time, player.position.z);
    }

    // 2. Dynamic Ground Height Check (Train Roofs & Ramps)
    this.updateGroundHeight(player);

    // 3. Collision & Collectibles Detection
    this.checkCollisions(player, dt);
  }

  private updateGroundHeight(player: Player): void {
    let targetGroundY: number = CONSTANTS.PLAYER_BASE_Y;
    let foundSupport = false;

    for (const chunk of this.chunks) {
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;

        // 1. Check if player is running up a ramp
        if (obs.rampCollider) {
          const inRampX = player.position.x >= obs.rampCollider.min.x && player.position.x <= obs.rampCollider.max.x;
          const inRampZ = player.position.z >= obs.rampCollider.min.z && player.position.z <= obs.rampCollider.max.z;

          if (inRampX && inRampZ) {
            const rampStart = obs.rampCollider.max.z;
            const rampEnd = obs.rampCollider.min.z;
            const t = Math.max(0, Math.min(1, (rampStart - player.position.z) / (rampStart - rampEnd)));
            const roofY = obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15);
            targetGroundY = CONSTANTS.PLAYER_BASE_Y + t * (roofY - CONSTANTS.PLAYER_BASE_Y);
            player.setSupportSurface('RAMP');
            if (player.state !== 'SLIDE' && player.state !== 'JETPACK') {
              player.state = 'CLIMBING';
            }
            foundSupport = true;
            break;
          }
        }

        // 2. Check if player is on top of or descending onto a train roof
        if (obs.roofCollider) {
          const minX = obs.roofCollider.min.x;
          const maxX = obs.roofCollider.max.x;
          const minZ = obs.roofCollider.min.z;
          const maxZ = obs.roofCollider.max.z;
          const roofY = obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15);

          const inRoofHorizontal =
            player.position.x >= minX && player.position.x <= maxX &&
            player.position.z >= minZ && player.position.z <= maxZ;

          if (inRoofHorizontal) {
            const prevFeetY = player.previousPosition.y;
            const currFeetY = player.position.y;
            const isDescending = player.verticalVelocity <= 0.1 || currFeetY <= prevFeetY;

            // Swept continuous collision detection:
            // Feet were previously at/above roof (with tolerance) and now crossed roof plane
            const crossedPlane = prevFeetY >= roofY - 0.35 && currFeetY <= roofY + 0.45;
            const withinCaptureWindow = currFeetY >= roofY - 0.45 && currFeetY <= roofY + 0.65;

            if (player.isJumping || player.state === 'FALLING' || player.state === 'FALLING_FROM_TRAIN') {
              if (isDescending && (crossedPlane || withinCaptureWindow)) {
                // Valid roof landing!
                player.resolveRoofLanding(roofY);
                targetGroundY = roofY;
                foundSupport = true;
                break;
              }
            } else if (currFeetY >= roofY - 0.35) {
              // Smooth rooftop traversal
              targetGroundY = roofY;
              player.setSupportSurface('TRAIN_ROOF');
              if (player.state !== 'SLIDE' && player.state !== 'JETPACK') {
                player.state = 'ON_TRAIN';
              }
              foundSupport = true;
              break;
            }
          }
        }
      }
      if (foundSupport) break;
    }

    if (!foundSupport) {
      targetGroundY = CONSTANTS.PLAYER_BASE_Y;
      if (player.getSupportSurface() === 'TRAIN_ROOF' && !player.isJumping && player.position.y > targetGroundY + 0.15) {
        // Stepped off train roof into air
        player.setSupportSurface('GROUND');
        player.isJumping = true;
        player.state = 'FALLING_FROM_TRAIN';
        player.verticalVelocity = Math.min(player.verticalVelocity, -2.0);
      } else if (player.getSupportSurface() === 'RAMP') {
        player.setSupportSurface('GROUND');
      }
    }

    player.setGroundHeight(targetGroundY);
  }

  private checkCollisions(player: Player, dt: number): void {
    const playerBox = player.collider;
    const boardMagnetBonus = player.hoverboardManager ? player.hoverboardManager.getMagnetRadiusBonus() : 0;
    const isMagnet = player.powerups.isMagnetActive() || boardMagnetBonus > 0;
    const magnetRadius = (player.powerups.isMagnetActive() ? player.powerups.getMagnetRadius() : 0) + boardMagnetBonus;

    for (const chunk of this.chunks) {
      // Obstacle Collisions
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;

        // Near-miss check (Passes within close margin without touching)
        if (!obs.nearMissTriggered && obs.nearMissBox.intersectsBox(playerBox)) {
          if (!obs.collider.intersectsBox(playerBox)) {
            obs.nearMissTriggered = true;
            this.eventBus.emit(EVENTS.NEAR_MISS);
          }
        }

        // Direct obstacle collision check
        if (obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN') {
          const roofY = obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15);

          // Priority 1: Safe rooftop traversal
          if (player.getSupportSurface() === 'TRAIN_ROOF' || player.state === 'ON_TRAIN') {
            continue;
          }

          // Priority 2: Safe ramp climbing
          if (player.getSupportSurface() === 'RAMP' || player.state === 'CLIMBING') {
            continue;
          }

          // Priority 3: Clear airborne height (e.g. jumping over train, super sneakers, jetpack)
          if (player.position.y >= roofY - 0.35 || player.state === 'JETPACK' || player.position.y > 6.0) {
            continue;
          }

          // Check physical contact with lower train hull or front bumper at unsafe height
          const lethalBox = obs.bodyCollider || obs.collider;
          if (lethalBox.intersectsBox(playerBox)) {
            // Differentiate side flank collision vs direct head-on front bumper crash:
            const isFlankContact = player.position.z < lethalBox.max.z - 0.45;
            const overlapX = Math.min(playerBox.max.x, lethalBox.max.x) - Math.max(playerBox.min.x, lethalBox.min.x);
            const isGlance = player.isChangingLaneActive() && (isFlankContact || overlapX < 0.28);

            if (isFlankContact || isGlance) {
              this.recordCollisionDiagnostic(obs, isFlankContact ? 'SIDE_COLLISION' : 'SIDE_GLANCE', player);
              player.bounceBackFromSide();
              chunk.chunkHadCollision = true;
              return;
            }

            // Direct head-on impact occurs!
            this.recordCollisionDiagnostic(obs, 'LETHAL_TRAIN_FRONT', player);
            chunk.chunkHadCollision = true;
            const fatal = player.crash('TRAIN_COLLISION');
            if (!fatal) {
              obs.active = false;
              chunk.group.remove(obs.group);
            }
            return;
          }
        } else {
          // Standard barriers (LOW_BARRIER, HIGH_BARRIER, SIDE_BARRIER, TUNNEL_ARCH)
          if (obs.collider.intersectsBox(playerBox)) {
            if (player.state === 'JETPACK' || player.position.y > 6.0) {
              continue;
            }

            // Low Barrier: if jumping high enough, clear safely
            if (obs.type === 'LOW_BARRIER' && player.isJumping && player.position.y > CONSTANTS.LOW_BARRIER_HEIGHT + 0.15) {
              if (player.distanceTraveled - player.lastJumpDist < 8.0) {
                this.eventBus.emit(EVENTS.PRECISION_ACTION, 'JUMP');
              }
              continue;
            }

            // High Barrier: if sliding underneath, clear safely
            if (obs.type === 'HIGH_BARRIER' && player.isSliding) {
              if (player.distanceTraveled - player.lastSlideDist < 8.0) {
                this.eventBus.emit(EVENTS.PRECISION_ACTION, 'SLIDE');
              }
              continue;
            }

            // Tunnel Arch: if sliding underneath, clear safely
            if (obs.type === 'TUNNEL_ARCH' && player.isSliding) {
              if (player.distanceTraveled - player.lastSlideDist < 8.0) {
                this.eventBus.emit(EVENTS.PRECISION_ACTION, 'SLIDE');
              }
              continue;
            }

            // Differentiate glancing side collision vs direct crash
            const overlapX = Math.min(playerBox.max.x, obs.collider.max.x) - Math.max(playerBox.min.x, obs.collider.min.x);
            const isGlance = player.isChangingLaneActive() && overlapX < 0.28;

            this.recordCollisionDiagnostic(obs, isGlance ? 'BARRIER_GLANCE' : 'BARRIER_CRASH', player);

            if (isGlance) {
              player.stumble();
              chunk.chunkHadCollision = true;
              return;
            }

            chunk.chunkHadCollision = true;
            const fatal = player.crash(obs.type);
            if (!fatal) {
              obs.active = false;
              chunk.group.remove(obs.group);
            }
            return;
          }
        }

        // Clean obstacle dodge check when player safely passes past the obstacle
        if (!obs.passed && playerBox.max.z < obs.collider.min.z) {
          obs.passed = true;
          if (obs.active && !chunk.chunkHadCollision) {
            this.eventBus.emit(EVENTS.OBSTACLE_DODGED, obs.type);
          }
        }
      }

      // Collectibles Collisions & Magnet Attraction
      for (const col of chunk.collectibles) {
        if (!col.active) continue;

        // Magnet attraction effect with upgraded radius and acceleration
        if (isMagnet && col.type === 'COIN') {
          const colWorldPos = new THREE.Vector3(col.group.position.x, col.group.position.y, chunk.chunkZ + col.group.position.z);
          const distSq = colWorldPos.distanceToSquared(player.position);
          if (distSq < magnetRadius * magnetRadius) {
            const dist = Math.sqrt(distSq);
            const speed = Math.min(32.0, CONSTANTS.MAGNET_PULL_SPEED * (1.0 + (1.0 - dist / magnetRadius) * 1.5));
            const dir = player.position.clone().sub(colWorldPos).normalize();
            col.group.position.addScaledVector(dir, speed * dt);
            colWorldPos.addScaledVector(dir, speed * dt);
            col.collider.setFromCenterAndSize(colWorldPos, new THREE.Vector3(1.2, 1.2, 1.2));
          }
        }

        // Collection check (Guaranteed single credit via active flag)
        if (col.collider.intersectsBox(playerBox)) {
          col.active = false;
          chunk.group.remove(col.group);

          if (col.type === 'COIN') {
            this.eventBus.emit(EVENTS.COIN_COLLECTED);
          } else if (col.type === 'SEASON_TOKEN') {
            this.eventBus.emit(EVENTS.SEASON_TOKEN_COLLECTED, 1);
          } else if (col.type === 'CHRONO_ORB') {
            this.eventBus.emit('CHRONO_ORB_COLLECTED', 5);
          } else {
            this.eventBus.emit(EVENTS.POWERUP_COLLECTED, col.type);
          }
        }
      }
    }
  }

  public recordCollisionDiagnostic(
    obs: any,
    classification: string,
    player: Player
  ): void {
    const diag = {
      timestamp: typeof performance !== 'undefined' ? performance.now() : Date.now(),
      collidingObject: obs.type,
      classification,
      lane: obs.lane,
      playerLane: player.currentLane,
      targetLane: player.targetLane,
      playerState: player.state,
      supportSurface: player.getSupportSurface(),
      playerPosition: {
        x: Math.round(player.position.x * 100) / 100,
        y: Math.round(player.position.y * 100) / 100,
        z: Math.round(player.position.z * 100) / 100
      },
      playerVelocityY: Math.round(player.verticalVelocity * 100) / 100,
      groundY: Math.round(player.groundY * 100) / 100,
      collider: {
        min: { x: obs.collider.min.x, y: obs.collider.min.y, z: obs.collider.min.z },
        max: { x: obs.collider.max.x, y: obs.collider.max.y, z: obs.collider.max.z }
      },
      roofCollider: obs.roofCollider ? {
        min: { x: obs.roofCollider.min.x, y: obs.roofCollider.min.y, z: obs.roofCollider.min.z },
        max: { x: obs.roofCollider.max.x, y: obs.roofCollider.max.y, z: obs.roofCollider.max.z }
      } : null,
      roofLandingConsidered: player.position.y >= (obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15)) - 0.45
    };

    if (typeof window !== 'undefined') {
      (window as any).__LAST_COLLISION_DIAGNOSTIC__ = diag;
      if (!(window as any).__COLLISION_LOG__) {
        (window as any).__COLLISION_LOG__ = [];
      }
      (window as any).__COLLISION_LOG__.push(diag);
      if ((window as any).__COLLISION_LOG__.length > 50) {
        (window as any).__COLLISION_LOG__.shift();
      }
      if ((window as any).__DEBUG_COLLIDERS__) {
        console.warn('⚠️ [COLLISION_DIAGNOSTIC]', diag);
      }
    }
  }
}
