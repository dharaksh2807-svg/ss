import * as THREE from 'three';
import { CONSTANTS, LaneIndex, isDeveloperMode } from '../core/Constants';
import { EventBus, EVENTS } from '../core/EventBus';
import { Player, SupportSurfaceType } from '../player/Player';
import { TrackManager } from '../track/TrackManager';
import { ObstacleType, ObstacleInstance } from '../track/ObstacleFactory';
import { InputAction } from '../core/InputManager';

export interface ArenaScenarioConfig {
  name: string;
  playerLane: LaneIndex;
  playerSpeed: number;
  playerStartY?: number;
  trainType?: 'TRAIN' | 'MOVING_TRAIN' | 'TRAIN_RAMP';
  trainLength?: number;
  hasRamp?: boolean;
  movingTrainSpeed?: number;
  obstacleType?: ObstacleType;
  obstacleZ?: number;
  activePowerups?: Array<'SHIELD' | 'SNEAKERS' | 'MAGNET' | 'JETPACK'>;
  hasHoverboard?: boolean;
  seed?: number;
}

export interface ReplayRecording {
  version: number;
  scenarioName: string;
  seed: number;
  initialPlayerState: {
    lane: LaneIndex;
    speed: number;
    y: number;
    z: number;
    powerups: string[];
    hasHoverboard: boolean;
  };
  scenarioConfig: ArenaScenarioConfig;
  inputs: Array<{ time: number; action: InputAction }>;
  finalOutcome?: {
    crashed: boolean;
    reason: string;
    elapsed: number;
  };
}

export class DevTestArena {
  private static instance: DevTestArena | null = null;

  private isVisible: boolean = false;
  private isPaused: boolean = false;
  private stepRequested: boolean = false;
  private timeScale: number = 1.0;
  private wireframesEnabled: boolean = false;

  // Collision wireframe helpers
  private wireframeHelpers: THREE.Box3Helper[] = [];
  private playerWireframe: THREE.Box3Helper | null = null;

  // Logging
  private logEntries: string[] = [];
  private logContainerEl: HTMLElement | null = null;

  // Deterministic Recording & Replay
  private isRecording: boolean = false;
  private isReplaying: boolean = false;
  private currentRecording: ReplayRecording | null = null;
  private replayInputIndex: number = 0;
  private arenaElapsed: number = 0;

  // UI elements
  private rootEl: HTMLElement | null = null;
  private currentConfig: ArenaScenarioConfig;

  private eventBus = EventBus.getInstance();

  constructor(
    private scene: THREE.Scene,
    private player: Player,
    private trackManager: TrackManager,
    private onStartScenario?: () => void
  ) {
    this.currentConfig = {
      name: 'HEADON_TRAIN',
      playerLane: 0,
      playerSpeed: 18.0,
      trainType: 'TRAIN',
      trainLength: CONSTANTS.TRAIN_LENGTH_SHORT,
      hasRamp: false,
      obstacleZ: 30.0,
      seed: 1337
    };

    this.setupEventListeners();
    this.checkUrlDevParams();
  }

