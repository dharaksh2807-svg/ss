# METRO RUNNER 3D — AUDIO DIRECTION & SOUND ASSET PRODUCTION BRIEF

**Version:** 1.0 (Phase 9 Release Standard)  
**Author:** Lead Sound Designer & Audio Gameplay Engineer  
**Target Engine:** Web Audio API & Modern Browser HTML5 Audio  
**Licensing & Source Status:** Original procedural sound architecture synthesized in real-time via Web Audio API (`src/audio/SoundManager.ts`). All procedural synthesizers, musical arpeggios, and ambient loops are custom mathematical models designed specifically for Metro Runner 3D without external copyrighted sample libraries or proprietary Subway Surfers audio files.

---

## 1. Technical Audio Specifications

For studio-recorded foley replacements or future pre-rendered audio asset drops:
- **Master Recording Standard:** 48.0 kHz / 24-bit Linear PCM (Broadcast WAV).
- **Runtime Distribution Format:** WebM / OGG Vorbis (160 kbps VBR) + AAC / M4A (160 kbps VBR fallback).
- **Master Target Loudness:** -14 LUFS integrated ($\pm 1.0$ LUFS), -1.0 dBFS True Peak ceiling.
- **Dynamic Range (SFX):** Maximum crest factor 12 dB; all explosive transients compressed via central `DynamicsCompressorNode`.
- **Sensory Accessibility (Reduced Intensity Mode):** Automatic low-pass cutoff at 4,200 Hz with compressor threshold lowered to -24 dB and ratio increased to 6:1 to prevent sensory overload for sound-sensitive players.

---

## 2. Audio Systems & Sound Cue Specifications

### 2.1 Locomotion, Cadence & Footsteps
Footstep audio is synchronized frame-by-frame with character stride cadence in `CharacterModel.ts`:
$$\text{cadence} = \min\left(32.0,\, 12.0 + \frac{v}{\text{MAX\_SPEED}} \times 16.0\right) \text{ rad/s}$$
$$\text{stepInterval} = \frac{\pi}{\text{cadence}}$$

- **Ground Ballast (`GROUND`):**
  - Acoustic Profile: Ballast gravel dampened thump combined with subtle textured crunch.
  - Frequency Envelope: Triangle oscillator descending from 85 Hz to 38 Hz in 60 ms; pink noise texture burst (35 ms).
  - Stereo / Pitch Variance: $\pm 2.5\%$ alternating left/right stride pitch alternation.
- **Train Roof Deck (`TRAIN_ROOF`):**
  - Acoustic Profile: Hollow corrugated steel plate footstep.
  - Frequency Envelope: Fundamental triangle at 190 Hz ramping to 110 Hz in 50 ms; sine overtone at 620 Hz decaying to 320 Hz in 40 ms.
- **Ramp Incline (`RAMP`):**
  - Acoustic Profile: Textured wooden/sheet-steel traction footstep.
  - Frequency Envelope: Triangle oscillator sweeping 115 Hz to 55 Hz in 50 ms.

### 2.2 Jump, Fast-Drop & Landings
- **Jump Takeoff (`EVENTS.JUMP`):**
  - Acoustic Profile: Elastic upward leap swoosh with sneaker sole push-off.
  - Frequency Envelope: Sine sweep 300 Hz $\to$ 650 Hz in 140 ms; secondary harmonic sub-bass at 90 Hz decaying in 80 ms.
- **Slide & Friction (`EVENTS.SLIDE`):**
  - Acoustic Profile: Continuous friction scrape across ground/ballast.
  - Implementation: Bandpass-filtered noise buffer (1,800 Hz center, Q = 2.0) with slight pitch modulation, terminating cleanly on slide completion.
- **Fast Drop (`EVENTS.FAST_DROP`):**
  - Acoustic Profile: Downward aerodynamic slipstream rushing sound.
  - Frequency Envelope: Bandpass noise downward sweep 3,200 Hz $\to$ 600 Hz in 180 ms.
- **Touchdown (`EVENTS.LAND`):**
  - Ground Landing: Damped low-end thump, 110 Hz $\to$ 40 Hz (0.13s). Fast drop amplifies peak to 150 Hz $\to$ 30 Hz (0.19s).
  - Rooftop Landing: High-energy resonant metallic ping (540 Hz sine, 160 Hz triangle) with 0.18s ring-out.

