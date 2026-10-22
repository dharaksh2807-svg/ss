import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';

export class WorldScene {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  public sunLight: THREE.DirectionalLight;
  public fillLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public skyMesh: THREE.Mesh;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONSTANTS.COLORS.FOG);
    this.scene.fog = new THREE.FogExp2(CONSTANTS.COLORS.FOG, 0.0075);

    // Renderer setup
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
    this.renderer.toneMappingExposure = 1.15;

    // Lighting setup
    this.hemiLight = new THREE.HemisphereLight(0xffeedd, 0x445577, 0.95);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff5ea, 1.3);
    this.sunLight.position.set(25, 45, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1.0;
    this.sunLight.shadow.camera.far = 120.0;
    this.sunLight.shadow.camera.left = -25;
    this.sunLight.shadow.camera.right = 25;
    this.sunLight.shadow.camera.top = 35;
    this.sunLight.shadow.camera.bottom = -15;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Warm opposite-side fill light to illuminate city canyon walls
    this.fillLight = new THREE.DirectionalLight(0xa5c4e8, 0.75);
    this.fillLight.position.set(-25, 30, 15);
    this.scene.add(this.fillLight);

    // Stylized gradient sky dome
    this.skyMesh = this.createSkyDome();
    this.scene.add(this.skyMesh);

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private createSkyDome(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(400, 32, 16);
    // Custom gradient vertex colors
    const colors: number[] = [];
    const topColor = new THREE.Color(CONSTANTS.COLORS.SKY_TOP);
    const bottomColor = new THREE.Color(CONSTANTS.COLORS.SKY_BOTTOM);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = Math.max(0, Math.min(1, (y + 50) / 350));
      const c = bottomColor.clone().lerp(topColor, t);
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

  public updateSunPosition(playerZ: number): void {
    // Keep shadow map volume centered over active gameplay area
    this.sunLight.position.z = playerZ + 20;
    this.sunLight.target.position.z = playerZ - 10;
    this.sunLight.target.updateMatrixWorld();

    this.fillLight.position.z = playerZ + 15;

    this.skyMesh.position.z = playerZ;
  }

  public onWindowResize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
}
