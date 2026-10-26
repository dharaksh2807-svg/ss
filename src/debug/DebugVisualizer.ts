import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { Player } from '../player/Player';
import { TrackManager } from '../track/TrackManager';
import { CollisionDiagnostic } from '../track/CollisionTypes';

export class DebugVisualizer {
  private static instance: DebugVisualizer | null = null;

  private scene: THREE.Scene | null = null;
  private debugGroup: THREE.Group = new THREE.Group();
  private isEnabled: boolean = false;
  private hudOverlayEl: HTMLElement | null = null;

  // Contact point indicator
  private contactPointMesh: THREE.Mesh | null = null;

  private constructor() {
    this.debugGroup.name = 'DEBUG_VISUALIZER_GROUP';
  }

  public static getInstance(): DebugVisualizer {
    if (!DebugVisualizer.instance) {
      DebugVisualizer.instance = new DebugVisualizer();
    }
    return DebugVisualizer.instance;
  }

  public init(scene: THREE.Scene): void {
    this.scene = scene;
    if (!this.scene.children.includes(this.debugGroup)) {
      this.scene.add(this.debugGroup);
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      (window as any).__DEBUG_COLLIDERS__ = enabled;
    }
    if (!enabled) {
      this.clear();
      if (this.hudOverlayEl) {
        this.hudOverlayEl.style.display = 'none';
      }
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public showContactPoint(point: { x: number; y: number; z: number }): void {
    if (!this.contactPointMesh) {
      const geo = new THREE.SphereGeometry(0.25, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true });
      this.contactPointMesh = new THREE.Mesh(geo, mat);
    }
    this.contactPointMesh.position.set(point.x, point.y, point.z);
    if (!this.debugGroup.children.includes(this.contactPointMesh)) {
      this.debugGroup.add(this.contactPointMesh);
    }
  }

  public clear(): void {
    while (this.debugGroup.children.length > 0) {
      this.debugGroup.remove(this.debugGroup.children[0]);
    }
  }

  public update(player: Player, trackManager: TrackManager, lastDiagnostic?: CollisionDiagnostic | null): void {
    if (!this.isEnabled) {
      if (this.debugGroup.children.length > 0) {
        this.clear();
      }
      if (this.hudOverlayEl) {
        this.hudOverlayEl.style.display = 'none';
      }
      return;
    }

    this.clear();

    // 1. Player Collision Box (Green = safe, Red = crash, Gold = invulnerable/board)
    const pColor = player.state === 'CRASH'
      ? 0xff1744
      : (player.isInvulnerable() || player.hoverboardManager?.isBoardActive() ? 0xffd700 : 0x00e676);
    const pHelper = new THREE.Box3Helper(player.collider, new THREE.Color(pColor));
    this.debugGroup.add(pHelper);

    // 2. Player Foot Marker
    const feetGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const feetMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true });
    const feetMarker = new THREE.Mesh(feetGeo, feetMat);
    feetMarker.position.set(player.position.x, player.position.y, player.position.z);
    this.debugGroup.add(feetMarker);

