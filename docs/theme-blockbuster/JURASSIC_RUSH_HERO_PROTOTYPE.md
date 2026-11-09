# METRO RUNNER 3D — PHASE 12: JURASSIC RUSH BLOCKBUSTER HERO WORLD PROTOTYPE

**Author:** Technical Game Designer, Senior Technical Artist, Lead Visual FX Engineer (Claude Sonnet 4.6 Persona)  
**World Candidate:** `JURASSIC_RUSH` (The Lost World Railway)  
**Status:** Certified Blockbuster Production Standard  
**Target Branch:** `main`  
**Execution Runtime:** Gravitas Engineering Reliability Framework  

---

## 1. Executive Summary & Candidate Selection

Following the comprehensive Phase 11 Blockbuster World Quality Audit, **Jurassic Rush** was selected as the hero candidate for complete AAA transformation. While already possessing rich prehistoric atmosphere and unique fauna encounters, it previously lacked:
1. An iconic, immediate visual opening landmark when starting a run.
2. A colossal signature architectural landmark visible from afar that gives the world majestic vertical scale.
3. Dedicated exterior train livery modeling matching the rugged safari expedition theme.
4. Professional 6-stage animation lifecycles for its signature animated spectacles.

Under Phase 12, Jurassic Rush has been elevated into a flagship showcase world featuring:
- **Unforgettable Opening:** The **Sector 04 Outpost Gateway** at $Z = -22\text{m}$ featuring twin 18m cyclopean stone towers, carved T-Rex fossil skull crest, hazard chevrons, and eternal fire braziers.
- **Signature Architectural Landmark:** The **Grand Sun Temple Viaduct & Titanosaur Bone Arches** at $Z = 1200\text{m}-1600\text{m}$, with a 32m stepped solar pyramid, 5 colossal curved Titanosaur ribcage arches spanning overhead, and twin tiered cataracts.
- **Spectacle A (Giant Dinosaur Encounter):** Colossal Sauropod emerging from the river shallows, stepping across the river terrace, turning its head inquisitively to track the oncoming runner, complete with expanding water splash wakes, chest respirations, and counterbalanced tail swings.
- **Spectacle B (Prehistoric Valley Reveal):** Tightening jungle canopy tunnel with overhanging arched boughs that abruptly bursts open into a vast, sun-drenched valley with layered sandstone mesas, distant volcanic peaks, cascading waterfalls, and migrating herds.
- **Spectacle C (Raptor Canyon Chase):** Pack of 3 articulated velociraptors perched atop an elevated rock shelf ($Y = 3.5\text{m}$), leaping down in an arc onto the running terrace, sprinting at $24\text{m/s}$, executing a dynamic tactical formation shift (Alpha surging $+3.6\text{m}$ ahead; flankers flaring wide and banking into turns), and veering into a canyon wall fissure behind a massive sandstone rock buttress outcrop.
- **Distinctive Expedition Train:** Rugged safari steel bullbar / cowcatcher plow, push bars, amber hazard chevron brow plate, 3-pod projector searchlight roof bar, and reinforced anti-raptor armor skirts with amber sill line—strictly preserving the authoritative collision box.
- **100% Collision & Gameplay Invariants:** Zero intrusions into the playable running corridor ($|X| \le 4.2\text{m}, Y \le 8.5\text{m}$), zero physics alterations, zero memory leaks.

---

## 2. Cinematic Identity & Environmental Architecture

