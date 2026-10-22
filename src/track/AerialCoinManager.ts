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
  private flightSpeed: number = CONSTANTS.INITIAL_SPEED;
  private flightDuration: number = CONSTANTS.POWERUP_DURATION;
  private spawnCursorZ: number = 0;
  private landingZ: number = 0;
  private takeoffEndZ: number = 0;
  private descentStartZ: number = 0;
  private landingLane: LaneIndex = 0;
  private flightStartLane: LaneIndex = 0;

  // Procedural pattern rhythm
  private cruisePatternIndex: number = 0;

  constructor(
    private scene: THREE.Scene,
    private collectibleFactory: CollectibleFactory
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
    this.flightStartLane = player.currentLane;
    this.landingLane = player.currentLane; // Default landing runway matches flight approach
    this.flightSpeed = Math.max(CONSTANTS.INITIAL_SPEED, player.speed);
    this.flightDuration = player.powerups.getJetpackDuration();

    const takeoffDist = this.flightSpeed * CONSTANTS.JETPACK_TAKEOFF_DURATION;
    const descentDist = this.flightSpeed * CONSTANTS.JETPACK_DESCENT_DURATION;
    const totalFlightDist = this.flightSpeed * this.flightDuration;

    this.takeoffEndZ = this.flightStartPlayerZ - takeoffDist;
    this.landingZ = this.flightStartPlayerZ - totalFlightDist;
    this.descentStartZ = this.landingZ + descentDist;

    // Start spawning coins immediately ahead along takeoff climb arc
    const spacing = CONSTANTS.JETPACK_COIN_SPACING || 2.2;
    this.spawnCursorZ = this.flightStartPlayerZ - spacing;
    this.cruisePatternIndex = 0;
  }

  public getLandingZ(): number {
    return this.landingZ;
  }

  public getLandingLane(): LaneIndex {
    return this.landingLane;
  }

  public setLandingLane(lane: LaneIndex): void {
    this.landingLane = lane;
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
    onCoinCollected: (pos: THREE.Vector3) => void
  ): void {
    const isPlayerInJetpack = player.powerups.isJetpackActive() || player.state === 'JETPACK';

    // 1. If jetpack is active, schedule forward-looking aerial coins up to 120m ahead
    if (this.isFlightActive && isPlayerInJetpack) {
      const aheadHorizon = 120.0;
      const targetSpawnHorizon = player.position.z - aheadHorizon;
      const spacing = CONSTANTS.JETPACK_COIN_SPACING || 2.2;

      while (this.spawnCursorZ > targetSpawnHorizon && this.spawnCursorZ > this.landingZ) {
        this.spawnNextAerialCoin(player);
        this.spawnCursorZ -= spacing;
      }
    }

    // 2. Continuous frame-rate independent rotation and floating animation
    const rotSpeed = CONSTANTS.COIN_ROTATION_SPEED;
    const playerChestPos = player.position.clone();
    playerChestPos.y += 0.5;

    const playerBox = player.collider;
    const sweptBox = playerBox.clone();
    if (player.previousPosition) {
      sweptBox.min.z = Math.min(playerBox.min.z, player.previousPosition.z - 0.5);
      sweptBox.max.z = Math.max(playerBox.max.z, player.previousPosition.z + 0.5);
    }

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

      // Swept pickup detection
      const distanceToPlayer = coin.worldPos.distanceTo(playerChestPos);
      const isCollected = coin.collider.intersectsBox(sweptBox) ||
        distanceToPlayer <= 1.4 ||
        (coin.isMagnetized && distanceToPlayer <= 1.5);

      if (isCollected) {
        coin.active = false;
        coin.group.visible = false;
        this.eventBus.emit(EVENTS.COIN_COLLECTED);
        onCoinCollected(coin.worldPos.clone());
        continue;
      }

      // Recycle coins that have safely passed behind the player
      if (coin.worldPos.z > player.position.z + 10.0) {
        coin.active = false;
        coin.group.visible = false;
      }
    }

    // If player is no longer flying and all coins have passed, close flight session
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
    let y = CONSTANTS.JETPACK_ALTITUDE;
    let lane: LaneIndex = 0;

    const groundY = 0.85;
    const cruiseY = CONSTANTS.JETPACK_ALTITUDE;

    if (z > this.takeoffEndZ) {
      // 1. TAKEOFF ASCENT ARC: Smooth cubic rise from ground up to cruise altitude
      const totalTakeoffDist = Math.max(1.0, this.flightStartPlayerZ - this.takeoffEndZ);
      const t = Math.max(0, Math.min(1.0, (this.flightStartPlayerZ - z) / totalTakeoffDist));
      const ease = t * t * (3.0 - 2.0 * t); // Smoothstep
      y = groundY + (cruiseY - groundY) * ease;
      lane = this.flightStartLane;
      x = CONSTANTS.LANES[lane];
    } else if (z <= this.descentStartZ) {
      // 3. DESCENT GLIDE SLOPE: Smooth glide descending into clear landing runway
      const totalDescentDist = Math.max(1.0, this.descentStartZ - this.landingZ);
      const t = Math.max(0, Math.min(1.0, (this.descentStartZ - z) / totalDescentDist));
      const ease = t * t * (3.0 - 2.0 * t); // Smoothstep
      y = cruiseY - (cruiseY - groundY) * ease;
      lane = this.landingLane;
      x = CONSTANTS.LANES[lane];
    } else {
      // 2. CRUISE FLIGHT RIBBONS: Procedural 3-lane rhythmic patterns
      y = cruiseY;
      const cruiseDist = this.takeoffEndZ - z;
      const patternBlock = Math.floor(cruiseDist / 36.0); // 36m per pattern section (~16 coins)
      const patternType = patternBlock % 5;

      switch (patternType) {
        case 0:
          // Center high-speed expressway ribbon
          lane = 0;
          x = CONSTANTS.LANES[0];
          break;

        case 1:
          // Sweeping smooth sinusoidal S-curve across lanes (-1 to +1)
          const sinPhase = (cruiseDist % 36.0) / 36.0;
          x = Math.sin(sinPhase * Math.PI * 2.0) * CONSTANTS.LANE_WIDTH;
          lane = (x < -1.2 ? -1 : x > 1.2 ? 1 : 0) as LaneIndex;
          break;

        case 2:
          // Left lane bonus speedway
          lane = -1;
          x = CONSTANTS.LANES[-1];
          break;

        case 3:
          // Right lane bonus speedway
          lane = 1;
          x = CONSTANTS.LANES[1];
          break;

        case 4:
        default:
          // Diagonal lane switch ribbon (transitions from Left to Right)
          const diagT = (cruiseDist % 36.0) / 36.0;
          x = -CONSTANTS.LANE_WIDTH + diagT * (CONSTANTS.LANE_WIDTH * 2.0);
          lane = (x < -1.2 ? -1 : x > 1.2 ? 1 : 0) as LaneIndex;
          break;
      }
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
