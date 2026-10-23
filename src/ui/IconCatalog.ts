/**
 * IconCatalog.ts
 * Coherent set of professional vector SVG icons for all collectibles,
 * power-ups, currencies, and gameplay feedback in Metro Runner 3D.
 * 
 * Replaces arbitrary emojis with scalable, crisp vector graphics
 * that maintain high contrast and instant visual readability across all screen sizes.
 */

export type PowerupIconType =
  | 'MAGNET'
  | 'JETPACK'
  | 'SNEAKERS'
  | 'MULTIPLIER'
  | 'SHIELD'
  | 'HOVERBOARD'
  | 'KEY'
  | 'EVENT_TOKEN'
  | 'COIN'
  | 'CHRONO_ORB';

/**
 * High-Contrast Horseshoe Magnet with Coin Attraction Flux
 */
export const MAGNET_SVG = `
<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg icon-magnet">
  <defs>
    <linearGradient id="magBodyGrad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ff1744" />
      <stop offset="60%" stop-color="#d50000" />
      <stop offset="100%" stop-color="#b71c1c" />
    </linearGradient>
    <linearGradient id="magPoleGrad" x1="0" y1="0" x2="0" y2="10" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#cfd8dc" />
      <stop offset="100%" stop-color="#90a4ae" />
    </linearGradient>
    <radialGradient id="magCoinGrad" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#fff59d" />
      <stop offset="50%" stop-color="#ffd700" />
      <stop offset="100%" stop-color="#ff8f00" />
    </radialGradient>
    <filter id="magGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#ff1744" flood-opacity="0.4" />
    </filter>
  </defs>
  <!-- Main Horseshoe Curve -->
  <path d="M10 22V14C10 6.268 16.268 0 24 0C31.732 0 38 6.268 38 14V22H28V14C28 11.791 26.209 10 24 10C21.791 10 20 11.791 20 14V22H10Z"
        transform="translate(0, 4)" fill="url(#magBodyGrad)" filter="url(#magGlow)" stroke="#ff5252" stroke-width="1.2" stroke-linejoin="round"/>
  <!-- Silver / Chrome Magnetic Pole Tips -->
  <rect x="10" y="26" width="10" height="9" rx="1.5" fill="url(#magPoleGrad)" stroke="#37474f" stroke-width="1" />
  <rect x="28" y="26" width="10" height="9" rx="1.5" fill="url(#magPoleGrad)" stroke="#37474f" stroke-width="1" />
  <line x1="10" y1="29" x2="20" y2="29" stroke="#78909c" stroke-width="1" />
  <line x1="28" y1="29" x2="38" y2="29" stroke="#78909c" stroke-width="1" />
  <!-- Magnetic Flux Curves (Attracting toward center) -->
  <path d="M15 38C15 42 33 42 33 38" stroke="#2979ff" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 3" />
  <path d="M12 42C12 48 36 48 36 42" stroke="#00e5ff" stroke-width="1.8" stroke-linecap="round" />
  <!-- Mini Attracted Golden Coin in Flux -->
  <circle cx="24" cy="41" r="5" fill="url(#magCoinGrad)" stroke="#ffa000" stroke-width="1" />
  <polygon points="24,38 25,40 27,40.5 25.5,42 26,44 24,43 22,44 22.5,42 21,40.5 23,40" fill="#fffde7" />
</svg>
`.trim();

/**
 * Aerodynamic Rocket Jetpack with Twin Exhaust Nozzles and Flames
 */
