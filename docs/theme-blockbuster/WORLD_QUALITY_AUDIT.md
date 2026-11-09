# METRO RUNNER 3D — PHASE 11: BLOCKBUSTER WORLD QUALITY AUDIT
## Independent AAA Technical Art, Visual Design, Motion & Three.js Architecture Audit

**Repository:** `https://github.com/dharaksh2807-svg/ss`  
**Target Branch:** `main`  
**Audit Commit Grounding:** `c45fe3f` (Phase 10 Certified Main)  
**Audit Date:** November 9, 2026  
**Lead Auditor:** Independent Technical Art Director & Principal Three.js Rendering Engineer  
**Methodology:** Empirical headless Chromium rendering ($1440 \times 900$ desktop, $390 \times 844$ mobile portrait), Three.js WebGL renderer introspection, scene graph traversal, and deterministic multi-seed sampling via `test/audit-phase11-blockbuster-worlds.mjs`.

---

## 1. Executive Summary & Quality Benchmark

Metro Runner 3D has undergone extensive architectural evolution across Phases 1 through 10, achieving exceptional mechanical fairness, responsive multi-lane locomotion, zero unexplained collision fatalities, and a stable 60 FPS physics loop. However, across its **17 registered worlds**, the visual execution spans a vast disparity:

1. **The Blockbuster Showcase Tier (`VIP_EXPRESS`, `RAHULVERSE`, `CHRONO_KINGDOM`, `INFERNO_EXPRESS`, `MIDNIGHT_VELVET`):**
   These environments feature bespoke procedural canvas textures, kinetic event loops, rich multi-district narrative progression, and recognizable cultural/thematic satire. They rival commercial endless runners in sheer ambition and entertainment value.
2. **The Thematic Modern Tier (`ORBITAL_HALO`, `NEON_RAINLINE`, `ABYSSAL_GLASSLINE`, `HAUNTED_CARNIVAL`, `JURASSIC_RUSH`, `VIVA_HEAT`, `DOOMSDAY_LAST_TRANSIT`):**
   Solid thematic mood, distinct lighting palettes, and specialized shader accents, but frequently hampered by repetitive district tiling beyond 1500m and elevated draw call overhead.
3. **The Legacy Core Tier (`MODERN_METRO`, `HISTORIC_QUARTER`, `UNDERGROUND_METRO`, `NEON_INDUSTRIAL`):**
   Heavily reliant on primitive box extrusions, uniform lighting with minimal specular bite, and flat tiling textures. They look like functional technical prototypes rather than AAA blockbuster experiences.

---

## 2. Empirical Cross-World Audit Matrix

All 17 worlds were audited on a live WebGL canvas using the normal third-person player camera under controlled conditions:
- **Beginning Checkpoint:** $Z = -50\text{m}$ (Initial run launch, hero entrance)
- **Mid-Run District:** $Z = -1000\text{m}$ (Core district traversal, active obstacle traffic)
- **Late-Game Traversal:** $Z = -2200\text{m}$ (Endless scaling, district cycling, repetition risk)
- **Preset LOW:** Forced `GraphicsPreset.LOW` (`sceneryDetail: 'MINIMAL'`, shadows disabled)
- **Seed Variation:** Deterministic Seed `1337` vs Seed `7777` at $Z = -1000\text{m}$
- **Mobile Viewport:** $390 \times 844$ portrait orientation

### Master Telemetry & Performance Table

