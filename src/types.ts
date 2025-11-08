import * as THREE from 'three';

export interface GameConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export interface PlayerState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  isJumping: boolean;
  canDoubleJump: boolean;
  doubleJumpUsed: boolean;
  isBoosterActive: boolean;
  health: number;
  score: number;
}

export interface Controls {
  left: boolean;
  right: boolean;
  jump: boolean;
  booster: boolean;
  forward: boolean;
  backward: boolean;
}

export interface Collectible {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  collected: boolean;
  value: number;
}

export interface Platform {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  size: THREE.Vector3;
}

export type EnemyType = 'pusher' | 'spiky' | 'firebreather';

export interface Enemy {
  mesh: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  type: EnemyType;
  isActive: boolean;
  health: number;
  // Spiky-specific
  spikesOut?: boolean;
  spikeTimer?: number;
  // Fire breather-specific
  fireTimer?: number;
  // Pusher-specific
  patrolDirection?: number;
}

export interface ChickenBot {
  mesh: THREE.Group;
  position: THREE.Vector3;
  isActive: boolean;
  followPlayer: boolean;
}

export interface LevelData {
  platforms: Platform[];
  collectibles: Collectible[];
  enemies: Enemy[];
  chickenBot: ChickenBot | null;
  startPosition: THREE.Vector3;
  endPosition: THREE.Vector3;
}
