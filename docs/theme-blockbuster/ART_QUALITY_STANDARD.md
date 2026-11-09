# METRO RUNNER 3D — PRODUCTION ART QUALITY STANDARD & VISUAL BIBLE
## AAA Technical Art, Lighting, Architecture, and Performance Budgets

**Version:** 1.0.0 (Post-Phase 11 Audit)  
**Target:** Metro Runner 3D WebGL Production  
**Authority:** Technical Art Director, Visual Design Lead, and Principal Three.js Rendering Engineer  
**Purpose:** Provide the definitive technical and aesthetic standard for all current and future Metro Runner environments, characters, lighting pipelines, and procedural district planners.

---

## 1. Vision & Core Aesthetic Principles

A visually spectacular endless runner that kills players unfairly, suffers from visual clutter, or drops frames on mobile hardware is not premium quality. Metro Runner's visual standard rests on three non-negotiable pillars:

1. **Readability Trumps Decorative Clutter:** The player makes life-or-death navigation choices in under $120\text{ms}$. Obstacle silhouettes, lane boundaries, and rooftop jump portals must remain instantly readable across all viewing angles, speeds ($10–35\text{m/s}$), and lighting presets.
2. **Kinetic Life Over Static Dioramas:** A blockbuster environment is never a museum. Rivers must flow, lava must churn, foliage must sway, gears must turn, and crowds must react. Every world requires at least two procedural animated signature events.
3. **Architectural Believability & Depth (Anti-Box Standard):** No cardboard carton buildings. Structures must possess recessed window frames, stepped rooflines, vertical foundation down-skirts, and grounded contact shadows.

---

## 2. Character Locomotion & Visual Standards

### 2.1 Mesh & Skeleton Requirements
- **Rigging:** Humanoid hierarchy with spine, neck, head, shoulder, elbow, wrist, hip, knee, ankle, and toe bones.
- **Biomechanical Foot Grounding:** Character models must be grounded at $Y = 0.90\text{m}$ (`CONSTANTS.PLAYER_BASE_Y`). No foot floating, no penetration below the trackbed.
- **Locomotion Phase Matching:** Running footstep cadence must synchronize with player velocity $v$:
  $$\text{Stride Frequency} = \frac{v}{\text{Stride Length (1.65m)}}$$
  Feet must not skate or slide across ballast.
- **Silhouette Contrast:** Character materials must feature a subtle specular rim or micro-emissive rim ($0.05$ scale) to ensure the runner's back remains crisp against dark tunnels or bright neon skyboxes.

---

## 3. Architecture & Environment Quality Standards

### 3.1 The "Anti-Box" Geometry Standard
Every building, station, and wall structure must satisfy the following geometric invariants:

| Component | Minimum AAA Standard | Prohibited Anti-Pattern |
| :--- | :--- | :--- |
| **Corners & Edges** | Beveled edges or vertical pillar trims ($\ge 0.15\text{m}$ relief). | Sharp $90^\circ$ single-box extrusions. |
| **Window Facades** | Recessed window glazing ($\ge 0.12\text{m}$ behind exterior frame). | 2D painted window grids flat on brick/concrete. |
| **Rooflines** | Stepped ziggurats, cornices, mansards, HVAC units, water towers. | Flat unadorned cuboid tops. |
| **Ground Anchor** | Solid foundation plinth extending to $Y \le -5.85\text{m}$. | Floating building groups showing void beneath. |
| **Alley & Separation** | Minimum $1.5\text{m}$ negative space between adjacent building lots. | Monolithic continuous wall blocks. |

### 3.2 Hero Landmarks
- **Pacing:** One monumental hero landmark must appear every $400\text{m}–600\text{m}$ of linear track traversal.
- **Entrance Telegraphing:** Major landmarks must be visible on the horizon at least $120\text{m}$ before the player reaches them.
- **Egress & Solvability:** The clearance envelope through any landmark archway or bridge must maintain a minimum width of $|X| \le 4.2\text{m}$ and height $Y \ge 8.5\text{m}$, guaranteeing that all 3 lanes and rooftop jumps remain $100\%$ obstacle-free.

---

## 4. Lighting, Shading & Atmospheric Depth

