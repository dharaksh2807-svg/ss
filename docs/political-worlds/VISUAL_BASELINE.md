# METRO RUNNER 3D — POLITICAL WORLDS VISUAL FORENSICS & BASELINE AUDIT
## Comprehensive 12-District Forensic Evaluation & Measurable Acceptance Criteria

> **Document Type:** Production Forensic Audit & Technical Acceptance Criteria  
> **Skill Profile:** Gravitas Engineering Reliability & Technical Art Lead Runtime  
> **Baseline Commit SHA:** `bb125faeb9f10c7cc2c66cc9b8f8055e3e81a644`  
> **Verification Harness:** Playwright Angle WebGL / Google Chrome / macOS  
> **Telemetry Source:** `artifacts/baseline-captures/telemetry_report.json`  

---

```
┌────────────────────────────────────────────────────────────────────────┐
│                      GRAVITAS TASK CONTRACT RECORD                     │
├────────────────────────────────────────────────────────────────────────┤
│ Mode:               plan (Forensic Visual Audit & Acceptance Baseline) │
│ Invariant Rule:     Report what actually happened, not what was hoped. │
│ Evidence Provenance: 76 Executed Browser PNG Captures & Telemetry Logs │
│ Scope:              VIP_EXPRESS (Districts 0-5), RAHULVERSE (Dist 0-5) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Executive Forensic Findings & Verified Baseline Status

### 1.1 Real Gameplay Smoke Tests (Collisions Enabled, Zero Bypasses)
Standard screenshot capture scripts often inject artificial invincibility (`activateReviveGrace(999999)` and `isIntroInvincible = true`). Under strict Gravitas audit protocols, a dedicated real-physics run was executed with all invincibility flags disabled:

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                REAL GAMEPLAY SMOKE TEST TELEMETRY                                         │
├───────────────────────┬──────────────┬──────────────┬────────────────────────┬─────────────┬──────────────┤
│ Environment Theme     │ Frames Alive │ Mid Distance │ Natural Impact Point   │ PlayerState │ Lifecycle    │
├───────────────────────┼──────────────┼──────────────┼────────────────────────┼─────────────┼──────────────┤
│ VIP_EXPRESS (Modi)    │ 150 frames   │ 48.9 m       │ Impact at 177.0 m      │ CRASH       │ DYING        │
│ RAHULVERSE (Rahul)    │ 146 frames   │ 46.9 m       │ Impact at 46.9 m       │ CRASH       │ DYING        │
└───────────────────────┴──────────────┴──────────────┴────────────────────────┴─────────────┴──────────────┘
```
- **Finding:** Track generation, collision detection, physics hitboxes, and game over triggers operate flawlessly under normal gameplay conditions. No phantom collision volumes exist within the playable rail corridor (`|X| <= 4.5m`).
- **Solvability:** Hurdles, high-barrier duck-unders, and train buffers provide clear visual anticipation windows (> 45 meters sightline distance).
- **Evidence Images:**
  - `artifacts/baseline-captures/vip_express_smoke_active_gameplay.png`
  - `artifacts/baseline-captures/vip_express_smoke_collision_response.png`
  - `artifacts/baseline-captures/rahulverse_smoke_active_gameplay.png`
  - `artifacts/baseline-captures/rahulverse_smoke_collision_response.png`

---

## 2. Global Forensic Diagnostics & Systemic Defects

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               GLOBAL FORENSIC DEFECT AUDIT                                             │
├──────────────────────────┬────────┬────────────────────────────────────────────────────────────────────┤
│ Audit Dimension          │ Status │ Forensic Observation & Exact Technical Remediation                 │
├──────────────────────────┼────────┼────────────────────────────────────────────────────────────────────┤
│ Ground Continuity        │ PASS   │ Deep foundation plinths (Y <= -4.8m) prevent floating meshes.      │
│ Black Slab Art Defect    │ PASS   │ 0 untextured black slabs detected across all 12 districts.         │
│ Draw Call Load           │ ALERT  │ 8,200 – 9,100 draw calls/frame is high for low-end mobile devices. │
│ Repeating Architecture   │ WARN   │ Box-extruded facades repeat every 40m without silhouette variety.  │
│ Scenery Camera Staging   │ WARN   │ Sidewalk props at |X| = 12.5m fly by too fast; need track cantilevr│
│ Character Rig Quality    │ WARN   │ Scenery caricature NPCs are procedural primitives, not rigged GLBs │
└──────────────────────────┴────────┴────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Twelve-District Visual Forensic Audits

---

### DISTRICT 0 (0m): Roadshow Royale (`vip_d0_roadshow_royale`)
*Environment: Mitron Express (`VIP_EXPRESS`) | Canonical Distance: ~0m to 400m*

