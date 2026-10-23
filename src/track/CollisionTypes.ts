import * as THREE from 'three';
import { ChaseState } from '../characters/ChaserModel';

/**
 * Authoritative Collision Outcomes for Metro Runner 3D
 */
export type CollisionOutcome =
  | 'SAFE_CONTACT'
  | 'VALID_ROOF_LANDING'
  | 'NEAR_MISS'
  | 'PROTECTED_HIT'
  | 'MINOR_STUMBLE'
  | 'MAJOR_FATAL_HIT'
  | 'CHASER_CAPTURE';

/**
 * Authoritative Collision Diagnostic Record for development and telemetry
 */
export interface CollisionDiagnostic {
  timestamp: number;
  obstacleId: string;
  collisionType: string;
  contactPosition: { x: number; y: number; z: number };
  relativeVelocity: { x: number; y: number; z: number };
  activeGuardState: ChaseState | string;
  playerProtectionState: {
    hasShield: boolean;
    hasHoverboard: boolean;
    isInvulnerable: boolean;
  };
  finalOutcome: CollisionOutcome;
}
