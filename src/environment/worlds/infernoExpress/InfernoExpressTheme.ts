import * as THREE from 'three';
import type { EnvironmentTheme } from '../../EnvironmentConfig';

/**
 * INFERNO EXPRESS: RAILS THROUGH HELLFIRE
 * Visual Theme Specification
 * 
 * Aesthetic: Dark Fantasy Volcanic Railway & Molten Magma Industrial Empire
 * Palette: Deep Crimson, Fiery Orange Magma, Black Obsidian, Scorched Iron, and Glowing Runes
 */
export const INFERNO_EXPRESS_THEME: EnvironmentTheme = {
  id: 'INFERNO_EXPRESS' as any,
  displayName: 'Inferno Express',
  subtitle: 'Rails Through Hellfire',
  description: 'An intense, spectacular fantasy volcanic railway world where trains race across lava oceans, obsidian fortresses, colossal magma cataracts, and glowing foundry machinery.',
  badgeEmoji: '🌋',
  accentColor: '#f97316', // Fiery Molten Orange
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
    'CHRONO_KINGDOM',
    'JURASSIC_RUSH'
  ],
  sky: {
    top: 0x0c0306,    // Deep atmospheric obsidian twilight void (#0c0306)
    bottom: 0x4a0e08 // Rich fiery volcanic crimson & molten twilight horizon glow (#4a0e08)
  },
  fog: {
    color: 0x160506,  // Atmospheric volcanic smoke & sulfur haze (#160506)
    density: 0.0014   // Crisp panoramic depth preserving sharp vistas of distant volcanoes
  },
  sun: {
    color: 0xff7a28,  // Radiant molten volcanic glare
    intensity: 1.95,
    position: { x: -28, y: 64, z: 28 } // Forward illumination highlighting obsidian facets & viaducts
  },
  fill: {
    color: 0x6a1610,  // Rich volcanic crimson fill light
    intensity: 1.05
  },
  hemi: {
    sky: 0x24080a,    // Smoky ember ash canopy bounce
    ground: 0xf97316, // Vibrant molten lava ocean upward reflection
    intensity: 1.65
  },
  skyline: {
    color: 0x160507,  // Silhouette of jagged volcanoes and obsidian towers
    opacity: 0.92,
    style: 'INDUSTRIAL'
  },
  clouds: {
    color: 0x3b1216,  // Boiling volcanic ash and smoke clouds
    roughness: 0.88
  },
  materials: {
    ballastColor: 0x27272a,     // Cooled porous basalt & obsidian gravel
    sleeperColor: 0x18181b,     // Fireproof carbonized iron railway ties
    wallBaseColor: 0x221310,    // Heavy volcanic basalt masonry & black iron
    wallAccentColor: 0xf97316,  // Glowing molten magma fissures & runic inscriptions
    curbColor: 0xfbbf24,        // Bright glowing lava channel curbs (extreme visibility!)
    catenaryColor: 0x451a03,    // Heat-treated cast iron catenary arches
    insulatorColor: 0xef4444,   // Heat-glowing ruby ceramic insulators
    pipeColor: 0x7c2d12,        // Scorched molten-magma transport pipes
    bridgeMainColor: 0x1c1917,  // Heavy black titanium-iron viaduct trestles
    bridgeAccentColor: 0xf97316,// Glowing runic bracket plates & fiery expansion joints
    groundPlaneColor: 0x0a0505
  },
  ambience: {
    baseToneFreq: 64,
    windNoiseFilter: 380,
    humGain: 0.05,
    tag: 'INFERNO_EXPRESS_HELLFIRE'
  }
};

/**
 * Visual Livery Specification for Inferno Express Trains
 */
export const INFERNO_EXPRESS_TRAIN_LIVERY = {
  primaryColors: [0x18181b, 0x0a0a0d, 0x27272a], // Armored Heat-Resistant Obsidian, Abyss Black, Scorched Steel
  accentColor: 0xf97316, // Molten Lava Orange
  furnaceCoreColor: 0xef4444, // Glowing Firebox Red
  windowGlowColor: 0xfbbf24, // Radiant Amber-Orange Heat Glow
  coolingFinColor: 0xc2410c, // Searing Bronze Cooling Flanges
  roughness: 0.38,
  metalness: 0.75
} as const;

/**
 * Standalone Integration Hook:
 * Can be safely called by ObstacleFactory or an integration layer to style
 * any train carriage with the Inferno Express volcanic aesthetic without modifying
 * core game systems.
 */
export function applyInfernoExpressTrainLivery(
  trainGroup: THREE.Group,
  carriageIndex: number = 0
): void {
  const livery = INFERNO_EXPRESS_TRAIN_LIVERY;
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
          emissive: 0x7c2d12,
          emissiveIntensity: 0.6,
          metalness: 0.85,
          roughness: 0.3
        });
      }
    }
  });
}