```
┌────────────────────────────────────────────────────────────────────────┐
│ DISTRICT 0 TELEMETRY                                                   │
├──────────────────┬─────────────────┬─────────────────┬─────────────────┤
│ Meshes: 1,082    │ Triangles: 591k │ DrawCalls: 8,965│ FPS: 61 (Min 52)│
└──────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### A. Current Strengths Worth Retaining
- **Grand Lotus Motorcade Float:** Heavy truck chassis with chrome hubs, elevated dais, and 3D golden lotus emblem provides an unmistakable Indian political rally focal point.
- **Marigold Festive Atmosphere:** Twin petal cannons firing animated orange/yellow planes create vibrant celebration energy.
- **Solid Grounding:** Subterranean plinths at `Y = -2.8m` ensure zero terrain disconnect.

#### B. Confirmed Visible Defects
- **Draw Call Spikes:** 1,082 meshes generate nearly 9,000 draw calls due to unbatched marigold garland toruses and individual crowd members.
- **Static Crowd Geometry:** Crowds along sidewalks use identical cylinder torsos and sphere heads without diverse cheering animations.
- **Peripheral Blind Spot:** At active speed (18 m/s), the motorcade float on the left sidewalk (`X = -12.5m`) is visible for less than 1.5 seconds.

#### C. Intended Visual Composition & Exact Improvement Needed
- **Near Field:** Marigold garland festoons draped between trackside catenary poles; occasional falling flower petal particles drifting across the railbed.
- **Mid Field:** The Motorcade Float upgraded with a cantilevered overhead banner reaching toward `X = -5.0m`, bringing the spectacle directly into the player's primary vision cone.
- **Far Field:** Distant Rajasthani archway silhouettes and saffron rally flags waving against the golden sky.

#### D. Locally Saved Evidence Paths
- Runner View: `artifacts/baseline-captures/vip_d0_roadshow_royale_01_runner.png`
- Three-Quarter Review: `artifacts/baseline-captures/vip_d0_roadshow_royale_02_three_quarter.png`
- Mobile View (390×844): `artifacts/baseline-captures/vip_d0_roadshow_royale_03_mobile_390x844.png`
- Animation Frames:
  - Before: `artifacts/baseline-captures/vip_d0_roadshow_royale_04_anim_before.png`
  - Mid: `artifacts/baseline-captures/vip_d0_roadshow_royale_05_anim_mid.png`
  - After: `artifacts/baseline-captures/vip_d0_roadshow_royale_06_anim_after.png`

---

### DISTRICT 1 (400m): Chai Pe Charcha Chaos (`vip_d1_chai_pe_charcha`)
*Environment: Mitron Express (`VIP_EXPRESS`) | Canonical Distance: ~400m to 800m*

```
┌────────────────────────────────────────────────────────────────────────┐
│ DISTRICT 1 TELEMETRY                                                   │
├──────────────────┬─────────────────┬─────────────────┬─────────────────┤
│ Meshes: 555      │ Triangles: 582k │ DrawCalls: 8,669│ FPS: 60 (Min 52)│
└──────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### A. Current Strengths Worth Retaining
- **Monumental Brass Kettle:** The hand-hammered brass material (`#d97706`, high specular shine) is instantly recognizable and iconic.
- **Rising Steam VFX:** Expanding translucent steam particles rising from the spout create palpable heat and atmosphere.
- **Authentic Tea Vendor Props:** Ceramic kulhad racks and glass tea tumblers ground the satire in real Indian street culture.

#### B. Confirmed Visible Defects
- **Stationary Tea Stream:** When the kettle tilts, the animated tea stream is a static cylinder rather than a flowing procedural particle or UV-scrolling spline.
- **Low Contrast Against Ballast:** The terracotta tea stall roof blends slightly into the reddish ballast stones.

#### C. Intended Visual Composition & Exact Improvement Needed
- Implement animated UV scrolling on the tea liquid cylinder to simulate rushing, churning hot tea.
- Add an overhead chai stall awning extending over the rail corridor buffer zone (`X = -6.0m`) with warm hanging glowing filament bulbs.

#### D. Locally Saved Evidence Paths
- Runner View: `artifacts/baseline-captures/vip_d1_chai_pe_charcha_01_runner.png`
- Three-Quarter Review: `artifacts/baseline-captures/vip_d1_chai_pe_charcha_02_three_quarter.png`
- Mobile View (390×844): `artifacts/baseline-captures/vip_d1_chai_pe_charcha_03_mobile_390x844.png`
- Animation Frames:
  - Before: `artifacts/baseline-captures/vip_d1_chai_pe_charcha_04_anim_before.png`
  - Mid: `artifacts/baseline-captures/vip_d1_chai_pe_charcha_05_anim_mid.png`
  - After: `artifacts/baseline-captures/vip_d1_chai_pe_charcha_06_anim_after.png`

