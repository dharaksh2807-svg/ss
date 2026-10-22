# Subway Surfers 3D (Metro Runner)

A production-quality, browser-based 3D endless runner inspired by Subway Surfers, built with **Three.js** and **TypeScript** using **Vite**.

![Game Title](index.html)

## Features

- **Authoritative 3-Lane Movement System**: Exactly three lanes (Left: `-1`, Center: `0`, Right: `+1`) with deterministic clamping, smooth sinusoidal interpolation, and responsive buffered input queuing without lane skipping.
- **Classic Subway Surfers Mechanics**:
  - **Jumping**: Leap over safety hurdles, trash cans, and low road barriers.
  - **Sliding**: Dodge beneath overhead gantries and high rail arches.
  - **Fast Dropping**: Swipe or press down mid-air to fast-drop onto train roofs or ground.
  - **Hoverboard**: Double-tap spacebar or button to activate a protective shield.
  - **Super Sneakers**: High-jump bounce ability.
  - **Coin Magnet**: Automatically draws nearby coins.
  - **Score Multiplier**: 2x multiplier boosts distance scoring.
- **Procedural Obstacle & Track Generation**:
  - Dynamically streaming infinite metro subway chunks (train tracks, subway walls, overhead arches, tunnels).
  - Train carriages with ramps and climbable roofs.
  - Guaranteed solvability validation ensuring all procedural patterns are 100% fair and obstacle clearance paths always exist.
- **Audio & Visual Effects**:
  - Web Audio API procedural sound synthesizer (jump whooshes, slide scrapes, coin chimes, crash impacts, shield humming).
  - Screen shake, speed lines, coin collection particle bursts, and hoverboard glow effects.
- **Responsive Controls**:
  - Desktop keyboard (Arrow keys / WASD / Space).
  - Touch swipes and on-screen directional buttons for mobile and tablets.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:3000`.

### Production Build

```bash
npm run build
npm run preview
```

### Running Tests

```bash
npm test
```

Runs both:
1. Procedural obstacle pattern feasibility and solvability validation across multiple speed thresholds (18 to 38 m/s).
2. Comprehensive 3-lane movement unit tests (50/50 test assertions).

## Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| Move Left | `ArrowLeft` / `A` | Swipe Left / Tap `◂` |
| Move Right | `ArrowRight` / `D` | Swipe Right / Tap `▸` |
| Jump | `ArrowUp` / `W` | Swipe Up / Tap `▲` |
| Slide / Fast Drop | `ArrowDown` / `S` | Swipe Down / Tap `▼` |
| Hoverboard Shield | `Space` | Tap Shield Icon |
| Pause / Resume | `Escape` / `P` | Tap Pause Button |

## License

MIT
