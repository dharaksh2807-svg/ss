import { ReachabilityValidator, ValidatedPattern } from '../src/track/ReachabilityValidator';
import { CONSTANTS } from '../src/core/Constants';

console.log('🧪 Running Reachability Overestimation Counterexample Diagnostic...\n');

// ---------------------------------------------------------------------------
// Counterexample 1: Impossible Jump-to-Slide (Mid-air slide under high barrier)
// ---------------------------------------------------------------------------
// Low barrier at z=10 forces player into JUMP.
// High barrier at z=12 (only 2 meters later = 0.10s at 20 m/s).
// Player is still high in the air at 0.10s into an 0.8s jump! Cannot slide on ground.
// Lanes -1 and 1 are completely blocked by pillars.
const impossibleJumpSlidePattern: ValidatedPattern = {
  name: 'IMPOSSIBLE_JUMP_TO_SLIDE',
  difficulty: 'HARD',
  entryLanes: [0],
  exitLanes: [0],
  obstacles: [
    // Flank lanes completely blocked
    { type: 'PILLAR', lane: -1, zOffset: 0, length: 80 },
    { type: 'PILLAR', lane: 1, zOffset: 0, length: 80 },
    // Center lane: Low hurdle requiring jump at z=10
    { type: 'LOW_BARRIER', lane: 0, zOffset: 10, length: 1 },
    // Immediate high barrier at z=12 requiring slide on ground
    { type: 'HIGH_BARRIER', lane: 0, zOffset: 12, length: 1 }
  ]
};

const res1 = ReachabilityValidator.validatePattern(impossibleJumpSlidePattern, 20.0, [0]);
console.log('Counterexample 1 (Impossible Jump-to-Slide):');
console.log(`  Current Validator Solvable? ${res1.solvable}`);
if (res1.solvable) {
  console.log('  ⚠️ BUG CONFIRMED: Validator falsely claims player can jump at z=10 and slide at z=12 (2m later)!');
} else {
  console.log('  Rejected as expected.');
}

// ---------------------------------------------------------------------------
// Counterexample 2: Instantaneous Lane Switch through obstacle in source lane
// ---------------------------------------------------------------------------
// Player starts in lane 0. Lanes -1 and 1 are blocked until z=10.
// At z=10, a solid pillar or train appears in lane 0.
// Lane 1 opens at z=10.
// A player cannot instantly switch from lane 0 to lane 1 at z=10 with 0 transition time/distance.
const impossibleInstantSwitchPattern: ValidatedPattern = {
  name: 'IMPOSSIBLE_INSTANT_SWITCH',
  difficulty: 'HARD',
  entryLanes: [0],
  exitLanes: [1],
  obstacles: [
    // Flank lanes blocked up to z=10
    { type: 'PILLAR', lane: -1, zOffset: 0, length: 80 },
    { type: 'PILLAR', lane: 1, zOffset: 0, length: 9.9 },
    // Center lane is open 0..9.9, then solid PILLAR at z=10
    { type: 'PILLAR', lane: 0, zOffset: 10, length: 70 }
  ]
};

const res2 = ReachabilityValidator.validatePattern(impossibleInstantSwitchPattern, 20.0, [0]);
console.log('\nCounterexample 2 (Instantaneous Lane Switch):');
console.log(`  Current Validator Solvable? ${res2.solvable}`);
if (res2.solvable) {
  console.log('  ⚠️ BUG CONFIRMED: Validator checked target lane only at z=10 and permitted instant lateral teleportation without source lane clearance!');
} else {
  console.log('  Rejected as expected.');
}

// ---------------------------------------------------------------------------
// Counterexample 3: Invalid Rooftop Transition across Chunk Boundary
// ---------------------------------------------------------------------------
// Chunk A forces player onto train roof in lane 0 (ramped train 20..80, sides blocked).
// Chunk B has NO TRAIN in lane 0, but a ground HIGH_BARRIER at z=1 (requiring ground slide).
// Player entering Chunk B is at rooftop height (y=3.5) and falling through air; cannot slide.
const chunkA_rooftop: ValidatedPattern = {
  name: 'CHUNK_A_ROOFTOP_EXIT',
  difficulty: 'HARD',
  entryLanes: [0],
  exitLanes: [0],
  obstacles: [
    { type: 'PILLAR', lane: -1, zOffset: 0, length: 80 },
    { type: 'PILLAR', lane: 1, zOffset: 0, length: 80 },
    { type: 'TRAIN', lane: 0, zOffset: 50, length: 60, hasRamp: true } // Train with ramp from 20 to 80
  ]
};

const chunkB_groundSlide: ValidatedPattern = {
  name: 'CHUNK_B_GROUND_SLIDE_ENTRY',
  difficulty: 'HARD',
  entryLanes: [0],
  exitLanes: [0],
  obstacles: [
    { type: 'PILLAR', lane: -1, zOffset: 0, length: 80 },
    { type: 'PILLAR', lane: 1, zOffset: 0, length: 80 },
    { type: 'HIGH_BARRIER', lane: 0, zOffset: 1, length: 1 } // Ground slide required at z=1
  ]
};

const res3 = ReachabilityValidator.validateChunkTransition(chunkA_rooftop, chunkB_groundSlide, 20.0);
console.log('\nCounterexample 3 (Invalid Rooftop to Ground Slide Chunk Transition):');
console.log(`  Current Validator Solvable? ${res3}`);
if (res3) {
  console.log('  ⚠️ BUG CONFIRMED: validateChunkTransition dropped rooftop state and allowed falling player to ground slide at z=1!');
} else {
  console.log('  Rejected as expected.');
}

