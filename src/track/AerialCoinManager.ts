import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';
import { CollectibleFactory } from './CollectibleFactory';
import { Player } from '../player/Player';

export interface AerialCoinInstance {
  group: THREE.Group;
  collider: THREE.Box3;
  active: boolean;
  baseY: number;
  worldPos: THREE.Vector3;
  isMagnetized: boolean;
  lane: LaneIndex;
}

export class AerialCoinManager {
  public group: THREE.Group;
  private coinPool: AerialCoinInstance[] = [];
  private eventBus: EventBus;

  // Active Flight Generation State
  private isFlightActive: boolean = false;
  private flightStartPlayerZ: number = 0;
  private takeoffStartY: number = CONSTANTS.PLAYER_BASE_Y;
  private flightSpeed: number = CONSTANTS.INITIAL_SPEED;
  private flightDuration: number = CONSTANTS.POWERUP_DURATION;
  private spawnCursorZ: number = 0;
  private landingZ: number = 0;
  private takeoffEndZ: number = 0;
  private descentStartZ: number = 0;
  private postLandingEndZ: number = 0;
  private landingLane: LaneIndex = 0;
  private flightStartLane: LaneIndex = 0;
  private lastPlannedSpeed: number = CONSTANTS.INITIAL_SPEED;

  constructor(
    private scene: THREE.Scene,
    private collectibleFactory: CollectibleFactory = new CollectibleFactory()
  ) {
    this.group = new THREE.Group();
    this.group.name = 'AERIAL_COINS_GROUP';
    this.scene.add(this.group);
    this.eventBus = EventBus.getInstance();

    // Pre-allocate pool of 160 reusable 3D arcade coins
    const poolSize = CONSTANTS.JETPACK_AERIAL_POOL_SIZE || 160;
    for (let i = 0; i < poolSize; i++) {
      const coinGroup = this.collectibleFactory.createCoin();
      coinGroup.visible = false;
      this.group.add(coinGroup);

      this.coinPool.push({
        group: coinGroup,
        collider: new THREE.Box3(),
        active: false,
        baseY: CONSTANTS.JETPACK_ALTITUDE,
        worldPos: new THREE.Vector3(),
        isMagnetized: false,
        lane: 0
      });
    }

    // Reset when run starts or restarts
    this.eventBus.on(EVENTS.RUN_STARTED, () => this.reset());
    this.eventBus.on(EVENTS.GAME_RESTART, () => this.reset());
  }

  public getPool(): AerialCoinInstance[] {
    return this.coinPool;
  }

  public isJetpackFlightActive(): boolean {
    return this.isFlightActive;
  }

  /**
   * Activates dedicated aerial coin route when Jetpack starts
   */
  public onJetpackActivated(player: Player): void {
    this.isFlightActive = true;
    this.flightStartPlayerZ = player.position.z;
    const baseGround = (player.groundY || CONSTANTS.PLAYER_BASE_Y) + 0.85;
    this.takeoffStartY = (player.position.y > 5.0) ? baseGround : Math.max(player.position.y, baseGround);
    this.flightStartLane = player.currentLane;
    this.landingLane = player.currentLane; // Default landing runway matches flight approach
    this.flightSpeed = Math.max(CONSTANTS.INITIAL_SPEED, player.speed);
    this.flightDuration = player.powerups.getJetpackDuration();

    const takeoffDist = this.flightSpeed * (CONSTANTS.JETPACK_TAKEOFF_DURATION || 1.0);
    const descentDist = this.flightSpeed * (CONSTANTS.JETPACK_DESCENT_DURATION || 1.8);
    const totalFlightDist = this.flightSpeed * this.flightDuration;
    const postLandingRunway = CONSTANTS.JETPACK_SAFE_LANDING_RUNWAY || 25.0;

    this.takeoffEndZ = this.flightStartPlayerZ - takeoffDist;
    this.landingZ = this.flightStartPlayerZ - totalFlightDist;
    this.descentStartZ = this.landingZ + descentDist;
    this.postLandingEndZ = this.landingZ - postLandingRunway;
    this.lastPlannedSpeed = this.flightSpeed;

    // Start spawning coins immediately ahead along takeoff climb arc
    const spacing = CONSTANTS.JETPACK_COIN_SPACING || 2.2;
    this.spawnCursorZ = this.flightStartPlayerZ - spacing;
  }

