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

export interface SkinDefinition {
  id: string;
  name: string;
  colors: {
    base: number;           // Main body color
    accent: number;         // Accent stripes/details
    secondary: number;      // Panels and secondary details
    tertiary: number;       // Additional details
    eye: number;            // Eye color
    eyeEmissive: number;    // Eye glow color
  };
  properties?: {
    metalness?: number;
    roughness?: number;
    emissiveIntensity?: number;
  };
}

export type CameraMode = 'traditional' | 'over-shoulder';

export interface Controls {
  left: boolean;
  right: boolean;
  jump: boolean;
  booster: boolean;
  forward: boolean;
  backward: boolean;
  // Analog stick values (0-1 magnitude, angle in radians)
  analogMagnitude: number;
  analogAngle: number;
  // Mouse rotation (for over-shoulder mode)
  mouseRotationDelta: number; // Horizontal rotation delta
  mousePitchDelta: number;    // Vertical pitch delta
  // Track input source for movement (to distinguish touch vs keyboard)
  isKeyboardMovement: boolean;
}

export type CollectibleType = 'orb' | 'coin' | 'ring' | 'tnt' | 'star' | 'lightsaber' | 'deathstar';

export interface Collectible {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  collected: boolean;
  value: number;
  type: CollectibleType;
}

export type PlatformType = 'static' | 'elevator' | 'moving' | 'spring' | 'falling';

export type SurfaceType = 'default' | 'ice' | 'grass' | 'stone';

export interface Platform {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  size: THREE.Vector3;
  type?: PlatformType;
  surfaceType?: SurfaceType;
  // Moving/Elevator platform properties
  moveDirection?: THREE.Vector3;
  moveSpeed?: number;
  moveRange?: number;
  moveStartPos?: THREE.Vector3;
  moveProgress?: number;
  // Spring platform properties
  springForce?: number;
  compressed?: boolean;
  compressionAmount?: number;
  // Falling platform properties
  isFalling?: boolean;
  fallTimer?: number;
  fallDelay?: number;
  originalPosition?: THREE.Vector3;
  respawnTimer?: number;
  respawnDelay?: number;
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
  patrolCenter?: THREE.Vector3;
  isChasing?: boolean;
  grounded?: boolean;
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