export const JETPACK_SVG = `
<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg icon-jetpack">
  <defs>
    <linearGradient id="jpBodyGrad" x1="0" y1="4" x2="48" y2="36" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ff9100" />
      <stop offset="50%" stop-color="#ff6d00" />
      <stop offset="100%" stop-color="#e65100" />
    </linearGradient>
    <linearGradient id="jpMetalGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#78909c" />
      <stop offset="50%" stop-color="#455a64" />
      <stop offset="100%" stop-color="#263238" />
    </linearGradient>
    <linearGradient id="jpFlameGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="25%" stop-color="#ffea00" />
      <stop offset="65%" stop-color="#ff3d00" />
      <stop offset="100%" stop-color="#d50000" stop-opacity="0" />
    </linearGradient>
  </defs>
  <!-- Central Support Harness & Frame -->
  <rect x="18" y="10" width="12" height="18" rx="2" fill="url(#jpMetalGrad)" stroke="#90a4ae" stroke-width="1" />
  <circle cx="24" cy="18" r="3.5" fill="#00e5ff" stroke="#ffffff" stroke-width="1" />
  <!-- Left Rocket Tank -->
  <rect x="7" y="5" width="12" height="23" rx="6" fill="url(#jpBodyGrad)" stroke="#ffb74d" stroke-width="1.2" />
  <path d="M7 11H19" stroke="#ffe082" stroke-width="1" />
  <path d="M7 21H19" stroke="#bf360c" stroke-width="1" />
  <!-- Right Rocket Tank -->
  <rect x="29" y="5" width="12" height="23" rx="6" fill="url(#jpBodyGrad)" stroke="#ffb74d" stroke-width="1.2" />
  <path d="M29 11H41" stroke="#ffe082" stroke-width="1" />
  <path d="M29 21H41" stroke="#bf360c" stroke-width="1" />
  <!-- Left Exhaust Nozzle -->
  <path d="M9 28L7 35H19L17 28H9Z" fill="url(#jpMetalGrad)" stroke="#37474f" stroke-width="1" />
  <!-- Right Exhaust Nozzle -->
  <path d="M31 28L29 35H41L39 28H31Z" fill="url(#jpMetalGrad)" stroke="#37474f" stroke-width="1" />
  <!-- Twin Rocket Thrust Flames -->
  <path d="M8 35C10 40 13 47 13 47C13 47 16 40 18 35H8Z" fill="url(#jpFlameGrad)" />
  <path d="M30 35C32 40 35 47 35 47C35 47 38 40 40 35H30Z" fill="url(#jpFlameGrad)" />
</svg>
`.trim();

/**
 * Distinct Winged Sneaker with Dual Upward Motion Energy Chevrons
 */
export const SNEAKERS_SVG = `
<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg icon-sneakers">
  <defs>
    <linearGradient id="snkShoeGrad" x1="4" y1="12" x2="42" y2="38" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ff5252" />
      <stop offset="60%" stop-color="#ff1744" />
      <stop offset="100%" stop-color="#c51162" />
    </linearGradient>
    <linearGradient id="snkWingGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#ffd700" />
      <stop offset="100%" stop-color="#ff9100" />
    </linearGradient>
    <linearGradient id="snkSoleGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#eceff1" />
    </linearGradient>
  </defs>
  <!-- Upward Motion Thrust Chevrons -->
  <path d="M36 7L40 3L44 7" stroke="#00e676" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M36 13L40 9L44 13" stroke="#69f0ae" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <!-- High-Top Sneaker Collar & Upper Body -->
  <path d="M12 15L8 27H4L3 34H41C43 34 45 32 45 30C45 28 43 25 39 25L32 23L27 15H12Z"
        fill="url(#snkShoeGrad)" stroke="#ff8a80" stroke-width="1.2" stroke-linejoin="round" />
  <!-- Wing Feathers -->
  <path d="M13 16C10 9 17 6 22 5C19 9 20 12 18 16" fill="url(#snkWingGrad)" stroke="#ffa000" stroke-width="0.8" />
  <path d="M18 16C16 11 22 9 26 8C23 12 24 14 22 17" fill="url(#snkWingGrad)" stroke="#ffa000" stroke-width="0.8" />
  <!-- Contrast Laces & Eyelets -->
  <path d="M22 17L26 21M20 20L24 24" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
  <!-- White Rubber Toe Cap & Midsole -->
  <path d="M36 26C39 26 43 28 43 30L42 34H34L36 26Z" fill="#ffffff" stroke="#b0bec5" stroke-width="0.8" />
  <!-- Athletic Cushioned Outsole -->
  <rect x="2" y="34" width="42" height="6" rx="3" fill="url(#snkSoleGrad)" stroke="#90a4ae" stroke-width="1" />
  <line x1="6" y1="37" x2="38" y2="37" stroke="#00e676" stroke-width="1.5" stroke-linecap="round" />
</svg>
`.trim();

/**
 * Score Multiplier: Bold "2X" Emblem with High-Contrast Hexagonal Badge Plate
 */
