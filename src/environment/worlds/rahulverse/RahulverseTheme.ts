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
    top: 0x0284c7,    // Brilliant clear open-air yatra cyan/blue
    bottom: 0xfef08a // Warm vibrant golden morning sunrise
  },
  fog: {
    color: 0xe0f2fe,  // Crisp morning horizon haze
    density: 0.0028
  },
  sun: {
    color: 0xffedd5,  // Bright energetic morning sunlight
    intensity: 1.45,
    position: { x: -35, y: 60, z: -45 }
  },
  fill: {
    color: 0x0284c7,  // Atmospheric blue shadow fill
    intensity: 0.65
  },
  hemi: {
    sky: 0xfef08a,    // Golden sky reflection
    ground: 0xca8a04, // Warm earth ground bounce
    intensity: 1.25
  },
  skyline: {
    color: 0x0369a1,  // Silhouette of mountain ridges, stupas, and futuristic spires
    opacity: 0.82,
    style: 'MODERN'
  },
  clouds: {
    color: 0xffffff,  // Fluffy white open-sky clouds
    roughness: 0.60
  },
  materials: {
    ballastColor: 0x475569,     // Natural railway granite ballast
    sleeperColor: 0x1e293b,     // Weathered railway ties
    wallBaseColor: 0xffffff,    // Crisp white roadside colonnade
    wallAccentColor: 0x0284c7,  // Dynamic athletic cyan racing stripe
    curbColor: 0xf59e0b,        // Sunlit turmeric yellow curb
    catenaryColor: 0x0369a1,    // Sky blue catenary pylons
    insulatorColor: 0xf59e0b,   // Polished brass insulators
    pipeColor: 0xd97706,        // Conduit pipes
    bridgeMainColor: 0xf8fafc,  // White viaduct arches
    bridgeAccentColor: 0x0284c7,// Energetic blue accents
    groundPlaneColor: 0xca8a04
  },
  ambience: {
    baseToneFreq: 130,
    windNoiseFilter: 450,
    humGain: 0.05,
    tag: 'RAHUL_YATRA_CHEERS'
  }
};
