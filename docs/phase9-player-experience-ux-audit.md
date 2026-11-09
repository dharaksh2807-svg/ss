# METRO RUNNER 3D — PHASE 9: HEURISTIC UX AUDIT & HUMAN PLAYTEST PLAN

**Author:** Lead UX Director & Interaction Design Specialist  
**Methodology:** Nielsen-Norman Heuristic Evaluation + Structured Task-Based Usability Protocol  
**Repository Baseline:** `2c6fe5f` (Phase 8 Main)  
**Evaluated Artifacts:** Captured WebGL run telemetry and Playwright desktop/mobile visual captures (`artifacts/phase9/`)  

---

## 1. Executive Summary

Metro Runner 3D was audited across all 11 stages of the first-time player experience on desktop and mobile viewports. The audit examined information hierarchy, hazard readability, cognitive load, audio feedback, recovery speed, and long-term replay incentives.

### Core Strengths Identified:
1. **Immediate Playability:** The central "PLAY NOW" primary CTA is visually dominant and allows a new player to begin running within 1 click of loading the application.
2. **Crash Transparency:** The "CRASH ANALYSIS" card on the game over screen explicitly diagnoses the fatal hazard (e.g., "Tripped over a low railway barrier without jumping") and provides a direct, actionable recovery tip ("Swipe UP or press Spacebar / W to jump cleanly").
3. **Restrained In-Game HUD:** The central running lane remains completely clear of UI clutter. Score, coins, distance, multiplier, and active power-ups are anchored along the upper margins and corners.
4. **Instant Restart Loop:** The game over screen provides a prominent "PLAY AGAIN" button with keyboard shortcut `<R>` and instant replay capability without reload delays.

### High-Priority UX Defects Identified & Corrected:
1. **Game Over Card Header Clipping (Resolved):** In previous builds, the Game Over modal card was centered via flexbox while calling `retryBtn.focus()` without `preventScroll: true`. This caused the card to scroll to the bottom, cutting off the "RUN COMPLETED!" header and character showcase card. *Fix:* Enforced `{ preventScroll: true }` on focus, reset `scrollTop = 0`, and anchored the modal overlay with `overflow-y: auto`.
2. **Mobile Start Screen Vertical Grid Thrash (Resolved):** On mobile portrait viewports ($\le 600\text{px}$), the top bar was rendering in 3 stacked grid rows, pushing the profile pill and currency badges directly down into the 3D runner's head. *Fix:* Restructured mobile layout into a compact 2-tier header: logo centered on row 1, profile pill and resources horizontally grouped on row 2.
3. **Visual Hazard Cue Central Occlusion (Resolved):** Non-audio visual hazard alert cues were positioned at `top: 14%`, overlapping the horizon and oncoming train sightlines. *Fix:* Moved `.hud-hazard-cue` to `top: calc(var(--ui-top) + 8px)`, preserving 100% of the active running track sightline.
4. **Missing UI Tactile Audio Feedback (Resolved):** While `SoundManager` contained a dedicated high-frequency pop synthesizer (`playButtonClick`), `EVENTS.UI_CLICK` was never emitted by buttons or navigation. *Fix:* Implemented a delegated click listener on `#ui-overlay` in `NavigationCoordinator` to trigger tactile acoustic feedback on all buttons, tabs, segmented selectors, and dock actions.
5. **Lingering Ambient Train Rumble on Game Over (Resolved):** Sub-bass train rail rumble was not silenced on `EVENTS.GAME_OVER`. *Fix:* Added explicit `trainRumbleGain` zeroing and footstep timer reset on game over.

---

## 2. 11-Stage Gameplay Flow Heuristic Evaluation

### Stage 1: Initial Game Load
- **Evaluation:** Game loads in under 2 seconds. Canvas and audio context initialize without blocking. Web Audio autoplay policies are handled via transparent first-interaction listeners (`pointerdown`, `keydown`, `touchstart`).
- **Heuristic:** *Visibility of System Status (Pass)*. The initial 3D station backdrop renders immediately with warm lighting and the character idle animation.

### Stage 2: First Visible Menu (Start Screen)
- **Evaluation:** High-contrast pink/red "PLAY NOW" button with pulsing shimmer stands out from the dark blue/cyan background. Desktop keyboard control guide (`[A][D] Lane · [W] Jump · [S] Slide · [Space] Board`) is displayed directly beneath the play button.
- **Heuristic:** *Recognition Rather than Recall (Pass)*. Controls are shown in context rather than buried in a settings menu.

### Stage 3: Character & World Selection
- **Evaluation:** Dedicated modals for Runners (`CharacterSelectModal`) and Railway Districts (`EnvironmentSelectModal`) feature large, readable cards, 3D turntable previews, and clear "EQUIP" / "EQUIPPED" state indicators.
- **Heuristic:** *Consistency & Standards (Pass)*. Standard "← Back" and "Home" navigation allows frictionless return to the main lobby without data loss.

### Stage 4: Start Run
- **Evaluation:** Clicking "PLAY NOW" smoothly transitions the camera from the station platform into rear-chase perspective. The runner begins moving at a comfortable initial speed (19 m/s on Normal, 15 m/s on Beginner).
- **Heuristic:** *User Control & Freedom (Pass)*. The player has immediate lateral steering from frame 0.

