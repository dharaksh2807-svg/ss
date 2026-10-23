import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';
import { Player, SupportSurfaceType } from '../player/Player';
import { ObstacleFactory } from './ObstacleFactory';
import { CollectibleFactory, CoinPickupVFXInstance } from './CollectibleFactory';
import { TrackChunk } from './TrackChunk';
import { OBSTACLE_PATTERNS, TrackPattern } from './ObstaclePatterns';
import { ReachabilityValidator } from './ReachabilityValidator';
import { DifficultyController } from './DifficultyController';
import { PacingMetrics } from './PacingMetrics';
import { AerialCoinManager } from './AerialCoinManager';
import { GraphicsManager, QualityConfig } from '../scene/GraphicsManager';
import { EnvironmentManager, EnvironmentId, EnvironmentTheme } from '../environment/EnvironmentConfig';

export class TrackManager {
  public chunks: TrackChunk[] = [];
  public difficultyController: DifficultyController = new DifficultyController();
  public aerialCoinManager: AerialCoinManager;
  private obstacleFactory: ObstacleFactory;
  private collectibleFactory: CollectibleFactory;
  private eventBus = EventBus.getInstance();
  private envManager = EnvironmentManager.getInstance();

  private activeEnvironment: EnvironmentId = 'MODERN_METRO';
  private targetEnvironment: EnvironmentId = 'MODERN_METRO';
  private chunksUntilTransition: number = 10;

  private furthestZ: number = 0; // Leading edge of the track
  private chunkIndex: number = 0;
  private lastSpawnedPattern: TrackPattern | null = null;
  public cleanStreakCount: number = 0;

  // High-speed swept collision tracking to prevent tunneling past collectibles
  private previousPlayerZ: number | null = null;
  private sweptCollectibleBox: THREE.Box3 = new THREE.Box3();
  // Reusable pooled collection particle bursts
  private pickupVfxPool: CoinPickupVFXInstance[] = [];

  // Seedable PRNG (Mulberry32) for reproducible procedural runs and deterministic testing
  private seed: number = 1337;
  private rampOnboardingChecked: boolean = false;

