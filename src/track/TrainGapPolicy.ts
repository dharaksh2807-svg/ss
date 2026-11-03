import * as THREE from 'three';
import { CONSTANTS } from '../core/Constants';

export type TrainGapClassification = 'CONTINUOUS_SUPPORT' | 'EXPLICIT_JUMP' | 'REJECTED_LAYOUT';
export interface TrainGapInput {
  gap: number;
  sourceLength: number;
  targetLength: number;
  playerSpeed: number;
  sourceVelocityZ?: number;
  targetVelocityZ?: number;
  /** Destination equipment intervals measured forward from its near roof edge. */
  landingObstacles?: Array<{ start: number; end: number }>;
  /** Source equipment measured backward from its departure edge. */
  takeoffObstacles?: Array<{ start: number; end: number }>;
}
export interface TrainGapDecision {
  classification: TrainGapClassification;
  reason: string;
  gap: number;
  airtime: number;
  takeoffMin: number;
  takeoffMax: number;
  landingMin: number;
  landingMax: number;
  reactionLeadDistance: number;
  projectedGapPixels: number;
}

/** Shared by rendering, generated support and reachability. Distances use real deck edges. */
export class TrainGapPolicy {
  // Existing rigid coupler hardware spans at most 2m. Longer interfaces require a jump proof.
  public static readonly MAX_COUPLER_SPAN = 2;
  public static readonly INPUT_WINDOW_SECONDS = 0.12;
  public static readonly EDGE_MARGIN = CONSTANTS.PLAYER_DEPTH / 2 + 0.18;
  // Eight pixels at 720p keeps the open interval distinct from the 0.45m yellow edge strips.
  public static readonly MIN_OPEN_PIXELS = 8;

  /** Project the roof opening through both shipped gameplay camera profiles and portrait FOV. */
  public static projectedOpening(gap: number, lead: number): number {
    let pixels = Infinity;
    for (const focus of [false, true]) for (const portrait of [false, true]) {
      const camera = new THREE.PerspectiveCamera(portrait ? 68 : CONSTANTS.CAMERA_FOV, portrait ? 9 / 16 : 16 / 9, 0.2, 600);
      camera.position.set(focus ? 0.68 : 0, focus ? 3.12 : CONSTANTS.CAMERA_OFFSET_Y, focus ? 5.25 : CONSTANTS.CAMERA_OFFSET_Z);
      camera.lookAt(focus ? -0.18 : 0, focus ? 1.57 : CONSTANTS.CAMERA_LOOK_Y, CONSTANTS.CAMERA_LOOK_AHEAD_Z);
      camera.updateMatrixWorld();
      const near = new THREE.Vector3(0, 0, -lead).project(camera);
      const far = new THREE.Vector3(0, 0, -lead - gap).project(camera);
      if ([near, far].some(p => Math.abs(p.y) > 1 || Math.abs(p.x) > 1 || p.z > 1)) return 0;
      pixels = Math.min(pixels, Math.abs(near.y - far.y) * 360);
    }
    return pixels;
  }

