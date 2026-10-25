import './style.css';
import { Game } from './core/Game';
import { EventBus, EVENTS } from './core/EventBus';
import { PacingMetrics } from './track/PacingMetrics';

import { SkillComboManager } from './core/SkillComboManager';

// Expose on window for runtime testing and scripts
(window as any).__METRO_BUS__ = EventBus.getInstance();
(window as any).__METRO_EVENTS__ = EVENTS;
(window as any).__PACING_METRICS__ = PacingMetrics.getInstance();
(window as any).__SKILL_COMBO__ = SkillComboManager.getInstance();

// Initialize the game once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  try {
    const game = new Game();
    (window as any).__METRO_GAME__ = game;
    console.log('🎮 Metro Runner 3D initialized successfully!');
  } catch (err) {
    console.error('Failed to initialize Metro Runner 3D:', err);
  }
});
