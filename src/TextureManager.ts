import * as THREE from 'three';
import { SurfaceType } from './types';

export class TextureManager {
  private textureCache: Map<string, THREE.Texture> = new Map();
  private normalMapCache: Map<string, THREE.Texture> = new Map();

  /**
   * Helper to create a canvas context, or null if not available (e.g., in tests)
   */
  private createCanvasContext(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      return { canvas, ctx };
    } catch {
      return null;
    }
  }

  /**
   * Create a simple fallback texture for test environments
   */
  private createFallbackTexture(color: number = 0x808080): THREE.Texture {
    const width = 2;
    const height = 2;
    const size = width * height;
    const data = new Uint8Array(4 * size);

    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;

    for (let i = 0; i < size; i++) {
      const stride = i * 4;
      data[stride] = r;
      data[stride + 1] = g;
      data[stride + 2] = b;
      data[stride + 3] = 255;
    }

    const texture = new THREE.DataTexture(data, width, height);
    texture.needsUpdate = true;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * Generate a procedural texture for a given surface type
   */
  public getTexture(surfaceType: SurfaceType | string): THREE.Texture {
    const cacheKey = `texture_${surfaceType}`;

    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    let texture: THREE.Texture;

    switch (surfaceType) {
      case 'stone':
        texture = this.createStoneTexture();
        break;
      case 'ice':
        texture = this.createIceTexture();
        break;
      case 'grass':
        texture = this.createGrassTexture();
        break;
      case 'spring':
        texture = this.createSpringTexture();
        break;
      case 'falling':
        texture = this.createFallingTexture();
        break;
      case 'elevator':
        texture = this.createElevatorTexture();
        break;
      case 'moving':
        texture = this.createMovingTexture();
        break;
      default:
        texture = this.createDefaultTexture();
        break;
    }

    this.textureCache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generate a normal map for depth and detail
   */
  public getNormalMap(surfaceType: SurfaceType | string): THREE.Texture {
    const cacheKey = `normal_${surfaceType}`;

    if (this.normalMapCache.has(cacheKey)) {
      return this.normalMapCache.get(cacheKey)!;
    }

    let normalMap: THREE.Texture;

    switch (surfaceType) {
      case 'stone':
        normalMap = this.createStoneNormalMap();
        break;
      case 'ice':
        normalMap = this.createIceNormalMap();
        break;
      case 'grass':
        normalMap = this.createGrassNormalMap();
        break;
      case 'spring':
        normalMap = this.createSpringNormalMap();
        break;
      default:
        normalMap = this.createDefaultNormalMap();
        break;
    }

    this.normalMapCache.set(cacheKey, normalMap);
    return normalMap;
  }

  /**
   * Create default concrete/metal texture
   */
  private createDefaultTexture(): THREE.Texture {
    const canvasContext = this.createCanvasContext(512, 512);
    if (!canvasContext) return this.createFallbackTexture(0x4a90e2);

    const { canvas, ctx } = canvasContext;

    // Base color
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(0, 0, 512, 512);

    // Add noise for texture
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const brightness = Math.random() * 40 - 20;
      ctx.fillStyle = `rgba(${brightness + 74}, ${brightness + 144}, ${brightness + 226}, 0.3)`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Add panel lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      const pos = (i * 512) / 4;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(512, pos);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * Create stone texture
   */
  private createStoneTexture(): THREE.Texture {
    const canvasContext = this.createCanvasContext(512, 512);
    if (!canvasContext) return this.createFallbackTexture(0x808080);

    const { canvas, ctx } = canvasContext;

    // Base gray
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    // Add stone-like noise and variation
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const brightness = Math.random() * 60 - 30;
      const size = Math.random() * 3 + 1;
      ctx.fillStyle = `rgba(${128 + brightness}, ${128 + brightness}, ${128 + brightness}, 0.4)`;
      ctx.fillRect(x, y, size, size);
    }

    // Add cracks
    for (let i = 0; i < 15; i++) {
      ctx.strokeStyle = `rgba(60, 60, 60, ${Math.random() * 0.3 + 0.2})`;
      ctx.lineWidth = Math.random() * 2 + 0.5;
      ctx.beginPath();
      const startX = Math.random() * 512;
      const startY = Math.random() * 512;
      ctx.moveTo(startX, startY);

      for (let j = 0; j < 5; j++) {
        ctx.lineTo(
          startX + (Math.random() - 0.5) * 100,
          startY + (Math.random() - 0.5) * 100
        );
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * Create ice texture
   */
  private createIceTexture(): THREE.Texture {
    const canvasContext = this.createCanvasContext(512, 512);
    if (!canvasContext) return this.createFallbackTexture(0xadd8e6);

    const { canvas, ctx } = canvasContext;

    // Base light blue
    ctx.fillStyle = '#add8e6';
    ctx.fillRect(0, 0, 512, 512);

    // Add crystalline patterns
    for (let i = 0; i < 30; i++) {
      const centerX = Math.random() * 512;
      const centerY = Math.random() * 512;
      const radius = Math.random() * 40 + 20;

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      gradient.addColorStop(1, 'rgba(173, 216, 230, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add frost lines
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
      ctx.lineWidth = Math.random() * 1.5 + 0.5;
      ctx.beginPath();
      const startX = Math.random() * 512;
      const startY = Math.random() * 512;
      const angle = Math.random() * Math.PI * 2;
      const length = Math.random() * 60 + 30;
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + Math.cos(angle) * length, startY + Math.sin(angle) * length);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * Create grass texture
   */
  private createGrassTexture(): THREE.Texture {
    const canvasContext = this.createCanvasContext(512, 512);
    if (!canvasContext) return this.createFallbackTexture(0x50c878);

    const { canvas, ctx } = canvasContext;

    // Base green
    ctx.fillStyle = '#50c878';
    ctx.fillRect(0, 0, 512, 512);

    // Add grass blade patterns
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const hue = 140 + Math.random() * 20 - 10;
      const lightness = 45 + Math.random() * 20;
      ctx.fillStyle = `hsl(${hue}, 50%, ${lightness}%)`;

      // Draw blade-like shape
      ctx.fillRect(x, y, 1, Math.random() * 4 + 2);
    }

    // Add darker patches
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = Math.random() * 30 + 10;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(40, 100, 60, 0.3)');
      gradient.addColorStop(1, 'rgba(80, 200, 120, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }

  /**
   * Create spring platform texture
   */
  private createSpringTexture(): THREE.Texture {
    const canvasContext = this.createCanvasContext(512, 512);
    if (!canvasContext) return this.createFallbackTexture(0x00ff00);

    const { canvas, ctx } = canvasContext;

    // Base green
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(0, 0, 512, 512);

    // Add coil pattern
    ctx.strokeStyle = 'rgba(0, 200, 0, 0.6)';
    ctx.lineWidth = 4;
    for (let y = 0; y < 512; y += 20) {
      ctx.beginPath();
      for (let x = 0; x < 512; x += 2) {
        const wave = Math.sin(x / 20) * 10;
        ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }

    // Add metallic highlights
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(180, 255, 180, ${Math.random() * 0.4 + 0.2})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * Create falling platform texture (warning pattern)
   */
  private createFallingTexture(): THREE.Texture {
    const canvasContext = this.createCanvasContext(512, 512);
    if (!canvasContext) return this.createFallbackTexture(0xff9900);

    const { canvas, ctx } = canvasContext;

    // Base orange
    ctx.fillStyle = '#ff9900';
    ctx.fillRect(0, 0, 512, 512);

    // Add warning stripes
    ctx.fillStyle = '#ffcc00';
    for (let i = 0; i < 10; i++) {
      ctx.save();
      ctx.translate(256, 256);
      ctx.rotate((i * Math.PI) / 5);
      ctx.fillRect(-256, -30, 512, 30);
      ctx.restore();
    }

    // Add caution texture
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const brightness = Math.random() * 40 - 20;
      ctx.fillStyle = `rgba(${255 + brightness}, ${153 + brightness}, ${brightness}, 0.2)`;
      ctx.fillRect(x, y, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }

  /**
   * Create elevator platform texture
   */
  private createElevatorTexture(): THREE.Texture {
    const canvasContext = this.createCanvasContext(512, 512);
    if (!canvasContext) return this.createFallbackTexture(0x9370db);

    const { canvas, ctx } = canvasContext;

    // Base purple
    ctx.fillStyle = '#9370db';
    ctx.fillRect(0, 0, 512, 512);

    // Add directional arrows
    ctx.fillStyle = 'rgba(200, 180, 255, 0.4)';
    for (let i = 0; i < 4; i++) {
      const y = i * 128 + 64;
      ctx.beginPath();
      ctx.moveTo(256, y - 30);
      ctx.lineTo(276, y - 10);
      ctx.lineTo(266, y - 10);
      ctx.lineTo(266, y + 20);
      ctx.lineTo(246, y + 20);
      ctx.lineTo(246, y - 10);
      ctx.lineTo(236, y - 10);
      ctx.closePath();
      ctx.fill();
    }

    // Add metallic panel effect
    ctx.strokeStyle = 'rgba(180, 160, 220, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 472, 472);
    ctx.strokeRect(40, 40, 432, 432);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    return texture;
  }

  /**
   * Create moving platform texture
   */
  private createMovingTexture(): THREE.Texture {
    const canvasContext = this.createCanvasContext(512, 512);
    if (!canvasContext) return this.createFallbackTexture(0x20b2aa);

    const { canvas, ctx } = canvasContext;

    // Base teal
    ctx.fillStyle = '#20b2aa';
    ctx.fillRect(0, 0, 512, 512);

    // Add motion lines
    ctx.strokeStyle = 'rgba(100, 220, 210, 0.5)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const y = i * 64 + 32;
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(462, y);
      ctx.stroke();

      // Add arrow heads
      ctx.beginPath();
      ctx.moveTo(450, y - 8);
      ctx.lineTo(462, y);
      ctx.lineTo(450, y + 8);
      ctx.stroke();
    }

    // Add tech pattern
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const brightness = Math.random() * 40 - 20;
      ctx.fillStyle = `rgba(${32 + brightness}, ${178 + brightness}, ${170 + brightness}, 0.2)`;
      ctx.fillRect(x, y, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    return texture;
  }

  /**
   * Create default normal map
   */
  private createDefaultNormalMap(): THREE.Texture {
    const canvasContext = this.createCanvasContext(256, 256);
    if (!canvasContext) return this.createFallbackTexture(0x8080ff);

    const { canvas, ctx } = canvasContext;

    // Base normal (pointing up: 128, 128, 255)
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 256, 256);

    // Add subtle bumps
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const offset = Math.random() * 20 - 10;
      ctx.fillStyle = `rgb(${128 + offset}, ${128 + offset}, ${255})`;
      ctx.fillRect(x, y, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * Create stone normal map
   */
  private createStoneNormalMap(): THREE.Texture {
    const canvasContext = this.createCanvasContext(256, 256);
    if (!canvasContext) return this.createFallbackTexture(0x8080ff);

    const { canvas, ctx } = canvasContext;

    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 256, 256);

    // Add rocky bumps
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const offset = Math.random() * 40 - 20;
      const size = Math.random() * 4 + 1;
      ctx.fillStyle = `rgb(${128 + offset}, ${128 - offset}, ${255 - Math.abs(offset)})`;
      ctx.fillRect(x, y, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * Create ice normal map
   */
  private createIceNormalMap(): THREE.Texture {
    const canvasContext = this.createCanvasContext(256, 256);
    if (!canvasContext) return this.createFallbackTexture(0x8080ff);

    const { canvas, ctx } = canvasContext;

    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 256, 256);

    // Add crystalline facets
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const size = Math.random() * 15 + 5;

      for (let j = 0; j < 3; j++) {
        const angle = (j * Math.PI * 2) / 3;
        const offset = Math.random() * 15;
        ctx.fillStyle = `rgb(${128 + offset}, ${128 - offset}, ${240})`;
        ctx.beginPath();
        ctx.arc(x + Math.cos(angle) * size, y + Math.sin(angle) * size, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * Create grass normal map
   */
  private createGrassNormalMap(): THREE.Texture {
    const canvasContext = this.createCanvasContext(256, 256);
    if (!canvasContext) return this.createFallbackTexture(0x8080ff);

    const { canvas, ctx } = canvasContext;

    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 256, 256);

    // Add grass blade normals
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const offset = Math.random() * 25 - 12;
      ctx.fillStyle = `rgb(${128 + offset}, ${128}, ${245})`;
      ctx.fillRect(x, y, 1, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }

  /**
   * Create spring normal map (coiled effect)
   */
  private createSpringNormalMap(): THREE.Texture {
    const canvasContext = this.createCanvasContext(256, 256);
    if (!canvasContext) return this.createFallbackTexture(0x8080ff);

    const { canvas, ctx } = canvasContext;

    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 256, 256);

    // Add coil bumps
    for (let y = 0; y < 256; y += 10) {
      for (let x = 0; x < 256; x += 2) {
        const wave = Math.sin(x / 10) * 15;
        const offset = wave;
        ctx.fillStyle = `rgb(${128 + offset}, ${128 - offset}, ${245})`;
        ctx.fillRect(x, y, 2, 8);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.textureCache.forEach(texture => texture.dispose());
    this.normalMapCache.forEach(texture => texture.dispose());
    this.textureCache.clear();
    this.normalMapCache.clear();
  }
}
