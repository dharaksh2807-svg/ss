import * as THREE from 'three';
import { EventBus } from '../core/EventBus';

export type GraphicsPreset = 'AUTO' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ResolvedQuality = 'HIGH' | 'MEDIUM' | 'LOW';

export interface QualityConfig {
  preset: GraphicsPreset;
  resolved: ResolvedQuality;
  pixelRatio: number;
  shadowMapEnabled: boolean;
  shadowMapType: THREE.ShadowMapType;
  shadowMapSize: number;
  sceneryDetail: 'FULL' | 'BALANCED' | 'MINIMAL';
  cloudsVisible: boolean;
  skylineVisible: boolean;
  speedLinesVisible: boolean;
  particleMultiplier: number;
  contactBlobShadow: boolean;
  description: string;
}

export interface PerformanceSnapshot {
  fps: number;
  frameTimeMs: number;
  p95FrameTimeMs: number;
  p99FrameTimeMs: number;
  drawCalls: number;
  triangles: number;
  pixelRatio: number;
  resolution: string;
  preset: GraphicsPreset;
  resolvedQuality: ResolvedQuality;
}

export class GraphicsManager {
  private static instance: GraphicsManager | null = null;
  private currentPreset: GraphicsPreset = 'AUTO';
  private resolvedQuality: ResolvedQuality = 'HIGH';
  private fpsDisplayEnabled: boolean = false;

  // Adaptive Hysteresis Controller
  private frameTimes: number[] = [];
  private readonly WINDOW_SIZE = 180; // ~3 seconds at 60 FPS
  private lowFpsConsecutiveWindows = 0;
  private highFpsConsecutiveWindows = 0;
  private cooldownTimer = 0; // Seconds until next auto adjustment
  private isAutoDowngraded = false;
  private detectedTier: ResolvedQuality = 'HIGH';

  // Benchmark stats
  private lastFps = 60;
  private lastFrameTime = 16.6;

  private eventBus = EventBus.getInstance();

  constructor() {
    this.detectedTier = this.detectHardwareTier();
    const saved = typeof localStorage !== 'undefined' ? (localStorage.getItem('metro_graphics_preset') as GraphicsPreset | null) : null;
    this.currentPreset = saved || 'AUTO';

    this.fpsDisplayEnabled = typeof localStorage !== 'undefined' && localStorage.getItem('metro_show_fps') === 'true';

    if (this.currentPreset === 'AUTO') {
      this.resolvedQuality = this.detectedTier;
    } else {
      this.resolvedQuality = this.currentPreset;
    }
  }

  public static getInstance(): GraphicsManager {
    if (!GraphicsManager.instance) {
      GraphicsManager.instance = new GraphicsManager();
    }
    return GraphicsManager.instance;
  }

