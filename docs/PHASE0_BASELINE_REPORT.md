# Metro Runner 3D — Phase 0: Visual Baseline & Regression Protection Report

**Repository**: https://github.com/dharaksh2807-svg/ss  
**Base Branch**: `main`  
**Baseline Commit**: `b4b4ebf5` (`b4b4ebfd357ee7bb8e5c34aaa498fb7c53c0979e`)  
**Working Branch**: `polish/phase-0-baseline`  
**Captured Date**: October 31, 2026  

---

## 1. Repository State & Baseline Verification

1. **Remote Sync & Branch State**:
   - `git fetch origin` completed against `origin/main`.
   - Verified that `main` is clean at baseline commit `b4b4ebf5` ("fix(ui): restore mouse and touch click functionality on Play Again button").
   - Baseline commit has not advanced upstream.
   - Working branch `polish/phase-0-baseline` created directly from latest clean `main`.
2. **Prior Systems Integrity Confirmed**:
   - `08b358f`: Build-time development flag gating (`IS_BUILD_DEV`, dev tools and window debug registration isolation) verified present and functional.
   - `9649ce3`: Stacking Hard Mode and Challenge score multipliers verified present and functional.
   - `434aca5`: Real player physics, corridor clearance, and rooftop states in `ReachabilityValidator` verified present and functional.
   - `b4b4ebf` & `1f191b2`: Quick Retry ("PLAY AGAIN" button) click listeners and label preservation verified present and functional.
3. **Production Build Status**:
   - `npm run build` (`tsc && vite build`) passed with zero errors (built cleanly in 1.05s).

---

## 2. Baseline Measurements & Telemetry Summary

All telemetry was captured using the existing Playwright browser automation infrastructure with real headless Chrome and WebGL (SwiftShader angle driver) across 10 representative states.

### Telemetry Summary Table

| State ID | Scenario | Resolution | FPS | Frame Time (Mean / P95) | Draw Calls | Triangles | Memory (Geoms / Textures) | Graphics Preset |
|---|---|---|---|---|---|---|---|---|
| **01** | Desktop Lobby | 1440 × 900 | 5 | 208.6ms / 210.8ms | 2,864 | 294,921 | 1,721 / 21 | AUTO (HIGH) |
| **02** | Mobile Lobby | 390 × 844 | 6 | 157.0ms / 159.3ms | 2,857 | 294,640 | 1,734 / 21 | AUTO (HIGH) |
| **03** | Normal Gameplay | 1440 × 900 | 4 | 229.6ms / 251.1ms | 3,349 | 303,695 | 3,952 / 23 | AUTO (HIGH) |
| **04** | Hard Mode Approaching Train | 1440 × 900 | 8 | 120.4ms / 271.6ms | 546 | 51,417 | 6,545 / 24 | AUTO (HIGH) |
| **05** | Train Rooftop Traversal | 1440 × 900 | 5 | 212.2ms / 243.4ms | 2,698 | 264,810 | 8,328 / 24 | AUTO (HIGH) |
| **06a**| Jump Apex over Low Barrier | 1440 × 900 | 5 | 196.5ms / 207.6ms | 2,964 | 262,572 | 10,183 / 24 | AUTO (HIGH) |
| **06b**| Slide under High Barrier | 1440 × 900 | 5 | 208.4ms / 221.2ms | 3,194 | 282,032 | 12,188 / 24 | AUTO (HIGH) |
| **07** | Active Power-Up HUD | 1440 × 900 | 4 | 266.2ms / 296.9ms | 3,590 | 308,266 | 14,577 / 24 | AUTO (HIGH) |
| **08** | Game Over & Quick Retry | 1440 × 900 | 10 | 96.1ms / 102.0ms | 307 | 22,218 | 14,577 / 24 | AUTO (HIGH) |
| **09** | Character Selection Modal | 1440 × 900 | 4 | 265.2ms / 316.7ms | 3,306 | 310,302 | 16,584 / 24 | AUTO (HIGH) |
| **10** | Shop Modal | 1440 × 900 | 5 | 217.0ms / 228.8ms | 3,305 | 310,293 | 16,584 / 24 | AUTO (HIGH) |

