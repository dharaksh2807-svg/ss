export type HoverboardId = 
  | 'board_urban_glide' 
  | 'board_pulse_rider' 
  | 'board_aero_drift' 
  | 'board_street_phantom';

export type BoardAbilityType = 
  | 'BASIC_PROTECTION' 
  | 'SPEED_BOOST' 
  | 'SUPER_JUMP' 
  | 'DRIFT_HANDLING';

export interface BoardAbility {
  type: BoardAbilityType;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  // Specific modifiers
  speedMultiplier?: number;            // e.g. 1.15 (+15% cruise velocity)
  scoreMultiplierBonus?: number;       // e.g. +1 score multiplier
  jumpVelocityMultiplier?: number;     // e.g. 1.25 (+25% jump height)
  gravityMultiplier?: number;          // e.g. 0.85 (floatier descent)
  laneChangeSpeedMultiplier?: number;  // e.g. 0.65 (35% faster snappy turns)
  magnetRadiusBonus?: number;          // e.g. +3.5 meters coin suction
  protectionRecoveryDuration?: number; // e.g. 1.5s post-crash invulnerability
}

export interface BoardUnlockRequirement {
  type: 'FREE' | 'COINS' | 'ACHIEVEMENT';
  cost?: number;
  achievementId?: string;
  description: string;
}

export interface HoverboardColors {
  deckPrimary: number;     // Main top deck plate
  deckSecondary: number;   // Underside hull
  gripTape: number;        // Center traction pad
  trim: number;            // Outer metallic rim / rail
  neonGlow: number;        // Undercarriage projector & thruster glow
  thrusterCore: number;    // Exhaust core
  trailColor: number;      // Trail particle color
}

export interface HoverboardDefinition {
  id: HoverboardId;
  name: string;
  archetype: string;
  tagline: string;
  description: string;
  icon: string;
  duration: number; // Base active duration in seconds (e.g. 25s)
  cooldown: number; // Cooldown between activations if no charges (e.g. 30s)
  colors: HoverboardColors;
  ability: BoardAbility;
  unlock: BoardUnlockRequirement;
  dimensions: {
    length: number;
    width: number;
    thickness: number;
  };
  features: {
    hasFrontWings?: boolean;
    hasRearDiffuser?: boolean;
    hasDualThrusters?: boolean;
    hasVentralFins?: boolean;
    hasEnergyRings?: boolean;
  };
}

