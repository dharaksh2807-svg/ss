# METRO RUNNER 3D — UI ARCHITECTURE HANDOFF

## Latest completion — Task 8 (2026-11-04)

Universal keyboard/touch/standard-gamepad input, portrait framing, lifecycle pause/resume, and context recovery are implemented. See [Task 8 verification and controls](TASK8_INPUT_VERIFICATION.md) for mappings, executed tests, limitations, and the bounded scope. InputManager owns device adaptation and board buttons; Player still owns all movement. Game owns lifecycle interruption handling. NavigationCoordinator already owns Escape; the older findings below describe the earlier UI audit and are not a current bug list. No procedural generation or collision behavior changed. Physical mobile hardware, Safari, controllers, and native consoles were not certified.


## 1. Relevant File Paths & Responsibilities
- `src/ui/StartScreen.ts`: Renders lobby HTML, binds top/side/bottom buttons, displays active runner/board/world, updates UI on events.
- `src/ui/ShopModal.ts`: Store interface handling 6 categories (`FEATURED`, `UPGRADES`, `BOOSTERS`, `CHARACTERS`, `HOVERBOARDS`, `WORLDS`).
- `src/ui/CharacterSelectModal.ts`: 3D character preview, outfit selector, running style toggle, equip/buy action buttons.
- `src/ui/HoverboardSelectModal.ts`: 3D hoverboard turntable, board stats/abilities, equip/buy/charge actions.
- `src/ui/EnvironmentSelectModal.ts`: District/theme selection (Dynamic vs static worlds), theme activation.
- `src/ui/MissionsModal.ts`: Multi-tab mission tracking (`MISSIONS`, `DAILY`, `ACHIEVEMENTS`, `SEASON`).
- `src/ui/PauseModal.ts`: Mid-game pause overlay (Resume, Photo Mode, Restart, Audio, Home).
- `src/ui/GameOverModal.ts`: Post-run score display, retry, menu, direct links to store/characters/missions.
- `src/core/Game.ts`: Game lifecycle coordinator (`MENU`, `PLAYING`, `PAUSED`, `GAMEOVER`); `goToMenu()` resets 3D camera/player and calls `StartScreen.show()`.
- `src/core/EventBus.ts`: Central pub/sub event bus decoupling UI modals from gameplay engine.
- `src/progression/ProgressionManager.ts`: Durable state store for characters, outfits, boards, themes, and game modes.
- `src/player/UpgradeManager.ts`: Economy wallet manager (coins, keys, hoverboard charges, upgrade levels).
- `src/style.css`: 10,700+ line stylesheet containing design tokens, glassmorphism card rules, modal overlays, and typography.
- `index.html`: Base DOM layout defining `#game-canvas` and `#ui-overlay` modal host hierarchy.

## 2. Key Classes, Methods & Navigation Events
- **Modal Display Interface**:
  - `show(fromScreen? / category?)`: Shows modal DOM, starts 3D preview loop if applicable, focuses element.
  - `hide(reopenPrevious?: boolean)`: Adds `.hidden`, cancels animation frames, attempts to reopen previous screen.
  - `StartScreen.updateState()`: Reads managers and updates all visible labels/badges.
  - `Game.goToMenu()`: Resets engine state and returns to StartScreen.
- **Inbound Modal Open Events** (`EventBus`):
  - `'OPEN_CHARACTERS'`, `'OPEN_BOARDS'`, `'OPEN_ENVIRONMENT_SELECT'`, `'OPEN_SHOP'`, `'OPEN_MISSIONS'`, `'OPEN_DAILY_REWARDS'`, `'OPEN_EVENTS'`, `'OPEN_PROFILE'`, `'OPEN_SETTINGS'`, `'OPEN_PRACTICE'`.
- **Lifecycle Events**:
  - `'GO_TO_MENU'`, `EVENTS.GAME_PAUSE`, `EVENTS.GAME_RESUME`, `EVENTS.GAME_RESTART`.
