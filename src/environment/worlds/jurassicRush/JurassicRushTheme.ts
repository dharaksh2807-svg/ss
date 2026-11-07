import * as THREE from 'three';
import type { EnvironmentTheme } from '../../EnvironmentConfig';

/**
 * JURASSIC RUSH: THE LOST WORLD RAILWAY
 * Visual Theme Specification
 * 
 * Aesthetic: Lush Prehistoric Jungle, Ancient Canyon Waterfalls, Lost World Megaliths & Dinosaurs
 * Palette: Emerald Canopy Green, Canyon Sandstone Ochre, Ancient Moss Basalt, and Golden Sun
 */
export const JURASSIC_RUSH_THEME: EnvironmentTheme = {
  id: 'JURASSIC_RUSH' as any,
  displayName: 'Jurassic Rush',
  subtitle: 'The Lost World Railway',
  description: 'An exhilarating prehistoric railway world filled with colossal dinosaurs, ancient jungle waterfalls, dramatic canyon gorges, mysterious megalithic ruins, and rugged expedition trains.',
  badgeEmoji: '🦖',
  accentColor: '#10b981', // Vibrant Prehistoric Emerald Green
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
    'INFERNO_EXPRESS'
  ],
  sky: {
    top: 0x0284c7,    // Vibrant Cretaceous tropical azure-cerulean sky
    bottom: 0x6ee7b7 // Luminous golden-emerald rainforest horizon mist
  },
  fog: {
    color: 0x0f4a3c,  // Atmospheric lush Cretaceous jungle mist
    density: 0.0016   // Crisp scenic depth with panoramic vistas of colossal dinosaurs
  },
  sun: {
    color: 0xfff8db,  // Radiant golden prehistoric morning sunlight
    intensity: 1.75,
    position: { x: -26, y: 58, z: 22 } // Illuminates down-track dinosaur faces and lush foliage
  },
  fill: {
    color: 0x065f46,  // Deep emerald rainforest canopy shadow fill
    intensity: 0.95
  },
  hemi: {
    sky: 0x38bdf8,    // Tropical azure sky bounce
    ground: 0x15803d, // Vibrant rainforest floor green reflection
    intensity: 1.45
  },
  skyline: {
    color: 0x064e3b,  // Towering prehistoric volcanic peaks and mist-shrouded mountain silhouettes
    opacity: 0.88,
    style: 'HISTORIC'
  },
  clouds: {
    color: 0x34d399,  // Humid jungle mist and mountain clouds
    roughness: 0.82
  },
  materials: {
    ballastColor: 0x374151,     // Crushed ancient riverbed gravel and mossy basalt
    sleeperColor: 0x292524,     // Weathered heavy petrified ironwood ties
    wallBaseColor: 0x27272a,    // Ancient stone masonry & heavy timber trestles
    wallAccentColor: 0x10b981,  // Vibrant prehistoric moss, vines, and fern fronds
    curbColor: 0xfacc15,        // Bright amber petrified wood curb (extreme running contrast!)
    catenaryColor: 0x4d5d36,    // Heavy timber and riveted bronze catenary frames
    insulatorColor: 0xfbbf24,   // Amber fossilized resin insulators
    pipeColor: 0x92400e,        // Weathered copper & timber conduits
    bridgeMainColor: 0x3f3f46,  // Heavy rugged expedition steel & timber viaduct trestles
    bridgeAccentColor: 0x10b981,// Climbing emerald vine creepers and brass brackets
    groundPlaneColor: 0x143522
  },
  ambience: {
    baseToneFreq: 82,
    windNoiseFilter: 360,
    humGain: 0.045,
    tag: 'JURASSIC_RUSH_PREHISTORIC'
  }
};

/**
 * Visual Livery Specification for Jurassic Rush Expedition Trains
 */
export const JURASSIC_RUSH_TRAIN_LIVERY = {
  primaryColors: [0x3f4f2c, 0x27272a, 0x4d5d36], // Rugged Safari Olive, Heavy Expedition Steel, Deep Jungle Khaki
  accentColor: 0xfacc15, // High-Visibility Expedition Yellow / Amber
  reinforcedArmorColor: 0x18181b, // Anti-Raptor Armored Steel Grilles
  windowGlowColor: 0xfef08a, // Warm Observation Lounge Glow
  roofEquipmentColor: 0xca8a04, // Weathered Brass Vents & Searchlights
  roughness: 0.42,
  metalness: 0.65
} as const;

/**
 * Standalone Integration Hook:
 * Can be safely called by ObstacleFactory or an integration layer to style
 * any train carriage with the Jurassic Rush expedition aesthetic without modifying
 * core game systems.
 */
export function applyJurassicRushTrainLivery(
  trainGroup: THREE.Group,
  carriageIndex: number = 0
): void {
  const livery = JURASSIC_RUSH_TRAIN_LIVERY;
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
          metalness: 0.75,
          roughness: 0.35
        });
      }
    }
  });
}
