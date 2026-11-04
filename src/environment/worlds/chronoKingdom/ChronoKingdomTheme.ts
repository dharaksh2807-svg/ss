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
    'MIDNIGHT_VELVET'
  ],
  sky: {
    top: 0x071126,    // Celestial midnight sapphire
    bottom: 0x3d1d11 // Deep bronze and warm furnace twilight glow on the horizon
  },
  fog: {
    color: 0x1c1719,  // Atmospheric bronze steam haze
    density: 0.0016   // Subtle haze that maintains crisp obstacle visibility
  },
  sun: {
    color: 0xffdf99,  // Warm golden celestial spotlight
    intensity: 1.35,
    position: { x: -35, y: 80, z: -45 }
  },
  fill: {
    color: 0x1e1b4b,  // Deep twilight fill shadow
    intensity: 0.60
  },
  hemi: {
    sky: 0x1e293b,    // Midnight sky reflection
    ground: 0xb45309, // Warm burnished copper & furnace bounce light
    intensity: 1.15
  },
  skyline: {
    color: 0x13121d,  // Silhouette of colossal clock towers and spires
    opacity: 0.90,
    style: 'HISTORIC'
  },
  clouds: {
    color: 0x2a1d24,  // Rich steam-infused dusk clouds
    roughness: 0.88
  },
  materials: {
    ballastColor: 0x241a14,     // Dark ironstone and crushed slag ballast
    sleeperColor: 0x18110b,     // Steamed dark oak ties with brass fastener plates
    wallBaseColor: 0x261912,    // Heavy riveted bronze & cast-iron masonry
    wallAccentColor: 0xd4af37,  // Gilded antique gold clockwork filigree & gear rings
    curbColor: 0xf59e0b,        // Bright polished bronze & warm amber curb (high visibility!)
    catenaryColor: 0x92400e,    // Riveted brass truss arches
    insulatorColor: 0xfbbf24,   // Amber glass electrical insulators
    pipeColor: 0xb87333,        // Burnished copper steam conduits with brass joint flanges
    bridgeMainColor: 0x382317,  // Heavy riveted bronze and iron viaduct trestles
    bridgeAccentColor: 0xc5a059,// Antique gold mechanical lattice
    groundPlaneColor: 0x0c0b12
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
