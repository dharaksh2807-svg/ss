import {
  Mission,
  DailyChallenge,
  AchievementDefinition,
  SeasonPass,
  GameModeConfig
} from './ProgressionTypes';

export const MISSION_SETS: Record<number, Omit<Mission, 'progress' | 'completed' | 'claimed'>[]> = {
  1: [
    {
      id: 'set1_m1',
      set: 1,
      title: 'Track Warmup',
      description: 'Run 500 meters total across your runs.',
      type: 'DISTANCE',
      target: 500,
      rewardCoins: 250
    },
    {
      id: 'set1_m2',
      set: 1,
      title: 'Pocket Change',
      description: 'Collect 50 gold coins along the tracks.',
      type: 'COINS',
      target: 50,
      rewardCoins: 250
    },
    {
      id: 'set1_m3',
      set: 1,
      title: 'Leap of Faith',
      description: 'Jump 10 times to dodge low obstacles.',
      type: 'JUMPS',
      target: 10,
      rewardCoins: 250
    }
  ],
  2: [
    {
      id: 'set2_m1',
      set: 2,
      title: 'Low Profile',
      description: 'Slide under 10 high barriers or arches.',
      type: 'SLIDES',
      target: 10,
      rewardCoins: 400
    },
    {
      id: 'set2_m2',
      set: 2,
      title: 'Single-Run Spree',
      description: 'Collect 100 coins in a single run.',
      type: 'COINS',
      target: 100,
      inSingleRun: true,
      rewardCoins: 450
    },
    {
      id: 'set2_m3',
      set: 2,
      title: 'Agile Runner',
      description: 'Dodge 15 obstacles cleanly.',
      type: 'OBSTACLES',
      target: 15,
      rewardCoins: 400
    }
  ],
  3: [
    {
      id: 'set3_m1',
      set: 3,
      title: 'Power Surge',
      description: 'Activate 3 power-ups during gameplay.',
      type: 'POWERUPS',
      target: 3,
      rewardCoins: 600
    },
    {
      id: 'set3_m2',
      set: 3,
      title: 'Close Call',
      description: 'Achieve 3 near-miss dodges past moving trains.',
      type: 'NEAR_MISS',
      target: 3,
      rewardCoins: 600
    },
    {
      id: 'set3_m3',
      set: 3,
      title: 'Score Milestone',
      description: 'Score 5,000 points in a single run.',
      type: 'SCORE',
      target: 5000,
      inSingleRun: true,
      rewardCoins: 650
    }
  ],
  4: [
    {
      id: 'set4_m1',
      set: 4,
      title: 'Endurance Test',
      description: 'Run 2,000 meters across your runs.',
      type: 'DISTANCE',
      target: 2000,
      rewardCoins: 800
    },
    {
      id: 'set4_m2',
      set: 4,
      title: 'Coin Magnetism',
      description: 'Collect 250 gold coins.',
      type: 'COINS',
      target: 250,
      rewardCoins: 850
    },
    {
      id: 'set4_m3',
      set: 4,
      title: 'Acrobatic Master',
      description: 'Perform 25 jumps over barriers and hurdles.',
      type: 'JUMPS',
      target: 25,
      rewardCoins: 800
    }
  ],
  5: [
    {
      id: 'set5_m1',
      set: 5,
      title: 'Daredevil Reflexes',
      description: 'Achieve 6 near misses with high-speed trains.',
      type: 'NEAR_MISS',
      target: 6,
      rewardCoins: 1000
    },
    {
      id: 'set5_m2',
      set: 5,
      title: 'Gadget Enthusiast',
      description: 'Activate 5 power-ups across your runs.',
      type: 'POWERUPS',
      target: 5,
      rewardCoins: 1000
    },
    {
      id: 'set5_m3',
      set: 5,
      title: 'High Scorer',
      description: 'Achieve 12,000 points in a single run.',
      type: 'SCORE',
      target: 12000,
      inSingleRun: true,
      rewardCoins: 1200
    }
  ]
};

