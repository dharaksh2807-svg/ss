# Task 8 — Universal gameplay input and device compatibility

Date: 2026-11-04 (Asia/Kolkata). Base: `1cb57ef`, clean `main`, equal to fetched `origin/main` before work.

## Scope and implementation

Work stayed on main, without subagents, dependencies, procedural generation, collision, speed, economy, or Player movement changes. Targeted inspection covered input/settings, their Game/HUD/navigation callers, camera, and renderer resize/quality dependencies.

Planning policy: compact planning, dependency context, impact verification, no delegation. The existing `INPUT_ACTION`/Player path remains authoritative for gameplay. Device adapters do not implement lane movement or queueing themselves.

- Keyboard bindings remain configurable: arrows/WASD move/jump/slide, Space jumps, E/B deploy a board, Escape/P pause. Held gameplay keys suppress page scrolling without repeating actions. Editing fields and menu controls retain their native keyboard handling. Starting/resuming returns focus to the canvas.
- Canvas gestures use Pointer Events where available and a mutually exclusive touch fallback. Thresholds retain the settings presets (26 CSS px / 400 ms by default), with 1.25 axis dominance, one action per contact, pointer identity, cancellation, and multi-touch rejection. Only two completed short taps deploy a board; swipes do not count as taps.
- HUD/touch board buttons use a single native click adapter, supporting touch, pointer, keyboard, and assistive activation. The old HUD shortcut bypass was removed. Controls remain available on large touch tablets/hybrids; short landscape controls sit at the sides. Existing visibility preferences and safe-area placement remain in force.
- Standard-mapped browser gamepads are polled in the existing frame loop. D-pad/left stick provide direction, south button (index 0) jumps/confirms, east (1) slides/backs out, west (2) deploys a board, Start (9) pauses/resumes. Menus use directional focus, confirm, and the existing Escape/back navigation. This is bounded standard mapping support, not arbitrary controller remapping or comprehensive native select editing.
- Stick activation is 0.55 with a 0.25 release dead zone; edges and merged action sets suppress repeats and duplicate D-pad/stick/button commands. Connection/resume requires fresh input after the current held state is sampled. Unsupported mappings/API failures are ignored; disconnect pauses a live run and keyboard remains usable.
- Portrait framing centers the track and moves the camera back while retaining the existing vertical FOV and forward lookahead. Intro completion/reset use the same framing. Landscape gameplay framing remains unchanged. Resize preserves perspective aspect, handles zero-size transients, and preserves photo-mode FOV.
- Visibility, blur, pagehide, and context loss suspend simulation and pause a live run. Focus/pageshow/context restoration reset frame timing and require explicit resume. Orientation/resize cancel incomplete gestures and rearm controllers. Three.js handles context restoration without a page reload. Resume/restart while the context is lost cannot hide the pause controls or reset the run.
- LOW, BALANCED (internal MEDIUM), HIGH, and AUTO remain intact, with existing DPR caps 1 / 1.33 / 2. iPad desktop-style user agents with touch are treated conservatively by AUTO. Invalid DPR and zero-height renderer resizes are guarded.

## Executed verification

All listed commands passed after their relevant final production changes:

| Command | Observed result |
| --- | --- |
| `npm run build` | TypeScript and Vite succeeded; existing large-chunk warning remains |
| `npx tsx test/task8-universal-input.test.ts` | 403 assertions: swipe identity/single dispatch/middle lane/repeated gestures, diagonal rejection, tap board, cancellation/multitouch, exclusive fallback, native buttons, menu suppression, standard pad thresholds/edges/buttons/disconnect/API failure, keyboard coexistence, perspective projection and graphics caps |
| `npx tsx test/lane-movement.test.ts` | 50/50 |
| `npx tsx test/input-accessibility.test.ts` | 14 checks |
| `npx tsx test/phase4-collectibles-powerups-inputs.test.ts` | 61/61 |
| `npx tsx test/task2-controls-accessibility.test.ts` | 79/79 |
| `npx tsx test/task5-trains-character-camera.test.ts` | 92/92 |
| `npx tsx test/task6-character-camera-hud.test.ts` | All checks passed |
| `npx tsx test/world-camera-polish.test.ts` | Passed |
| `npx tsx test/instant-play-again-lifecycle.test.ts` | 49/49 |
| `npx tsx test/task6-graphics-performance.test.ts` | 58/58 |
| `npx tsx test/task7-complete-gameplay-integration.test.ts` | All 11 suites passed |
| `npx tsx test/ui-navigation.test.ts` | Passed |
| `npx tsx test/responsive-hud.test.ts` | Passed |
| `npx tsx test/browser-universal-input.ts` | Six Chrome viewport profiles; no runtime exceptions |
| `git diff --check` | Passed |

The camera test projects runner and hazards in every lane, both camera modes, at 20/52/78 metres ahead and speed 52 across six aspect ratios. This verifies geometric view coverage; it is not a physical-device reaction-time study.

The retry suite initially reported 46 passes / 3 Escape failures. The same failures reproduced with the baseline CameraController and unchanged production navigation dependencies. The fixture had omitted NavigationCoordinator, which already owned Escape on main. The fixture now instantiates that coordinator; production navigation was not altered to satisfy the test. The keyboard repeat assertion was updated to require default-scroll prevention while still requiring zero repeated actions.

## Browser evidence and limits

Chrome 156.0.8078.80, headless, existing Playwright dependency, local development server. Viewports: 1440×900 desktop, 360×800 Android-size, 390×844 iPhone-size, 844×390 phone landscape, 768×1024 tablet portrait, and 1024×768 tablet landscape. Touch contexts use DPR 3 and CDP touch streams. These labels describe emulation sizes, not the tested operating system or browser engine.

Browser checks exercise actual keyboard and CDP touch dispatch, compatibility-event duplicate suppression, repeated gestures, HUD control bounds (at least 44×44 CSS px), board single dispatch, modal suppression, rotation without a run reset, correct drawing-buffer aspect, and post-resume keyboard focus, and P pause/resume in all six profiles. A final browser regression exposed synthetic Escape recursion while restoring P; pause now dispatches its shared action directly and menu Escape remains exclusively owned by the existing coordinator. A mocked standard Gamepad API exercises live Game/menu integration: held stick, keyboard coexistence, directional menu focus, confirm/back, Start pause/resume, and disconnect. Lifecycle events cover blur/focus, visibility, pagehide/pageshow, and a simulated 60-second absence followed by bounded frame deltas. `WEBGL_lose_context` actually loses/restores the Chrome WebGL context and verifies rendering, explicit resume, and run preservation.

Portrait/landscape screenshots were inspected for runner visibility, three distinct lanes, and controls away from upcoming hazards. Local run artifacts: `/tmp/metro-task8/` (logs, screenshots, browser-results.json).

Unverified: physical Android phones, iPhones/iPads and Safari/WebKit, physical tablets, physical gamepads and browser/driver-specific mappings, actual OS screen lock/unlock, device thermal behavior and sustained mobile FPS. Unsupported gamepad mappings intentionally produce no commands. Native PlayStation/Xbox/Nintendo deployment is outside scope.

Separate performance follow-up: the production main bundle remains approximately 1.9 MB minified (about 482 KB gzip), and Vite reports a chunk-size warning. This task did not attempt renderer optimization or establish physical-device frame-rate guarantees.

VERDICT: PASS
