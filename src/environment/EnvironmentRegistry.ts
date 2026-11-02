import {
  EnvironmentId,
  EnvironmentTheme,
  MODERN_METRO_THEME,
  HISTORIC_QUARTER_THEME,
  UNDERGROUND_METRO_THEME,
  NEON_INDUSTRIAL_THEME,
  NEON_RAINLINE_THEME,
  ORBITAL_HALO_THEME,
  ENVIRONMENTS
} from './EnvironmentConfig';

export class EnvironmentRegistry {
  private static instance: EnvironmentRegistry;
  private themes: Map<EnvironmentId, EnvironmentTheme> = new Map();

  private constructor() {
    this.register(MODERN_METRO_THEME);
    this.register(HISTORIC_QUARTER_THEME);
    this.register(UNDERGROUND_METRO_THEME);
    this.register(NEON_INDUSTRIAL_THEME);
    this.register(NEON_RAINLINE_THEME);
    this.register(ORBITAL_HALO_THEME);
  }

  public static getInstance(): EnvironmentRegistry {
    if (!EnvironmentRegistry.instance) {
      EnvironmentRegistry.instance = new EnvironmentRegistry();
    }
    return EnvironmentRegistry.instance;
  }

  public register(theme: EnvironmentTheme): void {
    this.themes.set(theme.id, theme);
    (ENVIRONMENTS as any)[theme.id] = theme;
  }

  public get(id: EnvironmentId | string): EnvironmentTheme {
    const theme = this.themes.get(id as EnvironmentId);
    if (theme) return theme;
    return MODERN_METRO_THEME;
  }

  public has(id: string): boolean {
    return this.themes.has(id as EnvironmentId);
  }

  public getAll(): EnvironmentTheme[] {
    return Array.from(this.themes.values());
  }

  public getAllIds(): EnvironmentId[] {
    return Array.from(this.themes.keys());
  }

  public getAllowedTransitions(id: EnvironmentId | string): EnvironmentId[] {
    const theme = this.get(id);
    return theme ? [...theme.allowedTransitions] : [];
  }

  public getNextRandomTransition(currentId: EnvironmentId, rng: () => number, excludePrevious?: EnvironmentId, eligibleIds: readonly EnvironmentId[] = this.getAllIds()): EnvironmentId {
    const current = this.get(currentId);
    let candidates = current.allowedTransitions.filter((id) => id !== currentId && this.has(id) && eligibleIds.includes(id));
    if (excludePrevious && candidates.length > 1) {
      candidates = candidates.filter((id) => id !== excludePrevious);
    }
    if (candidates.length === 0) {
      candidates = this.getAllIds().filter((id) => id !== currentId && eligibleIds.includes(id));
    }
    if (candidates.length === 0) {
      return currentId;
    }
    const idx = Math.floor(rng() * candidates.length);
    return candidates[idx];
  }
}
