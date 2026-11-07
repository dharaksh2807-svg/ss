import * as THREE from 'three';
import type { EnvironmentTheme } from '../../EnvironmentConfig';

/**
 * PHANTOM LINE: THE FORGOTTEN RAILWAY
 * Visual Theme & Art Direction Specification
 * 
 * Aesthetic: Abandoned Subterranean Ghost Railway & Supernatural Transit Network
 * Palette: Abyssal Navy, Cold Oxidized Teal, Aged Stone Gray, Silver Moonlight,
 *          Sickly Green, Desaturated Cyan, Antique Rust, and Deep Warning Crimson.
 */

export const PHANTOM_PALETTE = {
  abyssalNavy: 0x07131f,         // Deep subterranean void & pitch backgrounds
  coldOxidizedTeal: 0x386e70,    // Corroded copper, aged structural arches
  agedStoneGray: 0x565d63,       // Weathered Victorian masonry, retaining walls
  silverMoonlight: 0xb8cdd5,     // Pale cold highlights, edge lighting
  sicklyGreen: 0x6f9981,         // Damp moss, stagnant subterranean seepage
  desaturatedCyan: 0x77bbc2,     // Spectral apparitions, ethereal wisps
  antiqueRust: 0x704a44,         // Decaying ironwork, rusted station beams
  deepWarningCrimson: 0x772a38,  // Emergency lights, telegraph beacons
  phosphorCyan: 0x67e8f9,        // Cold cathode tubes, ghost headlights
  dampSlate: 0x111827            // Underground ballast and platform stones
};

export const PHANTOM_LINE_THEME: EnvironmentTheme = {
  id: 'PHANTOM_LINE',
  displayName: 'Phantom Line',
  subtitle: 'The Forgotten Railway',
  description: 'An abandoned subterranean transit system trapped outside normal time, featuring monumental decaying stations, silent ghost trains, mysterious passengers, and surreal encounters.',
  badgeEmoji: '👻',
  accentColor: '#67e8f9',
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
    'HAUNTED_CARNIVAL',
    'VIP_EXPRESS',
    'MIDNIGHT_VELVET',
    'CHRONO_KINGDOM',
    'INFERNO_EXPRESS',
    'JURASSIC_RUSH'
  ],
  sky: {
    top: 0x030712,    // Deep pitch void subterranean abyss
    bottom: 0x082f49  // Cold spectral mist / cyan-tinted ectoplasmic horizon glow
  },
  fog: {
    color: 0x051b24,  // Cold sepulchral underground fog, keeping obstacles sharply readable within 80m
    density: 0.0036
  },
  sun: {
    color: 0x67e8f9,  // Dim spectral cathode ray moonlight
    intensity: 1.10,
    position: { x: -18, y: 36, z: -25 }
  },
  fill: {
    color: 0x064e3b,  // Sickly cold jade/moss ground reflection fill
    intensity: 0.65
  },
  hemi: {
    sky: 0x5eead4,    // Ghostly cyan ambient ceiling glow
    ground: 0x020617, // Damp subterranean ballast darkness
    intensity: 1.15
  },
  skyline: {
    color: 0x041822,  // Distant abandoned subterranean vaulted catacomb silhouettes
    opacity: 0.85,
    style: 'HISTORIC'
  },
  clouds: {
    color: 0x0b2533,  // Wispy subterranean spectral vapor clouds
    roughness: 0.95
  },
  materials: {
    ballastColor: 0x070d18,
    sleeperColor: 0x1e293b,
    wallBaseColor: 0x111827,
    wallAccentColor: 0x22d3ee,
    curbColor: 0x1e293b,
    catenaryColor: 0x0f172a,
    insulatorColor: 0x67e8f9,
    pipeColor: 0x0f766e,
    bridgeMainColor: 0x091e2b,
    bridgeAccentColor: 0x67e8f9,
    groundPlaneColor: 0x030712
  },
  ambience: {
    baseToneFreq: 40,
    windNoiseFilter: 180,
    humGain: 0.035, // Softened from 0.07 to eliminate annoying hum while preserving eerie sub-bass tone
    tag: 'PHANTOM_SPECTRAL_ECHO'
  }
};

export const PHANTOM_LINE_TRAIN_LIVERY = {
  bodyColor: 0x0f172a,
  roofColor: 0x070d18,
  accentColor: 0x67e8f9,
  windowGlowColor: 0x77bbc2,
  headlightCyan: 0x67e8f9,
  underglowColor: 0x064e3b
};
