import { OBSTACLE_PATTERNS, validatePatternFeasibility } from '../src/track/ObstaclePatterns';
import { CONSTANTS } from '../src/core/Constants';

console.log('🧪 Starting Procedural Obstacle Pattern Feasibility & Solvability Suite...\n');

let allPassed = true;
const testSpeeds = [
  CONSTANTS.INITIAL_SPEED,
  (CONSTANTS.INITIAL_SPEED + CONSTANTS.MAX_SPEED) / 2,
  CONSTANTS.MAX_SPEED
];

for (const pattern of OBSTACLE_PATTERNS) {
  for (const speed of testSpeeds) {
    const res = validatePatternFeasibility(pattern, speed);
    if (!res.solvable) {
      console.error(`❌ FAILED: Pattern "${pattern.name}" at speed ${speed} m/s: ${res.reason}`);
      allPassed = false;
    } else {
      console.log(`✅ PASSED: Pattern "${pattern.name}" (${pattern.difficulty}) at speed ${speed.toFixed(1)} m/s is 100% solvable.`);
    }
  }
}

if (!allPassed) {
  console.error('\n🚨 Solvability tests failed! Some obstacle configurations are unpassable.');
  process.exit(1);
} else {
  console.log(`\n🎉 ALL ${OBSTACLE_PATTERNS.length} PROCEDURAL PATTERNS VERIFIED 100% SOLVABLE ACROSS ALL SPEED PROFILES!`);
}