| World ID | Name | Z=1000m Draw Calls | Z=1000m Triangles | Scene Meshes | LOW Triangles | LOW Tris $\Delta$ | Frame Time Avg (P95) | FPS |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `MODERN_METRO` | Modern Metro | 3,866 | 435,056 | 5,884 | 401,788 | $-7.6\%$ | $16.66\text{ms}$ ($17.4\text{ms}$) | 60 |
| `HISTORIC_QUARTER` | Historic Railway Quarter | 4,351 | 464,174 | 6,487 | 388,484 | $-16.3\%$ | $16.67\text{ms}$ ($17.5\text{ms}$) | 60 |
| `UNDERGROUND_METRO`| Underground Vaults | 3,748 | 391,958 | 6,016 | 417,550 | $+6.5\%$ | $16.66\text{ms}$ ($17.4\text{ms}$) | 60 |
| `NEON_INDUSTRIAL` | Neon Industrial Yard | 3,858 | 431,836 | 5,868 | 368,408 | $-14.7\%$ | $16.67\text{ms}$ ($17.5\text{ms}$) | 60 |
| `NEON_RAINLINE` | Neon Rainline Cyberpunk | 3,644 | 435,098 | 5,504 | 397,788 | $-8.6\%$ | $16.66\text{ms}$ ($17.4\text{ms}$) | 60 |
| `ORBITAL_HALO` | Orbital Halo Space Ring | 2,848 | 386,114 | 5,946 | 381,770 | $-1.1\%$ | $16.66\text{ms}$ ($17.5\text{ms}$) | 60 |
| `ABYSSAL_GLASSLINE`| Abyssal Glassline Deep Sea | 3,721 | 416,140 | 5,889 | 378,826 | $-9.0\%$ | $16.67\text{ms}$ ($17.4\text{ms}$) | 60 |
| `DOOMSDAY_LAST_TRANSIT` | Doomsday Wasteland | 3,704 | 413,772 | 5,789 | 411,808 | $-0.5\%$ | $16.67\text{ms}$ ($17.4\text{ms}$) | 60 |
| `PHANTOM_LINE` | Phantom Line Ghost Metro | 3,532 | 389,686 | 5,849 | 441,346 | $+13.3\%$ | $16.66\text{ms}$ ($17.4\text{ms}$) | 60 |
| `HAUNTED_CARNIVAL` | Haunted Carnival | 4,592 | 464,584 | 6,954 | 404,954 | $-12.8\%$ | $16.65\text{ms}$ ($17.5\text{ms}$) | 60 |
| `VIP_EXPRESS` | Mitron Express 2.0 | **5,485** | **486,266** | **8,197** | 468,240 | $-3.7\%$ | $16.67\text{ms}$ ($17.5\text{ms}$) | 60 |
| `RAHULVERSE` | Rahulverse: Never-Ending | **5,776** | **485,530** | **8,789** | 475,554 | $-2.1\%$ | $16.67\text{ms}$ ($17.6\text{ms}$) | 60 |
| `MIDNIGHT_VELVET` | Midnight Velvet Art Deco | 4,509 | 482,974 | 6,435 | 445,350 | $-7.8\%$ | $16.66\text{ms}$ ($17.5\text{ms}$) | 60 |
| `CHRONO_KINGDOM` | Chrono Kingdom Clockwork | 3,711 | 451,354 | 6,700 | 467,030 | $+3.5\%$ | $16.66\text{ms}$ ($17.8\text{ms}$) | 60 |
| `INFERNO_EXPRESS` | Inferno Volcanic Bridge | 4,280 | 454,098 | 6,204 | 416,904 | $-8.2\%$ | $16.67\text{ms}$ ($17.6\text{ms}$) | 60 |
| `JURASSIC_RUSH` | Jurassic Rush Caldera | 3,764 | 434,622 | 5,542 | 417,550 | $-3.9\%$ | $16.68\text{ms}$ ($17.6\text{ms}$) | 60 |
| `VIVA_HEAT` | Viva Heat Street Carnival| 4,433 | 458,674 | 6,591 | 444,828 | $-3.0\%$ | $16.67\text{ms}$ ($17.8\text{ms}$) | 60 |

