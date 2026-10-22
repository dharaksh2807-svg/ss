import * as THREE from 'three';
import {
  HoverboardDefinition,
  HoverboardId,
  getAllHoverboards,
  getHoverboardById,
  HOVERBOARD_CHARGES_PACK
} from '../hoverboard/HoverboardCatalog';
import { HoverboardMeshBuilder, BuiltHoverboard } from '../hoverboard/HoverboardMeshBuilder';
import { HoverboardManager } from '../hoverboard/HoverboardManager';
import { ProgressionManager } from '../progression/ProgressionManager';
import { UpgradeManager } from '../player/UpgradeManager';
import { EventBus } from '../core/EventBus';

export class HoverboardSelectModal {
  private element: HTMLElement;
  private canvas: HTMLCanvasElement;
  private closeBtn: HTMLButtonElement;
  private prevBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private actionBtn: HTMLButtonElement;
  private buyChargesBtn: HTMLButtonElement;
  private boardNameEl: HTMLElement;
  private boardArchetypeEl: HTMLElement;
  private boardBioEl: HTMLElement;
  private boardStatusEl: HTMLElement;
  private abilityDetailsEl: HTMLElement;
  private walletCoinsEl: HTMLElement;
  private boardChargesEl: HTMLElement;
  private boardTabsEl: HTMLElement;

  // Three.js Showroom Scene
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private podiumGroup!: THREE.Group;
  private previewBoardGroup!: THREE.Group;
  private currentPreviewBuilt: BuiltHoverboard | null = null;
  private animFrameId: number | null = null;
  private isRendering: boolean = false;
  private lastTime: number = 0;

  // Turntable Rotation Interaction
  private turntableRotationY: number = 0;
  private turntableTargetRotationY: number = 0;
  private dragVelocity: number = 0;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartRotation: number = 0;
  private lastDragX: number = 0;
  private lastDragTime: number = 0;
  private idleTimeWithoutInteraction: number = 0;

  // State
  private boards: HoverboardDefinition[];
  private currentBoardIndex: number = 0;
  private previousScreen: 'START' | 'PAUSE' | 'GAMEOVER' = 'START';
  private progression: ProgressionManager;
  private upgradeManager: UpgradeManager;
  private hoverboardManager: HoverboardManager;

  constructor() {
    this.element = document.getElementById('hoverboard-select-modal')!;
    this.canvas = document.getElementById('board-preview-canvas') as HTMLCanvasElement;
    this.closeBtn = document.getElementById('board-close-btn') as HTMLButtonElement;
    this.prevBtn = document.getElementById('board-prev-btn') as HTMLButtonElement;
    this.nextBtn = document.getElementById('board-next-btn') as HTMLButtonElement;
    this.actionBtn = document.getElementById('board-action-btn') as HTMLButtonElement;
    this.buyChargesBtn = document.getElementById('board-buy-charges-btn') as HTMLButtonElement;
    this.boardNameEl = document.getElementById('board-name')!;
    this.boardArchetypeEl = document.getElementById('board-archetype')!;
    this.boardBioEl = document.getElementById('board-bio')!;
    this.boardStatusEl = document.getElementById('board-status-badge')!;
    this.abilityDetailsEl = document.getElementById('board-ability-details')!;
    this.walletCoinsEl = document.getElementById('board-wallet-coins')!;
    this.boardChargesEl = document.getElementById('board-charges-count')!;
    this.boardTabsEl = document.getElementById('board-tabs')!;

    this.boards = getAllHoverboards();
    this.progression = ProgressionManager.getInstance();
    this.upgradeManager = UpgradeManager.getInstance();
    this.hoverboardManager = HoverboardManager.getInstance();

    this.init3DScene();
    this.setupEventListeners();
    this.setupInteraction();
  }

