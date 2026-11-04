# Task 9 — Final UI and cross-device release audit

Date: 2026-11-04, Asia/Kolkata. Baseline: `8f9c192be427de1f89ba9f75e9fa59139f138b7b`, clean `main`, equal to fetched `origin/main`. Work remained on main, without subagents, full repository scans, new dependencies, force pushes, or changes to progression rules, prices, collision, procedural generation, or rendering algorithms.

Policy: compact plan, targeted dependency inspection, full regression verification. Inspection followed the recent UI/input diffs, existing handoff, existing browser harnesses, and the specific failing routes below. All browser saves used fresh Playwright contexts; no user browser profile or local save was loaded or reset. Node suites use isolated storage fixtures.

## Confirmed defects and repairs

| Reproduction on the baseline | Observed result and cause | Repair |
| --- | --- | --- |
| Home → Events / Practice / Profile / Daily Rewards / Daily Challenge → Escape | All five ignored Escape and failed focus restoration. They retained independent OPEN/hide routing outside NavigationCoordinator. | Register these existing views with the coordinator; Back/Close uses UI_BACK, lifecycle cleanup uses hide(false), Practice launch clears the navigation stack. |
| Home → Profile → Close; Home → Daily Rewards → Close | Two track resets, despite staying in the lobby. Both close methods emitted GO_TO_MENU, which calls player/track reset. | Restore the previous view through navigation; reserve GO_TO_MENU for explicit Home/lifecycle actions. |
| Home → Achievements | Opened MISSIONS. Both dock buttons emitted the same unqualified event. | Pass and validate the requested tab; Missions opens MISSIONS, Achievements opens ACHIEVEMENTS. |
| Compact Home → Daily Rewards | The sole entry was in a hidden side rail. | Add an entry in the existing Profile footer. Daily Challenge already has a visible Events route. No Home or modal redesign. |
| Shop → Luna preview → Back; Profile → Daily Rewards → Back | Focus went to Close rather than the originating control. The parent rerender replaced the saved DOM node. | Restore the equivalent control by stable id or matching data attributes, scoped to the restored view. |
| Shop → Pulse Rider 3D Preview while Urban Glide is equipped | Opened Urban Glide. The click emitted only SHOP as the origin; showroom always selected equipped board. | Carry the requested board id through the existing OPEN_BOARDS route; Home still opens the equipped board. |

The new regression test also checks repeated open/close, single visible destination, nested Events/Daily Challenge and Profile/Daily Rewards returns, exact focus restoration, requested product previews, and Practice pause/resume after launch. Existing Home/Shop/Pause/Game Over regression routes continue to pass.

## Refresh investigation: measured, not inferred

Targeted instrumentation counted main-frame document requests, Vite websocket update/full-reload/error messages, Game.startRun calls, TrackManager.reset calls, lobby/Shop rerenders, WebGL context events, and renderer object identity. Page exceptions and console errors were captured separately.

Baseline sequence: open/close each of the five secondary screens, then click Achievements. Evidence in `/tmp/metro-task9/secondary-baseline.log`: one initial document load, zero HMR messages, zero exceptions/context losses, zero run starts, and **two track resets**, caused by Profile and Daily Rewards Close.

After repair: the expanded five-viewport regression performed 25 secondary-screen layout checks plus repeated Close/Escape/nested preview journeys. Before its intentional persistence reload it recorded **zero track resets, zero run starts, zero context loss/restoration, the same renderer, 54 lobby updates and 5 Shop rerenders**. One initial document request; no HMR update. The explicit persistence reload was the sole second document load.

Production smoke checks on five viewport profiles each recorded one initial document load, no HMR websocket, and no runtime/console errors. No automatic browser document refresh was reproduced in the audited journeys. The confirmed refresh-like behavior was a lifecycle/scene reset on two Close actions; this evidence does not diagnose any different, unprovided refresh sequence.

## Functional and visual status

PASS means the listed automated/runtime evidence passed; it is not certification of every browser or physical device.

