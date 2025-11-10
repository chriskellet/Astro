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
  public getMaterial(surfaceType: SurfaceType | string): THREE.ShaderMaterial | THREE.MeshStandardMaterial {
    const cacheKey = `material_${surfaceType}`;

    if (this.materials.has(cacheKey)) {
      return this.materials.get(cacheKey)! as THREE.ShaderMaterial | THREE.MeshStandardMaterial;
    }

    let material: THREE.ShaderMaterial | THREE.MeshStandardMaterial;

    // Use parallax mapping for stone and default platforms
    if (surfaceType === 'stone' || surfaceType === 'default') {
      material = this.createParallaxMaterial(surfaceType);
    } else {
      material = this.createEnhancedPBRMaterial(surfaceType);
    }

    this.materials.set(cacheKey, material);
    return material;
  }

  /**
   * Create material with parallax occlusion mapping
   */
  private createParallaxMaterial(surfaceType: string): THREE.ShaderMaterial {
    const baseColor = surfaceType === 'stone' ? 0x808080 : 0x4a90e2;
    const heightMap = this.createHeightMap(surfaceType);
    const roughnessMap = this.createRoughnessMap(surfaceType);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: new THREE.Color(baseColor) },
        heightMap: { value: heightMap },
        roughnessMap: { value: roughnessMap },
        heightScale: { value: 0.08 },
        lightPosition: { value: new THREE.Vector3(10, 20, 10) },
        lightColor: { value: new THREE.Color(0xffffff) },
        ambientColor: { value: new THREE.Color(0x404040) },
      },
      vertexShader: this.getParallaxVertexShader(),
      fragmentShader: this.getParallaxFragmentShader(),
      lights: false,
    });

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

    switch (surfaceType) {
      case 'ice':
        color = 0xadd8e6;
        roughness = 0.15;
        metalness = 0.1;
        break;
      case 'grass':
        color = 0x50c878;
        roughness = 0.95;
        metalness = 0.0;
        break;
      case 'spring':
        color = 0x00ff00;
        roughness = 0.4;
        metalness = 0.6;
        break;
      case 'elevator':
        color = 0x9370db;
        roughness = 0.3;
        metalness = 0.7;
        break;
      case 'moving':
        color = 0x20b2aa;
        roughness = 0.35;
        metalness = 0.65;
        break;
      case 'falling':
        color = 0xff9900;
        roughness = 0.5;
        metalness = 0.3;
        break;
      default:
        color = 0x4a90e2;
        roughness = 0.7;
        metalness = 0.2;
    }

    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      roughnessMap,
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
   * Vertex shader for parallax occlusion mapping
   */
  private getParallaxVertexShader(): string {
    return `
      varying vec2 vUv;
      varying vec3 vViewPosition;
      varying vec3 vNormal;
      varying vec3 vTangent;
      varying vec3 vBitangent;

      void main() {
        vUv = uv * 2.0; // Repeat texture
        vNormal = normalize(normalMatrix * normal);

        // Calculate tangent space
        vec3 tangent = vec3(1.0, 0.0, 0.0);
        vec3 bitangent = cross(normal, tangent);
        vTangent = normalize(normalMatrix * tangent);
        vBitangent = normalize(normalMatrix * bitangent);

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;

        gl_Position = projectionMatrix * mvPosition;
      }
    `;
  }

  /**
   * Fragment shader for parallax occlusion mapping
   */
  private getParallaxFragmentShader(): string {
    return `
      uniform vec3 baseColor;
      uniform sampler2D heightMap;
      uniform sampler2D roughnessMap;
      uniform float heightScale;
      uniform vec3 lightPosition;
      uniform vec3 lightColor;
      uniform vec3 ambientColor;

      varying vec2 vUv;
      varying vec3 vViewPosition;
      varying vec3 vNormal;
      varying vec3 vTangent;
      varying vec3 vBitangent;

      vec2 parallaxMapping(vec2 texCoords, vec3 viewDir) {
        // Number of depth layers
        const float minLayers = 10.0;
        const float maxLayers = 32.0;
        float numLayers = mix(maxLayers, minLayers, abs(dot(vec3(0.0, 0.0, 1.0), viewDir)));

        // Calculate size of each layer
        float layerDepth = 1.0 / numLayers;
        float currentLayerDepth = 0.0;

        // Amount to shift texture coordinates per layer
        vec2 P = viewDir.xy * heightScale;
        vec2 deltaTexCoords = P / numLayers;

        vec2 currentTexCoords = texCoords;
        float currentDepthMapValue = texture2D(heightMap, currentTexCoords).r;

        // Parallax occlusion mapping
        while(currentLayerDepth < currentDepthMapValue) {
          currentTexCoords -= deltaTexCoords;
          currentDepthMapValue = texture2D(heightMap, currentTexCoords).r;
          currentLayerDepth += layerDepth;
        }

        // Get texture coordinates before collision
        vec2 prevTexCoords = currentTexCoords + deltaTexCoords;

        // Get depth after and before collision
        float afterDepth = currentDepthMapValue - currentLayerDepth;
        float beforeDepth = texture2D(heightMap, prevTexCoords).r - currentLayerDepth + layerDepth;

        // Interpolation
        float weight = afterDepth / (afterDepth - beforeDepth);
        vec2 finalTexCoords = prevTexCoords * weight + currentTexCoords * (1.0 - weight);

        return finalTexCoords;
      }

      void main() {
        // Transform view direction to tangent space
        mat3 TBN = mat3(vTangent, vBitangent, vNormal);
        vec3 viewDir = normalize(vViewPosition);
        vec3 tangentViewDir = normalize(transpose(TBN) * viewDir);

        // Apply parallax mapping
        vec2 texCoords = parallaxMapping(vUv, tangentViewDir);

        // Discard fragments outside texture bounds (prevents artifacts)
        if(texCoords.x > 2.0 || texCoords.y > 2.0 || texCoords.x < 0.0 || texCoords.y < 0.0)
          discard;

        // Sample textures with parallax-corrected coordinates
        float roughness = texture2D(roughnessMap, texCoords).r;

        // Simple lighting calculation
        vec3 lightDir = normalize(lightPosition - vViewPosition);
        float diff = max(dot(vNormal, lightDir), 0.0);

        // Specular
        vec3 reflectDir = reflect(-lightDir, vNormal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0) * (1.0 - roughness / 255.0);

        // Combine lighting
        vec3 ambient = ambientColor * baseColor;
        vec3 diffuse = diff * lightColor * baseColor;
        vec3 specular = spec * lightColor;

        vec3 finalColor = ambient + diffuse + specular;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
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