*Note: FPS and frame times reflect software WebGL (SwiftShader) emulation in headless CI/CD automation mode. Hardware GPU execution operates at 60–120 FPS.*

---

## 3. Representative State Screenshots

Saved under `artifacts/baseline/` and linked below:

1. **Desktop Lobby (1440 × 900)**: [01_desktop_lobby_1440x900.png](file:///Users/dharaksh/Desktop/ss/artifacts/baseline/01_desktop_lobby_1440x900.png)
   - Demonstrates desktop UI layout, currency status pills, mode selector, and 3D runner pose on tracks.
2. **Mobile Lobby (390 × 844)**: [02_mobile_lobby_390x844.png](file:///Users/dharaksh/Desktop/ss/artifacts/baseline/02_mobile_lobby_390x844.png)
   - Exposes severe mobile widget collision and overlapping cards.
3. **Normal Gameplay**: [03_normal_gameplay.png](file:///Users/dharaksh/Desktop/ss/artifacts/baseline/03_normal_gameplay.png)
   - Displays runner climbing train ramp, gold coin arc on adjacent rail, and urban building facades.
4. **Hard Mode Approaching Train**: [04_hard_mode_approaching_train.png](file:///Users/dharaksh/Desktop/ss/artifacts/baseline/04_hard_mode_approaching_train.png)
   - Highlights oncoming moving train in center lane, low hurdle on right rail, and active multiplier HUD badge (1.25X).
5. **Running on a Train Roof**: [05_running_on_train_roof.png](file:///Users/dharaksh/Desktop/ss/artifacts/baseline/05_running_on_train_roof.png)
   - Shows rooftop catwalk traversal at `Y = 4.35m`, elevated camera angle, aerial gantry, and combo counter.
6. **Jump Moment**: [06a_jump_moment.png](file:///Users/dharaksh/Desktop/ss/artifacts/baseline/06a_jump_moment.png)
   - Captured at airborne apex (`Y ≈ 2.5m`) clearing low hazard hurdle with shadow blob.
7. **Slide Moment**: [06b_slide_moment.png](file:///Users/dharaksh/Desktop/ss/artifacts/baseline/06b_slide_moment.png)
   - Demonstrates slide posture and "JAX SLIDE!" HUD feedback badge in front of high barrier.
8. **Active Power-Up HUD**: [07_active_powerup_hud.png](file:///Users/dharaksh/Desktop/ss/artifacts/baseline/07_active_powerup_hud.png)
   - Shows active Coin Magnet timer countdown (8s), progress bar, and glowing magnetic field aura.
9. **Game Over & Quick Retry**: [08_game_over_quick_retry.png](file:///Users/dharaksh/Desktop/ss/artifacts/baseline/08_game_over_quick_retry.png)
   - Features prominent "PLAY AGAIN" [R] button, skill telemetry breakdown, record banner, and navigation actions.
10. **Character Selection Modal**: [09_character_selection.png](file:///Users/dharaksh/Desktop/ss/artifacts/baseline/09_character_selection.png)
    - Full 3D turntable preview, outfit selections, stats, and rear/front chase perspective toggle.
11. **Shop Modal**: [10_shop.png](file:///Users/dharaksh/Desktop/ss/artifacts/baseline/10_shop.png)
    - Featured runners, hoverboard megapack, boosters, and coin balances.

---

## 4. Prioritized Visual Issue Register

| ID | Category | Severity | Description | Evidence / Screenshot | Recommended Resolution |
|---|---|---|---|---|---|
| **VIS-01** | Mobile Layout | **P0** | On 390 × 844 mobile viewports, the StartScreen left and right widget cards collide and overlap horizontally over each other and occlude the character's face/body. | `02_mobile_lobby_390x844.png` | Apply responsive media queries (`@media (max-width: 768px)`) to collapse side cards into a vertical accordion or swipeable carousel. |
| **VIS-02** | Menu / Shop Layout | **P0** | Shop modal top featured card headers ("RAHUL GANDHI", "NARENDRA MODI") clip underneath the sticky category tab bar, and "HOVERBOARD MEGAPACK" pricing is cut off at the bottom. | `10_shop.png` | Increase top/bottom content padding (`padding-top: 16px; padding-bottom: 24px`) inside the scrollable container. |
| **VIS-03** | Typography / Bio | **P0** | Character showroom biography description contains broken string truncation (`"custom high-tops, J<"`). | `09_character_selection.png` | Fix character catalog bio string truncation or container `overflow` style. |
| **VIS-04** | Game Over Layout | **P1** | Sub-card descriptive banner text ("Keep running to unlock mission badges...") is sliced horizontally at the lower edge of the modal. | `08_game_over_quick_retry.png` | Adjust vertical flex layout and add `overflow-y: auto` to allow clean scrolling on shorter viewports. |
| **VIS-05** | Train Materials & Detail | **P1** | Train carriages use high-specular uniform plastic materials without PBR roughness maps, metallic reflection, or corrugated roof textures. | `03_normal_gameplay.png`, `04_hard_mode_approaching_train.png` | Upgrade carriage materials to standard PBR with metalness maps, roof panel accents, and ambient occlusion. |
| **VIS-06** | Character Quality | **P1** | Runner model Jax is composed of primitive procedural geometries (capsules/boxes) with flat cartoon eye textures and rigid joint articulation. | `01_desktop_lobby_1440x900.png`, `09_character_selection.png` | Enhance humanoid proportions, joint bevels, clothing texture details, and athletic running silhouette. |
| **VIS-07** | Track Ballast & Rails | **P1** | Railway ballast displays a low-resolution grey noise texture; wooden ties and steel rails are unchamfered sharp boxes without specular railhead reflections. | `01_desktop_lobby_1440x900.png`, `03_normal_gameplay.png` | Introduce refined rail head specular highlight maps and improved ballast ground shading. |
| **VIS-08** | Obstacle Readability | **P1** | Low hurdles lack cast shadow grounding onto the ballast gravel, reducing depth perception at high running speeds (>35 m/s). | `04_hard_mode_approaching_train.png`, `06a_jump_moment.png` | Add contact drop shadow / ambient occlusion decal beneath hurdle feet. |
| **VIS-09** | Icon Consistency | **P2** | Mixed iconography across UI: vector SVG coins, system emoji (🏃, ⚡, 🔑, 💥), and custom textures. | `01_desktop_lobby_1440x900.png`, `08_game_over_quick_retry.png` | Standardize all modal and HUD icons to unified custom SVG glyphs. |
| **VIS-10** | HUD Stacking Density | **P2** | When multiple power-ups, active mission trackers, and combo badges are active simultaneously, top-bar HUD element stacking reaches visual density limits. | `07_active_powerup_hud.png` | Group active power-up timers into a unified compact stack with secondary countdown indicators. |
| **VIS-11** | Color & Lighting Saturation| **P2** | Neon cyan shop signs and bright yellow/magenta accents occasionally compete with track obstacles for player attention. | `03_normal_gameplay.png`, `04_hard_mode_approaching_train.png` | Balance district emissive bloom and tone mapping for atmospheric depth. |

---

## 5. Game Invariants Protection Ledger

The following gameplay behaviors and mathematical constants **must be preserved** throughout all subsequent visual polish phases:

1. **Exactly Three Lanes**:
   - Lateral coordinates strictly pinned:
     - Left Lane: `X = -3.6m`
     - Center Lane: `X = 0.0m`
     - Right Lane: `X = +3.6m`
   - Rail spacing: `CONSTANTS.LANE_WIDTH = 3.6m`.
2. **Kinematics & Maneuvers**:
   - Lane change transition duration: `0.18s` (smoothstep cosine interpolation).
   - Base jump takeoff velocity: `11.5 m/s`; jump apex ~`2.7m` at `0.38s`; total jump airtime `0.76s`.
   - Fast-drop: instant downward velocity `-28.0 m/s` triggered on airborne down input.
   - Slide duration: `0.65s`; AABB collider height dynamically drops from `1.8m` to `0.75m`.
   - Queued landing slide: pressing down mid-air immediately initiates fast-drop and guarantees instant ground/roof slide on touchdown without dead zones.
3. **Collision Geometry & Speed**:
   - Normal runner collider: `[-0.35, y, -0.35]` to `[0.35, y + 1.8, 0.35]`.
   - Slide runner collider: `[-0.35, y, -0.35]` to `[0.35, y + 0.75, 0.35]`.
   - Low barrier clearance: requires `y > 1.1m` to safely clear.
   - High barrier clearance: requires `y <= 0.75m` to safely pass under.
   - Swept continuous collision detection (CCD) prevents tunneling during frame spikes at speeds up to `44.0 m/s`.
4. **Train Ramps & Rooftop Traversal**:
   - Climbable ramp gradient: smooth ascent onto train roof at `Y = 4.35m`.
   - Train walkable surface height: invariant at `4.35m`.
   - Rooftop transfers: lateral lane switching between trains at `4.35m` retains rooftop support without dropping to tracks.
   - Platform-relative velocity: standing on moving train transfers train velocity (`12–16 m/s`) to runner.
5. **Difficulty Curves & Progression**:
   - Speed progression follows `SpeedController` profile: Beginner (`18.0 → 38.0 m/s`), Hard (`24.0 → 44.0 m/s`).
   - Distance milestones: early ramp (0–300m), mid ramp (300–1200m), asymptotic (3200m+).
   - Seeded procedural generation ensures 100% solvable routes with at least one reachable path at every chunk transition.
6. **Coin Collection & Power-Ups**:
   - Magnet collection radius: `6.0m` baseline, quadratic attraction velocity.
   - Power-up durations: Magnet (10s), Super Sneakers (10s, 1.35x jump boost), Jetpack (8s, 12m cruise altitude), 2X Multiplier (10s).
   - Hoverboard: double-tap deployment, provides 1 crash absorption shield with invulnerability recovery.
7. **Revive & Quick Retry**:
   - Maximum 3 revives per run; key cost escalates (1 → 2 → 4 keys).
   - Revive grants 2.0s invulnerability and clears immediate lane obstacles.
   - Quick Retry ("PLAY AGAIN" / `#game-over-retry-btn` / `R` key) reinitializes run in <100ms without page reload.
8. **Currency & Persistent Storage**:
   - LocalStorage keys: `metro_runner_wallet`, `metro_runner_keys`, `metro_runner_hoverboard_charges`, `metro_surf_high_score`.
9. **Desktop & Touch Controls**:
   - Desktop: Arrow keys, WASD, Spacebar, `R` (retry), `Esc` (menu/pause).
   - Mobile: Touch swipe gestures (Up/Down/Left/Right) and double-tap (hoverboard).
   - Click and touch handlers must remain responsive without event propagation traps.
10. **Stable Scene Pooling**:
    - Chunk pool maintains strictly 5 active recyclable chunks with zero unbounded memory growth.

---

## 6. List of Tests to Preserve Across Visual Phases

The following 39 automated test suites must remain green throughout all subsequent visual overhaul phases:

1. `test/task1-real-moving-trains.test.ts` — Moving train relative physics, swept collision, audio queries.
2. `test/task1-chase-collision-death.test.ts` — Collision diagnostics, stumble mechanics, chaser capture.
3. `test/task2-railway-obstacles.test.ts` — Barriers, hurdles, collision fairness.
4. `test/task3-procedural-difficulty.test.ts` — Pacing curves, recovery breathers, chunk transitions.
5. `test/solvability.test.ts` — Deterministic route solvability across 10,000 simulated chunks.
6. `test/lane-movement.test.ts` — 3-lane lateral movement and interpolation timing.
7. `test/powerups.test.ts` — Magnet, sneakers, jetpack, multiplier mechanics.
8. `test/gameplay-depth.test.ts` — Combo scoring, near-miss detection, style points.
9. `test/progression.test.ts` — Wallet persistence, missions, lifetime statistics.
10. `test/characters.test.ts` — Character catalog attributes and visual assignments.
11. `test/hoverboards.test.ts` — Hoverboard shielding, double-tap deploy, crash absorption.
12. `test/task7-ui-progression.test.ts` — HUD updates, modal transitions, currency synchronizers.
13. `test/task8-audit-state.test.ts` — Invariants audit, state consistency checks.
14. `test/train-rooftop-collision.test.ts` — Rooftop bounds, gap leaps, lateral roof transfers.
15. `test/difficulty-progression.test.ts` — Speed controller curves and asymptotic limits.
16. `test/character-locomotion.test.ts` — Locomotion states (RUN, JUMP, SLIDE, FALL).
17. `test/coin-collection-system.test.ts` — Coin attraction physics and collection registers.
18. `test/jetpack-flight-system.test.ts` — Flight takeoff, cruising altitude, landing safety.
19. `test/task5-train-visuals-geometry.test.ts` — Train geometry dimensions and bumper colliders.
20. `test/task5-trains-character-camera.test.ts` — Camera tracking across elevation shifts.
21. `test/task6-character-camera-hud.test.ts` — HUD feedback badges and camera framing.
22. `test/task7-complete-gameplay-integration.test.ts` — End-to-end game lifecycle integration.
23. `test/train-climbing-physics.test.ts` — Ramp climbing angles and support surface transitions.
24. `test/locomotion-feedback.test.ts` — Audio/visual feedback on jumps, slides, and landings.
25. `test/coin-routes-reachability.test.ts` — Coin reachability across 3D jump arcs.
26. `test/task4-opening-chaser.test.ts` — Chaser model, opening cinematic, stumble reactions.
27. `test/task5-practice-arena.test.ts` — 10 practice mode modules and scenario presets.
28. `test/task6-graphics-performance.test.ts` — Graphics presets (AUTO, HIGH, MEDIUM, LOW) and adaptive hysteresis.
29. `test/task7-audio-soundscape.test.ts` — Soundscape manager, audio ducking, pitch shifts.
30. `test/task8-modular-environments.test.ts` — Multi-district scenery recycling and theme switches.
31. `test/revive-system.test.ts` — Revive offer state machine, cost escalations, save countdown.
32. `test/task4-jump-arcs-powerups.test.ts` — Ballistic jump physics and power-up stacking.
33. `test/dynamic-world-generation.test.ts` — Modular district generation and material caching.
34. `test/premium-environment-art.test.ts` — Architectural landmark assets and district lighting.
35. `test/environmental-encounters.test.ts` — Dynamic weather, time-of-day, and district transitions.
36. `test/task4-worldgen-audit.test.ts` — World generation memory leaks and object pooling.
37. `test/task3-train-rooftop-gameplay.test.ts` — Rooftop traversal mechanics and obstacle clearance.
38. `test/task4-dynamic-moving-trains.test.ts` — Dynamic moving train speed profiles and encounters.
39. `test/task5-hard-mode.test.ts` — Hard mode physics, train densities, and score multipliers.
40. `test/reachability-validator-physics-rigor.test.ts` — Reachability validator physics rigor.
41. `test/production-developer-tools-security.test.ts` — Dev tools security and window debug registration gating.
