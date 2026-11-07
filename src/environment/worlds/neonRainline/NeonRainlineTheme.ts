import * as THREE from 'three';
import { NEON_RAINLINE_THEME, EnvironmentTheme } from '../../EnvironmentConfig';

export { NEON_RAINLINE_THEME };

/**
 * Curated Cyberpunk Color Harmony & District Color Tiers
 * Grounded in midnight obsidian navy with controlled cyan/magenta/violet/amber accents
 */
export const NEON_PALETTE = {
  // Master Architecture
  midnightObsidian: 0x070c18,
  wetAlloyCharcoal: 0x0d1424,
  structuralTitanium: 0x162238,
  rainStreakedAsphalt: 0x05070d,
  reflectiveGlassDark: 0x0a1628,

  // Electric Core Accents
  electricCyan: 0x00f5ff,
  hotMagenta: 0xf026d3,
  deepViolet: 0x8b5cf6,
  plasmaPink: 0xec4899,
  lunarWhite: 0xf0fdf4,

  // District Accents
  marketAmber: 0xf59e0b,
  marketCrimson: 0xef4444,
  highwayAzure: 0x38bdf8,
  waterfrontTeal: 0x14b8a6,
  quantumIcyBlue: 0x67e8f9,
  quantumViolet: 0xa855f7,
  gardenEmerald: 0x10b981,
  gardenMint: 0x34d399,
  industrialOrange: 0xf97316,
  industrialRustRed: 0xb91c1c,
  terminalCoolWhite: 0xe0e7ff,
  terminalPurple: 0x7c3aed
} as const;

/**
 * Submersible / High-Speed Cyberpunk Train Livery
 */
export const NEON_RAINLINE_TRAIN_LIVERY = {
  bodyColor: 0x091024,
  roofColor: 0x0f1b34,
  accentCyan: 0x00f5ff,
  accentMagenta: 0xf026d3,
  catwalkSurfaceY: 4.35
} as const;

/**
 * 8 Distinct Landscape Types (Deterministic Macro-Neighborhoods)
 */
export const NEON_RAINLINE_DISTRICTS = [
  { id: 'skyscraper_canyon', name: 'Dense Cyberpunk Skyscraper Canyon', theme: 'Towering Stepped Facades, Holographic Fins & Exterior Elevators' },
  { id: 'open_neon_plaza', name: 'Huge Open Neon Plaza', theme: 'Expansive 160m-240m Open Setback, Wet Tile Mosaics, Hero Event B: Plaza Awakens' },
  { id: 'street_market', name: 'Futuristic Street Market', theme: 'Luminous Fabric Awnings, Digital Lanterns, Street-Vending Bots & Food Stalls' },
  { id: 'aerial_highway', name: 'Multilevel Aerial Highway', theme: 'Curved Skyway Viaducts (Y=14m/22m), Hero Event A: Air-Traffic Ballet' },
  { id: 'neon_waterfront', name: 'Neon Waterfront & Marina', theme: 'Open Canal Basin (X>=14m), Reflective Water Surface & Moving Water Taxis' },
  { id: 'rooftop_gardens', name: 'Rooftop Gardens & Hanging Parks', theme: 'Bioluminescent Cyber Trees, Stepped Eco-Terraces & Geodesic Domes' },
  { id: 'robotics_research', name: 'Advanced Robotics & Quantum District', theme: 'Angular Research Pavilions, Clean White LEDs & Holographic Containment' },
  { id: 'railway_interchange', name: 'Grand Futuristic Railway Interchange', theme: 'Multi-Tier Maglev Overpasses, Destination Matrix & Transit Pylons' }
] as const;

export type NeonRainlineDistrictId = typeof NEON_RAINLINE_DISTRICTS[number]['id'];

/**
 * Hover Vehicle Actor with 3D flight physics and dynamic banking
 */
export interface HoverCarActor {
  mesh: THREE.Group;
  cockpitGlass?: THREE.Mesh;
  engineGlow?: THREE.Mesh;
  lightTrail?: THREE.Mesh;
  basePos: THREE.Vector3;
  velocity: THREE.Vector3;
  bankAngle: number;
  flightPathRadius: number;
  flightPathSpeed: number;
  flightPhase: number;
  routeType?: number;
}

/**
 * Flagship Hero Event A: Air-Traffic Ballet
 * Multiple distinct flying vehicles enter vertical traffic corridors,
 * sweep between megacity towers, bank with realistic physical roll around
 * spires, and depart into the rainy skyline.
 */
