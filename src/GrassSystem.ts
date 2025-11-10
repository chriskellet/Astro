import * as THREE from 'three';

/**
 * Grass tuft system for realistic grass coverage with wind animation
 * Uses GPU instancing and custom shaders for performance
 */
export class GrassSystem {
  private grassMesh: THREE.InstancedMesh | null = null;
  private readonly tuftsPerMeter = 2; // Density of grass tufts (much lower than individual blades)
  private readonly bladesPerTuft = 5; // Blades in each tuft
  private windTime: number = 0;

  /**
   * Create instanced grass tufts on a platform
   */
  public createGrassOnPlatform(
    scene: THREE.Scene,
    platformPosition: THREE.Vector3,
    platformSize: THREE.Vector3
  ): THREE.InstancedMesh {
    // Calculate number of grass tufts based on platform area
    const area = platformSize.x * platformSize.z;
    const tuftsCount = Math.floor(area * this.tuftsPerMeter);
    const instanceCount = tuftsCount * this.bladesPerTuft;

    // Create grass tuft geometry (cluster of blades)
    const bladeGeometry = this.createTuftGeometry();

    // Create grass material with wind animation shader
    const grassMaterial = this.createWindMaterial();

    // Create instanced mesh
    this.grassMesh = new THREE.InstancedMesh(
      bladeGeometry,
      grassMaterial,
      instanceCount
    );

    this.grassMesh.castShadow = true;
    this.grassMesh.receiveShadow = true;

    // Position grass tufts
    this.positionGrassTufts(platformPosition, platformSize, tuftsCount);

    scene.add(this.grassMesh);
    return this.grassMesh;
  }

  /**
   * Create wind-animated grass material
   */
  private createWindMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        windStrength: { value: 0.3 },
        windFrequency: { value: 1.5 },
      },
      vertexShader: `
        uniform float time;
        uniform float windStrength;
        uniform float windFrequency;

        varying vec3 vColor;

        void main() {
          vColor = color;

          vec3 pos = position;

          // Wind effect - more movement at the top of blades
          float windEffect = sin(time * windFrequency + instanceMatrix[3].x * 0.1 + instanceMatrix[3].z * 0.1) * windStrength;
          pos.x += windEffect * (position.y / 0.4); // Scale by height
          pos.z += cos(time * windFrequency * 0.7 + instanceMatrix[3].x * 0.15) * windStrength * 0.5 * (position.y / 0.4);

          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          gl_FragColor = vec4(vColor, 1.0);
        }
      `,
      vertexColors: true,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Create a grass tuft geometry (cluster of blades)
   */
  private createTuftGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    // Grass blade shape
    const width = 0.06;
    const height = 0.5;
    const segments = 4;
    const bladesInTuft = 5;

    const vertices: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];

    // Create multiple blades arranged in a circle
    for (let blade = 0; blade < bladesInTuft; blade++) {
      const angle = (blade / bladesInTuft) * Math.PI * 2;
      const offsetX = Math.cos(angle) * 0.08;
      const offsetZ = Math.sin(angle) * 0.08;
      const rotation = angle + (Math.random() - 0.5) * 0.5;

      // Create blade vertices (bent/curved shape)
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const y = t * height * (0.8 + Math.random() * 0.4); // Height variation

        // Curve the blade slightly
        const curve = Math.sin(t * Math.PI * 0.5) * 0.12;

        // Taper the blade (narrower at top)
        const w = width * (1 - t * 0.7);

        // Rotate and position blade within tuft
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        // Left vertex
        const lx = (-w / 2 + curve) * cos + offsetX;
        const lz = (-w / 2 + curve) * sin + offsetZ;
        vertices.push(lx, y, lz);

        // Right vertex
        const rx = (w / 2 + curve) * cos + offsetX;
        const rz = (w / 2 + curve) * sin + offsetZ;
        vertices.push(rx, y, rz);

        // Color variation (darker at base, lighter at tip)
        const baseColor = new THREE.Color(0x2d5a1e); // Dark green
        const tipColor = new THREE.Color(0x7cb342); // Light green
        const color = baseColor.lerp(tipColor, t);

        colors.push(color.r, color.g, color.b);
        colors.push(color.r, color.g, color.b);
      }

      // Create triangles for this blade
      const bladeVertexOffset = blade * (segments + 1) * 2;
      for (let i = 0; i < segments; i++) {
        const base = bladeVertexOffset + i * 2;

        // Triangle 1
        indices.push(base, base + 1, base + 2);
        // Triangle 2
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  /**
   * Position grass tufts randomly across the platform surface
   */
  private positionGrassTufts(
    platformPos: THREE.Vector3,
    platformSize: THREE.Vector3,
    tuftsCount: number
  ): void {
    if (!this.grassMesh) return;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    const platformTop = platformPos.y + platformSize.y / 2;

    // Position each tuft (all blades in a tuft share the same transform)
    for (let tuftIndex = 0; tuftIndex < tuftsCount; tuftIndex++) {
      // Random position on platform surface
      position.set(
        platformPos.x + (Math.random() - 0.5) * platformSize.x * 0.85,
        platformTop,
        platformPos.z + (Math.random() - 0.5) * platformSize.z * 0.85
      );

      // Random rotation (only Y axis for natural look)
      rotation.set(0, Math.random() * Math.PI * 2, 0);
      quaternion.setFromEuler(rotation);

      // Random scale variation (height and width)
      const scaleVariation = 0.8 + Math.random() * 0.4;
      scale.set(scaleVariation, scaleVariation, scaleVariation);

      // Build transform matrix
      matrix.compose(position, quaternion, scale);

      // Apply same transform to all blades in this tuft
      for (let blade = 0; blade < this.bladesPerTuft; blade++) {
        const instanceIndex = tuftIndex * this.bladesPerTuft + blade;
        this.grassMesh.setMatrixAt(instanceIndex, matrix);
      }
    }

    this.grassMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Animate grass (wind effect)
   */
  public updateGrass(deltaTime: number): void {
    if (!this.grassMesh) return;

    // Update wind time
    this.windTime += deltaTime;

    // Update shader uniform for wind animation
    const material = this.grassMesh.material as THREE.ShaderMaterial;
    if (material.uniforms && material.uniforms.time) {
      material.uniforms.time.value = this.windTime;
    }
  }

  /**
   * Remove grass from scene
   */
  public dispose(scene: THREE.Scene): void {
    if (this.grassMesh) {
      scene.remove(this.grassMesh);
      this.grassMesh.geometry.dispose();
      if (Array.isArray(this.grassMesh.material)) {
        this.grassMesh.material.forEach(m => m.dispose());
      } else {
        this.grassMesh.material.dispose();
      }
      this.grassMesh = null;
    }
  }
}