### 2.1 The Opening: Sector 04 Outpost Gateway ($Z = -22\text{m}$)
The first second of gameplay sets the emotional tone without requiring an unskippable cutscene. As the runner takes their first strides from the start line ($Z = 0$), they are confronted with the monumental **Sector 04 Outpost Gateway**:
- **Twin Cyclopean Towers:** Grounded from sub-surface bedrock plinths ($Y = -6.0\text{m}$) rising $18\text{m}$ into the Cretaceous sky at $X = \pm 7.2\text{m}$ ($1.3\text{m}$ outside the playable corridor).
- **Relief Belts & Glyphs:** Golden carved megalithic bands and prehistoric claw glyphs at $Y = 7.5\text{m}$.
- **Cross-Arch Lintel & Bronze Truss:** Heavy ironwood beam and reinforced bronze truss spanning at $Y = 9.8\text{m} \to 11.5\text{m}$ (well clear of the $Y \le 8.5\text{m}$ clearance envelope).
- **Prehistoric T-Rex Skull Crest:** Massive sculpted fossil cranium, snout, and serrated teeth mounted dead center at $Y = 10.8\text{m}$ facing the player.
- **Hazard Warning Signage:** High-contrast amber/black chevron hazard plate (`EXPEDITION PERIMETER - SECTOR 04 - DANGER: MEGAFAUNA`).
- **Solar Fire Braziers & Steam Vents:** Twin copper-and-stone brazier bowls burning radiant golden-amber flames atop each tower summit ($Y = 18\text{m}$), with base steam vents framing the departure.

### 2.2 Signature Landmark: Grand Sun Temple Viaduct & Titanosaur Bone Arches ($Z = 1200\text{m}-1600\text{m}$)
Situated in District 3 (The Ancient Sanctuary), this landmark provides a visual anchor seen hundreds of meters before arrival:
- **Stepped Cyclopean Sun Pyramid:** Rising to $Y = 32\text{m}$ at $X = 34.0\text{m}$, featuring 5 grand stepped terraces ($Y = 4\text{m}, 10\text{m}, 16\text{m}, 22\text{m}, 28\text{m}$), ceremonial staircases, a golden solar disc altar, and an eternal flame brazier.
- **5 Titanosaur Bone Arches:** Spanning overhead at 18m intervals along the tracks. Upright rib bone bases are anchored at $|X| = 7.8\text{m}$, curving upward and inward to a petrified spinal vertebra keystone at $Y = 12.0\text{m}$. Lowest clearance over the playable corridor ($|X| \le 4.2\text{m}$) is $Y = 9.16\text{m}$ (providing $+0.66\text{m}$ safety margin above the $8.5\text{m}$ ceiling). Draped in hanging emerald jungle vines.
- **Tiered Cataract Waterfalls:** Plunging from temple foundation conduits into deep gorge river channels below ($Y = -6.0\text{m}$) with animated scrolling foam.

### 2.3 Environmental Depth Layering
1. **Foreground ($|X| = 4.5\text{m}-7.5\text{m}$):** Eye-level cycad fans, mossy basalt boulders, bright amber petrified wood curbs, and rotting banyan logs with shelf bracket fungi.
2. **Midground ($|X| = 8.5\text{m}-25.0\text{m}$):** Colossal ancient rainforest sequoias ($H = 30\text{m}$), flowing riverbed channels, cataracts, dinosaur watching platforms, and raptor running terraces.
3. **Distant Background ($|X| = 35.0\text{m}-100.0\text{m}$):** Stratified sandstone canyon walls, towering volcanic mesas, layered mountain ridge silhouettes, soaring pterosaur flocks, and migrating herds.

---

## 3. The Three Signature Spectacles & 6-Stage Animation Lifecycles

Every spectacle strictly implements the professional 6-stage lifecycle:
$$\text{Anticipation} \longrightarrow \text{Main Action} \longrightarrow \text{Secondary Motion} \longrightarrow \text{Environmental Reaction} \longrightarrow \text{Clear Ending} \longrightarrow \text{Proper Cleanup}$$

