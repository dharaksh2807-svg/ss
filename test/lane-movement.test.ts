import { Player } from '../src/player/Player';
import { CONSTANTS, LaneIndex } from '../src/core/Constants';
import { EventBus, EVENTS } from '../src/core/EventBus';

console.log('🧪 Starting Comprehensive Lane Movement & Boundary Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
    passedTests++;
  }
}

// Helper: step simulation through time
function stepPlayer(player: Player, duration: number, fps: number = 60) {
  const dt = 1.0 / fps;
  let elapsed = 0;
  while (elapsed < duration) {
    player.update(dt);
    elapsed += dt;
  }
}

// =========================================================================
// Scenario 1: Starting in Left (-1), press Right once -> Center (0) only
// =========================================================================
console.log('--- Test 1: Left -> Right input -> Center only ---');
{
  const player = new Player();
  player.reset();
  // Move to Left lane first
  player.handleInput('LEFT');
  stepPlayer(player, 0.3); // Wait for transition to complete
  assert(player.currentLane === -1, 'Player initialized in Left lane (-1)');
  assert(Math.abs(player.position.x - CONSTANTS.LANES[-1]) < 0.001, 'Player position.x matches Left lane coordinate (-3.6m)');

  // Now press Right ONCE
  player.handleInput('RIGHT');
  assert(player.targetLane === 0, 'Target lane is Center (0)');
  stepPlayer(player, 0.3); // Let transition complete

  assert(player.currentLane === 0, 'Current lane is strictly Center (0)');
  assert(player.targetLane === 0, 'Target lane remains Center (0)');
  assert(Math.abs(player.position.x - CONSTANTS.LANES[0]) < 0.001, 'Player position.x is exactly 0.0m (did NOT skip to Right)');
}

// =========================================================================
// Scenario 2: Starting in Center (0), press Right once -> Right (+1) only
// =========================================================================
console.log('\n--- Test 2: Center -> Right input -> Right only ---');
{
  const player = new Player();
  player.reset();
  assert(player.currentLane === 0, 'Player initialized in Center lane (0)');

  player.handleInput('RIGHT');
  assert(player.targetLane === 1, 'Target lane is Right (+1)');
  stepPlayer(player, 0.3);

  assert(player.currentLane === 1, 'Current lane is strictly Right (+1)');
  assert(Math.abs(player.position.x - CONSTANTS.LANES[1]) < 0.001, 'Player position.x matches Right lane coordinate (+3.6m)');
}

// =========================================================================
// Scenario 3: Starting in Right (+1), press Left once -> Center (0) only
// =========================================================================
console.log('\n--- Test 3: Right -> Left input -> Center only ---');
{
  const player = new Player();
  player.reset();
  player.handleInput('RIGHT');
  stepPlayer(player, 0.3);
  assert(player.currentLane === 1, 'Player in Right lane (+1)');

  // Press Left ONCE
  player.handleInput('LEFT');
  assert(player.targetLane === 0, 'Target lane is Center (0)');
  stepPlayer(player, 0.3);

  assert(player.currentLane === 0, 'Current lane is strictly Center (0)');
  assert(Math.abs(player.position.x - CONSTANTS.LANES[0]) < 0.001, 'Player position.x is 0.0m (did NOT skip to Left)');
}

// =========================================================================
// Scenario 4: Starting in Center (0), press Left once -> Left (-1) only
// =========================================================================
console.log('\n--- Test 4: Center -> Left input -> Left only ---');
{
  const player = new Player();
  player.reset();
  assert(player.currentLane === 0, 'Player in Center lane (0)');

  player.handleInput('LEFT');
  assert(player.targetLane === -1, 'Target lane is Left (-1)');
  stepPlayer(player, 0.3);

  assert(player.currentLane === -1, 'Current lane is strictly Left (-1)');
  assert(Math.abs(player.position.x - CONSTANTS.LANES[-1]) < 0.001, 'Player position.x is -3.6m');
}

// =========================================================================
// Scenario 5: Boundary test: Left + Left -> stays Left (-1); Right + Right -> stays Right (+1)
// =========================================================================
console.log('\n--- Test 5: Boundary enforcement (no out-of-bounds or delayed wrap) ---');
{
  const player = new Player();
  player.reset();
  player.handleInput('LEFT');
  stepPlayer(player, 0.3);
  assert(player.currentLane === -1, 'In Left lane (-1)');

  // Press Left while already at leftmost boundary
  player.handleInput('LEFT');
  assert(player.targetLane === -1, 'Target lane clamped at -1');
  stepPlayer(player, 0.3);
  assert(player.currentLane === -1, 'Player remains at Left lane (-1)');

  // Move all the way to Right (+1)
  player.handleInput('RIGHT');
  stepPlayer(player, 0.3);
  player.handleInput('RIGHT');
  stepPlayer(player, 0.3);
  assert(player.currentLane === 1, 'In Right lane (+1)');

  // Press Right while already at rightmost boundary
  player.handleInput('RIGHT');
  assert(player.targetLane === 1, 'Target lane clamped at +1');
  stepPlayer(player, 0.3);
  assert(player.currentLane === 1, 'Player remains at Right lane (+1)');
}

