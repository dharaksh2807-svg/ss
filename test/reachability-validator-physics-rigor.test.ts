import { ReachabilityValidator, ValidatedPattern } from '../src/track/ReachabilityValidator';
import { OBSTACLE_PATTERNS } from '../src/track/ObstaclePatterns';
import { CONSTANTS } from '../src/core/Constants';

console.log('🧪 Starting ReachabilityValidator Real Player Physics & Rejection Rigor Suite...\n');

let passed = 0;
let total = 0;

function assert(condition: boolean, msg: string): void {
  total++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  passed++;
  console.log(`✅ PASSED: ${msg}`);
}

// =========================================================================
// Suite 1: Rejection of Mid-Air State Inconsistencies (Jump & Slide)
// =========================================================================
console.log('--- Suite 1: Mid-Air Physical Constraints (Jump & Slide) ---');
{
  // 1.1 Impossible Jump into Immediate Slide
  // Player jumps at z=10 over low barrier (jump takes 0.8s = 16m at 20 m/s).
  // High barrier at z=12 (only 2m later = 0.10s) requires ground slide.
  // Flanks are blocked by pillars.
  const impossibleJumpSlide: ValidatedPattern = {
    name: 'IMPOSSIBLE_JUMP_SLIDE_2M',
    difficulty: 'HARD',
    entryLanes: [0],
    exitLanes: [0],
    obstacles: [
      { type: 'PILLAR', lane: -1, zOffset: 0, length: 80 },
      { type: 'PILLAR', lane: 1, zOffset: 0, length: 80 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 10, length: 1 },
      { type: 'HIGH_BARRIER', lane: 0, zOffset: 12, length: 1 }
    ]
  };
  const res1 = ReachabilityValidator.validatePattern(impossibleJumpSlide, 20.0, [0]);
  assert(!res1.solvable, 'Validator strictly rejects impossible jump into immediate ground slide (2m apart)');

  // 1.2 Possible Jump then Slide with Sufficient Landing Recovery
  // Player jumps at z=10. Landed by z=27. High barrier at z=30 (requires slide).
  const possibleJumpSlide: ValidatedPattern = {
    name: 'POSSIBLE_JUMP_THEN_SLIDE',
    difficulty: 'MEDIUM',
    entryLanes: [0],
    exitLanes: [0],
    obstacles: [
      { type: 'PILLAR', lane: -1, zOffset: 0, length: 80 },
      { type: 'PILLAR', lane: 1, zOffset: 0, length: 80 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 10, length: 1 },
      { type: 'HIGH_BARRIER', lane: 0, zOffset: 30, length: 1 }
    ]
  };
  const res2 = ReachabilityValidator.validatePattern(possibleJumpSlide, 20.0, [0]);
  assert(res2.solvable, 'Validator accepts physically realistic jump followed by ground slide with adequate recovery (20m apart)');

  // 1.3 Repeated Mid-Air Jump Barrier
  // Tunnel arch at z=14 overhead blocks mid-air runner if they jumped at z=10
  const midairTunnelBlocked: ValidatedPattern = {
    name: 'MIDAIR_TUNNEL_BLOCKED',
    difficulty: 'HARD',
    entryLanes: [0],
    exitLanes: [0],
    obstacles: [
      { type: 'PILLAR', lane: -1, zOffset: 0, length: 80 },
      { type: 'PILLAR', lane: 1, zOffset: 0, length: 80 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 10, length: 1 },
      { type: 'TUNNEL_ARCH', lane: 0, zOffset: 14, length: 2 }
    ]
  };
  const res3 = ReachabilityValidator.validatePattern(midairTunnelBlocked, 20.0, [0]);
  assert(!res3.solvable, 'Validator strictly rejects jump into mid-air overhead tunnel arch collision');
}

// =========================================================================
// Suite 2: Rejection of Instantaneous Lane Switches without Source Clearance
// =========================================================================
console.log('\n--- Suite 2: Lateral Path & Source Lane Takeoff Clearance ---');
{
  // 2.1 Impossible Instant Switch out of Blocked Source Lane
  // Flanks blocked 0..9.9. Center open 0..9.9, then solid PILLAR at z=10.
  // Player cannot instantly teleport into lane 1 at z=10 when lane 0 is blocked at z=10.
  const impossibleInstantSwitch: ValidatedPattern = {
    name: 'IMPOSSIBLE_INSTANT_SWITCH',
    difficulty: 'HARD',
    entryLanes: [0],
    exitLanes: [1],
    obstacles: [
      { type: 'PILLAR', lane: -1, zOffset: 0, length: 80 },
      { type: 'PILLAR', lane: 1, zOffset: 0, length: 9.9 },
      { type: 'PILLAR', lane: 0, zOffset: 10, length: 70 }
    ]
  };
  const res1 = ReachabilityValidator.validatePattern(impossibleInstantSwitch, 20.0, [0]);
  assert(!res1.solvable, 'Validator strictly rejects instantaneous lane switch initiated inside blocked source lane');

  // 2.2 Realistic Early Lane Switch
  // Center lane blocked at z=20. Lane 1 opens at z=10.
  // Player has 10m (0.5s) to safely switch from lane 0 to lane 1 before the obstacle.
  const realisticEarlySwitch: ValidatedPattern = {
    name: 'REALISTIC_EARLY_SWITCH',
    difficulty: 'EASY',
    entryLanes: [0],
    exitLanes: [1],
    obstacles: [
      { type: 'PILLAR', lane: -1, zOffset: 0, length: 80 },
      { type: 'PILLAR', lane: 1, zOffset: 0, length: 10 }, // Opens at z=10
      { type: 'PILLAR', lane: 0, zOffset: 20, length: 60 }  // Blocks center at z=20
    ]
  };
  const res2 = ReachabilityValidator.validatePattern(realisticEarlySwitch, 20.0, [0]);
  assert(res2.solvable, 'Validator accepts timely early lane change with clear transition corridor');
}