export const MULTIPLIER_SVG = `
<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg icon-multiplier">
  <defs>
    <linearGradient id="multPlateGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#2a1f00" />
      <stop offset="50%" stop-color="#1a1400" />
      <stop offset="100%" stop-color="#0a0800" />
    </linearGradient>
    <linearGradient id="multGoldGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffde7" />
      <stop offset="30%" stop-color="#ffd700" />
      <stop offset="70%" stop-color="#ffb300" />
      <stop offset="100%" stop-color="#ff8f00" />
    </linearGradient>
    <linearGradient id="multBorderGrad" x1="0" y1="0" x2="48" y2="48">
      <stop offset="0%" stop-color="#ffe57f" />
      <stop offset="50%" stop-color="#ffb300" />
      <stop offset="100%" stop-color="#ff6f00" />
    </linearGradient>
  </defs>
  <!-- Hexagonal Contrast Badge Plate -->
  <polygon points="24,2 44,13 44,35 24,46 4,35 4,13" fill="url(#multPlateGrad)" stroke="url(#multBorderGrad)" stroke-width="2.5" />
  <polygon points="24,5 41,15 41,33 24,43 7,33 7,15" stroke="#ffeb3b" stroke-width="0.8" stroke-dasharray="3 2" />
  <!-- Dimensional Bold "2" -->
  <path d="M12 18C12 13.5 15.5 11 19.5 11C23.5 11 26 13.5 26 16.5C26 20 22 23 18 27H26V32H12L12 28L20 21C21.5 19.5 22 18.5 22 17C22 15.5 21 14.5 19.5 14.5C18 14.5 16.8 15.2 16.5 17L12 18Z"
        fill="url(#multGoldGrad)" stroke="#ff6f00" stroke-width="1" stroke-linejoin="round" />
  <!-- Dimensional Bold "X" -->
  <path d="M28 17L31 23L27.5 30H32L34 25.5L36 30H40.5L37 23L40 17H35.5L34 20.5L32.5 17H28Z"
        fill="url(#multGoldGrad)" stroke="#ff6f00" stroke-width="1" stroke-linejoin="round" />
</svg>
`.trim();

/**
 * Protective Aegis Shield (Visually distinct from horizontal hoverboard)
 */
export const SHIELD_SVG = `
<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg icon-shield">
  <defs>
    <linearGradient id="shPlateGrad" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00e5ff" />
      <stop offset="40%" stop-color="#00b0ff" />
      <stop offset="100%" stop-color="#0d47a1" />
    </linearGradient>
    <linearGradient id="shBorderGrad" x1="0" y1="0" x2="48" y2="48">
      <stop offset="0%" stop-color="#e0f7fa" />
      <stop offset="50%" stop-color="#00e5ff" />
      <stop offset="100%" stop-color="#0091ea" />
    </linearGradient>
  </defs>
  <!-- Medieval / High-Tech Aegis Crest Shield -->
  <path d="M24 3L40 8V23C40 33 33 41 24 45C15 41 8 33 8 23V8L24 3Z"
        fill="url(#shPlateGrad)" stroke="url(#shBorderGrad)" stroke-width="2.5" stroke-linejoin="round" />
  <!-- Inner Reinforced Inset Rim -->
  <path d="M24 7L36 11V22C36 30.5 30.5 37 24 40.5C17.5 37 12 30.5 12 22V11L24 7Z"
        stroke="#80d8ff" stroke-width="1.2" stroke-opacity="0.7" fill="#001020" fill-opacity="0.25" />
  <!-- Glowing Aegis Central Star Emblem -->
  <polygon points="24,14 26.5,21 34,21 28,25.5 30.5,32.5 24,28 17.5,32.5 20,25.5 14,21 21.5,21"
           fill="#ffffff" stroke="#80d8ff" stroke-width="0.8" />
  <circle cx="24" cy="24" r="3" fill="#00e5ff" />
</svg>
`.trim();

/**
 * Aerodynamic Hoverboard Deck Silhouette
 */