### 2.3 Environmental & Hazard Audio
- **Locomotive Warning Horn (`EVENTS.TRAIN_HORN`):**
  - Acoustic Profile: Dual-tone brass pneumatic locomotive air horn.
  - Frequencies: $311.13\text{ Hz} \times \text{Doppler}$ + $233.08\text{ Hz} \times \text{Doppler}$.
  - Spatial Audio: `StereoPannerNode` positioned according to track lane ($X = -3.5\text{m} \to -0.85$, $X = 0\text{m} \to 0.0$, $X = +3.5\text{m} \to +0.85$).
  - Prioritization & Rate-Limiting: Minimum 1.4s cooldown enforced between horns to prevent deafening concurrent horn triggers.
- **Ambient Rail Rumble:**
  - Continuous sub-bass rail vibration smoothly swelling when an oncoming train approaches within 80m.
  - Frequency: 50 Hz sawtooth through a 155 Hz lowpass filter.
  - Clean Lifecycle: Automatically silenced on `EVENTS.GAME_OVER`, `EVENTS.GAME_PAUSE`, and `EVENTS.GO_TO_LOBBY`.
- **Near-Miss Whoosh (`EVENTS.NEAR_MISS`):**
  - High-speed aerodynamic displacement as the runner grazes a moving train hull.
  - Frequency: 600 Hz $\to$ 280 Hz sine sweep in 150 ms.
- **Crash & Collision (`EVENTS.CRASH`):**
  - Heavy impact crunch (triangle oscillator 160 Hz $\to$ 25 Hz) layered with transient noise burst (0.35s duration).
- **Hoverboard Shield Shatter (`EVENTS.HOVERBOARD_BROKEN`):**
  - Crystalline glass/forcefield collapse (1,800 Hz down-sweep layered with sub-rumble), followed by immediate termination of the hoverboard turbine loop.

### 2.4 Collectibles & Progression Feedback
- **Coin Pickup (`EVENTS.COIN_COLLECTED`):**
  - Ascending pentatonic melody: C5 (523 Hz), D5 (587 Hz), E5 (659 Hz), G5 (784 Hz), A5 (880 Hz), C6 (1046 Hz), D6 (1175 Hz), E6 (1318 Hz), G6 (1568 Hz), A6 (1760 Hz), C7 (2093 Hz).
  - Anti-Clipping Rate Limiter: Enforces a minimum 25 ms interval between coin triggers, preventing distortion when the Coin Magnet pulls 10+ coins in a single frame.
  - Dynamic Gain Attenuation: Gain scales by $0.92^n$ during bursts to prevent mix saturation.
- **Tactile UI Button Pop (`EVENTS.UI_CLICK`):**
  - Ultra-clean, non-fatiguing high-frequency click (1,200 Hz $\to$ 600 Hz in 15 ms).
  - Connected via delegated listener on `#ui-overlay` to all buttons, tabs, segmented selectors, and dock actions.
- **Mission & Achievement Fanfares:**
  - Mission Complete: Brass major arpeggio fanfare (C4-E4-G4-C5).
  - Achievement Unlock: Royal trumpet shimmer with stereo sparkle.

### 2.5 Adaptive Soundtrack & Speed Hysteresis
Metro Runner features a 6-stem adaptive musical engine:
1. `LOBBY`: Ambient chill groove with electric piano and soft pulse.
2. `RUNNING_NORMAL`: Upbeat 128 BPM electronic run beat with driving bassline ($v < 18\text{ m/s}$).
3. `RUNNING_FAST`: Elevated percussion and synth arpeggios ($18\text{ m/s} \le v < 24\text{ m/s}$).
4. `RUNNING_INTENSE`: High-octane breakbeat with syncopated stabs ($v \ge 24\text{ m/s}$).
5. `JETPACK`: Skyward ethereal synth pad with floating bass.
6. `GAME_OVER`: Melancholic descending resolution phrase.

**Hysteresis Windows (Prevents Rapid Audio Churn at Speed Thresholds):**
- Fast Mode: Promotes at $18.0\text{ m/s}$; demotes at $16.0\text{ m/s}$.
- Intense Mode: Promotes at $24.0\text{ m/s}$; demotes at $21.5\text{ m/s}$.

---

## 3. Autoplay & Browser Compliance

- **Autoplay Handling:** Modern browsers block `AudioContext` until user interaction. `setupAutoplayUnlocking()` registers passive listeners on `pointerdown`, `click`, `keydown`, and `touchstart`. Any first interaction unlocks the context smoothly without errors or console warnings.
- **Mute & Volume Persistence:** `masterVolume`, `musicVolume`, `sfxVolume`, `isMuted`, and `reducedIntensity` are saved to `localStorage` under `metro_audio_*` keys and synchronized across sessions.

