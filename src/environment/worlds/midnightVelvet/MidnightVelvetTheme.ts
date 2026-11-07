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
    top: 0x080c1e,    // Deep midnight obsidian sapphire
    bottom: 0x241228  // Rich burgundy twilight velvet glow on horizon
  },
  fog: {
    color: 0x151226,  // Muted midnight velvet haze (reduced density for crystal clarity)
    density: 0.0018
  },
  sun: {
    color: 0xfff4e6,  // Warm champagne moonlight
    intensity: 1.65,
    position: { x: -40, y: 75, z: -50 }
  },
  fill: {
    color: 0x3b1d60,  // Rich royal violet night shadow fill (lifts crushed blacks!)
    intensity: 0.65
  },
  hemi: {
    sky: 0x1e2246,    // Midnight sapphire upper
    ground: 0xf59e0b, // Warm amber city street bounce
    intensity: 1.35
  },
  skyline: {
    color: 0x0f0b1a,  // Silhouette of Art Deco spires and step-back towers
    opacity: 0.88,
    style: 'MODERN'
  },
  clouds: {
    color: 0x1e1028,  // Wispy midnight velvet clouds
    roughness: 0.85
  },
  materials: {
    ballastColor: 0x1a1a24,     // Dark polished basalt granite ballast
    sleeperColor: 0x0d0d12,     // Ebonized hardwood railway ties
    wallBaseColor: 0x121118,    // Midnight black marble concourses with brass trim
    wallAccentColor: 0xd4af37,  // Gilded champagne gold trims & Art Deco cornices
    curbColor: 0xf59e0b,        // Warm amber uplit sidewalk curbs — crisp visibility!
    catenaryColor: 0xb45309,    // Polished bronze catenary arches
    insulatorColor: 0xfbbf24,   // Champagne glass insulators
    pipeColor: 0x78350f,        // Dark brass conduits
    bridgeMainColor: 0x181824,  // Polished dark stone viaducts
    bridgeAccentColor: 0xd4af37,// Champagne gold decorative lattice
    groundPlaneColor: 0x090910
  },
  ambience: {
    baseToneFreq: 95,
    windNoiseFilter: 320,
    humGain: 0.04,
    tag: 'MIDNIGHT_VELVET_LOUNGE'
  }
};
