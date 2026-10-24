export type CharacterId = 'char_jax' | 'char_luna' | 'char_cruz' | 'char_nova' | 'char_modi';

export type CharacterRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type UnlockType = 'FREE' | 'COINS' | 'ACHIEVEMENT' | 'SEASON_PASS';

export interface UnlockRequirement {
  type: UnlockType;
  cost?: number;
  achievementId?: string;
  seasonMilestone?: number;
  description: string;
}

export interface OutfitDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  previewImage?: string;
  unlock: UnlockRequirement;
  colors: {
    primary: number;     // Jacket / main garment
    secondary: number;   // Accents / stripes / trim
    pants: number;       // Trousers / shorts
    accent: number;      // Shoes / visor / glow
    hairOrHelmet: number;// Hair or helmet base
    skin: number;        // Skin tone
    details: number;     // Zipper / goggles / laces
  };
  features?: {
    hasGoggles?: boolean;
    hasHat?: boolean;
    hasVisor?: boolean;
    hasPonytails?: boolean;
    hasAfroBandana?: boolean;
    hasAeroHelmet?: boolean;
    hasLuminousTrims?: boolean;
    hasSpectacles?: boolean;
    hasKurtaWaistcoat?: boolean;
  };
}

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  title: string;
  personality: string;
  bio: string;
  silhouetteDescription: string;
  portraitIcon: string;
  previewImage?: string;
  thumbnailImage?: string;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY';
  rarity?: CharacterRarity;
  isGlb?: boolean;
  glbPath?: string;
  proportions: {
    height: number;
    shoulderWidth: number;
    torsoWidth: number;
    legLength: number;
    armScale: number;
  };
  unlock: UnlockRequirement;
  outfits: OutfitDefinition[];
  defaultOutfitId: string;
}