// =========================================================================
// Suite 3: Multi-Chunk Boundary & Rooftop State Propagation
// =========================================================================
console.log('\n--- Suite 3: Multi-Chunk Boundary & Rooftop State Propagation ---');
{
  // 3.1 Invalid Rooftop Exit into Immediate Ground Slide
  // Chunk A: forces player onto train roof in lane 0 (ends at z=80, sides blocked).
  // Chunk B: NO TRAIN in lane 0. Ground HIGH_BARRIER at z=1 (requiring ground slide).
  // Player exiting Chunk A is at rooftop height (y=3.5) and falling; cannot slide under ground barrier.
  const chunkA_rooftop: ValidatedPattern = {
    name: 'CHUNK_A_ROOFTOP_EXIT',
    difficulty: 'HARD',
    entryLanes: [0],
    exitLanes: [0],
    obstacles: [
      { type: 'PILLAR', lane: -1, zOffset: 0, length: 80 },
      { type: 'PILLAR', lane: 1, zOffset: 0, length: 80 },
      { type: 'TRAIN', lane: 0, zOffset: 50, length: 60, hasRamp: true }
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
      { type: 'HIGH_BARRIER', lane: 0, zOffset: 1, length: 1 }
    ]
  };

  const res1 = ReachabilityValidator.validateChunkTransition(chunkA_rooftop, chunkB_groundSlide, 20.0);
  assert(!res1, 'validateChunkTransition rejects invalid rooftop-to-ground transition into immediate ground slide');

  // 3.2 Valid Continuous Rooftop Across Chunk Boundary
  // Chunk A ends on a train roof in lane 0 at z=80.
  // Chunk B has a continuous train in lane 0 starting at z=0 without requiring a ramp.
  const chunkB_continuousRoof: ValidatedPattern = {
    name: 'CHUNK_B_CONTINUOUS_ROOF',
    difficulty: 'MEDIUM',
    entryLanes: [0],
    exitLanes: [0],
    obstacles: [
      { type: 'PILLAR', lane: -1, zOffset: 0, length: 80 },
      { type: 'PILLAR', lane: 1, zOffset: 0, length: 80 },
      { type: 'TRAIN', lane: 0, zOffset: 30, length: 60, hasRamp: false } // Train covers 0..60
    ]
  };

  const res2 = ReachabilityValidator.validateChunkTransition(chunkA_rooftop, chunkB_continuousRoof, 20.0);
  assert(res2, 'validateChunkTransition seamlessly accepts continuous rooftop running across chunk boundaries without a ramp');

  // 3.3 Safe Rooftop Exit onto Clear Runway
  // Chunk B has no train, but runway is clear for 15m so player safely lands on ground before any obstacle.
  const chunkB_safeRunway: ValidatedPattern = {
    name: 'CHUNK_B_SAFE_RUNWAY',
    difficulty: 'EASY',
    entryLanes: [0],
    exitLanes: [0],
    obstacles: [
      { type: 'PILLAR', lane: -1, zOffset: 0, length: 80 },
      { type: 'PILLAR', lane: 1, zOffset: 0, length: 80 },
      { type: 'LOW_BARRIER', lane: 0, zOffset: 25, length: 1 } // Safe distance after landing
    ]
  };

  const res3 = ReachabilityValidator.validateChunkTransition(chunkA_rooftop, chunkB_safeRunway, 20.0);
  assert(res3, 'validateChunkTransition accepts safe rooftop exit onto clear ground runway');
}

// =========================================================================
// Suite 4: Complete Suite Solvability Across All 66 Procedural Patterns
// =========================================================================
console.log('\n--- Suite 4: High-Fidelity Solvability Across All 66 Authorized Patterns ---');
{
  const speeds = [CONSTANTS.INITIAL_SPEED, 28.0, CONSTANTS.MAX_SPEED];
  let patternsValidated = 0;

  for (const pattern of OBSTACLE_PATTERNS) {
    for (const spd of speeds) {
      const res = ReachabilityValidator.validatePattern(pattern, spd);
      assert(res.solvable, `Pattern "${pattern.name}" (${pattern.difficulty}) is 100% solvable at ${spd.toFixed(1)} m/s`);
      patternsValidated++;
    }
  }

  assert(patternsValidated === OBSTACLE_PATTERNS.length * 3, `All ${OBSTACLE_PATTERNS.length} patterns verified across ${speeds.length} speeds`);
}

console.log(`\n🎉 ALL ${passed} OF ${total} TESTS PASSED CLEANLY! ReachabilityValidator physics rigor verified.`);
