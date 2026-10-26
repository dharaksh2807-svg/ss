import { EventBus, EVENTS } from '../core/EventBus';
import { BugSnapshotManager } from '../debug/BugSnapshotManager';
import { BugSnapshotPackage } from '../debug/BugSnapshotTypes';
import { DebugVisualizer } from '../debug/DebugVisualizer';

export class DevBugReportModal {
  private static readonly STORAGE_KEY = 'metro_debug_auto_open_crash_report';
  private element: HTMLElement;
  private currentSnapshot: BugSnapshotPackage | null = null;
  private autoOpenCrashReport: boolean = false;
  private snapshotManager = BugSnapshotManager.getInstance();
  private visualizer = DebugVisualizer.getInstance();
  private eventBus = EventBus.getInstance();

  constructor() {
    this.autoOpenCrashReport = this.loadAutoOpenPreference();
    let el = document.getElementById('dev-bug-report-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'dev-bug-report-modal';
      el.className = 'screen-overlay hidden';
      document.getElementById('ui-overlay')?.appendChild(el);
    }
    this.element = el;
    this.setupListeners();
  }

  private loadAutoOpenPreference(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(DevBugReportModal.STORAGE_KEY) === 'true';
      } catch {
        return false;
      }
    }
    return false;
  }

  public getAutoOpenCrashReport(): boolean {
    return this.autoOpenCrashReport;
  }

  public setAutoOpenCrashReport(enabled: boolean): void {
    this.autoOpenCrashReport = enabled;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        if (enabled) {
          window.localStorage.setItem(DevBugReportModal.STORAGE_KEY, 'true');
        } else {
          window.localStorage.removeItem(DevBugReportModal.STORAGE_KEY);
        }
      } catch {
        // Storage access might be restricted in some environments
      }
    }
    if (typeof window !== 'undefined') {
      (window as any).__DEV_AUTO_OPEN_CRASH_REPORT__ = enabled;
    }
  }

  private setupListeners(): void {
    this.eventBus.on('BUG_SNAPSHOT_CAPTURED', (snapshot: BugSnapshotPackage) => {
      // Store latest snapshot data silently in background
      this.currentSnapshot = snapshot;

      // CRITICAL ROOT FIX: Diagnostics capture silently in the background.
      // Do NOT auto-open the technical report modal unless a developer explicitly enabled this preference.
      if (this.autoOpenCrashReport) {
        this.render();
        this.show();
      }
    });

    this.eventBus.on('OPEN_BUG_REPORT_MODAL', () => {
      this.openLatest();
    });

    this.eventBus.on('SET_AUTO_OPEN_CRASH_REPORT', (enabled: boolean) => {
      this.autoOpenCrashReport = enabled;
    });

    // Lifecycle cleanups: modal must never persist into a new run or menu
    this.eventBus.on(EVENTS.GAME_START, () => this.hide());
    this.eventBus.on('GAME_RESTART', () => this.hide());
    this.eventBus.on('GO_TO_MENU', () => this.hide());

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.code === 'Escape' && !this.element.classList.contains('hidden')) {
          e.preventDefault();
          e.stopPropagation();
          this.hide();
        }
      });
    }
  }

  public openLatest(forceFreshManual: boolean = false): void {
    let snap = this.snapshotManager.getLatestSnapshot();
    if (!snap || forceFreshManual) {
      // Capture a fresh manual snapshot if none exists yet or if explicitly requested (e.g. F9 during active play)
      snap = this.snapshotManager.captureManualSnapshot('Tester opened bug report modal');
    }
    this.currentSnapshot = snap;
    this.render();
    this.show();
  }

  public show(): void {
    this.element.classList.remove('hidden');
  }

  public hide(): void {
    this.element.classList.add('hidden');
  }

  private render(): void {
    if (!this.currentSnapshot) return;

    const snap = this.currentSnapshot;
    const trigger = snap.trigger;
    const ctx = snap.runContext;
    const lastFrame = snap.frames[snap.frames.length - 1];
    const p = lastFrame ? lastFrame.player : null;

    const badgeColor =
      trigger.type === 'FATAL_COLLISION'
        ? '#ff1744'
        : trigger.type === 'ROOFTOP_CLIPPING_OR_FALL'
        ? '#ff9100'
        : trigger.type === 'INVALID_PHYSICS'
        ? '#d500f9'
        : '#00e5ff';

    this.element.innerHTML = `
      <div class="modal-card arcade-modal-card bug-report-card animate-pop" style="max-width: 620px; border: 1.5px solid ${badgeColor}; box-shadow: 0 12px 40px rgba(0,0,0,0.8);">
        <!-- Top Bar -->
        <div class="modal-top-bar" style="margin-bottom: 12px;">
          <div class="modal-title-group">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="background:${badgeColor};color:#000;font-weight:900;font-size:11px;padding:2px 8px;border-radius:4px;letter-spacing:1px;">
                ${trigger.type}
              </span>
              <span style="font-size:11px;color:#94a3b8;font-family:monospace;">SEED: ${ctx.seed}</span>
            </div>
            <h2 class="arcade-title" style="font-size: 1.6rem; margin-top: 4px; color: #fff;">
              🐛 BUG SNAPSHOT REPORT
            </h2>
          </div>
          <button id="dev-bug-close-btn" class="modal-close-btn" aria-label="Close Bug Report">✕</button>
        </div>

        <!-- Failure Summary Card -->
        <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
          <div style="font-size: 11px; font-weight: bold; color: ${badgeColor}; text-transform: uppercase; margin-bottom: 4px;">
            Observed Failure
          </div>
          <div style="font-size: 13px; color: #f8fafc; font-weight: 600; line-height: 1.4;">
            ${trigger.observedFailure}
          </div>
        </div>

        <!-- Diagnostic Metrics Grid -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; font-family: monospace; font-size: 11px;">
          <div style="background: rgba(30, 41, 59, 0.6); padding: 8px; border-radius: 6px; border-left: 3px solid #00e5ff;">
            <div style="color: #94a3b8; font-size: 10px;">POSITION (X,Y,Z)</div>
            <div style="color: #f1f5f9; font-weight: bold;">
              ${p ? `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}` : 'N/A'}
            </div>
          </div>
          <div style="background: rgba(30, 41, 59, 0.6); padding: 8px; border-radius: 6px; border-left: 3px solid #ffd600;">
            <div style="color: #94a3b8; font-size: 10px;">SPEED / LANE</div>
            <div style="color: #f1f5f9; font-weight: bold;">
              ${ctx.speed.toFixed(1)} m/s (L${p ? p.lane : 0})
            </div>
          </div>
          <div style="background: rgba(30, 41, 59, 0.6); padding: 8px; border-radius: 6px; border-left: 3px solid #00e676;">
            <div style="color: #94a3b8; font-size: 10px;">SURFACE / STATE</div>
            <div style="color: #f1f5f9; font-weight: bold;">
              ${p ? `${p.supportSurface} (${p.state})` : 'N/A'}
            </div>
          </div>
        </div>

        <!-- Frame & Obstacles Telemetry Summary -->
        <div style="background: rgba(10, 15, 26, 0.8); border: 1px solid rgba(0, 229, 255, 0.2); border-radius: 6px; padding: 10px; margin-bottom: 14px; font-size: 11px; font-family: monospace;">
          <div style="display: flex; justify-content: space-between; color: #94a3b8; margin-bottom: 6px;">
            <span>FRAMES RECORDED: <strong style="color: #00e5ff;">${snap.frames.length}</strong></span>
            <span>INPUT TRACE: <strong style="color: #ffd600;">${snap.inputs.length} actions</strong></span>
            <span>REPLAYABLE: <strong style="color: #00e676;">${snap.reproducibility.isReplayable ? 'YES' : 'NO'}</strong></span>
          </div>
          <div style="color: #cbd5e1; max-height: 80px; overflow-y: auto; padding-right: 4px;">
            ${
              lastFrame && lastFrame.nearbyObstacles.length > 0
                ? lastFrame.nearbyObstacles
                    .map(
                      o =>
                        `<div>• <code>${o.id}</code> [${o.type}] Lane ${o.lane} Z=${o.z.toFixed(1)} (VelZ=${o.velocityZ || 0})</div>`
                    )
                    .join('')
                : '<div>• No nearby obstacles at impact horizon</div>'
            }
          </div>
        </div>

        <!-- Toast Feedback Banner -->
        <div id="dev-bug-feedback" style="display: none; background: rgba(0, 229, 255, 0.15); border: 1px solid #00e5ff; color: #00e5ff; font-size: 12px; padding: 6px 12px; border-radius: 6px; margin-bottom: 12px; text-align: center; font-weight: bold;">
        </div>

        <!-- Action Buttons -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <button id="dev-bug-copy-ai-btn" class="arcade-btn btn-primary" style="font-size: 12px; padding: 10px;">
            📋 COPY AI SUMMARY
          </button>
          <button id="dev-bug-download-json-btn" class="arcade-btn btn-secondary" style="font-size: 12px; padding: 10px;">
            💾 DOWNLOAD JSON
          </button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
          <button id="dev-bug-reproduce-btn" class="arcade-btn btn-gold" style="font-size: 12px; padding: 10px;" ${snap.reproducibility.isReplayable ? '' : 'disabled'}>
            🔁 REPRODUCE SCENARIO
          </button>
          <button id="dev-bug-wireframes-btn" class="arcade-btn btn-secondary" style="font-size: 12px; padding: 10px;">
            📦 WIREFRAMES: ${this.visualizer.getIsEnabled() ? 'ON' : 'OFF'} [F8]
          </button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <button id="dev-bug-screenshot-btn" class="arcade-btn btn-secondary" style="font-size: 12px; padding: 10px; border-color: rgba(0, 229, 255, 0.4); color: #7dd3fc;">
            📸 DOWNLOAD SCREENSHOT ARTIFACT
          </button>
          <button id="dev-bug-autoopen-toggle-btn" class="arcade-btn btn-secondary" style="font-size: 11px; padding: 10px; border-color: ${this.autoOpenCrashReport ? '#ff1744' : 'rgba(255,255,255,0.2)'}; color: ${this.autoOpenCrashReport ? '#ff80ab' : '#94a3b8'};">
            ⚡ AUTO-POPUP: ${this.autoOpenCrashReport ? 'ON (DEV ONLY)' : 'OFF (DEFAULT)'}
          </button>
        </div>
      </div>
    `;

    this.bindActionEvents();
  }

  private bindActionEvents(): void {
    const closeBtn = this.element.querySelector('#dev-bug-close-btn');
    closeBtn?.addEventListener('click', () => this.hide());

    const autoOpenBtn = this.element.querySelector('#dev-bug-autoopen-toggle-btn');
    autoOpenBtn?.addEventListener('click', () => {
      const next = !this.autoOpenCrashReport;
      this.setAutoOpenCrashReport(next);
      this.render();
      this.showFeedback(`⚡ Auto-popup on crash toggled ${next ? 'ON (dev testing only)' : 'OFF (default gameplay)'}`);
    });

    const copyBtn = this.element.querySelector('#dev-bug-copy-ai-btn');
    copyBtn?.addEventListener('click', () => {
      if (!this.currentSnapshot) return;
      const md = this.snapshotManager.generateMarkdownSummary(this.currentSnapshot);
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(md).then(() => {
          this.showFeedback('✅ AI Bug Summary copied to clipboard!');
        });
      } else {
        this.showFeedback('📋 Summary generated (clipboard API unavailable)');
      }
    });

    const downloadBtn = this.element.querySelector('#dev-bug-download-json-btn');
    downloadBtn?.addEventListener('click', () => {
      if (!this.currentSnapshot) return;
      this.snapshotManager.downloadJsonFile(this.currentSnapshot);
      this.showFeedback('💾 Snapshot JSON downloaded!');
    });

    const screenshotBtn = this.element.querySelector('#dev-bug-screenshot-btn');
    screenshotBtn?.addEventListener('click', () => {
      if (!this.currentSnapshot) return;
      const success = this.snapshotManager.downloadScreenshot(this.currentSnapshot);
      if (success) {
        this.showFeedback('📸 Screenshot image downloaded!');
      } else {
        this.showFeedback('⚠️ Screenshot unavailable or could not be captured');
      }
    });

    const reproBtn = this.element.querySelector('#dev-bug-reproduce-btn');
    reproBtn?.addEventListener('click', () => {
      if (!this.currentSnapshot) return;
      this.hide();
      this.eventBus.emit('REPRODUCE_BUG_SNAPSHOT', this.currentSnapshot);
    });

    const wireframesBtn = this.element.querySelector('#dev-bug-wireframes-btn');
    wireframesBtn?.addEventListener('click', () => {
      const enabled = this.visualizer.toggle();
      if (wireframesBtn) {
        wireframesBtn.textContent = `📦 WIREFRAMES: ${enabled ? 'ON' : 'OFF'} [F8]`;
      }
      this.showFeedback(`3D Wireframes toggled ${enabled ? 'ON' : 'OFF'}`);
    });
  }

  private showFeedback(msg: string): void {
    const fb = this.element.querySelector('#dev-bug-feedback') as HTMLElement;
    if (fb) {
      fb.textContent = msg;
      fb.style.display = 'block';
      setTimeout(() => {
        if (fb) fb.style.display = 'none';
      }, 3000);
    }
  }
}
