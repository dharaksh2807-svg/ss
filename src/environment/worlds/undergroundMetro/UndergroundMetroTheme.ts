import * as THREE from 'three';

/**
 * Underground Metro: The Living Subterranean Network — Palette & Thematic Constants
 */
export const UNDERGROUND_METRO_PALETTE = {
  wallGlazedWhite: 0xf1f5f9,      // Pristine subway ceramic tile
  wallParisBevel: 0xe2e8f0,       // Beveled subway tile finish
  wallMosaicTeal: 0x0e7490,       // Station mosaic tile band (Teal Line)
  wallMosaicAmber: 0xb45309,      // Station mosaic tile band (Amber Line)
  tunnelBasaltDark: 0x0f172a,     // Deep unlit tunnel bedrock / soot
  concreteTunnelGrey: 0x334155,   // Precast concrete vaulting rings
  concretePlatform: 0x64748b,     // Terrazzo passenger platform slab
  steelFrame: 0x475569,           // Structural column flanges & beams
  castIronRib: 0x1e293b,          // Heavy arched cross-girders
  warningAmber: 0xffab00,         // Tactile platform edge hazard strip (0xffab00)
  signalRed: 0xef4444,            // Subway aspect signal red beacon
  signalAmber: 0xf59e0b,          // Subway aspect signal caution amber
  signalGreen: 0x10b981,          // Subway aspect signal clear green
  fluorescentDaylight: 0xe0f2fe,  // Overhead high-output luminaire glow
  fluorescentWarm: 0xffedd5,      // Warm incandescent station cove glow
  emergencyRedGlow: 0xdc2626,     // Auxiliary backup lamp filament
  bronzeAccent: 0xd97706,         // Polished brass clock rims & handrails
  teakWood: 0x78350f,             // Polished station platform benches
  displayMatrixGreen: 0x22c55e,   // Phosphor LED destination matrix board
  waterAqueduct: 0x164e63,        // Subterranean storm drainage channel
  glassClear: 0xbae6fd            // Architectural balustrade safety glass
};

export const UNDERGROUND_METRO_DISTRICTS = [
  { id: 'grand_concourse', name: 'Grand Central Concourse', theme: 'Vaulted Cathedral Ribs, Departure Displays & Hero Event A' },
  { id: 'neighborhood_platform', name: 'Neighborhood Platform with Tile Murals', theme: 'Glazed Ceramic Mosaic Walls, Posters & Teak Benches' },
  { id: 'glass_interchange', name: 'Modern Glass Interchange', theme: 'Aerodynamic Steel Pylons, Glass Balustrades & Skywalks' },
  { id: 'maintenance_tunnel', name: 'Industrial Maintenance Tunnel', theme: 'Segmental Concrete Rings, Pipe Manifolds & Catwalks' },
  { id: 'utility_crossing', name: 'Underground River & Utility Crossing', theme: 'Storm Flood Gates, Drainage Aqueducts & Hero Event B' },
  { id: 'multilevel_transfer', name: 'Massive Multilevel Transfer Station', theme: 'Double-Height Mezzanines, Overhead Skybridges & Transit Pods' }
] as const;

export type UndergroundMetroDistrictId = typeof UNDERGROUND_METRO_DISTRICTS[number]['id'];

/**
 * Hero Event A: The Grand Concourse Reveal
 * A high-ceiling vaulted hall reveals a parallel express subway train
 * decelerating onto a dedicated service track, pneumatic doors hissing open,
 * passenger silhouettes stirring, destination matrix flipping, and departure.
 */
export interface GrandConcourseHeroActor {
  group: THREE.Group;
  trainGroup: THREE.Group;
  trainBogies: THREE.Group[];
  trainDoors: { left: THREE.Mesh; right: THREE.Mesh; openAmount: number }[];
  brakeSparks: THREE.Mesh[];
  departureMatrixBoard: THREE.Mesh;
  escalatorTreads: THREE.Mesh[];
  commuterCrowd: THREE.Group[];
  triggerZ: number;
  initialTrainZ: number;
  targetStopZ: number;
  departZ: number;
  state: 'DORMANT' | 'ANTICIPATION' | 'ACTION' | 'CLIMAX' | 'AFTERMATH' | 'COMPLETE';
  timer: number;
}

/**
 * Hero Event B: Power Restoration
 * A dark utility tunnel running on red emergency backup lamps sequentially
 * activates high-voltage relays, ignites ceiling luminaires in cascade,
 * powers up ventilation turbines, opens hydraulic flood gates, and illuminates
 * the cavern without obscuring gameplay hazards.
 */
export interface PowerRestorationHeroActor {
  group: THREE.Group;
  emergencyLamps: THREE.Mesh[];
  luminaireFixtures: { mesh: THREE.Mesh; zPos: number; active: boolean }[];
  floodGates: { leftGate: THREE.Group; rightGate: THREE.Group; openAmount: number }[];
  exhaustTurbines: { fanBlades: THREE.Mesh; rpm: number }[];
  transformerSparks: THREE.Mesh[];
  triggerZ: number;
  state: 'DORMANT' | 'ANTICIPATION' | 'ACTION' | 'CLIMAX' | 'AFTERMATH' | 'COMPLETE';
  timer: number;
  powerLevel: number;
}

/**
 * Ambient Subterranean Ventilation Exhaust Fan
 */
export interface VentilationFanActor {
  group: THREE.Group;
  blades: THREE.Mesh;
  rotationSpeed: number;
}

/**
 * Ambient Motorized Escalator with Moving Treads
 */
export interface EscalatorActor {
  group: THREE.Group;
  steps: THREE.Mesh[];
  speed: number;
  stepSpacing: number;
  inclineAngle: number;
}

/**
 * Ambient Flickering Fluorescent Tube Luminaire
 */
export interface FlickeringLightActor {
  mesh: THREE.Mesh;
  baseColor: number;
  flickerSpeed: number;
  phaseOffset: number;
}

/**
 * Ambient Platform Commuter Silhouette
 */
export interface PlatformCommuterActor {
  group: THREE.Group;
  head: THREE.Mesh;
  torso: THREE.Mesh;
  phoneGlow?: THREE.Mesh;
  animType: 'IDLE' | 'CHECK_PHONE' | 'WAIT';
  timer: number;
}

/**
 * Double-Sided Subterranean Station Clock
 */
export interface SubwayClockActor {
  group: THREE.Group;
  hourHand: THREE.Mesh;
  minuteHand: THREE.Mesh;
  dialFaceFront: THREE.Mesh;
  dialFaceBack: THREE.Mesh;
}
