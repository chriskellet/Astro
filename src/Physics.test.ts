import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Physics } from './Physics';

describe('Physics', () => {
  const physics = new Physics();

  describe('applyGravity', () => {
    it('should apply gravity to velocity', () => {
      const velocity = new THREE.Vector3(0, 0, 0);
      physics.applyGravity(velocity, 0.016);

      expect(velocity.y).toBeLessThan(0);
    });

    it('should enforce terminal velocity', () => {
      const velocity = new THREE.Vector3(0, -100, 0);
      physics.applyGravity(velocity, 1);

      expect(velocity.y).toBeGreaterThan(-31);
    });
  });

  describe('checkSphereCollision', () => {
    it('should detect collision between two spheres', () => {
      const pos1 = new THREE.Vector3(0, 0, 0);
      const pos2 = new THREE.Vector3(1, 0, 0);

      const collision = physics.checkSphereCollision(pos1, 1, pos2, 1);
      expect(collision).toBe(true);
    });

    it('should not detect collision when spheres are far apart', () => {
      const pos1 = new THREE.Vector3(0, 0, 0);
      const pos2 = new THREE.Vector3(10, 0, 0);

      const collision = physics.checkSphereCollision(pos1, 1, pos2, 1);
      expect(collision).toBe(false);
    });
  });

  describe('checkBoundary', () => {
    it('should constrain position within boundary', () => {
      const position = new THREE.Vector3(100, 0, 100);
      physics.checkBoundary(position, 50);

      expect(position.x).toBe(50);
      expect(position.z).toBe(50);
    });

    it('should reset position when falling below death plane', () => {
      const position = new THREE.Vector3(10, -100, 10);
      physics.checkBoundary(position, 50);

      expect(position.y).toBe(10);
      expect(position.x).toBe(0);
      expect(position.z).toBe(0);
    });
  });
});
