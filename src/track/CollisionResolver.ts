import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';
import { ObstacleInstance } from './ObstacleFactory';
import { Player } from '../player/Player';
import { ChaserModel, ChaseState } from '../characters/ChaserModel';
import { CollisionOutcome, CollisionDiagnostic } from './CollisionTypes';

export interface CollisionResolutionResult {
  outcome: CollisionOutcome;
  diagnostic: CollisionDiagnostic;
  isGlance: boolean;
  overlapX: number;
  isFrontal: boolean;
  isFlankContact: boolean;
}

export class CollisionResolver {
  /**
   * Deterministically resolves authoritative collision consequences based on contact geometry,
   * obstacle traversability, kinematic velocity, player movement state, active protection,
   * and security chaser proximity.
   */
  public static resolveOutcome(
    obs: ObstacleInstance,
    player: Player,
    chaser: ChaserModel | null
  ): CollisionResolutionResult {
    const playerBox = player.collider;
    const playerPos = player.position;
    const guardState: ChaseState = chaser ? chaser.getChaseState() : 'DISTANT';
    const isGuardCatchUp = chaser ? chaser.isCatchUpMode() : false;

    // Protection state
    const hasShield = player.powerups.hasShieldActive();
    const hasHoverboard = player.hoverboardManager.isBoardActive();
    const isInvulnerable = player.isInvulnerable();

    // Relative velocity vector [Vx, Vy, Vz]
    const obsVelZ = obs.velocityZ || 0;
    const relVel = new THREE.Vector3(
      player.isChangingLaneActive() ? (player.targetLane > player.currentLane ? 8.0 : -8.0) : 0,
      player.verticalVelocity,
      -player.speed + obsVelZ
    );

    // 1. Invulnerability grace check (e.g. revive grace or intro invincibility)
    if (isInvulnerable) {
      return {
        outcome: 'SAFE_CONTACT',
        diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'SAFE_CONTACT'),
        isGlance: false,
        overlapX: 0,
        isFrontal: false,
        isFlankContact: false
      };
    }