### 4.1 Key-to-Ambient Lighting Ratios
To prevent the "washed out daylight" defect observed in legacy worlds:
- **Key Light (Directional Sun):** Intensity $1.3–1.6$, angled between $35^\circ$ and $55^\circ$ above the horizon to cast legible diagonal shadows across the 3 tracks.
- **Ambient Light:** Maximum intensity $0.35–0.45$. Never exceed $0.50$.
- **Hemisphere Sky/Ground Light:** Intensity $0.25–0.35$ with distinct sky and ground bounce tints.
- **Mandatory Ratio:**
  $$\frac{\text{Key Light Intensity}}{\text{Ambient Light Intensity}} \ge 2.8 : 1$$

### 4.2 Material & PBR Consistency
- **PBR Roughness Range:**
  - Ballast & Asphalt: $0.85–0.95$ (Matte, high micro-roughness).
  - Train Bodies: $0.18–0.28$ (Automotive gloss enamel).
  - Track Rails: $0.15–0.25$ Roughness, $0.90–0.98$ Metalness (Gleaming specular highlight).
  - Facade Glass: $0.08–0.15$ Roughness, $0.85–0.95$ Metalness, subtle emissive interior glow ($0.15–0.25$).
- **Curvature Shader Invariant:** All custom materials instantiated in world builders must invoke `CurvedShaderManager.getInstance().applyCurvature(material)` to maintain continuous horizon world curvature.

---

## 5. WebGL Performance & Resource Budgets

