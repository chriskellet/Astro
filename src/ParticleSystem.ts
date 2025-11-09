import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  size: number;
  color: THREE.Color;
  type?: 'flame' | 'smoke' | 'collect' | 'death' | 'enemyDefeated';
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private particleMeshes: THREE.Mesh[] = [];
  private maxParticles: number = 100;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public emitFlame(position: THREE.Vector3, directionOrCount?: THREE.Vector3 | number, count: number = 3): void {
    // Handle overloaded parameter
    let direction: THREE.Vector3 | undefined;
    let particleCount = count;

    if (typeof directionOrCount === 'number') {
      // Old signature: emitFlame(position, count)
      particleCount = directionOrCount;
      direction = undefined;
    } else if (directionOrCount instanceof THREE.Vector3) {
      // New signature: emitFlame(position, direction, count)
      direction = directionOrCount;
    }

    for (let i = 0; i < particleCount; i++) {
      let velocity: THREE.Vector3;

      if (direction) {
        // Fire breather - emit in direction
        const spread = 0.3;
        velocity = direction.clone().multiplyScalar(5 + Math.random() * 3);
        velocity.x += (Math.random() - 0.5) * spread;
        velocity.y += (Math.random() - 0.5) * spread;
        velocity.z += (Math.random() - 0.5) * spread;
      } else {
        // Rocket flames - emit downward
        velocity = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          -8 + Math.random() * 2,
          (Math.random() - 0.5) * 2
        );
      }

      const particle: Particle = {
        position: position.clone(),
        velocity,
        lifetime: 0,
        maxLifetime: 0.3 + Math.random() * 0.2,
        size: 0.15 + Math.random() * 0.1,
        color: new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 1, 0.5 + Math.random() * 0.3),
        type: 'flame',
      };

      this.particles.push(particle);
      this.createParticleMesh(particle);
    }

    this.cleanupExcess();
  }

  public emitSmoke(position: THREE.Vector3, count: number = 2, playerVelocity?: THREE.Vector3): void {
    for (let i = 0; i < count; i++) {
      // Create smoke that trails behind the player
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5, // Less horizontal spread
        -1 + Math.random() * 0.5,    // Slower downward velocity
        (Math.random() - 0.5) * 0.5
      );

      // If player is moving, add opposite velocity to create trailing effect
      if (playerVelocity) {
        // Smoke moves opposite to player's horizontal movement
        velocity.x -= playerVelocity.x * 0.8;
        velocity.z -= playerVelocity.z * 0.8;
        // Slightly affected by vertical movement
        velocity.y -= playerVelocity.y * 0.3;
      }

      const particle: Particle = {
        position: position.clone(),
        velocity,
        lifetime: 0,
        maxLifetime: 1.0 + Math.random() * 0.5, // Longer lifetime for trail effect
        size: 0.15 + Math.random() * 0.1,       // Slightly smaller initial size
        color: new THREE.Color(0.95, 0.95, 0.95), // Start very light (almost white)
        type: 'smoke',
      };

      this.particles.push(particle);
      this.createParticleMesh(particle);
    }

    this.cleanupExcess();
  }

  public emitCollectEffect(position: THREE.Vector3, count: number = 10): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 3 + Math.random() * 2;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        2 + Math.random() * 3,
        Math.sin(angle) * speed
      );

      const particle: Particle = {
        position: position.clone(),
        velocity,
        lifetime: 0,
        maxLifetime: 0.4 + Math.random() * 0.3,
        size: 0.1 + Math.random() * 0.05,
        color: new THREE.Color(1, 0.9, 0),
        type: 'collect',
      };

      this.particles.push(particle);
      this.createParticleMesh(particle);
    }

    this.cleanupExcess();
  }

  public emitDeathEffect(position: THREE.Vector3): void {
    for (let i = 0; i < 30; i++) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        Math.random() * 8,
        (Math.random() - 0.5) * 8
      );

      const particle: Particle = {
        position: position.clone(),
        velocity,
        lifetime: 0,
        maxLifetime: 0.6 + Math.random() * 0.4,
        size: 0.15 + Math.random() * 0.1,
        color: new THREE.Color().setHSL(0.6, 0.8, 0.5),
        type: 'death',
      };

      this.particles.push(particle);
      this.createParticleMesh(particle);
    }
  }

  public emitEnemyDefeatedEffect(position: THREE.Vector3, color: THREE.Color): void {
    for (let i = 0; i < 20; i++) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 6,
        (Math.random() - 0.5) * 6
      );

      const particle: Particle = {
        position: position.clone(),
        velocity,
        lifetime: 0,
        maxLifetime: 0.5 + Math.random() * 0.3,
        size: 0.12 + Math.random() * 0.08,
        color: color.clone(),
        type: 'enemyDefeated',
      };

      this.particles.push(particle);
      this.createParticleMesh(particle);
    }
  }

  // Check if any flame particles collide with a given position
  public checkFlameCollisions(position: THREE.Vector3, radius: number): boolean {
    for (const particle of this.particles) {
      if (particle.type === 'flame') {
        const distance = particle.position.distanceTo(position);
        if (distance < radius + particle.size) {
          return true;
        }
      }
    }
    return false;
  }

  private createParticleMesh(particle: Particle): void {
    const geometry = new THREE.SphereGeometry(particle.size, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: particle.color,
      transparent: true,
      opacity: 1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(particle.position);
    this.scene.add(mesh);
    this.particleMeshes.push(mesh);
  }

  private cleanupExcess(): void {
    while (this.particles.length > this.maxParticles) {
      const mesh = this.particleMeshes.shift();
      if (mesh) {
        this.scene.remove(mesh);
      }
      this.particles.shift();
    }
  }

  public update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      const mesh = this.particleMeshes[i];

      if (!mesh) continue;

      particle.lifetime += deltaTime;

      if (particle.lifetime >= particle.maxLifetime) {
        this.scene.remove(mesh);
        this.particles.splice(i, 1);
        this.particleMeshes.splice(i, 1);
        continue;
      }

      // Update position
      particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
      mesh.position.copy(particle.position);

      // Apply gravity to smoke and flames (less gravity for smoke)
      if (particle.type === 'smoke') {
        particle.velocity.y += -3 * deltaTime; // Gentler fall for smoke
      } else {
        particle.velocity.y += -15 * deltaTime; // Standard gravity for other particles
      }

      // Fade out
      const progress = particle.lifetime / particle.maxLifetime;
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = 1 - progress;

      // Smoke-specific effects: darken and scale up over time
      if (particle.type === 'smoke') {
        // Darken from light gray (0.95) to dark gray (0.3) as it ages
        const startBrightness = 0.95;
        const endBrightness = 0.3;
        const currentBrightness = startBrightness + (endBrightness - startBrightness) * progress;
        material.color.setRGB(currentBrightness, currentBrightness, currentBrightness);

        // Scale up smoke particles as they age (dispersing effect)
        const scale = 1 + progress * 3;
        mesh.scale.setScalar(scale);
      }
    }
  }

  public cleanup(): void {
    this.particleMeshes.forEach(mesh => this.scene.remove(mesh));
    this.particles = [];
    this.particleMeshes = [];
  }
}
