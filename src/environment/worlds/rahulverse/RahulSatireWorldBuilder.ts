import * as THREE from 'three';
import { SeededRandom } from '../../SceneryFactory';
import { TextureGenerator } from '../../../scene/TextureGenerator';
import { RahulComedyEventDirector } from './RahulComedyEventDirector';

/**
 * RahulSatireWorldBuilder
 * High-quality 3D Political Comedy & Satire World Builder for Rahulverse: The Never-Ending Yatra.
 * Builds five distinct, hilarious Indian political satire districts:
 * - District A: Yatra Never Ends
 * - District B: Parliament Pandemonium
 * - District C: Press Conference Panic
 * - District D: Alliance Rollercoaster
 * - District E: The Great Political Multiverse
 */
export class RahulSatireWorldBuilder {
  private static instance: RahulSatireWorldBuilder;

  // Geometry Cache for performance & pooling
  private geoCache: Map<string, THREE.BufferGeometry> = new Map();

  // Materials
  private roadbedWallMat: THREE.MeshStandardMaterial;
  private yatraWhiteMat: THREE.MeshStandardMaterial;
  private yatraBlueMat: THREE.MeshStandardMaterial;
  private yatraOrangeMat: THREE.MeshStandardMaterial;
  private yatraGreenMat: THREE.MeshStandardMaterial;
  private goldMetalMat: THREE.MeshStandardMaterial;
  private parliamentSandstoneMat: THREE.MeshStandardMaterial;
  private parliamentGreenMat: THREE.MeshStandardMaterial;
  private woodMat: THREE.MeshStandardMaterial;
  private mediaBlueMat: THREE.MeshStandardMaterial;
  private neonMagentaMat: THREE.MeshStandardMaterial;
  private neonCyanMat: THREE.MeshBasicMaterial;
  private cartoonSkinMat: THREE.MeshStandardMaterial;
  private cartoonHairMat: THREE.MeshStandardMaterial;
  private paperWhiteMat: THREE.MeshBasicMaterial;

