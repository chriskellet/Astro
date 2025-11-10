import * as THREE from 'three';
import { SurfaceType } from './types';

/**
 * Advanced material manager with parallax occlusion mapping and enhanced PBR
 */
export class AdvancedMaterialManager {
  private materials: Map<string, THREE.Material> = new Map();
  private heightMaps: Map<string, THREE.Texture> = new Map();
  private roughnessMaps: Map<string, THREE.Texture> = new Map();

  /**
   * Get an advanced material for a surface type
   */
  public getMaterial(surfaceType: SurfaceType | string): THREE.MeshStandardMaterial {
    const cacheKey = `material_${surfaceType}`;

    if (this.materials.has(cacheKey)) {
      return this.materials.get(cacheKey)! as THREE.MeshStandardMaterial;
    }

    // Use enhanced PBR materials for all types (parallax shader had transparency issues)
    const material = this.createEnhancedPBRMaterial(surfaceType);

    this.materials.set(cacheKey, material);
    return material;
  }

  /**
   * Create enhanced PBR material
   */
  private createEnhancedPBRMaterial(surfaceType: string): THREE.MeshStandardMaterial {
    const roughnessMap = this.createRoughnessMap(surfaceType);

    let color: number;
    let roughness: number;
    let metalness: number;
    let displacementScale = 0;
    let bumpScale = 1;

    switch (surfaceType) {
      case 'ice':
        color = 0xadd8e6;
        roughness = 0.15;
        metalness = 0.1;
        bumpScale = 0.3;
        break;
      case 'grass':
        color = 0x50c878;
        roughness = 0.95;
        metalness = 0.0;
        bumpScale = 0.8;
        break;
      case 'stone':
        color = 0x808080;
        roughness = 0.85;
        metalness = 0.0;
        displacementScale = 0; // Disabled - causes transparency on beveled edges
        bumpScale = 2.0; // Increased bump for more depth perception
        break;
      case 'spring':
        color = 0x00ff00;
        roughness = 0.4;
        metalness = 0.6;
        bumpScale = 0.5;
        break;
      case 'elevator':
        color = 0x9370db;
        roughness = 0.3;
        metalness = 0.7;
        bumpScale = 0.4;
        break;
      case 'moving':
        color = 0x20b2aa;
        roughness = 0.35;
        metalness = 0.65;
        bumpScale = 0.4;
        break;
      case 'falling':
        color = 0xff9900;
        roughness = 0.5;
        metalness = 0.3;
        bumpScale = 0.6;
        break;
      default:
        color = 0x4a90e2;
        roughness = 0.7;
        metalness = 0.2;
        bumpScale = 0.7;
    }

    // Use height map as displacement/bump for depth
    const heightMap = (surfaceType === 'stone' || surfaceType === 'default')
      ? this.createHeightMap(surfaceType)
      : null;

    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      roughnessMap,
      bumpMap: heightMap || undefined,
      bumpScale: heightMap ? bumpScale : 0,
      displacementMap: (surfaceType === 'stone' && displacementScale > 0) ? heightMap : undefined,
      displacementScale,
      envMapIntensity: surfaceType === 'ice' ? 1.5 : 0.8,
    });
  }

  /**
   * Create height/displacement map for parallax mapping
   */
  private createHeightMap(surfaceType: string): THREE.Texture {
    const cacheKey = `height_${surfaceType}`;
    if (this.heightMaps.has(cacheKey)) {
      return this.heightMaps.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      // Fallback
      const texture = new THREE.DataTexture(new Uint8Array(4).fill(128), 1, 1);
      texture.needsUpdate = true;
      return texture;
    }

    // Create height variations based on surface type
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    if (surfaceType === 'stone') {
      // Create rocky bumps
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const radius = Math.random() * 30 + 10;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

        const height = Math.floor(Math.random() * 100 + 100);
        gradient.addColorStop(0, `rgb(${height}, ${height}, ${height})`);
        gradient.addColorStop(1, 'rgb(128, 128, 128)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add cracks (darker = deeper)
      for (let i = 0; i < 20; i++) {
        ctx.strokeStyle = `rgba(${Math.random() * 50}, ${Math.random() * 50}, ${Math.random() * 50}, 0.8)`;
        ctx.lineWidth = Math.random() * 3 + 1;
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
    } else {
      // Default - panel indentations
      for (let x = 0; x < 512; x += 128) {
        for (let y = 0; y < 512; y += 128) {
          ctx.strokeStyle = 'rgb(90, 90, 90)';
          ctx.lineWidth = 4;
          ctx.strokeRect(x + 5, y + 5, 118, 118);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);

    this.heightMaps.set(cacheKey, texture);
    return texture;
  }

  /**
   * Create roughness map for enhanced PBR
   */
  private createRoughnessMap(surfaceType: string): THREE.Texture {
    const cacheKey = `roughness_${surfaceType}`;
    if (this.roughnessMaps.has(cacheKey)) {
      return this.roughnessMaps.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      const texture = new THREE.DataTexture(new Uint8Array(4).fill(200), 1, 1);
      texture.needsUpdate = true;
      return texture;
    }

    // Base roughness value
    let baseRoughness = 180;

    switch (surfaceType) {
      case 'ice':
        baseRoughness = 50; // Very smooth
        break;
      case 'stone':
        baseRoughness = 200; // Rough
        break;
      case 'grass':
        baseRoughness = 240; // Very rough
        break;
      case 'spring':
      case 'elevator':
      case 'moving':
        baseRoughness = 100; // Metallic smooth
        break;
      default:
        baseRoughness = 180;
    }

    ctx.fillStyle = `rgb(${baseRoughness}, ${baseRoughness}, ${baseRoughness})`;
    ctx.fillRect(0, 0, 256, 256);

    // Add variation
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const variation = (Math.random() - 0.5) * 60;
      const rough = Math.max(0, Math.min(255, baseRoughness + variation));

      ctx.fillStyle = `rgb(${rough}, ${rough}, ${rough})`;
      ctx.fillRect(x, y, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);

    this.roughnessMaps.set(cacheKey, texture);
    return texture;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.materials.forEach(material => material.dispose());
    this.heightMaps.forEach(texture => texture.dispose());
    this.roughnessMaps.forEach(texture => texture.dispose());

    this.materials.clear();
    this.heightMaps.clear();
    this.roughnessMaps.clear();
  }
}