  constructor(private scene: THREE.Scene) {
    this.obstacleFactory = new ObstacleFactory();
    this.collectibleFactory = new CollectibleFactory();
    this.aerialCoinManager = new AerialCoinManager(this.scene, this.collectibleFactory);

    // Create pooled chunks
    for (let i = 0; i < CONSTANTS.ACTIVE_CHUNKS; i++) {
      const chunk = new TrackChunk(this.obstacleFactory, this.collectibleFactory);
      this.chunks.push(chunk);
      this.scene.add(chunk.group);
    }

    // Initialize pre-allocated coin collection VFX pool
    this.pickupVfxPool = this.collectibleFactory.createPickupVFXPool(24);
    for (const vfx of this.pickupVfxPool) {
      this.scene.add(vfx.group);
    }

    // Apply active scenery detail level from GraphicsManager
    const currentConfig = GraphicsManager.getInstance().getActiveConfig();
    for (const chunk of this.chunks) {
      chunk.setSceneryDetail(currentConfig.sceneryDetail);
    }

    this.eventBus.on('GRAPHICS_CONFIG_CHANGED', (config: QualityConfig) => {
      for (const chunk of this.chunks) {
        chunk.setSceneryDetail(config.sceneryDetail);
      }
    });

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

  public getChunks(): TrackChunk[] {
    return this.chunks;
  }

  public reset(): void {
    this.furthestZ = 0;
    this.chunkIndex = 0;
    this.cleanStreakCount = 0;
    this.lastSpawnedPattern = null;
    this.previousPlayerZ = null;
    this.rampOnboardingChecked = false;
    this.difficultyController.reset();
    if (this.aerialCoinManager) {
      this.aerialCoinManager.reset();
    }

    this.activeEnvironment = this.envManager.getStartingEnvironment();
    this.targetEnvironment = this.activeEnvironment;
    this.chunksUntilTransition = 10;
    const initialTheme = this.envManager.getTheme(this.activeEnvironment);

    for (const vfx of this.pickupVfxPool) {
      vfx.active = false;
      vfx.group.visible = false;
    }

    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const encounterDist = i * CONSTANTS.CHUNK_LENGTH;
      const expectedSpeed = Math.min(
        CONSTANTS.MAX_SPEED,
        CONSTANTS.INITIAL_SPEED + (encounterDist / 300.0) * (24.5 - CONSTANTS.INITIAL_SPEED)
      );
      const pattern = this.selectPattern(i, expectedSpeed, encounterDist);
      chunk.populate(pattern, this.furthestZ, initialTheme, false);
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

  public update(player: Player, dt: number, time: number = 0): void {
    // 0. Update difficulty controller pacing
    this.difficultyController.update(dt, player.distanceTraveled, player.speed);

    // 0.1 Update pooled coin collection particle bursts
    this.updatePickupVFX(dt);

    // 0.2 Dedicated Aerial Coin Trail System & Flight Lifecycle Integration
    if (player.powerups.isJetpackActive() || player.state === 'JETPACK') {
      if (!this.aerialCoinManager.isJetpackFlightActive()) {
        this.aerialCoinManager.onJetpackActivated(player);
        this.prepareSafeLandingRunway(player);
      }
    }

    const boardMagnetBonus = player.hoverboardManager ? player.hoverboardManager.getMagnetRadiusBonus() : 0;
    const isMagnet = player.powerups.isMagnetActive() || boardMagnetBonus > 0;
    const magnetRadius = (player.powerups.isMagnetActive() ? player.powerups.getMagnetRadius() : 0) + boardMagnetBonus;

    this.aerialCoinManager.update(
      player,
      dt,
      time,
      isMagnet,
      magnetRadius,
      (pos: THREE.Vector3) => this.triggerCoinPickupVFX(pos)
    );

    // Safe Landing Runway: Continually clears and verifies landing corridor during descent
    if (player.getJetpackPhase() === 'DESCENT' || (player.powerups.isJetpackActive() && player.powerups.getJetpackRemaining() <= 2.2)) {
      this.prepareSafeLandingRunway(player);
    }

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

        // Environment theme & transition portal selection
        let spawnPortal = false;
        let chunkTheme = this.envManager.getTheme(this.activeEnvironment);
        const selectionPref = this.envManager.getSelectionPreference();

        if (selectionPref === 'DYNAMIC') {
          this.chunksUntilTransition--;
          if (this.chunksUntilTransition <= 0) {
            spawnPortal = true;
            this.targetEnvironment = this.envManager.getOtherEnvironment(this.activeEnvironment);
            chunkTheme = this.envManager.getTheme(this.targetEnvironment);
            this.chunksUntilTransition = 10;
            this.eventBus.emit('ENVIRONMENT_TRANSITION_APPROACHING', {
              from: this.activeEnvironment,
              to: this.targetEnvironment,
              portalZ: this.furthestZ
            });
          } else if (this.activeEnvironment !== this.targetEnvironment) {
            this.activeEnvironment = this.targetEnvironment;
            chunkTheme = this.envManager.getTheme(this.activeEnvironment);
            this.eventBus.emit('ENVIRONMENT_CHANGED', this.activeEnvironment);
          }
        } else {
          this.activeEnvironment = selectionPref as EnvironmentId;
          this.targetEnvironment = this.activeEnvironment;
          chunkTheme = this.envManager.getTheme(this.activeEnvironment);
        }

        const encounterDist = Math.abs(this.furthestZ);
        const pattern = this.selectPattern(this.chunkIndex++, player.speed, encounterDist);
        chunk.populate(pattern, this.furthestZ, chunkTheme, spawnPortal);
        this.lastSpawnedPattern = pattern;
        this.furthestZ -= CONSTANTS.CHUNK_LENGTH;
      }

      chunk.update(dt, time, player.position.z);
    }

    // 2. Dynamic Ground Height Check (Train Roofs & Ramps)
    this.updateGroundHeight(player);

    // 2.1 First-encounter unobtrusive onboarding cue for climbable train ramps
    if (!this.rampOnboardingChecked) {
      this.checkRampOnboarding(player);
    }

    // 3. Collision & Collectibles Detection
    this.checkCollisions(player, dt);
  }