// =========================================================================
// Scenario 6: Rapid Double Press (Input Queueing) -> Sequential transitions, not skipping
// =========================================================================
console.log('\n--- Test 6: Press Right twice quickly from Left (-1) -> sequential transitions ---');
{
  const player = new Player();
  player.reset();
  player.handleInput('LEFT');
  stepPlayer(player, 0.3);
  assert(player.currentLane === -1, 'Starting at Left (-1)');

  // First Right press begins transition -1 -> 0
  player.handleInput('RIGHT');
  assert(player.targetLane === 0, 'First target is Center (0)');

  // Step partially through transition (e.g. 50ms in, midway between -1 and 0)
  stepPlayer(player, 0.05);
  assert(player.position.x > -3.6 && player.position.x < 0, 'Character is physically between -1 and 0');

  // Second Right press arrives while still in transit!
  player.handleInput('RIGHT');

  // Step until the first transition finishes
  stepPlayer(player, 0.2);
  // At this point, the first transition finished at 0, and the second transition was cleanly initiated
  stepPlayer(player, 0.25);

  assert(player.currentLane === 1, 'Player arrived at Right (+1) sequentially through Center');
  assert(Math.abs(player.position.x - CONSTANTS.LANES[1]) < 0.001, 'Position matches +3.6m');
}

// =========================================================================
// Scenario 7: Repeatedly Alternate Left and Right -> Stable, no drift
// =========================================================================
console.log('\n--- Test 7: Alternate Left and Right rapidly ---');
{
  const player = new Player();
  player.reset();

  for (let i = 0; i < 20; i++) {
    player.handleInput(i % 2 === 0 ? 'RIGHT' : 'LEFT');
    stepPlayer(player, 0.22);
  }

  assert(player.currentLane === 0, 'Player ends cleanly in Center lane');
  assert(Math.abs(player.position.x) < 0.001, 'Zero accumulated lateral drift');
}

// =========================================================================
// Scenario 8: Jump + Lane Change -> Correct simultaneous kinematics
// =========================================================================
console.log('\n--- Test 8: Jump and Change Lanes simultaneously ---');
{
  const player = new Player();
  player.reset();
  player.handleInput('UP'); // Jump
  assert(player.isJumping === true, 'Player jumped');

  // Switch lane while in the air!
  player.handleInput('RIGHT');
  stepPlayer(player, 0.2);

  assert(player.currentLane === 1, 'Lane transition completed while in air');
  assert(player.position.y > CONSTANTS.PLAYER_BASE_Y, 'Player is still airborne');

  // Complete the jump
  stepPlayer(player, 0.6);
  assert(player.isJumping === false, 'Player landed');
  assert(player.currentLane === 1, 'Player landed on Right lane');
  assert(Math.abs(player.position.x - CONSTANTS.LANES[1]) < 0.001, 'Grounded on correct lane');
}

// =========================================================================
// Scenario 9: Slide + Lane Change -> Correct collision box & lane
// =========================================================================
console.log('\n--- Test 9: Slide and Change Lanes simultaneously ---');
{
  const player = new Player();
  player.reset();
  player.handleInput('DOWN'); // Slide
  assert(player.isSliding === true, 'Player sliding');

  player.handleInput('LEFT');
  stepPlayer(player, 0.2);

  assert(player.currentLane === -1, 'Lane transition completed during slide');
  assert(player.isSliding === true, 'Player still in slide state');
  stepPlayer(player, 0.5);
  assert(player.isSliding === false, 'Slide expired cleanly');
  assert(player.currentLane === -1, 'Current lane is strictly Left (-1)');
}

// =========================================================================
// Scenario 10: Variable Frame Rates (30 FPS, 60 FPS, 120 FPS)
// =========================================================================
console.log('\n--- Test 10: Smooth interpolation across variable frame rates ---');
{
  for (const fps of [30, 60, 120]) {
    const player = new Player();
    player.reset();
    player.handleInput('RIGHT');
    stepPlayer(player, 0.3, fps);
    assert(player.currentLane === 1, `Lane transition works at ${fps} FPS`);
    assert(Math.abs(player.position.x - CONSTANTS.LANES[1]) < 0.001, `Target reached exactly at ${fps} FPS`);
  }
}

// =========================================================================
// Scenario 11: Mid-Transit Reversal (Press Right then Left before landing)
// =========================================================================
console.log('\n--- Test 11: Mid-transit opposite direction input ---');
{
  const player = new Player();
  player.reset(); // starts at 0

  // Start moving toward 1
  player.handleInput('RIGHT');
  stepPlayer(player, 0.05); // 50ms into transition

  // Player reverses mind and presses LEFT
  player.handleInput('LEFT');

  // Allow first transition to reach target (1) and queued reversal (0) to execute
  stepPlayer(player, 0.4);
  assert(player.currentLane === 0, 'Reversal executed cleanly back to Center (0)');
  assert(Math.abs(player.position.x - CONSTANTS.LANES[0]) < 0.001, 'Zero drift on reversal');
}

console.log(`\n🎉 ALL ${passedTests}/${totalTests} LANE MOVEMENT & BOUNDARY TESTS PASSED!`);
