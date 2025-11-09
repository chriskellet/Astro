import * as THREE from 'three';
import { Platform, Collectible, LevelData, Enemy, CollectibleType, EnemyType, SurfaceType } from './types';
import { EnemyFactory } from './EnemyFactory';

export class Level {
  private scene: THREE.Scene;
  public data: LevelData;
  private enemyFactory: EnemyFactory;
  private collectibleType: CollectibleType;

  constructor(scene: THREE.Scene, levelNumber: number = 1, collectibleType: CollectibleType = 'orb') {
    this.scene = scene;
    this.enemyFactory = new EnemyFactory(scene);
    this.collectibleType = collectibleType;
    this.data = this.createLevel(levelNumber);
  }

  private createLevel(levelNumber: number): LevelData {
    switch (levelNumber) {
      case 1:
        return this.createLevel1();
      case 2:
        return this.createLevel2();
      case 3:
        return this.createLevel3();
      case 4:
        return this.createLevel4();
      case 5:
        return this.createLevel5();
      default:
        return this.createLevel1();
    }
  }

  private getColorForSurface(surfaceType: SurfaceType): number {
    switch (surfaceType) {
      case 'ice':
        return 0xadd8e6; // Light blue - icy appearance
      case 'grass':
        return 0x50c878; // Green - grassy appearance
      case 'stone':
        return 0x808080; // Gray - stone appearance
      case 'default':
      default:
        return 0x4a90e2; // Default blue
    }
  }

  // Level 1: Tutorial - Basic platforming with surface physics, ~3 minutes
  private createLevel1(): LevelData {
    const platforms: Platform[] = [];
    const collectibles: Collectible[] = [];
    const enemies: Enemy[] = [];

    // Starting platform - grass for good grip
    platforms.push(this.createPlatform(0, 0, 0, 12, 1, 12, 0x4a90e2, 'static', 'grass'));

    // Section 1: Basic jumping with grass and stone (0-40)
    platforms.push(this.createPlatform(10, 1, 0, 8, 1, 8, 0x50c878, 'static', 'grass'));
    platforms.push(this.createPlatform(20, 2, -3, 6, 1, 6, 0x50c878, 'static', 'stone'));
    platforms.push(this.createPlatform(28, 3, 2, 7, 1, 7, 0x50c878, 'static', 'grass'));
    platforms.push(this.createPlatform(36, 4, -2, 6, 1, 6, 0x50c878, 'static', 'stone'));

    // Section 2: Ice blocks - slippery challenge! (40-80)
    platforms.push(this.createPlatform(44, 5, 3, 5, 1, 5, 0xffa500, 'static', 'ice'));
    platforms.push(this.createPlatform(50, 6, -4, 4, 1, 4, 0xffa500, 'static', 'ice'));
    platforms.push(this.createPlatform(56, 7, 2, 5, 1, 5, 0xffa500, 'static', 'ice'));
    platforms.push(this.createPlatform(63, 8, -3, 6, 1, 6, 0x50c878, 'static', 'stone'));
    platforms.push(this.createPlatform(70, 7, 4, 6, 1, 6, 0x50c878, 'static', 'grass'));
    platforms.push(this.createPlatform(78, 6, -2, 7, 1, 7, 0x50c878, 'static', 'stone'));

    // Section 3: Stone platforms - good grip (80-120)
    platforms.push(this.createPlatform(86, 5, 3, 8, 1, 8, 0x50c878, 'static', 'stone'));
    platforms.push(this.createPlatform(88, 8, 3, 2, 4, 2, 0x888888, 'static', 'stone')); // Wall
    platforms.push(this.createPlatform(95, 6, -5, 7, 1, 7, 0x50c878, 'static', 'stone'));
    platforms.push(this.createPlatform(103, 7, 2, 6, 1, 6, 0x50c878, 'static', 'stone'));
    platforms.push(this.createPlatform(110, 8, -3, 8, 1, 8, 0x50c878, 'static', 'grass'));
    platforms.push(this.createPlatform(118, 7, 4, 7, 1, 7, 0x50c878, 'static', 'grass'));

    // Section 4: Mixed surfaces - final challenge (120-150)
    platforms.push(this.createPlatform(126, 8, -2, 6, 1, 6, 0x50c878, 'static', 'ice'));
    platforms.push(this.createPlatform(133, 9, 3, 5, 1, 5, 0xffa500, 'static', 'stone'));
    platforms.push(this.createPlatform(139, 10, -1, 6, 1, 6, 0x50c878, 'static', 'grass'));

    // End platform - grass for safe landing
    platforms.push(this.createPlatform(148, 11, 2, 10, 2, 10, 0xff6b6b, 'static', 'grass'));

    // Collectibles with varied patterns
    collectibles.push(...this.createCollectiblePair(10, 3, 0, 10));
    collectibles.push(...this.createCollectibleRow(28, 5, 2, 10, 3));
    collectibles.push(this.createCollectible(50, 8, -4, 20));
    collectibles.push(...this.createCollectibleCircle(63, 10, -3, 15, 5, 1.5));
    collectibles.push(...this.createCollectiblePair(78, 8, -2, 10));
    collectibles.push(...this.createCollectibleVerticalStack(95, 8, -5, 15, 3));
    collectibles.push(...this.createCollectibleRow(110, 10, -3, 15, 4));
    collectibles.push(this.createCollectible(126, 10, -2, 10));
    collectibles.push(...this.createCollectiblePair(133, 11, 3, 20));
    collectibles.push(...this.createCollectibleCircle(139, 12, -1, 20, 6, 1.8));
    collectibles.push(this.createCollectible(148, 14, 2, 50));

    // Enemies - more varied placement with multiple per platform
    enemies.push(...this.createEnemyPair('pusher', 36, 5.5, -2));
    enemies.push(this.enemyFactory.createEnemy('spiky', 56, 8.5, 2));
    enemies.push(this.enemyFactory.createEnemy('spiky', 70, 8.5, 4));
    enemies.push(...this.createEnemyRow('firebreather', 95, 7.5, -5, 2, 3));
    enemies.push(this.enemyFactory.createEnemy('pusher', 110, 9.5, -3));
    enemies.push(this.enemyFactory.createEnemy('spiky', 118, 8.5, 4));
    enemies.push(...this.createEnemyPair('pusher', 126, 9.5, -2, 4));

    // Chicken bot near start
    const chickenBot = this.enemyFactory.createChickenBot(5, 1.5, 0);

    return {
      platforms,
      collectibles,
      enemies,
      chickenBot,
      startPosition: new THREE.Vector3(0, 7, 0),
      endPosition: new THREE.Vector3(148, 14, 2),
    };
  }