    // 3. Obstacle Collision Volumes & Surfaces
    for (const chunk of trackManager.chunks) {
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;
        if (Math.abs(obs.collider.min.z - player.position.z) > 85) continue;

        // Lethal Body (Red)
        if (obs.bodyCollider) {
          this.debugGroup.add(new THREE.Box3Helper(obs.bodyCollider, new THREE.Color(0xff1744)));
        }

        // Front Bumper (Orange)
        if (obs.frontBumperCollider) {
          this.debugGroup.add(new THREE.Box3Helper(obs.frontBumperCollider, new THREE.Color(0xff9100)));
        }

        // Traversable Roof (Cyan)
        if (obs.roofCollider) {
          this.debugGroup.add(new THREE.Box3Helper(obs.roofCollider, new THREE.Color(0x00e5ff)));
        }

        // Climbable Ramp (Yellow) & Mathematical Slope Line (Green)
        if (obs.rampCollider) {
          this.debugGroup.add(new THREE.Box3Helper(obs.rampCollider, new THREE.Color(0xffea00)));

          const roofY = obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15);
          const laneX = CONSTANTS.LANES[obs.lane];
          const slopeGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(laneX, 0.05, obs.rampCollider.max.z),
            new THREE.Vector3(laneX, roofY, obs.rampCollider.min.z)
          ]);
          const slopeLine = new THREE.Line(slopeGeo, new THREE.LineBasicMaterial({ color: 0x00ff88 }));
          this.debugGroup.add(slopeLine);
        }

        // General Barrier (Magenta)
        if (!obs.bodyCollider && !obs.roofCollider) {
          this.debugGroup.add(new THREE.Box3Helper(obs.collider, new THREE.Color(0xe91e63)));
        }

        // Relative Velocity Vector Indicator on Moving Trains (White line)
        if ((obs.isMoving || obs.type === 'MOVING_TRAIN') && obs.velocityZ) {
          const arrowStart = new THREE.Vector3(CONSTANTS.LANES[obs.lane], 2.0, obs.group.position.z);
          const arrowEnd = new THREE.Vector3(
            CONSTANTS.LANES[obs.lane],
            2.0,
            obs.group.position.z + obs.velocityZ * 0.4
          );
          const arrowGeo = new THREE.BufferGeometry().setFromPoints([arrowStart, arrowEnd]);
          const arrowLine = new THREE.Line(arrowGeo, new THREE.LineBasicMaterial({ color: 0xffffff }));
          this.debugGroup.add(arrowLine);
        }
      }
    }

    // 4. Contact point indicator from collision diagnostic
    if (lastDiagnostic && lastDiagnostic.contactPosition) {
      this.showContactPoint(lastDiagnostic.contactPosition);
    }

    // 5. Update Telemetry HUD Overlay
    this.updateHudOverlay(player, lastDiagnostic);
  }

  private updateHudOverlay(player: Player, lastDiagnostic?: CollisionDiagnostic | null): void {
    if (typeof document === 'undefined') return;

    if (!this.hudOverlayEl) {
      this.hudOverlayEl = document.createElement('div');
      this.hudOverlayEl.id = 'debug-visualizer-telemetry';
      this.hudOverlayEl.style.position = 'fixed';
      this.hudOverlayEl.style.bottom = '12px';
      this.hudOverlayEl.style.left = '12px';
      this.hudOverlayEl.style.zIndex = '99999';
      this.hudOverlayEl.style.background = 'rgba(10, 15, 26, 0.94)';
      this.hudOverlayEl.style.border = '1.5px solid #00e5ff';
      this.hudOverlayEl.style.padding = '10px 14px';
      this.hudOverlayEl.style.borderRadius = '8px';
      this.hudOverlayEl.style.fontFamily = 'monospace';
      this.hudOverlayEl.style.fontSize = '12px';
      this.hudOverlayEl.style.color = '#e0f7fa';
      this.hudOverlayEl.style.boxShadow = '0 6px 20px rgba(0, 229, 255, 0.25)';
      this.hudOverlayEl.style.pointerEvents = 'none';
      document.body.appendChild(this.hudOverlayEl);
    }

    this.hudOverlayEl.style.display = 'block';
    const diagStr = lastDiagnostic
      ? `${lastDiagnostic.collisionType} (${lastDiagnostic.finalOutcome}) ObsId=${lastDiagnostic.obstacleId}`
      : 'NONE';

    this.hudOverlayEl.innerHTML = `
      <div style="font-weight:bold;color:#00e5ff;margin-bottom:5px;display:flex;justify-content:space-between;">
        <span>📦 3D COLLISION DIAGNOSTICS</span>
        <span style="color:#ffd600;">[F8: TOGGLE]</span>
      </div>
      <div>STATE: <strong style="color:#ffea00;">${player.state}</strong> | SURFACE: <strong style="color:#00e676;">${player.getSupportSurface()}</strong></div>
      <div>SUPPORT ID: <span style="color:#38bdf8;">${player.getActiveSupportObstacleId() || 'GROUND'}</span></div>
      <div>WORLD POS: X=${player.position.x.toFixed(2)}, Y=${player.position.y.toFixed(2)} (GrY=${player.groundY.toFixed(2)}), Z=${player.position.z.toFixed(1)}</div>
      <div>SPEED: <strong>${player.speed.toFixed(1)} m/s</strong> | Vy: ${player.verticalVelocity.toFixed(1)} | LANE: ${player.currentLane}</div>
      <div style="font-size:10px;color:#90a4ae;margin-top:4px;border-top:1px solid rgba(255,255,255,0.1);padding-top:3px;">LAST EVENT: ${diagStr}</div>
    `;
  }
}
