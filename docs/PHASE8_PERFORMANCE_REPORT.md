# Phase 8 performance, stability and accessibility report

Baseline source: `40f524208` (latest origin/main at audit start). Changes are confined to render-resource lifetime, HUD updates, focused-control keyboard handling and narrow-screen badge placement. Gameplay physics, collisions, speed, difficulty, score and progression logic are unchanged.

Chrome 156, ANGLE Metal on Apple M5; 1280×720 viewport; device scale factor / renderer pixel ratio 1; manual HIGH preset; seeded RNG and track seed 1337. Each scenario samples 60 requestAnimationFrame intervals after 10 warm-up frames. Normal/Hard runs use developer invulnerability to hold the scenario, the moving train uses a fixed adjacent-lane encounter, and the rooftop sample starts on a fixed train roof. Five real crash → decline revive → Game Over → Play Again cycles follow. The control baseline was served from an untouched git-archive snapshot outside the checkout. No test/build tasks ran during the final paired samples.

Only resource/lifecycle improvements are attributed to this patch. Short frame-time samples varied substantially even on untouched code. The system Chrome installation updated during the audit; the control pair used the same current executable (156.0.8078.80); the first run’s full build number is UNAVAILABLE. These samples do not establish a causal FPS improvement.

Metric | Before (control) | After (control) | Change
--- | ---: | ---: | ---:
Lobby — Average FPS | 40.1 | 60.0 | +19.8
Lobby — Mean frame time (ms) | 24.9 | 16.7 | -8.2
Lobby — P95 frame time (ms) | 35.9 | 17.5 | -18.4
Lobby — P99 frame time (ms) | 47.6 | 17.7 | -29.9
Lobby — Average draw calls | 3,497 | 3,497 | +0
Lobby — Average triangles | 315,538 | 315,538 | +0
Lobby — WebGL geometries | 2,299 | 2,299 | +0
Lobby — WebGL textures | 17 | 17 | +0
Lobby — Renderer pixel ratio | 1.0 | 1.0 | +0.0
Lobby — Observed JS heap (MB) | 61.68 | 67.88 | +6.21
Lobby — HUD update time | UNAVAILABLE (inactive) | UNAVAILABLE (inactive) | —
Lobby — Ticker child-list replacements / 60 frames | 0 | 0 | +0
Normal — Average FPS | 47.4 | 60.1 | +12.8
Normal — Mean frame time (ms) | 21.1 | 16.6 | -4.5
Normal — P95 frame time (ms) | 30.9 | 18.0 | -12.9
Normal — P99 frame time (ms) | 35.2 | 20.1 | -15.1
Normal — Average draw calls | 3,382 | 3,388 | +6
Normal — Average triangles | 306,816 | 308,504 | +1,688
Normal — WebGL geometries | 4,488 | 2,281 | -2,207
Normal — WebGL textures | 23 | 23 | +0
Normal — Renderer pixel ratio | 1.0 | 1.0 | +0.0
Normal — Observed JS heap (MB) | 85.55 | 95.79 | +10.24
Normal — Mean HUD update (ms) | 0.248 | 0.127 | -0.122
Normal — Ticker child-list replacements / 60 frames | 60 | 18 | -42
Hard / moving train — Average FPS | 44.1 | 60.0 | +15.9
Hard / moving train — Mean frame time (ms) | 22.7 | 16.7 | -6.0
Hard / moving train — P95 frame time (ms) | 35.8 | 17.7 | -18.1
Hard / moving train — P99 frame time (ms) | 51.4 | 18.0 | -33.4
Hard / moving train — Average draw calls | 2,937 | 2,963 | +26
Hard / moving train — Average triangles | 262,652 | 262,101 | -550
Hard / moving train — WebGL geometries | 6,553 | 2,044 | -4,509
Hard / moving train — WebGL textures | 25 | 25 | +0
Hard / moving train — Renderer pixel ratio | 1.0 | 1.0 | +0.0
Hard / moving train — Observed JS heap (MB) | 79.44 | 79.40 | -0.04
Hard / moving train — Mean HUD update (ms) | 0.290 | 0.118 | -0.172
Hard / moving train — Ticker child-list replacements / 60 frames | 60 | 26 | -34
Rooftop — Average FPS | 49.5 | 60.1 | +10.6
Rooftop — Mean frame time (ms) | 20.2 | 16.6 | -3.6
Rooftop — P95 frame time (ms) | 23.7 | 18.8 | -4.9
Rooftop — P99 frame time (ms) | 25.1 | 19.7 | -5.4
Rooftop — Average draw calls | 3,732 | 3,777 | +44
Rooftop — Average triangles | 298,520 | 299,976 | +1,455
Rooftop — WebGL geometries | 9,470 | 2,914 | -6,556
Rooftop — WebGL textures | 25 | 25 | +0
Rooftop — Renderer pixel ratio | 1.0 | 1.0 | +0.0
Rooftop — Observed JS heap (MB) | 112.33 | 123.44 | +11.11
Rooftop — Mean HUD update (ms) | 0.208 | 0.123 | -0.085
Rooftop — Ticker child-list replacements / 60 frames | 60 | 19 | -41
After five retries — Average FPS | 60.0 | 60.1 | +0.1
After five retries — Mean frame time (ms) | 16.7 | 16.6 | -0.0
After five retries — P95 frame time (ms) | 18.5 | 18.0 | -0.5
After five retries — P99 frame time (ms) | 19.7 | 18.7 | -1.0
After five retries — Average draw calls | 3,398 | 3,397 | -2
After five retries — Average triangles | 308,206 | 307,927 | -279
After five retries — WebGL geometries | 20,557 | 2,322 | -18,235
After five retries — WebGL textures | 25 | 25 | +0
After five retries — Renderer pixel ratio | 1.0 | 1.0 | +0.0
After five retries — Observed JS heap (MB) | 168.69 | 103.75 | -64.94
After five retries — Mean HUD update (ms) | 0.140 | 0.092 | -0.048
After five retries — Ticker child-list replacements / 60 frames | 60 | 19 | -41