export interface AirTrafficBalletActor {
  group: THREE.Group;
  vehicles: HoverCarActor[];
  triggerZ: number;
  state: 'DORMANT' | 'ANTICIPATION' | 'ACTION' | 'CLIMAX' | 'AFTERMATH' | 'COMPLETE';
  timer: number;
}

/**
 * Flagship Hero Event B: Futuristic Plaza Awakens
 * The runner enters a vast open plaza where a monumental holographic
 * kinetic sculpture activates: gyroscopic concentric rings rotate, the central
 * core rises $8.5m, surrounding building facades harmonize their lighting,
 * and ground pedestrian automatons gather.
 */
export interface FuturisticPlazaAwakeningActor {
  group: THREE.Group;
  coreSculpture: THREE.Mesh;
  innerRing: THREE.Mesh;
  outerRing: THREE.Mesh;
  holographicPanels: THREE.Mesh[];
  perimeterLamps: { mesh: THREE.Mesh; active: boolean }[];
  pedestrianBots: THREE.Group[];
  triggerZ: number;
  state: 'DORMANT' | 'ANTICIPATION' | 'ACTION' | 'CLIMAX' | 'AFTERMATH' | 'COMPLETE';
  timer: number;
  powerLevel: number;
}

/**
 * Dual High-Speed Maglev Express Crossover
 */
export interface MaglevTrainActor {
  group: THREE.Group;
  trainUpper: THREE.Group;
  trainLower: THREE.Group;
  upperUndercarriageGlow: THREE.Mesh;
  lowerUndercarriageGlow: THREE.Mesh;
  triggerZ: number;
  state: 'APPROACHING' | 'CROSSING_OVERHEAD' | 'RECEDING' | 'COMPLETE';
  timer: number;
}

/**
 * Controlled Technology Blackout & Cascading Restore
 */
export interface TechBlackoutActor {
  group: THREE.Group;
  affectedDistrictMeshes: THREE.Mesh[];
  emergencyBeacons: THREE.Mesh[];
  reactorCore: THREE.Mesh;
  triggerZ: number;
  state: 'NORMAL' | 'BLACKOUT_DROP' | 'EMERGENCY_PULSE' | 'CASCADE_RESTORE' | 'COMPLETE';
  timer: number;
}

/**
 * Ambient Drone Show Actor
 */
export interface DroneShowActor {
  group: THREE.Group;
  drones: Array<{ mesh: THREE.Mesh; baseOffset: THREE.Vector3; orbitPhase: number }>;
  triggerZ: number;
  state: 'HOVER_PLAZA' | 'CONSTELLATION_FORM' | 'SPIRAL_ROTATION' | 'DISPERSE' | 'COMPLETE';
  timer: number;
}

/**
 * Telescopic Skybridge Actor
 */
export interface SkybridgeTransformActor {
  group: THREE.Group;
  leftSection: THREE.Mesh;
  rightSection: THREE.Mesh;
  centerSpan: THREE.Mesh;
  serviceBots: THREE.Mesh[];
  triggerZ: number;
  state: 'RETRACTED' | 'EXTENDING' | 'FULL_SPAN' | 'ACTIVE_TRANSIT' | 'COMPLETE';
  timer: number;
}

/**
 * Rainstorm & Atmospheric Lightning
 */
export interface CityStormActor {
  group: THREE.Group;
  lightningPlanes: THREE.Mesh[];
  triggerZ: number;
  state: 'CLEARING' | 'GATHERING_STORM' | 'PEAK_PRECIPITATION' | 'LIGHTNING_PULSE' | 'CALMING';
  timer: number;
}

/**
 * Ambient City Ecosystem Actors
 */
export interface AmbientCityLife {
  flyingCars: Array<{ mesh: THREE.Group; startX: number; endX: number; y: number; z: number; speed: number; dir: number }>;
  deliveryDrones: Array<{ mesh: THREE.Group; center: THREE.Vector3; radius: number; freq: number; phase: number; rotors: THREE.Mesh[] }>;
  waterTaxis: Array<{ mesh: THREE.Group; canalZ: number; speed: number; minZ: number; maxZ: number }>;
  industrialCranes: Array<{ arm: THREE.Object3D; cable: THREE.Object3D; phase: number; speed: number }>;
  glassElevators: Array<{ mesh: THREE.Group; minY: number; maxY: number; speed: number; curY: number; dir: number }>;
  swayingHoloBanners: Array<{ mesh: THREE.Mesh; phase: number; freq: number }>;
  bioluminescentTrees: Array<{ canopy: THREE.Mesh; pulsePhase: number }>;
}
