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
}
