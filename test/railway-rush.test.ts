import assert from 'node:assert/strict';
import * as THREE from 'three';
import { DifficultyController } from '../src/track/DifficultyController';
import { ReachabilityValidator } from '../src/track/ReachabilityValidator';
import { TrackChunk } from '../src/track/TrackChunk';
import { CONSTANTS } from '../src/core/Constants';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { TrainCompositionDef } from '../src/track/TrainComposition';
import { OBSTACLE_PATTERNS } from '../src/track/ObstaclePatterns';

let checks = 0;
function check(value: boolean, message: string) { assert.ok(value, message); checks++; console.log(`PASS: ${message}`); }
const dc = new DifficultyController();
for (const mode of ['BEGINNER', 'EASY', 'HARD']) {
  dc.setGameMode(mode); dc.reset();
  const stages = [100, 600, 1800, 3500].map((distance) => dc.getTrainEncounterPacing(distance));
  check(stages.every((p, i) => i === 0 || p.maxGap < stages[i - 1].maxGap), `${mode}: progressively shorter maximum target gaps`);
  check(stages[0].rushAllowed === false && stages[3].rushAllowed, `${mode}: express windows start after progression`);
  for (const distance of [250, 750, 1600]) {
    const a = dc.calculateMovingTrainSpeed(distance - 0.001, mode, 'EASY', 0.5);
    const b = dc.calculateMovingTrainSpeed(distance + 0.001, mode, 'EASY', 0.5);
    check(Math.abs(a - b) < 0.001, `${mode}: continuous train speed at ${distance}m`);
  }
}
check(dc.calculateMovingTrainSpeed(1600, 'BEGINNER', 'EASY', .5) === 34 &&
  dc.calculateMovingTrainSpeed(1600, 'EASY', 'EASY', .5) === 42 &&
  dc.calculateMovingTrainSpeed(1600, 'HARD', 'EASY', .5) === 48, 'Preserve the elevated train velocities across 3 modes');
const pattern: any = { name: 'CLOCK_TEST', difficulty: 'EASY', obstacles: [{ type: 'MOVING_TRAIN' }], collectibles: [] };
dc.recordPatternSpawned(pattern, 500, 10);
check(!dc.canSpawnMovingTrain(1000, 46, 11), 'A distance jump cannot bypass the simulation-time cooldown');
check(dc.canSpawnMovingTrain(1000, 46, 12.5), 'The cooldown expires using the same simulation clock');

function hazard(lane: number, z: number, velocityZ = 30, length = 20) {
  return { min: new THREE.Vector3(lane * 3.6 - 1.55, 0, z - length / 2),
    max: new THREE.Vector3(lane * 3.6 + 1.55, 4.2, z + length / 2), velocityZ };
}
const scene = [hazard(0, -100), hazard(-1, -240), hazard(1, -330)];
const proof = ReachabilityValidator.validateTrainWindow(scene, 0, 30, 30, 6, [0]);
check(proof.solvable && proof.witness.length > 0, 'Alternating moving hazards have an executable ground-control witness');
let safe = true;
for (let t = 0; t <= 6; t += .01) {
  const next = proof.witness.findIndex((point) => point.time >= t);
  const end = proof.witness[Math.max(0, next)];
  const start = proof.witness[Math.max(0, next - 1)];
  const fraction = end.time === start.time ? 0 : (t - start.time) / (end.time - start.time);
  const x = CONSTANTS.LANES[start.lane] + (CONSTANTS.LANES[end.lane] - CONSTANTS.LANES[start.lane]) * fraction;
  const runner = new THREE.Box3(new THREE.Vector3(x - .45, .9, -30 * t - .4), new THREE.Vector3(x + .45, 2.7, -30 * t + .4));
  for (const h of scene) {
    const box = new THREE.Box3(h.min.clone(), h.max.clone()).translate(new THREE.Vector3(0, 0, h.velocityZ * t));
    safe &&= !box.intersectsBox(runner);
  }
}
check(safe, 'Replay the witness at 10ms resolution without snapping lanes or entering a moving body');
const changes = proof.witness.filter((point, i, points) => i > 0 && point.lane !== points[i - 1].lane);
check(changes.length > 0 && changes[0].time >= .55 && proof.witness.every((point, i, points) =>
  i === 0 || point.lane === points[i - 1].lane || point.time - points[i - 1].time >= CONSTANTS.LANE_CHANGE_DURATION - 1e-8),
  'The witness preserves the reaction interval and complete lane-change duration');
