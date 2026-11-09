# METRO RUNNER 3D — ARTIST-FACING CHARACTER ASSET BRIEF
**Document Version:** 1.0.0  
**Target Engine:** Three.js / WebGL 2.0 (Three r128+)  
**Target Format:** glTF 2.0 Binary (`.glb`)  
**Flagship Hero Targets:**
1. **Jax (`char_jax`)** — Flagship Street Runner (85%+ screen time)
2. **Luna (`char_luna`)** — Cyberpunk Infiltrator
3. **Cruz (`char_cruz`)** — Urban B-Boy Athlete
4. **Nova (`char_nova`)** — Solarpunk Aerial Specialist

---

## 1. Executive Summary & Production Goals

Metro Runner 3D requires high-fidelity, production-grade 3D humanoid character models to elevate the visual standard to AAA mobile quality. While our runtime procedural rig system currently constructs stylized characters from geometric primitives, external 3D artist deliverables must conform to strict topological, skeletal, deformation, and runtime memory specifications.

This document serves as the authoritative, binding technical brief for 3D character artists, riggers, and animators creating rigged `.glb` assets for Metro Runner 3D.

---

## 2. Technical Budgets & Runtime Constraints

All assets run in real-time on mobile browsers (WebGL 2.0, iOS Safari, Android Chrome) at 60–120 FPS. Performance budgets are strict and measured against full 3-lane rendering with animated trains, dynamic lighting, and particle effects.

| Metric | Target Budget per Character | Hard Maximum | Notes |
| :--- | :--- | :--- | :--- |
| **Polygon Count (Tris)** | 12,000 – 16,000 tris | 18,000 tris | Inclusive of head, hair, clothing, sneakers, and signature backpack/gear. |
| **Draw Calls** | 2 – 3 draw calls | 4 draw calls | Achieved via single hero material + optional transparent/emissive visor sub-mesh. |
| **Texture Sets** | 1 unified PBR texture set | 2 sets max | Diffuse/Albedo, Normal (OpenGL +Y), Packed ORM (Occlusion/Roughness/Metalness). |
| **Texture Resolution** | 2048 x 2048 px (PNG / Basis Universal) | 2048 x 2048 px | Packed efficiently with zero unused UV space. Mobile mipmaps generated at load. |
| **Bone Count (Deformers)** | 32 – 42 deform bones | 48 deform bones | Standard Humanoid glTF hierarchy + signature secondary bones (ponytails/hoodie strings). |
| **Morph Targets (Blendshapes)** | 16 – 24 blendshapes | 32 blendshapes | High-contrast facial expressions, athletic focus, blink, phonemes. |
| **File Size (.glb compressed)** | 2.5 MB – 4.0 MB | 5.0 MB | Draco geometry compression or Meshopt allowed if loader supported; uncompressed glb ≤ 6MB. |

---

## 3. Skeletal Rig Hierarchy & Joint Orientation

The skeleton must follow a standard Humanoid T-Pose/A-Pose hierarchy compatible with standard game engine retargeting and Three.js `AnimationMixer`.

### 3.1 Skeleton Hierarchy Specification
```
Root (World Origin [0, 0, 0])
 └── Hips (Pelvis root, ground elevation +0.95m)
      ├── Spine
      │    └── Spine1 (Chest)
      │         ├── Neck
      │         │    └── Head
      │         │         ├── Brow_L / Brow_R
      │         │         ├── Eye_L / Eye_R
      │         │         ├── Jaw
      │         │         └── Hair_Root / Ponytail_01_L / Ponytail_01_R (Secondary dynamics)
      │         ├── LeftShoulder (Clavicle_L)
      │         │    └── LeftArm (UpperArm_L)
      │         │         └── LeftForeArm (LowerArm_L)
      │         │              └── LeftHand
      │         │                   ├── LeftHandThumb1..3
      │         │                   ├── LeftHandIndex1..3
      │         │                   └── LeftHandFingers (Grouped knuckle joint)
      │         ├── RightShoulder (Clavicle_R)
      │         │    └── RightArm (UpperArm_R)
      │         │         └── RightForeArm (LowerArm_R)
      │         │              └── RightHand
      │         │                   ├── RightHandThumb1..3
      │         │                   ├── RightHandIndex1..3
      │         │                   └── RightHandFingers (Grouped knuckle joint)
      │         └── Prop_Backpack (Attach point for signature runner backpack / battery / boombox)
      ├── LeftUpLeg (Thigh_L)
      │    └── LeftLeg (Shin_L)
      │         └── LeftFoot (Ankle_L)
      │              └── LeftToeBase (Ball_L)
      └── RightUpLeg (Thigh_R)
           └── RightLeg (Shin_R)
                └── RightFoot (Ankle_R)
                     └── RightToeBase (Ball_R)
```

