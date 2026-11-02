import type { EnvironmentId } from './EnvironmentConfig';
import { EnvironmentRegistry } from './EnvironmentRegistry';

export const FREE_WORLD_IDS = ['MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO', 'NEON_INDUSTRIAL'] as const satisfies readonly EnvironmentId[];
export type WorldId = EnvironmentId | 'NEON_RAINLINE' | 'ORBITAL_HALO' | 'ABYSSAL_GLASSLINE';
export type WorldSelection = WorldId | 'DYNAMIC';

export interface WorldDefinition {
  readonly id: WorldId;
  readonly environmentId: WorldId;
  readonly displayName: string;
  readonly description: string;
  readonly rarity: 'COMMON' | 'EPIC' | 'LEGENDARY';
  readonly unlock: 'FREE' | 'COINS';
  readonly coinCost: number;
  readonly keyCost: number | null;
  readonly previewReference: string | null;
  readonly implemented: boolean;
  readonly available: boolean;
  readonly dynamicEligible: boolean;
  readonly icon: string;
  readonly accentColor: string;
}

// Provisional proposal, not sale prices: early missions award 250 coins each;
// the daily coin goal awards 500 plus 200–400 collected coins (MissionCatalog).
// 3,000 / 4,500 / 6,000 represent 12 / 18 / 24 early mission rewards,
// roughly 4–9 daily coin goals. These are reward estimates, not measured per-run earnings.
// Keys remain reserved for revives until a fair cosmetic exchange rate is known.
const PREMIUM_WORLDS: readonly WorldDefinition[] = [
  {
    id: 'NEON_RAINLINE', environmentId: 'NEON_RAINLINE', displayName: 'Neon Rainline',
    description: 'A rain-soaked neon megacity illuminated by holographic transit arches, towering megastructures, and glistening rails.', rarity: 'EPIC',
    unlock: 'COINS', coinCost: 3000, keyCost: null, previewReference: 'environment:NEON_RAINLINE',
    implemented: true, available: true, dynamicEligible: true, icon: '🌧️', accentColor: '#e879f9'
  },
  {
    id: 'ORBITAL_HALO', environmentId: 'ORBITAL_HALO', displayName: 'Orbital Halo',
    description: 'An immense futuristic orbital transportation station overlooking a breathtaking planet, with sweeping megastructure rings and celestial transit rails.', rarity: 'LEGENDARY',
    unlock: 'COINS', coinCost: 4500, keyCost: null, previewReference: 'environment:ORBITAL_HALO',
    implemented: true, available: true, dynamicEligible: true, icon: '🪐', accentColor: '#38bdf8'
  },
  {
    id: 'ABYSSAL_GLASSLINE', environmentId: 'ABYSSAL_GLASSLINE', displayName: 'Abyssal Glassline',
    description: 'A colossal glass transit railway through the deep ocean abyss, surrounded by luminescent sea life, submerged megacity domes, and hydrothermal trench architecture.', rarity: 'LEGENDARY',
    unlock: 'COINS', coinCost: 6000, keyCost: null, previewReference: 'environment:ABYSSAL_GLASSLINE',
    implemented: true, available: true, dynamicEligible: true, icon: '🌊', accentColor: '#22d3ee'
  }
];

export interface WorldProgress {
  unlockedThemes: readonly WorldId[];
  selectedTheme: WorldSelection;
  includePremiumThemesInDynamic: boolean;
}

export function getWorldCatalog(): readonly WorldDefinition[] {
  const registry = EnvironmentRegistry.getInstance();
  return [
    ...FREE_WORLD_IDS.map((id): WorldDefinition => {
      const theme = registry.get(id);
      return {
        id, environmentId: id, displayName: theme.displayName, description: theme.description,
        rarity: 'COMMON', unlock: 'FREE', coinCost: 0, keyCost: null,
        previewReference: `environment:${id}`, implemented: true, available: registry.has(id),
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

export function getWorlds(progress: WorldProgress) {
  return getWorldCatalog().map((world) => ({
    ...world,
    available: isWorldAvailable(world),
    owned: world.unlock === 'FREE' || progress.unlockedThemes.includes(world.id),
    equipped: progress.selectedTheme === world.id
  }));
}

export function getDynamicEnvironmentIds(progress: WorldProgress): EnvironmentId[] {
  const registry = EnvironmentRegistry.getInstance();
  return getWorlds(progress)
    .filter((world) => world.available && world.owned && world.dynamicEligible &&
      (world.unlock === 'FREE' || progress.includePremiumThemesInDynamic))
    .map((world) => registry.get(world.environmentId).id);
}