    // 2. High airborne flight clear (e.g. Jetpack flight, extreme elevation)
    if (player.state === 'JETPACK' || player.getJetpackPhase() !== 'NONE' || player.position.y > 4.5) {
      return {
        outcome: 'SAFE_CONTACT',
        diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'SAFE_CONTACT'),
        isGlance: false,
        overlapX: 0,
        isFrontal: false,
        isFlankContact: false
      };
    }

    // 3. Trains, Moving Trains, and Train Ramps
    if (obs.type === 'TRAIN' || obs.type === 'MOVING_TRAIN' || obs.type === 'TRAIN_RAMP') {
      const roofY = obs.roofSurfaceY || (CONSTANTS.TRAIN_HEIGHT + 0.15);
      const isSupportingThisTrain = player.getActiveSupportObstacleId() === obs.id;

      // Safe Priority 1: Traversing on top of this train roof
      if (isSupportingThisTrain && (player.getSupportSurface() === 'TRAIN_ROOF' || player.state === 'ON_TRAIN')) {
        return {
          outcome: 'SAFE_CONTACT',
          diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'SAFE_CONTACT'),
          isGlance: false,
          overlapX: 0,
          isFrontal: false,
          isFlankContact: false
        };
      }

      // Safe Priority 2: Climbing incline ramp on this train
      if (isSupportingThisTrain && (player.getSupportSurface() === 'RAMP' || player.state === 'CLIMBING')) {
        return {
          outcome: 'SAFE_CONTACT',
          diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'SAFE_CONTACT'),
          isGlance: false,
          overlapX: 0,
          isFrontal: false,
          isFlankContact: false
        };
      }

      // Safe Priority 3: Clear height or landing descending onto roof
      if (player.position.y >= roofY - 0.25) {
        return {
          outcome: 'VALID_ROOF_LANDING',
          diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'VALID_ROOF_LANDING'),
          isGlance: false,
          overlapX: 0,
          isFrontal: false,
          isFlankContact: false
        };
      }

      // Safe Priority 4: Ramp entry approach
      if (obs.rampCollider) {
        const inRampX = playerBox.max.x >= obs.rampCollider.min.x && playerBox.min.x <= obs.rampCollider.max.x;
        const inRampZ = playerBox.min.z <= obs.rampCollider.max.z + 0.35 && playerBox.max.z >= obs.rampCollider.min.z - 0.25;
        if (inRampX && inRampZ) {
          return {
            outcome: 'SAFE_CONTACT',
            diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'SAFE_CONTACT'),
            isGlance: false,
            overlapX: 0,
            isFrontal: false,
            isFlankContact: false
          };
        }
      }

      // Contact with lower train body / front bumper
      const lethalBox = obs.bodyCollider || obs.collider;
      const isFlankContact = player.position.z < lethalBox.max.z - 0.45;
      const overlapX = Math.min(playerBox.max.x, lethalBox.max.x) - Math.max(playerBox.min.x, lethalBox.min.x);
      const isGlance = player.isChangingLaneActive() && isFlankContact;
      const isFrontal = !isFlankContact;

      // Active Protection Check (Shield or Hoverboard):
      if (hasShield || hasHoverboard) {
        return {
          outcome: 'PROTECTED_HIT',
          diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'PROTECTED_HIT'),
          isGlance,
          overlapX,
          isFrontal,
          isFlankContact
        };
      }

      // Full unprotected frontal impact with a train is unconditionally fatal!
      if (isFrontal) {
        return {
          outcome: 'MAJOR_FATAL_HIT',
          diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'MAJOR_FATAL_HIT'),
          isGlance: false,
          overlapX,
          isFrontal: true,
          isFlankContact: false
        };
      }

      // Train flank contact:
      if (isGlance) {
        // Glancing side contact is recoverable, but if guard is in catch-up mode, guard captures runner!
        if (isGuardCatchUp) {
          return {
            outcome: 'CHASER_CAPTURE',
            diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'CHASER_CAPTURE'),
            isGlance: true,
            overlapX,
            isFrontal: false,
            isFlankContact: true
          };
        } else {
          return {
            outcome: 'MINOR_STUMBLE',
            diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'MINOR_STUMBLE'),
            isGlance: true,
            overlapX,
            isFrontal: false,
            isFlankContact: true
          };
        }
      } else {
        // High-speed direct impact into train side (not a light lateral glance) is NOT harmless
        return {
          outcome: 'MAJOR_FATAL_HIT',
          diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'MAJOR_FATAL_HIT'),
          isGlance: false,
          overlapX,
          isFrontal: false,
          isFlankContact: true
        };
      }
    } else {
      // Barrier obstacles (LOW_BARRIER, HIGH_BARRIER, SIDE_BARRIER, TUNNEL_ARCH)
      // Successful jump over low barrier
      if (obs.type === 'LOW_BARRIER' && player.isJumping && player.position.y > CONSTANTS.LOW_BARRIER_HEIGHT + 0.15) {
        return {
          outcome: 'SAFE_CONTACT',
          diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'SAFE_CONTACT'),
          isGlance: false,
          overlapX: 0,
          isFrontal: false,
          isFlankContact: false
        };
      }

      // Successful slide under high barrier or tunnel arch
      if ((obs.type === 'HIGH_BARRIER' || obs.type === 'TUNNEL_ARCH') && player.isSliding) {
        return {
          outcome: 'SAFE_CONTACT',
          diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'SAFE_CONTACT'),
          isGlance: false,
          overlapX: 0,
          isFrontal: false,
          isFlankContact: false
        };
      }

      const overlapX = Math.min(playerBox.max.x, obs.collider.max.x) - Math.max(playerBox.min.x, obs.collider.min.x);
      const isGlance = player.isChangingLaneActive() && overlapX < 0.30;

      // Active Protection Check
      if (hasShield || hasHoverboard) {
        return {
          outcome: 'PROTECTED_HIT',
          diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'PROTECTED_HIT'),
          isGlance,
          overlapX,
          isFrontal: !isGlance,
          isFlankContact: isGlance
        };
      }

      if (isGlance) {
        if (isGuardCatchUp) {
          return {
            outcome: 'CHASER_CAPTURE',
            diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'CHASER_CAPTURE'),
            isGlance: true,
            overlapX,
            isFrontal: false,
            isFlankContact: true
          };
        } else {
          return {
            outcome: 'MINOR_STUMBLE',
            diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'MINOR_STUMBLE'),
            isGlance: true,
            overlapX,
            isFrontal: false,
            isFlankContact: true
          };
        }
      } else {
        // Direct crash into barrier
        return {
          outcome: 'MAJOR_FATAL_HIT',
          diagnostic: this.buildDiagnostic(obs, playerPos, relVel, guardState, hasShield, hasHoverboard, isInvulnerable, 'MAJOR_FATAL_HIT'),
          isGlance: false,
          overlapX,
          isFrontal: true,
          isFlankContact: false
        };
      }
    }
  }

  private static buildDiagnostic(
    obs: ObstacleInstance,
    playerPos: THREE.Vector3,
    relVel: THREE.Vector3,
    guardState: ChaseState | string,
    hasShield: boolean,
    hasHoverboard: boolean,
    isInvulnerable: boolean,
    outcome: CollisionOutcome
  ): CollisionDiagnostic {
    return {
      timestamp: typeof performance !== 'undefined' ? performance.now() : Date.now(),
      obstacleId: obs.id,
      collisionType: obs.type,
      contactPosition: {
        x: Math.round(playerPos.x * 100) / 100,
        y: Math.round(playerPos.y * 100) / 100,
        z: Math.round(playerPos.z * 100) / 100
      },
      relativeVelocity: {
        x: Math.round(relVel.x * 100) / 100,
        y: Math.round(relVel.y * 100) / 100,
        z: Math.round(relVel.z * 100) / 100
      },
      activeGuardState: guardState,
      playerProtectionState: {
        hasShield,
        hasHoverboard,
        isInvulnerable
      },
      finalOutcome: outcome
    };
  }
}
