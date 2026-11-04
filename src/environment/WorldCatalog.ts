import type { EnvironmentId } from './EnvironmentConfig';
import { EnvironmentRegistry } from './EnvironmentRegistry';

export const FREE_WORLD_IDS = ['MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL'] as const satisfies readonly EnvironmentId[];
export type WorldId = EnvironmentId | 'NEON_RAINLINE' | 'ORBITAL_HALO' | 'ABYSSAL_GLASSLINE' | 'DOOMSDAY_LAST_TRANSIT' | 'PHANTOM_LINE' | 'HAUNTED_CARNIVAL' | 'VIP_EXPRESS' | 'RAHULVERSE' | 'MIDNIGHT_VELVET' | 'CHRONO_KINGDOM' | 'INFERNO_EXPRESS' | 'JURASSIC_RUSH';
export type WorldSelection = WorldId | 'DYNAMIC';

export interface WorldDefinition {
  readonly id: WorldId;
  readonly environmentId: WorldId;
  readonly displayName: string;
  readonly description: string;
  readonly subtitle?: string;
  readonly tagline?: string;
  readonly rarity: 'COMMON' | 'EPIC' | 'LEGENDARY';
  readonly unlock: 'FREE' | 'COINS';
  readonly coinCost: number;
  readonly keyCost: number | null;
  readonly previewReference: string | null;
  readonly previewImage: string;
  readonly features: readonly string[];
  readonly implemented: boolean;
  readonly available: boolean;
  readonly dynamicEligible: boolean;
  readonly icon: string;
  readonly accentColor: string;
  readonly signatureCharacterId?: string;
  readonly signatureLabel?: string;
  readonly isSignatureWorld?: boolean;
}