export function getMissionsForSet(setNumber: number): Mission[] {
  const predefined = MISSION_SETS[setNumber];
  if (predefined) {
    return predefined.map(m => ({
      ...m,
      progress: 0,
      completed: false,
      claimed: false
    }));
  }

  // Escalating difficulty procedural generator for high sets
  const multiplier = 1 + (setNumber - 5) * 0.25;
  return [
    {
      id: `set${setNumber}_m1`,
      set: setNumber,
      title: `Subway Veteran ${setNumber}`,
      description: `Run ${Math.round(2500 * multiplier)} meters.`,
      type: 'DISTANCE',
      target: Math.round(2500 * multiplier),
      progress: 0,
      completed: false,
      claimed: false,
      rewardCoins: Math.round(1000 * multiplier)
    },
    {
      id: `set${setNumber}_m2`,
      set: setNumber,
      title: `Grand Vault ${setNumber}`,
      description: `Collect ${Math.round(300 * multiplier)} coins.`,
      type: 'COINS',
      target: Math.round(300 * multiplier),
      progress: 0,
      completed: false,
      claimed: false,
      rewardCoins: Math.round(1100 * multiplier)
    },
    {
      id: `set${setNumber}_m3`,
      set: setNumber,
      title: `Apex Reflexes ${setNumber}`,
      description: `Dodge ${Math.round(30 * multiplier)} obstacles cleanly.`,
      type: 'OBSTACLES',
      target: Math.round(30 * multiplier),
      progress: 0,
      completed: false,
      claimed: false,
      rewardCoins: Math.round(1200 * multiplier)
    }
  ];
}