export const HOVERBOARDS: HoverboardDefinition[] = [
  {
    id: 'board_urban_glide',
    name: 'Urban Glide',
    archetype: 'The Downtown Classic',
    tagline: 'Reliable, agile street cruising',
    description:
      'The quintessential underground transit board. Crafted with a reinforced composite deck, polished chrome rails, and twin magnetic levitators, Urban Glide delivers pure classic collision shielding with dependable handling.',
    icon: '🛹',
    duration: 25.0,
    cooldown: 20.0,
    colors: {
      deckPrimary: 0x00bcd4,    // Vibrant Cyan
      deckSecondary: 0x1a2332,  // Dark Matte Alloy
      gripTape: 0x111622,       // Gritty Charcoal
      trim: 0xe0e6ed,           // Brushed Chrome
      neonGlow: 0x00e5ff,       // Cyan Luminescence
      thrusterCore: 0x80d8ff,   // Electric Blue
      trailColor: 0x00e5ff
    },
    ability: {
      type: 'BASIC_PROTECTION',
      name: 'Kinetic Buffer',
      tagline: 'Standard Crash Absorption',
      description: 'Absorbs one lethal obstacle collision with a prolonged 1.5s invulnerability grace window.',
      icon: '🛡️',
      protectionRecoveryDuration: 1.5
    },
    unlock: {
      type: 'FREE',
      description: 'Starter Hoverboard — Unlocked by default'
    },
    dimensions: {
      length: 1.6,
      width: 0.52,
      thickness: 0.09
    },
    features: {
      hasEnergyRings: true
    }
  },
  {
    id: 'board_pulse_rider',
    name: 'Pulse Rider',
    archetype: 'Supersonic Overdrive',
    tagline: 'High-speed velocity injection',
    description:
      'Engineered for adrenaline junkies. Equipped with twin hyper-frequency pulse thrusters and aerodynamic ram-air vents, Pulse Rider surges forward with amplified speed and bonus score acceleration.',
    icon: '⚡',
    duration: 22.0,
    cooldown: 25.0,
    colors: {
      deckPrimary: 0x2979ff,    // Royal Blue
      deckSecondary: 0x0d1b2a,  // Midnight Navy
      gripTape: 0x1e3a5f,       // Textured Cobalt
      trim: 0x00e5ff,           // Glowing Neon Cyan
      neonGlow: 0x2979ff,       // Deep Blue Glow
      thrusterCore: 0x00ffff,   // Bright Cyan Plasma
      trailColor: 0x00e5ff
    },
    ability: {
      type: 'SPEED_BOOST',
      name: 'Velocity Overdrive',
      tagline: '+15% Speed & +1x Multiplier',
      description: 'Increases cruise speed by 15% and grants +1 bonus score multiplier while surfing.',
      icon: '🚀',
      speedMultiplier: 1.15,
      scoreMultiplierBonus: 1,
      protectionRecoveryDuration: 1.2
    },
    unlock: {
      type: 'COINS',
      cost: 2500,
      description: 'Purchase for 2,500 Coins'
    },
    dimensions: {
      length: 1.65,
      width: 0.48,
      thickness: 0.1
    },
    features: {
      hasDualThrusters: true,
      hasRearDiffuser: true
    }
  },
  {
    id: 'board_aero_drift',
    name: 'Aero Drift',
    archetype: 'Atmospheric Glider',
    tagline: 'Low-gravity high leaping',
    description:
      'Defying city gravity with swept-back dihedral aerofoils and ventral stabilizer fins. Aero Drift boosts jumping height by 25% with smooth hang time, letting you soar effortlessly over full train roofs.',
    icon: '🪶',
    duration: 24.0,
    cooldown: 22.0,
    colors: {
      deckPrimary: 0x00e676,    // Emerald Green
      deckSecondary: 0x1b382b,  // Dark Moss Carbon
      gripTape: 0x12241b,       // Forest Grip
      trim: 0x69f0ae,           // Mint Accent
      neonGlow: 0x00e676,       // Neon Emerald
      thrusterCore: 0xb9f6ca,   // Soft Mint Plasma
      trailColor: 0x00e676
    },
    ability: {
      type: 'SUPER_JUMP',
      name: 'Anti-Grav Lift',
      tagline: '+25% Jump Height & Float',
      description: 'Elevates jump peak by 25% and softens falling gravity for effortless rooftop clearance.',
      icon: '🦘',
      jumpVelocityMultiplier: 1.25,
      gravityMultiplier: 0.82,
      protectionRecoveryDuration: 1.3
    },
    unlock: {
      type: 'COINS',
      cost: 4000,
      description: 'Purchase for 4,000 Coins'
    },
    dimensions: {
      length: 1.7,
      width: 0.54,
      thickness: 0.08
    },
    features: {
      hasFrontWings: true,
      hasVentralFins: true
    }
  },
  {
    id: 'board_street_phantom',
    name: 'Street Phantom',
    archetype: 'Shadow Drift Syndicate',
    tagline: 'Razor-sharp lane cuts & magnet draw',
    description:
      'Forged in dark carbon weave with aggressive aerodynamic diffusers and violet ion thrusters. Street Phantom slashes lane transition times by 35% for razor-sharp dodging while vacuuming nearby coins.',
    icon: '🔮',
    duration: 26.0,
    cooldown: 25.0,
    colors: {
      deckPrimary: 0x9c27b0,    // Royal Purple
      deckSecondary: 0x180b20,  // Deep Obsidian
      gripTape: 0x2a1236,       // Textured Violet
      trim: 0xe040fb,           // Neon Magenta
      neonGlow: 0xd500f9,       // Intense Magenta Glow
      thrusterCore: 0xff80ab,   // Hot Pink Core
      trailColor: 0xe040fb
    },
    ability: {
      type: 'DRIFT_HANDLING',
      name: 'Phantom Drift',
      tagline: '35% Faster Turns + Magnet Aura',
      description: 'Dramatically accelerates lane transitions and projects a 3.5m magnetic field to collect coins.',
      icon: '🌀',
      laneChangeSpeedMultiplier: 0.65,
      magnetRadiusBonus: 3.5,
      protectionRecoveryDuration: 1.4
    },
    unlock: {
      type: 'COINS',
      cost: 6000,
      description: 'Purchase for 6,000 Coins'
    },
    dimensions: {
      length: 1.62,
      width: 0.50,
      thickness: 0.09
    },
    features: {
      hasRearDiffuser: true,
      hasDualThrusters: true,
      hasEnergyRings: true
    }
  }
];

export function getAllHoverboards(): HoverboardDefinition[] {
  return HOVERBOARDS;
}

export function getHoverboardById(id: string): HoverboardDefinition | undefined {
  return HOVERBOARDS.find((b) => b.id === id);
}

export const HOVERBOARD_CHARGES_PACK = {
  count: 3,
  cost: 300,
  name: '3 Board Pack',
  icon: '🛹'
};
