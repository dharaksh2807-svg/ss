import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { CurvedShaderManager } from '../scene/CurvedShader';
import { ObstacleFactory, ObstacleInstance } from './ObstacleFactory';
import { CollectibleFactory, CollectibleInstance } from './CollectibleFactory';
import { TrackPattern } from './ObstaclePatterns';

export class TrackChunk {
  public group: THREE.Group;
  public chunkZ: number = 0; // World Z position of chunk start
  public length: number = CONSTANTS.CHUNK_LENGTH;

  public obstacles: ObstacleInstance[] = [];
  public collectibles: CollectibleInstance[] = [];

  private static sharedMaterials: {
    ballastMat: THREE.MeshStandardMaterial;
    sleeperMat: THREE.MeshStandardMaterial;
    railMat: THREE.MeshStandardMaterial;
    catenaryMat: THREE.MeshStandardMaterial;
    buildingMats: THREE.MeshStandardMaterial[];
    tunnelMat: THREE.MeshStandardMaterial;
  } | null = null;

  constructor(
    private obstacleFactory: ObstacleFactory,
    private collectibleFactory: CollectibleFactory
  ) {
    this.group = new THREE.Group();
    this.initSharedMaterials();
    this.buildStaticTrackGeometry();
  }

  private initSharedMaterials(): void {
    if (TrackChunk.sharedMaterials) return;
    const curved = CurvedShaderManager.getInstance();

    const ballastMat = new THREE.MeshStandardMaterial({
      color: CONSTANTS.COLORS.BALLAST,
      roughness: 0.9,
      metalness: 0.1
    });
    curved.applyCurvature(ballastMat);

    const sleeperMat = new THREE.MeshStandardMaterial({
      color: CONSTANTS.COLORS.SLEEPER,
      roughness: 0.8
    });
    curved.applyCurvature(sleeperMat);

    const railMat = new THREE.MeshStandardMaterial({
      color: CONSTANTS.COLORS.RAIL,
      metalness: 0.85,
      roughness: 0.25
    });
    curved.applyCurvature(railMat);

    const catenaryMat = new THREE.MeshStandardMaterial({
      color: 0x3a404d,
      roughness: 0.6,
      metalness: 0.6
    });
    curved.applyCurvature(catenaryMat);

    const createFacadeTexture = (baseColorHex: number): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = `#${baseColorHex.toString(16).padStart(6, '0')}`;
      ctx.fillRect(0, 0, 128, 256);

      // Floor dividing bands
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      for (let y = 0; y < 256; y += 42) {
        ctx.fillRect(0, y, 128, 4);
      }

      // Windows grid
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 3; c++) {
          const x = 14 + c * 38;
          const y = 8 + r * 42;
          // Dark window frame
          ctx.fillStyle = 'rgba(10, 15, 25, 0.7)';
          ctx.fillRect(x - 2, y - 2, 24, 28);
          // Lit or reflective glass
          const isWarm = (r * 2 + c) % 3 === 0;
          ctx.fillStyle = isWarm ? '#ffea79' : '#81ecec';
          ctx.fillRect(x, y, 20, 24);
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 4);
      return texture;
    };

    const buildingMats = [
      new THREE.MeshStandardMaterial({
        map: createFacadeTexture(CONSTANTS.COLORS.BUILDING_1),
        roughness: 0.65
      }),
      new THREE.MeshStandardMaterial({
        map: createFacadeTexture(CONSTANTS.COLORS.BUILDING_2),
        roughness: 0.65
      }),
      new THREE.MeshStandardMaterial({
        map: createFacadeTexture(CONSTANTS.COLORS.BUILDING_3),
        roughness: 0.65
      }),
      new THREE.MeshStandardMaterial({
        map: createFacadeTexture(CONSTANTS.COLORS.BUILDING_4),
        roughness: 0.65
      })
    ];
    buildingMats.forEach((m) => curved.applyCurvature(m));

    const tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x222633,
      roughness: 0.9
    });
    curved.applyCurvature(tunnelMat);

    TrackChunk.sharedMaterials = {
      ballastMat,
      sleeperMat,
      railMat,
      catenaryMat,
      buildingMats,
      tunnelMat
    };
  }

  private buildStaticTrackGeometry(): void {
    const mats = TrackChunk.sharedMaterials!;

    // 1. Ballast Roadbed (Gravel base under tracks)
    const roadbedWidth = CONSTANTS.LANE_WIDTH * 3 + 2.4;
    const roadbedGeo = new THREE.BoxGeometry(roadbedWidth, 0.4, this.length);
    const roadbed = new THREE.Mesh(roadbedGeo, mats.ballastMat);
    roadbed.position.set(0, -0.2, -this.length * 0.5);
    roadbed.receiveShadow = true;
    this.group.add(roadbed);

    // 2. Concrete Track Edges / Curbs
    const curbWidth = 0.6;
    const curbGeo = new THREE.BoxGeometry(curbWidth, 0.6, this.length);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x555566, roughness: 0.8 });
    CurvedShaderManager.getInstance().applyCurvature(curbMat);

    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-roadbedWidth * 0.5 - curbWidth * 0.5, -0.1, -this.length * 0.5);
    leftCurb.receiveShadow = true;
    this.group.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(roadbedWidth * 0.5 + curbWidth * 0.5, -0.1, -this.length * 0.5);
    rightCurb.receiveShadow = true;
    this.group.add(rightCurb);

    // 3. Rails & Sleepers for each of the 3 lanes
    const sleeperSpacing = 1.6;
    const sleeperCount = Math.floor(this.length / sleeperSpacing);
    const sleeperGeo = new THREE.BoxGeometry(CONSTANTS.LANE_WIDTH * 0.8, 0.14, 0.35);

    const railGauge = 1.6; // Spacing between left and right steel rail in a lane
    const railWidth = 0.12;
    const railHeight = 0.18;
    const railGeo = new THREE.BoxGeometry(railWidth, railHeight, this.length);

    CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
      // Steel Rails (Pair per lane)
      const leftRail = new THREE.Mesh(railGeo, mats.railMat);
      leftRail.position.set(laneX - railGauge * 0.5, railHeight * 0.5, -this.length * 0.5);
      leftRail.castShadow = true;
      leftRail.receiveShadow = true;
      this.group.add(leftRail);

      const rightRail = new THREE.Mesh(railGeo, mats.railMat);
      rightRail.position.set(laneX + railGauge * 0.5, railHeight * 0.5, -this.length * 0.5);
      rightRail.castShadow = true;
      rightRail.receiveShadow = true;
      this.group.add(rightRail);

      // Sleepers (Ties)
      for (let s = 0; s < sleeperCount; s++) {
        const sleeper = new THREE.Mesh(sleeperGeo, mats.sleeperMat);
        sleeper.position.set(laneX, 0.05, -s * sleeperSpacing - sleeperSpacing * 0.5);
        sleeper.receiveShadow = true;
        this.group.add(sleeper);
      }
    });

    // 4. Overhead Catenary Poles & Arch Gantries
    const gantrySpacing = 24.0;
    const gantryCount = Math.floor(this.length / gantrySpacing);
    for (let g = 0; g < gantryCount; g++) {
      const gantry = this.createCatenaryGantry();
      gantry.position.set(0, 0, -g * gantrySpacing - 12.0);
      this.group.add(gantry);
    }

    // 5. Urban Side Scenery (Buildings, Warehouses, Neon Billboards)
    this.buildUrbanScenery();
  }

  private createCatenaryGantry(): THREE.Group {
    const group = new THREE.Group();
    const mat = TrackChunk.sharedMaterials!.catenaryMat;
    const poleHeight = 7.5;
    const spanWidth = CONSTANTS.LANE_WIDTH * 3 + 3.0;

    // Left vertical steel lattice post
    const poleGeo = new THREE.BoxGeometry(0.35, poleHeight, 0.35);
    const leftPole = new THREE.Mesh(poleGeo, mat);
    leftPole.position.set(-spanWidth * 0.5, poleHeight * 0.5, 0);
    leftPole.castShadow = true;
    group.add(leftPole);

    // Right vertical steel lattice post
    const rightPole = new THREE.Mesh(poleGeo, mat);
    rightPole.position.set(spanWidth * 0.5, poleHeight * 0.5, 0);
    rightPole.castShadow = true;
    group.add(rightPole);

    // Overhead cross girder
    const beamGeo = new THREE.BoxGeometry(spanWidth, 0.45, 0.4);
    const beam = new THREE.Mesh(beamGeo, mat);
    beam.position.set(0, poleHeight - 0.25, 0);
    beam.castShadow = true;
    group.add(beam);

    // Railway Signal Light on Beam
    const signalGeo = new THREE.BoxGeometry(0.5, 0.9, 0.3);
    const signalBox = new THREE.Mesh(signalGeo, mat);
    signalBox.position.set(0, poleHeight - 0.9, 0);
    group.add(signalBox);

    const greenLampGeo = new THREE.CircleGeometry(0.16, 12);
    const greenLampMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
    const greenLamp = new THREE.Mesh(greenLampGeo, greenLampMat);
    greenLamp.position.set(0, poleHeight - 0.75, 0.16);
    group.add(greenLamp);

    return group;
  }

  private buildUrbanScenery(): void {
    const mats = TrackChunk.sharedMaterials!;
    const roadbedWidth = CONSTANTS.LANE_WIDTH * 3 + 2.4;
    const numBuildings = 6;
    const segment = this.length / numBuildings;

    for (let i = 0; i < numBuildings; i++) {
      const zPos = -i * segment - segment * 0.5;

      // Left building
      const hLeft = 14 + Math.random() * 22;
      const wLeft = 10 + Math.random() * 6;
      const dLeft = segment * 0.92;
      const matIdxLeft = Math.floor(Math.random() * mats.buildingMats.length);

      const bLeftGeo = new THREE.BoxGeometry(wLeft, hLeft, dLeft);
      const bLeft = new THREE.Mesh(bLeftGeo, mats.buildingMats[matIdxLeft]);
      bLeft.position.set(-roadbedWidth * 0.5 - wLeft * 0.5 - 1.5, hLeft * 0.5, zPos);
      bLeft.castShadow = true;
      bLeft.receiveShadow = true;
      this.group.add(bLeft);

      // Right building
      const hRight = 16 + Math.random() * 24;
      const wRight = 10 + Math.random() * 6;
      const dRight = segment * 0.92;
      const matIdxRight = Math.floor(Math.random() * mats.buildingMats.length);

      const bRightGeo = new THREE.BoxGeometry(wRight, hRight, dRight);
      const bRight = new THREE.Mesh(bRightGeo, mats.buildingMats[matIdxRight]);
      bRight.position.set(roadbedWidth * 0.5 + wRight * 0.5 + 1.5, hRight * 0.5, zPos);
      bRight.castShadow = true;
      bRight.receiveShadow = true;
      this.group.add(bRight);
    }
  }

  /**
   * Populate chunk with curated obstacle and collectible patterns
   */
  public populate(pattern: TrackPattern, worldZ: number): void {
    this.chunkZ = worldZ;
    this.group.position.z = worldZ;

    // Clear previous items
    this.clearDynamicItems();

    // Spawn Obstacles from pattern
    for (const obsData of pattern.obstacles) {
      let group: THREE.Group;
      const laneX = CONSTANTS.LANES[obsData.lane];
      const localZ = -obsData.zOffset;
      const length = obsData.length || 2.0;

      if (obsData.type === 'TRAIN') {
        const colors = [
          CONSTANTS.COLORS.TRAIN_BODY_1,
          CONSTANTS.COLORS.TRAIN_BODY_2,
          CONSTANTS.COLORS.TRAIN_BODY_3
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        group = this.obstacleFactory.createTrain(length, obsData.hasRamp, color);
      } else if (obsData.type === 'LOW_BARRIER') {
        group = this.obstacleFactory.createLowBarrier();
      } else {
        group = this.obstacleFactory.createHighBarrier();
      }

      group.position.set(laneX, 0, localZ);
      this.group.add(group);

      // Construct AABB in World Coordinates
      const worldCenterZ = worldZ + localZ;
      const collider = new THREE.Box3();
      let roofCollider: THREE.Box3 | undefined;
      let rampCollider: THREE.Box3 | undefined;

      if (obsData.type === 'TRAIN') {
        collider.min.set(
          laneX - CONSTANTS.TRAIN_WIDTH * 0.48,
          0,
          worldCenterZ - length * 0.5
        );
        collider.max.set(
          laneX + CONSTANTS.TRAIN_WIDTH * 0.48,
          CONSTANTS.TRAIN_HEIGHT,
          worldCenterZ + length * 0.5
        );

        // Walkable train roof surface!
        roofCollider = new THREE.Box3(
          new THREE.Vector3(laneX - CONSTANTS.TRAIN_WIDTH * 0.48, CONSTANTS.TRAIN_HEIGHT, worldCenterZ - length * 0.5),
          new THREE.Vector3(laneX + CONSTANTS.TRAIN_WIDTH * 0.48, CONSTANTS.TRAIN_HEIGHT + 0.6, worldCenterZ + length * 0.5)
        );

        if (obsData.hasRamp) {
          rampCollider = new THREE.Box3(
            new THREE.Vector3(laneX - CONSTANTS.TRAIN_WIDTH * 0.45, 0, worldCenterZ + length * 0.5),
            new THREE.Vector3(laneX + CONSTANTS.TRAIN_WIDTH * 0.45, CONSTANTS.TRAIN_HEIGHT, worldCenterZ + length * 0.5 + CONSTANTS.TRAIN_RAMP_LENGTH)
          );
        }
      } else if (obsData.type === 'LOW_BARRIER') {
        collider.min.set(
          laneX - CONSTANTS.LANE_WIDTH * 0.45,
          0,
          worldCenterZ - 0.4
        );
        collider.max.set(
          laneX + CONSTANTS.LANE_WIDTH * 0.45,
          CONSTANTS.LOW_BARRIER_HEIGHT,
          worldCenterZ + 0.4
        );
      } else {
        // High barrier (collider is the upper beam: y >= 1.25)
        collider.min.set(
          laneX - CONSTANTS.LANE_WIDTH * 0.45,
          CONSTANTS.HIGH_BARRIER_CLEARANCE,
          worldCenterZ - 0.4
        );
        collider.max.set(
          laneX + CONSTANTS.LANE_WIDTH * 0.45,
          CONSTANTS.HIGH_BARRIER_HEIGHT + 0.5,
          worldCenterZ + 0.4
        );
      }

      // Near-miss detection trigger volume (slightly wider and in front)
      const nearMissBox = new THREE.Box3(
        new THREE.Vector3(collider.min.x - 0.6, collider.min.y, collider.min.z - 1.0),
        new THREE.Vector3(collider.max.x + 0.6, collider.max.y, collider.max.z + 2.5)
      );

      this.obstacles.push({
        group,
        type: obsData.type,
        lane: obsData.lane,
        collider,
        roofCollider,
        rampCollider,
        nearMissBox,
        nearMissTriggered: false,
        active: true,
        hasRamp: obsData.hasRamp
      });
    }

    // Spawn Collectibles from pattern
    for (const item of pattern.collectibles) {
      const laneX = CONSTANTS.LANES[item.lane];
      const count = item.count || 1;
      const spacing = item.spacing || 2.0;
      const baseY = item.yOffset !== undefined ? item.yOffset : 0.95;

      for (let c = 0; c < count; c++) {
        const localZ = -(item.zOffset + c * spacing);
        const group =
          item.type === 'COIN'
            ? this.collectibleFactory.createCoin()
            : this.collectibleFactory.createPowerup(item.type);

        group.position.set(laneX, baseY, localZ);
        this.group.add(group);

        const worldItemZ = worldZ + localZ;
        const collider = new THREE.Box3(
          new THREE.Vector3(laneX - 0.6, baseY - 0.6, worldItemZ - 0.6),
          new THREE.Vector3(laneX + 0.6, baseY + 0.6, worldItemZ + 0.6)
        );

        this.collectibles.push({
          group,
          type: item.type,
          lane: item.lane,
          collider,
          active: true,
          baseY
        });
      }
    }
  }

  public update(dt: number, time: number): void {
    // Spin coins continuously
    for (const c of this.collectibles) {
      if (c.active) {
        c.group.rotation.y = time * CONSTANTS.COIN_ROTATION_SPEED;
        // Subtle floating bob
        c.group.position.y = c.baseY + Math.sin(time * 3.5 + c.group.position.z * 0.1) * 0.08;
      }
    }
  }

  public clearDynamicItems(): void {
    for (const obs of this.obstacles) {
      this.group.remove(obs.group);
    }
    this.obstacles = [];

    for (const col of this.collectibles) {
      this.group.remove(col.group);
    }
    this.collectibles = [];
  }
}