// Provisional proposal, not sale prices: early missions award 250 coins each;
// the daily coin goal awards 500 plus 200–400 collected coins (MissionCatalog).
// 3,000 / 4,500 / 6,000 represent 12 / 18 / 24 early mission rewards,
// roughly 4–9 daily coin goals. These are reward estimates, not measured per-run earnings.
// Keys remain reserved for revives until a fair cosmetic exchange rate is known.
const PREMIUM_WORLDS: readonly WorldDefinition[] = [
  {
    id: 'NEON_RAINLINE', environmentId: 'NEON_RAINLINE', displayName: 'Neon Rainline',
    description: 'A rain-soaked neon megacity illuminated by holographic transit arches, towering megastructures, and glistening rails.',
    subtitle: 'Cyberpunk Rain Corridor',
    tagline: 'High-speed rails slicing through electric storm rain and holographic ads.',
    rarity: 'EPIC',
    unlock: 'COINS', coinCost: 3000, keyCost: null, previewReference: 'environment:NEON_RAINLINE',
    previewImage: '/worlds/neon_rainline.png',
    features: ['Holographic Arches', 'Reflective Rain Puddles', 'Futuristic Maglevs'],
    implemented: true, available: true, dynamicEligible: true, icon: '🌧️', accentColor: '#e879f9'
  },
  {
    id: 'ORBITAL_HALO', environmentId: 'ORBITAL_HALO', displayName: 'Orbital Halo',
    description: 'An immense futuristic orbital transportation station overlooking a breathtaking planet, with sweeping megastructure rings and celestial transit rails.',
    subtitle: 'Celestial Planetary Orbit',
    tagline: 'Defy gravity along sweeping orbital rings above a glowing planetary horizon.',
    rarity: 'LEGENDARY',
    unlock: 'COINS', coinCost: 4500, keyCost: null, previewReference: 'environment:ORBITAL_HALO',
    previewImage: '/worlds/orbital_halo.png',
    features: ['Planetary Atmosphere', 'Quantum Maglev Trains', 'Spacecraft Docks'],
    implemented: true, available: true, dynamicEligible: true, icon: '🪐', accentColor: '#38bdf8'
  },
  {
    id: 'ABYSSAL_GLASSLINE', environmentId: 'ABYSSAL_GLASSLINE', displayName: 'Abyssal Glassline',
    description: 'A colossal glass transit railway through the deep ocean abyss, surrounded by luminescent sea life, submerged megacity domes, and hydrothermal trench architecture.',
    subtitle: 'Deep Ocean Megacity',
    tagline: 'Rush through pressurized transparent tubes surrounded by deep-sea leviathans.',
    rarity: 'LEGENDARY',
    unlock: 'COINS', coinCost: 6000, keyCost: null, previewReference: 'environment:ABYSSAL_GLASSLINE',
    previewImage: '/worlds/abyssal_glassline.png',
    features: ['Bioluminescent Fauna', 'Submerged Domes', 'Hydrodynamic Maglevs'],
    implemented: true, available: true, dynamicEligible: true, icon: '🌊', accentColor: '#22d3ee'
  },
  {
    id: 'DOOMSDAY_LAST_TRANSIT', environmentId: 'DOOMSDAY_LAST_TRANSIT', displayName: 'Doomsday: Last Transit',
    description: 'The final functioning evacuation railway through the ruins of a collapsing futuristic metropolis, framed by shattered monolithic skyscrapers, burning horizons, falling ash, and emergency distress beacons.',
    subtitle: 'Cataclysmic Evacuation Line',
    tagline: 'Escape across fractured rail corridors as an apocalyptic skyline burns.',
    rarity: 'LEGENDARY',
    unlock: 'COINS', coinCost: 7500, keyCost: null, previewReference: 'environment:DOOMSDAY_LAST_TRANSIT',
    previewImage: '/worlds/doomsday_last_transit.png',
    features: ['Monolithic Ruined Spires', 'Burning Ember Skies', 'Armored Evacuation Trains'],
    implemented: true, available: true, dynamicEligible: true, icon: '☄️', accentColor: '#f97316'
  },
  {
    id: 'PHANTOM_LINE', environmentId: 'PHANTOM_LINE', displayName: 'Phantom Line',
    description: 'An abandoned subterranean transit system gripped by chilling tension, decaying Victorian-modern platforms, flickering cathode fluorescents, shadowy apparitions, and silent ghost trains.',
    subtitle: 'Subterranean Ghost Horror',
    tagline: 'Navigate decaying Victorian subway catacombs haunted by silent spectral trains.',
    rarity: 'LEGENDARY',
    unlock: 'COINS', coinCost: 9000, keyCost: null, previewReference: 'environment:PHANTOM_LINE',
    previewImage: '/worlds/phantom_line.png',
    features: ['Eerie Apparitions', 'Ghost Train Sidings', 'Decaying Subway Ceramic'],
    implemented: true, available: true, dynamicEligible: true, icon: '👻', accentColor: '#67e8f9'
  },
  {
    id: 'HAUNTED_CARNIVAL', environmentId: 'HAUNTED_CARNIVAL', displayName: 'Haunted Carnival',
    description: 'An extravagant gothic theme park railway flanked by towering castles, glowing jack-o\'-lantern shrines, creepy carnival big tops, and an immense rotating haunted Ferris wheel.',
    subtitle: 'Gothic Halloween Fairground',
    tagline: 'Ride through a supernatural carnival with giant glowing jack-o\'-lanterns and castles.',
    rarity: 'LEGENDARY',
    unlock: 'COINS', coinCost: 10500, keyCost: null, previewReference: 'environment:HAUNTED_CARNIVAL',
    previewImage: '/worlds/haunted_carnival.png',
    features: ['Rotating Ferris Wheel', 'Giant Pumpkin Shrines', 'Haunted Big-Top Tents'],
    implemented: true, available: true, dynamicEligible: true, icon: '🎃', accentColor: '#f97316'
  },
  {
    id: 'VIP_EXPRESS', environmentId: 'VIP_EXPRESS', displayName: 'Mitron Express',
    description: 'A grand fictional VIP ceremonial concourse featuring futuristic civic architecture, red-carpet walkways, endless ribbon cuttings, paparazzi chaos, and comedic political celebrations.',
    subtitle: 'The Great Inauguration',
    tagline: 'High-speed inaugural rails through grand plazas, endless ribbons, and paparazzi frenzy.',
    rarity: 'LEGENDARY',
    unlock: 'FREE', coinCost: 0, keyCost: null, previewReference: 'environment:VIP_EXPRESS',
    previewImage: '/worlds/vip_express.png',
    features: ['Never-Ending Ribbons', 'Camera Crew Chaos', 'Triumphal VIP Arches'],
    implemented: true, available: true, dynamicEligible: false, icon: '🏛️', accentColor: '#f59e0b',
    signatureCharacterId: 'char_modi',
    signatureLabel: 'MODI SIGNATURE WORLD',
    isSignatureWorld: true
  },
  {
    id: 'RAHULVERSE', environmentId: 'RAHULVERSE', displayName: 'Rahulverse: The Never-Ending Yatra',
    description: 'An absurdly entertaining, epic political-satire journey across five distinct comedy districts: endless walking yatras, parliamentary pandemonium, press conference panic, alliance rollercoasters, and the political multiverse.',
    subtitle: 'The Never-Ending Yatra',
    tagline: 'Run across vibrant Indian streets, runaway microphones, media scrums, and endless political adventures.',
    rarity: 'LEGENDARY',
    unlock: 'FREE', coinCost: 0, keyCost: null, previewReference: 'environment:RAHULVERSE',
    previewImage: '/worlds/rahulverse.png',
    features: ['Infinite Yatra Finish Lines', 'Runaway Microphones', 'Alliance Rollercoasters'],
    implemented: true, available: true, dynamicEligible: false, icon: '🚩', accentColor: '#38bdf8',
    signatureCharacterId: 'char_rahul_gandhi',
    signatureLabel: 'RAHUL SIGNATURE WORLD',
    isSignatureWorld: true
  },
  {
    id: 'MIDNIGHT_VELVET', environmentId: 'MIDNIGHT_VELVET', displayName: 'Midnight Velvet: After Dark',
    description: 'An exclusive, ultra-luxury after-dark metropolis featuring breathtaking Art Deco towers, champagne gold accents, moonlight yacht marinas, vibrant rooftop lounges, and the monumental Midnight Grand railway terminal.',
    subtitle: 'Luxury After Dark',
    tagline: 'Classic Art Deco towers, champagne gold facades, luxury yacht marinas, and exclusive midnight clubs.',
    rarity: 'LEGENDARY',
    unlock: 'COINS', coinCost: 15000, keyCost: null, previewReference: 'environment:MIDNIGHT_VELVET',
    previewImage: '/worlds/midnight_velvet.png',
    features: ['Art Deco Grandeur', 'Moonlight Marina', 'The Golden Hour Club', 'Midnight Grand Terminal'],
    implemented: true, available: true, dynamicEligible: true, icon: '🍸', accentColor: '#d4af37'
  },
  {
    id: 'CHRONO_KINGDOM', environmentId: 'CHRONO_KINGDOM', displayName: 'Chrono Kingdom',
    description: 'A colossal steampunk clockwork empire where steam-powered trains race through majestic mechanical cities of moving gears, golden towers, glowing furnaces, and celestial observatories.',
    subtitle: 'The Clockwork Empire',
    tagline: 'Race through colossal steampunk cities of moving gears, golden clocktowers, and celestial observatories.',
    rarity: 'LEGENDARY',
    unlock: 'COINS', coinCost: 18000, keyCost: null, previewReference: 'environment:CHRONO_KINGDOM',
    previewImage: '/worlds/chrono_kingdom.png',
    features: ['Grand Clockwork Capital', 'Time Foundry', 'Chrono Observatory', 'Fractured Time Rifts'],
    implemented: true, available: true, dynamicEligible: true, icon: '⚙️', accentColor: '#d4af37'
  },
  {
    id: 'INFERNO_EXPRESS', environmentId: 'INFERNO_EXPRESS', displayName: 'Inferno Express',
    description: 'An intense, spectacular fantasy volcanic railway world where trains race across lava oceans, obsidian fortresses, colossal magma cataracts, and glowing foundry machinery.',
    subtitle: 'Rails Through Hellfire',
    tagline: 'Race across glowing lava seas, towering obsidian citadels, and volcanic ashfall summits.',
    rarity: 'LEGENDARY',
    unlock: 'COINS', coinCost: 18000, keyCost: null, previewReference: 'environment:INFERNO_EXPRESS',
    previewImage: '/worlds/inferno_express.png',
    features: ['Molten Lava Ocean', 'Obsidian Citadel', 'Magma Foundry', 'Ashfall Summit'],
    implemented: true, available: true, dynamicEligible: true, icon: '🌋', accentColor: '#f97316'
  },
  {
    id: 'JURASSIC_RUSH', environmentId: 'JURASSIC_RUSH', displayName: 'Jurassic Rush',
    description: 'An exhilarating prehistoric railway world filled with colossal dinosaurs, ancient jungle waterfalls, dramatic canyon gorges, mysterious megalithic ruins, and rugged expedition trains.',
    subtitle: 'The Lost World Railway',
    tagline: 'Thunder through prehistoric jungles, waterfall canyons, ancient ruins, and dinosaur encounters.',
    rarity: 'LEGENDARY',
    unlock: 'COINS', coinCost: 18000, keyCost: null, previewReference: 'environment:JURASSIC_RUSH',
    previewImage: '/worlds/jurassic_rush.png',
    features: ['Lost Jungle Canopy', 'Valley of Giants', 'Raptor Canyon', 'Ancient Sanctuary'],
    implemented: true, available: true, dynamicEligible: true, icon: '🦖', accentColor: '#10b981'
  }
];