  private constructor() {
    this.roadbedWallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    this.yatraWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    this.yatraBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.2 });
    this.yatraOrangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
    this.yatraGreenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });
    this.goldMetalMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.85 });
    this.parliamentSandstoneMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.8 });
    this.parliamentGreenMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.6 });
    this.woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });
    this.mediaBlueMat = new THREE.MeshStandardMaterial({ color: 0x0c4a6e, roughness: 0.3, metalness: 0.4 });
    this.neonMagentaMat = new THREE.MeshStandardMaterial({ color: 0xd946ef, roughness: 0.2, metalness: 0.5 });
    this.neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.cartoonSkinMat = new THREE.MeshStandardMaterial({ color: 0xd9a27c, roughness: 0.7 });
    this.cartoonHairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    this.paperWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  }

  public static getInstance(): RahulSatireWorldBuilder {
    if (!RahulSatireWorldBuilder.instance) {
      RahulSatireWorldBuilder.instance = new RahulSatireWorldBuilder();
    }
    return RahulSatireWorldBuilder.instance;
  }

  private getBox(w: number, h: number, d: number): THREE.BoxGeometry {
    const key = `box_${w}_${h}_${d}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.BoxGeometry(w, h, d));
    }
    return this.geoCache.get(key) as THREE.BoxGeometry;
  }

  private getCylinder(rt: number, rb: number, h: number, seg: number = 10): THREE.CylinderGeometry {
    const key = `cyl_${rt}_${rb}_${h}_${seg}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.CylinderGeometry(rt, rb, h, seg));
    }
    return this.geoCache.get(key) as THREE.CylinderGeometry;
  }

  private getPlane(w: number, h: number): THREE.PlaneGeometry {
    const key = `plane_${w}_${h}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.PlaneGeometry(w, h));
    }
    return this.geoCache.get(key) as THREE.PlaneGeometry;
  }

  private getTorus(r: number, t: number, radSeg: number = 8, tubSeg: number = 16): THREE.TorusGeometry {
    const key = `torus_${r}_${t}_${radSeg}_${tubSeg}`;
    if (!this.geoCache.has(key)) {
      this.geoCache.set(key, new THREE.TorusGeometry(r, t, radSeg, tubSeg));
    }
    return this.geoCache.get(key) as THREE.TorusGeometry;
  }

  /**
   * Main Entrypoint for building a chunk's scenery in Rahulverse.
   * Deterministically rotates through the 5 distinct comedy districts!
   */
  public buildDistrictScenery(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    seed: number,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL'
  ): void {
    const rng = new SeededRandom(seed);
    const director = RahulComedyEventDirector.getInstance();

    // Determine district (direct index if 0..4 for testing, or cycled every 4 chunks in running world)
    const districtIndex = (seed >= 0 && seed < 5) ? seed : (Math.floor(Math.abs(seed) / 4) % 5);

    switch (districtIndex) {
      case 0:
        this.buildYatraNeverEndsDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 1:
        this.buildParliamentPandemoniumDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 2:
        this.buildPressConferencePanicDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 3:
        this.buildAllianceRollercoasterDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
      case 4:
      default:
        this.buildPoliticalMultiverseDistrict(group, roadbedWidth, chunkLength, rng, detail, director);
        break;
    }
  }

  // =========================================================================
  // DISTRICT A — YATRA NEVER ENDS
  // =========================================================================
  public buildYatraNeverEndsDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: RahulComedyEventDirector
  ): void {
    const districtA = new THREE.Group();
    districtA.name = 'district_a_yatra_never_ends';
    group.add(districtA);

    const wallX = roadbedWidth * 0.5 + 2.2;

    // 1. Streetscape sidewalks with colorful vernacular buildings
    [-1, 1].forEach((side) => {
      const walkW = 12.0;
      const wx = side * (wallX + walkW * 0.5);
      const walk = new THREE.Mesh(this.getBox(walkW, 0.6, chunkLength), this.parliamentSandstoneMat);
      walk.position.set(wx, 0.3, -chunkLength * 0.5);
      group.add(walk);

      // Cheerful cartoon cheering crowd lining sidewalks
      for (let z = 8; z < chunkLength - 8; z += 14) {
        this.buildCheeringCrowdMember(group, side * (wallX + 1.6), 0.6, -z, side > 0);
      }

      // Classic milestone markers along roadside
      for (let z = 15; z < chunkLength - 15; z += 35) {
        const milestoneGroup = new THREE.Group();
        milestoneGroup.position.set(side * (wallX + 1.0), 0.6, -z);

        const base = new THREE.Mesh(this.getBox(0.8, 1.1, 0.4), this.yatraWhiteMat);
        base.position.y = 0.55;
        milestoneGroup.add(base);

        const cap = new THREE.Mesh(this.getCylinder(0.4, 0.4, 0.4, 8), this.yatraOrangeMat);
        cap.position.y = 1.15;
        cap.rotation.z = Math.PI / 2;
        milestoneGroup.add(cap);

        group.add(milestoneGroup);
      }
    });

    // 2. Animated Giant Walking Shoe Monument on Pedestal
    const shoeGroup = new THREE.Group();
    shoeGroup.name = 'rahul_shoe_monument';
    shoeGroup.position.set(-16.0, 0.6, -chunkLength * 0.5);

    const pedestal = new THREE.Mesh(this.getBox(6.5, 2.0, 6.5), this.parliamentSandstoneMat);
    pedestal.position.y = 1.0;
    shoeGroup.add(pedestal);

    // Giant Sneaker Sole & Body
    const sole = new THREE.Mesh(this.getBox(3.0, 0.8, 5.5), this.yatraWhiteMat);
    sole.position.y = 2.4;
    shoeGroup.add(sole);

    const sneakerBody = new THREE.Mesh(this.getBox(2.6, 1.8, 4.8), this.yatraBlueMat);
    sneakerBody.position.set(0, 3.6, -0.2);
    shoeGroup.add(sneakerBody);

    // Dynamic tapping toe
    const toeMesh = new THREE.Mesh(this.getBox(2.4, 1.0, 1.8), this.yatraOrangeMat);
    toeMesh.position.set(0, 2.6, -2.4);
    shoeGroup.add(toeMesh);
    director.registerShoeMonument(toeMesh);

    group.add(shoeGroup);

    // 3. Wooden Surveyor Tripod with Continental Yatra Route Map
    const mapGroup = new THREE.Group();
    mapGroup.position.set(16.5, 0.6, -chunkLength * 0.5);

    // Tripod legs
    for (let l = 0; l < 3; l++) {
      const leg = new THREE.Mesh(this.getCylinder(0.06, 0.06, 3.5, 6), this.woodMat);
      leg.position.set(Math.cos(l * 2.09) * 0.9, 1.7, Math.sin(l * 2.09) * 0.9);
      leg.rotation.z = Math.cos(l * 2.09) * 0.2;
      mapGroup.add(leg);
    }

    // Map Board
    const mapTex = TextureGenerator.getYatraMapTexture();
    const mapBoard = new THREE.Mesh(this.getBox(3.8, 3.8, 0.1), new THREE.MeshBasicMaterial({ map: mapTex }));
    mapBoard.position.set(0, 3.2, 0);
    mapBoard.rotation.y = -Math.PI * 0.45;
    mapGroup.add(mapBoard);

    group.add(mapGroup);

    // 4. Special Animated Finish Line Flip Arch (High clearance Y > 8.8m)
    const archGroup = new THREE.Group();
    archGroup.name = 'yatra_finish_flip_arch';
    archGroup.position.set(0, 0, -chunkLength * 0.35);

    // High side pillars
    const archH = 9.4;
    [-roadbedWidth * 0.5 - 2.8, roadbedWidth * 0.5 + 2.8].forEach((px) => {
      const p = new THREE.Mesh(this.getBox(1.8, archH, 1.8), this.yatraBlueMat);
      p.position.set(px, archH * 0.5, 0);
      archGroup.add(p);
    });

    // Overhead lintel beam
    const lintel = new THREE.Mesh(this.getBox(roadbedWidth + 7.5, 1.2, 2.0), this.yatraOrangeMat);
    lintel.position.set(0, archH + 0.6, 0);
    archGroup.add(lintel);

    // Mechanical Flip Board
    const flipPivot = new THREE.Group();
    flipPivot.position.set(0, archH + 0.6, 0.1);

    const finishTex = TextureGenerator.getFinishLineFlipTexture(false);
    const startTex = TextureGenerator.getFinishLineFlipTexture(true);

    const finishMesh = new THREE.Mesh(this.getBox(roadbedWidth + 2.0, 1.8, 0.1), new THREE.MeshBasicMaterial({ map: finishTex }));
    finishMesh.position.z = 0.06;
    flipPivot.add(finishMesh);

    const startMesh = new THREE.Mesh(this.getBox(roadbedWidth + 2.0, 1.8, 0.1), new THREE.MeshBasicMaterial({ map: startTex }));
    startMesh.position.z = -0.06;
    startMesh.rotation.y = Math.PI;
    flipPivot.add(startMesh);

    director.registerFlipBoard(flipPivot, finishMesh, startMesh);
    archGroup.add(flipPivot);

    group.add(archGroup);

    // Satirical District Banners
    const bannerTex = TextureGenerator.getYatraNeverEndsSignTexture(rng.int(0, 3));
    const banner = new THREE.Mesh(this.getBox(5.0, 1.4, 0.08), new THREE.MeshBasicMaterial({ map: bannerTex }));
    banner.position.set(-15.0, 2.8, -chunkLength * 0.2);
    banner.rotation.y = Math.PI * 0.4;
    group.add(banner);
  }

  // =========================================================================
  // DISTRICT B — PARLIAMENT PANDEMONIUM
  // =========================================================================
  public buildParliamentPandemoniumDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: RahulComedyEventDirector
  ): void {
    const districtB = new THREE.Group();
    districtB.name = 'district_b_parliament_pandemonium';
    group.add(districtB);

    const wallX = roadbedWidth * 0.5 + 2.4;

    // 1. Parliamentary Colonnade Galleries with Green Benches
    [-1, 1].forEach((side) => {
      const gallW = 12.0;
      const gx = side * (wallX + gallW * 0.5);
      const gallery = new THREE.Mesh(this.getBox(gallW, 1.2, chunkLength), this.parliamentSandstoneMat);
      gallery.position.set(gx, 0.6, -chunkLength * 0.5);
      group.add(gallery);

      // Sandstone Columns
      for (let z = 6; z < chunkLength - 6; z += 12) {
        const col = new THREE.Mesh(this.getCylinder(0.5, 0.5, 8.0, 8), this.parliamentSandstoneMat);
        col.position.set(side * (wallX + 1.8), 4.6, -z);
        group.add(col);
      }

      // Rows of Green Leather Parliament Benches
      for (let z = 8; z < chunkLength - 8; z += 10) {
        const bench = new THREE.Mesh(this.getBox(3.0, 0.85, 1.2), this.parliamentGreenMat);
        bench.position.set(side * (wallX + 4.5), 1.4, -z);
        group.add(bench);
      }
    });

    // 2. Animated Runaway Mechanical Microphone Gag
    const micStage = new THREE.Group();
    micStage.name = 'runaway_microphone_arm';
    micStage.position.set(-16.0, 0.6, -chunkLength * 0.5);

    const podium = new THREE.Mesh(this.getBox(2.2, 1.6, 1.8), this.woodMat);
    podium.position.y = 0.8;
    micStage.add(podium);

    // Robotic articulated arm holding microphone
    const armGroup = new THREE.Group();
    armGroup.position.set(0, 1.7, 0);

    const armPillar = new THREE.Mesh(this.getCylinder(0.06, 0.06, 1.8, 6), this.goldMetalMat);
    armPillar.position.set(0, 0.9, 0);
    armGroup.add(armPillar);

    const micHead = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.45, 8), this.yatraBlueMat);
    micHead.position.set(0, 1.8, 0);
    armGroup.add(micHead);

    director.registerRunawayMic(armGroup, 1.7, 0);
    micStage.add(armGroup);

    // Cartoon speaker NPC looking frustrated
    this.buildCartoonDebaters(micStage, 0, 0.6, 1.4, director);

    group.add(micStage);

    // 3. Resetting Debate Countdown Clock
    const clockGroup = new THREE.Group();
    clockGroup.position.set(16.5, 0.6, -chunkLength * 0.5);

    const clockStand = new THREE.Mesh(this.getBox(1.2, 5.0, 1.2), this.parliamentSandstoneMat);
    clockStand.position.y = 2.5;
    clockGroup.add(clockStand);

    const clockSignTex = TextureGenerator.getParliamentPandemoniumSignTexture(rng.int(0, 3));
    const clockDisplay = new THREE.Mesh(this.getBox(4.5, 2.2, 0.2), new THREE.MeshBasicMaterial({ map: clockSignTex }));
    clockDisplay.position.set(0, 5.5, 0);
    clockDisplay.rotation.y = -Math.PI * 0.45;
    clockGroup.add(clockDisplay);

    director.registerTimerMesh(clockDisplay);
    group.add(clockGroup);

    // 4. Flying Parliament Paper Documents
    const paperGroup = new THREE.Group();
    paperGroup.position.set(0, 4.5, -chunkLength * 0.45);

    const papers = [];
    for (let p = 0; p < 8; p++) {
      const pMesh = new THREE.Mesh(this.getPlane(0.45, 0.6), this.paperWhiteMat);
      const px = -6.0 + (p % 4) * 4.0;
      const py = 1.0 + (p * 0.4);
      const pz = -4.0 + (p * 1.2);
      pMesh.position.set(px, py, pz);
      paperGroup.add(pMesh);

      papers.push({
        mesh: pMesh,
        baseY: py,
        baseZ: pz,
        speed: 1.0 + (p % 3) * 0.5,
        phase: p * 0.8
      });
    }

    director.registerFlyingPapers(paperGroup, papers);
    group.add(paperGroup);
  }

  // =========================================================================
  // DISTRICT C — PRESS CONFERENCE PANIC
  // =========================================================================
  public buildPressConferencePanicDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: RahulComedyEventDirector
  ): void {
    const districtC = new THREE.Group();
    districtC.name = 'district_c_press_conference_panic';
    group.add(districtC);

    const wallX = roadbedWidth * 0.5 + 2.4;

    // 1. High-Tech Media Studio Towers with 16x9 Video Walls
    [-1, 1].forEach((side) => {
      const buildingW = 10.0;
      const bx = side * (wallX + buildingW * 0.5 + 0.5);

      const tower = new THREE.Mesh(this.getBox(buildingW, 26.0, chunkLength), this.mediaBlueMat);
      tower.position.set(bx, 13.0, -chunkLength * 0.5);
      group.add(tower);

      // Giant Glowing LED Media Screen facing tracks
      const screenTex = TextureGenerator.getPressConferencePanicSignTexture(side > 0 ? 0 : 2);
      const screen = new THREE.Mesh(this.getPlane(24.0, 12.0), new THREE.MeshBasicMaterial({ map: screenTex, side: THREE.DoubleSide }));
      screen.position.set(side * (wallX + 0.1), 11.0, -chunkLength * 0.5);
      screen.rotation.y = side > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
      group.add(screen);
    });

    // 2. The Media Conga Line (Reporter -> Cameraman -> Boom Operator running in loop)
    const congaGroup = new THREE.Group();
    congaGroup.name = 'media_conga_line';
    congaGroup.position.set(-15.5, 0.6, -chunkLength * 0.45);

    for (let c = 0; c < 3; c++) {
      const member = new THREE.Group();
      member.position.set(0, 0, c * 2.4);

      // Body
      const body = new THREE.Mesh(this.getBox(0.5, 0.8, 0.35), c === 0 ? this.yatraBlueMat : this.yatraOrangeMat);
      body.position.y = 0.7;
      member.add(body);

      // Head
      const head = new THREE.Mesh(this.getCylinder(0.2, 0.2, 0.4, 8), this.cartoonSkinMat);
      head.position.y = 1.3;
      member.add(head);

      // Equipment (Microphone or Camera)
      if (c === 0) {
        // Boom Mic
        const pole = new THREE.Mesh(this.getCylinder(0.04, 0.04, 1.4, 6), this.goldMetalMat);
        pole.position.set(0, 1.4, -0.6);
        pole.rotation.x = -Math.PI * 0.35;
        member.add(pole);
      } else {
        // Camera
        const cam = new THREE.Mesh(this.getBox(0.3, 0.3, 0.5), this.cartoonHairMat);
        cam.position.set(0, 1.1, -0.4);
        member.add(cam);
      }

      congaGroup.add(member);
    }

    director.registerMediaCongaLine(congaGroup);
    group.add(congaGroup);

    // 3. Paparazzi Scaffolding with Flashing Speedlights
    const scaffoldGroup = new THREE.Group();
    scaffoldGroup.position.set(16.5, 0.6, -chunkLength * 0.5);

    const scaffold = new THREE.Mesh(this.getBox(7.0, 5.0, 7.0), this.roadbedWallMat);
    scaffold.position.y = 2.5;
    scaffoldGroup.add(scaffold);

    // Flashing strobes
    for (let s = 0; s < 4; s++) {
      const flash = new THREE.Mesh(this.getCylinder(0.15, 0.15, 0.2, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      flash.position.set(-2.0 + (s % 2) * 4.0, 5.4, -2.0 + Math.floor(s / 2) * 4.0);
      scaffoldGroup.add(flash);
    }

    group.add(scaffoldGroup);
  }

  // =========================================================================
  // DISTRICT D — ALLIANCE ROLLERCOASTER
  // =========================================================================
  public buildAllianceRollercoasterDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: RahulComedyEventDirector
  ): void {
    const districtD = new THREE.Group();
    districtD.name = 'district_d_alliance_rollercoaster';
    group.add(districtD);

    const wallX = roadbedWidth * 0.5 + 2.4;

    // 1. Festive Rollercoaster Carnival Arches
    for (let z = 15; z < chunkLength - 15; z += 40) {
      const arch = new THREE.Group();
      arch.position.set(0, 0, -z);

      const trackRing = new THREE.Mesh(this.getTorus(roadbedWidth * 0.5 + 3.5, 0.4, 8, 20), this.neonMagentaMat);
      trackRing.position.y = 4.8;
      trackRing.rotation.y = Math.PI / 2;
      arch.add(trackRing);

      group.add(arch);
    }

    // 2. Monumental Handshake Statues on Pedestals
    [-1, 1].forEach((side) => {
      const statueGroup = new THREE.Group();
      statueGroup.position.set(side * 16.5, 0.6, -chunkLength * 0.5);

      const pedestal = new THREE.Mesh(this.getBox(5.0, 3.0, 5.0), this.yatraWhiteMat);
      pedestal.position.y = 1.5;
      statueGroup.add(pedestal);

      // Two Golden Hands clasped in handshake
      const hand1 = new THREE.Mesh(this.getBox(1.2, 1.2, 2.2), this.goldMetalMat);
      hand1.position.set(-0.5, 3.8, 0);
      statueGroup.add(hand1);

      const hand2 = new THREE.Mesh(this.getBox(1.2, 1.2, 2.2), this.goldMetalMat);
      hand2.position.set(0.5, 3.8, 0);
      statueGroup.add(hand2);

      group.add(statueGroup);
    });

    // 3. Middle Seat Dispute Gag (Two chairs shifting back and forth)
    const disputeStage = new THREE.Group();
    disputeStage.name = 'middle_seat_dispute';
    disputeStage.position.set(-16.0, 0.6, -chunkLength * 0.4);

    const table = new THREE.Mesh(this.getBox(6.0, 1.0, 3.0), this.woodMat);
    table.position.y = 0.5;
    disputeStage.add(table);

    const chair1 = new THREE.Group();
    chair1.position.set(-0.8, 1.2, 0);
    const seat1 = new THREE.Mesh(this.getBox(0.9, 0.9, 0.9), this.yatraBlueMat);
    chair1.add(seat1);
    disputeStage.add(chair1);

    const chair2 = new THREE.Group();
    chair2.position.set(0.8, 1.2, 0);
    const seat2 = new THREE.Mesh(this.getBox(0.9, 0.9, 0.9), this.yatraOrangeMat);
    chair2.add(seat2);
    disputeStage.add(chair2);

    director.registerMiddleSeatDispute(chair1, chair2, -0.8, 0.8);
    group.add(disputeStage);

    // 4. Interlocking Jigsaw Puzzle Pieces
    const puzzleGroup = new THREE.Group();
    puzzleGroup.position.set(16.5, 4.5, -chunkLength * 0.4);

    const pL = new THREE.Group();
    const pLMesh = new THREE.Mesh(this.getBox(1.8, 1.8, 0.4), this.neonCyanMat);
    pL.add(pLMesh);
    puzzleGroup.add(pL);

    const pR = new THREE.Group();
    const pRMesh = new THREE.Mesh(this.getBox(1.8, 1.8, 0.4), this.yatraOrangeMat);
    pR.add(pRMesh);
    puzzleGroup.add(pR);

    director.registerPuzzlePieces(pL, pR);
    group.add(puzzleGroup);

    // Satirical Alliance Billboard
    const signTex = TextureGenerator.getAllianceRollercoasterSignTexture(rng.int(0, 3));
    const sign = new THREE.Mesh(this.getBox(5.5, 1.4, 0.08), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.position.set(-15.0, 2.8, -chunkLength * 0.65);
    sign.rotation.y = Math.PI * 0.4;
    group.add(sign);
  }

  // =========================================================================
  // DISTRICT E — THE GREAT POLITICAL MULTIVERSE
  // =========================================================================
  public buildPoliticalMultiverseDistrict(
    group: THREE.Group,
    roadbedWidth: number,
    chunkLength: number,
    rng: SeededRandom,
    detail: 'FULL' | 'BALANCED' | 'MINIMAL',
    director: RahulComedyEventDirector
  ): void {
    const districtE = new THREE.Group();
    districtE.name = 'district_e_political_multiverse';
    group.add(districtE);

    const wallX = roadbedWidth * 0.5 + 2.4;

    // 1. Cosmic Floating Spires & Dimensional Obelisks
    [-1, 1].forEach((side) => {
      for (let z = 12; z < chunkLength - 12; z += 30) {
        const spireGroup = new THREE.Group();
        spireGroup.position.set(side * 16.5, 0.6, -z);

        const base = new THREE.Mesh(this.getBox(3.0, 0.8, 3.0), this.yatraBlueMat);
        spireGroup.add(base);

        const spire = new THREE.Mesh(this.getCylinder(0.2, 0.8, 14.0, 6), this.goldMetalMat);
        spire.position.y = 7.0;
        spireGroup.add(spire);

        group.add(spireGroup);
      }
    });

    // 2. Swirling Multiverse Dimensional Portal Gag
    const portalGroup = new THREE.Group();
    portalGroup.name = 'multiverse_vortex_portal';
    portalGroup.position.set(-16.0, 4.5, -chunkLength * 0.5);

    // Glowing Ring
    const ringMesh = new THREE.Mesh(this.getTorus(3.2, 0.35, 10, 24), this.neonCyanMat);
    portalGroup.add(ringMesh);

    // Inner Swirling Vortex
    const vortexMesh = new THREE.Mesh(this.getPlane(5.5, 5.5), new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    }));
    portalGroup.add(vortexMesh);

    // Holographic Trophy in center
    const holoMesh = new THREE.Mesh(this.getCylinder(0.4, 0.2, 1.2, 6), this.goldMetalMat);
    holoMesh.position.y = 0.2;
    portalGroup.add(holoMesh);

    director.registerMultiversePortal(ringMesh, vortexMesh, holoMesh);
    group.add(portalGroup);

    // 3. Satirical Multiverse Billboard
    const signTex = TextureGenerator.getPoliticalMultiverseSignTexture(rng.int(0, 3));
    const sign = new THREE.Mesh(this.getBox(5.8, 1.4, 0.08), new THREE.MeshBasicMaterial({ map: signTex }));
    sign.position.set(15.5, 2.8, -chunkLength * 0.5);
    sign.rotation.y = -Math.PI * 0.45;
    group.add(sign);
  }

  // =========================================================================
  // HELPER NPC BUILDERS
  // =========================================================================

  private buildCheeringCrowdMember(group: THREE.Group, x: number, y: number, z: number, isRight: boolean): void {
    const crowdGroup = new THREE.Group();
    crowdGroup.position.set(x, y, z);

    // White kurta body
    const body = new THREE.Mesh(this.getBox(0.45, 0.75, 0.3), this.yatraWhiteMat);
    body.position.y = 0.55;
    crowdGroup.add(body);

    // Head with colorful turban
    const head = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.35, 8), this.cartoonSkinMat);
    head.position.y = 1.15;
    crowdGroup.add(head);

    const turban = new THREE.Mesh(this.getCylinder(0.24, 0.22, 0.22, 8), isRight ? this.yatraOrangeMat : this.yatraGreenMat);
    turban.position.y = 1.35;
    crowdGroup.add(turban);

    // Small waving tricolor flag
    const pole = new THREE.Mesh(this.getCylinder(0.02, 0.02, 1.2, 4), this.goldMetalMat);
    pole.position.set(0.25, 1.1, -0.15);
    pole.rotation.x = -0.2;
    crowdGroup.add(pole);

    const flag = new THREE.Mesh(this.getPlane(0.35, 0.22), isRight ? this.yatraOrangeMat : this.yatraGreenMat);
    flag.position.set(0.42, 1.5, -0.15);
    crowdGroup.add(flag);

    group.add(crowdGroup);
  }

  private buildCartoonDebaters(group: THREE.Group, x: number, y: number, z: number, director: RahulComedyEventDirector): void {
    const debaterGroup = new THREE.Group();
    debaterGroup.position.set(x, y, z);

    const torso = new THREE.Mesh(this.getBox(0.48, 0.65, 0.3), this.yatraWhiteMat);
    torso.position.y = 0.5;
    debaterGroup.add(torso);

    const head = new THREE.Mesh(this.getCylinder(0.18, 0.18, 0.35, 8), this.cartoonSkinMat);
    head.position.y = 1.05;
    debaterGroup.add(head);

    // Expressive gesturing arms
    const arm1 = new THREE.Mesh(this.getBox(0.12, 0.45, 0.12), this.yatraWhiteMat);
    arm1.position.set(-0.35, 0.65, 0);
    arm1.rotation.z = 0.6;
    debaterGroup.add(arm1);

    const arm2 = new THREE.Mesh(this.getBox(0.12, 0.45, 0.12), this.yatraWhiteMat);
    arm2.position.set(0.35, 0.65, 0);
    arm2.rotation.z = -0.6;
    debaterGroup.add(arm2);

    group.add(debaterGroup);
  }
}
