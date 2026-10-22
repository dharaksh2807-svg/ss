import * as THREE from 'three';
import { ObstacleFactory, TrainVariant } from '../src/track/ObstacleFactory';
import { CONSTANTS } from '../src/core/Constants';
import { TrackManager } from '../src/track/TrackManager';
import { Player } from '../src/player/Player';

console.log('🧪 Starting Task 5 Train Visuals, Materials & Geometry Suite...\n');

let totalTests = 0;
let passedTests = 0;

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

const factory = new ObstacleFactory();

// =========================================================================
// Test 1: Instantiation of All 3 Distinct Variants
// =========================================================================
console.log('--- Test 1: Instantiation of All 3 Distinct Train Variants ---');
{
  const variants: TrainVariant[] = ['MODERN_METRO', 'CLASSIC_TRANSIT', 'STREAMLINED_EXPRESS'];

  variants.forEach((v) => {
    const train = factory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, CONSTANTS.COLORS.TRAIN_BODY_1, v);
    assert(train instanceof THREE.Group, `${v}: Creates valid THREE.Group`);
    assert(train.userData.isTrain === true, `${v}: userData.isTrain is true`);
    assert(train.userData.variant === v, `${v}: userData.variant matches requested variant`);
  });
}

// =========================================================================
// Test 2: Sculpted Carriage Hull Geometry (Not a Flat Box)
// =========================================================================
console.log('\n--- Test 2: Sculpted Extruded Carriage Hull Invariants ---');
{
  const train = factory.createTrain(20.0, false, CONSTANTS.COLORS.TRAIN_BODY_1, 'MODERN_METRO');
  
  // Find extruded hull mesh
  let hullMesh: THREE.Mesh | undefined;
  train.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry instanceof THREE.ExtrudeGeometry) {
      hullMesh = child;
    }
  });

  assert(hullMesh !== undefined, 'Carriage main body utilizes extruded curved profile geometry');
  assert(hullMesh!.castShadow === true, 'Carriage hull casts realistic shadows');
  assert(hullMesh!.receiveShadow === true, 'Carriage hull receives dynamic shadows');
}

// =========================================================================
// Test 3: Walkable Roof Elevation & Catwalk (Strictly Y = 4.35m)
// =========================================================================
console.log('\n--- Test 3: Walkable Roof Catwalk Invariants (Y = 4.35m) ---');
{
  const train = factory.createTrain(24.0, false, CONSTANTS.COLORS.TRAIN_BODY_2, 'STREAMLINED_EXPRESS');

  // Find catwalk mesh (positioned around 4.28m with height 0.14m -> top face at 4.35m)
  let catwalkMesh: THREE.Mesh | undefined;
  train.traverse((child) => {
    if (child instanceof THREE.Mesh && child.position.y >= 4.25 && child.position.y <= 4.30) {
      const geo = child.geometry;
      if (geo instanceof THREE.BoxGeometry && geo.parameters.width >= 1.5) {
        catwalkMesh = child;
      }
    }
  });

  assert(catwalkMesh !== undefined, 'Found dedicated central anti-slip roof catwalk');
  const boxGeo = catwalkMesh!.geometry as THREE.BoxGeometry;
  const topSurfaceY = catwalkMesh!.position.y + boxGeo.parameters.height * 0.5;
  assert(Math.abs(topSurfaceY - 4.35) < 0.01, `Catwalk top face sits precisely at 4.35m (got ${topSurfaceY.toFixed(2)}m)`);
}

