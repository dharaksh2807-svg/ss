import * as THREE from 'three';
import { EventBus } from '../../core/EventBus';
import { SettingsManager } from '../../settings/SettingsManager';
import type { ChaserModel, ChaserCosmeticReaction } from '../../characters/ChaserModel';
import type { Player } from '../../player/Player';

export interface SatiricalNewsItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
}

export const SATIRICAL_NEWS_HEADLINES: SatiricalNewsItem[] = [
  {
    id: 'news_01',
    category: 'BREAKING NEWS',
    title: 'CHASER CLAIMS TO BE LEADING THE RACE',
    subtitle: 'Spokesperson clarifies: "We are simply advancing in reverse direction"'
  },
  {
    id: 'news_02',
    category: 'SPECIAL REPORT',
    title: 'CEREMONIAL RED CARPET UNFURLED FOR CHASER BY MISTAKE',
    subtitle: 'Protocol committee apologizes; runner given complimentary kulhad chai'
  },
  {
    id: 'news_03',
    category: 'STUDIO DEBATE',
    title: 'EMPTY CHAIR EXTENDS UNPRECEDENTED SILENCE TO 48TH HOUR',
    subtitle: 'TV anchor demands immediate retraction of imaginary statement'
  },
  {
    id: 'news_04',
    category: 'ALLIANCE WATCH',
    title: 'COALITION LEADERS SQUEEZE ONTO SAME SIDE OF TABLE',
    subtitle: 'Roundtable rotation paused to resolve middle-seat ownership rights'
  },
  {
    id: 'news_05',
    category: 'CAMPAIGN TRAIL',
    title: 'YATRA ROUTE EXTENDED ACROSS THE STRATOSPHERE',
    subtitle: 'Official map unrolls past track horizon; chai breaks scheduled on Mars'
  },
  {
    id: 'news_06',
    category: 'PARLIAMENT ALERT',
    title: 'POINT OF ORDER SLAMMED: MICROPHONE RUNS AWAY',
    subtitle: 'Both leaders seen chasing robotic arm across legislative gallery'
  },
  {
    id: 'news_07',
    category: 'MASTERSTROKE UPDATE',
    title: '500TH INAUGURATION RIBBON CUT BEFORE REACHING STATION',
    subtitle: 'Giant golden scissors require second ribbon to conclude ceremony'
  },
  {
    id: 'news_08',
    category: 'EXCLUSIVE POLL',
    title: '100% OF VOTERS AGREE: HIGH-DECIBEL TV DEBATES REQUIRE EARPLUGS',
    subtitle: 'Decibel meter breaks down; sound engineers request parliamentary hearing'
  }
];

/**
 * PoliticalComedySystem
 * Reusable comedy coordinator for Metro Runner 3D's Political Cinematic Universe.
 * Manages comedic timing, runner <-> chaser rivalry interactions, satirical breaking news tickers,
 * quality scaling, and reduced-motion accessibility.
 */
export class PoliticalComedySystem {
  private static instance: PoliticalComedySystem;

  private isEnabled: boolean = true;
  private cooldownTimer: number = 6.0; // Initial delay before first spontaneous gag
  private readonly defaultCooldownMin: number = 12.0;
  private readonly defaultCooldownMax: number = 18.0;
  private currentCooldownDuration: number = 14.0;

  private lastHeadlineIndex: number = -1;
  private activeBeat: string | null = null;
  private activeBeatTimer: number = 0;
  private quality: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';

  private constructor() {}

  public static getInstance(): PoliticalComedySystem {
    if (!PoliticalComedySystem.instance) {
      PoliticalComedySystem.instance = new PoliticalComedySystem();
    }
    return PoliticalComedySystem.instance;
  }

  public reset(): void {
    this.cooldownTimer = 6.0;
    this.activeBeat = null;
    this.activeBeatTimer = 0;
  }

  public isPoliticalWorld(envId: string): boolean {
    return envId === 'VIP_EXPRESS' || envId === 'RAHULVERSE';
  }

  public isPoliticalRivalryActive(charId: string, chaserArchetype: string): boolean {
    const isPoliticalChar = charId === 'char_modi' || charId === 'char_rahul_gandhi';
    const isPoliticalChaser = chaserArchetype === 'MODI_RIVAL' || chaserArchetype === 'RAHUL_RIVAL' || chaserArchetype === 'VIP_SECURITY';
    return isPoliticalChar || isPoliticalChaser;
  }

