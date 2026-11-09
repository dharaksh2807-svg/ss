# Metro Runner 3D — Character Visual Bible & Style Guide

## 1. Vision & Core Philosophy

Metro Runner 3D is defined by high-energy, athletic, street-smart urban exploration. The character presentation balances stylized proportions with tangible physical weight, clean material readability, and expressive silhouettes that remain distinct even at fast speeds and on mobile displays.

The art style is **Stylized Kinetic Realism**:
- **Stylized Anatomy**: Exaggerated athletic silhouettes with bold geometric planes, readable from 100 meters down a curved subway tunnel.
- **Kinetic Energy**: Characters are always poised, grounded, and dynamically responsive to forward velocity, gravity, and momentum.
- **Tangible Materials**: Physically-based rendering (PBR) surfaces with distinct roughness/metalness contrast (matte twill, athletic nylon, brushed aluminum, glossy polycarbonate visors, and vulcanized sneaker rubber).
- **Original IP Identity**: Distinct Metro Runner universe featuring Jax (The Street Legend), Luna (Cyber-Explorer), Cruz (Power Parkour), and Nova (Aero-Speedrunner).

---

## 2. Proportions & Stylized Anatomy

Characters adhere to a cohesive 6.5-head stylized heroic proportion scale:

| Anatomical Landmark | Proportion Ratio | Metro Scale (m) | Design Purpose |
|---|:---:|:---:|---|
| **Total Height** | 1.00 | ~1.88m – 1.95m | Authoritative physical world clearance (fits 2.2m barriers) |
| **Head (Cranial to Chin)** | 0.155 | ~0.29m | Enlarged by 15% for clear expression and silhouette readability |
| **Shoulder Span** | 0.28 | ~0.54m | Broad, athletic taper leading into a narrowed waist |
| **Torso (Neck to Hip)** | 0.26 | ~0.50m | Compact athletic core; allows clear torso counter-twist and banking |
| **Leg Length (Hip to Sole)**| 0.44 | ~0.84m | Lengthened limbs emphasizing sprint stride and jump arcs |
| **Foot / Sneaker Size** | 0.21 | ~0.40m | Exaggerated by 20% to anchor ground contact and telegraph steps |

### Key Anatomy Invariants
1. **Low Center of Gravity**: Hip pivot is stationed at ~0.95m, establishing a solid anchor for ballistic jump takeoff, landing absorption, and slide transitions.
2. **Triangular Torso Taper**: Broad shoulders narrowing to a compact waist (1.4:1 ratio) prevents visual muddiness when viewed directly from behind (the primary gameplay camera angle).
3. **No Stick Limbs**: Limbs feature pronounced anatomical massing—sculpted deltoids, tapering biceps, muscular calves, and flared high-tops.

---

## 3. Facial Form & Mobile-Distance Readability

Because 95% of gameplay occurs from behind the character, facial readability is crucial during:
- Character Selection & Shop Showroom (front 3/4 turntable view)
- 3D Photo Studio / Customizer
- Cinematic Intro Orbital Cam
- Crash / Game-Over Frontal Reveal

### Facial Structure Standards
- **Chiseled Planes**: Sharp jawline and tapered chin that catch directional sunlight and subway track floodlights without flat shading.
- **Eye Construction (High-Contrast Layering)**:
  - Sclera (White base): Crisp eggshell (`0xffffff`) with slight front projection.
  - Iris: Vibrant character-specific color ring (`#0284c7` for Jax, `#ec4899` for Luna, `#10b981` for Cruz).
  - Pupil: Deep black center (`0x0a0a0a`).
  - Specular Glint: White offset highlight point fixed in the upper-outer quadrant to simulate dynamic catchlights even in dark tunnels.
- **Brow Expression**:
  - Confident, determined athletic focus: Medial brow angled slightly downward (8–12°), conveying intensity without anger.
- **Mouth & Smile**:
  - Sculpted energetic smirk with dimensional depth, visible from both front and 3/4 profiles.

---

## 4. Silhouette Design & The 3-Second Read Test

Every character must be instantly identifiable by their silhouette alone in black-and-white within 0.1 seconds:

```
    [JAX]                 [LUNA]                [CRUZ]                [NOVA]
  Backward Cap          Dual Cyber            Afro-Fade             Sleek Aero
 + Street Goggles        Ponytails           + Headband             Full Helmet
      \                     \                    \                     \
     (o)                   (oo)                 (@@)                  (==)
    / | \                 / | \                / || \                / | \
   |  |  |               |  |  |              |  ||  |              |  |  |
   Dual Cans            Data Antenna         Boombox Pack          Turbines
    /   \                 /   \                /    \                /   \
  High-Tops             Platform             Track Pants            Boots
```

1. **Jax (`char_jax`)**:
   - Iconic backward baseball cap with dimensional snapback strap and brim pointing +Z.
   - Angled street goggles resting on the cap brim.
   - Padded street runner backpack with two metallic spray paint canisters (Cyan & Magenta) in side holsters.