// Generate deterministic daily challenges for a given local date string (e.g. "2026-10-22")
export function generateDailyChallenges(dateStr?: string): DailyChallenge[] {
  const dStr = dateStr || new Date().toISOString().split('T')[0];
  // Simple deterministic hash of dateStr
  let hash = 0;
  for (let i = 0; i < dStr.length; i++) {
    hash = (hash * 31 + dStr.charCodeAt(i)) >>> 0;
  }

  const coinTargets = [200, 250, 300, 350, 400];
  const distTargets = [1500, 2000, 2500, 3000, 3500];
  const scoreTargets = [15000, 20000, 25000, 30000];
  const actionTypes: Array<{ type: 'JUMP' | 'SLIDE'; target: number; title: string }> = [
    { type: 'JUMP', target: 20, title: 'Daily Leap Sprint' },
    { type: 'SLIDE', target: 15, title: 'Daily Slipstream Slide' },
    { type: 'JUMP', target: 30, title: 'Skyline Leaps' },
    { type: 'SLIDE', target: 25, title: 'Low Clearance Sprint' }
  ];
  const specialTypes: Array<{ type: string; target: number; title: string; desc: string }> = [
    { type: 'NEAR_MISS', target: 5, title: 'Daily Danger Zone', desc: 'Achieve 5 near misses with oncoming trains.' },
    { type: 'POWERUP', target: 4, title: 'Daily Tech Overdrive', desc: 'Activate 4 power-ups during your runs.' },
    { type: 'NEAR_MISS', target: 8, title: 'Daily Close Shave', desc: 'Pull off 8 razor-thin near misses.' }
  ];

  const coinTarget = coinTargets[hash % coinTargets.length];
  const distTarget = distTargets[(hash >> 2) % distTargets.length];
  const scoreTarget = scoreTargets[(hash >> 4) % scoreTargets.length];
  const action = actionTypes[(hash >> 6) % actionTypes.length];
  const special = specialTypes[(hash >> 8) % specialTypes.length];

  return [
    {
      id: `daily_${dStr}_coins`,
      date: dStr,
      title: 'Daily Coin Collector',
      description: `Collect ${coinTarget} coins today across any runs.`,
      type: 'DAILY_COIN',
      target: coinTarget,
      progress: 0,
      completed: false,
      claimed: false,
      rewardCoins: 500,
      badgeIcon: '🪙'
    },
    {
      id: `daily_${dStr}_dist`,
      date: dStr,
      title: 'Daily Track Explorer',
      description: `Travel ${distTarget} meters along the subway.`,
      type: 'DAILY_DISTANCE',
      target: distTarget,
      progress: 0,
      completed: false,
      claimed: false,
      rewardCoins: 500,
      badgeIcon: '🏃'
    },
    {
      id: `daily_${dStr}_score`,
      date: dStr,
      title: 'Daily High Roller',
      description: `Accumulate ${scoreTarget.toLocaleString()} points today.`,
      type: 'DAILY_SCORE',
      target: scoreTarget,
      progress: 0,
      completed: false,
      claimed: false,
      rewardCoins: 600,
      badgeIcon: '⭐'
    },
    {
      id: `daily_${dStr}_action`,
      date: dStr,
      title: action.title,
      description: `Perform ${action.target} ${action.type === 'JUMP' ? 'hurdle jumps' : 'barrier slides'}.`,
      type: 'DAILY_ACTION',
      target: action.target,
      progress: 0,
      completed: false,
      claimed: false,
      rewardCoins: 550,
      badgeIcon: action.type === 'JUMP' ? '🦘' : '⚡'
    },
    {
      id: `daily_${dStr}_special`,
      date: dStr,
      title: special.title,
      description: special.desc,
      type: 'DAILY_SPECIAL',
      target: special.target,
      progress: 0,
      completed: false,
      claimed: false,
      rewardCoins: 750,
      badgeIcon: '🔥'
    }
  ];
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'ach_distance',
    title: 'Metro Pioneer',
    description: 'Travel vast distances across the city transit tunnels.',
    category: 'DISTANCE',
    badgeIcon: '🚇',
    tiers: [
      { tier: 'BRONZE', target: 5000, rewardCoins: 500 },
      { tier: 'SILVER', target: 25000, rewardCoins: 2000 },
      { tier: 'GOLD', target: 100000, rewardCoins: 10000, rewardKeys: 1 }
    ]
  },
  {
    id: 'ach_coins',
    title: 'Subway Tycoon',
    description: 'Hoard lifetime gold coins from subway tracks.',
    category: 'COINS',
    badgeIcon: '💰',
    tiers: [
      { tier: 'BRONZE', target: 500, rewardCoins: 500 },
      { tier: 'SILVER', target: 2500, rewardCoins: 2500 },
      { tier: 'GOLD', target: 10000, rewardCoins: 12000, rewardKeys: 1 }
    ]
  },
  {
    id: 'ach_runs',
    title: 'Relentless Runner',
    description: 'Complete endless running sessions with grit.',
    category: 'RUNS',
    badgeIcon: '👟',
    tiers: [
      { tier: 'BRONZE', target: 10, rewardCoins: 300 },
      { tier: 'SILVER', target: 50, rewardCoins: 1500 },
      { tier: 'GOLD', target: 200, rewardCoins: 6000, rewardKeys: 1 }
    ]
  },
  {
    id: 'ach_jumps',
    title: 'Roof Hopper',
    description: 'Clear obstacles and trains with airborne jumps.',
    category: 'JUMPS',
    badgeIcon: '🦘',
    tiers: [
      { tier: 'BRONZE', target: 50, rewardCoins: 400 },
      { tier: 'SILVER', target: 250, rewardCoins: 1800 },
      { tier: 'GOLD', target: 1000, rewardCoins: 7500, rewardKeys: 1 }
    ]
  },
  {
    id: 'ach_slides',
    title: 'Under the Radar',
    description: 'Slide under high barriers and overhead arches.',
    category: 'SLIDES',
    badgeIcon: '🛹',
    tiers: [
      { tier: 'BRONZE', target: 50, rewardCoins: 400 },
      { tier: 'SILVER', target: 250, rewardCoins: 1800 },
      { tier: 'GOLD', target: 1000, rewardCoins: 7500, rewardKeys: 1 }
    ]
  },
  {
    id: 'ach_dodges',
    title: 'Master of Evasion',
    description: 'Safely bypass hazards without crashing.',
    category: 'EVASIONS',
    badgeIcon: '🛡️',
    tiers: [
      { tier: 'BRONZE', target: 100, rewardCoins: 500 },
      { tier: 'SILVER', target: 500, rewardCoins: 2500 },
      { tier: 'GOLD', target: 2000, rewardCoins: 10000, rewardKeys: 1 }
    ]
  },
  {
    id: 'ach_hoverboards',
    title: 'Hover Enthusiast',
    description: 'Deploy hoverboards to surf past danger.',
    category: 'HOVERBOARD',
    badgeIcon: '🏄',
    tiers: [
      { tier: 'BRONZE', target: 5, rewardCoins: 500 },
      { tier: 'SILVER', target: 25, rewardCoins: 2000 },
      { tier: 'GOLD', target: 100, rewardCoins: 8000, rewardKeys: 1 }
    ]
  },
  {
    id: 'ach_highscore',
    title: 'Apex Champion',
    description: 'Reach astronomical high scores in a single run.',
    category: 'HIGHSCORE',
    badgeIcon: '👑',
    tiers: [
      { tier: 'BRONZE', target: 10000, rewardCoins: 1000 },
      { tier: 'SILVER', target: 50000, rewardCoins: 4000 },
      { tier: 'GOLD', target: 200000, rewardCoins: 20000, rewardKeys: 2 }
    ]
  },
  {
    id: 'ach_hard_score',
    title: 'Express Master',
    description: 'Achieve legendary high scores in Hard Mode.',
    category: 'HIGHSCORE',
    badgeIcon: '⚡',
    tiers: [
      { tier: 'BRONZE', target: 20000, rewardCoins: 1200 },
      { tier: 'SILVER', target: 75000, rewardCoins: 5000 },
      { tier: 'GOLD', target: 250000, rewardCoins: 25000, rewardKeys: 2 }
    ]
  },
  {
    id: 'ach_hard_distance',
    title: 'Speedway Survivor',
    description: 'Sprint through high-velocity Hard Mode tracks.',
    category: 'DISTANCE',
    badgeIcon: '🚄',
    tiers: [
      { tier: 'BRONZE', target: 1500, rewardCoins: 1000 },
      { tier: 'SILVER', target: 5000, rewardCoins: 4000 },
      { tier: 'GOLD', target: 15000, rewardCoins: 15000, rewardKeys: 2 }
    ]
  }
];

