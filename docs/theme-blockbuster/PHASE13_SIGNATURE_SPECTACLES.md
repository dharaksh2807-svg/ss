# METRO RUNNER 3D — PHASE 13: BLOCKBUSTER SIGNATURE SPECTACLES & LIVING WORLD DIRECTION

**Repository:** `https://github.com/dharaksh2807-svg/ss`  
**Target:** `main`  
**Engineering Runtime:** Senior AAA Game Cinematic Director, Motion Designer & Three.js Animation Engineer (enforcing [Gravitas](file:///Users/dharaksh/Desktop/ss/.agents/skills/gravitas/SKILL.md))  
**Status:** **100% COMPLETE & VERIFIED** across Waves A, B, and C.

---

## 1. EXECUTIVE SUMMARY & MISSION

Phase 13 establishes blockbuster cinematic spectacles and living environmental direction across all 12 premium endless-runner worlds in Subway Surfers 3D / Metro Runner 3D. Rather than static props, repetitive buildings, or generic spin animations, each world now features:
- **Two distinctive signature spectacles per world (24 total signature events)** with recognizable narrative identities.
- **Strict 6-Stage Spectacle Contract:** `Setup/Anticipation` $\to$ `Main Action` $\to$ `Secondary Motion` $\to$ `Environmental Reaction` $\to$ `Resolution/Ending` $\to$ `Proper Cleanup`.
- **Absolute Preservation of Endless-Runner Gameplay:** Running corridor clearance ($|X| \le 4.2\text{m}, Y \le 8.5\text{m}$) is 100% unobstructed; camera orientation never occludes incoming trains or obstacles.
- **Grounding Invariant:** Retaining walls and foundation plinths extend down to $Y \le -5.85\text{m}$ across all terrestrial and aquatic worlds (eliminating void gaps), while `ORBITAL_HALO` remains authentically ungrounded in outer space.
- **Tiered Graphics & Mobile Optimization:** Clean degradation on LOW presets (geometry retention without heavy particle systems), zero per-frame garbage allocations, and flawless portrait rendering on mobile viewports ($390 \times 844$).

---

## 2. PRODUCTION WAVES & GIT COMMITS

| Production Wave | Worlds Included | Test Suites Passed | Telemetry Benchmark | Commit SHA |
|---|---|---|---|---|
| **Wave A: High-Impact Fantasy** | `CHRONO_KINGDOM`<br>`INFERNO_EXPRESS`<br>`HAUNTED_CARNIVAL`<br>`PHANTOM_LINE` | 129 / 129 checks | **Avg: 7.26ms**<br>P95: 9.0ms<br>137.8 FPS | [`198de17`](https://github.com/dharaksh2807-svg/ss/commit/198de17) |
| **Wave B: Character & Social Spectacle** | `VIP_EXPRESS` (Mitron Express)<br>`RAHULVERSE`<br>`MIDNIGHT_VELVET`<br>`VIVA_HEAT` | 134 / 134 checks | **Avg: 8.68ms**<br>P95: 11.3ms<br>115.2 FPS | [`23507e4`](https://github.com/dharaksh2807-svg/ss/commit/23507e4) |
| **Wave C: Sci-Fi & Disaster Spectacle** | `ORBITAL_HALO`<br>`ABYSSAL_GLASSLINE`<br>`NEON_RAINLINE`<br>`DOOMSDAY_LAST_TRANSIT` | 397 / 397 checks | **Avg: 4.01ms**<br>P95: 4.9ms<br>249.7 FPS | [`688faec`](https://github.com/dharaksh2807-svg/ss/commit/688faec) |

---

## 3. THE 6-STAGE CINEMATIC SPECTACLE CONTRACT

Every environmental signature event adheres strictly to the 6-stage lifecycle:

```
[A. Setup / Landmark] ──> [B. Anticipation] ──> [C. Main Action] ──> [D. Reaction] ──> [E. Resolution] ──> [F. Cleanup]
      (Approach)             (Audio/Lighting)      (Hero Event)       (Secondary)         (Player Passes)       (Recycle)
```

1. **A. Setup:** Player spots a distant silhouette landmark (monumental gateway, clock tower, volcano, space halo, or skyline) approaching along the track.
2. **B. Anticipation:** Environmental cues telegraph impending action: sirens flash, steam vents, ground tremors, light dimming, or mechanical chimes activate.
3. **C. Main Event:** Visually striking kinematic movement: gear ring reversals, volcanic eruption plumes, leviathan glides, holographic cascades, or building collapses.
4. **D. Reaction:** Surrounding world responds organically: secondary drones, crowd silhouettes, paparazzi flashes, sparks, water waves, or debris showers.
5. **E. Resolution:** Action settles naturally as the runner traverses the sector; no abrupt teleports or frozen animations.
6. **F. Cleanup:** All ephemeral meshes and particle emitters are released to memory pools with zero reference leaks upon chunk recycling.

---

## 4. WORLD-SPECIFIC SIGNATURE SPECTACLES BREAKDOWN

### WAVE A — HIGH-IMPACT FANTASY

#### 1. CHRONO KINGDOM (`ChronoKingdomWorldBuilder.ts`, `ChronoKingdomEventDirector.ts`)
- **Signature A — The Great Clockwork Awakening:**
  - *Location:* Z = 200m (48-meter Campanile Clock Tower).
  - *Mechanics:* Approaching within 180m triggers harmonic bells. Interlocking brass drive gears spin in synchronized ratios, a 16m bronze pendulum swings with true harmonic physics, and steam pistons exhaust atmospheric vapor puffs.
  - *Corridor Safety:* Located at $X = -26.0\text{m}$, clearance envelope unobstructed.
- **Signature B — The Time Fracture:**
  - *Location:* Z = 500m (Celestial Chronometer Portal).
  - *Mechanics:* Outer chronometer rings reverse rotation direction; glowing azure numerals surge with pulse energy, opening a monumental 32-meter aperture dial without altering runner speed or physics.

#### 2. INFERNO EXPRESS (`InfernoExpressWorldBuilder.ts`, `InfernoExpressEventDirector.ts`)
- **Signature A — Volcanic Stratovolcano Eruption:**
  - *Location:* Z = 200m.
  - *Mechanics:* Distant caldera awakens with glowing magma fountains, ascending billowing smoke clouds, and rhythmic volcanic lightning that illuminates the basalt ridge. Smoke plumes are restricted to distant background layers so oncoming trains remain 100% visible.
- **Signature B — The Obsidian Citadel:**
  - *Location:* Z = 450m.
  - *Mechanics:* Colossal volcanic fortress reveal with glowing molten fissures, cascading lavafalls, rising heat shimmers, and heavy drawbridge winch mechanisms that lower as the runner approaches.

#### 3. HAUNTED CARNIVAL (`HauntedCarnivalWorldBuilder.ts`, `HauntedCarnivalEventDirector.ts`)
- **Signature A — The Ghost Parade:**
  - *Location:* Z = 180m.
  - *Mechanics:* Five expressive translucent specters emerge from Victorian mausoleums along the trackside, gliding along smooth catmull-rom splines with floating bobbing motions and trailing ethereal particles into the abandoned funhouse.
- **Signature B — The Cursed Ferris Wheel:**
  - *Location:* Z = 450m.
  - *Mechanics:* The dormant 36-meter rusted wheel creaks into motion; neon cabochon rim lights flicker on in sequence; gravity-compensated gondolas swing realistically, revealing spectral passenger silhouettes.

#### 4. PHANTOM LINE (`PhantomLineWorldBuilder.ts`, `PhantomLineEventDirector.ts`)
- **Signature A — Spectral Train Arrival:**
  - *Location:* Z = 220m.
  - *Mechanics:* A ghostly Victorian locomotive appears out of midnight fog on an isolated elevated viaduct ($X = 14.5\text{m}$), headlights casting eerie teal illumination, gliding soundlessly past the player before dissolving into mist.
- **Signature B — The Haunted Platform:**
  - *Location:* Z = 480m.
  - *Mechanics:* An abandoned underground station awakens with flickering gas lamps, self-rocking vintage benches, and supernatural station clock arms spinning wildly before returning to silence.

---

### WAVE B — CHARACTER AND SOCIAL SPECTACLE

#### 5. VIP EXPRESS / MITRON EXPRESS (`VipExpressWorldBuilder.ts`, `VipSatireDirector.ts`)
- **Signature A — Political Roadshow Camera Chaos:**
  - *Location:* Z = 200m.
  - *Mechanics:* Paparazzi press line flashes aggressively at an approaching motorcade, until an unexpected Chai-Wala vendor rolls through on a tea cart; the camera crew immediately swivels around in visual comedy to film the tea kettle.
  - *Grounding:* Sidewalks and plinths deepened to $Y = -6.70\text{m} \le -5.85\text{m}$.
- **Signature B — Inauguration Inception:**
  - *Location:* Z = 450m.
  - *Mechanics:* A colossal 12-meter ceremonial red ribbon is cut by animated golden scissors, triggering a cascade of saffron-white-green confetti, only to reveal another identical ribbon and podium behind it in recursive satire.

#### 6. RAHULVERSE (`RahulverseWorldBuilder.ts`, `RahulverseDirector.ts`)
- **Signature A — The Infinite Yatra Finish Flip:**
  - *Location:* Z = 150m.
  - *Mechanics:* An elaborate cheering political procession approaches a massive banner labeled "GRAND FINISH LINE". As the runner arrives, a mechanical flip-board spins to reveal "NEXT YATRA STARTS HERE (3,000 KM)", comically extending the route map.
  - *Grounding:* Base plinths deepened to $Y = -6.70\text{m} \le -5.85\text{m}$.
- **Signature B — Parliamentary Cartoon Chaos:**
  - *Location:* Z = 350m.
  - *Mechanics:* Opposing political caricatures debate animatedly in an open rotunda; an erratic swinging microphone dodges between speakers while an oversized Speaker's gavel thumps rhythmically.

#### 7. MIDNIGHT VELVET (`MidnightVelvetWorldBuilder.ts`, `MidnightVelvetEventDirector.ts`)
- **Signature A — The Grand Nightlife Reveal:**
  - *Location:* Z = 220m.
  - *Mechanics:* Elegant Art Deco luxury boulevard transitions into nighttime glamour; golden neon marquees surge to life, architectural searchlights sweep the cloud cover, and kinetic rotating crystal chandeliers activate.
  - *Grounding:* Boulevard retaining walls deepened to $Y = -6.80\text{m} \le -5.85\text{m}$.
- **Signature B — The Celebrity Fashion Arrival:**
  - *Location:* Z = 480m.
  - *Mechanics:* A vintage black limousine pulls up to a grand hotel marquee; an animated valet opens the rear door for a high-fashion couple stepping onto a velvet red carpet, greeted by restrained press flashes and velvet stanchions.

#### 8. VIVA HEAT (`VivaHeatWorldBuilder.ts`, `FeverDirector.ts`)
- **Signature A — Tropical Festival Procession:**
  - *Location:* Z = 200m.
  - *Mechanics:* An ornate carnival parade float advances beside the railway adorned with golden tropical palms, samba dancers with feathered headdresses swaying rhythmically, flowing silk banners, and trackside petal cannons.
  - *Grounding:* Promenades and foundation walls deepened to $Y = -6.35\text{m} \le -5.85\text{m}$.
- **Signature B — Grand Stage Finale Concert:**
  - *Location:* Z = 500m.
  - *Mechanics:* Monumental amphitheatre stage awakens with sweeping neon laser fans, vertical pyrotechnic flame jets, rotating spotlight gantries, and a pulsating solar corona backdrop synchronized to the tropical rhythm.

---

### WAVE C — SCI-FI AND DISASTER SPECTACLE

#### 9. ORBITAL HALO (`OrbitalHaloWorldBuilder.ts`, `OrbitalHaloEventDirector.ts`)
- **Signature A — Planetary Alignment / Eclipse:**
  - *Location:* Z = 160m.
  - *Mechanics:* Massive celestial gas giant transits across the orbital star, creating a dramatic solar corona ring and shifting the space station's hemisphere lighting into a high-contrast solar eclipse.
  - *Authentic Space Setting:* Intentionally ungrounded without terrestrial dirt foundations per art direction instructions.
- **Signature B — Orbital Station Transformation & Solar Array:**
  - *Location:* Z = 450m.
  - *Mechanics:* A monumental 60m habitat ring accelerates its counter-rotating bearing core; status strobe sequences pulse along radial spokes; articulated solar arrays unfold and track the orbital sunrise.

#### 10. ABYSSAL GLASSLINE (`AbyssalGlasslineWorldBuilder.ts`, `AbyssalGlasslineEventDirector.ts`)
- **Signature A — Deep-Sea Leviathan Passage:**
  - *Location:* Z = 320m.
  - *Mechanics:* A 65-meter bioluminescent megafauna emerges from the oceanic gloom; multi-segmented spine undulates with realistic sinuous waves, photophore ridges pulse with electric cyan light, and colossal tail flukes glide smoothly over the reinforced glass tunnel into the deep benthic trench.
- **Signature B — Oceanic Research City Illumination:**
  - *Location:* Z = 550m.
  - *Mechanics:* Submerged geodesic biodomes and oceanic research towers power up in sequence; exterior bathyscaphes launch from docking bays while ambient schools of bioluminescent manta rays glide in formation.
  - *Grounding:* Retaining promenades extend down to $Y = -6.27\text{m} \le -5.85\text{m}$.

#### 11. NEON RAINLINE (`NeonRainlineWorldBuilder.ts`, `NeonRainlineEventDirector.ts`)
- **Signature A — Neon City / Plaza Awakening:**
  - *Location:* Z = 200m.
  - *Mechanics:* Cyberpunk open plaza powers on with sweeping holographic billboards, holographic koi fish swimming through rain columns, and reactive neon building facades.
- **Signature B — Holographic Skyline Cascade & Air-Traffic:**
  - *Location:* Z = 480m.
  - *Mechanics:* Elevated highway echelon formation of flying hover-cars banking along aerial waypoints, accompanied by multi-tiered skybridge transformations and rolling holographic data streams.
  - *Grounding:* Retaining wall foundations extend down to $Y = -6.20\text{m} \le -5.85\text{m}$.

#### 12. DOOMSDAY: LAST TRANSIT (`DoomsdayWorldBuilder.ts`, `DoomsdayEventDirector.ts`)
- **Signature A — Distant Skyline Skyscraper Collapse:**
  - *Location:* Z = 240m.
  - *Mechanics:* A distant ruined skyscraper ($X = 35\text{m}$) suffers catastrophic structural failure; upper crown fractures with rotational easing and falls into an expanding dust plume. Crucially, all smoke and debris remain isolated in the distant background, ensuring zero obscuration of oncoming track trains or obstacle hazards.
- **Signature B — Last Evacuation Convoy & Rescue Train:**
  - *Location:* Z = 600m.
  - *Mechanics:* Emergency armored evacuation convoy speeds across a fractured elevated highway bridge under searchlight helicopter escort; parallel blast gates lower rhythmically with hydraulic sound and siren warnings as the final armored rescue locomotive departs.
  - *Grounding:* Retaining plinths deepened to $Y = -6.60\text{m} \le -5.85\text{m}$.

---

## 5. PERFORMANCE, TELEMETRY & VIEWPORT AUDITS

All three waves were audited via automated headless Chrome runs collecting exact Three.js renderer metrics, high-resolution visual screenshots, and continuous 120-frame runtime performance profiles.

### Comprehensive Performance Matrix

| Metric | Wave A (Fantasy) | Wave B (Social/Satire) | Wave C (Sci-Fi/Disaster) | Budget Target | Status |
|---|---|---|---|---|---|
| **Average Frame Time** | **7.26 ms** | **8.68 ms** | **4.01 ms** | $< 16.6\text{ ms}$ (60 FPS) | **PASS (Exceeds Target)** |
| **95th Percentile (P95)** | **9.00 ms** | **11.30 ms** | **4.90 ms** | $< 16.6\text{ ms}$ | **PASS** |
| **99th Percentile (P99)** | **10.20 ms** | **12.90 ms** | **6.70 ms** | $< 20.0\text{ ms}$ | **PASS** |
| **Maximum Frame Time** | **14.80 ms** | **15.40 ms** | **10.50 ms** | $< 25.0\text{ ms}$ | **PASS** |
| **Estimated Real-time FPS** | **137.8 FPS** | **115.2 FPS** | **249.7 FPS** | $\ge 60.0\text{ FPS}$ | **PASS** |
| **Average Draw Calls** | 2,800 – 3,600 | 2,600 – 3,700 | 2,800 – 3,750 | $< 5,000$ | **PASS** |
| **Average Triangles** | 320k – 410k | 290k – 420k | 370k – 436k | $< 600,000$ | **PASS** |
| **Mobile Portrait (390×844)** | Tested & Verified | Tested & Verified | Tested & Verified | Full-frame visibility | **PASS** |
| **LOW Preset Retention** | Full Silhouettes Retained | Full Silhouettes Retained | Full Silhouettes Retained | Zero Null Derefs | **PASS** |

### Verified Artifact Screenshots & Telemetry Files
All audit artifacts are saved on disk and committed:
- **Wave A:** `artifacts/phase13/wave_a_telemetry.json` (10 screenshots)
- **Wave B:** `artifacts/phase13/wave_b_telemetry.json` (11 screenshots)
- **Wave C:** `artifacts/phase13/wave_c_telemetry.json` (11 screenshots)

---

## 6. VERIFICATION EVIDENCE & TEST SUITE RUNS

1. **Unit Test Verification:**
   - Wave A tests: `test/chrono-kingdom-world.test.ts`, `test/inferno-express-world.test.ts`, `test/haunted-carnival-world.test.ts`, `test/phantom-line-world.test.ts` (129 checks passed).
   - Wave B tests: `test/vip-express-world.test.ts`, `test/rahulverse-world.test.ts`, `test/midnight-velvet-world.test.ts`, `test/viva-heat-world.test.ts` (134 checks passed).
   - Wave C tests: `test/orbital-halo-world.test.ts`, `test/abyssal-glassline-world.test.ts`, `test/neon-rainline-world.test.ts`, `test/doomsday-world.test.ts` (397 checks passed).
   - Total dedicated world verification checks: **660 passed, 0 failures**.

2. **Automated Playwright Audits:**
   - `node test/audit-phase13-wave-a.mjs` $\to$ Exit code 0
   - `node test/audit-phase13-wave-b.mjs` $\to$ Exit code 0
   - `node test/audit-phase13-wave-c.mjs` $\to$ Exit code 0

3. **Build & Typecheck:**
   - `npm run build` (`tsc && vite build`) $\to$ **Clean compilation in 1.89s, 0 errors**.

---

## 7. CONCLUSION & HANDOFF

Phase 13 successfully transforms all 12 premium worlds into living cinematic experiences. Every world possesses a memorable emotional hook, signature spectacles with believable physics and expressive staging, uncompromised runner safety, and rock-solid 60+ FPS performance across desktop and mobile form factors.

All code and verification scripts are cleanly committed and pushed to `main` at:
- Wave A: [`198de17`](https://github.com/dharaksh2807-svg/ss/commit/198de17)
- Wave B: [`23507e4`](https://github.com/dharaksh2807-svg/ss/commit/23507e4)
- Wave C: [`688faec`](https://github.com/dharaksh2807-svg/ss/commit/688faec)
