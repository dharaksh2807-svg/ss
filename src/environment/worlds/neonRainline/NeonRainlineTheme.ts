import * as THREE from 'three';
import { NEON_RAINLINE_THEME, EnvironmentTheme } from '../../EnvironmentConfig';

export { NEON_RAINLINE_THEME };

/**
 * Curated Cyberpunk Color Harmony & District Color Tiers
 * Grounded in midnight obsidian navy with controlled cyan/magenta/violet/amber accents
 */
export const NEON_PALETTE = {
  // Master Architecture
  midnightObsidian: 0x070c18,
  wetAlloyCharcoal: 0x0d1424,
  structuralTitanium: 0x162238,
  rainStreakedAsphalt: 0x05070d,
  reflectiveGlassDark: 0x0a1628,

  // Electric Core Accents
  electricCyan: 0x00f5ff,
  hotMagenta: 0xf026d3,
  deepViolet: 0x8b5cf6,
  plasmaPink: 0xec4899,
  lunarWhite: 0xf0fdf4,

  // District Accents
  marketAmber: 0xf59e0b,
  marketCrimson: 0xef4444,
  highwayAzure: 0x38bdf8,
  waterfrontTeal: 0x14b8a6,
  quantumIcyBlue: 0x67e8f9,
  quantumViolet: 0xa855f7,
  gardenEmerald: 0x10b981,
  gardenMint: 0x34d399,
  industrialOrange: 0xf97316,
  industrialRustRed: 0xb91c1c,
  terminalCoolWhite: 0xe0e7ff,
  terminalPurple: 0x7c3aed
} as const;

/**
 * Submersible / High-Speed Cyberpunk Train Livery
 */
export const NEON_RAINLINE_TRAIN_LIVERY = {
  bodyColor: 0x091024,
  roofColor: 0x0f1b34,
  accentCyan: 0x00f5ff,
  accentMagenta: 0xf026d3,
  catwalkSurfaceY: 4.35
} as const;