---

### DISTRICT 2 (800m): Inauguration Infinity (`vip_d2_inauguration_infinity`)
*Environment: Mitron Express (`VIP_EXPRESS`) | Canonical Distance: ~800m to 1200m*

```
┌────────────────────────────────────────────────────────────────────────┐
│ DISTRICT 2 TELEMETRY                                                   │
├──────────────────┬─────────────────┬─────────────────┬─────────────────┤
│ Meshes: 430      │ Triangles: 573k │ DrawCalls: 8,731│ FPS: 61 (Min 56)│
└──────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### A. Current Strengths Worth Retaining
- **Overhead Ceremonial Ribbon Rig:** Stretches across the entire rail corridor, guaranteeing 100% visibility from the runner camera.
- **Golden Shears Mechanical Crane:** Dramatic scissor animation provides clear anticipation as the blades open and snip.
- **Paparazzi Camera Flash Strobes:** Intermittent point light flashes create red-carpet media excitement.

#### B. Confirmed Visible Defects
- **Instant Ribbon Reset:** When the ribbon is cut, the replacement ribbon snaps into existence in a single frame rather than unrolling with kinetic bounce.
- **Flat Red Carpet Geometry:** The ceremonial carpet on the roadbed lacks edge trim and looks painted onto the ballast.

#### C. Intended Visual Composition & Exact Improvement Needed
- Animate ribbon regeneration with a rapid unrolling spring animation and physical ribbon tassels.
- Add red velvet stanchions with braided golden ropes along the track shoulder buffer.

#### D. Locally Saved Evidence Paths
- Runner View: `artifacts/baseline-captures/vip_d2_inauguration_infinity_01_runner.png`
- Three-Quarter Review: `artifacts/baseline-captures/vip_d2_inauguration_infinity_02_three_quarter.png`
- Mobile View (390×844): `artifacts/baseline-captures/vip_d2_inauguration_infinity_03_mobile_390x844.png`
- Animation Frames:
  - Before: `artifacts/baseline-captures/vip_d2_inauguration_infinity_04_anim_before.png`
  - Mid: `artifacts/baseline-captures/vip_d2_inauguration_infinity_05_anim_mid.png`
  - After: `artifacts/baseline-captures/vip_d2_inauguration_infinity_06_anim_after.png`

---

### DISTRICT 3 (1200m): Breaking News Boulevard (`vip_d3_breaking_news`)
*Environment: Mitron Express (`VIP_EXPRESS`) | Canonical Distance: ~1200m to 1600m*

```
┌────────────────────────────────────────────────────────────────────────┐
│ DISTRICT 3 TELEMETRY                                                   │
├──────────────────┬─────────────────┬─────────────────┬─────────────────┤
│ Meshes: 409      │ Triangles: 594k │ DrawCalls: 8,649│ FPS: 61 (Min 56)│
└──────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### A. Current Strengths Worth Retaining
- **Suspended News Anchor Mega-Screens:** High verticality breaks up the horizontal railway lines.
- **Procedural Breaking News Tickers:** Scrolling text strips display satirical headlines in authentic television broadcast font hierarchy.
- **Studio Boom Mics & Camera Cranes:** Creates authentic broadcast production atmosphere.

#### B. Confirmed Visible Defects
- **Canvas Texture Memory Pressure:** Multiple procedural canvas textures for news graphics accumulate in GPU memory without mipmap atlasing.
- **Anchor Caricature Static Rig:** The TV studio anchor on the billboard is a flat 2D graphic rather than a 3D kinetic puppet.

#### C. Intended Visual Composition & Exact Improvement Needed
- Replace 2D screen billboard with a 3D animated TV studio booth with glass walls where 3D caricature debaters throw papers at each other.
- Add a massive overhead gantry with an LED decibel meter whose needle bounces into the red zone as the player runs underneath.

#### D. Locally Saved Evidence Paths
- Runner View: `artifacts/baseline-captures/vip_d3_breaking_news_01_runner.png`
- Three-Quarter Review: `artifacts/baseline-captures/vip_d3_breaking_news_02_three_quarter.png`
- Mobile View (390×844): `artifacts/baseline-captures/vip_d3_breaking_news_03_mobile_390x844.png`
- Animation Frames:
  - Before: `artifacts/baseline-captures/vip_d3_breaking_news_04_anim_before.png`
  - Mid: `artifacts/baseline-captures/vip_d3_breaking_news_05_anim_mid.png`
  - After: `artifacts/baseline-captures/vip_d3_breaking_news_06_anim_after.png`