### 3.2 Rigging & Orientation Rules
1. **Coordinate System & Forward Axis:**  
   - The character **MUST face -Z** in neutral pose (glTF 2.0 forward convention: -Z is forward, +Y is up, +X is character's left / stage right).
   - Character root position must sit cleanly at `(0, 0, 0)`.
   - The soles of both sneakers must sit exactly at `Y = 0.000` (ground contact line) in the rest pose.
2. **Joint Rotation Limits & Local Axes:**  
   - Bone primary axis must align along the length of the bone (+Y or +X consistent across all limbs).
   - Zero out rotation values on the rest pose (`rotation = [0, 0, 0, 1]` in quaternion or zero Euler).
3. **Skin Weights:**  
   - Maximum **4 vertex weights per vertex** (standard glTF `JOINTS_0` and `WEIGHTS_0` Vec4 attributes).
   - No non-zero weights on unassigned bones.
   - Smooth gradient weighting across joints (knees, elbows, pelvis, shoulders) to prevent mesh collapsing or volume pinching during 90° bends.
   - Rigid weighting on accessories (buckles, spray cans, snapback visor, buttons) to avoid jelly-like warping.

---

## 4. Facial Expression Controls & Morph Targets (Blendshapes)

To support expressive character reactions in the subway lobby, start line intro, high-speed runs, near-misses, and defeat screens, models must feature facial blendshapes.

### Required Blendshape Targets
| Blendshape Name | Category | Description | Visual Target |
| :--- | :--- | :--- | :--- |
| `eyeBlinkLeft` | Eyes | Left eyelid complete closure. | Natural eyelid crease, no sclera showing. |
| `eyeBlinkRight` | Eyes | Right eyelid complete closure. | Natural eyelid crease, no sclera showing. |
| `eyeSquintLeft` | Eyes | Lower lid elevation, cheek raise. | Athletic sprint concentration. |
| `eyeSquintRight` | Eyes | Lower lid elevation, cheek raise. | Athletic sprint concentration. |
| `browDownLeft` | Brows | Inner and mid brow lowered toward bridge. | Fierce determination, intense focus. |
| `browDownRight` | Brows | Inner and mid brow lowered toward bridge. | Fierce determination, intense focus. |
| `browInnerUp` | Brows | Both inner brows raised center. | Surprised / near-miss startle reaction. |
| `mouthSmile` | Mouth | Bilateral lip corner pull and elevation. | Confident victory smirk. |
| `mouthSmirkLeft` | Mouth | Left corner pull with slight sneer. | Jax signature confident street smirk. |
| `mouthOpen` | Mouth | Jaw drop + lip parting. | Panting during sprint / shock during crash. |
| `mouthGasp` | Mouth | O-shaped open mouth. | High-speed wind-rush / obstacle surprise. |
| `cheekPuff` | Cheeks | Subtle cheek expansion. | Exertion breath release. |

---

## 5. Required Animation Clips & Delivery Specifications

All animation clips must be baked into the `.glb` container with consistent bone track naming matching the hierarchy above.

### 5.1 Root Motion Policy
- **Engine Authority Invariant:** Physical player movement across lanes, jumps, and world Z-translation is strictly governed by `Player.ts` and `CharacterModel.ts`.
- **In-Place Animations:** All running, jumping, sliding, and falling clips must be animated **IN-PLACE** with the Root bone stationary at `(0, 0, 0)`.
- The `Hips` bone may carry vertical bobbing, yaw counter-twist, and roll, but its ground projection must center on `(0, 0, 0)`.

### 5.2 Complete Animation Clip Matrix
| Clip Name | Duration (s) | Loop Mode | Description / Keyframe Cues |
| :--- | :--- | :--- | :--- |
| `idle_lobby` | 2.50s | Loop | Confident standing stance, weight shift between feet, sneaker tap, hand on hip/strap. |
| `intro_start` | 2.40s | Once | Knuckle crack, visor pull, adjustment of spray can holster, explosive sprint launch into run. |
| `run_sprint` | 0.60s – 0.80s | Loop | Full athletic sprint cycle (12–30 Hz cadence scaling). Contralateral arm drive, 14° torso lean. |
| `run_rooftop` | 0.60s – 0.80s | Loop | Hunched sprint posture, lower center of gravity, wind resistance response. |
| `jump_takeoff`| 0.08s | Once | Explosive crouch spring, arms sweeping back then forward, ankle plantarflexion. |
| `jump_ascend` | 0.22s | Once | High lead knee tuck, chest proud, eyes locked forward. |
| `jump_apex`   | 0.10s | Once | Weightless floating crest, arms flared for balance, knees tucked. |
| `jump_descend`| 0.20s | Once | Legs extending downward to absorb impact, toes pointed down slightly, gaze on ground. |
| `jump_land`   | 0.15s | Once | Two-stage impact absorption (40% squash down, 60% spring rebound into sprint). |
| `slide_entry` | 0.10s | Once | Rapid drop to deck, lead leg extended forward, trailing leg tucked under hip. |
| `slide_loop`  | 0.50s | Loop | Aerodynamic low ground skim, trailing hand skimming deck, head up watching ahead. |
| `slide_exit`  | 0.12s | Once | Spring push-off from deck back into upright sprint stride. |
| `fast_drop`   | 0.25s | Once | Aerodynamic dive posture, streamlined limbs, head tilted forward. |
| `stumble`     | 0.40s | Once | Forward torso jolt, arm windmill recovery, stutter step without stopping forward momentum. |
| `crash_defeat`| 1.20s | Once | Backward recoil on obstacle impact, ragdoll-style drop to deck, defeat rest pose. |
| `victory_pose`| 2.00s | Loop | Spray paint flourish, air tag flourish, confident thumbs up / peace sign to camera. |
| `hoverboard_ride` | 0.80s | Loop | Surfing stance, angled 35° laterally, knees bent absorbing board float oscillation. |
| `jetpack_fly` | 1.00s | Loop | Superman forward flight angle, dual hands gripping flight thruster toggles. |

---

## 6. Materials, Shading & UV Layout

### 6.1 PBR Material Response (glTF PBR Metallic Roughness)
- **Skin:** Stylized non-photorealistic subsurface scattering simulation via warm albedo undertones, roughness `0.55 – 0.62`, metalness `0.00 – 0.02`.
- **Fabrics (Hoodie/Cotton/Khadi):** Matte diffuse micro-texture, roughness `0.65 – 0.80`, metalness `0.00 – 0.05`.
- **Technical Fabrics (Nylon/Windbreaker):** Crisp sheen highlight, roughness `0.35 – 0.45`, metalness `0.10 – 0.20`.
- **Metals & Buckles (Spray cans, aglets, buttons, zippers):** High polish, roughness `0.15 – 0.25`, metalness `0.85 – 0.95`.
- **Sneaker Outsoles (Vulcanized rubber):** Roughness `0.28 – 0.35`, metalness `0.02 – 0.05`.
- **Goggles & Visors:** Separate sub-mesh with alpha blending (`roughness: 0.08`, `metalness: 0.90`, `transmission: 0.85` or emissive glow).

### 6.2 UV Layout & Texture Packing
1. **Single UV Map (UV0):** 0 to 1 UV space only. No overlapping islands except for perfectly symmetrical mirrored limbs where texture resolution savings are necessary (inner arms, shoe soles).
2. **Texel Density:** Uniform 512 px/meter texel density across body and clothing. Head and face allocated 1.5x texel density for high-contrast eye and smirk readability.
3. **Texture Channel Packing:**
   - **Texture 1 (Albedo / BaseColor):** RGB (sRGB color space) + optional Alpha in A.
   - **Texture 2 (Normal Map):** RGB (Linear), Tangent Space Normal (OpenGL convention: +X Right, +Y Up, +Z Forward).
   - **Texture 3 (ORM Packed):** RGB (Linear):
     - **R Channel:** Ambient Occlusion (Cavity & contact shadows)
     - **G Channel:** Roughness (0.0 = mirror, 1.0 = matte)
     - **B Channel:** Metalness (0.0 = dielectric, 1.0 = metal)
   - **Texture 4 (Emissive - Optional):** RGB (sRGB) for cyber piping, glowing runes, or arc reactor cores.

---

## 7. Model Validation & Quality Acceptance Criteria

Every incoming `.glb` asset must pass automated and visual verification before ingestion into `public/characters/`:

1. **glTF Validator Zero-Error Pass:**
   - Must validate cleanly via `gltf-validator` with **0 errors and 0 warnings**.
   - No unused nodes, empty animations, or unnormalized quaternion tracks.
2. **Scale & Dimension Check:**
   - Jax: Total height from sole of shoe to top of cap crown = **1.78 meters** (±0.02m).
   - Luna: Total height = **1.72 meters**.
   - Cruz: Total height = **1.82 meters**.
   - Nova: Total height = **1.76 meters**.
3. **Collision Box Compatibility:**
   - Model must fit snugly within the authoritative gameplay bounding cylinder:
     - Radius: **0.35m**
     - Upright Height: **1.85m**
     - Sliding Height: **0.75m**
   - No mesh elements (horns, wings, oversized weapons) may protrude outside the lateral 0.70m corridor width.
4. **Lighting & Contrast Test:**
   - Must remain legible across all 8 Metro Runner environments (Underground Metro, Abyssal Glassline, Cyber Tokyo, Midnight Velvet, Inferno Express, Jurassic Rush, Mitron Express, Chrono Kingdom).
   - Silhouette must pass the 3-second black-and-white recognition test at 15 meters camera distance.

---

## 8. Licensing & Source Asset Compliance

- All geometry, textures, and animations must be 100% original work created specifically for Metro Runner 3D.
- No copyrighted third-party meshes, scanned commercial sneakers, or proprietary character designs (e.g. Jake/Tricky from Subway Surfers, Sonic, Spider-Man) may be used.
- Textures must not use uncredited copyrighted photos or watermarked stock assets.
- Deliverables must include source `.blend` or `.fbx` files alongside the final exported `.glb` files.