  /**
   * Extends flight route when a second jetpack is collected while flight is active
   */
  public onJetpackRefreshed(player: Player): void {
    this.isFlightActive = true;
    const remaining = player.powerups.getJetpackRemaining();
    const currentSpeed = Math.max(CONSTANTS.INITIAL_SPEED, player.speed);
    const descentDist = currentSpeed * (CONSTANTS.JETPACK_DESCENT_DURATION || 1.8);
    const totalRemainingDist = currentSpeed * remaining;
    const postLandingRunway = CONSTANTS.JETPACK_SAFE_LANDING_RUNWAY || 25.0;

    this.landingZ = player.position.z - totalRemainingDist;
    this.descentStartZ = this.landingZ + descentDist;
    this.postLandingEndZ = this.landingZ - postLandingRunway;
    this.lastPlannedSpeed = currentSpeed;
  }

  public getLandingZ(): number {
    return this.landingZ;
  }

  public getTakeoffEndZ(): number {
    return this.takeoffEndZ;
  }

  public getDescentStartZ(): number {
    return this.descentStartZ;
  }

  public getPostLandingEndZ(): number {
    return this.postLandingEndZ;
  }

  public getLandingLane(): LaneIndex {
    return this.landingLane;
  }

  public setLandingLane(lane: LaneIndex): void {
    this.landingLane = lane;
  }

  /**
   * Computes squared distance from point (px,py,pz) to 3D line segment [V, W]
   */
  private distToSegmentSquared(
    px: number, py: number, pz: number,
    vx: number, vy: number, vz: number,
    wx: number, wy: number, wz: number
  ): number {
    const dx = wx - vx;
    const dy = wy - vy;
    const dz = wz - vz;
    const l2 = dx * dx + dy * dy + dz * dz;
    if (l2 === 0) {
      const ex = px - vx;
      const ey = py - vy;
      const ez = pz - vz;
      return ex * ex + ey * ey + ez * ez;
    }
    let t = ((px - vx) * dx + (py - vy) * dy + (pz - vz) * dz) / l2;
    t = Math.max(0, Math.min(1.0, t));
    const closeX = vx + t * dx;
    const closeY = vy + t * dy;
    const closeZ = vz + t * dz;
    const rx = px - closeX;
    const ry = py - closeY;
    const rz = pz - closeZ;
    return rx * rx + ry * ry + rz * rz;
  }