- **State Synchronization Events**:
  - `'CHARACTER_EQUIPPED'`, `'BOARD_EQUIPPED'`, `'ENVIRONMENT_PREFERENCE_CHANGED'`, `'ENVIRONMENT_CHANGED'`, `'WALLET_UPDATED'`, `EVENTS.KEYS_UPDATED`, `'BOARD_CHARGES_UPDATED'`, `'DAILY_REWARD_CLAIMED'`.

## 3. Runner, Board & World Ownership & Equipping
- **Runners (`ProgressionManager` & `CharacterCatalog`)**:
  - Unlocked list: `state.unlockedCharacters: string[]`. Check via `isCharacterUnlocked(charId)`.
  - Purchase: `purchaseCharacter(charId)` deducts coins/keys via `UpgradeManager`, appends to state, and persists.
  - Equip: `equipCharacter(charId, outfitId?)` updates `state.selectedCharacter` / `selectedOutfit` and emits `'CHARACTER_EQUIPPED'`.
- **Boards (`ProgressionManager` & `HoverboardCatalog`)**:
  - Unlocked list: `state.unlockedBoards: string[]`. Check via `isBoardUnlocked(boardId)`.
  - Purchase: `purchaseBoard(boardId)` validates funds, unlocks, and persists.
  - Equip: `equipBoard(boardId)` sets `state.selectedBoard` and emits `'BOARD_EQUIPPED'`.
- **Worlds (`ProgressionManager` & `WorldCatalog`)**:
  - Unlocked check: `isThemeUnlocked(themeId)` verifies if `unlock === 'FREE'`, signature runner is owned, or theme is in `state.unlockedThemes`.
  - Purchase: `purchaseTheme(themeId, 'COINS')` executes coin deduction and persists to `unlockedThemes`.
  - Equip: `equipTheme(themeId | 'DYNAMIC')` updates `state.selectedTheme` and emits `'ENVIRONMENT_PREFERENCE_CHANGED'`.

## 4. UI State Updates Without Page Reload
- Reactive event pipeline:
  1. User purchases or equips an item via modal action.
  2. `ProgressionManager` or `UpgradeManager` updates in-memory state and persists to `localStorage`.
  3. Manager emits specific event (`WALLET_UPDATED`, `CHARACTER_EQUIPPED`, `BOARD_EQUIPPED`, etc.).
  4. Active UI components listening to the event refresh immediately:
     - `StartScreen.ts` calls `this.updateState()` to update coin/key pill counts, equipped runner, board name, and world tag.
     - `ShopModal.ts` updates `#shop-wallet-coins` and re-renders active category cards.
     - `CharacterSelectModal.ts` / `HoverboardSelectModal.ts` execute `updateActionButton()` (toggling BUY / EQUIP / EQUIPPED).

## 5. Important CSS Selectors & Design Tokens
- **Tokens (`src/style.css: :root`)**:
  - Brand/Accents: `--color-accent-primary` (`#ff6b35`), `--color-accent-secondary` (`#00d4ff`), `--color-accent-gold` (`#ffd700`), `--color-accent-green` (`#4caf50`), `--color-accent-red` (`#f44336`).
  - Surfaces: `--color-surface-0` (`#0a0a0f`), `--color-surface-1` (`#12121a`), `--color-surface-2` (`#1a1a2e`), `--color-surface-3` (`#252540`), `--color-surface-overlay` (`rgba(0,0,0,0.85)`).
  - Typography: `--font-display` (`'Lilita One', cursive`), `--font-body` / `--font-ui` (`'Outfit', sans-serif`).
  - Z-Index Hierarchy: Canvas (`1`) < Overlay Root (`10`) < HUD (`100`) < Modal Overlay (`200`–`300`) < Toast (`500`).
- **Core Structural Selectors**:
  - `#game-canvas`: Background WebGL canvas.
  - `#ui-overlay`: Global pointer-event pass-through wrapper (`pointer-events: none`).
  - `.screen-overlay`: Fullscreen modal container with `pointer-events: auto`.
  - `.hidden`: Global display toggle (`display: none !important`).
  - Buttons: `.arcade-play-btn`, `.arcade-btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`.
  - Tabs: `.arcade-tab-btn`, `.character-tab`, `.settings-tab-btn`.