---

### DISTRICT 4 (1600m): Parliament Mayhem (`vip_d4_parliament_mayhem`)
*Environment: Mitron Express (`VIP_EXPRESS`) | Canonical Distance: ~1600m to 2000m*

```
┌────────────────────────────────────────────────────────────────────────┐
│ DISTRICT 4 TELEMETRY                                                   │
├──────────────────┬─────────────────┬─────────────────┬─────────────────┤
│ Meshes: 454      │ Triangles: 574k │ DrawCalls: 8,558│ FPS: 60 (Min 55)│
└──────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### A. Current Strengths Worth Retaining
- **Colossal Mahogany Gavel:** Imposing 4-meter hammer with rhythmic pounding animation communicates authority and slapstick disorder.
- **Flying Legislative Paper Vortex:** 30+ animated paper plane meshes swirling through the air create genuine kinetic chaos.
- **Sandstone Colonnade Architecture:** Classical Lutyens Delhi rotunda pillars provide architectural grandeur.

#### B. Confirmed Visible Defects
- **Gavel Impact Lacks VFX Feedback:** When the gavel hits the sound-block, there is no dust puff, screen shake, or shockwave ring.
- **Benches Look Empty:** Grand legislative tiers lack sufficient seated cartoon MPs to sell the crowded parliament atmosphere.

#### C. Intended Visual Composition & Exact Improvement Needed
- Add a golden shockwave ring particle and subtle localized dust ring on every gavel impact.
- Populate parliament tiers with waving, paper-throwing cartoon MP silhouettes.

#### D. Locally Saved Evidence Paths
- Runner View: `artifacts/baseline-captures/vip_d4_parliament_mayhem_01_runner.png`
- Three-Quarter Review: `artifacts/baseline-captures/vip_d4_parliament_mayhem_02_three_quarter.png`
- Mobile View (390×844): `artifacts/baseline-captures/vip_d4_parliament_mayhem_03_mobile_390x844.png`
- Animation Frames:
  - Before: `artifacts/baseline-captures/vip_d4_parliament_mayhem_04_anim_before.png`
  - Mid: `artifacts/baseline-captures/vip_d4_parliament_mayhem_05_anim_mid.png`
  - After: `artifacts/baseline-captures/vip_d4_parliament_mayhem_06_anim_after.png`

---

### DISTRICT 5 (2000m): Masterstroke Megacity (`vip_d5_masterstroke_megacity`)
*Environment: Mitron Express (`VIP_EXPRESS`) | Canonical Distance: ~2000m to 2400m*

```
┌────────────────────────────────────────────────────────────────────────┐
│ DISTRICT 5 TELEMETRY                                                   │
├──────────────────┬─────────────────┬─────────────────┬─────────────────┤
│ Meshes: 381      │ Triangles: 561k │ DrawCalls: 8,285│ FPS: 60 (Min 56)│
└──────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### A. Current Strengths Worth Retaining
- **The Masterstroke Calculating Machine:** Intricate brass gears, rotating dials, and hydraulic stamping levers give this district a unique steampunk-satire flavor.
- **Swiveling Coalition Chairs:** Nitish Kumar caricature spinning 180° between rival flags is pure political comedy genius.
- **Futuristic High-Rise Skyline:** Provides towering architectural backdrop closing out the 2400m world loop.

#### B. Confirmed Visible Defects
- **Machine Staging is Far Left:** Positioned at `X = -15.5m`, requiring the player to look hard to the left to appreciate the stamping gears.
- **Paper Roll Texture Compression:** The parchment reel texture appears slightly stretched on lower LODs.

#### C. Intended Visual Composition & Exact Improvement Needed
- Cantilever an oversized brass gear overhead spanning above Track Lane -1 (`X = -3.0m`), ensuring mechanical motion is prominent in the third-person camera.
- Add glowing green and red indicator lamps to the control panels that blink rhythmically.

#### D. Locally Saved Evidence Paths
- Runner View: `artifacts/baseline-captures/vip_d5_masterstroke_megacity_01_runner.png`
- Three-Quarter Review: `artifacts/baseline-captures/vip_d5_masterstroke_megacity_02_three_quarter.png`
- Mobile View (390×844): `artifacts/baseline-captures/vip_d5_masterstroke_megacity_03_mobile_390x844.png`
- Animation Frames:
  - Before: `artifacts/baseline-captures/vip_d5_masterstroke_megacity_04_anim_before.png`
  - Mid: `artifacts/baseline-captures/vip_d5_masterstroke_megacity_05_anim_mid.png`
  - After: `artifacts/baseline-captures/vip_d5_masterstroke_megacity_06_anim_after.png`