  // Level 2: Introduces elevators and moving platforms with surface physics, ~3 minutes
  private createLevel2(): LevelData {
    const platforms: Platform[] = [];
    const collectibles: Collectible[] = [];
    const enemies: Enemy[] = [];

    // Starting platform - grass
    platforms.push(this.createPlatform(0, 0, 0, 12, 1, 12, 0x4a90e2, 'static', 'grass'));

    // Section 1: Introduction to elevators (0-50)
    platforms.push(this.createPlatform(10, 2, 0, 7, 1, 7, 0x50c878, 'static', 'stone'));
    platforms.push(this.createElevatorPlatform(18, 3, -3, 7, 1, 7, 5, 0.8, 0x9370db, 'ice')); // Icy elevator!
    platforms.push(this.createPlatform(27, 8, 2, 6, 1, 6, 0x50c878, 'static', 'grass'));
    platforms.push(this.createElevatorPlatform(35, 5, -2, 7, 1, 7, 6, 1.0, 0x9370db, 'stone'));
    platforms.push(this.createPlatform(45, 11, 3, 7, 1, 7, 0x50c878, 'static', 'grass'));

    // Section 2: Moving platforms with ice (50-90)
    platforms.push(this.createMovingPlatform(55, 7, -3, 5, 1, 5, new THREE.Vector3(1, 0, 0), 8, 2, 0x20b2aa, 'ice'));
    platforms.push(this.createPlatform(65, 8, 4, 6, 1, 6, 0x50c878, 'static', 'stone'));
    platforms.push(this.createMovingPlatform(73, 9, -4, 5, 1, 5, new THREE.Vector3(0, 0, 1), 6, 2, 0x20b2aa, 'ice'));
    platforms.push(this.createPlatform(82, 10, 2, 7, 1, 7, 0x50c878, 'static', 'grass'));

    // Section 3: Combined elevators and moving (90-130)
    platforms.push(this.createElevatorPlatform(92, 9, -3, 7, 1, 7, 4, 0.9, 0x9370db, 'stone'));
    platforms.push(this.createMovingPlatform(102, 13, 3, 5, 1, 5, new THREE.Vector3(1, 0, 0), 6, 2, 0x20b2aa, 'grass'));
    platforms.push(this.createElevatorPlatform(111, 11, -2, 7, 1, 7, 5, 1.0, 0x9370db, 'grass'));
    platforms.push(this.createPlatform(122, 16, 4, 7, 1, 7, 0x50c878, 'static', 'stone'));
    platforms.push(this.createPlatform(130, 13, -3, 8, 1, 8, 0x50c878, 'static', 'ice')); // Icy landing!

    // Section 4: Challenge section with mixed surfaces (130-160)
    platforms.push(this.createMovingPlatform(140, 14, 2, 5, 1, 5, new THREE.Vector3(1, 0, 0), 10, 2, 0x20b2aa, 'ice'));
    platforms.push(this.createElevatorPlatform(152, 12, -1, 7, 1, 7, 6, 0.8, 0x9370db, 'stone'));

    // End platform - grass for safe finish
    platforms.push(this.createPlatform(164, 16, 2, 10, 2, 10, 0xff6b6b, 'static', 'grass'));

    // Collectibles with varied patterns
    collectibles.push(...this.createCollectibleVerticalStack(18, 5, -3, 10, 2));
    collectibles.push(...this.createCollectiblePair(35, 9, -2, 15));
    collectibles.push(...this.createCollectibleRow(55, 9, -3, 15, 3));
    collectibles.push(...this.createCollectibleCircle(73, 11, -4, 15, 5, 1.5));
    collectibles.push(...this.createCollectiblePair(82, 11, 2, 15));
    collectibles.push(...this.createCollectibleVerticalStack(92, 11, -3, 20, 3));
    collectibles.push(...this.createCollectibleRow(111, 15, -2, 20, 4));
    collectibles.push(...this.createCollectibleCircle(130, 15, -3, 15, 6, 2));
    collectibles.push(...this.createCollectiblePair(140, 16, 2, 25));
    collectibles.push(...this.createCollectibleRow(152, 17, -1, 25, 3));
    collectibles.push(this.createCollectible(164, 19, 2, 50));

    // Enemies - more challenging with rows and pairs
    enemies.push(this.enemyFactory.createEnemy('pusher', 27, 9.5, 2));
    enemies.push(...this.createEnemyPair('spiky', 55, 9.5, -3));
    enemies.push(this.enemyFactory.createEnemy('spiky', 65, 9.5, 4));
    enemies.push(...this.createEnemyRow('firebreather', 92, 12.5, -3, 2, 4));
    enemies.push(this.enemyFactory.createEnemy('pusher', 122, 17.5, 4));
    enemies.push(...this.createEnemyPair('pusher', 130, 14.5, -3));
    enemies.push(this.enemyFactory.createEnemy('firebreather', 152, 17.5, -1));

    const chickenBot = this.enemyFactory.createChickenBot(5, 1.5, 0);

    return {
      platforms,
      collectibles,
      enemies,
      chickenBot,
      startPosition: new THREE.Vector3(0, 7, 0),
      endPosition: new THREE.Vector3(164, 19, 2),
    };
  }

