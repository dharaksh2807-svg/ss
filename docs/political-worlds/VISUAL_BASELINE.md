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

## 5. Phase 2 Complete Environment Art Refinement Audit & Verification

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              PHASE 2 ENVIRONMENT ART VERIFICATION SUMMARY                              │
├────────────────────────────────┬────────┬──────────────────────────────────────────────────────────────┤
│ Metric / Requirement           │ Status │ Empirical Measurement                                        │
├────────────────────────────────┼────────┼──────────────────────────────────────────────────────────────┤
│ 12-District Coverage           │ PASS   │ 6 VIP Express + 6 Rahulverse districts fully delivered.      │
│ Grounding & Zero Floating Mesh │ PASS   │ Foundation plinths extend to Y <= -4.8m; 0 floating meshes.  │
│ Black Slab Elimination         │ PASS   │ 0 black slabs detected across all 12 districts (verified).  │
│ Framerate & Performance        │ PASS   │ 60-61 FPS sustained across all 12 districts in WebGL.        │
│ Hazard Clearance Envelope      │ PASS   │ Strictly preserved: |X| > 4.2m or overhead Y >= 9.4m > 8.5m. │
│ Minimal Quality Tier Budget    │ PASS   │ VIP minimal tier count <= 150 meshes preserved.              │
│ Architectural Articulation     │ PASS   │ Havelis, chhatris, colonnades, pediments, spires, awnings.   │
│ Real Collision Gameplay Smoke  │ PASS   │ Normal physics, 0 collision regressions, natural crash hit.  │
└────────────────────────────────┴────────┴──────────────────────────────────────────────────────────────┘
```

### 5.1 Post-Refinement Telemetry by District (Angle WebGL, Google Chrome)

```
┌───────────────────────────────────────┬─────────┬──────────────┬──────────────┬──────────┬───────────┐
│ District ID & Thematic Environment    │ Meshes  │ Triangles    │ Draw Calls   │ FPS      │ BlackSlabs│
├───────────────────────────────────────┼─────────┼──────────────┼──────────────┼──────────┼───────────┤
│ vip_d0_roadshow_royale (0m)           │ 1,113   │ 578,762      │ 9,004        │ 61 FPS   │ 0         │
│ vip_d1_chai_pe_charcha (400m)         │ 502     │ 552,903      │ 8,404        │ 60 FPS   │ 0         │
│ vip_d2_inauguration_infinity (800m)   │ 384     │ 572,519      │ 8,683        │ 60 FPS   │ 0         │
│ vip_d3_breaking_news (1200m)          │ 363     │ 586,535      │ 8,444        │ 61 FPS   │ 0         │
│ vip_d4_parliament_mayhem (1600m)      │ 422     │ 558,343      │ 8,528        │ 61 FPS   │ 0         │
│ vip_d5_masterstroke_megacity (2000m)  │ 351     │ 554,913      │ 8,407        │ 60 FPS   │ 0         │
├───────────────────────────────────────┼─────────┼──────────────┼──────────────┼──────────┼───────────┤
│ rahul_d0_infinite_yatra (0m)          │ 625     │ 504,266      │ 7,160        │ 60 FPS   │ 0         │
│ rahul_d1_parliament_pandemonium (400m)│ 524     │ 501,225      │ 6,891        │ 60 FPS   │ 0         │
│ rahul_d2_press_conference_panic (800m)│ 493     │ 511,621      │ 6,860        │ 60 FPS   │ 0         │
│ rahul_d3_alliance_rollercoaster(1200m)│ 423     │ 491,467      │ 6,928        │ 60 FPS   │ 0         │
│ rahul_d4_political_multiverse (1600m) │ 423     │ 497,176      │ 6,823        │ 60 FPS   │ 0         │
│ rahul_d5_regional_roadshow (2000m)    │ 602     │ 499,409      │ 6,977        │ 60 FPS   │ 0         │
└───────────────────────────────────────┴─────────┴──────────────┴──────────────┴──────────┴───────────┘
```

### 5.2 Key Phase 2 Deliverables & Architectural Enhancements
1. **VIP Express (Mitron Express):**
   - **District 0 (Roadshow Royale):** Added Ceremonial Welcome Toran Arch at `Z = -40m` spanning across track at `Y = 9.8m` (lintel lowest `Y = 9.4m > 8.5m`), golden Kalash finials, and hanging marigold garland loops; twin chhatris and saffron festive pennants on haveli facades.
   - **District 1 (Chai Pe Charcha):** Connected `districtIndex = 1` for authentic warm terracotta havelis; added Festive Tea Summit Overhead Lantern Gantry at `Z = -40m` (`Y = 9.8m`, bottom `Y = 9.5m`) with hanging warm amber tea lanterns (`Y = 9.3m`).
   - **District 2 (Inauguration Infinity):** Connected `districtIndex = 2` for imperial ivory marble & golden sandstone ministry facades with 4-story pedimented ministry headquarters and gold Ashoka medallions; preserved `vip_double_opening` at `Y = 10.6m`.
   - **District 3 (Breaking News):** Connected `districtIndex = 3` for cobalt media studio glass and illuminated window grids; added Overhead LED Breaking News Ticker Bridge at `Z = -40m` (`Y = 9.8m`, bottom `Y = 9.4m`) with emissive cyan ticker display.
   - **District 4 (Parliament Mayhem):** Added Overhead Classical Sandstone Colonnade Beam Arch at `Z = -40m` (`Y = 9.8m`, bottom `Y = 9.4m`) with carved gold Ashoka Chakra medallion; classical rotunda dome crowns on circular parliament facades.
   - **District 5 (Masterstroke Megacity):** Connected `districtIndex = 5` for futuristic golden sandstone civic architecture; added Overhead Steampunk Clockwork Transmission Truss at `Z = -40m` (`Y = 9.8m`, bottom `Y = 9.4m`) with central bronze clockwork gear.

2. **Rahulverse (The Never-Ending Yatra):**
   - **District 0 (Never-Ending Yatra):** Vernacular Grand Trunk Road architecture with sandstone plaster, terracotta eaves, Sintex water tanks, milestone markers, and flip finish line arch.
   - **District 1 (Parliament Pandemonium):** Added Point-of-Order Warning Gantry at `Z = -36m` (`Y = 9.8m`, bottom `Y = 9.4m`) with flashing orange warning sign; Makrana marble & buff sandstone facades with rotunda parliament domes.
   - **District 2 (Press Conference Panic):** Added Overhead Press Media Lighting Truss at `Z = -40m` (`Y = 9.8m`, bottom `Y = 9.4m`) with floodlight pods at `Y = 9.3m`; high-tech media studio navy facades with TV dish antennas.
   - **District 3 (Alliance Rollercoaster):** Festive marigold carnival midway facades with marquee crowns; overhead carnival track arches at `Y = 11.8m` (`min.y = 11.5m > 8.5m`).
   - **District 4 (Political Multiverse):** Added Overhead Quantum Energy Conduit Arch at `Z = -40m` (`Y = 9.8m`, bottom `Y = 9.4m`) with glowing neon cyan energy rings; deep indigo & teal facades with geometric obelisk spires.
   - **District 5 (Regional Roadshow):** Connected `districtIndex = 5` for regional brick township architecture; added Overhead Festoon Bunting Cable at `Z = -40m` (`Y = 9.8m`) with hanging tricolor pennant flags (`Y = 9.3m`). Fixed canonical 400m progression sequence `[0, 1, 2, 3, 4, 5]`.

3. **Collision Safety & Performance Preservation:**
   - All roadside scenery, pillars, and grandstands placed at `|X| >= 8.8m` (well outside the `|X| <= 4.2m` hazard corridor).
   - All overhead spans maintain `box.min.y >= 9.3m`, safely exceeding the `8.5m` collision clearance threshold for player jump arcs, jetpack flight, and moving train rooftops.
   - Zero modifications made to player physics, train spawning, speed curves, coins, HUD, progression, or camera controls.

---

Phase 2 environment art refinement is complete, verified, and audited across all 12 canonical political districts.

---

# SECTION 6: PHASE 3 FORENSIC AUDIT — MITRON EXPRESS CINEMATIC CHARACTER COMEDY

## 6.1 Overview and Mission Accomplished
In accordance with the **Phase 3 Creative Direction and Cinematography Specification**, `VIP_EXPRESS` (Mitron Express) has been elevated from architectural scenery into a living, slapstick Indian political cartoon universe. Every district now features genuine character comedy, articulated 3D caricatures with expressive joint rigging, dynamic comedy events with four-beat theatrical pacing, and approach-aware distance synchronization.

## 6.2 Flagship Comedy Scenes Implementation

### Priority A: The Great Mango Interview (Televised Terrace Set)
- **District / Location:** Roadshow Royale East Terrace at `X = +11.2m, Z = -chunkLength * 0.5`.
- **Inspiration:** Modi's 2019 public interview conversation about mangoes, transformed into a fictional slapstick parody.
- **Theatrical 4-Beat Cycle (8.0s lifecycle):**
  1. **Beat 1: Setup (0.0s – 2.0s | Approach: 75m to 56m ahead):**
     - Ornate Mughal sandstone archway with deep crimson velvet drapery.
     - VIP Modi and blazer-wearing Interviewer seated in gilded velvet armchairs engaged in measured debate gestures.
     - Silver cloche rests firmly on the central golden pedestal, hiding the contents.
     - 4 broadcast studio cameras and overhead spotlights aim squarely at the political VIPs.
  2. **Beat 2: Reveal & Escalation (2.0s – 4.0s | Approach: 56m to 38m ahead):**
     - Cloche hoists 4.5m into the air with spinning flourish.
     - The glorious 2.4m golden Alphonso mango emerges, rolls down the miniature red-carpet ramp, and puts on cool celebrity sunglasses as star sparkles pop into view.
     - VIPs pause speaking; Modi's head begins turning with an arched right eyebrow.
  3. **Beat 3: Superstar Swivel & Cartoon Shock (4.0s – 6.0s | Approach: 38m to 10m ahead — Camera Climax):**
     - All 4 broadcast cameras whip 90° away from the politicians to focus dead-center on the grooving mango.
     - Articulated boom mic swoops down directly over the fruit; spotlights converge.
     - **Modi Comic Double-Take:** Drop-jaw opens wide (`jaw.position.y = -0.16`), wire glasses slide down the bridge of the nose (`glasses.position.z = 0.28`), eyebrows shoot up in disbelief, and right hand flies to forehead in classic cartoon shock.
  4. **Beat 4: Journalist Photo Scrum Dogpile & Shrug (6.0s – 8.0s | Passing: 10m to -15m):**
     - 3 cartoon journalists (fedora hats, press badges, telephoto camera, boom pole) dive forward from their seating into a tumbling photo scrum dogpile around the mango pedestal.
     - Frantic camera strobe flashes pop across all rigs.
     - Modi and Interviewer exchange bewildered looks and shrug in comical defeat before the cloche smoothly resets.

### Priority B: Inauguration Infinity (Never-Ending Ribbon Ceremony)
- **District / Location:** Inauguration Infinity Promenades at `X = -16.5m, Z = -chunkLength * 0.4`.
- **Theatrical 4-Beat Cycle (7.2s lifecycle):**
  1. **Beat 1: Setup (0.0s – 1.8s | Approach: 75m to 56m ahead):**
     - Grand imperial marquee pavilion with gold stanchions and red carpet.
     - Gargantuan 3.6m golden articulated shears make rhythmic snipping motions against a multi-layer tricolor ribbon (saffron, white, green).
  2. **Beat 2: Escalation & Rapid Deployment (1.8s – 3.6s | Approach: 56m to 38m ahead):**
     - Primary ribbon parts to reveal a nested secondary tricolor ribbon (`nested_tricolor_ribbons_2`).
     - Automated pneumatic ribbon deployer arm springs out; secondary diamond-crested crane shears descend 3.5m from above.
  3. **Beat 3: Harmless Confetti Explosion & Punchline (3.6s – 5.4s | Approach: 38m to 10m ahead):**
     - Both sets of shears cut simultaneously.
     - A harmless, festive explosion of 24 tricolor paper confetti particles (`inauguration_confetti_burst`) erupts outward in a 3.5m radial arc.
     - **The Comedic Punchline:** As the confetti clears, the colossal 2.4m velvet and gold throne elevates a comically tiny cutting-chai glass and Parle-G biscuit into the spotlight!
  4. **Beat 4: Reset & Dignitary Reaction (5.4s – 7.2s | Passing: 10m to -15m):**
     - Paper confetti gently drifts down, rapid ribbon deployer arm reloads fresh ribbon, and flanking dignitaries applaud enthusiastically.

### Priority C: Roadshow Camera Chaos (The Overcrowded Motorcade)
- **District / Location:** Roadshow Royale at `X = -12.5m` (Truck Float) & East Promenade `X = +14.8m` (Photo Podium).
- **Theatrical 4-Beat Cycle (8.0s lifecycle):**
  1. **Beat 1: The Motorcade Majesty (0.0s – 2.0s):**
     - Decorated roadshow truck chassis sways and rumbles with golden lotus rostrum.
     - Modi figure waves right arm with articulated elbow gestures; twin flower petal cannons blast marigold petals into the air; quad loudspeakers pulse with rally cadence.
     - Dark-suited SPG commandos with aviator sunglasses jog in rhythmic stride alongside.
     - Quadcopter camera drone (`vip_camera_drone`) with spinning carbon propellers hovers above the East promenade.
  2. **Beat 2: Festoon Snag (2.0s – 4.0s):**
     - Camera drone swoops low seeking a dramatic close-up, wobbles erratically, and tangles into marigold festoons (`garlandTangle`).
     - Paparazzi look up in alarm and begin stumbling backward.
  3. **Beat 3: Paparazzi Collision & Flashes (4.0s – 6.0s | Camera Climax):**
     - Paparazzi photographers collide face-to-face, locking long white telephoto zoom lenses into each other's faces.
     - Rapid blinding camera strobes pop between them as they flash blindly into each other's eyes.
     - Unexpected cheerful street Chai-Wala bumbles into center frame with wire tea rack and smiles at the camera!
     - Modi leans over rostrum railing in chuckling disbelief.
  4. **Beat 4: Dizzy Wobble & Recovery (6.0s – 8.0s):**
     - Photographers stagger backward with cartoon spiral dizzy wobbles (`rotation.z = sin(t)*0.25`).
     - Camera drone recovers altitude and stabilizes; chai vendor merrily slips back to the sidewalk.

---

## 6.3 Remaining Districts Satirical Comedy Refinements

1. **Chai Pe Charcha Chaos (District 1):**
   - **Monumental Teacup Unveiling:** Gilded curtains part dramatically to reveal a tiny cutting-chai cup illuminated by twin sweeping spotlights while VIP caricatures cheer and take selfies.
   - **Kettle Mechanical Pourer:** Giant brass kettle tilts to pour an animated tea stream into a vendor's glass as rival politicians lean in competitively and bump heads.

2. **The Prime-Time Circus / Breaking News (District 3):**
   - **Runaway Decoy Microphone Cart:** Moving cart on casters with giant golden microphone evades an overzealous news anchor NPC lunging forward with slapstick timing.
   - **Prime-Time Remote Revelation:** Reinforced media vault opens via crane winch to extract the lost TV remote control under flashing news cameras.

3. **Parliament Mayhem (District 4):**
   - **Question Hour Showdown:** Expressive debate poses between opposing leaders leaning toward microphones; flying paper sheet vortex (`parliamentPaperList`) fluttering across the benches.
   - **Coalition Musical Chairs Carousel:** Swivel chair rotates 180° back and forth as alliance partners scramble for political seats.

4. **Masterstroke Megacity (District 5):**
   - **Masterstroke Machine:** Heavy vault doors slide open as the pressure dial ticks to 99.9% with a steam blast, revealing a comically tiny gold tea-stirring spoon on a delivery arm.
   - **Giant Political Chessboard:** Industrial gantry moves a monumental king piece across the board, only to be checkmated by a street chai cart.

---

## 6.4 Character Articulation & Joint Hierarchy Audit

Every political caricature now features articulated, named joint groups registered in `mesh.userData.joints`:
```
caricature_modi
├── headGroup (neck pivot: rotation.x, rotation.y, rotation.z)
│   ├── sculptedHead + hair + beard + mustache
│   ├── jaw (cartoon drop-jaw shock pivot: position.y down to -0.16m)
│   ├── glasses (double-bridge gold wire spectacles: position.z slide)
│   ├── eyebrowL & eyebrowR (independent rotational shock arches)
├── torsoGroup + waistcoat (bandhgala buttons)
├── armR (shoulder pivot)
│   └── elbowR (elbow hinge)
│       └── handR (wrist pivot)
├── armL (shoulder pivot)
│   └── elbowL (elbow hinge)
│       └── handL (wrist pivot)
└── legs + curled pointed mojari shoes
```
Supporting characters (`caricature_rahul`, `caricature_kejriwal`, `caricature_mamata`, `caricature_amit_shah`, `caricature_nitish`) possess equivalent articulated neck, arm, and comedic accessory joints (`mufflerTail`, `pallu`, strategy ledger, swivel base).

---

## 6.5 Approach-Aware Distance Synchronization (`getGagCycle`)

To guarantee gags never fire off-screen or while the player is distant, `VipComedyEventDirector.getGagCycle()` mathematically couples the runner camera approach to the 4 theatrical beats:
$$\text{distanceAhead} = \text{playerZ} - \text{triggerZ}$$

| Stage | Distance Ahead | Approach Progress ($t$) | Comedy Beat | Theatrical Action |
|:------|:--------------|:-----------------------|:------------|:------------------|
| **Setup** | $75\text{m} \to 56\text{m}$ | $0.00 \to 0.25$ | Beat 1 ($0.0 - 2.0\text{s}$) | Establish scene, dignified poses, anticipation |
| **Escalation** | $56\text{m} \to 38\text{m}$ | $0.25 \to 0.50$ | Beat 2 ($2.0 - 4.0\text{s}$) | Cloche/shears/drone begins moving, unexpected twist |
| **Punchline / Climax** | $38\text{m} \to 10\text{m}$ | $0.50 \to 0.85$ | Beat 3 ($4.0 - 6.0\text{s}$) | **PUNCHLINE IN FULL RUNNER VIEW:** Camera swivel, jaw drop, confetti burst |
| **Reaction / Laugh Hold** | $10\text{m} \to -15\text{m}$ | $0.85 \to 1.00+$ | Beat 4 ($6.0 - 8.0\text{s}$) | Dogpile scrum, dizzy wobbles, laugh hold as runner sweeps past |

*Autonomous fallback:* When `playerZ` is absent (such as in offline tests or menu loops), `getGagCycle` seamlessly defaults to autonomous `timer % cycleDuration`.

---

## 6.6 Phase 3 Forensic Screenshot Ledger

All captures recorded directly in Google Chrome WebGL at $1440 \times 900$ (and $390 \times 844$ mobile):

| Capture Filename | Description | Theatrical Beat / View |
|:-----------------|:------------|:-----------------------|
| `mitron_p3_character_modi_close_up.png` | Articulated Modi caricature close-up showing gold wire spectacles, sculpted beard, drop-jaw, jointed arms, and curled mojaris | Front View Inspection |
| `mitron_p3_flagship_a_mango_beat1_setup.png` | The Mango Interview: Serious televised debate with cloche down on pedestal | Beat 1 (Setup) |
| `mitron_p3_flagship_a_mango_beat2_reveal.png` | The Mango Interview: Cloche hoists, 2.4m golden mango superstar emerges on red carpet ramp with sunglasses | Beat 2 (Reveal) |
| `mitron_p3_flagship_a_mango_beat3_superstar.png` | The Mango Interview: All broadcast cameras whip 90° away to mango; Modi jaw drops in shock double-take | Beat 3 (Superstar & Shock) |
| `mitron_p3_flagship_a_mango_beat4_scrum.png` | The Mango Interview: Cartoon journalists tumble into photo scrum dogpile around mango pedestal; strobes pop | Beat 4 (Photo Scrum Dogpile) |
| `mitron_p3_flagship_b_inauguration_beat1_setup.png` | Inauguration Infinity: 3.6m golden shears approaching tricolor ribbon at grandstand | Beat 1 (Setup) |
| `mitron_p3_flagship_b_inauguration_beat2_reveal.png` | Inauguration Infinity: Cut reveals nested secondary ribbon; rapid arm springs out; crane shears descend | Beat 2 (Escalation) |
| `mitron_p3_flagship_b_inauguration_beat3_confetti_chai.png` | Inauguration Infinity: Harmless paper confetti shower erupts; shears cut simultaneously; tiny cutting-chai cup elevates | Beat 3 (Confetti & Punchline) |
| `mitron_p3_flagship_b_inauguration_beat4_reset.png` | Inauguration Infinity: Confetti gently falls; rapid deployer arm resets fresh ribbon | Beat 4 (Reaction & Reset) |
| `mitron_p3_flagship_c_roadshow_beat1_float.png` | Roadshow Camera Chaos: Grand motorcade float with waving Modi, petal cannons, loudspeakers, and jogging commandos | Beat 1 (Setup) |
| `mitron_p3_flagship_c_roadshow_beat2_drone_tangle.png` | Roadshow Camera Chaos: Quadcopter camera drone buzzes low and gets tangled in marigold festoons | Beat 2 (Drone Snag) |
| `mitron_p3_flagship_c_roadshow_beat3_paparazzi_clash.png` | Roadshow Camera Chaos: Photographers collide face-to-face, locking lenses and blinding each other; chai-wala steps in | Beat 3 (Paparazzi Clash) |
| `mitron_p3_flagship_c_roadshow_beat4_dizzy_wobble.png` | Roadshow Camera Chaos: Photographers stagger dizzy in cartoon spiral wobble; drone recovers | Beat 4 (Dizzy Wobble) |
| `mitron_p3_active_runner_gameplay.png` | Genuine third-person runner perspective at active gameplay speed (18 m/s) passing decorated district scenery | 3rd-Person Runner Camera |
| `mitron_p3_mobile_portrait_390x844.png` | Mobile viewport test confirming framing, readability, and UI safety margins on portrait smartphones | Mobile Portrait View |

---

## 6.7 Verification & Performance Telemetry Results

- **Unit & Integration Tests:**
  - `npm run test:vip-express`: **118 / 118 tests passed** (including Suites 1–13).
  - `npm run test:worldgen`: **57 / 57 tests passed**.
  - `npm run test:engine-stabilization`: **7 / 7 tests passed**.
  - `npx tsc --noEmit`: **0 TypeScript compilation errors**.
  - Production build (`npm run build`): **Clean build in 1.87s**.
- **Runtime Performance Profiling (Google Chrome Angle WebGL):**
  - **Frame Rate:** $61\text{ FPS}$ sustained (0 stutter / 0 frame drops).
  - **Draw Calls:** $9,352$ calls.
  - **Triangles:** $563,298$ triangles.
  - **Memory:** $2,232$ geometries, $68$ textures.
  - **Memory Leaks:** $0$ leaks. `pruneDetached()` completely purges detached recyclable chunk elements.
  - **Collision Safety:** All roadside elements $|X| \ge 8.8\text{m} > 4.2\text{m}$, overhead spans $Y \ge 9.3\text{m} > 8.5\text{m}$.

