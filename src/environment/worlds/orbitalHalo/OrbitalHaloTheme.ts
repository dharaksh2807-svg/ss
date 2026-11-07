import { ORBITAL_HALO_THEME } from '../../EnvironmentConfig';

export { ORBITAL_HALO_THEME };

/**
 * Master Color Palette for Orbital Halo: The Living Space Megastructure
 * Formulated with high-contrast aerospace composites, navigation cyan,
 * titanium, planetary turquoise, solar amber, and deep cosmic void.
 */
export const ORBITAL_PALETTE = {
  // Deep Space Cosmic Void
  cosmicAbyss: 0x01030a,
  deepSpaceBlue: 0x0b1a30,
  spaceVoidDark: 0x050914,

  // Aerospace Hull Materials
  aerospaceWhite: 0xf1f5f9,
  titaniumGray: 0x879eac,
  graphiteCarbon: 0x1e293b,
  heatShieldDark: 0x0f172a,

  // High-Tech Lighting & Energy
  navigationCyan: 0x00f5ff,
  cyanGlow: 0x38bdf8,
  planetaryTurquoise: 0x70c9bd,
  solarAmber: 0xf1b969,
  warningOrange: 0xf97316,
  researchViolet: 0x7b79bb,
  strobeWhite: 0xffffff,

  // Observation Glass
  observationGlass: 0x1e3a5f
} as const;

/**
 * Theme-Specific High-Speed Orbital Maglev Train Livery
 */
export const ORBITAL_TRAIN_LIVERY = {
  hullWhite: 0xf8fafc,
  graphiteTrim: 0x1e293b,
  cyanGuideStripe: 0x00f5ff,
  observationGlass: 0x1e3a5f,
  ionEngineGlow: 0x38bdf8,
  catwalkSurfaceY: 4.35
} as const;
