import * as THREE from 'three';
import { Platform, Collectible, LevelData, Enemy, CollectibleType } from './types';
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

  private createLevel(_levelNumber: number): LevelData {
    const platforms: Platform[] = [];
    const collectibles: Collectible[] = [];
    const enemies: Enemy[] = [];

    // Future: Use levelNumber to generate different levels

    // Create ground/starting platform
    platforms.push(this.createPlatform(0, 0, 0, 10, 1, 10, 0x4a90e2));

    // Create a path of platforms
    platforms.push(this.createPlatform(8, 1, -5, 6, 1, 6, 0x50c878));
    platforms.push(this.createPlatform(15, 2, -8, 5, 1, 5, 0x50c878));
    platforms.push(this.createPlatform(20, 3, -3, 7, 1, 4, 0x50c878));
    platforms.push(this.createPlatform(25, 4, 2, 6, 1, 6, 0x50c878));
    platforms.push(this.createPlatform(30, 5, 8, 5, 1, 5, 0x50c878));

    // Add some floating platforms
    platforms.push(this.createPlatform(12, 6, 3, 3, 1, 3, 0xffa500));
    platforms.push(this.createPlatform(18, 8, -12, 3, 1, 3, 0xffa500));
    platforms.push(this.createPlatform(27, 7, -5, 4, 1, 4, 0xffa500));

    // Create walls/obstacles
    platforms.push(this.createPlatform(5, 3, -10, 2, 4, 2, 0x888888));
    platforms.push(this.createPlatform(22, 5, 8, 2, 3, 2, 0x888888));

    // End platform
    platforms.push(this.createPlatform(35, 6, 5, 8, 2, 8, 0xff6b6b));

    // Add collectibles (coins/stars)
    collectibles.push(this.createCollectible(8, 3, -5, 10));
    collectibles.push(this.createCollectible(15, 4, -8, 10));
    collectibles.push(this.createCollectible(12, 8, 3, 20));
    collectibles.push(this.createCollectible(20, 5, -3, 10));
    collectibles.push(this.createCollectible(25, 6, 2, 10));
    collectibles.push(this.createCollectible(18, 10, -12, 30));
    collectibles.push(this.createCollectible(27, 9, -5, 20));
    collectibles.push(this.createCollectible(30, 7, 8, 10));
    collectibles.push(this.createCollectible(35, 9, 5, 50));

    // Add enemies
    // Pusher bot on platform 2
    enemies.push(this.enemyFactory.createEnemy('pusher', 8, 2.5, -5));

    // Spiky bot on platform 4
    enemies.push(this.enemyFactory.createEnemy('spiky', 20, 4.5, -3));

    // Fire breather on platform 5
    enemies.push(this.enemyFactory.createEnemy('firebreather', 25, 5.5, 2));

    // Another pusher on platform 6
    enemies.push(this.enemyFactory.createEnemy('pusher', 30, 6.5, 8));

    // Create chicken bot near the start
    const chickenBot = this.enemyFactory.createChickenBot(3, 1.5, 0);

    return {
      platforms,
      collectibles,
      enemies,
      chickenBot,
      startPosition: new THREE.Vector3(0, 6, 0),
      endPosition: new THREE.Vector3(35, 10, 5),
    };
  }

  private createPlatform(
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    color: number
  ): Platform {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color,
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

    return {
      mesh,
      position: new THREE.Vector3(x, y, z),
      size: new THREE.Vector3(width, height, depth),
    };
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

  public update(deltaTime: number, playerPosition: THREE.Vector3, particles: any): void {
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
