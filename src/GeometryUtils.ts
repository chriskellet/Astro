import * as THREE from 'three';

/**
 * Create a box geometry with rounded/chamfered edges
 * @param width - Width of the box
 * @param height - Height of the box
 * @param depth - Depth of the box
 * @param radius - Radius of the rounded edges (default: 0.1)
 * @param smoothness - Number of segments for the rounded edges (default: 3)
 */
export function createRoundedBoxGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number = 0.1,
  smoothness: number = 3
): THREE.BufferGeometry {
  // Clamp radius to not exceed half of the smallest dimension
  const maxRadius = Math.min(width, height, depth) / 2;
  radius = Math.min(radius, maxRadius * 0.9);

  // Create shape with rounded corners
  const shape = new THREE.Shape();

  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Start from bottom-left, going clockwise
  shape.moveTo(-halfWidth + radius, -halfHeight);
  shape.lineTo(halfWidth - radius, -halfHeight);

  // Bottom-right corner
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + radius);
  shape.lineTo(halfWidth, halfHeight - radius);

  // Top-right corner
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
  shape.lineTo(-halfWidth + radius, halfHeight);

  // Top-left corner
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - radius);
  shape.lineTo(-halfWidth, -halfHeight + radius);

  // Bottom-left corner
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + radius, -halfHeight);

  // Extrude the shape to create depth
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: radius,
    bevelSize: radius,
    bevelSegments: smoothness,
    curveSegments: smoothness * 2,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // Center the geometry
  geometry.center();

  return geometry;
}

/**
 * Create a beveled box geometry (simpler alternative with chamfered edges)
 * This is more performant than the rounded box
 */
export function createBeveledBoxGeometry(
  width: number,
  height: number,
  depth: number,
  bevel: number = 0.08
): THREE.BufferGeometry {
  // Clamp bevel
  const maxBevel = Math.min(width, height, depth) / 2;
  bevel = Math.min(bevel, maxBevel * 0.9);

  const shape = new THREE.Shape();

  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Create a rectangle
  shape.moveTo(-halfWidth, -halfHeight);
  shape.lineTo(halfWidth, -halfHeight);
  shape.lineTo(halfWidth, halfHeight);
  shape.lineTo(-halfWidth, halfHeight);
  shape.lineTo(-halfWidth, -halfHeight);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1, // Straight bevels for better performance
    curveSegments: 1,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();

  return geometry;
}

/**
 * Add UV coordinates for proper texture mapping on custom geometries
 */
export function computeUVs(geometry: THREE.BufferGeometry): void {
  geometry.computeBoundingBox();

  const bbox = geometry.boundingBox!;
  const size = new THREE.Vector3();
  bbox.getSize(size);

  const position = geometry.attributes.position;
  const uvs: number[] = [];

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);

    // Simple planar mapping
    const u = (x - bbox.min.x) / size.x;
    const v = (y - bbox.min.y) / size.y;

    uvs.push(u, v);
  }

  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
}
