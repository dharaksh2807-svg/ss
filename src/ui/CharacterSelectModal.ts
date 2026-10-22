import * as THREE from 'three';
import { EventBus, EVENTS } from '../core/EventBus';
import {
  CharacterDefinition,
  OutfitDefinition,
  getAllCharacters,
  getCharacterById
} from '../characters/CharacterCatalog';
import { CharacterModel } from '../player/CharacterModel';
import { ProgressionManager } from '../progression/ProgressionManager';
import { UpgradeManager } from '../player/UpgradeManager';

export class CharacterSelectModal {
  private element: HTMLElement;
  private canvas: HTMLCanvasElement;
  private closeBtn: HTMLButtonElement;
  private prevBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private actionBtn: HTMLButtonElement;
  private charNameEl: HTMLElement;
  private charTitleEl: HTMLElement;
  private charBioEl: HTMLElement;
  private charStatusEl: HTMLElement;
  private outfitListEl: HTMLElement;
  private walletCoinsEl: HTMLElement;
  private characterTabsEl: HTMLElement;

  // 3D Turntable Scene
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private podiumGroup!: THREE.Group;
  private previewModel: CharacterModel | null = null;
  private isRendering: boolean = false;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Turntable interaction
  private turntableRotationY: number = Math.PI;
  private turntableTargetRotationY: number = Math.PI;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartRotation: number = 0;
  private dragVelocity: number = 0;
  private lastDragX: number = 0;
  private lastDragTime: number = 0;
  private idleTimeWithoutInteraction: number = 0;

  // State
  private characters: CharacterDefinition[];
  private currentCharacterIndex: number = 0;
  private selectedOutfitId: string = '';
  private previousScreen: 'START' | 'PAUSE' = 'START';
  private progression: ProgressionManager;
  private upgradeManager: UpgradeManager;

  constructor() {
    this.element = document.getElementById('character-select-modal')!;
    this.canvas = document.getElementById('char-preview-canvas') as HTMLCanvasElement;
    this.closeBtn = document.getElementById('char-close-btn') as HTMLButtonElement;
    this.prevBtn = document.getElementById('char-prev-btn') as HTMLButtonElement;
    this.nextBtn = document.getElementById('char-next-btn') as HTMLButtonElement;
    this.actionBtn = document.getElementById('char-action-btn') as HTMLButtonElement;
    this.charNameEl = document.getElementById('char-name')!;
    this.charTitleEl = document.getElementById('char-title')!;
    this.charBioEl = document.getElementById('char-bio')!;
    this.charStatusEl = document.getElementById('char-status-badge')!;
    this.outfitListEl = document.getElementById('char-outfit-list')!;
    this.walletCoinsEl = document.getElementById('char-wallet-coins')!;
    this.characterTabsEl = document.getElementById('char-tabs')!;

    this.characters = getAllCharacters();
    this.progression = ProgressionManager.getInstance();
    this.upgradeManager = UpgradeManager.getInstance();

    this.init3DScene();
    this.setupEventListeners();
    this.setupInteraction();
  }

  private init3DScene(): void {
    if (!this.canvas) return;

    this.scene = new THREE.Scene();

    // Perspective Camera tailored for full-body showroom framing
    this.camera = new THREE.PerspectiveCamera(42, this.canvas.clientWidth / (this.canvas.clientHeight || 1), 0.1, 50);
    this.camera.position.set(0, 1.15, 3.8);
    this.camera.lookAt(0, 0.95, 0);

    // High performance WebGLRenderer with antialiasing
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

    const cyanRimLight = new THREE.DirectionalLight(0x00e5ff, 1.4);
    cyanRimLight.position.set(-3, 2, -2);
    this.scene.add(cyanRimLight);

    const warmFillLight = new THREE.DirectionalLight(0xff9100, 0.8);
    warmFillLight.position.set(2, -1, 2);
    this.scene.add(warmFillLight);

    // Illuminated Showroom Podium
    this.podiumGroup = new THREE.Group();
    this.scene.add(this.podiumGroup);

    const baseGeo = new THREE.CylinderGeometry(1.4, 1.55, 0.14, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x181e28,
      roughness: 0.35,
      metalness: 0.8
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.07;
    baseMesh.receiveShadow = true;
    this.podiumGroup.add(baseMesh);

    // Glowing Neon Edge Ring
    const ringGeo = new THREE.TorusGeometry(1.42, 0.035, 10, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.005;
    this.podiumGroup.add(ringMesh);

    // Subtle inner glowing turntable disc
    const innerDiscGeo = new THREE.CircleGeometry(1.3, 32);
    innerDiscGeo.rotateX(-Math.PI / 2);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x0d121a,
      roughness: 0.2,
      metalness: 0.9
    });
    const discMesh = new THREE.Mesh(innerDiscGeo, discMat);
    discMesh.position.y = 0.01;
    this.podiumGroup.add(discMesh);
  }