  /**
   * Main per-frame update loop called from Game engine
   */
  public update(
    dt: number,
    player: Player,
    chaser: ChaserModel,
    activeEnvId: string
  ): void {
    if (!this.isEnabled) return;

    const charId = player?.model?.getCharacterId?.() || '';
    const chaserArchetype = chaser?.getArchetype?.() || '';
    const isPolitical = this.isPoliticalWorld(activeEnvId) || this.isPoliticalRivalryActive(charId, chaserArchetype);

    if (!isPolitical) return;

    // Tick active beat timer
    if (this.activeBeatTimer > 0) {
      this.activeBeatTimer -= dt;
      if (this.activeBeatTimer <= 0) {
        this.activeBeat = null;
      }
    }

    // Step cooldown timer
    this.cooldownTimer -= dt;
    if (this.cooldownTimer <= 0) {
      this.triggerSpontaneousComedyBeat(charId, chaser);
      // Reset cooldown with slight pseudo-random variation
      this.currentCooldownDuration = this.defaultCooldownMin + Math.random() * (this.defaultCooldownMax - this.defaultCooldownMin);
      this.cooldownTimer = this.currentCooldownDuration;
    }
  }

  /**
   * Triggers a comedic setup/twist/punchline beat between runner and chaser
   */
  private triggerSpontaneousComedyBeat(charId: string, chaser: ChaserModel): void {
    const isReducedMotion = typeof window !== 'undefined' && SettingsManager.getInstance().isReducedMotion();
    const beats: ChaserCosmeticReaction[] = [
      'NAMASTE_SHRUG',
      'SELFIE_FLASH',
      'CAMERA_WAVE',
      'MICROPHONE_DUCK',
      'PRESS_CONFERENCE_ENTER'
    ];

    const chosenBeat = beats[Math.floor(Math.random() * beats.length)];
    this.activeBeat = chosenBeat;
    this.activeBeatTimer = 2.0;

    // Trigger cosmetic reaction on Chaser
    if (chaser && typeof chaser.triggerCosmeticReaction === 'function') {
      chaser.triggerCosmeticReaction(chosenBeat, isReducedMotion ? 2.5 : 1.8);
    }

    // Every other comedy beat, broadcast a satirical breaking news item
    if (Math.random() > 0.4) {
      const headline = this.getSatiricalNewsHeadline();
      EventBus.getInstance().emit('POLITICAL_NEWS_ALERT', headline);
    }
  }

  /**
   * Manually trigger a specific beat for deterministic unit tests and cinematic capture
   */
  public triggerManualBeat(beat: ChaserCosmeticReaction, chaser: ChaserModel): void {
    this.activeBeat = beat;
    this.activeBeatTimer = 2.0;
    if (chaser && typeof chaser.triggerCosmeticReaction === 'function') {
      chaser.triggerCosmeticReaction(beat, 2.0);
    }
  }

  /**
   * Returns a satirical fictional news headline
   */
  public getSatiricalNewsHeadline(variant?: number): SatiricalNewsItem {
    if (variant !== undefined && variant >= 0 && variant < SATIRICAL_NEWS_HEADLINES.length) {
      return SATIRICAL_NEWS_HEADLINES[variant];
    }
    let nextIdx = (this.lastHeadlineIndex + 1) % SATIRICAL_NEWS_HEADLINES.length;
    this.lastHeadlineIndex = nextIdx;
    return SATIRICAL_NEWS_HEADLINES[nextIdx];
  }

  /**
   * Broadcasts a satirical breaking news item via EventBus and returns the item
   */
  public triggerBreakingNews(variant?: number): SatiricalNewsItem {
    const headline = this.getSatiricalNewsHeadline(variant);
    EventBus.getInstance().emit('POLITICAL_NEWS_ALERT', {
      headline: headline.title,
      subtitle: headline.subtitle,
      tickerCategory: headline.category
    });
    return headline;
  }

  public getCooldownRemaining(): number {
    return Math.max(0, this.cooldownTimer);
  }

  public setQuality(quality: 'HIGH' | 'MEDIUM' | 'LOW'): void {
    this.quality = quality;
  }

  public getQuality(): 'HIGH' | 'MEDIUM' | 'LOW' {
    return this.quality;
  }

  public getMaxLiveGags(): number {
    switch (this.quality) {
      case 'HIGH': return 6;
      case 'MEDIUM': return 4;
      case 'LOW': return 2;
    }
  }

  /**
   * Quality-dependent density and animation count helpers
   */
  public getNpcCountLimit(quality: 'FULL' | 'BALANCED' | 'MINIMAL'): number {
    switch (quality) {
      case 'FULL': return 40;
      case 'BALANCED': return 22;
      case 'MINIMAL': return 10;
    }
  }

  public getParticleBudget(quality: 'FULL' | 'BALANCED' | 'MINIMAL'): number {
    switch (quality) {
      case 'FULL': return 24;
      case 'BALANCED': return 12;
      case 'MINIMAL': return 0;
    }
  }

  /**
   * Reduced-motion helper for smooth accessibility scaling
   */
  public scaleAnimationMotion(baseMotion: number): number {
    const isReducedMotion = typeof window !== 'undefined' && SettingsManager.getInstance().isReducedMotion();
    return isReducedMotion ? baseMotion * 0.35 : baseMotion;
  }
}
