import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';
import { Player } from '../player/Player';
import { ObstacleFactory } from './ObstacleFactory';
import { CollectibleFactory } from './CollectibleFactory';
import { TrackChunk } from './TrackChunk';
import { OBSTACLE_PATTERNS, TrackPattern } from './ObstaclePatterns';
import { ReachabilityValidator } from './ReachabilityValidator';

export class TrackManager {
  public chunks: TrackChunk[] = [];
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

  public reset(): void {
    this.furthestZ = 0;
    this.chunkIndex = 0;
    this.cleanStreakCount = 0;
    this.lastSpawnedPattern = null;

    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const pattern = this.selectPattern(i, CONSTANTS.INITIAL_SPEED, 0);
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
      // Very first chunk is completely clear runway for smooth run start
      return {
        name: 'CLEAR_START',
        difficulty: 'BEGINNER',
        entryLanes: [-1, 0, 1],
        exitLanes: [-1, 0, 1],
        obstacles: [],
        collectibles: [
          { type: 'COIN', lane: 1, zOffset: 12.0, count: 12, spacing: 2.2 }
        ]
      };
    }

    // Determine current progression tier by distance traveled
    let candidatePool: TrackPattern[];
    if (distanceTraveled < 350) {
      // Beginner Tier: Clear spacing, single-action mechanics, generous reaction windows
      candidatePool = OBSTACLE_PATTERNS.filter((p) => p.difficulty === 'BEGINNER' || p.difficulty === 'EASY');
    } else if (distanceTraveled < 900) {
      // Intermediate Tier: Oncoming moving trains, train roofs, tunnel clearance slides
      candidatePool = OBSTACLE_PATTERNS.filter((p) => p.difficulty === 'INTERMEDIATE' || p.difficulty === 'MEDIUM');
    } else if (distanceTraveled < 1800) {
      // Advanced Tier: Higher decision density, rapid rhythm sequences, paired hazards
      candidatePool = OBSTACLE_PATTERNS.filter((p) => p.difficulty === 'ADVANCED' || p.difficulty === 'HARD');
    } else {
      // Expert Tier: Master level gauntlets, precision timing, risk routes, double train reflexes
      candidatePool = OBSTACLE_PATTERNS.filter((p) => p.difficulty === 'EXPERT' || p.difficulty === 'ADVANCED');
    }

    if (candidatePool.length === 0) {
      candidatePool = OBSTACLE_PATTERNS;
    }

    // Shuffle candidates deterministically using seeded PRNG
    const shuffled = [...candidatePool].sort(() => this.rng() - 0.5);

    let chosen: TrackPattern = shuffled[0];

    // Filter by transition reachability from previous chunk
    if (this.lastSpawnedPattern) {
      for (const candidate of shuffled) {
        if (ReachabilityValidator.validateChunkTransition(this.lastSpawnedPattern, candidate, playerSpeed)) {
          chosen = candidate;
          break;
        }
      }
    }

    this.lastSpawnedPattern = chosen;
    return chosen;
  }

  public update(player: Player, dt: number, time: number): void {
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

        const pattern = this.selectPattern(this.chunkIndex++, player.speed, player.distanceTraveled);
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
    let targetGroundY = CONSTANTS.PLAYER_BASE_Y;

    for (const chunk of this.chunks) {
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;

        // Check if player is above train roof
        if (obs.roofCollider && obs.roofCollider.containsPoint(player.position)) {
          targetGroundY = CONSTANTS.TRAIN_HEIGHT + 0.15;
          break;
        }

        // Check if player is running up a ramp
        if (obs.rampCollider && obs.rampCollider.containsPoint(player.position)) {
          const rampStart = obs.rampCollider.max.z;
          const rampEnd = obs.rampCollider.min.z;
          const t = Math.max(0, Math.min(1, (rampStart - player.position.z) / (rampStart - rampEnd)));
          targetGroundY = CONSTANTS.PLAYER_BASE_Y + t * CONSTANTS.TRAIN_HEIGHT;
          break;
        }
      }
      if (targetGroundY > CONSTANTS.PLAYER_BASE_Y) break;
    }

    player.setGroundHeight(targetGroundY);
  }

  private checkCollisions(player: Player, dt: number): void {
    const playerBox = player.collider;
    const isMagnet = player.powerups.isMagnetActive();
    const magnetRadius = isMagnet ? player.powerups.getMagnetRadius() : 0;

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
        if (obs.collider.intersectsBox(playerBox)) {
          // If player is flying with Jetpack, skip ground-level obstacle collision
          if (player.state === 'JETPACK' || player.position.y > 6.0) {
            continue;
          }

          // If player is on roof or climbing ramp, ignore lower train hull
          if (player.position.y >= CONSTANTS.TRAIN_HEIGHT - 0.2) {
            continue;
          }

          // Low Barrier: if jumping high enough, clear safely + award precision bonus
          if (obs.type === 'LOW_BARRIER' && player.isJumping && player.position.y > CONSTANTS.LOW_BARRIER_HEIGHT + 0.15) {
            if (player.distanceTraveled - player.lastJumpDist < 8.0) {
              this.eventBus.emit(EVENTS.PRECISION_ACTION, 'JUMP');
            }
            continue;
          }

          // High Barrier: if sliding underneath, clear safely + award precision bonus
          if (obs.type === 'HIGH_BARRIER' && player.isSliding) {
            if (player.distanceTraveled - player.lastSlideDist < 8.0) {
              this.eventBus.emit(EVENTS.PRECISION_ACTION, 'SLIDE');
            }
            continue;
          }

          // Tunnel Arch: if sliding underneath, clear safely + award precision bonus
          if (obs.type === 'TUNNEL_ARCH' && player.isSliding) {
            if (player.distanceTraveled - player.lastSlideDist < 8.0) {
              this.eventBus.emit(EVENTS.PRECISION_ACTION, 'SLIDE');
            }
            continue;
          }

          // Differentiate glancing side collision vs direct head-on crash:
          // If player is actively changing lanes and only glancing the edge (< 0.28m overlap in X)
          const overlapX = Math.min(playerBox.max.x, obs.collider.max.x) - Math.max(playerBox.min.x, obs.collider.min.x);
          const isGlance = player.isChangingLaneActive() && overlapX < 0.28;

          if (isGlance) {
            // Glancing contact: minor stumble with speed drop, non-fatal
            player.stumble();
            chunk.chunkHadCollision = true;
            return;
          }

          // Direct head-on impact occurs!
          chunk.chunkHadCollision = true;
          const fatal = player.crash();
          if (!fatal) {
            // Shield or Hoverboard absorbed crash: deactivate obstacle so player passes through
            obs.active = false;
            chunk.group.remove(obs.group);
          }
          return;
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
          const distSq = col.group.position.distanceToSquared(player.position);
          if (distSq < magnetRadius * magnetRadius) {
            const dist = Math.sqrt(distSq);
            const speed = Math.min(32.0, CONSTANTS.MAGNET_PULL_SPEED * (1.0 + (1.0 - dist / magnetRadius) * 1.5));
            const dir = player.position.clone().sub(col.group.position).normalize();
            col.group.position.addScaledVector(dir, speed * dt);
            col.collider.setFromCenterAndSize(col.group.position, new THREE.Vector3(1.2, 1.2, 1.2));
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
}
