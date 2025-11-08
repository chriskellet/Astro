import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { Player } from './Player';
import { Physics } from './Physics';

describe('Player', () => {
  let player: Player;
  let physics: Physics;
  let camera: THREE.PerspectiveCamera;

  beforeEach(() => {
    physics = new Physics();
    camera = new THREE.PerspectiveCamera();
    player = new Player(physics, camera);
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      expect(player.state.health).toBe(100);
      expect(player.state.score).toBe(0);
      expect(player.state.isJumping).toBe(false);
      expect(player.state.doubleJumpUsed).toBe(false);
    });

    it('should create a mesh', () => {
      expect(player.mesh).toBeDefined();
      expect(player.mesh instanceof THREE.Group).toBe(true);
    });
  });

  describe('addScore', () => {
    it('should increase score', () => {
      player.addScore(10);
      expect(player.state.score).toBe(10);

      player.addScore(20);
      expect(player.state.score).toBe(30);
    });
  });

  describe('getPosition', () => {
    it('should return a copy of position', () => {
      const pos = player.getPosition();
      pos.x = 999;

      expect(player.state.position.x).not.toBe(999);
    });
  });

  describe('getRadius', () => {
    it('should return player radius', () => {
      const radius = player.getRadius();
      expect(radius).toBeGreaterThan(0);
    });
  });
});