Earlier timing samples are retained here to expose variability rather than select only favorable results. Cells are FPS / mean ms / P95 ms / P99 ms.

Scenario | Original baseline | First post-change sample
--- | --- | ---
Lobby | 60.04 / 16.65 / 17.70 / 18.10 | 34.32 / 29.13 / 41.80 / 83.60
Normal | 59.90 / 16.69 / 17.80 / 18.70 | 38.60 / 25.91 / 45.60 / 121.20
Hard / moving train | 60.02 / 16.66 / 17.90 / 18.10 | 41.82 / 23.91 / 38.20 / 41.80
Rooftop | 60.05 / 16.65 / 17.80 / 19.80 | 51.49 / 19.42 / 26.90 / 27.50
After five retries | 59.99 / 16.67 / 17.50 / 18.00 | 34.78 / 28.75 / 48.10 / 62.40

Confirmed causes and corrections:

- `TrackChunk.ts`, `ObstacleFactory.ts`, `CollectibleFactory.ts`, `ResourceDisposal.ts`: retired trains, barriers and powerups were removed without disposal. Dispose each unique instance geometry/material, protecting constructor-owned factory caches, coin/VFX geometry and shared textures. Shared-resource ownership is captured once when each factory finishes initialization.
- `SceneryFactory.ts`, `SceneryPool.ts`: scenery rebuilds abandoned generated geometries/local materials; groups never borrowed from the pool were retained indefinitely. Release generated resources, preserve the shared material/texture cache, and retain only explicitly borrowed groups. No new pooling system was added.
- `CharacterModel.ts`, `CharacterPortraitRenderer.ts`: HUD show recreated unchanged portraits and left a RUNNING_STYLE_CHANGED subscription on discarded procedural models. Keep unchanged portraits and dispose/unsubscribe replaced models. Retry listener growth changed from one per retry to zero.
- `HUD.ts`: identical mission/celebration HTML was assigned every frame. Cache displayed markup; update only when content changes. Static 1,000-update probe: 1,000 → 0 replacements (−100%). Its exploratory total HUD CPU timing was 4.6 → 8.7 ms, measured during other test activity with different startup history; it is not evidence of a CPU speedup. The controlled per-frame HUD timings are listed above.

Retry resources (same control runs). Shader programs remained 20 before and after; texture count remained 25.

Cycle | Before geometries | After geometries | Before EventBus listeners | After EventBus listeners | Before JS heap MB | After JS heap MB
--- | ---: | ---: | ---: | ---: | ---: | ---:
1 | 11,803 | 2,323 | 214 | 210 | 131.0 | 141.1
2 | 14,003 | 2,329 | 215 | 210 | 152.1 | 159.2
3 | 16,176 | 2,313 | 216 | 210 | 188.3 | 87.2
4 | 18,367 | 2,324 | 217 | 210 | 126.9 | 85.8
5 | 20,557 | 2,322 | 218 | 210 | 144.8 | 105.0

After retry five: 20,557 → 2,322 geometries (88.7% fewer). This is a resource count, **not GPU memory usage**. Actual GPU allocation bytes and comprehensive DOM/browser listener counts are UNAVAILABLE. EventBus counts cover only the application bus. JS heap figures are browser observations, not retained-heap measurements.

Bounded soak: 12 cycles, alternating Normal/Hard, four environments, repeated character changes, powerup activation/expiration, pause/resume, and 180 accelerated 120 m chunk steps (~21.6 km). This extends the existing soak recipe; it is not 21.6 km of real-time play. Five actual Play Again cycles and natural ground → ramp → roof traversal were checked separately. The first expanded soak exposed the remaining dynamic-object leak and failed its resource bound; the final soak below passed after cleanup was extended.

