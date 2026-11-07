import * as THREE from 'three';
import { isDeveloperMode } from '../core/Constants';
import { ProgressionManager } from '../progression/ProgressionManager';
import { EnvironmentRegistry } from './EnvironmentRegistry';
import type { WorldSelection } from './WorldCatalog';

export type EnvironmentId = 'MODERN_METRO' | 'HISTORIC_QUARTER' | 'UNDERGROUND_METRO' | 'NEON_INDUSTRIAL' | 'NEON_RAINLINE' | 'ORBITAL_HALO' | 'ABYSSAL_GLASSLINE' | 'DOOMSDAY_LAST_TRANSIT' | 'PHANTOM_LINE' | 'HAUNTED_CARNIVAL' | 'VIP_EXPRESS' | 'RAHULVERSE' | 'MIDNIGHT_VELVET' | 'CHRONO_KINGDOM' | 'INFERNO_EXPRESS' | 'JURASSIC_RUSH' | 'VIVA_HEAT';
export type EnvironmentSelection = WorldSelection;

export interface EnvironmentTheme {
  id: EnvironmentId;
  displayName: string;
  subtitle: string;
  description: string;
  badgeEmoji: string;
  accentColor: string;
  districtRange: {
    minLengthMeters: number;
    maxLengthMeters: number;
  };
  allowedTransitions: EnvironmentId[];
  sky: {
    top: number;
    bottom: number;
  };
  fog: {
    color: number;
    density: number;
  };
  sun: {
    color: number;
    intensity: number;
    position: { x: number; y: number; z: number };
  };
  fill: {
    color: number;
    intensity: number;
  };
  hemi: {
    sky: number;
    ground: number;
    intensity: number;
  };
  skyline: {
    color: number;
    opacity: number;
    style: 'MODERN' | 'HISTORIC' | 'INDUSTRIAL' | 'NEON';
  };
  clouds: {
    color: number;
    roughness: number;
  };
  materials: {
    ballastColor: number;
    sleeperColor: number;
    wallBaseColor: number;
    wallAccentColor: number;
    curbColor: number;
    catenaryColor: number;
    insulatorColor: number;
    pipeColor: number;
    bridgeMainColor: number;
    bridgeAccentColor: number;
    groundPlaneColor: number;
  };
  ambience: {
    baseToneFreq: number;
    windNoiseFilter: number;
    humGain: number;
    tag: string;
  };
}

export const MODERN_METRO_THEME: EnvironmentTheme = {
  id: 'MODERN_METRO',
  displayName: 'Modern Metro District',
  subtitle: 'Sleek Glass Towers & High-Tech Rail',
  description: 'Gleaming corporate headquarters, azure daylight skies, glass skybridges, and modern electrified transit corridors.',
  badgeEmoji: '🏙️',
  accentColor: '#00e5ff',
  districtRange: {
    minLengthMeters: 560,
    maxLengthMeters: 800
  },
  allowedTransitions: ['HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL', 'NEON_RAINLINE', 'ORBITAL_HALO', 'ABYSSAL_GLASSLINE', 'DOOMSDAY_LAST_TRANSIT', 'PHANTOM_LINE', 'HAUNTED_CARNIVAL', 'VIP_EXPRESS', 'MIDNIGHT_VELVET', 'CHRONO_KINGDOM', 'INFERNO_EXPRESS', 'JURASSIC_RUSH'],
  sky: {
    top: 0x0288d1,    // Rich vibrant azure
    bottom: 0xe1f5fe // Crisp cyan daylight horizon
  },
  fog: {
    color: 0xb3e5fc,  // Soft aerial cyan haze
    density: 0.0028   // Reduced from 0.0035 to prevent midground train wash-out
  },
  sun: {
    color: 0xfffaea,  // Bright crisp white-gold midday sun
    intensity: 1.45,
    position: { x: 24, y: 42, z: 18 }
  },
  fill: {
    color: 0xa0c4e8,  // Cool sky reflection fill
    intensity: 0.70   // Boosted to eliminate dark crushed voids on train flanks
  },
  hemi: {
    sky: 0xc8e6f9,
    ground: 0x546e7a, // Illuminated ground bounce to reveal underbody and trucks
    intensity: 1.30
  },
  skyline: {
    color: 0x90caf9,
    opacity: 0.75,
    style: 'MODERN'
  },
  clouds: {
    color: 0xffffff,
    roughness: 0.90
  },
  materials: {
    ballastColor: 0xffffff,
    sleeperColor: 0x42362b,
    wallBaseColor: 0x8a9ba8,    // Clean modern transit retaining concrete
    wallAccentColor: 0x455a64,
    curbColor: 0xe0e6eb,        // Clean concrete curb
    catenaryColor: 0x546e7a,    // Clean structural steel
    insulatorColor: 0x81d4fa,   // Turquoise ceramic
    pipeColor: 0x455a64,
    bridgeMainColor: 0x37474f,   // Sleek illuminated dark steel
    bridgeAccentColor: 0x00e5ff, // Cyber cyan glowing accents
    groundPlaneColor: 0x263238
  },
  ambience: {
    baseToneFreq: 110,
    windNoiseFilter: 1200,
    humGain: 0.035,
    tag: 'MODERN_ELECTRIC_HUM'
  }
};