  // Level 3: Advanced elevators and moving platforms, ~3 minutes
  private createLevel3(): LevelData {
    const platforms: Platform[] = [];
    const collectibles: Collectible[] = [];
    const enemies: Enemy[] = [];

    // Starting platform
    platforms.push(this.createPlatform(0, 0, 0, 12, 1, 12, 0x4a90e2));

    // Section 1: Basic platforms leading to elevators (0-40)
    platforms.push(this.createPlatform(10, 2, 0, 7, 1, 7, 0x50c878));
    platforms.push(this.createPlatform(18, 4, -3, 6, 1, 6, 0x50c878));
    platforms.push(this.createElevatorPlatform(26, 4, 2, 6, 1, 6, 7, 0.9));
    platforms.push(this.createPlatform(35, 11, -2, 7, 1, 7, 0x50c878));

    // Section 2: Multiple elevators (40-80)
    platforms.push(this.createElevatorPlatform(44, 9, 3, 6, 1, 6, 6, 1.0));
    platforms.push(this.createMovingPlatform(53, 15, -3, 5, 1, 5, new THREE.Vector3(1, 0, 0), 7));
    platforms.push(this.createElevatorPlatform(62, 12, 2, 6, 1, 6, 8, 0.8));
    platforms.push(this.createPlatform(71, 20, -3, 7, 1, 7, 0x50c878));
    platforms.push(this.createMovingPlatform(80, 18, 2, 6, 1, 6, new THREE.Vector3(0, 0, 1), 6));

    // Section 3: Elevators and moving platforms (80-120)
    platforms.push(this.createElevatorPlatform(89, 16, -2, 7, 1, 7, 6, 1.1));
    platforms.push(this.createMovingPlatform(98, 22, 3, 6, 1, 6, new THREE.Vector3(1, 0, 0), 5));
    platforms.push(this.createElevatorPlatform(107, 19, -3, 7, 1, 7, 5, 0.9));
    platforms.push(this.createPlatform(116, 24, 2, 8, 1, 8, 0x50c878));

    // Section 4: Complex elevator section (120-160)
    platforms.push(this.createElevatorPlatform(126, 22, -2, 5, 1, 5, 7, 1.0));
    platforms.push(this.createMovingPlatform(134, 29, 3, 5, 1, 5, new THREE.Vector3(0, 0, 1), 7));
    platforms.push(this.createElevatorPlatform(142, 25, -2, 5, 1, 5, 6, 1.1));
    platforms.push(this.createPlatform(151, 31, 2, 7, 1, 7, 0x50c878));

    // End platform
    platforms.push(this.createPlatform(162, 30, 0, 10, 2, 10, 0xff6b6b));

    // Collectibles with varied patterns
    collectibles.push(...this.createCollectibleVerticalStack(26, 6, 2, 10, 3));
    collectibles.push(...this.createCollectibleCircle(44, 15, 3, 15, 6, 2));
    collectibles.push(...this.createCollectiblePair(53, 17, -3, 15));
    collectibles.push(...this.createCollectibleRow(62, 19, 2, 15, 4));
    collectibles.push(...this.createCollectiblePair(80, 20, 2, 15));
    collectibles.push(...this.createCollectibleVerticalStack(98, 20, 3, 20, 3));
    collectibles.push(...this.createCollectibleCircle(116, 26, 2, 20, 5, 1.8));
    collectibles.push(...this.createCollectibleRow(134, 30, 3, 25, 3));
    collectibles.push(...this.createCollectiblePair(142, 28, -2, 25));
    collectibles.push(...this.createCollectibleCircle(151, 33, 2, 25, 6, 2));
    collectibles.push(this.createCollectible(162, 33, 0, 50));

    // Enemies - multiple per platform, rows of shooters
    enemies.push(...this.createEnemyPair('firebreather', 35, 12.5, -2));
    enemies.push(this.enemyFactory.createEnemy('pusher', 53, 16.5, -3));
    enemies.push(...this.createEnemyPair('spiky', 71, 21.5, -3));
    enemies.push(this.enemyFactory.createEnemy('firebreather', 89, 17.5, -2));
    enemies.push(...this.createEnemyRow('firebreather', 107, 22.5, -3, 3, 2.5));
    enemies.push(this.enemyFactory.createEnemy('pusher', 126, 25.5, -2));
    enemies.push(...this.createEnemyPair('spiky', 142, 29.5, -2));
    enemies.push(this.enemyFactory.createEnemy('pusher', 151, 32.5, 2));

    const chickenBot = this.enemyFactory.createChickenBot(5, 1.5, 0);

    return {
      platforms,
      collectibles,
      enemies,
      chickenBot,
      startPosition: new THREE.Vector3(0, 7, 0),
      endPosition: new THREE.Vector3(162, 33, 0),
    };
  }

