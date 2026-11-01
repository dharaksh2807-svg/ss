# Metro Runner 3D final integration audit

Repository: https://github.com/dharaksh2807-svg/ss

Integration: PR #4, `integration/professional-polish` into `main` by a normal merge.
Audit date: 1 November 2026. Remote base before integration: `6d46a6753c0a1e6e09be7b2e2150faa92f103578`.

## Branch and commit audit

Git was fetched before the audit and again before publication. Ancestry and file comparisons, rather than branch names, established the following:

| Branch | Audited head | Already in main before this merge | Disposition |
| --- | --- | --- | --- |
| `feature/train-rooftop-traversal` | `3cfe6bea` | Yes | Already merged; preserve |
| `polish/phase-0-baseline` | `d2aa6194` | No | Incorporated in PR #4 |
| `polish/phase-2-lobby` | `681a861c` | No | Incorporated in PR #4 |
| `polish/phase-3-hud-modals` | `88aca2b9` | No | Incorporated in PR #4 |
| `polish/phase-4-characters` | `71c4c179` | No | Incorporated in PR #4 |
| `polish/phase-5-trains` | `9506534e` | Yes | Already merged; preserve |
| `polish/phase-6-world-camera` | `6feae461` | No | Original valid Phase 6 commit `25377d2` is in PR #4; reject corrupted `6feae461` |
| `integration/professional-polish` | `21a8cdad` | No | Incorporated in PR #4 |

Phase 0 baseline documentation and telemetry, Phase 2 lobby, Phase 3 HUD/modals, Phase 4 characters/locomotion, Phase 5 trains, original Phase 6 environment/camera, and the previously merged rooftop traversal are all retained. No additional valid branch changes were missing from PR #4.

The local Phase 6 merge-only descendants also duplicate Phase 0/2/3 work already incorporated in PR #4. Existing local branches and the unrelated stash were preserved.

## Phase 6 integrity and conflict resolution

`git diff 25377d2 6feae461` changes only two source files. Byte comparisons prove that the bad commit puts the original `CameraController.ts` implementation in `EnvironmentConfig.ts`, and the original `WorldScene.ts` implementation in `CameraController.ts`. It contributes no missing valid functionality and must not be merged.

PR #4 already contains original Phase 6 commit `25377d2` by ancestry. Its environment and camera files matched that commit exactly before this audit. Its WorldScene differed only by the deliberate Phase 5 exposure resolution: **1.22 retained instead of 1.20**. The correct TypeScript file boundaries and exports are preserved.

## Corrections made during release verification

- **Opening cinematic:** reproduced the original 88-pass/1-fail suite. `player.speed = 0` also changed the SpeedController's initial speed, so an early skip restored zero. Preserve the configured launch speed before cinematic overrides and use it throughout takeoff and completion. The original assertion is retained; added coverage checks Normal, Hard, Easy, several skip times, natural completion, disabled intros, and fast retry. The suite now has 149 passing assertions.
- **Atmospheric transitions:** both skyline variants used the same material, making independent opacity impossible. Give the historic skyline its own material. Fade clouds continuously across tunnel transitions while honoring graphics settings. A new regression test failed on the old implementation and passes after the repair.
- **Parked trains:** reproduced overlapping same-lane train hulls in seed 1337. The placement guard previously skipped static/static pairs. Validate actual parked hull colliders within and across chunk boundaries, rejecting unpublished layouts while preserving existing objects. The occupancy suite now includes parked-layout and rollback regressions.
- **Superseded assertions:** history confirms `69b35da` intentionally selected the Classic camera default, and `7cf23e4` intentionally reused curved amber/red warning materials. Update those visual assertions, retaining geometric checks for platform strips and portal beacons.
- **Traffic calibration:** the old comparison against `65e7d57` predates priority rooftop scheduling. A diagnostic on untouched PR #4 already measured only 23 Normal and 14 Hard moving passes, below its old thresholds, and did not choose a paired formation. Retain warning lead, actual moving passes and ramp access in every stage, reachability, variety, and no-overlap checks. Derive object limits from active chunks and current catalog sizes; test paired formations directly rather than requiring one random mixed run to select them.
- **Browser harnesses:** use low graphics quality for the production security audit to avoid software-renderer starvation; strengthen checks for all audited globals and runtime errors. The scoring fixture is protected from random collisions and waits for actual rendered multiplier state rather than a fixed 500ms delay.

No force pushes, hard resets, branch deletions, or protection bypasses are used.

## Verification

| Check | Observed result |
| --- | --- |
| `npm run build` | PASS; TypeScript and Vite, 101 modules |
| `npm test` | PASS; 41 scripts, exit 0, zero failing assertion markers |
| Opening cinematic/chaser | 149 passed, 0 failed |
| Moving/parked occupancy | 47 checks passed |
| Supplemental TypeScript suites | 26 executions passed (including traffic calibration and 216/216 fast-retry assertions) |
| Existing `verify-integration-final.mjs` | 19/19 checks; zero reported console errors |
| `final-integration-runtime.mjs` | 15/15 checks; districts, camera, launch and actual mobile tap/swipe dispatch |
| Production bundle browser audit | 13 passed, 0 failed; zero production browser errors |
| Moving-train/rooftop browser acceptance | Avoidance, rooftop support and safe descent passed |
| Instant Play Again browser walkthrough | Three runs passed; zero console errors |
| Hard Mode scoring browser walkthrough | 1.25X → 2.5X → 1.25X verified |

Supplemental suites cover save backup/progression, character presentation, geometry, train synchronization, continuous collision/occupancy, reachability, collectibles/power-ups, input accessibility, revive/death lifecycle, debug isolation, branching junctions and secret routes. Full suite coverage includes procedural environments, animations, HUD/modals, game modes, and rooftop climbing/physics.

The 50-retry performance check initially exceeded its limit under concurrent software-renderer load; rerunning without those browsers passed in 11.443 seconds against a 15-second limit. Production startup initially timed out under that load; the security harness now explicitly uses the game's existing LOW preset while retaining and strengthening its security assertions. An interruption terminated one validation pass; all eight final release commands were then rerun serially and completed with exit 0.


The build's existing Vite bundle-size advisory remains; compilation and bundling succeed. Browser collision/scoring fixtures use developer access only in the development build. The production browser audit separately checks that those globals and developer hotkeys remain unavailable.

## Cleanup

Once PR #4 is merged, PR #3 is superseded by the valid original Phase 6 functionality and its verified corrections. No branches are deleted automatically. All eight audited branches can be removed later after retaining this audit; the Phase 6 head is superseded, not merged, because its final commit is corrupt. The rooftop and Phase 5 branches were already merged before this work.