| Area | Status | Evidence |
| --- | --- | --- |
| Home | PASS | Play, three difficulty toggles, direct customization, secondary navigation, correct Missions/Achievements destination; production smoke |
| Shop | PASS | Six categories × five sizes = 30 layouts; all product actions reachable, prices/ownership, confirmation, insufficient funds and duplicate confirmation tests |
| Runner/Board | PASS | Runner/outfit purchase/equip, requested board preview, charges, 16 repeated showroom cycles, actual reload |
| Worlds | PASS | Free/owned/locked/signature rules, purchase/equip, Back/Home, persisted selection and Dynamic Districts eligibility |
| Missions | PASS | Four tabs × five sizes = 20 layouts; daily/mission/achievement/season claims, exact rewards and duplicate rejection |
| Navigation | PASS | Home/Shop/Pause/Game Over origins; secondary/nested routes; Escape, id/data focus restoration, listener/RAF cleanup |
| Purchases | PASS | Isolated UI fixtures: runner 1,500, board 2,500, charge pack 300, world 3,000, outfit 1,000; exact deductions and duplicate durable purchase/confirmation rejection |
| Persistence | PASS | Actual browser reload retains Luna/Electric Phantom, Pulse Rider, 8 charges, Neon Rainline, 1,700 coins, 7 keys, mission progress and changed settings |
| Desktop UI | PASS | Chrome desktop/laptop layouts and production navigation/play smoke; existing 143 screen/viewport matrix |
| Mobile UI | PARTIAL | Phone portrait/landscape/tablet emulation passed, including 25 added secondary layouts; physical Android/iOS and Safari unverified |
| Touch Controls | PARTIAL | CDP touch streams, no duplicate swipes, middle-lane arrival, menu suppression, control reachability; physical hardware unverified |
| Gamepad | PARTIAL | Emulated standard Gamepad API: dead zone, held-input suppression, mapped actions, menus, pause and disconnect; physical controllers unverified |
| Gameplay | PASS | Lane/input/camera/lifecycle browser evidence and full regression suite; no gameplay rule changes |

Visual inspection included 360px Shop cards, 390px Missions/Achievements, Board Showroom, Worlds, compact Profile, and 800×360 Home. No recurrence of the original clipped Shop cards, cramped/narrow progression sections, or Board Showroom misalignment was found. The primary redesigned sections retained their existing fonts and layout. The confirmed hidden Daily Rewards access and confusing Achievements destination were fixed without redesign.

## Save fixture details

Starting from a disposable context, set its test wallet to 10,000 coins. Purchase Luna with a repeated activation (deduct 1,500 once), Pulse Rider with repeated activation (2,500 once), one charge pack (300), Neon Rainline through repeated confirmation (3,000 once), then Electric Phantom outfit through repeated activation (1,000 once). The resulting wallet is 1,700. Set a non-default key balance of 7, partial mission progress, HIGH swipe sensitivity, and reduced motion. A real page reload must preserve the complete recorded selection/ownership/inventory/settings snapshot.

Separate existing suites check all Shop categories, unavailable/locked actions, insufficient-funds UI updates while confirmation is open, starter trials and unlock requirements, exact daily/achievement/season payouts, and one-time reward claims. The duplicate-purchase assertions are not a rate limit on intentional repeat purchases of consumable packs.

## Build and regression evidence