export const DEFAULT_SEASON_PASS: SeasonPass = {
  seasonId: 'season_cyber_neon_1',
  seasonName: 'Neon Velocity Season 1',
  theme: 'Cyberpunk Transit Grid',
  startDate: '2026-10-01',
  endDate: '2026-11-30',
  tokensCollected: 0,
  claimedMilestones: [],
  milestones: [
    {
      milestoneIndex: 0,
      tokensRequired: 10,
      rewardType: 'COINS',
      rewardValue: 500,
      rewardLabel: '500 Coins',
      rewardIcon: '🪙'
    },
    {
      milestoneIndex: 1,
      tokensRequired: 25,
      rewardType: 'HOVERBOARDS',
      rewardValue: 3,
      rewardLabel: '3x Hoverboards',
      rewardIcon: '🏄'
    },
    {
      milestoneIndex: 2,
      tokensRequired: 50,
      rewardType: 'BOARD_SKIN',
      rewardValue: 'board_neon_pulse',
      rewardLabel: 'Neon Pulse Hoverboard',
      rewardIcon: '✨'
    },
    {
      milestoneIndex: 3,
      tokensRequired: 80,
      rewardType: 'COINS',
      rewardValue: 1500,
      rewardLabel: '1,500 Coins',
      rewardIcon: '💰'
    },
    {
      milestoneIndex: 4,
      tokensRequired: 120,
      rewardType: 'HOVERBOARDS',
      rewardValue: 5,
      rewardLabel: '5x Hoverboards',
      rewardIcon: '🚀'
    },
    {
      milestoneIndex: 5,
      tokensRequired: 180,
      rewardType: 'CHARACTER_SKIN',
      rewardValue: 'char_cyber_dash',
      rewardLabel: 'Cyber Dash Outfit',
      rewardIcon: '🤖'
    },
    {
      milestoneIndex: 6,
      tokensRequired: 250,
      rewardType: 'KEYS',
      rewardValue: 3,
      rewardLabel: '3x Revive Keys',
      rewardIcon: '🗝️'
    }
  ]
};