2. **Luna (`char_luna`)**:
   - Twin high-mounted cyber ponytails that sway with physics.
   - Tinted semi-translucent visor across upper face.
   - Cropped hoodie over high-waist tech shorts and data-deck pack with antenna.
3. **Cruz (`char_cruz`)**:
   - Sculpted afro-fade silhouette with wrapped athletic headband.
   - Sleeveless open vest revealing muscular deltoids.
   - Boombox backpack with dual chrome speaker cones and striped track pants.
4. **Nova (`char_nova`)**:
   - High-gloss aerodynamic racing helmet with integrated visor.
   - Sculpted shoulder pauldrons and chest arc reactor.
   - Twin micro-turbine propulsion pack and photon-boot soles.

---

## 5. Clothing Shape & Material Response (PBR Standard)

All characters use calibrated Three.js `MeshStandardMaterial` parameters to ensure consistent surface response across all 17 Metro Runner game worlds:

| Garment / Element | Roughness | Metalness | Visual Response |
|---|:---:|:---:|---|
| **Skin (Stylized)** | 0.58 | 0.02 | Soft velvet falloff; avoids greasy/specular plastic look |
| **Primary Fabric (Cotton/Hoodie)** | 0.44 | 0.08 | Readable texture grain; catches soft skylight |
| **Secondary Trim / Nylon** | 0.38 | 0.18 | Subtle sheen on zippers, stripes, and pocket flaps |
| **Denim / Cargo Pants** | 0.68 | 0.05 | High matte roughness to keep lower body grounded |
| **Goggles / Visors / Helmets** | 0.18 | 0.85 | High specular reflections catching train headlights and street lamps |
| **Sneaker Outsoles** | 0.30 | 0.04 | Durable vulcanized rubber appearance with crisp white/accent sidewalls |
| **Backpack Metal Hardware** | 0.22 | 0.88 | Metallic buckles, spray can cylinders, and chrome rings |

---

## 6. Hand & Foot Articulation Standards

### The Sprint Fist
- **No Flat Hand Plates**: Characters must never have flat rectangular hand slabs or featureless spheres.
- **Curved Knuckle Cylinder**: 4-finger grouped grip cylinder angled into an athletic sprint fist.
- **Tucked Thumb**: Anatomic thumb volume resting over the index finger, forming a natural running hand posture that rotates smoothly during the arm pump.

### High-Top Sneaker Construction
- **Dual-Density Outsole**: Thick vulcanized rubber midsole with contrasting tread edge.
- **Toe-Spring Rocker**: Subtle upward toe curve (6–8°) allowing natural rolling off the ground during stride push-off.
- **Sculpted Ankle Collar & Heel Tab**: Distinct collar cuff separating the calf from the shoe, with a rear pull tab catching top-down rim light.
- **Laces & Tongue**: High-relief tongue geometry with cross-lace ridges, eliminating flat decal appearance.

---

## 7. Locomotion & Acting Standards

1. **Athletic Sprint**:
   - Cadence scales with speed ($f = \text{speed} \times k$).
   - Spine leans forward into velocity (0.12 rad at 18 m/s up to 0.26 rad at 52 m/s).
   - Reciprocal arm drive: elbows remain flexed at ~90°, driving backward with power.
   - Pelvis counter-rotation (yaw & roll) absorbs leg thrust.
2. **Ballistic Jump**:
   - **Takeoff (0.00–0.06s)**: Compression crouch into explosive vertical extension.
   - **Ascending (0.06–0.25s)**: Knees flex forward, arms drive upward for lift.
   - **Apex (0.25–0.35s)**: Controlled suspension float with level head gaze.
   - **Descending (0.35–0.55s)**: Limbs extend downward in preparation for contact.
   - **Landing (0.55–0.70s)**: Ankle and knee impact absorption dip (-0.05m pelvis compression).
3. **Slide**:
   - Instant drop into low-silhouette athletic tuck (height drops to 0.75m).
   - Leading foot extends forward, trailing leg folded under hip.
   - Torso hunched with stabilizing hand skimming the track.
4. **Lane Banking**:
   - Smooth cosine banking into the turn (up to 0.22 rad).
   - Head remains stabilized upright to keep player horizon locked.

---

## 8. Environmental Separation & Contrast Guidelines

Characters must pop with sharp visual contrast in every lighting condition:

1. **Dark Subways (Underground Metro, Haunted Carnival)**:
   - High-luminance accents (goggles, sneaker soles, logos) utilize subtle emissive glow (`emissiveIntensity: 0.15–0.30`).
   - Dynamic contact shadow (`#05070a` opacity 0.55) grounds character against dark rail ties.
2. **High-Key Sunlight (Modern Metro, Viva Heat)**:
   - Deep shadow falloff on underside of visor/cap, chin, and armpits prevents character from washing out into the bright track ballast.
3. **Neon Cyber Environments (Neon Rainline, Phantom Line)**:
   - Primary garments use saturated matte tones that absorb neon ambient light cleanly without mirror reflections.