  public static classify(input: TrainGapInput): TrainGapDecision {
    const { gap, sourceLength, targetLength, playerSpeed } = input;
    const sourceVelocity = input.sourceVelocityZ ?? 0;
    const targetVelocity = input.targetVelocityZ ?? 0;
    const airtime = 2 * CONSTANTS.JUMP_INITIAL_VELOCITY / CONSTANTS.GRAVITY;
    const margin = this.EDGE_MARGIN;
    const sourceClosing = playerSpeed + sourceVelocity;
    const targetClosing = playerSpeed + targetVelocity;
    const result: TrainGapDecision = { classification: 'REJECTED_LAYOUT', reason: '', gap, airtime,
      takeoffMin: 0, takeoffMax: 0, landingMin: 0, landingMax: 0, reactionLeadDistance: 0, projectedGapPixels: 0 };
    if (![gap, sourceLength, targetLength, playerSpeed, sourceVelocity, targetVelocity].every(Number.isFinite) || gap < -0.01) {
      return { ...result, reason: 'Overlapping or invalid roof geometry' };
    }
    if (gap <= this.MAX_COUPLER_SPAN) {
      return { ...result, classification: Math.abs(sourceVelocity - targetVelocity) < 1e-6 ? 'CONTINUOUS_SUPPORT' : 'REJECTED_LAYOUT',
        reason: Math.abs(sourceVelocity - targetVelocity) < 1e-6 ? 'Rigid, co-moving roof gangway' : 'Small gap between independently moving trains' };
    }
    // Independently moving roofs change separation during approach. They need an avoidance route,
    // not misleading transfer cues based on a snapshot of the separation.
    if (Math.abs(sourceVelocity - targetVelocity) > 1e-6 || sourceClosing <= 0 || targetClosing <= 0) {
      return { ...result, reason: 'No stable approach and landing window' };
    }
    const travel = targetClosing * airtime;
    const takeoffMin = Math.max(margin, travel - gap - targetLength + margin);
    let takeoffMax = Math.min(sourceLength - margin, travel - gap - margin);
    // Finish passing equipment and recover on supported roof before the jump input.
    for (const obstacle of input.takeoffObstacles ?? []) {
      if (obstacle.end >= 0) takeoffMax = Math.min(takeoffMax, obstacle.start - margin - sourceClosing * this.INPUT_WINDOW_SECONDS);
    }
    const window = sourceClosing * this.INPUT_WINDOW_SECONDS;
    const reactionLeadDistance = takeoffMin + sourceClosing * CONSTANTS.DIFFICULTY_CONFIG.MIN_SAFE_REACTION_TIME;
    const projectedGapPixels = this.projectedOpening(gap, reactionLeadDistance);
    Object.assign(result, { takeoffMin, takeoffMax, landingMin: travel - gap - takeoffMax,
      landingMax: travel - gap - takeoffMin, reactionLeadDistance, projectedGapPixels });
    if (takeoffMax - takeoffMin < window) return { ...result, reason: 'Insufficient supported takeoff / landing window' };
    if (projectedGapPixels < this.MIN_OPEN_PIXELS) return { ...result, reason: 'Opening unreadable before reaction deadline' };
    // Require at least one equipment-free landing interval with recovery, using the same ballistic travel.
    const recovery = playerSpeed * 0.12;
    let intervals = [[result.landingMin, result.landingMax]];
    for (const o of input.landingObstacles ?? []) {
      intervals = intervals.flatMap(([a,b]) => o.end + margin < a || o.start - margin - recovery > b ? [[a,b]] :
        [[a, Math.min(b, o.start - margin - recovery)], [Math.max(a, o.end + margin), b]].filter(([x,y]) => y > x));
    }
    const safe = intervals.find(([a,b]) => b - a >= window);
    if (!safe) return { ...result, reason: 'Destination equipment blocks landing and recovery' };
    result.landingMin = safe[0]; result.landingMax = safe[1];
    result.takeoffMin = travel - gap - safe[1]; result.takeoffMax = travel - gap - safe[0];
    result.reactionLeadDistance = result.takeoffMin + sourceClosing * CONSTANTS.DIFFICULTY_CONFIG.MIN_SAFE_REACTION_TIME;
    result.projectedGapPixels = this.projectedOpening(gap, result.reactionLeadDistance);
    if (result.projectedGapPixels < this.MIN_OPEN_PIXELS) return { ...result, reason: 'Equipment forces takeoff before opening is readable' };
    return { ...result, classification: 'EXPLICIT_JUMP', reason: 'Visible opening with supported ballistic takeoff and landing' };
  }

  public static planJump(sourceLength: number, targetLength: number, playerSpeed: number): TrainGapDecision {
    // Find the smallest readable, achievable opening instead of using one gap at every speed.
    const maxGap = playerSpeed * (2 * CONSTANTS.JUMP_INITIAL_VELOCITY / CONSTANTS.GRAVITY);
    for (let gap = 3.5; gap < maxGap; gap += 0.1) {
      const decision = this.classify({ gap: Math.round(gap * 10) / 10, sourceLength, targetLength, playerSpeed });
      if (decision.classification === 'EXPLICIT_JUMP') return decision;
    }
    return this.classify({ gap: maxGap, sourceLength, targetLength, playerSpeed });
  }
}
