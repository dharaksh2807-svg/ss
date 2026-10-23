import * as THREE from 'three';

export type EnvironmentId = 'MODERN_METRO' | 'HISTORIC_QUARTER';
export type EnvironmentSelection = 'DYNAMIC' | 'MODERN_METRO' | 'HISTORIC_QUARTER';

export interface EnvironmentTheme {
  id: EnvironmentId;
  displayName: string;
  subtitle: string;
  description: string;
  badgeEmoji: string;
  accentColor: string;
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
    style: 'MODERN' | 'HISTORIC';
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
  sky: {
    top: 0x0288d1,    // Rich vibrant azure
    bottom: 0xe1f5fe // Crisp cyan daylight horizon
  },
  fog: {
    color: 0xb3e5fc,  // Soft aerial cyan haze
    density: 0.0040
  },
  sun: {
    color: 0xfffaea,  // Bright crisp white-gold midday sun
    intensity: 1.40,
    position: { x: 24, y: 42, z: 18 }
  },
  fill: {
    color: 0x90caf9,  // Cool sky reflection
    intensity: 0.55
  },
  hemi: {
    sky: 0xb3e5fc,
    ground: 0x455a64,
    intensity: 1.15
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
    wallBaseColor: 0x78909c,    // Slate concrete retaining panels
    wallAccentColor: 0x37474f,
    curbColor: 0xdde2e6,        // Smooth light concrete
    catenaryColor: 0x455a64,    // Industrial steel
    insulatorColor: 0x81d4fa,   // Turquoise ceramic
    pipeColor: 0x37474f,
    bridgeMainColor: 0x263238,   // Sleek dark steel
    bridgeAccentColor: 0x00e5ff, // Cyber cyan glowing accents
    groundPlaneColor: 0x151922
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

export const ENVIRONMENTS: Record<EnvironmentId, EnvironmentTheme> = {
  MODERN_METRO: MODERN_METRO_THEME,
  HISTORIC_QUARTER: HISTORIC_QUARTER_THEME
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
      if (saved === 'MODERN_METRO' || saved === 'HISTORIC_QUARTER' || saved === 'DYNAMIC') {
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
    return id === 'MODERN_METRO' ? 'HISTORIC_QUARTER' : 'MODERN_METRO';
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