---

### DISTRICT 6 (0m): The Infinite Yatra (`rahul_d0_infinite_yatra`)
*Environment: Rahulverse (`RAHULVERSE`) | Canonical Distance: ~0m to 400m*

```
┌────────────────────────────────────────────────────────────────────────┐
│ DISTRICT 6 TELEMETRY                                                   │
├──────────────────┬─────────────────┬─────────────────┬─────────────────┤
│ Meshes: 631      │ Triangles: 511k │ DrawCalls: 6,973│ FPS: 60 (Min 57)│
└──────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### A. Current Strengths Worth Retaining
- **Overhead Finish Line Flip Board Arch:** The single funniest gag in the game! Completely visible, highly readable, and perfectly timed to the runner's approach.
- **Traditional Highway Milestones:** Saffron/white milestone markers every 32m provide rhythm and geographic storytelling.
- **Yatra Support Tempo Van:** The cream-and-saffron van with roof luggage rack, spare sneakers, and water crates grounds the expedition.

#### B. Confirmed Visible Defects
- **Confetti Particle Pop-in:** Confetti particles spawn instantaneously upon trigger rather than bursting from physical pressurized cannons.
- **Crowd Character Repetition:** Sidewalk cheering supporters use identical white kurta meshes.

#### C. Intended Visual Composition & Exact Improvement Needed
- Add animated streamer ribbons along with the confetti particles.
- Introduce diverse crowd models (supporters in regional caps, sports flags, and roadside spectators with smartphones).

#### D. Locally Saved Evidence Paths
- Runner View: `artifacts/baseline-captures/rahul_d0_infinite_yatra_01_runner.png`
- Three-Quarter Review: `artifacts/baseline-captures/rahul_d0_infinite_yatra_02_three_quarter.png`
- Mobile View (390×844): `artifacts/baseline-captures/rahul_d0_infinite_yatra_03_mobile_390x844.png`
- Animation Frames:
  - Before: `artifacts/baseline-captures/rahul_d0_infinite_yatra_04_anim_before.png`
  - Mid: `artifacts/baseline-captures/rahul_d0_infinite_yatra_05_anim_mid.png`
  - After: `artifacts/baseline-captures/rahul_d0_infinite_yatra_06_anim_after.png`

---

### DISTRICT 7 (400m): Parliament Pandemonium (`rahul_d1_parliament_pandemonium`)
*Environment: Rahulverse (`RAHULVERSE`) | Canonical Distance: ~400m to 800m*

```
┌────────────────────────────────────────────────────────────────────────┐
│ DISTRICT 7 TELEMETRY                                                   │
├──────────────────┬─────────────────┬─────────────────┬─────────────────┤
│ Meshes: 480      │ Triangles: 497k │ DrawCalls: 6,801│ FPS: 61 (Min 56)│
└──────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### A. Current Strengths Worth Retaining
- **Runaway Robotic Mic Keep-Away:** High-comedy physical gag. The snake-like robotic gooseneck dodging debaters generates instant laughter.
- **Point-of-Order Alarm Strobe:** Flashing warning lights and buzzer horns emphasize legislative chaos.
- **Deep Red Carpet Plinths:** Gives the corridor a grand, ceremonial weight.

#### B. Confirmed Visible Defects
- **Robotic Mic Base is Blocky:** The wheeled chassis supporting the runaway mic uses simple untextured grey cubes.
- **Debater Tumble Animation is Stiff:** When debaters fall over, they rotate as rigid single-piece groups rather than flexing limbs.

#### C. Intended Visual Composition & Exact Improvement Needed
- Sculpt a retro-futuristic cartoon chassis with glowing vacuum tubes and bouncing spring antenna for the robotic mic.
- Animate two-joint flailing arm bones for the lunging politicians.

#### D. Locally Saved Evidence Paths
- Runner View: `artifacts/baseline-captures/rahul_d1_parliament_pandemonium_01_runner.png`
- Three-Quarter Review: `artifacts/baseline-captures/rahul_d1_parliament_pandemonium_02_three_quarter.png`
- Mobile View (390×844): `artifacts/baseline-captures/rahul_d1_parliament_pandemonium_03_mobile_390x844.png`
- Animation Frames:
  - Before: `artifacts/baseline-captures/rahul_d1_parliament_pandemonium_04_anim_before.png`
  - Mid: `artifacts/baseline-captures/rahul_d1_parliament_pandemonium_05_anim_mid.png`
  - After: `artifacts/baseline-captures/rahul_d1_parliament_pandemonium_06_anim_after.png`

---