// =========================================================================
// Test 4: Front Cab Elements (Headlights, Cowcatcher, Coupler, Destination Sign)
// =========================================================================
console.log('\n--- Test 4: Front Cab Geometric Detail Invariants ---');
{
  const train = factory.createTrain(20.0, false, CONSTANTS.COLORS.TRAIN_BODY_1, 'MODERN_METRO');

  let headlightCount = 0;
  let hasDestinationSign = false;
  let hasCoupler = false;
  let hasCowcatcher = false;

  train.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Check headlights
      if (child.material && (child.material as any).color && (child.material as any).color.getHex() === 0xfffae6) {
        headlightCount++;
      }
      // Check destination sign (above y = 3.3m)
      if (child.position.y > 3.3 && child.position.z > 8.0) {
        hasDestinationSign = true;
      }
      // Check front coupler (y ~ 0.42m, front nose)
      if (Math.abs(child.position.y - 0.42) < 0.05 && child.position.z > 10.0) {
        hasCoupler = true;
      }
      // Check cowcatcher wedge (y < 0.35m, front nose)
      if (child.position.y < 0.35 && child.position.z > 9.5) {
        hasCowcatcher = true;
      }
    }
  });

  assert(headlightCount >= 2, `Front cab equips dual high-intensity headlights (found ${headlightCount})`);
  assert(hasDestinationSign, 'Front cab integrates elevated transit route destination display');
  assert(hasCoupler, 'Front cab features central rail draft gear coupler knuckle');
  assert(hasCowcatcher, 'Front cab equips forward track debris cowcatcher / pilot wedge');
}

// =========================================================================
// Test 5: 3D Side Architecture (Window bays, frames, and passenger doors)
// =========================================================================
console.log('\n--- Test 5: 3D Side Window Frames & Passenger Door Geometry ---');
{
  const train = factory.createTrain(24.0, false, CONSTANTS.COLORS.TRAIN_BODY_3, 'CLASSIC_TRANSIT');

  let windowFrameCount = 0;
  let doorCount = 0;
  let flutingCount = 0;

  train.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Window frame at y ~ 2.65m on lateral sides
      if (Math.abs(child.position.y - 2.65) < 0.1 && Math.abs(child.position.x) > 1.3) {
        windowFrameCount++;
      }
      // Door portal at y ~ 1.7m on lateral sides
      if (Math.abs(child.position.y - 1.7) < 0.1 && Math.abs(child.position.x) > 1.3) {
        doorCount++;
      }
      // Stainless steel corrugated fluting on Classic Transit
      if (Math.abs(child.position.y - 1.3) < 0.1 && Math.abs(child.position.x) > 1.3) {
        flutingCount++;
      }
    }
  });

  assert(windowFrameCount >= 6, `Both sides feature recessed 3D window frames (found ${windowFrameCount})`);
  assert(doorCount >= 4, `Sides feature recessed passenger sliding door portals (found ${doorCount})`);
  assert(flutingCount >= 2, `Classic Transit equips iconic horizontal corrugated stainless-steel fluting (found ${flutingCount})`);
}

// =========================================================================
// Test 6: Wheel Bogies with Flanged Steel Rail Wheels & Underbody Modules
// =========================================================================
console.log('\n--- Test 6: Rail Wheel Bogie & Underbody Equipment Invariants ---');
{
  const train = factory.createTrain(20.0, false, CONSTANTS.COLORS.TRAIN_BODY_1, 'MODERN_METRO');

  let wheelTreadCount = 0;
  let wheelFlangeCount = 0;
  let axleCount = 0;
  let airTankCount = 0;

  train.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry instanceof THREE.CylinderGeometry) {
      const geo = child.geometry as THREE.CylinderGeometry;
      // Wheel tread: radius ~0.33, length ~0.12
      if (Math.abs(geo.parameters.radiusTop - 0.33) < 0.02) {
        wheelTreadCount++;
      }
      // Wheel flange: radius ~0.38, length ~0.04
      if (Math.abs(geo.parameters.radiusTop - 0.38) < 0.02) {
        wheelFlangeCount++;
      }
      // Axle bar: radius ~0.06, length > 1.5
      if (Math.abs(geo.parameters.radiusTop - 0.06) < 0.02 && geo.parameters.height > 1.5) {
        axleCount++;
      }
      // Air reservoir tanks: radius ~0.24, length > 2.0
      if (Math.abs(geo.parameters.radiusTop - 0.24) < 0.02 && geo.parameters.height > 2.0) {
        airTankCount++;
      }
    }
  });

  assert(wheelTreadCount === 8, `Dual bogies equip 8 steel rail wheel treads (found ${wheelTreadCount})`);
  assert(wheelFlangeCount === 8, `Every wheel features an inner track rail flange (found ${wheelFlangeCount})`);
  assert(axleCount === 4, `Bogies contain 4 solid steel axle assemblies (found ${axleCount})`);
  assert(airTankCount >= 2, `Underbody equips dual compressed air reservoir tanks (found ${airTankCount})`);
}

