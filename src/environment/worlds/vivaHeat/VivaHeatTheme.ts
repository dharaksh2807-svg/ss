import * as THREE from 'three';
import type { EnvironmentTheme } from '../../EnvironmentConfig';

/**
 * VIVA HEAT: THE FORBIDDEN FESTIVAL
 * Visual Theme Specification — Experimental Ultra-Premium World
 * 
 * Aesthetic: High-Fashion Fantasy Festival, Coastal Sunset, Glamorous Couture, Kinetic Flora
 * Palette: Saturated Coral Scarlet, Radiant Sunset Gold, Velvet Crimson, Orchid, and Warm Amber
 */
export const VIVA_HEAT_THEME: EnvironmentTheme = {
  id: 'VIVA_HEAT',
  displayName: 'Viva Heat',
  subtitle: 'The Forbidden Festival',
  description: 'An ultra-glamorous high-fashion fantasy festival where the coastline comes alive with kinetic floral sculptures, coastal sunset boulevards, luxury yachts, and pulsating theatrical fever.',
  badgeEmoji: '💃',
  accentColor: '#ff2d55', // Vibrant Festival Coral Scarlet
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
    'INFERNO_EXPRESS',
    'JURASSIC_RUSH'
  ],
  sky: {
    top: 0x3b0764,    // Deep twilight violet-wine
    bottom: 0xf43f5e // Glowing sunset scarlet-coral on the coastal horizon
  },
  fog: {
    color: 0x4a044e,  // Warm fuchsia-wine sunset haze
    density: 0.0028   // Subtle haze preserving razor-sharp obstacle visibility
  },
  sun: {
    color: 0xffedd5,  // Warm golden sunset celestial illumination
    intensity: 1.45,
    position: { x: 30, y: 38, z: -110 }
  },
  fill: {
    color: 0x881337,  // Rich velvet crimson coastal shadow fill
    intensity: 0.58
  },
  hemi: {
    sky: 0x701a75,    // Rich orchid sky reflection
    ground: 0xd97706, // Golden amber boardwalk bounce light
    intensity: 1.15
  },
  skyline: {
    color: 0x2e061b,  // Silhouette of tropical towers, palace arches and pavilions
    opacity: 0.88,
    style: 'HISTORIC'
  },
  clouds: {
    color: 0x581c3b,  // Dusky fuchsia and golden sunset cloud banks
    roughness: 0.85
  },
  materials: {
    ballastColor: 0x2e081e,     // Crushed magenta basalt ballast
    sleeperColor: 0x1a0512,     // Polished rosewood rail ties with brass fasteners
    wallBaseColor: 0x4c0519,    // Sculptural coral marble & velvet maroon masonry
    wallAccentColor: 0xf59e0b,  // Gilded sunset gold filigree & lattice
    curbColor: 0xf43f5e,        // High-contrast coral-scarlet curb (clear track boundaries!)
    catenaryColor: 0x881337,    // Curved velvet crimson catenary arches
    insulatorColor: 0xfbbf24,   // Golden amber luminous insulators
    pipeColor: 0xd97706,        // Polished sunset bronze conduit piping
    bridgeMainColor: 0x38061a,  // Sculptural seaside viaduct piers
    bridgeAccentColor: 0xf59e0b,// Gilded festival lattice trims
    groundPlaneColor: 0x1f0310  // Deep nocturnal coastal terrain
  },
  ambience: {
    baseToneFreq: 110,
    windNoiseFilter: 420,
    humGain: 0.05,
    tag: 'VIVA_HEAT_FESTIVAL'
  }
};

/**
 * Visual Livery Specification for Viva Heat Trains:
 * High-gloss candy automotive finish in Velvet Crimson, Coral Scarlet, and Sunset Gold
 */
export const VIVA_HEAT_TRAIN_LIVERY = {
  primaryColors: [
    0x881337, // Velvet Crimson (Lead Locomotive Cab)
    0xff2d55, // Coral Scarlet (Intermediate Luxury Saloon)
    0x1f0310  // Deep Obsidian Night (Observation Carriage)
  ],
  accentColor: 0xf59e0b,     // Sunset Gold Trim
  windowGlowColor: 0xffedd5, // Warm Champagne Luminescence
  pipeTrimColor: 0xf43f5e,   // Coral Accent Beading
  wheelCapColor: 0xf59e0b,   // Gold Wheel Hub Caps
  roughness: 0.20,
  metalness: 0.85
} as const;

/**
 * Standalone Integration Hook:
 * Can be safely called by ObstacleFactory or integration layers to style
 * any train carriage with Viva Heat high-fashion festival livery.
 */
export function applyVivaHeatTrainLivery(
  trainGroup: THREE.Group,
  carriageIndex: number = 0
): void {
  const livery = VIVA_HEAT_TRAIN_LIVERY;
  const carColor = livery.primaryColors[carriageIndex % livery.primaryColors.length];

  trainGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.name.includes('body') || child.name.includes('car')) {
        child.material = new THREE.MeshStandardMaterial({
          color: carColor,
          metalness: livery.metalness,
          roughness: livery.roughness,
          emissive: new THREE.Color(carColor).multiplyScalar(0.06),
          emissiveIntensity: 1.0
        });
      } else if (child.name.includes('window')) {
        child.material = new THREE.MeshBasicMaterial({
          color: livery.windowGlowColor
        });
      } else if (child.name.includes('accent') || child.name.includes('trim') || child.name.includes('cowling')) {
        child.material = new THREE.MeshStandardMaterial({
          color: livery.accentColor,
          metalness: 0.90,
          roughness: 0.20
        });
      }
    }
  });
}
