import assert from 'node:assert/strict';
import * as THREE from 'three';
import { TrackManager } from '../src/track/TrackManager';
import { ObstacleFactory } from '../src/track/ObstacleFactory';

const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, String(value)),
  removeItem: (key: string) => store.delete(key), clear: () => store.clear()
};
let checks = 0;
function check(value: boolean, message: string) {
  assert.ok(value, message);
  checks++;
  console.log(`PASS: ${message}`);
}
const manager = new TrackManager(new THREE.Scene());
manager.chunks.forEach((chunk) => chunk.clearDynamicItems());
const [chunk, neighbor] = manager.chunks;
const train = (zOffset = 60, velocityZ = 42, lane = 0) =>
  ({ type: 'MOVING_TRAIN', lane, zOffset, velocityZ, length: 22 });
const layout = (obstacles: any[]) => ({ name: 'OCCUPANCY_TEST', difficulty: 'EASY', obstacles, collectibles: [] });
const place = (obstacles: any[], worldZ = 0, peers: any[] = []) =>
  chunk.populate(layout(obstacles), worldZ, undefined, false, undefined, peers);

check(place([train()]), 'An unobstructed 42 m/s train is accepted');
const obs = chunk.obstacles[0];
chunk.update(0.8, 0.8, 0, 46);
check(Math.abs(obs.group.position.z - (-60 + 42 * 0.8)) < 1e-8, 'High train speed is unchanged');
check(Math.abs(obs.collider.getCenter(new THREE.Vector3()).z - obs.group.position.z) < 1e-8,
  'Authoritative transform and player collision envelope remain synchronized');
check(Math.abs(obs.roofCollider!.min.z - (obs.group.position.z - 11.3)) < 1e-8 && obs.roofSurfaceY === 4.35,
  'Roof support bounds and height follow the moving train');

for (const type of ['TRAIN', 'LOW_BARRIER', 'MEDIUM_BARRIER', 'HIGH_BARRIER', 'PILLAR', 'TUNNEL_ARCH']) {
  const previous = chunk.obstacles;
  check(!place([train(), { type, lane: 0, zOffset: 20, length: 22 }]),
    `Reject the future path through a same-track ${type}`);
  check(chunk.obstacles === previous, 'Rejected layout preserves the previously published objects');
}
check(place([train(), { type: 'PILLAR', lane: 1, zOffset: 20 }]), 'An adjacent pillar remains valid');
check(place([train(), { type: 'TRAIN_RAMP', lane: 1, zOffset: 20, length: 22, hasExitRamp: true }]),
  'Adjacent stationary train, roof, and ramps remain valid');
check(place([train(), { type: 'TRAIN', lane: 0, zOffset: 100, length: 22 }]),
  'A moving train already ahead of a stationary train can move away');
check(!place([{ ...train(20, -42), length: 16 }, { type: 'PILLAR', lane: 0, zOffset: 9.7 }]),
  'Reject a visible nose overlap beyond the nominal hull collider');
check(place([train(40, 42), train(100, 42)]), 'Equal-speed moving trains retain safe headway');
check(!place([train(40, 20), train(100, 42)]), 'Reject a faster train that would catch the leading train');
check(place([train(40, 42), train(100, 20)]), 'Separating moving trains remain valid');
check(!place([train(40, -42), train(100, 42)]), 'Reject opposing train trajectories');
check(place([train(40, 42, -1), train(100, 42, 1)]), 'Two outside trains preserve the center escape lane');

neighbor.populate(layout([{ type: 'TRAIN', lane: 0, zOffset: 20, length: 22 }]), -80);
const existing = neighbor.obstacles[0];
const oldChunkZ = chunk.chunkZ;
const oldObjects = chunk.obstacles;
check(!place([train(20)], -160, [neighbor]), 'A stationary train in a neighboring chunk blocks the complete approach');
check(chunk.chunkZ === oldChunkZ && chunk.obstacles === oldObjects,
  'A rejected recycled placement restores the previous chunk transform and contents');
check(neighbor.obstacles[0] === existing && existing.active, 'Rejecting a new layout preserves existing objects');
check(place([train(20, 42, 1)], -160, [neighbor]), 'A neighboring train in another lane is valid');
neighbor.clearDynamicItems();
neighbor.populate(layout([train(20)]), -160);
check(!place([{ type: 'PILLAR', lane: 0, zOffset: 20 }], -80, [neighbor]),
  'Later static placement cannot obstruct an existing train arriving from another chunk');
neighbor.clearDynamicItems();

// Actual solid scene meshes: test per-part clearances, not an enclosing arch AABB.
function sceneryConflict(x: number, y: number, width: number, height: number) {
  check(place([train()]), 'Prepare a clean train route for solid scenery');
  const fixture = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, 1), new THREE.MeshBasicMaterial());
  mesh.position.set(x, y, -20);
  fixture.add(mesh);
  chunk.decorativeGroup.add(fixture);
  (chunk as any).solidSceneryBounds = ObstacleFactory.getSolidGeometryBounds(fixture);
  return chunk.hasMovingTrainPathConflict();
}
check(sceneryConflict(0, 2, 1, 4), 'A solid wall across the track blocks the path');
check(!sceneryConflict(9, 2, 1, 4), 'A wall outside the train envelope is valid');
check(!sceneryConflict(0, 6, 12, 0.5), 'A high overhead beam has valid train clearance');
check(place([train()]), 'Prepare valid arch clearance');
const arch = new THREE.Group();
for (const x of [-6, 6]) {
  const support = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 1), new THREE.MeshBasicMaterial());
  support.position.set(x, 3.5, -20);
  arch.add(support);
}
const beam = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 1), new THREE.MeshBasicMaterial());
beam.position.set(0, 7, -20);
arch.add(beam);
chunk.decorativeGroup.add(arch);
(chunk as any).solidSceneryBounds = ObstacleFactory.getSolidGeometryBounds(arch);
check(!chunk.hasMovingTrainPathConflict(), 'Pass beneath an arch whose solid supports and beam clear the train');

function snapshot(seed: number) {
  manager.setDebugSeed(seed);
  manager.reset();
  check(manager.chunks.every((c) => !c.hasMovingTrainPathConflict(manager.chunks)),
    `Seed ${seed} produces mutually compatible loaded paths`);
  return JSON.stringify(manager.chunks.map((c) => [c.chunkZ, c.obstacles.map((o) =>
    [o.type, o.lane, o.group.position.z, o.velocityZ])]));
}
check(snapshot(1337) === snapshot(1337), 'Fixed-seed placement and scheduling are repeatable across resets');
console.log(`All ${checks} moving-train occupancy checks passed.`);