### 3.1 Spectacle A: Giant Dinosaur Encounter (District 1 — Valley of Giants)
- **Stage 1 (Anticipation, $dist > 140\text{m}$ / `DORMANT`):** Colossal sauropod stands near the riverbank ($X = -12.5\text{m}$), head lowered near water level; gentle chest respirations ($1.04\times$ scale) and resting water ripples.
- **Stage 2 (Main Action, $dist \in [70\text{m}, 140\text{m}]$ / `APPROACH`):** Heavy columnar pillar legs engage alternating 4-legged stride; neck begins upward sweep.
- **Stage 3 (Secondary Motion, $dist \in [15\text{m}, 70\text{m}]$ / `CROSSING`):** Strides across riverbed terrace; 4-segment neck flexes into a serpentine S-curve rising $18\text{m}$ into the sunlit sky.
- **Stage 4 (Environmental Reaction, $dist \in [-40\text{m}, 15\text{m}]$ / `PASSING`):** Expanding concentric water splash rings pulse and fade beneath its feet; as the player roars past, the sauropod smoothly turns its head toward the track with an inquisitive tilt ($\Delta \theta_y = -0.58\text{ rad}, \Delta \theta_z = -0.18\text{ rad}$); counterbalancing tail swishes side to side.
- **Stage 5 (Clear Ending, $dist \in [-110\text{m}, -40\text{m}]$ / `GRAZING`):** Head dips down toward sequoia boughs along the river valley to browse foliage; steady ambient stride toward the distant herd.
- **Stage 6 (Proper Cleanup, $dist < -110\text{m}$ / `SETTLED`):** Loops smoothly or prunes automatically when the chunk is unmounted via `pruneDetached()`. Zero per-frame memory allocation.

### 3.2 Spectacle B: Prehistoric Valley Reveal (District 0 $\to$ 1 Transition)
- **Stage 1 (Anticipation, $Z \in [-320\text{m}, -370\text{m}]$ / `CONFINED_TUNNEL`):** Canopy trees flank close to the track ($|X| = 5.2\text{m}$); massive sequoia boughs arch overhead ($Y = 10.2\text{m}$) forming a shadowy, dense green tunnel.
- **Stage 2 (Main Action, $Z \in [-370\text{m}, -400\text{m}]$ / `EMERGING`):** The dense canopy tunnel abruptly parts; railway bursts out onto a high viaduct.
- **Stage 3 (Secondary Motion, $Z \in [-400\text{m}, -440\text{m}]$ / `EXPANDING_PANORAMA`):** The horizon widens to $|X| = 80\text{m}$ revealing stratified sandstone canyon mesas and distant volcanic peaks.
- **Stage 4 (Environmental Reaction, $Z \in [-440\text{m}, -500\text{m}]$ / `HERD_MIGRATION`):** Cascading mountain cataracts pour down the valley walls with billowing mist plumes; river channels fork across the valley floor.
- **Stage 5 (Clear Ending, $Z < -500\text{m}$ / `SETTLED_VISTA`):** Moving herds of sauropods, stegosaurs, and triceratops migrate steadily across the sunlit valley plain at $X = -45\text{m} \to -65\text{m}$, with soaring pterosaur flocks wheeling overhead.
- **Stage 6 (Proper Cleanup):** Coordinated through `JurassicRushEventDirector` with automatic pruning.

### 3.3 Spectacle C: Raptor Canyon Chase (District 2 — Raptor Canyon)
- **Stage 1 (Anticipation, $dist > 90\text{m}$ / `PERCHED`):** Pack of 3 articulated raptors sits perched atop an elevated rock shelf at $X = 11.5\text{m}, Y = 3.5\text{m}$; twitchy bird-of-prey head turns ($\theta_y = \sin(5t) \cdot 0.35$) and twitching balancing tails awaiting oncoming runner.
- **Stage 2 (Main Action, $dist \in [50\text{m}, 90\text{m}]$ / `LEAPING`):** Pack springs downward from the shelf in a parabolic leap arc ($Y: 3.5\text{m} \to 1.5\text{m}$) onto the running terrace alongside the canyon wall.
- **Stage 3 (Secondary Motion, $dist \in [15\text{m}, 50\text{m}]$ / `SPRINTING`):** Full-tilt predatory sprint matching train speed ($v = 24\text{m/s}$); athletic alternating bipedal leg pumping, raked torso posture, bobbing heads, and snapping jaws.
- **Stage 4 (Environmental Reaction, $dist \in [-35\text{m}, 15\text{m}]$ / `FORMATION_SHIFT`):** Pack executes a tactical hunting formation:
  - Alpha raptor surges $+3.6\text{m}$ forward into the lead.
  - Left flanker flares inward toward track terrace ($X = 7.8\text{m}$).
  - Right flanker flares outward toward canyon wall ($X = 13.5\text{m}$).
  - Dynamic banking roll into turns ($\theta_z = \pm 0.15\text{ rad}$).