  /**
   * Main per-frame update loop: schedules coins ahead, animates, handles swept pickups & magnet
   */
  public update(
    player: Player,
    dt: number,
    timeSec: number,
    isMagnet: boolean,
    magnetRadius: number,
    onCoinCollected?: (pos: THREE.Vector3) => void
  ): void {
    const isPlayerInJetpack = player.powerups.isJetpackActive() ||
      player.state === 'JETPACK' ||
      player.getJetpackPhase() === 'DESCENT' ||
      player.getJetpackPhase() === 'SAFE_LANDING';

    // 1. If jetpack is active, dynamically adjust descent landing corridor and schedule forward-looking coins up to 120m ahead
    if (this.isFlightActive && isPlayerInJetpack) {
      const remaining = player.powerups.getJetpackRemaining();
      const currentSpeed = Math.max(CONSTANTS.INITIAL_SPEED, player.speed);

      // Track current player lane during approach and descent
      if (player.getJetpackPhase() === 'DESCENT' || remaining <= 2.5) {
        this.landingLane = player.currentLane;
      }

      // Dynamically refine landingZ during cruise only if runner speed changes significantly
      if (player.getJetpackPhase() === 'CRUISE' && remaining > (CONSTANTS.JETPACK_DESCENT_DURATION || 1.8) + 0.5) {
        if (Math.abs(currentSpeed - this.lastPlannedSpeed) > 1.5) {
          this.lastPlannedSpeed = currentSpeed;
          const descentDist = currentSpeed * (CONSTANTS.JETPACK_DESCENT_DURATION || 1.8);
          const projectedLandingZ = player.position.z - currentSpeed * remaining;
          this.landingZ = projectedLandingZ;
          this.descentStartZ = this.landingZ + descentDist;
          this.postLandingEndZ = this.landingZ - (CONSTANTS.JETPACK_SAFE_LANDING_RUNWAY || 25.0);
        }
      }

      const aheadHorizon = 120.0;
      const targetSpawnHorizon = player.position.z - aheadHorizon;
      const spacing = CONSTANTS.JETPACK_COIN_SPACING || 2.2;
      const finalCorridorZ = this.postLandingEndZ;

      while (this.spawnCursorZ > targetSpawnHorizon && this.spawnCursorZ > finalCorridorZ) {
        this.spawnNextAerialCoin(player);
        this.spawnCursorZ -= spacing;
      }
    }

    // 2. Continuous frame-rate independent rotation and floating animation
    const rotSpeed = CONSTANTS.COIN_ROTATION_SPEED;
    const playerChestPos = player.position.clone();
    playerChestPos.y += 0.5;

    // Full 3D swept AABB volume to prevent tunneling during high-speed flight, lane changes, and altitude changes
    const playerBox = player.collider;
    const sweptBox = playerBox.clone();
    const prevPos = player.previousPosition;
    if (prevPos) {
      const halfW = CONSTANTS.PLAYER_WIDTH * 0.5 + 0.5;
      const halfD = CONSTANTS.PLAYER_DEPTH * 0.5 + 0.5;
      const height = (player.isSliding ? CONSTANTS.PLAYER_HEIGHT_SLIDE : CONSTANTS.PLAYER_HEIGHT_RUN) + 0.5;

      sweptBox.min.set(
        Math.min(playerBox.min.x, prevPos.x - halfW),
        Math.min(playerBox.min.y, prevPos.y - 0.35),
        Math.min(playerBox.min.z, prevPos.z - halfD)
      );
      sweptBox.max.set(
        Math.max(playerBox.max.x, prevPos.x + halfW),
        Math.max(playerBox.max.y, prevPos.y + height),
        Math.max(playerBox.max.z, prevPos.z + halfD)
      );
    }

    const prevChestPos = prevPos ? prevPos.clone() : playerChestPos.clone();
    if (prevPos) prevChestPos.y += 0.5;

    let hasActiveCoins = false;

    for (const coin of this.coinPool) {
      if (!coin.active) continue;
      hasActiveCoins = true;

      // Frame-rate independent continuous spin
      coin.group.rotation.y += rotSpeed * dt;

      // Subtle aerodynamic altitude floating bob (unless magnetized)
      if (!coin.isMagnetized) {
        const bob = Math.sin(timeSec * 2.8 + coin.worldPos.z * 0.15) * 0.08;
        coin.group.position.y = coin.baseY + bob;
        coin.worldPos.y = coin.group.position.y;
      }

      // Magnet attraction if magnet power-up is active
      if (isMagnet) {
        const distSq = coin.worldPos.distanceToSquared(playerChestPos);
        if (distSq < magnetRadius * magnetRadius) {
          coin.isMagnetized = true;
          const dist = Math.sqrt(distSq);
          const normDist = Math.max(0, 1.0 - dist / magnetRadius);
          const pullSpeed = 20.0 + normDist * normDist * 25.0;
          const pullDir = playerChestPos.clone().sub(coin.worldPos).normalize();

          coin.worldPos.addScaledVector(pullDir, pullSpeed * dt);
          coin.group.position.copy(coin.worldPos);
          coin.collider.setFromCenterAndSize(coin.worldPos, new THREE.Vector3(1.3, 1.3, 1.3));
        }
      }

      // Continuous world-space collider synchronization
      coin.collider.min.set(
        coin.worldPos.x - CONSTANTS.COIN_RADIUS,
        coin.worldPos.y - CONSTANTS.COIN_RADIUS,
        coin.worldPos.z - CONSTANTS.COIN_RADIUS
      );
      coin.collider.max.set(
        coin.worldPos.x + CONSTANTS.COIN_RADIUS,
        coin.worldPos.y + CONSTANTS.COIN_RADIUS,
        coin.worldPos.z + CONSTANTS.COIN_RADIUS
      );

      // Continuous 3D swept segment-versus-volume and distance pickup detection
      const distSqToSegment = this.distToSegmentSquared(
        coin.worldPos.x, coin.worldPos.y, coin.worldPos.z,
        prevChestPos.x, prevChestPos.y, prevChestPos.z,
        playerChestPos.x, playerChestPos.y, playerChestPos.z
      );
      const distToCurrent = coin.worldPos.distanceTo(playerChestPos);
      const pickupRadius = 1.4;
      const isCollected =
        coin.collider.intersectsBox(sweptBox) ||
        distSqToSegment <= pickupRadius * pickupRadius ||
        distToCurrent <= pickupRadius ||
        (coin.isMagnetized && distToCurrent <= 1.5);

      if (isCollected) {
        coin.active = false;
        coin.group.visible = false;
        this.eventBus.emit(EVENTS.COIN_COLLECTED, {
          worldPos: coin.worldPos.clone(),
          isAerial: true,
          value: 1
        });
        if (onCoinCollected) onCoinCollected(coin.worldPos.clone());
        continue;
      }

      // Recycle coins only when they have safely passed behind the player
      if (coin.worldPos.z > player.position.z + 12.0) {
        coin.active = false;
        coin.group.visible = false;
      }
    }

    // If player is no longer flying and all coins have passed, close flight session cleanly
    if (!isPlayerInJetpack && !hasActiveCoins && this.isFlightActive) {
      this.isFlightActive = false;
    }
  }