  /**
   * First-encounter unobtrusive onboarding cue:
   * Emits a brief, non-intrusive HUD micro-pill [ ▲ CLIMB RAMP TO ROOF ]
   * when the player approaches their first climbable ramp within 32m.
   * Persisted in localStorage so it never repeats or interrupts experienced runs.
   */
  private checkRampOnboarding(player: Player): void {
    if (typeof localStorage !== 'undefined') {
      try {
        if (localStorage.getItem('metro_runner_first_ramp_seen') === 'true') {
          this.rampOnboardingChecked = true;
          return;
        }
      } catch (_) {}
    }

    for (const chunk of this.chunks) {
      for (const obs of chunk.obstacles) {
        if (obs.active && obs.hasRamp && obs.rampCollider) {
          const rampStart = obs.rampCollider.max.z;
          const distToRamp = player.position.z - rampStart;
          const playerLane = player.currentLane !== undefined ? player.currentLane : 0;
          if (distToRamp > 0 && distToRamp < 32.0 && Math.abs(playerLane - obs.lane) <= 1) {
            this.rampOnboardingChecked = true;
            if (typeof localStorage !== 'undefined') {
              try {
                localStorage.setItem('metro_runner_first_ramp_seen', 'true');
              } catch (_) {}
            }
            this.eventBus.emit(EVENTS.RAMP_ONBOARDING_CUE);
            return;
          }
        }
      }
    }
  }