Environment | First visit geometries | Second visit | Third visit
--- | ---: | ---: | ---:
MODERN_METRO | 2,102 | 2,109 | 2,096
HISTORIC_QUARTER | 2,400 | 2,418 | 2,411
UNDERGROUND_METRO | 1,843 | 1,847 | 1,850
NEON_INDUSTRIAL | 2,213 | 2,204 | 2,223

All final soak EventBus counts were 226; scenery pool retained-group counts were 0; shader programs stayed at 46. Texture counts warmed from 32 to 40 by cycle three, then stayed at 40. JS heap ranged 90.1–234.9 MB and repeatedly fell between cycles (first 193.3, final 147.9 MB). That pattern is consistent with garbage collection; it does not prove absence of every leak. Portrait-renderer resource counters reported zero in this harness, so they are not used as evidence about its GPU allocations; listener removal also has a direct regression test.

Accessibility and graphics:

- Confirmed initial failure: focusing Play and pressing Space left the game in MENU. `InputManager.ts` now lets focused buttons and editable/select controls receive native keys. Real-browser Tab/focus-visible/Space checks pass; gameplay keyboard dispatch and pause shortcuts still work.
- Confirmed 390×844 overlap: score covered the portrait name. `style.css` puts the portrait and mission in separate second-row slots below 480 px. Desktop placement is unchanged. The after image shows the overlap resolved.
- Mobile taps and a CDP touch swipe changed lanes correctly; touch buttons measured 58×58 px; scrolling stayed at zero. Orientation resize updated camera aspect and canvas width. Character-selection controls and responsive settings were exercised without horizontal page overflow.
- Reduced-motion setting applies its class and zero camera-shake multiplier; high-contrast setting applies its class. Existing focus outlines remain visible. This was a focused functional check, not a full WCAG or assistive-technology audit.
- LOW/MEDIUM/HIGH/AUTO switches rendered without console errors. LOW disabled shadows, HIGH restored shadows; manual overrides, sustained AUTO downgrade and hysteresis passed the existing 58-check graphics suite. No presets, train detail, lighting, shadow settings or mobile hardware policies were changed. LOW received functional checks; its visual readability was not separately screenshot-reviewed.

Validation (after the final runtime changes):

- `npm run build`: PASS. Existing >500 kB Vite bundle warning remains.
- `npm test`: PASS, all 41 scripted suites, exit 0. Expected mocked-storage diagnostic logging in the suite did not fail assertions.
- `npx tsx test/input-accessibility.test.ts`: PASS, 14 checks.
- `npx tsx test/dynamic-world-generation.test.ts`: PASS, 57 checks including unique resource disposal and shared-cache preservation.
- `npx tsx test/task6-character-camera-hud.test.ts`: PASS, including stable ticker DOM, celebration transitions, and disposed-character unsubscribe/resource checks.
- `npx tsx test/phase7-game-feel.test.ts`: PASS, 33 checks.
- `npx tsx test/phase6-release-audit.test.ts`: PASS, 335 checks.
- `node test/browser-production-bundle-isolation.mjs`: PASS, 13 checks; production lobby and Play work, developer hooks stay hidden, zero runtime errors.
- Real Chrome functional/soak harness: PASS. Lobby, native keyboard Play, Normal/Hard, moving train displacement, natural rooftop traversal, pause/resume, five Play Again cycles and mobile controls checked. All four telemetry runs and final functional run recorded zero console errors / uncaught page errors.
- `git diff --check`: PASS. No screenshot regression suite ran.

Four screenshots captured: one desktop before/after pair (1280×720) and one mobile before/after pair (390×844), visually inspected. The procedural layouts differ, so these are representative quality/layout checks, not pixel comparisons. Images, raw telemetry JSON and temporary harnesses remain outside the repository under `/tmp/metro-phase8`; none are staged. One baseline control browser teardown stalled after writing complete telemetry and was terminated; its measurement results were retained. No application assertion was suppressed.

Trade-offs and limits: retirement now does bounded disposal work at chunk recycling/reset, followed by normal allocation/upload for freshly generated content. No disposal cost on steady-state frames was isolated, and no reliable FPS gain is claimed. Browser scheduling, startup/JIT work, random variant consumption and live system load affect these short samples. Hardware mobile devices, multiple browser engines, actual GPU memory bytes and a wall-clock multi-hour soak remain unmeasured. Resource stability is supported only for the bounded scenarios above.

Files modified:

- `docs/PHASE8_PERFORMANCE_REPORT.md`
- `src/core/InputManager.ts`
- `src/environment/SceneryFactory.ts`
- `src/environment/SceneryPool.ts`
- `src/player/CharacterModel.ts`
- `src/scene/ResourceDisposal.ts`
- `src/style.css`
- `src/track/CollectibleFactory.ts`
- `src/track/ObstacleFactory.ts`
- `src/track/TrackChunk.ts`
- `src/ui/CharacterPortraitRenderer.ts`
- `src/ui/HUD.ts`
- `test/dynamic-world-generation.test.ts`
- `test/input-accessibility.test.ts`
- `test/task6-character-camera-hud.test.ts`

VERDICT: PASS