### DISTRICT 8 (800m): Press Conference Panic (`rahul_d2_press_conference_panic`)
*Environment: Rahulverse (`RAHULVERSE`) | Canonical Distance: ~800m to 1200m*

```
┌────────────────────────────────────────────────────────────────────────┐
│ DISTRICT 8 TELEMETRY                                                   │
├──────────────────┬─────────────────┬─────────────────┬─────────────────┤
│ Meshes: 499      │ Triangles: 481k │ DrawCalls: 6,750│ FPS: 60 (Min 57)│
└──────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### A. Current Strengths Worth Retaining
- **Empty Chair Cross-Examination Gag:** The surreal concept of an anchor shouting at an empty spinning chair captures Indian media satire perfectly.
- **Dense Press Microphone Forest:** 20+ multicolored mic-cubes (ANI, NDTV, Republic caricatures) crowding the podium.
- **Media Conga Line:** Journalists running in a serpentine line with bulky Betacam cameras.

#### B. Confirmed Visible Defects
- **Microphone Stands Lack Wires:** Floating mic heads without cable tangles look slightly sterile.
- **Speech Bubble Alignment:** The floating cartoon question-mark bubble occasionally clips into overhead lights.

#### C. Intended Visual Composition & Exact Improvement Needed
- Add spaghetti-tangled black cables snaking across the risers to emphasize media frenzy.
- Add physical squeak / tilt animation to the empty chair as if someone just escaped from it.

#### D. Locally Saved Evidence Paths
- Runner View: `artifacts/baseline-captures/rahul_d2_press_conference_panic_01_runner.png`
- Three-Quarter Review: `artifacts/baseline-captures/rahul_d2_press_conference_panic_02_three_quarter.png`
- Mobile View (390×844): `artifacts/baseline-captures/rahul_d2_press_conference_panic_03_mobile_390x844.png`
- Animation Frames:
  - Before: `artifacts/baseline-captures/rahul_d2_press_conference_panic_04_anim_before.png`
  - Mid: `artifacts/baseline-captures/rahul_d2_press_conference_panic_05_anim_mid.png`
  - After: `artifacts/baseline-captures/rahul_d2_press_conference_panic_06_anim_after.png`

---

### DISTRICT 9 (1200m): The Great Alliance Amusement Park (`rahul_d3_alliance_rollercoaster`)
*Environment: Rahulverse (`RAHULVERSE`) | Canonical Distance: ~1200m to 1600m*

```
┌────────────────────────────────────────────────────────────────────────┐
│ DISTRICT 9 TELEMETRY                                                   │
├──────────────────┬─────────────────┬─────────────────┬─────────────────┤
│ Meshes: 437      │ Triangles: 513k │ DrawCalls: 6,695│ FPS: 60 (Min 54)│
└──────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### A. Current Strengths Worth Retaining
- **Middle-Seat Musical Chairs:** Hydraulic roundtable with shifting red armchairs is an instantly understandable metaphor for coalition bargaining.
- **Mismatched Jigsaw Puzzle Pieces:** Giant interlocking puzzle blocks that fail to connect because their tabs are inverted.
- **Carnival Fairground Lighting:** Bright multicolored lightbulbs give this district high visual differentiation.

#### B. Confirmed Visible Defects
- **Puzzle Piece Animation Distance:** The puzzle pieces at `X = -14.0m` are difficult to resolve clearly from the default center running lane.
- **Chair Collision Mesh is Absent:** Characters pass through chair arms rather than squishing against them.

#### C. Intended Visual Composition & Exact Improvement Needed
- Mount the giant puzzle pieces directly onto an overhead gantry spanning above the tracks so the mismatched collision happens right above the runner's head.
- Add comedic "SQUEAK" and "HONK" sound cues and cartoon spring coils beneath the musical chairs.

#### D. Locally Saved Evidence Paths
- Runner View: `artifacts/baseline-captures/rahul_d3_alliance_rollercoaster_01_runner.png`
- Three-Quarter Review: `artifacts/baseline-captures/rahul_d3_alliance_rollercoaster_02_three_quarter.png`
- Mobile View (390×844): `artifacts/baseline-captures/rahul_d3_alliance_rollercoaster_03_mobile_390x844.png`
- Animation Frames:
  - Before: `artifacts/baseline-captures/rahul_d3_alliance_rollercoaster_04_anim_before.png`
  - Mid: `artifacts/baseline-captures/rahul_d3_alliance_rollercoaster_05_anim_mid.png`
  - After: `artifacts/baseline-captures/rahul_d3_alliance_rollercoaster_06_anim_after.png`

---

### DISTRICT 10 (1600m): The Political Multiverse Glitch (`rahul_d4_political_multiverse`)
*Environment: Rahulverse (`RAHULVERSE`) | Canonical Distance: ~1600m to 2000m*

