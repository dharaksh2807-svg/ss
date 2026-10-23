import { EnvironmentId, EnvironmentTheme, MODERN_METRO_THEME, HISTORIC_QUARTER_THEME, NEON_INDUSTRIAL_THEME, ENVIRONMENTS } from './EnvironmentConfig';

export class EnvironmentRegistry {
  private static instance: EnvironmentRegistry;
  private themes: Map<EnvironmentId, EnvironmentTheme> = new Map();

  private constructor() {
    this.register(MODERN_METRO_THEME);
    this.register(HISTORIC_QUARTER_THEME);
    this.register(NEON_INDUSTRIAL_THEME);
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

  public getNextRandomTransition(currentId: EnvironmentId, rng: () => number, excludePrevious?: EnvironmentId): EnvironmentId {
    const current = this.get(currentId);
    let candidates = current.allowedTransitions.filter((id) => id !== currentId);
    if (excludePrevious && candidates.length > 1) {
      candidates = candidates.filter((id) => id !== excludePrevious);
    }
    if (candidates.length === 0) {
      candidates = this.getAllIds().filter((id) => id !== currentId);
    }
    if (candidates.length === 0) {
      return currentId;
    }
    const idx = Math.floor(rng() * candidates.length);
    return candidates[idx];
  }
}