- Baseline `npm run build` and `npm test`: PASS; 53 scripts, exit 0, no failing assertion/error markers. No pre-existing test failure was observed.
- Final `npm run build`: PASS; TypeScript and Vite. Existing ~1.917 MB minified / ~482 KB gzip main bundle advisory remains.
- Final `npm test`: PASS; all 53 scripts completed with exit 0, no failing assertion/error markers; final rooftop regression finished with 248 passing assertions.
- Focused tests: `ui-navigation.test.ts`, `shop-ui.test.ts`, `showroom-ui.test.ts`, `missions-ui.test.ts` passed; assertions were extended rather than weakened.
- New `browser-release-audit.ts`: PASS; 25 secondary layouts, refresh instrumentation, exact purchases, non-default persisted save, difficulty controls and Practice launch cleanup.
- Existing browser suites: ui-navigation, shop-ui, showrooms, world-selection, missions-ui, responsive-ui, universal-input. All passed on the baseline and were rerun after repairs.
- `browser-responsive-ui.ts`: 143 screen/viewport combinations, including desktop/laptop, narrow phones, short landscape and tablets. Additional checks cover safe-area emulation, reduced motion, focus, menu touch scrolling and actual run HUD distance.
- `browser-universal-input.ts`: six profiles, keyboard/P pause, touch streams, standard-pad emulation, rotation, background/page events, bounded resume delta and real Chrome WebGL loss/restoration.
- New `browser-release-production.mjs`: five production viewport profiles, no development game globals, no HMR socket, no unintended navigation and no runtime/console errors.
- `git diff --check`: PASS.

Two test-harness corrections made during this audit did not change assertions: use the actual BEGINNER mode name, and scope the board tab locator to the visible showroom so a retained hidden Shop article does not create an ambiguous locator.

## Performance observations

Measured serially without competing test browsers: headless Chrome 156.0.8078.80, 1366×768, host WebGL renderer. These are requestAnimationFrame interval distributions, not GPU timer measurements or mobile FPS guarantees. The measurement fixture grants temporary invulnerability to keep a representative normal run active; obstacles remain rendered.

Final serial sample, 300 frames per tier (performance harness exit 0, VERDICT: PASS, no runtime/console errors):

| Tier | p50 / p95 / p99 | Frames over 33.34 ms | Median / maximum draw calls |
| --- | --- | --- | --- |
| LOW | 16.7 / 16.7 / 16.8 ms | 0 / 300 | 2,192 / 2,526 |
| HIGH | 16.7 / 16.7 / 16.8 ms | 0 / 300 | 3,082 / 3,555 |

Twenty preview open/close cycles retained exactly 56 tracked window listeners, 4 document listeners and 238 EventBus callbacks. Runner preview: 79 geometries / 1 texture / 162 scene objects; board preview: 12 / 1 / 24. Both preview RAF ids were null while hidden. Main scene counters were also unchanged during those cycles.

Across 12 repeated runs, active scene object counts varied with generated layouts (5,336–5,931) rather than accumulating; geometry counters ranged 1,157–1,643. Texture counters grew from 19 to 25 during the first seven runs, then stayed at 25 for the remaining five runs. EventBus callbacks stayed at 238. This bounded sample showed no repeated-preview listener/resource leak or monotonic scene growth; it is not a long-duration memory certification.

The high draw-call count and existing bundle-size advisory warrant separate physical-mobile profiling. No renderer optimization was performed solely because of these counts or file sizes.

## Reproduce and locate evidence

Use the existing dependencies and separate terminals:

```sh
npm run dev -- --host 127.0.0.1 --port 3001
npm run build
npm run preview -- --host 127.0.0.1 --port 3099 --strictPort
mkdir -p /tmp/metro-task9
npx tsx test/ui-navigation.test.ts
npx tsx test/browser-release-audit.ts
node test/browser-release-production.mjs
# Run performance separately, after all other browser/CPU-heavy checks finish:
node test/browser-release-performance.mjs
npm test
```

Browser harnesses support CHROME_PATH and URL overrides. Existing UI scripts use UI_TEST_URL; universal input uses METRO_TEST_URL. New production smoke uses PRODUCTION_TEST_URL. Logs/screenshots/JSON from this session are in `/tmp/metro-task9/`; the input suite writes `/tmp/metro-task8/`.

Outstanding hardware validation: physical Android phones/tablets, iPhone/iPad Safari/WebKit, touch/keyboard hybrids, physical standard gamepads with browser/driver variations, actual screen lock/background recovery, thermal throttling and sustained mobile frame times. Native console deployment remains outside scope.

Final verification resumed from existing logs: the final full-suite process and final serial performance process both completed with exit 0. Their completed runs were not repeated. No production code changed after the successful final build.

VERDICT: PASS