// =========================================================================
// Test 7: Rear Gangway Bellows & Twin Taillights
// =========================================================================
console.log('\n--- Test 7: Rear Carriage Gangway & Taillight Details ---');
{
  const train = factory.createTrain(20.0, false, CONSTANTS.COLORS.TRAIN_BODY_1, 'MODERN_METRO');

  let hasBellows = false;
  let taillightCount = 0;

  train.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Rear bellows at z < -9.5m, y ~ 1.8m
      if (child.position.z < -9.5 && Math.abs(child.position.y - 1.8) < 0.2) {
        hasBellows = true;
      }
      // Red taillights (color 0xff1744) at z < -9.5m
      if (child.position.z < -9.5 && child.material && (child.material as any).color && (child.material as any).color.getHex() === 0xff1744) {
        taillightCount++;
      }
    }
  });

  assert(hasBellows, 'Rear carriage equips pleated rubber gangway accordion bellows');
  assert(taillightCount === 2, `Rear carriage displays twin red warning taillights (found ${taillightCount})`);
}

// =========================================================================
// Test 8: Climbable Ramp Integration (hasRamp = true)
// =========================================================================
console.log('\n--- Test 8: Climbable Diamond-Plate Ramp Integration ---');
{
  const rampTrain = factory.createTrain(20.0, true, CONSTANTS.COLORS.TRAIN_BODY_1, 'MODERN_METRO');

  let hasRampMesh = false;
  let hasHazardSkirts = false;

  rampTrain.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Check for sloped ramp plate (rotation.x > 0.3)
      if (child.rotation.x > 0.3 && child.position.z > 10.0) {
        hasRampMesh = true;
      }
      // Check for safety skirts on ramp
      if (child.rotation.x > 0.3 && Math.abs(child.position.x) > 1.2) {
        hasHazardSkirts = true;
      }
    }
  });

  assert(hasRampMesh, 'Ramp train generates sloped diamond-plate climbable ramp');
  assert(hasHazardSkirts, 'Ramp equips yellow/black caution hazard skirts along sides');
}

// =========================================================================
// Test 9: Moving Train Dynamic Telegraph Compatibility
// =========================================================================
console.log('\n--- Test 9: Moving Train Telegraph Flashing Compatibility ---');
{
  const movingData = factory.createMovingTrain(22.0, CONSTANTS.COLORS.TRAIN_BODY_2);
  assert(movingData.group instanceof THREE.Group, 'Moving train returns valid THREE.Group');
  assert(movingData.headlights.length >= 2, `Moving train successfully extracts headlights for telegraphing (found ${movingData.headlights.length})`);
  assert(movingData.group.userData.isMoving === true, 'Moving train userData.isMoving is true');
  assert(movingData.group.userData.type === 'MOVING_TRAIN', 'Moving train userData.type is MOVING_TRAIN');
}

// =========================================================================
// Test 10: Automatic Variant Cycling Across Track Chunks
// =========================================================================
console.log('\n--- Test 10: Automatic Multi-Variant Spawning Across Chunks ---');
{
  const spawnedVariants = new Set<string>();

  // Spawn trains through factory without specifying variant to test natural cycling
  for (let i = 0; i < 6; i++) {
    const train = factory.createTrain(20.0, false);
    if (train.userData.variant) {
      spawnedVariants.add(train.userData.variant);
    }
  }

  console.log(`Observed train variants spawned: ${Array.from(spawnedVariants).join(', ')}`);
  assert(spawnedVariants.size === 3, `All 3 distinct train variants naturally cycle through factory (found ${spawnedVariants.size})`);
}

console.log('\n=======================================================');
console.log(`🎉 ALL ${passedTests} / ${totalTests} TASK 5 TRAIN MODELING TESTS PASSED!`);
console.log('=======================================================\n');