export const CHARACTER_CATALOG: CharacterDefinition[] = [
  // --- CHARACTER 1: JAX ---
  {
    id: 'char_jax',
    name: 'Jax',
    title: 'The Street Legend',
    personality: 'Energetic, optimistic subway runner who treats the metro system as his personal canvas.',
    bio: 'Armed with a backpack full of spray cans and custom high-tops, Jax has tagged every subway station from Downtown to Central Terminus. Fast, fearless, and always one step ahead.',
    silhouetteDescription: 'Athletic street runner with backward baseball cap, goggles on the brim, hoodie collar, and high-top sneakers.',
    portraitIcon: '🧢',
    gender: 'MALE',
    proportions: {
      height: 1.0,
      shoulderWidth: 0.35,
      torsoWidth: 0.28,
      legLength: 0.85,
      armScale: 1.0
    },
    unlock: {
      type: 'FREE',
      description: 'Default Metro Runner unlocked from start.'
    },
    defaultOutfitId: 'jax_classic',
    outfits: [
      {
        id: 'jax_classic',
        name: 'Classic Street',
        tagline: 'Signature Downtown Style',
        description: 'Vibrant cyan windbreaker hoodie, crimson backward snapback, dark urban denim, and red high-tops.',
        icon: '🧢',
        unlock: { type: 'FREE', description: 'Default Look' },
        colors: {
          primary: 0x00bcd4,     // Cyan jacket
          secondary: 0xffffff,   // White zipper & accents
          pants: 0x242b38,       // Dark denim cargo
          accent: 0xff1744,      // Crimson cap & sneakers
          hairOrHelmet: 0x212121,// Dark brown hair
          skin: 0xffd1a9,        // Warm peach skin
          details: 0x00f5d4      // Aqua goggle lenses
        },
        features: {
          hasHat: true,
          hasGoggles: true
        }
      },
      {
        id: 'jax_stealth',
        name: 'Midnight Shadow',
        tagline: 'Covert Metro Operations',
        description: 'Matte carbon-black hoodie with neon violet zipper accents, graphite cargo pants, and purple-laced sneakers.',
        icon: '🥷',
        unlock: { type: 'COINS', cost: 800, description: '800 Coins' },
        colors: {
          primary: 0x1a1a24,     // Matte dark carbon
          secondary: 0x9c27b0,   // Neon purple trims
          pants: 0x121218,       // Deep black joggers
          accent: 0x7c4dff,      // Electric purple cap & shoes
          hairOrHelmet: 0x0d0d12,// Pitch black hair
          skin: 0xffd1a9,
          details: 0xe040fb      // Magenta goggle glow
        },
        features: {
          hasHat: true,
          hasGoggles: true
        }
      },
      {
        id: 'jax_golden',
        name: 'Golden Graffiti',
        tagline: 'High-Roller Champion',
        description: 'Metallic gilded varsity jacket, black cap with gold embroidery, and metallic gold-plated kicks.',
        icon: '👑',
        unlock: { type: 'COINS', cost: 1800, description: '1,800 Coins' },
        colors: {
          primary: 0xffb300,     // Metallic gold jacket
          secondary: 0x212121,   // Ebony contrast stripes
          pants: 0x263238,       // Slate pants
          accent: 0xffc107,      // Gold cap & shoes
          hairOrHelmet: 0x212121,
          skin: 0xffd1a9,
          details: 0xfff8e1      // Pearl white details
        },
        features: {
          hasHat: true,
          hasGoggles: true
        }
      }
    ]
  },

  // --- CHARACTER 2: LUNA ---
  {
    id: 'char_luna',
    name: 'Luna',
    title: 'Cyberpunk Neon Hacker',
    personality: 'Hyper-focused tech prodigy who hacks subway signal boards and races magnetic commuter maglevs.',
    bio: 'Equipped with a holographic targeting visor, dual high cyber ponytails, and magnetic energy combat boots, Luna turns the city rail network into an electrified obstacle playground.',
    silhouetteDescription: 'Agile cybernetic runner with twin high ponytails, glowing cyber visor, cropped tech-jacket, and magnetic utility boots.',
    portraitIcon: '⚡',
    gender: 'FEMALE',
    proportions: {
      height: 0.96,
      shoulderWidth: 0.31,
      torsoWidth: 0.24,
      legLength: 0.88,
      armScale: 0.95
    },
    unlock: {
      type: 'COINS',
      cost: 1500,
      description: 'Unlock for 1,500 Coins'
    },
    defaultOutfitId: 'luna_neon',
    outfits: [
      {
        id: 'luna_neon',
        name: 'Grid Runner',
        tagline: 'Electric Neon Protocol',
        description: 'Electric cyan and neon magenta cyber cropped jacket, holographic visor, and glowing magnetic boots.',
        icon: '⚡',
        unlock: { type: 'FREE', description: 'Default Look with Luna' },
        colors: {
          primary: 0x00e5ff,     // Electric cyan cyber jacket
          secondary: 0xff007f,   // Neon magenta lining & piping
          pants: 0x181a24,       // Obsidian tech shorts
          accent: 0x00f0ff,      // Glowing cyan visor & boots
          hairOrHelmet: 0x4a148c,// Deep purple hair
          skin: 0xffdfba,        // Fair skin
          details: 0xff007f      // Neon pink hair ties
        },
        features: {
          hasVisor: true,
          hasPonytails: true,
          hasLuminousTrims: true
        }
      },
      {
        id: 'luna_violet',
        name: 'Electric Phantom',
        tagline: 'Ghost in the Track',
        description: 'Ultraviolet holographic jacket, white cyber-punk hair with violet highlights, and stealth boots.',
        icon: '🔮',
        unlock: { type: 'COINS', cost: 1000, description: '1,000 Coins' },
        colors: {
          primary: 0x651fff,     // Electric violet jacket
          secondary: 0x00e676,   // Neon mint green highlights
          pants: 0x212121,       // Dark carbon tech pants
          accent: 0x7c4dff,      // Deep purple visor
          hairOrHelmet: 0xf5f5f5,// Platinum white hair
          skin: 0xffdfba,
          details: 0x00e676      // Emerald green accents
        },
        features: {
          hasVisor: true,
          hasPonytails: true,
          hasLuminousTrims: true
        }
      },
      {
        id: 'luna_acid',
        name: 'Acid Matrix',
        tagline: 'Overclocked Cyber Style',
        description: 'Toxic neon lime and hazard yellow jacket, carbon fiber tech-shorts, and hazard-striped cyber boots.',
        icon: '🧪',
        unlock: { type: 'COINS', cost: 1500, description: '1,500 Coins' },
        colors: {
          primary: 0x76ff03,     // Acid lime jacket
          secondary: 0x212121,   // Carbon black accents
          pants: 0x263238,       // Tech gray cargo shorts
          accent: 0xffee58,      // Hazard yellow visor
          hairOrHelmet: 0x212121,// Jet black hair
          skin: 0xffdfba,
          details: 0x76ff03      // Lime green energy rings
        },
        features: {
          hasVisor: true,
          hasPonytails: true,
          hasLuminousTrims: true
        }
      }
    ]
  },

  // --- CHARACTER 3: CRUZ ---
  {
    id: 'char_cruz',
    name: 'Cruz',
    title: 'Metro B-Boy Acrobat',
    personality: 'Charismatic breakdancer and parkour acrobat who moves with rhythmic timing and explosive power.',
    bio: 'Cruz turns train rooftops into dance floors. With his signature street bandana, oversized b-boy track pants, and heavy retro hi-tops, he slides under barriers and leaps over trains with effortless style.',
    silhouetteDescription: 'Muscular athletic silhouette with street bandana/beanie, open sleeveless streetwear vest, baggy striped b-boy track pants, and chunky skate shoes.',
    portraitIcon: '🕺',
    gender: 'MALE',
    proportions: {
      height: 1.04,
      shoulderWidth: 0.42,
      torsoWidth: 0.32,
      legLength: 0.84,
      armScale: 1.08
    },
    unlock: {
      type: 'COINS',
      cost: 3000,
      description: 'Unlock for 3,000 Coins'
    },
    defaultOutfitId: 'cruz_bboy',
    outfits: [
      {
        id: 'cruz_bboy',
        name: 'Street Beats',
        tagline: 'Classic Hip-Hop Rhythm',
        description: 'Crimson sleeveless streetwear vest over dark compression shirt, yellow/black striped b-boy pants, and red bandana.',
        icon: '🕺',
        unlock: { type: 'FREE', description: 'Default Look with Cruz' },
        colors: {
          primary: 0xd50000,     // Crimson red vest
          secondary: 0x212121,   // Black compression shirt
          pants: 0xffea00,       // Golden yellow track pants with black stripes
          accent: 0xd50000,      // Crimson bandana & retro kicks
          hairOrHelmet: 0x1a120b,// Dark brown curly afro fade
          skin: 0x8d5524,        // Warm deep bronze skin
          details: 0xffffff      // White fat laces & trim
        },
        features: {
          hasAfroBandana: true
        }
      },
      {
        id: 'cruz_camo',
        name: 'Urban Camo',
        tagline: 'Underground Tactical',
        description: 'Military street camo vest, olive athletic joggers, black beanie, and rugged combat skate shoes.',
        icon: '🪖',
        unlock: { type: 'COINS', cost: 1200, description: '1,200 Coins' },
        colors: {
          primary: 0x33691e,     // Olive camo vest
          secondary: 0x1b5e20,   // Deep forest green shirt
          pants: 0x424242,       // Dark graphite track pants
          accent: 0x212121,      // Tactical black bandana & shoes
          hairOrHelmet: 0x1a120b,
          skin: 0x8d5524,
          details: 0x8bc34a      // Lime accent stitching
        },
        features: {
          hasAfroBandana: true
        }
      },
      {
        id: 'cruz_sunset',
        name: 'Sunset Groove',
        tagline: 'Golden Hour Flare',
        description: 'Warm gradient orange vest, teal track pants, golden yellow bandana, and sunset kicks.',
        icon: '🌅',
        unlock: { type: 'COINS', cost: 2000, description: '2,000 Coins' },
        colors: {
          primary: 0xff6d00,     // Vibrant sunset orange vest
          secondary: 0x00838f,   // Deep teal compression shirt
          pants: 0x00acc1,       // Bright teal track pants
          accent: 0xffd600,      // Golden yellow bandana & sneakers
          hairOrHelmet: 0x1a120b,
          skin: 0x8d5524,
          details: 0xffab00      // Amber details
        },
        features: {
          hasAfroBandana: true
        }
      }
    ]
  },

  // --- CHARACTER 4: NOVA ---
  {
    id: 'char_nova',
    name: 'Nova',
    title: 'Solarpunk Velocity Rider',
    personality: 'Aerospace engineer and clean-energy speedster striving for frictionless transit perfection.',
    bio: 'Wearing an aerodynamic solar flightsuit with integrated photovoltaic relays, panoramic sun visor, and photon-repulsion boots, Nova glides over tracks with unmatched hydrodynamic grace.',
    silhouetteDescription: 'Sleek aerodynamic solarpunk silhouette with tinted panoramic helmet, twin mini aero fins, solar pauldrons, and photon propulsion boots.',
    portraitIcon: '🚀',
    gender: 'NON_BINARY',
    proportions: {
      height: 1.02,
      shoulderWidth: 0.36,
      torsoWidth: 0.27,
      legLength: 0.87,
      armScale: 1.02
    },
    unlock: {
      type: 'COINS',
      cost: 5000,
      description: 'Unlock for 5,000 Coins or Complete Marathon Runner'
    },
    defaultOutfitId: 'nova_solar',
    outfits: [
      {
        id: 'nova_solar',
        name: 'Solar Flare',
        tagline: 'Photovoltaic Prototype',
        description: 'Sunburst orange and ivory aerodynamic flightsuit, gold solar visor, white helmet with aero fins, and photon boots.',
        icon: '☀️',
        unlock: { type: 'FREE', description: 'Default Look with Nova' },
        colors: {
          primary: 0xff6f00,     // Sunburst orange flightsuit
          secondary: 0xfafafa,   // Ivory white aero plates
          pants: 0x37474f,       // Slate tech pants
          accent: 0xffd54f,      // Radiant gold sun visor & boot rings
          hairOrHelmet: 0xffffff,// White aerodynamic helmet
          skin: 0xd7a176,        // Medium warm skin
          details: 0x00e5ff      // Cyan photon circuit lines
        },
        features: {
          hasAeroHelmet: true,
          hasLuminousTrims: true
        }
      },
      {
        id: 'nova_aurora',
        name: 'Aurora Velocity',
        tagline: 'Atmospheric Ion Drive',
        description: 'Northern lights emerald green and cyan flightsuit, iridescent visor, and emerald plasma boots.',
        icon: '🌌',
        unlock: { type: 'COINS', cost: 1500, description: '1,500 Coins' },
        colors: {
          primary: 0x00bfa5,     // Aurora teal flightsuit
          secondary: 0x64ffda,   // Mint glow panels
          pants: 0x1de9b6,       // Emerald tech trousers
          accent: 0x18ffff,      // Electric cyan visor & photon rings
          hairOrHelmet: 0x004d40,// Deep sea green aero helmet
          skin: 0xd7a176,
          details: 0x69f0ae      // Bright plasma accents
        },
        features: {
          hasAeroHelmet: true,
          hasLuminousTrims: true
        }
      },
      {
        id: 'nova_carbon',
        name: 'Orbital Carbon',
        tagline: 'Deep Space Monolith',
        description: 'Matte carbon-fiber weave with deep bronze metallic accents, polarized amber visor, and bronze magnetic boots.',
        icon: '🪐',
        unlock: { type: 'COINS', cost: 2500, description: '2,500 Coins' },
        colors: {
          primary: 0x212121,     // Carbon fiber black
          secondary: 0xd7ccc8,   // Titanium bronze trim
          pants: 0x1c1c1c,       // Black aerospace weave
          accent: 0xffb74d,      // Amber polarized visor
          hairOrHelmet: 0x2c3437,// Stealth dark helmet
          skin: 0xd7a176,
          details: 0xffab40      // Warm bronze photon rings
        },
        features: {
          hasAeroHelmet: true,
          hasLuminousTrims: true
        }
      }
    ]
  },
  // --- CHARACTER 5: NARENDRA MODI (LEGENDARY) ---
  {
    id: 'char_modi',
    name: 'Narendra Modi',
    title: 'The Statesman Runner',
    personality: 'Distinguished, energetic world leader in signature tailored waistcoat and traditional kurta, sprinting with unmatched poise.',
    bio: 'An iconic statesman whose relentless drive, determination, and global vision power an unstoppable sprint through the subway metropolis. Outfitted in his signature hand-tailored waistcoat, traditional cream kurta, and modern high-traction sneakers.',
    silhouetteDescription: 'Distinguished leader with groomed silver-white hair and beard, metallic spectacles, traditional cream kurta, tailored midnight-navy waistcoat, and high-performance running sneakers.',
    portraitIcon: '🏛️',
    previewImage: '/characters/modi/three_quarter.png',
    thumbnailImage: '/characters/modi/hero.png',
    gender: 'MALE',
    rarity: 'LEGENDARY',
    isGlb: true,
    glbPath: '/characters/modi/character.glb',
    proportions: {
      height: 1.0,
      shoulderWidth: 0.36,
      torsoWidth: 0.30,
      legLength: 0.85,
      armScale: 1.0
    },
    unlock: {
      type: 'COINS',
      cost: 100000,
      description: 'Unlock for 100,000 Coins'
    },
    defaultOutfitId: 'modi_classic',
    outfits: [
      {
        id: 'modi_classic',
        name: 'Vibrant Statesman',
        tagline: 'Signature Traditional Kurta & Navy Waistcoat',
        description: 'Impeccable cream kurta, tailored midnight-navy Nehru waistcoat with brass buttons, saffron pocket square accent, and lightweight graphite running sneakers.',
        icon: '🏛️',
        previewImage: '/characters/modi/front.png',
        unlock: { type: 'FREE', description: 'Default Look with Narendra Modi' },
        colors: {
          primary: 0x1b2838,     // Midnight navy waistcoat
          secondary: 0xf5f0e6,   // Cream kurta fabric
          pants: 0xf5f0e6,       // Cream churidar
          accent: 0xff9933,      // Saffron pocket square
          hairOrHelmet: 0xf2f2f2,// Silver-white swept hair & beard
          skin: 0xd7a176,        // Warm natural skin tone
          details: 0xcd7f32      // Brushed bronze spectacles & buttons
        },
        features: {
          hasSpectacles: true,
          hasKurtaWaistcoat: true
        }
      },
      {
        id: 'modi_saffron',
        name: 'Golden Saffron',
        tagline: 'Ceremonial Silk & Saffron Waistcoat',
        description: 'Vibrant royal saffron waistcoat over pure ivory silk kurta, with polished gold spectacle frames and athletic sneakers.',
        icon: '☀️',
        previewImage: '/characters/modi/three_quarter.png',
        unlock: { type: 'COINS', cost: 10000, description: '10,000 Coins' },
        colors: {
          primary: 0xff6f00,     // Royal saffron waistcoat
          secondary: 0xffffff,   // Pure white silk kurta
          pants: 0xffffff,       // White churidar
          accent: 0xffd54f,      // Gold trim
          hairOrHelmet: 0xf2f2f2,
          skin: 0xd7a176,
          details: 0xffb300      // Gold spectacles
        },
        features: {
          hasSpectacles: true,
          hasKurtaWaistcoat: true
        }
      }
    ]
  }
];

export function getCharacterById(id: string): CharacterDefinition | undefined {
  return CHARACTER_CATALOG.find((c) => c.id === id);
}

export function getOutfitById(charId: string, outfitId: string): OutfitDefinition | undefined {
  const char = getCharacterById(charId);
  if (!char) return undefined;
  return char.outfits.find((o) => o.id === outfitId);
}

export function getAllCharacters(): CharacterDefinition[] {
  return CHARACTER_CATALOG;
}