  // Level 4: Introduces springs and falling platforms, ~3 minutes
  private createLevel4(): LevelData {
    const platforms: Platform[] = [];
    const collectibles: Collectible[] = [];
    const enemies: Enemy[] = [];

    // Starting platform
    platforms.push(this.createPlatform(0, 0, 0, 12, 1, 12, 0x4a90e2));

    // Section 1: Introduction to springs (0-40)
    platforms.push(this.createPlatform(10, 2, 0, 7, 1, 7, 0x50c878));
    platforms.push(this.createSpringPlatform(18, 3, -3, 4, 1, 4, 18));
    platforms.push(this.createPlatform(18, 12, -3, 6, 1, 6, 0x50c878));
    platforms.push(this.createPlatform(26, 13, 2, 7, 1, 7, 0x50c878));
    platforms.push(this.createSpringPlatform(35, 14, -2, 4, 1, 4, 20));
    platforms.push(this.createPlatform(35, 24, -2, 6, 1, 6, 0x50c878));

    // Section 2: Falling platforms (40-80)
    platforms.push(this.createPlatform(44, 25, 3, 7, 1, 7, 0x50c878));
    platforms.push(this.createFallingPlatform(52, 26, -2, 5, 1, 5, 0.8));
    platforms.push(this.createFallingPlatform(59, 27, 3, 5, 1, 5, 0.8));
    platforms.push(this.createFallingPlatform(66, 28, -2, 5, 1, 5, 0.8));
    platforms.push(this.createPlatform(74, 29, 2, 8, 1, 8, 0x50c878));

    // Section 3: Springs and falling combined (80-120)
    platforms.push(this.createSpringPlatform(83, 30, -3, 4, 1, 4, 15));
    platforms.push(this.createFallingPlatform(83, 39, -3, 6, 1, 6, 0.6));
    platforms.push(this.createFallingPlatform(91, 40, 2, 5, 1, 5, 0.6));
    platforms.push(this.createSpringPlatform(99, 41, -2, 4, 1, 4, 18));
    platforms.push(this.createPlatform(99, 50, -2, 7, 1, 7, 0x50c878));
    platforms.push(this.createFallingPlatform(108, 51, 3, 5, 1, 5, 0.7));
    platforms.push(this.createPlatform(116, 52, -2, 8, 1, 8, 0x50c878));

    // Section 4: Challenge - rapid falling platforms (120-150)
    platforms.push(this.createFallingPlatform(125, 53, 2, 4, 1, 4, 0.5));
    platforms.push(this.createFallingPlatform(131, 54, -2, 4, 1, 4, 0.5));
    platforms.push(this.createFallingPlatform(137, 55, 2, 4, 1, 4, 0.5));
    platforms.push(this.createSpringPlatform(143, 56, -1, 5, 1, 5, 20));
    platforms.push(this.createPlatform(143, 66, -1, 8, 1, 8, 0x50c878));

    // End platform
    platforms.push(this.createPlatform(152, 67, 2, 10, 2, 10, 0xff6b6b));

    // Collectibles with varied patterns
    collectibles.push(...this.createCollectibleVerticalStack(18, 10, -3, 15, 3));
    collectibles.push(...this.createCollectibleCircle(26, 15, 2, 15, 5, 1.5));
    collectibles.push(...this.createCollectibleRow(35, 26, -2, 20, 3));
    collectibles.push(...this.createCollectiblePair(52, 28, -2, 15));
    collectibles.push(...this.createCollectibleRow(59, 29, 3, 15, 3));
    collectibles.push(...this.createCollectibleCircle(74, 31, 2, 20, 6, 2));
    collectibles.push(...this.createCollectibleVerticalStack(83, 35, -3, 20, 4));
    collectibles.push(...this.createCollectiblePair(91, 42, 2, 25));
    collectibles.push(...this.createCollectibleRow(99, 52, -2, 25, 4));
    collectibles.push(...this.createCollectibleCircle(116, 54, -2, 20, 5, 1.8));
    collectibles.push(...this.createCollectiblePair(125, 55, 2, 30));
    collectibles.push(...this.createCollectibleRow(143, 64, -1, 30, 3));
    collectibles.push(this.createCollectible(152, 70, 2, 50));

    // Enemies - challenging with multiple on platforms
    enemies.push(...this.createEnemyPair('spiky', 26, 14.5, 2));
    enemies.push(this.enemyFactory.createEnemy('pusher', 44, 26.5, 3));
    enemies.push(...this.createEnemyRow('firebreather', 74, 30.5, 2, 2, 3));
    enemies.push(...this.createEnemyPair('spiky', 83, 41.5, -3));
    enemies.push(this.enemyFactory.createEnemy('firebreather', 99, 52.5, -2));
    enemies.push(...this.createEnemyPair('pusher', 116, 53.5, -2));
    enemies.push(...this.createEnemyRow('spiky', 137, 57, 2, 3, 2));
    enemies.push(this.enemyFactory.createEnemy('firebreather', 143, 67.5, -1));

    const chickenBot = this.enemyFactory.createChickenBot(5, 1.5, 0);

    return {
      platforms,
      collectibles,
      enemies,
      chickenBot,
      startPosition: new THREE.Vector3(0, 7, 0),
      endPosition: new THREE.Vector3(152, 70, 2),
    };
  }