export interface WorldProgress {
  unlockedThemes: readonly WorldId[];
  selectedTheme: WorldSelection;
  includePremiumThemesInDynamic: boolean;
  unlockedCharacters?: readonly string[];
  selectedCharacter?: string;
  modiFreeRuns?: number;
  rahulTrialsRemaining?: number;
  rahulFreeRuns?: number;
}

function normalizeCharacterId(charId?: string): string | undefined {
  if (!charId) return undefined;
  if (charId === 'rahul_gandhi' || charId === 'char_rahul_gandhi') return 'char_rahul_gandhi';
  if (charId === 'modi' || charId === 'char_modi') return 'char_modi';
  return charId;
}

function getSignatureTrialRuns(signatureCharId: string, progress: WorldProgress): number {
  const norm = normalizeCharacterId(signatureCharId);
  if (norm === 'char_modi') {
    return progress.modiFreeRuns ?? 0;
  }
  if (norm === 'char_rahul_gandhi') {
    return progress.rahulTrialsRemaining ?? progress.rahulFreeRuns ?? 0;
  }
  return 0;
}

const FREE_WORLD_METADATA: Record<string, { previewImage: string; subtitle: string; tagline: string; features: string[] }> = {
  MODERN_METRO: {
    previewImage: '/worlds/modern_metro.png',
    subtitle: 'Sunlit Urban Metropolis',
    tagline: 'The iconic high-energy transit line through gleaming city skyscrapers.',
    features: ['Glass Skyscraper Skyline', 'LED Sign Gantries', 'Sleek Modern Transit']
  },
  HISTORIC_QUARTER: {
    previewImage: '/worlds/historic_quarter.png',
    subtitle: 'Golden Hour Heritage Railway',
    tagline: 'Vintage charm along classic brownstones and industrial brick foundries.',
    features: ['Victorian Brownstones', 'Cobblestone Ballast', 'Aged Iron Telegraphs']
  },
  UNDERGROUND_METRO: {
    previewImage: '/worlds/underground_metro.png',
    subtitle: 'Subterranean Deep Tunnel',
    tagline: 'Dark vaulted tunnels echoing with high-speed commuter trains.',
    features: ['Cavernous Subway Tubes', 'Fluorescent Fixtures', 'Deep Rail Rumble']
  },
  NEON_INDUSTRIAL: {
    previewImage: '/worlds/neon_industrial.png',
    subtitle: 'Molten Foundry Yard',
    tagline: 'Glowing amber blast furnaces and towering gantry crane machinery.',
    features: ['Heavy Factory Silos', 'Molten Amber Foundry Glow', 'Gantry Cranes']
  }
};

