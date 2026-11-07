import * as THREE from 'three';

/**
 * Neon Industrial: The Mechanical Logistics City — Palette & Thematic Constants
 */
export const NEON_INDUSTRIAL_PALETTE = {
  // Heavy Structural Metals
  industrialSteel: 0x334155,        // Weathered structural steel beams & columns
  castIron: 0x1e293b,               // Heavy machinery beds, counterweights & bases
  rustPrimer: 0x991b1b,             // Oxidized red primer on steel trusses
  galvanizedTruss: 0x64748b,        // Crane booms, pipe bridges & catwalk gratings
  corrugatedSheet: 0x475569,        // Industrial factory wall siding & cladding
  weatheredSteelPlate: 0x3f3f46,    // Floor plates & heavy equipment housings

  // Safety & Operational Markers
  hazardAmber: 0xffab00,            // OSHA caution stripe & beacon amber
  safetyYellow: 0xeab308,           // Crane spreader hooks & floor boundary lines
  warningRed: 0xef4444,             // Clearance limits & overhead obstruction beacons
  clearanceGreen: 0x10b981,         // Switch indicator aspect clear green

  // High-Bay & Process Illumination
  sodiumLamp: 0xffb300,             // Monochromatic high-pressure sodium floodlight
  sodiumLampWarm: 0xffd54f,         // Low-bay incandescent task light
  weldingArcBlue: 0x38bdf8,         // High-energy electric arc welding flash
  neonCyanWayfinding: 0x06b6d4,     // Modern terminal bay signage & bay numbers
  flareFlameAmber: 0xf97316,        // High-altitude refinery flare stack flame

  // Foundations & Civil Engineering
  concreteFoundation: 0x475569,     // Board-formed heavy concrete foundations & retaining plinths
  crushedBasaltBallast: 0x1f2937,   // Trackbed crushed ballast
  diamondPlateSteel: 0x52525b,      // Raised diamond tread catwalks

  // Fluid & Material Logistics
  pipeRust: 0xd84315,               // High-pressure steam pipe manifold
  pipeGasSilver: 0x94a3b8,          // Natural gas & petroleum transfer pipe
  hortonSphereSilver: 0xa1a1aa,     // Pressurized spherical gas storage vessel

  // Intermodal Freight ISO Shipping Containers
  containerMaritimeBlue: 0x1d4ed8,   // Standard 40ft maritime shipping container
  containerCargoCrimson: 0xb91c1c,  // Standard 20ft cargo container
  containerFreightGreen: 0x15803d,  // Standard 40ft refrigerated container
  containerIntermodalOrange: 0xea580c,// Intermodal overland container
  containerHighCubeYellow: 0xca8a04,// High-cube container
  containerLogisticsWhite: 0xf1f5f9 // Clean refrigerated container
};

export const NEON_INDUSTRIAL_DISTRICTS = [
  { id: 'container_terminal', name: 'Container-Freight Terminal', theme: 'Towering RMG Cranes, ISO Container Stacks & Hero Event A' },
  { id: 'heavy_engineering', name: 'Heavy Engineering Factory', theme: 'Open Manufacturing Sheds, Hydraulic Stamping Presses & Robotic Welders' },
  { id: 'railway_depot', name: 'Railway Repair Depot', theme: 'Inspection Tracks, Mechanical Screw Jacks & Idling Switchers' },
  { id: 'refinery_infrastructure', name: 'Oil & Refinery Infrastructure Zone', theme: 'Spherical Horton Tanks, Distillation Columns & Pipe Bridges' },
  { id: 'automated_port', name: 'Automated Industrial Port', theme: 'Continuous Cargo Conveyors, Bulk Silos & Automated Guided Vehicles' },
  { id: 'freight_sorting_yard', name: 'Large Freight-Sorting Yard', theme: 'Classification Hump Yard, Dispatch Tower & Hero Event B' }
] as const;

export type NeonIndustrialDistrictId = typeof NEON_INDUSTRIAL_DISTRICTS[number]['id'];

/**
 * Hero Event A: Crane Ballet
 * Two towering rail-mounted gantry (RMG) cranes coordinate hoisting,
 * traversing, and transferring a 40ft ISO shipping container.
 * Hierarchical attachment: container is physically attached to spreader
 * (`spreader.add(container)`) to guarantee 100% synchronized movement.
 */
