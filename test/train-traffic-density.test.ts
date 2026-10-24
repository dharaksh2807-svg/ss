import assert from 'node:assert/strict';
import * as THREE from 'three';
import { TrackManager } from '../src/track/TrackManager';
import { Player } from '../src/player/Player';
import { SpeedController } from '../src/core/SpeedController';
import { CONSTANTS } from '../src/core/Constants';
import { EventBus, EVENTS } from '../src/core/EventBus';

(globalThis as any).localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
// Track-only calibration: pickup/support timers and player collisions are tested by
// the existing gameplay suites. Count passed, warned trains, never spawn totals.
const log = console.log;
console.log = () => {};
const results = [];
for (const mode of ['NORMAL', 'HARD'] as const) {
  const scene = new THREE.Scene(), track = new TrackManager(scene), player = new Player(scene);
  const curve = new SpeedController(mode);
  track.setGameMode(mode);
  track.setDebugSeed(1337);
  track.reset();
  player.setGameMode(mode);
  player.speed = curve.getInitialSpeed();
  player.isInvulnerable = () => true;
  const seen = new WeakSet<object>();
  const stages = Array.from({ length: 4 }, () => ({ seconds: 0, static: 0, moving: 0, roofs: 0 }));
  const last = { static: -Infinity, moving: -Infinity };
  const patterns = new Set<string>();
  let paired = false;
  let time = 0, minWarning = Infinity, maxObjects = 0, layouts = '';
  const off = EventBus.getInstance().on(EVENTS.TRAIN_HORN, (d: any) => { minWarning = Math.min(minWarning, d.timeToImpact); });
  const start = performance.now();
  while (player.distanceTraveled < 4500) {
    const dt = 0.05;
    time += dt;
    player.speed += (curve.evaluateCurve(player.distanceTraveled) - player.speed) * (1 - Math.exp(-CONSTANTS.SPEED_LERP * dt));
    player.setSupportSurface('GROUND', null);
    player.position.y = CONSTANTS.PLAYER_BASE_Y;
    player.previousPosition.copy(player.position);
    player.position.z -= player.speed * dt;
    player.distanceTraveled = -player.position.z;
    player.updateCollider();
    for (const c of track.chunks) for (const col of c.collectibles) col.active = false;
    track.update(player, dt, time);
    const stage = CONSTANTS.TRAIN_ENCOUNTER_PACING.stages.findIndex(s => player.distanceTraveled < s.end);
    stages[stage].seconds += dt;
    const signature = track.chunks.map(c => c.chunkZ).join(',');
    if (signature !== layouts) {
      layouts = signature;
      assert.ok(track.chunks.every(c => !c.hasMovingTrainPathConflict(track.chunks)), `${mode}: compatible streamed trajectories`);
      const staticTrains = track.chunks.flatMap(c => c.obstacles).filter(o => o.active && !o.isMoving && o.group.userData.isTrain);
      for (let i = 0; i < staticTrains.length; i++) for (const other of staticTrains.slice(i + 1)) {
        assert.ok(!staticTrains[i].collider.intersectsBox(other.collider), `${mode}: parked formations never overlap`);
      }
    }
    let objects = 0;
    for (const c of track.chunks) for (const obs of c.obstacles) {
      if (!obs.active) continue;
      objects++;
      if (obs.group.userData.sourcePattern) {
        patterns.add(obs.group.userData.sourcePattern);
        assert.ok(obs.group.userData.survivalWitness.length > 0, `${mode}: accepted trains retain their temporal route proof`);
      }
      if (obs.isMoving && c.obstacles.filter(o => o.isMoving).length === 2) paired = true;
      if (!obs.group.userData.isTrain || seen.has(obs)) continue;
      const front = c.chunkZ + obs.group.position.z + (obs.group.userData.trainFrontOffset ?? obs.length! / 2);
      if (front < player.position.z) continue;
      seen.add(obs);
      if (obs.isMoving && !obs.telegraphed) continue;
      const kind = obs.isMoving ? 'moving' : 'static';
      // Simultaneous carriages/paired noses are one decision, not multiple hazards.
      if (time - last[kind] < 0.9) continue;
      last[kind] = time;
      stages[stage][kind]++;
      if (!obs.isMoving && obs.rampCollider) stages[stage].roofs++;
    }
    maxObjects = Math.max(maxObjects, objects);
  }
  off();
  assert.ok(minWarning >= 1.9, `${mode}: warning lead ${minWarning}`);
  assert.ok(stages.every(s => s.moving > 0), `${mode}: actual moving passes in every stage`);
  // Measured with this same seed, speed curve and pass-count method at 65e7d57.
  const baseline = mode === 'NORMAL' ? { static: 12, moving: 23 } : { static: 13, moving: 22 };
  for (const kind of ['static', 'moving'] as const) {
    assert.ok(stages.reduce((n, s) => n + s[kind], 0) >= baseline[kind] * 1.25, `${mode}: ${kind} encounters increase at least 25% over the same seeded baseline`);
  }
  assert.ok(stages.every(s => s.roofs > 0), `${mode}: usable ramp trains in all four stages`);
  assert.ok(patterns.size >= 5, `${mode}: varied train formations`);
  assert.ok(maxObjects <= 18, `${mode}: bounded active obstacle count`);
  results.push({ mode, stages: stages.map(s => ({ ...s, seconds: +s.seconds.toFixed(1),
    staticPerMin: +(s.static * 60 / s.seconds).toFixed(1), movingPerMin: +(s.moving * 60 / s.seconds).toFixed(1) })),
    minWarning: +minWarning.toFixed(2), maxObjects, paired, patterns: [...patterns], simulationMs: Math.round(performance.now() - start), metrics: track.getTrainEncounterMetrics() });
}
assert.ok(results.some(result => result.paired), 'A real paired express formation is accepted during calibration');
console.log = log;
for (const result of results) console.log(JSON.stringify(result));
console.log('VERDICT: PASS');