  /**
   * Safe Landing Corridor:
   * Inspects upcoming track chunks covering the touchdown zone [landingZ + 6m, landingZ - 36m].
   * Ensures the runner's landing lane is 100% free of lethal obstacles (trains, high barriers, etc.),
   * guaranteeing a physically clear runway so the runner never lands into an unavoidable crash.
   */
  public prepareSafeLandingRunway(player: Player): void {
    const remaining = player.powerups.getJetpackRemaining();
    const dynamicLandingZ = player.position.z - Math.max(CONSTANTS.INITIAL_SPEED, player.speed) * Math.max(0, remaining);
    const landingZ = (remaining <= 3.0 || player.getJetpackPhase() === 'DESCENT')
      ? dynamicLandingZ
      : this.aerialCoinManager.getLandingZ();

    const landingLane = player.currentLane;
    this.aerialCoinManager.setLandingLane(landingLane);

    // Guaranteed clearance covers from current player position through 35m past touchdown
    const runwayZStart = player.position.z + 4.0;
    const runwayZEnd = landingZ - (CONSTANTS.JETPACK_SAFE_LANDING_RUNWAY || 35.0);

    for (const chunk of this.chunks) {
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;

        const obsWorldZMin = obs.collider.min.z;
        const obsWorldZMax = obs.collider.max.z;

        const inTouchdownZ = obsWorldZMax >= runwayZEnd && obsWorldZMin <= runwayZStart;
        const inLandingLane = obs.lane === landingLane;

        if (inTouchdownZ && inLandingLane) {
          obs.active = false;
          chunk.group.remove(obs.group);
        }
      }
    }
  }

  private updateGroundHeight(player: Player): void {
    let targetGroundY: number = CONSTANTS.PLAYER_BASE_Y;
    let foundSupport = false;
    let supportedObstacleId: string | null = null;
    let supportType: SupportSurfaceType = 'GROUND';

    for (const chunk of this.chunks) {
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;

        // 1. Check if player is on or ascending a sloped ramp
        if (obs.rampCollider) {
          const inRampX = player.position.x >= obs.rampCollider.min.x && player.position.x <= obs.rampCollider.max.x;
          // Ramp covers from max.z (base at ground) to min.z (top at roof)
          // Extend tolerance slightly at the upper junction (0.35m) so forward steps across the boundary do not drop support
          const rampStart = obs.rampCollider.max.z;
          const rampEnd = obs.rampCollider.min.z;
          const inRampZ = player.position.z >= rampEnd - 0.35 && player.position.z <= rampStart + 0.35;

          if (inRampX && inRampZ) {
            const roofY = obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15);
            const t = Math.max(0, Math.min(1, (rampStart - player.position.z) / (rampStart - rampEnd)));
            const calculatedHeight = CONSTANTS.PLAYER_BASE_Y + t * (roofY - CONSTANTS.PLAYER_BASE_Y);

            const currFeetY = player.position.y;
            const isNearSurface = Math.abs(currFeetY - calculatedHeight) <= 0.85;
            const isAscendingOrGrounded = !player.isJumping || player.verticalVelocity <= 0.1 || isNearSurface;

            if (isAscendingOrGrounded) {
              targetGroundY = calculatedHeight;
              foundSupport = true;
              supportedObstacleId = obs.id;
              // If reached top edge (t >= 0.98), promote to TRAIN_ROOF smoothly
              supportType = t >= 0.98 ? 'TRAIN_ROOF' : 'RAMP';
              if (t >= 0.98) {
                targetGroundY = roofY;
              }

              // Synchronize player position and collider immediately so collision resolution
              // uses the newly resolved height in this same frame
              if (!player.isJumping) {
                player.position.y = targetGroundY;
                player.updateCollider();
              }
              break;
            }
          }
        }

        // 2. Check if player is on top of or descending onto a train roof
        if (obs.roofCollider) {
          const minX = obs.roofCollider.min.x;
          const maxX = obs.roofCollider.max.x;
          const minZ = obs.roofCollider.min.z;
          // Generous forward overlap (0.35m) to capture smooth handoff directly from the ramp top
          const maxZ = obs.roofCollider.max.z + 0.35;
          const roofY = obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15);

          const inRoofHorizontal =
            player.position.x >= minX && player.position.x <= maxX &&
            player.position.z >= minZ && player.position.z <= maxZ;

          if (inRoofHorizontal) {
            const prevFeetY = player.previousPosition.y;
            const currFeetY = player.position.y;
            const isDescending = player.verticalVelocity <= 0.1 || currFeetY <= prevFeetY;
            const isSupportedByThisTrain = player.getActiveSupportObstacleId() === obs.id;

            // Swept continuous collision detection & landing capture window
            const crossedPlane = prevFeetY >= roofY - 0.45 && currFeetY <= roofY + 0.55;
            const withinCaptureWindow = currFeetY >= roofY - 0.55 && currFeetY <= roofY + 0.85;

            if (player.isJumping || player.state === 'FALLING' || player.state === 'FALLING_FROM_TRAIN') {
              if (isDescending && (crossedPlane || withinCaptureWindow)) {
                // Valid roof landing!
                player.resolveRoofLanding(roofY, obs.id);
                targetGroundY = roofY;
                foundSupport = true;
                supportedObstacleId = obs.id;
                supportType = 'TRAIN_ROOF';
                break;
              }
            } else if (currFeetY >= roofY - 0.55 || isSupportedByThisTrain) {
              // Smooth rooftop traversal or direct handoff from ramp
              targetGroundY = roofY;
              foundSupport = true;
              supportedObstacleId = obs.id;
              supportType = 'TRAIN_ROOF';

              player.position.y = roofY;
              player.updateCollider();
              break;
            }
          }
        }
      }
      if (foundSupport) break;
    }

    if (foundSupport && supportedObstacleId) {
      player.setGroundHeight(targetGroundY);
      player.setSupportSurface(supportType, supportedObstacleId);
      if (player.state !== 'SLIDE' && player.state !== 'JETPACK') {
        player.state = supportType === 'RAMP' ? 'CLIMBING' : 'ON_TRAIN';
      }
      if (!this.rampOnboardingChecked && (supportType === 'RAMP' || supportType === 'TRAIN_ROOF')) {
        this.rampOnboardingChecked = true;
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('metro_runner_first_ramp_seen', 'true');
          } catch (_) {}
        }
      }
    } else {
      targetGroundY = CONSTANTS.PLAYER_BASE_Y;
      const prevSurface = player.getSupportSurface();
      if ((prevSurface === 'TRAIN_ROOF' || prevSurface === 'RAMP') && !player.isJumping && player.position.y > targetGroundY + 0.15) {
        // Stepped off train roof or ramp into open air
        player.setSupportSurface('GROUND', null);
        player.isJumping = true;
        player.state = 'FALLING_FROM_TRAIN';
        player.verticalVelocity = Math.min(player.verticalVelocity, -2.0);
      } else {
        player.setSupportSurface('GROUND', null);
      }
      player.setGroundHeight(targetGroundY);
    }
  }

  private checkCollisions(player: Player, dt: number): void {
    const playerBox = player.collider;
    // High-speed swept volume to prevent tunneling or missed coins at high speed (up to 45m/s)
    this.sweptCollectibleBox.copy(playerBox);
    if (this.previousPlayerZ !== null) {
      this.sweptCollectibleBox.min.z = Math.min(playerBox.min.z, this.previousPlayerZ - 0.45);
      this.sweptCollectibleBox.max.z = Math.max(playerBox.max.z, this.previousPlayerZ + 0.45);
    }
    const sweptCollectibleBox = this.sweptCollectibleBox;
    this.previousPlayerZ = player.position.z;

    const boardMagnetBonus = player.hoverboardManager ? player.hoverboardManager.getMagnetRadiusBonus() : 0;
    const isMagnet = player.powerups.isMagnetActive() || boardMagnetBonus > 0;
    const magnetRadius = (player.powerups.isMagnetActive() ? player.powerups.getMagnetRadius() : 0) + boardMagnetBonus;

    // Overhead obstacle check to prevent character snapping upright or jumping under low barriers
    let isUnderOverhead = false;
    for (const chunk of this.chunks) {
      if (Math.abs(chunk.chunkZ - player.position.z) > CONSTANTS.CHUNK_LENGTH * 1.5) continue;
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;
        if (obs.type === 'HIGH_BARRIER' || obs.type === 'TUNNEL_ARCH') {
          const overlapZ = playerBox.min.z <= obs.collider.max.z + 0.3 && playerBox.max.z >= obs.collider.min.z - 0.3;
          const overlapX = playerBox.min.x <= obs.collider.max.x && playerBox.max.x >= obs.collider.min.x;
          if (overlapZ && overlapX) {
            isUnderOverhead = true;
            break;
          }
        }
      }
      if (isUnderOverhead) break;
    }
    player.setUnderOverheadObstacle(isUnderOverhead);

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
        if (obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN' || obs.type === 'TRAIN_RAMP') {
          const roofY = obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15);
          const isSupportingThisTrain = player.getActiveSupportObstacleId() === obs.id;

          // Priority 1: Safe rooftop traversal on THIS specific train
          if (isSupportingThisTrain && (player.getSupportSurface() === 'TRAIN_ROOF' || player.state === 'ON_TRAIN')) {
            continue;
          }

          // Priority 2: Safe ramp climbing on THIS specific train
          if (isSupportingThisTrain && (player.getSupportSurface() === 'RAMP' || player.state === 'CLIMBING')) {
            continue;
          }

          // Priority 3: Clear airborne height (e.g. jumping over train, super sneakers, jetpack)
          if (player.position.y >= roofY - 0.25 || player.state === 'JETPACK' || player.getJetpackPhase() !== 'NONE' || player.position.y > 4.5) {
            continue;
          }

          // If this train has a climbable ramp and player is entering horizontally from the ramp approach:
          if (obs.rampCollider) {
            const inRampX = playerBox.max.x >= obs.rampCollider.min.x && playerBox.min.x <= obs.rampCollider.max.x;
            const inRampZ = playerBox.min.z <= obs.rampCollider.max.z + 0.35 && playerBox.max.z >= obs.rampCollider.min.z - 0.25;
            if (inRampX && inRampZ) {
              // Valid ramp entry in progress; front bumper is enclosed by ramp
              continue;
            }
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
            if (player.state === 'JETPACK' || player.getJetpackPhase() !== 'NONE' || player.position.y > 4.5) {
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
      const playerChestPos = player.position.clone();
      playerChestPos.y += 0.5; // Aim magnet pull at player chest/magnet aura level

      for (const col of chunk.collectibles) {
        if (!col.active) continue;

        const colWorldPos = new THREE.Vector3(
          col.group.position.x,
          col.group.position.y,
          chunk.chunkZ + col.group.position.z
        );

        // Ground coins are not collected from far above while high in jetpack flight
        const isGroundCollectible = colWorldPos.y < 4.0;
        const isPlayerHighInFlight = player.position.y > 4.5 || player.state === 'JETPACK' || player.getJetpackPhase() !== 'NONE';
        if (isPlayerHighInFlight && isGroundCollectible) {
          continue;
        }

        // Magnet attraction effect with upgraded radius and smooth 3D acceleration
        if (isMagnet && col.type === 'COIN') {
          const distSq = colWorldPos.distanceToSquared(playerChestPos);
          if (distSq < magnetRadius * magnetRadius) {
            col.isMagnetized = true;
            const dist = Math.sqrt(distSq);
            // Smooth arcade acceleration: accelerates from 18m/s to 38m/s near player
            const normDist = Math.max(0, 1.0 - dist / magnetRadius);
            const speed = 18.0 + normDist * normDist * 22.0;
            const dir = playerChestPos.clone().sub(colWorldPos).normalize();

            // Move mesh in full 3D toward chest without snapping Y
            col.group.position.addScaledVector(dir, speed * dt);
            colWorldPos.addScaledVector(dir, speed * dt);

            // Synchronize collider continuously in world space
            col.collider.setFromCenterAndSize(colWorldPos, new THREE.Vector3(1.4, 1.4, 1.4));
          }
        }

        // Collection check: swept volume ensures zero missed coins at high speeds
        const isCollected = col.collider.intersectsBox(sweptCollectibleBox) ||
          (col.isMagnetized && colWorldPos.distanceTo(playerChestPos) <= 1.25);

        if (isCollected) {
          col.active = false;
          chunk.group.remove(col.group);

          // Trigger lightweight pooled golden particle splash
          this.triggerCoinPickupVFX(colWorldPos);

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

  private triggerCoinPickupVFX(pos: THREE.Vector3): void {
    const vfx = this.pickupVfxPool.find((v) => !v.active);
    if (!vfx) return;

    vfx.active = true;
    vfx.age = 0;
    vfx.group.position.copy(pos);
    vfx.group.visible = true;

    // Reset expanding halo ring
    vfx.ring.scale.set(0.4, 0.4, 0.4);
    (vfx.ring.material as THREE.MeshBasicMaterial).opacity = 0.95;

    // Reset sparkles
    for (let i = 0; i < vfx.sparkles.length; i++) {
      const s = vfx.sparkles[i];
      s.position.set(0, 0, 0);
      s.scale.setScalar(1.0);
      (s.material as THREE.MeshBasicMaterial).opacity = 1.0;
    }
  }

  private updatePickupVFX(dt: number): void {
    for (const vfx of this.pickupVfxPool) {
      if (!vfx.active) continue;

      vfx.age += dt;
      const progress = Math.min(1.0, vfx.age / vfx.maxAge);

      if (progress >= 1.0) {
        vfx.active = false;
        vfx.group.visible = false;
        continue;
      }

      // Smooth expansion and fade for ring
      const ringScale = 0.4 + progress * 2.2;
      vfx.ring.scale.set(ringScale, ringScale, ringScale);
      (vfx.ring.material as THREE.MeshBasicMaterial).opacity = (1.0 - progress) * 0.95;

      // Radiate sparkle diamonds outward and upward with subtle gravity
      for (let i = 0; i < vfx.sparkles.length; i++) {
        const s = vfx.sparkles[i];
        const vel = vfx.sparkleVelocities[i];
        s.position.x += vel.x * dt;
        s.position.y += vel.y * dt - 9.8 * dt * dt * 0.5;
        s.position.z += vel.z * dt;
        s.scale.setScalar(Math.max(0.01, 1.0 - progress * 0.85));
        (s.material as THREE.MeshBasicMaterial).opacity = 1.0 - progress;
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
      obstacleId: obs.id,
      activeSupportObstacleId: player.getActiveSupportObstacleId(),
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

  public getActiveEnvironment(): EnvironmentId {
    return this.activeEnvironment;
  }

  public setEnvironment(envId: EnvironmentId): void {
    this.activeEnvironment = envId;
    this.targetEnvironment = envId;
    this.envManager.savePreference(envId);
    const theme = this.envManager.getTheme(envId);
    for (const chunk of this.chunks) {
      chunk.buildEnvironmentScenery(theme, false);
    }
    this.eventBus.emit('ENVIRONMENT_CHANGED', envId);
  }

  public getChunksUntilTransition(): number {
    return this.chunksUntilTransition;
  }

  /**
   * Deterministic Safe-Respawn System
   * Deactivates the lethal collision obstacle and clears immediate hazard zone [Z - 10, Z + 6].
   * Ensures the player is placed in a guaranteed open lane with at least 12-15m reachable runway.
   */
  public prepareSafeReviveRespawn(player: Player): LaneIndex {
    const playerZ = player.position.z;
    const playerBox = player.collider;
    const currentLane = player.currentLane;

    // 1. Deactivate and clear any lethal obstacle intersecting or immediately adjacent to player
    for (const chunk of this.chunks) {
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;

        // Check if obstacle directly overlaps player or is within lethal impact zone in the current lane
        const inLethalRange = obs.collider.max.z >= playerZ - 10.0 && obs.collider.min.z <= playerZ + 6.0;
        const inCurrentLane = obs.lane === currentLane;
        const intersects = obs.collider.intersectsBox(playerBox);

        if (intersects || (inLethalRange && inCurrentLane)) {
          obs.active = false;
          chunk.group.remove(obs.group);
        }
      }
    }

    // 2. Evaluate all 3 lanes (-1, 0, 1) for safety in the upcoming 15 meters [playerZ - 15, playerZ]
    const lanes: LaneIndex[] = [-1, 0, 1];
    const laneHazards: Record<LaneIndex, number> = { [-1]: 0, [0]: 0, [1]: 0 };

    for (const chunk of this.chunks) {
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;
        const isAhead = obs.collider.max.z >= playerZ - 15.0 && obs.collider.min.z <= playerZ;
        if (isAhead && lanes.includes(obs.lane as LaneIndex)) {
          laneHazards[obs.lane as LaneIndex]++;
        }
      }
    }

    // Prefer current lane if clear; otherwise pick adjacent clear lane
    let chosenLane: LaneIndex = currentLane;
    if (laneHazards[currentLane] > 0) {
      // Find a lane with zero upcoming hazards
      const zeroHazardLanes = lanes.filter(l => laneHazards[l] === 0);
      if (zeroHazardLanes.length > 0) {
        // Pick closest zero hazard lane to current lane
        zeroHazardLanes.sort((a, b) => Math.abs(a - currentLane) - Math.abs(b - currentLane));
        chosenLane = zeroHazardLanes[0];
      } else {
        // If all lanes have obstacles, pick the lane with the fewest hazards and clear runway
        lanes.sort((a, b) => laneHazards[a] - laneHazards[b]);
        chosenLane = lanes[0];
        // Clear obstacles within 10m ahead in that chosen lane to guarantee safe runway
        for (const chunk of this.chunks) {
          for (const obs of chunk.obstacles) {
            if (!obs.active) continue;
            if (obs.lane === chosenLane && obs.collider.max.z >= playerZ - 10.0 && obs.collider.min.z <= playerZ) {
              obs.active = false;
              chunk.group.remove(obs.group);
            }
          }
        }
      }
    }

    this.previousPlayerZ = playerZ;
    return chosenLane;
  }
}