export interface CraneBalletHeroActor {
  group: THREE.Group;
  crane1: {
    gantryFrame: THREE.Group;
    trolley: THREE.Group;
    spreader: THREE.Group;
    cables: THREE.Mesh[];
    container: THREE.Group;
    warningStrobes: THREE.Mesh[];
  };
  crane2: {
    gantryFrame: THREE.Group;
    trolley: THREE.Group;
    spreader: THREE.Group;
    cables: THREE.Mesh[];
    container: THREE.Group;
    warningStrobes: THREE.Mesh[];
  };
  railFlatcar: THREE.Group;
  triggerZ: number;
  state: 'DORMANT' | 'ANTICIPATION' | 'ACTION' | 'CLIMAX' | 'AFTERMATH' | 'COMPLETE';
  timer: number;
  initialContainerY: number;
  targetLiftY: number;
  trolleyStartPos: number;
  trolleyTargetPos: number;
}

/**
 * Hero Event B: Factory Awakening
 * A silent, nocturnal heavy manufacturing yard undergoes causal sequential activation:
 * Substation power breakers snap shut -> cascading sodium vapor floodlights strike on ->
 * steam safety valves exhaust vertical plumes -> hydraulic stamping presses & welding robots
 * commence fabrication -> overhead parts conveyor starts rolling -> heavy industrial
 * diesel locomotive powers its headlights and departs on a parallel freight siding.
 */
export interface FactoryAwakeningHeroActor {
  group: THREE.Group;
  substationBreakers: THREE.Mesh[];
  floodlights: { mesh: THREE.Mesh; zPos: number; active: boolean }[];
  steamPuffers: { mesh: THREE.Mesh; initialY: number; initialScale: number }[];
  stampingPresses: { ram: THREE.Mesh; baseY: number; stroke: number }[];
  weldingRobots: { arm: THREE.Group; sparks: THREE.Points; active: boolean }[];
  conveyor: { belt: THREE.Mesh; crates: THREE.Mesh[] };
  locomotive: {
    trainGroup: THREE.Group;
    headlights: THREE.Mesh[];
    exhaustStack: THREE.Mesh;
    speed: number;
    currentZ: number;
  };
  triggerZ: number;
  state: 'DORMANT' | 'ANTICIPATION' | 'ACTION' | 'CLIMAX' | 'AFTERMATH' | 'COMPLETE';
  timer: number;
  powerLevel: number;
}

/**
 * Ambient Rail-Mounted Gantry (RMG) Crane Traversing on Yard Rails
 */
export interface TraversingCraneActor {
  group: THREE.Group;
  trolley: THREE.Group;
  spreader: THREE.Group;
  cables: THREE.Mesh[];
  minX: number;
  maxX: number;
  speed: number;
  phase: number;
}

/**
 * Ambient Multi-Axis Articulated Robotic Welding Arm
 */
export interface WeldingRobotActor {
  group: THREE.Group;
  shoulderJoint: THREE.Group;
  elbowJoint: THREE.Group;
  wristJoint: THREE.Group;
  sparks: THREE.Points;
  sparkPositions: Float32Array;
  sparkVelocities: Float32Array;
  phase: number;
  weldCycleTimer: number;
  isWelding: boolean;
}

/**
 * Ambient Heavy Hydraulic Stamping Press
 */
export interface StampingPressActor {
  group: THREE.Group;
  ram: THREE.Mesh;
  baseY: number;
  stroke: number;
  cycleSpeed: number;
  phase: number;
}

/**
 * Ambient Counterbalanced Industrial Forklift
 */
export interface ForkliftActor {
  group: THREE.Group;
  crate: THREE.Mesh;
  mast: THREE.Group;
  startZ: number;
  endZ: number;
  currentZ: number;
  speed: number;
  dir: number;
  pauseTimer: number;
}

/**
 * Ambient Continuous Truss Conveyor Belt Carrying Cargo
 */
export interface ConveyorBeltActor {
  group: THREE.Group;
  beltSurface: THREE.Mesh;
  crates: THREE.Mesh[];
  speed: number;
  length: number;
}

/**
 * Ambient Factory Exhaust Steam Chimney
 */
export interface SteamChimneyActor {
  group: THREE.Group;
  steamMesh: THREE.Mesh;
  baseY: number;
  riseSpeed: number;
  maxScale: number;
  cyclePhase: number;
}

/**
 * Ambient Diesel Yard Switcher Idling / Shunting on Siding
 */
export interface DieselSwitcherActor {
  group: THREE.Group;
  cabGlow: THREE.Mesh;
  headlight: THREE.Mesh;
  exhaustStack: THREE.Mesh;
  side: number;
  speed: number;
  baseZ: number;
  travelDistance: number;
  currentOffsetZ: number;
  dir: number;
}
