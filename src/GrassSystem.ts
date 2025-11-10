import * as THREE from 'three';

/**
 * Instanced grass blade system for realistic grass coverage
 * Uses GPU instancing for performance
 */
export class GrassSystem {
  private grassMesh: THREE.InstancedMesh | null = null;
  private readonly bladesPerMeter = 8; // Density of grass blades

  /**
   * Create instanced grass on a platform
   */
  public createGrassOnPlatform(
    scene: THREE.Scene,
    platformPosition: THREE.Vector3,
    platformSize: THREE.Vector3
  ): THREE.InstancedMesh {
    // Calculate number of grass blades based on platform area
    const area = platformSize.x * platformSize.z;
    const instanceCount = Math.floor(area * this.bladesPerMeter);

    // Create grass blade geometry
    const bladeGeometry = this.createBladeGeometry();

    // Create grass material with vertex colors for variation
    const grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x4db35f,
      vertexColors: true,
      side: THREE.DoubleSide,
      flatShading: false,
      roughness: 0.9,
      metalness: 0.0,
    });

    // Create instanced mesh
    this.grassMesh = new THREE.InstancedMesh(
      bladeGeometry,
      grassMaterial,
      instanceCount
    );

    this.grassMesh.castShadow = true;
    this.grassMesh.receiveShadow = true;

    // Position grass blades
    this.positionGrassBlades(platformPosition, platformSize, instanceCount);

    scene.add(this.grassMesh);
    return this.grassMesh;
  }

  /**
   * Create a single grass blade geometry
   */
  private createBladeGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();

    // Grass blade shape (curved, tapering)
    const width = 0.08;
    const height = 0.4;
    const segments = 4;

    const vertices: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];

    // Create blade vertices (bent/curved shape)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = t * height;

      // Curve the blade slightly
      const curve = Math.sin(t * Math.PI * 0.5) * 0.1;

      // Taper the blade (narrower at top)
      const w = width * (1 - t * 0.7);

      // Left vertex
      vertices.push(-w / 2 + curve, y, 0);
      // Right vertex
      vertices.push(w / 2 + curve, y, 0);

      // Color variation (darker at base, lighter at tip)
      const baseColor = new THREE.Color(0x2d5a1e); // Dark green
      const tipColor = new THREE.Color(0x7cb342); // Light green
      const color = baseColor.lerp(tipColor, t);

      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
    }

    // Create triangles
    for (let i = 0; i < segments; i++) {
      const base = i * 2;

      // Triangle 1
      indices.push(base, base + 1, base + 2);
      // Triangle 2
      indices.push(base + 1, base + 3, base + 2);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  /**
   * Position grass blades randomly across the platform surface
   */
  private positionGrassBlades(
    platformPos: THREE.Vector3,
    platformSize: THREE.Vector3,
    count: number
  ): void {
    if (!this.grassMesh) return;

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    const platformTop = platformPos.y + platformSize.y / 2;

    for (let i = 0; i < count; i++) {
      // Random position on platform surface
      position.set(
        platformPos.x + (Math.random() - 0.5) * platformSize.x * 0.9,
        platformTop,
        platformPos.z + (Math.random() - 0.5) * platformSize.z * 0.9
      );

      // Random rotation (only Y axis for natural look)
      rotation.set(0, Math.random() * Math.PI * 2, 0);
      quaternion.setFromEuler(rotation);

      // Random scale variation (height and width)
      const scaleVariation = 0.7 + Math.random() * 0.6;
      scale.set(scaleVariation, scaleVariation, scaleVariation);

      // Build transform matrix
      matrix.compose(position, quaternion, scale);
      this.grassMesh.setMatrixAt(i, matrix);
    }

    this.grassMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Animate grass (wind effect)
   */
  public updateGrass(_time: number): void {
    if (!this.grassMesh) return;

    // We could add wind animation here using a vertex shader
    // For now, this is a placeholder for future wind effects
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
