import * as THREE from 'three';

/**
 * Historic Railway Quarter: The Grand Steam Age — Palette & Thematic Constants
 */
export const HISTORIC_QUARTER_PALETTE = {
  skyTop: 0x1e3a5f,              // Deep twilight sapphire sky
  skyBottom: 0xf5cba7,           // Warm peach-amber sunset horizon
  brickRedAged: 0x8b2500,        // Victorian weathered brick
  brickRedWarm: 0xa03622,        // Fired clay brickwork
  brickSootDark: 0x4a3b32,       // Industrial soot-weathered masonry
  sandstoneGolden: 0xd4a373,     // Chiseled ashlar sandstone
  sandstoneWarm: 0xc29263,       // Weathered stone plinths & cornices
  slateRoof: 0x334155,           // Slate tile mansard roof
  castIronDark: 0x1f1f1f,        // Blackened cast-iron columns & gantries
  castIronGrate: 0x2b2b2b,       // Wrought-iron railings & fire escapes
  brassPolished: 0xd4af37,       // Polished boiler fittings & station clocks
  timberDarkOak: 0x3e2723,       // Heavy railway sleepers & timber framing
  timberTeak: 0x4a2e18,          // Station benches & luggage carts
  creamSashFrame: 0xfffaed,      // Victorian sash window architraves
  creamLimestone: 0xf5f0e1,      // Carved stone keystones & balustrades
  copperVerdigris: 0x4d7c71,     // Weathered copper spires & lanterns
  gasLampWarmAmber: 0xf59e0b,    // Glowing incandescent gaslamp mantle
  canalWaterDeep: 0x1f4e5b,      // Atmospheric canal river surface
  steamWhite: 0xf8fafc,          // Puffing steam & locomotive exhaust
  awningCrimson: 0x8b1a1a,       // Striped market canopy
  awningHunterGreen: 0x1b4332    // Heritage merchant awning
};

export const HISTORIC_QUARTER_DISTRICTS = [
  { id: 'grand_station', name: 'Grand Historic Railway Station', theme: 'Vaulted Iron Canopies & Victorian Clock Terminus' },
  { id: 'town_center', name: 'Brick-and-Cobblestone Town Center', theme: 'Victorian Brownstones, Chimneys & Gaslights' },
  { id: 'market_street', name: 'Historic Market Streets', theme: 'Artisan Arcades, Canopies, Crates & Balconies' },
  { id: 'river_viaduct', name: 'River Viaduct & Canal Crossing', theme: 'Stone Arch Viaduct, Narrowboats & River Vista' },
  { id: 'restoration_depot', name: 'Steam Locomotive Restoration Depot', theme: 'Roundhouse Maintenance, Water Vats & Cranes' },
  { id: 'gaslit_square', name: 'Gaslit Evening Square', theme: 'Civic Plaza, Tiered Fountain & Skyline Panorama' }
] as const;

export type HistoricQuarterDistrictId = typeof HISTORIC_QUARTER_DISTRICTS[number]['id'];

export interface GrandSteamArrivalHeroActor {
  group: THREE.Group;
  locomotiveGroup: THREE.Group;
  connectingRods: THREE.Mesh[];
  drivingWheels: THREE.Group[];
  steamPuffPlumes: THREE.Mesh[];
  passengerFigures: THREE.Group[];
  platformGasLamps: THREE.Mesh[];
  triggerZ: number;
  initialTrainZ: number;
  targetStopZ: number;
  departZ: number;
  state: 'DORMANT' | 'ANTICIPATION' | 'ACTION' | 'CLIMAX' | 'AFTERMATH' | 'COMPLETE';
  timer: number;
  wheelAngle: number;
}

export interface HistoricViaductHeroActor {
  group: THREE.Group;
  canalBoatGroup: THREE.Group;
  boatChimneySteam: THREE.Mesh[];
  waterWakePlumes: THREE.Mesh[];
  distantSteamTrain: THREE.Group;
  distantTrainRods: THREE.Mesh[];
  bridgePedestrians: THREE.Group[];
  triggerZ: number;
  initialBoatZ: number;
  targetBoatZ: number;
  initialDistantTrainX: number;
  targetDistantTrainX: number;
  state: 'DORMANT' | 'ANTICIPATION' | 'ACTION' | 'CLIMAX' | 'AFTERMATH' | 'COMPLETE';
  timer: number;
}

export interface ChimneySteamEmitter {
  group: THREE.Group;
  steamMeshes: THREE.Mesh[];
  baseY: number;
  phaseOffset: number;
  speed: number;
}

export interface StationClockActor {
  group: THREE.Group;
  hourHand: THREE.Mesh;
  minuteHand: THREE.Mesh;
  faceDial: THREE.Mesh;
}

export interface RailwayWorkerActor {
  group: THREE.Group;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  signalLamp?: THREE.Mesh;
  animationType: 'FLAG_SIGNAL' | 'INSPECT_TRACK' | 'WAVE_DEPARTURE';
  timer: number;
}

export interface SwayingGasLampActor {
  group: THREE.Group;
  lantern: THREE.Object3D;
  baseZ?: number;
  swingSpeed: number;
  phaseOffset: number;
}
