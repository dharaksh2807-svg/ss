import { PowerupType } from '../player/PowerupManager';
import {
  getPowerupIconSvg,
  MAGNET_SVG,
  JETPACK_SVG,
  SNEAKERS_SVG,
  MULTIPLIER_SVG,
  SHIELD_SVG,
  HOVERBOARD_SVG
} from './IconCatalog';

export interface PowerupPresentationConfig {
  type: PowerupType;
  title: string;
  tagline: string;
  shortDesc: string;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  badgeClass: string;
  iconSvg: string;
}

export const POWERUP_REGISTRY: Record<PowerupType, PowerupPresentationConfig> = {
  MAGNET: {
    type: 'MAGNET',
    title: 'COIN MAGNET',
    tagline: 'Pulls All Coins',
    shortDesc: 'Pulls nearby coins toward you across all lanes',
    primaryColor: '#ff1744',
    accentColor: '#ff5252',
    glowColor: 'rgba(255, 23, 68, 0.45)',
    badgeClass: 'powerup-magnet',
    iconSvg: MAGNET_SVG
  },
  JETPACK: {
    type: 'JETPACK',
    title: 'ROCKET JETPACK',
    tagline: 'Fly Above Rails',
    shortDesc: 'Fly safely above trains and collect golden sky trails',
    primaryColor: '#ff9100',
    accentColor: '#ffa726',
    glowColor: 'rgba(255, 145, 0, 0.45)',
    badgeClass: 'powerup-jetpack',
    iconSvg: JETPACK_SVG
  },
  SNEAKERS: {
    type: 'SNEAKERS',
    title: 'SUPER SNEAKERS',
    tagline: 'Mega Jump Height',
    shortDesc: 'Jump significantly higher to leap over barriers and trains',
    primaryColor: '#00e676',
    accentColor: '#69f0ae',
    glowColor: 'rgba(0, 230, 118, 0.45)',
    badgeClass: 'powerup-sneakers',
    iconSvg: SNEAKERS_SVG
  },
  MULTIPLIER: {
    type: 'MULTIPLIER',
    title: 'SCORE 2X',
    tagline: 'Double Multiplier',
    shortDesc: 'Doubles all score accumulation while active',
    primaryColor: '#ffd700',
    accentColor: '#ffe57f',
    glowColor: 'rgba(255, 215, 0, 0.45)',
    badgeClass: 'powerup-multiplier',
    iconSvg: MULTIPLIER_SVG
  },
  SHIELD: {
    type: 'SHIELD',
    title: 'PROTECTIVE SHIELD',
    tagline: 'Barrier Protection',
    shortDesc: 'Absorbs one obstacle impact without crashing',
    primaryColor: '#00e5ff',
    accentColor: '#18ffff',
    glowColor: 'rgba(0, 229, 255, 0.45)',
    badgeClass: 'powerup-shield',
    iconSvg: SHIELD_SVG
  },
  HOVERBOARD: {
    type: 'HOVERBOARD',
    title: 'HOVERBOARD',
    tagline: 'Crash Immunity',
    shortDesc: 'Surfing speed boost and fatal crash protection',
    primaryColor: '#00e676',
    accentColor: '#00f5d4',
    glowColor: 'rgba(0, 245, 212, 0.45)',
    badgeClass: 'powerup-hoverboard',
    iconSvg: HOVERBOARD_SVG
  }
};

export function getPowerupConfig(type: PowerupType | string): PowerupPresentationConfig {
  const key = (type || '').toUpperCase() as PowerupType;
  if (POWERUP_REGISTRY[key]) {
    return POWERUP_REGISTRY[key];
  }
  return {
    type: 'MULTIPLIER',
    title: (type || 'POWER-UP').toUpperCase(),
    tagline: 'Bonus Active',
    shortDesc: 'Special running enhancement active',
    primaryColor: '#00f5d4',
    accentColor: '#00e5ff',
    glowColor: 'rgba(0, 245, 212, 0.4)',
    badgeClass: 'powerup-default',
    iconSvg: getPowerupIconSvg(type, 24)
  };
}