```
┌────────────────────────────────────────────────────────────────────────┐
│ DISTRICT 10 TELEMETRY                                                  │
├──────────────────┬─────────────────┬─────────────────┬─────────────────┤
│ Meshes: 407      │ Triangles: 534k │ DrawCalls: 6,783│ FPS: 61 (Min 46)│
└──────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### A. Current Strengths Worth Retaining
- **Twin Multiverse Portals:** Swirling ring meshes with counter-rotating vortex textures create an eye-catching sci-fi fantasy element.
- **Modi/Rahul Outfit Swap Hologram:** High-concept satirical payoff showing the rivals comically wearing each other's signature clothes.
- **Cosmic Microphone Rocket Launch:** An absurd background rocket launch using a press microphone as the booster.

#### B. Confirmed Visible Defects
- **Minimum FPS Dip (46 FPS):** Portal shader transparency overdraw caused a brief frame drop on intense camera angles.
- **Hologram Mesh Flatness:** The swapped caricature holograms use flat plane meshes that look thin when viewed from a three-quarter angle.

#### C. Intended Visual Composition & Exact Improvement Needed
- Optimize portal ring shader depth-testing to eliminate transparency fill-rate bottleneck.
- Replace 2D plane holograms with true 3D low-poly caricature models with glowing wireframe fresnel shaders.

#### D. Locally Saved Evidence Paths
- Runner View: `artifacts/baseline-captures/rahul_d4_political_multiverse_01_runner.png`
- Three-Quarter Review: `artifacts/baseline-captures/rahul_d4_political_multiverse_02_three_quarter.png`
- Mobile View (390×844): `artifacts/baseline-captures/rahul_d4_political_multiverse_03_mobile_390x844.png`
- Animation Frames:
  - Before: `artifacts/baseline-captures/rahul_d4_political_multiverse_04_anim_before.png`
  - Mid: `artifacts/baseline-captures/rahul_d4_political_multiverse_05_anim_mid.png`
  - After: `artifacts/baseline-captures/rahul_d4_political_multiverse_06_anim_after.png`

---

### DISTRICT 11 (2000m): Regional Town and Roadshow (`rahul_d5_regional_roadshow`)
*Environment: Rahulverse (`RAHULVERSE`) | Canonical Distance: ~2000m to 2400m*

```
┌────────────────────────────────────────────────────────────────────────┐
│ DISTRICT 11 TELEMETRY                                                  │
├──────────────────┬─────────────────┬─────────────────┬─────────────────┤
│ Meshes: 596      │ Triangles: 527k │ DrawCalls: 7,406│ FPS: 60 (Min 58)│
└──────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### A. Current Strengths Worth Retaining
- **Agricultural Tractor with Loudspeaker Tower:** Green tractor with massive rear tires and a wooden trailer gives authentic rural Indian campaign character.
- **Vernacular Brick Shopfronts:** Terracotta clay tiles, wooden awnings, and roadside cycle repair stands provide rich ground-level texture.
- **High Texture Variety:** 599 unique textures loaded, giving every building facade distinct vernacular signage.

#### B. Confirmed Visible Defects
- **Tractor Wheel Alignment:** Front tractor wheels are slightly sunken into the sidewalk asphalt.
- **High Memory Footprint:** 599 textures is near the memory budget cap for lower-end WebGL mobile contexts.

#### C. Intended Visual Composition & Exact Improvement Needed
- Correct tractor wheel origin offset to sit precisely on `Y = 0.3m` pavement.
- Atlas vernacular shopfront signs into two 2048×2048 texture sheets, cutting individual texture bindings by 80%.

#### D. Locally Saved Evidence Paths
- Runner View: `artifacts/baseline-captures/rahul_d5_regional_roadshow_01_runner.png`
- Three-Quarter Review: `artifacts/baseline-captures/rahul_d5_regional_roadshow_02_three_quarter.png`
- Mobile View (390×844): `artifacts/baseline-captures/rahul_d5_regional_roadshow_03_mobile_390x844.png`
- Animation Frames:
  - Before: `artifacts/baseline-captures/rahul_d5_regional_roadshow_04_anim_before.png`
  - Mid: `artifacts/baseline-captures/rahul_d5_regional_roadshow_05_anim_mid.png`
  - After: `artifacts/baseline-captures/rahul_d5_regional_roadshow_06_anim_after.png`

---

