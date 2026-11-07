import * as THREE from 'three';
import type { EnvironmentTheme } from '../../EnvironmentConfig';

/**
 * HAUNTED CARNIVAL: THE NIGHTMARE WONDERLAND
 * Visual Theme & Art Direction Specification
 * 
 * Aesthetic: Supernatural Gothic Amusement Park
 * Palette: Midnight Abyss, Supernatural Purple, Royal Violet, Aged Carnival Crimson,
 *          Pumpkin Amber, Spectral Teal, Pale Moonlight, and Decayed Gothic Stone.
 */

export const HAUNTED_PALETTE = {
  midnightAbyss: 0x090716,      // Sky top abyss & deep shadow voids
  supernaturalPurple: 0x28114d, // Sky bottom, mystical mist
  royalViolet: 0x542a89,        // Marquee structures, neon banners, circus fabrics
  agedCrimson: 0x6e2037,        // Vintage weathered big top canvas stripes
  pumpkinAmber: 0xf97316,       // Glowing jack-o'-lanterns, warm lantern light
  spectralTeal: 0x7acfc7,       // Ghostly apparitions, will-o'-the-wisps, eerie ectoplasm
  paleMoonlight: 0xc8d7ee,      // Cool rim lighting, ghost highlights
  weatheredStone: 0x1e1b2e,     // Ancient cemetery ashlar, mausoleum walls
  decayedGold: 0x9b7a37,        // Tarnished carousel leaf, clockwork brackets
  witchFireGreen: 0x22c55e,     // Cursed crypt vapors, potion bottles
  rottingWood: 0x18111e,        // Dead bare trees, broken wooden trestles
  obsidianIron: 0x0e0b17,       // Spiked wrought-iron cemetery gates, railings
};

export const HAUNTED_CARNIVAL_THEME: EnvironmentTheme = {
  id: 'HAUNTED_CARNIVAL',
  displayName: 'Haunted Carnival',
  subtitle: 'The Nightmare Wonderland',
  description: 'An immense supernatural amusement park alive after midnight, featuring rotating haunted carousels, ghostly performers, Victorian manor spires, and eerie encounters.',
  badgeEmoji: '🎃',
  accentColor: '#f97316',
  districtRange: {
    minLengthMeters: 560,
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
    'VIP_EXPRESS',
    'RAHULVERSE',
    'MIDNIGHT_VELVET',
    'CHRONO_KINGDOM',
    'INFERNO_EXPRESS',
    'JURASSIC_RUSH'
  ],
  sky: {
    top: 0x0c071e,    // Midnight violet abyss
    bottom: 0x3b0764  // Atmospheric purple moonlight glow
  },
  fog: {
    color: 0x1e0e38,  // Deep violet haunted mist
    density: 0.0034   // Tuned for atmospheric depth without obscuring running hazards
  },
  sun: {
    color: 0xfb923c,  // Warm pumpkin harvest lantern glow
    intensity: 1.15,
    position: { x: -25, y: 38, z: -30 }
  },
  fill: {
    color: 0x581c87,  // Mysterious royal violet shadow fill
    intensity: 0.70
  },
  hemi: {
    sky: 0xc084fc,    // Radiant purple moonlight
    ground: 0x180828, // Dark shadowed carnival ground
    intensity: 1.20
  },
  skyline: {
    color: 0x1a0b2e,  // Deep silhouette of castles, Ferris wheel & tent peaks
    opacity: 0.88,
    style: 'HISTORIC'
  },
  clouds: {
    color: 0x2e1065,  // Eerie purplish-black storm clouds
    roughness: 0.90
  },
  materials: {
    ballastColor: 0x120c1f,    // Dark soot/violet gravel ballast
    sleeperColor: 0x271a38,    // Aged dark timber railway ties
    wallBaseColor: 0x1e1b2e,    // Weathered gothic cemetery ashlar stone
    wallAccentColor: 0xf97316,  // Glowing carved pumpkin runner line
    curbColor: 0x2e1b4d,        // Gothic carved curb stone
    catenaryColor: 0x180828,    // Black wrought-iron gothic arch poles
    insulatorColor: 0xf97316,   // Amber pumpkin glow insulators
    pipeColor: 0x581c87,        // Violet gothic drainage ironwork
    bridgeMainColor: 0x1c1033,   // Ornate gothic iron viaduct
    bridgeAccentColor: 0xc084fc, // Neon purple marquee trim
    groundPlaneColor: 0x0a0514
  },
  ambience: {
    baseToneFreq: 55,
    windNoiseFilter: 220,
    humGain: 0.06,
    tag: 'HAUNTED_CARNIVAL_ORGAN'
  }
};

export const HAUNTED_CARNIVAL_TRAIN_LIVERY = {
  bodyColor: 0x1f1135,
  roofColor: 0x120b22,
  accentColor: 0xf97316,
  windowGlowColor: 0x7acfc7,
  headlightAmber: 0xfbbf24,
  underglowColor: 0x542a89
};
