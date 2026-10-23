import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../core/Constants';
import { Player } from '../player/Player';
import { TrackManager } from '../track/TrackManager';
import { PracticeModuleDef, PracticeEvaluation } from './PracticeTypes';

export const PRACTICE_MODULES: PracticeModuleDef[] = [
  // ---------------------------------------------------------------------------
  // MODULE 1: Three-Lane Movement
  // ---------------------------------------------------------------------------
  {
    id: 'THREE_LANE_MOVEMENT',
    title: 'Three-Lane Movement',
    subtitle: 'Master lateral navigation across all 3 subway tracks',
    icon: '↔️',
    skillCategory: 'BASIC_LOCOMOTION',
    instructions: 'React to alternating barriers by switching between Left, Center, and Right lanes.',
    controlsHint: 'Press A / D or ◀ / ▶ to switch lanes',
    objectiveText: 'Execute 3 clean lane changes and navigate past all hurdles safely.',
    harderVariationLabel: 'High-Speed Sprint (22 m/s)',
    setup: (player: Player, trackManager: TrackManager, isHarder: boolean) => {
      player.reset();
      player.currentLane = 0; // Start in center lane
      player.targetLane = 0;
      player.position.set(CONSTANTS.LANES[0], CONSTANTS.PLAYER_BASE_Y, 0);
      player.previousPosition.copy(player.position);
      player.speed = isHarder ? 22.0 : 16.0;

      const chunk = trackManager.chunks[0];
      chunk.chunkZ = 0;
      chunk.clearDynamicItems();

      // Alternating high and low hurdles across lanes:
      // Barrier 1: Center lane blocked at z = 22m -> Must move Left or Right
      // Barrier 2: Left and Center blocked at z = 44m -> Must move Right
      // Barrier 3: Right and Center blocked at z = 66m -> Must move Left
      chunk.populate({
        name: 'PRACTICE_THREE_LANE',
        difficulty: 'EASY',
        obstacles: [
          { type: 'HIGH_BARRIER', lane: 0, zOffset: 22.0 },
          { type: 'HIGH_BARRIER', lane: -1, zOffset: 44.0 },
          { type: 'HIGH_BARRIER', lane: 0, zOffset: 44.0 },
          { type: 'HIGH_BARRIER', lane: 1, zOffset: 66.0 },
          { type: 'HIGH_BARRIER', lane: 0, zOffset: 66.0 }
        ],
        collectibles: []
      }, 0);

      player.updateCollider();
    },
    evaluate: (player: Player, trackManager: TrackManager, dt: number, elapsed: number, isHarder: boolean): PracticeEvaluation => {
      if (player.state === 'CRASH') {
        return {
          result: 'FAILED',
          message: 'Barrier Collision! Switch lanes earlier to avoid oncoming hurdles.',
          tip: 'Tip: Tap left or right as soon as you spot an obstacle in your active lane.'
        };
      }

      // Check distance passed: target finish is z <= -75m
      const targetZ = -75.0;
      const progress = Math.min(1.0, Math.abs(player.position.z) / Math.abs(targetZ));

      if (player.position.z <= targetZ) {
        return {
          result: 'SUCCESS',
          message: isHarder ? 'Superb! High-speed agility mastered!' : 'Clean navigation! Three-lane agility verified!',
          tip: 'You can now seamlessly maneuver around stationary subway hazards.'
        };
      }

      return {
        result: 'IN_PROGRESS',
        message: 'Dodge the incoming barriers across all tracks...',
        progressCurrent: Math.floor(progress * 100),
        progressTarget: 100
      };
    }
  },

  // ---------------------------------------------------------------------------
  // MODULE 2: Jump Timing
  // ---------------------------------------------------------------------------
  {
    id: 'JUMP_TIMING',
    title: 'Jump Timing',
    subtitle: 'Clear low track barriers with precise leap takeoff',
    icon: '⬆️',
    skillCategory: 'OBSTACLE_CLEARANCE',
    instructions: 'Swipe UP or press W / Space to leap over low hurdles cleanly.',
    controlsHint: 'Press W, Space or Swipe ▲ to Jump',
    objectiveText: 'Time your jump to clear the hurdle without stumbling or crashing.',
    harderVariationLabel: 'Double Hurdle Sprint',
    setup: (player: Player, trackManager: TrackManager, isHarder: boolean) => {
      player.reset();
      player.currentLane = 0;
      player.targetLane = 0;
      player.position.set(CONSTANTS.LANES[0], CONSTANTS.PLAYER_BASE_Y, 0);
      player.previousPosition.copy(player.position);
      player.speed = isHarder ? 21.0 : 18.0;

      const chunk = trackManager.chunks[0];
      chunk.chunkZ = 0;
      chunk.clearDynamicItems();

      const obstacles: any[] = [
        // Side lanes blocked with side barriers to focus on the jump
        { type: 'SIDE_BARRIER', lane: -1, zOffset: 28.0 },
        { type: 'SIDE_BARRIER', lane: 1, zOffset: 28.0 },
        { type: 'LOW_BARRIER', lane: 0, zOffset: 28.0 }
      ];

      if (isHarder) {
        obstacles.push(
          { type: 'SIDE_BARRIER', lane: -1, zOffset: 52.0 },
          { type: 'SIDE_BARRIER', lane: 1, zOffset: 52.0 },
          { type: 'LOW_BARRIER', lane: 0, zOffset: 52.0 }
        );
      }

      chunk.populate({
        name: 'PRACTICE_JUMP',
        difficulty: 'EASY',
        obstacles,
        collectibles: []
      }, 0);

      player.updateCollider();
    },
    evaluate: (player: Player, trackManager: TrackManager, dt: number, elapsed: number, isHarder: boolean): PracticeEvaluation => {
      if (player.state === 'CRASH') {
        return {
          result: 'FAILED',
          message: 'Crashed into low hurdle! Jump before you reach the hurdle.',
          tip: 'Tip: Jump takeoff takes ~0.15s to reach apex clearance (1.8m). Take off 4-6m before the barrier.'
        };
      }

      const targetZ = isHarder ? -62.0 : -38.0;
      if (player.position.z <= targetZ) {
        return {
          result: 'SUCCESS',
          message: isHarder ? 'Flawless double-hurdle leaps!' : 'Perfect jump clearance!',
          tip: 'Your jump clears up to 1.85m on ground, and higher with Super Sneakers.'
        };
      }

      return {
        result: 'IN_PROGRESS',
        message: 'Approaching hurdle... Prepare to jump!',
        progressCurrent: Math.floor((Math.abs(player.position.z) / Math.abs(targetZ)) * 100),
        progressTarget: 100
      };
    }
  },

  // ---------------------------------------------------------------------------
  // MODULE 3: Slide Timing
  // ---------------------------------------------------------------------------
  {
    id: 'SLIDE_TIMING',
    title: 'Slide Timing',
    subtitle: 'Duck beneath high overhead signs and barriers',
    icon: '⬇️',
    skillCategory: 'OBSTACLE_CLEARANCE',
    instructions: 'Swipe DOWN or press S to duck under high barriers.',
    controlsHint: 'Press S or Swipe ▼ to Slide',
    objectiveText: 'Maintain slide posture while passing beneath the overhead barrier.',
    harderVariationLabel: 'Rapid Consecutives',
    setup: (player: Player, trackManager: TrackManager, isHarder: boolean) => {
      player.reset();
      player.currentLane = 0;
      player.targetLane = 0;
      player.position.set(CONSTANTS.LANES[0], CONSTANTS.PLAYER_BASE_Y, 0);
      player.previousPosition.copy(player.position);
      player.speed = isHarder ? 21.0 : 18.0;

      const chunk = trackManager.chunks[0];
      chunk.chunkZ = 0;
      chunk.clearDynamicItems();

      const obstacles: any[] = [
        { type: 'SIDE_BARRIER', lane: -1, zOffset: 30.0 },
        { type: 'SIDE_BARRIER', lane: 1, zOffset: 30.0 },
        { type: 'HIGH_BARRIER', lane: 0, zOffset: 30.0 }
      ];

      if (isHarder) {
        obstacles.push(
          { type: 'SIDE_BARRIER', lane: -1, zOffset: 55.0 },
          { type: 'SIDE_BARRIER', lane: 1, zOffset: 55.0 },
          { type: 'HIGH_BARRIER', lane: 0, zOffset: 55.0 }
        );
      }

      chunk.populate({
        name: 'PRACTICE_SLIDE',
        difficulty: 'EASY',
        obstacles,
        collectibles: []
      }, 0);

      player.updateCollider();
    },
    evaluate: (player: Player, trackManager: TrackManager, dt: number, elapsed: number, isHarder: boolean): PracticeEvaluation => {
      if (player.state === 'CRASH') {
        return {
          result: 'FAILED',
          message: 'Struck overhead barrier! You must slide under high signs.',
          tip: 'Tip: Slide shrinks player height to 0.70m, comfortably clearing 1.5m overhead signs.'
        };
      }

      const targetZ = isHarder ? -65.0 : -40.0;
      if (player.position.z <= targetZ) {
        return {
          result: 'SUCCESS',
          message: isHarder ? 'Flawless consecutive slides!' : 'Smooth slide! Ducked cleanly under.',
          tip: 'Re-swiping down while already sliding refreshes your slide duration.'
        };
      }

      return {
        result: 'IN_PROGRESS',
        message: 'High barrier ahead... Slide underneath!',
        progressCurrent: Math.floor((Math.abs(player.position.z) / Math.abs(targetZ)) * 100),
        progressTarget: 100
      };
    }
  },

  // ---------------------------------------------------------------------------
  // MODULE 4: Fast Drop
  // ---------------------------------------------------------------------------
  {
    id: 'FAST_DROP',
    title: 'Fast Drop Technique',
    subtitle: 'Slam down mid-air to recover ground control instantly',
    icon: '⚡',
    skillCategory: 'ADVANCED_TECH',
    instructions: 'Jump over the low barrier, then immediately swipe DOWN mid-air to fast-drop under the overhead sign.',
    controlsHint: 'Jump [W / Space], then immediately press S / Swipe ▼ mid-air',
    objectiveText: 'Execute an airborne fast drop to land and slide before the overhead hazard.',
    harderVariationLabel: 'Tight 10m Spacing',
    setup: (player: Player, trackManager: TrackManager, isHarder: boolean) => {
      player.reset();
      player.currentLane = 0;
      player.targetLane = 0;
      player.position.set(CONSTANTS.LANES[0], CONSTANTS.PLAYER_BASE_Y, 0);
      player.previousPosition.copy(player.position);
      player.speed = 18.0;

      const chunk = trackManager.chunks[0];
      chunk.chunkZ = 0;
      chunk.clearDynamicItems();

      // Low barrier at 24m, followed immediately by high overhead barrier
      // Standard spacing: 14m gap (z=38m). Harder spacing: 11m gap (z=35m).
      const overheadZ = isHarder ? 35.0 : 38.0;

      chunk.populate({
        name: 'PRACTICE_FAST_DROP',
        difficulty: 'MEDIUM',
        obstacles: [
          { type: 'SIDE_BARRIER', lane: -1, zOffset: 24.0 },
          { type: 'SIDE_BARRIER', lane: 1, zOffset: 24.0 },
          { type: 'LOW_BARRIER', lane: 0, zOffset: 24.0 },
          { type: 'SIDE_BARRIER', lane: -1, zOffset: overheadZ },
          { type: 'SIDE_BARRIER', lane: 1, zOffset: overheadZ },
          { type: 'HIGH_BARRIER', lane: 0, zOffset: overheadZ }
        ],
        collectibles: []
      }, 0);

      player.updateCollider();
    },
    evaluate: (player: Player, trackManager: TrackManager, dt: number, elapsed: number, isHarder: boolean): PracticeEvaluation => {
      if (player.state === 'CRASH') {
        return {
          result: 'FAILED',
          message: 'Collided with overhead barrier! You floated too long.',
          tip: 'Tip: Floating at standard jump airtime will strike the overhead sign. Swipe DOWN while mid-air to slam down!'
        };
      }

      const targetZ = -48.0;
      if (player.position.z <= targetZ) {
        return {
          result: 'SUCCESS',
          message: isHarder ? 'Incredible! Tight fast-drop recovery mastered!' : 'Mastered Fast Drop! Rapid ground recovery verified.',
          tip: 'Fast drop is essential for tight jump-to-slide sequences at high speeds.'
        };
      }

      return {
        result: 'IN_PROGRESS',
        message: 'Jump the low hurdle, then press S mid-air to Fast Drop!',
        progressCurrent: Math.floor((Math.abs(player.position.z) / Math.abs(targetZ)) * 100),
        progressTarget: 100
      };
    }
  },

  // ---------------------------------------------------------------------------
  // MODULE 5: Jump & Lane Switch Combinations
  // ---------------------------------------------------------------------------
  {
    id: 'JUMP_AND_LANE_SWITCH',
    title: 'Jump & Mid-Air Lane Switch',
    subtitle: 'Steer horizontally while flying through the air',
    icon: '🔀',
    skillCategory: 'ADVANCED_TECH',
    instructions: 'Jump over the approach hurdle and steer left or right while airborne to avoid the dead-end train.',
    controlsHint: 'Jump [W / Space], then press A / D or ◀ / ▶ while airborne',
    objectiveText: 'Execute an airborne lane shift to land safely in an open adjacent lane.',
    harderVariationLabel: 'Double Aerial Shift',
    setup: (player: Player, trackManager: TrackManager, isHarder: boolean) => {
      player.reset();
      player.currentLane = 0;
      player.targetLane = 0;
      player.position.set(CONSTANTS.LANES[0], CONSTANTS.PLAYER_BASE_Y, 0);
      player.previousPosition.copy(player.position);
      player.speed = 18.0;

      const chunk = trackManager.chunks[0];
      chunk.chunkZ = 0;
      chunk.clearDynamicItems();

      // At 20m: Low hurdle across center lane
      // At 28m: Flat-front stationary train blocking center lane (impassable without mid-air steer)
      // Left and right lanes open for landing!
      chunk.populate({
        name: 'PRACTICE_AIR_STEER',
        difficulty: 'MEDIUM',
        obstacles: [
          { type: 'LOW_BARRIER', lane: 0, zOffset: 20.0 },
          { type: 'TRAIN', lane: 0, zOffset: 34.0, length: CONSTANTS.TRAIN_LENGTH_SHORT, hasRamp: false }
        ],
        collectibles: []
      }, 0);

      player.updateCollider();
    },
    evaluate: (player: Player, trackManager: TrackManager, dt: number, elapsed: number, isHarder: boolean): PracticeEvaluation => {
      if (player.state === 'CRASH') {
        return {
          result: 'FAILED',
          message: 'Train head-on impact! You must steer sideways while in mid-air.',
          tip: 'Tip: Jumping alone will hit the train front. Press A or D while airborne to change lanes mid-flight.'
        };
      }

      const targetZ = -44.0;
      if (player.position.z <= targetZ) {
        // Player cleared hurdle and safely bypassed the center train
        return {
          result: 'SUCCESS',
          message: 'Mid-air redirect verified! Superb aerial control.',
          tip: 'Airborne lane switching lets you dodge surprise hazards that appear after takeoff.'
        };
      }

      return {
        result: 'IN_PROGRESS',
        message: 'Jump the hurdle and steer into an adjacent lane mid-air!',
        progressCurrent: Math.floor((Math.abs(player.position.z) / Math.abs(targetZ)) * 100),
        progressTarget: 100
      };
    }
  },

  // ---------------------------------------------------------------------------
  // MODULE 6: Ramp Climbing
  // ---------------------------------------------------------------------------
  {
    id: 'RAMP_CLIMBING',
    title: 'Ramp Climbing',
    subtitle: 'Ascend train ramps to access train rooftops',
    icon: '📈',
    skillCategory: 'TRAIN_NAVIGATION',
    instructions: 'Run straight into the train front ramp to climb up onto the train roof without jumping.',
    controlsHint: 'Stay centered in lane and run directly into the ramp',
    objectiveText: 'Run into the ramp and transition onto the train rooftop.',
    harderVariationLabel: 'Sprint Climb (23 m/s)',
    setup: (player: Player, trackManager: TrackManager, isHarder: boolean) => {
      player.reset();
      player.currentLane = 0;
      player.targetLane = 0;
      player.position.set(CONSTANTS.LANES[0], CONSTANTS.PLAYER_BASE_Y, 0);
      player.previousPosition.copy(player.position);
      player.speed = isHarder ? 23.0 : 18.0;

      const chunk = trackManager.chunks[0];
      chunk.chunkZ = 0;
      chunk.clearDynamicItems();

      // Train with ramp positioned at 30m ahead
      chunk.populate({
        name: 'PRACTICE_RAMP_CLIMB',
        difficulty: 'EASY',
        obstacles: [
          {
            type: 'TRAIN_RAMP',
            lane: 0,
            zOffset: 32.0,
            length: CONSTANTS.TRAIN_LENGTH_MEDIUM,
            hasRamp: true
          }
        ],
        collectibles: []
      }, 0);

      player.updateCollider();
    },
    evaluate: (player: Player, trackManager: TrackManager, dt: number, elapsed: number, isHarder: boolean): PracticeEvaluation => {
      if (player.state === 'CRASH') {
        return {
          result: 'FAILED',
          message: 'Collision on train front! Enter the ramp straight-on.',
          tip: 'Tip: Do not jump into the ramp. Simply run straight ahead into the yellow-striped ramp wedge.'
        };
      }

      // Success when player is running atop the roof
      if (player.getSupportSurface() === 'TRAIN_ROOF' || (player.position.z <= -35.0 && player.position.y >= 4.2)) {
        return {
          result: 'SUCCESS',
          message: isHarder ? 'High-speed ramp ascent perfected!' : 'Ramp ascended! Clean rooftop entry.',
          tip: 'Ramps provide safe rooftop access without needing Super Sneakers or high platforms.'
        };
      }

      return {
        result: 'IN_PROGRESS',
        message: 'Approaching ramp... Run straight up!',
        progressCurrent: Math.floor((Math.abs(player.position.z) / 35.0) * 100),
        progressTarget: 100
      };
    }
  },

  // ---------------------------------------------------------------------------
  // MODULE 7: Train Rooftop Landing
  // ---------------------------------------------------------------------------
  {
    id: 'TRAIN_ROOFTOP_LANDING',
    title: 'Train Rooftop Landing',
    subtitle: 'High jump from track level and land atop a moving or flat-front train',
    icon: '🦘',
    skillCategory: 'TRAIN_NAVIGATION',
    instructions: 'With Super Sneakers active, leap from the ground rails and touch down on the train roof.',
    controlsHint: 'Jump [W / Space] ~8-10m before the train front',
    objectiveText: 'Land atop the train roof deck without falling or crashing.',
    harderVariationLabel: 'Moving Train Touchdown',
    setup: (player: Player, trackManager: TrackManager, isHarder: boolean) => {
      player.reset();
      player.currentLane = 0;
      player.targetLane = 0;
      player.position.set(CONSTANTS.LANES[0], CONSTANTS.PLAYER_BASE_Y, 0);
      player.previousPosition.copy(player.position);
      player.speed = 18.0;

      // Equip Super Sneakers for 4.8m jump capability
      player.powerups.activate('SNEAKERS');

      const chunk = trackManager.chunks[0];
      chunk.chunkZ = 0;
      chunk.clearDynamicItems();

      // Flat-front train (no ramp) at z = 32m
      chunk.populate({
        name: 'PRACTICE_ROOF_LAND',
        difficulty: 'MEDIUM',
        obstacles: [
          {
            type: isHarder ? 'MOVING_TRAIN' : 'TRAIN',
            lane: 0,
            zOffset: 35.0,
            length: CONSTANTS.TRAIN_LENGTH_MEDIUM,
            hasRamp: false,
            isMoving: isHarder,
            velocityZ: isHarder ? 8.0 : 0
          }
        ],
        collectibles: []
      }, 0);

      player.updateCollider();
    },
    evaluate: (player: Player, trackManager: TrackManager, dt: number, elapsed: number, isHarder: boolean): PracticeEvaluation => {
      if (player.state === 'CRASH') {
        return {
          result: 'FAILED',
          message: 'Bumper collision! Jump earlier to gain full 4.8m altitude.',
          tip: 'Tip: Super Sneakers give you extra vertical rise. Jump 8-10m before the train front.'
        };
      }

      if (player.getSupportSurface() === 'TRAIN_ROOF' && player.position.z <= -28.0) {
        return {
          result: 'SUCCESS',
          message: isHarder ? 'Dynamic touchdown on moving train roof!' : 'Perfect roof touchdown! Clean landing verified.',
          tip: 'Landing on roofs lets you collect elevated coin routes and bypass track barricades.'
        };
      }

      return {
        result: 'IN_PROGRESS',
        message: 'Super Sneakers ready... Jump high onto the train roof!',
        progressCurrent: Math.floor((Math.abs(player.position.z) / 35.0) * 100),
        progressTarget: 100
      };
    }
  },

  // ---------------------------------------------------------------------------
  // MODULE 8: Jumping Between Train Roofs
  // ---------------------------------------------------------------------------
  {
    id: 'TRAIN_ROOF_TRANSFER',
    title: 'Rooftop Gap Leap',
    subtitle: 'Sprint across train roofs and leap across gaps between cars',
    icon: '🌉',
    skillCategory: 'TRAIN_NAVIGATION',
    instructions: 'Leap across the gap between two train cars without falling to the ground rails.',
    controlsHint: 'Jump [W / Space] right at the front edge of the train roof',
    objectiveText: 'Cross the roof gap and touch down on the second train roof.',
    harderVariationLabel: 'Diagonal Gap Leap (Lane Switch)',
    setup: (player: Player, trackManager: TrackManager, isHarder: boolean) => {
      player.reset();
      player.currentLane = 0;
      player.targetLane = 0;
      // Start already running on Train 1 roof deck at y = 4.35m
      player.position.set(CONSTANTS.LANES[0], 4.35, -5.0);
      player.previousPosition.copy(player.position);
      player.speed = 18.0;

      const chunk = trackManager.chunks[0];
      chunk.chunkZ = 0;
      chunk.clearDynamicItems();

      // Train 1: from z = 0 to z = -20m (length 20m, center at 10m)
      // Gap: 4.5m (z = -20m to -24.5m)
      // Train 2: from z = -24.5m to -48m (length 24m)
      const targetLane = isHarder ? 1 : 0; // Harder variation requires diagonal leap into Right Lane!

      chunk.populate({
        name: 'PRACTICE_ROOF_GAP',
        difficulty: 'MEDIUM',
        obstacles: [
          {
            type: 'TRAIN',
            lane: 0,
            zOffset: 10.0,
            length: 20.0,
            hasRamp: false
          },
          {
            type: 'TRAIN',
            lane: targetLane,
            zOffset: 36.5,
            length: 24.0,
            hasRamp: false
          }
        ],
        collectibles: []
      }, 0);

      // Lock player support surface to Train 1 roof
      player.resolveRoofLanding(4.35, chunk.obstacles[0]?.id);
      player.updateCollider();
    },
    evaluate: (player: Player, trackManager: TrackManager, dt: number, elapsed: number, isHarder: boolean): PracticeEvaluation => {
      if (player.state === 'CRASH') {
        return {
          result: 'FAILED',
          message: 'Missed landing or hit car bumper!',
          tip: 'Tip: Jump right at the trailing edge of the roof for maximum flight distance across the gap.'
        };
      }

      // If player fell to ground level (< 2.0m), failed gap transfer
      if (player.position.y < 2.0 && player.position.z <= -20.0) {
        return {
          result: 'FAILED',
          message: 'Fell through gap to the rails below!',
          tip: 'Tip: Press Jump earlier before running off the roof edge.'
        };
      }

      // Reached second train roof safely
      if (player.position.z <= -30.0 && player.position.y >= 4.2 && (player.getSupportSurface() === 'TRAIN_ROOF' || player.state === 'ON_TRAIN')) {
        return {
          result: 'SUCCESS',
          message: isHarder ? 'Masterful diagonal roof-to-roof transfer!' : 'Gap cleared! Seamless rooftop transfer.',
          tip: 'Rooftop transfers let you maintain roof streaks for maximum coin collection.'
        };
      }

      return {
        result: 'IN_PROGRESS',
        message: 'Approaching gap... Leap across to the next train!',
        progressCurrent: Math.floor((Math.abs(player.position.z) / 36.0) * 100),
        progressTarget: 100
      };
    }
  },

  // ---------------------------------------------------------------------------
  // MODULE 9: Moving-Train Avoidance
  // ---------------------------------------------------------------------------
  {
    id: 'MOVING_TRAIN_AVOIDANCE',
    title: 'Moving-Train Avoidance',
    subtitle: 'React to oncoming moving trains and evade before impact',
    icon: '🚆',
    skillCategory: 'TRAIN_NAVIGATION',
    instructions: 'A speeding oncoming train is heading straight at you. Switch lanes before impact!',
    controlsHint: 'Watch the headlights, listen for horn, then press A / D to evade',
    objectiveText: 'Dodge out of the oncoming train path safely.',
    harderVariationLabel: 'Double Moving Trains (2 Lanes Closed)',
    setup: (player: Player, trackManager: TrackManager, isHarder: boolean) => {
      player.reset();
      player.currentLane = 0;
      player.targetLane = 0;
      player.position.set(CONSTANTS.LANES[0], CONSTANTS.PLAYER_BASE_Y, 0);
      player.previousPosition.copy(player.position);
      player.speed = 18.0;

      const chunk = trackManager.chunks[0];
      chunk.chunkZ = 0;
      chunk.clearDynamicItems();

      const obstacles: any[] = [
        // Center lane moving train approaching from 65m ahead
        {
          type: 'MOVING_TRAIN',
          lane: 0,
          zOffset: 65.0,
          length: CONSTANTS.TRAIN_LENGTH_MEDIUM,
          hasRamp: false,
          isMoving: true,
          velocityZ: CONSTANTS.MOVING_TRAIN_SPEED
        }
      ];

      if (isHarder) {
        // Also block the Left Lane with a stationary train, forcing an evade to Right Lane!
        obstacles.push({
          type: 'TRAIN',
          lane: -1,
          zOffset: 45.0,
          length: CONSTANTS.TRAIN_LENGTH_MEDIUM,
          hasRamp: false
        });
      }

      chunk.populate({
        name: 'PRACTICE_MOVING_TRAIN',
        difficulty: 'HARD',
        obstacles,
        collectibles: []
      }, 0);

      player.updateCollider();
    },
    evaluate: (player: Player, trackManager: TrackManager, dt: number, elapsed: number, isHarder: boolean): PracticeEvaluation => {
      if (player.state === 'CRASH') {
        return {
          result: 'FAILED',
          message: 'Head-on impact with oncoming train!',
          tip: 'Tip: Moving trains approach at combined speeds (18 + 15 = 33 m/s). React immediately when you hear the horn!'
        };
      }

      // Safe bypass when player has cleared past the moving train's rear
      if (player.position.z <= -45.0) {
        return {
          result: 'SUCCESS',
          message: isHarder ? 'Tight evasion! Dodged moving train with limited lane options.' : 'Close call dodged! Oncoming train bypassed safely.',
          tip: 'Always stay vigilant on middle tracks where moving trains most frequently spawn.'
        };
      }

      return {
        result: 'IN_PROGRESS',
        message: 'Oncoming train approaching! Switch lanes immediately!',
        progressCurrent: Math.floor((Math.abs(player.position.z) / 45.0) * 100),
        progressTarget: 100
      };
    }
  },

  // ---------------------------------------------------------------------------
  // MODULE 10: Hoverboard and Power-Up Usage
  // ---------------------------------------------------------------------------
  {
    id: 'HOVERBOARD_AND_POWERUPS',
    title: 'Hoverboard & Power-Up Protection',
    subtitle: 'Deploy hoverboards to survive otherwise fatal crashes',
    icon: '🛹',
    skillCategory: 'ADVANCED_TECH',
    instructions: 'Double-tap or press SPACE to deploy your hoverboard and absorb a track collision.',
    controlsHint: 'Press Space or Double-Tap to deploy board',
    objectiveText: 'Deploy hoverboard and survive the unavoidable barrier impact.',
    harderVariationLabel: 'Magnet Coin Trail + Board Deploy',
    setup: (player: Player, trackManager: TrackManager, isHarder: boolean) => {
      player.reset();
      player.currentLane = 0;
      player.targetLane = 0;
      player.position.set(CONSTANTS.LANES[0], CONSTANTS.PLAYER_BASE_Y, 0);
      player.previousPosition.copy(player.position);
      player.speed = 18.0;

      // Provide hoverboard charge
      player.hoverboardManager.grantPracticeCharge();

      if (isHarder) {
        player.powerups.activate('MAGNET');
      }

      const chunk = trackManager.chunks[0];
      chunk.chunkZ = 0;
      chunk.clearDynamicItems();

      // Low barrier at 25m, then unavoidable wall across all 3 lanes at 50m!
      chunk.populate({
        name: 'PRACTICE_HOVERBOARD',
        difficulty: 'MEDIUM',
        obstacles: [
          { type: 'LOW_BARRIER', lane: 0, zOffset: 25.0 },
          { type: 'HIGH_BARRIER', lane: -1, zOffset: 50.0 },
          { type: 'HIGH_BARRIER', lane: 0, zOffset: 50.0 },
          { type: 'HIGH_BARRIER', lane: 1, zOffset: 50.0 }
        ],
        collectibles: []
      }, 0);

      player.updateCollider();
    },
    evaluate: (player: Player, trackManager: TrackManager, dt: number, elapsed: number, isHarder: boolean): PracticeEvaluation => {
      if (player.state === 'CRASH') {
        return {
          result: 'FAILED',
          message: 'Fatal crash! Deploy your hoverboard BEFORE impacting the barrier.',
          tip: 'Tip: Press Space or double-tap to activate the board. While active, any crash destroys the board instead of ending your run!'
        };
      }

      // Player passed the unavoidable barrier at -50m and survived past -65m
      if (player.position.z <= -62.0) {
        return {
          result: 'SUCCESS',
          message: 'Hoverboard crash shield verified! Board saved your run.',
          tip: 'Hoverboards grant a brief invulnerability window after breaking, letting you recover safely.'
        };
      }

      return {
        result: 'IN_PROGRESS',
        message: 'Unavoidable wall ahead! Deploy Hoverboard [SPACE] to survive!',
        progressCurrent: Math.floor((Math.abs(player.position.z) / 62.0) * 100),
        progressTarget: 100
      };
    }
  }
];

export function getPracticeModuleById(id: string): PracticeModuleDef | undefined {
  return PRACTICE_MODULES.find(m => m.id === id);
}
