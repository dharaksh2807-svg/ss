import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { TrackManager } from '../src/track/TrackManager';
import { TrackChunk } from '../src/track/TrackChunk';
import { Player } from '../src/player/Player';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { CONSTANTS } from '../src/core/Constants';
import { SpeedController } from '../src/core/SpeedController';

const storage = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => storage.set(k, String(v)), removeItem: (k: string) => storage.delete(k), clear: () => storage.clear() };
const report = console.log.bind(console);
console.log = () => {}; console.warn = () => {};
const bounds = [0, 300, 1200, 2500, 4500];
const names = ['early', 'middle', 'advanced', 'expert'];
const samples: any[] = [];
let counts = { attempts: 0, placements: 0, rejections: 0 };
const populate = TrackChunk.prototype.populate;
TrackChunk.prototype.populate = function (...args: Parameters<typeof populate>) {
  const pattern: any = args[0];
  const moving = pattern.obstacles?.some((o: any) => o.isMoving || o.type === 'MOVING_TRAIN');
  if (moving) counts.attempts++;
  const accepted = populate.apply(this, args);
  if (moving) accepted ? counts.placements++ : counts.rejections++;
  return accepted;
};
const manager = new TrackManager(new THREE.Scene());
const player = new Player();
player.isInvulnerable = () => true;
for (let index = 0; index < 12; index++) {
  const mode = index < 6 ? 'NORMAL' : 'HARD';
  const seed = 101 + index * 137;
  counts = { attempts: 0, placements: 0, rejections: 0 };
  const runnerCurve = new SpeedController(mode);
  player.reset(); player.setGameMode(mode);
  manager.setGameMode(mode); manager.setDebugSeed(seed); manager.reset();
  const stages = names.map((stage) => ({ stage, seconds: 0, encounters: 0, warnings: 0, speeds: [] as number[], gaps: [] as number[], lanes: [] as number[], patterns: [] as string[] }));
  const previous = new WeakMap<object, number>();
  const counted = new WeakSet<object>();
  let time = 0; let lastEncounter = 0; let firstEncounter: number | null = null;
  let minWarning = Infinity; let maxActive = 0; let intersections = 0; let pathConflicts = 0;
  let generationStamp = '';
  let previousActive = new Set<object>();
  let lostBeforeEncounter = 0;
  const committed = new WeakSet<object>();
  let committedPlacements = 0; let witnessedPlacements = 0;
  const roofs = new WeakSet<object>();
  let roofOpportunities = 0; let longestRoof = 0;
  const frameCosts: number[] = [];
  const off = EventBus.getInstance().on(EVENTS.TRAIN_HORN, (data: any) => {
    const stage = Math.min(3, bounds.findIndex((b, i) => i < 4 && player.distanceTraveled >= b && player.distanceTraveled < bounds[i + 1]));
    if (stage >= 0) stages[stage].warnings++;
    minWarning = Math.min(minWarning, data.timeToImpact);
  });
  const started = performance.now();
  while (player.distanceTraveled < 4500) {
    const dt = 0.08;
    const stage = bounds.findIndex((b, i) => i < 4 && player.distanceTraveled >= b && player.distanceTraveled < bounds[i + 1]);
    stages[stage].seconds += dt;
    player.speed = runnerCurve.update(dt, player.distanceTraveled);
    // Hold the controlled ground-runner model; exercise roofs/power-ups separately.
    player.position.y = CONSTANTS.PLAYER_BASE_Y;
    player.setSupportSurface('GROUND', null);
    player.state = 'RUN';
    for (const chunk of manager.chunks) for (const collectible of chunk.collectibles) collectible.active = false;
    player.previousPosition.copy(player.position);
    player.position.z -= player.speed * dt;
    player.distanceTraveled = -player.position.z;
    player.updateCollider();
    time += dt;
    const frameStart = performance.now();
    manager.update(player, dt, time);
    frameCosts.push(performance.now() - frameStart);
    const stamp = manager.chunks.map((chunk) => chunk.chunkZ).join(',');
    if (stamp !== generationStamp) {
      generationStamp = stamp;
      pathConflicts += manager.chunks.filter((chunk) => chunk.hasMovingTrainPathConflict(manager.chunks)).length;
    }
    const obstacles = manager.chunks.flatMap(c => c.obstacles.filter(o => o.active));
    for (const obs of obstacles) if (!obs.isMoving && obs.rampCollider && !roofs.has(obs)) {
      roofs.add(obs); roofOpportunities++; longestRoof = Math.max(longestRoof, obs.length ?? 0);
    }
    let active = 0;
    const currentActive = new Set(obstacles.filter((obs) => obs.isMoving));
    for (const old of previousActive) if (!currentActive.has(old as any) && !counted.has(old)) lostBeforeEncounter++;
    previousActive = currentActive;
    for (const obs of obstacles) {
      if (!obs.isMoving) continue;
      active++;
      if (!committed.has(obs)) {
        committed.add(obs); committedPlacements++;
        if (obs.group.userData.survivalWitness?.length) witnessedPlacements++;
      }
      const separation = player.position.z - obs.frontBumperCollider!.max.z;
      const old = previous.get(obs);
      if (old !== undefined && old > 0 && separation <= 0 && obs.telegraphed && !counted.has(obs)) {
        counted.add(obs);
        stages[stage].encounters++;
        stages[stage].speeds.push(obs.velocityZ!);
        stages[stage].lanes.push(obs.lane);
        stages[stage].patterns.push(obs.group.userData.sourcePattern ?? 'BASELINE');
        stages[stage].gaps.push(time - lastEncounter);
        lastEncounter = time;
        firstEncounter ??= time;
      }
      previous.set(obs, separation);
      for (const other of obstacles) {
        if (other === obs || other.type.startsWith('ROOFTOP')) continue;
        if (obs.collider.intersectsBox(other.collider)) intersections++;
      }
    }
    maxActive = Math.max(maxActive, active);
  }
  off();
  const stats = (manager as any).getTrainEncounterMetrics?.();
  frameCosts.sort((a, b) => a - b);
  const sample = { seed, mode, ...counts, committedPlacements, witnessedPlacements, roofOpportunities, longestRoof, firstEncounter, minWarning, maxActive, intersections, pathConflicts, lostBeforeEncounter,
    frameCost: { mean: frameCosts.reduce((a, b) => a + b, 0) / frameCosts.length,
      p95: frameCosts[Math.floor(frameCosts.length * .95)], p99: frameCosts[Math.floor(frameCosts.length * .99)], max: frameCosts.at(-1) },
    simulationMilliseconds: performance.now() - started, stats, stages };
  samples.push(sample);
  report(JSON.stringify({ seed, mode, ...counts, epm: stages.map(s => +(s.encounters * 60 / s.seconds).toFixed(2)), maxGap: Math.max(...stages.flatMap(s => s.gaps)).toFixed(2) }));
}
const summary = ['NORMAL', 'HARD'].map(mode => ({ mode, stages: names.map((stage, i) => {
  const group = samples.filter(s => s.mode === mode).map(s => s.stages[i]);
  const gaps = group.flatMap(s => s.gaps).sort((a, b) => a - b);
  const speeds = group.flatMap(s => s.speeds);
  return { stage, epm: group.reduce((n, s) => n + s.encounters, 0) * 60 / group.reduce((n, s) => n + s.seconds, 0),
    meanGap: gaps.reduce((a, b) => a + b, 0) / gaps.length, maxGap: Math.max(...gaps), p95Gap: gaps[Math.floor(gaps.length * .95)],
    speedRange: [Math.min(...speeds), Math.max(...speeds)], lanes: [...new Set(group.flatMap(s => s.lanes))].sort() };
}) }));
const output = { definition: 'A warned moving train front crosses the runner plane. Controlled ground runner uses the actual SpeedController; invulnerability prevents sampling termination; collectibles and support carry are excluded from this pacing measurement.', dt: .08, seeds: 12, modes: 2, summary, samples };
fs.writeFileSync(process.env.RUSH_SAMPLE_OUTPUT || '/tmp/railway-rush-sample.json', JSON.stringify(output, null, 2));
report(JSON.stringify(summary, null, 2));