  /**
   * Conservative initial hardware assessment based on CPU concurrency, mobile detection, and WebGL GPU string
   */
  public detectHardwareTier(): ResolvedQuality {
    if (typeof window === 'undefined') return 'HIGH';

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    const cores = navigator.hardwareConcurrency || 4;

    // Check WebGL GPU renderer string if available
    let isIntegratedOrMobileGpu = false;
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const rendererStr = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
          if (/Mali|Adreno|PowerVR|Intel HD|Intel UHD|Intel Iris/i.test(rendererStr)) {
            isIntegratedOrMobileGpu = true;
          }
        }
      }
    } catch (_) {
      // Ignore security/context exceptions
    }

    if (isMobile) {
      return cores <= 4 || isIntegratedOrMobileGpu ? 'LOW' : 'MEDIUM';
    }

    if (isIntegratedOrMobileGpu && cores <= 4) {
      return 'MEDIUM';
    }

    return 'HIGH';
  }

  public getPreset(): GraphicsPreset {
    return this.currentPreset;
  }

  public getResolvedQuality(): ResolvedQuality {
    return this.resolvedQuality;
  }

  public isFpsDisplayEnabled(): boolean {
    return this.fpsDisplayEnabled;
  }

  public setFpsDisplayEnabled(enabled: boolean): void {
    this.fpsDisplayEnabled = enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('metro_show_fps', enabled ? 'true' : 'false');
    }
    this.eventBus.emit('FPS_DISPLAY_TOGGLED', enabled);
  }

  public setPreset(preset: GraphicsPreset, notify: boolean = true): QualityConfig {
    this.currentPreset = preset;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('metro_graphics_preset', preset);
    }

    if (preset === 'AUTO') {
      // Reset adaptive window counters and start from hardware tier
      this.lowFpsConsecutiveWindows = 0;
      this.highFpsConsecutiveWindows = 0;
      this.cooldownTimer = 8.0; // Grace period before adaptive shifts
      this.resolvedQuality = this.detectedTier;
    } else {
      this.resolvedQuality = preset;
    }

    const config = this.getConfigForQuality(this.resolvedQuality);

    if (notify) {
      this.eventBus.emit('GRAPHICS_CONFIG_CHANGED', config);
    }

    return config;
  }

  public getConfigForQuality(quality: ResolvedQuality): QualityConfig {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

    switch (quality) {
      case 'LOW':
        return {
          preset: this.currentPreset,
          resolved: 'LOW',
          pixelRatio: 1.0,
          shadowMapEnabled: false,
          shadowMapType: THREE.BasicShadowMap,
          shadowMapSize: 0,
          sceneryDetail: 'MINIMAL',
          cloudsVisible: false,
          skylineVisible: false,
          speedLinesVisible: false,
          particleMultiplier: 0.25,
          contactBlobShadow: true,
          description: 'Battery saver: 1x resolution, shadows disabled, essential scenery only.'
        };
      case 'MEDIUM':
        return {
          preset: this.currentPreset,
          resolved: 'MEDIUM',
          pixelRatio: Math.min(dpr, 1.33),
          shadowMapEnabled: true,
          shadowMapType: THREE.BasicShadowMap,
          shadowMapSize: 1024,
          sceneryDetail: 'BALANCED',
          cloudsVisible: true,
          skylineVisible: true,
          speedLinesVisible: true,
          particleMultiplier: 0.6,
          contactBlobShadow: false,
          description: 'Balanced: 1.33x resolution, 1024px shadows, standard scenery & particles.'
        };
      case 'HIGH':
      default:
        return {
          preset: this.currentPreset,
          resolved: 'HIGH',
          pixelRatio: Math.min(dpr, 2.0),
          shadowMapEnabled: true,
          shadowMapType: THREE.PCFSoftShadowMap,
          shadowMapSize: 2048,
          sceneryDetail: 'FULL',
          cloudsVisible: true,
          skylineVisible: true,
          speedLinesVisible: true,
          particleMultiplier: 1.0,
          contactBlobShadow: false,
          description: 'Maximum fidelity: up to 2x resolution, 2048px PCF soft shadows, rich effects.'
        };
    }
  }

  public getActiveConfig(): QualityConfig {
    return this.getConfigForQuality(this.resolvedQuality);
  }

  /**
   * Per-frame performance sampling and adaptive quality adjustment with hysteresis
   * @param dt Delta time in seconds from game loop
   * @param isPlaying True if an active run is in progress
   */
  public update(dt: number, isPlaying: boolean = true): void {
    const frameMs = dt * 1000;
    this.lastFrameTime = frameMs;
    this.lastFps = dt > 0 ? 1 / dt : 60;

    if (!isPlaying) {
      return; // Do not calibrate during paused menus or loading
    }

    if (this.currentPreset !== 'AUTO') {
      return; // Manual override active; do not adapt
    }

    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
      return;
    }

    this.frameTimes.push(frameMs);
    if (this.frameTimes.length >= this.WINDOW_SIZE) {
      this.evaluateAdaptiveQuality();
      this.frameTimes = [];
    }
  }

  /**
   * Evaluates rolling window with strict hysteresis to prevent quality oscillation
   */
  private evaluateAdaptiveQuality(): void {
    if (this.frameTimes.length === 0) return;

    const sum = this.frameTimes.reduce((acc, v) => acc + v, 0);
    const avgMs = sum / this.frameTimes.length;
    const avgFps = 1000 / avgMs;

    // Sort to compute 95th percentile
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const p95Ms = sorted[Math.floor(sorted.length * 0.95)];

    // Downgrade condition: Average FPS < 45 or 95% frame time > 23ms (~43 FPS)
    if (avgFps < 45 || p95Ms > 23.0) {
      this.lowFpsConsecutiveWindows++;
      this.highFpsConsecutiveWindows = 0;

      if (this.lowFpsConsecutiveWindows >= 2) {
        if (this.resolvedQuality === 'HIGH') {
          this.applyAdaptiveShift('MEDIUM', 'Performance dip detected (<45 FPS)');
        } else if (this.resolvedQuality === 'MEDIUM') {
          this.applyAdaptiveShift('LOW', 'Sustained frame drops (<45 FPS on Medium)');
        }
        this.isAutoDowngraded = true;
        this.cooldownTimer = 14.0; // 14-second hysteresis cooldown
        this.lowFpsConsecutiveWindows = 0;
      }
    }
    // Upgrade condition: Rock-solid performance (avg FPS > 58, p95 < 18ms)
    else if (avgFps >= 58.0 && p95Ms < 18.0) {
      this.highFpsConsecutiveWindows++;
      this.lowFpsConsecutiveWindows = 0;

      // Require 5 consecutive solid windows (15 seconds) before stepping up
      if (this.highFpsConsecutiveWindows >= 5) {
        if (this.resolvedQuality === 'LOW') {
          this.applyAdaptiveShift('MEDIUM', 'Stable high FPS observed on Low');
          this.cooldownTimer = 16.0;
        } else if (this.resolvedQuality === 'MEDIUM' && !this.isAutoDowngraded) {
          this.applyAdaptiveShift('HIGH', 'Headroom confirmed on Medium');
          this.cooldownTimer = 18.0;
        }
        this.highFpsConsecutiveWindows = 0;
      }
    } else {
      // Balanced zone; decay window counters
      this.lowFpsConsecutiveWindows = Math.max(0, this.lowFpsConsecutiveWindows - 1);
      this.highFpsConsecutiveWindows = Math.max(0, this.highFpsConsecutiveWindows - 1);
    }
  }

  private applyAdaptiveShift(newQuality: ResolvedQuality, reason: string): void {
    if (this.resolvedQuality === newQuality) return;
    this.resolvedQuality = newQuality;
    const config = this.getConfigForQuality(newQuality);
    console.log(`[GraphicsManager] Adaptive shift to ${newQuality}: ${reason}`);
    this.eventBus.emit('GRAPHICS_CONFIG_CHANGED', config);
    this.eventBus.emit('GRAPHICS_ADAPTIVE_SHIFT', { quality: newQuality, reason });
  }

  public getSnapshot(renderer?: THREE.WebGLRenderer): PerformanceSnapshot {
    const info = renderer ? renderer.info : null;
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : this.lastFrameTime;
    const p99 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.99)] : this.lastFrameTime;

    return {
      fps: Math.round(this.lastFps),
      frameTimeMs: parseFloat(this.lastFrameTime.toFixed(2)),
      p95FrameTimeMs: parseFloat(p95.toFixed(2)),
      p99FrameTimeMs: parseFloat(p99.toFixed(2)),
      drawCalls: info ? info.render.calls : 0,
      triangles: info ? info.render.triangles : 0,
      pixelRatio: renderer ? renderer.getPixelRatio() : 1,
      resolution: renderer ? `${renderer.domElement.width}x${renderer.domElement.height}` : '1440x900',
      preset: this.currentPreset,
      resolvedQuality: this.resolvedQuality
    };
  }

  public getAverageFPS(): number {
    return Math.round(this.lastFps) || 60;
  }
}
