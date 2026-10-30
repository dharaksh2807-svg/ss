import './style.css';
import { Game } from './core/Game';
import { EventBus, EVENTS } from './core/EventBus';
import { PacingMetrics } from './track/PacingMetrics';
import { isDeveloperMode } from './core/Constants';

import { SkillComboManager } from './core/SkillComboManager';
import { DailyChallengeManager } from './core/DailyChallengeManager';
import { PhotoModeController } from './scene/PhotoModeController';
import { SecretRouteDirector } from './track/SecretRouteDirector';
import { JunctionDirector } from './track/JunctionDirector';

// Expose on window only in development mode for runtime testing and diagnostic scripts
if (isDeveloperMode()) {
  (window as any).EventBus = EventBus;
  (window as any).__METRO_BUS__ = EventBus.getInstance();
  (window as any).__METRO_EVENTS__ = EVENTS;
  (window as any).__PACING_METRICS__ = PacingMetrics.getInstance();
  (window as any).__SKILL_COMBO__ = SkillComboManager.getInstance();
  (window as any).__DAILY_CHALLENGE__ = DailyChallengeManager.getInstance();
  (window as any).__PHOTO_MODE__ = PhotoModeController.getInstance();
  (window as any).__SECRET_ROUTES__ = SecretRouteDirector.getInstance();
  (window as any).__JUNCTIONS__ = JunctionDirector.getInstance();
}

// Initialize the game once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new Game();
    if (isDeveloperMode()) {
      (window as any).__METRO_GAME__ = game;
      (window as any).game = game;
    }
    console.log('🎮 Metro Runner 3D initialized successfully!');
  } catch (err) {
    console.error('Failed to initialize Metro Runner 3D:', err);
  }
});
