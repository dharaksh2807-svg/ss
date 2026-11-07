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
import { EnvironmentManager } from './environment/EnvironmentConfig';
import { VipComedyEventDirector } from './environment/VipComedyEventDirector';
import { RahulComedyEventDirector } from './environment/worlds/rahulverse/RahulComedyEventDirector';
import { MidnightVelvetEventDirector } from './environment/worlds/midnightVelvet/MidnightVelvetEventDirector';
import { ChronoKingdomEventDirector } from './environment/worlds/chronoKingdom/ChronoKingdomEventDirector';
import { InfernoExpressEventDirector } from './environment/worlds/infernoExpress/InfernoExpressEventDirector';
import { JurassicRushEventDirector } from './environment/worlds/jurassicRush/JurassicRushEventDirector';
import { FeverDirector } from './environment/worlds/vivaHeat/FeverDirector';
import { HauntedCarnivalEventDirector } from './environment/worlds/hauntedCarnival/HauntedCarnivalEventDirector';
import { PhantomLineEventDirector } from './environment/worlds/phantomLine/PhantomLineEventDirector';

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
  (window as any).__VIP_DIRECTOR__ = VipComedyEventDirector.getInstance();
  (window as any).__RAHUL_DIRECTOR__ = RahulComedyEventDirector.getInstance();
  (window as any).__MIDNIGHT_DIRECTOR__ = MidnightVelvetEventDirector.getInstance();
  (window as any).__CHRONO_DIRECTOR__ = ChronoKingdomEventDirector.getInstance();
  (window as any).__INFERNO_DIRECTOR__ = InfernoExpressEventDirector.getInstance();
  (window as any).__JURASSIC_DIRECTOR__ = JurassicRushEventDirector.getInstance();
  (window as any).__FEVER_DIRECTOR__ = FeverDirector.getInstance();
  (window as any).__HAUNTED_DIRECTOR__ = HauntedCarnivalEventDirector.getInstance();
  (window as any).__PHANTOM_DIRECTOR__ = PhantomLineEventDirector.getInstance();
  (window as any).__DEV_SET_WORLD__ = (worldId: any) => {
    EnvironmentManager.getInstance().setDevPreviewEnvironment(worldId);
  };

  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const preview = urlParams.get('world') || urlParams.get('preview');
    if (preview && preview.toUpperCase() === 'VIVA_HEAT') {
      EnvironmentManager.getInstance().setDevPreviewEnvironment('VIVA_HEAT');
    }
  }
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