check(!ReachabilityValidator.validateTrainWindow([-1, 0, 1].map((lane) => hazard(lane, -100)), 0, 30, 30, 3).solvable,
  'Reject a simultaneous three-lane train wall');
check(!ReachabilityValidator.validateTrainWindow([hazard(0, -15)], 0, 30, 30, 2, [0]).solvable,
  'Reject an impact before the current lane can react');
const divider = { min: new THREE.Vector3(1.4, 0, -300), max: new THREE.Vector3(2.2, 5, 0), velocityZ: 0 };
check(!ReachabilityValidator.validateTrainWindow([hazard(0, -60), hazard(-1, -100, 0, 240), divider], 0, 30, 30, 3, [0]).solvable,
  'A lane change cannot tunnel through an intervening solid divider');

// Whole-train bounds incorrectly put a roof overhang at chassis height.
const train = new THREE.Group();
const hull = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 10), new THREE.MeshBasicMaterial()); hull.position.y = 1.5; train.add(hull);
const roof = new THREE.Mesh(new THREE.BoxGeometry(4, .2, 10), new THREE.MeshBasicMaterial()); roof.position.y = 4; train.add(roof);
train.position.z = -20;
const barrier = new THREE.Group();
const base = new THREE.Mesh(new THREE.BoxGeometry(.5, 1, 1), new THREE.MeshBasicMaterial()); base.position.y = .5; barrier.add(base); barrier.position.x = 1.6;
const group = new THREE.Group(); group.add(train, barrier);
const chunk: any = Object.create(TrackChunk.prototype);
Object.assign(chunk, { group, decorativeGroup: new THREE.Group(), solidSceneryBounds: [], solidObstacleBounds: new WeakMap(),
  obstacles: [{ group: train, isMoving: true, active: true, velocityZ: 42 }, { group: barrier, active: true, isMoving: false }] });
check(!chunk.hasMovingTrainPathConflict(), 'A low obstruction outside the chassis clears the higher roof overhang');
barrier.position.x = 0;
check(chunk.hasMovingTrainPathConflict(), 'The same solid obstruction on the actual body path is rejected');
const roofLinks = OBSTACLE_PATTERNS.filter((pattern) => pattern.name.startsWith('RAILWAY_') && pattern.name.includes('ROOF_LINK'));
check(roofLinks.length === 2 && roofLinks.every((pattern) => pattern.obstacles.length === 1 &&
  pattern.obstacles[0].hasRamp && pattern.obstacles[0].hasExitRamp), 'Middle and advanced roof links preserve clear adjacent traffic lanes');
check(roofLinks.every((pattern) => {
  const obs = pattern.obstacles[0];
  return obs.zOffset - obs.length! / 2 - CONSTANTS.TRAIN_RAMP_LENGTH >= 0 &&
    obs.zOffset + obs.length! / 2 + CONSTANTS.TRAIN_RAMP_LENGTH <= CONSTANTS.CHUNK_LENGTH;
}), 'Long roofs and both ramps fit within their chunk boundaries');
const factory = new ObstacleFactory();
check(roofLinks.every(pattern => {
  const obs = pattern.obstacles[0];
  const composition = obs.composition as TrainCompositionDef;
  const mesh = factory.createTrainComposition(composition);
  const bounds = new THREE.Box3().setFromObject(mesh);
  return composition.hasRamp && composition.hasExitRamp &&
    composition.carriages[0].hasRamp && composition.carriages.at(-1)!.hasExitRamp &&
    bounds.min.z <= -obs.length! / 2 - CONSTANTS.TRAIN_RAMP_LENGTH + 0.01;
}), 'Both roof links render a physical exit ramp matching their support collider');
console.log(`All ${checks} railway-rush checks passed.`);
