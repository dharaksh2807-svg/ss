import type { EnvironmentTheme } from '../../EnvironmentConfig';

export const MIDNIGHT_VELVET_THEME: EnvironmentTheme = {
  id: 'MIDNIGHT_VELVET' as any,
  displayName: 'Midnight Velvet',
  subtitle: 'After Dark',
  description: 'An exclusive, ultra-luxury after-dark metropolis featuring breathtaking Art Deco towers, champagne gold accents, moonlight yacht marinas, vibrant rooftop lounges, and the monumental Midnight Grand railway terminal.',
  badgeEmoji: '🍸',
  accentColor: '#d4af37',
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
    'RAHULVERSE',
    'CHRONO_KINGDOM',
    'INFERNO_EXPRESS',
    'JURASSIC_RUSH'
  ],
  sky: {
    top: 0x0d172e,    // Deep midnight obsidian sapphire with radiant glow
    bottom: 0x38183c  // Rich royal velvet dusk glow on horizon
  },
  fog: {
    color: 0x18132c,  // Muted midnight velvet atmospheric haze
    density: 0.0012
  },
  sun: {
    color: 0xffeedd,  // Warm champagne moonlight
    intensity: 2.4,
    position: { x: -40, y: 75, z: -50 }
  },
  fill: {
    color: 0x5a2d82,  // Rich royal violet night shadow fill (lifts crushed blacks!)
    intensity: 1.15
  },
  hemi: {
    sky: 0x2a3360,    // Midnight sapphire upper
    ground: 0xf59e0b, // Warm amber city street bounce
    intensity: 1.55
  },
  skyline: {
    color: 0x141226,  // Silhouette of Art Deco spires and step-back towers
    opacity: 0.92,
    style: 'MODERN'
  },
  clouds: {
    color: 0x251838,  // Wispy midnight velvet clouds
    roughness: 0.85
  },
  materials: {
    ballastColor: 0x222436,     // Dark polished basalt granite ballast
    sleeperColor: 0x12121e,     // Ebonized hardwood railway ties
    wallBaseColor: 0x242838,    // Midnight black marble concourses with brass trim
    wallAccentColor: 0xd4af37,  // Gilded champagne gold trims & Art Deco cornices
    curbColor: 0xf59e0b,        // Warm amber uplit sidewalk curbs — crisp visibility!
    catenaryColor: 0xb45309,    // Polished bronze catenary arches
    insulatorColor: 0xfbbf24,   // Champagne glass insulators
    pipeColor: 0x78350f,        // Dark brass conduits
    bridgeMainColor: 0x202436,  // Polished dark stone viaducts
    bridgeAccentColor: 0xd4af37,// Champagne gold decorative lattice
    groundPlaneColor: 0x141824
  },
  ambience: {
    baseToneFreq: 95,
    windNoiseFilter: 320,
    humGain: 0.04,
    tag: 'MIDNIGHT_VELVET_LOUNGE'
  }
};