  // Level 5: All elements combined - final challenge, ~3 minutes
  private createLevel5(): LevelData {
    const platforms: Platform[] = [];
    const collectibles: Collectible[] = [];
    const enemies: Enemy[] = [];

    // Starting platform
    platforms.push(this.createPlatform(0, 0, 0, 12, 1, 12, 0x4a90e2));

    // Section 1: Warm-up with all elements (0-40)
    platforms.push(this.createPlatform(10, 2, 0, 7, 1, 7, 0x50c878));
    platforms.push(this.createElevatorPlatform(18, 3, -3, 7, 1, 7, 5, 1.0));
    platforms.push(this.createMovingPlatform(28, 8, 2, 6, 1, 6, new THREE.Vector3(1, 0, 0), 6));
    platforms.push(this.createElevatorPlatform(37, 7, -3, 5, 1, 5, 6, 1.1));

    // Section 2: Springs and movement (40-70)
    platforms.push(this.createSpringPlatform(46, 13, 2, 4, 1, 4, 18));
    platforms.push(this.createPlatform(46, 23, 2, 7, 1, 7, 0x50c878));
    platforms.push(this.createElevatorPlatform(55, 19, -3, 5, 1, 5, 7, 0.9));
    platforms.push(this.createPlatform(64, 26, 2, 7, 1, 7, 0x50c878));

    // Section 3: Falling platforms gauntlet (70-100)
    platforms.push(this.createPlatform(74, 24, -2, 7, 1, 7, 0x50c878));
    platforms.push(this.createFallingPlatform(82, 25, 3, 4, 1, 4, 0.6));
    platforms.push(this.createFallingPlatform(88, 26, -2, 4, 1, 4, 0.6));
    platforms.push(this.createFallingPlatform(94, 27, 3, 4, 1, 4, 0.6));
    platforms.push(this.createElevatorPlatform(100, 24, -2, 6, 1, 6, 6, 1.0));

    // Section 4: Complex combinations (100-140)
    platforms.push(this.createMovingPlatform(109, 30, 3, 5, 1, 5, new THREE.Vector3(1, 0, 0), 8));
    platforms.push(this.createElevatorPlatform(119, 28, -2, 7, 1, 7, 8, 1.0));
    platforms.push(this.createSpringPlatform(129, 36, 2, 4, 1, 4, 20));
    platforms.push(this.createFallingPlatform(129, 48, 2, 6, 1, 6, 0.7));
    platforms.push(this.createMovingPlatform(137, 47, -2, 7, 1, 7, new THREE.Vector3(0, 0, 1), 6));

    // Section 5: Final gauntlet (140-180)
    platforms.push(this.createElevatorPlatform(146, 44, 3, 5, 1, 5, 7, 1.1));
    platforms.push(this.createFallingPlatform(154, 51, -2, 4, 1, 4, 0.5));
    platforms.push(this.createMovingPlatform(160, 53, 2, 6, 1, 6, new THREE.Vector3(1, 0, 0), 7));
    platforms.push(this.createSpringPlatform(168, 54, -2, 4, 1, 4, 22));
    platforms.push(this.createPlatform(168, 68, -2, 8, 1, 8, 0x50c878));
    platforms.push(this.createElevatorPlatform(177, 62, 2, 8, 1, 8, 8, 0.9));

    // End platform
    platforms.push(this.createPlatform(189, 66, 0, 12, 2, 12, 0xff6b6b));

    // Collectibles - more valuable in final level with lots of varied patterns
    collectibles.push(...this.createCollectibleVerticalStack(18, 6, -3, 15, 3));
    collectibles.push(...this.createCollectibleCircle(28, 10, 2, 20, 6, 2));
    collectibles.push(...this.createCollectibleRow(37, 11, -3, 20, 4));
    collectibles.push(...this.createCollectiblePair(46, 25, 2, 25));
    collectibles.push(...this.createCollectibleCircle(55, 23, -3, 25, 5, 1.5));
    collectibles.push(...this.createCollectibleRow(64, 28, 2, 25, 3));
    collectibles.push(...this.createCollectibleVerticalStack(74, 26, -2, 25, 3));
    collectibles.push(...this.createCollectiblePair(88, 28, -2, 25));
    collectibles.push(...this.createCollectibleCircle(100, 28, -2, 30, 6, 2.5));
    collectibles.push(...this.createCollectibleRow(109, 32, 3, 30, 4));
    collectibles.push(...this.createCollectibleVerticalStack(119, 32, -2, 35, 4));
    collectibles.push(...this.createCollectibleCircle(129, 50, 2, 35, 8, 2));
    collectibles.push(...this.createCollectiblePair(146, 51, 3, 30));
    collectibles.push(...this.createCollectibleRow(160, 55, 2, 40, 3));
    collectibles.push(...this.createCollectibleCircle(168, 70, -2, 40, 6, 2.5));
    collectibles.push(...this.createCollectibleRow(177, 68, 2, 45, 4));
    collectibles.push(...this.createCollectibleCircle(189, 69, 0, 50, 8, 3));

    // Enemies - maximum challenge with rows and multiple per platform
    enemies.push(...this.createEnemyRow('firebreather', 28, 9.5, 2, 2, 3));
    enemies.push(...this.createEnemyPair('pusher', 46, 25.5, 2));
    enemies.push(...this.createEnemyPair('spiky', 55, 24.5, -3));
    enemies.push(...this.createEnemyRow('firebreather', 74, 26.5, -2, 3, 2.5));
    enemies.push(this.enemyFactory.createEnemy('pusher', 88, 29.5, -2));
    enemies.push(...this.createEnemyPair('spiky', 100, 27.5, -2));
    enemies.push(...this.createEnemyRow('firebreather', 119, 35.5, -2, 2, 4));
    enemies.push(...this.createEnemyPair('pusher', 129, 50.5, 2));
    enemies.push(...this.createEnemyRow('spiky', 146, 52.5, 3, 3, 2));
    enemies.push(this.enemyFactory.createEnemy('firebreather', 160, 55.5, 2));
    enemies.push(...this.createEnemyPair('pusher', 168, 70.5, -2));
    enemies.push(...this.createEnemyRow('firebreather', 177, 68.5, 2, 2, 3));

    const chickenBot = this.enemyFactory.createChickenBot(5, 1.5, 0);

    return {
      platforms,
      collectibles,
      enemies,
      chickenBot,
      startPosition: new THREE.Vector3(0, 7, 0),
      endPosition: new THREE.Vector3(189, 69, 0),
    };
  }

