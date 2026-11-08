import * as THREE from 'three';
import type { EnvironmentTheme } from '../../EnvironmentConfig';

/**
 * CHRONO KINGDOM: THE CLOCKWORK EMPIRE
 * Visual Theme Specification
 * 
 * Aesthetic: Majestic Steampunk Fantasy & Imperial Clockwork
 * Palette: Deep Bronze, Antique Gold, Burnished Copper, and Midnight Blue
 */
export const CHRONO_KINGDOM_THEME: EnvironmentTheme = {
  id: 'CHRONO_KINGDOM' as any,
  displayName: 'Chrono Kingdom',
  subtitle: 'The Clockwork Empire',
  description: 'A colossal steampunk clockwork empire where steam-powered trains race through majestic mechanical cities of moving gears, golden towers, glowing furnaces, and celestial observatories.',
  badgeEmoji: '⚙️',
  accentColor: '#d4af37', // Antique Gold
  districtRange: {
    minLengthMeters: 550,
    maxLengthMeters: 800
  },
  allowedTransitions: [
    'MODERN_METRO',
    'HISTORIC_QUARTER',
    'UNDERGROUND_METRO',
    'NEON_INDUSTRIAL',
    'NEON_RAINLINE',
    'ORBITAL_HALO',
    'ABYSSAL_GLASSLINE',
    'DOOMSDAY_LAST_TRANSIT',
    'PHANTOM_LINE',
    'HAUNTED_CARNIVAL',
    'VIP_EXPRESS',
    'RAHULVERSE',
    'MIDNIGHT_VELVET',
    'INFERNO_EXPRESS',
    'JURASSIC_RUSH'
  ],
  sky: {
    top: 0x0a1324,    // Deep celestial twilight midnight sapphire (#0a1324)
    bottom: 0x221828  // Victorian twilight indigo/bronze-navy horizon (#221828)
  },
  fog: {
    color: 0x16131f,  // Atmospheric bronze-slate mist (#16131f)
    density: 0.0014   // Crystal clarity for monumental clock towers and mechanisms
  },
  sun: {
    color: 0xffeed8,  // Radiant warm champagne amber sunlight
    intensity: 1.85,
    position: { x: -26, y: 60, z: 24 } // Positioned above and behind player to light all facades and gears down-track
  },
  fill: {
    color: 0x8a4b28,  // Rich antique brass & burnished copper canyon fill
    intensity: 0.85
  },
  hemi: {
    sky: 0x2b3952,    // Cool midnight steel celestial ambient reflection
    ground: 0x9a5633, // Radiant burnished copper & warm amber clockwork floor bounce
    intensity: 1.45
  },
  skyline: {
    color: 0x161c2a,  // Chiseled silhouette of colossal clock towers and spires (#161c2a)
    opacity: 0.90,
    style: 'HISTORIC'
  },
  clouds: {
    color: 0x2d1c28,  // Rich steam-infused dusk clouds (#2d1c28)
    roughness: 0.88
  },
  materials: {
    ballastColor: 0x241a14,     // Dark ironstone and crushed slag ballast
    sleeperColor: 0x18110b,     // Steamed dark oak ties with brass fastener plates
    wallBaseColor: 0x261912,    // Heavy riveted bronze & cast-iron masonry
    wallAccentColor: 0xd4af37,  // Gilded antique gold clockwork filigree & gear rings
    curbColor: 0xb45309,        // Burnished copper & warm amber curb (harmonious with track)
    catenaryColor: 0x92400e,    // Riveted brass truss arches
    insulatorColor: 0xfbbf24,   // Amber glass electrical insulators
    pipeColor: 0xb87333,        // Burnished copper steam conduits with brass joint flanges
    bridgeMainColor: 0x382317,  // Heavy riveted bronze and iron viaduct trestles
    bridgeAccentColor: 0xc5a059,// Antique gold mechanical lattice
    groundPlaneColor: 0x192334  // Midnight steel foundation
  },
  ambience: {
    baseToneFreq: 78,
    windNoiseFilter: 340,
    humGain: 0.045,
    tag: 'CHRONO_KINGDOM_CLOCKWORK'
  }
};

/**
 * Visual Livery Specification for Chrono Kingdom Trains
 */
export const CHRONO_KINGDOM_TRAIN_LIVERY = {
  primaryColors: [0x2b1810, 0xb87333, 0x1a2332], // Imperial Cast Bronze, Burnished Copper, Midnight Steel
  accentColor: 0xd4af37, // Polished Antique Gold
  windowGlowColor: 0xfbbf24, // Warm Amber Luminescence
  pipeTrimColor: 0xc87533, // Copper Steam Vent Pipes
  wheelCapColor: 0xd4af37, // Gold Gear Rim Cap
  roughness: 0.32,
  metalness: 0.82
} as const;

/**
 * Standalone Integration Hook:
 * Can be safely called by ObstacleFactory or an integration layer to style
 * any train carriage with Chrono Kingdom clockwork aesthetic without modifying
 * core game systems.
 */
export function applyChronoKingdomTrainLivery(
  trainGroup: THREE.Group,
  carriageIndex: number = 0
): void {
  const livery = CHRONO_KINGDOM_TRAIN_LIVERY;
  const carColor = livery.primaryColors[carriageIndex % livery.primaryColors.length];

  trainGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.name.includes('body') || child.name.includes('car')) {
        child.material = new THREE.MeshStandardMaterial({
          color: carColor,
          metalness: livery.metalness,
          roughness: livery.roughness
        });
      } else if (child.name.includes('window')) {
        child.material = new THREE.MeshBasicMaterial({
          color: livery.windowGlowColor
        });
      } else if (child.name.includes('accent') || child.name.includes('trim') || child.name.includes('cowling')) {
        child.material = new THREE.MeshStandardMaterial({
          color: livery.accentColor,
          metalness: 0.90,
          roughness: 0.25
        });
      }
    }
  });
}
