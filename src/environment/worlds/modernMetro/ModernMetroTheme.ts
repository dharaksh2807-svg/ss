import * as THREE from 'three';

/**
 * Modern Metro: The Living City — Visual Palette & Thematic Constants
 */
export const MODERN_METRO_PALETTE = {
  skyTop: 0x1e3a5f,            // Crisp azure daytime sky top
  skyBottom: 0xc8e6f5,         // Luminous modern horizon atmospheric haze
  glassCyan: 0x00e5ff,         // High-tech glass tower curtain wall
  glassDeepBlue: 0x0f2b48,     // Tinted structural architectural glazing
  steelChrome: 0x94a3b8,       // Brushed architectural stainless steel
  steelDark: 0x334155,         // Charcoal structural steel frames & catenaries
  concreteWhite: 0xf1f5f9,     // Architectural pristine white precast panels
  concreteLimestone: 0xe2e8f0, // Warm honed limestone facade cladding
  concreteDark: 0x1e293b,      // Heavy retaining walls & viaduct piers
  asphaltStreet: 0x0f172a,     // Cross-street asphalt pavement
  storefrontBronze: 0x78350f,  // Anodized bronze storefront frames
  awningCrimson: 0xb91c1c,     // Cafe canopy canvas
  awningNavy: 0x1e3a8a,        // Commercial boutique awning
  teakDecking: 0xa16207,       // Commuter bench & rooftop garden decking
  foliageEmerald: 0x15803d,    // Lush street trees & landscaped planters
  ferryWhite: 0xffffff,        // Passenger catamaran hull
  ferryNavy: 0x0369a1,         // Maritime livery accent
  safetyAmber: 0xf59e0b,       // Platform edge tactile paving & transit beacons
  signalRed: 0xef4444,         // Train taillights & aviation spire beacons
  signalGreen: 0x10b981        // Traffic signals & transit clearance lamps
};

export const MODERN_METRO_DISTRICTS = [
  { id: 'cbd_skyscrapers', name: 'Central Business District', theme: 'Glass Stepped Towers & Facade Elevators' },
  { id: 'residential_boulevard', name: 'Residential Boulevard', theme: 'Tree-lined Terraces, Balconies & Artisan Shops' },
  { id: 'riverside_waterfront', name: 'Riverside Waterfront', theme: 'Open River Panorama, Ferries & Suspension Bridges' },
  { id: 'grand_interchange', name: 'Grand Modern Interchange', theme: 'Hero Transit Hub & Commuter Arrival' },
  { id: 'shopping_plaza', name: 'Shopping & Cafe Plaza', theme: 'Pedestrian Promenades, Cafes & Public Art' },
  { id: 'elevated_skyline', name: 'Elevated Skyline Overlook', theme: 'Rooftop Viaduct, City Views & Riverside Reveal' }
] as const;

export type ModernMetroDistrictId = typeof MODERN_METRO_DISTRICTS[number]['id'];
