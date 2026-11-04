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
    top: 0x032b1e,    // Deep prehistoric jungle canopy twilight
    bottom: 0xca8a04 // Golden primordial morning sunlight & misty amber horizon
  },
  fog: {
    color: 0x14402e,  // Dense prehistoric jungle mist
    density: 0.0028   // Atmospheric depth preserving high obstacle visibility
  },
  sun: {
    color: 0xfef08a,  // Warm golden prehistoric sunlight
    intensity: 1.35,
    position: { x: -35, y: 75, z: -50 }
  },
  fill: {
    color: 0x064e3b,  // Lush jungle shadow fill
    intensity: 0.60
  },
  hemi: {
    sky: 0x065f46,    // Emerald rainforest canopy bounce
    ground: 0xb45309, // Warm canyon ochre earth reflection
    intensity: 1.20
  },
  skyline: {
    color: 0x0d3326,  // Silhouettes of towering prehistoric mountains and peaks
    opacity: 0.90,
    style: 'HISTORIC'
  },
  clouds: {
    color: 0x1c4a38,  // Humid jungle mist and mountain clouds
    roughness: 0.88
  },
  materials: {
    ballastColor: 0x292524,     // Crushed ancient riverbed gravel and mossy basalt
    sleeperColor: 0x1c1917,     // Weathered heavy petrified ironwood ties
    wallBaseColor: 0x1f2937,    // Ancient stone masonry & heavy timber trestles
    wallAccentColor: 0x10b981,  // Vibrant prehistoric moss, vines, and fern fronds
    curbColor: 0xfacc15,        // Bright amber petrified wood curb (extreme running contrast!)
    catenaryColor: 0x3f4f2c,    // Heavy timber and riveted bronze catenary frames
    insulatorColor: 0xfbbf24,   // Amber fossilized resin insulators
    pipeColor: 0x78350f,        // Weathered copper & timber conduits
    bridgeMainColor: 0x27272a,  // Heavy rugged expedition steel & timber viaduct trestles
    bridgeAccentColor: 0x10b981,// Climbing emerald vine creepers and brass brackets
    groundPlaneColor: 0x0f291e
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