export const HISTORIC_QUARTER_THEME: EnvironmentTheme = {
  id: 'HISTORIC_QUARTER',
  displayName: 'Historic Railway Quarter',
  subtitle: 'Victorian Brick & Stone Viaducts',
  description: 'Aged red brick brownstones, soot-stained arched viaducts, gas lamp posts, riveted iron gantries, and warm golden hour atmosphere.',
  badgeEmoji: '🏛️',
  accentColor: '#f59e0b',
  districtRange: {
    minLengthMeters: 560,
    maxLengthMeters: 800
  },
  allowedTransitions: ['MODERN_METRO', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL', 'NEON_RAINLINE', 'ORBITAL_HALO', 'ABYSSAL_GLASSLINE', 'DOOMSDAY_LAST_TRANSIT', 'PHANTOM_LINE', 'HAUNTED_CARNIVAL', 'VIP_EXPRESS', 'MIDNIGHT_VELVET', 'CHRONO_KINGDOM', 'INFERNO_EXPRESS', 'JURASSIC_RUSH'],
  sky: {
    top: 0x1e3a5f,    // Deep twilight sapphire/slate top
    bottom: 0xf5cba7 // Warm peach-amber golden hour horizon
  },
  fog: {
    color: 0xd9a58b,  // Warm terracotta / sandstone atmospheric haze
    density: 0.0046
  },
  sun: {
    color: 0xffaa55,  // Warm golden amber late-afternoon sun
    intensity: 1.55,
    position: { x: 32, y: 36, z: 22 }
  },
  fill: {
    color: 0xffcc80,  // Warm amber bounced ambient fill
    intensity: 0.65
  },
  hemi: {
    sky: 0xffd8b0,    // Warm dusty peach sky
    ground: 0x5c3d28, // Slightly warmer cobblestone earth reflection
    intensity: 1.25
  },
  skyline: {
    color: 0xbcaaa4,  // Sepia/dusty silhouettes with clocktowers and spires
    opacity: 0.85,
    style: 'HISTORIC'
  },
  clouds: {
    color: 0xfff3e0,  // Soft sunset-tinted clouds
    roughness: 0.85
  },
  materials: {
    ballastColor: 0xefdfcf,
    sleeperColor: 0x2d2219,
    wallBaseColor: 0x8d493a,    // Aged weathered London brick
    wallAccentColor: 0x4a2e2b,  // Dark soot-stained brick
    curbColor: 0xb0bec5,        // Hand-cut granite curbs
    catenaryColor: 0x212121,    // Heavy riveted cast iron
    insulatorColor: 0xa1887f,   // Antique brown earthenware
    pipeColor: 0x3e2723,
    bridgeMainColor: 0x6d4c41,   // Weathered red stone / brick arch
    bridgeAccentColor: 0xd4af37, // Brass / aged copper patina
    groundPlaneColor: 0x1f1712
  },
  ambience: {
    baseToneFreq: 75,
    windNoiseFilter: 750,
    humGain: 0.045,
    tag: 'HISTORIC_STEAM_RUMBLE'
  }
};

export const UNDERGROUND_METRO_THEME: EnvironmentTheme = {
  id: 'UNDERGROUND_METRO',
  displayName: 'Underground Metro System',
  subtitle: 'Vaulted Caverns, Glazed Tiles & Subterranean Stations',
  description: 'Fully enclosed subterranean subway system with white glazed ceramic tiles, monumental vaulted concrete haunches, elevated emergency walkways, and illuminated underground station concourses.',
  badgeEmoji: '🚇',
  accentColor: '#38bdf8',
  districtRange: {
    minLengthMeters: 560,
    maxLengthMeters: 800
  },
  allowedTransitions: ['MODERN_METRO', 'HISTORIC_QUARTER', 'NEON_INDUSTRIAL', 'NEON_RAINLINE', 'ORBITAL_HALO', 'ABYSSAL_GLASSLINE', 'DOOMSDAY_LAST_TRANSIT', 'PHANTOM_LINE', 'HAUNTED_CARNIVAL', 'VIP_EXPRESS', 'MIDNIGHT_VELVET', 'CHRONO_KINGDOM', 'INFERNO_EXPRESS', 'JURASSIC_RUSH'],
  sky: {
    top: 0x0a0f1d,    // Subterranean dark slate shadow
    bottom: 0x111827 // Deep tunnel ambient tone
  },
  fog: {
    color: 0x111827,  // Subterranean cool slate haze
    density: 0.0055   // Tuned so obstacles 80m ahead remain crisp and readable
  },
  sun: {
    color: 0x94a3b8,  // Cool downward artificial tunnel beam
    intensity: 0.35,  // Darker tunnel: fill is the key light underground
    position: { x: 0, y: 35, z: 12 }
  },
  fill: {
    color: 0x38bdf8,  // Cool fluorescent ambient bounce
    intensity: 0.75   // High legibility on train flanks and player
  },
  hemi: {
    sky: 0x7dd3fc,    // Overhead luminaire strip bounce
    ground: 0x283548, // Lighter concrete ballast floor bounce for better contact grounding
    intensity: 1.35
  },
  skyline: {
    color: 0x0f172a,
    opacity: 0.0,     // Hidden in enclosed subterranean environment
    style: 'MODERN'
  },
  clouds: {
    color: 0x000000,
    roughness: 1.0
  },
  materials: {
    ballastColor: 0x242833,
    sleeperColor: 0x181a20,
    wallBaseColor: 0x1e293b,    // Subway concrete wainscoting
    wallAccentColor: 0x0284c7,  // Metro blue ceramic accent band
    curbColor: 0x475569,        // Platform concrete curb
    catenaryColor: 0x334155,    // Heavy subway steel rib
    insulatorColor: 0x38bdf8,   // Third-rail ceramic insulator
    pipeColor: 0x64748b,        // Conduit / sprinkler pipe
    bridgeMainColor: 0x1e293b,   // Steel support bent
    bridgeAccentColor: 0xf59e0b, // Yellow hazard warning stripes
    groundPlaneColor: 0x0f172a
  },
  ambience: {
    baseToneFreq: 55,
    windNoiseFilter: 500,
    humGain: 0.06,
    tag: 'SUBWAY_TUNNEL_RUMBLE'
  }
};

export const NEON_INDUSTRIAL_THEME: EnvironmentTheme = {
  id: 'NEON_INDUSTRIAL',
  displayName: 'Industrial Rail Yard',
  subtitle: 'Nocturnal Steel, Amber Glow & Freight Gantries',
  description: 'Heavy industrial rail depot, nocturnal amber horizon glow, towering freight cranes, corrugated warehouses, and steam pipes.',
  badgeEmoji: '🏭',
  accentColor: '#ff6d00',
  districtRange: {
    minLengthMeters: 560,
    maxLengthMeters: 800
  },
  allowedTransitions: ['MODERN_METRO', 'HISTORIC_QUARTER', 'NEON_RAINLINE', 'ORBITAL_HALO', 'ABYSSAL_GLASSLINE', 'DOOMSDAY_LAST_TRANSIT', 'PHANTOM_LINE', 'HAUNTED_CARNIVAL', 'VIP_EXPRESS', 'MIDNIGHT_VELVET', 'CHRONO_KINGDOM', 'INFERNO_EXPRESS', 'JURASSIC_RUSH'],
  sky: {
    top: 0x181326,    // Deep nocturnal purple dusk
    bottom: 0xf57c00 // Radiant amber horizon glow
  },
  fog: {
    color: 0xbf5700,  // Warm industrial amber haze
    density: 0.0036   // Reduced from 0.0042 to improve obstacle silhouette contrast
  },
  sun: {
    color: 0xff8f00,  // Low amber sodium sun
    intensity: 1.50,
    position: { x: -28, y: 38, z: 20 }
  },
  fill: {
    color: 0xffb74d,  // Warm bounce fill
    intensity: 0.60
  },
  hemi: {
    sky: 0xffa726,
    ground: 0x241810,
    intensity: 1.20
  },
  skyline: {
    color: 0x8d6e63,
    opacity: 0.80,
    style: 'INDUSTRIAL'
  },
  clouds: {
    color: 0xffcc80,
    roughness: 0.88
  },
  materials: {
    ballastColor: 0x3e3532,
    sleeperColor: 0x261c14,
    wallBaseColor: 0x5d4037,    // Aged board-formed concrete with rust
    wallAccentColor: 0xbf360c,  // Industrial orange/rust accent
    curbColor: 0x78909c,        // Chipped concrete curb
    catenaryColor: 0x37474f,    // Heavy industrial steel
    insulatorColor: 0xffb300,   // High-voltage amber ceramic
    pipeColor: 0xd84315,        // Rust orange steam pipe
    bridgeMainColor: 0x37474f,   // Steel truss bridge
    bridgeAccentColor: 0xffab00, // Warning yellow/amber accents
    groundPlaneColor: 0x181310
  },
  ambience: {
    baseToneFreq: 60,
    windNoiseFilter: 650,
    humGain: 0.05,
    tag: 'INDUSTRIAL_FACTORY_HUM'
  }
};

export const NEON_RAINLINE_THEME: EnvironmentTheme = {
  id: 'NEON_RAINLINE',
  displayName: 'Neon Rainline',
  subtitle: 'Futuristic Rain-Soaked Megacity',
  description: 'A midnight cyber-metropolis illuminated by holographic transit arches, towering megastructures, and glistening rain-soaked railway corridors.',
  badgeEmoji: '🌧️',
  accentColor: '#e879f9',
  districtRange: {
    minLengthMeters: 560,
    maxLengthMeters: 800
  },
  allowedTransitions: ['MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL', 'ORBITAL_HALO', 'ABYSSAL_GLASSLINE', 'DOOMSDAY_LAST_TRANSIT', 'PHANTOM_LINE', 'HAUNTED_CARNIVAL', 'VIP_EXPRESS', 'MIDNIGHT_VELVET', 'CHRONO_KINGDOM', 'INFERNO_EXPRESS', 'JURASSIC_RUSH'],
  sky: {
    top: 0x050814,    // Midnight obsidian navy
    bottom: 0x1f0b38 // Radiant electric violet & magenta horizon glow
  },
  fog: {
    color: 0x0d1226,  // Deep midnight atmospheric haze (clear obstacle contrast within 80m)
    density: 0.0032
  },
  sun: {
    color: 0x8be9fd,  // Cool downward lunar/neon key light
    intensity: 0.70,
    position: { x: 26, y: 45, z: 20 }
  },
  fill: {
    color: 0xf026d3,  // Rich magenta city canyon ambient bounce
    intensity: 0.55
  },
  hemi: {
    sky: 0x00f5ff,    // Electric cyan luminescent sky dome
    ground: 0x220c38, // Deep violet wet-ground bounce
    intensity: 1.15
  },
  skyline: {
    color: 0x181236,  // Distant cyber megacity silhouettes with glowing spires
    opacity: 0.88,
    style: 'NEON'
  },
  clouds: {
    color: 0x201533,  // Nocturnal low-hanging rain clouds
    roughness: 0.95
  },
  materials: {
    ballastColor: 0x121724,    // Rain-soaked dark crushed basalt
    sleeperColor: 0x0b0e17,    // Wet composite sleepers
    wallBaseColor: 0x111625,    // Dark cyber alloy retaining walls
    wallAccentColor: 0x00f5ff,  // Electric cyan neon channel
    curbColor: 0x1e273b,        // Wet curb with cyan reflective bead
    catenaryColor: 0x151d2f,    // Carbon-composite structural framing
    insulatorColor: 0x00ffff,   // Superconducting cyan glowing ring
    pipeColor: 0x4a1d6d,        // High-voltage plasma conduit
    bridgeMainColor: 0x0e1322,   // Sleek dark futuristic steel
    bridgeAccentColor: 0xf026d3, // Neon magenta structural glow accents
    groundPlaneColor: 0x070912
  },
  ambience: {
    baseToneFreq: 75,
    windNoiseFilter: 950,
    humGain: 0.045,
    tag: 'NEON_RAIN_SYNTH_DRONE'
  }
};

export const ORBITAL_HALO_THEME: EnvironmentTheme = {
  id: 'ORBITAL_HALO',
  displayName: 'Orbital Halo',
  subtitle: 'Megastructure Rail Over Deep Space & Planetary Horizon',
  description: 'An immense futuristic orbital transportation station overlooking a breathtaking planet, with sweeping megastructure rings, celestial transit rails, and deep space panoramas.',
  badgeEmoji: '🪐',
  accentColor: '#38bdf8',
  districtRange: {
    minLengthMeters: 560,
    maxLengthMeters: 800
  },
  allowedTransitions: ['MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL', 'NEON_RAINLINE', 'ABYSSAL_GLASSLINE', 'DOOMSDAY_LAST_TRANSIT', 'PHANTOM_LINE', 'HAUNTED_CARNIVAL', 'VIP_EXPRESS', 'MIDNIGHT_VELVET', 'CHRONO_KINGDOM', 'INFERNO_EXPRESS', 'JURASSIC_RUSH'],
  sky: {
    top: 0x01030a,    // Cosmic abyss deep void black
    bottom: 0x0b1a30 // Electric azure/cyan planetary horizon limb glow
  },
  fog: {
    color: 0x050914,  // Deep space atmospheric haze maintaining crisp obstacle silhouettes within 80m
    density: 0.0020
  },
  sun: {
    color: 0xffffff,  // Pure unfiltered space sunlight
    intensity: 1.45,
    position: { x: 36, y: 48, z: -20 }
  },
  fill: {
    color: 0x00d2ff,  // Vibrant planetary atmosphere limb reflection fill
    intensity: 0.65
  },
  hemi: {
    sky: 0x38bdf8,    // Celestial light dome
    ground: 0x0f172a, // Titanium hull bounce
    intensity: 1.25
  },
  skyline: {
    color: 0x475569,  // Distant orbital superstructure ring silhouettes
    opacity: 0.85,
    style: 'NEON'
  },
  clouds: {
    color: 0x0c1b33,  // Cosmic nebula wisps
    roughness: 0.95
  },
  materials: {
    ballastColor: 0x182030,    // Ceramic heat shield / magnetic guideway
    sleeperColor: 0x0f172a,    // Titanium composite sleepers
    wallBaseColor: 0xf1f5f9,    // Pristine aerospace white composite retaining walls
    wallAccentColor: 0x00f5ff,  // Electric cyan magnetic flux channel
    curbColor: 0x94a3b8,        // Titanium curb cap
    catenaryColor: 0x1e293b,    // Graphite carbon truss frame
    insulatorColor: 0x38bdf8,   // High-energy quantum levitation emitter
    pipeColor: 0x0284c7,        // Cryogenic coolant conduit
    bridgeMainColor: 0x0f172a,   // Aerospace titanium superstructure
    bridgeAccentColor: 0x00f5ff, // Electric cyan glowing guide accents
    groundPlaneColor: 0x02040a
  },
  ambience: {
    baseToneFreq: 88,
    windNoiseFilter: 450,
    humGain: 0.04,
    tag: 'ORBITAL_STATION_HUM'
  }
};

export const ABYSSAL_GLASSLINE_THEME: EnvironmentTheme = {
  id: 'ABYSSAL_GLASSLINE',
  displayName: 'Abyssal Glassline',
  subtitle: 'Underwater Megacity Rail & Oceanic Glass Tunnels',
  description: 'A colossal glass transit railway through the deep ocean abyss, surrounded by luminescent sea life, submerged megacity domes, and hydrothermal trench architecture.',
  badgeEmoji: '🌊',
  accentColor: '#22d3ee',
  districtRange: {
    minLengthMeters: 560,
    maxLengthMeters: 800
  },
  allowedTransitions: ['MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL', 'NEON_RAINLINE', 'ORBITAL_HALO', 'DOOMSDAY_LAST_TRANSIT', 'PHANTOM_LINE', 'HAUNTED_CARNIVAL', 'VIP_EXPRESS', 'MIDNIGHT_VELVET', 'CHRONO_KINGDOM', 'INFERNO_EXPRESS', 'JURASSIC_RUSH'],
  sky: {
    top: 0x011324,    // Deep oceanic abyss abyss-blue / midnight trench
    bottom: 0x033852 // Luminous oceanic teal / deep hydro-glow
  },
  fog: {
    color: 0x021b2d,  // Deep-sea hydrostatic particulate haze maintaining crisp obstacle silhouettes within 80m
    density: 0.0035
  },
  sun: {
    color: 0x38bdf8,  // Shimmering oceanic downwelling sunlight
    intensity: 1.15,
    position: { x: 20, y: 55, z: -15 }
  },
  fill: {
    color: 0x0d9488,  // Deep teal benthic scatter bounce fill
    intensity: 0.75
  },
  hemi: {
    sky: 0x22d3ee,    // Bioluminescent water column light dome
    ground: 0x021727, // Basalt seafloor crust bounce
    intensity: 1.30
  },
  skyline: {
    color: 0x04435e,  // Distant submerged dome & trench silhouettes
    opacity: 0.85,
    style: 'NEON'
  },
  clouds: {
    color: 0x022538,  // Marine snow & thermal vent plume layers
    roughness: 0.95
  },
  materials: {
    ballastColor: 0x0b1d28,    // Hydrothermal basalt seafloor track ballast
    sleeperColor: 0x07151e,    // High-pressure titanium sleepers
    wallBaseColor: 0x0c2536,    // Marine reinforced composite foundation
    wallAccentColor: 0x22d3ee,  // Electric bioluminescent cyan-teal runner
    curbColor: 0x153e54,        // Nautical curb coping
    catenaryColor: 0x092230,    // High-tensile marine pressure framing
    insulatorColor: 0x00f5ff,   // Hydro-sealed induction node
    pipeColor: 0xd97706,        // Anti-corrosion hydro-brass thermal conduit
    bridgeMainColor: 0x0a2233,   // Deep sea titanium alloy superstructure
    bridgeAccentColor: 0x22d3ee, // Luminous bioluminescent teal accents
    groundPlaneColor: 0x010c14
  },
  ambience: {
    baseToneFreq: 52,
    windNoiseFilter: 320,
    humGain: 0.05,
    tag: 'ABYSSAL_OCEAN_RUMBLE'
  }
};

export const DOOMSDAY_LAST_TRANSIT_THEME: EnvironmentTheme = {
  id: 'DOOMSDAY_LAST_TRANSIT',
  displayName: 'Doomsday: Last Transit',
  subtitle: 'The Final Railway Through a Collapsing Civilization',
  description: 'The final functioning evacuation railway through the ruins of a collapsing futuristic metropolis, framed by shattered monolithic skyscrapers, burning horizons, falling ash, and emergency distress beacons.',
  badgeEmoji: '☄️',
  accentColor: '#f97316',
  districtRange: {
    minLengthMeters: 560,
    maxLengthMeters: 800
  },
  allowedTransitions: ['MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL', 'NEON_RAINLINE', 'ORBITAL_HALO', 'ABYSSAL_GLASSLINE', 'PHANTOM_LINE', 'HAUNTED_CARNIVAL', 'VIP_EXPRESS', 'MIDNIGHT_VELVET', 'CHRONO_KINGDOM', 'INFERNO_EXPRESS', 'JURASSIC_RUSH'],
  sky: {
    top: 0x140402,    // Deep suffocating smoke-black with volcanic ember underglow
    bottom: 0x4a1104 // Raging inferno horizon / firestorm glow
  },
  fog: {
    color: 0x1a0705,  // Dense atmospheric ash and particulate haze, preserving crisp obstacle silhouettes within 80m
    density: 0.0038
  },
  sun: {
    color: 0xff6a20,  // Filtered apocalyptic low-angle sunlight
    intensity: 1.15,
    position: { x: -25, y: 35, z: -30 }
  },
  fill: {
    color: 0x7c2d12,  // Warm fiery ground bounce fill
    intensity: 0.75
  },
  hemi: {
    sky: 0xf97316,    // Fiery fallout sky
    ground: 0x180806, // Charred basalt bedrock bounce
    intensity: 1.20
  },
  skyline: {
    color: 0x240705,  // Distant shattered monolith silhouettes
    opacity: 0.88,
    style: 'INDUSTRIAL'
  },
  clouds: {
    color: 0x2a0c06,  // Billowing firestorm smoke plume layers
    roughness: 0.95
  },
  materials: {
    ballastColor: 0x1c1917,    // Scorched volcanic basalt/soot ballast
    sleeperColor: 0x0c0a09,    // Reinforced heat-resistant dark composite sleepers
    wallBaseColor: 0x1c1917,    // Charred concrete blast retaining walls
    wallAccentColor: 0xf97316,  // Hazard chevron warning orange / thermal glow
    curbColor: 0x292524,        // Battered concrete coping
    catenaryColor: 0x1c1917,    // Twisted industrial steel trusses
    insulatorColor: 0xef4444,   // Emergency red warning nodes
    pipeColor: 0xb45309,        // Molten conduit / thermal piping
    bridgeMainColor: 0x171717,   // Scorched blast alloy
    bridgeAccentColor: 0xf97316, // Active evacuation emergency LED runners
    groundPlaneColor: 0x0c0a09
  },
  ambience: {
    baseToneFreq: 44,
    windNoiseFilter: 260,
    humGain: 0.06,
    tag: 'DOOMSDAY_INFERNO_RUMBLE'
  }
};

export const PHANTOM_LINE_THEME: EnvironmentTheme = {
  id: 'PHANTOM_LINE',
  displayName: 'Phantom Line',
  subtitle: 'Abandoned Supernatural Ghost Railway',
  description: 'An abandoned subterranean transit system gripped by chilling tension, decaying Victorian-modern platforms, flickering cathode fluorescents, shadowy apparitions, and silent ghost trains.',
  badgeEmoji: '👻',
  accentColor: '#67e8f9',
  districtRange: {
    minLengthMeters: 560,
    maxLengthMeters: 800
  },
  allowedTransitions: ['MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL', 'NEON_RAINLINE', 'ORBITAL_HALO', 'ABYSSAL_GLASSLINE', 'DOOMSDAY_LAST_TRANSIT', 'HAUNTED_CARNIVAL', 'VIP_EXPRESS', 'MIDNIGHT_VELVET', 'CHRONO_KINGDOM', 'INFERNO_EXPRESS', 'JURASSIC_RUSH'],
  sky: {
    top: 0x030712,    // Deep pitch void subterranean abyss
    bottom: 0x082f49 // Cold spectral mist / cyan-tinted ectoplasmic horizon glow
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
    ballastColor: 0x0f172a,    // Damp dark slate ballast
    sleeperColor: 0x020617,    // Rotted aged railway ties
    wallBaseColor: 0x111827,    // Cracked decaying subterranean ceramic tile & damp concrete
    wallAccentColor: 0x22d3ee,  // Flickering cold phosphor neon / spectral indicator line
    curbColor: 0x1e293b,        // Weathered curb with water stains
    catenaryColor: 0x0f172a,    // Tarnished rusted iron arch frames
    insulatorColor: 0x991b1b,   // Blood-crimson warning beacon insulators
    pipeColor: 0x134e4a,        // Oxidized corroded copper/iron drainage conduits
    bridgeMainColor: 0x0f172a,   // Abandoned iron girder viaducts
    bridgeAccentColor: 0x67e8f9, // Spectral pale cyan lantern halos
    groundPlaneColor: 0x030712
  },
  ambience: {
    baseToneFreq: 40,
    windNoiseFilter: 180,
    humGain: 0.07,
    tag: 'PHANTOM_SPECTRAL_ECHO'
  }
};

export const HAUNTED_CARNIVAL_THEME: EnvironmentTheme = {
  id: 'HAUNTED_CARNIVAL',
  displayName: 'Haunted Carnival',
  subtitle: 'Extravagant Gothic Theme Park Railway',
  description: 'A supernatural carnival railway winding through towering gothic castles, glowing jack-o\'-lantern patches, creepy big-top tents, and an immense rotating haunted Ferris wheel.',
  badgeEmoji: '🎃',
  accentColor: '#f97316',
  districtRange: {
    minLengthMeters: 560,
    maxLengthMeters: 800
  },
  allowedTransitions: ['MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL', 'NEON_RAINLINE', 'ORBITAL_HALO', 'ABYSSAL_GLASSLINE', 'DOOMSDAY_LAST_TRANSIT', 'PHANTOM_LINE', 'VIP_EXPRESS', 'MIDNIGHT_VELVET', 'CHRONO_KINGDOM', 'INFERNO_EXPRESS', 'JURASSIC_RUSH'],
  sky: {
    top: 0x0c071e,    // Midnight violet void
    bottom: 0x3b0764 // Atmospheric purple moonlight glow
  },
  fog: {
    color: 0x1e0e38,  // Deep violet haunted mist
    density: 0.0034
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

export const VIP_EXPRESS_THEME: EnvironmentTheme = {
  id: 'VIP_EXPRESS',
  displayName: 'Mitron Express',
  subtitle: 'The Great Inauguration',
  description: 'A grand fictional VIP ceremonial concourse featuring futuristic civic architecture, red-carpet walkways, endless ribbon cuttings, paparazzi chaos, and comedic political celebrations.',
  badgeEmoji: '🏛️',
  accentColor: '#f59e0b',
  districtRange: {
    minLengthMeters: 560,
    maxLengthMeters: 800
  },
  allowedTransitions: ['MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL', 'NEON_RAINLINE', 'ORBITAL_HALO', 'ABYSSAL_GLASSLINE', 'DOOMSDAY_LAST_TRANSIT', 'PHANTOM_LINE', 'HAUNTED_CARNIVAL', 'MIDNIGHT_VELVET', 'CHRONO_KINGDOM', 'INFERNO_EXPRESS', 'JURASSIC_RUSH'],
  sky: {
    top: 0x1e3a8a,    // Deep royal ceremonial navy blue
    bottom: 0xffedd5 // Warm golden hour sunrise / ceremonial glow
  },
  fog: {
    color: 0xf5d0a9,  // Warm golden-hour ceremonial horizon glow (reduced density for crisp atmospheric depth)
    density: 0.0016
  },
  sun: {
    color: 0xfffbeb,  // Bright dignified golden sunlight
    intensity: 1.55,
    position: { x: -30, y: 55, z: -40 }
  },
  fill: {
    color: 0x1e3a8a,  // Royal navy shadow fill
    intensity: 0.70
  },
  hemi: {
    sky: 0xffedd5,    // Warm golden ceremonial sky fill
    ground: 0xd4a373, // Warm sandstone ground bounce
    intensity: 1.35
  },
  skyline: {
    color: 0xb45309,  // Warm golden sandstone silhouette of ceremonial domes and obelisks
    opacity: 0.80,
    style: 'MODERN'
  },
  clouds: {
    color: 0xfff7ed,  // Gleaming white ceremonial clouds with subtle golden edges
    roughness: 0.60
  },
  materials: {
    ballastColor: 0x334155,    // Pristine swept granite ballast with gold track bed trims
    sleeperColor: 0x0f172a,    // Polished navy-graphite high-speed ties
    wallBaseColor: 0xf8fafc,   // Gleaming ivory civic limestone
    wallAccentColor: 0xf59e0b, // Polished ceremonial gold leaf line
    curbColor: 0xd4a373,       // Warm carved sandstone curb
    catenaryColor: 0x1e3a8a,   // Royal navy ceremonial catenary pylons with gold finials
    insulatorColor: 0xf59e0b,  // Polished brass insulators
    pipeColor: 0xd4a373,       // Sandstone conduits
    bridgeMainColor: 0xf1f5f9,  // Monumental ivory viaduct arches
    bridgeAccentColor: 0xbe123c,// Rich crimson red carpet balustrade
    groundPlaneColor: 0xd4a373
  },
  ambience: {
    baseToneFreq: 110,
    windNoiseFilter: 400,
    humGain: 0.05,
    tag: 'VIP_CEREMONIAL_FANFARE'
  }
};

export { RAHULVERSE_THEME } from './worlds/rahulverse/RahulverseTheme';
import { RAHULVERSE_THEME } from './worlds/rahulverse/RahulverseTheme';
export { MIDNIGHT_VELVET_THEME } from './worlds/midnightVelvet/MidnightVelvetTheme';
import { MIDNIGHT_VELVET_THEME } from './worlds/midnightVelvet/MidnightVelvetTheme';
export { CHRONO_KINGDOM_THEME } from './worlds/chronoKingdom/ChronoKingdomTheme';
import { CHRONO_KINGDOM_THEME } from './worlds/chronoKingdom/ChronoKingdomTheme';
export { INFERNO_EXPRESS_THEME } from './worlds/infernoExpress/InfernoExpressTheme';
import { INFERNO_EXPRESS_THEME } from './worlds/infernoExpress/InfernoExpressTheme';
export { JURASSIC_RUSH_THEME } from './worlds/jurassicRush/JurassicRushTheme';
import { JURASSIC_RUSH_THEME } from './worlds/jurassicRush/JurassicRushTheme';
export { VIVA_HEAT_THEME } from './worlds/vivaHeat/VivaHeatTheme';
import { VIVA_HEAT_THEME } from './worlds/vivaHeat/VivaHeatTheme';

export const ENVIRONMENTS: Record<EnvironmentId, EnvironmentTheme> = {
  MODERN_METRO: MODERN_METRO_THEME,
  HISTORIC_QUARTER: HISTORIC_QUARTER_THEME,
  UNDERGROUND_METRO: UNDERGROUND_METRO_THEME,
  NEON_INDUSTRIAL: NEON_INDUSTRIAL_THEME,
  NEON_RAINLINE: NEON_RAINLINE_THEME,
  ORBITAL_HALO: ORBITAL_HALO_THEME,
  ABYSSAL_GLASSLINE: ABYSSAL_GLASSLINE_THEME,
  DOOMSDAY_LAST_TRANSIT: DOOMSDAY_LAST_TRANSIT_THEME,
  PHANTOM_LINE: PHANTOM_LINE_THEME,
  HAUNTED_CARNIVAL: HAUNTED_CARNIVAL_THEME,
  VIP_EXPRESS: VIP_EXPRESS_THEME,
  RAHULVERSE: RAHULVERSE_THEME,
  MIDNIGHT_VELVET: MIDNIGHT_VELVET_THEME,
  CHRONO_KINGDOM: CHRONO_KINGDOM_THEME,
  INFERNO_EXPRESS: INFERNO_EXPRESS_THEME,
  JURASSIC_RUSH: JURASSIC_RUSH_THEME,
  VIVA_HEAT: VIVA_HEAT_THEME
};

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private currentEnvironment: EnvironmentId = 'MODERN_METRO';
  private devPreviewEnvironment: EnvironmentId | null = null;
  private constructor() {}

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  public setDevPreviewEnvironment(id: EnvironmentId | null): void {
    this.devPreviewEnvironment = id;
  }

  public getDevPreviewEnvironment(): EnvironmentId | null {
    return this.devPreviewEnvironment;
  }

  public loadPreference(): void {
    ProgressionManager.getInstance().load();
  }

  public savePreference(pref: EnvironmentSelection): boolean {
    return ProgressionManager.getInstance().equipTheme(pref).success;
  }

  public getSelectionPreference(): EnvironmentSelection {
    return ProgressionManager.getInstance().getSelectedTheme();
  }

  public getPreference(): EnvironmentSelection {
    return this.getSelectionPreference();
  }

  public getStartingEnvironment(): EnvironmentId {
    if (this.devPreviewEnvironment && isDeveloperMode() && EnvironmentRegistry.getInstance().has(this.devPreviewEnvironment)) {
      return this.devPreviewEnvironment;
    }
    const preference = this.getSelectionPreference();
    const registry = EnvironmentRegistry.getInstance();
    return preference !== 'DYNAMIC' && registry.has(preference)
      ? registry.get(preference).id : 'MODERN_METRO';
  }

  public getCurrentEnvironment(): EnvironmentId {
    return this.currentEnvironment;
  }

  public setCurrentEnvironment(id: EnvironmentId): void {
    this.currentEnvironment = id;
  }

  public getTheme(id: EnvironmentId = this.currentEnvironment): EnvironmentTheme {
    return ENVIRONMENTS[id] || MODERN_METRO_THEME;
  }

  public getOtherEnvironment(id: EnvironmentId): EnvironmentId {
    if (id === 'MODERN_METRO') {
      return 'HISTORIC_QUARTER';
    }
    return 'MODERN_METRO';
  }

  public lerpThemeColors(from: EnvironmentTheme, to: EnvironmentTheme, t: number): EnvironmentTheme {
    const clampedT = Math.max(0, Math.min(1, t));
    return {
      ...to,
      sky: {
        top: EnvironmentManager.lerpColor(from.sky.top, to.sky.top, clampedT).getHex(),
        bottom: EnvironmentManager.lerpColor(from.sky.bottom, to.sky.bottom, clampedT).getHex()
      },
      fog: {
        color: EnvironmentManager.lerpColor(from.fog.color, to.fog.color, clampedT).getHex(),
        density: from.fog.density + (to.fog.density - from.fog.density) * clampedT
      },
      sun: {
        ...to.sun,
        color: EnvironmentManager.lerpColor(from.sun.color, to.sun.color, clampedT).getHex(),
        intensity: from.sun.intensity + (to.sun.intensity - from.sun.intensity) * clampedT
      }
    };
  }

  /**
   * Helper to linearly blend two hex colors with factor t in [0, 1]
   */
  public static lerpColor(c1Hex: number, c2Hex: number, t: number): THREE.Color {
    const c1 = new THREE.Color(c1Hex);
    const c2 = new THREE.Color(c2Hex);
    return c1.lerp(c2, Math.max(0, Math.min(1, t)));
  }
}
