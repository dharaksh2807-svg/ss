import type { EnvironmentTheme } from '../../EnvironmentConfig';

export const RAHULVERSE_THEME: EnvironmentTheme = {
  id: 'RAHULVERSE' as any,
  displayName: 'Rahulverse',
  subtitle: 'The Never-Ending Yatra',
  description: 'An absurdly entertaining, epic political-satire journey across five distinct comedy districts: endless walking yatras, parliamentary pandemonium, press conference panic, alliance rollercoasters, and the political multiverse.',
  badgeEmoji: '🚩',
  accentColor: '#38bdf8',
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
    'HAUNTED_CARNIVAL',
    'VIP_EXPRESS',
    'MIDNIGHT_VELVET',
    'CHRONO_KINGDOM',
    'INFERNO_EXPRESS',
    'JURASSIC_RUSH'
  ],
  sky: {
    top: 0x1d4ed8,    // Warm energetic sapphire Indian morning sky
    bottom: 0xfef3c7 // Warm vibrant golden morning sunrise
  },
  fog: {
    color: 0xf1f5f9,  // Crisp morning horizon haze
    density: 0.0016
  },
  sun: {
    color: 0xffedd5,  // Bright energetic morning sunlight
    intensity: 1.50,
    position: { x: -35, y: 60, z: -45 }
  },
  fill: {
    color: 0x0f766e,  // Atmospheric warm teal shadow fill
    intensity: 0.55
  },
  hemi: {
    sky: 0xfef3c7,    // Warm golden sky reflection
    ground: 0xcfa774, // Warm sandstone ground bounce
    intensity: 1.30
  },
  skyline: {
    color: 0x1e3a8a,  // Silhouette of mountain ridges, stupas, and scenic hills
    opacity: 0.85,
    style: 'MODERN'
  },
  clouds: {
    color: 0xffffff,  // Fluffy white open-sky clouds
    roughness: 0.60
  },
  materials: {
    ballastColor: 0x475569,     // Natural railway granite ballast
    sleeperColor: 0x1e293b,     // Weathered railway ties
    wallBaseColor: 0xfdfbf7,    // Warm ivory roadside colonnade
    wallAccentColor: 0x0f766e,  // Rich Indian peacock teal
    curbColor: 0xf59e0b,        // Sunlit turmeric yellow curb
    catenaryColor: 0x1e3a8a,    // Indigo catenary pylons
    insulatorColor: 0xf59e0b,   // Polished brass insulators
    pipeColor: 0xd97706,        // Conduit pipes
    bridgeMainColor: 0xf8fafc,  // Warm ivory viaduct arches
    bridgeAccentColor: 0x0f766e,// Rich teal accents
    groundPlaneColor: 0xcfa774
  },
  ambience: {
    baseToneFreq: 130,
    windNoiseFilter: 450,
    humGain: 0.05,
    tag: 'RAHUL_YATRA_CHEERS'
  }
};
