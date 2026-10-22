import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { CurvedShaderManager } from '../scene/CurvedShader';
import { PowerupType } from '../player/PowerupManager';

export interface CollectibleInstance {
  group: THREE.Group;
  type: 'COIN' | PowerupType;
  lane: LaneIndex;
  collider: THREE.Box3;
  active: boolean;
  baseY: number;
}

export class CollectibleFactory {
  private curvedManager = CurvedShaderManager.getInstance();

  private coinGeo: THREE.CylinderGeometry;
  private coinMat: THREE.MeshStandardMaterial;

  private powerupMat: THREE.MeshStandardMaterial;
  private badgeCanvasTex: THREE.CanvasTexture;

  constructor() {
    this.coinGeo = new THREE.CylinderGeometry(
      CONSTANTS.COIN_RADIUS,
      CONSTANTS.COIN_RADIUS,
      0.15,
      16
    );

    this.coinMat = new THREE.MeshStandardMaterial({
      color: CONSTANTS.COLORS.COIN_GOLD,
      emissive: 0xff8800,
      emissiveIntensity: 0.25,
      roughness: 0.2,
      metalness: 0.85
    });
    this.curvedManager.applyCurvature(this.coinMat);

    this.powerupMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.5
    });
    this.curvedManager.applyCurvature(this.powerupMat);

    this.badgeCanvasTex = this.createBadgeTexture();
  }

  private createBadgeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ff0055';
    ctx.fillRect(0, 0, 128, 128);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', 64, 64);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Create Gold Coin
   */
  public createCoin(): THREE.Group {
    const group = new THREE.Group();

    const coinMesh = new THREE.Mesh(this.coinGeo, this.coinMat);
    coinMesh.rotation.z = Math.PI / 2; // Stand upright
    coinMesh.castShadow = true;
    group.add(coinMesh);

    // Inner star/circle emblem
    const emblemGeo = new THREE.CylinderGeometry(CONSTANTS.COIN_RADIUS * 0.65, CONSTANTS.COIN_RADIUS * 0.65, 0.16, 12);
    const emblemMat = new THREE.MeshStandardMaterial({
      color: CONSTANTS.COLORS.COIN_RIM,
      roughness: 0.4,
      metalness: 0.8
    });
    this.curvedManager.applyCurvature(emblemMat);
    const emblemMesh = new THREE.Mesh(emblemGeo, emblemMat);
    emblemMesh.rotation.z = Math.PI / 2;
    group.add(emblemMesh);

    return group;
  }

  /**
   * Create Powerup Crate
   */
  public createPowerup(type: PowerupType): THREE.Group {
    const group = new THREE.Group();

    let colorHex = 0xffffff;
    let label = 'P';
    if (type === 'MAGNET') {
      colorHex = CONSTANTS.COLORS.MAGNET;
      label = '🧲';
    } else if (type === 'SNEAKERS') {
      colorHex = CONSTANTS.COLORS.SNEAKERS;
      label = '👟';
    } else if (type === 'MULTIPLIER') {
      colorHex = CONSTANTS.COLORS.COIN_GOLD;
      label = '2X';
    } else if (type === 'HOVERBOARD') {
      colorHex = CONSTANTS.COLORS.HOVERBOARD;
      label = '🛹';
    }

    // Floating glowing diamond / cube
    const boxGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const boxMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.8
    });
    this.curvedManager.applyCurvature(boxMat);

    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.castShadow = true;
    group.add(boxMesh);

    // Glowing aura ring
    const ringGeo = new THREE.TorusGeometry(0.75, 0.06, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    group.add(ringMesh);

    return group;
  }
}