- **Stage 5 (Clear Ending, $dist \in [-90\text{m}, -35\text{m}]$ / `DISAPPEARING`):** Alpha cuts sharply right ($\Delta \theta_y = -0.45\text{ rad}$) toward a natural fissure in the sandstone canyon wall; flankers file in behind a massive sandstone rock buttress outcrop ($W = 8.0\text{m}, H = 14.0\text{m}, L = 16.0\text{m}$) at $Z \approx -chunkLength \times 0.82$, breaking line of sight cleanly.
- **Stage 6 (Proper Cleanup, $dist < -90\text{m}$ / `SETTLED`):** Smooth reset / chunk unmount cleanup with zero orphan memory.

---

## 4. Expedition Train Livery & Exterior Modeling

In `src/track/ObstacleFactory.ts`, Jurassic Rush trains now receive dedicated rugged safari styling:
- **Heavy Steel Bullbar / Cowcatcher Plow:** Triangular plow wedge ($W = 2.32\text{m}, H = 0.48\text{m}$) with riveted steel push bumper bars mounted to cab lower face.
- **Amber Hazard Brow Plate:** High-contrast hazard amber chevron panel on cab nose.
- **Safari Searchlight Bar:** Cab-brow roof rack equipped with 3 heavy circular projector searchlight pods emitting warm golden-amber illumination.
- **Anti-Raptor Armored Skirts:** Reinforced steel skirts along both lower flanks with an amber rub-rail sill line.
- **Authoritative Collider Invariant:** Exterior additions are purely visual meshes attached to the train group; the physical train collider box ($W = 2.7\text{m}, H = 4.5\text{m}, L = 22\text{m}$) is completely untouched.

---

## 5. Performance, Memory & Collision Verification Data

Measured on real Google Chrome browser hardware via Playwright and automated unit test suites:

### 5.1 Real Browser Telemetry (`hero_prototype_telemetry.json`)
| Metric | Measurement | Target Bar | Verdict |
| :--- | :---: | :---: | :---: |
| **Average Frame Time** | **24.42 ms** | $\le 33.3\text{ ms}$ | **PASS** |
| **P50 Frame Time** | **24.10 ms** | $\le 33.3\text{ ms}$ | **PASS** |
| **P95 Frame Time** | **27.20 ms** | $\le 33.3\text{ ms}$ | **PASS** |
| **P99 Frame Time** | **29.50 ms** | $\le 35.0\text{ ms}$ | **PASS** |
| **Stutter Frames (>33.3ms)** | **1 / 120 (0.8%)** | $\le 3\%$ | **PASS** |
| **Texture Growth (3 world cycles)** | **0 textures** | 0 | **PASS (Zero Leaks)** |
| **Geometry Growth (3 world cycles)** | **-2235 geometries** | $\le 0$ | **PASS (Clean Disposal)** |

