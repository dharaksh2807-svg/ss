import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';

export class WorldScene {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  public sunLight: THREE.DirectionalLight;
  public fillLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public skyMesh: THREE.Mesh;
  public cloudsGroup: THREE.Group;
  public skylineGroup: THREE.Group;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONSTANTS.COLORS.FOG);
    // Soft atmospheric distance haze
    this.scene.fog = new THREE.FogExp2(CONSTANTS.COLORS.FOG, 0.0042);

    // High performance WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    // 1. Balanced Daylight Lighting Setup
    // Bright sky hemisphere fill (sky: cyan blue, ground: urban slate)
    this.hemiLight = new THREE.HemisphereLight(0xb3e5fc, 0x455a64, 1.15);
    this.scene.add(this.hemiLight);

    // Warm golden sunlight from 45 degree angle
    this.sunLight = new THREE.DirectionalLight(0xfffaea, 1.4);
    this.sunLight.position.set(24, 42, 18);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 130.0;
    this.sunLight.shadow.camera.left = -24;
    this.sunLight.shadow.camera.right = 24;
    this.sunLight.shadow.camera.top = 36;
    this.sunLight.shadow.camera.bottom = -12;
    this.sunLight.shadow.bias = -0.0003;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Soft sky-blue opposite fill light for shadowed canyon facades
    this.fillLight = new THREE.DirectionalLight(0x90caf9, 0.55);
    this.fillLight.position.set(-24, 28, 14);
    this.scene.add(this.fillLight);

    // Dark asphalt station ground beneath tracks and lobby camera
    const stationGroundGeo = new THREE.PlaneGeometry(80, 80);
    const stationGroundMat = new THREE.MeshStandardMaterial({
      color: 0x151922,
      roughness: 0.95,
      metalness: 0.1
    });
    const stationGround = new THREE.Mesh(stationGroundGeo, stationGroundMat);
    stationGround.rotation.x = -Math.PI / 2;
    stationGround.position.set(0, -0.28, 0);
    stationGround.receiveShadow = true;
    this.scene.add(stationGround);

    // 2. Vibrant Daytime Sky Dome
    this.skyMesh = this.createSkyDome();
    this.scene.add(this.skyMesh);

    // 3. Floating Stylized Cumulus Clouds
    this.cloudsGroup = this.createClouds();
    this.scene.add(this.cloudsGroup);

    // 4. Distant Parallax City Skyline Silhouettes
    this.skylineGroup = this.createDistantSkyline();
    this.scene.add(this.skylineGroup);

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private createSkyDome(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(450, 32, 20);
    const colors: number[] = [];
    const topColor = new THREE.Color(CONSTANTS.COLORS.SKY_TOP);
    const bottomColor = new THREE.Color(CONSTANTS.COLORS.SKY_BOTTOM);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      // Normalized vertical height for smooth sky transition
      const t = Math.max(0, Math.min(1, (y + 40) / 400));
      const c = bottomColor.clone().lerp(topColor, Math.pow(t, 0.8));
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      fog: false
    });

    return new THREE.Mesh(geo, mat);
  }

  /**
   * Creates puffy stylized 3D cumulus clouds in the sky
   */
  private createClouds(): THREE.Group {
    const group = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.05
    });

    const puffGeo = new THREE.SphereGeometry(1, 8, 8);

    // Spawn 14 distinct fluffy cloud clusters
    for (let c = 0; c < 14; c++) {
      const cloud = new THREE.Group();
      const numPuffs = 4 + Math.floor(Math.random() * 4);

      for (let p = 0; p < numPuffs; p++) {
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        const sx = 10 + Math.random() * 14;
        const sy = 6 + Math.random() * 8;
        const sz = 10 + Math.random() * 12;
        puff.scale.set(sx, sy, sz);
        puff.position.set(
          (p - numPuffs * 0.5) * 8.0,
          Math.sin(p) * 2.0,
          (Math.random() - 0.5) * 6.0
        );
        cloud.add(puff);
      }

      // Scatter across upper sky hemisphere
      const angle = (c / 14) * Math.PI * 2;
      const dist = 180 + Math.random() * 120;
      const height = 75 + Math.random() * 45;

      cloud.position.set(
        Math.cos(angle) * dist,
        height,
        Math.sin(angle) * dist
      );

      group.add(cloud);
    }

    return group;
  }

  /**
   * Creates distant hazy skyline silhouette towers along horizon
   */
  private createDistantSkyline(): THREE.Group {
    const group = new THREE.Group();
    const skylineMat = new THREE.MeshBasicMaterial({
      color: 0x90caf9,
      transparent: true,
      opacity: 0.75,
      fog: false
    });

    // Ring of stylized skyscraper silhouettes in the far distance
    const towerGeo = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      // Don't obstruct direct forward view
      const dist = 320;
      const h = 40 + Math.random() * 80;
      const w = 15 + Math.random() * 25;
      const d = 15 + Math.random() * 25;

      const tower = new THREE.Mesh(towerGeo, skylineMat);
      tower.scale.set(w, h, d);
      tower.position.set(
        Math.cos(angle) * dist,
        h * 0.5 - 10,
        Math.sin(angle) * dist
      );
      group.add(tower);
    }

    return group;
  }

  public updateSunPosition(playerZ: number): void {
    // Keep directional shadow map frustum centered on active player and oncoming track
    this.sunLight.position.z = playerZ + 20;
    this.sunLight.target.position.z = playerZ - 12;
    this.sunLight.target.updateMatrixWorld();

    this.fillLight.position.z = playerZ + 15;

    // Sky and skyline track player so horizon feels infinite
    this.skyMesh.position.z = playerZ;
    this.cloudsGroup.position.z = playerZ;
    this.skylineGroup.position.z = playerZ;

    // Subtle cloud drift
    this.cloudsGroup.rotation.y += 0.00015;
  }

  public onWindowResize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
}