export const HOVERBOARD_SVG = `
<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg icon-hoverboard">
  <defs>
    <linearGradient id="hbDeckGrad" x1="4" y1="14" x2="44" y2="34" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00e676" />
      <stop offset="50%" stop-color="#00c853" />
      <stop offset="100%" stop-color="#1b5e20" />
    </linearGradient>
    <linearGradient id="hbGlowGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#69f0ae" />
      <stop offset="100%" stop-color="#00e5ff" />
    </linearGradient>
  </defs>
  <!-- Angled 3/4 Perspective Surfboard Silhouette -->
  <path d="M6 25C8 17 38 15 44 21C46 23 44 27 38 31C30 35 10 33 6 25Z"
        fill="url(#hbDeckGrad)" stroke="#b9f6ca" stroke-width="1.8" stroke-linejoin="round" />
  <!-- Grip Tape Center Inset Pad -->
  <path d="M10 24C12 19 36 17 40 22C36 26 15 28 10 24Z"
        fill="#12241b" stroke="#00e676" stroke-width="1" />
  <!-- Dual Repulsor Thruster Glow Rings Underneath -->
  <ellipse cx="16" cy="30" rx="4" ry="2" fill="url(#hbGlowGrad)" opacity="0.85" />
  <ellipse cx="34" cy="28" rx="4" ry="2" fill="url(#hbGlowGrad)" opacity="0.85" />
  <!-- Speed Streak -->
  <line x1="4" y1="36" x2="16" y2="36" stroke="#00e5ff" stroke-width="2" stroke-linecap="round" />
  <line x1="8" y1="40" x2="24" y2="40" stroke="#69f0ae" stroke-width="1.5" stroke-linecap="round" />
</svg>
`.trim();

/**
 * Classic Vintage Gold Skeleton Key
 */
export const KEY_SVG = `
<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg icon-key">
  <defs>
    <linearGradient id="keyGoldGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fff9c4" />
      <stop offset="35%" stop-color="#ffd700" />
      <stop offset="75%" stop-color="#ffb300" />
      <stop offset="100%" stop-color="#ff8f00" />
    </linearGradient>
  </defs>
  <!-- Bow (Ornamental Round Head with Clover Cutout) -->
  <circle cx="15" cy="15" r="10" fill="url(#keyGoldGrad)" stroke="#ffa000" stroke-width="1.8" />
  <circle cx="15" cy="15" r="4.5" fill="#1a1400" />
  <!-- Stem / Barrel -->
  <path d="M22 18L40 36L37 39L19 21Z" fill="url(#keyGoldGrad)" stroke="#ffa000" stroke-width="1" />
  <!-- Notched Teeth / Bit -->
  <path d="M34 30L38 26L41 29L38 32M39 35L43 31L45 33L42 37" stroke="url(#keyGoldGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Sparkle Accent -->
  <polygon points="15,7 16,10 19,11 16,12 15,15 14,12 11,11 14,10" fill="#ffffff" />
</svg>
`.trim();

/**
 * Faceted Cyber Event Token / Diamond Gem
 */
export const EVENT_TOKEN_SVG = `
<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg icon-event-token">
  <defs>
    <linearGradient id="tokGemGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#e0f7fa" />
      <stop offset="30%" stop-color="#00e5ff" />
      <stop offset="70%" stop-color="#00b0ff" />
      <stop offset="100%" stop-color="#7c4dff" />
    </linearGradient>
  </defs>
  <!-- Orbital Neon Ring -->
  <ellipse cx="24" cy="24" rx="21" ry="8" stroke="#00e5ff" stroke-width="1.5" stroke-dasharray="4 2" transform="rotate(-25 24 24)" />
  <!-- Faceted Prism Jewel Body -->
  <polygon points="24,4 38,16 33,42 15,42 10,16" fill="url(#tokGemGrad)" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" />
  <!-- Facet Edges -->
  <line x1="24" y1="4" x2="24" y2="42" stroke="#ffffff" stroke-width="1" stroke-opacity="0.8" />
  <line x1="24" y1="4" x2="15" y2="42" stroke="#ffffff" stroke-width="0.8" stroke-opacity="0.5" />
  <line x1="24" y1="4" x2="33" y2="42" stroke="#ffffff" stroke-width="0.8" stroke-opacity="0.5" />
  <polygon points="24,4 38,16 10,16" fill="#ffffff" fill-opacity="0.3" />
</svg>
`.trim();

/**
 * High-Polish Gold Coin with Embossed Star
 */