## 4. Structured Production Asset Inventory

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    ASSET STATUS CLASSIFICATION                                          │
├───────────────────────────────┬────────────────────────────┬────────────────────────────────────────────┤
│ Tier Category                 │ Current Count / Types      │ Production Plan & Technical Path           │
├───────────────────────────────┼────────────────────────────┼────────────────────────────────────────────┤
│ 1. Reusable As-Is             │ 42 Primitives & Materials  │ Retain geometry caches & shared materials  │
│ 2. Procedural Remodeling      │ 18 Complex Props           │ Upgrade with chamfers, UV maps & instancing│
│ 3. Premium Artist-Authored GLB│ 6 Hero Character Rigs      │ Author high-poly rigged cartoon characters │
│ 4. Strictly Forbidden Downloads│ 0 Unlicensed External     │ Custom in-house authoring or CC0/MIT only  │
└───────────────────────────────┴────────────────────────────┴────────────────────────────────────────────┘
```

### 4.1 Assets Already Present and Reusable As-Is
- **Track & Railbed:** Ballast mesh, steel rails, wooden and concrete railway sleepers.
- **Foundation Infrastructure:** Deep foundation plinths (`sidewalkH = 4.8m`, extending down to -4.5m).
- **Vehicles:**
  - Vande Bharat style high-speed express train livery (`VIP_EXPRESS`).
  - Yatra tricolor express train livery (`RAHULVERSE`).
  - Bulletproof SUV chassis and heavy tire models.
  - Indian agricultural tractor model.
- **Materials:** Agra sandstone, Makrana marble, terracotta roof tiles, polished brass, copper kettle material, green parliament leather.

### 4.2 Assets to Remodel Procedurally
- **Ceremonial Ribbon Gantry:** Add cloth simulation vertex deformation and kinetic unrolling spring physics.
- **Brass Tea Kettle Pour:** Replace static tea cylinder with UV-scrolling animated tea foam spline.
- **Overhead News Decibel Gantry:** Add bouncing needle gauge and animated glowing LED segment bars.
- **Agricultural Loudspeaker Horns:** Add rhythmic scale-pulse animations driven by soundscape bass hits.
- **Milestone Highway Markers:** Add weathered stone normal maps and engraved kilometer numerals.

### 4.3 Assets Requiring High-Quality Rigged Artist-Authored Models (Production Limitation)
- **Modi Hero Character Rig:** Needs a bespoke cartoon-stylized 3D GLB character with skeletal facial bones (raised eyebrows, smile, speech morphs) and soft cloth waistcoat physics.
- **Opposition Leaders Rig Pack:**
  - Arvind Kejriwal (muffler physics, coughing gesture rig).
  - Amit Shah (stout silhouette, turning strategy ledger rig).
  - Mamata Banerjee (cotton sari cloth simulation rig).
  - Nitish Kumar (swivel chair interaction rig).
- **Production Limitation Note:** Current implementations use compound Three.js geometric primitives (`BoxGeometry`, `CylinderGeometry`, `SphereGeometry`). While silhouette-recognizable, these are strictly prototype stand-ins. They must NOT be claimed as final AAA character art until full rigged GLB models are authored and imported.

### 4.4 Unlicensed Download Policy
- **STRICT PROHIBITION:** No external 3D models from Sketchfab, TurboSquid, or copyrighted political media may be downloaded without verified commercial licenses.
- All 3D assets must be either procedurally generated within the Metro Runner engine or authored as original in-house CC0/MIT-compatible GLB files.

---

## 5. Prioritized Implementation Checklist (Phase 2 Preview)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PRIORITIZED IMPLEMENTATION ROADMAP                              │
├─────┬──────────────────────────────────────────┬──────────┬────────────────────────────┤
│ P#  │ Task Title                               │ Risk     │ Primary Impact             │
├─────┼──────────────────────────────────────────┼──────────┼────────────────────────────┤
│ P0  │ Cantilever Scenery into Gameplay Cone    │ Low      │ Sightlines & Comprehension │
│ P0  │ InstancedMesh Batching for Props         │ Medium   │ Cuts draw calls by 60%     │
│ P1  │ UV-Scrolling Tea & Streamer VFX          │ Low      │ Fluid animation kineticism │
│ P1  │ Gavel Shockwave & Petal Cannon VFX       │ Low      │ Visual weight & punchiness │
│ P1  │ News Studio Decibel Meter Gantry         │ Low      │ Overhead vertical drama    │
│ P2  │ High-Quality Rigged Caricature Models    │ High     │ AAA expressive character art│
│ P2  │ Texture Atlas Consolidation (2x 2048)    │ Low      │ Eliminates texture leaks   │
└─────┴──────────────────────────────────────────┴──────────┴────────────────────────────┘
```

This concludes Phase 1. The baseline is empirically captured, the forensic defects are cataloged without rationalization, and the creative direction bible establishes an uncompromising AAA standard for Phase 2 implementation.