export function getWorldCatalog(): readonly WorldDefinition[] {
  const registry = EnvironmentRegistry.getInstance();
  return [
    ...FREE_WORLD_IDS.map((id): WorldDefinition => {
      const theme = registry.get(id);
      const meta = FREE_WORLD_METADATA[id] || {
        previewImage: `/worlds/${id.toLowerCase()}.png`,
        subtitle: 'Playable District',
        tagline: theme.description,
        features: ['Modular Scenery', 'Dynamic Time', 'Full Collision Fairness']
      };
      return {
        id, environmentId: id, displayName: theme.displayName, description: theme.description,
        subtitle: meta.subtitle, tagline: meta.tagline,
        rarity: 'COMMON', unlock: 'FREE', coinCost: 0, keyCost: null,
        previewReference: `environment:${id}`, previewImage: meta.previewImage,
        features: meta.features,
        implemented: true, available: registry.has(id),
        dynamicEligible: true, icon: theme.badgeEmoji, accentColor: theme.accentColor
      };
    }),
    ...PREMIUM_WORLDS
  ];
}

export function getWorld(id: string): WorldDefinition | undefined {
  return getWorldCatalog().find((world) => world.id === id);
}

export function isWorldAvailable(world: WorldDefinition): boolean {
  return world.implemented && world.available && EnvironmentRegistry.getInstance().has(world.environmentId);
}

