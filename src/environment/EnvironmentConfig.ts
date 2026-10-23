import * as THREE from 'three';

export type EnvironmentId = 'MODERN_METRO' | 'HISTORIC_QUARTER' | 'NEON_INDUSTRIAL';
export type EnvironmentSelection = 'DYNAMIC' | 'MODERN_METRO' | 'HISTORIC_QUARTER' | 'NEON_INDUSTRIAL';

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
    style: 'MODERN' | 'HISTORIC' | 'INDUSTRIAL';
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
  allowedTransitions: ['HISTORIC_QUARTER', 'NEON_INDUSTRIAL'],
  sky: {
    top: 0x0288d1,    // Rich vibrant azure
    bottom: 0xe1f5fe // Crisp cyan daylight horizon
  },
  fog: {
    color: 0xb3e5fc,  // Soft aerial cyan haze
    density: 0.0035
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
  allowedTransitions: ['MODERN_METRO', 'NEON_INDUSTRIAL'],
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
    ground: 0x4e3629, // Cobblestone earth reflection
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
  allowedTransitions: ['MODERN_METRO', 'HISTORIC_QUARTER'],
  sky: {
    top: 0x181326,    // Deep nocturnal purple dusk
    bottom: 0xf57c00 // Radiant amber horizon glow
  },
  fog: {
    color: 0xbf5700,  // Warm industrial amber haze
    density: 0.0042
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

export const ENVIRONMENTS: Record<EnvironmentId, EnvironmentTheme> = {
  MODERN_METRO: MODERN_METRO_THEME,
  HISTORIC_QUARTER: HISTORIC_QUARTER_THEME,
  NEON_INDUSTRIAL: NEON_INDUSTRIAL_THEME
};

export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private currentEnvironment: EnvironmentId = 'MODERN_METRO';
  private selectionPreference: EnvironmentSelection = 'DYNAMIC';
  private storageKey = 'metro_runner_environment_preference';

  private constructor() {
    this.loadPreference();
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  public loadPreference(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved === 'MODERN_METRO' || saved === 'HISTORIC_QUARTER' || saved === 'NEON_INDUSTRIAL' || saved === 'DYNAMIC') {
        this.selectionPreference = saved as EnvironmentSelection;
      }
    } catch {
      // Safe fallback
    }
  }

  public savePreference(pref: EnvironmentSelection): void {
    this.selectionPreference = pref;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, pref);
      } catch {
        // Safe fallback
      }
    }
  }

  public getSelectionPreference(): EnvironmentSelection {
    return this.selectionPreference;
  }

  public getPreference(): EnvironmentSelection {
    return this.selectionPreference;
  }

  public getStartingEnvironment(): EnvironmentId {
    if (this.selectionPreference === 'HISTORIC_QUARTER') {
      return 'HISTORIC_QUARTER';
    }
    if (this.selectionPreference === 'NEON_INDUSTRIAL') {
      return 'NEON_INDUSTRIAL';
    }
    return 'MODERN_METRO';
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