*Data source: [audit_telemetry.json](file:///Users/dharaksh/Desktop/ss/artifacts/phase11/audit_telemetry.json) captured live on Three.js engine via Playwright.*

---

## 3. Independent 9-Dimension Scoring & Ranking

Each world was evaluated independently on an objective 10-point scale:
1. **AD:** Art Direction & Cohesion (Identity, color harmony, atmosphere, tone)
2. **GQ:** Geometry Quality & Silhouettes (Cornices, rooflines, depth, avoided boxiness)
3. **LI:** Lighting & Shading (Key-to-ambient balance, specular highlights, emissive balance)
4. **AN:** Animation & Kinematics (NPCs, animated events, environmental motion, particle fx)
5. **EV:** Environmental Variety (District transitions, procedural novelty beyond 2000m)
6. **ST:** Visual Storytelling (Narrative environmental cues, world purpose, drama/humor)
7. **GR:** Gameplay Readability (Track contrast, obstacle silhouette readability, coin visibility)
8. **TP:** Technical Performance (Draw call efficiency, triangle count, preset scalability)
9. **OV:** Overall Entertainment Value (Spectacle, memorability, replayability)

### Comprehensive Scoring Leaderboard

| Rank | World ID | AD | GQ | LI | AN | EV | ST | GR | TP | OV | Overall Index / 10 | Tier Rating |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | `VIP_EXPRESS` | 9.5 | 9.0 | 9.0 | 9.5 | 9.5 | 10.0 | 8.5 | 7.5 | 10.0 | **9.17** | Blockbuster S-Tier |
| **2** | `RAHULVERSE` | 9.5 | 9.0 | 9.0 | 9.5 | 9.5 | 10.0 | 8.5 | 7.5 | 10.0 | **9.17** | Blockbuster S-Tier |
| **3** | `CHRONO_KINGDOM`| 9.2 | 8.8 | 9.0 | 9.2 | 8.8 | 9.2 | 8.5 | 8.0 | 9.2 | **8.88** | Blockbuster S-Tier |
| **4** | `INFERNO_EXPRESS`| 9.0 | 8.6 | 9.2 | 8.8 | 8.2 | 8.8 | 9.0 | 8.0 | 9.0 | **8.73** | Blockbuster S-Tier |
| **5** | `MIDNIGHT_VELVET`| 9.0 | 8.6 | 9.0 | 8.6 | 8.5 | 9.0 | 8.5 | 7.5 | 9.0 | **8.63** | Premium A-Tier |
| **6** | `VIVA_HEAT` | 8.8 | 8.2 | 8.8 | 8.5 | 8.2 | 8.2 | 8.8 | 8.0 | 8.6 | **8.43** | Premium A-Tier |
| **7** | `HAUNTED_CARNIVAL`| 8.5 | 8.2 | 8.5 | 8.5 | 8.0 | 8.5 | 8.2 | 7.5 | 8.6 | **8.28** | Premium A-Tier |
| **8** | `JURASSIC_RUSH` | 8.5 | 8.0 | 8.5 | 8.2 | 8.0 | 8.2 | 8.5 | 8.5 | 8.5 | **8.32** | Premium A-Tier |
| **9** | `ORBITAL_HALO` | 8.2 | 7.8 | 8.5 | 7.6 | 7.2 | 8.0 | 9.2 | 9.2 | 8.0 | **8.19** | Solid B-Tier |
| **10**| `NEON_RAINLINE` | 8.2 | 7.6 | 8.5 | 7.8 | 7.5 | 8.0 | 8.0 | 8.5 | 8.2 | **8.03** | Solid B-Tier |
| **11**| `ABYSSAL_GLASSLINE`| 8.0 | 7.5 | 8.0 | 7.6 | 7.2 | 7.6 | 8.2 | 8.5 | 7.8 | **7.82** | Solid B-Tier |
| **12**| `DOOMSDAY_LAST_TRANSIT`| 7.6 | 7.2 | 7.5 | 7.2 | 7.0 | 8.0 | 7.5 | 8.5 | 7.5 | **7.56** | Passable C-Tier |
| **13**| `PHANTOM_LINE` | 7.5 | 7.0 | 7.5 | 7.2 | 6.8 | 7.5 | 7.5 | 8.5 | 7.2 | **7.41** | Passable C-Tier |
| **14**| `MODERN_METRO` | 7.0 | 6.5 | 7.0 | 6.5 | 6.5 | 6.2 | 8.5 | 8.5 | 6.6 | **7.03** | Legacy C-Tier |
| **15**| `HISTORIC_QUARTER`| 7.0 | 6.4 | 7.0 | 6.0 | 6.2 | 6.5 | 8.2 | 8.0 | 6.5 | **6.87** | Underperforming D-Tier |
| **16**| `UNDERGROUND_METRO`| 6.5 | 6.0 | 6.2 | 5.5 | 5.5 | 6.0 | 7.8 | 8.5 | 6.0 | **6.44** | Underperforming D-Tier |
| **17**| `NEON_INDUSTRIAL`| 6.5 | 6.0 | 6.5 | 6.0 | 5.5 | 5.6 | 8.0 | 8.5 | 5.6 | **6.41** | Underperforming D-Tier |

---

## 4. Deep-Dive World Evaluations

### 4.1 Chrono Kingdom: The Clockwork Empire (`CHRONO_KINGDOM`)
- **Visual Identity & Atmosphere:** Victorian clockwork steampunk. Deep slate tile mansard roofs, burnished copper steam conduits, polished champagne brass gears, and procedural Roman numeral clock faces.
- **Architectural Strengths:** Beautiful multi-tier horological towers. Escapement mechanisms with real gear teeth are placed at track intersections. Procedural canvas textures for dials, astrolabes, and pressure gauges eliminate blurry raster artifacts.
- **Observed Deficiencies:**
  - Skybridge train passes are occasionally desynchronized with the procedural chunk stream, popping into view at $Z = -80\text{m}$ rather than easing in from the horizon.
  - In `LOW` preset, clock dial canvas textures remain at $512 \times 512$ with no mipmap reduction, creating unneeded GPU texture memory footprint.
- **Evidence:** Captured at [chrono_kingdom_01_beginning_z50.png](file:///Users/dharaksh/Desktop/ss/artifacts/phase11/chrono_kingdom_01_beginning_z50.png) and [chrono_kingdom_02_midrun_z1000.png](file:///Users/dharaksh/Desktop/ss/artifacts/phase11/chrono_kingdom_02_midrun_z1000.png).

### 4.2 Inferno Express: Volcanic Bridge (`INFERNO_EXPRESS`)
- **Visual Identity & Atmosphere:** High-stakes volcanic gorge. Hexagonal basalt column clusters, jagged obsidian teeth, glowing orange lava oceans generated with organic Voronoi convection cells, and incandescent thermal fissures.
- **Architectural Strengths:** Strong verticality. Iron suspension chain bridges and hanging iron cauldrons frame the player's view. Upward orange lighting from the lava floor provides intense, dramatic rim lighting on character and train models.
- **Observed Deficiencies:**
  - High chromatic fatigue: after traversing $2000\text{m}$, the constant black/orange/crimson palette feels oppressive and visually exhausting.
  - Basalt column instances on the outer perimeter share identical heights across chunks, creating a visible "staircase" banding artifact at distance.
- **Evidence:** Captured at [inferno_express_02_midrun_z1000.png](file:///Users/dharaksh/Desktop/ss/artifacts/phase11/inferno_express_02_midrun_z1000.png) and [inferno_express_03_late_z2200.png](file:///Users/dharaksh/Desktop/ss/artifacts/phase11/inferno_express_03_late_z2200.png).

### 4.3 Jurassic Rush: Primeval Caldera (`JURASSIC_RUSH`)
- **Visual Identity & Atmosphere:** Primeval Mesozoic wilderness. Towering petrified redwood trunks, stratified sandstone canyon cliffs, procedural fern fronds with organic leaflets, and giant dinosaur ribcage overpasses.
- **Architectural Strengths:** Exceptional organic contrast. Breaks the architectural box paradigm completely. Redwood bark texture utilizes vertical furrows with procedural green moss highlights.
- **Observed Deficiencies:**
  - Distant pterosaur silhouettes in the sky are simple 2D billboard sprites with rigid linear translation, lacking wing-flap vertex deformation.
  - Ribcage bone arches over the tracks have sharp, low-poly beveling on the inner curves that looks slightly coarse when running directly underneath.
- **Evidence:** Captured at [jurassic_rush_02_midrun_z1000.png](file:///Users/dharaksh/Desktop/ss/artifacts/phase11/jurassic_rush_02_midrun_z1000.png).

### 4.4 Haunted Carnival: Abandoned Fairgrounds (`HAUNTED_CARNIVAL`)
- **Visual Identity & Atmosphere:** Decaying gothic carnival. Weathered circus big-tops, creaking ferris wheels, distorted mercury mirrors, and purple/pumpkin atmospheric haze.
- **Architectural Strengths:** Excellent narrative set pieces. The entrance funhouse facade, warped ticket booths, and flickering incandescent string lights immediately establish mood.
- **Observed Deficiencies:**
  - The purple/black background lighting causes dark obstacles (parked baggage carts and barricades) to lose silhouette definition against dark track ballast.
  - Ferris wheel gondolas use a simple rotational parent matrix that can jitter if delta-time exceeds $0.03\text{s}$.
- **Evidence:** Captured at [haunted_carnival_02_midrun_z1000.png](file:///Users/dharaksh/Desktop/ss/artifacts/phase11/haunted_carnival_02_midrun_z1000.png).

### 4.5 Midnight Velvet: Art Deco Boulevard (`MIDNIGHT_VELVET`)
- **Visual Identity & Atmosphere:** 1920s Roaring Twenties luxury metropolis. Polished charcoal obsidian marble, fluted champagne gold pilasters, royal velvet burgundy awnings, and grand casino marquees.
- **Architectural Strengths:** Masterclass in PBR specular reflectivity. The contrast between matte slate granite and high-specular gold trim gives structures a three-dimensional depth that pops even under nighttime conditions.
- **Observed Deficiencies:**
  - Over 4,500 draw calls at $Z = -1000\text{m}$, spiking to 7,087 at $Z = -50\text{m}$. Gold architectural trim pieces and individual marquee bulbs are instantiated as individual meshes rather than combined instanced batches.
- **Evidence:** Captured at [midnight_velvet_01_beginning_z50.png](file:///Users/dharaksh/Desktop/ss/artifacts/phase11/midnight_velvet_01_beginning_z50.png) and [midnight_velvet_02_midrun_z1000.png](file:///Users/dharaksh/Desktop/ss/artifacts/phase11/midnight_velvet_02_midrun_z1000.png).

### 4.6 Mitron Express: The Great Inauguration (`VIP_EXPRESS`)
- **Visual Identity & Atmosphere:** Masterstroke cinematic political cartoon universe. Saffron and gold haveli palaces, parliament circular columns, giant stainless teacups, mega ribbon-cutting gantries, and roving media circus crews.
- **Architectural Strengths:** The undisputed pinnacle of environmental storytelling in the game. Intricate jali stone screens, carved chhatri domes, and procedural satire billboards. Features the richest animated event choreography (floating victory selfie drones, press anchor podiums, swiveling coalition chairs).
- **Observed Deficiencies:**
  - Extreme draw call overhead: 5,485 calls at $Z = -1000\text{m}$, peaking at **8,418 calls** at $Z = -50\text{m}$!
  - 8,197 total meshes in the active scene. Media cameras, tricolor bunting ribbons, and flower garlands are each non-instanced objects. On low-end Android or integrated Intel GPUs, this is the most demanding world in the game.
- **Evidence:** Captured at [vip_express_01_beginning_z50.png](file:///Users/dharaksh/Desktop/ss/artifacts/phase11/vip_express_01_beginning_z50.png) and [vip_express_02_midrun_z1000.png](file:///Users/dharaksh/Desktop/ss/artifacts/phase11/vip_express_02_midrun_z1000.png).

### 4.7 Rahulverse: The Never-Ending Yatra (`RAHULVERSE`)
- **Visual Identity & Atmosphere:** Satirical pan-India walking rally. White canvas shamiana pavilions, red-carpet running lanes, tractor barricades, giant megaphone towers, and self-flipping "Next Yatra Starts Here" finish lines.
- **Architectural Strengths:** Brilliant comic timing and procedural continuity. Bridges rural dirt-road rallies with modern city conference halls. Rahul's vigorous sprint locomotion and jumping push-up animations give the world enormous kinetic personality.
- **Observed Deficiencies:**
  - Peak draw call count across the entire repository: **5,776 calls** at $Z = -1000\text{m}$ (8,789 meshes).
  - Repetitive crowd NPC billboard cutouts placed along track barricades do not utilize instancing.
- **Evidence:** Captured at [rahulverse_01_beginning_z50.png](file:///Users/dharaksh/Desktop/ss/artifacts/phase11/rahulverse_01_beginning_z50.png) and [rahulverse_02_midrun_z1000.png](file:///Users/dharaksh/Desktop/ss/artifacts/phase11/rahulverse_02_midrun_z1000.png).

---

## 5. Root Causes of Visual Weaknesses Across Legacy Worlds

Direct inspection of `src/environment/SceneryFactory.ts`, `ModernMetroWorldBuilder.ts`, `HistoricQuarterWorldBuilder.ts`, `UndergroundMetroWorldBuilder.ts`, and `NeonIndustrialWorldBuilder.ts` reveals the exact technical mechanisms producing visual defects:

### 1. Primitive Box-Extrusion Architecture
- **Root Cause:** In `SceneryFactory.ts`, buildings in `MODERN_METRO`, `HISTORIC_QUARTER`, and `NEON_INDUSTRIAL` are created using single `BoxGeometry(width, height, depth)` shapes wrapped in tiling wall/window canvas textures.
- **Visual Defect:** Straight $90^\circ$ vertical edges, zero cornices, zero window sills, zero recessed entryways. Buildings look like cardboard cartons pasted alongside the track.
- **Contrast with AAA Standard:** Modern AAA runners bevel all vertical building corners by $0.2\text{m}$, step facades back every 3 stories, and recess windows by $0.15\text{m}$ to catch natural shadows and specular highlights.

### 2. Flat Lighting & Washed Ambient Ratios
- **Root Cause:** In `WorldScene.ts`, ambient lighting is initialized at `intensity: 0.75` to ensure obstacle visibility, with hemisphere sky light at `0.55`. The single directional sun light has an intensity of `1.1`.
- **Key-to-Ambient Ratio:** $\frac{1.1}{0.75} \approx 1.46 : 1$.
- **Visual Defect:** A ratio below $2.5 : 1$ flattens normal maps and washes out ambient occlusion. Recesses, under-track voids, and building alleys look uniformly illuminated rather than deep and shadowy.

### 3. Floating Structures & Missing Ground Anchors
- **Root Cause:** In legacy chunks, building groups are positioned at $Y = 0$, but track transitions with banking or elevated flyovers raise track bed to $Y = 4.35\text{m}$.
- **Visual Defect:** Looking down from a train rooftop reveals empty sky gaps beneath adjacent sidewalk slabs. While Phase 7–10 introduced retaining plinths down to $Y = -5.85\text{m}$ in `ModernMetroWorldBuilder`, legacy `SceneryFactory` helper functions still emit flat ground slabs with zero vertical foundation down-skirts.

### 4. Non-Instanced Prop Flooding Causing Draw Call Spikes
- **Root Cause:** In `VipSatireWorldBuilder.ts` and `RahulSatireWorldBuilder.ts`, individual props (e.g. microphones, floral garlands, barricade posts, streetlights, crowd figures) are added directly as `THREE.Mesh` objects to the district group.
- **Visual & Performance Defect:** Draw calls skyrocket to 5,500–8,400. While modern desktop GPUs can process this, WebGL CPU driver validation bottlenecks frame delivery on mobile Safari and Chrome on Android, causing frame drops during rapid camera pans.

### 5. Presets Inconsistency (LOW & AUTO)
- **Root Cause:** `GraphicsManager.ts` defines `sceneryDetail: 'MINIMAL'` for preset `LOW`. However, world builders handle `MINIMAL` inconsistently:
  - `HISTORIC_QUARTER` properly drops triangle counts by $16.3\%$.
  - `UNDERGROUND_METRO` and `CHRONO_KINGDOM` actually *increased* triangle counts ($+6.5\%$ and $+3.5\%$) because procedural generation branches failed to prune secondary props while alternate chunk seed templates generated larger base structures!
  - `VIP_EXPRESS` and `RAHULVERSE` only reduced triangle count by $3.7\%$ and $2.1\%$, leaving massive draw call burdens on budget devices.

---

## 6. Synthesis: Top Worlds, Weakest Worlds, and Shared Defects

### The Three Highest-Potential Worlds
1. **`VIP_EXPRESS` (Mitron Express 2.0):** World-class satirical humor, unmatched personality, unforgettable landmarks. **Action:** Implement instanced prop batching to slash draw calls from 5,500 to $< 1,800$.
2. **`CHRONO_KINGDOM` (Clockwork Empire):** Unmatched steampunk fantasy aesthetic. Kinetic cogs, astrolabes, and time dials provide genuine blockbuster spectacle. **Action:** Add volumetric god-ray shafts through clockwork arches and smooth skybridge train arrival easing.
3. **`INFERNO_EXPRESS` (Volcanic Bridge):** High-octane cinematic intensity with real Voronoi lava physics and incandescent lighting. **Action:** Break color fatigue with geothermal quartz caverns and sulfur steam chambers at $Z > 1800\text{m}$.

### The Three Weakest Implementations
1. **`NEON_INDUSTRIAL`:** Lowest entertainment index ($5.6/10$). Monotonous colored boxes (shipping containers) without architectural depth or narrative drama.
2. **`UNDERGROUND_METRO`:** Claustrophobic tunnel tube with uniform lighting. Ceiling vault repeats relentlessly without cavern breakthroughs or abandoned platform reveals.
3. **`HISTORIC_QUARTER`:** Flat red-brick cardboard box facades with painted-on windows. Lacks 3D stone cornices, chimney silhouettes, or animated steam locomotive presence.

### The Three Most Serious Shared Engineering/Art Problems
1. **Excessive WebGL Draw Calls ($3,500–8,400$):** Lack of hierarchical instancing for decorative street furniture, signs, and lighting fixtures.
2. **Box-Shaped Silhouette Monotony in Core Worlds:** Absence of beveled edges, stepped-back stories, and recessed window geometries.
3. **Flat Ambient Lighting Ratios:** Low key-to-ambient light contrast ($< 1.5 : 1$) washing out surface depth and material roughness.

---

## 7. Mobile Viewport & Readability Audit

Evaluating portrait $390 \times 844$ captures across all 17 worlds confirmed:
- **Vertical FOV & Horizon:** Vertical FOV of $62^\circ$ comfortably contains 3 playable lanes and the obstacle horizon line at $Y \approx 52\%$ of screen height.
- **Lane Delineation:** High-contrast rail cap materials ($0xe0e6ed$ polished steel) remain legible even against dark gravel ballast.
- **Mobile Readability Hazard in Dark Worlds:** In `PHANTOM_LINE`, `HAUNTED_CARNIVAL`, and `DOOMSDAY_LAST_TRANSIT`, dark obstacle barricades ($0x1c1917$) risk blending into dark track beds under bright ambient sunlight on mobile OLED displays.
- **HUD Avoidance Zone:** The top $110\text{px}$ (multiplier, coins, score) and bottom $90\text{px}$ (touch swipe zone) remain clear of essential route indicators.

---

## 8. Presets & Scenery Retention Verdict

- **Scenery Retention Status:** **PASS (100% Retained).** The historical defect where scenery vanished under `LOW` or `AUTO` presets has been successfully mitigated. Ground meshes, trackbeds, and primary buildings remain present across all 17 worlds in `LOW` mode.
- **Pruning Consistency:** **FAIL (Needs Standardization).** Triangle reduction under `LOW` ranges erratically from $-16.3\%$ down to $+13.3\%$. A unified `MINIMAL` LOD policy must be enforced so every world drops draw calls by $\ge 40\%$ and triangles by $\ge 30\%$ when `LOW` is selected.