Derived from empirical measurements in [audit_telemetry.json](file:///Users/dharaksh/Desktop/ss/artifacts/phase11/audit_telemetry.json):

| Metric | Current Peak (Observed) | Target AAA Budget (HIGH) | Target Budget (LOW) |
| :--- | :---: | :---: | :---: |
| **Draw Calls** | $5,776$ (`RAHULVERSE`) / $8,418$ (`VIP`) | **$\le 1,800$** | **$\le 650$** |
| **Triangles Rendered** | $486,266$ (`VIP_EXPRESS`) | **$\le 450,000$** | **$\le 220,000$** |
| **Active Scene Meshes** | $8,789$ (`RAHULVERSE`) | **$\le 2,500$** | **$\le 900$** |
| **GPU Texture Memory** | $\approx 45\text{MB}$ | $\le 40\text{MB}$ | $\le 20\text{MB}$ |
| **Shader Programs** | $24–32$ | $\le 28$ | $\le 16$ |
| **Frame Time (P95)** | $17.6\text{ms}$ | $\le 16.6\text{ms}$ (60 FPS) | $\le 16.6\text{ms}$ (60 FPS) |

### 5.1 Mandatory Batching via `THREE.InstancedMesh`
To drop draw calls from $5,500+$ to $< 1,800$:
1. Street furniture (lampposts, trash cans, hydrants, bollards, barricades) must be converted from unique meshes into pooled `THREE.InstancedMesh` instances per district chunk.
2. Crowd NPCs and procedural billboards must use instanced matrices with dynamic texture atlasing.
3. Windows and facade decorative panels must be combined into multi-instance batches sharing a single material.

---

## 6. Graphics Preset & Scalability Rules

When switching quality presets in `GraphicsManager.ts`:
- **`HIGH`:** Full instancing, cascaded shadow maps enabled ($2048\times 2048$), particle multiplier $1.0$, speed lines, cloud domes, and distant skyline visible.
- **`MEDIUM`:** Basic shadow maps ($1024\times 1024$), particle multiplier $0.6$, secondary foliage pruned by $50\%$.
- **`LOW` (`sceneryDetail: 'MINIMAL'`):**
  - **Shadows:** Completely disabled. Contact blob shadows engaged beneath player and trains.
  - **Geometry Pruning:** Secondary decorative props (bunting, flowerpots, small signs, trash bins) must be pruned wholesale ($100\%$ stripped).
  - **Draw Call Reduction Target:** Must achieve at least a **$40\%$ reduction in draw calls** and a **$30\%$ reduction in triangles** relative to `HIGH`.
  - **Retention Invariant:** Primary buildings, trackbeds, roadbeds, and terrain plinths must **NEVER** be culled. No black voids.

---

## 7. Mobile Viewport Standards ($390 \times 844$ Portrait)

- **Vertical Field of View:** Fixed at $62^\circ$.
- **Horizon Placement:** Camera look-at target must maintain the distant track horizon at $Y \approx 52\%$ of viewport height.
- **Safe Zones:**
  - Top $110\text{px}$: Reserved for HUD score, coin count, multiplier, and pause button.
  - Bottom $90\text{px}$: Reserved for mobile touch-swipe gesture detection.
  - Sides $24\text{px}$: Screen boundary margins.
- **Contrast Ratio:** Obstacles against track/ground must maintain a minimum luminance contrast ratio of $4.5 : 1$ under mobile conditions.

---

## 8. Prioritized Focused Improvement Backlog

The following ordered backlog identifies the precise technical remedies required to elevate all 17 worlds to the blockbuster quality bar:

| # | World | Current Defect | Root Cause / Investigation | Specific Solution | Expected Visual Benefit | Risk | Likely Files | Recommended Model | Effort |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| **1** | `VIP_EXPRESS` | Draw call explosion ($5,485–8,418$ calls). | Non-instanced media cameras, floral garlands, barricade posts, and chairs. | Batch tricolor bunting, chairs, barricades, and cameras into `THREE.InstancedMesh`. | Rock-solid 60 FPS on budget mobile devices without losing visual density. | Low | `src/environment/VipSatireWorldBuilder.ts` | Claude 3.5 Sonnet | Medium |
| **2** | `RAHULVERSE` | Extreme draw calls ($5,776–6,683$) & crowd mesh count ($8,789$). | Hundreds of individual crowd cutouts and banner posts spawned per chunk. | Implement `InstancedCrowdManager` sharing billboard geometry and texture atlas. | Eliminates micro-stutters during rapid multi-lane sweeps. | Low | `src/environment/worlds/rahulverse/RahulSatireWorldBuilder.ts` | Claude 3.5 Sonnet | Medium |
| **3** | `NEON_INDUSTRIAL` | Generic box architecture; lowest entertainment score ($5.6/10$). | Tiling colored `BoxGeometry` containers without 3D reliefs or machinery. | Introduce modular heavy gantry cranes, container stack overhangs, sparking welding robots, and rusted iron catwalks. | Transforms flat shipping yard into cinematic industrial zone. | Medium | `src/environment/worlds/neonIndustrial/NeonIndustrialWorldBuilder.ts` | GPT-4o / Claude 3.5 | High |
| **4** | `UNDERGROUND_METRO`| Monotonous endless tunnel tube; uniform lighting. | Continuous arched extrusion with unvarying cross-section and static lighting. | Break tunnel tube with cavernous multi-level abandoned stations, broken brick ceilings with sky shafts, and emergency red work-lights. | Replaces claustrophobia with cinematic subterranean spectacle. | Medium | `src/environment/worlds/undergroundMetro/UndergroundMetroWorldBuilder.ts` | Claude 3.5 Sonnet | High |
| **5** | `HISTORIC_QUARTER` | Flat cardboard-box brick facades with painted-on textures. | Primitive rectangular geometry in `SceneryFactory.ts` without stone cornices or trims. | Add 3D sandstone cornices, arched window pediments, slate mansard roofs, and smoking steam pipes. | Imbues the world with authentic 19th-century European railway charm. | Low | `src/environment/worlds/historicQuarter/HistoricQuarterWorldBuilder.ts` | Claude 3.5 Sonnet | Medium |
| **6** | `MODERN_METRO` | Sterile daylight skyscrapers; lacks dramatic lighting and depth. | Low key-to-ambient ratio ($1.46:1$); flat glass boxes. | Increase key sun contrast to $3.0:1$; step building facades; add rooftop helipads, antennas, and reflective glass balconies. | Establishes a polished, vibrant city core worthy of an endless runner flagship. | Low | `src/environment/worlds/modernMetro/ModernMetroWorldBuilder.ts` | Claude 3.5 Sonnet | Medium |
| **7** | `CHRONO_KINGDOM` | Skybridge train pop-in; preset `LOW` triangle count increase ($+3.5\%$). | Desynchronized spawn trigger; missing `sceneryDetail === 'MINIMAL'` branch. | Add horizon fog easing for skybridge trains; prune secondary cogs/dials in `MINIMAL`. | Eliminates pop-in and guarantees clean mobile performance scaling. | Low | `src/environment/worlds/chronoKingdom/ChronoKingdomWorldBuilder.ts` | Claude 3.5 Sonnet | Low |
| **8** | `INFERNO_EXPRESS` | Palette fatigue after $2000\text{m}$; stair-stepped basalt banding. | Continuous black/orange palette; uniform basalt column height generation. | Introduce white-hot geothermal quartz caves at $Z > 1800\text{m}$; randomize basalt column top noise. | Preserves high-stakes excitement across marathon runs. | Low | `src/environment/worlds/infernoExpress/InfernoExpressWorldBuilder.ts` | Claude 3.5 Sonnet | Medium |
| **9** | `HAUNTED_CARNIVAL` | Dark obstacle silhouette loss against dark ballast under purple fog. | Low contrast ratio between barricades ($0x1c1917$) and ground ballast ($0x1a1528$). | Add glowing jack-o-lantern trackside lanterns and luminous orange hazard trims to obstacle barricades. | Prevents frustrating unfair deaths on OLED mobile screens. | Low | `src/environment/worlds/hauntedCarnival/HauntedCarnivalWorldBuilder.ts` | Claude 3.5 Sonnet | Low |
| **10**| `ORBITAL_HALO` | Monotonous interior ring corridors beyond $1500\text{m}$. | Repeated modular ring station segments without cosmic landmarks. | Add solar flare viewing portals, massive exterior space shuttle docks, and glowing Earth horizon reveals. | Elevates hard sci-fi world into breathtaking cosmic journey. | Low | `src/environment/worlds/orbitalHalo/OrbitalHaloWorldBuilder.ts` | Claude 3.5 Sonnet | Medium |
| **11**| `DOOMSDAY_LAST_TRANSIT`| Murky dust storm crushes distant contrast; lack of visual landmarks. | Uniform orange-brown dust fog across all districts. | Add silhouette landmarks (collapsed radio tower, fractured suspension bridge span) with high-contrast warning strobes. | Enhances post-apocalyptic narrative immersion without eye strain. | Low | `src/environment/worlds/doomsdayLastTransit/DoomsdayWorldBuilder.ts` | Claude 3.5 Sonnet | Medium |
| **12**| `ALL WORLDS` | Core worlds lack bespoke train liveries (reverting to silver commuter train). | `ObstacleFactory.ts` cycles generic models for `MODERN_METRO`, `HISTORIC_QUARTER`, `UNDERGROUND`, `NEON_IND`. | Add custom PBR liveries (e.g. vintage steam-styled train for Historic, heavy yellow industrial freight for Neon Industrial). | Ensures 100% thematic visual cohesion between tracks and trains. | Low | `src/track/ObstacleFactory.ts` | Claude 3.5 Sonnet | Low |

---

## 9. Reusable Visual QA Checklist (Pre-Release Gate)

Before any new world or visual refactoring is accepted into `origin/main`, it must satisfy the 10-point Blockbuster QA Gate:

- [ ] **1. Collision Envelope Invariant:** Clearance $|X| \le 4.2\text{m}, Y \le 8.5\text{m}$ is $100\%$ free of scenery meshes.
- [ ] **2. Anti-Box Geometry:** All buildings feature beveled/trimmed corners, recessed windows ($\ge 0.12\text{m}$), and cornices.
- [ ] **3. Ground Anchor Invariant:** Foundation down-skirts extend to $Y \le -5.85\text{m}$. Zero void gaps beneath tracks.
- [ ] **4. Curvature Shader Invariant:** All custom materials invoke `CurvedShaderManager.applyCurvature(mat)`.
- [ ] **5. Key-to-Ambient Ratio:** Sun to ambient light intensity ratio is $\ge 2.8 : 1$.
- [ ] **6. Draw Call Budget:** World does not exceed $1,800$ draw calls on `HIGH` or $650$ on `LOW` at $Z = -1000\text{m}$.
- [ ] **7. Preset Scalability:** Under `LOW` preset, draw calls drop by $\ge 40\%$ and triangles by $\ge 30\%$, with zero disappearing ground or primary architecture.
- [ ] **8. Mobile Horizon Alignment:** At $390 \times 844$, track horizon sits between $48\%$ and $54\%$ of viewport height.
- [ ] **9. Silhouette Contrast:** All obstacle barricades and parked trains achieve $\ge 4.5 : 1$ luminance contrast against trackbed.
- [ ] **10. Kinetic Event Loop:** At least two distinct procedural animated events occur smoothly without delta-time spiking.