export const GAME_MODES: GameModeConfig[] = [
  {
    id: 'BEGINNER',
    name: 'Beginner',
    tagline: 'Accessible Subway Sprint',
    icon: '🏃',
    description: 'A smooth, engaging run with regular hazards, active trains, and a forgiving learning curve. No empty railways.',
    rules: [
      'Comfortable 19 m/s start, smooth acceleration up to 38 m/s',
      'Moving trains at 23–36 m/s with ample reaction windows',
      'Regular obstacles and train encounters with minimal empty stretches',
      'Full power-ups, hoverboards, and revives available'
    ],
    rewardDescription: 'Standard coins and beginner record tracking'
  },
  {
    id: 'EASY',
    name: 'Easy',
    tagline: 'Elevated Railway Pace',
    icon: '⚡',
    description: 'A brisk, dynamic run with frequent train encounters, varied obstacles, and steady acceleration.',
    rules: [
      'Starts at 24 m/s and accelerates steadily up to 44 m/s',
      'Faster oncoming trains (28–46 m/s) with tighter reaction timing',
      'Frequent static and moving train combinations',
      'Independent Easy Mode records and statistics'
    ],
    rewardDescription: '1.15x score pacing and Easy Mode leaderboard records'
  },
  {
    id: 'HARD',
    name: 'Hard',
    tagline: 'Flagship High-Intensity Gauntlet',
    icon: '🔥',
    description: 'Supreme reflex challenge. Extremely fast runner, relentless high-speed trains, dense railway traffic, and complex obstacle patterns.',
    rules: [
      'Starts fast at 28 m/s and reaches 52 m/s top speed',
      'Blistering moving trains (34–54 m/s) with early encounters',
      'Dense static and moving train formations with rooftop traversal',
      'Intense Express Rush encounters with dual-train corridors',
      'Independent Hard Mode leaderboard and lifetime records'
    ],
    rewardDescription: '1.35x score pacing and elite Hard Mode records'
  },
  {
    id: 'NORMAL',
    name: 'Beginner (Classic)',
    tagline: 'Accessible Subway Sprint',
    icon: '🏃',
    description: 'Classic accessible arcade running with active railway hazards.',
    rules: [
      'Identical to Beginner Mode',
      'Smooth progression and regular train encounters'
    ],
    rewardDescription: 'Standard coins and progression'
  },
  {
    id: 'TIME_TRIAL',
    name: 'Time Trial',
    tagline: '60s Score Sprint',
    icon: '⏱️',
    description: 'Race against the clock! You have 60 seconds to score as high as possible. Collect chrono orbs for +5s extensions.',
    rules: [
      '60-second starting timer',
      '2X base score rate for high-octane competition',
      'Collect +5s Chrono orbs along the tracks to extend your time',
      'Run finishes when timer expires or on fatal crash'
    ],
    rewardDescription: 'Earn 1.5x coin bonuses and exclusive Time Trial rank badges'
  },
  {
    id: 'COIN_RUSH',
    name: 'Coin Rush',
    tagline: '150 Coin Vault Challenge',
    icon: '🪙',
    description: 'A treasure gauntlet! Collect 150 coins as fast as humanly possible through dense gold corridors.',
    rules: [
      'Ultra-dense coin lines and frequent Magnet power-ups',
      'Race to reach exactly 150 coins',
      'Run completes victoriously when the goal is achieved',
      'Clear time is tracked on the leaderboard'
    ],
    rewardDescription: '+1,000 Coin Completion Bonus on successful vault clearance',
    targetGoal: 150
  },
  {
    id: 'SURVIVAL',
    name: 'Survival Challenge',
    tagline: 'Hardcore No-Revive Gauntlet',
    icon: '💀',
    description: 'A pure reflex gauntlet. No hoverboards, no shields, and high initial speed. How far can you survive?',
    rules: [
      'Crash protection disabled (No shields, no hoverboard revives)',
      'Starts at 25 m/s high speed immediately',
      'Heavy moving train density and alternating barriers',
      'Milestone badges at 500m, 1,000m, and 2,000m'
    ],
    rewardDescription: 'Massive survivor coin payouts based on distance reached'
  }
];