### Stage 5: First Lane Change
- **Evaluation:** Lane switching is instantaneous with smooth biomechanical spine roll and lateral position interpolation. Audible sneaker scuff and gentle camera damping confirm the action.
- **Heuristic:** *Match Between System & Real World (Pass)*. Lateral momentum feels responsive without floating or snapping.

### Stage 6: First Jump and Slide
- **Evaluation:** Jump takeoff provides a rising elastic pitch sweep, while the slide produces a continuous gravel/ballast friction scrape. Fast-drop from mid-air gives immediate downward agency with aerodynamic particle feedback.
- **Heuristic:** *Flexibility & Efficiency of Use (Pass)*. Jump-to-slide and slide-to-jump transitions execute cleanly.

### Stage 7: First Train Encounter
- **Evaluation:** Approaching trains are preceded by a directional stereo locomotive air horn and an ambient rail rumble swell within 80m. The yellow ramp gantry provides an unambiguous visual cue for traversable rooftops.
- **Heuristic:** *Error Prevention (Pass)*. The player receives multi-sensory warnings well in advance of the required decision window.

### Stage 8: First Power-up Pickup
- **Evaluation:** Power-up pickup triggers an instant confirmation banner and adds a duration card with an animated progress fill bar and numerical countdown in the upper HUD margin. Expiring power-ups blink with warning amber ($< 3.5\text{s}$) and critical red ($< 1.8\text{s}$).
- **Heuristic:** *Visibility of System Status (Pass)*. Power-up state and expiration urgency are unambiguous.

### Stage 9: First Crash ("Save Me" vs. Game Over)
- **Evaluation:** On fatal collision, if the player owns keys, the "SAVE ME!" revive modal offers a 5-second countdown with cost clarity ("1 KEY • 3 OWNED") and a clear "END RUN & COLLECT" escape option. Declining revive opens the Game Over card instantly.
- **Heuristic:** *Help Users Recognize, Diagnose, and Recover from Errors (Pass)*. The fatal collision reason is displayed with an actionable gameplay tip.

### Stage 10: Retry Responsiveness
- **Evaluation:** The "PLAY AGAIN" button is bound to `<R>`, `<Space>`, and `<Enter>`. Clicking or pressing `<R>` instantly skips death animations, resets the run state, and launches the player back onto the rails in $< 50\text{ ms}$.
- **Heuristic:** *Flexibility & Efficiency of Use (Pass)*. Zero restart friction keeps the player in the "flow" state.

### Stage 11: Rewards and Progression
- **Evaluation:** Run rewards (coins collected, distance traveled, style points, completed missions) are tallied clearly. Daily challenges, 7-day calendars, and character upgrades offer predictable long-term replay value without predatory monetization.
- **Heuristic:** *Aesthetic & Minimalist Design (Pass)*. Currency earnings map 1:1 to visible arcade pickups.

---

## 3. Structured Human Usability Testing Plan

*(Note: In accordance with Gravitas Invariant 6, human participant data is not fabricated. This protocol provides the exact testing plan for external user studies).*

### 3.1 Participant Profile
- **Cohort Size:** 8–12 participants.
- **Experience Distribution:**
  - 4 Casual Mobile Runners (plays Subway Surfers, Temple Run).
  - 4 Core Desktop / Arcade Gamers.
  - 2 Accessibility-Focused Testers (prefers keyboard-only navigation or reduced sensory intensity).

### 3.2 Key Observable Tasks & Success Metrics

| Task # | Scenario / Goal | Success Metric | Target Completion Time |
| :--- | :--- | :--- | :--- |
| **Task 1** | Launch game and start first run from cold load | Starts run without reading external instructions | $< 10\text{ seconds}$ |
| **Task 2** | Successfully dodge first 3 obstacles (jump, slide, lane switch) | Navigates initial chunk without fatal crash | First attempt success |
| **Task 3** | Identify an active power-up and its remaining duration | Correctly states power-up type and remaining seconds | Instant recognition ($< 2\text{s}$) |
| **Task 4** | Recognize a fatal collision cause on the Game Over screen | Understands whether collision was a train body, hurdle, or barrier | 100% comprehension |
| **Task 5** | Execute an instant restart | Restarts run via "PLAY AGAIN" or `<R>` key | $< 3\text{ seconds}$ |
| **Task 6** | Change character and equipped hoverboard | Successfully equips a new runner and board | $< 20\text{ seconds}$ |
| **Task 7** | Toggle Reduced Motion and Reduced Audio Intensity | Enables accessibility settings in Settings modal | $< 15\text{ seconds}$ |

### 3.3 Post-Test Qualitative Debrief Questions
1. *Controls:* Did the character respond immediately to your inputs? Did you ever feel an action was dropped?
2. *Audio:* Were sound effects satisfying or fatiguing? Was the train horn helpful in warning you of oncoming traffic?
3. *Fairness:* When you crashed, did you understand why? Did you feel the death was your fault or the game's?
4. *Pacing:* Did the game feel too fast, too slow, or well-paced?
5. *Replay Motivation:* Did the score breakdown and missions make you want to try one more run?

