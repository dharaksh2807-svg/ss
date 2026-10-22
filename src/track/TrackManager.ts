import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';
import { Player } from '../player/Player';
import { ObstacleFactory } from './ObstacleFactory';
import { CollectibleFactory } from './CollectibleFactory';
import { TrackChunk } from './TrackChunk';
import { OBSTACLE_PATTERNS, TrackPattern } from './ObstaclePatterns';

export class TrackManager {
  public chunks: TrackChunk[] = [];
  private obstacleFactory: ObstacleFactory;
  private collectibleFactory: CollectibleFactory;
  private eventBus = EventBus.getInstance();

  private furthestZ: number = 0; // Leading edge of the track
  private chunkIndex: number = 0;

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

  public reset(): void {
    this.furthestZ = 0;
    this.chunkIndex = 0;

    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const pattern = this.selectPattern(i);
      chunk.populate(pattern, this.furthestZ);
      this.furthestZ -= CONSTANTS.CHUNK_LENGTH;
      this.chunkIndex++;
    }
  }

  private selectPattern(index: number): TrackPattern {
    if (index === 0) {
      // Very first chunk is completely clear runway for smooth run start
      return {
        name: 'CLEAR_START',
        difficulty: 'EASY',
        obstacles: [],
        collectibles: [
          { type: 'COIN', lane: 1, zOffset: 12.0, count: 12, spacing: 2.2 }
        ]
      };
    }

    // Progression: 0-3 easy, 4-10 medium, >10 hard
    let pool: TrackPattern[];
    if (index < 4) {
      pool = OBSTACLE_PATTERNS.filter((p) => p.difficulty === 'EASY');
    } else if (index < 12) {
      pool = OBSTACLE_PATTERNS.filter((p) => p.difficulty === 'EASY' || p.difficulty === 'MEDIUM');
    } else {
      pool = OBSTACLE_PATTERNS;
    }

    return pool[Math.floor(Math.random() * pool.length)];
  }

  public update(player: Player, dt: number, time: number): void {
    // 1. Recycle trailing chunks ahead of player
    for (const chunk of this.chunks) {
      // If chunk end has fallen behind player despawn threshold
      const chunkEndZ = chunk.chunkZ - CONSTANTS.CHUNK_LENGTH;
      if (chunkEndZ > player.position.z + CONSTANTS.DESPAWN_DISTANCE_BEHIND) {
        const pattern = this.selectPattern(this.chunkIndex++);
        chunk.populate(pattern, this.furthestZ);
        this.furthestZ -= CONSTANTS.CHUNK_LENGTH;
      }

      chunk.update(dt, time);
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

        // Near-miss check
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

          // If player is on roof or climbing ramp, ignore the lower train wall!
          if (player.position.y >= CONSTANTS.TRAIN_HEIGHT - 0.2) {
            continue;
          }

          // If low barrier and jumping high enough, clear it!
          if (obs.type === 'LOW_BARRIER' && player.isJumping && player.position.y > CONSTANTS.LOW_BARRIER_HEIGHT + 0.2) {
            continue;
          }

          // If high barrier and sliding under, clear it!
          if (obs.type === 'HIGH_BARRIER' && player.isSliding) {
            continue;
          }

          // Crash occurs!
          const fatal = player.crash();
          if (!fatal) {
            // Shield or Hoverboard absorbed crash: deactivate obstacle so player passes safely
            obs.active = false;
            chunk.group.remove(obs.group);
          }
          return;
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
            // Accelerated pull as coin nears player
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
          } else {
            this.eventBus.emit(EVENTS.POWERUP_COLLECTED, col.type);
          }
        }
      }
    }
  }
}