  /**
   * Spawns a single aerial coin along the flight trajectory at current spawnCursorZ
   */
  private spawnNextAerialCoin(player: Player): void {
    const freeCoin = this.coinPool.find((c) => !c.active);
    if (!freeCoin) return; // Pool fully saturated

    const z = this.spawnCursorZ;
    let x = 0;
    let y: number = CONSTANTS.JETPACK_ALTITUDE;
    let lane: LaneIndex = 0;

    const groundY = (player.groundY || CONSTANTS.PLAYER_BASE_Y) + 0.85;
    const cruiseY = CONSTANTS.JETPACK_ALTITUDE;

    if (z > this.takeoffEndZ) {
      // 1. TAKEOFF ASCENT ARC: Smooth cubic rise from takeoff altitude up to cruise altitude
      const totalTakeoffDist = Math.max(1.0, this.flightStartPlayerZ - this.takeoffEndZ);
      const t = Math.max(0, Math.min(1.0, (this.flightStartPlayerZ - z) / totalTakeoffDist));
      const ease = t * t * (3.0 - 2.0 * t); // Smoothstep cubic ease-in-out
      y = this.takeoffStartY + (cruiseY - this.takeoffStartY) * ease;
      lane = this.flightStartLane;
      x = CONSTANTS.LANES[lane];
    } else if (z > this.descentStartZ) {
      // 2. CRUISE FLIGHT RIBBONS: Procedural 3-lane rhythmic patterns with 100% reachable track alignments
      y = cruiseY;
      const cruiseDist = this.takeoffEndZ - z;
      const patternBlock = Math.floor(cruiseDist / 30.0); // 30m per pattern section (~13 coins)
      const patternType = patternBlock % 5;

      switch (patternType) {
        case 0:
          // Center high-speed expressway ribbon
          lane = 0;
          x = CONSTANTS.LANES[0];
          break;

        case 1:
          // Left lane speed corridor
          lane = -1;
          x = CONSTANTS.LANES[-1];
          break;

        case 2:
          // Right lane speed corridor
          lane = 1;
          x = CONSTANTS.LANES[1];
          break;

        case 3:
          // Center-to-Left reachable stepped lane switch
          // 15m in center lane, then 15m in left lane with clear steering reaction time
          const stepPhase1 = (cruiseDist % 30.0) / 30.0;
          lane = stepPhase1 < 0.5 ? 0 : -1;
          x = CONSTANTS.LANES[lane];
          break;

        case 4:
        default:
          // Center-to-Right reachable stepped lane switch
          const stepPhase2 = (cruiseDist % 30.0) / 30.0;
          lane = stepPhase2 < 0.5 ? 0 : 1;
          x = CONSTANTS.LANES[lane];
          break;
      }
    } else if (z > this.landingZ) {
      // 3. DESCENT GLIDE SLOPE: Smooth cubic glide slope descending into the clear landing runway
      const totalDescentDist = Math.max(1.0, this.descentStartZ - this.landingZ);
      const t = Math.max(0, Math.min(1.0, (this.descentStartZ - z) / totalDescentDist));
      const ease = t * t * (3.0 - 2.0 * t); // Smoothstep
      y = cruiseY - (cruiseY - groundY) * ease;
      lane = this.landingLane;
      x = CONSTANTS.LANES[lane];
    } else {
      // 4. POST-LANDING RUNWAY TRAIL: Short continuous ground-level corridor through touchdown zone
      y = groundY;
      lane = this.landingLane;
      x = CONSTANTS.LANES[lane];
    }

    freeCoin.active = true;
    freeCoin.isMagnetized = false;
    freeCoin.baseY = y;
    freeCoin.lane = lane;
    freeCoin.worldPos.set(x, y, z);

    freeCoin.group.position.copy(freeCoin.worldPos);
    freeCoin.group.visible = true;

    // Initialize collider bounds
    freeCoin.collider.min.set(
      x - CONSTANTS.COIN_RADIUS,
      y - CONSTANTS.COIN_RADIUS,
      z - CONSTANTS.COIN_RADIUS
    );
    freeCoin.collider.max.set(
      x + CONSTANTS.COIN_RADIUS,
      y + CONSTANTS.COIN_RADIUS,
      z + CONSTANTS.COIN_RADIUS
    );
  }

  /**
   * Complete cleanup & reset of all pooled aerial coins
   */
  public reset(): void {
    this.isFlightActive = false;
    this.spawnCursorZ = 0;
    for (const coin of this.coinPool) {
      coin.active = false;
      coin.isMagnetized = false;
      coin.group.visible = false;
      coin.worldPos.set(0, -999, 0);
    }
  }
}
