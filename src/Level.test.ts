import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { Level } from './Level';

describe('Level', () => {
  let scene: THREE.Scene;
  let level: Level;

  beforeEach(() => {
    scene = new THREE.Scene();
    level = new Level(scene, 1);
  });

  describe('initialization', () => {
    it('should create platforms', () => {
      expect(level.data.platforms.length).toBeGreaterThan(0);
    });

    it('should create collectibles', () => {
      expect(level.data.collectibles.length).toBeGreaterThan(0);
    });

    it('should have start and end positions', () => {
      expect(level.data.startPosition).toBeDefined();
      expect(level.data.endPosition).toBeDefined();
    });
  });

  describe('checkCollectibles', () => {
    it('should detect when player collects item', () => {
      const collectible = level.data.collectibles[0];
      const playerPosition = collectible.position.clone();
      const playerRadius = 0.5;

      const score = level.checkCollectibles(playerPosition, playerRadius);

      expect(score).toBeGreaterThan(0);
      expect(collectible.collected).toBe(true);
    });

    it('should not collect items that are far away', () => {
      const playerPosition = new THREE.Vector3(1000, 1000, 1000);
      const playerRadius = 0.5;

      const score = level.checkCollectibles(playerPosition, playerRadius);

      expect(score).toBe(0);
    });

    it('should not collect already collected items', () => {
      const collectible = level.data.collectibles[0];
      collectible.collected = true;
      const playerPosition = collectible.position.clone();
      const playerRadius = 0.5;

      const score = level.checkCollectibles(playerPosition, playerRadius);

      expect(score).toBe(0);
    });
  });

  describe('update', () => {
    it('should update without errors', () => {
      const playerPos = new THREE.Vector3(0, 5, 0);
      const mockParticles = { emitFlame: () => {} };
      expect(() => level.update(0.016, playerPos, mockParticles)).not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should remove all objects from scene', () => {
      const initialChildren = scene.children.length;
      level.cleanup();

      expect(scene.children.length).toBeLessThan(initialChildren);
    });
  });
});