## 6. Known UI Problems
### Verified Findings (Observed in Code)
1. **Direct DOM Class Manipulation on Return**: Modals hide by executing `document.getElementById('start-screen').classList.remove('hidden')` rather than calling `StartScreen.show()`. This skips `StartScreen.updateState()`, preventing lobby indicators from refreshing.
2. **Broken Back Routing in `ShopModal`**: When opened directly to a category (`show(category)`), `previousScreen` is not assigned. When closed, `hide()` checks `if (prev === 'START')`, failing silently if opened from `GameOverModal` or a sub-route and leaving the user stuck on an empty screen.
3. **Uncoordinated Escape Key Listeners**: Every modal independently adds an unmanaged `window.addEventListener('keydown')` for Escape, causing missed dismissals or multi-modal closing conflicts.
4. **Missing Settings Back Routing**: `SettingsModal.ts` does not record whether it was opened from `PauseModal` or `StartScreen`, leading to stacked or orphaned modal states.
5. **Redundant & Conflicting CSS**: Over 10,700 lines in `style.css` with competing font declarations (display font misused on prices/descriptions with excessive italic transforms) and duplicated button classes.
6. **Residual Reference Branding**: Visible string occurrences in `index.html` (e.g. `<title>Metro Runner 3D — Subway Endless Runner</title>`) and modal copy referencing Subway instead of Metro Runner.

### Assumptions (Unverified in Runtime Walkthrough)
- Element clipping on mobile viewports under 375px width (requires live browser layout test across breakpoints).

## 7. Safe Implementation Order
1. **Consolidate Design Tokens**: Standardize base typography, button, badge, and card classes in `src/style.css` without breaking legacy selectors.
2. **Implement Minimal Navigation Coordination**: Create a lightweight stack/coordinator to manage modal depth, return destinations (`fromScreen`), and top-level Escape handling.
3. **Standardize Modal Open/Hide Contracts**: Update `ShopModal`, `CharacterSelectModal`, `HoverboardSelectModal`, `EnvironmentSelectModal`, `MissionsModal`, and `SettingsModal` to route through the coordinator.
4. **Redesign Home Lobby (`StartScreen.ts` & `index.html`)**:
   - Establish Metro Runner brand hierarchy.
   - Wire 1-click Direct Customization controls (RUNNER, BOARD, WORLD) to trigger corresponding modals.
   - Streamline bottom navigation dock and balance side widgets.
5. **Apply Responsive Layout Rules**: Replace arbitrary positioning with media queries for 1440×900, 1024×768, and 390×844 / 360×800 mobile.
6. **Execute Targeted Verification & Build**: Ensure `npm run build` and regression tests pass.

## 8. Existing Test Commands
- Typecheck & Build: `npm run build` (`tsc && vite build`)
- Full Test Suite: `npm test`
- Targeted UI & Progression Tests:
  - `npx tsx test/task7-ui-progression.test.ts`
  - `npx tsx test/characters.test.ts`
  - `npx tsx test/hoverboards.test.ts`
  - `npx tsx test/premium-world-store.test.ts`
  - `npx tsx test/progression.test.ts`
  - `npx tsx test/developer-coin-grant.test.ts`

## 9. Files & Systems That Must NOT Be Modified
- **Physics, Track & Obstacle Systems**: `src/track/*`, `src/physics/*`, `src/player/*` (do not alter train movement, rooftop jumps, clearance, colliders, or lane math).
- **Collision & Scoring Logic**: `src/core/CollisionSystem.ts`, `src/progression/ScoreManager.ts`, `src/core/SpeedController.ts`.
- **Game Engine Core**: `src/scene/*`, `src/audio/*` (do not modify 3D environment generation, sound synthesis, or shaders).
- **Economy & Catalogs**: Do not alter catalog item keys or local storage identifiers (`metro_runner_progression`, `metro_runner_upgrades`).