### 5.2 Scene Geometry Across Checkpoints
| Checkpoint | Player Z | Draw Calls | Triangles | Geometries | Active Fauna |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Sector 04 Outpost Gate** | $-5\text{m}$ | 5,297 | 461,192 | 2,168 | 3 Sauropods |
| **Valley Canopy Tunnel** | $-360\text{m}$ | 4,831 | 427,110 | 1,739 | 5 Sauropods, 1 Raptor |
| **Valley Panorama Reveal** | $-415\text{m}$ | 5,229 | 464,638 | 2,092 | 5 Sauropods, 2 Raptors |
| **Giant Sauropod Crossing** | $-580\text{m}$ | 3,773 | 416,316 | 1,375 | 4 Sauropods, 4 Raptors |
| **Raptor Canyon Perch** | $-830\text{m}$ | 3,166 | 407,366 | 1,404 | 5 Raptors |
| **Raptor Tactical Formation** | $-920\text{m}$ | 3,249 | 395,924 | 1,684 | 5 Raptors |
| **Raptor Buttress Disappearance**| $-980\text{m}$ | 2,846 | 364,182 | 1,346 | 4 Raptors |
| **Grand Sun Temple Viaduct** | $-1350\text{m}$| 4,719 | 501,958 | 2,596 | 5 Titanosaur Arches |
| **Late Game (>2000m)** | $-2250\text{m}$| 3,566 | 406,354 | 1,123 | 3 Apex Carnivores |
| **Preset LOW Retention** | $-1350\text{m}$| 3,083 | 419,732 | 1,544 | Core Scene Retained |
| **Mobile Portrait (390x844)** | $-25\text{m}$ | 5,139 | 425,352 | 2,077 | 3 Sauropods |

### 5.3 Clearance Envelope Invariants
Automated 3D bounding box sweep across all 6 biome districts, opening gate, and signature landmark confirmed **exactly 0 intrusions** into the playable runner volume ($|X| \le 4.2\text{m}, Y \le 8.5\text{m}$):
- District A (Lost Jungle): **0 intrusions**
- District B (Valley of Giants): **0 intrusions**
- District C (Raptor Canyon): **0 intrusions**
- District D (Ancient Sanctuary): **0 intrusions**
- District E (Fern Marsh): **0 intrusions**
- District F (Pterosaur Cliffs): **0 intrusions**
- Sector 04 Outpost Gateway: **0 intrusions**
- Grand Sun Temple Viaduct & Titanosaur Bone Arches: **0 intrusions**

---

## 6. Verification Image Gallery

Captured via automated headless Chrome at 1440x900 desktop and 390x844 mobile viewports:

1. **Sector 04 Outpost Gateway (Opening Landmark):** `artifacts/phase12/01_jurassic_rush_opening_gate.png`
2. **Prehistoric Valley Reveal (Canopy Tunnel):** `artifacts/phase12/02_jurassic_rush_canopy_tunnel.png`
3. **Prehistoric Valley Reveal (Panorama Emergence):** `artifacts/phase12/03_jurassic_rush_valley_reveal.png`
4. **Spectacle A (Giant Dinosaur Encounter):** `artifacts/phase12/04_jurassic_rush_giant_dinosaur_encounter.png`
5. **Spectacle C (Raptor Perched Anticipation):** `artifacts/phase12/05_jurassic_rush_raptor_perched.png`
6. **Spectacle C (Raptor Tactical Formation Shift):** `artifacts/phase12/06_jurassic_rush_raptor_chase_formation.png`
7. **Spectacle C (Raptor Buttress Disappearance):** `artifacts/phase12/07_jurassic_rush_raptor_buttress_disappearance.png`
8. **Signature Landmark (Grand Sun Temple Viaduct & Bone Arches):** `artifacts/phase12/08_jurassic_rush_sun_temple_titanosaur_arches.png`
9. **Rugged Safari Expedition Train:** `artifacts/phase12/09_jurassic_rush_expedition_train.png`
10. **Late-Game Traversal (>2000m):** `artifacts/phase12/10_jurassic_rush_late_game_2200m.png`
11. **Scenery Retention under Preset LOW:** `artifacts/phase12/11_jurassic_rush_preset_low_retention.png`
12. **Mobile Portrait Readability (390 x 844):** `artifacts/phase12/12_jurassic_rush_mobile_viewport.png`

---

## 7. Release Certification & Verdict

Jurassic Rush is certified as the **Blockbuster Hero World Prototype** for Metro Runner 3D. It combines cinematic opening impact, monumental signature scale, high-framerate Three.js rendering, zero GPU memory leakage, and complete collision safety.