  public static getInstance(scene?: THREE.Scene, player?: Player, trackManager?: TrackManager): DevTestArena {
    if (!DevTestArena.instance && scene && player && trackManager) {
      DevTestArena.instance = new DevTestArena(scene, player, trackManager);
    }
    return DevTestArena.instance!;
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  public isSimulationPaused(): boolean {
    return this.isPaused;
  }

  public getTimeScale(): number {
    return this.timeScale;
  }

  public consumeStepRequest(): boolean {
    if (this.stepRequested) {
      this.stepRequested = false;
      return true;
    }
    return false;
  }

  private checkUrlDevParams(): void {
    if (typeof window === 'undefined' || !isDeveloperMode()) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === 'arena' || params.get('arena') === '1' || params.get('test') === 'arena') {
      this.show();
    }
  }

  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      // Dev shortcut toggle: Backquote (` or ~) or Ctrl+Shift+D or F8 (only when authorized)
      window.addEventListener('keydown', (e) => {
        if (!isDeveloperMode()) return;
        if ((e.code === 'Backquote' && (e.ctrlKey || e.altKey)) || (e.code === 'KeyD' && e.ctrlKey && e.shiftKey) || e.code === 'F8') {
          e.preventDefault();
          this.toggle();
        }
      });
    }

    // Record player input events when recording is active
    this.eventBus.on('INPUT_ACTION', (action: InputAction) => {
      if (this.isRecording && this.currentRecording) {
        this.currentRecording.inputs.push({
          time: Math.round(this.arenaElapsed * 1000) / 1000,
          action
        });
        this.log(`[INPUT] Action '${action}' captured at ${this.arenaElapsed.toFixed(3)}s`);
      }
    });

    // Log critical collision & state transitions
    this.eventBus.on(EVENTS.CRASH, () => {
      this.log(`💥 [CRASH] Fatal collision at Z=${this.player.position.z.toFixed(2)}m (Surface: ${this.player.getSupportSurface()})`);
      if (this.isRecording && this.currentRecording) {
        this.currentRecording.finalOutcome = {
          crashed: true,
          reason: 'CRASH',
          elapsed: this.arenaElapsed
        };
      }
    });

    this.eventBus.on(EVENTS.STUMBLE, () => {
      this.log(`⚠️ [STUMBLE] Nonfatal stumble/glance at Z=${this.player.position.z.toFixed(2)}m`);
    });

    this.eventBus.on(EVENTS.NEAR_MISS, () => {
      this.log(`✨ [NEAR_MISS] Near miss margin cleared at Z=${this.player.position.z.toFixed(2)}m`);
    });

    this.eventBus.on(EVENTS.FAST_DROP, () => {
      this.log(`⚡ [FAST_DROP] Mid-air fast drop executed at Y=${this.player.position.y.toFixed(2)}m`);
    });

    this.eventBus.on(EVENTS.HOVERBOARD_BROKEN, () => {
      this.log(`🛹 [BOARD_SHIELD] Hoverboard absorbed impact at Z=${this.player.position.z.toFixed(2)}m`);
    });
  }

  public show(): void {
    if (!isDeveloperMode()) return;
    this.isVisible = true;
    this.mountUI();
    if (this.rootEl) {
      this.rootEl.classList.remove('hidden');
    }
  }

  public hide(): void {
    this.isVisible = false;
    if (this.rootEl) {
      this.rootEl.classList.add('hidden');
    }
    this.clearWireframes();
  }

  public toggle(): void {
    if (!isDeveloperMode()) return;
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  // ---------------------------------------------------------------------------
  // Scenario Loading
  // ---------------------------------------------------------------------------
  public loadScenario(config: ArenaScenarioConfig): void {
    this.currentConfig = { ...config };
    this.arenaElapsed = 0;
    this.isReplaying = false;

    // 1. Reset and configure determinism
    const seed = config.seed !== undefined ? config.seed : 1337;
    this.trackManager.setSeed(seed);

    // 2. Configure Player
    this.player.reset();
    this.player.currentLane = config.playerLane;
    this.player.targetLane = config.playerLane;
    const startX = CONSTANTS.LANES[config.playerLane];
    const startY = config.playerStartY !== undefined ? config.playerStartY : CONSTANTS.PLAYER_BASE_Y;
    this.player.position.set(startX, startY, 0);
    this.player.previousPosition.copy(this.player.position);
    this.player.speed = config.playerSpeed;

    // Apply powerups
    if (config.activePowerups) {
      for (const p of config.activePowerups) {
        this.player.powerups.activate(p);
      }
    }
    if (config.hasHoverboard) {
      this.player.hoverboardManager.grantPracticeCharge();
      this.player.hoverboardManager.activate();
    }

    // 3. Clear and populate Chunk 0
    const chunk = this.trackManager.chunks[0];
    chunk.chunkZ = 0;
    chunk.clearDynamicItems();

    const obstacles: any[] = [];
    const zOffset = config.obstacleZ !== undefined ? config.obstacleZ : 30.0;

    if (config.trainType) {
      const isMoving = config.trainType === 'MOVING_TRAIN';
      const hasRamp = config.hasRamp || config.trainType === 'TRAIN_RAMP';
      obstacles.push({
        type: config.trainType as ObstacleType,
        lane: config.playerLane,
        zOffset,
        length: config.trainLength || CONSTANTS.TRAIN_LENGTH_SHORT,
        hasRamp,
        isMoving,
        velocityZ: isMoving ? (config.movingTrainSpeed || CONSTANTS.MOVING_TRAIN_SPEED) : 0
      });
    } else if (config.obstacleType) {
      obstacles.push({
        type: config.obstacleType,
        lane: config.playerLane,
        zOffset
      });
    }

    chunk.populate({
      name: `ARENA_${config.name}`,
      difficulty: 'MEDIUM',
      obstacles,
      collectibles: []
    }, 0);

    this.player.updateCollider();

    this.log(`\n=================================================`);
    this.log(`🚀 [ARENA SCENARIO] Loaded '${config.name}'`);
    this.log(`   Speed: ${config.playerSpeed} m/s | Lane: ${config.playerLane} | Seed: ${seed}`);
    this.log(`   Obstacle: ${config.trainType || config.obstacleType || 'None'} at Z=-${zOffset}m`);
    this.log(`=================================================`);

    this.refreshWireframes();
    if (this.onStartScenario) {
      this.onStartScenario();
    }
  }

  // ---------------------------------------------------------------------------
  // Deterministic Replay Controls
  // ---------------------------------------------------------------------------
  public startRecording(): void {
    this.show();
    this.isRecording = true;
    this.isReplaying = false;
    this.currentRecording = {
      version: 1,
      scenarioName: this.currentConfig.name,
      seed: this.currentConfig.seed || 1337,
      initialPlayerState: {
        lane: this.player.currentLane,
        speed: this.player.speed,
        y: this.player.position.y,
        z: this.player.position.z,
        powerups: [],
        hasHoverboard: this.player.hoverboardManager.isBoardActive()
      },
      scenarioConfig: { ...this.currentConfig },
      inputs: []
    };
    this.log(`🔴 [REPLAY] Recording started. Actions will be captured with millisecond timestamps.`);
    this.updateControlsUI();
  }

  public stopRecording(): ReplayRecording | null {
    if (!this.isRecording || !this.currentRecording) return null;
    this.isRecording = false;
    this.currentRecording.finalOutcome = {
      crashed: this.player.state === 'CRASH',
      reason: this.player.state === 'CRASH' ? 'CRASH' : 'SAFE_PASS',
      elapsed: this.arenaElapsed
    };
    this.log(`⏹️ [REPLAY] Recording stopped. Total inputs captured: ${this.currentRecording.inputs.length}`);
    this.updateControlsUI();
    return this.currentRecording;
  }

  public playReplay(recording?: ReplayRecording): void {
    const rec = recording || this.currentRecording;
    if (!rec) {
      this.log(`❌ [REPLAY] No recording available to play.`);
      return;
    }

    this.show();
    this.stopRecording();

    // Reset exactly to recorded state first
    this.loadScenario(rec.scenarioConfig);

    this.isReplaying = true;
    this.currentRecording = rec;
    this.replayInputIndex = 0;

    this.log(`▶️ [REPLAY] Playing deterministic replay '${rec.scenarioName}' (${rec.inputs.length} inputs)...`);
    this.updateControlsUI();
  }

  // ---------------------------------------------------------------------------
  // Update Loop & Frame Stepping
  // ---------------------------------------------------------------------------
  public update(dt: number): void {
    if (!this.isVisible) return;

    this.arenaElapsed += dt;

    // Handle Replay Input Dispatching
    if (this.isReplaying && this.currentRecording) {
      while (
        this.replayInputIndex < this.currentRecording.inputs.length &&
        this.currentRecording.inputs[this.replayInputIndex].time <= this.arenaElapsed
      ) {
        const item = this.currentRecording.inputs[this.replayInputIndex];
        this.player.handleInput(item.action);
        this.log(`🔁 [REPLAY DISPATCH] ${item.action} at ${this.arenaElapsed.toFixed(3)}s`);
        this.replayInputIndex++;
      }

      if (this.replayInputIndex >= this.currentRecording.inputs.length && this.player.state === 'CRASH') {
        this.isReplaying = false;
        this.log(`🏁 [REPLAY COMPLETE] Replay verified fatal crash reproduction.`);
        this.updateControlsUI();
      }
    }

    // Update 3D wireframe helpers
    if (this.wireframesEnabled) {
      this.updateWireframePositions();
    }
  }

  // ---------------------------------------------------------------------------
  // 3D Collision Wireframe Visualizer
  // ---------------------------------------------------------------------------
  public setWireframesEnabled(enabled: boolean): void {
    this.wireframesEnabled = enabled;
    if (enabled) {
      this.refreshWireframes();
    } else {
      this.clearWireframes();
    }
    if (typeof document !== 'undefined') {
      const wireframesBtn = document.getElementById('arena-wireframes-toggle');
      if (wireframesBtn) {
        wireframesBtn.textContent = `📦 Wireframes: ${enabled ? 'ON' : 'OFF'}`;
        wireframesBtn.classList.toggle('active', enabled);
      }
    }
  }

  public setSimulationPaused(paused: boolean): void {
    this.isPaused = paused;
    if (typeof document !== 'undefined') {
      const pauseBtn = document.getElementById('arena-pause-toggle');
      if (pauseBtn) {
        pauseBtn.textContent = paused ? '▶️ Resume' : '⏸️ Pause';
        pauseBtn.classList.toggle('active', paused);
      }
    }
  }

  private refreshWireframes(): void {
    this.clearWireframes();
    if (!this.wireframesEnabled) return;

    // 1. Player Box Wireframe (Green when safe, Red on crash, Yellow when shielded)
    const playerColor = this.player.state === 'CRASH' ? 0xff2222 : 0x00ff88;
    this.playerWireframe = new THREE.Box3Helper(this.player.collider, new THREE.Color(playerColor));
    this.scene.add(this.playerWireframe);

    // 2. Obstacle Colliders
    for (const chunk of this.trackManager.chunks) {
      for (const obs of chunk.obstacles) {
        if (!obs.active) continue;

        // Main body collider (Red)
        const bodyBox = obs.bodyCollider || obs.collider;
        const bodyHelper = new THREE.Box3Helper(bodyBox, new THREE.Color(0xff3355));
        this.wireframeHelpers.push(bodyHelper);
        this.scene.add(bodyHelper);

        // Front bumper (Orange)
        if (obs.frontBumperCollider) {
          const bumperHelper = new THREE.Box3Helper(obs.frontBumperCollider, new THREE.Color(0xffaa00));
          this.wireframeHelpers.push(bumperHelper);
          this.scene.add(bumperHelper);
        }

        // Ramp collider (Cyan)
        if (obs.rampCollider) {
          const rampHelper = new THREE.Box3Helper(obs.rampCollider, new THREE.Color(0x00e5ff));
          this.wireframeHelpers.push(rampHelper);
          this.scene.add(rampHelper);
        }

        // Roof collider (Blue)
        if (obs.roofCollider) {
          const roofHelper = new THREE.Box3Helper(obs.roofCollider, new THREE.Color(0x3d5afe));
          this.wireframeHelpers.push(roofHelper);
          this.scene.add(roofHelper);
        }

        // Near-miss volume (Magenta)
        if (obs.nearMissBox) {
          const nearMissHelper = new THREE.Box3Helper(obs.nearMissBox, new THREE.Color(0xe040fb));
          this.wireframeHelpers.push(nearMissHelper);
          this.scene.add(nearMissHelper);
        }
      }
    }
  }

  private updateWireframePositions(): void {
    if (this.playerWireframe) {
      const color = this.player.state === 'CRASH'
        ? 0xff2222
        : (this.player.powerups.isInvulnerable() || this.player.hoverboardManager.isBoardActive() ? 0xffd700 : 0x00ff88);
      (this.playerWireframe.material as THREE.LineBasicMaterial).color.setHex(color);
    }
  }

  private clearWireframes(): void {
    if (this.playerWireframe) {
      this.scene.remove(this.playerWireframe);
      this.playerWireframe = null;
    }
    for (const helper of this.wireframeHelpers) {
      this.scene.remove(helper);
    }
    this.wireframeHelpers = [];
  }

  // ---------------------------------------------------------------------------
  // Diagnostic Logging
  // ---------------------------------------------------------------------------
  public log(message: string): void {
    const timestamp = new Date().toISOString().substring(11, 23);
    const line = `[${timestamp}] ${message}`;
    this.logEntries.push(line);
    if (this.logEntries.length > 200) {
      this.logEntries.shift();
    }

    if (this.logContainerEl) {
      const p = document.createElement('div');
      p.className = 'arena-log-line';
      p.textContent = line;
      this.logContainerEl.appendChild(p);
      this.logContainerEl.scrollTop = this.logContainerEl.scrollHeight;
    }
  }

  public clearLog(): void {
    this.logEntries = [];
    if (this.logContainerEl) {
      this.logContainerEl.innerHTML = '';
    }
  }

  // ---------------------------------------------------------------------------
  // GUI / HUD Overlay
  // ---------------------------------------------------------------------------
  private mountUI(): void {
    if (this.rootEl) return;
    if (typeof document === 'undefined') return;

    const dock = document.createElement('div');
    dock.id = 'dev-arena-dock';
    dock.className = 'dev-arena-dock glassmorphic';

    dock.innerHTML = `
      <div class="arena-header">
        <div class="arena-title-area">
          <span class="arena-badge">🛠️ DEV ARENA</span>
          <span class="arena-subtitle">Authoritative Physics & Collision Diagnostics</span>
        </div>
        <div class="arena-header-actions">
          <button id="arena-wireframes-toggle" class="arena-btn" title="Toggle 3D Bounding Boxes">📦 Wireframes: OFF</button>
          <button id="arena-pause-toggle" class="arena-btn" title="Pause / Resume">⏸️ Pause</button>
          <button id="arena-step-btn" class="arena-btn" title="Single Frame Step [1/60s]">⏭️ Step</button>
          <button id="arena-close-btn" class="arena-close-btn" title="Close Arena [~ or F8]">✕</button>
        </div>
      </div>

      <div class="arena-body">
        <!-- Parameters Panel -->
        <div class="arena-panel arena-params-panel">
          <div class="arena-row">
            <label>Scenario Preset:</label>
            <select id="arena-scenario-select" class="arena-select">
              <option value="HEADON_TRAIN">Stationary Train Head-on</option>
              <option value="RAMP_CLIMB">Train Ramp Ascent</option>
              <option value="ROOFTOP_LANDING">Super Sneakers Roof Jump</option>
              <option value="ROOF_GAP_JUMP">Train-to-Train Gap Leap</option>
              <option value="FAST_DROP_PAIR">Fast Drop Obstacle Pair</option>
              <option value="MOVING_TRAIN_HEADON">Oncoming Moving Train</option>
              <option value="SHIELD_COLLISION">Shield Crash Absorption</option>
              <option value="HOVERBOARD_COLLISION">Hoverboard Crash Absorption</option>
              <option value="LANE_SWITCH_MIDAIR">Mid-Air Lane Switch</option>
              <option value="IMPOSSIBLE_CHECK">Impossible Pattern Detection</option>
            </select>
          </div>

          <div class="arena-row">
            <label>Player Lane:</label>
            <div class="arena-btn-group" id="arena-lane-group">
              <button class="arena-btn" data-lane="-1">Left (-1.8)</button>
              <button class="arena-btn active" data-lane="0">Center (0.0)</button>
              <button class="arena-btn" data-lane="1">Right (+1.8)</button>
            </div>
          </div>

          <div class="arena-row">
            <label>Player Speed: <span id="arena-speed-val">18</span> m/s</label>
            <input type="range" id="arena-speed-slider" min="0" max="35" step="1" value="18" class="arena-slider"/>
          </div>

          <div class="arena-row">
            <label>Deterministic Seed:</label>
            <div class="arena-seed-group">
              <input type="number" id="arena-seed-input" value="1337" class="arena-input"/>
              <button id="arena-reroll-seed-btn" class="arena-btn">🎲 Reroll</button>
            </div>
          </div>

          <div class="arena-row">
            <label>Powerups & State:</label>
            <div class="arena-checkboxes">
              <label><input type="checkbox" id="arena-powerup-shield"/> Shield</label>
              <label><input type="checkbox" id="arena-powerup-board"/> Board</label>
              <label><input type="checkbox" id="arena-powerup-sneakers"/> Sneakers</label>
              <label><input type="checkbox" id="arena-powerup-magnet"/> Magnet</label>
            </div>
          </div>

          <div class="arena-row arena-buttons-row">
            <button id="arena-apply-btn" class="btn btn-primary arena-action-btn">▶ LAUNCH SCENARIO</button>
            <button id="arena-reset-btn" class="btn btn-secondary arena-action-btn">🔄 RESET</button>
          </div>
        </div>

        <!-- Replay & Diagnostic Logs Panel -->
        <div class="arena-panel arena-log-panel">
          <div class="arena-replay-bar">
            <button id="arena-rec-toggle" class="arena-btn rec-btn">🔴 Record Run</button>
            <button id="arena-replay-btn" class="arena-btn" disabled>▶️ Replay</button>
            <button id="arena-export-btn" class="arena-btn" disabled>💾 Export JSON</button>
            <button id="arena-clear-log-btn" class="arena-btn">🧹 Clear</button>
          </div>

          <div class="arena-log-console" id="arena-log-console"></div>
        </div>
      </div>
    `;

    document.getElementById('ui-overlay')?.appendChild(dock);
    this.rootEl = dock;
    this.logContainerEl = document.getElementById('arena-log-console');

    this.wireDockEvents();
  }

  private wireDockEvents(): void {
    if (!this.rootEl) return;

    // Close button
    document.getElementById('arena-close-btn')?.addEventListener('click', () => this.hide());

    // Wireframes toggle
    const wireframesBtn = document.getElementById('arena-wireframes-toggle');
    wireframesBtn?.addEventListener('click', () => {
      this.setWireframesEnabled(!this.wireframesEnabled);
    });

    // Pause toggle
    const pauseBtn = document.getElementById('arena-pause-toggle');
    pauseBtn?.addEventListener('click', () => {
      this.setSimulationPaused(!this.isPaused);
    });

    // Step button
    document.getElementById('arena-step-btn')?.addEventListener('click', () => {
      this.stepRequested = true;
      this.log(`⏩ [STEP] Single physics frame stepped.`);
    });

    // Speed slider
    const speedSlider = document.getElementById('arena-speed-slider') as HTMLInputElement;
    const speedVal = document.getElementById('arena-speed-val');
    speedSlider?.addEventListener('input', () => {
      if (speedVal) speedVal.textContent = speedSlider.value;
      this.currentConfig.playerSpeed = parseFloat(speedSlider.value);
    });

    // Lane group
    const laneBtns = this.rootEl.querySelectorAll('#arena-lane-group button');
    laneBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        laneBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentConfig.playerLane = parseInt(btn.getAttribute('data-lane') || '0', 10) as LaneIndex;
      });
    });

    // Reroll Seed
    document.getElementById('arena-reroll-seed-btn')?.addEventListener('click', () => {
      const newSeed = Math.floor(Math.random() * 90000) + 1000;
      const input = document.getElementById('arena-seed-input') as HTMLInputElement;
      if (input) input.value = String(newSeed);
      this.currentConfig.seed = newSeed;
    });

    // Scenario Select Preset
    document.getElementById('arena-scenario-select')?.addEventListener('change', (e) => {
      const preset = (e.target as HTMLSelectElement).value;
      this.applyScenarioPreset(preset);
    });

    // Launch Scenario
    document.getElementById('arena-apply-btn')?.addEventListener('click', () => {
      this.gatherUIConfig();
      this.loadScenario(this.currentConfig);
    });

    // Reset Scenario
    document.getElementById('arena-reset-btn')?.addEventListener('click', () => {
      this.loadScenario(this.currentConfig);
    });

    // Record Toggle
    const recBtn = document.getElementById('arena-rec-toggle');
    recBtn?.addEventListener('click', () => {
      if (!this.isRecording) {
        this.startRecording();
      } else {
        this.stopRecording();
      }
    });

    // Replay Button
    document.getElementById('arena-replay-btn')?.addEventListener('click', () => {
      this.playReplay();
    });

    // Export Button
    document.getElementById('arena-export-btn')?.addEventListener('click', () => {
      this.exportRecordingJSON();
    });

    // Clear Log
    document.getElementById('arena-clear-log-btn')?.addEventListener('click', () => {
      this.clearLog();
    });
  }

  private applyScenarioPreset(preset: string): void {
    const configs: Record<string, Partial<ArenaScenarioConfig>> = {
      HEADON_TRAIN: {
        name: 'HEADON_TRAIN',
        playerSpeed: 18.0,
        trainType: 'TRAIN',
        trainLength: CONSTANTS.TRAIN_LENGTH_SHORT,
        hasRamp: false,
        obstacleZ: 30.0
      },
      RAMP_CLIMB: {
        name: 'RAMP_CLIMB',
        playerSpeed: 18.0,
        trainType: 'TRAIN_RAMP',
        trainLength: CONSTANTS.TRAIN_LENGTH_MEDIUM,
        hasRamp: true,
        obstacleZ: 32.0
      },
      ROOFTOP_LANDING: {
        name: 'ROOFTOP_LANDING',
        playerSpeed: 18.0,
        trainType: 'TRAIN',
        trainLength: CONSTANTS.TRAIN_LENGTH_MEDIUM,
        hasRamp: false,
        activePowerups: ['SNEAKERS'],
        obstacleZ: 35.0
      },
      ROOF_GAP_JUMP: {
        name: 'ROOF_GAP_JUMP',
        playerSpeed: 18.0,
        trainType: 'TRAIN',
        trainLength: 24.0,
        playerStartY: 4.35,
        obstacleZ: 10.0
      },
      FAST_DROP_PAIR: {
        name: 'FAST_DROP_PAIR',
        playerSpeed: 18.0,
        obstacleType: 'LOW_BARRIER',
        obstacleZ: 25.0
      },
      MOVING_TRAIN_HEADON: {
        name: 'MOVING_TRAIN_HEADON',
        playerSpeed: 18.0,
        trainType: 'MOVING_TRAIN',
        trainLength: CONSTANTS.TRAIN_LENGTH_MEDIUM,
        hasRamp: false,
        movingTrainSpeed: 15.0,
        obstacleZ: 60.0
      },
      SHIELD_COLLISION: {
        name: 'SHIELD_COLLISION',
        playerSpeed: 18.0,
        trainType: 'TRAIN',
        trainLength: CONSTANTS.TRAIN_LENGTH_SHORT,
        activePowerups: ['SHIELD'],
        obstacleZ: 28.0
      },
      HOVERBOARD_COLLISION: {
        name: 'HOVERBOARD_COLLISION',
        playerSpeed: 18.0,
        trainType: 'TRAIN',
        trainLength: CONSTANTS.TRAIN_LENGTH_SHORT,
        hasHoverboard: true,
        obstacleZ: 28.0
      },
      LANE_SWITCH_MIDAIR: {
        name: 'LANE_SWITCH_MIDAIR',
        playerSpeed: 18.0,
        trainType: 'TRAIN',
        trainLength: CONSTANTS.TRAIN_LENGTH_SHORT,
        obstacleZ: 32.0
      },
      IMPOSSIBLE_CHECK: {
        name: 'IMPOSSIBLE_CHECK',
        playerSpeed: 20.0,
        obstacleType: 'HIGH_BARRIER',
        obstacleZ: 30.0
      }
    };

    if (configs[preset]) {
      this.currentConfig = { ...this.currentConfig, ...configs[preset] };
      if (typeof document !== 'undefined') {
        const speedSlider = document.getElementById('arena-speed-slider') as HTMLInputElement;
        const speedVal = document.getElementById('arena-speed-val');
        if (speedSlider) speedSlider.value = String(this.currentConfig.playerSpeed);
        if (speedVal) speedVal.textContent = String(this.currentConfig.playerSpeed);
      }
    }
  }

  private gatherUIConfig(): void {
    if (typeof document === 'undefined') return;
    const seedInput = document.getElementById('arena-seed-input') as HTMLInputElement;
    if (seedInput) {
      this.currentConfig.seed = parseInt(seedInput.value, 10) || 1337;
    }

    const shield = (document.getElementById('arena-powerup-shield') as HTMLInputElement)?.checked;
    const board = (document.getElementById('arena-powerup-board') as HTMLInputElement)?.checked;
    const sneakers = (document.getElementById('arena-powerup-sneakers') as HTMLInputElement)?.checked;
    const magnet = (document.getElementById('arena-powerup-magnet') as HTMLInputElement)?.checked;

    const powerups: Array<'SHIELD' | 'SNEAKERS' | 'MAGNET' | 'JETPACK'> = [];
    if (shield) powerups.push('SHIELD');
    if (sneakers) powerups.push('SNEAKERS');
    if (magnet) powerups.push('MAGNET');

    this.currentConfig.activePowerups = powerups;
    this.currentConfig.hasHoverboard = board;
  }

  private updateControlsUI(): void {
    if (typeof document === 'undefined') return;
    const recBtn = document.getElementById('arena-rec-toggle');
    const replayBtn = document.getElementById('arena-replay-btn') as HTMLButtonElement;
    const exportBtn = document.getElementById('arena-export-btn') as HTMLButtonElement;

    if (recBtn) {
      recBtn.textContent = this.isRecording ? '⏹️ Stop Recording' : '🔴 Record Run';
      recBtn.classList.toggle('recording', this.isRecording);
    }

    const hasRecording = !!this.currentRecording;
    if (replayBtn) replayBtn.disabled = !hasRecording || this.isRecording;
    if (exportBtn) exportBtn.disabled = !hasRecording || this.isRecording;
  }

  private exportRecordingJSON(): void {
    if (!this.currentRecording) return;
    const jsonStr = JSON.stringify(this.currentRecording, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metro_arena_replay_${this.currentRecording.scenarioName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.log(`💾 [REPLAY EXPORT] Replay saved as JSON.`);
  }

  /**
   * Global Window APIs for automation and browser tests
   */
  public attachToWindow(game: any): void {
    if (typeof window === 'undefined') return;

    (window as any).__PHYSICS_ARENA__ = {
      open: () => this.show(),
      close: () => this.hide(),
      toggle: () => this.toggle(),
      loadScenario: (config: ArenaScenarioConfig) => this.loadScenario(config),
      startRecording: () => this.startRecording(),
      stopRecording: () => this.stopRecording(),
      playReplay: (rec?: ReplayRecording) => this.playReplay(rec),
      setWireframes: (enabled: boolean) => this.setWireframesEnabled(enabled),
      pause: () => { this.isPaused = true; },
      resume: () => { this.isPaused = false; },
      step: () => { this.stepRequested = true; },
      getLogEntries: () => [...this.logEntries],
      getCurrentRecording: () => this.currentRecording
    };
  }
}