export function isThemePermanentlyOwned(world: WorldDefinition, progress: WorldProgress): boolean {
  if (world.signatureCharacterId) {
    const ownsChar = (progress.unlockedCharacters ?? []).some((id) => {
      return normalizeCharacterId(id) === world.signatureCharacterId;
    });
    const hasTheme = progress.unlockedThemes.includes(world.id);
    return ownsChar || hasTheme;
  }
  return world.unlock === 'FREE' || progress.unlockedThemes.includes(world.id);
}

export function getWorlds(progress: WorldProgress) {
  return getWorldCatalog().map((world) => {
    const isOwned = isThemePermanentlyOwned(world, progress);
    const selectedNorm = normalizeCharacterId(progress.selectedCharacter);
    const isTrialing = !!world.signatureCharacterId &&
      !isOwned &&
      selectedNorm === world.signatureCharacterId &&
      getSignatureTrialRuns(world.signatureCharacterId, progress) > 0;

    return {
      ...world,
      available: isWorldAvailable(world),
      owned: isOwned,
      trialing: isTrialing,
      playable: isOwned || isTrialing,
      equipped: progress.selectedTheme === world.id
    };
  });
}

export function getDynamicEnvironmentIds(progress: WorldProgress): EnvironmentId[] {
  const registry = EnvironmentRegistry.getInstance();
  return getWorlds(progress)
    .filter((world) => world.available && world.owned && world.dynamicEligible &&
      (world.unlock === 'FREE' || progress.includePremiumThemesInDynamic))
    .map((world) => registry.get(world.environmentId).id);
}
