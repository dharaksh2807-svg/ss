import * as THREE from 'three';

/**
 * Procedural texture generator for stylized PBR materials.
 * Generates lightweight, crisp canvas textures for tracks, trains, buildings, and props.
 */
export class TextureGenerator {
  private static cache: Map<string, THREE.CanvasTexture> = new Map();

  /**
   * Helper to retrieve or generate a cached texture.
   */
  private static getOrCreate(key: string, createFn: () => THREE.CanvasTexture): THREE.Texture {
    if (typeof document === 'undefined') {
      return new THREE.Texture();
    }
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    const tex = createFn();
    this.cache.set(key, tex);
    return tex;
  }

  /**
   * Railroad Ballast Stone Texture (Stylized crushed granite/gravel)
   */
  public static getBallastTexture(): THREE.Texture {
    return this.getOrCreate('ballast', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Dark slate background
      ctx.fillStyle = '#2c2738';
      ctx.fillRect(0, 0, size, size);

      // Stylized pebble speckles in 3 tones
      const colors = ['#3f384d', '#4f4760', '#201c2a', '#5a526d'];
      for (let i = 0; i < 900; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 1.5 + Math.random() * 3.5;
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.8, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 32);
      return tex;
    });
  }

  /**
   * Weathered Brick Texture with Mortar Lines
   */
  public static getBrickTexture(brickColor: string, mortarColor = '#d9d2c9'): THREE.Texture {
    return this.getOrCreate(`brick_${brickColor}`, () => {
      const w = 256;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Mortar base
      ctx.fillStyle = mortarColor;
      ctx.fillRect(0, 0, w, h);

      const rows = 16;
      const rowHeight = h / rows;
      const brickWidth = 32;

      for (let r = 0; r < rows; r++) {
        const isOffset = r % 2 === 1;
        const startX = isOffset ? -brickWidth / 2 : 0;
        const y = r * rowHeight + 1.5;
        const bh = rowHeight - 3;

        for (let x = startX; x < w + brickWidth; x += brickWidth) {
          // Subtle color variation per brick
          ctx.fillStyle = brickColor;
          ctx.fillRect(x + 1.5, y, brickWidth - 3, bh);

          // Subtle brick bevel highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.fillRect(x + 1.5, y, brickWidth - 3, 2);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
          ctx.fillRect(x + 1.5, y + bh - 2, brickWidth - 3, 2);
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 4);
      return tex;
    });
  }

  /**
   * Concrete Wall / Retaining Wall with Seams and Expansion Joints
   */
  public static getConcreteTexture(): THREE.Texture {
    return this.getOrCreate('concrete', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#686b75';
      ctx.fillRect(0, 0, size, size);

      // Subtle noise
      for (let i = 0; i < 400; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
        ctx.fillRect(Math.random() * size, Math.random() * size, 3, 3);
      }

      // Panel joint lines
      ctx.strokeStyle = '#434650';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, size / 2);
      ctx.lineTo(size, size / 2);
      ctx.moveTo(size / 2, 0);
      ctx.lineTo(size / 2, size);
      ctx.stroke();

      // Tie hole circles
      const holes = [
        [32, 32], [size - 32, 32],
        [32, size - 32], [size - 32, size - 32],
        [32, size / 2 + 16], [size - 32, size / 2 + 16]
      ];
      ctx.fillStyle = '#32343d';
      holes.forEach(([hx, hy]) => {
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 4);
      return tex;
    });
  }

  /**
   * Stylized Graffiti & Street Art Texture for trackside retaining walls
   */
  public static getGraffitiDecal(variant: number): THREE.Texture {
    return this.getOrCreate(`graffiti_${variant}`, () => {
      const w = 256;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Transparent background
      ctx.clearRect(0, 0, w, h);

      if (variant === 0) {
        // "SURF" bubble lettering with drop shadow and outline
        ctx.font = 'bold 58px "Arial Black", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Drop shadow
        ctx.fillStyle = '#111122';
        ctx.fillText('METRO', 132, 68);

        // Outer stroke
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 10;
        ctx.strokeText('METRO', 128, 64);

        // Main fill gradient
        const grad = ctx.createLinearGradient(0, 20, 0, 100);
        grad.addColorStop(0, '#ff007f');
        grad.addColorStop(0.5, '#ffea00');
        grad.addColorStop(1, '#00f0ff');
        ctx.fillStyle = grad;
        ctx.fillText('METRO', 128, 64);

        // Splatters
        ctx.fillStyle = '#00f0ff';
        for (let i = 0; i < 15; i++) {
          ctx.beginPath();
          ctx.arc(40 + Math.random() * 180, 20 + Math.random() * 80, 2 + Math.random() * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // "DASH" wildstyle graphic
        ctx.font = 'bold 64px "Arial Black", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#111122';
        ctx.fillText('RUSH', 132, 68);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 12;
        ctx.strokeText('RUSH', 128, 64);

        const grad = ctx.createLinearGradient(0, 20, 0, 100);
        grad.addColorStop(0, '#00ff88');
        grad.addColorStop(1, '#0077ff');
        ctx.fillStyle = grad;
        ctx.fillText('RUSH', 128, 64);

        // Crown on top
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(110, 22);
        ctx.lineTo(118, 8);
        ctx.lineTo(128, 16);
        ctx.lineTo(138, 8);
        ctx.lineTo(146, 22);
        ctx.closePath();
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      return tex;
    });
  }

  /**
   * Train Side Livery Texture with Windows and Passenger Doors
   */
  public static getTrainSideTexture(baseColorHex: number, accentColorHex: number): THREE.Texture {
    return this.getOrCreate(`train_side_${baseColorHex}_${accentColorHex}`, () => {
      const w = 512;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      const baseHex = `#${baseColorHex.toString(16).padStart(6, '0')}`;
      const accentHex = `#${accentColorHex.toString(16).padStart(6, '0')}`;

      // Carriage lower body
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, w, h);

      // Speed racing stripes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 36, w, 6);
      ctx.fillStyle = accentHex;
      ctx.fillRect(0, 42, w, 12);
      ctx.fillStyle = '#222233';
      ctx.fillRect(0, 108, w, 20); // Undercarriage dark skirt

      // Passenger Windows (4 pairs)
      for (let i = 0; i < 4; i++) {
        const wx = 35 + i * 120;
        // Rubber gasket border
        ctx.fillStyle = '#1a1e28';
        ctx.beginPath();
        ctx.roundRect(wx, 58, 64, 42, 6);
        ctx.fill();

        // Tinted reflective glass
        const glassGrad = ctx.createLinearGradient(wx, 58, wx + 64, 100);
        glassGrad.addColorStop(0, '#2d4b68');
        glassGrad.addColorStop(0.5, '#6999b8');
        glassGrad.addColorStop(1, '#1b3248');
        ctx.fillStyle = glassGrad;
        ctx.beginPath();
        ctx.roundRect(wx + 3, 61, 58, 36, 4);
        ctx.fill();

        // Diagonal glass reflection streak
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.moveTo(wx + 10, 61);
        ctx.lineTo(wx + 26, 61);
        ctx.lineTo(wx + 12, 97);
        ctx.lineTo(wx + 2, 97);
        ctx.closePath();
        ctx.fill();
      }

      // Passenger Door seams
      for (let i = 0; i < 3; i++) {
        const dx = 105 + i * 120;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(dx, 36, 2, 72);
        // Orange door warning light
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(dx + 1, 32, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      return tex;
    });
  }

  /**
   * Caution Hazard Diagonal Stripes (Yellow / Dark Slate)
   */
  public static getHazardTexture(): THREE.Texture {
    return this.getOrCreate('hazard_stripes', () => {
      const size = 128;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = '#1f232b';
      ctx.beginPath();
      for (let i = -size; i < size * 2; i += 32) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 16, 0);
        ctx.lineTo(i - 16, size);
        ctx.lineTo(i - 32, size);
        ctx.closePath();
      }
      ctx.fill();

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Horizontal Corrugated Stainless-Steel Fluting Texture for Classic Subway Trains
   */
  public static getStainlessSteelFlutingTexture(): THREE.Texture {
    return this.getOrCreate('stainless_fluting', () => {
      const w = 128;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Base stainless steel
      ctx.fillStyle = '#9aa0a6';
      ctx.fillRect(0, 0, w, h);

      // Horizontal corrugation fluting ribs
      const ribCount = 24;
      const ribHeight = h / ribCount;

      for (let i = 0; i < ribCount; i++) {
        const y = i * ribHeight;
        // Top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(0, y, w, ribHeight * 0.35);

        // Center mid-tone
        ctx.fillStyle = '#b0b7bd';
        ctx.fillRect(0, y + ribHeight * 0.35, w, ribHeight * 0.35);

        // Bottom crease shadow
        ctx.fillStyle = 'rgba(25, 30, 36, 0.6)';
        ctx.fillRect(0, y + ribHeight * 0.7, w, ribHeight * 0.3);
      }

      // Vertical rivet lines at intervals
      ctx.fillStyle = '#4f555c';
      for (let x = 16; x < w; x += 32) {
        for (let i = 0; i < ribCount; i++) {
          const cy = i * ribHeight + ribHeight * 0.5;
          ctx.beginPath();
          ctx.arc(x, cy, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8, 1);
      return tex;
    });
  }

  /**
   * Stylized Transit LED Destination Sign (Digital Dot-Matrix Display)
   */
  public static getDestinationSignTexture(routeText: string, subText: string, colorHex = 0xffb300): THREE.Texture {
    const key = `dest_sign_${routeText}_${subText}_${colorHex}`;
    return this.getOrCreate(key, () => {
      const w = 384;
      const h = 96;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Dark housing bezel
      ctx.fillStyle = '#0a0d12';
      ctx.fillRect(0, 0, w, h);

      // Subtle dot-matrix background grid
      ctx.fillStyle = '#141a22';
      for (let x = 4; x < w - 4; x += 6) {
        for (let y = 4; y < h - 4; y += 6) {
          ctx.fillRect(x, y, 2, 2);
        }
      }

      // Glowing LED Route Number / Badge
      const hexStr = `#${colorHex.toString(16).padStart(6, '0')}`;
      ctx.font = 'bold 38px "Impact", "Arial Black", sans-serif';
      ctx.fillStyle = hexStr;
      ctx.shadowColor = hexStr;
      ctx.shadowBlur = 8;
      ctx.fillText(routeText, 16, 52);

      // Sub-destination text
      ctx.font = 'bold 22px "Arial Black", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 4;
      ctx.fillText(subText, 16, 82);

      // Clear shadow
      ctx.shadowBlur = 0;

      // Outer bezel border
      ctx.strokeStyle = '#252b36';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, w - 4, h - 4);

      const tex = new THREE.CanvasTexture(canvas);
      return tex;
    });
  }

  /**
   * Metal Radiator Vent & HVAC Intake Grille
   */
  public static getVentGrilleTexture(): THREE.Texture {
    return this.getOrCreate('vent_grille', () => {
      const size = 128;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#1e2229';
      ctx.fillRect(0, 0, size, size);

      // Slat louvers
      const slats = 16;
      const sh = size / slats;
      for (let i = 0; i < slats; i++) {
        const y = i * sh;
        ctx.fillStyle = '#0f1217';
        ctx.fillRect(4, y + 1, size - 8, sh * 0.45);
        ctx.fillStyle = '#3a414d';
        ctx.fillRect(4, y + sh * 0.45, size - 8, sh * 0.45);
      }

      ctx.strokeStyle = '#3a414d';
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, size - 4, size - 4);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Industrial Anti-Slip Diamond Plate Walkway Texture
   */
  public static getDiamondPlateTexture(): THREE.Texture {
    return this.getOrCreate('diamond_plate', () => {
      const size = 128;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#3f4652';
      ctx.fillRect(0, 0, size, size);

      // Diamond tread pattern
      const step = 32;
      for (let x = 0; x < size; x += step) {
        for (let y = 0; y < size; y += step) {
          // Diamond 1
          ctx.save();
          ctx.translate(x + 16, y + 16);
          ctx.rotate(Math.PI / 4);
          ctx.fillStyle = '#5c6575';
          ctx.fillRect(-6, -2, 12, 4);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(-6, -2, 12, 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(-6, 1, 12, 1);
          ctx.restore();

          // Diamond 2
          ctx.save();
          ctx.translate(x + step, y + step);
          ctx.rotate(-Math.PI / 4);
          ctx.fillStyle = '#5c6575';
          ctx.fillRect(-6, -2, 12, 4);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(-6, -2, 12, 1);
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(-6, 1, 12, 1);
          ctx.restore();
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 8);
      return tex;
    });
  }

  /**
   * Weathered Victorian Brick Texture with soot staining and distressed mortar
   */
  public static getWeatheredBrickTexture(): THREE.Texture {
    return this.getOrCreate('brick_weathered_victorian', () => {
      const w = 256;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Aged dark lime mortar base
      ctx.fillStyle = '#7a7066';
      ctx.fillRect(0, 0, w, h);

      const rows = 16;
      const rowHeight = h / rows;
      const brickWidth = 32;
      const brickColors = ['#8d3d32', '#7b2f27', '#63251e', '#9e463b', '#48201a', '#5c322b'];

      for (let r = 0; r < rows; r++) {
        const isOffset = r % 2 === 1;
        const startX = isOffset ? -brickWidth / 2 : 0;
        const y = r * rowHeight + 1.5;
        const bh = rowHeight - 3;

        for (let x = startX; x < w + brickWidth; x += brickWidth) {
          const col = brickColors[Math.floor(Math.random() * brickColors.length)];
          ctx.fillStyle = col;
          ctx.fillRect(x + 1.5, y, brickWidth - 3, bh);

          // Weathered soot / grime mottling
          if (Math.random() > 0.4) {
            ctx.fillStyle = 'rgba(25, 20, 20, 0.28)';
            ctx.fillRect(x + 1.5, y + Math.random() * (bh - 4), brickWidth - 3, 4);
          }

          // Subtle top highlight
          ctx.fillStyle = 'rgba(255, 240, 220, 0.08)';
          ctx.fillRect(x + 1.5, y, brickWidth - 3, 1.5);
        }
      }

      // Vertical soot dripping streaks
      for (let s = 0; s < 12; s++) {
        const sx = Math.random() * w;
        const sLen = 40 + Math.random() * 80;
        const grad = ctx.createLinearGradient(sx, 0, sx, sLen);
        grad.addColorStop(0, 'rgba(20, 15, 15, 0.35)');
        grad.addColorStop(1, 'rgba(20, 15, 15, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(sx, 0, 4 + Math.random() * 6, sLen);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 4);
      return tex;
    });
  }

  /**
   * Heavy Ashlar Stone Masonry Texture for Historic Viaduct Arches and Piers
   */
  public static getStoneMasonryTexture(): THREE.Texture {
    return this.getOrCreate('stone_masonry_ashlar', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Dark joint mortar
      ctx.fillStyle = '#403833';
      ctx.fillRect(0, 0, size, size);

      const rows = 8;
      const rowHeight = size / rows;
      const blockWidth = 64;
      const stoneColors = ['#8c7b70', '#9c8c80', '#7b6c62', '#a8988c', '#6c5d54'];

      for (let r = 0; r < rows; r++) {
        const isOffset = r % 2 === 1;
        const startX = isOffset ? -blockWidth / 2 : 0;
        const y = r * rowHeight + 2;
        const bh = rowHeight - 4;

        for (let x = startX; x < size + blockWidth; x += blockWidth) {
          const col = stoneColors[Math.floor(Math.random() * stoneColors.length)];
          ctx.fillStyle = col;
          ctx.fillRect(x + 2, y, blockWidth - 4, bh);

          // Chiselled stone grain texture
          for (let g = 0; g < 15; g++) {
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)';
            const gx = x + 4 + Math.random() * (blockWidth - 12);
            const gy = y + 2 + Math.random() * (bh - 6);
            ctx.fillRect(gx, gy, 8 + Math.random() * 12, 1.5);
          }

          // Bevelled ashlar edge highlights
          ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
          ctx.fillRect(x + 2, y, blockWidth - 4, 2);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
          ctx.fillRect(x + 2, y + bh - 2, blockWidth - 4, 2);
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 3);
      return tex;
    });
  }

  /**
   * Cobblestone Street Paving Texture
   */
  public static getCobblestoneTexture(): THREE.Texture {
    return this.getOrCreate('cobblestone_street', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Dark earth mortar
      ctx.fillStyle = '#3a312a';
      ctx.fillRect(0, 0, size, size);

      const rows = 16;
      const rowH = size / rows;
      const cobW = 20;
      const cobColors = ['#5e544c', '#6e635a', '#4e453d', '#786d63'];

      for (let r = 0; r < rows; r++) {
        const isOffset = r % 2 === 1;
        const startX = isOffset ? -cobW / 2 : 0;
        const y = r * rowH + 1.5;
        const ch = rowH - 3;

        for (let x = startX; x < size + cobW; x += cobW) {
          ctx.fillStyle = cobColors[Math.floor(Math.random() * cobColors.length)];
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === 'function') {
            (ctx as any).roundRect(x + 1.5, y, cobW - 3, ch, 3);
          } else {
            ctx.rect(x + 1.5, y, cobW - 3, ch);
          }
          ctx.fill();

          // Smooth dome highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.beginPath();
          ctx.ellipse(x + cobW * 0.5, y + 2.5, 4, 1.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 4);
      return tex;
    });
  }

  /**
   * Oxidized Copper Verdigris Green Patina Texture for Mansard Roofs & Domes
   */
  public static getCopperPatinaTexture(): THREE.Texture {
    return this.getOrCreate('copper_patina', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Rich verdigris turquoise base
      ctx.fillStyle = '#489f87';
      ctx.fillRect(0, 0, size, size);

      // Organic oxidation mottling
      const patinaTones = ['#388470', '#5abfa4', '#2d6a5a', '#6fcdb3'];
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 4 + Math.random() * 12;
        ctx.fillStyle = patinaTones[Math.floor(Math.random() * patinaTones.length)];
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Standing seam roof lines
      const seams = 8;
      const seamW = size / seams;
      for (let s = 0; s < seams; s++) {
        const sx = s * seamW;
        ctx.fillStyle = '#26594b';
        ctx.fillRect(sx, 0, 2.5, size);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(sx + 2.5, 0, 1.5, size);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 6);
      return tex;
    });
  }

  /**
   * Historic Enameled Railway Station Sign
   */
  public static getHistoricSignTexture(stationName: string): THREE.Texture {
    return this.getOrCreate(`historic_sign_${stationName}`, () => {
      const w = 512;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Deep vintage British railway maroon / oxford blue
      ctx.fillStyle = '#1c2833';
      ctx.fillRect(0, 0, w, h);

      // Ornate brass border
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.lineWidth = 2;
      ctx.strokeRect(12, 12, w - 24, h - 24);

      // Classical serif typography
      ctx.fillStyle = '#fdfefe';
      ctx.font = 'bold 38px "Times New Roman", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stationName.toUpperCase(), w / 2, h / 2 - 4);

      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 16px "Times New Roman", Georgia, serif';
      ctx.fillText('EST. 1888 • METROPOLITAN LINE', w / 2, h / 2 + 28);

      const tex = new THREE.CanvasTexture(canvas);
      return tex;
    });
  }

  /**
   * Modern Digital LED / Acrylic Transit Sign
   */
  public static getModernMetroSignTexture(stationName: string, line: string = 'METRO BLUE'): THREE.Texture {
    return this.getOrCreate(`modern_sign_${stationName}_${line}`, () => {
      const w = 512;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Dark obsidian acrylic glass
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Vibrant cyan top strip
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(0, 0, w, 10);

      // Line badge pill
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(24, 26, 110, 32, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(line, 79, 42);

      // Station Name in modern crisp sans-serif
      ctx.fillStyle = '#f8fafc';
      ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(stationName.toUpperCase(), 154, 44);

      // Next train status indicator
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(36, 88, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('TRACK 1 • ON TIME • EXPRESS SERVICE', 54, 90);

      const tex = new THREE.CanvasTexture(canvas);
      return tex;
    });
  }

  /**
   * High-Contrast Medium Barrier Warning Texture (Caution Orange & Signal White Hazard Stripes)
   */
  public static getMediumBarrierTexture(): THREE.Texture {
    return this.getOrCreate('medium_barrier_hazard', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Bold safety orange base
      ctx.fillStyle = '#ff6d00';
      ctx.fillRect(0, 0, size, size);

      // High-contrast signal white diagonal stripes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      for (let i = -size; i < size * 2; i += 48) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 24, 0);
        ctx.lineTo(i - 8, size);
        ctx.lineTo(i - 32, size);
        ctx.closePath();
      }
      ctx.fill();

      // Top and bottom high-durability black safety trim
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, size, 12);
      ctx.fillRect(0, size - 12, size, 12);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * High-Contrast Structural Railway Pillar Hazard Texture
   * Weathered architectural concrete with bottom chevron hazard belt and high-visibility reflector
   */
  public static getPillarTexture(): THREE.Texture {
    return this.getOrCreate('pillar_hazard', () => {
      const w = 256;
      const h = 512;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Reinforced concrete column base tone
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, w, h);

      // Subtle concrete texture speckles
      ctx.fillStyle = '#334155';
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.fillRect(x, y, 2, 2);
      }

      // Vertical formwork lines
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(w * 0.25, 0, 3, h);
      ctx.fillRect(w * 0.5, 0, 3, h);
      ctx.fillRect(w * 0.75, 0, 3, h);

      // Bottom 25%: High-intensity safety chevron band (Yellow & Carbon Black)
      const hazardY = h * 0.72;
      const hazardH = h * 0.28;
      ctx.fillStyle = '#ffb300';
      ctx.fillRect(0, hazardY, w, hazardH);

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      for (let i = -w; i < w * 2; i += 40) {
        ctx.moveTo(i, hazardY);
        ctx.lineTo(i + 20, hazardY);
        ctx.lineTo(i - 10, h);
        ctx.lineTo(i - 30, h);
        ctx.closePath();
      }
      ctx.fill();

      // Eye-level high-visibility amber/white reflector band
      ctx.fillStyle = '#ffea00';
      ctx.fillRect(0, h * 0.45, w, 28);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, h * 0.45 + 8, w, 12);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * High-Contrast Low Railway Jump Hurdle Warning Texture (Variant-Driven)
   * V0: Safety Yellow (#ffd600) & Midnight Carbon Black (#0f172a) chevrons with reflective white trim
   * V1: International Safety Orange (#ff6d00) & Signal White (#ffffff) chevrons with dark trim
   * V2: Railway Maintenance Red (#d50000) & High-Intensity White (#ffffff) chevrons with steel trim
   */
  public static getLowHurdleTexture(variant: number = 0): THREE.Texture {
    const v = Math.abs(variant) % 3;
    return this.getOrCreate(`low_hurdle_hazard_v${v}`, () => {
      const w = 512;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      let baseColor = '#ffd600';
      let stripeColor = '#0f172a';
      let trimColor = '#ffffff';

      if (v === 1) {
        baseColor = '#ff6d00';
        stripeColor = '#ffffff';
        trimColor = '#0f172a';
      } else if (v === 2) {
        baseColor = '#d50000';
        stripeColor = '#ffffff';
        trimColor = '#ffd600';
      }

      // Base coat
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, w, h);

      // Bold 45-degree diagonal chevrons
      ctx.fillStyle = stripeColor;
      ctx.beginPath();
      const stripeW = 64;
      for (let x = -h; x < w + h; x += stripeW * 2) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x + stripeW, 0);
        ctx.lineTo(x + stripeW - h, h);
        ctx.lineTo(x - h, h);
        ctx.closePath();
      }
      ctx.fill();

      // Top & Bottom high-durability reflective trim
      ctx.fillStyle = trimColor;
      ctx.fillRect(0, 0, w, 16);
      ctx.fillRect(0, h - 16, w, 16);

      // Inner contrasting pinstripes on trims
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 14, w, 2);
      ctx.fillRect(0, h - 16, w, 2);

      // Rivet bolts along edges
      ctx.fillStyle = '#cbd5e1';
      for (let rx = 24; rx < w; rx += 48) {
        ctx.beginPath();
        ctx.arc(rx, 8, 3.5, 0, Math.PI * 2);
        ctx.arc(rx, h - 8, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * High Barrier Overhead Gantry Warning Texture (Variant-Driven)
   * V0: Station Transit LED Gantry ("▼ LOW CLEARANCE 1.25M // SLIDE UNDER ▼")
   * V1: Heavy Industrial Steel Bridge Gantry (Riveted Steel Flanges & Hazard Chevrons)
   * V2: Tunnel Vault Clearance Beam ("MAX HEIGHT 1.25M // CLEARANCE DANGER")
   */
  public static getHighBarrierTexture(variant: number = 0): THREE.Texture {
    const v = Math.abs(variant) % 3;
    return this.getOrCreate(`high_barrier_gantry_v${v}`, () => {
      const w = 1024;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      if (v === 0) {
        // Station Transit Style
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        for (let i = -w; i < w * 2; i += 64) {
          ctx.moveTo(i, 0);
          ctx.lineTo(i + 32, 0);
          ctx.lineTo(i + 32 - h * 0.4, h);
          ctx.lineTo(i - h * 0.4, h);
          ctx.closePath();
        }
        ctx.fill();

        // Massive Center Backlit LED Display Placard
        const padW = 720;
        const padH = 140;
        const padX = (w - padW) * 0.5;
        const padY = (h - padH) * 0.5;

        ctx.fillStyle = '#090d16';
        ctx.fillRect(padX, padY, padW, padH);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 6;
        ctx.strokeRect(padX + 3, padY + 3, padW - 6, padH - 6);

        // Warning Text & Icons
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▼ ▼  LOW CLEARANCE 1.25M  ▼ ▼', w * 0.5, padY + 48);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('SLIDE UNDER TO PASS // NO JUMPING', w * 0.5, padY + 98);
      } else if (v === 1) {
        // Heavy Industrial Steel Style
        ctx.fillStyle = '#eab308';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        for (let i = -w; i < w * 2; i += 72) {
          ctx.moveTo(i, 0);
          ctx.lineTo(i + 36, 0);
          ctx.lineTo(i + 36 - h * 0.5, h);
          ctx.lineTo(i - h * 0.5, h);
          ctx.closePath();
        }
        ctx.fill();

        // Industrial Steel Plate Placard
        const padW = 680;
        const padH = 130;
        const padX = (w - padW) * 0.5;
        const padY = (h - padH) * 0.5;

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(padX, padY, padW, padH);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 6;
        ctx.strokeRect(padX + 3, padY + 3, padW - 6, padH - 6);

        ctx.fillStyle = '#fef08a';
        ctx.font = '900 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠️ CAUTION: OVERHEAD HAZARD ⚠️', w * 0.5, padY + 46);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('▼ SLIDE REQUIRED — CLEARANCE 1.25M ▼', w * 0.5, padY + 95);
      } else {
        // Tunnel Clearance Portal Style
        ctx.fillStyle = '#f97316';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        for (let i = -w; i < w * 2; i += 64) {
          ctx.moveTo(i, 0);
          ctx.lineTo(i + 32, 0);
          ctx.lineTo(i + 32 - h * 0.45, h);
          ctx.lineTo(i - h * 0.45, h);
          ctx.closePath();
        }
        ctx.fill();

        const padW = 700;
        const padH = 130;
        const padX = (w - padW) * 0.5;
        const padY = (h - padH) * 0.5;

        ctx.fillStyle = '#020617';
        ctx.fillRect(padX, padY, padW, padH);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 5;
        ctx.strokeRect(padX + 3, padY + 3, padW - 6, padH - 6);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TUNNEL PORTAL // 1.25M CLEARANCE', w * 0.5, padY + 46);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('▼ DUCK / SLIDE UNDER FRAME ▼', w * 0.5, padY + 95);
      }

      // Top and bottom heavy steel flange borders with industrial rivets
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, 22);
      ctx.fillRect(0, h - 22, w, 22);

      ctx.fillStyle = '#94a3b8';
      for (let rx = 32; rx < w; rx += 48) {
        ctx.beginPath();
        ctx.arc(rx, 11, 4, 0, Math.PI * 2);
        ctx.arc(rx, h - 11, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      return tex;
    });
  }

  /**
   * Heavy Concrete Pedestal Base Texture for Overhead Gantries
   */
  public static getGantryPedestalTexture(): THREE.Texture {
    return this.getOrCreate('gantry_pedestal', () => {
      const w = 256;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Concrete gray base
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, w, h);

      // Fine aggregate speckles
      ctx.fillStyle = '#334155';
      for (let i = 0; i < 200; i++) {
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }

      // Bottom 30%: Safety hazard chevron collar
      const beltY = h * 0.65;
      const beltH = h * 0.35;
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, beltY, w, beltH);

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      for (let x = -w; x < w * 2; x += 36) {
        ctx.moveTo(x, beltY);
        ctx.lineTo(x + 18, beltY);
        ctx.lineTo(x + 18 - 20, h);
        ctx.lineTo(x - 20, h);
        ctx.closePath();
      }
      ctx.fill();

      // Top concrete chamfer bevel
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(0, 0, w, 6);

      const tex = new THREE.CanvasTexture(canvas);
      return tex;
    });
  }

  /**
   * Subway Tunnel Wall Ceramic Tile Texture
   * Light subway tile with dark grout lines, moisture patina, and horizontal orange transit stripe
   */
  public static getTunnelWallTileTexture(): THREE.Texture {
    return this.getOrCreate('tunnel_wall_tile', () => {
      const w = 256;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Dark grout mortar background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, w, h);

      // Subway ceramic tiles (bond pattern)
      const rows = 16;
      const rowHeight = h / rows;
      const tileWidth = 32;

      for (let r = 0; r < rows; r++) {
        const isOffset = r % 2 === 1;
        const startX = isOffset ? -tileWidth / 2 : 0;
        const y = r * rowHeight + 1.5;
        const th = rowHeight - 3;

        for (let x = startX; x < w + tileWidth; x += tileWidth) {
          // Off-white / light transit ceramic glaze
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(x + 1.5, y, tileWidth - 3, th);

          // Top highlight bevel
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(x + 1.5, y, tileWidth - 3, 2);

          // Bottom shadow bevel
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(x + 1.5, y + th - 2, tileWidth - 3, 2);
        }
      }

      // Continuous middle safety transit stripe (Safety Amber)
      const stripeY = h * 0.45;
      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, stripeY, w, 24);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, stripeY + 8, w, 8);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 16);
      return tex;
    });
  }

  /**
   * Modern High-Rise Curtain Wall Glass Facade
   * Multi-tone glass window grid with dark mullions, illuminated offices, and floor spandrel bands
   */
  public static getCurtainWallGlassTexture(): THREE.Texture {
    return this.getOrCreate('curtain_wall_glass', () => {
      const w = 512;
      const h = 512;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Deep dark charcoal mullion grid background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      const cols = 8;
      const rows = 16;
      const cellW = w / cols;
      const cellH = h / rows;

      // Seeded-style pseudo random window illumination
      for (let r = 0; r < rows; r++) {
        // Floor spandrel beam
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, r * cellH, w, 4);

        for (let c = 0; c < cols; c++) {
          const x = c * cellW + 2;
          const y = r * cellH + 4;
          const pw = cellW - 4;
          const ph = cellH - 6;

          const rand = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
          const val = rand - Math.floor(rand);

          if (val > 0.68) {
            // Warm interior office lighting
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(x, y, pw, ph);
            // Window blind silhouette
            ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
            ctx.fillRect(x, y, pw, ph * 0.3);
          } else if (val > 0.42) {
            // Cool white architectural LED lighting
            ctx.fillStyle = '#e0f2fe';
            ctx.fillRect(x, y, pw, ph);
          } else if (val > 0.20) {
            // Deep reflective daytime glass sheen (sky reflection)
            const grad = ctx.createLinearGradient(x, y, x, y + ph);
            grad.addColorStop(0, '#1e3a5f');
            grad.addColorStop(1, '#0c1a2e');
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, pw, ph);
          } else {
            // Dark tinted corporate spandrel
            ctx.fillStyle = '#0b1322';
            ctx.fillRect(x, y, pw, ph);
          }

          // Glass specular edge line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, pw, ph);
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 6);
      return tex;
    });
  }

  /**
   * Street-Level Commercial Storefront Podium Texture
   * High-contrast retail display windows, warm interior lighting, glass entrance doors, and brand signage
   */
  public static getModernStorefrontTexture(): THREE.Texture {
    return this.getOrCreate('modern_storefront', () => {
      const w = 512;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Polished dark granite podium frame
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, w, h);

      // Top illuminated fascia board
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 10, w, 40);

      // Store brands
      const stores = ['METRO BISTRO', 'TECH LAB', 'COFFEE & CO', 'TRANSIT BOOKS'];
      const storeW = w / 4;

      for (let s = 0; s < 4; s++) {
        const sx = s * storeW;

        // Fascia signage box
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(sx + 10, 15, storeW - 20, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(stores[s], sx + storeW * 0.5, 34);

        // Display window with warm glowing interior
        const displayGrad = ctx.createLinearGradient(sx + 8, 55, sx + 8, h - 15);
        displayGrad.addColorStop(0, '#fef3c7');
        displayGrad.addColorStop(0.7, '#fde68a');
        displayGrad.addColorStop(1, '#d97706');
        ctx.fillStyle = displayGrad;
        ctx.fillRect(sx + 8, 55, storeW - 16, h - 70);

        // Glass frame mullion
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.strokeRect(sx + 8, 55, storeW - 16, h - 70);

        // Base kickplate
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(sx + 8, h - 15, storeW - 16, 12);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Rooftop Photovoltaic Solar Panel Array Texture
   */
  public static getModernSolarPanelTexture(): THREE.Texture {
    return this.getOrCreate('solar_panel_grid', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Deep dark blue silicon base
      ctx.fillStyle = '#08172e';
      ctx.fillRect(0, 0, size, size);

      // Silicon photovoltaic wafer cells (4x4)
      const cellSize = size / 4;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const x = c * cellSize + 2;
          const y = r * cellSize + 2;
          const cw = cellSize - 4;
          const ch = cellSize - 4;

          // Monocrystalline cell gradient
          const cellGrad = ctx.createLinearGradient(x, y, x + cw, y + ch);
          cellGrad.addColorStop(0, '#0f2b5c');
          cellGrad.addColorStop(0.5, '#1e3a8a');
          cellGrad.addColorStop(1, '#0f172a');
          ctx.fillStyle = cellGrad;
          ctx.fillRect(x, y, cw, ch);

          // Silver grid busbars
          ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
          ctx.lineWidth = 1;
          for (let b = 1; b < 6; b++) {
            const bx = x + (cw / 6) * b;
            ctx.beginPath();
            ctx.moveTo(bx, y);
            ctx.lineTo(bx, y + ch);
            ctx.stroke();
          }
        }
      }

      // Aluminum mounting frame
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, size - 2, size - 2);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      return tex;
    });
  }

  /**
   * Victorian Arched Window Bay Facade for Historic Quarter
   * Weathered brickwork, arched stone headers, multi-pane sash windows with warm gaslight glow
   */
  public static getHistoricWindowBayTexture(): THREE.Texture {
    return this.getOrCreate('historic_window_bay', () => {
      const w = 512;
      const h = 512;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Aged red brick background
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(0, 0, w, h);

      // Brick pattern speckles
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.fillStyle = Math.random() > 0.5 ? '#9a3412' : '#431407';
        ctx.fillRect(x, y, 16, 6);
      }

      const cols = 4;
      const rows = 4;
      const colW = w / cols;
      const rowH = h / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = c * colW + 20;
          const cy = r * rowH + 20;
          const winW = colW - 40;
          const winH = rowH - 35;

          // Arched stone lintel header
          ctx.fillStyle = '#d6d3d1';
          ctx.beginPath();
          ctx.arc(cx + winW * 0.5, cy + 12, winW * 0.5, Math.PI, 0, false);
          ctx.fill();

          // Stone window sill
          ctx.fillStyle = '#e7e5e4';
          ctx.fillRect(cx - 4, cy + winH - 6, winW + 8, 8);

          // Window interior with warm gaslight / amber candle glow
          const rand = Math.sin(r * 17.13 + c * 31.9) * 43758.5453;
          const isLit = (rand - Math.floor(rand)) > 0.35;

          if (isLit) {
            const winGrad = ctx.createRadialGradient(
              cx + winW * 0.5, cy + winH * 0.5, 4,
              cx + winW * 0.5, cy + winH * 0.5, winW * 0.6
            );
            winGrad.addColorStop(0, '#fef08a');
            winGrad.addColorStop(0.6, '#f59e0b');
            winGrad.addColorStop(1, '#b45309');
            ctx.fillStyle = winGrad;
          } else {
            ctx.fillStyle = '#1c1917';
          }
          ctx.fillRect(cx, cy + 12, winW, winH - 18);

          // Cast-iron window mullions & muntins (6-pane sash)
          ctx.strokeStyle = '#292524';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(cx, cy + 12, winW, winH - 18);

          // Vertical muntin
          ctx.beginPath();
          ctx.moveTo(cx + winW * 0.5, cy + 12);
          ctx.lineTo(cx + winW * 0.5, cy + winH - 6);
          ctx.stroke();

          // Horizontal muntins
          ctx.beginPath();
          ctx.moveTo(cx, cy + 12 + (winH - 18) * 0.33);
          ctx.lineTo(cx + winW, cy + 12 + (winH - 18) * 0.33);
          ctx.moveTo(cx, cy + 12 + (winH - 18) * 0.66);
          ctx.lineTo(cx + winW, cy + 12 + (winH - 18) * 0.66);
          ctx.stroke();
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 4);
      return tex;
    });
  }

  /**
   * Subway Station Tiled Wall with Heritage Mosaic Name Sign
   * White beveled subway tiles, cobalt/emerald ceramic border band, and inlaid station mosaic plaque
   */
  public static getSubwayTileMuralTexture(
    stationName: string = 'METRO CENTRAL',
    accentHex: string = '#0284c7'
  ): THREE.Texture {
    return this.getOrCreate(`subway_tile_mural_${stationName}_${accentHex}`, () => {
      const w = 512;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Dark mortar background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, w, h);

      // White ceramic subway tiles
      const rows = 12;
      const rowHeight = h / rows;
      const tileWidth = 42;

      for (let r = 0; r < rows; r++) {
        const isOffset = r % 2 === 1;
        const startX = isOffset ? -tileWidth / 2 : 0;
        const y = r * rowHeight + 1.5;
        const th = rowHeight - 3;

        for (let x = startX; x < w + tileWidth; x += tileWidth) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(x + 1.5, y, tileWidth - 3, th);

          // Bevels
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 1.5, y, tileWidth - 3, 2);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(x + 1.5, y + th - 2, tileWidth - 3, 2);
        }
      }

      // Ornamental ceramic border band (top & bottom of mural)
      ctx.fillStyle = accentHex;
      ctx.fillRect(0, 35, w, 16);
      ctx.fillRect(0, h - 50, w, 16);

      // Gold Greek-key / dentil accent strip
      ctx.fillStyle = '#f59e0b';
      for (let x = 0; x < w; x += 12) {
        ctx.fillRect(x, 40, 6, 6);
        ctx.fillRect(x, h - 45, 6, 6);
      }

      // Station Name Mosaic Plaque (centered)
      const plaqueW = 380;
      const plaqueH = 70;
      const px = (w - plaqueW) * 0.5;
      const py = (h - plaqueH) * 0.5;

      // Dark blue / emerald enamel plaque frame
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px - 4, py - 4, plaqueW + 8, plaqueH + 8);
      ctx.fillStyle = accentHex;
      ctx.fillRect(px, py, plaqueW, plaqueH);

      // Inner white border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 4, py + 4, plaqueW - 8, plaqueH - 8);

      // Bold classic metro typography
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px "Trebuchet MS", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '3px';
      ctx.fillText(stationName, w * 0.5, py + 42);

      // Subtitle
      ctx.fillStyle = '#fef08a';
      ctx.font = '700 11px sans-serif';
      ctx.fillText('• SUBWAY LINE 1 • PLATFORM CONCOURSE •', w * 0.5, py + 58);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Raised Emergency Catwalk Walkway Texture
   * Heavy diamond plate steel with high-contrast safety yellow tactile warning edge
   */
  public static getSubwaySafetyWalkwayTexture(): THREE.Texture {
    return this.getOrCreate('subway_safety_walkway', () => {
      const w = 256;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Steel diamond plate tread background
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, w, h);

      // Diamond plate tread pattern
      ctx.fillStyle = '#475569';
      for (let y = 0; y < h; y += 16) {
        for (let x = 0; x < w; x += 16) {
          ctx.beginPath();
          ctx.ellipse(x + 8, y + 8, 4, 1.5, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // High-contrast safety yellow edge stripe with black warning chevrons
      const edgeW = 40;
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 0, edgeW, h);

      ctx.fillStyle = '#0f172a';
      for (let y = -20; y < h + 20; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(edgeW, y + 16);
        ctx.lineTo(edgeW, y + 26);
        ctx.lineTo(0, y + 10);
        ctx.closePath();
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 8);
      return tex;
    });
  }

  /**
   * Subterranean Station Advertising Billboard Poster Texture
   */
  public static getSubwayStationBillboardTexture(): THREE.Texture {
    return this.getOrCreate('subway_station_billboard', () => {
      const w = 512;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Beveled illuminated lightbox frame
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Fluorescent backlit poster area
      const posterGrad = ctx.createLinearGradient(12, 12, w - 24, h - 24);
      posterGrad.addColorStop(0, '#0284c7');
      posterGrad.addColorStop(0.5, '#6366f1');
      posterGrad.addColorStop(1, '#a855f7');
      ctx.fillStyle = posterGrad;
      ctx.fillRect(12, 12, w - 24, h - 24);

      // Geometric stylized city skyline graphic in poster
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(12, h - 24);
      ctx.lineTo(60, 110);
      ctx.lineTo(120, 140);
      ctx.lineTo(180, 80);
      ctx.lineTo(260, 160);
      ctx.lineTo(340, 95);
      ctx.lineTo(420, 130);
      ctx.lineTo(w - 24, h - 24);
      ctx.closePath();
      ctx.fill();

      // Bold promotional typography
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 28px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('METRO RAPID TRANSIT', 32, 60);

      ctx.font = '700 16px sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.fillText('SPEED • RELIABILITY • SAFETY', 32, 90);

      ctx.font = '500 12px sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText('Connecting All Districts 24/7 • Next Train in 90 Seconds', 32, h - 45);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Monumental Grand Terminal Station Sign & Departure Schedule Texture
   */
  public static getGrandStationSignTexture(): THREE.Texture {
    return this.getOrCreate('grand_station_sign', () => {
      const w = 512;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Deep emerald green and polished brass frame
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, w, h);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#f59e0b';
      ctx.strokeRect(4, 4, w - 8, h - 8);

      // Inner ornate border
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#d97706';
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Golden serif terminal title
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 32px serif';
      ctx.textAlign = 'center';
      ctx.fillText('GRAND CENTRAL TERMINAL', w / 2, 52);

      // Illuminated digital status ticker bar
      ctx.fillStyle = '#022c22';
      ctx.fillRect(16, 70, w - 32, 40);

      ctx.font = '700 15px monospace';
      ctx.fillStyle = '#34d399';
      ctx.fillText('TRACKS 1-4 • EXPRESS TRAINS TO ALL DISTRICTS • ON TIME', w / 2, 96);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Futuristic Modern Space-Frame Glass Truss Texture
   */
  public static getModernSpaceFrameGlassTexture(): THREE.Texture {
    return this.getOrCreate('modern_space_frame_glass', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Deep tinted cyan glass base
      ctx.fillStyle = '#082f49';
      ctx.fillRect(0, 0, size, size);

      // Glass gradient shine
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      grad.addColorStop(0.5, 'rgba(14, 165, 233, 0.20)');
      grad.addColorStop(1, 'rgba(2, 132, 199, 0.50)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // Triangular space-frame steel truss lines
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 4;
      ctx.beginPath();
      // Outer border
      ctx.strokeRect(0, 0, size, size);
      // Diagonals
      ctx.moveTo(0, 0); ctx.lineTo(size, size);
      ctx.moveTo(size, 0); ctx.lineTo(0, size);
      ctx.moveTo(size / 2, 0); ctx.lineTo(size, size / 2);
      ctx.moveTo(size, size / 2); ctx.lineTo(size / 2, size);
      ctx.moveTo(size / 2, size); ctx.lineTo(0, size / 2);
      ctx.moveTo(0, size / 2); ctx.lineTo(size / 2, 0);
      ctx.stroke();

      // Glowing LED structural connector nodes
      ctx.fillStyle = '#38bdf8';
      const nodes = [
        [0, 0], [size, 0], [0, size], [size, size],
        [size / 2, 0], [size / 2, size], [0, size / 2], [size, size / 2],
        [size / 2, size / 2]
      ];
      for (const [nx, ny] of nodes) {
        ctx.beginPath();
        ctx.arc(nx, ny, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(nx, ny, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 4);
      return tex;
    });
  }

  /**
   * Industrial Weathered Corrugated Sheet Metal Texture
   */
  public static getIndustrialCorrugatedSheetTexture(): THREE.Texture {
    return this.getOrCreate('industrial_corrugated_metal', () => {
      const size = 128;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Weathered steel grey background
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, size, size);

      // Vertical corrugated ribs with highlights & shadows
      const numRibs = 16;
      const ribW = size / numRibs;
      for (let i = 0; i < numRibs; i++) {
        const x = i * ribW;
        // Shadow flank
        ctx.fillStyle = '#334155';
        ctx.fillRect(x, 0, ribW * 0.45, size);
        // Highlight ridge
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x + ribW * 0.45, 0, ribW * 0.45, size);
        // Trough groove
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + ribW * 0.9, 0, ribW * 0.1, size);
      }

      // Rust blotches
      ctx.fillStyle = 'rgba(180, 83, 9, 0.35)';
      for (let r = 0; r < 20; r++) {
        const rx = Math.random() * size;
        const ry = Math.random() * size;
        ctx.beginPath();
        ctx.arc(rx, ry, 3 + Math.random() * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 4);
      return tex;
    });
  }

  /**
   * Industrial Heavy Safety Warning Chevron Texture (Yellow & Black)
   */
  public static getIndustrialWarningChevronTexture(): THREE.Texture {
    return this.getOrCreate('industrial_warning_chevron', () => {
      const w = 256;
      const h = 64;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Vibrant yellow safety background
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 0, w, h);

      // Bold black diagonal 45-degree hazard stripes
      ctx.fillStyle = '#18181b';
      const stripeW = 28;
      for (let x = -h; x < w + h; x += stripeW * 2) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + stripeW, 0);
        ctx.lineTo(x + stripeW + h, h);
        ctx.lineTo(x + h, h);
        ctx.closePath();
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 1);
      return tex;
    });
  }

  /**
   * Waterfront Harbor Ocean Surface Texture with Specular Ripples
   */
  public static getWaterfrontRipplesTexture(): THREE.Texture {
    return this.getOrCreate('waterfront_ripples', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Deep blue oceanic gradient
      const grad = ctx.createLinearGradient(0, 0, 0, size);
      grad.addColorStop(0, '#0c4a6e');
      grad.addColorStop(0.5, '#075985');
      grad.addColorStop(1, '#0369a1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // Wave ripple caustics & sun specular ribbons
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
      ctx.lineWidth = 2.5;
      for (let y = 8; y < size; y += 12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < size; x += 16) {
          const cy = y + Math.sin(x * 0.08 + y * 0.1) * 3;
          ctx.lineTo(x, cy);
        }
        ctx.stroke();
      }

      // Subtle specular sparkles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      for (let i = 0; i < 40; i++) {
        const sx = Math.random() * size;
        const sy = Math.random() * size;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8, 16);
      return tex;
    });
  }

  /**
   * Underground Grand Cathedral Mosaic Mural Texture
   */
  public static getUndergroundCathedralMuralTexture(): THREE.Texture {
    return this.getOrCreate('underground_cathedral_mural', () => {
      const w = 512;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Royal cobalt blue and terracotta tiled background
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, w, h);

      // Gold leaf decorative border
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#f59e0b';
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#d97706';
      ctx.strokeRect(14, 14, w - 28, h - 28);

      // Mosaic tessellation grid effect
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      const tileSize = 8;
      for (let x = 16; x < w - 16; x += tileSize) {
        ctx.beginPath(); ctx.moveTo(x, 16); ctx.lineTo(x, h - 16); ctx.stroke();
      }
      for (let y = 16; y < h - 16; y += tileSize) {
        ctx.beginPath(); ctx.moveTo(16, y); ctx.lineTo(w - 16, y); ctx.stroke();
      }

      // Monumental station banner title
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 36px serif';
      ctx.textAlign = 'center';
      ctx.fillText('GRAND CONCOURSE', w / 2, 90);

      ctx.fillStyle = '#fde68a';
      ctx.font = '700 20px sans-serif';
      ctx.fillText('CENTRAL INTERCHANGE • PLATFORMS 1-6', w / 2, 130);

      // Classical decorative acanthus leaf arch motif
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w / 2, 175, 45, Math.PI, 0);
      ctx.stroke();

      ctx.font = '600 13px sans-serif';
      ctx.fillStyle = '#93c5fd';
      ctx.fillText('FOUNDED 1904 • SUBTERRANEAN RAPID TRANSIT', w / 2, 215);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }
}