export const COIN_SVG = `
<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg icon-coin">
  <defs>
    <radialGradient id="coinFaceGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fff59d" />
      <stop offset="40%" stop-color="#ffca28" />
      <stop offset="80%" stop-color="#ff8f00" />
      <stop offset="100%" stop-color="#e65100" />
    </radialGradient>
    <linearGradient id="coinRimGrad" x1="0" y1="0" x2="48" y2="48">
      <stop offset="0%" stop-color="#fff9c4" />
      <stop offset="40%" stop-color="#ffd700" />
      <stop offset="100%" stop-color="#ff6f00" />
    </linearGradient>
  </defs>
  <!-- Outer Beveled Protective Rim -->
  <circle cx="24" cy="24" r="22" fill="url(#coinRimGrad)" stroke="#ffe082" stroke-width="1.5" />
  <!-- Minted Inner Bezel -->
  <circle cx="24" cy="24" r="17.5" fill="url(#coinFaceGrad)" stroke="#ffa000" stroke-width="1.2" />
  <!-- Embossed 5-Pointed Star -->
  <polygon points="24,10 27.8,18 36.5,19.2 30.2,25.3 31.8,34 24,29.8 16.2,34 17.8,25.3 11.5,19.2 20.2,18"
           fill="#fffde7" stroke="#ff8f00" stroke-width="1" stroke-linejoin="round" />
</svg>
`.trim();

/**
 * Time Trial Chrono Orb
 */
export const CHRONO_ORB_SVG = `
<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-svg icon-chrono">
  <defs>
    <radialGradient id="chronoGrad" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fff59d" />
      <stop offset="50%" stop-color="#ffea00" />
      <stop offset="100%" stop-color="#ff9100" />
    </radialGradient>
  </defs>
  <!-- Rotating Chrono Ring -->
  <circle cx="24" cy="24" r="21" stroke="#ffd700" stroke-width="2" stroke-dasharray="6 3" />
  <!-- Central Glowing Orb -->
  <circle cx="24" cy="24" r="16" fill="url(#chronoGrad)" stroke="#ffb300" stroke-width="1.5" />
  <!-- Clock Hands -->
  <line x1="24" y1="24" x2="24" y2="13" stroke="#263238" stroke-width="2.5" stroke-linecap="round" />
  <line x1="24" y1="24" x2="31" y2="24" stroke="#263238" stroke-width="2.5" stroke-linecap="round" />
  <circle cx="24" cy="24" r="2.5" fill="#ffffff" />
</svg>
`.trim();

/**
 * Retrieve crisp SVG markup for any collectible or powerup item
 */
export function getPowerupIconSvg(type: string, size: number = 24): string {
  let svg = MAGNET_SVG;
  const upper = (type || '').toUpperCase();

  switch (upper) {
    case 'MAGNET':
      svg = MAGNET_SVG;
      break;
    case 'JETPACK':
      svg = JETPACK_SVG;
      break;
    case 'SNEAKERS':
      svg = SNEAKERS_SVG;
      break;
    case 'MULTIPLIER':
      svg = MULTIPLIER_SVG;
      break;
    case 'SHIELD':
      svg = SHIELD_SVG;
      break;
    case 'HOVERBOARD':
      svg = HOVERBOARD_SVG;
      break;
    case 'KEY':
    case 'KEYS':
      svg = KEY_SVG;
      break;
    case 'EVENT_TOKEN':
    case 'SEASON_TOKEN':
      svg = EVENT_TOKEN_SVG;
      break;
    case 'COIN':
      svg = COIN_SVG;
      break;
    case 'CHRONO_ORB':
      svg = CHRONO_ORB_SVG;
      break;
    default:
      svg = MULTIPLIER_SVG;
  }

  // Adjust width and height attributes if requested
  if (size) {
    return svg.replace('<svg viewBox="0 0 48 48"', `<svg width="${size}" height="${size}" viewBox="0 0 48 48"`);
  }
  return svg;
}

export const ALL_POWERUP_ICONS: Record<string, string> = {
  MAGNET: MAGNET_SVG,
  JETPACK: JETPACK_SVG,
  SNEAKERS: SNEAKERS_SVG,
  MULTIPLIER: MULTIPLIER_SVG,
  SHIELD: SHIELD_SVG,
  HOVERBOARD: HOVERBOARD_SVG,
  KEY: KEY_SVG,
  EVENT_TOKEN: EVENT_TOKEN_SVG,
  COIN: COIN_SVG,
  CHRONO_ORB: CHRONO_ORB_SVG
};