if (process.env.RUSH_VERIFY === '1') {
  const limits = [[4, 6], [7, 10.25], [10, 14], [12, 16]];
  for (const mode of summary) for (const [index, stage] of mode.stages.entries()) {
    assert.ok(stage.epm >= limits[index][0] && stage.epm <= limits[index][1], `${mode.mode} ${stage.stage}: density ${stage.epm}`);
    assert.ok(stage.maxGap <= [14, 11, 9, 8][index], `${mode.mode} ${stage.stage}: excessive gap ${stage.maxGap}`);
  }
  assert.ok(samples.every(s => s.lostBeforeEncounter === 0), 'No committed trains disappear before an encounter');
  assert.ok(samples.every(s => s.intersections === 0 && s.pathConflicts === 0), 'No discrete or continuous physical conflicts');
  assert.ok(samples.every(s => s.committedPlacements === s.witnessedPlacements), 'Every committed train has a control witness');
  assert.ok(samples.every(s => new Set(s.stages.flatMap(stage => stage.patterns)).size >= 4), 'Train templates vary throughout each seeded run');
  assert.ok(samples.every(s => new Set(s.stages.flatMap(stage => stage.lanes)).size === 3), 'All three lanes participate over progression');
  assert.ok(samples.every(s => s.minWarning >= 1.9), 'Warnings preserve at least 1.9 seconds');
  assert.ok(samples.every(s => s.firstEncounter !== null && s.firstEncounter <= 14), 'All seeds encounter a train early');
  assert.ok(samples.every(s => s.roofOpportunities > 0 && s.longestRoof >= 52), 'Each run retains meaningful ramp and long-roof opportunities');
  for (const mode of ['NORMAL', 'HARD']) assert.ok(samples.filter(s => s.mode === mode).some(s => s.stats.expressEncounters > 0), `${mode} exercises Express Rush`);
  report('PASS: 12-seed encounter pacing, motion witnesses, warning timing, Express Rush and occupancy assertions');
}