  private setupEventListeners(): void {
    const bus = EventBus.getInstance();

    bus.on('OPEN_CHARACTERS', (source: 'START' | 'PAUSE' = 'START') => {
      this.previousScreen = source;
      this.show();
    });

    bus.on('WALLET_UPDATED', (coins: number) => {
      this.updateWalletDisplay(coins);
    });

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.hide());
    }

    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.navigateCharacter(-1));
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.navigateCharacter(1));
    }

    if (this.actionBtn) {
      this.actionBtn.addEventListener('click', () => this.handleActionButtonClick());
    }

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (!this.element.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          this.navigateCharacter(-1);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          this.navigateCharacter(1);
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
      const deltaX = clientX - this.dragStartX;
      const frameDelta = clientX - this.lastDragX;

      this.dragVelocity = (frameDelta / dt) * 0.015;
      this.lastDragX = clientX;
      this.lastDragTime = now;

      // Sensitivity: drag horizontally rotates around Y
      this.turntableTargetRotationY = this.dragStartRotation + deltaX * 0.012;
      this.idleTimeWithoutInteraction = 0;
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    this.canvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX));
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX));
    window.addEventListener('mouseup', () => onPointerUp());

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        onPointerDown(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        onPointerMove(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => onPointerUp(), { passive: true });
  }

  public show(): void {
    this.element.classList.remove('hidden');
    this.updateWalletDisplay(this.upgradeManager.getCoins());

    // Select currently equipped character
    const equippedCharId = this.progression.getSelectedCharacter();
    const foundIdx = this.characters.findIndex((c) => c.id === equippedCharId);
    this.currentCharacterIndex = foundIdx !== -1 ? foundIdx : 0;

    const currentChar = this.characters[this.currentCharacterIndex];
    this.selectedOutfitId = this.progression.getSelectedOutfit(currentChar.id);
    this.turntableRotationY = Math.PI;
    this.turntableTargetRotationY = Math.PI;
    this.dragVelocity = 0;

    this.renderCharacterTabs();
    this.updateCharacterView();

    this.isRendering = true;
    this.lastTime = performance.now();
    this.resizeViewport();
    this.startRenderLoop();
  }

  public hide(): void {
    this.element.classList.add('hidden');
    this.isRendering = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    // Return to previous screen
    if (this.previousScreen === 'START') {
      const startScreenEl = document.getElementById('start-screen');
      if (startScreenEl) startScreenEl.classList.remove('hidden');
    } else if (this.previousScreen === 'PAUSE') {
      const pauseModalEl = document.getElementById('pause-modal');
      if (pauseModalEl) pauseModalEl.classList.remove('hidden');
    }
  }

  private resizeViewport(): void {
    if (!this.canvas || !this.renderer) return;
    const width = this.canvas.clientWidth || 400;
    const height = this.canvas.clientHeight || 500;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private navigateCharacter(direction: number): void {
    this.currentCharacterIndex = (this.currentCharacterIndex + direction + this.characters.length) % this.characters.length;
    const currentChar = this.characters[this.currentCharacterIndex];
    this.selectedOutfitId = this.progression.getSelectedOutfit(currentChar.id);

    // Face character toward camera on navigate
    this.turntableTargetRotationY = Math.PI;
    this.turntableRotationY = Math.PI;
    this.dragVelocity = 0;

    this.renderCharacterTabs();
    this.updateCharacterView();
  }

  private renderCharacterTabs(): void {
    if (!this.characterTabsEl) return;
    this.characterTabsEl.innerHTML = '';

    this.characters.forEach((char, idx) => {
      const tab = document.createElement('button');
      tab.className = `char-tab ${idx === this.currentCharacterIndex ? 'active' : ''}`;
      const isUnlocked = this.progression.isCharacterUnlocked(char.id);

      tab.innerHTML = `
        <span class="tab-icon">${char.portraitIcon}</span>
        <span class="tab-name">${char.name}</span>
        ${!isUnlocked ? '<span class="tab-lock">🔒</span>' : ''}
      `;

      tab.addEventListener('click', () => {
        this.currentCharacterIndex = idx;
        this.selectedOutfitId = this.progression.getSelectedOutfit(char.id);
        this.turntableTargetRotationY = Math.PI;
        this.turntableRotationY = Math.PI;
        this.renderCharacterTabs();
        this.updateCharacterView();
      });

      this.characterTabsEl.appendChild(tab);
    });
  }

  private updateCharacterView(): void {
    const char = this.characters[this.currentCharacterIndex];
    if (!char) return;

    // Update Text
    this.charNameEl.textContent = char.name.toUpperCase();
    this.charTitleEl.textContent = char.title;
    this.charBioEl.textContent = char.bio;

    const isCharUnlocked = this.progression.isCharacterUnlocked(char.id);
    const equippedCharId = this.progression.getSelectedCharacter();
    const equippedOutfitId = this.progression.getSelectedOutfit(char.id);
    const isEquipped = isCharUnlocked && char.id === equippedCharId && this.selectedOutfitId === equippedOutfitId;

    // Status Badge
    if (isEquipped) {
      this.charStatusEl.textContent = 'ACTIVE RUNNER';
      this.charStatusEl.className = 'status-badge active-badge';
    } else if (isCharUnlocked) {
      this.charStatusEl.textContent = 'UNLOCKED';
      this.charStatusEl.className = 'status-badge unlocked-badge';
    } else {
      this.charStatusEl.textContent = 'LOCKED';
      this.charStatusEl.className = 'status-badge locked-badge';
    }

    // Render Outfits
    this.renderOutfitsList(char);

    // Update 3D Preview Model
    this.updatePreviewModel(char.id, this.selectedOutfitId);

    // Update Action Button
    this.updateActionButton(char);
  }

  private renderOutfitsList(char: CharacterDefinition): void {
    if (!this.outfitListEl) return;
    this.outfitListEl.innerHTML = '';

    char.outfits.forEach((outfit) => {
      const isOutfitUnlocked = this.progression.isOutfitUnlocked(char.id, outfit.id);
      const isSelected = outfit.id === this.selectedOutfitId;
      const equippedOutfitId = this.progression.getSelectedOutfit(char.id);
      const isEquipped = isOutfitUnlocked && outfit.id === equippedOutfitId && char.id === this.progression.getSelectedCharacter();

      const card = document.createElement('div');
      card.className = `outfit-card ${isSelected ? 'selected' : ''} ${isOutfitUnlocked ? 'unlocked' : 'locked'}`;

      let badgeHtml = '';
      if (isEquipped) {
        badgeHtml = `<span class="outfit-badge equipped">EQUIPPED</span>`;
      } else if (!isOutfitUnlocked) {
        if (outfit.unlock.type === 'COINS') {
          badgeHtml = `<span class="outfit-badge price">🪙 ${outfit.unlock.cost?.toLocaleString()}</span>`;
        } else {
          badgeHtml = `<span class="outfit-badge lock">🔒 LOCKED</span>`;
        }
      }

      card.innerHTML = `
        <div class="outfit-icon">${outfit.icon}</div>
        <div class="outfit-info">
          <div class="outfit-name">${outfit.name}</div>
          <div class="outfit-desc">${outfit.tagline}</div>
        </div>
        ${badgeHtml}
      `;

      card.addEventListener('click', () => {
        this.selectedOutfitId = outfit.id;
        this.updateCharacterView();
      });

      this.outfitListEl.appendChild(card);
    });
  }

  private updatePreviewModel(characterId: any, outfitId: string): void {
    if (this.previewModel) {
      this.previewModel.applyCharacter(characterId, outfitId);
    } else {
      this.previewModel = new CharacterModel(characterId, outfitId);
      this.scene.add(this.previewModel.mesh);
    }
  }

  private updateActionButton(char: CharacterDefinition): void {
    const isCharUnlocked = this.progression.isCharacterUnlocked(char.id);
    const selectedOutfit = char.outfits.find((o) => o.id === this.selectedOutfitId) || char.outfits[0];
    const isOutfitUnlocked = this.progression.isOutfitUnlocked(char.id, selectedOutfit.id);
    const equippedCharId = this.progression.getSelectedCharacter();
    const equippedOutfitId = this.progression.getSelectedOutfit(char.id);
    const isCurrentlyEquipped = isCharUnlocked && char.id === equippedCharId && selectedOutfit.id === equippedOutfitId;
    const coins = this.upgradeManager.getCoins();

    if (isCurrentlyEquipped) {
      this.actionBtn.textContent = '✓ EQUIPPED';
      this.actionBtn.className = 'btn btn-action equipped';
      this.actionBtn.disabled = true;
      return;
    }

    if (!isCharUnlocked) {
      // Character is locked
      if (char.unlock.type === 'COINS') {
        const cost = char.unlock.cost || 0;
        const canAfford = coins >= cost;
        this.actionBtn.textContent = `UNLOCK FOR ${cost.toLocaleString()} 🪙`;
        this.actionBtn.className = `btn btn-action ${canAfford ? 'purchase' : 'disabled'}`;
        this.actionBtn.disabled = !canAfford;
      } else {
        this.actionBtn.textContent = `🔒 ${char.unlock.description}`;
        this.actionBtn.className = 'btn btn-action disabled';
        this.actionBtn.disabled = true;
      }
      return;
    }

    // Character is unlocked, check outfit
    if (!isOutfitUnlocked) {
      if (selectedOutfit.unlock.type === 'COINS') {
        const cost = selectedOutfit.unlock.cost || 0;
        const canAfford = coins >= cost;
        this.actionBtn.textContent = `UNLOCK OUTFIT (${cost.toLocaleString()} 🪙)`;
        this.actionBtn.className = `btn btn-action ${canAfford ? 'purchase' : 'disabled'}`;
        this.actionBtn.disabled = !canAfford;
      } else {
        this.actionBtn.textContent = `🔒 ${selectedOutfit.unlock.description}`;
        this.actionBtn.className = 'btn btn-action disabled';
        this.actionBtn.disabled = true;
      }
      return;
    }

    // Both character and outfit are unlocked -> Can Equip!
    this.actionBtn.textContent = '⚡ EQUIP RUNNER';
    this.actionBtn.className = 'btn btn-action equip';
    this.actionBtn.disabled = false;
  }

  private handleActionButtonClick(): void {
    const char = this.characters[this.currentCharacterIndex];
    if (!char) return;

    const isCharUnlocked = this.progression.isCharacterUnlocked(char.id);
    const selectedOutfit = char.outfits.find((o) => o.id === this.selectedOutfitId) || char.outfits[0];
    const isOutfitUnlocked = this.progression.isOutfitUnlocked(char.id, selectedOutfit.id);

    if (!isCharUnlocked) {
      // Purchase Character
      const res = this.progression.purchaseCharacter(char.id);
      if (res.success) {
        this.updateWalletDisplay(this.upgradeManager.getCoins());
        this.renderCharacterTabs();
        this.updateCharacterView();
      }
      return;
    }

    if (!isOutfitUnlocked) {
      // Purchase Outfit
      const res = this.progression.purchaseOutfit(char.id, selectedOutfit.id);
      if (res.success) {
        this.updateWalletDisplay(this.upgradeManager.getCoins());
        this.updateCharacterView();
      }
      return;
    }

    // Equip
    this.progression.equipCharacter(char.id, selectedOutfit.id);
    this.renderCharacterTabs();
    this.updateCharacterView();
  }

  private updateWalletDisplay(coins: number): void {
    if (this.walletCoinsEl) {
      this.walletCoinsEl.textContent = `🪙 ${coins.toLocaleString()}`;
    }
  }

  private startRenderLoop(): void {
    const loop = (currentTime: number) => {
      if (!this.isRendering) return;

      const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      // Turntable physics & inertia
      if (!this.isDragging) {
        this.idleTimeWithoutInteraction += dt;

        // Apply rotational inertia
        if (Math.abs(this.dragVelocity) > 0.0001) {
          this.turntableTargetRotationY += this.dragVelocity;
          this.dragVelocity *= 0.92; // Friction dampening
        } else {
          // Subtle showcase auto-spin when idle
          if (this.idleTimeWithoutInteraction > 1.8) {
            this.turntableTargetRotationY += dt * 0.45;
          }
        }
      }

      // Smooth interpolation toward target rotation
      this.turntableRotationY += (this.turntableTargetRotationY - this.turntableRotationY) * 0.15;

      if (this.previewModel) {
        this.previewModel.mesh.rotation.y = this.turntableRotationY;
        this.previewModel.animateTurntableIdle(dt);
      }

      if (this.podiumGroup) {
        this.podiumGroup.rotation.y = this.turntableRotationY * 0.5;
      }

      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }
}