  private createPlatform(
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    color: number,
    platformType: import('./types').PlatformType = 'static',
    surfaceType?: SurfaceType
  ): Platform {
    const geometry = new THREE.BoxGeometry(width, height, depth);

    // If surfaceType is specified, use its color; otherwise use the provided color
    const finalColor = surfaceType ? this.getColorForSurface(surfaceType) : color;

    const material = new THREE.MeshStandardMaterial({
      color: finalColor,
      metalness: 0.2,
      roughness: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Add edge highlights
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.3, transparent: true });
    const edgeLines = new THREE.LineSegments(edges, lineMaterial);
    mesh.add(edgeLines);

    this.scene.add(mesh);

    const platform: Platform = {
      mesh,
      position: new THREE.Vector3(x, y, z),
      size: new THREE.Vector3(width, height, depth),
      type: platformType,
      surfaceType: surfaceType || 'default',
    };

    // Initialize platform-specific properties
    this.initializePlatformProperties(platform);

    return platform;
  }

  private initializePlatformProperties(platform: Platform): void {
    switch (platform.type) {
      case 'elevator':
      case 'moving':
        platform.moveSpeed = platform.moveSpeed || 2;
        platform.moveRange = platform.moveRange || 10;
        platform.moveStartPos = platform.position.clone();
        platform.moveProgress = 0;
        platform.moveDirection = platform.moveDirection || new THREE.Vector3(1, 0, 0);
        break;

      case 'spring':
        platform.springForce = 20;
        platform.compressed = false;
        platform.compressionAmount = 0;
        // Make spring platforms green
        (platform.mesh.material as THREE.MeshStandardMaterial).color.setHex(0x00ff00);
        break;

      case 'falling':
        platform.isFalling = false;
        platform.fallTimer = 0;
        platform.fallDelay = 0.5; // Wait 0.5s before falling
        platform.originalPosition = platform.position.clone();
        platform.respawnTimer = 0;
        platform.respawnDelay = 3; // Respawn after 3 seconds
        // Make falling platforms a warning color
        (platform.mesh.material as THREE.MeshStandardMaterial).color.setHex(0xff9900);
        break;
    }
  }

  // Helper methods for creating specific platform types

  private createElevatorPlatform(
    x: number, y: number, z: number,
    width: number, height: number, depth: number,
    range: number,
    speed: number = 1,
    color: number = 0x9370db,
    surfaceType?: SurfaceType
  ): Platform {
    const platform = this.createPlatform(x, y, z, width, height, depth, color, 'elevator', surfaceType);
    platform.moveDirection = new THREE.Vector3(0, 1, 0); // Move vertically
    platform.moveRange = range;
    platform.moveSpeed = speed;
    return platform;
  }

  private createMovingPlatform(
    x: number, y: number, z: number,
    width: number, height: number, depth: number,
    direction: THREE.Vector3,
    range: number,
    speed: number = 2,
    color: number = 0x20b2aa,
    surfaceType?: SurfaceType
  ): Platform {
    const platform = this.createPlatform(x, y, z, width, height, depth, color, 'moving', surfaceType);
    platform.moveDirection = direction.normalize();
    platform.moveRange = range;
    platform.moveSpeed = speed;
    return platform;
  }

  private createSpringPlatform(
    x: number, y: number, z: number,
    width: number, height: number, depth: number,
    springForce: number = 20,
    color: number = 0x00ff00,
    surfaceType?: SurfaceType
  ): Platform {
    const platform = this.createPlatform(x, y, z, width, height, depth, color, 'spring', surfaceType);
    platform.springForce = springForce;
    return platform;
  }

  private createFallingPlatform(
    x: number, y: number, z: number,
    width: number, height: number, depth: number,
    fallDelay: number = 0.5,
    color: number = 0xff9900,
    surfaceType?: SurfaceType
  ): Platform {
    const platform = this.createPlatform(x, y, z, width, height, depth, color, 'falling', surfaceType);
    platform.fallDelay = fallDelay;
    return platform;
  }