  private init3DScene(): void {
    if (!this.canvas) return;

    this.scene = new THREE.Scene();

    // Perspective Camera tailored for dynamic 3/4 hoverboard showcase
    this.camera = new THREE.PerspectiveCamera(38, this.canvas.clientWidth / (this.canvas.clientHeight || 1), 0.1, 50);
    this.camera.position.set(0, 0.9, 2.8);
    this.camera.lookAt(0, 0.1, 0);

    // High performance WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.canvas.clientWidth || 400, this.canvas.clientHeight || 500, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    mainKeyLight.position.set(2, 4, 3);
    mainKeyLight.castShadow = true;
    this.scene.add(mainKeyLight);

    const cyanRimLight = new THREE.DirectionalLight(0x00e5ff, 1.5);
    cyanRimLight.position.set(-3, 2, -2);
    this.scene.add(cyanRimLight);

    const magentaFillLight = new THREE.DirectionalLight(0xe040fb, 0.9);
    magentaFillLight.position.set(2, -1, 2);
    this.scene.add(magentaFillLight);

    // Illuminated Showroom Podium
    this.podiumGroup = new THREE.Group();
    this.scene.add(this.podiumGroup);

    const baseGeo = new THREE.CylinderGeometry(1.3, 1.45, 0.12, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x141822,
      roughness: 0.35,
      metalness: 0.8
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.06;
    baseMesh.receiveShadow = true;
    this.podiumGroup.add(baseMesh);

    // Glowing Neon Edge Ring
    const ringGeo = new THREE.TorusGeometry(1.32, 0.03, 10, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.005;
    this.podiumGroup.add(ringMesh);

    // Turntable board preview mount group
    this.previewBoardGroup = new THREE.Group();
    this.podiumGroup.add(this.previewBoardGroup);
  }

  private setupEventListeners(): void {
    const bus = EventBus.getInstance();

    bus.on('OPEN_BOARDS', (source: 'START' | 'PAUSE' | 'GAMEOVER' = 'START') => {
      this.previousScreen = source;
      this.show();
    });

    bus.on('WALLET_UPDATED', (coins: number) => {
      this.updateWalletDisplay(coins);
    });

    bus.on('BOARD_CHARGES_UPDATED', (charges: number) => {
      this.updateChargesDisplay(charges);
    });

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.hide());
    }

    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.navigateBoard(-1));
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.navigateBoard(1));
    }

    if (this.actionBtn) {
      this.actionBtn.addEventListener('click', () => this.handleActionButtonClick());
    }

    if (this.buyChargesBtn) {
      this.buyChargesBtn.addEventListener('click', () => this.handleBuyChargesClick());
    }

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (!this.element.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          this.navigateBoard(-1);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          this.navigateBoard(1);
        } else if (e.key === 'Escape') {
          this.hide();
        } else if (e.key === 'Enter') {
          this.handleActionButtonClick();
        }
      }
    });

    window.addEventListener('resize', () => {
      if (this.isRendering) {
        this.resizeViewport();
      }
    });
  }

  private setupInteraction(): void {
    if (!this.canvas) return;

    const onPointerDown = (clientX: number) => {
      this.isDragging = true;
      this.dragStartX = clientX;
      this.dragStartRotation = this.turntableRotationY;
      this.dragVelocity = 0;
      this.lastDragX = clientX;
      this.lastDragTime = performance.now();
      this.idleTimeWithoutInteraction = 0;
    };

    const onPointerMove = (clientX: number) => {
      if (!this.isDragging) return;
      const now = performance.now();
      const dt = Math.max(1, now - this.lastDragTime);
      const frameDelta = clientX - this.lastDragX;

      this.dragVelocity = (frameDelta / dt) * 0.015;
      this.lastDragX = clientX;
      this.lastDragTime = now;

      const deltaX = clientX - this.dragStartX;
      this.turntableTargetRotationY = this.dragStartRotation + deltaX * 0.012;
      this.idleTimeWithoutInteraction = 0;
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX));
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX));
    window.addEventListener('mouseup', onPointerUp);

    // Touch events for mobile
    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length > 0) onPointerDown(e.touches[0].clientX);
      },
      { passive: true }
    );
    window.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length > 0) onPointerMove(e.touches[0].clientX);
      },
      { passive: true }
    );
    window.addEventListener('touchend', onPointerUp);
  }

  public show(): void {
    this.element.classList.remove('hidden');

    // Update wallet and charges
    this.updateWalletDisplay(this.upgradeManager.getCoins());
    this.updateChargesDisplay(this.progression.getHoverboardCharges());

    // Sync selected board index
    const equippedBoardId = this.progression.getSelectedBoard();
    const idx = this.boards.findIndex((b) => b.id === equippedBoardId);
    this.currentBoardIndex = idx >= 0 ? idx : 0;

    // Reset turntable
    this.turntableRotationY = 0.4;
    this.turntableTargetRotationY = 0.4;
    this.dragVelocity = 0;

    this.renderBoardTabs();
    this.updateBoardView();

    this.isRendering = true;
    this.lastTime = performance.now();
    this.resizeViewport();
    this.startRenderLoop();
  }

  public hide(reopenPrevious: boolean = true): void {
    this.element.classList.add('hidden');
    this.isRendering = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    // Return to previous screen if requested
    if (reopenPrevious) {
      if (this.previousScreen === 'START') {
        const startScreenEl = document.getElementById('start-screen');
        if (startScreenEl) startScreenEl.classList.remove('hidden');
      } else if (this.previousScreen === 'PAUSE') {
        const pauseModalEl = document.getElementById('pause-modal');
        if (pauseModalEl) pauseModalEl.classList.remove('hidden');
      } else if (this.previousScreen === 'GAMEOVER') {
        const gameOverEl = document.getElementById('game-over-modal');
        if (gameOverEl) gameOverEl.classList.remove('hidden');
      }
    }
  }

  private resizeViewport(): void {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const width = this.canvas.clientWidth || 400;
    const height = this.canvas.clientHeight || 500;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public navigateBoard(direction: number): void {
    this.currentBoardIndex = (this.currentBoardIndex + direction + this.boards.length) % this.boards.length;
    this.renderBoardTabs();
    this.updateBoardView();
  }

  public selectBoardByIndex(index: number): void {
    if (index >= 0 && index < this.boards.length) {
      this.currentBoardIndex = index;
      this.renderBoardTabs();
      this.updateBoardView();
    }
  }

  private renderBoardTabs(): void {
    if (!this.boardTabsEl) return;
    this.boardTabsEl.innerHTML = '';

    this.boards.forEach((board, idx) => {
      const isUnlocked = this.progression.isBoardUnlocked(board.id);
      const isSelected = idx === this.currentBoardIndex;

      const tab = document.createElement('button');
      tab.className = `char-tab ${isSelected ? 'active' : ''}`;
      tab.innerHTML = `
        <span class="char-tab-icon">${board.icon}</span>
        <span class="char-tab-name">${board.name}</span>
        ${!isUnlocked ? '<span class="char-tab-lock">🔒</span>' : ''}
      `;

      tab.addEventListener('click', () => {
        this.selectBoardByIndex(idx);
      });

      this.boardTabsEl.appendChild(tab);
    });
  }

  private updateBoardView(): void {
    const board = this.boards[this.currentBoardIndex];
    if (!board) return;

    const isUnlocked = this.progression.isBoardUnlocked(board.id);
    const equippedBoardId = this.progression.getSelectedBoard();
    const isEquipped = isUnlocked && board.id === equippedBoardId;

    // Header info
    if (this.boardNameEl) this.boardNameEl.textContent = board.name;
    if (this.boardArchetypeEl) this.boardArchetypeEl.textContent = board.archetype.toUpperCase();
    if (this.boardBioEl) this.boardBioEl.textContent = board.description;

    // Status Badge
    if (this.boardStatusEl) {
      if (isEquipped) {
        this.boardStatusEl.textContent = 'EQUIPPED';
        this.boardStatusEl.className = 'status-badge equipped';
      } else if (isUnlocked) {
        this.boardStatusEl.textContent = 'OWNED';
        this.boardStatusEl.className = 'status-badge unlocked';
      } else {
        this.boardStatusEl.textContent = 'LOCKED';
        this.boardStatusEl.className = 'status-badge locked';
      }
    }

    // Ability and Stats Details Card
    this.renderAbilityDetails(board);

    // Update 3D Preview Model
    this.updatePreviewBoard(board.id);

    // Update Action Button
    this.updateActionButton(board);
  }

  private renderAbilityDetails(board: HoverboardDefinition): void {
    if (!this.abilityDetailsEl) return;

    const ab = board.ability;
    let perksHtml = '';

    if (ab.speedMultiplier) {
      perksHtml += `<div class="ability-perk-badge speed">🚀 +${Math.round((ab.speedMultiplier - 1) * 100)}% Speed</div>`;
    }
    if (ab.scoreMultiplierBonus) {
      perksHtml += `<div class="ability-perk-badge score">⚡ +${ab.scoreMultiplierBonus}X Score Mult</div>`;
    }
    if (ab.jumpVelocityMultiplier) {
      perksHtml += `<div class="ability-perk-badge jump">🦘 +${Math.round((ab.jumpVelocityMultiplier - 1) * 100)}% Jump Height</div>`;
    }
    if (ab.gravityMultiplier) {
      perksHtml += `<div class="ability-perk-badge float">🪶 Low-Gravity Float</div>`;
    }
    if (ab.laneChangeSpeedMultiplier) {
      perksHtml += `<div class="ability-perk-badge drift">🌀 +35% Snappy Drift</div>`;
    }
    if (ab.magnetRadiusBonus) {
      perksHtml += `<div class="ability-perk-badge magnet">🧲 +${ab.magnetRadiusBonus}m Magnet Aura</div>`;
    }
    if (ab.protectionRecoveryDuration) {
      perksHtml += `<div class="ability-perk-badge shield">🛡️ ${ab.protectionRecoveryDuration}s Crash Shield</div>`;
    }

    this.abilityDetailsEl.innerHTML = `
      <div class="board-ability-card">
        <div class="ability-header">
          <div class="ability-icon-circle">${ab.icon}</div>
          <div class="ability-title-col">
            <div class="ability-name">${ab.name}</div>
            <div class="ability-tagline">${ab.tagline}</div>
          </div>
        </div>
        <div class="ability-desc">${ab.description}</div>
        <div class="ability-perks-row">${perksHtml}</div>
        <div class="ability-specs-footer">
          <div class="spec-item"><span class="spec-label">Duration:</span> <span class="spec-val">${board.duration}s</span></div>
          <div class="spec-item"><span class="spec-label">Cooldown:</span> <span class="spec-val">${board.cooldown}s</span></div>
          <div class="spec-item"><span class="spec-label">Protection:</span> <span class="spec-val">Lethal Obstacles</span></div>
        </div>
      </div>
    `;
  }

  private updatePreviewBoard(boardId: HoverboardId): void {
    if (!this.previewBoardGroup) return;

    // Dispose old preview
    while (this.previewBoardGroup.children.length > 0) {
      const child = this.previewBoardGroup.children[0];
      this.previewBoardGroup.remove(child);
    }
    if (this.currentPreviewBuilt) {
      for (const mat of this.currentPreviewBuilt.materials) {
        mat.dispose();
      }
    }

    this.currentPreviewBuilt = HoverboardMeshBuilder.build(boardId);
    // Position comfortably above showroom podium
    this.currentPreviewBuilt.group.position.set(0, 0.22, 0);
    this.previewBoardGroup.add(this.currentPreviewBuilt.group);
  }

  private updateActionButton(board: HoverboardDefinition): void {
    const isUnlocked = this.progression.isBoardUnlocked(board.id);
    const equippedBoardId = this.progression.getSelectedBoard();
    const isCurrentlyEquipped = isUnlocked && board.id === equippedBoardId;
    const coins = this.upgradeManager.getCoins();

    if (isCurrentlyEquipped) {
      this.actionBtn.textContent = '✓ EQUIPPED';
      this.actionBtn.className = 'btn btn-action equipped';
      this.actionBtn.disabled = true;
      return;
    }

    if (!isUnlocked) {
      if (board.unlock.type === 'COINS') {
        const cost = board.unlock.cost || 0;
        const canAfford = coins >= cost;
        this.actionBtn.textContent = `UNLOCK FOR ${cost.toLocaleString()} 🪙`;
        this.actionBtn.className = `btn btn-action ${canAfford ? 'purchase' : 'disabled'}`;
        this.actionBtn.disabled = !canAfford;
      } else {
        this.actionBtn.textContent = `🔒 ${board.unlock.description}`;
        this.actionBtn.className = 'btn btn-action disabled';
        this.actionBtn.disabled = true;
      }
      return;
    }

    // Unlocked -> Can Equip!
    this.actionBtn.textContent = '⚡ EQUIP HOVERBOARD';
    this.actionBtn.className = 'btn btn-action equip';
    this.actionBtn.disabled = false;
  }

  private handleActionButtonClick(): void {
    const board = this.boards[this.currentBoardIndex];
    if (!board) return;

    const isUnlocked = this.progression.isBoardUnlocked(board.id);

    if (!isUnlocked) {
      // Purchase Board
      const res = this.progression.purchaseBoard(board.id);
      if (res.success) {
        this.updateWalletDisplay(this.upgradeManager.getCoins());
        this.renderBoardTabs();
        this.updateBoardView();
      }
      return;
    }

    // Equip
    this.progression.equipBoard(board.id);
    this.renderBoardTabs();
    this.updateBoardView();
  }

  private handleBuyChargesClick(): void {
    const res = this.progression.purchaseHoverboardCharges();
    if (res.success) {
      this.updateWalletDisplay(this.upgradeManager.getCoins());
      this.updateChargesDisplay(this.progression.getHoverboardCharges());
    }
  }

  private updateWalletDisplay(coins: number): void {
    if (this.walletCoinsEl) {
      this.walletCoinsEl.textContent = `🪙 ${coins.toLocaleString()}`;
    }
  }

  private updateChargesDisplay(charges: number): void {
    if (this.boardChargesEl) {
      this.boardChargesEl.textContent = `🛹 ${charges} Charges`;
    }
  }

  private startRenderLoop(): void {
    const loop = (currentTime: number) => {
      if (!this.isRendering) return;

      const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      // Inertia & smoothing
      if (!this.isDragging) {
        this.idleTimeWithoutInteraction += dt;

        // Auto gentle idle spin when user is not dragging
        if (this.idleTimeWithoutInteraction > 1.2) {
          this.turntableTargetRotationY += dt * 0.45;
        }

        // Apply drag momentum decay
        this.turntableTargetRotationY += this.dragVelocity;
        this.dragVelocity *= Math.exp(-6.0 * dt);
      }

      // Smooth lerp to target rotation
      this.turntableRotationY += (this.turntableTargetRotationY - this.turntableRotationY) * Math.min(1.0, dt * 10.0);

      if (this.podiumGroup) {
        this.podiumGroup.rotation.y = this.turntableRotationY;
      }

      // Floating board hover bobbing
      if (this.currentPreviewBuilt) {
        const t = currentTime * 0.003;
        this.currentPreviewBuilt.group.position.y = 0.22 + Math.sin(t) * 0.04;
        this.currentPreviewBuilt.group.rotation.z = Math.sin(t * 0.7) * 0.05;
        this.currentPreviewBuilt.updateAnimation(t * 5.0, dt);
      }

      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }
}
