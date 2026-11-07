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
   * V0: Station Transit LED Gantry ("▼ LOW CLEARANCE 1.40M // SLIDE UNDER ▼")
   * V1: Heavy Industrial Steel Bridge Gantry (Riveted Steel Flanges & Hazard Chevrons)
   * V2: Tunnel Vault Clearance Beam ("MAX HEIGHT 1.40M // CLEARANCE DANGER")
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
        ctx.fillText('▼ ▼  LOW CLEARANCE 1.40M  ▼ ▼', w * 0.5, padY + 48);

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
        ctx.fillText('▼ SLIDE REQUIRED — CLEARANCE 1.40M ▼', w * 0.5, padY + 95);
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
        ctx.fillText('TUNNEL PORTAL // 1.40M CLEARANCE', w * 0.5, padY + 46);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('▼ DUCK / SLIDE UNDER FRAME ▼', w * 0.5, padY + 95);
      }

      // Top and bottom heavy steel flange borders with industrial rivets
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, 22);
      ctx.fillRect(0, h - 22, w, 22);

      // High-contrast reflective warning line along bottom edge
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, h - 6, w, 6);

      ctx.fillStyle = '#94a3b8';
      for (let rx = 32; rx < w; rx += 48) {
        ctx.beginPath();
        ctx.arc(rx, 11, 4, 0, Math.PI * 2);
        ctx.arc(rx, h - 14, 4, 0, Math.PI * 2);
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

  /**
   * Neon Megacity Holographic Advertising Display Texture
   */
  public static getNeonHoloBillboardTexture(variant: number = 0): THREE.Texture {
    const v = Math.abs(Math.floor(variant)) % 3;
    return this.getOrCreate(`neon_holo_billboard_v${v}`, () => {
      const w = 512;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Deep transparent-feeling midnight backdrop
      ctx.fillStyle = '#060914';
      ctx.fillRect(0, 0, w, h);

      // Holographic scanline raster
      ctx.fillStyle = 'rgba(0, 245, 255, 0.04)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 2);
      }

      if (v === 0) {
        // Variant 0: CyberPulse / Audio Waveform
        // Outer glowing frame
        ctx.strokeStyle = '#00f5ff';
        ctx.lineWidth = 4;
        ctx.strokeRect(8, 8, w - 16, h - 16);
        ctx.strokeStyle = '#f026d3';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(14, 14, w - 28, h - 28);

        // Header
        ctx.fillStyle = '#00f5ff';
        ctx.font = '900 32px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('CYBERPULSE', 30, 58);

        ctx.fillStyle = '#f026d3';
        ctx.font = '700 22px sans-serif';
        ctx.fillText('サイバー // AUDIO DRIVE', 260, 58);

        // Equalizer Bars
        const barCount = 36;
        const barW = (w - 60) / barCount - 3;
        for (let i = 0; i < barCount; i++) {
          const barH = 20 + Math.sin(i * 0.45) * 45 + Math.cos(i * 0.9) * 25;
          const bx = 30 + i * (barW + 3);
          const by = 180 - barH;
          const grad = ctx.createLinearGradient(0, by, 0, by + barH);
          grad.addColorStop(0, '#f026d3');
          grad.addColorStop(0.5, '#a855f7');
          grad.addColorStop(1, '#00f5ff');
          ctx.fillStyle = grad;
          ctx.fillRect(bx, by, barW, barH);
        }

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 13px monospace';
        ctx.fillText('NEO DYNAMICS • REAL-TIME SYNTHESIS • 96kHz 32BIT', 30, 225);
      } else if (v === 1) {
        // Variant 1: Neo-Tokyo Transit & Kanji Hologram
        ctx.strokeStyle = '#f026d3';
        ctx.lineWidth = 4;
        ctx.strokeRect(8, 8, w - 16, h - 16);
        ctx.strokeStyle = '#00f5ff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(14, 14, w - 28, h - 28);

        // Corner brackets
        ctx.fillStyle = '#00f5ff';
        ctx.fillRect(4, 4, 20, 4); ctx.fillRect(4, 4, 4, 20);
        ctx.fillRect(w - 24, 4, 20, 4); ctx.fillRect(w - 8, 4, 4, 20);
        ctx.fillRect(4, h - 8, 20, 4); ctx.fillRect(4, h - 24, 4, 20);
        ctx.fillRect(w - 24, h - 8, 20, 4); ctx.fillRect(w - 8, h - 24, 4, 20);

        ctx.fillStyle = '#f026d3';
        ctx.font = '900 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('新東京 2099', w / 2, 75);

        ctx.fillStyle = '#00f5ff';
        ctx.font = '800 24px monospace';
        ctx.fillText('NEO TRANSIT // RAINLINE EXPRESS', w / 2, 115);

        // Velocity chevron graphic
        ctx.fillStyle = 'rgba(0, 245, 255, 0.25)';
        for (let i = 0; i < 7; i++) {
          const cx = w / 2 - 120 + i * 40;
          ctx.beginPath();
          ctx.moveTo(cx, 135);
          ctx.lineTo(cx + 20, 155);
          ctx.lineTo(cx, 175);
          ctx.lineTo(cx - 10, 175);
          ctx.lineTo(cx + 10, 155);
          ctx.lineTo(cx - 10, 135);
          ctx.fill();
        }

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '700 16px sans-serif';
        ctx.fillText('NEXT HIGH-SPEED DEPARTURE: 00:02 • PLATFORM 7', w / 2, 215);
      } else {
        // Variant 2: Quantum / Hyperion Dynamics
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.strokeRect(8, 8, w - 16, h - 16);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 30px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('HYPERION DYNAMICS', 30, 58);

        ctx.fillStyle = '#a855f7';
        ctx.font = '700 20px monospace';
        ctx.fillText('光速 // WARP RAIL', 340, 58);

        // Tech schematic circles
        ctx.strokeStyle = '#f026d3';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(120, 140, 45, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#00f5ff';
        ctx.beginPath(); ctx.arc(120, 140, 32, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#00f5ff';
        ctx.beginPath(); ctx.arc(120, 140, 8, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = '700 18px monospace';
        ctx.fillText('MAGNETIC FLUX: 42.8 TESLA', 190, 125);
        ctx.fillStyle = '#00f5ff';
        ctx.fillText('SUPERCONDUCTING MAGLEV V5', 190, 155);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 13px sans-serif';
        ctx.fillText('AUTOMATED TRANSIT GRID • SYSTEM NOMINAL', 190, 185);

        ctx.fillStyle = '#f026d3';
        ctx.fillRect(30, 212, w - 60, 3);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Futuristic Skyscraper Facade Texture with Glowing Data & Window Matrix
   */
  public static getNeonTowerFacadeTexture(variant: number = 0): THREE.Texture {
    const v = Math.abs(Math.floor(variant)) % 3;
    return this.getOrCreate(`neon_tower_facade_v${v}`, () => {
      const w = 256;
      const h = 512;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Dark carbon alloy background
      ctx.fillStyle = '#0a0e1c';
      ctx.fillRect(0, 0, w, h);

      // Floor plates & vertical mullions
      const floorH = 24;
      const winW = 16;
      for (let y = 8; y < h; y += floorH) {
        // Floor slab dividing line
        ctx.fillStyle = '#161f36';
        ctx.fillRect(0, y + floorH - 4, w, 4);

        // Windows along the floor
        for (let x = 12; x < w - 12; x += winW + 6) {
          const rand = Math.sin(x * 12.3 + y * 45.7 + v * 9.1);
          if (rand > 0.45) {
            // Illuminated window
            ctx.fillStyle = rand > 0.85 ? '#00f5ff' : (rand > 0.65 ? '#a855f7' : '#e0f2fe');
            ctx.fillRect(x, y + 2, winW, floorH - 8);
          } else if (rand > 0.1) {
            // Dark office window
            ctx.fillStyle = '#10172a';
            ctx.fillRect(x, y + 2, winW, floorH - 8);
          }
        }
      }

      // Vertical luminescent data channel running up the facade
      const conduitX = v === 0 ? 32 : (v === 1 ? w - 36 : w / 2);
      ctx.fillStyle = v % 2 === 0 ? 'rgba(0, 245, 255, 0.85)' : 'rgba(240, 38, 211, 0.85)';
      ctx.fillRect(conduitX, 0, 4, h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(conduitX + 1, 0, 2, h);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Neon Overhead Transit Banner & Portal Sign Texture
   */
  public static getNeonTransitSignTexture(stationName: string = 'RAINLINE CENTRAL', line: string = 'SECTOR 04'): THREE.Texture {
    return this.getOrCreate(`neon_transit_sign_${stationName}_${line}`, () => {
      const w = 512;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Midnight chassis
      ctx.fillStyle = '#050814';
      ctx.fillRect(0, 0, w, h);

      // Neon dual-color frame
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#00f5ff';
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#f026d3';
      ctx.strokeRect(12, 12, w - 24, h - 24);

      // Badge
      ctx.fillStyle = '#f026d3';
      ctx.fillRect(24, 20, 80, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(line, 64, 36);

      // Main station name
      ctx.fillStyle = '#00f5ff';
      ctx.font = '900 28px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(stationName, 116, 38);

      // Subtitle
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 13px monospace';
      ctx.fillText('SPEED LIMIT 350 KM/H • AUTOMATED MAGLEV • 24/7 RAPID TRANSIT', 26, 75);

      // Bottom chevron guide
      ctx.fillStyle = '#00f5ff';
      for (let i = 0; i < 12; i++) {
        const cx = 26 + i * 38;
        ctx.beginPath();
        ctx.moveTo(cx, 92);
        ctx.lineTo(cx + 12, 104);
        ctx.lineTo(cx, 116);
        ctx.lineTo(cx - 6, 116);
        ctx.lineTo(cx + 6, 104);
        ctx.lineTo(cx - 6, 92);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Rain-Soaked Dark Basalt Ballast with Puddle Specular Highlights
   */
  public static getWetBallastTexture(): THREE.Texture {
    return this.getOrCreate('wet_ballast', () => {
      const w = 256;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Deep wet basalt dark base
      ctx.fillStyle = '#101522';
      ctx.fillRect(0, 0, w, h);

      // Crushed stone speckled texture
      for (let i = 0; i < 1800; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 1 + Math.random() * 2.5;
        const shade = Math.floor(18 + Math.random() * 32);
        ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 12})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rain puddles with specular highlights
      ctx.fillStyle = 'rgba(0, 245, 255, 0.08)';
      ctx.beginPath();
      ctx.ellipse(80, 70, 45, 20, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(240, 38, 211, 0.07)';
      ctx.beginPath();
      ctx.ellipse(180, 170, 55, 25, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Specular shine spots in puddles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(75, 68, 14, 2);
      ctx.fillRect(170, 168, 18, 2);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  // -------------------------------------------------------------------------
  // ORBITAL HALO PROCEDURAL TEXTURES
  // -------------------------------------------------------------------------

  /**
   * Procedural Planet Texture with Oceans, Continents, Ice Caps and Swirling Cloud Bands
   */
  public static getOrbitalPlanetTexture(): THREE.Texture {
    return this.getOrCreate('orbital_planet_atmosphere', () => {
      const w = 512;
      const h = 512;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // 1. Deep Ocean Base Gradient
      const oceanGrad = ctx.createLinearGradient(0, 0, w, h);
      oceanGrad.addColorStop(0, '#0c2340');
      oceanGrad.addColorStop(0.3, '#083358');
      oceanGrad.addColorStop(0.7, '#0f4c81');
      oceanGrad.addColorStop(1, '#06192e');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Continental Landmasses & Coastal Shallows
      const numIslands = 18;
      for (let i = 0; i < numIslands; i++) {
        const cx = ((i * 73) % (w - 80)) + 40;
        const cy = 110 + ((i * 47) % (h - 220));
        const radX = 35 + ((i * 19) % 55);
        const radY = 25 + ((i * 23) % 40);

        // Coastal turquoise shallows
        ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, radX + 14, radY + 12, (i * 0.4), 0, Math.PI * 2);
        ctx.fill();

        // Landmass interior: vibrant greens and earth tones
        const landGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radX);
        landGrad.addColorStop(0, '#15803d');
        landGrad.addColorStop(0.6, '#166534');
        landGrad.addColorStop(0.9, '#14532d');
        landGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = landGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, radX, radY, (i * 0.4), 0, Math.PI * 2);
        ctx.fill();

        // Secondary mountain ridge features
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(cx - 5, cy + 3, radX * 0.45, radY * 0.35, (i * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Polar Ice Caps (North & South)
      const northIce = ctx.createLinearGradient(0, 0, 0, 85);
      northIce.addColorStop(0, '#ffffff');
      northIce.addColorStop(0.7, '#e0f2fe');
      northIce.addColorStop(1, 'rgba(224, 242, 254, 0)');
      ctx.fillStyle = northIce;
      ctx.fillRect(0, 0, w, 85);

      const southIce = ctx.createLinearGradient(0, h - 80, 0, h);
      southIce.addColorStop(0, 'rgba(224, 242, 254, 0)');
      southIce.addColorStop(0.3, '#e0f2fe');
      southIce.addColorStop(1, '#ffffff');
      ctx.fillStyle = southIce;
      ctx.fillRect(0, h - 80, w, 80);

      // 4. Atmospheric Cloud Bands and Cyclonic Storm Vortices
      for (let c = 0; c < 16; c++) {
        const cy = 80 + c * 22;
        const opacity = 0.35 + ((c * 7) % 5) * 0.08;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

        // Sinusoidal cloud stream
        ctx.beginPath();
        ctx.moveTo(0, cy);
        for (let x = 0; x <= w; x += 32) {
          const waveY = cy + Math.sin(x * 0.02 + c * 1.5) * 14 + Math.cos(x * 0.05) * 6;
          ctx.lineTo(x, waveY);
        }
        ctx.lineTo(w, cy + 18);
        for (let x = w; x >= 0; x -= 32) {
          const waveY = cy + 18 + Math.sin(x * 0.02 + c * 1.5) * 12;
          ctx.lineTo(x, waveY);
        }
        ctx.closePath();
        ctx.fill();
      }

      // Swirling hurricane vortex
      const hx = 210;
      const hy = 230;
      for (let a = 0; a < 8; a++) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 - a * 0.06})`;
        ctx.lineWidth = 4 + a;
        ctx.beginPath();
        ctx.arc(hx, hy, 10 + a * 6, a * 0.8, a * 0.8 + Math.PI);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * High-Tech Photovoltaic Solar Panel Grid (Orbital Solar Array)
   */
  public static getOrbitalSolarPanelTexture(): THREE.Texture {
    return this.getOrCreate('orbital_solar_panel', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Deep space iridescent navy/sapphire substrate
      ctx.fillStyle = '#061325';
      ctx.fillRect(0, 0, size, size);

      // Silicon wafer cells (8x8 grid)
      const cellSize = size / 8;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const x = c * cellSize + 2;
          const y = r * cellSize + 2;
          const w = cellSize - 4;
          const h = cellSize - 4;

          // Photovoltaic cell gradient
          const cellGrad = ctx.createLinearGradient(x, y, x + w, y + h);
          cellGrad.addColorStop(0, '#0284c7');
          cellGrad.addColorStop(0.5, '#0369a1');
          cellGrad.addColorStop(1, '#082f49');
          ctx.fillStyle = cellGrad;
          ctx.fillRect(x, y, w, h);

          // Micro collection lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.lineWidth = 1;
          for (let m = 4; m < h; m += 6) {
            ctx.beginPath();
            ctx.moveTo(x + 1, y + m);
            ctx.lineTo(x + w - 1, y + m);
            ctx.stroke();
          }

          // Gold electrical busbars
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(x + w * 0.3, y, 1.5, h);
          ctx.fillRect(x + w * 0.7, y, 1.5, h);
        }
      }

      // Outer titanium framing
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.strokeRect(1, 1, size - 2, size - 2);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Aerospace Titanium and White Composite Hull Tiles with Technical Stencils
   */
  public static getOrbitalHullTileTexture(): THREE.Texture {
    return this.getOrCreate('orbital_hull_tiles', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Crisp aerospace white composite base
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, size, size);

      // Panel grid seams
      const step = size / 4;
      ctx.fillStyle = '#cbd5e1';
      for (let i = 0; i <= size; i += step) {
        ctx.fillRect(i - 1, 0, 2, size);
        ctx.fillRect(0, i - 1, size, 2);
      }

      // Rivets / corner mounting studs
      ctx.fillStyle = '#64748b';
      for (let x = step * 0.5; x < size; x += step) {
        for (let y = step * 0.5; y < size; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Technical stencils and electric cyan hazard markings
      ctx.fillStyle = '#00f5ff';
      ctx.fillRect(8, 12, step - 16, 2);
      ctx.fillRect(step + 8, step * 2 + 12, step - 16, 2);

      ctx.fillStyle = '#475569';
      ctx.font = '700 9px monospace';
      ctx.fillText('MOD-7A // DOCK', 10, 28);
      ctx.fillText('VACUUM SEALED', step + 10, step * 2 + 28);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Holographic Orbital Transit Sign Texture (Flight telemetries, docking bays)
   */
  public static getOrbitalHoloSignTexture(variant: number = 0): THREE.Texture {
    const v = Math.abs(Math.floor(variant)) % 3;
    return this.getOrCreate(`orbital_holo_sign_v${v}`, () => {
      const w = 384;
      const h = 192;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Translucent deep-space cyan chassis
      ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
      ctx.fillRect(0, 0, w, h);

      // High-tech holographic border
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Corner bracket accents
      const bracketLen = 18;
      ctx.fillStyle = '#00f5ff';
      ctx.fillRect(4, 4, bracketLen, 4);
      ctx.fillRect(4, 4, 4, bracketLen);
      ctx.fillRect(w - 4 - bracketLen, 4, bracketLen, 4);
      ctx.fillRect(w - 8, 4, 4, bracketLen);
      ctx.fillRect(4, h - 8, bracketLen, 4);
      ctx.fillRect(4, h - 4 - bracketLen, 4, bracketLen);
      ctx.fillRect(w - 4 - bracketLen, h - 8, bracketLen, 4);
      ctx.fillRect(w - 8, h - 4 - bracketLen, 4, bracketLen);

      if (v === 0) {
        // Telemetry & Orbital Velocity readout
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(20, 22, 100, 20);
        ctx.fillStyle = '#020617';
        ctx.font = '900 11px sans-serif';
        ctx.fillText('HALO DOCK 01', 28, 36);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 20px "Arial Black", sans-serif';
        ctx.fillText('ORBITAL TRANSIT RING', 20, 72);

        ctx.fillStyle = '#00f5ff';
        ctx.font = '700 13px monospace';
        ctx.fillText('ORBITAL VELOCITY: 7.68 KM/S', 20, 102);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 11px monospace';
        ctx.fillText('ALTITUDE: 418 KM // APOGEE STABLE', 20, 124);
        ctx.fillText('PRESSURIZED TUBE: 101.3 KPA NOMINAL', 20, 142);

        // Compass / Horizon Artificial Ring
        ctx.strokeStyle = '#00f5ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(315, 95, 34, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(315, 61);
        ctx.lineTo(315, 129);
        ctx.moveTo(281, 95);
        ctx.lineTo(349, 95);
        ctx.stroke();
      } else if (v === 1) {
        // Transit Line 02 & Earth Link
        ctx.fillStyle = '#00f5ff';
        ctx.fillRect(20, 22, 130, 20);
        ctx.fillStyle = '#020617';
        ctx.font = '900 11px sans-serif';
        ctx.fillText('SOL-3 MAGLEV LINE', 28, 36);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 20px "Arial Black", sans-serif';
        ctx.fillText('TRANS-ORBITAL EXPRESS', 20, 72);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '700 13px monospace';
        ctx.fillText('NEXT DOCK: EQUATORIAL ANCHOR 04', 20, 102);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 11px monospace';
        ctx.fillText('FLUX LEVEL: 68.4 TESLA // ACCEL READY', 20, 124);
        ctx.fillText('SPACE ELEVATOR CONNECTION: ACTIVE', 20, 142);

        // Directional chevrons
        ctx.fillStyle = '#00f5ff';
        for (let i = 0; i < 5; i++) {
          const cx = 265 + i * 20;
          ctx.beginPath();
          ctx.moveTo(cx, 80);
          ctx.lineTo(cx + 10, 95);
          ctx.lineTo(cx, 110);
          ctx.lineTo(cx + 4, 110);
          ctx.lineTo(cx + 14, 95);
          ctx.lineTo(cx + 4, 80);
          ctx.fill();
        }
      } else {
        // Deep Space Gateway & Departure Vectors
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(20, 22, 140, 20);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 11px sans-serif';
        ctx.fillText('DEEP SPACE DOCKS', 28, 36);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 20px "Arial Black", sans-serif';
        ctx.fillText('GATEWAY TERMINUS 09', 20, 72);

        ctx.fillStyle = '#00f5ff';
        ctx.font = '700 13px monospace';
        ctx.fillText('SHUTTLE FLIGHT CORRIDOR: CLEAR', 20, 102);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 11px monospace';
        ctx.fillText('LUNAR TRANSFER LAUNCH IN 14 MIN', 20, 124);
        ctx.fillText('WARNING: VACUUM HAZARD BEYOND GATE', 20, 142);

        // Docking radar ring
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(315, 95, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#00f5ff';
        ctx.beginPath();
        ctx.arc(315, 95, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#00f5ff';
        ctx.fillRect(312, 92, 6, 6);
      }

      // Bottom status bar
      ctx.fillStyle = '#00f5ff';
      ctx.fillRect(20, 164, w - 40, 2);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Monumental Orbital Transit Gateway Banner Texture
   */
  public static getOrbitalTransitSignTexture(stationName: string = 'ORBITAL HALO CENTRAL', line: string = 'GATE 07'): THREE.Texture {
    return this.getOrCreate(`orbital_transit_sign_${stationName}_${line}`, () => {
      const w = 512;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Deep space carbon alloy housing
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // High-precision titanium/electric cyan bezel border
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#00f5ff';
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(12, 12, w - 24, h - 24);

      // Gate badge
      ctx.fillStyle = '#00f5ff';
      ctx.fillRect(24, 20, 88, 22);
      ctx.fillStyle = '#030712';
      ctx.font = '900 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(line, 68, 36);

      // Main station name
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 26px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(stationName, 124, 38);

      // Subtitle telemetry
      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 12px monospace';
      ctx.fillText('ORBITAL VELOCITY: 27,600 KM/H • VACUUM TRANSIT • MAGLEV ACTIVE', 26, 74);

      // Bottom guide arrows
      ctx.fillStyle = '#00f5ff';
      for (let i = 0; i < 14; i++) {
        const cx = 26 + i * 34;
        ctx.beginPath();
        ctx.moveTo(cx, 92);
        ctx.lineTo(cx + 10, 104);
        ctx.lineTo(cx, 116);
        ctx.lineTo(cx - 5, 116);
        ctx.lineTo(cx + 5, 104);
        ctx.lineTo(cx - 5, 92);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Magnetic Guideway / Heat-Shield Deck Texture
   */
  public static getOrbitalGuidewayTexture(): THREE.Texture {
    return this.getOrCreate('orbital_guideway_deck', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Dark aerospace carbon base
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, size, size);

      // Thermal ceramic tile blocks
      const step = size / 4;
      for (let x = 0; x < size; x += step) {
        for (let y = 0; y < size; y += step) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
          ctx.fillStyle = '#334155';
          ctx.strokeRect(x + 2, y + 2, step - 4, step - 4);
        }
      }

      // Magnetic levitation flux guide runners
      ctx.fillStyle = '#00f5ff';
      ctx.fillRect(size * 0.25 - 4, 0, 8, size);
      ctx.fillRect(size * 0.75 - 4, 0, 8, size);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(size * 0.25 - 1.5, 0, 3, size);
      ctx.fillRect(size * 0.75 - 1.5, 0, 3, size);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Shimmering Deep Ocean Water Caustic Texture
   */
  public static getAbyssalCausticTexture(): THREE.Texture {
    return this.getOrCreate('abyssal_water_caustics', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Deep aquatic abyss backdrop
      const bg = ctx.createLinearGradient(0, 0, size, size);
      bg.addColorStop(0, '#021321');
      bg.addColorStop(0.5, '#03253b');
      bg.addColorStop(1, '#011624');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);

      // Organic interconnected caustic ripple webbing
      const points: [number, number][] = [
        [32, 45], [96, 28], [170, 52], [224, 38],
        [48, 110], [128, 95], [195, 120], [80, 185],
        [160, 175], [235, 190], [55, 230], [130, 240]
      ];

      const curve = (cpx: number, cpy: number, x: number, y: number) => {
        if (typeof ctx.quadraticCurveTo === 'function') {
          ctx.quadraticCurveTo(cpx, cpy, x, y);
        } else {
          ctx.lineTo(x, y);
        }
      };

      // Layer 1: Soft broad cyan underwater glow
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i * 3 + 1) % points.length];
        const cp = points[(i * 2 + 5) % points.length];
        ctx.moveTo(p1[0], p1[1]);
        curve(cp[0], cp[1], p2[0], p2[1]);
      }
      ctx.stroke();

      // Layer 2: Focused bright electric cyan caustic network
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.65)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        const p3 = points[(i + 4) % points.length];
        ctx.moveTo(p1[0], p1[1]);
        curve((p1[0] + p2[0]) * 0.5 + 8, (p1[1] + p2[1]) * 0.5 - 8, p2[0], p2[1]);
        ctx.moveTo(p2[0], p2[1]);
        curve((p2[0] + p3[0]) * 0.5 - 6, (p2[1] + p3[1]) * 0.5 + 6, p3[0], p3[1]);
      }
      ctx.stroke();

      // Layer 3: Razor-thin diamond-bright caustic convergence lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < points.length; i += 2) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
      }
      ctx.stroke();

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Benthic Ocean Seafloor & Hydrothermal Basalt Texture
   */
  public static getAbyssalSeafloorTexture(): THREE.Texture {
    return this.getOrCreate('abyssal_seafloor_basalt', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Deep ocean volcanic basalt bedrock
      ctx.fillStyle = '#06131c';
      ctx.fillRect(0, 0, size, size);

      // Irregular rock slab fissures
      ctx.fillStyle = '#0a1d29';
      for (let i = 0; i < 28; i++) {
        const rx = (i * 37) % size;
        const ry = (i * 49) % size;
        const rw = 24 + ((i * 13) % 40);
        const rh = 18 + ((i * 17) % 35);
        ctx.beginPath();
        ctx.roundRect(rx, ry, rw, rh, 6);
        ctx.fill();
      }

      // Bioluminescent hydrothermal micro-veins
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(20, 40);
      ctx.lineTo(80, 75);
      ctx.lineTo(140, 60);
      ctx.lineTo(210, 110);
      ctx.moveTo(50, 180);
      ctx.lineTo(120, 160);
      ctx.lineTo(190, 210);
      ctx.stroke();

      // Warm hydrothermal sulfur glow spots
      ctx.fillStyle = '#f59e0b';
      for (let i = 0; i < 8; i++) {
        const gx = ((i * 43) + 20) % size;
        const gy = ((i * 61) + 30) % size;
        ctx.beginPath();
        ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Geodesic Hexagonal Pressure Dome Glass & Framework Texture
   */
  public static getAbyssalDomeHexTexture(): THREE.Texture {
    return this.getOrCreate('abyssal_dome_hex', () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Transparent ocean glass tint base
      ctx.fillStyle = 'rgba(6, 32, 51, 0.85)';
      ctx.fillRect(0, 0, size, size);

      // Hexagonal structural titanium rib lattice
      const hexRadius = 48;
      const h = hexRadius * Math.sqrt(3);
      ctx.strokeStyle = '#0e3a54';
      ctx.lineWidth = 5;

      for (let y = -h; y < size + h; y += h) {
        for (let x = -hexRadius * 3; x < size + hexRadius * 3; x += hexRadius * 3) {
          const drawHex = (cx: number, cy: number) => {
            ctx.beginPath();
            for (let a = 0; a < 6; a++) {
              const angle = (a * Math.PI) / 3;
              const hx = cx + hexRadius * Math.cos(angle);
              const hy = cy + hexRadius * Math.sin(angle);
              if (a === 0) ctx.moveTo(hx, hy);
              else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.stroke();

            // Glowing cyan structural vertex rivets
            ctx.fillStyle = '#00f5ff';
            for (let a = 0; a < 6; a++) {
              const angle = (a * Math.PI) / 3;
              const hx = cx + hexRadius * Math.cos(angle);
              const hy = cy + hexRadius * Math.sin(angle);
              ctx.beginPath();
              ctx.arc(hx, hy, 2.2, 0, Math.PI * 2);
              ctx.fill();
            }
          };

          drawHex(x, y);
          drawHex(x + hexRadius * 1.5, y + h * 0.5);
        }
      }

      // Diagonal ambient light caustics across the glass panes
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(0, size * 0.6);
      ctx.lineTo(size * 0.6, 0);
      ctx.moveTo(size * 0.3, size);
      ctx.lineTo(size, size * 0.3);
      ctx.stroke();

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Deep Sea Bioluminescent Coral Texture
   */
  public static getAbyssalBioluminescentCoralTexture(): THREE.Texture {
    return this.getOrCreate('abyssal_bio_coral', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Deep aquatic background
      ctx.fillStyle = '#031422';
      ctx.fillRect(0, 0, size, size);

      // Branching coral stalk structures
      const drawCoralStalk = (bx: number, by: number, color: string, glowColor: string) => {
        const curve = (cpx: number, cpy: number, x: number, y: number) => {
          if (typeof ctx.quadraticCurveTo === 'function') {
            ctx.quadraticCurveTo(cpx, cpy, x, y);
          } else {
            ctx.lineTo(x, y);
          }
        };

        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx, by);
        curve(bx - 15, by - 40, bx - 25, by - 70);
        ctx.moveTo(bx, by);
        curve(bx + 18, by - 35, bx + 28, by - 65);
        ctx.moveTo(bx, by);
        curve(bx + 4, by - 45, bx + 6, by - 85);
        ctx.stroke();

        // Luminescent tip polyps
        ctx.fillStyle = glowColor;
        [[-25, -70], [28, -65], [6, -85], [-12, -45], [16, -42]].forEach(([ox, oy]) => {
          ctx.beginPath();
          ctx.arc(bx + ox, by + oy, 4.0, 0, Math.PI * 2);
          ctx.fill();
        });
      };

      drawCoralStalk(64, 230, '#0284c7', '#00f5ff'); // Electric cyan coral
      drawCoralStalk(192, 230, '#9333ea', '#f026d3'); // Magenta sea fan
      drawCoralStalk(128, 240, '#0d9488', '#22d3ee'); // Teal sea whip

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Underwater Oceanic Transit Departures Banner Texture
   */
  public static getAbyssalTransitSignTexture(): THREE.Texture {
    return this.getOrCreate('abyssal_transit_sign', () => {
      const w = 512;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Deep nautical graphite hull
      ctx.fillStyle = '#051826';
      ctx.fillRect(0, 0, w, h);

      // Electric cyan luminous border
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, w - 8, h - 8);

      // Header district name
      ctx.fillStyle = '#00f5ff';
      ctx.font = '900 24px sans-serif';
      ctx.fillText('ABYSSAL GLASSLINE // SECTOR 08', 24, 42);

      // Telemetry badge
      ctx.fillStyle = '#0d9488';
      ctx.fillRect(24, 52, 90, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 11px monospace';
      ctx.fillText('DEPTH: 8,450M', 30, 65);

      // Hydrostatic status
      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 12px monospace';
      ctx.fillText('PRESSURE: 845 ATM • GLASS TUBE INTEGRITY: 100% • HYDRO-MAGLEV ACTIVE', 124, 65);

      // Bottom guide arrows
      ctx.fillStyle = '#22d3ee';
      for (let i = 0; i < 14; i++) {
        const cx = 24 + i * 34;
        ctx.beginPath();
        ctx.moveTo(cx, 85);
        ctx.lineTo(cx + 10, 97);
        ctx.lineTo(cx, 109);
        ctx.lineTo(cx - 5, 109);
        ctx.lineTo(cx + 5, 97);
        ctx.lineTo(cx - 5, 85);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Underwater Holographic Telemetry & Depth Warning Displays
   */
  public static getAbyssalHoloSignTexture(variant: number = 0): THREE.Texture {
    return this.getOrCreate(`abyssal_holo_sign_${variant}`, () => {
      const w = 256;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Deep cyan/teal translucent holographic projection background
      ctx.fillStyle = 'rgba(2, 26, 42, 0.90)';
      ctx.fillRect(0, 0, w, h);

      // Outer illuminated neon cyan border
      ctx.strokeStyle = variant === 1 ? '#f59e0b' : '#00f5ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(3, 3, w - 6, h - 6);

      if (variant === 0) {
        // Variant 0: Hydrostatic Pressure & Hull Seal Monitor
        ctx.fillStyle = '#00f5ff';
        ctx.font = '800 14px sans-serif';
        ctx.fillText('HYDROSTATIC MONITOR', 16, 28);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '600 11px monospace';
        ctx.fillText('DEPTH: -8,450 METERS', 16, 50);
        ctx.fillText('EXTERNAL: 845.2 ATM', 16, 68);
        ctx.fillText('GLASS TUBE SEAL: NOMINAL', 16, 86);

        // Circular Pressure Dial
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(205, 64, 24, 0, Math.PI * 1.5);
        ctx.stroke();

        ctx.fillStyle = '#00f5ff';
        ctx.beginPath();
        ctx.arc(205, 64, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (variant === 1) {
        // Variant 1: Hydrothermal Vent & Thermal Energy Grid
        ctx.fillStyle = '#f59e0b';
        ctx.font = '800 14px sans-serif';
        ctx.fillText('GEOTHERMAL VENT SECTOR', 16, 28);

        ctx.fillStyle = '#fbbf24';
        ctx.font = '600 11px monospace';
        ctx.fillText('CORE TEMP: 382°C', 16, 50);
        ctx.fillText('ENERGY HARVEST: 98.4%', 16, 68);
        ctx.fillText('CURRENT VELOCITY: 4.2 M/S', 16, 86);

        // Thermal wave spikes
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(170, 75);
        ctx.lineTo(185, 45);
        ctx.lineTo(195, 80);
        ctx.lineTo(210, 38);
        ctx.lineTo(225, 75);
        ctx.stroke();
      } else {
        // Variant 2: Deep Trench Navigation & Sonar Bathymetry
        ctx.fillStyle = '#00f5ff';
        ctx.font = '800 14px sans-serif';
        ctx.fillText('BATHYMETRIC TRENCH', 16, 28);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '600 11px monospace';
        ctx.fillText('MARIANA RIFT • SECTOR 08', 16, 50);
        ctx.fillText('SONAR ECHO: CLEAR', 16, 68);
        ctx.fillText('TRANSIT GUIDANCE: ACTIVE', 16, 86);

        // Concentric Sonar Rings
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(205, 64, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(205, 64, 22, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Progress bar at bottom
      ctx.fillStyle = variant === 1 ? '#f59e0b' : '#00f5ff';
      ctx.fillRect(16, 102, w - 32, 4);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Underwater Hydro-Maglev Guideway Track Deck Texture
   */
  public static getAbyssalGuidewayTexture(): THREE.Texture {
    return this.getOrCreate('abyssal_guideway_deck', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Deep marine titanium-tungsten deck
      ctx.fillStyle = '#061824';
      ctx.fillRect(0, 0, size, size);

      // High-pressure segmented floor plates
      const step = size / 4;
      for (let x = 0; x < size; x += step) {
        for (let y = 0; y < size; y += step) {
          ctx.fillStyle = '#0a2333';
          ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
          ctx.strokeStyle = '#133e5c';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 2, y + 2, step - 4, step - 4);
        }
      }

      // Magnetic levitation induction rails with bioluminescent teal conduits
      ctx.fillStyle = '#00f5ff';
      ctx.fillRect(size * 0.25 - 4, 0, 8, size);
      ctx.fillRect(size * 0.75 - 4, 0, 8, size);

      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(size * 0.25 - 1.5, 0, 3, size);
      ctx.fillRect(size * 0.75 - 1.5, 0, 3, size);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Apocalyptic Doomsday Distress & Evacuation Transit Sign Texture
   */
  public static getDoomsdayDistressSignTexture(variant: 0 | 1 | 2 = 0): THREE.Texture {
    return this.getOrCreate(`doomsday_distress_sign_${variant}`, () => {
      const w = 512;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Deep charred metal housing
      ctx.fillStyle = '#0f0907';
      ctx.fillRect(0, 0, w, h);

      // Warning hazard border (black and amber/red stripes)
      const stripeW = 16;
      ctx.fillStyle = variant === 1 ? '#ef4444' : '#f97316';
      for (let x = -stripeW; x < w + stripeW; x += stripeW * 2) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + stripeW, 0);
        ctx.lineTo(x, 14);
        ctx.lineTo(x - stripeW, 14);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x, h - 14);
        ctx.lineTo(x + stripeW, h - 14);
        ctx.lineTo(x, h);
        ctx.lineTo(x - stripeW, h);
        ctx.fill();
      }

      // Display matrix panel
      ctx.fillStyle = '#1c0a05';
      ctx.fillRect(14, 18, w - 28, h - 36);

      // Flashing alert headers & distress typography
      ctx.fillStyle = variant === 1 ? '#ff3b30' : (variant === 2 ? '#ff9500' : '#ffcc00');
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      if (variant === 0) {
        ctx.fillText('EVACUATION LAST TRANSIT // SECTOR 00', 26, 28);
        ctx.fillStyle = '#f97316';
        ctx.font = '14px monospace';
        ctx.fillText('STATUS: CRITICAL // CIVILIAN DEPARTURE TERMINAL AHEAD', 26, 58);
        ctx.fillText('WARNING: STRUCTURAL FAILURE IMMINENT >>> KEEP MOVING', 26, 78);
      } else if (variant === 1) {
        ctx.fillText('GRID COLLAPSE // RADIATION OUTPOST 04', 26, 28);
        ctx.fillStyle = '#ef4444';
        ctx.font = '14px monospace';
        ctx.fillText('SECTOR INTEGRITY: 14% // ATMOSPHERIC FALLOUT HAZARD', 26, 58);
        ctx.fillText('DO NOT DETRAIN // BLAST DOORS CLOSING IN T-MINUS 04:00', 26, 78);
      } else {
        ctx.fillText('BUNKER CORRIDOR // ARMED EXCLUSION ZONE', 26, 28);
        ctx.fillStyle = '#f59e0b';
        ctx.font = '14px monospace';
        ctx.fillText('FINAL REFUGE FACILITY // TRANSIT CLEARANCE REQUIRED', 26, 58);
        ctx.fillText('RESTRICTED PROTOCOL ENFORCED // REMAIN IN VEHICLE', 26, 78);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Scorched Concrete Blast Wall with Jagged Fractures Texture
   */
  public static getDoomsdayScorchedConcreteTexture(): THREE.Texture {
    return this.getOrCreate('doomsday_scorched_concrete', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Deep soot and char base
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, size, size);

      // Concrete blast slab blocks
      const step = size / 4;
      for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
          ctx.fillStyle = (x + y) % 32 === 0 ? '#171412' : '#231f1c';
          ctx.fillRect(x + 2, y + 2, step - 4, step - 4);

          // Deep fissure / fracture lines
          ctx.strokeStyle = '#0c0a09';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 6, y + 10);
          ctx.lineTo(x + step * 0.45, y + step * 0.55);
          ctx.lineTo(x + step - 8, y + step - 12);
          ctx.stroke();

          // Exposed rebar steel grid lines
          ctx.strokeStyle = '#7c2d12';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + step * 0.3, y + 4);
          ctx.lineTo(x + step * 0.3, y + step - 4);
          ctx.stroke();
        }
      }

      // Thermal burn scorch marks across slabs
      const grad = ctx.createRadialGradient(size * 0.5, size * 0.5, 10, size * 0.5, size * 0.5, size * 0.45);
      grad.addColorStop(0, 'rgba(124, 45, 18, 0.45)');
      grad.addColorStop(0.6, 'rgba(30, 20, 15, 0.6)');
      grad.addColorStop(1, 'rgba(15, 10, 8, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * High-Visibility Industrial Hazard Chevrons Texture
   */
  public static getDoomsdayHazardStripesTexture(): THREE.Texture {
    return this.getOrCreate('doomsday_hazard_stripes', () => {
      const size = 128;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Soot black background
      ctx.fillStyle = '#140c0a';
      ctx.fillRect(0, 0, size, size);

      // Vivid amber warning diagonals
      ctx.fillStyle = '#f97316';
      const stripeW = 24;
      for (let x = -size; x < size * 2; x += stripeW * 2) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + stripeW, 0);
        ctx.lineTo(x + stripeW - size, size);
        ctx.lineTo(x - size, size);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Fractured / Glitched Futuristic Holographic Billboard Texture
   */
  public static getDoomsdayBillboardFracturedTexture(variant: 0 | 1 = 0): THREE.Texture {
    return this.getOrCreate(`doomsday_billboard_fractured_${variant}`, () => {
      const w = 512;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Burned-out frame
      ctx.fillStyle = '#0a0504';
      ctx.fillRect(0, 0, w, h);

      // Flickering active quadrant
      ctx.fillStyle = '#1f0d06';
      ctx.fillRect(12, 12, w - 24, h - 24);

      // Horizontal static scanlines
      ctx.fillStyle = 'rgba(249, 115, 22, 0.08)';
      for (let y = 14; y < h - 14; y += 4) {
        ctx.fillRect(14, y, w - 28, 2);
      }

      // High-priority emergency broadcast graphics
      ctx.fillStyle = variant === 0 ? '#ef4444' : '#f97316';
      ctx.font = 'bold 32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(variant === 0 ? '⚠️ EMERGENCY BROADCAST' : '⚠️ ALL TRANSIT CANCELLED', w * 0.5, 60);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(variant === 0 ? 'METROPOLIS CORE DESTABILIZING' : 'FINAL CONVOY CLEARING SECTOR 08', w * 0.5, 110);

      ctx.fillStyle = '#d97706';
      ctx.font = '16px monospace';
      ctx.fillText('PROCEED RAPIDLY ALONG ACTIVE GUIDEWAY', w * 0.5, 150);
      ctx.fillText('DO NOT EXIT TO GROUND LEVEL // ATMOSPHERE HAZARD', w * 0.5, 180);

      // Broken / shattered screen overlay lines
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.2, 0);
      ctx.lineTo(w * 0.45, h * 0.6);
      ctx.lineTo(w * 0.8, h);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 100, 50, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.45, h * 0.6);
      ctx.lineTo(w * 0.6, h * 0.2);
      ctx.stroke();

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Molten Magma & Geothermal Vein Texture
   */
  public static getDoomsdayMoltenFissureTexture(): THREE.Texture {
    return this.getOrCreate('doomsday_molten_fissure', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Charred crust
      ctx.fillStyle = '#140806';
      ctx.fillRect(0, 0, size, size);

      // Fiery glowing magma fissures
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(size * 0.1, size * 0.2);
      ctx.lineTo(size * 0.4, size * 0.5);
      ctx.lineTo(size * 0.7, size * 0.4);
      ctx.lineTo(size * 0.9, size * 0.8);
      ctx.stroke();

      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(size * 0.1, size * 0.2);
      ctx.lineTo(size * 0.4, size * 0.5);
      ctx.lineTo(size * 0.7, size * 0.4);
      ctx.lineTo(size * 0.9, size * 0.8);
      ctx.stroke();

      // Incandescent core vein
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size * 0.12, size * 0.21);
      ctx.lineTo(size * 0.4, size * 0.5);
      ctx.lineTo(size * 0.68, size * 0.41);
      ctx.lineTo(size * 0.89, size * 0.79);
      ctx.stroke();

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  // -------------------------------------------------------------------------
  // PHANTOM LINE: GHOST HORROR PREMIUM WORLD TEXTURES
  // -------------------------------------------------------------------------

  /**
   * Decaying Victorian Subterranean Ceramic Glazed Tile Texture
   */
  public static getPhantomDecayedTileTexture(): THREE.Texture {
    return this.getOrCreate('phantom_decayed_tile', () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Damp subterranean substrate background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, size, size);

      // Sub-tile grid: 8 columns x 16 rows of subway brick tiles
      const cols = 8;
      const rows = 16;
      const tileW = size / cols;
      const tileH = size / rows;

      for (let r = 0; r < rows; r++) {
        const offset = (r % 2 === 0) ? 0 : tileW * 0.5;
        for (let c = -1; c <= cols; c++) {
          const x = c * tileW + offset;
          const y = r * tileH;

          // Aged, mildewed off-white/pale greenish-gray ceramic tile
          const tone = 210 + Math.floor(Math.sin(c * 3.7 + r * 2.3) * 20);
          const greenTint = Math.floor(tone * 0.96);
          const blueTint = Math.floor(tone * 0.94);
          ctx.fillStyle = `rgb(${tone - 20}, ${greenTint}, ${blueTint})`;
          ctx.fillRect(x + 1.5, y + 1.5, tileW - 3, tileH - 3);

          // Tile highlight bevel top/left
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.fillRect(x + 1.5, y + 1.5, tileW - 3, 2);
          ctx.fillRect(x + 1.5, y + 1.5, 2, tileH - 3);

          // Tile shadow bevel bottom/right
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillRect(x + 1.5, y + tileH - 3.5, tileW - 3, 2);
          ctx.fillRect(x + tileW - 3.5, y + 1.5, 2, tileH - 3);

          // Water seepage and grime streaks on random tiles
          if ((c + r * 3) % 5 === 0) {
            ctx.fillStyle = 'rgba(6, 78, 59, 0.45)'; // Mildew green
            ctx.fillRect(x + 3, y + 3, tileW - 6, tileH - 6);
          }
          if ((c * 7 + r) % 11 === 0) {
            ctx.fillStyle = 'rgba(2, 6, 23, 0.75)'; // Missing/broken tile
            ctx.fillRect(x + 1.5, y + 1.5, tileW - 3, tileH - 3);
          }
        }
      }

      // Descending dark vertical water drip streaks
      ctx.fillStyle = 'rgba(8, 47, 73, 0.35)';
      ctx.fillRect(size * 0.22, 0, 14, size);
      ctx.fillRect(size * 0.68, 0, 22, size);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Distorted Antique Station Wall Clock Face (Frozen at 3:33)
   */
  public static getPhantomDistortedClockTexture(): THREE.Texture {
    return this.getOrCreate('phantom_distorted_clock', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Outer bezel ring
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.5, size * 0.48, 0, Math.PI * 2);
      ctx.fill();

      // Tarnished brass rim
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Yellowed parchment clock dial
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.5, size * 0.42, 0, Math.PI * 2);
      ctx.fill();

      // Faded Roman numeral markings
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('XII', size * 0.5, size * 0.18);
      ctx.fillText('III', size * 0.82, size * 0.5);
      ctx.fillText('VI', size * 0.5, size * 0.82);
      ctx.fillText('IX', size * 0.18, size * 0.5);

      // Cracked glass fracture line
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(size * 0.2, size * 0.15);
      ctx.lineTo(size * 0.5, size * 0.5);
      ctx.lineTo(size * 0.75, size * 0.8);
      ctx.stroke();

      // Clock hands frozen at 3:33 (Hour hand towards III, Minute hand past VI)
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(size * 0.5, size * 0.5);
      ctx.lineTo(size * 0.76, size * 0.54); // Hour hand at ~3:15-3:30
      ctx.stroke();

      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(size * 0.5, size * 0.5);
      ctx.lineTo(size * 0.58, size * 0.82); // Minute hand at ~33 min
      ctx.stroke();

      // Center rivet
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.5, 6, 0, Math.PI * 2);
      ctx.fill();

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Decaying Derelict Station Enamel Signage
   */
  public static getPhantomDistressSignTexture(variant: number = 0): THREE.Texture {
    return this.getOrCreate(`phantom_distress_sign_${variant}`, () => {
      const w = 512;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Weathered rusted iron plate backing
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Enamel face with border
      const faceColor = variant === 1 ? '#450a0a' : (variant === 2 ? '#064e3b' : '#082f49');
      ctx.fillStyle = faceColor;
      ctx.fillRect(8, 8, w - 16, h - 16);

      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 3;
      ctx.strokeRect(12, 12, w - 24, h - 24);

      // Warning text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (variant === 0) {
        ctx.fillStyle = '#e0f2fe';
        ctx.font = 'bold 30px "Arial Black", sans-serif';
        ctx.fillText('PLATFORM 13 // CLOSED', w * 0.5, 45);
        ctx.fillStyle = '#67e8f9';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillText('NO DEPARTURES SCHEDULED', w * 0.5, 85);
      } else if (variant === 1) {
        ctx.fillStyle = '#fecaca';
        ctx.font = 'bold 28px "Arial Black", sans-serif';
        ctx.fillText('ABANDONED TRACK // KEEP OUT', w * 0.5, 45);
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillText('UNSTABLE ARCHITECTURE', w * 0.5, 85);
      } else {
        ctx.fillStyle = '#ccfbf1';
        ctx.font = 'bold 28px "Arial Black", sans-serif';
        ctx.fillText('STATION OUT OF SERVICE', w * 0.5, 45);
        ctx.fillStyle = '#2dd4bf';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillText('POWER SEVERED 1974', w * 0.5, 85);
      }

      // Rust blotches on corners
      ctx.fillStyle = 'rgba(120, 53, 15, 0.65)';
      ctx.beginPath();
      ctx.arc(14, 14, 12, 0, Math.PI * 2);
      ctx.arc(w - 14, 14, 14, 0, Math.PI * 2);
      ctx.arc(14, h - 14, 16, 0, Math.PI * 2);
      ctx.arc(w - 14, h - 14, 10, 0, Math.PI * 2);
      ctx.fill();

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Spectral Passenger Silhouette in Window / Alcove
   */
  public static getPhantomSpectralSilhouetteTexture(): THREE.Texture {
    return this.getOrCreate('phantom_spectral_silhouette', () => {
      const w = 256;
      const h = 512;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Pitch black alcove / window interior
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      // Pale cyan spectral ethereal glow aura
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, 10, w * 0.5, h * 0.45, w * 0.45);
      grad.addColorStop(0, 'rgba(103, 232, 249, 0.55)');
      grad.addColorStop(0.6, 'rgba(45, 212, 191, 0.25)');
      grad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Slender shadowy humanoid specter silhouette
      ctx.fillStyle = '#030712';

      // Head
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.28, 28, 0, Math.PI * 2);
      ctx.fill();

      // Torso & long coat
      ctx.beginPath();
      ctx.moveTo(w * 0.35, h * 0.36);
      ctx.lineTo(w * 0.65, h * 0.36);
      ctx.lineTo(w * 0.74, h * 0.85);
      ctx.lineTo(w * 0.26, h * 0.85);
      ctx.closePath();
      ctx.fill();

      // Pale glowing eye motes
      ctx.fillStyle = '#a5f3fc';
      ctx.beginPath();
      ctx.arc(w * 0.46, h * 0.28, 2.5, 0, Math.PI * 2);
      ctx.arc(w * 0.54, h * 0.28, 2.5, 0, Math.PI * 2);
      ctx.fill();

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Murky Water Puddle & Fluorescent Specular Reflection Texture
   */
  public static getPhantomWaterMirrorTexture(): THREE.Texture {
    return this.getOrCreate('phantom_water_mirror', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Dark wet ballast base
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, size, size);

      // Murky standing water pool
      ctx.fillStyle = 'rgba(8, 47, 73, 0.85)';
      ctx.beginPath();
      ctx.ellipse(size * 0.5, size * 0.5, size * 0.42, size * 0.32, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Reflected cold fluorescent tube light streak in the puddle
      ctx.fillStyle = 'rgba(103, 232, 249, 0.75)';
      ctx.fillRect(size * 0.28, size * 0.46, size * 0.44, 4);

      // Subtle ripple rings
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(size * 0.5, size * 0.5, size * 0.25, size * 0.15, 0.2, 0, Math.PI * 2);
      ctx.stroke();

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Weathered Gothic Ashlar Stone & Cemetery Masonry Texture
   */
  public static getHauntedGothicStoneTexture(): THREE.Texture {
    return this.getOrCreate('haunted_gothic_stone', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Deep dark violet-slate masonry base
      ctx.fillStyle = '#181226';
      ctx.fillRect(0, 0, size, size);

      // Carved stone blocks
      const blockH = 32;
      const blockW = 64;
      for (let y = 0; y < size; y += blockH) {
        const row = Math.floor(y / blockH);
        const offsetX = (row % 2 === 0) ? 0 : blockW * 0.5;
        for (let x = -blockW; x < size + blockW; x += blockW) {
          const bx = x + offsetX;
          ctx.fillStyle = ((row + Math.floor(bx / blockW)) % 2 === 0) ? '#221935' : '#1b132a';
          ctx.fillRect(bx + 1, y + 1, blockW - 2, blockH - 2);

          // Cracked fissure / moss detail
          if ((row + bx) % 3 === 0) {
            ctx.strokeStyle = '#0e0919';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bx + 6, y + 4);
            ctx.lineTo(bx + 18, y + 16);
            ctx.lineTo(bx + 26, y + 26);
            ctx.stroke();
          }
        }
      }

      // Deep dark mortar borders
      ctx.strokeStyle = '#0a0512';
      ctx.lineWidth = 2;
      for (let y = 0; y <= size; y += blockH) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Intricately Carved Glowing Jack-o'-Lantern Face Texture
   */
  public static getHauntedJackOLanternTexture(): THREE.Texture {
    return this.getOrCreate('haunted_jack_o_lantern', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Vibrant pumpkin orange ribbed rind base
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(0, 0, size, size);

      // Darker vertical pumpkin rind grooves
      ctx.fillStyle = '#c2410c';
      for (let x = 0; x < size; x += 32) {
        ctx.fillRect(x, 0, 6, size);
      }

      // Glowing carved face interior (luminous gold/amber)
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;

      // Triangular carved left eye
      ctx.beginPath();
      ctx.moveTo(60, 80);
      ctx.lineTo(100, 80);
      ctx.lineTo(80, 50);
      ctx.closePath();
      ctx.fill();

      // Triangular carved right eye
      ctx.beginPath();
      ctx.moveTo(156, 80);
      ctx.lineTo(196, 80);
      ctx.lineTo(176, 50);
      ctx.closePath();
      ctx.fill();

      // Carved nose triangle
      ctx.beginPath();
      ctx.moveTo(118, 115);
      ctx.lineTo(138, 115);
      ctx.lineTo(128, 95);
      ctx.closePath();
      ctx.fill();

      // Sinister jagged grinning mouth with carved teeth
      ctx.beginPath();
      ctx.moveTo(45, 155);
      ctx.lineTo(75, 175);
      ctx.lineTo(95, 155);
      ctx.lineTo(115, 180);
      ctx.lineTo(141, 155);
      ctx.lineTo(161, 180);
      ctx.lineTo(181, 155);
      ctx.lineTo(211, 160);
      ctx.lineTo(195, 195);
      ctx.lineTo(165, 190);
      ctx.lineTo(145, 205);
      ctx.lineTo(111, 205);
      ctx.lineTo(91, 190);
      ctx.lineTo(61, 195);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Spooky Carnival Big-Top Striped Canvas Texture
   */
  public static getHauntedCarnivalStripeTexture(): THREE.Texture {
    return this.getOrCreate('haunted_carnival_stripe', () => {
      const size = 256;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Alternating deep gothic purple, midnight black, and pumpkin orange vertical stripes
      const stripeW = 32;
      const colors = ['#4c1d95', '#0f051d', '#ea580c', '#0f051d'];
      for (let x = 0; x < size; x += stripeW) {
        const colorIdx = Math.floor(x / stripeW) % colors.length;
        ctx.fillStyle = colors[colorIdx];
        ctx.fillRect(x, 0, stripeW, size);

        // Subtle fabric weave texture
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        for (let y = 0; y < size; y += 4) {
          ctx.fillRect(x, y, stripeW, 1);
        }
      }

      // Shadow seam between stripes
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      for (let x = 0; x < size; x += stripeW) {
        ctx.fillRect(x, 0, 2, size);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Vintage Distressed Carnival & Cemetery Directional Signboard Textures
   */
  public static getHauntedSpookySignTexture(variant: number = 0): THREE.Texture {
    const key = `haunted_spooky_sign_${variant}`;
    return this.getOrCreate(key, () => {
      const w = 512;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Weathered dark mahogany / aged wood backing
      ctx.fillStyle = '#1c0f24';
      ctx.fillRect(0, 0, w, h);

      // Ornate gothic double border
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 4;
      ctx.strokeRect(6, 6, w - 12, h - 12);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.strokeRect(12, 12, w - 24, h - 24);

      // Corner carnival rosettes
      [[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]].forEach(([cx, cy]) => {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Typography
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (variant === 0) {
        ctx.fillStyle = '#f97316';
        ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
        ctx.fillText('★ HAUNTED CARNIVAL ★', w * 0.5, h * 0.38);
        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillText('ENTER IF YOU DARE // NO RETURN', w * 0.5, h * 0.72);
      } else if (variant === 1) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 32px "Trebuchet MS", sans-serif';
        ctx.fillText('TICKETS & ADMISSION', w * 0.5, h * 0.38);
        ctx.fillStyle = '#ea580c';
        ctx.font = 'bold 17px "Courier New", monospace';
        ctx.fillText('ONE-WAY PASSENGER FARE // 1 SOUL', w * 0.5, h * 0.72);
      } else {
        ctx.fillStyle = '#f97316';
        ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
        ctx.fillText('FUNHOUSE ➔  GHOST TRAIN ➔', w * 0.5, h * 0.38);
        ctx.fillStyle = '#a855f7';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillText('GRAVEYARD CRYPT ➔ ALL ABOARD', w * 0.5, h * 0.72);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Pointed Gothic Arched Stained Glass Window with Candle Light Texture
   */
  public static getHauntedGothicWindowTexture(): THREE.Texture {
    return this.getOrCreate('haunted_gothic_window', () => {
      const w = 128;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Dark stone background
      ctx.fillStyle = '#110c1c';
      ctx.fillRect(0, 0, w, h);

      // Stained glass luminous opening
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(16, h - 16);
      ctx.lineTo(w - 16, h - 16);
      ctx.lineTo(w - 16, 80);
      if (typeof ctx.quadraticCurveTo === 'function') {
        ctx.quadraticCurveTo(w * 0.5, 8, 16, 80);
      } else {
        ctx.lineTo(w * 0.5, 8);
        ctx.lineTo(16, 80);
      }
      ctx.closePath();
      ctx.fill();

      // Violet glass accents in upper arch
      ctx.fillStyle = '#7e22ce';
      ctx.beginPath();
      ctx.arc(w * 0.5, 60, 18, 0, Math.PI * 2);
      ctx.fill();

      // Stone/iron tracery mullions
      ctx.strokeStyle = '#1a102b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 20);
      ctx.lineTo(w * 0.5, h - 16);
      ctx.moveTo(16, 120);
      ctx.lineTo(w - 16, 120);
      ctx.moveTo(16, 180);
      ctx.lineTo(w - 16, 180);
      ctx.stroke();

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Ceremonial Triumphal Gate Banner ("GRAND OPENING" / "GRAND OPENING — PART 2")
   */
  public static getVipGrandOpeningSignTexture(isPartTwo: boolean = false): THREE.Texture {
    const key = `vip_grand_opening_${isPartTwo ? 'part2' : 'part1'}_hd`;
    return this.getOrCreate(key, () => {
      const w = 1024;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Deep ceremonial royal navy backdrop
      ctx.fillStyle = '#0a1128';
      ctx.fillRect(0, 0, w, h);

      // Saffron and gold decorative borders
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 4;
      ctx.strokeRect(22, 22, w - 44, h - 44);

      // Gold corner rosette medallions
      ctx.fillStyle = '#ffd700';
      [
        [32, 32], [w - 32, 32], [32, h - 32], [w - 32, h - 32]
      ].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
      });

      // Crossed ceremonial shears icon on left & right
      [110, w - 110].forEach((cx) => {
        ctx.fillStyle = '#f59e0b';
        ctx.font = '72px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✂️', cx, 145);
      });

      // Heading text - Bold, large, high contrast
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.font = '900 64px "Trebuchet MS", "Outfit", sans-serif';
      if (isPartTwo) {
        ctx.fillText('★ GRAND RE-OPENING ★', w * 0.5, 110);
      } else {
        ctx.fillText('★ GRAND INAUGURATION ★', w * 0.5, 110);
      }

      // Bold legible subhead
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "Trebuchet MS", sans-serif';
      ctx.fillText(
        isPartTwo ? 'CEREMONIAL OVERPASS · PHASE 2' : 'VIP EXPRESS LINE · OFFICIAL CEREMONY',
        w * 0.5,
        185
      );

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      return tex;
    });
  }

  /**
   * The Eternal Photo Opportunity Installation Sign ("ONE MORE PHOTO!")
   */
  public static getVipPhotoOpSignTexture(): THREE.Texture {
    return this.getOrCreate('vip_photo_op_sign_hd', () => {
      const w = 1024;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Crimson & Gold ceremonial background
      ctx.fillStyle = '#881337';
      ctx.fillRect(0, 0, w, h);

      // Ornate gold frame border
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 12;
      ctx.strokeRect(12, 12, w - 24, h - 24);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(26, 26, w - 52, h - 52);

      // Flanking camera icons
      [110, w - 110].forEach((cx) => {
        ctx.fillStyle = '#ffd700';
        ctx.font = '76px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📷', cx, 150);
      });

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fffbeb';
      ctx.font = '900 68px "Trebuchet MS", sans-serif';
      ctx.fillText('★ OFFICIAL PHOTO OP ★', w * 0.5, 115);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
      ctx.fillText('PRESS POOL · SMILE FOR THE NATION', w * 0.5, 185);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      return tex;
    });
  }

  /**
   * Megastructure Announcement Screen Ticker
   */
  public static getVipAnnouncementScreenTexture(variant: number = 0): THREE.Texture {
    const key = `vip_announcement_screen_${variant % 3}_hd`;
    return this.getOrCreate(key, () => {
      const w = 1024;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Dark LED Matrix background
      ctx.fillStyle = '#050a18';
      ctx.fillRect(0, 0, w, h);

      // LED grid lines
      ctx.strokeStyle = 'rgba(30, 58, 138, 0.4)';
      ctx.lineWidth = 2;
      for (let y = 0; y < h; y += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Border glow
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, w - 16, h - 16);

      ctx.textAlign = 'center';

      if (variant % 3 === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.font = '900 56px "Trebuchet MS", sans-serif';
        ctx.fillText('🔴 LIVE: VIP INAUGURATION 🔴', w * 0.5, 105);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
        ctx.fillText('CEREMONIAL PROTOCOL · LEVEL 1 ACTIVE', w * 0.5, 180);
      } else if (variant % 3 === 1) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 56px "Trebuchet MS", sans-serif';
        ctx.fillText('⚡ SPEED LIMIT: UNLIMITED ⚡', w * 0.5, 105);

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
        ctx.fillText('VIP CONVOY PASSING · TRACK CLEAR', w * 0.5, 180);
      } else {
        ctx.fillStyle = '#4ade80';
        ctx.font = '900 56px "Trebuchet MS", sans-serif';
        ctx.fillText('★ NATIONAL CELEBRATION ★', w * 0.5, 105);

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
        ctx.fillText('RED CARPET EXTENDED NATIONWIDE', w * 0.5, 180);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      return tex;
    });
  }

  /**
   * Decorative Marigold Flower Garland Texture
   */
  public static getVipMarigoldGarlandTexture(): THREE.Texture {
    return this.getOrCreate('vip_marigold_garland', () => {
      const size = 128;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Transparent green twine base
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, size * 0.45, size, size * 0.1);

      // Alternating saffron orange and yellow marigold blooms
      const colors = ['#ea580c', '#f59e0b', '#fbbf24', '#d97706'];
      for (let i = 0; i < 4; i++) {
        const cx = 16 + i * 32;
        const cy = size * 0.5;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Satirical Chai Stall Billboard Textures (District A: Chai Pe Charcha Chaos)
   */
  public static getChaiPeCharchaSignTexture(variant: number = 0): THREE.Texture {
    const key = `vip_chai_sign_${variant % 4}_hd`;
    return this.getOrCreate(key, () => {
      const w = 1024;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Warm terracotta / Indian street masala chai storefront palette
      const bgs = ['#7c2d12', '#9a3412', '#451a03', '#831843'];
      ctx.fillStyle = bgs[variant % bgs.length];
      ctx.fillRect(0, 0, w, h);

      // Gold / marigold frame border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 4;
      ctx.strokeRect(22, 22, w - 44, h - 44);

      // Chai cup icon on left
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(100, 130, 42, 0, Math.PI);
      ctx.lineTo(135, 95);
      ctx.lineTo(65, 95);
      ctx.closePath();
      ctx.fill();

      // Saucer
      ctx.fillRect(55, 172, 90, 10);

      // Steam wisps
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(85, 85);
      ctx.bezierCurveTo(75, 60, 95, 50, 85, 35);
      ctx.moveTo(115, 85);
      ctx.bezierCurveTo(105, 60, 125, 50, 115, 35);
      ctx.stroke();

      ctx.textAlign = 'center';
      const headlines = [
        '★ CHAI PE CHARCHA ★',
        '★ 100% PURE MASALA CHAI ★',
        '★ SHRI CHAIWALA JUNCTION ★',
        '★ ROYAL CUTTING CHAI ★'
      ];
      const subheads = [
        'HOT MASALA CHAI · FRESH BREW',
        'BREWED FRESH FOR THE NATION',
        'SPECIAL STEAMING KULHAD CHAI',
        'AUTHENTIC STREET RECIPE · 100% TEA'
      ];

      ctx.fillStyle = '#fef08a';
      ctx.font = '900 60px "Trebuchet MS", "Outfit", sans-serif';
      ctx.fillText(headlines[variant % 4], w * 0.5 + 40, 110);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
      ctx.fillText(subheads[variant % 4], w * 0.5 + 40, 185);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      return tex;
    });
  }

  /**
   * Satirical Inauguration Infinity Textures (District B: Inauguration Infinity)
   */
  public static getInaugurationInfinitySignTexture(variant: number = 0): THREE.Texture {
    const key = `vip_inauguration_sign_${variant % 4}_hd`;
    return this.getOrCreate(key, () => {
      const w = 1024;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Deep ceremonial sapphire / royal red
      const bgs = ['#1e1b4b', '#831843', '#064e3b', '#1e3a8a'];
      ctx.fillStyle = bgs[variant % bgs.length];
      ctx.fillRect(0, 0, w, h);

      // Gold rosette ceremonial borders
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 4;
      ctx.strokeRect(22, 22, w - 44, h - 44);

      // Flanking shears icon
      [110, w - 110].forEach((cx) => {
        ctx.fillStyle = '#ffd700';
        ctx.font = '76px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✂️', cx, 150);
      });

      const titles = [
        '★ GRAND INAUGURATION ★',
        '★ OFFICIAL SCISSORS CEREMONY ★',
        '★ RED CARPET PASSAGE ★',
        '★ CEREMONIAL OVERPASS ★'
      ];
      const subs = [
        'RIBBON-CUTTING PROTOCOL ACTIVE',
        'GOLDEN SCISSORS READY · PLEASE APPLAUD',
        'RED CARPET DEPLOYED TO INFINITY',
        'CIVIC PRIDE · OFFICIAL CEREMONY'
      ];

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.font = '900 60px "Trebuchet MS", "Outfit", sans-serif';
      ctx.fillText(titles[variant % 4], w * 0.5, 110);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
      ctx.fillText(subs[variant % 4], w * 0.5, 185);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      return tex;
    });
  }

  /**
   * Satirical Breaking News Video Screen Textures (District C: Breaking News Boulevard)
   */
  public static getBreakingNewsScreenTexture(variant: number = 0): THREE.Texture {
    const key = `vip_breaking_news_sign_${variant % 4}_hd`;
    return this.getOrCreate(key, () => {
      const w = 1024;
      const h = 512;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // TV Studio electric blue & emergency red
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, w, h);

      // Top Red "BREAKING NEWS" banner
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, w, 88);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 52px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔴 BREAKING NEWS · 24/7 LIVE 🔴', w * 0.5, 64);

      // Center debate panel grid: 4 colorful cartoon commentator boxes
      const colors = ['#1e3a8a', '#991b1b', '#065f46', '#854d0e'];
      const names = ['ANCHOR DRAMA', 'PANEL 1 (LOUD)', 'PANEL 2 (LOUDER)', 'SPECIAL EXPERT'];
      for (let i = 0; i < 4; i++) {
        const bx = 32 + (i % 2) * 484;
        const by = 108 + Math.floor(i / 2) * 128;
        ctx.fillStyle = colors[i];
        ctx.fillRect(bx, by, 476, 116);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, by, 476, 116);

        // Cartoon face dot
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(bx + 48, by + 58, 28, 0, Math.PI * 2);
        ctx.fill();

        // Mic icon
        ctx.fillStyle = '#ffffff';
        ctx.font = '32px sans-serif';
        ctx.fillText('🎙️', bx + 48, by + 68);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 28px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(names[i], bx + 96, by + 52);
        ctx.fillStyle = '#93c5fd';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('STATUS: LIVE BROADCAST', bx + 96, by + 88);
      }

      // Bottom Scrolling ticker banner
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(0, 380, w, 132);
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';

      const tickers = [
        'EXCLUSIVE: TRAIN ON TIME — NATION SHOCKED',
        'SPECIAL REPORT: 12 EXPERTS EXPLAIN THE MANGO',
        'PRIME TIME: 8 ANCHORS SHOUT SIMULTANEOUSLY',
        'ALERT: CEREMONY ANNOUNCED FOR INAUGURATION'
      ];

      ctx.font = '900 38px "Trebuchet MS", sans-serif';
      ctx.fillText(tickers[variant % 4], w * 0.5, 436);
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('LIVE RATINGS: MAXIMUM · COVERAGE: 100% NATIONWIDE', w * 0.5, 482);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      return tex;
    });
  }

  /**
   * Satirical Masterstroke Megacity Textures (District D: Masterstroke Megacity)
   */
  public static getMasterstrokeMegacitySignTexture(variant: number = 0): THREE.Texture {
    const key = `vip_masterstroke_sign_${variant % 4}_hd`;
    return this.getOrCreate(key, () => {
      const w = 1024;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // High-tech gold & cyber black
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // Gold circuitry lines
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(24, 24, w - 48, h - 48);

      const headlines = [
        '⚡ MASTERSTROKE: 99% ⚡',
        '⚡ OFFICIAL CIVIC DECLARATION ⚡',
        '⚡ VIP MOTORCADE EXPRESS ⚡',
        '⚡ SMART TRANSIT INITIATIVE ⚡'
      ];
      const subs = [
        'MAXIMUM SPEED · MAXIMUM GLORY',
        'HISTORIC CIVIC TRANSFORMATION UNDERWAY',
        'GREEN CORRIDOR PROTOCOL ACTIVE',
        'FUTURE-READY INFRASTRUCTURE'
      ];

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 60px "Trebuchet MS", "Outfit", sans-serif';
      ctx.fillText(headlines[variant % 4], w * 0.5, 110);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
      ctx.fillText(subs[variant % 4], w * 0.5, 185);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      return tex;
    });
  }

  /**
   * Satirical Parliament & Opposition Mayhem Textures (District E: Parliament Mayhem)
   */
  public static getParliamentMayhemSignTexture(variant: number = 0): THREE.Texture {
    const key = `vip_parliament_sign_${variant % 4}_hd`;
    return this.getOrCreate(key, () => {
      const w = 1024;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Regal Westminster green & mahogany
      const bgs = ['#064e3b', '#1e3a8a', '#450a0a', '#172554'];
      ctx.fillStyle = bgs[variant % bgs.length];
      ctx.fillRect(0, 0, w, h);

      // Brass colonnade trim
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(24, 24, w - 48, h - 48);

      // Flanking gavel icons
      [110, w - 110].forEach((cx) => {
        ctx.fillStyle = '#fbbf24';
        ctx.font = '76px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚖️', cx, 150);
      });

      const headers = [
        '🏛️ PARLIAMENT IN SESSION 🏛️',
        '🏛️ POINT OF ORDER! 🏛️',
        '🏛️ NATIONAL DEBATE SUMMIT 🏛️',
        '🏛️ OFFICIAL PROCEEDINGS 🏛️'
      ];
      const subs = [
        'SPEAKER GAVEL: ORDER IN THE HOUSE!',
        'ALL MEMBERS PLEASE REMAIN SEATED',
        'DEMOCRACY IN ACTION · 100% DEBATE',
        'SESSION EXTENDED FOR TEA BREAK'
      ];

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fef08a';
      ctx.font = '900 58px "Trebuchet MS", "Outfit", sans-serif';
      ctx.fillText(headers[variant % 4], w * 0.5, 110);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
      ctx.fillText(subs[variant % 4], w * 0.5, 185);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      return tex;
    });
  }

  /**
   * Trailing News Helicopter Banner Texture
   */
  public static getVipHelicopterBannerTexture(): THREE.Texture {
    return this.getOrCreate('vip_helicopter_banner_hd', () => {
      const w = 1024;
      const h = 128;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, w - 16, h - 16);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔴 BREAKING NEWS: CHOPPER ONE OVERHEAD 🔴', w * 0.5, 82);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      return tex;
    });
  }

  // =========================================================================
  // RAHULVERSE: THE NEVER-ENDING YATRA (Political Satire Textures)
  // =========================================================================

  /**
   * District A: Yatra Never Ends Sign & Milestone Textures
   */
  public static getYatraNeverEndsSignTexture(variant: number = 0): THREE.Texture {
    const key = `rahul_yatra_never_ends_${variant % 4}`;
    return this.getOrCreate(key, () => {
      const w = 1024;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Vibrant tricolor open-road backdrop
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.5, '#0369a1');
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Gold/white roadside border
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Header ribbon
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(20, 20, w - 40, 58);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏃 BHARAT JODO EXPEDITION 🏃', w * 0.5, 62);

      // Main joke message - punchy, visible from 25+ meters
      const jokes = [
        ['DESTINATION: 2 KM AHEAD', '+4,000 KM DETOUR EXTENSION ADDED!', '★ STEP COUNT: 12,450,000 ★'],
        ['YATRA STAGE COMPLETE!', 'NEW CONTINENTAL STAGE BEGINS NOW', '★ PLEASE DRINK CHAI & JOG ON ★'],
        ['SHORTCUT DETECTED:', 'EXTRA 2,500 KM THROUGH SCENIC ALPS', '★ SNEAKERS CERTIFIED DURABLE ★'],
        ['ENDLESS MARCH REGIME:', 'SPEED: 25 KM/H • VIBES: 100%', '★ RUNAWAY MIC IN TRANSIT ★']
      ];
      const j = jokes[variant % jokes.length];

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 46px "Trebuchet MS", sans-serif';
      ctx.fillText(j[0], w * 0.5, 134);

      ctx.fillStyle = '#fef08a';
      ctx.font = '900 32px monospace';
      ctx.fillText(j[1], w * 0.5, 180);

      // Footer
      ctx.fillStyle = '#15803d';
      ctx.fillRect(20, 196, w - 40, 42);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(j[2], w * 0.5, 226);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      return tex;
    });
  }

  /**
   * District A: Animated Flip Board (Finish Line -> Start of Next Yatra)
   */
  public static getFinishLineFlipTexture(isStart: boolean = false): THREE.Texture {
    const key = `rahul_finish_flip_${isStart ? 'start' : 'finish'}`;
    return this.getOrCreate(key, () => {
      const w = 1024;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      if (!isStart) {
        // FINISH LINE
        ctx.fillStyle = '#15803d'; // Green celebration
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 10;
        ctx.strokeRect(10, 10, w - 20, h - 20);

        // Checkered header stripes
        ctx.fillStyle = '#000000';
        for (let x = 20; x < w - 20; x += 40) {
          ctx.fillRect(x, 20, 20, 30);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 54px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏁 FINISH LINE: 0 KM REMAINING! 🏁', w * 0.5, 120);

        ctx.fillStyle = '#fef08a';
        ctx.font = '900 36px monospace';
        ctx.fillText('STAND BY FOR MECHANICAL FLIP ROTATION...', w * 0.5, 185);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('★ ROTATING IN 3... 2... 1... ★', w * 0.5, 230);
      } else {
        // START OF NEXT YATRA
        ctx.fillStyle = '#c2410c'; // Vibrant orange
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 10;
        ctx.strokeRect(10, 10, w - 20, h - 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 52px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚩 NEXT YATRA UNLOCKED: +4,000 KM 🚩', w * 0.5, 120);

        ctx.fillStyle = '#fef08a';
        ctx.font = '900 36px monospace';
        ctx.fillText('NO BRAKES ON THE CAMPAIGN EXPRESS!', w * 0.5, 185);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('★ GRAB CHAI & CONTINUE JOGGING ★', w * 0.5, 230);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      return tex;
    });
  }

  /**
   * District A: Absurd Continental Yatra Route Map
   */
  public static getYatraMapTexture(): THREE.Texture {
    return this.getOrCreate('rahul_yatra_route_map', () => {
      const w = 1024;
      const h = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Parchment navigation grid background
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      for (let x = 0; x < w; x += 128) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 128) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Ornate wooden border
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 16;
      ctx.strokeRect(16, 16, w - 32, h - 32);

      // Title Banner
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(40, 40, w - 80, 80);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏃 CONTINENTAL YATRA EXPEDITION MAP 🏃', w * 0.5, 96);

      // Crazy winding route path (Tricolor ribbon)
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#f97316';
      ctx.setLineDash([24, 12]);
      ctx.beginPath();
      ctx.moveTo(160, 880);
      ctx.bezierCurveTo(240, 640, 760, 800, 480, 480);
      ctx.bezierCurveTo(280, 240, 720, 360, 840, 160);
      ctx.stroke();
      ctx.setLineDash([]);

      // Waypoints
      const waypoints = [
        { x: 160, y: 880, label: 'START: SOUTH COAST', sub: '0 KM • FRESH SNEAKERS' },
        { x: 600, y: 680, label: 'PIT STOP: CHAI BREAK #542', sub: '1,500 KM • BISCUITS INCLUDED' },
        { x: 480, y: 480, label: 'STRATEGY HQ DETOUR', sub: '3,000 KM • WHITEBOARD SESSIONS' },
        { x: 840, y: 160, label: 'NEW START LINE: BEYOND HORIZON', sub: 'INFINITE EXPEDITION CONTINUES' }
      ];
      waypoints.forEach((pt) => {
        // Pin shadow & circle
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Pin center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Waypoint card
        ctx.fillStyle = '#0f172a';
        ctx.font = '900 24px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pt.label, pt.x, pt.y - 32);

        ctx.fillStyle = '#b45309';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(pt.sub, pt.x, pt.y - 10);
      });

      // Big Stamp
      ctx.save();
      ctx.translate(w * 0.5, 960);
      ctx.rotate(-0.04);
      ctx.fillStyle = '#dc2626';
      ctx.font = '900 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('★ OFFICIAL STATUS: NEVER STOP JOGGING ★', 0, 0);
      ctx.restore();

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      return tex;
    });
  }

  /**
   * District B: Giant Strategy Room Whiteboard Flowchart
   */
  public static getStrategyWhiteboardTexture(): THREE.Texture {
    return this.getOrCreate('rahul_strategy_whiteboard', () => {
      const w = 1024;
      const h = 512;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Glossy whiteboard porcelain background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);

      // Subtle dry-erase ghost grid
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Brushed Aluminum Whiteboard Frame
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, w - 14, h - 14);

      // Dry-erase marker tray indicator at bottom
      ctx.fillStyle = '#64748b';
      ctx.fillRect(100, h - 12, w - 200, 8);

      // Whiteboard Title in bold blue dry-erase
      ctx.fillStyle = '#1e3a8a';
      ctx.font = '900 34px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('📋 MASTER STRATEGY 2026: "OPERATION RELAUNCH 5.0"', 40, 52);

      // 4-Step Master Flowchart Boxes
      const steps = [
        { num: 'STEP 1', title: 'YATRA 4,000 KM', sub: 'Walk nonstop 👟', bg: '#dcfce7', border: '#16a34a' },
        { num: 'STEP 2', title: 'PRESS BRIEFING', sub: '20 Mics active 🎙️', bg: '#dbeafe', border: '#2563eb' },
        { num: 'STEP 3', title: 'CONFUSION?', sub: 'Strategy debate ❓', bg: '#fef3c7', border: '#d97706' },
        { num: 'STEP 4', title: 'VICTORY CHAI', sub: 'Repeat Step 1 ☕', bg: '#fee2e2', border: '#dc2626' }
      ];

      const boxW = 200;
      const boxH = 130;
      const startX = 40;
      const boxY = 100;
      const gapX = 50;

      for (let i = 0; i < steps.length; i++) {
        const s = steps[i];
        const bx = startX + i * (boxW + gapX);

        // Box shadow & background
        ctx.fillStyle = s.bg;
        ctx.fillRect(bx, boxY, boxW, boxH);
        ctx.strokeStyle = s.border;
        ctx.lineWidth = 4;
        ctx.strokeRect(bx, boxY, boxW, boxH);

        // Content
        ctx.fillStyle = s.border;
        ctx.font = '900 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(s.num, bx + boxW * 0.5, boxY + 28);

        ctx.fillStyle = '#0f172a';
        ctx.font = '900 20px "Trebuchet MS", sans-serif';
        ctx.fillText(s.title, bx + boxW * 0.5, boxY + 65);

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(s.sub, bx + boxW * 0.5, boxY + 100);

        // Connecting Arrows
        if (i < steps.length - 1) {
          const ax = bx + boxW + 8;
          const ay = boxY + boxH * 0.5;
          ctx.strokeStyle = '#0284c7';
          ctx.fillStyle = '#0284c7';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(ax + 32, ay);
          ctx.stroke();
          // Arrowhead
          ctx.beginPath();
          ctx.moveTo(ax + 32, ay);
          ctx.lineTo(ax + 22, ay - 8);
          ctx.lineTo(ax + 22, ay + 8);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Red dry-erase circle around Step 4
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(startX + 3 * (boxW + gapX) + boxW * 0.5, boxY + boxH * 0.5, boxW * 0.6, boxH * 0.65, -0.05, 0, Math.PI * 2);
      ctx.stroke();

      // Hand-written marker annotations
      ctx.fillStyle = '#dc2626';
      ctx.font = '900 22px "Trebuchet MS", cursive, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('👈 "THIS IS OUR WINNING FORMULA!"', startX + 3 * (boxW + gapX) - 40, boxY + boxH + 40);

      // Yellow Sticky Note (Bottom-Left)
      const sn1X = 50;
      const sn1Y = 280;
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(sn1X, sn1Y, 260, 150);
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      ctx.strokeRect(sn1X, sn1Y, 260, 150);
      ctx.fillStyle = '#713f12';
      ctx.font = '900 18px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('📌 THINK-TANK MEMO:', sn1X + 15, sn1Y + 30);
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('• Push big red reset button', sn1X + 15, sn1Y + 60);
      ctx.fillText('• Keep runaway mic in check', sn1X + 15, sn1Y + 88);
      ctx.fillText('• Order 50 more samosas', sn1X + 15, sn1Y + 116);

      // Pink Sticky Note (Center-Right)
      const sn2X = 350;
      const sn2Y = 280;
      ctx.fillStyle = '#fce7f3';
      ctx.fillRect(sn2X, sn2Y, 260, 150);
      ctx.strokeStyle = '#db2777';
      ctx.lineWidth = 2;
      ctx.strokeRect(sn2X, sn2Y, 260, 150);
      ctx.fillStyle = '#831843';
      ctx.font = '900 18px sans-serif';
      ctx.fillText('🎯 STRATEGY WHEEL TIERS:', sn2X + 15, sn2Y + 30);
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('Tier 1: Youth Rally', sn2X + 15, sn2Y + 60);
      ctx.fillText('Tier 2: Podcast Interview', sn2X + 15, sn2Y + 88);
      ctx.fillText('Tier 3: Infinite Detour', sn2X + 15, sn2Y + 116);

      // Big Red Reset Button Reminder Box
      const sn3X = 650;
      const sn3Y = 280;
      ctx.fillStyle = '#fee2e2';
      ctx.fillRect(sn3X, sn3Y, 320, 150);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 3;
      ctx.strokeRect(sn3X, sn3Y, 320, 150);
      ctx.fillStyle = '#991b1b';
      ctx.font = '900 20px "Trebuchet MS", sans-serif';
      ctx.fillText('🚨 RELAUNCH PROTOCOL 🚨', sn3X + 20, sn3Y + 35);
      ctx.font = 'bold 16px monospace';
      ctx.fillText('IF IN DOUBT: PRESS RED BUTTON', sn3X + 20, sn3Y + 70);
      ctx.fillText('AUTOMATIC FRESH COAT OF PAINT', sn3X + 20, sn3Y + 98);
      ctx.fillText('GUARANTEED 100% SATIRE IMPACT', sn3X + 20, sn3Y + 126);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      return tex;
    });
  }

  /**
   * District B: Parliament Pandemonium Sign Textures
   */
  public static getParliamentPandemoniumSignTexture(variant: number = 0): THREE.Texture {
    const key = `rahul_parliament_pandemonium_${variant % 4}`;
    return this.getOrCreate(key, () => {
      const w = 1024;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, w - 16, h - 16);

      // Header
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(18, 18, w - 36, 56);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏛️ STRATEGY HQ & WAR ROOM 🏛️', w * 0.5, 58);

      const jokes = [
        ['OPERATION: RELAUNCH 5.0 ACTIVE', 'SPINNING STRATEGY WHEEL ENGAGED', '★ RUNAWAY MIC IN PLAY ★'],
        ['DEBATE QUESTION HOUR:', 'ANSWERS DISTRIBUTED NEXT YEAR', '★ UNANIMOUS DISAGREEMENT ★'],
        ['WAR ROOM WHITEBOARD READY:', 'FLOWCHART CONTAINS INFINITE LOOPS', '★ HIGH ADRENALINE SLAPSTICK ★'],
        ['MICROPHONE ESCAPE VELOCITY:', 'SPEAKER LUNGES ACROSS AISLE', '★ 100% MAXIMUM VOLUME ★']
      ];
      const j = jokes[variant % jokes.length];

      ctx.fillStyle = '#f8fafc';
      ctx.font = '900 46px "Trebuchet MS", sans-serif';
      ctx.fillText(j[0], w * 0.5, 134);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 32px monospace';
      ctx.fillText(j[1], w * 0.5, 180);

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(j[2], w * 0.5, 226);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      return tex;
    });
  }

  /**
   * District C: Press Conference Panic Video Screen Textures
   */
  public static getPressConferencePanicSignTexture(variant: number = 0): THREE.Texture {
    const key = `rahul_press_conference_${variant % 4}`;
    return this.getOrCreate(key, () => {
      const w = 1024;
      const h = 512;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Deep studio control-room backdrop
      ctx.fillStyle = '#082f49';
      ctx.fillRect(0, 0, w, h);

      // Breaking news banner
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, w, 76);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 42px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ 24/7 LIVE MEDIA PANIC • 20 MICS ACTIVE ⚡', w * 0.5, 54);

      // 4 Pundit / Reporter TV feed tiles
      const colors = ['#0369a1', '#991b1b', '#047857', '#854d0e'];
      const headers = ['CH 1: PODIUM MIC 1', 'CH 2: BOOM OPERATOR', 'CH 3: TV BROADCAST TRUCK', 'CH 4: PAPARAZZI CONGA'];
      const sub = ['"QUESTION ON THE YATRA!"', '"FOLLOW-UP TO QUESTION 1!"', '"TRANSMITTING LIVE FEED"', '"PHOTOGRAPHING PODIUM!"'];
      for (let i = 0; i < 4; i++) {
        const bx = 32 + (i % 2) * 480;
        const by = 96 + Math.floor(i / 2) * 128;
        ctx.fillStyle = colors[i];
        ctx.fillRect(bx, by, 460, 115);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.strokeRect(bx, by, 460, 115);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(headers[i], bx + 24, by + 46);
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(sub[i], bx + 24, by + 86);
      }

      // Scrolling Ticker at bottom
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 370, w, 142);
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      const tickers = [
        'EXCLUSIVE: 20 REPORTERS COMPETE FOR SAME PODIUM MICROPHONE',
        'BREAKING: SATELLITE DISH SPINS AT RECORD 120 RPM TO CATCH AUDIO',
        'SPECIAL REPORT: 4-HOUR DEBATE ON WHETHER TO ORDER EXTRA SAMOSAS',
        'PRESS CONFERENCE CONFIRMED ABOUT SCHEDULING NEXT BRIEFING'
      ];
      ctx.font = '900 30px "Trebuchet MS", sans-serif';
      ctx.fillText(tickers[variant % tickers.length], w * 0.5, 432);
      ctx.font = 'bold 22px monospace';
      ctx.fillText('LIVE RATING: 100% MAXIMUM VOLUME • ZERO REAL DISPUTES', w * 0.5, 478);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      return tex;
    });
  }

  /**
   * District D: Alliance Rollercoaster Billboard Textures
   */
  public static getAllianceRollercoasterSignTexture(variant: number = 0): THREE.Texture {
    const key = `rahul_alliance_rollercoaster_${variant % 4}`;
    return this.getOrCreate(key, () => {
      const w = 1024;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Carnival amusement park palette
      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, w - 16, h - 16);

      // Header
      ctx.fillStyle = '#db2777';
      ctx.fillRect(18, 18, w - 36, 56);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎢 ALLIANCE ROLLERCOASTER PARK 🎢', w * 0.5, 58);

      const jokes = [
        ['ALLIANCE STATUS:', "IT'S EXTREMELY COMPLICATED", '★ SEAT SHARING: EXPERT PUZZLE MODE ★'],
        ['POLITICAL MUSICAL CHAIRS:', 'WHO SITS IN THE MIDDLE?', '★ ROTATING CHAIRS DEPLOYED ★'],
        ['COALITION MEETING:', 'SCHEDULED TO PLAN NEXT MEETING', '★ EVERYONE AGREES TO DISAGREE ★'],
        ['HANDSHAKE MONUMENT:', 'SMILE FOR CAMERA // NOW DEBATE', '★ ALLIANCE LOOP COMPLETE ★']
      ];
      const j = jokes[variant % jokes.length];

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 46px "Trebuchet MS", sans-serif';
      ctx.fillText(j[0], w * 0.5, 134);

      ctx.fillStyle = '#f472b6';
      ctx.font = '900 32px monospace';
      ctx.fillText(j[1], w * 0.5, 180);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(j[2], w * 0.5, 226);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      return tex;
    });
  }

  /**
   * District E: The Great Political Multiverse Cosmic Textures
   */
  public static getPoliticalMultiverseSignTexture(variant: number = 0): THREE.Texture {
    const key = `rahul_political_multiverse_${variant % 4}`;
    return this.getOrCreate(key, () => {
      const w = 1024;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Cosmic dark purple nebula
      ctx.fillStyle = '#090514';
      ctx.fillRect(0, 0, w, h);

      // Starfield dots
      ctx.fillStyle = '#ffffff';
      for (let s = 0; s < 60; s++) {
        const sx = (s * 47) % w;
        const sy = (s * 31) % h;
        ctx.fillRect(sx, sy, (s % 3) + 2, (s % 3) + 2);
      }

      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 8;
      ctx.strokeRect(8, 8, w - 16, h - 16);

      // Hologram glowing cyan header
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(18, 18, w - 36, 56);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '900 36px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌌 POLITICAL MULTIVERSE 🌌', w * 0.5, 58);

      const jokes = [
        ['MULTIVERSE DIMENSION #404:', 'EVERY DEBATE ENDS ON TIME!', '★ WARNING: UNSTABLE FICTION ★'],
        ['DIMENSIONAL PORTAL:', 'NEW RAILWAY UNLOCKED AHEAD', '★ JOURNEY IS MATHEMATICALLY INFINITE ★'],
        ['QUANTUM ALLIANCE:', 'MODI & RAHUL TAKE SELFIE SIMULTANEOUSLY', '★ DOUBLE TROPHY ACHIEVED ★'],
        ['COSMIC STATUS:', 'MISSION COMPLETE? NOT SO FAST!', '★ THE YATRA TRANSCENDS TIME ★']
      ];
      const j = jokes[variant % jokes.length];

      ctx.fillStyle = '#f8fafc';
      ctx.font = '900 44px "Trebuchet MS", sans-serif';
      ctx.fillText(j[0], w * 0.5, 134);

      ctx.fillStyle = '#c084fc';
      ctx.font = '900 32px monospace';
      ctx.fillText(j[1], w * 0.5, 180);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(j[2], w * 0.5, 226);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
      return tex;
    });
  }

  // =========================================================================
  // MIDNIGHT VELVET: AFTER DARK PREMIUM WORLD TEXTURES
  // =========================================================================

  /**
   * District A: Velvet Boulevard Luxury Nightclub & Hotel Signs
   */
  public static getVelvetBoulevardSignTexture(variant: number = 0): THREE.Texture {
    const key = `midnight_velvet_boulevard_${variant % 4}`;
    return this.getOrCreate(key, () => {
      const w = 512;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Deep obsidian-burgundy velvet lacquer
      ctx.fillStyle = '#0a0812';
      ctx.fillRect(0, 0, w, h);

      // Art Deco double gold border
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(16, 16, w - 32, h - 32);

      // Gold corner triangles (Art Deco motif)
      ctx.fillStyle = '#d4af37';
      [[16, 16], [w - 16, 16], [16, h - 16], [w - 16, h - 16]].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Header Banner
      ctx.fillStyle = '#1c0f24';
      ctx.fillRect(20, 20, w - 40, 50);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(20, 20, w - 40, 50);

      const signs = [
        ['⚜️ LE VELOURS ⚜️', 'EXCLUSIVE AFTER-DARK CLUB', '★ VIP RESERVATIONS ONLY ★'],
        ['✦ HOTEL ROYALE ✦', 'PREMIER LUXURY PENTHOUSES', '★ CONCIERGE & VALET 24/7 ★'],
        ['★ CLUB PRIVÉ ★', 'CHAMPAGNE SALON & SOCIETY', '★ PRIVATE ACCESS CARD REQUIRED ★'],
        ['💎 MAISON VENDÔME 💎', 'HAUTE JOAILLERIE & DIAMONDS', '★ TIMELESS ART DECO MASTERY ★']
      ];
      const s = signs[variant % signs.length];

      ctx.fillStyle = '#fef08a';
      ctx.font = '900 24px "Cinzel", "Georgia", serif';
      ctx.textAlign = 'center';
      ctx.fillText(s[0], w * 0.5, 54);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Cinzel", "Trebuchet MS", sans-serif';
      ctx.fillText(s[1], w * 0.5, 126);

      ctx.fillStyle = '#d4af37';
      ctx.font = '14px monospace';
      ctx.fillText(s[2], w * 0.5, 185);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * District B: Moonlight Marina Yacht Club & Waterfront Signage
   */
  public static getMoonlightMarinaSignTexture(variant: number = 0): THREE.Texture {
    const key = `midnight_velvet_marina_${variant % 4}`;
    return this.getOrCreate(key, () => {
      const w = 512;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Deep ocean navy
      ctx.fillStyle = '#06101e';
      ctx.fillRect(0, 0, w, h);

      // Brushed brass & silver border
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 5;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(14, 14, w - 28, h - 28);

      const signs = [
        ['⚓ MOONLIGHT MARINA ⚓', 'YACHT CLUB & PRIVATE BASIN', '★ BERTHS 1 THROUGH 48 ★'],
        ['🥂 PIER 24 CHAMPAGNE 🥂', 'WATERFRONT PROMENADE & BARS', '★ OCEAN SKYLINE TERRACES ★'],
        ['⛵ L\'AZUR REGATTA ⛵', 'MIDNIGHT LUXURY CRUISES', '★ FIRST CLASS HARBOR PASSAGE ★'],
        ['✦ VILLA BELLERIVE ✦', 'EXCLUSIVE WATERFRONT ESTATES', '★ PRIVATE BOAT SLIPS ★']
      ];
      const s = signs[variant % signs.length];

      ctx.fillStyle = '#0c1a2e';
      ctx.fillRect(20, 20, w - 40, 50);

      ctx.fillStyle = '#7dd3fc';
      ctx.font = '900 22px "Cinzel", "Georgia", serif';
      ctx.textAlign = 'center';
      ctx.fillText(s[0], w * 0.5, 54);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Cinzel", sans-serif';
      ctx.fillText(s[1], w * 0.5, 126);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '14px monospace';
      ctx.fillText(s[2], w * 0.5, 185);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * District C: The Golden Hour Club Rooftop Lounge Signage
   */
  public static getGoldenHourClubSignTexture(variant: number = 0): THREE.Texture {
    const key = `midnight_velvet_golden_hour_${variant % 4}`;
    return this.getOrCreate(key, () => {
      const w = 512;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Rich midnight burgundy
      ctx.fillStyle = '#180410';
      ctx.fillRect(0, 0, w, h);

      // Gold sunburst pattern
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 5;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.strokeStyle = '#ec4899'; // Subtle electric pink accent
      ctx.lineWidth = 2;
      ctx.strokeRect(14, 14, w - 28, h - 28);

      const signs = [
        ['✨ THE GOLDEN HOUR ✨', 'ROOFTOP AFTER-DARK SOCIETY', '★ SKYLINE DANCE TERRACE ★'],
        ['🍸 VELOURS SALON 🍸', 'VINTAGE CHAMPAGNE & JAZZ', '★ SOPHISTICATED NIGHTLIFE ★'],
        ['★ PENTHOUSE CLUB 40 ★', 'PANORAMIC METROPOLIS VIEWS', '★ STRICT EVENING ATTIRE ★'],
        ['⚡ AFTER HOURS ⚡', 'MUSIC UNTIL THE SUN RISES', '★ SOUNDTRACK OF THE METROPOLIS ★']
      ];
      const s = signs[variant % signs.length];

      ctx.fillStyle = '#2d061e';
      ctx.fillRect(20, 20, w - 40, 50);

      ctx.fillStyle = '#f472b6';
      ctx.font = '900 24px "Cinzel", "Georgia", serif';
      ctx.textAlign = 'center';
      ctx.fillText(s[0], w * 0.5, 54);

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 20px "Cinzel", sans-serif';
      ctx.fillText(s[1], w * 0.5, 126);

      ctx.fillStyle = '#ec4899';
      ctx.font = '14px monospace';
      ctx.fillText(s[2], w * 0.5, 185);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * District D: Midnight Grand Monumental Concourse & Clock Signs
   */
  public static getMidnightGrandSignTexture(variant: number = 0): THREE.Texture {
    const key = `midnight_velvet_grand_${variant % 4}`;
    return this.getOrCreate(key, () => {
      const w = 512;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Polished dark marble
      ctx.fillStyle = '#0c0c12';
      ctx.fillRect(0, 0, w, h);

      // Fluted brass frame
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(16, 16, w - 32, h - 32);

      const signs = [
        ['🏛️ MIDNIGHT GRAND TERMINAL 🏛️', 'TRACKS 1 TO 16 · CONCOURSE LUXE', '★ ALL LUXURY TRAINS ON TIME ★'],
        ['🕰️ THE ORIENT OVERNIGHT 🕰️', 'FIRST CLASS SLEEPER SALOONS', '★ LUXURY INTERCITY SERVICE ★'],
        ['✦ CLOCK TOWER PAVILION ✦', 'CENTRAL TRANSIT MEZZANINE', '★ RENDEZVOUS AT THE CLOCK ★'],
        ['⚜️ PULLMAN PARLOUR CARS ⚜️', 'CONTINENTAL LUXURY TRANSIT', '★ CHAMPAGNE SALOON SERVICE ★']
      ];
      const s = signs[variant % signs.length];

      ctx.fillStyle = '#161622';
      ctx.fillRect(20, 20, w - 40, 50);

      ctx.fillStyle = '#fef08a';
      ctx.font = '900 22px "Cinzel", "Georgia", serif';
      ctx.textAlign = 'center';
      ctx.fillText(s[0], w * 0.5, 54);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Cinzel", sans-serif';
      ctx.fillText(s[1], w * 0.5, 126);

      ctx.fillStyle = '#d4af37';
      ctx.font = '14px monospace';
      ctx.fillText(s[2], w * 0.5, 185);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Gorgeous cratered full moon texture for Moonlight Marina
   */
  public static getMoonTexture(): THREE.Texture {
    return this.getOrCreate('midnight_velvet_giant_moon', () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Transparent bg
      ctx.clearRect(0, 0, size, size);

      const center = size * 0.5;
      const radius = size * 0.42;

      // Outer radial glow
      const glowGrad = ctx.createRadialGradient(center, center, radius * 0.7, center, center, size * 0.5);
      glowGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      glowGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.15)');
      glowGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, size, size);

      // Moon body
      const moonGrad = ctx.createRadialGradient(center - radius * 0.25, center - radius * 0.25, radius * 0.1, center, center, radius);
      moonGrad.addColorStop(0, '#ffffff');
      moonGrad.addColorStop(0.4, '#fef9c3');
      moonGrad.addColorStop(0.8, '#fde047');
      moonGrad.addColorStop(1, '#eab308');

      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = moonGrad;
      ctx.fill();

      // Soft crater mares
      ctx.fillStyle = 'rgba(161, 98, 7, 0.18)';
      const craters = [
        [center - 50, center - 40, 55],
        [center + 45, center - 20, 65],
        [center - 20, center + 55, 75],
        [center + 60, center + 40, 45],
        [center - 70, center + 10, 35]
      ];
      craters.forEach(([cx, cy, r]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      });

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    });
  }

  /**
   * Art Deco Gilded Fretwork / Chevron Lattice Texture
   */
  public static getArtDecoFretworkTexture(): THREE.Texture {
    return this.getOrCreate('midnight_velvet_deco_fretwork', () => {
      const w = 256;
      const h = 256;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Dark lacquer
      ctx.fillStyle = '#0d0d14';
      ctx.fillRect(0, 0, w, h);

      // Gilded geometric chevrons & diamond fans
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;

      for (let y = 0; y < h; y += 64) {
        for (let x = 0; x < w; x += 64) {
          // Diamond
          ctx.beginPath();
          ctx.moveTo(x + 32, y);
          ctx.lineTo(x + 64, y + 32);
          ctx.lineTo(x + 32, y + 64);
          ctx.lineTo(x, y + 32);
          ctx.closePath();
          ctx.stroke();

          // Inner rays
          ctx.beginPath();
          ctx.moveTo(x + 32, y + 32);
          ctx.lineTo(x + 32, y);
          ctx.moveTo(x + 32, y + 32);
          ctx.lineTo(x + 64, y + 32);
          ctx.moveTo(x + 32, y + 32);
          ctx.lineTo(x + 32, y + 64);
          ctx.moveTo(x + 32, y + 32);
          ctx.lineTo(x, y + 32);
          ctx.stroke();
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
  }

  /**
   * Indian Sandstone Paving Texture (Warm Dholpur sandstone slabs with chisel grain)
   */
  public static getIndianSandstoneTexture(): THREE.Texture {
    return this.getOrCreate('terrain_indian_sandstone', () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Warm sandstone base
      ctx.fillStyle = '#b88a58';
      ctx.fillRect(0, 0, size, size);

      // Large flagstone blocks
      const slabW = 128;
      const slabH = 64;
      const colors = ['#be925f', '#b08250', '#c89d6c', '#a87a46', '#c49662'];

      for (let y = 0; y < size; y += slabH) {
        const row = Math.floor(y / slabH);
        const xOffset = (row % 2) * (slabW / 2);
        for (let x = -slabW; x < size + slabW; x += slabW) {
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.fillRect(x + xOffset + 2, y + 2, slabW - 4, slabH - 4);

          // Subtle chisel grain noise inside block
          for (let p = 0; p < 25; p++) {
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
            ctx.fillRect(x + xOffset + 4 + Math.random() * (slabW - 8), y + 4 + Math.random() * (slabH - 8), 2, 2);
          }

          // Mortar joint border
          ctx.strokeStyle = '#85633e';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + xOffset + 1, y + 1, slabW - 2, slabH - 2);
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8, 16);
      return tex;
    });
  }

  /**
   * Luxury Dark Nero Marquina Granite Texture
   */
  public static getDarkGraniteTexture(): THREE.Texture {
    return this.getOrCreate('terrain_dark_granite', () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Deep polished obsidian/charcoal base
      ctx.fillStyle = '#141820';
      ctx.fillRect(0, 0, size, size);

      // Fine crystalline marble veining
      ctx.strokeStyle = 'rgba(235, 240, 255, 0.22)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        let vx = Math.random() * size;
        let vy = 0;
        ctx.moveTo(vx, vy);
        while (vy < size) {
          vx += (Math.random() - 0.5) * 45;
          vy += 20 + Math.random() * 35;
          ctx.lineTo(vx, vy);
        }
        ctx.stroke();
      }

      // Subtle gold mineral flecks
      ctx.fillStyle = 'rgba(212, 175, 55, 0.35)';
      for (let i = 0; i < 150; i++) {
        ctx.fillRect(Math.random() * size, Math.random() * size, 1.5, 1.5);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 16);
      return tex;
    });
  }

  /**
   * Clockwork Foundation Plate Texture (Riveted antique brass & iron decking)
   */
  public static getClockworkFloorTexture(): THREE.Texture {
    return this.getOrCreate('terrain_clockwork_floor', () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Dark antique bronze base
      ctx.fillStyle = '#32281c';
      ctx.fillRect(0, 0, size, size);

      // Modular metal plate grid
      const tileSize = 128;
      for (let y = 0; y < size; y += tileSize) {
        for (let x = 0; x < size; x += tileSize) {
          ctx.fillStyle = (x + y) % (tileSize * 2) === 0 ? '#3d3224' : '#2b2318';
          ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

          // Central recessed gear ring
          ctx.strokeStyle = '#5a4933';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x + tileSize * 0.5, y + tileSize * 0.5, tileSize * 0.28, 0, Math.PI * 2);
          ctx.stroke();

          // Corner brass rivets
          ctx.fillStyle = '#c5a059';
          const rivetR = 3;
          const pad = 10;
          [
            [x + pad, y + pad],
            [x + tileSize - pad, y + pad],
            [x + pad, y + tileSize - pad],
            [x + tileSize - pad, y + tileSize - pad]
          ].forEach(([rx, ry]) => {
            ctx.beginPath();
            ctx.arc(rx, ry, rivetR, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 16);
      return tex;
    });
  }

  /**
   * Scorched Volcanic Basalt & Magma Fissure Texture (Convective Boiling Molten Lava Ocean)
   */
  public static getVolcanicBasaltTexture(): THREE.Texture {
    return this.getOrCreate('terrain_volcanic_basalt_convective_v4', () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // 1. Incandescent Molten Magma Gradient Base
      const lavaGrad = ctx.createLinearGradient(0, 0, size, size);
      lavaGrad.addColorStop(0.0, '#ffffff');  // White-hot incandescent core
      lavaGrad.addColorStop(0.15, '#fef08a'); // Brilliant molten gold
      lavaGrad.addColorStop(0.35, '#f97316'); // Radiant fiery orange
      lavaGrad.addColorStop(0.65, '#ea580c'); // Deep churning lava
      lavaGrad.addColorStop(0.85, '#b91c1c'); // Searing crimson magma
      lavaGrad.addColorStop(1.0, '#5c1111');  // Deep volcanic crust
      ctx.fillStyle = lavaGrad;
      ctx.fillRect(0, 0, size, size);

      // 2. Polygonal Cooling Basalt Crust Plates
      ctx.fillStyle = '#1c1619';
      const plates = [
        [24, 24, 105, 80],
        [155, 18, 125, 90],
        [310, 28, 95, 75],
        [425, 15, 75, 95],
        [30, 135, 125, 105],
        [190, 130, 120, 100],
        [340, 135, 140, 90],
        [18, 275, 95, 100],
        [135, 265, 135, 115],
        [295, 260, 115, 105],
        [430, 255, 70, 120],
        [25, 405, 120, 85],
        [175, 410, 110, 80],
        [310, 395, 115, 95],
        [445, 405, 55, 85]
      ];

      plates.forEach(([px, py, pw, ph], idx) => {
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 14);
        ctx.fill();

        // Basalt crust shading & cooling rims
        ctx.strokeStyle = '#382b30';
        ctx.lineWidth = 3.2;
        ctx.stroke();

        // Stress fractures glowing through cooling crust
        ctx.strokeStyle = idx % 2 === 0 ? '#f97316' : '#ea580c';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(px + pw * 0.22, py + ph * 0.18);
        ctx.lineTo(px + pw * 0.52, py + ph * 0.52);
        ctx.lineTo(px + pw * 0.82, py + ph * 0.82);
        ctx.stroke();
      });

      // 3. Blazing Convective Molten Fissures between plates
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 12;

      const fissures = [
        [[0, 118], [140, 122], [180, 128], [320, 118], [512, 122]],
        [[0, 252], [130, 248], [175, 256], [300, 248], [425, 252], [512, 248]],
        [[0, 392], [150, 398], [285, 388], [430, 398], [512, 388]],
        [[145, 0], [140, 122], [130, 248], [150, 398], [145, 512]],
        [[295, 0], [320, 118], [300, 248], [285, 388], [305, 512]],
        [[425, 0], [420, 118], [425, 252], [430, 398], [435, 512]]
      ];

      fissures.forEach((pts) => {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i][0], pts[i][1]);
        }
        ctx.stroke();
      });

      ctx.shadowBlur = 0;

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 12);
      return tex;
    });
  }

  /**
   * Prehistoric Jungle Loam & Mossy Bedrock Texture
   */
  public static getJungleLoamTexture(): THREE.Texture {
    return this.getOrCreate('terrain_jungle_loam', () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Deep dark primeval earth
      ctx.fillStyle = '#1c2415';
      ctx.fillRect(0, 0, size, size);

      // Mossy green patches
      const mossColors = ['#28381c', '#334724', '#202e17', '#3f562c'];
      for (let i = 0; i < 300; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 8 + Math.random() * 24;
        ctx.fillStyle = mossColors[Math.floor(Math.random() * mossColors.length)];
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ancient embedded river pebbles
      const pebbleColors = ['#4a4538', '#5c5445', '#333027'];
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        ctx.fillStyle = pebbleColors[Math.floor(Math.random() * pebbleColors.length)];
        ctx.beginPath();
        ctx.ellipse(x, y, 2.5 + Math.random() * 3, 2 + Math.random() * 2, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8, 20);
      return tex;
    });
  }

  /**
   * Tropical Beach Sand & Coastal Shell Sediment Texture
   */
  public static getTropicalSandTexture(): THREE.Texture {
    return this.getOrCreate('terrain_tropical_sand', () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      // Sunlit warm golden sand base
      ctx.fillStyle = '#deb887';
      ctx.fillRect(0, 0, size, size);

      // Gentle wind/wave ripples
      ctx.strokeStyle = 'rgba(210, 168, 115, 0.45)';
      ctx.lineWidth = 3;
      for (let y = 0; y < size; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= size; x += 32) {
          ctx.lineTo(x, y + Math.sin(x * 0.05) * 6);
        }
        ctx.stroke();
      }

      // Fine golden mineral speckles
      for (let i = 0; i < 800; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 245, 220, 0.35)' : 'rgba(180, 140, 90, 0.3)';
        ctx.fillRect(Math.random() * size, Math.random() * size, 1.5, 1.5);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8, 20);
      return tex;
    });
  }
}