  private createCollectible(x: number, y: number, z: number, value: number): Collectible {
    let geometry: THREE.BufferGeometry;
    let material: THREE.MeshStandardMaterial;

    if (this.collectibleType === 'coin') {
      // Create a coin shape (cylinder) - rotate to stand upright
      geometry = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 32);
      material = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        emissive: 0xFFAA00,
        emissiveIntensity: 0.6,
        metalness: 1.0,
        roughness: 0.1,
      });
    } else if (this.collectibleType === 'ring') {
      // Create a ring shape (torus)
      geometry = new THREE.TorusGeometry(0.4, 0.12, 16, 32);
      material = new THREE.MeshStandardMaterial({
        color: 0xFFD700,
        emissive: 0xFFCC00,
        emissiveIntensity: 0.7,
        metalness: 1.0,
        roughness: 0.1,
      });
    } else if (this.collectibleType === 'tnt') {
      // Create a TNT block (cube with red color)
      geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      material = new THREE.MeshStandardMaterial({
        color: 0xFF0000,
        emissive: 0x8B0000,
        emissiveIntensity: 0.4,
        metalness: 0.3,
        roughness: 0.7,
      });
    } else if (this.collectibleType === 'star') {
      // Create a star shape using ExtrudeGeometry
      const starShape = new THREE.Shape();
      const outerRadius = 0.4;
      const innerRadius = 0.2;
      const points = 5;

      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / points;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) {
          starShape.moveTo(px, py);
        } else {
          starShape.lineTo(px, py);
        }
      }
      starShape.closePath();

      geometry = new THREE.ExtrudeGeometry(starShape, {
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 3,
      });
      material = new THREE.MeshStandardMaterial({
        color: 0xFFFF00,
        emissive: 0xFFDD00,
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.1,
      });
    } else if (this.collectibleType === 'lightsaber') {
      // Create a lightsaber - glowing vertical cylinder (blade)
      geometry = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 16);
      material = new THREE.MeshStandardMaterial({
        color: 0x00BFFF,
        emissive: 0x00BFFF,
        emissiveIntensity: 1.0,
        metalness: 0.3,
        roughness: 0.1,
      });
    } else if (this.collectibleType === 'deathstar') {
      // Create a Death Star - gray sphere with darker details
      geometry = new THREE.SphereGeometry(0.4, 32, 32);
      material = new THREE.MeshStandardMaterial({
        color: 0x7A7A7A,
        emissive: 0x2A2A2A,
        emissiveIntensity: 0.3,
        metalness: 0.7,
        roughness: 0.4,
      });
    } else {
      // Default orb (octahedron)
      geometry = new THREE.OctahedronGeometry(0.4);
      material = new THREE.MeshStandardMaterial({
        color: 0xffdd00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2,
      });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;

    // Rotate coins to stand upright initially
    if (this.collectibleType === 'coin') {
      mesh.rotation.x = Math.PI / 2;
    }

    this.scene.add(mesh);

    return {
      mesh,
      position: new THREE.Vector3(x, y, z),
      collected: false,
      value,
      type: this.collectibleType,
    };
  }

  // Helper methods for varied collectible/enemy patterns

  private createCollectiblePair(x: number, y: number, z: number, value: number, spacing: number = 1.5): Collectible[] {
    return [
      this.createCollectible(x - spacing / 2, y, z, value),
      this.createCollectible(x + spacing / 2, y, z, value),
    ];
  }

  private createCollectibleRow(x: number, y: number, z: number, value: number, count: number, spacing: number = 1.2): Collectible[] {
    const collectibles: Collectible[] = [];
    const startX = x - ((count - 1) * spacing) / 2;
    for (let i = 0; i < count; i++) {
      collectibles.push(this.createCollectible(startX + i * spacing, y, z, value));
    }
    return collectibles;
  }

  private createCollectibleCircle(x: number, y: number, z: number, value: number, count: number = 6, radius: number = 2): Collectible[] {
    const collectibles: Collectible[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const offsetX = Math.cos(angle) * radius;
      const offsetZ = Math.sin(angle) * radius;
      collectibles.push(this.createCollectible(x + offsetX, y, z + offsetZ, value));
    }
    return collectibles;
  }

  private createCollectibleVerticalStack(x: number, y: number, z: number, value: number, count: number, spacing: number = 1.5): Collectible[] {
    const collectibles: Collectible[] = [];
    for (let i = 0; i < count; i++) {
      collectibles.push(this.createCollectible(x, y + i * spacing, z, value));
    }
    return collectibles;
  }

  private createEnemyRow(type: EnemyType, x: number, y: number, z: number, count: number, spacing: number = 2): Enemy[] {
    const enemies: Enemy[] = [];
    const startX = x - ((count - 1) * spacing) / 2;
    for (let i = 0; i < count; i++) {
      enemies.push(this.enemyFactory.createEnemy(type, startX + i * spacing, y, z));
    }
    return enemies;
  }

  private createEnemyPair(type: EnemyType, x: number, y: number, z: number, spacing: number = 3): Enemy[] {
    return [
      this.enemyFactory.createEnemy(type, x - spacing / 2, y, z),
      this.enemyFactory.createEnemy(type, x + spacing / 2, y, z),
    ];
  }

  public update(deltaTime: number, playerPosition: THREE.Vector3, particles: any): void {
    // Update interactive platforms
    this.updatePlatforms(deltaTime);

    // Animate collectibles with type-specific animations
    this.data.collectibles.forEach((collectible) => {
      if (!collectible.collected) {
        // Type-specific rotation animations
        if (collectible.type === 'coin') {
          // Coins spin around Z axis (since we rotated them to stand upright)
          collectible.mesh.rotation.z += deltaTime * 3;
        } else if (collectible.type === 'ring') {
          // Rings spin around Y axis (perpendicular to ring plane)
          collectible.mesh.rotation.y += deltaTime * 4;
        } else if (collectible.type === 'tnt') {
          // TNT blocks rotate on multiple axes
          collectible.mesh.rotation.y += deltaTime * 2;
          collectible.mesh.rotation.x += deltaTime * 1.5;
        } else if (collectible.type === 'star') {
          // Stars rotate around Z axis (like Mario stars)
          collectible.mesh.rotation.z += deltaTime * 3;
          collectible.mesh.rotation.y += deltaTime * 2;
        } else {
          // Orbs rotate on multiple axes
          collectible.mesh.rotation.y += deltaTime * 2;
          collectible.mesh.rotation.x += deltaTime * 1;
        }

        // Bob up and down
        const bobAmount = Math.sin(Date.now() * 0.003) * 0.2;
        collectible.mesh.position.y = collectible.position.y + bobAmount;
      }
    });

    // Update enemies
    this.data.enemies.forEach((enemy) => {
      this.enemyFactory.updateEnemy(enemy, deltaTime, playerPosition, particles, this.data.platforms);
    });

    // Update chicken bot
    if (this.data.chickenBot) {
      this.enemyFactory.updateChickenBot(this.data.chickenBot, deltaTime, playerPosition);
    }
  }

  private updatePlatforms(deltaTime: number): void {
    this.data.platforms.forEach((platform) => {
      switch (platform.type) {
        case 'elevator':
        case 'moving':
          this.updateMovingPlatform(platform, deltaTime);
          break;
        case 'spring':
          this.updateSpringPlatform(platform, deltaTime);
          break;
        case 'falling':
          this.updateFallingPlatform(platform, deltaTime);
          break;
      }
    });
  }

  private updateMovingPlatform(platform: Platform, deltaTime: number): void {
    if (!platform.moveSpeed || !platform.moveDirection || !platform.moveStartPos || platform.moveRange === undefined) return;

    platform.moveProgress = (platform.moveProgress || 0) + platform.moveSpeed * deltaTime;

    // Oscillate using sine wave
    const offset = Math.sin(platform.moveProgress) * platform.moveRange;

    platform.position.copy(platform.moveStartPos);
    platform.position.x += platform.moveDirection.x * offset;
    platform.position.y += platform.moveDirection.y * offset;
    platform.position.z += platform.moveDirection.z * offset;

    platform.mesh.position.copy(platform.position);
  }

  private updateSpringPlatform(platform: Platform, deltaTime: number): void {
    if (platform.compressed) {
      platform.compressionAmount = (platform.compressionAmount || 0) + deltaTime * 10;

      if (platform.compressionAmount >= 1) {
        platform.compressed = false;
        platform.compressionAmount = 0;
      }

      // Visual feedback: compress and expand
      const scale = 1 - Math.sin(platform.compressionAmount * Math.PI) * 0.2;
      platform.mesh.scale.y = scale;
    } else {
      platform.mesh.scale.y = 1;
    }
  }

  private updateFallingPlatform(platform: Platform, deltaTime: number): void {
    if (!platform.originalPosition || platform.fallDelay === undefined) return;

    if (platform.isFalling) {
      platform.fallTimer = (platform.fallTimer || 0) + deltaTime;

      // Fall down
      platform.position.y -= deltaTime * 10;
      platform.mesh.position.y = platform.position.y;

      // Check if should respawn
      if (platform.fallTimer > (platform.respawnDelay || 3)) {
        platform.position.copy(platform.originalPosition);
        platform.mesh.position.copy(platform.originalPosition);
        platform.isFalling = false;
        platform.fallTimer = 0;
        platform.mesh.visible = true;
      } else if (platform.position.y < platform.originalPosition.y - 20) {
        platform.mesh.visible = false;
      }
    }
  }

  public checkCollectibles(playerPosition: THREE.Vector3, playerRadius: number): number {
    let scoreGained = 0;

    this.data.collectibles.forEach((collectible) => {
      if (!collectible.collected) {
        const distance = playerPosition.distanceTo(collectible.position);
        if (distance < playerRadius + 0.4) {
          collectible.collected = true;
          scoreGained += collectible.value;

          // Animate collection
          this.animateCollection(collectible.mesh);
        }
      }
    });

    return scoreGained;
  }

  private animateCollection(mesh: THREE.Mesh): void {
    const startScale = mesh.scale.clone();
    const startTime = Date.now();
    const duration = 300;
    const material = mesh.material as THREE.MeshStandardMaterial;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        mesh.scale.setScalar(startScale.x * (1 + progress));
        material.opacity = 1 - progress;
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(mesh);
      }
    };

    material.transparent = true;
    animate();
  }

  public cleanup(): void {
    this.data.platforms.forEach((platform) => {
      this.scene.remove(platform.mesh);
    });

    this.data.collectibles.forEach((collectible) => {
      this.scene.remove(collectible.mesh);
    });

    this.data.enemies.forEach((enemy) => {
      this.scene.remove(enemy.mesh);
    });

    if (this.data.chickenBot) {
      this.scene.remove(this.data.chickenBot.mesh);
    }
  }
}
